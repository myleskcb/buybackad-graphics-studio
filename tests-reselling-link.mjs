/* Tests for reselling-link.js. Run: node --test tests-reselling-link.mjs

   The same harness as tests-iphonesla-link.mjs: the real file in a node:vm
   context with a stubbed page around it (window, the two storages, location,
   history, fetch, timers, a tiny DOM, and the app.js globals the link reads).
   The iPhones LA link is loaded first, as on the page, because this one uses
   its picture check and tag file. Nothing touches the network. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const HERE = new URL('./', import.meta.url);
const IPLA = readFileSync(new URL('iphonesla-link.js', HERE), 'utf8');
const SRC = readFileSync(new URL('reselling-link.js', HERE), 'utf8');

const API = 'https://reselling.us';
const EXCHANGE = API + '/api/studio/exchange';
const BRIEF = API + '/api/studio/brief';
const ADS = API + '/api/studio/ads/in';
const STATUS = API + '/api/studio/status';
const CODE = 'bbac_' + 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1v';
const TOKEN = 'bba_' + 'Zz9Yy8Xx7Ww6Vv5Uu4Tt3Ss2Rr1Qq0Pp9Oo8Nn7Mm6L';
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const b64url = obj => Buffer.from(JSON.stringify(obj), 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const settle = async () => { for (let i = 0; i < 10; i++) await new Promise(r => setImmediate(r)); };

function storage(seed){
  const m = Object.assign({}, seed || {});
  return { _m: m, getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } };
}
function fakeDocument(){
  const mk = tag => ({
    tagName: tag, children: [], parentNode: null, attrs: {}, className: '', textContent: '', style: {},
    appendChild(c){ c.parentNode = this; this.children.push(c); return c; },
    removeChild(c){ const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); c.parentNode = null; return c; },
    setAttribute(k, v){ this.attrs[k] = String(v); },
  });
  return { body: mk('body'), head: mk('head'), createElement: mk, getElementById: () => null, readyState: 'complete',
           addEventListener(){}, querySelector: () => null };
}
const walk = (n, out = []) => { out.push(n); (n.children || []).forEach(c => walk(c, out)); return out; };
const pageText = doc => walk(doc.body).map(n => n.textContent).filter(Boolean).join(' | ');

const TEMPLATES = [
  { id: 'sell_iphone', name: 'Sell Your iPhone', cat: 'phones', layers: [
    { kind: 'text', name: 'Headline 1', role: 'headline', text: 'SELL YOUR IPHONE' },
    { kind: 'text', name: 'Phone', role: 'phone', text: '(555) 123-4567' },
  ] },
];

function studio(opts = {}){
  const calls = [], timers = [], toasts = [], replaced = [], opened = [];
  const doc = fakeDocument();
  const local = opts.local || storage();
  const session = opts.session || storage();
  const location = { hash: opts.hash || '', pathname: '/', search: '', hostname: opts.hostname || 'buybackad-finished-copy.netlify.app',
                     assign(u){ opened.push('assign:' + u); } };
  let respond = opts.respond || (() => ({ status: 200, body: {} }));
  let nextTimer = 1;
  const brand = { kit: opts.kit || null };
  const ctx = {
    localStorage: local, sessionStorage: session, location,
    history: { replaceState(s, t, url){ replaced.push(url); location.hash = ''; } },
    navigator: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/140.0 Safari/537.36' },
    fetch(url, init){
      calls.push({ url: String(url), init: init || {} });
      return Promise.resolve().then(() => respond(String(url), init || {})).then(a => ({
        ok: a.status >= 200 && a.status < 300, status: a.status,
        json: async () => { if (a.body === undefined) throw new Error('no body'); return a.body; },
      }));
    },
    setTimeout(fn, ms){ const id = nextTimer++; timers.push({ id, fn, ms }); return id; },
    clearTimeout(id){ const i = timers.findIndex(t => t.id === id); if (i >= 0) timers.splice(i, 1); },
    addEventListener(){},
    innerHeight: 900,
    FormData, Blob, URL, TextDecoder, atob, AbortController,
    toast(msg, kind){ toasts.push({ msg, kind }); },
    planOf: () => opts.plan || { label: 'Starter', watermark: false },
    planLabel: () => (opts.plan && opts.plan.label) || 'Starter',
    creditsOf: () => opts.credits === undefined ? { allowance: 50, used: 9, left: 41, bought: 0, total: 41 } : opts.credits,
    TEMPLATES,
    getBrand: () => brand.kit,
    jset: (k, v) => { if (k === 'pgfx_brand') brand.kit = JSON.parse(JSON.stringify(v)); },
    resolveArea: async q => ({ home: q + ', CA', zip: '' }),
    setArea: a => { brand.kit = Object.assign({}, brand.kit, { area: a }); },
    showEasy: id => opened.push('easy:' + id),
    openBgGen: o => opened.push('bggen:' + JSON.stringify(o || null)),
  };
  ctx.document = doc;
  ctx.account = 'account' in opts ? opts.account : { email: 'owner@example.com', role: 'user', plan: 'basic' };
  ctx.addHistory = async function(name){ return 'kept:' + name; };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(IPLA, ctx, { filename: 'iphonesla-link.js' });
  vm.runInContext(SRC, ctx, { filename: 'reselling-link.js' });
  return {
    ctx, calls, timers, toasts, replaced, opened, doc, local, session, location, brand,
    setRespond(fn){ respond = fn; },
    ads: () => calls.filter(c => c.url === ADS),
    // what the page does "next turn" (setTimeout 0): opening the asked-for screen
    async runNow(){ const due = timers.filter(t => !t.ms); due.forEach(t => { timers.splice(timers.indexOf(t), 1); t.fn(); }); await settle(); },
    async exportEasy(st = { tpl: 'sell_iphone', vals: {}, hidden: {} }){
      ctx.addHistory('we-buy.png', 1440, PNG, 1440, 1440, { kind: 'ez', st });
      await settle();
    },
  };
}

const linked = () => storage({ rus_link: JSON.stringify({ token: TOKEN, shop: 'Test Shop', connectedAt: '2026-11-12T10:00:00.000Z' }) });
const MAKE = { make: 'webuy', device: 7, family: 'iphone', models: ['iPhone 15 Pro Max'], target: 'iPhone 15 Pro Max', return: API + '/app#studio' };
const okAll = (url) => url === EXCHANGE ? { status: 200, body: { token: TOKEN, shop: 'Test Shop' } }
  : url === BRIEF ? { status: 200, body: { ok: true, shop: { name: 'Test Shop', phone: '(562) 555-0100', area: 'Long Beach' }, limits: { max_upload_bytes: 8388608 } } }
  : { status: 200, body: { ok: true, ad: { id: 1 }, duplicate: false } };

// ───────────── the fragment ─────────────

test('the code and the brief are read and cleared at once, and the code is never stored', async () => {
  const s = studio({ hash: '#bba=' + CODE + '&make=' + b64url(MAKE), respond: okAll });
  assert.deepEqual(s.replaced, ['/']);
  assert.equal(s.location.hash, '');
  await settle();
  const kept = JSON.stringify(s.local._m) + JSON.stringify(s.session._m);
  assert.ok(!kept.includes('bbac_'), 'the connect code is never kept');
  assert.equal(s.calls[0].url, EXCHANGE);
  assert.equal(s.calls[0].init.credentials, 'omit');
  assert.ok(JSON.parse(s.calls[0].init.body).label.startsWith('BUYBACK.AD'));
  assert.equal(JSON.parse(s.local._m.rus_link).token, TOKEN);
});

test("the iPhones LA link's own fragment is left to it", async () => {
  const s = studio({ hash: '#ipla=gfxc_' + 'x'.repeat(30) + '&brief=e30' });
  await settle();
  assert.ok(!s.calls.some(c => c.url.startsWith(API)), 'nothing goes to Reselling.US');
});

test('a brief with no code opens nothing and sends nothing', async () => {
  const s = studio({ hash: '#make=' + b64url(MAKE) });
  await settle();
  assert.equal(s.calls.length, 0);
  assert.deepEqual(s.opened, []);
  assert.equal(s.ctx.resellingLink.state().connected, false);
});

test('a malformed code is refused in words and nothing is sent', async () => {
  const s = studio({ hash: '#bba=nope&make=' + b64url(MAKE) });
  await settle();
  assert.equal(s.calls.length, 0);
  assert.match(s.ctx.resellingLink.state().note, /did not work/);
});

// ───────────── connecting ─────────────

test('connecting fills the brand kit with the shop and opens what was asked for', async () => {
  const s = studio({ hash: '#bba=' + CODE + '&make=' + b64url(MAKE), respond: okAll, kit: { website: 'mine.example' } });
  await settle();
  await s.runNow();
  assert.deepEqual(s.brand.kit, { website: 'mine.example', name: 'Test Shop', phone: '(562) 555-0100', area: { home: 'Long Beach, CA', zip: '' } });
  assert.deepEqual(s.opened, ['easy:null']);
  const st = s.ctx.resellingLink.state();
  assert.equal(st.connected, true);
  assert.equal(st.make.target, 'iPhone 15 Pro Max');
  assert.equal(st.api, API);
});

test('an AI background opens the generator and a video opens the video maker', async () => {
  const bg = studio({ hash: '#bba=' + CODE + '&make=' + b64url({ make: 'background', target: 'iPad Air' }), respond: okAll });
  await settle();
  await bg.runNow();
  assert.deepEqual(bg.opened, ['bggen:{"text":"iPad Air"}']);
  const video = studio({ hash: '#bba=' + CODE + '&make=' + b64url({ make: 'video' }), respond: okAll });
  await settle();
  await video.runNow();
  assert.deepEqual(video.opened, ['assign:motion/index.html']);
});

test('a return address off Reselling.US is dropped', async () => {
  const s = studio({ hash: '#bba=' + CODE + '&make=' + b64url({ make: 'webuy', return: 'https://evil.example/' }), respond: okAll });
  await settle();
  assert.equal(s.ctx.resellingLink.state().make.return, undefined);
});

test('a refused exchange says so and keeps nothing', async () => {
  const s = studio({ hash: '#bba=' + CODE, respond: () => ({ status: 400, body: { detail: 'That connect code is not valid.' } }) });
  await settle();
  assert.equal(s.local._m.rus_link, undefined);
  assert.equal(s.ctx.resellingLink.state().note, 'That connect code is not valid.');
});

test('the studio talks to a Reselling.US on this machine only when it is served from localhost', () => {
  assert.equal(studio({ hostname: 'localhost' }).ctx.resellingLink.state().api, 'http://localhost:8800');
  assert.equal(studio({ hostname: 'buybackad-finished-copy.netlify.app' }).ctx.resellingLink.state().api, API);
  assert.equal(studio({ hostname: 'localhost.evil.example' }).ctx.resellingLink.state().api, API);
});

// ───────────── what goes back ─────────────

test('an export goes to the shop with what to make, the device and the tag file', async () => {
  const s = studio({ local: linked(), session: storage({ rus_make: JSON.stringify(MAKE) }), respond: okAll });
  await settle();
  await s.exportEasy();
  const sent = s.ads();
  assert.equal(sent.length, 1);
  const fd = sent[0].init.body;
  assert.equal(sent[0].init.headers.Authorization, 'Bearer ' + TOKEN);
  assert.equal(sent[0].init.credentials, 'omit');
  assert.equal(fd.get('make'), 'webuy');
  assert.equal(fd.get('device'), '7');
  const graphic = JSON.parse(fd.get('graphic'));
  assert.deepEqual(graphic.texts.map(t => t.text), ['SELL YOUR IPHONE'], 'the phone line never rides in the tag file');
  assert.match(s.ctx.resellingLink.state().note, /Sent to your ads in Reselling.US/);
});

test('a picture with a website is kept here, worded for Reselling.US', async () => {
  const s = studio({ local: linked(), respond: okAll });
  await settle();
  await s.exportEasy({ tpl: 'sell_iphone', vals: { sell_iphone: { 'Headline 1': 'visit myshop.com' } }, hidden: {} });
  assert.equal(s.ads().length, 0);
  assert.match(s.ctx.resellingLink.state().note, /^Not sent to Reselling\.US: this picture shows a website/);
});

test('a watermarked export is kept here', async () => {
  const s = studio({ local: linked(), respond: okAll, plan: { label: 'Free', watermark: true } });
  await settle();
  await s.exportEasy();
  assert.equal(s.ads().length, 0);
  assert.match(s.ctx.resellingLink.state().note, /watermark/);
});

test('a revoked connection is forgotten on its next request', async () => {
  const s = studio({ local: linked(), respond: url => url === BRIEF ? { status: 401, body: {} } : okAll(url) });
  await settle();
  assert.equal(s.local._m.rus_link, undefined);
  assert.match(s.ctx.resellingLink.state().note, /ended this connection/);
});

test("nothing is sent when this browser is not connected", async () => {
  const s = studio({ respond: okAll });
  await s.exportEasy();
  assert.equal(s.calls.length, 0);
});

// ───────────── the studio's own balance ─────────────

test('the plan and credits are said in labels and counts, never the email', async () => {
  const s = studio({ local: linked(), respond: okAll });
  await settle();
  const sent = s.calls.filter(c => c.url === STATUS);
  assert.equal(sent.length, 0, 'the first report waits a moment, so a burst of redraws is one');
  await Promise.all(s.timers.splice(0).map(t => t.fn()));
  await settle();
  const report = s.calls.filter(c => c.url === STATUS);
  assert.equal(report.length, 1);
  const body = JSON.parse(report[0].init.body);
  assert.deepEqual(body, { signed_in: true, plan: 'basic', plan_label: 'Starter', credits_left: 41, credits_month: 41, credits_bought: 0 });
  assert.ok(!report[0].init.body.includes('owner@example.com'));
});

test('signed out, the studio says only that', () => {
  const s = studio({ local: linked(), account: null });
  assert.deepEqual(JSON.parse(JSON.stringify(s.ctx.resellingLink.statusNow())), { signed_in: false });
});

test('the token is never handed out', async () => {
  const s = studio({ local: linked(), respond: okAll });
  await settle();
  assert.ok(!JSON.stringify(s.ctx.resellingLink.state()).includes(TOKEN));
});

test('BUYBACK.AD is never called a partner here', () => {
  assert.ok(!/partner/i.test(SRC));
});
