#!/usr/bin/env node
/* Batch-render cards to SVG (and PNG when sharp is installed).
   Usage:  node tools/render.mjs [outDir] [vertical] [format] [seed] */
import * as E from '../../engine/engine.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2] || 'out';
const V = process.argv[3] || 'phones';
const F = process.argv[4] || '45';
const SEED = Number(process.argv[5] || 4242);
mkdirSync(OUT, { recursive: true });

let sharp = null;
try { sharp = (await import('sharp')).default; } catch { /* SVG only */ }

for (const [key, name] of E.ARCHS) {
  const r = E.render(key, SEED, V, F, E.DEFAULT_CFG());
  const stem = `${key}-${V}-${F}-${SEED}`;
  writeFileSync(join(OUT, stem + '.svg'), r.svg);
  if (sharp) await sharp(Buffer.from(r.svg)).png().toFile(join(OUT, stem + '.png'));
  console.log(`${name.padEnd(16)} ${r.palette.id} ${r.pair.display.padEnd(14)} ` +
    `cov ${(r.audit.coverage * 100).toFixed(0)}%  rules ${r.audit.pass}/${r.audit.total}`);
}
console.log(`\nwritten to ${OUT}/${sharp ? ' (svg + png)' : ' (svg — npm i sharp for png)'}`);
