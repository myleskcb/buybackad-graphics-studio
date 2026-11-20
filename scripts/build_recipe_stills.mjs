#!/usr/bin/env node
/* THE LIBRARY'S REBUILT ADS, AS THE LANDING SHOWS THEM: assets/recipe-stills/.

   The owner, 2026-11-18, asked whether to retire the old static library cards and offer cards now
   that each has a rebuilt version (motion/recipes.json, DESIGN-LAW 155): "Retire them". The
   landing's library grid and its wall were built from the library cards' baked thumbnails and the
   offer cards' templates; the rebuilt ads have no thumbnail of their own. This draws one for each
   recipe made from a library card or an offer card, through Easy Mode's own full ad on the
   recipe's own seed (FullAdStudio.useRecipe, then build: the picture a customer downloads), on the
   shop's number and area as the library cards showed them, into assets/recipe-stills/<id>.webp,
   and writes assets/recipe-stills/index.json, which app.js reads to show them in the library and
   on the wall and to open each in the full ad. A designer layout's recipe is left out here.

   --layouts: the designer layouts' recipes, into assets/layout-stills/ (its own index, which the
   library and its API never read). The owner, 2026-11-19, of Easy Mode's strip, which still offered
   the layouts as the old editor drew them: "now it's not loading properly or it's even worse showing
   me bad ad styles". full-ad-studio.js shows these in the strip in the layouts' place, and opens each
   in the full ad (DESIGN-LAW 155).

   usage:  GFX_BASE=http://127.0.0.1:8931/ node scripts/build_recipe_stills.mjs          draw what is missing or stale
           node scripts/build_recipe_stills.mjs --check   exit 1 if a recipe has no still, or a still no recipe
           --all   draw every one again (after the engine or the recipes change)
           --ids a,b   draw those again (after a change to the engine that only some of them draw)
           --layouts   the designer layouts' recipes instead, into assets/layout-stills/ (with the others) */
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';

const LAYOUTS = process.argv.includes('--layouts'), REL = LAYOUTS ? 'assets/layout-stills/' : 'assets/recipe-stills/';
const ROOT = new URL('../', import.meta.url).pathname, DIR = ROOT + REL;
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8931/').replace(/\/?$/, '/');
const SHOP = { number: '(562) 999-4994', zip: '90802' };   // the library cards' own number and Long Beach
const SIZE = 400;
const recipes = JSON.parse(readFileSync(ROOT + 'motion/recipes.json', 'utf8')).recipes.filter(r => LAYOUTS ? r.gen === 'dl' : r.gen === 'sc' || r.gen === 'of');
const index = existsSync(DIR + 'index.json') ? JSON.parse(readFileSync(DIR + 'index.json', 'utf8')) : { items: {} };
// a still is stale when its recipe's seed, words or line moved (the recipe a still was drawn from, by these)
const stamp = r => JSON.stringify([r.seed, r.subject, r.words, r.pictures, r.words_only || false, r.label]);
// --ids a,b: those again, besides any missing or stale (a change to the engine that only some grounds draw)
const ids0 = (i => i > 0 ? new Set(process.argv[i + 1].split(',')) : null)(process.argv.indexOf('--ids'));
const want = recipes.filter(r => process.argv.includes('--all') || (ids0 && ids0.has(r.id)) || !index.items[r.id] || index.items[r.id].stamp !== stamp(r) || !existsSync(DIR + r.id + '.webp'));

