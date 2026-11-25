/* ═══════════════════════════════════════════════════════════════════════════
   THE LOGO ENGINE (DESIGN-LAW 176). The owner, 2026-11-24: "I don't see anywhere to generate logos
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
const rgbOf = h => [1, 3, 5].map(i => parseInt(String(h).slice(i, i + 2), 16));
const lin = v => (v /= 255) <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
export const lumOf = h => { const [r, g, b] = rgbOf(h); return .2126 * lin(r) + .7152 * lin(g) + .0722 * lin(b); };
export const contrast = (a, b) => { const x = lumOf(a), y = lumOf(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
const hx = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
export const mixHex = (a, b, t) => { const A = rgbOf(a), B = rgbOf(b); return "#" + A.map((v, i) => hx(v + (B[i] - v) * t)).join(""); };
/* The logo's own pairs (DESIGN-LAW 183). The owner, 2026-11-25: "most of the colors are pretty good, but some of
   them are a little out there", "we don't want the exact same effects of a super eye-catching neon ad". What
   established dealers wear (researched 2026-11-25): metal as a flat brass or ochre beside navy, slate or black,
   never a bright yellow; one or two flat colours. The ads never wear these (the full ad and the card maker take a
   logo's pair only when it is one of theirs), so they live here, not in the house's colours. */
const LP = (key, name, look, ground, ink, accent, light) => ({ key, name, look, logoOnly: true, colors: { ground, ink, accent, plate: accent, plate_ink: ground, light: light || mixHex(ground, ink, .12) } });
export const LOGO_OWN_PAIRS = [
  LP("navy_brass", "Navy & Brass", "dark", "#14213d", "#f4f1ea", "#c9a45c"),
  LP("ink_gold", "Ink & Gold", "dark", "#121417", "#f3efe6", "#c9a45c"),
  LP("forest_brass", "Forest & Brass", "dark", "#1e3b2f", "#f3ede1", "#c8a96a"),
  LP("oxblood_cream", "Oxblood & Cream", "dark", "#5a1e24", "#f5eee2", "#d9b77e"),
  LP("slate_teal", "Slate & Teal", "dark", "#1f2a37", "#ffffff", "#3fb3a5"),
  LP("graphite_red", "Graphite & Red", "dark", "#1f2328", "#ffffff", "#e0574b"),
  LP("midnight_sky", "Midnight & Sky", "dark", "#0f1b2d", "#eaf2ff", "#7cb7ee"),
  LP("plum_champagne", "Plum & Champagne", "dark", "#2e1a33", "#f1e9df", "#cdb27f"),
  LP("teal_sand", "Deep Teal & Sand", "dark", "#0f3d3e", "#f3ebdd", "#e2b46a"),
  LP("paper_navy", "Paper & Navy", "light", "#f6f4ef", "#14213d", "#b5452f"),
  LP("white_cobalt", "White & Cobalt", "light", "#ffffff", "#0b1f33", "#2d5bd7"),
  LP("sage_pine", "Sage & Pine", "light", "#e7efe8", "#1e3b2f", "#b8503b"),
  LP("stone_charcoal", "Stone & Charcoal", "light", "#ecebe6", "#23272b", "#b85c12"),
  LP("ivory_oxblood", "Ivory & Oxblood", "light", "#f7f3ec", "#3d1418", "#9c3b2f"),
  LP("mist_slate", "Mist & Slate", "light", "#eef1f4", "#1f2a37", "#2f7685"),
  LP("cream_forest", "Cream & Forest", "light", "#f4f1e8", "#1e3b2f", "#8a6a24"),
];
const PAIR_OF = Object.fromEntries([...HOUSE_COLOURS, ...LOGO_OWN_PAIRS].map(c => [c.key, c]));
/** The pairs a logo wears: the house pairs with two or three clear colours, no twins (a twin is one
 *  scheme with an earlier pair), and none whose colours sit too close to make a mark (checked in
 *  paletteOf). Dark, light and vivid grounds, so a gallery is never one mood. */
export const LOGO_PAIRS = ["navy_gold", "navy_orange", "midnight_cyan", "blue_green", "green_gold", "purple_gold", "teal_orange", "red_yellow",
  "black_gold", "black_red", "black_green", "silver_blue", "yellow_on_black", "black_on_yellow", "white_on_red", "white_on_blue", "white_on_navy",
  "white_on_green", "black_on_orange", "white_on_pink", "white_on_teal", "white_on_violet", "black_on_lime", "black_on_aqua", "red_white_blue",
  "navy_white_red", "black_white_orange", "electric_blue_white_orange", "cream_red", "mint_green", "sky_cobalt", "lavender_violet", "lemon_blue",
  "sand_teal", "arctic_teal", "bone_purple", "white_pink", "black_pink", "black_lime", "black_cyan", "black_violet", "teal_pink",
  "hot_pink_black_cobalt", "yellow_black_magenta", "mint_black_violet", "orange_black_cobalt", "red_on_white", "black_on_white",
  ...LOGO_OWN_PAIRS.map(p => p.key)].filter(k => PAIR_OF[k] && !PAIR_OF[k].twin);
/** The pairs a calm logo wears (DESIGN-LAW 183): the logo's own and the house pairs a sign can carry. The rest
 *  (neon, lime, aqua, hot pink and the like) stay for the Bold style, where a shop that wants them finds them. */
export const CALM_PAIRS = [...LOGO_OWN_PAIRS.map(p => p.key), "navy_gold", "black_gold", "green_gold", "purple_gold", "silver_blue",
  "white_on_navy", "white_on_blue", "white_on_green", "white_on_teal", "white_on_red", "red_white_blue", "navy_white_red", "cream_red",
  "sand_teal", "arctic_teal", "bone_purple", "red_on_white", "black_on_white", "black_red", "black_green", "navy_orange", "teal_orange",
  "blue_green", "black_white_orange"].filter(k => LOGO_PAIRS.includes(k));

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
  "RECYCLING RECYCLERS RESALE RESELLERS LOANS WHOLESALE WHOLESALERS TRADERS DISTRIBUTORS LIQUIDATION LIQUIDATORS").split(" "));
const STOP = new Set(["THE", "OF", "AND", "&", "A", "AN", "LLC", "INC", "INC.", "CO", "CO.", "WE"]);
/** what a logo says for each line Easy Mode lists (app.js CATS): generic, never another firm's name */
export const LINE_WORDS = { phones: "PHONES", gaming: "GAMES & CONSOLES", gold: "GOLD & JEWELRY", coins: "COINS", pokemon: "TRADING CARDS",
  silver: "SILVER", cars: "CARS & TRUCKS", sports: "SPORTS CARDS", computers: "COMPUTERS", audio: "AUDIO & HEADPHONES", wearables: "WATCHES",
  cameras: "CAMERAS & DRONES", strips: "TEST STRIPS",
  /* the trade's own shops (the owner, 2026-11-24: "tech, buyers, wholesale traders, device stores ... resellers") */
  wholesale: "WHOLESALE LOTS", devices: "DEVICES", resale: "RESALE" };
export const LINES = Object.keys(LINE_WORDS);
/** the small line a logo says by default: "WE BUY" and the line's goods, or the trade's own words where
 *  "WE BUY" says less than the shop does (a wholesaler, a device store, a reseller) */
