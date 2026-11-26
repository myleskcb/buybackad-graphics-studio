/* ═══════════════════════════════════════════════════════════════════════════
   THE BUSINESS CARD MAKER (cards/). Owner, 2026-11-19: "business card designer..? just an idea and
   suggest quick same day print locations near you? just as an added bonus"; 2026-11-22: "Do this
   task here", and of it and a logo designer to come: "needs to be super pay walled".

   A standard US card, 3.5 × 2 in, front and back, drawn at 300 dpi with the 1/8 in bleed printers
   ask for: 1125 × 675 pixels, the trim 1050 × 600 inside it, and every word and the QR inside a
   safe area 1/8 in inside the trim. It is filled from what the customer typed in the studio
   (localStorage pgfx_brand: number, website, business name, area; pgfx_full_studio: the business
   name on the full ad, the line they buy, its colours and type) and wears the full ad's own colour
   pairs (motion/house-colours.js) and type pairs (motion/catalog.js TYPE_VOICES), so a card matches
   the ads. Five layouts, cohesive by those rules and varied in look (DESIGN-LAW, the owner's "ad
   variety over one house look"); New look draws another.

   Anyone can design one and see it (the preview carries the WeBuy.AD mark until the account's plan
   downloads cards). The print-ready PDF (both sides, bleed, crop marks) and the PNGs come with Pro
   and Business: the function decides (/api/export/check and /api/export, kind "card":
   netlify/lib/plans.mjs cards), and a card is one of the plan's photo downloads.

   "Print it today" (a button, and shown after a download): where to print the same day near the
   customer's ZIP or town, as Apple Maps searches on Apple devices and in the iPhone app and Google
   Maps searches elsewhere, which the customer opens themselves (no service is called and nothing
   about them is sent), and what to ask for.

   The page opens on a gallery of finished cards (2026-11-24, DESIGN-LAW 176: "The card maker opens
   on a gallery of finished cards with the visitor's details filled in"): each a look drawn from one
   style's lists, front and back, in the customer's own words; the one tapped opens Customise, the
   form above, behind it. With a logo picked in the logo maker (logo/, localStorage pgfx_logo_kit),
   the gallery leads with the Logo layout: the logo on the front, set in the card's own colours by the
   logo engine, and the details on the back.

   window.CardMaker is for scripts/business_card_check.mjs.
   ═══════════════════════════════════════════════════════════════════════════ */
import { FONTS, TYPE_VOICES } from "../motion/catalog.js";
import { loadFonts, fontCss, applyCase, rng, contrastOf, mix, rgba, lum } from "../motion/engine.js";
import { HOUSE_COLOURS } from "../motion/house-colours.js";
import { FULL_VOICES } from "../motion/full-voices.js";
import { brandCardSvg, cardChoice, CARD_LAYOUTS, CARD_GROUNDS, CARD_LOOKS, cardPalette, buysFor, sellsFor } from "../logo/card.js";
import * as LE from "../logo/engine.js";
import { cleanDetails } from "../logo/kit.js";
import { printLinks, mountPrint } from "../logo/print-today.js";

const $ = id => document.getElementById(id);
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const box = (() => { try { const s = window.localStorage, k = "__card_t"; s.setItem(k, "1"); s.removeItem(k); return s; } catch (e) { return null; } })();
const jget = (k, fb) => { try { const v = box && box.getItem(k); return v == null ? fb : JSON.parse(v); } catch (e) { return fb; } };
const jset = (k, v) => { try { if (box) box.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } };

/* ---------- the sheet: 300 dpi, the bleed, the trim, the safe area ---------- */
export const DPI = 300;
export const BLEED = DPI / 8;                       // 1/8 in: 37.5 px
export const TRIM = { w: 3.5 * DPI, h: 2 * DPI };   // 1050 × 600
export const SHEET = { w: TRIM.w + 2 * BLEED, h: TRIM.h + 2 * BLEED };   // 1125 × 675
export const SAFE = { x: 2 * BLEED, y: 2 * BLEED, w: TRIM.w - 2 * BLEED, h: TRIM.h - 2 * BLEED };   // 1/8 in inside the trim

const LAYOUTS = [
  { key: "band", name: "Band", hint: "Your number on a band across the foot" },
  { key: "split", name: "Split", hint: "What you buy on a panel, you beside it" },
  { key: "center", name: "Centred", hint: "Everything on one line down the middle" },
  { key: "pop", name: "Pop", hint: "Comic-book: halftone dots, a burst, hard shadows" },
  { key: "ticket", name: "Ticket", hint: "A ticket: your number on its printed line, what you buy on the stub" },
];
/* the Logo layout: offered where the customer has picked a logo (logo/), never drawn by New look, and
   left out of LAYOUTS, which the check walks for the five layouts' own rules */
const LOGO_LAYOUT = { key: "logo", name: "Logo", hint: "Your logo on the front, your details on the back" };
const PAIRS = HOUSE_COLOURS.filter(c => !c.twin);
const PAIR_OF = Object.fromEntries(HOUSE_COLOURS.map(c => [c.key, c]));
/* the type pairs the full ad wears (motion/full-voices.js: each one read at a feed's size and by eye),
   plus Bold, the card's own default: a card is set in the faces of the ads it goes with */
const VOICES = ["bold", ...FULL_VOICES].filter((k, i, a) => a.indexOf(k) === i && TYPE_VOICES[k] && FONTS[TYPE_VOICES[k].display] && FONTS[TYPE_VOICES[k].label]);

/* ---------- what the card says, and how it looks ---------- */
const STORE = "pgfx_card";
let LINES = [], LINE_OF = {};
const state = Object.assign({
  name: "", line: "", phone: "", site: "", where: "", points: "", models: "",
  layout: "band", pair: "", voice: "bold", fill: "", style: "", look: "", frame: false, qr: true, seed: 1, chosen: false, gseed: 1,
  mode: "brand", blayout: "", bground: "",   // Brand cards (logo/card.js, DESIGN-LAW 185) or Promo cards (the layouts below)
}, jget(STORE, null) || {});
if (state.mode !== "promo") state.mode = "brand";
state.blayout = ""; state.bground = "";   // a brand card's layout and background live in the kit (pgfx_logo.card), never here
const keep = () => jset(STORE, state);

/** the studio's own words for this customer, where the card has none of its own yet */
function fromStudio() {
  const brand = jget("pgfx_brand", null) || {}, fa = jget("pgfx_full_studio", null) || {};
  const area = brand.area || null;
  const towns = area ? [area.home, ...(area.cover || [])].map(s => String(s || "").split(",")[0].trim()).filter(Boolean) : [];
  const where = [...new Set(towns)].slice(0, 3).join(" • ");
  const line = Object.values(fa.line || {}).find(k => LINE_OF[k]) || "";
  return { name: brand.name || fa.biz || "", phone: brand.phone || "", site: brand.website || "", where, line,
    pair: PAIR_OF[fa.pair] ? fa.pair : "", voice: TYPE_VOICES[fa.voice] ? fa.voice : "", zip: area && area.zip || "", home: area && area.home || "",
    at: area && Number.isFinite(area.lat) && Number.isFinite(area.lon) ? { lat: area.lat, lon: area.lon } : null };   // the area dialog's own point (app.js resolveArea), for Apple Maps
}

const lineNow = () => LINE_OF[state.line] || LINE_OF.iphone || LINES[0] || { key: "iphone", cat: "phones", label: "iPhones", models: "", points: "FREE QUOTE, CASH SAME DAY, NO FEES" };
const pairNow = () => PAIR_OF[state.pair] || PAIRS.find(p => (p.suits || []).includes(lineNow().cat)) || PAIRS[0];
const voiceNow = () => VOICES.includes(state.voice) ? state.voice : "bold";
const caps = s => applyCase(String(s || "").trim(), "brand");
const words = () => {
  const L = lineNow();
  const pts = (state.points || L.points || "FREE QUOTE, CASH SAME DAY, NO FEES").split(/\s*,\s*/).map(caps).filter(Boolean).slice(0, 4);
  return {
    name: caps(state.name) || "YOUR BUSINESS",
    buy: caps("We buy " + L.label.replace(/\s*\(.*?\)\s*/g, " ").trim()),
    phone: String(state.phone || "").trim() || "(555) 555-5555",
    site: String(state.site || "").trim().replace(/^https?:\/\//i, "").replace(/\/$/, ""),
    where: caps(state.where),
    models: caps(state.models || L.models || ""),
    points: pts,
  };
};

/* ---------- drawing ---------- */
/** the colours a card is drawn in, from a house pair: ground, words on it, the accent, the plate */
function paletteOf(p) {
  const c = p.colors;
  const onGround = contrastOf(c.ink, c.ground) >= 4.5 ? c.ink : (contrastOf("#ffffff", c.ground) > contrastOf("#111111", c.ground) ? "#ffffff" : "#111111");
  const accent = contrastOf(c.accent, c.ground) >= 3 ? c.accent : onGround;
  const plateInk = contrastOf(c.plate_ink, c.plate) >= 4.5 ? c.plate_ink : (contrastOf("#ffffff", c.plate) > contrastOf("#111111", c.plate) ? "#ffffff" : "#111111");
  return { ground: c.ground, light: c.light || mix(c.ground, onGround, .18), ink: onGround, accent, plate: c.plate, plateInk, dark: p.look === "dark" };
}

/** the largest size, at most max, at which text fits w (and h, when given) */
function fit(ctx, text, font, max, w, h, min = 10) {
  let s = max;
  for (; s > min; s -= Math.max(1, s * .04)) {
    ctx.font = fontCss(font, s);
    const m = ctx.measureText(text);
    if (m.width <= w && (!h || (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) <= h)) break;
  }
  return Math.max(min, s);
}
/* The small lines (the towns, the website, the models line, a label) are set at 7 pt or more: 29 px at
   300 dpi; SMALL is where they start. Only words too long to fit their place at 7 pt go under it
   (the polish, 2026-11-22: they had been 24-28 px, 6 pt, at the floor of what prints legibly). */
const FLOOR = 29, SMALL = 32;
/** a small line's size, in half-pixel steps so it never lands just under the floor */
function fitS(ctx, text, font, w, max = SMALL) {
  let s = max;
  for (; s > 20; s -= .5) { ctx.font = fontCss(font, s); if (ctx.measureText(text).width <= w) break; }
  return s;
}
/** The towns as one line at 7 pt and more, or broken at a bullet into two (the polish: "LONG BEACH •
 *  LAKEWOOD • DOWNEY" in a wide face would not go across Split's column at 7 pt) */
function townLines(ctx, t, font, w, max = 30) {
  const s = fitS(ctx, t, font, w, max), parts = t.split(/\s*•\s*/);
  if (s >= FLOOR || parts.length < 2) return { lines: [t], size: s };
  let best = null;   // (sayTowns spaces its lines itself)
  for (let i = 1; i < parts.length; i++) {
    const a = parts.slice(0, i).join(" • "), b = parts.slice(i).join(" • "), z = Math.min(fitS(ctx, a, font, w, max), fitS(ctx, b, font, w, max));
    if (!best || z > best.size) best = { lines: [a, b], size: z };
  }
  return best;
}
/** A small line (the models line) at 7 pt and more: on one line where it fits there, else broken into two
 *  of nearly a length, never shrunk under the floor while two lines would hold it */
function smallBlock(ctx, t, font, w, max = 30) {
  const s = fitS(ctx, t, font, w, max), ws = t.split(/\s+/);
  if (s >= FLOOR || ws.length < 2) return { lines: [t], size: s };
  let best = null;
  for (let i = 1; i < ws.length; i++) {
    const a = ws.slice(0, i).join(" "), b = ws.slice(i).join(" "), z = Math.min(fitS(ctx, a, font, w, max), fitS(ctx, b, font, w, max));
    ctx.font = fontCss(font, z); const d = Math.abs(ctx.measureText(a).width - ctx.measureText(b).width);
    if (!best || z > best.size + .25 || (z > best.size - .25 && d < best.d)) best = { lines: [a, b], size: z, d, lh: 1.24 };
  }
  return best.size > s ? best : { lines: [t], size: s };
}
/** the towns drawn up from a foot line; returns the top box */
function sayTowns(ctx, out, t, font, x, foot, w, opts) {
  const T = townLines(ctx, t, font, w, opts.max || 30);
  let b = null;
  for (let i = T.lines.length - 1; i >= 0; i--) { b = say(ctx, out, T.lines[i], font, T.size, x, foot, Object.assign({ foot: true, role: "where" }, opts)); foot = b.y - T.size * .36; }
  return b;
}
/** BARE: draw everything but the words, so the check can read what each word stands on */
let BARE = false;
/** text at (x, baseline y), its box recorded so the check can hold it to the safe area */
function say(ctx, out, text, font, size, x, y, { align = "left", fill = "#000", role = "text", shadow = null, foot = false } = {}) {
  if (!text) return null;
  frameNow(ctx);
  ctx.font = fontCss(font, size); ctx.textAlign = align; ctx.textBaseline = "alphabetic";
  const m = ctx.measureText(text);
  if (foot) y -= m.actualBoundingBoxDescent;          // y is where the line must end, descenders and all
  if (!BARE) {
    if (shadow) { ctx.fillStyle = shadow.color; ctx.fillText(text, x + shadow.dx, y + shadow.dy); }
    ctx.fillStyle = fill; ctx.fillText(text, x, y);
  }
  const left = align === "center" ? x - m.width / 2 : align === "right" ? x - m.width : x;
  const b = { role, text, size, font, color: fill, shadow: !!shadow, x: left, y: y - m.actualBoundingBoxAscent, w: m.width + (shadow ? Math.max(0, shadow.dx) : 0), h: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent + (shadow ? Math.max(0, shadow.dy) : 0) };
  out.push(b);
  return b;
}
const LH = .98;   // a block's line height, of its size
/** How a name (or any words) sets in a box of w × h: one line, or two broken where the two read
 *  best, whichever is larger; two only when they buy a real gain (the audit, 2026-11-22: a long
 *  name shrank to a size nobody could read, "WESTSIDE WATCH & PHONE BUYERS OF ORANGE COUNTY"). */
function setBlock(ctx, text, font, max, w, h) {
  const one = { lines: [text], size: fit(ctx, text, font, max, w, h) };
  const ws = text.split(/\s+/);
  if (ws.length < 2) return one;
  let two = null;
  for (let i = 1; i < ws.length; i++) {
    const a = ws.slice(0, i).join(" "), b = ws.slice(i).join(" ");
    const s = Math.min(fit(ctx, a, font, max, w, h / 2 / LH), fit(ctx, b, font, max, w, h / 2 / LH), h / (1 + LH));
    ctx.font = fontCss(font, s); const d = Math.abs(ctx.measureText(a).width - ctx.measureText(b).width);
    // the largest; of breaks as large, the one whose two lines are nearest a length (not "OLD COINS, /
    // SILVER DOLLARS AND COLLECTIONS")
    if (!two || s > two.size + .5 || (s > two.size - .5 && d < two.d)) two = { lines: [a, b], size: s, d };
  }
  return two.size > one.size * 1.18 ? two : one;
}
/** the baselines of a block's lines from its top: LH apart, or further where a face's ascenders and
 *  descenders (and a shadow's offset) need it, so two lines never touch (a script face on Pop did) */
function baselines(ctx, B, font, top, extra = 0) {
  ctx.font = fontCss(font, B.size);
  const ms = B.lines.map(t => ctx.measureText(t));
  const out = [top + ms[0].actualBoundingBoxAscent];
  for (let i = 1; i < ms.length; i++) out.push(out[i - 1] + Math.max(B.size * (B.lh || LH), ms[i - 1].actualBoundingBoxDescent + ms[i].actualBoundingBoxAscent + B.size * .08 + extra));
  return { ys: out, last: ms[ms.length - 1] };
}
/** a set block drawn with its top at y; returns its bottom (the last line's descenders) */
function drawBlock(ctx, out, B, font, x, y, opts = {}) {
  const { ys } = baselines(ctx, B, font, y, opts.shadow ? opts.shadow.dy : 0);
  let bottom = y;
  B.lines.forEach((t, i) => { const b = say(ctx, out, t, font, B.size, x, ys[i], opts); if (b) bottom = b.y + b.h; });
  return bottom;
}
const blockH = (ctx, B, font) => { const { ys, last } = baselines(ctx, B, font, 0); return ys[ys.length - 1] + last.actualBoundingBoxDescent; };
const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); };
function burst(ctx, cx, cy, r1, r2, n, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = rot + i * Math.PI / n, r = i % 2 ? r2 : r1; ctx[i ? "lineTo" : "moveTo"](cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
  ctx.closePath();
}
function halftone(ctx, x0, y0, w, h, color, cx, cy, reach) {
  ctx.save(); ctx.fillStyle = color;
  for (let y = y0; y < y0 + h; y += 18) for (let x = x0 + ((y / 18) % 2 ? 9 : 0); x < x0 + w; x += 18) {
    const d = Math.hypot(x - cx, y - cy) / reach, r = 7 * (1 - d);
    if (r > .6) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.restore();
}
/* ---------- the fill: a gradient or a pattern on a side's main field ----------
   (the owner, 2026-11-22: "We should have more creativity, fill pattern gradient something to give it
   some distinguishing pattern".) Every fill is drawn in two colours: the field's own, and a second tone,
   the same colour moved away from the colour of the words on it. The words never lose contrast to a
   fill: against the tone, every word on the field keeps 4.5:1, or what it had on the flat field where
   that was less, and the tone is eased off until it does. A side's other regions (a band, a panel, a
   stub) take a soft fade of their own. */
const FILLS = [
  { key: "glow", name: "Glow", hint: "A light behind what you buy", k: .38 },
  { key: "rays", name: "Rays", hint: "A sunburst from behind what you buy", k: .2 },
  { key: "fade", name: "Fade", hint: "A gradient corner to corner", k: .36 },
  { key: "rings", name: "Rings", hint: "Rings spreading out from what you buy", k: .18 },
  { key: "stripes", name: "Stripes", hint: "Diagonal stripes, tone on tone", k: .15 },
  { key: "dots", name: "Dots", hint: "A dot grid, tone on tone", k: .26 },
  { key: "grid", name: "Grid", hint: "Graph-paper lines", k: .2 },
  { key: "cash", name: "Cash", hint: "Dollar signs, tone on tone", k: .2 },
  { key: "waves", name: "Waves", hint: "Wavy lines, tone on tone", k: .2 },
  { key: "flat", name: "Flat", hint: "One flat colour", k: 0 },
];
const FILL_OF = Object.fromEntries(FILLS.map(x => [x.key, x]));
/** The fill's second tone: base moved toward white under dark words or black under light ones (or the
 *  other way, less, where the base is already at that end), as far as every word keeps its contrast.
 *  words: [[colour, the contrast it needs], ...] */
function toneOf(base, words, k) {
  if (!k) return base;
  const darkWords = words.every(([c]) => contrastOf(c, "#ffffff") > contrastOf(c, "#000000"));
  let away = darkWords ? "#ffffff" : "#000000";
  if (contrastOf(base, away) < 1.35) { away = darkWords ? "#000000" : "#ffffff"; k *= .7; }
  for (let i = 0; i < 10; i++, k *= .75) {
    const t = mix(base, away, k);
    if (words.every(([c]) => contrastOf(c, t) >= Math.min(4.5, contrastOf(c, base)))) return t;
  }
  return base;
}
/** A region in a fill: its base, and the fill's pattern or gradient in its tone. fx, fy: where the glow,
 *  rays and rings come from (behind the product or the QR). font: the face the Cash fill's signs are in. */
function field(ctx, kind, x, y, w, h, base, tone, fx, fy, font) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = base; ctx.fillRect(x, y, w, h);
  const far = Math.hypot(Math.max(fx - x, x + w - fx), Math.max(fy - y, y + h - fy));
  if (tone !== base) {
    ctx.fillStyle = tone; ctx.strokeStyle = tone;
    if (kind === "fade") {
      const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, tone); g.addColorStop(1, base); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    } else if (kind === "glow") {
      const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, Math.max(w, h) * .6); g.addColorStop(0, tone); g.addColorStop(.35, tone); g.addColorStop(1, rgba(tone, 0));
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    } else if (kind === "rays") {
      const n = 28;
      for (let i = 0; i < n; i += 2) { const a0 = i * 2 * Math.PI / n, a1 = (i + 1) * 2 * Math.PI / n; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.arc(fx, fy, far, a0, a1); ctx.closePath(); ctx.fill(); }
    } else if (kind === "rings") {
      ctx.lineWidth = 16; for (let r = 40; r < far; r += 46) { ctx.beginPath(); ctx.arc(fx, fy, r, 0, Math.PI * 2); ctx.stroke(); }
    } else if (kind === "stripes") {
      ctx.translate(x, y); ctx.rotate(-Math.PI / 4);
      const L = w + h; for (let s = -L; s < L; s += 44) ctx.fillRect(s, -L, 20, 3 * L);
    } else if (kind === "dots") {
      for (let yy = y + 14, r = 0; yy < y + h; yy += 30, r++) for (let xx = x + 14 + (r % 2) * 15; xx < x + w; xx += 30) { ctx.beginPath(); ctx.arc(xx, yy, 4.6, 0, Math.PI * 2); ctx.fill(); }
    } else if (kind === "grid") {
      ctx.lineWidth = 3; ctx.beginPath();
      for (let xx = x + 20; xx < x + w; xx += 44) { ctx.moveTo(xx, y); ctx.lineTo(xx, y + h); }
      for (let yy = y + 20; yy < y + h; yy += 44) { ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); }
      ctx.stroke();
    } else if (kind === "cash") {
      ctx.font = fontCss(font, 46); ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (let yy = y + 30, r = 0; yy < y + h + 40; yy += 74, r++) for (let xx = x + 30 + (r % 2) * 46; xx < x + w + 40; xx += 92) {
        ctx.save(); ctx.translate(xx, yy); ctx.rotate(-.26); ctx.fillText("$", 0, 0); ctx.restore();
      }
    } else if (kind === "waves") {
      ctx.lineWidth = 6; ctx.lineCap = "round";
      for (let yy = y + 18; yy < y + h + 20; yy += 38) { ctx.beginPath(); for (let xx = x - 10; xx <= x + w + 10; xx += 8) ctx.lineTo(xx, yy + Math.sin((xx - x) / 120 * Math.PI * 2) * 9); ctx.stroke(); }
    }
  }
  ctx.restore();
}
/** A side's main field in the card's ground: a fill, the photograph, or a scene with its measured scrim.
 *  Its rectangle is recorded, so the scrims can be fitted to the words that land on it. */
