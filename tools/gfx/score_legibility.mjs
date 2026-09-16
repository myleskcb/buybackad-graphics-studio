#!/usr/bin/env node
/* WHICH FACES CAN CARRY A HEADLINE, MEASURED.
 *
 * The owner: "some of the typefaces are hard to read." With sixty families now
 * on disk — including a graffiti role and a blackletter — that stops being a
 * matter of taste. Four things decide whether type survives a feed thumbnail,
 * and all four can be measured off the rendered pixels:
 *
 *   stem      the thinnest stroke, as a share of cap height. A high-contrast
 *             face has a hairline that vanishes first at small sizes and first
 *             over a photograph.
 *   mush      at 13px, the share of pixels that are neither ink nor ground.
 *             A face that turns to grey porridge in a thumbnail is unreadable
 *             however handsome it is at 200px.
 *   density   ink as a share of the glyph box at 100px. Very high means the
 *             counters have closed up — the holes in a, e, o are what a reader
 *             actually recognises.
 *   evenness  the spread of A-Z advance widths. A face whose caps are wildly
 *             uneven looks broken when set large in all caps, which is exactly
 *             how this engine sets its headlines.
 *
 *   node tools/gfx/score_legibility.mjs [--json]
 */
import { FONT_FILES, faceCSS } from '../../engine/fonts.mjs';
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync } from 'node:fs';

const ROOT = new URL('../../', import.meta.url).pathname;
const ROLES = Object.fromEntries(JSON.parse(readFileSync(ROOT + 'assets/approved-fonts.json', 'utf8'))
  .faces.map(f => [f.name, f.role]));

const used = Object.fromEntries(Object.entries(FONT_FILES).map(([f, w]) => [f, Object.keys(w).map(Number)]));
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new', args: ['--no-sandbox'], protocolTimeout: 0 });
const page = await browser.newPage();
await page.setContent(`<style>${faceCSS(used)}</style>`);
await page.evaluate(() => document.fonts.ready);

const scores = await page.evaluate(async (families) => {
  const cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
  const out = [];
  const ink = (w, h) => { const d = cx.getImageData(0, 0, w, h).data; const a = []; for (let i = 3; i < d.length; i += 4) a.push(d[i]); return a; };

  for (const [family, weights] of Object.entries(families)) {
    for (const w of weights) {
      await document.fonts.load(`${w} 100px "${family}"`);

      /* stem: thinnest stroke in an H, as a share of cap height */
      cv.width = 300; cv.height = 300; cx.clearRect(0, 0, 300, 300);
      cx.fillStyle = '#000'; cx.font = `${w} 200px "${family}"`; cx.textBaseline = 'alphabetic';
      cx.fillText('H', 20, 240);
      const m = cx.measureText('H'); const cap = m.actualBoundingBoxAscent || 140;
      let a = ink(300, 300);
      const runsAt = row => { const r = []; let n = 0;
        for (let x = 0; x < 300; x++) { const on = a[row * 300 + x] > 128; if (on) n++; else { if (n) r.push(n); n = 0; } }
        if (n) r.push(n); return r; };
      const mid = runsAt(240 - Math.round(cap * 0.5));      // through the stems
      const bar = runsAt(240 - Math.round(cap * 0.48));
      const stems = mid.filter(v => v > 1);
      const stem = stems.length ? Math.min(...stems) / cap : 0;
      const thick = stems.length ? Math.max(...stems) / cap : 0;

      /* density and counters: ink share of an "e" box at 100px */
      cv.width = 200; cv.height = 200; cx.clearRect(0, 0, 200, 200);
      cx.fillStyle = '#000'; cx.font = `${w} 140px "${family}"`;
      cx.fillText('e', 20, 160);
      const em = cx.measureText('e');
      const bw = Math.max(1, Math.round(em.width)), bh = Math.max(1, Math.round((em.actualBoundingBoxAscent || 100) + (em.actualBoundingBoxDescent || 0)));
      a = ink(200, 200);
      let on = 0, tot = 0;
      for (let y = 160 - bh; y < 160; y++) for (let x = 20; x < 20 + bw; x++) { if (y < 0 || y > 199) continue; tot++; if (a[y * 200 + x] > 128) on++; }
      const density = tot ? on / tot : 0;

      /* mush: at 13px, the share of partly-covered pixels in the run */
      cv.width = 400; cv.height = 60; cx.clearRect(0, 0, 400, 60);
      cx.fillStyle = '#000'; cx.font = `${w} 13px "${family}"`;
      cx.fillText('iPhone 17 Pro Max $1,250', 4, 30);
      a = ink(400, 60);
      let solid = 0, part = 0;
      for (const v of a) { if (v > 200) solid++; else if (v > 25) part++; }
      const mush = (solid + part) ? part / (solid + part) : 1;

      /* figures: does the zero carry a slash or dot, and is the one bare?
         Melodrama draws "$1,250" as "$1,25Ø" — found the hard way on a shipped
         card — so this is measured now rather than kept as a hand-written list. */
      const glyphInk = (ch, size) => { cv.width = 200; cv.height = 200; cx.clearRect(0, 0, 200, 200);
        cx.fillStyle = '#000'; cx.font = `${w} ${size}px "${family}"`; cx.fillText(ch, 20, 160);
        return { a: ink(200, 200), m: cx.measureText(ch) }; };
      const z = glyphInk('0', 140), O = glyphInk('O', 140);
      const centreInk = g => { const bw = Math.max(1, Math.round(g.m.width)), asc = Math.round(g.m.actualBoundingBoxAscent || 100);
        let on = 0, tot = 0;
        for (let y = 160 - Math.round(asc * .65); y < 160 - Math.round(asc * .35); y++)
          for (let x = 20 + Math.round(bw * .35); x < 20 + Math.round(bw * .65); x++) { tot++; if (g.a[y * 200 + x] > 128) on++; }
        return tot ? on / tot : 0; };
      const zeroSlash = +(centreInk(z) - centreInk(O)).toFixed(3);   // >0 means the zero has ink its O does not
      const one = glyphInk('1', 140), I = glyphInk('I', 140);
      const oneLikeI = Math.abs(one.m.width - I.m.width) / Math.max(1, one.m.width) < 0.06;

      /* evenness: spread of A-Z advances */
      cx.font = `${w} 100px "${family}"`;
      const adv = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(c => cx.measureText(c).width);
      const mean = adv.reduce((p, q) => p + q, 0) / adv.length;
      const sd = Math.sqrt(adv.reduce((p, q) => p + (q - mean) ** 2, 0) / adv.length);
      const evenness = mean ? 1 - sd / mean : 0;

      out.push({ family, weight: w, stem: +stem.toFixed(4), thick: +thick.toFixed(4),
        contrast: thick ? +(stem / thick).toFixed(3) : 0,
        density: +density.toFixed(3), mush: +mush.toFixed(3), evenness: +evenness.toFixed(3),
        zeroSlash, oneLikeI });
    }
  }
  return out;
}, used);

