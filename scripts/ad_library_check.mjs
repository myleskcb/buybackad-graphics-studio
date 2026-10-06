#!/usr/bin/env node
/* THE AD LIBRARY, CHECKED (netlify/lib/adlibrary.mjs, ad-library.js,
   master-library.html).

   1. The router on its own, with an in-memory store: accounts not set up is
      503 and no sign-in 401; a save takes a real JPEG and refuses a PNG, a
      picture too small or too large, and a body that is not JSON; the same
      picture twice is one ad; the plan's cap is 507 and the day's count 429;
      update, settings, remove and the link reset do what they say. The public
      link answers JSON (CORS, noindex), RSS that parses, and each picture byte
      for byte; a held ad never auto-posts and cannot be switched on; slots
      come due on the schedule (a poster that keeps slot ids posts once a slot,
      and again when the next comes due); a reset link stops answering. A
      video on an ad: begin, parts of the stated size, done joins and checks
      them (the hash, the container); it is served byte for byte and by
      range, named on the feed (kind, ?kind=) and in the RSS; a damaged
      upload leaves the ad as it was; removed with the video or with the ad.
   2. The real function (netlify/functions/api.mjs) with a stand-in
      @netlify/blobs: sign up, save, a video in parts, read the public link
      through it; the library key route and /me still answer as before.
   3. In Chromium, the studio and the page, under the production CSP: an Easy
      Mode download offers "Save to library"; saved, it is in the Library
      dialog and on the public link (a free account's watermarked ad held from
      auto-post, an admin's set to post); master-library.html shows the public
      library at ?feed= and the finished designs (every offered card); no
      sideways scroll at 390 px. The stars (2026-10-06): an account is
      created from the landing page, the dialog opening on Create account for
      a new device; every card in the landing gallery, the Easy Mode strip,
      the picker, the Templates panel and the download history carries a
      star; a strip star saves the design at the plan's size, counted as a
      download, a free account's held for its watermark; Save to library
      under the preview and in the designer's export save the ad as made;
      Save as video makes the studio's video and saves it with its photo,
      served by range on the link; a video download offers the save once the
      helper's pop-up is closed. The video maker: a signed-out star opens
      Create account and the save follows the sign-up; every gallery look has
      a star; the Library link opens the dialog there. The master library:
      a saved video ad plays, every finished design has a star, a star saves
      the render (held for the website on it), signed out it asks for an
      account at 390 px.

   usage:  node scripts/ad_library_check.mjs [--no-browser]
           FABRIC_JS=/path/fabric.min.js for part 3 when cdnjs is out of reach
           SHOT_DIR=/some/folder to keep screenshots of each screen
   Exits non-zero on any failure. */
import { readFileSync, existsSync, mkdirSync, writeFileSync, cpSync, rmSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { execSync, execFileSync, spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { join, extname } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const NO_BROWSER = process.argv.includes('--no-browser');
const { adLibraryRoute, slotOf, jpegSize, ownerKey, PART_BYTES, videoHeader } = await import(pathToFileURL(join(ROOT, 'netlify/lib/adlibrary.mjs')).href);
const bad = [];
const ok = (cond, what) => { if (!cond) bad.push(what); return cond; };
const sha256 = (b) => createHash('sha256').update(b).digest('hex');
const DAY = 86400000;

/* fixtures: real JPEGs, the library's own renders */
const renders = readdirSync(join(ROOT, 'assets/library-ads')).filter((f) => f.endsWith('.jpg')).sort();
const J = renders.slice(0, 4).map((f) => readFileSync(join(ROOT, 'assets/library-ads', f)));
const dataUrl = (b) => 'data:image/jpeg;base64,' + Buffer.from(b).toString('base64');
const resized = (b, w, h) => {      // the same JPEG, its frame header saying another size
  const c = Buffer.from(b);
  for (let i = 2; i < c.length - 9;) {
    const m = c[i + 1], len = c.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) { c.writeUInt16BE(h, i + 5); c.writeUInt16BE(w, i + 7); return c; }
    i += 2 + len;
  }
  throw new Error('no frame header');
};
ok(jpegSize(J[0]) && jpegSize(J[0]).w === 1080 && jpegSize(J[0]).h === 1080, 'jpegSize reads a 1080 render');
ok(jpegSize(Buffer.from('89504e470d0a1a0a', 'hex')) === null, 'jpegSize refuses a PNG');
/* a video fixture: bytes that open as an MP4 (ftyp at 4), the rest a pattern */
const mp4 = (n) => { const b = Buffer.alloc(n); b.set([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]); for (let i = 12; i < n; i++) b[i] = (i * 7919 + (i >> 8)) & 255; return b; };
ok(videoHeader(mp4(64)) === 'mp4' && videoHeader(Buffer.from('1a45dfa3a3428286', 'hex')) === 'webm' && videoHeader(J[0]) === null, 'videoHeader tells an MP4, a WebM and a JPEG apart');

/* ---------- 1. the router ---------- */
function memStore() {
  const m = new Map();
  return {
    m,
    get: async (k, o) => {
      if (!m.has(k)) return null;
      const v = m.get(k);
      if (o && o.type === 'arrayBuffer') return v instanceof ArrayBuffer ? v : new TextEncoder().encode(v).buffer;
      return typeof v === 'string' ? v : new TextDecoder().decode(v);
    },
    set: async (k, v) => { m.set(k, v); },
    delete: async (k) => { m.delete(k); },
  };
}
const ORIGIN = 'https://studio.example';
let clock = Date.UTC(2026, 9, 5, 12, 0, 0);
const store = memStore();
const accounts = { 'free@x.example': { plan: 'free', role: 'user' }, 'pro@x.example': { plan: 'pro', role: 'user' }, 'boss@x.example': { plan: 'free', role: 'admin' } };
let dayOk = true;
const env = { ADLIB_MAX_FREE: '3' };
const deps = (over) => Object.assign({
  store, accountsReady: true, now: () => clock,
  whoami: async (req) => { const h = req.headers.get('authorization') || ''; return h.startsWith('Bearer ') ? h.slice(7) : null; },
  account: async (em) => accounts[em] || null,
  count: async () => dayOk,
}, over || {});
async function call(method, path, opts) {
  opts = opts || {};
  const url = new URL(ORIGIN + '/api' + path);
  const headers = Object.assign({}, opts.headers || {});
  if (opts.as) headers.Authorization = 'Bearer ' + opts.as;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.raw !== undefined) headers['Content-Type'] = 'application/octet-stream';
  const body = opts.raw !== undefined ? opts.raw : opts.body === undefined ? undefined : (typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body));
  const req = new Request(url, { method, headers, body });
  const p = url.pathname.replace(/^\/api/, '').replace(/\/$/, '') || '/';
  const res = await adLibraryRoute(req, url, p, opts.env || env, deps(opts.deps));
  if (!res) return null;
  const type = res.headers.get('content-type') || '';
  const raw = method === 'HEAD' ? null : Buffer.from(await res.arrayBuffer());
  return { status: res.status, headers: res.headers, raw, body: raw && type.includes('json') ? JSON.parse(raw.toString('utf8')) : null, text: raw && !type.includes('image') && !type.includes('video') ? raw.toString('utf8') : null };
}
const pathOf = (u) => new URL(u).pathname.replace(/^\/api/, '') + new URL(u).search;

ok((await call('GET', '/me')) === null, 'a path outside /ads is not the ad library\'s');
ok((await call('GET', '/ads/mine', { as: 'free@x.example', deps: { accountsReady: false } })).status === 503, 'no JWT_SECRET: 503');
ok((await call('GET', '/ads/mine')).status === 401, 'no sign-in: 401');
ok((await call('GET', '/ads/mine', { as: 'ghost@x.example' })).status === 404, 'an unknown account: 404');

let r = await call('GET', '/ads/mine', { as: 'free@x.example' });
ok(r.status === 200 && Array.isArray(r.body.items) && r.body.items.length === 0 && r.body.limit === 3, 'mine: an empty library, the free cap from ADLIB_MAX_FREE');
const L = r.body.links;
ok(/^https:\/\/studio\.example\/master-library\.html\?feed=fd_[A-Za-z0-9_-]{24}$/.test(L.page) && L.json.endsWith('/api/ads/feed/' + L.page.split('=')[1]) && L.rss === L.json + '.rss', 'mine: page, JSON and RSS links on one feed id');
ok(r.headers.get('cache-control') === 'no-store', 'the account\'s own answers are not cached');
const feedId = L.page.split('=')[1];
ok((await call('GET', '/ads/mine', { as: 'free@x.example' })).body.links.page === L.page, 'the link stays the same until reset');

