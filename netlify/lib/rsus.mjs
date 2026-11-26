/* ═══════════════════════════════════════════════════════
   THE PLAN A RESELLING.US PLAN INCLUDES (DESIGN-LAW 187)

   The owner, 2026-11-25: "so they know it's 2 products in 1 with lots of
   value", then "Build the link". Every paid Reselling.US plan includes one of
   ours: Starter (`basic`) with Side Hustle, Pro with Reseller and Automator,
   Business with Enterprise and Autopilot (reselling.us resale/plans.py STUDIO).

   How it gets here. The shop's owner presses Open WeBuy.AD on Reselling.US's
   Plan page and lands on /included.html with a token after the # (so no server
   log ever holds it). Reselling.US signed it with the secret both sites keep:
     body.signature, both base64url; the body is JSON
     { v: 1, shop, plan, name, via, until, exp, n }
   shop: their shop's number there; plan: ours; name: its name ("Starter");
   via: their plan ("Side Hustle"); until: when it holds until (ms); exp: when
   this token stops working (ms, minutes away); n: a one-time nonce.
   The person signs in HERE (their own sign-in, Google and Apple included) and
   POST /api/rsus/claim puts the plan on that account. After that we ask
   Reselling.US every RECHECK_MS which plan the shop is on now (askPlan), so a
   shop that moves up, down or leaves is followed with nobody pressing anything.

   Four rules.
   * AN EMAIL IS NEVER THE KEY. Reselling.US does not check its addresses by
     mail yet, so nobody is ever signed in here on its word: the plan goes to
     the account that signed in here, whatever its address.
   * ONE SHOP, ONE ACCOUNT. Claiming again from another account moves the plan
     (the shop index `rsus:shop:<n>`); a token is spent once (`rsn:<nonce>`).
   * A WRONG OR OLD TOKEN DOES NOTHING. Its signature is checked with Web
     Crypto's own verify (constant time), then its shape, then its clock.
   * IF RESELLING.US DOES NOT ANSWER, THE PLAN HOLDS until the `until` it last
     gave (the period paid for plus a few days), never longer.

   Env: RSUS_LINK_SECRET (the same value as RESALE_WEBUYAD_SECRET on
   Reselling.US's Render service; at least 32 characters, or this is off) and
   RSUS_URL (default https://reselling.us).
   ═══════════════════════════════════════════════════════ */
import { INCLUDED_PLANS, PLANS } from './plans.mjs';

export const RECHECK_MS = 6 * 3600e3;          // ask Reselling.US again after this long
export const ENDING_MS = 2 * 86400e3;          // and sooner, when the plan holds for less than this
export const STOP_ASKING_MS = 30 * 86400e3;    // a plan ended this long ago is not asked about again
export const ASK_TIMEOUT_MS = 3000;            // a slow answer never holds a download up
export const SIGNATURE_HEADER = 'X-WeBuyAD-Signature';

const enc = new TextEncoder();
const b64u = (b) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => { const t = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)); return Uint8Array.from(t, (c) => c.charCodeAt(0)); };

export const rsusSecret = (env) => String((env && env.RSUS_LINK_SECRET) || '').trim();
export const rsusOn = (env) => rsusSecret(env).length >= 32;
export const rsusUrl = (env) => (String((env && env.RSUS_URL) || '').trim() || 'https://reselling.us').replace(/\/+$/, '');

const hmacKey = (env, usage) => crypto.subtle.importKey('raw', enc.encode(rsusSecret(env)), { name: 'HMAC', hash: 'SHA-256' }, false, [usage]);
export async function signText(text, env) { return b64u(await crypto.subtle.sign('HMAC', await hmacKey(env, 'sign'), enc.encode(text))); }

