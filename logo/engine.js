/* ═══════════════════════════════════════════════════════════════════════════
   THE LOGO ENGINE (DESIGN-LAW 170). The owner, 2026-11-24: "I don't see anywhere to generate logos
   or business cards. We should have business assets generable ... but they need to be good, very,
   very good", and "that's something you would probably be paying for".

   A logo here is a hand-designed layout (a seal, a coin, a crest, a stamp, a tag, a ribbon, a
   monogram, a wordmark: the looks buying shops wear) set in the customer's own words, in one of the
   site's vetted type pairs (voices.js) and one of the house colour pairs (motion/house-colours.js),
   with an optional symbol from the house icon set (icons.js). No lettering is drawn by a model: every
   word is the face's own outlines (glyphs/<face>.js, from scripts/build_logo_glyphs.mjs), laid out
   here with the face's kerning, so the file is a true vector that prints and scales as it is.

   Pure: no DOM, no fetch. The page (logo/logo.js) and the function that draws a paid file
   (netlify/lib/logos.mjs) both call it with the faces loaded, so the file a customer pays for is the
   preview they picked, drawn by the server.

     logoSvg(design, faces, { form, mode, bg })   one logo as SVG: form "primary" (the layout),
                                                  "horizontal" (its mark and the name side by side)
                                                  or "mark" (the mark alone); mode "colour",
                                                  "transparent", "black" or "white"
     profileSvg / coverSvg                        the profile picture and the Facebook cover
     gallery(input, { seed, n })                  the finished logos to pick from, varied by rule
     variants(design, axis)                       the same logo in other colours, type or symbols
     cleanDesign(d)                               a design held to what the engine draws (the server)
   ═══════════════════════════════════════════════════════════════════════════ */
import { HOUSE_COLOURS } from "../motion/house-colours.js";
import { LOGO_VOICES } from "./voices.js";
import { LOGO_ICONS, ICONS_FOR } from "./icons.js";

export { LOGO_VOICES, LOGO_ICONS, ICONS_FOR };
export const ENGINE_VERSION = 1;

/* ---------- colour ---------- */
const PAIR_OF = Object.fromEntries(HOUSE_COLOURS.map(c => [c.key, c]));
/** The pairs a logo wears: the house pairs with two or three clear colours, no twins (a twin is one
 *  scheme with an earlier pair), and none whose colours sit too close to make a mark (checked in
 *  paletteOf). Dark, light and vivid grounds, so a gallery is never one mood. */
export const LOGO_PAIRS = ["navy_gold", "navy_orange", "midnight_cyan", "blue_green", "green_gold", "purple_gold", "teal_orange", "red_yellow",
  "black_gold", "black_red", "black_green", "silver_blue", "yellow_on_black", "black_on_yellow", "white_on_red", "white_on_blue", "white_on_navy",
  "white_on_green", "black_on_orange", "white_on_pink", "white_on_teal", "white_on_violet", "black_on_lime", "black_on_aqua", "red_white_blue",
  "navy_white_red", "black_white_orange", "electric_blue_white_orange", "cream_red", "mint_green", "sky_cobalt", "lavender_violet", "lemon_blue",
  "sand_teal", "arctic_teal", "bone_purple", "white_pink", "black_pink", "black_lime", "black_cyan", "black_violet", "teal_pink",
  "hot_pink_black_cobalt", "yellow_black_magenta", "mint_black_violet", "orange_black_cobalt", "red_on_white", "black_on_white"].filter(k => PAIR_OF[k] && !PAIR_OF[k].twin);

