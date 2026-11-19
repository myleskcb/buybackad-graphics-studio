#!/usr/bin/env node
/* THE AD CENSUS: what every ad the site offers is made of (DESIGN-LAW 143, 2026-11-18).

   The owner, 2026-11-17: old design language and old wording keep coming back after being
   fixed; the photo ads have bad colours and odd layouts; the video ads look right but lacked the
   photo ads' information. The house style is the full ad (motion/fullad.js, rules 137 to 141),
   and older generations are still offered beside it. The rules are spread over 140-odd
   DESIGN-LAW rules and about 150 single-property checks, and nothing showed, per ad, what it is
   built from, so a regression in one generation went unseen while every check of another passed.

   This is that view. It opens every ad the site offers the way a visitor does and writes one
   row per ad:
     generation  full (the full ad, Easy Mode's first card, motion/subjects.json's 35 lines),
                 dl (a designer layout), of (the offer family), sc (a library card:
                 assets/showcase, the wall's own scIsLive), any (a look in the video maker's
                 Any look gallery), feed (iPhones LA's FeedAd batch, tools/feed-stills: not on
                 the site, drawn by the same engine file and posted by iPhones LA)
     engine      FullAd, a fabric template, the video engine's Ad, FeedAd
     colours     the ground and the accent measured on the picture, the nearest of the house pairs
                 proven pairs (motion/house-colours.js) and whether it is that pair; and the
                 palette the ad says it is in
     type        its type pair, or its faces
     elements    which of the full ad's elements it carries (business name, headline, product
                 picture, phone number, call to action, towns, claims, sticker; the website too)
     product     the product pictures' share of the height and of the area
     words       every banned or old phrase on it (spec/banned-words.json, one list)
     pre-flight  the verdict of the generation's own check, where it has one: fullPreflight for
                 the full ad, pgCheck for the photo ads, blockers() for FeedAd, lookPreflight for
                Any look (motion/look-preflight.js, from 2026-11-18; before it, Any look had none)

   The visitor (VISITOR) types a number, a website and a business name where the page asks for
   one, and gives an area. The census types nothing else, so every other word it finds is the
   studio's own. It changes no ad, no table and no stored choice.

   usage:  [GFX_BASE=http://127.0.0.1:8899/] [PLAYWRIGHT_MODULE=/path/to/playwright] \
             node scripts/ad_census.mjs [--only full,dl,of,sc,any,feed] [--ids a,b] [--limit n]
               [--workers 2] [--json out.json] [--html out.html] [--gate] [--rescan in.json]
   Nothing answering at GFX_BASE: the script serves the repo there itself. A server that answers
   with another tree's app.js is refused: it would census someone else's branch.
   Writes .render/ad-census/census.json and .render/ad-census/index.html unless told otherwise
   (.render/ is ignored), and the thumbnails beside the JSON (census.thumbs.json). --rescan
   re-reads a census and only re-matches words, colours and elements (no browser, seconds), for a
   change to spec/banned-words.json, REQUIRED or the thresholds below.
   --gate exits 1 when an offered ad is off the house engine or the house pairs, carries a
   banned phrase, or lacks a REQUIRED element, and prints the counts. It is not wired into any
   deploy (2026-11-18): today it fails nearly every ad that is not the full ad, which is the
   finding. A full run takes about half an hour with two workers. */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const arg = (k, d = '') => { const i = process.argv.indexOf(k); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : d; };
const has = k => process.argv.includes(k);
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8899/').replace(/\/?$/, '/');
const GENS = ['full', 'recipe', 'dl', 'of', 'sc', 'any', 'feed'];   // recipe: an older ad drawn by the full ad (motion/recipes.json, 2026-11-18)
const ONLY = arg('--only') ? arg('--only').split(',').filter(g => GENS.includes(g)) : GENS;
const IDS = arg('--ids') ? new Set(arg('--ids').split(',').filter(Boolean)) : null;
const LIMIT = +arg('--limit', '0') || 0;
/* --variations N: the full ad read N times a line, seeds 1..N (New look's first N looks), not only
   the first ad a visitor sees: the owner, 2026-11-18, "we need all the variations" */
const VARIATIONS = Math.max(1, Math.min(24, +arg('--variations', '1') || 1));
const WORKERS = Math.max(1, Math.min(4, +arg('--workers', '2') || 2));
const JSON_OUT = arg('--json', join(ROOT, '.render/ad-census/census.json'));
const HTML_OUT = arg('--html', join(ROOT, '.render/ad-census/index.html'));
const GATE = has('--gate'), RESCAN = arg('--rescan');

/* The visitor: what a customer types and nothing else. A San Diego area, so a card that prints
   the library's Long Beach towns is seen printing someone else's (the area dialog's reason). */
const VISITOR = { number: '(619) 555-0142', site: 'harborbuy.com', biz: 'Harbor Buyers', zip: '92101', town: 'San Diego' };
/* What every house ad carries (rule 137) and the gate asks of every offered ad. Claims and the
   sticker are counted but not required: the research (docs/COMPETITOR-RESEARCH-2026-11-12.md
   5.2) cuts the claims to three and takes the sticker off by default. The website is counted
   and not required: the research drops it from the picture. */
const ELEMENTS = ['business', 'headline', 'product', 'number', 'cta', 'towns', 'claims', 'sticker', 'website'];
const REQUIRED = ['business', 'headline', 'product', 'number', 'cta', 'towns'];
const ELEMENT_NAMES = { business: 'business name', headline: 'headline', product: 'product picture', number: 'phone number', cta: 'call to action', towns: 'towns', claims: 'claims', sticker: 'sticker', website: 'website' };
/* A pair is matched when the measured ground and accent are both near its own (OKLab distance x
   100; 2 is about the smallest difference the eye sees). Calibrated on the full ads, every one of
   which is drawn in a pair by construction (the census prints the "calibration" each run): on
   2026-11-18 all 35 measured their ground within 3.3 of their pair's and their accent exactly
   it, so a match is held to 5. At 11, FeedAd's orange on carbon passed as Black & Red's
   red (8.5 apart, plainly another colour). A ground that is a photograph is no pair's ground,
   whatever its colour. */
const PAIR_GROUND = 5, PAIR_ACCENT = 5;
const GEN_NAMES = { full: 'Full ad', recipe: 'Library recipe', dl: 'Designer layout', of: 'Offer family', sc: 'Library card', any: 'Any look', feed: 'FeedAd (iPhones LA)' };
const ENGINES = { full: 'FullAd', recipe: 'FullAd', dl: 'fabric template', of: 'fabric template', sc: 'fabric template', any: 'engine Ad', feed: 'FeedAd' };

const BANNED = JSON.parse(readFileSync(join(ROOT, 'spec/banned-words.json'), 'utf8'));
/* the house pairs, read as data (the file is an ES module for the browser; its rows are JSON) */
const HOUSE_COLOURS = JSON.parse(readFileSync(join(ROOT, 'motion/house-colours.js'), 'utf8').match(/HOUSE_COLOURS\s*=\s*(\[[\s\S]*?\]);/)[1].replace(/,\s*\]$/, ']'));

/* ------------------------------------------------------------------ colour, in Node too */
const lin = v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
const toLab = (r, g, b) => { const R = lin(r), G = lin(g), B = lin(b);
  const l = Math.cbrt(.4122214708 * R + .5363325363 * G + .0514459929 * B), m = Math.cbrt(.2119034982 * R + .6806995451 * G + .1073969566 * B), s = Math.cbrt(.0883024619 * R + .2817188376 * G + .6299787005 * B);
  return [.2104542553 * l + .793617785 * m - .0040720468 * s, 1.9779984951 * l - 2.428592205 * m + .4505937099 * s, .0259040371 * l + .7827717662 * m - .808675766 * s]; };
const hexLab = h => { const n = parseInt(String(h).slice(1, 7), 16); return toLab(n >> 16, (n >> 8) & 255, n & 255); };
const dE = (p, q) => 100 * Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
const PAIRS = HOUSE_COLOURS.map(p => ({ key: p.key, name: p.name, ground: p.colors.ground, accent: p.colors.accent, g: hexLab(p.colors.ground), a: hexLab(p.colors.accent) }));

function matchPair(c, row) {
  if (!c || !c.ground) return { match: false, why: 'not measured' };
  const g = hexLab(c.ground), a = c.accent ? hexLab(c.accent) : null;
  let best = null;
  for (const p of PAIRS) { const dG = dE(g, p.g), dA = a ? dE(a, p.a) : 99, s = dG + dA; if (!best || s < best.s) best = { p, dG, dA, s }; }
  const out = { nearest: best.p.key, nearestName: best.p.name, dGround: +best.dG.toFixed(1), dAccent: a ? +best.dA.toFixed(1) : null };
  /* the house engine on a photograph (DESIGN-LAW 145): the ground is the photo by design, and the
     pair is what it draws on it, so the drawn accent is held to the pair the ad declares */
  // a drawn scene paints the pair's own ground with light, and the house's patterns and hard-edged gradients
  // paint it in its own tones (2026-11-18, rule 146: "textured" by the edge band's spread): judged the same way
  if ((c.groundKind === 'photo' || c.groundKind === 'drawn' || c.groundKind === 'textured') && row && (row.gen === 'full' || row.gen === 'recipe')) {
    const own = PAIRS.find(p => p.name === row.declared), dA = own && a ? dE(a, own.a) : 99;
    /* the full ad's plates are lit and may be graded (2026-11-18: full-styles), so its drawn accent
       sits a little off the flat one: within twice the tolerance, or in the same hue family (25
       degrees) at a real chroma, it is the pair's */
    const hueOf = v => Math.atan2(v[2], v[1]) * 180 / Math.PI, chromaOf = v => Math.hypot(v[1], v[2]);
    const sameFamily = own && a && chromaOf(a) >= .09 && chromaOf(own.a) >= .09 && Math.abs(((hueOf(a) - hueOf(own.a) + 540) % 360) - 180) <= 25;   // Lab here is 0..1 (dE scales by 100)
    /* a two-colour pair (rule 146: White on Pink, Black on Lime) has no accent but its words' white or black,
       which no saturated pixel can show: it is the pair where its ground is the pair's own (or the pair's
       ground is laid under a photograph) */
    const twoColour = own && chromaOf(own.a) < .04 && (c.groundKind === 'photo' || dE(g, own.g) <= PAIR_GROUND * 2.2);
    if (twoColour) return { ...out, nearest: own.key, nearestName: own.name, match: true, why: own.name + ' (two colours)' };
    /* a light pair whose accent is a deeper tone of its own ground's family (Mint & Green, Lavender & Violet,
       Blush & Magenta) or under the measure's chroma (Sand & Teal's teal, C .08): the measure sets every such
       pixel aside as a shade of the ground, so where it finds no accent at all the pair is judged by its ground */
    const shadeOfGround = own && !a && (chromaOf(own.a) < .09 || (chromaOf(own.g) >= .04 && Math.abs(((hueOf(own.a) - hueOf(own.g) + 540) % 360) - 180) <= 25));
    if (shadeOfGround && (c.groundKind === 'photo' || dE(g, own.g) <= PAIR_GROUND * 2.2)) return { ...out, nearest: own.key, nearestName: own.name, match: true, why: own.name + ' (its accent a tone of its ground)' };
    return own && (dA <= PAIR_ACCENT * 2 || sameFamily) ? { ...out, nearest: own.key, nearestName: own.name, dAccent: +dA.toFixed(1), match: true, why: own.name + (c.groundKind === 'photo' ? ' on a photograph' : c.groundKind === 'textured' ? ' on a patterned ground' : ' on a drawn scene') }
      : { ...out, match: false, why: own ? `accent ${dA.toFixed(1)} from ${own.name}'s, on a ${c.groundKind === 'photo' ? 'photograph' : c.groundKind === 'textured' ? 'patterned ground' : 'drawn scene'}` : 'stands on a photograph' };
  }
  if (c.groundKind === 'photo') return { ...out, match: false, why: 'stands on a photograph' };
  if (!a) return { ...out, match: false, why: 'no accent colour found' };
  // the full ad's quiet house ground is the pair's ground with its light: held to twice the tolerance
  const house = row && (row.gen === 'full' || row.gen === 'recipe');
  if (best.dG > PAIR_GROUND * (house ? 2.2 : 1)) return { ...out, match: false, why: `ground ${out.dGround} from ${best.p.name}'s` };
  if (best.dA > PAIR_ACCENT) return { ...out, match: false, why: `accent ${out.dAccent} from ${best.p.name}'s` };
  return { ...out, match: true, why: best.p.name };
}

