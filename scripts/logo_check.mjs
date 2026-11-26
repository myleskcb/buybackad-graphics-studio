#!/usr/bin/env node
/* THE LOGO MAKER AND BRAND KIT, CHECKED (DESIGN-LAW 176; logo/, netlify/lib/logos.mjs, cards/, the full ad).

   The owner, 2026-11-24: business assets "need to be good, very, very good", and "that's something you
   would probably be paying for". Held, in three parts:

   1. The engine, in Node (logo/engine.js, exactly as the page and the function run it):
      - the type pairs are the catalogue's (motion/catalog.js TYPE_VOICES), each one the full ad wears
        (motion/full-voices.js) or Bold; every face has its outlines (logo/glyphs/), and the function's
        list of faces (netlify/lib/logos.mjs) is the same list;
      - the house's twenty symbols are spec/icons.json's; every line has symbols that exist;
      - every pair a logo wears keeps its words 4.5:1 on its ground and on its band, its accent 3:1;
      - every layout draws every kind of name (short, usual, long, one word, an apostrophe, an accent)
        in every voice it takes, in colour, see-through, black and white, as the layout, its mark and the
        side-by-side lockup, with no NaN, no undefined and no character the face could not set; a usual
        name keeps every layout at a size a logo is read at; one-colour files hold one colour;
      - the gallery: 24 finished logos for every line and name, no pair twice, no voice more than twice,
        dark and light grounds both, the line's own layouts in it;
      - every word a logo writes for itself passes the banned list (spec/banned-words.json);
      - the kit: the files, the profile picture 1080 square, the cover 1640 × 624.
   2. The function (netlify/functions/api.mjs with a stand-in blob store): /logo/file and
      /export/check kind logo refuse Free and Starter (403), draw the files for Pro and Business, count
      one photo download, stop at a full meter (402), refuse a request with no design (400) and count
      nothing when they refuse; an operator is never counted.
   3. The pages, in Chromium (GFX_BASE, default http://127.0.0.1:8899/):
      - a new visitor types a name, picks a line and has 24 logos to tap well inside a minute (timed);
        one tap opens the rows (colours, lettering, shape, symbol) and the kit, and keeps the logo for the
        site (pgfx_logo_kit); a row changes the logo; the tabs and More work;
      - the kit downloads as a zip of SVGs and PNGs at their sizes (the local demo draws them);
      - the paywall, the function stood in for: signed out opens the account dialog; Starter gets the
        upsell, a marked preview and no file; Pro gets the zip from /logo/file, counted once, and a clean
        preview;
      - the card maker opens on a gallery led by the logo, a tap opens Customise on the Logo layout with
        the logo inside the safe area; the full ad wears it on its badge and its pre-flight passes;
      - no sideways scroll at 390 and 1300, light and dark, and no page error.

   usage:  python3 -m http.server <port> (in the repo), then
           GFX_BASE=http://127.0.0.1:<port>/ [PLAYWRIGHT_MODULE=…] node scripts/logo_check.mjs [--no-browser]
   exits 1 on any failure */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, cpSync, rmSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8899/').replace(/\/?$/, '/');
const NO_BROWSER = process.argv.includes('--no-browser');
let fails = 0, passes = 0;
const ok = (c, m) => { if (c) passes++; else { fails++; console.log('  FAIL ' + m); } return !!c; };
const imp = (p) => import(pathToFileURL(join(ROOT, p)).href);

