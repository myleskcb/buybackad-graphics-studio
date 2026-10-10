/**
 * The ad library: the ads an account saves on the site, and one public link
 * to them that a poster reads.
 *
 * Owner, 2026-10-05: "when we save the ads on the site we can make a public
 * library for iphones LA to access and auto post the we buy ads and auto
 * repost them too".
 *
 * Saving is the account's (signed in, JWT): the picture saved is the one the
 * studio downloaded, gated as every download is (size, watermark), sent as a
 * JPEG. Reading is public by link: each library has one feed id, 24 random
 * characters, and whoever holds the link can read the library and nothing
 * else. Resetting the link makes a new id and the old one stops answering.
 * The link is what iPhones LA is given; nothing on this side posts anywhere.
 *
 *   signed in (Authorization: Bearer <session token>)
 *   GET  /api/ads/mine              the library: name, links, items
 *   POST /api/ads/save              { image: "data:image/jpeg;base64,...", title,
 *                                     category, template, texts, products,
 *                                     caption, hold, autopost, repost_days }
 *   POST /api/ads/update            { id, title?, caption?, autopost?, repost_days? }
 *   POST /api/ads/remove            { id }
 *   POST /api/ads/settings          { name?, repost_days? }  (the default for new saves)
 *   POST /api/ads/link/reset        a new public link; the old one stops
 *
 *   a video on a saved ad (a video ad: the clip beside its photo), sent in
 *   raw parts under a request's 6 MB, then joined and checked:
 *   POST /api/ads/video/begin       { id, format: "mp4"|"webm", bytes, w, h,
 *                                     seconds, sha256 }  → { part_bytes, count }
 *   POST /api/ads/video/part?id=<id>&n=<n>   the part's bytes as the body
 *   POST /api/ads/video/done        { id }  → the item, with video
 *   POST /api/ads/video/remove      { id }  the video goes, the photo stays
 *
 *   public, by link
 *   GET  /api/ads/feed/<feed>       JSON (also <feed>.json); ?kind=video|photo
 *   GET  /api/ads/feed/<feed>.rss   RSS 2.0 of what is due to post
 *   GET  /api/ads/feed/<feed>/img/<id>.jpg
 *   GET  /api/ads/feed/<feed>/video/<id>.mp4 (or .webm; byte ranges honoured)
 *
 * Posting and posting again. An ad set to auto-post has a slot: it is due when
 * it is saved (or when auto-post is turned on), and again every repost_days
 * days after that (0: once). The slot's id is "<ad id>@<due time>", so a poster
 * that keeps the ids it has posted posts each ad once per slot and needs no
 * other state, and the RSS item for an ad is its current slot: an RSS
 * auto-poster that posts every new item posts the ad again each time a slot
 * comes due. Ads that show a website, a QR code, a street address or a social
 * handle, or carry the watermark, are saved but held from auto-post (`hold`):
 * the same rule the studio's iPhones LA link keeps for WE BUY pictures.
 *
 * Storage (one Netlify Blobs store, strongly consistent):
 *   o:<owner>       the library: { v, feed, name, repost_days, items: [...] }
 *   f:<feed>        <owner>
 *   i:<owner>:<id>  the JPEG
 *   v:<owner>:<id>  the video, once joined; vu:/vp:<owner>:<id>… an upload
 *                   under way (its record, its parts), gone when it is done
 * <owner> is a hash of the account's email, so no key or link carries it.
 *
 * The router answers null for any path outside /ads.
 */

import { PLANS, planId, videoOk } from './plans.mjs';

