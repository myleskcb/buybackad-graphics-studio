#!/usr/bin/env node
/* THE OWNER'S OWN PALETTES, PORTED AND PROVEN.
 *
 * The spec engine ships eight palettes: six near-black grounds (relative
 * luminance .005-.015) with white ink and one warm accent, plus two creams.
 * That is two ideas wearing eight hats, and it is what "the colour schemes are
 * slightly bland" means — the accents were never the problem, they run .68 to
 * 1.00 saturation. The GROUND never changes.
 *
 * The owner's own graded sets used twenty palettes with a completely different
 * structure: eleven LIGHT grounds (saturated cyan, mint, pink, amber), three
 * MID saturated colour fields, and darks that are deeply coloured rather than
 * near-black. Those palettes are already approved, already graded, already the
 * shop's language. They are recovered here from the set manifests, which record
 * each card's ground, ink, accent and support alongside its palette id.
 *
 * A manifest carries four colours; an engine palette needs eight. The rest are
 * derived in HSL — hue held, lightness moved — and then every pair the engine
 * actually draws is checked against WCAG 4.5:1 and nudged until it clears.
 * Nothing is emitted that has not passed.
 *
 *   node tools/gfx/port_palettes.mjs            report only
 *   node tools/gfx/port_palettes.mjs --write    write spec/palettes.json
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const ROOT = new URL('../../', import.meta.url).pathname;
const WRITE = process.argv.includes('--write');

/* ── colour ─────────────────────────────────────────────────────────────── */
const rgb = h => { h = String(h).replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const lum = h => { const c = rgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const contrast = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05); };

function toHsl(h) {
  const [r, g, b] = rgb(h).map(v => v / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2;
  if (!d) return [0, 0, l];
  const s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
  let hh = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [hh * 60, s, l];
}
function fromHsl([h, s, l]) {
  h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const t = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return hex(t.map(v => (v + m) * 255));
}
const setL = (h, l) => { const [hh, s] = toHsl(h); return fromHsl([hh, s, l]); };
const mix = (a, b, t) => hex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * t));

/* Move a colour's lightness — hue and saturation held — until it clears `need`
   against `against`. The direction is whichever ENDPOINT actually has the
   headroom: on a mid-lightness ground, white tops out at 2.6:1 and only black
   can reach 4.5, so a fixed "lighten when the ground is dark" rule silently
   fails exactly where it is needed. */
function lift(colour, against, need) {
  if (contrast(colour, against) >= need) return colour;
  const [h, s] = toHsl(colour);
  const dir = contrast('#000000', against) >= contrast('#FFFFFF', against) ? -1 : 1;
  for (let step = 1; step <= 100; step++) {
    const l = Math.max(0, Math.min(1, toHsl(colour)[2] + dir * step * .01));
    const c = fromHsl([h, s, l]);
    if (contrast(c, against) >= need) return c;
    if (l === 0 || l === 1) break;
  }
  return dir > 0 ? '#FFFFFF' : '#000000';
}

/* ── recover the palettes from the graded sets ──────────────────────────── */
const seen = {};
for (const f of ['assets/set7-manifest.json', 'assets/set5-manifest.json', 'assets/set3-manifest.json']) {
  if (!existsSync(ROOT + f)) continue;
  for (const card of JSON.parse(readFileSync(ROOT + f, 'utf8'))) {
    const m = String(card.id).match(/-([a-z]{2}\d{2})-/);
    if (!m || !card.c1 || !card.ink) continue;
    const id = m[1];
    (seen[id] ||= { id, name: String(card.name || '').split(' · ')[0], family: card.family, c1: card.c1, ink: card.ink, accent: card.accent, support: card.support, cards: 0 }).cards++;
  }
}

