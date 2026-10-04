#!/usr/bin/env node
/* THE LIBRARY API, CHECKED (netlify/lib/library.mjs, DESIGN-LAW rule 111).

   1. The router on its own, against this checkout's files: no keys is 503;
      no key, a wrong key or a key shorter than 32 is 401 with
      WWW-Authenticate; both headers work; two keys at once (a rotation) both
      work; over the day's count is 429; POST is 405; no CORS header. Every
      route answers, the filters filter, pagination adds up, the categories
      add up to the totals, the counts are the library's (placeholders out)
      and the site's own live cards (scIsLive, read out of app.js, so the two
      cannot drift), a held card is not there, every link is a file in this
      checkout, and a credited picture carries its credit.
   2. The real function (netlify/functions/api.mjs) with a stand-in
      @netlify/blobs, against a static server on this checkout: the library
      answers through it, and the routes after it still ask for a sign-in.

   usage:  npx http-server -p 8899 -s .   (part 2 needs it; part 1 does not)
           node scripts/library_api_check.mjs
   Exits non-zero on any failure. */
import { readFileSync, existsSync, mkdirSync, writeFileSync, cpSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BASE = process.env.GFX_BASE || 'http://localhost:8899';
const { libraryRoute, libraryForget } = await import(pathToFileURL(join(ROOT, 'netlify/lib/library.mjs')).href);
const bad = [];
const ok = (cond, what) => { if (!cond) bad.push(what); return cond; };

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

/* ---------- 1. the router ---------- */
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
ok((await call('/library/v2')).status === 404, 'an unknown version is not 404');

const lib = JSON.parse(readFileSync(join(ROOT, 'assets/library.json'), 'utf8')).assets;
const cards = JSON.parse(readFileSync(join(ROOT, 'assets/showcase/index.json'), 'utf8'));
const appSrc = readFileSync(join(ROOT, 'app.js'), 'utf8');
const liveSrc = (appSrc.match(/function scIsLive\(c\)\{[^\n]*\}/) || [])[0];
ok(liveSrc, 'scIsLive is not where it was in app.js');
const scIsLive = new Function(liveSrc + '; return scIsLive;')();
const wantAssets = lib.filter((a) => a.source !== 'placeholder').length, wantAds = cards.filter(scIsLive).length;
const idx = r.body;
ok(idx.counts.assets === wantAssets, `assets ${idx.counts.assets}, the library has ${wantAssets} that are not placeholders`);
ok(idx.counts.ads === wantAds, `ads ${idx.counts.ads}, the site offers ${wantAds} (scIsLive)`);
ok(idx.counts.cutouts + idx.counts.scenes + idx.counts.backgrounds === idx.counts.assets, 'the kinds do not add up to the assets');
ok(r.headers.get('X-Library-Version') === idx.version, 'the version header is not the index version');

const cats = (await call('/library/v1/categories')).body;
const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
ok(Object.values(cats.assets).reduce((a, o) => a + sum(o), 0) === wantAssets && sum(cats.ads) === wantAds, 'the categories do not add up to the totals');

// every asset and ad, all pages
const all = async (path) => { const out = []; for (let off = 0; off !== null;){ const b = (await call(path + (path.includes('?') ? '&' : '?') + 'limit=200&offset=' + off)).body; out.push(...b.items); off = b.next_offset; } return out; };
const assets = await all('/library/v1/assets'), ads = await all('/library/v1/ads');
ok(assets.length === wantAssets && ads.length === wantAds, `paging gave ${assets.length} assets and ${ads.length} ads`);
const local = (u) => join(ROOT, new URL(u).pathname);
const missing = assets.filter((a) => !existsSync(local(a.url))).map((a) => a.id).concat(ads.filter((a) => !existsSync(local(a.thumb.url))).map((a) => a.id));
ok(!missing.length, missing.length + ' links to no file: ' + missing.slice(0, 5).join(', '));
ok(assets.every((a) => a.url.startsWith(ORIGIN + '/assets/') && a.id && a.kind && a.format) && ads.every((a) => a.studio_url === ORIGIN + '/?card=' + a.id), 'an item is missing its link, kind, format or studio link');
ok(!assets.some((a) => a.source === 'placeholder') && !assets.some((a) => '_s' in a), 'a placeholder or an internal field is out');
const credited = assets.find((a) => a.id === 'poke-psa-charizard');
ok(!credited || (credited.credit && credited.credit.license), 'a credited picture lost its credit');

// filters
const iph = (await call('/library/v1/assets?kind=cutout&category=iphones&limit=500')).body;
ok(iph.limit === 200 && iph.items.length > 0 && iph.items.every((a) => a.kind === 'cutout' && a.category === 'iphones' && a.transparent), 'kind and category do not filter, or the limit is not capped at 200');
ok(iph.total === lib.filter((a) => a.kind === 'cutout' && a.category === 'iphones' && a.source !== 'placeholder').length, 'the iphones cut-out count is off');
const q = (await call('/library/v1/assets?q=airpods%20case')).body;
ok(q.total > 0 && q.items.every((a) => /airpods/.test(a.id + a.category + a.alt) && /case/.test(a.id + a.alt)), 'q does not narrow to every word');
ok((await call('/library/v1/assets?kind=sticker')).status === 400, 'an unknown kind is not 400');
const ph = (await call('/library/v1/ads?category=phones&limit=3')).body;
ok(ph.items.length === 3 && ph.items.every((a) => a.category === 'phones') && ph.next_offset === 3, 'ads by category or their paging is off');

// one of each
ok((await call('/library/v1/assets/' + assets[0].id)).body?.item?.id === assets[0].id, 'one asset by id');
ok((await call('/library/v1/ads/' + ads[0].id)).body?.item?.id === ads[0].id, 'one ad by id');
ok((await call('/library/v1/assets/no-such-thing')).status === 404, 'an unknown asset is not 404');
ok((await call('/library/v1/assets/' + encodeURIComponent('../x'))).status === 400, 'a malformed id is not 400');
const held = JSON.parse(readFileSync(join(ROOT, 'assets/showcase/holds.json'), 'utf8')).holds[0];
if (held) ok((await call('/library/v1/ads/' + held.id)).status === 404, 'a held card (' + held.id + ') is offered');

const unit = { assets: wantAssets, ads: wantAds, cutouts: idx.counts.cutouts, scenes: idx.counts.scenes, backgrounds: idx.counts.backgrounds, version: idx.version, iphonesCutouts: iph.total };

/* ---------- 2. through the real function ---------- */
let through = 'skipped (no server at ' + BASE + ')';
const up = await fetch(BASE + '/assets/library.json').then((x) => x.ok).catch(() => false);
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
  ok(a.status === 200 && aj.counts.assets === wantAssets && aj.counts.ads === wantAds, 'through api.mjs the index is ' + a.status + ' ' + JSON.stringify(aj.counts || aj));
  ok(aj.routes && aj.routes.assets === BASE + '/api/library/v1/assets', 'through api.mjs the routes are not on the request origin');
  const one = await (await get('/api/library/v1/assets?category=iphones&limit=1', KEY)).json();
  ok(one.items && (await fetch(one.items[0].url)).ok, 'through api.mjs an asset link does not load from the site');
  ok((await get('/api/library/v1', null)).status === 401, 'through api.mjs no key is not 401');
  ok((await get('/api/library/v1', KEY)).status === 200 && (await get('/api/library/v1', KEY)).status === 429, 'through api.mjs LIBRARY_DAILY=3 does not stop the fourth request');
  ok((await get('/api/me', null)).status === 401, 'through api.mjs /me no longer asks for a sign-in');
  through = 'ok';
}

console.log(JSON.stringify({ unit, through, failures: bad }, null, 1));
process.exit(bad.length ? 1 : 0);
