/* Tests for iphonesla-link.js. Run: node --test tests-iphonesla-link.mjs

   The studio has no build and no test runner, so this loads the real file in a
   node:vm context with a stubbed page around it: window, the two storages,
   location, history, fetch, timers, a tiny DOM, and the handful of app.js
   globals the link reads. Nothing here touches the network. Test names are
   sentences, because a red one should say what stopped being true. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const HERE = new URL('./', import.meta.url);
const SRC = readFileSync(new URL('iphonesla-link.js', HERE), 'utf8');

const API = 'https://iphones.la';
const EXCHANGE = API + '/api/buy-ads/studio/exchange';
const IMAGES = API + '/api/buy-ads/studio/images';
const BRIEF = API + '/api/buy-ads/studio/brief';
const CODE = 'gfxc_' + 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1v';
const TOKEN = 'gfx_' + 'Zz9Yy8Xx7Ww6Vv5Uu4Tt3Ss2Rr1Qq0Pp9Oo8Nn7Mm6L';
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const plain = x => JSON.parse(JSON.stringify(x));
const b64url = obj => Buffer.from(JSON.stringify(obj), 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const settle = async () => { for (let i = 0; i < 6; i++) await new Promise(r => setImmediate(r)); };

function storage(seed){
  const m = Object.assign({}, seed || {});
  return { _m: m, getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } };
}
function fakeDocument(){
  const mk = tag => ({
    tagName: tag, children: [], parentNode: null, attrs: {}, className: '', textContent: '',
    appendChild(c){ c.parentNode = this; this.children.push(c); return c; },
    removeChild(c){ const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); c.parentNode = null; return c; },
    setAttribute(k, v){ this.attrs[k] = String(v); },
  });
  const byId = {};
  return { body: mk('body'), head: mk('head'), createElement: mk, getElementById: id => byId[id] || null, _byId: byId };
}
const walk = (n, out = []) => { out.push(n); (n.children || []).forEach(c => walk(c, out)); return out; };
const pageText = doc => walk(doc.body).map(n => n.textContent).filter(Boolean).join(' | ');
const backLink = doc => walk(doc.body).find(n => n.tagName === 'a');

/* One stubbed studio page. `respond(url, init)` answers a fetch: return
   {status, body}, or throw for a dead network. */
function studio(opts = {}){
  const log = [];            // the order things happened in
  const calls = [];          // every fetch
  const timers = [];
  const listeners = {};
  const toasts = [];
  const replaced = [];
  const doc = opts.document === undefined ? fakeDocument() : opts.document;
  const local = opts.local || storage();
  const session = opts.session || storage();
  const location = { hash: opts.hash || '', pathname: '/', search: opts.search || '' };
  let respond = opts.respond || (() => ({ status: 200, body: {} }));
  let nextTimer = 1;

  const ctx = {
    localStorage: local, sessionStorage: session, location,
    history: { replaceState(s, t, url){ log.push('replaceState'); replaced.push(url); location.hash = ''; } },
    navigator: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/140.0 Safari/537.36' },
    fetch(url, init){
      log.push('fetch');
      calls.push({ url: String(url), init: init || {} });
      if (opts.fetchThrowsSync) throw new Error('fetch blew up');
      return Promise.resolve().then(() => respond(String(url), init || {})).then(a => ({
        ok: a.status >= 200 && a.status < 300, status: a.status,
        json: async () => { if (a.json) return a.json(); if (a.body === undefined) throw new Error('no body'); return a.body; },
      }));
    },
    setTimeout(fn, ms){ const id = nextTimer++; timers.push({ id, fn, ms }); return id; },
    clearTimeout(id){ const i = timers.findIndex(t => t.id === id); if (i >= 0) timers.splice(i, 1); },
    addEventListener(type, fn){ (listeners[type] = listeners[type] || []).push(fn); },
    FormData: opts.FormData || FormData, Blob, URL, TextDecoder, atob, AbortController,
    toast(msg, kind){ toasts.push({ msg, kind }); },
    planOf: () => opts.plan || { label: 'Free', watermark: true },
    TEMPLATES: opts.templates || TEMPLATES,
    downscaleDataUrl: opts.downscale,
  };
  if (doc) ctx.document = doc;
  if (!('account' in opts)) ctx.account = { email: 'owner@example.com', role: 'admin', plan: 'free' };
  else if (opts.account !== 'unreadable') ctx.account = opts.account;
  if (opts.addHistory !== null){
    ctx.addHistory = opts.addHistory || async function(name){ log.push('original'); return 'kept:' + name; };
  }
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(SRC, ctx, { filename: 'iphonesla-link.js' });

  return {
    ctx, log, calls, timers, toasts, replaced, listeners, doc, local, session, location,
    setRespond(fn){ respond = fn; },
    uploads: () => calls.filter(c => c.url === IMAGES),
    // run the timers due for a reason: toasts wait 1500 ms, retries wait longer
    async runTimers(pred = () => true){
      const due = timers.filter(pred);
      due.forEach(t => { timers.splice(timers.indexOf(t), 1); t.fn(); });
      await settle();
      return due.length;
    },
    async exportAdvanced(name = 'we-buy-iphones-1440x1440.png', json = { objects: [{ type: 'i-text', pgRole: 'headline', text: 'WE BUY IPHONES' }] }){
      const out = ctx.addHistory(name, 1440, PNG, 1440, 1440, { kind: 'adv', json, tplId: 'sell_iphone', name: 'Sell Your iPhone' });
      await settle();
      return out;
    },
  };
}

const TEMPLATES = [
  { id: 'sell_iphone', name: 'Sell Your iPhone', layers: [
    { kind: 'text', name: 'Headline 1', role: 'headline', text: 'SELL YOUR' },
    { kind: 'text', name: 'Phone', role: 'phone', text: '(555) 123-4567' },
    { kind: 'text', name: 'Site', role: 'website', text: 'yoursite.com' },
  ] },
  { id: 'no_phone', name: 'Plain', layers: [{ kind: 'text', name: 'Headline 1', role: 'headline', text: 'WE BUY PHONES' }] },
];
const linked = () => storage({ ipla_link: JSON.stringify({ token: TOKEN, connectedAt: '2026-09-19T10:00:00.000Z' }) });
const BRIEF_TAGS = { family: 'iphone', target: 'iPhone 15 Pro Max', models: ['iPhone 15 Pro', 'iPhone 15 Pro Max'], angle: 'damaged', tone: 'urgent', headline: 'We buy cracked iPhones', area: 'Long Beach', return: 'https://iphones.la/repost#configurator' };

// ───────────── the fragment ─────────────

