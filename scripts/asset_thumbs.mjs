#!/usr/bin/env node
/* 256px webp thumbnails (alpha kept) of every current-hardware cutout, plus a
   manifest with a category per file, for the 8x8 asset picker. */
import puppeteer from 'puppeteer-core';
import { readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = ROOT + '.render/assets/thumbs/';
mkdirSync(OUT, { recursive: true });
const LEGACY = /^(qs-)?iphone-(x|xr|xs|se|[5-9]|1[0-2])\b|^ip-gen1[0-4]\b|^qs-iphone-(x|1[012])/i;
const CAT = [
  [/^(qs-)?iphone|^ip-|^own-apple|^apple-iphone/i, 'iphone'], [/ipad/i, 'ipad'], [/watch/i, 'watch'], [/mac/i, 'macbook'],
  [/^sam-|samsung|galaxy/i, 'samsung'], [/^pix-|pixel/i, 'pixel'],
  [/^gold/i, 'gold'], [/^silver/i, 'silver'], [/^coin/i, 'coins'], [/^car-/i, 'cars'], [/^strip/i, 'strips'],
  [/^poke/i, 'pokemon'], [/^sports/i, 'sports'], [/^cash|money|bill/i, 'cash'], [/^qs-|^own-/i, 'apple-misc'],
];
const DIRS = [['assets/cutouts/', 'library'], ['assets/cutouts-gen/', 'fal']];
const files = DIRS.flatMap(([d, src]) => existsSync(ROOT + d)
  ? readdirSync(ROOT + d).filter(f => /\.(webp|png)$/i.test(f) && !LEGACY.test(f)).map(f => ({ id: f.replace(/\.(webp|png)$/i, ''), path: d + f, src }))
  : []);
const cat = id => (CAT.find(([re]) => re.test(id)) || [null, 'misc'])[1];
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'], protocolTimeout: 0 });
const page = await browser.newPage();
await page.goto('http://localhost:8899/', { waitUntil: 'domcontentloaded', timeout: 60000 });
const rows = await page.evaluate(async files => {
  const out = [];
  for (const f of files){
    const img = await new Promise(res => { const el = new Image(); el.onload = () => res(el); el.onerror = () => res(null); el.src = f.path; });
    if (!img){ out.push({ ...f, err: 'load' }); continue; }
    const S = 256, c = document.createElement('canvas'); c.width = S; c.height = S;
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
    const k = Math.min((S - 16) / img.width, (S - 16) / img.height), w = img.width * k, h = img.height * k;
    g.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
    out.push({ ...f, w: img.width, h: img.height, png: c.toDataURL('image/webp', 0.8) });
  }
  return out;
}, files);
await browser.close();
const ok = rows.filter(r => !r.err);
ok.forEach(r => writeFileSync(OUT + r.id + '.webp', Buffer.from(r.png.split(',')[1], 'base64')));
const man = ok.map(({ png, ...r }) => ({ ...r, cat: cat(r.id) }));
writeFileSync(ROOT + '.render/assets/manifest.json', JSON.stringify(man, null, 1));
const byCat = {}; man.forEach(r => byCat[r.cat] = (byCat[r.cat] || 0) + 1);
console.log(`thumbs: ${ok.length}/${files.length} (${rows.filter(r => r.err).length} failed)`);
console.log(Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(' · '));
