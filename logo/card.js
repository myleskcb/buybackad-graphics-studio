/* ═══════════════════════════════════════════════════════════════════════════
   THE BRAND CARD (DESIGN-LAW 185). The owner, 2026-11-25: "business cards also dont have any real brand
   assets? or background options?", "still not enough to make a consistent brand kit people will use
   moving forward needs to looks super clean".

   One business card for the shop's brand, drawn from its logo by the logo engine: the brand kit's card
   step (kit.js card-front and card-back, the files the function draws) and the card maker's Brand cards
   (cards/) are this one drawing, so the card a shop approves in its kit is the card it prints. Every
   card wears the logo, the logo's colours and the logo's lettering; what changes is the layout and the
   background. Pure, like the engine: no DOM, so the function draws it too.

     CARD                          the sheet: 3.5 × 2 in at 300 dpi on its 1/8 in bleed (1125 × 675)
     CARD_LAYOUTS, CARD_GROUNDS    what the customer picks: eight layouts, eight backgrounds
     CARD_LOOKS                    the kit's "Try another look" order: a layout with a background
     cardChoice(x, seed)           a choice held to the lists (or the look the seed lands on)
     cardPalette(pair, ground)     the logo's colours for a background: the roles every item is drawn in
     brandCardSvg(design, details, faces, { side, layout, ground, qr })   one side: { svg, w, h, boxes }

   The rules (DESIGN-LAW 185): the front is the logo and nothing that sells (no WE BUY, no number, no QR);
   the back is who and how to reach them, only what the customer gave (an empty detail is left off, never
   a sample); at most two sizes of words a side besides the logo; nothing under 7 pt; every word inside
   the safe area; a background is the logo's own colours, quietened so every word keeps its contrast.
   ═══════════════════════════════════════════════════════════════════════════ */
import * as E from "./engine.js";

const { K, paletteOf, contrast, mixHex, lumOf } = E;
const { ctxOf, drawMark, drawHorizontal, svgOf, textLine, fitSize, fitBlock, drawBlock, capOf, rectD, circleD, polyD, iconItem, tidy, up, f1, LAYOUTS } = K;

/* ---------- the sheet ---------- */
export const CARD = { w: 1125, h: 675, bleed: 37.5, dpi: 300 };
const SAFE = CARD.bleed * 2;        // the safe line: 1/8 in inside the trim
const M = SAFE + 22;                // where the words start, a little inside it, so nothing crowds the cut
export const MIN_EM = 29;           // 7 pt at 300 dpi: no word smaller

/* ---------- what the customer picks ---------- */
export const CARD_LAYOUTS = [
  { key: "centred", name: "Centred", hint: "Your logo in the middle; your details centred on the back" },
  { key: "left", name: "Left", hint: "Your name beside your mark, set to the left" },
  { key: "corner", name: "Big mark", hint: "Your mark large off the edge, your name in the corner" },
  { key: "band", name: "Band", hint: "Your logo over a band of your second colour" },
  { key: "frame", name: "Frame", hint: "Your logo inside a fine double frame" },
  { key: "minimal", name: "Minimal", hint: "A small mark and your name, with room around them" },
  { key: "split", name: "Split", hint: "Your mark on a panel of your second colour, your name beside it" },
  { key: "edge", name: "Edge", hint: "A strip of your second colour down one edge" },
];
export const CARD_GROUNDS = [
  { key: "solid", name: "Your colour", hint: "Your logo's own background colour" },
  { key: "paper", name: "White", hint: "A warm white card with your colours on it" },
  { key: "reverse", name: "Second colour", hint: "Your logo's second colour as the card" },
  { key: "sheen", name: "Sheen", hint: "Your colour, a little lighter at the top" },
  { key: "linen", name: "Linen", hint: "A fine woven texture in your colour" },
  { key: "lines", name: "Pinstripe", hint: "Fine diagonal lines in your colour" },
  { key: "pattern", name: "Pattern", hint: "Your mark repeated small and faint" },
  { key: "mark", name: "Watermark", hint: "Your mark large and faint behind the words" },
];
const LAYOUT_OF = Object.fromEntries(CARD_LAYOUTS.map(x => [x.key, x]));
const GROUND_OF = Object.fromEntries(CARD_GROUNDS.map(x => [x.key, x]));
/** the kit's "Try another look": every layout once on its own colour or white before a texture comes round */
export const CARD_LOOKS = [["centred", "solid"], ["left", "paper"], ["corner", "solid"], ["band", "paper"], ["frame", "sheen"], ["split", "solid"],
  ["minimal", "paper"], ["edge", "linen"], ["centred", "reverse"], ["left", "mark"], ["corner", "paper"], ["band", "pattern"], ["frame", "paper"],
  ["split", "lines"], ["minimal", "solid"], ["edge", "paper"]];
