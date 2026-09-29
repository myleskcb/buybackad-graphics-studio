#!/usr/bin/env node
/* VERIFY — the gate over the library, before a commit.
 *
 * Runs the one measure (app.js pgCheck, through __sc.check) over every live
 * showcase card and exits 1 if any fails it: a critical line under 3:1, the
 * number under 72px or a digit under 3:1, the number off its plate or on the
 * product, the headline unreadable as a tile, copy inside the guides or on
 * other copy. Warnings are counted, not fatal. With --write it stamps the
 * gate's numbers (legib, num, numInk, gate: fail codes) on the index, the
 * same fields the audits stamp, from the same measure.
 *
 * usage: node scripts/verify_showcase.mjs [--ids a,b] [--all] [--write] [--json f]
 *        node scripts/verify_showcase.mjs --classics [--json f]   # the 243 classics in app.js, same measure
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { openStudio, live } from './_showcase_harness.mjs';
const DIR = new URL('../assets/showcase/', import.meta.url).pathname;
const argv = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const WRITE = process.argv.includes('--write'), ALL = process.argv.includes('--all'), CLASSICS = process.argv.includes('--classics');
const raw = readFileSync(DIR + 'index.json', 'utf8'), idx = JSON.parse(raw);
const only = argv('--ids') ? new Set(argv('--ids').split(',')) : null;
const { browser, page, errors } = await openStudio();
/* the classics: the templates app.js builds at load (the Easy Mode strip),
   measured after their fix tables (contrast, number, ground) have landed */
const work = CLASSICS
  ? (await (async () => { await new Promise(r => setTimeout(r, 3000)); return page.evaluate(() => TEMPLATES.filter(t => !t.showcase).map(t => ({ id: t.id, cat: t.cat }))); })()).filter(c => !only || only.has(c.id))
  : idx.filter(c => only ? only.has(c.id) : (ALL || live(c)));
console.log('verifying ' + work.length + (CLASSICS ? ' classics' : ' cards'));
const out = {};
for (let i = 0; i < work.length; i += 6){
  Object.assign(out, await page.evaluate(async (ids, classics) => { const R = {};
    for (const id of ids){ try { const t = classics ? TEMPLATES.find(x => x.id === id) : await __sc.load(id); R[id] = __sc.check(t); } catch (e){ R[id] = { err: String(e).slice(0, 160) }; } }
    return R; }, work.slice(i, i + 6).map(c => c.id), CLASSICS));
  if (i % 120 === 0 && i) console.log('…' + i + '/' + work.length);
}
await browser.close();
const rows = work.map(c => ({ c, r: out[c.id] })), errs = rows.filter(x => !x.r || x.r.err), fails = rows.filter(x => x.r && !x.r.err && !x.r.ok);
const codes = {}; fails.forEach(x => x.r.fails.forEach(f => codes[f.code] = (codes[f.code] || 0) + 1));
const warns = {}; rows.forEach(x => (x.r && x.r.warns || []).forEach(w => warns[w.code] = (warns[w.code] || 0) + 1));
const med = a => { const s = a.slice().sort((p, q) => p - q); return s.length ? s[s.length >> 1] : null; };
console.log(`pass ${rows.length - fails.length - errs.length} · FAIL ${fails.length} · errors ${errs.length} · page errors ${errors.length}`);
console.log(`fails by code: ${JSON.stringify(codes)} · warns: ${JSON.stringify(warns)}`);
console.log(`median worst-critical ${med(rows.filter(x => x.r && x.r.legib != null).map(x => Math.min(21, x.r.legib)))?.toFixed(2)} · median number ${med(rows.filter(x => x.r && x.r.number).map(x => x.r.number))}px`);
fails.slice(0, 25).forEach(x => console.log('  ' + x.c.id.padEnd(28) + x.r.fails.map(f => f.code + (f.line ? ' ' + f.line : '') + (f.value != null ? ' ' + f.value : '')).join(' · ')));
if (WRITE && CLASSICS){
  /* the classics have no records: the ids that fail go to a table app.js reads (loadClassicsGate) */
  const ids = fails.map(x => x.c.id).sort();
  writeFileSync(DIR + '../classics-gate.json', JSON.stringify({ about: 'Classics that fail the gate (scripts/verify_showcase.mjs --classics --write): app.js loadClassicsGate() keeps them out of every list. Rule 87.', date: new Date().toISOString().slice(0, 10), ids }, null, 1) + '\n');
  console.log('wrote assets/classics-gate.json: ' + ids.length + ' classics held back');
}
if (WRITE && !CLASSICS){
  rows.forEach(x => { if (!x.r || x.r.err) return; x.c.legib = x.r.legib; if (x.r.number != null) x.c.num = x.r.number; if (x.r.numInk != null) x.c.numInk = x.r.numInk;
    if (x.r.fails.length) x.c.gate = x.r.fails.map(f => f.code); else delete x.c.gate;
    /* the index says what the record says: blur (the hero wall filters on it) and the ground kind */
    try { const b = JSON.parse(readFileSync(DIR + 'tpl/' + x.c.id + '.json', 'utf8')).tpl.bg || {}; x.c.blur = b.blur || 0;
      if (!x.c.ground) x.c.ground = /\/grounds\//.test(b.src || '') ? 'money' : (b.blur || 0) >= 1 ? 'blurred' : /^ground:/.test(b.src || '') ? 'drawn' : /^overlay:/.test(b.src || '') ? 'photo+pattern' : 'photo'; } catch (e){} });
  writeFileSync(DIR + 'index.json', JSON.stringify(idx) + (raw.endsWith('\n') ? '\n' : ''));
  console.log('stamped legib / num / numInk / gate on ' + (rows.length - errs.length) + ' index rows');
}
if (argv('--json')) writeFileSync(argv('--json'), JSON.stringify(out));
process.exit(fails.length || errs.length ? 1 : 0);
