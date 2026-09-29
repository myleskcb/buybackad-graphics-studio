#!/usr/bin/env node
/* SHOWCASE LEGIBILITY AUDIT — the showcase is what the landing page sells, and
 * until 2026-09-22 the legibility audit only ever ran over the 243 classic
 * templates in app.js. This runs the same diff method (legibility_audit.mjs:
 * paint with the layer, paint without it, and the pixels that changed ARE the
 * ink over the real ground) over every assets/showcase record, through the
 * studio's own buildLayer()/alignPass()/freshBgImage().
 *
 * Per card it records:
 *   legib      worst contrast of a headline / phone / CTA layer (core, below)
 *   legibMin   worst contrast of any other reading layer
 *   ghost      reading layers that barely marked the canvas (<1.2% of box)
 *   bgMissing  the record names a photograph the studio could not load
 *
 * Thresholds: a CRITICAL layer under 3:1 (WCAG AA large text) is a defect;
 * minor layers are reported, not stamped.
 *
 * A layer's contrast is the CORE of its strokes, the upper quartile of the
 * per-pixel contrast over the pixels it changes, not their mean (2026-09-26).
 * The changed pixels are the ink AND its soft shadow, glow and anti-aliased
 * edge, and on a 26px label with a soft shadow more than half of them are
 * shadow: "GET YOUR OFFER", #101014 on a cyan plate at 6:1 by colour, measured
 * a mean of 2.85 (median pixel 1.3, upper quartile 5.6) and was held back as
 * unreadable. A line that is truly unreadable has no core either: white on a
 * pale photograph measured 1.36 mean and 1.45 upper quartile. The mean is
 * still recorded per layer (`mean`), so the change can be seen.
 *
 * usage: node scripts/audit_showcase_legibility.mjs [--write] [--json out.json]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { openStudio } from './_showcase_harness.mjs';
const ROOT = new URL('../', import.meta.url).pathname;
const WRITE = process.argv.includes('--write');
const J = process.argv.indexOf('--json');
const idx = JSON.parse(readFileSync(ROOT + 'assets/showcase/index.json', 'utf8'));
const ONLY = process.env.ONLY ? new Set(JSON.parse(readFileSync(process.env.ONLY, 'utf8'))) : null;
const work = ONLY ? idx.filter(c => ONLY.has(c.id)) : idx;
const { browser, page, errors } = await openStudio();
const out = {};
/* 2026-09-27, cohesion audit: the measure lives in app.js pgCheck (the one
   measure every generation passes), reached through __sc.check. This script
   keeps its output (legib, legibMin, ghost, worst, bgMissing, layers) and its
   thresholds come from PG_T. Compared over 120 live cards before the switch:
   median |difference| 0.000 on legib and numInk. */
for (let i = 0; i < work.length; i += 8){
  const ids = work.slice(i, i + 8).map(c => c.id);
  Object.assign(out, await page.evaluate(async ids => {
    const R = {};
    for (const id of ids){
      try {
        const t = await __sc.load(id), g = __sc.check(t);
        const worstLine = g.lines.filter(l => PG_CRIT[l.role] && l.core != null).sort((a, b) => a.core - b.core)[0];
        const layer = t.layers.find(l => worstLine && l.name === worstLine.name);
        R[id] = { legib: g.legib, legibMin: g.legibMin, ghost: g.ghost, bgMissing: g.bgMissing,
                  worst: worstLine ? worstLine.role + ' "' + String(layer ? layer.text : worstLine.name).slice(0, 24).replace(/\n/g, ' / ') + '"' : null,
                  layers: g.lines.map(l => ({ role: l.role, text: String((t.layers.find(x => x.name === l.name) || {}).text || l.name).slice(0, 30), cr: l.core, letters: l.letters, cov: l.cov })) };
      } catch (e){ R[id] = { err:String(e).slice(0, 90) }; }
    }
    return R;
  }, ids));
  if (i % 160 === 0) console.log('…' + (i + ids.length) + '/' + work.length);
}
await browser.close();
const rows = work.map(c => ({ c, r:out[c.id] || { err:'none' } }));
const ok = rows.filter(x => !x.r.err);
const bad = ok.filter(x => x.r.legib < 3), ghosts = ok.filter(x => x.r.ghost), miss = ok.filter(x => x.r.bgMissing);
const minor = ok.filter(x => x.r.legibMin < 3);
const med = a => { const s = a.slice().sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };
console.log('\naudited ' + work.length + ' · errors ' + (rows.length - ok.length) + ' · page errors ' + errors.length);
console.log('  critical (headline/phone/CTA) under 3:1  ' + bad.length);
console.log('  critical layer effectively invisible     ' + ghosts.length);
console.log('  backdrop the studio cannot load          ' + miss.length);
console.log('  other reading text under 3:1 (reported)  ' + minor.length);
console.log('  median worst-critical contrast           ' + med(ok.map(x => Math.min(x.r.legib, 21))).toFixed(2));
bad.sort((a, b) => a.r.legib - b.r.legib).slice(0, 12).forEach(x => console.log('   ' + String(x.r.legib).padStart(5) + '  ' + x.c.id.padEnd(30) + x.r.worst));
if (J > 0) writeFileSync(process.argv[J + 1], JSON.stringify(out));
if (WRITE){
  idx.forEach(c => { const r = out[c.id]; if (r && !r.err){ c.legib = r.legib; if (r.ghost) c.ghost = r.ghost; else delete c.ghost; if (r.bgMissing) c.bgMissing = 1; else delete c.bgMissing; } });
  writeFileSync(ROOT + 'assets/showcase/index.json', JSON.stringify(idx));
  console.log('wrote legib/ghost/bgMissing onto the index');
}
if (errors.length) console.log('page errors:', errors.slice(0, 4));
