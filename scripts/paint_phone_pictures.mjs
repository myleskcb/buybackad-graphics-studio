#!/usr/bin/env node
/* THE 2026 GALAXY AND PIXEL PICTURES, PAINTED (2026-11-23). scripts/phone-painter.js draws each phone in a
   headless Chromium: the Galaxy S26 and S26 Ultra, the Z Fold 8 and Z Flip 8, the Pixel 11 and 11 Pro and a Pixel
   foldable, in their own shapes and finishes, with no maker's logo and nobody's software on a screen. They are
   placeholders in the house's sense (source "painted"): a photograph of the shop's own stock replaces one.

   usage:  node scripts/paint_phone_pictures.mjs --out <dir>     paint into <dir> to look at them
           node scripts/paint_phone_pictures.mjs --write         paint into assets/cutouts and register them
                                                                  (assets/library.json, approved-assets.json,
                                                                  asset-names.json); then run
                                                                  node scripts/build_full_subjects.mjs
   needs:  Playwright (PLAYWRIGHT_MODULE to point at it) and cwebp. */
import { readFileSync, writeFileSync, mkdirSync, statSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const ROOT = new URL('../', import.meta.url).pathname, CUT = ROOT + 'assets/cutouts/';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const args = process.argv.slice(2), WRITE = args.includes('--write'), only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null;
const OUT = WRITE ? CUT : (args.includes('--out') ? args[args.indexOf('--out') + 1].replace(/\/?$/, '/') : null);
if (!OUT) { console.error('give --out <dir> to look, or --write to add them to the library'); process.exit(2); }
mkdirSync(OUT, { recursive: true });

const FONTS = [['PxOswald6', 'oswald-600'], ['PxOswald4', 'oswald-400']].map(([fam, f]) => [fam, readFileSync(`${ROOT}assets/fonts/${f}.woff2`).toString('base64')]);
// what the maker calls each picture
const NAMES = {
  'sam-s26-ultra-back-violet': 'Galaxy S26 Ultra, violet', 'sam-s26-ultra-back-titanium': 'Galaxy S26 Ultra, titanium', 'sam-s26-ultra-front': 'Galaxy S26 Ultra, front',
  'sam-s26-back-skyblue': 'Galaxy S26, sky blue', 'sam-s26-back-pink': 'Galaxy S26, pink', 'sam-s26-back-navy': 'Galaxy S26, navy',
  'sam-fold8-closed-back': 'Galaxy Z Fold 8, closed', 'sam-fold8-open': 'Galaxy Z Fold 8, open', 'sam-flip8-closed-ice': 'Galaxy Z Flip 8, closed', 'sam-flip8-open-violet': 'Galaxy Z Flip 8, open',
  'pix-11-pro-back-moonstone': 'Pixel 11 Pro, moonstone', 'pix-11-pro-back-porcelain': 'Pixel 11 Pro, porcelain', 'pix-11-pro-back-obsidian': 'Pixel 11 Pro, obsidian',
  'pix-11-back-indigo': 'Pixel 11, indigo', 'pix-11-back-lime': 'Pixel 11, lime', 'pix-11-pro-front': 'Pixel 11 Pro, front', 'pix-fold-pro-open': 'Pixel Pro Fold, open',
};

const browser = await chromium.launch();
const page = await (await browser.newContext({ deviceScaleFactor: 1 })).newPage();
const errors = []; page.on('pageerror', e => errors.push(e.message));
await page.setContent('<!doctype html><html><body></body></html>');
await page.addScriptTag({ content: readFileSync(ROOT + 'scripts/phone-painter.js', 'utf8') });
await page.evaluate(f => window.loadFonts(f), FONTS);
const ids = (await page.evaluate(() => window.PICTURES)).filter(id => !only || only.includes(id));
const made = {};
for (const id of ids) {
  const r = await page.evaluate(id => window.PAINT(id), id);
  const png = `${OUT}${id}.png`, webp = `${OUT}${id}.webp`;
  writeFileSync(png, Buffer.from(r.png.split(',')[1], 'base64'));
  execFileSync('cwebp', ['-quiet', '-q', '86', '-alpha_q', '90', '-m', '6', png, '-o', webp]);
  if (WRITE) unlinkSync(png);
  made[id] = { w: r.w, h: r.h, bytes: statSync(webp).size };
  console.log(`${id.padEnd(28)} ${String(r.w).padStart(4)}x${String(r.h).padEnd(4)} ${String(Math.round(made[id].bytes / 1024)).padStart(4)} KB`);
}
await browser.close();
if (errors.length) { console.error('page errors:\n  ' + errors.join('\n  ')); process.exit(1); }

if (WRITE) {
  const now = Math.floor(Date.now() / 1000);
  const lp = ROOT + 'assets/library.json', lib = JSON.parse(readFileSync(lp, 'utf8')), have = Object.fromEntries(lib.assets.map(a => [a.slug, a]));
  for (const [id, m] of Object.entries(made)) {
    const b = readFileSync(CUT + id + '.webp');
    const row = { slug: id, file: id + '.webp', kind: 'cutout', category: id.startsWith('pix-') ? 'pixel' : 'samsung', source: 'painted',
      prompt: 'painted by scripts/paint_phone_pictures.mjs (no logo, no software on its screen) until a photograph of the shop\'s own stock replaces it: ' + (NAMES[id] || id),
      w: m.w, h: m.h, bytes: b.length, sha1: createHash('sha1').update(b).digest('hex').slice(0, 12), url: 'assets/cutouts/' + id + '.webp' };
    if (have[id]) Object.assign(have[id], row); else lib.assets.push(row);
  }
  lib.count = lib.assets.length; lib.built = now;
  writeFileSync(lp, JSON.stringify(lib, null, 1));
  const ap = ROOT + 'assets/approved-assets.json', appr = JSON.parse(readFileSync(ap, 'utf8')), g = appr['asset-grid-v1'];
  for (const id of Object.keys(made)) if (!g.approved.includes(id)) g.approved.push(id);
  g.placeholders = [...new Set([...(g.placeholders || []), ...Object.keys(made)])].sort();
  writeFileSync(ap, JSON.stringify(appr, null, 1));
  const np = ROOT + 'assets/asset-names.json', names = JSON.parse(readFileSync(np, 'utf8'));
  for (const id of Object.keys(made)) if (NAMES[id]) names[id] = NAMES[id];
  writeFileSync(np, JSON.stringify(names, null, 1) + '\n');
  console.log(`registered ${Object.keys(made).length} pictures in assets/library.json, approved-assets.json and asset-names.json`);
}
