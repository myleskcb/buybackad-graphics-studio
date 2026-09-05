#!/usr/bin/env node
/* What is each device actually worth? Toggles every switch off across all eight
   archetypes and reports the average score it contributes. A number near zero
   means the device is decorative for these layouts.
   Usage:  node tools/contribution.mjs [vertical] [format] */
import * as E from '../../engine/engine.mjs';

const V = process.argv[2] || 'phones';
const F = process.argv[3] || '45';
const SEEDS = [1471, 20983, 55110, 730044];
const score = a => a.coverage * .45 + (1 - Math.min(a.dead, .5) / .5) * .25 + (a.pass / a.total) * .30;

const rows = E.ALLKEYS.map(k => {
  let sum = 0, n = 0;
  for (const seed of SEEDS)
    for (const [arch] of E.ARCHS) {
      const on = { ...E.DEFAULT_CFG(), [k]: true };
      const off = { ...E.DEFAULT_CFG(), [k]: false };
      sum += score(E.render(arch, seed, V, F, on).audit) - score(E.render(arch, seed, V, F, off).audit);
      n++;
    }
  return { key: k, group: E.KEYMETA[k].group, name: E.KEYMETA[k].name, pts: (sum / n) * 100 };
}).sort((a, b) => b.pts - a.pts);

console.log(`contribution · ${V} · ${F} · ${SEEDS.length} seeds × ${E.ARCHS.length} archetypes\n`);
console.log('  pts   group           device');
for (const r of rows)
  console.log(`${r.pts >= 0 ? ' ' : ''}${r.pts.toFixed(2).padStart(6)}   ${r.group.padEnd(15)} ${r.name}`);
