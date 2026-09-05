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

/* WHAT A PICTURE IS OF — read from its name and its description.
   A card that leads with "iPhone 17 Pro Max · $1,250" over a photograph of a
   cracked iPhone 11 is two different ads on one card, and it shipped because
   the picker only knew "this is in the phones pool". The pool also held a
   drone, earbuds, a tablet, two watches, repair tools and three hand shots.
   So every asset is tagged: brand, generation, condition, and what KIND of
   picture it is — and only single products and groups may be a hero. */
/* "Another device" is relative to the pool. "tablet" is foreign in the phones
   pool and IS the subject in the ipads pool; the first cut of this excluded
   every iPad and every watch from their own verticals. A slug that plainly
   names the family wins over a description that merely mentions one. */
const FOREIGN = {
  phones:   /drone|buds|earbud|tablet|watch|laptop/,
  ipads:    /phone|watch|buds|earbud|laptop|drone/,
  watches:  /phone|tablet|buds|laptop/,
  airpods:  /phone|watch|tablet|laptop/,
  macbooks: /phone|watch|tablet|buds/,
  consoles: /phone|watch|tablet|drone/,
};
const FAMILY = /^(qs-)?iphone|^ip-|^pix|^sam|samsung|^android|^car|^ipad|^mac|^mbp|^mba|^imac|^watch|^apple-watch|^airpods|^gold|^silver|^coin|^qs-(ipad|sheet|device|family|cat)/;
const tag = (a, vertical) => {
  /* the site's own device art is described as "imported from the iphones.la
     quick-sell device art" — the word "phone" in the shop's NAME must not make
     an iPad foreign to the iPad pool */
  const s = a.slug, d = (a.prompt || '').toLowerCase().replace(/iphones\.la/g, '');
  const t = {};
  t.b = /^(qs-)?iphone|^ip-/.test(s) ? 'iphone' : /^pix/.test(s) ? 'pixel'
      : /^sam|samsung/.test(s) ? 'samsung' : /^android/.test(s) ? 'android'
      : /^car/.test(s) ? 'car' : a.category;
  const g = s.match(/gen(\d\d)|iphone-(\d\d)|qs-iphone-(\d\d)/);
  t.g = g ? +(g[1] || g[2] || g[3]) : null;
  t.c = /crack|damage|shatter|dent|smash|broken/.test(s + ' ' + d) ? 'cracked' : 'clean';
  const foreign = FOREIGN[vertical] && !FAMILY.test(s) && FOREIGN[vertical].test(s + ' ' + d);
  const foreignBySlug = FOREIGN[vertical] && FOREIGN[vertical].test(s) && !FAMILY.test(s);
  t.k = /hand|grip|holding|forearm/.test(s + ' ' + d) ? 'hand'
      : /tool|teardown|repair/.test(s + ' ' + d) ? 'tool'
      : (foreign || foreignBySlug || /drone|buds-case|-watch-|watch-pair|tablet-back/.test(s) && vertical === 'phones') ? 'other'
      : /pair|trio|group|set-|lineup|stack|scatter|fan|row|grid|six|three|five|nine|quad|bundle/.test(s) ? 'group'
      : 'single';
  t.h = (t.k === 'single' || t.k === 'group') ? 1 : 0;
  return t;
};
const rec = (a, vertical) => ({ u: a.url, w: a.w, h: a.h, s: a.slug, d: a.prompt || '', t: tag(a, vertical) });

const subjects = {};
for (const [vertical, cats] of Object.entries(SUBJECT)) {
  const list = approved.filter(a => cats.includes(a.category)).map(a => rec(a, vertical));
  if (list.length) subjects[vertical] = list;
}
const props = approved.filter(a => keepProp(a.slug)).map(a => rec(a, 'props'));

/* Cash is the strongest prop this shop has — it is literally the offer — so it
   is kept separately for the places a card wants to show the money itself. */
const cash = approved.filter(a => a.category === 'cash' && keepProp(a.slug)).map(a => rec(a, 'cash'));

const out = {
  built: grid.note || 'owner-approved subset',
  counts: Object.fromEntries(Object.entries(subjects).map(([k, v]) => [k, v.length])),
  subjects, props, cash,
};
mkdirSync(ROOT + 'spec', { recursive: true });
writeFileSync(ROOT + 'spec/assets.json', JSON.stringify(out));
console.log('  props kept: ' + props.map(p => p.s).join(', '));
const heroes = Object.values(subjects).flat().filter(x => x.t.h).length;
console.log(`  hero-eligible: ${heroes} · excluded as hand/tool/other-device: ` +
  Object.values(subjects).flat().filter(x => !x.t.h).map(x => x.s).join(', '));
console.log(`spec/assets.json  ${approved.length} approved · subjects: ` +
  Object.entries(out.counts).map(([k, v]) => `${k} ${v}`).join(', ') +
  ` · props ${props.length} · cash ${cash.length}`);
