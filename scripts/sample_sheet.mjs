/* Contact sheet of showcase thumbnails, for LOOKING at the library.
 *
 *   node scripts/sample_sheet.mjs OUT.png [N=48] [seed=1] [filter]
 *
 * Draws N cards from assets/showcase/index.json (live cards only: the same
 * three filters the landing applies), a seeded stratified sample so every
 * category shows up, each captioned with its id, palette and display face.
 * `filter` is an optional key=value (cat=phones, family=Candy, theme=...).
 * SHEET_IDS=file.json draws exactly those ids instead.
 * Needs the static server on :8899 (python3 -m http.server 8899). */
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync } from 'node:fs';
const [,, OUT = '.render/sheet.png', N = '48', SEED = '1', FILTER = ''] = process.argv;
const idx = JSON.parse(readFileSync('assets/showcase/index.json', 'utf8'));
let live = idx.filter(c => !c.defect && c.imagery !== 'none' && !(typeof c.chroma === 'number' && c.chroma < 0.05));
if (FILTER){ const [k, v] = FILTER.split('='); live = live.filter(c => String(c[k]) === v); }
let s = +SEED || 1; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
let rows;
if (process.env.SHEET_IDS){
  const want = JSON.parse(readFileSync(process.env.SHEET_IDS, 'utf8'));
  const by = Object.fromEntries(idx.map(c => [c.id, c])); rows = want.map(id => by[id]).filter(Boolean);
} else {
  const byCat = {}; live.forEach(c => (byCat[c.cat] = byCat[c.cat] || []).push(c));
  Object.values(byCat).forEach(l => l.sort(() => rnd() - 0.5));
  rows = []; const cats = Object.keys(byCat).sort();
  for (let r = 0; rows.length < +N && r < 400; r++) for (const k of cats) if (byCat[k][r] && rows.length < +N) rows.push(byCat[k][r]);
}
const b = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:'new', args:['--no-sandbox'] });
const p = await b.newPage(); await p.goto('http://localhost:8899/404.html', { waitUntil:'domcontentloaded' });
const png = await p.evaluate(async rows => {
  const load = src => new Promise(r => { const el = new Image(); el.onload = () => r(el); el.onerror = () => r(null); el.src = src + '?t=' + Date.now(); });
  const S = 300, COLS = 6, c = document.createElement('canvas');
  c.width = COLS * (S + 12) + 12; c.height = Math.ceil(rows.length / COLS) * (S + 44) + 12;
  const g = c.getContext('2d'); g.fillStyle = '#15171c'; g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < rows.length; i++){
    const r = rows[i], im = await load(r.thumb);
    const x = (i % COLS) * (S + 12) + 12, y = Math.floor(i / COLS) * (S + 44) + 12;
    if (im) g.drawImage(im, x, y, S, S); else { g.fillStyle = '#f33'; g.fillRect(x, y, S, S); }
    g.fillStyle = r.defect ? '#ff6259' : '#cfd3dc'; g.font = '600 12px sans-serif';
    g.fillText(r.id.slice(0, 40), x, y + S + 15);
    g.fillStyle = '#8b93a3'; g.font = '11px sans-serif';
    g.fillText(((r.theme || '') + ' · ' + ((r.faces && r.faces.display) || '')).slice(0, 48), x, y + S + 30);
  }
  return c.toDataURL('image/png');
}, rows);
writeFileSync(OUT, Buffer.from(png.split(',')[1], 'base64'));
await b.close();
console.log('sheet: ' + rows.length + ' cards -> ' + OUT);