/* ------------------------------------------------------------------ the words */
const PHRASES = BANNED.phrases.map(e => ({ ...e, re: new RegExp(e.pattern, 'iu'), unlessRe: e.unless ? new RegExp(e.unless, 'iu') : null }));
function bannedIn(words, cat) {
  const found = [];
  for (const w of words || []) {
    const text = String(w.text || '').toUpperCase();
    for (const e of PHRASES) {
      if (e.only && !e.only.includes(cat)) continue;
      const m = e.re.exec(text); if (!m) continue;
      if (e.unlessRe && e.unlessRe.test(text)) continue;
      found.push({ id: e.id, label: e.label, match: m[0].trim(), where: w.where, text: w.text });
    }
  }
  return found;
}

/* ------------------------------------------------------------------ a row, composed */
function compose(r) {
  r.genName = GEN_NAMES[r.gen]; r.engine = ENGINES[r.gen];
  r.colour = r.colours ? matchPair(r.colours, r) : { match: false, why: 'not measured' };
  r.banned = r.error ? [] : bannedIn(r.words, r.cat);
  r.bannedIds = [...new Set(r.banned.map(b => b.id))];
  r.bannedNoName = r.error || !r.wordsNoName ? [] : bannedIn(r.wordsNoName, r.cat);
  r.bannedNoNameIds = [...new Set(r.bannedNoName.map(b => b.id))].filter(id => !r.bannedIds.includes(id));
  r.missing = r.error ? REQUIRED.slice() : REQUIRED.filter(k => !(r.el && r.el[k]));
  r.lacks = r.error ? ELEMENTS.slice() : ELEMENTS.filter(k => !(r.el && r.el[k]));
  const why = [];
  if (r.error) why.push('did not open: ' + r.error);
  if (r.engine !== 'FullAd') why.push('off the house engine (' + r.engine + ')');
  if (!r.colour.match) why.push('off the house pairs (' + r.colour.why + ')');
  if (r.bannedIds.length) why.push('banned: ' + r.bannedIds.join(', '));
  if (r.bannedNoNameIds.length) why.push('banned with no business name typed: ' + r.bannedNoNameIds.join(', '));
  if (r.missing.length) why.push('lacks: ' + r.missing.map(k => ELEMENT_NAMES[k]).join(', '));
  r.gateWhy = why;
  r.score = 2 * r.missing.length + 2 * (r.bannedIds.length + r.bannedNoNameIds.length) + (r.colour.match ? 0 : 1) + (r.pre && r.pre.ok === false ? 1 : 0) + (r.engine === 'FullAd' ? 0 : 1);
  return r;
}

function summarise(rows) {
  const by = {};
  for (const g of GENS) {
    const rs = rows.filter(r => r.gen === g); if (!rs.length) continue;
    const missingBy = Object.fromEntries(ELEMENTS.map(k => [k, rs.filter(r => r.lacks.includes(k)).length]));
    const bannedBy = {}; rs.forEach(r => [...new Set([...r.bannedIds, ...r.bannedNoNameIds])].forEach(id => { bannedBy[id] = (bannedBy[id] || 0) + 1; }));
    const pre = rs.filter(r => r.pre && r.pre.ok != null);
    const sh = rs.map(r => r.product && r.product.h).filter(v => v > 0).sort((a, b) => a - b);
    by[g] = { name: GEN_NAMES[g], engine: ENGINES[g], ads: rs.length, errors: rs.filter(r => r.error).length,
      offEngine: g === 'full' ? 0 : rs.length, offColours: rs.filter(r => !r.colour.match).length, onPhoto: rs.filter(r => r.colours && r.colours.groundKind === 'photo').length,
      withBanned: rs.filter(r => r.bannedIds.length || r.bannedNoNameIds.length).length, bannedBy,
      withBannedNoName: rs.some(r => r.wordsNoName) ? rs.filter(r => r.bannedNoName.length).length : null,
      lacking: rs.filter(r => r.missing.length).length, missingBy,
      preflight: pre.length ? { measured: pre.length, fail: pre.filter(r => !r.pre.ok).length } : null,
      productMedianH: sh.length ? +sh[sh.length >> 1].toFixed(3) : null, gateFail: rs.filter(r => r.gateWhy.length).length,
      foreignTowns: rs.filter(r => r.el && r.el.foreignTowns && r.el.foreignTowns.length).length };
  }
  return by;
}

