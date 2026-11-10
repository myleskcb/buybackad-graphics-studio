/* The buying list card (motion/buylist.js) and the wholesale lot, in a real
   browser under the production CSP:

     1. A wholesale ad shows at least 3 phones, and the picker keeps 3.
     2. The card shows for a wholesale ad only, with the ad's models listed.
     3. Every palette at every size draws a card whose lines all pass their
        own check (contrast against the ground under them, and width).
     4. A typed list is kept; the Spanish card says it in Spanish; too long a
        line is shrunk to fit, never cut; Use the ad's phones goes back.
     5. Download saves a JPG of the ad's size that is not blank.
     6. No page errors, no CSP violations, nothing scrolls sideways at 390.

   usage:  python3 -m http.server 8931   (in the repo), then
           [GFX_BASE=http://127.0.0.1:8931/] [SHOTS=dir] node scripts/buylist_check.mjs
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

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, acceptDownloads: true });
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

// 2a: not a wholesale ad, no card
await page.click('#qa-angles [data-angle="general"]');
await page.waitForTimeout(400);
ok(await page.isHidden('#qa-buylist'), 'a general ad shows no buying list');

// 1: the lot. One phone picked, then the wholesale audience: 3 or more on the ad, and the picker keeps 3
for (let i = 0; i < 6; i++) {                        // the picker redraws after each click, so one at a time
  const on = await page.$$('#phones [data-phone][aria-pressed="true"]');
  if (on.length <= 1) break;
  await on[on.length - 1].click(); await page.waitForTimeout(150);
}
const before = await page.textContent('#phone-count');
await page.selectOption('select[data-key="audience"]', 'wholesale');
await page.waitForTimeout(600);
const count = Number((await page.textContent('#phone-count')).match(/\d+/)[0]);
ok(/^1 picked/.test(before) && count >= 3, `one phone, then Wholesale buyer: ${before} becomes ${count} picked`);
const pressed = await page.$$('#phones [data-phone][aria-pressed="true"]');
await pressed[0].click(); await page.waitForTimeout(300);
ok(Number((await page.textContent('#phone-count')).match(/\d+/)[0]) >= 3, 'un-picking a phone of a wholesale lot of 3 is refused');

// 2b: the card, for the wholesale angle
await page.click('#qa-angles [data-angle="wholesale"]');
await page.waitForFunction(() => !document.getElementById('qa-buylist').hidden, null, { timeout: 15000 });
await page.waitForFunction(() => /Ready|Not ready/.test(document.getElementById('bl-check').textContent), null, { timeout: 15000 });
const models = (await page.inputValue('#bl-models')).split('\n').filter(Boolean);
const adModels = await page.evaluate(() => [...document.querySelectorAll('#phones [data-phone][aria-pressed="true"] img')].map(i => i.alt.replace(/ [^ ]+$/, '')));
ok(models.length >= 3 && models.every(m => /^iPhone /.test(m)), `the list starts from the ad: ${models.join(', ')}`);
ok(/^Ready/.test(await page.textContent('#bl-check')), 'the wholesale card passes its own check: ' + await page.textContent('#bl-check'));
const blank = () => page.evaluate(() => { const c = document.getElementById('bl-preview'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; const s = new Set(); for (let i = 0; i < d.length; i += 4 * 97) s.add(d[i] >> 4 << 8 | d[i + 1] >> 4 << 4 | d[i + 2] >> 4); return s.size; });
ok(await blank() > 6, 'the preview is drawn (not one flat colour)');
if (SHOTS) await page.locator('#qa-buylist').screenshot({ path: SHOTS + '/buylist-panel.png' });

// 3: every palette x every size, drawn in the page with the card's own check
const sweep = await page.evaluate(async () => {
  const B = await import('/motion/buylist.js'), C = await import('/motion/catalog.js'), E = await import('/motion/engine.js');
  const bad = [], st0 = { phones: ['18-pro-max-burgundy', '17-pro-max-cosmic-orange', '16-pink'], number: '(562) 999-4994', area: 'Long Beach', font: 'franklin' };
  const fonts = new Set(Object.values(C.VIBES).flatMap(v => v.fonts || []).filter(f => C.FONTS[f]));
  await E.loadFonts([...fonts, 'franklin', 'oswald']);
  let n = 0;
  for (const palette of Object.keys(C.PALETTES)) for (const aspect of Object.keys(E.ASPECTS)) for (const lang of ['en', 'es']) {
    const font = [...fonts][n % fonts.size];
    const st = { ...st0, palette, aspect, lang, font };
    const card = B.drawBuyList(st, B.buyListModels(st, E.PHONE_META), {}, { scale: .25 });
    n++;
    if (!card.ok) bad.push(`${palette} ${aspect} ${lang} ${font}: ${card.checks.filter(c => !c.ok).map(c => c.label).join('; ')}`);
  }
  return { n, bad };
});
ok(sweep.bad.length === 0, `${sweep.n} cards (every palette, every size, English and Spanish) pass their checks` + (sweep.bad.length ? ': ' + sweep.bad.slice(0, 5).join(' | ') : ''));

// 4: typed list kept, a long line shrunk, Spanish, reset
await page.fill('#bl-models', 'iPhone 17 Pro Max\niPhone 16 Pro\nSamsung Galaxy S25 Ultra 512GB unlocked\niPhone 15');
await page.waitForTimeout(700);
ok(/^Ready/.test(await page.textContent('#bl-check')), 'a typed list with a long line still fits: ' + await page.textContent('#bl-check'));
await page.click('#qa-angles [data-angle="general"]'); await page.click('#qa-angles [data-angle="wholesale"]');
await page.waitForTimeout(500);
ok((await page.inputValue('#bl-models')).startsWith('iPhone 17 Pro Max\niPhone 16 Pro'), 'the typed list is kept when the angle changes');
await page.click('#bl-reset'); await page.waitForTimeout(500);
ok((await page.inputValue('#bl-models')).split('\n')[0] !== 'iPhone 17 Pro Max' || models[0] === 'iPhone 17 Pro Max', 'Use the ad\'s phones goes back to the picture\'s models');
const es = await page.evaluate(async () => {
  const B = await import('/motion/buylist.js');
  const words = []; const real = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function (t, ...r) { words.push(t); return real.call(this, t, ...r); };
  B.drawBuyList({ palette: 'sand', aspect: '4:5', lang: 'es', phones: [], number: '(562) 999-4994', area: 'Long Beach' }, ['iPhone 16'], {}, {});
  CanvasRenderingContext2D.prototype.fillText = real;
  return words;
});
ok(es.includes('COMPRAMOS') && es.includes('ESTA SEMANA') && es.includes('UNA OFERTA POR TODO EL LOTE'), 'the Spanish card says it in Spanish');
ok(!es.some(w => /\$\s?\d|[–—]|\bBEST\b|\bTOP\b|\bHIGHEST\b/.test(w)), 'no price, dash or claim on the card');

// 5: download
const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('#bl-download')]);
const path = await dl.path();
const bytes = readFileSync(path);
const dims = await page.evaluate(async b64 => { const im = new Image(); im.src = 'data:image/jpeg;base64,' + b64; await im.decode(); return [im.naturalWidth, im.naturalHeight]; }, bytes.toString('base64'));
const aspect = await page.evaluate(() => JSON.parse(localStorage.getItem('pgfx_motion_v1') || localStorage.getItem('pgfx_motion') || '{}')?.style?.aspect || null);
ok(/^buying-list-\d{4}-\d\d-\d\d-\d+x\d+\.jpg$/.test(dl.suggestedFilename()) && bytes.length > 20000 && dims[0] >= 1080, `download ${dl.suggestedFilename()}, ${dims.join('x')}, ${(bytes.length / 1024).toFixed(0)} KB` + (aspect ? ` (ad ${aspect})` : ''));
ok(/^Saved buying-list/.test(await page.textContent('#bl-check')), 'the note says what was saved');

// 6
await page.setViewportSize({ width: 390, height: 900 });
await page.waitForTimeout(400);
const wide = await page.evaluate(() => document.documentElement.scrollWidth);
ok(wide <= 391, `nothing scrolls sideways at 390 (${wide})`);
if (SHOTS) await page.locator('#qa-buylist').screenshot({ path: SHOTS + '/buylist-390.png' });
ok(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
const csps = await page.evaluate(() => window.__csp);
ok(csps.length === 0, 'no CSP violations' + (csps.length ? ': ' + csps.join(', ') : ''));

await browser.close();
console.log(fails.length ? `${fails.length} failed` : 'all passed');
process.exit(fails.length ? 1 : 0);
