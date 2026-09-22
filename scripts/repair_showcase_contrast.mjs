#!/usr/bin/env node
/* CONTRAST REPAIR for the showcase — measured, hue-preserving, re-measured.
 *
 * audit_showcase_legibility.mjs found 276 of 971 live cards whose headline,
 * phone number or CTA measured under 3:1 against the pixels actually behind
 * it, and 729 with smaller copy under 3:1 — the library had never been
 * measured this way, only the 243 classics had. This fixes what it measures:
 *
 *   1. paint the card, and for every reading line diff it against the card
 *      without it (the pixels that change ARE the ink, the pixels under them
 *      ARE the ground), exactly as the audit does
 *   2. a line under target (3:1 at 30px and up or any headline/phone/CTA,
 *      4.5:1 below) keeps its HUE and chroma (DESIGN-LAW 31) and has its
 *      luminance solved to clear the target against the median ground
 *      luminance, with 20% headroom; a gradient fill is deleted in favour of
 *      the flat fill (rule 45); a stroke the same tone as the ground is
 *      removed, and one that fights the new ink moves to the far side
 *   3. re-measure; two rounds; then re-render the thumbnail through
 *      renderThumb() so the picture shows the repaired card
 *
 * Nothing that was already legible is touched.
 *   node scripts/repair_showcase_contrast.mjs            (:8899 + Chrome)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { openStudio } from './_showcase_harness.mjs';
import { parse, fmt, lumOf, toOklch, atLuminance } from './refresh_palettes.mjs';
const ROOT = new URL('../', import.meta.url).pathname, DIR = ROOT + 'assets/showcase/';
const idx = JSON.parse(readFileSync(DIR + 'index.json', 'utf8'));
const ONLY = process.env.ONLY ? new Set(JSON.parse(readFileSync(process.env.ONLY, 'utf8'))) : null;
const work = ONLY ? idx.filter(c => ONLY.has(c.id)) : idx;
const { browser, page, errors } = await openStudio();

async function measure(ids){
  return page.evaluate(async ids => {
    const R = {};
    const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const lum = (d, k) => 0.2126 * lin(d[k]) + 0.7152 * lin(d[k + 1]) + 0.0722 * lin(d[k + 2]);
    const READ = { headline:1, phone:1, cta:1, info:1, badges:1, sub:1, website:1, offer:1 };
    for (const id of ids){
      try {
        const t = await __sc.load(id);
        const { sc, refs } = __sc.paint(t);
        const W = TPL_W, H = TPL_H, ctx = sc.lowerCanvasEl.getContext('2d');
        const full = ctx.getImageData(0, 0, W, H).data;
        const rows = [];
        t.layers.forEach((l, k) => {
          const o = refs[k];
          if (!o || typeof l.text !== 'string' || !l.text.trim() || !READ[l.role]) return;
          const b = o.getBoundingRect(true, true);
          const x0 = Math.max(0, Math.floor(b.left)), y0 = Math.max(0, Math.floor(b.top));
          const x1 = Math.min(W, Math.ceil(b.left + b.width)), y1 = Math.min(H, Math.ceil(b.top + b.height));
          if (x1 - x0 < 4 || y1 - y0 < 4) return;
          o.visible = false; sc.renderAll();
          const w = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
          o.visible = true;
          let changed = 0, total = 0, sum = 0; const gy = [];
          for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++){
            const f = (y * W + x) * 4, g = ((y - y0) * (x1 - x0) + (x - x0)) * 4; total++;
            if (Math.abs(full[f] - w[g]) + Math.abs(full[f + 1] - w[g + 1]) + Math.abs(full[f + 2] - w[g + 2]) < 24) continue;
            changed++;
            const a = lum(full, f), c = lum(w, g); gy.push(c);
            sum += (Math.max(a, c) + 0.05) / (Math.min(a, c) + 0.05);
          }
          gy.sort((p, q) => p - q);
          const fs = (o.fontSize || 0) * (o.scaleY || 1);
          rows.push({ k, role:l.role, fs, cr:changed ? sum / changed : 0, cov:total ? changed / total : 0,
            gMed:gy.length ? gy[gy.length >> 1] : 0, gLo:gy.length ? gy[Math.floor(gy.length * 0.1)] : 0, gHi:gy.length ? gy[Math.floor(gy.length * 0.9)] : 0 });
        });
        sc.dispose();
        R[id] = rows;
      } catch (e){ R[id] = { err:String(e).slice(0, 80) }; }
    }
    return R;
  }, ids);
}
const CRIT = { headline:1, phone:1, cta:1 };
const target = r => (CRIT[r.role] || r.fs >= 30) ? 3.0 : 4.5;
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

function fix(rec, rows){
  let n = 0;
  rows.forEach(r => {
    if (r.cov < 0.012 || r.cr >= target(r)) return;
    const l = rec.tpl.layers[r.k], p = l.props; if (!p) return;
    const cur = parse(p.fill || (p.grad && p.grad.c1) || '#ffffff') || { r:255, g:255, b:255, a:1, fmt:'hex' };
    const k = toOklch(cur), T = target(r) * 1.2;
    /* the ground this line must clear: its lighter tenth if we go dark, its darker tenth if we go light */
    const yDark = (r.gLo + 0.05) / T - 0.05, yLight = T * (r.gHi + 0.05) - 0.05;
    const darkOk = yDark >= 0, lightOk = yLight <= 1;
    let Y, goDark;
    if (darkOk && lightOk) goDark = Math.abs(lumOf(cur) - yDark) < Math.abs(lumOf(cur) - yLight);
    else if (darkOk) goDark = true; else if (lightOk) goDark = false;
    else goDark = r.gMed > 0.18;                         // neither side clears a busy ground: take the far end
    Y = goDark ? (darkOk ? yDark : 0) : (lightOk ? yLight : 1);
    /* never move the ink the wrong way: a line already darker (or lighter)
       than the solved value keeps its own */
    Y = goDark ? Math.min(Y, lumOf(cur)) : Math.max(Y, lumOf(cur));
    const nc = atLuminance(k.H, Math.min(k.C, goDark ? 0.09 : 0.06), Y);
    p.fill = fmt(nc, { fmt:'hex' });
    delete p.grad; delete l.grad;
    /* a halo the same tone as the ground separates nothing — it only blurs
       the letter's edge into what is behind it (measured: a white stroke
       under dark ink on a pale ground held CTAs at 1.9:1). It goes. */
    if (p.stroke && (p.strokeWidth || 0) > 0){
      const st = parse(p.stroke);
      if (st && ratio(lumOf(st), r.gMed) < 1.6){ delete p.stroke; p.strokeWidth = 0; }
    }
    if (p.stroke && (p.strokeWidth || 0) > 0){
      const sc = parse(p.stroke) || { r:0, g:0, b:0, a:1, fmt:'hex' };
      const sk = toOklch(sc);
      const want = goDark ? Math.max(0.8, lumOf(sc)) : Math.min(0.02, lumOf(sc));
      if (ratio(lumOf(sc), Y) < 3) p.stroke = fmt(atLuminance(sk.H, Math.min(sk.C, 0.05), want), sc);
    }
    n++;
  });
  return n;
}

