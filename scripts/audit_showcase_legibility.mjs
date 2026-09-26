#!/usr/bin/env node
/* SHOWCASE LEGIBILITY AUDIT — the showcase is what the landing page sells, and
 * until 2026-09-22 the legibility audit only ever ran over the 243 classic
 * templates in app.js. This runs the same diff method (legibility_audit.mjs:
 * paint with the layer, paint without it, and the pixels that changed ARE the
 * ink over the real ground) over every assets/showcase record, through the
 * studio's own buildLayer()/alignPass()/freshBgImage().
 *
 * Per card it records:
 *   legib      worst contrast of a headline / phone / CTA layer (core, below)
 *   legibMin   worst contrast of any other reading layer
 *   ghost      reading layers that barely marked the canvas (<1.2% of box)
 *   bgMissing  the record names a photograph the studio could not load
 *
 * Thresholds: a CRITICAL layer under 3:1 (WCAG AA large text) is a defect;
 * minor layers are reported, not stamped.
 *
 * A layer's contrast is the CORE of its strokes, the upper quartile of the
 * per-pixel contrast over the pixels it changes, not their mean (2026-09-26).
 * The changed pixels are the ink AND its soft shadow, glow and anti-aliased
 * edge, and on a 26px label with a soft shadow more than half of them are
 * shadow: "GET YOUR OFFER", #101014 on a cyan plate at 6:1 by colour, measured
 * a mean of 2.85 (median pixel 1.3, upper quartile 5.6) and was held back as
 * unreadable. A line that is truly unreadable has no core either: white on a
 * pale photograph measured 1.36 mean and 1.45 upper quartile. The mean is
 * still recorded per layer (`mean`), so the change can be seen.
 *
 * usage: node scripts/audit_showcase_legibility.mjs [--write] [--json out.json]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { openStudio } from './_showcase_harness.mjs';
const ROOT = new URL('../', import.meta.url).pathname;
const WRITE = process.argv.includes('--write');
const J = process.argv.indexOf('--json');
const idx = JSON.parse(readFileSync(ROOT + 'assets/showcase/index.json', 'utf8'));
const ONLY = process.env.ONLY ? new Set(JSON.parse(readFileSync(process.env.ONLY, 'utf8'))) : null;
const work = ONLY ? idx.filter(c => ONLY.has(c.id)) : idx;
const { browser, page, errors } = await openStudio();
const out = {};
for (let i = 0; i < work.length; i += 8){
  const ids = work.slice(i, i + 8).map(c => c.id);
  Object.assign(out, await page.evaluate(async ids => {
    const R = {};
    const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const lum = (d, k) => 0.2126 * lin(d[k]) + 0.7152 * lin(d[k + 1]) + 0.0722 * lin(d[k + 2]);
    const CRIT = { headline:1, phone:1, cta:1 }, READ = { headline:1, phone:1, cta:1, info:1, badges:1, sub:1, website:1, offer:1 };
    for (const id of ids){
      try {
        const t = await __sc.load(id);
        const { sc, refs, bgMissing } = __sc.paint(t);
        const W = TPL_W, H = TPL_H, ctx = sc.lowerCanvasEl.getContext('2d');
        const full = ctx.getImageData(0, 0, W, H).data;
        let legib = 99, legibMin = 99, ghost = 0, worst = null, layers = [];
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
          let changed = 0, total = 0, sum = 0;
          const px = [];
          for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++){
            const f = (y * W + x) * 4, g = ((y - y0) * (x1 - x0) + (x - x0)) * 4; total++;
            if (Math.abs(full[f] - w[g]) + Math.abs(full[f + 1] - w[g + 1]) + Math.abs(full[f + 2] - w[g + 2]) < 24) continue;
            changed++;
            const a = lum(full, f), c = lum(w, g), k = (Math.max(a, c) + 0.05) / (Math.min(a, c) + 0.05);
            sum += k; px.push(k);
          }
          px.sort((p, q) => p - q);
          const cov = total ? changed / total : 0, mean = changed ? sum / changed : 0;
          const cr = changed ? px[Math.min(px.length - 1, Math.floor(px.length * 0.75))] : 0;   // the core of the strokes
          layers.push({ role:l.role, text:l.text.slice(0, 30), cr:+cr.toFixed(2), mean:+mean.toFixed(2), cov:+(cov * 100).toFixed(1) });
          if (cov < 0.012){ if (CRIT[l.role]) ghost++; return; }
          if (CRIT[l.role]){ if (cr < legib){ legib = cr; worst = l.role + ' "' + l.text.slice(0, 24).replace(/\n/g, ' / ') + '"'; } }
          else legibMin = Math.min(legibMin, cr);
        });
        sc.dispose();
        R[id] = { legib:+legib.toFixed(2), legibMin:+legibMin.toFixed(2), ghost, worst, bgMissing, layers };
      } catch (e){ R[id] = { err:String(e).slice(0, 90) }; }
    }
    return R;
  }, ids));
  if (i % 160 === 0) console.log('…' + (i + ids.length) + '/' + work.length);
}
await browser.close();
const rows = work.map(c => ({ c, r:out[c.id] || { err:'none' } }));
const ok = rows.filter(x => !x.r.err);
const bad = ok.filter(x => x.r.legib < 3), ghosts = ok.filter(x => x.r.ghost), miss = ok.filter(x => x.r.bgMissing);
const minor = ok.filter(x => x.r.legibMin < 3);
const med = a => { const s = a.slice().sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };
console.log('\naudited ' + work.length + ' · errors ' + (rows.length - ok.length) + ' · page errors ' + errors.length);
console.log('  critical (headline/phone/CTA) under 3:1  ' + bad.length);
console.log('  critical layer effectively invisible     ' + ghosts.length);
console.log('  backdrop the studio cannot load          ' + miss.length);
console.log('  other reading text under 3:1 (reported)  ' + minor.length);
console.log('  median worst-critical contrast           ' + med(ok.map(x => Math.min(x.r.legib, 21))).toFixed(2));
bad.sort((a, b) => a.r.legib - b.r.legib).slice(0, 12).forEach(x => console.log('   ' + String(x.r.legib).padStart(5) + '  ' + x.c.id.padEnd(30) + x.r.worst));
if (J > 0) writeFileSync(process.argv[J + 1], JSON.stringify(out));
if (WRITE){
  idx.forEach(c => { const r = out[c.id]; if (r && !r.err){ c.legib = r.legib; if (r.ghost) c.ghost = r.ghost; else delete c.ghost; if (r.bgMissing) c.bgMissing = 1; else delete c.bgMissing; } });
  writeFileSync(ROOT + 'assets/showcase/index.json', JSON.stringify(idx));
  console.log('wrote legib/ghost/bgMissing onto the index');
}
if (errors.length) console.log('page errors:', errors.slice(0, 4));
