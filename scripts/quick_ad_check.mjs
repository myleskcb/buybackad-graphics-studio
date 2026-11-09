#!/usr/bin/env node
/* ⚡ QUICK AD, PRESSED IN A BROWSER (motion/index.html, motion/app.js, motion/listing.js).

   Serves the video maker under the production Content-Security-Policy from
   _headers (localhost sends none), in the local demo mode (no account), and:
     1. the listing is written for the ad on first load and passes the checks;
     2. Wholesale buyer + Photo: Make quick ad gives the ad the wholesale
        audience's words, downloads a JPG, and the title and description are
        rewritten for it (wholesale words, the pictured models, the area);
     3. Local buyer + Video: the same, with the video and its photo;
     4. a hand edit that names no buying fails the checks on the page;
     5. ↻ gives another title; Copy puts the listing on the clipboard; Save
        as a text file downloads it;
     6. no page error, no CSP violation; screenshots at 1400 and 390 wide,
        and nothing scrolls sideways at 390.

   usage:  python3 -m http.server 8931   (in the repo), then
           [GFX_BASE=http://127.0.0.1:8931/] [SHOTS=dir] node scripts/quick_ad_check.mjs
   PLAYWRIGHT_MODULE may name an installed Playwright. Exits non-zero on any failure. */
import { readFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8931/').replace(/\/?$/, '/');
const SHOTS = process.env.SHOTS || '';
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const csp = (readFileSync(new URL('../_headers', import.meta.url), 'utf8').match(/Content-Security-Policy:\s*(.+)/) || [])[1];

const fails = [];
const ok = (cond, what) => { console.log((cond ? '  ok   ' : '  FAIL ') + what); if (!cond) fails.push(what); };

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'] });
await ctx.addInitScript(() => {
  try { localStorage.setItem('pgfx_local_demo', '1'); localStorage.setItem('pgfx_brand', JSON.stringify({ phone: '(562) 999-4994', area: { home: 'Long Beach' } })); } catch (e) { /* none */ }
  window.__csp = [];
  document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI));
});
await ctx.route('**/*', async route => {
  const q = route.request();
  if (q.resourceType() === 'document' && q.url().startsWith(BASE) && csp) {
    const r = await route.fetch();
    return route.fulfill({ response: r, headers: { ...r.headers(), 'content-security-policy': csp } });
  }
  return route.continue();
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
await page.goto(BASE + 'motion/', { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => document.getElementById('loading').hidden, null, { timeout: 120000 });
await page.waitForFunction(() => document.getElementById('qa-title').value.length > 0, null, { timeout: 30000 });

const listing = () => page.evaluate(() => ({ title: document.getElementById('qa-title').value, body: document.getElementById('qa-body').value,
  check: document.getElementById('qa-check').textContent, read: document.getElementById('qa-read').textContent,
  headline: document.getElementById('f-headline').value, tag: document.getElementById('f-tag').value, note: document.getElementById('export-note').textContent }));

// 1
let L = await listing();
console.log('first load:', JSON.stringify(L.title), L.body.length, 'characters');
ok(/we buy|sell (us )?your/i.test(L.title), 'the first listing\'s title says it buys');
ok(/Passes the listing checks/.test(L.check), 'the first listing passes the checks');
ok(/Written from the ad: iPhone/.test(L.read) && /Long Beach/.test(L.read), 'it says what it read: the phones and the area');

// 2
const quickAd = async (angle, kind, expect) => {
  await page.click(`#qa-angles [data-angle="${angle}"]`);
  await page.click(`#qa-kind [data-kind="${kind}"]`);
  const files = [];
  const got = new Promise(res => {
    const want = kind === 'video' ? 2 : 1;
    page.on('download', async d => { files.push(d.suggestedFilename()); if (files.length >= want) res(); });
  });
  const t0 = Date.now();
  await page.click('#quick-ad');
  await Promise.race([got, new Promise(r => setTimeout(r, kind === 'video' ? 180000 : 60000))]);
  await page.waitForFunction(() => !document.getElementById('quick-ad').disabled && !document.getElementById('download').disabled, null, { timeout: 60000 });
  const L2 = await listing();
  console.log(`${angle}/${kind} in ${((Date.now() - t0) / 1000).toFixed(1)} s: files ${JSON.stringify(files)}; headline ${JSON.stringify(L2.headline)}; title ${JSON.stringify(L2.title)} (${L2.title.length}); description ${L2.body.length}`);
  ok(kind === 'video' ? files.some(f => /\.(mp4|webm)$/.test(f)) && files.some(f => /\.jpg$/.test(f)) : files.some(f => /\.jpg$/.test(f)), `${angle}: the ${kind} downloaded`);
  ok(expect.headline.test(L2.headline + ' ' + L2.tag), `${angle}: the ad's words are the angle's (${L2.headline})`);
  ok(expect.title.test(L2.title), `${angle}: the title is written for the angle`);
  ok(/Passes the listing checks/.test(L2.check), `${angle}: the listing passes the checks`);
  const models = [...L2.read.matchAll(/iPhone [0-9][^,(·]*?(?= \(|,| ·)/g)].map(m => m[0].trim());
  ok(models.length && models.every(m => L2.body.includes(m) || L2.body.includes(m.replace(/^iPhone /, ''))), `${angle}: the description names the phones on the picture (${models.join(', ')})`);
  ok(L2.body.includes('Long Beach') && L2.body.length >= 1200, `${angle}: the description names the area and runs ${L2.body.length} characters`);
  ok(/Its title and description are in Quick ad/.test(L2.note), `${angle}: the download note points at the listing`);
  return L2;
};
await quickAd('wholesale', 'photo', { headline: /WHOLESALE|LOT|BULK|MAYOREO|LOTE|BOX|RESELLER/, title: /wholesale|bulk|lot/i });
if (SHOTS) await page.locator('#quick').screenshot({ path: SHOTS + '/quick-wholesale.png' });
// 3
await quickAd('local_buyer', 'video', { headline: /LOCAL|BUYER|NEARBY|SHIPPING|SELL|COMPRADOR|VENDE|AQUÍ|IPHONES IN/, title: /local buyer|same day|local/i });
if (SHOTS) await page.screenshot({ path: SHOTS + '/quick-local-buyer-1400.png', fullPage: false });

// 4
await page.fill('#qa-title', 'iPhone 15 Pro Max 256GB unlocked');
const bad = await page.textContent('#qa-check');
ok(/Fix before posting/.test(bad) && /We buy/.test(bad), 'a title that names no buying is refused on the page');
// 5
const before = await page.inputValue('#qa-title');
await page.click('#qa-new-title');
const after = await page.inputValue('#qa-title');
ok(after && after !== before && /we buy|sell/i.test(after), `↻ gives another title: ${JSON.stringify(after)}`);
await page.click('#qa-copy-all');
const clip = await page.evaluate(() => navigator.clipboard.readText()).catch(() => '');
ok(clip.startsWith(after) && clip.length > 1200, 'Copy title and description puts both on the clipboard');
const txt = page.waitForEvent('download', { timeout: 10000 });
await page.click('#qa-save-txt');
const d = await txt; const p = await d.path();
const saved = readFileSync(p, 'utf8');
ok(/-listing\.txt$/.test(d.suggestedFilename()) && saved.startsWith(after), `Save as a text file: ${d.suggestedFilename()}`);

// 6
const csps = await page.evaluate(() => window.__csp);
ok(!errors.length, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
ok(!csps.length, 'no CSP violations' + (csps.length ? ': ' + csps.join(' | ') : ''));
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(400);
const wide = await page.evaluate(() => document.documentElement.scrollWidth);
ok(wide <= 390, `nothing scrolls sideways at 390 (${wide})`);
if (SHOTS) { await page.locator('#quick').scrollIntoViewIfNeeded(); await page.locator('#quick').screenshot({ path: SHOTS + '/quick-390.png' }); }

await browser.close();
console.log(fails.length ? `${fails.length} failed` : 'all passed');
process.exit(fails.length ? 1 : 0);
