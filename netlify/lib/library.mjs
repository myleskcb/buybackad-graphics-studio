/**
 * The library API: BUYBACK.AD's imagery for a partner's server, behind a key.
 *
 * Owner, 2026-10-04: "build the intermediary so the ad title and description
 * page and list it can access the library material from buyback ad via a
 * key". The partner is iPhones LA: its listing page (title, description, list
 * it) picks pictures from here. Its server asks; the browser never holds the
 * key. The handoff for that side is docs/iphonesla-library/.
 *
 *   GET /api/library/v1                what is here: counts, version, routes
 *   GET /api/library/v1/categories     kinds and categories, with counts
 *   GET /api/library/v1/assets         product cut-outs, scenes, backgrounds
 *                                      ?kind= ?category= ?q= ?limit= ?offset=
 *   GET /api/library/v1/assets/<id>    one of them
 *   GET /api/library/v1/ads            the finished ad designs the site offers
 *                                      ?category= ?q= ?limit= ?offset=
 *   GET /api/library/v1/ads/<id>       one of them
 *
 * The key: `Authorization: Bearer <key>` (or `X-Library-Key: <key>`). Keys
 * live in the env var LIBRARY_KEYS as comma-separated name:key pairs
 * ("iphonesla:bbl_…"), each 32 characters or more; adding a pair and removing
 * the old one is a rotation. Compared in constant time. Each key may ask
 * LIBRARY_DAILY times a day (20000 by default). No CORS headers: a key in a
 * web page is a key anyone has.
 *
 * What it describes is the deployed site's own assets/library.json and
 * assets/showcase/index.json, read over HTTP from the same deploy and kept
 * five minutes, so every link it hands out is a file that deploy serves. The
 * pictures themselves are those static files (public, cached a month at the
 * edge); the key gates the catalogue, not the bytes.
 *
 * - Assets: every entry but the placeholders (drawn stand-ins for a missing
 *   photograph). Provenance goes with each: `source` as the library records
 *   it, and `credit` where assets/cutouts/ATTRIBUTION.json holds one.
 * - Ads: the cards the site offers, by the site's own test (scIsLive in
 *   app.js: no defect stamped, imagery, not washed out); held cards carry a
 *   defect and stay out. Each comes as its 448px thumbnail and `studio_url`,
 *   which opens it in the studio (?card=<id>) to be finished with a phone
 *   number and downloaded full size.
 *
 * The router answers null for any path outside /library, so api.mjs goes on.
 */

const TTL_MS = 5 * 60 * 1000;
const MAX_LIMIT = 200;
const KINDS = ['cutout', 'scene', 'background'];
const ID_RE = /^[A-Za-z0-9_-]{1,100}$/;
const enc = new TextEncoder();

let cache = null;   // { origin, at, data }

const reply = (data, status, extra) => new Response(JSON.stringify(data), {
  status: status || 200,
  headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, max-age=60', 'X-Content-Type-Options': 'nosniff' }, extra || {}),
});

/** name:key pairs from LIBRARY_KEYS; a malformed or short pair is ignored */
export function libraryKeys(env) {
  return String(env.LIBRARY_KEYS || '').split(',').map((s) => s.trim()).filter(Boolean).map((s) => {
    const i = s.indexOf(':');
    if (i < 1) return null;
    const name = s.slice(0, i).trim(), key = s.slice(i + 1).trim();
    return /^[a-z0-9_-]{1,40}$/i.test(name) && key.length >= 32 && key.length <= 200 ? { name, key } : null;
  }).filter(Boolean);
}

async function digest(s) { return new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s))); }
/** the partner's name for a presented key, or null; every key is compared, in constant time */
async function whoseKey(presented, keys) {
  if (!presented) return null;
  const a = await digest(presented);
  let found = null;
  for (const k of keys) {
    const b = await digest(k.key);
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    if (diff === 0 && !found) found = k.name;
  }
  return found;
}
function presentedKey(req) {
  const h = req.headers.get('authorization') || '';
  if (/^Bearer\s+/i.test(h)) return h.replace(/^Bearer\s+/i, '').trim();
  return (req.headers.get('x-library-key') || '').trim() || null;
}

