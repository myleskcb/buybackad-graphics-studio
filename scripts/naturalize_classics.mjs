#!/usr/bin/env node
/* THE CLASSICS' PHOTOGRAPHS IN THEIR OWN COLOUR.
 *
 * Same finding and same method as scripts/naturalize_showcase.mjs, for the 243
 * classics the pass chain builds at load. Counted 2026-09-26: 129 of them
 * colour-grade their photograph (assignStyle() in app.js: 89 'duotone', the
 * photo multiplied into the category's money hue and screened with its
 * complement; 41 'wash', the photo driven through one hue). The owner: "not
 * these ugly hideous overlaid colors and duotone background images."
 *
 * The classics have no records to rewrite, so this writes a table,
 * assets/ground-fix.json, that app.js applies after the pass chain (the same
 * shape as the contrast and number tables): per template, the photograph with
 * no grade, and a NEUTRAL scrim (black under light ink, the street family's
 * paper white under dark ink) in the classics' own gradient mode, its strength
 * solved on the template's own pixels by __sc.naturalGround() in
 * _showcase_harness.mjs (DESIGN-LAW rule 52): every line on the photograph
 * keeps the worst end of its ground where it clears 4.5:1 against its ink, or
 * where the graded ground kept it if that was further. Text on its own plate is
 * left out: the plate owns its ground. So no line loses contrast and the
 * measured inks (contrast-fix.json) stay right.
 *
 * The page is opened with ?noground=1, so it measures the graded state this
 * replaces, with the contrast and number tables applied (the inks and the
 * number block the visitor sees).
 *
 * usage: node scripts/naturalize_classics.mjs [--write] [--ids a,b] [--json out.json]
 */
import { writeFileSync } from 'node:fs';
import { openStudio } from './_showcase_harness.mjs';
const ROOT = new URL('../', import.meta.url).pathname;
const WRITE = process.argv.includes('--write');
const argv = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const only = argv('--ids') ? new Set(argv('--ids').split(',')) : null;
export const PAPER = '#f4f1ec';

const { browser, page, errors } = await openStudio('&noground=1');
/* the contrast and number tables are fetched after boot; wait for both */
await page.waitForFunction(() => Array.isArray(CONTRAST_FIX) && CONTRAST_FIX.length, { timeout: 60000 }).catch(() => {});
await new Promise(r => setTimeout(r, 3000));
const ids = (await page.evaluate(() => TEMPLATES
  .filter(t => !/^(sc|hx)-/.test(t.id) && t.bg && t.bg.type === 'image' && t.bg.grade && t.bg.grade.shadow)
  .map(t => t.id))).filter(id => !only || only.has(id));
const out = {};
for (let i = 0; i < ids.length; i += 6){
  Object.assign(out, await page.evaluate(async (ids, PAPER) => {
    const R = {};
    for (const id of ids){
      try {
        const t = await __sc.prep({ base: id, tpl: { cat: (TEMPLATES.find(x => x.id === id) || {}).cat } }, id);
        const was = { style: (TEMPLATES.find(x => x.id === id) || {}).style, scrim: t.bg.scrim || 0, scrimMode: t.bg.scrimMode || null };
        /* the classics keep their gradient scrim (strong where the type is, the
           middle of the photograph left alive); an even one only if the
           gradient cannot hold every line at any strength */
        const r = __sc.naturalGround(t, { grade: null, dark: null, light: PAPER, modes: [t.bg.scrimMode || 'gradient', 'normal'] });
        if (r.bg) Object.assign(r, { src: t.bg.src, was });
        R[id] = r;
      } catch (e){ R[id] = { err: String(e).slice(0, 160) }; }
    }
    return R;
  }, ids.slice(i, i + 6), PAPER));
  if (i % 60 === 0) console.log('…' + Math.min(ids.length, i + 6) + '/' + ids.length);
}
await browser.close();
const rows = Object.entries(out);
const done = rows.filter(([, r]) => r.bg), errs = rows.filter(([, r]) => r.err), skips = rows.filter(([, r]) => r.skip);
const med = a => { const s = a.slice().sort((p, q) => p - q); return s.length ? s[Math.floor(s.length / 2)] : 0; };
console.log(`\ngraded classics ${rows.length} · natural ${done.length} · skipped ${skips.length} · errors ${errs.length} · page errors ${errors.length}`);
console.log(`was: ${JSON.stringify(done.reduce((m, [, r]) => (m[r.was.style] = (m[r.was.style] || 0) + 1, m), {}))}`);
console.log(`scrim: black under light ink ${done.filter(([, r]) => r.light).length}, paper under dark ink ${done.filter(([, r]) => !r.light).length}; `
  + `even ${done.filter(([, r]) => r.bg.scrimMode === 'normal').length}; strength median ${med(done.map(([, r]) => r.bg.scrim))} (was ${med(done.map(([, r]) => r.was.scrim))}), max ${Math.max(0, ...done.map(([, r]) => r.bg.scrim))}`);
console.log(`lines held at an old ground already under 4.5:1: ${done.reduce((s, [, r]) => s + (r.shortBefore || 0), 0)}`);
skips.forEach(([id, r]) => console.log('  SKIP', id, r.skip));
errs.slice(0, 4).forEach(([id, r]) => console.log('  ERR', id, r.err));
if (argv('--json')) writeFileSync(argv('--json'), JSON.stringify(out));
if (WRITE){
  const table = done.map(([id, r]) => ({ id, src: r.src, bg: { scrim: r.bg.scrim, scrimColor: r.bg.scrimColor, scrimMode: r.bg.scrimMode } })).sort((a, b) => a.id < b.id ? -1 : 1);
  writeFileSync(ROOT + 'assets/ground-fix.json', JSON.stringify(table));
  console.log('wrote assets/ground-fix.json: ' + table.length + ' templates');
}