/* ---------- 1. the engine ---------- */
const E = await imp('logo/engine.js');
const { LOGO_VOICES, LOGO_FACES } = await imp('logo/voices.js');
const { TYPE_VOICES, FONTS } = await imp('motion/catalog.js');
const { FULL_VOICES } = await imp('motion/full-voices.js');
const { BANNED } = await imp('motion/banned-words.js');
const faces = {};
for (const f of LOGO_FACES) { const p = join(ROOT, 'logo/glyphs', f + '.js'); if (ok(existsSync(p), 'logo/glyphs/' + f + '.js exists')) faces[f] = (await import(pathToFileURL(p).href)).default; }
{
  const bad = Object.entries(LOGO_VOICES).filter(([k, v]) => !TYPE_VOICES[k] || TYPE_VOICES[k].display !== v.display || TYPE_VOICES[k].label !== v.label);
  ok(!bad.length, 'every logo voice is the catalogue\'s own pair (' + bad.map(([k]) => k).join(', ') + ')');
  const notFull = Object.keys(LOGO_VOICES).filter((k) => k !== 'bold' && !FULL_VOICES.includes(k));
  ok(!notFull.length, 'every logo voice is one the full ad wears, or Bold (' + notFull.join(', ') + ')');
  const kinds = Object.entries(LOGO_VOICES).filter(([, v]) => (FONTS[v.display] || [])[3] !== v.kind && !(v.kind === 'condensed' && (FONTS[v.display] || [])[3] === 'condensed'));
  ok(!kinds.length, 'each voice\'s kind is its display face\'s (' + kinds.map(([k, v]) => k + ':' + v.kind + '/' + (FONTS[v.display] || [])[3]).join(', ') + ')');
  const fm = Object.keys((await imp('netlify/lib/logos.mjs')).FACE_MODULES).sort().join(','), lf = LOGO_FACES.slice().sort().join(',');
  ok(fm === lf, 'the function loads the same faces the page does (netlify/lib/logos.mjs FACE_MODULES = logo/voices.js LOGO_FACES)');
  const icons = JSON.parse(readFileSync(join(ROOT, 'spec/icons.json'), 'utf8'));
  ok(Object.entries(icons).every(([k, v]) => E.LOGO_ICONS[k] && E.LOGO_ICONS[k][0] === v.d), 'the house\'s twenty symbols are spec/icons.json\'s');
  const lines = Object.keys(E.LINE_WORDS);
  ok(lines.length === 16 && lines.every((l) => (E.ICONS_FOR[l] || []).length >= 3 && E.ICONS_FOR[l].every((k) => E.LOGO_ICONS[k])), 'every one of the 16 lines (the 13 and wholesale, device stores, resale) has symbols of its own that exist');
  const weak = E.LOGO_PAIRS.filter((k) => { const P = E.paletteOf(k); return E.contrast(P.I, P.G) < 4.5 || E.contrast(P.Q, P.P) < 4.5 || (P.A !== P.I && E.contrast(P.A, P.G) < 3); });
  ok(!weak.length, 'every logo pair: words 4.5:1 on the ground and the band, the accent 3:1 (' + weak.join(', ') + ')');
  ok(E.LOGO_PAIRS.length >= 30, E.LOGO_PAIRS.length + ' colour pairs');
}
const NAMES = ['Long Beach Phone Buyers', 'Gold Rush Cash', "Sam's Coins", 'MK Electronics', 'Kash', 'José’s Gold & Silver', 'Westside Watch & Phone Buyers of Orange County', 'iPhones LA'];
{
  let drawn = 0; const errs = [], small = {}, missing = new Set();
  for (const t of Object.keys(E.LOGO_LAYOUTS)) {
    const L = E.LOGO_LAYOUTS[t];
    for (const name of NAMES) for (const [vi, voice] of Object.keys(LOGO_VOICES).entries()) {
      if (!L.kinds.includes(LOGO_VOICES[voice].kind)) continue;
      const V = LOGO_VOICES[voice];
      for (const ch of E.partsOf(name, V.kind === 'script').full) if (ch !== ' ' && !faces[V.display].g[ch] && !faces[V.label].g[ch] && !(ch === '’' && faces[V.display].g["'"])) missing.add(V.display + ':' + ch);
      const d = { t, name, cat: L.cats ? L.cats[0] : 'phones', voice, pair: E.LOGO_PAIRS[(vi * 7 + name.length) % E.LOGO_PAIRS.length], icon: vi % 2 ? 'phone' : '', seed: vi, town: 'Long Beach' };
      for (const form of ['primary', 'mark', 'horizontal']) for (const mode of ['colour', 'transparent', 'black', 'white']) {
        if (form !== 'primary' && mode !== 'colour') continue;
        try {
          const r = E.logoSvg(d, faces, { form, mode });
          drawn++;
          if (/NaN|undefined|Infinity/.test(r.svg)) errs.push(t + '/' + voice + '/' + form + '/' + mode + ': NaN or undefined in the SVG');
          if (form === 'primary' && mode === 'colour' && !r.ok) (small[name] ||= []).push(t + '/' + voice);
          if (mode === 'black' || mode === 'white') { const cols = new Set((r.svg.match(/#[0-9a-f]{6}|#fff\b|#000\b/gi) || []).map((c) => c.toLowerCase())); if ([...cols].some((c) => !['#fff', '#000', '#111214', '#ffffff'].includes(c))) errs.push(t + '/' + voice + ' ' + mode + ': more than one colour (' + [...cols].join(' ') + ')'); }
        } catch (e) { errs.push(t + '/' + voice + '/' + form + '/' + mode + ' "' + name + '": ' + e.message); }
      }
    }
  }
  ok(!errs.length, drawn + ' drawings without an error, NaN or a second colour in a one-colour file (' + errs.slice(0, 4).join(' | ') + ')');
  ok(!missing.size, 'every character of the names is in its face or the pair\'s reading face (' + [...missing].slice(0, 8).join(' ') + ')');
  const usual = ['Long Beach Phone Buyers', 'Gold Rush Cash', "Sam's Coins", 'MK Electronics', 'Kash', 'iPhones LA'].flatMap((n) => (small[n] || []).map((x) => n + ':' + x));
  ok(!usual.length, 'a usual name keeps every layout, in every voice it takes, at a size a logo is read at (' + usual.slice(0, 6).join(', ') + ')');
  const long = small['Westside Watch & Phone Buyers of Orange County'] || [];
  console.log('  (a 46-letter name is too long for ' + long.length + ' layout and voice pairs; the gallery leaves those out)');
}
{
  const bad = [];
  for (const cat of Object.keys(E.LINE_WORDS)) for (const name of NAMES.slice(0, 6)) {
    const all = E.gallery({ name, cat, town: 'Long Beach' }, { seed: 1, n: 32 });
    const okd = all.filter((d) => E.logoSvg(d, faces, { bg: false }).ok).slice(0, 24);
    const pairs = okd.map((d) => d.pair), voices = {}, dark = okd.filter((d) => E.paletteOf(d.pair).dark).length;
    okd.forEach((d) => { voices[d.voice] = (voices[d.voice] || 0) + 1; });
    const own = Object.keys(E.LOGO_LAYOUTS).filter((t) => (E.LOGO_LAYOUTS[t].cats || []).includes(cat));
    if (okd.length < 24) bad.push(cat + '/' + name + ': ' + okd.length + ' logos');
    if (new Set(pairs).size !== pairs.length) bad.push(cat + '/' + name + ': a pair twice');
    if (Math.max(...Object.values(voices)) > 2) bad.push(cat + '/' + name + ': a voice ' + Math.max(...Object.values(voices)) + ' times');
    if (dark < 6 || okd.length - dark < 6) bad.push(cat + '/' + name + ': ' + dark + ' dark of ' + okd.length);
    if (own.some((t) => !okd.slice(0, 12).some((d) => d.t === t))) bad.push(cat + '/' + name + ': its own layouts not in the first twelve');
    if (new Set(okd.map((d) => d.t)).size < 12) bad.push(cat + '/' + name + ': ' + new Set(okd.map((d) => d.t)).size + ' layouts');
  }
  ok(!bad.length, 'the gallery: 24 logos for every line and name, no pair twice, no voice more than twice, dark and light, 12 layouts or more, the line\'s own layouts early (' + bad.slice(0, 4).join(' | ') + ')');
  const g1 = E.gallery({ name: 'Gold Rush Cash', cat: 'gold' }, { seed: 1 }), g2 = E.gallery({ name: 'Gold Rush Cash', cat: 'gold' }, { seed: 2 });
  ok(JSON.stringify(g1) === JSON.stringify(E.gallery({ name: 'Gold Rush Cash', cat: 'gold' }, { seed: 1 })) && JSON.stringify(g1) !== JSON.stringify(g2), 'the gallery is the same for a seed, and More draws another');
  const groups = ['badge', 'wordmark', 'monogram', 'mark'].map((g) => E.gallery({ name: 'Kash', cat: 'phones' }, { seed: 1, group: g }).every((d) => E.LOGO_LAYOUTS[d.t].group === g));
  ok(groups.every(Boolean), 'a tab shows only its kind of logo');
  const words = [...E.LINES.map((l) => E.smallFor(l)), 'CASH PAID TODAY', 'CASH FOR CARS', 'CASH PAID'];
  const hit = words.flatMap((w) => BANNED.filter((b) => new RegExp(b.pattern, 'i').test(w) && !(b.unless && new RegExp(b.unless, 'i').test(w))).map((b) => w + ' (' + b.id + ')'));
  ok(!hit.length, 'every line a logo writes for itself passes the banned list (' + hit.join(', ') + ')');
  const v = ['pair', 'voice', 'layout', 'icon'].map((ax) => E.variants({ t: 'seal', name: 'Kash', cat: 'gold', voice: 'luxe', pair: 'black_gold' }, ax, 8));
  ok(v.every((l) => l.length >= 5 && new Set(l.map((d) => JSON.stringify(d))).size === l.length), 'the rows: the same logo in 5 to 8 other colours, voices, shapes and symbols, none twice');
  const k = E.kitFiles({ t: 'crest', name: 'Gold Rush Cash', cat: 'gold', voice: 'luxe', pair: 'green_gold', icon: 'barStack' }, faces, { phone: '(562) 555-0123' });
  ok(['logo.svg', 'logo-on-colour.svg', 'logo-black.svg', 'logo-white.svg', 'logo-side-by-side.svg', 'mark.svg', 'mark-on-colour.svg', 'profile.svg', 'cover.svg', 'README.txt'].every((n) => k[n]), 'the kit has its ten files');
  ok(/width="1080" height="1080"/.test(k['profile.svg']) && /width="1640" height="624"/.test(k['cover.svg']), 'the profile picture is 1080 square and the cover 1640 × 624');
  ok(!/<text\b/.test(Object.values(k).join('')), 'no file sets a word as <text>: every word is outlines');
  // the finishes (DESIGN-LAW 180): a gradient or a pattern on the body, never in the one-colour versions
  const fd = { t: 'seal', name: 'Gold Coast Buyers', cat: 'gold', voice: 'street', pair: 'navy_gold', seed: 2 };
  const fg = E.logoSvg({ ...fd, finish: 'gradient' }, faces, {}).svg, fp = E.logoSvg({ ...fd, finish: 'pattern' }, faces, {}).svg;
  ok(/linearGradient/.test(fg) && /clipPath/.test(fp) && !/linearGradient|clipPath/.test(E.logoSvg(fd, faces, {}).svg), 'a gradient and a pattern finish draw; flat draws neither');
  ok(!/clipPath/.test(E.logoSvg({ ...fd, finish: 'pattern' }, faces, { mode: 'black' }).svg) && !/clipPath/.test(E.logoSvg({ ...fd, finish: 'pattern' }, faces, { mode: 'white' }).svg), 'the one-colour versions stay flat');
  ok(E.cleanDesign({ ...fd, finish: 'nope' }).finish === 'flat' && E.cleanDesign({ ...fd, finish: 'pattern' }).finish === 'pattern', 'a design keeps its finish, and only a real one');
}

/* ---------- 2. the function ---------- */
{
  const T = join(tmpdir(), 'logo-check-' + process.pid);
  rmSync(T, { recursive: true, force: true });
  for (const d of ['netlify', 'logo']) cpSync(join(ROOT, d), join(T, d), { recursive: true });
  mkdirSync(join(T, 'motion'), { recursive: true });
  cpSync(join(ROOT, 'motion/house-colours.js'), join(T, 'motion/house-colours.js'));
  writeFileSync(join(T, 'package.json'), JSON.stringify({ type: 'module' }));
  mkdirSync(join(T, 'node_modules/@netlify/blobs'), { recursive: true });
  writeFileSync(join(T, 'node_modules/@netlify/blobs/package.json'), JSON.stringify({ name: '@netlify/blobs', type: 'module', main: 'index.js' }));
  writeFileSync(join(T, 'node_modules/@netlify/blobs/index.js'), [
    'export const all = new Map();',
    'export const getStore = (o) => { const n = typeof o === "string" ? o : o.name; if (!all.has(n)) all.set(n, new Map()); const m = all.get(n);',
    '  return { get: async (k) => (m.has(k) ? m.get(k) : null), set: async (k, v) => { m.set(k, v); }, delete: async (k) => { m.delete(k); }, list: async (o) => ({ blobs: [...m.keys()].filter((k) => !(o && o.prefix) || k.startsWith(o.prefix)).map((key) => ({ key })) }) }; };',
  ].join('\n'));
  for (const k of ['STRIPE_SECRET', 'GEMINI_KEY', 'FAL_KEY']) delete process.env[k];
  process.env.JWT_SECRET = 'logo-check-' + 'x'.repeat(32);
  process.env.ADMIN_EMAILS = 'boss@studio.example';
  const api = (await import(pathToFileURL(join(T, 'netlify/functions/api.mjs')).href)).default;
  const store = (await import(pathToFileURL(join(T, 'node_modules/@netlify/blobs/index.js')).href)).all;
  const hit = async (path, body, token) => {
    const res = await api(new Request('https://studio.example/api' + path, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}), body: body === undefined ? undefined : JSON.stringify(body) }));
    const text = await res.text(); let json = null; try { json = JSON.parse(text); } catch (e) { /* text */ }
    return { status: res.status, json };
  };
  const signup = async (em) => (await hit('/auth/signup', { email: em, password: 'a-long-password' })).json.token;
  const users = () => store.get('pgfx-users');
  const user = (em) => JSON.parse(users().get('u:' + em));
  const setPlan = (em, plan, count) => { const u = user(em); u.plan = plan; if (count != null) u.exports = { period: u.exports && u.exports.period || '', count }; users().set('u:' + em, JSON.stringify(u)); };
  const design = { t: 'seal', name: 'Long Beach Phone Buyers', cat: 'phones', voice: 'stadium', pair: 'navy_gold', icon: 'phone' };
  const tok = await signup('logo@x.example');
  ok((await hit('/logo/file', { design })).status === 401, '/logo/file signed out: 401');
  let r = await hit('/logo/file', { design }, tok);
  ok(r.status === 403 && r.json.needs === 'logos' && !r.json.files, 'Free: /logo/file is 403, no files (' + r.status + ')');
  ok((await hit('/export/check', { kind: 'logo' }, tok)).status === 403, 'Free: /export/check kind logo is 403');
  setPlan('logo@x.example', 'basic');
  ok((await hit('/logo/file', { design }, tok)).status === 403 && (await hit('/export/check', { kind: 'logo' }, tok)).status === 403, 'Starter: 403 both');
  ok((user('logo@x.example').exports || { count: 0 }).count === 0, 'refused: nothing counted');
  setPlan('logo@x.example', 'pro');
  ok((await hit('/export/check', { kind: 'logo' }, tok)).status === 200, 'Pro: /export/check kind logo is 200');
  ok((await hit('/logo/file', {}, tok)).status === 400 && user('logo@x.example').exports.count === 0, 'no design: 400, nothing counted');
  r = await hit('/logo/file', { design, phone: '(562) 555-0123' }, tok);
  ok(r.status === 200 && r.json.files && /^<svg/.test(r.json.files['logo.svg']) && r.json.files['cover.svg'].includes('<svg'), 'Pro: /logo/file draws the kit (' + r.status + ')');
  ok(user('logo@x.example').exports.count === 1, 'Pro: one photo download counted (' + user('logo@x.example').exports.count + ')');
  const local = E.kitFiles(design, faces, { phone: '(562) 555-0123' });
  const strip = (s) => s.replace(/id="k[0-9a-z]+"|url\(#k[0-9a-z]+\)/g, '');
  ok(r.json && Object.keys(local).every((n) => strip(local[n]) === strip(r.json.files[n] || '')), 'the function\'s files are the page\'s drawing, byte for byte (but a mask\'s name)');
  r = await hit('/logo/file', { design: { ...design, name: '<script>alert(1)</script>', t: '../x', voice: 'nope', pair: '"/><x' } }, tok);
  ok(r.status === 200 && !/<script|"\/><x/.test(JSON.stringify(r.json.files)), 'a design is held to what the engine draws: no markup gets into a file');
  { const u = user('logo@x.example'); u.plan = 'pro'; u.exports = { period: u.exports.period, count: 500 }; users().set('u:logo@x.example', JSON.stringify(u)); }
  r = await hit('/logo/file', { design }, tok);
  ok(r.status === 402 && user('logo@x.example').exports.count === 500, 'Pro with its downloads used: 402, nothing counted (' + r.status + ')');
  setPlan('logo@x.example', 'business');
  ok((await hit('/logo/file', { design }, tok)).status === 200, 'Business: 200, unlimited');
  const boss = await signup('boss@studio.example');
  r = await hit('/logo/file', { design }, boss);
  ok(r.status === 200 && ((user('boss@studio.example').exports || { count: 0 }).count | 0) === 0, 'an operator: drawn, never counted');

  /* the brand kits (DESIGN-LAW 180): bought once, saved for a business name, downloaded again any time */
  const get = async (path, token) => { const res = await api(new Request('https://studio.example/api' + path, { headers: token ? { Authorization: 'Bearer ' + token } : {} })); return { status: res.status, json: await res.json().catch(() => null) }; };
  const KITM = await import(pathToFileURL(join(T, 'logo/kit.js')).href);
  const kspec = { design, details: { person: 'Maria Lopez', phone: '(562) 555-0148', email: 'maria@example.com', handle: 'lbphones' }, looks: { social: 1 } };
  const kt = await signup('kit@x.example');
  ok((await get('/kits')).status === 401, '/kits signed out: 401');
  r = await get('/kits', kt);
  ok(r.status === 200 && r.json.included === null && r.json.credits.essentials === 0 && r.json.prices.essentials === 1499 && r.json.prices.complete === 1999, 'Free: no kit, the prices $14.99 and $19.99 (' + JSON.stringify(r.json && r.json.prices) + ')');
  r = await hit('/kits/save', { spec: kspec, tier: 'complete' }, kt);
  ok(r.status === 402 && r.json.needs === 'kit', 'Free with no kit bought: saving is 402 (' + r.status + ')');
  const grant = async (tier, sid) => { const B = await import(pathToFileURL(join(T, 'netlify/lib/billing.mjs')).href); const u = user('kit@x.example'); B.grantKit(u, sid, tier); users().set('u:kit@x.example', JSON.stringify(u)); return B; };
  const B = await grant('essentials', 'cs_test_1');
  ok(!B.grantKit(user('kit@x.example'), 'cs_test_1', 'essentials'), 'a session grants its kit once');
  r = await hit('/kits/save', { spec: kspec, tier: 'essentials' }, kt);
  const kid = r.json && r.json.kit && r.json.kit.id;
  ok(r.status === 200 && r.json.kit.tier === 'essentials' && r.json.credits.essentials === 0, 'a bought Essentials kit saves this business (' + r.status + ')');
  r = await hit('/kits/save', { spec: { ...kspec, design: { ...design, pair: 'black_cyan' } }, tier: 'essentials' }, kt);
  ok(r.status === 200 && r.json.kit.id === kid && r.json.kit.spec.design.pair === 'black_cyan', 'the same name again: the kit changes, no new kit is used');
  r = await hit('/kits/save', { spec: { ...kspec, design: { ...design, name: 'Another Shop' } } }, kt);
  ok(r.status === 402, 'another business name needs another kit (' + r.status + ')');
  r = await hit('/kits/file', { id: kid }, kt);
  const ess = KITM.kitFor('essentials');
  ok(r.status === 200 && r.json.tier === 'essentials' && Object.keys(r.json.files).length === 20 && ess.every((F) => /^<svg/.test(r.json.files[F.id])) && /brand kit/.test(r.json.readme), 'Essentials: the function draws its 20 files (' + (r.json && Object.keys(r.json.files || {}).length) + ')');
  const page = KITM.kitSvg('card-back', { ...kspec, design: { ...design, pair: 'black_cyan' } }, faces).svg;
  ok(strip(page) === strip(r.json.files['card-back']), 'the function\'s kit files are the page\'s drawing, byte for byte');
  ok(((user('kit@x.example').exports || { count: 0 }).count | 0) === 0, 'a kit download is never counted against the photo downloads');
  ok((await hit('/kits/file', { id: 'nope' }, kt)).status === 404, 'a kit not on the account: 404');
  await grant('upgrade', 'cs_test_2');
  { const u = user('kit@x.example'); B.grantKit(u, 'cs_test_3', 'upgrade', kid); users().set('u:kit@x.example', JSON.stringify(u)); }
  r = await hit('/kits/file', { id: kid }, kt);
  ok(r.status === 200 && r.json.tier === 'complete' && Object.keys(r.json.files).length === 50, 'the upgrade: the same kit, Complete, 50 files (' + (r.json && r.json.tier) + ')');
  { const u = user('kit@x.example'); ok(B.refundKit(u, 'cs_test_1') && !B.refundKit(u, 'cs_test_1'), 'a refund is applied once'); users().set('u:kit@x.example', JSON.stringify(u)); }
  ok((await hit('/kits/file', { id: kid }, kt)).status === 404, 'the kit\'s purchase refunded: it no longer downloads');
  setPlan('kit@x.example', 'pro');
  r = await hit('/kits/save', { spec: { ...kspec, design: { ...design, name: 'Pro Shop' } } }, kt);
  ok(r.status === 200 && r.json.kit.tier === 'complete' && r.json.kit.via === 'plan', 'Pro: the Complete kit, with the plan');
  r = await hit('/kits/save', { spec: { design: { name: '<script>x</script>', t: '../x' }, details: { email: '"/><x', handle: '@@a b' } } }, kt);
  ok(r.status === 200 && !/<script|"\/><x/.test(JSON.stringify(r.json.kit)), 'a kit is held to what the engine draws: no markup gets into it');
  // AI name ideas: signed in, and only with ANTHROPIC_API_KEY (unset here, so nothing is spent)
  ok((await hit('/names', { keywords: 'Maria', cat: 'gold' })).status === 401, '/names signed out: 401');
  r = await hit('/names', { keywords: 'Maria', cat: 'gold' }, kt);
  ok(r.status === 503 && /not switched on/.test(r.json.error), 'AI name ideas without a key: 503, no credit taken (' + r.status + ')');
  ok(((user('kit@x.example').credits || {}).used | 0) === 0, 'no credit used when the AI is off');
  const C = B.catalog();
  ok(C.kit_essentials.amount === 1499 && C.kit_complete.amount === 1999 && C.kit_essentials_addon.amount === 999 && C.kit_complete_addon.amount === 1499 && C.kit_upgrade.amount === 500, 'Stripe sells the kits at $14.99 and $19.99, $5 less with a plan, $5 to upgrade');
  ok(B.ownSession({ metadata: { kit: 'complete', email: 'a@b.c' } }) && !B.ownSession({ metadata: { kit: 'x' } }), 'the shared account\'s webhook knows a kit sale as the site\'s own');
  rmSync(T, { recursive: true, force: true });
}

/* ---------- 3. the pages ---------- */
if (!NO_BROWSER) {
  const require = createRequire(import.meta.url), { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const browser = await chromium.launch();
  const BRAND = { phone: '(562) 999-4994', website: 'longbeachphonebuyers.com', name: '', area: { home: 'Long Beach, CA', zip: '90802', cover: ['Lakewood, CA'] } };
  const logos = await imp('netlify/lib/logos.mjs');
  async function open(path, { demo = true, token = null, route = null, scheme = 'dark', width = 1300, kit = null, brand = BRAND, init = null } = {}) {
    const ctx = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: scheme, acceptDownloads: true });
    const page = await ctx.newPage(), errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(([brand, demo, token, kit]) => {
      if (sessionStorage.getItem('__lc')) return; sessionStorage.setItem('__lc', '1');
      localStorage.clear();
      if (brand) localStorage.setItem('pgfx_brand', JSON.stringify(brand));
      if (demo) localStorage.setItem('pgfx_local_demo', '1');
      if (token) localStorage.setItem('pgfx_token', JSON.stringify(token));
      if (kit) localStorage.setItem('pgfx_logo_kit', JSON.stringify({ v: 1, design: kit, at: 1 }));
    }, [brand, demo, token, kit]);
    if (init) await page.addInitScript(init);
    if (route) await page.route('**/api/**', route);
    await page.goto(BASE + path, { waitUntil: 'load' });
    return { page, ctx, errors };
  }
  const tiles = (page) => page.evaluate(() => document.querySelectorAll('#lg-grid .lg-tile:not(.wait)').length);
  const waitTiles = (page, n) => page.waitForFunction((n) => document.querySelectorAll('#lg-grid .lg-tile:not(.wait)').length >= n && !document.querySelector('#lg-grid .lg-tile.wait'), n, { timeout: 60000 });

  // a new visitor, from nothing to a logo
  {
    const { page, ctx, errors } = await open('logo/', { brand: null });
    await page.waitForFunction(() => window.LogoMaker, null, { timeout: 20000 });
    ok(await page.evaluate(() => document.getElementById('lg-gallery').hidden), 'a new visitor sees step 1 only');
    const t0 = Date.now();
    await page.fill('#lg-name', 'Gold Rush Cash');
    await page.selectOption('#lg-cat', 'gold');
    await page.click('#lg-go');
    await waitTiles(page, 24);
    const secs = (Date.now() - t0) / 1000;
    ok(secs < 20, '24 finished logos in ' + secs.toFixed(1) + ' s after Show my logos (a minute is the brief)');
    console.log('  24 logos drawn ' + secs.toFixed(1) + ' s after Show my logos');
    ok(await tiles(page) === 24, '24 logos (' + await tiles(page) + ')');
    const kinds = await page.evaluate(() => [...document.querySelectorAll('#lg-grid .lg-tile')].map((b) => b.dataset.t));
    ok(kinds.includes('coin') && new Set(kinds).size >= 12, 'gold\'s own Coin is among them, and 12 layouts or more (' + new Set(kinds).size + ')');
    await page.click('#lg-grid .lg-tile >> nth=2');
    await page.waitForFunction(() => document.getElementById('lg-edit').dataset.drawn, null, { timeout: 30000 });
    const st = await page.evaluate(() => ({ edit: !document.getElementById('lg-edit').hidden, kit: JSON.parse(localStorage.getItem('pgfx_logo_kit') || 'null'), rows: ['row-pair', 'row-voice', 'row-layout', 'row-icon'].map((id) => document.querySelectorAll('#' + id + ' button').length), files: document.querySelectorAll('#files-logo figure[data-drawn]').length }));
    ok(st.edit && st.kit && st.kit.design && st.kit.design.name === 'Gold Rush Cash' && st.kit.design.cat === 'gold', 'one tap: the rows open, and the logo is kept for the site');
    ok(st.rows.every((n) => n >= 5) && st.files === 6, 'four rows of the logo, 5 to 8 each, and its six files (' + st.rows.join(', ') + '; ' + st.files + ')');
    console.log('  name typed, logos shown, one picked and drawn in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
    const folded = await page.evaluate(() => { const d = document.getElementById('lg-tweak'); return !!d && !d.open && d.querySelectorAll('.lg-row').length === 5 && !!document.getElementById('ok-all'); });
    ok(folded, 'the five rows that change the logo are folded until asked for, and Make my whole kit now is beside Next');
    await page.click('#lg-tweak > summary');
    const before = st.kit.design.pair;
    await page.click('#row-pair button >> nth=3');
    await page.waitForFunction((p) => { const k = JSON.parse(localStorage.getItem('pgfx_logo_kit') || 'null'); return k && k.design.pair !== p; }, before, { timeout: 10000 }).catch(() => {});
    ok(await page.evaluate((p) => JSON.parse(localStorage.getItem('pgfx_logo_kit')).design.pair !== p, before), 'a colour in the row changes the logo');
    await page.click('#lg-tabs button[data-g="monogram"]');
    await waitTiles(page, 6);
    ok(await page.evaluate(() => [...document.querySelectorAll('#lg-grid .lg-tile')].every((b) => ['monogram', 'roundel'].includes(b.dataset.t))), 'the Initials tab shows monograms');
    await page.click('#lg-tabs button[data-g=""]'); await waitTiles(page, 24);
    await page.click('#lg-more'); await waitTiles(page, 48);
    ok(await tiles(page) === 48, 'More adds 24 more');
    // name ideas: the customer's words mixed into names, each a finished little logo
    await page.click('#nm-open'); await page.fill('#nm-words', 'Maria, harbor'); await page.click('#nm-go');
    await page.waitForFunction(() => document.querySelectorAll('#nm-grid .nm-idea').length >= 12, null, { timeout: 20000 });
    const ideas = await page.evaluate(() => [...document.querySelectorAll('#nm-grid .nm-idea b')].map((b) => b.textContent));
    ok(ideas.length === 12 && ideas.some((n) => /Maria/.test(n)) && ideas.every((n) => !/apple|samsung|best|#1/i.test(n)), 'name ideas: 12, the customer\'s own word among them, no brand or claim (' + ideas.slice(0, 5).join(' | ') + ')');
    // the kit, step by step, then the whole of it
    await page.click('#ok-logo');
    await page.waitForFunction(() => !document.getElementById('kit-review').hidden && document.getElementById('kit-all').dataset.drawn && ['social', 'card', 'posts', 'print'].every((k) => document.getElementById('files-' + k).dataset.drawn), null, { timeout: 90000 });
    const rv = await page.evaluate(() => ({ all: document.querySelectorAll('#kit-all figure[data-drawn]').length, steps: ['social', 'card', 'posts', 'print'].map((k) => document.querySelectorAll('#files-' + k + ' figure[data-drawn]').length), ticks: document.querySelectorAll('#kit-rail a.done').length, tiers: document.querySelectorAll('#kit-tiers .kit-tier').length, titles: document.querySelectorAll('#kit-all figcaption b').length }));
    ok(rv.all === 50 && rv.titles === 50 && rv.tiers === 2, 'the review: Complete\'s 50 files in a grid, each with its title, and the two kits (' + rv.all + ')');
    ok(rv.steps.join() === '10,2,22,10' && rv.ticks === 3, 'the steps show their files (' + rv.steps.join(', ') + ') and the rail ticks what is approved (' + rv.ticks + ')');
    await page.click('#ok-social'); await page.click('#ok-card');
    ok(await page.evaluate(() => document.querySelectorAll('#kit-rail a.done').length) === 5, 'Looks good ticks a step');
    await page.click('#kit-tiers [data-tier="essentials"]');
    await page.waitForFunction(() => document.querySelectorAll('#kit-all figure').length === 20 && document.querySelectorAll('#kit-all figure[data-drawn]').length === 20, null, { timeout: 60000 });
    ok(true, 'Essentials: 20 files in the review');
    await page.fill('#det-person', 'Maria Lopez');
    await page.waitForTimeout(600);
    // the kit, drawn here in the local demo, as one folder
    const dl = page.waitForEvent('download', { timeout: 120000 });
    await page.click('#kit-dl');
    const d = await dl.catch(() => null);
    const zp = d ? await d.path() : null, buf = zp ? readFileSync(zp) : null;
    const entries = [];
    if (buf) for (let o = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06])), n = buf.readUInt16LE(o + 10), p = buf.readUInt32LE(o + 16), i = 0; i < n; i++) {
      const len = buf.readUInt32LE(p + 20), nl = buf.readUInt16LE(p + 28), off = buf.readUInt32LE(p + 42), name = buf.slice(p + 46, p + 46 + nl).toString();
      const data = buf.slice(off + 30 + buf.readUInt16LE(off + 26), off + 30 + buf.readUInt16LE(off + 26) + len);
      entries.push({ name, data }); p += 46 + nl;
    }
    const png = (n) => { const e = entries.find((x) => x.name.endsWith(n)); return e && e.data.readUInt32BE(0) === 0x89504e47 ? [e.data.readUInt32BE(16), e.data.readUInt32BE(20)] : null; };
    ok(d && /gold-rush-cash-brand-kit\.zip$/.test(d.suggestedFilename()), 'the kit saves as one zip (' + (d && d.suggestedFilename()) + ')');
    const pngs = entries.filter((e) => e.name.endsWith('.png')).length, pdf = entries.find((e) => e.name.endsWith('business-card-print.pdf'));
    ok(pngs === 20 && entries.filter((e) => e.name.endsWith('.svg')).length === 6 && pdf && pdf.data.slice(0, 5).toString() === '%PDF-' && entries.some((e) => e.name.endsWith('README.txt')), 'Essentials\' folder: 20 pictures, the 6 logo vectors, the card\'s print PDF and a note (' + entries.length + ' files)');
    const pp = png('profile-instagram-facebook-tiktok.png'), cv = png('facebook-cover.png'), lg = png('01-logo/logo-full-colour.png'), cf = png('business-card-front.png');
    ok(pp && pp[0] === 1080 && cv && cv[0] === 1640 && cv[1] === 624 && lg && Math.max(...lg) === 2400 && cf && cf[0] === 1125 && cf[1] === 675, 'each picture at its size (' + JSON.stringify({ pp, cv, lg, cf }) + ')');
    ok(entries.every((e) => /^gold-rush-cash-brand-kit\/(0\d|10)-[a-z-]+\/|README/.test(e.name)), 'the folders are numbered in the order of the steps');
    // the same kit again, as vectors: a file type is the customer's to pick, as often as they like
    await page.click('#kit-buy [data-fmt="svg"]');
    const dl2 = page.waitForEvent('download', { timeout: 120000 });
    await page.click('#kit-dl');
    const d2 = await dl2.catch(() => null), b2 = d2 ? readFileSync(await d2.path()) : null, names2 = [];
    if (b2) for (let o = b2.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06])), n = b2.readUInt16LE(o + 10), p = b2.readUInt32LE(o + 16), i = 0; i < n; i++) { const nl = b2.readUInt16LE(p + 28); names2.push(b2.slice(p + 46, p + 46 + nl).toString()); p += 46 + nl + b2.readUInt16LE(p + 30) + b2.readUInt16LE(p + 32); }
    ok(d2 && /brand-kit-svg\.zip$/.test(d2.suggestedFilename()) && names2.filter((n) => n.endsWith('.svg')).length === 20 && !names2.some((n) => n.endsWith('.png')) && names2.some((n) => n.endsWith('business-card-print.pdf')),
      'downloaded again as SVG: the same 20 files as vectors, and the card\'s print PDF (' + names2.length + ')');
    ok(await page.evaluate(() => !document.getElementById('row-finish').hidden || document.querySelectorAll('#row-finish button').length === 0), 'the Finish row shows where the logo has a body');
    ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, 'no sideways scroll at 1300');
    ok(errors.length === 0, 'no page error (' + errors.slice(0, 2).join(' | ') + ')');
    await ctx.close();
  }
  // the paywall, the function stood in for
  const stand = (plan, { kits = null } = {}) => { const calls = [], saved = []; const fn = async (route) => {
    const u = new URL(route.request().url()), p = u.pathname.replace(/^.*\/api/, '');
    const body = (() => { try { return JSON.parse(route.request().postData() || '{}'); } catch (e) { return {}; } })();
    calls.push(p + (body.kit ? ':' + body.kit : ''));
    fn.last = body;
    const json = (status, j) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(j) });
    if (p === '/me') return json(200, { user: { email: 'c@x.example', plan, role: 'user' } });
    const paid = ['pro', 'business'].includes(plan), view = () => ({ included: paid ? 'complete' : null, credits: { essentials: 0, complete: 0 }, saved, prices: { essentials: 1499, complete: 1999, upgrade: 500, addonOff: 500 } });
    if (p === '/kits') return json(200, kits || view());
    if (p === '/kits/save') { if (!paid) return json(402, { error: 'Buy a brand kit', needs: 'kit', ...view() }); const kit = { id: 'k1', name: body.spec.design.name, tier: 'complete', spec: body.spec, at: 1, via: 'plan' }; saved.splice(0, saved.length, kit); return json(200, { kit, ...view() }); }
    if (p === '/kits/file') { const k = saved.find((x) => x.id === body.id); return k ? json(200, { kit: k, ...(await logos.brandKitFiles(k.spec, k.tier)) }) : json(404, { error: 'no' }); }
    if (p === '/checkout') return json(503, { error: 'Billing is not enabled yet' });
    return json(404, { error: 'not here' });
  }; fn.calls = calls; return fn; };
  const KIT = { t: 'stamp', name: 'Long Beach Phone Buyers', cat: 'phones', voice: 'stadium', pair: 'black_cyan', icon: 'phone', seed: 3 };
  const pre = (page) => page.waitForFunction(() => document.getElementById('lg-edit').dataset.drawn && document.getElementById('kit-all').dataset.drawn, null, { timeout: 90000 });
  const withPick = () => { localStorage.setItem('pgfx_logo', JSON.stringify({ name: 'Long Beach Phone Buyers', cat: 'phones', ok: { logo: true }, tier: 'essentials', picked: { t: 'stamp', name: 'Long Beach Phone Buyers', cat: 'phones', voice: 'stadium', pair: 'black_cyan', icon: 'phone', seed: 3 } })); };
  {
    const { page, ctx } = await open('logo/', { demo: false, route: stand('free'), init: withPick });
    await pre(page);
    const m = await page.evaluate(() => ({ big: document.getElementById('lg-big').dataset.marked, files: [...document.querySelectorAll('#kit-all figure')].every((f) => f.dataset.marked === 'true'), w: Math.max(...[...document.querySelectorAll('#kit-all canvas')].map((c) => Math.max(c.width, c.height))), go: document.getElementById('kit-pay-go') && document.getElementById('kit-pay-go').disabled }));
    ok(m.big === 'true' && m.files && m.w <= 420, 'signed out: every preview is marked and small (' + m.w + ' px at most)');
    ok(m.go === true, 'signed out: Buy waits for the Terms to be agreed');
    await page.check('#kit-agree'); await page.click('#kit-pay-go'); await page.waitForTimeout(500);
    ok(await page.evaluate(() => !!document.querySelector('.acct-overlay.show')), 'signed out: Buy opens the account dialog');
    await ctx.close();
  }
  {
    const s = stand('basic'); const { page, ctx } = await open('logo/', { demo: false, token: 'tok', route: s, init: withPick });
    await pre(page);
    ok(await page.evaluate(() => document.getElementById('lg-big').dataset.marked === 'true' && /\$14\.99/.test(document.getElementById('kit-buy').textContent)), 'Starter: marked, and Essentials offered at $14.99');
    await page.click('#kit-tiers [data-tier="complete"]'); await page.waitForTimeout(300);
    ok(await page.evaluate(() => /Buy Complete for \$19\.99/.test(document.getElementById('kit-buy').textContent)), 'Complete at $19.99');
    let got = null; page.on('download', (x) => { got = x; });
    await page.check('#kit-agree'); await page.click('#kit-pay-go'); await page.waitForTimeout(900);
    ok(s.calls.includes('/checkout:complete') && s.last && s.last.consent === true && !got && /opens soon/.test(await page.textContent('#kit-buy')), 'Starter: Buy asks the function for a Complete checkout with the agreement, and no file comes (' + s.calls.join(', ') + ')');
    await ctx.close();
  }
  for (const scheme of ['dark', 'light']) {
    const s = stand('pro'); const { page, ctx, errors } = await open('logo/', { demo: false, token: 'tok', route: s, scheme, init: withPick });
    await pre(page);
    ok(await page.evaluate(() => document.getElementById('lg-big').dataset.marked === 'false' && [...document.querySelectorAll('#kit-all figure')].every((f) => f.dataset.marked === 'false')), 'Pro (' + scheme + '): the previews are clean');
    const dl = page.waitForEvent('download', { timeout: 120000 });
    await page.click('#kit-dl');
    const d = await dl.catch(() => null);
    ok(d && /long-beach-phone-buyers-brand-kit\.zip$/.test(d.suggestedFilename()), 'Pro: the kit saved and downloaded from the function\'s files (' + s.calls.join(', ') + ')');
    ok(s.calls.includes('/kits/save') && s.calls.includes('/kits/file'), 'Pro: saved to the account, then drawn by the function');
    ok(errors.length === 0, 'Pro (' + scheme + '): no page error (' + errors.slice(0, 2).join(' | ') + ')');
    await ctx.close();
  }
  for (const width of [390, 768]) {
    const { page, ctx } = await open('logo/', { width, init: withPick });
    await pre(page);
    ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, width + ' px: no sideways scroll on the logo maker with the kit open');
    await ctx.close();
  }
  // the card maker: Brand cards wear the logo (DESIGN-LAW 185); Promo cards lead with it
  {
    const { page, ctx, errors } = await open('cards/', { kit: KIT, brand: { ...BRAND, name: 'Long Beach Phone Buyers' } });
    const tiles = () => page.waitForFunction(() => document.getElementById('cd-gal').dataset.drawn && document.querySelectorAll('#cd-gal .cd-pick').length && !document.querySelector('#cd-gal .cd-pick.wait'), null, { timeout: 60000 });
    await tiles();
    const g = await page.evaluate(() => ({ n: document.querySelectorAll('#cd-gal .cd-pick').length, mode: CardMaker.mode(), layouts: [...document.querySelectorAll('#cd-gal .cd-pick')].map((b) => b.dataset.blayout), custom: document.getElementById('cd-custom').hidden }));
    ok(g.n === 12 && g.mode === 'brand' && g.custom && new Set(g.layouts).size === 8 && g.layouts.every(Boolean), 'the card maker opens on 12 brand cards in all eight layouts, Customise behind them (' + g.layouts.join(',') + ')');
    await page.click('#cd-gal .cd-pick >> nth=1');
    await page.waitForFunction(() => !document.getElementById('cd-custom').hidden, null, { timeout: 10000 });
    const r = await page.evaluate(async () => { const f = await CardMaker.render('front'), L = f.boxes.find((b) => b.role === 'logo'); return { L, kit: JSON.parse(localStorage.getItem('pgfx_logo') || '{}').card, design: CardMaker.brandDesign(), kitDesign: CardMaker.kit() }; });
    ok(r.L && r.L.x0 >= 75 - .5 && r.L.y0 >= 75 - .5 && r.L.x1 <= 1050 + .5 && r.L.y1 <= 600 + .5 && r.L.x1 - r.L.x0 > 975 * .4, 'a tap opens Customise on the card, the logo large inside the safe area');
    ok(r.kit && r.kit.layout === 'left' && r.kit.ground === 'paper', 'the card picked is written to the kit, so the kit\'s card is this one (' + JSON.stringify(r.kit) + ')');
    ok(r.design.pair === r.kitDesign.pair && r.design.t === r.kitDesign.t, 'a brand card wears the logo picked in the logo maker, in its own colours');
    await page.click('#cd-tab-promo'); await tiles();
    const p = await page.evaluate(() => [...document.querySelectorAll('#cd-gal .cd-pick')].map((b) => b.dataset.layout));
    ok(p.length === 12 && p.slice(0, 3).every((l) => l === 'logo'), 'Promo cards: the logo leads there too (' + p.join(',') + ')');
    const counts = p.reduce((a, l) => (a[l] = (a[l] || 0) + 1, a), {});
    ok(Object.entries(counts).every(([l, n]) => l === 'logo' || n <= 2), 'no promo layout more than twice in the gallery (' + JSON.stringify(counts) + ')');
    ok(errors.length === 0, 'the card maker: no page error (' + errors.slice(0, 2).join(' | ') + ')');
    await ctx.close();
  }
  // the full ad, wearing it
  {
    const { page, ctx, errors } = await open('index.html?brand=logo', { kit: KIT, brand: { ...BRAND, name: 'Long Beach Phone Buyers' } });
    await page.waitForFunction(() => window.FullAdStudio && FullAdStudio.isOn(), null, { timeout: 40000 });
    const r = await page.evaluate(async () => {
      document.getElementById('ez-phone').value = '(562) 999-4994';
      const out = [];
      for (const seed of [1, 2, 3]) { FullAdStudio.state.seed = seed; const { ad } = await FullAdStudio.build(1080); const c = await FullAdStudio.check(1080); out.push({ logo: !!(ad.claim && ad.claim.logo), ok: c.ok, fixes: c.fixes, colour: c.colour }); }
      return { on: FullAdStudio.logoOn(), out, field: !!document.getElementById('fa-logo') };
    });
    ok(r.on && r.field && r.out.every((x) => x.logo), 'the full ad wears the logo on its badge, and says so in its form');
    ok(r.out.every((x) => x.ok), 'the full ad with the logo passes its pre-flight (' + r.out.map((x) => x.fixes.join('; ')).filter(Boolean).join(' | ') + ')');
    ok(r.out[0].colour === 'black_cyan', 'it opens in the logo\'s colours (' + r.out[0].colour + ')');
    ok(errors.length === 0, 'Easy Mode: no page error (' + errors.slice(0, 2).join(' | ') + ')');
    await ctx.close();
  }
  await browser.close();
}
console.log((fails ? 'LOGO MAKER: ' + fails + ' failure(s), ' : 'logo_check: ') + passes + ' passed');
process.exit(fails ? 1 : 0);