function mainField(ctx, f, x, y, w, h, base, words, fx, fy) {
  const kind = fillNow(), i = FIELDS.length, pic = imageGround(kind) && GROUND;
  FIELDS.push({ x, y, w, h, base, ink: words[0][0], image: !!pic });
  if (!pic) { const k = imageGround(kind) ? "glow" : kind; field(ctx, k, x, y, w, h, base, toneOf(base, words, FILL_OF[k].k), fx, fy, f.label); return; }
  if (kind === "photo") paintPhoto(ctx, GROUND, x, y, w, h);
  else paintScene(ctx, GROUND, kind.slice(6), x, y, w, h, base, words, fx, fy);
  if (SCRIMS && SCRIMS[i]) drawScrim(ctx, FIELDS[i], SCRIMS[i]);
}
/** a side's other region: a soft fade where the card has a fill, flat where it has none */
function softField(ctx, f, x, y, w, h, base, words) {
  if (fillNow() === "flat") { ctx.fillStyle = base; ctx.fillRect(x, y, w, h); return; }
  field(ctx, "fade", x, y, w, h, base, toneOf(base, words, .14), 0, 0, f.label);
}
/** Pop's halftone stays where the fill is a light or a gradient; over a pattern it would be two patterns */
const popDots = () => ["flat", "fade", "glow"].includes(fillNow());

/* ---------- the grounds beyond the fills: the line's photograph, and the video maker's painted scenes ----------
   (the owner, 2026-11-22: "same quality as the actual ads ... things like background images could be an
   option"). A photo ground is the ads' own photograph of what is bought (assets/bg, listed with each one's
   brightness in cards/photos.json: generated scenes with no text, logos or people), and it takes the
   product's place: the picture is the photograph. A scene is one the video maker paints (motion/decor.js)
   in the card's own colours, the product standing in it as in the ads. Under the words of either, a scrim
   in the field's own colour, only as strong as the pixels under each word need: the side is drawn once
   without its words, the pixels under every word read, and the scrim set so every word keeps 4.5:1 (or
   what it has on the flat field where that is less). It is solid under the words and fades out over the
   picture's side; where the words cover the field, it is an even veil. */
let PHOTOS = {};                                    // cards/photos.json: { cat: [{ f, l }] }
const NO_PHOTO_LINES = ["ipad", "mac", "macdesk"];  // the phones photographs show phones
const SCENES = {
  studio_sweep: "Studio", window_light: "Window light", tile_gloss: "Tile", paper_cut: "Paper", brushed_metal: "Brushed metal", split_soft: "Soft light",
  pastel_blobs: "Pastel", pill_stage: "Podium", podium_steps: "Steps", sky_gradient: "Sky", confetti_soft: "Confetti", glow_orbs: "Orbs",
  rays_bold: "Sunburst", sun_rays: "Sun rays", sprinkles: "Sprinkles", diagonal_lines: "Diagonals",
  velvet: "Velvet", spot_floor: "Spotlight", beams_stage: "Stage", ribbon_wave: "Ribbon", candy_fade: "Gold dust", arch_window: "Arch", carbon: "Carbon", bokeh_night: "Night lights",
  brick_night: "Brick", brick_neon_wash: "Neon brick", concrete: "Concrete",
  polka_pop: "Polka", halftone_duo: "Halftone", checker_diamond: "Checker", halftone_lines: "Print lines",
};
/* ---------- the style: an art direction, the card's choices that belong together ----------
   (the owner, 2026-11-22: "are you going professional are you going friendly? Are you going vibrant and
   attractive business card?"). New look draws a layout, a colour pair, a type pair and a ground from one
   direction's own lists, so a card has one personality, not a random mix (a comic layout in a hairline
   serif). Any draws a direction first, then a look from it. The pairs are chosen by their colours, the
   type by its character; the rest of the card's rules hold in every style. */
const STYLES = [
  { key: "pro", name: "Professional", hint: "Calm colours, clean type, room to breathe", photo: [0, 1],
    layouts: ["band", "split", "center", "ticket"],
    pairs: ["navy_gold", "white_on_navy", "white_on_blue", "black_on_white", "silver_blue", "red_white_blue", "navy_white_red", "arctic_teal", "white_on_green", "black_gold", "bone_purple", "sand_teal", "blue_green", "cream_red"],
    voices: ["bold", "grotesk", "block", "tech", "stadium", "street"],
    grounds: ["flat", "fade", "grid", "glow", "photo", "scene:studio_sweep", "scene:window_light", "scene:tile_gloss", "scene:paper_cut", "scene:brushed_metal", "scene:split_soft"] },
  { key: "friendly", name: "Friendly", hint: "Soft colours, rounded type, a warm welcome", photo: [.4, 1],
    layouts: ["center", "band", "split", "ticket"],
    pairs: ["mint_green", "sky_cobalt", "lavender_violet", "blush_magenta", "lemon_blue", "cream_red", "sand_teal", "arctic_teal", "bone_purple", "white_pink", "black_on_pink", "black_on_lilac", "silver_blue"],
    voices: ["puff", "toon", "boogie", "note", "warp", "cutout", "grotesk"],
    grounds: ["glow", "dots", "waves", "rings", "photo", "scene:pastel_blobs", "scene:pill_stage", "scene:podium_steps", "scene:sky_gradient", "scene:confetti_soft", "scene:glow_orbs"] },
  { key: "bold", name: "Bold", hint: "Saturated colour, heavy type, energy", photo: [0, 1],
    layouts: ["band", "split", "ticket", "pop"],
    pairs: ["black_on_yellow", "black_on_orange", "white_on_red", "white_on_pink", "white_on_teal", "white_on_violet", "black_on_lime", "black_on_aqua", "black_on_pink", "lemon_blue", "red_yellow", "navy_orange", "midnight_cyan", "white_on_purple"],
    voices: ["street", "stadium", "sport", "squad", "speed", "varsity", "press", "cutout", "retro"],
    grounds: ["rays", "stripes", "fade", "cash", "photo", "scene:rays_bold", "scene:sun_rays", "scene:sprinkles", "scene:diagonal_lines", "scene:glow_orbs"] },
  { key: "premium", name: "Premium", hint: "Dark grounds, gold, a serif and a fine frame", photo: [0, .4], frame: true,
    layouts: ["center", "split", "band"],
    pairs: ["black_gold", "navy_gold", "green_gold", "purple_gold", "yellow_on_black", "white_on_black", "white_on_navy", "bone_purple"],
    voices: ["luxe", "luxe", "grotesk", "block", "tech"],
    grounds: ["glow", "fade", "photo", "scene:velvet", "scene:spot_floor", "scene:beams_stage", "scene:ribbon_wave", "scene:candy_fade", "scene:arch_window", "scene:carbon", "scene:bokeh_night"] },
  { key: "street", name: "Street", hint: "Brick and neon, stencils and markers", photo: [0, .5],
    layouts: ["ticket", "band", "split", "pop"],
    pairs: ["black_pink", "black_lime", "black_cyan", "black_violet", "plum_lime", "teal_pink", "black_red", "black_green", "black_white_orange", "yellow_on_black", "white_on_black", "black_on_yellow", "midnight_cyan"],
    voices: ["stencil", "marker", "brush", "riot", "protest", "barrio", "arcade", "pixel", "tall", "squad", "retro"],
    grounds: ["stripes", "grid", "cash", "photo", "scene:brick_night", "scene:brick_neon_wash", "scene:concrete", "scene:carbon", "scene:diagonal_lines"] },
  { key: "comic", name: "Comic", hint: "Halftone, bursts and speech balloons", photo: [0, 1],
    layouts: ["pop"],
    pairs: ["black_on_yellow", "black_on_lime", "black_on_aqua", "black_on_pink", "black_on_lilac", "white_on_red", "white_on_pink", "white_on_violet", "lemon_blue", "sand_teal", "cream_red", "bone_purple", "black_on_orange"],
    voices: ["pop", "boogie", "toon", "retro", "cutout", "puff", "warp", "riot"],
    grounds: ["rays", "dots", "flat", "scene:polka_pop", "scene:halftone_duo", "scene:checker_diamond", "scene:rays_bold", "scene:halftone_lines"] },
];
const STYLE_OF = Object.fromEntries(STYLES.map(s => [s.key, s]));
const ANY_SCENES = ["scene:velvet", "scene:spot_floor", "scene:studio_sweep", "scene:window_light", "scene:pastel_blobs", "scene:rays_bold", "scene:brick_night", "scene:bokeh_night"];

