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
import { COMPANY, LICENSE, foreignWords, PROOF, PRICE, HOURS, DASH, BANNED, CLAIM } from './refresh_copy.mjs';
const ROOT = new URL('../', import.meta.url).pathname;
const WRITE = process.argv.includes('--write');
const idx = JSON.parse(readFileSync(ROOT + 'assets/showcase/index.json', 'utf8'));
/* product pictures that must not ship: the owner's rejects and anything
   flagged since (scripts/picture_gate.mjs), 2026-09-27 */
import { pictureId, pictureVerdict } from './picture_gate.mjs';

/* what a category is allowed to show. The phones deck rotates across the Apple
   line, so it legitimately carries iPads, Macs and Watches. Nothing else does. */
const ALLOW = {
  cars:{car:1}, coins:{coin:1}, gold:{gold:1, cash:1}, pokemon:{poke:1},
  silver:{silver:1}, sports:{sports:1}, strips:{strip:1},
  phones:{iphone:1, ipad:1, watch:1, mac:1, macbook:1, own:1, device:1, group:1,
          sam:1, pix:1, phone:1, gen:1, hand:1, set:1, damage:1, sheet:1},
};
const family = p => String(p || '').replace(/^(qs-|ip-|ph-)/, '').split('-')[0];   // ph-: a placeholder of that family

/* the renders the owner approved (assets/approved/approved.json): the owner's
   own words on an approved card stand (DESIGN-LAW 78 over 80), and a record
   restaged and passed by audit_card (its layers carry __ink) is judged by its
   letters there, not by these boxes (DESIGN-LAW 76) */
const APPROVED_CARDS = (() => { try { return new Set(Object.keys(JSON.parse(readFileSync(ROOT + 'assets/approved/approved.json', 'utf8'))).filter(k => k[0] !== '_')); } catch (e){ return new Set(); } })();
let n = { gate:0, subject:0, repeat:0, cover:0, clip:0, copy:0, legib:0, shape:0, bg:0, school:0, asset:0, curated:0, clean:0 };
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
    /* COPY (2026-09-22): a named competitor, a licensing claim the reseller
       may not be able to make, or words that sell another deck's goods */
    const words = rec.tpl.layers.filter(l => typeof l.text === 'string' && l.role !== 'website').map(l => l.text).join('\n');
    if (COMPANY.test(words) || LICENSE.test(words) || foreignWords(c.cat, words).length) why.push('copy');
    /* the study session's copy rules (2026-09-26): invented proof, a price
       figure, invented hours, a dash, a deadline or a "real person" claim */
    if (PROOF.test(words) || PRICE.test(words) || HOURS.test(words) || DASH.test(words) || BANNED.test(words)) why.push('copy');
    /* invented facts (2026-09-27): a rank, a clock, a service, a policy, a
       reputation, or more than the reseller buys (refresh_copy.mjs CLAIM) */
    if (CLAIM.test(words) && !APPROVED_CARDS.has(c.id)) why.push('copy');
    /* a product picture the owner rejected, or one flagged since */
    if (rec.tpl.layers.some(l => l.kind === 'cutout' && l.props && pictureVerdict(pictureId(l.props.src), c.cat))) why.push('asset');
  }
  /* LEGIBILITY (2026-09-22), written by audit_showcase_legibility.mjs: a
     headline, phone or CTA under 3:1 against the pixels behind it, or one that
     never marked the canvas, or a backdrop the studio could not load */
  if (typeof c.legib === 'number' && c.legib < 3) why.push('legib');
  if (c.ghost) why.push('legib');
  if (c.bgMissing) why.push('bg');
  /* a solid shape drawn over the words (audit_showcase_overlap.mjs) */
  const inked = !!(rec && rec.tpl.layers.some(l => l.__ink));
  if (!inked && (c.shapeCover || 0) >= 0.12) why.push('shape');
  if (!inked && (c.cover || 0) >= 0.12) why.push('cover');
  if (!inked && (c.clip || 0) > 6) why.push('clip');            // a line running off the card
  /* the design school's rejects (audit_showcase_school.mjs): a small number,
     a letter under 3:1, a headline that does not win or does not read as a
     thumbnail, a third typeface, a faux weight, a number on a product */
  if (c.school && c.school.fail && c.school.fail.length) why.push('school');
  /* the gate (verify_showcase.mjs --all --write, DESIGN-LAW 87): a card that
     fails the one measure is not offered, whatever the older audits said */
  if (Array.isArray(c.gate) && c.gate.length) why.push('gate');
  /* the owner's curation (scripts/curate_showcase.mjs: "take out at least half
     of them"): a retired card stays retired, whatever this audit measures */
  if (String(c.defect || '').split('+').includes('curated')) why.push('curated');
  const uniq = [...new Set(why)];
  uniq.forEach(w => n[w]++);
  /* a curation stamp (scripts/curate_showcase.mjs) is the owner's cut, not
     a measured defect: this audit never clears it (2026-09-27, cohesion
     audit: a --write run used to un-retire all 284 curated cards) */
  const curated = /\bcurated\b/.test(String(c.defect || ''));
  if (uniq.length) c.defect = (curated ? 'curated+' : '') + uniq.join('+'); else if (curated) c.defect = 'curated'; else { delete c.defect; n.clean++; }
});

console.log('audited ' + idx.length);
console.log('  subject mismatch ' + n.subject);
console.log('  repeated copy    ' + n.repeat);
console.log('  covered text     ' + n.cover);
console.log('  clipped text     ' + n.clip);
console.log('  copy (company / licence / other deck) ' + n.copy);
console.log('  critical text under 3:1 / invisible   ' + n.legib);
console.log('  shape over text   ' + n.shape);
console.log('  backdrop missing  ' + n.bg);
console.log('  design school     ' + n.school);
console.log('  flagged picture   ' + n.asset);
console.log('  retired (curated) ' + n.curated);
console.log('  CLEAN            ' + n.clean);
if (WRITE){ writeFileSync(ROOT + 'assets/showcase/index.json', JSON.stringify(idx)); console.log('wrote defect flags'); }
else console.log('(dry run; pass --write)');
