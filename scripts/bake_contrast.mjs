#!/usr/bin/env node
/* BAKE MEASURED CONTRAST FIXES.
 *
 * Every in-app contrast pass reasons about colour ARITHMETIC: it takes the ink
 * hex, takes some estimate of the ground, and computes a ratio. That estimate
 * is the weak point. A photograph is not a single luminance. "SELL YOUR" at
 * 240px spans a headlight, a shadow and a wall, and the average of those three
 * describes none of them.
 *
 * DESIGN-LAW rule 34: never model a blend, MEASURE it. So this does what the
 * runtime cannot afford to do on every page load — render each template, diff
 * each text layer against its own absence to recover the true ink and the true
 * ground PER GLYPH PIXEL, choose an ink, and write the result to
 * assets/contrast-fix.json. app.js applies that table as a final pass.
 *
 * ── 2026-08-31 REWRITE: pick an ink, do not walk one ──────────────────────
 * The previous version summarised the ground to ONE luminance (a percentile),
 * derived a target from it, and walked the existing ink toward that target with
 * liftInk(). Two things were wrong with that, and both shipped:
 *
 *   1. A single number cannot describe a bimodal ground. st_sports_cutouthero's
 *      phone number straddles a green plate (L=0.256) and the dark photo around
 *      it (L=0.03). The percentile landed on the dark half, so the repair
 *      DARKENED white toward it and stopped at #959393 — L=0.250. Against the
 *      plate at L=0.256 that is 1.02:1. Chromatically miles apart, luminously
 *      identical: the money layer of that ad is invisible, and it was the
 *      repair that made it so.
 *   2. Walking a colour by luminance desaturates it. White walked down becomes
 *      grey, never a considered near-black. The palette's own `deep` is right
 *      there and was never a candidate.
 *
 * So the ground is now kept as the full distribution of per-glyph-pixel
 * luminances, candidate inks are SCORED against every one of those pixels, and
 * the winner is the ink whose WORST pixel does best (10th percentile, so a
 * handful of stray pixels cannot decide it). Near-white and near-black are
 * always candidates; so is a hue-preserving ladder of the original ink, and a
 * tie inside the required margin goes to whichever keeps the layer closest to
 * how it was authored.
 *
 * The table now carries the chosen ink itself (`inkFix`) rather than a target
 * and a direction, which is why applyMeasuredContrast() in app.js got shorter.
 *
 * Re-run after ANY change to the passes, the palette or the backdrops:
 *     node scripts/bake_contrast.mjs
 * It is idempotent: it re-measures from the current state each time.
 */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
/* ?nofix=1 — measure the MODELLED state, never a page that has already applied
   the previous table. Baking from repaired colours finds nothing wrong and
   writes an empty file, silently undoing every repair on the next deploy. */
const RAW  = process.env.GFX_BASE || 'http://localhost:8899/';
const BASE = RAW + (RAW.includes('?') ? '&' : '?') + 'nofix=1';
const OUTFILE = new URL('../assets/contrast-fix.json', import.meta.url).pathname;

const browser = await puppeteer.launch({ executablePath: CHROME, headless:'new', args:['--no-sandbox'], protocolTimeout: 0 });
const page = await browser.newPage();
const perr = [];
page.on('pageerror', e => perr.push(String(e)));
await page.goto(BASE, { waitUntil:'networkidle2', timeout:60000 });
await page.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 6000));

