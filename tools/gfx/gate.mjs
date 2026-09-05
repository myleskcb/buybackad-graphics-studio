#!/usr/bin/env node
/* THE RELEASE GATE.
 *
 * Nothing ships unless this exits 0. It asks the engine for clean cards across
 * a wide sweep — renderClean() refuses rather than approximates — and then
 * loads every one in headless Chrome and judges the pixels with the same
 * pixelFaults() the console uses on the live card. Two independent opinions,
 * both required. The owner's instruction is 100% confidence, no less; a gate
 * that samples, retries silently, or rounds "one fault" down to "fine" is not
 * that.
 *
 *   node tools/gfx/gate.mjs [seeds=6]      exit 1 on any refusal or pixel fault
 */
import * as E from '../../engine/engine.mjs';
import puppeteer from 'puppeteer-core';

const SEEDS = +(process.argv[2] || 6);
const BASE = process.env.ASSET_BASE || 'http://localhost:8899/';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'], protocolTimeout: 0 });
const page = await browser.newPage();
await page.goto(BASE);
await page.setContent(`<style>${E.fontCSS().replace(/\.\.\/assets/g, BASE + 'assets')}</style><div id=h></div>`);
await page.evaluate(() => document.fonts.ready);

let asked = 0, refused = [], faults = [], reseeded = 0, dropped = 0;
for (let s = 0; s < SEEDS; s++) {
  const seed = (s * 104729 + 13) % 999983;
  for (const [arch] of E.ARCHS) for (const vert of Object.keys(E.CONTENT)) for (const fmt of Object.keys(E.SIZES)) {
    asked++;
    const r = E.renderClean(arch, seed, vert, fmt, { ...E.DEFAULT_CFG(), embedFonts: false, assetBase: BASE });
    const tag = `${arch} ${vert} ${fmt} #${seed}`;
    if (!r) { refused.push(tag); continue; }
    if (r.gate.tries > 1) reseeded++;
    if (r.gate.dropped.length) dropped++;
    const boxes = await page.evaluate(async svg => {
      const h = document.getElementById('h'); h.innerHTML = svg;
      const el = h.querySelector('svg');
      await document.fonts.ready;
      await Promise.all([...el.querySelectorAll('image')].map(i => new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 1500); })));
      const vb = el.getAttribute('viewBox').split(/\s+/).map(Number);
      const host = el.getBoundingClientRect(), sx = vb[2] / host.width, sy = vb[3] / host.height;
      return { W: vb[2], H: vb[3], out: [...el.querySelectorAll('text')].map(t => { const b = t.getBoundingClientRect();
        return { s: (t.textContent || '').slice(0, 26), x: (b.left - host.left) * sx, y: (b.top - host.top) * sy,
                 w: b.width * sx, h: b.height * sy, op: +(getComputedStyle(t).opacity || 1) }; }) };
    }, r.svg);
    const f = E.pixelFaults(boxes.out, boxes.W, boxes.H);
    if (f.length) faults.push(`${tag}: ${f[0]}`);
  }
}
await browser.close();

console.log(`gate: ${asked} asked · ${asked - refused.length - faults.length} clean · ${reseeded} reseeded · ${dropped} dropped an ornament`);
if (refused.length) { console.log(`\nREFUSED ${refused.length}`); refused.slice(0, 10).forEach(x => console.log('  ' + x)); }
if (faults.length) { console.log(`\nPIXEL FAULTS ${faults.length}`); faults.slice(0, 10).forEach(x => console.log('  ' + x)); }
process.exit(refused.length || faults.length ? 1 : 0);
