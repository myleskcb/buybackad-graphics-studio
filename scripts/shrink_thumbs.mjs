#!/usr/bin/env node
/* Re-encode a rendered set's thumbnails smaller so a 500-card picker stays
   under the artifact size cap. Reads .render/retheme/*.webp, writes small/. */
import puppeteer from 'puppeteer-core';
import { readdirSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
const DIR = process.env.LAB_OUT ? new URL('../' + process.env.LAB_OUT.replace(/\/?$/, '/'), import.meta.url).pathname : new URL('../.render/retheme/', import.meta.url).pathname, OUT = DIR + 'small/';
mkdirSync(OUT, { recursive: true });
const S = +(process.env.SIZE || 448), Q = +(process.env.Q || 0.72);
const files = readdirSync(DIR).filter(f => /\.webp$/.test(f));
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox'], protocolTimeout: 0 });
const page = await browser.newPage();
await page.goto('about:blank');
let total = 0;
for (let i = 0; i < files.length; i += 25){
  const batch = files.slice(i, i + 25).map(f => ({ f, b64: readFileSync(DIR + f).toString('base64') }));
  const out = await page.evaluate(async (batch, S, Q) => {
    const res = [];
    for (const { f, b64 } of batch){
      const img = await new Promise(r => { const el = new Image(); el.onload = () => r(el); el.src = 'data:image/webp;base64,' + b64; });
      const c = document.createElement('canvas'); c.width = S; c.height = S;
      const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, S, S);
      res.push({ f, png: c.toDataURL('image/webp', Q) });
    }
    return res;
  }, batch, S, Q);
  out.forEach(({ f, png }) => { const buf = Buffer.from(png.split(',')[1], 'base64'); total += buf.length; writeFileSync(OUT + f, buf); });
}
await browser.close();
console.log(`small thumbs: ${files.length} at ${S}px q${Q} · ${(total / 1048576).toFixed(1)} MB`);
