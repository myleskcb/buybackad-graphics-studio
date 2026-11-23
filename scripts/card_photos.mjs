/* Writes cards/photos.json: the ads' own background photos (assets/bg, generated scenes with no text,
   logos or people; MANIFEST.md) by what is bought, each with its mean luminance (0 dark .. 1 light), so
   a card's style can ask for a dark photo or a bright one. Run against a local server of the repo:
     GFX_BASE=http://127.0.0.1:8899/ PLAYWRIGHT_MODULE=... node scripts/card_photos.mjs */
import { createRequire } from 'node:module';
import { readdirSync, writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url), { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8899/').replace(/\/?$/, '/');
const files = readdirSync('assets/bg').filter((f) => /^dl_[a-z]+_.+\.jpg$/.test(f)).sort();
const b = await chromium.launch(), p = await b.newPage();
await p.goto(BASE + 'cards/');
const lums = await p.evaluate(async ([base, files]) => {
  const c = document.createElement('canvas'); c.width = c.height = 24; const x = c.getContext('2d'), out = {};
  for (const f of files) {
    const im = new Image(); im.src = base + 'assets/bg/' + f; await im.decode();
    x.drawImage(im, 0, 0, 24, 24); const d = x.getImageData(0, 0, 24, 24).data; let s = 0;
    for (let i = 0; i < d.length; i += 4) s += (.2126 * d[i] + .7152 * d[i + 1] + .0722 * d[i + 2]) / 255;
    out[f] = Math.round(s / (d.length / 4) * 100) / 100;
  }
  return out;
}, [BASE, files]);
await b.close();
const by = {};
for (const f of files) { const cat = f.split('_')[1]; (by[cat] ||= []).push({ f: f.replace(/\.jpg$/, ''), l: lums[f] }); }
writeFileSync('cards/photos.json', JSON.stringify({ note: 'scripts/card_photos.mjs: assets/bg by what is bought, l = mean luminance', photos: by }) + '\n');
console.log(Object.entries(by).map(([k, v]) => k + ' ' + v.length + ' (' + Math.min(...v.map((x) => x.l)) + '-' + Math.max(...v.map((x) => x.l)) + ')').join(', '));
