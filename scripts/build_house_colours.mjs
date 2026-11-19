#!/usr/bin/env node
/* ONE COLOUR VOCABULARY, IN THE VIDEO MAKER TOO: motion/house-colours.js.

   DESIGN-LAW rule 123: the photo ads' colour themes are the full ad's colours (COLOR_THEMES in
   app.js; the Proven pairs rows solved by the colour builder, scripts/house_themes.mjs). The video
   maker kept 172 palettes of its own (OPEN-ITEMS §AO item 1), and the full ad (motion/fullad.js)
   first drew from sixteen of those. So "Navy & Gold" on a photo ad and on a full ad were two
   different navies and two different golds.

   2026-11-18 (rule 146): every group of COLOR_THEMES, not the twelve proven pairs alone. Eleven of
   the twelve are a navy, black or deep ground under a warm accent, and a page of seeded full ads
   read as one look (the owner: "a lot of these are the same thing with 5% variety or difference",
   "still not enough colors"). The full ad now draws the two-colour and three-colour themes and the
   light and neon pairs too: 54 pairs, each with its look (light, vivid or dark: the ground as
   measured in OKLCH), which fullad.js pairsFor balances a seed's draw over.

   This reads the rows out of app.js (the one source: no colour is typed twice) and writes them
   as the video engine's palettes: ground, light, ink, accent, plate, plate_ink, hot.

   From a theme to a palette:
     ground     the theme's darker background stop (on a light theme, its darker stop too)
     light      the lit middle of a ground: the lighter stop lifted toward white (dark themes) by a
                fifth, or by less where a fifth would take the words under 4.5:1 (a vivid ground:
                White on Pink); or the lighter stop itself (light)
     ink        the theme's ink
     accent     the theme's accent; the plate (the number's pill, the chips, the claim) wears it
     plate_ink  whichever of the ground and white reads better on the plate; on a two-colour theme
                the ground's own colour (rule 125: White on Red puts red figures on a white plate)
     hot        the colour of the chips, the chevrons and the pin: the accent (the engine's
                hotColour() takes it as given). The engine's own pick took a stock yellow or pink
                wherever an accent was dark, a third colour on every light pair (rule 139).

   The floors every row passes here, on the colours as written: the words 4.5:1 on the ground and
   on its lit middle (the floor the pre-flight holds every small line to on the delivered picture,
   rule 138; the twelve were held to 7:1 on the ground, a margin only a navy or black ground can
   give, which shut out every vivid ground the owner asked for), the plate's words 4.5:1, the
   accent 3:1 on the ground, and the hot colour .3 off the ground in the engine's gamma luminance.

   Which lines each pair suits (suits): the photo library's own table, AFFINITY in
   scripts/refresh_palettes.mjs (gold wants a warm-yellow colour in the pair, silver and test strips
   a cool or neutral ground, Pokémon never a neutral one): for a row of its PALETTES as written
   there, for any other from its own measured hues. Only the lines that table restricts are listed
   (LINES); every other line takes any pair. fullad.js draws a seeded ad's pair from these, never a
   hand-picked one (rule 139).

   usage:  node scripts/build_house_colours.mjs            # rewrite motion/house-colours.js
           node scripts/build_house_colours.mjs --check    # exit 1 if it is stale */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { PALETTES, AFFINITY } from './refresh_palettes.mjs';

// the lines AFFINITY restricts, by the full ad's subject keys (motion/subjects.json); the rest take anything
const LINES = ['gold', 'silver', 'strips', 'pokemon'];
// the groups the full ad draws, the proven pairs first (their places in the list are the ones they had)
const GROUPS = ['Proven pairs', 'Two colours', 'Three colours', 'Light pairs', 'Neon pairs'];

const ROOT = new URL('../', import.meta.url).pathname, OUT = ROOT + 'motion/house-colours.js';
const src = readFileSync(ROOT + 'app.js', 'utf8');
const at = src.search(/const COLOR_THEMES = \[/), end = src.indexOf('\n];', at);
if (at < 0 || end < 0) { console.error('app.js: COLOR_THEMES not found'); process.exit(2); }
const THEMES = (0, eval)('(' + src.slice(at, end + 3).replace(/^const COLOR_THEMES = /, '').replace(/;\s*$/, '') + ')');
const rows = GROUPS.flatMap(g => THEMES.filter(t => t.group === g));
const proven = rows.filter(t => t.group === 'Proven pairs');
if (proven.length !== 12) { console.error(`expected the twelve Proven pairs in app.js COLOR_THEMES, found ${proven.length}`); process.exit(2); }

const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const hex = a => '#' + a.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
const mix = (a, b, k) => hex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * k));
const lin = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
const L = h => { const [r, g, b] = rgb(h).map(lin); return .2126 * r + .7152 * g + .0722 * b; };
const cr = (a, b) => (Math.max(L(a), L(b)) + .05) / (Math.min(L(a), L(b)) + .05);
const gl = h => { const [r, g, b] = rgb(h); return (.2126 * r + .7152 * g + .0722 * b) / 255; };
const oklch = h => {
  const [r, g, b] = rgb(h).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
  const l = Math.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b), m = Math.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b), s = Math.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b);
  const A = 1.9779984951 * l - 2.428592205 * m + .4505937099 * s, B = .0259040371 * l + .7827717662 * m - .808675766 * s;
  return { L: .2104542553 * l + .793617785 * m - .0040720468 * s, C: Math.hypot(A, B), h: (Math.atan2(B, A) * 180 / Math.PI + 360) % 360 };
};
// the look a pair gives a card, from its ground: a deep one, a light one (pale and quiet), or a vivid one
const lookOf = ground => { const k = oklch(ground); return k.L < .42 ? 'dark' : k.L >= .8 && k.C < .1 ? 'light' : 'vivid'; };
const keyOf = name => name.toLowerCase().replace(/ & |, | /g, '_').replace(/[^a-z_]/g, '').replace(/_+/g, '_');

