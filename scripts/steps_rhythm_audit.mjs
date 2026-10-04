/* THE STEPS RHYTHM AUDIT (DESIGN-LAW 112): every Steps Flow card (the classics
 * and every showcase record), painted the way renderThumb() paints it, and two
 * questions asked of the laid-out scene:
 *   gaps   step 1 to 2, 2 to 3, and step 3 to the CTA plate, from the objects'
 *          own boxes: one rhythm when all three are within 2px of each other;
 *   colour whether the CTA plate reads as a fourth step: the plate and the
 *          step cards both neutral and within 0.35 in OKLab lightness, or
 *          within 0.08 of each other in OKLab.
 * The owner (2026-10-02): "continue the same margin between each bubble".
 * Exits 1 when any card fails either.
 *   node scripts/steps_rhythm_audit.mjs [--ids a,b] [--before] [--json out.json]
 * --before turns the two passes off (window.__pgStepRhythmOff,
 * __pgCtaStandOutOff), so the same script measures what they changed. */
import { openStudio } from './_showcase_harness.mjs';
import { readdirSync, writeFileSync } from 'node:fs';
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const only = arg('--ids') ? new Set(arg('--ids').split(',')) : null;
const before = process.argv.includes('--before');
const ids = readdirSync('assets/showcase/tpl').filter(f => /^stepsFlow-.*\.json$/.test(f)).map(f => f.slice(0, -5)).filter(id => !only || only.has(id));
const { browser, page, errors } = await openStudio();
if (before) await page.evaluate(() => { window.__pgStepRhythmOff = true; window.__pgCtaStandOutOff = true; });
const classics = await page.evaluate(() => TEMPLATES.filter(t => (t.layers || []).some(l => l.name === 'Step Card 1') && !/^hx-/.test(t.id)).map(t => t.id));
const measure = (id, classic) => page.evaluate(async (id, classic) => {
  const t = classic ? TEMPLATES.find(x => x.id === id) : await __sc.load(id);
  const { sc } = __sc.paint(t);
  const objs = sc.getObjects();
  const find = n => objs.find(x => x.name === n && x.visible !== false);
  const box = o => { if (!o) return null; o.setCoords(); const b = o.getBoundingRect(true, true); return { x: b.left, y: b.top, w: b.width, h: b.height }; };
  const s = [1, 2, 3].map(i => box(find('Step Card ' + i))), plate = find('Phone Plate'), cta = box(plate), card = find('Step Card 1');
  let same = null, fills = null;
  if (plate && card && typeof plate.fill === 'string' && typeof card.fill === 'string'){
    const pp = thParse(plate.fill), cp = thParse(card.fill);
    if (pp && cp && pp.a >= 0.85 && cp.a >= 0.45){
      const pk = hexToOklch(pp.hex), ck = hexToOklch(cp.hex);
      const lab = k => [k.L, k.C * Math.cos(k.h * Math.PI / 180), k.C * Math.sin(k.h * Math.PI / 180)];
      const p = lab(pk), q = lab(ck), d = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
      same = d < 0.08 || (!pgHueOf(pp.hex) && !pgHueOf(cp.hex) && Math.abs(pk.L - ck.L) < 0.35);
    }
    fills = [card.fill, plate.fill];
  }
  const r = pgCheck(sc);
  sc.dispose();
  return { id, s1: s[0], s2: s[1], s3: s[2], cta, same, fills, gate: r.fails.map(f => f.code + (f.line ? ':' + f.line : '')) };
}, id, classic);
const rows = [];
for (const id of classics.filter(id => !only || only.has(id))) rows.push(Object.assign(await measure(id, true), { classic: true }));
for (const id of ids) rows.push(await measure(id, false));
let bad = 0;
const f = v => v == null ? '  -  ' : String(Math.round(v)).padStart(5);
console.log((before ? 'BEFORE (passes off)\n' : '') + 'card'.padEnd(28), ' g12  g23  g3c  rowH  colour  gate');
for (const r of rows){
  if (!r.s1 || !r.s2 || !r.s3 || !r.cta){ console.log(r.id.padEnd(28), 'missing a bubble'); bad++; continue; }
  r.g12 = r.s2.y - (r.s1.y + r.s1.h); r.g23 = r.s3.y - (r.s2.y + r.s2.h); r.g3c = r.cta.y - (r.s3.y + r.s3.h);
  r.even = Math.max(r.g12, r.g23, r.g3c) - Math.min(r.g12, r.g23, r.g3c) <= 2;
  r.ok = r.even && !r.same;
  if (!r.ok) bad++;
  console.log(r.id.padEnd(28), f(r.g12), f(r.g23), f(r.g3c), f(r.s1.h), r.same ? ' SAME ' : '  ok  ', (r.gate.join(',') || '-').padEnd(16),
    r.ok ? '' : '  <-- ' + [!r.even && 'uneven', r.same && 'CTA reads as a fourth step'].filter(Boolean).join(', '));
}
console.log(`\n${rows.length} cards, ${bad} failing · page errors ${errors.length}`);
if (arg('--json')) writeFileSync(arg('--json'), JSON.stringify(rows, null, 1));
await browser.close();
process.exit(bad ? 1 : 0);
