#!/usr/bin/env node
/* THE REBUILT LIBRARY ADS AT FULL SIZE, FOR THE PARTNER LIBRARY (DESIGN-LAW rules 111, 149).

   The owner, 2026-11-18, retired the old static library cards ("Retire them") now that each has a
   rebuilt version (motion/recipes.json, drawn by the full ad); then, asked whether to render the
   rebuilt ads at full size so the partner library feed serves them: "Do it here". The library API
   (netlify/lib/library.mjs) handed out the library cards' renders (scripts/render_library_ads.mjs,
   assets/library-ads/); with the cards retired it had nothing to hand out. This renders the rebuilt
   ad of every library card, once, at 1080, through Easy Mode's own full ad on the recipe's own seed
   (FullAdStudio.useRecipe, then build: the picture a customer downloads), as iPhones LA's copy: its
   number and Long Beach, as the library's renders carried them, the website line "Visit our website
   at www.iPhones.LA" and a seller asked for the IMEI, never a picture (_library_finish.mjs, the
   owner, 2026-11-03), into assets/rebuilt-ads/<recipe id>.jpg, with the dates in its EXIF as the
   library's renders have them (_jpeg_exif.mjs), the software named WeBuy.AD, the product's name (DESIGN-LAW
   148; BUYBACK.AD stays the business). Its own folder: render_library_ads.mjs prunes what
   is not a live card from its own.

   assets/rebuilt-ads/index.json records each render: its size, its file's sha1 (the API's links
   carry it), the recipe it was drawn from (stamp: a recipe whose seed, line, words or pictures move
   makes its render stale, and scripts/library_api_check.mjs fails until it is drawn again), and the
   dates: created and updated, the last commit of motion/recipes.json (the rebuild: the ad entered
   the library in its new form then); rendered, when this file was drawn.

   usage:  GFX_BASE=http://127.0.0.1:8931/ node scripts/render_rebuilt_ads.mjs [--stale | --ids a,b]
           (no flag: every rebuilt library ad; --stale: missing or stale ones only) */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { exifStamp } from './_jpeg_exif.mjs';
import { LIBRARY_SITE, LIBRARY_SAY } from './_library_finish.mjs';
import { stampOf, libraryRecipes } from './_rebuilt.mjs';

const ROOT = new URL('../', import.meta.url).pathname, OUT = ROOT + 'assets/rebuilt-ads/', INDEX = OUT + 'index.json';
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8931/').replace(/\/?$/, '/');
const SIZE = 1080, QUALITY = 0.88, SHOP = { number: '(562) 999-4994', zip: '90802', site: LIBRARY_SITE.replace(/^Visit our website at /, '') };
const sha1 = b => createHash('sha1').update(b).digest('hex');
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
// the library's rebuilt ads: a recipe made from a library card (_rebuilt.mjs, with the stamp the check reads too)
const recipes = libraryRecipes(JSON.parse(readFileSync(ROOT + 'motion/recipes.json', 'utf8')).recipes);
mkdirSync(OUT, { recursive: true });
const prev = existsSync(INDEX) ? JSON.parse(readFileSync(INDEX, 'utf8')) : { items: {} };
let todo = recipes;
if (process.argv.includes('--stale')) todo = recipes.filter(r => { const p = prev.items[r.id]; return !p || p.stamp !== stampOf(r) || !existsSync(OUT + r.id + '.jpg'); });
else if (arg('--ids')) { const want = new Set(arg('--ids').split(',')); todo = recipes.filter(r => want.has(r.id)); }

const git = args => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
const rebuiltAt = (git(['log', '-1', '--format=%aI', '--', 'motion/recipes.json']) ? new Date(git(['log', '-1', '--format=%aI', '--', 'motion/recipes.json'])) : new Date()).toISOString().replace(/\.\d{3}Z$/, 'Z');
const nowIso = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
// a seller of a phone is asked for the IMEI, of a Mac or a watch for the serial, never a picture: the library's own
// swaps, a whole point or line at a time; goods with no such number (gold, cards, cars) keep their own words
const IMEI_LINES = new Set(['iphone', 'ipad', 'galaxy', 'pixel', 'foldable', 'android']), SERIAL_LINES = new Set(['mac', 'macdesk', 'watch']);
const SAY = new Map(LIBRARY_SAY.map(([a, b]) => [a.toUpperCase(), b.toUpperCase()]));
const SERIAL = new Map([...SAY].map(([a, b]) => [a, b.replace(/IMEI OR SERIAL NUMBER/, 'SERIAL NUMBER').replace(/\bIMEI\b/, 'SERIAL')]));
const sayOf = (w, line) => { const m = IMEI_LINES.has(line) ? SAY : SERIAL_LINES.has(line) ? SERIAL : null; return m && w && m.has(w.trim().toUpperCase()) ? m.get(w.trim().toUpperCase()) : w; };