export const cardValid = x => !!(x && LAYOUT_OF[x.layout] && GROUND_OF[x.ground]);
export function cardChoice(x, seed = 0) {
  if (x && LAYOUT_OF[x.layout] && GROUND_OF[x.ground]) return { layout: x.layout, ground: x.ground };
  const [layout, ground] = CARD_LOOKS[Math.abs(seed | 0) % CARD_LOOKS.length];
  return { layout, ground };
}

/* ---------- the colours: the logo's roles, for a background ----------
   G the card, I the words, A the small lines (3:1), P a plate or band, Q the words on it (4.5:1), S and T
   the plate's shades, L the card's own light tone (what a texture is drawn in). */
export const PAPER = "#f7f5f0";
const bw = g => contrast("#ffffff", g) >= contrast("#141519", g) ? "#ffffff" : "#141519";
const shades = P => Object.assign(P, { S: mixHex(P.P, "#000000", lumOf(P.P) > .5 ? .3 : .38), T: mixHex(P.P, "#000000", .55) });
/** a colour pressed toward black (or white) until it reads `need`:1 on the ground, keeping its hue */
function readable(c, ground, need, limit = .5) {
  const to = lumOf(ground) > .4 ? "#000000" : "#ffffff";
  for (let t = 0; t <= limit + 1e-9; t += .05) { const x = t ? mixHex(c, to, t) : c; if (contrast(x, ground) >= need) return x; }
  return null;
}
export function cardPalette(pair, ground) {
  const P0 = paletteOf(pair);
  if (ground === "paper") {
    const G = PAPER;
    // the words: the brand's own dark (its ground, as a navy or a black) where it reads as ink, or near-black
    const I = [P0.G, P0.P, P0.I, P0.Q, P0.A].filter(c => contrast(c, G) >= 7).sort((a, b) => lumOf(a) - lumOf(b))[0] || "#16181d";
    const A = [P0.A, P0.P].find(c => c !== I && contrast(c, G) >= 3) || readable(P0.A, G, 3, .45) || I;
    const P = contrast(P0.P, G) >= 1.4 ? P0.P : contrast(P0.G, G) >= 3 ? P0.G : I;
    const Q = contrast(P0.Q, P) >= 4.5 ? P0.Q : contrast(G, P) >= 4.5 ? G : bw(P);
    return shades({ ...P0, G, I, A, P, Q, L: mixHex(G, I, .1), dark: false });
  }
  if (ground === "reverse") {
    const G = P0.P, I = contrast(P0.Q, G) >= 4.5 ? P0.Q : bw(G);
    const A = [P0.G, P0.A, P0.I].find(c => c !== G && contrast(c, G) >= 3) || I;
    const P = contrast(P0.G, G) >= 2 ? P0.G : I, Q = contrast(P0.I, P) >= 4.5 ? P0.I : bw(P);
    return shades({ ...P0, G, I, A, P, Q, L: mixHex(G, I, .14), dark: lumOf(G) < .18 });
  }
  return { ...P0 };
}
/** the card's own tone for a texture: a step from the ground toward the words, as far as `target`:1 and
 *  never so far that a word on it falls under 4.5:1 (or a small line under 3:1) */
function quiet(P, target) {
  let best = P.G;
  for (let k = .02; k <= .3; k += .01) {
    const t = mixHex(P.G, P.I, k);
    if (contrast(P.I, t) < 4.5 || (P.A !== P.I && contrast(P.A, t) < 3)) break;
    best = t;
    if (contrast(P.G, t) >= target) break;
  }
  return best;
}

