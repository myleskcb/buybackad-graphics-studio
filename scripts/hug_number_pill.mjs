#!/usr/bin/env node
/* THE NUMBER'S PLATE HUGS THE NUMBER (owner, 2026-09-30: "The CTA is not
 * centered so it doesn't look great and we could really shorten the width of
 * the box to just fit the phone number and a little margin").
 *
 * On the scriptRetro cards the footer-bar pass (retheme_lab.mjs, THE FOOTER
 * BAR) stretched the phone plate edge to edge and past the bottom of the
 * canvas, while a later pass left the number where it was: the digits
 * straddle the bar's top edge. Measured on the painted card, the number's ink
 * sat 60px above the bar's centre on every one of them.
 *
 * Per card, on the pixels the studio paints (renderThumb's sequence):
 *   1. measure the number's box and ink, and the lines stacked over it
 *   2. rebuild the plate as a pill centred on the number, at the size the
 *      painter itself gives a one-line plate (alignPass step 4), ending at
 *      the bottom guide
 *   3. the website, CTA and model-list lines rise only as far as they must to
 *      clear it, keeping their gaps (a wide gap closes to 56px first); a card
 *      whose stack would reach the claim is skipped and reported
 *   4. the model-list pill takes the plate's colour and the number's ink, so
 *      the card carries one accent ("if we're gonna use the red color for the
 *      theme, then let's make the inner box red too")
 *   5. repaint, keep the card only if the number is centred on its pill (4px)
 *      and the painter left the pill its size, and re-bake the thumbnail
 *
 *   node scripts/hug_number_pill.mjs [cardId…]   (:8899 + Chrome; CHROME=, FABRIC_JS=)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { openStudio } from './_showcase_harness.mjs';
const ROOT = new URL('../', import.meta.url).pathname, DIR = ROOT + 'assets/showcase/';
const idx = JSON.parse(readFileSync(DIR + 'index.json', 'utf8'));
const want = process.argv.slice(2);
const isBar = rec => rec.tpl.layers.some(l => l.__footerBar && l.__ctaPlate) && rec.tpl.layers.some(l => l.name === 'Phone Number');
const ids = (want.length ? want : idx.map(c => c.id).filter(id => /^scriptRetro-/.test(id)))
  .filter(id => { try { return isBar(JSON.parse(readFileSync(DIR + 'tpl/' + id + '.json', 'utf8'))); } catch (e){ return false; } });
const { browser, page, errors } = await openStudio();

/* ink box of a layer: the pixels that change when it is hidden */
async function measure(id, rec){
  return page.evaluate(async (id, rec) => {
    const t = await __sc.prep(rec, id);
    const { sc, refs } = __sc.paint(t);
    const W = TPL_W, H = TPL_H, ctx = sc.lowerCanvasEl.getContext('2d');
    const full = ctx.getImageData(0, 0, W, H).data;
    const ink = name => {
      const k = t.layers.findIndex(l => l.name === name), o = refs[k];
      if (!o) return null;
      const b = o.getBoundingRect(true, true);
      const x0 = Math.max(0, Math.floor(b.left) - 8), y0 = Math.max(0, Math.floor(b.top) - 8);
      const x1 = Math.min(W, Math.ceil(b.left + b.width) + 8), y1 = Math.min(H, Math.ceil(b.top + b.height) + 8);
      o.visible = false; sc.renderAll();
      const d = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
      o.visible = true; sc.renderAll();
      let l = 1e9, r = -1, tp = 1e9, bt = -1;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++){
        const f = (y * W + x) * 4, g = ((y - y0) * (x1 - x0) + (x - x0)) * 4;
        if (Math.abs(full[f] - d[g]) + Math.abs(full[f + 1] - d[g + 1]) + Math.abs(full[f + 2] - d[g + 2]) < 60) continue;
        l = Math.min(l, x); r = Math.max(r, x); tp = Math.min(tp, y); bt = Math.max(bt, y);
      }
      return r < 0 ? null : { left:l, right:r + 1, top:tp, bottom:bt + 1 };
    };
    const box = name => { const k = t.layers.findIndex(l => l.name === name); if (!refs[k]) return null;
      const b = refs[k].getBoundingRect(true, true); return { left:b.left, right:b.left + b.width, top:b.top, bottom:b.top + b.height }; };
    const out = { num: ink('Phone Number'), cue: ink('Phone Cue'), plate: box('Phone Plate'),
      numBox: box('Phone Number'), cta: box('CTA'), web: box('Website'), panel: box('Items Panel'), items: box('Items'), divider: box('Divider'),
      claim: Math.max(0, ...t.layers.map((l, k) => { if (!refs[k] || l.role !== 'headline') return 0;
        const b = refs[k].getBoundingRect(true, true); return b.top + b.height; })) };
    sc.dispose();
    return out;
  }, id, rec);
}

