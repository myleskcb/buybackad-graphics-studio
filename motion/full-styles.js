/* MADE FROM spec/full-styles.json BY scripts/build_full_styles.mjs (version 2026-11-18).
   Never type into it: change the table, then run the script. */
export const FULL_STYLES = { "version": "2026-11-18", "sticker": [ { "key": "starburst", "share": 16 }, { "key": "seal", "share": 15 }, { "key": "badge", "share": 14 }, { "key": "ribbon", "share": 14 }, { "key": "tag", "share": 13 }, { "key": "stamp", "share": 13 }, { "key": "pill", "share": 15 } ], "sticker_fill": [ { "key": "solid", "share": 28 }, { "key": "gradient", "share": 26 }, { "key": "stripes", "share": 12 }, { "key": "dots", "share": 10 }, { "key": "foil", "share": 14 }, { "key": "outline", "share": 10 } ], "headline": [ { "key": "double_outline", "share": 20 }, { "key": "hard_shadow", "share": 14, "scrim": 0.3 }, { "key": "extrude", "share": 12, "scrim": 0.3 }, { "key": "highlighter", "share": 12, "where": "dark" }, { "key": "gradient", "share": 16, "scrim": 0.3 }, { "key": "sticker", "share": 10 }, { "key": "glow", "share": 8, "where": "dark", "scrim": 0.3 }, { "key": "outline_shadow", "share": 8, "scrim": 0.3 }, { "key": "foil", "share": 9, "scrim": 0.3 }, { "key": "glass", "share": 8 }, { "key": "block3d", "share": 8, "scrim": 0.3 }, { "key": "long_shadow", "share": 7, "scrim": 0.3 }, { "key": "pop_stack", "share": 8, "scrim": 0.3 }, { "key": "inline", "share": 7, "scrim": 0.3 }, { "key": "cutout", "share": 6, "where": "plain" }, { "key": "stamped", "share": 5, "scrim": 0.3 }, { "key": "box", "share": 8 } ], "entrance": [ { "key": "slide", "share": 20 }, { "key": "word_pop", "share": 18 }, { "key": "rise_mask", "share": 18 }, { "key": "mask_words", "share": 16 }, { "key": "elastic", "share": 14 }, { "key": "slam", "share": 14 } ], "number": [ { "key": "pill", "share": 30 }, { "key": "box", "share": 20 }, { "key": "ticket", "share": 16 }, { "key": "tag", "share": 16 }, { "key": "underline", "share": 18, "where": "plain" } ], "plate_fill": [ { "key": "solid", "share": 28 }, { "key": "gradient", "share": 22 }, { "key": "stripes", "share": 10 }, { "key": "dots", "share": 8 }, { "key": "foil", "share": 14 }, { "key": "glass", "share": 9, "where": "plain" }, { "key": "outline", "share": 9, "where": "plain" } ] };
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
 *  plate_grad say whether the fill is lit from above, for the painters that know only that. */
export function pickFullStyles(r, { dark = true, busy = false } = {}) {
  const where = e => !e.where || (e.where === "dark" ? dark : e.where === "light" ? !dark : e.where === "plain" ? !busy : true);
  const sticker_shape = pickOne(FULL_STYLES.sticker, r, where), sticker_fill = pickOne(FULL_STYLES.sticker_fill, r, where);
  const text_fx = pickOne(FULL_STYLES.headline, r, where), row = FULL_STYLES.headline.find(e => e.key === text_fx) || {};
  const text_in = pickOne(FULL_STYLES.entrance, r, where), number_style = pickOne(FULL_STYLES.number, r, where), plate_fill = pickOne(FULL_STYLES.plate_fill, r, where);
  return {
    sticker_shape, sticker_fill, sticker_grad: sticker_fill === "gradient", text_fx, ...(row.scrim != null ? { scrim: row.scrim } : {}),
    text_in, number_style, plate_fill, plate_grad: plate_fill === "gradient" || plate_fill === "foil",
  };
}
