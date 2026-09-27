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
 * A COLOURED dark line keeps its hue and turns its lightness over (a deep
 * green headline becomes pale mint, magenta light pink), so the palette
 * survives the move to a dark ground.
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
  /* by default the white-shaded cards; named cards (--ids) also when they
     carry no shade at all (dark copy straight on a mid-tone photograph) */
  const white = (bg.scrim || 0) > 0 && lum(bg.scrimColor) > 0.5, none = !(bg.scrim > 0);
  return bg.type === 'image' && bg.src && (white || (only && none));
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
        const orig = Object.assign({}, t.bg);
        if ((t.bg.blur || 0) > MAX_BLUR) t.bg = Object.assign({}, t.bg, { blur: MAX_BLUR });
        const r = __sc.naturalGround(t, { grade: { treat: 'natural' }, dark: DARK, light: LIGHT, modes: ['gradient', 'normal'],
                                          flip: { dark: DARK, light: LIGHT }, prefer: 'dark' });
        r.was = was;
        /* a line re-inked light may stand on a pale band the solver does not
           see as a plate (see-through, or so large it counts as a veil): the
           band turns dark with it, same shape and opacity. Found on the cars
           card (a light model line on its light band) and a paper poster (the
           number on it). Smoke, never a deep shade of the band's own hue: the
           owner read those as coloured hazes (scripts/neutral_panels.mjs). */
        if (r.bg && r.flipped && r.flipped.length){
          const { sc, refs } = __sc.paint(Object.assign({}, t, { bg: r.bg }));
          const W = TPL_W, H = TPL_H, plates = {};
          const rgbaOf = f => { let m = /^#?([0-9a-f]{6})$/i.exec(String(f || '')); if (m){ const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255, 1]; }
            m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(String(f || '')); return m ? [+m[1], +m[2], +m[3], m[4] == null ? 1 : +m[4]] : null; };
          const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
          r.flipped.forEach(f => {
            const k = t.layers.findIndex(l => l.name === f.name); if (k < 0 || !refs[k]) return;
            const b = refs[k].getBoundingRect(true, true), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
            t.layers.forEach((l, j) => {
              if (j >= k || l.kind !== 'rect' || !refs[j] || !l.props || plates[l.name]) return;
              const q = refs[j].getBoundingRect(true, true);
              if (!(cx > q.left && cx < q.left + q.width && cy > q.top && cy < q.top + q.height)) return;
              const c = rgbaOf(l.props.fill); if (!c || l.props.grad) return;
              const a = c[3] * (l.props.opacity == null ? 1 : l.props.opacity), L = 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
              const big = q.width * q.height >= 0.45 * W * H;
              if (L < 0.45 || !(a < 0.5 || big) || q.width >= W * 0.97) return;
              plates[l.name] = 'rgba(16,16,19,' + Math.max(0.55, a).toFixed(2) + ')';
            });
          });
          /* and the other way round: a SEE-THROUGH plate (0.5 to 0.9) keeps
             its dark copy, since the solver counts it as that copy's ground,
             but what the eye saw was the plate over the WHITE shade. Over the
             dark ground the same plate reads mid-grey and its copy fell to
             about 2:1 (the cars card's model line). Such a plate becomes
             solid at the luminance it showed before, in neutral grey (rule 56:
             no hue over the photograph), so its copy keeps exactly the
             contrast it had (rule 52). */
          const flippedNames = new Set(r.flipped.map(f => f.name));
          let oldPx = null;
          const groundPx = spec => { const g = new fabric.StaticCanvas(null, { width: W, height: H, renderOnAddRemove: false });
            const bgi = freshBgImage(spec.src, spec.blur, spec.grade); if (!bgi){ g.dispose(); return null; }
            g.setBackgroundImage(coverImage(bgi, W, H), () => {});
            if (spec.scrim) g.add(scrimRect(spec.scrim, W, H, spec.scrimColor, spec.scrimMode));
            g.renderAll(); const d = g.lowerCanvasEl.getContext('2d').getImageData(0, 0, W, H).data; g.dispose(); return d; };
          t.layers.forEach((l, j) => {
            if (l.kind !== 'rect' || !refs[j] || !l.props || plates[l.name] || l.props.grad) return;
            const c = rgbaOf(l.props.fill); if (!c) return;
            const a = c[3] * (l.props.opacity == null ? 1 : l.props.opacity);
            if (a < 0.5 || a >= 0.9) return;
            const q = refs[j].getBoundingRect(true, true); if (q.width >= W * 0.97) return;
            const hosts = t.layers.some((x, k) => k > j && typeof x.text === 'string' && refs[k] && !flippedNames.has(x.name) && (() => {
              const b = refs[k].getBoundingRect(true, true), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
              return cx > q.left && cx < q.left + q.width && cy > q.top && cy < q.top + q.height; })());
            if (!hosts) return;
            oldPx = oldPx || groundPx(orig); if (!oldPx) return;
            let n = 0; const m = [0, 0, 0];
            for (let y = Math.max(0, Math.floor(q.top)); y < Math.min(H, q.top + q.height); y += 4)
              for (let x = Math.max(0, Math.floor(q.left)); x < Math.min(W, q.left + q.width); x += 4){ const i = (y * W + x) * 4; m[0] += oldPx[i]; m[1] += oldPx[i + 1]; m[2] += oldPx[i + 2]; n++; }
            if (!n) return;
            const seen = c.slice(0, 3).map((v, i) => a * v + (1 - a) * m[i] / n);
            const Ys = 0.2126 * lin(seen[0]) + 0.7152 * lin(seen[1]) + 0.0722 * lin(seen[2]);
            const g = Math.round(255 * (Ys <= 0.0031308 ? 12.92 * Ys : 1.055 * Math.pow(Ys, 1 / 2.4) - 0.055));
            plates[l.name] = 'rgb(' + g + ',' + g + ',' + g + ')';
          });
          sc.dispose();
          r.plates = Object.entries(plates).map(([name, fill]) => ({ name, fill }));
        }
        R[id] = r;
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
console.log(`lines re-inked light: ${done.reduce((s, [, r]) => s + (r.flipped ? r.flipped.length : 0), 0)} · pale bands under them turned dark: ${done.reduce((s, [, r]) => s + (r.plates ? r.plates.length : 0), 0)}`);
const why = {}; skips.forEach(([, r]) => { const k = r.skip || (r.err ? 'error' : 'kept light'); why[k] = (why[k] || 0) + 1; });
console.log('left alone because: ' + JSON.stringify(why));

