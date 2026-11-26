/**
 * WeBuy.AD backend — Netlify Function port of worker.js, plus the AI
 * background service. One catch-all function at /api/*.
 *
 * Provides: email+password auth (PBKDF2 + HMAC JWT), plan tracking,
 * server-enforced export limits, Stripe checkout/webhook (inert until Stripe
 * env vars are set), community backgrounds — and the AI background endpoints:
 *
 *   GET  /api/bggen/config       customer path (netlify/lib/bggen.mjs): the
 *   POST /api/generate-bg        choices, the price and the balance; one image
 *                                per call. The user's text, cleaned and kept as
 *                                their sentence, is fused with the products they
 *                                picked (sent to the model as reference photos),
 *                                the style and the colour scheme, into the house
 *                                prompt server-side; moderation, credits and
 *                                rate limits applied. The fused prompt is never
 *                                returned to the client.
 *   POST /api/admin/generate-bg  admin path. Prompt used VERBATIM; returned
 *                                with the image so it can be edited + re-run.
 *   GET|PUT /api/admin/approvals admin path. The approval page's marks:
 *                                which ads are commercial worthy, hero worthy, denied.
 *   POST /api/admin/approve-bg   admin path. Publishes an image to the blob
 *                                store under a Designer Library filename.
 *   GET  /api/bg/<filename>      public. Serves published blobs — the site's
 *                                fallback when assets/bg/<file>.jpg isn't in
 *                                the deploy yet.
 *
 *   GET  /api/library/v1/...     partner path, behind a library key: the
 *                                imagery catalogue (netlify/lib/library.mjs).
 *
 *   /api/ads/...                 the ad library: ads an account saves, and
 *                                one public link to them for a poster
 *                                (netlify/lib/adlibrary.mjs).
 *
 *   GET  /api/plans              public. The plans, the packs and what an AI
 *                                background costs in credits now.
 *   GET  /api/health             public. One probe after a deploy: accounts
 *                                (JWT_SECRET), store, ai, google and billing as
 *                                booleans, the store's verdict; never a value.
 *   /api/checkout, /checkout/confirm, /billing/change, /portal,
 *   /stripe-webhook, /admin/billing   Stripe (netlify/lib/billing.mjs).
 *
 * The plans, the AI credits and every paid model's price are one table:
 * netlify/lib/plans.mjs. A paid model call spends credits; a model with no
 * price there is not sold.
 *
 * Mail out (netlify/lib/mail.mjs, DESIGN-LAW 182): POST /api/auth/forgot,
 * /auth/reset/check, /auth/reset, /auth/confirm, /auth/confirm/send. A
 * reset link and an address check from support@webuy.ad through Postmark;
 * off until POSTMARK_TOKEN is set (the routes say so, nobody is locked out).
 *
 * Env vars: JWT_SECRET (required), POSTMARK_TOKEN (mail out), FAL_KEY and/or GEMINI_KEY (AI backgrounds:
 * fal Seedream first when FAL_KEY is set, the other the fallback), ADMIN_EMAILS
 * (comma-separated), optional: the PGFX_* and AI_MAX_PER_RUN settings listed in
 * netlify/lib/bggen.mjs, PGFX_BG_MODEL, MODEL_COSTS (JSON,
 * dollars a call, merged over plans.mjs), AI_FREE_DAILY_CREDITS (the whole
 * free tier's AI credits a day, default 100), AI_DAILY_CREDITS (everyone's,
 * default 2000), STRIPE_SECRET (switches billing on), STRIPE_WEBHOOK_SECRET
 * (optional: the webhook registers itself), PRICE_<KEY> (optional: a price
 * made by hand; PRICE_PRO is PRICE_PRO_MONTH), SITE_URL, LIBRARY_KEYS
 * (name:key pairs), LIBRARY_DAILY, ADLIB_DAILY, ADLIB_MAX_FREE, ADLIB_MAX_PRO,
 * ADLIB_MAX_BUSINESS, ADLIB_MAX_ADMIN. RL_USER_DAILY, RL_PRO_DAILY and
 * RL_GLOBAL_DAILY (the old daily AI caps) are retired: credits replace them.
 */
import { getStore } from '@netlify/blobs';
import { libraryRoute } from '../lib/library.mjs';
import { adLibraryRoute, ownerKey } from '../lib/adlibrary.mjs';
import { PLANS, PACKS, KITS, KIT_UPGRADE, KIT_ADDON_OFF, kitIncluded, PAID, planId, planOf, includedPlan, RANK, videoOk, cardsOk, logosOk, creditState, backgroundCredits, creditsFor, spendCredits, refundCredits } from '../lib/plans.mjs';
import { logoFiles, brandKitFiles, cleanKitSpec } from '../lib/logos.mjs';
import { aiNameIdeas, namesOn, NAMES_COST_KEY } from '../lib/names.mjs';
import {
  billingOn, stripeMode, stripe, priceFor, catalog, subState, applySub, applySession, customerOf, kitsOf, kitCredits, refundKit,
  syncDue, syncSub, ensureWebhook, verifyEvent, webhookSecretKey, ensurePortalConfig, portalConfigKey, TERMS_VERSION,
  ensurePaymentDomain, paymentDomainKey, STATEMENT_SUFFIX, ownSession, ownSubscription,
} from '../lib/billing.mjs';
import { bggenRoute, generateImage, loadRecipe, dataUrlOf } from '../lib/bggen.mjs';
import { verifyAppleIdToken } from '../lib/appleid.mjs';
import { rsusOn, readLinkToken, grantFrom, recheckDue, askPlan, applyAnswer, includedView } from '../lib/rsus.mjs';
import { verifyGoogleToken, googleProfileName } from '../lib/googleid.mjs';
import { mailOn, sendMail, resetMail, confirmMail, newToken, tokenShape, sha256, siteOf, windowLimit, LIMITS, RESET_MINUTES, CONFIRM_DAYS } from '../lib/mail.mjs';

export const config = { path: '/api/*' };

const enc = new TextEncoder();
const b64u = (b) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');

async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', key, enc.encode(msg));
}
async function pbkdf2(pass, salt) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 100000 }, key, 256);
  return hex(bits);
}
/* A sign-in token says whose it is, when it ends and when it was made (iat).
   A password reset signs the account out everywhere else (rule 182): a token
   made before the account's passwordAt, or one from before tokens carried an
   iat, no longer works; the reset's own token is made after it. Accounts that
   never reset have no passwordAt, and their tokens work as before. */
async function makeToken(email, env) {
  const iat = Date.now(), exp = iat + 30 * 86400000;
  const body = b64u(enc.encode(JSON.stringify({ email, exp, iat })));
  return body + '.' + b64u(await hmac(env.JWT_SECRET, body));
}
/* the account read while checking a token, kept for the rest of that request
   so the route that follows does not read it a second time */
const TOKEN_USER = new WeakMap();
async function readToken(req, env) {
  const h = req.headers.get('Authorization') || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!t || !t.includes('.')) return null;
  const [body, sig] = t.split('.');
  if (b64u(await hmac(env.JWT_SECRET, body)) !== sig) return null;
  const data = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')));
  if (!(data.exp > Date.now())) return null;
  const user = await getUser(data.email);
  if (user && user.passwordAt && !(data.iat >= user.passwordAt)) return null;
  if (user) TOKEN_USER.set(req, user);
  return data.email;
}
/* the signed-in account: the one readToken just read for this request, or a fresh read */
async function seenUser(req, em) {
  const u = TOKEN_USER.get(req);
  return u && u.email === em ? u : getUser(em);
}
const isoWeek = () => { const d = new Date(); const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return t.getUTCFullYear() + '-W' + String(Math.ceil((((t - y) / 86400000) + 1) / 7)).padStart(2, '0'); };
const isoMonth = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
const isoDay = () => new Date().toISOString().slice(0, 10);

/* the publishable key when it can mount the on-site payment form: present
   and of the same mode (test or live) as the secret; otherwise '' */
const formKey = (env) => {
  const pk = String(env.STRIPE_PUBLISHABLE_KEY || '').trim();
  return /^pk_(test|live)_/.test(pk) && pk.startsWith('pk_test_') === (stripeMode(env) === 'test') ? pk : '';
};

/* The owner is an operator on every deploy, whether or not the Netlify
   project carries ADMIN_EMAILS (owner, 2026-11-03: "auto give me the admin
   myleskcb@gmail.com free pro access"). ADMIN_EMAILS adds to it. */
const OWNER_EMAILS = ['myleskcb@gmail.com'];
const adminEmails = (env) => [...OWNER_EMAILS, ...String(env.ADMIN_EMAILS || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean)];
const roleFor = (email, env) => (adminEmails(env).includes(email) ? 'admin' : 'user');
/* An operator (ADMIN_EMAILS) has every feature of every plan whatever plan it
   is billed on: no download cap, watermark or size limit (/export), video,
   AI not charged (bggen.mjs), the biggest library (adlibrary.mjs). `plan` stays
   the billed one, so checkout can still be tried; credits say unlimited. */