const items = { ...prev.items }, failed = [];
if (todo.length) {
  const require = createRequire(import.meta.url), { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const browser = await chromium.launch(), page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', e => console.error('page error:', e.message));
  await page.goto(BASE + '?demo=1', { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => typeof renderEzCanvas === 'function' && typeof TEMPLATES !== 'undefined' && window.FullAdStudio, null, { timeout: 120000 });
  await page.evaluate(async S => {
    account = { email: 'library@local', role: 'admin', plan: 'pro' }; loadAccount = async () => account; recordExport = async () => true;
    const a = await resolveArea(S.zip); if (a) setArea(a);
    try { jset('pgfx_area_asked', true); } catch (e) { }
    $('ez-phone').value = S.number; $('ez-website').value = S.site;
  }, SHOP);
  let n = 0;
  for (const r of todo) {
    // the recipe's own words with the library's swaps (a point is one of the comma-separated ones)
    const words = {}, pts = r.words.points ? r.words.points.split(', ').map(w => sayOf(w, r.subject)).join(', ') : '';
    if (pts && pts !== r.words.points) words.points = pts;
    if (r.words.label && sayOf(r.words.label, r.subject) !== r.words.label) words.label = sayOf(r.words.label, r.subject);
    const got = await page.evaluate(async ({ id, words, SIZE, QUALITY }) => {
      const M = await import('/motion/fullad.js'), FS = window.FullAdStudio, FA = FS.state;
      const rec = await FS.useRecipe(id); if (!rec) return { error: 'no recipe ' + id };
      FA.biz = ''; FA.words[rec.subject] = { ...words };
      const { ad } = await FS.build(SIZE, FORMATS.square);
      const frame = M.fullStill(ad);
      return { jpg: frame.toDataURL('image/jpeg', QUALITY), w: frame.width, h: frame.height };
    }, { id: r.id, words, SIZE, QUALITY });
    if (got.error || !/^data:image\/jpeg;base64,/.test(got.jpg || '')) { failed.push(r.id + ': ' + (got.error || 'no picture')); continue; }
    const dates = { created: rebuiltAt, updated: rebuiltAt, rendered: nowIso() };
    const title = r.label.replace(/ \((library card)\)$/, '');
    const buf = exifStamp(Buffer.from(got.jpg.split(',')[1], 'base64'), { title, software: 'WeBuy.AD', created: dates.created, updated: dates.updated, uploaded: dates.rendered });
    writeFileSync(OUT + r.id + '.jpg', buf);
    items[r.id] = { w: got.w, h: got.h, bytes: buf.length, sha1: sha1(buf), stamp: stampOf(r), from: r.from, title, rendered: dates.rendered, created: dates.created, updated: dates.updated };
    if (++n % 25 === 0) process.stdout.write(`${n} `);
  }
  await browser.close();
}
// a recipe gone takes its render with it
const ids = new Set(recipes.map(r => r.id));
for (const id of Object.keys(items)) if (!ids.has(id)) delete items[id];
for (const f of readdirSync(OUT)) if (f.endsWith('.jpg') && !items[f.slice(0, -4)]) unlinkSync(OUT + f);
const sorted = Object.fromEntries(Object.keys(items).sort().map(k => [k, items[k]]));
writeFileSync(INDEX, JSON.stringify({
  _doc: 'Full-size renders of the rebuilt library ads (motion/recipes.json, the recipes made from library cards), for the library API (rule 111, 149). Made by scripts/render_rebuilt_ads.mjs through Easy Mode\'s full ad at 1080, as iPhones LA\'s copy. stamp is the recipe it was drawn from: a recipe changed since makes the render stale (library_api_check.mjs). Dates, ISO 8601 UTC: created and updated, the rebuild (the last commit of motion/recipes.json); rendered, when the file was drawn.',
  built: new Date().toISOString(), size: SIZE, quality: QUALITY, items: sorted,
}, null, 1) + '\n');
const bytes = Object.values(sorted).reduce((t, x) => t + x.bytes, 0);
console.log(`\nrendered ${todo.length - failed.length}/${todo.length} · ${Object.keys(sorted).length} renders, ${(bytes / 1048576).toFixed(1)} MB` + (failed.length ? '\nfailed: ' + failed.join('\n') : ''));
process.exit(failed.length ? 1 : 0);
