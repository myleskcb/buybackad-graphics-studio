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

/* family -> weight -> file. Only the weights we actually ship. */
export const FONT_FILES = {
  'Clash Display': { 500: 'clash-display-500.woff2', 600: 'clash-display-600.woff2', 700: 'clash-display-700.woff2' },
  'Khand':         { 600: 'khand-600.woff2',         700: 'khand-700.woff2' },
  'Melodrama':     { 500: 'melodrama-500.woff2',     700: 'melodrama-700.woff2' },
  'Zodiak':        { 400: 'zodiak-400.woff2',        700: 'zodiak-700.woff2' },
  'Satoshi':       { 400: 'satoshi-400.woff2',       500: 'satoshi-500.woff2',
                     700: 'satoshi-700.woff2',       900: 'satoshi-900.woff2' },
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
