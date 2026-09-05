#!/usr/bin/env node
/* REPAIR — put the product where the space actually is.
 *
 * The audit found 202 cards with something drawn over the words, nearly all of
 * them a "Hero Product" dropped in the middle of the card. Deleting those cards
 * was the lazy answer: the design is fine, the PLACEMENT is wrong. So this
 * measures the real free space and moves the product into it.
 *
 * How the space is decided, which is the whole job:
 *   - lay the card out through the studio's own path (buildLayer + alignPass),
 *     so the boxes are the ones a visitor actually sees;
 *   - mark every TEXT box as occupied, plus a margin, because "empty" means
 *     empty of words;
 *   - find the largest free rectangle by the histogram method, then the best
 *     few, and score them: big enough to show the product, and OFF-CENTRE, so
 *     the product frames the copy instead of sitting in the middle of it;
 *   - fit the cutout inside at its own aspect ratio with a margin.
 * If no free rectangle can hold it at a sensible size, the product is REMOVED
 * rather than shrunk into a corner as a smudge — a card with no product beats
 * a card with one on top of the headline.
 *
 * Subject mismatch is repaired at the same time: a sports ad carrying an
 * iPhone is given a sports cutout.
 *
 * usage: node scripts/replace_cutouts.mjs [--write] [--only=id,id]
 */
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname;
const WRITE = process.argv.includes('--write');
const ONLY = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const idx = JSON.parse(readFileSync(ROOT + 'assets/showcase/index.json', 'utf8'));

const ALLOW = { cars:['car'], coins:['coin'], gold:['gold','cash'], pokemon:['poke'], silver:['silver'],
  sports:['sports'], strips:['strip'],
  phones:['iphone','ipad','watch','mac','macbook','own','device','group','sam','pix','phone','gen','hand','set','damage','sheet'] };
const family = p => String(p || '').replace(/^(qs-|ip-)/, '').split('-')[0];
const CUTS = readdirSync(ROOT + 'assets/cutouts').filter(f => /\.webp$/.test(f)).map(f => f.replace(/\.webp$/, ''));
const LEGACY = /^(qs-)?iphone-(x|xr|xs|se|[5-9]|1[0-2])\b|^ip-gen1[0-4]\b/i;
const poolFor = cat => CUTS.filter(f => !LEGACY.test(f) && (ALLOW[cat] || []).some(p => family(f) === p));

const targets = idx.filter(c => (ONLY.length ? ONLY.includes(c.id)
  : ((c.cover || 0) >= 0.12 && c.coverBy === 'cutout') || !((ALLOW[c.cat] || []).includes(family(c.product)))));
console.log('to repair: ' + targets.length + ' cards');

