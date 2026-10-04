#!/usr/bin/env node
/* CENTRE THE CARDS THAT LINE UP WITH NOTHING — DESIGN-LAW rule 109.
 *
 * Owner, 2026-10-02: "auto center everything please once again" (of a
 * checklist's selling points), and of a scattered Pokémon card: "it looks
 * incomplete … threw everything down and then abandoned it". Then "next
 * audit more". scripts/composition_audit.mjs names the cards; this repairs
 * them with the designer's own Centre all (app.js ccPlan), on the record:
 *
 *   1. a leftover ✓ ("Tick Mark", a text from before the rings carried
 *      icons) sitting in the first ring over its icon is removed;
 *   2. an icon on its ring that does not clear 3:1 against it (white on a
 *      pale ring at 1.1:1 read as an empty ring) takes the house ink, near
 *      black or near white, whichever clears more, measured as painted (a
 *      line icon by its stroke);
 *   3. one alignment for the whole card: every part centred as Centre all
 *      centres it (each line on its plate on the plate's middle; a corner
 *      piece stays), every line checked after painting; if any part cannot
 *      be centred, every part on the headline's left edge instead
 *      (ccPlanLeft); if neither holds, nothing moves. Lines are moved from
 *      where they are drawn, five passes at most.
 *
 * A candidate is kept only when the writers' gate accepts it (no new failure,
 * no critical line under what it had: gateRecords) and the composition is
 * better: no failure it did not have, and fewer loose parts or none left.
 *
 * usage: node scripts/centre_showcase.mjs (--ids a,b | --from audit.json) [--write] [--json f] [--out dir]
 *        [--fix-only]   the tick and the ink only (a card the centring would cost an offer)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { openStudio, gateRecords, gateSummary } from './_showcase_harness.mjs';
const ROOT = new URL('../', import.meta.url).pathname, DIR = ROOT + 'assets/showcase/';
const argv = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const WRITE = process.argv.includes('--write'), FIXONLY = process.argv.includes('--fix-only');   // the tick and the ink, no centring
let ids = argv('--ids') ? argv('--ids').split(',') : [];
if (argv('--from')) ids = ids.concat(JSON.parse(readFileSync(argv('--from'), 'utf8')).filter(r => r.fail && r.fail.length).map(r => r.id));
ids = [...new Set(ids)];
console.log('cards: ' + ids.length);

const { browser, page } = await openStudio();
const results = {};
for (let i = 0; i < ids.length; i += 4){
  Object.assign(results, await page.evaluate(async (batch, FIXONLY) => {
    const R = {};
    const keep = o => o.visible !== false && !o.pgScrim && !o.pgBgRect && (o.opacity == null || o.opacity > 0.05) && !sgGround(sgBox(o));
    const summary = c => ({ fail: c.fail, loose: c.loose.length, near: c.near.map(n => n.part + ' ' + n.dx), onWords: c.onWords.length });
    for (const id of batch){
      try {
        const rec = await fetch('assets/showcase/tpl/' + id + '.json', { cache: 'no-store' }).then(r => r.json());
        const cand = JSON.parse(JSON.stringify(rec)), L = cand.tpl.layers, notes = [];
        let n = 0;
        const paintCand = () => __sc.prep(cand, id + '__c' + (++n));
        const before = __sc.comp(await __sc.prep(rec, id + '__b')); before.sc.dispose();
        /* 1. the leftover tick */
        for (let k = L.length - 1; k >= 0; k--){
          const l = L[k];
          if (l.name === 'Tick Mark' && l.kind === 'text' && /^\s*✓\s*$/.test(l.text || '') && L.some(x => /^Tick Mark \d+$/.test(x.name || ''))){ L.splice(k, 1); notes.push('leftover tick'); }
        }
        /* 2. an icon on its ring, as painted */
        { const t = await paintCand(); const { sc, refs } = __sc.paint(t);
          const inside = (a, c) => a.cx > c.l && a.cx < c.r && a.cy > c.t && a.cy < c.b && a.w * a.h < c.w * c.h;
          L.forEach((l, k) => {
            if (l.kind !== 'circle' || !refs[k]) return;
            const ring = refs[k], rb = sgBox(ring), rl = pgLum(ring.fill);
            if (rl == null) return;
            L.forEach((m, j) => {
              if (j === k || !refs[j] || !(m.kind === 'path' || m.kind === 'text') || !m.props || !inside(sgBox(refs[j]), rb)) return;
              /* a line icon is drawn by its stroke, which the builder takes from its fill */
              const o = refs[j], ml = pgLum(typeof o.fill === 'string' && o.fill ? o.fill : o.stroke);
              if (ml == null || pgCr(rl, ml) >= 3) return;
              const ink = pgCr(rl, pgLum('#141110')) >= pgCr(rl, pgLum('#fbfaf8')) ? '#141110' : '#fbfaf8';
              m.props.fill = ink; if (m.props.stroke) m.props.stroke = ink;
              notes.push(m.name + ' ' + pgCr(rl, ml).toFixed(2) + ':1 -> ' + ink);
            });
          });
          sc.dispose(); }
        /* 3. one alignment for the whole card (owner, 2026-10-04: "align left
           for everything … or if you're going to center it then you can't
           leave the second line of the hero aligned left"): centred as Centre
           all centres, every line checked; failing that, every part on the
           headline's left edge; failing that, nothing moves. A line is moved
           from where it is drawn (the layout pass holds a line inside its
           plate's margin, and a move from the authored place below that
           margin never shows) */
        const fixed = JSON.parse(JSON.stringify(L));
        const restore = () => { L.splice(0, L.length, ...JSON.parse(JSON.stringify(fixed))); };
        const settle = async planOf => {
          let moved = 0;
          for (let pass = 0; pass < 5; pass++){
            const t = await paintCand(); const { sc, refs } = __sc.paint(t);
            const plan = planOf(sc.getObjects().filter(keep));
            let m = 0;
            refs.forEach((o, k) => {
              const dx = o && plan.shift.get(o), pr = L[k].props;
              if (!dx || Math.abs(dx) < 1 || !pr || typeof pr.left !== 'number') return;
              const base = o.text !== undefined && typeof o.left === 'number' && o.originX === (pr.originX || 'left') ? o.left : pr.left;
              pr.left = +(base + dx).toFixed(2); m++;
            });
            sc.dispose(); moved += m;
            if (!m) break;
          }
          return moved;
        };
        const ok = c => !c.fail.some(f => /^(mixed|innerMixed|nearMiss)$/.test(f));
        const axisCentred = c => c.P.filter(p => ccAxisPart(p.u) && !p.mirror).every(p => p.centred);   // the measure's own 'centred'
        if (!FIXONLY){
          const was = __sc.comp(await paintCand()); was.sc.dispose();
          if (!ok(was) || was.loose.length){
            await settle(objs => ccPlan(objs, TPL_W / 2, { top: true }));
            let c = __sc.comp(await paintCand()); const good = ok(c) && axisCentred(c); c.sc.dispose();
            if (good) notes.push('centred');
            else {
              restore();
              /* the headline's left edge: its biggest line, as drawn */
              const t0 = await paintCand(); const { sc: s0 } = __sc.paint(t0);
              const heads = s0.getObjects().filter(o => o.pgRole === 'headline' && o.visible !== false).map(o => sgBox(o)).sort((a, b) => b.w * b.h - a.w * a.h);
              s0.dispose();
              /* the side the headline stands on: its biggest line left of the
                 middle aligns everything left, right of it everything right */
              const side = heads.length && heads[0].cx > TPL_W / 2 + 15 ? 'right' : 'left';
              const x = heads.length ? (side === 'right' ? heads[0].r : heads[0].l) : null;
              if (x != null){
                await settle(objs => ccPlanLeft(objs, x, side));
                c = __sc.comp(await paintCand());
                const goodL = ok(c) && c.P.filter(p => ccAxisPart(p.u) && !p.mirror).every(p => Math.abs((side === 'right' ? p.b.r : p.b.l) - x) <= 8);
                c.sc.dispose();
                if (goodL) notes.push('aligned ' + side);
                else { restore(); notes.push('no single alignment holds'); }
              } else notes.push('no single alignment holds');
            }
          }
        }
        const after = __sc.comp(await paintCand()); after.sc.dispose();
        R[id] = { rec: cand, notes, before: summary(before), after: summary(after) };
      } catch (e){ R[id] = { err: String(e).slice(0, 200) }; }
    }
    return R;
  }, ids.slice(i, i + 4), FIXONLY));
  process.stdout.write('\r' + Math.min(i + 4, ids.length) + '/' + ids.length);
}
console.log('');
/* kept: one alignment verified (centred, or aligned left), or the tick and the ink, and no failure it did not have */
const better = r => !r.err && r.notes.some(n => /^(centred|aligned (left|right))$|tick|->/.test(n)) && r.after.fail.every(f => r.before.fail.includes(f));
const cands = Object.entries(results).filter(([, r]) => better(r));
const gate = await gateRecords(page, cands.map(([id, r]) => ({ id, rec: r.rec })));
console.log(gateSummary(gate));
const kept = cands.filter(([id]) => gate[id] && gate[id].ok);
Object.entries(results).forEach(([id, r]) => {
  const g = gate[id];
  const verdict = r.err ? 'ERROR ' + r.err : !better(r) ? 'not better' : g && g.ok ? 'KEPT' : 'gate held: ' + JSON.stringify(g && (g.fresh || g.err || g.lost));
  console.log(id.padEnd(26) + verdict.padEnd(12) + ' ' + (r.notes || []).join('; ') + (r.before ? '  ' + JSON.stringify(r.before.fail) + ' -> ' + JSON.stringify(r.after.fail) + ' loose ' + r.before.loose + '->' + r.after.loose : ''));
});
/* --out dir: the card before and after, as the library draws them, for a look by eye */
if (argv('--out')){
  mkdirSync(argv('--out'), { recursive: true });
  const show = cands.map(([id, r]) => ({ id, rec: r.rec }));
  for (let i = 0; i < show.length; i += 4){
    const shots = await page.evaluate(async batch => {
      const out = [];
      for (const { id, rec } of batch){
        const jpg = async t => { const d = renderThumb(t, 1080); const img = await new Promise(r => { const el = new Image(); el.onload = () => r(el); el.onerror = () => r(null); el.src = d; });
          const cv = document.createElement('canvas'); cv.width = cv.height = 448; cv.getContext('2d').drawImage(img, 0, 0, 448, 448); return cv.toDataURL('image/jpeg', 0.8); };
        try { out.push({ id, before: await jpg(await __sc.load(id)), after: await jpg(await __sc.prep(rec, id + '__shot')) }); } catch (e){ out.push({ id, err: String(e).slice(0, 80) }); }
      }
      return out;
    }, show.slice(i, i + 4));
    shots.forEach(s => { if (s.err) return; writeFileSync(argv('--out') + '/' + s.id + '-before.jpg', Buffer.from(s.before.split(',')[1], 'base64')); writeFileSync(argv('--out') + '/' + s.id + '-after.jpg', Buffer.from(s.after.split(',')[1], 'base64')); });
  }
}
if (WRITE){ kept.forEach(([id, r]) => writeFileSync(DIR + 'tpl/' + id + '.json', JSON.stringify(r.rec))); console.log('wrote ' + kept.length + ' records'); }
if (argv('--json')) writeFileSync(argv('--json'), JSON.stringify(Object.fromEntries(Object.entries(results).map(([id, r]) => [id, { notes: r.notes, before: r.before, after: r.after, err: r.err, gate: gate[id] && gate[id].ok, kept: kept.some(([k]) => k === id) }])), null, 1));
await browser.close();
