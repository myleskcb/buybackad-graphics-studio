#!/usr/bin/env node
/* THE LIBRARY API, CHECKED (netlify/lib/library.mjs, DESIGN-LAW rule 111).

   0. The renders (assets/library-ads/, scripts/render_library_ads.mjs): every
      card the site offers (scIsLive, read out of app.js so the two cannot
      drift) has one, none is left for a card no longer offered, each file is
      the one its index entry names (sha1), a 1080x1080 JPEG, and made from
      the card's library thumbnail as it is now (thumb_sha1; a thumbnail drawn
      again since makes it stale: run render_library_ads.mjs --stale). Each
      carries its three dates (created, updated, rendered: ISO 8601 UTC, in
      order), and the JPEG's EXIF says the same (_jpeg_exif.mjs).
   1. The router on its own, against this checkout's files: no keys is 503;
      no key, a wrong key or a key shorter than 32 is 401 with
      WWW-Authenticate; both headers work; two keys at once (a rotation) both
      work; over the day's count is 429; POST is 405; no CORS header. Every
      route answers; the ads are the site's offered cards, each with its
      render, thumbnail and studio link, every link a file in this checkout;
      categories add up; the filters filter; search puts what an ad is for
      (its category) before a palette in its title; paging adds up; a held
      card is not there; every ad carries created, updated and uploaded;
      since= keeps what changed since a date and refuses a non-date; sort=
      orders by upload date; one ad answers Last-Modified; the index names
      the latest dates.
   2. The real function (netlify/functions/api.mjs) with a stand-in
      @netlify/blobs, against a static server on this checkout: the library
      answers through it, and the routes after it still ask for a sign-in.

   usage:  npx http-server -p 8899 -s .   (part 2 needs it; parts 0 and 1 do not)
           node scripts/library_api_check.mjs
   Exits non-zero on any failure. */
