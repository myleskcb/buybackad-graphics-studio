/**
 * Confirming an email and setting a new password (2026-11-12; README "No
 * email verification / password reset in this MVP — add before wide launch",
 * docs/FLOW-AUDIT-2026-11-11.md finding 5: with billing on, a paying customer
 * who forgot a password had no way back in).
 *
 *   POST /api/auth/forgot        {email}. The same answer whether or not the
 *                                address has an account; if it has, a link to
 *                                set a new password goes to it. 503 with words
 *                                when mail is not set up (mail.mjs).
 *   POST /api/auth/reset         {token, password}. Sets the new password, ends
 *                                every other sign-in of the account, confirms
 *                                the address (the link proved it) and signs in.
 *   POST /api/auth/confirm       {token}. Confirms the address. It does not sign
 *                                anybody in: a link in an inbox is not a password.
 *   POST /api/auth/confirm/send  signed in: the confirmation link again.
 *
 * The links are signed with JWT_SECRET, never stored: a reset link names the
 * account and its password version (user.pwv), so it works once and for an
 * hour; a confirmation link works for a week. Each kind is signed under its own
 * prefix, so neither can stand in for a session token or for the other.
 * Links carry the token after # (/#reset=… and /#confirm=…): a fragment is
 * never sent to a server and never travels in a Referer.
 *
 * deps: { json, getUser, putUser, makeToken(email), readToken(req),
 *         publicUser(user), hashPassword(pass) → {salt, hash},
 *         bump(key, cap) → false at the cap, later(promise), origin,
 *         ip() → the caller's address, hashed }
 */
import { mailOn, mailState, sendMail } from './mail.mjs';
import { SUPPORT_EMAIL } from './site.mjs';

const enc = new TextEncoder();
const b64u = (b) => Buffer.from(b).toString('base64url');
const unb64u = (s) => Buffer.from(String(s), 'base64url').toString('utf8');
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const RESET_TTL = 60 * 60e3;          // a reset link: one hour
export const CONFIRM_TTL = 7 * 86400e3;      // a confirmation link: a week
const FORGOT_PER_ADDRESS = 5;                // reset emails to one address a day (beyond: silent)
const FORGOT_PER_IP = 30;                    // reset requests from one address a day (beyond: 429)
const CONFIRM_SENDS = 5;                     // confirmation emails to one account a day

