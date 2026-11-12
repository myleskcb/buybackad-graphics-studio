#!/usr/bin/env node
/* PARTY ON "GET PAID" — the coins Steps Flow card (stepsFlow-cd10-20), restyled
 * to the owner's notes of 2026-11-11, as a pass anyone can re-run.
 *
 *   "This one doesn't make sense with the colors maybe you do red yellow,
 *    green, red orange yellow, or white white green, white white red, white
 *    white yellow for the third one", "Or all solid matching colors"; shown
 *    those, "confetti on #3?"; of the first prototypes' mixed number boxes,
 *    "why are the numbers all different colors random? it's throwing me off
 *    and we need consistency"; then "what about outlines? varying colored
 *    outlines? glows? pattern fill behind?"; and, of the results, "party
 *    colors", "the pattern fill", "color accents", "all good".
 *
 * The card's three step plates were two sage greens and one white, with a
 * faint bar across the top of each and three sizes of numeral. What this does
 * to the record:
 *   plates    white, white, green: the third is the one that pays
 *   accents   an outline on each plate, red then yellow then green, the
 *             owner's first suggestion drawn as lines instead of fills
 *   party     the green plate carries a `party` spec (app.js, partyPlate): a
 *             quiet tone-on-tone $ lattice and party-colour confetti, painted
 *             as the plate's own fill, at the end the words leave free
 *   numbers   ONE box and ONE numeral on all three steps: a navy box, a
 *             white numeral, one size
 *   words     ink on the white plates, white on the green; one label size
 *   sheen     the bar across the top of each plate goes
 *   box       each outlined plate stands in exactly the box it had, so the
 *             words and the numeral stay in its middle (audit_card r72)
 * The plates are marked pgUser: their colours were chosen by the owner, so
 * the one-colour pass and the gate leave them (rule 125).
 *
 * It writes only the record. Then:
 *   echo '["stepsFlow-cd10-20"]' > /tmp/ids.json
 *   ONLY=/tmp/ids.json node scripts/rethumb_showcase.mjs     (needs :8899; CHROME=, FABRIC_JS=)
 *   node scripts/audit_card.mjs stepsFlow-cd10-20
 *   bump ASSET_REV in app.js
 *
 *   node scripts/party_coins_steps.mjs [--dry]
 */
import { readFileSync, writeFileSync } from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname;
const ID = 'stepsFlow-cd10-20', FILE = ROOT + 'assets/showcase/tpl/' + ID + '.json';
const DRY = process.argv.includes('--dry');
const rec = JSON.parse(readFileSync(FILE, 'utf8'));
const L = n => rec.tpl.layers.find(l => l.name === n);

const PAPER = 'rgba(247,246,243,1)', INK = '#101014', NAVY = '#223249', GREEN = '#1f9d55', WHITE = '#ffffff';
const ACCENT = ['#ff4d6d', '#ffd60a', '#7be0a4'];                       // red, yellow, green: the outlines
const PARTY = { base: GREEN, glyph: '#2bb467', seed: 5, pieces: 60, from: 0.65 };
const STROKE = 7, BOX = { w: 912 + 1.5, h: 138 + 1.5 };              // the box each plate stood in: 912 x 138 with its 1.5px edge

const before = rec.tpl.layers.length;
rec.tpl.layers = rec.tpl.layers.filter(l => !/^Step Card \d+ Sheen$/.test(l.name || ''));
const changed = [];
for (const i of [1, 2, 3]){
  const card = L('Step Card ' + i), box = L('Step Num Box ' + i), num = L('Step Num ' + i), lab = L('Step Lab ' + i), mic = L('Step Micro ' + i);
  if (!card || !box || !num || !lab || !mic){ console.error(ID + ': step ' + i + ' is not laid out as this pass expects; nothing written'); process.exit(1); }
  const paid = i === 3;
  Object.assign(card.props, { fill: paid ? GREEN : PAPER, stroke: ACCENT[i - 1], strokeWidth: STROKE, pgUser: true });
  if (paid) card.party = PARTY; else delete card.party;
  /* fabric measures an object WITH its stroke, from its top-left: a 7px
     outline on a plate set 912 x 138 with a 1.5px edge made the plate 5.5px
     wider and taller, down and to the right, and took its middle off the
     words and the numeral (audit_card r72). So the path gives the stroke its
     room back and the plate stands in exactly the box it had; nothing drawn
     on it moves. Set, not added, so the pass can be run again. */
  Object.assign(card.props, { width: BOX.w - STROKE, height: BOX.h - STROKE, rx: (BOX.h - STROKE) / 2 });
  const top = card.props.top;
  Object.assign(box.props, { fill: NAVY, top: top + 27 }); delete box.props.stroke; delete box.props.strokeWidth; box.solid = true;
  Object.assign(num.props, { fill: WHITE, fontSize: 52, top: top + 38 });
  Object.assign(lab.props, { fill: paid ? WHITE : INK, fontSize: 34, top: top + 26 });
  Object.assign(mic.props, { fill: paid ? WHITE : INK, top: top + 82 });
  changed.push('step ' + i + ': ' + (paid ? 'green, party' : 'white') + ', outline ' + ACCENT[i - 1]);
}
console.log(ID, '| sheen layers removed:', before - rec.tpl.layers.length, '|', changed.join(' | '));
if (DRY) console.log('dry run: nothing written');
else { writeFileSync(FILE, JSON.stringify(rec)); console.log('written', FILE.replace(ROOT, '')); }