test('the fragment is read and cleared at once, before any request, and the query string survives', async () => {
  const s = studio({ hash: '#ipla=' + CODE + '&brief=' + b64url(BRIEF_TAGS), search: '?look=night', respond: () => ({ status: 200, body: { token: TOKEN, shop: 'iPhones LA' } }) });
  // vm.runInContext has only just returned: nothing async has had a turn yet.
  assert.deepEqual(s.replaced, ['/?look=night']);
  assert.equal(s.location.hash, '');
  assert.equal(s.log[0], 'replaceState', 'the address bar is cleaned before the first fetch');
  await settle();
  const kept = JSON.stringify(s.local._m) + JSON.stringify(s.session._m);
  assert.ok(!kept.includes('gfxc_'), 'the connect code is never stored');
});

test('an anchor that is not ours is left alone and nothing is sent', async () => {
  const s = studio({ hash: '#plans' });
  await settle();
  assert.deepEqual(s.replaced, []);
  assert.equal(s.location.hash, '#plans');
  assert.equal(s.calls.length, 0);
});

test('when replaceState is refused the fragment is still cleared', async () => {
  const s = studio({ hash: '#ipla=' + CODE });
  // same page again, this time with a history that throws
  const loc = { hash: '#ipla=' + CODE, pathname: '/', search: '' };
  const ctx = Object.assign({}, s.ctx, { location: loc, history: { replaceState(){ throw new Error('SecurityError'); } }, localStorage: storage(), sessionStorage: storage(), document: fakeDocument() });
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(SRC, ctx);
  assert.equal(loc.hash, '');
});

test('the API origin is hard-coded and nothing in a fragment can change it', async () => {
  const evil = 'https://evil.example';
  const brief = Object.assign({}, BRIEF_TAGS, { api: evil, origin: evil, exchange: evil + '/x', return: evil + '/repost#configurator' });
  const s = studio({
    hash: '#ipla=' + CODE + '&api=' + encodeURIComponent(evil) + '&origin=' + encodeURIComponent(evil) + '&exchange=' + encodeURIComponent(evil + '/x') + '&brief=' + b64url(brief),
    respond: url => (url === EXCHANGE ? { status: 200, body: { token: TOKEN, library_url: evil + '/library' } } : { status: 200, body: { photo: { id: 1 }, duplicate: false } }),
  });
  await settle();
  await s.exportAdvanced();
  assert.ok(s.calls.length >= 2);
  for (const c of s.calls) assert.ok(c.url.startsWith(API + '/api/buy-ads/studio/'), 'went to ' + c.url);
  assert.equal(s.ctx.iplaLink.state().brief.return, undefined, 'a return address off the shop is dropped');
  assert.equal(backLink(s.doc).href, 'https://iphones.la/repost#configurator');
  assert.ok(!JSON.stringify(plain(s.ctx.iplaLink.state())).includes('evil'));
});

test('a return address is kept only when it is exactly the shop', async () => {
  const href = async r => { const s = studio({ hash: '#ipla=' + CODE + '&brief=' + b64url({ family: 'iphone', return: r }), respond: () => ({ status: 200, body: { token: TOKEN } }) }); await settle(); assert.equal(backLink(s.doc).attrs.target, '_blank'); assert.equal(backLink(s.doc).attrs.rel, 'noopener'); return backLink(s.doc).href; };
  assert.equal(await href('https://iphones.la/repost?tab=1#configurator'), 'https://iphones.la/repost?tab=1#configurator');
  for (const bad of ['https://iphones.la.evil.example/repost', 'https://user:pw@iphones.la/repost', 'http://iphones.la/repost', 'https://www.iphones.la/repost', 'javascript:alert(1)', '//evil.example', 42]){
    assert.equal(await href(bad), 'https://iphones.la/repost#configurator', String(bad));
  }
});

// ───────────── connect ─────────────

test('the exchange is called once, with no cookie and no token, and the token is stored', async () => {
  const s = studio({ hash: '#ipla=' + CODE, respond: () => ({ status: 200, body: { token: TOKEN, shop: 'iPhones LA', library_url: 'https://iphones.la/repost#configurator' } }) });
  await settle();
  assert.equal(s.calls.length, 1);
  const c = s.calls[0];
  assert.equal(c.url, EXCHANGE);
  assert.equal(c.init.method, 'POST');
  assert.equal(c.init.credentials, 'omit');
  assert.equal(c.init.headers.Authorization, undefined);
  const body = JSON.parse(c.init.body);
  assert.deepEqual(Object.keys(body).sort(), ['code', 'label']);
  assert.equal(body.code, CODE);
  assert.equal(body.label, 'Graphics Studio, Chrome on Mac');
  const kept = JSON.parse(s.local._m.ipla_link);
  assert.deepEqual(Object.keys(kept).sort(), ['connectedAt', 'token']);
  assert.equal(kept.token, TOKEN);
  assert.ok(!Number.isNaN(Date.parse(kept.connectedAt)));
  assert.equal(s.ctx.iplaLink.state().connected, true);
  assert.ok(!JSON.stringify(plain(s.ctx.iplaLink.state())).includes(TOKEN), 'the handle never returns the token');
  await s.runTimers();
  assert.deepEqual(plain(s.toasts), [{ msg: 'Connected to iPhones LA', kind: 'success' }]);
  assert.match(pageText(s.doc), /Connected to iPhones LA/);
  assert.match(pageText(s.doc), /Back to Auto-post/);
});

test('a reload does not trade a code again: it asks once whether the link still stands', async () => {
  const s = studio({ local: linked(), respond: () => ({ status: 200, body: { ok: true, limits: { max_upload_bytes: 4000000 } } }) });
  await settle();
  assert.equal(s.calls.length, 1);
  assert.equal(s.calls[0].url, BRIEF);
  assert.equal(s.calls[0].init.credentials, 'omit');
  assert.equal(s.calls[0].init.headers.Authorization, 'Bearer ' + TOKEN);
  assert.equal(s.ctx.iplaLink.state().maxBytes, 4000000, 'the server may lower the upload ceiling');
});

test('the server cannot raise the upload ceiling past 8 MB', async () => {
  const s = studio({ local: linked(), respond: () => ({ status: 200, body: { limits: { max_upload_bytes: 900000000 } } }) });
  await settle();
  assert.equal(s.ctx.iplaLink.state().maxBytes, 8 * 1024 * 1024);
});

test('a code that is not shaped like one is never sent anywhere', async () => {
  for (const bad of ['hello', 'gfxc_short', 'gfx_' + 'a'.repeat(40), 'gfxc_' + 'a'.repeat(30) + '/../x', '']){
    const s = studio({ hash: '#ipla=' + encodeURIComponent(bad) });
    await settle();
    assert.equal(s.calls.length, 0, bad);
    assert.equal(s.local._m.ipla_link, undefined);
  }
});

