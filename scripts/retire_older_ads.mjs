#!/usr/bin/env node
/* RETIRING THE OLDER ADS THAT SHOW NO GOODS, AND THE NEAR-COPIES (OPEN-ITEMS §BJ, DESIGN-LAW 144).

   The owner, 2026-11-18, of the lowest-ranked ads (the older photo-only generations: designer
   layouts, the offer family, library cards): "retire but bg counts.. so combo of assets and bg is
   best though"; then, of a row of library cards: "row of all similar stuff and all blues???",
   "looks very generic.. and lacks unique theming".

   Reads the census (scripts/ad_census.mjs) and each older ad's ground, and retires:
     no goods     an ad with no product picture whose ground is not a photograph of its goods (a
                  photo counts when its file names the category's goods: a car for cars, gold for
                  gold, a card or Pokémon for Pokémon ...; a generated or abstract ground does not)
     near-copy    within a category, a library card on the same layout and the same ground as a
                  better-ranked one (the census's score, then its rank): the best of each stays
   A designer layout or an offer card goes into template-retired.js (the hand list), a library card
   into assets/showcase/holds.json (stamped by hold_showcase.mjs). Nothing is deleted; each row says
   why, and deleting the row brings the ad back. The review page shows what is retired.

   --rebuilt retires, instead, every library card and every offer card whose rebuilt recipe exists
   (motion/recipes.json, DESIGN-LAW 149): the owner, 2026-11-18, asked whether to retire the old static
   library and offer cards now that each has a rebuilt version, "Retire them". The landing shows each
   rebuilt ad in its card's place (app.js scLoadIndex, assets/recipe-stills/). Designer layouts stay.

   usage:  GFX_BASE=http://127.0.0.1:8931/ node scripts/retire_older_ads.mjs [--census file] [--rebuilt] [--write] */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const ROOT = new URL('../', import.meta.url).pathname;
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const WRITE = process.argv.includes('--write'), BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8931/').replace(/\/?$/, '/');
const census = JSON.parse(readFileSync(arg('--census', ROOT + '.render/ad-census/census.json'), 'utf8'));
const day = new Date().toISOString().slice(0, 10);
const GOODS = {
  phones: /iphone|phone|apple|ipad|macbook|samsung|galaxy|pixel|android|watch/, gaming: /gaming|console|ps5|xbox|switch|controller|steam|deck/,
  audio: /headphone|earbud|airpod|speaker|audio|headset/, computers: /laptop|macbook|computer|monitor|desk|ssd|chromebook|setup|-pc|pc-/,
  wearables: /watch|glasses|wear|ray-ban/, cameras: /camera|drone|lens/, gold: /gold|jewel|ring|chain|necklace|karat/,
  silver: /silver|sterling|cutlery|flatware|silverware/, coins: /coin|dollar|eagle|morgan|numismat/, cars: /car|truck|suv|van|vehicle|auto|road|dealer|jeep|tacoma|civic|silverado|challenger|lamborghini|bmw|sunset/,
  strips: /strip|glucose|meter|diabet/, pokemon: /pokemon|charizard|binder|tcg|card/, sports: /sport|baseball|basketball|football|stadium|slab|card/,
};
const goodsGround = (cat, src) => !!src && /\.(jpe?g|png|webp)$/i.test(src) && !/\/bg\/dl_|\/tplbg\//.test(src) && (GOODS[cat] || /$^/).test(src.toLowerCase());

