#!/usr/bin/env node
/* CURATE THE SHOWCASE — keep the best ~400, retire the redundant and the flawed.
 *
 * Owner, 2026-09-27: "Of the 780 possible themes, take out at least half of
 * them, the most redundant, similar to another one, poor design, so we have
 * the 400 that showed the least mistakes."
 *
 * Measured first (see DESIGN-LAW rule 60): 632 of 690 live cards sat in 91
 * (category, layout) groups of four or more, the same composition recoloured
 * up to 17 times. A pixel-similarity measure separated same-layout pairs from
 * different-layout pairs by only 4.90 vs 5.24, too weak to decide anything
 * (rule 50), so redundancy is judged STRUCTURALLY: same category + same
 * layout = the same design.
 *
 * 1. Eligible = what scLoadIndex() would show: no defect, has imagery, not
 *    near-colourless.
 * 2. Disqualified outright (the faults the owner named): copy colliding with
 *    copy or a shape (audit_collisions.mjs, >= 6%), copy running off the ad,
 *    copy inside the 6% safe margin (>= 2% of a line's ink), and the
 *    headline, number or CTA under 3:1 ("maximum legibility").
 * 3. Mistake score, lower is better: the critic's warnings, line and letter
 *    contrast below 4.5:1, the number's worst letter below 7:1, any overlap
 *    the older audits measured, and product cut off or half off its panel.
 *    Ties go to the owner's own approvals (`affinity`), then colour.
 * 4. Selection per category, in proportion to what each category has live.
 *    Within a category, round-robin across layouts: every layout's best card
 *    before any layout's second, and a layout's next card must bring a new
 *    palette family. So what survives is the best of each DIFFERENT design.
 *
 * usage: node scripts/curate_showcase.mjs --collisions path.json [--target 400] [--write]
 *   --write stamps `defect: 'curated'` on the retired rows (reversible: the
 *   records and thumbnails stay on disk; delete the stamp to bring one back).
 */
import { readFileSync, writeFileSync } from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname;
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const TARGET = +arg('--target', 400);
const WRITE = argv.includes('--write');
const idx = JSON.parse(readFileSync(ROOT + 'assets/showcase/index.json', 'utf8'));
const col = JSON.parse(readFileSync(arg('--collisions'), 'utf8'));

/* the owner's hero picks (assets/hero-picks.json, SKU or id) are kept unless
   they collide outright: a person chose them, and a score does not overrule that */
const SC_LAY = { checklistHero:'CHK', reviewProof:'REV', trustSeal:'TRS', stepsFlow:'STP', bubblePop:'BUB',
  voltStack:'VLT', neonNight:'NEO', slabPoster:'SLB', scriptRetro:'SCR', lowerThird:'LOW',
  gradientWave:'GRD', ticketStub:'TKT', hudTech:'HUD', bandKnockout:'BND', arcCrown:'ARC', glassCard:'GLS' };   // = app.js scSku()
const sku = c => { const p = String(c.id).split('-'); return (SC_LAY[c.layout] || String(c.layout).slice(0, 3).toUpperCase()) + '-' + (p[1] || '').toUpperCase() + '-' + (p[2] || '0'); };
const picks = new Set((JSON.parse(readFileSync(ROOT + 'assets/hero-picks.json', 'utf8')).picks || []).map(k => String(k).trim().toUpperCase()));
const picked = c => picks.has(c.id.toUpperCase()) || picks.has(sku(c));
const eligible = c => !c.defect && c.imagery !== 'none' && !(typeof c.chroma === 'number' && c.chroma < 0.05);
const pool = idx.filter(eligible);
const why = c => {
  const r = col[c.id]; const w = [];
  if (!r || r.err) w.push('unmeasured');
  else {
    if (r.collide >= 0.06) w.push('collides (' + r.what + ')');
    if (r.off > 2) w.push('runs off the ad');
    if (r.guide >= 0.02) w.push('outside the guides (' + r.guideBy + ')');
  }
  // the headline, the number or the CTA under 3:1 on its own pixels (audit_showcase_legibility)
  if (typeof c.legib === 'number' && c.legib < 3) w.push('critical line under 3:1 (' + c.legib + ')');
  // the critic decides what is shown (rule 54): a card it rejects is not kept
  if (c.school && c.school.fail && c.school.fail.length) w.push('critic rejects (' + c.school.fail.join('+') + ')');
  return w;
};
const warns = c => (c.school && c.school.warn ? c.school.warn.length : 0);
const short = (v, want) => typeof v === 'number' ? Math.max(0, want - v) : 0;
const mistakes = c => {
  const r = col[c.id] || {};
  return warns(c)
    + 1.5 * short(c.legib, 4.5) + 1.0 * short(c.letters, 4.5) + 0.3 * short(c.numInk, 7)
    + 10 * (c.cover || 0) + 10 * (c.shapeCover || 0)
    + 20 * (r.collide || 0) + 20 * (r.guide || 0) + 5 * (r.clip || 0) + 5 * (r.half || 0);
};
const better = (a, b) => (mistakes(a) - mistakes(b)) || ((b.affinity || 0) - (a.affinity || 0)) || ((b.chroma || 0) - (a.chroma || 0));