const changed = new Set(); let before = { crit:0, minor:0 }, after = { crit:0, minor:0 };
const tally = (res, into) => Object.values(res).forEach(rows => Array.isArray(rows) && rows.forEach(r => {
  if (r.cov < 0.012 || r.cr >= target(r)) return; if (CRIT[r.role]) into.crit++; else into.minor++; }));
for (let i = 0; i < work.length; i += 8){
  let ids = work.slice(i, i + 8).map(c => c.id);
  for (let round = 0; round < 3 && ids.length; round++){
    const res = await measure(ids);
    if (round === 0) tally(res, before);
    const next = [];
    for (const id of ids){
      const rows = res[id]; if (!Array.isArray(rows)) continue;
      if (round === 2){ tally({ [id]:rows }, after); continue; }
      const rec = JSON.parse(readFileSync(DIR + 'tpl/' + id + '.json', 'utf8'));
      if (fix(rec, rows)){ writeFileSync(DIR + 'tpl/' + id + '.json', JSON.stringify(rec)); changed.add(id); next.push(id); }
      else tally({ [id]:rows }, after);
    }
    ids = next;
  }
  if (i % 160 === 0) console.log('…' + (i + 8) + '/' + work.length + '  repaired so far ' + changed.size);
}
/* re-bake the thumbnails of every card that changed */
const list = [...changed];
for (let i = 0; i < list.length; i += 8){
  const out = await page.evaluate(async ids => {
    const res = [];
    for (const id of ids){
      const t = await __sc.load(id);
      const jpg = renderThumb(t, 1080);
      const img = await new Promise(r => { const el = new Image(); el.onload = () => r(el); el.onerror = () => r(null); el.src = jpg; });
      const cv = document.createElement('canvas'); cv.width = cv.height = 448;
      const g = cv.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, 448, 448);
      res.push({ id, webp:cv.toDataURL('image/webp', 0.74) });
    }
    return res;
  }, list.slice(i, i + 8));
  out.forEach(r => writeFileSync(DIR + r.id + '.webp', Buffer.from(r.webp.split(',')[1], 'base64')));
}
await browser.close();
console.log('cards repaired ' + changed.size + ' of ' + work.length + ' · page errors ' + errors.length);
console.log('lines under target, before: critical ' + before.crit + ', other ' + before.minor);
console.log('lines under target, after:  critical ' + after.crit + ', other ' + after.minor);
