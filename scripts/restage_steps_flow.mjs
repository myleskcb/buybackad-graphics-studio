#!/usr/bin/env node
/* RESTAGE A STEPS FLOW CARD — the owner's teardown of stepsFlow-nn05-30,
 * 2026-09-27, as a layout pass anyone can re-run.
 *
 *   "quite literally the worst ad I've ever seen you make. The background image
 *    is dope. It sucks that we're wasting such a great background image. The
 *    boxes look cheesy. There's too many type faces … it looks a bit blurry for
 *    the subtext in each bubble and number three isn't even centered … the
 *    tagline just says iPhone, that's abysmal … EZ BUYER does not count as part
 *    of the headline, that's just an extra selling point … a verification
 *    badge, a shield icon … what if we mirrored [the phone] to face the other
 *    way and put it to the right of the three boxes with the steps, that space
 *    looks perfectly carved out for the phone and it leaves space for the
 *    background image."
 *
 * What it does to the record (DESIGN-LAW 68-74):
 *   headline   a claim, two lines, in the card's display face: TOP iPHONE /
 *              BUYER, sized to the width inside the margins (rule 68)
 *   badge      the kicker's words become a verification mark: shield-tick +
 *              words on a pill, set on the claim's second line, in the CTA's
 *              own colour (rules 69, 74). No floating pill at the top.
 *   type       two faces: display (headline, numerals, number) and support
 *              (badge, step titles, step lines); two weights each (rule 70)
 *   steps      three plates of ONE width and one style, flat, no sheen, no
 *              numeral boxes; the numeral in the display face in the accent;
 *              every row the same sizes; step lines 26px with no blurred shadow
 *              (rules 71, 72)
 *   product    a photo that faces into the layout (never a mirror: an iPhone's
 *              cameras would change sides), standing on the CTA band in the
 *              column the steps leave on the right, clear of the photograph's
 *              top (rule 73)
 *   deco       the floating dollar mark goes
 * Positions are measured on the real faces in the studio, then the card is
 * painted by renderThumb (the studio's own painter) and re-baked.
 *
 *   node scripts/restage_steps_flow.mjs stepsFlow-nn05-30 [more ids] [--dry]
 *   (needs :8899; CHROME=, FABRIC_JS= as for the other showcase scripts)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { openStudio } from './_showcase_harness.mjs';
const ROOT = new URL('../', import.meta.url).pathname;
const DIR = ROOT + 'assets/showcase/';
const OUT = ROOT + '.render/restage/';
mkdirSync(OUT, { recursive: true });
const args = process.argv.slice(2), DRY = args.includes('--dry');
const ids = args.filter(a => !a.startsWith('--'));
if (!ids.length){ console.error('usage: node scripts/restage_steps_flow.mjs <cardId…> [--dry]'); process.exit(2); }

/* the claim bank: everyone can say they buy; ranking claims earn the click.
   Each variant pairs a claim with a badge that shares no word with it (rule 69)
   and an accent; neon first (owner, 2026-09-27: "neon is the easiest attention
   grabber"). The first variant is written to the record, the rest are rendered
   beside it for review. accent null keeps the card's own. */
/* The product faces into the layout by being PHOTOGRAPHED that way, never by
   mirroring: a mirrored iPhone carries its cameras on the wrong side (owner,
   2026-09-27: "make the phone flipped the correct way around instead of
   mirrored"). cosmic-orange-17 is the same iPhone 17 Pro leaning up and in,
   toward the steps and the claim; -02 stands upright on a pedestal. */
/* AUTHENTIC DEVICES ONLY (owner, 2026-09-27: "that's not a 17 Pro Max … we
   should never re-skin a device color … everything needs to look factory
   original"). The own-apple-cosmic-orange-* photos are a 16 Pro's square camera
   bump painted orange; the 17 Pro has the full-width camera plateau. The
   qs-iphone-17-* photos are the real design, back and front. */