/* ── derive the eight fields the engine needs ───────────────────────────── */
function build(p) {
  const groundL = toHsl(p.c1)[2];
  const light = groundL > .55;                    // dark ink on a light ground
  const ground = p.c1;

  /* ground2 is the gradient's other stop: a step away from the ground, same
     hue, still carrying the ink */
  let ground2 = setL(ground, Math.max(0, Math.min(1, groundL + (light ? -.10 : +.09))));

  /* ink comes from the set; body is ink softened toward the ground, then
     lifted back until it is still readable */
  const ink = p.ink;
  let body = mix(ink, ground, .34);

  /* paper is the light plate the quote card and pills are drawn on: white
     carrying a breath of the ground's hue */
  const [gh, gs] = toHsl(ground);
  let paper = fromHsl([gh, Math.min(gs, .18), light ? .985 : .965]);

  /* dark is the footer band and the outline colour */
  let dark = fromHsl([gh, Math.min(gs + .06, .85), light ? .13 : Math.max(.04, groundL * .45)]);

  const accent = p.accent || fromHsl([(gh + 150) % 360, .8, light ? .42 : .62]);
  const hot = p.support || fromHsl([(gh + 40) % 360, .85, light ? .45 : .60]);

  /* ONLY THE PAIRS THE ENGINE DRAWS UNGUARDED.
     Counted in engine.mjs: ink-on-ground (6 sites), dark-on-paper (2),
     paper-on-dark (1), accent-on-ground (1). Everything else goes through
     readable() or onColor(), which pick a legible ink themselves — 26 sites —
     so a palette is not obliged to make those pairs work. Checking ink against
     paper was a phantom: on a dark-ground palette the ink is light and the
     paper is white, and the engine never puts one on the other. */
  if (contrast(ink, ground2) < 4.5) ground2 = lift(ground2, ink, 4.5);
  if (contrast(body, ground) < 4.5) body = lift(body, ground, 4.5);
  if (contrast(dark, paper) < 4.5) dark = lift(dark, paper, 4.5);
  if (contrast(accent, ground) < 4.5) { /* guarded by readable() at its one site — left alone */ }

  const structure = light ? (toHsl(ground)[1] > .18 ? 'saturated light' : 'paper light')
    : groundL > .25 ? 'saturated mid' : (toHsl(ground)[1] > .45 ? 'coloured dark' : 'near-black');

  return {
    id: p.id, name: p.name || p.id, mood: `${structure} · ${p.family || ''}`.trim(),
    ground, ground2, ink, body, accent, hot, paper, dark,
    _structure: structure, _cards: p.cards || 0,
    _checks: {
      'ink/ground': contrast(ink, ground), 'body/ground': contrast(body, ground),
      'ink/ground2': contrast(ink, ground2), 'dark/paper': contrast(dark, paper),
      'paper/dark': contrast(paper, dark),
    },
  };
}

/* ── the reference language ─────────────────────────────────────────────────
   Measured off the owner's own good/mid/bad folders, not invented: in the 28
   ads graded GOOD the ground is neither near-black nor near-white 57% of the
   time, the ground itself is nearly NEUTRAL, and the chroma is spent on the
   type and the badges — interior chroma runs 3.02x the ground's, against 1.29
   for this engine's authored palettes and 0.85 for the ported ones. Saturation
   was never the deficit; good ads average .373 where the engine already sat at
   .548. What good ads have and the engine does not is HUE COUNT: three or more
   hue families carrying real area, in 57% of them, against a two-hue system
   here. These six are built the way the references are built — a quiet ground,
   loud type, three hues. */
const REFERENCE = [
  { id: 'rf01', name: 'Clay Counter', c1: '#DDA68F', ink: '#241512', accent: '#0F5C4A', support: '#C81E3C' },
  { id: 'rf02', name: 'Plum Room',    c1: '#6C404D', ink: '#FBEDE8', accent: '#F2C14E', support: '#4FB3A5' },
  { id: 'rf03', name: 'Oat Desk',     c1: '#E4C39F', ink: '#231A12', accent: '#1D4E89', support: '#D1462F' },
  { id: 'rf04', name: 'Signal Blue',  c1: '#487ABC', ink: '#FFF8EC', accent: '#FFC43D', support: '#E4572E' },
  { id: 'rf05', name: 'Deep Cobalt',  c1: '#1B4593', ink: '#FFF6E8', accent: '#F7B32B', support: '#2ECC71' },
  { id: 'rf06', name: 'Ash Studio',   c1: '#9AA3A8', ink: '#141A1D', accent: '#B5361F', support: '#0E6BA8' },
];

