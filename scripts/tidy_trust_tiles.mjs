#!/usr/bin/env node
/* TRUST SEAL: THE TILES' WORDS CENTRED, NO SHEEN, ONE ACCENT.
 *
 * The owner, 2026-10-13, on trustSeal-cd10-15 (YOUR LOCAL iPHONE BUYER):
 * "bad color scheme and centering of the steps".
 *  - The four tiles are pills (rx up to half their height) with their two
 *    lines set flush left 34 px in, against the round end: the words sit off
 *    the tile's middle while everything above them is centred. Both lines go
 *    to the tile's centre.
 *  - Each tile and the status pill carried a "Sheen", a 9 px strip of 16%
 *    grey along the top edge, which reads as a smudge on a white tile. Gone.
 *  - The status pill took a tint of the photograph (lavender over a rose and
 *    teal photograph) while the number's plate is the accent (cyan): two
 *    accents that do not belong together. Where the pill's hue is over 30
 *    degrees from the plate's and the pill is coloured at all, it takes the
 *    tiles' surface and their ink, and its dot the plate's colour, so a card
 *    has one accent and one surface.
 *  - The model line sat 5-7 px over the number's plate: it goes to the middle
 *    of the space between the tiles and the plate.
 * A change is kept only when the gate says nothing got worse.
 *
 *   python3 -m http.server 8899   then
 *   CHROME=… [FABRIC_JS=…] node scripts/tidy_trust_tiles.mjs [--dry] [--ids a,b]
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { openStudio } from './_showcase_harness.mjs';

const DIR = new URL('../assets/showcase/tpl/', import.meta.url).pathname;
const DRY = process.argv.includes('--dry');
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
let ids = readdirSync(DIR).filter((f) => /^trustSeal-.*\.json$/.test(f)).map((f) => f.slice(0, -5));
if (arg('--ids')) { const want = new Set(arg('--ids').split(',')); ids = ids.filter((id) => want.has(id)); }

const rgbOf = (c) => {
  const s = String(c || '').trim(); let m;
  if ((m = /^#([0-9a-f]{6})$/i.exec(s))) { const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  if ((m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i.exec(s))) return [+m[1], +m[2], +m[3]];
  return null;
};
const hsl = ([r, g, b]) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return { h: 0, s: 0, l }; const s = d / (1 - Math.abs(2 * l - 1));
  const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return { h: (h * 60 + 360) % 360, s, l }; };

function tidy(rec) {
  const L = rec.tpl.layers, by = (n) => L.find((l) => l.name === n);
  const notes = [];
  /* the sheens */
  const before = L.length;
  rec.tpl.layers = L.filter((l) => !/^(Tile \d+|Status Pill) Sheen$/.test(l.name || ''));
  if (rec.tpl.layers.length !== before) notes.push('sheen');
  const L2 = rec.tpl.layers, by2 = (n) => L2.find((l) => l.name === n);
  /* the tiles' words to their middle */
  let centred = 0;
  for (let i = 1; i <= 4; i++) {
    const tile = by2('Tile ' + i); if (!tile || !tile.props) continue;
    const cx = (tile.props.left || 0) + (tile.props.width || 0) / 2;
    for (const n of ['Tile Big ' + i, 'Tile Small ' + i]) {
      const l = by2(n); if (!l || !l.props) continue;
      if (l.props.originX === 'center' && Math.abs((l.props.left || 0) - cx) < 1) continue;
      Object.assign(l.props, { originX: 'center', left: Math.round(cx * 100) / 100, textAlign: 'center' });
      centred++;
    }
  }
  if (centred) notes.push('centred ' + centred);
  /* one accent */
  const pill = by2('Status Pill'), plate = by2('Phone Plate'), tile = by2('Tile 1');
  const pc = pill && rgbOf(pill.props.fill), qc = plate && rgbOf(plate.props.fill);
  if (pc && qc && tile && tile.props && tile.props.fill) {
    const a = hsl(pc), b = hsl(qc), dh = Math.min(Math.abs(a.h - b.h), 360 - Math.abs(a.h - b.h));
    if (a.s > 0.15 && b.s > 0.15 && dh > 30) {
      pill.props.fill = tile.props.fill;
      const big = by2('Tile Big 1'), st = by2('Status Text'), dot = by2('Status Dot'), tick = by2('Tick Mark'), num = by2('Phone Number');
      if (st && st.props && big && big.props && big.props.fill) st.props.fill = big.props.fill;
      if (dot && dot.props) dot.props.fill = plate.props.fill;
      if (tick && tick.props && num && num.props && num.props.fill) tick.props.fill = num.props.fill;
      notes.push('one accent (pill hue ' + Math.round(a.h) + ' vs plate ' + Math.round(b.h) + ')');
    }
  }
  /* the model line ("iPhone 18 Pro Max • 18 Pro • 17 • 16 • 15") sat 5-7 px
     over the number's plate on all 29 live cards and 30 px under the tiles:
     it goes to the middle of the space between them */
  const items = by2('Items');
  const tiles = [3, 4].map((i) => by2('Tile ' + i)).filter((t) => t && t.props);
  if (items && items.props && plate && plate.props && tiles.length && typeof items.text === 'string' && !items.text.includes('\n')) {
    const tb = Math.max(...tiles.map((t) => (t.props.top || 0) + (t.props.height || 0)));
    const h = (items.props.fontSize || 24) * 1.13, room = (plate.props.top || 0) - tb;
    const top = Math.round((tb + room / 2 - h / 2) * 100) / 100;
    if (room > h + 8 && Math.abs(top - (items.props.top || 0)) > 2) { items.props.top = top; notes.push('model line centred'); }
  }
  return notes;
}

const { browser, page, errors } = await openStudio();
const kept = [], refused = [];
for (const id of ids) {
  const rec = JSON.parse(readFileSync(DIR + id + '.json', 'utf8'));
  const next = JSON.parse(JSON.stringify(rec));
  const notes = tidy(next);
  if (!notes.length) continue;
  const res = await page.evaluate(async (id, rec, next) => {
    const a = __sc.check(await __sc.prep(rec, id)), b = __sc.check(await __sc.prep(next, id));
    return __sc.accept(a, b);
  }, id, rec, next);
  if (!res.ok) { refused.push(`${id}: ${JSON.stringify(res.fresh).slice(0, 140)} ${JSON.stringify(res.lost).slice(0, 140)}`); continue; }
  if (!DRY) writeFileSync(DIR + id + '.json', JSON.stringify(next));
  kept.push(id + ': ' + notes.join(', '));
}
await browser.close();
console.log(`${kept.length} trustSeal records ${DRY ? 'would be' : ''} tidied, ${refused.length} refused`);
kept.forEach((s) => console.log('  ' + s));
refused.forEach((s) => console.log('  REFUSED ' + s));
if (errors.length) console.log('page errors: ' + errors.slice(0, 5).join(' | '));
