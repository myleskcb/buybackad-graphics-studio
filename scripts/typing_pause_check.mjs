#!/usr/bin/env node
/* WORDS TYPED INSIDE A FIELD'S PAUSE, IN THE VIDEO MAKER (motion/app.js landTyping, 2026-11-18).

   Every word field in the maker saves after a pause in the typing (the number 500 ms, the area
   400 ms, the others 280 ms) and reads its box when the pause ends. Anything that filled the boxes
   again from the saved look inside that pause (syncWords) wrote the old words over the new ones
   before they were read. The ad census found it (scripts/ad_census.mjs, OPEN-ITEMS §BI 10): the
   number typed and then the area within half a second, as browser autofill fills them, saved an
   empty number, and every Any look in the gallery drew YOUR NUMBER. Each case below is a visitor
   quicker than a pause, and each must end as it would had they paused:

     1. the number, then the area, under 100 ms apart: both saved, the number still in its box;
     2. autofill: the area, the business name and the number filled at once: all saved;
     3. the area, then the headline 200 ms later: both saved;
     4. the city written into the words still follows the area field (what the area's own pause
        is for), with the number typed just before the area;
     5. ↻ Another headline pressed inside the number's pause: the number saved, the headline new;
     6. Back pressed inside the number's pause: what Back does after the pause;
     7. New look pressed, and the number typed while it looks: the number saved;
     8. New look waiting on a typeface (a slow connection), the number and the area typed at the
        press: their pauses run out during the search and land on the look being replaced; both
        are saved on the new look, and the city in its words follows the area (putLook);
     9. Download photo pressed inside the number's pause: the number in hand at the press, and no
        "type your phone number first";
    10. the page reloaded inside the number's pause: the number still there;
    11. no page error and no CSP violation in any of them.

   Each case runs in a fresh browser context (the maker keeps the visitor's look in localStorage,
   and a shared context leaks it into the next case), signed out (a download stops at sign-in).
   The times between the two moves are read in the page, from the events themselves: a case whose
   moves were not inside the pause tested nothing, and fails as such.

   usage:  [GFX_BASE=http://127.0.0.1:8899/] [PLAYWRIGHT_MODULE=/path/to/playwright] \
             node scripts/typing_pause_check.mjs [--only 1,4,10]
   Nothing answering at GFX_BASE: the script serves the repo there itself. A server there that
   answers with another tree's motion/app.js is refused: it would check someone else's maker.
   Exits non-zero on any failure. */
import { readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8899/').replace(/\/?$/, '/');
const ONLY = (() => { const i = process.argv.indexOf('--only'); return i > 0 && process.argv[i + 1] ? process.argv[i + 1].split(',').map(Number) : null; })();
const csp = (readFileSync(join(ROOT, '_headers'), 'utf8').match(/Content-Security-Policy:\s*(.+)/) || [])[1];

const PAUSE = { words: 280, area: 400, number: 500 };    // motion/app.js, the fields' own debounce
const STORE = 'pgfx_motion_v1';

const fails = [];
const ok = (cond, what) => { console.log((cond ? '  ok   ' : '  FAIL ') + what); if (!cond) fails.push(what); };

/* ------------------------------------------------------------------ the server */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.txt': 'text/plain', '.ico': 'image/x-icon' };
async function ensureServer() {
  const local = readFileSync(join(ROOT, 'motion/app.js'));
  try {
    const r = await fetch(BASE + 'motion/app.js', { signal: AbortSignal.timeout(4000) });
    const got = Buffer.from(await r.arrayBuffer());
    if (r.ok && got.equals(local)) { console.log('serving: ' + BASE + ' (already running, this tree)'); return null; }
    console.error(`${BASE} answers with another tree's motion/app.js (or an error, ${r.status}). Stop that server or set GFX_BASE to a free port.`);
    process.exit(2);
  } catch (e) { /* nothing there: serve it */ }
  const u = new URL(BASE);
  if (!/^(127\.0\.0\.1|localhost)$/.test(u.hostname)) { console.error('nothing answers at ' + BASE); process.exit(2); }
  const server = createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, BASE).pathname), file = join(ROOT, p);
    if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    try {
      if (statSync(file).isDirectory()) { if (!p.endsWith('/')) { res.writeHead(301, { location: p + '/' }); return res.end(); } file = join(file, 'index.html'); }
      const body = readFileSync(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(body);
    } catch (e) { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('not found'); }
  });
  await new Promise((done, no) => { server.once('error', no); server.listen(+u.port || 80, u.hostname, done); });
  console.log('serving: ' + BASE + ' (this tree, from the script)');
  return server;
}

