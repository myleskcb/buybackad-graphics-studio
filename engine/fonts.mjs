/* SELF-HOSTED TYPE.
 *
 * The engine used to name Teko / Anton / Bebas / Oswald and hope the viewer had
 * them installed. Nothing embedded them and nothing linked them, so on any
 * machine without those families — including this one, and including the
 * headless Chrome the cards are rasterised in — every card fell back to
 * sans-serif. That is why text overflowed its plates: the width constants were
 * tuned for condensed display faces while the pixels were being set in
 * Helvetica.
 *
 * These five families ship in the repo under a licence we already hold and are
 * the same faces the studio uses. Embedding them as base64 makes each SVG
 * self-contained: identical in a browser, in sharp, and on the site, with no
 * network at render or view time.
 */
import { readFileSync, existsSync } from 'node:fs';

const DIR = new URL('../assets/fonts/', import.meta.url).pathname;

/* family -> weight -> file, generated from assets/fonts by
   tools/gfx/fetch_fonts.mjs. The role comment is the owner's own from
   assets/approved-fonts.json; the four marked "unapproved" arrived with the
   spec engine and are kept only until the pairings stop using them. */
export const FONT_FILES = {
  "Pirata One": { 400: "pirata-one-400.woff2" },                                                // blackletter
  "Barlow Condensed": { 400: "barlow-condensed-400.woff2", 600: "barlow-condensed-600.woff2", 700: "barlow-condensed-700.woff2" },// condensed
  "Big Shoulders Display": { 400: "big-shoulders-display-400.woff2", 600: "big-shoulders-display-600.woff2", 700: "big-shoulders-display-700.woff2" },// condensed
  "Oswald": { 400: "oswald-400.woff2", 600: "oswald-600.woff2", 700: "oswald-700.woff2" },      // condensed
  "Russo One": { 400: "russo-one-400.woff2" },                                                  // condensed
  "Saira Condensed": { 400: "saira-condensed-400.woff2", 600: "saira-condensed-600.woff2", 700: "saira-condensed-700.woff2" },// condensed
  "Squada One": { 400: "squada-one-400.woff2" },                                                // condensed
  "Teko": { 400: "teko-400.woff2", 600: "teko-600.woff2", 700: "teko-700.woff2" },              // condensed
  "Creepster": { 400: "creepster-400.woff2" },                                                  // graffiti
  "Faster One": { 400: "faster-one-400.woff2" },                                                // graffiti
  "Freckle Face": { 400: "freckle-face-400.woff2" },                                            // graffiti
  "Nosifer": { 400: "nosifer-400.woff2" },                                                      // graffiti
  "Rubik Dirt": { 400: "rubik-dirt-400.woff2" },                                                // graffiti
  "Rubik Doodle Shadow": { 400: "rubik-doodle-shadow-400.woff2" },                              // graffiti
  "Rubik Iso": { 400: "rubik-iso-400.woff2" },                                                  // graffiti
  "Rubik Marker Hatch": { 400: "rubik-marker-hatch-400.woff2" },                                // graffiti
  "Rubik Wet Paint": { 400: "rubik-wet-paint-400.woff2" },                                      // graffiti
  "Sedgwick Ave": { 400: "sedgwick-ave-400.woff2" },                                            // graffiti
  "Sedgwick Ave Display": { 400: "sedgwick-ave-display-400.woff2" },                            // graffiti
  "Wallpoet": { 400: "wallpoet-400.woff2" },                                                    // graffiti
  "Chivo": { 400: "chivo-400.woff2", 500: "chivo-500.woff2", 700: "chivo-700.woff2", 900: "chivo-900.woff2" },// grotesque
  "Instrument Sans": { 400: "instrument-sans-400.woff2", 500: "instrument-sans-500.woff2", 700: "instrument-sans-700.woff2" },// grotesque
  "Libre Franklin": { 400: "libre-franklin-400.woff2", 500: "libre-franklin-500.woff2", 700: "libre-franklin-700.woff2", 900: "libre-franklin-900.woff2" },// grotesque
  "Manrope": { 400: "manrope-400.woff2", 500: "manrope-500.woff2", 700: "manrope-700.woff2" },  // grotesque
  "Satoshi": { 400: "satoshi-400.woff2", 500: "satoshi-500.woff2", 700: "satoshi-700.woff2", 900: "satoshi-900.woff2" },// grotesque
  "Sora": { 400: "sora-400.woff2", 500: "sora-500.woff2", 700: "sora-700.woff2" },              // grotesque
  "Amatic SC": { 400: "amatic-sc-400.woff2", 700: "amatic-sc-700.woff2" },                      // handwritten
  "Architects Daughter": { 400: "architects-daughter-400.woff2" },                              // handwritten
  "Cabin Sketch": { 400: "cabin-sketch-400.woff2", 700: "cabin-sketch-700.woff2" },             // handwritten
  "Gloria Hallelujah": { 400: "gloria-hallelujah-400.woff2" },                                  // handwritten
  "Kalam": { 400: "kalam-400.woff2", 700: "kalam-700.woff2" },                                  // handwritten
  "Nanum Pen Script": { 400: "nanum-pen-script-400.woff2" },                                    // handwritten
  "Patrick Hand": { 400: "patrick-hand-400.woff2" },                                            // handwritten
  "Permanent Marker": { 400: "permanent-marker-400.woff2" },                                    // handwritten
  "Shadows Into Light": { 400: "shadows-into-light-400.woff2" },                                // handwritten
  "Audiowide": { 400: "audiowide-400.woff2" },                                                  // numerals
  "DM Mono": { 400: "dm-mono-400.woff2" },                                                      // numerals
  "JetBrains Mono": { 400: "jetbrains-mono-400.woff2", 700: "jetbrains-mono-700.woff2" },       // numerals
  "Bungee": { 400: "bungee-400.woff2" },                                                        // retro
  "Bungee Shade": { 400: "bungee-shade-400.woff2" },                                            // retro
  "Fascinate": { 400: "fascinate-400.woff2" },                                                  // retro
  "Luckiest Guy": { 400: "luckiest-guy-400.woff2" },                                            // retro
  "Press Start 2P": { 400: "press-start-2p-400.woff2" },                                        // retro
  "Rye": { 400: "rye-400.woff2" },                                                              // retro
  "Shrikhand": { 400: "shrikhand-400.woff2" },                                                  // retro
  "Special Elite": { 400: "special-elite-400.woff2" },                                          // retro
  "Nunito": { 400: "nunito-400.woff2", 700: "nunito-700.woff2" },                               // rounded
  "Sniglet": { 400: "sniglet-400.woff2" },                                                      // rounded
  "Bangers": { 400: "bangers-400.woff2" },                                                      // script
  "Kaushan Script": { 400: "kaushan-script-400.woff2" },                                        // script
  "Knewave": { 400: "knewave-400.woff2" },                                                      // script
  "Cormorant Garamond": { 400: "cormorant-garamond-400.woff2", 700: "cormorant-garamond-700.woff2" },// serif
  "Instrument Serif": { 400: "instrument-serif-400.woff2" },                                    // serif
  "Roboto Slab": { 400: "roboto-slab-400.woff2", 700: "roboto-slab-700.woff2" },                // slab
  "Zilla Slab": { 400: "zilla-slab-400.woff2", 700: "zilla-slab-700.woff2" },                   // slab
  "Big Shoulders Stencil Display": { 400: "big-shoulders-stencil-display-400.woff2", 700: "big-shoulders-stencil-display-700.woff2" },// stencil
  "Clash Display": { 500: "clash-display-500.woff2", 600: "clash-display-600.woff2", 700: "clash-display-700.woff2" },// unapproved
  "Khand": { 600: "khand-600.woff2", 700: "khand-700.woff2" },                                  // unapproved
  "Melodrama": { 500: "melodrama-500.woff2", 700: "melodrama-700.woff2" },                      // unapproved
  "Zodiak": { 400: "zodiak-400.woff2", 700: "zodiak-700.woff2" },                               // unapproved
};

