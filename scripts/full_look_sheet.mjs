#!/usr/bin/env node
/* A CONTACT SHEET OF SEEDED FULL ADS, AND HOW FAR APART THEY ARE (OPEN-ITEMS §BJ; the owner,
   2026-11-18: "a lot of these are the same thing with 5% variety or difference").

   Draws N full ads exactly as Easy Mode's full ad draws a seed nobody styled (FullAdStudio.build:
   the line's own words, no pair, face or ground picked), over several lines and the four sizes
   mixed, into one sheet, and measures the spread across it: the ground's kind, its lightness and
   hue as drawn, the pair, the face, the sticker and the plates. "Near twins" are pairs of ads whose
   pictures, shrunk to 12 by 12 and compared in OKLab, are closer than a viewer can tell apart at a
   glance (mean ΔE under .055): the measure of "the same thing with 5% difference".

   usage:  GFX_BASE=http://127.0.0.1:8941/ node scripts/full_look_sheet.mjs [--n 48] [--tag after] [--px 420]
   writes  .render/full-look-sheet-<tag>.jpg and .render/full-look-sheet-<tag>.json */
import { writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const ROOT = new URL('../', import.meta.url).pathname, OUT = ROOT + '.render/';
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8931/').replace(/\/?$/, '/');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const N = +arg('--n', 48), TAG = arg('--tag', 'now'), PX = +arg('--px', 420);
// lines from every corner of the library (keys that exist before and after the regrouping)
const LINES = (arg('--lines', 'iphone,gold,car,ipad,headphones,pixel,console,coins,trucks,mac,sports,galaxy,camera,silver,toyota,earbuds')).split(',');
const SIZES = ['square', 'three4', 'story', 'landscape'];

mkdirSync(OUT, { recursive: true });
const require = createRequire(import.meta.url), { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch(), page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('pageerror', e => console.error('page error:', e.message));
await page.goto(BASE + '?demo=1', { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => typeof renderEzCanvas === 'function' && typeof TEMPLATES !== 'undefined' && window.FullAdStudio, null, { timeout: 120000 });
await page.evaluate(async () => {
  account = { email: 'sheet@local', role: 'admin', plan: 'pro' }; loadAccount = async () => account; recordExport = async () => true;
  const a = await resolveArea('90802'); if (a) setArea(a);
  try { jset('pgfx_area_asked', true); } catch (e) { }
  $('ez-phone').value = '(562) 999-4994'; $('ez-website').value = '';
});

const jobs = Array.from({ length: N }, (_, i) => ({ line: LINES[i % LINES.length], seed: 1 + Math.floor(i / LINES.length) * 7 + (i % 5), size: SIZES[(i + Math.floor(i / LINES.length)) % SIZES.length] }));
const cells = [];
for (const job of jobs) {
  const got = await page.evaluate(async ({ job, PX }) => {
    const M = await import('/motion/fullad.js'), FS = window.FullAdStudio, FA = FS.state;
    const S = FS.lines().find(s => s.key === job.line); if (!S) return { error: 'no line ' + job.line };
    if (currentCat !== S.cat) setCategory(S.cat);
    FA.line[S.cat] = S.key; FA.recipe[S.cat] = ''; FA.seed = job.seed; FA.pair = ''; FA.voice = ''; FA.words = {}; FA.set = {}; FA.biz = '';
    const { ad, st } = await FS.build(PX, FORMATS[job.size]);
    const frame = M.fullStill(ad), k = Math.min(1, 300 / Math.max(frame.width, frame.height));
    const c = document.createElement('canvas'); c.width = Math.round(frame.width * k); c.height = Math.round(frame.height * k);
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(frame, 0, 0, c.width, c.height);
    // OKLab of a picture, shrunk: the ground (ad.bg, before anything stands on it) and the whole ad
    const lab = (src, n) => {
      const t = document.createElement('canvas'); t.width = t.height = n; const x = t.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(src, 0, 0, n, n);
      const d = x.getImageData(0, 0, n, n).data, out = [];
      const lin = v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
      for (let q = 0; q < d.length; q += 4) {
        const r = lin(d[q]), gg = lin(d[q + 1]), b = lin(d[q + 2]);
        const l = Math.cbrt(.4122214708 * r + .5363325363 * gg + .0514459929 * b), m = Math.cbrt(.2119034982 * r + .6806995451 * gg + .1073969566 * b), s = Math.cbrt(.0883024619 * r + .2817188376 * gg + .6299787005 * b);
        out.push([.2104542553 * l + .793617785 * m - .0040720468 * s, 1.9779984951 * l - 2.428592205 * m + .4505937099 * s, .0259040371 * l + .7827717662 * m - .808675766 * s]);
      }
      return out;
    };
    const G = lab(ad.bg, 24), mean = [0, 1, 2].map(j => G.reduce((t, v) => t + v[j], 0) / G.length);
    const C = Math.hypot(mean[1], mean[2]), hue = (Math.atan2(mean[2], mean[1]) * 180 / Math.PI + 360) % 360;
    return {
      ...job, pair: st.full_colour || '', ground: st.background === 'photo' ? 'photo' : st.background, photo: st.background === 'photo' && st.ground_photo ? st.ground_photo.src.split('/').pop() : '',
      face: st.full_pair ? st.type_pair : 'house:' + st.font, sticker: st.sticker_shape || '', sticker_fill: st.sticker_fill || (st.sticker_grad ? 'gradient' : ''), plate: st.number_style || '', plate_fill: st.plate_fill || (st.plate_grad ? 'gradient' : ''),
      text_fx: st.text_fx || '', groundL: +mean[0].toFixed(3), groundC: +C.toFixed(3), groundHue: Math.round(hue), thumb: lab(frame, 12), jpg: c.toDataURL('image/jpeg', .86), w: c.width, h: c.height,
    };
  }, { job, PX });
  if (got.error) { console.log(`  ${job.line} seed ${job.seed}: ${got.error}`); continue; }
  cells.push(got);
  process.stdout.write('.');
}
console.log('');

// the sheet: 8 across, each ad fitted into 300 x 300 with its caption under it
const COLS = 8, CW = 300, CH = 340, rows = Math.ceil(cells.length / COLS);
const sheet = await page.evaluate(async ({ cells, COLS, CW, CH, rows, TAG }) => {
  const c = document.createElement('canvas'); c.width = COLS * CW; c.height = rows * CH + 40;
  const g = c.getContext('2d'); g.fillStyle = '#e9e9ec'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#111'; g.font = 'bold 22px sans-serif'; g.fillText(`Seeded full ads, ${TAG}: ${cells.length} (line · seed · size · pair · ground · face)`, 12, 28);
  for (let i = 0; i < cells.length; i++) {
    const e = cells[i], img = await new Promise(res => { const im = new Image(); im.onload = () => res(im); im.src = e.jpg; });
    const x = (i % COLS) * CW, y = 40 + Math.floor(i / COLS) * CH;
    g.drawImage(img, x + (CW - e.w) / 2, y + 6 + (300 - e.h) / 2);
    g.fillStyle = '#222'; g.font = '12px sans-serif';
    g.fillText(`${e.line} · ${e.seed} · ${e.size} · ${e.pair}`.slice(0, 46), x + 6, y + 318);
    g.fillText(`${e.ground}${e.photo ? ' ' + e.photo.slice(0, 18) : ''} · ${e.face}`.slice(0, 46), x + 6, y + 333);
  }
  return c.toDataURL('image/jpeg', .84);
}, { cells, COLS, CW, CH, rows, TAG });
await browser.close();

// the spread
const count = k => { const m = {}; for (const e of cells) m[e[k]] = (m[e[k]] || 0) + 1; return m; };
const look = e => e.groundL < .45 ? 'dark' : e.groundL > .78 ? 'light' : e.groundC >= .08 ? 'vivid' : 'mid grey';
const de = (a, b) => a.reduce((t, v, i) => t + Math.hypot(v[0] - b[i][0], v[1] - b[i][1], v[2] - b[i][2]), 0) / a.length;
let twins = 0, pairs = 0, sum = 0; const close = [];
for (let i = 0; i < cells.length; i++) for (let j = i + 1; j < cells.length; j++) { const d = de(cells[i].thumb, cells[j].thumb); pairs++; sum += d; if (d < .055) { twins++; if (close.length < 12) close.push([i + 1, j + 1, +d.toFixed(3)]); } }
const hues = cells.filter(e => e.groundC >= .04).map(e => Math.round(e.groundHue / 30) * 30 % 360);
// "the same thing with 5% difference": two ads with the same look (light, vivid, dark or grey), the same kind of
// ground (photo, scene, gradient, pattern, house) and the same face read as one template at a glance
const kindOf = g => g === 'photo' ? 'photo' : /^pair_/.test(g) ? 'gradient' : /^pat_/.test(g) ? 'pattern' : ['radial', 'tonal', 'linear'].includes(g) ? 'house' : 'scene';
let sameLook = 0; for (let i = 0; i < cells.length; i++) for (let j = i + 1; j < cells.length; j++) { const a = cells[i], b = cells[j]; if (look(a) === look(b) && kindOf(a.ground) === kindOf(b.ground) && a.face === b.face) sameLook++; }
const summary = {
  tag: TAG, ads: cells.length, distinct: { pairs: Object.keys(count('pair')).length, grounds: Object.keys(count('ground')).length, faces: Object.keys(count('face')).length, stickers: Object.keys(count('sticker')).length, plates: Object.keys(count('plate')).length, hue_bands: new Set(hues).size },
  looks: cells.reduce((m, e) => (m[look(e)] = (m[look(e)] || 0) + 1, m), {}),
  mean_distance: +(sum / pairs).toFixed(4), near_twins: twins, twin_examples: close, same_look_pairs: sameLook, of_pairs: pairs,
  pair: count('pair'), ground: count('ground'), face: count('face'), sticker: count('sticker'), sticker_fill: count('sticker_fill'), plate: count('plate'), plate_fill: count('plate_fill'), text_fx: count('text_fx'),
};
writeFileSync(OUT + `full-look-sheet-${TAG}.jpg`, Buffer.from(sheet.split(',')[1], 'base64'));
writeFileSync(OUT + `full-look-sheet-${TAG}.json`, JSON.stringify({ summary, cells: cells.map(({ thumb, jpg, ...e }) => e) }, null, 1));
console.log(JSON.stringify(summary.distinct), JSON.stringify(summary.looks), 'mean distance', summary.mean_distance, 'near twins', twins, 'same look (look, ground kind, face)', sameLook, 'of', pairs, 'pairs of ads');
console.log('wrote .render/full-look-sheet-' + TAG + '.jpg');
