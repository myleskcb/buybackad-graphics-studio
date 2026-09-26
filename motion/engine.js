// Phone Ad Maker engine: draws one frame of an ad at any time t.
// Ported from iphoneslainv scripts/phone-ad/adengine (the Mac engine).

import { FONTS, FINE_FACES, PALETTES, FINISH_PALETTES, OPTIONS, WEIGHTS, FLAGS, HEADLINES, TAGS,
  NUMBER_LABELS, DEFAULT_STYLE, HOOKS, VIBES, BOARDS, COPY } from "./catalog.js";
import { vibeBackground, sceneryOver, buildBoard, drawBoard, freeSpot, drawStarburst, drawPinstripe, buildSpray, drawSpray,
  drawAwning, drawNeonArrow, buildTicker, drawTicker, drawTape, buildStamp, drawStamp, chevronRoom, drawChevrons, drawFlashBorder, beatPulse } from "./decor.js";

// ------------------------------------------------------------ small tools

export function rng(seed) {                       // mulberry32
  let a = (seed >>> 0) || 1;
  const f = () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  f.uniform = (lo, hi) => lo + (hi - lo) * f();
  f.pick = (arr) => arr[Math.floor(f() * arr.length)];
  f.weighted = (arr, w) => {
    const ws = arr.map(o => (w && o in w) ? w[o] : 1);
    let r = f() * ws.reduce((a, b) => a + b, 0);
    for (let i = 0; i < arr.length; i++) { r -= ws[i]; if (r <= 0) return arr[i]; }
    return arr[arr.length - 1];
  };
  f.int = (lo, hi) => Math.floor(lo + (hi - lo + 1) * f());
  f.sample = (arr, k) => { const a = arr.slice(); const out = []; while (out.length < k && a.length) out.push(a.splice(Math.floor(f() * a.length), 1)[0]); return out; };
  return f;
}