/* ---------- drawing tools ---------- */
const layoutOf = c => LAYOUTS[c.d.t] || LAYOUTS.seal;
function art(c, form) {
  const L = layoutOf(c);
  return form === "mark" ? drawMark(c, L.shape) : form === "horizontal" ? drawHorizontal(c, L.shape) : L.draw(c);
}
function place(it, a, x, y, w, h, { align = "center", valign = "middle", as = null, under = null } = {}) {
  const k = Math.min(w / a.w, h / a.h), aw = a.w * k, ah = a.h * k;
  const ox = align === "left" ? x : align === "right" ? x + w - aw : x + (w - aw) / 2;
  const oy = valign === "top" ? y : valign === "bottom" ? y + h - ah : y + (h - ah) / 2;
  const g = { g: a.it, tf: `translate(${f1(ox)} ${f1(oy)}) scale(${+k.toFixed(5)})` };
  if (as) Object.assign(g, { as, under });
  it.push(g);
  return { x0: ox, y0: oy, x1: ox + aw, y1: oy + ah };
}
const rect = (x, y, w, h, fill, r = 0) => ({ d: rectD(x, y, w, h, r), fill, tone: 0 });
/** an hours row's clock, drawn like the engine's icons (a 100 unit box, a round stroke) */
const CLOCK = circleD(50, 50, 38) + "M50 27L50 50L66 60";
function rowIcon(key, cx, cy, s, stroke) {
  if (key !== "clock") return iconItem(key, cx, cy, s, stroke, 0, 8);
  return { d: CLOCK, tf: `translate(${f1(cx - s / 2)} ${f1(cy - s / 2)}) scale(${+(s / 100).toFixed(4)})`, stroke, sw: 8, tone: 0, round: true };
}
/** words as one line, kept to the room and never under 7 pt; the box goes to the check */
function line(it, boxes, role, F, str, em, x, y, o) {
  const t = textLine(F, str, Math.max(MIN_EM, em), x, y, { tone: 0, ...o });
  if (t.item) it.push(t.item);
  boxes.push({ role, text: str, x0: t.box.x0, x1: t.box.x1, y0: t.box.top, y1: t.box.bot, em: t.size });
  return t;
}
const fitEm = (F, str, w, em, track = 0) => Math.max(MIN_EM, Math.min(em, fitSize(F, str, w, 1e9, track)));

/* ---------- the background ---------- */
function groundItems(it, c, P, ground, w, h) {   // returns the texture's tone, or null
  if (ground === "sheen") {
    // a gentle light down the card in its own colour (rule 5: a gradient never travels between hues)
    let top = .1, foot = .18;
    // each end only as far as the words keep 4.5:1 and the accent 3:1 (a light ground's foot darkens toward its accent)
    const holds = g => contrast(P.I, g) >= 4.5 && (P.A === P.I || contrast(P.A, g) >= 3);
    while (top > 0 && !holds(mixHex(P.G, "#ffffff", top))) top -= .02;
    while (foot > 0 && !holds(mixHex(P.G, "#000000", foot))) foot -= .02;
    const ends = [mixHex(P.G, "#ffffff", Math.max(0, top)), mixHex(P.G, "#000000", Math.max(0, foot))];
    it.push({ d: rectD(0, 0, w, h), fill: { grad: ends }, tone: 0 });
    return ends;
  }
  it.push(rect(0, 0, w, h, "G"));
  const R = E.rng(((c.d.seed | 0) + 7) * 2654435761 >>> 0);
  if (ground === "linen") {
    const t = quiet(P, 1.1), out = [];
    for (let y = 2; y < h; y += 7 + R() * 3) out.push(rectD(0, y, w, 1.1 + R() * 1.1));
    for (let x = 2; x < w; x += 7 + R() * 3) out.push(rectD(x, 0, 1.1 + R() * 1.1, h));
    it.push({ d: out.join(""), fill: t, tone: 0 });
    return [t];
  } else if (ground === "lines") {
    const t = quiet(P, 1.14), out = [], sw = 3.2, gap = 20;
    for (let x = -h; x < w + h; x += gap) out.push(polyD([[x, h], [x + sw, h], [x + sw + h, 0], [x + h, 0]]));
    it.push({ d: out.join(""), fill: t, tone: 0 });
    return [t];
  } else if (ground === "pattern") {
    const t = quiet(P, 1.16), a = art(c, "mark"), s = 64, dx = 176, dy = 150;
    for (let row = 0, y = -20; y < h + s; y += dy, row++) for (let x = (row % 2 ? dx / 2 : 0) - 30; x < w + s; x += dx) place(it, a, x, y, s, s, { as: t, under: "G" });
    return [t];
  } else if (ground === "mark") {
    const t = quiet(P, 1.2), s = h * 1.3;
    place(it, art(c, "mark"), w - s * .74, (h - s) / 2 + h * .06, s, s, { as: t, under: "G" });
    return [t];
  }
  return null;
}

