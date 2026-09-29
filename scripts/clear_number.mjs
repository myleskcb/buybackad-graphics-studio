#!/usr/bin/env node
/* NOTHING ON THE NUMBER.
 *
 * The number rebuild (number_block.mjs) moved every phone number to its new
 * size and place, and some decoration authored for the old place now crosses
 * it: a hudTech card's 5px "HUD Bottom" rule through the middle of the digits
 * (a number struck through reads as cancelled), a sparkle or a cursor over the
 * first bracket, a cue icon over a digit. The overlap audit misses these: it
 * holds back a card when 12% of a text box is covered, and a rule through a
 * number covers 2%.
 *
 * For every card: paint it, take the number's own ink (paint without the
 * number: the pixels that change), then hide each layer drawn AFTER the number
 * that meets its box and see which of the number's ink pixels change. A layer
 * that changes more than 0.5% of them sits on the number. --write removes it
 * when it is decoration (a path, a star, a thin rule, a small shape, a
 * non-reading text mark); anything else (a plate, a product, a line of copy)
 * is reported for the overlap audit to judge.
 *
 * usage: node scripts/clear_number.mjs [--write] [--ids a,b] [--json out.json]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { openStudio } from './_showcase_harness.mjs';
const ROOT = new URL('../', import.meta.url).pathname, DIR = ROOT + 'assets/showcase/';
const WRITE = process.argv.includes('--write');
const argv = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const idx = JSON.parse(readFileSync(DIR + 'index.json', 'utf8'));
const only = argv('--ids') ? new Set(argv('--ids').split(',')) : null;
const work = idx.filter(c => !only || only.has(c.id)).map(c => c.id);

const { browser, page, errors } = await openStudio();
const out = {};
for (let i = 0; i < work.length; i += 8){
  Object.assign(out, await page.evaluate(async ids => {
    const R = {};
    for (const id of ids){
      try {
        const t = await __sc.load(id);
        const { sc, refs } = __sc.paint(t);
        const W = TPL_W, H = TPL_H, ctx = sc.lowerCanvasEl.getContext('2d');
        const k = t.layers.findIndex(l => l.role === 'phone');
        const o = refs[k];
        if (k < 0 || !o){ sc.dispose(); R[id] = { none: 1 }; continue; }
        const b = o.getBoundingRect(true, true);
        const x0 = Math.max(0, Math.floor(b.left)), y0 = Math.max(0, Math.floor(b.top));
        const x1 = Math.min(W, Math.ceil(b.left + b.width)), y1 = Math.min(H, Math.ceil(b.top + b.height));
        const w = x1 - x0, h = y1 - y0;
        const grab = () => { sc.renderAll(); return ctx.getImageData(x0, y0, w, h).data; };
        const full = grab();
        o.visible = false; const bare = grab(); o.visible = true;
        const ink = [];
        for (let q = 0; q < full.length; q += 4)
          if (Math.abs(full[q] - bare[q]) + Math.abs(full[q + 1] - bare[q + 1]) + Math.abs(full[q + 2] - bare[q + 2]) >= 60) ink.push(q);
        const hits = [];
        t.layers.forEach((l, j) => {
          const r = refs[j]; if (j <= k || !r || r.visible === false) return;
          const c = r.getBoundingRect(true, true);
          if (c.left > b.left + b.width || c.left + c.width < b.left || c.top > b.top + b.height || c.top + c.height < b.top) return;
          r.visible = false; const without = grab(); r.visible = true;
          let n = 0;
          for (const q of ink) if (Math.abs(full[q] - without[q]) + Math.abs(full[q + 1] - without[q + 1]) + Math.abs(full[q + 2] - without[q + 2]) >= 30) n++;
          const frac = ink.length ? n / ink.length : 0;
          if (frac > 0.005){
            const p = l.props || {};
            const reading = typeof l.text === 'string' && /[A-Za-z0-9]/.test(l.text);
            const small = c.width * c.height < 0.08 * W * H || c.height <= 12 || c.width <= 12;
            const deco = !reading && l.kind !== 'cutout' && (l.role === 'deco' || l.kind === 'path' || l.kind === 'star' || small);
            hits.push({ j, name: l.name, kind: l.kind, role: l.role || '', frac: +frac.toFixed(3), deco });
          }
        });
        sc.dispose();
        R[id] = { ink: ink.length, hits };
      } catch (e){ R[id] = { err: String(e).slice(0, 140) }; }
    }
    return R;
  }, work.slice(i, i + 8)));
  if (i % 160 === 0) console.log('…' + Math.min(work.length, i + 8) + '/' + work.length);
}
await browser.close();
const rows = Object.entries(out), hit = rows.filter(([, r]) => r.hits && r.hits.length);
const names = {}; hit.forEach(([, r]) => r.hits.forEach(h => { const key = h.name + (h.deco ? '' : ' (not decoration)'); names[key] = (names[key] || 0) + 1; }));
console.log(`\ncards ${rows.length} · something on the number ${hit.length} · errors ${rows.filter(([, r]) => r.err).length} · page errors ${errors.length}`);
console.log('by layer: ' + JSON.stringify(Object.entries(names).sort((a, b) => b[1] - a[1])));
if (argv('--json')) writeFileSync(argv('--json'), JSON.stringify(out));
if (WRITE){
  let removed = 0;
  hit.forEach(([id, r]) => {
    const drop = new Set(r.hits.filter(h => h.deco).map(h => h.j)); if (!drop.size) return;
    const f = DIR + 'tpl/' + id + '.json', rec = JSON.parse(readFileSync(f, 'utf8'));
    rec.tpl.layers = rec.tpl.layers.filter((l, j) => !drop.has(j));
    removed += drop.size;
    writeFileSync(f, JSON.stringify(rec));
  });
  console.log('removed ' + removed + ' decoration layers from the number');
}
