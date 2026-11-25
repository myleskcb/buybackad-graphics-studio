/* ═══════════════════════════════════════════════════════════════════════════
   THE BRAND KIT (DESIGN-LAW 180). The owner, 2026-11-24: "a logo brand kit fee ... one time you can save
   these and re-download them at any time and it makes you up to 20 different images whether it's
   profile pictures or different sizes or banners", "a more expensive pack ... gives you 50 images and
   covers more platforms or helps you design things like Instagram story [highlight] bubbles", "they can
   go through each step and approve each one and then review them and then from there they can download
   the whole folder".

   Every file is drawn from the one logo by the engine's own tools (engine.js K): the same outlines, the
   same palette roles, the same lockups. Pure, like the engine: the page draws the marked previews and
   the function (netlify/lib/logos.mjs) draws the files a kit pays for.

     FORMATS                      every file of the kit: its tier, its step, its folder and its size
     kitSvg(id, spec, faces)      one file as SVG ({ svg, w, h })
     kitFor(tier)                 the formats a tier includes (Essentials 20, Complete 50)
     cleanSpec(x)                 a kit held to what the engine draws: the logo, the details, the looks
   ═══════════════════════════════════════════════════════════════════════════ */
import * as E from "./engine.js";

const { K, LINE_WORDS, LOGO_ICONS, paletteOf } = E;
const { ctxOf, drawMark, drawHorizontal, svgOf, textLine, fitSize, fitBlock, drawBlock, capOf, shapeRun, arcText, arcFit,
  rectD, circleD, starD, polyD, iconItem, ring, dot, tidy, up, f1, LAYOUTS } = K;

/* ---------- the tiers (the prices are plans.mjs KITS; this is the page's copy, held to it by plan_economics) ---------- */
export const KIT_TIERS = {
  essentials: { key: "essentials", name: "Essentials", price: 1499, says: "Your logo files, profile pictures, banners, business card and web icons" },
  complete: { key: "complete", name: "Complete", price: 1999, says: "Everything in Essentials, plus Instagram highlight covers, stories, posts, more platforms, print signs and a brand guide" },
};

/* ---------- what the customer tells the kit (the card's back, the posts, the signature) ---------- */
export const DETAIL_LIMITS = { person: 32, role: 32, phone: 24, email: 48, site: 40, handle: 32, address: 48, hours: 40 };
export function cleanDetails(x) {
  const d = x && typeof x === "object" ? x : {}, out = {};
  for (const [k, n] of Object.entries(DETAIL_LIMITS)) out[k] = tidy(d[k]).slice(0, n);
  out.phone = out.phone.replace(/[^0-9()+\-. ]/g, "");
  out.handle = out.handle ? "@" + out.handle.replace(/^@+/, "").replace(/\s+/g, "") : "";
  out.site = out.site.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  return out;
}
/** what a preview says where a detail is not given yet: plainly a sample */
const SAMPLE = { phone: "(555) 555-0123", email: "hello@yourshop.com", site: "yourshop.com", handle: "@yourshop", address: "123 Main St", hours: "MON-SAT 10AM-7PM" };
const det = (x, k) => x[k] || SAMPLE[k] || "";

/** A kit: the logo (engine design), the details, and a look a step (the seed "Try another look" moves). */
export const STEPS = ["social", "card", "posts", "print"];
export function cleanSpec(x) {
  const s = x && typeof x === "object" ? x : {}, looks = {};
  for (const k of STEPS) looks[k] = Math.abs((s.looks && s.looks[k]) | 0) % 1000;
  return { design: E.cleanDesign(s.design), details: cleanDetails(s.details), looks };
}

/* ---------- the words, a line at a time (they pass motion/banned-words.js: no dashes, no superlatives) ---------- */
const HEAD = { wholesale: "WE BUY BULK & WHOLESALE", devices: "WE BUY & SELL DEVICES", resale: "BUY · SELL · TRADE" };
const headFor = cat => HEAD[cat] || "WE BUY " + (LINE_WORDS[cat] || "PHONES");
/* what a shop promises: cash for most; a collector's fair offer for cards (no scalper urgency) */
const PROMISE = { pokemon: "FAIR OFFERS ON COLLECTIONS", sports: "FAIR OFFERS ON COLLECTIONS", cars: "CASH FOR CARS & TRUCKS",
  wholesale: "PALLETS · LOTS · OVERSTOCK", devices: "NEW & PRE-OWNED", resale: "FAIR PRICES, PAID ON THE SPOT" };
const promiseFor = cat => PROMISE[cat] || "CASH PAID TODAY";
const POINTS = {
  pokemon: ["SINGLES & SLABS", "SEALED PRODUCT", "WHOLE COLLECTIONS"], sports: ["ROOKIES & SLABS", "AUTOS & PATCHES", "WHOLE COLLECTIONS"],
  gold: ["GOLD & SILVER", "RINGS & CHAINS", "COINS & BARS"], coins: ["RARE COINS", "BULLION", "WHOLE COLLECTIONS"], silver: ["COINS & BARS", "STERLING", "SCRAP SILVER"],
  cars: ["ANY MAKE", "RUNNING OR NOT", "FREE PICKUP"], wholesale: ["PALLETS & LOTS", "OVERSTOCK", "RETURNS"],
  devices: ["PHONES & TABLETS", "LAPTOPS", "TRADE-INS"], resale: ["ELECTRONICS", "COLLECTIBLES", "TRADE-INS"],
  gaming: ["CONSOLES", "GAMES", "CONTROLLERS"], computers: ["LAPTOPS", "DESKTOPS", "PARTS"], wearables: ["WATCHES", "SMARTWATCHES", "BANDS"],
  cameras: ["CAMERAS", "LENSES", "DRONES"], audio: ["HEADPHONES", "EARBUDS", "SPEAKERS"], strips: ["SEALED BOXES", "UNEXPIRED", "PAID ON THE SPOT"],
};
const pointsFor = cat => POINTS[cat] || ["NEW & USED", "CRACKED SCREENS", "PAID ON THE SPOT"];