/* ------------------------------------------------------------------ the page */
/** A fresh maker, ready: its first ad drawn (rebuild hides #loading). */
async function fresh(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1 });
  await ctx.addInitScript(() => {
    // every input and click, with its time, so a case can say how far apart its moves really were
    window.__ev = []; window.__csp = [];
    const rec = e => { window.__ev.push([e.type, (e.target && e.target.id) || '', performance.now()]); };
    document.addEventListener('input', rec, true); document.addEventListener('click', rec, true);
    document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI));
    addEventListener('pagehide', () => {
      try { const last = window.__ev.filter(x => x[0] === 'input').pop(); sessionStorage.setItem('__pagehide_gap', String(last ? Math.round(performance.now() - last[2]) : -1)); } catch (e) { /* none */ }
    });
    // a slow connection, when a case asks for one: a typeface takes window.__slowFonts ms to load (the browser
    // may answer a face it has had from its cache, so the wait is put on the load itself, not on the network)
    const load = FontFace.prototype.load;
    FontFace.prototype.load = function () { const p = load.call(this), ms = window.__slowFonts || 0; return ms ? p.then(f => new Promise(r => setTimeout(() => r(f), ms))) : p; };
    // what autofill and a paste do: the whole value at once, and one input event
    window.__type = (id, value) => { const el = document.getElementById(id); el.focus(); el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); };
  });
  await ctx.route('**/*', async route => {
    const q = route.request();
    if (q.resourceType() === 'document' && q.url().startsWith(BASE) && csp) {
      const r = await route.fetch();
      return route.fulfill({ response: r, headers: { ...r.headers(), 'content-security-policy': csp } });
    }
    return route.continue();
  });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(String(e).split('\n')[0]));
  await page.goto(BASE + 'motion/', { waitUntil: 'load', timeout: 120000 });
  await ready(page);
  return { ctx, page, errors };
}
const ready = page => page.waitForFunction(() => { const l = document.getElementById('loading'); return l && l.hidden; }, null, { timeout: 120000 });
const saved = page => page.evaluate(k => { try { return JSON.parse(localStorage.getItem(k) || '{}').style || {}; } catch (e) { return {}; } }, STORE);
/** The saved look once it says what is wanted, then again after every field's pause has run out
 *  (a late handler must not take it back). After 5 s without it, as it is. */
async function settled(page, want) {
  const end = Date.now() + 5000;
  let s = await saved(page);
  while (!want(s) && Date.now() < end) { await page.waitForTimeout(100); s = await saved(page); }
  await page.waitForTimeout(PAUSE.number + 300);
  return saved(page);
}
/** Type a field and wait until it is saved and every pause has run out: a visitor who paused. */
async function typePaused(page, id, value, key, as = value) {
  await page.fill('#' + id, value);
  await page.waitForFunction(([k, v, store]) => { try { return (JSON.parse(localStorage.getItem(store) || '{}').style || {})[k] === v; } catch (e) { return false; } }, [key, as, STORE], { timeout: 10000 });
  await page.waitForTimeout(PAUSE.number + 100);
}
/** Milliseconds from the last event on element a to the last on element b, in the page. */
const gap = (page, a, b) => page.evaluate(([a, b]) => {
  const at = id => { const e = window.__ev.filter(x => x[1] === id).pop(); return e ? e[2] : NaN; };
  return Math.round(at(b) - at(a));
}, [a, b]);
const field = (page, id) => page.inputValue('#' + id);
const q = v => JSON.stringify(v);

