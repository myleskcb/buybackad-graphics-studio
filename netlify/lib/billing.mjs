/**
 * Stripe for the plans and the AI credit packs (netlify/lib/plans.mjs).
 * Owner, 2026-10-08: "make it live we can use stripe".
 *
 * Built so that going live is ONE environment variable, STRIPE_SECRET:
 *  - The catalogue makes itself. Each plan, interval and pack is a Stripe
 *    price found by its lookup key (bbad_pro_month, bbad_credits100...), and
 *    created, with its product, the first time it is sold. Change a price in
 *    plans.mjs and the next sale makes the new one and moves the lookup key
 *    to it; people already subscribed keep the price they signed up at.
 *    PRICE_<KEY> (PRICE_PRO_MONTH...; PRICE_PRO, the old name, is
 *    PRICE_PRO_MONTH) points a key at a price made by hand instead.
 *  - The plan switches on when the customer comes back from Checkout
 *    (/checkout/confirm reads the session from Stripe), not only when a
 *    webhook arrives.
 *  - The webhook registers itself at SITE_URL (or Netlify's URL) the first
 *    time someone checks out and keeps its signing secret in Blobs, unless
 *    STRIPE_WEBHOOK_SECRET is set. It carries renewals, plan switches made
 *    in the billing portal, failed payments and cancellations.
 *  - And without any webhook at all, an account whose paid period has run
 *    out is checked against Stripe the next time it signs in (syncDue).
 */
import { PLANS, PACKS, planId } from './plans.mjs';

const API = 'https://api.stripe.com/v1';
export const WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
];
/** statuses that keep the plan on: past_due is Stripe still retrying the card */
const LIVE = new Set(['active', 'trialing', 'past_due']);

export const billingOn = (env) => !!env.STRIPE_SECRET;
export const stripeMode = (env) => (/^(sk|rk)_test_/.test(env.STRIPE_SECRET || '') ? 'test' : 'live');

/** nested objects and arrays as Stripe's form encoding: a[b][0]=c */
export function form(obj, prefix, out) {
  out = out || new URLSearchParams();
  for (const [k, v] of Object.entries(obj || {})) {
    if (v === undefined || v === null || v === '') continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === 'object') form(v, key, out);
    else out.append(key, String(v));
  }
  return out;
}