import { readFileSync, existsSync, mkdirSync, writeFileSync, cpSync, rmSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { exifRead } from './_jpeg_exif.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BASE = process.env.GFX_BASE || 'http://localhost:8899';
const { libraryRoute, libraryForget } = await import(pathToFileURL(join(ROOT, 'netlify/lib/library.mjs')).href);
const bad = [];
const ok = (cond, what) => { if (!cond) bad.push(what); return cond; };
const sha1 = (b) => createHash('sha1').update(b).digest('hex');
const json = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

/* ---------- 0. the renders ---------- */
const appSrc = readFileSync(join(ROOT, 'app.js'), 'utf8');
const liveSrc = (appSrc.match(/function scIsLive\(c\)\{[^\n]*\}/) || [])[0];
ok(liveSrc, 'scIsLive is not where it was in app.js');
const scIsLive = new Function(liveSrc + '; return scIsLive;')();
const cards = json('assets/showcase/index.json'), offered = cards.filter(scIsLive);
const renders = json('assets/library-ads/index.json').items;
const jpegSize = (b) => {             // the frame header's size (SOF0..SOF15 bar 4, 8, 12)
  for (let i = 2; i < b.length - 9;) {
    if (b[i] !== 0xff) return null;
    const m = b[i + 1], len = b.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    i += 2 + len;
  }
  return null;
};
const missing = offered.filter((c) => !renders[c.id]).map((c) => c.id);
ok(!missing.length, missing.length + ' offered cards have no render (run render_library_ads.mjs --stale): ' + missing.slice(0, 5).join(', '));
const extra = Object.keys(renders).filter((id) => !offered.some((c) => c.id === id));
ok(!extra.length, extra.length + ' renders for cards no longer offered: ' + extra.slice(0, 5).join(', '));
const files = readdirSync(join(ROOT, 'assets/library-ads')).filter((f) => f.endsWith('.jpg'));
ok(files.length === Object.keys(renders).length, files.length + ' render files for ' + Object.keys(renders).length + ' entries');
const wrong = [], stale = [], undated = [], unexif = [];
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
for (const c of offered) {
  const r = renders[c.id]; if (!r) continue;
  const f = join(ROOT, 'assets/library-ads', c.id + '.jpg');
  if (!existsSync(f)) { wrong.push(c.id + ' (no file)'); continue; }
  const b = readFileSync(f), size = jpegSize(b);
  if (sha1(b) !== r.sha1 || b[0] !== 0xff || b[1] !== 0xd8 || String(size) !== '1080,1080' || r.w !== 1080 || r.bytes !== b.length) wrong.push(c.id);
  if (sha1(readFileSync(join(ROOT, c.thumb))) !== r.thumb_sha1) stale.push(c.id);
  if (![r.created, r.updated, r.rendered].every((d) => ISO.test(d || '')) || !(r.created <= r.updated && r.updated <= r.rendered)) undated.push(c.id + ' ' + [r.created, r.updated, r.rendered].join(' '));
  const x = exifRead(b);
  if (!x || x.created !== r.created || x.updated !== r.updated || x.uploaded !== r.rendered || !x.title || !x.software) unexif.push(c.id + ' ' + JSON.stringify(x));
}
ok(!wrong.length, wrong.length + " renders are not what their index says (a 1080x1080 JPEG of that sha1): " + wrong.slice(0, 5).join(', '));
ok(!stale.length, stale.length + ' renders are older than their card in the library (run render_library_ads.mjs --stale): ' + stale.slice(0, 5).join(', '));
ok(!undated.length, undated.length + ' renders lack their three dates in order (created, updated, rendered; run render_library_ads.mjs --stamp): ' + undated.slice(0, 3).join(', '));
ok(!unexif.length, unexif.length + " renders' EXIF does not say what the index says (run render_library_ads.mjs --stamp): " + unexif.slice(0, 2).join(', '));

/* ---------- 1. the router ---------- */
const KEY = 'bbl_' + 'k'.repeat(40), KEY2 = 'bbl_' + 'n'.repeat(40);
const ORIGIN = 'https://studio.example';
const fetchJson = async (u) => {
  const path = new URL(u).pathname.replace(/^\//, '');
  if (!existsSync(join(ROOT, path))) throw new Error(path + ' 404');
  return JSON.parse(readFileSync(join(ROOT, path), 'utf8'));
};
let allow = true;
const call = async (path, { key = KEY, header = 'auth', method = 'GET', env = { LIBRARY_KEYS: 'iphonesla:' + KEY } } = {}) => {
  const url = new URL(ORIGIN + '/api' + path);
  const headers = new Headers();
  if (key && header === 'auth') headers.set('Authorization', 'Bearer ' + key);
  if (key && header === 'x') headers.set('X-Library-Key', key);
  const req = new Request(url, { method, headers });
  const p = url.pathname.replace(/^\/api/, '').replace(/\/$/, '') || '/';
  const r = await libraryRoute(req, url, p, env, { fetchJson, count: async () => allow });
  if (!r) return { status: null, body: null, headers: new Headers() };
  return { status: r.status, body: await r.json(), headers: r.headers };
};

libraryForget();
ok((await libraryRoute(new Request(ORIGIN + '/api/me'), new URL(ORIGIN + '/api/me'), '/me', {}, { fetchJson })) === null, 'a path outside /library is not passed on');
ok((await call('/library/v1', { env: {} })).status === 503, 'no LIBRARY_KEYS is not 503');
let r = await call('/library/v1', { key: null });
ok(r.status === 401 && /Bearer/.test(r.headers.get('WWW-Authenticate') || ''), 'no key is not 401 with WWW-Authenticate');
ok((await call('/library/v1', { key: KEY + 'x' })).status === 401, 'a wrong key is not 401');
ok((await call('/library/v1', { env: { LIBRARY_KEYS: 'iphonesla:short' }, key: 'short' })).status === 503, 'a key under 32 characters counts as a key');
ok((await call('/library/v1', { header: 'x' })).status === 200, 'X-Library-Key does not work');
const two = { LIBRARY_KEYS: 'iphonesla:' + KEY + ', iphonesla-next:' + KEY2 };
ok((await call('/library/v1', { env: two })).body?.partner === 'iphonesla' && (await call('/library/v1', { env: two, key: KEY2 })).body?.partner === 'iphonesla-next', 'two keys at once (a rotation) do not both work');
allow = false; ok((await call('/library/v1')).status === 429, "over the day's count is not 429"); allow = true;
ok((await call('/library/v1', { method: 'POST' })).status === 405, 'POST is not 405');
r = await call('/library/v1');
ok(r.status === 200 && !r.headers.get('Access-Control-Allow-Origin'), 'the index failed, or carries a CORS header');
ok((await call('/library/v2')).status === 404 && (await call('/library/v1/assets')).status === 404, 'an unknown version or route is not 404');

const want = offered.filter((c) => renders[c.id]).length;
const idx = r.body;
ok(idx.counts.ads === want && want === offered.length, `ads ${idx.counts.ads}, the site offers ${offered.length} (scIsLive), ${want} rendered`);
ok(r.headers.get('X-Library-Version') === idx.version, 'the version header is not the index version');
const cats = (await call('/library/v1/categories')).body.categories;
ok(Object.values(cats).reduce((a, b) => a + b, 0) === want, 'the categories do not add up to the ads');

const all = []; for (let off = 0; off !== null;) { const b = (await call('/library/v1/ads?limit=200&offset=' + off)).body; all.push(...b.items); off = b.next_offset; }
ok(all.length === want, `paging gave ${all.length} ads`);
const local = (u) => join(ROOT, new URL(u).pathname);
const nofile = all.filter((a) => !existsSync(local(a.image.url)) || !existsSync(local(a.thumb.url))).map((a) => a.id);
ok(!nofile.length, nofile.length + ' ads link to no file: ' + nofile.slice(0, 5).join(', '));
ok(all.every((a) => a.image.url === ORIGIN + '/assets/library-ads/' + a.id + '.jpg?v=' + renders[a.id].sha1.slice(0, 12) && a.image.width === 1080 && a.image.format === 'jpg'
  && a.studio_url === ORIGIN + '/?card=' + a.id && a.title && a.category && !('_s' in a)), 'an ad is missing its image, size, studio link or title, or shows an internal field');
/* the dates: every ad carries its three, as the index has them; since= and sort= work on them; one ad answers Last-Modified; the index names the latest */
ok(all.every((a) => a.created === renders[a.id].created && a.updated === renders[a.id].updated && a.uploaded === renders[a.id].rendered && ISO.test(a.uploaded)), 'an ad does not carry created, updated and uploaded as the render index has them');
const newestUp = all.map((a) => a.uploaded).sort().pop(), oldestCr = all.map((a) => a.created).sort()[0];
ok(idx.latest && idx.latest.uploaded === newestUp && idx.latest.created === all.map((a) => a.created).sort().pop(), 'the index does not name the latest dates: ' + JSON.stringify(idx.latest));
const sinceAll = (await call('/library/v1/ads?since=' + oldestCr.slice(0, 10) + '&limit=200')).body, sinceNone = (await call('/library/v1/ads?since=2099-01-01')).body;
ok(sinceAll.total === want && sinceNone.total === 0, `since= does not filter: from the first day ${sinceAll.total}, from 2099 ${sinceNone.total}`);
/* a timestamp is inclusive to the second: since= the newest upload keeps every ad uploaded then; one second later keeps none of them (nothing is updated after its upload) */
const plusOne = new Date(Date.parse(newestUp) + 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
const atNewest = (await call('/library/v1/ads?since=' + encodeURIComponent(newestUp) + '&limit=200')).body, afterNewest = (await call('/library/v1/ads?since=' + encodeURIComponent(plusOne))).body;
ok(atNewest.total === all.filter((a) => a.uploaded >= newestUp).length && afterNewest.total === all.filter((a) => a.created >= plusOne || a.updated >= plusOne || a.uploaded >= plusOne).length,
  `since= a timestamp is not inclusive to the second: at the newest upload ${atNewest.total}, a second later ${afterNewest.total}`);
ok((await call('/library/v1/ads?since=yesterday')).status === 400 && (await call('/library/v1/ads?sort=up')).status === 400, 'a bad since= or sort= is not 400');
const pages = async (qs) => { const out = []; for (let off = 0; off !== null;) { const b = (await call('/library/v1/ads?' + qs + '&limit=200&offset=' + off)).body; out.push(...b.items); off = b.next_offset; } return out; };
const newest = await pages('sort=newest'), oldest = await pages('sort=oldest');
const keyOf = (a) => a.uploaded + '|' + a.updated + '|' + a.created;
ok(newest.length === want && newest.every((a, i) => !i || keyOf(newest[i - 1]) >= keyOf(a)) && oldest.every((a, i) => !i || keyOf(oldest[i - 1]) <= keyOf(a)), 'sort= does not order by upload, then update, then creation');
const oneR = await call('/library/v1/ads/' + all[0].id);
ok(oneR.headers.get('Last-Modified') === new Date(all[0].uploaded).toUTCString(), 'one ad does not answer Last-Modified with its upload: ' + oneR.headers.get('Last-Modified'));

const gold = (await call('/library/v1/ads?category=gold&limit=500')).body;
ok(gold.limit === 200 && gold.total === offered.filter((c) => c.cat === 'gold').length && gold.items.every((a) => a.category === 'gold'), 'category does not filter, or the limit is not capped at 200');
const q = (await call('/library/v1/ads?q=gold')).body;
const goldN = offered.filter((c) => c.cat === 'gold').length;
ok(q.total > goldN && q.total < want && q.items.slice(0, goldN).every((a) => a.category === 'gold'), 'q=gold does not narrow, or the gold ads are not first: ' + q.items.slice(0, 3).map((a) => a.category + ' ' + a.title).join(' | '));
const ph = (await call('/library/v1/ads?category=phones&limit=3')).body;
ok(ph.items.length === 3 && ph.next_offset === 3, 'paging by category is off');
ok((await call('/library/v1/ads/' + all[0].id)).body?.item?.id === all[0].id, 'one ad by id');
ok((await call('/library/v1/ads/no-such-ad')).status === 404, 'an unknown ad is not 404');
ok((await call('/library/v1/ads/' + encodeURIComponent('../x'))).status === 400, 'a malformed id is not 400');
const held = json('assets/showcase/holds.json').holds[0];
if (held) ok((await call('/library/v1/ads/' + held.id)).status === 404, 'a held card (' + held.id + ') is offered');

const unit = { ads: want, categories: cats, version: idx.version, renderMB: +(Object.values(renders).reduce((a, x) => a + x.bytes, 0) / 1048576).toFixed(1) };

/* ---------- 2. through the real function ---------- */
let through = 'skipped (no server at ' + BASE + ')';
const up = await fetch(BASE + '/assets/library-ads/index.json').then((x) => x.ok).catch(() => false);
if (up) {
  const T = join(tmpdir(), 'pgfx-library-check');
  rmSync(T, { recursive: true, force: true });
  mkdirSync(join(T, 'netlify/functions'), { recursive: true }); mkdirSync(join(T, 'netlify/lib'), { recursive: true });
  cpSync(join(ROOT, 'netlify/functions/api.mjs'), join(T, 'netlify/functions/api.mjs'));
  cpSync(join(ROOT, 'netlify/lib/library.mjs'), join(T, 'netlify/lib/library.mjs'));
  mkdirSync(join(T, 'node_modules/@netlify/blobs'), { recursive: true });
  writeFileSync(join(T, 'node_modules/@netlify/blobs/package.json'), JSON.stringify({ name: '@netlify/blobs', type: 'module', main: 'index.js' }));
  writeFileSync(join(T, 'node_modules/@netlify/blobs/index.js'), 'const m = new Map(); export const getStore = () => ({ get: async k => m.has(k) ? m.get(k) : null, set: async (k, v) => { m.set(k, v); }, delete: async k => { m.delete(k); }, list: async () => ({ blobs: [] }) });');
  Object.assign(process.env, { LIBRARY_KEYS: 'iphonesla:' + KEY, LIBRARY_DAILY: '3', JWT_SECRET: 'x'.repeat(40) });
  const api = (await import(pathToFileURL(join(T, 'netlify/functions/api.mjs')).href)).default;
  const get = (path, key) => api(new Request(BASE + path, { headers: key ? { Authorization: 'Bearer ' + key } : {} }));
  const a = await get('/api/library/v1', KEY), aj = await a.json();
  ok(a.status === 200 && aj.counts.ads === want, 'through api.mjs the index is ' + a.status + ' ' + JSON.stringify(aj.counts || aj));
  ok(aj.routes && aj.routes.ads === BASE + '/api/library/v1/ads', 'through api.mjs the routes are not on the request origin');
  const one = await (await get('/api/library/v1/ads?category=phones&limit=1', KEY)).json();
  const img = one.items && await fetch(one.items[0].image.url);
  ok(img && img.ok && (await img.arrayBuffer()).byteLength === one.items[0].image.bytes, 'through api.mjs an ad image does not load from the site at its size');
  ok((await get('/api/library/v1', null)).status === 401, 'through api.mjs no key is not 401');
  ok((await get('/api/library/v1', KEY)).status === 200 && (await get('/api/library/v1', KEY)).status === 429, 'through api.mjs LIBRARY_DAILY=3 does not stop the fourth request');
  ok((await get('/api/me', null)).status === 401, 'through api.mjs /me no longer asks for a sign-in');
  through = 'ok';
}

console.log(JSON.stringify({ unit, through, failures: bad }, null, 1));
process.exit(bad.length ? 1 : 0);
