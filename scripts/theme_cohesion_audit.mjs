#!/usr/bin/env node
/* ONE COLOUR VOCABULARY (DESIGN-LAW rule 123): do every theme the product
 * offers, and every place that names one, agree, and does each theme keep
 * every rule a palette is held to?
 *
 * The owner, 2026-10-05: "Audit all themes after we make our master library
 * make sure they follow all rules, don't contradict overlap or use wrong
 * design language. make it cohesive and complete so they feel like ads we
 * made from professional gfx designers." Measured before this audit existed:
 * the library's 311 cards were drawn in twelve proven pairings (rule 103),
 * Easy Mode and the designer offered 21 themes of their own under names rule
 * 103 had retired, cvd_audit.py graded a third list that matched nothing,
 * and the choice holds were keyed by the old names.
 *
 * What it reads, with no browser:
 *   COLOR_THEMES          app.js: the themes Easy Mode and the designer offer
 *   PALETTES              scripts/refresh_palettes.mjs: the library's pairings
 *   CB_READY              colour-builder.js: the builder's ready-made sets
 *   assets/showcase/index.json      the theme each live library card is drawn in
 *   assets/choice-holds.json        the theme names the holds are keyed by
 *   motion/catalog.js, motion/themes.js, offer-library.js
 *                         the video maker's palettes and the offer family's
 *                         looks: reported, and failed only with --strict
 *
 * What it checks on each house theme (every line fails the run):
 *   name      "Colour & Colour", both plain colour words, no food or drink, no
 *             internal words; `family` a customer's word (Dark, Light)
 *   roles     ground (two stops), ink, accent and support all present (rule 51)
 *   families  two hue families at most: accent, support and a coloured
 *             ground within 30 degrees of each other count as one (rules 95, 103)
 *   muddy     no warm accent or support under rule 103's muddy floor
 *   band      the accent inside the luminance band where it reads as its name
 *   chroma    accent and support at rule 103's chroma floor, where the gamut allows
 *   gradient  the two ground stops within 30 degrees (rule 5)
 *   contrast  ink >= 4.5:1 and support >= 4.5:1 on both stops for normal,
 *             protan, deutan and tritan sight; accent >= 4.5:1 normal and
 *             >= 3:1 simulated; accent against ink >= 1.7:1; the number on
 *             an accent box >= 3:1 (rules 43, 51, 87, 112)
 *   vocabulary  the same twelve names in COLOR_THEMES, PALETTES, CB_READY and
 *             on the live cards; every choice-hold theme key is a live name;
 *             every retired name is under exactly one theme's `aka`, and no
 *             aka is a live name
 *
 * usage:  node scripts/theme_cohesion_audit.mjs [--strict] [--json out.json]
 * Exits 1 on any failure. */
import { readFileSync, writeFileSync } from 'node:fs';
import { PALETTES, muddy, namedBand, parse, toOklch, atLuminance, lumOf } from './refresh_palettes.mjs';

const argv = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const STRICT = process.argv.includes('--strict');
const R = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const lit = (src, start, end, label) => {
  const i = src.indexOf(start); if (i < 0) throw new Error('could not find ' + label);
  const j = src.indexOf(end, i); if (j < 0) throw new Error('could not close ' + label);
  return src.slice(i + start.indexOf('[') + (start.includes('[') ? 0 : start.indexOf('{')), j + end.length).replace(/;\s*$/, '');
};
/* ── the sets ─────────────────────────────────────────────────────────── */
const app = R('app.js');
const THEMES = (0, eval)('(' + lit(app, 'const COLOR_THEMES = [', '\n];', 'COLOR_THEMES') + ')');
const cb = R('colour-builder.js');
const CB_READY = (0, eval)('(' + lit(cb, 'const CB_READY = {', '};', 'CB_READY') + ')');
const RETIRED = ['Blue Market', 'Blue Ticket', 'Mint Market', 'Orchid Payday', 'Indigo Cash', 'Indigo Trade', 'Blue Deal', 'Sky Market', 'Violet Payday',
  'Gold Offer', 'Mint Counter', 'Red Cash', 'Cash Green', 'Night Blue', 'Deep Red', 'Electric Cyan', 'Clean Slate', 'Hot Sale', 'Electric Trust', 'Fresh Cash', 'Night Neon'];
const index = JSON.parse(R('assets/showcase/index.json'));
const live = c => !!c && !c.defect && c.imagery !== 'none' && !(typeof c.chroma === 'number' && c.chroma < 0.05);   // scIsLive
const liveCards = index.filter(live);
const holds = JSON.parse(R('assets/choice-holds.json'));