export const REPOST_CHOICES = [0, 1, 2, 3, 5, 7, 14, 30];
const DAY = 86400000;
const FEED_RE = /^fd_[A-Za-z0-9_-]{24}$/;
const ID_RE = /^ad_[a-z0-9]{6,24}$/;
const CAT_RE = /^[a-z0-9-]{1,30}$/;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;
const MAX_BYTES = 4200000;          // a 6 MB request carries about 4.4 MB once base64
const VIDEO_TYPES = { mp4: 'video/mp4', webm: 'video/webm' };
const VIDEO_MAX_BYTES = 40 * 1024 * 1024;   // a 10-second 1080p clip is 4 to 8 MB
export const PART_BYTES = 4500000;          // raw bytes a part carries, under a request's 6 MB
const PARTS_MAX = Math.ceil(VIDEO_MAX_BYTES / PART_BYTES);
const SHA_RE = /^[0-9a-f]{64}$/;
const VIDEO_SECONDS_MAX = 120;
const MIN_SIDE = 320, MAX_SIDE = 4320;
const DEFAULT_LIMITS = { admin: 2000 };   // the plans' own are in plans.mjs (library)
const enc = new TextEncoder();

const reply = (data, status, extra) => new Response(JSON.stringify(data), {
  status: status || 200,
  headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }, extra || {}),
});
/* the public answers: anyone with the link may read them from any page, and
   no search engine should list them */
const PUBLIC = { 'Access-Control-Allow-Origin': '*', 'X-Robots-Tag': 'noindex, nofollow' };

const text = (v, cap) => (typeof v === 'string' ? v.replace(/[\x00-\x1f\x7f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, cap) : '');
const b64u = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const hex = (buf) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');
const iso = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');
const rfc822 = (ms) => new Date(ms).toUTCString();
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function ownerKey(email) {
  return hex(await crypto.subtle.digest('SHA-256', enc.encode('pgfx-ad-library:' + String(email).toLowerCase()))).slice(0, 32);
}
const newFeed = () => 'fd_' + b64u(crypto.getRandomValues(new Uint8Array(18)));
const newId = () => 'ad_' + Date.now().toString(36) + [...crypto.getRandomValues(new Uint8Array(4))].map((x) => (x % 36).toString(36)).join('');

/** a JPEG's size from its frame header, or null when it is not a JPEG */
export function jpegSize(b) {
  if (!(b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff)) return null;
  for (let i = 2; i + 9 < b.length;) {
    if (b[i] !== 0xff) return null;
    const m = b[i + 1];
    if (m === 0xff) { i += 1; continue; }
    if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
    const len = (b[i + 2] << 8) | b[i + 3];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { w: (b[i + 7] << 8) | b[i + 8], h: (b[i + 5] << 8) | b[i + 6] };
    i += 2 + len;
  }
  return null;
}

/** the container the bytes open as: an MP4 (ftyp at 4) or a WebM (EBML), else null */
export function videoHeader(b) {
  if (b.length >= 12 && b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) return 'mp4';
  if (b.length >= 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return 'webm';
  return null;
}
const videoKey = (owner, id) => 'v:' + owner + ':' + id;
const partKey = (owner, id, n) => 'vp:' + owner + ':' + id + ':' + n;
const uploadKey = (owner, id) => 'vu:' + owner + ':' + id;
async function readJson(store, key) {
  const raw = await store.get(key);
  if (!raw) return null;
  try { return JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw)); } catch (e) { return null; }
}
/* an upload under way, or finished: its record and its parts are dropped;
   with `whole` the joined video too. Nothing here can fail the caller. */
async function dropVideo(store, owner, id, whole) {
  const up = await readJson(store, uploadKey(owner, id));
  const keys = [uploadKey(owner, id)];
  if (whole) keys.push(videoKey(owner, id));
  for (let i = 0; i < (up ? up.count : 0); i++) keys.push(partKey(owner, id, i));
  for (const k of keys) { try { await store.delete(k); } catch (e) { /* gone already */ } }
}

/** limits per account: the plan's, or the operators' */
export function limitFor(acct, env) {
  const n = (k, d) => { const v = parseInt(env[k] || '', 10); return v > 0 ? v : d; };
  if (acct && acct.role === 'admin') return n('ADLIB_MAX_ADMIN', DEFAULT_LIMITS.admin);
  const plan = planId(acct && acct.plan);
  return n('ADLIB_MAX_' + plan.toUpperCase(), PLANS[plan].library);
}