ok((await call('POST', '/ads/save', { as: 'free@x.example', body: 'not json' })).status === 400, 'save: not JSON is 400');
ok((await call('POST', '/ads/save', { as: 'free@x.example', body: { image: 'data:image/png;base64,iVBORw0KGgo=' } })).status === 400, 'save: a PNG is 400');
ok((await call('POST', '/ads/save', { as: 'free@x.example', body: { image: dataUrl(Buffer.from('ffd8ffe000104a464946', 'hex')) } })).status === 400, 'save: a broken JPEG is 400');
ok((await call('POST', '/ads/save', { as: 'free@x.example', body: { image: dataUrl(resized(J[0], 200, 200)) } })).status === 400, 'save: under 320 px is 400');
ok((await call('POST', '/ads/save', { as: 'free@x.example', body: { image: dataUrl(resized(J[0], 6000, 1080)) } })).status === 400, 'save: over 4320 px is 400');
ok((await call('POST', '/ads/save', { as: 'free@x.example', body: { image: 'data:image/jpeg;base64,' + 'A'.repeat(5700000) } })).status === 413, 'save: over 4.2 MB is 413');
ok((await call('GET', '/ads/save', { as: 'free@x.example' })).status === 404, 'save: GET is not a route');

r = await call('POST', '/ads/save', { as: 'free@x.example', body: {
  image: dataUrl(J[0]), category: 'phones', template: 'checklistHero', products: ['iphone-15-pro', 'BAD SLUG!', 'iphone-15-pro'],
  texts: [{ role: 'headline', text: 'WE BUY iPHONES' }, { role: 'badge', text: 'Cash today\u0007' }, { role: 'x'.repeat(40), text: '' }],
} });
ok(r.status === 201, 'save: a JPEG is 201 (' + r.status + ' ' + JSON.stringify(r.body).slice(0, 120) + ')');
const A = r.body.item;
ok(A && /^ad_[a-z0-9]{6,24}$/.test(A.id) && A.title === 'WE BUY iPHONES' && A.caption === 'WE BUY iPHONES' && A.category === 'phones', 'save: title and caption from the headline, the category kept');
ok(A && A.texts.length === 2 && A.texts[1].text === 'Cash today' && JSON.stringify(A.products) === '["iphone-15-pro"]', 'save: texts cleaned (control characters, empties), products de-duplicated and slug-checked');
ok(A && A.image.width === 1080 && A.image.height === 1080 && A.image.bytes === J[0].length && A.image.url === ORIGIN + '/api/ads/feed/' + feedId + '/img/' + A.id + '.jpg?v=' + sha256(J[0]).slice(0, 12), 'save: the picture\'s size, bytes and a versioned link');
ok(A && A.autopost === true && A.repost_days === 7 && A.post && A.post.slot_id === A.id + '@2026-10-05T12:00:00Z' && A.post.next_at === '2026-10-12T12:00:00Z' && A.post.round === 1, 'save: auto-post on, due now, again in 7 days');

r = await call('POST', '/ads/save', { as: 'free@x.example', body: { image: dataUrl(J[0]), title: 'again' } });
ok(r.status === 200 && r.body.duplicate === true && r.body.item.id === A.id && r.body.count === 1, 'save: the same picture twice is one ad');

r = await call('POST', '/ads/save', { as: 'free@x.example', body: { image: dataUrl(J[1]), title: 'Gold with a website', category: 'gold', hold: 'a website', autopost: true } });
const H = r.body.item;
ok(r.status === 201 && H.hold === 'a website' && H.autopost === false && H.post === null, 'save: a held picture is saved but never auto-posts');
ok((await call('POST', '/ads/update', { as: 'free@x.example', body: { id: H.id, autopost: true } })).status === 409, 'update: a held ad cannot be switched to auto-post');

dayOk = false;
ok((await call('POST', '/ads/save', { as: 'free@x.example', body: { image: dataUrl(J[2]) } })).status === 429, 'save: over the day\'s count is 429');
dayOk = true;
r = await call('POST', '/ads/save', { as: 'free@x.example', body: { image: dataUrl(J[2]), title: 'Third', category: 'silver', autopost: false } });
const C = r.body.item;
ok(r.status === 201 && C.autopost === false && C.post === null, 'save: autopost false is kept');
ok((await call('POST', '/ads/save', { as: 'free@x.example', body: { image: dataUrl(J[3]) } })).status === 507, 'save: the plan\'s cap is 507');
r = await call('GET', '/ads/mine', { as: 'pro@x.example' });
ok(r.body.limit === 300 && r.body.items.length === 0 && r.body.links.page !== L.page, 'another account: its own library, its own link, the Pro cap');
ok((await call('GET', '/ads/mine', { as: 'boss@x.example' })).body.limit === 2000, 'an operator: the admin cap');

/* the public link */
r = await call('GET', '/ads/feed/' + feedId);
ok(r.status === 200 && r.body.count === 3 && r.body.items.length === 3 && r.body.items[0].id === C.id, 'feed: every ad, newest first');
ok(r.headers.get('access-control-allow-origin') === '*' && /noindex/.test(r.headers.get('x-robots-tag') || '') && /public, max-age=60/.test(r.headers.get('cache-control') || ''), 'feed: CORS, noindex, a minute\'s cache');
ok(!JSON.stringify(r.body).includes('free@x.example') && !JSON.stringify(r.body).includes(await ownerKey('free@x.example')), 'feed: no email and no owner key in it');
ok(!r.body.items.some((x) => 'sha256' in x || 'post_from' in x), 'feed: no internal fields');
ok((await call('GET', '/ads/feed/' + feedId + '.json')).body.count === 3, 'feed: .json is the same');
ok((await call('GET', '/ads/feed/' + feedId + '?category=gold')).body.items.map((x) => x.id).join() === H.id, 'feed: ?category= filters');
ok((await call('GET', '/ads/feed/' + feedId + '?due=1')).body.items.map((x) => x.id).join() === A.id, 'feed: ?due=1 is what is due to post');
ok((await call('GET', '/ads/feed/fd_' + 'x'.repeat(24))).status === 404, 'feed: an unknown link is 404');
ok((await call('GET', '/ads/feed/nonsense')).status === 404, 'feed: a malformed link is 404');
ok((await call('POST', '/ads/feed/' + feedId, { body: {} })).status === 405, 'feed: POST is 405');

r = await call('GET', pathOf(A.image.url));
ok(r.status === 200 && r.headers.get('content-type') === 'image/jpeg' && Buffer.compare(r.raw, J[0]) === 0, 'image: byte for byte the saved JPEG');
ok(r.headers.get('cache-control') === 'public, max-age=86400' && r.headers.get('access-control-allow-origin') === '*', 'image: a versioned link caches a day, CORS');
ok((await call('GET', pathOf(A.image.url).replace(/\?v=.*/, ''))).headers.get('cache-control') === 'public, max-age=300', 'image: an unversioned link caches five minutes');
r = await call('HEAD', pathOf(A.image.url));
ok(r.status === 200 && r.headers.get('content-length') === String(J[0].length), 'image: HEAD answers its length');
ok((await call('GET', '/ads/feed/' + feedId + '/img/ad_nothere1.jpg')).status === 404, 'image: an unknown ad is 404');

const rssCheck = (xml) => {
  try { execFileSync('python3', ['-c', 'import sys,xml.etree.ElementTree as E; E.fromstring(sys.stdin.read())'], { input: xml }); return true; } catch (e) { return false; }
};
r = await call('GET', '/ads/feed/' + feedId + '.rss');
ok(r.status === 200 && /application\/rss\+xml/.test(r.headers.get('content-type')) && rssCheck(r.text), 'rss: well-formed RSS');
ok((r.text.match(/<item>/g) || []).length === 1 && r.text.includes('<guid isPermaLink="false">' + A.post.slot_id + '</guid>') && r.text.includes('<enclosure url="' + A.image.url.replace(/&/g, '&amp;') + '" length="' + J[0].length + '" type="image/jpeg"/>'), 'rss: one item, the due ad\'s slot, its picture as the enclosure');

/* the schedule */
const slotsSeen = new Set();
let posts = 0;
for (let d = 0; d <= 21; d++) {
  clock = Date.UTC(2026, 9, 5, 12, 0, 0) + d * DAY + 3600000;
  const due = (await call('GET', '/ads/feed/' + feedId + '?due=1')).body.items;
  for (const x of due) if (!slotsSeen.has(x.post.slot_id)) { slotsSeen.add(x.post.slot_id); posts++; }
}
ok(posts === 4, 'schedule: a weekly ad posts on days 0, 7, 14 and 21 (' + posts + ' posts)');
clock = Date.UTC(2026, 9, 26, 13, 0, 0);
r = await call('POST', '/ads/update', { as: 'free@x.example', body: { id: A.id, repost_days: 0 } });
ok(r.status === 200 && r.body.item.post && r.body.item.post.next_at === null && r.body.item.post.slot_id === A.id + '@2026-10-05T12:00:00Z', 'schedule: "once" is the first slot, never again');
ok((await call('POST', '/ads/update', { as: 'free@x.example', body: { id: A.id, repost_days: 4 } })).status === 400, 'update: only the offered schedules');
await call('POST', '/ads/update', { as: 'free@x.example', body: { id: A.id, autopost: false } });
r = await call('POST', '/ads/update', { as: 'free@x.example', body: { id: A.id, autopost: true, repost_days: 3, title: 'Renamed', caption: 'We buy iPhones, cash today' } });
ok(r.body.item.post.slot_id === A.id + '@2026-10-26T13:00:00Z' && r.body.item.title === 'Renamed' && r.body.item.caption === 'We buy iPhones, cash today', 'update: switched back on is due again now; title and caption change');
clock += 3 * DAY;
ok(slotOf({ id: 'ad_x', created: 0, post_from: 0, autopost: true, repost_days: 3 }, 3 * DAY).round === 2, 'slotOf: the second slot after one period');