const fixes = await page.evaluate(() => {
  const W = TPL_W, H = TPL_H;
  const lin = c => { c/=255; return c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4); };
  const lumPx = (d,i) => 0.2126*lin(d.data[i]) + 0.7152*lin(d.data[i+1]) + 0.0722*lin(d.data[i+2]);
  const hexOf = (r,g,b) => '#' + [r,g,b].map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('');
  const hexLumOf = hex => { const n = parseInt(String(hex).replace('#',''),16);
    return 0.2126*lin((n>>16)&255) + 0.7152*lin((n>>8)&255) + 0.0722*lin(n&255); };
  const cr = (a,b) => (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);

  /* hue-preserving lightness ladder, so a repaired accent stays that accent */
  const toHsl = hex => {
    const n = parseInt(String(hex).replace('#',''),16);
    const r=((n>>16)&255)/255, g=((n>>8)&255)/255, b=(n&255)/255;
    const mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn, l=(mx+mn)/2;
    if (!d) return [0,0,l];
    const s = l > 0.5 ? d/(2-mx-mn) : d/(mx+mn);
    let h = mx===r ? ((g-b)/d)%6 : mx===g ? (b-r)/d+2 : (r-g)/d+4;
    h *= 60; return [h<0?h+360:h, s, l];
  };
  const toHex = (h,s,l) => {
    const c=(1-Math.abs(2*l-1))*s, x=c*(1-Math.abs((h/60)%2-1)), m=l-c/2;
    const [r,g,b]=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
    return hexOf((r+m)*255,(g+m)*255,(b+m)*255);
  };

  function paint(tpl, skip){
    const sc = new fabric.StaticCanvas(null, { width:W, height:H, renderOnAddRemove:false });
    const bgi = tpl.bg.type === 'image' ? freshBgImage(tpl.bg.src, tpl.bg.blur, tpl.bg.grade) : null;
    if (bgi){
      sc.setBackgroundImage(coverImage(bgi, W, H), () => {});
      if (tpl.bg.scrim) sc.add(scrimRect(tpl.bg.scrim, W, H, tpl.bg.scrimColor, tpl.bg.scrimMode));
    } else sc.add(bgRectFor(tpl.bg.type==='image'?(tpl.bg.fallback||{type:'solid',c:'#101014'}):tpl.bg, W, H));
    const refs = [];
    tpl.layers.forEach((l,i) => { if (skip===i){refs.push(null);return;} const o=buildLayer(l,tpl.id); sc.add(o); refs.push(o); });
    alignPass(sc, W, H);
    sc.renderAll();
    const d = sc.lowerCanvasEl.getContext('2d').getImageData(0,0,W,H);
    return { d, refs, kill:()=>sc.dispose() };
  }

  const out = [];
  TEMPLATES.forEach(tpl => {
    let full; try { full = paint(tpl, -1); } catch(e){ return; }
    const idx = [];
    tpl.layers.forEach((l,i) => {
      if (typeof l.text === 'string' && String(l.text).trim() && l.role !== 'deco') idx.push(i);
    });
    idx.forEach(i => {
      const o = full.refs[i]; if (!o) return;
      const b = o.getBoundingRect(true, true);
      const fs = o.fontSize || 40;
      let w; try { w = paint(tpl, i); } catch(e){ return; }
      const x0=Math.max(0,Math.floor(b.left)), y0=Math.max(0,Math.floor(b.top));
      const x1=Math.min(W,Math.ceil(b.left+b.width)), y1=Math.min(H,Math.ceil(b.top+b.height));

      /* GLYPH CORE ONLY. An anti-aliased edge pixel is a blend of ink and
         ground, so its ratio tends to 1:1 however legible the type is; letting
         those into the average is how an audit reports a failure nobody can
         see. Pixels the glyph fully owns are the ones a reader reads. */
      const hits = [], gAll = [];
      for (let y=y0;y<y1;y++) for (let x=x0;x<x1;x++){
        const p=(y*W+x)*4;
        const df = Math.abs(full.d.data[p]-w.d.data[p]) + Math.abs(full.d.data[p+1]-w.d.data[p+1]) + Math.abs(full.d.data[p+2]-w.d.data[p+2]);
        if (df < 24) continue;
        const gl = lumPx(w.d,p);
        gAll.push(gl);
        if (df >= 150) hits.push({ p, gl, fl: lumPx(full.d,p) });
      }
      w.kill();
      /* Drop the HALO. This engine adds a shadow as a separation device, and a
         black ring around white type moves its pixels the OPPOSITE way to the
         ink. Counted as ink they look like very dark type on a bright plate and
         poison both the ground distribution and the ink estimate. Establish
         which way this layer's glyphs move a pixel, then keep only those.
         theme_render.mjs measures the same way, so the bake and the audit are
         finally scoring the same pixels. */
      let pol = 0;
      hits.forEach(h => pol += (h.fl > h.gl ? 1 : -1));
      const dir = pol >= 0 ? 1 : -1;
      const gCore = [];
      let inkR=0, inkG=0, inkB=0, inkN=0;
      hits.forEach(h => {
        if ((h.fl > h.gl ? 1 : -1) !== dir) return;
        gCore.push(h.gl);
        inkR += full.d.data[h.p]; inkG += full.d.data[h.p+1]; inkB += full.d.data[h.p+2]; inkN++;
      });
      const grounds = gCore.length >= 40 ? gCore : gAll;
      if (grounds.length < 40) return;
      grounds.sort((a,b)=>a-b);
      const pct = f => grounds[Math.min(grounds.length-1, Math.floor(grounds.length*f))];

      const inkHex = inkN ? hexOf(inkR/inkN, inkG/inkN, inkB/inkN) : '#ffffff';
      const inkL = hexLumOf(inkHex);
      // how a candidate ink does across the WHOLE ground distribution
      const scoreOf = L => {
        let worst = 99, sum = 0;
        for (let k=0;k<grounds.length;k++){ const c = cr(L, grounds[k]); sum += c; if (c < worst) worst = c; }
        // 10th-percentile-worst, so a few stray pixels cannot decide the ink
        const sorted = grounds.map(g => cr(L,g)).sort((a,b)=>a-b);
        return { p10: sorted[Math.floor(sorted.length*0.10)], mean: sum/grounds.length, worst };
      };

      const want = fs >= 30 ? 3.0 : 4.5;
      /* CALIBRATION. This scores a candidate as if the ink painted at exactly
         its own luminance on every glyph pixel. The render does not oblige:
         anti-aliasing, strokes and the halo all pull the delivered contrast
         below the ideal. Measured across the failures of the previous bake, the
         actual mean came in at 0.74x the predicted mean and 0.81x the predicted
         p10 -- consistently, in one direction. So aim high enough that the
         delivered number, not the ideal one, clears the floor. This factor is
         measured, not guessed; re-derive it from theme_render.mjs if the
         renderer changes. */
      const DELIVERY = 0.74;
      const cur = scoreOf(inkL);
      /* Judge on BOTH: the mean is what a reader perceives and what the audit
         reports; the 10th percentile is the part of the ad that has gone
         invisible even when the average looks healthy. Either one short is a
         repair. */
      if (cur.mean * DELIVERY >= want && cur.p10 * DELIVERY >= want * 0.8) return;

      /* CANDIDATES. Near-white and near-black are always in, because on a
         bright plate the answer is usually "the other end of the scale" and the
         old walk could never get there. The hue ladder keeps a repaired accent
         recognisably that accent. */
      const [h,s] = toHsl(inkHex);
      const cands = [{hex:'#f7f3ec'}, {hex:'#141110'}, {hex:inkHex}];
      for (let L=0.04; L<=0.97; L+=0.06) cands.push({ hex: toHex(h, s, L) });
      if (s > 0.05) for (let L=0.04; L<=0.97; L+=0.06) cands.push({ hex: toHex(h, Math.min(1, s*0.55), L) });

      let best = null;
      cands.forEach(c => {
        const L = hexLumOf(c.hex);
        const sc = scoreOf(L);
        // primary: lift the worst pixels. secondary: the perceived average.
        const key = Math.min(sc.p10, want*2.0) * 100 + Math.min(sc.mean, want*2.0);
        if (!best || key > best.key) best = { hex:c.hex, key, ...sc };
      });
      /* Among inks that comfortably clear the floor, prefer the one closest to
         what the designer authored — a repair should be the smallest move that
         works, not a repaint. The margin is the floor divided by the measured
         delivery factor, plus a little headroom for JPEG ringing and for a user
         swapping the backdrop. */
      const margin = (want / DELIVERY) * 1.08;
      const ok = cands.map(c => ({ hex:c.hex, ...scoreOf(hexLumOf(c.hex)) }))
                      .filter(c => c.p10 >= margin && c.mean >= margin);
      if (ok.length){
        const dist = hex => Math.abs(hexLumOf(hex) - inkL);
        ok.sort((a,b) => dist(a.hex) - dist(b.hex));
        best = ok[0];
      }
      if (!best) return;

      /* Does this layer sit on a solid plate? A plate IS the separation, and a
         halo on top of one only fuzzes the letterform (rule 21). Detected from
         the RENDERED ground rather than the layer list: a plate shows up as a
         ground with almost no variance, a photograph always varies. */
      const onPlate = (pct(0.95) - pct(0.05)) < 0.06;

      out.push({ id: tpl.id, layer: tpl.layers[i].name, role: tpl.layers[i].role,
                 fs: Math.round(fs), onPlate,
                 was: +cur.mean.toFixed(2), wasP10: +cur.p10.toFixed(2),
                 cr: +best.mean.toFixed(2), p10: +best.p10.toFixed(2),
                 inkFix: best.hex,
                 ground: +pct(0.5).toFixed(4), groundHex: hexOf(0,0,0) });
    });
    full.kill();
  });
  return out;
});
await browser.close();

console.log('layers needing a measured repair: ' + fixes.length);
const byRole = {};
fixes.forEach(f => (byRole[f.role] = (byRole[f.role]||0)+1));
console.log('by role: ' + JSON.stringify(byRole));
const short = fixes.filter(f => f.cr < (f.fs >= 30 ? 3.0 : 4.5));
console.log('still short of the floor after the best available ink: ' + short.length +
            '  (these get a halo / stroke instead)');
writeFileSync(OUTFILE, JSON.stringify(fixes, null, 0));
console.log('wrote ' + OUTFILE);
if (perr.length){ console.log('PAGE ERRORS:'); perr.slice(0,4).forEach(e=>console.log('  '+e)); }
