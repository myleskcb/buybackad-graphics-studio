#!/usr/bin/env node
/* OVERLAP AUDIT — does anything sit ON TOP OF the words?
 *
 * The owner has raised layering twice. The showcase shipped a "quality" pool
 * that had never been measured for it, which is the actual failure: a rule
 * nobody checks is a rule that is not enforced. This measures it through the
 * STUDIO's own geometry — buildLayer() then alignPass(), the same path
 * renderThumb() takes — so what is measured is what a visitor sees.
 *
 * A hit needs three things, because otherwise every ghosted backdrop element
 * would trip it:
 *   1. the covering layer is drawn LATER than the text (so it is on top),
 *   2. it is solid enough to hide anything (opacity >= 0.5), and
 *   3. it covers enough of the text box to matter.
 * Ghost walls, lineups and deliberate deco stay legal.
 *
 * usage: node scripts/audit_showcase_overlap.mjs [--write]
 *   --write records `cover` (worst fraction) and `coverBy` on each index row.
 */
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync } from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname;
const WRITE = process.argv.includes('--write');
const idx = JSON.parse(readFileSync(ROOT + 'assets/showcase/index.json', 'utf8'));

const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:'new', args:['--no-sandbox'], protocolTimeout: 0 });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
const perr = [];
page.on('pageerror', e => perr.push(String(e).slice(0, 120)));
await page.goto('http://localhost:8899/', { waitUntil:'networkidle2', timeout: 90000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => typeof buildLayer === 'function' && typeof alignPass === 'function', { timeout: 30000 });

const out = {};
for (let i = 0; i < idx.length; i += 12){
  const batch = idx.slice(i, i + 12).map(c => c.id);
  const res = await page.evaluate(async ids => {
    const R = {};
    for (const id of ids){
      try {
        const rec = await fetch('assets/showcase/tpl/' + id + '.json').then(r => r.json());
        const base = TEMPLATES.find(t => t.id === rec.base) || {};
        const t = Object.assign({}, base, rec.tpl, { id: 'au-' + id });
        const fams = new Set(); (t.layers||[]).forEach(l => { const f = l.props && l.props.fontFamily; if (f) fams.add(f); });
        const cuts = [...new Set((t.layers||[]).filter(l => l.kind === 'cutout' && l.props && l.props.src).map(l => l.props.src))];
        const load = src => new Promise(r => { if (!src || (CUTOUT_ELS[src] && CUTOUT_ELS[src].width)) return r();
          const el = new Image(); el.onload = () => { CUTOUT_ELS[src] = el; r(); }; el.onerror = () => r(); el.src = src; });
        await Promise.race([ Promise.all([...fams].map(f => ensureFont(f)).concat(cuts.map(load))), new Promise(r => setTimeout(r, 8000)) ]);
        const sc = new fabric.StaticCanvas(null, { width: TPL_W, height: TPL_H, renderOnAddRemove: false });
        const objs = [];
        (t.layers || []).forEach((l, k) => {
          let o = null; try { o = buildLayer(l, t.id); } catch(e){}
          if (o){ sc.add(o); objs.push({ k, l, o }); }
        });
        alignPass(sc, TPL_W, TPL_H);
        const box = o => { const b = o.getBoundingRect(true, true); return { x:b.left, y:b.top, w:b.width, h:b.height }; };
        const area = b => Math.max(0, b.w) * Math.max(0, b.h);
        const inter = (a, b) => {
          const x = Math.max(0, Math.min(a.x+a.w, b.x+b.w) - Math.max(a.x, b.x));
          const y = Math.max(0, Math.min(a.y+a.h, b.y+b.h) - Math.max(a.y, b.y));
          return x * y;
        };
        const READ = { headline:1, phone:1, cta:1, info:1, badges:1, sub:1, website:1, offer:1, user:1 };
        const texts = objs.filter(z => typeof z.l.text === 'string' && z.l.text.trim() && READ[z.l.role]);
        /* what can cover: a product cutout, or a later block of TEXT.
           deliberate ghosting is excluded by the opacity test. */
        const covers = objs.filter(z => (z.l.kind === 'cutout' || (typeof z.l.text === 'string' && READ[z.l.role]))
          && ((z.l.props && z.l.props.opacity !== undefined ? z.l.props.opacity : 1) >= 0.5)
          && !z.l.__wall);
        let worst = 0, by = null, kind = null;
        texts.forEach(tz => {
          const tb = box(tz.o), ta = area(tb);
          if (ta < 400) return;
          covers.forEach(cz => {
            if (cz.k <= tz.k) return;                 // only what is drawn ON TOP
            if (cz === tz) return;
            const f = inter(tb, box(cz.o)) / ta;
            if (f > worst){ worst = f; by = (cz.l.name || cz.l.kind); kind = cz.l.kind === 'cutout' ? 'cutout' : 'text'; }
          });
        });
        R[id] = { cover: +worst.toFixed(3), by, kind };
      } catch(e){ R[id] = { err: String(e).slice(0, 70) }; }
    }
    return R;
  }, batch);
  Object.assign(out, res);
  if (i % 120 === 0) console.log('…' + (i + batch.length) + '/' + idx.length);
}
await browser.close();

const rows = idx.map(c => ({ c, r: out[c.id] || {} }));
const errs = rows.filter(x => x.r.err);
const band = (lo, hi) => rows.filter(x => !x.r.err && x.r.cover >= lo && x.r.cover < hi).length;
console.log('\naudited ' + idx.length + ' · errors ' + errs.length + (perr.length ? ' · pageerrors ' + perr.length : ''));
console.log('coverage of a text box by something drawn on top of it:');
console.log('  clean  (<5%)  ' + band(0, 0.05));
console.log('  slight (5-12%) ' + band(0.05, 0.12));
console.log('  BAD    (12-30%) ' + band(0.12, 0.30));
console.log('  SEVERE (>=30%)  ' + rows.filter(x => !x.r.err && x.r.cover >= 0.30).length);
const worst = rows.filter(x => !x.r.err).sort((a,b) => b.r.cover - a.r.cover).slice(0, 12);
console.log('\nworst offenders:');
worst.forEach(x => console.log('  ' + (x.r.cover*100).toFixed(0).padStart(3) + '%  ' + x.c.id.padEnd(28) + ' covered by ' + x.r.kind + ' "' + x.r.by + '"'));
const byKind = {}; rows.filter(x => !x.r.err && x.r.cover >= 0.12).forEach(x => byKind[x.r.kind] = (byKind[x.r.kind]||0)+1);
console.log('\nbad-or-worse by cause:', JSON.stringify(byKind));

if (WRITE){
  idx.forEach(c => { const r = out[c.id]; if (r && !r.err){ c.cover = r.cover; c.coverBy = r.kind; } });
  writeFileSync(ROOT + 'assets/showcase/index.json', JSON.stringify(idx));
  console.log('\nwrote cover/coverBy onto ' + idx.length + ' index rows');
}
