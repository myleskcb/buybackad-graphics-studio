#!/usr/bin/env node
/* THE CARD LINES' PICTURES, PAINTED (2026-11-22). The owner: "Pokémon cards and sports cards are
   extremely lacking in variety" (2026-11-21, with "paint generic cards" chosen over real card
   photographs), then, of the card ads: "why arent there new card assets like we talked about".

   scripts/card-painter.js draws each picture in a headless Chromium with the studio's own fonts:
   trading cards of no game, slabs of no grader, packs and boxes of no brand, binder pages, sports
   cards of no league, team or player. They are placeholders in the house's sense (ph-*, as
   scripts/make_card_assets.py's are): a real photograph of the shop's own stock replaces one.

   usage:  node scripts/paint_card_pictures.mjs --out <dir>     paint into <dir> to look at them
           node scripts/paint_card_pictures.mjs --write         paint into assets/cutouts and register them
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

const FONTS = [['PxOswald7', 'oswald-700'], ['PxOswald6', 'oswald-600'], ['PxOswald4', 'oswald-400'], ['PxTeko7', 'teko-700'], ['PxSaira7', 'saira-condensed-700']]
  .map(([fam, f]) => [fam, readFileSync(`${ROOT}assets/fonts/${f}.woff2`).toString('base64')]);
// what the maker calls each picture, and the line it belongs to
const NAMES = {
  'ph-poke-card-holo': 'Holo card', 'ph-poke-card-fullart': 'Full-art card', 'ph-poke-cards-fan': 'Holo cards, fanned', 'ph-poke-slab': 'Graded card',
  'ph-poke-slabs-trio': 'Three graded cards', 'ph-poke-binder': 'Binder of cards', 'ph-poke-packs-fan': 'Booster packs', 'ph-poke-booster-box': 'Sealed booster box',
  'ph-poke-collection': 'A card collection', 'ph-sports-card-soccer': 'Soccer rookie card', 'ph-sports-card-hockey': 'Hockey rookie card',
  'ph-sports-card-auto': 'Autographed rookie card', 'ph-sports-card-patch': 'Patch autograph card', 'ph-sports-refractor-fan': 'Refractor cards, fanned',
  'ph-sports-auto-slab': 'Graded autograph', 'ph-sports-slabs-autos': 'Three graded rookies', 'ph-sports-binder': 'Binder of sports cards',
  'ph-sports-packs-fan': 'Wax and hobby packs', 'ph-sports-hobby-box': 'Sealed hobby box', 'ph-sports-collection': 'A sports card collection',
};

const browser = await chromium.launch();
const page = await (await browser.newContext({ deviceScaleFactor: 1 })).newPage();
const errors = []; page.on('pageerror', e => errors.push(e.message));
await page.setContent('<!doctype html><html><body></body></html>');
await page.addScriptTag({ content: readFileSync(ROOT + 'scripts/card-painter.js', 'utf8') });
await page.evaluate(f => window.loadFonts(f), FONTS);
const ids = (await page.evaluate(() => window.PICTURES)).filter(id => !only || only.includes(id));
const made = {};
for (const id of ids) {
  const r = await page.evaluate(id => window.PAINT(id), id);
  const png = `${OUT}${id}.png`, webp = `${OUT}${id}.webp`;
  writeFileSync(png, Buffer.from(r.png.split(',')[1], 'base64'));
  execFileSync('cwebp', ['-quiet', '-q', '84', '-alpha_q', '90', '-m', '6', png, '-o', webp]);
  if (WRITE) unlinkSync(png);
  made[id] = { w: r.w, h: r.h, bytes: statSync(webp).size };
  console.log(`${id.padEnd(26)} ${String(r.w).padStart(4)}x${String(r.h).padEnd(4)} ${String(Math.round(made[id].bytes / 1024)).padStart(4)} KB`);
}
await browser.close();
if (errors.length) { console.error('page errors:\n  ' + errors.join('\n  ')); process.exit(1); }

if (WRITE) {
  const now = Math.floor(Date.now() / 1000);
  const lp = ROOT + 'assets/library.json', lib = JSON.parse(readFileSync(lp, 'utf8')), have = Object.fromEntries(lib.assets.map(a => [a.slug, a]));
  for (const [id, m] of Object.entries(made)) {
    const b = readFileSync(CUT + id + '.webp');
    const row = { slug: id, file: id + '.webp', kind: 'cutout', category: id.startsWith('ph-poke-') ? 'poke' : 'sports', source: 'placeholder',
      prompt: 'painted by scripts/paint_card_pictures.mjs until a photograph of the shop\'s own stock replaces it: ' + (NAMES[id] || id).toLowerCase(),
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
