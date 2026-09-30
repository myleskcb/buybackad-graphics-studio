#!/usr/bin/env node
/* REPALETTE — move every showcase card onto the current PALETTES
 * (refresh_palettes.mjs) and change nothing else.
 *
 * refresh_showcase.mjs also rewrites faces and copy, and starts from git HEAD,
 * so running it now would throw away every pass after it (number block,
 * naturalize, darken, panels ...). This is only its colour half, applied to
 * the records as they stand: balanced assignment, then the luminance-locked
 * recolour of every colour string in the record. Every contrast ratio between
 * two flat colours stays what it was when the card passed the gate; neutral
 * colours (C < 0.03: the shade over photographs, white, near-black ink) are
 * not touched, so rule 85 still holds.
 *
 *   node scripts/repalette_showcase.mjs --write
 *   node scripts/verify_showcase.mjs          # the gate, unchanged by design
 *   node scripts/rethumb_showcase.mjs         # then bump ASSET_REV in app.js
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { PALETTES, assign, mapper, walkColours, parse, lumOf, toOklch } from './refresh_palettes.mjs';
const DIR = new URL('../assets/showcase/', import.meta.url).pathname;
const WRITE = process.argv.includes('--write');
const idx = JSON.parse(readFileSync(DIR + 'index.json', 'utf8'));
const plan = assign(idx);
const LAYOUT_NAME = c => String(c.name || '').split(' · ').slice(1).join(' · ') || c.layout;
/* family = what the ground actually is now (same rule as refresh_showcase) */
function familyOf(c1, pal){
  const p = parse(c1) || { r:0, g:0, b:0 }, Y = lumOf(p), C = toOklch(p).C;
  if (pal.neutral || (Y > 0.6 && C < 0.03)) return 'Studio';
  if (Y < 0.08) return 'Deep';
  if (Y > 0.45) return 'Sorbet';
  return 'Poster';
}
const use = {}, liveUse = {};
for (const c of idx){
  const pal = plan[c.id], map = mapper(pal, c);
  const path = DIR + 'tpl/' + c.id + '.json';
  const rec = JSON.parse(readFileSync(path, 'utf8'));
  rec.tpl = walkColours(rec.tpl, map);
  const roles = { c1:map(c.c1), ink:map(c.ink), accent:map(c.accent), support:map(c.support) };
  Object.assign(c, roles, { theme:pal.name, family:familyOf(roles.c1, pal), name:pal.name + ' · ' + LAYOUT_NAME(c) });
  if (WRITE) writeFileSync(path, JSON.stringify(rec));
  use[pal.name] = (use[pal.name] || 0) + 1;
  if (!c.defect) liveUse[pal.name] = (liveUse[pal.name] || 0) + 1;
}
if (WRITE) writeFileSync(DIR + 'index.json', JSON.stringify(idx));
console.log((WRITE ? 'repaletted ' : 'dry run: ') + idx.length + ' cards onto ' + Object.keys(use).length + ' of ' + PALETTES.length + ' palettes');
PALETTES.forEach(p => console.log('  ' + p.name.padEnd(22) + String(use[p.name] || 0).padStart(4) + ' cards, ' + String(liveUse[p.name] || 0).padStart(3) + ' live'));