/* An address is confirmed once its owner opened a link mailed to it (a
   confirmation or a reset), or Google or Apple vouched for it at sign-in.
   askConfirm: the account menu's gentle note, only when mail can be sent and
   the account has a password (rule 182). Nobody is locked out either way. */
const confirmedOf = (u) => !!(u.confirmed || u.provider === 'google' || u.provider === 'apple' || u.appleSub);
const publicUser = (u, env) => ({
  email: u.email, plan: planOf(u), billed: planId(u.plan), included: includedView(u, Date.now()), exports: u.exports, videos: u.videos || { period: '', count: 0 }, role: roleFor(u.email, env),
  credits: roleFor(u.email, env) === 'admin' ? { ...creditState(u), unlimited: true } : creditState(u),
  sub: u.sub && u.sub.id ? { plan: u.sub.plan, interval: u.sub.interval, status: u.sub.status, periodEnd: u.sub.periodEnd, cancelAt: u.sub.cancelAt } : null,
  confirmed: confirmedOf(u), askConfirm: mailOn(env) && !confirmedOf(u) && !!u.hash,
});
/* the download meter of an account's plan: this period's count, its cap */
function exportMeter(user) {
  const plan = PLANS[planOf(user)];
  const cap = plan.weekly ?? plan.monthly;
  const period = plan.weekly ? isoWeek() : isoMonth();
  if (!user.exports || user.exports.period !== period) user.exports = { period, count: 0 };
  return { plan, cap, period, per: plan.weekly ? 'week' : 'month', remaining: cap === null ? null : Math.max(0, cap - user.exports.count) };
}
/* the video meter, apart from the photos (plans.mjs `videos`, 2026-11-18): a
   calendar month's video downloads; null is unlimited (Business) */
function videoMeter(user) {
  const plan = PLANS[planOf(user)];
  const cap = plan.videos === undefined ? null : plan.videos;
  const period = isoMonth();
  if (!user.videos || user.videos.period !== period) user.videos = { period, count: 0 };
  return { plan, cap, period, per: 'month', remaining: cap === null ? null : Math.max(0, cap - user.videos.count) };
}
/* a paid account whose period ran out is read from Stripe again (billing.mjs) */
async function freshUser(user, env) {
  let changed = billingOn(env) && syncDue(user) && (await syncSub(user, env));
  /* the plan a Reselling.US plan includes: asked again every few hours, and sooner when it is about
     to run out; an answer that does not come leaves it holding until its own date (rsus.mjs) */
  const now = Date.now();
  if (rsusOn(env) && recheckDue(user, now) && applyAnswer(user, await askPlan(user.rsus.shop, env), now)) changed = true;
  if (changed) await putUser(user);
  return user;
}

const json = (data, status) => new Response(JSON.stringify(data), {
  status: status || 200,
  headers: { 'Content-Type': 'application/json' },
});

// ---------- stores ----------
// users store MUST be strongly consistent — signup is immediately followed by
// authenticated reads, and Blobs' default eventual consistency serves stale
// nulls ("Account not found" right after signup).
const users = () => getStore({ name: 'pgfx-users', consistency: 'strong' });
const bgStore = () => getStore('pgfx-backgrounds'); // published backgrounds: read-heavy, eventual is fine
// generated pictures (bggen.mjs): written once, read back at once by the studio
const genStore = () => getStore({ name: 'pgfx-generated', consistency: 'strong' });
// saved ads: a save is read back at once (the library, its public link)
const adStore = () => getStore({ name: 'pgfx-ad-library', consistency: 'strong' });
// the owner's approvals (approve.html): read back at once on another device
const approvalStore = () => getStore({ name: 'pgfx-approvals', consistency: 'strong' });

async function getUser(em) { return JSON.parse((await users().get('u:' + em)) || 'null'); }
async function putUser(u) { await users().set('u:' + u.email, JSON.stringify(u)); }

// ---------- AI backgrounds ----------
// The customer generator (the recipe, the entities, the credits) and the image
// providers live in netlify/lib/bggen.mjs; the prompt text never leaves it.

// ---------- rate limits (daily, blob counters) ----------
async function bumpCounter(key, cap) {
  const store = users();
  const n = parseInt((await store.get(key)) || '0', 10);
  if (cap !== null && n >= cap) return false;
  await store.set(key, String(n + 1));
  return true;
}

async function bumpBy(key, n, cap) {
  const store = users();
  const have = parseInt((await store.get(key)) || '0', 10);
  if (have + n > cap) return false;
  await store.set(key, String(have + n));
  return true;
}

// ---------- mail out: the reset link and the address check (netlify/lib/mail.mjs, rule 182) ----------
/* the caller's IP, for the rate limits only (kept as a hash, never stored as is) */
const ipOf = (req, context) => String((context && context.ip) || req.headers.get('x-nf-client-connection-ip')
  || (req.headers.get('x-forwarded-for') || '').split(',')[0] || 'unknown').trim();
const limited = async (key, [max, ms]) => windowLimit(users(), key, max, ms);
const LINK_FIELD = { reset: 'resetLink', confirm: 'confirmLink' };
/* A new link of one kind for an account: the older one of that kind stops
   working, the new one is kept only as its hash, then mailed. */
async function mailLink(user, kind, env, origin) {
  const token = newToken(), h = await sha256(token), field = LINK_FIELD[kind], store = users();
  const exp = Date.now() + (kind === 'reset' ? RESET_MINUTES * 60e3 : CONFIRM_DAYS * 86400e3);
  await store.set('mt:' + h, JSON.stringify({ kind, email: user.email, exp }));
  /* the account as it is now (this can run after the reply, beside the next request) */
  const cur = (await getUser(user.email)) || user;
  if (cur[field]) await store.delete('mt:' + cur[field]).catch(() => {});
  cur[field] = user[field] = h;
  await putUser(cur);
  const link = siteOf(env, origin) + (kind === 'reset' ? '/reset.html' : '/confirm.html') + '#t=' + token;
  const social = user.provider === 'google' || user.provider === 'apple' ? (user.provider === 'google' ? 'Google' : 'Apple') : user.appleSub ? 'Apple' : '';
  const m = kind === 'reset' ? resetMail({ link, social }) : confirmMail({ link });
  return sendMail(env, { to: user.email, ...m });
}
/* The link a page sends back: what it is for and whose, or why it does not
   work. Only the account's newest link of its kind works, once. */
async function readLink(token, kind) {
  if (!tokenShape(token)) return { error: 'bad' };
  const h = await sha256(token), store = users();
  const rec = JSON.parse((await store.get('mt:' + h)) || 'null');
  if (!rec || rec.kind !== kind) return { error: 'used' };
  const user = await getUser(rec.email);
  if (!user || user[LINK_FIELD[kind]] !== h) { await store.delete('mt:' + h).catch(() => {}); return { error: 'used' }; }
  if (!(rec.exp > Date.now())) return { error: 'expired' };
  return { h, user };
}
async function spendLink(user, kind) {
  const field = LINK_FIELD[kind];
  if (user[field]) await users().delete('mt:' + user[field]).catch(() => {});
  user[field] = null;
}
const LINK_SAYS = {
  reset: { bad: 'This link is not complete. Open it from the email again, or ask for a new one.',
    used: 'This link has already been used, or a newer one was sent. Ask for a new one.',
    expired: 'This link has expired: a reset link works for ' + RESET_MINUTES + ' minutes. Ask for a new one.' },
  confirm: { bad: 'This link is not complete. Open it from the email again.',
    used: 'This link has already been used, or a newer one was sent. Sign in and send a new one from your account menu.',
    expired: 'This link has expired: a confirmation link works for ' + CONFIRM_DAYS + ' days. Sign in and send a new one from your account menu.' },
};
const MAIL_OFF = "Email from WeBuy.AD isn't switched on yet. Write to support@webuy.ad and we'll get you back in.";

const BG_FILE_RE = /^dl_[a-z]+_[A-Za-z]+_[a-z]+\.jpg$/; // Designer Library names only