/* ---------- the back's words: who, and how to reach them ---------- */
const ROWS = [["phone", "call"], ["email", "mail"], ["site", "globe"], ["handle", "chat"], ["address", "pin"], ["hours", "clock"]];
function rowsOf(x) { return ROWS.map(([k, ic]) => [ic, tidy(x[k]), k]).filter(r => r[1]); }
/** a row too long for its column at 7 pt breaks where it reads: an address or hours at its comma (or a
 *  middle space), an email before its @; anything else stays one line */
function breakRow(F, [ic, t, k], colW) {
  if (fitSize(F, t, colW, 1e9, .01) >= MIN_EM) return [[ic, t, k]];
  let cut = -1, keep = 0;
  if (k === "email" && t.indexOf("@") > 0) { cut = t.indexOf("@"); keep = 0; }
  else if ((k === "address" || k === "hours") && /[, ]/.test(t)) { cut = t.lastIndexOf(",") > 0 ? t.lastIndexOf(",") : t.lastIndexOf(" ", Math.ceil(t.length / 2) + 4); keep = t[cut] === "," ? 1 : 0; }
  if (cut <= 0) return [[ic, t, k]];
  const a = t.slice(0, cut + keep).trim(), b = (k === "email" ? t.slice(cut) : t.slice(cut + 1)).trim();
  return [[ic, a, k], ["", b, k]];
}
/** how wide a row needs to be at 7 pt, with its icon: the widest decides how much room the mark gives */
const rowsNeed = (c, x, iconW = 54) => Math.max(0, ...rowsOf(x).map(r => r[1].length ? E.K.shapeRun(c.Lb, r[1], .01).w * MIN_EM / 1000 + iconW : 0));
/** the block: the person (or the business) and their title, then the rows, in [bx, by, bw, bh], set left
 *  (with an icon a row, in the accent) or centred (without). The rows' spacing gives first, then the name's
 *  size; { dry: true } only measures. */