const words = (s) => String(s || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
const list = (v) => String(v || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
const formatOf = (file) => (String(file).match(/\.([a-z0-9]+)$/i) || [])[1]?.toLowerCase().replace('jpeg', 'jpg') || null;

/** the site's own library and showcase, read from this deploy and kept TTL_MS */
async function load(origin, fetchJson, now) {
  if (cache && cache.origin === origin && now - cache.at < TTL_MS) return cache.data;
  const [lib, cards, credits] = await Promise.all([
    fetchJson(origin + '/assets/library.json'),
    fetchJson(origin + '/assets/showcase/index.json'),
    fetchJson(origin + '/assets/cutouts/ATTRIBUTION.json').catch(() => ({})),
  ]);
  const abs = (u) => new URL(u, origin + '/').href;
  const assets = (Array.isArray(lib && lib.assets) ? lib.assets : [])
    .filter((a) => a && ID_RE.test(a.slug || '') && KINDS.includes(a.kind) && a.url && a.source !== 'placeholder')
    .map((a) => ({
      id: a.slug,
      kind: a.kind,
      category: a.category || null,
      alt: a.prompt && !/^composed locally|^placeholder/i.test(a.prompt) ? a.prompt : a.slug.replace(/[-_]+/g, ' '),
      width: a.w || null,
      height: a.h || null,
      bytes: a.bytes || null,
      format: formatOf(a.file || a.url),
      transparent: a.kind === 'cutout',
      url: abs(a.url),
      source: a.source || null,
      credit: (credits && credits[a.slug]) || null,
      _s: words([a.slug, a.category, a.kind, a.prompt].join(' ')),
      _n: words(a.slug), _d: words(a.prompt),
    }));
  /* the site's own test for a card it offers (scIsLive, app.js) */
  const live = (c) => !!c && !c.defect && c.imagery !== 'none' && !(typeof c.chroma === 'number' && c.chroma < 0.05);
  const ads = (Array.isArray(cards) ? cards : []).filter((c) => live(c) && ID_RE.test(c.id || '') && c.thumb).map((c) => ({
    id: c.id,
    title: c.name || c.id,
    category: c.cat || null,
    theme: c.theme || null,
    layout: c.layout || null,
    subject: c.subject || null,
    thumb: { url: abs(c.thumb), width: 448, height: 448 },
    studio_url: origin + '/?card=' + encodeURIComponent(c.id),
    _s: words([c.id, c.name, c.cat, c.theme, c.layout, c.subject, c.family].join(' ')),
    _n: words(c.name), _d: words([c.subject, c.theme, c.layout].join(' ')),
  }));
  const version = 'lib' + ((lib && lib.built) || 0) + '-ads' + ads.length + '-' + assets.length;
  cache = { origin, at: now, data: { assets, ads, version } };
  return cache.data;
}

const strip = (o) => { const { _s, _n, _d, ...rest } = o; return rest; };
function page(items, url) {
  const limit = Math.max(1, Math.min(MAX_LIMIT, parseInt(url.searchParams.get('limit') || '50', 10) || 50));
  const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10) || 0);
  const slice = items.slice(offset, offset + limit).map(strip);
  return { total: items.length, offset, limit, next_offset: offset + limit < items.length ? offset + limit : null, items: slice };
}
const matches = (q) => { const t = words(q); return (x) => t.every((w) => x._s.some((s) => s.startsWith(w))); };
/* best first: a word in the name counts 3, in the description 2, anywhere
   else (the category) 1; the library's own order breaks ties. "iphone" put
   two Android phones first, filed as they are under the iphones category */
function ranked(items, q) {
  const t = words(q), has = (ws, w) => ws.some((s) => s.startsWith(w));
  const score = (x) => t.reduce((n, w) => n + (has(x._n, w) ? 3 : has(x._d, w) ? 2 : 1), 0);
  return items.map((x, i) => [score(x), i, x]).sort((a, b) => b[0] - a[0] || a[1] - b[1]).map((e) => e[2]);
}