ok((await call('POST', '/ads/settings', { as: 'free@x.example', body: { name: 'iPhones LA', repost_days: 14 } })).body.repost_days === 14, 'settings: the default schedule');
ok((await call('POST', '/ads/settings', { as: 'free@x.example', body: { repost_days: 9 } })).status === 400, 'settings: only the offered schedules');
ok((await call('GET', '/ads/feed/' + feedId)).body.name === 'iPhones LA', 'settings: the name is on the public link');

r = await call('POST', '/ads/remove', { as: 'free@x.example', body: { id: C.id } });
ok(r.status === 200 && r.body.count === 2, 'remove: gone from the library');
ok((await call('GET', '/ads/feed/' + feedId + '/img/' + C.id + '.jpg')).status === 404 && ![...store.m.keys()].some((k) => k.endsWith(':' + C.id)), 'remove: its picture is deleted');
ok((await call('POST', '/ads/remove', { as: 'free@x.example', body: { id: C.id } })).status === 404, 'remove: twice is 404');
const proSaved = await call('POST', '/ads/save', { as: 'pro@x.example', body: { image: dataUrl(J[3]) } });
ok(proSaved.status === 201 && proSaved.body.item.repost_days === 7, 'a new library posts weekly by default');
ok((await call('POST', '/ads/save', { as: 'free@x.example', body: { image: dataUrl(J[3]) } })).body.item.repost_days === 14, 'settings: the next save takes the default');
ok((await call('POST', '/ads/remove', { as: 'pro@x.example', body: { id: H.id } })).status === 404, 'remove: another account\'s ad is not yours');

r = await call('POST', '/ads/link/reset', { as: 'free@x.example', body: {} });
const newFeed = r.body.links.page.split('=')[1];
ok(r.status === 200 && newFeed !== feedId, 'reset: a new link');
ok((await call('GET', '/ads/feed/' + feedId)).status === 404 && (await call('GET', '/ads/feed/' + feedId + '/img/' + A.id + '.jpg')).status === 404, 'reset: the old link and its pictures stop answering');
r = await call('GET', '/ads/feed/' + newFeed);
ok(r.status === 200 && r.body.count === 3 && (await call('GET', pathOf(r.body.items.find((x) => x.id === A.id).image.url))).status === 200, 'reset: the new link has the same ads and pictures');

/* a video on an ad */
const V = mp4(PART_BYTES * 2 + 12345);      // three parts: two full, one short
const vsha = sha256(V);
const begin = (body, as) => call('POST', '/ads/video/begin', { as: as || 'free@x.example', body });
const part = (id, n, bytes, as) => call('POST', '/ads/video/part?id=' + id + '&n=' + n, { as: as || 'free@x.example', raw: bytes });
const done = (id, as) => call('POST', '/ads/video/done', { as: as || 'free@x.example', body: { id } });
const sendAll = async (id, bytes, as) => { const n = Math.ceil(bytes.length / PART_BYTES); for (let i = 0; i < n; i++) { const pr = await part(id, i, bytes.subarray(i * PART_BYTES, (i + 1) * PART_BYTES), as); if (pr.status !== 200) return pr; } return done(id, as); };
ok((await begin({ id: A.id, format: 'avi', bytes: V.length, w: 1080, h: 1080, sha256: vsha })).status === 400, 'video: only MP4 or WebM');
ok((await begin({ id: A.id, format: 'mp4', bytes: 50 * 1024 * 1024, w: 1080, h: 1080, sha256: vsha })).status === 413, 'video: over 40 MB is 413');
ok((await begin({ id: A.id, format: 'mp4', bytes: V.length, w: 100, h: 100, sha256: vsha })).status === 400, 'video: under 320 px is 400');
ok((await begin({ id: A.id, format: 'mp4', bytes: V.length, w: 1080, h: 1080, sha256: 'nope' })).status === 400, 'video: the hash is required');
ok((await begin({ id: 'ad_nothere1', format: 'mp4', bytes: V.length, w: 1080, h: 1080, sha256: vsha })).status === 404, 'video: an unknown ad is 404');
ok((await begin({ id: A.id, format: 'mp4', bytes: V.length, w: 1080, h: 1080, sha256: vsha }, 'pro@x.example')).status === 404, 'video: another account\'s ad is not yours');
ok((await part(A.id, 0, V.subarray(0, PART_BYTES))).status === 409, 'video: a part before begin is 409');
r = await begin({ id: A.id, format: 'mp4', bytes: V.length, w: 1080, h: 1080, seconds: 10, sha256: vsha });
ok(r.status === 201 && r.body.part_bytes === PART_BYTES && r.body.count === 3, 'video: begin says the part size and the count (' + r.status + ')');
ok((await done(A.id)).status === 409, 'video: done before the parts is 409');
ok((await part(A.id, 3, V.subarray(0, 10))).status === 400, 'video: a part past the count is 400');
ok((await part(A.id, 0, V.subarray(0, 100))).status === 400, 'video: a part of the wrong size is 400');
ok((await part(A.id, 0, V.subarray(0, PART_BYTES), 'pro@x.example')).status === 404, 'video: a part on another account\'s ad is 404');
for (let i = 0; i < 3; i++) { const pr = await part(A.id, i, V.subarray(i * PART_BYTES, (i + 1) * PART_BYTES)); ok(pr.status === 200 && pr.body.have === i + 1 && pr.body.count === 3, 'video: part ' + i + ' lands (' + pr.status + ')'); }
r = await done(A.id);
const AV = r.body && r.body.item;
ok(r.status === 201 && AV && AV.kind === 'video' && AV.video && AV.video.bytes === V.length && AV.video.format === 'mp4' && AV.video.seconds === 10 && AV.video.width === 1080 && AV.video.url === ORIGIN + '/api/ads/feed/' + newFeed + '/video/' + A.id + '.mp4?v=' + vsha.slice(0, 12), 'video: done joins the parts and the ad is a video ad (' + r.status + ' ' + JSON.stringify(r.body).slice(0, 160) + ')');
ok(AV && AV.image && AV.image.url && AV.title === 'Renamed', 'video: the photo and the words stay as they were');
ok(![...store.m.keys()].some((k) => k.startsWith('vp:') || k.startsWith('vu:')), 'video: the parts and the upload record are gone once joined');
ok((await done(A.id)).status === 409, 'video: done twice is 409');
r = await call('GET', pathOf(AV.video.url));
ok(r.status === 200 && r.headers.get('content-type') === 'video/mp4' && Buffer.compare(r.raw, V) === 0 && r.headers.get('accept-ranges') === 'bytes' && r.headers.get('cache-control') === 'public, max-age=86400' && r.headers.get('access-control-allow-origin') === '*', 'video: the public link serves it byte for byte, cached a day, CORS');
ok((await call('GET', pathOf(AV.video.url).replace(/\?v=.*/, ''))).headers.get('cache-control') === 'public, max-age=300', 'video: an unversioned link caches five minutes');
r = await call('HEAD', pathOf(AV.video.url));
ok(r.status === 200 && r.headers.get('content-length') === String(V.length), 'video: HEAD answers its length');
r = await call('GET', '/ads/feed/' + newFeed + '/video/' + A.id + '.mp4', { headers: { Range: 'bytes=10-19' } });
ok(r.status === 206 && r.raw.length === 10 && Buffer.compare(r.raw, V.subarray(10, 20)) === 0 && r.headers.get('content-range') === 'bytes 10-19/' + V.length && r.headers.get('content-length') === '10', 'video: a byte range answers 206');
r = await call('GET', '/ads/feed/' + newFeed + '/video/' + A.id + '.mp4', { headers: { Range: 'bytes=' + (V.length - 5) + '-' } });
ok(r.status === 206 && r.raw.length === 5 && Buffer.compare(r.raw, V.subarray(V.length - 5)) === 0, 'video: an open-ended range answers the tail');
ok((await call('GET', '/ads/feed/' + newFeed + '/video/' + A.id + '.mp4', { headers: { Range: 'bytes=' + V.length + '-' } })).status === 416, 'video: a range past the end is 416');
ok((await call('GET', '/ads/feed/' + newFeed + '/video/' + A.id + '.webm')).status === 404, 'video: the other extension is 404');
ok((await call('GET', '/ads/feed/' + newFeed + '/video/ad_nothere1.mp4')).status === 404, 'video: an unknown ad is 404');
r = await call('GET', '/ads/feed/' + newFeed);
ok(r.body.items.find((x) => x.id === A.id).kind === 'video' && r.body.items.filter((x) => x.kind === 'photo').length === 2 && r.body.items.every((x) => 'video' in x && 'source' in x), 'feed: kind, video and source on every ad');
ok((await call('GET', '/ads/feed/' + newFeed + '?kind=video')).body.items.map((x) => x.id).join() === A.id && (await call('GET', '/ads/feed/' + newFeed + '?kind=photo')).body.items.length === 2, 'feed: ?kind= filters');
ok(!JSON.stringify(r.body).includes(vsha), 'feed: the video\'s full hash is not in it');
r = await call('GET', '/ads/feed/' + newFeed + '.rss');
ok(r.status === 200 && rssCheck(r.text) && r.text.includes('<media:content url="' + AV.video.url.replace(/&/g, '&amp;') + '" type="video/mp4" medium="video" width="1080" height="1080" duration="10"/>') && r.text.includes('<enclosure url="' + AV.image.url.replace(/&/g, '&amp;') + '"'), 'rss: the video rides as media:content beside the picture\'s enclosure');
/* a damaged upload leaves the ad as it was */
r = await begin({ id: A.id, format: 'mp4', bytes: V.length, w: 1080, h: 1080, sha256: sha256(mp4(100)) });
r = await sendAll(A.id, V);
ok(r.status === 400 && /damaged/.test(r.body.error) && (await call('GET', pathOf(AV.video.url))).status === 200, 'video: a hash that differs is refused and the old video stays');
r = await begin({ id: A.id, format: 'webm', bytes: V.length, w: 1080, h: 1080, sha256: vsha });
r = await sendAll(A.id, V);
ok(r.status === 400 && /WebM/.test(r.body.error), 'video: MP4 bytes sent as WebM are refused');
ok(![...store.m.keys()].some((k) => k.startsWith('vp:') || k.startsWith('vu:')), 'video: a refused upload leaves no parts behind');
/* a shorter video replaces it, one part */
const V2 = mp4(4321);
r = await begin({ id: A.id, format: 'mp4', bytes: V2.length, w: 1080, h: 1350, seconds: 6, sha256: sha256(V2) });
ok(r.status === 201 && r.body.count === 1, 'video: a short clip is one part');
r = await sendAll(A.id, V2);
ok(r.status === 201 && r.body.item.video.bytes === V2.length && r.body.item.video.height === 1350 && (await call('GET', pathOf(r.body.item.video.url))).status === 200 && (await call('GET', pathOf(AV.video.url))).status === 200 && Buffer.compare((await call('GET', pathOf(AV.video.url))).raw, V2) === 0, 'video: the new clip replaces the old one');
/* remove the video, the ad stays a photo */
r = await call('POST', '/ads/video/remove', { as: 'free@x.example', body: { id: A.id } });
ok(r.status === 200 && r.body.item.kind === 'photo' && r.body.item.video === null && (await call('GET', pathOf(AV.video.url))).status === 404 && ![...store.m.keys()].some((k) => k.startsWith('v:')), 'video: removed, the ad is a photo ad again and the bytes are gone');
ok((await call('POST', '/ads/video/remove', { as: 'free@x.example', body: { id: A.id } })).status === 404, 'video: removing twice is 404');
/* an ad removed takes its video */
r = await call('POST', '/ads/save', { as: 'pro@x.example', body: { image: dataUrl(J[2]), title: 'Pro video', source: 'motion' } });
const PV = r.body.item;
ok(r.status === 201 && PV.source === 'motion' && PV.kind === 'photo', 'save: the source is kept, a new ad is a photo ad');
await begin({ id: PV.id, format: 'mp4', bytes: V2.length, w: 1080, h: 1080, sha256: sha256(V2) }, 'pro@x.example');
r = await sendAll(PV.id, V2, 'pro@x.example');
const proOwner = await ownerKey('pro@x.example');
ok(r.status === 201 && [...store.m.keys()].some((k) => k === 'v:' + proOwner + ':' + PV.id), 'video: on another account\'s ad');
await call('POST', '/ads/remove', { as: 'pro@x.example', body: { id: PV.id } });
ok(![...store.m.keys()].some((k) => k.endsWith(':' + PV.id)), 'remove: an ad takes its video with it');