const N = '(619) 555-0142', N2 = '(619) 555-0177', A = 'San Diego', B = 'Harbor Buyers';

/* ------------------------------------------------------------------ the cases */
const CASES = [
  [1, 'the number, then the area, under 100 ms apart (the census\'s case)', async page => {
    await page.fill('#f-number', N);
    await page.fill('#f-area', A);
    const g = await gap(page, 'f-number', 'f-area');
    ok(g >= 0 && g < 90, `typed ${g} ms apart: inside the number's ${PAUSE.number} ms pause, so the area's ${PAUSE.area} ms ends first`);
    const s = await settled(page, s => s.number === N && s.area === A);
    ok(s.number === N, `the number is saved: ${q(s.number)}`);
    ok(s.area === A, `the area is saved: ${q(s.area)}`);
    ok(await field(page, 'f-number') === N, `the number's box still shows it: ${q(await field(page, 'f-number'))}`);
  }],
  [2, 'autofill: the area, the business name and the number at once', async page => {
    await page.focus('#f-number');                     // autofill leaves the cursor where it was picked
    await page.evaluate(([n, a, b]) => {
      const set = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
      set('f-area', a); set('f-biz', b); set('f-number', n);
    }, [N, A, B]);
    const s = await settled(page, s => s.number === N && s.area === A && s.biz === B.toUpperCase());
    ok(s.number === N, `the number is saved: ${q(s.number)}`);
    ok(s.area === A, `the area is saved: ${q(s.area)}`);
    ok(s.biz === B.toUpperCase(), `the business name is saved: ${q(s.biz)}`);
    ok(await field(page, 'f-number') === N, `the number's box still shows it: ${q(await field(page, 'f-number'))}`);
  }],
  [3, 'the area, then the headline 200 ms later', async page => {
    const H = 'cash for your old iphone';
    await page.evaluate(async ([a, h]) => { __type('f-area', a); await new Promise(r => setTimeout(r, 200)); __type('f-headline', h); }, [A, H]);
    const g = await gap(page, 'f-area', 'f-headline');
    ok(g > PAUSE.area - PAUSE.words + 10 && g < PAUSE.area - 10, `typed ${g} ms apart: the area's pause ends inside the headline's`);
    const s = await settled(page, s => s.headline === H.toUpperCase() && s.area === A);
    ok(s.headline === H.toUpperCase(), `the headline is saved: ${q(s.headline)}`);
    ok(s.area === A, `the area is saved: ${q(s.area)}`);
  }],
  [4, 'the city in the words follows the area, with the number typed just before it', async page => {
    await typePaused(page, 'f-area', 'Long Beach', 'area');
    await typePaused(page, 'f-headline', 'we buy iphones in long beach', 'headline', 'WE BUY IPHONES IN LONG BEACH');
    await page.evaluate(async ([n, a]) => { __type('f-number', n); await new Promise(r => setTimeout(r, 10)); __type('f-area', a); }, [N, A]);
    const g = await gap(page, 'f-number', 'f-area');
    ok(g >= 0 && g < 90, `the number and the new area typed ${g} ms apart`);
    const s = await settled(page, s => s.number === N && s.area === A && s.headline === 'WE BUY IPHONES IN SAN DIEGO');
    ok(s.headline === 'WE BUY IPHONES IN SAN DIEGO', `the headline's city follows the area: ${q(s.headline)}`);
    ok(await field(page, 'f-headline') === 'WE BUY IPHONES IN SAN DIEGO', `and its box shows it: ${q(await field(page, 'f-headline'))}`);
    ok(s.number === N, `the number is saved: ${q(s.number)}`);
    ok(s.area === A, `the area is saved: ${q(s.area)}`);
  }],
  [5, '↻ Another headline pressed inside the number\'s pause', async page => {
    const before = await field(page, 'f-headline');
    await page.fill('#f-number', N);
    await page.click('#new-headline');
    const g = await gap(page, 'f-number', 'new-headline');
    ok(g >= 0 && g < PAUSE.number - 100, `pressed ${g} ms after the number`);
    const s = await settled(page, s => s.number === N);
    ok(s.number === N, `the number is saved: ${q(s.number)}`);
    ok(s.headline && s.headline !== before.toUpperCase(), `the headline is a new one: ${q(before)} became ${q(s.headline)}`);
    ok(await field(page, 'f-number') === N, `the number's box still shows it: ${q(await field(page, 'f-number'))}`);
  }],
  [6, 'Back pressed inside the number\'s pause does what Back does after it', async page => {
    await typePaused(page, 'f-number', N, 'number');
    await page.click('#new-headline');                  // a step for Back to go back to, taken with the number N
    await page.waitForTimeout(PAUSE.number + 100);
    await page.fill('#f-number', N2);
    await page.click('#undo');
    const g = await gap(page, 'f-number', 'undo');
    ok(g >= 0 && g < PAUSE.number - 100, `Back pressed ${g} ms after the number`);
    // after a pause, N2 is saved into the look Back leaves, so Back brings back the step's N
    const s = await settled(page, s => s.number === N);
    ok(s.number === N, `the number is the step's, as after a pause: ${q(s.number)}`);
    ok(await field(page, 'f-number') === s.number, `the number's box says what is saved: ${q(await field(page, 'f-number'))}`);
  }],
  [7, 'New look pressed, and the number typed while it looks', async page => {
    /* the search keeps the page busy, so a key pressed during it reaches the box between two of its
       steps; typed in the press's own task here, which is the earliest such moment (a fill from the
       script waits for the page and can land after the search, testing nothing) */
    const busy = await page.evaluate(n => { document.getElementById('shuffle-look').click(); __type('f-number', n); return document.getElementById('shuffle-look').disabled; }, N);
    const t = await (await page.waitForFunction(() => !document.getElementById('shuffle-look').disabled && performance.now(), null, { timeout: 90000, polling: 50 })).jsonValue();
    const took = await page.evaluate(t => { const c = window.__ev.filter(x => x[1] === 'shuffle-look').pop(), n = window.__ev.filter(x => x[1] === 'f-number').pop(); return { look: Math.round(t - c[2]), typed: Math.round(n[2] - c[2]) }; }, t);
    ok(busy && took.typed < took.look, `the number typed ${took.typed} ms into a ${took.look} ms search for the look${took.look > took.typed + PAUSE.number ? ' (its pause ran out during the search)' : ' (its pause outlasted the search)'}`);
    const s = await settled(page, s => s.number === N);
    ok(s.number === N, `the number is saved: ${q(s.number)}`);
    ok(await field(page, 'f-number') === N, `the number's box still shows it: ${q(await field(page, 'f-number'))}`);
  }],
  [8, 'New look waiting on a typeface, the number and the area typed at the press', async page => {
    await typePaused(page, 'f-area', 'Long Beach', 'area');
    await typePaused(page, 'f-headline', 'we buy iphones in long beach', 'headline', 'WE BUY IPHONES IN LONG BEACH');
    /* a slow connection: every typeface the search asks for takes 900 ms to load (the page's own are
       let go first, so it asks again), and the search waits for it, so the fields' pauses run out
       while it looks and their words land on the look it is about to replace. (With its faces let
       go the full ad fails its pre-flight on every try, and New look falls back to a plain draw,
       strongSeed's catch in shuffle; either way a whole new look replaces the old one after the
       wait, which is what this case is about. Without putLook it fails all four below.) */
    const busy = await page.evaluate(([n, a]) => {
      window.__slowFonts = 900; document.fonts.clear();
      document.getElementById('shuffle-look').click(); __type('f-number', n); __type('f-area', a);
      return document.getElementById('shuffle-look').disabled;
    }, [N, A]);
    const t = await (await page.waitForFunction(() => !document.getElementById('shuffle-look').disabled && performance.now(), null, { timeout: 120000, polling: 50 })).jsonValue();
    const took = await page.evaluate(t => Math.round(t - window.__ev.filter(x => x[1] === 'shuffle-look').pop()[2]), t);
    ok(busy && took > PAUSE.number + 100, `the search took ${took} ms: both pauses ran out during it`);
    await page.evaluate(() => { window.__slowFonts = 0; });
    const s = await settled(page, s => s.number === N && s.area === A && s.headline === 'WE BUY IPHONES IN SAN DIEGO');
    ok(s.number === N, `the number is saved on the new look: ${q(s.number)}`);
    ok(s.area === A, `the area is saved on the new look: ${q(s.area)}`);
    ok(s.headline === 'WE BUY IPHONES IN SAN DIEGO', `the city in its words follows the area: ${q(s.headline)}`);
    ok(await field(page, 'f-number') === N && await field(page, 'f-area') === A, `the boxes show them: ${q(await field(page, 'f-number'))}, ${q(await field(page, 'f-area'))}`);
  }],
  [9, 'Download photo pressed inside the number\'s pause', async page => {
    await page.fill('#f-number', N);
    await page.click('#download-jpg');
    const at = await page.evaluate(([k, store]) => {
      const n = window.__ev.filter(x => x[1] === 'f-number').pop(), c = window.__ev.filter(x => x[1] === 'download-jpg').pop();
      let s = {}; try { s = JSON.parse(localStorage.getItem(store) || '{}').style || {}; } catch (e) { /* none */ }
      return { gap: Math.round(c[2] - n[2]), since: Math.round(performance.now() - n[2]), number: s[k] };
    }, ['number', STORE]);
    ok(at.gap >= 0 && at.since < PAUSE.number - 50, `pressed ${at.gap} ms after the number, read ${at.since} ms after it (inside its pause)`);
    ok(at.number === N, `the number is in hand when Download is pressed: ${q(at.number)}`);
    await page.waitForTimeout(300);
    const toast = await page.evaluate(() => { const t = document.querySelector('.vh-toast.show'); return t ? t.textContent : ''; });
    ok(!/phone number first|digits/i.test(toast), `no "type your number" for a number just typed${toast ? ': ' + q(toast) : ''}`);
  }],
  [10, 'the page reloaded inside the number\'s pause', async page => {
    await page.fill('#f-number', N);
    await page.reload({ waitUntil: 'load', timeout: 120000 });
    await ready(page);
    const g = Number(await page.evaluate(() => sessionStorage.getItem('__pagehide_gap')));
    ok(g >= 0 && g < PAUSE.number - 100, `left ${g} ms after the number was typed`);
    const s = await saved(page);
    ok(s.number === N, `the number is saved: ${q(s.number)}`);
    ok(await field(page, 'f-number') === N, `the number's box shows it after the reload: ${q(await field(page, 'f-number'))}`);
  }],
];

/* ------------------------------------------------------------------ run */
const server = await ensureServer();
const browser = await chromium.launch();
const errors = [], cspHits = [];
try {
  for (const [n, name, run] of CASES) {
    if (ONLY && !ONLY.includes(n)) continue;
    console.log(`\n${n}. ${name}`);
    let c;
    try {
      c = await fresh(browser);
      await run(c.page);
    } catch (e) { ok(false, `case ${n} could not run: ${String(e.message || e).split('\n')[0]}`); }
    if (c) {
      errors.push(...c.errors.map(e => `case ${n}: ${e}`));
      cspHits.push(...(await c.page.evaluate(() => window.__csp || []).catch(() => [])).map(v => `case ${n}: ${v}`));
      await c.ctx.close();
    }
  }
  console.log('\n11. the pages');
  ok(!errors.length, `no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  ok(!cspHits.length, `no CSP violations${cspHits.length ? ': ' + cspHits.slice(0, 3).join(' | ') : ''}`);
} finally {
  await browser.close();
  if (server) server.close();
}
console.log(fails.length ? `\n${fails.length} FAILED` : '\nall passed');
process.exit(fails.length ? 1 : 0);