/* ------------------------------------------------------------------ the page */
function page(census) {
  const rows = census.rows.map(r => ({
    id: r.id, name: r.name || r.id, gen: r.gen, genName: r.genName, engine: r.engine, cat: r.cat || '', shelf: r.shelf || '', offered: r.offered || '', thumb: r.thumb || '',
    ground: r.colours ? r.colours.ground : '', accent: r.colours ? r.colours.accent : '', groundKind: r.colours ? r.colours.groundKind : '', declared: r.declared || '',
    pair: r.colour.nearestName || '', pairMatch: !!r.colour.match, pairWhy: r.colour.why || '', dG: r.colour.dGround, dA: r.colour.dAccent,
    type: r.type ? (r.type.pair || 'own faces') : '', faces: r.type ? [r.type.display, r.type.support, r.type.number].filter(Boolean).filter((f, i, a) => a.indexOf(f) === i).join(' / ') : '',
    el: r.el || {}, lacks: r.lacks, missing: r.missing, foreign: (r.el && r.el.foreignTowns) || [],
    h: r.product ? r.product.h : null, a: r.product ? r.product.area : null, productKind: r.el ? r.el.productKind || '' : '',
    banned: r.banned.map(b => ({ id: b.id, label: b.label, match: b.match, where: b.where })), bannedIds: [...new Set([...r.bannedIds, ...r.bannedNoNameIds])],
    bannedNoName: (r.bannedNoName || []).filter(b => r.bannedNoNameIds.includes(b.id)).map(b => ({ id: b.id, match: b.match, where: b.where })),
    pre: r.pre || null, words: (r.words || []).map(w => [w.where, w.text]), error: r.error || '', score: r.score, gateWhy: r.gateWhy,
  }));
  const data = JSON.stringify({ made: census.made, commit: census.commit, branch: census.branch, visitor: census.visitor, required: REQUIRED, elements: ELEMENTS, elementNames: ELEMENT_NAMES,
    summary: census.summary, rows, phrases: BANNED.phrases.map(p => ({ id: p.id, label: p.label, why: p.why, source: p.source })), sources: census.sources || [], calibration: census.calibration || null,
    pairs: PAIRS.map(p => ({ key: p.key, name: p.name, ground: p.ground, accent: p.accent })) }).replace(/</g, '\\u003c');
  /* One self-contained page, the Type Lab page's way (build_type_lab_page.mjs): no document
     wrapper, so it publishes as an artifact as it is and opens from disk the same. */
  return `<title>Graphics Studio ad census</title>
<meta charset="utf-8">
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;family=Space+Grotesk:wght@500;700&amp;display=swap">
<style>
/* layout: a summary over a sortable sheet, one row an ad; quiet chrome so the ads' own colours are the loudest thing.
   paper and ink of a proof sheet; the semantic chips (good, bad, warn) carry the state */
:root{--bg:#f4f3ef;--panel:#ffffff;--ink:#1b1c1f;--soft:#5b5e66;--line:#dcd9d0;--chip:#ecebe5;--good:#17803d;--goodbg:#e2f3e6;--bad:#b42318;--badbg:#fbe5e2;--warn:#8a5a00;--warnbg:#faefd6;--accent:#1d4ed8;--shadow:0 1px 2px rgba(20,20,30,.06);
  --body:"Inter",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--display:"Space Grotesk","Inter",system-ui,sans-serif}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#121316;--panel:#1b1d21;--ink:#eceae4;--soft:#a3a6ae;--line:#30333a;--chip:#25282d;--good:#5ad17f;--goodbg:#173322;--bad:#ff8a7a;--badbg:#3a1d1a;--warn:#f2c14e;--warnbg:#3a2e12;--accent:#8fb0ff;--shadow:none;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#121316;--panel:#1b1d21;--ink:#eceae4;--soft:#a3a6ae;--line:#30333a;--chip:#25282d;--good:#5ad17f;--goodbg:#173322;--bad:#ff8a7a;--badbg:#3a1d1a;--warn:#f2c14e;--warnbg:#3a2e12;--accent:#8fb0ff;--shadow:none;color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 var(--body)}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:10;background:var(--bg)}
main{max-width:1440px;margin:0 auto;padding-block:24px 64px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
h1{font:700 30px/1.15 var(--display);margin:0 0 6px;letter-spacing:-.01em;text-wrap:balance}
h2{font:700 19px/1.3 var(--display);margin:30px 0 10px;text-wrap:balance}
button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible,th.sort:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
p{margin:6px 0}
.sub{color:var(--soft);max-width:900px}
.meta{color:var(--soft);font-size:13px}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:10px;box-shadow:var(--shadow)}
.scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
table{border-collapse:collapse;width:100%}
th,td{padding:8px 10px;text-align:left;vertical-align:top;border-bottom:1px solid var(--line)}
th{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--soft);font-weight:600;white-space:nowrap}
th.sort{cursor:pointer;user-select:none}
th.sort:hover{color:var(--ink)}
th.on::after{content:" \\2193"}
th.on.up::after{content:" \\2191"}
td.num,th.num{text-align:right;font-variant-numeric:tabular-nums}
.sum tr{cursor:pointer}
.sum tr:hover td{background:var(--chip)}
.controls{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;padding:12px;position:sticky;top:env(safe-area-inset-top,0px);z-index:2;margin:14px 0}
.controls label{font-size:13px;color:var(--soft);display:flex;align-items:center;gap:6px}
input[type=search],select{font:inherit;font-size:14px;padding:6px 9px;border:1px solid var(--line);border-radius:7px;background:var(--panel);color:var(--ink);min-width:0}
input[type=search]{width:220px;max-width:100%}
.chips{display:flex;flex-wrap:wrap;gap:6px}
button.gen{font:inherit;font-size:13px;padding:5px 10px;border-radius:999px;border:1px solid var(--line);background:var(--panel);color:var(--ink);cursor:pointer}
button.gen[aria-pressed=true]{background:var(--ink);color:var(--panel);border-color:var(--ink)}
.count{font-size:13px;color:var(--soft);margin-left:auto}
.ads td{font-size:13px}
.ads img{width:92px;height:92px;object-fit:cover;border-radius:6px;display:block;background:var(--chip)}
.ads .name{font-weight:600;font-size:13px;max-width:220px;overflow-wrap:anywhere}
.ads .id{color:var(--soft);font-size:11.5px;overflow-wrap:anywhere;max-width:220px}
.tag{display:inline-block;padding:1px 7px;border-radius:999px;font-size:11.5px;background:var(--chip);color:var(--ink);margin:1px 2px 1px 0;white-space:nowrap}
.tag.good{background:var(--goodbg);color:var(--good)}
.tag.bad{background:var(--badbg);color:var(--bad)}
.tag.warn{background:var(--warnbg);color:var(--warn)}
.tag.off{background:transparent;color:var(--soft);border:1px dashed var(--line);text-decoration:line-through}
.tag.miss{background:transparent;color:var(--bad);border:1px solid var(--bad);text-decoration:line-through}
.sw{display:inline-block;width:18px;height:18px;border-radius:4px;border:1px solid var(--line);vertical-align:middle;margin-right:3px}
.cols{white-space:nowrap}
.small{font-size:11.5px;color:var(--soft)}
details summary{cursor:pointer;color:var(--accent);font-size:12px}
details ul{margin:6px 0 0;padding-left:16px;max-width:520px}
details li{overflow-wrap:anywhere}
.worst li{margin:4px 0}
.legend{font-size:13px;color:var(--soft);max-width:1000px}
.legend b{color:var(--ink)}
.notes{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;align-items:start}
.notes ul{margin:6px 0 0;padding-left:18px}
.notes .panel{padding:12px 14px;font-size:13.5px}
@media (max-width:700px){h1{font-size:24px}.ads img{width:64px;height:64px}.count{margin-left:0}}
</style>
<main>
<h1>Ad census</h1>
<p class="sub">Every ad the studio offers, opened the way a visitor opens it, and what each is made of: its generation and engine, its colours against the house pairs, its type, which of the full ad's elements it carries, how much of it the product fills, any banned or old wording, and its own pre-flight's verdict.</p>
<p class="meta" id="meta"></p>
<h2>By generation</h2>
<div class="panel scroll"><table class="sum" id="sum"></table></div>
<p class="legend" id="legend"></p>
<h2>Worst offenders</h2>
<ol class="worst" id="worst"></ol>
<h2>Where the old words come from</h2>
<div class="notes" id="sources"></div>
<h2>Every ad</h2>
<div class="panel controls" id="controls">
  <div class="chips" id="gens" role="group" aria-label="Generations"></div>
  <label>Search <input type="search" id="q" placeholder="name, id or words"></label>
  <label>Lacks <select id="lack"><option value="">anything or nothing</option><option value="*">any required element</option></select></label>
  <label>Words <select id="ban"><option value="">any</option><option value="*">any banned phrase</option></select></label>
  <label><input type="checkbox" id="offpair"> off the house pairs</label>
  <label><input type="checkbox" id="prefail"> pre-flight fails</label>
  <span class="count" id="count"></span>
</div>
<div class="panel scroll"><table class="ads" id="ads"></table></div>
</main>
<script type="application/json" id="census">${data}</script>
<script>
(function () {
  var D = JSON.parse(document.getElementById('census').textContent), R = D.rows;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var pct = function (v) { return v == null ? '' : (v * 100).toFixed(v < .1 ? 1 : 0) + '%'; };
  var V = D.visitor;
  $('meta').innerHTML = 'Made ' + esc(D.made.slice(0, 16).replace('T', ' ')) + ' UTC on ' + esc(D.branch) + ' at ' + esc(D.commit) + '. The visitor typed ' + esc(V.number) + ', ' + esc(V.site) + ' and the business name ' + esc(V.biz) + ' where the page asks for one, and gave the area ' + esc(V.zip) + ' (' + esc(V.town) + '). Every other word on an ad is the studio\\'s own. Required of every ad: ' + D.required.map(function (k) { return D.elementNames[k]; }).join(', ') + '.';
  var gens = Object.keys(D.summary), S = D.summary;
  var cell = function (n, of, bad) { return '<td class="num">' + (n == null ? '' : '<span class="tag ' + (n === 0 ? 'good' : bad ? 'bad' : '') + '">' + n + (of ? ' of ' + of : '') + '</span>') + '</td>'; };
  $('sum').innerHTML = '<thead><tr><th>Generation</th><th>Engine</th><th class="num">Ads</th><th class="num">Off the house engine</th><th class="num">Off the house pairs</th><th class="num">On a photograph</th><th class="num">Banned words</th><th class="num">Lacks a required element</th><th class="num">Pre-flight fails</th><th class="num">Product, median height</th><th class="num">Fail the gate</th></tr></thead><tbody>' +
    gens.map(function (g) { var s = S[g]; return '<tr data-gen="' + g + '"><td><b>' + esc(s.name) + '</b>' + (s.errors ? ' <span class="tag bad">' + s.errors + ' did not open</span>' : '') + '</td><td>' + esc(s.engine) + '</td><td class="num">' + s.ads + '</td>' + cell(s.offEngine, 0, 1) + cell(s.offColours, 0, 1) + cell(s.onPhoto, 0, 0) + cell(s.withBanned, 0, 1) + cell(s.lacking, 0, 1) +
      (s.preflight ? cell(s.preflight.fail, s.preflight.measured, 1) : '<td class="num small">none</td>') + '<td class="num">' + pct(s.productMedianH) + '</td>' + cell(s.gateFail, 0, 1) + '</tr>'; }).join('') + '</tbody>';
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('sum').addEventListener('click', function (e) { var tr = e.target.closest('tr[data-gen]'); if (!tr) return; on = {}; on[tr.dataset.gen] = true; syncGens(); draw(); $('controls').scrollIntoView({ behavior: calm ? 'auto' : 'smooth' }); });
  var lacks = gens.map(function (g) { var s = S[g], l = D.elements.filter(function (k) { return s.missingBy[k]; }); return '<b>' + esc(s.name) + '</b>: ' + (l.length ? l.map(function (k) { return D.elementNames[k] + ' ' + s.missingBy[k]; }).join(', ') : 'nothing'); });
  var foreign = gens.filter(function (g) { return S[g].foreignTowns; }).map(function (g) { return S[g].name + ' ' + S[g].foreignTowns; });
  var noName = gens.filter(function (g) { return S[g].withBannedNoName != null; }).map(function (g) { return S[g].name + ': ' + S[g].withBannedNoName + ' of ' + S[g].ads; });
  $('legend').innerHTML = 'Elements lacking, by generation. ' + lacks.join('. ') + '.' + (noName.length ? ' The full ad is read twice, as the visitor typed it and with no business name (the field is optional, and the claim badge then draws its own words); its banned words count either reading. With no name typed, ' + noName.join(', ') + ' carry a banned phrase.' : '') + (foreign.length ? ' Ads that print the library\\'s Long Beach towns to a visitor in ' + esc(V.town) + ': ' + foreign.join(', ') + '.' : '') + (D.calibration ? ' Pair match: ground within ' + D.calibration.groundMax + ' and accent within ' + D.calibration.accentMax + ' (OKLab, x100) of a pair\\'s own; on the full ads, which are drawn in a pair by construction, the measured ground was at most ' + D.calibration.fullGround + ' and the accent at most ' + D.calibration.fullAccent + ' from their declared pair.' : '');
  var worst = R.slice().sort(function (a, b) { return b.score - a.score || a.gen.localeCompare(b.gen); }).slice(0, 25);
  $('worst').innerHTML = worst.map(function (r) { return '<li><b>' + esc(r.name) + '</b> <span class="small">' + esc(r.genName) + ' · ' + esc(r.id) + '</span>: ' + esc(r.gateWhy.join('; ')) + '</li>'; }).join('');
  var li = function (f) { return '<li><span class="tag bad">' + esc(f.label) + '</span> ' + esc(f.text) + '</li>'; };
  $('sources').innerHTML = (D.sources || []).map(function (s) { return '<div class="panel"><b>' + esc(s.name) + '</b><p class="small">' + esc(s.file) + '</p>' +
    (s.found.length ? '<ul>' + s.found.slice(0, 6).map(li).join('') + '</ul>' + (s.found.length > 6 ? '<details><summary>' + (s.found.length - 6) + ' more</summary><ul>' + s.found.slice(6).map(li).join('') + '</ul></details>' : '') : '<p><span class="tag good">nothing banned</span></p>') + '</div>'; }).join('') || '<p class="small">Not measured in this run.</p>';
  // the controls
  var on = {}; gens.forEach(function (g) { on[g] = true; });
  function syncGens() { $('gens').innerHTML = gens.map(function (g) { return '<button type="button" class="gen" data-gen="' + g + '" aria-pressed="' + !!on[g] + '">' + esc(S[g].name) + ' ' + S[g].ads + '</button>'; }).join(''); }
  syncGens();
  $('gens').addEventListener('click', function (e) { var b = e.target.closest('button[data-gen]'); if (!b) return; var all = gens.every(function (g) { return on[g]; }); if (all) { on = {}; on[b.dataset.gen] = true; } else on[b.dataset.gen] = !on[b.dataset.gen]; if (!gens.some(function (g) { return on[g]; })) gens.forEach(function (g) { on[g] = true; }); syncGens(); draw(); });
  D.required.forEach(function (k) { $('lack').insertAdjacentHTML('beforeend', '<option value="' + k + '">' + esc(D.elementNames[k]) + '</option>'); });
  ['claims', 'sticker', 'website'].forEach(function (k) { $('lack').insertAdjacentHTML('beforeend', '<option value="' + k + '">' + esc(D.elementNames[k]) + ' (not required)</option>'); });
  D.phrases.forEach(function (p) { var n = R.filter(function (r) { return r.bannedIds.indexOf(p.id) >= 0; }).length; if (n) $('ban').insertAdjacentHTML('beforeend', '<option value="' + p.id + '">' + esc(p.label) + ' (' + n + ')</option>'); });
  ['q', 'lack', 'ban', 'offpair', 'prefail'].forEach(function (id) { $(id).addEventListener(id === 'q' ? 'input' : 'change', draw); });
  var COLS = [
    { k: 'thumb', t: 'Ad' }, { k: 'name', t: 'Name', s: function (r) { return r.name.toLowerCase(); } },
    { k: 'gen', t: 'Generation', s: function (r) { return gens.indexOf(r.gen) * 1e4 + (r.cat || '').charCodeAt(0); } },
    { k: 'colour', t: 'Colours', s: function (r) { return (r.pairMatch ? 0 : 1000) + (r.dG || 0) + (r.dA || 0); } },
    { k: 'type', t: 'Type', s: function (r) { return (r.type || '') + r.faces; } },
    { k: 'el', t: 'Elements', s: function (r) { return r.missing.length * 100 + r.lacks.length; } },
    { k: 'h', t: 'Product', s: function (r) { return r.h == null ? -1 : r.h; }, num: 1 },
    { k: 'banned', t: 'Banned or old words', s: function (r) { return r.bannedIds.length; } },
    { k: 'pre', t: 'Pre-flight', s: function (r) { return r.pre ? (r.pre.ok ? 0 : 100) + (r.pre.fixes || 0) * 10 + (r.pre.notes || 0) : -1; } },
    { k: 'score', t: 'Score', s: function (r) { return r.score; }, num: 1 }];
  var sortK = 'score', up = false;
  function head() { $('ads').innerHTML = '<thead><tr>' + COLS.map(function (c) { return '<th class="' + (c.s ? 'sort' : '') + (c.num ? ' num' : '') + (sortK === c.k ? ' on' + (up ? ' up' : '') : '') + '" data-k="' + c.k + '"' + (c.s ? ' tabindex="0" aria-sort="' + (sortK === c.k ? (up ? 'ascending' : 'descending') : 'none') + '"' : '') + '>' + c.t + '</th>'; }).join('') + '</tr></thead><tbody></tbody>'; }
  function sortBy(th) { var k = th.dataset.k; if (sortK === k) up = !up; else { sortK = k; up = k === 'name' || k === 'gen' || k === 'type'; } draw(); var again = $('ads').querySelector('th[data-k="' + k + '"]'); if (again) again.focus(); }
  $('ads').addEventListener('click', function (e) { var th = e.target.closest('th.sort'); if (th) sortBy(th); });
  $('ads').addEventListener('keydown', function (e) { var th = e.target.closest('th.sort'); if (th && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); sortBy(th); } });
  function els(r) { return D.elements.map(function (k) { var has = !!r.el[k], req = D.required.indexOf(k) >= 0; var label = D.elementNames[k] + (k === 'product' && r.productKind && r.productKind !== 'picture' ? ' (' + r.productKind + ')' : ''); return '<span class="tag ' + (has ? 'good' : req ? 'miss' : 'off') + '">' + esc(label) + '</span>'; }).join('') +
    (r.foreign.length ? '<div><span class="tag bad" title="the visitor is in ' + esc(V.town) + '">prints ' + esc(r.foreign.join(', ')) + '</span></div>' : ''); }
  function row(r) {
    var pre = !r.pre ? '<span class="small">none</span>' : '<span class="tag ' + (r.pre.ok ? 'good' : 'bad') + '">' + (r.pre.ok ? 'passes' : 'fails') + '</span>' + (r.pre.fixes ? ' <span class="tag bad">' + r.pre.fixes + ' to fix</span>' : '') + (r.pre.notes ? ' <span class="tag warn">' + r.pre.notes + ' notes</span>' : '') + (r.pre.says && r.pre.says.length ? '<details><summary>what it says</summary><ul>' + r.pre.says.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></details>' : '');
    var words = r.words.length ? '<details><summary>' + r.words.length + ' lines</summary><ul>' + r.words.map(function (w) { return '<li><span class="small">' + esc(w[0]) + ':</span> ' + esc(w[1]) + '</li>'; }).join('') + '</ul></details>' : '';
    return '<tr>' +
      '<td>' + (r.thumb ? '<img loading="lazy" alt="" src="' + r.thumb + '">' : '') + '</td>' +
      '<td><div class="name">' + esc(r.name) + '</div><div class="id">' + esc(r.id) + '</div>' + (r.error ? '<span class="tag bad">' + esc(r.error) + '</span>' : '') + (r.offered ? '<div class="small">' + esc(r.offered) + '</div>' : '') + '</td>' +
      '<td><b>' + esc(r.genName) + '</b><div class="small">' + esc(r.engine) + (r.cat ? ' · ' + esc(r.cat) : '') + (r.shelf ? ' · ' + esc(r.shelf) : '') + '</div></td>' +
      '<td class="cols">' + (r.ground ? '<span class="sw" title="ground ' + esc(r.ground) + '" style="background:' + esc(r.ground) + '"></span>' : '') + (r.accent ? '<span class="sw" title="accent ' + esc(r.accent) + '" style="background:' + esc(r.accent) + '"></span>' : '') +
        ' <span class="tag ' + (r.pairMatch ? 'good' : 'bad') + '">' + (r.pairMatch ? esc(r.pair) : 'off') + '</span><div class="small">' + esc(r.pairMatch ? (r.groundKind === 'drawn' ? 'drawn ground' : r.groundKind) : r.pairWhy) + (r.declared ? '<br>says: ' + esc(r.declared) : '') + '</div></td>' +
      '<td>' + esc(r.type) + '<div class="small">' + esc(r.faces) + '</div></td>' +
      '<td>' + els(r) + '</td>' +
      '<td class="num">' + (r.h == null ? '<span class="small">' + esc(r.productKind || 'none') + '</span>' : pct(r.h) + ' high<div class="small">' + pct(r.a) + ' of the area</div>') + '</td>' +
      '<td>' + (r.banned.length ? r.banned.map(function (b) { return '<span class="tag bad" title="' + esc(b.where) + '">' + esc(b.match) + '</span>'; }).join('') : r.bannedNoName.length ? '' : '<span class="tag good">none</span>') +
        (r.bannedNoName.length ? '<div class="small">with no business name typed:</div>' + r.bannedNoName.map(function (b) { return '<span class="tag bad" title="' + esc(b.where) + '">' + esc(b.match) + '</span>'; }).join('') : '') + words + '</td>' +
      '<td>' + pre + '</td>' +
      '<td class="num">' + r.score + '</td></tr>';
  }
  function draw() {
    head();
    var q = $('q').value.trim().toLowerCase(), lack = $('lack').value, ban = $('ban').value, offp = $('offpair').checked, pref = $('prefail').checked;
    var list = R.filter(function (r) {
      if (!on[r.gen]) return false;
      if (lack === '*' && !r.missing.length) return false;
      if (lack && lack !== '*' && r.lacks.indexOf(lack) < 0) return false;
      if (ban === '*' && !r.bannedIds.length) return false;
      if (ban && ban !== '*' && r.bannedIds.indexOf(ban) < 0) return false;
      if (offp && r.pairMatch) return false;
      if (pref && !(r.pre && r.pre.ok === false)) return false;
      if (q && (r.name + ' ' + r.id + ' ' + r.words.map(function (w) { return w[1]; }).join(' ')).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var col = COLS.filter(function (c) { return c.k === sortK; })[0];
    list.sort(function (a, b) { var x = col.s(a), y = col.s(b); var d = x < y ? -1 : x > y ? 1 : 0; return (up ? d : -d) || a.id.localeCompare(b.id); });
    $('ads').querySelector('tbody').innerHTML = list.map(row).join('');
    $('count').textContent = list.length + ' of ' + R.length + ' ads';
  }
  draw();
})();
</script>
`;
}