/* ---------- 2. the real function ---------- */
{
  const T = join(tmpdir(), 'adlib-api-' + process.pid);
  rmSync(T, { recursive: true, force: true });
  mkdirSync(join(T, 'netlify'), { recursive: true });
  cpSync(join(ROOT, 'netlify'), join(T, 'netlify'), { recursive: true });
  mkdirSync(join(T, 'node_modules/@netlify/blobs'), { recursive: true });
  writeFileSync(join(T, 'node_modules/@netlify/blobs/package.json'), JSON.stringify({ name: '@netlify/blobs', type: 'module', main: 'index.js' }));
  writeFileSync(join(T, 'node_modules/@netlify/blobs/index.js'), [
    'const all = new Map();',
    'export const getStore = (o) => { const n = typeof o === "string" ? o : o.name; if (!all.has(n)) all.set(n, new Map()); const m = all.get(n);',
    '  return { get: async (k, op) => { if (!m.has(k)) return null; const v = m.get(k); if (op && op.type === "arrayBuffer") return v instanceof ArrayBuffer ? v : new TextEncoder().encode(v).buffer; return typeof v === "string" ? v : new TextDecoder().decode(v); },',
    '    set: async (k, v) => { m.set(k, v); }, delete: async (k) => { m.delete(k); }, list: async () => ({ blobs: [] }) }; };',
  ].join('\n'));
  process.env.JWT_SECRET = 'adlib-check-' + 'x'.repeat(32);
  process.env.ADMIN_EMAILS = 'boss@studio.example,owner@studio.example';
  const api = (await import(pathToFileURL(join(T, 'netlify/functions/api.mjs')).href)).default;
  globalThis.__adlibApi = api;
  const hit = async (method, path, body, token) => {
    const res = await api(new Request('https://studio.example/api' + path, {
      method, headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}),
      body: body ? JSON.stringify(body) : undefined,
    }));
    const b = Buffer.from(await res.arrayBuffer());
    let j = null; try { j = JSON.parse(b.toString('utf8')); } catch (e) {}
    return { status: res.status, json: j, raw: b, headers: res.headers };
  };
  const su = await hit('POST', '/auth/signup', { email: 'boss@studio.example', password: 'a-long-password' });
  ok(su.status === 200 && su.json.token, 'function: sign up');
  ok((await hit('GET', '/ads/mine')).status === 401, 'function: /ads/mine asks for a sign-in');
  const sv = await hit('POST', '/ads/save', { image: dataUrl(J[0]), category: 'phones' }, su.json.token);
  ok(sv.status === 201 && sv.json.item.autopost, 'function: an operator saves an ad set to post (' + sv.status + ')');
  const mine = await hit('GET', '/ads/mine', null, su.json.token);
  ok(mine.json.limit === 2000 && mine.json.items.length === 1, 'function: the operator\'s library and cap');
  const fid = mine.json.links.json.split('/').pop();
  const fd = await hit('GET', '/ads/feed/' + fid);
  ok(fd.status === 200 && fd.json.items[0].id === sv.json.item.id, 'function: the public link answers without a sign-in');
  const img = await hit('GET', new URL(fd.json.items[0].image.url).pathname.replace(/^\/api/, ''));
  ok(img.status === 200 && Buffer.compare(img.raw, J[0]) === 0, 'function: the picture through the function, byte for byte');
  const vb = mp4(PART_BYTES + 777), vs = sha256(vb);
  const b1 = await hit('POST', '/ads/video/begin', { id: sv.json.item.id, format: 'mp4', bytes: vb.length, w: 1080, h: 1080, seconds: 10, sha256: vs }, su.json.token);
  ok(b1.status === 201 && b1.json.count === 2, 'function: a video upload begins (' + b1.status + ')');
  for (let i = 0; i < 2; i++) {
    const res = await api(new Request('https://studio.example/api/ads/video/part?id=' + sv.json.item.id + '&n=' + i, { method: 'POST', headers: { Authorization: 'Bearer ' + su.json.token, 'Content-Type': 'application/octet-stream' }, body: vb.subarray(i * PART_BYTES, (i + 1) * PART_BYTES) }));
    ok(res.status === 200, 'function: video part ' + i + ' (' + res.status + ')');
  }
  const dn = await hit('POST', '/ads/video/done', { id: sv.json.item.id }, su.json.token);
  ok(dn.status === 201 && dn.json.item.kind === 'video' && dn.json.item.video.bytes === vb.length, 'function: the video is joined (' + dn.status + ')');
  const vid = await hit('GET', new URL(dn.json.item.video.url).pathname.replace(/^\/api/, ''));
  ok(vid.status === 200 && Buffer.compare(vid.raw, vb) === 0, 'function: the video through the function, byte for byte');
  ok((await hit('GET', '/ads/feed/' + fid)).json.items[0].kind === 'video', 'function: the public link names it a video ad');
  ok((await hit('GET', '/me')).status === 401, 'function: /me still asks for a sign-in');
  ok((await hit('GET', '/library/v1')).status === 503, 'function: the partner library still answers first (no keys: 503)');

  /* 2b. iPhones LA's worker (docs/iphonesla-library/autopost_worker.py) on
     this link, over HTTP: it posts the due ad once, and not again until its
     next slot. Its own tests (test_autopost.py) run here too. */
  const srv = await serveApi(api);
  const HAND = join(ROOT, 'docs/iphonesla-library');
  const W = join(tmpdir(), 'adlib-worker-' + process.pid);
  rmSync(W, { recursive: true, force: true }); mkdirSync(W, { recursive: true });
  writeFileSync(join(W, 'shop_post.py'), 'import json, os\ndef post(ad, jpeg, repost, video=None):\n    with open(os.path.join(os.path.dirname(__file__), "posted.jsonl"), "a") as f:\n        f.write(json.dumps({"id": ad["id"], "repost": repost, "kind": ad.get("kind"), "video": len(video) if video else None, "bytes": len(jpeg), "jpeg": jpeg[:3] == bytes([255, 216, 255])}) + "\\n")\n    return "listing-1"\n');
  const pageLink = mine.json.links.page.replace('https://studio.example', srv.base);
  let workerLog = '';
  const runWorker = () => new Promise((resolve) => {
    const c = spawn('python3', [join(HAND, 'autopost_worker.py'), '--once', '--state', join(W, 'state.json'), '--post', 'shop_post:post'],
      { env: Object.assign({}, process.env, { BUYBACKAD_FEED_URL: pageLink, PYTHONPATH: W + ':' + HAND, PYTHONDONTWRITEBYTECODE: '1' }) });
    c.stdout.on('data', (d) => { workerLog += d; }); c.stderr.on('data', (d) => { workerLog += d; });
    c.on('close', resolve);
  });
  try {
    await runWorker(); await runWorker();
    if (!existsSync(join(W, 'posted.jsonl'))) throw new Error('nothing posted: ' + workerLog.slice(-400));
    const lines = readFileSync(join(W, 'posted.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    ok(lines.length === 1 && lines[0].id === sv.json.item.id && !lines[0].repost && lines[0].jpeg && lines[0].bytes === J[0].length, 'worker: the due ad posted once, its JPEG whole (' + JSON.stringify(lines) + ')');
    ok(lines.length === 1 && lines[0].kind === 'video' && lines[0].video === vb.length, 'worker: a video ad\'s clip reaches a post() that takes one, whole (' + JSON.stringify(lines) + ')');
    const st = JSON.parse(readFileSync(join(W, 'state.json'), 'utf8')).slots;
    ok(Object.keys(st).length === 1 && st[sv.json.item.post.slot_id] && st[sv.json.item.post.slot_id].ref === 'listing-1', 'worker: the slot and the listing id are kept');
  } catch (e) { ok(false, 'worker: ' + String(e.stderr || e.message).slice(0, 300)); }
  try { execFileSync('python3', ['-m', 'unittest', 'test_autopost'], { cwd: HAND, env: Object.assign({}, process.env, { PYTHONDONTWRITEBYTECODE: '1' }), stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { ok(false, 'test_autopost.py: ' + String(e.stderr || e.message).slice(-400)); }
  srv.close();
  rmSync(W, { recursive: true, force: true });
  rmSync(T, { recursive: true, force: true });
}

/* ---------- 3. the browser ---------- */
if (!NO_BROWSER) await browserPart();

if (bad.length) {
  console.log('AD LIBRARY: ' + bad.length + ' failure(s)');
  bad.forEach((b) => console.log('  - ' + b));
  process.exit(1);
}
console.log('AD LIBRARY: no failures');

async function serveApi(api, csp) {
  const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp3': 'audio/mpeg', '.ttf': 'font/ttf' };
  const server = createServer(async (req, res) => {
    try {
      const u = new URL(req.url, 'http://127.0.0.1');
      if (u.pathname.startsWith('/api/')) {
        const chunks = []; for await (const c of req) chunks.push(c);
        const r = await api(new Request(u.href.replace('http://127.0.0.1', 'http://' + req.headers.host), { method: req.method, headers: req.headers, body: chunks.length ? Buffer.concat(chunks) : undefined }));
        const h = {}; r.headers.forEach((v, k) => { h[k] = v; });
        if (process.env.ADLIB_DEBUG) console.log('api', req.method, u.pathname, r.status);
        res.writeHead(r.status, h); res.end(Buffer.from(await r.arrayBuffer())); return;
      }
      let f = join(ROOT, decodeURIComponent(u.pathname));
      if (u.pathname.endsWith('/')) f = join(f, 'index.html');
      if (!f.startsWith(ROOT) || !existsSync(f)) { res.writeHead(404); res.end('404'); return; }
      res.writeHead(200, Object.assign({ 'Content-Type': TYPES[extname(f)] || 'application/octet-stream' }, csp ? { 'Content-Security-Policy': csp } : {}));
      res.end(readFileSync(f));
    } catch (e) { if (process.env.ADLIB_DEBUG) console.log('server error', e); res.writeHead(500); res.end(String(e)); }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { base: 'http://localhost:' + server.address().port, close: () => server.close() };
}

async function shot(page, name) {
  if (!process.env.SHOT_DIR) return;
  mkdirSync(process.env.SHOT_DIR, { recursive: true });
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(process.env.SHOT_DIR, name + '.png') });
}

async function browserPart() {
  let chromium;
  try { ({ chromium } = await import('playwright')); }
  catch (e) {
    const g = execSync('npm root -g').toString().trim();
    ({ chromium } = await import(pathToFileURL(join(g, 'playwright/index.mjs')).href));
  }
  const csp = (readFileSync(join(ROOT, '_headers'), 'utf8').match(/Content-Security-Policy:\s*(.+)/) || [])[1];
  const srv = await serveApi(globalThis.__adlibApi, csp);
  const BASE = srv.base;
  let fabricJs = null;
  if (process.env.FABRIC_JS) fabricJs = readFileSync(process.env.FABRIC_JS);
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
  const errors = [];
  const newPage = async (w, shop) => {
    const ctx = await browser.newContext({ viewport: { width: w || 1280, height: 900 }, acceptDownloads: true });
    const page = await ctx.newPage();
    await page.route('**/*', (route) => {
      const url = route.request().url();
      if (url.startsWith(BASE)) return route.continue();
      if (shop && url.startsWith('https://iphones.la/')) return shop(route);
      if (/fabric(\.min)?\.js/.test(url) && fabricJs) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fabricJs });
      return route.abort();
    });
    page.on('console', (m) => { if (m.type() === 'error' && /Content Security Policy|Refused to/.test(m.text())) errors.push(m.text().slice(0, 200)); });
    page.on('pageerror', (e) => { if (/ad-library|master-library/.test(String(e.stack || ''))) errors.push('page error: ' + e.message); });
    return page;
  };
  try {
    for (const who of [{ email: 'shop@studio.example', admin: false }, { email: 'owner@studio.example', admin: true }]) {
      const page = await newPage();
      await page.goto(BASE + '/index.html');
      await page.waitForFunction(() => typeof window.addHistory === 'function' && window.adLibrary, null, { timeout: 30000 });
      const token = await page.evaluate(async (w) => {
        let r = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: w.email, password: 'a-long-password' }) });
        return (await r.json()).token;
      }, who);
      ok(!!token, 'browser: ' + who.email + ' signed in');
      await page.evaluate((t) => localStorage.setItem('pgfx_token', JSON.stringify(t)), token);
      await page.goto(BASE + '/index.html');
      await page.waitForFunction(() => typeof window.showEasy === 'function' && window.adLibrary, null, { timeout: 30000 });
      await page.evaluate(() => showEasy(null));      // the studio loads the account as it opens
      await page.waitForFunction(() => { try { return !!account; } catch (e) { return false; } }, null, { timeout: 30000 });
      const hasFabric = await page.evaluate(() => typeof fabric !== 'undefined');
      // a download, the studio's own path
      const made = await page.evaluate(async () => {
        const tpl = TEMPLATES.find((t) => t.cat === 'phones' && !t.premium) || TEMPLATES.find((t) => t.cat === 'phones');
        showEasy(tpl.id);
        document.getElementById('ez-phone').value = '(562) 999-4994';
        document.getElementById('ez-phone').dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise((r) => setTimeout(r, 400));
        const before = (await histList()).length;
        await ezDownload(true);
        await new Promise((r) => setTimeout(r, 800));
        return { tpl: tpl.id, before, after: (await histList()).length };
      });
      ok(made.after === made.before + 1, 'browser (' + who.email + '): an Easy Mode download (' + JSON.stringify(made) + ', fabric ' + hasFabric + ')');
      // the studio may ask for the shop's area on the way in; a person answers it first
      await page.evaluate(() => document.querySelectorAll('.modal-overlay.show').forEach((m) => m.classList.remove('show')));
      const ask = page.locator('.adl-ask');
      await ask.waitFor({ timeout: 10000 }).catch(() => {});
      if (!ok(await ask.isVisible(), 'browser (' + who.email + '): the download offers "Save to library"')) { await page.context().close(); continue; }
      await ask.getByRole('button', { name: 'Save to library' }).click();
      await page.waitForFunction(() => !document.querySelector('.adl-ask'), null, { timeout: 20000 });
      await page.click('#nav-adlib');
      await page.waitForFunction(() => { const i = document.querySelector('#adlib-overlay .adl-grid .adl-card img'); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 20000 });
      const dlg = await page.evaluate(() => {
        const o = document.getElementById('adlib-overlay');
        const card = o.querySelector('.adl-grid .adl-card');
        return { link: o.querySelector('.adl-link input').value, cards: o.querySelectorAll('.adl-grid')[0].children.length,
          held: card.querySelector('.adl-hold') ? card.querySelector('.adl-hold').textContent : '', auto: !!card.querySelector('input[type=checkbox]') && card.querySelector('input[type=checkbox]').checked,
          img: card.querySelector('img').naturalWidth };
      });
      ok(dlg.cards === 1 && dlg.img > 0 && /master-library\.html\?feed=fd_/.test(dlg.link), 'browser (' + who.email + '): the Library dialog shows the saved ad and the public link (' + JSON.stringify(dlg) + ')');
      await shot(page, 'dialog-' + (who.admin ? 'operator' : 'free'));
      if (who.admin) ok(dlg.auto && !dlg.held, 'browser: an operator\'s ad is set to auto-post');
      else ok(/watermark/.test(dlg.held), 'browser: a free account\'s watermarked ad is held from auto-post (' + dlg.held + ')');
      const feedUrl = dlg.link.replace(/^https?:\/\/[^/]+/, BASE);
      const pub = await newPage();
      await pub.goto(feedUrl);
      await pub.waitForFunction(() => { const i = document.querySelector('#grid-saved .ml-card img'); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 20000 });
      const view = await pub.evaluate(() => ({ cards: document.querySelectorAll('#grid-saved .ml-card').length, feed: document.getElementById('ml-feed').textContent, finishedTab: document.querySelector('.ml-tabs').hidden && document.getElementById('sec-finished').hidden, img: document.querySelector('#grid-saved .ml-card img').naturalWidth, title: document.getElementById('ml-title').textContent }));
      await shot(pub, 'public-' + (who.admin ? 'operator' : 'free'));
      ok(view.cards === 1 && view.img > 0 && /JSON feed/.test(view.feed) && view.finishedTab, 'browser (' + who.email + '): the public page shows the ad and the feed, nothing of the owner\'s (' + JSON.stringify(view) + ')');
      await pub.context().close();
      await page.context().close();
    }
    // the link goes to iPhones LA by itself, over the studio's connection to the
    // shop (iphonesla-link.js): at start, and again after a reset. A shop that
    // cannot take it yet is told so in the dialog.
    for (const libStatus of [200, 404]) {
      try {
        const got = [];
        const cors = { 'Access-Control-Allow-Origin': BASE, 'Access-Control-Allow-Headers': 'authorization, content-type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
        const page = await newPage(1280, (route) => {
          const rq = route.request(), u = new URL(rq.url());
          if (rq.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
          if (u.pathname === '/api/buy-ads/studio/library') {
            got.push({ auth: rq.headers().authorization || '', body: JSON.parse(rq.postData() || '{}') });
            return route.fulfill({ status: libStatus, headers: cors, contentType: 'application/json', body: '{"ok":true}' });
          }
          return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: '{}' });
        });
        const email = 'linked' + libStatus + '@studio.example';
        await page.goto(BASE + '/index.html');
        await page.waitForFunction(() => window.adLibrary && window.iplaLink, null, { timeout: 30000 });
        const token = await page.evaluate(async (em) => (await (await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: em, password: 'a-long-password' }) })).json()).token, email);
        await page.evaluate((t) => {
          localStorage.setItem('pgfx_token', JSON.stringify(t));
          localStorage.setItem('ipla_link', JSON.stringify({ token: 'gfx_' + 'T'.repeat(30), connectedAt: '2026-10-06T00:00:00.000Z' }));
        }, token);
        await page.goto(BASE + '/index.html');      // nobody opens the Library: the studio sends the link as it starts
        const t0 = Date.now();
        while (!got.length && Date.now() - t0 < 30000) await page.waitForTimeout(250);
        const mine = await page.evaluate(async () => (await (await fetch('/api/ads/mine', { headers: { Authorization: 'Bearer ' + JSON.parse(localStorage.getItem('pgfx_token')) } })).json()).links.page);
        ok(got.length === 1 && got[0].body.feed_url === mine && got[0].body.site === BASE && got[0].auth === 'Bearer gfx_' + 'T'.repeat(30),
          'link (' + libStatus + '): sent to iPhones LA as the studio starts, with the connection token (' + JSON.stringify(got) + ')');
        await page.evaluate(() => window.adLibrary.open());
        await page.waitForSelector('#adlib-overlay .adl-share', { timeout: 20000 });
        await page.waitForTimeout(800);
        const line = await page.evaluate(() => document.querySelector('#adlib-overlay .adl-share').textContent);
        ok(libStatus === 200 ? /iPhones LA has this link/.test(line) : /cannot take the link yet/.test(line), 'link (' + libStatus + '): the dialog says so (' + line + ')');
        if (libStatus === 200) {
          ok(got.length === 1, 'link: opening the Library does not send it again (' + got.length + ')');
          await shot(page, 'dialog-linked');
          await page.evaluate(async () => { await fetch('/api/ads/link/reset', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + JSON.parse(localStorage.getItem('pgfx_token')) }, body: '{}' }); await window.adLibrary.load(); });
          const t1 = Date.now();
          while (got.length < 2 && Date.now() - t1 < 15000) await page.waitForTimeout(250);
          const fresh = await page.evaluate(async () => (await (await fetch('/api/ads/mine', { headers: { Authorization: 'Bearer ' + JSON.parse(localStorage.getItem('pgfx_token')) } })).json()).links.page);
          ok(got.length === 2 && got[1].body.feed_url === fresh && fresh !== mine, 'link: a reset sends the new link by itself (' + got.length + ')');
        }
        await page.context().close();
      } catch (e) { ok(false, 'link (' + libStatus + '): ' + String(e.message || e).split('\n')[0]); }
    }

    // the owner's master library: saved and finished, and at phone width
    try {
      const page = await newPage(390);
      await page.goto(BASE + '/index.html');
      const token = await page.evaluate(async () => (await (await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'owner@studio.example', password: 'a-long-password' }) })).json()).token);
      await page.evaluate((t) => localStorage.setItem('pgfx_token', JSON.stringify(t)), token);
      await page.goto(BASE + '/master-library.html');
      await page.waitForSelector('#grid-saved .ml-card', { timeout: 20000 });
      await page.click('#tab-finished');
      await page.waitForSelector('#grid-finished .ml-card img', { timeout: 20000 });
      // the site's own test for an offered card, read out of app.js, so the page cannot drift from it
      const liveSrc = (readFileSync(join(ROOT, 'app.js'), 'utf8').match(/function scIsLive\(c\)\{[^\n]*\}/) || [])[0];
      ok(liveSrc, 'scIsLive is not where it was in app.js');
      const scIsLive = new Function(liveSrc + '; return scIsLive;')();
      const offered = JSON.parse(readFileSync(join(ROOT, 'assets/showcase/index.json'), 'utf8')).filter((c) => scIsLive(c) && c.thumb).length;
      const m = await page.evaluate(() => ({ count: document.getElementById('count-finished').textContent, shown: document.querySelectorAll('#grid-finished .ml-card').length, wide: document.documentElement.scrollWidth - window.innerWidth, chips: document.querySelectorAll('#chips-finished button').length, saved: document.querySelectorAll('#grid-saved .ml-card').length }));
      ok(m.count.startsWith(offered + ' designs offered') && m.shown === Math.min(60, offered) && m.chips > 2, 'browser: the finished designs are every offered card (' + JSON.stringify(m) + ', ' + offered + ' offered)');
      await shot(page, 'master-finished-390');
      await page.click('#tab-saved'); await shot(page, 'master-saved-390'); await page.click('#tab-finished');
      ok(m.wide <= 0, 'browser: no sideways scroll on the master library at 390 px (' + m.wide + ')');
      await page.fill('#q-finished', 'gold');
      const g = await page.evaluate(() => document.getElementById('count-finished').textContent);
      ok(/ of \d+ shown/.test(g), 'browser: search narrows the finished designs (' + g + ')');
      await page.goto(BASE + '/index.html');
      await page.waitForFunction(() => window.adLibrary, null, { timeout: 30000 });
      await page.evaluate(() => window.adLibrary.open());   // before Easy Mode has loaded the account: the dialog loads it
      await page.waitForSelector('#adlib-overlay .adl-card', { timeout: 20000 });
      const w = await page.evaluate(() => { const md = document.querySelector('#adlib-overlay .modal'); return { over: md.scrollWidth - md.clientWidth, page: document.documentElement.scrollWidth - window.innerWidth }; });
      await shot(page, 'dialog-390');
      ok(w.over <= 0 && w.page <= 0, 'browser: the Library dialog fits a phone (' + JSON.stringify(w) + ')');
      await page.context().close();
    } catch (e) { ok(false, 'browser: the master library: ' + String(e.message || e).split('\n')[0]); }

    /* 3b. the stars: every ad has one, and it saves (owner, 2026-10-06);
       an account from the landing page, Create account first */
    try {
      const page = await newPage();
      await page.goto(BASE + '/index.html');
      await page.waitForFunction(() => typeof window.showEasy === 'function' && window.adLibrary && window.pgfxAccount, null, { timeout: 30000 });
      await page.waitForFunction(() => document.querySelectorAll('#lp-tpl-grid .tpl-card').length > 0, null, { timeout: 30000 });
      await page.waitForTimeout(600);
      const lp = await page.evaluate(() => ({ cards: document.querySelectorAll('#lp-tpl-grid .tpl-card').length, stars: document.querySelectorAll('#lp-tpl-grid .tpl-card .adl-star').length }));
      ok(lp.cards > 0 && lp.stars === lp.cards, 'stars: every card in the landing gallery (' + JSON.stringify(lp) + ')');
      await page.click('#lp-signup');
      await page.waitForSelector('#auth-overlay.show', { timeout: 5000 });
      await page.evaluate(() => { document.getElementById('auth-overlay').classList.remove('show'); openAuth('Sign in to download'); });
      const tab = await page.evaluate(() => ({ up: document.getElementById('auth-tab-up').classList.contains('active'), go: document.getElementById('auth-go').textContent }));
      ok(tab.up && tab.go === 'Create account', 'account: a device that never signed in opens on Create account (' + JSON.stringify(tab) + ')');
      await page.fill('#auth-email', 'star@studio.example'); await page.fill('#auth-pass', 'a-long-password');
      await page.click('#auth-go');
      await page.waitForFunction(() => document.getElementById('auth-type').style.display !== 'none', null, { timeout: 15000 }).catch(() => {});
      await page.click('#at-free').catch(() => {});
      await page.waitForFunction(() => { try { return !!account; } catch (e) { return false; } }, null, { timeout: 15000 }).catch(() => {});
      const made = await page.evaluate(() => { try { return { email: account && account.email, seen: localStorage.getItem('pgfx_seen_account') }; } catch (e) { return null; } });
      ok(made && made.email === 'star@studio.example' && made.seen === 'true', 'account: created from the landing page, before Easy Mode opened (' + JSON.stringify(made) + ')');
      await page.evaluate(() => openAuth('again'));
      ok(await page.evaluate(() => document.getElementById('auth-tab-in').classList.contains('active')), 'account: a device that has signed in opens on Sign in');
      await page.evaluate(() => { document.getElementById('auth-overlay').classList.remove('show'); showEasy(null); });
      await page.waitForTimeout(1500);
      await page.evaluate(() => document.querySelectorAll('.modal-overlay.show').forEach((m) => m.classList.remove('show')));
      const strip = await page.evaluate(() => ({ tiles: document.querySelectorAll('#ez-strip .ez-tpl').length, stars: document.querySelectorAll('#ez-strip .ez-tpl .adl-star').length, buttons: !!document.getElementById('ez-star') && !!document.getElementById('ez-star-video') }));
      ok(strip.tiles > 0 && strip.stars === strip.tiles && strip.buttons, 'stars: every look in the Easy Mode strip, and the two buttons under the preview (' + JSON.stringify(strip) + ')');
      const st = await page.evaluate(async () => {
        const before = account.exports ? account.exports.count : 0;
        const stars = [...document.querySelectorAll('#ez-strip .ez-tpl .adl-star')];
        const s = stars.find((x) => x.dataset.ref !== ez.tpl) || stars[0];
        const ref = s.dataset.ref;
        await adLibrary.saveDesign(ref);
        adLibrary.paint();
        const lib = adLibrary.state().lib, it = lib && lib.items.find((i) => i.template === ref);
        /* the strip is drawn again as photographs land, so the star is read by its ref, not by the element held before */
        const now = document.querySelector('#ez-strip .adl-star[data-ref="' + ref + '"]');
        return { ref, on: !!now && now.classList.contains('on'), it: it && { kind: it.kind, w: it.image.width, hold: it.hold, source: it.source }, before, after: account.exports ? account.exports.count : 0 };
      });
      ok(st.it && st.it.kind === 'photo' && st.it.w === 1080 && st.on && st.after === st.before + 1, 'stars: a strip star saves the design at the plan\'s size, counted as a download, and the star fills (' + JSON.stringify(st) + ')');
      ok(st.it && /watermark/.test(st.it.hold || ''), 'stars: a free account\'s saved design is held for its watermark (' + (st.it && st.it.hold) + ')');
      await page.evaluate(() => document.querySelectorAll('.modal-overlay.show').forEach((m) => m.classList.remove('show')));
      // the rest as an operator, who has no cap
      await page.evaluate(async () => { const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'boss@studio.example', password: 'a-long-password' }) }); localStorage.setItem('pgfx_token', JSON.stringify((await r.json()).token)); });
      await page.goto(BASE + '/index.html');
      await page.waitForFunction(() => typeof window.showEasy === 'function' && window.adLibrary, null, { timeout: 30000 });
      await page.evaluate(() => showEasy(null));
      await page.waitForFunction(() => { try { return !!account && account.role === 'admin'; } catch (e) { return false; } }, null, { timeout: 30000 });
      await page.waitForFunction(() => adLibrary.state().lib, null, { timeout: 20000 });
      await page.evaluate(() => document.querySelectorAll('.modal-overlay.show').forEach((m) => m.classList.remove('show')));
      const ez2 = await page.evaluate(async () => {
        document.getElementById('ez-phone').value = '(562) 999-4994'; document.getElementById('ez-phone').dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise((r) => setTimeout(r, 400));
        const before = adLibrary.state().lib.count;
        const it = await adLibrary.saveEasy();
        return { before, after: adLibrary.state().lib.count, it: it && { template: it.template, kind: it.kind, w: it.image.width }, tpl: ez.tpl, on: document.getElementById('ez-star').classList.contains('on') };
      });
      ok(ez2.it && ez2.after === ez2.before + 1 && ez2.it.template === ez2.tpl && ez2.on, 'stars: Save to library under the preview saves the ad as made (' + JSON.stringify(ez2) + ')');
      await page.evaluate(() => document.querySelectorAll('.modal-overlay.show').forEach((m) => m.classList.remove('show')));
      const ed = await page.evaluate(async () => {
        showEditor(); loadTemplate(firstFreeTplId());
        await new Promise((r) => setTimeout(r, 1200));
        document.getElementById('export-btn').click();
        await new Promise((r) => setTimeout(r, 300));
        const has = !!document.getElementById('ex-star') && !!document.getElementById('ex-star-video');
        const before = adLibrary.state().lib.count;
        const it = await adLibrary.saveEditor();
        return { has, before, after: adLibrary.state().lib.count, it: !!it, closed: !document.getElementById('export-overlay').classList.contains('show') };
      });
      ok(ed.has && ed.it && ed.after === ed.before + 1 && ed.closed, 'stars: the designer\'s export saves the canvas to the library (' + JSON.stringify(ed) + ')');
      const panel = await page.evaluate(async () => {
        openPicker(); await new Promise((r) => setTimeout(r, 500));
        const picker = { cards: document.querySelectorAll('#picker-grid .tpl-card').length, stars: document.querySelectorAll('#picker-grid .tpl-card .adl-star').length };
        closePicker();
        return { picker, builtin: document.querySelectorAll('#builtin-tpl-grid .mini-tpl').length, builtinStars: document.querySelectorAll('#builtin-tpl-grid .mini-tpl .adl-star').length, lib: document.querySelectorAll('#ed-lib-grid .mini-tpl').length, libStars: document.querySelectorAll('#ed-lib-grid .mini-tpl .adl-star').length };
      });
      ok(panel.picker.cards > 0 && panel.picker.stars === panel.picker.cards && panel.builtin > 0 && panel.builtinStars === panel.builtin && panel.libStars === panel.lib, 'stars: the picker and the Templates panel (' + JSON.stringify(panel) + ')');
      const hist = await page.evaluate(async () => {
        showEasy(null); await new Promise((r) => setTimeout(r, 800));
        document.querySelectorAll('.modal-overlay.show').forEach((m) => m.classList.remove('show'));
        await ezDownload(true); await new Promise((r) => setTimeout(r, 1000));
        document.querySelectorAll('.adl-ask').forEach((a) => a.remove());
        await openHistory(); await new Promise((r) => setTimeout(r, 600));
        return { rows: document.querySelectorAll('#hist-list .hist-row').length, stars: document.querySelectorAll('#hist-list .adl-hist').length };
      });
      ok(hist.rows > 0 && hist.stars === hist.rows, 'stars: every row of the download history (' + JSON.stringify(hist) + ')');
      await page.evaluate(() => document.querySelectorAll('.modal-overlay.show').forEach((m) => m.classList.remove('show')));
      await shot(page, 'stars-easy');
      const vid = await page.evaluate(async () => {
        const before = adLibrary.state().lib.count;
        await adLibrary.saveVideoNow('ez');
        await new Promise((r) => setTimeout(r, 300));
        const lib = adLibrary.state().lib, top = lib.items[0];
        return { before, after: lib.count, top: top && { kind: top.kind, video: top.video && { format: top.video.format, w: top.video.width, h: top.video.height, seconds: top.video.seconds, bytes: top.video.bytes, url: top.video.url } }, label: document.getElementById('ez-video').innerHTML };
      });
      ok(vid.top && vid.top.kind === 'video' && vid.top.video && vid.top.video.bytes > 10000 && vid.top.video.w === 1080 && vid.top.video.seconds === 10 && /Download as video/.test(vid.label), 'video: Save as video makes the studio\'s video and saves it with its photo (' + JSON.stringify(vid).slice(0, 300) + ')');
      if (vid.top && vid.top.video) {
        const pub = await page.evaluate(async (u) => { const r = await fetch(u, { headers: { Range: 'bytes=0-15' } }); return { status: r.status, type: r.headers.get('content-type'), range: r.headers.get('content-range') }; }, vid.top.video.url);
        ok(pub.status === 206 && /^video\//.test(pub.type || '') && /^bytes 0-15\//.test(pub.range || ''), 'video: the public link serves the clip by range (' + JSON.stringify(pub) + ')');
      }
      const askV = await page.evaluate(async () => {
        document.getElementById('ez-video').click();
        const t0 = Date.now();
        let popup = false;
        while (Date.now() - t0 < 60000) {
          await new Promise((r) => setTimeout(r, 400));
          const vh = document.querySelector('.vh-back');
          if (vh) { popup = true; await new Promise((r) => setTimeout(r, 1200)); if (document.querySelector('.adl-ask')) return { popup, early: true }; vh.remove(); }
          if (document.querySelector('.adl-ask')) break;
        }
        const ask = document.querySelector('.adl-ask');
        return { popup, early: false, asked: !!ask, video: !!(ask && /video ad/.test(ask.textContent)) };
      });
      ok(askV.asked && askV.video && !askV.early, 'video: a video download offers "Save to library" for the video ad, after the helper\'s pop-up (' + JSON.stringify(askV) + ')');
      await page.click('#nav-adlib');
      await page.waitForSelector('#adlib-overlay .adl-grid .adl-card', { timeout: 20000 });
      await page.waitForTimeout(400);
      const dlg = await page.evaluate(() => ({ kinds: document.querySelectorAll('#adlib-overlay .adl-kind').length, videoLinks: document.querySelectorAll('#adlib-overlay a.adl-x[download$=".webm"], #adlib-overlay a.adl-x[download$=".mp4"]').length }));
      ok(dlg.kinds >= 1 && dlg.videoLinks >= 1, 'video: the Library dialog marks the video ad and links its clip (' + JSON.stringify(dlg) + ')');
      await shot(page, 'stars-dialog');
      await page.context().close();
    } catch (e) { ok(false, 'stars: ' + String(e.message || e).split('\n')[0]); }

    /* 3c. the video maker: a signed-out star asks for an account, the save follows */
    try {
      const page = await newPage();
      await page.goto(BASE + '/motion/');
      await page.waitForFunction(() => document.getElementById('loading').hidden && window.adLibrary && window.pgfxAccount, null, { timeout: 60000 });
      await page.click('#mo-star');
      await page.waitForSelector('#acct-overlay.show', { timeout: 10000 });
      const au = await page.evaluate(() => ({ up: document.getElementById('acct-tab-up').getAttribute('aria-selected') === 'true', go: document.getElementById('acct-go').textContent }));
      ok(au.up && au.go === 'Create account', 'video maker: a signed-out star asks for an account, Create account first (' + JSON.stringify(au) + ')');
      await page.fill('#acct-email', 'maker@studio.example'); await page.fill('#acct-pass', 'a-long-password'); await page.click('#acct-go');
      await page.waitForFunction(() => { const st = adLibrary.state(); return st.lib && st.lib.items.length === 1 && st.lib.items[0].video; }, null, { timeout: 180000 }).catch(() => {});
      const saved = await page.evaluate(() => { const st = adLibrary.state(); const t = st.lib && st.lib.items[0]; return t && { kind: t.kind, template: t.template, source: t.source, seconds: t.video && t.video.seconds, w: t.video && t.video.width, photo: t.image.width, on: document.getElementById('mo-star').classList.contains('on') }; });
      ok(saved && saved.kind === 'video' && /^motion-/.test(saved.template) && saved.source === 'motion' && saved.w === 1080 && saved.photo === 1440 && saved.on, 'video maker: after the sign-up the look is made and saved with its photo, the star fills (' + JSON.stringify(saved) + ')');
      await page.evaluate(() => document.getElementById('looks').scrollIntoView());
      await page.waitForFunction(() => document.querySelectorAll('#gallery .mo-thumb').length >= 4, null, { timeout: 60000 });
      await page.waitForTimeout(600);
      const gal = await page.evaluate(() => ({ thumbs: document.querySelectorAll('#gallery .mo-thumb').length, stars: document.querySelectorAll('#gallery .mo-thumb .adl-star').length }));
      ok(gal.thumbs > 0 && gal.stars === gal.thumbs, 'video maker: every look in the gallery carries a star (' + JSON.stringify(gal) + ')');
      await shot(page, 'maker-gallery');
      await page.click('#mo-adlib');
      await page.waitForSelector('#adlib-overlay.show .adl-card', { timeout: 20000 });
      const mdlg = await page.evaluate(() => { const m = document.querySelector('#adlib-overlay .modal'); return { w: Math.round(m.getBoundingClientRect().width), bare: document.documentElement.classList.contains('adl-bare') }; });
      ok(mdlg.w > 300 && mdlg.bare, 'video maker: the Library link opens the dialog, styled without the studio\'s stylesheet (' + JSON.stringify(mdlg) + ')');
      await shot(page, 'maker-dialog');
      await page.context().close();
    } catch (e) { ok(false, 'video maker: ' + String(e.message || e).split('\n')[0]); }

    /* 3d. the master library: the video ad plays, every finished design has a star */
    try {
      const page = await newPage();
      await page.goto(BASE + '/index.html');
      const token = await page.evaluate(async () => (await (await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'maker@studio.example', password: 'a-long-password' }) })).json()).token);
      await page.evaluate((t) => localStorage.setItem('pgfx_token', JSON.stringify(t)), token);
      await page.goto(BASE + '/master-library.html');
      await page.waitForSelector('#grid-saved .ml-card', { timeout: 20000 });
      const sv2 = await page.evaluate(() => { const c = document.querySelector('#grid-saved .ml-card'); return { video: !!c.querySelector('video source'), kind: (c.querySelector('.ml-kind') || {}).textContent, links: [...c.querySelectorAll('.ml-acts a')].map((a) => a.textContent).join() }; });
      ok(sv2.video && /VIDEO/.test(sv2.kind || '') && sv2.links === 'Photo,Video', 'master library: a saved video ad plays, with its photo and clip to download (' + JSON.stringify(sv2) + ')');
      await page.click('#tab-finished');
      await page.waitForSelector('#grid-finished .ml-card .adl-star', { timeout: 20000 });
      const fin = await page.evaluate(() => ({ cards: document.querySelectorAll('#grid-finished .ml-card').length, stars: document.querySelectorAll('#grid-finished .ml-card .adl-star').length }));
      ok(fin.cards > 0 && fin.stars === fin.cards, 'master library: every finished design carries a star (' + JSON.stringify(fin) + ')');
      const star = await page.evaluate(async () => { const s = document.querySelector('#grid-finished .ml-card .adl-star'); const ref = s.dataset.ref; s.click(); const t0 = Date.now(); while (Date.now() - t0 < 30000) { await new Promise((r) => setTimeout(r, 300)); const st = adLibrary.state(); if (st.lib && st.lib.items.some((i) => i.template === ref)) break; } const it = adLibrary.state().lib.items.find((i) => i.template === ref); return { on: s.classList.contains('on'), it: it && { hold: it.hold, source: it.source, w: it.image.width, texts: it.texts.length } }; });
      ok(star.on && star.it && star.it.source === 'master' && star.it.w === 1080 && star.it.hold === 'a website' && star.it.texts > 0, 'master library: a star saves the full-size render, held from auto-post for the website on it (' + JSON.stringify(star) + ')');
      await shot(page, 'master-stars');
      await page.context().close();
      const p2 = await newPage(390);
      await p2.goto(BASE + '/master-library.html#finished');
      await p2.waitForSelector('#grid-finished .ml-card .adl-star', { timeout: 20000 });
      await p2.click('#grid-finished .ml-card .adl-star');
      await p2.waitForSelector('#acct-overlay.show', { timeout: 10000 });
      const so = await p2.evaluate(() => ({ up: document.getElementById('acct-tab-up').getAttribute('aria-selected') === 'true', wide: document.documentElement.scrollWidth - window.innerWidth }));
      ok(so.up && so.wide <= 0, 'master library: signed out, a star opens Create account, inside a phone\'s width (' + JSON.stringify(so) + ')');
      await shot(p2, 'master-auth-390');
      await p2.context().close();
    } catch (e) { ok(false, 'master library stars: ' + String(e.message || e).split('\n')[0]); }
  } catch (e) {
    ok(false, 'browser: ' + String(e.message || e).split('\n')[0]);
  } finally {
    await browser.close();
    srv.close();
  }
  ok(!errors.length, 'browser: no CSP violation or page error from the ad library (' + errors.slice(0, 3).join(' | ') + ')');
}