export default async (req, context) => {
  const env = process.env;
  const url = new URL(req.url);
  const p = url.pathname.replace(/^\/api/, '').replace(/\/$/, '') || '/';
  if (req.method === 'OPTIONS') return json({});
  try {
    /* the partner library: its own key, not a signed-in user, so it answers
       before the account checks. The day's count fails open: a storage
       hiccup never locks the partner out. */
    const lib = await libraryRoute(req, url, p, env, {
      fetchJson: async (u) => { const r = await fetch(u, { headers: { Accept: 'application/json' } }); if (!r.ok) throw new Error(u.replace(url.origin, '') + ' ' + r.status); return r.json(); },
      count: async (partner) => {
        try { return await bumpCounter('lib:' + partner + ':' + isoDay(), parseInt(env.LIBRARY_DAILY || '20000', 10)); }
        catch (e) { console.warn('library: the day count failed, letting it through', e); return true; }
      },
    });
    if (lib) return lib;
    /* the ad library: its public link answers without an account, so it
       comes before the JWT check too; its own routes ask for a sign-in */
    const ads = await adLibraryRoute(req, url, p, env, {
      store: adStore(),
      accountsReady: !!env.JWT_SECRET,
      whoami: (r) => readToken(r, env),
      account: async (em) => { const u = await getUser(em); return u ? { plan: planOf(u), role: roleFor(em, env) } : null; },
      count: async (owner) => {
        try { return await bumpCounter('adlib:' + owner + ':' + isoDay(), parseInt(env.ADLIB_DAILY || '100', 10)); }
        catch (e) { console.warn('ad library: the day count failed, letting it through', e); return true; }
      },
    });
    if (ads) return ads;
    /* what the plans page shows, from the table that is enforced */
    if (p === '/plans') {
      /* billingMode and embedded say, without a secret, whether checkout is
         test or live and whether its form opens inside the site (the deploy
         check in .github/workflows/deploy.yml reads them) */
      return json({ plans: PLANS, packs: PACKS, kits: KITS, ai: { background: backgroundCredits(env), names: namesOn(env) ? creditsFor(NAMES_COST_KEY, env) : null }, billing: billingOn(env),
        billingMode: billingOn(env) ? stripeMode(env) : null, embedded: billingOn(env) && !!formKey(env) });
    }
    /* One probe for a deploy (SETUP.md; the workflow's "What went live"):
       the function runs with its dependency (anything but 502 says so),
       accounts are switched on (JWT_SECRET), and the users store answers.
       Booleans and a store verdict only, never a value. billing is the
       same test the plans page and checkout use (STRIPE_SECRET alone). */
    if (p === '/health') {
      let store = 'ok';
      try { await users().get('u:health@probe.invalid'); } catch (e) { store = 'error: ' + String((e && e.message) || e).slice(0, 160); }
      return json({ ok: store === 'ok' && !!env.JWT_SECRET, accounts: !!env.JWT_SECRET, store, ai: !!(env.GEMINI_KEY || env.FAL_KEY), google: !!env.GOOGLE_CLIENT_ID, billing: billingOn(env), mail: mailOn(env) });
    }
    if (!env.JWT_SECRET) return json({ error: 'Backend not configured (JWT_SECRET missing)' }, 500);

    /* AI backgrounds, the customer generator: its choices and price, a run of
       images charged in the plans' credits (plans.mjs), the pictures, and the
       operator's recipe (netlify/lib/bggen.mjs) */
    const bg = await bggenRoute(req, url, p, env, {
      json,
      readToken: (r) => readToken(r, env),
      getUser, putUser,
      freshUser: (u) => freshUser(u, env),
      isAdmin: (em) => roleFor(em, env) === 'admin',
      bumpBy,
      bg: bgStore(),
      gen: genStore(),
      fetchJson: async (u) => { const r = await fetch(u, { headers: { Accept: 'application/json' } }); if (!r.ok) throw new Error(u.replace(url.origin, '') + ' ' + r.status); return r.json(); },
    });
    if (bg) return bg;

    if (p === '/auth/signup' && req.method === 'POST') {
      const { email, password } = await req.json();
      const em = String(email || '').trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return json({ error: 'Invalid email' }, 400);
      if (!password || password.length < 8) return json({ error: 'Password needs at least 8 characters' }, 400);
      if (await getUser(em)) return json({ error: 'An account with that email already exists' }, 409);
      const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
      const user = { email: em, salt, hash: await pbkdf2(password, salt), plan: 'free', exports: { period: '', count: 0 }, created: Date.now(), confirmed: null };
      await putUser(user);
      /* the address check (rule 182): a link to confirm it, mailed after the
         reply; the account works now whether or not it is ever confirmed.
         Ten a hour from one IP, so sign-ups cannot be used to mail strangers. */
      let confirmSent = false;
      if (mailOn(env) && (await limited('rl:ci:' + (await sha256(ipOf(req, context))), LIMITS.confirmIp)).ok) {
        const work = mailLink(user, 'confirm', env, url.origin).catch((e) => console.error('signup: the confirmation mail', e.message));
        if (context && typeof context.waitUntil === 'function') context.waitUntil(work); else await work;
        confirmSent = true;
      }
      return json({ token: await makeToken(em, env), user: publicUser(user, env), confirmSent });
    }

    if (p === '/auth/login' && req.method === 'POST') {
      const { email, password } = await req.json();
      const em = String(email || '').trim().toLowerCase();
      const user = await getUser(em);
      if (!user) return json({ error: 'Wrong email or password' }, 401);
      if (user.provider === 'google' && !user.hash) return json({ error: 'This account uses Google sign-in. Use the Google button.' }, 401);
      if (user.provider === 'apple' && !user.hash) return json({ error: 'This account uses Sign in with Apple. Use the Apple button.' }, 401);
      if (user.hash !== await pbkdf2(password || '', user.salt)) return json({ error: 'Wrong email or password' }, 401);
      return json({ token: await makeToken(em, env), user: publicUser(user, env) });
    }

    /* FORGOT PASSWORD (rule 182). One reply for every address, whether or
       not it has an account: the lookup and the mail happen after the reply
       (context.waitUntil), so neither the words nor the time say which. The
       limits count every request, account or not: 3 an hour for an address,
       10 an hour from an IP. An account that signs in with Google or Apple
       gets a link too, and can add a password with it. */
    if (p === '/auth/forgot' && req.method === 'POST') {
      const { email } = await req.json().catch(() => ({}));
      const em = String(email || '').trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return json({ error: 'Enter a valid email address' }, 400);
      if (!mailOn(env)) return json({ error: MAIL_OFF }, 503);
      for (const [key, lim] of [['rl:fi:' + (await sha256(ipOf(req, context))), LIMITS.forgotIp], ['rl:fa:' + (await sha256(em)), LIMITS.forgotAddress]]) {
        const r = await limited(key, lim);
        if (!r.ok) return json({ error: 'Too many reset requests. Try again in ' + r.retry + ' minute' + (r.retry === 1 ? '' : 's') + '.', retry: r.retry }, 429);
      }
      const work = (async () => {
        const user = await getUser(em);
        if (user) await mailLink(user, 'reset', env, url.origin);
      })().catch((e) => console.error('forgot: the reset mail', e.message));
      if (context && typeof context.waitUntil === 'function') context.waitUntil(work); else await work;
      return json({ ok: true });
    }

    /* the reset page: is this link good (and for which address), then the new password */
    if ((p === '/auth/reset/check' || p === '/auth/reset') && req.method === 'POST') {
      const { token, password } = await req.json().catch(() => ({}));
      const lim = await limited('rl:li:' + (await sha256(ipOf(req, context))), LIMITS.linkIp);
      if (!lim.ok) return json({ error: 'Too many tries. Try again in ' + lim.retry + ' minutes.' }, 429);
      const got = await readLink(token, 'reset');
      if (got.error) return json({ error: LINK_SAYS.reset[got.error], link: got.error }, 400);
      if (p === '/auth/reset/check') return json({ ok: true, email: got.user.email });
      if (!password || String(password).length < 8) return json({ error: 'Password needs at least 8 characters' }, 400);
      const user = got.user;
      user.salt = hex(crypto.getRandomValues(new Uint8Array(16)));
      user.hash = await pbkdf2(String(password), user.salt);
      user.passwordAt = Date.now();
      await spendLink(user, 'reset');
      /* the link came to this inbox, so the address is confirmed too */
      if (!user.confirmed) { user.confirmed = Date.now(); await spendLink(user, 'confirm'); }
      await putUser(user);
      return json({ token: await makeToken(user.email, env), user: publicUser(user, env) });
    }

    /* the address check: the link from the sign-up mail, no sign-in needed */
    if (p === '/auth/confirm' && req.method === 'POST') {
      const { token } = await req.json().catch(() => ({}));
      const lim = await limited('rl:li:' + (await sha256(ipOf(req, context))), LIMITS.linkIp);
      if (!lim.ok) return json({ error: 'Too many tries. Try again in ' + lim.retry + ' minutes.' }, 429);
      const got = await readLink(token, 'confirm');
      if (got.error) return json({ error: LINK_SAYS.confirm[got.error], link: got.error }, 400);
      got.user.confirmed = got.user.confirmed || Date.now();
      await spendLink(got.user, 'confirm');
      await putUser(got.user);
      return json({ ok: true, email: got.user.email });
    }

    /* the account menu's "Send the link again": the signed-in account only,
       3 an hour for it and 10 an hour from an IP */
    if (p === '/auth/confirm/send' && req.method === 'POST') {
      const em = await readToken(req, env);
      if (!em) return json({ error: 'Sign in first' }, 401);
      const user = await seenUser(req, em);
      if (!user) return json({ error: 'Account not found' }, 404);
      if (confirmedOf(user)) return json({ ok: true, already: true, user: publicUser(user, env) });
      if (!mailOn(env)) return json({ error: MAIL_OFF }, 503);
      for (const [key, lim] of [['rl:ci:' + (await sha256(ipOf(req, context))), LIMITS.confirmIp], ['rl:ca:' + (await sha256(em)), LIMITS.confirmAccount]]) {
        const r = await limited(key, lim);
        if (!r.ok) return json({ error: 'That is a lot of links. Try again in ' + r.retry + ' minute' + (r.retry === 1 ? '' : 's') + '.', retry: r.retry }, 429);
      }
      try { await mailLink(user, 'confirm', env, url.origin); }
      catch (e) { console.error('confirm: the mail', e.message); return json({ error: 'The email did not go out. Try again in a minute.' }, 502); }
      return json({ ok: true, sent: true, user: publicUser(user, env) });
    }

    // Which auth methods the frontend should render. Google appears only when
    // GOOGLE_CLIENT_ID is configured in the Netlify env; Apple only when
    // APPLE_CLIENT_ID (the web Services ID) is.
    if (p === '/auth/config') {
      return json({ google: !!env.GOOGLE_CLIENT_ID, googleClientId: env.GOOGLE_CLIENT_ID || '',
        apple: !!env.APPLE_CLIENT_ID, appleClientId: env.APPLE_CLIENT_ID || '', mail: mailOn(env) });
    }

    // Sign in with Apple (2026-11-19, the owner: "apple and google sign in ?"). The
    // browser, or the iPhone app, sends Apple's identity token; netlify/lib/appleid.mjs
    // checks it against Apple's published keys: signature, issuer, audience (the web
    // Services ID APPLE_CLIENT_ID, or the app's bundle ID APPLE_BUNDLE_ID), expiry, a
    // verified email and the page's nonce. Then find-or-create the account by email, as
    // Google's does, and issue our own token. Apple sends the name only on the first
    // sign-in, so it is kept then. No password is stored for these accounts.
    if (p === '/auth/apple' && req.method === 'POST') {
      const audiences = [env.APPLE_CLIENT_ID, env.APPLE_BUNDLE_ID].filter(Boolean);
      if (!audiences.length) return json({ error: 'Sign in with Apple is not enabled' }, 503);
      const { id_token: idToken, name, nonce } = await req.json().catch(() => ({}));
      let who;
      try { who = await verifyAppleIdToken(idToken, { audiences, nonce: String(nonce || '') }); }
      catch (e) { return json({ error: e.message }, 401); }
      let user = await getUser(who.email);
      if (!user) {
        user = { email: who.email, provider: 'apple', appleSub: who.sub, plan: 'free', exports: { period: '', count: 0 },
          created: Date.now(), name: String(name || '').trim().slice(0, 80) };
        await putUser(user);
      } else if (!user.appleSub) {
        user.appleSub = who.sub;
        await putUser(user);
      }
      return json({ token: await makeToken(who.email, env), user: publicUser(user, env) });
    }

    // Google Sign-In: the site's own button opens Google's popup through Google's
    // token client, and the page sends the access token (or, from a page still open
    // from before, the ID token Google's own button gave). lib/googleid.mjs asks
    // Google's tokeninfo whom it was issued to (this site's client ID only) and for a
    // confirmed email; then find-or-create the account and issue our own JWT. No
    // password stored for these users.
    if (p === '/auth/google' && req.method === 'POST') {
      if (!env.GOOGLE_CLIENT_ID) return json({ error: 'Google sign-in is not enabled' }, 503);
      const { credential, access_token: accessToken } = await req.json().catch(() => ({}));
      if (!credential && !accessToken) return json({ error: 'Missing credential' }, 400);
      let who;
      try { who = await verifyGoogleToken({ credential, accessToken }, { clientId: env.GOOGLE_CLIENT_ID }); }
      catch (e) { return json({ error: e.message }, 401); }
      let user = await getUser(who.email);
      if (!user) {
        const name = who.name || (accessToken ? await googleProfileName(accessToken) : '');
        user = { email: who.email, provider: 'google', plan: 'free', exports: { period: '', count: 0 }, created: Date.now(), name };
        await putUser(user);
      } else if (!user.confirmed) {
        user.confirmed = Date.now();   // Google confirmed this address (googleid.mjs asks for a confirmed email)
        await putUser(user);
      }
      return json({ token: await makeToken(who.email, env), user: publicUser(user, env) });
    }

    if (p === '/me') {
      const em = await readToken(req, env);
      if (!em) return json({ error: 'Not signed in' }, 401);
      const user = await seenUser(req, em);
      if (!user) return json({ error: 'Account not found' }, 404);
      return json({ user: publicUser(await freshUser(user, env), env) });
    }

    /* The plan a Reselling.US plan includes, switched on for the signed-in account (rsus.mjs,
       DESIGN-LAW 187). POST { t }: the token from /included.html's address. Spent once; the shop's
       plan moves to this account from any other; the account it is on is the one signed in here. */
    if (p === '/rsus/claim' && req.method === 'POST') {
      if (!rsusOn(env)) return json({ error: "Reselling.US isn't connected to WeBuy.AD yet. Write to support@webuy.ad and we'll switch your plan on." }, 503);
      const em = await readToken(req, env);
      if (!em) return json({ error: 'Sign in first', signIn: true }, 401);
      if (!(await limited('rl:rsus:' + (await sha256(ipOf(req, context))), [20, 3600e3])).ok) return json({ error: 'Too many tries. Wait a little and try again.' }, 429);
      const user = await seenUser(req, em);
      if (!user) return json({ error: 'Account not found' }, 404);
      const { t } = await req.json().catch(() => ({}));
      const now = Date.now();
      const got = await readLinkToken(t, env, now);
      if (got.error) return json({ error: got.error === 'expired'
        ? 'This link has expired: it works for a few minutes. Go back to Reselling.US and press Open WeBuy.AD again.'
        : "This link isn't complete or isn't from Reselling.US. Go back to Reselling.US and press Open WeBuy.AD again.", why: got.error }, 400);
      const d = got.data, store = users();
      if (await store.get('rsn:' + d.n)) return json({ error: 'This link has already been used. Go back to Reselling.US and press Open WeBuy.AD again.', why: 'used' }, 409);
      await store.set('rsn:' + d.n, String(d.exp));
      /* one shop, one account: from whichever account had it before */
      const before = await store.get('rsus:shop:' + d.shop);
      if (before && before !== em) {
        const prev = await getUser(before);
        if (prev && prev.rsus && prev.rsus.shop === d.shop) { prev.rsus = null; await putUser(prev); }
      }
      if (user.rsus && user.rsus.shop && user.rsus.shop !== d.shop && (await store.get('rsus:shop:' + user.rsus.shop)) === em) await store.delete('rsus:shop:' + user.rsus.shop);
      user.rsus = grantFrom(d, now);
      await putUser(user);
      await store.set('rsus:shop:' + d.shop, em);
      return json({ ok: true, moved: !!(before && before !== em), user: publicUser(user, env) });
    }

    /* Delete my account (2026-11-19, for the WeBuy.AD iPhone app: App Store
       guideline 5.1.1(v) asks an app that makes accounts to let them be
       deleted inside it; the website gets the same). POST {confirm:'delete'}.
       A paid subscription is cancelled at Stripe first, so nothing is charged
       again, and the account stays if that fails; then the saved ads (their
       pictures, videos, upload parts and public link), the AI pictures, and
       the account go. Stripe keeps its own payment records (receipts, tax),
       as the privacy policy says. A token issued before stops working,
       because every route reads the account it names. */
    if (p === '/account/delete' && req.method === 'POST') {
      const em = await readToken(req, env);
      if (!em) return json({ error: 'Sign in first' }, 401);
      const user = await seenUser(req, em);
      if (!user) return json({ error: 'Account not found' }, 404);
      const { confirm } = await req.json().catch(() => ({}));
      if (confirm !== 'delete') return json({ error: 'Type delete to confirm' }, 400);
      const sub = user.sub;
      if (billingOn(env) && sub && sub.id && !['canceled', 'incomplete_expired', 'gone'].includes(sub.status)) {
        try { await stripe(env, 'DELETE', '/subscriptions/' + sub.id); }
        catch (e) {
          if (e.status !== 404) return json({ error: 'Your subscription could not be cancelled, so the account was kept. Try again, or cancel it in Plan & billing first.' }, 502);
        }
      }
      try {
        const store = adStore(), owner = await ownerKey(em);
        const lib = JSON.parse((await store.get('o:' + owner)) || 'null');
        if (lib && lib.feed) await store.delete('f:' + lib.feed);
        for (const pre of ['i:', 'v:', 'vp:', 'vu:']) {
          const { blobs } = await store.list({ prefix: pre + owner + ':' });
          for (const b of blobs) await store.delete(b.key);
        }
        await store.delete('o:' + owner);
      } catch (e) { console.warn('account delete: the saved ads', e.message); }
      try {
        const gen = genStore(), ids = JSON.parse((await gen.get('idx/' + em)) || '[]');
        for (const id of ids) await gen.delete('img/' + id);
        await gen.delete('idx/' + em);
      } catch (e) { console.warn('account delete: the AI pictures', e.message); }
      for (const h of [user.resetLink, user.confirmLink]) if (h) await users().delete('mt:' + h).catch(() => {});   // its mailed links stop working
      if (user.rsus && user.rsus.shop && (await users().get('rsus:shop:' + user.rsus.shop)) === em) await users().delete('rsus:shop:' + user.rsus.shop).catch(() => {});
      await users().delete('u:' + em);
      return json({ ok: true });
    }

    /* One download, photo or video, from the studio or the video maker:
       /export counts it, /export/check says what the plan allows without
       counting (the video maker asks before it spends a minute making the
       video, and counts once the file is made). A video (with the photo of
       it that rides along) is counted on the plan's video meter, a photo on
       its photo meter: Pro has 500 photos and 30 videos a month, Business
       both unlimited (plans.mjs, 2026-11-18). */
    if ((p === '/export' || p === '/export/check') && req.method === 'POST') {
      const em = await readToken(req, env);
      if (!em) return json({ error: 'Not signed in' }, 401);
      const user = await seenUser(req, em);
      if (!user) return json({ error: 'Account not found' }, 404);
      // Operators export without caps, watermark or resolution limits.
      if (roleFor(em, env) === 'admin') return json({ user: publicUser(user, env), maxPx: 2160, watermark: false, remaining: null });
      await freshUser(user, env);
      const { kind } = await req.json().catch(() => ({}));
      /* a print-ready business card (cards/): Pro and Business (plans.mjs cards, owner 2026-11-22:
         "needs to be super pay walled"), then one of the plan's photo downloads */
      if (kind === 'card' && !cardsOk(planOf(user))) {
        return json({ error: 'Print-ready business cards come with Pro and Business', needs: 'cards', user: publicUser(user, env) }, 403);
      }
      /* the logo files and brand kit (logo/): Pro and Business (plans.mjs logos). The logo maker asks
         here only to know whether its preview is marked; the files come from /logo/file below. */
      if (kind === 'logo' && !logosOk(planOf(user))) {
        return json({ error: 'Logo files come with Pro and Business', needs: 'logos', user: publicUser(user, env) }, 403);
      }
      if (kind === 'video' && !videoOk(planOf(user))) {
        return json({ error: 'Video downloads come with Pro and Business', needs: 'video', user: publicUser(user, env) }, 403);
      }
      if (kind === 'video') {
        const v = videoMeter(user);
        if (v.cap !== null && v.remaining <= 0) {
          return json({ error: 'Video limit reached: ' + v.plan.label + "'s " + v.cap + ' video downloads this month. They start over on the 1st, and Business has unlimited video',
            kind: 'video', limit: v.cap, per: 'month', user: publicUser(user, env) }, 402);
        }
        if (p === '/export') { user.videos.count++; await putUser(user); }
        return json({ user: publicUser(user, env), kind: 'video', maxPx: v.plan.maxPx, watermark: v.plan.watermark, remaining: v.cap === null ? null : v.cap - user.videos.count });
      }
      const m = exportMeter(user);
      if (m.cap !== null && m.remaining <= 0) {
        return json({ error: 'Download limit reached: ' + m.plan.label + "'s " + m.cap + ' photo downloads this ' + m.per, kind: 'photo', limit: m.cap, per: m.per, user: publicUser(user, env) }, 402);
      }
      if (p === '/export') { user.exports.count++; await putUser(user); }
      return json({ user: publicUser(user, env), maxPx: m.plan.maxPx, watermark: m.plan.watermark, remaining: m.cap === null ? null : m.cap - user.exports.count });
    }

    /* THE LOGO FILES (logo/, DESIGN-LAW 176). The page sends the design it shows; the plan is checked
       (Pro and Business: plans.mjs logos), one photo download is counted, and the files are drawn
       here by logo/engine.js (netlify/lib/logos.mjs), so a clean vector never comes from a browser
       that has not paid. A drawing that fails counts nothing. */
    if (p === '/logo/file' && req.method === 'POST') {
      const em = await readToken(req, env);
      if (!em) return json({ error: 'Not signed in' }, 401);
      const user = await seenUser(req, em);
      if (!user) return json({ error: 'Account not found' }, 404);
      const admin = roleFor(em, env) === 'admin';
      if (!admin) await freshUser(user, env);
      const { design, phone } = await req.json().catch(() => ({}));
      if (!design || typeof design !== 'object' || Array.isArray(design)) return json({ error: 'Send the logo to draw' }, 400);
      if (!admin && !logosOk(planOf(user))) return json({ error: 'Logo files come with Pro and Business', needs: 'logos', user: publicUser(user, env) }, 403);
      const m = exportMeter(user);
      if (!admin && m.cap !== null && m.remaining <= 0) {
        return json({ error: 'Download limit reached: ' + m.plan.label + "'s " + m.cap + ' photo downloads this ' + m.per, kind: 'photo', limit: m.cap, per: m.per, user: publicUser(user, env) }, 402);
      }
      let files;
      try { files = await logoFiles(design, phone); }
      catch (e) { console.error('logo files:', e); return json({ error: 'The logo could not be drawn' }, 500); }
      if (!admin) { user.exports.count++; await putUser(user); }
      return json({ files, user: publicUser(user, env) });
    }

    /* THE BRAND KITS (logo/kit.js, DESIGN-LAW 180). A kit bought (alone at $14.99 or $19.99, or as the
       add-on at a Starter plan's checkout) is a credit on the account until a kit is saved with it: one
       business name, its design free to change after, its files drawn here by the engine and downloaded
       again any time, never counted against the photo downloads. Pro and Business include Complete. */
    if (p === '/kits' || p === '/kits/save' || p === '/kits/file') {
      const em = await readToken(req, env);
      if (!em) return json({ error: 'Not signed in' }, 401);
      const user = await seenUser(req, em);
      if (!user) return json({ error: 'Account not found' }, 404);
      const admin = roleFor(em, env) === 'admin';
      if (!admin) await freshUser(user, env);
      const view = () => {
        const k = kitsOf(user);
        return { included: admin ? 'complete' : kitIncluded(planOf(user)), credits: kitCredits(user),
          saved: k.saved.filter((x) => !x.refunded).map((x) => ({ id: x.id, name: x.name, tier: x.tier, spec: x.spec, at: x.at, via: x.via })),
          prices: { essentials: KITS.essentials.price, complete: KITS.complete.price, upgrade: KIT_UPGRADE.price, addonOff: KIT_ADDON_OFF } };
      };
      if (p === '/kits' && req.method === 'GET') return json(view());
      if (req.method !== 'POST') return json({ error: 'Not found' }, 404);
      const body = await req.json().catch(() => ({}));
      if (p === '/kits/save') {
        let spec;
        try { spec = await cleanKitSpec(body.spec); } catch (e) { return json({ error: 'Send the kit to save' }, 400); }
        const k = user.kits = kitsOf(user), key = String(spec.design.name || '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
        if (!key) return json({ error: 'Your kit needs a business name' }, 400);
        let kit = k.saved.find((x) => x.key === key && !x.refunded);
        if (kit) { kit.spec = spec; kit.at = Date.now(); }
        else {
          const inc = admin ? 'complete' : kitIncluded(planOf(user));
          let tier = inc, via = admin ? 'admin' : 'plan', b = null;
          if (!inc) {
            const order = body.tier === 'essentials' ? ['essentials', 'complete'] : ['complete', 'essentials'];
            b = order.map((t) => k.bought.find((x) => x.tier === t && !x.used && !x.refunded)).find(Boolean);
            if (!b) return json({ error: 'Buy a brand kit to keep this one', needs: 'kit', ...view() }, 402);
            tier = b.tier; via = 'bought';
          }
          kit = { id: 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), key, name: spec.design.name, tier, spec, at: Date.now(), via };
          if (b) b.used = kit.id;
          k.saved.unshift(kit);
          if (k.saved.length > 100) return json({ error: 'This account has 100 kits. Ask support to keep more.' }, 409);
        }
        await putUser(user);
        return json({ kit: { id: kit.id, name: kit.name, tier: kit.tier, spec: kit.spec, at: kit.at, via: kit.via }, ...view() });
      }
      if (p === '/kits/file') {
        const kit = kitsOf(user).saved.find((x) => x.id === body.id && !x.refunded);
        if (!kit) return json({ error: 'That kit is not on this account' }, 404);
        try { return json({ kit: { id: kit.id, name: kit.name, tier: kit.tier }, ...(await brandKitFiles(kit.spec, kit.tier)) }); }
        catch (e) { console.error('kit files:', e); return json({ error: 'The kit could not be drawn' }, 500); }
      }
    }

    /* AI NAME IDEAS (netlify/lib/names.mjs, DESIGN-LAW 180): Claude mixes the shop's own words into
       names. The credits are taken first (an operator is never charged) and given back if it fails. */
    if (p === '/names' && req.method === 'POST') {
      const em = await readToken(req, env);
      if (!em) return json({ error: 'Sign in to ask the AI for names' }, 401);
      const user = await seenUser(req, em);
      if (!user) return json({ error: 'Account not found' }, 404);
      if (!namesOn(env)) return json({ error: 'AI name ideas are not switched on yet' }, 503);
      const cost = creditsFor(NAMES_COST_KEY, env);
      if (cost === null) return json({ error: 'AI name ideas are not priced yet' }, 503);
      const admin = roleFor(em, env) === 'admin';
      const body = await req.json().catch(() => ({}));
      const spent = admin ? null : spendCredits(user, cost);
      if (!admin && !spent) return json({ error: 'Not enough AI credits: name ideas take ' + cost, needs: 'credits', cost, user: publicUser(user, env) }, 402);
      if (spent) await putUser(user);
      try {
        const got = await aiNameIdeas(env, { keywords: body.keywords, cat: body.cat, town: body.town });
        return json({ ...got, cost: admin ? 0 : cost, user: publicUser(user, env) });
      } catch (e) {
        if (spent) { const u = await getUser(em); refundCredits(u, spent); await putUser(u); }
        console.error('names:', e.message);
        return json({ error: e.message || 'The AI did not answer' }, e.status || 502);
      }
    }

    // ---------- AI backgrounds: admin path ----------
    if (p === '/admin/generate-bg' && req.method === 'POST') {
      const em = await readToken(req, env);
      if (!em || roleFor(em, env) !== 'admin') return json({ error: 'Not authorized' }, 403);
      if (!env.GEMINI_KEY && !env.FAL_KEY) return json({ error: 'No image provider key set' }, 503);
      const { prompt } = await req.json().catch(() => ({}));
      const clean = String(prompt || '').trim().slice(0, 600);
      if (!clean) return json({ error: 'Empty prompt' }, 400);
      const recipe = await loadRecipe(env, bgStore());
      const out = await generateImage({ prompt: clean, negative: '', refs: [], aspect: '1:1' }, env, recipe, { origin: env.SITE_URL || url.origin, deadline: Date.now() + 25000 }); // verbatim — operator owns the words
      return json({ image: dataUrlOf(out), prompt: clean });
    }

    if (p === '/admin/approve-bg' && req.method === 'POST') {
      const em = await readToken(req, env);
      if (!em || roleFor(em, env) !== 'admin') return json({ error: 'Not authorized' }, 403);
      const { filename, dataUrl } = await req.json().catch(() => ({}));
      if (!BG_FILE_RE.test(String(filename || ''))) return json({ error: 'Filename must match a Designer Library slot' }, 400);
      const m = String(dataUrl || '').match(/^data:image\/(jpeg|png|webp);base64,(.+)$/s);
      if (!m) return json({ error: 'Only JPG/PNG/WEBP data URLs supported' }, 400);
      if (m[2].length > 12 * 1024 * 1024) return json({ error: 'Image too large' }, 400);
      await bgStore().set('bg/' + filename, JSON.stringify({ mime: 'image/' + m[1], b64: m[2], by: em, ts: Date.now() }));
      return json({ ok: true, filename, url: '/api/bg/' + filename });
    }

    // ---------- the owner's approvals (approve.html) ----------
    // Which ads are commercial worthy, hero worthy or denied: one record, kept
    // for the operators so a phone and a Mac show the same marks.
    if (p === '/admin/approvals' && (req.method === 'GET' || req.method === 'PUT')) {
      const em = await readToken(req, env);
      if (!em || roleFor(em, env) !== 'admin') return json({ error: 'Not authorized' }, 403);
      if (req.method === 'GET') {
        return json({ approvals: JSON.parse((await approvalStore().get('approvals')) || 'null') || { commercial: [], hero: [], denied: [], ts: 0 } });
      }
      const b = await req.json().catch(() => null);
      const ids = (a) => (Array.isArray(a) ? [...new Set(a.filter((k) => typeof k === 'string' && /^[\w-]{1,80}$/.test(k)))].slice(0, 5000) : null);
      const rec = b && { commercial: ids(b.commercial), hero: ids(b.hero), denied: ids(b.denied) };
      if (!rec || !rec.commercial || !rec.hero || !rec.denied) return json({ error: 'Send commercial, hero and denied as lists of card ids' }, 400);
      rec.ts = Date.now(); rec.by = em;
      await approvalStore().set('approvals', JSON.stringify(rec));
      return json({ ok: true, ts: rec.ts });
    }

    if (p === '/admin/bg-status') {
      const em = await readToken(req, env);
      if (!em || roleFor(em, env) !== 'admin') return json({ error: 'Not authorized' }, 403);
      const { blobs } = await bgStore().list({ prefix: 'bg/' });
      return json({ published: (blobs || []).map((b) => b.key.slice(3)) });
    }

    // Public blob serving — the site's fallback for slots not yet in the deploy.
    if (p.startsWith('/bg/')) {
      const filename = p.slice(4);
      if (!BG_FILE_RE.test(filename)) return json({ error: 'Not found' }, 404);
      const raw = await bgStore().get('bg/' + filename);
      if (!raw) return json({ error: 'Not found' }, 404);
      const { mime, b64 } = JSON.parse(raw);
      return new Response(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)), {
        headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=3600' },
      });
    }

    // ---------- community backgrounds (ported from worker.js) ----------
    if (p === '/community/publish' && req.method === 'POST') {
      const em = await readToken(req, env);
      if (!em) return json({ error: 'Sign in first' }, 401);
      const { name, thumb, data } = await req.json();
      if (!thumb || !data || String(data).length > 2500000) return json({ error: 'Invalid image (max ~2MB)' }, 400);
      if (!(await bumpCounter('pub:' + em + ':' + isoDay(), 5))) return json({ error: 'Daily publish limit reached (5)' }, 429);
      const id = 'c' + Date.now() + Math.random().toString(36).slice(2, 6);
      const store = users();
      await store.set('c:' + id, JSON.stringify({ data }));
      const idx = JSON.parse((await store.get('cindex')) || '[]');
      idx.unshift({ id, name: String(name || 'Background').slice(0, 40), thumb, ts: Date.now(), by: em.split('@')[0] });
      while (idx.length > 24) { const drop = idx.pop(); await store.delete('c:' + drop.id); }
      await store.set('cindex', JSON.stringify(idx));
      return json({ ok: true, id });
    }
    if (p === '/community/list') {
      return json({ items: JSON.parse((await users().get('cindex')) || '[]') });
    }
    if (p === '/community/item') {
      const raw = await users().get('c:' + (url.searchParams.get('id') || ''));
      if (!raw) return json({ error: 'Not found' }, 404);
      return json(JSON.parse(raw));
    }

    // ---------- Stripe (netlify/lib/billing.mjs; inert until STRIPE_SECRET is set) ----------
    const site = String(env.SITE_URL || url.origin).replace(/\/$/, '');
    if (p === '/portal' && req.method === 'POST') {
      const em = await readToken(req, env);
      if (!em) return json({ error: 'Sign in first' }, 401);
      if (!billingOn(env)) return json({ error: 'Billing is not enabled yet' }, 503);
      const user = await seenUser(req, em);
      const customer = user && customerOf(user, env);
      if (!customer) return json({ error: 'No billing account on file yet' }, 400);
      /* a new Stripe account has no portal configuration until one is saved in
         the dashboard: make one (billing.mjs) rather than fail; a customer
         deleted at Stripe is forgotten, not retried forever */
      const pkey = portalConfigKey(stripeMode(env));
      let cfg = null;
      try { const raw = await users().get(pkey); if (raw) cfg = JSON.parse(raw).id; } catch (e) { /* none yet */ }
      const open = (configuration) => stripe(env, 'POST', '/billing_portal/sessions', { customer, return_url: site + '/?billing=back', configuration: configuration || undefined })
        .catch((e) => ({ error: e.message }));
      let j = await open(cfg);
      if (j.error && /configuration/i.test(j.error)) {
        if (cfg) await users().delete(pkey).catch(() => {});
        try { j = await open(await ensurePortalConfig(env, users(), site)); }
        catch (e) { j = { error: e.message }; }
      }
      if (j.error && /no such customer/i.test(j.error)) {
        user.stripeCustomer = null; await putUser(user);
        return json({ error: 'No billing account on file yet' }, 400);
      }
      if (j.error) return json({ error: j.error }, 502);
      return json({ url: j.url });
    }

    /* Checkout for a plan ({plan, interval}) or a credit pack ({pack}). An
       account already on a paid plan switches with /billing/change instead,
       so nobody ends up paying for two subscriptions. */
    if (p === '/checkout' && req.method === 'POST') {
      const em = await readToken(req, env);
      if (!em) return json({ error: 'Sign in first' }, 401);
      if (!billingOn(env)) return json({ error: 'Billing is not enabled yet' }, 503);
      const user = await seenUser(req, em);
      if (!user) return json({ error: 'Account not found' }, 404);
      const body = await req.json().catch(() => ({}));
      const pack = PACKS[body.pack] ? body.pack : null;
      /* a brand kit alone (essentials, complete, or upgrade: a saved Essentials kit to Complete), or as the
         add-on at a Starter plan's checkout, KIT_ADDON_OFF less (plans.mjs KITS) */
      const kit = !pack && (KITS[body.kit] || body.kit === 'upgrade') ? body.kit : null;
      const plan = pack || kit ? null : planId(body.plan);
      const interval = body.interval === 'year' ? 'year' : 'month';
      if (!pack && !kit && (!PAID.includes(plan) || !PLANS[plan].price[interval])) return json({ error: 'Unknown plan' }, 400);
      const addKit = plan === 'basic' && KITS[body.addKit] ? body.addKit : null;
      const kitId = kit === 'upgrade' ? String(body.kitId || '') : '';
      /* the customer agrees to the Terms, and to the automatic renewal for a
         plan, in the site's checkout dialog before any session exists; the
         agreement goes on the session, the subscription or the payment, and
         the account, with the version and the time */
      if (body.consent !== true) return json({ error: 'Agree to the Terms of Service to continue.', consent: true }, 400);
      const consentAt = new Date().toISOString();
      await freshUser(user, env);
      if (kit === 'upgrade' && !kitsOf(user).saved.some((x) => x.id === kitId && x.tier === 'essentials' && !x.refunded)) return json({ error: 'That kit is not an Essentials kit on this account' }, 400);
      if (kit && kit !== 'upgrade' && kitIncluded(planOf(user))) return json({ error: 'Your plan already includes the Complete brand kit', included: true }, 409);
      if (plan && planId(user.plan) !== 'free' && user.sub && user.sub.id && user.sub.status !== 'gone') {
        return json({ error: 'You already have a plan. Switch it instead.', switch: true }, 409);
      }
      const inc = includedPlan(user);
      if (plan && RANK.indexOf(plan) <= RANK.indexOf(inc)) {
        return json({ error: 'Your ' + (user.rsus.via || 'Reselling.US') + ' plan on Reselling.US already includes ' + PLANS[inc].label + '.', included: true, user: publicUser(user, env) }, 409);
      }
      /* One open checkout per account. A second one (another tab, or the
         dialog closed and opened again) expires the first, so nobody can pay
         for two subscriptions; a first one that was paid but not yet seen
         here is applied instead of selling the plan again. */
      if (user.checkout && user.checkout.id && Date.now() - (user.checkout.ts || 0) < 86400e3) {
        const prev = await stripe(env, 'GET', '/checkout/sessions/' + user.checkout.id, { expand: ['subscription'] }).catch(() => null);
        if (prev && prev.status === 'complete') {
          if (applySession(user, prev, typeof prev.subscription === 'object' ? prev.subscription : null, env)) await putUser(user);
          if (plan && planId(user.plan) !== 'free') {
            return json({ error: 'Your last checkout went through: you are on ' + PLANS[planId(user.plan)].label + '.', already: true, user: publicUser(user, env) }, 409);
          }
        } else if (prev && prev.status === 'open') {
          await stripe(env, 'POST', '/checkout/sessions/' + prev.id + '/expire').catch(() => {});
        }
      }
      /* the webhook, and the domain the wallets need in the on-site form,
         register themselves (once per mode); neither stops a checkout */
      const [wh, pmd] = await Promise.allSettled([ensureWebhook(env, users(), url.origin), ensurePaymentDomain(env, users(), url.origin)]);
      if (wh.status === 'rejected') console.warn('billing: the webhook could not be registered; the return page and the sign-in check carry the plan', wh.reason && wh.reason.message);
      if (pmd.status === 'rejected') console.warn('billing: the payment method domain could not be registered; cards still work, wallets may not show', pmd.reason && pmd.reason.message);
      let price;
      let addPrice = null;
      try {
        price = await priceFor(env, plan ? plan + '_' + interval : pack || 'kit_' + kit);
        if (addKit) addPrice = await priceFor(env, 'kit_' + addKit + '_addon');
      }
      catch (e) { return json({ error: 'Checkout could not start: ' + e.message }, 502); }
      const customer = customerOf(user, env);
      const label = pack ? PACKS[pack].label : kit ? (kit === 'upgrade' ? KIT_UPGRADE.label : KITS[kit].label) : '';
      const md = Object.assign(plan ? { email: em, plan, interval } : pack ? { email: em, pack, credits: PACKS[pack].credits } : { email: em, kit },
        addKit ? { kit: addKit } : {}, kitId ? { kit_id: kitId } : {}, { terms: TERMS_VERSION, consent_at: consentAt });
      const money = (c) => '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: c % 100 ? 2 : 0 });
      /* Embedded Checkout (owner, 2026-10-11: "a functional checkout that is
         also wrapped so we don't show the main generic Stripe checkout. It's
         built into our site and looks clean"). With a publishable key of the
         same mode as the secret, the session is embedded in the site's own
         dialog (checkout-embed.js) and the browser gets its client secret: a
         card pays without leaving the page (redirect_on_completion
         if_required), and a method that has to redirect comes back to the
         same address the hosted page does. No publishable key, a key of the
         other mode, or a caller that did not ask: Stripe's hosted page.
         The value is embedded_page: Stripe's 2026-03-25.dahlia API renamed
         embedded to embedded_page and refuses the old name (2026-10-13, in
         the checkout dialog: "The ui_mode value embedded is no longer
         supported. Use embedded_page instead."). */
      const pk = formKey(env);
      const embed = body.embedded === true && !!pk;
      // a kit bought on the logo maker comes back to it; a plan or a pack to the studio
      const home = kit ? site + '/logo/' : site + '/';
      const back = home + '?checkout=success&session_id={CHECKOUT_SESSION_ID}';
      const params = {
        mode: plan ? 'subscription' : 'payment',
        line_items: [{ price, quantity: 1 }, ...(addPrice ? [{ price: addPrice, quantity: 1 }] : [])],
        customer: customer || undefined,
        customer_email: customer ? undefined : em,
        customer_creation: !plan && !customer ? 'always' : undefined,
        client_reference_id: em,
        metadata: md,
        // partner and creator discounts are Stripe promotion codes, on the plans
        allow_promotion_codes: plan || kit ? 'true' : undefined,
        subscription_data: plan ? { metadata: { email: em, plan, terms: TERMS_VERSION, consent_at: consentAt } } : undefined,
        payment_intent_data: plan ? undefined : { metadata: md, statement_descriptor_suffix: STATEMENT_SUFFIX },
        /* B2B: a business can add its tax ID (and the name and address it
           wants on the invoice), a credit pack gets an invoice like a plan
           does, and Stripe Tax works out sales tax when STRIPE_TAX is on (it
           must be set up in the Stripe dashboard first) */
        tax_id_collection: { enabled: 'true' },
        customer_update: customer ? { name: 'auto', address: 'auto' } : undefined,
        automatic_tax: env.STRIPE_TAX === 'on' ? { enabled: 'true' } : undefined,
        invoice_creation: plan ? undefined : { enabled: 'true', invoice_data: { description: label + ' for WeBuy.AD', metadata: md } },
        // the renewal terms, next to Stripe's own pay button
        custom_text: { submit: { message: plan
          ? 'Renews automatically every ' + interval + ' at ' + money(PLANS[plan].price[interval]) + ' plus any tax until you cancel. Cancel any time in Plan & billing; your plan stays on to the end of the period you paid for.'
            + (addKit ? ' The brand kit is a one-time charge on this first payment.' : '')
          : pack ? 'One-time payment for ' + PACKS[pack].credits + ' AI credits. Bought credits never expire.'
          : 'One-time payment for your brand kit. It stays on your account: download it again any time.' } },
        ...(embed
          ? { ui_mode: 'embedded_page', return_url: back, redirect_on_completion: 'if_required' }
          : { success_url: back, cancel_url: home + '?checkout=cancel' }),
      };
      let j = await stripe(env, 'POST', '/checkout/sessions', params).catch((e) => ({ error: e.message }));
      if (j.error && customer && /no such customer/i.test(j.error)) {
        // a customer deleted at Stripe: forget it and check out as new
        user.stripeCustomer = null;
        Object.assign(params, { customer: undefined, customer_email: em, customer_creation: plan ? undefined : 'always', customer_update: undefined });
        j = await stripe(env, 'POST', '/checkout/sessions', params).catch((e) => ({ error: e.message }));
      }
      if (j.error) return json({ error: j.error }, 502);
      user.checkout = { id: j.id, ts: Date.now() };
      user.consent = { terms: TERMS_VERSION, at: consentAt, for: plan ? plan + '_' + interval + (addKit ? '+kit_' + addKit : '') : pack || 'kit_' + kit };
      await putUser(user);
      if (embed) return json({ clientSecret: j.client_secret, publishableKey: pk, sessionId: j.id });
      return json({ url: j.url, sessionId: j.id });   // the iPhone app keeps the id and confirms it when the customer comes back from Safari
    }

    /* The return from Checkout: the plan (or the credits) go on now, from
       Stripe's own record of the session, whether or not the webhook has
       arrived. Only the account that paid can claim a session. */
    if (p === '/checkout/confirm' && req.method === 'POST') {
      const em = await readToken(req, env);
      if (!em) return json({ error: 'Sign in first' }, 401);
      if (!billingOn(env)) return json({ error: 'Billing is not enabled yet' }, 503);
      const { session_id: sid } = await req.json().catch(() => ({}));
      if (!/^cs_[A-Za-z0-9_]+$/.test(String(sid || ''))) return json({ error: 'Unknown checkout' }, 400);
      const cs = await stripe(env, 'GET', '/checkout/sessions/' + sid, { expand: ['subscription'] }).catch((e) => ({ error: e.message }));
      if (cs.error) return json({ error: cs.error }, 502);
      const owner = String((cs.metadata || {}).email || cs.client_reference_id || '').toLowerCase();
      if (owner !== em) return json({ error: 'That checkout belongs to another account' }, 403);
      const user = await getUser(em);
      if (!user) return json({ error: 'Account not found' }, 404);
      if (cs.status !== 'complete') return json({ pending: true, user: publicUser(user, env) });
      const got = applySession(user, cs, typeof cs.subscription === 'object' ? cs.subscription : null, env);
      if (got) await putUser(user);
      return json({ applied: got, kind: (cs.metadata || {}).pack ? 'credits' : cs.mode === 'payment' ? 'kit' : 'plan', user: publicUser(user, env) });
    }

    /* A paid account moves to another plan or interval on the same
       subscription, prorated and charged now (a failed card changes nothing).
       Down to Free is a cancellation, in the billing portal. */
    if (p === '/billing/change' && req.method === 'POST') {
      const em = await readToken(req, env);
      if (!em) return json({ error: 'Sign in first' }, 401);
      if (!billingOn(env)) return json({ error: 'Billing is not enabled yet' }, 503);
      const user = await seenUser(req, em);
      if (!user || !user.sub || !user.sub.id || planId(user.plan) === 'free') return json({ error: 'No paid plan to change. Choose one instead.' }, 400);
      const body = await req.json().catch(() => ({}));
      const plan = planId(body.plan), interval = body.interval === 'year' ? 'year' : 'month';
      if (!PAID.includes(plan) || !PLANS[plan].price[interval]) return json({ error: 'Unknown plan' }, 400);
      try {
        const now = await stripe(env, 'GET', '/subscriptions/' + user.sub.id);
        const item = now.items && now.items.data && now.items.data[0];
        if (!item) return json({ error: 'That subscription has nothing to change' }, 409);
        const price = await priceFor(env, plan + '_' + interval);
        const sub = item.price && item.price.id === price && !now.cancel_at_period_end ? now
          : await stripe(env, 'POST', '/subscriptions/' + user.sub.id, {
            items: [{ id: item.id, price }], proration_behavior: 'always_invoice',
            payment_behavior: 'error_if_incomplete', cancel_at_period_end: 'false', metadata: { email: em, plan },
          });
        applySub(user, subState(sub, env), env);
        await putUser(user);
        return json({ user: publicUser(user, env) });
      } catch (e) {
        return json({ error: e.status === 402 ? 'The card was declined, so the plan did not change.' : 'The plan could not change: ' + e.message }, e.status === 402 ? 402 : 502);
      }
    }

    if (p === '/stripe-webhook' && req.method === 'POST') {
      const payload = await req.text();
      const ev = await verifyEvent(env, users(), payload, req.headers.get('Stripe-Signature'));
      if (!ev) return new Response('bad signature', { status: 400 });
      const obj = (ev.data && ev.data.object) || {};
      // the shared Stripe account's other sales are not this site's (billing.mjs, ownSession)
      if ((ev.type === 'checkout.session.completed' || ev.type === 'checkout.session.async_payment_succeeded') && ownSession(obj)) {
        const em = String((obj.metadata || {}).email || obj.client_reference_id || obj.customer_email || '').toLowerCase();
        const user = em && (await getUser(em));
        if (user) {
          const sub = obj.mode === 'subscription' && obj.subscription
            ? (typeof obj.subscription === 'object' ? obj.subscription : await stripe(env, 'GET', '/subscriptions/' + obj.subscription))
            : null;
          if (applySession(user, obj, sub, env)) await putUser(user);
        }
      }
      /* a credit pack refunded in full takes its credits back, once */
      if (ev.type === 'charge.refunded' && obj.refunded && obj.payment_intent) {
        const piId = typeof obj.payment_intent === 'string' ? obj.payment_intent : obj.payment_intent.id;
        const pi = await stripe(env, 'GET', '/payment_intents/' + piId).catch(() => null);
        const pmd = (pi && pi.metadata) || {};
        const pem = String(pmd.email || '').toLowerCase();
        if (pem && (KITS[pmd.kit] || pmd.kit === 'upgrade')) {
          const list = await stripe(env, 'GET', '/checkout/sessions', { payment_intent: piId, limit: 1 }).catch(() => null);
          const cs = list && list.data && list.data[0], kuser = cs ? await getUser(pem) : null;
          if (kuser && refundKit(kuser, cs.id)) await putUser(kuser);
        }
        const puser = pem && PACKS[pmd.pack] ? await getUser(pem) : null;
        if (puser) {
          puser.refunded = Array.isArray(puser.refunded) ? puser.refunded : [];
          if (!puser.refunded.includes(obj.id)) {
            puser.refunded.unshift(obj.id);
            puser.refunded.length = Math.min(puser.refunded.length, 50);
            puser.creditsBought = Math.max(0, (puser.creditsBought || 0) - PACKS[pmd.pack].credits);
            await putUser(puser);
          }
        }
      }
      if (ev.type.startsWith('customer.subscription.') && ownSubscription(obj, env)) {
        const em = String((obj.metadata || {}).email || '').toLowerCase();
        const user = em && (await getUser(em));
        // only the account's own subscription moves it (an old one ending must not end a new one)
        if (user && (!user.sub || !user.sub.id || user.sub.id === obj.id || ev.type === 'customer.subscription.created' || planId(user.plan) === 'free')) {
          applySub(user, subState(obj, env), env);
          await putUser(user);
        }
      }
      return new Response('ok');
    }

    /* For operators: is billing live, and is every price and the webhook in
       place. POST makes whatever is missing. */
    if (p === '/admin/billing') {
      const em = await readToken(req, env);
      if (!em || roleFor(em, env) !== 'admin') return json({ error: 'Not authorized' }, 403);
      if (!billingOn(env)) return json({ on: false, say: 'Set STRIPE_SECRET in Netlify to switch billing on.' });
      const out = { on: true, mode: stripeMode(env), site, embedded: !!formKey(env), prices: {}, webhook: null, paymentDomain: null };
      if (req.method === 'POST') {
        try { out.webhook = await ensureWebhook(env, users(), url.origin); } catch (e) { out.webhook = { ok: false, reason: e.message }; }
        try { out.paymentDomain = await ensurePaymentDomain(env, users(), url.origin); } catch (e) { out.paymentDomain = { ok: false, reason: e.message }; }
        for (const key of Object.keys(catalog())) {
          try { out.prices[key] = await priceFor(env, key); } catch (e) { out.prices[key] = 'error: ' + e.message; }
        }
      } else {
        const stored = await users().get(webhookSecretKey(stripeMode(env)));
        out.webhook = env.STRIPE_WEBHOOK_SECRET ? { ok: true, source: 'env' } : stored ? { ok: true, source: 'stored', url: JSON.parse(stored).url } : { ok: false, reason: 'not registered yet (the first checkout registers it)' };
        let host = '';
        try { host = new URL(site).hostname; } catch (e) { /* none */ }
        const dom = host ? await users().get(paymentDomainKey(stripeMode(env), host)) : null;
        out.paymentDomain = dom ? Object.assign({ ok: true, source: 'stored' }, JSON.parse(dom)) : { ok: false, reason: 'not registered yet (the first checkout registers it)' };
      }
      return json(out);
    }

    return json({ error: 'Not found' }, 404);
  } catch (err) {
    return json({ error: 'Server error: ' + err.message }, 500);
  }
};
