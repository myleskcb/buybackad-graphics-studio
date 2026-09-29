/* THE STEPS FLOW COMPOSER, shared by scripts/restage_steps_flow.mjs (the
 * owner-approved restage of stepsFlow-nn05-30) and scripts/variant_board.mjs
 * (the audited variant board). It runs in the studio page: every position is
 * measured on the real faces, then the card is painted by the studio's own
 * painter. With no options it writes exactly the approved design; the options
 * choose among the owner's approved parts:
 *   V.claim [line 1, line 2]      V.badge [words, mark]     V.accent 'photo' | hex | null
 *   V.product { src }             V.fonts FONT_PAIRS entry  V.plate { shape, fill, outline }
 *   V.cta { shape, outline }      V.look  a tagline look for the card (applyCardLook)
 * page.evaluate(composeInPage, rec, id, V, MICRO) → { rec, webp, png, S, faces, boxes, crit, accent, photoHue, ink } | { err } */
export const MICRO = ['Snap photos, text them over.', 'Firm quote in minutes.', 'Same-day cash or transfer.'];
export async function composeInPage(rec, id, V, MICRO){
  const claim = V.claim;
  const L0 = rec.tpl.layers, get = nm => L0.find(l => l.name === nm);
  const need = ['Headline 1', 'Step Card 1', 'Step Lab 1', 'Phone Plate', 'Phone Number', 'Product'];
  const miss = need.filter(nm => !get(nm));
  if (miss.length) return { err: 'not a Steps Flow record: missing ' + miss.join(', ') };
  /* the faces: a pair by voice (V.fonts: display [family, weight], support
     [family, label weight, line weight]) or the record's own two */
  const F = V.fonts || null;
  const DISPLAY = F ? F.display[0] : get('Headline 1').props.fontFamily, SUPPORT = F ? F.support[0] : get('Step Lab 1').props.fontFamily;
  const DW = F ? F.display[1] : 800, LW = F ? F.support[1] : 800, MW = F ? F.support[2] : 600;
  /* the shapes: the step plates (V.plate: shape rounded | pill | sharp, fill
     solid | smoked, outline) and the CTA (V.cta: shape band | card | pill,
     outline); the badge takes the CTA's shape and outline (rules 69, 74) */
  const PL = Object.assign({ shape: 'rounded', fill: 'solid', outline: false }, V.plate || {});
  const CT = Object.assign({ shape: 'band', outline: false }, V.cta || {});
  const NEONS = ['#1ff0ff', '#c6ff1a', '#ffe81a', '#ff3fa4', '#b45cff', '#39ff88', '#ff6a1a'];
  let photoHue = null;
  if (V.accent === 'photo' || (V.accent && V.accent.from)){
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
  /* V.accent { from: [hex…] }: the voice's own colours, the one across the wheel from the photograph */
  const pickFrom = (list, h) => h == null ? list[0] : list.map(n => { const o = hexToOklch(n), dh = Math.abs(((o.h - h) % 360 + 540) % 360 - 180); return { n, score: -Math.abs(dh - 170) }; })
    .sort((a, b) => b.score - a.score)[0].n;
  let ACCENT = V.accent && V.accent.from ? pickFrom(V.accent.from, photoHue)
    : V.accent === 'photo' ? (photoHue == null ? get('Phone Plate').props.fill : pickNeon(photoHue))
    : (V.accent || get('Phone Plate').props.fill);
  const ON_ACCENT = get('Phone Number').props.fill;
  /* the number reads at 7:1 on its band (rules 53, 74): a mid neon (pink,
     violet) under dark digits read 5.4-5.8:1, so the accent is lifted in
     lightness, hue and colourfulness kept, until it does */
  {
    const lum = hex => { const n = parseInt(hex.slice(1), 16), f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(n >> 16 & 255) + 0.7152 * f(n >> 8 & 255) + 0.0722 * f(n & 255); };
    const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const o = hexToOklch(ACCENT);
    for (let L = o.L; cr(ACCENT, ON_ACCENT) < 7 && L < 0.95; L += 0.02) ACCENT = oklchFit({ L, C: o.C, h: o.h });
  }
  const PLATE = get('Step Card 1').props.fill;
  const INK_ON_PLATE = '#ffffff', INK2 = (get('Step Micro 1') && /^#/.test(get('Step Micro 1').props.fill) && get('Step Micro 1').props.fill !== '#ffffff')
    ? get('Step Micro 1').props.fill : '#dfe7ea';
  const W = TPL_W, H = TPL_H, M = 84, GUIDE = Math.round(0.06 * Math.min(W, H));
  /* ink direction: the claim sits on the photograph's top 40%. A light ground
     takes dark ink and a deep accent (a dark shade strong enough for white type
     on a white photograph would smother it); a dark or mid ground keeps white
     ink and the neon accent. Measured on the square's own crop. */
  let lightGround = false, groundLo = 1;
  {
    const src = rec.tpl.bg && rec.tpl.bg.src;
    const el = src && await new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
    if (el){
      const c = document.createElement('canvas'); c.width = c.height = 108; const x = c.getContext('2d');
      const k = Math.max(108 / el.width, 108 / el.height); x.drawImage(el, (108 - el.width * k) / 2, (108 - el.height * k) / 2, el.width * k, el.height * k);
      const d = x.getImageData(0, 6, 108, 38).data, L = [];
      const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      for (let i = 0; i < d.length; i += 4) L.push(0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]));
      L.sort((a, b) => a - b); lightGround = L[L.length >> 1] > 0.3;
      groundLo = L[Math.floor(L.length * 0.2)];              // the darker fifth of the claim's ground
    }
  }
  const kick = V.badge[0];
  const shared = new Set(claim.join(' ').toUpperCase().split(/[^A-Z0-9#]+/).filter(w => w.length > 1));
  if (kick.toUpperCase().split(/[^A-Z0-9#]+/).some(w => w.length > 1 && shared.has(w))) return { err: 'badge ' + kick + ' repeats a word of the claim' };
  await Promise.all([DISPLAY, SUPPORT].map(f => ensureFont(f).then(() => Promise.all(['600', '800', String(DW), String(LW), String(MW)].map(w => document.fonts.load(w + ' 40px "' + f + '"').catch(() => {}))))));
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
  /* what the card's own look does to the claim's letters (applyCardLook paints
     it after layout): an outline grows every letter by half its stroke, a 3-D
     block hangs depth under and beside them, red and blue print to the sides.
     The claim is spaced for its letters as they will be seen (rules 68, 69). */
  const LK = V.look ? (typeof V.look === 'string' ? (TAGLINE_LOOKS[V.look] || {}) : V.look) : null;
  const lookSW = s => !LK ? 0 : (LK.outline === 'black' || LK.outline === 'white') ? Math.max(3, s * 0.085)
    : LK.effect === 'glow' ? Math.max(2, s * 0.035) : LK.effect === 'extrude' ? Math.max(1.5, s * 0.03) : 0;
  const lookDepth = s => LK && LK.effect === 'extrude' ? s * 0.18 : 0;
  const lookSide = s => LK && LK.effect === 'anaglyph' ? s * 0.05 : lookDepth(s) * 0.8;

  // ── the claim, as large as the margins allow (rule 68)
  const headStyle = lightGround
    ? { fontFamily: DISPLAY, fontWeight: DW, fill: '#0e0e12', charSpacing: -10 }
    : { fontFamily: DISPLAY, fontWeight: DW, fill: '#ffffff', charSpacing: -10, shadow: { color: 'rgba(0,0,0,0.55)', blur: 22, offsetX: 0, offsetY: 4 } };
  const deep = hex => { const o = hexToOklch(hex); return o ? oklchFit({ L: 0.46, C: Math.max(0.12, o.C), h: o.h }) : hex; };
  /* a variant solves the second line's colour on a light ground: darker until it reads 5:1
     against the darker fifth of what is behind the claim (a fixed deep green read 1.1:1 on mauve) */
  const deepFor = hex => { const o = hexToOklch(hex); if (!o) return hex;
    const lum = h => { const n = parseInt(h.slice(1), 16), f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(n >> 16 & 255) + 0.7152 * f(n >> 8 & 255) + 0.0722 * f(n & 255); };
    let L = 0.46, c = oklchFit({ L, C: Math.max(0.12, o.C), h: o.h });
    while (L > 0.12 && (groundLo + 0.05) / (lum(c) + 0.05) < 5){ L -= 0.02; c = oklchFit({ L, C: Math.max(0.1, o.C), h: o.h }); }
    return c; };
  /* both lines as large as the width inside the margins and the height above
     the steps allow, set tight as display type is set: 10% of the size
     between the letters (alignPass judges stacked lines by their ink, so it
     lets them sit this close) */
  /* the vertical budget: the claim, three steps, and a CTA band tall enough
     for a big number. A band that ends at the canvas edge loses its bottom
     65px to the safe margin, so the steps are tightened (116px plates, 12px
     apart) and the band starts at 830 rather than 897 */
  const stepsTop = 440, cardH = 116, cardGap = 12, bandTop = 830, headRoom = stepsTop - 44;
  const bh = 62, bfs = 26, icon = 40, padL = 22, gapI = 14, padR = 26;
  const bText = text('Badge', 'sub', 'upper', kick, { left: 0, top: 0, fontFamily: SUPPORT, fontSize: bfs, fontWeight: LW, fill: ON_ACCENT, charSpacing: 90 });
  const ib = inkBox(bText);
  const bw = padL + icon + gapI + ib.w + padR;
  const badgeGap = s => Math.round(s * 0.14) + Math.ceil(lookSW(s) / 2 + lookSide(s));
  let S = 204, h1, i1, h2, i2;
  for (; S >= 110; S -= 4){
    h1 = text('Headline 1', 'headline', 'upper', claim[0], Object.assign({ left: M, top: M, fontSize: S }, headStyle));
    i1 = inkBox(h1);
    if (i1.w > W - 2 * M) continue;
    // line 1's ink starts at the margin, whatever the face's side bearing
    h1.props.left = M - (i1.x0 - M); h1.props.top = M - (i1.y0 - M) + 6;
    i1 = inkBox(h1);
    h2 = text('Headline 2', 'headline', 'upper', claim[1], Object.assign({ left: M, top: 0, fontSize: S }, headStyle, { fill: lightGround ? (F ? deepFor(ACCENT) : deep(ACCENT)) : ACCENT }));
    i2 = inkBox(h2);
    h2.props.top = (i1.y1 + Math.round(S * 0.1) + Math.round(lookSW(S) + lookDepth(S))) - i2.y0; h2.props.left = M - (i2.x0 - M);
    i2 = inkBox(h2);
    if (i2.w > W - 2 * M || i2.y1 > headRoom) continue;
    if (i2.x1 + badgeGap(S) + bw + (CT.outline ? 2 : 0) > W - GUIDE) continue;     // the badge (and its outline) fits beside the second line
    break;
  }
  if (S < 110) return { err: 'the claim does not fit in ' + DISPLAY + ' at a readable size' };

  // ── the verification mark on the claim's second line, in the CTA's colour (rules 69, 74)
  /* it hangs from the second line's cap height, a tag on the claim; centred
     on the line it floated in the middle of nothing ("isn't even at the top") */
  const capRef = inkBox(Object.assign(JSON.parse(JSON.stringify(h2)), { text: 'H' }));
  const bx = i2.x1 + badgeGap(S), by = capRef.y0 - Math.round(lookSW(S) / 2);   // from the outlined letters' cap line
  if (bx + bw > W - GUIDE) return { err: 'badge does not fit beside the second line (' + (bx + bw) + ')' };
  const brx = CT.shape === 'card' ? 14 : bh / 2;
  const pill = { kind: 'rect', name: 'Badge Pill', solid: true, __shape: 'pill', __panelSolid: true,
    props: { left: bx, top: by, width: bw, height: bh, rx: brx, ry: brx, fill: ACCENT, opacity: 1,
      shadow: { color: 'rgba(0,0,0,0.35)', blur: 14, offsetX: 0, offsetY: 4 } } };
  const edge = lightGround ? '#0b0b0d' : '#ffffff';     // an outline reads against the ground
  if (CT.outline) Object.assign(pill.props, { stroke: edge, strokeWidth: 3 });
  const mark = { kind: 'path', icon: V.badge[1], name: 'Badge Icon', role: 'deco', __element: true,
    props: { left: bx + padL, top: by + (bh - icon) / 2, size: icon, fill: ON_ACCENT, opacity: 1 } };
  bText.props.left = bx + padL + icon + gapI - ib.x0; bText.props.top = by + bh / 2 - ib.h / 2 - ib.y0;
  // the mark's INK on the pill's centre line: a bolt does not fill its icon box evenly
  { const im = inkBox(mark); if (im.y1 > 0) mark.props.top += (by + bh / 2) - (im.y0 + im.y1 + 1) / 2; }
  /* a variant balances the pill by what is seen: the mark's ink starts inside its
     icon box, so the words' side takes the same air (rule 69: padding balanced) */
  if (F){ const im = inkBox(mark), m0 = Math.max(0, im.x0 - mark.props.left), bw2 = padL + icon + gapI + ib.w + Math.round(padL + m0 - 1);
    if (bx + bw2 + (CT.outline ? 2 : 0) <= W - GUIDE) pill.props.width = bw2; }

  // ── three plates, one width, one style; the numeral in the display face (rules 70-72)
  const cardTop = [0, 1, 2].map(k => stepsTop + k * (cardH + cardGap)), cardW = 560;
  let numFs = 96;
  if (F){
    const half = s => Math.max(...['1', '2', '3'].map(d => inkBox(text('n', 'deco', 'none', d, { left: 200, top: 200, fontFamily: DISPLAY, fontSize: s, fontWeight: DW, charSpacing: 0 })).w)) / 2;
    for (let k = 0; k < 12 && 64 - half(numFs) < plateAirNeed(cardW, numFs) + 2; k++) numFs -= 4;
  }
  const labs = [1, 2, 3].map(i => (get('Step Lab ' + i) || {}).text || ['TEXT PICS', 'GET OFFER', 'GET PAID'][i - 1]);
  const steps = [];
  cardTop.forEach((y, k) => {
    const i = k + 1;
    const prx = PL.shape === 'pill' ? cardH / 2 : PL.shape === 'sharp' ? 4 : 22;
    const plate = { kind: 'rect', name: 'Step Card ' + i, solid: true, __panelSolid: true,
      props: { left: M, top: y, width: cardW, height: cardH, rx: prx, ry: prx, fill: PL.fill === 'smoked' ? 'rgba(8,12,18,0.62)' : PLATE, opacity: 1,
        shadow: { color: 'rgba(0,0,0,0.28)', blur: 18, offsetX: 0, offsetY: 6 } } };
    if (PL.outline) Object.assign(plate.props, { stroke: ACCENT, strokeWidth: 3 });
    steps.push(plate);
    const num = text('Step Num ' + i, 'deco', 'none', String(i), { left: 0, top: 0, originX: 'left', fontFamily: DISPLAY, fontSize: numFs, fontWeight: DW, fill: ACCENT, charSpacing: 0 });
    const iN = inkBox(num);
    num.props.left = M + 64 - iN.w / 2 - iN.x0; num.props.top = y + cardH / 2 - iN.h / 2 - iN.y0;
    const lab = text('Step Lab ' + i, 'info', 'upper', labs[k], { left: 0, top: 0, fontFamily: SUPPORT, fontSize: 36, fontWeight: LW, fill: INK_ON_PLATE, charSpacing: 40 });
    const mic = text('Step Micro ' + i, 'info', 'none', MICRO[k], { left: 0, top: 0, fontFamily: SUPPORT, fontSize: 26, fontWeight: MW, fill: INK2, charSpacing: 0 });
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
  /* on a card or a pill (inset, shorter than the band) it stands on the top edge:
     26px into it, its foot met the number */
  const colX0 = M + cardW + 26, colX1 = W - GUIDE, top = cardTop[0] - 10, bottom = bandTop + (CT.shape === 'card' || CT.shape === 'pill' ? 2 : 26);
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
    Object.assign(l.props, { top: bandTop, height: H - bandTop + 3, originY: 'top' });
    /* a card or a pill sits inside the guides instead of running off the canvas */
    if (CT.shape === 'card' || CT.shape === 'pill'){
      const edgeW = CT.outline ? 3 : 1, bh2 = H - GUIDE - edgeW - bandTop, inset = GUIDE + edgeW;   // the outline stays inside the guides
      Object.assign(l.props, { left: inset, width: W - 2 * inset, height: bh2, rx: CT.shape === 'pill' ? bh2 / 2 : 28, ry: CT.shape === 'pill' ? bh2 / 2 : 28 });
    }
    if (CT.outline) Object.assign(l.props, { stroke: edge, strokeWidth: 4 }); });
  /* the band carries the number and nothing else: the website line under it
     took a third of the band's height and held the number to 45% of it */
  const site = [];
  const phone = keep('Phone Number');
  /* in a variant's face the number starts small and numberFill sizes it for that face */
  /* (a face whose figures are too wide for the CTA sets the number in the support face: V.fonts.num) */
  phone.forEach(l => Object.assign(l.props, { top: Math.round((bandTop + H - GUIDE) / 2), originY: 'center' },
    F ? (F.num === 'support' ? { fontFamily: SUPPORT, fontWeight: LW, fontSize: 100 } : { fontFamily: DISPLAY, fontWeight: DW, fontSize: 100 }) : {}));
  // band before the product: the phone's base stands on it
  const layers = [].concat(keep('Vignette'), band, [prod], [h1, h2, pill, mark, bText], steps,
    phone, keep('Grain'), site);
  const out = JSON.parse(JSON.stringify(rec));
  out.tpl.layers = layers.map(l => Object.assign(l, { __ink: 1 }));   // laid out by its letters (rule 76)
  out.restaged = { by: 'scripts/restage_steps_flow.mjs', at: '2026-09-27', rules: [68, 69, 70, 71, 72, 73, 74], variant: V.tag };
  if (V.look) out.tpl.look = V.look;          // the card's own tagline look (applyCardLook)

  /* the number fills its band (numberFill, the Easy Mode pass) and the record
     keeps that size, so the thumbnail shows the card that opens */
  {
    const t0 = await __sc.prep(out, id), { sc } = __sc.paint(Object.assign({}, t0, { look: null }));   // sized on the plain card, as Easy Mode sizes it
    const r = numberFill(sc, W, H), ph = sc.getObjects().find(o => o.name === 'Phone Number');
    /* a variant's number: centred on the band as it is seen, its letters 3px
       inside the guides (the audit's measure, rule 53), and clear of the phone
       standing on the band: the phone steps up onto the band's edge first
       (never more than 4px above it), then the number comes down if it must */
    if (F && ph){
      const bandO = sc.getObjects().find(o => o.name === 'Phone Plate'), prO = sc.getObjects().find(o => o.name === 'Product');
      const Bb = bandO.getBoundingRect(true, true), Bt = Bb.top, Bbot = Bb.top + Bb.height;
      const numOut = LK && LK.scope === 'selling' && (LK.outline === 'black' || LK.outline === 'white');
      const numPad = () => numOut ? 0.0425 * (ph.fontSize || 100) * (ph.scaleY || 1) : 0;      // half the outline Street will draw on it
      let lo = Math.max(Bt, GUIDE + 3) + numPad(), hi = Math.min(Bbot, H - GUIDE - 3) - numPad();
      const scaleBy = k => { const c0 = ph.getCenterPoint(); ph.set({ scaleX: ph.scaleX * k, scaleY: ph.scaleY * k }); ph.setPositionByOrigin(c0, 'center', 'center'); ph.setCoords(); };
      /* its letters: 70% of the band's height inside the guides and of the width
         inside the margins where the face allows (numberFill grows by the box,
         and a box meets the phone before the letters do); never past the
         plate's air or the guides */
      {
        const q0 = textInkRect(ph), room = Math.min(Bbot, H - GUIDE) - Math.max(Bt, GUIDE);
        const need = Math.max(0.675 * room / q0.height, 0.71 * (W - 2 * GUIDE) / q0.width);
        const fsNow = (ph.fontSize || 100) * (ph.scaleY || 1);
        const maxW = Math.min(W - 2 * GUIDE - 6, Bb.width - 2 * plateAirNeed(Bb.width, fsNow * need));
        const k = Math.min(need, maxW / q0.width, (hi - lo) / q0.height);
        if (k > 1.001){ scaleBy(k); lo = Math.max(Bt, GUIDE + 3) + numPad(); hi = Math.min(Bbot, H - GUIDE - 3) - numPad(); }
      }
      const centre = () => { let q = textInkRect(ph);
        if (q.height > hi - lo){ scaleBy((hi - lo) / q.height); q = textInkRect(ph); }     // inside the guides, whatever it cost
        const nh = q.height, seen = (Math.max(Bt, 0) + Math.min(Bbot, H)) / 2, want = Math.max(lo + nh / 2, Math.min(seen, hi - nh / 2));
        ph.set({ top: ph.top + (want - (q.top + nh / 2)), left: ph.left + (W / 2 - (q.left + q.width / 2)) }); ph.setCoords(); return textInkRect(ph); };
      let N = centre();
      const pInk = () => { if (!prO || !prO._element) return null; prO.setCoords(); const b = prO.getBoundingRect(true, true), f = cutoutInk(prO._element);
        return { l: b.left + f.x0 * b.width, r: b.left + f.x1 * b.width, t: b.top + f.y0 * b.height, b: b.top + f.y1 * b.height }; };
      let P = pInk();
      const hit = () => P && N.left < P.r && N.left + N.width > P.l && N.top < P.b + 10;
      if (hit()){
        const up = Math.min(P.b - (N.top - 10), P.b - (Bt - 4));
        if (up > 0){ prO.set('top', prO.top - up); prO.setCoords(); P = pInk(); }
        for (let k = 0; k < 30 && hit(); k++){ scaleBy(0.97); N = centre(); }
        const PL = out.tpl.layers.find(l => l.name === 'Product');
        if (PL && up > 0) PL.props.top = Math.round(prO.top * 10) / 10;
      }
    }
    if ((r || F) && ph){
      const L = out.tpl.layers.find(l => l.name === 'Phone Number'), c = ph.getCenterPoint();
      L.props.fontSize = Math.round((ph.fontSize || 80) * (ph.scaleY || 1) * 10) / 10;
      Object.assign(L.props, { left: Math.round(c.x), top: Math.round(c.y), originX: 'center', originY: 'center' });
    }
    sc.dispose();
  }
  /* a variant is checked by the audit's own measures (the painted ink, alpha
     over 90, the look applied) and set right where the fonts' metrics and the
     outline left it a few pixels off: the badge on the claim's cap line, each
     numeral centred on its plate and on one axis, each row's words centred */
  if (F){
    const t1 = await __sc.prep(out, id), { sc } = __sc.paint(t1);
    const objs = sc.getObjects(), ctx = sc.getContext('2d'), bgI = sc.backgroundImage, bgC = sc.backgroundColor, vis = objs.map(o => o.visible);
    const inkA = o => { if (!o) return null; sc.backgroundImage = null; sc.backgroundColor = ''; objs.forEach(q => { q.visible = q === o; });
      const sh = o.shadow; o.shadow = null; sc.renderAll(); o.shadow = sh;
      const b = o.getBoundingRect(true, true), x0 = Math.max(0, Math.floor(b.left - 4)), y0 = Math.max(0, Math.floor(b.top - 4));
      const w = Math.min(W - x0, Math.ceil(b.width + 8)), h = Math.min(H - y0, Math.ceil(b.height + 8)); if (w <= 0 || h <= 0) return null;
      const d = ctx.getImageData(x0, y0, w, h).data; let l = w, t = h, r = -1, bo = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 90){ if (x < l) l = x; if (x > r) r = x; if (y < t) t = y; if (y > bo) bo = y; }
      return r < 0 ? null : { l: x0 + l, t: y0 + t, r: x0 + r + 1, b: y0 + bo + 1 }; };
    const named = n => objs.find(o => o.name === n);
    const L = n => out.tpl.layers.find(l => l.name === n);
    const move = (n, dx, dy) => { const l = L(n); if (!l) return; if (dx) l.props.left = Math.round((l.props.left + dx) * 10) / 10; if (dy) l.props.top = Math.round((l.props.top + dy) * 10) / 10; };
    const h2o = named('Headline 2'), I2 = inkA(h2o), P = inkA(named('Badge Pill'));
    if (I2 && P){
      const cx = document.createElement('canvas').getContext('2d'); cx.font = h2o._getFontDeclaration();
      const capH = cx.measureText('H').actualBoundingBoxAscent * (h2o.scaleY || 1);
      const sw = h2o.stroke && h2o.strokeWidth && h2o.paintFirst === 'stroke' ? h2o.strokeWidth * (h2o.scaleY || 1) : 0;
      const dy = (I2.b - capH - sw) - P.t;
      if (Math.abs(dy) > 0.5) ['Badge Pill', 'Badge Icon', 'Badge'].forEach(n => move(n, 0, dy));
    }
    const axis = M + 64;
    [1, 2, 3].forEach(i => {
      const C = inkA(named('Step Card ' + i)), n = inkA(named('Step Num ' + i)), lb = inkA(named('Step Lab ' + i)), mc = inkA(named('Step Micro ' + i));
      if (C && n) move('Step Num ' + i, axis - (n.l + n.r) / 2, (C.t + C.b) / 2 - (n.t + n.b) / 2);
      if (C && lb && mc){ const d = ((C.b - mc.b) - (lb.t - C.t)) / 2; if (Math.abs(d) > 0.5){ move('Step Lab ' + i, 0, d); move('Step Micro ' + i, 0, d); } }
    });
    objs.forEach((q, i) => { q.visible = vis[i]; }); sc.backgroundImage = bgI; sc.backgroundColor = bgC;
    sc.dispose();
  }
  // paint it with the studio's own painter; the full size for review and the gallery's webp
  const t = await __sc.prep(out, id);
  const jpg = renderThumb(t, 1080);
  const img = await new Promise(res => { const el = new Image(); el.onload = () => res(el); el.onerror = () => res(null); el.src = jpg; });
  const TP = V.thumbPx || 448;
  const cv = document.createElement('canvas'); cv.width = cv.height = TP;
  const g = cv.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, TP, TP);
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
}
