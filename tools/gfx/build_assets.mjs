#!/usr/bin/env node
/* THE ENGINE'S ASSET INDEX.
 *
 * The spec engine drew its hero as a vector: a rounded rectangle with three
 * circles for a phone, a silhouette with two wheels for a car. It reads as a
 * diagram of a product, not a product, and in a marketplace feed a diagram
 * does not stop a thumb. Meanwhile the repo holds 348 photographic cutouts the
 * owner has personally approved, each already measured and described.
 *
 * This joins assets/library.json (dimensions, category, description) to the
 * owner's approval list and writes the subset the engine may draw from —
 * approved only, so nothing the owner rejected can reach a card.
 *
 *   node tools/gfx/build_assets.mjs   ->  spec/assets.json
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const ROOT = new URL('../../', import.meta.url).pathname;
const lib = JSON.parse(readFileSync(ROOT + 'assets/library.json', 'utf8')).assets;
const grid = JSON.parse(readFileSync(ROOT + 'assets/approved-assets.json', 'utf8'))['asset-grid-v1'];
const OK = new Set(grid.approved);
const norm = f => f.replace(/\.webp$/, '');

/* Which categories may stand as the SUBJECT of a card, and which may only
   dress it. A card for phone sellers shows a phone; cash and boxes are props
   that make the offer feel real, and must never be mistaken for the subject. */
const SUBJECT = {
  phones:   ['iphones', 'samsung', 'pixel'],
  cars:     ['cars'],
  macbooks: ['macbooks'],
  ipads:    ['ipads'],
  watches:  ['watch'],
  gold:     ['gold'],
  silver:   ['silver', 'coins'],
  cards:    ['poke', 'sports'],
  consoles: ['electronics'],
  airpods:  ['airpods'],
};
/* THE PROP POOL IS CURATED, NOT A CATEGORY.
   "props" in the library is a grab-bag: it holds human hands, a striped market
   awning, a wall clock, medical test-strip boxes and whole Mac product sheets.
   Dropped into a phone ad those do real damage — a MacBook beside a phone
   headline breaks the owner's rule that a card must show what is being bought,
   and the engine's own permanent negatives already forbid "stock photo of hands
   holding the product", so a prop pool that supplies hands is arguing with the
   prompt the same engine writes. What survives is what a buyback actually
   involves: the money, and the box it ships in. */
const PROP_DENY = [
  /hand|handshake|thumbs|palm|grip|wave|cupped/,   // the engine's own negative prompt
  /^qs-|^bundle-|device-bundle|apple-bundle|own-apple|sheet-|^mac|imac|macbook|ipad|watch/, // another subject
  /awning|clipboard|clock|location-pin|shield|magnifier|strip-boxes|counter-scene/, // set dressing
  /money-bag-sack/,                                 // reads as a cartoon, not a transaction
];
const PROP_ALLOW = [
  /^cash-/, /^safe-open-cash/, /^shopping-bag-cash/,
  /^cardboard-|^delivery-box|^padded-mailer|^pallet-boxes/,
];
const keepProp = slug =>
  PROP_ALLOW.some(r => r.test(slug)) && !PROP_DENY.some(r => r.test(slug));

const approved = lib.filter(a => OK.has(norm(a.file)) || OK.has(a.slug));
const rec = a => ({ u: a.url, w: a.w, h: a.h, s: a.slug, d: a.prompt || '' });

const subjects = {};
for (const [vertical, cats] of Object.entries(SUBJECT)) {
  const list = approved.filter(a => cats.includes(a.category)).map(rec);
  if (list.length) subjects[vertical] = list;
}
const props = approved.filter(a => keepProp(a.slug)).map(rec);

/* Cash is the strongest prop this shop has — it is literally the offer — so it
   is kept separately for the places a card wants to show the money itself. */
const cash = approved.filter(a => a.category === 'cash' && keepProp(a.slug)).map(rec);

const out = {
  built: grid.note || 'owner-approved subset',
  counts: Object.fromEntries(Object.entries(subjects).map(([k, v]) => [k, v.length])),
  subjects, props, cash,
};
mkdirSync(ROOT + 'spec', { recursive: true });
writeFileSync(ROOT + 'spec/assets.json', JSON.stringify(out));
console.log('  props kept: ' + props.map(p => p.s).join(', '));
console.log(`spec/assets.json  ${approved.length} approved · subjects: ` +
  Object.entries(out.counts).map(([k, v]) => `${k} ${v}`).join(', ') +
  ` · props ${props.length} · cash ${cash.length}`);
