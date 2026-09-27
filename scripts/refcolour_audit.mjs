#!/usr/bin/env node
/* refcolour_audit.mjs — MEASURE the colour structure of the owner's graded ads.
 *
 * The owner said "the color schemes are slightly bland". Saturation alone does
 * not explain that, so this samples real pixels out of every graded reference
 * and reports, per image:
 *   ground  : modal colour of the outer 12% ring (hex, HSL L/S, Lab chroma,
 *             WCAG relative luminance)
 *   FLAT / GRADIENT / TEXTURED : ring top-third vs bottom-third mean colour
 *             (dE76), plus a row-wise L* regression (slope + R^2) so a real
 *             vertical ramp is told apart from photo noise
 *   dominant: k-means (k=6, Lab, k-means++) with each cluster's area share
 *   satmax / satmean-by-area, Lab chroma, hue-bin spread, and the
 *             Hasler-Susstrunk colourfulness metric
 *   contrast: WCAG of the largest non-ground light mass and dark mass vs ground
 *   class   : dark-ground-light-ink / light-ground-dark-ink / SATURATED ground
 *
 * Pixels are read through a canvas in headless Chrome (the repo's puppeteer-core
 * + system Chrome), images passed as data: URIs so the canvas is not tainted.
 * Gallery chrome (uniform light padding around a screenshotted card) is trimmed
 * before measuring, and the trim is reported per image.
 */
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = '/Users/admin/Desktop/designs examples';
const SETS = [
  ['good', path.join(ROOT, 'good design')],
  ['mid', path.join(ROOT, 'mid design')],
  ['bad', path.join(ROOT, 'bad design')],
];
/* ENGINE=1 adds the engine's own rendered cards as a fourth set, measured by the
   identical code path — the only way to say whether "bland" is real. */
if (process.env.ENGINE) SETS.push(['engine', '/Users/admin/Downloads/gfxv23/.render/refcolour']);
const OUT = process.env.OUT || '/Users/admin/Downloads/gfxv23/deploy-notes/refcolour.json';

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto('about:blank');

/* everything below runs in the page against real pixel data */
await page.evaluate(() => {
  const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  window.relLum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  window.wcag = (L1, L2) => (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  window.hsl = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    if (!d) return [0, 0, l];
    const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    let h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, s, l];
  };
  window.lab = (r, g, b) => {
    const f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const R = f(r), G = f(g), B = f(b);
    let X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
    let Y = (R * 0.2126 + G * 0.7152 + B * 0.0722);
    let Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
    const g2 = t => t > 0.008856 ? Math.cbrt(t) : (7.787 * t + 16 / 116);
    X = g2(X); Y = g2(Y); Z = g2(Z);
    return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)];
  };
  window.dE = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  window.hex = (r, g, b) => '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
});

