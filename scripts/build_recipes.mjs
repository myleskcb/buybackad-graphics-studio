#!/usr/bin/env node
/* EVERY OLDER AD, AS A RECIPE THE HOUSE ENGINE DRAWS: motion/recipes.json.

   The owner, 2026-11-18: "rebuild how we arrived to these ads so every single one can be made a
   video or at least audited", "aren't all photo ads supposed to be made into a video", "retire
   but bg counts.. so combo of assets and bg is best though", "wrong cars" ("not bmw", "not a
   lexus lmao"), "good info good layout poor styling".

   The older generations (library cards, designer layouts, the offer family) are fabric pictures:
   no video, no pre-flight of the full ad's, colours off the twelve pairs. What is good in them is
   their information: the words, the product they show, the photograph they stand on. This reads
   every one the studio offers (catTemplates for the designer layouts and offer cards, scLoadIndex
   for the library), as it opens, and writes a recipe the full ad (motion/fullad.js, rule 137)
   draws as a photo and as a video:

     words         headline (the headline layers, in order), the line under it (Models / Items),
                   the claim (the kicker or the badge row), up to three selling points (badges,
                   tiles, chips: 16 letters at most each), the sticker, the call to action; a line
                   with a phrase of the one list (motion/banned-words.js) or a claim that needs
                   proof (fullWords' PROOF) is dropped, never carried over; the towns, the number
                   and the website are the customer's own
     subject       the full ad's line (motion/subjects.json): the offer card's own; else the
                   category, and for phones the device its headline names
     pictures      its own product cut-outs that are neither flagged nor rejected; a car card that
                   names a make shows that make (assets/cutouts/car-<make>-*), whatever the card
                   showed; none, and the line's own pool draws by the seed
     ground_photo  { src, focus, scrim, from }: the photograph it stood on, unless that is cash,
                   outer space for goods that are not about space, or a car of another make than
                   the one it names (the research and the owner: rule 144)
     pair          its theme where that is one of the twelve, else the nearest of them in OKLab
     type_pair     the face pair it wore where the full ad holds it (motion/full-voices.js)

   usage:  GFX_BASE=http://127.0.0.1:8931/ node scripts/build_recipes.mjs           # rewrite motion/recipes.json
           GFX_BASE=http://127.0.0.1:8931/ node scripts/build_recipes.mjs --check   # exit 1 if it is stale
   (both read the studio as it serves: the static server must be running) */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const ROOT = new URL('../', import.meta.url).pathname, OUT = ROOT + 'motion/recipes.json';
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8931/').replace(/\/?$/, '/');
const CHECK = process.argv.includes('--check');
const read = p => readFileSync(ROOT + p, 'utf8');

const { bannedIn } = await import(new URL('../motion/banned-words.js', import.meta.url).href);
const { HOUSE_COLOURS } = await import(new URL('../motion/house-colours.js', import.meta.url).href);
const { FONTS, TYPE_VOICES } = await import(new URL('../motion/catalog.js', import.meta.url).href);
const { FULL_VOICES } = await import(new URL('../motion/full-voices.js', import.meta.url).href);
const SUBJECTS = JSON.parse(read('motion/subjects.json')).subjects;
const SUB = Object.fromEntries(SUBJECTS.map(s => [s.key, s]));
const flags = JSON.parse(read('assets/cutout-flags.json'));
const grid = (JSON.parse(read('assets/approved-assets.json'))['asset-grid-v1']) || {};
const rejected = new Set([].concat(grid.rejected || []).map(x => typeof x === 'string' ? x : x.id));
const CUTS = new Set(readdirSync(ROOT + 'assets/cutouts').filter(f => f.endsWith('.webp')).map(f => f.slice(0, -5)));
const usable = f => CUTS.has(f) && !flags[f] && !rejected.has(f);