test('a refused exchange stores nothing, says the server\'s sentence, and is not tried again', async () => {
  const s = studio({ hash: '#ipla=' + CODE, respond: () => ({ status: 400, body: { detail: 'That link has expired or was already used.' } }) });
  await settle();
  await s.runTimers();
  await settle();
  assert.equal(s.calls.length, 1);
  assert.equal(s.local._m.ipla_link, undefined);
  assert.equal(s.ctx.iplaLink.state().connected, false);
  assert.equal(s.ctx.iplaLink.state().note, 'That link has expired or was already used.');
});

test('a dead network during the exchange says so and keeps the page working', async () => {
  const s = studio({ hash: '#ipla=' + CODE, respond: () => { throw new Error('offline'); } });
  await settle();
  assert.equal(s.calls.length, 1);
  assert.match(s.ctx.iplaLink.state().note, /Could not reach iPhones LA/);
  assert.equal(await s.exportAdvanced('a.png'), 'kept:a.png');
  assert.equal(s.uploads().length, 0);
});

test('a token that is not shaped like one is not kept', async () => {
  const s = studio({ hash: '#ipla=' + CODE, respond: () => ({ status: 200, body: { token: 'Bearer something else' } }) });
  await settle();
  assert.equal(s.local._m.ipla_link, undefined);
  assert.equal(s.ctx.iplaLink.state().connected, false);
});

// ───────────── the brief ─────────────

test('a brief is kept for the session and its tags ride on each upload', async () => {
  const session = storage();
  const local = storage();
  const first = studio({ hash: '#ipla=' + CODE + '&brief=' + b64url(BRIEF_TAGS), local, session, respond: () => ({ status: 200, body: { token: TOKEN } }) });
  await settle();
  assert.deepEqual(JSON.parse(session._m.ipla_verified_brief).models, BRIEF_TAGS.models);

  // the same tab, reloaded: no fragment this time
  const s = studio({ local, session, respond: url => (url === IMAGES ? { status: 200, body: { photo: { id: 7, selected: false }, duplicate: false } } : { status: 200, body: {} }) });
  await settle();
  assert.equal(s.ctx.iplaLink.state().brief.headline, 'We buy cracked iPhones');
  await s.exportAdvanced('one.png');
  await s.exportAdvanced('two.png');
  const ups = s.uploads();
  assert.equal(ups.length, 2);
  for (const u of ups){
    assert.equal(u.init.method, 'POST');
    assert.equal(u.init.credentials, 'omit');
    assert.equal(u.init.headers.Authorization, 'Bearer ' + TOKEN);
    assert.equal(u.init.headers['Content-Type'], undefined, 'the browser writes the multipart boundary');
    const fd = u.init.body;
    assert.equal(fd.get('family'), 'iphone');
    assert.equal(fd.get('target'), 'iPhone 15 Pro Max');
    assert.deepEqual(JSON.parse(fd.get('models')), BRIEF_TAGS.models);
    assert.equal(fd.get('angle'), 'damaged');
    assert.equal(fd.get('tone'), 'urgent');
    assert.equal(fd.get('headline'), 'We buy cracked iPhones');
    assert.equal(fd.get('source_ref'), 'sell_iphone');
    assert.equal(fd.get('area'), null, 'the images route has no area field');
    assert.equal(fd.get('file').type, 'image/png');
    assert.ok(fd.get('file').size > 50);
  }
  assert.equal(ups[0].init.body.get('file').name, 'one.png');
  assert.equal(first.ctx.iplaLink.state().brief.area, 'Long Beach');
});

test('a new tab has no brief, so an upload carries only where the picture came from and what is on it', async () => {
  const s = studio({ local: linked(), respond: url => (url === IMAGES ? { status: 200, body: { photo: { id: 1 } } } : { status: 200, body: {} }) });
  await settle();
  await s.exportAdvanced();
  const fd = s.uploads()[0].init.body;
  assert.deepEqual([...fd.keys()].sort(), ['file', 'graphic', 'source_ref']);
});

// ───────────── the tag file: what is in the picture ─────────────

const CONSOLE_TPL = { id: 'sc-console', name: 'Console Buyer', cat: 'phones', layers: [
  { kind: 'text', name: 'Headline 1', role: 'headline', text: 'CONSOLE BUYER' },
  { kind: 'text', name: 'Sub', role: 'sub', text: 'PS5 · XBOX · SWITCH' },
  { kind: 'text', name: 'Hidden line', role: 'info', text: 'NOT DRAWN' },
  { kind: 'badges', name: 'Badges', role: 'badges', text: 'SAME DAY' },
  { kind: 'cutout', name: 'Hero Product', role: 'photo', props: { src: 'assets/cutouts/console-single.webp' } },
  { kind: 'cutout', name: 'Second', role: 'photo', props: { src: 'assets/cutouts/controller-pair.webp' } },
  { kind: 'path', name: 'Cursor', role: 'deco', props: {} },
] };

test('an Easy Mode export says what is drawn on it: its words, badges and products, never a hidden layer', async () => {
  const s = studio({ local: linked(), templates: [CONSOLE_TPL] });
  await settle();
  const g = s.ctx.iplaLink.graphicFor({ kind: 'ez', st: { tpl: 'sc-console', vals: { 'sc-console': { 'Headline 1': 'WE BUY CONSOLES' } },
    hidden: { 'sc-console': ['Hidden line'] }, chips: ['SAME DAY', 'LOCAL'] } });
  assert.equal(g.v, 1);
  assert.equal(g.category, 'phones');
  assert.equal(g.template, 'sc-console');
  assert.deepEqual(plain(g.texts), [
    { role: 'headline', text: 'WE BUY CONSOLES' },
    { role: 'sub', text: 'PS5 · XBOX · SWITCH' },
    { role: 'badge', text: 'SAME DAY' },
    { role: 'badge', text: 'LOCAL' },
  ]);
  assert.deepEqual(plain(g.products), ['console-single', 'controller-pair']);
});

test('an Advanced export reads the canvas: text objects, images inside groups, and no phone or website layer', async () => {
  const s = studio({ local: linked(), templates: [CONSOLE_TPL] });
  await settle();
  const g = s.ctx.iplaLink.graphicFor({ kind: 'adv', tplId: 'sc-console', json: { objects: [
    { type: 'i-text', pgRole: 'headline', text: 'CONSOLE BUYER' },
    { type: 'group', objects: [{ type: 'image', pgRole: 'photo', src: 'https://studio.example/assets/cutouts/game-console-pair.webp?v=3' }] },
    { type: 'i-text', pgRole: 'website', text: 'shop.com' },
    { type: 'image', pgRole: 'photo', src: 'data:image/png;base64,AAAA' },
    { type: 'i-text', pgRole: 'info', text: 'Hidden', visible: false },
  ] } });
  assert.equal(g.category, 'phones');
  assert.deepEqual(plain(g.texts), [{ role: 'headline', text: 'CONSOLE BUYER' }]);
  assert.deepEqual(plain(g.products), ['game-console-pair'], 'a pasted data image names no product');
});