/** A token from Reselling.US's Plan page: { data } when it is good now, else { error: 'bad' | 'expired' }. */
export async function readLinkToken(t, env, now) {
  const at = now === undefined ? Date.now() : now;
  if (!rsusOn(env) || typeof t !== 'string' || t.length > 2000 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{20,}$/.test(t)) return { error: 'bad' };
  const [body, sig] = t.split('.');
  let good = false;
  try { good = await crypto.subtle.verify('HMAC', await hmacKey(env, 'verify'), unb64u(sig), enc.encode(body)); } catch (e) { good = false; }
  if (!good) return { error: 'bad' };
  let d;
  try { d = JSON.parse(new TextDecoder().decode(unb64u(body))); } catch (e) { return { error: 'bad' }; }
  if (!d || d.v !== 1 || !Number.isInteger(d.shop) || d.shop < 1 || !INCLUDED_PLANS.includes(d.plan)
    || !Number.isFinite(d.until) || !Number.isFinite(d.exp) || typeof d.n !== 'string' || !/^[0-9a-f]{32}$/.test(d.n)) return { error: 'bad' };
  if (!(d.exp > at)) return { error: 'expired' };
  if (!(d.until > at)) return { error: 'bad' };
  return { data: { shop: d.shop, plan: d.plan, until: d.until, exp: d.exp, n: d.n,
    name: String(d.name || PLANS[d.plan].label).slice(0, 40), via: String(d.via || '').slice(0, 40) } };
}

/** the account's included plan as it starts from a claim */
export const grantFrom = (d, now) => ({ shop: d.shop, plan: d.plan, name: d.name, via: d.via, until: d.until, checkedAt: now, claimedAt: now });

/** whether to ask Reselling.US again: never asked lately, or about to run out, and not long over */
export function recheckDue(u, now) {
  const g = u && u.rsus;
  if (!g || !g.shop) return false;
  if (g.until < now - STOP_ASKING_MS) return false;
  return now - (g.checkedAt || 0) > RECHECK_MS || g.until - now < ENDING_MS;
}

/** Which plan the shop is on now, from Reselling.US: { plan, name, via, until } (plan null: none), or
 *  null when it could not be asked (off, down, slow, refused). Signed like the link: the whole body. */
export async function askPlan(shop, env, fetchImpl) {
  if (!rsusOn(env)) return null;
  const body = JSON.stringify({ shop, ts: Date.now() });
  try {
    const r = await (fetchImpl || fetch)(rsusUrl(env) + '/api/partner/webuyad/plan', {
      method: 'POST', body,
      headers: { 'Content-Type': 'application/json', [SIGNATURE_HEADER]: await signText(body, env) },
      signal: AbortSignal.timeout(ASK_TIMEOUT_MS),
    });
    if (!r.ok) { console.warn('rsus: Reselling.US answered', r.status); return null; }
    const j = await r.json();
    if (j.shop !== shop) return null;
    if (j.plan === null) return { plan: null };
    if (!INCLUDED_PLANS.includes(j.plan) || !Number.isFinite(j.until)) return null;
    return { plan: j.plan, name: String(j.name || PLANS[j.plan].label).slice(0, 40), via: String(j.via || '').slice(0, 40), until: j.until };
  } catch (e) { console.warn('rsus: Reselling.US did not answer', String((e && e.message) || e).slice(0, 120)); return null; }
}

/** An answer from askPlan onto the account; true when the account changed. A null answer (nobody
 *  asked) leaves it as it was, so the plan holds until its own `until`. */
export function applyAnswer(u, ans, now) {
  if (!u || !u.rsus || !ans) return false;
  u.rsus.checkedAt = now;
  if (ans.plan) {
    Object.assign(u.rsus, { plan: ans.plan, name: ans.name, via: ans.via, until: ans.until });
    delete u.rsus.ended;
  } else if (!u.rsus.ended) {
    u.rsus.until = Math.min(u.rsus.until, now);
    u.rsus.ended = now;
  }
  return true;
}

/** what the account menu and the page are told: nothing about the shop but its plan's name */
export const includedView = (u, now) => {
  const g = u && u.rsus;
  if (!g) return null;
  return { plan: g.plan, name: g.name, via: g.via, until: g.until, active: g.until > now && INCLUDED_PLANS.includes(g.plan) };
};
