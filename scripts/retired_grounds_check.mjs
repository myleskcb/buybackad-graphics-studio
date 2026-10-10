#!/usr/bin/env node
/* RETIRED GROUNDS — no live card stands on a picture rule 117 retired.
 *
 * Rule 117 (2026-10-04) retired every generated photograph (assets/bg/dl_*) and
 * every drawn placeholder ground (assets/showcase/bg/dg_cast_*). The templates
 * moved, but nothing checked the cards, and on 2026-10-10 34 live cards outside
 * sports still stood on one: stepsFlow-du08-15 on the night-skyline photograph
 * whose phone is a Google Pixel, behind "iPhone" copy (DESIGN-LAW 127). Fast,
 * no browser: reads the showcase index and each card's record.
 *
 * KNOWN are the cards found on 2026-10-10 and not yet re-grounded (OPEN-ITEMS
 * AU 2); sports keep generated scenes until real photographs arrive (rule 117).
 * Anything else on a retired ground fails.
 *   node scripts/retired_grounds_check.mjs          exit 1 on a new one
 *   node scripts/retired_grounds_check.mjs --list   every card on a retired ground */
import { readFileSync } from 'node:fs';
const DIR = new URL('../assets/showcase/', import.meta.url).pathname;
/* = live in scripts/_showcase_harness.mjs and scIsLive in app.js */
const live = c => !!c && !c.defect && c.imagery !== 'none' && !(typeof c.chroma === 'number' && c.chroma < 0.05);
/* = retired in scripts/reground_showcase.mjs */
const retired = src => /^assets\/bg\//.test(src) || /^assets\/showcase\/bg\/dg_cast_/.test(src);
const photoOf = src => String(src || '').split('|').pop();
const EXEMPT_CATS = new Set(['sports']);
const KNOWN = new Set(['bandKnockout-pa05-20', 'arcCrown-nn05-20', 'arcCrown-du02-20', 'checklistHero-du05-30', 'checklistHero-du01-30',
  'checklistHero-du02-30', 'stepsFlow-cd06-30', 'stepsFlow-jw10-31', 'bubblePop-ik05-30', 'bubblePop-du02-30', 'bubblePop-cd10-30',
  'bubblePop-cd04-30', 'scriptRetro-du07-30', 'bandKnockout-cd06-30', 'bandKnockout-nn05-30', 'arcCrown-cd01-30', 'arcCrown-pa01-30',
  'arcCrown-du07-30', 'checklistHero-ca05-35', 'checklistHero-cd05-35', 'stepsFlow-cd05-35', 'stepsFlow-jw08-35', 'bubblePop-pp06-35',
  'bubblePop-du04-35', 'voltStack-gl03-35', 'neonNight-gl01-35', 'bandKnockout-nn06-35', 'bandKnockout-su05-35', 'stepsFlow-io03-16',
  'scriptRetro-jw05-16', 'voltStack-ck03-20']);

const idx = JSON.parse(readFileSync(DIR + 'index.json', 'utf8'));
const on = [];
for (const c of idx.filter(live)){
  let rec; try { rec = JSON.parse(readFileSync(DIR + 'tpl/' + c.id + '.json', 'utf8')); } catch (e){ continue; }
  const src = photoOf(((rec.tpl || {}).bg || {}).src);
  if (retired(src)) on.push({ id: c.id, cat: c.cat, src });
}
const fresh = on.filter(x => !EXEMPT_CATS.has(x.cat) && !KNOWN.has(x.id));
const cleared = [...KNOWN].filter(id => !on.some(x => x.id === id));
if (process.argv.includes('--list')) on.forEach(x => console.log(x.id.padEnd(24), x.cat.padEnd(8), x.src));
console.log(`live cards on a retired ground: ${on.length} (sports ${on.filter(x => EXEMPT_CATS.has(x.cat)).length}, known ${on.filter(x => KNOWN.has(x.id)).length}, new ${fresh.length})`);
if (cleared.length) console.log(`known and since re-grounded (take them off KNOWN): ${cleared.join(', ')}`);
fresh.forEach(x => console.log(`NEW  ${x.id} (${x.cat}) stands on ${x.src}`));
process.exit(fresh.length ? 1 : 0);
