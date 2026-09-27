#!/usr/bin/env node
/* The share card (og:image), 1200x630, built from the live showcase.
 *
 * Found 2026-09-22: index.html's og:image pointed at
 * https://buyback.ad/assets/tplbg/cash_offer.jpg — a domain with no DNS and a
 * file that is in no folder of this repo — so every link to the studio shared
 * with no picture. This draws one from real cards: the most colourful clean
 * card of each of eight categories, one palette each, on a dark ground with
 * the product line set in the showcase's own display face.
 *
 *   node scripts/build_og_image.mjs     -> assets/og/og-card.jpg  (needs :8899)
 */
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname;
const idx = JSON.parse(readFileSync(ROOT + 'assets/showcase/index.json', 'utf8'));
const live = idx.filter(c => !c.defect && c.imagery === 'product' && (c.chroma || 0) >= 0.12);
const pick = [], seen = new Set();
for (const cat of ['phones', 'gold', 'cars', 'pokemon', 'silver', 'sports', 'coins', 'strips']){
  const c = live.filter(x => x.cat === cat && !seen.has(x.theme)).sort((a, b) => b.chroma - a.chroma)[0];
  if (c){ pick.push(c); seen.add(c.theme); }
}
const b = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:'new', args:['--no-sandbox'] });
const p = await b.newPage();
await p.goto('http://localhost:8899/404.html', { waitUntil:'domcontentloaded' });
const jpg = await p.evaluate(async thumbs => {
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'assets/fonts/faces.css'; document.head.appendChild(l);
  await new Promise(r => { l.onload = r; l.onerror = r; });
  await document.fonts.load('800 80px "Bricolage Grotesque"'); await document.fonts.load('500 30px "Schibsted Grotesk"');
  const load = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = s; });
  const W = 1200, H = 630, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#0d1017'); bg.addColorStop(1, '#161a24');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  /* two rows of four cards, tilted, bleeding off the right edge */
  const ims = await Promise.all(thumbs.map(load));
  g.save(); g.translate(610, -40); g.rotate(-0.12);
  ims.forEach((im, k) => { if (!im) return;
    const x = (k % 4) * 214, y = Math.floor(k / 4) * 214 + (k % 2) * 40;
    g.save(); g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 30; g.shadowOffsetY = 12;
    g.beginPath(); g.roundRect(x, y + 40, 200, 200, 14); g.clip(); g.drawImage(im, x, y + 40, 200, 200); g.restore(); });
  g.restore();
  /* the words */
  const fade = g.createLinearGradient(0, 0, 700, 0); fade.addColorStop(0, 'rgba(13,16,23,1)'); fade.addColorStop(0.72, 'rgba(13,16,23,.92)'); fade.addColorStop(1, 'rgba(13,16,23,0)');
  g.fillStyle = fade; g.fillRect(0, 0, 720, H);
  g.fillStyle = '#9aa3b5'; g.font = '600 24px "Schibsted Grotesk"'; g.fillText('GRAPHICS STUDIO · BUYBACK.AD', 72, 150);
  g.fillStyle = '#f4f5f8'; g.font = '800 78px "Bricolage Grotesque"';
  ['“We Buy” ads', 'that stop', 'the scroll.'].forEach((t, k) => g.fillText(t, 68, 250 + k * 84));
  g.fillStyle = '#c3c9d6'; g.font = '500 28px "Schibsted Grotesk"';
  g.fillText('Pick a design, add your number, post it.', 72, 530);
  return c.toDataURL('image/jpeg', 0.86);
}, pick.map(c => c.thumb));
mkdirSync(ROOT + 'assets/og', { recursive:true });
writeFileSync(ROOT + 'assets/og/og-card.jpg', Buffer.from(jpg.split(',')[1], 'base64'));
await b.close();
console.log('og card from ' + pick.map(c => c.id).join(', ') + ' -> assets/og/og-card.jpg');
