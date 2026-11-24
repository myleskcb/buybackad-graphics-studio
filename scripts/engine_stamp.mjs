/* THE ENGINE A STILL WAS DRAWN BY (2026-11-23).

   The owner: "we make site changes and then ad changes but only the newest site changes ever reflect".
   The landing shows ads as stills drawn ahead of time (assets/recipe-stills/, assets/hero/), and a still
   was redrawn only when its own recipe changed: a change to the engine that draws every ad (a new kind of
   ground, photographs under the words, a layout) left every still on the site as it was. engineStamp() is
   a fingerprint of everything the full ad is drawn from, kept with each still; when it moves, every still
   is stale, the builders' --check says so, and their next run draws them again.

   It reads motion/*.js and motion/*.json (the engine, its grounds, families, colours, recipes and
   subjects) and full-ad-studio.js (Easy Mode's full ad, the picture a customer downloads); the code that
   only plays sound, exports video or runs the page is left out, so a change to those keeps the stills. */
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const ROOT = new URL('../', import.meta.url).pathname;
const NOT = new Set(['app.js', 'audio.js', 'export.js', 'music.js', 'voices.js', 'listing.js', 'buylist.js', 'audit.js', 'sw.js']);

export function engineFiles() {
  const motion = readdirSync(ROOT + 'motion').filter(f => /\.(js|json)$/.test(f) && !NOT.has(f)).sort().map(f => 'motion/' + f);
  return [...motion, 'full-ad-studio.js'];
}
export function engineStamp() {
  const h = createHash('sha1');
  for (const f of engineFiles()) { h.update(f + '\0'); h.update(readFileSync(ROOT + f)); }
  return h.digest('hex').slice(0, 12);
}
/** A sample number for a still, never the business's own line: 555-01xx is the range kept for fiction,
 *  under one of the Los Angeles area's codes (the stills' area is Long Beach). The same id, the same number. */
export function sampleNumber(id) {
  const codes = ['562', '213', '310', '323', '424', '626', '657', '714', '747', '818', '909', '949', '951'];
  let x = 0; for (const ch of String(id)) x = (x * 31 + ch.charCodeAt(0)) >>> 0;
  return `(${codes[x % codes.length]}) 555-01${String(10 + (x >>> 4) % 90).padStart(2, '0')}`;
}