const repostOf = (v, fallback) => {
  const n = Number(v);
  return REPOST_CHOICES.includes(n) ? n : fallback;
};

/** when an ad is due to post: the slot it is in now, or null when it does not auto-post */
export function slotOf(item, now) {
  if (!item.autopost || item.hold) return null;
  const base = item.post_from || item.created;
  const period = (item.repost_days || 0) * DAY;
  const round = period > 0 && now > base ? Math.floor((now - base) / period) : 0;
  const due = base + round * period;
  return { slot_id: item.id + '@' + iso(due), due_at: iso(due), next_at: period ? iso(due + period) : null, round: round + 1, due_ms: due };
}

/* ---------- the stored library ---------- */
async function readLib(store, owner) {
  const raw = await store.get('o:' + owner);
  if (!raw) return null;
  try { return JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw)); } catch (e) { return null; }
}
async function writeLib(store, owner, lib) { await store.set('o:' + owner, JSON.stringify(lib)); }
async function ensureLib(store, owner) {
  let lib = await readLib(store, owner);
  if (lib && FEED_RE.test(lib.feed || '')) return lib;
  lib = Object.assign({ v: 1, name: 'Ad library', repost_days: 7, items: [] }, lib || {}, { feed: newFeed() });
  await store.set('f:' + lib.feed, owner);
  await writeLib(store, owner, lib);
  return lib;
}

function links(origin, feed) {
  const api = origin + '/api/ads/feed/' + feed;
  return { page: origin + '/master-library.html?feed=' + feed, json: api, rss: api + '.rss' };
}
function itemOut(item, origin, feed, now) {
  const s = slotOf(item, now);
  return {
    id: item.id,
    title: item.title,
    category: item.category || null,
    caption: item.caption || '',
    texts: item.texts || [],
    products: item.products || [],
    template: item.template || null,
    image: {
      url: origin + '/api/ads/feed/' + feed + '/img/' + item.id + '.jpg?v=' + item.sha256.slice(0, 12),
      width: item.w, height: item.h, bytes: item.bytes, format: 'jpg',
    },
    /* a video ad carries its clip beside the photo (OfferUp takes a video
       only with a photo); the photo stays the picture every poster reads */
    video: item.video ? {
      url: origin + '/api/ads/feed/' + feed + '/video/' + item.id + '.' + item.video.format + '?v=' + item.video.sha256.slice(0, 12),
      width: item.video.w, height: item.video.h, bytes: item.video.bytes, format: item.video.format, seconds: item.video.seconds || null,
    } : null,
    kind: item.video ? 'video' : 'photo',
    source: item.source || null,
    created: iso(item.created),
    updated: iso(item.updated || item.created),
    autopost: !!item.autopost && !item.hold,
    repost_days: item.repost_days || 0,
    hold: item.hold || null,
    post: s ? { slot_id: s.slot_id, due_at: s.due_at, next_at: s.next_at, round: s.round } : null,
  };
}
function libOut(lib, origin, now) {
  return {
    name: lib.name, version: 'adlib-' + lib.items.length + '-' + Math.max(0, ...lib.items.map((x) => x.updated || x.created)).toString(36),
    updated: lib.items.length ? iso(Math.max(...lib.items.map((x) => x.updated || x.created))) : null,
    repost_days: lib.repost_days,
    count: lib.items.length,
    links: links(origin, lib.feed),
    items: lib.items.map((x) => itemOut(x, origin, lib.feed, now)),
  };
}

