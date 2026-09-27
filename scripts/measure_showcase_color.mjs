/* Colour of every showcase thumbnail, measured off the pixels: chroma (mean
 * HSV saturation), luminance and dominant hue, written onto index.json. The
 * landing filters chroma < 0.05 and the hero wall buckets by hue. Moved into
 * scripts/ from .render/export7/chroma.mjs on 2026-09-22 so it is re-runnable. */
import puppeteer from 'puppeteer-core';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
const DIR = new URL('../assets/showcase/', import.meta.url).pathname;
const idx = JSON.parse(readFileSync(DIR + 'index.json', 'utf8'));
const b = await puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:'new', args:['--no-sandbox'] });
const p = await b.newPage(); await p.goto('about:blank');
const rows = idx.map(c => ({ id: c.id, b64: readFileSync(DIR + c.id + '.webp').toString('base64') }));
const out = {};
for (let i = 0; i < rows.length; i += 30){
  const r = await p.evaluate(async batch => {
    const res = {};
    for (const { id, b64 } of batch){
      const img = await new Promise(r => { const el = new Image(); el.onload = () => r(el); el.src = 'data:image/webp;base64,' + b64; });
      const c = document.createElement('canvas'); c.width = c.height = 96; const g = c.getContext('2d'); g.drawImage(img, 0, 0, 96, 96);
      const d = g.getImageData(0, 0, 96, 96).data; let sat = 0, lum = 0, n = 0, hx = 0, hy = 0;
      for (let k = 0; k < d.length; k += 4){ const r2 = d[k], g2 = d[k+1], b2 = d[k+2], mx = Math.max(r2,g2,b2), mn = Math.min(r2,g2,b2); const sv = mx ? (mx - mn) / mx : 0; sat += sv; lum += (0.2126*r2 + 0.7152*g2 + 0.0722*b2) / 255; n++;
        if (sv > 0.25 && mx > 40){ const dd = mx - mn; let h = mx === r2 ? ((g2 - b2) / dd) % 6 : mx === g2 ? (b2 - r2) / dd + 2 : (r2 - g2) / dd + 4; h *= 60; if (h < 0) h += 360; const w = sv; hx += Math.cos(h * Math.PI / 180) * w; hy += Math.sin(h * Math.PI / 180) * w; } }
      const hue = Math.round((Math.atan2(hy, hx) * 180 / Math.PI + 360) % 360); res[id] = { chroma: +(sat / n).toFixed(3), lum: +(lum / n).toFixed(3), hue };
    }
    return res;
  }, rows.slice(i, i + 30));
  Object.assign(out, r);
}
await b.close();
idx.forEach(c => Object.assign(c, out[c.id] || {}));
writeFileSync(DIR + 'index.json', JSON.stringify(idx));
const s = idx.slice().sort((a, b) => b.chroma - a.chroma);
console.log('most vivid:', s.slice(0, 8).map(c => c.id + ' ' + c.chroma).join(', '));
console.log('least vivid:', s.slice(-5).map(c => c.id + ' ' + c.chroma).join(', '));
console.log('phones mean chroma', (idx.filter(c => c.cat === 'phones').reduce((a, c) => a + c.chroma, 0) / idx.filter(c => c.cat === 'phones').length).toFixed(3), 'all', (idx.reduce((a, c) => a + c.chroma, 0) / idx.length).toFixed(3));