export async function stripe(env, method, path, params) {
  const q = params ? form(params) : null;
  const get = method === 'GET' || method === 'DELETE';
  const r = await fetch(API + path + (get && q && [...q].length ? '?' + q : ''), {
    method,
    headers: Object.assign({ Authorization: 'Bearer ' + env.STRIPE_SECRET }, get ? {} : { 'Content-Type': 'application/x-www-form-urlencoded' }),
    body: get ? undefined : q,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error((j.error && j.error.message) || 'Stripe answered ' + r.status);
    e.status = r.status; e.code = j.error && j.error.code;
    throw e;
  }
  return j;
}

/** Everything sellable, by key: plan_interval for the plans, the pack id
 *  for credit packs. */
export function catalog() {
  const out = {};
  for (const [id, p] of Object.entries(PLANS)) {
    for (const [interval, amount] of Object.entries(p.price)) {
      if (amount > 0) out[id + '_' + interval] = { key: id + '_' + interval, product: 'bbad_' + id, name: 'Graphics Studio ' + p.label, amount, interval, plan: id };
    }
  }
  for (const [id, k] of Object.entries(PACKS)) {
    out[id] = { key: id, product: 'bbad_credits', name: 'Graphics Studio AI credits', amount: k.price, credits: k.credits, pack: id, label: k.label };
  }
  return out;
}
const lookupKey = (key) => 'bbad_' + key;
const overrideFor = (env, key) => env['PRICE_' + key.toUpperCase()] || (key === 'pro_month' ? env.PRICE_PRO : '') || '';

const priceIds = new Map();   // per warm instance: mode:key:amount → price id
export function forgetPrices() { priceIds.clear(); }

async function ensureProduct(env, item) {
  try { return await stripe(env, 'GET', '/products/' + item.product); }
  catch (e) { if (e.status !== 404) throw e; }
  try { return await stripe(env, 'POST', '/products', { id: item.product, name: item.name }); }
  catch (e) { if (e.code === 'resource_already_exists') return { id: item.product }; throw e; }
}

/** The Stripe price id that sells `key`, made the first time it is asked for. */
export async function priceFor(env, key) {
  const item = catalog()[key];
  if (!item) throw Object.assign(new Error('Unknown plan or pack'), { status: 400 });
  const own = overrideFor(env, key);
  if (own) return own;
  const ck = stripeMode(env) + ':' + key + ':' + item.amount;
  if (priceIds.has(ck)) return priceIds.get(ck);
  const found = await stripe(env, 'GET', '/prices', { lookup_keys: [lookupKey(key)], active: 'true', limit: 10 });
  let price = (found.data || []).find((p) => p.unit_amount === item.amount && p.currency === 'usd'
    && ((p.recurring && p.recurring.interval) || null) === (item.interval || null));
  if (!price) {
    await ensureProduct(env, item);
    price = await stripe(env, 'POST', '/prices', {
      product: item.product, currency: 'usd', unit_amount: item.amount,
      lookup_key: lookupKey(key), transfer_lookup_key: 'true',
      nickname: item.plan ? PLANS[item.plan].label + ' ' + (item.interval === 'year' ? 'yearly' : 'monthly') : item.label,
      recurring: item.interval ? { interval: item.interval } : undefined,
      metadata: { plan: item.plan, interval: item.interval, pack: item.pack, credits: item.credits },
    });
  }
  priceIds.set(ck, price.id);
  return price.id;
}

/** which plan a Stripe price sells, or null */
export function planOfPrice(price, env) {
  if (!price) return null;
  const md = price.metadata || {};
  if (md.plan && PLANS[md.plan]) return md.plan;
  const m = /^bbad_([a-z]+)_(month|year)$/.exec(price.lookup_key || '');
  if (m && PLANS[m[1]]) return m[1];
  for (const key of Object.keys(catalog())) {
    const own = overrideFor(env, key);
    if (own && own === price.id) return catalog()[key].plan || null;
  }
  return null;
}

/** what a subscription means for the account */
export function subState(sub, env) {
  const item = sub.items && sub.items.data && sub.items.data[0];
  const price = item && item.price;
  const named = planOfPrice(price, env) || planId((sub.metadata || {}).plan);
  const end = sub.current_period_end || (item && item.current_period_end) || null;   // moved onto the item in newer API versions
  const on = LIVE.has(sub.status) && named !== 'free';
  return {
    id: sub.id, status: sub.status, plan: on ? named : 'free',
    interval: (price && price.recurring && price.recurring.interval) || null,
    periodEnd: end ? end * 1000 : null,
    cancelAt: sub.cancel_at_period_end ? (end ? end * 1000 : null) : sub.cancel_at ? sub.cancel_at * 1000 : null,
    item: (item && item.id) || null,
    customer: typeof sub.customer === 'string' ? sub.customer : (sub.customer && sub.customer.id) || null,
  };
}
/** the account takes the subscription's plan */
export function applySub(user, s, env) {
  const was = planId(user.plan);
  user.plan = s.plan;
  user.sub = Object.assign({}, s, { checkedAt: Date.now() });
  if (s.customer) { user.stripeCustomer = s.customer; user.stripeMode = stripeMode(env); }
  if (was === 'free' && s.plan !== 'free') user.exports = { period: '', count: 0 };   // a fresh count on the first paid day
  return user;
}
/** a stored customer is only good in the mode it was made in (test or live) */
export const customerOf = (user, env) => (user.stripeCustomer && (user.stripeMode || 'live') === stripeMode(env) ? user.stripeCustomer : null);

/** A paid Checkout session onto the account: the plan, or a pack's credits
 *  once. `sub` is the session's subscription, expanded. Returns what changed. */
export function applySession(user, session, sub, env) {
  const md = session.metadata || {};
  if (session.mode === 'subscription' && sub) { applySub(user, subState(sub, env), env); return 'plan'; }
  if (session.mode === 'payment' && session.payment_status === 'paid' && PACKS[md.pack]) {
    user.paid = Array.isArray(user.paid) ? user.paid : [];
    if (user.paid.includes(session.id)) return null;
    user.paid.unshift(session.id);
    user.paid.length = Math.min(user.paid.length, 50);
    user.creditsBought = Math.max(0, user.creditsBought || 0) + PACKS[md.pack].credits;
    if (session.customer) { user.stripeCustomer = typeof session.customer === 'string' ? session.customer : session.customer.id; user.stripeMode = stripeMode(env); }
    return 'credits';
  }
  return null;
}

/** Is the stored subscription due a look at Stripe? Its paid period ran out
 *  (a renewal, a cancellation or a failed card the webhook did not bring), or
 *  it has not been read in three days. */
export function syncDue(user, now) {
  const s = user.sub;
  if (!s || !s.id || planId(user.plan) === 'free') return false;
  now = now || Date.now();
  return (s.periodEnd && now > s.periodEnd + 5 * 60e3) || !s.checkedAt || now - s.checkedAt > 3 * 86400e3;
}
/** Reads the subscription again; true when the account changed. A test-mode
 *  subscription read with live keys is gone, and so is its plan. */
export async function syncSub(user, env) {
  try {
    const sub = await stripe(env, 'GET', '/subscriptions/' + user.sub.id);
    applySub(user, subState(sub, env), env);
    return true;
  } catch (e) {
    if (e.status === 404) { user.plan = 'free'; user.sub = Object.assign({}, user.sub, { status: 'gone', plan: 'free', checkedAt: Date.now() }); return true; }
    console.warn('billing: could not read the subscription, keeping the plan for now', e.message);
    return false;
  }
}

/* ---------- the webhook ---------- */
const whKey = (mode) => 'stripe:whsec:' + mode;

/** Registers the webhook endpoint (once per mode) unless one is configured.
 *  Never for a draft deploy's address, which dies with the draft. */
export async function ensureWebhook(env, store, origin) {
  if (env.STRIPE_WEBHOOK_SECRET) return { ok: true, source: 'env' };
  const mode = stripeMode(env);
  const have = await store.get(whKey(mode));
  if (have) { try { return Object.assign({ ok: true, source: 'stored' }, { url: JSON.parse(have).url }); } catch (e) { /* remake it */ } }
  const site = String(env.SITE_URL || env.URL || origin || '').replace(/\/$/, '');
  let host = '';
  try { host = new URL(site).hostname; } catch (e) { /* no address */ }
  if (!/^https:\/\//.test(site) || !host || host.includes('--') || /^(localhost|127\.)/.test(host)) {
    return { ok: false, reason: 'no production https address to send events to (set SITE_URL)' };
  }
  const url = site + '/api/stripe-webhook';
  const list = await stripe(env, 'GET', '/webhook_endpoints', { limit: 100 });
  for (const w of list.data || []) if (w.url === url) await stripe(env, 'DELETE', '/webhook_endpoints/' + w.id);   // its secret is not ours to read
  const w = await stripe(env, 'POST', '/webhook_endpoints', {
    url, enabled_events: WEBHOOK_EVENTS, description: 'Graphics Studio: plans and AI credits (registered by the site)',
  });
  await store.set(whKey(mode), JSON.stringify({ id: w.id, secret: w.secret, url, ts: Date.now() }));
  return { ok: true, source: 'created', url };
}

const enc = new TextEncoder();
async function hmacHex(secret, msg) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return [...new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(msg)))].map((x) => x.toString(16).padStart(2, '0')).join('');
}
const same = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };

/** The event, if the Stripe-Signature header is good for any secret we hold
 *  and under five minutes old; otherwise null. */
export async function verifyEvent(env, store, payload, header) {
  const secrets = [env.STRIPE_WEBHOOK_SECRET];
  for (const mode of ['live', 'test']) {
    try { const raw = await store.get(whKey(mode)); if (raw) secrets.push(JSON.parse(raw).secret); } catch (e) { /* none */ }
  }
  const t = (String(header || '').match(/(?:^|,)t=(\d+)/) || [])[1];
  const sigs = [...String(header || '').matchAll(/(?:^|,)v1=([0-9a-f]+)/g)].map((m) => m[1]);
  if (!t || !sigs.length) return null;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return null;
  for (const s of secrets.filter(Boolean)) {
    const want = await hmacHex(s, t + '.' + payload);
    if (sigs.some((v) => same(v, want))) { try { return JSON.parse(payload); } catch (e) { return null; } }
  }
  return null;
}
export const webhookSecretKey = whKey;