function detailsBlock(it, boxes, c, x, bx, by, bw, bh, { align = "left", valign = "middle", dry = false } = {}) {
  const person = tidy(x.person), role = tidy(x.role), rowsIn = rowsOf(x);
  const head = person ? up(person) : c.N.full, sub = person ? (role ? up(role) : "") : (rowsIn.length ? "" : c.small);
  const iconW = align === "left" ? 54 : 0, colW = bw - iconW;
  const lines = rowsIn.flatMap(r => breakRow(c.Lb, r, colW));
  const em = Math.max(MIN_EM, Math.min(36, ...lines.map(l => fitSize(c.Lb, l[1], colW, 1e9, .01))));
  const capR = capOf(c.Lb, em), n = lines.length;
  let subTrack = .18, subEm = sub ? fitEm(c.Lb, sub, bw, 30, subTrack) : 0;
  if (sub && fitSize(c.Lb, sub, bw, 1e9, subTrack) < MIN_EM) { subTrack = .04; subEm = fitEm(c.Lb, sub, bw, 30, subTrack); }
  const subCap = sub ? capOf(c.Lb, subEm) : 0;
  let m = null;
  for (const capMax of [person ? 42 : 46, 36, 30, 24]) {
    const hB = fitBlock(c.D, head, bw, bh * .22, { maxLines: 2, lead: 1.08, capMax });
    if (hB.size < MIN_EM) hB.size = MIN_EM;
    const hCap = capOf(c.D, hB.size), hH = hCap * (1 + (hB.n - 1) * 1.08);
    const gapSub = sub ? hCap * .55 : 0, gapRows = n ? Math.max(capR * 1.2, hCap * .95) : 0;
    const fixed = hH + gapSub + subCap + gapRows + (n ? capR : 0);
    const pitch = n > 1 ? Math.min(capR * 2.5, Math.max(capR * 1.62, (bh - fixed) / (n - 1))) : 0;
    m = { hB, hCap, hH, gapSub, gapRows, pitch, total: fixed + pitch * Math.max(0, n - 1) };
    if (m.total <= bh + .5) break;
  }
  if (dry) return { total: m.total, fits: m.total <= bh + .5 };
  const { hB, hH, gapSub, gapRows, pitch, total } = m;
  let y = valign === "top" ? by : valign === "bottom" ? by + bh - total : by + (bh - total) / 2;
  const ax = align === "left" ? bx : bx + bw / 2;
  const hb = drawBlock(it, c.D, hB, ax, y + hH / 2, { align, lead: 1.08, fill: "I", tone: 0 });
  boxes.push({ role: "head", text: head, x0: hb.x0, x1: hb.x1, y0: hb.top, y1: hb.bot, em: hB.size });
  y += hH;
  if (sub) { y += gapSub + subCap; line(it, boxes, "role", c.Lb, sub, subEm, ax, y, { align, track: subTrack, fill: "A" }); }
  y += gapRows;
  lines.forEach(([ic, t, k], j) => {
    const base = y + capR + j * pitch;
    if (align === "left") {
      if (ic) it.push(rowIcon(ic, bx + 17, base - capR / 2, Math.max(30, capR * 1.5), "A"));
      line(it, boxes, k, c.Lb, t, em, bx + iconW, base, { align: "left", track: .01, fill: "I" });
    } else line(it, boxes, k, c.Lb, t, em, ax, base, { align: "center", track: .01, fill: "I" });
  });
  return { total, fits: total <= bh + .5 };
}
/** the QR on a white tile with its quiet zone, at least 3/4 in across, and what it does under it */
function qrTile(it, boxes, c, qr, cx, cy, s) {
  const n = qr.cells.length, tile = s, zone = 2, k = (tile - 24) / (n + 2 * zone), x0 = cx - tile / 2, y0 = cy - tile / 2, out = [];
  it.push({ d: rectD(x0, y0, tile, tile, 10), fill: "#ffffff", tone: 0 });
  for (let r = 0; r < n; r++) for (let q = 0; q < n; q++) if (qr.cells[r][q]) out.push(rectD(x0 + 12 + (q + zone) * k, y0 + 12 + (r + zone) * k, k + .3, k + .3));
  it.push({ d: out.join(""), fill: "#111214", tone: 0 });
  boxes.push({ role: "qr", text: "", x0, x1: x0 + tile, y0, y1: y0 + tile, em: 0 });
  if (qr.label) {
    // as wide as the tile at most: the letter spacing gives first, then the size, never under 7 pt
    const L = up(qr.label), track = [.16, .1, .05, 0].find(t => fitSize(c.Lb, L, tile, 1e9, t) >= MIN_EM) ?? 0;
    line(it, boxes, "qr-label", c.Lb, L, fitEm(c.Lb, L, tile, 30, track), cx, y0 + tile + 22 + capOf(c.Lb, 30), { align: "center", track, fill: "I" });
  }
}
/** the mark (or the QR) for the back's open side, in [x, y, w, h] */
function sideArt(it, boxes, c, qr, x, y, w, h, o = {}) {
  if (qr) { const s = Math.max(225, Math.min(w, h - 60, 250)); qrTile(it, boxes, c, qr, x + w / 2, y + (h - 60) / 2, s); return; }
  const b = place(it, art(c, "mark"), x, y, w, h, o);
  boxes.push({ role: "mark", text: "", ...b, em: 0 });
}