/* ---------- drawing tools ---------- */
const layoutOf = c => LAYOUTS[c.d.t] || LAYOUTS.seal;
/** the logo as art to place: the layout ("primary"), the name beside the mark ("horizontal") or the mark */
function art(c, form) {
  const L = layoutOf(c);
  return form === "mark" ? drawMark(c, L.shape) : form === "horizontal" ? drawHorizontal(c, L.shape) : L.draw(c);
}
/** art fitted into a box, centred (or set to a side); returns where it landed */
function place(it, a, x, y, w, h, { align = "center", valign = "middle", as = null, under = null } = {}) {
  const k = Math.min(w / a.w, h / a.h), aw = a.w * k, ah = a.h * k;
  const ox = align === "left" ? x : align === "right" ? x + w - aw : x + (w - aw) / 2;
  const oy = valign === "top" ? y : valign === "bottom" ? y + h - ah : y + (h - ah) / 2;
  const g = { g: a.it, tf: `translate(${f1(ox)} ${f1(oy)}) scale(${+k.toFixed(5)})` };
  if (as) Object.assign(g, { as, under });
  it.push(g);
  return { x0: ox, y0: oy, x1: ox + aw, y1: oy + ah, k };
}
const fill = (w, h, f = "G") => ({ d: rectD(0, 0, w, h), fill: f, tone: 0 });
/** the kit's looks: one is drawn a step, the same in every file of that step, "Try another look" moves it */
const LOOKS = ["ghost", "band", "frame", "dots", "stripes"];
const lookOf = (spec, step, i = 0) => LOOKS[((spec.looks[step] || 0) + i) % LOOKS.length];

/** the decoration under a file's words: the mark in the ground's own light tone, a halftone, rules, a frame */
function deco(it, c, w, h, look, { m = Math.min(w, h) * .06 } = {}) {
  const s = Math.min(w, h);
  if (look === "ghost") {
    // the line's own symbol, large and in the ground's light tone, running off the corner: what the shop buys
    const key = c.icon || (E.ICONS_FOR[c.d.cat] || E.ICONS_FOR.phones)[0], size = s * 1.1;
    it.push(iconItem(key, w - size * .2, h - size * .22, size, "L", 0, 6));
  } else if (look === "dots") {
    // a halftone fading off one corner: pop art's Ben-Day dots in the ground's light tone
    const step = s / 26, out = [];
    for (let y = 0; y < h + step; y += step) for (let x = 0; x < w + step; x += step) {
      const t = Math.max(0, 1 - Math.hypot(x / w, (h - y) / h) / .95), r = step * .46 * t;
      if (r > step * .06) out.push(circleD(x + ((y / step) % 2 ? step / 2 : 0), y, r));
    }
    it.push({ d: out.join(""), fill: "L", tone: 0 });
  } else if (look === "stripes") {
    const n = 7, sw = s * .028, out = [];
    for (let i = 0; i < n; i++) { const x = -s * .2 + i * sw * 2.4; out.push(polyD([[x, h], [x + sw, h], [x + sw + h * .55, 0], [x + h * .55, 0]])); }
    it.push({ d: out.join(""), fill: "L", tone: 0 });
    it.push({ d: out.join(""), fill: "L", tone: 0, tf: `translate(${f1(w - s * .35 + h * .1)} 0)` });
  } else if (look === "frame") {
    it.push({ d: rectD(m, m, w - 2 * m, h - 2 * m, s * .02), stroke: "A", sw: s * .012, tone: 0 });
    it.push({ d: rectD(m + s * .022, m + s * .022, w - 2 * m - s * .044, h - 2 * m - s * .044, s * .01), stroke: "A", sw: s * .003, tone: 0 });
  } else if (look === "band") {
    it.push({ d: rectD(0, h * .72, w, h * .28), fill: "L", tone: 0 });
    it.push({ d: rectD(0, h * .72, w, s * .012), fill: "A", tone: 0 });
  }
}
/** a pill with words in it, centred on x; returns its box */
function pill(it, c, str, x, y, maxW, cap, { fill: pf = "P", ink = "Q", face = null, track = .06 } = {}) {
  const F = face || c.D, size = fitSize(F, str, maxW - cap * 2.2, cap, track), ch = capOf(F, size), ph = ch * 2.3;
  const tw = shapeRun(F, str, track).w * size / 1000, pw = tw + ph * 1.1;
  it.push({ d: rectD(x - pw / 2, y, pw, ph, ph / 2), fill: pf, tone: 0 });
  it.push(textLine(F, str, size, x, y + ph / 2 + ch / 2, { track, fill: ink, tone: 0 }).item);
  return { x0: x - pw / 2, x1: x + pw / 2, y0: y, y1: y + ph };
}
/** a tracked small line with rules either side */
function ruled(it, c, str, x, y, maxW, cap, { fill: f = "A", track = .24, rule = true } = {}) {
  const s = fitSize(c.Lb, str, maxW * .8, cap, track), t = textLine(c.Lb, str, s, x, y + capOf(c.Lb, s), { track, fill: f, tone: 0 });
  it.push(t.item);
  if (rule) { const rl = Math.min(maxW * .12, 140), gap = capOf(c.Lb, s) * 1.4, ry = y + capOf(c.Lb, s) / 2 - Math.max(2, s * .012);
    for (const sx of [-1, 1]) it.push({ d: rectD(sx < 0 ? t.box.x0 - gap - rl : t.box.x1 + gap, ry, rl, Math.max(4, s * .024), 2), fill: f, tone: 0 }); }
  return capOf(c.Lb, s);
}

/* ---------- the compositions ---------- */
/** A banner: the name beside the mark, the small line and a contact, all inside the middle the platform
 *  shows on every screen (safe: [x, y, w, h]); the look's decoration may run to the edges. */