test('the tag file rides on the upload as JSON and is capped', async () => {
  const many = { id: 'many', name: 'Many', cat: 'phones', layers: Array.from({ length: 40 }, (_, i) => ({ kind: 'text', name: 'L' + i, role: 'info', text: 'LINE ' + i + ' ' + 'x'.repeat(400) })) };
  const s = studio({ local: linked(), templates: [many], respond: url => (url === IMAGES ? { status: 200, body: { photo: { id: 1 } } } : { status: 200, body: {} }) });
  await settle();
  const g = s.ctx.iplaLink.graphicFor({ kind: 'ez', st: { tpl: 'many' } });
  assert.equal(g.texts.length, 24);
  assert.ok(g.texts.every(t => t.text.length <= 200));
  await s.exportAdvanced('x.png', { objects: [{ type: 'i-text', pgRole: 'headline', text: 'WE BUY IPHONES' }] });
  const sent = JSON.parse(s.uploads()[0].init.body.get('graphic'));
  assert.deepEqual(sent.texts, [{ role: 'headline', text: 'WE BUY IPHONES' }]);
});

test('a brief is data: it is capped, stripped of control characters, and junk is dropped', async () => {
  const s = studio({ respond: () => ({ status: 200, body: { token: TOKEN } }), hash: '#ipla=' + CODE + '&brief=' + b64url({ family: 'x'.repeat(500), headline: 'We buy' + String.fromCharCode(7) + ' iPhones\n today', models: ['ok', 7, { a: 1 }, 'y'.repeat(200)].concat(Array(40).fill('m')), price: 540, payout: 480, extra: { nested: true } }) });
  await settle();
  const b = plain(s.ctx.iplaLink.state().brief);
  assert.equal(b.family.length, 20);
  assert.equal(b.headline, 'We buy  iPhones  today');
  assert.equal(b.models.length, 12);
  assert.equal(b.models[1].length, 80);
  assert.deepEqual(Object.keys(b).sort(), ['family', 'headline', 'models']);
  for (const junk of ['not base64!!', b64url([1, 2]), b64url('a string'), 'A'.repeat(7000)]){
    assert.equal(studio({ hash: '#brief=' + junk }).ctx.iplaLink.state().brief, null);
  }
});

test('with a brief active the note says up front that Easy Mode prints a phone number', async () => {
  const s = studio({ hash: '#ipla=' + CODE + '&brief=' + b64url(BRIEF_TAGS), respond: () => ({ status: 200, body: { token: TOKEN } }) });
  await settle();
  const words = pageText(s.doc);
  assert.match(words, /Making: iPhone 15 Pro Max, Long Beach, damaged, urgent/);
  assert.match(words, /Headline: We buy cracked iPhones/);
  assert.match(words, /No phone number, website or QR code on a WE BUY picture/);
  assert.match(words, /Easy Mode prints your phone number/);
  assert.match(words, /Sign in as an admin\. Watermarked exports are not sent/);
});

// ───────────── the hook ─────────────

test('wrapping addHistory calls the original first, passes everything through, and never throws when the upload fails', async () => {
  const seen = [];
  for (const mode of ['rejects', 'throws', 'formdata']){
    const opts = {
      local: linked(),
      addHistory: async function(...args){ s.log.push('original'); seen.push(args); return 'kept'; },
      respond: url => { if (url === IMAGES) throw new Error('network down'); return { status: 200, body: {} }; },
    };
    if (mode === 'throws') opts.fetchThrowsSync = true;
    if (mode === 'formdata') opts.FormData = function(){ throw new Error('no FormData here'); };
    var s = studio(opts);
    await settle().catch(() => {});
    s.log.length = 0;
    const proj = { kind: 'adv', json: { objects: [] }, tplId: 't1' };
    let out;
    assert.doesNotThrow(() => { out = s.ctx.addHistory('n.png', 1440, PNG, 1440, 1440, proj); }, mode);
    assert.equal(await out, 'kept', mode);
    await settle();
    assert.equal(s.log[0], 'original', mode + ': the download is recorded before anything is sent');
    assert.deepEqual(seen.pop(), ['n.png', 1440, PNG, 1440, 1440, proj], mode);
    assert.equal(s.ctx.iplaLink.state().connected, true, mode + ': a failed upload does not end the link');
  }
});

test('an error of addHistory\'s own is still its own, and a rejection passes through untouched', async () => {
  const boom = new Error('IndexedDB is full');
  const sync = studio({ local: linked(), addHistory(){ throw boom; } });
  assert.throws(() => sync.ctx.addHistory('n.png', 1, PNG), e => e === boom);
  const rejecting = studio({ local: linked(), addHistory: () => Promise.reject(boom) });
  await assert.rejects(rejecting.ctx.addHistory('n.png', 1, PNG), e => e === boom);
});

test('the hook is put on once, and a page with no addHistory still loads', async () => {
  const s = studio({ local: linked() });
  const once = s.ctx.addHistory;
  vm.runInContext(SRC, s.ctx);
  assert.equal(s.ctx.addHistory, once, 'loading the file twice does not wrap the wrap');
  assert.doesNotThrow(() => studio({ local: linked(), addHistory: null }));
});

// ───────────── the retry queue ─────────────

test('a failed upload waits in the queue and is tried again', async () => {
  let up = false;
  const s = studio({ local: linked(), respond: url => { if (url !== IMAGES) return { status: 200, body: {} }; if (!up) throw new Error('offline'); return { status: 200, body: { photo: { id: 3 }, duplicate: false } }; } });
  await settle();
  await s.exportAdvanced();
  assert.equal(s.uploads().length, 1);
  assert.equal(s.ctx.iplaLink.state().queued, 1);
  const retry = s.timers.filter(t => t.ms >= 5000);
  assert.deepEqual(retry.map(t => t.ms), [5000]);
  up = true;
  await s.runTimers(t => t.ms >= 5000);
  assert.equal(s.uploads().length, 2);
  assert.equal(s.ctx.iplaLink.state().queued, 0);
  assert.match(s.ctx.iplaLink.state().note, /Sent to iPhones LA/);
});

test('the queue is small and bounded: the oldest waiting picture is let go', async () => {
  const s = studio({ local: linked(), respond: url => { if (url === IMAGES) throw new Error('offline'); return { status: 200, body: {} }; } });
  await settle();
  for (let i = 0; i < 9; i++) await s.exportAdvanced('p' + i + '.png');
  assert.equal(s.ctx.iplaLink.state().queued, 5);
  assert.equal(s.uploads().length, 1, 'while one waits to retry, the rest queue behind it rather than hammering');
});