async function sign(env, kind, body) {
  const key = await crypto.subtle.importKey('raw', enc.encode(env.JWT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64u(new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode('link:' + kind + ':' + body))));
}
function sameString(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
/** A signed link token of one kind ('reset' or 'confirm'). */
export async function makeLink(env, kind, data, ttl, now = Date.now()) {
  // n: every link is its own, even two asked for in the same millisecond
  const body = b64u(enc.encode(JSON.stringify({ ...data, k: kind, exp: now + ttl, n: b64u(crypto.getRandomValues(new Uint8Array(6))) })));
  return body + '.' + (await sign(env, kind, body));
}
/** The token's data if it is this kind, signed here and not expired; else null. */
export async function readLink(env, kind, token, now = Date.now()) {
  const t = String(token || '');
  if (t.length > 2000 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(t)) return null;
  const [body, sig] = t.split('.');
  if (!sameString(await sign(env, kind, body), sig)) return null;
  let data;
  try { data = JSON.parse(unb64u(body)); } catch (e) { return null; }
  if (!data || data.k !== kind || !(data.exp > now) || typeof data.e !== 'string') return null;
  return data;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const SIGN_OFF = 'BUYBACK.AD Graphics Studio, by Reselling.US\nQuestions: ' + SUPPORT_EMAIL;
/** One email in two forms, from paragraphs and at most one button. */
function letter(paras, button) {
  const text = paras.map((p) => (p === button ? button.href : p)).join('\n\n') + '\n\n' + SIGN_OFF + '\n';
  const html = '<div style="font:15px/1.5 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#141414;max-width:520px">'
    + paras.map((p) => (p === button
      ? '<p><a href="' + esc(button.href) + '" style="display:inline-block;background:#2b56f5;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px">' + esc(button.label) + '</a></p>'
        + '<p style="font-size:12.5px;color:#66615a">Or paste this into your browser: ' + esc(button.href) + '</p>'
      : '<p>' + esc(p) + '</p>')).join('')
    + '<p style="font-size:12.5px;color:#66615a;border-top:1px solid #e5e1d8;padding-top:12px;margin-top:20px">BUYBACK.AD Graphics Studio, by Reselling.US<br>Questions: <a href="mailto:' + SUPPORT_EMAIL + '">' + SUPPORT_EMAIL + '</a></p></div>';
  return { text, html };
}

/** Sends the confirmation link for this account's address. */
export async function sendConfirm(user, env, origin, fetchImpl) {
  const token = await makeLink(env, 'confirm', { e: user.email }, CONFIRM_TTL);
  const button = { label: 'Confirm my email', href: origin + '/#confirm=' + token };
  const { text, html } = letter([
    'Hi,',
    'Confirm that this is the email for your BUYBACK.AD Graphics Studio account:',
    button,
    'The link works for 7 days. If you did not make an account, ignore this email and nothing happens.',
  ], button);
  return sendMail(env, { to: user.email, subject: 'Confirm your email for BUYBACK.AD', text, html }, fetchImpl);
}

async function sendReset(user, env, origin, fetchImpl) {
  const token = await makeLink(env, 'reset', { e: user.email, v: user.pwv || 0 }, RESET_TTL);
  const button = { label: 'Set a new password', href: origin + '/#reset=' + token };
  const paras = [
    'Hi,',
    'Someone asked to set a new password for ' + user.email + ' on BUYBACK.AD Graphics Studio. To set one, open this link:',
    button,
    'It works once, for one hour. If it was not you, ignore this email: your password stays as it is.',
  ];
  if (user.provider === 'google' && !user.hash) paras.splice(3, 0, 'This account signs in with Google. You can keep using the Google button, or set a password here to sign in either way.');
  const { text, html } = letter(paras, button);
  return sendMail(env, { to: user.email, subject: 'Set a new password for BUYBACK.AD', text, html }, fetchImpl);
}

async function sendChanged(user, env, origin, fetchImpl) {
  const { text, html } = letter([
    'Hi,',
    'The password for ' + user.email + ' on BUYBACK.AD Graphics Studio was just changed, and every other device was signed out.',
    'If you did this, there is nothing to do. If you did not, set a new password now at ' + origin + '/ (Sign in, then Forgot password?) and write to ' + SUPPORT_EMAIL + '.',
  ], null);
  return sendMail(env, { to: user.email, subject: 'Your BUYBACK.AD password was changed', text, html }, fetchImpl);
}

/** The answer to a forgotten password while the site cannot send email. */
export const NO_MAIL_FORGOT = 'This site cannot email a reset link yet. Write to ' + SUPPORT_EMAIL
  + ' from the address you signed up with and we will get you back in.';
const SENT = 'If an account uses that address, a link to set a new password is on its way. It works for one hour. Check spam if it is not there in a few minutes.';
const BAD_LINK = 'This link has expired or was already used. Ask for a new one with Forgot password?.';

export async function accountMailRoute(req, url, p, env, deps) {
  const routes = ['/auth/forgot', '/auth/reset', '/auth/confirm', '/auth/confirm/send'];
  if (!routes.includes(p)) return null;
  const { json } = deps;
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const body = await req.json().catch(() => ({}));
  const fetchImpl = deps.fetch;

  if (p === '/auth/forgot') {
    if (!mailOn(env)) return json({ error: NO_MAIL_FORGOT, mail: false, support: SUPPORT_EMAIL }, 503);
    const em = String(body.email || '').trim().toLowerCase();
    if (!EMAIL.test(em)) return json({ error: 'Enter a valid email address' }, 400);
    const day = new Date().toISOString().slice(0, 10);
    if (!(await deps.bump('forgot-ip:' + (await deps.ip()) + ':' + day, FORGOT_PER_IP))) {
      return json({ error: 'Too many reset requests from here today. Try again tomorrow, or write to ' + SUPPORT_EMAIL + '.' }, 429);
    }
    const user = await deps.getUser(em);
    /* the address's own day count is silent: past it the answer is the same,
       and nothing is sent, so the form cannot be used to flood an inbox */
    if (user && (await deps.bump('forgot:' + em + ':' + day, FORGOT_PER_ADDRESS))) {
      await deps.later(sendReset(user, env, deps.origin, fetchImpl).catch((e) => console.warn('reset email not sent:', e.message)));
    }
    return json({ ok: true, message: SENT });
  }

  if (p === '/auth/reset') {
    const link = await readLink(env, 'reset', body.token);
    if (!link) return json({ error: BAD_LINK, expired: true }, 400);
    const password = String(body.password || '');
    if (password.length < 8) return json({ error: 'Password needs at least 8 characters' }, 400);
    if (password.length > 200) return json({ error: 'Password is too long' }, 400);
    const user = await deps.getUser(link.e);
    if (!user || (user.pwv || 0) !== link.v) return json({ error: BAD_LINK, expired: true }, 400);
    Object.assign(user, await deps.hashPassword(password));
    user.pwv = (user.pwv || 0) + 1;            // this link, and any other sent before it, stops working
    user.tokensAfter = Date.now();             // every sign-in made before now ends (api.mjs readToken)
    if (user.emailVerified !== true) { user.emailVerified = true; user.verifiedAt = Date.now(); }
    await deps.putUser(user);
    if (mailOn(env)) await deps.later(sendChanged(user, env, deps.origin, fetchImpl).catch((e) => console.warn('password-changed email not sent:', e.message)));
    return json({ token: await deps.makeToken(user.email), user: deps.publicUser(user) });
  }

  if (p === '/auth/confirm') {
    const link = await readLink(env, 'confirm', body.token);
    if (!link) return json({ error: 'This confirmation link has expired. Sign in and send a new one from your account menu.', expired: true }, 400);
    const user = await deps.getUser(link.e);
    if (!user) return json({ error: 'There is no account for this link any more.' }, 404);
    if (user.emailVerified !== true) {
      user.emailVerified = true;
      user.verifiedAt = Date.now();
      await deps.putUser(user);
    }
    return json({ ok: true, email: user.email });
  }

  // /auth/confirm/send
  const em = await deps.readToken(req);
  if (!em) return json({ error: 'Sign in first' }, 401);
  const user = await deps.getUser(em);
  if (!user) return json({ error: 'Account not found' }, 404);
  if (user.emailVerified === true) return json({ ok: true, already: true, user: deps.publicUser(user) });
  if (!mailOn(env)) return json({ error: 'This site cannot send email yet, so there is nothing to confirm.', mail: false }, 503);
  if (!(await deps.bump('confirm:' + em + ':' + new Date().toISOString().slice(0, 10), CONFIRM_SENDS))) {
    return json({ error: 'That is ' + CONFIRM_SENDS + ' confirmation emails today. Check spam, or try again tomorrow.' }, 429);
  }
  try { await sendConfirm(user, env, deps.origin, fetchImpl); }
  catch (e) { return json({ error: 'The email could not be sent: ' + e.message }, 502); }
  return json({ ok: true, sent: true, to: user.email });
}

export { mailState };
