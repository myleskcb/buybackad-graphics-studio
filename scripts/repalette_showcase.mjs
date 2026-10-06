#!/usr/bin/env node
/* REPALETTE — the showcase onto the proven palettes (2026-10-01), in place.
 *
 * Owner, on the 29 palettes of 2026-09-22: "the colors look so strange ...
 * less niche color schemes, and more proven." This moves every record and its
 * index row onto PALETTES (refresh_palettes.mjs) and changes nothing else:
 * geometry, copy, faces, photographs and the gate's shades stay as they are.
 *
 * It works on the WORKING TREE, not on git like refresh_showcase.mjs, because
 * everything after the refresh (number block, naturalize, darken, highlights,
 * panels, the gate) is in the records now and must survive.
 *
 *   colour   every chromatic colour re-hued from its role under the luminance
 *            lock (rule 52), so each contrast the gate measured is unchanged;
 *            neutrals (C < 0.03: the shades, panels, white and black ink) are
 *            not touched
 *   assign   balanced, by category affinity, one palette per layout within a
 *            category (assign(..., { move:false }))
 *   checks   printed, dry run or not: the luminance lock held on every colour,
 *            no mapped colour left muddy, and no index role pair (ink, accent,
 *            support on the ground) worse for a colour-blind reader than it was
 *
 *   node scripts/repalette_showcase.mjs            dry run
 *   node scripts/repalette_showcase.mjs --write    records + index
 *   node scripts/repalette_showcase.mjs --keep --write
 *            the same palettes, re-solved (after a chroma change)
 *
 * Then: rethumb_showcase.mjs, verify_showcase.mjs --write,
 * measure_showcase_color.mjs, bump ASSET_REV in app.js.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { PALETTES, assign, mapper, walkColours, familyOf, muddy, namedBand, parse, lumOf, toOklch } from './refresh_palettes.mjs';
const DIR = new URL('../assets/showcase/', import.meta.url).pathname;
const WRITE = process.argv.includes('--write');
const raw = readFileSync(DIR + 'index.json', 'utf8'), idx = JSON.parse(raw);
const live = c => !c.defect && c.imagery !== 'none' && !(typeof c.chroma === 'number' && c.chroma < 0.05);

/* colour-blind simulation (Brettel/Viénot on linear RGB, as scripts/cvd_audit.py) */
const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const Ylin = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
function sim(c, kind){
  const r = lin(c.r), g = lin(c.g), b = lin(c.b);
  let L = 0.31399022 * r + 0.63951294 * g + 0.04649755 * b, M = 0.15537241 * r + 0.75789446 * g + 0.08670142 * b, S = 0.01775239 * r + 0.10944209 * g + 0.87256922 * b;
  if (kind === 'protan') L = 1.05118294 * M - 0.05116099 * S;
  else if (kind === 'deutan') M = 0.9513092 * L + 0.04866992 * S;
  else if (kind === 'tritan') S = -0.86744736 * L + 1.86727089 * M;
  const cl = v => Math.min(1, Math.max(0, v));
  return [cl(5.47221206 * L - 4.6419601 * M + 0.16963708 * S), cl(-1.1252419 * L + 2.29317094 * M - 0.1678952 * S), cl(0.02980165 * L - 0.19318073 * M + 1.16364789 * S)];
}
const ratio = (a, b) => { const x = Math.max(a, b), y = Math.min(a, b); return (x + 0.05) / (y + 0.05); };
const worstCvd = (s1, s2) => { const a = parse(s1), b = parse(s2); if (!a || !b) return null;
  return Math.min(ratio(lumOf(a), lumOf(b)), ...['protan', 'deutan', 'tritan'].map(k => ratio(Ylin(sim(a, k)), Ylin(sim(b, k))))); };

/* the role pairs a reader depends on, each against the ground: a palette
   that would leave any of them worse than it was AND under 4.5:1 for a
   protan, deutan or tritan reader does not fit the card (rule 43). Red is
   the usual cause: a deuteranope sees a dark red lighter than it is. */
const PAIRS = ['ink', 'accent', 'support'];
function cvdLoss(c, pal){
  const map = mapper(pal, { c1:c.c1, ink:c.ink, accent:c.accent, support:c.support });
  const loss = [];
  for (const r of PAIRS){
    const before = worstCvd(c[r], c.c1), after = worstCvd(map(c[r]), map(c.c1));
    if (before != null && after != null && after < before - 0.25 && after < 4.5) loss.push({ r, before, after });
  }
  return loss;
}
/* and the accent must still read as the colour the name promises. It keeps
   its luminance, so pale accent type cannot be red (it goes salmon), orange
   (peach) or purple (lavender): over the top of its band a palette does not
   fit. Under the bottom a warm accent takes the palette's deep hue, which is
   a clean, proven look (navy type on a white card) except where deep is the
   neutral ground: Black & Gold's gold plate would go charcoal and the card
   would lose its colour. A neutral accent (white, black) is not re-hued and
   fits anything. */
const accentHolds = (c, p) => { const a = parse(c.accent); if (!a || toOklch(a).C < 0.03) return true;
  const [lo, hi] = namedBand(p.a), Y = lumOf(a); return Y <= hi && (Y >= lo || !(p.neutral && p.deep === p.g)); };
