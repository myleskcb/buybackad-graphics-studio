#!/usr/bin/env node
/* HOLD — the owner's audit, kept off the site.
 *
 * Owner, 2026-10-02, looking at the live library: "These can't be final
 * products on the site.. there's no background?", then "we need to audit".
 * Every live card was looked at on contact sheets (DESIGN-LAW rule 105); the
 * ones that are not a finished product are listed in assets/showcase/holds.json
 * with the reason. This stamps `defect: 'curated'` on each (merged with any
 * stamp already there), the stamp audit_showcase_content.mjs and
 * curate_showcase.mjs both keep, so no later run puts one back on the site.
 * The records and thumbnails stay on disk.
 *
 *   node scripts/hold_showcase.mjs            dry run
 *   node scripts/hold_showcase.mjs --write    stamp the index
 *
 * Run it after curate_showcase.mjs (OPEN-ITEMS §R, the pipeline).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { live } from './_showcase_harness.mjs';
const DIR = new URL('../assets/showcase/', import.meta.url).pathname;
const WRITE = process.argv.includes('--write');
const raw = readFileSync(DIR + 'index.json', 'utf8'), idx = JSON.parse(raw);
const { holds } = JSON.parse(readFileSync(DIR + 'holds.json', 'utf8'));
const byId = new Map(idx.map(c => [c.id, c]));
const missing = holds.filter(h => !byId.has(h.id)).map(h => h.id);
const before = idx.filter(live).length;
let stamped = 0;
for (const { id } of holds){
  const c = byId.get(id); if (!c) continue;
  const d = String(c.defect || '').split('+').filter(Boolean);
  if (d.includes('curated')) continue;
  c.defect = ['curated', ...d].join('+'); stamped++;
}
const after = idx.filter(live).length;
console.log(`${holds.length} holds · ${stamped} newly stamped · live ${before} -> ${after}` + (missing.length ? ` · not in the index: ${missing.join(', ')}` : ''));
const per = {}; idx.filter(live).forEach(c => { per[c.cat] = (per[c.cat] || 0) + 1; });
console.log('live per category: ' + Object.entries(per).sort().map(([k, v]) => k + ' ' + v).join(', '));
if (WRITE){ writeFileSync(DIR + 'index.json', JSON.stringify(idx) + (raw.endsWith('\n') ? '\n' : '')); console.log('wrote index.json'); }
