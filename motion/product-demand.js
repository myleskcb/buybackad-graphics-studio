/* MADE FROM spec/product-demand.json BY scripts/build_product_demand.mjs (version 2026-11-22).
   Never type into it: change the table, then run the script. What a full ad shows when nobody
   picked the product (motion/fullad.js drawPhones, subjectDraw). */
export const DEMAND_VERSION = "2026-11-22";
/** The iPhone line: each model's weight (a model not listed weighs PHONE_REST). */
export const PHONE_WEIGHT = {"iPhone 17 Pro Max":24,"iPhone 16 Pro Max":20,"iPhone 18 Pro Max":14,"iPhone 17 Pro":11,"iPhone 17":10,"iPhone 16 Pro":9,"iPhone 16":9,"iPhone 18 Pro":8,"iPhone 15":7,"iPhone 15 Pro Max":6,"iPhone 14":5,"iPhone 15 Plus":4,"iPhone 15 Pro":4,"iPhone 14 Pro Max":4,"iPhone 17e":3,"iPhone 14 Plus":3,"iPhone 14 Pro":3,"iPhone 13":3,"iPhone 16e":2,"iPhone 13 Pro Max":2,"iPhone 13 Pro":1.5,"iPhone 13 mini":1};
export const PHONE_REST = 0.3;
/** How the set stands: [view, weight]. */
export const PHONE_VIEWS = [["back",34],["back_turned",20],["front",22],["front_turned",10],["profile",8],["mixed",6]];
/** How many phones, by the frame's shape: { aspect: [[count, weight]] }. */
export const PHONE_COUNTS = {"1:1":[[1,40],[2,60]],"16:9":[[1,40],[2,60]],"4:5":[[1,30],[2,35],[3,35]],"9:16":[[1,30],[2,35],[3,35]]};
/** The share of sets that are one model in several finishes; the rest are a range of models. */
export const PHONE_LINEUP = 0.45;
/** One of [value, weight] pairs, by weight, from a random number in [0, 1). */
export function pickWeighted(u, list) {
  const tot = list.reduce((s, [, w]) => s + Math.max(0, w), 0);
  if (!(tot > 0)) return list.length ? list[0][0] : undefined;
  let x = u * tot;
  for (const [v, w] of list) { x -= Math.max(0, w); if (x < 0) return v; }
  return list[list.length - 1][0];
}
