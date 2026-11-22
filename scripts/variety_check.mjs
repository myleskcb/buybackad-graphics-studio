#!/usr/bin/env node
/* THE LIBRARY'S VARIETY, MEASURED (2026-11-21; the owner, of the library: "bro the variety is so minimal here..?
   there's no variations at all?", then "all the same selling points and location").

   Reads what each still recorded as it was drawn (scripts/build_recipe_stills.mjs, build_library_looks.mjs,
   build_hero_stills.mjs: `words` and `shape` in each index entry) and reports, for every line of the library
   (its ads in the library's own order) and for the hero wall (in its order):

     points    the selling-point sets: how many differ, the largest share one set takes, and how many
               neighbours print the same set (the owner: "never the same trio across a row");
     area      the sample towns: how many metros, the largest share, neighbours from the same metro;
     label     the calls to action: how many differ, the largest share;
     skeleton  the ad's structure: whether the product or the headline comes first, the band's shape, the
               side the product takes, and how its selling points are drawn (ticks, numbers, outline, dots,
               none). How many differ, the largest share, and neighbours that share one.

   Fails when, in any line of six ads or more or on the hero wall: two neighbours print the same selling
   points (two or more of them) or come from the same metro; one point set or one metro covers more than
   a third; or, with --skeletons, two neighbours share a skeleton or one covers more than a third. A
   still drawn before these were recorded counts as unrecorded and is said so.

   usage:  node scripts/variety_check.mjs [--skeletons] [--line ipad]      exit 1 on a failure */
import { readFileSync, existsSync } from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname, read = p => JSON.parse(readFileSync(ROOT + p, 'utf8'));
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const SKEL = process.argv.includes('--skeletons'), ONLY = arg('--line');
const FAIR = 1 / 3;

// the stills, in the library's order: the recipes' own order, then each recipe's other looks, then the lines' full ads
const recipes = (j => Array.isArray(j) ? j : j.recipes || Object.values(j))(read('motion/recipes.json'));
const rs = read('assets/recipe-stills/index.json').items, lk = read('assets/library-looks/index.json').items;
const ads = [];
for (const r of recipes) {
  if (rs[r.id]) ads.push({ id: r.id, line: r.subject || rs[r.id].line, ...rs[r.id] });
  for (const k of [2, 3]) { const id = `${r.id}~${k}`; if (lk[id]) ads.push({ id, line: r.subject || lk[id].line, ...lk[id] }); }
}
for (const [id, it] of Object.entries(lk)) if (it.kind === 'full') ads.push({ id, ...it });
// the hero wall, in its own order (assets/hero-picks.json): a recipe pick shows its library still, a line's full ad its own
const heroOwn = existsSync(ROOT + 'assets/hero/index.json') ? read('assets/hero/index.json').items : {};
const hero = (read('assets/hero-picks.json').picks || []).map(String).filter(id => /^r-|^full-/.test(id)).map(id => ({ id, ...(rs[id] || heroOwn[id] || {}) }));

const keyOf = {
  points: a => a.words ? (a.words.points || []).slice().sort().join(' · ') || '(none)' : null,
  area: a => a.words ? a.words.metro || a.words.where || '(none)' : null,
  label: a => a.words ? a.words.label || '(none)' : null,
  // the structure alone (not its colours, plates or marks): which comes first, the band's shape, which side the
  // product takes, and how the selling points are drawn
  skeleton: a => a.shape ? [a.shape.order || 'head', a.shape.mode, a.shape.mirror ? 'mirrored' : 'plain', a.shape.points_style].join(' / ') : null,
};
function measure(list, name) {
  const out = { name, n: list.length, unrecorded: list.filter(a => !a.words).length };
  for (const [k, f] of Object.entries(keyOf)) {
    const v = list.map(f), known = v.filter(x => x != null), count = new Map();
    for (const x of known) count.set(x, (count.get(x) || 0) + 1);
    let same = 0; for (let i = 1; i < v.length; i++) if (v[i] != null && v[i] === v[i - 1] && !(k === 'points' && v[i] === '(none)')) same++;
    const top = [...count.entries()].sort((a, b) => b[1] - a[1])[0] || ['', 0];
    out[k] = { distinct: count.size, top: top[0], share: known.length ? top[1] / known.length : 0, neighbours: same, known: known.length };
  }
  return out;
}
const byLine = new Map(); for (const a of ads) { if (ONLY && a.line !== ONLY) continue; (byLine.get(a.line) || byLine.set(a.line, []).get(a.line)).push(a); }
const rows = [...byLine.entries()].map(([line, list]) => measure(list, line)).sort((a, b) => b.n - a.n);
if (hero.length && !ONLY) rows.push(measure(hero, 'hero wall'));

const fails = [];
const pct = x => (x * 100).toFixed(0) + '%';
console.log(`variety: ${ads.length} library ads in ${byLine.size} lines${hero.length ? `, ${hero.length} on the hero wall` : ''}`);
console.log('line'.padEnd(12) + 'ads  ' + 'point sets (top, nbrs)'.padEnd(28) + 'metros (top, nbrs)'.padEnd(24) + 'labels (top)'.padEnd(16) + 'skeletons (top, nbrs)');
for (const r of rows) {
  const p = r.points, a = r.area, l = r.label, s = r.skeleton;
  console.log(r.name.padEnd(12) + String(r.n).padStart(3) + '  ' + `${p.distinct} (${pct(p.share)}, ${p.neighbours})`.padEnd(28) + `${a.distinct} (${pct(a.share)}, ${a.neighbours})`.padEnd(24) + `${l.distinct} (${pct(l.share)})`.padEnd(16) + `${s.distinct} (${pct(s.share)}, ${s.neighbours})` + (r.unrecorded ? `   ${r.unrecorded} unrecorded` : ''));
  if (r.n < 6 && r.name !== 'hero wall') continue;
  if (r.unrecorded) { fails.push(`${r.name}: ${r.unrecorded} stills drawn before their words were recorded`); continue; }
  // the hero wall mixes lines, each walked through its own metros, and is the owner's own pick and order: its
  // words and towns are reported, its skeletons held
  const wall = r.name === 'hero wall';
  if (p.neighbours && !wall) fails.push(`${r.name}: ${p.neighbours} neighbours print the same selling points`);
  if (p.share > FAIR && p.top !== '(none)') fails.push(`${r.name}: one point set covers ${pct(p.share)} (${p.top})`);
  if (a.neighbours && !wall) fails.push(`${r.name}: ${a.neighbours} neighbours come from the same metro`);
  if (a.share > FAIR) fails.push(`${r.name}: one metro covers ${pct(a.share)} (${a.top})`);
  if (SKEL && s.neighbours) fails.push(`${r.name}: ${s.neighbours} neighbours share a skeleton`);
  if (SKEL && s.share > FAIR) fails.push(`${r.name}: one skeleton covers ${pct(s.share)} (${s.top})`);
}
if (fails.length) { console.log(`\n${fails.length} failed:`); for (const f of fails.slice(0, 40)) console.log('  ' + f); }
console.log(fails.length ? '\nvariety: failed' : '\nvariety: every line varies its selling points and towns' + (SKEL ? ' and its skeletons' : ''));
process.exit(fails.length ? 1 : 0);
