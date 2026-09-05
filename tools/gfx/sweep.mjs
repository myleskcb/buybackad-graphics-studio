#!/usr/bin/env node
/* Full audit sweep. Runs every archetype × vertical × format × seed set and
   reports any card that fails one of the twelve rules. Exit code 1 on failure,
   so this drops straight into CI.
   Usage:  node tools/sweep.mjs [seedSets]      (default 12) */
import * as E from '../../engine/engine.mjs';

const SETS = Number(process.argv[2] || 12);
const VERTICALS = ['phones', 'cars'];
const FORMATS = ['45', '11', '916'];

let tested = 0;
const failures = [];
const coverage = [];

for (let set = 0; set < SETS; set++) {
  const base = 1000 + Math.floor(Math.random() * 900000);
  for (const v of VERTICALS)
    for (const f of FORMATS)
      for (const [key, name] of E.ARCHS) {
        const seed = base + set * 137;
        const r = E.render(key, seed, v, f, E.DEFAULT_CFG());
        tested++;
        coverage.push(r.audit.coverage);
        const bad = r.audit.rules.filter(x => !x[1]).map(x => x[0]);
        if (bad.length)
          failures.push(`${name} · ${v} · ${f} · ${r.palette.id} · seed ${seed} → ${bad.join(',')} ` +
            `(cov ${(r.audit.coverage * 100).toFixed(0)}%, dead ${(r.audit.dead * 100).toFixed(0)}%)`);
      }
}
coverage.sort((a, b) => a - b);
const med = coverage[Math.floor(coverage.length / 2)];
console.log(`tested   ${tested} configurations`);
console.log(`coverage min ${(coverage[0] * 100).toFixed(0)}%  median ${(med * 100).toFixed(0)}%  max ${(coverage.at(-1) * 100).toFixed(0)}%`);
console.log(`failing  ${failures.length}`);
failures.slice(0, 40).forEach(f => console.log('  ' + f));
process.exit(failures.length ? 1 : 0);
