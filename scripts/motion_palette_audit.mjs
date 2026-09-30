#!/usr/bin/env node
/* Palette audit for the video maker (motion/). Every palette in
   motion/catalog.js is locked into the same N random looks, and each look's
   headline contrast is measured off the rendered pixels by motion/audit.js
   (auditLook: lettering against what sits right behind it, shadow, outline and
   plate included; 3:1 is the bar). Flat pair ratios (ink vs ground) overstate
   the pale palettes: the engine's harmonise() swaps effects and plates on
   them, so only the pixels count.

   The same seeds are used for every palette, so a look that fails across many
   palettes is the look's fault, not the colours'. Those are reported apart.

   Writes motion/palette-audit.json, which the palette picker reads to show
   each palette's measured contrast.

   usage:  python3 -m http.server 8765   (repo root)   then
           node scripts/motion_palette_audit.mjs [--looks 16] [--port 8765]
   Uses puppeteer-core with CHROME=/path/to/chrome, else playwright's chromium. */
import { writeFileSync } from 'node:fs';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const LOOKS = +arg('--looks', 16), PORT = +arg('--port', 8765), BAR = 3;

let browser;
try {
  const { default: puppeteer } = await import('puppeteer-core');
  browser = await puppeteer.launch({ executablePath: process.env.CHROME, headless: 'new', args: ['--no-sandbox', '--force-color-profile=srgb'] });
} catch (e) {
  const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
  browser = await chromium.launch({ args: ['--force-color-profile=srgb'] });
}
const page = await browser.newPage();
page.on('pageerror', e => { console.error('page error:', e.message); process.exitCode = 1; });
await page.goto(`http://localhost:${PORT}/motion/audit-sweep.html`);
await page.waitForFunction(() => window.ready);

const raw = await page.evaluate(async LOOKS => {
  const { randomize, harmonise, loadPhones, loadFonts, fontsFor } = await import('./engine.js');
  const { DEFAULT_STYLE, PALETTES } = await import('./catalog.js');
  const { auditLook } = await import('./audit.js');
  const a = await loadPhones('./phones/');
  const idx = {}; a.index.forEach(m => idx[m.id] = m);
  const pool = a.index.map(m => m.id), lock = new Set(['palette']), out = {};
  for (const pal of Object.keys(PALETTES)) {
    out[pal] = [];
    for (let s = 1; s <= LOOKS; s++) {
      const st = harmonise(randomize({ ...DEFAULT_STYLE, palette: pal, number: '(323) 555-0199' }, s * 7919, lock, pool, true), lock, idx);
      await loadFonts(fontsFor(st));
      const rep = await auditLook(st, { phones: a.phones }, { size: 160, secs: .2, sound: false });
      out[pal].push({ c: +rep.contrast.toFixed(2), look: `${st.vibe}/${st.text_fx}/${st.background}` });
    }
  }
  return out;
}, LOOKS);
await browser.close();

// a look that fails on over a third of the palettes is the look's problem
const lookFails = Array(LOOKS).fill(0);
for (const rows of Object.values(raw)) rows.forEach((r, i) => { if (r.c < BAR) lookFails[i]++; });
const n = Object.keys(raw).length;
const badLooks = lookFails.map((f, i) => ({ i, f })).filter(x => x.f > n / 3).map(x => x.i);

const palettes = {};
for (const [k, rows] of Object.entries(raw)) {
  const cs = rows.map(r => r.c), sorted = [...cs].sort((p, q) => p - q);
  const own = rows.filter((r, i) => r.c < BAR && !badLooks.includes(i)).length;
  palettes[k] = { median: sorted[sorted.length >> 1], worst: sorted[0], pass: +(cs.filter(c => c >= BAR).length / cs.length).toFixed(2), ownFails: own };
}
const report = {
  date: new Date().toISOString().slice(0, 10), looks: LOOKS, bar: BAR,
  badLooks: badLooks.map(i => ({ look: raw[Object.keys(raw)[0]][i].look, seed: (i + 1) * 7919, failsOn: lookFails[i] })),
  palettes,
};
writeFileSync(new URL('../motion/palette-audit.json', import.meta.url), JSON.stringify(report, null, 1) + '\n');

const flagged = Object.entries(palettes).filter(([, p]) => p.ownFails > 0 || p.median < BAR).sort((a, b) => a[1].median - b[1].median);
console.log(`${n} palettes x ${LOOKS} looks, bar ${BAR}:1`);
console.log(`looks failing on over a third of palettes: ${report.badLooks.map(b => `${b.look} (${b.failsOn})`).join(', ') || 'none'}`);
console.log(`palettes with a median under ${BAR}:1: ${Object.values(palettes).filter(p => p.median < BAR).length}`);
for (const [k, p] of flagged) console.log(`  ${k.padEnd(18)} median ${p.median}  worst ${p.worst}  own fails ${p.ownFails}/${LOOKS}`);