/* ------------------------------------------------------------------ the server */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.txt': 'text/plain', '.ico': 'image/x-icon' };
async function ensureServer() {
  const local = readFileSync(join(ROOT, 'app.js'));
  try {
    const r = await fetch(BASE + 'app.js', { signal: AbortSignal.timeout(4000) });
    const got = Buffer.from(await r.arrayBuffer());
    if (r.ok && got.equals(local)) { console.log('serving: ' + BASE + ' (already running, this tree)'); return null; }
    console.error(`${BASE} answers with another tree's app.js (or an error, ${r.status}). Stop that server or set GFX_BASE to one that serves ${ROOT}.`);
    process.exit(2);
  } catch (e) { /* nothing there: serve it */ }
  const u = new URL(BASE);
  if (!/^(127\.0\.0\.1|localhost)$/.test(u.hostname)) { console.error('nothing answers at ' + BASE); process.exit(2); }
  const server = createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, BASE).pathname), file = join(ROOT, p);
    if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    try {
      if (statSync(file).isDirectory()) { if (!p.endsWith('/')) { res.writeHead(301, { location: p + '/' }); return res.end(); } file = join(file, 'index.html'); }
      const body = readFileSync(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(body);
    } catch (e) { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('not found'); }
  });
  await new Promise((ok, no) => { server.once('error', no); server.listen(+u.port || 80, u.hostname, ok); });
  console.log('serving: ' + BASE + ' (this tree, from the script)');
  return server;
}

/* ================================================================== in the page
   Everything below SHARED runs in the browser. SHARED is installed in every page; the rest
   are the per-generation readers. None of it changes what the page stores. */
function SHARED(V) {
  const lin = v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
  const toLab = (r, g, b) => { const R = lin(r), G = lin(g), B = lin(b);
    const l = Math.cbrt(.4122214708 * R + .5363325363 * G + .0514459929 * B), m = Math.cbrt(.2119034982 * R + .6806995451 * G + .1073969566 * B), s = Math.cbrt(.0883024619 * R + .2817188376 * G + .6299787005 * B);
    return [.2104542553 * l + .793617785 * m - .0040720468 * s, 1.9779984951 * l - 2.428592205 * m + .4505937099 * s, .0259040371 * l + .7827717662 * m - .808675766 * s]; };
  const fromLab = ([L, a, b]) => { const l = (L + .3963377774 * a + .2158037573 * b) ** 3, m = (L - .1055613458 * a - .0638541728 * b) ** 3, s = (L - .0894841775 * a - 1.291485548 * b) ** 3;
    const R = 4.0767416621 * l - 3.3077115913 * m + .2309699292 * s, G = -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s, B = -.0041960863 * l - .7034186147 * m + 1.707614701 * s;
    const g = x => { x = Math.max(0, Math.min(1, x)); return Math.round(255 * (x <= .0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - .055)); };
    return '#' + [R, G, B].map(g).map(v => v.toString(16).padStart(2, '0')).join(''); };
  const dE = (p, q) => 100 * Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  const C = p => Math.hypot(p[1], p[2]), Hue = p => (Math.atan2(p[2], p[1]) * 180 / Math.PI + 360) % 360;
  const med = a => { const s = Float64Array.from(a).sort(); return s.length ? s[s.length >> 1] : 0; };
  const medLab = px => [med(px.map(p => p[0])), med(px.map(p => p[1])), med(px.map(p => p[2]))];
  const hueGap = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
  window.__cz = {
    V,
    /** The ground: the frame's outer band (3% of the short side), its median colour, and how much
     *  it varies (a photograph varies, a drawn ground hardly). The accent: the hue family with the
     *  most saturated pixels (OKLCH chroma .09 and up) that is neither the ground nor a shade of
     *  it, outside the product pictures, at .3% of the picture at least. */
    colours(data, W, H, products = [], photo = false) {
      const step = Math.max(1, Math.round(Math.min(W, H) / 300)), ring = Math.max(2, Math.round(Math.min(W, H) * .03));
      const inProduct = (x, y) => products.some(b => x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]);
      const edge = [], body = [];
      for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) {
        const i = (y * W + x) * 4, p = toLab(data[i], data[i + 1], data[i + 2]);
        if (x < ring || y < ring || x >= W - ring || y >= H - ring) edge.push(p);
        if (!inProduct(x, y)) body.push(p);
      }
      const g = medLab(edge), spread = med(edge.map(p => dE(p, g))), gC = C(g), gH = Hue(g);
      const sat = body.filter(p => C(p) >= .09 && dE(p, g) >= 15 && !(gC >= .04 && hueGap(Hue(p), gH) <= 25));
      const bins = Array.from({ length: 24 }, () => []);
      sat.forEach(p => bins[Math.floor(Hue(p) / 15) % 24].push(p));
      let best = -1, bestN = 0;
      for (let k = 0; k < 24; k++) { const n = bins[k].length + .5 * (bins[(k + 23) % 24].length + bins[(k + 1) % 24].length); if (n > bestN) { bestN = n; best = k; } }
      let accent = null, share = 0;
      if (best >= 0) { const px = [...bins[(best + 23) % 24], ...bins[best], ...bins[(best + 1) % 24]]; share = px.length / Math.max(1, body.length); if (share >= .003) accent = fromLab(medLab(px)); }
      return { ground: fromLab(g), groundSpread: +spread.toFixed(1), groundKind: photo ? 'photo' : spread > 12 ? 'textured' : 'drawn', accent, accentShare: +share.toFixed(4) };
    },
    /** The product pictures' share: the height they span, and the area their boxes cover (their
     *  union, on a grid of 4px). */
    share(boxes, W, H) {
      const bs = boxes.map(b => [Math.max(0, b[0]), Math.max(0, b[1]), Math.min(W, b[2]), Math.min(H, b[3])]).filter(b => b[2] > b[0] && b[3] > b[1]);
      if (!bs.length) return null;
      const h = (Math.max(...bs.map(b => b[3])) - Math.min(...bs.map(b => b[1]))) / H;
      const k = 4, gw = Math.ceil(W / k), gh = Math.ceil(H / k), cov = new Uint8Array(gw * gh);
      for (const b of bs) for (let y = Math.floor(b[1] / k); y < Math.ceil(b[3] / k); y++) for (let x = Math.floor(b[0] / k); x < Math.ceil(b[2] / k); x++) cov[y * gw + x] = 1;
      let n = 0; for (const c of cov) n += c;
      return { h: +h.toFixed(3), area: +(n / (gw * gh)).toFixed(3), n: bs.length };
    },
    thumb(canvas, px = 184) {
      const k = px / Math.max(canvas.width, canvas.height), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(canvas.width * k)); c.height = Math.max(1, Math.round(canvas.height * k));
      const x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(canvas, 0, 0, c.width, c.height);
      return c.toDataURL('image/jpeg', .74);
    },
    /** The visitor's own words found among an ad's lines. */
    norm: s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9$#]+/g, ' ').trim(),
    seen(words, needle) { const n = this.norm(needle); return !!n && words.some(w => (' ' + this.norm(w.text) + ' ').includes(' ' + n + ' ')); },
    townsIn(words, towns) { return (towns || []).filter(t => this.seen(words, t)); },
    /** a box the product's way: a phone at its landed place, its size and turn (fullad.js phoneBox) */
    phoneBoxes(ad) {
      return (ad.phones || []).map(p => { const a = (p.angle || 0) * Math.PI / 180, hw = p.size * (p.w * Math.abs(Math.cos(a)) + p.h * Math.abs(Math.sin(a))) / 2, hh = p.size * (p.h * Math.abs(Math.cos(a)) + p.w * Math.abs(Math.sin(a))) / 2;
        return [p.home[0] - hw, p.home[1] - hh, p.home[0] + hw, p.home[1] + hh]; });
    },
  };
}

