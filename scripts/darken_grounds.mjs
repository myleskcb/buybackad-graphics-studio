#!/usr/bin/env node
/* DARK GROUNDS — lift the white haze off the photographs.
 *
 * Owner, 2026-09-27, on the curated library: "make sure it still keeps good
 * colors. a lot of these have a white haze overlay" / "doesn't look great".
 * Measured: 238 of the 400 kept cards shaded their photograph with near-white
 * paper at 0.3 to 0.6, many over a blurred photograph as well. Rule 56 allowed
 * paper under dark ink; on a photograph it reads as a milky veil, and every
 * colour in the picture goes pastel.
 *
 * Each such card is re-solved by __sc.naturalGround() with prefer 'dark':
 *   - every NEUTRAL dark line on the photograph takes near-white ink (its
 *     outline goes: the shade now separates it); lines on their own plates
 *     keep theirs, the plate owns their ground;
 *   - the shade is near-black, graded top and bottom where copy sits (the
 *     middle lets the photograph through) before a flat veil is tried, at the
 *     lightest strength that clears 4.5:1 for every line;
 *   - a blur over 4px comes down to 4: detail and colour are the point.
 * A card whose dark copy is COLOURED (a navy headline on the photograph)
 * cannot be re-inked without redesigning it; it is reported and left alone.
 *
 * usage: node scripts/darken_grounds.mjs [--ids a,b] [--out dir] [--write]
 *   --out writes re-grounded records to dir for review; --write updates the
 *   records in place (thumbnails and the audits re-run after).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { openStudio } from './_showcase_harness.mjs';
const ROOT = new URL('../', import.meta.url).pathname, DIR = ROOT + 'assets/showcase/';
const argv = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const WRITE = process.argv.includes('--write'), OUT = argv('--out');
const DARK = '#0b0b0d', LIGHT = '#f6f6f4', MAX_BLUR = 4;
const idx = JSON.parse(readFileSync(DIR + 'index.json', 'utf8'));
const only = argv('--ids') ? new Set(argv('--ids').split(',')) : null;
const lum = h => { const m = /^#?([0-9a-f]{6})$/i.exec(String(h || '')); if (!m) return 0; const n = parseInt(m[1], 16);
  const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(n >> 16) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255); };
const recOf = id => JSON.parse(readFileSync(DIR + 'tpl/' + id + '.json', 'utf8'));
const live = c => !c.defect && c.imagery !== 'none' && !(typeof c.chroma === 'number' && c.chroma < 0.05);
const work = idx.filter(c => (only ? only.has(c.id) : live(c))).map(c => c.id).filter(id => {
  const bg = recOf(id).tpl.bg || {};
  return bg.type === 'image' && bg.src && (bg.scrim || 0) > 0 && lum(bg.scrimColor) > 0.5;
});
console.log('cards with a white shade on the photograph: ' + work.length);

const { browser, page, errors } = await openStudio();
const out = {};
for (let i = 0; i < work.length; i += 6){
  const ids = work.slice(i, i + 6);
  Object.assign(out, await page.evaluate(async (ids, DARK, LIGHT, MAX_BLUR) => {
    const R = {};
    for (const id of ids){
      try {
        const t = await __sc.load(id);
        const was = { scrim: t.bg.scrim, scrimColor: t.bg.scrimColor, blur: t.bg.blur || 0, mode: t.bg.scrimMode };
        if ((t.bg.blur || 0) > MAX_BLUR) t.bg = Object.assign({}, t.bg, { blur: MAX_BLUR });
        const r = __sc.naturalGround(t, { grade: { treat: 'natural' }, dark: DARK, light: LIGHT, modes: ['gradient', 'normal'],
                                          flip: { dark: DARK, light: LIGHT }, prefer: 'dark' });
        r.was = was; R[id] = r;
      } catch (e){ R[id] = { err: String(e).slice(0, 160) }; }
    }
    return R;
  }, ids, DARK, LIGHT, MAX_BLUR));
  if (i % 60 === 0) console.log('…' + (i + ids.length) + '/' + work.length);
}
await browser.close();

const rows = Object.entries(out);
const done = rows.filter(([, r]) => r.bg && r.light), skips = rows.filter(([, r]) => !r.bg || !r.light), errs = rows.filter(([, r]) => r.err);
const med = a => { const s = a.slice().sort((p, q) => p - q); return s.length ? s[Math.floor(s.length / 2)] : 0; };
console.log(`re-grounded dark: ${done.length} · left alone: ${skips.length} · errors ${errs.length} · page errors ${errors.length}`);
console.log(`shade: ${JSON.stringify(done.reduce((m, [, r]) => (m[r.bg.scrimMode] = (m[r.bg.scrimMode] || 0) + 1, m), {}))}, strength median ${med(done.map(([, r]) => r.bg.scrim))} (white was ${med(done.map(([, r]) => r.was.scrim || 0))})`);
console.log(`lines re-inked near-white: ${done.reduce((s, [, r]) => s + (r.flipped ? r.flipped.length : 0), 0)}`);
const why = {}; skips.forEach(([, r]) => { const k = r.skip || (r.err ? 'error' : 'kept light'); why[k] = (why[k] || 0) + 1; });
console.log('left alone because: ' + JSON.stringify(why));

const apply = (id, r) => {
  const rec = recOf(id);
  rec.tpl.bg = r.bg;
  (r.flipped || []).forEach(f => { const l = rec.tpl.layers.find(x => x.name === f.name); if (!l || !l.props) return;
    l.props.fill = f.fill; delete l.props.grad; delete l.props.stroke; delete l.props.strokeWidth;
    if (typeof l.props.opacity === 'number' && l.props.opacity < 1) l.props.opacity = 1; });
  return rec;
};
if (OUT){ mkdirSync(OUT, { recursive: true }); done.forEach(([id, r]) => writeFileSync(OUT + '/' + id + '.json', JSON.stringify(apply(id, r)))); console.log('wrote ' + done.length + ' to ' + OUT); }
if (WRITE){ done.forEach(([id, r]) => writeFileSync(DIR + 'tpl/' + id + '.json', JSON.stringify(apply(id, r)))); console.log('wrote ' + done.length + ' records'); }
if (argv('--json')) writeFileSync(argv('--json'), JSON.stringify(out));