export const LINE_SMALL = { wholesale: "WHOLESALE · BULK · TRADE-INS", devices: "PHONES · TABLETS · LAPTOPS", resale: "BUY · SELL · TRADE" };
export const smallFor = cat => LINE_SMALL[cat] || "WE BUY " + (LINE_WORDS[cat] || "PHONES");
const up = s => String(s || "").toUpperCase().replace(/\bIPHONE/g, "iPHONE").replace(/\bIPAD/g, "iPAD").replace(/\bIMAC/g, "iMAC");
const titleCase = s => String(s || "").split(/(\s+)/).map(w => /^\s+$/.test(w) || !w ? w : w === w.toUpperCase() && w.length <= 3 ? w : w[0].toUpperCase() + w.slice(1).toLowerCase()).join("");
const tidy = s => String(s || "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim();
/* How the logo's own tones set a name (DESIGN-LAW 183): Title Case that keeps what the customer typed on purpose
   (iPhones, McCoy, MK, LA), or all lower case, which falls back to that Title Case when the name holds initials or
   a brand's own capitals. Small words inside a name stay small (Buyers of Orange County). */
const SMALL_WORDS = new Set(["of", "and", "the", "de", "del", "la", "for", "at", "by", "on", "in", "to", "a", "an"]);
const keepCase = w => /[a-z][A-Z]/.test(w) || (w === w.toUpperCase() && /[A-Z]/.test(w) && w.replace(/[^A-Za-z]/g, "").length <= 3);
const smartTitle = s => String(s || "").split(" ").map((w, i) => !w ? w : keepCase(w) ? w : i && SMALL_WORDS.has(w.toLowerCase()) ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" ");
const lowerOf = s => String(s || "").split(" ").some(keepCase) ? smartTitle(s) : String(s || "").toLowerCase();

/** The name as a logo reads it: the whole, its lead (what is its own) and its trail (the generic words
 *  after it: LONG BEACH / PHONE BUYERS), and the initials a monogram sets. */
export function partsOf(raw, script = false) {
  const name = tidy(raw) || "Your Business";
  // script: true for a script face (as it always was); "title" or "lower" for the logo's own tones
  const set = script === "lower" ? lowerOf(name) : script === "title" ? smartTitle(name) : script ? titleCase(name) : up(name), words = set.split(" ");
  const bare = w => w.toUpperCase().replace(/[^A-Z0-9&.]/g, "");
  let cut = -1;
  for (let i = 1; i < words.length; i++) if (GENERIC.has(bare(words[i])) && words.slice(0, i).some(w => !STOP.has(bare(w)))) { cut = i; break; }
  const lead = cut > 0 ? words.slice(0, cut).join(" ") : set, trail = cut > 0 ? words.slice(cut).join(" ") : "";
  const sig = (cut > 0 && cut >= 2 ? words.slice(0, cut) : words).filter(w => !STOP.has(bare(w)) && /[A-Za-z0-9]/.test(w));
  let init;
  // a short name in capitals before the trade's words is the shop's own initials: MK ELECTRONICS is MK
  const own = cut === 1 && /^[A-Z0-9&]{2,3}$/.test(bare(words[0]).replace(/[^A-Z0-9&]/g, "")) && words[0] === words[0].toUpperCase() ? bare(words[0]).replace(/[^A-Z0-9]/g, "") : "";
  if (own) init = own;
  else if (sig.length === 1) { const b = bare(sig[0]).replace(/[^A-Z0-9]/g, ""); init = b.length <= 3 && sig[0] === sig[0].toUpperCase() ? b : b.slice(0, 1); }
  else init = sig.slice(0, 2).map(w => bare(w).replace(/[^A-Z0-9]/g, "").slice(0, 1)).join("");
  return { full: set, lead, trail, init: init || "W", words };
}

/* ---------- the type: outlines laid out with the face's own kerning ---------- */
/** a glyph of a face, or of the pair's reading face, or nothing (a name never shows a box) */
function glyph(F, ch, alt) {
  const g = (F && F.g[ch]) || (alt && alt.g[ch]) || (ch === "’" && F && F.g["'"]) || (ch === "•" && F && F.g["·"]);
  if (g) return g;
  // a letter the face lacks (an accent a subset left out) is set as its plain letter, never dropped
  const base = ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return base && base !== ch ? glyph(F, base, alt) : null;
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
  // bot0 is the foot the next line is set from: the capitals' line, or the ink below it where letters hang
  // (a script's y, g, p, the comma of a title), so a small line never runs into a descender
  return Object.assign(box || { x0: x, x1: x, top: cy, bot: cy }, { cap: c, top0: cy - total / 2, bot0: Math.max(cy + total / 2, box ? box.bot + c * .12 : -Infinity) });
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

/* ---------- the industry marks (DESIGN-LAW 180) ----------
   The owner, 2026-11-24: "a logo maker that has industry relevant assets and elements so they feel
   personalized and actually graphic design oriented". A mark here is the shop's own initials built into
   the thing it buys: struck into a coin, stamped on a bar, printed on a graded slab's label, lit on a
   phone's screen, set in a watch dial. Every shop's is its own (its initials), and every one says its
   trade at a glance. On the 1000 box; tone 1 is the ink, tone 0 what is cut out of it (the one-colour
   versions read the same). Never a brand's shape: no real phone's camera, no grading company's label. */
const deg = a => a * Math.PI / 180;
const onC = (cx, cy, r, a) => [cx + r * Math.sin(deg(a)), cy - r * Math.cos(deg(a))];
const arcPath = (cx, cy, r, a0, a1) => { const [x0, y0] = onC(cx, cy, r, a0), [x1, y1] = onC(cx, cy, r, a1); return `M${f1(x0)},${f1(y0)}A${f1(r)},${f1(r)} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0},1 ${f1(x1)},${f1(y1)}`; };
const LEAF = "M0,-30Q17,0 0,30Q-17,0 0,-30Z";
/** a laurel of leaves along a rising curve under a centre, both sides */
function laurel(it, cx, cy, r, fill, tone, n = 5) {
  // two branches along an arc under the centre, from the middle out and up; a pair of leaves at each step
  for (const side of [-1, 1]) {
    it.push({ d: arcPath(cx, cy - r, r, side > 0 ? 168 : 120, side > 0 ? 240 : 192), stroke: fill, sw: 9, tone, round: true });
    for (let i = 0; i < n; i++) {
      const a = side > 0 ? 172 - i * 15 : 188 + i * 15, [x, y] = onC(cx, cy - r, r, a), tang = a + (side > 0 ? -90 : 90);
      for (const off of [-1, 1]) it.push({ d: LEAF, tf: `translate(${f1(x)} ${f1(y)}) rotate(${f1(180 - tang + off * 40 + (side > 0 ? 0 : 180))}) translate(0 -26) scale(${(1.25 - i * .08).toFixed(3)})`, fill, tone });
    }
  }
}
const initialsAt = (it, c, x, y, w, cap, fill, tone, track = .02) => { const s = fitSize(c.D, c.N.init, w, cap, track); it.push(textLine(c.D, c.N.init, s, x, y + capOf(c.D, s) / 2, { fill, tone, track }).item); return capOf(c.D, s); };
const MARKS = {
  /* a coin with a reeded edge and beads, the initials struck in it, a laurel under them */
  coinStruck(c) {
    const it = [], cx = 500, cy = 500, reed = [], beads = [];
    it.push({ d: circleD(cx, cy, 490), fill: "A", tone: 1, body: true, round: true });
    for (let i = 0; i < 120; i++) { const [x0, y0] = onC(cx, cy, 452, i * 3), [x1, y1] = onC(cx, cy, 482, i * 3); reed.push(`M${f1(x0)},${f1(y0)}L${f1(x1)},${f1(y1)}`); }
    it.push({ d: reed.join(""), stroke: "G", sw: 7, tone: 0 });
    it.push(ring(cx, cy, 430, 10, "G", 0));
    for (let i = 0; i < 60; i++) { const [x, y] = onC(cx, cy, 394, i * 6); beads.push(circleD(x, y, 7)); }
    it.push({ d: beads.join(""), fill: "G", tone: 0 });
    initialsAt(it, c, cx, cy - 50, 420, 210, "G", 0);
    laurel(it, cx, cy + 250, 230, "G", 0, 4);
    it.push({ d: starD(cx, cy - 250, 30), fill: "G", tone: 0 });
    return it;
  },
  /* a cast bar seen from above: its bevel, the initials stamped in its face, three stars */
  ingot(c) {
    const it = [];
    it.push({ d: polyD([[175, 230], [825, 230], [965, 770], [35, 770]]), fill: "A", tone: 1, body: true });
    it.push({ d: polyD([[255, 310], [745, 310], [850, 690], [150, 690]]), stroke: "G", sw: 9, tone: 0, join: true });
    it.push({ d: "M175,230L255,310M825,230L745,310M965,770L850,690M35,770L150,690", stroke: "G", sw: 7, tone: 0 });
    const ch = initialsAt(it, c, 500, 470, 470, 200, "G", 0, .05);
    for (const dx of [-70, 0, 70]) it.push({ d: starD(500 + dx, 470 + ch / 2 + 80, dx ? 18 : 24), fill: "G", tone: 0 });
    return it;
  },
  /* a graded card in its case: the initials on the label, a card with a sparkle in the window */
  slab(c) {
    const it = [], x = 240, y = 30, w = 520, h = 940;
    it.push({ d: rectD(x, y, w, h, 60), fill: "P", tone: 1, body: true });
    it.push({ d: rectD(x + 32, y + 32, w - 64, 200, 26), fill: "G", tone: 0 });
    const s = fitSize(c.D, c.N.init, 280, 120, .02);
    it.push(textLine(c.D, c.N.init, s, x + 32 + 34, y + 32 + 100 + capOf(c.D, s) / 2, { align: "left", fill: "I", tone: 1, track: .02 }).item);
    it.push({ d: starD(x + w - 32 - 78, y + 132, 46), fill: "A", tone: 1 });
    it.push({ d: rectD(x + 32, y + 264, w - 64, h - 296, 26), fill: "G", tone: 0 });
    it.push({ d: rectD(x + 92, y + 318, w - 184, h - 400, 20), fill: "A", tone: 1 });
    it.push({ d: rectD(x + 120, y + 348, w - 240, (h - 400) * .56, 12), stroke: "G", sw: 9, tone: 0 });
    it.push({ d: starD(500, y + 348 + (h - 400) * .28, 82, 4, .36), fill: "G", tone: 0 });
    it.push({ d: rectD(x + 150, y + 348 + (h - 400) * .56 + 40, w - 300, 16, 8) + rectD(x + 150, y + 348 + (h - 400) * .56 + 80, w - 380, 16, 8), fill: "G", tone: 0 });
    return it;
  },
  /* a phone's front: its rounded body, a pill at the head of the screen, the initials lit on it */
  device(c) {
    const it = [], x = 255, y = 25, w = 490, h = 950;
    it.push({ d: rectD(x, y, w, h, 112), fill: "P", tone: 1, body: true });
    it.push({ d: rectD(x + 30, y + 30, w - 60, h - 60, 86), fill: "G", tone: 0 });
    it.push({ d: rectD(500 - 72, y + 66, 144, 42, 21), fill: "P", tone: 1 });
    initialsAt(it, c, 500, 470, 360, 230, "A", 1);
    it.push({ d: rectD(500 - 95, y + h - 90, 190, 16, 8), fill: "I", tone: 1 });
    for (let i = 0; i < 3; i++) it.push({ d: rectD(500 - 66 + i * 50, 690 - i * 26, 32, 50 + i * 26, 8), fill: "A", tone: 1 });
    return it;
  },
  /* a controller: the pad and the buttons, the initials between the grips */
  pad(c) {
    const it = [], body = LOGO_ICONS.controller[0].split(" M")[0];
    it.push({ d: body, tf: "translate(0 -40) scale(10)", fill: "P", tone: 1, body: true });
    it.push({ d: rectD(178, 420, 150, 46, 10) + rectD(230, 368, 46, 150, 10), fill: "G", tone: 0 });
    for (const [x, y] of [[760, 395], [822, 450], [698, 450], [760, 505]]) it.push({ d: circleD(x, y, 27), fill: "G", tone: 0 });
    initialsAt(it, c, 500, 445, 250, 120, "G", 0);
    return it;
  },
  /* a watch: the straps, the case and its crown, twelve marks round the dial, the initials in it */
  dial(c) {
    const it = [], cx = 500, cy = 500, ticks = [];
    it.push({ d: rectD(375, 15, 250, 210, 34) + rectD(375, 775, 250, 210, 34), fill: "S", tone: 1 });
    it.push({ d: rectD(830, 455, 64, 90, 16), fill: "P", tone: 1 });
    it.push({ d: circleD(cx, cy, 345), fill: "P", tone: 1, body: true, round: true });
    it.push(ring(cx, cy, 300, 9, "G", 0));
    for (let i = 0; i < 12; i++) { const r0 = i % 3 === 0 ? 228 : 250, [x0, y0] = onC(cx, cy, r0, i * 30), [x1, y1] = onC(cx, cy, 282, i * 30); ticks.push(`M${f1(x0)},${f1(y0)}L${f1(x1)},${f1(y1)}`); }
    it.push({ d: ticks.join(""), stroke: "G", sw: 14, tone: 0, round: true });
    initialsAt(it, c, cx, cy, 300, 150, "Q", 0);
    return it;
  },
  /* a speedometer: the arc and its marks, the needle past the middle, the initials under the hub */
  gauge(c) {
    const it = [], cx = 500, cy = 540, ticks = [];
    it.push({ d: arcPath(cx, cy, 400, -125, 125), stroke: "A", sw: 52, tone: 1, round: true });
    for (let a = -120; a <= 120; a += 20) { const [x0, y0] = onC(cx, cy, a % 60 === 0 ? 285 : 310, a), [x1, y1] = onC(cx, cy, 340, a); ticks.push(`M${f1(x0)},${f1(y0)}L${f1(x1)},${f1(y1)}`); }
    it.push({ d: ticks.join(""), stroke: "I", sw: 12, tone: 1, round: true });
    const [nx, ny] = onC(cx, cy, 330, 48), [l0x, l0y] = onC(cx, cy, 26, 48 - 90), [l1x, l1y] = onC(cx, cy, 26, 48 + 90);
    it.push({ d: polyD([[l0x, l0y], [nx, ny], [l1x, l1y]]), fill: "I", tone: 1 });
    it.push({ d: circleD(cx, cy, 44), fill: "I", tone: 1 });
    initialsAt(it, c, cx, cy + 235, 400, 150, "I", 1);
    return it;
  },
  /* a chip: its pins, its die, the initials etched on it */
  chip(c) {
    const it = [], pins = [];
    for (let i = 0; i < 5; i++) { const p = 290 + i * 105; pins.push(rectD(p - 20, 80, 40, 130, 12), rectD(p - 20, 790, 40, 130, 12), rectD(80, p - 20, 130, 40, 12), rectD(790, p - 20, 130, 40, 12)); }
    it.push({ d: pins.join(""), fill: "A", tone: 1 });
    it.push({ d: rectD(190, 190, 620, 620, 56), fill: "P", tone: 1, body: true });
    it.push({ d: rectD(252, 252, 496, 496, 30), stroke: "Q", sw: 9, tone: 0 });
    it.push({ d: circleD(300, 300, 18), fill: "Q", tone: 0 });
    initialsAt(it, c, 500, 500, 380, 200, "Q", 0);
    return it;
  },
  /* a lens: the barrel, six blades round the opening, the initials in it */
  aperture(c) {
    const it = [], cx = 500, cy = 500, blades = [], hex = [];
    it.push({ d: circleD(cx, cy, 480), fill: "P", tone: 1, body: true, round: true });
    it.push(ring(cx, cy, 438, 9, "Q", 0));
    for (let i = 0; i < 6; i++) { const [x0, y0] = onC(cx, cy, 250, i * 60), [x1, y1] = onC(cx, cy, 438, i * 60 + 62); blades.push(`M${f1(x0)},${f1(y0)}L${f1(x1)},${f1(y1)}`); hex.push([x0, y0]); }
    it.push({ d: blades.join(""), stroke: "Q", sw: 10, tone: 0 });
    it.push({ d: polyD(hex), stroke: "Q", sw: 10, tone: 0, join: true });
    initialsAt(it, c, cx, cy, 300, 140, "Q", 0);
    return it;
  },
  /* two arrows chasing each other round the initials: buy, sell, trade */
  cycle(c) {
    const it = [], cx = 500, cy = 500, r = 385;
    for (const [a0, a1] of [[-150, -20], [30, 160]]) {
      it.push({ d: arcPath(cx, cy, r, a0, a1), stroke: "A", sw: 58, tone: 1 });
      const [tx, ty] = onC(cx, cy, r, a1 + 22), [b0x, b0y] = onC(cx, cy, r - 78, a1 - 2), [b1x, b1y] = onC(cx, cy, r + 78, a1 - 2);
      it.push({ d: polyD([[b0x, b0y], [tx, ty], [b1x, b1y]]), fill: "A", tone: 1, join: true });
    }
    initialsAt(it, c, cx, cy, 470, 250, "I", 1);
    return it;
  },
  /* a crate seen from its corner: the tape across its lid, the initials on its side */
  crate(c) {
    const it = [];
    it.push({ d: polyD([[500, 150], [835, 330], [500, 510], [165, 330]]), fill: "A", tone: 1 });
    it.push({ d: polyD([[165, 330], [500, 510], [500, 880], [165, 700]]), fill: "P", tone: 1 });
    it.push({ d: polyD([[500, 510], [835, 330], [835, 700], [500, 880]]), fill: "S", tone: 1 });
    it.push({ d: polyD([[300, 225], [365, 190], [700, 370], [635, 405]]), fill: "G", tone: 0 });
    it.push({ d: "M165,330L500,510L835,330M500,510V880", stroke: "G", sw: 8, tone: 0, join: true });
    const s = fitSize(c.D, c.N.init, 250, 150, .02), t = textLine(c.D, c.N.init, s, 0, capOf(c.D, s) / 2, { fill: "Q", tone: 0, track: .02 });
    it.push({ g: [t.item], tf: "translate(332 610) skewY(28.3)" });
    return it;
  },
  /* a drop, for test strips: the initials in it */
  drop(c) {
    const it = [];
    it.push({ d: "M500,40C500,40 170,430 170,640A330,330 0 0 0 830,640C830,430 500,40 500,40Z", fill: "P", tone: 1, body: true });
    it.push({ d: "M262,520Q284,430 340,350", stroke: "Q", sw: 22, tone: 0, round: true });
    initialsAt(it, c, 520, 680, 380, 190, "Q", 0);
    return it;
  },
  /* headphones: the band over the initials, a cup each side */
  phones2(c) {
    const it = [];
    it.push({ d: "M190,560A310,310 0 0 1 810,560", stroke: "A", sw: 62, tone: 1, round: true });
    it.push({ d: rectD(100, 500, 190, 330, 72) + rectD(710, 500, 190, 330, 72), fill: "P", tone: 1 });
    it.push({ d: rectD(140, 560, 110, 210, 50) + rectD(750, 560, 110, 210, 50), stroke: "Q", sw: 9, tone: 0 });
    initialsAt(it, c, 500, 680, 330, 170, "I", 1);
    return it;
  },
};
/** the industry mark's layout: the mark over the name and the small line */
const markLayout = (name, cats, key) => ({ name, group: "mark", shape: "circle", kinds: ["condensed", "wide", "grotesk", "display", "serif"], cats, mark: c => MARKS[key](c), draw(c) {
  const it = [], { D, Lb, N } = c, W = 1400, ms = 620;
  it.push({ g: MARKS[key](c), tf: `translate(${(W - ms) / 2} 20) scale(${ms / 1000})` });
  let y = 20 + ms + 80;
  const lead = N.trail ? N.lead : N.full, B = fitBlock(D, lead, 1300, 300, { maxLines: 2, lead: 1.08, capMax: 190 });
  const bx = drawBlock(it, D, B, W / 2, y + capOf(D, B.size) * (1 + (B.n - 1) * 1.08) / 2, { lead: 1.08, fill: "I", tone: 1 });
  y = bx.bot0 + 58;
  const sub = N.trail || c.small, ss = fitSize(Lb, sub, 1000, 52, .3), st = textLine(Lb, sub, ss, W / 2, y + capOf(Lb, ss), { track: .3, fill: "A", tone: 1 });
  it.push(st.item);
  if (N.trail) { const s2 = fitSize(Lb, c.small, 760, 30, .3); it.push(textLine(Lb, c.small, s2, W / 2, y + capOf(Lb, ss) + 44 + capOf(Lb, s2), { track: .3, fill: "I", tone: 1 }).item); y += 44 + capOf(Lb, s2); }
  return { w: W, h: y + capOf(Lb, ss) + 50, it, ok: bx.cap >= MIN_CAP, word: true };
} });

/* ---------- the mark catalogue (DESIGN-LAW 183) ----------
   The owner, 2026-11-25: "One vector doesn't work; having a family of vectors in a catalogue of vectors to pick
   from is much better", and the logos were "a little angular and a little too sharp". Each line has six to eight
   marks. What the research found (real logos in the trade, checked 2026-11-25): the strongest marks come from the
   name or the act (buy, trade, check, weigh), not a picture of the shop, and no initials crammed into a picture of
   the goods. So each family leads with marks of the act and keeps one or two of the goods, simplified.

   Every mark is drawn once, in parts, and the kit below draws the parts two ways: solid (a body in the mark's
   colour, cut by lines and holes in the ground's) or as one line of even weight with round ends (the weight of
   the name's own stems, set by the layout). Corners are soft unless the design asks for sharp ones. tone 1 is the
   ink and tone 0 what is cut from it, as everywhere in the engine, so the one-colour files read. Generic shapes
   only: never a phone maker's camera, a grader's label, a car maker's badge, a game's buttons or a red cross. */
const squircleD = (cx, cy, r, n = 5, steps = 72) => "M" + Array.from({ length: steps }, (_, i) => {
  const t = i / steps * Math.PI * 2, co = Math.cos(t), si = Math.sin(t);
  return f1(cx + r * Math.sign(co) * Math.abs(co) ** (2 / n)) + "," + f1(cy + r * Math.sign(si) * Math.abs(si) ** (2 / n));
}).join("L") + "Z";
/** a polygon with each corner rounded by r (a curve through the corner), or sharp when r is 0 */
const rpolyD = (pts, r) => {
  if (!r) return polyD(pts);
  const n = pts.length, out = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
    const da = Math.hypot(a[0] - p[0], a[1] - p[1]), db = Math.hypot(b[0] - p[0], b[1] - p[1]), rr = Math.min(r, da / 2.05, db / 2.05);
    const p1 = [p[0] + (a[0] - p[0]) * rr / da, p[1] + (a[1] - p[1]) * rr / da], p2 = [p[0] + (b[0] - p[0]) * rr / db, p[1] + (b[1] - p[1]) * rr / db];
    out.push((i ? "L" : "M") + f1(p1[0]) + "," + f1(p1[1]) + "Q" + f1(p[0]) + "," + f1(p[1]) + " " + f1(p2[0]) + "," + f1(p2[1]));
  }
  return out.join("") + "Z";
};
const lineD = (...pts) => "M" + pts.map(([x, y]) => f1(x) + "," + f1(y)).join("L");
/** The kit a mark draws with. o: { line, sharp, sw (the line's weight on the 1000 box), inv (the mark knocked out
 *  of a tile: its ink is the ground's colour and its cuts the tile's) }. */
function markKit(c, o = {}) {
  const line = !!o.line, sharp = !!o.sharp, sw = o.sw || 46, inv = !!o.inv, it = [];
  // onBody: the mark sits on a layout's own body (a seal), so its ink is cut from it (tone 0) and its cuts are body
  const low = inv || !!o.onBody, INK = inv ? "G" : (o.ink || "A"), INKT = low ? 0 : 1, CUT = inv ? "A" : "G", CUTT = low ? 1 : 0, cap = !sharp;
  let first = !inv;
  const stroke = (d, w, extra = {}) => ({ d, stroke: INK, sw: w, tone: INKT, round: cap, join: !cap, ...extra });
  const m = {
    it, line, sharp, sw,
    /** a corner radius: soft, or a hint of one when sharp */
    r: v => sharp ? Math.min(v, 14) : v,
    /** the mark's body: filled, or its outline. cover: in line mode, paint the ground inside it first, so what it
     *  overlaps is hidden (a card in front of a card) */
    body(d, { cover = false, tf = "", rule = "" } = {}) {
      const t = { ...(tf ? { tf } : {}), ...(rule ? { rule } : {}) };
      if (line) { if (cover) it.push({ d, fill: CUT, tone: CUTT, ...t }); it.push(stroke(d, sw, t)); }
      else { it.push({ d, fill: INK, tone: INKT, ...t, ...(first ? { body: true } : {}) }); first = false; }
    },
    /** a shape cut out of the body: the ground's colour, or its outline in line mode */
    hole(d, { tf = "" } = {}) { const t = tf ? { tf } : {}; it.push(line ? stroke(d, sw * .8, t) : { d, fill: CUT, tone: CUTT, ...t }); },
    /** a line cut through the body (a seam, a bevel): the ground's colour, or a line of the mark's in line mode */
    knock(d, w = 22) { it.push(line ? stroke(d, sw * .75) : { d, stroke: CUT, sw: w, tone: CUTT, round: cap, join: !cap }); },
    /** a free line in the mark's colour (a beam, a band, a ray): heavier when solid */
    ink(d, w = 60, extra = {}) { it.push(stroke(d, line ? sw : w, extra)); },
    /** a small solid shape in the mark's colour either way (a stone, a dot) */
    dot(d) { it.push({ d, fill: INK, tone: INKT }); },
    /** the ground's colour drawn as a line wider than a body's edge: the gap where one part passes over another */
    gap(d, w, tf = "", round = true) { it.push({ d, stroke: CUT, sw: w, tone: CUTT, round, ...(tf ? { tf } : {}) }); },
    /** the shop's initials: cut from the body when solid (on), else in the mark's colour */
    init(x, y, w, capH, { on = true, str = c.N.init, track = .02, face = c.D } = {}) {
      const s = fitSize(face, str, w, capH, track), cut = on && !line;
      const t = textLine(face, str, s, x, y + capOf(face, s) / 2, { fill: cut ? CUT : INK, tone: cut ? CUTT : INKT, track });
      if (t.item) it.push(t.item);
      return t;
    },
  };
  return m;
}
const ring2 = (cx, cy, r0, r1) => circleD(cx, cy, r0) + circleD(cx, cy, r1);
/** a four-pointed sparkle */
const sparkleD = (cx, cy, r, soft = true) => soft
  ? `M${f1(cx)},${f1(cy - r)}C${f1(cx + r * .1)},${f1(cy - r * .1)} ${f1(cx + r * .1)},${f1(cy - r * .1)} ${f1(cx + r)},${f1(cy)}C${f1(cx + r * .1)},${f1(cy + r * .1)} ${f1(cx + r * .1)},${f1(cy + r * .1)} ${f1(cx)},${f1(cy + r)}C${f1(cx - r * .1)},${f1(cy + r * .1)} ${f1(cx - r * .1)},${f1(cy + r * .1)} ${f1(cx - r)},${f1(cy)}C${f1(cx - r * .1)},${f1(cy - r * .1)} ${f1(cx - r * .1)},${f1(cy - r * .1)} ${f1(cx)},${f1(cy - r)}Z`
  : starD(cx, cy, r, 4, .28);
const checkD = (x, y, s) => lineD([x - s * .5, y], [x - s * .14, y + s * .36], [x + s * .56, y - s * .38]);
const arrowHead = (cx, cy, r, a, len = 70, back = 14) => { const [tx, ty] = onC(cx, cy, r, a), [h0x, h0y] = onC(cx, cy, r - len, a - back), [h1x, h1y] = onC(cx, cy, r + len, a - back); return lineD([h0x, h0y], [tx, ty], [h1x, h1y]); };

/* The marks. kind: "act" (what the shop does: trade, check, weigh, tag), "abstract" (built from circles and bars),
   "object" (the goods, simplified) or "letter" (the initials in a form of the trade's). init: the mark holds the
   shop's initials itself. lines: the lines whose family it is in, best first. */
const MARK_SET = {
  /* the app tile: a rounded square, a lowercase initial and a dot */
  tileInit: { name: "Initial tile", kind: "letter", init: true, draw(c, m) {
    m.body(m.sharp ? rectD(70, 70, 860, 860, 60) : squircleD(500, 500, 440));
    const ch = (c.Nx.lead || c.N.lead).replace(/[^A-Za-z0-9]/g, "").slice(0, 1) || c.N.init.slice(0, 1);
    // lower case where the voice sets names so, but never an l, i or j (read as I, or as a stray mark)
    const letter = c.V.case === "lower" && !/[ilj]/i.test(ch) ? ch.toLowerCase() : ch.toUpperCase();
    const t = m.init(470, 500, 460, 400, { str: letter, track: 0 });
    if (t && t.box) (m.line ? m.dot : m.hole)(circleD(Math.min(820, t.box.x1 + 60), t.box.bot - 40, 44));
  } },
  /* two rings, one through the other: linked, a trade, a partnership */
  rings: { name: "Linked rings", kind: "abstract", draw(c, m) {
    const w = m.line ? m.sw : 92, A = [370, 500], B = [630, 500], r = 220;
    m.ink(circleD(...A, r), w);
    m.gap(circleD(...B, r), w + 56); m.ink(circleD(...B, r), w);
    // where A passes over B again, at the foot: cut B there and draw A's arc back, square-ended so it meets itself
    m.gap(arcPath(...A, r, 118, 166), w + 56, "", false); m.ink(arcPath(...A, r, 112, 172), w, { round: false, join: false });
  } },
  /* two rounds, one giving to the other: buy and sell */
  swapRounds: { name: "Give & take", kind: "abstract", draw(c, m) {
    m.body(circleD(360, 500, 250));
    m.gap(circleD(640, 500, 250), (m.line ? m.sw : 84) + 50);
    m.ink(circleD(640, 500, 250), m.line ? m.sw : 84);
  } },
  /* two arrows chasing round the initials: trade, softened */
  arrows: { name: "Trade arrows", kind: "act", init: true, draw(c, m) {
    const w = m.line ? m.sw : 64;
    for (const [a0, a1] of [[-140, -12], [40, 168]]) { m.ink(arcPath(500, 500, 380, a0, a1), w); m.ink(arrowHead(500, 500, 380, a1 + 4, 74, 16), w); }
    m.init(500, 500, 420, 230, { on: false });
  } },
  /* signal arcs over the initials: a phone that works */
  signal: { name: "Signal", kind: "act", init: true, draw(c, m) {
    const w = m.line ? m.sw : 62;
    for (const r of [170, 300, 430]) m.ink(arcPath(500, 560, r, -48, 48), w);
    m.dot(circleD(500, 560, 70));
    m.init(500, 830, 520, 190, { on: false });
  } },
  /* a price tag with its hole: what the shop pays */
  tag: { name: "Price tag", kind: "act", init: true, draw(c, m) {
    m.body(rpolyD([[500, 70], [780, 300], [780, 920], [220, 920], [220, 300]], m.r(90)));
    m.hole(circleD(500, 290, 56));
    m.init(500, 640, 440, 220);
  } },
  /* a shop's awning over its door */
  awning: { name: "Shop front", kind: "object", draw(c, m) {
    m.body(m.sharp ? "M120,440V200H880V440" + [690, 500, 310, 120].map(x => `A95,95 0 0 1 ${x},440`).join("") + "Z"
      : "M120,440V260Q120,200 180,200H820Q880,200 880,260V440" + [690, 500, 310, 120].map(x => `A95,95 0 0 1 ${x},440`).join("") + "Z");
    for (const x of [310, 500, 690]) m.knock(lineD([x, 210], [x, 430]), 20);
    m.body(rectD(180, 500, 640, 400, m.r(30)));
    m.hole(rectD(420, 620, 160, 280, m.r(18)));
    m.hole(rectD(240, 580, 130, 150, m.r(14))); m.hole(rectD(630, 580, 130, 150, m.r(14)));
  } },
  /* a hallmark: the initials struck in a cartouche, as a maker stamps gold */
  hallmark: { name: "Hallmark", kind: "letter", init: true, draw(c, m) {
    const shape = m.sharp ? rpolyD([[160, 270], [840, 270], [920, 350], [920, 650], [840, 730], [160, 730], [80, 650], [80, 350]], 0) : rectD(70, 270, 860, 460, 230);
    m.body(shape);
    m.knock(m.sharp ? rpolyD([[185, 315], [815, 315], [875, 375], [875, 625], [815, 685], [185, 685], [125, 625], [125, 375]], 0) : rectD(118, 318, 764, 364, 182), 14);
    m.init(500, 500, 560, 240, { track: .08 });
  } },
  /* a balance scale: weighed fairly */
  scale: { name: "Balance", kind: "act", draw(c, m) {
    const w = m.line ? m.sw : 44;
    m.ink(lineD([500, 210], [500, 830]), w); m.ink(lineD([170, 270], [830, 270]), w);
    m.body(rectD(320, 830, 360, 70, m.r(35)));
    m.dot(circleD(500, 200, 46));
    for (const x of [230, 770]) {
      m.ink(lineD([x, 270], [x - 130, 560]), w * .6); m.ink(lineD([x, 270], [x + 130, 560]), w * .6);
      m.body(`M${x - 160},560H${x + 160}A160,140 0 0 1 ${x - 160},560Z`);
    }
  } },
  /* the pawnbroker's three balls: the trade's own sign, nobody's mark */
  pawnBalls: { name: "Three balls", kind: "object", draw(c, m) {
    const w = m.line ? m.sw : 40;
    m.ink(lineD([170, 170], [830, 170]), w);
    for (const [x, y] of [[320, 540], [680, 540], [500, 800]]) m.ink(lineD([x, 170], [x, y - 150]), w * .7);
    for (const [x, y] of [[320, 540], [680, 540], [500, 800]]) m.body(circleD(x, y, 150));
    if (!m.line) for (const [x, y] of [[320, 540], [680, 540], [500, 800]]) m.knock(arcPath(x, y, 100, 290, 340), 18);
  } },
  /* a rosette with a check: checked and paid */
  sealCheck: { name: "Checked seal", kind: "act", draw(c, m) {
    const pts = [];
    for (let i = 0; i < 96; i++) { const t = i / 96 * Math.PI * 2, r = 440 + (m.sharp ? 34 * ((i % 6) < 3 ? 1 : -1) : 30 * Math.cos(16 * t)); pts.push([500 + r * Math.sin(t), 500 - r * Math.cos(t)]); }
    m.body(m.sharp ? starD(500, 500, 470, 16, .88) : polyD(pts));
    m.knock(circleD(500, 500, 330), 14);
    m.knock(checkD(510, 500, 300), m.line ? m.sw : 64);
  } },
  /* a shield with a check */
  shieldCheck: { name: "Shield", kind: "act", draw(c, m) {
    m.body(shieldD(170, 70, 660, 860));
    m.knock(checkD(510, 470, 340), 66);
  } },
  /* a coin: its rim, a ring of beads, the initials struck in it */
  coin: { name: "Coin", kind: "letter", init: true, draw(c, m) {
    m.body(circleD(500, 500, 460));
    m.knock(circleD(500, 500, 395), 12);
    if (!m.line) { const b = []; for (let i = 0; i < 60; i++) { const [x, y] = onC(500, 500, 428, i * 6); b.push(circleD(x, y, 8)); } m.hole(b.join("")); }
    m.init(500, 500, 480, 250, { track: .04 });
  } },
  /* a cast bar, its corners softened, the initials cut through it */
  bar: { name: "Bar", kind: "letter", init: true, draw(c, m) {
    m.body(rpolyD([[230, 250], [770, 250], [910, 750], [90, 750]], m.r(80)));
    m.knock(rpolyD([[290, 320], [710, 320], [810, 680], [190, 680]], m.r(40)), 12);
    m.init(500, 505, 470, 230, { track: .04 });
  } },
  /* three bars stacked */
  bars: { name: "Stacked bars", kind: "object", draw(c, m) {
    for (const [x, y] of [[500, 230], [290, 510], [710, 510]]) {
      m.body(rpolyD([[x - 150, y], [x + 150, y], [x + 200, y + 220], [x - 200, y + 220]], m.r(36)));
      m.knock(lineD([x - 110, y + 60], [x + 110, y + 60]), 14);
    }
  } },
  /* a ring and its stone */
  ringStone: { name: "Ring", kind: "object", draw(c, m) {
    m.ink(circleD(500, 610, 290), m.line ? m.sw : 74);
    m.gap(rpolyD([[380, 150], [620, 150], [710, 250], [500, 430], [290, 250]], m.r(18)), 36);
    m.body(rpolyD([[380, 150], [620, 150], [710, 250], [500, 430], [290, 250]], m.r(18)));
    m.knock("M290,250H710M380,150L440,250L500,430M620,150L560,250L500,430", 12);
  } },
  /* a fan of rays over a half sun: deco */
  fan: { name: "Deco fan", kind: "abstract", draw(c, m) {
    const rays = [];
    for (let i = -6; i <= 6; i++) { const [x0, y0] = onC(500, 680, 270, i * 13), [x1, y1] = onC(500, 680, 470, i * 13); rays.push(`M${f1(x0)},${f1(y0)}L${f1(x1)},${f1(y1)}`); }
    m.ink(rays.join(""), m.line ? m.sw * .7 : 26);
    m.body(arcPath(500, 680, 220, -90, 90) + "Z");
    m.ink(lineD([90, 680], [910, 680]), m.line ? m.sw * .7 : 26);
  } },
  /* a loupe over a coin: looked at closely */
  loupe: { name: "Loupe", kind: "act", init: true, draw(c, m) {
    m.ink(lineD([660, 660], [880, 880]), m.line ? m.sw * 1.6 : 120);
    m.ink(circleD(430, 430, 340), m.line ? m.sw : 64);
    m.body(circleD(430, 430, 230));
    m.init(430, 430, 300, 150, { track: .04 });
  } },
  /* a guilloché rosette, the engraving of banknotes, round the initials */
  guilloche: { name: "Engraved seal", kind: "letter", init: true, draw(c, m) {
    m.ink(circleD(500, 500, 470), m.line ? m.sw * .6 : 16);
    const g = [];
    for (let k = 0; k < 10; k++) { const pts = []; for (let i = 0; i <= 240; i++) { const t = i / 240 * Math.PI * 2, r = 360 + 40 * Math.sin(30 * t + k * Math.PI / 5); pts.push(f1(500 + r * Math.sin(t)) + "," + f1(500 - r * Math.cos(t))); } g.push("M" + pts.join("L")); }
    m.ink(g.join(""), m.line ? Math.max(3, m.sw * .12) : 4);
    m.gap(circleD(500, 500, 290), 30);
    m.body(circleD(500, 500, 290));
    m.init(500, 500, 380, 200, { track: .04 });
  } },
  /* coins stacked, seen from the side */
  rounds: { name: "Stacked rounds", kind: "object", draw(c, m) {
    for (const y of [650, 490, 330]) {
      m.body(`M160,${y}A340,115 0 0 0 840,${y}V${y + 80}A340,115 0 0 1 160,${y + 80}Z`, { cover: true });
      m.body(`M160,${y}A340,115 0 0 1 840,${y}A340,115 0 0 1 160,${y}Z`, { cover: true });
      m.knock(`M160,${y}A340,115 0 0 0 840,${y}`, 14);
    }
  } },
  /* a watch: straps, the case, twelve marks and the hands at ten past ten */
  dial: { name: "Watch", kind: "object", draw(c, m) {
    m.body(rectD(385, 40, 230, 220, m.r(50))); m.body(rectD(385, 740, 230, 220, m.r(50)));
    m.body(rectD(790, 465, 70, 70, m.r(18)));
    m.body(circleD(500, 500, 320), { cover: true });
    m.hole(circleD(500, 500, 250));
    const t = []; for (let i = 0; i < 12; i++) { const [x0, y0] = onC(500, 500, i % 3 ? 205 : 180, i * 30), [x1, y1] = onC(500, 500, 230, i * 30); t.push(`M${f1(x0)},${f1(y0)}L${f1(x1)},${f1(y1)}`); }
    m.ink(t.join(""), m.line ? m.sw * .55 : 18);
    const [hx, hy] = onC(500, 500, 130, -60), [mx, my] = onC(500, 500, 180, 60);
    m.ink(lineD([hx, hy], [500, 500], [mx, my]), m.line ? m.sw * .8 : 30);
    m.dot(circleD(500, 500, 22));
  } },
  /* a bezel: minute marks round the initials */
  bezel: { name: "Bezel", kind: "letter", init: true, draw(c, m) {
    m.body(ring2(500, 500, 470, 350), { rule: "evenodd" });
    const t = [], l = [];
    for (let i = 0; i < 60; i++) { const [x0, y0] = onC(500, 500, i % 5 ? 410 : 380, i * 6), [x1, y1] = onC(500, 500, 445, i * 6); (i % 5 ? t : l).push(`M${f1(x0)},${f1(y0)}L${f1(x1)},${f1(y1)}`); }
    if (!m.line) { m.knock(t.join(""), 7); m.knock(l.join(""), 16); }
    m.init(500, 500, 420, 220, { on: false, track: .04 });
  } },
  /* a card with a sparkle in its window */
  cardCorner: { name: "Card", kind: "object", draw(c, m) {
    m.body(rectD(250, 70, 500, 860, m.r(56)));
    m.knock(rectD(310, 140, 380, 480, m.r(24)), 16);
    m.hole(sparkleD(500, 380, 150, !m.sharp));
    m.knock("M330,720H670M330,800H560", 22);
  } },
  /* a fan of three cards */
  cardFan: { name: "Card fan", kind: "object", draw(c, m) {
    const card = rectD(340, 170, 320, 540, m.r(40));
    for (const a of [-20, 20]) { m.gap(card, 30, `rotate(${a} 500 900)`); m.body(card, { tf: `rotate(${a} 500 900)`, cover: true }); }
    m.gap(card, 40); m.body(card, { cover: true });
    m.hole(sparkleD(500, 420, 120, !m.sharp));
  } },
  /* the holo sparkle */
  holo: { name: "Holo sparkle", kind: "abstract", draw(c, m) {
    m.body(sparkleD(430, 540, 370, !m.sharp));
    m.body(sparkleD(780, 220, 150, !m.sharp));
    m.dot(circleD(250, 180, 50));
  } },
  /* a graded case: a blank label (never a grader's) and a card in its window */
  gcase: { name: "Graded case", kind: "letter", init: true, draw(c, m) {
    m.body(rectD(250, 40, 500, 920, m.r(60)));
    m.hole(rectD(295, 85, 410, 190, m.r(24)));
    m.init(500, 180, 330, 110, { on: false });
    m.hole(rectD(295, 320, 410, 590, m.r(24)));
    m.body(rectD(345, 370, 310, 490, m.r(18)));
    m.hole(sparkleD(500, 560, 90, !m.sharp));
  } },
  /* a sealed pack, crimped at both ends */
  pack: { name: "Pack", kind: "object", draw(c, m) {
    const top = [], bot = [];
    for (let i = 0; i <= 8; i++) { const x = 250 + i * 62.5; top.push([x, i % 2 ? 70 : 110]); bot.unshift([x, i % 2 ? 930 : 890]); }
    m.body(rpolyD([...top, ...bot], m.r(10)));
    m.knock("M250,215H750M250,785H750", 18);
    m.hole(sparkleD(500, 500, 170, !m.sharp));
  } },
  /* a ball's stitched seams */
  stitch: { name: "Ball", kind: "object", draw(c, m) {
    m.body(circleD(500, 500, 440));
    const seam = s => `M${500 + s * 250},${118}Q${500 + s * 80},500 ${500 + s * 250},${882}`;
    for (const s of [-1, 1]) {
      m.knock(seam(s), 16);
      const st = [];
      for (let i = 1; i < 10; i++) {
        const t = i / 10, x = (1 - t) ** 2 * (500 + s * 250) + 2 * (1 - t) * t * (500 + s * 80) + t * t * (500 + s * 250), y = (1 - t) ** 2 * 118 + 2 * (1 - t) * t * 500 + t * t * 882;
        st.push(`M${f1(x - 34)},${f1(y - 14 * s * (t < .5 ? 1 : -1))}L${f1(x + 34)},${f1(y + 14 * s * (t < .5 ? 1 : -1))}`);
      }
      m.knock(st.join(""), 12);
    }
  } },
  /* home plate with the initials */
  homePlate: { name: "Home plate", kind: "letter", init: true, draw(c, m) {
    m.body(rpolyD([[150, 140], [850, 140], [850, 560], [500, 890], [150, 560]], m.r(60)));
    m.knock(rpolyD([[205, 195], [795, 195], [795, 535], [500, 815], [205, 535]], m.r(36)), 12);
    m.init(500, 430, 500, 220);
  } },
  /* a pennant on its pole, the initials on it */
  pennant: { name: "Pennant", kind: "letter", init: true, draw(c, m) {
    m.ink(lineD([160, 90], [160, 920]), m.line ? m.sw : 44);
    m.body(rpolyD([[190, 130], [910, 360], [190, 590]], m.r(46)));
    m.init(420, 360, 330, 150);
  } },
  /* an infield: the diamond, its bases and the mound */
  infield: { name: "Infield", kind: "object", draw(c, m) {
    m.body(rpolyD([[500, 100], [900, 500], [500, 900], [100, 500]], m.r(50)));
    for (const [x, y] of [[500, 230], [770, 500], [230, 500]]) m.hole(rpolyD([[x, y - 46], [x + 46, y], [x, y + 46], [x - 46, y]], m.r(8)));
    m.hole(rpolyD([[460, 730], [540, 730], [540, 770], [500, 810], [460, 770]], m.r(6)));
    m.hole(circleD(500, 500, 64));
  } },
  /* a controller, softened */
  pad: { name: "Controller", kind: "object", draw(c, m) {
    m.body("M310,300H690A180,180 0 0 1 860,460L900,620A90,90 0 0 1 740,690L650,580H350L260,690A90,90 0 0 1 100,620L140,460A180,180 0 0 1 310,300Z");
    m.hole(rectD(180, 430, 150, 46, m.r(14)) + rectD(232, 378, 46, 150, m.r(14)));
    for (const [x, y] of [[700, 410], [760, 470], [640, 470], [700, 530]]) m.hole(circleD(x, y, 28));
  } },
  /* a cross pad */
  cross: { name: "Cross pad", kind: "object", draw(c, m) {
    m.body(rpolyD([[360, 110], [640, 110], [640, 360], [890, 360], [890, 640], [640, 640], [640, 890], [360, 890], [360, 640], [110, 640], [110, 360], [360, 360]], m.r(56)));
    m.hole(circleD(500, 500, 64));
    for (const a of [0, 90, 180, 270]) m.hole(rpolyD([[500, 170], [560, 260], [440, 260]], m.r(10)), { tf: `rotate(${a} 500 500)` });
  } },
  /* four buttons in a diamond */
  buttons: { name: "Buttons", kind: "abstract", draw(c, m) {
    for (const [x, y] of [[500, 220], [780, 500], [500, 780], [220, 500]]) m.body(circleD(x, y, 150));
    m.hole(circleD(500, 220, 60));
  } },
  /* a cartridge, the initials on its label */
  cart: { name: "Cartridge", kind: "letter", init: true, draw(c, m) {
    m.body(rpolyD([[200, 100], [800, 100], [800, 900], [200, 900]], m.r(56)));
    m.hole(rectD(270, 200, 460, 400, m.r(30)));
    m.init(500, 400, 360, 170, { on: false });
    m.knock("M300,700V840M400,700V840M500,700V840M600,700V840M700,700V840", 26);
  } },
  /* a joystick */
  stick: { name: "Joystick", kind: "object", draw(c, m) {
    m.body(rectD(170, 640, 660, 250, m.r(80)));
    m.ink(lineD([500, 640], [500, 330]), m.line ? m.sw : 74);
    m.body(circleD(500, 250, 140));
    m.dot(rectD(250, 590, 120, 50, 25));
  } },
  /* a key: the initials cut through its bow */
  key: { name: "Key", kind: "letter", init: true, draw(c, m) {
    m.body(rectD(460, 450, 460, 100, m.r(46)) + rectD(760, 520, 64, 120, m.r(20)) + rectD(860, 520, 56, 90, m.r(18)));
    m.gap(circleD(290, 500, 240), 30);
    m.body(circleD(290, 500, 240), { cover: true });
    m.init(290, 500, 300, 190);
  } },
  /* a speedometer, softened */
  gauge: { name: "Gauge", kind: "act", draw(c, m) {
    m.ink(arcPath(500, 560, 390, -125, 125), m.line ? m.sw : 66);
    const t = []; for (let a = -100; a <= 100; a += 25) { const [x0, y0] = onC(500, 560, 285, a), [x1, y1] = onC(500, 560, 320, a); t.push(`M${f1(x0)},${f1(y0)}L${f1(x1)},${f1(y1)}`); }
    m.ink(t.join(""), m.line ? m.sw * .6 : 24);
    const [nx, ny] = onC(500, 560, 300, 45);
    m.ink(lineD([500, 560], [nx, ny]), m.line ? m.sw : 46);
    m.dot(circleD(500, 560, 62));
  } },
  /* a road running away: lanes and dashes */
  lanes: { name: "Road", kind: "abstract", draw(c, m) {
    const w = m.line ? m.sw : 56;
    m.ink(lineD([150, 900], [420, 110]), w); m.ink(lineD([850, 900], [580, 110]), w);
    m.body(rpolyD([[465, 730], [535, 730], [545, 890], [455, 890]], m.r(14)));
    m.body(rpolyD([[476, 470], [524, 470], [530, 600], [470, 600]], m.r(10)));
    m.body(rpolyD([[484, 260], [516, 260], [519, 360], [481, 360]], m.r(8)));
  } },
  /* a wheel: tyre, rim and five spokes */
  wheel: { name: "Wheel", kind: "object", draw(c, m) {
    m.body(ring2(500, 500, 460, 340), { rule: "evenodd" });
    m.ink(circleD(500, 500, 300), m.line ? m.sw * .6 : 22);
    for (let i = 0; i < 5; i++) m.body(rectD(465, 210, 70, 210, m.r(35)), { tf: `rotate(${i * 72} 500 500)` });
    m.body(circleD(500, 500, 95)); m.hole(circleD(500, 500, 34));
  } },
  /* a steering wheel */
  steering: { name: "Steering wheel", kind: "object", draw(c, m) {
    m.body(ring2(500, 500, 460, 370), { rule: "evenodd" });
    for (const a of [90, 270, 180]) m.body(rectD(455, 560, 90, 230, m.r(40)), { tf: `rotate(${a} 500 500)` });
    m.body(circleD(500, 500, 150)); m.hole(circleD(500, 500, 70));
  } },
  /* a keycap, the initials on its face */
  keycap: { name: "Key cap", kind: "letter", init: true, draw(c, m) {
    m.body(rectD(110, 120, 780, 760, m.r(110)));
    m.hole(rectD(190, 170, 620, 560, m.r(70)));
    m.init(500, 450, 440, 230, { on: false });
  } },
  /* a chip, softened: four pins a side, the initials on the die */
  chip: { name: "Chip", kind: "letter", init: true, draw(c, m) {
    const p = [];
    for (let i = 0; i < 4; i++) { const q = 320 + i * 120; p.push(rectD(q - 22, 90, 44, 140, m.r(22)), rectD(q - 22, 770, 44, 140, m.r(22)), rectD(90, q - 22, 140, 44, m.r(22)), rectD(770, q - 22, 140, 44, m.r(22))); }
    m.body(p.join(""));
    m.body(rectD(210, 210, 580, 580, m.r(80)), { cover: true });
    m.knock(rectD(270, 270, 460, 460, m.r(40)), 12);
    m.init(500, 500, 360, 190);
  } },
  /* a laptop */
  laptop: { name: "Laptop", kind: "object", draw(c, m) {
    m.body(rectD(200, 200, 600, 430, m.r(40)));
    m.hole(rectD(245, 245, 510, 340, m.r(16)));
    m.body(rpolyD([[90, 680], [910, 680], [860, 790], [140, 790]], m.r(30)));
    m.hole(rectD(440, 680, 120, 30, m.r(15)));
  } },
  /* a pointer */
  cursor: { name: "Pointer", kind: "abstract", draw(c, m) {
    m.body(rpolyD([[290, 110], [290, 810], [450, 660], [560, 890], [670, 840], [560, 615], [770, 615]], m.r(34)));
  } },
  /* a monitor */
  monitor: { name: "Monitor", kind: "object", draw(c, m) {
    m.body(rectD(110, 140, 780, 520, m.r(40)));
    m.hole(rectD(160, 190, 680, 400, m.r(16)));
    m.body(rectD(450, 660, 100, 130, 0) + rectD(310, 790, 380, 60, m.r(30)));
  } },
  /* traces between nodes */
  circuit: { name: "Circuit", kind: "abstract", draw(c, m) {
    const w = m.line ? m.sw : 44;
    m.ink("M200,280H420L560,420H800", w); m.ink("M200,500H800", w); m.ink("M200,720H420L560,580H800", w);
    for (const [x, y] of [[200, 280], [800, 420], [200, 500], [800, 500], [200, 720], [800, 580]]) { m.body(circleD(x, y, 70)); m.hole(circleD(x, y, 26)); }
  } },
  /* headphones, softened */
  headphones: { name: "Headphones", kind: "object", draw(c, m) {
    m.ink(arcPath(500, 560, 330, -90, 90), m.line ? m.sw : 64);
    m.body(rectD(110, 520, 190, 330, m.r(80)) + rectD(700, 520, 190, 330, m.r(80)));
    if (!m.line) m.knock(rectD(150, 580, 110, 210, m.r(46)) + rectD(740, 580, 110, 210, m.r(46)), 12);
  } },
  /* sound bars */
  soundbars: { name: "Sound", kind: "abstract", draw(c, m) {
    [220, 440, 640, 820, 560, 360, 200].forEach((h, i) => m.body(rectD(150 + i * 110 - 36, 500 - h / 2, 72, h, m.r(36))));
  } },
  /* a speaker: its cone and tweeter */
  speaker: { name: "Speaker", kind: "object", draw(c, m) {
    m.body(rectD(210, 60, 580, 880, m.r(70)));
    m.hole(circleD(500, 620, 210)); m.body(circleD(500, 620, 120)); m.hole(circleD(500, 620, 42));
    m.hole(circleD(500, 250, 84)); m.body(circleD(500, 250, 34));
  } },
  /* a record, the initials on its label */
  record: { name: "Record", kind: "letter", init: true, draw(c, m) {
    m.body(circleD(500, 500, 460));
    m.knock(m.line ? circleD(500, 500, 330) : circleD(500, 500, 395) + circleD(500, 500, 330) + circleD(500, 500, 265), 8);
    m.hole(circleD(500, 500, 200));
    m.init(500, 500, 250, 120, { on: false });
  } },
  /* a viewfinder's corners round the initials */
  viewfinder: { name: "Viewfinder", kind: "letter", init: true, draw(c, m) {
    const w = m.line ? m.sw : 52, k = 190;
    m.ink(lineD([120, 120 + k], [120, 120], [120 + k, 120]) + lineD([880 - k, 120], [880, 120], [880, 120 + k]) + lineD([880, 880 - k], [880, 880], [880 - k, 880]) + lineD([120 + k, 880], [120, 880], [120, 880 - k]), w);
    m.init(500, 500, 560, 280, { on: false });
    m.dot(circleD(790, 210, 30));
  } },
  /* a lens's blades, softened */
  aperture: { name: "Aperture", kind: "object", draw(c, m) {
    m.body(circleD(500, 500, 460));
    const hex = [], bl = [];
    for (let i = 0; i < 6; i++) { const [x0, y0] = onC(500, 500, 200, i * 60), [x1, y1] = onC(500, 500, 430, i * 60 + 62); hex.push([x0, y0]); bl.push(`M${f1(x0)},${f1(y0)}L${f1(x1)},${f1(y1)}`); }
    m.knock(bl.join(""), 16);
    m.hole(rpolyD(hex, m.r(30)));
  } },
  /* a lens seen head on: its rings */
  lensRings: { name: "Lens", kind: "object", draw(c, m) {
    m.body(circleD(500, 500, 460)); m.hole(circleD(500, 500, 370)); m.body(circleD(500, 500, 300)); m.hole(circleD(500, 500, 200));
    m.dot(circleD(500, 500, 120)); m.knock(arcPath(500, 500, 80, 280, 345), 22);
  } },
  /* a camera */
  camera: { name: "Camera", kind: "object", draw(c, m) {
    m.body(rectD(100, 290, 800, 520, m.r(80)) + rpolyD([[330, 300], [380, 190], [620, 190], [670, 300]], m.r(30)));
    m.hole(circleD(500, 550, 200)); m.body(circleD(500, 550, 130));
    m.hole(rectD(700, 350, 110, 56, m.r(18)));
  } },
  /* a drop */
  drop: { name: "Drop", kind: "object", draw(c, m) {
    m.body("M500,60C500,60 180,430 180,630A320,320 0 0 0 820,630C820,430 500,60 500,60Z");
    m.knock("M300,560Q318,470 370,400", 34);
  } },
  /* a test strip, leaning */
  strip: { name: "Strip", kind: "object", draw(c, m) {
    m.body(rectD(390, 60, 220, 880, m.r(40)), { tf: "rotate(24 500 500)" });
    m.hole(rectD(430, 170, 140, 160, m.r(20)), { tf: "rotate(24 500 500)" });
    for (const x of [440, 485, 530]) m.hole(rectD(x, 720, 26, 150, 13), { tf: "rotate(24 500 500)" });
  } },
  /* a sealed box */
  box: { name: "Box", kind: "object", draw(c, m) {
    m.body(rpolyD([[500, 120], [860, 310], [860, 700], [500, 890], [140, 700], [140, 310]], m.r(40)));
    m.knock("M140,310L500,500L860,310M500,500V890", 16);
    m.knock("M320,215L680,405", 40);
  } },
  /* a crate's front */
  crate: { name: "Crate", kind: "object", draw(c, m) {
    m.body(rectD(130, 170, 740, 660, m.r(40)));
    m.knock(rectD(200, 240, 600, 520, m.r(16)), 16);
    m.knock("M200,413H800M200,587H800", 16);
    m.knock("M230,730L770,270", 26);
  } },
  /* a pallet and its boxes */
  pallet: { name: "Pallet", kind: "object", draw(c, m) {
    m.body(rectD(90, 700, 820, 64, m.r(18)) + rectD(130, 764, 120, 96, m.r(10)) + rectD(440, 764, 120, 96, m.r(10)) + rectD(750, 764, 120, 96, m.r(10)));
    m.body(rectD(140, 380, 340, 320, m.r(24))); m.body(rectD(520, 260, 340, 440, m.r(24)));
    m.knock("M310,380V470M690,260V360", 22);
  } },
  /* boxes stacked */
  boxes: { name: "Boxes", kind: "object", draw(c, m) {
    for (const [x, y] of [[140, 520], [520, 520], [330, 160]]) { m.body(rectD(x, y, 340, 340, m.r(28))); m.knock(lineD([x + 170, y], [x + 170, y + 90]), 22); }
  } },
  /* arrows in and out */
  inout: { name: "In & out", kind: "act", draw(c, m) {
    const w = m.line ? m.sw : 64;
    m.ink(lineD([170, 350], [800, 350]), w); m.ink(lineD([660, 210], [810, 350], [660, 490]), w);
    m.ink(lineD([830, 650], [200, 650]), w); m.ink(lineD([340, 510], [190, 650], [340, 790]), w);
  } },
  /* a phone and a tablet side by side */
  pairDevices: { name: "Phone & tablet", kind: "object", draw(c, m) {
    m.body(rectD(120, 160, 500, 680, m.r(56))); m.hole(rectD(165, 210, 410, 580, m.r(26)));
    m.gap(rectD(560, 330, 320, 560, m.r(64)), 40);
    m.body(rectD(560, 330, 320, 560, m.r(64)), { cover: true }); m.hole(rectD(598, 380, 244, 460, m.r(36)));
  } },
  /* a charge bolt in a round */
  bolt: { name: "Charge", kind: "act", draw(c, m) {
    m.body(circleD(500, 500, 460));
    m.hole(rpolyD([[570, 140], [300, 560], [480, 560], [430, 860], [710, 420], [525, 420]], m.r(26)));
  } },
  /* a handset, simplified: never a real phone's camera */
  handset: { name: "Phone", kind: "object", draw(c, m) {
    m.body(rectD(280, 50, 440, 900, m.r(110)));
    if (m.line) m.ink(lineD([450, 130], [550, 130]), m.sw);
    else { m.knock(lineD([450, 130], [550, 130]), 30); m.knock(lineD([430, 860], [570, 860]), 22); }
  } },
  /* a handset with a check on its screen: checked, paid */
  handsetCheck: { name: "Phone, checked", kind: "act", draw(c, m) {
    m.body(rectD(280, 50, 440, 900, m.r(110)));
    if (m.line) m.ink(lineD([450, 130], [550, 130]), m.sw); else m.knock(lineD([450, 130], [550, 130]), 30);
    m.knock(checkD(505, 500, 300), m.line ? m.sw : 60);
  } },
  /* a hanger */
  hanger: { name: "Hanger", kind: "object", draw(c, m) {
    const w = m.line ? m.sw : 52;
    m.ink("M500,380V320C500,292 520,280 540,266A78,78 0 1 0 424,200", w);
    m.ink(rpolyD([[500, 380], [880, 700], [120, 700]], m.r(40)), w);
  } },
  /* the initials in a ring */
  initRing: { name: "Initials", kind: "letter", init: true, draw(c, m) {
    m.ink(circleD(500, 500, 450), m.line ? m.sw : 34);
    m.init(500, 500, 560, 300, { on: false, track: .04 });
  } },
};
/** the marks of a line's family, best first (each line six to eight) */
export const MARKS_FOR = {
  phones: ["tileInit", "signal", "swapRounds", "rings", "arrows", "handsetCheck", "handset", "tag"],
  devices: ["pairDevices", "tileInit", "rings", "bolt", "laptop", "awning", "chip"],
  computers: ["keycap", "chip", "laptop", "cursor", "monitor", "circuit", "tileInit"],
  gold: ["bar", "hallmark", "bars", "ringStone", "coin", "scale", "pawnBalls", "fan"],
  silver: ["bar", "coin", "hallmark", "rounds", "bars", "scale", "guilloche"],
  coins: ["coin", "guilloche", "rounds", "loupe", "hallmark", "scale"],
  wearables: ["dial", "bezel", "ringStone", "hallmark", "fan", "initRing"],
  pokemon: ["cardCorner", "cardFan", "holo", "gcase", "pack", "tileInit"],
  sports: ["stitch", "homePlate", "pennant", "cardCorner", "gcase", "infield"],
  gaming: ["pad", "cross", "buttons", "cart", "stick", "tileInit"],
  cars: ["key", "gauge", "lanes", "wheel", "steering", "tag"],
  audio: ["headphones", "soundbars", "speaker", "record", "signal", "tileInit"],
  cameras: ["viewfinder", "aperture", "lensRings", "camera", "loupe", "tileInit"],
  strips: ["drop", "shieldCheck", "strip", "box", "sealCheck", "tileInit"],
  wholesale: ["crate", "pallet", "boxes", "inout", "box", "sealCheck", "tag"],
  resale: ["arrows", "rings", "swapRounds", "tag", "hanger", "awning", "pawnBalls"],
};
export const LOGO_MARKS = Object.fromEntries(Object.entries(MARK_SET).map(([k, x]) => [k, { key: k, name: x.name, kind: x.kind, init: !!x.init, lines: Object.keys(MARKS_FOR).filter(l => MARKS_FOR[l].includes(k)) }]));
/** a mark's items on its 1000 box, drawn solid or as a line, soft or sharp, or knocked out of a tile (inv) */
function markItems(c, key, o = {}) {
  const M = MARK_SET[key] || MARK_SET.initRing, m = markKit(c, { line: c.d.line, sharp: c.d.sharp, ...o });
  M.draw(c, m);
  return m.it;
}
/** the weight of a line mark drawn s across, to match the name's stems set at size (on the layout's artboard) */
const lineWeight = (c, size, s) => { const g = c.D.g.I || c.D.g.l || c.D.g.H; const stem = g ? (g[3] - g[1]) * size / 1000 : size * .12; return Math.max(24, Math.min(64, stem * .85 * 1000 / s)); };

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
  const small = up(tidy(d.small) || smallFor(d.cat));
  const town = up(tidy(d.town));
  // Nx: the name as the logo's own tones set it (their layouts read it; every older layout reads N, as it did).
  // since: the shop's own plain fact, never invented ("2009" reads SINCE 2009)
  const Nx = V.case ? partsOf(d.name, V.case) : N, since = /^\d{4}$/.test(tidy(d.since)) ? "SINCE " + tidy(d.since) : up(tidy(d.since));
  return { d, V, D, Lb, N, Nx, small, town, since, P: paletteOf(d.pair), icon: LOGO_ICONS[d.icon] ? d.icon : "", R: rng((d.seed | 0) * 2654435761 >>> 0), script };
}
const MIN_CAP = 46;   // a name's capitals, on the 1000 unit artboard: under this it is not a logo's name