function banner(spec, faces, w, h, { safe = [0, 0, w, h], step = "social", i = 0, contact = "phone", title = "banner" } = {}) {
  const c = ctxOf(spec.design, faces), x = spec.details, look = lookOf(spec, step, i), it = [fill(w, h)];
  deco(it, c, w, h, look === "frame" || look === "band" ? (look === "band" ? "stripes" : "ghost") : look);
  const [sx, sy, sw, sh] = safe, m = Math.min(sw, sh) * .1;
  if (look === "band") {
    // the mark on a panel of its own colour at the left of the safe area, the words beside it
    const pw = Math.min(sh * 1.05, sw * .34);
    it.push({ d: rectD(sx + m * .4, sy + m * .5, pw, sh - m, Math.min(pw, sh) * .08), fill: "P", tone: 0 });
    place(it, art(c, "mark"), sx + m * .4 + pw * .12, sy + m * .5 + (sh - m) * .12, pw * .76, (sh - m) * .76);
    return wordsBeside(it, c, x, sx + m * .4 + pw + m * .8, sy, sw - pw - m * 2, sh, contact, w, h, title);
  }
  const hz = art(c, "horizontal"), lines = contact ? 2 : 1;
  const boxH = (sh - 2 * m) * (lines === 2 ? .52 : .66);
  const b = place(it, hz, sx + m, sy + m + ((sh - 2 * m) - boxH - (sh - 2 * m) * .34 * (lines / 2)) / 2, sw - 2 * m, boxH);
  let y = b.y1 + (sh - 2 * m) * .07;
  const cap = Math.max(14, Math.min(sh * .055, 44));
  const used = ruled(it, c, c.small, sx + sw / 2, y, sw - 2 * m, cap);
  y += used + (sh - 2 * m) * .06;
  if (contact) {
    const str = contact === "site" ? det(x, "site") : contact === "handle" ? det(x, "handle") : det(x, "phone");
    const ps = fitSize(c.D, str, sw * .6, cap * 1.55, .03);
    it.push(textLine(c.D, str, ps, sx + sw / 2, y + capOf(c.D, ps), { track: .03, fill: "I", tone: 0 }).item);
  }
  return svgOf({ w, h, it }, c.P, { mode: "colour", bg: false, pad: 0, title: c.N.full + " " + title, size: [w, h] });
}
/** the words of a banner set left, beside a panel */
function wordsBeside(it, c, x, bx, sy, bw, sh, contact, w, h, title) {
  const lead = c.N.trail ? c.N.lead : c.N.full, B = fitBlock(c.D, lead, bw, sh * .42, { maxLines: 2, lead: 1.06, capMax: sh * .3 });
  const capH = capOf(c.D, B.size), blockH = capH * (1 + (B.n - 1) * 1.06), sub = c.N.trail || c.small;
  const ss = fitSize(c.Lb, sub, bw, Math.max(12, capH * .32), .2), cs = contact ? fitSize(c.D, det(c.d && {}, "phone"), bw, capH * .42, .03) : 0;
  const str = contact === "site" ? det(x, "site") : contact === "handle" ? det(x, "handle") : det(x, "phone");
  const cS = contact ? fitSize(c.D, str, bw, capH * .42, .03) : 0;
  const total = blockH + capH * .5 + capOf(c.Lb, ss) + (contact ? capH * .55 + capOf(c.D, cS) : 0);
  let y = sy + sh / 2 - total / 2;
  drawBlock(it, c.D, B, bx, y + blockH / 2, { align: "left", lead: 1.06, fill: "I", tone: 0 });
  y += blockH + capH * .5;
  it.push(textLine(c.Lb, sub, ss, bx, y + capOf(c.Lb, ss), { align: "left", track: .2, fill: "A", tone: 0 }).item);
  y += capOf(c.Lb, ss);
  if (contact) { y += capH * .55; it.push(textLine(c.D, str, cS, bx, y + capOf(c.D, cS), { align: "left", track: .03, fill: "I", tone: 0 }).item); }
  void cs;
  return svgOf({ w, h, it }, c.P, { mode: "colour", bg: false, pad: 0, title: c.N.full + " " + title, size: [w, h] });
}

/** A poster (a post, a story, a sign): the logo at its head, a headline, a line under it, a list, a
 *  call to action and a foot, in the safe area (top and bottom insets for a story's own bars). */
function poster(spec, faces, w, h, o) {
  const c = ctxOf(spec.design, faces), x = spec.details, look = o.look || lookOf(spec, o.step || "posts", o.i || 0), it = [fill(w, h)];
  const s = Math.min(w, h), m = s * .08, top = (o.insetTop || 0) + m, bot = h - (o.insetBot || 0) - m, cw = w - 2 * m;
  deco(it, c, w, h, look, { m: m * .45 });
  const left = look === "stripes" && !o.center, ax = left ? m * 1.1 : w / 2, al = left ? "left" : "center", tw = left ? cw * .92 : cw;
  // the head: the name beside the mark (or the whole logo, when it is the subject)
  const logoForm = o.logo || "horizontal", la = art(c, logoForm);
  const lh = logoForm === "primary" ? Math.min((bot - top) * .3, cw * .55 * la.h / la.w) : Math.min((bot - top) * .085, s * .11);
  const lb = place(it, la, left ? m * 1.1 : m, top, left ? cw * .7 : cw, lh, { align: left ? "left" : "center", valign: "top" });
  // the foot: a web address or a handle, small
  const footStr = o.foot === false ? "" : up(o.foot || [x.site || SAMPLE.site, x.handle].filter(Boolean).join("  ·  "));
  const fs = footStr ? fitSize(c.Lb, footStr, tw, s * .022, .16) : 0;
  const footY = bot - capOf(c.Lb, fs);
  if (footStr) it.push(textLine(c.Lb, footStr, fs, ax, bot, { align: al, track: .16, fill: look === "band" ? "I" : "A", tone: 0 }).item);
  // the middle: headline, sub, list, call to action, centred between the head and the foot
  const room = footY - lb.y1 - s * .1, parts = [];
  const hd = up(o.head), hB = fitBlock(c.D, hd, tw, room * (o.list ? .42 : .55), { maxLines: 3, lead: 1.02, capMax: s * (o.big || .15), one: 1.05 });
  const hCap = capOf(c.D, hB.size), hH = hCap * (1 + (hB.n - 1) * 1.02);
  parts.push(["head", hH]);
  let subS = 0; if (o.sub) { subS = fitSize(c.Lb, up(o.sub), tw * .9, Math.max(s * .026, hCap * .2), .18); parts.push(["gap", hCap * .42], ["sub", capOf(c.Lb, subS)]); }
  let liS = 0; if (o.list) { liS = fitSize(c.Lb, o.list.reduce((a, b) => a.length > b.length ? a : b), tw * .7, s * .034, .08); parts.push(["gap", hCap * .5], ["list", capOf(c.Lb, liS) * (1 + (o.list.length - 1) * 2.1)]); }
  let ctaCap = 0; if (o.cta) { ctaCap = Math.min(s * .036, hCap * .42); parts.push(["gap", hCap * .55], ["cta", ctaCap * 2.3]); }
  const total = parts.reduce((a, [, v]) => a + v, 0);
  let y = lb.y1 + s * .05 + Math.max(0, (room - total) / 2);
  for (const [k, v] of parts) {
    if (k === "head") {
      if (look === "band") it.push({ d: rectD(0, y - hCap * .5, w, hH + hCap), fill: "P", tone: 0 });
      if (look === "dots") { const sh = []; drawBlock(sh, c.D, hB, ax + hCap * .07, y + hH / 2 + hCap * .07, { align: al, lead: 1.02, fill: "A", tone: 0 }); it.push(...sh); }
      drawBlock(it, c.D, hB, ax, y + hH / 2, { align: al, lead: 1.02, fill: look === "band" ? "Q" : "I", tone: 0 });
    } else if (k === "sub") it.push(textLine(c.Lb, up(o.sub), subS, ax, y + v, { align: al, track: .18, fill: "A", tone: 0 }).item);
    else if (k === "list") {
      const lc = capOf(c.Lb, liS), wMax = Math.max(...o.list.map(l => shapeRun(c.Lb, l, .08).w)) * liS / 1000, lx = left ? ax + lc * 1.9 : w / 2 - (wMax + lc * 1.9) / 2 + lc * 1.9;
      o.list.forEach((l, j) => {
        const ly = y + j * lc * 2.1;
        const num = /^(\d)\s+(.*)$/.exec(l);
        if (num) {
          it.push(dot(lx - lc * 1.15, ly + lc / 2, lc * 1.05, "A", 0));
          it.push(textLine(c.D, num[1], lc * 1000 / (c.D.cap || 700) * 1.1, lx - lc * 1.15, ly + lc / 2 + lc * .55, { fill: "G", tone: 0 }).item);
        } else it.push(iconItem("check", lx - lc * 1.15, ly + lc / 2, lc * 1.5, "A", 0, 9));
        it.push(textLine(c.Lb, num ? num[2] : l, liS, lx, ly + lc, { align: "left", track: .08, fill: "I", tone: 0 }).item);
      });
    } else if (k === "cta") pill(it, c, up(o.cta), left ? ax + (tw * .5) / 2 : w / 2, y, tw * (left ? .5 : .7), ctaCap, look === "band" ? { fill: "A", ink: "G" } : {});
    y += v;
  }
  return svgOf({ w, h, it }, c.P, { mode: "colour", bg: false, pad: 0, title: c.N.full + " " + (o.title || "post"), size: [w, h] });
}