const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:'new', args:['--no-sandbox'], protocolTimeout: 0 });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
await page.goto('http://localhost:8899/', { waitUntil:'networkidle2', timeout: 90000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => typeof buildLayer === 'function' && typeof alignPass === 'function', { timeout: 30000 });

const results = {};
for (let i = 0; i < targets.length; i += 8){
  const batch = targets.slice(i, i + 8).map(c => ({ id: c.id, cat: c.cat, product: c.product,
    swap: !((ALLOW[c.cat] || []).includes(family(c.product))) ? poolFor(c.cat) : null }));
  const res = await page.evaluate(async batch => {
    const R = {};
    for (const job of batch){
      try {
        const rec = await fetch('assets/showcase/tpl/' + job.id + '.json').then(r => r.json());
        const base = TEMPLATES.find(t => t.id === rec.base) || {};
        const layers = rec.tpl.layers;
        const ci = layers.findIndex(l => l.kind === 'cutout' && !l.__wall && !l.__lineup
          && ((l.props && l.props.opacity !== undefined ? l.props.opacity : 1) >= 0.5));
        if (ci < 0){ R[job.id] = { skip:'no hero cutout' }; continue; }

        /* subject repair first, so the space is measured for the RIGHT asset */
        let src = layers[ci].props.src;
        if (job.swap && job.swap.length){
          const pick = job.swap[Math.abs(job.id.split('').reduce((a,ch)=>a+ch.charCodeAt(0),0)) % job.swap.length];
          src = 'assets/cutouts/' + pick + '.webp';
          layers[ci].props.src = src;
        }
        const load = s => new Promise(r => { if (!s || (CUTOUT_ELS[s] && CUTOUT_ELS[s].width)) return r();
          const el = new Image(); el.onload = () => { CUTOUT_ELS[s] = el; r(); }; el.onerror = () => r(); el.src = s; });
        const fams = new Set(); layers.forEach(l => { const f = l.props && l.props.fontFamily; if (f) fams.add(f); });
        await Promise.race([ Promise.all([...fams].map(f => ensureFont(f)).concat([load(src)])), new Promise(r => setTimeout(r, 8000)) ]);
        const el = CUTOUT_ELS[src];
        if (!el || !el.width){ R[job.id] = { skip:'cutout did not load' }; continue; }

        /* lay the card out WITHOUT the product, so the free space is the space
           the copy actually leaves */
        const t = Object.assign({}, base, rec.tpl, { id: 'rp-' + job.id });
        const sc = new fabric.StaticCanvas(null, { width: TPL_W, height: TPL_H, renderOnAddRemove:false });
        const objs = [];
        layers.forEach((l, k) => { if (k === ci){ objs.push(null); return; }
          let o = null; try { o = buildLayer(l, t.id); } catch(e){}
          if (o) sc.add(o); objs.push(o); });
        alignPass(sc, TPL_W, TPL_H);

        const CELL = 20, N = Math.ceil(TPL_W / CELL);
        const occ = new Uint8Array(N * N);
        const M = 18;                                   // words get elbow room
        layers.forEach((l, k) => {
          const o = objs[k];
          if (!o || typeof l.text !== 'string' || !l.text.trim()) return;
          const b = o.getBoundingRect(true, true);
          const x0 = Math.max(0, Math.floor((b.left - M) / CELL)), x1 = Math.min(N - 1, Math.ceil((b.left + b.width + M) / CELL));
          const y0 = Math.max(0, Math.floor((b.top - M) / CELL)), y1 = Math.min(N - 1, Math.ceil((b.top + b.height + M) / CELL));
          for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) occ[y * N + x] = 1;
        });

        /* every maximal free rectangle, by the histogram method */
        const rects = [];
        const h = new Int32Array(N);
        for (let y = 0; y < N; y++){
          for (let x = 0; x < N; x++) h[x] = occ[y * N + x] ? 0 : h[x] + 1;
          const st = [];
          for (let x = 0; x <= N; x++){
            const cur = x === N ? 0 : h[x];
            while (st.length && h[st[st.length - 1]] >= cur){
              const ht = h[st.pop()];
              const left = st.length ? st[st.length - 1] + 1 : 0;
              if (ht > 0 && x - left > 0) rects.push({ x: left * CELL, y: (y - ht + 1) * CELL, w: (x - left) * CELL, h: ht * CELL });
            }
            st.push(x);
          }
        }
        const ar = el.width / el.height;
        const PAD = 22, MINW = 190;
        let best = null;
        rects.forEach(r => {
          const iw = r.w - PAD * 2, ih = r.h - PAD * 2;
          if (iw < MINW || ih < MINW / ar) return;
          let w = Math.min(iw, ih * ar), hh = w / ar;
          if (w < MINW) return;
          w = Math.min(w, 470); hh = w / ar;                       // never a billboard
          const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
          const off = Math.hypot(cx - TPL_W / 2, cy - TPL_H / 2) / (TPL_W / 2);
          /* big enough to read, and pushed off centre so it frames the copy */
          const score = w * (1 + off * 0.9);
          if (!best || score > best.score) best = { score, w, h: hh, x: cx - w / 2, y: cy - hh / 2 };
        });

        if (!best){
          layers.splice(ci, 1);                                     // nowhere honest to put it
          R[job.id] = { action:'removed', src };
        } else {
          const p = layers[ci].props;
          p.left = Math.round(best.x); p.top = Math.round(best.y);
          p.originX = 'left'; p.originY = 'top';
          p.w = Math.round(best.w);
          delete p.angle;
          R[job.id] = { action:'moved', src, w: p.w, at: [p.left, p.top] };
        }
        R[job.id].rec = rec;
        sc.dispose();
      } catch(e){ R[job.id] = { skip: String(e).slice(0, 70) }; }
    }
    return R;
  }, batch);
  Object.assign(results, res);
  if (i % 80 === 0) console.log('…' + (i + batch.length) + '/' + targets.length);
}
await browser.close();

let moved = 0, removed = 0, skipped = 0;
Object.entries(results).forEach(([id, r]) => {
  if (r.skip){ skipped++; return; }
  if (r.action === 'moved') moved++; else removed++;
  if (WRITE) writeFileSync(ROOT + 'assets/showcase/tpl/' + id + '.json', JSON.stringify(r.rec));
});
console.log('\nmoved into free space: ' + moved + ' · removed (no room): ' + removed + ' · skipped: ' + skipped);
console.log(WRITE ? 'records rewritten' : '(dry run; pass --write)');