const LEAN = { src: 'assets/cutouts/qs-iphone-17-pro.webp' };
const PEDESTAL = { src: 'assets/cutouts/qs-iphone-17-pro-max.webp' };
/* accent 'photo': the engine chooses, it does not roll (owner, 2026-09-27: "we
   wanna have the options so the design engine can produce the best possible
   graphics using our BG assets … at the end of the day we're looking for
   cohesiveness"). The photograph's dominant hue, weighted by colourfulness,
   picks the neon across the wheel from it; that one accent then carries the
   claim's second line, the badge, the numerals and the CTA (rules 74, 75). */
const VARIANTS = [
  { claim: ['TOP iPHONE', 'BUYER'],     badge: ['QUICK CASH', 'boltFast'],   accent: 'photo',   product: LEAN,     tag: 'accent from the photo, leaning phone' },
  { claim: ['TOP iPHONE', 'BUYER'],     badge: ['QUICK CASH', 'boltFast'],   accent: '#1ff0ff', product: PEDESTAL, tag: 'neon cyan, pedestal phone' },
  { claim: ['FAST CASH FOR', 'iPHONES'], badge: ['EZ BUYER', 'shieldTick'],  accent: '#c6ff1a', product: LEAN,     tag: 'neon lime' },
  { claim: ['SELL YOUR', 'iPHONE'],     badge: ['#1 BUYER', 'shieldTick'],   accent: '#ffe81a', product: LEAN,     tag: 'neon yellow' },
  { claim: ['QUICK iPHONE', 'BUYER'],   badge: ['LA \u00b7 OC \u00b7 IE', 'pin'], accent: null, product: PEDESTAL, tag: 'own accent' },
];
const MICRO = ['Snap photos, text them over.', 'Firm quote in minutes.', 'Same-day cash or transfer.'];

