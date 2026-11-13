/**
 * Email the account sends (2026-11-12): the link to confirm an address, the
 * link to set a new password, and the note that a password changed. Nothing
 * else: no newsletter, no marketing.
 *
 * One provider, Resend, over its HTTP API, so there is no dependency to
 * install and nothing changes in the deploy. Set in the Netlify project
 * (Project configuration → Environment variables):
 *
 *   RESEND_API_KEY   a key from resend.com → API Keys (mark it secret)
 *   MAIL_FROM        the sender, on a domain verified in Resend, e.g.
 *                    BUYBACK.AD by Reselling.US <accounts@reselling.us>
 *
 * Optional: MAIL_REPLY_TO (where a reply goes; default SUPPORT_EMAIL in
 * site.mjs), MAIL_OFF=1 (stop sending without removing the key).
 *
 * Until both are set mailState() says which is missing and nothing pretends:
 * /api/health and /api/auth/config say mail: false, the sign-in dialog sends a
 * forgotten password to support instead of offering a link, a new account is
 * not asked to confirm anything, and nothing is held back for want of a
 * confirmation (api.mjs needsConfirm).
 *
 * The same Resend key also works as SMTP (host smtp.resend.com, port 587,
 * user "resend", password the key), which is how Reselling.US sends
 * (RESALE_SMTP_*): one provider and one verified domain for both products.
 */
import { SUPPORT_EMAIL } from './site.mjs';

const ADDRESS = /^[^<>\s@]+@[^<>\s@]+\.[^<>\s@]+$/;
const on = (v) => /^(1|on|true|yes)$/i.test(String(v || '').trim());

/** What the mail settings say: on, and if not, why (names only, never a value). */
export function mailState(env) {
  const missing = [];
  if (!String(env.RESEND_API_KEY || '').trim()) missing.push('RESEND_API_KEY');
  const from = String(env.MAIL_FROM || '').trim();
  if (!from) missing.push('MAIL_FROM');
  else {
    const m = from.match(/<([^<>]+)>\s*$/);
    if (!ADDRESS.test(m ? m[1] : from)) missing.push('MAIL_FROM (not an email address)');
  }
  const off = on(env.MAIL_OFF);
  const replyTo = String(env.MAIL_REPLY_TO || SUPPORT_EMAIL).trim();
  return { on: !missing.length && !off, off, missing, from, replyTo, provider: 'resend' };
}
export const mailOn = (env) => mailState(env).on;

/** One sentence for a person: why the site cannot send email. */
export function mailOffReason(env) {
  const s = mailState(env);
  if (s.on) return '';
  if (s.off && !s.missing.length) return 'MAIL_OFF is set in the Netlify project.';
  return s.missing.join(' and ') + (s.missing.length > 1 ? ' are' : ' is') + ' not set in the Netlify project.';
}

/**
 * Sends one email. Throws (err.code 'mail_off') when mail is not set up, or
 * with Resend's own words when it refuses. `key` is an idempotency key: the
 * same key inside 24 hours sends once.
 */
export async function sendMail(env, { to, subject, text, html, key }, fetchImpl = fetch) {
  const s = mailState(env);
  if (!s.on) {
    const e = new Error('Mail is not set up: ' + mailOffReason(env));
    e.code = 'mail_off';
    throw e;
  }
  if (!ADDRESS.test(String(to || ''))) throw new Error('Not an email address');
  const headers = { Authorization: 'Bearer ' + String(env.RESEND_API_KEY).trim(), 'Content-Type': 'application/json' };
  if (key) headers['Idempotency-Key'] = String(key).slice(0, 256);
  const body = { from: s.from, to: [to], subject, text, html };
  if (s.replyTo) body.reply_to = s.replyTo;
  const r = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(10000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error('Resend answered ' + r.status + ': ' + String(j.message || j.name || 'refused').slice(0, 200));
    e.status = r.status;
    throw e;
  }
  return { id: j.id || null };
}