function rss(lib, origin, now) {
  const l = links(origin, lib.feed);
  const due = lib.items.map((x) => [slotOf(x, now), x]).filter((e) => e[0]).sort((a, b) => b[0].due_ms - a[0].due_ms);
  const out = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    '<title>' + esc(lib.name) + '</title>',
    '<link>' + esc(l.page) + '</link>',
    '<description>' + esc('WE BUY ads to post. Each ad comes back as a new item when it is due to post again.') + '</description>',
    '<atom:link href="' + esc(l.rss) + '" rel="self" type="application/rss+xml"/>',
    '<lastBuildDate>' + rfc822(now) + '</lastBuildDate>',
    '<ttl>60</ttl>',
  ];
  for (const [s, x] of due) {
    const o = itemOut(x, origin, lib.feed, now);
    out.push('<item>',
      '<title>' + esc(x.title) + '</title>',
      '<link>' + esc(o.image.url) + '</link>',
      '<guid isPermaLink="false">' + esc(s.slot_id) + '</guid>',
      '<pubDate>' + rfc822(s.due_ms) + '</pubDate>',
      '<description>' + esc(x.caption || x.title) + '</description>',
      x.category ? '<category>' + esc(x.category) + '</category>' : '',
      '<enclosure url="' + esc(o.image.url) + '" length="' + x.bytes + '" type="image/jpeg"/>',
      '<media:content url="' + esc(o.image.url) + '" type="image/jpeg" medium="image" width="' + x.w + '" height="' + x.h + '"/>',
      x.video ? '<media:content url="' + esc(o.video.url) + '" type="' + VIDEO_TYPES[x.video.format] + '" medium="video" width="' + x.video.w + '" height="' + x.video.h + '"' + (x.video.seconds ? ' duration="' + x.video.seconds + '"' : '') + '/>' : '',
      '</item>');
  }
  out.push('</channel>', '</rss>');
  return out.filter(Boolean).join('\n');
}

/* ---------- what a save may carry ---------- */
function cleanTexts(v) {
  if (!Array.isArray(v)) return [];
  return v.slice(0, 24).map((t) => ({ role: text(t && t.role, 20) || 'text', text: text(t && t.text, 200) })).filter((t) => t.text);
}
function cleanProducts(v) {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.map((s) => String(s || '').toLowerCase()).filter((s) => SLUG_RE.test(s)))].slice(0, 24);
}
function defaultCaption(texts, title) {
  const head = texts.find((t) => t.role === 'headline') || texts[0];
  return head ? head.text : title;
}

async function readBody(req) {
  try { const j = await req.json(); return j && typeof j === 'object' && !Array.isArray(j) ? j : null; } catch (e) { return null; }
}

/**
 * deps: {
 *   store: a Netlify Blobs store (get, set, delete),
 *   whoami(req) → Promise<email|null>,
 *   account(email) → Promise<{ plan, role }|null>,
 *   count(owner) → Promise<boolean>   (false: over today's saves),
 *   now() → ms,
 *   accountsReady: boolean            (false: the site has no JWT_SECRET)
 * }
 * Returns a Response for /ads/…, or null for any other path.
 */