const seen = new Set();
const colours = rows.map(t => {
  const { name, group, family, accent, ink } = t, two = group === 'Two colours';
  const c1 = t.bg.c1, c2 = t.bg.c2, dark = family === 'Dark', ground = L(c1) < L(c2) ? c1 : c2, lighter = L(c1) < L(c2) ? c2 : c1;
  // the lit middle: a fifth toward white, or as far as keeps the words 4.5:1 on it
  let k = .2; while (dark && k > 0 && cr(ink, mix(lighter, '#ffffff', k)) < 4.5) k = Math.round((k - .02) * 100) / 100;
  const light = dark ? mix(lighter, '#ffffff', Math.max(0, k)) : lighter;
  const plate_ink = two && cr(accent, ground) >= 4.5 ? ground : cr(accent, ground) >= cr(accent, '#ffffff') ? ground : '#ffffff';
  // which lines it suits: the library's own row where it has one, else the pair's own measured hues
  const pal = PALETTES.find(q => q.name === name);
  if (group === 'Proven pairs' && !pal) { console.error(`${name}: not in refresh_palettes.mjs PALETTES, so which lines it suits is unknown`); process.exit(2); }
  const hueOf = h => { const q = oklch(h); return q.C >= .04 ? q.h : null; };
  const support = t.support || null;
  // (a two-colour theme's one colour that is not black or white is its ground: Black on Yellow is a gold card)
  const own = pal || { g: hueOf(ground) ?? -999, a: hueOf(accent) ?? (two ? hueOf(ground) : null) ?? -999, s: support ? hueOf(support) ?? -999 : -999, neutral: oklch(ground).C < .04 };
  const suits = LINES.filter(l => AFFINITY[l](own));
  const key = keyOf(name);
  if (seen.has(key)) { console.error(`${name}: its key ${key} is taken`); process.exit(2); }
  seen.add(key);
  const row = { key, name, group, family, look: lookOf(ground), suits, colors: { ground, light, ink, accent, plate: accent, plate_ink, hot: accent } };
  // what the ad's parts must read at, on the colours as written here
  const need = [['ink on the ground', cr(ink, ground), 4.5], ['ink on the lit ground', cr(ink, light), 4.5], ['the plate\'s words', cr(plate_ink, accent), 4.5], ['the accent on the ground', cr(accent, ground), 3]];
  for (const [what, got, want] of need) if (got < want) { console.error(`${name}: ${what} reads ${got.toFixed(2)}:1, under ${want}:1`); process.exit(1); }
  // the chips, the chevrons and the pin wear the accent: it must stand off the ground as the engine
  // measures loudness (.3 in gamma luminance), or they would be lost on it
  if (!(Math.abs(gl(accent) - gl(ground)) > .3)) { console.error(`${name}: the accent ${accent} stands only ${Math.abs(gl(accent) - gl(ground)).toFixed(2)} off ${ground}; the chips and chevrons would not show`); process.exit(1); }
  return row;
});
const count = k => colours.filter(c => c.look === k).length;

// a module, not a JSON file: fullad.js imports it, and an import of JSON is not in every browser the maker serves
const json = `/* generated by scripts/build_house_colours.mjs; do not edit by hand.
   The photo ads' colour themes (app.js COLOR_THEMES, DESIGN-LAW 123, 146) as the video engine's
   palettes: the twelve proven pairs first, then the two- and three-colour themes and the light and
   neon pairs. look: the card a pair makes (light, vivid or dark). To change a colour, change the
   themes (scripts/house_themes.mjs for the proven pairs) and run the script. */
export const HOUSE_COLOURS = [
${colours.map(c => '  ' + JSON.stringify(c)).join(',\n')},
];
/* The lines whose pairs are restricted (each pair's suits; scripts/refresh_palettes.mjs AFFINITY). */
export const LINES = ${JSON.stringify(LINES)};
/* The looks a seed's draw is balanced over (fullad.js pairsFor): ${count('light')} light, ${count('vivid')} vivid, ${count('dark')} dark. */
export const PAIR_LOOKS = ["light", "vivid", "dark"];
`;
if (process.argv.includes('--check')) {
  if ((existsSync(OUT) ? readFileSync(OUT, 'utf8') : '') !== json) { console.error('motion/house-colours.js is stale: run node scripts/build_house_colours.mjs'); process.exit(1); }
  console.log(`motion/house-colours.js is in step with the studio's ${colours.length} colour themes (${count('light')} light, ${count('vivid')} vivid, ${count('dark')} dark)`);
} else {
  writeFileSync(OUT, json);
  console.log(`wrote motion/house-colours.js: ${colours.length} pairs, ${count('light')} light, ${count('vivid')} vivid, ${count('dark')} dark`);
  for (const k of ['light', 'vivid', 'dark']) console.log(`  ${k}: ${colours.filter(c => c.look === k).map(c => c.name).join(', ')}`);
}
