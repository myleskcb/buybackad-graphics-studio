// WHAT A REBUILT RECIPE LEANS TOWARD (the rebuild, 2026-11-18; spec/recipe-looks.json).
//
// The owner, of the library cards and the offer family drawn as recipes: "Library card ones are
// not great.. I would take them as inspiration but rebuild them all", "Offer family needs a rebuild
// also", "they're alright at best and seem to follow their own set of rules ? things like the heros
// all look so simialr". Every recipe had been drawn on seed 1, in its card's pair, on its card's
// photograph, with its card's picture: all the cards of a line drew one look. A recipe now carries a
// seed of its own and a hint (scripts/build_recipes.mjs): the faces, grounds, treatments, stickers,
// numbers, fills and arrangements its card's family stood for, and the tone and hue of its
// colourway. fullad.js fullStyle leans toward the hint by the table's share (hint.lean, carried in
// motion/recipes.json and attached by whoever loads it), and otherwise draws as for any ad, so two
// cards of one family are two different ads. Nothing here draws for an ad with no hint: its draws are
// what they were.
import { oklchOf, rng } from "./engine.js";

const hueGap = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

/** A pair's tone: its own where it says (light, vivid, dark), else read off its ground. */
export function toneOf(c) {
  if (c && c.tone) return c.tone;
  const G = oklchOf(c.colors.ground);
  return G.L >= .8 ? "light" : G.L < .45 ? "dark" : "vivid";
}

/** Whether a pair answers a hint's colour: its tone; a ground of no colour where the hint is neutral;
 *  else one of its two colours within 35 degrees of the hint's hue. */
export function pairAnswers(c, h) {
  if (!c || !c.colors || !h) return false;
  if (h.tone && toneOf(c) !== h.tone) return false;
  if (h.neutral) return oklchOf(c.colors.ground).C < .06;
  if (h.hue == null) return true;
  return [c.colors.ground, c.colors.accent].map(oklchOf).filter(k => k.C >= .05).some(k => hueGap(k.h, h.hue) <= 35);
}

/** The lean's own stream for a seed: draws made here never move the seed's other draws. */
export const leanStream = seed => rng(((seed >>> 0) ^ 0x6c65616e) * 17 + 3);

/** Of the options the ad may draw (in their order), the ones the hint names, drawn by the share;
 *  null where the hint names none of them or the share says draw as for any ad. */
export function leanPick(r, share, options, wanted) {
  if (!r || !(share > 0) || !wanted || !wanted.length || !options || !options.length) return null;
  const want = new Set(wanted), L = options.filter(o => want.has(o));
  if (!L.length) return null;
  const u = r(), v = r();
  return u < share ? L[Math.floor(v * L.length) % L.length] : null;
}

/** The kinds of ground a hint may name, besides one ground by its key. */
export const GROUND_KINDS = ["photo", "scene", "gradient", "pattern", "house"];
