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

   A pinned pick (2026-11-22: the owner approved the wall, "Approve the wall"; assets/hero-picks.json
   "pins") is drawn in the pair it was approved in, and keeps its approved still. New pairs in the
   engine move every seed's draw, and must never recolour an approved wall. It is drawn again only with
   --redraw, or when its pin changes, and the wall opens it in that pair (app.js openHouseAd, the
   still's "pin").

   usage:  GFX_BASE=http://127.0.0.1:8931/ node scripts/build_hero_stills.mjs          draw what is missing or stale
           node scripts/build_hero_stills.mjs --check   exit 1 if a recipe or full-ad pick has no still, or a pinned one is off its pin
           --redraw   draw every pick again, the pinned ones in their pins */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { engineStamp, sampleNumber } from './engine_stamp.mjs';

const ROOT = new URL('../', import.meta.url).pathname, DIR = ROOT + 'assets/hero/';
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8931/').replace(/\/?$/, '/');
// Long Beach, as the library cards showed; a sample number per still (engine_stamp.mjs), never the business's
// own line (every still printed it until 2026-11-23)
const SHOP = { zip: '90802' };
const ENGINE = engineStamp();   // the engine a still was drawn by (engine_stamp.mjs)
const HP = JSON.parse(readFileSync(ROOT + 'assets/hero-picks.json', 'utf8'));
const picks = (HP.picks || []).map(String), pins = HP.pins || {};
const house = picks.filter(id => /^r-|^full-/.test(id));
const index = existsSync(DIR + 'index.json') ? JSON.parse(readFileSync(DIR + 'index.json', 'utf8')) : { items: {} };
// a recipe pick whose still the library's rebuilt ads already have (scripts/build_recipe_stills.mjs) needs no second one,
// unless it is pinned: the library's still follows the engine's draw, the wall's keeps the pair it was approved in
const rebuilt = existsSync(ROOT + 'assets/recipe-stills/index.json') ? JSON.parse(readFileSync(ROOT + 'assets/recipe-stills/index.json', 'utf8')).items || {} : {};
const own = id => !pins[id] && !!rebuilt[id] && existsSync(ROOT + rebuilt[id].thumb);
// a pinned pick keeps its approved still (in its pin) unless --redraw; an unpinned one is drawn again on every run, as before
const REDRAW = process.argv.includes('--redraw');
const kept = id => !REDRAW && !!pins[id] && !!index.items[id] && index.items[id].pair === pins[id] && existsSync(DIR + id + '.webp');
const missing = house.filter(id => !own(id) && (!index.items[id] || !existsSync(DIR + id + '.webp')));
const offPin = house.filter(id => pins[id] && index.items[id] && index.items[id].pair !== pins[id]);
// drawn by an older engine: an unpinned still is stale; a pinned one is the approved wall, kept, and said
const oldEngine = house.filter(id => !own(id) && index.items[id] && index.items[id].engine !== ENGINE);
const staleFree = oldEngine.filter(id => !pins[id]), stalePinned = oldEngine.filter(id => pins[id]);

if (process.argv.includes('--check')) {
  if (missing.length) { console.error(`hero stills missing for ${missing.length} pick${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}; run node scripts/build_hero_stills.mjs`); process.exit(1); }
  if (offPin.length) { console.error(`hero stills off their pinned pair: ${offPin.map(id => `${id} (${index.items[id].pair}, pinned ${pins[id]})`).join(', ')}; run node scripts/build_hero_stills.mjs`); process.exit(1); }
  if (staleFree.length) { console.error(`hero stills drawn by an older engine: ${staleFree.join(', ')}; run node scripts/build_hero_stills.mjs`); process.exit(1); }
  if (stalePinned.length) console.log(`hero stills: ${stalePinned.length} approved pick${stalePinned.length === 1 ? ' was' : 's were'} drawn by an older engine and kept as approved; the wall does not show today's ads until they are drawn again (--redraw) and approved again`);
  const n = house.filter(id => pins[id]).length;
  console.log(`hero stills: ${house.length} recipe or full-ad pick${house.length === 1 ? '' : 's'}, each with its still` + (n ? `, ${n} in the pair it was approved in` : ''));
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
  $('ez-website').value = '';
}, SHOP);