/** An Instagram highlight cover: 1080 × 1920, the symbol in the middle circle Instagram crops to */
function highlight(spec, faces, icon, word) {
  const c = ctxOf(spec.design, faces), w = 1080, h = 1920, it = [fill(w, h)], look = lookOf(spec, "posts");
  deco(it, c, w, h, look === "band" || look === "frame" ? "ghost" : look);
  const r = 330;
  it.push({ d: circleD(w / 2, h / 2, r), fill: "P", tone: 0 });
  it.push(ring(w / 2, h / 2, r - 34, 8, "Q", 0));
  it.push(iconItem(icon, w / 2, h / 2 - 22, 300, "Q", 0, 7));
  const ws = fitSize(c.Lb, word, 380, 40, .22);
  it.push(textLine(c.Lb, word, ws, w / 2, h / 2 + 170, { track: .22, fill: "Q", tone: 0 }).item);
  return svgOf({ w, h, it }, c.P, { mode: "colour", bg: false, pad: 0, title: c.N.full + " highlight: " + word, size: [w, h] });
}

/* the business card, at 300 dpi on its bleed: 3.5 × 2 in plus 1/8 in a side (the card maker's sheet) */
const CARD = { w: 1125, h: 675, bleed: 37.5 };
function cardFront(spec, faces) {
  const c = ctxOf(spec.design, faces), { w, h, bleed } = CARD, it = [fill(w, h)], look = lookOf(spec, "card");
  const safe = bleed * 2;
  if (look === "band") { it.push({ d: rectD(0, h - bleed - 120, w, bleed + 120), fill: "P", tone: 0 }); }
  else if (look !== "frame") deco(it, c, w, h, look);
  else it.push({ d: rectD(safe, safe, w - 2 * safe, h - 2 * safe, 14), stroke: "A", sw: 6, tone: 0 });
  const a = art(c, "primary"), boxH = (h - 2 * safe) * (look === "band" ? .62 : .72);
  place(it, a, safe + 40, safe + (look === "band" ? 18 : ((h - 2 * safe) - boxH) / 2), w - 2 * safe - 80, boxH);
  if (look === "band") { const ss = fitSize(c.Lb, c.small, w - 2 * safe - 60, 26, .24); it.push(textLine(c.Lb, c.small, ss, w / 2, h - bleed - 60 + capOf(c.Lb, ss) / 2, { track: .24, fill: "Q", tone: 0 }).item); }
  return svgOf({ w, h, it }, c.P, { mode: "colour", bg: false, pad: 0, title: c.N.full + " business card, front", size: [w, h] });
}
function cardBack(spec, faces) {
  const c = ctxOf(spec.design, faces), x = spec.details, { w, h, bleed } = CARD, it = [fill(w, h)], look = lookOf(spec, "card");
  const safe = bleed * 2, L = safe + 36, R = w - safe - 36;
  // the mark at the right on its plate; the person and the ways to reach them at the left
  const ms = 250, mx = R - ms, my = h / 2 - ms / 2 - (look === "band" ? 30 : 0);
  place(it, art(c, "mark"), mx, my, ms, ms);
  const colW = mx - L - 50;
  let y = safe + 34;
  if (x.person) {
    const ns = fitSize(c.D, up(x.person), colW, 58, .02); y += capOf(c.D, ns);
    it.push(textLine(c.D, up(x.person), ns, L, y, { align: "left", track: .02, fill: "I", tone: 0 }).item);
    if (x.role) { const rs = fitSize(c.Lb, up(x.role), colW, 22, .2); y += 22 + capOf(c.Lb, rs); it.push(textLine(c.Lb, up(x.role), rs, L, y, { align: "left", track: .2, fill: "A", tone: 0 }).item); }
    y += 40;
  } else {
    const ns = fitSize(c.D, c.N.full, colW, 50, .02); y += capOf(c.D, ns);
    it.push(textLine(c.D, c.N.full, ns, L, y, { align: "left", track: .02, fill: "I", tone: 0 }).item); y += 40;
  }
  const rows = [["call", det(x, "phone")], ["mail", x.email || SAMPLE.email], ["globe", x.site || SAMPLE.site], ["pin", x.address || tidy(c.d.town) || SAMPLE.address]];
  if (x.handle) rows.push(["chat", x.handle]);
  const bottom = look === "band" ? h - bleed - 120 - 26 : h - safe - 10, rh = Math.min(64, (bottom - y) / rows.length);
  const fs = Math.min(...rows.map(([, t]) => fitSize(c.Lb, t, colW - 64, rh * .38, .02)));
  rows.forEach(([ic, t], j) => {
    const cy = y + j * rh + rh / 2;
    it.push(iconItem(ic, L + 18, cy, 36, "A", 0, 8));
    it.push(textLine(c.Lb, t, fs, L + 56, cy + capOf(c.Lb, fs) / 2, { align: "left", track: .02, fill: "I", tone: 0 }).item);
  });
  if (look === "band") {
    it.push({ d: rectD(0, h - bleed - 120, w, bleed + 120), fill: "P", tone: 0 });
    const ss = fitSize(c.Lb, c.small, w - 2 * safe - 60, 26, .24);
    it.push(textLine(c.Lb, c.small, ss, w / 2, h - bleed - 60 + capOf(c.Lb, ss) / 2, { track: .24, fill: "Q", tone: 0 }).item);
  } else it.push({ d: rectD(L, h - safe - 4, R - L, 4, 2), fill: "A", tone: 0 });
  return svgOf({ w, h, it }, c.P, { mode: "colour", bg: false, pad: 0, title: c.N.full + " business card, back", size: [w, h] });
}