export async function adLibraryRoute(req, url, p, env, deps) {
  if (p !== '/ads' && !p.startsWith('/ads/')) return null;
  const store = deps.store;
  const now = (deps.now || Date.now)();
  const origin = url.origin;
  const parts = p.split('/').slice(2);           // '', 'ads', ...

  /* ---------- public, by link ---------- */
  if (parts[0] === 'feed') {
    if (req.method !== 'GET' && req.method !== 'HEAD') return reply({ error: 'Only GET' }, 405, Object.assign({ Allow: 'GET, HEAD' }, PUBLIC));
    const m = /^(fd_[A-Za-z0-9_-]{24})(\.json|\.rss)?$/.exec(parts[1] || '');
    if (!m) return reply({ error: 'Not a library link' }, 404, PUBLIC);
    const owner = await store.get('f:' + m[1]);
    const lib = owner ? await readLib(store, typeof owner === 'string' ? owner : new TextDecoder().decode(owner)) : null;
    if (!lib || lib.feed !== m[1]) return reply({ error: 'This library link was reset or never existed' }, 404, PUBLIC);
    const ownerId = typeof owner === 'string' ? owner : new TextDecoder().decode(owner);

    if (parts.length === 2) {
      if (m[2] === '.rss') {
        return new Response(req.method === 'HEAD' ? null : rss(lib, origin, now), {
          headers: Object.assign({ 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=60' }, PUBLIC),
        });
      }
      const out = libOut(lib, origin, now);
      let items = out.items;
      const cats = String(url.searchParams.get('category') || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
      if (cats.length) items = items.filter((x) => cats.includes(String(x.category || '')));
      if (url.searchParams.get('due') === '1') items = items.filter((x) => x.post);
      const kind = String(url.searchParams.get('kind') || '');
      if (kind === 'video' || kind === 'photo') items = items.filter((x) => x.kind === kind);
      return reply(Object.assign({}, out, { items, total: items.length }), 200, Object.assign({ 'Cache-Control': 'public, max-age=60' }, PUBLIC));
    }
    if (parts.length === 4 && parts[2] === 'img' && !m[2]) {
      const id = (parts[3] || '').replace(/\.jpg$/, '');
      const item = ID_RE.test(id) && lib.items.find((x) => x.id === id);
      if (!item) return reply({ error: 'No such ad in this library' }, 404, PUBLIC);
      const bytes = await store.get('i:' + ownerId + ':' + id, { type: 'arrayBuffer' });
      if (!bytes) return reply({ error: 'This ad\'s picture is missing' }, 404, PUBLIC);
      const pinned = url.searchParams.get('v') === item.sha256.slice(0, 12);
      return new Response(req.method === 'HEAD' ? null : bytes, {
        headers: Object.assign({
          'Content-Type': 'image/jpeg',
          'Content-Length': String(item.bytes),
          'Cache-Control': pinned ? 'public, max-age=86400' : 'public, max-age=300',
          'Content-Disposition': 'inline; filename="' + (text(item.title, 60).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ad') + '.jpg"',
          'X-Content-Type-Options': 'nosniff',
        }, PUBLIC),
      });
    }
    if (parts.length === 4 && parts[2] === 'video' && !m[2]) {
      const mm = /^(ad_[a-z0-9]{6,24})\.(mp4|webm)$/.exec(parts[3] || '');
      const item = mm && lib.items.find((x) => x.id === mm[1]);
      if (!item || !item.video || item.video.format !== mm[2]) return reply({ error: 'No such video in this library' }, 404, PUBLIC);
      const bytes = await store.get(videoKey(ownerId, item.id), { type: 'arrayBuffer' });
      if (!bytes) return reply({ error: 'This ad\'s video is missing' }, 404, PUBLIC);
      const total = bytes.byteLength;
      const pinned = url.searchParams.get('v') === item.video.sha256.slice(0, 12);
      const headers = Object.assign({
        'Content-Type': VIDEO_TYPES[mm[2]],
        'Accept-Ranges': 'bytes',
        'Cache-Control': pinned ? 'public, max-age=86400' : 'public, max-age=300',
        'Content-Disposition': 'inline; filename="' + (text(item.title, 60).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ad') + '.' + mm[2] + '"',
        'X-Content-Type-Options': 'nosniff',
      }, PUBLIC);
      /* a player asks for pieces of a video (one range at a time) */
      const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range') || '');
      if (range && (range[1] !== '' || range[2] !== '')) {
        const a = range[1] !== '' ? parseInt(range[1], 10) : Math.max(0, total - parseInt(range[2], 10));
        const b = range[1] !== '' && range[2] !== '' ? Math.min(parseInt(range[2], 10), total - 1) : total - 1;
        if (!(a >= 0 && a <= b && a < total)) return new Response(null, { status: 416, headers: Object.assign({ 'Content-Range': 'bytes */' + total }, PUBLIC) });
        return new Response(req.method === 'HEAD' ? null : bytes.slice(a, b + 1), { status: 206, headers: Object.assign(headers, { 'Content-Range': 'bytes ' + a + '-' + b + '/' + total, 'Content-Length': String(b - a + 1) }) });
      }
      return new Response(req.method === 'HEAD' ? null : bytes, { headers: Object.assign(headers, { 'Content-Length': String(total) }) });
    }
    return reply({ error: 'Not found' }, 404, PUBLIC);
  }

  /* ---------- the account's own ---------- */
  if (!deps.accountsReady) return reply({ error: 'Accounts are not set up on this site yet' }, 503);
  const email = await deps.whoami(req);
  if (!email) return reply({ error: 'Sign in to use your ad library' }, 401);
  const acct = await deps.account(email);
  if (!acct) return reply({ error: 'Account not found' }, 404);
  const owner = await ownerKey(email);
  const route = parts.join('/');

  if (route === 'mine' && req.method === 'GET') {
    const lib = await ensureLib(store, owner);
    return reply(Object.assign(libOut(lib, origin, now), { limit: limitFor(acct, env), repost_choices: REPOST_CHOICES }));
  }
  if (req.method !== 'POST') return reply({ error: 'Not found' }, 404);

  /* one part of a video, raw: its bytes are the body, not JSON */
  if (route === 'video/part') {
    const id = String(url.searchParams.get('id') || '');
    const n = parseInt(url.searchParams.get('n') || '', 10);
    const lib = await ensureLib(store, owner);
    if (!ID_RE.test(id) || !lib.items.some((x) => x.id === id)) return reply({ error: 'No such ad in your library' }, 404);
    const up = await readJson(store, uploadKey(owner, id));
    if (!up) return reply({ error: 'Start the video with video/begin first' }, 409);
    if (!(Number.isInteger(n) && n >= 0 && n < up.count)) return reply({ error: 'Part ' + n + ' is not one of this upload\'s ' + up.count }, 400);
    const raw = await req.arrayBuffer();
    const want = n === up.count - 1 ? up.bytes - PART_BYTES * n : PART_BYTES;
    if (raw.byteLength !== want) return reply({ error: 'Part ' + n + ' must be ' + want + ' bytes, not ' + raw.byteLength }, 400);
    await store.set(partKey(owner, id, n), raw);
    up.have[n] = raw.byteLength;
    await store.set(uploadKey(owner, id), JSON.stringify(up));
    return reply({ ok: true, id, n, bytes: raw.byteLength, have: up.have.filter(Boolean).length, count: up.count });
  }

  const body = await readBody(req);
  if (!body) return reply({ error: 'Send JSON' }, 400);

  if (route === 'save') {
    const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(body.image || ''));
    if (!m) return reply({ error: 'The picture must be a JPEG' }, 400);
    if (m[1].length > Math.ceil(MAX_BYTES / 3) * 4) return reply({ error: 'The picture is too large (4 MB at most)' }, 413);
    const bytes = typeof Buffer !== 'undefined' ? new Uint8Array(Buffer.from(m[1], 'base64')) : Uint8Array.from(atob(m[1]), (c) => c.charCodeAt(0));
    const size = jpegSize(bytes);
    if (!size || bytes.length < 1000) return reply({ error: 'The picture could not be read as a JPEG' }, 400);
    if (Math.min(size.w, size.h) < MIN_SIDE || Math.max(size.w, size.h) > MAX_SIDE) return reply({ error: 'The picture must be ' + MIN_SIDE + ' to ' + MAX_SIDE + ' pixels a side' }, 400);
    const sha256 = hex(await crypto.subtle.digest('SHA-256', bytes));
    const lib = await ensureLib(store, owner);
    const same = lib.items.find((x) => x.sha256 === sha256);
    if (same) return reply({ duplicate: true, item: itemOut(same, origin, lib.feed, now), count: lib.items.length });
    const limit = limitFor(acct, env);
    if (lib.items.length >= limit) return reply({ error: 'Your ad library is full (' + limit + ' ads). Remove some to save more.' }, 507);
    if (deps.count && !(await deps.count(owner))) return reply({ error: "You have saved the most ads you can today. Try again tomorrow." }, 429);
    const texts = cleanTexts(body.texts);
    const title = text(body.title, 80) || defaultCaption(texts, '') || 'Ad';
    const hold = text(body.hold, 60);
    const item = {
      id: newId(), title,
      category: CAT_RE.test(String(body.category || '')) ? String(body.category) : '',
      template: text(body.template, 120),
      source: text(body.source, 20),
      caption: text(body.caption, 500) || defaultCaption(texts, title),
      texts, products: cleanProducts(body.products),
      w: size.w, h: size.h, bytes: bytes.length, sha256,
      created: now, updated: now, post_from: now,
      autopost: !hold && body.autopost !== false,
      repost_days: repostOf(body.repost_days, lib.repost_days),
      hold,
    };
    await store.set('i:' + owner + ':' + item.id, bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    lib.items.unshift(item);
    await writeLib(store, owner, lib);
    return reply({ item: itemOut(item, origin, lib.feed, now), count: lib.items.length, limit }, 201);
  }

  if (route === 'update') {
    const lib = await ensureLib(store, owner);
    const item = ID_RE.test(String(body.id || '')) && lib.items.find((x) => x.id === body.id);
    if (!item) return reply({ error: 'No such ad in your library' }, 404);
    if (body.title !== undefined) item.title = text(body.title, 80) || item.title;
    if (body.caption !== undefined) item.caption = text(body.caption, 500);
    if (body.repost_days !== undefined) {
      const r = repostOf(body.repost_days, null);
      if (r === null) return reply({ error: 'Post again every ' + REPOST_CHOICES.join(', ') + ' days (0: once)' }, 400);
      item.repost_days = r;
    }
    if (body.autopost !== undefined) {
      const on = body.autopost === true;
      if (on && item.hold) return reply({ error: 'This ad is held from auto-post (' + item.hold + '). Fix it in the studio and save it again.' }, 409);
      if (on && !item.autopost) item.post_from = now;     // turned on: due now
      item.autopost = on;
    }
    item.updated = now;
    await writeLib(store, owner, lib);
    return reply({ item: itemOut(item, origin, lib.feed, now) });
  }

  if (route === 'remove') {
    const lib = await ensureLib(store, owner);
    const at = ID_RE.test(String(body.id || '')) ? lib.items.findIndex((x) => x.id === body.id) : -1;
    if (at < 0) return reply({ error: 'No such ad in your library' }, 404);
    const [gone] = lib.items.splice(at, 1);
    await writeLib(store, owner, lib);
    try { await store.delete('i:' + owner + ':' + gone.id); } catch (e) { /* the index no longer names it */ }
    await dropVideo(store, owner, gone.id, true);
    return reply({ ok: true, id: gone.id, count: lib.items.length });
  }

  /* ---------- the video on an ad ---------- */
  if (route === 'video/begin') {
    // video ads are a Pro and Business feature (plans.mjs video); operators always
    if (acct.role !== 'admin' && !videoOk(acct.plan)) return reply({ error: 'Video ads come with Pro and Business', needs: 'video' }, 403);
    const lib = await ensureLib(store, owner);
    const item = ID_RE.test(String(body.id || '')) && lib.items.find((x) => x.id === body.id);
    if (!item) return reply({ error: 'No such ad in your library' }, 404);
    const format = String(body.format || '').toLowerCase();
    if (!VIDEO_TYPES[format]) return reply({ error: 'The video must be MP4 or WebM' }, 400);
    const bytes = Number(body.bytes);
    if (!(Number.isInteger(bytes) && bytes >= 1000)) return reply({ error: 'Say how many bytes the video is' }, 400);
    if (bytes > VIDEO_MAX_BYTES) return reply({ error: 'The video is too large (' + Math.round(VIDEO_MAX_BYTES / 1048576) + ' MB at most)' }, 413);
    const w = Number(body.w), h = Number(body.h);
    if (!(Number.isInteger(w) && Number.isInteger(h) && Math.min(w, h) >= MIN_SIDE && Math.max(w, h) <= MAX_SIDE)) return reply({ error: 'The video must be ' + MIN_SIDE + ' to ' + MAX_SIDE + ' pixels a side' }, 400);
    const secs = Number(body.seconds);
    const seconds = secs > 0 && secs <= VIDEO_SECONDS_MAX ? Math.round(secs * 10) / 10 : null;
    const sha256 = String(body.sha256 || '').toLowerCase();
    if (!SHA_RE.test(sha256)) return reply({ error: 'Send the video\'s SHA-256 (64 hex characters)' }, 400);
    await dropVideo(store, owner, item.id, false);       // an upload left half-way starts over
    const count = Math.ceil(bytes / PART_BYTES);
    await store.set(uploadKey(owner, item.id), JSON.stringify({ format, bytes, w, h, seconds, sha256, count, have: [], started: now }));
    return reply({ id: item.id, part_bytes: PART_BYTES, count }, 201);
  }
  if (route === 'video/done') {
    const lib = await ensureLib(store, owner);
    const item = ID_RE.test(String(body.id || '')) && lib.items.find((x) => x.id === body.id);
    if (!item) return reply({ error: 'No such ad in your library' }, 404);
    const up = await readJson(store, uploadKey(owner, item.id));
    if (!up) return reply({ error: 'No video upload under way for this ad' }, 409);
    const have = up.have.filter(Boolean).length;
    if (have !== up.count) return reply({ error: 'Parts missing: ' + have + ' of ' + up.count + ' arrived' }, 409);
    const out = new Uint8Array(up.bytes);
    let at = 0;
    for (let i = 0; i < up.count; i++) {
      const part = await store.get(partKey(owner, item.id, i), { type: 'arrayBuffer' });
      if (!part || at + part.byteLength > up.bytes) { await dropVideo(store, owner, item.id, false); return reply({ error: 'Part ' + i + ' is missing or wrong. Upload the video again.' }, 409); }
      out.set(new Uint8Array(part), at);
      at += part.byteLength;
    }
    if (at !== up.bytes) { await dropVideo(store, owner, item.id, false); return reply({ error: 'The parts do not add up to the video. Upload it again.' }, 409); }
    const sha256 = hex(await crypto.subtle.digest('SHA-256', out));
    if (sha256 !== up.sha256) { await dropVideo(store, owner, item.id, false); return reply({ error: 'The video arrived damaged (its hash differs). Upload it again.' }, 400); }
    const opens = videoHeader(out);
    if (opens !== up.format) { await dropVideo(store, owner, item.id, false); return reply({ error: 'The bytes are not ' + (up.format === 'mp4' ? 'an MP4' : 'a WebM') }, 400); }
    await store.set(videoKey(owner, item.id), out.buffer);
    item.video = { format: up.format, bytes: up.bytes, w: up.w, h: up.h, seconds: up.seconds, sha256 };
    item.updated = now;
    await writeLib(store, owner, lib);
    await dropVideo(store, owner, item.id, false);
    return reply({ item: itemOut(item, origin, lib.feed, now) }, 201);
  }
  if (route === 'video/remove') {
    const lib = await ensureLib(store, owner);
    const item = ID_RE.test(String(body.id || '')) && lib.items.find((x) => x.id === body.id);
    if (!item) return reply({ error: 'No such ad in your library' }, 404);
    if (!item.video) return reply({ error: 'This ad has no video' }, 404);
    delete item.video;
    item.updated = now;
    await writeLib(store, owner, lib);
    await dropVideo(store, owner, item.id, true);
    return reply({ item: itemOut(item, origin, lib.feed, now) });
  }

  if (route === 'settings') {
    const lib = await ensureLib(store, owner);
    if (body.name !== undefined) lib.name = text(body.name, 60) || 'Ad library';
    if (body.repost_days !== undefined) {
      const r = repostOf(body.repost_days, null);
      if (r === null) return reply({ error: 'Post again every ' + REPOST_CHOICES.join(', ') + ' days (0: once)' }, 400);
      lib.repost_days = r;
    }
    await writeLib(store, owner, lib);
    return reply({ name: lib.name, repost_days: lib.repost_days });
  }

  if (route === 'link/reset') {
    const lib = await ensureLib(store, owner);
    const old = lib.feed;
    lib.feed = newFeed();
    await store.set('f:' + lib.feed, owner);
    await writeLib(store, owner, lib);
    try { await store.delete('f:' + old); } catch (e) { /* the library no longer names it, so it answers 404 anyway */ }
    return reply({ links: links(origin, lib.feed) });
  }

  return reply({ error: 'Not found' }, 404);
}