if (process.argv.includes('--check')) {
  const ids = new Set(recipes.map(r => r.id)), orphan = Object.keys(index.items).filter(id => !ids.has(id));
  if (want.length || orphan.length) { console.error(`${LAYOUTS ? 'layout' : 'recipe'} stills: ${want.length} missing or stale (${want.slice(0, 5).map(r => r.id).join(', ')}), ${orphan.length} with no recipe; run node scripts/build_recipe_stills.mjs${LAYOUTS ? ' --layouts' : ''}`); process.exit(1); }
  console.log(LAYOUTS ? `layout stills: ${recipes.length} rebuilt designer layouts, each with its still` : `recipe stills: ${recipes.length} rebuilt library and offer ads, each with its still`);
  process.exit(0);
}
mkdirSync(DIR, { recursive: true });
const require = createRequire(import.meta.url), { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch(), page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('pageerror', e => console.error('page error:', e.message));
await page.goto(BASE + '?demo=1', { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => typeof renderEzCanvas === 'function' && typeof TEMPLATES !== 'undefined' && window.FullAdStudio, null, { timeout: 120000 });
await page.evaluate(async S => {
  account = { email: 'stills@local', role: 'admin', plan: 'pro' }; loadAccount = async () => account; recordExport = async () => true;
  const a = await resolveArea(S.zip); if (a) setArea(a);
  try { jset('pgfx_area_asked', true); } catch (e) { }
  $('ez-phone').value = S.number; $('ez-website').value = '';
}, SHOP);
let n = 0;
for (const r of want) {
  const got = await page.evaluate(async ({ id, SIZE }) => {
    const M = await import('/motion/fullad.js'), FS = window.FullAdStudio, FA = FS.state;
    const r = await FS.useRecipe(id); if (!r) return { error: 'no recipe ' + id };
    FA.biz = '';
    const { ad, st } = await FS.build(1080, FORMATS.square);
    const frame = M.fullStill(ad), c = document.createElement('canvas'); c.width = c.height = SIZE;
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(frame, 0, 0, SIZE, SIZE);
    // the colour the library's palette families group it by: its pair, as the full ad drew it
    const pair = st.full_colour || '', P = (await import('/motion/house-colours.js')).HOUSE_COLOURS.find(c => c.key === pair);
    // what the wall's own check reads (scripts/hero_wall_check.mjs): the pair's look, the kind of ground, the headline
    const bg = String(st.background || ''), { GROUND_SCENES } = await import('/motion/full-grounds.js');
    const ground = bg === 'photo' ? 'photo' : /^pair_/.test(bg) ? 'gradient' : /^pat_/.test(bg) ? 'pattern' : GROUND_SCENES.includes(bg) ? 'scene' : 'house';
    // and the photograph it stands on, with the towns it prints (scripts/area_ground_check.mjs: a city's photograph only behind its own towns)
    const photo = bg === 'photo' && st.ground_photo ? String(st.ground_photo.src || '') : '', where = String(st.feed_where ?? st.area ?? ''), states = String(st.area_states || '');
    return { pair, pairName: P ? P.name : '', look: P ? P.look : '', accent: st.colors ? st.colors.accent : '', background: bg, ground, photo, where, states, headline: String(st.headline || ''), webp: c.toDataURL('image/webp', .76) };
  }, { id: r.id, SIZE });
  if (got.error) { console.log(`  ${r.id}: ${got.error}`); continue; }
  writeFileSync(DIR + r.id + '.webp', Buffer.from(got.webp.split(',')[1], 'base64'));
  const { webp, ...meta } = got;
  index.items[r.id] = { kind: 'recipe', cat: r.cat, line: r.subject, seed: r.seed, name: r.label.replace(/ \((library card|offer card|designer layout)\)$/, ''), family: (r.look && r.look.family) || '', from: r.from, gen: r.gen, ...meta, thumb: REL + r.id + '.webp', stamp: stamp(r) };
  if (++n % 25 === 0) { process.stdout.write(`${n} `); writeFileSync(DIR + 'index.json', JSON.stringify({ about: '', items: index.items }) + '\n'); }
}
await browser.close();
const ids = new Set(recipes.map(r => r.id));
for (const id of Object.keys(index.items)) if (!ids.has(id)) delete index.items[id];   // a still whose recipe is gone stays on disk, out of the index
const ABOUT = LAYOUTS ? 'Stills of the rebuilt designer layouts (motion/recipes.json, gen dl), drawn by scripts/build_recipe_stills.mjs --layouts; full-ad-studio.js shows them in Easy Mode\'s strip in the old layouts\' place and opens each in the full ad.'
  : 'Stills of the rebuilt library and offer ads (motion/recipes.json), drawn by scripts/build_recipe_stills.mjs; app.js shows them in the landing library and on the wall in place of the retired cards, and opens each in the full ad.';
writeFileSync(DIR + 'index.json', JSON.stringify({ about: ABOUT, made: new Date().toISOString(), items: index.items }, null, 1) + '\n');
const bytes = Object.keys(index.items).reduce((t, id) => t + (existsSync(DIR + id + '.webp') ? statSync(DIR + id + '.webp').size : 0), 0);
console.log(`\n${LAYOUTS ? 'layout' : 'recipe'} stills: ${Object.keys(index.items).length} in ${REL} (${(bytes / 1048576).toFixed(1)} MB), ${n} drawn now`);
