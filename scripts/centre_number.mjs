#!/usr/bin/env node
/* THE NUMBER SITS IN THE MIDDLE OF ITS PLATE (the gate's numCentre, pgCheck).
 *
 * For every live showcase card the gate fails on numCentre (or the cards
 * named), measured on the painted card: the number's letters (the pixels that
 * change when it is hidden) against the plate as it is seen (clipped to the
 * card). The number is moved by what it is off, repainted and measured again,
 * up to four times, until its letters sit within 3% of the plate's middle.
 * Kept only when the gate accepts the card (no new failure, no critical line
 * losing contrast) and numCentre is gone; the thumbnail is re-baked.
 *
 *   node scripts/centre_number.mjs [cardId…]   (:8899 + Chrome; CHROME=, FABRIC_JS=)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { openStudio, live } from './_showcase_harness.mjs';
const DIR = new URL('../assets/showcase/', import.meta.url).pathname;
const idx = JSON.parse(readFileSync(DIR + 'index.json', 'utf8'));
const want = process.argv.slice(2);
const ids = want.length ? want : idx.filter(live).map(c => c.id);
const { browser, page, errors } = await openStudio('&emoji=off');
const report = [];
for (let i = 0; i < ids.length; i += 20){
  const out = await page.evaluate(async batch => {
    /* the number's offset on its plate, signed, as a share of the plate */
    const offset = t => {
      const { sc } = __sc.paint(t), W = TPL_W, H = TPL_H, objs = sc.getObjects();
      const ph = objs.find(o => o.pgRole === 'phone' && o.visible !== false);
      const r = { gate: pgCheck(sc) };
      if (ph){
        ph.setCoords(); const q = ph.getBoundingRect(true, true), b = { x: q.left, y: q.top, w: q.width, h: q.height };
        const pl = pgPlateUnder(objs, ph, b, W, H);
        if (pl){
          const ctx = sc.lowerCanvasEl.getContext('2d'); sc.renderAll();
          const x0 = Math.max(0, Math.floor(b.x) - 6), y0 = Math.max(0, Math.floor(b.y) - 6), w = Math.min(W, Math.ceil(b.x + b.w) + 6) - x0, h = Math.min(H, Math.ceil(b.y + b.h) + 6) - y0;
          const on = ctx.getImageData(x0, y0, w, h).data; ph.visible = false; sc.renderAll();
          const off = ctx.getImageData(x0, y0, w, h).data; ph.visible = true; sc.renderAll();
          let L = 1e9, R = -1, T = 1e9, B = -1;
          for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){ const k = (y * w + x) * 4;
            if (Math.abs(on[k] - off[k]) + Math.abs(on[k + 1] - off[k + 1]) + Math.abs(on[k + 2] - off[k + 2]) < 90) continue;
            L = Math.min(L, x); R = Math.max(R, x); T = Math.min(T, y); B = Math.max(B, y); }
          const sx0 = Math.max(0, pl.x), sx1 = Math.min(W, pl.x + pl.w), sy0 = Math.max(0, pl.y), sy1 = Math.min(H, pl.y + pl.h);
          if (R >= 0){ r.dx = x0 + (L + R) / 2 - (sx0 + sx1) / 2; r.dy = y0 + (T + B) / 2 - (sy0 + sy1) / 2; r.pw = sx1 - sx0; r.ph = sy1 - sy0; }
        }
      }
      sc.dispose();
      return r;
    };
    const res = [];
    for (const id of batch){
      try {
        const rec = await fetch('assets/showcase/tpl/' + id + '.json', { cache:'no-store' }).then(r => r.json());
        const t0 = await __sc.prep(rec, id);
        const m0 = offset(t0);
        if (!m0.gate.fails.some(f => f.code === 'numCentre')) continue;
        const num = rec.tpl.layers.find(l => l.name === 'Phone Number' || l.role === 'phone');
        if (!num || m0.dx == null){ res.push({ id, why: 'no number or plate to measure' }); continue; }
        let m = m0, t = t0;
        for (let k = 0; k < 4 && (Math.abs(m.dx) > 0.03 * m.pw || Math.abs(m.dy) > 0.03 * m.ph); k++){
          num.props.left -= m.dx; num.props.top -= m.dy;
          t = await __sc.prep(rec, id); m = offset(t);
          if (m.dx == null) break;
        }
        const ok = m.dx != null && !m.gate.fails.some(f => f.code === 'numCentre') && __sc.accept(m0.gate, m.gate).ok;
        if (!ok){ res.push({ id, why: 'not kept: ' + m.gate.fails.map(f => f.code).join(',') }); continue; }
        const jpg = renderThumb(t, 1080);
        const img = await new Promise(r => { const el = new Image(); el.onload = () => r(el); el.onerror = () => r(null); el.src = jpg; });
        const cv = document.createElement('canvas'); cv.width = cv.height = 448;
        const g = cv.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, 448, 448);
        res.push({ id, rec, webp: cv.toDataURL('image/webp', 0.74), jpg,
          was: +(Math.max(Math.abs(m0.dx / m0.pw), Math.abs(m0.dy / m0.ph))).toFixed(3), now: +(Math.max(Math.abs(m.dx / m.pw), Math.abs(m.dy / m.ph))).toFixed(3) });
      } catch (e){ res.push({ id, why: String(e).slice(0, 120) }); }
    }
    return res;
  }, ids.slice(i, i + 20));
  for (const r of out){
    if (!r.rec){ report.push(r.id + '  ' + r.why); continue; }
    writeFileSync(DIR + 'tpl/' + r.id + '.json', JSON.stringify(r.rec));
    writeFileSync(DIR + r.id + '.webp', Buffer.from(r.webp.split(',')[1], 'base64'));
    if (process.env.PREVIEW) writeFileSync(process.env.PREVIEW + '/' + r.id + '.jpg', Buffer.from(r.jpg.split(',')[1], 'base64'));
    report.push(r.id + '  centred: ' + Math.round(r.was * 100) + '% off -> ' + Math.round(r.now * 100) + '%');
  }
}
await browser.close();
report.forEach(r => console.log(r));
console.log('cards checked ' + ids.length + ', centred ' + report.filter(r => / centred/.test(r)).length + ', left ' + report.filter(r => !/ centred/.test(r)).length + ' · page errors ' + errors.length);
