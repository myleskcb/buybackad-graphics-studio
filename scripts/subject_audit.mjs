#!/usr/bin/env node
/* SUBJECT AUDIT: does a product cover its photograph's subject? (app.js productYield)

   The owner, 2026-09-27: "we don't want it to entirely cover the content of
   our background subject, if possible sometimes it's OK or a little bit but
   consistently starts to look bad or confusing, especially when we're talking
   about centered images and then we happen to center something on top of it".

   Every template that stands a product on a mapped photograph (photo-subjects.js),
   in every family: the Studio's own (designer, street, offer) and every
   showcase card. Each is painted the way its thumbnail is (renderThumb's
   sequence), once with productYield off and once with it on, and each
   product's cover of the subject is measured: M, the share of the
   photograph's subject under it, against A, its share of the card. A product
   covers the subject when M >= 0.3 and M >= 1.35 A (a full-frame texture is
   covered in proportion, and that is fine).

   usage: python3 -m http.server 8899   then
          CHROME=... [FABRIC_JS=...] node scripts/subject_audit.mjs [--ids a,b | --fam offer,street] [--sheet [--all-pics]]
   Writes .render/subjects/audit.json (and with --sheet, before/after pictures of
   every card that moved or still covers). */
import { mkdirSync, writeFileSync } from 'node:fs';
import { openStudio } from './_showcase_harness.mjs';

const argv = process.argv.slice(2), arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const IDS = arg('--ids', '') ? arg('--ids', '').split(',') : null, SHEET = argv.includes('--sheet'), ALL = argv.includes('--all-pics');
const FAMS = arg('--fam', '') ? arg('--fam', '').split(',') : null;   // e.g. --fam offer,street
const OUT = new URL('../.render/subjects/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

let { browser, page, errors } = await openStudio('&noholds=1');
const list = await page.evaluate(async (IDS) => {
  const fam = t => t.tag === 'offer' ? 'offer' : t.tag === 'designer' ? 'designer' : t.tag === 'street' ? 'street' : 'classic';
  const has = t => t.bg && t.bg.type === 'image' && (t.layers || []).some(l => l.kind === 'cutout');
  const out = TEMPLATES.filter(t => !/^sc-/.test(t.id) && has(t)).map(t => ({ id: t.id, fam: fam(t), cat: t.cat, src: t.bg.src }));
  for (const c of await scLoadIndex()){
    const rec = await fetch('assets/showcase/tpl/' + c.id + '.json').then(r => r.json()).catch(() => null);
    if (rec && rec.tpl && has(rec.tpl)) out.push({ id: 'sc:' + c.id, fam: 'showcase', cat: c.cat, src: rec.tpl.bg.src });
  }
  return IDS ? out.filter(x => IDS.includes(x.id) || IDS.includes(x.id.replace(/^sc:/, ''))) : out;
}, IDS);
if (FAMS) list.splice(0, list.length, ...list.filter(x => FAMS.includes(x.fam)));
console.log('templates with a product on a photograph:', list.length);

const rows = [];
for (const [n, c] of list.entries()){
  if (n && n % 60 === 0){ await browser.close().catch(() => {}); ({ browser, page, errors } = await openStudio('&noholds=1')); }
  const r = await page.evaluate(async (c, SHEET) => {
    const t = c.id.startsWith('sc:') ? await __sc.load(c.id.slice(3)) : await __sc.prep({ base: c.id, tpl: TEMPLATES.find(x => x.id === c.id) }, c.id);
    const shot = sc => SHEET ? sc.toDataURL({ format: 'jpeg', quality: 0.8, multiplier: 360 / sc.width }).split(',')[1] : null;
    window.__noProductYield = true;
    const a = __sc.paint(t);
    const before = subjectCover(a.sc, TPL_W, TPL_H), imgA = shot(a.sc);
    a.sc.dispose();
    window.__noProductYield = false;
    const b = __sc.paint(t);
    const after = subjectCover(b.sc, TPL_W, TPL_H), moved = b.sc.pgYield || [], imgB = shot(b.sc);
    b.sc.dispose();
    return { mapped: !!photoSubjectGrid(c.src), before, after, moved, imgA, imgB };
  }, c, SHEET).catch(e => ({ err: String(e && e.message || e) }));
  if (r.err){ rows.push(Object.assign({}, c, { err: r.err })); console.log(`[${n + 1}/${list.length}] ${c.id} ERROR ${r.err}`); continue; }
  const covers = x => (x || []).filter(p => p.covers);
  const row = Object.assign({}, c, { mapped: r.mapped, before: r.before, after: r.after, moved: r.moved,
    coversBefore: covers(r.before).length, coversAfter: covers(r.after).length });
  rows.push(row);
  if (SHEET && (ALL || r.moved.length || row.coversAfter)){
    const safe = c.id.replace(/[^a-z0-9_-]/gi, '_');
    writeFileSync(`${OUT}${safe}-before.jpg`, Buffer.from(r.imgA, 'base64'));
    writeFileSync(`${OUT}${safe}-after.jpg`, Buffer.from(r.imgB, 'base64'));
  }
  if (r.moved.length || row.coversAfter)
    console.log(`[${n + 1}/${list.length}] ${c.fam} ${c.id}  ` + (r.moved.length ? 'moved ' + r.moved.map(m => `${m.name} ${m.from}->${m.to} (${m.dx},${m.dy}${m.s !== 1 ? ' x' + m.s : ''})`).join(', ') : '') + (row.coversAfter ? '  STILL COVERS ' + covers(r.after).map(p => p.name + ' ' + p.M).join(', ') : ''));
}
await browser.close();
const fams = {};
rows.filter(r => !r.err).forEach(r => {
  const f = fams[r.fam] || (fams[r.fam] = { n: 0, mapped: 0, coveredBefore: 0, moved: 0, coveredAfter: 0 });
  f.n++; if (r.mapped) f.mapped++; if (r.coversBefore) f.coveredBefore++; if (r.moved.length) f.moved++; if (r.coversAfter) f.coveredAfter++;
});
writeFileSync(OUT + 'audit.json', JSON.stringify({ made: new Date().toISOString(), fams, rows: rows.map(r => { const x = Object.assign({}, r); return x; }) }, null, 1));
console.log('\n' + Object.entries(fams).map(([k, v]) => `${k}: ${v.n} cards, ${v.mapped} on a mapped photograph, ${v.coveredBefore} covered its subject, ${v.moved} moved, ${v.coveredAfter} still cover`).join('\n'));
console.log('errors: ' + rows.filter(r => r.err).length + ', page errors ' + errors.length + (errors.length ? ' ' + errors.slice(0, 3).join(' | ') : ''));
