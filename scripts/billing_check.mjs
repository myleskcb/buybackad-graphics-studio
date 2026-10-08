#!/usr/bin/env node
/* BILLING AND AI CREDITS, CHECKED (netlify/lib/plans.mjs, netlify/lib/billing.mjs,
   netlify/functions/api.mjs). The real function, with a stand-in
   @netlify/blobs and a stand-in Stripe and Gemini answering its fetches, so
   every path is walked without a key or a card:

   1. Credits. A free account has 5 a month; an AI background takes the
      model's price in credits (1 for the default); the sixth is 402 and
      nothing is charged; a model that fails gives its credits back; a model
      with no price is not sold (503, nothing charged) until MODEL_COSTS
      prices it, and then costs ceil(price / CREDIT_USD); the free tier's day
      ceiling holds; operators are not charged.
   2. Downloads. /export/check never counts; /export counts; Free stops at 3
      a week with 402.
   3. Stripe off: checkout says so (503), nothing else changes.
   4. Stripe on with only STRIPE_SECRET: the first checkout makes the product,
      the price under its lookup key and the webhook (secret kept); the next
      reuses them; success_url carries the session id; the return confirms
      the plan from Stripe (another account cannot claim it); a second plan
      checkout is refused for a switch; the switch moves the subscription's
      item and the plan; a signed webhook ends the plan, a forged or stale one
      is refused; an account whose period ran out is read from Stripe at sign
      in; a pack's credits land once however many times it is confirmed;
      bought credits are spent after the month's; a new price in plans.mjs
      makes a new Stripe price and moves the lookup key; a test-mode customer
      is not used with live keys.

   5. In Chromium under the production CSP (skip with --no-browser): the
      landing's three plans and the credits line, no sideways scroll at 390;
      the plans page monthly and yearly; Choose Pro yearly goes to Checkout
      and back to "Payment successful" on Pro; the switch to Business; a
      pack comes back as "Credits added"; the AI credit hint; no CSP or page
      errors. SHOT_DIR=/folder keeps screenshots; FABRIC_JS=/path/fabric.min.js
      when cdnjs is out of reach.

   usage:  node scripts/billing_check.mjs [--no-browser]   exits non-zero on any failure */
import { mkdirSync, writeFileSync, cpSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { execSync } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { join, extname } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const bad = [];
let passed = 0;
const ok = (cond, what) => { if (cond) passed++; else bad.push(what); return cond; };

/* ---------- the function, on a stand-in blob store ---------- */
const T = join(tmpdir(), 'billing-check-' + process.pid);
rmSync(T, { recursive: true, force: true });
mkdirSync(join(T, 'netlify'), { recursive: true });
cpSync(join(ROOT, 'netlify'), join(T, 'netlify'), { recursive: true });
mkdirSync(join(T, 'node_modules/@netlify/blobs'), { recursive: true });
writeFileSync(join(T, 'node_modules/@netlify/blobs/package.json'), JSON.stringify({ name: '@netlify/blobs', type: 'module', main: 'index.js' }));
writeFileSync(join(T, 'node_modules/@netlify/blobs/index.js'), [
  'export const all = new Map();',
  'export const getStore = (o) => { const n = typeof o === "string" ? o : o.name; if (!all.has(n)) all.set(n, new Map()); const m = all.get(n);',
  '  return { get: async (k) => (m.has(k) ? m.get(k) : null), set: async (k, v) => { m.set(k, v); }, delete: async (k) => { m.delete(k); }, list: async () => ({ blobs: [] }) }; };',
].join('\n'));

const env = process.env;
for (const k of ['STRIPE_SECRET', 'STRIPE_WEBHOOK_SECRET', 'PRICE_PRO', 'SITE_URL', 'URL', 'FAL_KEY', 'PGFX_BG_MODEL', 'MODEL_COSTS', 'AI_FREE_DAILY_CREDITS', 'AI_DAILY_CREDITS']) delete env[k];
env.JWT_SECRET = 'billing-check-' + 'x'.repeat(32);
env.ADMIN_EMAILS = 'boss@studio.example';
env.GEMINI_KEY = 'gemini-test';

/* ---------- a stand-in Stripe and Gemini ---------- */
const S = { products: new Map(), prices: new Map(), sessions: new Map(), subs: new Map(), hooks: new Map(), customers: new Map(), calls: [], n: 0 };
const id = (p) => p + '_' + (S.n++).toString(36).padStart(6, '0');
let geminiFails = false, geminiCalls = 0;
const IMG = 'data:image/png;base64,iVBORw0KGgo=';

/** a[b][0][c]=v form body → nested object (arrays where the keys are indices) */
function unform(q) {
  const out = {};
  for (const [k, v] of q) {
    const parts = k.replace(/\]/g, '').split('[');
    let o = out;
    parts.forEach((p, i) => {
      if (i === parts.length - 1) o[p] = v;
      else { if (!(p in o)) o[p] = /^\d+$/.test(parts[i + 1]) ? [] : {}; o = o[p]; }
    });
  }
  return out;
}
const modeOf = (auth) => (/sk_test_/.test(auth) ? 'test' : 'live');
const reply = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const missing = (what) => reply(404, { error: { type: 'invalid_request_error', code: 'resource_missing', message: 'No such ' + what } });