const { browser, page } = await openStudio();
const results = [];
const index = JSON.parse(readFileSync(DIR + 'index.json', 'utf8'));
for (const id of ids)
for (const [v, V] of VARIANTS.entries()){
  const rec = JSON.parse(readFileSync(DIR + 'tpl/' + id + '.json', 'utf8'));
  const r = await page.evaluate(async (rec, id, V, MICRO) => {
    const claim = V.claim;
    const L0 = rec.tpl.layers, get = nm => L0.find(l => l.name === nm);
    const need = ['Headline 1', 'Step Card 1', 'Step Lab 1', 'Phone Plate', 'Phone Number', 'Product'];
    const miss = need.filter(nm => !get(nm));
    if (miss.length) return { err: 'not a Steps Flow record: missing ' + miss.join(', ') };
    const DISPLAY = get('Headline 1').props.fontFamily, SUPPORT = get('Step Lab 1').props.fontFamily;
    const NEONS = ['#1ff0ff', '#c6ff1a', '#ffe81a', '#ff3fa4', '#b45cff', '#39ff88', '#ff6a1a'];
    let photoHue = null;
    if (V.accent === 'photo'){
      const src = rec.tpl.bg && rec.tpl.bg.src;
      const el = await new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
      if (el){
        const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.drawImage(el, 0, 0, 64, 64);
        const d = x.getImageData(0, 0, 64, 64).data, bins = new Array(36).fill(0);
        for (let i = 0; i < d.length; i += 4){
          const hex = '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join(''), o = hexToOklch(hex);
          if (o && o.C > 0.04) bins[Math.floor(o.h / 10) % 36] += o.C;
        }
        const k = bins.indexOf(Math.max(...bins)); photoHue = k * 10 + 5;
      }
    }
    const pickNeon = h => NEONS.map(n => { const o = hexToOklch(n), dh = Math.abs(((o.h - h) % 360 + 540) % 360 - 180); return { n, score: -Math.abs(dh - 170) }; })
      .sort((a, b) => b.score - a.score)[0].n;
    const ACCENT = V.accent === 'photo' ? (photoHue == null ? get('Phone Plate').props.fill : pickNeon(photoHue))
      : (V.accent || get('Phone Plate').props.fill), ON_ACCENT = get('Phone Number').props.fill;
    const PLATE = get('Step Card 1').props.fill;
    const INK = '#ffffff', INK2 = (get('Step Micro 1') && /^#/.test(get('Step Micro 1').props.fill) && get('Step Micro 1').props.fill !== '#ffffff')
      ? get('Step Micro 1').props.fill : '#dfe7ea';
    const W = TPL_W, H = TPL_H, M = 84, GUIDE = Math.round(0.06 * Math.min(W, H));
    const kick = V.badge[0];
    const shared = new Set(claim.join(' ').toUpperCase().split(/[^A-Z0-9#]+/).filter(w => w.length > 1));
    if (kick.toUpperCase().split(/[^A-Z0-9#]+/).some(w => w.length > 1 && shared.has(w))) return { err: 'badge ' + kick + ' repeats a word of the claim' };
    await Promise.all([DISPLAY, SUPPORT].map(f => ensureFont(f).then(() => Promise.all(['600', '800'].map(w => document.fonts.load(w + ' 40px "' + f + '"').catch(() => {}))))));
    try { fabric.util.clearFabricFontCache(); } catch (e){}
    /* the ink box of a layer as built, painted alone on a clear canvas */
    const inkBox = def => {
      const o = buildLayer(JSON.parse(JSON.stringify(def)), 'rs-' + id);
      o.shadow = null;                 // the letters, not their shadow: a blur's tail differs per glyph
      const sc = new fabric.StaticCanvas(null, { width: W, height: H, renderOnAddRemove: false, enableRetinaScaling: false });
      sc.add(o); sc.renderAll();
      const d = sc.getContext('2d').getImageData(0, 0, W, H).data;
      let x0 = W, y0 = H, x1 = -1, y1 = -1;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 40){ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      const box = o.getBoundingRect(true, true);
      sc.dispose();
      return { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1, box };
    };
    const text = (name, role, casing, t, props) => ({ kind: 'text', name, role, casing, text: t, props: Object.assign({ opacity: 1 }, props) });

    // ── the claim, as large as the margins allow (rule 68)
    const headStyle = { fontFamily: DISPLAY, fontWeight: 800, fill: INK, charSpacing: -10,
      shadow: { color: 'rgba(0,0,0,0.55)', blur: 22, offsetX: 0, offsetY: 4 } };
    /* both lines as large as the width inside the margins and the height above
       the steps allow, set tight as display type is set: 10% of the size
       between the letters (alignPass judges stacked lines by their ink, so it
       lets them sit this close) */
    /* the vertical budget: the claim, three steps, and a CTA band tall enough
       for a big number. A band that ends at the canvas edge loses its bottom
       65px to the safe margin, so the steps are tightened (116px plates, 12px
       apart) and the band starts at 830 rather than 897 */
    const stepsTop = 440, cardH = 116, cardGap = 12, bandTop = 830, headRoom = stepsTop - 44;
    let S = 204, h1, i1, h2, i2;
    for (; S >= 110; S -= 4){
      h1 = text('Headline 1', 'headline', 'upper', claim[0], Object.assign({ left: M, top: M, fontSize: S }, headStyle));
      i1 = inkBox(h1);
      if (i1.w > W - 2 * M) continue;
      // line 1's ink starts at the margin, whatever the face's side bearing
      h1.props.left = M - (i1.x0 - M); h1.props.top = M - (i1.y0 - M) + 6;
      i1 = inkBox(h1);
      h2 = text('Headline 2', 'headline', 'upper', claim[1], Object.assign({ left: M, top: 0, fontSize: S }, headStyle, { fill: ACCENT }));
      i2 = inkBox(h2);
      h2.props.top = (i1.y1 + Math.round(S * 0.1)) - i2.y0; h2.props.left = M - (i2.x0 - M);
      i2 = inkBox(h2);
      if (i2.w > W - 2 * M || i2.y1 > headRoom) continue;
      break;
    }

    // ── the verification mark on the claim's second line, in the CTA's colour (rules 69, 74)
    const bh = 62, bfs = 26, icon = 40, padL = 22, gapI = 14, padR = 26;
    const bText = text('Badge', 'sub', 'upper', kick, { left: 0, top: 0, fontFamily: SUPPORT, fontSize: bfs, fontWeight: 800, fill: ON_ACCENT, charSpacing: 90 });
    const ib = inkBox(bText);
    const bw = padL + icon + gapI + ib.w + padR;
    /* it hangs from the second line's cap height, a tag on the claim; centred
       on the line it floated in the middle of nothing ("isn't even at the top") */
    const capRef = inkBox(Object.assign(JSON.parse(JSON.stringify(h2)), { text: 'H' }));
    const bx = i2.x1 + Math.round(S * 0.14), by = capRef.y0;
    if (bx + bw > W - GUIDE) return { err: 'badge does not fit beside the second line (' + (bx + bw) + ')' };
    const pill = { kind: 'rect', name: 'Badge Pill', solid: true, __shape: 'pill', __panelSolid: true,
      props: { left: bx, top: by, width: bw, height: bh, rx: bh / 2, ry: bh / 2, fill: ACCENT, opacity: 1,
        shadow: { color: 'rgba(0,0,0,0.35)', blur: 14, offsetX: 0, offsetY: 4 } } };
    const mark = { kind: 'path', icon: V.badge[1], name: 'Badge Icon', role: 'deco', __element: true,
      props: { left: bx + padL, top: by + (bh - icon) / 2, size: icon, fill: ON_ACCENT, opacity: 1 } };
    bText.props.left = bx + padL + icon + gapI - ib.x0; bText.props.top = by + bh / 2 - ib.h / 2 - ib.y0;
    // the mark's INK on the pill's centre line: a bolt does not fill its icon box evenly
    { const im = inkBox(mark); if (im.y1 > 0) mark.props.top += (by + bh / 2) - (im.y0 + im.y1 + 1) / 2; }

    // ── three plates, one width, one style; the numeral in the display face (rules 70-72)
    const cardTop = [0, 1, 2].map(k => stepsTop + k * (cardH + cardGap)), cardW = 560;
    const labs = [1, 2, 3].map(i => (get('Step Lab ' + i) || {}).text || ['TEXT PICS', 'GET OFFER', 'GET PAID'][i - 1]);
    const steps = [];
    cardTop.forEach((y, k) => {
      const i = k + 1;
      steps.push({ kind: 'rect', name: 'Step Card ' + i, solid: true, __panelSolid: true,
        props: { left: M, top: y, width: cardW, height: cardH, rx: 22, ry: 22, fill: PLATE, opacity: 1,
          shadow: { color: 'rgba(0,0,0,0.28)', blur: 18, offsetX: 0, offsetY: 6 } } });
      const num = text('Step Num ' + i, 'deco', 'none', String(i), { left: 0, top: 0, originX: 'left', fontFamily: DISPLAY, fontSize: 96, fontWeight: 800, fill: ACCENT, charSpacing: 0 });
      const iN = inkBox(num);
      num.props.left = M + 64 - iN.w / 2 - iN.x0; num.props.top = y + cardH / 2 - iN.h / 2 - iN.y0;
      const lab = text('Step Lab ' + i, 'info', 'upper', labs[k], { left: 0, top: 0, fontFamily: SUPPORT, fontSize: 36, fontWeight: 800, fill: INK, charSpacing: 40 });
      const mic = text('Step Micro ' + i, 'info', 'none', MICRO[k], { left: 0, top: 0, fontFamily: SUPPORT, fontSize: 26, fontWeight: 600, fill: INK2, charSpacing: 0 });
      const iL = inkBox(lab), iM = inkBox(mic);
      const gap = 14, block = iL.h + gap + iM.h, top = y + (cardH - block) / 2, tx = M + 134;
      lab.props.left = tx - iL.x0; lab.props.top = top - iL.y0;
      mic.props.left = tx - iM.x0; mic.props.top = top + iL.h + gap - iM.y0;
      if (tx + Math.max(iL.w, iM.w) > M + cardW - 26) return steps.push({ err: 'step ' + i + ' copy is wider than its plate' });
      steps.push(num, lab, mic);
    });
    const bad = steps.find(s => s.err); if (bad) return { err: bad.err };

    // ── the product, mirrored, in the column the steps leave (rule 73)
    const prod = JSON.parse(JSON.stringify(get('Product')));
    /* the phone stands on the band: its base breaks the band's top edge, which
       sets it in the scene rather than pasted over it */
    const colX0 = M + cardW + 26, colX1 = W - GUIDE, top = cardTop[0] - 10, bottom = bandTop + 26;
    if (V.product && V.product.src) prod.props.src = V.product.src;
    await new Promise(res => { if (CUTOUT_ELS[prod.props.src]) return res(); const el = new Image(); el.onload = () => { CUTOUT_ELS[prod.props.src] = el; res(); }; el.onerror = res; el.src = prod.props.src; });
    // anchored at its foot, so whatever the photo's shape the phone stands on the band
    Object.assign(prod.props, { left: Math.round((colX0 + colX1) / 2), top: bottom, originX: 'center', originY: 'bottom',
      w: colX1 - colX0, maxH: bottom - top, flipX: false, opacity: 1,
      shadow: { color: 'rgba(0,0,0,0.5)', blur: 34, offsetX: 12, offsetY: 18 } });
    // a photo carries transparent margin under the phone: stand the INK on the band
    { const ip = inkBox(prod); if (ip.y1 > 0) prod.props.top = Math.round(prod.props.top + (bottom - 1 - ip.y1)); }

    // ── assemble: the ground, the product, the claim and its mark, the steps, the number
    const keep = nm => get(nm) ? [JSON.parse(JSON.stringify(get(nm)))] : [];
    const band = keep('Phone Plate');
    band.forEach(l => { l.props.fill = ACCENT; if (l.props.stroke) l.props.stroke = ACCENT;   // the badge's colour is the CTA's (rule 74)
      Object.assign(l.props, { top: bandTop, height: H - bandTop + 3, originY: 'top' }); });
    /* the band carries the number and nothing else: the website line under it
       took a third of the band's height and held the number to 45% of it */
    const site = [];
    const phone = keep('Phone Number');
    phone.forEach(l => Object.assign(l.props, { top: Math.round((bandTop + H - GUIDE) / 2), originY: 'center' }));
    // band before the product: the phone's base stands on it
    const layers = [].concat(keep('Vignette'), band, [prod], [h1, h2, pill, mark, bText], steps,
      phone, keep('Grain'), site);
    const out = JSON.parse(JSON.stringify(rec));
    out.tpl.layers = layers.map(l => Object.assign(l, { __ink: 1 }));   // laid out by its letters (rule 76)
    out.restaged = { by: 'scripts/restage_steps_flow.mjs', at: '2026-09-27', rules: [68, 69, 70, 71, 72, 73, 74], variant: V.tag };

    /* the number fills its band (numberFill, the Easy Mode pass) and the record
       keeps that size, so the thumbnail shows the card that opens */
    {
      const t0 = await __sc.prep(out, id), { sc } = __sc.paint(t0);
      const r = numberFill(sc, W, H), ph = sc.getObjects().find(o => o.name === 'Phone Number');
      if (r && ph){
        const L = out.tpl.layers.find(l => l.name === 'Phone Number'), c = ph.getCenterPoint();
        L.props.fontSize = Math.round((ph.fontSize || 80) * (ph.scaleY || 1) * 10) / 10;
        Object.assign(L.props, { left: Math.round(c.x), top: Math.round(c.y), originX: 'center', originY: 'center' });
      }
      sc.dispose();
    }
    // paint it with the studio's own painter; the full size for review and the gallery's webp
    const t = await __sc.prep(out, id);
    const jpg = renderThumb(t, 1080);
    const img = await new Promise(res => { const el = new Image(); el.onload = () => res(el); el.onerror = () => res(null); el.src = jpg; });
    const cv = document.createElement('canvas'); cv.width = cv.height = 448;
    const g = cv.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, 448, 448);
    const full = document.createElement('canvas'); full.width = full.height = 1080; full.getContext('2d').drawImage(img, 0, 0);
    // what the painter did to it: every text's final box, and the faces in use
    const { sc } = __sc.paint(t);
    const boxes = sc.getObjects().filter(o => o.visible !== false && (o.type === 'i-text' || o.type === 'textbox' || o.type === 'image' || o.type === 'rect'))
      .map(o => { const b = o.getBoundingRect(true, true); return [o.name, Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height), o.visible !== false]; });
    const faces = [...new Set(sc.getObjects().filter(o => o.fontFamily && /\S/.test(o.text || '')).map(o => o.fontFamily))];
    /* where the ink really landed, per object, after the painter's own passes:
       each drawn alone and scanned inside its box */
    const ink = {};
    {
      const objs = sc.getObjects(), vis = objs.map(o => o.visible), bgI = sc.backgroundImage, bgC = sc.backgroundColor;
      sc.backgroundImage = null; sc.backgroundColor = '';
      objs.filter(o => /^(Step (Num|Lab|Micro|Card) \d|Badge|Badge Pill|Badge Icon|Headline [12]|Phone Number|Phone Plate|Product|Website)$/.test(o.name || '') && o.visible !== false).forEach(o => {
        objs.forEach(q => { q.visible = q === o; }); o.shadow && (o._sh = o.shadow, o.shadow = null); sc.renderAll();
        const b = o.getBoundingRect(true, true), x0 = Math.max(0, Math.floor(b.left) - 2), y0 = Math.max(0, Math.floor(b.top) - 2);
        const w = Math.min(W - x0, Math.ceil(b.width) + 4), h = Math.min(H - y0, Math.ceil(b.height) + 4);
        const d = sc.getContext('2d').getImageData(x0, y0, w, h).data;
        let a = w, c = h, e = -1, f = -1;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 60){ if (x < a) a = x; if (x > e) e = x; if (y < c) c = y; if (y > f) f = y; }
        if (o._sh){ o.shadow = o._sh; delete o._sh; }
        ink[o.name] = [x0 + a, y0 + c, x0 + e, y0 + f];
      });
      objs.forEach((q, i) => { q.visible = vis[i]; }); sc.backgroundImage = bgI; sc.backgroundColor = bgC;
    }
    // the critic (rule 54) on the lines that sell: each hidden against what is behind it
    const crit = typeof taglineCritic === 'function' ? taglineCritic(sc, W, H) : [];
    sc.dispose();
    return { rec: out, webp: cv.toDataURL('image/webp', 0.74), png: full.toDataURL('image/png'), S, faces, boxes, crit, accent: ACCENT, photoHue, ink };
  }, rec, id, V, MICRO).catch(e => ({ err: String(e) }));
  if (r.err){ console.log(id, V.tag, 'FAILED', r.err); results.push({ id, v, err: r.err }); continue; }
  writeFileSync(OUT + id + '-v' + (v + 1) + '.png', Buffer.from(r.png.split(',')[1], 'base64'));
  if (!DRY && v === 0){
    writeFileSync(DIR + 'tpl/' + id + '.json', JSON.stringify(r.rec));
    writeFileSync(DIR + id + '.webp', Buffer.from(r.webp.split(',')[1], 'base64'));
    const c = index.find(x => x.id === id);
    if (c && r.accent){ c.accent = r.accent; }
  }
  console.log(id, 'v' + (v + 1), V.tag, 'accent ' + r.accent + (r.photoHue != null ? ' (photo hue ' + r.photoHue + ')' : ''), V.claim.join(' ') + ' + ' + V.badge[0], 'headline ' + r.S + 'px', 'faces: ' + r.faces.join(' + '),
    'critic ' + r.crit.map(c => c.text + ' ' + c.q75).join(' | '), v === 0 && !DRY ? 'WRITTEN' : '');
  results.push({ id, v: v + 1, tag: V.tag, S: r.S, faces: r.faces, crit: r.crit, ink: r.ink, boxes: r.boxes });
  writeFileSync(OUT + id + '-v' + (v + 1) + '.json', JSON.stringify(r.rec));
}
if (!DRY) writeFileSync(DIR + 'index.json', JSON.stringify(index));
writeFileSync(OUT + 'report.json', JSON.stringify(results, null, 1));
await browser.close();
process.exit(results.some(r => r.err) ? 1 : 0);
