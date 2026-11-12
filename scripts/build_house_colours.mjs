#!/usr/bin/env node
/* ONE COLOUR VOCABULARY, IN THE VIDEO MAKER TOO: motion/house-colours.js.

   DESIGN-LAW rule 123: the photo ads' colour themes are the library's twelve proven pairings
   (COLOR_THEMES "Proven pairs" in app.js, solved by the colour builder, scripts/house_themes.mjs).
   The video maker kept 172 palettes of its own (OPEN-ITEMS §AO item 1), and the full ad
   (motion/fullad.js) first drew from sixteen of those. So "Navy & Gold" on a photo ad and on a
   full ad were two different navies and two different golds.

   This reads the twelve rows out of app.js (the one source: no colour is typed twice) and writes
   them as the video engine's palettes: ground, light, ink, accent, plate, plate_ink. The full ad's
   colours are these twelve, by the same names and the same colours as Easy Mode's.

   From a theme to a palette:
     ground     the theme's darker background stop (on the light theme, its darker stop too)
     light      the lit middle of a ground: the lighter stop lifted a fifth toward white (dark
                themes), or the lighter stop itself (light)
     ink        the theme's ink
     accent     the theme's accent; the plate (the number's pill, the chips, the claim) wears it
     plate_ink  whichever of the ground and white reads better on the plate

   Which lines each pair suits (suits): the photo library's own table, AFFINITY in
   scripts/refresh_palettes.mjs, read here so the full ad and the library answer alike (gold wants
   a warm-yellow colour in the pair, silver and test strips a cool or neutral ground, Pokémon never
   a neutral one). Only the lines that table restricts are listed (LINES); every other line takes
   any pair. fullad.js draws a seeded ad's pair from these, never a hand-picked one (rule 138).

   usage:  node scripts/build_house_colours.mjs            # rewrite motion/house-colours.js
           node scripts/build_house_colours.mjs --check    # exit 1 if it is stale */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { PALETTES, AFFINITY } from './refresh_palettes.mjs';

// the lines AFFINITY restricts, by the full ad's subject keys (motion/subjects.json); the rest take anything
const LINES = ['gold', 'silver', 'strips', 'pokemon'];

const ROOT = new URL('../', import.meta.url).pathname, OUT = ROOT + 'motion/house-colours.js';
const src = readFileSync(ROOT + 'app.js', 'utf8');
const rows = [...src.matchAll(/^\s*\{ name:'([^']+)',\s*group:'Proven pairs',\s*family:'(Dark|Light)',\s*bg:\{type:'grad', c1:'(#[0-9a-f]{6})', c2:'(#[0-9a-f]{6})'[^}]*\},\s*accent:'(#[0-9a-f]{6})',\s*ink:'(#[0-9a-f]{6})',\s*support:'(#[0-9a-f]{6})'/gm)];
if (rows.length !== 12) { console.error(`expected the twelve Proven pairs in app.js COLOR_THEMES, found ${rows.length}`); process.exit(2); }

const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const hex = a => '#' + a.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
const mix = (a, b, k) => hex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * k));
const lin = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
const L = h => { const [r, g, b] = rgb(h).map(lin); return .2126 * r + .7152 * g + .0722 * b; };
const cr = (a, b) => (Math.max(L(a), L(b)) + .05) / (Math.min(L(a), L(b)) + .05);

const colours = rows.map(([, name, family, c1, c2, accent, ink, support]) => {
  const dark = family === 'Dark', ground = L(c1) < L(c2) ? c1 : c2, lighter = L(c1) < L(c2) ? c2 : c1;
  const light = dark ? mix(lighter, '#ffffff', .2) : lighter;
  const plate_ink = cr(accent, ground) >= cr(accent, '#ffffff') ? ground : '#ffffff';
  const pal = PALETTES.find(q => q.name === name);
  if (!pal) { console.error(`${name}: not in refresh_palettes.mjs PALETTES, so which lines it suits is unknown`); process.exit(2); }
  const suits = LINES.filter(k => AFFINITY[k](pal));
  const row = { key: name.toLowerCase().replace(/ & /, '_').replace(/[^a-z_]/g, ''), name, family, suits, colors: { ground, light, ink, accent, plate: accent, plate_ink } };
  // what the ad's parts must read at, on the colours as written here
  const need = [['ink on the ground', cr(ink, ground), 7], ['ink on the lit ground', cr(ink, light), 4.5], ['the plate\'s words', cr(plate_ink, accent), 4.5], ['the accent on the ground', cr(accent, ground), 3]];
  for (const [what, got, want] of need) if (got < want) { console.error(`${name}: ${what} reads ${got.toFixed(2)}:1, under ${want}:1`); process.exit(1); }
  // the chips, the chevrons and the pin are the engine's hotColour(), which takes the accent only when
  // it stands .3 off the ground and over .25 in the engine's own (gamma) luminance, and otherwise a
  // stock yellow, pink, green or cyan: a third colour on the card (rule 138)
  const gl = h => { const [r, g, b] = rgb(h); return (.2126 * r + .7152 * g + .0722 * b) / 255; };
  if (!(Math.abs(gl(accent) - gl(ground)) > .3 && gl(accent) > .25)) { console.error(`${name}: the engine's hotColour() would not take the accent ${accent} on ${ground}, and would paint the chips and chevrons a colour outside the pair`); process.exit(1); }
  return row;
});

// a module, not a JSON file: fullad.js imports it, and an import of JSON is not in every browser the maker serves
const json = `/* generated by scripts/build_house_colours.mjs; do not edit by hand.
   The photo ads' twelve proven colour pairs (app.js COLOR_THEMES, DESIGN-LAW 123) as the video
   engine's palettes. To change a colour, change the themes (scripts/house_themes.mjs) and run the script. */
export const HOUSE_COLOURS = [
${colours.map(c => '  ' + JSON.stringify(c)).join(',\n')},
];
/* The lines whose pairs are restricted (each pair's suits; scripts/refresh_palettes.mjs AFFINITY). */
export const LINES = ${JSON.stringify(LINES)};
`;
if (process.argv.includes('--check')) {
  if ((existsSync(OUT) ? readFileSync(OUT, 'utf8') : '') !== json) { console.error('motion/house-colours.js is stale: run node scripts/build_house_colours.mjs'); process.exit(1); }
  console.log(`motion/house-colours.js is in step with the studio's twelve proven pairs`);
} else {
  writeFileSync(OUT, json);
  console.log('wrote motion/house-colours.js: ' + colours.map(c => c.name).join(', '));
}
