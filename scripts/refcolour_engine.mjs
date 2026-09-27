#!/usr/bin/env node
/* Render the engine's own cards and push them through the SAME pixel
   measurement as the graded references, so "the color schemes are slightly
   bland" is a comparison of like with like instead of swatch arithmetic against
   photographs. One card per palette × per archetype, square (1:1) format to
   match the reference crops.
   usage: node scripts/refcolour_engine.mjs   (needs the repo served on :8899) */
import * as E from '../engine/engine.mjs';
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = '/Users/admin/Downloads/gfxv23/.render/refcolour';
const BASE = process.env.ASSET_BASE || 'http://localhost:8899/';
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new', args: ['--no-sandbox'], protocolTimeout: 0
});
const page = await browser.newPage();
await page.goto(BASE);
await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });

const archs = E.ARCHS.map(a => a[0]);
const made = [];
let seed = 4242;
for (const pal of E.PALETTES) {
  for (const arch of archs) {
    const cfg = { ...E.DEFAULT_CFG(), allowPlaceholder: true, assetBase: BASE, palette: pal.id };
    let r;
    try { r = E.render(arch, seed++, 'phones', '11', cfg); } catch (e) { console.error('skip', pal.id, arch, String(e).slice(0, 80)); continue; }
    const stem = `${pal.id}-${arch}`;
    await page.setContent(`<style>html,body{margin:0}svg{display:block;width:1080px;height:auto}</style>${r.svg}`);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; })));
    });
    await new Promise(r => setTimeout(r, 250));
    const el = await page.$('svg');
    await el.screenshot({ path: `${OUT}/${stem}.png` });
    made.push(stem);
  }
}
await browser.close();
console.log(`rendered ${made.length} engine cards to ${OUT}`);
