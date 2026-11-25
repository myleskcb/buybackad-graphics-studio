/**
 * Mail out (DESIGN-LAW 182, OPEN-ITEMS §CJ): the password reset link and the
 * email address check, sent through Postmark's email API with one server
 * token (POSTMARK_TOKEN), from support@webuy.ad and signed WeBuy.AD.
 *
 * Why Postmark: webuy.ad's mail comes in through Namecheap's free Email
 * Forwarding, which owns the domain's MX records and cannot share the domain
 * with another mail service's MX. Postmark sends with a DKIM TXT record and a
 * Return-Path CNAME on hosts of their own, so nothing about the forwarding
 * changes. It is transactional only (no newsletters on the same servers), its
 * free Developer plan is 100 emails a month and does not expire, and its API is
 * one HTTPS call with one header.
 *
 * No tracking: open tracking off and links left as they are (TrackLinks None),
 * so a reset link is the site's own address and nothing is counted.
 *
 * The tokens: 32 random bytes, sent in the link after a # (never to a server,
 * never in a Referer), kept only as their SHA-256 under `mt:<hash>` in the
 * users store, with the kind, the account and the time they stop working. The
 * account keeps the hash of its newest link of each kind, so asking again
 * retires the older link, and using one deletes it.
 */

export const FROM = 'WeBuy.AD <support@webuy.ad>';
export const REPLY_TO = 'support@webuy.ad';
export const POSTMARK_URL = 'https://api.postmarkapp.com/email';
export const RESET_MINUTES = 60;
export const CONFIRM_DAYS = 7;

export const mailOn = (env) => !!String(env.POSTMARK_TOKEN || '').trim();

const enc = new TextEncoder();
const b64u = (b) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
export const sha256 = async (s) => hex(await crypto.subtle.digest('SHA-256', enc.encode(String(s))));
export const newToken = () => b64u(crypto.getRandomValues(new Uint8Array(32)));
export const tokenShape = (t) => typeof t === 'string' && /^[A-Za-z0-9_-]{43}$/.test(t);

/* the site's own address for a link: the configured one first, never a Host
   header alone (a reset link must not point anywhere a request says) */
export const siteOf = (env, origin) => String(env.SITE_URL || env.URL || origin || 'https://webuy.ad').replace(/\/$/, '');

/** one mail through Postmark; resolves to its MessageID, throws with Postmark's words */
export async function sendMail(env, { to, subject, text, html, tag }) {
  const r = await fetch(POSTMARK_URL, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Postmark-Server-Token': String(env.POSTMARK_TOKEN || '').trim() },
    body: JSON.stringify({ From: FROM, To: to, ReplyTo: REPLY_TO, Subject: subject, TextBody: text, HtmlBody: html, Tag: tag,
      MessageStream: 'outbound', TrackOpens: false, TrackLinks: 'None' }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || (j.ErrorCode && j.ErrorCode !== 0)) {
    const e = new Error('Postmark: ' + (j.Message || 'HTTP ' + r.status) + (j.ErrorCode ? ' (error ' + j.ErrorCode + ')' : ''));
    e.status = r.status;
    throw e;
  }
  return j.MessageID || '';
}

/* ---------- the words ----------
   Plain and friendly, the way the shop owner would say it to a customer: what
   happened, the one thing to do, how long it works, what to do if it was not
   them. Signed WeBuy.AD. The HTML is the same words with the link as a button. */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function html(paras, link, button) {
  const p = (t) => '<p style="margin:0 0 16px;font:16px/1.55 -apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Arial,sans-serif;color:#1d2433">' + t + '</p>';
  const [before, after] = paras;
  return '<!doctype html><html><body style="margin:0;padding:24px;background:#f2f4f8">'
    + '<div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:14px;padding:28px 26px">'
    + before.map((t) => p(esc(t))).join('')
    + '<p style="margin:22px 0"><a href="' + esc(link) + '" style="display:inline-block;background:#0a5fe0;color:#ffffff;text-decoration:none;font:600 16px/1 -apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Arial,sans-serif;padding:14px 22px;border-radius:999px">' + esc(button) + '</a></p>'
    + p('Or copy this address into your browser:<br><span style="word-break:break-all;color:#4e5970">' + esc(link) + '</span>')
    + after.map((t) => p(esc(t))).join('')
    + p('WeBuy.AD<br><a href="https://webuy.ad" style="color:#0a5fe0">webuy.ad</a>')
    + '</div></body></html>';
}
const text = (paras, link) => [...paras[0], link, ...paras[1], 'WeBuy.AD\nhttps://webuy.ad'].join('\n\n') + '\n';

/** the password reset mail; `social` names Google or Apple when the account also signs in with one */
export function resetMail({ link, social }) {
  const paras = [
    ['Hi,', 'Someone asked to reset the password for your WeBuy.AD account, the one for this email address. To choose a new password, open this link:'],
    ['The link works once, for the next ' + RESET_MINUTES + ' minutes.'
      + (social ? ' Your account also signs in with ' + social + ', and that keeps working either way.' : ''),
    "If you didn't ask for this, you can ignore this email. Your password stays as it is.",
    'Questions? Just reply to this email.'],
  ];
  return { subject: 'Reset your WeBuy.AD password', text: text(paras, link), html: html(paras, link, 'Choose a new password'), tag: 'password-reset' };
}

/** the address check, sent when an account is made with an email and a password */
export function confirmMail({ link }) {
  const paras = [
    ['Hi,', 'Thanks for making a WeBuy.AD account. Please confirm this is your email address, so we can always help you get back in if you forget your password:'],
    ['The link works for ' + CONFIRM_DAYS + ' days. Your account already works, whether you confirm or not.',
      "If you didn't make this account, you can ignore this email.",
      'Questions? Just reply to this email.'],
  ];
  return { subject: 'Confirm your email for WeBuy.AD', text: text(paras, link), html: html(paras, link, 'Confirm my email'), tag: 'email-confirm' };
}

/* ---------- rate limits ----------
   A window per key, one record each (not one per hour), so the store does not
   grow with time: `{ t, n }`, started again once the window has passed. Keys
   carry a hash of the address or the IP, never the value itself. */
export async function windowLimit(store, key, max, ms) {
  const now = Date.now();
  let w = null;
  try { w = JSON.parse((await store.get(key)) || 'null'); } catch (e) { w = null; }
  if (!w || typeof w.t !== 'number' || now - w.t >= ms) w = { t: now, n: 0 };
  if (w.n >= max) return { ok: false, retry: Math.max(1, Math.ceil((w.t + ms - now) / 60000)) };
  w.n++;
  await store.set(key, JSON.stringify(w));
  return { ok: true };
}

/* the limits (DESIGN-LAW 182): reset links 3 an hour for an address, 10 an
   hour from an IP; confirmation links 3 an hour for an account and 10 an hour
   from an IP (sign-ups included); tries at a link 30 an hour from an IP */
export const LIMITS = {
  forgotAddress: [3, 3600e3],
  forgotIp: [10, 3600e3],
  confirmAccount: [3, 3600e3],
  confirmIp: [10, 3600e3],
  linkIp: [30, 3600e3],
};