const REBUILT = process.argv.includes('--rebuilt');
const RECIPES = JSON.parse(readFileSync(ROOT + 'motion/recipes.json', 'utf8')).recipes.filter(r => r.gen === 'sc' || r.gen === 'of');
const recipeOf = new Map(RECIPES.map(r => [r.from, r.id]));
// --rebuilt: every card a recipe was made from (the census reads only what is offered when it runs)
const older = REBUILT ? RECIPES.map(r => ({ id: r.from, gen: r.gen, cat: r.cat, name: r.label })) : census.rows.filter(r => !r.error && ['dl', 'of', 'sc'].includes(r.gen));
// each older ad's ground: library cards from their records; templates from the studio as it builds them
const ground = {};
for (const r of older.filter(r => r.gen === 'sc')) { try { ground[r.id] = (JSON.parse(readFileSync(ROOT + 'assets/showcase/tpl/' + r.id + '.json', 'utf8')).tpl.bg || {}).src || ''; } catch (e) { ground[r.id] = ''; } }
const tplIds = older.filter(r => r.gen !== 'sc').map(r => r.id);
if (tplIds.length && !REBUILT) {
  const require = createRequire(import.meta.url), { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const b = await chromium.launch(), p = await b.newPage();
  await p.goto(BASE + '?noretire=1', { waitUntil: 'load', timeout: 120000 });
  await p.waitForFunction(() => typeof TEMPLATES !== 'undefined' && TEMPLATES.length > 100, null, { timeout: 120000 });
  Object.assign(ground, await p.evaluate(ids => Object.fromEntries(ids.map(id => { const t = TEMPLATES.find(x => x.id === id); return [id, t && t.bg && t.bg.src || '']; })), tplIds));
  await b.close();
}

const why = {};
if (REBUILT) for (const r of older) { if (r.gen !== 'dl' && recipeOf.has(r.id)) why[r.id] = `rebuilt as ${recipeOf.get(r.id)}: the full ad draws it, photo and video (the owner, asked to retire the old static library and offer cards now that each has a rebuilt version: "Retire them"), ${day}`; }
else for (const r of older) if ((r.missing || []).includes('product') && !goodsGround(r.cat, ground[r.id])) why[r.id] = `no product picture and no photograph of the goods behind it (the owner: "retire but bg counts"), ${day}`;
const groups = {};
for (const r of older.filter(r => r.gen === 'sc' && !why[r.id] && !REBUILT)) {
  const layout = String(r.id).split('-')[0], k = r.cat + '|' + layout + '|' + (ground[r.id] || 'flat');
  (groups[k] ||= []).push(r);
}
for (const list of Object.values(groups)) {
  list.sort((a, b) => a.score - b.score || String(a.id).localeCompare(String(b.id)));
  for (const r of list.slice(1)) why[r.id] = `a near-copy of ${list[0].id}: the same layout on the same ground (the owner: "row of all similar stuff"), ${day}`;
}

const pick = g => older.filter(r => r.gen === g && why[r.id]);
const tally = g => `${pick(g).length} of ${older.filter(r => r.gen === g).length}`;
console.log(`older ads read: ${older.length}. Retire: designer layouts ${tally('dl')}, offer cards ${tally('of')}, library cards ${tally('sc')}`);
const by = {}; for (const r of older.filter(r => why[r.id])) { const k = (r.gen === 'sc' ? 'library ' : r.gen === 'dl' ? 'layout ' : 'offer ') + (why[r.id].startsWith('a near-copy') ? 'near-copy' : why[r.id].startsWith('rebuilt') ? 'rebuilt' : 'no goods'); by[k] = (by[k] || 0) + 1; }
console.log('  ' + Object.entries(by).map(([k, n]) => `${k} ${n}`).join(', '));
const stays = {}; for (const r of older.filter(r => !why[r.id])) stays[r.cat] = (stays[r.cat] || 0) + 1;
console.log('  older ads that stay, by category: ' + Object.entries(stays).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', '));

if (WRITE) {
  const tp = ROOT + 'template-retired.js', src = readFileSync(tp, 'utf8');
  const rows = [...pick('dl'), ...pick('of')].filter(r => !src.includes(JSON.stringify(r.id) + ':'));
  if (rows.length) {
    const at = src.lastIndexOf('};');
    writeFileSync(tp, src.slice(0, at) + (REBUILT ? `  // ${day}, the owner: "Retire them": each rebuilt as a recipe the full ad draws (scripts/retire_older_ads.mjs --rebuilt)\n` : `  // ${day}, the census: older ads that show no goods (scripts/retire_older_ads.mjs)\n`) + rows.map(r => `  ${JSON.stringify(r.id)}:${JSON.stringify(why[r.id])},`).join('\n') + '\n' + src.slice(at));
  }
  const hp = ROOT + 'assets/showcase/holds.json', H = JSON.parse(readFileSync(hp, 'utf8')), have = new Set(H.holds.map(h => h.id));
  const cards = pick('sc').filter(r => !have.has(r.id));
  H.holds.push(...cards.map(r => ({ id: r.id, why: why[r.id] })));
  writeFileSync(hp, JSON.stringify(H, null, 1) + '\n');
  if (cards.length) console.log(execFileSync(process.execPath, [ROOT + 'scripts/hold_showcase.mjs', '--write'], { encoding: 'utf8' }).trim().split('\n').slice(-2).join('\n'));
  writeFileSync(ROOT + '.render/retired-older.json', JSON.stringify(older.filter(r => why[r.id]).map(r => ({ id: r.id, gen: r.gen, cat: r.cat, name: r.name, why: why[r.id], ground: ground[r.id] || '' })), null, 1));
  console.log(`retired ${rows.length} templates (template-retired.js) and held ${cards.length} library cards (assets/showcase/holds.json); the list is .render/retired-older.json`);
} else console.log('dry run: add --write to retire them');
