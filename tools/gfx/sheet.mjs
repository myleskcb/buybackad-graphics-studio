#!/usr/bin/env node
/* Contact sheet: every archetype across seeds, rendered in the browser and
   tiled, so a whole set can be judged at a glance.
   node tools/gfx/sheet.mjs <out.png> <vertical> <format> [seeds] */
import * as E from '../../engine/engine.mjs';
import puppeteer from 'puppeteer-core';

const OUT = process.argv[2] || '.shot/sheet.png';
const V = process.argv[3] || 'phones';
const F = process.argv[4] || '45';
const N = +(process.argv[5] || 3);
/* Photographs are referenced by URL. A setContent page has no usable origin,
   so Chrome refuses file:// subresources and every card renders a broken-image
   glyph — which is exactly what the first photographic contact sheet showed.
   The repo already serves itself on 8899 for the lab renders; use that. */
const BASE = process.env.ASSET_BASE || 'http://localhost:8899/';

const cards = [];
for (let s = 0; s < N; s++)
  for (const [k, name] of E.ARCHS) {
    /* the faces go in the page once, not into all 24 cards */
    const r = E.render(k, 4242 + s * 977, V, F, { ...E.DEFAULT_CFG(), embedFonts: false, assetBase: BASE });
    cards.push({ svg: r.svg, cap: `${name} · ${r.palette.name} · ${r.pair.display} · ${(r.audit.coverage*100).toFixed(0)}% · ${r.audit.pass}/${r.audit.total}` });
  }

const cols = 4;
const html = `<style>${E.fontCSS()}
 body{margin:0;background:#111;font:11px system-ui;color:#bbb}
 .g{display:grid;grid-template-columns:repeat(${cols},1fr);gap:10px;padding:10px}
 .c svg{width:100%;height:auto;display:block}
 .c p{margin:3px 1px 0}</style>
 <div class=g>${cards.map(c => `<div class=c>${c.svg}<p>${c.cap}</p></div>`).join('')}</div>`;

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new', args: ['--no-sandbox'], protocolTimeout: 0 });
const page = await browser.newPage();
await page.goto(BASE);   // give the document an origin the images can load from
await page.setViewport({ width: 1500, height: 1000 });
await page.setContent(html);
await page.evaluate(async () => {
  await document.fonts.ready;
  /* screenshot only once the photographs have actually decoded, or the sheet
     records a page of broken-image glyphs and calls it a render */
  await Promise.all([...document.images].map(i => i.complete
    ? null : new Promise(r => { i.onload = i.onerror = r; })));
});
await page.screenshot({ path: OUT, fullPage: true });
await browser.close();
console.log(`${OUT}  ${cards.length} cards`);