/* The painter (alignPass step 4, FIT A BOX TO ITS CONTENT) sizes a plate that
   holds one line to the line's box plus 0.66x its type size a side and 0.44x
   above and below, and re-fits any plate more than 10px off that. The pill is
   authored at exactly that size, so the painter leaves it where it is put;
   and the guides (step 5) move the whole card when anything passes y 1015, so
   the pill ends there and the lines over it make room. */
const G = Math.round(0.06 * 1080), GAP = 16;
const report = [];
for (const id of ids){
  const file = DIR + 'tpl/' + id + '.json';
  const rec = JSON.parse(readFileSync(file, 'utf8'));
  const L = rec.tpl.layers, W = 1080, H = 1080;
  const by = n => L.find(l => l.name === n);
  const plate = L.find(l => l.name === 'Phone Plate' && l.__footerBar);
  const num = by('Phone Number'), cue = by('Phone Cue');
  if (!plate || !num){ report.push(id + '  skipped: no plate/number'); continue; }
  const m = await measure(id, rec);
  if (!m.num || !m.numBox){ report.push(id + '  skipped: number has no ink'); continue; }
  const fs = num.props.fontSize || 84;
  const padH = Math.round(fs * 0.66), padV = Math.round(fs * 0.44);
  const nb = m.numBox, nbW = nb.right - nb.left, nbH = nb.bottom - nb.top;
  const pw = nbW + 2 * padH, ph = nbH + 2 * padV;
  const pBottom = H - G - 2, pTop = pBottom - ph;
  const ncx = W / 2;
  /* the number: its box centred on the card, standing padV inside the pill */
  const ndx = ncx - (nb.left + nb.right) / 2, ndy = (pTop + padV) - nb.top;
  num.props.left += ndx; num.props.top += ndy;
  Object.assign(plate.props, { left:ncx - pw / 2, originX:'left', top:pTop, originY:'top', width:pw, height:ph, rx:ph / 2 });
  delete plate.__footerBar;
  plate.__shape = 'pill';
  /* the cue (a mark beside the number) stands just off the pill's left end */
  if (cue && cue.props){
    const sz = cue.props.size || 58;
    Object.assign(cue.props, { left:ncx - pw / 2 - 14 - sz, top:pTop + ph / 2 - sz / 2, originX:'left', originY:'top' });
  }
  /* the lines over the pill stack upward, each keeping its own gap to the
     one under it, moving only as far as they must: website, CTA, then the
     model list with its panel and rule as one unit */
  const units = [
    { names:['Website'], b:m.web },
    { names:['CTA'], b:m.cta },
    { names:['Items Panel', 'Items', 'Divider'], b:[m.panel, m.items, m.divider].filter(Boolean).reduce((u, x) => u ? { top:Math.min(u.top, x.top), bottom:Math.max(u.bottom, x.bottom) } : { top:x.top, bottom:x.bottom }, null) },
  ].filter(u => u.b).sort((a, b) => b.b.top - a.b.top);
  let under = { top:m.numBox.top, newTop:pTop };   // the pill replaces the number's old box as the floor
  const moves = [];
  for (const u of units){
    const gap = Math.min(56, Math.max(GAP, under.top - u.b.bottom));   // a wide gap closes to 56px before anything rises further
    const dy = Math.min(0, (under.newTop - gap) - u.b.bottom);
    moves.push([u, dy]);
    under = { top:u.b.top, newTop:u.b.top + dy };
  }
  if (under.newTop < m.claim + 24){ report.push(id + '  skipped: the stack reaches the claim (' + Math.round(under.newTop) + ' < ' + Math.round(m.claim) + ')'); continue; }
  moves.forEach(([u, dy]) => { if (dy) u.names.forEach(n => { const l = by(n); if (l && l.props) l.props.top += dy; }); });
  /* one accent: the model list sits on the plate's colour, in the number's ink */
  const panel = by('Items Panel'), items = by('Items');
  if (panel && items && plate.props.fill){
    panel.props.fill = plate.props.fill;
    items.props.fill = num.props.fill;
    if (items.props.shadow) delete items.props.shadow;
  }
  /* verify on the repainted card */
  const v = await measure(id, rec);
  if (process.env.DEBUG) console.log(JSON.stringify({ m, v, num: num.props, plate: plate.props }));
  const vc = v.num && { x:(v.num.left + v.num.right) / 2, y:(v.num.top + v.num.bottom) / 2 };
  const pc = v.plate && { x:(v.plate.left + v.plate.right) / 2, y:(v.plate.top + v.plate.bottom) / 2 };
  /* the ink centred on the pill and inside it; the pill the size it was
     authored, or that size scaled evenly (cards whose product already reaches
     past the guides are shifted and scaled whole by the painter, as before) */
  const vw = v.plate && v.plate.right - v.plate.left, vh = v.plate && v.plate.bottom - v.plate.top;
  const ok = vc && pc && Math.abs(vc.x - pc.x) <= 4 && Math.abs(vc.y - pc.y) <= 4
    && v.num.left > v.plate.left && v.num.right < v.plate.right && v.num.top > v.plate.top && v.num.bottom < v.plate.bottom
    && vh <= ph + 3 && vh >= ph * 0.9 && Math.abs(vw / vh - pw / ph) <= 0.05 * pw / ph;
  if (!ok){ report.push(id + '  NOT written: the painter moved it ' + JSON.stringify({ vc, pc, plate: v.plate, pTop, pw })); continue; }
  writeFileSync(file, JSON.stringify(rec));
  report.push(id + '  pill ' + Math.round(pw) + 'x' + Math.round(ph) + ' at y ' + Math.round(pTop) + ', lines over it raised ' + moves.map(([u, dy]) => u.names[0] + ' ' + Math.round(dy)).join(', '));
}