const out = pool.filter(c => why(c).length);
const ok = pool.filter(c => !why(c).length);
const cats = [...new Set(pool.map(c => c.cat))];
const target = Math.min(TARGET, ok.length);
// proportional to what each category has live, largest remainder
const share = cats.map(k => ({ k, exact: target * pool.filter(c => c.cat === k).length / pool.length }));
share.forEach(s => { s.n = Math.floor(s.exact); });
let left = target - share.reduce((a, s) => a + s.n, 0);
share.slice().sort((a, b) => (b.exact - b.n) - (a.exact - a.n)).forEach(s => { if (left > 0){ s.n++; left--; } });

const keep = new Set(ok.filter(picked).map(c => c.id));
share.forEach(({ k, n }) => {
  const byLayout = {};
  ok.filter(c => c.cat === k).sort(better).forEach(c => (byLayout[c.layout] = byLayout[c.layout] || []).push(c));
  const groups = Object.values(byLayout).sort((a, b) => better(a[0], b[0]));
  const got = ok.filter(c => c.cat === k && keep.has(c.id)), famsIn = new Map();
  for (let round = 0; got.length < n && round < 50; round++){
    let added = 0;
    for (const g of groups){
      if (got.length >= n) break;
      const seen = famsIn.get(g) || new Set();
      // this layout's best card not yet taken, preferring a palette family it does not have yet
      const cand = g.filter(c => !keep.has(c.id));
      const pick = cand.find(c => !seen.has(c.family)) || (round >= 3 ? cand[0] : null);
      if (!pick) continue;
      keep.add(pick.id); got.push(pick); seen.add(pick.family); famsIn.set(g, seen); added++;
    }
    if (!added && round >= 3) break;
  }
});

const retired = pool.filter(c => !keep.has(c.id));
const kept = pool.filter(c => keep.has(c.id));
const med = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
console.log('eligible before: ' + pool.length + ' · disqualified: ' + out.length + ' · kept: ' + kept.length + ' · retired as redundant/weaker: ' + (retired.length - out.length));
const reasons = {}; out.forEach(c => why(c).forEach(w => { const k = w.replace(/ \(.*$/, ''); reasons[k] = (reasons[k] || 0) + 1; }));
console.log('disqualified by: ' + JSON.stringify(reasons));
console.log('hero picks: ' + pool.filter(picked).length + ' live, ' + kept.filter(picked).length + ' kept' +
  (out.filter(picked).length ? ' (disqualified: ' + out.filter(picked).map(c => c.id + ' ' + why(c).join('/')).join(', ') + ')' : ''));
console.log('kept per category: ' + JSON.stringify(Object.fromEntries(cats.map(k => [k, kept.filter(c => c.cat === k).length]))));
console.log('distinct layouts kept: ' + new Set(kept.map(c => c.cat + '|' + c.layout)).size + ' of ' + new Set(pool.map(c => c.cat + '|' + c.layout)).size +
  ' · largest same-layout group now: ' + Math.max(...Object.values(kept.reduce((m, c) => (m[c.cat + '|' + c.layout] = (m[c.cat + '|' + c.layout] || 0) + 1, m), {}))));
console.log('median mistake score: kept ' + med(kept.map(mistakes)).toFixed(2) + ' vs retired ' + med(retired.map(mistakes)).toFixed(2) +
  ' · critic warnings, median: kept ' + med(kept.map(warns)) + ' vs retired ' + med(retired.map(warns)));
if (WRITE){
  retired.forEach(c => { c.defect = 'curated'; });
  writeFileSync(ROOT + 'assets/showcase/index.json', JSON.stringify(idx));   // the index's own format: compact, no trailing newline
  console.log('stamped defect:"curated" on ' + retired.length + ' rows; ' + idx.filter(eligible).length + ' remain live');
}