async function measure(file) {
  const b64 = fs.readFileSync(file).toString('base64');
  return await page.evaluate(async (uri) => {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = uri; });
    const W0 = img.naturalWidth, H0 = img.naturalHeight;
    const cv = document.createElement('canvas'); cv.width = W0; cv.height = H0;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const D = ctx.getImageData(0, 0, W0, H0).data;
    const px = (x, y) => { const i = (y * W0 + x) * 4; return [D[i], D[i + 1], D[i + 2]]; };

    /* ── 1. trim uniform LIGHT gallery chrome (screenshot padding around a card).
       Only achromatic, near-uniform, light rows are removed, ≤12% per edge, so a
       deliberate dark or coloured ad ground is never trimmed away. */
    const uniformLine = (get, n) => {
      let sr = 0, sg = 0, sb = 0, qr = 0, qg = 0, qb = 0;
      for (let i = 0; i < n; i++) { const [r, g, b] = get(i); sr += r; sg += g; sb += b; qr += r * r; qg += g * g; qb += b * b; }
      const mr = sr / n, mg = sg / n, mb = sb / n;
      const sd = Math.max(Math.sqrt(Math.max(0, qr / n - mr * mr)), Math.sqrt(Math.max(0, qg / n - mg * mg)), Math.sqrt(Math.max(0, qb / n - mb * mb)));
      const [, s, l] = hsl(mr, mg, mb);
      return { sd, s, l };
    };
    let x0 = 0, y0 = 0, x1 = W0 - 1, y1 = H0 - 1;
    const cap = (n) => Math.floor(n * 0.12);
    const ok = u => u.sd < 6 && u.s < 0.20 && u.l > 0.70;
    while (y0 < cap(H0) && ok(uniformLine(i => px(x0 + i, y0), x1 - x0 + 1))) y0++;
    while (H0 - 1 - y1 < cap(H0) && ok(uniformLine(i => px(x0 + i, y1), x1 - x0 + 1))) y1--;
    while (x0 < cap(W0) && ok(uniformLine(i => px(x0, y0 + i), y1 - y0 + 1))) x0++;
    while (W0 - 1 - x1 < cap(W0) && ok(uniformLine(i => px(x1, y0 + i), y1 - y0 + 1))) x1--;
    const W = x1 - x0 + 1, H = y1 - y0 + 1;

    /* ── 2. downsample by striding real pixels (no interpolation) */
    const TARGET = 180;
    const sx = Math.max(1, Math.floor(W / TARGET)), sy = Math.max(1, Math.floor(H / TARGET));
    const P = [];            // {r,g,b,u,v,L,a,bb,S,Hu,lum}  u,v in 0..1 canvas coords
    let nx = 0, ny = 0;
    for (let y = y0; y <= y1; y += sy) {
      let row = 0;
      for (let x = x0; x <= x1; x += sx) {
        const [r, g, b] = px(x, y);
        const [Hu, S] = hsl(r, g, b), LB = lab(r, g, b);
        P.push({ r, g, b, u: (x - x0) / W, v: (y - y0) / H, L: LB[0], a: LB[1], bb: LB[2], S, Hu, lum: relLum(r, g, b) });
        row++;
      }
      nx = row; ny++;
    }
    const N = P.length;

    /* ── 3a. literal spec metric: modal colour of the outer 12% ring, 5-bit bins.
       Kept because it was asked for, but on a photographic ad the mode can be a
       block of TYPE that touches the edge, so 3b computes a robust estimate and
       everything downstream uses that. */
    const ring = P.filter(p => p.u < 0.12 || p.u > 0.88 || p.v < 0.12 || p.v > 0.88);
    const bins = new Map();
    for (const p of ring) {
      const k = ((p.r >> 3) << 10) | ((p.g >> 3) << 5) | (p.b >> 3);
      let e = bins.get(k); if (!e) bins.set(k, e = { n: 0, r: 0, g: 0, b: 0 });
      e.n++; e.r += p.r; e.g += p.g; e.b += p.b;
    }
    let top = null; for (const e of bins.values()) if (!top || e.n > top.n) top = e;
    const mr = top.r / top.n, mg = top.g / top.n, mb = top.b / top.n;
    const mLab = lab(mr, mg, mb), mHSL = hsl(mr, mg, mb);
    const groundModal = {
      hex: hex(mr, mg, mb), Lstar: +mLab[0].toFixed(1), s: +mHSL[1].toFixed(3),
      chroma: +Math.hypot(mLab[1], mLab[2]).toFixed(1), purity: +(top.n / ring.length).toFixed(3),
      relLum: +relLum(mr, mg, mb).toFixed(4)
    };

    /* ── 3b. robust ground: box-average the trimmed image into a G×G cell grid
       (each cell wider than a letter stroke), take the outer-ring cells, and use
       the component-wise MEDIAN in Lab. Median rejects the minority of ring
       cells that are type; the surviving value is the backdrop. */
    const G = 40, cell = [];
    for (let gy = 0; gy < G; gy++) for (let gx = 0; gx < G; gx++) {
      const ax = x0 + Math.floor(gx * W / G), bx = x0 + Math.floor((gx + 1) * W / G);
      const ay = y0 + Math.floor(gy * H / G), by = y0 + Math.floor((gy + 1) * H / G);
      let r = 0, g2 = 0, b = 0, n = 0, sy2 = 0, syq = 0;
      for (let y = ay; y < by; y++) for (let x = ax; x < bx; x++) {
        const i = (y * W0 + x) * 4; r += D[i]; g2 += D[i + 1]; b += D[i + 2]; n++;
        const yl = 0.299 * D[i] + 0.587 * D[i + 1] + 0.114 * D[i + 2]; sy2 += yl; syq += yl * yl;
      }
      r /= n; g2 /= n; b /= n;
      const my = sy2 / n, sd = Math.sqrt(Math.max(0, syq / n - my * my));
      const L = lab(r, g2, b);
      cell.push({ r, g: g2, b, u: (gx + 0.5) / G, v: (gy + 0.5) / G, L: L[0], A: L[1], B: L[2], sd });
    }
    /* A ring cell that straddles a letter has huge internal luminance variance;
       a cell of bare ground has almost none. Keeping only the CALM half of the
       ring is what stops a white headline from being reported as a white ground
       and stops a black ground from being averaged up into mid-grey. */
    const rcellAll = cell.filter(c => c.u < 0.12 || c.u > 0.88 || c.v < 0.12 || c.v > 0.88);
    const sds = rcellAll.map(c => c.sd).sort((a, b) => a - b);
    const sdCut = Math.max(8, sds[Math.floor(0.5 * (sds.length - 1))]);
    const calm = rcellAll.filter(c => c.sd <= sdCut);
    const rcell = calm.length >= 8 ? calm : rcellAll;
    const calmShare = +(calm.length / rcellAll.length).toFixed(3);
    const medOf = (arr, f) => { const s = arr.map(f).sort((a, b) => a - b); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
    const medLab = arr => [medOf(arr, c => c.L), medOf(arr, c => c.A), medOf(arr, c => c.B)];
    const gMed = medLab(rcell);
    // report the real ring cell nearest that median, so the hex is a colour that exists
    let rep = rcell[0], rd = 1e9;
    for (const c of rcell) { const d = dE([c.L, c.A, c.B], gMed); if (d < rd) { rd = d; rep = c; } }
    const gr = rep.r, gg = rep.g, gb = rep.b;
    const gHSL = hsl(gr, gg, gb), gLab = lab(gr, gg, gb), gLum = relLum(gr, gg, gb);
    const ground = {
      hex: hex(gr, gg, gb), h: +gHSL[0].toFixed(1), s: +gHSL[1].toFixed(3), l: +gHSL[2].toFixed(3),
      Lstar: +gLab[0].toFixed(1), chroma: +Math.hypot(gLab[1], gLab[2]).toFixed(1),
      relLum: +gLum.toFixed(4), purity: groundModal.purity
    };

    /* ── 4. FLAT vs GRADIENT vs PHOTO, all on robust ring-cell statistics.
       ringMAD = median |L*-median L*| over ring cells → how uneven the ground is,
       ignoring the type minority. ringDelta = dE76 between the MEDIAN colour of
       the top-third ring cells and the bottom-third ring cells. */
    const ringMAD = medOf(rcell.map(c => ({ d: Math.abs(c.L - gMed[0]) })), c => c.d);
    const rTop = rcell.filter(c => c.v < 1 / 3), rBot = rcell.filter(c => c.v > 2 / 3);
    const ringTop = medLab(rTop), ringBot = medLab(rBot);
    const ringDelta = +dE(ringTop, ringBot).toFixed(2);
    const ringDeltaL = +(ringBot[0] - ringTop[0]).toFixed(1);
    // whole-canvas thirds (means, as asked) for reference
    const meanLab = arr => arr.length ? [0, 1, 2].map(i => arr.reduce((s, p) => s + [p.L, p.a, p.bb][i], 0) / arr.length) : [0, 0, 0];
    const fullDelta = +dE(meanLab(P.filter(p => p.v < 1 / 3)), meanLab(P.filter(p => p.v > 2 / 3))).toFixed(2);
    // robust vertical ramp: band medians of ring cells, regressed on v
    const BANDS = 10, bandL = [], bandV = [];
    for (let i = 0; i < BANDS; i++) {
      const seg = rcell.filter(c => c.v >= i / BANDS && c.v < (i + 1) / BANDS);
      if (seg.length > 2) { bandL.push(medOf(seg, c => c.L)); bandV.push((i + 0.5) / BANDS); }
    }
    let slope = 0, r2 = 0;
    if (bandL.length > 3) {
      const mv = bandV.reduce((a, b) => a + b, 0) / bandV.length, ml = bandL.reduce((a, b) => a + b, 0) / bandL.length;
      let sxy = 0, sxx = 0, syy = 0;
      for (let i = 0; i < bandL.length; i++) { sxy += (bandV[i] - mv) * (bandL[i] - ml); sxx += (bandV[i] - mv) ** 2; syy += (bandL[i] - ml) ** 2; }
      slope = sxx ? sxy / sxx : 0; r2 = (sxx && syy) ? (sxy * sxy) / (sxx * syy) : 0;
    }
    const ringStdL = Math.sqrt(rcell.reduce((s, c) => s + (c.L - gMed[0]) ** 2, 0) / rcell.length);
    const groundKind = ringMAD >= 12 ? 'PHOTO'
      : (ringDelta >= 8 && r2 >= 0.5) ? 'GRADIENT'
        : ringMAD < 6 && ringDelta < 8 ? 'FLAT' : 'SEMI';

    /* ── 5. dominant colours: k-means++ in Lab, k=6 */
    const K = 6, pts = P;
    const cent = [];
    cent.push([pts[(Math.random() * pts.length) | 0]].map(p => [p.L, p.a, p.bb])[0]);
    while (cent.length < K) {
      let best = null, bd = -1;
      for (let t = 0; t < 400; t++) {
        const p = pts[(Math.random() * pts.length) | 0], v = [p.L, p.a, p.bb];
        const d = Math.min(...cent.map(c => dE(c, v)));
        if (d > bd) { bd = d; best = v; }
      }
      cent.push(best);
    }
    let asn = new Array(pts.length).fill(0);
    for (let it = 0; it < 24; it++) {
      for (let i = 0; i < pts.length; i++) {
        const v = [pts[i].L, pts[i].a, pts[i].bb]; let bi = 0, bd = 1e9;
        for (let k = 0; k < K; k++) { const d = dE(cent[k], v); if (d < bd) { bd = d; bi = k; } }
        asn[i] = bi;
      }
      const sum = Array.from({ length: K }, () => [0, 0, 0, 0]);
      for (let i = 0; i < pts.length; i++) { const s = sum[asn[i]]; s[0] += pts[i].L; s[1] += pts[i].a; s[2] += pts[i].bb; s[3]++; }
      for (let k = 0; k < K; k++) if (sum[k][3]) cent[k] = [sum[k][0] / sum[k][3], sum[k][1] / sum[k][3], sum[k][2] / sum[k][3]];
    }
    const clus = Array.from({ length: K }, () => ({ n: 0, r: 0, g: 0, b: 0 }));
    for (let i = 0; i < pts.length; i++) { const c = clus[asn[i]]; c.n++; c.r += pts[i].r; c.g += pts[i].g; c.b += pts[i].b; }
    const dominant = clus.filter(c => c.n).map(c => {
      const r = c.r / c.n, g = c.g / c.n, b = c.b / c.n, H2 = hsl(r, g, b), L2 = lab(r, g, b);
      return { hex: hex(r, g, b), share: +(c.n / N).toFixed(3), s: +H2[1].toFixed(3), l: +H2[2].toFixed(3), h: +H2[0].toFixed(0), chroma: +Math.hypot(L2[1], L2[2]).toFixed(1) };
    }).sort((a, b) => b.share - a.share);

    /* ── 6. saturation / chroma / colourfulness */
    const sSorted = P.map(p => p.S).sort((a, b) => a - b);
    const q = f => sSorted[Math.min(sSorted.length - 1, Math.floor(f * sSorted.length))];
    const satMean = P.reduce((s, p) => s + p.S, 0) / N;
    const chroma = P.map(p => Math.hypot(p.a, p.bb));
    const chromaMean = chroma.reduce((a, b) => a + b, 0) / N;
    const chromaSorted = [...chroma].sort((a, b) => a - b);
    const chromaP95 = chromaSorted[Math.floor(0.95 * chromaSorted.length)];
    const vividShare = P.filter(p => p.S > 0.5 && p.L > 15 && p.L < 95).length / N;
    const chromaticShare = P.filter((p, i) => chroma[i] > 25).length / N;
    /* where the colour LIVES: punch = strongly chromatic area, neutral = the
       greys/blacks/whites it plays against */
    const punchShare = chroma.filter(c => c > 50).length / N;
    const neutralShare = chroma.filter(c => c < 12).length / N;
    // Hasler-Susstrunk colourfulness
    let mrg = 0, myb = 0, srg = 0, syb = 0;
    const RG = P.map(p => p.r - p.g), YB = P.map(p => 0.5 * (p.r + p.g) - p.b);
    mrg = RG.reduce((a, b) => a + b, 0) / N; myb = YB.reduce((a, b) => a + b, 0) / N;
    srg = Math.sqrt(RG.reduce((s, v) => s + (v - mrg) ** 2, 0) / N);
    syb = Math.sqrt(YB.reduce((s, v) => s + (v - myb) ** 2, 0) / N);
    const colourfulness = Math.hypot(srg, syb) + 0.3 * Math.hypot(mrg, myb);
    // hue spread over chromatic pixels only
    const hueBins = new Array(12).fill(0); let chromN = 0;
    P.forEach((p, i) => { if (chroma[i] > 25 && p.L > 12 && p.L < 96) { hueBins[Math.floor(((p.Hu % 360) + 360) % 360 / 30)]++; chromN++; } });
    const hueFam = chromN ? hueBins.filter(v => v / chromN > 0.08).length : 0;
    /* how many DIFFERENT hues the colour is spread over, and how much of it the
       single biggest hue holds. A one-hue card is bland however saturated it is. */
    const hp = chromN ? hueBins.map(v => v / chromN) : hueBins.map(() => 0);
    const hueEntropy = -hp.filter(v => v > 0).reduce((s, p2) => s + p2 * Math.log2(p2), 0);
    const topHueShare = Math.max(...hp);

    /* ── 7. WCAG contrast of the largest text-like masses vs ground
       (pixels close to the ground colour are excluded so a white PAGE is not
        mistaken for white INK) */
    const nearGround = p => dE([p.L, p.a, p.bb], gLab) < 12;
    const lightMass = P.filter(p => p.L > 82 && !nearGround(p));
    const darkMass = P.filter(p => p.L < 28 && !nearGround(p));
    const massInfo = arr => {
      if (arr.length < N * 0.005) return null;
      const r = arr.reduce((s, p) => s + p.r, 0) / arr.length, g = arr.reduce((s, p) => s + p.g, 0) / arr.length, b = arr.reduce((s, p) => s + p.b, 0) / arr.length;
      return { hex: hex(r, g, b), share: +(arr.length / N).toFixed(3), contrast: +wcag(relLum(r, g, b), gLum).toFixed(2) };
    };
    const light = massInfo(lightMass), dark = massInfo(darkMass);
    const inkPick = (light && dark) ? (light.share >= dark.share ? 'light' : 'dark') : (light ? 'light' : dark ? 'dark' : 'none');
    const ink = inkPick === 'light' ? light : inkPick === 'dark' ? dark : null;

    /* LOCAL contrast: what the type actually sits ON. Build a mask of the ink
       mass on the sample lattice, dilate it, and take the median luminance of
       the dilation ring that is not itself ink. On a photographic ground the
       global-ground figure understates the ad — these ads buy their contrast
       with a plate, a scrim or a heavy outline directly under the letters. */
    const localContrast = (pred) => {
      const mask = new Uint8Array(N);
      let cnt = 0;
      for (let i = 0; i < N; i++) if (pred(P[i])) { mask[i] = 1; cnt++; }
      if (cnt < N * 0.004) return null;
      const R = 3, halo = [];
      for (let iy = 0; iy < ny; iy++) for (let ix = 0; ix < nx; ix++) {
        const i = iy * nx + ix; if (!mask[i]) continue;
        for (const [dx, dy] of [[R, 0], [-R, 0], [0, R], [0, -R], [R, R], [-R, -R], [R, -R], [-R, R]]) {
          const jx = ix + dx, jy = iy + dy; if (jx < 0 || jy < 0 || jx >= nx || jy >= ny) continue;
          const j = jy * nx + jx; if (!mask[j]) halo.push(P[j].lum);
        }
      }
      if (halo.length < 30) return null;
      halo.sort((a, b) => a - b);
      const bg = halo[halo.length >> 1];
      const inkLums = P.filter(pred).map(p => p.lum).sort((a, b) => a - b);
      const inkLum = inkLums[inkLums.length >> 1];
      return { share: +(cnt / N).toFixed(3), bgLum: +bg.toFixed(4), contrast: +wcag(inkLum, bg).toFixed(2) };
    };
    const lightPred = p => p.L > 82 && !nearGround(p);
    const darkPred = p => p.L < 28 && !nearGround(p);
    const localLight = localContrast(lightPred), localDark = localContrast(darkPred);
    const localPick = (localLight && localDark) ? (localLight.share >= localDark.share ? localLight : localDark) : (localLight || localDark);

    /* how many BIG colour fields the ad runs: dominant clusters that are both
       chromatic and large. The engine's answer is 1 (ground + white ink + one
       accent), so this is the number to beat. */
    const bigChromatic = dominant.filter(d => d.share >= 0.06 && d.chroma >= 25).length;
    const bigFields = dominant.filter(d => d.share >= 0.06).length;

    /* ── 8. class */
    let cls;
    if (ground.chroma >= 20 && ground.Lstar > 18 && ground.Lstar < 92) cls = 'SATURATED-COLOURED-GROUND';
    else if (ground.Lstar <= 45) cls = 'dark-ground-light-ink';
    else cls = 'light-ground-dark-ink';
    const nearBlack = ground.relLum <= 0.05;
    const nearWhite = ground.Lstar >= 88 && ground.chroma < 12;

    return {
      W0, H0, trim: { x0, y0, right: W0 - 1 - x1, bottom: H0 - 1 - y1 }, samples: N,
      ground, groundModal, groundKind, ringDelta, ringDeltaL, ringMAD: +ringMAD.toFixed(1),
      fullDelta, ringSlopeL: +slope.toFixed(1), ringR2: +r2.toFixed(2), ringStdL: +ringStdL.toFixed(1),
      dominant: dominant.slice(0, 6),
      satMax: +q(0.999).toFixed(3), satP95: +q(0.95).toFixed(3), satMean: +satMean.toFixed(3),
      chromaMean: +chromaMean.toFixed(1), chromaP95: +chromaP95.toFixed(1), vividShare: +vividShare.toFixed(3),
      chromaticShare: +chromaticShare.toFixed(3), punchShare: +punchShare.toFixed(3), neutralShare: +neutralShare.toFixed(3),
      colourfulness: +colourfulness.toFixed(1), hueFamilies: hueFam,
      hueEntropy: +hueEntropy.toFixed(2), topHueShare: +topHueShare.toFixed(3), calmShare,
      hueHist: hueBins.map(v => chromN ? +(v / chromN).toFixed(3) : 0),
      light, dark, inkPick, inkContrast: ink ? ink.contrast : null,
      localLight, localDark, localContrast: localPick ? localPick.contrast : null,
      bigChromatic, bigFields,
      cls, nearBlack, nearWhite, neither: !nearBlack && !nearWhite
    };
  }, `data:image/png;base64,${b64}`);
}

