#!/usr/bin/env node
/* WHAT THE FULL AD STANDS ON: motion/full-grounds.js, from spec/full-grounds.json.

   The owner, 2026-11-18: "how come none of the videos use a BG?", "also only have 1 BG style?!".
   The full ad (motion/fullad.js) drew three gradients of its pair's own colours and nothing else.
   It now draws, by the seed, a photograph from its category's pool, one of the engine's drawn
   scenes, or the house gradient, in the shares the table sets (spec/full-grounds.json, dated).

   This writes the site's copy of that table (the site cannot read spec/), with each pooled
   photograph's measured brightness and colour, which fullad.js uses to keep a card to two colour
   families (rule 139): a photograph whose own colour is strong is drawn only beside a pair of its
   family.

   usage:  node scripts/build_full_grounds.mjs                 # rewrite motion/full-grounds.js
           GFX_BASE=http://127.0.0.1:8931/ node scripts/build_full_grounds.mjs --measure
                                                               # read each photograph into the table first
           node scripts/build_full_grounds.mjs --check         # exit 1 if stale, or a pooled photograph is
                                                               # missing, unmeasured, dark or uncredited */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const ROOT = new URL('../', import.meta.url).pathname, SRC = ROOT + 'spec/full-grounds.json', OUT = ROOT + 'motion/full-grounds.js';
const spec = JSON.parse(readFileSync(SRC, 'utf8'));
const subjects = JSON.parse(readFileSync(ROOT + 'motion/subjects.json', 'utf8')).subjects;
const pooled = [...new Set(Object.values(spec.pools).flat())];
/* the cards' own photographs (motion/recipes.json, the rebuild of 2026-11-18): a rebuilt recipe may stand
   on the photograph its card stood on, where that fits the product its seed drew and is not dim (the
   owner: "not low exposure dark images..."); measured here as the pools are, and marked dim where under
   the limits (fullad.js groundFor passes over a dim one), never pooled for other ads */
const RECIPES = existsSync(ROOT + 'motion/recipes.json') ? JSON.parse(readFileSync(ROOT + 'motion/recipes.json', 'utf8')).recipes || [] : [];
const carded = [...new Set(RECIPES.filter(r => r.ground_photo && r.ground_photo.src).map(r => r.ground_photo.src))].filter(f => !pooled.includes(f)).sort();

