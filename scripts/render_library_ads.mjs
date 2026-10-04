#!/usr/bin/env node
/* THE LIBRARY'S ADS AT FULL SIZE (DESIGN-LAW rule 111).

   The owner, 2026-10-04, over the first iPhones LA picker: "Those are not the
   ads those are assets and very old assets at that so it's going to be ads
   that we approved and send to the library in the buyback ad app ... the ads
   look way different than that." The library is the Designer Library: the
   cards the site offers (scIsLive). The studio draws them in the browser, so
   a partner's server cannot; this renders each one once, at 1080, through the
   studio's own renderThumb() (the very picture the library's 448px thumbnail
   is shrunk from), and publishes it as assets/library-ads/<id>.jpg for the
   library API (netlify/lib/library.mjs) to hand out.

   assets/library-ads/index.json records each render with the sha1 of its
   file and of the card's library thumbnail when it was made: a thumbnail
   re-drawn since (rethumb_showcase.mjs) makes the render stale, and
   scripts/library_api_check.mjs fails until it is rendered again. A card no
   longer offered loses its render.

   usage:  npx http-server -p 8899 -s .   then
           CHROME=… [FABRIC_JS=…] node scripts/render_library_ads.mjs [--stale | --ids a,b]
   (no flag: every offered card; --stale: missing or stale renders only)
   Run after rethumb_showcase.mjs, then bump nothing: the API's links carry
   each file's sha1. */
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { openStudio, live } from './_showcase_harness.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = ROOT + 'assets/library-ads/', INDEX = OUT + 'index.json';
const SIZE = 1080, QUALITY = 0.88;
const sha1 = (b) => createHash('sha1').update(b).digest('hex');
mkdirSync(OUT, { recursive: true });

const cards = JSON.parse(readFileSync(ROOT + 'assets/showcase/index.json', 'utf8')).filter(live);
const prev = existsSync(INDEX) ? JSON.parse(readFileSync(INDEX, 'utf8')) : { items: {} };
const thumbSha = (c) => sha1(readFileSync(ROOT + c.thumb));
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
let todo = cards;
if (process.argv.includes('--stale')) todo = cards.filter((c) => { const p = prev.items[c.id]; return !p || !existsSync(OUT + c.id + '.jpg') || p.thumb_sha1 !== thumbSha(c); });
else if (arg('--ids')) { const want = new Set(arg('--ids').split(',')); todo = cards.filter((c) => want.has(c.id)); }

const items = { ...prev.items };
const failed = [];
if (todo.length) {
  const { browser, page, errors } = await openStudio();
  for (let i = 0; i < todo.length; i += 6) {
    const batch = todo.slice(i, i + 6).map((c) => c.id);
    const out = await page.evaluate(async (ids, size, q) => {
      const res = [];
      for (const id of ids) {
        try { res.push({ id, jpg: renderThumb(await __sc.load(id), size, q) }); }
        catch (e) { res.push({ id, err: String(e).slice(0, 120) }); }
      }
      return res;
    }, batch, SIZE, QUALITY);
    for (const r of out) {
      const c = todo.find((x) => x.id === r.id);
      if (!r.jpg || !/^data:image\/jpeg;base64,/.test(r.jpg)) { failed.push(r.id + ': ' + (r.err || 'no picture')); continue; }
      const buf = Buffer.from(r.jpg.split(',')[1], 'base64');
      writeFileSync(OUT + r.id + '.jpg', buf);
      items[r.id] = { w: SIZE, h: SIZE, bytes: buf.length, sha1: sha1(buf), thumb_sha1: thumbSha(c), rendered: new Date().toISOString().slice(0, 10) };
    }
    process.stdout.write(`\r${Math.min(i + 6, todo.length)}/${todo.length}`);
  }
  await browser.close();
  if (errors.length) console.log('\npage errors: ' + errors.slice(0, 5).join(' | '));
}
// a card no longer offered loses its render
const offered = new Set(cards.map((c) => c.id));
let pruned = 0;
for (const id of Object.keys(items)) if (!offered.has(id)) { delete items[id]; pruned++; }
for (const f of readdirSync(OUT)) if (f.endsWith('.jpg') && !items[f.slice(0, -4)]) { unlinkSync(OUT + f); }
const sorted = Object.fromEntries(Object.keys(items).sort().map((k) => [k, items[k]]));
writeFileSync(INDEX, JSON.stringify({
  _doc: "Full-size renders of the cards the library offers (scIsLive), for the library API (rule 111). Made by scripts/render_library_ads.mjs through the studio's renderThumb() at 1080. thumb_sha1 is the card's library thumbnail when the render was made: a thumbnail drawn again since makes the render stale (library_api_check.mjs fails until --stale is run).",
  built: new Date().toISOString(), size: SIZE, quality: QUALITY, items: sorted,
}, null, 1) + '\n');
console.log(`\nrendered ${todo.length - failed.length}/${todo.length} · ${Object.keys(sorted).length} renders · pruned ${pruned}` + (failed.length ? '\nfailed: ' + failed.join('\n') : ''));
process.exit(failed.length ? 1 : 0);