const cache = new Map();
function b64(file) {
  if (cache.has(file)) return cache.get(file);
  const p = DIR + file;
  const v = existsSync(p) ? readFileSync(p).toString('base64') : null;
  cache.set(file, v);
  return v;
}

/* Snap a requested weight to the nearest weight the family actually ships, so
   a call for 800 uses the 700 file rather than asking the renderer to synthesise
   a bold — synthetic emboldening is exactly the kind of silent width change
   that broke the measurements before. */
export function nearestWeight(family, weight) {
  const have = Object.keys(FONT_FILES[family] || {}).map(Number);
  if (!have.length) return weight;
  return have.reduce((a, b) => Math.abs(b - weight) < Math.abs(a - weight) ? b : a);
}

/* @font-face block covering just the families/weights this card uses. */
export function faceCSS(used) {
  const out = [];
  for (const [family, weights] of Object.entries(used)) {
    for (const w of [...weights].sort((a, b) => a - b)) {
      const file = (FONT_FILES[family] || {})[w];
      const data = file && b64(file);
      if (!data) continue;
      out.push(`@font-face{font-family:'${family}';font-style:normal;font-weight:${w};` +
               `src:url(data:font/woff2;base64,${data}) format('woff2');}`);
    }
  }
  return out.join('');
}