function photoList() {
  const L = lineNow(); if (NO_PHOTO_LINES.includes(L.key)) return [];
  const all = PHOTOS[L.cat] || [], S = STYLE_OF[state.look], [lo, hi] = (S && S.photo) || [0, 1], fit = all.filter(p => p.l >= lo && p.l <= hi);
  return fit.length >= 3 ? fit : all;
}
const photoOk = () => photoList().length > 0;
function photoFile() { const L = photoList(); return L.length ? L[Math.abs(state.seed | 0) % L.length].f : null; }
/** the card's ground: a fill, "photo" (where the line has photographs) or "scene:<kind>" */
function fillNow() {
  const k = state.fill;
  if (state.layout === "logo" && (k === "photo" || /^scene:/.test(k))) return "glow";   // a logo stands on its own ground, never on a picture
  if (FILL_OF[k]) return k;
  if (k === "photo") return photoOk() ? k : "glow";
  if (/^scene:/.test(k) && SCENES[k.slice(6)]) return k;
  return "glow";
}
const imageGround = k => k === "photo" || /^scene:/.test(k);
const groundName = k => FILL_OF[k] ? FILL_OF[k].name : k === "photo" ? "Photo" : SCENES[k.slice(6)] || k;
/** the grounds the picker shows: the fills, the line's photograph, and the style's scenes */
function groundsShown() {
  const S = STYLE_OF[state.style] || STYLE_OF[state.look];
  const keys = [...FILLS.map(x => x.key), ...(photoOk() ? ["photo"] : []), ...(S ? S.grounds : ANY_SCENES).filter(k => /^scene:/.test(k))];
  if (!keys.includes(fillNow())) keys.push(fillNow());
  return [...new Set(keys)].map(k => ({ key: k, name: groundName(k), hint: FILL_OF[k] ? FILL_OF[k].hint : k === "photo" ? "A photograph of what you buy" : "A painted scene, as in the ads" }));
}

/* what one drawing of a side is working with (render sets these and clears them) */
let FIELDS = [], SCRIMS = null, GROUND = null, PHOTO_ON = false, CUR_P = null, FRAME_DUE = false;
const grounds = {};
async function loadGround(kind) {
  if (kind === "photo") {
    const f = photoFile(); if (!f) return null;
    return grounds[f] || (grounds[f] = new Promise(res => { const im = new Image(); im.decoding = "async"; im.onload = () => res(im); im.onerror = () => res(null); im.src = new URL("../assets/bg/" + f + ".jpg", import.meta.url).href; }));
  }
  if (/^scene:/.test(kind)) return grounds.decor || (grounds.decor = import("../motion/decor.js").catch(() => null));
  return null;
}
function paintPhoto(ctx, im, x, y, w, h) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const k = Math.max(w / im.naturalWidth, h / im.naturalHeight), iw = im.naturalWidth * k, ih = im.naturalHeight * k;
  ctx.drawImage(im, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  ctx.restore();
}
/** one of the video maker's scenes, painted into a field in the card's colours (as motion/photo-grounds.js does for the image ads) */
function paintScene(ctx, D, kind, x, y, w, h, base, words, fx, fy) {
  const tone = toneOf(base, words, .3), light = tone !== base ? tone : mix(base, lum(base) < .5 ? "#ffffff" : "#000000", .2);
  const p = { ground: base, light, ink: words[0][0], accent: CUR_P.accent, plate: CUR_P.plate, plate_ink: CUR_P.plateInk, sun: CUR_P.accent };
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.translate(x, y);
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
  const seed = (state.seed | 0) * 31 + 7, R = rng(seed), st = { seed, decor: [], score: "" }, sc = [fx - x, fy - y];
  try { D.withoutPalms(() => D.freshGround(kind, ctx, st, p, w, h, sc, R) || D.candidateGround(kind, ctx, st, p, w, h, sc, R) || D.themeGround(kind, ctx, st, p, w, h, sc, R) || D.vibeBackground(kind, ctx, st, p, w, h, sc, R)); }
  catch (e) { /* the field's own colour stands */ }
  ctx.restore();
}
function drawScrim(ctx, F, s) {
  if (!s || !(s.a > 0)) return;
  ctx.save(); ctx.beginPath(); ctx.rect(F.x, F.y, F.w, F.h); ctx.clip();
  if (s.mode === "veil") ctx.fillStyle = rgba(F.base, s.a);
  else { const g = ctx.createLinearGradient(...s.line); g.addColorStop(0, rgba(F.base, s.a)); g.addColorStop(s.solid, rgba(F.base, s.a)); g.addColorStop(1, rgba(F.base, 0)); ctx.fillStyle = g; }
  ctx.fillRect(F.x, F.y, F.w, F.h);
  ctx.restore();
}
/** The scrims for a side's picture fields, from a drawing of it without its words (probe, at scale s) */
function scrimsFor(probe, s) {
  const c = probe.canvas, D = c.getContext("2d").getImageData(0, 0, c.width, c.height).data, out = [];
  const lin = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }, Lrgb = (r, g, b) => .2126 * lin(r) + .7152 * lin(g) + .0722 * lin(b);
  const rgbOf = h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16));
  probe.fields.forEach((F, i) => {
    if (!F.image) return;
    const ws = probe.boxes.filter(b => b.text && /^#[0-9a-f]{6}$/i.test(b.color || "") && b.x + b.w / 2 >= F.x && b.x + b.w / 2 <= F.x + F.w && b.y + b.h / 2 >= F.y && b.y + b.h / 2 <= F.y + F.h);
    if (!ws.length) return;   // a picture with no words on it stands as it is
    const pad = 28, T = { l: Math.min(...ws.map(b => b.x)) - pad, t: Math.min(...ws.map(b => b.y)) - pad, r: Math.max(...ws.map(b => b.x + b.w)) + pad, b: Math.max(...ws.map(b => b.y + b.h)) + pad };
    const free = { right: (F.x + F.w - T.r) / F.w, left: (T.l - F.x) / F.w, bottom: (F.y + F.h - T.b) / F.h, top: (T.t - F.y) / F.h };
    const side = Object.keys(free).reduce((a, k) => free[k] > free[a] ? k : a, "right"), photo = fillNow() === "photo";
    let geo;
    if (free[side] < .22) geo = { mode: "veil", a: photo ? .55 : 0 };
    else {
      const fade = Math.min(300, free[side] * (side === "right" || side === "left" ? F.w : F.h) * .85);
      const line = side === "right" ? [F.x, 0, T.r + fade, 0] : side === "left" ? [F.x + F.w, 0, T.l - fade, 0] : side === "bottom" ? [0, F.y, 0, T.b + fade] : [0, F.y + F.h, 0, T.t - fade];
      const len = Math.hypot(line[2] - line[0], line[3] - line[1]);
      geo = { mode: "side", line, solid: Math.max(0, (len - fade) / len), a: photo ? .5 : 0 };
    }
    const [br, bgr, bb] = rgbOf(F.base);
    for (const w of ws) {
      // the contrast it needs, with a margin for the print file's finer pixels (drawn at twice this size)
      const flat = contrastOf(w.color, F.base), need = flat >= 4.7 ? 4.7 : flat - .02, Lc = Lrgb(...rgbOf(w.color)), px = [];
      for (let y = Math.max(0, Math.floor(w.y * s)); y < Math.min(c.height, Math.ceil((w.y + w.h) * s)); y += 2)
        for (let x = Math.max(0, Math.floor(w.x * s)); x < Math.min(c.width, Math.ceil((w.x + w.w) * s)); x += 2) { const o = (y * c.width + x) * 4; px.push(D[o], D[o + 1], D[o + 2]); }
      // at most one pixel in twenty under the word below what it needs (the 5th percentile), counted, not sorted
      const ok = al => {
        let low = 0; const n = px.length / 3, most = n * .05;
        for (let k = 0; k < px.length; k += 3) {
          const L = Lrgb(px[k] + (br - px[k]) * al, px[k + 1] + (bgr - px[k + 1]) * al, px[k + 2] + (bb - px[k + 2]) * al);
          if ((Math.max(L, Lc) + .05) / (Math.min(L, Lc) + .05) < need && ++low > most) return false;
        }
        return true;
      };
      while (geo.a < 1 && !ok(geo.a)) geo.a = Math.min(1, geo.a + .05);
    }
    out[i] = geo;
  });
  return out;
}
/** Premium's frame: two hairlines in the accent between the trim and the safe area, drawn before the first word or picture so a product may stand over it */
function frameNow(ctx) {
  if (!FRAME_DUE) return; FRAME_DUE = false;
  // in the accent, or in the words' colour where the accent is the field's own (a gold back in gold)
  const F = FIELDS[0], col = !F || contrastOf(CUR_P.accent, F.base) >= 2 ? CUR_P.accent : F.ink;
  ctx.save(); ctx.strokeStyle = col;
  ctx.lineWidth = 3; rr(ctx, BLEED + 18, BLEED + 18, TRIM.w - 36, TRIM.h - 36, 8); ctx.stroke();
  ctx.lineWidth = 1.2; rr(ctx, BLEED + 27, BLEED + 27, TRIM.w - 54, TRIM.h - 54, 5); ctx.stroke();
  ctx.restore();
}
/** New look: a layout, a pair, type and a ground from one style's lists (Any: a style drawn first) */
function newLook() {
  if (state.mode === "brand") {
    // the next layout and background in the kit's own order
    const c = brandChoice(), i = CARD_LOOKS.findIndex(([l, g]) => l === c.layout && g === c.ground), [layout, ground] = CARD_LOOKS[(i + 1) % CARD_LOOKS.length];
    setBrandChoice({ layout, ground }); drawControls(); later(0); return;
  }
  state.seed = (state.seed | 0) + 1;
  const R = rng(state.seed * 104729), pick = a => a[Math.floor(R() * a.length)];
  const S = STYLE_OF[state.style] || pick(STYLES);
  state.look = S.key; state.frame = !!S.frame;
  state.layout = pick(S.layouts);
  const pairs = S.pairs.map(k => PAIR_OF[k]).filter(Boolean), suits = pairs.filter(p => (p.suits || []).includes(lineNow().cat));
  state.pair = pick(suits.length >= 3 && R() < .5 ? suits : pairs).key;
  state.voice = pick(S.voices.filter(v => VOICES.includes(v)));
  // a photograph where it can be seen: Centred's words cover the card, so its scrim would hide the picture
  state.fill = S.grounds.includes("photo") && photoOk() && state.layout !== "center" && R() < .3 ? "photo" : pick(S.grounds.filter(g => g !== "photo"));
  keep(); drawControls(); later(0);
}

/** The product the line buys, the full ad's own cutout (motion/subjects.json sets), fitted whole into
 *  x, y, w, h: a soft shadow under it, or a comic's hard one. Its box is recorded; it stays in the trim. */
function product(ctx, out, img, x, y, w, h, { align = "center", valign = "bottom", hard = null } = {}) {
  frameNow(ctx);
  if (PHOTO_ON || !img || w < 60 || h < 60) return null;   // on a photo ground the photograph is the picture
  const k = Math.min(w / img.naturalWidth, h / img.naturalHeight), iw = img.naturalWidth * k, ih = img.naturalHeight * k;
  const ix = align === "left" ? x : align === "right" ? x + w - iw : x + (w - iw) / 2, iy = valign === "top" ? y : valign === "center" ? y + (h - ih) / 2 : y + h - ih;
  ctx.save();
  if (hard) { ctx.shadowColor = hard; ctx.shadowOffsetX = 10; ctx.shadowOffsetY = 10; ctx.shadowBlur = 0; }
  else { ctx.shadowColor = "rgba(0,0,0,.38)"; ctx.shadowOffsetY = 14; ctx.shadowBlur = 26; }
  ctx.drawImage(img, ix, iy, iw, ih);
  ctx.restore();
  const b = { role: "product", text: "", x: ix, y: iy, w: iw, h: ih };
  out.push(b);
  return b;
}
/** The number's face. A card is read for its number: a script, a pixel face or a pair the full ad
 *  already sets its number apart for (numberRead) gives it a plain heavy face (the audit: "(562)
 *  999-4994" in Silkscreen and Caveat Brush read as a pattern, not a number). */
function numFontOf(f) {
  const kind = (FONTS[f.display] || [])[3];
  return f.numberRead || kind === "script" || kind === "mono" ? "franklin" : f.display;
}
/** The name, in the pair's display face; a long one in a wide or decorative face that would set below a
 *  size a card is read at goes into the pair's reading face, heavy, instead (the audit: a long name in
 *  Silkscreen set at 40 px across a card) */
function nameBlock(ctx, name, f, max, w, h, least = 52) {
  const B = setBlock(ctx, name, f.display, max, w, h), kind = kindOf(f.display);
  if (kind === "mono") least = Math.max(least, 80);   // a pixel face reads as words only large (the polish: "WE BUY APPLE WATCH" in Silkscreen)
  if (B.size >= least || !["mono", "script", "display", "wide"].includes(kind)) return { B, font: f.display };
  const B2 = setBlock(ctx, name, f.label, max, w, h);
  return kind === "mono" || B2.size > B.size * 1.15 ? { B: B2, font: f.label } : { B, font: f.display };
}
const kindOf = font => (FONTS[font] || [])[3];
/** Pop's offset shadow only under a face with the weight to carry it: a high-contrast serif, a script or a
 *  pixel face goes muddy under one (the audit: Gloock's hairlines doubled into a blur) */
const shadowOk = font => !["serif", "script", "mono"].includes(kindOf(font));
const onColour = c => contrastOf("#ffffff", c) > contrastOf("#111111", c) ? "#ffffff" : "#111111";
/** the accent on another ground: the card's own ground where it stands out, else the accent, else the ink */
const accentOn = (P, bg, ink) => contrastOf(P.ground, bg) >= 3 ? P.ground : contrastOf(P.accent, bg) >= 3 ? P.accent : ink;

/** The front, one of the five layouts. Everything a reader needs stays in SAFE; grounds, bands and
 *  panels run to the bleed; the product stays in the trim. */
