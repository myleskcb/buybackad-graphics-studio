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
 *      black or near white, whichever clears more, measured as painted;
 *   3. every part is centred as Centre all centres it (each line on its
 *      plate on the plate's middle; a corner piece, and a part that would
 *      land on another, stay), by moving the layers' authored `left` and
 *      painting again until nothing moves (three passes at most: the layout
 *      pass may answer a move).
 *
 * A candidate is kept only when the writers' gate accepts it (no new failure,
 * no critical line under what it had: gateRecords) and the composition is
 * better: no failure it did not have, and fewer loose parts or none left.
 *
 * usage: node scripts/centre_showcase.mjs (--ids a,b | --from audit.json) [--write] [--json f] [--out dir]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { openStudio, gateRecords, gateSummary } from './_showcase_harness.mjs';
const ROOT = new URL('../', import.meta.url).pathname, DIR = ROOT + 'assets/showcase/';
const argv = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const WRITE = process.argv.includes('--write');
let ids = argv('--ids') ? argv('--ids').split(',') : [];
if (argv('--from')) ids = ids.concat(JSON.parse(readFileSync(argv('--from'), 'utf8')).filter(r => r.fail && r.fail.length).map(r => r.id));
ids = [...new Set(ids)];
console.log('cards: ' + ids.length);

const { browser, page } = await openStudio();
const results = {};
for (let i = 0; i < ids.length; i += 4){
  Object.assign(results, await page.evaluate(async batch => {
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
              const ml = pgLum(refs[j].fill);
              if (ml == null || pgCr(rl, ml) >= 3) return;
              const ink = pgCr(rl, pgLum('#141110')) >= pgCr(rl, pgLum('#fbfaf8')) ? '#141110' : '#fbfaf8';
              m.props.fill = ink; notes.push(m.name + ' ' + pgCr(rl, ml).toFixed(2) + ':1 -> ' + ink);
            });
          });
          sc.dispose(); }
        /* 3. centred as Centre all centres */
        let moved = 0;
        for (let pass = 0; pass < 3; pass++){
          const t = await paintCand(); const { sc, refs } = __sc.paint(t);
          const plan = ccPlan(sc.getObjects().filter(keep), TPL_W / 2, { top: true });
          let m = 0;
          refs.forEach((o, k) => { const dx = o && plan.shift.get(o); if (dx && Math.abs(dx) >= 1 && L[k].props && typeof L[k].props.left === 'number'){ L[k].props.left = +(L[k].props.left + dx).toFixed(2); m++; } });
          sc.dispose(); moved += m;
          if (!m) break;
        }
        if (moved) notes.push('centred');
        const after = __sc.comp(await paintCand()); after.sc.dispose();
        R[id] = { rec: cand, notes, before: summary(before), after: summary(after) };
      } catch (e){ R[id] = { err: String(e).slice(0, 200) }; }
    }
    return R;
  }, ids.slice(i, i + 4)));
  process.stdout.write('\r' + Math.min(i + 4, ids.length) + '/' + ids.length);
}
console.log('');
const better = r => !r.err && r.notes.length && r.after.fail.every(f => r.before.fail.includes(f)) && (r.after.loose < r.before.loose || !r.after.fail.length || r.notes.some(n => /tick|->/.test(n)));
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
