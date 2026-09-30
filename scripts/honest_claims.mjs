#!/usr/bin/env node
/* INVENTED FACTS, REWRITTEN (2026-09-27).
 *
 * refresh_copy.mjs CLAIM names the claims a template cannot know are true of
 * the reseller who posts it (a rank, a clock, a service, a policy, a
 * reputation, or more than they buy); CLAIM_FIX says what each says instead.
 * This applies CLAIM_FIX to every showcase record, line by line, and reports
 * any line the patterns still catch, so the table and the audit stay in step.
 * The classics carry the same words in app.js and were edited there.
 *
 * A rewritten card is re-measured: scripts/audit_showcase_overlap.mjs,
 * audit_showcase_school.mjs and audit_showcase_content.mjs run over it again,
 * and rethumb_showcase.mjs repaints its thumbnail.
 *
 * usage: node scripts/honest_claims.mjs [--write] [--ids-out FILE]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { CLAIM, fixClaims } from './refresh_copy.mjs';
const ROOT = new URL('../', import.meta.url).pathname, DIR = ROOT + 'assets/showcase/';
const WRITE = process.argv.includes('--write');
const argv = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const idx = JSON.parse(readFileSync(DIR + 'index.json', 'utf8'));
const touched = [], left = new Map(), changes = new Map();
for (const c of idx){
  const f = DIR + 'tpl/' + c.id + '.json', rec = JSON.parse(readFileSync(f, 'utf8'));
  let hit = false;
  rec.tpl.layers.forEach(l => {
    if (typeof l.text !== 'string') return;
    const nt = fixClaims(l.text);
    if (nt !== l.text){ const k = l.text + '  ->  ' + nt; changes.set(k, (changes.get(k) || 0) + 1); l.text = nt; hit = true; }
    if (CLAIM.test(l.text)) left.set(l.text, (left.get(l.text) || 0) + 1);
  });
  if (hit){ touched.push(c.id); if (WRITE) writeFileSync(f, JSON.stringify(rec)); }
}
[...changes.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(String(n).padStart(4) + '  ' + k.replace(/\n/g, ' / ')));
console.log(`\nlines rewritten ${[...changes.values()].reduce((s, n) => s + n, 0)} on ${touched.length} cards` + (WRITE ? ' · written' : ' · dry run'));
console.log('claims left: ' + (left.size ? [...left.entries()].map(([t, n]) => n + '× ' + JSON.stringify(t)).join('; ') : 'none'));
if (argv('--ids-out')) writeFileSync(argv('--ids-out'), JSON.stringify(touched));
