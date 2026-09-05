#!/usr/bin/env node
/* Screenshot cards through the SAME browser the audit measures with, so what
   I look at is exactly what getBBox() reported on.
   node tools/gfx/shot.mjs <outDir> <arch> <seed> [vertical] [format] */
import * as E from '../../engine/engine.mjs';
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = process.argv[2] || '.shot';
const ARCH = process.argv[3] || 'proofWall';
const SEEDS = (process.argv[4] || '4242').split(',').map(Number);
const V = process.argv[5] || 'phones';
/* photographs are referenced by URL; headless setContent has no document base,
   so hand the engine an absolute one */
/* Photographs are referenced by URL. A setContent page has no usable origin,
   so Chrome refuses file:// subresources and every card renders a broken-image
   glyph — which is exactly what the first photographic contact sheet showed.
   The repo already serves itself on 8899 for the lab renders; use that. */
const BASE = process.env.ASSET_BASE || 'http://localhost:8899/';
const F = process.argv[6] || '45';
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new', args: ['--no-sandbox'], protocolTimeout: 0 });
const page = await browser.newPage();
await page.goto(BASE);   // give the document an origin the images can load from
await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });

for (const seed of SEEDS) {
  const r = E.render(ARCH, seed, V, F, { ...E.DEFAULT_CFG(), assetBase: BASE });
  const stem = `${ARCH}-${seed}`;
  writeFileSync(`${OUT}/${stem}.svg`, r.svg);
  await page.setContent(`<style>html,body{margin:0}svg{display:block;width:100vw;height:auto}</style>${r.svg}`);
  await page.evaluate(async () => {
  await document.fonts.ready;
  /* screenshot only once the photographs have actually decoded, or the sheet
     records a page of broken-image glyphs and calls it a render */
  await Promise.all([...document.images].map(i => i.complete
    ? null : new Promise(r => { i.onload = i.onerror = r; })));
});
  const el = await page.$('svg');
  await el.screenshot({ path: `${OUT}/${stem}.png` });
  console.log(`${OUT}/${stem}.png  cov ${(r.audit.coverage*100).toFixed(0)}%  rules ${r.audit.pass}/${r.audit.total}`);
}
await browser.close();