/** The email signature (shown at 600 × 180; drawn twice that for sharp screens) */
function signature(spec, faces) {
  const c = ctxOf(spec.design, faces), x = spec.details, w = 1200, h = 360, it = [fill(w, h)];
  place(it, art(c, "mark"), 40, 40, 280, 280);
  it.push({ d: rectD(360, 50, 5, h - 100, 2), fill: "A", tone: 0 });
  const bx = 400, bw = w - bx - 40;
  const lines = [[x.person ? up(x.person) : (c.N.trail ? c.N.lead : c.N.full), c.D, 56, "I", .02], [x.role ? up(x.role) + "  ·  " + c.N.full : c.small, c.Lb, 22, "A", .16],
    [det(x, "phone") + "   " + (x.email || SAMPLE.email), c.Lb, 26, "I", .02], [(x.site || SAMPLE.site) + (x.handle ? "   " + x.handle : ""), c.Lb, 26, "I", .02]];
  const sizes = lines.map(([t, F, cap, , tr]) => fitSize(F, t, bw, cap, tr)), gaps = [0, 26, 40, 22];
  const total = lines.reduce((a, [, F], j) => a + capOf(F, sizes[j]) + gaps[j], 0);
  let y = h / 2 - total / 2;
  lines.forEach(([t, F, , f, tr], j) => { y += gaps[j] + capOf(F, sizes[j]); it.push(textLine(F, t, sizes[j], bx, y, { align: "left", track: tr, fill: f, tone: 0 }).item); });
  return svgOf({ w, h, it }, c.P, { mode: "colour", bg: false, pad: 0, title: c.N.full + " email signature", size: [w, h] });
}

/** A round thank-you sticker, 3 in at 300 dpi: the words round the ring, the mark in the middle */
function sticker(spec, faces) {
  const c = ctxOf(spec.design, faces), w = 900, h = 900, cx = 450, cy = 450, it = [];
  it.push({ d: circleD(cx, cy, 446), fill: "G", tone: 0 });
  it.push(ring(cx, cy, 420, 14, "A", 0));
  it.push(ring(cx, cy, 300, 5, "A", 0));
  const top = "THANK YOU", ts = arcFit(c.D, top, 318, 150, 74, 1, .06);
  arcText(it, c.D, top, ts, cx, cy, 318, { dir: 1, track: .06, fill: "I", tone: 0 });
  const foot = c.N.full, fs = arcFit(c.Lb, foot, 396, 130, 34, -1, .14);
  arcText(it, c.Lb, foot, fs, cx, cy, 396, { dir: -1, track: .14, fill: "A", tone: 0 });
  for (const a of [-1, 1]) { const r = a * 100 * Math.PI / 180; it.push({ d: starD(cx + 360 * Math.sin(r), cy - 360 * Math.cos(r), 16), fill: "A", tone: 0 }); }
  place(it, art(c, "mark"), cx - 200, cy - 200, 400, 400);
  return svgOf({ w, h, it }, c.P, { mode: "colour", bg: false, pad: 0, title: c.N.full + " thank-you sticker", size: [w, h] });
}

/** The one-page brand guide, letter size at 200 dpi: the logo, its versions, the colours, the type */
function guide(spec, faces) {
  const c = ctxOf(spec.design, faces), P = c.P, w = 1700, h = 2200, it = [fill(w, h, "#f5f4f0")], ink = "#16181d", grey = "#5b616e";
  const t = (F, str, cap, x, y, o = {}) => { const s = fitSize(F, str, o.w || 1400, cap, o.track || 0); it.push(textLine(F, str, s, x, y, { align: o.align || "left", track: o.track || 0, fill: o.fill || ink, tone: 0 }).item); return capOf(F, s); };
  t(c.Lb, "BRAND GUIDE", 26, 130, 170, { track: .3, fill: grey });
  t(c.D, c.N.full, 84, 130, 290, { w: 1440 });
  // the logo on its own colour, large
  it.push({ d: rectD(130, 360, 1440, 640, 24), fill: "G", tone: 0 });
  place(it, art(c, "primary"), 230, 420, 1240, 520);
  // the versions
  t(c.Lb, "VERSIONS", 24, 130, 1100, { track: .3, fill: grey });
  const vs = [["G", "I"], ["#ffffff", ink], [ink, "#ffffff"], ["P", "Q"]];
  vs.forEach(([bg], j) => {
    const x0 = 130 + j * 368, y0 = 1140;
    it.push({ d: rectD(x0, y0, 336, 250, 18), fill: bg, tone: 0 });
    if (bg === "#d0d0d0") return;
  });
  // the colour and one-colour versions are drawn as separate files; here the mark in each, which reads at this size
  const mk = art(c, "mark");
  place(it, mk, 130 + 336 / 2 - 95, 1170, 190, 190);
  place(it, mk, 130 + 368 * 3 + 336 / 2 - 95, 1170, 190, 190, { as: "G", under: "Q" });
  const mono = (x0, col, under) => place(it, mk, x0 + 336 / 2 - 95, 1170, 190, 190, { as: col, under });
  mono(130 + 368, ink, "#ffffff"); mono(130 + 368 * 2, "#ffffff", ink);
  ["Full colour", "On white", "On black", "Reversed"].forEach((l, j) => t(c.Lb, up(l), 20, 130 + j * 368 + 168, 1430, { align: "center", track: .2, fill: grey, w: 320 }));
  // the colours
  t(c.Lb, "COLOURS", 24, 130, 1540, { track: .3, fill: grey });
  [["G", P.G, "BACKGROUND"], ["I", P.I, "LETTERING"], ["A", P.A, "ACCENT"], ["P", P.P, "BAND"]].forEach(([k, hex, l], j) => {
    const x0 = 130 + j * 368;
    it.push({ d: rectD(x0, 1580, 336, 190, 18), fill: k, tone: 0 });
    it.push({ d: rectD(x0, 1580, 336, 190, 18), stroke: "#d9d6ce", sw: 3, tone: 0 });
    t(c.Lb, l, 20, x0, 1820, { track: .2, fill: grey, w: 330 });
    t(c.Lb, hex.toUpperCase(), 30, x0, 1866, { track: .04, w: 330 });
  });
  // the type
  t(c.Lb, "LETTERING", 24, 130, 1970, { track: .3, fill: grey });
  const fam = k => (faces[k] && faces[k].family) || k;
  t(c.D, "Aa  " + fam(c.V.display), 48, 130, 2060, { w: 700 });
  t(c.Lb, "Aa  " + fam(c.V.label), 40, 900, 2060, { w: 670 });
  return svgOf({ w, h, it }, P, { mode: "colour", bg: false, pad: 0, title: c.N.full + " brand guide", size: [w, h] });
}