if (process.argv.includes('--measure')) {
  const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8931/').replace(/\/?$/, '/');
  const require = createRequire(import.meta.url), { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const b = await chromium.launch(), p = await b.newPage();
  await p.goto(BASE + '404.html');
  const got = await p.evaluate(async ({ files, base }) => {
    const lin = v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
    const oklch = (r, g, b) => {
      const R = lin(r), G = lin(g), B = lin(b);
      const l = Math.cbrt(.4122214708 * R + .5363325363 * G + .0514459929 * B), m = Math.cbrt(.2119034982 * R + .6806995451 * G + .1073969566 * B), s = Math.cbrt(.0883024619 * R + .2817188376 * G + .6299787005 * B);
      const a = 1.9779984951 * l - 2.428592205 * m + .4505937099 * s, bb = .0259040371 * l + .7827717662 * m - .808675766 * s;
      return [Math.hypot(a, bb), (Math.atan2(bb, a) * 180 / Math.PI + 360) % 360];
    };
    const out = {};
    for (const f of files) {
      const img = new Image(); img.src = base + f;
      try { await img.decode(); } catch (e) { out[f] = { error: 'did not load' }; continue; }
      const c = document.createElement('canvas'); c.width = 120; c.height = 80; const g = c.getContext('2d'); g.drawImage(img, 0, 0, 120, 80);
      const d = g.getImageData(0, 0, 120, 80).data, n = d.length / 4;
      let L = 0, dark = 0, sx = 0, sy = 0, sw = 0; const Cs = [];
      for (let i = 0; i < d.length; i += 4) {
        const l = .2126 * lin(d[i]) + .7152 * lin(d[i + 1]) + .0722 * lin(d[i + 2]); L += l; if (l < .03) dark++;
        const [C, h] = oklch(d[i], d[i + 1], d[i + 2]);
        if (C >= .08) { Cs.push(C); sx += Math.cos(h * Math.PI / 180) * C; sy += Math.sin(h * Math.PI / 180) * C; sw += C; }
      }
      Cs.sort((u, v) => u - v);
      const strong = Cs.length / n >= .15;
      out[f] = { w: img.naturalWidth, h: img.naturalHeight, L: +(L / n).toFixed(3), dark: +(dark / n).toFixed(3),
        hue: strong ? Math.round((Math.atan2(sy, sx) * 180 / Math.PI + 360) % 360) : null, C: strong ? +Cs[Cs.length >> 1].toFixed(3) : 0, share: +(Cs.length / n).toFixed(2) };
    }
    return out;
  }, { files: [...pooled, ...carded], base: BASE });
  await b.close();
  for (const [f, m] of Object.entries(got)) spec.photos[f] = { ...(spec.photos[f] || {}), ...m };
  writeFileSync(SRC, JSON.stringify(spec, null, 2) + '\n');
  console.log(`measured ${Object.keys(got).length} photographs into spec/full-grounds.json`);
}

// the line's pool: its category (motion/subjects.json), the iPhone line's 'phones'
const lineCat = Object.fromEntries(subjects.map(s => [s.key, s.cat]));
/* what each photograph shows (spec/ground-tags.json, read by eye: "ideally bg and assets line up",
   2026-11-18): a scene or a photograph of goods, the make and model of a vehicle or a phone, and the
   floor a scene's product stands on; fullad.js draws a photograph only beside a product it shows,
   and frames a scene so its floor is the product's foot */
const TAGSPEC = existsSync(ROOT + 'spec/ground-tags.json') ? JSON.parse(readFileSync(ROOT + 'spec/ground-tags.json', 'utf8')) : {}, TAGS = TAGSPEC.tags || {};
/* the city or landmark a photograph shows, and that place's towns (2026-11-19; the owner, of the Golden Gate under
   a Long Beach ad: "that's SF", "let's use bg images (occasionally) but of the corresponding city.."): fullad.js
   stands an ad on it only where the towns it prints are the place's, and only now and then */
const PLACES = Object.fromEntries(Object.entries(TAGSPEC.places || {}).map(([k, p]) => [k, { towns: (p.towns || []).map(t => String(t).toUpperCase()), states: (p.states || []).map(t => String(t).toUpperCase()) }]));
const TAG_KEYS = ['shows', 'subject', 'make', 'model', 'vehicle', 'floor', 'never', 'cuts', 'place'];
const dim = m => m.L < spec.limits.minL || m.dark > spec.limits.maxDark;
const photos = Object.fromEntries([...pooled, ...carded].filter(f => spec.photos[f] && !spec.photos[f].error).map(f => {
  const m = spec.photos[f], t = TAGS[f] || {}, card = !pooled.includes(f);
  return [f, { focus: m.focus || [.5, .5], L: m.L, hue: m.hue, C: m.C, w: m.w, h: m.h, ...Object.fromEntries(TAG_KEYS.filter(k => t[k] != null && t[k] !== '').map(k => [k, t[k]])), ...(card ? { card: true } : {}), ...(card && dim(m) ? { dim: true } : {}) }];
}));
const untagged = pooled.filter(f => !TAGS[f]);
const text = `/* MADE FROM spec/full-grounds.json BY scripts/build_full_grounds.mjs (version ${spec.version}).
   Never type into it: change the table, then run the script. What the full ad stands on: the shares of
   a seed's draw, the drawn scenes, and each category's photographs with their measured colour. */
export const GROUND_VERSION = ${JSON.stringify(spec.version)};
export const GROUND_SHARES = ${JSON.stringify(spec.shares)};
export const GROUND_HOUSE = ${JSON.stringify(spec.house)};
export const GROUND_SCENES = ${JSON.stringify(spec.scenes)};
export const GROUND_GRADIENTS = ${JSON.stringify(spec.gradients || [])};
export const GROUND_PATTERNS = ${JSON.stringify(spec.patterns || [])};
export const GROUND_POOLS = ${JSON.stringify(spec.pools)};
export const GROUND_LINE_CAT = ${JSON.stringify(lineCat)};
export const GROUND_PHOTOS = ${JSON.stringify(photos)};
export const GROUND_PLACES = ${JSON.stringify(PLACES)};
`;

if (process.argv.includes('--check')) {
  const bad = [];
  const now = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (now !== text) bad.push('motion/full-grounds.js is stale: run node scripts/build_full_grounds.mjs');
  for (const [f, t] of Object.entries(TAGS)) if (t.place && !((PLACES[t.place] || {}).towns || []).length) bad.push(`${f} shows a place (${t.place}) with no towns in spec/ground-tags.json places`);
  for (const [k, p] of Object.entries(PLACES)) if (!p.states.length || p.states.some(x => !/^[A-Z]{2}$/.test(x))) bad.push(`place ${k} needs its states, two letters each ("CA"): a town of the same name in another state is not it`);
  for (const f of untagged) bad.push(`${f} is pooled but not tagged in spec/ground-tags.json (what it shows, its floor)`);
  const credit = {};
  const credited = f => {
    const dir = f.slice(0, f.lastIndexOf('/')), base = f.slice(f.lastIndexOf('/') + 1);
    if (!(dir in credit)) { try { credit[dir] = JSON.parse(readFileSync(ROOT + dir + '/ATTRIBUTION.json', 'utf8')); } catch (e) { credit[dir] = null; } }
    const A = credit[dir]; if (!A) return false;
    return Array.isArray(A) ? A.some(r => r && r.file === base) : !!(A[base] || A[base.replace(/\.[a-z]+$/i, '')]);
  };
  for (const f of carded) { const m = spec.photos[f]; if (!m || (m.L == null && !m.error)) bad.push(`${f}: a card's photograph, not measured (run --measure)`); }
  for (const f of pooled) {
    const m = spec.photos[f];
    if (!existsSync(ROOT + f)) bad.push(`${f}: missing`);
    else if (!m || m.L == null) bad.push(`${f}: not measured (run --measure)`);
    else if (m.L < spec.limits.minL || m.dark > spec.limits.maxDark) bad.push(`${f}: too dark (L ${m.L}, ${Math.round(m.dark * 100)}% near black)`);
    if (!credited(f)) bad.push(`${f}: no credit in its folder's ATTRIBUTION.json`);
  }
  // every gradient and pattern the table names is one the engine paints (motion/decor.js PAIR_GRADIENTS, FULL_PATTERNS)
  const decor = readFileSync(ROOT + 'motion/decor.js', 'utf8'), listed = name => JSON.parse((new RegExp(`export const ${name} = (\\[[^\\]]*\\])`).exec(decor) || [, '[]'])[1].replace(/\s+/g, ' '));
  for (const [k, painter] of [['gradients', 'PAIR_GRADIENTS'], ['patterns', 'FULL_PATTERNS']]) { const known = listed(painter); for (const g of spec[k] || []) if (!known.includes(g)) bad.push(`${k}: ${g} is not one motion/decor.js paints (${painter})`); }
  const noPool = subjects.filter(s => !(s.cat in spec.pools)).map(s => s.key);
  if (noPool.length) bad.push('lines whose category has no pool entry: ' + noPool.join(', '));
  if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
  console.log(`motion/full-grounds.js is current: ${carded.length} cards' own photographs (${carded.filter(f => spec.photos[f] && spec.photos[f].L != null && dim(spec.photos[f])).length} dim), ${pooled.length} photographs in ${Object.keys(spec.pools).length} pools, ${spec.scenes.length} scenes, ${(spec.gradients || []).length} gradients, ${(spec.patterns || []).length} patterns, version ${spec.version}`);
} else {
  writeFileSync(OUT, text);
  console.log(`wrote motion/full-grounds.js: ${Object.keys(photos).length} photographs, ${spec.scenes.length} scenes, shares ${JSON.stringify(spec.shares)}`);
}