function subFor(cs, mode) {
  const price = S.prices.get(cs.line_items[0].price);
  const now = Math.floor(Date.now() / 1000);
  const sub = {
    id: id('sub'), object: 'subscription', status: 'active', customer: cs.customer, mode, metadata: cs.subscription_data ? cs.subscription_data.metadata : {},
    cancel_at_period_end: false, cancel_at: null,
    items: { data: [{ id: id('si'), price, current_period_end: now + (price.recurring.interval === 'year' ? 365 : 30) * 86400 }] },
  };
  S.subs.set(sub.id, sub);
  return sub;
}

const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const u = new URL(typeof input === 'string' ? input : input.url);
  if (u.hostname === 'generativelanguage.googleapis.com') {
    geminiCalls++;
    if (geminiFails) return reply(500, { error: 'down' });
    return reply(200, { candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'iVBORw0KGgo=' } }] } }] });
  }
  if (u.hostname !== 'api.stripe.com') return realFetch(input, init);
  const method = init.method || 'GET';
  const auth = (init.headers && (init.headers.Authorization || init.headers.authorization)) || '';
  const mode = modeOf(auth);
  const body = method === 'POST' ? unform(new URLSearchParams(String(init.body || ''))) : unform(u.searchParams);
  const path = u.pathname.replace(/^\/v1/, '');
  S.calls.push(method + ' ' + path);
  let m;
  if (method === 'GET' && (m = path.match(/^\/products\/(.+)$/))) { const p = S.products.get(mode + ':' + m[1]); return p ? reply(200, p) : missing('product'); }
  if (method === 'POST' && path === '/products') {
    if (S.products.has(mode + ':' + body.id)) return reply(400, { error: { code: 'resource_already_exists', message: 'exists' } });
    const p = { id: body.id, name: body.name }; S.products.set(mode + ':' + body.id, p); return reply(200, p);
  }
  if (method === 'GET' && path === '/prices') {
    const keys = [].concat(body.lookup_keys || []);
    return reply(200, { data: [...S.prices.values()].filter((p) => p.mode === mode && p.active && keys.includes(p.lookup_key)) });
  }
  if (method === 'POST' && path === '/prices') {
    if (!S.products.has(mode + ':' + body.product)) return missing('product');
    const clash = [...S.prices.values()].find((p) => p.mode === mode && p.lookup_key === body.lookup_key);
    if (clash) { if (body.transfer_lookup_key !== 'true') return reply(400, { error: { message: 'lookup key taken' } }); clash.lookup_key = null; }
    const p = { id: id('price'), mode, active: true, product: body.product, currency: body.currency, unit_amount: Number(body.unit_amount), lookup_key: body.lookup_key,
      recurring: body.recurring ? { interval: body.recurring.interval } : null, metadata: body.metadata || {} };
    S.prices.set(p.id, p); return reply(200, p);
  }
  if (method === 'GET' && path === '/webhook_endpoints') return reply(200, { data: [...S.hooks.values()].filter((h) => h.mode === mode) });
  if (method === 'DELETE' && (m = path.match(/^\/webhook_endpoints\/(.+)$/))) { S.hooks.delete(m[1]); return reply(200, { id: m[1], deleted: true }); }
  if (method === 'POST' && path === '/webhook_endpoints') {
    const h = { id: id('we'), mode, url: body.url, enabled_events: body.enabled_events, secret: 'whsec_' + (S.n++).toString(36) + 'secret' };
    S.hooks.set(h.id, h); return reply(200, h);
  }
  if (method === 'POST' && path === '/checkout/sessions') {
    if (body.customer && !S.customers.has(mode + ':' + body.customer)) return missing('customer: ' + body.customer);
    if (!S.prices.has(body.line_items[0].price)) return missing('price');
    const cs = Object.assign({ id: 'cs_' + mode + '_' + (S.n++).toString(36), object: 'checkout.session', status: 'open', payment_status: 'unpaid', mode: body.mode, smode: mode }, body);
    cs.url = 'https://checkout.stripe.test/' + cs.id;
    S.sessions.set(cs.id, cs); return reply(200, cs);
  }
  if (method === 'GET' && (m = path.match(/^\/checkout\/sessions\/(.+)$/))) {
    const cs = S.sessions.get(m[1]);
    if (!cs || cs.smode !== mode) return missing('checkout.session');
    const out = Object.assign({}, cs);
    if ([].concat(body.expand || []).includes('subscription') && cs.subscription) out.subscription = S.subs.get(cs.subscription);
    return reply(200, out);
  }
  if ((m = path.match(/^\/subscriptions\/(.+)$/))) {
    const sub = S.subs.get(m[1]);
    if (!sub || sub.mode !== mode) return missing('subscription');
    if (method === 'POST') {
      if (body.items) { const it = sub.items.data.find((i) => i.id === body.items[0].id); it.price = S.prices.get(body.items[0].price); }
      if (body.cancel_at_period_end) sub.cancel_at_period_end = body.cancel_at_period_end === 'true';
      if (body.metadata) Object.assign(sub.metadata, body.metadata);
      S.lastUpdate = body;
    }
    return reply(200, sub);
  }
  if (method === 'POST' && path === '/billing_portal/sessions') return reply(200, { url: 'https://billing.stripe.test/' + body.customer });
  return reply(400, { error: { message: 'stand-in Stripe does not know ' + method + ' ' + path } });
};

