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
 *   public, by link
 *   GET  /api/ads/feed/<feed>       JSON (also <feed>.json)
 *   GET  /api/ads/feed/<feed>.rss   RSS 2.0 of what is due to post
 *   GET  /api/ads/feed/<feed>/img/<id>.jpg
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
 * <owner> is a hash of the account's email, so no key or link carries it.
 *
 * The router answers null for any path outside /ads.
 */

export const REPOST_CHOICES = [0, 1, 2, 3, 5, 7, 14, 30];
const DAY = 86400000;
const FEED_RE = /^fd_[A-Za-z0-9_-]{24}$/;
const ID_RE = /^ad_[a-z0-9]{6,24}$/;
const CAT_RE = /^[a-z0-9-]{1,30}$/;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;
const MAX_BYTES = 4200000;          // a 6 MB request carries about 4.4 MB once base64
const MIN_SIDE = 320, MAX_SIDE = 4320;
const DEFAULT_LIMITS = { free: 12, pro: 300, admin: 2000 };
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

/** limits per account: the plan's, or the operators' */
export function limitFor(acct, env) {
  const n = (k, d) => { const v = parseInt(env[k] || '', 10); return v > 0 ? v : d; };
  if (acct && acct.role === 'admin') return n('ADLIB_MAX_ADMIN', DEFAULT_LIMITS.admin);
  if (acct && acct.plan && acct.plan !== 'free') return n('ADLIB_MAX_PRO', DEFAULT_LIMITS.pro);
  return n('ADLIB_MAX_FREE', DEFAULT_LIMITS.free);
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
    return reply({ ok: true, id: gone.id, count: lib.items.length });
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
