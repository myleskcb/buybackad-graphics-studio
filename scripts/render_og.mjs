// Renders scripts/og_card.html to assets/og/buybackad-og.jpg (1200x630), the
// image every link preview shows. Serve the repo first:
//   python3 -m http.server 8899   then   node scripts/render_og.mjs [port]
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
const port = process.argv[2] || '8899';
const out = fileURLToPath(new URL('../assets/og/buybackad-og.jpg', import.meta.url));
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 1200, height: 630 });
await p.goto(`http://localhost:${port}/scripts/og_card.html`, { waitUntil: 'networkidle0' });
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: out, type: 'jpeg', quality: 86 });
await b.close();
console.log('wrote', out);