/* ---------- the calm layouts' parts (DESIGN-LAW 183) ---------- */
const CALM_KINDS = ["serif", "slab", "geometric", "grotesk", "condensed"];
/** the older layouts a calm logo may wear, with calm lettering and colours (none of them sharp or starred) */
const CALM_OLD = ["monogram", "roundel", "stacked", "label"];
/** the mark a calm layout draws: the design's own, else the first of its line's family */
const markOf = c => c.d.mark || (MARKS_FOR[c.d.cat] || MARKS_FOR.phones)[0];
/** A calm logo keeps a name whole when the trade's part of it is one word (Harbor Mobile, Gold Rush Cash), and sets
 *  two or more of the trade's words under it (LONG BEACH / PHONE BUYERS): the name a shop would say. */
const splitName = c => !!c.N.trail && c.N.trail.split(" ").length >= 2;
const nameOf = c => splitName(c) ? c.Nx.lead : c.Nx.full;
/** what a calm logo says under its name: the trade's words split from the name, else the small line */
const descOf = c => splitName(c) ? c.N.trail : c.small;
/** the plain facts the shop typed: since when, and its town */
const factOf = c => [c.since, c.town && !c.N.full.includes(c.town) ? c.town : ""].filter(Boolean).join("  ·  ");
/** A centred layout's artboard drawn wide, narrowed to hug what was drawn on it (x0 to x1), so a short name is not
 *  a small logo in a wide frame. */
