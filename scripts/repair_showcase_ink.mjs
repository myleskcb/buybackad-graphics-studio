#!/usr/bin/env node
/* THE CRITICAL LINES, REPAIRED ONE AT A TIME.
 *
 * audit_showcase_legibility.mjs stamps a card as a defect when its headline,
 * number or call to action measures under 3:1 against the pixels behind it.
 * After the photographs went back to their own colour (DESIGN-LAW 56) 178
 * cards still did, and 127 of those lines were the small CTA label stacked
 * over the number, set in a muted tint on its plate.
 *
 * repair_showcase_contrast.mjs re-measures every reading line on a card (about
 * 45s a card); this touches only the lines the audit named, from its --json:
 *
 *   1. paint the card, hide the line, and read the ground under the pixels its
 *      ink covers (the audit's own diff method): the 10th, 50th and 90th
 *      percentiles of luminance
 *   2. keep the line's direction (lighter or darker than its ground) if it can
 *      reach 4.5:1 against the middle of the ground and 3:1 against its worst
 *      end; otherwise the other direction
 *   3. a CTA label takes the neutral ink of that side (near-white or
 *      near-black: a label on a plate wears the plate's ink, DESIGN-LAW 56); a
 *      headline or number keeps its hue and chroma and moves only in lightness
 *      (rules 31 and 52), with a little headroom
 *   4. the gradient goes (rule 45), the opacity goes to 1, and an outline on
 *      the same side as the new ink, which no longer separates anything, goes
 *
 * usage: node scripts/repair_showcase_ink.mjs --from legib.json [--write]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { openStudio } from './_showcase_harness.mjs';
import { parse, lumOf, toOklch, atLuminance } from './refresh_palettes.mjs';
const ROOT = new URL('../', import.meta.url).pathname, DIR = ROOT + 'assets/showcase/';
const WRITE = process.argv.includes('--write');
const argv = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const legib = JSON.parse(readFileSync(argv('--from'), 'utf8'));
const CRIT = { headline:1, phone:1, cta:1 };
export const NEAR_WHITE = '#f6f6f4', NEAR_BLACK = '#0b0b0d';

/* the lines to repair: critical, drawn (not a ghost), under 3:1 */
const todo = {};
for (const [id, r] of Object.entries(legib)){
  (r.layers || []).forEach(l => { if (CRIT[l.role] && l.cov >= 1.2 && l.cr < 3) (todo[id] ||= []).push({ role: l.role, text: l.text }); });
}
const ids = Object.keys(todo);
console.log('cards ' + ids.length + ' · lines ' + Object.values(todo).reduce((s, a) => s + a.length, 0));

const { browser, page, errors } = await openStudio();
const grounds = {};
for (let i = 0; i < ids.length; i += 6){
  Object.assign(grounds, await page.evaluate(async (batch) => {
    const R = {};
    const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const lum = (d, k) => 0.2126 * lin(d[k]) + 0.7152 * lin(d[k + 1]) + 0.0722 * lin(d[k + 2]);
    for (const [id, lines] of batch){
      try {
        const t = await __sc.load(id);
        const { sc, refs } = __sc.paint(t);
        const W = TPL_W, H = TPL_H, ctx = sc.lowerCanvasEl.getContext('2d');
        const full = ctx.getImageData(0, 0, W, H).data;
        R[id] = [];
        for (const want of lines){
          const k = t.layers.findIndex(l => l.role === want.role && typeof l.text === 'string' && l.text.slice(0, 30) === want.text);
          const o = refs[k]; if (k < 0 || !o){ R[id].push({ want, miss: true }); continue; }
          const b = o.getBoundingRect(true, true);
          const x0 = Math.max(0, Math.floor(b.left)), y0 = Math.max(0, Math.floor(b.top));
          const x1 = Math.min(W, Math.ceil(b.left + b.width)), y1 = Math.min(H, Math.ceil(b.top + b.height));
          o.visible = false; sc.renderAll();
          const g = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
          o.visible = true; sc.renderAll();
          const v = [];
          for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++){
            const f = (y * W + x) * 4, q = ((y - y0) * (x1 - x0) + (x - x0)) * 4;
            if (Math.abs(full[f] - g[q]) + Math.abs(full[f + 1] - g[q + 1]) + Math.abs(full[f + 2] - g[q + 2]) < 24) continue;
            v.push(lum(g, q));
          }
          v.sort((p, q) => p - q);
          const pct = p => v[Math.min(v.length - 1, Math.floor(v.length * p))];
          R[id].push({ want, k, name: t.layers[k].name, n: v.length, g10: pct(0.1), g50: pct(0.5), g90: pct(0.9) });
        }
        sc.dispose();
      } catch (e){ R[id] = { err: String(e).slice(0, 120) }; }
    }
    return R;
  }, ids.slice(i, i + 6).map(id => [id, todo[id]])));
}
await browser.close();

