#!/usr/bin/env node
/* THE POKÉMON PHOTOGRAPH GROUNDS, PAINTED (2026-11-23, DESIGN-LAW 161). The card ads stood on two
   photographs of real graded Charizards (assets/bg-web/pokemon-charizard-card-1 and -2, CC BY-SA, a
   photographer's mark, the maker's art). scripts/card-painter.js paints the same scene with cards and
   slabs of no game or grader; this writes them where the photographs were used:

     assets/bg-web/<id>.jpg     1920x1280, the ground the templates, looks and full ads draw
     assets/bg-offer/<id>.jpg   1080 from its centre, the offer card's ground, with its p90 in grounds.json

   usage:  node scripts/paint_card_scenes.mjs --out <dir>    paint into <dir> to look at them
           node scripts/paint_card_scenes.mjs --write        paint into the library and register them
   needs:  Playwright (PLAYWRIGHT_MODULE to point at it). */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const ROOT = new URL('../', import.meta.url).pathname;
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const args = process.argv.slice(2), WRITE = args.includes('--write');
const OUT = WRITE ? null : (args.includes('--out') ? args[args.indexOf('--out') + 1].replace(/\/?$/, '/') : null);
if (!WRITE && !OUT) { console.error('give --out <dir> to look, or --write to add them to the library'); process.exit(2); }
if (OUT) mkdirSync(OUT, { recursive: true });

const FONTS = [['PxOswald7', 'oswald-700'], ['PxOswald6', 'oswald-600'], ['PxOswald4', 'oswald-400'], ['PxTeko7', 'teko-700'], ['PxSaira7', 'saira-condensed-700']]
  .map(([fam, f]) => [fam, readFileSync(`${ROOT}assets/fonts/${f}.woff2`).toString('base64')]);
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<!doctype html><body></body>');
await page.addScriptTag({ content: readFileSync(ROOT + 'scripts/card-painter.js', 'utf8') });
await page.evaluate(f => window.loadFonts(f), FONTS);
const ids = await page.evaluate(() => window.SCENE_IDS);
const made = {};
for (const id of ids) {
  const r = await page.evaluate(id => window.SCENE(id), id);
  const jpg = Buffer.from(r.jpg.split(',')[1], 'base64'), offer = Buffer.from(r.offer.split(',')[1], 'base64');
  if (OUT) { writeFileSync(`${OUT}${id}.jpg`, jpg); writeFileSync(`${OUT}${id}-offer.jpg`, offer); }
  else { writeFileSync(`${ROOT}assets/bg-web/${id}.jpg`, jpg); writeFileSync(`${ROOT}assets/bg-offer/${id}.jpg`, offer); }
  made[id] = r.p90;
  console.log(`${id}  ${(jpg.length / 1024).toFixed(0)} KB, offer ${(offer.length / 1024).toFixed(0)} KB, p90 ${r.p90}`);
}
await browser.close();

if (WRITE) {
  const NOTE = "painted by the studio (scripts/card-painter.js): cards and slabs of no game or grader on a shop's display, standing in for the CC BY-SA photographs of real graded Charizards (DESIGN-LAW 161); no credit needed";
  // the web library's credits: a painted ground in place of each photograph
  const RETIRED = /^pokemon-charizard-card-\d\.jpg$/;   // the photographs these stand in for leave the library
  const webA = JSON.parse(readFileSync(ROOT + 'assets/bg-web/ATTRIBUTION.json', 'utf8')).filter(a => !RETIRED.test(a.file));
  for (const id of ids) {
    const at = webA.findIndex(a => a.file === `${id}.jpg`), rec = { file: `${id}.jpg`, cat: 'pokemon', source: 'painted', license: 'own work', note: NOTE };
    if (at >= 0) webA[at] = rec; else webA.push(rec);
  }
  writeFileSync(ROOT + 'assets/bg-web/ATTRIBUTION.json', JSON.stringify(webA, null, 1) + '\n');
  const offA = JSON.parse(readFileSync(ROOT + 'assets/bg-offer/ATTRIBUTION.json', 'utf8')).filter(a => !RETIRED.test(a.file));
  for (const id of ids) {
    const at = offA.findIndex(a => a.file === `${id}.jpg`), rec = { file: `${id}.jpg`, from: `assets/bg-web/${id}.jpg`, note: NOTE };
    if (at >= 0) offA[at] = rec; else offA.push(rec);
  }
  writeFileSync(ROOT + 'assets/bg-offer/ATTRIBUTION.json', JSON.stringify(offA, null, 1) + '\n');
  const G = JSON.parse(readFileSync(ROOT + 'assets/bg-offer/grounds.json', 'utf8'));
  G.pokemon = ids.map(id => ({ file: id, p90: made[id] }));
  writeFileSync(ROOT + 'assets/bg-offer/grounds.json', JSON.stringify(G, null, 1) + '\n');
  console.log('registered: bg-web and bg-offer ATTRIBUTION.json, bg-offer/grounds.json');
}