/**
 * deps: { fetchJson(url) → Promise<json>, count(partner) → Promise<boolean> (false: over the day's cap), now() }
 * Returns a Response for /library/…, or null for any other path.
 */
export async function libraryRoute(req, url, p, env, deps) {
  if (p !== '/library' && !p.startsWith('/library/')) return null;
  if (req.method !== 'GET' && req.method !== 'HEAD') return reply({ error: 'Only GET' }, 405, { Allow: 'GET, HEAD' });
  const keys = libraryKeys(env);
  if (!keys.length) return reply({ error: 'The library API is not switched on here (no LIBRARY_KEYS)' }, 503);
  const partner = await whoseKey(presentedKey(req), keys);
  if (!partner) return reply({ error: 'A valid library key is required' }, 401, { 'WWW-Authenticate': 'Bearer realm="buyback.ad library"' });
  if (deps.count && !(await deps.count(partner))) return reply({ error: "This key has used today's requests; it resets at midnight UTC" }, 429, { 'Retry-After': '3600' });

  const route = p.replace(/^\/library\/?/, '');
  if (route !== 'v1' && !route.startsWith('v1/')) return reply({ error: 'Not found. The library API is at /api/library/v1' }, 404);
  let data;
  try { data = await load(url.origin, deps.fetchJson, (deps.now || Date.now)()); }
  catch (e) { return reply({ error: 'The library index could not be read (' + e.message + ')' }, 502); }
  const head = { 'X-Library-Version': data.version };
  const parts = route.split('/').slice(1).map((s) => decodeURIComponent(s));

  if (!parts.length || (parts.length === 1 && parts[0] === '')) {
    const base = url.origin + '/api/library/v1';
    return reply({
      name: 'BUYBACK.AD library', version: data.version, partner,
      counts: { assets: data.assets.length, ads: data.ads.length, ...Object.fromEntries(KINDS.map((k) => [k + 's', data.assets.filter((a) => a.kind === k).length])) },
      routes: { categories: base + '/categories', assets: base + '/assets', asset: base + '/assets/{id}', ads: base + '/ads', ad: base + '/ads/{id}' },
    }, 200, head);
  }
  if (parts[0] === 'categories' && parts.length === 1) {
    const tally = (xs, key) => xs.reduce((m, x) => { const k = x[key] || 'other'; m[k] = (m[k] || 0) + 1; return m; }, {});
    return reply({
      version: data.version,
      assets: Object.fromEntries(KINDS.map((k) => [k, tally(data.assets.filter((a) => a.kind === k), 'category')])),
      ads: tally(data.ads, 'category'),
    }, 200, head);
  }
  if (parts[0] === 'assets' || parts[0] === 'ads') {
    const pool = parts[0] === 'assets' ? data.assets : data.ads;
    if (parts.length === 2) {
      if (!ID_RE.test(parts[1])) return reply({ error: 'Not a library id' }, 400, head);
      const one = pool.find((x) => x.id === parts[1]);
      return one ? reply({ version: data.version, item: strip(one) }, 200, head) : reply({ error: 'No such ' + parts[0].slice(0, -1) + ' (it may have been held back since)' }, 404, head);
    }
    if (parts.length !== 1) return reply({ error: 'Not found' }, 404, head);
    const kinds = list(url.searchParams.get('kind')), cats = list(url.searchParams.get('category'));
    if (kinds.some((k) => !KINDS.includes(k))) return reply({ error: 'kind is one of ' + KINDS.join(', ') }, 400, head);
    let items = pool;
    if (parts[0] === 'assets' && kinds.length) items = items.filter((a) => kinds.includes(a.kind));
    if (cats.length) items = items.filter((x) => cats.includes(String(x.category || '').toLowerCase()));
    if (url.searchParams.get('q')) items = ranked(items.filter(matches(url.searchParams.get('q'))), url.searchParams.get('q'));
    return reply(Object.assign({ version: data.version }, page(items, url)), 200, head);
  }
  return reply({ error: 'Not found' }, 404, head);
}

/** for the tests: forget the cached index */
export function libraryForget() { cache = null; }
