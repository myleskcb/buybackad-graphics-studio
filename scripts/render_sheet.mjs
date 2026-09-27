#!/usr/bin/env node
/* Render real template output to PNG contact sheets.
   The library lies about its own health (landmine 2) — 243/243 "renders" is not
   proof anything looks good. This dumps actual pixels so a human, or a vision
   model, can LOOK.

   usage:
     node scripts/render_sheet.mjs                 # 24 random templates
     node scripts/render_sheet.mjs --cat phones    # one category
     node scripts/render_sheet.mjs --ids a,b,c     # named templates
     node scripts/render_sheet.mjs --all           # every template, paged
*/
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE   = process.env.GFX_BASE || 'http://localhost:8899/';
const OUT    = new URL('../.render/', import.meta.url).pathname;

const argv = process.argv.slice(2);
const arg  = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const has  = k => argv.includes(k);

const cat   = arg('--cat', null);
const ids   = arg('--ids', null);
const cols  = +arg('--cols', 6);
const cell  = +arg('--cell', 300);
const limit = +arg('--limit', 24);

mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--allow-file-access-from-files', '--force-color-profile=srgb'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 1 });

const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 });
// backdrops and cutouts load async; give the preloaders room
await page.evaluate(() => document.fonts.ready);
// Wait for the measured contrast table (assets/contrast-fix.json) to load and
// apply. It is fetched asynchronously, so a harness that starts measuring too
// early records the PRE-repair colours and reports failures that are already
// fixed on screen.
await page.waitForFunction(() => typeof CONTRAST_FIX !== 'undefined' && CONTRAST_FIX !== null, { timeout: 20000 }).catch(()=>{});
await new Promise(r => setTimeout(r, 6000));

// ---- integrity check: every invoked pass must still have a definition (rule 42)
const health = await page.evaluate(() => {
  const out = { total: null, styles: {}, cats: {}, missing: [], err: null };
  try {
    out.total = TEMPLATES.length;
    TEMPLATES.forEach(t => {
      out.styles[t.style || 'none'] = (out.styles[t.style || 'none'] || 0) + 1;
      out.cats[t.cat || 'none'] = (out.cats[t.cat || 'none'] || 0) + 1;
    });
    const passes = ['completeTemplate','applyCategoryMarks','applyBrandVocab','enforceTypeWeight',
      'enforcePlateSolidity','enforceInkOnPlate','stackBulletRuns','addProductCutout','assignStyle',
      'colourTheory','displayFaceFix','enrichFills','opticalTracking','normaliseBackdrop',
      'inkVsWash','highlightBudget','bodyPanel','warmTheWhites'];
    passes.forEach(p => { if (typeof window[p] !== 'function' && typeof eval(`typeof ${p}`) !== 'function') out.missing.push(p); });
  } catch (e) { out.err = String(e); }
  return out;
});
console.log('TEMPLATES:', health.total);
console.log('styles:', JSON.stringify(health.styles));
console.log('cats:', JSON.stringify(health.cats));
if (health.missing.length) console.log('MISSING PASSES:', health.missing.join(', '));
if (health.err) console.log('HEALTH ERR:', health.err);

// ---- pick the set
const picked = await page.evaluate((cat, ids, limit, all) => {
  let list = TEMPLATES;
  if (ids) { const s = new Set(ids.split(',')); list = list.filter(t => s.has(t.id)); }
  else if (cat) list = list.filter(t => t.cat === cat);
  if (!all && list.length > limit) {
    const step = list.length / limit;
    list = Array.from({ length: limit }, (_, i) => list[Math.floor(i * step)]);
  }
  return list.map(t => ({ id: t.id, name: t.name, cat: t.cat, style: t.style,
                          hasCutout: !!(t.layers || []).some(l => l.kind === 'cutout' || l.cutout) }));
}, cat, ids, limit, has('--all'));

console.log('rendering', picked.length, 'templates');

// ---- render each through the product's own thumbnail path
const shots = [];
for (const t of picked) {
  const url = await page.evaluate(id => {
    try {
      const tpl = TEMPLATES.find(x => x.id === id);
      return renderThumb(tpl, 512);
    } catch (e) { return 'ERR:' + e.message; }
  }, t.id);
  if (url.startsWith('ERR:')) { console.log('FAIL', t.id, url); continue; }
  shots.push({ ...t, url });
}

// ---- --singles: one PNG per template, for measurement rather than eyeballing
if (has('--singles')){
  const dir = OUT + 'singles/';
  mkdirSync(dir, { recursive: true });
  shots.forEach(s => {
    writeFileSync(dir + s.id + '.png', Buffer.from(s.url.split(',')[1], 'base64'));
  });
  console.log('wrote ' + shots.length + ' singles to ' + dir);
}

// ---- compose contact sheets with labels, in-page
const sheets = has('--singles') ? [] : await page.evaluate((shots, cols, cell) => {
  const pad = 8, lab = 26;
  const per = cols * 4;
  const out = [];
  for (let p = 0; p < Math.ceil(shots.length / per); p++) {
    const slice = shots.slice(p * per, (p + 1) * per);
    const rows = Math.ceil(slice.length / cols);
    const cv = document.createElement('canvas');
    cv.width = cols * (cell + pad) + pad;
    cv.height = rows * (cell + pad + lab) + pad;
    const x = cv.getContext('2d');
    x.fillStyle = '#15151a'; x.fillRect(0, 0, cv.width, cv.height);
    out.push(new Promise(res => {
      let done = 0;
      if (!slice.length) return res(cv.toDataURL('image/png'));
      slice.forEach((s, i) => {
        const im = new Image();
        im.onload = () => {
          const cx = pad + (i % cols) * (cell + pad);
          const cy = pad + Math.floor(i / cols) * (cell + pad + lab);
          x.drawImage(im, cx, cy, cell, cell);
          x.fillStyle = '#8a8a95'; x.font = '12px -apple-system, sans-serif';
          x.fillText((s.style || '?') + ' · ' + s.id.slice(0, 30), cx, cy + cell + 15);
          if (++done === slice.length) res(cv.toDataURL('image/png'));
        };
        im.onerror = () => { if (++done === slice.length) res(cv.toDataURL('image/png')); };
        im.src = s.url;
      });
    }));
  }
  return Promise.all(out);
}, shots, cols, cell);

const tag = ids ? 'ids' : (cat || 'mix');
sheets.forEach((d, i) => {
  const f = `${OUT}sheet-${tag}-${i + 1}.png`;
  writeFileSync(f, Buffer.from(d.split(',')[1], 'base64'));
  console.log('wrote', f);
});

if (errors.length) {
  console.log('--- PAGE ERRORS ---');
  errors.slice(0, 10).forEach(e => console.log(e));
}
await browser.close();
/* A page error means a PASS THREW. The library still renders 243/243 when that
   happens — that is landmine 2 — so a clean-looking sheet is not evidence of
   anything while errors are outstanding. Exit non-zero so this can never be
   mistaken for a green run again. */
if (errors.some(e => !/404|Failed to load resource/i.test(e))) {
  console.log('\nFAILED: a script error fired during render. The sheet above is NOT trustworthy.');
  process.exit(1);
}
