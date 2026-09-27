#!/usr/bin/env node
/* VARY THE GROUNDS — every kind of background in the library, not only photos.
 *
 * Owner, 2026-09-27: "We need to use backgrounds that are solid colors,
 * sunburst all sorts of styles even patterns overlays so we have all varieties
 * some images some blurred images. That way we have the most amount of
 * options." Measured on the 400 live cards: 373 on a photograph (84 of them
 * blurred), 27 on the money-fall ground, not one solid, gradient, sunburst or
 * pattern, although the owner ticked 115 drawn grounds in 33 styles on
 * 2026-09-03 (assets/approved-grounds.json, grounds.js).
 *
 * Two moves, each on the card's own palette and each judged on its pixels:
 *   - a card whose subject is its PRODUCT CUT-OUT (a hero of 220px and more,
 *     on a sharp photograph) can stand on a drawn ground: solid, sunburst,
 *     gradient, pattern or texture, in turn, one in six kept on its photo.
 *     A card with neither cut-out nor photograph was the owner's "lack the
 *     proper imagery" (2026-09-02); the cut-out is what keeps it an ad for
 *     the thing bought. Blurred and money-fall cards keep their grounds.
 *   - a card whose subject is its PHOTOGRAPH keeps it; one in five takes a
 *     neutral pattern over it (dots, halftone, grid, stripes, rays,
 *     scanlines: black or white at a low strength, never a hue, rule 56).
 * The ground is the card's theme ground (its fallback gradient), fitted to
 * the copy on it: deepened (or lifted) until that ink clears 6:1, so a ray or
 * a pattern still leaves it above 4.5:1. Every line is measured before and
 * after (ground under it with the copy hidden, 10th and 90th percentile); a
 * card whose copy on the ground reads both light and dark, or that loses a
 * line on its new ground and on a plain solid too, keeps its photograph.
 *
 * usage: node scripts/vary_grounds.mjs [--ids a,b] [--out dir] [--write] [--json f]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { openStudio } from './_showcase_harness.mjs';
const ROOT = new URL('../', import.meta.url).pathname, DIR = ROOT + 'assets/showcase/';
const argv = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const WRITE = process.argv.includes('--write'), OUT = argv('--out');
const idx = JSON.parse(readFileSync(DIR + 'index.json', 'utf8'));
const only = argv('--ids') ? new Set(argv('--ids').split(',')) : null;
const recOf = id => JSON.parse(readFileSync(DIR + 'tpl/' + id + '.json', 'utf8'));
const hash = s => { let h = 2166136261; for (const ch of s){ h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

const STYLES = {
  solid:    ['solid', 'grainy'],
  sunburst: ['sunburst', 'burst', 'burstTop', 'rays'],
  gradient: ['mesh', 'duo', 'sweep', 'glow', 'aurora', 'blobs', 'linear', 'vignetteG'],
  pattern:  ['halftone', 'dotgrid', 'chevron', 'topo', 'stripes', 'lowpoly', 'finegrid', 'waves', 'curves', 'confetti', 'bands'],
  texture:  ['velvet', 'bokeh', 'brushed', 'carbon', 'duneshade', 'split', 'skyline', 'stars'],
};
const SEQ = ['sunburst', 'solid', 'gradient', 'pattern', 'texture', 'keep'];
const OVERLAYS = ['halftone', 'dots', 'grid', 'stripes', 'rays', 'scan'];

/* the plan: which card gets what, deterministic, spread across layouts */
const live = idx.filter(c => !c.defect && c.imagery !== 'none' && (!only || only.has(c.id)));
const plan = [];
const byLayout = {};
live.forEach(c => {
  const r = recOf(c.id), b = r.tpl.bg || {};
  if (b.type !== 'image' || !b.src || /^(ground|overlay):/.test(b.src) || /\/grounds\//.test(b.src) || (b.blur || 0) >= 1) return;
  const hero = r.tpl.layers.some(l => l.kind === 'cutout' && l.props && (l.props.w || 0) >= 220);
  const lay = c.id.split('-')[0];
  (byLayout[lay] = byLayout[lay] || { hero: [], photo: [] })[hero ? 'hero' : 'photo'].push(c);
});
const turn = {};
const nextKind = style => { const list = STYLES[style]; turn[style] = (turn[style] || 0) + 1; return list[(turn[style] - 1) % list.length]; };
let ovTurn = 0;
Object.keys(byLayout).sort().forEach((lay, li) => {
  const g = byLayout[lay];
  g.hero.sort((a, b) => hash(a.id) - hash(b.id)).forEach((c, i) => {
    const style = SEQ[(i + li) % SEQ.length];
    if (style !== 'keep') plan.push({ id: c.id, style, kind: nextKind(style), seed: 1 + hash(c.id) % 9, accent: c.accent, support: c.support });
  });
  g.photo.sort((a, b) => hash(a.id) - hash(b.id)).forEach((c, i) => {
    if ((i + li) % 5 === 2) plan.push({ id: c.id, style: 'overlay', kind: OVERLAYS[ovTurn++ % OVERLAYS.length] });
  });
});
const count = plan.reduce((m, p) => (m[p.style] = (m[p.style] || 0) + 1, m), {});
console.log('planned: ' + plan.length + ' · ' + JSON.stringify(count));

const { browser, page, errors } = await openStudio();
const out = {};
for (let i = 0; i < plan.length; i += 6){
  Object.assign(out, await page.evaluate(async (items, STYLES) => {
    const R = {};
    const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const Y = c => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
    const rgbOf = f => { let m = /^#?([0-9a-f]{6})$/i.exec(String(f || '').trim()); if (m){ const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
      m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(String(f || '')); return m ? [+m[1], +m[2], +m[3]] : null; };
    const hexY = h => { const c = rgbOf(h); return c ? Y(c) : null; };
    const cr = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const mix = (a, b, t) => { const A = rgbOf(a), B = rgbOf(b); return '#' + [0, 1, 2].map(k => Math.round(A[k] + (B[k] - A[k]) * t).toString(16).padStart(2, '0')).join(''); };
    const isText = l => typeof l.text === 'string' && /\S/.test(l.text) && l.kind !== 'cutout';
    const W = TPL_W, H = TPL_H;
    /* every visible line: its ink, its ground (copy hidden), its host rect */
    const measure = t => {
      const { sc, refs } = __sc.paint(t), lines = [];
      t.layers.forEach((l, k) => { if (!isText(l) || !refs[k] || refs[k].visible === false || !l.props || l.props.grad) return;
        const ink = hexY(l.props.fill); if (ink == null) return;
        lines.push({ k, name: l.name, ink, b: refs[k].getBoundingRect(true, true) }); });
      const shown = refs.map(o => o && o.visible);
      t.layers.forEach((l, k) => { if (isText(l) && refs[k]) refs[k].visible = false; });
      sc.renderAll();
      const d = sc.lowerCanvasEl.getContext('2d').getImageData(0, 0, W, H).data;
      lines.forEach(x => { const v = [], b = x.b;
        for (let y = Math.max(0, Math.floor(b.top)); y < Math.min(H, b.top + b.height); y += 2)
          for (let xx = Math.max(0, Math.floor(b.left)); xx < Math.min(W, b.left + b.width); xx += 2){ const q = (y * W + xx) * 4; v.push(Y([d[q], d[q + 1], d[q + 2]])); }
        v.sort((p, q) => p - q);
        if (!v.length){ x.worst = 99; return; }
        x.p50 = v[v.length >> 1];
        x.worst = Math.min(cr(x.ink, v[Math.floor(v.length * 0.1)]), cr(x.ink, v[Math.floor(v.length * 0.9)]));
        const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
        x.host = -1;
        for (let j = x.k - 1; j >= 0; j--){ const l = t.layers[j]; if (l.kind !== 'rect' || !refs[j] || shown[j] === false) continue;
          const f = rgbOf(l.props && l.props.fill), a = /rgba\([^)]*,\s*([\d.]+)\)/.exec(String((l.props || {}).fill || ''));
          if (!f || (a && +a[1] * (l.props.opacity == null ? 1 : l.props.opacity) < 0.5)) continue;   // see-through: not a plate
          const q = refs[j].getBoundingRect(true, true);
          if (q.width * q.height > 0.6 * W * H) continue;                                            // a frame or a veil
          if (cx > q.left && cx < q.left + q.width && cy > q.top && cy < q.top + q.height){ x.host = j; break; } }
      });
      sc.dispose();
      return lines;
    };
    for (const it of items){
      try {
        const t = await __sc.load(it.id), orig = Object.assign({}, t.bg);
        const before = measure(t), byK = Object.fromEntries(before.map(x => [x.k, x]));
        const onGround = before.filter(x => x.host < 0 && x.p50 != null);
        const light = onGround.filter(x => x.ink > x.p50), dark = onGround.filter(x => x.ink <= x.p50);
        if (light.length && dark.length){ R[it.id] = { skip: 'copy on the ground reads both light and dark' }; continue; }
        const lightInk = !dark.length;
        const gate = () => { const after = measure(t);
          const fails = after.filter(x => { const b0 = byK[x.k]; return b0 && x.worst < Math.min(b0.worst, 4.5) - 0.05; });
          return { fails: fails.map(x => ({ name: x.name, was: +byK[x.k].worst.toFixed(2), now: +x.worst.toFixed(2) })), after }; };
        let bg = null, used = null, res = null;
        if (it.style === 'overlay'){
          await loadDrawnBg(GROUNDS.overlaySrc(it.kind, lightInk ? 'dark' : 'light', orig.src));
          t.bg = Object.assign({}, orig, { src: GROUNDS.overlaySrc(it.kind, lightInk ? 'dark' : 'light', orig.src) });
          res = gate(); if (!res.fails.length){ bg = t.bg; used = it.kind; }
        } else {
          /* the palette: the theme's ground, fitted to the copy on it */
          const fb = orig.fallback || {}, inks = onGround.map(x => x.ink);
          const inkY = inks.length ? (lightInk ? Math.min(...inks) : Math.max(...inks)) : 0.9;
          const toward = lightInk ? '#000000' : '#ffffff';
          const fit = c => { c = rgbOf(c) ? c : (lightInk ? '#14161c' : '#f4f1ea');
            for (let s = 0; s <= 1.0001; s += 0.06){ const m = mix(c, toward, Math.min(1, s)); if (cr(hexY(m), inkY) >= 6) return m; }
            return lightInk ? '#0e0f13' : '#f6f4ef'; };
          const P = { c1: fit(fb.c1 || fb.c), c2: fit(fb.c2 || fb.c1 || fb.c), accent: it.accent || '#f5a623', support: it.support || it.accent || '#4a90d9',
                      ink: lightInk ? '#f6f6f4' : '#101014' };
          for (const kind of [it.kind, 'solid']){
            t.bg = { type:'image', src: GROUNDS.src(kind, P, it.seed), scrim: 0, scrimColor: '#0b0b0d', scrimMode: 'gradient', blur: 0,
                     grade: { treat:'raw' }, fallback: { type:'grad', c1: P.c1, c2: P.c2, a: 135 } };
            res = gate(); if (!res.fails.length){ bg = t.bg; used = kind; break; }
          }
        }
        if (!bg){ R[it.id] = { skip: 'a line loses contrast on the new ground', fails: res && res.fails }; continue; }
        R[it.id] = { style: it.style, kind: used, bg, worst: +Math.min(...res.after.map(x => x.worst)).toFixed(2) };
      } catch (e){ R[it.id] = { err: String(e).slice(0, 160) }; }
    }
    return R;
  }, plan.slice(i, i + 6), STYLES));
  if (i % 60 === 0) console.log('…' + Math.min(i + 6, plan.length) + '/' + plan.length);
}
await browser.close();