/* ---- the studio: Easy Mode, as a visitor opens it ---- */
function STUDIO() {
  const cz = window.__cz, V = cz.V;
  cz.towns = () => { let a = null; try { a = getArea(); } catch (e) { } return a ? [...new Set([a.home, ...(a.cover || [])].map(s => String(s).split(',')[0].trim()).filter(Boolean))] : []; };
  cz.lbTowns = ['LONG BEACH', 'LAKEWOOD', 'DOWNEY', 'CARSON', 'TORRANCE'];
  const fam = f => String(f || '').replace(/["']/g, '').split(',')[0].trim();
  const CLAIM_NAMES = /^(Badges|Chip|Chip Text|Point|Check|Know|Kicker|Sub Kicker|Neon Kicker|Seal Legend|Price Line|Price Label|Stars|Rating Line|Sticker Text)$/;
  const STICKER_NAMES = /sticker|seal|burst|stamp|ticket/i;
  /** What a fabric scene is made of, read off its objects as drawn. */
  cz.readScene = (sc, t) => {
    const W = sc.getWidth(), H = sc.getHeight(), k = 1080 / Math.min(W, H);
    const vis = o => o && o.visible !== false && (o.opacity == null || o.opacity >= .5);
    const box = o => { o.setCoords(); const b = o.getBoundingRect(true, true); return [b.left, b.top, b.left + b.width, b.top + b.height]; };
    const on = b => b[2] > 1 && b[3] > 1 && b[0] < W - 1 && b[1] < H - 1 && (b[2] - b[0]) * (b[3] - b[1]) > 9;
    const words = [];
    const add = (o, text, font, size, owner) => { if (!/[A-Za-z0-9$#]/.test(text || '')) return; const b = box(owner || o); if (!on(b)) return;
      words.push({ where: (o.name || (owner && owner.name) || o.pgRole || 'line').replace(/\s*\d+$/, ''), role: o.pgRole || (owner && owner.pgRole) || '', name: String(o.name || (owner && owner.name) || '').replace(/\s*\d+$/, ''), text: String(text).replace(/\s+/g, ' ').trim(), font: fam(font), px: Math.round((size || 0) * k), b }); };
    for (const o of sc.getObjects()) {
      if (!vis(o)) continue;
      if (o.type === 'group' && o.pgCurved && typeof o.pgCurved.text === 'string') add(o, o.pgCurved.text, (o.pgCurved.style || {}).fontFamily, ((o.pgCurved.style || {}).fontSize || o.height || 0) * (o.scaleY || 1));
      else if (typeof o.text === 'string') add(o, o.text, o.fontFamily, (o.fontSize || 0) * (o.scaleY || 1));
      else if (o.type === 'group') for (const c of (o._objects || [])) if (typeof c.text === 'string') add(c, c.text, c.fontFamily, (c.fontSize || 0) * (c.scaleY || 1) * (o.scaleY || 1), o);
    }
    const products = sc.getObjects().filter(o => vis(o) && o.type === 'image' && o.pgRole === 'photo' && !o.pgBgRect && !o.pgPattern && (o.opacity == null || o.opacity >= .6)).map(box).filter(on);
    const photo = !!sc.backgroundImage;
    const stickers = sc.getObjects().filter(o => vis(o) && STICKER_NAMES.test(o.name || '')).map(box).filter(on);
    const role = r => words.filter(w => w.role === r);
    const towns = cz.townsIn(words, cz.towns()), foreign = cz.lbTowns.filter(x => cz.seen(words, x) && !cz.towns().some(y => cz.norm(y) === x));
    const el = {
      business: cz.seen(words, V.biz), headline: role('headline').length > 0,
      product: products.length > 0, productKind: products.length ? 'picture' : photo ? 'photograph only' : 'none',
      number: role('phone').length > 0, cta: role('cta').length > 0, towns: towns.length > 0, townsFound: towns, foreignTowns: foreign,
      claims: words.some(w => w.role === 'badges' || CLAIM_NAMES.test(w.name)), sticker: stickers.length > 0,
      website: role('website').length > 0 || cz.seen(words, V.site),
    };
    const heads = role('headline').sort((a, b) => b.px - a.px), count = {};
    words.filter(w => ['sub', 'info', 'cta', 'badges', 'website', 'offer'].includes(w.role)).forEach(w => { count[w.font] = (count[w.font] || 0) + 1; });
    const display = heads.length ? heads[0].font : '', support = (Object.entries(count).sort((a, b) => b[1] - a[1])[0] || [''])[0], number = (role('phone')[0] || {}).font || '';
    const pair = (typeof FONT_PAIRS !== 'undefined' ? FONT_PAIRS : []).find(p => p.display[0] === display && p.support[0] === support);
    const type = { pair: pair ? pair.name + ' pair' : '', display, support, number, headPx: heads.length ? heads[0].px : 0 };
    return { words: words.map(w => ({ where: w.where, text: w.text })), el, type, products, photo, W, H };
  };
  /** One template, opened the way a visitor opens it, drawn as its download, read and measured. */
  cz.scene = async (id, showcase) => {
    const t = TEMPLATES.find(x => x.id === id); if (!t) return { error: 'not a template' };
    try { localStorage.removeItem('pgfx_ez_state'); } catch (e) { }
    if (currentCat !== t.cat) setCategory(t.cat);
    ez.bg = null; ez.bgRecId = null; ez.bgData = null; ez.bgImgObj = null; ez.theme = null; ez.voice = null; ez.shade = 0;   // a fresh visitor has picked nothing
    showEasy(id);
    if (ez.tpl !== id) return { error: 'opened ' + ez.tpl };
    if (showcase) { ez.bg = null; ez.bgRecId = null; ez.bgPicked = true; }        // what openShowcase does: the card's photograph is the design
    await ensureTplAssets(ezTpl()); await document.fonts.ready;
    document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
    $('ez-phone').value = V.number; $('ez-website').value = V.site;
    const sc = renderEzCanvas(1080, 'png', undefined, undefined, 'square', true);
    let r = null; try { r = pgCheck(sc); } catch (e) { r = { error: String(e).slice(0, 120) }; }
    sc.renderAll();
    const read = cz.readScene(sc, t), cnv = sc.lowerCanvasEl, W = cnv.width, H = cnv.height;
    const data = cnv.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data;
    const out = { words: read.words, el: read.el, type: read.type, colours: cz.colours(data, W, H, read.products, read.photo), product: cz.share(read.products, W, H), thumb: cz.thumb(cnv),
      pre: r && !r.error ? { kind: 'pgCheck', ok: !!r.ok, fixes: r.fails.length, notes: r.warns.length, says: r.fails.map(f => { let t = f.code; try { t = pgExplain(f); } catch (e) { } return t + (f.value != null ? ' (' + f.value + (f.need != null ? ', needs ' + f.need : '') + ')' : ''); }).concat(r.warns.map(f => 'warning: ' + f.code + (f.line ? ' (' + f.line + (f.value != null ? ' ' + f.value : '') + ')' : ''))), picture: r.picture || null } : { kind: 'pgCheck', error: r && r.error } };
    sc.dispose();
    return out;
  };
  /** Every template Easy Mode's strip offers, category by category, in the strip's own order. */
  cz.templates = () => {
    const cats = [...new Set(TEMPLATES.filter(t => !t.showcase).map(t => t.cat))], out = [], seen = new Set(), keep = currentCat, acct = account;
    for (const c of cats) { try { setCategory(c); catTemplates().filter(t => !t.showcase).forEach((t, i) => { if (seen.has(t.id)) return; seen.add(t.id);
      account = null; let locked = false; try { locked = tplLocked(t); } catch (e) { } account = acct;
      out.push({ id: t.id, name: t.name, cat: t.cat, gen: /^dl_/.test(t.id) ? 'dl' : /^of_/.test(t.id) ? 'of' : 'other', pal: t.pal || '', order: i + 1, locked }); }); } catch (e) { account = acct; } }
    try { setCategory(keep); } catch (e) { }
    return { list: out, total: TEMPLATES.filter(t => !t.showcase).length, gated: TEMPLATES.filter(t => !t.showcase && t.gated).map(t => t.id),
      held: Object.keys(window.TEMPLATE_HOLDS || {}).length, retired: Object.keys(window.TEMPLATE_RETIRED || {}).length };
  };
  cz.showcase = async () => { const cards = await scLoadIndex(); return cards.map(c => ({ id: c.id, name: c.name, cat: c.cat, theme: c.theme || '', base: c.base || '' })); };
  cz.card = async id => {
    const tid = await scRegister(id); if (!tid) return { error: 'the record did not load' };
    try { return await cz.scene(tid, true); }
    finally {
      /* the cards opened before this one leave TEMPLATES and the record cache (the one on screen stays
         until the next is opened), so a long run does not carry 366 records */
      for (let i = TEMPLATES.length - 1; i >= 0; i--) { const x = TEMPLATES[i].id; if (/^sc-/.test(x) && x !== ez.tpl) { TEMPLATES.splice(i, 1); try { delete SHOWCASE.records[x.slice(3)]; } catch (e) { } } }
    }
  };
  /* ---- the full ad, Easy Mode's first card: the class the page draws it with, at its download size ---- */
  cz.fullLines = () => FullAdStudio.lines().map(s => ({ id: 'full-' + s.key, key: s.key, name: s.label, cat: s.cat, group: s.group || '' }));
  cz.full = async (key, seed = 1) => {
    const M = await import('/motion/fullad.js'), CAT = await import('/motion/catalog.js');
    const S = FullAdStudio.lines().find(s => s.key === key); if (!S) return { error: 'no line ' + key };
    const FA = FullAdStudio.state;
    if (currentCat !== S.cat) setCategory(S.cat);
    FA.line[S.cat] = S.key; FA.biz = V.biz; FA.seed = seed; FA.pair = ''; FA.voice = ''; FA.words = {}; FA.set = {}; FA.recipe = {};   // what a visitor who typed only their name sees first
    $('ez-phone').value = V.number; $('ez-website').value = V.site;
    return cz.fullRead();
  };
  /* ---- a recipe (motion/recipes.json): an older ad drawn by the full ad, opened as Easy Mode's
     "From the library" opens it, read as the full ad is read ---- */
  cz.recipeList = async () => (await FullAdStudio.recipes()).map(r => ({ id: r.id, label: r.label, cat: r.cat, subject: r.subject, from: r.from, gen: r.gen }));
  cz.recipe = async rid => {
    const r = await FullAdStudio.useRecipe(rid); if (!r) return { error: 'no recipe ' + rid };
    const FA = FullAdStudio.state; FA.biz = V.biz;   // on its own seed (useRecipe: the rebuild, 2026-11-18)
    $('ez-phone').value = V.number; $('ez-website').value = V.site;
    const out = await cz.fullRead();
    FA.recipe = {};
    return out;
  };
  cz.fullRead = async () => {
    const M = await import('/motion/fullad.js'), CAT = await import('/motion/catalog.js'), FA = FullAdStudio.state;
    const { ad, st } = await FullAdStudio.build(1080, FORMATS.square);
    const frame = M.fullStill(ad), pre = M.fullPreflight(ad, frame), F = ad.full, R = F.rects, W = ad.W, H = ad.H;
    const up = s => String(s || '').toUpperCase();
    const words = [];
    const put = (where, text) => { if (text && /[A-Za-z0-9$#]/.test(text)) words.push({ where, text: String(text).replace(/\s+/g, ' ').trim() }); };
    if (R.claim) put('claim', st.feed_claim);
    put('headline', st.headline);
    if (R.line) put('line under it', st.feed_line || st.tag);
    if (R['selling points']) put('selling points', st.points);
    if (R.sticker) put('sticker', st.feed_burst);
    if (R['call to action']) put('call to action', st.number_label);
    put('number', st.number);
    if (R.footer) { put('towns', st.feed_where); put('website', st.feed_site); }
    const towns = cz.townsIn(words.filter(w => w.where === 'towns'), cz.towns());
    const boxes = cz.phoneBoxes(ad), photo = !!st.ground_photo;
    const el = {
      business: !!(R.claim && V.biz && up(st.feed_claim) === up(V.biz)), headline: !!R.headline,
      product: !!(ad.phones.length && F.group), productKind: ad.phones.length ? 'picture' : 'none',
      number: !!R.number, cta: !!R['call to action'], towns: !!(R.footer && towns.length), townsFound: towns, foreignTowns: [],
      claims: !!(R['selling points'] || (R.claim && up(st.feed_claim) !== up(V.biz))), sticker: !!R.sticker, website: !!(R.footer && st.feed_site),
      left: F.left.slice(),
    };
    /* the same ad for a visitor who leaves the business name empty, as most will (it is optional):
       the claim badge then draws from the full ad's own list, and the sticker's word is chosen
       against the claim, so both can change */
    let wordsNoName = [];
    FA.biz = '';
    try {
      const b2 = await FullAdStudio.build(1080, FORMATS.square), s2 = b2.st, R2 = b2.ad.full.rects, put2 = (where, text) => { if (text && /[A-Za-z0-9$#]/.test(text)) wordsNoName.push({ where, text: String(text).replace(/\s+/g, ' ').trim() }); };
      if (R2.claim) put2('claim', s2.feed_claim);
      if (R2.line) put2('line under it', s2.feed_line || s2.tag);
      if (R2['selling points']) put2('selling points', s2.points);
      if (R2.sticker) put2('sticker', s2.feed_burst);
    } catch (e) { wordsNoName = null; }
    FA.biz = V.biz;
    const vName = st.full_pair && CAT.TYPE_VOICES[st.type_pair] ? CAT.TYPE_VOICES[st.type_pair].name + ' pair' : 'House face';
    const face = k => (CAT.FONTS[k] || [k])[0];
    const type = { pair: vName, display: face(st.font), support: face(st.full_pair && CAT.TYPE_VOICES[st.type_pair] ? CAT.TYPE_VOICES[st.type_pair].label : 'franklin'), number: face(st.number_font === 'same' ? st.font : st.number_font) };
    const data = frame.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data;
    const pairName = (M.COLOUR_OF[st.full_colour] || {}).name || st.full_colour;
    return { words, wordsNoName, el, type, colours: cz.colours(data, W, H, boxes, photo), declared: pairName, declaredKey: st.full_colour, product: cz.share(boxes, W, H), thumb: cz.thumb(frame),
      pre: { kind: 'fullPreflight', ok: !!pre.ok, fixes: pre.findings.filter(f => f.level === 'fix').length, notes: pre.findings.filter(f => f.level === 'note').length, says: pre.findings.map(f => (f.level === 'fix' ? 'fix: ' : 'note: ') + f.say) } };
  };
  /** The words the generations write when the visitor writes none: the lists themselves. */
  cz.sources = async () => {
    const M = await import('/motion/fullad.js'), CAT = await import('/motion/catalog.js'), subjects = FullAdStudio.lines();
    const strings = (o, where, out = []) => { if (typeof o === 'string') out.push({ where, text: o }); else if (Array.isArray(o)) o.forEach(x => strings(x, where, out)); else if (o && typeof o === 'object') Object.entries(o).forEach(([k, v]) => strings(v, where ? where + ' ' + k : k, out)); return out; };
    let feedCards = []; try { const j = await fetch('/tools/feed-stills/cards.json').then(r => r.json()); feedCards = j.cards || j; } catch (e) { }
    const out = [{ name: 'The full ad\'s default words (FULL_WORDS)', file: 'motion/fullad.js', cat: 'phones', lines: Object.entries(M.FULL_WORDS).flatMap(([k, v]) => v.map(t => ({ where: k, text: t }))) },
      { name: 'The full ad\'s 35 lines: headlines, models, points', file: 'motion/subjects.json (from offer-library.js LINES)', cat: '', lines: subjects.flatMap(s => [...(s.heads || []).map(h => ({ where: s.key + ' headline', text: h })), { where: s.key + ' models', text: s.models || '' }, ...(Array.isArray(s.points) ? s.points : String(s.points || '').split(',')).map(p => ({ where: s.key + ' point', text: p }))]) },
      { name: 'The video maker\'s words (COPY and HEADLINES), which Any look draws from', file: 'motion/catalog.js', cat: 'phones', lines: [...strings(CAT.COPY, ''), ...strings(CAT.HEADLINES, 'headline')] },
      { name: 'iPhones LA\'s FeedAd cards: the words each still carries', file: 'tools/feed-stills/cards.json', cat: 'phones', lines: feedCards.flatMap(c => ['claim', 'headline', 'line', 'points', 'cta', 'where'].filter(k => c[k]).map(k => ({ where: (c.id || '') + ' ' + k, text: String(c[k]) }))) }];
    return out;
  };
}

/* ---- the video maker's Any look gallery: every look a visitor is shown, read as it is drawn ---- */
function MOTION() {
  const cz = window.__cz, V = cz.V;
  cz.watch = async () => {
    const eng = await import('/motion/engine.js');
    window.__looks = [];
    const orig = eng.Ad.prototype.stillAt;
    if (!orig.__census) {
      eng.Ad.prototype.stillAt = function (ctx, ...a) { const r = orig.call(this, ctx, ...a); try { if (this.st && !this.st.full) window.__looks.push({ ad: this, c: ctx.canvas }); } catch (e) { } return r; };
      eng.Ad.prototype.stillAt.__census = true;
    }
    return true;
  };
  cz.looks = async (limit) => {
    const CAT = await import('/motion/catalog.js'), ENG = await import('/motion/engine.js'), LP = await import('/motion/look-preflight.js');
    const shown = [...document.querySelectorAll('#gallery .mo-thumb')];
    const byCanvas = new Map(window.__looks.map(x => [x.c, x.ad]));
    const out = [];
    for (const b of shown.slice(0, limit || shown.length)) {
      const c = b.querySelector('canvas'), ad = byCanvas.get(c); if (!ad) continue;
      const sec = b.closest('section.mo-shelf'), shelf = sec ? (sec.querySelector('h4') || {}).textContent || '' : '';
      let grp = ''; for (let n = sec; n; n = n.previousElementSibling) if (n.matches && n.matches('h3.mo-shelf-grp')) { grp = n.textContent; break; }
      /* the look itself, as the gallery drew it: its own still, drawn again into a canvas of ours
         (the gallery's own may be playing). Not redrawn at 1080: a look is laid out by its plan,
         and an Ad made again from its drawn style is laid out afresh (it drew 5 to 65 a channel
         off the gallery's picture). What a visitor downloads is this plan at full size. */
      const st = ad.st, big = ad, cnv = document.createElement('canvas'); cnv.width = big.W; cnv.height = big.H;
      big.stillAt(cnv.getContext('2d'));
      const words = [], put = (where, text) => { if (text && /[A-Za-z0-9$#]/.test(String(text))) words.push({ where, text: String(text).replace(/\s+/g, ' ').trim() }); };
      put('headline', st.headline);
      if (big.tag && st.tag) put('line under it', st.tag);
      /* the label over the number, or the pulsing badge that stands for it (urgency pulse_cta: engine.js ctaOf) */
      if (big.num && big.num.label) put('call to action', big.num.cta ? (st.cta || (st.lang === 'es' ? '¡MÁNDANOS TEXTO!' : 'TEXT NOW')) : st.number_label);
      put('number', big.num && big.num.text ? big.num.text : st.number);
      if (big.perks) put('selling points', ENG.pointsOf(st).join(', '));
      if (big.burst) put('sticker', big.burst.text);
      if (big.stamp) put('stamp', st.stamp_text || 'CASH');
      if (st.hook && st.hook !== 'none' && st.hook_text) put('video opening', st.hook_text);
      if (st.strike_text) put('video opening (struck out)', st.strike_text);
      const towns = cz.townsIn(words, [V.town]);
      const boxes = cz.phoneBoxes(big);
      const el = { business: cz.seen(words, V.biz), headline: !!(big.lines && big.lines.length), product: boxes.length > 0, productKind: boxes.length ? 'picture' : 'none',
        number: !!big.num, cta: !!(big.num && big.num.label), towns: towns.length > 0, townsFound: towns, foreignTowns: [], claims: !!big.perks, sticker: !!(big.burst || big.stamp), website: cz.seen(words, V.site) };
      const face = k => (CAT.FONTS[k] || [k])[0], voice = CAT.TYPE_VOICES[st.type_pair];
      const type = { pair: voice ? voice.name + ' pair' : '', display: face(st.font), support: voice ? face(voice.label) : '', number: face(st.number_font === 'same' ? st.font : st.number_font) };
      const data = cnv.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, big.W, big.H).data;
      const cap = b.querySelector('.mo-cap'), name = cap ? (cap.querySelector('b') || {}).textContent : '';
      /* the look's own pre-flight (motion/look-preflight.js, 2026-11-18), as the page's download gate
         reads it: the same plan drawn at 540 on its short side */
      let pre = null;
      try {
        const k = 540 / Math.min(big.W, big.H), w = Math.round(big.W * k), h = Math.round(big.H * k);
        const rep = LP.lookPreflight(new ENG.Ad(big.plan ? big.plan.st : st, big.assets, w, h, big.plan ? { plan: big.plan } : {}));
        pre = { kind: 'lookPreflight', ok: !!rep.ok, fixes: rep.findings.filter(f => f.level === 'fix').length, notes: rep.findings.filter(f => f.level === 'note').length,
          says: rep.findings.map(f => (f.level === 'fix' ? 'fix: ' : 'note: ') + f.say), checks: rep.checks.map(c => [c.id, !!c.ok, String(c.value)]) };
      } catch (e) { pre = { kind: 'lookPreflight', error: String(e && e.message || e).slice(0, 160) }; }
      out.push({ id: 'any-' + st.seed, name: (name || 'look') + ' (seed ' + st.seed + ')', shelf: (grp ? grp + ': ' : '') + shelf, cat: 'phones', words, el, type,
        colours: cz.colours(data, big.W, big.H, boxes, false), declared: st.palette + (st.vibe && st.vibe !== 'none' ? ' · ' + st.vibe : '') + ' · ' + st.background, product: cz.share(boxes, big.W, big.H), thumb: cz.thumb(cnv), pre });
      await new Promise(r => setTimeout(r, 0));
    }
    return { looks: out, drawn: shown.length };
  };
}

/* ---- iPhones LA's FeedAd batch: each still as its report recorded it, laid out again to be read ---- */
function FEED() {
  const cz = window.__cz;
  cz.feedReady = async () => {
    if (cz._feed) return true;
    const eng = await import('/motion/engine.js'), acc = await import('/motion/accents.js'), M = await import('/motion/fullad.js'), CAT = await import('/motion/catalog.js');
    const { phones, index } = await eng.loadPhones('/motion/phones/');
    cz._feed = { eng, M, CAT, assets: { phones, index, accents: await acc.loadAccents('/assets/cutouts/') } };
    await eng.loadFonts(['franklin']);
    return true;
  };
  cz.feed = async (row, url) => {
    const { eng, M, CAT, assets } = cz._feed, st = row.style;
    await eng.loadFonts([...eng.fontsFor(st), 'franklin']);
    /* FeedAd's own verdict, made the way its generator makes it (tools/feed-stills/harness.js look()):
       blockers() on the 540 plan, then the maker's audit's required checks. blockers() read on a
       1080 layout reports overlaps the delivered picture does not have (its boxes are the plan's) */
    const AUD = await import('/motion/audit.js');
    const plan = new M.FeedAd(st, assets, 540, 540), why = M.blockers(plan, st);
    try { const audit = await AUD.auditLook(st, assets, { AdClass: M.FeedAd, size: 240, secs: 3.4, sound: false }); for (const c of audit.checks) if (M.REQUIRED.includes(c.id) && !c.ok) why.push(c.label + ': ' + c.value); }
    catch (e) { why.push('the audit did not run: ' + String(e).slice(0, 80)); }
    const ad = new M.FeedAd(st, assets, 1080, 1080);
    const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('no picture at ' + url)); i.src = url; });
    const cnv = document.createElement('canvas'); cnv.width = img.naturalWidth; cnv.height = img.naturalHeight; cnv.getContext('2d').drawImage(img, 0, 0);
    const k = cnv.width / ad.W;
    const words = [], put = (where, text) => { if (text && /[A-Za-z0-9$#]/.test(String(text))) words.push({ where, text: String(text).replace(/\s+/g, ' ').trim() }); };
    if (ad.claim) put('claim', st.feed_claim);
    put('headline', st.headline);
    if (ad.tag) put('line under it', st.feed_line);
    if (ad.perks) put('selling points', st.points);
    if (ad.num && ad.num.label) put('call to action', st.number_label);
    put('number', st.number);
    if (ad.site) { put('towns', st.feed_where); put('website', st.feed_site); }
    const boxes = cz.phoneBoxes(ad).map(b => b.map(v => v * k));
    const el = { business: false, headline: !!(ad.lines && ad.lines.length), product: boxes.length > 0, productKind: boxes.length ? 'picture' : 'none', number: !!ad.num, cta: !!(ad.num && ad.num.label),
      towns: !!(ad.site && st.feed_where), townsFound: st.feed_where ? [st.feed_where] : [], foreignTowns: [], claims: !!(ad.perks || ad.claim), sticker: !!ad.burst, website: !!(ad.site && st.feed_site) };
    const face = f => (CAT.FONTS[f] || [f])[0], voice = CAT.TYPE_VOICES[st.type_pair];
    const type = { pair: voice ? voice.name + ' pair' : '', display: face(st.font), support: voice ? face(voice.label) : '', number: face(st.number_font === 'same' ? st.font : st.number_font) };
    const data = cnv.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, cnv.width, cnv.height).data;
    return { words, el, type, colours: cz.colours(data, cnv.width, cnv.height, boxes, false), declared: st.palette + ' · ' + st.background, product: cz.share(boxes, cnv.width, cnv.height), thumb: cz.thumb(cnv),
      pre: { kind: 'FeedAd blockers and audit', ok: !why.length && row.ok !== false, fixes: why.length, notes: 0, says: why } };
  };
}

/* ================================================================== the run */
const T0 = Date.now();
const withTimeout = (p, ms, what) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error(what + ' took over ' + Math.round(ms / 1000) + 's')), ms))]);
const pick = list => { let l = IDS ? list.filter(x => IDS.has(x.id)) : list; return LIMIT ? l.slice(0, LIMIT) : l; };

async function studioPage(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
  await page.goto(BASE + '?demo=1', { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => typeof buildLayer === 'function' && typeof renderEzCanvas === 'function' && typeof TEMPLATES !== 'undefined' && typeof pgCheck === 'function' && window.FullAdStudio, null, { timeout: 120000 });
  await page.waitForTimeout(2500);
  await page.evaluate(SHARED, VISITOR);
  await page.evaluate(STUDIO);
  await page.evaluate(async V => {
    /* signed in as an operator, as the studio's own checks do: every design opens (a free visitor
       sees the same cards, with PRO on the locked ones), and nothing is counted against a plan */
    account = { email: 'census@local', role: 'admin', plan: 'pro' }; loadAccount = async () => account; recordExport = async () => true;
    const a = await resolveArea(V.zip); if (a) setArea(a);
    try { jset('pgfx_area_asked', true); } catch (e) { }
    $('ez-phone').value = V.number; $('ez-website').value = V.site;
    await scLoadIndex();
  }, VISITOR);
  return { ctx, page, errors };
}

async function runStudio(browser, jobs, label) {
  /* jobs: [{ id, gen, run: 'scene'|'card'|'full', arg }] shared by the workers */
  const rows = [];
  let next = 0, done = 0;
  const worker = async w => {
    let s = await studioPage(browser), since = 0;
    while (next < jobs.length) {
      const j = jobs[next++];
      if (since >= 70) { await s.ctx.close().catch(() => {}); s = await studioPage(browser); since = 0; }
      since++;
      let r;
      try { r = await withTimeout(s.page.evaluate(({ run, arg }) => run === 'full' ? __cz.full(arg[0], arg[1]) : run === 'recipe' ? __cz.recipe(arg) : run === 'card' ? __cz.card(arg) : __cz.scene(arg, false), { run: j.run, arg: j.arg }), 90000, j.id); }
      catch (e) { r = { error: String(e.message || e).split('\n')[0].slice(0, 140) }; await s.ctx.close().catch(() => {}); s = await studioPage(browser); since = 0; }
      rows.push({ ...j.meta, ...r });
      if (++done % 25 === 0 || done === jobs.length) console.log(`  ${label}: ${done}/${jobs.length} (${((Date.now() - T0) / 60000).toFixed(1)} min)`);
    }
    if (s.errors.length) console.log(`  worker ${w} page errors: ${s.errors.slice(0, 2).join(' | ')}`);
    await s.ctx.close().catch(() => {});
  };
  await Promise.all(Array.from({ length: Math.min(WORKERS, jobs.length || 1) }, (_, w) => worker(w)));
  return rows;
}

async function census() {
  const server = await ensureServer();
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const browser = await chromium.launch();
  const rows = [], notes = {};
  let sources = [];
  try {
    /* ---- what Easy Mode offers ---- */
    const probe = await studioPage(browser);
    const T = await probe.page.evaluate(() => __cz.templates());
    const cards = ONLY.includes('sc') ? await probe.page.evaluate(() => __cz.showcase()) : [];
    const lines = ONLY.includes('full') ? await probe.page.evaluate(() => __cz.fullLines()) : [];
    try { sources = await probe.page.evaluate(() => __cz.sources()); } catch (e) { console.log('sources not read: ' + e.message); }
    await probe.ctx.close();
    notes.templates = { offered: T.list.length, total: T.total, gated: T.gated.length, held: T.held, retired: T.retired, other: T.list.filter(t => t.gen === 'other').map(t => t.id) };
    console.log(`Easy Mode offers ${T.list.length} templates (${T.list.filter(t => t.gen === 'dl').length} designer layouts, ${T.list.filter(t => t.gen === 'of').length} offer family${notes.templates.other.length ? ', ' + notes.templates.other.length + ' other' : ''}); ${T.gated.length} more are gated, ${T.held} held and ${T.retired} retired by table`);
    const jobs = [];
    const recipeList = ONLY.includes('recipe') && existsSync(join(ROOT, 'motion/recipes.json')) ? JSON.parse(readFileSync(join(ROOT, 'motion/recipes.json'), 'utf8')).recipes : [];   // the file the studio opens them from
    for (const r of pick(recipeList)) jobs.push({ id: r.id, run: 'recipe', arg: r.id, meta: { id: r.id, gen: 'recipe', name: r.label, cat: r.cat, offered: `From the library (${r.subject}), made from ${r.from}` } });
    for (const l of pick(lines)) for (let v = 1; v <= VARIATIONS; v++) { const id = v === 1 ? l.id : `${l.id}-v${v}`; jobs.push({ id, run: 'full', arg: [l.key, v], meta: { id, gen: 'full', name: l.name + (v === 1 ? ' (full ad)' : ` (full ad, look ${v})`), cat: l.cat, offered: v === 1 ? `Easy Mode, the first card in ${l.cat}; What you buy: ${l.name}` : `the same, after New look ${v - 1} time${v > 2 ? 's' : ''}` } }); };
    for (const g of ['dl', 'of']) if (ONLY.includes(g)) for (const t of pick(T.list.filter(t => t.gen === g))) jobs.push({ id: t.id, run: 'scene', arg: t.id, meta: { id: t.id, gen: g, name: t.name, cat: t.cat, declared: t.pal, offered: `Easy Mode, ${t.cat} no. ${t.order}${t.locked ? ', PRO for a free visitor' : ''}` } });
    for (const c of pick(cards)) jobs.push({ id: c.id, run: 'card', arg: c.id, meta: { id: c.id, gen: 'sc', name: c.name, cat: c.cat, declared: c.theme, offered: 'the library wall (' + c.cat + ')' } });
    if (jobs.length) { console.log(`the studio: ${jobs.length} ads, ${WORKERS} at a time`); rows.push(...await runStudio(browser, jobs, 'studio')); }

    /* ---- the video maker's Any look gallery ---- */
    if (ONLY.includes('any')) {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
      const page = await ctx.newPage(), errors = [];
      page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
      await page.goto(BASE + 'motion/', { waitUntil: 'load', timeout: 120000 });
      await page.waitForSelector('#mode [data-full="0"]', { timeout: 60000 });
      /* the maker is ready when its first ad is drawn (rebuild hides #loading); a number typed
         before then is overwritten by its own start-up, and the gallery's looks say YOUR NUMBER */
      await page.waitForFunction(() => { const l = document.getElementById('loading'); return l && l.hidden; }, null, { timeout: 90000 });
      await page.evaluate(SHARED, VISITOR); await page.evaluate(MOTION); await page.evaluate(() => __cz.watch());
      /* one field at a time, each saved before the next: typed within half a second of each other,
         the area's handler (400 ms) refills the number field before the number's own (500 ms)
         reads it, and the number is lost (found by this census, 2026-11-18; OPEN-ITEMS §BI) */
      await page.fill('#f-number', VISITOR.number);
      await page.waitForFunction(([V]) => { try { return (JSON.parse(localStorage.getItem('pgfx_motion_v1') || '{}').style || {}).number === V.number; } catch (e) { return false; } }, [VISITOR], { timeout: 20000 })
        .catch(() => console.log('  the video maker did not save the number'));
      await page.fill('#f-area', VISITOR.town);
      await page.waitForFunction(([V]) => { try { const s = JSON.parse(localStorage.getItem('pgfx_motion_v1') || '{}').style || {}; return s.number === V.number && String(s.area || '').toUpperCase() === V.town.toUpperCase(); } catch (e) { return false; } }, [VISITOR], { timeout: 20000 })
        .catch(() => console.log('  the video maker did not save the area with the number'));
      await page.click('#mode [data-full="0"]');
      await page.waitForTimeout(1200);
      await page.locator('#looks').scrollIntoViewIfNeeded();
      /* a visitor who wants to see every look presses Show more until it goes */
      let last = -1, still = 0;
      for (let k = 0; k < 120; k++) {
        await page.waitForTimeout(700);
        const st = await page.evaluate(() => { const b = document.getElementById('more'); return { n: document.querySelectorAll('#gallery .mo-thumb').length, hidden: !b || b.hidden, disabled: !!(b && b.disabled) }; });
        if (LIMIT && st.n >= LIMIT) break;
        if (st.hidden && st.n === last) { if (++still > 3) break; } else still = 0;
        if (!st.hidden && !st.disabled) await page.click('#more').catch(() => {});
        last = st.n;
      }
      const got = await withTimeout(page.evaluate(n => __cz.looks(n), LIMIT || 0), 600000, 'the Any look gallery');
      console.log(`Any look: ${got.looks.length} looks read of ${got.drawn} drawn`);
      for (const l of got.looks) if (!IDS || IDS.has(l.id)) rows.push({ gen: 'any', offered: 'the video maker, Any look gallery', ...l });
      if (errors.length) console.log('  video maker page errors: ' + errors.slice(0, 2).join(' | '));
      notes.anyLook = { drawn: got.drawn };
      await ctx.close();
    }

    /* ---- iPhones LA's FeedAd batch ---- */
    if (ONLY.includes('feed')) {
      const batches = [['2026-11-03', 'tools/feed-stills/out/'], ...['2026-11-07'].map(b => [b, `tools/feed-stills/batches/${b}/`])].filter(([, d]) => existsSync(join(ROOT, d, 'report.json')));
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      await page.goto(BASE + 'tools/feed-stills/index.html', { waitUntil: 'load', timeout: 120000 });
      await page.evaluate(SHARED, VISITOR); await page.evaluate(FEED); await page.evaluate(() => __cz.feedReady());
      let n = 0;
      for (const [batch, dir] of batches) {
        const rep = JSON.parse(readFileSync(join(ROOT, dir, 'report.json'), 'utf8'));
        for (const row of pick(rep.cards.filter(c => c.ok && c.style).map(c => ({ ...c, id: 'feed-' + c.id })))) {
          const file = dir + row.id.replace(/^feed-/, '') + '.jpg';
          let r; try { r = await withTimeout(page.evaluate(([row, url]) => __cz.feed(row, url), [row, BASE + file]), 60000, row.id); } catch (e) { r = { error: String(e.message || e).slice(0, 140) }; }
          rows.push({ id: row.id, gen: 'feed', name: row.headline + ' (' + row.id.replace(/^feed-/, '') + ')', cat: 'phones', offered: `iPhones LA's batch of ${batch} (${file})`, ...r });
          n++;
        }
      }
      console.log(`FeedAd: ${n} stills read`);
      await ctx.close();
    }
  } finally {
    await browser.close();
    if (server) { server.closeAllConnections(); server.close(); }
  }
  return { rows, notes, sources };
}

/* ------------------------------------------------------------------ out */
function finish(c) {
  c.rows.forEach(compose);
  c.rows.sort((a, b) => GENS.indexOf(a.gen) - GENS.indexOf(b.gen) || String(a.cat).localeCompare(String(b.cat)) || a.id.localeCompare(b.id));
  c.summary = summarise(c.rows);
  c.sources = (c.rawSources || []).map(s => ({ name: s.name, file: s.file, found: bannedIn(s.lines, s.cat == null ? 'phones' : s.cat).map(f => ({ label: f.label, text: f.where + ': ' + f.text })) }));
  const full = c.rows.filter(r => r.gen === 'full' && r.colours && r.declaredKey);
  const own = full.map(r => { const p = PAIRS.find(x => x.key === r.declaredKey); return p ? { dG: dE(hexLab(r.colours.ground), p.g), dA: r.colours.accent ? dE(hexLab(r.colours.accent), p.a) : 99, nearest: r.colour.nearest === p.key } : null; }).filter(Boolean);
  c.calibration = own.length ? { groundMax: PAIR_GROUND, accentMax: PAIR_ACCENT, fullGround: +Math.max(...own.map(x => x.dG)).toFixed(1), fullAccent: +Math.max(...own.map(x => x.dA)).toFixed(1), fullNearestOwn: own.filter(x => x.nearest).length, full: own.length } : null;
  return c;
}

function report(c) {
  const S = c.summary;
  console.log('\nby generation (ads; off the house engine; off the house pairs; with banned words; lacking a required element; pre-flight fails):');
  for (const [g, s] of Object.entries(S)) console.log(`  ${s.name.padEnd(20)} ${String(s.ads).padStart(4)}   engine ${String(s.offEngine).padStart(4)}   pairs ${String(s.offColours).padStart(4)}   banned ${String(s.withBanned).padStart(4)}   lacking ${String(s.lacking).padStart(4)}   pre-flight ${s.preflight ? s.preflight.fail + ' of ' + s.preflight.measured : 'none'}${s.errors ? '   did not open ' + s.errors : ''}`);
  for (const [g, s] of Object.entries(S)) {
    const miss = ELEMENTS.filter(k => s.missingBy[k]).map(k => `${ELEMENT_NAMES[k]} ${s.missingBy[k]}`).join(', ');
    const ban = Object.entries(s.bannedBy).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ');
    console.log(`  ${s.name}: lacks ${miss || 'nothing'}${ban ? '; banned ' + ban : ''}${s.foreignTowns ? '; prints Long Beach towns to a San Diego visitor ' + s.foreignTowns : ''}`);
  }
  for (const s of Object.values(S)) if (s.withBannedNoName != null) console.log(`  ${s.name}, for a visitor who types no business name: ${s.withBannedNoName} of ${s.ads} carry a banned phrase`);
  if (c.calibration) console.log(`calibration: the ${c.calibration.full} full ads measure within ${c.calibration.fullGround} (ground) and ${c.calibration.fullAccent} (accent) of their own pair; ${c.calibration.fullNearestOwn} of them have it as the nearest`);
  for (const s of c.sources) console.log(`source: ${s.name}: ${s.found.length ? s.found.map(f => f.label + ' (' + f.text + ')').slice(0, 8).join('; ') : 'nothing banned'}`);
  console.log('\nworst offenders:');
  c.rows.slice().sort((a, b) => b.score - a.score).slice(0, 15).forEach(r => console.log(`  ${String(r.score).padStart(2)} ${r.genName.padEnd(20)} ${r.id}: ${r.gateWhy.join('; ')}`));
}

const thumbsOf = f => f.replace(/\.json$/, '') + '.thumbs.json';
let C;
if (RESCAN) {
  C = JSON.parse(readFileSync(RESCAN, 'utf8'));
  C.rawSources = C.rawSources || [];
  /* the thumbnails live beside the census (they are most of its weight), and come back with it */
  try { const T = JSON.parse(readFileSync(thumbsOf(RESCAN), 'utf8')); C.rows.forEach(r => { if (!r.thumb && T[r.id]) r.thumb = T[r.id]; }); } catch (e) { console.log('no thumbnails beside ' + RESCAN + ': the page is drawn without them'); }
} else {
  /* the commit the census ran on, read before it starts (a commit made while it runs is not what
     it measured), and whether the tree had changes no commit holds */
  let commit = '', branch = '';
  try { commit = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT }).toString().trim();
    if (execSync('git status --porcelain --untracked-files=no', { cwd: ROOT }).toString().trim()) commit += ' with uncommitted changes'; } catch (e) { }
  const t0 = Date.now();
  const got = await census();
  C = { made: new Date().toISOString(), commit, branch, base: BASE, visitor: VISITOR, required: REQUIRED, minutes: +((Date.now() - t0) / 60000).toFixed(1), notes: got.notes, rawSources: got.sources, rows: got.rows };
}
finish(C);
report(C);
mkdirSync(dirname(HTML_OUT), { recursive: true }); mkdirSync(dirname(JSON_OUT), { recursive: true });
writeFileSync(HTML_OUT, page(C));
const slim = { ...C, rows: C.rows.map(({ thumb, ...r }) => r) };
writeFileSync(JSON_OUT, JSON.stringify(slim, null, 1));
writeFileSync(thumbsOf(JSON_OUT), JSON.stringify(Object.fromEntries(C.rows.filter(r => r.thumb).map(r => [r.id, r.thumb]))));
console.log(`\nwrote ${JSON_OUT} and ${HTML_OUT}${C.minutes ? ` (${C.minutes} minutes)` : ''}`);
if (GATE) {
  const bad = C.rows.filter(r => r.gateWhy.length);
  console.log(`\ngate: ${bad.length} of ${C.rows.length} offered ads fail (${Object.values(C.summary).map(s => s.name + ' ' + s.gateFail + ' of ' + s.ads).join(', ')})`);
  for (const s of Object.values(C.summary)) console.log(`  ${s.name}: off the house engine ${s.offEngine}, off the house pairs ${s.offColours}, a banned phrase ${s.withBanned}, a required element missing ${s.lacking}${s.errors ? ', did not open ' + s.errors : ''}`);
  process.exit(bad.length ? 1 : 0);
}
process.exit(0);