function front(ctx, P, W, f, d, out, img) {
  const S = SAFE, R = rng(state.seed * 7919 + 13), disp = f.display, lab = f.label, num = numFontOf(f);
  const G = [[P.ink, 4.5], [P.accent, 3]], PL = [[P.plateInk, 4.5]];   // the words on the ground, and on the plate
  ctx.fillStyle = P.ground; ctx.fillRect(0, 0, SHEET.w, SHEET.h);
  if (d === "logo") { frontLogo(ctx, P, W, f, out); return; }
  if (d === "band") {
    const bandTop = S.y + S.h - 170, colW = img ? S.w * .6 : S.w;
    mainField(ctx, f, 0, 0, SHEET.w, bandTop - 10, P.ground, G, S.x + colW + 24 + (S.w - colW - 24) / 2, (S.y + bandTop) / 2);
    softField(ctx, f, 0, bandTop, SHEET.w, SHEET.h - bandTop, P.plate, PL);
    ctx.fillStyle = P.accent; ctx.fillRect(0, bandTop - 10, SHEET.w, 10);
    const { B: NB, font: nf } = nameBlock(ctx, W.name, f, 112, colW, 196);
    const nb = drawBlock(ctx, out, NB, nf, S.x, S.y, { fill: P.ink, role: "name" });
    const bs = fit(ctx, W.buy, lab, 46, colW);
    say(ctx, out, W.buy, lab, bs, S.x, nb + 20 + bs * .74, { fill: P.accent, role: "buy" });
    if (W.where) sayTowns(ctx, out, W.where, lab, S.x, bandTop - 30, colW, { fill: P.ink, max: 32 });
    // the product stands on the band, its foot just over the edge
    product(ctx, out, img, S.x + colW + 24, S.y - 18, S.x + S.w - (S.x + colW + 24) + BLEED * .6, bandTop + 34 - (S.y - 18), { align: "center" });
    // the website beside the number where it fits there at 7 pt, else under it across the band; the
    // number has the rest
    let ss = 0, sw = 0;
    if (W.site) { ss = fitS(ctx, W.site, lab, S.w * .46); ctx.font = fontCss(lab, ss); sw = ctx.measureText(W.site).width; }
    if (W.site && ss < FLOOR) {
      const sb = say(ctx, out, W.site, lab, fitS(ctx, W.site, lab, S.w), S.x, S.y + S.h - 4, { foot: true, fill: P.plateInk, role: "site" });
      say(ctx, out, W.phone, num, fit(ctx, W.phone, num, 104, S.w, sb.y - 12 - (bandTop + 40)), S.x, sb.y - 12, { foot: true, fill: P.plateInk, role: "phone" });
    } else {
      const ps = fit(ctx, W.phone, num, 112, S.w - (sw ? sw + 44 : 0), 118);
      say(ctx, out, W.phone, num, ps, S.x, S.y + S.h - 22, { foot: true, fill: P.plateInk, role: "phone" });
      if (W.site) say(ctx, out, W.site, lab, ss, S.x + S.w, S.y + S.h - 30, { foot: true, align: "right", fill: P.plateInk, role: "site" });
    }
  } else if (d === "split") {
    const panelW = S.x + S.w * .38 + 30, px = S.x, pw = S.w * .38 - 24;
    mainField(ctx, f, 0, 0, panelW, SHEET.h, P.plate, PL, panelW / 2, SHEET.h * .68);
    softField(ctx, f, panelW, 0, SHEET.w - panelW, SHEET.h, P.ground, G);
    // "WE BUY" over what is bought: the panel reads as one claim; the product under it
    const rows = W.buy.split(/\s+/), first = rows.length > 2 ? rows.slice(0, 2).join(" ") : rows[0], rest = rows.slice(rows.length > 2 ? 2 : 1).join(" ");
    const s1 = fit(ctx, first, disp, 104, pw, 104), RB = rest ? setBlock(ctx, rest, disp, 104, pw, img ? 150 : 230) : null;
    const h = s1 * .78 + 14 + (RB ? blockH(ctx, RB, disp) : 0);
    const top = img ? S.y + 4 : S.y + (S.h - h) / 2;
    // set from its measured top: a tall face's capitals (Oswald's) rose over the safe line when placed by a fixed share of the size
    const b1 = drawBlock(ctx, out, { lines: [first], size: s1 }, disp, px, top, { fill: P.plateInk, role: "buy" });
    const rb = RB ? drawBlock(ctx, out, RB, disp, px, b1 + 14, { fill: P.plateInk, role: "buy" }) : b1;
    product(ctx, out, img, S.x - 12, rb + 24, panelW - 24 - (S.x - 12), S.y + S.h + BLEED * .7 - (rb + 24), { align: "center" });
    const rx = panelW + 40, rw = S.x + S.w - rx;
    const { B: NB, font: nf } = nameBlock(ctx, W.name, f, 116, rw, 176);   // a short name set large, not lost at the top
    const nb = drawBlock(ctx, out, NB, nf, rx, S.y, { fill: P.ink, role: "name" });
    ctx.fillStyle = P.accent; ctx.fillRect(rx, nb + 20, 90, 8);
    if (W.models) drawBlock(ctx, out, smallBlock(ctx, W.models, lab, rw), lab, rx, nb + 46, { fill: P.ink, role: "models" });
    const ps = fit(ctx, W.phone, num, 96, rw, 104);
    const wb = W.where ? sayTowns(ctx, out, W.where, lab, rx, S.y + S.h, rw, { fill: P.ink }) : null;
    const sb = W.site ? say(ctx, out, W.site, lab, fitS(ctx, W.site, lab, rw), rx, (wb ? wb.y - 14 : S.y + S.h), { foot: true, fill: P.ink, role: "site" }) : null;
    const pb = say(ctx, out, W.phone, num, ps, rx, (sb ? sb.y : wb ? wb.y : S.y + S.h) - 16, { foot: true, fill: P.accent, role: "phone" });
    say(ctx, out, "CALL OR TEXT", lab, fitS(ctx, "CALL OR TEXT", lab, rw, 30), rx, pb.y - 14, { foot: true, fill: P.ink, role: "label" });
  } else if (d === "center") {
    const cx = S.x + S.w / 2;
    mainField(ctx, f, 0, 0, SHEET.w, SHEET.h, P.ground, G, SHEET.w / 2, SHEET.h / 2);
    const bs = fit(ctx, W.buy, lab, 34, S.w * .7);
    ctx.font = fontCss(lab, bs); const bw = ctx.measureText(W.buy).width + 52, bh = bs + 30;
    ctx.fillStyle = P.accent; rr(ctx, cx - bw / 2, S.y + 4, bw, bh, bh / 2); ctx.fill();
    say(ctx, out, W.buy, lab, bs, cx, S.y + 4 + bh / 2 + bs * .36, { align: "center", fill: onColour(P.accent), role: "buy" });
    // the number and the line under it from the foot; the name, a rule and the models line centred between
    // the website and the towns on one line at 7 pt and more, or on two (the website last) when they will not
    const footT = [W.site, W.where].filter(Boolean).join("   •   ");
    let fb = null;
    if (footT) {
      const one = fitS(ctx, footT, lab, S.w, 30);
      if (one >= FLOOR || !(W.site && W.where)) fb = say(ctx, out, footT, lab, one, cx, S.y + S.h, { foot: true, align: "center", fill: P.ink, role: "foot" });
      else {
        const sb = say(ctx, out, W.site, lab, fitS(ctx, W.site, lab, S.w, 30), cx, S.y + S.h, { foot: true, align: "center", fill: P.ink, role: "site" });
        fb = sayTowns(ctx, out, W.where, lab, cx, sb.y - 12, S.w, { align: "center", fill: P.ink });
      }
    }
    const ps = fit(ctx, W.phone, num, 104, S.w * .9, 110);
    const pb = say(ctx, out, W.phone, num, ps, cx, (fb ? fb.y - 22 : S.y + S.h), { foot: true, align: "center", fill: P.accent, role: "phone" });
    const top = S.y + bh + 30, room = pb.y - 30 - top;
    const { B: NB, font: nf } = nameBlock(ctx, W.name, f, 108, S.w, Math.min(210, room - (W.models ? 80 : 40)));
    const ms = W.models ? fitS(ctx, W.models, lab, S.w * .9, 30) : 0;
    const gh = blockH(ctx, NB, nf) + 34 + 6 + (ms ? 22 + ms : 0), y0 = top + Math.max(0, (room - gh) / 2);
    const nb = drawBlock(ctx, out, NB, nf, cx, y0, { align: "center", fill: P.ink, role: "name" });
    // a divider well clear of the name, so it never reads as one word underlined
    ctx.fillStyle = P.accent; ctx.fillRect(cx - 70, nb + 34, 140, 6);
    if (ms) say(ctx, out, W.models, lab, ms, cx, nb + 34 + 6 + 22 + ms * .76, { align: "center", fill: P.ink, role: "models" });
  } else if (d === "pop") {
    const line = P.dark ? "#ffffff" : "#111111";
    mainField(ctx, f, 0, 0, SHEET.w, SHEET.h, P.ground, G, S.x + S.w - 112, S.y + 100);   // rays and rings from the burst
    if (popDots()) halftone(ctx, 0, 0, SHEET.w, SHEET.h, toneOf(P.ground, G, .2), SHEET.w * .86, SHEET.h * .2, SHEET.w * .7);   // dots in a tone the words keep their contrast on
    ctx.lineWidth = 10; ctx.strokeStyle = line; rr(ctx, S.x - 14, S.y - 14, S.w + 28, S.h + 28, 18); ctx.stroke();
    const colW = img ? S.w * .6 : S.w - 250;
    // the product, under the burst, with a comic's hard shadow
    product(ctx, out, img, S.x + colW + 10, S.y + 150, S.w - colW - 18, S.h - 158, { align: "center", hard: rgba("#000000", .85) });
    const bx = S.x + S.w - 112, by = S.y + 100;
    ctx.fillStyle = P.accent; burst(ctx, bx, by, 104, 74, 14, R() * .5); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = line; ctx.stroke();
    const bw = "CASH!", bfs = fit(ctx, bw, disp, 52, 120);
    say(ctx, out, bw, disp, bfs, bx, by + bfs * .36, { align: "center", fill: onColour(P.accent), role: "burst" });
    // the name with an offset shadow in the accent, as a print in two inks (black where the accent will not show)
    const { B: NB, font: nf } = nameBlock(ctx, W.name, f, 100, colW - 16, 196);
    const shade = P.accent !== P.ink && contrastOf(P.accent, P.ground) >= 1.6 ? P.accent : rgba("#000000", .8), off = Math.max(3, NB.size * .055);
    const nb = drawBlock(ctx, out, NB, nf, S.x + 8, S.y + 8, { fill: P.ink, role: "name", shadow: shadowOk(nf) ? { color: shade, dx: off, dy: off } : null });
    const bs = fit(ctx, W.buy, disp, 56, colW - 16);
    say(ctx, out, W.buy, disp, bs, S.x + 8, nb + 16 + bs * .76, { fill: shade === P.accent ? P.ink : P.accent, role: "buy" });
    const ps = fit(ctx, W.phone, num, 88, colW - 60, 96);
    ctx.font = fontCss(num, ps); const pw = ctx.measureText(W.phone).width + 44, ph = ps + 34, py = S.y + S.h - ph - 6;
    ctx.fillStyle = P.plate; rr(ctx, S.x + 8, py, pw, ph, 14); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = line; ctx.stroke();
    say(ctx, out, W.phone, num, ps, S.x + 30, py + ph / 2 + ps * .36, { fill: P.plateInk, role: "phone" });
    let fy = py - 18;
    if (W.where) fy = sayTowns(ctx, out, W.where, lab, S.x + 8, fy, colW - 16, { fill: P.ink }).y - 10;
    if (W.site) say(ctx, out, W.site, lab, fitS(ctx, W.site, lab, colW - 16, 30), S.x + 8, fy, { foot: true, fill: P.ink, role: "site" });
  } else {   // ticket
    /* The ticket: its main part carries what is bought, the name, and the number on one line between two
       rules, like a ticket's printed field; the stub, torn off along the dashes, carries the product. (The
       owner, 2026-11-22: "the phone numbers on 2 lines does not look good"; the stub had set it in two.) */
    const tearX = S.x + S.w * .62, LI = [[P.ink, 4.5]];
    if (fillNow() === "photo") { softField(ctx, f, 0, 0, tearX, SHEET.h, P.ground, G); mainField(ctx, f, tearX, 0, SHEET.w - tearX, SHEET.h, P.light, LI, (tearX + SHEET.w) / 2, SHEET.h / 2); }   // the photograph on the stub
    else { mainField(ctx, f, 0, 0, tearX, SHEET.h, P.ground, G, tearX, SHEET.h / 2); softField(ctx, f, tearX, 0, SHEET.w - tearX, SHEET.h, P.light, LI); }
    ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.setLineDash([16, 14]);
    ctx.beginPath(); ctx.moveTo(tearX, 0); ctx.lineTo(tearX, SHEET.h); ctx.stroke(); ctx.setLineDash([]);
    ctx.save(); ctx.beginPath(); ctx.rect(tearX, 0, SHEET.w - tearX, SHEET.h); ctx.clip();   // the notches bite the stub only
    ctx.fillStyle = P.ground; [S.y - BLEED, S.y + S.h + BLEED].forEach(y => { ctx.beginPath(); ctx.arc(tearX, y, 34, 0, Math.PI * 2); ctx.fill(); });
    ctx.restore();
    const lw = tearX - S.x - 40;
    const bs = fit(ctx, W.buy, lab, 34, lw);
    const b0 = drawBlock(ctx, out, { lines: [W.buy], size: bs }, lab, S.x, S.y, { fill: P.accent, role: "buy" });   // from its measured top: the É of POKÉMON rose over the safe line
    // the foot: the website, the towns over it
    let lf = S.y + S.h;
    if (W.site) lf = say(ctx, out, W.site, lab, fitS(ctx, W.site, lab, lw, 30), S.x, lf, { foot: true, fill: P.ink, role: "site" }).y - 12;
    if (W.where) lf = sayTowns(ctx, out, W.where, lab, S.x, lf, lw, { fill: P.ink }).y;
    // the number's field: a rule, CALL OR TEXT, the number on one line, a rule
    const ruleB = lf - 24;
    ctx.fillStyle = P.accent; ctx.fillRect(S.x, ruleB, lw, 4);
    const ps = fit(ctx, W.phone, num, 96, lw, 100);
    const pb = say(ctx, out, W.phone, num, ps, S.x, ruleB - 16, { foot: true, fill: P.accent, role: "phone" });
    const lb = say(ctx, out, "CALL OR TEXT", lab, fitS(ctx, "CALL OR TEXT", lab, lw, 30), S.x, pb.y - 16, { foot: true, fill: P.ink, role: "label" });
    ctx.fillStyle = P.accent; ctx.fillRect(S.x, lb.y - 20, lw, 4);
    // the name, under what is bought, in the room above the field
    const { B: NB, font: nf } = nameBlock(ctx, W.name, f, 104, lw, Math.max(60, Math.min(210, lb.y - 20 - 22 - (b0 + 22))));
    drawBlock(ctx, out, NB, nf, S.x, b0 + 22, { fill: P.ink, role: "name" });
    // the stub: the product, whole
    product(ctx, out, img, tearX + 30, S.y - 10, BLEED + TRIM.w - 6 - (tearX + 30), S.h + 20, { align: "center", valign: "center" });
  }
}

