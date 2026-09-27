#!/usr/bin/env node
/* Photographs that carry an EXIF rotation render sideways on the canvas
   (the owner's own MacBook stack). Decode each JPEG with the orientation
   applied and write it back upright, EXIF-free. Only files whose oriented
   size differs from the raw size are rewritten. */
import puppeteer from 'puppeteer-core';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname;
const DIRS = ['assets/scenes/', 'assets/bg-web/'];
const files = DIRS.flatMap(d => readdirSync(ROOT + d).filter(f => /\.jpe?g$/i.test(f)).map(f => d + f));
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox'], protocolTimeout: 0 });
const page = await browser.newPage();
await page.goto('about:blank');
let fixed = 0;
for (const f of files){
  const b64 = readFileSync(ROOT + f).toString('base64');
  const res = await page.evaluate(async b64 => {
    const blob = await (await fetch('data:image/jpeg;base64,' + b64)).blob();
    const raw = await createImageBitmap(blob, { imageOrientation: 'none' });
    const up = await createImageBitmap(blob, { imageOrientation: 'from-image' });
    if (raw.width === up.width && raw.height === up.height) return null;
    const c = document.createElement('canvas'); c.width = up.width; c.height = up.height;
    c.getContext('2d').drawImage(up, 0, 0);
    return { w: up.width, h: up.height, data: c.toDataURL('image/jpeg', 0.92) };
  }, b64);
  if (res){ writeFileSync(ROOT + f, Buffer.from(res.data.split(',')[1], 'base64')); fixed++; console.log('  upright: ' + f + ' → ' + res.w + '×' + res.h); }
}
await browser.close();
console.log(`checked ${files.length}, rewrote ${fixed}`);