export const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
export const prog = (t, t0, d) => d > 0 ? clamp((t - t0) / d) : (t >= t0 ? 1 : 0);
export const lerp = (a, b, p) => a + (b - a) * p;
export const outCubic = p => 1 - (1 - p) ** 3;
export const outQuint = p => 1 - (1 - p) ** 5;
export const inOut = p => 3 * p * p - 2 * p * p * p;
export const outBack = (p, s = 1.6) => { p -= 1; return 1 + (s + 1) * p ** 3 + s * p ** 2; };
export const outElastic = p => p === 0 || p === 1 ? p : 2 ** (-10 * p) * Math.sin((p * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
export function outBounce(p) {
  const n = 7.5625, d = 2.75;
  if (p < 1 / d) return n * p * p;
  if (p < 2 / d) { p -= 1.5 / d; return n * p * p + .75; }
  if (p < 2.5 / d) { p -= 2.25 / d; return n * p * p + .9375; }
  p -= 2.625 / d; return n * p * p + .984375;
}
export const hexRgb = h => { h = h.replace("#", ""); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
export const lum = h => { const [r, g, b] = typeof h === "string" ? hexRgb(h) : h; return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
export const rgba = (h, a = 1) => { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${a})`; };
export const mix = (h1, h2, k) => { const a = hexRgb(h1), b = hexRgb(h2); return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * k).toString(16).padStart(2, "0")).join(""); };
const shade = (h, k) => mix(h, k < 0 ? "#000000" : "#ffffff", Math.abs(k));

export function canvas(w, h) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
  return c;
}
export function rrect(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// ------------------------------------------------------------ the style

export const ASPECTS = { "1:1": [1080, 1080], "9:16": [1080, 1920], "16:9": [1920, 1080], "4:5": [1080, 1350] };

export function pal(st) {
  return { ...(PALETTES[st.palette] || PALETTES.sand), ...(st.colors || {}) };
}

/** Draw every unlocked design axis from the seed, each independently. */
export function randomize(st, seed, locked = new Set(), phonesPool = [], content = true) {
  const r = rng(seed * 7919 + 13);
  const out = { ...st, seed };
  for (const k of Object.keys(OPTIONS)) {
    if (!locked.has(k)) out[k] = r.weighted(OPTIONS[k], WEIGHTS[k]);
  }
  for (const [k, p] of Object.entries(FLAGS)) if (!locked.has(k)) out[k] = r() < p;
  if (!locked.has("bpm")) out.bpm = r.int(90, 134);
  // an opening that shows the phones on frame 0 shows their backs: screen-up phones are black glass in the thumbnail
  if (!["hook_line", "word_beat"].includes(out.hook) && out.front_glimpse === "hold" && !locked.has("front_glimpse")) out.front_glimpse = "spin";
  vibeInto(out, r, locked);
  copyInto(out, r, locked, content);
  if (!locked.has("phones") && phonesPool.length > 5) out.phones = r.sample(phonesPool, r.pick([3, 4, 4, 5]));
  return harmonise(out, locked);
}

/** An LA vibe draws the look's ground, palette, faces, treatment, sign board
 *  and decorations from its own pools, so one vibe is many looks. The page calls
 *  this when a vibe is picked by hand, so the pick shows at once. */
export function applyVibe(st, seed, locked = new Set()) {
  const out = { ...st };
  vibeInto(out, rng(seed * 4099 + 17), locked);
  return out;
}

// Grounds that are a material (a cork board, a stucco wall, candy paint) belong to
// the vibe that paints them in its own colours; any other look draws the rest.
const VIBE_GROUNDS = new Set(["cork", "stucco", "concrete", "brick_night", "candy_flake", "asphalt", "velvet", "beach", "mural_wall", "fluoro"]);

function vibeInto(out, r, locked) {
  const v = VIBES[out.vibe];
  const set = (k, list) => { if (list && list.length && !locked.has(k)) out[k] = r.pick(list); };
  const g = () => lum((PALETTES[out.palette] || PALETTES.sand).ground);
  const fits = b => !(b === "brick_night" && g() > .45) && !(b === "sky_day" && g() < .3) && !(b === "concrete" && g() < .2);
  if (!v) {
    if (!locked.has("board")) out.board = "none";
    if (!locked.has("decor")) out.decor = r() < .2 ? [r.pick(["palms", "skyline"])] : [];
    if (!locked.has("background") && (VIBE_GROUNDS.has(out.background) || !fits(out.background)))
      out.background = r.pick(OPTIONS.background.filter(b => !VIBE_GROUNDS.has(b) && fits(b)));
    return out;
  }
  set("palette", v.palettes); set("background", v.backgrounds); set("font", v.fonts);
  set("text_fx", v.fx); set("number_style", v.numbers); set("text_in", v.text_in); set("skew", v.skew);
  if (!locked.has("background") && !fits(out.background)) out.background = (v.backgrounds || []).find(fits) || "radial";
  if (!locked.has("board")) out.board = v.boards && r() < (v.boardChance ?? 1) ? r.pick(v.boards) : "none";
  if (!locked.has("decor")) {
    const d = v.decor || [], lo = Math.min(d.length, v.decorMin ?? 0), hi = Math.min(d.length, v.decorMax ?? d.length);
    out.decor = d.length ? r.sample(d, r.int(lo, Math.max(lo, hi))) : [];
  }
  return out;
}

const SPANISH = /[¿¡ÁÉÍÓÚÑ]|\b(COMPRAMOS|COMPRO|VENDE|TU|EFECTIVO|DINERO|TEL[ÉE]FONOS?|AQU[ÍI]|M[ÁA]NDANOS|LLAMA)\b/i;

/** The look's city ({AREA}): the brand kit's, else LA for an LA vibe, else none. */
export function areaOf(st) {
  const a = String(st.area || "").split(",")[0].trim().toUpperCase();
  return a || (st.vibe && st.vibe !== "none" ? "LA" : "");
}
/** The area code of the number on the ad ({CODE}), or nothing. */
export function codeOf(st) {
  let d = String(st.number || "").replace(/\D/g, "");
  if (d.length === 11 && d[0] === "1") d = d.slice(1);
  return d.length === 10 ? d.slice(0, 3) : "";
}

/** The words, in the look's language. A line that needs a city or an area code
 *  we do not know is skipped rather than printed with a hole in it. */
export function applyCopy(st, seed, locked = new Set(), content = true) {
  const out = { ...st };
  copyInto(out, rng(seed * 6007 + 29), locked, content);
  return out;
}

function copyInto(out, r, locked, content) {
  const mode = out.lang_mode || "en";
  let lang = mode === "mix" ? r.weighted(["en", "es", "both"], { en: 5, es: 3, both: 2 }) : mode;
  if (!content && mode !== "both") lang = SPANISH.test(out.headline || "") ? "es" : "en";   // the words on the page decide
  out.lang = lang;
  const v = VIBES[out.vibe], known = { AREA: areaOf(out), CODE: codeOf(out) };
  const fillIn = L => s => {
    let ok = true;
    const t = String(s).replace(/\{(AREA|CODE)\}/g, (_, k) => { if (!known[k]) ok = false; return k === "AREA" && L === "es" && known.AREA === "LA" ? "L.A." : known[k]; });
    return ok ? t : null;
  };
  const legacy = { headlines: HEADLINES, hooks: HOOKS, tags: TAGS, labels: NUMBER_LABELS };
  const pool = (L, key) => {
    const own = (v && v.copy && v.copy[L] && v.copy[L][key]) || [];
    const base = (COPY[L] && COPY[L][key]) || [];
    const extra = L === "en" ? (legacy[key] || []) : [];
    const fill = fillIn(L);
    return [...new Set([...own, ...base, ...extra].map(fill).filter(s => s != null))].concat(own.map(fill).filter(s => s != null));
  };
  const pick = (L, key, fallback = "") => { const p = pool(L, key); return p.length ? r.pick(p) : fallback; };
  const headL = lang === "both" ? (r() < .6 ? "en" : "es") : lang;
  const otherL = lang === "both" ? (headL === "en" ? "es" : "en") : lang;
  if (content) {
    if (!locked.has("headline")) out.headline = pick(headL, "headlines", out.headline);
    if (!locked.has("tag")) out.tag = out.urgency !== "none" && r() < .3 ? pick(otherL, "urgent") : pick(otherL, "tags");
    if (!locked.has("number_label")) out.number_label = lang === "both" && r() < .6 ? r.pick(COPY.both.labels) : pick(otherL, "labels");
    if (!locked.has("hook_text")) {
      const hooks = pool(headL, "hooks"), short = hooks.filter(h => h.split(/\s+/).length <= 5);
      out.hook_text = r.pick(out.hook === "word_beat" && short.length ? short : hooks);
    }
  }
  if (!locked.has("cta")) out.cta = pick(otherL, "cta", "TEXT NOW");
  if (!locked.has("urgent")) out.urgent = pick(otherL, "urgent", "IT LOSES VALUE EVERY MONTH");
  if (!locked.has("stamp_text")) out.stamp_text = pick(headL, "stamp", "CASH");
  if (!locked.has("burst_text")) out.burst_text = pick(headL, "burst", "CASH!");
  if (!locked.has("ticker_items")) {
    const items = lang === "both" ? [...new Set([...pool("en", "ticker"), ...pool("es", "ticker")])] : [...new Set(pool(lang, "ticker"))];
    out.ticker_items = r.sample(items, Math.min(items.length, 5));
  }
  return out;
}

/** The few pairings that do not work, repaired. Nothing here narrows the look;
 *  it only stops two choices colliding on screen. */
export function harmonise(st, locked = new Set(), phoneIndex = {}) {
  if (!FONTS[st.font]) st.font = "franklin";
  if (st.palette === "match") {
    const found = (st.phones || []).map(id => FINISH_PALETTES[(phoneIndex[id] || {}).finish]).filter(Boolean);
    st.palette = found.length ? found[Math.floor(rng(st.seed * 31)() * found.length)] : "sand";
    st._matched = true;
  }
  if (!Array.isArray(st.decor)) st.decor = [];
  const board = BOARDS[st.board];
  if (!board) st.board = "none";
  const halo = st.decor.includes("spray_halo");
  const p = pal(st);
  const darkInk = lum(p.ink) < 0.5;
  if (st.text_pos === "bottom-left" && ["bottom-left", "bottom-center"].includes(st.number_pos) && !locked.has("number_pos")) st.number_pos = "bottom-right";
  if (st.text_pos === "top-right" && st.number_pos === "bottom-right" && !locked.has("number_pos")) st.number_pos = "bottom-left";
  if (["top-center", "center"].includes(st.text_pos) && ["bottom-left", "bottom-right"].includes(st.number_pos) && !locked.has("number_pos")) st.number_pos = "bottom-center";
  if (st.decor.includes("pinstripe") && st.number_pos === "under-headline" && !locked.has("number_pos")) st.number_pos = "bottom-center";
  if (st.number_in === "type" && !locked.has("number_sfx")) st.number_sfx = "ticks";
  if (!["hook_line", "word_beat"].includes(st.hook) && ["typewriter", "scramble", "drop_letters", "spin_letters"].includes(st.text_in) && !locked.has("text_in"))
    st.text_in = ["slide", "skew_slide", "slam", "wipe"][st.seed % 4];
  if (st.text_fx === "box" && st.color_mode === "split_lines") st.color_mode = "mono";
  if (board) {
    // the headline sits on the sign, so the sign decides its colours and treatment
    if (!board.fx.includes(st.text_fx)) st.text_fx = board.fx[st.seed % board.fx.length];
    if (board.fonts && !locked.has("font") && !board.fonts.includes(st.font)) st.font = board.fonts[st.seed % board.fonts.length];
    if (st.color_mode === "split_lines") st.color_mode = "accent_line";
    st.skew = 0;
  } else {
    // dark type crosses black glass somewhere in almost every layout (a spray halo carries it instead)
    const onPlate = ["sticker", "box", "highlighter", "cutout", "double_outline"];
    if (darkInk && !halo && !onPlate.includes(st.text_fx) && !locked.has("text_fx")) st.text_fx = ["sticker", "box", "highlighter", "double_outline"][st.seed % 4];
    if (darkInk && st.text_fx === "neon") st.text_fx = "sticker";
    if (!darkInk && lum(p.accent) < 0.42 && st.color_mode !== "mono" && st.text_fx !== "box" && !locked.has("color_mode")) st.color_mode = "mono";
    // an outline or a neon tube only reads on a darker ground
    if (lum(p.ground) > .5 && ["outline", "neon"].includes(st.text_fx) && !locked.has("text_fx")) st.text_fx = st.text_fx === "outline" ? "double_outline" : "shadow";
  }
  if (lum(p.ground) > .4 && st.number_style === "neon" && !locked.has("number_style")) st.number_style = "pill";
  // one "quote" is enough: a tag and a label must not say the same thing twice
  if (st.tag && st.number_label && /QUOTE/i.test(st.tag) && /QUOTE/i.test(st.number_label) && !locked.has("number_label")) st.number_label = "";
  if (FINE_FACES.has(st.font) && ["outline", "neon", "double_outline", "cutout", "long_shadow"].includes(st.text_fx) && !locked.has("text_fx")) st.text_fx = "shadow";
  if (st.case === "title" && !locked.has("tracking")) st.tracking = Math.min(st.tracking, 0.05);
  if ((FONTS[st.font] || [])[3] === "wide" && !locked.has("tracking")) st.tracking = Math.min(st.tracking, 0.01);
  if (st.decor.includes("sparkle")) st.sparkles = true;
  return st;
}

/** The colours of type set ON a sign board: the board's, not the scene's. */
function boardPalette(b, p) {
  let ink = b.ink;
  if (ink === "auto") ink = lum(p.plate) > .55 ? "#111111" : "#ffffff";
  let accent = b.accent ?? p.accent;
  if (Math.abs(lum(accent) - lum(ink)) < .2) accent = ink;
  return { ...p, ink, accent, plate: lum(ink) > .5 ? "#111111" : "#ffffff", plate_ink: ink };
}

/** A loud colour that reads on this ground: for badges, tickers, arrows and borders. */
function hotColour(p) {
  for (const c of [p.accent, "#ffd60a", "#ff2d55", "#30d158", "#00e5ff"]) if (Math.abs(lum(c) - lum(p.ground)) > .3 && lum(c) > .25) return c;
  return lum(p.ground) > .5 ? "#111111" : "#ffd60a";
}

/** The spray behind street lettering: whichever of the scene's colours stands off the ink. */
function haloColour(p) {
  const best = [p.accent, p.plate].sort((a, b) => Math.abs(lum(b) - lum(p.ink)) - Math.abs(lum(a) - lum(p.ink)))[0];
  return Math.abs(lum(best) - lum(p.ink)) >= .45 ? best : (lum(p.ink) > .5 ? "#111111" : "#ffffff");
}

/** The face a starburst is lettered in: the headline's, unless that face is too fine or too loopy. */
export function burstFontFor(st) {
  const f = FONTS[st.font];
  return f && !FINE_FACES.has(st.font) && !["script", "serif", "mono"].includes(f[3]) ? st.font : "luckiest";
}

// ------------------------------------------------------------ phones

const THICKNESS = 0.115, CORNER = 0.165;

export class Glare {
  constructor(r, scale = 1) {
    this.angle = r() < .5 ? r.uniform(15, 75) : r.uniform(105, 165);
    this.offset = r.uniform(.12, .7); this.width = r.uniform(.05, .16);
    this.strength = r.uniform(.05, .13) * scale;
    this.streak = r() < .5 ? 0 : r.uniform(.12, .32);
    this.streakStrength = r.uniform(.03, .07) * scale;
    this.travel = r.uniform(.35, .8);
  }
}

/** The screen side, switched off: the band, a black border, OLED glass and the
 *  Dynamic Island as a pill only slightly darker than the glass. Drawn centred. */
function drawFront(ctx, w, h, metal, glare, rot, flip, cxNorm) {
  const R = CORNER * w;
  rrect(ctx, -w / 2, -h / 2, w, h, R); ctx.fillStyle = metal; ctx.fill();
  const b = 0.014 * w;
  rrect(ctx, -w / 2 + b, -h / 2 + b, w - 2 * b, h - 2 * b, R - b); ctx.fillStyle = "#050506"; ctx.fill();
  const s = b + 0.032 * w, sw = w - 2 * s, sh = h - 2 * s, sr = R - s * 1.05;
  rrect(ctx, -w / 2 + s, -h / 2 + s, sw, sh, sr); ctx.fillStyle = "#111215"; ctx.fill();
  if (glare && glare.strength > 0) {
    ctx.save(); rrect(ctx, -w / 2 + s, -h / 2 + s, sw, sh, sr); ctx.clip();
    const a = (glare.angle + rot) * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    const L = Math.hypot(sw, sh) / 2;
    const pos = glare.offset + glare.travel * (Math.sin(flip) * .8 + (cxNorm - .5) * .6);
    const g = ctx.createLinearGradient(-ca * L, -sa * L, ca * L, sa * L);
    const stop = (u, al) => { const k = clamp(u); g.addColorStop(k, `rgba(255,255,255,${al})`); };
    stop(0, 0);
    const c = clamp(pos), wd = glare.width;
    stop(c - wd * 1.6, 0); stop(c, glare.strength); stop(c + wd * 1.6, 0);
    if (glare.streak) { const c2 = pos + glare.streak; if (c2 < .97) { stop(c2 - .025, 0); stop(c2, glare.streakStrength); stop(c2 + .025, 0); } }
    stop(1, 0);
    ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.restore();
  }
  const iw = 0.315 * sw, ih = 0.093 * sw, top = -h / 2 + s + 0.034 * sw;
  rrect(ctx, -iw / 2, top, iw, ih, ih / 2); ctx.fillStyle = "#070708"; ctx.fill();
  const lr = ih * .3, lx = iw / 2 - ih / 2, ly = top + ih / 2;
  ctx.beginPath(); ctx.arc(lx, ly, lr, 0, 7); ctx.fillStyle = "#0b0c10"; ctx.fill();
  ctx.beginPath(); ctx.arc(lx - lr * .2, ly - lr * .3, lr * .25, 0, 7); ctx.fillStyle = "#1a1e2c"; ctx.fill();
  rrect(ctx, -w / 2 + .5, -h / 2 + .5, w - 1, h - 1, R); ctx.strokeStyle = "rgba(255,255,255,.22)"; ctx.lineWidth = Math.max(1, w * .006); ctx.stroke();
}

function shadowSprite(w, h, blur) {
  const pad = blur * 3 + 4;
  const c = canvas(w + pad * 2, h + pad * 2), x = c.getContext("2d");
  x.shadowColor = "rgba(0,0,0,1)"; x.shadowBlur = blur; x.shadowOffsetX = c.width;
  rrect(x, pad - c.width, pad, w, h, CORNER * w); x.fillStyle = "#000"; x.fill();
  return { c, pad };
}

export class Phone {
  constructor(img, meta, ph) {
    this.img = img; this.meta = meta;
    this.h = ph; this.w = ph * (meta.w / meta.h);
    this.metal = meta.metal;
    this.shadows = [2, 10, 22].map(b => shadowSprite(this.w, this.h, b * ph / 400));
    Object.assign(this, { home: [0, 0], angle: 0, size: 1, reveal: false, landsBack: false, start: [0, 0], arc: [0, 0],
      spin: 1, flips: 1, tIn: 0, tLand: 1, tReveal: 99, side: 1, glare: null });
  }
}

function drawPhone(ctx, p, x, y, scale, rot, flip, z, op, W, tint) {
  const c = Math.cos(flip), ac = Math.abs(c), front = c >= 0;
  const w = p.w * scale, h = p.h * scale;
  const zz = clamp(z, 0, 1);
  // shadow: tight when it lies flat, big and soft in the air
  const si = zz < .33 ? 0 : zz < .66 ? 1 : 2, sh = p.shadows[si];
  ctx.save();
  ctx.globalAlpha = op * .42 * (1 - .55 * zz);
  ctx.translate(x + W * (.006 + .03 * zz), y + W * (.010 + .045 * zz));
  ctx.rotate(-rot * Math.PI / 180);
  ctx.scale(scale * Math.max(ac, .12), scale);
  ctx.drawImage(sh.c, -p.w / 2 - sh.pad, -p.h / 2 - sh.pad);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = op;
  ctx.translate(x, y);
  ctx.rotate(-rot * Math.PI / 180);
  const t = THICKNESS * p.w * scale * Math.abs(Math.sin(flip));
  if (t >= 1.5) {                                   // the side of the phone
    const lead = Math.sin(flip) * c > 0 ? 1 : -1;
    ctx.fillStyle = shade(p.metal, -.3);
    rrect(ctx, -w * ac / 2 + (lead > 0 ? 0 : -t), -h / 2, w * ac + t, h, Math.min((w * ac + t) / 2, CORNER * w));
    ctx.fill();
  }
  ctx.scale(Math.max(ac, .02), 1);
  if (front) drawFront(ctx, w, h, p.metal, p.glare, rot, flip, x / W);
  else ctx.drawImage(p.img, -w / 2, -h / 2, w, h);
  if (ac < .999) {                                 // turning away from the light
    rrect(ctx, -w / 2, -h / 2, w, h, CORNER * w);
    ctx.fillStyle = `rgba(0,0,0,${(1 - ac) * .45})`; ctx.fill();
  }
  ctx.restore();
}

// ------------------------------------------------------------ where the phones land

function stage(st, W, H) {
  const ar = W / H, wide = ar >= 1.3, tall = ar < .85, pos = st.text_pos;
  let cx, cy, sw, sh, ph;
  if (tall) { cx = .5; cy = { "bottom-left": .40, center: .52 }[pos] ?? .60; sw = .82; sh = .40; ph = .34; }
  else if (wide) {
    [cx, cy] = { "middle-left": [.66, .52], "bottom-left": [.56, .42], center: [.5, .54], "top-center": [.5, .66], "top-right": [.44, .62] }[pos] || [.5, .62];
    sw = pos === "middle-left" ? .56 : .76; sh = .44; ph = .80;
  } else {
    [cx, cy] = { "middle-left": [.62, .56], "bottom-left": [.55, .45], "top-right": [.45, .62] }[pos] || [.5, .62];
    sw = .78; sh = .42; ph = ar < 1 ? .5 : .56;
  }
  return { cx: cx * W, cy: cy * H, hw: sw * W / 2, hh: sh * H / 2, ph: ph * H * (st.phone_scale || 1) };
}

function arrangement(name, n, r, tall) {
  if (tall && ["row", "cascade", "staircase"].includes(name) && n >= 3) name = "grid";
  const lin = (a, b) => n > 1 ? Array.from({ length: n }, (_, i) => a + (b - a) * i / (n - 1)) : [(a + b) / 2];
  const out = [];
  const add = (x, y, a, s = 1) => out.push([x, y, a, s]);
  switch (name) {
    case "row": lin(-1, 1).forEach((x, i) => add(x, i % 2 ? .12 : -.06, (i % 2 ? 1 : -1) * r.uniform(6, 22))); break;
    case "fan": { const as = lin(-26, 26); lin(-.85, .85).forEach((x, i) => add(x, .45 * x * x - .08, -as[i])); break; }
    case "pile": for (let i = 0; i < n; i++) add(r.uniform(-.55, .55), r.uniform(-.35, .35), r.uniform(-45, 45), r.uniform(.9, 1.04)); break;
    case "diagonal": { const d = r() < .5 ? -1 : 1, a = d * r.uniform(16, 30); lin(-1, 1).forEach(x => add(.92 * x, -.5 * x * d, a)); break; }
    case "arc": lin(-.95, .95).forEach(x => add(x, -.3 + .55 * x * x, -x * 24, .96)); break;
    case "grid": {
      const cols = tall ? 2 : Math.max(2, Math.ceil(n / 2)), rows = Math.ceil(n / cols);
      for (let i = 0; i < n; i++) {
        const rr = Math.floor(i / cols), cc = i % cols;
        add(cols === 1 ? 0 : lerp(-.8, .8, cc / (cols - 1)), (rows === 1 ? 0 : lerp(-.75, .75, rr / (rows - 1))) * (tall ? 1 : .62), r.uniform(-7, 7), tall ? 1 : (rows > 1 ? .55 : .8));
      }
      break;
    }
    case "hero": {
      add(.05, 0, r.uniform(-8, 8), 1.22);
      const k = Math.max(1, n - 1);
      for (let i = 1; i < n; i++) {
        const th = k > 1 ? Math.PI * (.15 + 1.7 * (i - 1) / (k - 1)) : Math.PI * .9;
        add(.85 * Math.cos(th), .55 * Math.sin(th) * (i % 2 ? -1 : 1), r.uniform(-28, 28), .72);
      }
      break;
    }
    case "cascade": { const a = r.uniform(-14, 14), ys = lin(.22, -.22); lin(-.75, .75).forEach((x, i) => add(x, ys[i], a)); break; }
    case "tower": { const a = r.uniform(-10, 10); lin(-.35, .35).forEach((y, i) => add((i % 2 ? .12 : -.12), y, a + (i % 2 ? 8 : -8), .8)); break; }
    case "spiral": for (let i = 0; i < n; i++) { const th = i * 2.1 + r.uniform(0, .4), rad = .15 + .6 * i / Math.max(1, n - 1); add(Math.cos(th) * rad, Math.sin(th) * rad * .8, th * 57.3 % 60 - 30, 1 - .08 * i); } break;
    case "vee": lin(-.9, .9).forEach(x => add(x, .55 - Math.abs(x) * .8, -x * 18)); break;
    case "ring": for (let i = 0; i < n; i++) { const th = i / n * Math.PI * 2 - Math.PI / 2; add(Math.cos(th) * .7, Math.sin(th) * .75, -th * 57.3 + 90, .78); } break;
    case "staircase": lin(-.8, .8).forEach((x, i) => add(x, .35 - i * .7 / Math.max(1, n - 1), 0, .9)); break;
    case "crossed": for (let i = 0; i < n; i++) add((i - (n - 1) / 2) * .28, (i % 2 ? .08 : -.08), i % 2 ? 32 : -32, 1); break;
    case "giants": for (let i = 0; i < n; i++) add(lerp(-1.15, 1.15, n > 1 ? i / (n - 1) : .5), r.uniform(-.1, .25), r.uniform(-30, 30), 1.35); break;
    case "pairs": for (let i = 0; i < n; i++) { const g = Math.floor(i / 2), ng = Math.ceil(n / 2); add(lerp(-.7, .7, ng > 1 ? g / (ng - 1) : .5) + (i % 2 ? .12 : -.12), i % 2 ? .08 : -.05, i % 2 ? 12 : -12, .95); } break;
    default: return arrangement("row", n, r, tall);
  }
  return out;
}

/** The four corners of a phone where it comes to rest, a little generous for its
 *  shadow and for the pop of a phone that turns over after it lands. */
function landedOutline(p) {
  const g = p.reveal ? 1.06 : 1.02, hw = p.w * p.size * g / 2, hh = p.h * p.size * g / 2;
  const th = -p.angle * Math.PI / 180, c = Math.cos(th), s = Math.sin(th);
  return [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([x, y]) => [p.home[0] + x * c - y * s, p.home[1] + x * s + y * c]);
}

// How far each camera has pushed in by the time the number is on screen (from about
// one second in); the phones it draws bigger must still clear the number.
const SETTLE_ZOOM = { push_in: 1.05, push_out: 1.07, still: 1, drift: 1.06, punch: 1.02, tilt: 1.06, whip_in: 1.04, handheld: 1.06 };
const settleZoom = st => (SETTLE_ZOOM[st.camera] ?? 1.08) * (st.urgency === "beat_pump" ? 1.023 : 1);
const onCamera = (P, W, H, z) => P.map(([x, y]) => [W / 2 + (x - W / 2) * z, H / 2 + (y - H / 2) * z]);
// The phones may stand no smaller than this to make room for the number.
const MIN_FIT = .45;

/** Whether a convex outline and an upright box overlap (separating axes). */
function hitsRect(P, r) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  if (x1 <= r[0] || x0 >= r[2] || y1 <= r[1] || y0 >= r[3]) return false;
  const rc = [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]];
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length], nx = b[1] - a[1], ny = a[0] - b[0];
    let p0 = Infinity, p1 = -Infinity, q0 = Infinity, q1 = -Infinity;
    for (const q of P) { const d = q[0] * nx + q[1] * ny; p0 = Math.min(p0, d); p1 = Math.max(p1, d); }
    for (const q of rc) { const d = q[0] * nx + q[1] * ny; q0 = Math.min(q0, d); q1 = Math.max(q1, d); }
    if (p1 <= q0 || q1 <= p0) return false;
  }
  return true;
}

// ------------------------------------------------------------ how they get there

const ENTRY_TIMES = { fly_spin: [1, .12], drop: [.85, .11], conveyor: [1.05, .14], zoom: [.9, .10], orbit: [1.2, .07],
  deal: [.62, .15], pop: [.55, .09], rain: [.7, .07], boomerang: [1.1, .1], split: [.8, .05], spiral_in: [1.15, .08], whip: [.45, .1] };

function planEntries(phones, st, W, H, r, stageC) {
  const [dur, stag] = ENTRY_TIMES[st.entry] || ENTRY_TIMES.fly_spin;
  const dirs = ["left", "right", "top", "bottom", "top-left", "top-right", "bottom-left", "bottom-right"];
  const side = r() < .5 ? -1 : 1;
  let order = phones.map((_, i) => i);
  if (st.arrangement === "hero") order = order.slice(1).concat(order.slice(0, 1));
  order.forEach((i, k) => {
    const p = phones[i];
    // The first 3 seconds decide whether anyone watches: phones are already in
    // the air at frame 0 and land fast. A hook line owns the first second.
    const lead = ["hook_line", "word_beat"].includes(st.hook) ? .5 : st.hook === "crash_zoom" ? .22 : st.hook === "punch_in" ? -.7 : -.45;
    p.tIn = lead + k * stag * .75; p.tLand = p.tIn + dur * .85;
    if (st.hook === "flash_cut") { p.tIn = p.tLand = Math.max(0, k - 1) * .15; p.flashIn = k > 1; p.landsBack = true; p.reveal = false; }   // two are there at frame 0, backs up
    p.spin = r.pick([-2, -1, 1, 2]) * (r() < .2 ? 1.5 : 1); p.flips = r.pick([1, 2]);
    const far = Math.max(p.h * p.size, H * .4);
    const [hx, hy] = p.home;
    const sides = { left: [-far, hy], right: [W + far, hy], top: [hx, -far], bottom: [hx, H + far],
      "top-left": [-far, -far], "top-right": [W + far, -far], "bottom-left": [-far, H + far], "bottom-right": [W + far, H + far] };
    switch (st.entry) {
      case "fly_spin": case "boomerang": {
        p.start = sides[r.pick(dirs)];
        const mid = [(p.start[0] + hx) / 2, (p.start[1] + hy) / 2], bend = r.uniform(-.25, .25) * H;
        p.arc = [mid[0] + bend * .5, mid[1] - Math.abs(bend)];
        break;
      }
      case "drop": case "rain": p.start = [hx + r.uniform(-.05, .05) * W, -far]; break;
      case "conveyor": p.start = [side < 0 ? -far : W + far, hy]; break;
      case "whip": p.start = [(k % 2 ? -1 : 1) * side < 0 ? -far : W + far, hy]; break;
      case "zoom": case "pop": p.start = [hx, hy]; break;
      case "orbit": case "split": case "spiral_in": p.start = [stageC[0], stageC[1]]; break;
      case "deal": p.start = [W / 2, H + far]; p.arc = [(W / 2 + hx) / 2, (H + hy) / 2 + H * .1]; break;
      default: p.start = sides.left;
    }
    p.side = side;
    if (st.hook === "crash_zoom" && k === order.length - 1) {     // the last to land crashes in from the lens
      p.crash = true; p.tIn = -.04; p.tLand = .72; p.crashFrom = [stageC[0], stageC[1]]; p.landsBack = true; p.reveal = false;
    }
  });
  return Math.max(...phones.map(p => p.tLand));
}

function phoneState(p, t, st) {
  if (t < p.tIn) return null;
  const [hx, hy] = p.home, base = p.size;
  if (p.crash && t < p.tLand) {
    const q = (t - p.tIn) / (p.tLand - p.tIn), e = outQuint(q);
    const end = p.landsBack ? Math.PI : 0;
    return [lerp(p.crashFrom[0], hx, e), lerp(p.crashFrom[1], hy, e), base * lerp(3.4, 1, e), p.angle + 28 * (1 - e), Math.PI, .9 * (1 - e), 1];
  }
  if (t < p.tLand) {
    const q = (t - p.tIn) / (p.tLand - p.tIn), e = outCubic(q), z = 1 - e;
    // A phone that LANDS on its back ends every turn at pi; one with no spin of
    // its own still turns once on the way, so the front flashes past.
    const end = p.landsBack ? Math.PI : 0, turn = end ? Math.PI * (1 - e) : 0;
    const spinsFlip = end + 2 * Math.PI * p.flips * (1 - e);
    switch (st.entry) {
      case "fly_spin": case "deal": {
        const x = (1 - e) ** 2 * p.start[0] + 2 * (1 - e) * e * p.arc[0] + e * e * hx;
        const y = (1 - e) ** 2 * p.start[1] + 2 * (1 - e) * e * p.arc[1] + e * e * hy;
        return [x, y, base * (1 + .25 * z), p.angle + p.spin * 360 * (1 - e) * (st.entry === "deal" ? .6 : 1),
          st.entry === "deal" ? end + turn : spinsFlip, z, 1];
      }
      case "boomerang": {
        const e2 = outBack(q, 2.2);
        const x = lerp(p.start[0], hx, e2), y = lerp(p.start[1], hy, e2);
        return [x, y, base * (1 + .2 * z), p.angle + p.spin * 300 * (1 - e), spinsFlip, z, 1];
      }
      case "drop": case "rain": {
        const b = outBounce(q);
        const rot = p.angle + p.spin * (st.entry === "rain" ? 120 : 30) * (1 - e);
        return [lerp(p.start[0], hx, outCubic(q)), lerp(p.start[1], hy, b), base * (1 + .18 * (1 - outCubic(q))), rot, end + turn, .6 * (1 - b), 1];
      }
      case "conveyor": case "whip": {
        const e2 = st.entry === "whip" ? outQuint(q) : outQuint(q);
        return [lerp(p.start[0], hx, e2), hy, base, p.angle + p.side * 35 * (1 - e), end + (p.flips > 1 ? 2 * Math.PI * (1 - e) : turn), .25 * z, 1];
      }
      case "zoom": return [hx, hy, base * (1 + 2.4 * (1 - e) ** 2), p.angle + p.spin * 90 * (1 - e), end + turn, z, clamp(q * 3.5)];
      case "pop": { const s = outElastic(q); return [hx, hy, base * Math.max(.01, s), p.angle + p.spin * 40 * (1 - e), end + turn, .4 * z, clamp(q * 5)]; }
      case "orbit": case "spiral_in": {
        const [cx, cy] = p.start, dir = p.spin > 0 ? 1 : -1;
        const ang = (1 - e) * Math.PI * (st.entry === "spiral_in" ? 3 : 1.6) * dir;
        const k = st.entry === "spiral_in" ? 1 + 1.4 * (1 - e) : e;
        const dx = (hx - cx) * k, dy = (hy - cy) * k;
        return [cx + dx * Math.cos(ang) - dy * Math.sin(ang), cy + dx * Math.sin(ang) + dy * Math.cos(ang),
          base * (.35 + .65 * e), p.angle + 360 * (1 - e) * dir, spinsFlip, .5 * z, clamp(q * 4)];
      }
      case "split": {
        const e2 = outBack(q, 1.4);
        return [lerp(p.start[0], hx, e2), lerp(p.start[1], hy, e2), base * (.6 + .4 * e), p.angle * e, end + turn, .3 * z, clamp(q * 4)];
      }
    }
  }
  let s = base;
  const land = t - p.tLand;
  if (land < .2) s *= 1 - .035 * Math.sin(Math.PI * land / .2);
  let flip = p.landsBack ? Math.PI : 0, z = 0, rot = p.angle;
  if (p.reveal && t >= p.tReveal) {
    const q = prog(t, p.tReveal, .5);
    flip = Math.PI * inOut(q); z = .35 * Math.sin(Math.PI * q); rot = p.angle + 8 * Math.sin(Math.PI * q);
    s *= 1 + .25 * z;
    const after = t - (p.tReveal + .5);
    if (after > 0 && after < .18) s *= 1 - .02 * Math.sin(Math.PI * after / .18);
  }
  return [hx, hy, s, rot, flip, z, 1];
}

// ------------------------------------------------------------ type

export const FONT_FILES_BASE = "../assets/fonts/";

export async function loadFonts(names) {
  const want = [...new Set(names)].filter(n => FONTS[n]);
  await Promise.all(want.map(async n => {
    const [fam, wt, file] = FONTS[n];
    if ([...document.fonts].some(f => f.family.replace(/"/g, "") === fam && String(f.weight).includes(String(wt)) && f.status === "loaded")) return;
    try {
      const face = new FontFace(fam, `url(${FONT_FILES_BASE}${file})`, { weight: String(wt).includes(" ") ? wt : String(wt) });
      await face.load(); document.fonts.add(face);
    } catch (e) { /* the family falls back; the layout still fits */ }
  }));
}

/** Every face one look draws with: headline, number, the signs' own lettering and the starburst. */
export function fontsFor(st) {
  const f = [st.font, st.number_font === "same" ? st.font : st.number_font, "oswald"];
  if ((st.decor || []).includes("starburst")) f.push(burstFontFor(st));
  return [...new Set(f)].filter(n => FONTS[n]);
}

export const fontCss = (name, size) => { const [fam, wt] = FONTS[name] || FONTS.franklin; return `${wt} ${Math.round(size)}px "${fam}", "Arial Black", sans-serif`; };

const KEEP_UPPER = new Set(["LA", "OC", "SF", "NYC", "USA", "IE", "SGV", "DTLA", "LB", "SD"]);
export function applyCase(text, cs) {
  let out = cs === "upper" ? text.toUpperCase() : text.split(/\s+/).map(w => !w ? w
    : KEEP_UPPER.has(w.replace(/[^A-Za-z]/g, "").toUpperCase()) && w === w.toUpperCase() ? w : w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  if (cs !== "upper") out = out.replace(/\bIphone/g, "iPhone").replace(/\bIpad/g, "iPad").replace(/\bMacbook/g, "MacBook");
  return out;
}

export function splitLines(text, n) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return [text];
  if (n == null) { if (words.length === 2) return words; n = words.length < 5 ? 2 : 3; }
  n = Math.max(1, Math.min(n, words.length));
  if (n === 1) return [words.join(" ")];
  let best = null;
  const rec = (start, parts) => {
    if (parts.length === n - 1) {
      const all = parts.concat([words.slice(start).join(" ")]);
      const lens = all.map(s => s.length), m = Math.max(...lens);
      const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
      const cost = m * 10 + Math.sqrt(lens.reduce((a, b) => a + (b - mean) ** 2, 0) / lens.length);
      if (!best || cost < best[0]) best = [cost, all];
      return;
    }
    for (let i = start + 1; i <= words.length - (n - 1 - parts.length); i++) rec(i, parts.concat([words.slice(start, i).join(" ")]));
  };
  rec(0, []);
  return best[1];
}

export function formatNumber(num, fmt) {
  const d = String(num || "").replace(/\D/g, "");
  if (d.length !== 10) return String(num || "").trim();
  const a = d.slice(0, 3), b = d.slice(3, 6), c = d.slice(6);
  return { raw: d, dashed: `${a}-${b}-${c}`, dotted: `${a}.${b}.${c}`, parens: `(${a}) ${b}-${c}`, spaced: `${a} ${b} ${c}` }[fmt] || d;
}

/** Characters set in a face with one treatment, on their own canvas.
 *  colors[i] colours char i. Returns {c, pad, inkW, xs, asc, desc}. */
export function inkSprite(chars, colors, fontName, size, tracking, fx, p, skew = 0, withSkew = true) {
  const m0 = canvas(4, 4).getContext("2d");
  m0.font = fontCss(fontName, size);
  const xs = []; let x = 0;
  for (const ch of chars) { xs.push(x); x += m0.measureText(ch).width + tracking * size; }
  const inkW = Math.max(1, x - tracking * size);
  const mH = m0.measureText("HÉgy");
  const asc = mH.fontBoundingBoxAscent || mH.actualBoundingBoxAscent || size * .8;
  const desc = mH.fontBoundingBoxDescent || size * .22;
  const pad = Math.ceil(size * .5);
  const H = Math.ceil(asc + desc + pad * 2);
  const sk = withSkew && skew ? Math.tan(skew * Math.PI / 180) : 0;
  const extra = Math.ceil(Math.abs(sk) * H);
  const c = canvas(inkW + pad * 2 + extra, H), ctx = c.getContext("2d");
  if (sk) ctx.setTransform(1, 0, -sk, 1, sk > 0 ? sk * H : 0, 0);
  ctx.font = fontCss(fontName, size); ctx.textBaseline = "alphabetic"; ctx.lineJoin = "round"; ctx.miterLimit = 2;
  const by = pad + asc;
  const ink = p.ink, darkInk = lum(ink) < .5;
  const shadowCol = darkInk ? "rgba(255,255,255,.45)" : "rgba(8,6,4,.55)";
  const each = (fn) => chars.split("").forEach((ch, i) => { if (ch !== " ") fn(ch, pad + xs[i], by, colors[i] || ink, i); });
  const fillAll = (style) => each((ch, cx, cy, col) => { ctx.fillStyle = style || col; ctx.fillText(ch, cx, cy); });
  const strokeAll = (style, lw) => { ctx.lineWidth = lw; each((ch, cx, cy, col) => { ctx.strokeStyle = style || col; ctx.strokeText(ch, cx, cy); }); };
  const noShadow = () => { ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; };
  let accent = p.accent;
  if (Math.abs(lum(accent) - lum(ink)) < .18) accent = darkInk ? "#ffffff" : shade(p.ground, -.5);
  switch (fx) {
    case "shadow":
      ctx.shadowColor = shadowCol; ctx.shadowBlur = size * .13; ctx.shadowOffsetY = size * .045; fillAll(); break;
    case "hard_shadow": {
      const d = Math.max(2, size * .06); ctx.save(); ctx.translate(d, d);
      each((ch, cx, cy, c0) => { ctx.fillStyle = Math.abs(lum(c0) - lum(accent)) < .2 ? shade(c0, lum(c0) > .5 ? -.62 : .55) : accent; ctx.fillText(ch, cx, cy); });
      ctx.restore(); fillAll(); break;
    }
    case "outline":
      ctx.shadowColor = shadowCol; ctx.shadowBlur = size * .08; strokeAll(null, Math.max(2, size * .05)); break;
    case "sticker": {
      const plate = darkInk ? "#ffffff" : (Math.abs(lum(p.plate) - lum(ink)) < .25 ? "#111111" : p.plate);
      const plateFor = c0 => Math.abs(lum(c0) - lum(plate)) < .22 ? (lum(c0) > .5 ? "#111111" : "#ffffff") : plate;
      ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = size * .1; ctx.shadowOffsetY = size * .04;
      ctx.lineWidth = size * .24; each((ch, cx, cy, c0) => { ctx.strokeStyle = plateFor(c0); ctx.strokeText(ch, cx, cy); });
      noShadow(); fillAll(); break;
    }
    case "extrude": {
      const depth = Math.max(3, Math.round(size * .08));
      const col = Math.abs(lum(accent) - lum(ink)) < .2 ? shade(ink, darkInk ? .6 : -.65) : accent;
      const depthFor = c0 => Math.abs(lum(c0) - lum(col)) < .2 ? shade(c0, lum(c0) > .5 ? -.62 : .55) : col;
      ctx.shadowColor = "rgba(0,0,0,.3)"; ctx.shadowBlur = size * .08; ctx.shadowOffsetY = size * .03;
      for (let k = depth; k >= 1; k--) {
        ctx.save(); ctx.translate(k, k); each((ch, cx, cy, c0) => { ctx.fillStyle = depthFor(c0); ctx.fillText(ch, cx, cy); }); ctx.restore();
        if (k === depth) noShadow();
      }
      fillAll(); break;
    }
    case "glow": {
      const g = darkInk ? "#ffffff" : accent;
      const haloFor = c0 => Math.abs(lum(c0) - lum(g)) < .2 ? shade(c0, lum(c0) > .5 ? -.55 : .5) : g;
      ctx.shadowBlur = size * .38;
      for (let pass = 0; pass < 2; pass++) each((ch, cx, cy, c0) => { ctx.shadowColor = rgba(haloFor(c0), .9); ctx.fillStyle = c0; ctx.fillText(ch, cx, cy); });
      break;
    }
    case "neon": {
      const g = lum(accent) > .35 ? accent : "#7cf5ff";
      ctx.shadowColor = g; ctx.shadowBlur = size * .3; strokeAll(g, size * .06); strokeAll(g, size * .06);
      noShadow(); strokeAll("#ffffff", size * .022); break;
    }
    case "gradient": {
      const g2 = ctx.createLinearGradient(0, pad, 0, pad + asc);
      g2.addColorStop(0, ink); g2.addColorStop(1, lum(accent) > .35 && !darkInk ? accent : mix(ink, p.ground, .35));
      ctx.shadowColor = shadowCol; ctx.shadowBlur = size * .1; ctx.shadowOffsetY = size * .04; fillAll(g2); break;
    }
    case "chrome": {
      const g3 = ctx.createLinearGradient(0, pad, 0, pad + asc);
      [[0, "#ffffff"], [.42, "#c7ccd4"], [.5, "#6b7280"], [.58, "#e5e7eb"], [1, "#9ca3af"]].forEach(([o, c2]) => g3.addColorStop(o, c2));
      ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = size * .08; ctx.shadowOffsetY = size * .04;
      strokeAll("#111418", size * .07); noShadow(); fillAll(g3); break;
    }
    case "gold": {
      const g4 = ctx.createLinearGradient(0, pad, 0, pad + asc);
      [[0, "#fff6c8"], [.38, "#f5c542"], [.5, "#9a6b12"], [.6, "#f7d774"], [1, "#b8860b"]].forEach(([o, c2]) => g4.addColorStop(o, c2));
      ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = size * .08; ctx.shadowOffsetY = size * .04;
      strokeAll("#2a1a00", size * .07); noShadow(); fillAll(g4); break;
    }
    case "long_shadow": {
      const L = Math.round(size * .35), col = shade(p.ground, -.45);
      for (let k = L; k >= 1; k -= 1) { ctx.save(); ctx.translate(k, k); fillAll(col); ctx.restore(); }
      fillAll(); break;
    }
    case "highlighter": {
      const barCol = lum(p.accent) > .45 ? p.accent : (darkInk ? "#fff176" : p.plate);
      ctx.save(); ctx.globalAlpha = .92; ctx.fillStyle = barCol;
      // the marker covers the whole letter: dark type half on the bar and half on a dark scene loses its top
      ctx.beginPath(); ctx.moveTo(pad - size * .1, by - asc * .9); ctx.lineTo(pad + inkW + size * .12, by - asc * .96);
      ctx.lineTo(pad + inkW + size * .08, by + desc * .35); ctx.lineTo(pad - size * .14, by + desc * .45); ctx.closePath(); ctx.fill(); ctx.restore();
      each((ch, cx, cy, c0) => { ctx.fillStyle = Math.abs(lum(c0) - lum(barCol)) < .3 ? (lum(barCol) > .5 ? "#111111" : "#ffffff") : c0; ctx.fillText(ch, cx, cy); });
      break;
    }
    case "double_outline": {
      strokeAll(lum(accent) > .35 ? accent : "#ffffff", size * .26);
      strokeAll(p.ground, size * .14); fillAll(); break;
    }
    case "rgb_split": {
      const d = Math.max(2, size * .035);
      ctx.globalCompositeOperation = "lighter";
      ctx.save(); ctx.translate(-d, 0); fillAll("rgba(0,229,255,.85)"); ctx.restore();
      ctx.save(); ctx.translate(d, 0); fillAll("rgba(255,45,85,.85)"); ctx.restore();
      ctx.globalCompositeOperation = "source-over"; fillAll(); break;
    }
    case "cutout": {
      const plateCol = lum(p.ground) > .45 ? "#111111" : "#ffffff";   // the letters show the ground, so the plate is its opposite
      rrect(ctx, pad - size * .18, pad + asc * .05, inkW + size * .36, asc * .98 + desc * .4, size * .08);
      ctx.fillStyle = plateCol; ctx.fill();
      ctx.globalCompositeOperation = "destination-out"; fillAll("#000"); ctx.globalCompositeOperation = "source-over"; break;
    }
    default: fillAll();
  }
  return { c, pad, inkW, xs, asc, desc, extra };
}

class Line {
  constructor(text, colors, st, p, size, letters) {
    this.text = text;
    const sp = inkSprite(text, colors, st.font, size, st.tracking, st.text_fx, p, st.skew);
    Object.assign(this, sp);
    this.glyphs = [];
    if (letters) {
      text.split("").forEach((ch, i) => {
        if (ch === " ") return;
        const g = inkSprite(ch, [colors[i]], st.font, size, 0, st.text_fx, p, st.skew);
        this.glyphs.push({ c: g.c, x: this.xs[i] + this.pad - g.pad, ch, col: colors[i] });
      });
    }
    this.plate = null;
    if (st.text_fx === "box") {
      const px = size * .22, py = size * .07;
      const w = this.inkW + px * 2, h = this.asc * .92 + py * 2;
      const pc = canvas(w + Math.abs(Math.tan(st.skew * Math.PI / 180)) * h + 2, h), x = pc.getContext("2d");
      const sk = Math.tan(st.skew * Math.PI / 180);
      if (sk) x.setTransform(1, 0, -sk, 1, sk > 0 ? sk * h : 0, 0);
      rrect(x, 0, 0, w, h, size * .08); x.fillStyle = p.plate; x.fill();
      this.plate = pc; this.plateOff = [this.pad - px, this.pad + this.asc * .06 - py];
    }
  }
}

function headlineLines(st, p, size, nLines) {
  const text = applyCase(st.headline, st.case);
  const lines = splitLines(text, nLines);
  const ink = st.text_fx === "box" ? p.plate_ink : p.ink;
  const words = text.split(/\s+/);
  const aw = ((st.accent_word % words.length) + words.length) % words.length;
  let wi = 0;
  const letters = ["slide_letters", "drop_letters", "typewriter", "scramble", "spin_letters"].includes(st.text_in);
  return lines.map((ln, li) => {
    const cols = [];
    ln.split(" ").forEach(wd => {
      let col = ink;
      if (st.color_mode === "split_lines") col = li % 2 ? p.accent : ink;
      else if (st.color_mode === "accent_line") col = li === lines.length - 1 ? p.accent : ink;
      else if (st.color_mode === "accent_word" && wi === aw && st.text_fx !== "box") col = p.accent;
      if (st.text_fx === "box" && Math.abs(lum(col) - lum(p.plate)) < .25) col = lum(p.plate) > .5 ? "#111111" : "#ffffff";   // never the colour of its own box
      for (let k = 0; k < wd.length; k++) cols.push(col);
      cols.push(col); wi++;
    });
    return new Line(ln, cols.slice(0, ln.length), st, p, size, letters);
  });
}

/** A speech-bubble badge (TEXT NOW) that points at the number. */
function ctaBadge(text, size, hot) {
  const ink = lum(hot) > .55 ? "#111111" : "#ffffff";
  const fs = Math.max(12, size * .4);
  const sp = inkSprite(text, text.split("").map(() => ink), "oswald", fs, .05, "flat", { ink, accent: ink, ground: hot, plate: hot, plate_ink: ink }, 0);
  const px = fs * .6, py = fs * .26, w = sp.inkW + px * 2, h = sp.asc * .92 + py * 2, tail = h * .34;
  const c = canvas(w + 12, h + tail + 12), x = c.getContext("2d");
  x.translate(6, 4);
  x.save(); x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = fs * .3; x.shadowOffsetY = fs * .1;
  rrect(x, 0, 0, w, h, h / 2); x.fillStyle = hot; x.fill();
  x.beginPath(); x.moveTo(w / 2 - tail * .75, h - 2); x.lineTo(w / 2, h + tail); x.lineTo(w / 2 + tail * .75, h - 2); x.closePath(); x.fill();
  x.restore();
  x.drawImage(sp.c, px - sp.pad, py - sp.pad - sp.asc * .04);
  return trim(c);
}

function numberSprite(st, p, size, cta) {
  const text = formatNumber(st.number, st.number_format) || "YOUR NUMBER";
  let font = st.number_font === "same" ? st.font : st.number_font;
  if (FINE_FACES.has(font) || !FONTS[font]) font = "oswald";
  const style = st.number_style;
  const fxFor = { plain: ["hard_shadow", "extrude", "glow", "chrome", "gold", "neon", "long_shadow"].includes(st.text_fx) ? st.text_fx : "shadow",
    sticker: "sticker", outline: "shadow", underline: "shadow", neon: "neon", chrome: "chrome", gold: "gold", split: "shadow", stacked: "flat" };
  const fx = fxFor[style] || "flat";
  const onPlate = ["pill", "box", "ticket", "tag", "stacked"].includes(style);
  const col = onPlate ? p.plate_ink : p.ink;
  let colors = text.split("").map(() => col);
  if (style === "split") { const cut = text.search(/\d{3}\D*\d/) >= 0 ? text.replace(/\D/g, "").length === 10 ? text.length - 8 : 3 : 3; colors = text.split("").map((_, i) => i < cut ? (lum(p.accent) > .35 ? p.accent : "#ffffff") : col); }
  const sp = inkSprite(text, colors, font, size, st.tracking * .5, fx, p, 0);
  const bodyH = sp.asc + sp.desc;
  let out;
  if (onPlate || style === "outline") {
    const px = size * .45, py = size * .14;
    const W = sp.inkW + px * 2, H = sp.asc * .95 + py * 2;
    const c = canvas(W + 24, H + 24), x = c.getContext("2d");
    x.translate(6, 6);
    const r = style === "pill" ? H / 2 : size * .1;
    if (style === "outline") {
      rrect(x, 3, 3, W, H, r); x.strokeStyle = p.ink; x.lineWidth = Math.max(3, size * .06); x.stroke();
    } else {
      x.save(); x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = 14; x.shadowOffsetY = 6;
      if (style === "ticket") {
        rrect(x, 3, 3, W, H, size * .06); x.fillStyle = p.plate; x.fill(); x.restore();
        x.globalCompositeOperation = "destination-out";
        [3, 3 + W].forEach(cx => { x.beginPath(); x.arc(cx, 3 + H / 2, H * .18, 0, 7); x.fill(); });
        x.globalCompositeOperation = "source-over";
        x.setLineDash([size * .06, size * .06]); x.strokeStyle = rgba(p.plate_ink, .5); x.lineWidth = 2;
        x.beginPath(); x.moveTo(3 + W * .06, 3 + H * .14); x.lineTo(3 + W * .06, 3 + H * .86); x.stroke(); x.setLineDash([]);
      } else if (style === "tag") {
        x.beginPath(); x.moveTo(3 + H * .45, 3); x.lineTo(3 + W, 3); x.lineTo(3 + W, 3 + H); x.lineTo(3 + H * .45, 3 + H); x.lineTo(3, 3 + H / 2); x.closePath();
        x.fillStyle = p.plate; x.fill(); x.restore();
        x.beginPath(); x.arc(3 + H * .45, 3 + H / 2, H * .09, 0, 7); x.fillStyle = p.ground; x.fill();
      } else {
        rrect(x, 3, 3, W, H, r); x.fillStyle = p.plate; x.fill(); x.restore();
      }
    }
    x.drawImage(sp.c, 3 + px - sp.pad + (style === "tag" ? H * .2 : 0), 3 + py - sp.pad - sp.asc * .03);
    out = c;
  } else if (style === "underline") {
    const bar = Math.max(4, size * .09);
    const c = canvas(sp.c.width, sp.c.height + bar), x = c.getContext("2d");
    x.drawImage(sp.c, 0, 0);
    let acc = p.accent; if (Math.abs(lum(acc) - lum(p.ground)) < .15) acc = p.ink;
    rrect(x, sp.pad, sp.pad + bodyH * .92, sp.inkW, bar, bar / 2); x.fillStyle = acc; x.fill();
    out = c;
  } else if (style === "neon") {
    const px = size * .3, py = size * .1, W = sp.inkW + px * 2, H = sp.asc * .95 + py * 2;
    const c = canvas(W + 24, H + 24), x = c.getContext("2d");
    rrect(x, 12, 12, W, H, H * .3); x.fillStyle = "rgba(8,6,20,.62)"; x.fill();
    x.drawImage(sp.c, 12 + px - sp.pad, 12 + py - sp.pad - sp.asc * .03);
    out = c;
  } else out = sp.c;
  const trimmed = trim(out);
  let label = null;
  if (cta) return { c: trimmed, label: ctaBadge(applyCase(cta.text, "upper"), size, cta.hot), text, cta: true };
  if (st.number_label) {
    const lt = applyCase(st.number_label, "upper");
    const lsp = inkSprite(lt, lt.split("").map(() => p.ink), font, Math.max(12, size * .34), .08, lum(p.ink) < .5 ? "flat" : "shadow", p, 0);
    label = trim(lsp.c);
  }
  return { c: trimmed, label, text };
}

export function trim(c) {
  const x = c.getContext("2d"), { width: w, height: h } = c;
  const d = x.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y += 1) for (let xx = 0; xx < w; xx += 1) {
    if (d[(y * w + xx) * 4 + 3] > 8) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) return c;
  const o = canvas(x1 - x0 + 1, y1 - y0 + 1);
  o.getContext("2d").drawImage(c, -x0, -y0);
  return o;
}

// ------------------------------------------------------------ backgrounds

function background(st, p, W, H, sc, r) {
  const c = canvas(W, H), x = c.getContext("2d");
  const g = p.ground, l = p.light;
  const [cx, cy] = sc;
  const radial = (k = .75) => { const gr = x.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(W, H) * k); gr.addColorStop(0, l); gr.addColorStop(1, g); return gr; };
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  if (vibeBackground(st.background, x, st, p, W, H, sc, r)) {
    const vg0 = x.createRadialGradient(cx, cy, Math.hypot(W, H) * .35, cx, cy, Math.hypot(W, H) * .8);
    vg0.addColorStop(0, "rgba(0,0,0,0)"); vg0.addColorStop(1, "rgba(0,0,0,.2)"); x.fillStyle = vg0; x.fillRect(0, 0, W, H);
    if (st.grain) { const nc = noiseTile(256, st.seed, 12); x.globalAlpha = .3; x.fillStyle = x.createPattern(nc, "repeat"); x.fillRect(0, 0, W, H); x.globalAlpha = 1; }
    return c;
  }
  switch (st.background) {
    case "flat": break;
    case "linear": { const a = r() * Math.PI, gr = x.createLinearGradient(W / 2 - Math.cos(a) * W / 2, H / 2 - Math.sin(a) * H / 2, W / 2 + Math.cos(a) * W / 2, H / 2 + Math.sin(a) * H / 2); gr.addColorStop(0, g); gr.addColorStop(1, l); x.fillStyle = gr; x.fillRect(0, 0, W, H); break; }
    case "split": {
      x.fillStyle = radial(); x.fillRect(0, 0, W, H);
      const s = r.uniform(-.3, .3) * W, o = r.uniform(-.15, .15) * W;
      x.fillStyle = lum(g) > .35 ? rgba(shade(g, -.2), .9) : rgba(shade(g, .35), .9);
      x.beginPath(); x.moveTo(W / 2 + o - s, 0); x.lineTo(W, 0); x.lineTo(W, H); x.lineTo(W / 2 + o + s, H); x.closePath(); x.fill(); break;
    }
    case "rays": case "sunburst": {
      x.fillStyle = radial(); x.fillRect(0, 0, W, H); break;         // the rays are drawn per frame (they may turn)
    }
    case "dots": {
      x.fillStyle = radial(.8); x.fillRect(0, 0, W, H);
      const step = Math.max(10, W * .018);
      x.fillStyle = rgba(l, .5);
      for (let yy = step / 2; yy < H; yy += step) for (let xx = step / 2; xx < W; xx += step) {
        const d = Math.hypot((xx - cx) / W, (yy - cy) / H), rad = step * .42 * clamp(1 - d / .9, .08, 1);
        x.beginPath(); x.arc(xx, yy, rad, 0, 7); x.fill();
      }
      break;
    }
    case "stripes": {
      const per = W * r.uniform(.03, .06), dir = r() < .5 ? -1 : 1;
      x.fillStyle = mix(g, l, .35); x.save(); x.translate(W / 2, H / 2); x.rotate(dir * Math.PI / 4);
      const L = Math.hypot(W, H);
      for (let s = -L; s < L; s += per) x.fillRect(s, -L, per / 2, 2 * L);
      x.restore(); break;
    }
    case "spotlight": {
      x.fillStyle = shade(g, -.65); x.fillRect(0, 0, W, H);
      const gr = x.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(W, H) * .42); gr.addColorStop(0, l); gr.addColorStop(1, rgba(shade(g, -.65), 0));
      x.fillStyle = gr; x.fillRect(0, 0, W, H); break;
    }
    case "bigword": {
      x.fillStyle = radial(); x.fillRect(0, 0, W, H);
      let size = H * .7; const word = applyCase(st.bigword || "CASH", "upper");
      x.font = fontCss(st.font, size);
      while (x.measureText(word).width > W * 1.15 && size > 40) { size *= .9; x.font = fontCss(st.font, size); }
      x.textAlign = "center"; x.textBaseline = "middle";
      x.fillStyle = lum(g) < .5 ? rgba(l, .45) : rgba(shade(g, -.15), .55); x.fillText(word, W / 2, H * .55); break;
    }
    case "grid": {
      x.fillStyle = radial(.8); x.fillRect(0, 0, W, H);
      const step = Math.max(20, W * .045); x.strokeStyle = lum(g) > .4 ? rgba("#000000", .1) : rgba("#ffffff", .08); x.lineWidth = 2;
      x.beginPath(); for (let xx = 0; xx < W; xx += step) { x.moveTo(xx, 0); x.lineTo(xx, H); } for (let yy = 0; yy < H; yy += step) { x.moveTo(0, yy); x.lineTo(W, yy); } x.stroke(); break;
    }
    case "mesh": {
      const cols = [l, p.accent, shade(g, .25), shade(g, -.25)];
      for (let i = 0; i < 5; i++) {
        const bx = r() * W, by = r() * H, rad = Math.max(W, H) * r.uniform(.35, .7);
        const gr = x.createRadialGradient(bx, by, 0, bx, by, rad); const col = cols[i % cols.length];
        gr.addColorStop(0, rgba(col, i === 1 ? .35 : .7)); gr.addColorStop(1, rgba(col, 0)); x.fillStyle = gr; x.fillRect(0, 0, W, H);
      }
      break;
    }
    case "rings": {
      x.fillStyle = radial(); x.fillRect(0, 0, W, H);
      const step = Math.max(W, H) * .06; x.strokeStyle = rgba(lum(g) > .45 ? "#000000" : "#ffffff", .08); x.lineWidth = step * .35;
      for (let rad = step; rad < Math.hypot(W, H); rad += step) { x.beginPath(); x.arc(cx, cy, rad, 0, 7); x.stroke(); }
      break;
    }
    case "checker": {
      const sq = Math.max(W, H) / r.pick([10, 14, 18]); x.fillStyle = mix(g, l, .3);
      for (let yy = 0; yy < H; yy += sq) for (let xx = 0; xx < W; xx += sq) if (((xx / sq | 0) + (yy / sq | 0)) % 2) x.fillRect(xx, yy, sq, sq);
      const gr = x.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(W, H) * .6); gr.addColorStop(0, rgba(l, .35)); gr.addColorStop(1, rgba(g, 0)); x.fillStyle = gr; x.fillRect(0, 0, W, H); break;
    }
    case "waves": {
      x.fillStyle = radial(); x.fillRect(0, 0, W, H);
      x.strokeStyle = rgba(lum(g) > .45 ? shade(g, -.3) : l, .35); x.lineWidth = Math.max(2, W * .004);
      const amp = H * r.uniform(.02, .05), per = W * r.uniform(.15, .3);
      for (let yy = -amp; yy < H + amp; yy += H * .06) { x.beginPath(); for (let xx = 0; xx <= W; xx += 8) x.lineTo(xx, yy + Math.sin(xx / per * Math.PI * 2 + yy * .01) * amp); x.stroke(); }
      break;
    }
    case "bokeh": {
      x.fillStyle = radial(); x.fillRect(0, 0, W, H);
      for (let i = 0; i < 38; i++) {
        const bx = r() * W, by = r() * H, rad = r.uniform(.02, .09) * W, col = r() < .3 ? p.accent : l;
        const gr = x.createRadialGradient(bx, by, 0, bx, by, rad); gr.addColorStop(0, rgba(col, r.uniform(.12, .32))); gr.addColorStop(.8, rgba(col, .08)); gr.addColorStop(1, rgba(col, 0));
        x.fillStyle = gr; x.beginPath(); x.arc(bx, by, rad, 0, 7); x.fill();
      }
      break;
    }
    case "confetti": {
      x.fillStyle = radial(); x.fillRect(0, 0, W, H);
      const cols = [p.accent, l, shade(g, -.25), "#ffffff"];
      for (let i = 0; i < 140; i++) {
        x.save(); x.translate(r() * W, r() * H); x.rotate(r() * Math.PI); x.fillStyle = rgba(r.pick(cols), .55);
        const s = W * r.uniform(.006, .014); if (r() < .5) x.fillRect(-s, -s / 3, s * 2, s * .66); else { x.beginPath(); x.arc(0, 0, s * .6, 0, 7); x.fill(); }
        x.restore();
      }
      break;
    }
    case "duotone": {
      const gr = x.createLinearGradient(0, 0, W, H); gr.addColorStop(0, g); gr.addColorStop(.5, mix(g, lum(p.accent) > .3 ? p.accent : l, .35)); gr.addColorStop(1, l);
      x.fillStyle = gr; x.fillRect(0, 0, W, H); break;
    }
    case "halftone": {
      x.fillStyle = radial(); x.fillRect(0, 0, W, H);
      const step = Math.max(10, W * .022), corner = r.pick([[0, 0], [W, 0], [0, H], [W, H]]);
      x.fillStyle = rgba(lum(g) > .45 ? shade(g, -.35) : l, .45);
      for (let yy = 0; yy < H; yy += step) for (let xx = 0; xx < W; xx += step) {
        const d = Math.hypot(xx - corner[0], yy - corner[1]) / Math.hypot(W, H);
        const rad = step * .48 * clamp(1 - d * 1.8); if (rad > .5) { x.beginPath(); x.arc(xx, yy, rad, 0, 7); x.fill(); }
      }
      break;
    }
    case "beams": {
      x.fillStyle = shade(g, -.35); x.fillRect(0, 0, W, H);
      for (let i = 0; i < 4; i++) {
        const bx = W * (.15 + .7 * r()), spread = W * r.uniform(.12, .25);
        const gr = x.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, rgba(l, .55)); gr.addColorStop(1, rgba(l, 0));
        x.fillStyle = gr; x.beginPath(); x.moveTo(bx - spread * .15, 0); x.lineTo(bx + spread * .15, 0); x.lineTo(bx + spread, H); x.lineTo(bx - spread, H); x.closePath(); x.fill();
      }
      break;
    }
    case "frame": {
      x.fillStyle = radial(); x.fillRect(0, 0, W, H);
      const m = Math.min(W, H) * .035; x.strokeStyle = lum(p.accent) > .3 ? p.accent : p.ink; x.lineWidth = m * .35;
      rrect(x, m, m, W - 2 * m, H - 2 * m, m * .6); x.stroke(); break;
    }
    case "noise": {
      const gr = x.createLinearGradient(0, 0, W, H); gr.addColorStop(0, shade(g, -.15)); gr.addColorStop(1, l); x.fillStyle = gr; x.fillRect(0, 0, W, H);
      const nc = noiseTile(256, st.seed, 34); x.globalAlpha = .5; x.fillStyle = x.createPattern(nc, "repeat"); x.fillRect(0, 0, W, H); x.globalAlpha = 1; break;
    }
    default: x.fillStyle = radial(); x.fillRect(0, 0, W, H);
  }
  sceneryOver(x, st, p, W, H, r);
  // vignette
  const vg = x.createRadialGradient(cx, cy, Math.hypot(W, H) * .3, cx, cy, Math.hypot(W, H) * .75);
  vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.28)"); x.fillStyle = vg; x.fillRect(0, 0, W, H);
  if (st.grain) { const nc = noiseTile(256, st.seed, 12); x.globalAlpha = .35; x.fillStyle = x.createPattern(nc, "repeat"); x.fillRect(0, 0, W, H); x.globalAlpha = 1; }
  return c;
}

export function noiseTile(n, seed, amp) {
  const c = canvas(n, n), x = c.getContext("2d"), id = x.createImageData(n, n), r = rng(seed * 97 + 5);
  for (let i = 0; i < n * n; i++) { const v = 128 + (r() - .5) * amp * 2; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
  x.putImageData(id, 0, 0);
  const o = canvas(n, n), ox = o.getContext("2d"); ox.globalCompositeOperation = "source-over";
  // keep only the deviation from grey: draw as overlay via soft-light at use time
  ox.drawImage(c, 0, 0);
  const d = ox.getImageData(0, 0, n, n);
  for (let i = 0; i < n * n; i++) { const v = d.data[i * 4] - 128; d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v > 0 ? 255 : 0; d.data[i * 4 + 3] = Math.abs(v) * 2; }
  ox.putImageData(d, 0, 0);
  return o;
}

/** How bright a picture is on average (0 to 1), and how much of it is nearly black. */
function lumStats(c) {
  const s = canvas(24, 24), x = s.getContext("2d", { willReadFrequently: true });
  x.drawImage(c, 0, 0, 24, 24);
  const d = x.getImageData(0, 0, 24, 24).data;
  let t = 0, dark = 0;
  for (let i = 0; i < d.length; i += 4) { const v = .2126 * d[i] + .7152 * d[i + 1] + .0722 * d[i + 2]; t += v; if (v < 48) dark++; }
  const n = d.length / 4;
  return { mean: t / n / 255, dark: dark / n };
}

// ------------------------------------------------------------ the ad

export class Ad {
  /** assets: { phones: {id: {img, meta}} } */
  constructor(style, assets, width, height) {
    this.st = { ...DEFAULT_STYLE, ...style };
    const st = this.st;
    this.W = width || (ASPECTS[st.aspect] || ASPECTS["1:1"])[0];
    this.H = height || (ASPECTS[st.aspect] || ASPECTS["1:1"])[1];
    this.p = pal(st);
    this.boardDef = BOARDS[st.board] || null;
    this.pHead = this.boardDef ? boardPalette(this.boardDef, this.p) : this.p;
    this.decor = new Set(st.decor || []);
    this.hot = hotColour(this.p);
    this.r = rng(st.seed);
    this.assets = assets;
    this._insets();
    this._buildPhones();
    this._layoutType();
    this._numberBelowPhones();
    // how the phones get there is planned from where they finally land (the same draws from this.r as ever)
    this.tLanded = this.phones.length ? planEntries(this.phones, st, this.W, this.H, this.r, this.stageC) : .3;
    this._timeline();
    this._typeTimeline();
    this._buildDecor();
    this.bg = background(st, this.p, this.W, this.H, this.stageC, rng(st.seed + 1));
    const ls = lumStats(this.bg);
    this.bgLum = ls.mean; this.bgDark = ls.dark;
    this._scrim();
    this._contrastGuard();
    this.still = null;
    this.acc = canvas(this.W, this.H); this.tmp = canvas(this.W, this.H);
  }

  /** Room taken off the top of the frame by a shop awning and a ticker. */
  _insets() {
    const W = this.W, H = this.H, tall = W / H < .85;
    this.insetTop = 0; this.awningH = 0; this.tickerH = 0; this.tickerY = 0;
    if (this.decor.has("awning")) { this.awningH = H * (tall ? .07 : .1); this.insetTop += this.awningH; }
    if (this.st.urgency === "ticker") { this.tickerH = Math.max(14, Math.min(W, H) * .062); this.tickerY = this.insetTop; this.insetTop += this.tickerH; }
  }

  /** When the opening hook gives way to the headline. */
  _hookEnd() {
    const st = this.st;
    if (st.hook === "hook_line") return .92;
    if (st.hook === "word_beat") {
      const n = Math.max(1, applyCase(st.hook_text || HOOKS[0], "upper").split(/\s+/).filter(Boolean).length);
      this.hookBeat = clamp(.95 / n, .16, .24);
      return Math.max(.92, n * this.hookBeat + .2);
    }
    return 0;
  }

  _buildPhones() {
    const st = this.st, W = this.W, H = this.H;
    const s = stage(st, W, H);
    this.stageC = [s.cx, s.cy];
    const ids = (st.phones || []).filter(id => this.assets.phones[id]);
    const spots = arrangement(st.arrangement, ids.length, this.r, W / H < .85);
    this.phones = ids.map((id, i) => {
      const a = this.assets.phones[id];
      const p = new Phone(a.img, a.meta, s.ph);
      const [ux, uy, ang, sc] = spots[i];
      p.home = [s.cx + ux * s.hw, s.cy + uy * s.hh]; p.angle = ang; p.size = sc;
      const endsBack = { back: true, front: false, mixed: i % 2 === 0 }[st.end_face] ?? true;
      p.landsBack = endsBack && st.front_glimpse === "spin";
      p.reveal = endsBack && !p.landsBack;
      p.glare = new Glare(rng(st.seed * 101 + i), st.glare);
      return p;
    });
    this.drawOrder = this.phones.map((_, i) => i);
    if (st.arrangement === "hero") this.drawOrder = this.drawOrder.slice(1).concat([0]);
  }

  _timeline() {
    const r0 = this.tLanded + .35; let k = 0;
    for (const i of this.drawOrder) { const p = this.phones[i]; if (p.reveal) p.tReveal = r0 + (k++) * .1; }
    const revealEnd = k ? r0 + (k - 1) * .1 + .5 : this.tLanded;
    const st = this.st;
    // words on screen within a second: the headline starts as the phones arrive, not after the last one lands
    const lands = this.phones.map(p => p.tLand).sort((a, b) => a - b), median = lands.length ? lands[Math.floor(lands.length / 2)] : .3;
    this.hookEnd = this._hookEnd();
    const text = ["hook_line", "word_beat"].includes(st.hook) ? this.hookEnd
      : st.hook === "crash_zoom" ? .42 : Math.max(.3, Math.min(.45, median + .02, revealEnd + .02));
    this.tl = { landed: this.tLanded, revealEnd, text, still: revealEnd + .25 };
  }

  _layoutType() {
    const st = this.st, W = this.W, H = this.H, p = this.p;
    const ar = W / H, wide = ar >= 1.3, tall = ar < .85;
    const m = W * (wide ? .05 : .07);
    const left = ["top-left", "middle-left", "bottom-left"].includes(st.text_pos);
    const maxW = W * (st.text_pos === "middle-left" && wide ? .42 : (left || st.text_pos === "top-right") && wide ? .64 : .88);
    const maxH = H * (wide ? .42 : tall ? .3 : .36);
    let size = H * (wide ? .21 : tall ? .09 : .15) * (st.text_scale || 1);
    // how many lines: whichever lets the type be biggest in the room it has
    const text = applyCase(st.headline, st.case), words = text.split(/\s+/).length;
    const B = this.boardDef, bpad = B ? B.pad : 0, btabs = B ? (B.tabs || 0) : 0;
    const mc = canvas(4, 4).getContext("2d"); mc.font = fontCss(st.font, size);
    let bestN = 2, bestS = 0;
    for (const n of [...new Set([1, 2, 3, 4].map(k => Math.min(words, k)))]) {
      const ls = splitLines(text, n);
      const wid = Math.max(...ls.map(l => mc.measureText(l).width + st.tracking * size * l.length)) + 2 * bpad * size;
      const hgt = size * .82 * (.98 * (ls.length - 1) + 1) + (1.6 * bpad + btabs) * size;
      const s2 = size * Math.min(1, maxW / Math.max(wid, 1), maxH / Math.max(hgt, 1));
      if (s2 > bestS * 1.04) { bestN = n; bestS = s2; }
    }
    const alts = [st.number_pos, ...["under-headline", "bottom-center", "bottom-right", "bottom-left"].filter(x => x !== st.number_pos)];
    let pos = null, lines, lineH, blockH, tag, num, firstFit = null, dropLabel = false;
    for (let attempt = 0; attempt < 18; attempt++) {
      lines = headlineLines(st, this.pHead, size, bestN);
      const gap = size * (["box", "sticker", "highlighter", "cutout", "double_outline"].includes(st.text_fx) ? .14 : B ? .09 : .02);
      lineH = lines[0].asc * .98 + gap;
      const widest = Math.max(...lines.map(L => L.inkW));
      blockH = lineH * (lines.length - 1) + lines[0].asc;
      if (widest + 2 * bpad * size > maxW || blockH + (1.6 * bpad + btabs) * size > maxH) { size *= .93; continue; }
      const ph = this.pHead;
      tag = st.tag ? trim(inkSprite(applyCase(st.tag, "upper"), st.tag.split("").map(() => ph.ink), st.font, size * .26, .12, lum(ph.ink) < .5 ? "flat" : "shadow", ph).c) : null;
      let nSize = Math.min(size * .72, W * (wide ? .075 : .11)) * (st.number_scale || 1);
      const cta = st.urgency === "pulse_cta" ? { text: st.cta || (st.lang === "es" ? "¡MÁNDANOS TEXTO!" : "TEXT NOW"), hot: this.hot } : null;
      num = numberSprite(st, p, nSize, cta);
      while (num.c.width > W - 2 * m && nSize > 12) { nSize *= .92; num = numberSprite(st, p, nSize, cta); }
      if (dropLabel) num = { ...num, label: null };
      // a slot counts only where the phones can make room for the number under them
      for (const np of alts) { st.number_pos = np; pos = this._place(lines, lineH, blockH, tag, num, m, size); if (pos.ok && this._roomUnder(pos, num, size, true)) break; pos.ok = false; }
      if (pos.ok) break;
      if (firstFit == null) firstFit = size;
      if (size < firstFit * .8) {
        // crowded: rather than shrink the type to a whisper, lose the small extras
        // (the label over the number, then the tag) before anything may overlap
        if (num.label) { dropLabel = true; continue; }
        if (tag) { tag = null; st.tag = ""; continue; }
        let placed = false;
        for (const room of ["shown", "under", null]) {  // under the phones in full view, then under them at all, then anywhere
          for (const np of alts) { st.number_pos = np; pos = this._place(lines, lineH, blockH, tag, num, m, size); if (pos.num[1] + num.c.height <= H * .985 && pos.oy >= H * .02 && (!room || this._roomUnder(pos, num, size, room === "shown"))) { placed = true; break; } }
          if (placed) break;
        }
        if (placed) break;
      }
      st.number_pos = alts[0]; size *= .95;
    }
    if (st.urgency === "pulse_cta" && !num.label) st.urgency = "arrows";
    Object.assign(this, { size, lines, lineH, blockH, margin: m, tag, num, pos });
    this.hookLines = null;
    const hookFont = FINE_FACES.has(st.font) ? "oswald" : st.font;     // the opening words must read at a glance
    if (st.hook === "hook_line") {
      const txt = applyCase(st.hook_text || "STILL GOT YOUR OLD IPHONE?", "upper");
      const hp = { ...p, ink: "#ffffff", accent: lum(p.accent) > .45 ? p.accent : "#ffd60a" };
      let hs = H * (wide ? .2 : tall ? .085 : .14);
      const words = txt.split(/\s+/).length;
      for (let k = 0; k < 14; k++) {
        const ls = splitLines(txt, Math.min(words, tall ? 4 : 3));
        const sp = ls.map(l => inkSprite(l, l.split("").map(() => "#ffffff"), hookFont, hs, .01, "shadow", hp, 0));
        const wid = Math.max(...sp.map(s => s.inkW)), hgt = sp.length * sp[0].asc * 1.02;
        if (wid <= W * .86 && hgt <= H * .5) { this.hookLines = sp; break; }
        hs *= .92;
      }
      this.hookSize = hs;
    }
    this.hookWords = false;
    if (st.hook === "word_beat") {
      const words = applyCase(st.hook_text || HOOKS[0], "upper").split(/\s+/).filter(Boolean);
      const cols = ["#ffffff", lum(p.accent) > .45 ? p.accent : "#ffd60a"];
      this.hookLines = words.map((w, i) => {
        let hs = H * (wide ? .3 : tall ? .13 : .22), sp = null;
        for (let k = 0; k < 18; k++) {
          const hp = { ...p, ink: cols[i % 2], accent: cols[i % 2] };
          sp = inkSprite(w, w.split("").map(() => cols[i % 2]), hookFont, hs, .01, "shadow", hp, 0);
          if (sp.inkW <= W * .84 && sp.asc <= H * .36) break;
          hs *= .9;
        }
        return sp;
      });
      this.hookWords = true;
    }
  }

  /** When the words and the number arrive, once the phones' timeline is known. */
  _typeTimeline() {
    const st = this.st, n = this.lines.length;
    this.tl.lines = this.lines.map((_, i) => this.tl.text + i * .12);
    const perLetter = ["slide_letters", "drop_letters", "typewriter", "scramble", "spin_letters"].includes(st.text_in);
    const last = this.tl.lines[n - 1] + (perLetter ? .4 : .26);
    this.tl.hit = this.tl.text + (["slam", "stomp"].includes(st.text_in) ? .42 : .3);
    this.tl.tag = last + .12; this.tl.number = last + .25; this.tl.shine = this.tl.number + .5; this.tl.sparkle = this.tl.number + .35;
    this.tl.still = Math.max(this.tl.still, this.tl.revealEnd + .25);
  }

  /** The number never sits on a phone. Where it shares the phones' width it goes UNDER
   *  them, and the phones make room: first they rise into space nothing else uses, then
   *  they stand smaller. A number already clear of every phone changes nothing, so those
   *  looks draw exactly as they did.
   *  (Owner, 2026-09-26, over a tear-off flyer whose number landed on the phones: the
   *  CTA was placed on top of them and "should've been below".) */
  _numberBelowPhones() {
    this.phoneFit = { k: 1, dy: 0, moved: false };
    if (!this.phones.length) return;
    const st = this.st, keep = st.number_pos, kept = this.pos, center = ["top-center", "center"].includes(st.text_pos);
    // the slots harmonise pairs with this headline position (a centred headline keeps a centred number)
    const pairs = np => !(center && ["bottom-left", "bottom-right"].includes(np)) && !(st.text_pos === "top-right" && np === "bottom-right")
      && !(st.text_pos === "bottom-left" && ["bottom-left", "bottom-center"].includes(np));
    let best = null;
    for (const strict of [true, false]) {
      for (const np of [keep, ...["bottom-center", "bottom-left", "bottom-right", "under-headline"].filter(x => x !== keep && pairs(x))]) {
        st.number_pos = np;
        const pos = np === keep ? kept : this._place(this.lines, this.lineH, this.blockH, this.tag, this.num, this.margin, this.size);
        if (np !== keep && !pos.ok) continue;
        const fit = this._roomUnder(pos, this.num, this.size, strict);
        if (!fit) continue;
        if (fit.k === 1 && !fit.dy) { best = { np, pos, fit }; break; }
        if (!best || fit.k > best.fit.k + .01 || (fit.k > best.fit.k - .01 && fit.dy > best.fit.dy)) best = { np, pos, fit };
      }
      if (best) break;
    }
    if (!best) { st.number_pos = keep; this.pos = kept; return; }          // nothing can clear it: the look stays as it was
    st.number_pos = best.np; this.pos = best.pos;
    const { k, dy, ax, ay } = best.fit;
    this.phoneFit = { k, dy, moved: best.np !== keep };
    if (k === 1 && !dy) return;
    const T = ([x, y]) => [ax + k * (x - ax), ay + k * (y - ay) + dy];
    for (const p of this.phones) { p.home = T(p.home); p.size *= k; }
    this.stageC = T(this.stageC);
  }

  /** The least the phones must do for the number at pos to sit under them: rise by -dy,
   *  then stand k times their size about a point (ax, ay). They rise only into room nothing
   *  else uses: under a headline at the top, no higher than its bottom edge (not at all when
   *  they already tuck under it); otherwise no higher than the top of the frame, so no phone
   *  is cut that was whole. They shrink toward the top of the group, keeping how far they
   *  tuck under the words (and, round words in the middle, what shows above them); under a
   *  SIGN BOARD at the top they shrink toward its bottom edge instead, because a board hides
   *  whatever is behind it and a phone that showed half of itself below one must still show
   *  half. strict: only that; otherwise the group's top will do when the board leaves no
   *  room. null when not even MIN_FIT-size phones would clear it. Measured where the camera
   *  will show them, not where they are laid out. */
  _roomUnder(pos, num, size, strict = false) {
    const W = this.W, H = this.H, z = settleZoom(this.st);
    const labH = num.label ? num.label.height + size * .06 : 0;
    const g = Math.max(size * .15, H * .018);
    const nb = [pos.num[0], pos.num[1] - labH, pos.num[0] + num.c.width, pos.num[1] + num.c.height];
    const column = [nb[0] - g * .5, nb[1] - g, nb[2] + g * .5, H * 3];      // the number, and everything under it
    const outlines = this.phones.map(landedOutline);
    let top = Infinity, x0 = Infinity, x1 = -Infinity;
    for (const P of outlines) for (const [x, y] of P) { top = Math.min(top, y); x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
    const ax = (x0 + x1) / 2;
    const clear = (k, dy, ay) => !outlines.some(P => hitsRect(onCamera(P.map(([x, y]) => [ax + k * (x - ax), ay + k * (y - ay) + dy]), W, H, z), column));
    if (clear(1, 0, top)) return { k: 1, dy: 0, ax, ay: top };
    const atTop = this.st.text_pos.startsWith("top");
    const ceiling = atTop ? pos.outer[3] + g : this.insetTop + H * .02;
    const lift = Math.max(0, top - ceiling);
    if (lift > 0 && clear(1, -lift, top)) {                 // rising is enough: as little as clears it
      let lo = 0, hi = lift;
      for (let i = 0; i < 16; i++) { const mid = (lo + hi) / 2; if (clear(1, -mid, top)) hi = mid; else lo = mid; }
      return { k: 1, dy: -hi, ax, ay: top };
    }
    const board = atTop && pos.board && pos.board[3] > top - lift ? pos.board[3] : null;   // a sign board ABOVE the phones
    for (const ay of board != null ? [board, top] : [top]) {
      if (clear(MIN_FIT, -lift, ay)) {
        let lo = MIN_FIT, hi = 1;                           // the biggest phones that clear it
        for (let i = 0; i < 16; i++) { const mid = (lo + hi) / 2; if (clear(mid, -lift, ay)) lo = mid; else hi = mid; }
        return { k: lo, dy: -lift, ax, ay };
      }
      if (strict) break;
    }
    return null;
  }

  /** Whether a box on screen would sit on any phone once they have landed. */
  _onPhones(r) {
    return this.phones.some(p => hitsRect(onCamera(landedOutline(p), this.W, this.H, settleZoom(this.st)), r));
  }

  _place(lines, lineH, blockH, tag, num, m, size) {
    const st = this.st, W = this.W, H = this.H, pos = st.text_pos, B = this.boardDef;
    const center = ["top-center", "center"].includes(pos), right = pos === "top-right";
    const tagGap = size * (["box", "sticker", "highlighter", "cutout"].includes(st.text_fx) ? .34 : .14);
    const tagH = tag ? tag.height + tagGap : 0;
    const padX = B ? B.pad * size : 0, padY = B ? B.pad * .8 * size : 0, tabs = B ? (B.tabs || 0) * size : 0;
    const outerH = blockH + tagH + padY * 2 + tabs;
    const labH = num.label ? num.label.height + size * .06 : 0;
    // words at the bottom with the number under them sit as one stack on the bottom margin
    const under = st.number_pos === "under-headline", stack = under ? size * (B ? .45 : .28) + labH + num.c.height : 0;
    const top = Math.max(H * .075, this.insetTop + H * .035 + (B && ["freeway", "freeway_blue", "store_sign"].includes(st.board) ? size * .35 : 0));
    const oy = { "top-left": top, "top-center": top, "top-right": top, "middle-left": (H - outerH) / 2 - H * .03,
      "bottom-left": under ? H * .95 - outerH - stack : H * .8 - outerH }[pos] ?? (H - outerH) / 2 - H * .05;
    const y0 = oy + padY;
    let xs, block, board = null;
    if (B) {
      const innerW = Math.max(...lines.map(L => L.inkW), tag ? tag.width : 0), bw = innerW + padX * 2;
      const bx = center ? (W - bw) / 2 : right ? W - m - bw : m;
      xs = lines.map(L => bx + padX + (innerW - L.inkW) / 2);
      board = [bx, oy, bx + bw, oy + outerH];
      block = [bx + padX, y0, bx + bw - padX, y0 + blockH];
    } else {
      xs = lines.map(L => center ? (W - L.inkW) / 2 : right ? W - m - L.inkW : m);
      block = [Math.min(...xs), y0, Math.max(...lines.map((L, i) => xs[i] + L.inkW)), y0 + blockH];
    }
    let tagXY = null;
    if (tag) tagXY = [B ? (board[0] + board[2] - tag.width) / 2 : center ? (W - tag.width) / 2 : right ? W - m - tag.width : m, y0 + blockH + tagGap];
    const textBottom = board ? board[3] : tagXY ? tagXY[1] + tag.height : block[3];
    const outer = board || [Math.min(block[0], tagXY ? tagXY[0] : W), block[1], Math.max(block[2], tagXY ? tagXY[0] + tag.width : 0), textBottom];
    let nx, ny;
    if (st.number_pos === "under-headline") {
      ny = textBottom + size * (B ? .45 : .28) + labH;
      nx = center ? (W - num.c.width) / 2 : right ? W - m - num.c.width : B ? (board[0] + board[2] - num.c.width) / 2 : m;
      nx = clamp(nx, m * .5, W - m * .5 - num.c.width);
    } else {
      ny = H * .94 - num.c.height;
      nx = { "bottom-left": m, "bottom-right": W - m - num.c.width }[st.number_pos] ?? (W - num.c.width) / 2;
    }
    let labXY = null;
    if (num.label) {
      const lx = num.cta ? nx + (num.c.width - num.label.width) / 2
        : ["bottom-left", "under-headline"].includes(st.number_pos) && !center && !right ? nx
        : st.number_pos === "bottom-right" || right ? nx + num.c.width - num.label.width : nx + (num.c.width - num.label.width) / 2;
      labXY = [lx, ny - labH];
    }
    const nb = [nx, ny - labH, nx + num.c.width, ny + num.c.height];
    const overlapX = !(nb[2] < outer[0] || nb[0] > outer[2]);
    const inside = !board || (board[0] >= m * .4 && board[2] <= W - m * .4);
    const ok = inside && ny + num.c.height <= H * .985 && oy >= Math.max(H * .02, this.insetTop + H * .01)
      && (st.number_pos === "under-headline" || !overlapX || nb[1] > textBottom + size * .15);
    return { ok, xs, y0, oy, block, board, outer, tag: tagXY, num: [nx, ny], label: labXY };
  }

  /** A round piece of radius about R where it covers under a tenth of anything that matters. */
  _spot(R, avoid) {
    for (let k = 0; k < 4; k++, R *= .82) {
      const s = freeSpot(this.W, this.H, R, avoid, this.stageC);
      if (s && s.over < .1) return { ...s, R };
    }
    return null;
  }

  /** The sign board, the spray, and the urgency pieces, placed where they cover the least. */
  _buildDecor() {
    const st = this.st, W = this.W, H = this.H, p = this.p, pos = this.pos, size = this.size, tl = this.tl;
    const r = rng(st.seed * 53 + 7), es = st.lang === "es", B = this.boardDef;
    this.board = null; this.spray = null; this.burst = null; this.stamp = null; this.tape = null; this.ticker = null; this.arrow = null;
    this.cues = {};
    if (B && pos.board) {
      const [x0, y0, x1, y1] = pos.board, tabsH = (B.tabs || 0) * size;
      this.board = buildBoard(st.board, x1 - x0, y1 - y0 - tabsH, size, p, st, r,
        { code: codeOf(st), tabsH, numberText: formatNumber(st.number, "dashed"), font: "oswald" });
      if (this.board) this.cues.board = tl.text - .12;
    }
    const labH = this.num.label ? this.num.label.height + size * .06 : 0;
    const nb = [pos.num[0], pos.num[1] - labH, pos.num[0] + this.num.c.width, pos.num[1] + this.num.c.height];
    this.numBox = nb;
    const o = pos.outer, avoid = [this.board ? [o[0], o[1] - size * .5, o[2], o[3]] : o, nb];
    if (this.tickerH) avoid.push([0, this.tickerY, W, this.tickerY + this.tickerH]);
    if (this.awningH) avoid.push([0, 0, W, this.awningH]);
    const pad = size * .1, grow = b => [b[0] - pad, b[1] - pad, b[2] + pad, b[3] + pad];
    if (this.decor.has("spray_halo") && !this.board) this.spray = buildSpray(pos.block, size, haloColour(this.pHead), r);
    const s0 = this.decor.has("starburst") ? this._spot(Math.min(W, H) * .105, avoid.map(grow)) : null;
    if (s0) {
      const R = s0.R, s = s0;
      const fills = ["#fff200", "#ff2d55", "#30d158", "#00e5ff", "#ff9e1b"].filter(f => Math.abs(lum(f) - lum(p.ground)) > .22);
      const fill = fills.length ? r.pick(fills) : "#fff200";
      this.burst = { x: s.x, y: s.y, R, fill, ink: lum(fill) > .55 ? "#111111" : "#ffffff", text: st.burst_text || (es ? "¡EFECTIVO!" : "CASH!"), t0: tl.hit + .12, font: burstFontFor(st) };
      avoid.push([s.x - R, s.y - R, s.x + R, s.y + R]);
      this.cues.burst = this.burst.t0;
    }
    if (this.decor.has("neon_arrow")) {
      const h = nb[3] - nb[1], left = nb[0] > W - nb[2];
      const tip = left ? [nb[0] - size * .15, nb[1] + h * .45] : [nb[2] + size * .15, nb[1] + h * .45];
      const tail = left ? [tip[0] - size * 1.1, tip[1] - size * .9] : [tip[0] + size * 1.1, tip[1] - size * .9];
      const box = [Math.min(tail[0], tip[0]) - size * .2, tail[1] - size * .2, Math.max(tail[0], tip[0]) + size * .2, tip[1] + size * .3];
      const clear = box[2] < o[0] || box[0] > o[2] || box[3] < o[1] || box[1] > o[3];
      if (tail[0] > 0 && tail[0] < W && clear) this.arrow = { from: tail, to: tip, color: lum(p.accent) > .35 ? p.accent : "#ff2e88", t0: tl.number + .25 };
    }
    if (st.urgency === "stamp") {
      const col = lum(p.ground) > .45 ? r.pick(["#d62828", "#1d4ed8", "#b5179e"]) : this.hot;
      const text = st.stamp_text || (es ? "EFECTIVO" : "CASH");
      for (let fs = Math.min(size * .5, Math.min(W, H) * .07), k = 0; k < 4 && !this.stamp; k++, fs *= .8) {
        const S = buildStamp(text, fs, col, "oswald", r), R = Math.max(S.width, S.height) * .5;
        const s = freeSpot(W, H, R, avoid.map(grow), this.stageC);
        if (s && s.over < .1) { this.stamp = { S, x: s.x, y: s.y, t0: tl.number + .55 }; avoid.push([s.x - R, s.y - R, s.x + R, s.y + R]); }
      }
      if (this.stamp) this.cues.stamp = this.stamp.t0;
      else st.urgency = "arrows";                          // nowhere clear to stamp: point at the number instead
    }
    if (st.urgency === "caution_tape") {
      // across whichever corner it covers least of the words and the number
      const band = Math.min(W, H) * .085, L = Math.hypot(W, H) * .5;
      const score = corner => {
        const [sx, sy] = { tr: [1, -1], tl: [-1, -1], br: [1, 1], bl: [-1, 1] }[corner];
        const cx = W / 2 + sx * W * .4, cy = H / 2 + sy * H * .4, ang = Math.atan2(H, W) * (sx * sy > 0 ? 1 : -1) * .9;
        let hits = 0;
        for (let k = -10; k <= 10; k++) {
          const u = k / 10 * L / 2, x = cx + Math.cos(-ang) * u, y = cy + Math.sin(-ang) * u;
          if (x < 0 || y < 0 || x > W || y > H) continue;
          for (const b of avoid) if (x > b[0] - band / 2 && x < b[2] + band / 2 && y > b[1] - band / 2 && y < b[3] + band / 2) hits++;
        }
        return hits;
      };
      const best = ["tr", "tl", "br", "bl"].map(k => [k, score(k)]).sort((a, b) => a[1] - b[1])[0];
      if (best[1] <= 2) { this.tape = { corner: best[0], text: st.cta || (es ? "¡NO ESPERES!" : "DON'T WAIT"), t0: tl.number + .35 }; this.cues.tape = this.tape.t0; }
      else st.urgency = "arrows";                          // no clear corner: point at the number instead
    }
    if (st.urgency === "ticker") {
      const items = st.ticker_items && st.ticker_items.length ? st.ticker_items
        : es ? ["MÁNDANOS FOTO", "TE DAMOS PRECIO", "EFECTIVO", "PIERDE VALOR CADA MES"] : ["TEXT A PIC", "GET A PRICE", "CASH", "IT LOSES VALUE EVERY MONTH"];
      this.ticker = buildTicker(items.map(s => applyCase(s, "upper")), this.tickerH, "oswald",
        { bg: "#0d0d0f", line: this.hot, ink: "#ffffff", badge: this.hot, badgeInk: lum(this.hot) > .55 ? "#111111" : "#ffffff" },
        applyCase(st.cta || (es ? "¡MÁNDANOS TEXTO!" : "TEXT NOW"), "upper"));
    }
    if (this.awningH) this.awningColors = [lum(p.plate) < .8 && lum(p.plate) > .08 ? p.plate : this.hot, "#fbfaf5"];
    // arrows at the number go beside it, or above it when that is clear of the words and
    // the phones (they are part of the number, and the number never sits on a phone);
    // otherwise the border flashes instead
    this.arrowsMode = null;
    if (st.urgency === "arrows") {
      const words = this.board ? [o[0], o[1] - size * .5, o[2], o[3]] : o;
      this.arrowsMode = chevronRoom(nb, size, W, words, r => this._onPhones(r));
      if (!this.arrowsMode) st.urgency = "flash_border";
    }
    // a pinstripe under the words only where it clears the number
    const yP = o[3] + size * .28, band = [o[0], yP - size * .32, o[2], yP + size * .42];
    this.pinstripe = this.decor.has("pinstripe") && band[3] < H * .97 && (band[3] < nb[1] || band[1] > nb[3] || band[2] < nb[0] || band[0] > nb[2]);
  }

  /** Measure the pixels that will actually sit behind the headline once the
   *  phones have landed, and strengthen the shade behind the type until the
   *  lettering stands out at least 4.5:1 (or the shade is at full strength). */
  _contrastGuard() {
    const W = this.W, H = this.H, q = 4, w = Math.max(8, Math.round(W / q)), h = Math.max(8, Math.round(H / q));
    const c = canvas(w, h), x = c.getContext("2d", { willReadFrequently: true });
    const [bx0, by0, bx1, by1] = this.pos.block;
    const ink = hexRgb(this.st.text_fx === "box" ? this.p.plate_ink : this.p.ink);
    if (["box", "sticker", "cutout", "highlighter"].includes(this.st.text_fx)) return;   // carried by their own plate
    if (this.board) return;                                                              // carried by the sign
    const L = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
    const Li = .2126 * L(ink[0]) + .7152 * L(ink[1]) + .0722 * L(ink[2]);
    for (let round = 0; round < 3; round++) {
      x.save(); x.scale(1 / q, 1 / q); x.drawImage(this.bg, 0, 0);
      const tEnd = this.st.duration - .1;
      for (const i of this.drawOrder) { const p = this.phones[i], stt = phoneState(p, tEnd, this.st); if (stt) drawPhone(x, p, ...stt, W); }
      x.restore();
      if (this.scrimC) x.drawImage(this.scrimC, 0, 0, w, h);
      const d = x.getImageData(Math.max(0, Math.floor(bx0 / q)), Math.max(0, Math.floor(by0 / q)), Math.max(1, Math.ceil((bx1 - bx0) / q)), Math.max(1, Math.ceil((by1 - by0) / q))).data;
      let s = 0, n = 0;
      for (let k = 0; k < d.length; k += 4) { s += .2126 * L(d[k]) + .7152 * L(d[k + 1]) + .0722 * L(d[k + 2]); n++; }
      const Lb = s / Math.max(1, n), ratio = (Math.max(Li, Lb) + .05) / (Math.min(Li, Lb) + .05);
      this.contrastBehind = ratio;
      if (ratio >= 4.5) return;
      this.scrimBoost = (this.scrimBoost || 1) * 1.6;
      this._scrim();
    }
  }

  _scrim() {
    const st = this.st, W = this.W, H = this.H;
    let s = st.scrim;
    if (s < 0) s = { box: 0, sticker: .25, cutout: .3, highlighter: .2, double_outline: .3, outline: .8, neon: .8 }[st.text_fx] ?? .65;
    s = Math.min(1.9, s * (this.scrimBoost || 1));
    this.scrimC = null;
    if (s <= 0) return;
    const light = lum(this.p.ink) > .5;
    const c = canvas(W / 4, H / 4), x = c.getContext("2d");
    const boxes = [this.pos.block, [this.pos.num[0], this.pos.num[1], this.pos.num[0] + this.num.c.width, this.pos.num[1] + this.num.c.height]];
    if (this.board) boxes.shift();
    for (const [x0, y0, x1, y1] of boxes) {
      const cx = (x0 + x1) / 8, cy = (y0 + y1) / 8, rx = Math.max(10, (x1 - x0) * .75 / 4), ry = Math.max(10, (y1 - y0) * 1.1 / 4);
      x.save(); x.translate(cx, cy); x.scale(rx, ry);
      const g = x.createRadialGradient(0, 0, 0, 0, 0, 1.6);
      const col = light ? "0,0,0" : "255,255,255";
      g.addColorStop(0, `rgba(${col},${Math.min(.85, .47 * s)})`); g.addColorStop(.55, `rgba(${col},${Math.min(.6, .3 * s)})`); g.addColorStop(1, `rgba(${col},0)`);
      x.fillStyle = g; x.fillRect(-2, -2, 4, 4); x.restore();
    }
    this.scrimC = c;
  }

  // ---- frames
  _drawRays(ctx, t) {
    const st = this.st;
    if (!["rays", "sunburst"].includes(st.background)) return;
    const [cx, cy] = this.stageC, n = 12 + (st.seed % 4) * 4, R = Math.hypot(this.W, this.H);
    const turn = st.background === "sunburst" ? t * .12 : 0;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(turn + (st.seed % 7) * .1);
    ctx.fillStyle = rgba(this.p.light, .35);
    for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI * 2, a1 = a0 + Math.PI / n; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, a0, a1); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }

  _phonesLayer(t, dt, quality) {
    if (this.still && !["sunburst"].includes(this.st.background)) return this.still;
    const flying = t < this.tl.landed + .02, moving = t < this.tl.revealEnd + .05;
    const subs = flying ? quality.subsFly : moving ? quality.subsMove : 1;
    const ax = this.acc.getContext("2d"), tx = this.tmp.getContext("2d");
    for (let s = 0; s < subs; s++) {
      const ts = subs > 1 ? t + (s / (subs - 1) - .5) * dt * .55 : t;
      const target = s === 0 ? ax : tx;
      target.globalAlpha = 1; target.drawImage(this.bg, 0, 0);
      this._drawRays(target, ts);
      for (const i of this.drawOrder) {
        const p = this.phones[i], stt = phoneState(p, ts, this.st);
        if (stt) drawPhone(target, p, ...stt, this.W);
      }
      if (s > 0) { ax.globalAlpha = 1 / (s + 1); ax.drawImage(this.tmp, 0, 0); ax.globalAlpha = 1; }
    }
    if (t > this.tl.still && this.st.background !== "sunburst") {
      this.still = canvas(this.W, this.H); this.still.getContext("2d").drawImage(this.acc, 0, 0);
      return this.still;
    }
    return this.acc;
  }

  _shake(t) {
    const lvl = this.st.shake || 0, hits = [];
    if (lvl) {
      for (const p of this.phones) { hits.push([p.tLand, .004 * lvl]); if (p.reveal) hits.push([p.tReveal + .5, .0018 * lvl]); }
      if (["slam", "stomp"].includes(this.st.text_in)) hits.push([this.tl.hit, .006 * lvl]);
      if (this.st.hook === "punch_in") hits.push([.5, .007 * lvl]);
      if (["hook_line", "word_beat"].includes(this.st.hook)) hits.push([0, .008 * lvl]);
    }
    if (this.hookWords) this.hookLines.forEach((_, i) => { if (i) hits.push([i * this.hookBeat, .004]); });
    if (this.stamp) hits.push([this.stamp.t0 + .2, .007]);
    let dx = 0, dy = 0;
    for (const [h, amp] of hits) {
      const d = t - h;
      if (d >= 0 && d < .25) { const a = amp * this.W * Math.exp(-d * 18); dx += a * Math.sin(d * 90 + h * 7); dy += a * Math.cos(d * 75 + h * 5); }
    }
    return [dx, dy];
  }

  _camera(t) {
    const c = this._camera0(t);
    if (this.st.hook === "punch_in" && t < .5) c[0] *= lerp(2.1, 1, outQuint(clamp(t / .5)));
    if (this.st.urgency === "beat_pump") c[0] *= 1 + .022 * beatPulse(t, this.tl.hit, this.st.bpm || 118);
    return c;
  }

  _hookLine(ctx, t) {
    const W = this.W, H = this.H, s0 = outCubic(prog(t, 0, .14)), out = prog(t, this.hookEnd - .04, .22);
    // the wash behind the opening words is dark for contrast; over a scene that is already dark
    // it is the look's loud colour instead, so the thumbnail is neither black nor bare
    // (a scene with large dark areas, a dusk sky, gets a lighter wash for the same reason)
    const dark = (this.bgLum ?? .5) < .22, wash = dark ? mix(this.hot, "#000000", .45) : "#000000";
    const k = dark ? 1 : clamp(((this.bgLum ?? .5) - .1) / .25, .5, 1) * clamp(1.1 - (this.bgDark || 0) * 1.8, .4, 1);
    const scrimA = (this.hookWords ? .52 : .56) * k * (1 - out);
    if (scrimA > 0) { ctx.fillStyle = rgba(wash, scrimA); ctx.fillRect(0, 0, W, H); }
    if (this.hookWords) {
      const n = this.hookLines.length, i = Math.min(n - 1, Math.floor(t / this.hookBeat)), t0 = i * this.hookBeat;
      const q = outCubic(prog(t, t0, .07)), L = this.hookLines[i], s = lerp(i ? 1.4 : 1.08, 1, q) * (1 + .3 * out);
      if (i > 0 && t - t0 < .06) { ctx.fillStyle = `rgba(255,255,255,${.2 * (1 - (t - t0) / .06)})`; ctx.fillRect(0, 0, W, H); }
      ctx.save(); ctx.globalAlpha = 1 - out; ctx.translate(W / 2, H / 2); ctx.scale(s, s);
      ctx.drawImage(L.c, -L.inkW / 2 - L.pad, -L.asc * .55 - L.pad);
      ctx.restore();
      return;
    }
    const a = 1 - out, s = lerp(1.25, 1, s0) * (1 + .3 * out);
    const lh = this.hookLines[0].asc * 1.02, total = lh * this.hookLines.length;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(W / 2, H / 2); ctx.scale(s, s);
    this.hookLines.forEach((L, i) => ctx.drawImage(L.c, -L.inkW / 2 - L.pad, -total / 2 + i * lh - L.pad));
    ctx.restore();
  }

  _camera0(t) {
    const u = t / this.st.duration;
    switch (this.st.camera) {
      case "push_in": return [1 + .05 * u, 0, 0, 0];
      case "push_out": return [1.08 - .07 * outCubic(u), 0, 0, 0];
      case "drift": return [1.05, Math.sin(u * Math.PI) * .015, -.01 * u, 0];
      case "punch": { const d = t - this.tl.hit; return [1.02 + (d > 0 && d < .4 ? .06 * Math.exp(-d * 8) : 0), 0, 0, 0]; }
      case "tilt": return [1.06, 0, 0, (1 - outCubic(clamp(u * 2.5))) * 3];
      case "whip_in": { const e = outQuint(clamp(t / .5)); return [lerp(1.34, 1.04, e), .15 * (1 - e), 0, 0]; }
      case "handheld": return [1.05, Math.sin(t * 1.3) * .004 + Math.sin(t * 3.1) * .002, Math.cos(t * 1.1) * .004, Math.sin(t * .9) * .4];
      default: return [1, 0, 0, 0];
    }
  }

  frame(ctx, t, quality = { subsFly: 8, subsMove: 4 }, dt = 1 / 30) {
    const st = this.st, W = this.W, H = this.H, tl = this.tl;
    const base = this._phonesLayer(t, dt, quality);
    const [z, px, py, rotDeg] = this._camera(t);
    const [sx, sy] = this._shake(t);
    ctx.save();
    ctx.fillStyle = this.p.ground; ctx.fillRect(0, 0, W, H);
    ctx.translate(W / 2 + px * W + sx, H / 2 + py * H + sy); ctx.rotate(rotDeg * Math.PI / 180); ctx.scale(z, z);
    ctx.drawImage(base, -W / 2, -H / 2);
    ctx.restore();

    if (this.awningH) drawAwning(ctx, W, this.awningH, this.awningColors, t);
    if (this.hookLines && t < this.hookEnd + .3) this._hookLine(ctx, t);
    if (st.hook === "flash_cut") for (const p of this.phones) { if (!p.flashIn) continue; const f = t - p.tIn; if (f >= 0 && f < .09) { ctx.fillStyle = `rgba(255,255,255,${.6 * (1 - f / .09)})`; ctx.fillRect(0, 0, W, H); } }
    if (this.scrimC) { const k = prog(t, tl.text - .1, .4); if (k > 0) { ctx.globalAlpha = k; ctx.drawImage(this.scrimC, 0, 0, W, H); ctx.globalAlpha = 1; } }
    if (this.spray) drawSpray(ctx, this.spray, this.pos.block, t, tl.text);
    if (this.board) drawBoard(ctx, this.board, this.pos.board[0], this.pos.board[1], t, tl.text - .12, W, H);
    if (st.speed_lines) this._speedLines(ctx, t);
    this._headline(ctx, t, dt);
    if (this.tag) { const q = prog(t, tl.tag, .35); if (q > 0) { ctx.globalAlpha = q; ctx.drawImage(this.tag, lerp(this.pos.tag[0] - W * .05, this.pos.tag[0], outCubic(q)), this.pos.tag[1]); ctx.globalAlpha = 1; } }
    if (this.pinstripe) drawPinstripe(ctx, this.pos.outer, this.size, lum(this.p.accent) > .45 ? this.p.accent : "#f6c945", t, tl.tag + .1);
    this._number(ctx, t);
    this._urgency(ctx, t);
    if (st.sparkles) this._sparkles(ctx, t);
    this._overlay(ctx, t);
    if (this.ticker) { const q = outCubic(prog(t, Math.max(0, tl.text - .25), .3)); if (q > 0) drawTicker(ctx, this.ticker, W, this.tickerY - (1 - q) * (this.tickerY + this.tickerH), t); }
    if (st.urgency === "flash_border") drawFlashBorder(ctx, W, H, this.hot, t, tl.hit, st.bpm || 118);
    if (st.flash) { const f = t - tl.hit; if (f >= 0 && f < .12) { ctx.fillStyle = `rgba(255,255,255,${.27 * (1 - f / .12)})`; ctx.fillRect(0, 0, W, H); } }
    if (st.rgb_hit) { const d = t - tl.hit; if (d >= 0 && d < .16) this._rgbShift(ctx, Math.round(W * .006 * (1 - d / .16))); }
  }

  _headline(ctx, t, dt) {
    const st = this.st, W = this.W, H = this.H, tl = this.tl;
    this.lines.forEach((L, i) => {
      const t0 = tl.lines[i], xEnd = this.pos.xs[i] - L.pad, y = this.pos.y0 + i * this.lineH - L.pad;
      const q = prog(t, t0, .38); if (q <= 0) return;
      const shineP = st.shine && t >= tl.shine ? prog(t, tl.shine + i * .08, .6) : 0;
      if (L.plate && !["slide", "skew_slide"].includes(st.text_in)) {
        const f = outCubic(prog(t, t0 - .05, .3));
        ctx.save(); ctx.beginPath(); ctx.rect(xEnd + L.plateOff[0], y + L.plateOff[1], L.plate.width * f, L.plate.height); ctx.clip();
        ctx.drawImage(L.plate, xEnd + L.plateOff[0], y + L.plateOff[1]); ctx.restore();
      }
      const drawLine = (x, yy, alpha = 1, sx = 1, sy = 1, skewX = 0, blurPx = 0) => {
        ctx.save(); ctx.globalAlpha = alpha;
        ctx.translate(x + L.c.width / 2, yy + L.c.height / 2); ctx.scale(sx, sy); if (skewX) ctx.transform(1, 0, -skewX, 1, 0, 0);
        if (blurPx > .5 && "filter" in ctx) ctx.filter = `blur(${blurPx}px)`;
        if (L.plate && ["slide", "skew_slide"].includes(st.text_in)) ctx.drawImage(L.plate, -L.c.width / 2 + L.plateOff[0], -L.c.height / 2 + L.plateOff[1]);
        ctx.drawImage(L.c, -L.c.width / 2, -L.c.height / 2);
        ctx.filter = "none"; ctx.restore();
        if (shineP > 0 && shineP < 1) this._shine(ctx, x, yy, L.c.width, L.c.height, shineP, L.c);
      };
      switch (st.text_in) {
        case "slide": case "skew_slide": {
          const start = -L.c.width - W * .05, e = outBack(q, 1.3);
          const x = lerp(start, xEnd, e), v = Math.abs(lerp(start, xEnd, outBack(prog(t + dt, t0, .38), 1.3)) - x);
          const n = v > 3 ? Math.min(10, Math.ceil(v / 12)) : 1;
          for (let k = 0; k < n; k++) drawLine(x - v * .8 * k / n, y, n > 1 ? (k === 0 ? .55 : .45 / n) : 1, 1, 1, st.text_in === "skew_slide" ? .45 * (1 - outCubic(q)) : 0);
          break;
        }
        case "wipe": {
          const e = outCubic(q);
          ctx.save(); ctx.beginPath(); ctx.rect(xEnd, y, L.pad + L.inkW * e + (e >= 1 ? L.pad + L.extra : 0), L.c.height); ctx.clip(); drawLine(xEnd, y); ctx.restore();
          if (e < 1) { ctx.fillStyle = `rgba(255,255,255,${.8 * (1 - e)})`; ctx.fillRect(xEnd + L.pad + L.inkW * e, y + L.pad, Math.max(3, this.size * .05), this.lineH); }
          break;
        }
        case "slam": { const e = outCubic(q), s = lerp(2.3, 1, e); drawLine(xEnd, y, clamp(q * 3), s, s); break; }
        case "stomp": { const e = outBounce(q), s = lerp(1.9, 1, e); drawLine(xEnd, y + (1 - e) * -H * .08, clamp(q * 4), s, s); break; }
        case "blur_in": { const e = outCubic(q); drawLine(lerp(xEnd - W * .06, xEnd, e), y, clamp(q * 2), 1, 1, 0, (1 - e) * this.size * .25); break; }
        case "rise_mask": {
          const e = outQuint(q);
          ctx.save(); ctx.beginPath(); ctx.rect(0, y + L.pad - this.size * .1, W, L.asc + L.desc + this.size * .25); ctx.clip();
          drawLine(xEnd, y + (1 - e) * (L.asc + this.size * .3)); ctx.restore(); break;
        }
        case "flip_in": { const e = outBack(q, 1.8); drawLine(xEnd, y, clamp(q * 3), 1, Math.max(.01, e)); break; }
        case "word_pop": {
          // words as groups of glyph positions: pop each word from its centre
          const words = []; let cur = null;
          L.text.split("").forEach((ch, k) => { if (ch === " ") { cur = null; return; } if (!cur) { cur = { a: k, b: k }; words.push(cur); } else cur.b = k; });
          words.forEach((wd, wi) => {
            const qw = prog(t, t0 + wi * .09, .4); if (qw <= 0) return;
            const s = Math.max(.01, outBack(qw, 2.4));
            const x0 = L.xs[wd.a] + L.pad - this.size * .15, x1 = (wd.b + 1 < L.xs.length ? L.xs[wd.b + 1] : L.inkW) + L.pad + this.size * .15;
            const cx = xEnd + (x0 + x1) / 2, cy = y + L.c.height / 2;
            ctx.save(); ctx.globalAlpha = clamp(qw * 3); ctx.translate(cx, cy); ctx.scale(s, s);
            ctx.drawImage(L.c, x0, 0, x1 - x0, L.c.height, -(x1 - x0) / 2, -L.c.height / 2, x1 - x0, L.c.height); ctx.restore();
          });
          if (shineP > 0 && shineP < 1) this._shine(ctx, xEnd, y, L.c.width, L.c.height, shineP, L.c);
          break;
        }
        default: {                                      // the per-letter entrances
          const G = L.glyphs;
          if (!G.length) { drawLine(xEnd, y); break; }
          G.forEach((g, j) => {
            const qj = prog(t, t0 + j * (st.text_in === "typewriter" ? .032 : .024), st.text_in === "typewriter" ? .01 : .3);
            if (qj <= 0) return;
            const gx = xEnd + g.x;
            ctx.save(); ctx.globalAlpha = clamp(qj * 3);
            if (st.text_in === "slide_letters") ctx.drawImage(g.c, lerp(gx - W * .3, gx, outBack(qj, 1.4)), y);
            else if (st.text_in === "drop_letters") ctx.drawImage(g.c, gx, lerp(y - H * .45, y, outBounce(qj)));
            else if (st.text_in === "spin_letters") { ctx.translate(gx + g.c.width / 2, y + g.c.height / 2); ctx.rotate((1 - outBack(qj, 1.2)) * Math.PI * 1.5); const s = lerp(.2, 1, outBack(qj)); ctx.scale(s, s); ctx.drawImage(g.c, -g.c.width / 2, -g.c.height / 2); }
            else if (st.text_in === "scramble") {
              if (qj < 1) { const alt = this._glyphFor(randomChar(t, j), g.col); ctx.globalAlpha = .9; ctx.drawImage(alt, gx, y); }
              else ctx.drawImage(g.c, gx, y);
            } else ctx.drawImage(g.c, gx, y);             // typewriter
            ctx.restore();
          });
          if (st.text_in === "typewriter") {
            // one cursor: on the line being typed, then blinking at the end of the last line only
            const n = G.filter((g, j) => t >= t0 + j * .032).length, lastLine = i === this.lines.length - 1;
            if (n < G.length || (lastLine && (t - t0) % .6 < .3)) {
              const gx = xEnd + (n < G.length ? G[n].x : G[G.length - 1].x + G[G.length - 1].c.width - L.pad * 1.6) + L.pad;
              ctx.fillStyle = this.pHead.ink; ctx.fillRect(gx, y + L.pad, Math.max(3, this.size * .06), L.asc);
            }
          }
          if (shineP > 0 && shineP < 1) this._shine(ctx, xEnd, y, L.c.width, L.c.height, shineP, L.c);
        }
      }
    });
  }

  _glyphFor(ch, col) {
    this._gcache = this._gcache || {};
    const k = ch + col;
    if (!this._gcache[k]) this._gcache[k] = inkSprite(ch, [col], this.st.font, this.size, 0, this.st.text_fx, this.pHead, this.st.skew).c;
    return this._gcache[k];
  }

  _shine(ctx, x, y, w, h, p, spriteC) {
    // a diagonal light across the ink only
    this._shineC = this._shineC || canvas(w, h);
    const c = this._shineC; if (c.width < w || c.height < h) { c.width = w; c.height = h; }
    const sx = c.getContext("2d"); sx.clearRect(0, 0, c.width, c.height);
    sx.globalCompositeOperation = "source-over"; sx.drawImage(spriteC, 0, 0);
    sx.globalCompositeOperation = "source-in";
    const pos = lerp(-.3, 1.3, p) * (w + h * .5);
    const g = sx.createLinearGradient(pos - w * .08, 0, pos + w * .08, h * .5);
    g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(.5, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,0)");
    sx.fillStyle = g; sx.fillRect(0, 0, w, h); sx.globalCompositeOperation = "source-over";
    ctx.drawImage(c, 0, 0, w, h, x, y, w, h);
  }

  _number(ctx, t) {
    const st = this.st, W = this.W, H = this.H, tl = this.tl;
    const q = prog(t, tl.number, .45); if (q <= 0) return;
    const [nx, ny] = this.pos.num, c = this.num.c;
    const pump = st.urgency === "beat_pump" && t > tl.number + .45 ? 1 + .05 * beatPulse(t, tl.hit, st.bpm || 118) : 1;
    const draw = (x, y, a = 1, sx = 1, sy = 1) => { ctx.save(); ctx.globalAlpha = a; ctx.translate(x + c.width / 2, y + c.height / 2); ctx.scale(sx * pump, sy * pump); ctx.drawImage(c, -c.width / 2, -c.height / 2); ctx.restore(); };
    switch (st.number_in) {
      case "pop": { const s = Math.max(.05, outBack(q, 2.2)); draw(nx, ny + (1 - outCubic(q)) * H * .05, clamp(q / .3), s, s); break; }
      case "slide_up": draw(nx, ny + (1 - outBack(q, 1.2)) * H * .14, clamp(q * 2.5)); break;
      case "slide_left": draw(lerp(W + 20, nx, outBack(q, 1.2)), ny); break;
      case "drop": draw(nx, lerp(-c.height, ny, outBounce(q))); break;
      case "flip": draw(nx, ny, clamp(q * 3), 1, Math.max(.01, outBack(q, 1.8))); break;
      case "type": {
        const n = this.num.text.length, k = Math.floor(prog(t, tl.number, .06 * n) * n + .001);
        ctx.save(); ctx.beginPath(); ctx.rect(nx, ny, c.width * (k >= n ? 1 : k / n), c.height); ctx.clip(); draw(nx, ny); ctx.restore(); break;
      }
      case "roll": {
        // each slice of the number rolls up into place, left to right
        const n = 10;
        for (let i = 0; i < n; i++) {
          const qi = prog(t, tl.number + i * .04, .35); if (qi <= 0) continue;
          const x0 = c.width * i / n, w = c.width / n + 1, off = (1 - outBack(qi, 1.3)) * c.height;
          ctx.save(); ctx.beginPath(); ctx.rect(nx + x0, ny, w, c.height); ctx.clip(); ctx.globalAlpha = clamp(qi * 3); ctx.drawImage(c, nx, ny + off); ctx.restore();
        }
        break;
      }
      default: { ctx.save(); ctx.beginPath(); ctx.rect(nx, ny, c.width * outCubic(q), c.height); ctx.clip(); draw(nx, ny); ctx.restore(); }
    }
    if (this.num.label && this.pos.label) {
      const lq = prog(t, tl.number + .15, .3);
      if (lq > 0) {
        const Lc = this.num.label, beat = this.num.cta ? 1 + .1 * beatPulse(t, tl.hit, st.bpm || 118) : 1;
        ctx.save(); ctx.globalAlpha = lq;
        ctx.translate(this.pos.label[0] + Lc.width / 2, this.pos.label[1] + Lc.height / 2 + (1 - outCubic(lq)) * 12); ctx.scale(beat, beat);
        ctx.drawImage(Lc, -Lc.width / 2, -Lc.height / 2); ctx.restore();
      }
    }
    if (st.shine && t >= tl.shine + .25) { const sp = prog(t, tl.shine + .25, .6); if (sp > 0 && sp < 1) this._shine(ctx, nx, ny, c.width, c.height, sp, c); }
  }

  /** The starburst, the arrows at the number, the rubber stamp and the caution tape. */
  _urgency(ctx, t) {
    const st = this.st, tl = this.tl;
    if (this.burst) drawStarburst(ctx, this.burst.x, this.burst.y, this.burst.R, applyCase(this.burst.text, "upper"), this.burst.fill, this.burst.ink, t, this.burst.t0, this.burst.font);
    if (this.arrow) drawNeonArrow(ctx, this.arrow.from, this.arrow.to, this.arrow.color, t, this.arrow.t0, this.size);
    if (st.urgency === "arrows" && this.arrowsMode) drawChevrons(ctx, this.numBox, this.size, this.hot, t, tl.number + .3, this.W, this.arrowsMode);
    if (this.stamp) drawStamp(ctx, this.stamp.S, this.stamp.x, this.stamp.y, t, this.stamp.t0);
    if (this.tape) drawTape(ctx, this.W, this.H, this.tape.corner, applyCase(this.tape.text, "upper"), t, this.tape.t0, "oswald", false);
  }

  _speedLines(ctx, t) {
    const tl = this.tl, W = this.W, t0 = tl.text - .05, t1 = tl.lines[tl.lines.length - 1] + .45;
    if (t < t0 || t > t1) return;
    const u = (t - t0) / (t1 - t0), b = this.pos.block, r = rng(this.st.seed * 7 + Math.floor(t * 30));
    ctx.save(); ctx.strokeStyle = rgba(this.p.ink, .43 * Math.sin(Math.PI * u)); ctx.lineCap = "round";
    for (let i = 0; i < 14; i++) {
      const y = r.uniform(b[1] - 20, b[3] + 20), L = r.uniform(.15, .45) * W, x = r.uniform(-L, W * .9) * (.4 + u);
      ctx.lineWidth = r.pick([2, 3, 4]); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + L, y); ctx.stroke();
    }
    ctx.restore();
  }

  _sparkles(ctx, t) {
    const tl = this.tl; if (t < tl.sparkle) return;
    const [nx, ny] = this.pos.num, c = this.num.c, r = rng(this.st.seed * 3);
    const col = lum(this.p.accent) > .5 ? this.p.accent : "#ffffff";
    const sides = this.num.label ? [1, 2, 3] : [0, 1, 2, 3], h = c.height;
    for (let k = 0; k < 9; k++) {
      const side = sides[k % sides.length], ph = r.uniform(0, .9), along = r.uniform(0, 1);
      const sx = side < 2 ? nx + along * c.width : side === 2 ? nx - h * r.uniform(.45, .75) : nx + c.width + h * r.uniform(.45, .75);
      const sy = side === 0 ? ny - h * r.uniform(.45, .7) : side === 1 ? ny + h * r.uniform(1.45, 1.7) : ny + along * h;
      const u = ((t - tl.sparkle - ph) % 1.3 + 1.3) % 1.3 / .55;
      if (u > 0 && u < 1) star(ctx, sx, sy, c.height * .35 * Math.sin(Math.PI * u), col);
    }
  }

  _overlay(ctx, t) {
    const st = this.st, W = this.W, H = this.H, tl = this.tl;
    switch (st.overlay) {
      case "confetti": {
        if (t < tl.number) return;
        const r = rng(st.seed * 11), cols = [this.p.accent, this.p.light, "#ffffff", "#ffd60a", "#30d158"];
        for (let i = 0; i < 90; i++) {
          const x0 = r() * W, sp = r.uniform(.25, .6) * H, ph = r() * 1.2, dt2 = t - tl.number - ph * .3;
          if (dt2 < 0) continue;
          const y = -20 + dt2 * sp, x = x0 + Math.sin(dt2 * 3 + i) * W * .02;
          if (y > H + 20) continue;
          ctx.save(); ctx.translate(x, y); ctx.rotate(dt2 * 4 + i); ctx.fillStyle = cols[i % cols.length];
          const s = W * .008; ctx.fillRect(-s, -s / 3, s * 2, s * .7 * Math.abs(Math.cos(dt2 * 6 + i))); ctx.restore();
        }
        break;
      }
      case "light_leak": {
        const u = t / st.duration, x = lerp(-W * .3, W * 1.3, u), g = ctx.createRadialGradient(x, H * .2, 0, x, H * .2, W * .6);
        g.addColorStop(0, "rgba(255,170,90,.28)"); g.addColorStop(.5, "rgba(255,90,120,.12)"); g.addColorStop(1, "rgba(255,90,120,0)");
        ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); break;
      }
      case "vignette_pulse": {
        const beat = 60 / st.bpm, ph = t > tl.hit ? ((t - tl.hit) % beat) / beat : 1, k = .18 + .14 * Math.exp(-ph * 6);
        const g = ctx.createRadialGradient(W / 2, H / 2, Math.hypot(W, H) * .25, W / 2, H / 2, Math.hypot(W, H) * .7);
        g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(0,0,0,${k})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); break;
      }
      case "lens_flare": {
        const d = t - tl.hit; if (d < -.1 || d > 1.2) return;
        const u = clamp((d + .1) / 1.3), x = lerp(-W * .1, W * 1.1, u), y = this.pos.block[1] + (this.pos.block[3] - this.pos.block[1]) / 2;
        ctx.save(); ctx.globalCompositeOperation = "screen";
        const g = ctx.createRadialGradient(x, y, 0, x, y, W * .12); g.addColorStop(0, "rgba(255,255,240,.8)"); g.addColorStop(1, "rgba(255,255,240,0)");
        ctx.fillStyle = g; ctx.fillRect(x - W * .12, y - W * .12, W * .24, W * .24);
        ctx.fillStyle = "rgba(255,255,255,.45)"; ctx.fillRect(x - W * .35, y - 1.5, W * .7, 3);
        [.3, .55, .8].forEach((k, i) => { const fx = lerp(x, W - x, k), fy = lerp(y, H - y, k); ctx.fillStyle = ["rgba(120,200,255,.12)", "rgba(255,160,220,.1)", "rgba(180,255,180,.1)"][i]; ctx.beginPath(); ctx.arc(fx, fy, W * (.02 + .02 * i), 0, 7); ctx.fill(); });
        ctx.restore(); break;
      }
      case "glitch": {
        const d = t - tl.hit; if (d < 0 || d > .22) return;
        const r = rng(Math.floor(t * 60) + st.seed);
        const snap = canvas(W, H); snap.getContext("2d").drawImage(ctx.canvas, 0, 0);
        for (let i = 0; i < 7; i++) { const y = r() * H, h = r.uniform(.01, .05) * H, off = r.uniform(-.04, .04) * W; ctx.drawImage(snap, 0, y, W, h, off, y, W, h); }
        break;
      }
      case "grain_live": {
        this._noise = this._noise || noiseTile(256, st.seed + 3, 40);
        ctx.save(); ctx.globalAlpha = .28; ctx.translate(Math.floor(t * 97) % 256, Math.floor(t * 61) % 256);
        ctx.fillStyle = ctx.createPattern(this._noise, "repeat"); ctx.fillRect(-256, -256, W + 512, H + 512); ctx.restore(); break;
      }
      case "sparkle_field": {
        const r = rng(st.seed * 5), col = lum(this.p.accent) > .5 ? this.p.accent : "#ffffff";
        for (let i = 0; i < 22; i++) {
          const x = r() * W, y = r() * H, ph = r() * 2, u = ((t + ph) % 1.6) / .6;
          if (u > 0 && u < 1) star(ctx, x, y, W * .012 * Math.sin(Math.PI * u), col);
        }
        break;
      }
    }
  }

  _rgbShift(ctx, k) {
    if (!k) return;
    const W = this.W, H = this.H, snap = canvas(W, H), s = snap.getContext("2d");
    s.drawImage(ctx.canvas, 0, 0);
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = .35;
    ctx.drawImage(snap, k, 0); ctx.drawImage(snap, -k, 0); ctx.restore();
  }

  /** A still of the finished ad, for galleries. */
  stillAt(ctx, t) { this.still = null; this.frame(ctx, t ?? this.st.duration - .1, { subsFly: 1, subsMove: 1 }); }
}

export function star(ctx, x, y, s, col) {
  if (s < 1) return;
  const k = s * .18;
  ctx.save(); ctx.fillStyle = col; ctx.beginPath();
  ctx.moveTo(x, y - s); ctx.lineTo(x + k, y - k); ctx.lineTo(x + s, y); ctx.lineTo(x + k, y + k);
  ctx.lineTo(x, y + s); ctx.lineTo(x - k, y + k); ctx.lineTo(x - s, y); ctx.lineTo(x - k, y - k); ctx.closePath(); ctx.fill(); ctx.restore();
}

function randomChar(t, j) {
  const s = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789$#";
  return s[Math.abs(Math.floor(t * 24) * 31 + j * 7) % s.length];
}

// ------------------------------------------------------------ assets

export async function loadPhones(base = "./phones/") {
  const idx = await (await fetch(base + "index.json")).json();
  const phones = {};
  await Promise.all(idx.phones.map(m => new Promise(res => {
    const img = new Image(); img.decoding = "async";
    img.onload = () => { phones[m.id] = { img, meta: m }; res(); };
    img.onerror = () => res();
    img.src = base + m.id + ".webp";
  })));
  return { phones, index: idx.phones };
}

/** A phone the user uploads: key a plain ground away from the corners, crop to it. */
export async function phoneFromFile(file) {
  const url = URL.createObjectURL(file);
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
  const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
  const c = canvas(img.width * scale, img.height * scale), x = c.getContext("2d");
  x.drawImage(img, 0, 0, c.width, c.height);
  const d = x.getImageData(0, 0, c.width, c.height), a = d.data, w = c.width, h = c.height;
  let opaque = true; for (let i = 3; i < a.length; i += 4 * 97) if (a[i] < 250) { opaque = false; break; }
  if (opaque) {                                    // flood the ground from the corners
    const ref = [0, 0], seen = new Uint8Array(w * h), q = [];
    const cr = a[0], cg = a[1], cb = a[2];
    for (const [sx, sy] of [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]]) q.push(sy * w + sx);
    while (q.length) {
      const i = q.pop(); if (seen[i]) continue; seen[i] = 1;
      const o = i * 4; if (Math.abs(a[o] - cr) + Math.abs(a[o + 1] - cg) + Math.abs(a[o + 2] - cb) > 60) continue;
      a[o + 3] = 0; const xx = i % w, yy = (i / w) | 0;
      if (xx > 0) q.push(i - 1); if (xx < w - 1) q.push(i + 1); if (yy > 0) q.push(i - w); if (yy < h - 1) q.push(i + w);
    }
    x.putImageData(d, 0, 0);
  }
  const t = trim(c);
  // sample the band colour off the left edge
  const tx = t.getContext("2d").getImageData(Math.round(t.width * .02), Math.round(t.height * .5), 1, 1).data;
  const metal = "#" + [tx[0], tx[1], tx[2]].map(v => v.toString(16).padStart(2, "0")).join("");
  const out = new Image(); out.src = t.toDataURL("image/png");
  await new Promise(r => { out.onload = r; });
  URL.revokeObjectURL(url);
  const id = "upload-" + Date.now();
  return { id, img: out, meta: { id, model: "Your phone", finish: file.name.replace(/\.[^.]+$/, ""), metal, w: t.width, h: t.height, upload: true } };
}
