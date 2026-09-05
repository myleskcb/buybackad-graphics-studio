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
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const archetypes = Object.keys(E.ARCH || {});
const cases = [];
for (let s = 0; s < SEEDS; s++)
  for (const a of archetypes)
    cases.push({ arch: a, seed: 4242 + s * 977, vert: VERT, fmt: FMT });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'], protocolTimeout: 0 });
const page = await browser.newPage();

const hits = [];
let measured = 0;

for (const c of cases) {
  let r;
  try { r = E.render(c.arch, c.seed, c.vert, c.fmt, E.DEFAULT_CFG()); }
  catch (e) { hits.push({ ...c, rule: 'render', msg: e.message.slice(0, 90) }); continue; }

  const boxes = await page.evaluate(async svg => {
    document.body.innerHTML = svg;
    const el = document.querySelector('svg');
    if (!el) return null;
    const vb = (el.getAttribute('viewBox') || '0 0 1080 1080').split(/\s+/).map(Number);
    await document.fonts.ready;
    const out = [];
    el.querySelectorAll('text').forEach(t => {
      let b; try { b = t.getBBox(); } catch (e) { return; }
      if (!b || !b.width) return;
      out.push({ id: t.getAttribute('data-id') || t.getAttribute('id') || '',
                 s: (t.textContent || '').slice(0, 26),
                 x: b.x, y: b.y, w: b.width, h: b.height,
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
    const twin = vis.find(v => v.s === t.s && Math.abs(v.x - t.x) < 14 && Math.abs(v.y - t.y) < 14);
    if (twin) {                                   // keep the union of the stack
      const x1 = Math.max(twin.x + twin.w, t.x + t.w), y1 = Math.max(twin.y + twin.h, t.y + t.h);
      twin.x = Math.min(twin.x, t.x); twin.y = Math.min(twin.y, t.y);
      twin.w = x1 - twin.x; twin.h = y1 - twin.y;
      continue;
    }
    vis.push({ ...t });
  }
  const say = (rule, msg) => hits.push({ ...c, rule, msg });

  /* 1. real glyph runs must not touch each other */
  for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) {
    const a = vis[i], b = vis[j];
    const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    if (ox > 2 && oy > 2) {
      const small = Math.min(a.w * a.h, b.w * b.h);
      /* consecutive lines of one headline are set tight on purpose; a real
         collision is copy landing on unrelated copy */
      const sameBlock = a.id && b.id && a.id === b.id;
      const limit = sameBlock ? 0.22 : 0.06;
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
