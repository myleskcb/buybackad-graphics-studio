#!/usr/bin/env node
/* Contact sheet of named ids: IDS=a,b,c SRC=.render/assets/thumbs OUT=.render/x.jpg [COLS=4 T=300] */
import { writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
const ids = process.env.IDS.split(','), SRC = process.env.SRC || '.render/assets/thumbs', OUT = process.env.OUT;
const EXT = process.env.EXT || 'webp'; const list = ids.map(i => SRC + '/' + i + '.' + EXT);
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox'], protocolTimeout: 0 });
const page = await browser.newPage();
await page.goto('http://localhost:8899/', { waitUntil: 'domcontentloaded' });
const png = await page.evaluate(async (list, COLS, T) => {
  const rows = Math.ceil(list.length / COLS), H = Math.round(T * 0.8);
  const c = document.createElement('canvas'); c.width = COLS * T; c.height = rows * (H + 24);
  const g = c.getContext('2d'); g.fillStyle = '#cfd3d8'; g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < list.length; i++){
    const img = await new Promise(res => { const el = new Image(); el.onload = () => res(el); el.onerror = () => res(null); el.src = list[i]; });
    const x = (i % COLS) * T, y = Math.floor(i / COLS) * (H + 24);
    g.fillStyle = (i % 2) ? '#c4c9cf' : '#d6dae0'; g.fillRect(x, y, T, H);
    if (img){ const k = Math.min((T - 12) / img.width, (H - 12) / img.height), w = img.width * k, h = img.height * k;
      g.drawImage(img, x + (T - w) / 2, y + (H - h) / 2, w, h); }
    g.fillStyle = '#111'; g.font = 'bold 13px monospace'; g.fillText((i + 1) + ' ' + list[i].split('/').pop().replace(/\.(webp|png)$/, ''), x + 4, y + H + 16);
  }
  return c.toDataURL('image/jpeg', 0.85);
}, list, +(process.env.COLS || 4), +(process.env.T || 300));
writeFileSync(OUT, Buffer.from(png.split(',')[1], 'base64'));
console.log(OUT, list.length);
await browser.close();