/* ---------- the layouts ---------- */
const X0 = M, Y0 = M, X1 = CARD.w - M, Y1 = CARD.h - M, BW = X1 - X0, BH = Y1 - Y0;
function front(it, boxes, c, P, layout, x) {
  const { w, h, bleed } = CARD, put = (a, x0, y0, bw, bh, o = {}, role = "logo") => { const b = place(it, a, x0, y0, bw, bh, o); boxes.push({ role, text: "", ...b, em: 0 }); return b; };
  const small = tidy(x.site) || c.small;
  if (layout === "left") put(art(c, "horizontal"), X0, Y0 + BH * .27, BW * .88, BH * .46, { align: "left" });
  else if (layout === "corner") {
    const s = h * 1.22;
    put(art(c, "mark"), w - s * .56, (h - s) / 2 + h * .05, s, s, {}, "bigmark");   // runs off the edge on purpose
    nameBlock(it, boxes, c, X0, Y0 + BH * .38, BW * .5, BH * .62, "bottom");
  } else if (layout === "band") {
    const by = h * .74;
    it.push(rect(0, by, w, h - by, "P"));
    put(art(c, "primary"), X0 + BW * .14, Y0 - 6, BW * .72, by - Y0 - 30);
    line(it, boxes, "band", c.Lb, up(small), fitEm(c.Lb, up(small), BW * .8, 31, .2), w / 2, by + (Y1 + 8 - by) / 2 + capOf(c.Lb, 31) / 2, { track: .2, fill: "Q" });
  } else if (layout === "frame") {
    frame(it, w, h, bleed);
    put(art(c, "primary"), X0 + BW * .18, Y0 + BH * .13, BW * .64, BH * .74);
  } else if (layout === "minimal") {
    put(art(c, "mark"), X0, Y0, 118, 118, { align: "left", valign: "top" });
    nameBlock(it, boxes, c, X0, Y0 + BH * .45, BW * .66, BH * .55, "bottom");
  } else if (layout === "split") {
    const pw = w * .4;
    it.push(rect(0, 0, pw, h, "P"));
    put(art(c, "mark"), 0 + bleed + 40, Y0 + BH * .14, pw - bleed - 80, BH * .72, { as: "Q", under: "P" });
    nameBlock(it, boxes, c, pw + 60, Y0, X1 - pw - 60, BH, "middle");
  } else if (layout === "edge") {
    const sw = bleed + 92;
    it.push(rect(0, 0, sw, h, "P"));
    put(art(c, "horizontal"), sw + 66, Y0 + BH * .28, X1 - sw - 66, BH * .44, { align: "left" });
  } else put(art(c, "primary"), X0 + BW * .14, Y0 + BH * .1, BW * .72, BH * .8);   // centred
}
/** the name and the small line, set left, as a wordmark: for the layouts whose mark stands apart */
function nameBlock(it, boxes, c, bx, by, bw, bh, valign) {
  const lead = c.N.trail ? c.N.lead : c.N.full, sub = c.N.trail || c.small;
  const B = fitBlock(c.D, lead, bw, bh * .62, { maxLines: 2, lead: 1.06, capMax: 84 });
  const cap = capOf(c.D, B.size), hH = cap * (1 + (B.n - 1) * 1.06), subEm = fitEm(c.Lb, sub, bw, Math.max(MIN_EM, Math.min(36, cap * .5)), .2), sCap = capOf(c.Lb, subEm);
  const total = hH + cap * .5 + sCap;
  const y = valign === "bottom" ? by + bh - total : valign === "top" ? by : by + (bh - total) / 2;
  const b = drawBlock(it, c.D, B, bx, y + hH / 2, { align: "left", lead: 1.06, fill: "I", tone: 0 });
  boxes.push({ role: "name", text: lead, x0: b.x0, x1: b.x1, y0: b.top, y1: b.bot, em: B.size });
  line(it, boxes, "small", c.Lb, sub, subEm, bx, y + hH + cap * .5 + sCap, { align: "left", track: .2, fill: "A" });
}
function frame(it, w, h, bleed) {
  const o = bleed + 22, i = o + 13;
  it.push({ d: rectD(o, o, w - 2 * o, h - 2 * o, 6), stroke: "A", sw: 4, tone: 0 });
  it.push({ d: rectD(i, i, w - 2 * i, h - 2 * i, 3), stroke: "A", sw: 1.6, tone: 0 });
}
function back(it, boxes, c, P, layout, x, qr) {
  const { w, h, bleed } = CARD, hasRows = rowsOf(x).length > 0 || tidy(x.person);
  if (!hasRows && !qr) {
    // nothing given yet: the back is the logo, small, and its line; never a sample
    const b = place(it, art(c, "primary"), X0 + BW * .3, Y0 + BH * .2, BW * .4, BH * .6);
    boxes.push({ role: "logo", text: "", ...b, em: 0 });
    if (layout === "frame") frame(it, w, h, bleed);
    return;
  }
  if (layout === "centred" && !qr) {
    const ms = 104, room = detailsBlock(null, null, c, x, X0 + BW * .08, Y0 + ms + 26, BW * .84, BH - ms - 26, { align: "center", dry: true });
    if (!room.fits) { detailsBlock(it, boxes, c, x, X0 + BW * .08, Y0, BW * .84, BH, { align: "center" }); return; }   // the details need the mark's room
    const b = place(it, art(c, "mark"), w / 2 - ms / 2, Y0, ms, ms, { valign: "top" });
    boxes.push({ role: "mark", text: "", ...b, em: 0 });
    detailsBlock(it, boxes, c, x, X0 + BW * .08, Y0 + ms + 26, BW * .84, BH - ms - 26, { align: "center" });
    return;
  }
  if (layout === "frame") {
    frame(it, w, h, bleed);
    if (!qr) { detailsBlock(it, boxes, c, x, X0 + BW * .12, Y0 + 12, BW * .76, BH - 24, { align: "center" }); return; }
  }
  if (layout === "minimal") {
    sideArt(it, boxes, c, qr, X1 - (qr ? 250 : 104), Y0, qr ? 250 : 104, qr ? BH : 104, { align: "right", valign: "top" });
    detailsBlock(it, boxes, c, x, X0, Y0, BW - (qr ? 290 : 150), BH, { valign: "bottom" });
    return;
  }
  if (layout === "split") {
    const px = w * .6;
    it.push(rect(px, 0, w - px, h, "P"));
    if (qr) sideArt(it, boxes, c, qr, px + 30, Y0, w - px - bleed - 70, BH);
    else { const b = place(it, art(c, "mark"), px + 60, Y0 + BH * .16, w - px - 60 - bleed - 40, BH * .68, { as: "Q", under: "P" }); boxes.push({ role: "mark", text: "", ...b, em: 0 }); }
    detailsBlock(it, boxes, c, x, X0, Y0, px - X0 - 50, BH);
    return;
  }
  // rows at the left, the mark (or the QR) at the right: Left, Big mark, Band, Edge, Centred and Frame with a QR
  let bot = Y1, right = X1;
  if (layout === "band") { const by = h * .8; it.push(rect(0, by, w, h - by, "P")); bot = by - 26; }
  if (layout === "edge") { const sw = bleed + 92; it.push(rect(w - sw, 0, sw, h, "P")); right = w - sw - 60; }
  let side = qr ? 250 : Math.min(200, (bot - Y0) * .6);
  const need = rowsNeed(c, x), gap = 50;
  if (need > right - side - gap - X0) side = Math.max(qr ? 225 : 110, right - gap - X0 - need);   // a long row takes room from the mark (never the QR under 3/4 in)
  sideArt(it, boxes, c, qr, right - side, Y0, side, bot - Y0);
  detailsBlock(it, boxes, c, x, X0, Y0, right - side - gap - X0, bot - Y0);
}