/** the logo, a profile picture or an app icon: the engine's own forms */
const logoFile = o => (spec, faces) => E.logoSvg(spec.design, faces, o);
function profile(spec, faces, { size = 1080, form = "auto", ground = "G" } = {}) {
  const c = ctxOf(spec.design, faces), L = layoutOf(c), whole = form === "auto" ? ["seal", "coin", "burst", "hexagon"].includes(c.d.t) : form === "primary";
  const a = whole ? L.draw(c) : drawMark(c, L.shape), it = [fill(1000, 1000, ground)];
  place(it, a, 120, 120, 760, 760);
  return svgOf({ w: 1000, h: 1000, it }, c.P, { mode: "colour", bg: false, pad: 0, title: c.N.full, size: [size, size] });
}

/* ---------- every file of the kit ---------- */
/* step: where the flow shows it; dir: its folder in the zip; vector: also kept as SVG */
const S = (o) => o;
export const FORMATS = [
  // Essentials: 20
  S({ id: "logo", tier: "essentials", step: "logo", dir: "01-logo", file: "logo-full-colour", title: "Logo, full colour", long: 2400, vector: true, draw: logoFile({ mode: "colour", pad: .14 }) }),
  S({ id: "logo-clear", tier: "essentials", step: "logo", dir: "01-logo", file: "logo-see-through", title: "Logo, see-through", long: 2400, vector: true, clear: true, draw: logoFile({ mode: "transparent", bg: false, pad: .04 }) }),
  S({ id: "logo-black", tier: "essentials", step: "logo", dir: "01-logo", file: "logo-black", title: "Logo, black", long: 2400, vector: true, clear: true, on: "#ffffff", draw: logoFile({ mode: "black", pad: .04 }) }),
  S({ id: "logo-white", tier: "essentials", step: "logo", dir: "01-logo", file: "logo-white", title: "Logo, white", long: 2400, vector: true, clear: true, on: "#1b1d22", draw: logoFile({ mode: "white", pad: .04 }) }),
  S({ id: "logo-side", tier: "essentials", step: "logo", dir: "01-logo", file: "logo-side-by-side", title: "Name beside the mark", long: 2400, vector: true, clear: true, draw: logoFile({ form: "horizontal", mode: "transparent", bg: false, pad: .04 }) }),
  S({ id: "mark", tier: "essentials", step: "logo", dir: "01-logo", file: "mark", title: "The mark alone", long: 1600, vector: true, clear: true, draw: logoFile({ form: "mark", mode: "transparent", bg: false, pad: .02 }) }),
  S({ id: "profile", tier: "essentials", step: "social", dir: "02-profile-pictures", file: "profile-instagram-facebook-tiktok", title: "Profile picture", sub: "Instagram, Facebook, TikTok, LinkedIn", w: 1080, h: 1080, round: true, draw: (s, f) => profile(s, f) }),
  S({ id: "profile-mark", tier: "essentials", step: "social", dir: "02-profile-pictures", file: "profile-small-circles", title: "Small-circle profile", sub: "WhatsApp, OfferUp, Google Maps", w: 1080, h: 1080, round: true, draw: (s, f) => profile(s, f, { form: "mark", ground: "P" }) }),
  S({ id: "profile-google", tier: "essentials", step: "social", dir: "02-profile-pictures", file: "google-business-logo", title: "Google Business logo", sub: "720 × 720", w: 720, h: 720, draw: (s, f) => profile(s, f, { size: 720, form: "primary" }) }),
  S({ id: "cover-facebook", tier: "essentials", step: "social", dir: "03-banners", file: "facebook-cover", title: "Facebook cover", sub: "1640 × 624", w: 1640, h: 624, draw: (s, f) => banner(s, f, 1640, 624, { safe: [270, 40, 1100, 544], i: 0, title: "Facebook cover" }) }),
  S({ id: "cover-x", tier: "essentials", step: "social", dir: "03-banners", file: "x-header", title: "X header", sub: "1500 × 500", w: 1500, h: 500, draw: (s, f) => banner(s, f, 1500, 500, { safe: [300, 50, 1100, 330], i: 1, contact: "site", title: "X header" }) }),
  S({ id: "cover-youtube", tier: "essentials", step: "social", dir: "03-banners", file: "youtube-banner", title: "YouTube banner", sub: "2560 × 1440", w: 2560, h: 1440, draw: (s, f) => banner(s, f, 2560, 1440, { safe: [507, 508, 1546, 423], i: 2, title: "YouTube banner" }) }),
  S({ id: "cover-linkedin", tier: "essentials", step: "social", dir: "03-banners", file: "linkedin-banner", title: "LinkedIn banner", sub: "1584 × 396", w: 1584, h: 396, draw: (s, f) => banner(s, f, 1584, 396, { safe: [420, 30, 1100, 336], i: 3, contact: "site", title: "LinkedIn banner" }) }),
  S({ id: "cover-google", tier: "essentials", step: "social", dir: "03-banners", file: "google-business-cover", title: "Google Business cover", sub: "1024 × 576", w: 1024, h: 576, draw: (s, f) => banner(s, f, 1024, 576, { safe: [60, 50, 904, 476], i: 4, title: "Google Business cover" }) }),
  S({ id: "card-front", tier: "essentials", step: "card", dir: "04-business-card", file: "business-card-front", title: "Business card, front", sub: "3.5 × 2 in, print-ready", w: CARD.w, h: CARD.h, card: true, draw: cardFront }),
  S({ id: "card-back", tier: "essentials", step: "card", dir: "04-business-card", file: "business-card-back", title: "Business card, back", sub: "Your details", w: CARD.w, h: CARD.h, card: true, draw: cardBack }),
  S({ id: "app-icon", tier: "essentials", step: "print", dir: "05-web-and-email", file: "app-icon-512", title: "App icon", sub: "512 × 512", w: 512, h: 512, draw: logoFile({ form: "mark", mode: "colour", pad: .1 }) }),
  S({ id: "touch-icon", tier: "essentials", step: "print", dir: "05-web-and-email", file: "apple-touch-icon-180", title: "Home-screen icon", sub: "180 × 180", w: 180, h: 180, draw: logoFile({ form: "mark", mode: "colour", pad: .1 }) }),
  S({ id: "favicon", tier: "essentials", step: "print", dir: "05-web-and-email", file: "favicon-32", title: "Website icon", sub: "32 × 32", w: 32, h: 32, draw: logoFile({ form: "mark", mode: "colour", pad: .04 }) }),
  S({ id: "signature", tier: "essentials", step: "print", dir: "05-web-and-email", file: "email-signature", title: "Email signature", sub: "600 × 180, sharp on every screen", w: 1200, h: 360, draw: signature }),
  // Complete: 30 more
  ...[["cashTag", "WE BUY"], ["dollar", "PRICES"], ["star", "REVIEWS"], ["check", "SOLD"], ["clock", "HOURS"], ["pin", "VISIT"], ["chat", "CONTACT"], ["sparkle", "NEW"]].map(([ic, word], j) =>
    S({ id: "highlight-" + (j + 1), tier: "complete", step: "posts", dir: "06-instagram-highlights", file: "highlight-" + word.toLowerCase().replace(/\s+/g, "-"), title: "Highlight: " + word[0] + word.slice(1).toLowerCase(), w: 1080, h: 1920, round: "highlight", draw: (s, f) => highlight(s, f, ic, word) })),
  S({ id: "story-buying", tier: "complete", step: "posts", dir: "07-stories", file: "story-we-are-buying", title: "Story: we're buying", w: 1080, h: 1920, draw: (s, f) => { const c = s.design.cat; return poster(s, f, 1080, 1920, { head: "WE'RE BUYING " + (LINE_WORDS[c] || "PHONES"), sub: promiseFor(c), cta: "CALL " + det(s.details, "phone"), insetTop: 230, insetBot: 260, i: 0, title: "story" }); } }),
  S({ id: "story-quote", tier: "complete", step: "posts", dir: "07-stories", file: "story-get-a-quote", title: "Story: get a quote", w: 1080, h: 1920, draw: (s, f) => poster(s, f, 1080, 1920, { head: "WHAT'S IT WORTH?", sub: "DM US FOR A FREE QUOTE", cta: det(s.details, "handle"), insetTop: 230, insetBot: 260, i: 1, title: "story" }) }),
  S({ id: "story-open", tier: "complete", step: "posts", dir: "07-stories", file: "story-open-today", title: "Story: open today", w: 1080, h: 1920, draw: (s, f) => poster(s, f, 1080, 1920, { head: "OPEN TODAY", sub: det(s.details, "hours"), cta: up(s.details.address || ctxTown(s) || SAMPLE.address), insetTop: 230, insetBot: 260, i: 2, title: "story" }) }),
  S({ id: "story-promise", tier: "complete", step: "posts", dir: "07-stories", file: "story-what-we-buy", title: "Story: what we buy", w: 1080, h: 1920, draw: (s, f) => poster(s, f, 1080, 1920, { head: promiseFor(s.design.cat), list: pointsFor(s.design.cat), cta: "CALL " + det(s.details, "phone"), insetTop: 230, insetBot: 260, i: 3, title: "story" }) }),
  S({ id: "story-follow", tier: "complete", step: "posts", dir: "07-stories", file: "story-follow-us", title: "Story: follow us", w: 1080, h: 1920, draw: (s, f) => poster(s, f, 1080, 1920, { head: "FOLLOW US", sub: "NEW DEALS EVERY WEEK", cta: det(s.details, "handle"), logo: "primary", insetTop: 230, insetBot: 260, i: 4, foot: false, title: "story" }) }),
  S({ id: "post-open", tier: "complete", step: "posts", dir: "08-posts", file: "post-now-open", title: "Post: now open", w: 1080, h: 1080, draw: (s, f) => poster(s, f, 1080, 1080, { head: "NOW OPEN", sub: ctxTown(s) ? "IN " + ctxTown(s) : "COME SAY HELLO", logo: "primary", i: 0, title: "post" }) }),
  S({ id: "post-buy", tier: "complete", step: "posts", dir: "08-posts", file: "post-we-buy", title: "Post: we buy", w: 1080, h: 1080, draw: (s, f) => poster(s, f, 1080, 1080, { head: headFor(s.design.cat), list: pointsFor(s.design.cat), cta: "CALL " + det(s.details, "phone"), i: 1, title: "post" }) }),
  S({ id: "post-how", tier: "complete", step: "posts", dir: "08-posts", file: "post-how-it-works", title: "Post: how it works", w: 1080, h: 1080, draw: (s, f) => poster(s, f, 1080, 1080, { head: "HOW IT WORKS", list: ["1  SHOW US WHAT YOU HAVE", "2  GET A FAIR OFFER", "3  GET PAID ON THE SPOT"], i: 2, title: "post" }) }),
  S({ id: "post-thanks", tier: "complete", step: "posts", dir: "08-posts", file: "post-thank-you", title: "Post: thank you", w: 1080, h: 1080, draw: (s, f) => poster(s, f, 1080, 1080, { head: "THANK YOU", sub: "FOR SUPPORTING A LOCAL SHOP", logo: "primary", i: 3, title: "post" }) }),
  S({ id: "post-hours", tier: "complete", step: "posts", dir: "08-posts", file: "post-hours", title: "Post: our hours", w: 1080, h: 1080, draw: (s, f) => poster(s, f, 1080, 1080, { head: "OUR HOURS", sub: det(s.details, "hours"), cta: up(s.details.address || ctxTown(s) || SAMPLE.address), i: 4, title: "post" }) }),
  S({ id: "post-worth", tier: "complete", step: "posts", dir: "08-posts", file: "post-whats-it-worth", title: "Post: what's it worth?", w: 1080, h: 1080, draw: (s, f) => poster(s, f, 1080, 1080, { head: "WHAT'S IT WORTH?", sub: "ASK US FOR A FREE QUOTE", cta: "CALL " + det(s.details, "phone"), i: 5, title: "post" }) }),
  S({ id: "cover-fb-group", tier: "complete", step: "social", dir: "03-banners", file: "facebook-group-cover", title: "Facebook group cover", sub: "1640 × 856", w: 1640, h: 856, draw: (s, f) => banner(s, f, 1640, 856, { safe: [220, 120, 1200, 616], i: 5, title: "Facebook group cover" }) }),
  S({ id: "cover-ebay", tier: "complete", step: "social", dir: "03-banners", file: "ebay-store-billboard", title: "eBay store billboard", sub: "1200 × 270", w: 1200, h: 270, draw: (s, f) => banner(s, f, 1200, 270, { safe: [40, 20, 1120, 230], i: 6, contact: "", title: "eBay store billboard" }) }),
  S({ id: "post-google", tier: "complete", step: "posts", dir: "08-posts", file: "google-business-post", title: "Google Business post", sub: "1200 × 900", w: 1200, h: 900, draw: (s, f) => poster(s, f, 1200, 900, { head: headFor(s.design.cat), sub: promiseFor(s.design.cat), cta: "CALL " + det(s.details, "phone"), i: 6, title: "Google post" }) }),
  S({ id: "thumb-youtube", tier: "complete", step: "posts", dir: "08-posts", file: "youtube-thumbnail", title: "YouTube thumbnail", sub: "1280 × 720", w: 1280, h: 720, draw: (s, f) => poster(s, f, 1280, 720, { head: "WHAT WE BOUGHT THIS WEEK", foot: false, i: 7, big: .2, title: "YouTube thumbnail" }) }),
  S({ id: "post-x", tier: "complete", step: "posts", dir: "08-posts", file: "x-post", title: "X post", sub: "1600 × 900", w: 1600, h: 900, draw: (s, f) => poster(s, f, 1600, 900, { head: "NOW BUYING", sub: headFor(s.design.cat).replace(/^WE BUY /, ""), cta: "CALL " + det(s.details, "phone"), i: 8, title: "X post" }) }),
  S({ id: "sign-window", tier: "complete", step: "print", dir: "09-print", file: "window-poster-18x24", title: "Window poster", sub: "18 × 24 in", w: 1800, h: 2400, vector: true, draw: (s, f) => poster(s, f, 1800, 2400, { head: headFor(s.design.cat), sub: promiseFor(s.design.cat), list: pointsFor(s.design.cat), cta: det(s.details, "phone"), look: lookOf(s, "print"), title: "window poster" }) }),
  S({ id: "sign-hours", tier: "complete", step: "print", dir: "09-print", file: "door-hours-sign-letter", title: "Door hours sign", sub: "8.5 × 11 in", w: 2550, h: 3300, vector: true, draw: (s, f) => poster(s, f, 2550, 3300, { head: "COME ON IN", sub: det(s.details, "hours"), cta: det(s.details, "phone"), logo: "primary", look: lookOf(s, "print", 1), title: "door sign" }) }),
  S({ id: "sticker", tier: "complete", step: "print", dir: "09-print", file: "thank-you-sticker-3in", title: "Thank-you sticker", sub: "3 in round", w: 900, h: 900, vector: true, round: true, draw: sticker }),
  S({ id: "watermark", tier: "complete", step: "print", dir: "10-brand", file: "photo-watermark", title: "Photo watermark", sub: "For your listing photos", long: 1200, clear: true, on: "#6b7280", draw: (s, f) => E.logoSvg(s.design, f, { form: "horizontal", mode: "white", pad: .04 }) }),
  S({ id: "email-header", tier: "complete", step: "print", dir: "10-brand", file: "email-header", title: "Email and invoice header", sub: "1200 × 300", w: 1200, h: 300, draw: (s, f) => banner(s, f, 1200, 300, { safe: [40, 20, 1120, 260], step: "print", i: 2, contact: "site", title: "email header" }) }),
  S({ id: "guide", tier: "complete", step: "print", dir: "10-brand", file: "brand-guide", title: "Brand guide", sub: "Your colours, lettering and logo", w: 1700, h: 2200, vector: true, draw: guide }),
];
const ctxTown = s => up(tidy(s.design.town));
export const FORMAT = Object.fromEntries(FORMATS.map(f => [f.id, f]));
export const kitFor = tier => FORMATS.filter(f => tier === "complete" || f.tier === "essentials");
export const COUNTS = { essentials: kitFor("essentials").length, complete: kitFor("complete").length };

