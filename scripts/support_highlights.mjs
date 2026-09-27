#!/usr/bin/env node
/* SUPPORTIVE HIGHLIGHTS — the theme's support colour doing its job.
 *
 * Owner, 2026-09-27: "Audit all new themes and make sure we use supportive
 * highlights on some themes if it looks good."
 *
 * DESIGN-LAW rule 51 gives every theme four jobs: ground, reading ink, the
 * money/action accent, and SUPPORT/TRUST, "badges and supporting facts use the
 * support hue". Measured on the curated 400: the support colour was used on
 * 213 cards, and on every one of them only for frames, ribbons, plates and
 * decoration, never for the supporting copy it exists for. The selling-point
 * line read in the same ink as the headline, so nothing on the card said
 * "this is the reassurance, read it second".
 *
 * Per card, the one line that backs the offer (the selling points or the item
 * list: role badges, else info, largest first) takes the support colour, but
 * only where it looks right, which here means measured:
 *   - it clears 4.5:1 against the worst end of the ground under THAT line
 *     (rendered with the line hidden, every other layer in place);
 *   - it is its own colour: at least 25 (DeltaE, CIE76) from the accent,
 *     which keeps the money and the action, and from the ink, or it would not
 *     read as a highlight at all;
 *   - it has some colour (chroma over 12): a grey "support" is not a highlight.
 * A card that fails keeps its line as it is. Outlines stay; the line's own
 * gradient goes, as one colour is the point.
 *
 * usage: node scripts/support_highlights.mjs [--ids a,b] [--out dir] [--write] [--json f]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { openStudio } from './_showcase_harness.mjs';
const ROOT = new URL('../', import.meta.url).pathname, DIR = ROOT + 'assets/showcase/';
const argv = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const WRITE = process.argv.includes('--write'), OUT = argv('--out');
const idx = JSON.parse(readFileSync(DIR + 'index.json', 'utf8'));
const only = argv('--ids') ? new Set(argv('--ids').split(',')) : null;
const live = c => !c.defect && c.imagery !== 'none' && !(typeof c.chroma === 'number' && c.chroma < 0.05);
const work = idx.filter(c => (only ? only.has(c.id) : live(c)) && c.support).map(c => ({ id: c.id, support: c.support, accent: c.accent, ink: c.ink }));
console.log('cards: ' + work.length);

const { browser, page, errors } = await openStudio();
const out = {};
for (let i = 0; i < work.length; i += 6){
  Object.assign(out, await page.evaluate(async cards => {
    const R = {};
    const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const rgb = h => { const n = parseInt(String(h).replace('#', ''), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
    const L = h => { const c = rgb(h); return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]); };
    const lab = h => { const [r, g, b] = rgb(h).map(lin);
      const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, y = 0.2126 * r + 0.7152 * g + 0.0722 * b, z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
      const f = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
      return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))]; };
    const dE = (a, b) => { const p = lab(a), q = lab(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };
    const chroma = h => { const p = lab(h); return Math.hypot(p[1], p[2]); };
    for (const c of cards){
      try {
        const t = await __sc.load(c.id);
        /* one line, never one of a numbered set: "Step Micro 1" highlighted
           beside an unhighlighted 2 and 3 reads as a mistake, not a system */
        const cands = t.layers.map((l, k) => ({ l, k })).filter(z => typeof z.l.text === 'string' && /[A-Za-z]/.test(z.l.text) &&
          (z.l.role === 'badges' || z.l.role === 'info') && !/\s\d+$/.test(z.l.name || '') && !(z.l.props && z.l.props.grad && z.l.role !== 'info'));
        if (!cands.length){ R[c.id] = { skip: 'no supporting line' }; continue; }
        const inkHex = /^#[0-9a-f]{6}$/i.test(c.ink || '') ? c.ink : '#ffffff';
        if (chroma(c.support) < 12){ R[c.id] = { skip: 'support colour is grey' }; continue; }
        if (c.accent && dE(c.support, c.accent) < 25){ R[c.id] = { skip: 'support too close to the accent' }; continue; }
        const { sc, refs } = __sc.paint(t);
        const W = TPL_W, H = TPL_H;
        const pick = cands.map(z => ({ z, o: refs[z.k] })).filter(x => x.o && x.o.visible !== false)
          .sort((a, b) => (a.z.l.role === 'badges' ? -1 : 0) - (b.z.l.role === 'badges' ? -1 : 0) ||
                          b.o.getBoundingRect(true, true).width * b.o.getBoundingRect(true, true).height - a.o.getBoundingRect(true, true).width * a.o.getBoundingRect(true, true).height)[0];
        if (!pick){ sc.dispose(); R[c.id] = { skip: 'no visible supporting line' }; continue; }
        const lineFill = String((pick.z.l.props || {}).fill || '');
        if (/^#[0-9a-f]{6}$/i.test(lineFill) && dE(lineFill, c.support) < 12){ sc.dispose(); R[c.id] = { skip: 'already in the support colour' }; continue; }
        if (dE(c.support, inkHex) < 25 && !(/^#[0-9a-f]{6}$/i.test(lineFill) && dE(c.support, lineFill) >= 25)){ sc.dispose(); R[c.id] = { skip: 'support too close to the ink' }; continue; }
        // the ground under THIS line: everything else drawn, the line hidden
        const b = pick.o.getBoundingRect(true, true);
        pick.o.visible = false; sc.renderAll();
        const d = sc.lowerCanvasEl.getContext('2d').getImageData(0, 0, W, H).data;
        pick.o.visible = true; sc.dispose();
        const v = [];
        for (let y = Math.max(0, Math.floor(b.top)); y < Math.min(H, b.top + b.height); y += 2)
          for (let x = Math.max(0, Math.floor(b.left)); x < Math.min(W, b.left + b.width); x += 2){ const q = (y * W + x) * 4;
            v.push(0.2126 * lin(d[q]) + 0.7152 * lin(d[q + 1]) + 0.0722 * lin(d[q + 2])); }
        v.sort((p, q) => p - q);
        const s = L(c.support), lo = v[Math.floor(v.length * 0.1)], hi = v[Math.floor(v.length * 0.9)];
        const cr = g => (Math.max(s, g) + 0.05) / (Math.min(s, g) + 0.05);
        const worst = Math.min(cr(lo), cr(hi));
        if (worst < 4.5){ R[c.id] = { skip: 'under 4.5:1 on its ground', worst: +worst.toFixed(2), line: pick.z.l.name }; continue; }
        R[c.id] = { line: pick.z.l.name, fill: c.support, worst: +worst.toFixed(2), was: lineFill };
      } catch (e){ R[c.id] = { err: String(e).slice(0, 140) }; }
    }
    return R;
  }, work.slice(i, i + 6)));
  if (i % 60 === 0) console.log('…' + Math.min(i + 6, work.length) + '/' + work.length);
}
await browser.close();

