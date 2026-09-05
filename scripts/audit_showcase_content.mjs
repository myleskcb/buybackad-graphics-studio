#!/usr/bin/env node
/* CONTENT AUDIT — the defects a picture cannot show you.
 *
 * Run after audit_showcase_overlap.mjs, which measures `cover`. This adds the
 * checks that are about MEANING rather than geometry, and stamps one `defect`
 * field on every index row so the app filters on data somebody can inspect
 * rather than on a rule buried in a function.
 *
 *   subject   the product cutout must belong to the thing the ad is selling.
 *             An iPhone on a SPORTS CARDS ad is the fault the owner caught on
 *             2026-09-04, and it was 28 cards.
 *   repeat    the same words twice on one card ("TRUSTED TRUSTED LOCAL").
 *   cover     something drawn on top of the words (>=12% of a text box).
 *
 * usage: node scripts/audit_showcase_content.mjs [--write]
 */
import { readFileSync, writeFileSync } from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname;
const WRITE = process.argv.includes('--write');
const idx = JSON.parse(readFileSync(ROOT + 'assets/showcase/index.json', 'utf8'));

/* what a category is allowed to show. The phones deck rotates across the Apple
   line, so it legitimately carries iPads, Macs and Watches. Nothing else does. */
const ALLOW = {
  cars:{car:1}, coins:{coin:1}, gold:{gold:1, cash:1}, pokemon:{poke:1},
  silver:{silver:1}, sports:{sports:1}, strips:{strip:1},
  phones:{iphone:1, ipad:1, watch:1, mac:1, macbook:1, own:1, device:1, group:1,
          sam:1, pix:1, phone:1, gen:1, hand:1, set:1, damage:1, sheet:1},
};
const family = p => String(p || '').replace(/^(qs-|ip-)/, '').split('-')[0];

let n = { subject:0, repeat:0, cover:0, clip:0, clean:0 };
idx.forEach(c => {
  const why = [];
  /* Only a card that actually SHOWS a product can show the wrong one. Most
     cards carry a photograph and no cutout at all, and a logo layer is not a
     subject either — reading those as mismatches was a bug in this audit that
     briefly condemned 410 good cards. */
  const prod = String(c.product || '');
  const showsProduct = prod && !/^logo:|\.png:/.test(prod);
  if (showsProduct && (!ALLOW[c.cat] || !ALLOW[c.cat][family(prod)])) why.push('subject');
  let rec = null;
  try { rec = JSON.parse(readFileSync(ROOT + 'assets/showcase/tpl/' + c.id + '.json', 'utf8')); } catch(e){}
  if (rec){
    const texts = rec.tpl.layers
      .filter(l => typeof l.text === 'string' && l.text.trim())
      .map(l => l.text.trim().toUpperCase());
    if (texts.length !== new Set(texts).size) why.push('repeat');
  }
  if ((c.cover || 0) >= 0.12) why.push('cover');
  if ((c.clip || 0) > 6) why.push('clip');            // a line running off the card
  why.forEach(w => n[w]++);
  if (why.length) c.defect = why.join('+'); else { delete c.defect; n.clean++; }
});

console.log('audited ' + idx.length);
console.log('  subject mismatch ' + n.subject);
console.log('  repeated copy    ' + n.repeat);
console.log('  covered text     ' + n.cover);
console.log('  clipped text     ' + n.clip);
console.log('  CLEAN            ' + n.clean);
if (WRITE){ writeFileSync(ROOT + 'assets/showcase/index.json', JSON.stringify(idx)); console.log('wrote defect flags'); }
else console.log('(dry run; pass --write)');