/** one file as SVG */
export function kitSvg(id, spec, faces) {
  const F = FORMAT[id]; if (!F) throw new Error("No such kit file: " + id);
  return F.draw(cleanSpec(spec), faces);
}

/** The steps the flow walks, each a set of the kit's files to approve */
export const FLOW = [
  { key: "logo", title: "Your logo", says: "Your logo in every version you'll need: colour, see-through, black, white, beside its name and the mark alone." },
  { key: "social", title: "Profiles and banners", says: "Profile pictures and banners sized for each platform, with everything that matters inside what every screen shows." },
  { key: "card", title: "Business card", says: "Front and back, print-ready at 3.5 × 2 inches with the bleed print shops ask for." },
  { key: "posts", title: "Posts, stories and highlights", says: "Instagram highlight covers, stories and posts in your colours, ready to post." },
  { key: "print", title: "Signs, web and email", says: "Your website and app icons, email signature, window poster, door sign, sticker, photo watermark and brand guide." },
];

/** The kit's note, in the zip */
export function readme(spec, tier, faces) {
  const s = cleanSpec(spec), N = E.partsOf(s.design.name), P = paletteOf(s.design.pair), V = E.LOGO_VOICES[s.design.voice];
  const face = k => (faces && faces[k] && faces[k].family) || k, list = kitFor(tier);
  const dirs = [...new Set(list.map(f => f.dir))];
  return [
    N.full + " brand kit (" + KIT_TIERS[tier].name + "), made with WeBuy.AD (webuy.ad/logo)",
    "",
    ...dirs.map(d => d + "/  " + list.filter(f => f.dir === d).map(f => f.title).join(", ")),
    "",
    "SVG files are vectors: send them to a sign or print shop, or use them at any size.",
    "The business card PDF has the bleed and crop marks print shops ask for. Ask for 16 pt card stock.",
    "",
    "Your colours",
    "  Background  " + P.G, "  Lettering   " + P.I, "  Accent      " + P.A, "  Band        " + P.P + " (its lettering " + P.Q + ")",
    "",
    "Your lettering",
    "  " + face(V.display) + " for the name, " + face(V.label) + " for the small lines.",
    "  Both are free fonts under the SIL Open Font License (fonts.google.com, or fontshare.com for Satoshi).",
    "",
    "Download your kit again any time at webuy.ad/logo, signed in with the account that bought it.",
    "",
  ].join("\n");
}
