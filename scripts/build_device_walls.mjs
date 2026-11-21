#!/usr/bin/env node
/* EACH PHONE'S OWN MODEL'S WALLPAPER (DESIGN-LAW 156; 2026-11-21, the owner: "use the actual per device wall
   paper option and it's alternate colors as some of the bg variety", choosing Apple's own images over drawn
   ones, on about a third of phones).

   Apple makes a wallpaper for each iPhone line, in each of its finishes. This takes those images, as
   downloaded with the owner's OK (never fetched here), and writes each at screen size to
   motion/phones/walls/<family>-<finish>.webp, with motion/phones/walls/index.json:

     { family, model, finish, file, tone, source, official }

   family    the model line the wallpaper belongs to (engine.js wallFamily: "17-pro" for the 17 Pro and Pro
             Max, "13" for the 13 and 13 mini);
   tone      the wallpaper's mean colour, which fullad.js deviceWall matches to the screen's own family, so a
             wallpaper never brings in a third colour;
   source    the page it was downloaded from; official false marks a file that is not Apple's own.

   usage:  GFX_BASE=http://127.0.0.1:8932/ node scripts/build_device_walls.mjs <manifest.json>
             manifest: [{ family, model, finish, path, source, official }], path the downloaded file
           node scripts/build_device_walls.mjs --check      every listed file there, every file listed */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const ROOT = new URL('../', import.meta.url).pathname, DIR = ROOT + 'motion/phones/walls/', INDEX = DIR + 'index.json';
const WIDTH = 440;   // the lock screen is built 330 wide; a third over keeps a 1080 render sharp
const slug = s => String(s).toLowerCase().replace(/\(product\)/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

if (process.argv.includes('--check')) {
  if (!existsSync(INDEX)) { console.log('device walls: none yet'); process.exit(0); }
  const idx = JSON.parse(readFileSync(INDEX, 'utf8')), files = new Set(readdirSync(DIR).filter(f => f.endsWith('.webp')));
  const missing = idx.walls.filter(w => !files.has(w.file)).map(w => w.file), extra = [...files].filter(f => !idx.walls.some(w => w.file === f));
  console.log(`device walls: ${idx.walls.length} listed in ${new Set(idx.walls.map(w => w.family)).size} families`);
  if (missing.length || extra.length) { console.log('  missing: ' + missing.join(', ') + '\n  not listed: ' + extra.join(', ')); process.exit(1); }
  process.exit(0);
}

const manifest = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch(), page = await browser.newPage();
await page.setContent('<html><body></body></html>');
mkdirSync(DIR, { recursive: true });
const out = [];
for (const m of manifest) {
  const bytes = readFileSync(m.path), type = /\.png$/i.test(m.path) ? 'image/png' : /\.webp$/i.test(m.path) ? 'image/webp' : 'image/jpeg';
  const r = await page.evaluate(async ([src, W]) => {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
    const H = Math.round(img.height * W / img.width), c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d', { willReadFrequently: true }); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, W, H);
    // its mean colour, in linear light
    const d = x.getImageData(0, 0, W, H).data, lin = v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }, enc = v => Math.round(255 * (v <= .0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - .055));
    let rr = 0, gg = 0, bb = 0, n = 0; for (let i = 0; i < d.length; i += 16) { rr += lin(d[i]); gg += lin(d[i + 1]); bb += lin(d[i + 2]); n++; }
    const tone = '#' + [rr / n, gg / n, bb / n].map(v => enc(v).toString(16).padStart(2, '0')).join('');
    return { webp: c.toDataURL('image/webp', .86), w: W, h: H, from: [img.width, img.height], tone };
  }, [`data:${type};base64,` + bytes.toString('base64'), WIDTH]);
  const file = `${m.family}-${slug(m.finish)}.webp`;
  writeFileSync(DIR + file, Buffer.from(r.webp.split(',')[1], 'base64'));
  out.push({ family: m.family, model: m.model, finish: m.finish, file, tone: r.tone, size: [r.w, r.h], from: r.from, source: m.source, official: m.official !== false });
  console.log(`  ${file}  ${r.from.join('x')} -> ${r.w}x${r.h}  tone ${r.tone}${m.official === false ? '  (not Apple\'s own)' : ''}`);
}
await browser.close();
out.sort((p, q) => (p.file < q.file ? -1 : 1));
writeFileSync(INDEX, JSON.stringify({
  about: 'Each iPhone line\'s own wallpaper, Apple\'s, in each finish, at screen size (scripts/build_device_walls.mjs; DESIGN-LAW 156). fullad.js deviceWall puts a phone in its own model\'s wallpaper on about a third of ads, in the finish whose colour is of the screen\'s own family.',
  made: new Date().toISOString(), walls: out,
}, null, 1) + '\n');
console.log(`device walls: ${out.length} written to motion/phones/walls/ (${new Set(out.map(w => w.family)).size} families)`);
