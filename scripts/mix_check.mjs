#!/usr/bin/env node
/* MIX CHECK — does the landing keep the owner's mix (platform-mix.js)?
 *
 * Owner, 2026-10-02: at least half Apple (iPhone 30, Mac 10, iPad 10), the
 * rest consoles, VR, Samsung, Pixel, gold, coins, Pokémon cards, bullion and
 * cars, then other trading cards, then bikes. This builds the landing's pool
 * the way app.js does — every live showcase card by its stamped `subject`
 * (scripts/tag_subjects.mjs), every offer card by its buying line — orders it
 * with PLATFORM_MIX.order, and checks:
 *
 *   - every live showcase card carries a subject (an untagged card falls out
 *     of the mix silently, so a refresh that forgets the tagger fails here);
 *   - Apple is at least half of EVERY prefix while an Apple card is left;
 *   - each named line is within one card of its share of every prefix while
 *     its line has cards left;
 *   - the wall (18) and the first gallery page (16) as drawn.
 *
 *   node scripts/mix_check.mjs       exits 1 on a failure
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { live } from './_showcase_harness.mjs';
const require = createRequire(import.meta.url);
const ROOT = new URL('../', import.meta.url).pathname;
const MIX = require(ROOT + 'platform-mix.js');

const idx = JSON.parse(readFileSync(ROOT + 'assets/showcase/index.json', 'utf8')).filter(live);
const untagged = idx.filter(c => !c.subject).map(c => c.id);

/* the offer family's cards per line, read off offer-library.js: a line with a
   picture set is drawn in five layouts, a type-only (ledger) line in three */
const src = readFileSync(ROOT + 'offer-library.js', 'utf8');
const offers = [];
for (const m of src.matchAll(/\{ key:'([a-z0-9]+)', cat:'([a-z]+)'[\s\S]*?(sets:|ledger:)/g)){
  const n = m[3] === 'ledger:' ? 3 : 5;
  for (let i = 0; i < n; i++) offers.push({ classic:{ line:m[1], cat:m[2], layers:[] }, id:'of_' + m[1] + '_' + i });
}
const subjectOf = it => it.classic ? MIX.templateSubject(it.classic) : (it.subject || it.cat);
const pool = idx.concat(offers);
const ordered = MIX.order(pool, subjectOf);

let bad = 0;
const fail = msg => { bad++; console.log('FAIL ' + msg); };
if (untagged.length) fail(`${untagged.length} live cards have no subject (run scripts/tag_subjects.mjs --write): ${untagged.slice(0, 5).join(', ')}`);

const APPLE = new Set(MIX.HALVES[0].lines.map(l => l.key));
const supply = {}; pool.forEach(it => { const s = subjectOf(it); supply[s] = (supply[s] || 0) + 1; });
const seen = {}; let apple = 0, appleLeftUntil = 0;
const appleTotal = pool.filter(it => APPLE.has(subjectOf(it))).length;
ordered.forEach((it, i) => {
  const n = i + 1, s = subjectOf(it);
  seen[s] = (seen[s] || 0) + 1;
  if (APPLE.has(s)) apple++;
  if (apple < appleTotal){
    appleLeftUntil = n;
    if (apple * 2 < n - 1) fail(`Apple is ${apple} of the first ${n}`);
  }
});
/* per line, against its share WITHIN its half, for as long as every line of
   that half still has cards (after one runs dry its share is handed on) */
for (const half of MIX.HALVES){
  const hShare = half.share / 100, total = half.lines.reduce((a, l) => a + l.share, 0);
  const counts = {}; let firstDry = Infinity;
  ordered.forEach((it, i) => {
    const s = subjectOf(it); counts[s] = (counts[s] || 0) + 1;
    if (half.lines.some(l => (counts[l.key] || 0) >= (supply[l.key] || 0))) firstDry = Math.min(firstDry, i + 1);
    if (i + 1 >= firstDry) return;
    for (const l of half.lines){
      const want = (i + 1) * hShare * l.share / total, got = counts[l.key] || 0;
      if (Math.abs(got - want) > 1.01) fail(`${l.key}: ${got} of the first ${i + 1}, its share is ${want.toFixed(2)}`);
    }
  });
  console.log(`${half.key}: every line within one card of its share for the first ${firstDry === Infinity ? ordered.length : firstDry - 1} cards`);
}
const show = list => list.map(subjectOf).reduce((o, s) => (o[s] = (o[s] || 0) + 1, o), {});
const fmt = o => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(', ');
console.log(`pool ${pool.length} (showcase ${idx.length}, offer ${offers.length}) · supply: ${fmt(supply)}`);
console.log(`Apple holds half of every prefix up to card ${appleLeftUntil} (where its ${appleTotal} cards run out)`);
console.log('wall, 18:        ' + fmt(show(MIX.order(pool, subjectOf, 18))));
console.log('first page, 16:  ' + fmt(show(ordered.slice(0, 16))));
console.log('first 48:        ' + fmt(show(ordered.slice(0, 48))));
console.log(bad ? `${bad} failures` : 'mix holds');
process.exit(bad ? 1 : 0);
