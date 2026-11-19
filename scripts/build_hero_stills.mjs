#!/usr/bin/env node
/* THE HERO WALL'S STILLS OF HOUSE ADS (DESIGN-LAW 145; OPEN-ITEMS §BJ).

   The owner, 2026-11-18: "I will hand select the best hero ones for variety of colors, styles,
   designs, copy.. etc", after the rebuild made every ad a recipe the full ad draws, and then: make
   the hero wall show recipe and full-ad picks too. The wall (app.js scBuildWall) draws library
   cards from their baked thumbnails; a recipe (motion/recipes.json, an id "r-...") or a look of
   the full ad (an id "full-<line>" or "full-<line>-v<n>", seed n, as the census names them) has
   no thumbnail of its own. This draws one for each such pick in assets/hero-picks.json, through
   Easy Mode's own full ad (FullAdStudio.build, the picture a customer downloads), on the shop's
   number and area as the library cards show them, into assets/hero/<id>.webp, and writes
   assets/hero/index.json, which the wall reads to show them and to open each one in the full ad.

   usage:  GFX_BASE=http://127.0.0.1:8931/ node scripts/build_hero_stills.mjs          draw what is missing or stale
           node scripts/build_hero_stills.mjs --check   exit 1 if a recipe or full-ad pick has no still */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const ROOT = new URL('../', import.meta.url).pathname, DIR = ROOT + 'assets/hero/';
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8931/').replace(/\/?$/, '/');
const SHOP = { number: '(562) 999-4994', zip: '90802' };   // the library cards' own number and Long Beach
const picks = (JSON.parse(readFileSync(ROOT + 'assets/hero-picks.json', 'utf8')).picks || []).map(String);
const house = picks.filter(id => /^r-|^full-/.test(id));
const index = existsSync(DIR + 'index.json') ? JSON.parse(readFileSync(DIR + 'index.json', 'utf8')) : { items: {} };
const missing = house.filter(id => !index.items[id] || !existsSync(DIR + id + '.webp'));

if (process.argv.includes('--check')) {
  if (missing.length) { console.error(`hero stills missing for ${missing.length} pick${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}; run node scripts/build_hero_stills.mjs`); process.exit(1); }
  console.log(`hero stills: ${house.length} recipe or full-ad pick${house.length === 1 ? '' : 's'}, each with its still`);
  process.exit(0);
}
if (!house.length) { console.log('no recipe or full-ad picks in assets/hero-picks.json'); process.exit(0); }

mkdirSync(DIR, { recursive: true });
const require = createRequire(import.meta.url), { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch(), page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(BASE + '?demo=1', { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => typeof renderEzCanvas === 'function' && typeof TEMPLATES !== 'undefined' && window.FullAdStudio, null, { timeout: 120000 });
await page.evaluate(async S => {
  account = { email: 'hero@local', role: 'admin', plan: 'pro' }; loadAccount = async () => account; recordExport = async () => true;
  const a = await resolveArea(S.zip); if (a) setArea(a);
  try { jset('pgfx_area_asked', true); } catch (e) { }
  $('ez-phone').value = S.number; $('ez-website').value = '';
}, SHOP);

for (const id of house) {
  const got = await page.evaluate(async id => {
    const M = await import('/motion/fullad.js'), FS = window.FullAdStudio, FA = FS.state;
    let meta;
    if (id.startsWith('r-')) {
      const r = await FS.useRecipe(id); if (!r) return { error: 'no recipe ' + id };
      FA.seed = 1; FA.biz = '';
      meta = { kind: 'recipe', cat: r.cat, line: r.subject, seed: 1, name: r.label || id, from: r.from || '' };
    } else {
      const m = /^full-(.+?)(?:-v(\d+))?$/.exec(id), key = m && m[1], seed = m && m[2] ? +m[2] : 1;
      // a pick of a line that folded into another (the owner's lines, 2026-11-18) is drawn on that line
      const S = FS.lines().find(s => s.key === ((FS.aliases ? FS.aliases() : {})[key] || key)); if (!S) return { error: 'no line ' + key };
      if (currentCat !== S.cat) setCategory(S.cat);
      FA.line[S.cat] = S.key; FA.recipe[S.cat] = ''; FA.seed = seed; FA.pair = ''; FA.voice = ''; FA.words = {}; FA.set = {}; FA.biz = '';
      meta = { kind: 'full', cat: S.cat, line: S.key, seed, name: S.label + (seed > 1 ? ` (full ad, look ${seed})` : ' (full ad)') };
    }
    const { ad, st } = await FS.build(1080, FORMATS.square);
    const frame = M.fullStill(ad), c = document.createElement('canvas'); c.width = c.height = 448;
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(frame, 0, 0, 448, 448);
    const product = (ad.phones || [])[0] || '';
    return { ...meta, pair: st.full_colour || '', product: String(product), webp: c.toDataURL('image/webp', 0.78) };
  }, id);
  if (got.error) { console.log(`  ${id}: ${got.error}`); continue; }
  writeFileSync(DIR + id + '.webp', Buffer.from(got.webp.split(',')[1], 'base64'));
  const { webp, ...meta } = got;
  index.items[id] = { ...meta, thumb: 'assets/hero/' + id + '.webp' };
  console.log(`  ${id}: ${meta.name} on ${meta.pair}`);
}
await browser.close();
// a still whose pick is gone stays on disk, out of the index
for (const id of Object.keys(index.items)) if (!house.includes(id)) delete index.items[id];
writeFileSync(DIR + 'index.json', JSON.stringify({ about: 'Stills of the recipe and full-ad hero picks (assets/hero-picks.json), drawn by scripts/build_hero_stills.mjs; app.js scBuildWall shows them and opens each in the full ad.', made: new Date().toISOString(), items: index.items }, null, 1) + '\n');
console.log(`hero stills: ${Object.keys(index.items).length} in assets/hero/index.json`);
