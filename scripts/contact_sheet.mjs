#!/usr/bin/env node
/* One contact sheet per category of the fetched web photos, for vetting. */
import puppeteer from 'puppeteer-core';
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname, OUT = ROOT + '.render/bgweb/';
mkdirSync(OUT, { recursive: true });
const SHEET_FILTER = process.env.SHEET_FILTER ? new RegExp(process.env.SHEET_FILTER) : null;
const SRC = process.env.SHEET_DIR || 'assets/bg-web';
const files = readdirSync(ROOT + SRC).filter(f => /\.(jpe?g|webp)$/i.test(f) && (!SHEET_FILTER || SHEET_FILTER.test(f)));
const cats = {}; files.forEach(f => (cats[f.split('-')[0]] ||= []).push(SRC + '/' + f));
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox'], protocolTimeout: 0 });
const page = await browser.newPage();
await page.goto('http://localhost:8899/', { waitUntil: 'domcontentloaded' });
for (const [cat, list] of Object.entries(cats)){
  const png = await page.evaluate(async list => {
    const T = 300, COLS = 4, rows = Math.ceil(list.length / COLS);
    const c = document.createElement('canvas'); c.width = COLS * T; c.height = rows * (T + 22);
    const g = c.getContext('2d'); g.fillStyle = '#111'; g.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < list.length; i++){
      const img = await new Promise(res => { const el = new Image(); el.onload = () => res(el); el.onerror = () => res(null); el.src = list[i]; });
      const x = (i % COLS) * T, y = Math.floor(i / COLS) * (T + 22);
      if (img){ const k = Math.max(T / img.width, (T * 0.66) / img.height), w = img.width * k, h = img.height * k;
        g.save(); g.beginPath(); g.rect(x, y, T, T * 0.66); g.clip(); g.drawImage(img, x + (T - w) / 2, y + (T * 0.66 - h) / 2, w, h); g.restore(); }
      g.fillStyle = '#ddd'; g.font = '12px monospace'; g.fillText((i + 1) + ' ' + list[i].split('/').pop().replace('.jpg', ''), x + 4, y + T * 0.66 + 15);
    }
    return c.toDataURL('image/jpeg', 0.8);
  }, list);
  writeFileSync(OUT + cat + '.jpg', Buffer.from(png.split(',')[1], 'base64'));
  console.log(cat, list.length);
}
await browser.close();