/* ---------- one side ---------- */
/** One side of the brand card as SVG on the bleed. design: the logo (engine.cleanDesign), details: the
 *  kit's details (kit.cleanDetails), qr: { cells, label } or null (the back only). */
export function brandCardSvg(design, details, faces, { side = "front", layout = "centred", ground = "solid", qr = null } = {}) {
  const d = E.cleanDesign(design), c = ctxOf(d, faces), { w, h } = CARD;
  const ch = cardChoice({ layout, ground }), P = cardPalette(d.pair, ch.ground);
  c.P = P;   // the logo is drawn in the card's colours: its finish too (engine applyFinish reads c.P)
  const x = details && typeof details === "object" ? details : {}, it = [], boxes = [];
  const tones = groundItems(it, c, P, ch.ground, w, h);
  if (side === "back") back(it, boxes, c, P, ch.layout, x, qr && qr.cells && qr.cells.length ? qr : null);
  else front(it, boxes, c, P, ch.layout, x);
  const r = svgOf({ w, h, it }, P, { mode: "colour", bg: false, pad: 0, title: c.N.full + " business card, " + side, size: [w, h] });
  return { svg: r.svg, w, h, ok: true, ground: P.G, boxes, palette: P, tones: tones || [], layout: ch.layout, background: ch.ground, safe: { x0: SAFE, y0: SAFE, x1: w - SAFE, y1: h - SAFE } };
}