/* ── colour maths of the audit's own (theme_law.mjs's) ─────────────────── */
const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const rgb = hex => { const n = parseInt(String(hex).replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lum = hex => { const [r, g, b] = rgb(hex); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
const cr = (a, b) => { const A = lum(a), B = lum(b); return (Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05); };
function simulate(hex, kind){
  let [r, g, b] = rgb(hex).map(lin);
  let L = 0.31399022 * r + 0.63951294 * g + 0.04649755 * b;
  let M = 0.15537241 * r + 0.75789446 * g + 0.08670142 * b;
  let S = 0.01775239 * r + 0.10944209 * g + 0.87256922 * b;
  if (kind === 'protan') L = 1.05118294 * M - 0.05116099 * S;
  if (kind === 'deutan') M = 0.9513092 * L + 0.04866992 * S;
  if (kind === 'tritan') S = -0.86744736 * L + 1.86727089 * M;
  const Rr = 5.47221206 * L - 4.6419601 * M + 0.16963708 * S, G = -1.1252419 * L + 2.29317094 * M - 0.1678952 * S, B = 0.02980165 * L - 0.19318073 * M + 1.16364789 * S;
  const un = c => { c = Math.max(0, Math.min(1, c)); return Math.round(255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055)); };
  return '#' + [un(Rr), un(G), un(B)].map(v => v.toString(16).padStart(2, '0')).join('');
}
const CVD = ['protan', 'deutan', 'tritan'];
const worst = (fg, grounds, kinds) => Math.min(...kinds.flatMap(k => grounds.map(g => k === 'normal' ? cr(fg, g) : cr(simulate(fg, k), simulate(g, k)))));
const ok = hex => toOklch(parse(hex));
const gap = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
const isHex = v => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
const floorC = (h, Y) => { const most = toOklch(atLuminance(h, 0.4, Y)).C; return Math.max(0.06, Math.min(h >= 35 && h < 140 ? 0.13 : 0.12, most - 0.02)) - 0.005; };
const families = hexes => { const f = []; hexes.map(ok).filter(o => o.C >= 0.05).forEach(o => { if (!f.some(h => gap(h, o.H) <= 30)) f.push(o.H); }); return f; };
const plateInk = t => { const g = ok(t.bg.c1), deep = atLuminance(g.C < 0.03 ? 258 : g.H, 0.05, 0.012); const d = '#' + [deep.r, deep.g, deep.b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  return [t.ink, d, '#ffffff'].sort((p, q) => cr(q, t.accent) - cr(p, t.accent))[0]; };

/* ── the words ────────────────────────────────────────────────────────── */
const COLOUR_WORDS = new Set(['navy', 'blue', 'cyan', 'teal', 'green', 'lime', 'gold', 'yellow', 'orange', 'red', 'pink', 'purple', 'black', 'white', 'silver', 'midnight']);
const FOOD = /\b(butter|cherry|cherries|lemon|lemonade|mango|peach|apricot|matcha|espresso|mocha|coffee|latte|bubblegum|candy|taco|donut|cream|chocolate|choc|berry|plum|olive|pistachio|honey|caramel|toffee|cocoa|wine|grape|soda|citrus|mint|sage|salmon|orchid|lilac|rose|blush|sand|bone|mustard|ketchup|vanilla|cinnamon|pepper|avocado|banana)\b/i;
const LOOKS = new Set(['Dark', 'Light', 'Yours']);

/* ── the house themes ─────────────────────────────────────────────────── */
const problems = [], notes = [];
const P = (where, what) => problems.push({ where, what });
const names = THEMES.map(t => t.name);
if (new Set(names).size !== names.length) P('COLOR_THEMES', 'two themes share a name');
THEMES.forEach(t => {
  const w = t.name;
  const m = /^([A-Z][a-z]+) & ([A-Z][a-z]+)$/.exec(w);
  if (!m) P(w, 'the name is not "Colour & Colour"');
  else m.slice(1).forEach(c => { if (!COLOUR_WORDS.has(c.toLowerCase())) P(w, `"${c}" is not a plain colour word`); });
  if (FOOD.test(w)) P(w, 'the name is a food, drink or flower');
  if (!LOOKS.has(t.family)) P(w, `family "${t.family}" is not a customer's word (Dark, Light)`);
  if (t.intent) P(w, 'carries an internal "intent"');
  for (const [k, v] of [['ground stop 1', t.bg && t.bg.c1], ['ground stop 2', t.bg && t.bg.c2], ['accent', t.accent], ['ink', t.ink], ['support', t.support]]) if (!isHex(v)) P(w, `${k} is not a hex colour (${v})`);
  if (!isHex(t.accent) || !isHex(t.ink) || !isHex(t.support) || !t.bg || !isHex(t.bg.c1) || !isHex(t.bg.c2)) return;
  const g = [t.bg.c1, t.bg.c2];
  const fams = families([t.accent, t.support, t.bg.c1]);
  if (fams.length > 2) P(w, `three colour families (${fams.map(h => Math.round(h)).join(', ')} degrees)`);
  const A = ok(t.accent), S = ok(t.support), g1 = ok(t.bg.c1), g2 = ok(t.bg.c2);
  if (muddy(A.H, lum(t.accent))) P(w, `the accent ${t.accent} is drawn under its muddy floor`);
  if (S.C >= 0.05 && muddy(S.H, lum(t.support))) P(w, `the support ${t.support} is drawn under its muddy floor`);
  const band = namedBand(A.H), Ya = lum(t.accent);
  if (Ya < band[0] - 1e-4 || Ya > band[1] + 1e-4) P(w, `the accent is outside the band where it reads as its name (Y ${Ya.toFixed(3)}, band ${band.join('–')})`);
  if (A.C < floorC(A.H, Ya)) P(w, `the accent is dull (C ${A.C.toFixed(3)})`);
  if (S.C < floorC(S.H, lum(t.support))) P(w, `the support is dull (C ${S.C.toFixed(3)})`);
  if (g1.C >= 0.05 && g2.C >= 0.05 && gap(g1.H, g2.H) > 30) P(w, `the ground's two stops travel between hues (${Math.round(g1.H)} to ${Math.round(g2.H)})`);
  const ink = worst(t.ink, g, ['normal', ...CVD]), acc = worst(t.accent, g, ['normal']), accCvd = worst(t.accent, g, CVD);
  const vs = cr(t.accent, t.ink), sup = worst(t.support, g, ['normal', ...CVD]), num = cr(plateInk(t), t.accent);
  if (ink < 4.5) P(w, `ink ${ink.toFixed(2)}:1`);
  if (acc < 4.5) P(w, `accent ${acc.toFixed(2)}:1`);
  if (accCvd < 3) P(w, `accent ${accCvd.toFixed(2)}:1 for a colour-blind reader`);
  if (vs < 1.7) P(w, `accent against ink ${vs.toFixed(2)}:1`);
  if (sup < 4.5) P(w, `support ${sup.toFixed(2)}:1`);
  if (num < 3) P(w, `the number on an accent box ${num.toFixed(2)}:1`);
  t._m = { ink, acc, accCvd, vs, sup, num, fams: fams.length };
});

/* ── one vocabulary ───────────────────────────────────────────────────── */
const same = (a, b) => a.length === b.length && a.every(x => b.includes(x));
const palNames = PALETTES.map(p => p.name), readyNames = Object.values(CB_READY), cardNames = [...new Set(liveCards.map(c => c.theme))];
if (!same(names, palNames)) P('vocabulary', `Easy Mode's themes and the library's palettes differ: only in themes ${JSON.stringify(names.filter(n => !palNames.includes(n)))}, only in palettes ${JSON.stringify(palNames.filter(n => !names.includes(n)))}`);
if (!same(names, readyNames)) P('vocabulary', `the builder's ready-made sets differ from the themes: ${JSON.stringify(readyNames.filter(n => !names.includes(n)).concat(names.filter(n => !readyNames.includes(n))))}`);
const strayCards = cardNames.filter(n => !names.includes(n));
if (strayCards.length) P('vocabulary', `live library cards drawn in a palette no theme has: ${JSON.stringify(strayCards)}`);
const missingOnCards = names.filter(n => !cardNames.includes(n));
if (missingOnCards.length) notes.push(`no live library card is drawn in ${missingOnCards.join(', ')}`);
const holdKeys = [...new Set(Object.values(holds.themes || {}).flatMap(o => Object.keys(o)))];
const staleHolds = holdKeys.filter(k => !names.includes(k));
if (staleHolds.length) P('choice holds', `assets/choice-holds.json holds themes by names the studio no longer offers (${staleHolds.length}: ${staleHolds.slice(0, 5).join(', ')}${staleHolds.length > 5 ? ', …' : ''}); re-sweep with every_card_audit.mjs --dims themes --write-holds`);
const akaOf = {}; THEMES.forEach(t => (t.aka || []).forEach(n => (akaOf[n] = akaOf[n] || []).push(t.name)));
RETIRED.forEach(n => { if (!akaOf[n]) P('aka', `retired theme "${n}" is under no theme's aka: a draft saved in it would open in the card's own colours`); else if (akaOf[n].length > 1) P('aka', `retired theme "${n}" is under ${akaOf[n].length} themes`); });
Object.keys(akaOf).forEach(n => { if (names.includes(n)) P('aka', `"${n}" is both a live name and an aka`); });

/* ── the video maker and the offer family: reported ───────────────────── */
const other = [];
function palRows(src, label){
  const m = new RegExp('export const ' + label + '\\s*=\\s*\\{([\\s\\S]*?)\\n\\};').exec(src);
  if (!m) return [];
  return [...m[1].matchAll(/^\s*"?([a-z_\-0-9]+)"?\s*:\s*P\(([^)]*)\)/gm)].map(x => { const v = x[2].split(',').map(s => s.trim().replace(/"/g, '')); return { key: x[1], ground: v[0], light: v[1], ink: v[2], accent: v[3], plate: v[4] }; });
}
const motion = palRows(R('motion/catalog.js'), 'PALETTES').concat(palRows(R('motion/themes.js'), 'THEME_PALETTES'));
const offerSrc = R('offer-library.js');
const offer = [...offerSrc.slice(offerSrc.indexOf('const LOOKS = {'), offerSrc.indexOf('\n  };', offerSrc.indexOf('const LOOKS = {'))).matchAll(/^\s*([a-z]+):\s*\{([^}]*)\}/gm)]
  .map(x => { const o = {}; x[2].replace(/(\w+):'(#[0-9a-f]{6})'/g, (_, k, v) => { o[k] = v; }); return { key: x[1], ground: o.g1, light: o.g2, ink: o.ink, accent: o.acc, plate: o.band }; });
function report(rows, label){
  const food = rows.filter(r => FOOD.test(r.key.replace(/[_-]/g, ' ')));
  const twoColours = rows.filter(r => /^[a-z]+[_-][a-z]+$/.test(r.key) && r.key.split(/[_-]/).every(w => COLOUR_WORDS.has(w)));
  /* a colour drawn as a colour (C 0.08 and up): a near-black ink with a breath of green is rule 103's green-black, not an olive */
  const mud = rows.filter(r => [r.accent, r.plate].some(h => isHex(h) && ok(h).C >= 0.08 && muddy(ok(h).H, lum(h))));
  const third = rows.filter(r => families([r.ground, r.accent, r.plate].filter(isHex)).length > 2);
  const low = rows.filter(r => isHex(r.ink) && isHex(r.ground) && isHex(r.light) && Math.min(cr(r.ink, r.ground), cr(r.ink, r.light)) < 3);
  other.push({ label, n: rows.length, food: food.map(r => r.key), twoColours: twoColours.length, muddy: mud.map(r => r.key), third: third.map(r => r.key), inkUnder3: low.map(r => r.key) });
  if (STRICT){ food.forEach(r => P(label + ' ' + r.key, 'named after a food, drink or flower')); mud.forEach(r => P(label + ' ' + r.key, 'accent or plate under the muddy floor')); third.forEach(r => P(label + ' ' + r.key, 'three colour families')); }
}
report(motion, 'video maker palettes (motion/)');
report(offer, 'offer family looks (offer-library.js)');

/* ── the report ───────────────────────────────────────────────────────── */
console.log(`\nHouse themes (COLOR_THEMES): ${THEMES.length} · library palettes: ${palNames.length} · builder ready-made: ${readyNames.length} · live cards: ${liveCards.length} in ${cardNames.length} palettes`);
console.log('  theme            look   families  ink   accent  cvd   vs ink  support  number');
THEMES.forEach(t => { const m = t._m; if (!m) return console.log('  ' + t.name.padEnd(16) + ' (not measured)');
  const f = v => v.toFixed(2).padStart(6);
  console.log(`  ${t.name.padEnd(16)} ${String(t.family).padEnd(6)} ${String(m.fams).padStart(4)}    ${f(m.ink)} ${f(m.acc)} ${f(m.accCvd)} ${f(m.vs)}  ${f(m.sup)}  ${f(m.num)}`); });
other.forEach(o => console.log(`\n${o.label}: ${o.n} · named for two colours ${o.twoColours} · food, drink or flower names ${o.food.length}${o.food.length ? ' (' + o.food.slice(0, 8).join(', ') + (o.food.length > 8 ? ', …' : '') + ')' : ''}` +
  ` · accent or plate under the muddy floor ${o.muddy.length}${o.muddy.length ? ' (' + o.muddy.slice(0, 8).join(', ') + (o.muddy.length > 8 ? ', …' : '') + ')' : ''} · three families ${o.third.length} · ink under 3:1 on its ground ${o.inkUnder3.length}` + (STRICT ? '' : '   [reported; --strict fails on them]')));
notes.forEach(n => console.log('  note: ' + n));
console.log(`\n${problems.length ? problems.length + ' problems' : 'no problems'}`);
problems.forEach(p => console.log('  ' + p.where + ': ' + p.what));
if (argv('--json')) writeFileSync(argv('--json'), JSON.stringify({ themes: THEMES.map(t => ({ name: t.name, family: t.family, aka: t.aka || [], m: t._m })), other, problems, notes }, null, 1));
process.exit(problems.length ? 1 : 0);
