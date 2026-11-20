#!/usr/bin/env node
/* favicon.svg, drawn from tools/brand/icon.html?small (DESIGN-LAW 165).

   A favicon is drawn on its own, with no web font, so the label's letters have to be outlines. This
   opens the small icon in a browser with its face loaded and draws its letters large in that face. It
   then traces them (marching squares, simplified to under a twentieth of a unit) and writes
   favicon.svg: the navy tile, the blue label and the letters as one path.
   Run it after the icon's label or its letters change, then look at favicon.svg at 16 px.

   usage:  PLAYWRIGHT_MODULE=/path/to/playwright node tools/brand/favicon.mjs */
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const K = 20, N = 100 * K;   // 20 pixels a unit of the icon's 100 unit grid

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 400, height: 400 } });
await page.goto('file://' + here + 'icon.html?small', { waitUntil: 'load' });
const icon = await page.evaluate(async ({ N, K }) => {
  const label = document.getElementById('label'), text = document.getElementById('ad');
  const num = (el, k) => +el.getAttribute(k);
  const size = num(text, 'font-size'), family = text.getAttribute('font-family');
  await document.fonts.load(`900 ${size * K}px "${family}"`);
  const c = document.createElement('canvas'); c.width = N; c.height = N;
  const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, N, N);
  g.fillStyle = '#fff'; g.font = `900 ${size * K}px "${family}"`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text.textContent, num(text, 'x') * K, num(text, 'y') * K);
  const px = g.getImageData(0, 0, N, N).data, on = (x, y) => x >= 0 && y >= 0 && x < N && y < N && px[(y * N + x) * 4] > 127;
  /* marching squares on the pixel centres, each segment with the letter on its right, stitched into loops */
  const segs = new Map(), key = (x, y) => x.toFixed(1) + ',' + y.toFixed(1), add = (a, b) => segs.set(key(...a), b);
  for (let y = -1; y < N; y++) for (let x = -1; x < N; x++) {
    const c4 = (on(x, y) ? 8 : 0) | (on(x + 1, y) ? 4 : 0) | (on(x + 1, y + 1) ? 2 : 0) | (on(x, y + 1) ? 1 : 0);
    const T = [x + .5, y], R = [x + 1, y + .5], B = [x + .5, y + 1], L = [x, y + .5];
    switch (c4) {
      case 1: add(L, B); break; case 2: add(B, R); break; case 3: add(L, R); break; case 4: add(R, T); break;
      case 5: add(L, T); add(R, B); break; case 6: add(B, T); break; case 7: add(L, T); break; case 8: add(T, L); break;
      case 9: add(T, B); break; case 10: add(T, R); add(B, L); break; case 11: add(T, R); break; case 12: add(R, L); break;
      case 13: add(R, B); break; case 14: add(B, L); break;
    }
  }
  const loops = [];
  while (segs.size) {
    const [k0] = segs.keys(), loop = [k0.split(',').map(Number)]; let cur = k0;
    for (;;) { const nx = segs.get(cur); if (!nx) break; segs.delete(cur); const nk = key(...nx); if (nk === k0) break; loop.push(nx); cur = nk; }
    if (loop.length > 8) loops.push(loop);
  }
  const dp = (pts, eps) => {
    if (pts.length < 3) return pts;
    const a = pts[0], b = pts[pts.length - 1], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    let far = 0, at = 0;
    for (let i = 1; i < pts.length - 1; i++) { const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / len; if (d > far) { far = d; at = i; } }
    return far > eps ? dp(pts.slice(0, at + 1), eps).slice(0, -1).concat(dp(pts.slice(at), eps)) : [a, b];
  };
  /* a closed loop is split at its farthest point from its start, so each half has a chord to measure against */
  const closed = (l, eps) => { let m = 0, far = 0; l.forEach((p, i) => { const d = Math.hypot(p[0] - l[0][0], p[1] - l[0][1]); if (d > far) { far = d; m = i; } });
    return dp(l.slice(0, m + 1), eps).slice(0, -1).concat(dp(l.slice(m).concat([l[0]]), eps).slice(0, -1)); };
  const path = loops.map((l) => 'M' + closed(l, .9).map(([x, y]) => (x / K).toFixed(2) + ' ' + (y / K).toFixed(2)).join('L') + 'Z').join('');
  return { path, loops: loops.length, label: ['x', 'y', 'width', 'height', 'rx'].map((k) => label.getAttribute(k)), fill: label.getAttribute('fill') };
}, { N, K });
await browser.close();

const [x, y, w, h, rx] = icon.label;
const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><title>WeBuy.AD</title>'
  + '<defs><radialGradient id="g" cx="82%" cy="12%" r="78%"><stop offset="0" stop-color="#1e3c7a"/><stop offset=".55" stop-color="#0c1a38"/><stop offset="1" stop-color="#070d1c"/></radialGradient></defs>'
  + `<rect width="100" height="100" rx="22" fill="url(#g)"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${icon.fill}"/>`
  + `<path fill="#fff" fill-rule="evenodd" d="${icon.path}"/></svg>\n`;
writeFileSync(here + '../../favicon.svg', svg);
console.log(`favicon.svg: ${icon.loops} outlines, ${svg.length} bytes`);
