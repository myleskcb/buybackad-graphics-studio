#!/usr/bin/env node
/* THE LIBRARY'S VARIETY, AS A VISITOR SEES IT (DESIGN-LAW 166, 2026-11-21; the owner, of the library: "bro the
   variety is so minimal here..? there's no variations at all?", then "all the same selling points and location").

   Each ad's words and structure are its still's, recorded as it was drawn (`words` and `shape` in
   assets/recipe-stills/index.json, assets/library-looks/index.json and assets/hero/index.json, written by
   scripts/build_recipe_stills.mjs, build_library_looks.mjs and build_hero_stills.mjs). This opens the landing
   and reads its library in the order it shows it (app.js scRenderGrid: the ranking, the platform's mix, then
   scNeighboursDiffer), for All and for every line's chip, and the hero wall as it lays it out (app.js
   scBuildWall). For each it reports:

     points    the selling-point sets: how many differ, the largest share one set takes, and how many
               neighbours print the same set (the owner: "never the same trio across a row");
     area      the sample towns: how many metros, the largest share, neighbours from the same metro;
     label     the calls to action: how many differ, the largest share;
     skeleton  the ad's structure: whether the product or the headline comes first, the band's shape, the
               side the product takes, and how its selling points are drawn (ticks, numbers, outline, dots,
               none). How many differ, the largest share, and neighbours that share one;
     layout    the structure without the points' drawing: neighbours laid out alike (the product on the
               same side, the same first block), which read as one layout though their points are drawn
               differently. Reported: a line whose ads carry no product in the band (the headsets) has
               one layout only.

   Neighbours in the library are the ads one after the other in its order, and the ad above another: the
   library is a grid of four columns on a wide screen, three on a narrower one and two on a phone
   (landing.css), so the ad above is four, three or two before it. On the hero wall they are the tiles that
   touch: one above the other in a column (its last touches its first, as the column loops) and, as the wall
   first stands and as it stays for a visitor who asks for less motion, side by side. (The columns scroll at
   their own speeds, so side by side changes as they move; one above the other never does.)

   Fails when, in a line of six ads or more or on the hero wall, two neighbours print the same selling
   points (two or more), come from the same metro or share a skeleton; when, across the lines, more than one
   ad in a hundred has any of them in common with the ad above it, in a grid of any width (where a line's
   commonest structure covers more than a fifth of it, it cannot always be kept four ads apart, and the end
   of a line has few ads left to trade with; each is reported); when one point set, metro or skeleton
   covers more than a third of a line; or when a still was drawn before its words were recorded. All is
   reported: past the point where the platform's mix runs out of lines to interleave, it shows the rest a
   line at a time. The video maker's Any looks record neither and are not counted.

   usage:  GFX_BASE=http://127.0.0.1:8932/ node scripts/variety_check.mjs [--line ipad] [--json out.json]
           exit 1 on a failure */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const ROOT = new URL('../', import.meta.url).pathname, read = p => JSON.parse(readFileSync(ROOT + p, 'utf8'));
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8899/').replace(/\/?$/, '/');
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ONLY = arg('--line'), OUT = arg('--json');
const FAIR = 1 / 3, LEAST = 6;

