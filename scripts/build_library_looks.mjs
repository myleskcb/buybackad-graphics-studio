#!/usr/bin/env node
/* THE LIBRARY'S OTHER LOOKS: assets/library-looks/ (DESIGN-LAW 158, OPEN-ITEMS BN).

   The owner, 2026-11-19, of the live library's "All 665": "see not the new 2000". The ~2,000 they had
   seen was the review page, which counts every ad the census reads. Asked what the new library should
   hold (three looks of every rebuilt design, the video maker's ads, both, or the 665), they chose
   "Both (~2,650)". The rebuilt designs' first looks are assets/recipe-stills/ (build_recipe_stills.mjs);
   this draws everything else the library now shows, into assets/library-looks/<id>.webp, and writes
   assets/library-looks/index.json, which app.js reads beside the recipe stills:

   - **Two more looks of every rebuilt design** (<recipe id>~2, ~3): the recipe as Easy Mode's full ad
     opens it, on the seeds after its own, as New look walks them (full-ad-studio.js fa-shuffle: seed + 1).
     A seed counts when its look passes the full ad's own pre-flight (fullPreflight, the download gate's
     reading) and is drawn in a colour pair this design does not wear yet, so the three are three colour
     sets, not one ad 5% off (rule 154).
   - **Every line's own full ad** (full-<line>, full-<line>-v2 ...): the house full ad on that line with
     nothing but the shop's number and area typed, on its first passing seeds, as the census reads it
     (ad_census.mjs cz.full). Opens in Easy Mode's full ad on that line and seed.
   - **The video maker's Any look gallery** (any-<seed>): every look the gallery offers, drawn from its
     own plan as the gallery drew it (a look redrawn at 1080 is laid out afresh), at the still's size.
     Opens in the video maker on that look (motion/?full=0&look=<seed>).

   Each still is 400px webp, the recipe stills' size. A still is drawn again when what it was drawn from
   moves (stamp); --all draws every one again (after the engine or the looks change).

   usage:  GFX_BASE=http://127.0.0.1:8932/ node scripts/build_library_looks.mjs [--all] [--only looks,full,any]
           node scripts/build_library_looks.mjs --check   exit 1 if a rebuilt design lacks its looks or a still its file */
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';

const ROOT = new URL('../', import.meta.url).pathname, DIR = ROOT + 'assets/library-looks/', INDEX = DIR + 'index.json';
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8931/').replace(/\/?$/, '/');
const SHOP = { number: '(562) 999-4994', zip: '90802', town: 'Long Beach' };   // the library's own number and Long Beach
const SIZE = 400, LOOKS = 3, FULL_SEEDS = 6, TRIES = 24, WORKERS = Math.max(1, +(process.env.WORKERS || 4));
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ONLY = (arg('--only') || 'looks,full,any').split(',');
const ALL = process.argv.includes('--all');

// the library's rebuilt designs: the recipes made from a library card or an offer card (build_recipe_stills.mjs)
const recipes = JSON.parse(readFileSync(ROOT + 'motion/recipes.json', 'utf8')).recipes.filter(r => r.gen === 'sc' || r.gen === 'of');
const firsts = existsSync(ROOT + 'assets/recipe-stills/index.json') ? JSON.parse(readFileSync(ROOT + 'assets/recipe-stills/index.json', 'utf8')).items : {};
const lines = JSON.parse(readFileSync(ROOT + 'motion/subjects.json', 'utf8')).subjects;
const index = existsSync(INDEX) ? JSON.parse(readFileSync(INDEX, 'utf8')) : { items: {} };
const items = index.items || {};
const lookStamp = r => JSON.stringify([r.seed, r.subject, r.words, r.pictures, r.words_only || false, r.label, LOOKS]);
const fullStamp = s => JSON.stringify([s.key, s.cat, s.label, FULL_SEEDS]);
const has = id => items[id] && existsSync(DIR + id + '.webp');