/* ---------- the logo (DESIGN-LAW 176): the brand kit's logo, on the front, in the card's own colours ---------- */
/** the logo the customer picked in the logo maker (logo/logo.js keeps it), or null */
const kitNow = () => { const k = jget("pgfx_logo_kit", null); return k && k.design && k.design.t ? k.design : null; };
const logos = {};
let LOGO_NOW = null;
/** The kit's logo as a picture, drawn by the logo engine in this card's pair, so it always matches the
 *  card: the engine and its faces are loaded only when a card wears a logo. */
function logoImage() {
  const d = kitNow(); if (!d) return Promise.resolve(null);
  const design = { ...d, pair: pairNow().key }, key = JSON.stringify(design);
  return logos[key] || (logos[key] = (async () => {
    const E = await import("../logo/engine.js"), faces = {};
    for (const f of E.facesOf(design)) faces[f] = (await import(`../logo/glyphs/${f}.js`)).default;
    const r = E.logoSvg(design, faces, { bg: false, pad: 0 });
    const url = URL.createObjectURL(new Blob([r.svg], { type: "image/svg+xml" }));
    const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    return { im, w: r.w, h: r.h, url };
  })().catch(e => { console.warn("card logo:", e); delete logos[key]; return null; }));
}
/** The Logo front: the logo large in the safe area on the card's field, the website (or the towns) at its
 *  foot. The details are on the back (Split's). Without a logo it sets the name as Centred would. */
function frontLogo(ctx, P, W, f, out) {
  const S = SAFE, lab = f.label, cx = S.x + S.w / 2;
  mainField(ctx, f, 0, 0, SHEET.w, SHEET.h, P.ground, [[P.ink, 4.5], [P.accent, 3]], SHEET.w / 2, SHEET.h / 2);
  frameNow(ctx);
  const footT = W.site || W.where;
  let bottom = S.y + S.h;
  if (footT) bottom = say(ctx, out, footT, lab, fitS(ctx, footT, lab, S.w * .9, 30), cx, bottom, { foot: true, align: "center", fill: P.ink, role: W.site ? "site" : "where" }).y - 30;
  const L = LOGO_NOW;
  if (L) {
    const k = Math.min(S.w * .88 / L.w, (bottom - S.y - 6) / L.h), w = L.w * k, h = L.h * k, x = cx - w / 2, y = S.y + (bottom - S.y - h) / 2;
    ctx.drawImage(L.im, x, y, w, h);
    out.push({ role: "logo", text: "", x, y, w, h });
  } else {
    const { B: NB, font: nf } = nameBlock(ctx, W.name, f, 120, S.w * .9, Math.min(240, bottom - S.y - 60));
    drawBlock(ctx, out, NB, nf, cx, S.y + Math.max(0, (bottom - S.y - blockH(ctx, NB, nf)) / 2), { align: "center", fill: P.ink, role: "name" });
  }
}

/* ---------- the backs: one for each layout, so a card turned over is the same design's other half ----------
   (the polish, 2026-11-22: every layout had worn one back, re-coloured, a headline, ticks and a QR) */

