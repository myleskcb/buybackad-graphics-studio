#!/usr/bin/env node
/* DE-COLLIDE — move a line that landed on another line into clear space.
 *
 * After the product was moved off the words, the remaining fault was text on
 * text: 91 cards, nearly all a CTA sitting on the phone number at the foot of
 * the card. The band they share is 98px tall and the two together need 113, so
 * they cannot both live in it — the CTA has to come out.
 *
 * Same method as the product repair: lay the card out through the studio's own
 * path, then search for the nearest position where the line touches nothing.
 * Upward first, because the space above a footer band is usually the empty one,
 * then downward; whichever is nearer wins. If neither clears, the card is left
 * alone and the audit will still fail it, which is the honest outcome.
 *
 * usage: node scripts/decollide_text.mjs [--write]
 */
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync } from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname;
const WRITE = process.argv.includes('--write');
const idx = JSON.parse(readFileSync(ROOT + 'assets/showcase/index.json', 'utf8'));
const targets = idx.filter(c => (c.cover || 0) >= 0.12 && c.coverBy === 'text');
console.log('to de-collide: ' + targets.length);

const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:'new', args:['--no-sandbox'], protocolTimeout: 0 });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
await page.goto('http://localhost:8899/', { waitUntil:'networkidle2', timeout: 90000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => typeof buildLayer === 'function' && typeof alignPass === 'function', { timeout: 30000 });

const out = {};
for (let i = 0; i < targets.length; i += 8){
  const batch = targets.slice(i, i + 8).map(c => c.id);
  const res = await page.evaluate(async ids => {
    const R = {};
    for (const id of ids){
      try {
        const rec = await fetch('assets/showcase/tpl/' + id + '.json').then(r => r.json());
        const base = TEMPLATES.find(t => t.id === rec.base) || {};
        const layers = rec.tpl.layers;
        const fams = new Set(); layers.forEach(l => { const f = l.props && l.props.fontFamily; if (f) fams.add(f); });
        await Promise.race([ Promise.all([...fams].map(f => ensureFont(f))), new Promise(r => setTimeout(r, 7000)) ]);
        const lay = () => {
          const sc = new fabric.StaticCanvas(null, { width: TPL_W, height: TPL_H, renderOnAddRemove:false });
          const objs = layers.map(l => { let o = null; try { o = buildLayer(l, 'dc'); } catch(e){} if (o) sc.add(o); return o; });
          alignPass(sc, TPL_W, TPL_H);
          const boxes = objs.map(o => { if (!o) return null; const b = o.getBoundingRect(true, true);
            return { x:b.left, y:b.top, w:b.width, h:b.height }; });
          sc.dispose(); return boxes;
        };
        const READ = { headline:1, phone:1, cta:1, info:1, badges:1, sub:1, website:1, offer:1, user:1 };
        const isText = l => typeof l.text === 'string' && l.text.trim() && READ[l.role];
        const area = b => Math.max(0, b.w) * Math.max(0, b.h);
        const inter = (a, b) => Math.max(0, Math.min(a.x+a.w,b.x+b.w) - Math.max(a.x,b.x)) * Math.max(0, Math.min(a.y+a.h,b.y+b.h) - Math.max(a.y,b.y));
        let boxes = lay();
        /* the offender: the later-drawn line covering an earlier one most */
        let worst = null;
        layers.forEach((tl, tk) => { if (!isText(tl) || !boxes[tk] || area(boxes[tk]) < 400) return;
          layers.forEach((cl, ck) => { if (ck <= tk || !isText(cl) || !boxes[ck]) return;
            const f = inter(boxes[tk], boxes[ck]) / area(boxes[tk]);
            if (f >= 0.12 && (!worst || f > worst.f)) worst = { f, ck, tk }; }); });
        if (!worst){ R[id] = { skip:'nothing to move' }; continue; }

        const mk = worst.ck, mine = boxes[mk];
        const others = layers.map((l, k) => (k !== mk && isText(l) && boxes[k]) ? boxes[k] : null).filter(Boolean);
        const hits = y => { const t = { x:mine.x, y, w:mine.w, h:mine.h };
          return others.reduce((a, o) => a + inter(t, o) / Math.max(1, Math.min(area(t), area(o))), 0); };
        const M = 20;
        let bestDy = null;
        for (let d = 8; d <= 260; d += 6){
          for (const dy of [-d, d]){
            const y = mine.y + dy;
            if (y < M || y + mine.h > 1080 - M) continue;
            if (hits(y) < 0.02){ bestDy = dy; break; }
          }
          if (bestDy !== null) break;
        }
        if (bestDy === null){ R[id] = { skip:'no clear line' }; continue; }
        layers[mk].props.top = (layers[mk].props.top || 0) + bestDy;
        R[id] = { moved: layers[mk].name || layers[mk].role, dy: bestDy, rec };
      } catch(e){ R[id] = { skip: String(e).slice(0, 70) }; }
    }
    return R;
  }, batch);
  Object.assign(out, res);
  if (i % 40 === 0) console.log('…' + (i + batch.length) + '/' + targets.length);
}
await browser.close();
let moved = 0, skipped = 0;
Object.entries(out).forEach(([id, r]) => {
  if (r.skip){ skipped++; return; }
  moved++;
  if (WRITE) writeFileSync(ROOT + 'assets/showcase/tpl/' + id + '.json', JSON.stringify(r.rec));
});
const dys = Object.values(out).filter(r => r.dy).map(r => r.dy);
console.log('\nmoved ' + moved + ' · skipped ' + skipped + (dys.length ? ' · shift median ' + dys.sort((a,b)=>a-b)[Math.floor(dys.length/2)] + 'px' : ''));
console.log(WRITE ? 'records rewritten' : '(dry run; pass --write)');
