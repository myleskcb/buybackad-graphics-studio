#!/usr/bin/env node
/* THE CHECKLIST CLEARS ITS CTA CARD (checklistHero).
 *
 * The owner, 2026-10-13, over the library's gold, Pokémon, cars, test-strip
 * and silver lists: the third point sat on the CTA card. Measured on the 26
 * live checklistHero cards, the last point's box ended 4-17 px above the card
 * (the layout put the rows at 576 + i*96 and the card at 818), so the list and
 * the number read as one block.
 *
 * For every checklistHero record this paints the card the way renderThumb()
 * does and lifts the list (Tick n, Tick Mark n, Point n) until the last point
 * clears the card by GAP px. The lift is taken from the space under the money
 * word (Headline 2), which keeps HEAD px of its own box; when that is not
 * enough the three rows close up, never under a MIN_PITCH pitch. A change is
 * kept only when the gate says nothing got worse (__sc.accept: no new failure,
 * no reading line under what it had).
 *
 *   python3 -m http.server 8899   then
 *   CHROME=… [FABRIC_JS=…] node scripts/clear_list_from_cta.mjs [--dry]
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { openStudio } from './_showcase_harness.mjs';

const DIR = new URL('../assets/showcase/tpl/', import.meta.url).pathname;
const GAP = 40, HEAD = 4, PAD = 14, MIN_PITCH = 84;
const DRY = process.argv.includes('--dry');
const ids = readdirSync(DIR).filter((f) => /^checklistHero-.*\.json$/.test(f)).map((f) => f.slice(0, -5));

const { browser, page, errors } = await openStudio();
const done = [], kept = [], refused = [];
for (const id of ids) {
  const rec = JSON.parse(readFileSync(DIR + id + '.json', 'utf8'));
  const res = await page.evaluate(async (id, rec, GAP, HEAD, PAD, MIN_PITCH) => {
    const t0 = await __sc.prep(rec, id);
    const { sc, refs } = __sc.paint(t0);
    const L = t0.layers, at = (n) => L.findIndex((l) => l.name === n);
    const bx = (k) => { const b = refs[k].getBoundingRect(true, true); return { t: b.top, b: b.top + b.height }; };
    const k = { h2: at('Headline 2'), t1: at('Tick 1'), p1: at('Point 1'), p2: at('Point 2'), p3: at('Point 3'), cta: at('CTA Card') };
    if (Object.values(k).some((v) => v < 0 || !refs[v])) { sc.dispose(); return { skip: 'no list' }; }
    const gap = bx(k.cta).t - bx(k.p3).b;
    /* the ceiling is whatever is painted lowest above the list across its
       width: the money word (HEAD px of its box, whose foot is the empty
       descender space of capitals), or a third headline line or a product
       photo (PAD px). On 8 cards a line or photo sat between the money word
       and the list, and a lift measured to the money word ran into it. */
    const LIST = new Set(['Tick 1', 'Tick 2', 'Tick 3', 'Tick Mark 1', 'Tick Mark 2', 'Tick Mark 3', 'Point 1', 'Point 2', 'Point 3']);
    const lk = L.map((l, j) => LIST.has(l.name) && refs[j] ? j : -1).filter((j) => j >= 0);
    const lb = lk.map((j) => refs[j].getBoundingRect(true, true));
    const top = Math.min(...lb.map((b) => b.top)), lL = Math.min(...lb.map((b) => b.left)), lR = Math.max(...lb.map((b) => b.left + b.width));
    let ceil = -Infinity;
    L.forEach((l, j) => {
      const o = refs[j];
      if (LIST.has(l.name) || !o || o.visible === false || !(typeof l.text === 'string' || l.kind === 'cutout')) return;
      const b = o.getBoundingRect(true, true);
      if (b.left + b.width < lL || b.left > lR || b.top >= top) return;
      ceil = Math.max(ceil, b.top + b.height + (l.role === 'headline' && l.name !== 'Headline 3' ? HEAD : PAD));
    });
    const room = Math.max(0, top - ceil);
    const pitch = L[k.p2].props.top - L[k.p1].props.top;
    sc.dispose();
    const need = GAP - gap;
    if (need <= 0) return { gap: Math.round(gap), ok: true };
    const lift = Math.max(0, Math.min(need, room));
    const close = Math.min(Math.max(0, (need - lift) / 2), Math.max(0, pitch - MIN_PITCH));
    const rec2 = JSON.parse(JSON.stringify(rec));
    const L2 = rec2.tpl.layers;
    for (let i = 1; i <= 3; i++) {
      const dy = lift + close * (i - 1);
      for (const n of ['Tick ' + i, 'Tick Mark ' + i, 'Point ' + i]) {
        const l = L2.find((x) => x.name === n);
        if (l && l.props && typeof l.props.top === 'number') l.props.top = Math.round((l.props.top - dy) * 100) / 100;
      }
    }
    const before = __sc.check(t0), after = __sc.check(await __sc.prep(rec2, id));
    const a = __sc.accept(before, after);
    const t2 = await __sc.prep(rec2, id);
    const { sc: s2, refs: r2 } = __sc.paint(t2);
    const b2 = (n) => { const j = t2.layers.findIndex((l) => l.name === n); const b = r2[j].getBoundingRect(true, true); return { t: b.top, b: b.top + b.height }; };
    const gap2 = b2('CTA Card').t - b2('Point 3').b;
    s2.dispose();
    return { gap: Math.round(gap), gap2: Math.round(gap2), lift: Math.round(lift), close: Math.round(close), accept: a.ok, fresh: a.fresh, lost: a.lost, rec2 };
  }, id, rec, GAP, HEAD, PAD, MIN_PITCH);
  if (res.skip || res.ok) { done.push(id); continue; }
  if (res.accept) {
    if (!DRY) writeFileSync(DIR + id + '.json', JSON.stringify(res.rec2));
    kept.push(`${id}: ${res.gap} -> ${res.gap2} px (lift ${res.lift}, rows closed ${res.close})`);
  } else refused.push(`${id}: ${res.gap} px, the gate refused (${JSON.stringify(res.fresh).slice(0, 160)} ${JSON.stringify(res.lost).slice(0, 160)})`);
}
await browser.close();
console.log(`${ids.length} checklistHero records; ${done.length} already clear; ${kept.length} ${DRY ? 'would move' : 'moved'}; ${refused.length} refused`);
kept.forEach((s) => console.log('  ' + s));
refused.forEach((s) => console.log('  REFUSED ' + s));
if (errors.length) console.log('page errors: ' + errors.slice(0, 5).join(' | '));
