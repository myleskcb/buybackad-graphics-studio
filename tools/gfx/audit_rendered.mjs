#!/usr/bin/env node
/* AUDIT WHAT ACTUALLY RENDERS, not what was declared.
 *
 * The engine's own R7/R8/R12 compare the boxes a device ASKED for. A glyph run
 * that overflows its box still passes, which is why a sample card can ship with
 * "17 PRO" sitting on "$1,050", a starburst whose number hangs outside the
 * points, and a footer reading "iphones.LA · Long B". Same class of bug the ad
 * lab had: the recipe said one thing, the pixels said another.
 *
 * This loads each SVG in headless Chrome and measures every <text> with
 * getBBox(), which is the browser's own answer, then re-runs the geometric
 * rules against that. No font guessing, no character-width averages.
 *
 * node tools/gfx/audit_rendered.mjs [seeds] [vertical] [format]
 */
import * as E from '../../engine/engine.mjs';
import puppeteer from 'puppeteer-core';

const SEEDS = +(process.argv[2] || 4);
const VERT = process.argv[3] || 'phones';
const FMT = process.argv[4] || '45';
const BASE = process.env.ASSET_BASE || 'http://localhost:8899/';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const archetypes = Object.keys(E.ARCH || {});
const cases = [];
for (let s = 0; s < SEEDS; s++)
  for (const a of archetypes)
    cases.push({ arch: a, seed: 4242 + s * 977, vert: VERT, fmt: FMT });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'], protocolTimeout: 0 });
const page = await browser.newPage();
await page.goto(BASE);

const hits = [];
let measured = 0;

for (const c of cases) {
  let r;
  try { r = E.render(c.arch, c.seed, c.vert, c.fmt, { ...E.DEFAULT_CFG(), assetBase: BASE }); }
  catch (e) { hits.push({ ...c, rule: 'render', msg: e.message.slice(0, 90) }); continue; }

  const boxes = await page.evaluate(async svg => {
    document.body.innerHTML = svg;
    const el = document.querySelector('svg');
    if (!el) return null;
    const vb = (el.getAttribute('viewBox') || '0 0 1080 1080').split(/\s+/).map(Number);
    await document.fonts.ready;
    /* getBBox() reports the box in the element's OWN user space, so a glyph run
       inside a rotated group — the arc crown — comes back at coordinates it is
       not actually drawn at. Measure on screen and map back through the
       viewBox, which accounts for every transform above the element. */
    const host = el.getBoundingClientRect();
    const sx = vb[2] / host.width, sy = vb[3] / host.height;
    const out = [];
    el.querySelectorAll('text').forEach(t => {
      let b; try { b = t.getBoundingClientRect(); } catch (e) { return; }
      if (!b || !b.width) return;
      out.push({ id: t.getAttribute('data-id') || t.getAttribute('id') || '',
                 s: (t.textContent || '').slice(0, 26),
                 x: (b.left - host.left) * sx, y: (b.top - host.top) * sy,
                 w: b.width * sx, h: b.height * sy,
                 op: +(getComputedStyle(t).opacity || 1) });
    });
    return { W: vb[2], H: vb[3], out };
  }, r.svg);

  if (!boxes || !boxes.out.length) { hits.push({ ...c, rule: 'no-text', msg: 'nothing measurable' }); continue; }
  measured++;
  const { W, H, out } = boxes;
  /* Outlined and hard-shadowed type is drawn as several stacked copies of the
     same string; those are one word to a reader, not a collision. Collapse any
     run of identical strings that sit within a few pixels of each other. */
  const raw = out.filter(t => t.op > 0.05 && t.s.trim());
  const vis = [];
  for (const t of raw) {
    /* The offset scales with the type, so a fixed pixel tolerance misses the
       shadow copy of a 200px poster line and reports it as a collision with
       itself. Judge the offset against the run's own height. */
    const tol = Math.max(14, t.h * 0.35);
    const twin = vis.find(v => v.s === t.s && Math.abs(v.x - t.x) < tol && Math.abs(v.y - t.y) < tol);
    if (twin) {                                   // keep the union of the stack
      const x1 = Math.max(twin.x + twin.w, t.x + t.w), y1 = Math.max(twin.y + twin.h, t.y + t.h);
      twin.x = Math.min(twin.x, t.x); twin.y = Math.min(twin.y, t.y);
      twin.w = x1 - twin.x; twin.h = y1 - twin.y;
      continue;
    }
    vis.push({ ...t });
  }
  const say = (rule, msg) => hits.push({ ...c, rule, msg });

  /* 1. real glyph runs must not touch each other.
        getBBox returns the EM box — ascender to descender — so two lines set
        with tight leading always overlap on paper even though the ink never
        does. Compare the middle band of each box, which approximates the ink,
        so a true collision still trips and a tight stack does not. */
  const ink = t => ({ x: t.x, w: t.w, y: t.y + t.h * 0.16, h: t.h * 0.68 });
  for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) {
    const a = ink(vis[i]), b = ink(vis[j]);
    a.s = vis[i].s; b.s = vis[j].s; a.id = vis[i].id; b.id = vis[j].id;
    const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    if (ox > 2 && oy > 2) {
      const small = Math.min(a.w * a.h, b.w * b.h);
      /* Consecutive lines of a stack are set tight on purpose, and ids differ
         between them (headline0 / headline1), so identity is the wrong test.
         What makes a stack is geometry: the runs share a column and sit one
         above the other. Copy landing on unrelated copy does neither. */
      const share = ox / Math.min(a.w, b.w);
      const apart = Math.abs((a.y + a.h / 2) - (b.y + b.h / 2)) / Math.max(a.h, b.h);
      const stacked = share > 0.55 && apart > 0.55;
      const limit = stacked ? 0.22 : 0.06;
      if (ox * oy > small * limit)
        say('text-collision', `"${a.s.trim()}" over "${b.s.trim()}" (${Math.round(ox * oy / small * 100)}%)`);
    }
  }

  /* 2. nothing clipped by the canvas */
  for (const t of vis) {
    if (t.x < -2 || t.y < -2 || t.x + t.w > W + 2 || t.y + t.h > H + 2)
      say('clipped', `"${t.s.trim()}" runs to ${Math.round(t.x + t.w)} of ${W}`);
  }

  /* 3. nothing too small to read in a feed thumbnail (R8, on real extents) */
  const shortEdge = Math.min(W, H);
  for (const t of vis) if (t.h < shortEdge * 0.018)
    say('too-small', `"${t.s.trim()}" is ${(t.h / shortEdge * 100).toFixed(1)}% of the short edge`);
}

await browser.close();

const byRule = {};
hits.forEach(h => (byRule[h.rule] ||= []).push(h));
const bad = new Set(hits.map(h => h.arch + ':' + h.seed)).size;
console.log(`rendered audit: ${measured} cards measured · ${bad} with hits`);
Object.entries(byRule).sort((a, b) => b[1].length - a[1].length).forEach(([rule, list]) => {
  console.log(`\n  ${rule}  ${list.length}`);
  list.slice(0, 8).forEach(h => console.log(`    ${(h.arch + ' ' + h.seed).padEnd(26)}${h.msg}`));
  if (list.length > 8) console.log(`    … and ${list.length - 8} more`);
});
process.exit(hits.length ? 1 : 0);