/** a selling point's tick: a disc in the accent, the check cut in the ground's colour */
function tick(ctx, out, x, by, ps, acc, bg) {
  ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(x + ps * .32, by - ps * .34, ps * .32, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = bg; ctx.lineWidth = Math.max(3, ps * .1); ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(x + ps * .17, by - ps * .34); ctx.lineTo(x + ps * .28, by - ps * .22); ctx.lineTo(x + ps * .48, by - ps * .48); ctx.stroke();
  out.push({ role: "tick", text: "", x, y: by - ps * .66, w: ps * .64, h: ps * .64 });
}
/** The QR on a white tile, s across (a phone reads it on any ground): a hard comic shadow and an outline
 *  when asked. The tile is recorded; nothing is ever drawn over it. */
function qrTile(ctx, out, qr, x, y, s, { stroke = null, hard = null } = {}) {
  frameNow(ctx);
  if (hard) { ctx.fillStyle = hard; rr(ctx, x + 12, y + 12, s, s, 18); ctx.fill(); }
  ctx.fillStyle = "#ffffff"; rr(ctx, x, y, s, s, 18); ctx.fill();
  if (stroke) { ctx.lineWidth = 6; ctx.strokeStyle = stroke; ctx.stroke(); }
  const pad = Math.round(s * .045);
  ctx.imageSmoothingEnabled = false; ctx.drawImage(qr, x + pad, y + pad, s - 2 * pad, s - 2 * pad); ctx.imageSmoothingEnabled = true;
  out.push({ role: "qr", text: "", x, y, w: s, h: s });
}
const scanWords = W => W.site ? "SCAN TO VISIT" : "SCAN TO CALL";
/** the QR and its few words under it, centred in a column x..x+w, top..bottom */
function qrWithWords(ctx, out, qr, W, lab, x, w, top, bottom, ink, max = 300) {
  const t = scanWords(W), ls = fitS(ctx, t, lab, w, 30), qs = Math.min(max, w, bottom - top - ls - 22);
  const y = top + (bottom - top - (qs + 20 + ls)) / 2;
  qrTile(ctx, out, qr, x + (w - qs) / 2, y, qs);
  say(ctx, out, t, lab, ls, x + w / 2, y + qs + 20 + ls * .74, { align: "center", fill: ink, role: "label" });
}

/** The back's words down a column, x to x + w, top to bottom: what is bought (the pair's display face),
 *  the models line, the selling points with ticks, and at the foot the number (large where no QR stands
 *  beside it) over the website. What will not fit at 7 pt gives way first: the models line, then a
 *  fourth point. o: { ink, acc, bg, head: false to leave the headline out, contact: false to leave the
 *  number and website to the layout, big } */
function column(ctx, out, W, f, x, top, w, bottom, o) {
  const lab = f.label, num = numFontOf(f);
  let foot = bottom;
  if (o.contact !== false) {
    if (W.site) foot = say(ctx, out, W.site, lab, fitS(ctx, W.site, lab, w), x, foot, { foot: true, fill: o.ink, role: "site" }).y - 12;
    const ps = fit(ctx, W.phone, num, o.big ? 88 : 56, w, o.big ? 96 : 62, 30);
    foot = say(ctx, out, W.phone, num, ps, x, foot, { foot: true, fill: o.big ? o.acc : o.ink, role: "contact" }).y - (o.big ? 30 : 24);
  }
  let y = top;
  if (o.head !== false) { const H = nameBlock(ctx, W.buy, f, o.headMax || 80, w, 150, 60); y = drawBlock(ctx, out, H.B, H.font, x, y, { fill: o.acc, role: "buy" }) + 16; }
  const MB = W.models ? smallBlock(ctx, W.models, lab, w) : null;
  const plan = (withModels, n) => {
    const pts = W.points.slice(0, n), my = withModels && MB ? blockH(ctx, MB, lab) + 22 : 0, room = foot - y - my;
    const ps = Math.min(44, ...pts.map(t => fit(ctx, t, lab, 44, w - 40)), (room + 14) / (n * 1.5));
    return { pts, withModels: withModels && !!MB, ps, room };
  };
  const n = W.points.length, tries = [plan(true, n), plan(false, n), plan(false, Math.min(n, 3))];
  const P = tries.find(t => t.ps >= 30) || tries[2];
  if (P.withModels) y = drawBlock(ctx, out, MB, lab, x, y, { fill: o.ink, role: "models" }) + 22;
  // the rows a little apart where there is room, the block kept up by what it lists
  const pitch = Math.min(P.ps * 1.75, (foot - y + P.ps * .5) / P.pts.length), extra = Math.max(0, foot - y - (P.pts.length * pitch - P.ps * .5));
  let by = y + Math.min(20, extra / 2) + P.ps * .8;
  P.pts.forEach(t => { tick(ctx, out, x, by, P.ps, o.acc, o.bg); say(ctx, out, t, lab, P.ps, x + P.ps * .9, by, { fill: o.ink, role: "point" }); by += pitch; });
}

/** the points side by side on the middle line, in one row or in two, a tick before each */
function pointRows(ctx, pts, lab, max, w) {
  const widthAt = (row, s) => { ctx.font = fontCss(lab, s); return row.reduce((a, t) => a + ctx.measureText(t).width + s * .9, 0) + (row.length - 1) * s * 1.3; };
  const half = Math.ceil(pts.length / 2);
  for (const rows of [[pts], [pts.slice(0, half), pts.slice(half)].filter(r => r.length)]) {
    let s = max; while (s > 20 && rows.some(r => widthAt(r, s) > w)) s -= 1;
    if (s >= FLOOR || rows.length > 1) return { rows, ps: s };
  }
}
const rowsH = R => R.rows.length * R.ps * 1.5 - R.ps * .5;
function drawRows(ctx, out, R, lab, cx, top, ink, acc, bg) {
  let by = top + R.ps * .8;
  R.rows.forEach(row => {
    ctx.font = fontCss(lab, R.ps);
    const ws = row.map(t => ctx.measureText(t).width), total = ws.reduce((a, b) => a + b + R.ps * .9, 0) + (row.length - 1) * R.ps * 1.3;
    let x = cx - total / 2;
    row.forEach((t, i) => { tick(ctx, out, x, by, R.ps, acc, bg); say(ctx, out, t, lab, R.ps, x + R.ps * .9, by, { fill: ink, role: "point" }); x += ws[i] + R.ps * 2.2; });
    by += R.ps * 1.5;
  });
}

/** Band: the front's band the other way round, the plate for the ground and the card's ground for the
 *  band, the number on it; the QR (or the product) stands on the band as the product does in front */
function backBand(ctx, P, W, f, out, qr, img, S) {
  const bg = P.plate, ink = P.plateInk, acc = accentOn(P, bg, ink), lab = f.label, num = numFontOf(f);
  const bandTop = S.y + S.h - 140, side = 300, colW = S.w - side - 44;
  mainField(ctx, f, 0, 0, SHEET.w, bandTop - 10, bg, [[ink, 4.5], [acc, 3]], S.x + S.w - side / 2, (S.y + bandTop) / 2);
  softField(ctx, f, 0, bandTop, SHEET.w, SHEET.h - bandTop, P.ground, [[P.ink, 4.5]]);
  ctx.fillStyle = P.accent; ctx.fillRect(0, bandTop - 10, SHEET.w, 10);
  column(ctx, out, W, f, S.x, S.y, colW, bandTop - 34, { ink, acc, bg, contact: false, headMax: 72 });
  let fy = S.y + S.h;
  if (W.site) fy = say(ctx, out, W.site, lab, fitS(ctx, W.site, lab, colW), S.x, fy, { foot: true, fill: P.ink, role: "site" }).y - 10;
  say(ctx, out, W.phone, num, fit(ctx, W.phone, num, qr ? 72 : 88, colW, fy - bandTop - 20, 30), S.x, fy, { foot: true, fill: P.ink, role: "contact" });
  if (qr) {
    const qy = bandTop + 56 - side;
    qrTile(ctx, out, qr, S.x + S.w - side, qy, side);
    const t = scanWords(W), ls = fitS(ctx, t, lab, side, 30);
    say(ctx, out, t, lab, ls, S.x + S.w - side / 2, S.y + S.h, { foot: true, align: "center", fill: P.ink, role: "label" });
  } else product(ctx, out, img, S.x + colW + 24, S.y - 18, S.x + S.w - (S.x + colW + 24) + BLEED * .6, bandTop + 34 - (S.y - 18), { align: "center" });
}

/** Split: the front's panel seen from behind, at the right now; it holds the QR or the product */
function backSplit(ctx, P, W, f, out, qr, img, S) {
  const panelX = SHEET.w - (S.x + S.w * .38 + 30);
  if (fillNow() === "photo") { softField(ctx, f, 0, 0, panelX, SHEET.h, P.ground, [[P.ink, 4.5], [P.accent, 3]]); mainField(ctx, f, panelX, 0, SHEET.w - panelX, SHEET.h, P.plate, [[P.plateInk, 4.5]], (panelX + SHEET.w) / 2, SHEET.h / 2); }   // the photograph on the panel
  else { mainField(ctx, f, 0, 0, panelX, SHEET.h, P.ground, [[P.ink, 4.5], [P.accent, 3]], panelX, SHEET.h / 2); softField(ctx, f, panelX, 0, SHEET.w - panelX, SHEET.h, P.plate, [[P.plateInk, 4.5]]); }
  column(ctx, out, W, f, S.x, S.y, panelX - 40 - S.x, S.y + S.h, { ink: P.ink, acc: P.accent, bg: P.ground, big: !qr });
  const px = panelX + 40, pw = S.x + S.w - px;
  if (qr) qrWithWords(ctx, out, qr, W, f.label, px, pw, S.y, S.y + S.h, P.plateInk);
  else product(ctx, out, img, panelX + 20, S.y - 10, BLEED + TRIM.w - (panelX + 20), S.h + 20, { align: "center", valign: "center" });
}

/** Centred: everything on the middle line, on the plate; the QR between what is bought and the points */
function backCenter(ctx, P, W, f, out, qr, img, S) {
  const bg = P.plate, ink = P.plateInk, acc = accentOn(P, bg, ink), lab = f.label, num = numFontOf(f), cx = S.x + S.w / 2;
  mainField(ctx, f, 0, 0, SHEET.w, SHEET.h, bg, [[ink, 4.5], [acc, 3]], cx, SHEET.h / 2);
  const H = nameBlock(ctx, W.buy, f, 76, S.w * .92, 130, 60);
  const hb = drawBlock(ctx, out, H.B, H.font, cx, S.y, { align: "center", fill: acc, role: "buy" });
  let fy = S.y + S.h;
  if (qr) {
    // the foot: the website and the number on one line, or on two
    const call = (W.site ? W.site + "   •   " : "") + W.phone, cs = fitS(ctx, call, lab, S.w, 34);
    if (cs >= FLOOR || !W.site) fy = say(ctx, out, call, lab, cs, cx, fy, { foot: true, align: "center", fill: ink, role: "contact" }).y;
    else { fy = say(ctx, out, W.site, lab, fitS(ctx, W.site, lab, S.w), cx, fy, { foot: true, align: "center", fill: ink, role: "site" }).y - 10;
      fy = say(ctx, out, W.phone, lab, fitS(ctx, W.phone, lab, S.w, 34), cx, fy, { foot: true, align: "center", fill: ink, role: "contact" }).y; }
    const R = pointRows(ctx, W.points, lab, 36, S.w), top = fy - 24 - rowsH(R);
    drawRows(ctx, out, R, lab, cx, top, ink, acc, bg);
    const qs = Math.min(272, top - 24 - (hb + 24));
    qrTile(ctx, out, qr, cx - qs / 2, hb + 24 + (top - 24 - (hb + 24) - qs) / 2, qs);
  } else {
    // no QR: the points down the middle, a rule, and the number large over the website
    if (W.site) fy = say(ctx, out, W.site, lab, fitS(ctx, W.site, lab, S.w), cx, fy, { foot: true, align: "center", fill: ink, role: "site" }).y - 12;
    const pb = say(ctx, out, W.phone, num, fit(ctx, W.phone, num, 96, S.w * .9, 104, 30), cx, fy, { foot: true, align: "center", fill: acc, role: "contact" });
    ctx.fillStyle = acc; ctx.fillRect(cx - 70, pb.y - 34, 140, 6);
    const room = pb.y - 34 - 24 - (hb + 24), n = W.points.length;
    const ps = Math.min(42, ...W.points.map(t => fit(ctx, t, lab, 42, S.w * .8)), (room + 14) / (n * 1.5));
    const R = { rows: W.points.map(t => [t]), ps };
    drawRows(ctx, out, R, lab, cx, hb + 24 + Math.max(0, (room - rowsH(R)) / 2), ink, acc, bg);
  }
}

/** Pop: the comic's next panel; a speech balloon says what is bought, the points under it, the QR (or
 *  the product) with a hard shadow, halftone and the heavy frame of the front */
function backPop(ctx, P, W, f, out, qr, img, S) {
  const bg = P.plate, ink = P.plateInk, acc = accentOn(P, bg, ink), line = onColour(bg), lab = f.label;
  const hard = contrastOf(P.accent, bg) >= 1.6 ? P.accent : rgba("#000000", .85);
  mainField(ctx, f, 0, 0, SHEET.w, SHEET.h, bg, [[ink, 4.5], [acc, 3]], S.x + S.w - 150, S.y + S.h / 2);
  if (popDots()) halftone(ctx, 0, 0, SHEET.w, SHEET.h, toneOf(bg, [[ink, 4.5], [acc, 3]], .2), SHEET.w * .1, SHEET.h * .9, SHEET.w * .6);
  ctx.lineWidth = 10; ctx.strokeStyle = line; rr(ctx, S.x - 14, S.y - 14, S.w + 28, S.h + 28, 18); ctx.stroke();
  const side = 296, colW = S.w - side - 44;
  // the balloon: white, inked, its tail to the points below
  const H = nameBlock(ctx, W.buy, f, 66, colW - 64, 124, 60);
  ctx.font = fontCss(H.font, H.B.size);
  const tw = Math.max(...H.B.lines.map(t => ctx.measureText(t).width)), bx = S.x + 8, by = S.y + 8, bw = tw + 64, bh = blockH(ctx, H.B, H.font) + 46, tx = bx + Math.min(70, bw * .2);
  ctx.lineWidth = 6; ctx.strokeStyle = "#111111"; ctx.fillStyle = "#ffffff"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(tx, by + bh - 2); ctx.lineTo(tx - 8, by + bh + 36); ctx.lineTo(tx + 42, by + bh - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  rr(ctx, bx, by, bw, bh, Math.min(44, bh * .4)); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(tx + 4, by + bh - 9); ctx.lineTo(tx - 3, by + bh + 26); ctx.lineTo(tx + 34, by + bh - 9); ctx.closePath(); ctx.fill();
  drawBlock(ctx, out, H.B, H.font, bx + 32, by + 23, { fill: "#111111", role: "buy" });
  column(ctx, out, W, f, S.x + 8, by + bh + 52, colW, S.y + S.h, { ink, acc, bg, head: false, big: !qr });
  if (qr) { const qs = side - 16; qrTile(ctx, out, qr, S.x + S.w - qs - 14, S.y + (S.h - qs) / 2 - 6, qs, { stroke: "#111111", hard }); }
  else product(ctx, out, img, S.x + colW + 30, S.y + 10, S.w - colW - 34, S.h - 20, { valign: "center", hard: rgba("#000000", .85) });
}

/** Ticket: the front's ticket from behind; the stub is at the left now, its tear and notches just
 *  behind the front's. The stub holds the QR (or the product); the points are on the ticket. */
function backTicket(ctx, P, W, f, out, qr, img, S) {
  const tearX = SHEET.w - (S.x + S.w * .62), lab = f.label;
  if (fillNow() === "photo") { softField(ctx, f, tearX, 0, SHEET.w - tearX, SHEET.h, P.ground, [[P.ink, 4.5], [P.accent, 3]]); mainField(ctx, f, 0, 0, tearX, SHEET.h, P.light, [[P.ink, 4.5]], tearX / 2, SHEET.h / 2); }   // the photograph on the stub
  else { mainField(ctx, f, tearX, 0, SHEET.w - tearX, SHEET.h, P.ground, [[P.ink, 4.5], [P.accent, 3]], tearX, SHEET.h / 2); softField(ctx, f, 0, 0, tearX, SHEET.h, P.light, [[P.ink, 4.5]]); }
  ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.setLineDash([16, 14]);
  ctx.beginPath(); ctx.moveTo(tearX, 0); ctx.lineTo(tearX, SHEET.h); ctx.stroke(); ctx.setLineDash([]);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, tearX, SHEET.h); ctx.clip();
  ctx.fillStyle = P.ground; [S.y - BLEED, S.y + S.h + BLEED].forEach(y => { ctx.beginPath(); ctx.arc(tearX, y, 34, 0, Math.PI * 2); ctx.fill(); });
  ctx.restore();
  const rx = tearX + 44;
  column(ctx, out, W, f, rx, S.y, S.x + S.w - rx, S.y + S.h, { ink: P.ink, acc: P.accent, bg: P.ground, big: !qr });
  const sw = tearX - 44 - S.x;
  if (qr) qrWithWords(ctx, out, qr, W, lab, S.x, sw, S.y, S.y + S.h, P.ink, 290);
  else product(ctx, out, img, BLEED + 10, S.y, tearX - 30 - (BLEED + 10), S.h, { align: "center", valign: "center" });
}

const BACKS = { band: backBand, split: backSplit, center: backCenter, pop: backPop, ticket: backTicket, logo: backSplit };
function back(ctx, P, W, f, d, out, qr, img) { (BACKS[d] || backBand)(ctx, P, W, f, out, qr, img, SAFE); }

/* ---------- the QR (qrcode-generator, as the studio loads it) ---------- */
let qrLib = null;
function loadQr() {
  if (window.qrcode) return Promise.resolve();
  return qrLib || (qrLib = new Promise((res, rej) => {
    const urls = ["https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js", "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"];
    const next = i => { if (i >= urls.length) { qrLib = null; return rej(new Error("The QR code could not load")); }
      const s = document.createElement("script"); s.src = urls[i]; s.onload = () => window.qrcode ? res() : next(i + 1); s.onerror = () => next(i + 1); document.head.appendChild(s); };
    next(0);
  }));
}
const qrCache = {};
function qrCanvas(text) {
  if (qrCache[text]) return qrCache[text];
  const q = window.qrcode(0, "M"); q.addData(text); q.make();
  const n = q.getModuleCount(), quiet = 2, k = Math.ceil(660 / (n + quiet * 2)), c = document.createElement("canvas");
  c.width = c.height = (n + quiet * 2) * k;
  const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.fillStyle = "#000";
  for (let r = 0; r < n; r++) for (let col = 0; col < n; col++) if (q.isDark(r, col)) x.fillRect((col + quiet) * k, (r + quiet) * k, k, k);
  return (qrCache[text] = c);
}
const qrText = W => W.site ? (/^https?:/i.test(state.site) ? state.site.trim() : "https://" + W.site) : "tel:" + W.phone.replace(/[^\d+]/g, "");

/* ---------- the product (assets/cutouts/, the full ad's own pictures of each line) ---------- */
const products = {};
/** the line's picture for this look: one of its sets (New look moves through them), its strongest file */
function productFile(L) {
  const sets = (L && L.sets) || []; if (!sets.length) return null;
  const set = sets[Math.abs(state.seed | 0) % sets.length] || sets[0];
  const best = set.slice().sort((a, b) => (b.k || 0) - (a.k || 0))[0];
  return best ? best.file : null;
}
function loadProduct(L) {
  const file = productFile(L); if (!file) return Promise.resolve(null);
  return products[file] || (products[file] = new Promise(res => {
    const im = new Image(); im.decoding = "async";
    im.onload = () => res(im); im.onerror = () => res(null);
    im.src = new URL("../assets/cutouts/" + file + ".webp", import.meta.url).href;
  }));
}

/** one side of the card on a canvas: { canvas, boxes } (boxes: every word, the QR and the product, for the check) */
/* One drawing at a time: the gallery draws its looks by lending them to the card's state for a moment, so
   every drawing (the preview, a download, a gallery card) waits its turn and never sees a lent look. */
let LOCK = Promise.resolve();
const locked = fn => { const p = LOCK.then(fn, fn); LOCK = p.catch(() => {}); return p; };
export function render(side, o) { return locked(() => renderRaw(side, o)); }
async function renderRaw(side, { scale = 1, marks = false, bare = false } = {}) {
  if (state.mode === "brand") return renderBrand(side, { scale, marks });
  const f = TYPE_VOICES[voiceNow()], P = paletteOf(pairNow()), W = words();
  await loadFonts([f.display, f.label, numFontOf(f)]);
  let qr = null;
  if (side === "back" && state.qr) { try { await loadQr(); qr = qrCanvas(qrText(W)); } catch (e) { qr = null; } }
  const img = await loadProduct(lineNow());
  const logo = state.layout === "logo" && side === "front" ? await logoImage() : null;
  const kind = fillNow(), ground = imageGround(kind) ? await loadGround(kind) : null;
  const paint = (sc, scrims, bareNow) => {
    const c = document.createElement("canvas");
    c.width = Math.round(SHEET.w * sc); c.height = Math.round(SHEET.h * sc);
    const ctx = c.getContext("2d"); ctx.scale(sc, sc);
    const out = [];
    FIELDS = []; SCRIMS = scrims; GROUND = ground; PHOTO_ON = kind === "photo" && !!ground; CUR_P = P; BARE = !!bareNow; LOGO_NOW = logo;
    FRAME_DUE = !!state.frame && !["pop", "ticket"].includes(state.layout);   // (Logo wears Premium's frame too)   // Pop and Ticket have frames of their own
    try { if (side === "back") back(ctx, P, W, f, state.layout, out, qr, img); else front(ctx, P, W, f, state.layout, out, img); }
    finally { BARE = false; SCRIMS = null; GROUND = null; PHOTO_ON = false; FRAME_DUE = false; LOGO_NOW = null; }
    return { canvas: c, boxes: out, fields: FIELDS.slice() };
  };
  // a picture ground: drawn once without its words, at full size (half size blurred sprinkles and blob edges
  // into a contrast they do not have), to fit the scrims to what is under them
  const scrims = ground ? scrimsFor(paint(1, null, true), 1) : null;
  const r = paint(scale, scrims, bare);
  if (marks && window.PgfxMark) { const ctx = r.canvas.getContext("2d"); ctx.setTransform(1, 0, 0, 1, 0, 0); window.PgfxMark.draw(ctx, r.canvas.width, r.canvas.height); }
  return r;
}

/* ---------- the print file: a PDF, both sides, with the bleed and crop marks ---------- */
/** A minimal PDF 1.4 of JPEG pages, one per side, each on the bleed with an 18 pt slug for the
 *  crop marks: TrimBox the card, BleedBox the bleed. No library: the JPEGs go in as they are
 *  (DCTDecode). */
export function pdfOf(jpegs) {
  const pt = 72 / DPI, slug = 18, bw = SHEET.w * pt, bh = SHEET.h * pt, mw = bw + 2 * slug, mh = bh + 2 * slug, b = BLEED * pt;
  const enc = new TextEncoder(), parts = [], offs = [];
  let len = 0;
  const put = x => { const u = typeof x === "string" ? enc.encode(x) : x; parts.push(u); len += u.length; };
  const f2 = v => (Math.round(v * 100) / 100).toString();
  put("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n");
  const n = jpegs.length, pageIds = jpegs.map((_, i) => 3 + i * 3);
  const obj = (id, body) => { offs[id] = len; put(id + " 0 obj\n"); body(); put("\nendobj\n"); };
  obj(1, () => put("<< /Type /Catalog /Pages 2 0 R >>"));
  obj(2, () => put("<< /Type /Pages /Kids [" + pageIds.map(i => i + " 0 R").join(" ") + "] /Count " + n + " >>"));
  jpegs.forEach((j, i) => {
    const pid = 3 + i * 3, cid = pid + 1, iid = pid + 2;
    const tx0 = slug + b, ty0 = slug + b, tx1 = slug + bw - b, ty1 = slug + bh - b, gap = 2;
    const marks = [
      [tx0, 0, tx0, slug - gap], [tx1, 0, tx1, slug - gap], [tx0, mh - slug + gap, tx0, mh], [tx1, mh - slug + gap, tx1, mh],
      [0, ty0, slug - gap, ty0], [0, ty1, slug - gap, ty1], [mw - slug + gap, ty0, mw, ty0], [mw - slug + gap, ty1, mw, ty1],
    ].map(([x1, y1, x2, y2]) => f2(x1) + " " + f2(y1) + " m " + f2(x2) + " " + f2(y2) + " l S").join("\n");
    const content = "q " + f2(bw) + " 0 0 " + f2(bh) + " " + slug + " " + slug + " cm /Im0 Do Q\n0 0 0 1 K 0.25 w\n" + marks + "\n";
    obj(pid, () => put("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + f2(mw) + " " + f2(mh) + "] /BleedBox [" + slug + " " + slug + " " + f2(slug + bw) + " " + f2(slug + bh) + "] /TrimBox ["
      + f2(tx0) + " " + f2(ty0) + " " + f2(tx1) + " " + f2(ty1) + "] /Resources << /XObject << /Im0 " + iid + " 0 R >> >> /Contents " + cid + " 0 R >>"));
    obj(cid, () => { put("<< /Length " + enc.encode(content).length + " >>\nstream\n"); put(content); put("\nendstream"); });
    obj(iid, () => { put("<< /Type /XObject /Subtype /Image /Width " + j.w + " /Height " + j.h + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + j.bytes.length + " >>\nstream\n"); put(j.bytes); put("\nendstream"); });
  });
  const total = 3 + n * 3, xref = len;
  put("xref\n0 " + total + "\n0000000000 65535 f \n");
  for (let i = 1; i < total; i++) put(String(offs[i]).padStart(10, "0") + " 00000 n \n");
  put("trailer\n<< /Size " + total + " /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF\n");
  const out = new Uint8Array(len); let o = 0; parts.forEach(p => { out.set(p, o); o += p.length; });
  return out;
}
const jpegOf = c => new Promise(res => c.toBlob(b => b.arrayBuffer().then(a => res({ bytes: new Uint8Array(a), w: c.width, h: c.height })), "image/jpeg", .95));
const pngOf = c => new Promise(res => c.toBlob(res, "image/png"));
/** The print file the download saves: both sides drawn at 600 dpi, twice the press's 300, so the type's
 *  edges print as clean as type set in the file (the polish, 2026-11-22: small type at 300 dpi showed
 *  its pixels to a designer's eye). The page is the same 3.5 × 2 in. */
export async function printFile(marks = false) {
  const f = await render("front", { scale: 2, marks }), b = await render("back", { scale: 2, marks });
  return pdfOf([await jpegOf(f.canvas), await jpegOf(b.canvas)]);
}
/** Whether a colour is one a print shop's four inks fall short of: a bright green, cyan, blue, violet
 *  or pink (saturated and light, by hue). Reds, oranges and yellows print close to the screen. */
function vividInk(hex) {
  const n = parseInt(String(hex).slice(1), 16); if (!/^#[0-9a-f]{6}$/i.test(hex)) return false;
  const r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), s = mx ? (mx - mn) / mx : 0;
  if (s < .7 || mx < .75) return false;
  const h = ((mx === r ? ((g - b) / (mx - mn)) % 6 : mx === g ? (b - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4) * 60 + 360) % 360;
  return h >= 75 && h <= 335;
}
const vividPair = p => ["ground", "plate", "accent"].some(k => vividInk(p.colors[k]));

/* ---------- the plan's say (the video maker's planGate, kind "card") ---------- */
const VH = () => window.VideoHelp;
const plansAct = { label: "See plans", primary: true, run: () => { location.href = "../?plans=1"; } };
async function gate(next) {
  const acct = window.pgfxAccount;
  if (!acct || acct.demo) return { watermark: false, count: async () => true };
  const message = "Create a free account, or sign in, to download your business card.";
  if (!acct.signedIn()) { acct.openAuth({ message, next }); return null; }
  const upsell = () => VH().show({ tone: "info", title: "Print-ready business cards come with Pro and Business",
    message: "Design and preview as many cards as you like here. The print-ready file, front and back with the bleed and crop marks print shops ask for, comes with Pro ($60 a month) and Business ($100).", actions: [plansAct] });
  const limit = e => VH().show({ tone: "info", title: "You've used this plan's downloads", message: (e && e.message ? e.message + ". " : "") + "A business card is one of your photo downloads.", actions: [plansAct] });
  const refused = e => { if (e.status === 403) { upsell(); return true; } if (e.status === 402) { limit(e); return true; } return false; };
  try {
    const g = await acct.api("/export/check", { kind: "card" });
    return { watermark: !!g.watermark, count: async () => { try { await acct.api("/export", { kind: "card" }); return true; } catch (e) { if (refused(e)) return false; throw e; } } };
  } catch (e) {
    if (e.status === 401 || e.status === 404) { acct.signout(); acct.openAuth({ message, next }); return null; }
    if (refused(e)) return null;
    throw e;
  }
}
/** whether this account downloads cards: the preview carries the mark until it does */
let entitled = false;
async function checkEntitled() {
  const acct = window.pgfxAccount;
  if (!acct) { entitled = false; return; }
  if (acct.demo) { entitled = true; return; }
  if (!acct.signedIn()) { entitled = false; return; }
  try { await acct.api("/export/check", { kind: "card" }); entitled = true; } catch (e) { entitled = e.status === 402; }
}

/* ---------- downloads ---------- */
const slug = () => (words().name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "business") + "-card";
function saveBlob(blob, name) { if (VH() && VH().save) VH().save(blob, name); else { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); } }
function note(msg, bad) { const n = $("cd-note"); if (n) { n.textContent = msg; n.classList.toggle("bad", !!bad); } }
async function download(kind, btn) {
  if (!String(state.phone || "").trim()) { note("Type your phone number first: it is the one thing a card must have.", true); $("cd-phone").focus(); return; }
  const g = await gate(() => download(kind, btn)); if (!g) return;
  const label = btn.textContent; btn.disabled = true; btn.textContent = "Making it…";
  try {
    if (kind === "pdf") {
      const bytes = await printFile(g.watermark);
      if (!await g.count()) return;
      saveBlob(new Blob([bytes], { type: "application/pdf" }), slug() + ".pdf");
    } else {
      const [f, b] = [await render("front", { marks: g.watermark }), await render("back", { marks: g.watermark })];
      if (!await g.count()) return;
      saveBlob(await pngOf(f.canvas), slug() + "-front.png"); saveBlob(await pngOf(b.canvas), slug() + "-back.png");
    }
    note(kind === "pdf" ? "Downloaded: front and back, 3.5 × 2 in at 600 dpi, with the bleed and crop marks." : "Downloaded: the front and the back, 1125 × 675 each (300 dpi with the bleed).");
    showPrint(true);
  } catch (e) { console.error("business card:", e); note("That did not work: " + (e.message || e) + ". Try again.", true); }
  finally { btn.disabled = false; btn.textContent = label; }
}

/* ---------- print it today (logo/print-today.js: the one copy the brand kit's card step shares) ---------- */
let PRINT = null;
function showPrint(scroll) {
  const p = $("print"); p.hidden = false;
  if (PRINT) PRINT.draw(); else PRINT = mountPrint({ input: $("pt-where"), links: $("pt-links"), mapsName: $("pt-maps"), switchBtn: $("pt-switch"), esc });
  if (scroll) p.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ═══════════════════════════════════════════════════════════════════════════
   THE BRAND CARDS (DESIGN-LAW 185). The owner, 2026-11-25: "business cards also dont have any real brand
   assets? or background options?", "still not enough to make a consistent brand kit people will use moving
   forward needs to looks super clean". A brand card is the shop's logo (the logo maker's, pgfx_logo_kit, or
   one suggested for its name until it makes one), in the logo's own colours and lettering, with the kit's
   details on the back (pgfx_logo.details: the same the kit's posts and signature use), drawn by
   logo/card.js exactly as the brand kit draws its card. The layout and background picked here are written
   to the kit (pgfx_logo.card), so the card in the kit is this card. Promo cards are the layouts above.
   ═══════════════════════════════════════════════════════════════════════════ */
const LOGO_STORE = "pgfx_logo";
const BLAYOUT_OF = Object.fromEntries(CARD_LAYOUTS.map(x => [x.key, x])), BGROUND_OF = Object.fromEntries(CARD_GROUNDS.map(x => [x.key, x]));
const DETAIL_KEYS = ["buys", "points", "person", "role", "phone", "email", "site", "handle", "address", "hours"];
const logoState = () => jget(LOGO_STORE, null) || {};
const writeLogo = patch => jset(LOGO_STORE, Object.assign(logoState(), patch));
/** the kit's details as typed, with the studio's number and website where the kit has none yet */
function rawDetails() {
  const d = Object.assign({}, logoState().details || {});
  if (!d.phone && state.phone) d.phone = state.phone;
  if (!d.site && state.site) d.site = state.site;
  return d;
}
const brandDetails = () => cleanDetails(rawDetails());
function setDetail(k, v) { const s = logoState(); s.details = Object.assign({}, s.details || {}, { [k]: v }); jset(LOGO_STORE, s); }
/** the line a logo is drawn for: the kit's, or the card's own line where the logo engine has it */
const logoCat = () => { const k = kitNow(); if (k && LE.LINE_WORDS[k.cat]) return k.cat; const c = lineNow().cat; return LE.LINE_WORDS[c] ? c : "phones"; };
const suggested = {};
/** the logo a brand card wears: the customer's own, or the first the logo maker would suggest for their name */
function brandDesign() {
  const k = kitNow(); if (k) return LE.cleanDesign(k);
  const name = String(state.name || "").trim() || "Your Business", town = String(fromStudio().home || "").split(",")[0].trim(), key = name + "|" + logoCat() + "|" + town;
  return suggested[key] || (suggested[key] = LE.gallery({ name, cat: logoCat(), town }, { seed: 1, n: 1 })[0]);
}
/** the layout and background: lent by the gallery for a moment, else the kit's (the customer's pick, or
 *  the look its "Try another look" landed on) */
function brandChoice() {
  if (BLAYOUT_OF[state.blayout] && BGROUND_OF[state.bground]) return { layout: state.blayout, ground: state.bground };
  const s = logoState(); return cardChoice(s.card, (s.looks && s.looks.card) || 0);
}
const setBrandChoice = c => writeLogo({ card: { layout: c.layout, ground: c.ground } });
const LFACES = {};
async function brandFaces(d) { for (const f of LE.facesOf(d)) if (!LFACES[f]) LFACES[f] = (await import(`../logo/glyphs/${f}.js`)).default; return LFACES; }
const svgPicture = svg => new Promise((res, rej) => {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })), im = new Image();
  im.onload = () => { URL.revokeObjectURL(url); res(im); }; im.onerror = () => { URL.revokeObjectURL(url); rej(new Error("The card could not be drawn")); };
  im.src = url;
});
/** the QR for a brand card's back: to the website, or the number */
async function brandQr(x) {
  if (!state.qr || !(x.site || x.phone)) return null;
  try { await loadQr(); } catch (e) { return null; }
  const q = window.qrcode(0, "M"); q.addData(x.site ? "https://" + x.site : "tel:" + x.phone.replace(/[^\d+]/g, "")); q.make();
  const n = q.getModuleCount(), cells = [];
  for (let r = 0; r < n; r++) { const row = []; for (let c = 0; c < n; c++) row.push(q.isDark(r, c)); cells.push(row); }
  return { cells, label: x.site ? "Scan to visit" : "Scan to call" };
}
/** one side of the brand card on a canvas, as render() returns a promo card's */
async function renderBrand(side, { scale = 1, marks = false } = {}) {
  const d = brandDesign(), faces = await brandFaces(d), x = brandDetails(), ch = brandChoice();
  const qr = side === "back" ? await brandQr(x) : null;
  const r = brandCardSvg(d, x, faces, { side, layout: ch.layout, ground: ch.ground, qr });
  const im = await svgPicture(r.svg), c = document.createElement("canvas");
  c.width = Math.round(SHEET.w * scale); c.height = Math.round(SHEET.h * scale);
  const ctx = c.getContext("2d"); ctx.drawImage(im, 0, 0, c.width, c.height);
  if (marks && window.PgfxMark) window.PgfxMark.draw(ctx, c.width, c.height);
  return { canvas: c, boxes: r.boxes.map(b => ({ ...b, size: b.em })), fields: [], palette: r.palette, brand: true };
}
/** the gallery's brand cards: every layout, on its own colour and on white first, then the textures */
const BRAND_FIRST = [["centred", "solid"], ["left", "paper"], ["corner", "solid"], ["band", "sheen"], ["split", "solid"], ["minimal", "paper"],
  ["frame", "solid"], ["edge", "paper"], ["centred", "reverse"], ["left", "linen"], ["corner", "paper"], ["band", "mark"]];