/* ---------------------------------------------------------------- the ads, as the studio offers them */
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
let got;
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(BASE, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => typeof TEMPLATES !== 'undefined' && TEMPLATES.length > 100 && typeof catTemplates === 'function' && typeof scLoadIndex === 'function' && typeof setCategory === 'function', null, { timeout: 120000 });
  got = await page.evaluate(async () => {
    const slim = t => ({
      id: t.id, name: t.name, cat: t.cat, line: t.line || '', look: t.look || '', pal: t.pal || '', faces: t.faces || null, palette: t.palette || null,
      bg: t.bg ? { type: t.bg.type, src: t.bg.src || '', scrim: t.bg.scrim, focus: t.bg.focus || t.bg.pos || null, c1: t.bg.fallback && t.bg.fallback.c1 } : null,
      layers: (t.layers || []).map(l => ({ kind: l.kind, name: l.name || '', role: l.role || '', text: typeof l.text === 'string' ? l.text : undefined, src: l.src || (l.props && l.props.src) || l.asset || '',
        fill: l.props && typeof l.props.fill === 'string' ? l.props.fill : '', grad: l.props && l.props.grad ? l.props.grad.c1 : '', font: l.props && l.props.fontFamily || '' })),
    });
    const cats = [...new Set(TEMPLATES.filter(t => !t.showcase).map(t => t.cat))], out = [], seen = new Set(), keep = currentCat;
    for (const c of cats) { try { setCategory(c); catTemplates().filter(t => !t.showcase && /^(dl|of)_/.test(t.id)).forEach(t => { if (!seen.has(t.id)) { seen.add(t.id); out.push(slim(t)); } }); } catch (e) { /* a category that will not open */ } }
    try { setCategory(keep); } catch (e) { /* as it was */ }
    const cards = await scLoadIndex();
    return { templates: out, cards: cards.map(c => ({ id: c.id, name: c.name, cat: c.cat, theme: c.theme || '', faces: c.faces || null, c1: c.c1 || '', accent: c.accent || '' })) };
  });
} finally { await browser.close(); }
for (const c of got.cards) {
  const rec = JSON.parse(read('assets/showcase/tpl/' + c.id + '.json')).tpl;
  c.layers = (rec.layers || []).map(l => ({ kind: l.kind, name: l.name || '', role: l.role || '', text: typeof l.text === 'string' ? l.text : undefined, src: l.src || (l.props && l.props.src) || '' }));
  c.bg = rec.bg ? { type: rec.bg.type, src: rec.bg.src || '', scrim: rec.bg.scrim, focus: rec.bg.focus || rec.bg.pos || null, c1: rec.bg.fallback && rec.bg.fallback.c1 } : null;
}

/* ---------------------------------------------------------------- colour: the nearest of the twelve */
const lin = v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
const oklab = hex => {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim()); if (!m) return null;
  const [r, g, b] = [0, 2, 4].map(i => lin(parseInt(m[1].slice(i, i + 2), 16)));
  const l = Math.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b), mm = Math.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b), s = Math.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b);
  return [.2104542553 * l + .793617785 * mm - .0040720468 * s, 1.9779984951 * l - 2.428592205 * mm + .4505937099 * s, .0259040371 * l + .7827717662 * mm - .808675766 * s];
};
const dist = (a, b) => a && b ? Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) : 1;
const PAIRS = HOUSE_COLOURS.map(c => ({ key: c.key, name: c.name, g: oklab(c.colors.ground), a: oklab(c.colors.accent), suits: c.suits || null }));
const RESTRICTED = new Set(PAIRS.flatMap(p => p.suits || []));
function pairOf(theme, ground, accent, subject) {
  const fit = PAIRS.filter(p => !RESTRICTED.has(subject) || (p.suits || []).includes(subject));   // gold, silver, strips, Pokémon keep to their own (rule 139)
  const named = fit.find(p => p.name.toLowerCase() === String(theme || '').toLowerCase());
  if (named) return named.key;
  const G = oklab(ground), A = oklab(accent);
  if (!G && !A) return '';
  return fit.map(p => [p.key, dist(G, p.g) + 1.4 * dist(A, p.a)]).sort((x, y) => x[1] - y[1])[0][0];
}
const neutral = hex => { const L = oklab(hex); return !L || Math.hypot(L[1], L[2]) < .04; };