const rgbOf = h => [1, 3, 5].map(i => parseInt(String(h).slice(i, i + 2), 16));
const lin = v => (v /= 255) <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
export const lumOf = h => { const [r, g, b] = rgbOf(h); return .2126 * lin(r) + .7152 * lin(g) + .0722 * lin(b); };
export const contrast = (a, b) => { const x = lumOf(a), y = lumOf(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
const hx = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
export const mixHex = (a, b, t) => { const A = rgbOf(a), B = rgbOf(b); return "#" + A.map((v, i) => hx(v + (B[i] - v) * t)).join(""); };
const bw = g => contrast("#ffffff", g) >= contrast("#111214", g) ? "#ffffff" : "#111214";

/** A pair as the logo's roles: G the ground, I the words on it (4.5:1), A the accent on it (3:1, or
 *  the words' colour), P a plate (a bar, a ribbon, a tag) that stands off the ground, Q the words on the
 *  plate (4.5:1), S the plate's fold (a shade of it), L the ground's own light tone. */
export function paletteOf(key) {
  const p = PAIR_OF[key] || PAIR_OF.navy_gold, c = p.colors, G = c.ground;
  const I = contrast(c.ink, G) >= 4.5 ? c.ink : bw(G);
  const A = contrast(c.accent, G) >= 3 ? c.accent : I;
  const P = contrast(c.plate, G) >= 2 ? c.plate : A;
  const Q = contrast(c.plate_ink, P) >= 4.5 ? c.plate_ink : bw(P);
  const S = mixHex(P, "#000000", lumOf(P) > .5 ? .3 : .38), T = mixHex(P, "#000000", .55);
  const L = c.light && contrast(c.light, G) < 2.2 ? c.light : mixHex(G, I, .14);
  return { key: p.key, name: p.name, G, I, A, P, Q, S, T, L, dark: lumOf(G) < .18, look: p.look };
}

/* ---------- the words ---------- */
const GENERIC = new Set(("BUYERS BUYER BUY BUYS BUYING CASH CO CO. COMPANY INC INC. LLC EXCHANGE TRADING TRADERS TRADE ELECTRONICS WIRELESS MOBILE " +
  "MOBILES PAWN SHOP STORE GOLD SILVER COINS COIN CARDS CARD PHONES PHONE CELL AUTO AUTOS MOTORS CARS DEALS OUTLET DEPOT HUB LAB PLUS PRO GROUP TECH " +
  "REPAIR REPAIRS BUYBACK BUYBACKS BULLION JEWELRY JEWELERS JEWELLERS GAMES GAMING COLLECTIBLES COLLECTABLES SUPPLY SUPPLIES DEVICES GADGETS " +
  "RECYCLING RECYCLERS RESALE RESELLERS LOANS").split(" "));
const STOP = new Set(["THE", "OF", "AND", "&", "A", "AN", "LLC", "INC", "INC.", "CO", "CO.", "WE"]);
/** what a logo says for each line Easy Mode lists (app.js CATS): generic, never another firm's name */
export const LINE_WORDS = { phones: "PHONES", gaming: "GAMES & CONSOLES", gold: "GOLD & JEWELRY", coins: "COINS", pokemon: "TRADING CARDS",
  silver: "SILVER", cars: "CARS & TRUCKS", sports: "SPORTS CARDS", computers: "COMPUTERS", audio: "AUDIO & HEADPHONES", wearables: "WATCHES",
  cameras: "CAMERAS & DRONES", strips: "TEST STRIPS" };
export const LINES = Object.keys(LINE_WORDS);
const up = s => String(s || "").toUpperCase().replace(/\bIPHONE/g, "iPHONE").replace(/\bIPAD/g, "iPAD").replace(/\bIMAC/g, "iMAC");
const titleCase = s => String(s || "").split(/(\s+)/).map(w => /^\s+$/.test(w) || !w ? w : w === w.toUpperCase() && w.length <= 3 ? w : w[0].toUpperCase() + w.slice(1).toLowerCase()).join("");
const tidy = s => String(s || "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim();

/** The name as a logo reads it: the whole, its lead (what is its own) and its trail (the generic words
 *  after it: LONG BEACH / PHONE BUYERS), and the initials a monogram sets. */
export function partsOf(raw, script = false) {
  const name = tidy(raw) || "Your Business";
  const set = script ? titleCase(name) : up(name), words = set.split(" ");
  const bare = w => w.toUpperCase().replace(/[^A-Z0-9&.]/g, "");
  let cut = -1;
  for (let i = 1; i < words.length; i++) if (GENERIC.has(bare(words[i])) && words.slice(0, i).some(w => !STOP.has(bare(w)))) { cut = i; break; }
  const lead = cut > 0 ? words.slice(0, cut).join(" ") : set, trail = cut > 0 ? words.slice(cut).join(" ") : "";
  const sig = (cut > 0 && cut >= 2 ? words.slice(0, cut) : words).filter(w => !STOP.has(bare(w)) && /[A-Za-z0-9]/.test(w));
  let init;
  if (sig.length === 1) { const b = bare(sig[0]).replace(/[^A-Z0-9]/g, ""); init = b.length <= 3 && sig[0] === sig[0].toUpperCase() ? b : b.slice(0, 1); }
  else init = sig.slice(0, 2).map(w => bare(w).replace(/[^A-Z0-9]/g, "").slice(0, 1)).join("");
  return { full: set, lead, trail, init: init || "W", words };
}

/* ---------- the type: outlines laid out with the face's own kerning ---------- */
/** a glyph of a face, or of the pair's reading face, or nothing (a name never shows a box) */
function glyph(F, ch, alt) {
  return (F && F.g[ch]) || (alt && alt.g[ch]) || (ch === "’" && F && F.g["'"]) || (ch === "•" && F && F.g["·"]) || null;
}
/** a run of text in a face on its 1000 em: each glyph's place, the advance and the ink box */
function shapeRun(F, str, track = 0, alt = null) {
  const out = []; let x = 0, prev = "", x0 = Infinity, x1 = -Infinity, top = 0, bot = 0;
  for (const ch of String(str)) {
    const g = glyph(F, ch, alt); if (!g) continue;
    if (prev) x += ((F.k && F.k[prev + ch]) || 0) + track * 1000;
    out.push({ ch, g, x });
    if (g[5]) { x0 = Math.min(x0, x + g[1]); x1 = Math.max(x1, x + g[3]); top = Math.min(top, g[2]); bot = Math.max(bot, g[4]); }
    x += g[0]; prev = ch;
  }
  if (x0 === Infinity) { x0 = 0; x1 = 0; }
  return { gl: out, adv: x, x0, x1, top, bot, w: x1 - x0 };
}
const M0 = /^m(-?\d+),?(-?\d+)/;
/** a glyph's outline with its first move made absolute at (ox, 0) on the em */
const glyphD = (g, ox = 0) => g[5] ? g[5].replace(M0, (m, a, b) => "M" + (+a + ox) + "," + b) : "";
const f1 = v => Math.round(v * 10) / 10;

/** A line of text: an item and its ink box. align by the ink, never the advance (an optical edge). */
function textLine(F, str, size, x, y, { align = "center", track = 0, fill = "I", tone = 1, alt = null } = {}) {
  const S = shapeRun(F, str, track, alt), k = size / 1000;
  const ox = align === "left" ? x - S.x0 * k : align === "right" ? x - S.x1 * k : x - (S.x0 + S.x1) / 2 * k;
  const d = S.gl.map(o => glyphD(o.g, o.x)).join("");
  const item = d ? { d, tf: `translate(${f1(ox)} ${f1(y)}) scale(${+k.toFixed(5)})`, fill, tone } : null;
  return { item, box: { x0: ox + S.x0 * k, x1: ox + S.x1 * k, top: y + S.top * k, bot: y + S.bot * k }, size };
}
/** the size at which a line's ink fits w and its capitals are at most cap high */
function fitSize(F, str, w, cap, track = 0, alt = null) {
  const S = shapeRun(F, str, track, alt);
  return Math.min(cap / (F.cap || 700) * 1000, S.w > 0 ? w / S.w * 1000 : Infinity);
}
const capOf = (F, size) => (F.cap || 700) * size / 1000;
/** The best way to set words in a box of w × h: one line, two or three broken where they read best.
 *  Fewer lines win unless more buy a real gain in size. */
function fitBlock(F, str, w, h, { maxLines = 2, lead = 1.3, track = 0, capMax = Infinity, alt = null, one = 1.16 } = {}) {
  const words = String(str).split(" ").filter(Boolean), cands = [[words.join(" ")]];
  if (maxLines >= 2 && words.length >= 2) for (let i = 1; i < words.length; i++) cands.push([words.slice(0, i).join(" "), words.slice(i).join(" ")]);
  if (maxLines >= 3 && words.length >= 3) for (let i = 1; i < words.length - 1; i++) for (let j = i + 1; j < words.length; j++)
    cands.push([words.slice(0, i).join(" "), words.slice(i, j).join(" "), words.slice(j).join(" ")]);
  let best = null;
  for (const lines of cands) {
    const n = lines.length, capH = Math.min(capMax, h / (n + (n - 1) * (lead - 1)));
    const size = Math.min(...lines.map(l => fitSize(F, l, w, capH, track, alt)));
    const widths = lines.map(l => shapeRun(F, l, track, alt).w), spread = Math.max(...widths) / Math.max(1, Math.min(...widths));
    const score = size * (n === 1 ? one : n === 2 ? 1 : .9) / (1 + Math.max(0, spread - 1.6) * .15);
    if (!best || score > best.score) best = { lines, size, score, n };
  }
  return best;
}
/** a block of lines centred on (x, cy) by its capitals, pitch lead × the capital height */
function drawBlock(items, F, B, x, cy, { align = "center", lead = 1.3, track = 0, fill = "I", tone = 1, alt = null } = {}) {
  const c = capOf(F, B.size), pitch = c * lead, total = c + pitch * (B.lines.length - 1);
  let y = cy - total / 2 + c, box = null;
  for (const l of B.lines) {
    const t = textLine(F, l, B.size, x, y, { align, track, fill, tone, alt });
    if (t.item) items.push(t.item);
    box = box ? { x0: Math.min(box.x0, t.box.x0), x1: Math.max(box.x1, t.box.x1), top: Math.min(box.top, t.box.top), bot: Math.max(box.bot, t.box.bot) } : t.box;
    y += pitch;
  }
  return Object.assign(box || { x0: x, x1: x, top: cy, bot: cy }, { cap: c, top0: cy - total / 2, bot0: cy + total / 2 });
}
/** Text round a circle: dir 1 along the top (reading clockwise, letters outward), -1 along the foot
 *  (reading left to right, letters toward the centre). Spaced on the letters' middle radius. */
function arcText(items, F, str, size, cx, cy, r, { dir = 1, at = dir > 0 ? 0 : 180, track = 0, fill = "I", tone = 1, alt = null } = {}) {
  const S = shapeRun(F, str, track, alt), k = size / 1000, capH = capOf(F, size), rm = dir > 0 ? r + capH / 2 : r - capH / 2;
  const span = S.adv * k / rm;
  for (const o of S.gl) {
    if (!o.g[5]) continue;
    const u = (o.x + o.g[0] / 2) * k, phi = at * Math.PI / 180 + dir * (-span / 2 + u / rm);
    const X = cx + r * Math.sin(phi), Y = cy - r * Math.cos(phi), rot = phi * 180 / Math.PI - (dir > 0 ? 0 : 180);
    items.push({ d: glyphD(o.g, 0), tf: `translate(${f1(X)} ${f1(Y)}) rotate(${f1(rot)}) scale(${+k.toFixed(5)}) translate(${-Math.round(o.g[0] / 2)} 0)`, fill, tone });
  }
  return span * 180 / Math.PI;
}
/** the size at which text round a circle spans at most maxDeg, capitals at most cap high */
function arcFit(F, str, r, maxDeg, cap, dir = 1, track = 0, alt = null) {
  const S = shapeRun(F, str, track, alt);
  let size = cap / (F.cap || 700) * 1000;
  for (let i = 0; i < 6; i++) {
    const rm = dir > 0 ? r + capOf(F, size) / 2 : r - capOf(F, size) / 2, span = S.adv * size / 1000 / rm * 180 / Math.PI;
    if (span <= maxDeg) break;
    size *= maxDeg / span;
  }
  return size;
}

/* ---------- shapes ---------- */
const circleD = (cx, cy, r) => `M${f1(cx - r)},${f1(cy)}a${f1(r)},${f1(r)} 0 1,0 ${f1(2 * r)},0a${f1(r)},${f1(r)} 0 1,0 ${f1(-2 * r)},0Z`;
const rectD = (x, y, w, h, r = 0) => {
  r = Math.min(r, w / 2, h / 2);
  return r ? `M${f1(x + r)},${f1(y)}H${f1(x + w - r)}A${f1(r)},${f1(r)} 0 0 1 ${f1(x + w)},${f1(y + r)}V${f1(y + h - r)}A${f1(r)},${f1(r)} 0 0 1 ${f1(x + w - r)},${f1(y + h)}H${f1(x + r)}A${f1(r)},${f1(r)} 0 0 1 ${f1(x)},${f1(y + h - r)}V${f1(y + r)}A${f1(r)},${f1(r)} 0 0 1 ${f1(x + r)},${f1(y)}Z`
    : `M${f1(x)},${f1(y)}H${f1(x + w)}V${f1(y + h)}H${f1(x)}Z`;
};
const polyD = pts => "M" + pts.map(([x, y]) => f1(x) + "," + f1(y)).join("L") + "Z";
const starPts = (cx, cy, r, n = 5, inner = .42, rot = 0) => Array.from({ length: n * 2 }, (_, i) => {
  const a = rot + i * Math.PI / n, rr = i % 2 ? r * inner : r; return [cx + rr * Math.sin(a), cy - rr * Math.cos(a)];
});
const starD = (cx, cy, r, n = 5, inner = .42, rot = 0) => polyD(starPts(cx, cy, r, n, inner, rot));
const hexPts = (cx, cy, r) => Array.from({ length: 6 }, (_, i) => [cx + r * Math.sin(i * Math.PI / 3), cy - r * Math.cos(i * Math.PI / 3)]);
/** a heater shield in a w × h box at (x, y) */
const shieldD = (x, y, w, h) => `M${f1(x)},${f1(y)}H${f1(x + w)}V${f1(y + h * .52)}C${f1(x + w)},${f1(y + h * .78)} ${f1(x + w * .72)},${f1(y + h * .92)} ${f1(x + w / 2)},${f1(y + h)}C${f1(x + w * .28)},${f1(y + h * .92)} ${f1(x)},${f1(y + h * .78)} ${f1(x)},${f1(y + h * .52)}Z`;
/** an icon of the set, its 100-unit box centred on (cx, cy) at s across */
function iconItem(key, cx, cy, s, stroke = "A", tone = 1, sw = 7) {
  const ic = LOGO_ICONS[key]; if (!ic) return null;
  const k = s / 100;
  return { d: ic[0], tf: `translate(${f1(cx - s / 2)} ${f1(cy - s / 2)}) scale(${+k.toFixed(4)})`, stroke, sw, tone, round: true };
}
const ring = (cx, cy, r, w, stroke = "A", tone = 0) => ({ d: circleD(cx, cy, r), stroke, sw: w, tone });
const dot = (cx, cy, r, fill = "A", tone = 0) => ({ d: circleD(cx, cy, r), fill, tone });

/* ---------- the layouts ---------- */
/* Each layout draws a design into items on its own artboard and says whether every word kept a size a
   logo is read at (ok). The voice kinds it takes: a script face never goes round a ring. */
const RING_KINDS = ["condensed", "wide", "grotesk", "display", "serif"];
const ANY_KIND = [...RING_KINDS, "script"];

/** The things a layout works with: the faces, the palette, the words */
function ctxOf(d, faces) {
  const V = LOGO_VOICES[d.voice] || LOGO_VOICES.bold, D = faces[V.display], Lb = faces[V.label] || D;
  if (!D) throw new Error("The face " + V.display + " is not loaded");
  const script = V.kind === "script", N = partsOf(d.name, script);
  const small = up(tidy(d.small) || "WE BUY " + (LINE_WORDS[d.cat] || "PHONES"));
  const town = up(tidy(d.town));
  return { d, V, D, Lb, N, small, town, P: paletteOf(d.pair), icon: LOGO_ICONS[d.icon] ? d.icon : "", R: rng((d.seed | 0) * 2654435761 >>> 0), script };
}
const MIN_CAP = 46;   // a name's capitals, on the 1000 unit artboard: under this it is not a logo's name

const LAYOUTS = {
  /* A round seal: the name round the top, the small line round the foot, stars between, and the
     symbol or the initials in the middle. */
  seal: { name: "Seal", group: "badge", shape: "circle", kinds: RING_KINDS, draw(c) {
    const it = [], cx = 500, cy = 500, { D, Lb, N } = c, thick = c.d.seed % 2 === 0;
    it.push({ d: circleD(cx, cy, 492), fill: "G", tone: 1 });
    it.push(ring(cx, cy, 472, thick ? 22 : 12));
    if (!thick) it.push(ring(cx, cy, 448, 4));
    it.push(ring(cx, cy, 330, 7));
    // the whole name round the top where it fits in 200 degrees at a good size; else its lead round the top and
    // its trail round the foot, and the small line moves into the middle
    let top = N.full, bottom = c.small, mid = "", s = arcFit(D, top, 358, 200, 92, 1, .03);
    if (capOf(D, s) < 66 && N.trail) { top = N.lead; bottom = N.trail; mid = c.small; s = arcFit(D, top, 358, 200, 92, 1, .03); }
    const span = arcText(it, D, top, s, cx, cy, 358, { dir: 1, track: .03, fill: "I", tone: 0 });
    const bF = mid ? D : Lb, bTrack = mid ? .05 : .14, bR = mid ? 436 : 432;
    const bs = arcFit(bF, bottom, bR, mid ? 120 : 112, mid ? Math.min(62, capOf(D, s) * .8) : 40, -1, bTrack);
    const bSpan = arcText(it, bF, bottom, bs, cx, cy, bR, { dir: -1, track: bTrack, fill: mid ? "I" : "A", tone: 0 });
    // the stars sit in the middle of the gaps between the two lines
    const gap = (360 - span - bSpan) / 2, at = span / 2 + gap / 2;
    if (gap > 14) for (const a of [at, -at]) { const r = a * Math.PI / 180; it.push({ d: starD(cx + 398 * Math.sin(r), cy - 398 * Math.cos(r), 20, 5, .42, r), fill: "A", tone: 0 }); }
    const midS = mid ? fitSize(Lb, mid, 400, 30, .18) : 0, lift = mid ? 34 : 0;
    if (c.icon) it.push(iconItem(c.icon, cx, cy - 10 - lift, mid ? 270 : 330, "A", 0, 7));
    else {
      const ms = fitSize(D, N.init, 400, mid ? 170 : 210);
      it.push(textLine(D, N.init, ms, cx, cy + capOf(D, ms) / 2 - lift, { fill: "I", tone: 0 }).item);
      if (!mid) it.push({ d: rectD(cx - 70, cy + capOf(D, ms) / 2 + 34, 140, 8, 4), fill: "A", tone: 0 });
    }
    if (mid) it.push(textLine(Lb, mid, midS, cx, cy + 170 + capOf(Lb, midS) / 2, { track: .18, fill: "A", tone: 0 }).item);
    return { w: 1000, h: 1000, it, ok: capOf(D, s) >= MIN_CAP && capOf(bF, bs) >= 24 };
  } },

  /* A coin: a reeded edge, a ring of beads, the name round the top, the initials struck in the middle. */
  coin: { name: "Coin", group: "badge", shape: "circle", kinds: ["serif", "condensed", "display", "grotesk", "wide"], cats: ["gold", "silver", "coins", "pokemon", "sports", "wearables"], draw(c) {
    const it = [], cx = 500, cy = 500, { D, Lb, N } = c;
    it.push({ d: circleD(cx, cy, 494), fill: "G", tone: 1 });
    for (let i = 0; i < 150; i++) {
      const a = i / 150 * Math.PI * 2, s = Math.sin(a), co = Math.cos(a);
      it.push({ d: `M${f1(cx + 462 * s)},${f1(cy - 462 * co)}L${f1(cx + 488 * s)},${f1(cy - 488 * co)}`, stroke: "A", sw: 7, tone: 0, round: true });
    }
    it.push(ring(cx, cy, 446, 10));
    for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2; it.push(dot(cx + 312 * Math.sin(a), cy - 312 * Math.cos(a), 6.5)); }
    let top = N.full, s = arcFit(D, top, 340, 220, 74, 1, .04), bottom = c.small;
    if (capOf(D, s) < 56 && N.trail) { top = N.lead; bottom = N.trail; s = arcFit(D, top, 340, 220, 74, 1, .04); }
    const span = arcText(it, D, top, s, cx, cy, 340, { dir: 1, track: .04, fill: "I", tone: 0 });
    const bs = arcFit(Lb, bottom, 412, 104, 36, -1, .16);
    arcText(it, Lb, bottom, bs, cx, cy, 412, { dir: -1, track: .16, fill: "A", tone: 0 });
    const gap = Math.max(span / 2 + 10, 120);
    for (const a of [gap, -gap]) { const r = a * Math.PI / 180; it.push(dot(cx + 377 * Math.sin(r), cy - 377 * Math.cos(r), 9)); }
    if (c.icon && c.d.seed % 3 === 0) it.push(iconItem(c.icon, cx, cy, 270, "A", 0, 7));
    else {
      const ms = fitSize(D, N.init, 380, 200, .02);
      it.push(textLine(D, N.init, ms, cx, cy + capOf(D, ms) / 2, { fill: "A", tone: 0, track: .02 }).item);
      it.push({ d: starD(cx, cy - capOf(D, ms) / 2 - 58, 18), fill: "A", tone: 0 });
      it.push({ d: starD(cx, cy + capOf(D, ms) / 2 + 58, 18), fill: "A", tone: 0 });
    }
    return { w: 1000, h: 1000, it, ok: capOf(D, s) >= MIN_CAP };
  } },

  /* The emblem with a bar: a ringed circle, the name on a solid bar across it and past its edges, the
     symbol above and the small line below. */
  emblem: { name: "Emblem", group: "badge", shape: "circle", kinds: ["condensed", "wide", "display", "grotesk", "serif"], draw(c) {
    const it = [], cx = 620, cy = 500, { D, Lb, N } = c;
    it.push({ d: circleD(cx, cy, 440), fill: "G", tone: 1 });
    it.push(ring(cx, cy, 440, 20, "A", 0));
    it.push(ring(cx, cy, 404, 6, "A", 0));
    // the name's lead on the bar, as large as the bar takes; the trail and the small line under it
    const onBar = N.trail ? N.lead : N.full;
    const B = fitBlock(D, onBar, 1040, 200, { maxLines: 2, lead: 1.14, track: .01, capMax: 150, one: 1.3 });
    const capH = capOf(D, B.size), bh = capH * (1 + (B.n - 1) * 1.14) + 96, by = cy - 10 - bh / 2;
    it.push({ d: rectD(60, by, 1120, bh, 14), fill: "P", tone: 1 });
    it.push({ d: rectD(60, by, 1120, bh, 14), stroke: "G", sw: 14, tone: 0 });
    it.push({ d: rectD(78, by + 18, 1084, bh - 36, 8), stroke: "Q", sw: 3, tone: 0 });
    drawBlock(it, D, B, cx, by + bh / 2, { lead: 1.14, track: .01, fill: "Q", tone: 0 });
    if (c.icon) it.push(iconItem(c.icon, cx, by - 140, 180, "A", 0, 7));
    else for (const dx of [-70, 0, 70]) it.push({ d: starD(cx + dx, by - 100 - (dx ? 0 : 22), dx ? 26 : 38), fill: "A", tone: 0 });
    let y = by + bh + 44;
    if (N.trail) {
      const ts = fitSize(Lb, N.trail, 560, 56, .12);
      y += capOf(Lb, ts); it.push(textLine(Lb, N.trail, ts, cx, y, { track: .12, fill: "I", tone: 0 }).item); y += 34;
    }
    const ss = fitSize(Lb, c.small, N.trail ? 420 : 520, N.trail ? 28 : 40, .18);
    it.push(textLine(Lb, c.small, ss, cx, y + 8 + capOf(Lb, ss), { track: .18, fill: N.trail ? "A" : "I", tone: 0 }).item);
    return { w: 1240, h: 1000, it, ok: capH >= MIN_CAP };
  } },

  /* A crest: a heater shield, the symbol in its head, the name on a ribbon across it with folded tails. */
  crest: { name: "Crest", group: "badge", shape: "shield", kinds: ["condensed", "serif", "display", "wide", "grotesk"], draw(c) {
    const it = [], { D, Lb, N } = c, x = 150, y = 40, w = 700, h = 900;
    it.push({ d: shieldD(x, y, w, h), fill: "G", tone: 1 });
    it.push({ d: shieldD(x, y, w, h), stroke: "A", sw: 20, tone: 0 });
    it.push({ d: shieldD(x + 34, y + 34, w - 68, h - 80), stroke: "A", sw: 5, tone: 0 });
    const B = fitBlock(D, N.lead, 820, 150, { maxLines: 2, lead: 1.2, capMax: 118 });
    const capH = capOf(D, B.size), rh = capH * (1 + (B.n - 1) * 1.2) + 90, ry = 480;
    // the tails, behind the band: a notch at each end and the fold that tucks under
    it.push({ d: polyD([[110, ry + 40], [20, ry + 40], [70, ry + 40 + rh / 2], [20, ry + 40 + rh], [110, ry + 40 + rh]]), fill: "S", tone: 1 });
    it.push({ d: polyD([[890, ry + 40], [980, ry + 40], [930, ry + 40 + rh / 2], [980, ry + 40 + rh], [890, ry + 40 + rh]]), fill: "S", tone: 1 });
    it.push({ d: polyD([[80, ry + rh], [110, ry + rh + 40], [110, ry + rh]]), fill: "T", tone: 0 });
    it.push({ d: polyD([[920, ry + rh], [890, ry + rh + 40], [890, ry + rh]]), fill: "T", tone: 0 });
    it.push({ d: rectD(80, ry, 840, rh), fill: "P", tone: 1 });
    it.push({ d: rectD(80, ry, 840, rh), stroke: "G", sw: 10, tone: 0 });
    drawBlock(it, D, B, 500, ry + rh / 2, { lead: 1.2, fill: "Q", tone: 0 });
    if (c.icon) it.push(iconItem(c.icon, 500, 270, 260, "A", 0, 7));
    else { const ms = fitSize(D, N.init, 360, 190); it.push(textLine(D, N.init, ms, 500, 270 + capOf(D, ms) / 2, { fill: "A", tone: 0 }).item); }
    const foot = N.trail || c.small, fs = fitSize(Lb, foot, 460, 44, .12);
    it.push(textLine(Lb, foot, fs, 500, ry + rh + 80 + capOf(Lb, fs), { track: .12, fill: "I", tone: 0 }).item);
    if (N.trail) { const s2 = fitSize(Lb, c.small, 300, 26, .14); it.push(textLine(Lb, c.small, s2, 500, ry + rh + 80 + capOf(Lb, fs) + 36 + capOf(Lb, s2), { track: .14, fill: "A", tone: 0 }).item); }
    return { w: 1000, h: 1000, it, ok: capH >= MIN_CAP };
  } },

  /* A stamp: a double frame, the small line on a rule at the head, the name filling the middle, the
     town or what is bought at the foot between stars. */
  stamp: { name: "Stamp", group: "badge", shape: "square", kinds: ["condensed", "wide", "display", "grotesk", "serif"], draw(c) {
    const it = [], { D, Lb, N } = c, W = 1400, H = 860;
    it.push({ d: rectD(20, 20, W - 40, H - 40, 36), fill: "G", tone: 1 });
    it.push({ d: rectD(20, 20, W - 40, H - 40, 36), stroke: "A", sw: 18, tone: 0 });
    it.push({ d: rectD(58, 58, W - 116, H - 116, 18), stroke: "A", sw: 5, tone: 0 });
    const head = c.small, hs = fitSize(Lb, head, 760, 40, .2);
    const ht = textLine(Lb, head, hs, W / 2, 150 + capOf(Lb, hs) / 2, { track: .2, fill: "A", tone: 0 }); it.push(ht.item);
    for (const s of [-1, 1]) { const x0 = s < 0 ? 130 : ht.box.x1 + 30, x1 = s < 0 ? ht.box.x0 - 30 : W - 130; if (x1 - x0 > 30) it.push({ d: rectD(x0, 150 - 3, x1 - x0, 6, 3), fill: "A", tone: 0 }); }
    const B = fitBlock(D, N.full, 1160, 400, { maxLines: 2, lead: 1.16, track: .01, capMax: 230 });
    const bx = drawBlock(it, D, B, W / 2, 445, { lead: 1.16, track: .01, fill: "I", tone: 0 });
    const foot = c.town || (LINE_WORDS[c.d.cat] ? "CASH PAID TODAY" : "CASH PAID"), fs = fitSize(Lb, foot, 640, 34, .2);
    const ft = textLine(Lb, foot, fs, W / 2, 712 + capOf(Lb, fs) / 2, { track: .2, fill: "I", tone: 0 }); it.push(ft.item);
    for (const x of [ft.box.x0 - 42, ft.box.x1 + 42]) it.push({ d: starD(x, 712, 17), fill: "A", tone: 0 });
    return { w: W, h: H, it, ok: bx.cap >= MIN_CAP * 1.3 };
  } },

  /* A price tag: a tag with a hole and a stitched edge, the name on it. A buyer's own shape. */
  tag: { name: "Tag", group: "badge", shape: "square", kinds: ["condensed", "wide", "display", "grotesk", "script"], draw(c) {
    const it = [], { D, Lb, N } = c, W = 1500, H = 760;
    const tag = `M260,60H1400Q1460,60 1460,120V640Q1460,700 1400,700H260Q236,700 218,684L58,412Q40,380 58,348L218,76Q236,60 260,60Z`;
    it.push({ d: tag + circleD(220, 380, 44), fill: "P", tone: 1, rule: "evenodd" });
    it.push({ d: `M266,96H1390Q1424,96 1424,130V630Q1424,664 1390,664H266Q252,664 242,654L94,404Q82,380 94,356L242,106Q252,96 266,96Z`, stroke: "Q", sw: 5, tone: 0, dash: "22 14" });
    it.push({ d: circleD(220, 380, 44), stroke: "Q", sw: 5, tone: 0 });
    const B = fitBlock(D, N.full, 1000, 360, { maxLines: 2, lead: 1.14, capMax: 200 });
    const bx = drawBlock(it, D, B, 860, 330, { lead: 1.14, fill: "Q", tone: 0 });
    const ss = fitSize(Lb, c.small, 900, 38, .16);
    it.push(textLine(Lb, c.small, ss, 860, Math.max(bx.bot0 + 60, 560) + capOf(Lb, ss), { track: .16, fill: "Q", tone: 0 }).item);
    return { w: W, h: H, it, ok: bx.cap >= MIN_CAP * 1.2 };
  } },

  /* A ribbon: the name on a banner with notched tails, the small line over it between stars, the town
     or the trail under it. */
  ribbon: { name: "Ribbon", group: "badge", shape: "square", kinds: ["condensed", "wide", "display", "serif", "grotesk"], draw(c) {
    const it = [], { D, Lb, N } = c, W = 1600;
    const B = fitBlock(D, N.full, 1120, 240, { maxLines: 2, lead: 1.16, capMax: 150, one: 1 });
    const capH = capOf(D, B.size), bh = capH * (1 + (B.n - 1) * 1.16) + 120, y0 = 230, y1 = y0 + bh;
    const tail = 70;
    const mid = y0 + tail + bh / 2;
    it.push({ d: polyD([[250, y0 + tail], [30, y0 + tail], [110, mid], [30, y1 + tail], [250, y1 + tail]]), fill: "S", tone: 1 });
    it.push({ d: polyD([[1350, y0 + tail], [1570, y0 + tail], [1490, mid], [1570, y1 + tail], [1350, y1 + tail]]), fill: "S", tone: 1 });
    it.push({ d: polyD([[180, y1], [250, y1 + tail], [250, y1]]), fill: "T", tone: 0 });
    it.push({ d: polyD([[1420, y1], [1350, y1 + tail], [1350, y1]]), fill: "T", tone: 0 });
    it.push({ d: rectD(180, y0, 1240, bh), fill: "P", tone: 1 });
    it.push({ d: `M180,${y0 + 22}H1420M180,${y1 - 22}H1420`, stroke: "Q", sw: 4, tone: 0 });
    drawBlock(it, D, B, 800, y0 + bh / 2, { lead: 1.16, fill: "Q", tone: 0 });
    const hs = fitSize(Lb, c.small, 820, 42, .2), ht = textLine(Lb, c.small, hs, 800, y0 - 62, { track: .2, fill: "A", tone: 1 }); it.push(ht.item);
    for (const x of [ht.box.x0 - 48, ht.box.x1 + 48]) it.push({ d: starD(x, y0 - 62 - capOf(Lb, hs) / 2, 19), fill: "A", tone: 1 });
    const foot = c.town || "CASH PAID TODAY", fs = fitSize(Lb, foot, 700, 34, .22);
    it.push(textLine(Lb, foot, fs, 800, y1 + tail + 60 + capOf(Lb, fs), { track: .22, fill: "I", tone: 1 }).item);
    return { w: W, h: y1 + tail + 140, it, ok: capH >= MIN_CAP };
  } },

  /* A hexagon: a double-ruled hex, the symbol at its head, the name across its waist. */
  hexagon: { name: "Hexagon", group: "badge", shape: "hex", kinds: ["condensed", "wide", "grotesk", "display"], draw(c) {
    const it = [], { D, Lb, N } = c, cx = 500, cy = 500;
    it.push({ d: polyD(hexPts(cx, cy, 486)), fill: "G", tone: 1 });
    it.push({ d: polyD(hexPts(cx, cy, 470)), stroke: "A", sw: 22, tone: 0 });
    it.push({ d: polyD(hexPts(cx, cy, 430)), stroke: "A", sw: 5, tone: 0 });
    const B = fitBlock(D, N.full, 640, 230, { maxLines: 2, lead: 1.16, capMax: 128 });
    const bx = drawBlock(it, D, B, cx, cy + 50, { lead: 1.16, fill: "I", tone: 0 });
    if (c.icon) it.push(iconItem(c.icon, cx, bx.top0 - 120, 170, "A", 0, 7.5));
    else { const ms = fitSize(D, N.init, 240, 110); it.push(textLine(D, N.init, ms, cx, bx.top0 - 75, { fill: "A", tone: 0 }).item); }
    const ss = fitSize(Lb, c.small, 440, 32, .16);
    const st = textLine(Lb, c.small, ss, cx, bx.bot0 + 70 + capOf(Lb, ss), { track: .16, fill: "A", tone: 0 }); it.push(st.item);
    it.push({ d: rectD(cx - 60, bx.bot0 + 34, 120, 6, 3), fill: "A", tone: 0 });
    return { w: 1000, h: 1000, it, ok: bx.cap >= MIN_CAP };
  } },

  /* A speech balloon with a hard comic shadow: the shop calling out. */
  balloon: { name: "Balloon", group: "badge", shape: "square", kinds: ["display", "condensed", "script", "wide"], draw(c) {
    const it = [], { D, Lb, N } = c, W = 1500, H = 960;
    // one outline: the balloon and its tail as a single path, so the ink line runs round both
    const body = (dx, dy) => { const x = 70 + dx, y = 60 + dy, w = 1340, h = 640, r = 150;
      return `M${x + r},${y}H${x + w - r}A${r},${r} 0 0 1 ${x + w},${y + r}V${y + h - r}A${r},${r} 0 0 1 ${x + w - r},${y + h}H${520 + dx}L${230 + dx},${900 + dy}L${330 + dx},${y + h}H${x + r}A${r},${r} 0 0 1 ${x},${y + h - r}V${y + r}A${r},${r} 0 0 1 ${x + r},${y}Z`; };
    it.push({ d: body(30, 30), fill: "I", tone: 1 });
    it.push({ d: body(0, 0), fill: "P", tone: 1 });
    it.push({ d: body(0, 0), stroke: "I", sw: 18, tone: 1, join: true });
    const B = fitBlock(D, N.full, 1100, 330, { maxLines: 2, lead: 1.12, capMax: 200 });
    const bx = drawBlock(it, D, B, 740, 330, { lead: 1.12, fill: "Q", tone: 0 });
    const ss = fitSize(Lb, c.small, 820, 40, .14);
    it.push(textLine(Lb, c.small, ss, 740, Math.max(bx.bot0 + 64, 540) + capOf(Lb, ss), { track: .14, fill: "Q", tone: 0 }).item);
    return { w: W + 20, h: H, it, ok: bx.cap >= MIN_CAP * 1.2 };
  } },

  /* A starburst sticker: a burst, a ringed disc in it, the small line and the name inside. */
  burst: { name: "Burst", group: "badge", shape: "circle", kinds: ["display", "condensed", "wide", "script"], draw(c) {
    const it = [], cx = 500, cy = 500, { D, Lb, N } = c;
    it.push({ d: starD(cx, cy, 496, 24, .86, c.d.seed % 2 ? 0 : Math.PI / 24), fill: "P", tone: 1 });
    it.push({ d: circleD(cx, cy, 380), fill: "G", tone: 0 });
    it.push(ring(cx, cy, 352, 8, "P", 1));
    const B = fitBlock(D, N.full, 560, 300, { maxLines: 3, lead: 1.12, capMax: 140 });
    const bx = drawBlock(it, D, B, cx, cy + 34, { lead: 1.12, fill: "I", tone: 1 });
    const ss = fitSize(Lb, c.small, 400, 32, .16);
    it.push(textLine(Lb, c.small, ss, cx, bx.top0 - 44, { track: .16, fill: "A", tone: 1 }).item);
    return { w: 1000, h: 1000, it, ok: bx.cap >= MIN_CAP };
  } },

  /* A licence plate, for cars: the town at its head, the name across it, four bolts. */
  plate: { name: "Plate", group: "badge", shape: "square", kinds: ["condensed", "wide", "grotesk", "display"], cats: ["cars"], draw(c) {
    const it = [], { D, Lb, N } = c, W = 1500, H = 760;
    it.push({ d: rectD(20, 20, W - 40, H - 40, 70), fill: "G", tone: 1 });
    it.push({ d: rectD(20, 20, W - 40, H - 40, 70), stroke: "I", sw: 16, tone: 0 });
    it.push({ d: rectD(64, 64, W - 128, H - 128, 40), stroke: "A", sw: 6, tone: 0 });
    for (const [x, y] of [[190, 120], [W - 190, 120], [190, H - 120], [W - 190, H - 120]]) { it.push(dot(x, y, 22, "L", 0)); it.push(ring(x, y, 22, 5, "I", 0)); }
    const head = c.town || "CASH FOR CARS", hs = fitSize(Lb, head, 760, 50, .22);
    it.push(textLine(Lb, head, hs, W / 2, 128 + capOf(Lb, hs) / 2, { track: .22, fill: "A", tone: 0 }).item);
    const B = fitBlock(D, N.full, 1200, 340, { maxLines: 2, lead: 1.12, track: .02, capMax: 260 });
    const bx = drawBlock(it, D, B, W / 2, 400, { lead: 1.12, track: .02, fill: "I", tone: 0 });
    const ss = fitSize(Lb, c.small, 700, 36, .2);
    it.push(textLine(Lb, c.small, ss, W / 2, 652 + capOf(Lb, ss) / 2, { track: .2, fill: "A", tone: 0 }).item);
    return { w: W, h: H, it, ok: bx.cap >= MIN_CAP * 1.3 };
  } },

  /* A stacked wordmark: the symbol, the name large, its trail tracked out between rules. */
  stacked: { name: "Stacked", group: "wordmark", shape: "circle", kinds: ANY_KIND, draw(c) {
    const it = [], { D, Lb, N } = c, W = 1400;
    let y = 40;
    if (c.icon) { it.push(iconItem(c.icon, W / 2, y + 90, 180, "A", 1, 7)); y += 210; }
    const B = fitBlock(D, N.trail ? N.lead : N.full, 1300, 360, { maxLines: 2, lead: c.script ? 1.05 : 1.14, capMax: 250 });
    const bx = drawBlock(it, D, B, W / 2, y + capOf(D, B.size) * (1 + (B.n - 1) * 1.14) / 2, { lead: c.script ? 1.05 : 1.14, fill: "I", tone: 1 });
    y = Math.max(bx.bot, bx.bot0) + 70;
    const sub = N.trail || c.small, ss = fitSize(Lb, sub, 860, 56, .32);
    const st = textLine(Lb, sub, ss, W / 2, y + capOf(Lb, ss), { track: .32, fill: "A", tone: 1 }); it.push(st.item);
    const ry = y + capOf(Lb, ss) / 2, rl = Math.min(240, (bx.x1 - bx.x0 - (st.box.x1 - st.box.x0)) / 2 - 40);
    if (rl > 40) for (const s of [-1, 1]) it.push({ d: rectD(s < 0 ? st.box.x0 - 40 - rl : st.box.x1 + 40, ry - 4, rl, 8, 4), fill: "A", tone: 1 });
    y += capOf(Lb, ss) + 30;
    if (N.trail) { const s2 = fitSize(Lb, c.small, 600, 30, .3); y += 30; it.push(textLine(Lb, c.small, s2, W / 2, y + capOf(Lb, s2), { track: .3, fill: "I", tone: 1 }).item); y += capOf(Lb, s2) + 30; }
    return { w: W, h: y + 40, it, ok: bx.cap >= MIN_CAP * 1.2, word: true };
  } },

  /* The monogram lockup: the initials in a rounded square, the name beside it. Reads at any size. */
  monogram: { name: "Monogram", group: "monogram", shape: "square", kinds: ANY_KIND.filter(k => k !== "script"), draw(c) {
    const it = [], { D, Lb, N } = c, S = 520, round = [60, 130, 260][c.d.seed % 3];
    it.push({ d: rectD(40, 40, S, S, round), fill: "P", tone: 1 });
    if (c.icon && c.d.seed % 4 === 3) it.push(iconItem(c.icon, 40 + S / 2, 40 + S / 2, 380, "Q", 0, 7.5));
    else { const ms = fitSize(D, N.init, S * .7, S * .5, -.01); it.push(textLine(D, N.init, ms, 40 + S / 2, 40 + S / 2 + capOf(D, ms) / 2, { fill: "Q", tone: 0, track: -.01 }).item); }
    const x = 40 + S + 70, lead = N.trail ? N.lead : N.full;
    const B = fitBlock(D, lead, 1100, 300, { maxLines: 2, lead: 1.12, capMax: 170 });
    const subS = fitSize(Lb, N.trail || c.small, 900, 58, .24);
    const blockH = capOf(D, B.size) * (1 + (B.n - 1) * 1.12), gap = 46, total = blockH + gap + capOf(Lb, subS), top = 40 + S / 2 - total / 2;
    const bx = drawBlock(it, D, B, x, top + blockH / 2, { align: "left", lead: 1.12, fill: "I", tone: 1 });
    const st = textLine(Lb, N.trail || c.small, subS, x, top + blockH + gap + capOf(Lb, subS), { align: "left", track: .24, fill: "A", tone: 1 }); it.push(st.item);
    return { w: Math.max(bx.x1, st.box.x1) + 50, h: S + 80, it, ok: bx.cap >= MIN_CAP, word: true };
  } },

  /* The initials in a disc, the name under it. */
  roundel: { name: "Roundel", group: "monogram", shape: "circle", kinds: ANY_KIND.filter(k => k !== "script"), draw(c) {
    const it = [], { D, Lb, N } = c, W = 1300, R = 230, cx = W / 2, cy = 40 + R;
    it.push({ d: circleD(cx, cy, R), fill: "A", tone: 1 });
    it.push(ring(cx, cy, R - 26, 6, "G", 0));
    if (c.icon && c.d.seed % 3 === 2) it.push(iconItem(c.icon, cx, cy, 230, "G", 0, 7.5));
    else { const ms = fitSize(D, N.init, R * 1.25, R * .72); it.push(textLine(D, N.init, ms, cx, cy + capOf(D, ms) / 2, { fill: "G", tone: 0 }).item); }
    const B = fitBlock(D, N.full, 1200, 280, { maxLines: 2, lead: 1.12, capMax: 150 });
    const bx = drawBlock(it, D, B, cx, cy + R + 80 + capOf(D, B.size) * (1 + (B.n - 1) * 1.12) / 2, { lead: 1.12, fill: "I", tone: 1 });
    const ss = fitSize(Lb, c.small, 760, 40, .3);
    it.push(textLine(Lb, c.small, ss, cx, bx.bot0 + 60 + capOf(Lb, ss), { track: .3, fill: "A", tone: 1 }).item);
    return { w: W, h: bx.bot0 + 60 + capOf(Lb, ss) + 60, it, ok: bx.cap >= MIN_CAP, word: true };
  } },

  /* A speed wordmark: the name leaning forward over a slanted bar, the small line on the bar. */
  speed: { name: "Speed", group: "wordmark", shape: "square", kinds: ["condensed", "grotesk", "wide", "display"], draw(c) {
    const it = [], { D, Lb, N } = c;
    // the name leaning forward (an italic face leans of itself), a slanted bar under it carrying the small
    // line, and three motion lines trailing behind
    const B = fitBlock(D, N.full, 1300, 400, { maxLines: 2, lead: 1.02, capMax: 250 });
    const capH = capOf(D, B.size), blockH = capH * (1 + (B.n - 1) * 1.02), x = 260;
    const italic = c.V.display === "kanit-italic", inner = [], words = [];
    const bx = drawBlock(italic ? words : inner, D, B, x, 40 + blockH / 2, { align: "left", lead: 1.02, fill: "I", tone: 1 });
    const barH = Math.max(90, capH * .62), barY = bx.bot0 + capH * .18, bw = bx.x1 - x + 60;
    const ss = fitSize(Lb, c.small, bw - 120, barH * .42, .24);
    inner.push({ d: rectD(x - 10, barY, bw, barH, 4), fill: "P", tone: 1 });
    inner.push(textLine(Lb, c.small, ss, x + bw / 2 - 10, barY + barH / 2 + capOf(Lb, ss) / 2, { track: .24, fill: "Q", tone: 0 }).item);
    const lh = Math.max(16, capH * .11);
    [[.18, 200], [.46, 150], [.74, 100]].forEach(([f, len]) => inner.push({ d: rectD(x - 50 - len, 40 + blockH * f - lh / 2, len, lh, lh / 2), fill: "A", tone: 1 }));
    const H = barY + barH + 40, lean = H * Math.tan(12 * Math.PI / 180);
    it.push({ g: inner, tf: `translate(${f1(lean)} 0) skewX(-12)` });
    for (const w of words) it.push(Object.assign(w, { tf: `translate(${f1(lean * .5)} 0) ` + w.tf }));
    return { w: x - 10 + bw + lean + 30, h: H, it, ok: capH >= MIN_CAP * 1.2, word: true };
  } },

  /* A label: a ruled box, the name in its field, the small line knocked out of a band at its foot. */
  label: { name: "Label", group: "badge", shape: "square", kinds: ["condensed", "wide", "grotesk", "serif", "display"], draw(c) {
    const it = [], { D, Lb, N } = c, W = 1400, H = 820, band = 170;
    it.push({ d: rectD(30, 30, W - 60, H - 60, 10), fill: "G", tone: 1 });
    it.push({ d: rectD(30, H - 30 - band, W - 60, band), fill: "P", tone: 1 });
    it.push({ d: rectD(30, 30, W - 60, H - 60, 10), stroke: "I", sw: 16, tone: 1 });
    it.push({ d: rectD(64, 64, W - 128, H - 128 - band, 4), stroke: "A", sw: 4, tone: 0 });
    const B = fitBlock(D, N.full, 1140, 380, { maxLines: 2, lead: 1.14, capMax: 240 });
    const bx = drawBlock(it, D, B, W / 2, 64 + (H - 128 - band) / 2, { lead: 1.14, fill: "I", tone: 0 });
    const ss = fitSize(Lb, c.small, 1060, 52, .26);
    it.push(textLine(Lb, c.small, ss, W / 2, H - 30 - band / 2 + capOf(Lb, ss) / 2, { track: .26, fill: "Q", tone: 0 }).item);
    return { w: W, h: H, it, ok: bx.cap >= MIN_CAP * 1.3 };
  } },

  /* The luxe wordmark: a cut stone between hairlines, the name tracked wide, the small line under a rule.
     For gold, jewellery, watches and coins. */
  luxe: { name: "Luxe", group: "wordmark", shape: "circle", kinds: ["serif", "grotesk", "condensed", "wide"], cats: ["gold", "coins", "silver", "wearables", "phones", "pokemon", "cameras"], draw(c) {
    const it = [], { D, Lb, N } = c, W = 1500;
    const gem = [[750, 60], [810, 110], [750, 190], [690, 110]];
    it.push({ d: polyD(gem), stroke: "A", sw: 6, tone: 1 });
    it.push({ d: "M690,110H810M720,110L750,60L780,110L750,190Z", stroke: "A", sw: 4, tone: 1 });
    it.push({ d: rectD(300, 122, 340, 4, 2), fill: "A", tone: 1 }); it.push({ d: rectD(860, 122, 340, 4, 2), fill: "A", tone: 1 });
    const B = fitBlock(D, N.full, 1360, 300, { maxLines: 2, lead: 1.2, track: .12, capMax: 150 });
    const blockH = capOf(D, B.size) * (1 + (B.n - 1) * 1.2);
    const bx = drawBlock(it, D, B, W / 2, 260 + blockH / 2, { lead: 1.2, track: .12, fill: "I", tone: 1 });
    const ss = fitSize(Lb, c.small, 1000, 40, .42);
    const y = bx.bot0 + 70;
    it.push({ d: rectD(W / 2 - 60, y, 120, 4, 2), fill: "A", tone: 1 });
    it.push(textLine(Lb, c.small, ss, W / 2, y + 60 + capOf(Lb, ss), { track: .42, fill: "A", tone: 1 }).item);
    return { w: W, h: y + 60 + capOf(Lb, ss) + 60, it, ok: bx.cap >= MIN_CAP, word: true };
  } },

  /* The shop-front arch: the name on a wide arc, the symbol under it, the small line on a rule. */
  arch: { name: "Arch", group: "wordmark", shape: "circle", kinds: RING_KINDS, draw(c) {
    const it = [], { D, Lb, N } = c, W = 1400, R = 640, cx = W / 2, cy = 820;
    const onArc = N.trail ? N.lead : N.full;
    const s = arcFit(D, onArc, R, 118, 190, 1, .03);
    arcText(it, D, onArc, s, cx, cy, R, { dir: 1, track: .03, fill: "I", tone: 1 });
    const capH = capOf(D, s), topY = cy - R - capH;
    let y = cy - R + 70;
    if (c.icon) { it.push(iconItem(c.icon, cx, y + 85, 170, "A", 1, 7)); y += 190; }
    else { it.push({ d: starD(cx, y + 40, 36), fill: "A", tone: 1 }); for (const dx of [-84, 84]) it.push({ d: starD(cx + dx, y + 52, 22), fill: "A", tone: 1 }); y += 110; }
    if (N.trail) { const ts = fitSize(D, N.trail, 900, capH * .62, .06); y += capOf(D, ts); it.push(textLine(D, N.trail, ts, cx, y, { track: .06, fill: "I", tone: 1 }).item); y += 50; }
    const ss = fitSize(Lb, c.small, 700, 40, .26);
    const st = textLine(Lb, c.small, ss, cx, y + capOf(Lb, ss), { track: .26, fill: "A", tone: 1 }); it.push(st.item);
    it.push({ d: rectD(st.box.x0, y + capOf(Lb, ss) + 26, st.box.x1 - st.box.x0, 7, 3), fill: "A", tone: 1 });
    const shift = 40 - topY;
    return { w: W, h: y + capOf(Lb, ss) + 70 + shift, it: [{ g: it, tf: `translate(0 ${f1(shift)})` }], ok: capH >= MIN_CAP, word: true };
  } },

  /* A retro wordmark: the name over a hard offset shadow, the small line on a pill under it. */
  retro: { name: "Retro", group: "wordmark", shape: "square", kinds: ["display", "condensed", "wide"], draw(c) {
    const it = [], { D, Lb, N } = c, W = 1500;
    const B = fitBlock(D, N.full, 1360, 380, { maxLines: 2, lead: 1.08, capMax: 260 });
    const blockH = capOf(D, B.size) * (1 + (B.n - 1) * 1.08), off = Math.max(10, capOf(D, B.size) * .07);
    // the shadow, fattened into a block by its own stroke; the name over it, parted from it by a ground edge
    const sh = []; drawBlock(sh, D, B, W / 2 + off, 50 + blockH / 2 + off, { lead: 1.08, fill: "A", tone: 1 });
    for (const x of sh) it.push(Object.assign(x, { stroke: "A", sw: off * 1000 / B.size * 1.1, join: true }));
    const top = []; const bx = drawBlock(top, D, B, W / 2, 50 + blockH / 2, { lead: 1.08, fill: "I", tone: 1 });
    for (const x of top) { it.push(Object.assign({}, x, { fill: undefined, stroke: "G", sw: off * 1000 / B.size * .7, join: true, tone: 0 })); it.push(x); }
    const ss = fitSize(Lb, c.small, 860, 44, .22), sw = shapeRun(Lb, c.small, .22).w * ss / 1000 + 120, py = bx.bot0 + off + 60, ph = capOf(Lb, ss) + 64;
    it.push({ d: rectD(W / 2 - sw / 2, py, sw, ph, ph / 2), fill: "P", tone: 1 });
    it.push(textLine(Lb, c.small, ss, W / 2, py + ph / 2 + capOf(Lb, ss) / 2, { track: .22, fill: "Q", tone: 0 }).item);
    return { w: W, h: py + ph + 50, it, ok: capOf(D, B.size) >= MIN_CAP * 1.2, word: true };
  } },
};
export const LOGO_LAYOUTS = Object.fromEntries(Object.entries(LAYOUTS).map(([k, L]) => [k, { key: k, name: L.name, group: L.group, shape: L.shape, kinds: L.kinds, cats: L.cats || null }]));

/* ---------- the forms: the layout, its mark, and the two side by side ---------- */
/** The mark: the initials (or the symbol) in the layout's own shape, for a profile picture, an app
 *  icon or a favicon, where a whole seal would be too small to read. */
function drawMark(c, shape) {
  const it = [], { D, N } = c, cx = 500, cy = 500;
  const body = shape === "shield" ? shieldD(160, 60, 680, 880) : shape === "hex" ? polyD(hexPts(cx, cy, 480)) : shape === "circle" ? circleD(cx, cy, 480) : rectD(30, 30, 940, 940, 200);
  const inner = shape === "shield" ? shieldD(196, 96, 608, 790) : shape === "hex" ? polyD(hexPts(cx, cy, 432)) : shape === "circle" ? circleD(cx, cy, 436) : rectD(70, 70, 860, 860, 165);
  it.push({ d: body, fill: "P", tone: 1 });
  it.push({ d: inner, stroke: "Q", sw: 8, tone: 0 });
  const box = shape === "shield" ? 420 : 560, my = shape === "shield" ? 440 : cy;
  if (c.icon && !c.d.markInit) it.push(iconItem(c.icon, cx, my, box * .92, "Q", 0, 7.5));
  else { const ms = fitSize(D, N.init, box, box * .62); it.push(textLine(D, N.init, ms, cx, my + capOf(D, ms) / 2, { fill: "Q", tone: 0 }).item); }
  return { w: 1000, h: 1000, it, ok: true };
}
/** The name beside the mark: the horizontal lockup an ad's badge, a site's header and a cover use. */
function drawHorizontal(c, shape) {
  const m = drawMark(c, shape), it = [], { D, Lb, N } = c, H = 1000;
  it.push({ g: m.it, tf: "translate(0 0)" });
  const lead = N.trail ? N.lead : N.full, B = fitBlock(D, lead, 2400, 560, { maxLines: 2, lead: 1.1, capMax: 380 });
  const sub = N.trail || c.small, subS = fitSize(Lb, sub, 2000, 120, .2);
  const blockH = capOf(D, B.size) * (1 + (B.n - 1) * 1.1), gap = 90, total = blockH + gap + capOf(Lb, subS), top = H / 2 - total / 2, x = 1130;
  const bx = drawBlock(it, D, B, x, top + blockH / 2, { align: "left", lead: 1.1, fill: "I", tone: 1 });
  const st = textLine(Lb, sub, subS, x, top + blockH + gap + capOf(Lb, subS), { align: "left", track: .2, fill: "A", tone: 1 }); it.push(st.item);
  return { w: Math.max(bx.x1, st.box.x1) + 40, h: H, it, ok: true, word: true };
}

/* ---------- drawing a design to SVG ---------- */
let UID = 0;
/** One logo as an SVG document. mode: "colour" (with its ground unless bg is false), "transparent"
 *  (colour, no ground), "black" or "white" (one colour, the knock-outs cut through). pad: the margin round the
 *  artwork, of its larger side. */
export function logoSvg(design, faces, { form = "primary", mode = "colour", bg = mode === "colour", pad = .08, mark = null } = {}) {
  const d = cleanDesign(design), c = ctxOf(d, faces), L = LAYOUTS[d.t] || LAYOUTS.seal;
  const r = form === "mark" ? drawMark(c, L.shape) : form === "horizontal" ? drawHorizontal(c, L.shape) : L.draw(c);
  return svgOf(r, c.P, { mode, bg, pad, mark, title: c.N.full + " logo" });
}
function svgOf(r, P, { mode, bg, pad, mark, title, size }) {
  const p = Math.round(Math.max(r.w, r.h) * pad), W = Math.round(r.w + 2 * p), H = Math.round(r.h + 2 * p);
  const mono = mode === "black" || mode === "white", col = k => P[k] || k, id = "k" + (++UID).toString(36) + Math.random().toString(36).slice(2, 6);
  const paint = (x, inMask, as = null) => {
    if (x.g) return `<g transform="${x.tf}"${x.op ? ` opacity="${x.op}"` : ""}>${x.g.map(y => paint(y, inMask, x.as ? x : as)).join("")}</g>`;
    if (!x.d) return "";
    const tone = inMask ? (x.tone ? "#fff" : "#000") : as ? col(x.tone ? as.as : as.under) : null;
    const tf = x.tf ? ` transform="${x.tf}"` : "", rule = x.rule ? ` fill-rule="${x.rule}"` : "";
    if (x.stroke) {
      const cap = x.round ? ` stroke-linecap="round" stroke-linejoin="round"` : x.join ? ` stroke-linejoin="round"` : "";
      const fill = x.fill ? (tone || col(x.fill)) : "none";
      return `<path${tf} d="${x.d}" fill="${fill}" stroke="${tone || col(x.stroke)}" stroke-width="${f1(x.sw)}"${cap}${x.dash ? ` stroke-dasharray="${x.dash}"` : ""}${rule}/>`;
    }
    return `<path${tf} d="${x.d}" fill="${tone || col(x.fill)}"${rule}/>`;
  };
  const items = r.it.filter(Boolean);
  let body;
  if (mono) {
    const ink = mode === "black" ? "#111214" : "#ffffff";
    body = `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="${-p}" y="${-p}" width="${W}" height="${H}"><rect x="${-p}" y="${-p}" width="${W}" height="${H}" fill="#000"/>${items.map(x => paint(x, true)).join("")}</mask></defs><rect x="${-p}" y="${-p}" width="${W}" height="${H}" fill="${ink}" mask="url(#${id})"/>`;
  } else body = (bg ? `<rect x="${-p}" y="${-p}" width="${W}" height="${H}" fill="${typeof bg === "string" ? bg : P.G}"/>` : "") + items.map(x => paint(x, false)).join("");
  const sz = size ? ` width="${size[0]}" height="${size[1]}"` : ` width="${W}" height="${H}"`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-p} ${-p} ${W} ${H}"${sz}><title>${esc(title)}</title>${body}${mark || ""}</svg>`;
  return { svg, w: W, h: H, ok: r.ok !== false, word: !!r.word, ground: P.G, art: { w: r.w, h: r.h } };
}
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

/** The square profile picture: the logo (a round one whole, any other its mark) inside the circle a
 *  profile is cropped to, on its ground. */
export function profileSvg(design, faces, { size = 1080 } = {}) {
  const d = cleanDesign(design), c = ctxOf(d, faces), L = LAYOUTS[d.t] || LAYOUTS.seal;
  const whole = ["seal", "coin", "burst", "hexagon"].includes(d.t);
  const r = whole ? L.draw(c) : drawMark(c, L.shape);
  // the art inside the circle the platforms crop to: 76% of the square across its diagonal-free middle
  const k = 760 / Math.max(r.w, r.h);
  const it = [{ d: rectD(0, 0, 1000, 1000), fill: "G", tone: 0 }, { g: r.it, tf: `translate(${f1(500 - r.w * k / 2)} ${f1(500 - r.h * k / 2)}) scale(${+k.toFixed(4)})` }];
  return svgOf({ w: 1000, h: 1000, it }, c.P, { mode: "colour", bg: false, pad: 0, title: c.N.full, size: [size, size] });
}
/** The Facebook cover, 1640 × 624 (what Facebook asks for, shown 820 × 312 on a computer and cropped to
 *  its middle on a phone): the ground with a quiet pattern in its own light tone, the horizontal lockup
 *  and what is bought, all inside the middle that both show. */
export function coverSvg(design, faces, { phone = "", w = 1640, h = 624 } = {}) {
  const d = cleanDesign(design), c = ctxOf(d, faces), L = LAYOUTS[d.t] || LAYOUTS.seal;
  const it = [{ d: rectD(0, 0, w, h), fill: "G", tone: 0 }];
  // the edges: the mark, large and in the ground's own light tone, cut by the right edge; rules running off
  // the left. Both are decoration a phone may crop; everything read stays in the middle 1100.
  const m = drawMark(c, L.shape), mk = 760 / 1000;
  it.push({ g: m.it, as: "L", under: "G", tf: `translate(${f1(w - 330)} ${f1(h / 2 - 380)}) scale(${mk})` });
  const pat = [];
  for (let i = 0; i < 9; i++) pat.push(rectD(-40, 70 + i * 58, 230 - i * 14, 20, 10));
  it.push({ d: pat.join(""), fill: "L", tone: 0 });
  const hz = drawHorizontal(c, L.shape), k = Math.min(1000 / hz.w, (phone ? 230 : 270) / hz.h);
  const hh = hz.h * k, line = c.small, ls = fitSize(c.Lb, line, 700, 38, .26);
  const ps = phone ? fitSize(c.D, tidy(phone), 700, 60, .03) : 0;
  const total = hh + 46 + capOf(c.Lb, ls) + (phone ? 44 + capOf(c.D, ps) : 0);
  let y = h / 2 - total / 2;
  it.push({ g: hz.it, tf: `translate(${f1(w / 2 - hz.w * k / 2)} ${f1(y)}) scale(${+k.toFixed(4)})` });
  y += hh + 46 + capOf(c.Lb, ls);
  const lt = textLine(c.Lb, line, ls, w / 2, y, { track: .26, fill: "A", tone: 0 }); it.push(lt.item);
  for (const s of [-1, 1]) it.push({ d: rectD(s < 0 ? lt.box.x0 - 110 : lt.box.x1 + 30, y - capOf(c.Lb, ls) / 2 - 3, 80, 6, 3), fill: "A", tone: 0 });
  if (phone) { y += 44 + capOf(c.D, ps); it.push(textLine(c.D, tidy(phone), ps, w / 2, y, { track: .03, fill: "I", tone: 0 }).item); }
  return svgOf({ w, h, it }, c.P, { mode: "colour", bg: false, pad: 0, title: c.N.full + " cover", size: [w, h] });
}

/* ---------- the design: what is stored, sent and drawn ---------- */
export const LIMITS = { name: 40, small: 32, town: 28 };
/** a design held to what the engine draws: the server draws only this */
export function cleanDesign(x) {
  const d = x && typeof x === "object" ? x : {};
  return {
    t: LAYOUTS[d.t] ? d.t : "seal",
    name: tidy(d.name).slice(0, LIMITS.name) || "Your Business",
    cat: LINE_WORDS[d.cat] ? d.cat : "phones",
    small: tidy(d.small).slice(0, LIMITS.small),
    town: tidy(d.town).slice(0, LIMITS.town),
    voice: LOGO_VOICES[d.voice] ? d.voice : "bold",
    pair: LOGO_PAIRS.includes(d.pair) || PAIR_OF[d.pair] ? d.pair : "navy_gold",
    icon: LOGO_ICONS[d.icon] ? d.icon : "",
    seed: Math.abs(d.seed | 0) % 100000,
    markInit: !!d.markInit,
  };
}
/** the faces a design is set in (the modules to load first) */
export const facesOf = d => { const V = LOGO_VOICES[(d && d.voice)] || LOGO_VOICES.bold; return [V.display, V.label]; };

/* ---------- the gallery: finished logos to pick from ---------- */
export function rng(seed) {
  let a = (seed >>> 0) || 1;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const shuffle = (a, R) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
/* the pairs that suit a line, first: gold on gold, cash greens for cars, the house's own for the rest */
const LINE_PAIRS = {
  gold: ["black_gold", "navy_gold", "green_gold", "purple_gold", "red_yellow", "yellow_on_black", "cream_red", "bone_purple"],
  silver: ["silver_blue", "navy_gold", "black_on_white", "midnight_cyan", "arctic_teal", "white_on_navy", "black_gold"],
  coins: ["navy_gold", "green_gold", "black_gold", "red_yellow", "cream_red", "sand_teal", "purple_gold"],
  cars: ["black_red", "navy_white_red", "white_on_red", "black_on_yellow", "red_white_blue", "black_white_orange", "yellow_on_black"],
  phones: ["midnight_cyan", "black_cyan", "white_on_blue", "electric_blue_white_orange", "black_on_lime", "navy_orange", "sky_cobalt"],
  pokemon: ["black_on_yellow", "lemon_blue", "white_on_red", "navy_gold", "hot_pink_black_cobalt", "yellow_black_magenta"],
  gaming: ["black_violet", "black_lime", "white_on_violet", "black_cyan", "teal_pink", "mint_black_violet"],
  strips: ["white_on_teal", "arctic_teal", "mint_green", "white_on_blue", "sky_cobalt", "blue_green"],
};
/** Layouts for a line: those drawn for it (a plate for cars, a coin for gold) lead, then the rest. */
function layoutsFor(cat) {
  return Object.keys(LAYOUTS).filter(k => !LAYOUTS[k].cats || LAYOUTS[k].cats.includes(cat));
}
/** The finished logos a customer picks from: every layout that suits the line, each in a voice its
 *  shape takes and a pair, no pair twice, no voice more than twice, dark and light grounds taking turns.
 *  Deterministic for a name, a line and a seed; More draws the next seed. */
export function gallery(input, { seed = 1, n = 24, group = "" } = {}) {
  const base = { name: tidy(input.name), cat: LINE_WORDS[input.cat] ? input.cat : "phones", small: tidy(input.small), town: tidy(input.town) };
  const R = rng(hash(base.name.toUpperCase() + "|" + base.cat) ^ (seed * 2654435761));
  let lays = layoutsFor(base.cat).filter(k => !group || LAYOUTS[k].group === group);
  const own = lays.filter(k => LAYOUTS[k].cats);
  const order = [];
  while (order.length < n + 8) order.push(...(order.length ? shuffle(lays, R) : [...shuffle(own, R), ...shuffle(lays.filter(k => !own.includes(k)), R)]));
  const pref = shuffle(LINE_PAIRS[base.cat] || [], R), rest = shuffle(LOGO_PAIRS.filter(k => !pref.includes(k)), R);
  const darkQ = [...pref, ...rest].filter(k => paletteOf(k).dark), lightQ = [...pref, ...rest].filter(k => !paletteOf(k).dark);
  const usedV = {}, icons = ICONS_FOR[base.cat] || ICONS_FOR.phones, out = [], seen = new Set();
  for (let i = 0; out.length < n + 8 && i < order.length; i++) {
    const t = order[i], L = LAYOUTS[t];
    const q = (out.length % 2 === 0) === (seed % 2 === 1) ? darkQ : lightQ;
    const pair = q.length ? q.shift() : (darkQ.shift() || lightQ.shift() || "navy_gold");
    const voices = shuffle(Object.keys(LOGO_VOICES).filter(v => L.kinds.includes(LOGO_VOICES[v].kind)), R).sort((a, b) => (usedV[a] || 0) - (usedV[b] || 0));
    const voice = voices[0] || "bold"; usedV[voice] = (usedV[voice] || 0) + 1;
    const icon = R() < .6 ? icons[Math.floor(R() * Math.min(2, icons.length))] : "";
    const d = cleanDesign({ ...base, t, voice, pair, icon, seed: Math.floor(R() * 99999) });
    const key = t + d.voice + d.pair;
    if (seen.has(key)) continue; seen.add(key);
    out.push(d);
  }
  return out;
}
/** The same logo in other colours, faces or symbols: the rows under the one picked. */
export function variants(design, axis, n = 8) {
  const d = cleanDesign(design), L = LAYOUTS[d.t], R = rng(hash(d.name + axis) ^ d.seed);
  if (axis === "pair") {
    const pref = (LINE_PAIRS[d.cat] || []).filter(k => k !== d.pair), rest = shuffle(LOGO_PAIRS.filter(k => k !== d.pair && !pref.includes(k)), R);
    const pool = [...pref.slice(0, 3), ...rest], picked = [d.pair];
    for (const k of pool) if (picked.length < n && picked.every(p => !nearTwin(p, k))) picked.push(k);
    return picked.map(pair => ({ ...d, pair }));
  }
  if (axis === "voice") return [d.voice, ...shuffle(Object.keys(LOGO_VOICES).filter(v => v !== d.voice && L.kinds.includes(LOGO_VOICES[v].kind)), R)].slice(0, n).map(voice => ({ ...d, voice }));
  if (axis === "icon") return ["", ...(ICONS_FOR[d.cat] || []), "cashTag", "sparkle", "shieldTick", "boltFast"].filter((k, i, a) => a.indexOf(k) === i).slice(0, n).map(icon => ({ ...d, icon }));
  if (axis === "layout") return [d.t, ...shuffle(layoutsFor(d.cat).filter(k => k !== d.t), R)].slice(0, n).map(t => {
    const kinds = LAYOUTS[t].kinds, voice = kinds.includes((LOGO_VOICES[d.voice] || {}).kind) ? d.voice : Object.keys(LOGO_VOICES).find(v => kinds.includes(LOGO_VOICES[v].kind));
    return { ...d, t, voice };
  });
  return [d];
}
/** two pairs too alike to offer side by side: the same ground and accent to the eye */
function nearTwin(a, b) {
  const A = paletteOf(a), B = paletteOf(b);
  return contrast(A.G, B.G) < 1.25 && contrast(A.A, B.A) < 1.25;
}