for (const id of house.filter(id => !own(id) && !kept(id))) {
  const got = await page.evaluate(async ({ id, pin, number }) => {
    $('ez-phone').value = number;
    const M = await import('/motion/fullad.js'), FS = window.FullAdStudio, FA = FS.state;
    let meta;
    if (id.startsWith('r-')) {
      const r = await FS.useRecipe(id); if (!r) return { error: 'no recipe ' + id };
      FA.biz = '';   // on its own seed (useRecipe sets it: the rebuild, 2026-11-18)
      if (pin) FA.pair = pin;   // in the pair it was approved in
      meta = { kind: 'recipe', cat: r.cat, line: r.subject, seed: FA.seed, name: r.label || id, from: r.from || '', family: (r.look && r.look.family) || '' };
    } else {
      const m = /^full-(.+?)(?:-v(\d+))?$/.exec(id), key = m && m[1], seed = m && m[2] ? +m[2] : 1;
      // a pick of a line that folded into another (the owner's lines, 2026-11-18) is drawn on that line
      const S = FS.lines().find(s => s.key === ((FS.aliases ? FS.aliases() : {})[key] || key)); if (!S) return { error: 'no line ' + key };
      if (currentCat !== S.cat) setCategory(S.cat);
      FA.line[S.cat] = S.key; FA.recipe[S.cat] = ''; FA.seed = seed; FA.pair = pin || ''; FA.voice = ''; FA.words = {}; FA.set = {}; FA.biz = '';
      meta = { kind: 'full', cat: S.cat, line: S.key, seed, name: S.label + (seed > 1 ? ` (full ad, look ${seed})` : ' (full ad)') };
    }
    const { ad, st } = await FS.build(1080, FORMATS.square);
    const frame = M.fullStill(ad), c = document.createElement('canvas'); c.width = c.height = 448;
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(frame, 0, 0, 448, 448);
    const product = (ad.phones || [])[0] || '';
    // what the wall's own check reads (scripts/hero_wall_check.mjs): the pair and its look, the kind of ground, the headline
    const pair = st.full_colour || '', P = (await import('/motion/house-colours.js')).HOUSE_COLOURS.find(c => c.key === pair);
    const bg = String(st.background || ''), { GROUND_SCENES } = await import('/motion/full-grounds.js');
    // the engine's kinds (motion/full-grounds.js GROUND_SHARES): the four families of 2026-11-22 by their own names; 'house' is the plain
    // radial, tonal and linear alone (it took all four until 2026-11-23, and read as plain)
    const ground = bg === 'photo' ? 'photo' : /^pair_/.test(bg) ? 'gradient' : /^pat_/.test(bg) ? 'pattern' : GROUND_SCENES.includes(bg) ? 'scene'
      : /^abs_/.test(bg) ? 'abstract' : /^shp_/.test(bg) ? 'shape' : /^prod_/.test(bg) ? 'product' : /^typ_/.test(bg) ? 'type' : 'house';
    return { ...meta, pair, pairName: P ? P.name : '', look: P ? P.look : '', background: bg, ground, headline: String(st.headline || ''), product: String(product), webp: c.toDataURL('image/webp', 0.78) };
  }, { id, pin: pins[id] || '', number: sampleNumber(id) });
  if (got.error) { console.log(`  ${id}: ${got.error}`); continue; }
  writeFileSync(DIR + id + '.webp', Buffer.from(got.webp.split(',')[1], 'base64'));
  const { webp, ...meta } = got;
  index.items[id] = { ...meta, thumb: 'assets/hero/' + id + '.webp', number: sampleNumber(id), engine: ENGINE, ...(pins[id] ? { pin: pins[id] } : {}) };
  console.log(`  ${id}: ${meta.name} on ${meta.pair}`);
}
const keptN = house.filter(id => kept(id)).length;
if (keptN) console.log(`  ${keptN} pinned pick${keptN === 1 ? '' : 's'} kept as approved (--redraw draws them again)`);
await browser.close();
// a still whose pick is gone stays on disk, out of the index
for (const id of Object.keys(index.items)) if (!house.includes(id)) delete index.items[id];
writeFileSync(DIR + 'index.json', JSON.stringify({ about: 'Stills of the recipe and full-ad hero picks (assets/hero-picks.json), drawn by scripts/build_hero_stills.mjs; app.js scBuildWall shows them and opens each in the full ad. A pinned pick (pin) is drawn and opened in the pair it was approved in.', made: new Date().toISOString(), items: index.items }, null, 1) + '\n');
console.log(`hero stills: ${Object.keys(index.items).length} in assets/hero/index.json`);