const stills = {
  'recipe-stills': read('assets/recipe-stills/index.json').items,
  'library-looks': read('assets/library-looks/index.json').items,
  hero: existsSync(ROOT + 'assets/hero/index.json') ? read('assets/hero/index.json').items : {},
};
// a card's still, by the picture it shows (assets/<the index>/<its id>.webp)
const stillOf = src => { const m = /assets\/(recipe-stills|library-looks|hero)\/([^/?#]+)\.webp/.exec(src || ''); return m ? stills[m[1]][m[2]] || null : null; };

const require = createRequire(import.meta.url), { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch(), page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on('pageerror', e => console.error('page error:', e.message));
await page.goto(BASE, { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => typeof SHOWCASE !== 'undefined' && (SHOWCASE.shelf || SHOWCASE.cards) && typeof scLoadMore === 'function' && typeof scRenderGrid === 'function', null, { timeout: 120000 });
await page.waitForFunction(() => { const c = document.querySelectorAll('#hero-wall .wall-col'); return c.length && [...c].every(x => x.querySelectorAll('.wall-card').length >= 2); }, null, { timeout: 120000 });
const seen = await page.evaluate(async only => {
  await scLoadMore();
  const keep = { ...(SHOWCASE.filter || {}) }, lib = {};
  const card = c => c.classic ? { id: c.classic.id, src: '' } : { id: c.id, src: c.thumb || '' };
  const lines = only ? [only] : ['all', ...new Set(scLib().map(scLineOf).filter(l => l && l !== 'video'))];
  for (const line of lines) { SHOWCASE.filter = { ...keep, cat: 'all', fam: 'all', line }; scRenderGrid(true); lib[line] = SHOWCASE.list.map(card); }
  SHOWCASE.filter = keep; scRenderGrid(true);
  // each column of the wall is its list twice (the loop): the first half is the column
  const wall = [...document.querySelectorAll('#hero-wall .wall-col')].map(col => {
    const cs = [...col.querySelectorAll('.wall-card')];
    return cs.slice(0, cs.length / 2).map(d => { const img = d.querySelector('img'); return { id: d.title, src: img ? img.getAttribute('src') || '' : '' }; });
  });
  return { lib, wall };
}, ONLY);
await browser.close();

const keyOf = {
  points: m => (m.words.points || []).slice().sort().join(' · ') || '(none)',
  area: m => m.words.metro || m.words.where || '(none)',
  label: m => m.words.label || '(none)',
  skeleton: m => [m.shape.order || 'head', m.shape.mode, m.shape.mirror ? 'mirrored' : 'plain', m.shape.points_style].join(' / '),
  layout: m => [m.shape.order || 'head', m.shape.mode, m.shape.mirror ? 'mirrored' : 'plain'].join(' / '),
};
const recorded = m => !!(m && m.words && m.shape);
const drawnByTheFullAd = m => !!m && m.kind !== 'any';
// any of the structure, the selling points (two or more) or the towns in common
const alike = (a, b) => recorded(a) && recorded(b) && (keyOf.skeleton(a) === keyOf.skeleton(b)
  || ((a.words.points || []).length > 0 && keyOf.points(a) === keyOf.points(b)) || (!!a.words.metro && a.words.metro === b.words.metro));
const WIDTHS = [2, 3, 4];
// the spread of a set of ads, and their neighbours: pairs of ads that touch
function measure(name, ads, pairs, ids) {
  const out = { name, n: ads.filter(drawnByTheFullAd).length, unrecorded: ads.filter(m => drawnByTheFullAd(m) && !recorded(m)).length, keys: {} };
  const known = ads.filter(recorded);
  for (const [k, f] of Object.entries(keyOf)) {
    const count = new Map(); for (const m of known) count.set(f(m), (count.get(f(m)) || 0) + 1);
    const top = [...count.entries()].sort((a, b) => b[1] - a[1])[0] || ['', 0];
    const same = pairs.filter(([a, b]) => recorded(ads[a]) && recorded(ads[b]) && f(ads[a]) === f(ads[b]) && !((k === 'points' || k === 'area' || k === 'label') && f(ads[a]) === '(none)'));
    out.keys[k] = { distinct: count.size, top: top[0], share: known.length ? top[1] / known.length : 0, neighbours: same.length, pairs: same.slice(0, 6).map(([a, b]) => `${ids[a]} and ${ids[b]}`) };
  }
  return out;
}
const rows = [];
for (const [line, list] of Object.entries(seen.lib)) {
  const ads = list.map(c => stillOf(c.src)), ids = list.map(c => c.id), pairs = [];
  for (let i = 1; i < ads.length; i++) pairs.push([i - 1, i]);
  const r = measure(line, ads, pairs, ids);
  // the ad above, in a grid of two, three and four columns: how many places there are, and how many repeat it
  r.above = {}; r.aboveAt = {};
  for (const w of WIDTHS) {
    const hits = []; let places = 0;
    for (let i = w; i < ads.length; i++) { if (!recorded(ads[i]) || !recorded(ads[i - w])) continue; places++; if (alike(ads[i], ads[i - w])) hits.push(`${ids[i - w]} over ${ids[i]}`); }
    r.above[w] = { places, repeats: hits.length }; r.aboveAt[w] = hits.slice(0, 4);
  }
  rows.push(r);
}
const libRows = rows.slice().sort((a, b) => (b.name === 'all') - (a.name === 'all') || b.n - a.n);
let wallRow = null;
if (!ONLY && seen.wall.length) {
  const tiles = [], at = {};
  seen.wall.forEach((col, c) => col.forEach((t, r) => { at[r + ',' + c] = tiles.length; tiles.push({ ...t, r, c }); }));
  const pairs = [];
  seen.wall.forEach((col, c) => col.forEach((t, r) => {
    const here = at[r + ',' + c], below = col.length > 2 || r + 1 < col.length ? at[((r + 1) % col.length) + ',' + c] : undefined, beside = at[r + ',' + (c + 1)];
    if (below != null && below !== here) pairs.push([here, below]);
    if (beside != null) pairs.push([here, beside]);
  }));
  const ads = tiles.map(t => stillOf(t.src)), ids = tiles.map(t => { const m = /\/([^/?#]+)\.webp/.exec(t.src); return m ? m[1] : t.id; });
  wallRow = measure('hero wall', ads, pairs, ids);
}

const fails = [], pct = x => (x * 100).toFixed(0) + '%';
const NAMES = { points: 'print the same selling points', area: 'come from the same metro', skeleton: 'share a skeleton' };
const hold = (r, wall) => {
  if (r.name === 'all' || (r.n < LEAST && !wall)) return;
  if (r.unrecorded) fails.push(`${r.name}: ${r.unrecorded} stills drawn before their words were recorded (draw them again)`);
  for (const k of ['points', 'area', 'skeleton']) {
    const x = r.keys[k];
    if (x.neighbours) fails.push(`${r.name}: ${x.neighbours} ${wall ? 'touching tiles' : 'neighbours'} ${NAMES[k]} (${x.pairs.join('; ')})`);
    if (x.share > FAIR + 1e-9 && x.top !== '(none)') fails.push(`${r.name}: one ${k === 'area' ? 'metro' : k === 'points' ? 'point set' : 'skeleton'} covers ${pct(x.share)} (${x.top})`);
  }
};
for (const r of libRows) hold(r, false);
if (wallRow) hold(wallRow, true);
// the ad above, across the lines: at most one place in a hundred, in a grid of each width
const lineRows = libRows.filter(r => r.name !== 'all'), aboveAll = {};
for (const w of WIDTHS) {
  const places = lineRows.reduce((t, r) => t + r.above[w].places, 0), repeats = lineRows.reduce((t, r) => t + r.above[w].repeats, 0);
  aboveAll[w] = { places, repeats };
  if (repeats > places / 100) fails.push(`across the lines, ${repeats} of ${places} ads have something in common with the ad above them in a grid of ${w} columns (more than one in a hundred): ${lineRows.filter(r => r.above[w].repeats).map(r => `${r.name} ${r.above[w].repeats}`).join(', ')}`);
}

const show = r => {
  const p = r.keys.points, a = r.keys.area, l = r.keys.label, s = r.keys.skeleton, y = r.keys.layout;
  console.log(r.name.padEnd(12) + String(r.n).padStart(5) + '  ' + `${p.distinct} (${pct(p.share)}, ${p.neighbours})`.padEnd(26) + `${a.distinct} (${pct(a.share)}, ${a.neighbours})`.padEnd(22) + `${l.distinct} (${pct(l.share)})`.padEnd(14) + `${s.distinct} (${pct(s.share)}, ${s.neighbours})`.padEnd(24) + `${y.distinct} (${y.neighbours})`.padEnd(15)
    + (r.above ? WIDTHS.map(w => r.above[w].repeats).join(' / ') : '') + (r.unrecorded ? `   ${r.unrecorded} unrecorded` : ''));
};
console.log(`variety, as the landing shows it (${BASE}): the library in its own order, All and ${libRows.length - 1} lines` + (wallRow ? `; the hero wall's ${wallRow.n} tiles as they touch` : ''));
console.log('            ads  ' + 'point sets (top, nbrs)'.padEnd(26) + 'metros (top, nbrs)'.padEnd(22) + 'labels (top)'.padEnd(14) + 'skeletons (top, nbrs)'.padEnd(24) + 'layouts (nbrs)'.padEnd(15) + 'above, 2 / 3 / 4 columns');
for (const r of libRows) show(r);
if (wallRow) show(wallRow);
console.log(`\nthe ad above, across the lines: ` + WIDTHS.map(w => `${aboveAll[w].repeats} of ${aboveAll[w].places} in ${w} columns`).join(', ')
  + (lineRows.some(r => WIDTHS.some(w => r.above[w].repeats)) ? ` (${lineRows.filter(r => WIDTHS.some(w => r.above[w].repeats)).map(r => r.name).join(', ')})` : ''));
const all = libRows.find(r => r.name === 'all');
if (all) console.log(`All, reported: ${['points', 'area', 'skeleton'].map(k => `${all.keys[k].neighbours} neighbours ${NAMES[k]}`).join(', ')}; the ad above ${WIDTHS.map(w => all.above[w].repeats).join(' / ')} in 2 / 3 / 4 columns`);
if (OUT) writeFileSync(OUT, JSON.stringify({ base: BASE, rows: libRows, wall: wallRow, above: aboveAll, failures: fails }, null, 1));
if (fails.length) { console.log(`\n${fails.length} failed:`); for (const f of fails.slice(0, 40)) console.log('  ' + f); }
console.log(fails.length ? '\nvariety: failed' : '\nvariety: in every line and on the hero wall no two neighbours share a skeleton, selling points or towns, the ad above repeats one in fewer than one place in a hundred, and none covers more than a third');
process.exit(fails.length ? 1 : 0);