const apply = (id, r) => {
  const rec = recOf(id);
  rec.tpl.bg = r.bg;
  (r.flipped || []).forEach(f => { const l = rec.tpl.layers.find(x => x.name === f.name); if (!l || !l.props) return;
    l.props.fill = f.fill; delete l.props.grad; delete l.props.stroke; delete l.props.strokeWidth;
    if (typeof l.props.opacity === 'number' && l.props.opacity < 1) l.props.opacity = 1;
    /* its halo turns with it (rule 27): a light halo behind light ink is a glow */
    const sh = l.props.shadow, m = sh && typeof sh === 'object' && /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(String(sh.color || ''));
    if (m && +m[1] + +m[2] + +m[3] > 380) l.props.shadow = Object.assign({}, sh, { color: 'rgba(12,12,14,' + (m[4] == null ? 1 : +m[4]) + ')' }); });
  (r.plates || []).forEach(pl => { const l = rec.tpl.layers.find(x => x.name === pl.name); if (!l || !l.props) return;
    l.props.fill = pl.fill; if (typeof l.props.opacity === 'number') l.props.opacity = 1; });
  return rec;
};
if (OUT){ mkdirSync(OUT, { recursive: true }); done.forEach(([id, r]) => writeFileSync(OUT + '/' + id + '.json', JSON.stringify(apply(id, r)))); console.log('wrote ' + done.length + ' to ' + OUT); }
if (WRITE){ done.forEach(([id, r]) => writeFileSync(DIR + 'tpl/' + id + '.json', JSON.stringify(apply(id, r)))); console.log('wrote ' + done.length + ' records'); }
if (argv('--json')) writeFileSync(argv('--json'), JSON.stringify(out));
