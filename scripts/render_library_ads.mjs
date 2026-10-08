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

   THE DATES (2026-10-06, the owner: "identify the media by creation / upload
   dates"). Each entry carries three, ISO 8601 UTC, read out of git on every
   run: `created`, the commit that first added the card's record
   (assets/showcase/tpl/<id>.json: the ad entered the library); `updated`,
   the last commit that touched the record or its library thumbnail (the
   design last changed); `rendered`, when this render was drawn (the upload:
   the time the file was made, kept from the entry; an entry from before the
   dates took the index's build time). The same three go inside the JPEG as
   EXIF (_jpeg_exif.mjs: DateTimeOriginal, DateTime, DateTimeDigitized, with
   the title and the studio's name), so a file identifies itself wherever it
   is uploaded. The library API hands the three out and filters on them.
   Git has to be the whole history: a shallow clone would date every old
   card at its own first commit, so the script refuses one.

   usage:  npx http-server -p 8899 -s .   then
           CHROME=… [FABRIC_JS=…] node scripts/render_library_ads.mjs [--stale | --ids a,b | --stamp]
   (no flag: every offered card; --stale: missing or stale renders only;
   --stamp: no rendering, every file's EXIF and the index's dates brought up
   to date, which changes each file's sha1 and so the API's links)
   Run after rethumb_showcase.mjs, then bump nothing: the API's links carry
   each file's sha1. */
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { openStudio, live } from './_showcase_harness.mjs';
import { exifStamp, exifRead } from './_jpeg_exif.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = ROOT + 'assets/library-ads/', INDEX = OUT + 'index.json';
const SIZE = 1080, QUALITY = 0.88;
const sha1 = (b) => createHash('sha1').update(b).digest('hex');
mkdirSync(OUT, { recursive: true });

const cards = JSON.parse(readFileSync(ROOT + 'assets/showcase/index.json', 'utf8')).filter(live);
const prev = existsSync(INDEX) ? JSON.parse(readFileSync(INDEX, 'utf8')) : { items: {} };
const thumbSha = (c) => sha1(readFileSync(ROOT + c.thumb));
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const STAMP = process.argv.includes('--stamp');
let todo = cards;
if (STAMP) todo = [];
else if (process.argv.includes('--stale')) todo = cards.filter((c) => { const p = prev.items[c.id]; return !p || !existsSync(OUT + c.id + '.jpg') || p.thumb_sha1 !== thumbSha(c); });
else if (arg('--ids')) { const want = new Set(arg('--ids').split(',')); todo = cards.filter((c) => want.has(c.id)); }

/* the dates, out of git: one walk over the records, the thumbnails and the
   renders, newest commit first, so the first time a file is seen is its last
   change and the last time its first */
const git = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 }).trim();
if (git(['rev-parse', '--is-shallow-repository']) === 'true') { console.error('this clone is shallow: run git fetch --unshallow first, or every old card is dated at the clone\'s first commit'); process.exit(2); }
const firstSeen = {}, lastSeen = {};
{
  let when = null;
  for (const line of git(['log', '--format=%x00%aI', '--name-only', '--', 'assets/showcase/tpl', 'assets/showcase', 'assets/library-ads']).split('\n')) {
    if (line.startsWith('\0')) { when = new Date(line.slice(1)).toISOString().replace(/\.\d{3}Z$/, 'Z'); continue; }
    if (!line.trim()) continue;
    if (!lastSeen[line]) lastSeen[line] = when;
    firstSeen[line] = when;
  }
}
const datesOf = (c) => {
  const rec = 'assets/showcase/tpl/' + c.id + '.json', th = c.thumb;
  const created = firstSeen[rec] || firstSeen[th] || null;
  const updated = [lastSeen[rec], lastSeen[th]].filter(Boolean).sort().pop() || created;
  return { created, updated };
};
const nowIso = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
/* an entry from before the dates carried the day it was rendered: the index's
   build time of that day is the time, else the file's last commit */
const renderedOf = (id, p) => {
  if (p && p.rendered && /T/.test(p.rendered)) return p.rendered;
  if (p && p.rendered && prev.built && prev.built.slice(0, 10) === p.rendered) return prev.built.replace(/\.\d{3}Z$/, 'Z');
  return lastSeen['assets/library-ads/' + id + '.jpg'] || (p && p.rendered ? p.rendered + 'T00:00:00Z' : nowIso());
};
const SOFTWARE = 'BUYBACK.AD Graphics Studio';
const stamp = (buf, c, dates) => exifStamp(buf, { title: c.name || c.id, software: SOFTWARE, created: dates.created, updated: dates.updated, uploaded: dates.rendered });

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
      const dates = Object.assign(datesOf(c), { rendered: nowIso() });
      const buf = stamp(Buffer.from(r.jpg.split(',')[1], 'base64'), c, dates);
      writeFileSync(OUT + r.id + '.jpg', buf);
      items[r.id] = { w: SIZE, h: SIZE, bytes: buf.length, sha1: sha1(buf), thumb_sha1: thumbSha(c), rendered: dates.rendered, created: dates.created, updated: dates.updated };
    }
    process.stdout.write(`\r${Math.min(i + 6, todo.length)}/${todo.length}`);
  }
  await browser.close();
  if (errors.length) console.log('\npage errors: ' + errors.slice(0, 5).join(' | '));
}
/* every other render keeps its picture and takes the dates as git has them
   now (a record edited since moves `updated`); its EXIF is written again
   only when it would change, so a file's sha1 moves only with its dates */