const hug = (r, W, x0, x1, m = 60) => { const half = Math.max(W / 2 - x0, x1 - W / 2) + m, dx = half - W / 2; return { ...r, w: Math.round(half * 2), it: [{ g: r.it, tf: `translate(${f1(dx)} 0)` }] }; };
const leadOf = c => c.V.case ? 1.2 : 1.08;
/** a line of small capitals tracked so its ink spans w (a descriptor as wide as the name), within a range of
 *  tracking; a line too long for the range is set smaller at the least tracking */
function spanLine(it, F, str, w, x, base, capH, fill, { align = "center", min = .12, max = .42 } = {}) {
  let size = capH / (F.cap || 700) * 1000;
  const S = shapeRun(F, str, 0), n = [...str].length - 1;
  let track = n > 0 ? ((w * 1000 / size) - S.w) / n / 1000 : 0;
  if (track < min) { track = min; size = Math.min(size, fitSize(F, str, w, capH, min)); }
  track = Math.min(track, max);
  const t = textLine(F, str, size, x, base, { align, track, fill, tone: 1 });
  if (t.item) it.push(t.item);
  return t;
}
/** a small line set as it is, tracked */
function smallLine(it, F, str, w, x, base, capH, fill, track = .24, align = "center") {
  const s = fitSize(F, str, w, capH, track), t = textLine(F, str, s, x, base, { align, track, fill, tone: 1 });
  if (t.item) it.push(t.item);
  return t;
}
/** the mark in a tile: the initial tile, or any mark of the catalogue drawn as a line knocked out of a soft tile */
function tileItems(c) {
  // a mark that carries the initials itself (a coin, a hallmark) would be a badge in a tile: the tile holds the initial
  if (!c.d.mark || MARK_SET[c.d.mark].init) return markItems(c, "tileInit", { line: false });
  return [{ d: c.d.sharp ? rectD(70, 70, 860, 860, 60) : squircleD(500, 500, 440), fill: "A", tone: 1, body: true },
    { g: markItems(c, c.d.mark, { inv: true, line: true, sw: 52 }), tf: "translate(200 200) scale(.6)" }];
}
/** a calm logo's mark for the profile picture and the favicon: its catalogue mark, or the initial tile */
const calmMark = c => c.d.mark ? markItems(c, c.d.mark) : markItems(c, "tileInit", { line: false });
/** The mark beside the name: the lockup a real shop's sign and site header use. tile: the mark in an app tile. */
function besideLayout(c, tile = false) {
  const it = [], { D, Lb, Nx, N } = c, S = 500, tr = c.V.track || 0, lead = leadOf(c);
  const name = nameOf(c);
  const B = fitBlock(D, name, 1150, 300, { maxLines: 2, lead, track: tr, capMax: 175 });
  const capH = capOf(D, B.size), blockH = capH * (1 + (B.n - 1) * lead);
  const desc = descOf(c), dH = Math.max(30, Math.min(48, capH * .3)), fact = factOf(c), fH = Math.max(26, dH * .8);
  const total = blockH + dH * 2 + (fact ? fH * 1.9 : 0), top = 40 + S / 2 - total / 2, x = 40 + S + 80;
  it.push({ g: tile ? tileItems(c) : markItems(c, markOf(c), { sw: lineWeight(c, B.size, S) }), tf: `translate(40 40) scale(${S / 1000})` });
  const bx = drawBlock(it, D, B, x, top + blockH / 2, { align: "left", lead, track: tr, fill: "I", tone: 1 });
  let y = Math.max(top + blockH, bx.bot0 - capH * .05) + dH * 2;
  const dt = smallLine(it, Lb, desc, Math.max(560, bx.x1 - x + 120), x, y, dH, "A", .22, "left");
  let x1 = Math.max(bx.x1, dt.box.x1);
  if (fact) { y += fH * 1.9; x1 = Math.max(x1, smallLine(it, Lb, fact, 900, x, y, fH, "I", .2, "left").box.x1); }
  return { w: x1 + 50, h: Math.max(S + 80, y + 50), it, ok: capH >= MIN_CAP, word: true };
}
/** The mark above the name, centred: the stacked lockup */
function aboveLayout(c) {
  const it = [], { D, Lb, Nx, N } = c, W = 1400, S = 420, tr = c.V.track || 0, lead = leadOf(c);
  const name = nameOf(c);
  const B = fitBlock(D, name, 1300, 320, { maxLines: 2, lead, track: tr, capMax: 200 });
  const capH = capOf(D, B.size), blockH = capH * (1 + (B.n - 1) * lead);
  it.push({ g: markItems(c, markOf(c), { sw: lineWeight(c, B.size, S) }), tf: `translate(${(W - S) / 2} 30) scale(${S / 1000})` });
  const bx = drawBlock(it, D, B, W / 2, 30 + S + 80 + blockH / 2, { lead, track: tr, fill: "I", tone: 1 });
  const desc = descOf(c), dH = Math.max(30, Math.min(50, capH * .27));
  let y = bx.bot0 + dH * 2.1;
  const dt = smallLine(it, Lb, desc, 900, W / 2, y, dH, "A", .3);
  const rl = Math.min(180, (bx.x1 - bx.x0 - (dt.box.x1 - dt.box.x0)) / 2 - 34);
  if (rl > 40) for (const s of [-1, 1]) it.push({ d: rectD(s < 0 ? dt.box.x0 - 34 - rl : dt.box.x1 + 34, y - dH / 2 - 2, rl, 4, 2), fill: "A", tone: 1 });
  let x0 = Math.min(bx.x0, (W - S) / 2, rl > 40 ? dt.box.x0 - 34 - rl : dt.box.x0), x1 = Math.max(bx.x1, (W + S) / 2, rl > 40 ? dt.box.x1 + 34 + rl : dt.box.x1);
  const fact = factOf(c);
  if (fact) { const fH = Math.max(26, dH * .8); y += fH * 2; const ft = smallLine(it, Lb, fact, 900, W / 2, y, fH, "I", .22); x0 = Math.min(x0, ft.box.x0); x1 = Math.max(x1, ft.box.x1); }
  return hug({ w: W, h: y + 50, it, ok: capH >= MIN_CAP * 1.1, word: true }, W, x0, x1);
}
/** two initials interlaced, a hairline ring round them, on the 1000 box */
function interlaceItems(c, cx = 500, cy = 500, R = 440) {
  const it = [], { D } = c, init = c.N.init.replace(/[^A-Z0-9]/g, "");
  it.push(ring(cx, cy, R, 7, "A", 1));
  const capH = R * 1.06, size = capH / (D.cap || 700) * 1000, k = size / 1000;
  if (init.length < 2) { const t = textLine(D, init || "W", Math.min(size, fitSize(D, init || "W", R * 1.3, capH)), cx, cy + capH / 2, { fill: "A", tone: 1 }); if (t.item) it.push(t.item); return it; }
  const a = init[0], b = init[1], Sa = shapeRun(D, a), Sb = shapeRun(D, b);
  const wa = Sa.w * k, wb = Sb.w * k, ov = Math.min(wa, wb) * .3, total = wa + wb - ov, sc = Math.min(1, R * 1.5 / total);
  const s2 = size * sc, k2 = s2 / 1000, x0 = cx - (wa + wb - ov) * sc / 2, base = cy + capOf(D, s2) / 2;
  const B2 = textLine(D, b, s2, x0 + (wa - ov) * sc, base, { align: "left", fill: "I", tone: 1 }).item;
  const A2 = textLine(D, a, s2, x0, base, { align: "left", fill: "A", tone: 1 }).item;
  it.push(B2, Object.assign({}, A2, { fill: undefined, stroke: "G", sw: 26 / k2, join: true, tone: 0 }), A2);
  return it;
}