function brandLooks(gseed) {
  if (gseed <= 1) return BRAND_FIRST.map(([blayout, bground], i) => ({ mode: "brand", blayout, bground, seed: i }));
  const R = rng(gseed * 7919 + 3), lays = CARD_LAYOUTS.map(l => l.key), weights = { solid: 3, paper: 3, sheen: 1.5, reverse: 1.5, linen: 1, lines: 1, pattern: 1, mark: 1 };
  const pickG = () => { const tot = Object.values(weights).reduce((a, b) => a + b, 0); let t = R() * tot; for (const [k, v] of Object.entries(weights)) { if ((t -= v) <= 0) return k; } return "solid"; };
  const out = [], seen = new Set();
  for (let i = 0; out.length < GALLERY_N && i < 200; i++) {
    const blayout = lays[(i + gseed) % lays.length], bground = pickG(), k = blayout + bground;
    if (seen.has(k)) continue; seen.add(k); out.push({ mode: "brand", blayout, bground, seed: i });
  }
  return out;
}
/** a background chip's swatch: the card's colour, and its texture drawn small */
function groundSwatch(k) {
  const P = cardPalette(brandDesign().pair, k), t = LE.mixHex(P.G, P.I, .22);
  const tex = { sheen: `linear-gradient(${LE.mixHex(P.G, "#ffffff", .14)},${LE.mixHex(P.G, "#000000", .2)})`, linen: `repeating-linear-gradient(0deg,${t} 0 1px,transparent 1px 4px),repeating-linear-gradient(90deg,${t} 0 1px,transparent 1px 4px)`,
    lines: `repeating-linear-gradient(45deg,${t} 0 2px,transparent 2px 6px)`, pattern: `radial-gradient(${t} 1.6px,transparent 2.2px) 0 0/8px 8px`, mark: `radial-gradient(circle at 85% 55%,${t} 0 45%,transparent 46%)` }[k];
  return `background:${tex ? tex + "," : ""}${P.G}`;
}
/** Brand cards or Promo cards: the tabs, what each is, and the form and chips each shows */
function setMode(m) {
  state.mode = m === "promo" ? "promo" : "brand"; keep();
  document.body.dataset.mode = state.mode;
  for (const b of document.querySelectorAll(".cd-tabs [data-mode]")) b.setAttribute("aria-selected", String(b.dataset.mode === state.mode));
  $("cd-tab-says").textContent = state.mode === "brand"
    ? "Your logo, its colours and its lettering on every card, and your details on the back: the card you hand someone."
    : "Cards that sell like your ads: what you buy, your number large, your towns and a QR code. Handouts for meet-ups and shop counters.";
  modeDetails();
  if (!$("cd-custom").hidden) { drawControls(); fillForm(); later(0); }
}
/** the gallery's own fields for the mode: a brand card's name is its logo's, where there is one */
function modeDetails() {
  const kit = kitNow(), brandKit = state.mode === "brand" && !!kit, nm = $("cd-g-name"), sel = $("cd-g-line");
  nm.readOnly = brandKit; nm.title = brandKit ? "Your logo's name. Change it in the logo maker." : "";
  nm.value = brandKit ? kit.name || "" : state.name || "";
  sel.disabled = brandKit; sel.title = brandKit ? "Your logo's line. Change it in the logo maker." : "";
  $("cd-suggest").hidden = !(state.mode === "brand" && !kit);
  $("cd-g-phone").value = state.mode === "brand" ? rawDetails().phone || "" : state.phone || "";
}

/* ---------- the gallery: finished cards to pick from ---------- */
const GALLERY_N = 12;
/** Looks for the gallery: a style at a time (each of the six twice), each look from that style's own lists,
 *  no pair twice and no layout more than twice; with a logo picked, the first three wear it in its own colours. */
function galleryLooks(gseed) {
  if (state.mode === "brand") return brandLooks(gseed);
  const R = rng(gseed * 92821 + 17), pick = a => a[Math.floor(R() * a.length)], shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const out = [], used = new Set(), kit = kitNow();
  if (kit && gseed === 1) {
    const voice = VOICES.includes(kit.voice) ? kit.voice : "bold";
    [["pro", "glow"], ["premium", "fade"], ["bold", "flat"]].forEach(([st, fill], i) => {
      const S = STYLE_OF[st], pair = i === 0 || !PAIR_OF[kit.pair] ? kit.pair : pick(S.pairs.filter(k => PAIR_OF[k]));
      out.push({ layout: "logo", pair: PAIR_OF[pair] ? pair : PAIRS[0].key, voice, fill, look: st, style: st, frame: !!S.frame, seed: gseed * 100 + i });
      used.add(pair);
    });
  }
  const order = shuffle(STYLES).concat(shuffle(STYLES));
  const lays = {};
  for (let i = 0; out.length < GALLERY_N && i < order.length * 3; i++) {
    const S = order[i % order.length], fresh = S.layouts.filter(l => (lays[l] || 0) < 2), layout = fresh.length ? pick(fresh) : pick(S.layouts);
    if (fresh.length === 0 && i < order.length * 2) continue;   // no layout more than twice while another style has room
    lays[layout] = (lays[layout] || 0) + 1;
    const pairs = S.pairs.map(k => PAIR_OF[k]).filter(p => p && !used.has(p.key)), suits = pairs.filter(p => (p.suits || []).includes(lineNow().cat));
    if (!pairs.length) continue;
    const pair = pick(suits.length >= 3 && R() < .5 ? suits : pairs).key;
    const fill = S.grounds.includes("photo") && photoOk() && layout !== "center" && R() < .25 ? "photo" : pick(S.grounds.filter(g => g !== "photo"));
    used.add(pair);
    out.push({ layout, pair, voice: pick(S.voices.filter(v => VOICES.includes(v))) || "bold", fill, look: S.key, style: S.key, frame: !!S.frame, seed: gseed * 100 + 10 + i });
  }
  return out;
}
const LOOK_KEYS = ["layout", "pair", "voice", "fill", "look", "style", "frame", "seed", "mode", "blayout", "bground"];
const lookName = L => L.mode === "brand" ? (BLAYOUT_OF[L.blayout] || {}).name + " · " + (BGROUND_OF[L.bground] || {}).name
  : ((STYLE_OF[L.look] || {}).name || "") + " · " + (L.layout === "logo" ? "Logo" : (LAYOUTS.find(x => x.key === L.layout) || {}).name || "");
