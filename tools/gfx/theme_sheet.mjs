/* contact sheet of the rendered themes, five variations per row */
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';
const ROOT = new URL('../../', import.meta.url).pathname;
const DIR = ROOT + '.render/themes/';
/* served, not file:// — a setContent page has no origin and Chrome refuses
   local subresources, which is how the first sheet came out all broken glyphs */
const URLBASE = (process.env.ASSET_BASE || 'http://localhost:8899/') + '.render/themes/';
const man = JSON.parse(readFileSync(DIR + 'manifest.json', 'utf8'));
const rows = [...new Set(man.map(m => m.theme))];
const html = `<style>body{margin:0;background:#0d0f12;font:11px system-ui;color:#9aa4b0}
 .r{display:grid;grid-template-columns:130px repeat(5,1fr);gap:6px;padding:6px 10px;align-items:center}
 .r b{font-size:12px;color:#e8edf3;display:block} .r i{font-style:normal;font-size:10px;color:#5b6675}
 img{width:100%;display:block;border-radius:4px}</style>` +
 rows.map(t => {
   const set = man.filter(m => m.theme === t);
   return `<div class=r><div><b>${set[0].name}</b><i>${t} · ${set[0].layout}</i></div>` +
     set.map(m => `<div><img src="${URLBASE}${m.id}.webp"><i>${m.palette}</i></div>`).join('') + `</div>`;
 }).join('');
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files'], protocolTimeout: 0 });
const p = await b.newPage(); await p.setViewport({ width: 1500, height: 1000 });
await p.goto(process.env.ASSET_BASE || 'http://localhost:8899/');
await p.setContent(html);
await p.evaluate(() => Promise.all([...document.images].map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; }))));
await p.screenshot({ path: ROOT + '.shot/themes.png', fullPage: true });
await b.close(); console.log('.shot/themes.png ·', rows.length, 'themes x', man.length / rows.length);