/** what Stripe does when the customer pays: the session completes, a customer
 *  and (for a plan) an active subscription come to exist */
function pay(csId) {
  const cs = S.sessions.get(csId);
  cs.status = 'complete'; cs.payment_status = 'paid';
  if (!cs.customer) { cs.customer = id('cus'); S.customers.set(cs.smode + ':' + cs.customer, { id: cs.customer }); }
  if (cs.mode === 'subscription') cs.subscription = subFor(cs, cs.smode).id;
  return cs;
}

const api = (await import(pathToFileURL(join(T, 'netlify/functions/api.mjs')).href)).default;
const plans = await import(pathToFileURL(join(T, 'netlify/lib/plans.mjs')).href);
const billing = await import(pathToFileURL(join(T, 'netlify/lib/billing.mjs')).href);
const blobs = await import(pathToFileURL(join(T, 'node_modules/@netlify/blobs/index.js')).href);
const store = blobs.all;

const hit = async (method, path, body, token, headers) => {
  const res = await api(new Request('https://studio.example/api' + path, {
    method, headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}, headers || {}),
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  }));
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch (e) { /* text */ }
  return { status: res.status, json, text };
};
const signup = async (email) => (await hit('POST', '/auth/signup', { email, password: 'a-long-password' })).json.token;
const userBlob = (em) => JSON.parse(store.get('pgfx-users').get('u:' + em));
const setUser = (u) => store.get('pgfx-users').set('u:' + u.email, JSON.stringify(u));

/* ---------- 1. credits ---------- */
{
  const p = await hit('GET', '/plans');
  ok(p.status === 200 && p.json.plans.pro.credits === 75 && p.json.packs.credits100.credits === 100, '/plans answers the table');
  ok(p.json.ai.background === 1 && p.json.billing === false, '/plans: a background is 1 credit on the default model; billing off');

  const free = await signup('free@x.example');
  const me = (await hit('GET', '/me', undefined, free)).json.user;
  ok(me.plan === 'free' && me.credits.allowance === 5 && me.credits.total === 5, 'a new account has 5 credits this month');
  for (let i = 0; i < 5; i++) {
    const r = await hit('POST', '/generate-bg', { text: 'shop counter', category: 'phones' }, free);
    ok(r.status === 200 && r.json.image && r.json.spent === 1 && r.json.credits.total === 4 - i, 'background ' + (i + 1) + ' spends 1 credit');
  }
  const calls = geminiCalls;
  const sixth = await hit('POST', '/generate-bg', { text: 'more' }, free);
  ok(sixth.status === 402 && sixth.json.need === 1 && geminiCalls === calls, 'the sixth is 402 and the model is not called');

  const f2 = await signup('fails@x.example');
  geminiFails = true;
  const failed = await hit('POST', '/generate-bg', { text: 'x' }, f2);
  geminiFails = false;
  ok(failed.status === 500 && userBlob('fails@x.example').credits.used === 0, 'a model that fails gives the credit back');

  env.PGFX_BG_MODEL = 'some-new-model';
  const before = geminiCalls;
  const unpriced = await hit('POST', '/generate-bg', { text: 'x' }, f2);
  ok(unpriced.status === 503 && geminiCalls === before && !userBlob('fails@x.example').credits.used, 'an unpriced model is not sold, nothing charged');
  ok((await hit('GET', '/plans')).json.ai.background === null, '/plans: no price for an unpriced model');
  env.MODEL_COSTS = JSON.stringify({ 'some-new-model': 0.1 });
  const priced = await hit('POST', '/generate-bg', { text: 'x' }, f2);
  ok(priced.status === 200 && priced.json.spent === 3 && priced.json.credits.total === 2, 'MODEL_COSTS prices it: $0.10 is 3 credits');
  const tooDear = await hit('POST', '/generate-bg', { text: 'x' }, f2);
  ok(tooDear.status === 402 && tooDear.json.need === 3, '2 credits left cannot buy a 3-credit call');
  delete env.PGFX_BG_MODEL; delete env.MODEL_COSTS;

  env.AI_FREE_DAILY_CREDITS = '0';
  const f3 = await signup('ceiling@x.example');
  const ceil = await hit('POST', '/generate-bg', { text: 'x' }, f3);
  ok(ceil.status === 429 && !userBlob('ceiling@x.example').credits, 'the free tier day ceiling holds, nothing charged');
  delete env.AI_FREE_DAILY_CREDITS;

  const boss = await signup('boss@studio.example');
  for (let i = 0; i < 7; i++) await hit('POST', '/generate-bg', { text: 'x' }, boss);
  ok(!userBlob('boss@studio.example').credits, 'operators are not charged');

  ok(plans.creditsFor('gemini-3-pro-image', {}) === 4 && plans.creditsFor('gemini-3.1-flash-image', {}) === 2 && plans.creditsFor('nope', {}) === null,
    'creditsFor: 3 Pro image 4, 3.1 Flash image 2, unknown null');
  env.FAL_KEY = 'fal'; env.PGFX_BG_MODEL = 'gemini-3-pro-image';
  ok(plans.backgroundCredits(env) === 4, 'the dearest model in the chain sets the charge');
  delete env.FAL_KEY; delete env.PGFX_BG_MODEL;
}