if (process.argv.includes('--check')) {
  const bad = [];
  for (const r of recipes) if (firsts[r.id]) {
    const got = Object.values(items).filter(x => x.kind === 'recipe' && x.base === r.id);
    if (!got.length || got.some(x => x.stamp !== lookStamp(r))) bad.push(r.id + ': its looks are missing or stale');
  }
  for (const s of lines) if (!Object.values(items).some(x => x.kind === 'full' && x.line === s.key && x.stamp === fullStamp(s))) bad.push(s.key + ': no full ad');
  for (const [id, x] of Object.entries(items)) if (!existsSync(DIR + id + '.webp')) bad.push(id + ': no file');
  if (!Object.values(items).some(x => x.kind === 'any')) bad.push('no Any look from the video maker');
  if (bad.length) { console.error(`library looks: ${bad.length} wrong (${bad.slice(0, 6).join('; ')}); run node scripts/build_library_looks.mjs`); process.exit(1); }
  const n = k => Object.values(items).filter(x => x.kind === k).length;
  console.log(`library looks: ${n('recipe')} more looks of the rebuilt designs, ${n('full')} line full ads, ${n('any')} Any looks`);
  process.exit(0);
}

mkdirSync(DIR, { recursive: true });
const require = createRequire(import.meta.url), { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
const save = () => writeFileSync(INDEX, JSON.stringify({
  about: 'The library\'s other looks (DESIGN-LAW 158): two more looks of every rebuilt design, every line\'s own full ad and the video maker\'s Any look gallery, drawn by scripts/build_library_looks.mjs at 400px; app.js shows them in the landing library beside assets/recipe-stills/ and opens each where it is made.',
  made: new Date().toISOString(), size: SIZE, items: Object.fromEntries(Object.keys(items).sort().map(k => [k, items[k]])),
}, null, 1) + '\n');
const put = (id, webp, meta) => { writeFileSync(DIR + id + '.webp', Buffer.from(webp.split(',')[1], 'base64')); items[id] = { ...meta, thumb: 'assets/library-looks/' + id + '.webp' }; };

/* ---- Easy Mode's full ad: the more looks of each design, and each line's own ---- */
async function studioPage() {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', e => console.error('page error:', e.message));
  await page.goto(BASE + '?demo=1', { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => typeof renderEzCanvas === 'function' && typeof TEMPLATES !== 'undefined' && window.FullAdStudio, null, { timeout: 120000 });
  await page.evaluate(async S => {
    account = { email: 'stills@local', role: 'admin', plan: 'pro' }; loadAccount = async () => account; recordExport = async () => true;
    const a = await resolveArea(S.zip); if (a) setArea(a);
    try { jset('pgfx_area_asked', true); } catch (e) { }
    $('ez-phone').value = S.number; $('ez-website').value = '';
  }, SHOP);
  return page;
}
// one ad drawn and read: a recipe on a seed, or a line's own full ad on a seed; null pre-flight fails are reported
const DRAW = async ({ how, id, key, seed, SIZE }) => {
  const M = await import('/motion/fullad.js'), H = await import('/motion/house-colours.js'), FS = window.FullAdStudio, FA = FS.state;
  if (how === 'recipe') { const r = await FS.useRecipe(id); if (!r) return { error: 'no recipe ' + id }; }
  else {
    const S = FS.lines().find(s => s.key === key); if (!S) return { error: 'no line ' + key };
    if (currentCat !== S.cat) setCategory(S.cat);
    FA.line[S.cat] = S.key; FA.words = {}; FA.set = {}; FA.recipe = {}; FA.pair = ''; FA.voice = '';
  }
  FA.biz = ''; FA.seed = seed;
  const { ad, st } = await FS.build(1080, FORMATS.square);
  const frame = M.fullStill(ad), pre = M.fullPreflight(ad, frame);
  const pair = st.full_colour || '', P = H.HOUSE_COLOURS.find(c => c.key === pair);
  if (!pre.ok) return { fail: pre.findings.filter(f => f.level === 'fix').map(f => f.code).join(',') || 'pre-flight', pair };
  const c = document.createElement('canvas'); c.width = c.height = SIZE;
  const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(frame, 0, 0, SIZE, SIZE);
  return { pair, pairName: P ? P.name : '', accent: st.colors ? st.colors.accent : '', webp: c.toDataURL('image/webp', .76) };
};

const jobs = [];
if (ONLY.includes('looks')) for (const r of recipes) {
  if (!firsts[r.id]) continue;   // a design with no first look is not in the library
  const done = Object.values(items).filter(x => x.kind === 'recipe' && x.base === r.id);
  if (!ALL && done.length && done.every(x => x.stamp === lookStamp(r) && existsSync(DIR + x.id + '.webp'))) continue;
  jobs.push({ kind: 'looks', r });
}
if (ONLY.includes('full')) for (const s of lines) {
  const done = Object.values(items).filter(x => x.kind === 'full' && x.line === s.key);
  if (!ALL && done.length && done.every(x => x.stamp === fullStamp(s) && existsSync(DIR + x.id + '.webp'))) continue;
  jobs.push({ kind: 'full', s });
}
const LIMIT = +(arg('--limit') || 0);   // a trial: the first n designs and lines, and the first n looks
if (LIMIT) jobs.splice(LIMIT);
let drawn = 0, short = [];
if (jobs.length) {
  console.log(`the studio: ${jobs.length} designs and lines, ${WORKERS} at a time`);
  const pages = await Promise.all(Array.from({ length: Math.min(WORKERS, jobs.length) }, studioPage));
  let next = 0;
  await Promise.all(pages.map(async page => {
    while (next < jobs.length) {
      const job = jobs[next++];
      if (job.kind === 'looks') {
        const r = job.r, want = LOOKS - 1, used = new Set([firsts[r.id].pair]), got = [];
        for (const id of Object.keys(items)) if (items[id].kind === 'recipe' && items[id].base === r.id) delete items[id];
        for (let k = 1; k <= TRIES && got.length < want; k++) {
          const res = await page.evaluate(DRAW, { how: 'recipe', id: r.id, seed: r.seed + k, SIZE });
          if (res.error) { console.log(`  ${r.id}: ${res.error}`); break; }
          if (res.fail || used.has(res.pair)) continue;
          used.add(res.pair); got.push(k);
          const id = `${r.id}~${got.length + 1}`, { webp, ...meta } = res;
          put(id, webp, { kind: 'recipe', id, base: r.id, look: got.length + 1, seed: r.seed + k, cat: r.cat, line: r.subject,
            name: firsts[r.id].name, family: firsts[r.id].family || '', from: r.from, gen: r.gen, ...meta, stamp: lookStamp(r) });
          drawn++;
        }
        if (got.length < want) short.push(r.id + ` (${got.length + 1} looks)`);
      } else {
        const s = job.s, used = new Set();
        for (const id of Object.keys(items)) if (items[id].kind === 'full' && items[id].line === s.key) delete items[id];
        let n = 0;
        for (let seed = 1; seed <= TRIES && n < FULL_SEEDS; seed++) {
          const res = await page.evaluate(DRAW, { how: 'full', key: s.key, seed, SIZE });
          if (res.error) { console.log(`  ${s.key}: ${res.error}`); break; }
          if (res.fail || used.has(res.pair)) continue;
          used.add(res.pair); n++;
          const id = 'full-' + s.key + (n > 1 ? '-v' + n : ''), { webp, ...meta } = res;
          put(id, webp, { kind: 'full', id, seed, cat: s.cat, line: s.key, name: s.label + ' full ad', ...meta, stamp: fullStamp(s) });
          drawn++;
        }
        if (n < FULL_SEEDS) short.push(s.key + ` (${n} full ads)`);
      }
      if (drawn && drawn % 50 < 3) save();
    }
  }));
  save();
}

/* ---- the video maker's Any look gallery ---- */
if (ONLY.includes('any') && (ALL || !Object.values(items).some(x => x.kind === 'any'))) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', e => console.error('video maker page error:', e.message));
  await page.goto(BASE + 'motion/', { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('#mode [data-full="0"]', { timeout: 60000 });
  await page.waitForFunction(() => { const l = document.getElementById('loading'); return l && l.hidden; }, null, { timeout: 90000 });
  // every look the gallery draws, with the canvas it drew it in (as the census reads them, ad_census.mjs cz.watch)
  await page.evaluate(async () => {
    const eng = await import('/motion/engine.js'); window.__looks = [];
    const orig = eng.Ad.prototype.stillAt;
    if (!orig.__lib) { eng.Ad.prototype.stillAt = function (ctx, ...a) { const r = orig.call(this, ctx, ...a); try { if (this.st && !this.st.full && ctx.canvas) window.__looks.push({ ad: this, c: ctx.canvas }); } catch (e) { } return r; }; eng.Ad.prototype.stillAt.__lib = true; }
  });
  // one field at a time, each saved before the next (OPEN-ITEMS BI: typed together, the number is lost)
  await page.fill('#f-number', SHOP.number);
  await page.waitForFunction(n => { try { return (JSON.parse(localStorage.getItem('pgfx_motion_v1') || '{}').style || {}).number === n; } catch (e) { return false; } }, SHOP.number, { timeout: 20000 }).catch(() => console.log('  the video maker did not save the number'));
  await page.fill('#f-area', SHOP.town);
  await page.waitForTimeout(900);
  await page.click('#mode [data-full="0"]');
  await page.waitForTimeout(1200);
  await page.locator('#looks').scrollIntoViewIfNeeded();
  let last = -1, still = 0;
  for (let k = 0; k < 160; k++) {
    await page.waitForTimeout(700);
    const st = await page.evaluate(() => { const b = document.getElementById('more'); return { n: document.querySelectorAll('#gallery .mo-thumb').length, hidden: !b || b.hidden, disabled: !!(b && b.disabled) }; });
    if (st.hidden && st.n === last) { if (++still > 3) break; } else still = 0;
    if (!st.hidden && !st.disabled) await page.click('#more').catch(() => {});
    last = st.n;
  }
  const got = await page.evaluate(async ({ SIZE, LIMIT }) => {
    const shown = [...document.querySelectorAll('#gallery .mo-thumb')].slice(0, LIMIT || undefined), byCanvas = new Map(window.__looks.map(x => [x.c, x.ad])), out = [];
    for (const b of shown) {
      const c = b.querySelector('canvas'), ad = byCanvas.get(c); if (!ad || !ad.st) continue;
      const sec = b.closest('section.mo-shelf'), shelf = sec ? ((sec.querySelector('h4') || {}).textContent || '') : '';
      const see = sec && sec.querySelector('[data-cat]'), shelfId = see ? see.dataset.cat : '';   // its shelf, for the link (motion/app.js ?shelf=)
      const cap = b.querySelector('.mo-cap'), name = cap ? ((cap.querySelector('b') || {}).textContent || '') : '';
      // the look's own plan, drawn at the still's size (a look redrawn at 1080 is laid out afresh)
      const cv = document.createElement('canvas'); cv.width = SIZE; cv.height = Math.round(SIZE * ad.H / ad.W);
      const g = cv.getContext('2d'); g.scale(cv.width / ad.W, cv.height / ad.H); ad.stillAt(g);
      out.push({ seed: ad.st.seed, name: name.trim(), shelf: shelf.trim(), shelfId, w: cv.width, h: cv.height, webp: cv.toDataURL('image/webp', .8) });
    }
    return out;
  }, { SIZE, LIMIT });
  for (const id of Object.keys(items)) if (items[id].kind === 'any') delete items[id];
  for (const l of got) {
    const id = 'any-' + l.seed, { webp, ...meta } = l;
    put(id, webp, { kind: 'any', id, seed: l.seed, cat: 'phones', line: 'video', name: meta.name || 'Video look', shelf: meta.shelfId, shelfName: meta.shelf, w: meta.w, h: meta.h, stamp: String(l.seed) });
  }
  console.log(`Any look: ${got.length} looks from the gallery`);
  await page.close();
  save();
}
await browser.close();
const bytes = Object.keys(items).reduce((t, id) => t + (existsSync(DIR + id + '.webp') ? statSync(DIR + id + '.webp').size : 0), 0);
const n = k => Object.values(items).filter(x => x.kind === k).length;
console.log(`\nlibrary looks: ${n('recipe')} more looks, ${n('full')} line full ads, ${n('any')} Any looks; ${(bytes / 1048576).toFixed(1)} MB; ${drawn} drawn now`
  + (short.length ? `\nshort of their looks (no other passing pair within ${TRIES} seeds): ${short.length}: ${short.slice(0, 12).join(', ')}` : ''));