const cvdSafe = (c, p) => !cvdLoss(c, p).length;
const KEEP = process.argv.includes('--keep');   // re-solve each card on the palette it already has (e.g. after a chroma change)
const BY = Object.fromEntries(PALETTES.map(p => [p.name, p]));
if (KEEP && idx.some(c => !BY[c.theme])) throw new Error('--keep: a card is on a palette that no longer exists');
const plan = KEEP ? Object.fromEntries(idx.map(c => [c.id, BY[c.theme]]))
                  : assign(idx, { move:false, fits:(c, p) => accentHolds(c, p) && cvdSafe(c, p), soft:cvdSafe });
const use = {}, perCat = {}, fam = {}, liveUse = {};
let colours = 0, lockMax = 0, left = 0, cvdWorse = 0, cvdChecked = 0;
const worse = [];
const out = [];
for (const c of idx){
  const pal = plan[c.id];
  const rec = JSON.parse(readFileSync(DIR + 'tpl/' + c.id + '.json', 'utf8'));
  const map = mapper(pal, { c1:c.c1, ink:c.ink, accent:c.accent, support:c.support });
  /* the lock and the muddy guard, checked on every colour the map touched */
  const seen = new Map();
  const spy = Object.assign((s, f) => { const o = map(s, f); seen.set(s + (f ? '|d' : ''), [s, o]); return o; }, { deepFor:map.deepFor });
  const tpl = walkColours(rec.tpl, spy);
  /* a drawn ground keeps its five colours inside its source string, where
     walkColours does not look (grounds.js src(): ground:kind/c1/c2/accent/
     support/ink/seed); its two ground stops decide the deep hue together */
  if (tpl.bg && /^ground:/.test(tpl.bg.src || '')){
    const [head, ...rest] = tpl.bg.src.split('/'), seed = rest.pop(), hex = rest.map(h => '#' + h);
    const deep = spy.deepFor(hex[0]) || spy.deepFor(hex[1]);
    tpl.bg = Object.assign({}, tpl.bg, { src:[head, ...hex.map((h, i) => spy(h, i < 2 && deep).slice(1)), seed].join('/') });
  }
  const roles = { c1:spy(c.c1), ink:spy(c.ink), accent:spy(c.accent), support:spy(c.support) };
  for (const [s, o] of seen.values()){
    if (s === o) continue;
    const a = parse(s), b = parse(o); colours++;
    const ya = lumOf(a), yb = lumOf(b);
    lockMax = Math.max(lockMax, Math.abs(yb - ya) / (ya + 0.05));   // what a contrast ratio sees
    const k = toOklch(b); if (k.C >= 0.05 && muddy(k.H, yb)){ left++; worse.push(`${c.id} muddy ${s} -> ${o} (${pal.name})`); }
  }
  if (live(c)){ cvdChecked += PAIRS.length;
    cvdLoss(c, pal).forEach(({ r, before, after }) => { cvdWorse++; worse.push(`${c.id} ${r} ${before.toFixed(2)} -> ${after.toFixed(2)} (${pal.name})`); }); }
  const family = familyOf(roles.c1, pal);
  use[pal.name] = (use[pal.name] || 0) + 1;
  if (live(c)) liveUse[pal.name] = (liveUse[pal.name] || 0) + 1;
  (perCat[c.cat] = perCat[c.cat] || {})[pal.name] = (perCat[c.cat][pal.name] || 0) + 1;
  fam[family] = (fam[family] || 0) + 1;
  out.push({ c, rec:Object.assign({}, rec, { tpl }), row:Object.assign({}, roles, { theme:pal.name, family, name:pal.name + c.name.slice(c.theme.length) }) });
}

console.log(`${idx.length} cards · ${PALETTES.length} palettes · ${colours} colours re-hued`);
console.log(`luminance lock: worst drift ${(lockMax * 100).toFixed(3)}% of (Y + 0.05) · muddy colours left ${left}`);
console.log(`colour-blind check on live role pairs: ${cvdChecked} measured, ${cvdWorse} worse by more than 0.25 and under 4.5`);
worse.slice(0, 12).forEach(w => console.log('  ' + w));
console.log('families', JSON.stringify(fam));
PALETTES.forEach(p => console.log('  ' + p.name.padEnd(16) + String(use[p.name] || 0).padStart(4) + ' cards · ' + String(liveUse[p.name] || 0).padStart(3) + ' live'));
console.log('per category:'); Object.keys(perCat).sort().forEach(k => console.log('  ' + k.padEnd(8) + Object.entries(perCat[k]).sort((a, b) => b[1] - a[1]).map(([n, v]) => n + ' ' + v).join(', ')));

if (WRITE){
  for (const { c, rec, row } of out){
    writeFileSync(DIR + 'tpl/' + c.id + '.json', JSON.stringify(rec));
    Object.assign(c, row);
  }
  writeFileSync(DIR + 'index.json', JSON.stringify(idx) + (raw.endsWith('\n') ? '\n' : ''));
  console.log('wrote ' + out.length + ' records and the index');
}