/* ---------------------------------------------------------------- type: a pair the full ad holds */
const KEY_OF_FAMILY = Object.fromEntries(Object.entries(FONTS).map(([k, v]) => [String(v[0]).toLowerCase(), k]));
function voiceOf(family) {
  const k = KEY_OF_FAMILY[String(family || '').toLowerCase()]; if (!k) return '';
  return FULL_VOICES.find(v => TYPE_VOICES[v] && String(TYPE_VOICES[v].display).replace(/-\d+$/, '') === k) || '';
}

/* ---------------------------------------------------------------- words */
const PROOF = /(^|[^A-Z0-9])(#\s?1|NO\.?\s?1|NUMBER ONE|BEST|HIGHEST|FASTEST|GUARANTEED?|MOST MONEY|LOWEST|UNBEATABLE)([^A-Z0-9]|$)/i;
const tidy = s => String(s || '').replace(/\s+/g, ' ').trim();   // a line break in a layer is a space here
const up = s => tidy(s).toUpperCase().replace(/\bIPHONE/g, 'iPHONE').replace(/\bIPAD/g, 'iPAD').replace(/\.$/, '');
const CLAIM_NAMES = /^(Kicker|Neon Kicker|Sub Kicker|Status Text|Ribbon Text|Ribbon|Tag Text|Banner Text|Seal Legend|Price Line|Badge Text)$/i;
const LINE_NAMES = /^(Models?|Items|Devices|Model Line|Item Line|Data Line)$/i;
const STICKER = /sticker|seal text|burst|stamp|ticket/i;
const POINT_NAMES = /^(Tile Big \d|Chip \d|Chip Text \d?|Check \d|Point \d|Badge \d|Check Text \d)$/i;
function wordsOf(ad, cat, dropped) {
  const L = ad.layers.filter(l => typeof l.text === 'string' && tidy(l.text) && /[A-Za-z]/.test(l.text));
  const keep = (field, text) => {
    if (!text) return '';
    const b = bannedIn(text, cat);
    if (b.length) { dropped.push(`${field}: "${text}" (${b.map(x => x.label).join(', ')})`); return ''; }
    if (PROOF.test(text)) { dropped.push(`${field}: "${text}" (a claim that needs proof)`); return ''; }
    return text;
  };
  const headline = keep('headline', up(L.filter(l => l.role === 'headline').map(l => l.text).join(' ')));
  let line = L.find(l => LINE_NAMES.test(l.name));
  const tag = keep('line under it', line ? up(line.text).slice(0, 60) : '');
  const kick = L.find(l => CLAIM_NAMES.test(l.name)), badges = L.filter(l => l.role === 'badges').map(l => tidy(l.text));
  let claim = kick ? up(kick.text) : badges.length ? up(badges.join(' • ')) : '';
  claim = claim.replace(/^\/\/\s*|\s*\/\/$/g, '');
  if (claim.length > 34) claim = '';
  claim = keep('claim', claim);
  const pts = [];
  for (const l of L) {
    const parts = POINT_NAMES.test(l.name) ? [l.text] : l.role === 'badges' && !kick ? [] : l.role === 'badges' ? String(l.text).split(/[•·\n]/) : [];
    for (const p of parts) { const t = up(p).replace(/^[✓✔\s]+/, ''); if (t.length >= 3 && t.length <= 16 && !pts.includes(t) && !/^\d+$/.test(t)) pts.push(t); }
  }
  const points = pts.map(p => keep('selling point', p)).filter(Boolean).slice(0, 3);
  const st = L.find(l => STICKER.test(l.name) && up(l.text).length <= 14);
  const burst = keep('sticker', st ? up(st.text) : '');
  const cta = L.find(l => l.role === 'cta' && tidy(l.text).length <= 24);
  const label = keep('call to action', cta ? up(cta.text) : '');
  const out = {};
  if (headline) out.headline = headline;
  if (tag) out.tag = tag;
  if (claim) out.claim = claim;
  if (points.length >= 2) out.points = points.join(', ');
  if (burst) out.burst = burst;
  if (label) out.label = label;
  return out;
}

/* ---------------------------------------------------------------- the line, the pictures, the ground */
const PHONE_LINES = [[/\bIPADS?\b/i, 'ipad'], [/\bMACBOOKS?\b|\bIMACS?\b|\bMACS?\b/i, 'mac'], [/\bWATCH(ES)?\b/i, 'watch'], [/\bGALAXY\b|\bSAMSUNG/i, 'galaxy'], [/\bPIXELS?\b|\bGOOGLE\b/i, 'pixel'], [/\bFOLD|\bFLIP\b/i, 'foldable']];
const CAT_LINE = { gold: 'gold', silver: 'silver', coins: 'coins', cars: 'car', strips: 'strips', pokemon: 'pokemon', sports: 'sports' };
function subjectOf(ad, headline) {
  if (ad.line && SUB[ad.line]) return ad.line;
  if (CAT_LINE[ad.cat]) return CAT_LINE[ad.cat];
  if (ad.cat === 'phones') { for (const [re, k] of PHONE_LINES) if (re.test(headline)) return k; return 'iphone'; }
  const first = SUBJECTS.find(s => s.cat === ad.cat); return first ? first.key : 'iphone';
}
const MAKES = { honda: /\bHONDAS?\b|\bCIVICS?\b|\bACCORDS?\b/, chevy: /\bCHEV(Y|YS|IES|ROLETS?)\b|\bSILVERADOS?\b/, ford: /\bFORDS?\b|\bF-?150S?\b|\bMUSTANGS?\b|\bBRONCOS?\b/,
  toyota: /\bTOYOTAS?\b|\bTACOMAS?\b|\bCAMRYS?\b|\bTUNDRAS?\b|\bPRIUS\b|\bRAV4S?\b/, bmw: /\bBMWS?\b/, nissan: /\bNISSANS?\b/, jeep: /\bJEEPS?\b|\bWRANGLERS?\b/,
  dodge: /\bDODGES?\b|\bCHALLENGERS?\b|\bCHARGERS?\b/, lexus: /\bLEXUS(ES)?\b/, tesla: /\bTESLAS?\b/, mercedes: /\bMERCEDES\b|\bBENZ\b/, audi: /\bAUDIS?\b/, gmc: /\bGMCS?\b/,
  subaru: /\bSUBARUS?\b/, kia: /\bKIAS?\b/, hyundai: /\bHYUNDAIS?\b/, porsche: /\bPORSCHES?\b/, vw: /\bVWS?\b|\bVOLKSWAGENS?\b/, volvo: /\bVOLVOS?\b/, mazda: /\bMAZDAS?\b/ };
/* a model the words name: its own cut-out where there is one (WE BUY TACOMAS shows a Tacoma, not any Toyota) */
const MODELS = [[/\bTACOMAS?\b/, 'toyota', 'tacoma'], [/\bTUNDRAS?\b/, 'toyota', 'tundra'], [/\bCAMRYS?\b/, 'toyota', 'camry'], [/\bCOROLLAS?\b/, 'toyota', 'corolla'], [/\bRAV4S?\b/, 'toyota', 'rav4'],
  [/\b4RUNNERS?\b/, 'toyota', '4runner'], [/\bPRIUS\b/, 'toyota', 'prius'], [/\bSUPRAS?\b/, 'toyota', 'supra'], [/\bHIGHLANDERS?\b/, 'toyota', 'highlander'],
  [/\bCIVICS?\b/, 'honda', 'civic'], [/\bACCORDS?\b/, 'honda', 'accord'], [/\bCR-?VS?\b/, 'honda', 'crv'], [/\bPILOTS?\b/, 'honda', 'pilot'],
  [/\bSILVERADOS?\b/, 'chevy', 'silverado'], [/\bTAHOES?\b/, 'chevy', 'tahoe'], [/\bCAMAROS?\b/, 'chevy', 'camaro'], [/\bCORVETTES?\b/, 'chevy', 'corvette'],
  [/\bF-?150S?\b/, 'ford', 'f150'], [/\bMUSTANGS?\b/, 'ford', 'mustang'], [/\bBRONCOS?\b/, 'ford', 'bronco'], [/\bRANGERS?\b/, 'ford', 'ranger'],
  [/\bCHALLENGERS?\b/, 'dodge', 'challenger'], [/\bCHARGERS?\b/, 'dodge', 'charger'], [/\bWRANGLERS?\b/, 'jeep', 'wrangler'], [/\bGLADIATORS?\b/, 'jeep', 'gladiator']];
const CAR_CUTS = {};
for (const f of CUTS) { const m = /^car-([a-z]+)-/.exec(f); if (m && usable(f)) (CAR_CUTS[m[1] === 'chevrolet' ? 'chevy' : m[1]] ||= []).push(f); }
for (const k of Object.keys(CAR_CUTS)) CAR_CUTS[k].sort((x, y) => (/-rear$/.test(x) - /-rear$/.test(y)) || x.localeCompare(y));   // a front or side view before a rear one
const makeOfFile = f => { const s = String(f || '').toLowerCase(); for (const k of Object.keys(MAKES)) if (new RegExp(`(^|[-/_])${k}([-_.]|$)`).test(s) || (k === 'chevy' && /chevrolet|silverado/.test(s)) || (k === 'dodge' && /challenger|charger/.test(s)) || (k === 'toyota' && /tacoma|camry|tundra|prius/.test(s)) || (k === 'honda' && /civic|accord/.test(s)) || (k === 'ford' && /f150|f-150|mustang|bronco/.test(s))) return k; return ''; };
const VEHICLE = /car|truck|suv|van|jeep|pickup|sedan|coupe|grille|wheel|dash|motorcycle|bike|vehicle|lamborghini|porsche|ferrari|bmw|lexus|dodge|honda|toyota|ford|chevy|nissan|tesla|audi|mercedes/i;
const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; };
function picturesOf(ad, subject, headline, claim, notes) {
  const own = ad.layers.map(l => (/assets\/cutouts\/([^/?#]+)\.webp/.exec(l.src || '') || [])[1]).filter(Boolean);
  let pics = own.filter(usable);
  if (own.length > pics.length) notes.push(`left out ${own.length - pics.length} flagged or rejected picture${own.length - pics.length > 1 ? 's' : ''}`);
  let make = '';
  if (subject === 'car') {
    const named = Object.keys(MAKES).filter(k => MAKES[k].test(headline + ' ' + claim));
    if (named.length) {
      make = named[0];
      const m = MODELS.find(([re, mk]) => mk === make && re.test(headline + ' ' + claim)), model = m ? m[2] : '';
      const fits = f => makeOfFile(f) === make && (!model || f.includes('-' + model));
      const ofMake = pics.filter(fits);
      const list = (CAR_CUTS[make] || []).filter(f => !model || f.includes('-' + model)), pool = list.length ? list : CAR_CUTS[make] || [];
      if (ofMake.length) pics = ofMake;
      else if (pool.length) { const front = pool.filter(f => !/-rear$/.test(f)), from = front.length ? front : pool; pics = [from[hash(ad.id) % from.length]]; notes.push(`a ${make}${model ? ' ' + model : ''} picture in place of ${own.length ? own.join(', ') : 'none'}`); }
      else { pics = []; notes.push(`no ${make} cut-out: the line's own pool`); }
    }
  }
  return { pictures: pics.slice(0, 2).map(file => ({ file, k: 1 })), make };
}
function groundOf(ad, cat, make, notes) {
  const g = ad.bg; if (!g || g.type !== 'image' || !/\.(jpe?g|png|webp)(\?|$)/i.test(g.src || '')) return null;
  const s = g.src.toLowerCase();
  if (/money|cash|dollar|bills/.test(s)) { notes.push('cash ground left out'); return null; }
  if (/space-|nebula|hubble|moon|starfield|aurora|earth-from-iss|orion|galaxy-/.test(s)) { notes.push('outer-space ground left out'); return null; }
  if (make && VEHICLE.test(s.split('/').pop()) && makeOfFile(s) !== make) { notes.push(`ground showed another car (${s.split('/').pop()})`); return null; }
  const f = Array.isArray(g.focus) ? g.focus : g.focus && typeof g.focus === 'object' ? [g.focus.x, g.focus.y] : [.5, .5];
  const scrim = Math.round(Math.min(.7, Math.max(.25, typeof g.scrim === 'number' ? g.scrim : .4)) * 100) / 100;
  return { src: g.src.replace(/^\/+/, ''), focus: f.map(v => Math.round((+v || .5) * 100) / 100), scrim, from: ad.id };
}

/* ---------------------------------------------------------------- the recipes */
const GEN = { sc: 'library card', dl: 'designer layout', of: 'offer card' };
const all = [...got.templates.map(t => ({ ...t, gen: /^dl_/.test(t.id) ? 'dl' : 'of' })), ...got.cards.map(c => ({ ...c, gen: 'sc' }))];
const recipes = [];
for (const ad of all) {
  const dropped = [], notes = [];
  const words = wordsOf(ad, ad.cat, dropped);
  const subject = subjectOf(ad, words.headline || '');
  const S = SUB[subject]; if (!S) continue;
  const { pictures, make } = picturesOf(ad, subject, words.headline || '', words.claim || '', notes);
  const ground_photo = groundOf(ad, ad.cat, make, notes);
  // colours as the ad wore them: the library's own theme and ink; a template's ground and its headline's accent
  const heads = ad.layers.filter(l => l.role === 'headline');
  const accent = ad.accent || (heads.map(l => l.grad || l.fill).find(c => /^#[0-9a-f]{6}$/i.test(c) && !neutral(c))) || (ad.palette && (ad.palette.accent || ad.palette.a1)) || '';
  const ground = ad.c1 || (ad.bg && ad.bg.c1) || (ad.palette && (ad.palette.bg || ad.palette.ground)) || '';
  const pair = pairOf(ad.theme, ground, accent, subject);
  const display = ad.faces ? (Array.isArray(ad.faces) ? ad.faces[0] : ad.faces.display) : (heads[0] && heads[0].font) || '';
  recipes.push({ id: 'r-' + ad.id, from: ad.id, gen: ad.gen, cat: S.cat, subject, label: `${ad.name} (${GEN[ad.gen]})`,
    words, pictures, ground_photo, pair, type_pair: voiceOf(display), ...(make ? { make } : {}), ...(dropped.length ? { dropped } : {}), ...(notes.length ? { notes } : {}) });
}
const ORDER = SUBJECTS.map(s => s.key);
recipes.sort((a, b) => ORDER.indexOf(a.subject) - ORDER.indexOf(b.subject) || ['sc', 'dl', 'of'].indexOf(a.gen) - ['sc', 'dl', 'of'].indexOf(b.gen) || a.id.localeCompare(b.id));
const count = k => recipes.filter(r => r.gen === k).length;
const json = JSON.stringify({
  _doc: 'Every older ad the studio offers (library cards, designer layouts, offer cards), read as it opens and written as a recipe the full ad draws as a photo and a video: its words (the one list and the proof words left out), its line, its product cut-outs (a named car make shown as that make), its ground photograph, the nearest of the twelve pairs and its face pair where the full ad holds it. Made by scripts/build_recipes.mjs; never edit by hand. DESIGN-LAW 144, OPEN-ITEMS §BJ.',
  count: recipes.length, by: { library: count('sc'), layouts: count('dl'), offer: count('of') }, recipes,
}, null, 1) + '\n';
if (CHECK) {
  const now = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (now !== json) { console.error(`motion/recipes.json is stale (${recipes.length} recipes from the studio as it serves now): run node scripts/build_recipes.mjs`); process.exit(1); }
  console.log(`motion/recipes.json is current: ${recipes.length} recipes`);
} else {
  writeFileSync(OUT, json);
  const withPic = recipes.filter(r => r.pictures.length).length, withGround = recipes.filter(r => r.ground_photo).length, cars = recipes.filter(r => r.make).length;
  console.log(`wrote motion/recipes.json: ${recipes.length} recipes (${count('sc')} library cards, ${count('dl')} designer layouts, ${count('of')} offer cards); ${withPic} with their own pictures, ${withGround} with a ground photograph, ${cars} cars that name a make; ${recipes.filter(r => r.dropped).length} with words dropped`);
}