const rows = Object.entries(out), yes = rows.filter(([, r]) => r.fill), no = rows.filter(([, r]) => !r.fill);
const why = {}; no.forEach(([, r]) => { const k = r.skip || 'error'; why[k] = (why[k] || 0) + 1; });
console.log(`highlight: ${yes.length} · left as is: ${no.length} · page errors ${errors.length}`);
console.log('left as is because: ' + JSON.stringify(why));
console.log('lines: ' + JSON.stringify(yes.reduce((m, [, r]) => (m[r.line] = (m[r.line] || 0) + 1, m), {})));
const apply = (id, r) => { const rec = JSON.parse(readFileSync(DIR + 'tpl/' + id + '.json', 'utf8'));
  const l = rec.tpl.layers.find(x => x.name === r.line); if (l && l.props){ l.props.fill = r.fill; delete l.props.grad; } return rec; };
if (OUT){ mkdirSync(OUT, { recursive: true }); yes.forEach(([id, r]) => writeFileSync(OUT + '/' + id + '.json', JSON.stringify(apply(id, r)))); }
if (WRITE){ yes.forEach(([id, r]) => writeFileSync(DIR + 'tpl/' + id + '.json', JSON.stringify(apply(id, r)))); console.log('wrote ' + yes.length + ' records'); }
if (argv('--json')) writeFileSync(argv('--json'), JSON.stringify(out));
