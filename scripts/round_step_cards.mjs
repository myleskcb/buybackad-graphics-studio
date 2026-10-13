#!/usr/bin/env node
/* STEPS FLOW: THE STEP ROWS KEEP THE APPROVED CARD'S CORNERS, NO SHEEN.
 *
 * The owner, 2026-10-13, over a silver Steps Flow card: "are these supposed
 * to be rounded? because the corners are quite sharp". The owner-approved
 * Steps Flow card (app.js stepsFlow, rule 89) draws each step row at a 30 px
 * radius around a 24 px number box. A look had since squared the rows on many
 * records (0 to 6 px: 42 live rows square, 66 at 3-6 px) while the number box
 * inside kept its 24 px, a soft box in a hard row. Rows under 16 px go back to
 * the approved 30; rounder rows (16, 22, 44 and the 69 px pills) keep theirs.
 * The 8 px "Sheen" strip along each row's top edge, 16% grey on a white row,
 * reads as a smudge and goes.
 *   node scripts/round_step_cards.mjs [--dry]
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const DIR = new URL('../assets/showcase/tpl/', import.meta.url).pathname;
const DRY = process.argv.includes('--dry'), R = 30, BELOW = 16;
let rounded = 0, sheens = 0, files = 0;
for (const f of readdirSync(DIR)) {
  if (!/^stepsFlow-.*\.json$/.test(f)) continue;
  const rec = JSON.parse(readFileSync(DIR + f, 'utf8'));
  const L = rec.tpl.layers, n0 = L.length;
  rec.tpl.layers = L.filter((l) => !/^Step Card \d+ Sheen$/.test(l.name || ''));
  const gone = n0 - rec.tpl.layers.length;
  let r = 0;
  for (const l of rec.tpl.layers) {
    if (l.kind !== 'rect' || !/^Step Card \d+$/.test(l.name || '') || !l.props) continue;
    if ((l.props.rx || 0) < BELOW) { l.props.rx = R; if (l.__shape === 'square') l.__shape = 'round'; r++; }
  }
  if (!gone && !r) continue;
  rounded += r; sheens += gone; files++;
  if (!DRY) writeFileSync(DIR + f, JSON.stringify(rec));
}
console.log(`${files} stepsFlow records: ${rounded} rows back to ${R} px, ${sheens} sheen strips removed${DRY ? ' (dry)' : ''}`);
