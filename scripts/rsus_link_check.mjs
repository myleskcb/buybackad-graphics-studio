#!/usr/bin/env node
/* THE PLAN A RESELLING.US PLAN INCLUDES, CHECKED (netlify/lib/rsus.mjs, netlify/lib/plans.mjs planOf,
   netlify/functions/api.mjs /rsus/claim, DESIGN-LAW 187). The real function on a stand-in
   @netlify/blobs, with a stand-in Reselling.US answering its fetches:

   1. The token. Reselling.US's golden token (resale/tests/test_webuyad.py there: the same secret,
      shop, plan, times and nonce) reads back here; a changed body, a changed signature, another
      secret, an expired one and a short secret are refused.
   2. What an account may do. planOf is the higher of the billed plan and the included one while it
      holds; Free + included Starter is Starter, billed Business + included Pro is Business.
   3. The claim. Signed out is 401; signed in, the plan is on (credits, downloads, no watermark),
      `billed` stays free; the same token again is 409; another account claiming the shop moves it;
      checkout refuses a plan the included one already covers.
   4. The check-back. Every few hours Reselling.US is asked (signed); a move up is followed, a shop
      back on Free ends it, and no answer keeps it until its own date.

   usage:  node scripts/rsus_link_check.mjs            exits non-zero on any failure
           node scripts/rsus_link_check.mjs --serve 8971
             serves the site and the function (stand-in store) on that port for a local run against
             a local Reselling.US: RSUS_URL=http://localhost:8961 RSUS_LINK_SECRET=<its secret> */
