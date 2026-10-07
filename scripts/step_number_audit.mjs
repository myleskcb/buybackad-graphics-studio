#!/usr/bin/env node
/* THE STEP NUMBER AUDIT: is each step's numeral in the middle of its circle?
 * Every Steps Flow card (the classics with a "Step Num Box" and every
 * showcase record), painted the way renderThumb() paints it, and the
 * numeral's INK (the pixels it draws, shadow off: pgInkBox) measured against
 * its "Step Num Box": off centre is more than 1px either way.
 * The owner (2026-10-07): "why do some of the numbered templates not show
 * centered numbers in the circles". Exits 1 when any card fails.
 *   node scripts/step_number_audit.mjs [--before] [--json out.json]
 * --before turns the pass off (window.__pgStepNumOff), so the same script
 * measures what it changed. (:8899 + Chrome; CHROME=, FABRIC_JS=) */
import { openStudio } from './_showcase_harness.mjs';
import { readdirSync, writeFileSync } from 'node:fs';
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const before = process.argv.includes('--before'), LIMIT = before ? 2 : 1;
const ids = readdirSync('assets/showcase/tpl').filter(f => /^stepsFlow-.*\.json$/.test(f)).map(f => f.slice(0, -5));
const { browser, page, errors } = await openStudio();
if (before) await page.evaluate(() => { window.__pgStepNumOff = true; });
await page.evaluate(() => { window.__ink = o => pgInkBox(o); });
const classics = await page.evaluate(() => TEMPLATES.filter(t => (t.layers || []).some(l => /^Step Num Box/.test(l.name || '')) && !/^hx-/.test(t.id)).map(t => t.id));
const measure = (id, classic) => page.evaluate(async (id, classic) => {
  const t = classic ? TEMPLATES.find(x => x.id === id) : await __sc.load(id);
  const { sc } = __sc.paint(t);
  const objs = sc.getObjects();
  const out = [];
  for (let i = 1; i <= 4; i++){
    const nb = objs.find(o => o.name === 'Step Num Box ' + i && o.visible !== false), nt = objs.find(o => o.name === 'Step Num ' + i && o.visible !== false);
    if (!nb || !nt) continue;
    nb.setCoords(); const B = nb.getBoundingRect(true, true), I = __ink(nt);
    if (!I) continue;
    out.push({ i, dx: +(((I.l + I.r) / 2) - (B.left + B.width / 2)).toFixed(1), dy: +(((I.t + I.b) / 2) - (B.top + B.height / 2)).toFixed(1), font: nt.fontFamily, w: nt.fontWeight, size: nt.fontSize, box: [Math.round(B.width), Math.round(B.height)], ink: [Math.round(I.r - I.l), Math.round(I.b - I.t)] });
  }
  return out;
}, id, classic);
const res = {};
for (const id of classics) res[id] = await measure(id, true);
for (const id of ids) res[id] = await measure(id, false);
if (arg('--json')) writeFileSync(arg('--json'), JSON.stringify(res, null, 1));
const off = Object.entries(res).filter(([, r]) => r.some(s => Math.abs(s.dx) > LIMIT || Math.abs(s.dy) > LIMIT));
console.log('cards', Object.keys(res).length, '· classics', classics.join(','), '· numerals off their circle\'s middle by more than ' + LIMIT + 'px:', off.length + (before ? ' (pass off)' : ''));
off.slice(0, 90).forEach(([id, r]) => console.log(id.padEnd(26), r.map(s => `#${s.i} dx ${String(s.dx).padStart(5)} dy ${String(s.dy).padStart(5)} ${s.font} ${s.w} ${s.size}`).join(' | ')));
console.log('page errors', errors.length ? errors : 'none');
await browser.close();
process.exit(off.length || errors.length ? 1 : 0);
