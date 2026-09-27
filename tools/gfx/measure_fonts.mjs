#!/usr/bin/env node
/* BUILD THE METRICS TABLE.
 *
 * text() sized every run from one average-character-width constant per family
 * (dw / bw). One number cannot describe a family across four weights, caps and
 * lowercase, and figures — so runs overflowed their plates and the declared-box
 * audit never noticed. This measures the real advance width of every character
 * we can draw, in every family and weight we ship, and writes it out. With the
 * table, natural width is a sum, not a guess.
 *
 * node tools/gfx/measure_fonts.mjs  ->  spec/metrics.json
 */
import { FONT_FILES, faceCSS } from '../../engine/fonts.mjs';
import puppeteer from 'puppeteer-core';
import { writeFileSync, mkdirSync } from 'node:fs';

const CHARS = [];
for (let i = 32; i < 127; i++) CHARS.push(String.fromCharCode(i));
CHARS.push('★', '·', '“', '”', '’', '—', '–', '·', '✓', '€', '£');

const used = Object.fromEntries(Object.entries(FONT_FILES).map(([f, w]) => [f, Object.keys(w).map(Number)]));

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new', args: ['--no-sandbox'], protocolTimeout: 0 });
const page = await browser.newPage();
await page.setContent(`<style>${faceCSS(used)}</style><div id=probe></div>`);
await page.evaluate(() => document.fonts.ready);

const table = await page.evaluate(async (families, chars) => {
  const cv = document.createElement('canvas').getContext('2d');
  const out = {};
  for (const [family, weights] of Object.entries(families)) {
    for (const w of weights) {
      await document.fonts.load(`${w} 100px "${family}"`);
      cv.font = `${w} 100px "${family}", sans-serif`;
      /* advance width plus the real INK extents above and below the baseline.
         A quotation mark has no descender and a comma has almost no ascender;
         describing every glyph with one shared cap/descent pair is what made
         the collision rule fire on type that never touched. */
      const m = {}, up = {}, dn = {};
      for (const ch of chars) {
        const t = cv.measureText(ch);
        m[ch] = +(t.width / 100).toFixed(4);
        up[ch] = +((t.actualBoundingBoxAscent || 0) / 100).toFixed(4);
        dn[ch] = +((t.actualBoundingBoxDescent || 0) / 100).toFixed(4);
      }
      /* cap height and descent, for vertical fitting */
      const tm = cv.measureText('HXO');
      out[`${family}|${w}`] = {
        adv: m, up, dn,
        cap: +((tm.actualBoundingBoxAscent || 72) / 100).toFixed(4),
        desc: +((cv.measureText('gpy').actualBoundingBoxDescent || 21) / 100).toFixed(4),
        avg: +(Object.values(m).reduce((a, b) => a + b, 0) / chars.length).toFixed(4),
      };
    }
  }
  return out;
}, used, CHARS);

await browser.close();
mkdirSync('spec', { recursive: true });
writeFileSync('spec/metrics.json', JSON.stringify(table));
console.log(`spec/metrics.json  ${Object.keys(table).length} faces, ${CHARS.length} chars each`);
for (const [k, v] of Object.entries(table)) {
  const caps = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').reduce((a, c) => a + v.adv[c], 0) / 26;
  const low = 'abcdefghijklmnopqrstuvwxyz'.split('').reduce((a, c) => a + v.adv[c], 0) / 26;
  console.log(`  ${k.padEnd(22)} caps ${caps.toFixed(3)}  lower ${low.toFixed(3)}  cap-h ${v.cap.toFixed(2)}`);
}