let stamped = 0;
for (const c of cards) {
  const p = items[c.id], f = OUT + c.id + '.jpg';
  if (!p || todo.includes(c) || !existsSync(f)) continue;
  const dates = Object.assign(datesOf(c), { rendered: renderedOf(c.id, p) });
  const buf = readFileSync(f);
  const have = exifRead(buf);
  const want = { created: dates.created, updated: dates.updated, uploaded: dates.rendered };
  let out = buf;
  if (!have || have.created !== want.created || have.updated !== want.updated || have.uploaded !== want.uploaded || have.title !== (c.name || c.id).replace(/ · /g, ' - ')) { out = stamp(buf, c, dates); writeFileSync(f, out); stamped++; }
  items[c.id] = { ...p, bytes: out.length, sha1: sha1(out), rendered: dates.rendered, created: dates.created, updated: dates.updated };
}
// a card no longer offered loses its render
const offered = new Set(cards.map((c) => c.id));
let pruned = 0;
for (const id of Object.keys(items)) if (!offered.has(id)) { delete items[id]; pruned++; }
for (const f of readdirSync(OUT)) if (f.endsWith('.jpg') && !items[f.slice(0, -4)]) { unlinkSync(OUT + f); }
const sorted = Object.fromEntries(Object.keys(items).sort().map((k) => [k, items[k]]));
writeFileSync(INDEX, JSON.stringify({
  _doc: "Full-size renders of the cards the library offers (scIsLive), for the library API (rule 111). Made by scripts/render_library_ads.mjs through the studio's renderThumb() at 1080. thumb_sha1 is the card's library thumbnail when the render was made: a thumbnail drawn again since makes the render stale (library_api_check.mjs fails until --stale is run). Dates, ISO 8601 UTC, out of git: created (the card's record first committed), updated (its record or thumbnail last committed), rendered (this render drawn: the upload); the same three are inside the JPEG as EXIF.",
  built: new Date().toISOString(), size: SIZE, quality: QUALITY, items: sorted,
}, null, 1) + '\n');
console.log(`\nrendered ${todo.length - failed.length}/${todo.length} · dates stamped into ${stamped} files · ${Object.keys(sorted).length} renders · pruned ${pruned}` + (failed.length ? '\nfailed: ' + failed.join('\n') : ''));
process.exit(failed.length ? 1 : 0);