let galRun = 0;
/** draw a look's two sides small, without disturbing the card being customised */
function renderLook(look, scale) {
  return locked(async () => {
    const was = Object.fromEntries(LOOK_KEYS.map(k => [k, state[k]]));
    Object.assign(state, look);
    try { return [await renderRaw("front", { scale, marks: !entitled }), await renderRaw("back", { scale, marks: !entitled })]; }
    finally { Object.assign(state, was); }
  });
}
let galDrawing = Promise.resolve();
function drawGallery(append = false) {
  const run = ++galRun;
  galDrawing = galDrawing.then(async () => {
    if (run !== galRun) return;
    const grid = $("cd-gal"); if (!append) grid.innerHTML = "";
    const looks = galleryLooks(state.gseed), nodes = looks.map(L => {
      const b = document.createElement("button"); b.type = "button"; b.className = "cd-pick wait";
      b.innerHTML = `<div class="cd-pair"></div><b>${esc(lookName(L))}</b>`;
      b.setAttribute("aria-label", "A business card, loading"); grid.appendChild(b); return b;
    });
    for (let i = 0; i < looks.length; i++) {
      if (run !== galRun) return;
      const L = looks[i], b = nodes[i];
      try {
        const [f, k] = await renderLook(L, .4);
        if (run !== galRun) return;
        const pr = b.querySelector(".cd-pair");
        for (const [r, cls] of [[k, "bk"], [f, "fr"]]) { r.canvas.className = cls; r.canvas.setAttribute("aria-hidden", "true"); pr.appendChild(r.canvas); }
        b.classList.remove("wait");
        b.setAttribute("aria-label", "Pick this card: " + lookName(L).replace(" · ", ", ") + (L.mode === "brand" ? ", in your logo's colours" : ", in " + (PAIR_OF[L.pair] || {}).name));
        if (L.mode === "brand") { b.dataset.blayout = L.blayout; b.dataset.bground = L.bground; } else { b.dataset.layout = L.layout; b.dataset.pair = L.pair; }
        b.onclick = () => pickLook(L, b);
      } catch (e) { console.warn("card gallery:", e); b.remove(); }
    }
    grid.dataset.drawn = String(run);
    grid.dataset.count = String(grid.querySelectorAll(".cd-pick:not(.wait)").length);
  });
  return galDrawing;
}
/** a card picked from the gallery: its look is the card's, and Customise opens on it */
function pickLook(L, tile) {
  if (L.mode === "brand") { state.mode = "brand"; setBrandChoice({ layout: L.blayout, ground: L.bground }); }
  else Object.assign(state, L);
  state.chosen = true; keep();
  document.querySelectorAll(".cd-pick").forEach(b => b.setAttribute("aria-pressed", String(b === tile)));
  customise(true);
}
/** open Customise (the form and the large preview), on the card as it stands */
function customise(scroll) {
  const c = $("cd-custom"); c.hidden = false;
  drawControls(); fillForm(); later(0);
  if (scroll) c.scrollIntoView({ behavior: "smooth", block: "start" });
}
/** the gallery's own fields: the same words as the form's */
function bindDetails() {
  const sel = $("cd-g-line"); sel.innerHTML = $("cd-line").innerHTML; sel.value = lineNow().key;
  $("cd-g-name").value = state.name || ""; $("cd-g-phone").value = state.phone || "";
  let t = 0; const again = () => { clearTimeout(t); t = setTimeout(() => drawGallery(false), 450); };
  $("cd-g-name").addEventListener("input", e => { state.name = e.target.value; $("cd-name").value = state.name; keep(); again(); if (!$("cd-custom").hidden) later(); });
  $("cd-g-phone").addEventListener("input", e => {
    if (state.mode === "brand") { setDetail("phone", e.target.value); $("cd-b-phone").value = e.target.value; }
    else { state.phone = e.target.value; $("cd-phone").value = state.phone; keep(); }
    again(); if (!$("cd-custom").hidden) later();
  });
  for (const b of document.querySelectorAll(".cd-tabs [data-mode]")) b.onclick = () => { if (state.mode === b.dataset.mode) return; state.gseed = 1; setMode(b.dataset.mode); drawGallery(false); };
  sel.addEventListener("change", e => { state.line = e.target.value; state.points = ""; state.models = ""; keep(); fillForm(); drawControls(); drawGallery(false); if (!$("cd-custom").hidden) later(0); });
  $("cd-gal-more").onclick = () => { state.gseed = (state.gseed | 0) + 1; keep(); drawGallery(false); $("cd-gallery").scrollIntoView({ behavior: "smooth", block: "start" }); };
  $("cd-back-gal").onclick = () => $("cd-gallery").scrollIntoView({ behavior: "smooth", block: "start" });
  $("cd-logo-link").textContent = kitNow() ? "Change my logo" : "Make a logo for your card";
  modeDetails();
}

/* ---------- the page ---------- */
let drawing = 0;
async function draw() {
  const n = ++drawing;
  const [f, b] = await Promise.all([render("front", { scale: .64, marks: !entitled }), render("back", { scale: .64, marks: !entitled })]);
  if (n !== drawing) return;
  for (const [id, r] of [["cd-front", f], ["cd-back", b]]) {
    const c = $(id); c.width = r.canvas.width; c.height = r.canvas.height;
    const x = c.getContext("2d"), k = c.width / SHEET.w, e = BLEED * k;
    x.drawImage(r.canvas, 0, 0);
    // the preview only: the bleed, which the shop cuts off, veiled, and the cut as a dashed line
    x.fillStyle = "rgba(255,255,255,.28)";
    x.fillRect(0, 0, c.width, e); x.fillRect(0, c.height - e, c.width, e); x.fillRect(0, e, e, c.height - 2 * e); x.fillRect(c.width - e, e, e, c.height - 2 * e);
    x.setLineDash([6, 5]); x.lineWidth = 1.2; x.strokeStyle = "rgba(0,0,0,.45)"; x.strokeRect(e, e, c.width - 2 * e, c.height - 2 * e); x.setLineDash([]);
  }
  $("cd-stage").dataset.drawn = String(n);
  $("cd-stage").dataset.marked = String(!entitled);
  const ink = $("cd-ink"); if (ink) ink.hidden = f.brand ? !["G", "P", "A"].some(k => vividInk(f.palette[k])) : !vividPair(pairNow());
  // a website, towns or models line too long to print at 7 pt is set smaller; the customer is told which
  const NAMES = { site: "website", where: "towns", models: "line under what you buy" }, small = [...new Set(f.boxes.concat(b.boxes).filter(x => x.text && x.size < 29 && NAMES[x.role]).map(x => NAMES[x.role]))];
  const warn = $("cd-small");
  if (warn) { warn.hidden = !small.length; warn.textContent = small.length ? "Your " + small.join(" and ") + (small.length > 1 ? " are" : " is") + " long for a card, so " + (small.length > 1 ? "they print" : "it prints") + " under 7 pt. Shorter reads better on a card." : ""; }
}
let timer = 0;
const later = (ms = 140) => { clearTimeout(timer); timer = setTimeout(draw, ms); };

function chips(id, list, on, pick) {
  const el = $(id); el.innerHTML = list.map(x => `<button type="button" data-k="${esc(x.key)}" aria-pressed="${x.key === on}" title="${esc(x.hint || x.name)}"${x.style ? ` style="${x.style}"` : ""}>${x.html || esc(x.name)}</button>`).join("");
  el.onclick = e => { const b = e.target.closest("button[data-k]"); if (!b) return; pick(b.dataset.k); if (b.isConnected) el.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); };   // a pick that redrew the chips (Style) has set them already
}
function drawControls() {
  chips("cd-styles", [{ key: "", name: "Any", hint: "A different direction each New look" }].concat(STYLES), state.style || "", k => { state.style = k; newLook(); });
  chips("cd-layouts", kitNow() ? LAYOUTS.concat([LOGO_LAYOUT]) : LAYOUTS, state.layout, k => { state.layout = k; keep(); later(0); });
  const suits = PAIRS.filter(p => (p.suits || []).includes(lineNow().cat)), rest = PAIRS.filter(p => !suits.includes(p));
  const shown = suits.concat(rest).slice(0, 30); if (!shown.includes(pairNow())) shown.unshift(pairNow());   // the pair on the card is always one to see
  chips("cd-pairs", shown.map(p => ({ key: p.key, name: p.name, html: `<i style="background:${p.colors.ground}"></i><i style="background:${p.colors.accent}"></i>` })), pairNow().key,
    k => { state.pair = k; keep(); later(0); });
  chips("cd-voices", VOICES.map(k => ({ key: k, name: TYPE_VOICES[k].name })), voiceNow(), k => { state.voice = k; keep(); later(0); });
  chips("cd-fills", groundsShown(), fillNow(), k => { state.fill = k; keep(); later(0); });
  const bc = brandChoice();
  chips("cd-blayouts", CARD_LAYOUTS, bc.layout, k => { setBrandChoice({ ...brandChoice(), layout: k }); later(0); });
  chips("cd-bgrounds", CARD_GROUNDS.map(g => ({ key: g.key, name: g.name, hint: g.hint, html: `<i style="${groundSwatch(g.key)}"></i>${esc(g.name)}` })), bc.ground,
    k => { setBrandChoice({ ...brandChoice(), ground: k }); later(0); });
}
function fillForm() {
  const sel = $("cd-line"), groups = {};
  LINES.forEach(s => (groups[s.group || s.cat] ||= []).push(s));
  sel.innerHTML = Object.entries(groups).map(([g, ls]) => `<optgroup label="${esc(g)}">${ls.map(s => `<option value="${esc(s.key)}">${esc(s.label)}</option>`).join("")}</optgroup>`).join("");
  sel.value = lineNow().key;
  for (const k of ["name", "phone", "site", "where", "points", "models"]) $("cd-" + k).value = state[k] || "";
  $("cd-points").placeholder = lineNow().points || "";
  $("cd-models").placeholder = lineNow().models || "";
  $("cd-qr").checked = !!state.qr;
  const d = rawDetails();
  // what is bought and the selling points show the logo's line's own until the customer changes them
  const own = { buys: buysFor(brandDesign().cat), points: sellsFor(brandDesign().cat) };
  for (const k of DETAIL_KEYS) { const el = $("cd-b-" + k); if (el && document.activeElement !== el) el.value = k in own ? (typeof d[k] === "string" ? d[k] : own[k]) : d[k] || ""; }
}
function bind() {
  for (const k of ["name", "phone", "site", "where", "points", "models"]) $("cd-" + k).addEventListener("input", e => { state[k] = e.target.value; keep(); later(); if ($("cd-g-" + k)) $("cd-g-" + k).value = state[k]; });
  $("cd-line").addEventListener("change", e => { state.line = e.target.value; state.points = ""; state.models = ""; keep(); fillForm(); drawControls(); later(0); });
  $("cd-qr").addEventListener("change", e => { state.qr = e.target.checked; keep(); later(0); });
  let bt = 0;
  for (const k of DETAIL_KEYS) $("cd-b-" + k).addEventListener("input", e => {
    setDetail(k, e.target.value); later();
    if (k === "phone") $("cd-g-phone").value = e.target.value;
    clearTimeout(bt); bt = setTimeout(() => drawGallery(false), 600);   // the gallery's backs carry the details too
  });
  $("cd-shuffle").onclick = newLook;
  $("cd-pdf").onclick = e => download("pdf", e.currentTarget);
  $("cd-png").onclick = e => download("png", e.currentTarget);
  $("cd-print").onclick = () => showPrint(true);
}

async function start() {
  try { const j = await fetch(new URL("../motion/subjects.json", import.meta.url)).then(r => r.json()); LINES = j.subjects || []; } catch (e) { LINES = []; }
  try { PHOTOS = (await fetch(new URL("photos.json", import.meta.url)).then(r => r.json())).photos || {}; } catch (e) { PHOTOS = {}; }
  LINE_OF = Object.fromEntries(LINES.map(s => [s.key, s]));
  const st = fromStudio();
  for (const k of ["name", "phone", "site", "where", "line", "pair"]) if (!state[k] && st[k]) state[k] = st[k];
  if (!jget(STORE, null) && st.voice) state.voice = st.voice;
  $("pt-where").value = st.zip || st.home || "";
  if (!state.name && kitNow()) state.name = kitNow().name || "";
  // a logo made for gold is not a card that says WE BUY iPHONES: the kit's line leads (2026-11-25)
  const kc = kitNow() && kitNow().cat;
  if (kc && lineNow().cat !== kc && LINES.some(l => l.cat === kc)) state.line = LINES.find(l => l.cat === kc).key;
  fillForm(); drawControls(); bind(); bindDetails(); setMode(state.mode);
  await checkEntitled();
  // the gallery first; Customise is behind it, open where a card was picked before or the address asks for it
  if (state.chosen || /[?&]customise=1\b/.test(location.search)) $("cd-custom").hidden = false;
  await draw();
  $("cd-loading").hidden = true;
  drawGallery(false);
  if (window.pgfxAccount && window.pgfxAccount.onChange) window.pgfxAccount.onChange(async () => { await checkEntitled(); later(0); drawGallery(false); });
}

window.CardMaker = { state, render, pdfOf, printFile, FILLS: FILLS.map(x => x.key), newLook, photoOk, grounds: () => groundsShown().map(x => x.key),
  STYLES: STYLES.map(s => ({ key: s.key, name: s.name, layouts: s.layouts, pairs: s.pairs, voices: s.voices, grounds: s.grounds, frame: !!s.frame })), vividPair: k => vividPair(PAIR_OF[k]), kindOf, printLinks, draw, SHEET, TRIM, SAFE, BLEED, DPI, LAYOUTS: LAYOUTS.map(l => l.key), pairs: () => PAIRS.map(p => p.key), voices: () => VOICES.slice(),
  entitled: () => entitled, customise: () => customise(false), gallery: () => galDrawing, galleryLooks, kit: () => kitNow(), ready: null,
  mode: m => { if (m) setMode(m); return state.mode; }, brandChoice, brandDesign, brandDetails, CARD_LAYOUTS: CARD_LAYOUTS.map(l => l.key), CARD_GROUNDS: CARD_GROUNDS.map(g => g.key) };
window.CardMaker.ready = start().catch(e => { console.error("business card maker:", e); note("The card maker did not load. Reload the page.", true); });