const LAYOUTS = {
  /* A round seal: the name round the top, the small line round the foot, stars between, and the
     symbol or the initials in the middle. */
  seal: { name: "Seal", group: "badge", shape: "circle", kinds: RING_KINDS, draw(c) {
    const it = [], cx = 500, cy = 500, { D, Lb, N } = c, thick = c.d.seed % 2 === 0;
    it.push({ d: circleD(cx, cy, 492), fill: "G", tone: 1, body: true, round: true });
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
    it.push({ d: circleD(cx, cy, 494), fill: "G", tone: 1, body: true, round: true });
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
    it.push({ d: circleD(cx, cy, 440), fill: "G", tone: 1, body: true, round: true });
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
    it.push({ d: shieldD(x, y, w, h), fill: "G", tone: 1, body: true });
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
    // the foot sits where the shield narrows to its point: each line held to the width the shield has there
    const shieldW = yy => { const t = (yy - y) / h; return t <= .52 ? w - 80 : Math.max(120, (w - 80) * (1 - Math.pow((t - .52) / .48, 1.6))); };
    const foot = N.trail || c.small, fy = ry + rh + 70, fs = fitSize(Lb, foot, shieldW(fy + 44) * .86, 44, .12);
    it.push(textLine(Lb, foot, fs, 500, fy + capOf(Lb, fs), { track: .12, fill: "I", tone: 0 }).item);
    if (N.trail) { const y2 = fy + capOf(Lb, fs) + 30, s2 = fitSize(Lb, c.small, shieldW(y2 + 26) * .82, 26, .14); it.push(textLine(Lb, c.small, s2, 500, y2 + capOf(Lb, s2), { track: .14, fill: "A", tone: 0 }).item); }
    return { w: 1000, h: 1000, it, ok: capH >= MIN_CAP };
  } },

  /* A stamp: a double frame, the small line on a rule at the head, the name filling the middle, the
     town or what is bought at the foot between stars. */
  stamp: { name: "Stamp", group: "badge", shape: "square", kinds: ["condensed", "wide", "display", "grotesk", "serif"], draw(c) {
    const it = [], { D, Lb, N } = c, W = 1400, H = 860;
    it.push({ d: rectD(20, 20, W - 40, H - 40, 36), fill: "G", tone: 1, body: true });
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
    it.push({ d: tag + circleD(220, 380, 44), fill: "P", tone: 1, rule: "evenodd", body: true });
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
    it.push({ d: rectD(180, y0, 1240, bh), fill: "P", tone: 1, body: true });
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
    it.push({ d: polyD(hexPts(cx, cy, 486)), fill: "G", tone: 1, body: true });
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
    it.push({ d: body(0, 0), fill: "P", tone: 1, body: true });
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
    it.push({ d: starD(cx, cy, 496, 24, .86, c.d.seed % 2 ? 0 : Math.PI / 24), fill: "P", tone: 1, body: true });
    it.push({ d: circleD(cx, cy, 380), fill: "G", tone: 0 });
    it.push(ring(cx, cy, 352, 8, "P", 1));
    // the words as wide as the inner ring's chord allows within 130 of the middle (2 × √(352² − 130²) ≈ 650)
    const B = fitBlock(D, N.full, 630, 300, { maxLines: 3, lead: 1.12, capMax: 140 });
    const bx = drawBlock(it, D, B, cx, cy + 34, { lead: 1.12, fill: "I", tone: 1 });
    const ss = fitSize(Lb, c.small, 400, 32, .16);
    it.push(textLine(Lb, c.small, ss, cx, bx.top0 - 44, { track: .16, fill: "A", tone: 1 }).item);
    return { w: 1000, h: 1000, it, ok: bx.cap >= MIN_CAP };
  } },

  /* A licence plate, for cars: the town at its head, the name across it, four bolts. */
  plate: { name: "Plate", group: "badge", shape: "square", kinds: ["condensed", "wide", "grotesk", "display"], cats: ["cars"], draw(c) {
    const it = [], { D, Lb, N } = c, W = 1500, H = 760;
    it.push({ d: rectD(20, 20, W - 40, H - 40, 70), fill: "G", tone: 1, body: true });
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
    it.push({ d: rectD(40, 40, S, S, round), fill: "P", tone: 1, body: true });
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
    it.push({ d: circleD(cx, cy, R), fill: "A", tone: 1, body: true, round: true });
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
    it.push({ d: rectD(30, 30, W - 60, H - 60, 10), fill: "G", tone: 1, body: true });
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

  // the industry marks, each for the lines it belongs to (DESIGN-LAW 180)
  struck: markLayout("Struck coin", ["gold", "coins", "silver"], "coinStruck"),
  ingot: markLayout("Gold bar", ["gold", "silver", "coins"], "ingot"),
  slab: markLayout("Graded slab", ["pokemon", "sports"], "slab"),
  handset: markLayout("Phone", ["phones", "devices", "resale"], "device"),
  controller: markLayout("Controller", ["gaming"], "pad"),
  dial: markLayout("Watch dial", ["wearables"], "dial"),
  gauge: markLayout("Speedometer", ["cars"], "gauge"),
  chip: markLayout("Chip", ["computers", "devices"], "chip"),
  aperture: markLayout("Lens", ["cameras"], "aperture"),
  cycle: markLayout("Trade arrows", ["resale", "wholesale", "phones", "devices"], "cycle"),
  crate: markLayout("Crate", ["wholesale"], "crate"),
  drop: markLayout("Drop", ["strips"], "drop"),
  cans: markLayout("Headphones", ["audio"], "phones2"),

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

  /* ---------- the calm layouts (DESIGN-LAW 183): what real businesses in the trade wear ---------- */
  /* The wordmark: the name in a calm face and nothing round it, one accent detail (a full stop, a short rule),
     the trade's words tracked out under it as wide as the name, and the shop's own facts. */
  wordmark: { name: "Wordmark", group: "wordmark", shape: "square", calm: true, kinds: CALM_KINDS, mark: calmMark, draw(c) {
    const it = [], { D, Lb, Nx, N } = c, W = 1500, tr = c.V.track || 0, lead = leadOf(c);
    const B = fitBlock(D, nameOf(c), 1400, 400, { maxLines: 2, lead, track: tr, capMax: 270 });
    const capH = capOf(D, B.size), blockH = capH * (1 + (B.n - 1) * lead), v = c.d.seed % 3;
    const bx = drawBlock(it, D, B, W / 2, 30 + blockH / 2, { lead, track: tr, fill: "I", tone: 1 });
    const g = D.g.I || D.g.l, stem = g ? (g[3] - g[1]) * B.size / 1000 : capH * .14;
    if (v === 0 && B.n === 1) it.push({ d: circleD(bx.x1 + stem * 1.1, 30 + capH - stem * .62, stem * .62), fill: "A", tone: 1 });
    let y = Math.max(bx.bot0, 30 + blockH) + capH * .2;
    if (v === 1) { it.push({ d: rectD(W / 2 - capH * .45, y, capH * .9, Math.max(7, stem * .32), 4), fill: "A", tone: 1 }); y += capH * .2; }
    const dH = Math.max(32, Math.min(58, capH * .22));
    y += dH * 1.4;
    const dt = spanLine(it, Lb, descOf(c), Math.max(380, bx.x1 - bx.x0), W / 2, y, dH, "A");
    let x0 = Math.min(bx.x0, dt.box.x0), x1 = Math.max(bx.x1 + (v === 0 && B.n === 1 ? stem * 2 : 0), dt.box.x1);
    const fact = factOf(c);
    if (fact) { const fH = Math.max(26, dH * .78); y += fH * 2; const ft = smallLine(it, Lb, fact, 1000, W / 2, y, fH, "I", .24); x0 = Math.min(x0, ft.box.x0); x1 = Math.max(x1, ft.box.x1); }
    return hug({ w: W, h: y + 40, it, ok: capH >= MIN_CAP * 1.2, word: true }, W, x0, x1);
  } },
  /* The two-tone wordmark: the shop's own word in the lettering's colour and the trade's in the accent, on one line
     where it fits (Harbor Mobile), the small line under it. */
  split: { name: "Two-tone", group: "wordmark", shape: "square", calm: true, kinds: CALM_KINDS, mark: calmMark, draw(c) {
    const it = [], { D, Lb, Nx } = c, W = 1500, tr = c.V.track || 0, words = Nx.full.split(" ");
    let a = Nx.trail ? Nx.lead : words.slice(0, -1).join(" "), b = Nx.trail ? Nx.trail : words[words.length - 1];
    if (!a) { a = b; b = ""; }
    const one = b ? a + " " + b : a;
    let size = fitSize(D, one, 1400, 220, tr), two = false;
    if (b && capOf(D, size) < 110) { two = true; size = Math.min(fitSize(D, a, 1400, 200, tr), fitSize(D, b, 1400, 200, tr)); }
    const capH = capOf(D, size), k = size / 1000, lead = leadOf(c);
    let y = 30 + capH, x0 = W / 2, x1 = W / 2;
    if (!two) {
      const S = shapeRun(D, one, tr), pen = W / 2 - (S.x0 + S.x1) / 2 * k, Sa = shapeRun(D, a, tr), Sb = shapeRun(D, b || " ", tr);
      const ta = textLine(D, a, size, pen + Sa.x0 * k, y, { align: "left", track: tr, fill: "I", tone: 1 }); if (ta.item) it.push(ta.item);
      if (b) { const pb = pen + (shapeRun(D, a + " ", tr).adv + tr * 1000) * k, tb = textLine(D, b, size, pb + Sb.x0 * k, y, { align: "left", track: tr, fill: "A", tone: 1 }); if (tb.item) it.push(tb.item); }
      x0 = pen + S.x0 * k; x1 = pen + S.x1 * k;
    } else {
      const ta = textLine(D, a, size, W / 2, y, { track: tr, fill: "I", tone: 1 }), tb = textLine(D, b, size, W / 2, y + capH * lead, { track: tr, fill: "A", tone: 1 });
      if (ta.item) it.push(ta.item); if (tb.item) it.push(tb.item);
      x0 = Math.min(ta.box.x0, tb.box.x0); x1 = Math.max(ta.box.x1, tb.box.x1); y += capH * lead;
    }
    const dH = Math.max(30, Math.min(50, capH * .24));
    y += capH * .32 + dH * 1.3;
    const dt = spanLine(it, Lb, c.small, Math.max(360, x1 - x0), W / 2, y, dH, "I");
    x0 = Math.min(x0, dt.box.x0); x1 = Math.max(x1, dt.box.x1);
    const fact = factOf(c);
    if (fact) { const fH = Math.max(26, dH * .8); y += fH * 2; const ft = smallLine(it, Lb, fact, 1000, W / 2, y, fH, "A", .24); x0 = Math.min(x0, ft.box.x0); x1 = Math.max(x1, ft.box.x1); }
    return hug({ w: W, h: y + 40, it, ok: capH >= MIN_CAP * 1.1, word: true }, W, x0, x1);
  } },
  /* The mark beside the name, from the line's catalogue (solid or a line, soft or sharp). */
  lockup: { name: "Symbol beside", group: "mark", shape: "square", calm: true, usesMark: true, kinds: CALM_KINDS, mark: c => markItems(c, markOf(c)), draw: c => besideLayout(c) },
  /* The mark above the name, centred, the trade's words between hairlines. */
  centred: { name: "Symbol above", group: "mark", shape: "circle", calm: true, usesMark: true, kinds: CALM_KINDS, mark: c => markItems(c, markOf(c)), draw: aboveLayout },
  /* The app tile: a soft square holding the initial, or the mark drawn as a line, beside the name. */
  tile: { name: "App tile", group: "monogram", shape: "square", calm: true, usesMark: true, kinds: ["geometric", "grotesk", "serif", "slab"], mark: tileItems, draw: c => besideLayout(c, true) },
  /* The heritage seal: fine double rings, a band of guilloché, the name in capitals round the top, the trade round
     the foot, and the initials (or the mark, as a line) in the middle. */
  heritage: { name: "Heritage seal", group: "badge", shape: "circle", calm: true, kinds: ["serif", "slab", "condensed", "grotesk", "geometric"], mark: c => LAYOUTS.heritage.draw(c).it, draw(c) {
    const it = [], cx = 500, cy = 500, { D, Lb, N } = c;
    it.push({ d: circleD(cx, cy, 494), fill: "G", tone: 1, body: true, round: true });
    it.push(ring(cx, cy, 478, 12, "I", 0)); it.push(ring(cx, cy, 456, 3, "I", 0)); it.push(ring(cx, cy, 300, 3, "I", 0));
    const g = [];
    for (let k = 0; k < 10; k++) { const pts = []; for (let i = 0; i <= 300; i++) { const t = i / 300 * Math.PI * 2, r = 258 + 14 * Math.sin(36 * t + k * Math.PI / 5); pts.push(f1(cx + r * Math.sin(t)) + "," + f1(cy - r * Math.cos(t))); } g.push("M" + pts.join("L")); }
    it.push({ d: g.join(""), stroke: "A", sw: 1.6, tone: 0 });
    it.push({ d: circleD(cx, cy, 228), fill: "G", tone: 1 }); it.push(ring(cx, cy, 228, 3, "A", 0));
    let top = N.full, bottom = [descOf(c), c.town].filter(Boolean).join(" · "), s = arcFit(D, top, 340, 190, 74, 1, .08);
    if (capOf(D, s) < 50 && N.trail) { top = N.lead; bottom = [N.trail, c.town].filter(Boolean).join(" · "); s = arcFit(D, top, 340, 190, 74, 1, .08); }
    const span = arcText(it, D, top, s, cx, cy, 340, { dir: 1, track: .08, fill: "I", tone: 0 });
    let bs = arcFit(Lb, bottom, 412, 130, 32, -1, .22);
    // a long trade line and the town do not both fit round the foot: the trade's words keep it
    if (capOf(Lb, bs) < 22 && c.town && bottom.includes(" · ")) { bottom = bottom.slice(0, bottom.lastIndexOf(" · ")); bs = arcFit(Lb, bottom, 412, 130, 32, -1, .22); }
    const bSpan = arcText(it, Lb, bottom, bs, cx, cy, 412, { dir: -1, track: .22, fill: "A", tone: 0 });
    const gap = (360 - span - bSpan) / 2, at = span / 2 + gap / 2;
    if (gap > 12) for (const a of [at, -at]) { const [x, y] = onC(cx, cy, 376, a); it.push(dot(x, y, 9, "A", 0)); }
    if (c.d.mark) it.push({ g: markItems(c, c.d.mark, { line: true, sw: 40, onBody: true, ink: "I" }), tf: `translate(${cx - 160} ${cy - 160}) scale(.32)` });
    else { const ms = fitSize(D, N.init, 300, 150, .04); it.push(textLine(D, N.init, ms, cx, cy + capOf(D, ms) / 2, { fill: "I", tone: 0, track: .04 }).item); }
    if (c.since) { const ss = fitSize(Lb, c.since, 220, 20, .24); it.push(textLine(Lb, c.since, ss, cx, cy + 150, { fill: "A", tone: 0, track: .24 }).item); }
    return { w: 1000, h: 1000, it, ok: capOf(D, s) >= MIN_CAP * .9 && capOf(Lb, bs) >= 20 };
  } },
  /* The monogram: two initials interlaced in a hairline ring, the name in spaced capitals under it. */
  interlace: { name: "Monogram", group: "monogram", shape: "circle", calm: true, kinds: ["serif", "slab", "geometric", "grotesk", "condensed"], mark: c => interlaceItems(c), draw(c) {
    const it = [], { D, Lb, N } = c, W = 1100, cx = W / 2, tr = Math.max(.1, c.V.track || 0);
    it.push({ g: interlaceItems(c), tf: `translate(${cx - 230} 30) scale(.46)` });
    const B = fitBlock(D, N.full, 1000, 180, { maxLines: 2, lead: 1.2, track: tr, capMax: 84 });
    const bx = drawBlock(it, D, B, cx, 30 + 460 + 80 + capOf(D, B.size) * (1 + (B.n - 1) * 1.2) / 2, { lead: 1.2, track: tr, fill: "I", tone: 1 });
    let y = bx.bot0 + 66;
    const dt = smallLine(it, Lb, descOf(c), 800, cx, y, 32, "A", .3);
    let x0 = Math.min(bx.x0, cx - 230, dt.box.x0), x1 = Math.max(bx.x1, cx + 230, dt.box.x1);
    const fact = factOf(c);
    if (fact) { y += 58; const ft = smallLine(it, Lb, fact, 800, cx, y, 26, "I", .28); x0 = Math.min(x0, ft.box.x0); x1 = Math.max(x1, ft.box.x1); }
    return hug({ w: W, h: y + 50, it, ok: capOf(D, B.size) >= MIN_CAP * .9, word: true }, W, x0, x1);
  } },
  /* Framed: the name in a fine rounded frame, the trade's words set into its foot, the facts under it. */
  framed: { name: "Framed", group: "badge", shape: "square", calm: true, kinds: CALM_KINDS, mark: calmMark, draw(c) {
    const it = [], { D, Lb, Nx, N } = c, W = 1400, tr = c.V.track || 0, lead = leadOf(c);
    const B = fitBlock(D, nameOf(c), 1120, 320, { maxLines: 2, lead, track: tr, capMax: 200 });
    const capH = capOf(D, B.size), blockH = capH * (1 + (B.n - 1) * lead), y0 = 40;
    const bx = drawBlock(it, D, B, W / 2, y0 + 100 + blockH / 2, { lead, track: tr, fill: "I", tone: 1 });
    const yb = Math.max(bx.bot0, y0 + 100 + blockH) + 100, r = c.d.sharp ? 4 : 28, dH = Math.max(30, Math.min(44, capH * .24));
    const dt = smallLine(it, Lb, descOf(c), 900, W / 2, yb + dH / 2, dH, "A", .3);
    const g0 = dt.box.x0 - 34, g1 = dt.box.x1 + 34, half = Math.max(W / 2 - bx.x0, bx.x1 - W / 2, W / 2 - g0 + 40) + 110, x = W / 2 - half, w = half * 2;
    it.push({ d: `M${f1(g1)},${f1(yb)}H${f1(x + w - r)}A${r},${r} 0 0 0 ${f1(x + w)},${f1(yb - r)}V${y0 + r}A${r},${r} 0 0 0 ${f1(x + w - r)},${y0}H${f1(x + r)}A${r},${r} 0 0 0 ${f1(x)},${y0 + r}V${f1(yb - r)}A${r},${r} 0 0 0 ${f1(x + r)},${f1(yb)}H${f1(g0)}`, stroke: "A", sw: 6, tone: 1 });
    let h = yb + 40;
    const fact = factOf(c);
    if (fact) { h += 52; smallLine(it, Lb, fact, Math.min(1000, w), W / 2, h, Math.max(24, dH * .78), "I", .26); }
    return hug({ w: W, h: h + 40, it, ok: capH >= MIN_CAP * 1.1, word: true }, W, x, x + w, 30);
  } },
  /* Art deco: a fan of rays over a half sun, the name in tall spaced capitals, stepped rules. */
  deco: { name: "Deco", group: "wordmark", shape: "square", calm: true, kinds: ["condensed", "serif", "slab", "geometric"], cats: ["gold", "silver", "coins", "wearables", "cameras", "audio"], mark: c => interlaceItems(c), draw(c) {
    const it = [], { D, Lb, N } = c, W = 1400, cx = W / 2, base = 290, rays = [];
    for (let i = -6; i <= 6; i++) { const [x0, y0] = onC(cx, base, 150, i * 13), [x1, y1] = onC(cx, base, 250, i * 13); rays.push(`M${f1(x0)},${f1(y0)}L${f1(x1)},${f1(y1)}`); }
    it.push({ d: rays.join(""), stroke: "A", sw: 7, tone: 1, round: true });
    it.push({ d: arcPath(cx, base, 116, -90, 90) + "Z", stroke: "A", sw: 7, tone: 1 });
    it.push({ d: `M${cx - 300},${base}H${cx + 300}`, stroke: "A", sw: 7, tone: 1 });
    const B = fitBlock(D, N.full, 1280, 360, { maxLines: 2, lead: 1.12, track: .12, capMax: 200 });
    const capH = capOf(D, B.size), blockH = capH * (1 + (B.n - 1) * 1.12);
    const bx = drawBlock(it, D, B, cx, base + 60 + blockH / 2, { lead: 1.12, track: .12, fill: "I", tone: 1 });
    const y = bx.bot0 + 56, half = Math.min(470, (bx.x1 - bx.x0) / 2 + 30);
    it.push({ d: `M${cx - half},${y}H${cx - 190}V${y - 12}H${cx - 150}M${cx + half},${y}H${cx + 190}V${y - 12}H${cx + 150}`, stroke: "A", sw: 5, tone: 1 });
    smallLine(it, Lb, descOf(c), 900, cx, y + 74, 36, "A", .3);
    let h = y + 136;
    const fact = factOf(c);
    if (fact) { smallLine(it, Lb, fact, 900, cx, h, 26, "I", .3); h += 46; }
    return hug({ w: W, h: h + 20, it, ok: capH >= MIN_CAP * 1.2, word: true }, W, Math.min(bx.x0, cx - half, cx - 300), Math.max(bx.x1, cx + half, cx + 300));
  } },
  /* Varsity: the name arched in capitals with a cut outline, the trade's words under it. */
  varsity: { name: "Varsity", group: "wordmark", shape: "square", calm: true, kinds: ["condensed", "slab", "display"], cats: ["sports", "pokemon", "gaming"], mark: calmMark, draw(c) {
    const it = [], { D, Lb, N } = c, W = 1300, cx = W / 2, R = 680, name = splitName(c) ? N.lead : N.full;
    const s = arcFit(D, name, R, 72, 220, 1, .04), capH = capOf(D, s), cy = 50 + capH + R;
    const sh = []; arcText(sh, D, name, s, cx, cy, R, { dir: 1, track: .04, fill: "I", tone: 1 });
    const k = s / 1000;
    for (const x of sh) it.push(Object.assign({}, x, { stroke: "A", sw: 24 / k * 1.9, join: true }));
    for (const x of sh) it.push(Object.assign({}, x, { fill: undefined, stroke: "G", sw: 24 / k * .9, join: true, tone: 0 }));
    for (const x of sh) it.push(x);
    const sub = descOf(c), y = 50 + capH + 150;
    const t = smallLine(it, Lb, sub, 640, cx, y, Math.min(64, capH * .34), "A", .16);
    return { w: W, h: y + 60, it, ok: capH >= MIN_CAP * 1.2 && !!t, word: true };
  } },
  /* The sign: the name in a script over the trade's words in capitals, a swash under the name. */
  signboard: { name: "Sign", group: "wordmark", shape: "square", calm: true, kinds: ["script"], cats: ["pokemon", "sports", "gaming", "resale", "cars", "coins"], mark: calmMark, draw(c) {
    const it = [], { D, Lb, N } = c, W = 1400, cx = W / 2;
    const B = fitBlock(D, splitName(c) ? N.lead : N.full, 1280, 380, { maxLines: 2, lead: 1.02, capMax: 270, one: 1.3 });
    const capH = capOf(D, B.size), blockH = capH * (1 + (B.n - 1) * 1.02);
    const bx = drawBlock(it, D, B, cx, 40 + blockH / 2, { lead: 1.02, fill: "I", tone: 1 });
    const sy = bx.bot0 + capH * .06;
    it.push({ d: `M${f1(bx.x0 + 20)},${f1(sy + 10)}C${f1(bx.x0 + (bx.x1 - bx.x0) * .4)},${f1(sy - 14)} ${f1(bx.x1 - 120)},${f1(sy - 22)} ${f1(bx.x1 + 30)},${f1(sy - 8)}`, stroke: "A", sw: Math.max(12, capH * .07), tone: 1, round: true });
    const y = sy + 40 + Math.min(70, capH * .3), t = smallLine(it, Lb, descOf(c), 760, cx, y, Math.min(66, capH * .28), "A", .18);
    for (const x of [t.box.x0 - 40, t.box.x1 + 40]) it.push(dot(x, y - capOf(Lb, t.size) / 2, 9, "I", 1));
    return hug({ w: W, h: y + 50, it, ok: capH >= MIN_CAP * 1.2, word: true }, W, Math.min(bx.x0, t.box.x0 - 60), Math.max(bx.x1 + 40, t.box.x1 + 60));
  } },
  /* The workshop plate: the name knocked out of a plate with four screws, the trade's words on a band. */
  shopplate: { name: "Workshop plate", group: "badge", shape: "square", calm: true, kinds: ["condensed", "slab"], cats: ["wholesale", "cars", "devices", "computers"], mark: calmMark, draw(c) {
    const it = [], { D, Lb, N } = c, W = 1300, H = 600, cx = W / 2;
    it.push({ d: rectD(20, 20, W - 40, H - 40, c.d.sharp ? 10 : 34), fill: "A", tone: 1, body: true });
    for (const [x, y] of [[70, 70], [W - 70, 70], [70, H - 70], [W - 70, H - 70]]) it.push(dot(x, y, 15, "G", 0));
    const B = fitBlock(D, N.full, 1080, 250, { maxLines: 2, lead: 1.1, track: .03, capMax: 200 });
    const bx = drawBlock(it, D, B, cx, 230, { lead: 1.1, track: .03, fill: "G", tone: 0 });
    it.push({ d: rectD(140, 400, W - 280, 100, c.d.sharp ? 4 : 14), fill: "G", tone: 0 });
    const ss = fitSize(Lb, c.small, W - 360, 38, .18);
    it.push(textLine(Lb, c.small, ss, cx, 450 + capOf(Lb, ss) / 2, { track: .18, fill: "A", tone: 1 }).item);
    return { w: W, h: H, it, ok: capOf(D, B.size) >= MIN_CAP * 1.1 };
  } },
};
export const LOGO_LAYOUTS = Object.fromEntries(Object.entries(LAYOUTS).map(([k, L]) => [k, { key: k, name: L.name, group: L.group, shape: L.shape, kinds: L.kinds, cats: L.cats || null, calm: !!(L.calm || CALM_OLD.includes(k)), bold: !L.calm, usesMark: !!L.usesMark }]));

/* ---------- the forms: the layout, its mark, and the two side by side ---------- */
/** The mark: the initials (or the symbol) in the layout's own shape, for a profile picture, an app
 *  icon or a favicon, where a whole seal would be too small to read. */
function drawMark(c, shape) {
  const own = LAYOUTS[c.d.t] && LAYOUTS[c.d.t].mark;
  if (own) return { w: 1000, h: 1000, it: applyFinish(own(c), c), ok: true };
  const it = [], { D, N } = c, cx = 500, cy = 500;
  const body = shape === "shield" ? shieldD(160, 60, 680, 880) : shape === "hex" ? polyD(hexPts(cx, cy, 480)) : shape === "circle" ? circleD(cx, cy, 480) : rectD(30, 30, 940, 940, 200);
  const inner = shape === "shield" ? shieldD(196, 96, 608, 790) : shape === "hex" ? polyD(hexPts(cx, cy, 432)) : shape === "circle" ? circleD(cx, cy, 436) : rectD(70, 70, 860, 860, 165);
  it.push({ d: body, fill: "P", tone: 1, body: true, round: shape === "circle" });
  it.push({ d: inner, stroke: "Q", sw: 8, tone: 0 });
  const box = shape === "shield" ? 420 : 560, my = shape === "shield" ? 440 : cy;
  if (c.icon && !c.d.markInit) it.push(iconItem(c.icon, cx, my, box * .92, "Q", 0, 7.5));
  else { const ms = fitSize(D, N.init, box, box * .62); it.push(textLine(D, N.init, ms, cx, my + capOf(D, ms) / 2, { fill: "Q", tone: 0 }).item); }
  return { w: 1000, h: 1000, it: applyFinish(it, c), ok: true };
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

/* ---------- the finish (DESIGN-LAW 180): flat, a gradient, or a pattern on the logo's body ----------
   The owner, 2026-11-24: "some people like logos with gradients", "or patterns", "make them clean simple and
   professional". A gradient is a gentle sheen down the body (its own colour a little lighter to a little
   darker), a pattern a faint texture inside it in its own colour: never a second colour, never under the
   words' contrast. The one-colour versions stay flat. */
export const FINISHES = { flat: "Flat", gradient: "Gradient", pattern: "Pattern" };
/** the body: the first filled shape a layout marks as its own (body: true), searched through groups */
function findBody(items) {
  for (let i = 0; i < items.length; i++) {
    const x = items[i]; if (!x) continue;
    if (x.body && x.fill) return { arr: items, i, item: x };
    if (x.g) { const h = findBody(x.g); if (h) return h; }
  }
  return null;
}
function patternFor(c, base, kind, w = 1600, h = 1100) {
  const ink = mixHex(base, lumOf(base) > .45 ? "#000000" : "#ffffff", .13), out = [];
  if (kind === "rings") { for (let r = 30; r < 900; r += 26) out.push(circleD(500, 500, r)); return [{ d: out.join(""), stroke: ink, sw: 5, tone: 0 }]; }
  if (kind === "dots") { for (let y = 0; y < h; y += 34) for (let x = (y / 34) % 2 ? 17 : 0; x < w; x += 34) out.push(circleD(x, y, 5.5)); return [{ d: out.join(""), fill: ink, tone: 0 }]; }
  for (let x = -h; x < w; x += 30) out.push(`M${x},0L${x + h},${h}`);
  return [{ d: out.join(""), stroke: ink, sw: 6, tone: 0 }];
}
function applyFinish(items, c) {
  const f = c.d.finish; if (!f || f === "flat") return items;
  const hit = findBody(items); if (!hit) return items;
  const { arr, i, item } = hit, base = c.P[item.fill] || item.fill;
  if (typeof base !== "string") return items;
  if (f === "gradient") item.fill = { grad: [mixHex(base, "#ffffff", .2), mixHex(base, "#000000", .24)], role: item.fill };
  else if (f === "pattern") {
    const kind = item.round ? "rings" : ["lines", "dots", "lines"][c.d.seed % 3];
    arr.splice(i + 1, 0, { clip: item.d, ctf: item.tf || "", deco: true, g: patternFor(c, base, kind) });
  }
  return items;
}

/* ---------- drawing a design to SVG ---------- */
let UID = 0;
/** One logo as an SVG document. mode: "colour" (with its ground unless bg is false), "transparent"
 *  (colour, no ground), "black" or "white" (one colour, the knock-outs cut through). pad: the margin round the
 *  artwork, of its larger side. */
export function logoSvg(design, faces, { form = "primary", mode = "colour", bg = mode === "colour", pad = .08, mark = null } = {}) {
  const d = cleanDesign(design), c = ctxOf(d, faces), L = LAYOUTS[d.t] || LAYOUTS.seal;
  const r = form === "mark" ? drawMark(c, L.shape) : form === "horizontal" ? drawHorizontal(c, L.shape) : L.draw(c);
  applyFinish(r.it, c);
  return svgOf(r, c.P, { mode, bg, pad, mark, title: c.Nx.full + " logo" });
}
/** One mark of the catalogue alone, in a design's colours and initials: the Symbol row's thumbnails and the sheet */
export function markSvg(design, faces, key, { mode = "colour", line, sharp, pad = .06 } = {}) {
  const d = cleanDesign({ ...design, mark: key, line: line == null ? design.line : line, sharp: sharp == null ? design.sharp : sharp }), c = ctxOf(d, faces);
  return svgOf({ w: 1000, h: 1000, it: markItems(c, d.mark) }, c.P, { mode, bg: mode === "colour", pad, title: (MARK_SET[d.mark] || {}).name || "Mark" });
}
function svgOf(r, P, { mode, bg, pad, mark, title, size }) {
  const p = Math.round(Math.max(r.w, r.h) * pad), W = Math.round(r.w + 2 * p), H = Math.round(r.h + 2 * p);
  const mono = mode === "black" || mode === "white", col = k => P[k] || k, id = "k" + (++UID).toString(36) + Math.random().toString(36).slice(2, 6);
  const defs = []; let nd = 0;
  const fillOf = (f, tone) => {
    if (tone) return tone;
    if (f && typeof f === "object" && f.grad) { const gid = id + "g" + (nd++); defs.push(`<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${f.grad[0]}"/><stop offset="1" stop-color="${f.grad[1]}"/></linearGradient>`); return `url(#${gid})`; }
    return col(f);
  };
  const paint = (x, inMask, as = null) => {
    if (x.clip) {
      if (inMask || mono) return "";   // a pattern is colour's: the one-colour versions stay flat
      const cid = id + "c" + (nd++);
      defs.push(`<clipPath id="${cid}"><path d="${x.clip}"${x.ctf ? ` transform="${x.ctf}"` : ""}/></clipPath>`);
      return `<g clip-path="url(#${cid})">${x.g.map(y => paint(y, inMask, as)).join("")}</g>`;
    }
    if (x.g) return `<g transform="${x.tf}"${x.op ? ` opacity="${x.op}"` : ""}>${x.g.map(y => paint(y, inMask, x.as ? x : as)).join("")}</g>`;
    if (!x.d) return "";
    const tone = inMask ? (x.tone ? "#fff" : "#000") : as ? col(x.tone ? as.as : as.under) : null;
    const tf = x.tf ? ` transform="${x.tf}"` : "", rule = x.rule ? ` fill-rule="${x.rule}"` : "";
    if (x.stroke) {
      const cap = x.round ? ` stroke-linecap="round" stroke-linejoin="round"` : x.join ? ` stroke-linejoin="round"` : "";
      const fill = x.fill ? fillOf(x.fill, tone) : "none";
      return `<path${tf} d="${x.d}" fill="${fill}" stroke="${tone || col(x.stroke)}" stroke-width="${f1(x.sw)}"${cap}${x.dash ? ` stroke-dasharray="${x.dash}"` : ""}${rule}/>`;
    }
    return `<path${tf} d="${x.d}" fill="${fillOf(x.fill, tone)}"${rule}/>`;
  };
  const items = r.it.filter(Boolean);
  let body;
  if (mono) {
    const ink = mode === "black" ? "#111214" : "#ffffff";
    body = `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="${-p}" y="${-p}" width="${W}" height="${H}"><rect x="${-p}" y="${-p}" width="${W}" height="${H}" fill="#000"/>${items.map(x => paint(x, true)).join("")}</mask></defs><rect x="${-p}" y="${-p}" width="${W}" height="${H}" fill="${ink}" mask="url(#${id})"/>`;
  } else { body = (bg ? `<rect x="${-p}" y="${-p}" width="${W}" height="${H}" fill="${typeof bg === "string" ? bg : P.G}"/>` : "") + items.map(x => paint(x, false)).join(""); if (defs.length) body = `<defs>${defs.join("")}</defs>` + body; }
  const sz = size ? ` width="${size[0]}" height="${size[1]}"` : ` width="${W}" height="${H}"`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-p} ${-p} ${W} ${H}"${sz}><title>${esc(title)}</title>${body}${mark || ""}</svg>`;
  return { svg, w: W, h: H, ok: r.ok !== false, word: !!r.word, ground: P.G, art: { w: r.w, h: r.h } };
}
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

/** The square profile picture: the logo (a round one whole, any other its mark) inside the circle a
 *  profile is cropped to, on its ground. */
export function profileSvg(design, faces, { size = 1080 } = {}) {
  const d = cleanDesign(design), c = ctxOf(d, faces), L = LAYOUTS[d.t] || LAYOUTS.seal;
  const whole = ["seal", "coin", "burst", "hexagon", "heritage"].includes(d.t);
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

/** Every file of the kit as text: the logo as a vector in colour (see-through and on its ground), black
 *  and white, the name beside the mark, the mark alone, the profile picture and the cover, and a note of
 *  the colours and faces. The function sends these to a plan that includes logos; the page makes the
 *  PNGs from them. */
export function kitFiles(design, faces, { phone = "" } = {}) {
  const d = cleanDesign(design), P = paletteOf(d.pair), V = LOGO_VOICES[d.voice], N = partsOf(d.name);
  const F = (o) => logoSvg(d, faces, o).svg;
  const face = k => (faces[k] && faces[k].family) || k;
  const readme = [
    N.full + " logo, made with WeBuy.AD (webuy.ad/logo)",
    "",
    "svg/   vector files: open them in any design app, send them to a sign or print shop, use them at any size.",
    "png/   pictures: logo.png and logo-side-by-side.png are see-through, for putting on a photo or a page.",
    "       Use logo-black on light backgrounds and logo-white on dark ones.",
    "social/ profile-picture.png (1080 x 1080, for the circle Facebook, Instagram and OfferUp crop to)",
    "       and facebook-cover.png (1640 x 624).",
    "",
    "Your colours",
    "  Background  " + P.G, "  Lettering   " + P.I, "  Accent      " + P.A, "  Band        " + P.P + " (its lettering " + P.Q + ")",
    "",
    "Your lettering",
    "  " + face(V.display) + " for the name, " + face(V.label) + " for the small lines.",
    "  Both are free fonts: Google Fonts ones under the SIL Open Font License (fonts.google.com), Satoshi under Fontshare's free licence (fontshare.com).",
    "  The files have the letters drawn as shapes, so they look right without the fonts installed.",
    "",
  ].join("\n");
  return {
    "logo.svg": F({ mode: "transparent", bg: false, pad: .04 }),
    "logo-on-colour.svg": F({ mode: "colour", pad: .14 }),
    "logo-black.svg": F({ mode: "black", pad: .04 }),
    "logo-white.svg": F({ mode: "white", pad: .04 }),
    "logo-side-by-side.svg": F({ form: "horizontal", mode: "transparent", bg: false, pad: .04 }),
    "mark.svg": F({ form: "mark", mode: "transparent", bg: false, pad: .02 }),
    "mark-on-colour.svg": F({ form: "mark", mode: "colour", pad: .1 }),
    "profile.svg": profileSvg(d, faces, { size: 1080 }).svg,
    "cover.svg": coverSvg(d, faces, { phone }).svg,
    "README.txt": readme,
  };
}

/* ---------- the design: what is stored, sent and drawn ---------- */
export const LIMITS = { name: 40, small: 32, town: 28, since: 20 };
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
    finish: FINISHES[d.finish] ? d.finish : "flat",
    // DESIGN-LAW 183: the mark from the line's catalogue, drawn as a line or solid, soft corners unless sharp, and
    // the shop's own "since". Only the calm layouts read them, so a design saved before them draws as it did.
    mark: MARK_SET[d.mark] ? d.mark : "",
    line: !!d.line,
    sharp: !!d.sharp,
    since: tidy(d.since).slice(0, LIMITS.since),
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
  wholesale: ["navy_orange", "black_white_orange", "black_on_orange", "navy_gold", "sand_teal", "black_on_yellow", "orange_black_cobalt"],
  devices: ["midnight_cyan", "black_cyan", "white_on_blue", "sky_cobalt", "electric_blue_white_orange", "black_lime", "white_on_violet"],
  resale: ["teal_orange", "white_on_green", "black_on_lime", "hot_pink_black_cobalt", "navy_white_red", "white_on_pink", "black_on_aqua"],
};
/** Today's layouts for a line (the Bold style: badges, coins, balloons, the sharp industry marks), those drawn for it
 *  leading. The calm layouts are calmLayoutsFor's. */
function layoutsFor(cat) {
  return Object.keys(LAYOUTS).filter(k => !LAYOUTS[k].calm && (!LAYOUTS[k].cats || LAYOUTS[k].cats.includes(cat)));
}
/** the voices that were the logo maker's before its own tones: the Bold style's */
const AD_VOICES = Object.keys(LOGO_VOICES).filter(v => !LOGO_VOICES[v].logoOnly);

/* ---------- the styles (DESIGN-LAW 183) ----------
   The owner, 2026-11-25, picking direction A: the gallery opens on calm logos, and styles narrow it. "We're not
   always looking for attention and unlimited variety ... we're also trying to build professionalism and trust".
   A style is a set of layouts, lettering, colours and kinds of mark that read one way; the calm gallery deals from
   the four calm ones as the line suits (gold leans Luxury and Classic, phones Modern and Friendly), and Bold is the
   gallery as it was before, for a shop that wants an ad's energy. */
export const STYLES = {
  classic: { name: "Classic", says: "Established, here for years", voices: ["classic", "banker", "sturdy", "block", "stadium", "bold", "editorial"],
    layouts: ["heritage", "centred", "lockup", "wordmark", "framed", "label", "roundel", "shopplate", "signboard"], marks: ["letter", "act", "object"], line: .25,
    pairs: ["navy_brass", "forest_brass", "oxblood_cream", "paper_navy", "ivory_oxblood", "cream_forest", "navy_gold", "green_gold", "cream_red", "white_on_navy", "red_white_blue", "navy_white_red", "white_on_green", "stone_charcoal"] },
  modern: { name: "Modern", says: "Clean and current, a tech business", voices: ["sleek", "geometric", "clean", "studio", "grotesk", "tech"],
    layouts: ["wordmark", "split", "lockup", "tile", "centred", "monogram", "stacked", "framed"], marks: ["abstract", "act", "letter"], line: .55,
    pairs: ["white_cobalt", "slate_teal", "midnight_sky", "graphite_red", "mist_slate", "stone_charcoal", "black_on_white", "white_on_blue", "silver_blue", "arctic_teal", "ink_gold", "black_green", "teal_orange"] },
  friendly: { name: "Friendly", says: "Approachable, family-run", voices: ["friendly", "geometric", "editorial", "workshop", "clean", "brush", "marker"],
    layouts: ["lockup", "split", "wordmark", "centred", "tile", "roundel", "signboard", "varsity"], marks: ["abstract", "object", "act"], line: .3,
    pairs: ["sage_pine", "teal_sand", "paper_navy", "white_cobalt", "mist_slate", "teal_orange", "white_on_teal", "white_on_green", "sand_teal", "cream_red", "blue_green", "navy_orange", "cream_forest"] },
  luxury: { name: "Luxury", says: "Discreet and premium", voices: ["engraved", "banker", "editorial", "classic", "luxe", "stadium"],
    layouts: ["interlace", "deco", "heritage", "wordmark", "lockup", "framed", "centred"], marks: ["letter", "object"], line: .4,
    pairs: ["ink_gold", "plum_champagne", "navy_brass", "forest_brass", "oxblood_cream", "teal_sand", "ivory_oxblood", "black_gold", "purple_gold", "bone_purple", "cream_forest", "midnight_sky", "paper_navy"] },
  bold: { name: "Bold", says: "Loud and eye-catching, like an ad", voices: AD_VOICES, layouts: [], marks: [], line: 0, pairs: [] },
};
const isCalm = t => !!(LAYOUTS[t] && (LAYOUTS[t].calm || CALM_OLD.includes(t)));
/** the calm layouts that suit a line, the ones drawn for it first */
function calmLayoutsFor(cat) {
  return Object.keys(LAYOUTS).filter(k => isCalm(k) && (!LAYOUTS[k].cats || LAYOUTS[k].cats.includes(cat)));
}
/** the calm colours each line leads with */
const LINE_CALM = {
  gold: ["navy_brass", "ink_gold", "forest_brass", "oxblood_cream", "plum_champagne", "ivory_oxblood", "cream_forest", "paper_navy"],
  silver: ["slate_teal", "midnight_sky", "navy_brass", "mist_slate", "white_cobalt", "ink_gold", "stone_charcoal"],
  coins: ["forest_brass", "navy_brass", "oxblood_cream", "paper_navy", "teal_sand", "cream_forest", "ivory_oxblood"],
  wearables: ["ink_gold", "plum_champagne", "navy_brass", "forest_brass", "stone_charcoal", "ivory_oxblood"],
  phones: ["slate_teal", "white_cobalt", "midnight_sky", "graphite_red", "paper_navy", "mist_slate", "sage_pine"],
  devices: ["white_cobalt", "slate_teal", "midnight_sky", "stone_charcoal", "graphite_red", "mist_slate"],
  computers: ["white_cobalt", "slate_teal", "midnight_sky", "stone_charcoal", "graphite_red", "mist_slate"],
  cameras: ["graphite_red", "stone_charcoal", "ink_gold", "midnight_sky", "mist_slate"],
  audio: ["graphite_red", "midnight_sky", "plum_champagne", "slate_teal", "stone_charcoal"],
  gaming: ["midnight_sky", "graphite_red", "sage_pine", "white_cobalt", "plum_champagne", "mist_slate"],
  pokemon: ["paper_navy", "white_cobalt", "midnight_sky", "graphite_red", "navy_brass", "sage_pine"],
  sports: ["paper_navy", "navy_brass", "oxblood_cream", "graphite_red", "forest_brass", "ivory_oxblood"],
  cars: ["graphite_red", "paper_navy", "stone_charcoal", "white_cobalt", "navy_brass", "midnight_sky"],
  strips: ["sage_pine", "white_cobalt", "slate_teal", "teal_sand", "mist_slate"],
  wholesale: ["stone_charcoal", "slate_teal", "navy_brass", "teal_sand", "graphite_red"],
  resale: ["sage_pine", "teal_sand", "paper_navy", "oxblood_cream", "white_cobalt", "cream_forest"],
};
/** the calm styles a line deals from, in turn */
const LINE_STYLES = {
  gold: ["luxury", "classic", "luxury", "classic", "modern", "friendly"], silver: ["classic", "luxury", "modern", "classic", "luxury", "friendly"],
  coins: ["classic", "luxury", "classic", "friendly", "luxury", "modern"], wearables: ["luxury", "classic", "modern", "luxury", "friendly", "classic"],
  pokemon: ["friendly", "modern", "classic", "friendly", "modern", "luxury"], sports: ["classic", "friendly", "modern", "classic", "friendly", "luxury"],
  gaming: ["friendly", "modern", "friendly", "modern", "classic", "luxury"], cars: ["classic", "modern", "classic", "friendly", "modern", "luxury"],
  wholesale: ["classic", "modern", "classic", "friendly", "modern", "luxury"], resale: ["friendly", "modern", "classic", "friendly", "luxury", "modern"],
};
const linesStyles = cat => LINE_STYLES[cat] || ["modern", "friendly", "modern", "classic", "friendly", "luxury"];
/** the style a design reads as: Bold for today's layouts, else the calm style its layout and lettering share */
export function styleOf(design) {
  const d = design || {};
  if (!isCalm(d.t)) return "bold";
  const calm = ["classic", "modern", "friendly", "luxury"];
  return calm.find(s => STYLES[s].voices.includes(d.voice) && STYLES[s].layouts.includes(d.t)) || calm.find(s => STYLES[s].voices.includes(d.voice)) || calm.find(s => STYLES[s].layouts.includes(d.t)) || "modern";
}
/** What a logo is made of, for picking by taste (the questionnaire, a heart on a tile): its style, layout, mark
 *  and the kind of mark, solid or line, soft or sharp, its lettering, its colours and whether its ground is dark. */
export function tagsOf(design) {
  const d = cleanDesign(design), M = MARK_SET[d.mark], P = paletteOf(d.pair);
  return { style: styleOf(d), layout: d.t, group: (LAYOUTS[d.t] || {}).group, mark: d.mark, markKind: M ? M.kind : "", drawing: d.line ? "line" : "solid",
    corners: d.sharp ? "sharp" : "soft", voice: d.voice, tone: (LOGO_VOICES[d.voice] || {}).kind, pair: d.pair, ground: P.dark ? "dark" : "light" };
}
/** The finished logos a customer picks from. style "" (the default): calm logos dealt from the styles that suit the
 *  line; one of STYLES narrows them; "bold" is the gallery as it was. like: a taste to lean toward, the tags of logos
 *  hearted or picked in a questionnaire ({ pairs, marks, styles, layouts, voices }), each a list. Every list holds no
 *  pair twice, no voice more than twice, dark and light grounds by turns. Deterministic for a name, a line, a seed
 *  and a taste; More draws the next seed. */
export function gallery(input, { seed = 1, n = 24, group = "", style = "", like = null } = {}) {
  const base = { name: tidy(input.name), cat: LINE_WORDS[input.cat] ? input.cat : "phones", small: tidy(input.small), town: tidy(input.town), since: tidy(input.since) };
  const R = rng(hash(base.name.toUpperCase() + "|" + base.cat + (style ? "|" + style : "") + (like ? "|" + JSON.stringify(like) : "")) ^ (seed * 2654435761));
  const L0 = like || {}, has = (k, v) => Array.isArray(L0[k]) && L0[k].length && L0[k].includes(v);
  const likedPairs = Array.isArray(L0.pairs) ? L0.pairs.filter(k => PAIR_OF[k]) : [];
  if (style === "bold") return boldGallery(base, R, { seed, n, group, liked: likedPairs });
  // a taste that likes Bold: the Bold gallery, or Bold dealt in turn with the calm styles liked beside it
  const likedS = Array.isArray(L0.styles) ? L0.styles.filter(s => STYLES[s]) : [];
  if (!style && likedS.includes("bold")) {
    const boldList = boldGallery(base, R, { seed, n, group, liked: likedPairs }), calmS = likedS.filter(s => s !== "bold");
    if (!calmS.length) return boldList;
    const calmList = gallery(input, { seed, n, group, like: { ...L0, styles: calmS } }), out = [], usedP = new Set();
    for (let i = 0; out.length < n + 8 && (i < calmList.length || i < boldList.length); i++) for (const d of [calmList[i], boldList[i]]) if (d && !usedP.has(d.pair)) { usedP.add(d.pair); out.push(d); }
    return out;
  }
  const seq = style && STYLES[style] ? [style] : Array.isArray(L0.styles) && L0.styles.length ? L0.styles.filter(s => STYLES[s] && s !== "bold") : linesStyles(base.cat);
  const styles = seq.length ? seq : linesStyles(base.cat);
  let lays = calmLayoutsFor(base.cat).filter(k => !group || LAYOUTS[k].group === group);
  if (style && STYLES[style]) { const only = lays.filter(k => STYLES[style].layouts.includes(k)); if (only.length) lays = only; }
  else if (likedS.length) { const u = new Set(likedS.flatMap(s => STYLES[s].layouts)), only = lays.filter(k => u.has(k)); if (only.length >= 4) lays = only; }
  if (Array.isArray(L0.layouts) && L0.layouts.length) { const only = lays.filter(k => L0.layouts.includes(k)); if (only.length >= 3) lays = only; }
  if (!lays.length) return [];
  const own = lays.filter(k => LAYOUTS[k].cats), order = [];
  while (order.length < n + 16) order.push(...(order.length ? shuffle(lays, R) : [...shuffle(own, R), ...shuffle(lays.filter(k => !own.includes(k)), R)]));
  const liked = likedPairs;
  const stylePairs = [...new Set(styles.flatMap(s => STYLES[s].pairs))];
  // colours the customer chose come back on every other logo; the slots between suggest others (never the chosen)
  const pool = [...new Set([...shuffle(LINE_CALM[base.cat] || [], R), ...shuffle(stylePairs, R), ...shuffle(CALM_PAIRS, R)])].filter(k => !liked.includes(k));
  let li = 0;
  const darkQ = pool.filter(k => paletteOf(k).dark), lightQ = pool.filter(k => !paletteOf(k).dark);
  const fam = MARKS_FOR[base.cat] || MARKS_FOR.phones, usedV = {}, usedM = {}, icons = ICONS_FOR[base.cat] || ICONS_FOR.phones, out = [], seen = new Set();
  for (let i = 0; out.length < n + 8 && i < order.length; i++) {
    const t = order[i], L = LAYOUTS[t];
    const st = styles.find((s, j) => j >= i % styles.length && STYLES[s].layouts.includes(t)) || styles.find(s => STYLES[s].layouts.includes(t)) || ["classic", "modern", "friendly", "luxury"].find(s => STYLES[s].layouts.includes(t)) || "modern";
    const S = STYLES[st];
    const q = (out.length % 2 === 0) === (seed % 2 === 1) ? darkQ : lightQ;
    const pair = liked.length && out.length % 2 === 0 ? liked[li++ % liked.length] : q.length ? q.shift() : (darkQ.shift() || lightQ.shift() || "navy_brass");
    const fit = v => LOGO_VOICES[v] && L.kinds.includes(LOGO_VOICES[v].kind) && (usedV[v] || 0) < 2;
    const likedV = (L0.voices || []).filter(fit), styleV = shuffle(S.voices.filter(fit), R), anyV = shuffle(Object.keys(LOGO_VOICES).filter(v => fit(v) && (LOGO_VOICES[v].logoOnly || ["bold", "block", "stadium", "tech", "luxe", "grotesk", "brush", "marker"].includes(v))), R);
    const voice = [...likedV, ...styleV.sort((a, b) => (usedV[a] || 0) - (usedV[b] || 0)), ...anyV][0];
    if (!voice) continue;
    let mark = "", line = false, icon = "";
    if (L.usesMark || (t === "heritage" && R() < .35)) {
      const kinds = t === "heritage" ? ["object", "act", "abstract"] : S.marks;
      const cands = fam.filter(k => kinds.includes(MARK_SET[k].kind) && !(t === "heritage" && MARK_SET[k].init));
      const pool2 = (cands.length ? cands : fam).slice().sort((a, b) => (has("marks", b) - has("marks", a)) || ((usedM[a] || 0) - (usedM[b] || 0)));
      mark = pool2[0] || ""; line = t !== "tile" && R() < S.line;
    } else if (CALM_OLD.includes(t)) icon = R() < .55 ? icons[Math.floor(R() * Math.min(2, icons.length))] : "";
    const d = cleanDesign({ ...base, t, voice, pair, icon, mark, line, seed: Math.floor(R() * 99999) });
    const key = t + d.voice + d.pair + d.mark;
    if (seen.has(key)) continue; seen.add(key);
    usedV[voice] = (usedV[voice] || 0) + 1; if (mark) usedM[mark] = (usedM[mark] || 0) + 1;
    out.push(d);
  }
  return out;
}
/** The Bold style: the gallery as it was before the calm one, every older layout in the voices and pairs it had. */
function boldGallery(base, R, { seed, n, group, liked = [] }) {
  let lays = layoutsFor(base.cat).filter(k => !group || LAYOUTS[k].group === group);
  const own = lays.filter(k => LAYOUTS[k].cats);
  const order = [];
  while (order.length < n + 8) order.push(...(order.length ? shuffle(lays, R) : [...shuffle(own, R), ...shuffle(lays.filter(k => !own.includes(k)), R)]));
  const pref = [...new Set([...liked, ...shuffle(LINE_PAIRS[base.cat] || [], R)])], rest = shuffle(LOGO_PAIRS.filter(k => !pref.includes(k) && !PAIR_OF[k].logoOnly), R);
  const darkQ = [...pref, ...rest].filter(k => paletteOf(k).dark), lightQ = [...pref, ...rest].filter(k => !paletteOf(k).dark);
  const usedV = {}, icons = ICONS_FOR[base.cat] || ICONS_FOR.phones, out = [], seen = new Set();
  for (let i = 0; out.length < n + 8 && i < order.length; i++) {
    const t = order[i], L = LAYOUTS[t];
    const q = (out.length % 2 === 0) === (seed % 2 === 1) ? darkQ : lightQ;
    const pair = q.length ? q.shift() : (darkQ.shift() || lightQ.shift() || "navy_gold");
    const voices = shuffle(AD_VOICES.filter(v => L.kinds.includes(LOGO_VOICES[v].kind)), R).sort((a, b) => (usedV[a] || 0) - (usedV[b] || 0));
    const voice = voices[0] || "bold"; usedV[voice] = (usedV[voice] || 0) + 1;
    const icon = R() < .6 ? icons[Math.floor(R() * Math.min(2, icons.length))] : "";
    const fr = R(), finish = fr < .18 ? "gradient" : fr < .28 ? "pattern" : "flat";
    const d = cleanDesign({ ...base, t, voice, pair, icon, finish, seed: Math.floor(R() * 99999) });
    const key = t + d.voice + d.pair;
    if (seen.has(key)) continue; seen.add(key);
    out.push(d);
  }
  return out;
}
/* ---------- the questionnaire and the templates (DESIGN-LAW 183) ----------
   The owner, 2026-11-25: "how could this become some sort of a questionnaire where you choose assets, color schemes
   you like, suggested builds and then you end up with the final pick ... or you can build your own from a template
   or existing edit". Three questions, each answered by tapping finished logos in the shop's own name (never a
   setting): which style feels like the shop, colours liked, symbols liked. The answers are a taste the gallery leans
   toward (gallery({ like })), and a heart on a logo adds to it. */
export const QUIZ = [
  { key: "styles", q: "Which feels like your shop?", hint: "Pick one or two. Each is a logo in your name.", max: 2 },
  { key: "pairs", q: "Which colours do you like?", hint: "Pick up to three.", max: 3 },
  { key: "marks", q: "Which symbols suit you?", hint: "Pick up to three, or just your name, or your initials.", max: 3 },
];
const NAME_LAYOUTS = ["wordmark", "split", "framed", "deco", "varsity", "signboard", "shopplate", "label", "stacked"];
const INIT_LAYOUTS = ["interlace", "tile", "monogram", "roundel", "heritage"];
const MARK_LAYOUTS = ["lockup", "centred", "tile", "heritage"];
/** the colours the second question offers: the liked styles' and the line's, dark and light by turns, no near twins */
export function pairChoices(input, styles = [], n = 10) {
  const cat = LINE_WORDS[input && input.cat] ? input.cat : "phones", st = (styles || []).filter(s => STYLES[s]);
  const pool = [...new Set([...(st.length ? st : linesStyles(cat)).flatMap(s => s === "bold" ? LINE_PAIRS[cat] || [] : [...(LINE_CALM[cat] || []).filter(k => STYLES[s].pairs.includes(k)), ...STYLES[s].pairs]), ...(LINE_CALM[cat] || []), ...CALM_PAIRS])].filter(k => PAIR_OF[k]);
  const dark = pool.filter(k => paletteOf(k).dark), light = pool.filter(k => !paletteOf(k).dark), out = [];
  while (out.length < n && (dark.length || light.length)) {
    const q = out.length % 2 ? light : dark, k = (q.length ? q : dark.length ? dark : light).shift();
    if (out.every(p => !nearTwin(p, k))) out.push(k);
  }
  return out;
}
/** the third question's answers: the line's family of marks, then "just my name" and "my initials" */
export const markChoices = cat => [...(MARKS_FOR[cat] || MARKS_FOR.phones), "name", "initials"];
/** a taste from the answers and the hearted logos: what the gallery leans toward */
export function tasteOf(answers, hearts = []) {
  const a = answers || {}, hs = (hearts || []).map(h => cleanDesign(h));
  const uniq = xs => [...new Set(xs.filter(Boolean))];
  const styles = uniq([...(a.styles || []).filter(s => STYLES[s]), ...hs.map(styleOf)]);
  const pairs = uniq([...(a.pairs || []).filter(k => PAIR_OF[k]), ...hs.map(h => h.pair)]);
  const ms = a.marks || [], marks = uniq([...ms.filter(k => MARK_SET[k]), ...hs.map(h => h.mark)]);
  const layouts = uniq([...(ms.some(k => MARK_SET[k]) ? MARK_LAYOUTS : []), ...(ms.includes("name") ? NAME_LAYOUTS : []), ...(ms.includes("initials") ? INIT_LAYOUTS : [])]);
  const voices = uniq(hs.map(h => h.voice));
  const out = {};
  for (const [k, v] of Object.entries({ styles, pairs, marks, layouts, voices })) if (v.length) out[k] = v;
  return Object.keys(out).length ? out : null;
}
/** Every layout as a finished logo in the shop's name: the templates to start from. The calm ones first, each in a
 *  style it belongs to, then Bold's. */
export function templates(input) {
  const base = { name: tidy(input.name), cat: LINE_WORDS[input.cat] ? input.cat : "phones", small: tidy(input.small), town: tidy(input.town), since: tidy(input.since) };
  const fam = MARKS_FOR[base.cat] || MARKS_FOR.phones, calmP = [...new Set([...(LINE_CALM[base.cat] || []), ...CALM_PAIRS])], boldP = [...new Set([...(LINE_PAIRS[base.cat] || []), ...LOGO_PAIRS.filter(k => !PAIR_OF[k].logoOnly)])];
  const voiceFor = (L, list) => list.find(v => LOGO_VOICES[v] && L.kinds.includes(LOGO_VOICES[v].kind)) || Object.keys(LOGO_VOICES).find(v => L.kinds.includes(LOGO_VOICES[v].kind));
  const calm = calmLayoutsFor(base.cat).map((t, i) => {
    const L = LAYOUTS[t], st = linesStyles(base.cat).find(s => STYLES[s].layouts.includes(t)) || ["classic", "modern", "friendly", "luxury"].find(s => STYLES[s].layouts.includes(t)) || "modern";
    return cleanDesign({ ...base, t, voice: voiceFor(L, STYLES[st].voices), pair: calmP[(i * 3) % calmP.length], mark: L.usesMark ? fam[i % fam.length] : "", icon: CALM_OLD.includes(t) ? (ICONS_FOR[base.cat] || ICONS_FOR.phones)[0] : "", seed: 1 + i });
  });
  const bold = layoutsFor(base.cat).filter(t => !CALM_OLD.includes(t)).map((t, i) => cleanDesign({ ...base, t, voice: voiceFor(LAYOUTS[t], AD_VOICES), pair: boldP[(i * 5) % boldP.length], icon: (ICONS_FOR[base.cat] || ICONS_FOR.phones)[0], seed: 1 + i }));
  return [...calm, ...bold];
}
/** The same logo in other colours, faces, shapes, symbols or finishes: the rows under the one picked. A calm logo's
 *  rows offer calm choices first; its Symbol row is its line's catalogue (the mark as it is, the same mark drawn the
 *  other way, then the family). axis "corners": soft or sharp. */
export function variants(design, axis, n = 8) {
  const d = cleanDesign(design), L = LAYOUTS[d.t], R = rng(hash(d.name + axis) ^ d.seed), calm = isCalm(d.t), st = styleOf(d);
  if (axis === "pair") {
    const pref = (calm ? [...(LINE_CALM[d.cat] || []), ...(STYLES[st] ? STYLES[st].pairs : [])] : LINE_PAIRS[d.cat] || []).filter(k => k !== d.pair);
    const rest = shuffle((calm ? CALM_PAIRS : LOGO_PAIRS).filter(k => k !== d.pair && !pref.includes(k)), R);
    const pool = [...new Set([...pref.slice(0, calm ? 5 : 3), ...rest])], picked = [d.pair];
    for (const k of pool) if (picked.length < n && picked.every(p => !nearTwin(p, k))) picked.push(k);
    return picked.map(pair => ({ ...d, pair }));
  }
  if (axis === "voice") {
    const ok = v => v !== d.voice && L.kinds.includes(LOGO_VOICES[v].kind);
    const first = calm && STYLES[st] ? STYLES[st].voices.filter(ok) : [];
    const rest = shuffle(Object.keys(LOGO_VOICES).filter(v => ok(v) && !first.includes(v) && (!calm || LOGO_VOICES[v].logoOnly || !(STYLES.bold.voices.includes(v) && !["bold", "block", "stadium", "tech", "luxe", "grotesk", "brush", "marker"].includes(v)))), R);
    return [d.voice, ...first, ...rest].slice(0, n).map(voice => ({ ...d, voice }));
  }
  if (axis === "finish") {
    const c = (o) => ({ ...d, finish: o });
    return Object.keys(FINISHES).map(c);
  }
  if (axis === "corners") return [{ ...d, sharp: false }, { ...d, sharp: true }];
  if (axis === "icon") {
    const fam = MARKS_FOR[d.cat] || MARKS_FOR.phones;
    if (L.usesMark) {
      // the line's catalogue: the mark as it is, drawn the other way, then the rest of the family (a tile holds the
      // initial or a mark that carries no initials of its own)
      const cur = d.mark || fam[0], ok = k => d.t !== "tile" || !MARK_SET[k].init;
      const list = [{ ...d, mark: cur }, ...(d.t === "tile" ? [] : [{ ...d, mark: cur, line: !d.line }])];
      if (d.t === "tile" && cur !== "tileInit") list.push({ ...d, mark: "" });
      for (const k of fam) if (k !== cur && ok(k) && list.length < n) list.push({ ...d, mark: k });
      return list.slice(0, n);
    }
    if (d.t === "heritage") return [{ ...d, mark: "" }, ...fam.filter(k => !MARK_SET[k].init).map(k => ({ ...d, mark: k, line: true }))].slice(0, n);
    // a calm wordmark, frame or plate: the name alone, or one of the line's marks beside it
    if (L.calm) return [{ ...d, mark: "" }, ...fam.map(k => ({ ...d, t: "lockup", mark: k, voice: LAYOUTS.lockup.kinds.includes((LOGO_VOICES[d.voice] || {}).kind) ? d.voice : "classic" }))].slice(0, n);
    return ["", ...(ICONS_FOR[d.cat] || []), "cashTag", "sparkle", "shieldTick", "boltFast"].filter((k, i, a) => a.indexOf(k) === i).slice(0, n).map(icon => ({ ...d, icon }));
  }
  if (axis === "layout") return [d.t, ...shuffle((calm ? calmLayoutsFor(d.cat) : layoutsFor(d.cat)).filter(k => k !== d.t), R)].slice(0, n).map(t => {
    const kinds = LAYOUTS[t].kinds, voice = kinds.includes((LOGO_VOICES[d.voice] || {}).kind) ? d.voice
      : ((calm && STYLES[st] ? STYLES[st].voices : []).find(v => kinds.includes(LOGO_VOICES[v].kind)) || Object.keys(LOGO_VOICES).find(v => kinds.includes(LOGO_VOICES[v].kind)));
    return { ...d, t, voice };
  });
  return [d];
}
/** what a row's choice is called, for its label: a colour pair, lettering, a shape, a symbol, a finish or corners */
export function variantName(design, axis) {
  const d = cleanDesign(design);
  if (axis === "pair") return paletteOf(d.pair).name;
  if (axis === "voice") return (LOGO_VOICES[d.voice] || {}).name || d.voice;
  if (axis === "layout" || axis === "t") return LAYOUTS[d.t].name;
  if (axis === "corners") return d.sharp ? "Sharp corners" : "Soft corners";
  if (axis === "finish") return FINISHES[d.finish || "flat"];
  if (axis === "icon") {
    if (d.mark && (LAYOUTS[d.t].usesMark || d.t === "heritage")) return MARK_SET[d.mark].name + (d.line && d.t !== "tile" && d.t !== "heritage" ? ", line" : "");
    if (d.t === "heritage" || d.t === "tile") return "Initials";
    if (LAYOUTS[d.t].calm) return "Just the name";
    return d.icon ? LOGO_ICONS[d.icon][1] : "Initials";
  }
  return "";
}
/** two pairs too alike to offer side by side: the same ground and accent to the eye */
function nearTwin(a, b) {
  const A = paletteOf(a), B = paletteOf(b);
  return contrast(A.G, B.G) < 1.25 && contrast(A.A, B.A) < 1.25 && !hueApart(A.G, B.G) && !hueApart(A.A, B.A);
}
/** two colours of clearly different hue (oxblood and navy at one lightness are not twins), each with some colour */
function hueApart(a, b) {
  const hs = h => { const [r, g, bl] = rgbOf(h).map(v => v / 255), mx = Math.max(r, g, bl), mn = Math.min(r, g, bl), d = mx - mn;
    if (!d) return [0, 0];
    const hue = mx === r ? ((g - bl) / d + 6) % 6 : mx === g ? (bl - r) / d + 2 : (r - g) / d + 4;
    return [hue * 60, d / (1 - Math.abs(mx + mn - 1) || 1)]; };
  const [h1, s1] = hs(a), [h2, s2] = hs(b), dh = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2));
  return s1 > .15 && s2 > .15 && dh > 30;
}

/* ---------- for the brand kit (logo/kit.js): the engine's own tools, so a kit file is drawn the way a
   logo is (the same outlines, palette roles and lockups), never a second way ---------- */
export const K = { ctxOf, partsOf, drawMark, drawHorizontal, svgOf, textLine, fitSize, fitBlock, drawBlock, capOf, shapeRun, arcText, arcFit,
  rectD, circleD, starD, polyD, hexPts, shieldD, iconItem, ring, dot, tidy, up, f1, esc, LAYOUTS };
