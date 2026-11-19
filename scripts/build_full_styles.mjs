#!/usr/bin/env node
/* THE FULL AD'S STYLES, ONE TABLE: motion/full-styles.js from spec/full-styles.json.

   The owner, 2026-11-18, of the full ads and the recipes they draw: "notice how it's all same spiky
   circle?", "and there's no variety in the text pure outlines?", "Also don't see any gradients
   really?". The full ad had one sticker (the starburst), one headline treatment (the double
   outline), one entrance and one number plate. spec/full-styles.json holds the shares of each; this
   writes them as a module the site reads (spec/ is not served), with the picker motion/fullad.js
   calls: pickFullStyles(r, { dark }) draws one of each with the seed's own random stream r.

   usage:  node scripts/build_full_styles.mjs            rewrite motion/full-styles.js
           node scripts/build_full_styles.mjs --check    exit 1 if it is stale */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url).pathname, SRC = ROOT + 'spec/full-styles.json', OUT = ROOT + 'motion/full-styles.js';
const T = JSON.parse(readFileSync(SRC, 'utf8'));
const WHERE = ['dark', 'light', 'plain'];
const list = k => {
  const L = T[k]; if (!Array.isArray(L) || !L.length) throw new Error(`spec/full-styles.json: "${k}" is empty`);
  for (const e of L) {
    if (!e.key || !(e.share > 0)) throw new Error(`spec/full-styles.json: a bad row in "${k}"`);
    if (e.where && !WHERE.includes(e.where)) throw new Error(`spec/full-styles.json: ${k} ${e.key}: "where" is one of ${WHERE.join(', ')}`);
    if (e.scrim != null && !(e.scrim >= 0 && e.scrim <= 1.9)) throw new Error(`spec/full-styles.json: ${k} ${e.key}: "scrim" is 0 to 1.9`);
  }
  return L.map(({ key, share, where, scrim }) => ({ key, share, ...(where ? { where } : {}), ...(scrim != null ? { scrim: +scrim } : {}) }));
};
// the fills (2026-11-18, rule 146): a list each, the keys the painters know (decor.js fillTexture, drawSticker; fullad.js numberPill)
const FILLS = { sticker_fill: ['solid', 'gradient', 'stripes', 'dots', 'foil', 'outline'], plate_fill: ['solid', 'gradient', 'stripes', 'dots', 'foil', 'glass', 'outline'] };
for (const [k, known] of Object.entries(FILLS)) for (const e of list(k)) if (!known.includes(e.key)) throw new Error(`spec/full-styles.json: ${k} ${e.key} is not one the painters draw (${known.join(', ')})`);
const table = { version: T.version, sticker: list('sticker'), sticker_fill: list('sticker_fill'), headline: list('headline'), entrance: list('entrance'), number: list('number'), plate_fill: list('plate_fill') };
const text = `/* MADE FROM spec/full-styles.json BY scripts/build_full_styles.mjs (version ${T.version}).
   Never type into it: change the table, then run the script. */
export const FULL_STYLES = ${JSON.stringify(table, null, 1).replace(/\n\s*/g, ' ')};
/** One weighted pick from a list of { key, share, where }, by r (a random stream: r() in [0, 1)). */
function pickOne(list, r, ok = () => true) {
  const L = list.filter(ok), sum = L.reduce((a, e) => a + e.share, 0);
  let u = r() * sum;
  for (const e of L) { u -= e.share; if (u < 0) return e.key; }
  return L.length ? L[L.length - 1].key : list[0].key;
}
/** A seed's styles: the sticker's shape and fill, the headline's treatment (with the shade round
 *  its words where its row holds one: scrim) and entrance, the number's treatment and the plates'
 *  fill. dark: the words are lighter than the ground (a "dark" row is drawn only there, a "light"
 *  row only under dark words); busy: the ground is a photograph or a drawn scene (a "plain" row is
 *  drawn only on the house's own painted grounds: its gradients and its patterns). sticker_grad and
 *  plate_grad say whether the fill is lit from above, for the painters that know only that.
 *  lean: a rebuilt recipe's (motion/recipe-lean.js; the owner, 2026-11-18: "take them as inspiration
 *  but rebuild them all"): { hint, pick(options, wanted, key) }, where pick draws, on a stream of its
 *  own, one of the options this ad may draw that its card stood for, or null; the seed's own draws are
 *  made first and in the same order either way, so an ad with no lean draws what it drew before. */
export function pickFullStyles(r, { dark = true, busy = false, lean = null } = {}) {
  const where = e => !e.where || (e.where === "dark" ? dark : e.where === "light" ? !dark : e.where === "plain" ? !busy : true);
  const H = lean && lean.hint || {}, toward = (got, list, want, key) => (lean && lean.pick(list.filter(where).map(e => e.key), want, key)) || got;
  const sticker_shape = toward(pickOne(FULL_STYLES.sticker, r, where), FULL_STYLES.sticker, H.sticker, "sticker");
  const sticker_fill = toward(pickOne(FULL_STYLES.sticker_fill, r, where), FULL_STYLES.sticker_fill, H.fill, "fill");
  const text_fx = toward(pickOne(FULL_STYLES.headline, r, where), FULL_STYLES.headline, H.headline, "headline"), row = FULL_STYLES.headline.find(e => e.key === text_fx) || {};
  const text_in = pickOne(FULL_STYLES.entrance, r, where), number_style = toward(pickOne(FULL_STYLES.number, r, where), FULL_STYLES.number, H.number, "number");
  const plate_fill = toward(pickOne(FULL_STYLES.plate_fill, r, where), FULL_STYLES.plate_fill, H.fill, "fill");
  return {
    sticker_shape, sticker_fill, sticker_grad: sticker_fill === "gradient", text_fx, ...(row.scrim != null ? { scrim: row.scrim } : {}),
    text_in, number_style, plate_fill, plate_grad: plate_fill === "gradient" || plate_fill === "foil",
  };
}
`;
if (process.argv.includes('--check')) {
  const now = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (now !== text) { console.error('motion/full-styles.js is stale: run node scripts/build_full_styles.mjs'); process.exit(1); }
  console.log(`motion/full-styles.js is current (version ${T.version})`);
} else {
  writeFileSync(OUT, text);
  console.log(`wrote motion/full-styles.js: ${table.sticker.length} stickers in ${table.sticker_fill.length} fills, ${table.headline.length} headline treatments, ${table.entrance.length} entrances, ${table.number.length} number treatments, ${table.plate_fill.length} plate fills (version ${T.version})`);
}
