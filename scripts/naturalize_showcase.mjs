#!/usr/bin/env node
/* THE PHOTOGRAPH IN ITS OWN COLOUR, AND SHADE WHERE THE WORDS NEED IT.
 *
 * The owner, 2026-09-26, on the showcase: "not these ugly hideous overlaid
 * colors and duotone background images." Counted: 766 of 971 cards painted
 * their photograph as a duotone (grade.treat 'duo', shadows and highlights in
 * two palette colours), and 483 distinct tinted veils (scrimColor) sat over
 * photographs across the set, pastel pinks and mints among them.
 *
 * The study session's layering ladder says what belongs there instead: rung 0
 * is the ground (the photograph), rung 1 is atmosphere, "light and shade,
 * never an object". Colour has a role, not a coat: the accent on the plate and
 * the money word, near-black or near-white ink, and the photograph as shot.
 *
 * So every card gets:
 *   - the photograph in its own colour (grade.treat 'natural': a touch of
 *     contrast, nothing else; a card already shown 'raw', as shot, stays so),
 *     keeping its blur;
 *   - a NEUTRAL scrim, near-black under light ink or near-white under dark
 *     ink, and never a tint;
 *   - the scrim's strength SOLVED, not guessed (DESIGN-LAW rule 52: a finished
 *     card may change colour only if it keeps its luminance, judged on its own
 *     pixels), by __sc.naturalGround() in _showcase_harness.mjs: every line on
 *     the photograph (text on its own plate is left out: the plate owns its
 *     ground) keeps the worst end of its ground where it clears 4.5:1 against
 *     its ink, or where the old ground kept it if that was further. The
 *     lightest scrim that does both, so no line loses contrast and none is
 *     shaded darker than it needs.
 *
 * A card already natural or raw under a neutral scrim is left alone.
 * The legibility and design-school audits re-measure every card afterwards.
 *
 * usage: node scripts/naturalize_showcase.mjs [--write] [--ids a,b] [--json out.json]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { openStudio } from './_showcase_harness.mjs';
const ROOT = new URL('../', import.meta.url).pathname, DIR = ROOT + 'assets/showcase/';
const WRITE = process.argv.includes('--write');
const argv = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const idx = JSON.parse(readFileSync(DIR + 'index.json', 'utf8'));
const only = argv('--ids') ? new Set(argv('--ids').split(',')) : null;
const work = idx.filter(c => !only || only.has(c.id)).map(c => c.id);
export const DARK = '#0b0b0d', LIGHT = '#f6f6f4';
const recOf = id => JSON.parse(readFileSync(DIR + 'tpl/' + id + '.json', 'utf8'));

const neutral = h => { const m = /^#?([0-9a-f]{6})$/i.exec(String(h || '')); if (!m) return !h;
  const n = parseInt(m[1], 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return Math.max(...c) - Math.min(...c) <= 12 && (Math.max(...c) < 40 || Math.min(...c) > 200); };
const { browser, page, errors } = await openStudio();
const out = {};
for (let i = 0; i < work.length; i += 6){
  const ids = work.slice(i, i + 6);
  Object.assign(out, await page.evaluate(async (ids, DARK, LIGHT, calm) => {
    const R = {};
    for (const id of ids){
      try {
        const t = await __sc.load(id), bg = t.bg || {};
        if (bg.type !== 'image' || !bg.src){ R[id] = { skip: 'no photograph' }; continue; }
        const treat = bg.grade && bg.grade.treat;
        if ((treat === 'natural' || treat === 'raw') && calm[id]){ R[id] = { skip: 'already natural' }; continue; }
        const r = __sc.naturalGround(t, { grade: { treat: treat === 'raw' ? 'raw' : 'natural' }, dark: DARK, light: LIGHT, modes: ['normal'],
                                          flip: { dark: DARK, light: LIGHT } });
        if (r.bg) r.was = { treat: treat || null, scrim: bg.scrim || 0, scrimColor: bg.scrimColor || null };
        R[id] = r;
      } catch (e){ R[id] = { err: String(e).slice(0, 160) }; }
    }
    return R;
  }, ids, DARK, LIGHT, Object.fromEntries(ids.map(id => [id, neutral(recOf(id).tpl.bg && recOf(id).tpl.bg.scrimColor)]))));
  if (i % 120 === 0) console.log('…' + (i + ids.length) + '/' + work.length);
}
await browser.close();
const rows = Object.entries(out);
const done = rows.filter(([, r]) => r.bg), errs = rows.filter(([, r]) => r.err), skips = rows.filter(([, r]) => r.skip);
const med = a => { const s = a.slice().sort((p, q) => p - q); return s.length ? s[Math.floor(s.length / 2)] : 0; };
console.log(`\ncards ${rows.length} · naturalized ${done.length} · skipped ${skips.length} · errors ${errs.length} · page errors ${errors.length}`);
console.log(`was: ${JSON.stringify(done.reduce((m, [, r]) => (m[r.was.treat || 'none'] = (m[r.was.treat || 'none'] || 0) + 1, m), {}))}`);
console.log(`scrim now: dark under light ink ${done.filter(([, r]) => r.light).length}, light under dark ink ${done.filter(([, r]) => !r.light).length}; strength median ${med(done.map(([, r]) => r.bg.scrim))} (was ${med(done.map(([, r]) => r.was.scrim))}), max ${Math.max(0, ...done.map(([, r]) => r.bg.scrim))}`);
console.log(`lines held at an old ground already under 4.5:1: ${done.reduce((s, [, r]) => s + (r.shortBefore || 0), 0)}`);
console.log(`cards whose neutral lines took one ink direction: ${done.filter(([, r]) => r.flipped).length} (${done.reduce((s, [, r]) => s + (r.flipped ? r.flipped.length : 0), 0)} lines)`);
skips.filter(([, r]) => r.skip !== 'already natural').slice(0, 12).forEach(([id, r]) => console.log('  SKIP', id, r.skip));
errs.slice(0, 4).forEach(([id, r]) => console.log('  ERR', id, r.err));
if (argv('--json')) writeFileSync(argv('--json'), JSON.stringify(out));
if (WRITE){
  const byId = Object.fromEntries(idx.map(c => [c.id, c]));
  done.forEach(([id, r]) => {
    const f = DIR + 'tpl/' + id + '.json', rec = JSON.parse(readFileSync(f, 'utf8'));
    rec.tpl.bg = r.bg;
    /* a neutral line that took the other ink: its fill, and no gradient,
       outline or dimming left over from the old ink (rule 45) */
    (r.flipped || []).forEach(f => { const l = rec.tpl.layers.find(x => x.name === f.name); if (!l || !l.props) return;
      l.props.fill = f.fill; delete l.props.grad; delete l.props.stroke; delete l.props.strokeWidth;
      if (typeof l.props.opacity === 'number' && l.props.opacity < 1) l.props.opacity = 1; });
    writeFileSync(f, JSON.stringify(rec));
    if (byId[id]) byId[id].treat = r.bg.grade.treat;
  });
  writeFileSync(DIR + 'index.json', JSON.stringify(idx));
  console.log('wrote ' + done.length + ' records');
}