test('after four tries a picture is dropped and the note says so', async () => {
  const s = studio({ local: linked(), respond: url => (url === IMAGES ? { status: 503, body: {} } : { status: 200, body: {} }) });
  await settle();
  await s.exportAdvanced();
  const waits = [];
  for (let i = 0; i < 6; i++){
    const due = s.timers.filter(t => t.ms >= 5000);
    if (!due.length) break;
    waits.push(due[0].ms);
    await s.runTimers(t => t.ms >= 5000);
  }
  assert.deepEqual(waits, [5000, 30000, 120000]);
  assert.equal(s.uploads().length, 4);
  assert.equal(s.ctx.iplaLink.state().queued, 0);
  assert.match(s.ctx.iplaLink.state().note, /Not sent to iPhones LA after 4 tries/);
});

test('coming back online tries the queue straight away', async () => {
  let up = false;
  const s = studio({ local: linked(), respond: url => { if (url !== IMAGES) return { status: 200, body: {} }; if (!up) throw new Error('offline'); return { status: 200, body: {} }; } });
  await settle();
  await s.exportAdvanced();
  up = true;
  s.listeners.online.forEach(fn => fn());
  await settle();
  assert.equal(s.uploads().length, 2);
  assert.equal(s.ctx.iplaLink.state().queued, 0);
  assert.equal(s.timers.filter(t => t.ms >= 5000).length, 0, 'the pending wait is cancelled, not left to fire again');
});

test('a picture the server refuses is not tried again, and its sentence is shown', async () => {
  const s = studio({ local: linked(), respond: url => (url === IMAGES ? { status: 413, body: { detail: 'That picture is over 8 MB.' } } : { status: 200, body: {} }) });
  await settle();
  await s.exportAdvanced();
  assert.equal(s.uploads().length, 1);
  assert.equal(s.ctx.iplaLink.state().queued, 0);
  assert.equal(s.timers.filter(t => t.ms >= 5000).length, 0);
  assert.equal(s.ctx.iplaLink.state().note, 'Not sent to iPhones LA. That picture is over 8 MB.');
});

test('a full library empties the queue and says what to do', async () => {
  const s = studio({ local: linked(), respond: url => (url === IMAGES ? { status: 507, body: {} } : { status: 200, body: {} }) });
  await settle();
  await s.exportAdvanced();
  assert.equal(s.ctx.iplaLink.state().queued, 0);
  assert.match(s.ctx.iplaLink.state().note, /library is full/);
  assert.equal(s.ctx.iplaLink.state().connected, true);
});

test('a picture already in the library is said to be there', async () => {
  const s = studio({ local: linked(), respond: url => (url === IMAGES ? { status: 200, body: { photo: { id: 3 }, duplicate: true } } : { status: 200, body: {} }) });
  await settle();
  await s.exportAdvanced();
  assert.equal(s.ctx.iplaLink.state().note, 'Already in the iPhones LA library.');
});

// ───────────── not connected, and being told to go ─────────────

test('nothing is sent and nothing is drawn when not connected', async () => {
  const s = studio({});
  await settle();
  assert.equal(await s.exportAdvanced('quiet.png'), 'kept:quiet.png');
  assert.equal(s.calls.length, 0);
  assert.equal(s.doc.body.children.length, 0);
  assert.equal(s.doc.head.children.length, 0);
  assert.equal(s.toasts.length, 0);
  assert.equal(s.timers.length, 0);
  assert.deepEqual(s.local._m, {});
  assert.deepEqual(s.session._m, {});
});

test('a stored link that is not a token is not a connection', async () => {
  for (const junk of ['{"token":"nope"}', 'not json', '{"token":42}', 'null']){
    const s = studio({ local: storage({ ipla_link: junk }) });
    await settle();
    await s.exportAdvanced();
    assert.equal(s.calls.length, 0, junk);
  }
});

test('a 401 on an upload forgets the token, empties the queue and sends nothing after', async () => {
  const s = studio({ local: linked(), respond: url => (url === IMAGES ? { status: 401, body: { detail: 'Not connected.' } } : { status: 200, body: {} }) });
  await settle();
  await s.exportAdvanced();
  assert.equal(s.local._m.ipla_link, undefined);
  assert.equal(s.ctx.iplaLink.state().connected, false);
  assert.equal(s.ctx.iplaLink.state().queued, 0);
  assert.match(s.ctx.iplaLink.state().note, /ended this connection/);
  const before = s.calls.length;
  await s.exportAdvanced('later.png');
  assert.equal(s.calls.length, before);
});

test('a 401 on the load-time check forgets the token before anything is designed', async () => {
  const s = studio({ local: linked(), respond: () => ({ status: 401, body: {} }) });
  await settle();
  assert.equal(s.local._m.ipla_link, undefined);
  assert.equal(s.ctx.iplaLink.state().connected, false);
});

test('a server that is merely down does not end the link', async () => {
  const s = studio({ local: linked(), respond: () => ({ status: 502, body: {} }) });
  await settle();
  assert.ok(s.local._m.ipla_link);
  assert.equal(s.ctx.iplaLink.state().connected, true);
});

test('Disconnect forgets the token here and says where the link is really ended', async () => {
  const s = studio({ local: linked() });
  await settle();
  s.ctx.iplaLink.disconnect();
  assert.equal(s.local._m.ipla_link, undefined);
  assert.match(s.ctx.iplaLink.state().note, /use Auto-post/);
});

// ───────────── pictures the shop cannot use ─────────────

const okUpload = url => (url === IMAGES ? { status: 200, body: { photo: { id: 1 } } } : { status: 200, body: {} });

test('an Easy Mode export prints a phone number, so it is not sent and the note says why', async () => {
  const s = studio({ local: linked(), respond: okUpload });
  await settle();
  s.ctx.addHistory('sell-your-iphone-ad-1440.png', 1440, PNG, undefined, undefined, { kind: 'ez', st: { tpl: 'sell_iphone', vals: {}, hidden: {} }, bgData: null });
  await settle();
  assert.equal(s.uploads().length, 0);
  assert.equal(s.ctx.iplaLink.state().noteKind, '');
  assert.match(s.ctx.iplaLink.state().note, /shows a phone number\. Remove it and export again/);
  await s.runTimers();
  assert.equal(s.toasts.length, 0, 'ordinary exports retain the studio download toast');
  assert.ok(!pageText(s.doc).includes('shows a phone number'), 'a refusal does not force the note open');
});

test('an Easy Mode export whose phone and website lines were removed in Layers is sent', async () => {
  const s = studio({ local: linked(), respond: okUpload });
  await settle();
  s.ctx.addHistory('a.png', 1440, PNG, undefined, undefined, { kind: 'ez', st: { tpl: 'sell_iphone', vals: {}, hidden: { sell_iphone: ['Phone', 'Site'] } } });
  await settle();
  assert.equal(s.uploads().length, 1);
  assert.equal(s.uploads()[0].init.body.get('source_ref'), 'sell_iphone');
});

