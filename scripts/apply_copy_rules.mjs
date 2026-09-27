#!/usr/bin/env node
/* Apply refresh_copy.mjs's rules to the records AS THEY ARE NOW (idempotent:
 * a record that already follows them is not touched), for rules added after
 * a full refresh. Writes the changed ids to .render/copy-applied.json so the
 * thumbnails and audits can be re-run on just those:
 *   node scripts/apply_copy_rules.mjs
 *   ONLY=.render/copy-applied.json node scripts/rethumb_showcase.mjs  (then the audits) */
import { readFileSync, writeFileSync } from 'node:fs';
import { rewriteCopy } from './refresh_copy.mjs';
const ROOT = new URL('../', import.meta.url).pathname, DIR = ROOT + 'assets/showcase/';
const idx = JSON.parse(readFileSync(DIR + 'index.json', 'utf8'));
const ids = []; let lines = 0;
for (const c of idx){
  const rec = JSON.parse(readFileSync(DIR + 'tpl/' + c.id + '.json', 'utf8'));
  const ch = rewriteCopy(rec.tpl, c.cat);
  if (ch.length){ writeFileSync(DIR + 'tpl/' + c.id + '.json', JSON.stringify(rec)); ids.push(c.id); lines += ch.length; }
}
writeFileSync(ROOT + '.render/copy-applied.json', JSON.stringify(ids));
console.log('copy rules applied: ' + lines + ' lines on ' + ids.length + ' cards');