const hex = c => '#' + [c.r, c.g, c.b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const cr = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
let fixed = 0, cards = 0, miss = 0, skipped = 0;
const log = [];
for (const [id, list] of Object.entries(grounds)){
  if (!Array.isArray(list)) { miss++; continue; }
  const f = DIR + 'tpl/' + id + '.json', rec = JSON.parse(readFileSync(f, 'utf8'));
  let touched = false;
  for (const m of list){
    if (m.miss || !m.n){ miss++; continue; }
    const l = rec.tpl.layers[m.k], p = l.props || {};
    const was = p.fill && parse(p.fill) ? p.fill : (p.grad && p.grad.c1) || '#ffffff';
    const c0 = parse(was) || parse('#ffffff'), L0 = lumOf(c0);
    /* a line whose ink already stands at 4.5:1 on the middle of its ground is
       read; what the audit caught there was its glow or shadow, not its ink */
    if (!p.grad && cr(L0, m.g50) >= 4.5){ skipped++; continue; }
    /* what each side needs: 4.5:1 on the middle of the ground, 3:1 on its worst end */
    const needUp = Math.max(4.5 * (m.g50 + 0.05) - 0.05, 3 * (m.g90 + 0.05) - 0.05);
    const needDown = Math.min((m.g50 + 0.05) / 4.5 - 0.05, (m.g10 + 0.05) / 3 - 0.05);
    let up = L0 > m.g50;
    if (up && needUp > 0.97) up = false;
    else if (!up && needDown < 0.003) up = true;
    let ink;
    if (l.role === 'cta' || (up ? needUp > 0.97 : needDown < 0.003)){
      /* a label, or a line no hue can carry: the neutral ink that reads
         better on the middle of its ground */
      const w = cr(lumOf(parse(NEAR_WHITE)), m.g50), k = cr(lumOf(parse(NEAR_BLACK)), m.g50);
      ink = w >= k ? NEAR_WHITE : NEAR_BLACK;
    } else {
      const o = toOklch(c0), Y = up ? Math.min(0.99, needUp * 1.1 + 0.01) : Math.max(0.002, needDown * 0.9);
      ink = hex(atLuminance(o.H ?? o.h ?? 0, o.C ?? o.c ?? 0, Y));
    }
    const Ln = lumOf(parse(ink));
    p.fill = ink; delete p.grad;
    if (typeof p.opacity === 'number' && p.opacity < 1) p.opacity = 1;
    if (p.stroke && parse(p.stroke)){
      const Ls = lumOf(parse(p.stroke));
      if ((Ln > m.g50) === (Ls > m.g50)){ delete p.stroke; delete p.strokeWidth; }
    }
    l.props = p;
    log.push(`${id}  ${l.role.padEnd(8)} ${String(l.text).slice(0, 22).replace(/\n/g, ' ').padEnd(22)} ${was} -> ${ink}  ground ${m.g50.toFixed(3)} mid: ${cr(L0, m.g50).toFixed(2)} -> ${cr(Ln, m.g50).toFixed(2)}`);
    fixed++; touched = true;
  }
  if (touched){ cards++; if (WRITE) writeFileSync(f, JSON.stringify(rec)); }
}
log.slice(0, 20).forEach(s => console.log('  ' + s));
console.log(`lines repaired ${fixed} on ${cards} cards · already 4.5:1 by colour ${skipped} · not found ${miss} · page errors ${errors.length}` + (WRITE ? ' · written' : ' · dry run'));
if (argv('--ids-out')) writeFileSync(argv('--ids-out'), JSON.stringify(Object.keys(grounds)));