import { mkdirSync, writeFileSync, cpSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { createHmac } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { join, extname } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const bad = [];
let passed = 0;
const ok = (cond, what) => { if (cond) passed++; else bad.push(what); return cond; };

const T = join(tmpdir(), 'rsus-check-' + process.pid);
rmSync(T, { recursive: true, force: true });
mkdirSync(join(T, 'netlify'), { recursive: true });
cpSync(join(ROOT, 'netlify'), join(T, 'netlify'), { recursive: true });
mkdirSync(join(T, 'node_modules/@netlify/blobs'), { recursive: true });
writeFileSync(join(T, 'node_modules/@netlify/blobs/package.json'), JSON.stringify({ name: '@netlify/blobs', type: 'module', main: 'index.js' }));
writeFileSync(join(T, 'node_modules/@netlify/blobs/index.js'), [
  'export const all = new Map();',
  'export const getStore = (o) => { const n = typeof o === "string" ? o : o.name; if (!all.has(n)) all.set(n, new Map()); const m = all.get(n);',
  '  return { get: async (k) => (m.has(k) ? m.get(k) : null), set: async (k, v) => { m.set(k, v); }, delete: async (k) => { m.delete(k); }, list: async (o) => ({ blobs: [...m.keys()].filter((k) => !(o && o.prefix) || k.startsWith(o.prefix)).map((key) => ({ key })) }) }; };',
].join('\n'));

const SERVE = process.argv.includes('--serve') ? parseInt(process.argv[process.argv.indexOf('--serve') + 1], 10) : 0;
const env = process.env;
for (const k of ['STRIPE_SECRET', 'STRIPE_WEBHOOK_SECRET', 'SITE_URL', 'URL', 'FAL_KEY', 'GEMINI_KEY']) delete env[k];
env.JWT_SECRET = env.JWT_SECRET || 'rsus-check-' + 'x'.repeat(32);
const SECRET = 'rsus-link-test-secret-0123456789abcdef';
if (!SERVE) { env.RSUS_LINK_SECRET = SECRET; env.RSUS_URL = 'https://rsus.example'; }

const api = (await import(pathToFileURL(join(T, 'netlify/functions/api.mjs')).href)).default;
const plans = await import(pathToFileURL(join(T, 'netlify/lib/plans.mjs')).href);
const rsus = await import(pathToFileURL(join(T, 'netlify/lib/rsus.mjs')).href);
const blobs = await import(pathToFileURL(join(T, 'node_modules/@netlify/blobs/index.js')).href);

/* ---------- --serve: the site and the function on one port, for a local run ---------- */
if (SERVE) {
  const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
  createServer(async (req, res) => {
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
      res.writeHead(200, { 'Content-Type': TYPES[extname(f)] || 'application/octet-stream' });
      res.end(readFileSync(f));
    } catch (e) { res.writeHead(500); res.end(String(e)); }
  }).listen(SERVE, '127.0.0.1', () => console.log('rsus_link_check: serving on http://localhost:' + SERVE + ' (RSUS_URL ' + rsus.rsusUrl(env) + ', link ' + (rsus.rsusOn(env) ? 'on' : 'OFF') + ')'));
} else {

/* ---------- a stand-in Reselling.US ---------- */
let rsusAnswer = { plan: 'basic', name: 'Starter', via: 'Side Hustle', until: Date.now() + 20 * 86400e3 }, rsusDown = false, rsusAsked = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const u = new URL(typeof input === 'string' ? input : input.url);
  if (u.hostname === 'rsus.example') {
    const sig = (init.headers || {})[rsus.SIGNATURE_HEADER];
    const want = createHmac('sha256', SECRET).update(init.body).digest('base64url');
    rsusAsked.push({ path: u.pathname, body: JSON.parse(init.body), signed: sig === want });
    if (rsusDown) throw new Error('connect ECONNREFUSED');
    const body = JSON.parse(init.body);
    return new Response(JSON.stringify({ shop: body.shop, ...rsusAnswer }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  return realFetch(input, init);
};

const b64u = (s) => Buffer.from(s).toString('base64url');
const token = (fields, secret = SECRET) => {
  const body = b64u(JSON.stringify({ v: 1, shop: 7, plan: 'basic', name: 'Starter', via: 'Side Hustle', until: Date.now() + 20 * 86400e3,
    exp: Date.now() + 15 * 60e3, n: [...crypto.getRandomValues(new Uint8Array(16))].map((x) => x.toString(16).padStart(2, '0')).join(''), ...fields }));
  return body + '.' + createHmac('sha256', secret).update(body).digest('base64url');
};
const hit = async (method, path, body, tok) => {
  const res = await api(new Request('https://studio.example/api' + path, {
    method, headers: Object.assign({ 'Content-Type': 'application/json' }, tok ? { Authorization: 'Bearer ' + tok } : {}),
    body: body === undefined ? undefined : JSON.stringify(body),
  }));
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch (e) { /* text */ }
  return { status: res.status, json };
};
const signup = async (email) => (await hit('POST', '/auth/signup', { email, password: 'a-long-password' })).json.token;
const users = () => blobs.all.get('pgfx-users');
const userBlob = (em) => JSON.parse(users().get('u:' + em));
const setUser = (u) => users().set('u:' + u.email, JSON.stringify(u));

/* ---------- 1. the token ---------- */
{
  const GOLDEN = 'eyJ2IjoxLCJzaG9wIjo3LCJwbGFuIjoiYmFzaWMiLCJuYW1lIjoiU3RhcnRlciIsInZpYSI6IlNpZGUgSHVzdGxlIiwidW50aWwiOjE3OTk5OTk5OTk5OTksImV4cCI6MTc2NDA4MDkwMDAwMCwibiI6IjAwMTEyMjMzNDQ1NTY2Nzc4ODk5YWFiYmNjZGRlZWZmIn0.vecV7nthRZB2ehIJzbG5pIUfsJ3mdDqvRjhgK5qfU5E';
  const at = 1764080000000 + 1;
  const g = await rsus.readLinkToken(GOLDEN, env, at);
  ok(g.data && g.data.shop === 7 && g.data.plan === 'basic' && g.data.name === 'Starter' && g.data.via === 'Side Hustle' && g.data.until === 1799999999999,
    "Reselling.US's golden token reads back (shop 7, Starter, Side Hustle)");
  ok((await rsus.readLinkToken(GOLDEN, env, 1764080900000 + 1)).error === 'expired', 'the golden token is expired after its exp');
  const [body, sig] = GOLDEN.split('.');
  const flip = (s) => s.slice(0, -2) + (s.slice(-2, -1) === 'A' ? 'B' : 'A') + s.slice(-1);
  ok((await rsus.readLinkToken(flip(body) + '.' + sig, env, at)).error === 'bad', 'a changed body is refused');
  ok((await rsus.readLinkToken(body + '.' + flip(sig), env, at)).error === 'bad', 'a changed signature is refused');
  ok((await rsus.readLinkToken(token({}, 'another-secret-another-secret-another'), env)).error === 'bad', 'a token signed with another secret is refused');
  ok((await rsus.readLinkToken(token({ plan: 'enterprise' }), env)).error === 'bad', 'a plan we do not have is refused');
  ok((await rsus.readLinkToken(token({}), { RSUS_LINK_SECRET: 'short' })).error === 'bad', 'a short secret switches the link off');
  ok(!!(await rsus.readLinkToken(token({}), env)).data, 'a fresh token reads');
}

/* ---------- 2. what an account may do ---------- */
{
  const now = Date.now();
  ok(plans.planOf({ plan: 'free', rsus: { plan: 'basic', until: now + 1e6 } }) === 'basic', 'Free with included Starter is Starter');
  ok(plans.planOf({ plan: 'business', rsus: { plan: 'pro', until: now + 1e6 } }) === 'business', 'billed Business with included Pro stays Business');
  ok(plans.planOf({ plan: 'basic', rsus: { plan: 'business', until: now + 1e6 } }) === 'business', 'billed Starter with included Business is Business');
  ok(plans.planOf({ plan: 'free', rsus: { plan: 'pro', until: now - 1 } }) === 'free', 'an included plan past its date is nothing');
  ok(plans.creditState({ plan: 'free', rsus: { plan: 'basic', until: now + 1e6 } }).allowance === plans.PLANS.basic.credits, "the month's AI credits are the included plan's");
}

/* ---------- 3. the claim ---------- */
{
  ok((await hit('POST', '/rsus/claim', { t: token({}) })).status === 401, 'claiming signed out is 401 (the page opens the sign-in)');
  const a = await signup('alex@shop.example');
  const t1 = token({});
  const r = await hit('POST', '/rsus/claim', { t: t1 }, a);
  ok(r.status === 200 && r.json.user.plan === 'basic' && r.json.user.billed === 'free' && r.json.user.included.active && r.json.user.included.via === 'Side Hustle',
    'a claim switches Starter on: plan basic, billed free, included from Side Hustle');
  ok(r.json.user.credits.allowance === plans.PLANS.basic.credits, "the account's credits are Starter's");
  const e = await hit('POST', '/export', { kind: 'photo' }, a);
  ok(e.status === 200 && e.json.watermark === false && e.json.maxPx === plans.PLANS.basic.maxPx && e.json.remaining === plans.PLANS.basic.monthly - 1,
    "a download is Starter's: no watermark, Starter's size, 100 a month");
  ok((await hit('POST', '/export/check', { kind: 'video' }, a)).status === 403, 'Starter has no video downloads');
  ok((await hit('POST', '/rsus/claim', { t: t1 }, a)).status === 409, 'the same token again is 409');
  ok((await hit('POST', '/rsus/claim', { t: token({ exp: Date.now() - 1 }) }, a)).status === 400, 'an expired token is 400');
  ok(users().get('rsus:shop:7') === 'alex@shop.example', 'the shop index names the account');
  env.STRIPE_SECRET = 'sk_test_rsus_check';   // billing on: the refusal must come before any Stripe call
  let stripeCalled = false;
  const before = globalThis.fetch;
  globalThis.fetch = async (input, init) => { if (new URL(typeof input === 'string' ? input : input.url).hostname.endsWith('stripe.com')) { stripeCalled = true; return new Response('{}', { status: 500 }); } return before(input, init); };
  const co = await hit('POST', '/checkout', { plan: 'basic', interval: 'month', consent: true }, a);
  ok(co.status === 409 && co.json.included === true && /already includes Starter/.test(co.json.error) && !stripeCalled,
    'checkout of the plan already included is refused (409) before Stripe is asked');
  const co2 = await hit('POST', '/checkout', { plan: 'pro', interval: 'month', consent: true }, a);
  ok(co2.status !== 409 || !co2.json.included, 'a plan above the included one can still be bought');
  globalThis.fetch = before; delete env.STRIPE_SECRET;

  // another account claiming the same shop moves the plan
  const b = await signup('bo@shop.example');
  const r2 = await hit('POST', '/rsus/claim', { t: token({ plan: 'pro', name: 'Pro', via: 'Reseller' }) }, b);
  ok(r2.status === 200 && r2.json.moved === true && r2.json.user.plan === 'pro', 'a second account claiming the shop gets it (moved)');
  ok(!userBlob('alex@shop.example').rsus && (await hit('GET', '/me', undefined, a)).json.user.plan === 'free', 'and the first account no longer has it');
  ok(users().get('rsus:shop:7') === 'bo@shop.example', 'the shop index follows');
}

/* ---------- 4. the check-back ---------- */
{
  const b = (await hit('POST', '/auth/login', { email: 'bo@shop.example', password: 'a-long-password' })).json.token;
  const age = (hours) => { const u = userBlob('bo@shop.example'); u.rsus.checkedAt = Date.now() - hours * 3600e3; setUser(u); };
  rsusAsked = [];
  ok((await hit('GET', '/me', undefined, b)).json.user.plan === 'pro' && rsusAsked.length === 0, 'a plan checked lately is not asked about');
  age(7); rsusAnswer = { plan: 'business', name: 'Business', via: 'Enterprise', until: Date.now() + 30 * 86400e3 };
  const up = (await hit('GET', '/me', undefined, b)).json.user;
  ok(rsusAsked.length === 1 && rsusAsked[0].signed && rsusAsked[0].path === '/api/partner/webuyad/plan' && rsusAsked[0].body.shop === 7,
    'after six hours Reselling.US is asked, signed, about shop 7');
  ok(up.plan === 'business' && up.included.via === 'Enterprise', 'a move up there is followed here');
  age(7); rsusDown = true;
  ok((await hit('GET', '/me', undefined, b)).json.user.plan === 'business', 'no answer: the plan holds until its own date');
  rsusDown = false; age(7); rsusAnswer = { plan: null };
  const off = (await hit('GET', '/me', undefined, b)).json.user;
  ok(off.plan === 'free' && off.included && off.included.active === false, 'a shop back on Free ends it here');
  const u = userBlob('bo@shop.example'); u.rsus.until = Date.now() - 31 * 86400e3; u.rsus.checkedAt = 0; setUser(u);
  rsusAsked = [];
  await hit('GET', '/me', undefined, b);
  ok(rsusAsked.length === 0, 'a plan ended over a month ago is not asked about again');
}

/* ---------- 5. off without the secret ---------- */
{
  delete env.RSUS_LINK_SECRET;
  const c = await signup('cy@shop.example');
  ok((await hit('POST', '/rsus/claim', { t: token({}) }, c)).status === 503, 'without RSUS_LINK_SECRET the claim says it is not connected (503)');
}

rmSync(T, { recursive: true, force: true });
console.log('rsus_link_check: ' + passed + ' passed, ' + bad.length + ' failed');
for (const b of bad) console.log('  FAIL: ' + b);
process.exit(bad.length ? 1 : 0);
}
