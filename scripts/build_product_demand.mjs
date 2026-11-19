#!/usr/bin/env node
/* WHAT A FULL AD SHOWS WHEN NOBODY PICKED IT, ON THE SITE: motion/product-demand.js.

   The owner, 2026-11-18: "we need infinite but prioritized by recent popular and expensive models",
   "not just front and back", "all colors too", "the most will be the hot in demand models". The
   weights are one table, spec/product-demand.json (dated, with what each number rests on). The site
   cannot read spec/ (netlify.toml 404s it at the edge), so the full ad (motion/fullad.js) reads this
   module, written from the table and never typed: the iPhone line's model weights, its views, how
   many phones stand in a set, and how often a set is one model in several finishes. Every other
   line's pool is written into motion/subjects.json by scripts/build_full_subjects.mjs from the same
   table.

   usage:  node scripts/build_product_demand.mjs            # rewrite motion/product-demand.js
           node scripts/build_product_demand.mjs --check    # exit 1 if it is stale */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url).pathname, SRC = ROOT + 'spec/product-demand.json', OUT = ROOT + 'motion/product-demand.js';
const T = JSON.parse(readFileSync(SRC, 'utf8')), P = T.phones;
const VIEWS = ['back', 'back_turned', 'front', 'front_turned', 'profile', 'mixed'];
for (const [v, w] of P.views) if (!VIEWS.includes(v) || !(w >= 0)) { console.error(`spec/product-demand.json: the view "${v}" (${w}) is not one of ${VIEWS.join(', ')}`); process.exit(2); }
for (const [a, list] of Object.entries(P.counts)) for (const [n, w] of list) if (!(n >= 1 && n <= 4) || !(w >= 0)) { console.error(`spec/product-demand.json: count ${n} (${w}) for ${a} is not 1 to 4`); process.exit(2); }
if (!(P.lineup >= 0 && P.lineup <= 1)) { console.error('spec/product-demand.json: lineup is a share, 0 to 1'); process.exit(2); }
const known = new Set(JSON.parse(readFileSync(ROOT + 'motion/phones/index.json', 'utf8')).phones.map(m => m.model));
const unknown = P.models.filter(([m]) => !known.has(m)).map(([m]) => m);
if (unknown.length) { console.error('spec/product-demand.json: no phone pictures of ' + unknown.join(', ') + ' in motion/phones/index.json'); process.exit(2); }
const missing = [...known].filter(m => !P.models.some(([n]) => n === m));

const text = `/* MADE FROM spec/product-demand.json BY scripts/build_product_demand.mjs (version ${T.version}).
   Never type into it: change the table, then run the script. What a full ad shows when nobody
   picked the product (motion/fullad.js drawPhones, subjectDraw). */
export const DEMAND_VERSION = ${JSON.stringify(T.version)};
/** The iPhone line: each model's weight (a model not listed weighs PHONE_REST). */
export const PHONE_WEIGHT = ${JSON.stringify(Object.fromEntries(P.models.map(([m, w]) => [m, w])))};
export const PHONE_REST = ${JSON.stringify(P.rest)};
/** How the set stands: [view, weight]. */
export const PHONE_VIEWS = ${JSON.stringify(P.views)};
/** How many phones, by the frame's shape: { aspect: [[count, weight]] }. */
export const PHONE_COUNTS = ${JSON.stringify(P.counts)};
/** The share of sets that are one model in several finishes; the rest are a range of models. */
export const PHONE_LINEUP = ${JSON.stringify(P.lineup)};
/** One of [value, weight] pairs, by weight, from a random number in [0, 1). */
export function pickWeighted(u, list) {
  const tot = list.reduce((s, [, w]) => s + Math.max(0, w), 0);
  if (!(tot > 0)) return list.length ? list[0][0] : undefined;
  let x = u * tot;
  for (const [v, w] of list) { x -= Math.max(0, w); if (x < 0) return v; }
  return list[list.length - 1][0];
}
`;
if (process.argv.includes('--check')) {
  const now = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (now !== text) { console.error('motion/product-demand.js is stale: run node scripts/build_product_demand.mjs'); process.exit(1); }
  console.log(`motion/product-demand.js is current (version ${T.version}, ${P.models.length} iPhone models weighed)`);
} else {
  writeFileSync(OUT, text);
  console.log(`wrote motion/product-demand.js: ${P.models.length} iPhone models weighed, ${P.views.length} views (version ${T.version})`);
}
if (missing.length) console.log('  weighing the rest (' + P.rest + '): ' + missing.join(', '));