await browser.close();

/* TWO SEPARATE QUESTIONS, because they have different answers.
   A HEADLINE is set at 40-200px, in caps, often straight onto a photograph:
   what kills it is a hairline that disappears against the picture, or caps so
   uneven the word looks broken. Whether it survives at 13px is irrelevant —
   nothing sets a headline at 13px.
   BODY is the pills, the steps, the footer, the ladder: 13-30px, where a light
   weight turns to porridge and closed counters stop a letter being a letter.
   Scoring both against one threshold failed Satoshi 400 and Sora 400 for
   "dissolving at 13px", which is simply what a 400 weight is. */
function judge(s) {
  const head = [], body = [];
  if (s.stem < 0.055) { head.push('hairline strokes vanish over a photograph'); body.push('hairline'); }
  if (s.evenness < 0.72) head.push('caps too uneven to set large');
  if (s.mush > 0.66) body.push('turns to porridge at 13px');
  if (s.density > 0.62) body.push('counters closed');
  const figures = s.zeroSlash > 0.06 ? 'slashed zero' : s.oneLikeI ? 'one reads as an I' : '';
  return { headline: !head.length, headWhy: head.join(', '),
           body: !body.length, bodyWhy: body.join(', '), figures };
}

const rows = scores.map(s => ({ ...s, role: ROLES[s.family] || 'unapproved', ...judge(s) }));
const by = {};
rows.forEach(r => (by[r.headline ? (r.body ? 'both' : 'headline only') : (r.body ? 'body only' : 'neither')] ||= []).push(r));

console.log(`${rows.length} faces measured\n`);
for (const rank of ['both', 'headline only', 'body only', 'neither']) {
  const list = (by[rank] || []).sort((a, b) => a.family.localeCompare(b.family));
  if (!list.length) continue;
  console.log(`\n── ${rank.toUpperCase()} (${list.length}) ${'─'.repeat(40)}`);
  console.log('face                          w   role         stem  dens  mush  even  figures / why');
  for (const r of list) {
    const why = rank === 'both' ? (r.figures || '') : [r.headWhy, r.bodyWhy].filter(Boolean).join(' | ') + (r.figures ? ' · ' + r.figures : '');
    console.log(`${r.family.slice(0, 28).padEnd(29)}${String(r.weight).padEnd(5)}${r.role.padEnd(13)}` +
      `${r.stem.toFixed(2).padStart(5)}${r.density.toFixed(2).padStart(6)}${r.mush.toFixed(2).padStart(6)}${r.evenness.toFixed(2).padStart(6)}  ${why}`);
  }
}
const headOK = rows.filter(r => r.headline).length, bodyOK = rows.filter(r => r.body).length;
const figBad = rows.filter(r => r.figures).length;
console.log(`\nheadline-capable ${headOK} · body-capable ${bodyOK} · unfit for figures ${figBad}`);
writeFileSync(ROOT + 'spec/legibility.json', JSON.stringify(rows));
console.log('spec/legibility.json written');