test('an Easy Mode website line counts only when a site was typed', async () => {
  const doc = fakeDocument();
  doc._byId['ez-website'] = { value: '  ' };
  const s = studio({ local: linked(), respond: okUpload, document: doc });
  await settle();
  const proj = { kind: 'ez', st: { tpl: 'sell_iphone', vals: {}, hidden: { sell_iphone: ['Phone'] } } };
  s.ctx.addHistory('a.png', 1440, PNG, undefined, undefined, proj);
  await settle();
  assert.equal(s.uploads().length, 1);
  doc._byId['ez-website'].value = 'iphones.la';
  s.ctx.addHistory('b.png', 1440, PNG, undefined, undefined, proj);
  await settle();
  assert.equal(s.uploads().length, 1);
  assert.match(s.ctx.iplaLink.state().note, /shows a website/);
});

test('an Easy Mode export this file cannot check is not sent', async () => {
  const s = studio({ local: linked(), respond: okUpload });
  await settle();
  s.ctx.addHistory('a.png', 1440, PNG, undefined, undefined, { kind: 'ez', st: { tpl: 'a_template_added_later' } });
  await settle();
  assert.equal(s.uploads().length, 0);
  assert.match(s.ctx.iplaLink.state().note, /Easy Mode prints your phone number\. Use the Advanced editor\.$/);
});

test('a phone number typed into an Easy Mode headline is caught too', async () => {
  const s = studio({ local: linked(), respond: okUpload });
  await settle();
  s.ctx.addHistory('a.png', 1440, PNG, undefined, undefined, { kind: 'ez', st: { tpl: 'no_phone', vals: { no_phone: { 'Headline 1': 'CALL 562-555-0142' } } } });
  await settle();
  assert.equal(s.uploads().length, 0);
  s.ctx.addHistory('b.png', 1440, PNG, undefined, undefined, { kind: 'ez', st: { tpl: 'no_phone', vals: {} } });
  await settle();
  assert.equal(s.uploads().length, 1);
});

test('an advanced export is checked for a phone line, a website, a QR code and typed numbers', async () => {
  const refused = [
    [{ objects: [{ pgRole: 'phone', text: '(562) 555-0142' }] }, /a phone number/],
    [{ objects: [{ pgRole: 'website', text: 'iphones.la' }] }, /a website/],
    [{ objects: [{ pgRole: 'qr', pgQrData: 'https://iphones.la' }] }, /a QR code/],
    [{ objects: [{ type: 'group', objects: [{ type: 'i-text', text: 'text 562.555.0142 today' }] }] }, /a phone number/],
    [{ objects: [{ type: 'i-text', text: 'visit www.example.com' }] }, /a website/],
  ];
  for (const [json, why] of refused){
    const s = studio({ local: linked(), respond: okUpload });
    await settle();
    await s.exportAdvanced('x.png', json);
    assert.equal(s.uploads().length, 0, JSON.stringify(json));
    assert.match(s.ctx.iplaLink.state().note, why);
  }
  const sent = [
    { objects: [{ pgRole: 'phone', text: '(562) 555-0142', visible: false }] },
    { objects: [{ pgRole: 'headline', text: 'WE BUY IPHONES 11 TO 17, 256GB OR 1TB' }, { pgRole: 'sub', text: 'Any condition. Paid the same day in Long Beach 90802.' }] },
    { objects: [] },
  ];
  for (const json of sent){
    const s = studio({ local: linked(), respond: okUpload });
    await settle();
    await s.exportAdvanced('x.png', json);
    assert.equal(s.uploads().length, 1, JSON.stringify(json));
  }
});

test('a print order passes no project, so it is not sent', async () => {
  const s = studio({ local: linked(), respond: okUpload });
  await settle();
  s.ctx.addHistory('flyer-1080x1398.png', 1080, PNG, 1080, 1398);
  await settle();
  assert.equal(s.uploads().length, 0);
  assert.match(s.ctx.iplaLink.state().note, /print order/);
});

test('a watermarked export is not sent and the note asks for an admin sign-in', async () => {
  const s = studio({ local: linked(), respond: okUpload, account: { email: 'someone@example.com', plan: 'free' }, plan: { label: 'Free', watermark: true } });
  await settle();
  await s.exportAdvanced();
  assert.equal(s.uploads().length, 0);
  assert.equal(s.ctx.iplaLink.state().note, 'Not sent to iPhones LA: this export has a watermark. Sign in as an admin and export again.');
});

test('an export the code can tell is clean is sent: an admin, or a plan with no watermark', async () => {
  const admin = studio({ local: linked(), respond: okUpload, account: { role: 'admin', plan: 'free' }, plan: { watermark: true } });
  await settle();
  await admin.exportAdvanced();
  assert.equal(admin.uploads().length, 1);
  const pro = studio({ local: linked(), respond: okUpload, account: { plan: 'pro' }, plan: { label: 'Pro', watermark: false } });
  await settle();
  await pro.exportAdvanced();
  assert.equal(pro.uploads().length, 1);
});

test('when app.js gives no account to read, the export is sent rather than lost', async () => {
  const s = studio({ local: linked(), respond: okUpload, account: 'unreadable' });
  await settle();
  await s.exportAdvanced();
  assert.equal(s.uploads().length, 1);
});

test('a picture over the ceiling is shrunk with the studio\'s own helper, or refused', async () => {
  const big = 'data:image/png;base64,' + Buffer.alloc(200000, 7).toString('base64');
  const lowCap = () => ({ status: 200, body: { limits: { max_upload_bytes: 100000 } } });
  const shrunk = studio({ local: linked(), respond: url => (url === BRIEF ? lowCap() : okUpload(url)), downscale: async (url, px) => { assert.equal(px, 1600); return PNG.replace('image/png', 'image/jpeg'); } });
  await settle();
  shrunk.ctx.addHistory('Big Ad.PNG', 2160, big, 2160, 2160, { kind: 'adv', json: { objects: [] }, tplId: 't' });
  await settle();
  assert.equal(shrunk.uploads().length, 1);
  assert.equal(shrunk.uploads()[0].init.body.get('file').type, 'image/jpeg');
  assert.equal(shrunk.uploads()[0].init.body.get('file').name, 'big-ad.jpg');

  const stuck = studio({ local: linked(), respond: url => (url === BRIEF ? lowCap() : okUpload(url)) });
  await settle();
  stuck.ctx.addHistory('big.png', 2160, big, 2160, 2160, { kind: 'adv', json: { objects: [] }, tplId: 't' });
  await settle();
  assert.equal(stuck.uploads().length, 0);
  assert.match(stuck.ctx.iplaLink.state().note, /too large/);
});

