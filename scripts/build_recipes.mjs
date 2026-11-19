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
                   (kept for the record: the look leans by hint, below)
     type_pair     the face pair it wore where the full ad holds it (motion/full-voices.js)

   THE REBUILD (the owner, 2026-11-18, of the library cards and the offer family drawn this way:
   "Library card ones are not great.. I would take them as inspiration but rebuild them all",
   "Offer family needs a rebuild also", "they're alright at best and seem to follow their own set of
   rules ? things like the heros all look so simialr"). Every recipe was drawn on seed 1, so all the
   cards of a line drew one sticker, one treatment, one number and one arrangement, in their card's
   pair (one of twelve dark ones), on their card's photograph, with their card's picture. Now:
     seed          a seed of its own (its id, hashed): its look is the seed's draw
     look          what it takes after: its family (the card's idea: glassCard, ticketStub, an offer
                   card's layout: band, split ...) and its colourway (sun, blush, cobalt ...)
     hint          that, as a lean (spec/recipe-looks.json): the faces, grounds, treatments,
                   stickers, numbers, fills, arrangements and the tone and hue its seed leans toward;
                   fullad.js fullStyle draws from them by the table's share, else from everything. Its
                   card's face is the first face it leans to; its photograph (ground_photo) is a
                   ground it may stand on where the photograph fits the product it shows
     pictures      its own only where its words name the product (a make, a model, a van) or its line
                   has no pool; else none, and the line's pool draws by the seed, the in-demand
                   models first

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
const { FULL_STYLES } = await import(new URL('../motion/full-styles.js', import.meta.url).href);
const GROUNDS_M = await import(new URL('../motion/full-grounds.js', import.meta.url).href);
const LOOKS = JSON.parse(read('spec/recipe-looks.json'));
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
/* the owner's lines (2026-11-18): "iPhones, iPads, Macbooks, Macs, Androids (all), Pixel, Samsung, or
   foldables": an iMac, a Mac mini or a Mac Studio goes to Macs, a card that says Android to Androids */
const PHONE_LINES = [[/\bIPADS?\b/i, 'ipad'], [/\bIMACS?\b|\bMAC ?MINIS?\b|\bMAC STUDIOS?\b/i, 'macdesk'], [/\bMACBOOKS?\b|\bMACS?\b/i, 'mac'], [/\bWATCH(ES)?\b/i, 'watch'], [/\bANDROIDS?\b/i, 'android'],
  [/\bGALAXY\b|\bSAMSUNG/i, 'galaxy'], [/\bPIXELS?\b|\bGOOGLE\b/i, 'pixel'], [/\bFOLD|\bFLIP\b/i, 'foldable']];
// a line folded into another (offer-library.js alias: the Switch into Handhelds, Android tablets into Androids ...)
const ALIAS = JSON.parse(read('motion/subjects.json')).aliases || {};
const CAT_LINE = { gold: 'gold', silver: 'silver', coins: 'coins', cars: 'car', strips: 'strips', pokemon: 'pokemon', sports: 'sports' };
/* a car card goes to the car line its words name (2026-11-18: the cars category became lines, and
   a card listing F-150 • SILVERADO • RAM • TACOMA drew a sedan from the general line's pool) */
const CAR_LINES = [
  [/\bSEMIS?\b|\b18[- ]WHEELERS?\b|\bBIG RIGS?\b|\bKENWORTHS?\b|\bPETERBILTS?\b|\bFREIGHTLINERS?\b/i, 'semis'],
  [/\bSPRINTERS?\b|\bTRANSITS?\b|\bPRO ?MASTERS?\b|\bWORK VANS?\b|\bCARGO VANS?\b|\bVANS\b/i, 'vans'],
  [/\bCLASSICS?\b|\bVINTAGE\b|\bMUSCLE CARS?\b|\bHOT RODS?\b/i, 'classic'],
  [/\bJDM\b|\bSUPRAS?\b|\bGT-?RS?\b|\bSKYLINES?\b|\bWRX\b|\bRX-?7S?\b|\bMIATAS?\b|\bTYPE R\b|\bS2000\b|\bNSX\b/i, 'jdm'],
  [/\bF-?150S?\b|\bSILVERADOS?\b|\bRAMS?\b|\bTACOMAS?\b|\bTUNDRAS?\b|\bSIERRAS?\b|\bPICKUPS?\b/i, 'trucks'],
  [/\bTOYOTAS?\b/i, 'toyota'], [/\bHONDAS?\b/i, 'honda'], [/\bBMWS?\b/i, 'bmw'], [/\bMERCEDES\b|\bBENZ\b|\bAMG\b/i, 'mercedes'],
];
const carLineOf = text => { for (const [re, k] of CAR_LINES) if (SUB[k] && re.test(text)) return k; if (/\bTRUCKS?\b/i.test(text) && !/\bCARS?\b|\bSUVS?\b/i.test(text) && SUB.trucks) return 'trucks'; return 'car'; };
const CAR_SUBJECTS = new Set(['car', ...CAR_LINES.map(([, k]) => k)]);
function subjectOf(ad, headline, allWords = headline) {
  if (ad.line && SUB[ad.line]) return ad.line;
  if (ad.line && SUB[ALIAS[ad.line]]) return ALIAS[ad.line];
  if (ad.cat === 'cars') return carLineOf(allWords);   // a car card's models line names its goods; a phone card goes by its headline
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
const VANS = /\bSPRINTERS?\b|\bTRANSITS?\b|\bPRO ?MASTERS?\b|\bWORK VANS?\b|\bCARGO VANS?\b|\bVANS\b/;
const VAN_CUTS = readdirSync(ROOT + 'assets/cutouts').filter(f => /^car-.*(van|transit|sprinter|promaster)/.test(f) && f.endsWith('.webp')).map(f => f.replace(/\.webp$/, '')).filter(f => usable(f));
const VEHICLES = JSON.parse(readFileSync(ROOT + 'assets/vehicles.json', 'utf8'));
const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; };
function picturesOf(ad, subject, headline, claim, notes) {
  const own = ad.layers.map(l => (/assets\/cutouts\/([^/?#]+)\.webp/.exec(l.src || '') || [])[1]).filter(Boolean);
  let pics = own.filter(usable);
  if (own.length > pics.length) notes.push(`left out ${own.length - pics.length} flagged or rejected picture${own.length - pics.length > 1 ? 's' : ''}`);
  let make = '';
  // a car the photo catalogue does not name is never shown (the owner: "unidentified cars skip")
  if (CAR_SUBJECTS.has(subject)) { const known = pics.filter(f => !/^car-/.test(f) || VEHICLES[f]); if (known.length < pics.length) notes.push(`left out ${pics.length - known.length} unidentified car picture${pics.length - known.length > 1 ? 's' : ''}`); pics = known; }
  if (CAR_SUBJECTS.has(subject)) {
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
    } else if (VANS.test(headline + ' ' + claim)) {
      /* a card about work vans (SPRINTER, TRANSIT, PROMASTER, VANS) shows a van, never an SUV or a
         sedan (the owner, 2026-11-18, of the wrong cars on the library: "wrong cars") */
      const vans = pics.filter(f => /van|transit|sprinter|promaster/.test(f));
      if (vans.length) pics = vans;
      else if (VAN_CUTS.length) { const front = VAN_CUTS.filter(f => !/-rear$/.test(f)), from = front.length ? front : VAN_CUTS; pics = [from[hash(ad.id) % from.length]]; notes.push(`a van picture in place of ${own.length ? own.join(', ') : 'none'}`); make = 'van'; }
    }
  }
  return { pictures: pics.slice(0, 2).map(file => ({ file, k: 1 })), make };
}
function groundOf(ad, cat, make, notes) {
  const g = ad.bg; if (!g || g.type !== 'image' || !/\.(jpe?g|png|webp)(\?|$)/i.test(g.src || '')) return null;
  const s = g.src.toLowerCase();
  if (/money|cash|dollar|bills/.test(s)) { notes.push('cash ground left out'); return null; }
  if (/space-|nebula|hubble|moon|starfield|aurora|earth-from-iss|orion|galaxy-/.test(s)) { notes.push('outer-space ground left out'); return null; }
  const f = Array.isArray(g.focus) ? g.focus : g.focus && typeof g.focus === 'object' ? [g.focus.x, g.focus.y] : [.5, .5];
  const scrim = Math.round(Math.min(.7, Math.max(.25, typeof g.scrim === 'number' ? g.scrim : .4)) * 100) / 100;
  // a card's overlay over its photograph (overlay:dots/dark|assets/...) is the card's own pattern, not a file: the photograph is what it stood on
  return { src: g.src.split('|').pop().replace(/^\/+/, ''), focus: f.map(v => Math.round((+v || .5) * 100) / 100), scrim, from: ad.id };
}

/* ---------------------------------------------------------------- the ground and the product line up
   The owner, 2026-11-18: "ideally bg and assets line up". Each ground photograph is tagged in
   spec/ground-tags.json (read by eye): a scene (a world the product stands in) or a photograph of
   goods (what, and the make and model of a vehicle or a phone), and where a scene has a floor. A
   card keeps its ground when it is a scene, or shows the recipe's own product (the same make and
   model of a vehicle or a phone, the same kind of goods otherwise). Else, where the card's words
   leave the product free, the product follows the photograph (the cut-out of the van or the phone
   the photograph shows); else the ground is a photograph of the recipe's product, or a scene of its
   category, or none (the engine draws one). Never two different products on one ad. */
const TAGS = JSON.parse(read('spec/ground-tags.json')).tags;
const tagOf = src => { const s = String(src || '').split('|').pop().replace(/^\/+/, ''); return TAGS[s.startsWith('assets/') ? s : 'assets/' + s] || TAGS[s] || null; };
const KIND = { ipad: ['ipad'], mac: ['mac'], watch: ['watch'], smartwatch: ['watch'], headphones: ['headphones'], headset: ['headphones'], earbuds: ['earbuds'], speaker: ['speaker'],
  camera: ['camera'], drone: ['drone'], gold: ['gold'], silver: ['silver', 'coins'], coins: ['coins'], strips: ['strips'], pokemon: ['pokemon'], sports: ['sports'], metaglasses: ['metaglasses'] };
const carMake = f => { const m = /^car-([a-z]+)-/.exec(f || ''); return m ? (m[1] === 'chevrolet' ? 'chevy' : m[1]) : ''; };
const carModel = f => { const m = /^car-[a-z]+-([a-z0-9]+)/.exec(f || ''); return m ? m[1].replace(/^f150$/, 'f150') : ''; };
const isVan = f => /van|transit|sprinter|promaster/.test(f || '');
const phoneModel = f => { const m = /iphone-(\d+e?)((?:-pro|-plus|-mini)?(?:-max)?)/.exec(f || '') || /^view-(\d+e?)()-/.exec(f || ''); return m ? (m[1] + m[2].replace(/-/g, ' ')).trim() : ''; };
const PHONE_CUTS = [...CUTS].filter(f => usable(f) && phoneModel(f) && !/^view-/.test(f)).sort();
function productOf(subject, pictures, make) {
  const files = pictures.map(p => p.file);
  if (subject === 'car') return { kind: 'car', make: carMake(files[0]) || (make && make !== 'van' ? make : ''), model: carModel(files[0]), van: make === 'van' || files.some(isVan), named: make, pinned: files.length > 0, files };
  if (subject === 'iphone') return { kind: 'iphone', model: files.length ? phoneModel(files[0]) : '' };
  return { kind: subject };
}
function fits(t, P) {
  if (!t || t.never) return false;
  if (t.shows === 'scene') return true;
  if (P.kind === 'car') {
    // a car the full ad draws by seed can be any make: only a picture of the recipe's own stands on a car photograph
    if (!P.pinned) return false;
    if (t.subject === 'car-key') return !!t.make && t.make === P.make;
    if (t.subject !== 'car' || !t.make || t.make !== P.make || (P.van && t.vehicle !== 'van')) return false;
    // a photograph that lists its cut-outs (one model name over different cars: an E46 and a G80 M3) takes only those
    if (t.cuts && !P.files.every(f => t.cuts.includes(f))) return false;
    return !t.model || !P.model || t.model === P.model;
  }
  if (P.kind === 'iphone') return t.subject === 'iphone' && !!t.model && !!P.model && t.model === P.model;
  return (KIND[P.kind] || []).includes(t.subject);
}
const say = t => t.subject === 'car' ? `a ${[t.make, t.model].filter(Boolean).join(' ') || 'car of no stated make'}` : t.subject === 'iphone' ? `an iPhone ${t.model || ''}`.trim() : t.subject;
function lineUp(ad, cat, subject, pictures, make, gp, words, notes) {
  const out = (g, pics = pictures) => { if (g) { const t = tagOf(g.src); g.shows = t.shows; if (t.subject) g.subject = t.subject; if (t.make) g.make = t.make; if (t.model) g.model = t.model; if (t.vehicle) g.vehicle = t.vehicle; if (t.floor != null) g.floor = t.floor; } return { ground_photo: g, pictures: pics }; };
  if (!gp) return out(null);
  const t = tagOf(gp.src);
  if (!t) { notes.push('ground not in spec/ground-tags.json: left out'); return out(null); }
  if (t.never) { notes.push(`ground left out: ${t.never}`); return out(null); }
  let P = productOf(subject, pictures, make);
  if (fits(t, P)) return out(gp);
  // the product follows the photograph where the words leave it free
  if (P.kind === 'car' && t.subject === 'car' && t.make && (!P.named || P.named === t.make || (P.named === 'van' && t.vehicle === 'van'))) {
    const cuts = t.cuts ? t.cuts.filter(usable) : (CAR_CUTS[t.make] || []).filter(f => (!t.model || carModel(f) === t.model) && (t.vehicle !== 'van' || isVan(f)));
    if (cuts.length) { notes.push(`the picture follows the ground: ${say(t)}`); return out(gp, [{ file: cuts[hash(ad.id) % cuts.length], k: 1 }]); }
  }
  if (P.kind === 'iphone' && t.subject === 'iphone' && t.model) {
    const cuts = PHONE_CUTS.filter(f => phoneModel(f) === t.model);
    if (cuts.length) { notes.push(`the picture follows the ground: ${say(t)}`); return out(gp, [{ file: cuts[hash(ad.id) % cuts.length], k: 1 }]); }
  }
  // a photograph of the recipe's own product
  if (P.kind !== 'iphone' || P.model) {
    const same = Object.keys(TAGS).filter(k => TAGS[k].shows === 'product' && fits(TAGS[k], P) && !/\|/.test(k)).sort();
    if (same.length) { notes.push(`ground swapped: it showed ${say(t)}`); return out({ src: same[hash(ad.id) % same.length], focus: [.5, .5], scrim: gp.scrim, from: gp.from }); }
  }
  // a scene of the category
  const scenes = Object.keys(TAGS).filter(k => TAGS[k].shows === 'scene' && !TAGS[k].never && (TAGS[k].suits || []).includes(cat)).sort();
  if (scenes.length) { notes.push(`ground swapped for a scene: it showed ${say(t)}`); return out({ src: scenes[hash(ad.id) % scenes.length], focus: [.5, .5], scrim: gp.scrim, from: gp.from }); }
  notes.push(`ground left out: it showed ${say(t)}`);
  return out(null);
}

/* ---------------------------------------------------------------- one kind of goods inside a broader line
   A card about one kind of goods on a line that holds several (the owner's lines, 2026-11-18: controllers
   and VR headsets folded into Consoles, gaming laptops into Computers, the Switch into Handhelds, Android
   tablets into Androids) shows that kind: its own picture of it, or an entry of the line's pool that is
   one, or none, and its words stand alone; never another product (a PS5 under "SPARE CONTROLLERS?", a
   tower under "GAMING LAPTOP?": the rebuild's first sheet). The kind is the card's own folded line, or
   what its headline names. [kind, what a headline says, what a picture's file is called] */
const KINDS = [
  ['controller', /\bCONTROLLERS?\b|\bDUALSENSE\b|\bJOY-?CONS?\b/, /controller|dualsense|joy-?con/i],
  ['vr', /\bVR\b|\bQUESTS?\b|\bVISION PRO\b/, /(^|-)vr(-|$)|quest|vision-pro/i],
  ['laptop', /\bLAPTOPS?\b/, /laptop/i],
  ['handheld', /\bSTEAM DECKS?\b|\bROG ALLY\b|\bLEGION GO\b|\bHANDHELDS?\b/, /steam-?deck|rog-?ally|legion-?go|handheld/i],
  ['switch', /\bSWITCH(ES)?\b/, /switch/i],
  ['tablet', /\bTABLETS?\b|\bGALAXY TAB\b/, /tablet|galaxy-tab/i],
  ['console', /\bCONSOLES?\b|\bPS5\b|\bXBOX\b|\bPLAYSTATION\b/, /ps5|xbox|playstation|dock|oled-set|console/i],
];
const FOLD_KIND = { controller: 'controller', vr: 'vr', gamelaptop: 'laptop', switch: 'switch', tablet: 'tablet' };
const BROAD = new Set(Object.values(ALIAS));
const KIND_TURN = {};
const MODEL_FILES = [[/\bPS5\b|\bPLAYSTATION\b/, /ps5|playstation/i], [/\bXBOX\b/, /xbox/i], [/\bSWITCH\b/, /switch/i], [/\bSTEAM DECKS?\b/, /steam-?deck/i], [/\bQUESTS?\b/, /quest/i]];
const kindOf = (ad, subject, headline) => !BROAD.has(subject) ? '' : FOLD_KIND[ad.line] || ((KINDS.find(([, words]) => words.test(headline)) || [])[0] || '');

/* ---------------------------------------------------------------- what it takes after (the rebuild)
   A library card's family is its id's first word (glassCard-du08-15); a designer layout's and an
   offer card's are in theirs, with the colourway after (dl_cars_neonNight_sunset, of_iphone_band_sun:
   an offer card's family is its layout). spec/recipe-looks.json says what each leans toward. */
function lineageOf(ad) {
  if (ad.gen === 'sc') return { family: String(ad.id).split('-')[0], colourway: '' };
  const m = /^(?:dl|of)_[a-z0-9]+_([A-Za-z]+)_([a-z]+)$/.exec(ad.id);
  return m ? { family: m[1], colourway: m[2] } : { family: '', colourway: '' };
}
const LEANS = ['ground', 'face', 'headline', 'sticker', 'number', 'fill', 'arrangement'];
function hintOf(gen, family, colourway, voice) {
  const F = (gen === 'of' ? LOOKS.layouts[family] : LOOKS.families[family]) || {};
  // a library card's theme was one of the twelve dark pairs (the sameness the owner named): its colour
  // leans only where its family has one; a layout's or an offer card's colourway is its own
  const C = gen === 'sc' ? null : LOOKS.colourways[colourway] || null;
  const h = {};
  for (const k of LEANS) if (F[k] && F[k].length) h[k] = F[k].slice();
  // its card's face, among its family's: never an offer card's, which its family set by line (all the
  // gaming lines in one face), the owner's "their own set of rules", not a choice of the card's
  if (voice && gen !== 'of') h.face = [voice, ...(h.face || []).filter(v => v !== voice)];
  const colour = C || (['tone', 'hue', 'neutral'].some(k => k in F) ? F : null);
  if (colour) for (const k of ['tone', 'hue', 'neutral']) if (k in colour) h[k] = colour[k];
  return h;
}
/* every name the table leans to is one the engine draws: a face the full ad holds, a style of
   spec/full-styles.json, a ground kind or a ground by its key, an arrangement */
const KNOWN = {
  face: new Set(FULL_VOICES),
  headline: new Set((FULL_STYLES.headline || []).map(e => e.key)), sticker: new Set((FULL_STYLES.sticker || []).map(e => e.key)),
  number: new Set((FULL_STYLES.number || []).map(e => e.key)),
  // a fill leans the plates' and the sticker's (spec/full-styles.json plate_fill, sticker_fill)
  fill: FULL_STYLES.plate_fill || FULL_STYLES.sticker_fill ? new Set([...(FULL_STYLES.plate_fill || []), ...(FULL_STYLES.sticker_fill || [])].map(e => e.key)) : null,
  ground: new Set(['photo', 'scene', 'gradient', 'pattern', 'house', ...(GROUNDS_M.GROUND_HOUSE || []), ...(GROUNDS_M.GROUND_SCENES || []), ...(GROUNDS_M.GROUND_GRADIENTS || []), ...(GROUNDS_M.GROUND_PATTERNS || [])]),
  arrangement: new Set(['lineup', 'fan', 'showcase', 'podium', 'wings']),
};
{
  const bad = [];
  for (const [where, table] of [['families', LOOKS.families], ['layouts', LOOKS.layouts]]) for (const [name, row] of Object.entries(table))
    for (const k of LEANS) for (const v of row[k] || []) if (KNOWN[k] && !KNOWN[k].has(v)) bad.push(`${where}.${name}.${k}: ${v}`);
  if (bad.length) { console.error('spec/recipe-looks.json leans to names the engine does not draw:\n  ' + bad.join('\n  ')); process.exit(1); }
}

/* ---------------------------------------------------------------- the recipes */
const GEN = { sc: 'library card', dl: 'designer layout', of: 'offer card' };
const all = [...got.templates.map(t => ({ ...t, gen: /^dl_/.test(t.id) ? 'dl' : 'of' })), ...got.cards.map(c => ({ ...c, gen: 'sc' }))];
const recipes = [];
for (const ad of all) {
  const dropped = [], notes = [];
  const words = wordsOf(ad, ad.cat, dropped);
  const subject = subjectOf(ad, words.headline || '', [words.headline, words.tag, words.claim, words.points].filter(Boolean).join(' '));
  const S = SUB[subject]; if (!S) continue;
  const { pictures, make } = picturesOf(ad, subject, words.headline || '', [words.claim, words.tag].filter(Boolean).join(' '), notes);   // the line under it names models too (TRANSIT • SPRINTER • PROMASTER)
  const lined = lineUp(ad, S.cat, subject, pictures, make, groundOf(ad, ad.cat, make, notes), words, notes);
  const ground_photo = lined.ground_photo; pictures.splice(0, pictures.length, ...lined.pictures);
  // colours as the ad wore them: the library's own theme and ink; a template's ground and its headline's accent
  const heads = ad.layers.filter(l => l.role === 'headline');
  const accent = ad.accent || (heads.map(l => l.grad || l.fill).find(c => /^#[0-9a-f]{6}$/i.test(c) && !neutral(c))) || (ad.palette && (ad.palette.accent || ad.palette.a1)) || '';
  const ground = ad.c1 || (ad.bg && ad.bg.c1) || (ad.palette && (ad.palette.bg || ad.palette.ground)) || '';
  const pair = pairOf(ad.theme, ground, accent, subject);
  const display = ad.faces ? (Array.isArray(ad.faces) ? ad.faces[0] : ad.faces.display) : (heads[0] && heads[0].font) || '';
  // one kind of goods inside a broader line: its own picture of it, an entry of the pool that is one, or its words alone
  const kind = kindOf(ad, subject, words.headline || ''); let words_only = false, keep = !!make;
  if (kind) {
    const file = KINDS.find(k => k[0] === kind)[2], mine = pictures.filter(p => file.test(p.file));
    let fits = (S.pool || []).filter(e => (e.set || []).length && e.set.every(x => file.test(x.file)));
    // a model its headline names, where the pool has it (PS5 OR XBOX? shows a PS5 or an Xbox, not a Switch)
    const named = MODEL_FILES.filter(([w]) => w.test(words.headline || '')).map(([, f]) => f), nf = fits.filter(e => e.set.every(x => named.some(f => f.test(x.file))));
    if (named.length && nf.length) fits = nf;
    if (mine.length) { pictures.splice(0, pictures.length, ...mine); keep = true; }
    // in turn, so a line's cards of one kind show all its pictures of it
    else if (fits.length) { const n = (KIND_TURN[subject + '|' + kind] = (KIND_TURN[subject + '|' + kind] || 0) + 1) - 1, e = fits[n % fits.length]; pictures.splice(0, pictures.length, ...e.set.map(x => ({ file: x.file, k: x.k || 1 }))); keep = true; notes.push(`a ${kind} from the line's pool: its words name one`); }
    else { pictures.length = 0; words_only = true; notes.push(`no ${kind} picture on the line: its words alone`); }
  }
  // the product (the owner: "the heros all look so simialr"): the card's own only where its words name
  // it (a make, a model, a van, a kind of goods) or its line has no pool; else the seed draws from the line's pool
  if (pictures.length && !keep && (subject === 'iphone' || (S.pool || []).length)) {
    notes.push(`its picture${pictures.length > 1 ? 's' : ''} (${pictures.map(p => p.file).join(', ')}) left to the line's pool`);
    pictures.length = 0;
  }
  const { family, colourway } = lineageOf(ad), type_pair = voiceOf(display);
  recipes.push({ id: 'r-' + ad.id, from: ad.id, gen: ad.gen, cat: S.cat, subject, label: `${ad.name} (${GEN[ad.gen]})`,
    seed: 2 + hash('recipe:' + ad.id) % 99991, look: { family, ...(colourway ? { colourway } : {}) }, hint: hintOf(ad.gen, family, colourway, type_pair),
    words, pictures, ...(words_only ? { words_only } : {}), ground_photo, pair, type_pair, ...(make ? { make } : {}), ...(dropped.length ? { dropped } : {}), ...(notes.length ? { notes } : {}) });
}
{
  // every colourway a layout or an offer card names is in the table (a new one leans nowhere unseen)
  const unknown = [...new Set(recipes.filter(r => r.gen !== 'sc' && r.look.colourway && !LOOKS.colourways[r.look.colourway]).map(r => r.look.colourway))];
  if (unknown.length) { console.error('colourways missing from spec/recipe-looks.json: ' + unknown.join(', ')); process.exit(1); }
  const loose = [...new Set(recipes.filter(r => !(r.gen === 'of' ? LOOKS.layouts : LOOKS.families)[r.look.family]).map(r => r.gen + ':' + r.look.family))];
  if (loose.length) console.log('families with no lean in spec/recipe-looks.json (their look is the seed\'s alone): ' + loose.join(', '));
}
const ORDER = SUBJECTS.map(s => s.key);
recipes.sort((a, b) => ORDER.indexOf(a.subject) - ORDER.indexOf(b.subject) || ['sc', 'dl', 'of'].indexOf(a.gen) - ['sc', 'dl', 'of'].indexOf(b.gen) || a.id.localeCompare(b.id));
/* a library card's name led with its theme, one of the twelve dark pairs it no longer draws in (rule 147):
   it is called by its family's name, numbered within its line where the line has more than one */
{
  const fam = r => r.label.replace(/ \(library card\)$/, '').split(' · ').pop(), count = {}, seen = {};
  for (const r of recipes) if (r.gen === 'sc') count[r.subject + '|' + fam(r)] = (count[r.subject + '|' + fam(r)] || 0) + 1;
  for (const r of recipes) if (r.gen === 'sc') { const f = fam(r), k = r.subject + '|' + f, n = seen[k] = (seen[k] || 0) + 1; r.label = `${f}${count[k] > 1 ? ' ' + n : ''} (library card)`; }
}
const count = k => recipes.filter(r => r.gen === k).length;
const json = JSON.stringify({
  _doc: 'Every older ad the studio offers (library cards, designer layouts, offer cards), read as it opens and written as a recipe the full ad draws as a photo and a video: its words (the one list and the proof words left out), its line, its product cut-outs (a named car make shown as that make), its ground photograph, the nearest of the twelve pairs and its face pair where the full ad holds it (both for the record). Rebuilt 2026-11-18 (the owner: "take them as inspiration but rebuild them all"): each is drawn on a seed of its own (seed) and leans toward what its card took after (look: its family and colourway; hint: spec/recipe-looks.json), never locked to it; its own pictures only where its words name the product or its line has no pool. Made by scripts/build_recipes.mjs; never edit by hand. DESIGN-LAW 144, 145, OPEN-ITEMS §BJ.',
  count: recipes.length, by: { library: count('sc'), layouts: count('dl'), offer: count('of') },
  lean: LOOKS.lean,   // how often a recipe's seed draws from its hint (spec/recipe-looks.json; whoever loads this attaches it to each hint)
  recipes,
}, null, 1) + '\n';
const untagged = recipes.filter(r => r.ground_photo && !tagOf(r.ground_photo.src)).map(r => r.id);
if (untagged.length) { console.error('grounds missing from spec/ground-tags.json: ' + untagged.slice(0, 8).join(', ')); process.exit(1); }
if (CHECK) {
  const now = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (now !== json) { console.error(`motion/recipes.json is stale (${recipes.length} recipes from the studio as it serves now): run node scripts/build_recipes.mjs`); process.exit(1); }
  console.log(`motion/recipes.json is current: ${recipes.length} recipes`);
} else {
  writeFileSync(OUT, json);
  const withPic = recipes.filter(r => r.pictures.length).length, withGround = recipes.filter(r => r.ground_photo).length, cars = recipes.filter(r => r.make).length;
  console.log(`wrote motion/recipes.json: ${recipes.length} recipes (${count('sc')} library cards, ${count('dl')} designer layouts, ${count('of')} offer cards); ${withPic} with their own pictures, ${withGround} with a ground photograph, ${cars} cars that name a make; ${recipes.filter(r => r.dropped).length} with words dropped`);
}