const all = [];
for (const [grade, dir] of SETS) {
  const files = fs.readdirSync(dir).filter(f => /\.png$/i.test(f)).sort();
  for (const f of files) {
    const m = await measure(path.join(dir, f));
    all.push({ grade, file: f, ...m });
    process.stderr.write(`${grade}\t${f.slice(0, 34).padEnd(34)}\t${m.ground.hex} L*${String(m.ground.Lstar).padStart(5)} C${String(m.ground.chroma).padStart(5)} ${m.groundKind.padEnd(9)} dE${String(m.ringDelta).padStart(6)} cf${String(m.colourfulness).padStart(6)} ${m.cls}\n`);
  }
}
await browser.close();
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(all, null, 1));

/* ── aggregate ── */
const med = a => { const s = [...a].sort((x, y) => x - y); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const pct = (n, d) => `${n}/${d} (${Math.round(100 * n / d)}%)`;
console.log('\n══ AGGREGATE BY GRADE ══');
for (const [grade] of SETS) {
  const g = all.filter(x => x.grade === grade), n = g.length;
  const kinds = k => g.filter(x => x.groundKind === k).length;
  const cl = c => g.filter(x => x.cls === c).length;
  console.log(`\n── ${grade.toUpperCase()} (n=${n})`);
  console.log(`  ground L*      med ${med(g.map(x => x.ground.Lstar)).toFixed(1)}  mean ${mean(g.map(x => x.ground.Lstar)).toFixed(1)}   range ${Math.min(...g.map(x => x.ground.Lstar)).toFixed(1)}–${Math.max(...g.map(x => x.ground.Lstar)).toFixed(1)}`);
  console.log(`  ground relLum  med ${med(g.map(x => x.ground.relLum)).toFixed(4)}`);
  console.log(`  ground chroma  med ${med(g.map(x => x.ground.chroma)).toFixed(1)}  mean ${mean(g.map(x => x.ground.chroma)).toFixed(1)}   >=20: ${pct(g.filter(x => x.ground.chroma >= 20).length, n)}`);
  console.log(`  ground HSL S   med ${med(g.map(x => x.ground.s)).toFixed(3)}`);
  console.log(`  near-black gr  ${pct(g.filter(x => x.nearBlack).length, n)}   near-white gr ${pct(g.filter(x => x.nearWhite).length, n)}   NEITHER ${pct(g.filter(x => x.neither).length, n)}`);
  console.log(`  groundKind     FLAT ${pct(kinds('FLAT'), n)}  GRADIENT ${pct(kinds('GRADIENT'), n)}  SEMI ${pct(kinds('SEMI'), n)}  PHOTO ${pct(kinds('PHOTO'), n)}`);
  console.log(`  ring MAD L*    med ${med(g.map(x => x.ringMAD)).toFixed(1)}   (painted ground = low)`);
  console.log(`  ring dE t/b    med ${med(g.map(x => x.ringDelta)).toFixed(1)}  >=8: ${pct(g.filter(x => x.ringDelta >= 8).length, n)}   full-canvas dE med ${med(g.map(x => x.fullDelta)).toFixed(1)}`);
  console.log(`  ring dL* t→b   med ${med(g.map(x => x.ringDeltaL)).toFixed(1)}   darker-at-bottom ${pct(g.filter(x => x.ringDeltaL < -4).length, n)}  lighter-at-bottom ${pct(g.filter(x => x.ringDeltaL > 4).length, n)}`);
  console.log(`  class          sat-coloured ${pct(cl('SATURATED-COLOURED-GROUND'), n)}  dark-gr ${pct(cl('dark-ground-light-ink'), n)}  light-gr ${pct(cl('light-ground-dark-ink'), n)}`);
  console.log(`  satMax med ${med(g.map(x => x.satMax)).toFixed(2)}   satMean(area) med ${med(g.map(x => x.satMean)).toFixed(3)}   vividShare med ${med(g.map(x => x.vividShare)).toFixed(3)}`);
  console.log(`  chroma mean med ${med(g.map(x => x.chromaMean)).toFixed(1)}   chromaP95 med ${med(g.map(x => x.chromaP95)).toFixed(1)}   chromaticShare med ${med(g.map(x => x.chromaticShare)).toFixed(3)}`);
  console.log(`  colourfulness  med ${med(g.map(x => x.colourfulness)).toFixed(1)}  mean ${mean(g.map(x => x.colourfulness)).toFixed(1)}  range ${Math.min(...g.map(x => x.colourfulness)).toFixed(1)}–${Math.max(...g.map(x => x.colourfulness)).toFixed(1)}`);
  console.log(`  hue entropy    med ${med(g.map(x => x.hueEntropy)).toFixed(2)}   biggest single hue holds med ${(100 * med(g.map(x => x.topHueShare))).toFixed(0)}% of the chromatic area`);
  console.log(`  punch C*>50    med ${med(g.map(x => x.punchShare)).toFixed(3)}   neutral C*<12 med ${med(g.map(x => x.neutralShare)).toFixed(3)}   chroma(interior)/chroma(ground) med ${med(g.map(x => x.chromaMean / Math.max(2, x.ground.chroma))).toFixed(2)}`);
  console.log(`  hueFamilies    med ${med(g.map(x => x.hueFamilies))}  mean ${mean(g.map(x => x.hueFamilies)).toFixed(2)}   >=3: ${pct(g.filter(x => x.hueFamilies >= 3).length, n)}  >=4: ${pct(g.filter(x => x.hueFamilies >= 4).length, n)}`);
  const ic = g.map(x => x.inkContrast).filter(v => v != null);
  console.log(`  ink vs GROUND  med ${med(ic).toFixed(1)}   <4.5: ${pct(ic.filter(v => v < 4.5).length, ic.length)}   light-ink ${pct(g.filter(x => x.inkPick === 'light').length, n)}`);
  const lc = g.map(x => x.localContrast).filter(v => v != null);
  console.log(`  ink vs LOCAL   med ${med(lc).toFixed(1)}   >=7: ${pct(lc.filter(v => v >= 7).length, lc.length)}  >=12: ${pct(lc.filter(v => v >= 12).length, lc.length)}  <4.5: ${pct(lc.filter(v => v < 4.5).length, lc.length)}`);
  console.log(`  big fields     med ${med(g.map(x => x.bigFields))}   BIG CHROMATIC (share>=6%, C*>=25) med ${med(g.map(x => x.bigChromatic))} mean ${mean(g.map(x => x.bigChromatic)).toFixed(2)}  >=2: ${pct(g.filter(x => x.bigChromatic >= 2).length, n)}  >=3: ${pct(g.filter(x => x.bigChromatic >= 3).length, n)}`);
  console.log(`  top1 share med ${med(g.map(x => x.dominant[0].share)).toFixed(3)}   top2 sum med ${med(g.map(x => x.dominant[0].share + (x.dominant[1] ? x.dominant[1].share : 0))).toFixed(3)}`);
  const domChrom = g.map(x => x.dominant.filter(d => d.chroma >= 25).reduce((s, d) => s + d.share, 0));
  console.log(`  area held by chromatic (C*>=25) dominants: med ${med(domChrom).toFixed(3)}  mean ${mean(domChrom).toFixed(3)}`);
}

/* ── the engine's own 8 palettes, measured the same way, from the swatches ── */
const PAL = [
  ['nn01 Night Lot', '#0B1B3A', '#132A57', '#FFFFFF', '#C6D4EE', '#FFB020', '#FF3B30'],
  ['jw09 Neon Counter', '#0A0F1E', '#14204A', '#FFFFFF', '#BFD2E8', '#22D3EE', '#FF2E93'],
  ['ca10 Cash Green', '#05261B', '#0A4230', '#FFFFFF', '#B9E3CF', '#16C172', '#FFC93C'],
  ['du06 Paper Red', '#F5EFE3', '#E8DFCC', '#16130F', '#4A423A', '#E23A1E', '#1D4ED8'],
  ['st04 Steel Orange', '#12161C', '#1E2732', '#FFFFFF', '#B4C1CE', '#FF6B18', '#FFD60A'],
  ['su07 Sunset Lot', '#2B0B3A', '#4A125C', '#FFFFFF', '#E8C9F0', '#FF8A00', '#FF2D78'],
  ['bp02 Blueprint', '#06203A', '#0A3457', '#FFFFFF', '#AFD3EC', '#4CC9F0', '#FFD60A'],
  ['np03 Newsprint', '#EDE7DC', '#DCD3C4', '#121212', '#4A463F', '#D7263D', '#1B4079'],
];
const pal = await (async () => {
  const b2 = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const pg = await b2.newPage(); await pg.goto('about:blank');
  const r = await pg.evaluate((PAL) => {
    const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const relLum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    const lab = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; const R = f(r), G = f(g), B = f(b); const g2 = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116; const X = g2((R * .4124 + G * .3576 + B * .1805) / .95047), Y = g2(R * .2126 + G * .7152 + B * .0722), Z = g2((R * .0193 + G * .1192 + B * .9505) / 1.08883); return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)]; };
    const hue = ([r, g, b]) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return 0; let h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return h * 60; };
    const C = h => { const L = lab(rgb(h)); return Math.hypot(L[1], L[2]); };
    return PAL.map(([name, ground, ground2, ink, body, accent, hot]) => {
      const gL = lab(rgb(ground)), g2L = lab(rgb(ground2));
      const hues = [accent, hot, body].map(h => Math.floor(((hue(rgb(h)) % 360) + 360) % 360 / 30));
      return {
        name, ground, groundLstar: +gL[0].toFixed(1), groundChroma: +C(ground).toFixed(1), groundLum: +relLum(rgb(ground)).toFixed(4),
        ground2dE: +Math.hypot(gL[0] - g2L[0], gL[1] - g2L[1], gL[2] - g2L[2]).toFixed(1),
        accentChroma: +C(accent).toFixed(1), hotChroma: +C(hot).toFixed(1),
        hueFamilies: new Set(hues).size,
        accentContrast: +((Math.max(relLum(rgb(accent)), relLum(rgb(ground))) + .05) / (Math.min(relLum(rgb(accent)), relLum(rgb(ground))) + .05)).toFixed(2),
        inkContrast: +((Math.max(relLum(rgb(ink)), relLum(rgb(ground))) + .05) / (Math.min(relLum(rgb(ink)), relLum(rgb(ground))) + .05)).toFixed(2),
      };
    });
  }, PAL);
  await b2.close(); return r;
})();
console.log('\n══ ENGINE PALETTES (swatch maths, same colour space) ══');
console.log(['palette', 'ground', 'gL*', 'gC*', 'gRelLum', 'ground→ground2 dE', 'accentC*', 'hotC*', 'hueFams', 'accentContrast', 'inkContrast'].join('\t'));
for (const p of pal) console.log([p.name, p.ground, p.groundLstar, p.groundChroma, p.groundLum, p.ground2dE, p.accentChroma, p.hotChroma, p.hueFamilies, p.accentContrast, p.inkContrast].join('\t'));
console.log(`  engine ground chroma: med ${med(pal.map(p => p.groundChroma)).toFixed(1)}   range ${Math.min(...pal.map(p => p.groundChroma)).toFixed(1)}–${Math.max(...pal.map(p => p.groundChroma)).toFixed(1)}`);
console.log(`  engine ground→ground2 dE (the only gradient it owns): med ${med(pal.map(p => p.ground2dE)).toFixed(1)}   max ${Math.max(...pal.map(p => p.ground2dE)).toFixed(1)}`);
console.log(`  engine hue families per palette: ${pal.map(p => p.hueFamilies).join(',')}  (accent+hot+body only; ground is achromatic-ish)`);

console.log('\n══ RAW PER-IMAGE ══');
console.log(['grade', 'file', 'groundHex', 'L*', 'C*', 'S', 'relLum', 'kind', 'ringMAD', 'ringdE', 'dL*t→b', 'R2', 'satMax', 'satMean', 'chromaMean', 'vivid', 'cfulness', 'hues','hueEnt','topHue','punch','neutral','ink','cGround','cLocal','bigChrom','class','modalHex'].join('\t'));
for (const x of all) console.log([x.grade, x.file.replace(/Screenshot 2026-08-25 at /, 'SS').replace(/\.png$/, ''), x.ground.hex, x.ground.Lstar, x.ground.chroma, x.ground.s, x.ground.relLum, x.groundKind, x.ringMAD, x.ringDelta, x.ringDeltaL, x.ringR2, x.satMax, x.satMean, x.chromaMean, x.vividShare, x.colourfulness, x.hueFamilies, x.hueEntropy, x.topHueShare, x.punchShare, x.neutralShare, x.inkPick, x.inkContrast, x.localContrast, x.bigChromatic, x.cls, x.groundModal.hex].join('\t'));
console.error(`\nwrote ${OUT}`);