/* re-bake the thumbnails, as repair_showcase_contrast.mjs does */
const done = report.filter(r => / pill /.test(r)).map(r => r.split(' ')[0]);
for (let i = 0; i < done.length; i += 8){
  const out = await page.evaluate(async ids => {
    const res = [];
    for (const id of ids){
      const t = await __sc.load(id);
      const jpg = renderThumb(t, 1080);
      const img = await new Promise(r => { const el = new Image(); el.onload = () => r(el); el.onerror = () => r(null); el.src = jpg; });
      const cv = document.createElement('canvas'); cv.width = cv.height = 448;
      const g = cv.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, 448, 448);
      res.push({ id, webp:cv.toDataURL('image/webp', 0.74), jpg });
    }
    return res;
  }, done.slice(i, i + 8));
  out.forEach(r => {
    writeFileSync(DIR + r.id + '.webp', Buffer.from(r.webp.split(',')[1], 'base64'));
    if (process.env.PREVIEW) writeFileSync(process.env.PREVIEW + '/' + r.id + '.jpg', Buffer.from(r.jpg.split(',')[1], 'base64'));
  });
}
await browser.close();
report.forEach(r => console.log(r));
console.log('rebuilt ' + done.length + ' of ' + ids.length + ' · page errors ' + errors.length);
