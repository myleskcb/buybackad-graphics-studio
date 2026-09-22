#!/usr/bin/env node
/* Re-render showcase thumbnails through the studio's own renderThumb() (the
 * card shown and the card that opens are one code path). Committed successor
 * of .render/export7/rethumb.mjs.   ONLY=ids.json node scripts/rethumb_showcase.mjs */
import { readFileSync, writeFileSync } from 'node:fs';
import { openStudio } from './_showcase_harness.mjs';
const DIR = new URL('../assets/showcase/', import.meta.url).pathname;
const idx = JSON.parse(readFileSync(DIR + 'index.json', 'utf8'));
const ONLY = process.env.ONLY ? new Set(JSON.parse(readFileSync(process.env.ONLY, 'utf8'))) : null;
const list = (ONLY ? idx.filter(c => ONLY.has(c.id)) : idx).map(c => c.id);
const { browser, page, errors } = await openStudio();
let n = 0;
for (let i = 0; i < list.length; i += 8){
  const out = await page.evaluate(async ids => {
    const res = [];
    for (const id of ids){
      try {
        const t = await __sc.load(id);
        const jpg = renderThumb(t, 1080);
        const img = await new Promise(r => { const el = new Image(); el.onload = () => r(el); el.onerror = () => r(null); el.src = jpg; });
        const cv = document.createElement('canvas'); cv.width = cv.height = 448;
        const g = cv.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, 448, 448);
        res.push({ id, webp:cv.toDataURL('image/webp', 0.74) });
      } catch (e){ res.push({ id, err:String(e).slice(0, 80) }); }
    }
    return res;
  }, list.slice(i, i + 8));
  out.forEach(r => { if (r.webp){ writeFileSync(DIR + r.id + '.webp', Buffer.from(r.webp.split(',')[1], 'base64')); n++; } else console.log(r.id, r.err); });
}
await browser.close();
console.log('rethumbed ' + n + '/' + list.length + ' · page errors ' + errors.length);