test('something that is not a picture is never sent', async () => {
  const s = studio({ local: linked(), respond: okUpload });
  await settle();
  for (const bad of [undefined, null, '', 'https://example.com/a.png', 'data:text/html;base64,PGI+', 42]){
    s.ctx.addHistory('x.png', 1, bad, 1, 1, { kind: 'adv', json: { objects: [] } });
    await settle();
  }
  assert.equal(s.uploads().length, 0);
});

// ───────────── the files around it ─────────────

test('the source holds no secret, logs nothing, and every request leaves the cookie behind', () => {
  const code = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.equal((code.match(/https?:\/\/[^'"\s)]+/g) || []).filter(u => !u.startsWith('https://iphones.la')).length, 0, 'one origin only');
  assert.ok(!/console\./.test(code));
  assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\(|new Function/.test(code));
  assert.ok(!/\(\?<[=!]/.test(code), 'a lookbehind is a parse error in older Safari and would kill the whole file');
  const fetches = (code.match(/\bfetch\(/g) || []).length;
  assert.equal(fetches, 3);
  assert.equal((code.match(/credentials: 'omit'/g) || []).length, fetches);
  assert.ok(!/gfx_[A-Za-z0-9_-]{16,}|gfxc_[A-Za-z0-9_-]{16,}/.test(code));
});

test('index.html loads the link right after app.js and gains no inline script', () => {
  const html = readFileSync(new URL('index.html', HERE), 'utf8');
  assert.ok(html.includes('<script src="app.js"></script>\n<script src="iphonesla-link.js"></script>\n</body>'));
  assert.equal((html.match(/iphonesla-link\.js/g) || []).length, 1);
  assert.equal((html.match(/<script(?![^>]*\bsrc=)[^>]*>/gi) || []).length, 2, 'the CSP carries exactly two inline hashes');
});

test('both copies of the CSP allow the shop in connect-src, identically, and only the apex', () => {
  const pick = s => /Content-Security-Policy\s*[:=]\s*"?([^"\n]+)/.exec(s)[1].trim();
  const a = pick(readFileSync(new URL('_headers', HERE), 'utf8'));
  const b = pick(readFileSync(new URL('netlify.toml', HERE), 'utf8'));
  assert.equal(a, b);
  const connect = a.split(';').map(d => d.trim()).find(d => d.startsWith('connect-src'));
  assert.ok(connect.split(/\s+/).includes('https://iphones.la'));
  assert.ok(!/www\.iphones\.la|\*\.iphones\.la/.test(a));
  const script = a.split(';').map(d => d.trim()).find(d => d.startsWith('script-src'));
  assert.ok(!script.includes('iphones.la'), 'the shop serves no script to the studio');
  assert.ok(!script.includes("'unsafe-inline'"));
});

test('this test file is repo, not product: the site answers 404 for it', () => {
  const toml = readFileSync(new URL('netlify.toml', HERE), 'utf8');
  assert.match(toml, /from = "\/tests-iphonesla-link\.mjs"\n  to = "\/404\.html"\n  status = 404\n  force = true/);
});

// Review regressions: actual curved-group metadata and Easy Mode snapshots.
test('curved groups check whole words, preserve roles, and ignore hidden groups', async () => {
  for (const [words, role, hidden, blocked] of [
    ['(562) 555-0142', 'phone', false, true],
    ['CALL TODAY', 'phone', false, true],
    ['iphones.la', 'headline', false, true],
    ['WE BUY IPHONES', 'headline', false, false],
    ['(562) 555-0142', 'phone', true, false],
  ]) {
    const s = studio({ local: linked(), respond: okUpload });
    await settle();
    await s.exportAdvanced('curve.png', { objects: [{ type: 'group', pgRole: role, visible: !hidden,
      pgCurved: { text: words, curve: 30, style: { fontSize: 60 } },
      objects: [...words].map(text => ({ type: 'text', text })) }] });
    assert.equal(s.uploads().length, blocked ? 0 : 1, words);
  }
});

test('chips are checked as rendered, including hidden and synthesized badges', async () => {
  for (const hasBadges of [true, false]) for (const hidden of [true, false]) {
    for (const chips of [['562-555-0142'], ['IPHONES.LA'], ['CASH TODAY'], []]) {
      const s = studio({ local: linked(), respond: okUpload, templates: [{ id: 'plain', layers: hasBadges
        ? [{ kind: 'text', name: 'Points', role: 'badges', text: 'iphones.la' }] : [] }] });
      await settle();
      s.ctx.addHistory('chips.png', 1440, PNG, 1440, 1440, { kind: 'ez', st: {
        tpl: 'plain', chips, hidden: { plain: hidden ? ['Points'] : [] }, vals: {} } });
      await settle();
      assert.equal(s.uploads().length, chips.length && chips[0] !== 'CASH TODAY' ? 0 : 1,
        JSON.stringify({ hasBadges, hidden, chips }));
    }
  }
  const s = studio({ local: linked(), respond: okUpload, templates: [{ id: 'plain', layers: [
    { kind: 'text', name: 'Points', role: 'badges', text: '✓ iphones.la' }] }] });
  await settle();
  s.ctx.addHistory('default.png', 1440, PNG, 1440, 1440, { kind: 'ez', st: { tpl: 'plain', chips: null } });
  await settle();
  assert.equal(s.uploads().length, 0, 'default chips come from the authored badge text');
});

test('local and vanity phones, spaced digits, domains, handles and street addresses are refused', async () => {
  for (const text of ['555-0142', '1-800-GOT-JUNK', '5 6 2 5 5 5 0 1 4 2', 'buyback.ad',
    'scans.ad/x', 'iphones . la', 'iphones. la', '@iphonesla', 'IG: iphonesla', '123 Main Street']) {
    const s = studio({ local: linked(), respond: okUpload });
    await settle();
    await s.exportAdvanced('contact.png', { objects: [{ type: 'i-text', text }] });
    assert.equal(s.uploads().length, 0, text);
  }
});

function navigate(s, hash) {
  s.location.hash = hash;
  s.listeners.hashchange.forEach(fn => fn());
}
const connectHash = brief => '#ipla=' + CODE + (brief ? '&brief=' + b64url(brief) : '');
const connectOK = url => url === EXCHANGE ? { status: 200, body: { token: TOKEN } } : okUpload(url);

test('same-tab connect clears the fragment immediately and replaces old tags only after exchange', async () => {
  const s = studio({ hash: connectHash(BRIEF_TAGS), respond: connectOK });
  await settle();
  let finish;
  s.setRespond(url => url === EXCHANGE ? new Promise(resolve => { finish = resolve; }) : okUpload(url));
  navigate(s, connectHash({ family: 'mac', target: 'MacBook Pro' }));
  assert.equal(s.location.hash, '');
  assert.equal(s.ctx.iplaLink.state().brief, null);
  assert.equal(s.session._m.ipla_verified_brief, undefined);
  await s.exportAdvanced();
  assert.equal(s.uploads().length, 0, 'exports during exchange cannot inherit old tags');
  finish({ status: 200, body: { token: TOKEN } });
  await settle();
  await s.exportAdvanced();
  assert.equal(s.uploads()[0].init.body.get('family'), 'mac');
  assert.equal(s.uploads()[0].init.body.get('target'), 'MacBook Pro');
});

test('code-less briefs are ignored; absent, malformed and refused new briefs never retain old tags', async () => {
  const untrusted = studio({ local: linked(), hash: '#brief=' + b64url(BRIEF_TAGS), respond: okUpload });
  await settle();
  assert.equal(untrusted.ctx.iplaLink.state().brief, null);
  assert.equal(untrusted.session._m.ipla_verified_brief, undefined);
  for (const hash of [connectHash(null), '#ipla=bad&brief=' + b64url(BRIEF_TAGS),
    connectHash(null) + '&brief=broken', connectHash({ family: 'mac' })]) {
    const s = studio({ hash: connectHash(BRIEF_TAGS), respond: connectOK });
    await settle();
    s.setRespond(url => url === EXCHANGE ? { status: 400, body: { detail: 'Expired.' } } : okUpload(url));
    navigate(s, hash);
    await settle();
    assert.equal(s.ctx.iplaLink.state().brief, null);
    await s.exportAdvanced();
    assert.equal(s.uploads()[0].init.body.get('family'), null);
  }
});

test('late exchange responses cannot overwrite a newer brief or undo Disconnect', async () => {
  const pending = [];
  const s = studio({ local: linked(), respond: url => url === EXCHANGE
    ? new Promise(resolve => pending.push(resolve)) : okUpload(url) });
  await settle();
  navigate(s, connectHash({ family: 'iphone' })); await settle();
  navigate(s, connectHash({ family: 'mac' })); await settle();
  pending[1]({ status: 200, body: { token: TOKEN } }); await settle();
  pending[0]({ status: 200, body: { token: TOKEN } }); await settle();
  assert.equal(s.ctx.iplaLink.state().brief.family, 'mac');
  navigate(s, connectHash(BRIEF_TAGS)); await settle();
  s.ctx.iplaLink.disconnect();
  pending[2]({ status: 200, body: { token: TOKEN } }); await settle();
  assert.equal(s.ctx.iplaLink.state().connected, false);
  assert.equal(s.ctx.iplaLink.state().brief, null);
});

test('stalled requests and response bodies time out, abort and release the queue for retry', async () => {
  for (const bodyStalls of [false, true]) {
    const s = studio({ local: linked(), respond: url => url !== IMAGES ? okUpload(url)
      : bodyStalls ? { status: 200, json: () => new Promise(() => {}) } : new Promise(() => {}) });
    await settle();
    await s.exportAdvanced();
    await s.exportAdvanced('next.png');
    assert.equal(s.ctx.iplaLink.state().busy, true);
    await s.runTimers(t => t.ms === 90000);
    assert.equal(s.uploads()[0].init.signal.aborted, true);
    assert.equal(s.ctx.iplaLink.state().busy, false);
    assert.equal(s.ctx.iplaLink.state().queued, 2);
    s.setRespond(okUpload);
    s.ctx.iplaLink.retryNow(); await settle();
    assert.equal(s.ctx.iplaLink.state().queued, 0);
    assert.equal(s.uploads().length, 3);
    assert.equal(s.timers.filter(t => t.ms >= 5000).length, 0);
  }
});

test('429 is not retried and keeps the server explanation', async () => {
  const detail = 'That is 60 pictures in an hour from this studio. Try later.';
  const s = studio({ local: linked(), respond: url => url === IMAGES ? { status: 429, body: { detail } } : okUpload(url) });
  await settle(); await s.exportAdvanced();
  assert.equal(s.uploads().length, 1);
  assert.equal(s.ctx.iplaLink.state().queued, 0);
  assert.equal(s.ctx.iplaLink.state().note, 'Not sent to iPhones LA. ' + detail);
  assert.equal(s.timers.filter(t => t.ms >= 5000).length, 0);
});

test('retry exhaustion preserves the last server warning even if later attempts lose the network', async () => {
  let attempts = 0;
  const detail = 'Uploads are temporarily unavailable. Please try tomorrow.';
  const s = studio({ local: linked(), respond: url => {
    if (url !== IMAGES) return okUpload(url);
    if (++attempts === 1) return { status: 503, body: { detail } };
    throw new Error('offline');
  } });
  await settle(); await s.exportAdvanced();
  for (let i = 0; i < 3; i++) await s.runTimers(t => t.ms >= 5000);
  assert.equal(s.ctx.iplaLink.state().note, 'Not sent to iPhones LA after 4 tries. ' + detail);
});

test('brief and upload caps agree with the server contract', async () => {
  const caps = { family: 20, target: 120, angle: 30, tone: 20, headline: 200 };
  const brief = Object.fromEntries(Object.entries(caps).map(([key, cap]) => [key, 'x'.repeat(cap + 1)]));
  brief.models = ['m'.repeat(81)];
  const s = studio({ hash: connectHash(brief), respond: connectOK });
  await settle();
  s.ctx.addHistory('caps.png', 1440, PNG, 1440, 1440, { kind: 'adv', json: { objects: [] }, tplId: 't'.repeat(121) });
  await settle();
  const fd = s.uploads()[0].init.body;
  for (const [key, cap] of Object.entries(caps)) assert.equal(fd.get(key).length, cap, key);
  assert.equal(JSON.parse(fd.get('models'))[0].length, 80);
  assert.equal(fd.get('source_ref').length, 120);
});

test('legacy session briefs saved without exchange verification are discarded', async () => {
  const session = storage({ ipla_brief: JSON.stringify(BRIEF_TAGS) });
  const s = studio({ local: linked(), session, respond: okUpload });
  await settle(); await s.exportAdvanced();
  assert.equal(s.ctx.iplaLink.state().brief, null);
  assert.equal(session._m.ipla_brief, undefined);
  assert.equal(s.uploads()[0].init.body.get('family'), null);
});

test('a successful connect with no brief clears tags, while code-less links cannot replace verified tags', async () => {
  const s = studio({ hash: connectHash(BRIEF_TAGS), respond: connectOK });
  await settle();
  navigate(s, '#brief=' + b64url({ family: 'mac' }));
  await settle();
  assert.equal(s.ctx.iplaLink.state().brief.family, 'iphone');
  navigate(s, connectHash(null));
  await settle();
  assert.equal(s.ctx.iplaLink.state().brief, null);
  await s.exportAdvanced();
  assert.equal(s.uploads()[0].init.body.get('family'), null);
});