/* ---------- 2. downloads ---------- */
{
  const t = await signup('dl@x.example');
  const c = await hit('POST', '/export/check', {}, t);
  ok(c.status === 200 && c.json.remaining === 3 && c.json.watermark === true && c.json.maxPx === 1080, '/export/check: Free, 3 left, watermark, 1080');
  ok(userBlob('dl@x.example').exports.count === 0, '/export/check counts nothing');
  for (let i = 0; i < 3; i++) await hit('POST', '/export', {}, t);
  const four = await hit('POST', '/export', {}, t);
  ok(four.status === 402 && four.json.per === 'week' && four.json.limit === 3, 'Free stops at 3 a week with 402');
  ok((await hit('POST', '/export/check', {}, t)).status === 402, '/export/check says so too');
}

/* ---------- 3. Stripe off ---------- */
const buyer = await signup('buyer@x.example');
{
  const r = await hit('POST', '/checkout', { plan: 'pro' }, buyer);
  ok(r.status === 503 && /not enabled/.test(r.json.error), 'Stripe off: checkout says billing is not enabled');
}

/* ---------- 4. Stripe on, with only STRIPE_SECRET ---------- */
env.STRIPE_SECRET = 'sk_test_abc';
env.SITE_URL = 'https://studio.example';
let csPro;
{
  const r = await hit('POST', '/checkout', { plan: 'pro', interval: 'year' }, buyer);
  ok(r.status === 200 && /^https:\/\/checkout\.stripe\.test\//.test(r.json.url), 'checkout answers a Stripe URL');
  csPro = [...S.sessions.values()].pop();
  const price = S.prices.get(csPro.line_items[0].price);
  ok(price && price.unit_amount === 15000 && price.recurring.interval === 'year' && price.lookup_key === 'bbad_pro_year' && price.product === 'bbad_pro',
    'the yearly Pro price is made: $150, yearly, lookup key bbad_pro_year, product bbad_pro');
  ok(csPro.mode === 'subscription' && csPro.customer_email === 'buyer@x.example' && csPro.metadata.plan === 'pro' && csPro.allow_promotion_codes === 'true',
    'the session: subscription, the account email, plan in metadata, promotion codes on');
  ok(csPro.success_url === 'https://studio.example/?checkout=success&session_id={CHECKOUT_SESSION_ID}', 'success_url carries the session id');
  const hooks = [...S.hooks.values()];
  ok(hooks.length === 1 && hooks[0].url === 'https://studio.example/api/stripe-webhook' && [].concat(hooks[0].enabled_events).includes('customer.subscription.updated'),
    'the webhook is registered at SITE_URL with the subscription events');
  ok(JSON.parse(store.get('pgfx-users').get('stripe:whsec:test')).secret === hooks[0].secret, 'its signing secret is kept (test mode)');

  const n = S.prices.size, h = S.hooks.size;
  billing.forgetPrices();
  await hit('POST', '/checkout', { plan: 'pro', interval: 'year' }, buyer);
  ok(S.prices.size === n && S.hooks.size === h, 'a second checkout reuses the price and the webhook');

  pay(csPro.id);
  const other = await signup('other@x.example');
  ok((await hit('POST', '/checkout/confirm', { session_id: csPro.id }, other)).status === 403, 'another account cannot claim the session');
  const conf = await hit('POST', '/checkout/confirm', { session_id: csPro.id }, buyer);
  ok(conf.status === 200 && conf.json.user.plan === 'pro' && conf.json.user.sub.interval === 'year' && conf.json.user.credits.allowance === 75,
    'the return confirms Pro yearly, 75 credits, without a webhook');

  const again = await hit('POST', '/checkout', { plan: 'business', interval: 'month' }, buyer);
  ok(again.status === 409 && again.json.switch === true, 'a second plan checkout is refused: switch instead');

  const sw = await hit('POST', '/billing/change', { plan: 'business', interval: 'month' }, buyer);
  const sub = S.subs.get(userBlob('buyer@x.example').sub.id);
  ok(sw.status === 200 && sw.json.user.plan === 'business' && sub.items.data[0].price.unit_amount === 3900 && S.lastUpdate.proration_behavior === 'always_invoice',
    'the switch moves the item to Business monthly, prorated now');
  const lib = await hit('GET', '/ads/mine', undefined, buyer);
  ok(lib.status === 200 && lib.json.limit === 1000, 'the ad library gives Business its 1,000');

  const portal = await hit('POST', '/portal', {}, buyer);
  ok(portal.status === 200 && /billing\.stripe\.test\/cus_/.test(portal.json.url), 'Manage billing opens the portal for the customer');

  // the webhook: canceled at Stripe
  const secret = JSON.parse(store.get('pgfx-users').get('stripe:whsec:test')).secret;
  const signed = (obj, t) => { const payload = JSON.stringify(obj); t = t || Math.floor(Date.now() / 1000); return { payload, header: 't=' + t + ',v1=' + createHmac('sha256', secret).update(t + '.' + payload).digest('hex') }; };
  const ended = Object.assign({}, sub, { status: 'canceled' });
  const forged = await hit('POST', '/stripe-webhook', JSON.stringify({ type: 'customer.subscription.deleted', data: { object: ended } }), null, { 'Stripe-Signature': 't=' + Math.floor(Date.now() / 1000) + ',v1=' + 'ab'.repeat(32) });
  ok(forged.status === 400 && userBlob('buyer@x.example').plan === 'business', 'a forged webhook is refused');
  const old = signed({ type: 'customer.subscription.deleted', data: { object: ended } }, Math.floor(Date.now() / 1000) - 3600);
  ok((await hit('POST', '/stripe-webhook', old.payload, null, { 'Stripe-Signature': old.header })).status === 400, 'a stale webhook is refused');
  const stranger = signed({ type: 'customer.subscription.deleted', data: { object: Object.assign({}, ended, { id: 'sub_someoneelse' }) } });
  await hit('POST', '/stripe-webhook', stranger.payload, null, { 'Stripe-Signature': stranger.header });
  ok(userBlob('buyer@x.example').plan === 'business', 'an old subscription ending does not end the current plan');
  const good = signed({ type: 'customer.subscription.deleted', data: { object: ended } });
  const wh = await hit('POST', '/stripe-webhook', good.payload, null, { 'Stripe-Signature': good.header });
  ok(wh.status === 200 && userBlob('buyer@x.example').plan === 'free', 'a signed webhook ends the plan');

  // a fresh plan, then its period runs out with no webhook: read at sign in
  const r2 = await hit('POST', '/checkout', { plan: 'pro', interval: 'month' }, buyer);
  ok(r2.status === 200, 'after a cancel the account can check out again');
  const cs2 = pay([...S.sessions.values()].pop().id);
  ok(cs2.customer && cs2.customer === userBlob('buyer@x.example').stripeCustomer, 'the second checkout reuses the Stripe customer');
  await hit('POST', '/checkout/confirm', { session_id: cs2.id }, buyer);
  const u = userBlob('buyer@x.example');
  ok(u.plan === 'pro', 'Pro again');
  S.subs.get(u.sub.id).status = 'unpaid';
  u.sub.periodEnd = Date.now() - 3600e3; setUser(u);
  const lazy = await hit('GET', '/me', undefined, buyer);
  ok(lazy.json.user.plan === 'free' && lazy.json.user.sub.status === 'unpaid', 'a period that ran out unpaid is read from Stripe at sign in: Free');
}

/* packs */
{
  const t = await signup('packs@x.example');
  const r = await hit('POST', '/checkout', { pack: 'credits100' }, t);
  const cs = [...S.sessions.values()].pop();
  ok(r.status === 200 && cs.mode === 'payment' && S.prices.get(cs.line_items[0].price).unit_amount === 900 && cs.customer_creation === 'always' && !cs.allow_promotion_codes,
    'a pack is a one-off payment of $9, a customer made, no promotion codes');
  ok((await hit('POST', '/checkout/confirm', { session_id: cs.id }, t)).json.pending === true, 'an unpaid session confirms nothing');
  pay(cs.id);
  const c1 = await hit('POST', '/checkout/confirm', { session_id: cs.id }, t);
  const c2 = await hit('POST', '/checkout/confirm', { session_id: cs.id }, t);
  const secret = JSON.parse(store.get('pgfx-users').get('stripe:whsec:test')).secret;
  const payload = JSON.stringify({ type: 'checkout.session.completed', data: { object: S.sessions.get(cs.id) } }), ts = Math.floor(Date.now() / 1000);
  await hit('POST', '/stripe-webhook', payload, null, { 'Stripe-Signature': 't=' + ts + ',v1=' + createHmac('sha256', secret).update(ts + '.' + payload).digest('hex') });
  ok(c1.json.user.credits.bought === 100 && c2.json.applied === null && userBlob('packs@x.example').creditsBought === 100, 'the pack lands 100 credits once (confirm twice, then the webhook)');
  for (let i = 0; i < 6; i++) await hit('POST', '/generate-bg', { text: 'x' }, t);
  const after = (await hit('GET', '/me', undefined, t)).json.user.credits;
  ok(after.left === 0 && after.bought === 99, "bought credits are spent after the month's 5");
}

/* a new price in plans.mjs */
{
  plans.PLANS.pro.price.month = 1900;
  billing.forgetPrices();
  const t = await signup('newprice@x.example');
  await hit('POST', '/checkout', { plan: 'pro', interval: 'month' }, t);
  const cs = [...S.sessions.values()].pop();
  const p = S.prices.get(cs.line_items[0].price);
  const olds = [...S.prices.values()].filter((x) => x.unit_amount === 1500 && x.recurring && x.recurring.interval === 'month');
  ok(p.unit_amount === 1900 && p.lookup_key === 'bbad_pro_month' && olds.every((x) => x.lookup_key !== 'bbad_pro_month'), 'a new price is made and the lookup key moves to it');
  plans.PLANS.pro.price.month = 1500;
  billing.forgetPrices();
}

/* live keys after test keys */
{
  env.STRIPE_SECRET = 'sk_live_abc';
  const u = userBlob('buyer@x.example');
  await hit('POST', '/checkout', { pack: 'credits100' }, buyer);
  const cs = [...S.sessions.values()].pop();
  ok(!cs.customer && cs.customer_email === 'buyer@x.example', 'a test-mode customer is not used with live keys');
  ok(S.hooks.size === 2 && [...S.hooks.values()].some((h) => h.mode === 'live'), 'live mode registers its own webhook');
  const paid = userBlob('buyer@x.example');
  paid.plan = 'pro'; paid.sub = Object.assign({}, u.sub, { status: 'active', plan: 'pro', checkedAt: 0 }); setUser(paid);
  const me = (await hit('GET', '/me', undefined, buyer)).json.user;
  ok(me.plan === 'free', 'a test-mode subscription read with live keys is gone, and so is its plan');
}

/* operators */
{
  const boss = await signup('boss2@studio.example');
  ok((await hit('GET', '/admin/billing', undefined, boss)).status === 403, '/admin/billing is for operators only');
  const t = (await hit('POST', '/auth/login', { email: 'boss@studio.example', password: 'a-long-password' })).json.token;
  const st = await hit('POST', '/admin/billing', {}, t);
  ok(st.status === 200 && st.json.on && st.json.mode === 'live' && Object.values(st.json.prices).every((v) => /^price_/.test(v)) && Object.keys(st.json.prices).length === 6,
    '/admin/billing makes and lists every price (4 plan prices, 2 packs)');
}

/* economics: every plan and pack clears its bar */
for (const r of plans.economics()) {
  if (r.kind === 'pack') ok(r.margin >= plans.TARGETS.packMargin, `pack ${r.id} keeps ${Math.round(r.margin * 100)}% at worst`);
  else if (r.priceUsd) ok(r.margin >= plans.TARGETS.planMargin, `${r.id} ${r.interval} keeps ${Math.round(r.margin * 100)}% at worst`);
  else ok(r.worstCostUsd <= plans.TARGETS.freeCostMax, `free costs at most $${r.worstCostUsd.toFixed(2)} a month`);
}

/* ---------- 5. in Chromium, under the production CSP ---------- */
if (!process.argv.includes('--no-browser')) await browserPart();

rmSync(T, { recursive: true, force: true });
console.log(`billing_check: ${passed} passed, ${bad.length} failed`);
for (const b of bad) console.log('  FAIL ' + b);
process.exit(bad.length ? 1 : 0);

async function browserPart() {
  let chromium;
  try { ({ chromium } = await import('playwright')); }
  catch (e) {
    try { const g = execSync('npm root -g').toString().trim(); ({ chromium } = await import(pathToFileURL(join(g, 'playwright/index.mjs')).href)); }
    catch (e2) { console.log('billing_check: no playwright, browser part skipped'); return; }
  }
  env.STRIPE_SECRET = 'sk_test_browser';
  delete env.SITE_URL;   // Checkout comes back to the page's own address
  const csp = (readFileSync(join(ROOT, '_headers'), 'utf8').match(/Content-Security-Policy:\s*(.+)/) || [])[1];
  const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp3': 'audio/mpeg', '.ttf': 'font/ttf' };
  const server = createServer(async (req, res) => {
    try {
      const u = new URL(req.url, 'http://127.0.0.1');
      if (u.pathname.startsWith('/api/')) {
        const chunks = []; for await (const c of req) chunks.push(c);
        const r = await api(new Request('http://' + req.headers.host + u.pathname + u.search, { method: req.method, headers: req.headers, body: chunks.length ? Buffer.concat(chunks) : undefined }));
        const h = {}; r.headers.forEach((v, k) => { h[k] = v; });
        res.writeHead(r.status, h); res.end(Buffer.from(await r.arrayBuffer())); return;
      }
      let f = join(ROOT, decodeURIComponent(u.pathname));
      if (u.pathname.endsWith('/')) f = join(f, 'index.html');
      if (!f.startsWith(ROOT) || !existsSync(f)) { res.writeHead(404); res.end('404'); return; }
      res.writeHead(200, Object.assign({ 'Content-Type': TYPES[extname(f)] || 'application/octet-stream' }, csp ? { 'Content-Security-Policy': csp } : {}));
      res.end(readFileSync(f));
    } catch (e) { res.writeHead(500); res.end(String(e)); }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const BASE = 'http://localhost:' + server.address().port;
  const fabricJs = process.env.FABRIC_JS ? readFileSync(process.env.FABRIC_JS) : null;
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
  const errors = [];
  const shot = async (page, name) => {
    if (!process.env.SHOT_DIR) return;
    mkdirSync(process.env.SHOT_DIR, { recursive: true });
    await page.waitForTimeout(250);
    await page.screenshot({ path: join(process.env.SHOT_DIR, name + '.png'), fullPage: false });
  };
  const newPage = async (w, token) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    if (token) await ctx.addInitScript((t) => { try { localStorage.setItem('pgfx_token', JSON.stringify(t)); localStorage.setItem('pgfx_seen_account', 'true'); } catch (e) {} }, token);
    const page = await ctx.newPage();
    await page.route('**/*', (route) => {
      const url = route.request().url();
      if (url.startsWith(BASE)) return route.continue();
      if (url.startsWith('https://checkout.stripe.test/')) {   // the customer pays; Stripe sends them back
        const cs = pay(url.split('/').pop());
        return route.fulfill({ status: 302, headers: { Location: cs.success_url.replace('{CHECKOUT_SESSION_ID}', cs.id) } });
      }
      if (/fabric(\.min)?\.js/.test(url) && fabricJs) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fabricJs });
      return route.abort();
    });
    page.on('dialog', (d) => d.accept());
    page.on('console', (m) => { if (m.type() === 'error' && /Content Security Policy|Refused to/.test(m.text())) errors.push(m.text().slice(0, 200)); });
    page.on('pageerror', (e) => errors.push('page error: ' + e.message));
    return page;
  };
  try {
    // the landing's plans, wide and on a phone
    for (const w of [1440, 390]) {
      const page = await newPage(w);
      await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);
      const pr = await page.evaluate(() => {
        const sec = document.getElementById('pricing');
        sec.scrollIntoView();
        return { cards: [...sec.querySelectorAll('.lp-price-card h3')].map((h) => h.textContent), text: sec.innerText, over: document.documentElement.scrollWidth - innerWidth };
      });
      ok(pr.cards.join() === 'Free,Pro,Business', `landing ${w}: three plans (${pr.cards.join()})`);
      ok(/photos or videos/.test(pr.text) && /\$150 a year/.test(pr.text) && /AI credits/.test(pr.text) && /100 credits are \$9/.test(pr.text), `landing ${w}: videos, yearly price and credits on the cards`);
      ok(pr.over <= 0, `landing ${w}: no sideways scroll (${pr.over}px)`);
      if (process.env.SHOT_DIR) { await page.waitForTimeout(600); await page.locator('#pricing').screenshot({ path: join(process.env.SHOT_DIR, 'landing-pricing-' + w + '.png') }); }
      await page.context().close();
    }

    // a free account: the plans page, Checkout, back on Pro
    const token = await signup('browser@x.example');
    for (const w of [1440, 390]) {
      const page = await newPage(w, token);
      await page.goto(BASE + '/?plans=1', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#page-plans.active .plan-card');
      await page.waitForTimeout(400);
      const m = await page.evaluate(() => ({ cards: [...document.querySelectorAll('#plans-grid .plan-card')].map((c) => c.querySelector('.plan-name').textContent + ' ' + c.querySelector('.plan-price').textContent), packs: document.querySelectorAll('.pack-btn').length, over: document.documentElement.scrollWidth - innerWidth, note: (document.querySelector('.plans-note') || {}).textContent || '' }));
      ok(m.cards.join('|') === 'Free $0 forever|Pro $15 /month|Business $39 /month' && m.packs === 2, `plans ${w}: monthly (${m.cards.join('|')}), two packs`);
      ok(!/opens soon/.test(m.note), `plans ${w}: billing is on, no "opens soon" note`);
      await shot(page, 'plans-month-' + w);
      await page.click('.plans-toggle button:nth-child(2)');
      const y = await page.evaluate(() => [...document.querySelectorAll('#plans-grid .plan-card .plan-price')].map((p) => p.textContent).join('|'));
      ok(y === '$0 forever|$150 /year|$390 /year', `plans ${w}: yearly (${y})`);
      ok(m.over <= 0, `plans ${w}: no sideways scroll`);
      await shot(page, 'plans-year-' + w);
      if (w === 390) { await page.context().close(); continue; }

      await Promise.all([page.waitForURL(/checkout=success/, { timeout: 15000 }).catch(() => {}), page.click('#plans-grid .plan-card.hot .plan-btn')]);
      await page.waitForSelector('#pay-overlay.show', { timeout: 15000 }).catch(() => {});
      const paid = await page.evaluate(() => ({ title: document.getElementById('pay-title').textContent, sub: document.getElementById('pay-sub').textContent, badge: (document.getElementById('acct-plan') || {}).textContent, url: location.search }));
      ok(paid.title === 'Payment successful!' && /Pro plan/.test(paid.sub) && paid.url === '', `checkout: back from Stripe on Pro (${paid.title} / ${paid.sub})`);
      ok(userBlob('browser@x.example').plan === 'pro' && userBlob('browser@x.example').sub.interval === 'year', 'checkout: the account is Pro yearly');
      await shot(page, 'paid-' + w);
      await page.click('#pay-ok');

      // the switch to Business, monthly
      await page.evaluate(() => openPlans());
      await page.waitForTimeout(400);
      const cur = await page.evaluate(() => [...document.querySelectorAll('#plans-grid .plan-card')].map((c) => (c.querySelector('.plan-current') ? 'current' : (c.querySelector('.plan-btn') || {}).textContent)).join('|'));
      ok(cur === 'Cancel in billing|Switch to Pro monthly|Switch to Business', `plans as Pro yearly, monthly view: ${cur}`);
      await page.click('.plans-toggle button:nth-child(2)');
      const curY = await page.evaluate(() => [...document.querySelectorAll('#plans-grid .plan-card')].map((c) => (c.querySelector('.plan-current') ? 'current' : (c.querySelector('.plan-btn') || {}).textContent)).join('|'));
      ok(curY === 'Cancel in billing|current|Switch to Business', `plans as Pro yearly, yearly view: ${curY}`);
      await page.click('.plans-toggle button:nth-child(1)');
      await page.click('#plans-grid .plan-card:nth-child(3) .plan-btn');
      await page.waitForTimeout(800);
      ok(userBlob('browser@x.example').plan === 'business', 'the switch to Business went through');

      // a pack
      await Promise.all([page.waitForURL(/checkout=success/, { timeout: 15000 }).catch(() => {}), page.click('.pack-btn')]);
      await page.waitForSelector('#pay-overlay.show', { timeout: 15000 }).catch(() => {});
      const pk = await page.evaluate(() => ({ title: document.getElementById('pay-title').textContent, sub: document.getElementById('pay-sub').textContent }));
      ok(pk.title === 'Credits added' && /300 AI credits/.test(pk.sub), `a pack comes back as credits (${pk.title}: ${pk.sub})`);
      await page.click('#pay-ok');
      const hint = await page.evaluate(() => { syncCreditsUI(); return document.getElementById('bggen-credits').textContent; });
      ok(/Uses 1 AI credit\. You have 300 \(200 this month \+ 100 bought\)/.test(hint), `the AI hint counts credits (${hint})`);
      await page.context().close();
    }
    ok(!errors.length, 'no CSP or page errors' + (errors.length ? ': ' + errors.slice(0, 4).join(' | ') : ''));
  } finally {
    await browser.close();
    server.close();
  }
}