const rows = Object.entries(out), done = rows.filter(([, r]) => r.bg);
const by = done.reduce((m, [, r]) => (m[r.style] = (m[r.style] || 0) + 1, m), {});
const kinds = done.reduce((m, [, r]) => (m[r.kind] = (m[r.kind] || 0) + 1, m), {});
const why = {}; rows.filter(([, r]) => !r.bg).forEach(([, r]) => { const k = r.skip || 'error'; why[k] = (why[k] || 0) + 1; });
console.log(`re-grounded: ${done.length} · ${JSON.stringify(by)} · kept: ${JSON.stringify(why)} · page errors ${errors.length}`);
console.log('kinds: ' + JSON.stringify(kinds));
const apply = (id, r) => { const rec = recOf(id); rec.tpl.bg = r.bg; return rec; };
if (OUT){ mkdirSync(OUT, { recursive: true }); done.forEach(([id, r]) => writeFileSync(OUT + '/' + id + '.json', JSON.stringify(apply(id, r)))); console.log('wrote ' + done.length + ' to ' + OUT); }
if (WRITE){
  done.forEach(([id, r]) => writeFileSync(DIR + 'tpl/' + id + '.json', JSON.stringify(apply(id, r))));
  /* the index says what each card stands on; a drawn ground is product-led */
  const raw = readFileSync(DIR + 'index.json', 'utf8'), ix = JSON.parse(raw);
  done.forEach(([id, r]) => { const c = ix.find(x => x.id === id); if (!c) return;
    c.ground = r.style === 'overlay' ? 'photo+' + r.kind : r.style; if (r.style !== 'overlay') c.imagery = 'product'; });
  writeFileSync(DIR + 'index.json', JSON.stringify(ix) + (raw.endsWith('\n') ? '\n' : ''));
  console.log('wrote ' + done.length + ' records and their index rows');
}
if (argv('--json')) writeFileSync(argv('--json'), JSON.stringify(out));