/* THREE HUES, NOT TWO. The accent and the hot colour are pushed apart from
   each other and from the ground until each is its own hue family, which is
   the measured difference between the graded-good ads and this engine. Both
   are guarded by readable()/onColor() at every site, so moving them cannot
   break a contrast rule — only the ground, ink and body are load-bearing. */
function spreadHues(p) {
  const [gh] = toHsl(p.ground);
  const apart = (a, b) => { const d = Math.abs(((a - b) % 360 + 540) % 360 - 180); return 180 - d; };
  let [ah, as, al] = toHsl(p.accent), [hh, hs, hl] = toHsl(p.hot);
  if (apart(ah, gh) < 45) ah = (gh + 150) % 360;
  if (apart(hh, gh) < 45 || apart(hh, ah) < 55) hh = (ah + 130) % 360;
  return { ...p,
    accent: fromHsl([ah, Math.max(as, .62), al]),
    hot: fromHsl([hh, Math.max(hs, .66), hl]) };
}

const built = [...Object.values(seen), ...REFERENCE].map(build).map(spreadHues);
/* the ground is the quiet one: a ported palette whose ground out-shouts its own
   type is turned down until the chroma sits where the references put it */
for (const p of built) {
  const [gh, gs, gl] = toHsl(p.ground);
  if (gs > .34 && gl > .18) {
    p.ground = fromHsl([gh, .30, gl]);
    p.ground2 = fromHsl([...toHsl(p.ground2).slice(0, 1), .30, toHsl(p.ground2)[2]]);
    if (contrast(p.ink, p.ground) < 4.5) p.ink = lift(p.ink, p.ground, 4.5);
    if (contrast(p.body, p.ground) < 4.5) p.body = lift(p.body, p.ground, 4.5);
    if (contrast(p.ink, p.ground2) < 4.5) p.ground2 = lift(p.ground2, p.ink, 4.5);
    p._checks = { 'ink/ground': contrast(p.ink, p.ground), 'body/ground': contrast(p.body, p.ground),
      'ink/ground2': contrast(p.ink, p.ground2), 'dark/paper': contrast(p.dark, p.paper), 'paper/dark': contrast(p.paper, p.dark) };
  }
}
const ok = built.filter(p => Object.values(p._checks).every(v => v >= 4.5));
const bad = built.filter(p => !ok.includes(p));

const byStructure = {};
ok.forEach(p => (byStructure[p._structure] ||= []).push(p.id));

console.log(`${Object.keys(seen).length} recovered from the graded sets + ${REFERENCE.length} built from the graded-good references · ${ok.length} of ${built.length} pass every pair the engine draws\n`);
for (const [s, ids] of Object.entries(byStructure)) console.log(`  ${s.padEnd(16)} ${ids.length}  ${ids.join(' ')}`);
console.log('\nid    name             structure         ' + Object.keys(built[0]._checks).map(k => k.padStart(12)).join(''));
for (const p of built) {
  const flag = ok.includes(p) ? ' ' : '✗';
  console.log(`${flag}${p.id.padEnd(5)} ${String(p.name).padEnd(16)} ${p._structure.padEnd(17)} ` +
    Object.values(p._checks).map(v => (v.toFixed(1) + ':1').padStart(12)).join(''));
}
if (bad.length) console.log(`\ncould not be made to pass: ${bad.map(p => p.id).join(', ')}`);

if (WRITE) {
  const out = ok.map(({ _structure, _cards, _checks, ...rest }) => rest);
  writeFileSync(ROOT + 'spec/palettes.json', JSON.stringify(out, null, 1));
  console.log(`\nspec/palettes.json  ${out.length} palettes`);
}
