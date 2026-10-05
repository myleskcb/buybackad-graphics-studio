// Phone Ad Maker engine: draws one frame of an ad at any time t.
// Ported from iphoneslainv scripts/phone-ad/adengine (the Mac engine).

import { FONTS, FINE_FACES, PALETTES, FINISH_PALETTES, OPTIONS, WEIGHTS, FLAGS, HEADLINES, TAGS,
  NUMBER_LABELS, DEFAULT_STYLE, HOOKS, VIBES, BOARDS, COPY, GROUND_CANDIDATES, THEME_GROUNDS, SOUND_ALIASES, LATE_OPTIONS, KIT_BPM } from "./catalog.js";
import { AUDIENCES, GENERAL } from "./audiences.js";
import { pickVoice, voiceFits } from "./voices.js";
import { placeAccents, drawAccents, timeAccents } from "./accents.js";
import { vibeBackground, candidateGround, themeGround, freshGround, sceneryOver, buildBoard, drawBoard, freeSpot, drawStarburst, drawPinstripe, buildSpray, drawSpray,
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
/** WCAG contrast between two colours (1 to 21). */
export const contrastOf = (a, b) => {
  const L = h => hexRgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
  const x = L(a), y = L(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
};
/** Of near-black and white, whichever stands further off c. */
const inkOn = c => contrastOf(c, "#111111") >= contrastOf(c, "#ffffff") ? "#111111" : "#ffffff";

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

// The accents came after every other axis; they draw from a stream of their own so a
// look number keeps every choice it made before them.
const ACCENT_AXES = ["accents", "accent_set", "accent_kind", "accent_in", "accent_idle", "accent_out"];

/** A look named by a link (the Look Book, looks.html): a vibe, a ground or a phone set held,
 *  everything else drawn from the seed, the viewer's own words, number and phones kept. The
 *  library draws its thumbnail with this, and the maker opens the link with it, so the look
 *  picked is the look that opens. Returns { style, locked }. */
export function linkedLook(base, seed, pick = {}) {
  const locked = new Set(["phones", "number", "aspect"]);
  const st = { ...base };
  if (pick.aspect && ASPECTS[pick.aspect]) st.aspect = pick.aspect;
  if (pick.vibe && VIBES[pick.vibe]) { st.vibe = pick.vibe; locked.add("vibe"); }
  if (pick.bg && OPTIONS.background.includes(pick.bg)) { st.vibe = "none"; st.background = pick.bg; locked.add("vibe"); locked.add("background"); }
  if (pick.layout && OPTIONS.arrangement.includes(pick.layout)) { st.arrangement = pick.layout; locked.add("arrangement"); }
  return { style: harmonise(randomize(st, seed, locked, [], true), locked), locked };
}

/** Draw every unlocked design axis from the seed, each independently. */
export function randomize(st, seed, locked = new Set(), phonesPool = [], content = true) {
  const r = rng(seed * 7919 + 13);
  const out = { ...st, seed };
  for (const k of Object.keys(OPTIONS)) {
    if (k === "pose" || ACCENT_AXES.includes(k) || LATE_OPTIONS.includes(k)) continue;   // their own draws below, so older seeds keep their looks
    if (!locked.has(k)) out[k] = r.weighted(OPTIONS[k], WEIGHTS[k]);
  }
  if (!locked.has("pose")) out.pose = rng(seed * 4099 + 71).weighted(OPTIONS.pose, WEIGHTS.pose);
  const ra = rng(seed * 6151 + 29);
  for (const k of ACCENT_AXES) if (!locked.has(k)) out[k] = ra.weighted(OPTIONS[k], WEIGHTS[k]);
  const r2 = rng(seed * 6007 + 29);
  for (const k of LATE_OPTIONS) if (!locked.has(k)) out[k] = r2.weighted(OPTIONS[k], WEIGHTS[k]);
  for (const [k, p] of Object.entries(FLAGS)) if (!locked.has(k)) out[k] = r() < p;
  if (!locked.has("bpm")) out.bpm = r.int(96, 124);      // the tempo a commercial bed sits at
  audienceInto(out, r, locked);
  vibeInto(out, r, locked);
  backsFirst(out, locked);
  copyInto(out, r, locked, content);
  voiceInto(out, r, locked);
  if (!locked.has("phones") && phonesPool.length > 5) out.phones = pickPhones(phonesPool, r.pick([3, 3, 5, 5, 4]), r);
  return harmonise(out, locked);
}

/** An opening that shows the phones on frame 0 shows their backs: screen-up
 *  phones are black glass in the thumbnail. */
function backsFirst(out, locked) {
  if (!["hook_line", "word_beat"].includes(out.hook) && out.front_glimpse === "hold" && !locked.has("front_glimpse")) out.front_glimpse = "spin";
  return out;
}

/** An audience picks the look's vibe, music, grade and opening from what suits
 *  the people it speaks to (audiences.js); the vibe then draws the rest. The
 *  page calls this when an audience is picked by hand: the look, the words and
 *  the voice all follow. */
export function applyAudience(st, seed, locked = new Set()) {
  const out = { ...st }, r = rng(seed * 5153 + 41);
  audienceInto(out, r, locked);
  vibeInto(out, r, locked);
  backsFirst(out, locked);
  copyInto(out, r, locked, true);
  voiceInto(out, r, locked);
  return out;
}

function audienceInto(out, r, locked) {
  const a = AUDIENCES[out.audience];
  if (!a) return out;
  const L = a.looks || {};
  const set = (k, list) => { if (list && list.length && !locked.has(k)) out[k] = r.pick(list); };
  set("vibe", L.vibes); set("sound_kit", L.sound_kit); set("grade", L.grade); set("hook", L.hook); set("overlay", L.overlay); set("urgency", L.urgency);
  if (L.bpm && !locked.has("bpm")) out.bpm = r.int(L.bpm[0], L.bpm[1]);
  return out;
}

/** The speaker and the mood from the audience, then the take (voices.js). */
function voiceInto(out, r, locked) {
  const a = AUDIENCES[out.audience] || GENERAL;
  if (!locked.has("voice_mood")) out.voice_mood = r.pick(a.moods);
  if (!locked.has("voice_cast")) out.voice_cast = r.pick(a.casts);
  return pickVoice(out, r, locked);
}

/** A new voice for the ad as it stands (a mood or a speaker picked by hand). */
export function applyVoice(st, seed, locked = new Set()) {
  return pickVoice({ ...st }, rng(seed * 7727 + 3), locked);
}

/** An LA vibe draws the look's ground, palette, faces, treatment, sign board
 *  and decorations from its own pools, so one vibe is many looks. The page calls
 *  this when a vibe is picked by hand, so the pick shows at once. */
export function applyVibe(st, seed, locked = new Set()) {
  const out = { ...st };
  vibeInto(out, rng(seed * 4099 + 17), locked);
  return backsFirst(out, locked);
}

// Grounds that are a material (a cork board, a stucco wall, candy paint) belong to
// the vibe that paints them in its own colours; any other look draws the rest.
const VIBE_GROUNDS = new Set(["cork", "stucco", "concrete", "brick_night", "candy_flake", "asphalt", "velvet", "beach", "mural_wall", "fluoro"]);
// a spin-off of a vibe's ground belongs to the vibe as its parent does
for (const [id, c] of Object.entries(GROUND_CANDIDATES)) if (VIBE_GROUNDS.has(c.parent)) VIBE_GROUNDS.add(id);
for (const id of THEME_GROUNDS) VIBE_GROUNDS.add(id);     // the themes' materials belong to the themes

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
  // a look's own openings, kept when the one drawn (or the audience's) is already among them
  if (v.hooks && !v.hooks.includes(out.hook) && !locked.has("hook")) out.hook = r.pick(v.hooks);
  set("accent_set", v.accent_sets); set("accent_kind", v.accent_kinds); set("accent_in", v.accent_in);
  // a theme names a turned set without its side ("angled"); the side is drawn here, the same for every phone
  if (v.phone_angles && v.phone_angles.length && !locked.has("pose")) {
    const a = r.pick(v.phone_angles);
    out.pose = a === "angled" ? (r() < .5 ? "edge_left" : "edge_right") : a;
  }
  // a theme may hold any other axis to its own choices (its camera, its grade, its sound...)
  if (v.style) for (const [k, list] of Object.entries(v.style)) if (OPTIONS[k] || ["text_pos", "color_mode"].includes(k)) set(k, list);
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
  return a || (st.vibe && st.vibe !== "none" && (VIBES[st.vibe] || {}).la !== false ? "LA" : "");
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
  const mode = out.lang_mode || "en", aud = AUDIENCES[out.audience];
  // an audience that speaks Spanish first is drawn mostly in Spanish
  let lang = mode === "mix" ? r.weighted(["en", "es", "both"], aud && aud.lang === "es" ? { en: 1, es: 6, both: 3 } : { en: 5, es: 3, both: 2 }) : mode;
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
    // an audience's own lines speak for it, with its vibe's; the general pools fill only what it has none of
    const mine = ((aud && aud.copy && aud.copy[L] && aud.copy[L][key]) || []).map(fillIn(L)).filter(s => s != null);
    if (mine.length) return [...mine, ...mine, ...own.map(fillIn(L)).filter(s => s != null)];
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
  for (const [k, map] of Object.entries(SOUND_ALIASES)) if (map[st[k]]) st[k] = map[st[k]];
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
    const onPlate = ["sticker", "box", "highlighter", "cutout", "double_outline", "glass", "outline_shadow", "underline_bar"];
    if (darkInk && !halo && !onPlate.includes(st.text_fx) && !locked.has("text_fx")) st.text_fx = ["sticker", "box", "highlighter", "double_outline"][st.seed % 4];
    if (darkInk && st.text_fx === "neon") st.text_fx = "sticker";
    if (!darkInk && lum(p.accent) < 0.42 && st.color_mode !== "mono" && st.text_fx !== "box" && !locked.has("color_mode")) st.color_mode = "mono";
    // an outline or a neon tube only reads on a darker ground
    if (lum(p.ground) > .5 && ["outline", "neon"].includes(st.text_fx) && !locked.has("text_fx")) st.text_fx = st.text_fx === "outline" ? "double_outline" : "shadow";
    // a hairline outline only holds on a truly dark ground; elsewhere it gets the tight shadow
    if (lum(p.ground) > .25 && st.text_fx === "outline" && !locked.has("text_fx")) st.text_fx = "shadow";
  }
  if (lum(p.ground) > .4 && st.number_style === "neon" && !locked.has("number_style")) st.number_style = "pill";
  // one "quote" is enough: a tag and a label must not say the same thing twice
  if (st.tag && st.number_label && /QUOTE/i.test(st.tag) && /QUOTE/i.test(st.number_label) && !locked.has("number_label")) st.number_label = "";
  if (FINE_FACES.has(st.font) && ["outline", "neon", "double_outline", "cutout", "long_shadow", "block3d", "inline", "stamped", "pop_stack"].includes(st.text_fx) && !locked.has("text_fx")) st.text_fx = "shadow";
  if (st.case === "title" && !locked.has("tracking")) st.tracking = Math.min(st.tracking, 0.05);
  if ((FONTS[st.font] || [])[3] === "wide" && !locked.has("tracking")) st.tracking = Math.min(st.tracking, 0.01);
  if (st.decor.includes("sparkle")) st.sparkles = true;
  // the sound: each newer groove at its own tempo, a tune only over a groove, and no
  // church organ on a tune of fast runs
  const kb = KIT_BPM[st.sound_kit];
  if (kb && !locked.has("bpm") && (st.bpm < kb[0] || st.bpm > kb[1])) st.bpm = kb[0] + (st.seed >>> 0) % (kb[1] - kb[0] + 1);
  if (!OPTIONS.melody.includes(st.melody)) st.melody = "none";
  if (!OPTIONS.lead.includes(st.lead)) st.lead = "piano";
  if (!OPTIONS.accent.includes(st.accent)) st.accent = "none";
  if (st.sound_kit === "none" && !locked.has("melody")) st.melody = "none";
  if (["bumblebee", "turkish_march", "fur_elise", "entertainer", "mountain_king"].includes(st.melody) && st.lead === "organ" && !locked.has("lead"))
    st.lead = ["piano", "marimba", "xylophone", "harpsichord"][st.seed % 4];
  // a take that no longer fits (a shorter ad, another language, a bank that arrived late) is picked again, the same way every time
  if (!voiceFits(st)) pickVoice(st, rng(st.seed * 53 + 7), locked);
  return st;
}

/** The colours of type set ON a sign board: the board's, not the scene's. */
// The colour each sign's face is painted (null: a face picked at random among light cards,
// which read as light; "plate": the palette's plate). The words' accent must stand out from
// it as well as from the ink: a store sign painted the accent's own yellow lost the whole
// accent line of its headline (audit 2026-10-01, "PHONES INTO CASH" read "PHONES").
const BOARD_FACE = { freeway: "#006b3f", freeway_blue: "#1d4f9c", poster: null, bandit_yellow: "#ffd21a", bandit_white: "#f6f6f1",
  flyer: "#fbfaf5", neon_box: "#0c0618", marquee: "#fffaf0", store_sign: "plate", price_tag: null, chalkboard: "#24382f",
  receipt: "#fbfbf7", wanted_poster: "#e9d3a6", sticky_note: null, speech_bubble: "#ffffff", ticket_stub: "plate",
  led_panel: "#0b0b0d", lightbox: "#ffffff", postcard: "#fffdf6" };
function boardPalette(b, p) {
  let ink = b.ink;
  if (ink === "auto") ink = lum(p.plate) > .55 ? "#111111" : "#ffffff";
  let accent = b.accent ?? p.accent;
  const kind = Object.keys(BOARDS).find(k => BOARDS[k] === b), f = BOARD_FACE[kind], face = f === "plate" ? (p.plate || "#c1121f") : f || "#fff5a0";
  if (Math.abs(lum(accent) - lum(face)) < .3) accent = [p.accent, "#e4002b", "#1d4ed8", ink].find(c => Math.abs(lum(c) - lum(face)) >= .3 && Math.abs(lum(c) - lum(ink)) >= .2) || ink;
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

/** What the model really has, read off its name: a notch (14, 14 Plus, 16e,
 *  17e) or the Dynamic Island (14 Pro on); the mute switch (14 and older, and the
 *  15 and 15 Plus) or the Action button (15 Pro, and every model from the 16);
 *  Camera Control (16 on, not the e models); how deep the
 *  body is for its width, and where its edge controls sit. A phone we cannot
 *  place (an upload) gets the island, only volume and power, and the usual depth. */
export function designOf(model) {
  const m = /iPhone (\d+)(e)?(?: (Pro Max|Pro|Plus))?/.exec(model || "");
  if (!m) return { notch: false, left: null, camCtrl: false, depth: THICKNESS, controls: CONTROLS };
  const gen = +m[1], e = !!m[2], pro = /Pro/.test(m[3] || "");
  const name = `iPhone ${gen}${e ? "e" : ""}${m[3] ? " " + m[3] : ""}`, body = BODY[name];
  return { notch: e || gen < 14 || (gen === 14 && !pro), left: gen < 15 || (gen === 15 && !pro) ? "mute" : "action", camCtrl: gen >= 16 && !e,
    depth: body ? body[1] / body[0] : THICKNESS, controls: { ...CONTROLS, ...MEASURED_CONTROLS[name] } };
}

// Apple's published width and depth of each body in mm (the depth without the
// camera), so a Pro Max turns a thinner edge than a Pro and a 17 Pro a deeper one
// than a 16 Pro. The 18 Pro is drawn on the 17 Pro's body, as the phone audit's
// SPEC has it.
const BODY = {
  "iPhone 14": [71.5, 7.80], "iPhone 14 Plus": [78.1, 7.80], "iPhone 14 Pro": [71.5, 7.85], "iPhone 14 Pro Max": [77.6, 7.85],
  "iPhone 15": [71.6, 7.80], "iPhone 15 Plus": [77.8, 7.80], "iPhone 15 Pro": [70.6, 8.25], "iPhone 15 Pro Max": [76.7, 8.25],
  "iPhone 16": [71.6, 7.80], "iPhone 16 Plus": [77.8, 7.80], "iPhone 16 Pro": [71.5, 8.25], "iPhone 16 Pro Max": [77.6, 8.25],
  "iPhone 16e": [71.5, 7.80], "iPhone 17": [71.5, 7.95], "iPhone 17e": [71.5, 7.80],
  "iPhone 17 Pro": [71.9, 8.75], "iPhone 17 Pro Max": [78.0, 8.75], "iPhone 18 Pro": [71.9, 8.75], "iPhone 18 Pro Max": [78.0, 8.75],
};

// Where the edge controls sit, as a share of the height from the top (Apple's
// dimension drawings). Left and right are as you look at the screen.
const CONTROLS = { mute: [.183, .213], action: [.176, .216], volUp: [.256, .33], volDown: [.352, .426], power: [.27, .405], camCtrl: [.565, .64] };
// ...except where a factory back shows the control itself, standing proud of the
// rail, and it sits elsewhere: then it is drawn where the photograph has it, or a
// turned phone shows two side buttons. The 17 and 18 Pro's side button is 46.8 to
// 64.4 mm from the top on both sizes (scripts/audit_phone_views.py measures it).
const MEASURED_CONTROLS = {
  "iPhone 17 Pro": { power: [.311, .429] }, "iPhone 17 Pro Max": { power: [.287, .394] },
  "iPhone 18 Pro": { power: [.312, .429] }, "iPhone 18 Pro Max": { power: [.287, .393] },
};

// A turned phone is drawn as what it is: a rounded slab as deep as its model, turned
// about its long axis and seen through a lens a few phone-heights away, the way
// a product shot is lit and framed. The near edge stands a little taller than
// the far one, the side is a solid band that wraps the corners, and the face
// falls off toward its far edge.
const LENS = 6.5;                                  // camera distance, in phone heights
// The Wide 3-D spin is shot through a wide lens, close in, so the turn reads big. Any
// closer and the far edge breaks into the strips the face is drawn in.
const WIDE_LENS = 2.2;

function outline(x0, y0, x1, y1, [tl, tr, br, bl], n = 9) {   // a rounded rectangle, clockwise
  const pts = [];
  for (const [cx, cy, r, a0] of [[x1 - tr, y0 + tr, tr, -Math.PI / 2], [x1 - br, y1 - br, br, 0], [x0 + bl, y1 - bl, bl, Math.PI / 2], [x0 + tl, y0 + tl, tl, Math.PI]])
    for (let i = 0; i <= n; i++) { const a = a0 + i / n * Math.PI / 2; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return pts;
}

// A canvas draws an image's rectangle with hard edges, snapped to whole pixels, and the backs
// are trimmed to the phone, so the phone's outline was that rectangle and jumped a pixel
// column at a time as it turned. Drawn from a copy with a clear border PAD px wide, the snap
// falls on clear pixels and the outline moves as smoothly as the picture.
const PAD = 2, PADDED = new WeakMap();
function padded(img) {
  let c = PADDED.get(img);
  if (!c) {
    c = canvas((img.naturalWidth || img.width) + 2 * PAD, (img.naturalHeight || img.height) + 2 * PAD);
    c.getContext("2d").drawImage(img, PAD, PAD);
    PADDED.set(img, c);
  }
  return c;
}

// The body as its back photograph draws it: where its straight edges stand (a button proud of
// the rail makes the trimmed photo wider than the body) and how round each corner is, as
// shares of the photo's width and height. The turned slab is built on it, so near flat no
// part of the slab shows past the photograph. Built on a rounded rectangle the photo's full
// size, an 18 Pro showed a dark sliver down its left side and round its corners, which went
// all at once as the phone came flat. Measured once per photo; null where it cannot be.
const BODIES = new WeakMap();
function bodyOf(img) {
  if (!img || typeof img !== "object") return null;
  if (BODIES.has(img)) return BODIES.get(img);
  let body = null;
  try {
    const W = img.naturalWidth || img.width, H = img.naturalHeight || img.height;
    if (W > 40 && H > 40) {
      const c = canvas(W, H), x = c.getContext("2d", { willReadFrequently: true });
      x.drawImage(img, 0, 0);
      const a = x.getImageData(0, 0, W, H).data, on = (i, j) => a[(j * W + i) * 4 + 3] > 128;
      const first = (n, f) => { for (let k = 0; k < n; k++) if (f(k)) return k; return n; };
      const med = v => v.sort((p, q) => p - q)[v.length >> 1], rows = [], cols = [];
      for (let j = Math.round(H * .15); j < H * .85; j += 4) rows.push(j);
      for (let i = Math.round(W * .3); i < W * .7; i += 4) cols.push(i);
      const L = med(rows.map(j => first(W, i => on(i, j)))), R = W - 1 - med(rows.map(j => first(W, i => on(W - 1 - i, j))));
      const T = med(cols.map(i => first(H, j => on(i, j)))), B = H - 1 - med(cols.map(i => first(H, j => on(i, H - 1 - j))));
      // a corner's radius: the circle that best fits how far in from the straight edge each
      // row near the corner starts (sx, sy: 1 from the left or top, -1 from the right or bottom)
      const radius = (sx, sy) => {
        const x0 = sx > 0 ? L : R, y0 = sy > 0 ? T : B, pts = [];
        for (let d = 0; d < W * .3; d++) pts.push([d, first(Math.round(W * .4), k => on(x0 + sx * k, y0 + sy * d))]);
        let best = [Infinity, CORNER * W];
        for (let r = W * .06; r < W * .3; r += .5) {
          let e = 0;
          for (const [d, o] of pts) e += ((d < r ? r - Math.sqrt(r * r - (r - d) ** 2) : 0) - o) ** 2;
          if (e < best[0]) best = [e, r];
        }
        return best[1] / W;
      };
      const b = { l: L / W, r: (W - 1 - R) / W, t: T / H, b: (H - 1 - B) / H, rad: [radius(1, 1), radius(-1, 1), radius(-1, -1), radius(1, -1)] };
      if (Math.max(b.l, b.r, b.t, b.b) < .04 && b.rad.every(r => r > .08 && r < .28)) body = b;
    }
  } catch (e) { /* a photo we cannot read: the slab keeps the usual outline */ }
  BODIES.set(img, body);
  return body;
}

function poly(ctx, pts) {
  ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
}

function hull(pts) {                               // the convex hull, by the monotone chain
  const a = pts.slice().sort((p, q) => p[0] - q[0] || p[1] - q[1]), lo = [], up = [];
  const turn = (o, p, q) => (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]);
  for (const q of a) { while (lo.length > 1 && turn(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = a.length - 1; i >= 0; i--) { const q = a[i]; while (up.length > 1 && turn(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}

function drawSlab(ctx, p, w, h, flip, face, rot = 0, src = [0, 0, face.width, face.height]) {
  const c = Math.cos(flip), s = Math.sin(flip), T = (p.design.depth || THICKNESS) * w, D = (p.lens || LENS) * h, R = CORNER * w;
  // local x runs to the screen's right, zl out of the screen; sin > 0 brings the
  // screen's right-hand edge (power) toward the lens, sin < 0 its left (volume)
  // The lens is focused on the face we see, not on the middle of the body: square on, that
  // face then stands at its photograph's own size. (Focused half a body deeper, it stood half a
  // percent large, and the phone jumped a pixel and a half where the bare photo took over.)
  const seen = c >= 0 ? T / 2 : -T / 2, focus = D - seen * c;
  const P = (x, y, zl) => { const X = x * c - zl * s, f = focus / (D - (x * s + zl * c)); return [X * f, y * f]; };
  // the back photograph lies mirrored on the slab: its left edge is the slab's right (+x). The
  // body stands 0.8 px inside the photograph's outline, so the photo's soft edge never shows
  // the side through it (seen flat, its edge pixels darkened by a pixel's width, then let go)
  const b = p.body, inset = .8, rim = b
    ? outline(-w / 2 + b.r * w + inset, -h / 2 + b.t * h + inset, w / 2 - b.l * w - inset, h / 2 - b.b * h - inset, [b.rad[1], b.rad[0], b.rad[3], b.rad[2]].map(r => Math.max(0, r * w - inset)))
    : outline(-w / 2 + inset, -h / 2 + inset, w / 2 - inset, h / 2 - inset, [R, R, R, R].map(r => r - inset));
  // the side: the outline swept from the hidden face to the seen one, brushed
  // metal dark at both rims with a highlight a little in from the near face
  const steps = Math.min(30, Math.max(6, Math.ceil(T * Math.abs(s) / 1.2)));
  // Each slice is filled back to a slice and a half behind it: side-on, an outline is only
  // a line, and outlines alone left a phone at 90 degrees a hairline beside its full shadow
  // (and slices that only met left a see-through seam where their soft edges touched).
  for (let k = 0; k <= steps; k++) {
    const u = k / steps, zl = -seen + 2 * seen * u, at = rim.map(([x, y]) => P(x, y, zl));
    const zb = -seen + 2 * seen * Math.max(0, (k - 1.5) / steps);
    poly(ctx, k ? hull(rim.map(([x, y]) => P(x, y, zb)).concat(at)) : at);
    // a side measured in its own aluminium (RAIL, the 17 and 18 Pros) is lit as a surface and
    // averages to that colour; any other is the body's own colour a shade darker, never lighter
    // than the body (owner, 2026-10-04: "we made sure the sides aren't too light ... darken
    // them to the proper body color"), the soft highlight only lifting it back toward it
    ctx.fillStyle = p.railLin ? litRail(p.railLin, u) : shade(p.metal, -.3 + .24 * Math.exp(-((u - .62) ** 2) / .03) + .04 * u); ctx.fill();
  }
  // the controls on the side we see, where Apple puts them. They come into view as that side
  // turns toward the lens, over the first 3.4 degrees: perspective alone gave them most of a
  // pixel square on, so they jumped from one edge to the other as the phone passed flat.
  const d = p.design, xs = (s > 0 ? 1 : -1) * w / 2 * 1.003;
  const keys = s > 0 ? ["power", ...(d.camCtrl ? ["camCtrl"] : [])] : [...(d.left ? [d.left] : []), "volUp", "volDown"];
  const shown = clamp(Math.abs(s) / .06), alpha = ctx.globalAlpha;
  ctx.globalAlpha = alpha * shown;
  for (const key of shown > 0 ? keys : []) {
    const [a0, b0] = (d.controls || CONTROLS)[key], y0 = -h / 2 + a0 * h, y1 = -h / 2 + b0 * h, q = T * .22;
    poly(ctx, [P(xs, y0, -q), P(xs, y0, q), P(xs, y1, q), P(xs, y1, -q)]);
    // Camera Control sits flush in the rail, filled in the body's colour with a fine seam
    // round it: drawn dark it read as an empty SIM-tray slot (owner, 2026-10-04: "The camera
    // control button is body color"). Neither it nor the keys' lit edge is lighter than the body.
    if (key === "camCtrl") {
      ctx.fillStyle = shade(p.metal, -.3); ctx.fill();
      poly(ctx, [P(xs, y0 + 1, -q * .72), P(xs, y0 + 1, q * .72), P(xs, y1 - 1, q * .72), P(xs, y1 - 1, -q * .72)]);
      ctx.fillStyle = shade(p.metal, -.06); ctx.fill();
      continue;
    }
    ctx.fillStyle = shade(p.metal, -.38); ctx.fill();
    poly(ctx, [P(xs, y0 + 1, q * .1), P(xs, y0 + 1, q * .45), P(xs, y1 - 1, q * .45), P(xs, y1 - 1, q * .1)]);
    ctx.fillStyle = shade(p.metal, -.14); ctx.fill();   // a lit edge, still no lighter than the body
  }
  ctx.globalAlpha = alpha;
  // the face, in thin vertical strips so it recedes; the back is seen from behind
  const [sx, sy, fw, fh] = src, X = u => (c >= 0 ? u - .5 : .5 - u) * w;
  const near = P(X(0), 0, seen)[0], far = P(X(1), 0, seen)[0];
  const n = Math.min(96, Math.max(12, Math.ceil(Math.abs(far - near) / 3)));
  for (let i = 0; i < n; i++) {
    const [xa, ta] = P(X(i / n), -h / 2, seen), [xb, tb] = P(X((i + 1) / n), -h / 2, seen);
    // each strip overlaps the next by 0.6 px so no seam shows, but never runs past the face, and
    // the overlap takes in more of the photograph rather than stretching the strip over it
    const top = (ta + tb) / 2, x0 = Math.min(xa, xb), span = Math.abs(xb - xa);
    let dw = Math.min(span + .6, Math.max(near, far) - x0), sw = Math.min(fw / n * (span > 1e-6 ? dw / span : 1), fw * (1 - i / n));
    // the clear border round the photograph comes too, so no hard edge falls on the phone
    const kx = span / (fw / n), ky = -2 * top / fh;
    let s0 = sx + i / n * fw, d0 = x0;
    if (i === 0) { s0 -= PAD; sw += PAD; d0 -= PAD * kx; dw += PAD * kx; }
    if (i === n - 1) { sw += PAD; dw += PAD * kx; }
    ctx.drawImage(face, s0, sy - PAD, sw, fh + 2 * PAD, d0, top - PAD * ky, dw, -2 * top + 2 * PAD * ky);
  }
  // light: the face falls off toward the edge turned away from the lens
  const ns = s > 0 ? 1 : -1, k = Math.abs(s);
  const g = ctx.createLinearGradient(P(ns * w / 2, 0, seen)[0], 0, P(-ns * w / 2, 0, seen)[0], 0);
  g.addColorStop(0, `rgba(255,255,255,${.07 * k})`); g.addColorStop(.35, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(0,0,0,${.3 * k})`);
  poly(ctx, rim.map(([x, y]) => P(x, y, seen))); ctx.fillStyle = g; ctx.fill();
  // a turning back catches the key light (high on the left, where the shadows fall
  // from): a soft band crosses it, away from the light, as its face turns about 20
  // degrees toward it. Square to the lens or resting on an edge it is gone, so a still
  // phone looks as it did and only a moving one shows it. However the phone lies in the
  // frame the light stays where it is: a turn about its long axis faces it toward the
  // light only as far as that axis lies across the light (on its side, the turn tips it up).
  if (c < 0) {
    const ra = -rot * Math.PI / 180, across = Math.cos(ra) + Math.sin(ra);
    const phi = Math.asin(clamp(-s * across, -1, 1)), uc = .5 + Math.sign(across) * (phi - SHEEN_AT) * 6, a = .13 * clamp(Math.abs(c) * 3);
    if (a > .004 && uc > -.6 && uc < 1.6) {
      const xL = Math.min(near, far), xR = Math.max(near, far), xc = lerp(xL, xR, uc), sd = (xR - xL) * .22;
      const g2 = ctx.createLinearGradient(xc - 2.5 * sd, 0, xc + 2.5 * sd, 0);
      [[0, 0], [.25, .46], [.5, 1], [.75, .46], [1, 0]].forEach(([u, v]) => g2.addColorStop(u, `rgba(255,255,255,${a * v})`));
      poly(ctx, rim.map(([x, y]) => P(x, y, seen))); ctx.fillStyle = g2; ctx.fill();
    }
  }
}
const BLUR_STEP = 3;                               // px a phone corner may move between two moments of one frame (export)
/** How an exported video's frames are drawn: 8 moments of the shutter while phones fly, 4
 *  while they turn over, up to 24 where they move fast enough to need them (Ad._subsFor). */
export const EXPORT_QUALITY = { subsFly: 8, subsMove: 4, maxSubs: 24 };
const SHEEN_AT = .35;                              // radians a back turns toward the key light before it catches it full on

/** The screen side, switched off: the band, a black border, OLED glass and the
 *  Dynamic Island as a pill only slightly darker than the glass. Drawn centred.
 *  `screen`, an image, lights the glass with it (a wallpaper), under the glare
 *  and the island. */
function drawFront(ctx, w, h, metal, glare, rot, flip, cxNorm, notch = false, screen = null) {
  const R = CORNER * w;
  rrect(ctx, -w / 2, -h / 2, w, h, R); ctx.fillStyle = metal; ctx.fill();
  const b = 0.014 * w;
  rrect(ctx, -w / 2 + b, -h / 2 + b, w - 2 * b, h - 2 * b, R - b); ctx.fillStyle = "#050506"; ctx.fill();
  const s = b + 0.032 * w, sw = w - 2 * s, sh = h - 2 * s, sr = R - s * 1.05;
  rrect(ctx, -w / 2 + s, -h / 2 + s, sw, sh, sr); ctx.fillStyle = "#111215"; ctx.fill();
  if (screen) {
    ctx.save(); rrect(ctx, -w / 2 + s, -h / 2 + s, sw, sh, sr); ctx.clip();
    ctx.drawImage(screen, -w / 2 + s, -h / 2 + s, sw, sh); ctx.restore();
  }
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
  let lr, lx, ly;
  if (notch) {                                     // hangs from the top edge of the glass, with rounded shoulders
    const nw = 0.4 * sw, nh = 0.082 * sw, top = -h / 2 + s, r = nh * .42, sr2 = nh * .22;
    ctx.beginPath();
    ctx.moveTo(-nw / 2 - sr2, top);
    ctx.arcTo(-nw / 2, top, -nw / 2, top + sr2, sr2);
    ctx.lineTo(-nw / 2, top + nh - r); ctx.arcTo(-nw / 2, top + nh, -nw / 2 + r, top + nh, r);
    ctx.lineTo(nw / 2 - r, top + nh); ctx.arcTo(nw / 2, top + nh, nw / 2, top + nh - r, r);
    ctx.lineTo(nw / 2, top + sr2); ctx.arcTo(nw / 2, top, nw / 2 + sr2, top, sr2);
    ctx.closePath(); ctx.fillStyle = "#050506"; ctx.fill();
    lr = nh * .17; lx = nw * .2; ly = top + nh * .5;
  } else {
    const iw = 0.315 * sw, ih = 0.093 * sw, top = -h / 2 + s + 0.034 * sw;
    rrect(ctx, -iw / 2, top, iw, ih, ih / 2); ctx.fillStyle = "#070708"; ctx.fill();
    lr = ih * .3; lx = iw / 2 - ih / 2; ly = top + ih / 2;
  }
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

// On a 17 or 18 Pro the sides and the camera plateau are one piece of anodised aluminium,
// so the side is the plateau's colour, measured off each factory back (the median of two
// clear patches of plateau; scripts/audit_phone_views.py checks it). index.json's "metal"
// is read off the back's thin rim, where the studio light catches it: 1.1 to 3.4 times too
// light on these, the Cosmic Orange's side a peach.
export const RAIL = {
  "17-pro-cosmic-orange": "#ed8d50", "17-pro-max-cosmic-orange": "#ee8c50", "17-pro-deep-blue": "#434a61",
  "17-pro-max-deep-blue": "#434a61", "17-pro-silver": "#d9d9d8", "17-pro-max-silver": "#dadada",
  "18-pro-burgundy": "#5d333a", "18-pro-max-burgundy": "#5e343b", "18-pro-glacier": "#bbc8d9",
  "18-pro-max-glacier": "#bbc8da", "18-pro-black": "#262628", "18-pro-max-silver": "#e4e5e2",
};

// A side whose colour is its metal's own (RAIL) is lit as a surface is: the colour scaled by
// the light in linear terms, darker at both rims and brightest a little in from the near face,
// with a faint white glint, so it keeps its hue and averages to itself. Mixed toward black and
// white, as the rim-read sides still are, a saturated colour went brown at the rims and pale
// between: the Cosmic Orange's side read peach.
const toLin = v => (v /= 255) <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
const toSrgb = v => Math.round(255 * (v <= .0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - .055));
function litRail(lin, u) {
  const f = .61 + .72 * Math.exp(-((u - .6) ** 2) / .1), glint = .035 * Math.exp(-((u - .64) ** 2) / .006);
  return `rgb(${lin.map(v => toSrgb(Math.min(1, v * f + glint))).join(",")})`;
}

const SHADOWS = new Map();
export class Phone {
  constructor(img, meta, ph) {
    this.img = img; this.meta = meta;
    this.h = ph; this.w = ph * (meta.w / meta.h);
    this.metal = RAIL[meta.id] || meta.metal;
    this.railLin = RAIL[meta.id] ? hexRgb(RAIL[meta.id]).map(toLin) : null;
    this.body = bodyOf(img);
    this.design = designOf(meta.model);
    // the same size of phone casts the same shadows: made once (a look lays its phones out
    // afresh for each place it tries for the words)
    const sk = Math.round(this.w) + "x" + Math.round(this.h);
    this.shadows = SHADOWS.get(sk) || SHADOWS.set(sk, [2, 10, 22].map(b => shadowSprite(this.w, this.h, b * ph / 400))).get(sk);
    if (SHADOWS.size > 64) SHADOWS.delete(SHADOWS.keys().next().value);
    Object.assign(this, { home: [0, 0], angle: 0, size: 1, reveal: false, landsBack: false, start: [0, 0], arc: [0, 0],
      spin: 1, flips: 1, tIn: 0, tLand: 1, tReveal: 99, side: 1, glare: null, screen: null });
  }
}

export function drawPhone(ctx, p, x, y, scale, rot, flip, z, op, W, tint, noShadow = false) {
  const c = Math.cos(flip), ac = Math.abs(c), front = c >= 0;
  const w = p.w * scale, h = p.h * scale;
  const zz = clamp(z, 0, 1);
  // shadow: tight when it lies flat, big and soft in the air. It softens with the
  // height, blended between the two nearest blurs (picking one jumped at a third and
  // two thirds of the way up), and is as wide as the turned body, its edge included.
  if (!noShadow) {                                  // a reflection casts none
    const f = zz * 2, i0 = Math.min(1, Math.floor(f)), k = f - i0, a = op * .42 * (1 - .55 * zz);
    const a0 = a * (1 - k), a1 = k > 0 ? (a - a0) / (1 - a0) : 0;   // the two together as dark as one
    ctx.save();
    ctx.translate(x + W * (.006 + .03 * zz), y + W * (.010 + .045 * zz));
    ctx.rotate(-rot * Math.PI / 180);
    ctx.scale(scale * Math.max(ac + (p.design.depth || THICKNESS) * Math.abs(Math.sin(flip)), .02), scale);
    for (const [sh, al] of [[p.shadows[i0], a0], [p.shadows[i0 + 1], a1]]) {
      if (al <= .001) continue;
      ctx.globalAlpha = al; ctx.drawImage(sh.c, -p.w / 2 - sh.pad, -p.h / 2 - sh.pad);
    }
    ctx.restore();
  }

  ctx.save();
  ctx.globalAlpha = op;
  ctx.translate(x, y);
  ctx.rotate(-rot * Math.PI / 180);
  // The phone is always the slab, in perspective, flat to the lens too: it is built to its
  // photograph's outline and size, so square on it is the photograph. (Drawn as the bare
  // photograph near flat, it changed at the hand-over: a dark edge blinked out at 0.86 degrees,
  // and its buttons jumped edges.)
  let face = padded(p.img), src = [PAD, PAD, p.img.naturalWidth || p.img.width, p.img.naturalHeight || p.img.height];
  if (front) {
    // the screen is drawn at twice the size and taken down, so its hairline frame stays as
    // crisp as one drawn in place
    const fc = p._front || (p._front = canvas(1, 1)), ss = 2;
    fc.width = Math.ceil(w * ss) + 2 * PAD * ss; fc.height = Math.ceil(h * ss) + 2 * PAD * ss;
    const fx = fc.getContext("2d"); fx.translate(fc.width / 2, fc.height / 2); fx.scale(ss, ss);
    drawFront(fx, w, h, p.metal, p.glare, rot, flip, x / W, p.design.notch, p.screen);
    face = fc; src = [(fc.width - w * ss) / 2, (fc.height - h * ss) / 2, w * ss, h * ss];   // the screen as drawn, not the canvas's rounded-up size
  }
  drawSlab(ctx, p, w, h, flip, face, rot, src);
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

function arrangement(name, n, r, tall, s) {
  if (s && LAID_OUT[name]) return laidOut(name, n, r, tall, s);
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
    // round a circle, each phone standing up with a lean along it (turned to point out from the
    // middle they lay on their sides in a cross, the placement audit's worst square layout)
    case "ring": for (let i = 0; i < n; i++) { const th = i / n * Math.PI * 2 - Math.PI / 2 + Math.PI / n; add(Math.cos(th) * .72, Math.sin(th) * .6, -Math.cos(th) * 16 + r.uniform(-4, 4), .78); } break;
    case "staircase": lin(-.8, .8).forEach((x, i) => add(x, .35 - i * .7 / Math.max(1, n - 1), 0, .9)); break;
    case "crossed": for (let i = 0; i < n; i++) add((i - (n - 1) / 2) * .28, (i % 2 ? .08 : -.08), i % 2 ? 32 : -32, 1); break;
    case "giants": for (let i = 0; i < n; i++) add(lerp(-1.15, 1.15, n > 1 ? i / (n - 1) : .5), r.uniform(-.1, .25), r.uniform(-30, 30), 1.35); break;
    case "pairs": for (let i = 0; i < n; i++) { const g = Math.floor(i / 2), ng = Math.ceil(n / 2); add(lerp(-.7, .7, ng > 1 ? g / (ng - 1) : .5) + (i % 2 ? .12 : -.12), i % 2 ? .08 : -.05, i % 2 ? 12 : -12, .95); } break;
    default: return arrangement("row", n, r, tall);
  }
  return out;
}

/** The layouts drawn in the phones' own measure rather than the stage's: each is laid
 *  out in pixels, in phone heights (PH) and phone widths (PW), as it would stand at full
 *  size, then centred on the stage and made smaller as a whole (never bent) until the
 *  group is no wider than the frame and no taller than one and a half phones or 90% of it. A fifth
 *  number on a spot is its depth: the phone with the higher one stands in front and
 *  lands last. */
const LAID_OUT = {
  // a hand of cards: a tight fan about one point under the hand
  hand(n, r, tall, PH) {
    const half = Math.min(32, 9 * (n - 1)), R = PH * .7;
    return spots(n, t => { const f = lerp(-half, half, t) * Math.PI / 180; return [R * Math.sin(f), -R * Math.cos(f), -f * 180 / Math.PI, 1, 0]; });
  },
  // each leaning further than the one before, as dominoes fall
  domino(n, r, tall, PH, PW) {
    const d = r() < .5 ? -1 : 1, step = PW * (tall ? .78 : .92);
    return spots(n, (t, i) => { const th = lerp(3, 36, t) * Math.PI / 180, x = d * (i - (n - 1) / 2) * step;
      return [x + d * Math.sin(th) * PH / 2, -Math.cos(th) * PH / 2, -d * th * 180 / Math.PI, 1, 0]; });
  },
  // the middle phone stands highest and largest, the rest step down and out
  podium(n, r, tall, PH, PW) {
    const step = PW * (tall ? .74 : .86);
    return spots(n, (t, i) => { const o = i - (n - 1) / 2, k = Math.abs(o) / Math.max(1, (n - 1) / 2);
      return [o * step * (1 - .1 * k), PH * .22 * k, -Math.sign(o) * 5 * k, 1.1 - .24 * k, -Math.abs(o)]; });
  },
  // along a wave, each turned with the slope under it
  wave(n, r, tall, PH, PW) {
    const f0 = r() < .5 ? 0 : Math.PI, A = PH * .2, span = PW * (tall ? .8 : .95) * (n - 1);
    return spots(n, t => { const f = f0 + 1.5 * Math.PI * t, slope = n > 1 ? A * 1.5 * Math.PI * Math.cos(f) / span : 0;
      return [lerp(-span / 2, span / 2, t), A * Math.sin(f), Math.atan(slope) * 57.3 * -.8, 1, 0]; });
  },
  // a peacock's tail: all standing out from one point low in the middle
  burst(n, r, tall, PH) {
    const half = Math.min(40, 14 * (n - 1)), R = PH * .5;
    return spots(n, t => { const f = lerp(-half, half, t); const a = f * Math.PI / 180;
      return [R * Math.sin(a), -R * Math.cos(a), -f, 1, -Math.abs(f)]; });
  },
  // a line going away from the viewer: the nearest largest, each further one smaller and higher
  runway(n, r, tall, PH, PW) {
    const d = r() < .5 ? -1 : 1, out = []; let x = 0;
    for (let i = 0; i < n; i++) {
      const sc = 1.12 * .8 ** i;
      if (i) x += d * PW * .6 * (sc + 1.12 * .8 ** (i - 1)) / 2;
      out.push([x, -i * PH * .08 - sc * PH / 2, d * -3, sc, -i]);
    }
    return out;
  },
  // a group photo: a back row standing higher, a front row between them
  group(n, r, tall, PH, PW) {
    const back = Math.ceil(n / 2), front = n - back, S = PW * 1.1, out = [];
    for (let i = 0; i < back; i++) out.push([(i - (back - 1) / 2) * S, -PH * .22, r.uniform(-5, 5), .88, 0]);
    // the front row stands in the gaps of the back row
    for (let i = 0; i < front; i++) out.push([(i - (back - 1) / 2 + .5) * S, PH * .2, r.uniform(-5, 5), 1.02, 1]);
    return out;
  },
  // two large phones at the ends lean in over a smaller row between them
  bookends(n, r, tall, PH, PW) {
    if (n < 3) return LAID_OUT.podium(n, r, tall, PH, PW);
    const m = n - 2, gap = PW * .74, end = (m - 1) / 2 * gap + PW * .95, out = [];
    out.push([-end, 0, -12, 1.12, 1]);
    for (let i = 0; i < m; i++) out.push([(i - (m - 1) / 2) * gap, PH * .12, i % 2 ? 4 : -4, .8, 0]);
    out.push([end, 0, 12, 1.12, 1]);
    return out;
  },
  // on a shelf in a shop: standing side by side on one line, the last leaning on its neighbour
  shelf(n, r, tall, PH, PW) {
    const rows = tall && n >= 4 ? 2 : 1, per = Math.ceil(n / rows), out = [];
    for (let row = 0; row < rows; row++) {
      const k = Math.min(per, n - row * per), sizes = Array.from({ length: k }, () => r.uniform(.9, 1.04));
      const lean = k > 1 && r() < .6;
      const width = sizes.reduce((a, b) => a + b, 0) * PW * 1.06;
      let x = -width / 2;
      sizes.forEach((sc, i) => {
        const tilt = lean && i === k - 1 ? 10 : 0;
        x += sc * PW * 1.06 / 2;
        out.push([x + (tilt ? PW * .12 : 0), row * PH * 1.08 - sc * PH / 2 + (tilt ? PH * .01 : 0), -tilt, sc, 0]);
        x += sc * PW * 1.06 / 2;
      });
    }
    return out;
  },
  // a clean line-up: one size, upright, a little air between each, standing on one line
  lineup(n, r, tall, PH, PW) {
    const step = PW * (tall && n > 3 ? 1.04 : 1.12);
    return spots(n, (t, i) => [(i - (n - 1) / 2) * step, 0, 0, 1, 0]);
  },
  // a shop window: the middle phone large and in front, the others smaller, tucked a third
  // behind it from the side, all standing on one floor
  showcase(n, r, tall, PH, PW) {
    return spots(n, (t, i) => { const o = i - (n - 1) / 2, k = Math.abs(o), sc = k ? Math.max(.66, 1.12 - .2 * Math.ceil(k)) : 1.12;
      let x = 0; for (let j = 1; j <= Math.ceil(k); j++) { const a = j === 1 ? 1.12 : Math.max(.66, 1.12 - .2 * (j - 1)), b = Math.max(.66, 1.12 - .2 * j); x += PW * (a + b) / 2 * .72; }
      if (n % 2 === 0) x = k < 1 ? PW * .4 : x;
      return [Math.sign(o) * x, -sc * PH / 2, 0, sc, -k]; });
  },
  // wings: the middle upright, each pair beside it leaning out a little more and a little lower
  wings(n, r, tall, PH, PW) {
    const lean = r.uniform(7, 11);
    return spots(n, (t, i) => { const o = i - (n - 1) / 2, k = Math.abs(o);
      return [o * PW * (tall ? 1.02 : 1.1), PH * .05 * k * k, -Math.sign(o) * lean * k, 1 - .06 * k, -k]; });
  },
  // a gallery wall: one size, each phone on its own with clear air either side, leaning
  // a touch outward from the middle
  gallery(n, r, tall, PH, PW) {
    const step = PW * (tall && n > 3 ? 1.22 : 1.42);
    return spots(n, (t, i) => { const o = i - (n - 1) / 2; return [o * step, 0, -Math.sign(o) * 4, 1, 0]; });
  },
  // a crown: apart from each other along a gentle arch, the middle highest, each pair
  // leaning out along it
  crown(n, r, tall, PH, PW) {
    const step = PW * (tall ? 1.16 : 1.3);
    return spots(n, (t, i) => { const o = i - (n - 1) / 2, k = Math.abs(o);
      return [o * step, PH * .07 * k * k, -Math.sign(o) * 7 * k, 1 - .05 * k, -k]; });
  },
  // a spotlight: the middle phone large, the rest small and apart, all on one floor
  spotlight(n, r, tall, PH, PW) {
    const big = 1.2, sm = .68;
    return spots(n, (t, i) => { const o = i - (n - 1) / 2, k = Math.abs(o), sc = k < .75 ? big : sm;
      const x = k < .75 ? o * PW * .7 : Math.sign(o) * (PW * big / 2 + PW * .22 + PW * sm / 2 + (Math.ceil(k) - 1) * PW * (sm + .2));
      return [n % 2 ? x : (k < 1 ? Math.sign(o) * PW * .62 : x), -sc * PH / 2, 0, sc, -k]; });
  },
  // leaning in: the middle upright and in front, its neighbours tucked behind it from the
  // side and leaning in toward it
  lean_in(n, r, tall, PH, PW) {
    return spots(n, (t, i) => { const o = i - (n - 1) / 2, k = Math.abs(o);
      return [o * PW * .78, PH * .03 * k, Math.sign(o) * 8 * k, 1 - .08 * k, -k]; });
  },
  // a row all leaning the same way, evenly apart: one angle for the whole set
  tilt_row(n, r, tall, PH, PW) {
    const lean = (r() < .5 ? -1 : 1) * r.uniform(8, 12), step = PW * (tall && n > 3 ? 1.08 : 1.2);
    return spots(n, (t, i) => [(i - (n - 1) / 2) * step, 0, lean, 1, 0]);
  },
  // the middle phone risen a little above its neighbours, all one size, each tucked a
  // quarter behind the one nearer the middle
  rise(n, r, tall, PH, PW) {
    return spots(n, (t, i) => { const o = i - (n - 1) / 2, k = Math.abs(o);
      return [o * PW * .8, k ? PH * .04 * k : -PH * .06, 0, 1, -k]; });
  },
  // a fanfare: the middle upright and in front, the rest fanned out behind it from its foot
  fanfare(n, r, tall, PH, PW) {
    const half = Math.min(30, 11 * (n - 1)), R = PH * .62;
    return spots(n, (t, i) => { const o = i - (n - 1) / 2, f = (n > 1 ? lerp(-half, half, t) : 0) * Math.PI / 180;
      return [R * Math.sin(f) * 1.15, -R * Math.cos(f), -f * 180 / Math.PI, 1 - .04 * Math.abs(o), -Math.abs(o)]; });
  },
  // an arrow: two arms meeting at the phone in front
  chevron(n, r, tall, PH, PW) {
    const d = r() < .5 ? -1 : 1;
    return spots(n, (t, i) => { const o = i - (n - 1) / 2;
      return [-d * Math.abs(o) * PW, o * PH * .24, d * -o * 12, 1 - .05 * Math.abs(o), -Math.abs(o)]; });
  },
  // a grid turned as a whole, as a magazine sets a page
  tilted_grid(n, r, tall, PH, PW) {
    const cols = tall || n <= 4 ? 2 : 3, rows = Math.ceil(n / cols), th = (r() < .5 ? -1 : 1) * r.uniform(8, 13), a = th * Math.PI / 180;
    const out = [];
    for (let i = 0; i < n; i++) {
      const rr = Math.floor(i / cols), inRow = Math.min(cols, n - rr * cols), cc = i % cols;
      const x = (cc - (inRow - 1) / 2) * PW * 1.14, y = (rr - (rows - 1) / 2) * PH * 1.04;
      out.push([x * Math.cos(a) + y * Math.sin(a), -x * Math.sin(a) + y * Math.cos(a), th, 1, 0]);
    }
    return out;
  },
  // one phone front and centre, the rest in a row behind it
  headliner(n, r, tall, PH, PW) {
    const out = [[0, PH * .12, r.uniform(-4, 4), 1.18, 1]], m = n - 1, left = Math.ceil(m / 2);
    for (let i = 0; i < m; i++) {
      const side = i < left ? -1 : 1, j = i < left ? i : i - left;
      out.push([side * (PW * .78 + j * PW * .6), -PH * .15, -side * (6 + 4 * j), .78, -j]);
    }
    return out;
  },
  // a collage: one large phone beside a small grid of the rest
  collage(n, r, tall, PH, PW) {
    const d = r() < .5 ? -1 : 1, m = n - 1, big = 1.06, sm = .56, g = PW * .12;
    if (!m) return [[0, 0, 0, big, 0]];
    const cols = m === 1 ? 1 : 2, rows = Math.ceil(m / cols);
    const gw = cols * sm * PW + (cols - 1) * g, total = big * PW + g * 1.5 + gw;
    const out = [[d * (-total / 2 + big * PW / 2), 0, 0, big, 0]];
    const x0 = d * (total / 2 - gw / 2), rh = sm * PH + g;
    for (let i = 0; i < m; i++) {
      const rr = Math.floor(i / cols), inRow = Math.min(cols, m - rr * cols), cc = i % cols;
      out.push([x0 + (cc - (inRow - 1) / 2) * (sm * PW + g), (rr - (rows - 1) / 2) * rh, 0, sm, 0]);
    }
    return out;
  },
  // pairs leaning together at the top like a tent, an odd one standing on its own
  tents(n, r, tall, PH, PW) {
    const dx = PH / 2 * Math.sin(.28) + PW / 2 * Math.cos(.28) - PW * .1, out = [];
    const units = []; for (let k = n; k > 0;) { if (k >= 2 && !(k === 3 && units.length === 1)) { units.push(2); k -= 2; } else { units.push(1); k -= 1; } }
    const wid = u => u === 2 ? 2 * dx + PW : PW * 1.05;
    const total = units.reduce((a, u) => a + wid(u), 0) + PW * .15 * (units.length - 1);
    let x = -total / 2;
    for (const u of units) {
      const c = x + wid(u) / 2;
      if (u === 2) { out.push([c - dx, 0, -16, 1, 0]); out.push([c + dx, 0, 16, 1, 0]); }
      else out.push([c, -PH * .02, 0, 1.04, 0]);
      x += wid(u) + PW * .15;
    }
    return out;
  },
  // a carousel seen from a little above: nearer phones larger and lower, further ones smaller and higher
  carousel(n, r, tall, PH, PW) {
    // turned so that no phone stands straight behind another
    const Rx = PW * (tall ? .95 : 1.25) * Math.max(1, (n - 1) / 2), Ry = PH * .2, off = n % 2 ? 0 : .35;
    return spots(n, (t, i) => { const th = 2 * Math.PI * i / n + off, c = Math.cos(th);
      return [Math.sin(th) * Rx, c * Ry, -Math.sin(th) * 8, .72 + .34 * (c + 1) / 2, c]; });
  },
};

/** The styled sets drawn as mirror images about the middle phone. */
const MIRRORED = new Set(["fan", "arc", "vee", "hand", "burst", "podium", "bookends", "tents", "headliner", "wings", "showcase", "lineup",
  "gallery", "crown", "spotlight", "lean_in", "rise", "fanfare"]);

/** n spots from f(t, i), t running 0..1 along them. */
const spots = (n, f) => Array.from({ length: n }, (_, i) => f(n > 1 ? i / (n - 1) : .5, i));

function laidOut(name, n, r, tall, s) {
  const PH = s.ph, PW = s.ph * .475;
  const out = LAID_OUT[name](n, r, tall, PH, PW);
  // the whole group, corners and all, centred on the stage, and no larger than the room
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y, a, sc] of out) {
    const hw = PW * sc / 2, hh = PH * sc / 2, th = -a * Math.PI / 180, c = Math.cos(th), sn = Math.sin(th);
    for (const [u, v] of [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]]) {
      const X = x + u * c - v * sn, Y = y + u * sn + v * c;
      x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y);
    }
  }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const k = Math.min(1, Math.min(s.hw * 2.4, s.W * .94) / (x1 - x0), Math.min(PH * 1.5, s.H * .9) / (y1 - y0));
  return out.map(([x, y, a, sc, z]) => [(x - cx) * k / s.hw, (y - cy) * k / s.hh, a, sc * k, z]);
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

/** Whether two convex outlines overlap (separating axes). */
function outlinesMeet(P, Q) {
  for (const S of [P, Q]) for (let i = 0; i < S.length; i++) {
    const a = S[i], b = S[(i + 1) % S.length], nx = b[1] - a[1], ny = a[0] - b[0];
    let p0 = Infinity, p1 = -Infinity, q0 = Infinity, q1 = -Infinity;
    for (const q of P) { const d = q[0] * nx + q[1] * ny; p0 = Math.min(p0, d); p1 = Math.max(p1, d); }
    for (const q of Q) { const d = q[0] * nx + q[1] * ny; q0 = Math.min(q0, d); q1 = Math.max(q1, d); }
    if (p1 <= q0 || q1 <= p0) return false;
  }
  return true;
}
function inOutline(P, [x, y]) {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > y) !== (P[j][1] > y) && x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c;
  return c;
}

// ------------------------------------------------------------ the set's colours
/* Owner, 2026-10-02: "try not to use too many similar tone devices ... maybe 2 of the same
   colour but the middle one we could use an orange 17 Pro Max or a burgundy 18 Pro Max".
   A phone's tone is read off its metal; the set keeps at most two of a tone, the boldest
   finish stands in the middle, and no two of a tone stand side by side where it can help. */
export const PHONE_META = {};
const unitRgb = h => { const n = parseInt(String(h || "#888888").slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => v / 255); };
function toneOf(meta) {
  const [r, g, b] = unitRgb(meta && meta.metal), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, sat = mx - mn;
  if (sat < .14) return l > .62 ? "light" : l < .3 ? "dark" : "grey";
  let h = mx === r ? ((g - b) / sat) % 6 : mx === g ? (b - r) / sat + 2 : (r - g) / sat + 4; h = (h * 60 + 360) % 360;
  return h < 18 || h >= 340 ? (l < .45 ? "burgundy" : "red") : h < 45 ? "orange" : h < 70 ? "gold" : h < 170 ? "green" : h < 205 ? "teal" : h < 255 ? "blue" : h < 290 ? "purple" : "pink";
}
function boldness(meta) {
  const [r, g, b] = unitRgb(meta && meta.metal), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  const named = /cosmic orange/i.test(meta && meta.finish || "") || /burgundy/i.test(meta && meta.finish || "") ? .45 : 0;
  return (mx - mn) * (1 - Math.abs(l - .45)) + named + (/pro max/i.test(meta && meta.model || "") ? .05 : 0);
}
/** n phones from a pool: at most two of a tone, and one bold finish where the pool has one. */
export function pickPhones(pool, n, r) {
  const ids = pool.slice(); for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  const meta = id => PHONE_META[id], out = [], count = {};
  const bold = ids.filter(id => meta(id) && boldness(meta(id)) > .55);
  if (bold.length) {                                       // orange or burgundy, turn about
    const tones = [...new Set(bold.map(id => toneOf(meta(id))))], t = tones[Math.floor(r() * tones.length)];
    const id = bold.find(b => toneOf(meta(b)) === t); out.push(id); count[t] = 1;
  }
  for (const id of ids) { if (out.length >= n) break; if (out.includes(id)) continue; const t = toneOf(meta(id)); if ((count[t] || 0) >= 2) continue; out.push(id); count[t] = (count[t] || 0) + 1; }
  for (const id of ids) { if (out.length >= n) break; if (!out.includes(id)) out.push(id); }
  return out;
}
/** The order the phones stand in, left to right: the boldest in the middle, then outward,
 *  never two of a tone side by side where another can go between. */
function orderByTone(ids, metaOf) {
  const n = ids.length; if (n < 3) return ids;
  const left = ids.slice().sort((a, b) => boldness(metaOf(b)) - boldness(metaOf(a)) || ids.indexOf(a) - ids.indexOf(b));
  const slots = new Array(n), m = Math.floor((n - 1) / 2);
  slots[m] = left.shift();
  const order = []; for (let k = 1; k < n; k++) { if (m - k >= 0) order.push(m - k); if (m + k < n) order.push(m + k); }
  for (const s of order) {
    const nb = [slots[s - 1], slots[s + 1]].filter(Boolean).map(id => toneOf(metaOf(id)));
    const i = left.findIndex(id => !nb.includes(toneOf(metaOf(id))));
    slots[s] = left.splice(i < 0 ? 0 : i, 1)[0];
  }
  return slots;
}

// ------------------------------------------------------------ how they get there

const ENTRY_TIMES = { fly_spin: [1, .12], drop: [.85, .11], conveyor: [1.05, .14], zoom: [.9, .10], orbit: [1.2, .07],
  deal: [.62, .15], pop: [.55, .09], rain: [.7, .07], boomerang: [1.1, .1], split: [.8, .05], spiral_in: [1.15, .08], whip: [.45, .1],
  slide_up: [.8, .1], swing: [1.25, .1], float_up: [.9, .1], zipper: [.7, .08], sweep: [1, .09], pinwheel: [.75, .1],
  snap: [.3, .2], roll: [1, .12], magnet: [.8, .03], shuffle: [1, .08], flip_in: [.8, .1] };

function planEntries(phones, st, W, H, r, stageC, drawOrder) {
  const [dur, stag] = ENTRY_TIMES[st.entry] || ENTRY_TIMES.fly_spin;
  const dirs = ["left", "right", "top", "bottom", "top-left", "top-right", "bottom-left", "bottom-right"];
  const side = r() < .5 ? -1 : 1;
  // the phone drawn in front lands last (the hero, or a layout's front row)
  const order = drawOrder || phones.map((_, i) => i);
  order.forEach((i, k) => {
    const p = phones[i];
    // The first 3 seconds decide whether anyone watches: phones are already in
    // the air at frame 0 and land fast. A hook line owns the first second.
    const lead = ["hook_line", "word_beat"].includes(st.hook) ? .5 : st.hook === "crash_zoom" ? .22 : st.hook === "punch_in" ? -.7 : -.45;
    // ...but IN the air: at frame 0 no phone is more than half way through its flight, so
    // a short entrance (a pop, a whip) under an early lead still flies in rather than
    // standing there landed. (Owner, 2026-09-30: "it doesn't fly or move in".)
    p.tIn = Math.max(lead, -.5 * dur * .85) + k * stag * .75; p.tLand = p.tIn + dur * .85;
    // a flash cut: two are all but landed at frame 0, backs up, and each after them slams
    // in on a white flash. Every one still flies the last stretch in, fast, rather than
    // appearing where it lands. (Owner, 2026-09-30: "it doesn't fly or move in".)
    if (st.hook === "flash_cut") {
      p.tFlash = Math.max(0, k - 1) * .15 + (k > 1 ? .18 : 0); p.tLand = Math.max(.18, p.tFlash); p.tIn = p.tLand - .3;
      p.flashIn = k > 1; p.landsBack = true; p.reveal = false;
    }
    p.spin = r.pick([-2, -1, 1, 2]) * (r() < .2 ? 1.5 : 1); p.flips = r.pick([1, 2]);
    if (st.hook === "flash_cut") p.flips = 0;     // backs up all the way in: no black glass on frame 0
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
      case "slide_up": p.start = [hx, H + far]; break;
      case "zipper": p.start = [hx, k % 2 ? -far : H + far]; break;
      case "swing": p.start = [0, -(hy + far)]; p.swing = (k % 2 ? 1 : -1) * side * r.uniform(45, 62); break;
      case "sweep": p.start = [side < 0 ? -far : W + far, H * .8]; p.arc = [(p.start[0] + hx) / 2, Math.min(hy, H * .5) - H * .42]; break;
      case "roll": p.start = [side < 0 ? -far : W + far, hy]; break;
      case "magnet": {                                  // scattered about the frame, then drawn together
        const m = .14, jx = r.uniform(-.08, .08) * W, jy = r.uniform(-.08, .08) * H;
        p.start = [clamp(stageC[0] + (hx - stageC[0]) * 2.2 + jx, W * m, W * (1 - m)), clamp(stageC[1] + (hy - stageC[1]) * 2.2 + jy, H * m, H * (1 - m))];
        p.rot0 = r.uniform(-35, 35); break;
      }
      case "shuffle": { const d = hx < stageC[0] ? -1 : hx > stageC[0] ? 1 : (k % 2 ? 1 : -1);
        p.start = [stageC[0], stageC[1]]; p.arc = [hx + d * W * .32, hy - H * .08]; p.dir = d; break; }
      case "float_up": case "snap": case "pinwheel": case "flip_in": p.start = [hx, hy]; break;
      default: p.start = sides.left;
    }
    p.side = side; p.k = k;
    if (st.hook === "crash_zoom" && k === order.length - 1) {     // the last to land crashes in from the lens
      p.crash = true; p.tIn = -.04; p.tLand = .72; p.crashFrom = [stageC[0], stageC[1]]; p.landsBack = true; p.reveal = false;
    }
  });
  return Math.max(...phones.map(p => p.tLand));
}

/** A phone's own height where it stands. */
const H0 = p => p.h * p.size;

// Every phone in a video rests at the same angle: flat, or turned about 35
// degrees to show one edge. The turn rides on top of every flip, so a phone
// that lands on its screen shows the same edge, on the same side, as its back.
// The two angles that keep moving (a turntable sway, one wide spin) start from
// flat once the phones settle; see phoneState0.
const POSE_TURN = { flat: 0, edge_left: -.6, edge_right: .6 };

function phoneState(p, t, st) {
  const s = phoneState0(p, t, st);
  const turn = POSE_TURN[st.pose] || 0;
  if (s && turn) s[4] += turn;
  return s;
}

function phoneState0(p, t, st) {
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
      case "slide_up": {                                  // straight up from under the frame, a little past, and back
        const e2 = outBack(q, 1.3);
        return [hx, lerp(p.start[1], hy, e2), base, p.angle + p.side * 14 * z, end + turn, .3 * z, 1];
      }
      case "zipper": {                                    // in turn from the top and from the bottom
        const e2 = outQuint(q);
        return [hx, lerp(p.start[1], hy, e2), base, p.angle + (p.k % 2 ? 1 : -1) * 18 * (1 - e2), end + turn, .25 * z, 1];
      }
      case "swing": {                                     // hung from a point above, let down and left to swing still
        const a = p.angle * Math.PI / 180, L = p.h * base * .9;
        const drop = (1 - outCubic(clamp(q / .35))) * p.start[1];
        const px = hx - L * Math.sin(a), py = hy - L * Math.cos(a) + drop;
        const f = p.swing * (1 - q) ** 1.4 * Math.cos(2 * Math.PI * 1.25 * q), b = a + f * Math.PI / 180;
        return [px + L * Math.sin(b), py + L * Math.cos(b), base, p.angle + f, end + turn, .3 * (1 - q), 1];
      }
      case "sweep": {                                     // one after another along the same wide arc over the top
        const x = (1 - e) ** 2 * p.start[0] + 2 * (1 - e) * e * p.arc[0] + e * e * hx;
        const y = (1 - e) ** 2 * p.start[1] + 2 * (1 - e) * e * p.arc[1] + e * e * hy;
        return [x, y, base * (1 + .15 * z), p.angle - p.side * 140 * z, end + turn, .6 * z, 1];
      }
      case "roll": {                                      // in from the side, turning over and over like a wheel
        const e2 = outQuint(q);
        return [lerp(p.start[0], hx, e2), hy, base, p.angle + p.side * 420 * (1 - e2), end + turn, .2 * z, 1];
      }
      case "magnet": {                                    // from where they lie scattered, pulled into place
        const e2 = outBack(q, 1.7);
        return [lerp(p.start[0], hx, e2), lerp(p.start[1], hy, e2), base * (.72 + .28 * e), p.angle + p.rot0 * (1 - e), end + turn, .35 * z, 1];
      }
      case "shuffle": {                                   // out of one stack, round to the side and in, as cards are shuffled
        const e2 = inOut(q);
        const x = (1 - e2) ** 2 * p.start[0] + 2 * (1 - e2) * e2 * p.arc[0] + e2 * e2 * hx;
        const y = (1 - e2) ** 2 * p.start[1] + 2 * (1 - e2) * e2 * p.arc[1] + e2 * e2 * hy;
        return [x, y, base * (1 + .08 * Math.sin(Math.PI * q)), p.angle * e2 + p.dir * 20 * Math.sin(Math.PI * q), end + turn, .4 * Math.sin(Math.PI * q), 1];
      }
      case "float_up": {                                  // rises a little into place as it fades in, and does not turn
        const e2 = outQuint(q);
        return [hx, hy + H0(p) * .22 * (1 - e2), base * (.94 + .06 * e2), p.angle + p.side * 5 * (1 - e2), end, .2 * (1 - e2), clamp(q * 2.2)];
      }
      case "snap": {                                      // cut in on the beat, a touch large, and set down
        return [hx, hy, base * (1 + .14 * z), p.angle + p.side * 4 * z, end, .2 * z, 1];
      }
      case "pinwheel": {                                  // spins up from nothing where it stands
        const s2 = outBack(q, 1.8);
        return [hx, hy, base * Math.max(.02, s2), p.angle + (p.spin > 0 ? 1 : -1) * 330 * z, end + turn, .4 * z, clamp(q * 6)];
      }
      case "flip_in": {                                   // edge on, turning over into view where it stands
        return [hx, hy - H0(p) * .05 * z, base * (.86 + .14 * e), p.angle + p.spin * 10 * z, end + (2 * p.flips + .5) * Math.PI * z, .5 * z, 1];
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
  // the angles that move once a phone is settled, every phone in step so the set reads
  // as one: swaying on a turntable, or one wide spin
  const settle = p.reveal ? p.tReveal + .5 : p.tLand + .15;
  if (t > settle) {
    const a = PHONE_TURN * p.turnSide, q = t - settle;
    switch (st.pose) {
      case "turntable": flip += a * 1.15 * Math.sin(q * 1.35) * clamp(q / .3); break;
      case "wide_spin": {
        const q2 = prog(t, settle + .35 + p.order * .07, 1.05);
        flip += 2 * Math.PI * inOut(q2) * p.turnSide; z = Math.max(z, .3 * Math.sin(Math.PI * q2)); s *= 1 + .06 * Math.sin(Math.PI * q2);
        break;
      }
    }
  }
  return [hx, hy, s, rot, flip, z, 1];
}
const PHONE_TURN = 14 * Math.PI / 180;     // a flat photo carries a gentle turn; 22 degrees read as warped

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
      each((ch, cx, cy, c0) => { ctx.fillStyle = contrastOf(c0, accent) < 2.5 ? shade(c0, lum(c0) > .5 ? -.62 : .55) : accent; ctx.fillText(ch, cx, cy); });
      ctx.restore(); fillAll(); break;
    }
    case "outline":
      ctx.shadowColor = shadowCol; ctx.shadowBlur = size * .08; strokeAll(null, Math.max(2, size * .05)); break;
    case "sticker": {
      const plate = darkInk ? "#ffffff" : (contrastOf(p.plate, ink) < 3 ? "#111111" : p.plate);
      const plateFor = c0 => contrastOf(c0, plate) < 3 ? inkOn(c0) : plate;
      ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = size * .1; ctx.shadowOffsetY = size * .04;
      ctx.lineWidth = size * .24; each((ch, cx, cy, c0) => { ctx.strokeStyle = plateFor(c0); ctx.strokeText(ch, cx, cy); });
      noShadow(); fillAll(); break;
    }
    case "extrude": {
      const depth = Math.max(3, Math.round(size * .08));
      const col = Math.abs(lum(accent) - lum(ink)) < .2 ? shade(ink, darkInk ? .6 : -.65) : accent;
      const depthFor = c0 => contrastOf(c0, col) < 2.5 ? shade(c0, lum(c0) > .5 ? -.62 : .55) : col;
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
      // a dark bed under the tubes, so the glow reads against night and not against a lit
      // wall, and tubes thick enough to read at feed size (the 3:1 headline check flagged
      // 7 of 20 neon looks; it still counts the glow against the letters in some)
      ctx.shadowColor = "rgba(0,0,0,.85)"; ctx.shadowBlur = size * .3; fillAll("rgba(0,0,0,.55)");
      ctx.shadowColor = g; ctx.shadowBlur = size * .22; strokeAll(g, size * .085); strokeAll(g, size * .085);
      noShadow(); strokeAll("#ffffff", size * .032); break;
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
      const L = Math.round(size * .35), col = shade(p.ground, darkInk ? -.15 : -.45);   // never dark under dark letters (owner, 2026-10-03)
      for (let k = L; k >= 1; k -= 1) { ctx.save(); ctx.translate(k, k); fillAll(col); ctx.restore(); }
      fillAll(); break;
    }
    case "highlighter": {
      const barCol = lum(p.accent) > .45 ? p.accent : (darkInk ? "#fff176" : p.plate);
      ctx.save(); ctx.globalAlpha = .92; ctx.fillStyle = barCol;
      // the marker covers the whole letter: dark type half on the bar and half on a dark scene loses its top
      ctx.beginPath(); ctx.moveTo(pad - size * .1, by - asc * .9); ctx.lineTo(pad + inkW + size * .12, by - asc * .96);
      ctx.lineTo(pad + inkW + size * .08, by + desc * .35); ctx.lineTo(pad - size * .14, by + desc * .45); ctx.closePath(); ctx.fill(); ctx.restore();
      each((ch, cx, cy, c0) => { ctx.fillStyle = contrastOf(c0, barCol) < 3 ? inkOn(barCol) : c0; ctx.fillText(ch, cx, cy); });
      break;
    }
    case "double_outline": {
      strokeAll(lum(accent) > .35 ? accent : "#ffffff", size * .26);
      const inner = contrastOf(p.ground, ink) >= 3 ? p.ground : inkOn(ink);
      strokeAll(inner, size * .14); each((ch, cx, cy, c0) => { ctx.fillStyle = contrastOf(c0, inner) < 3 ? inkOn(inner) : c0; ctx.fillText(ch, cx, cy); }); break;
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
    case "block3d": {
      // a soft solid block: the depth falls from the ground's own mid shade into its dark, straight down and a touch right
      const depth = Math.max(3, Math.round(size * .1)), far = shade(p.ground, darkInk ? .7 : -.62), near = shade(p.ground, darkInk ? .45 : -.35);
      ctx.shadowColor = "rgba(0,0,0,.32)"; ctx.shadowBlur = size * .1; ctx.shadowOffsetY = size * .05;
      for (let k = depth; k >= 1; k--) {
        ctx.save(); ctx.translate(k * .35, k); fillAll(mix(near, far, k / depth)); ctx.restore();
        if (k === depth) noShadow();
      }
      fillAll(); break;
    }
    case "glass": {
      // a pane of tinted glass behind the words, lit along its top edge
      const gx = pad - size * .2, gy = pad + asc * .02, gw = inkW + size * .4, gh = asc * .98 + desc * .38, gr = size * .14;
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,.22)"; ctx.shadowBlur = size * .18; ctx.shadowOffsetY = size * .05;
      rrect(ctx, gx, gy, gw, gh, gr); ctx.fillStyle = darkInk ? "rgba(255,255,255,.66)" : "rgba(10,12,18,.46)"; ctx.fill(); ctx.restore();
      const hl = ctx.createLinearGradient(0, gy, 0, gy + gh);
      hl.addColorStop(0, "rgba(255,255,255,.42)"); hl.addColorStop(.25, "rgba(255,255,255,.06)"); hl.addColorStop(1, "rgba(255,255,255,.02)");
      rrect(ctx, gx, gy, gw, gh, gr); ctx.strokeStyle = hl; ctx.lineWidth = Math.max(1, size * .014); ctx.stroke();
      if (!darkInk) { ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = size * .06; ctx.shadowOffsetY = size * .02; }
      fillAll(); break;
    }
    case "foil": {
      // one hue, lit like pressed metal foil: light, the colour, a dark fold, a bright edge
      const base = !darkInk && contrastOf(accent, p.ground) >= 4.5 ? accent : ink;
      const g5 = ctx.createLinearGradient(0, pad, 0, pad + asc);
      [[0, shade(base, .55)], [.44, base], [.52, shade(base, -.28)], [.6, shade(base, .3)], [1, shade(base, -.08)]].forEach(([o, c2]) => g5.addColorStop(o, c2));
      ctx.shadowColor = darkInk ? shadowCol : "rgba(0,0,0,.45)"; ctx.shadowBlur = size * .08; ctx.shadowOffsetY = size * .04; fillAll(g5); break;
    }
    // more treatments (owner, 2026-10-04: "now more")
    case "pop_stack": {
      // two offset copies behind the letters: the accent, then a deeper shade of it, a retro print
      const d = Math.max(2, size * .045), deep = shade(accent, lum(accent) > .5 ? -.45 : -.3);
      ctx.save(); ctx.translate(d * 2, d * 2); fillAll(deep); ctx.restore();
      ctx.save(); ctx.translate(d, d); each((ch, cx, cy, c0) => { ctx.fillStyle = contrastOf(c0, accent) < 2.5 ? shade(c0, lum(c0) > .5 ? -.55 : .5) : accent; ctx.fillText(ch, cx, cy); }); ctx.restore();
      fillAll(); break;
    }
    case "outline_shadow": {
      // a thick keyline in the deep ground and a hard shadow under it
      const line = darkInk ? "#ffffff" : shade(p.ground, -.6), d = Math.max(2, size * .05);
      ctx.save(); ctx.translate(d, d); strokeAll(line, size * .16); fillAll(line); ctx.restore();
      strokeAll(line, size * .12); fillAll(); break;
    }
    case "underline_bar": {
      // a solid bar of the accent under the line, the letters standing on it
      const bc = Math.abs(lum(accent) - lum(ink)) > .25 ? accent : (darkInk ? "#ffd60a" : shade(p.ground, -.5));
      ctx.fillStyle = bc; ctx.fillRect(pad - size * .06, by + desc * .1, inkW + size * .12, Math.max(3, size * .12));
      ctx.shadowColor = shadowCol; ctx.shadowBlur = size * .08; ctx.shadowOffsetY = size * .03; fillAll(); break;
    }
    case "stamped": {
      // inked with a rubber stamp: the letters knocked back in small specks, always the same specks
      fillAll();
      ctx.save(); ctx.globalCompositeOperation = "destination-out";
      const n = Math.round(inkW * asc / (size * size) * 90);
      for (let i = 0; i < n; i++) {
        const u = (Math.sin(i * 12.9898 + chars.length * 78.233) * 43758.5453) % 1, v = (Math.sin(i * 39.3468 + size) * 24634.6345) % 1;
        const rr = size * (.012 + .02 * Math.abs((Math.sin(i * 7.1) * 9631.7) % 1));
        ctx.globalAlpha = .55 + .4 * Math.abs((Math.sin(i * 3.3) * 4219.9) % 1);
        ctx.beginPath(); ctx.arc(pad + Math.abs(u) * inkW, pad + Math.abs(v) * (asc + desc * .3), rr, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore(); break;
    }
    case "inline": {
      // a sign-painter's inline: a thin line of the ground drawn inside each letter
      ctx.shadowColor = shadowCol; ctx.shadowBlur = size * .08; ctx.shadowOffsetY = size * .03; fillAll(); noShadow();
      ctx.save(); ctx.globalCompositeOperation = "source-atop"; strokeAll(darkInk ? "#ffffff" : p.ground, Math.max(1, size * .022)); ctx.restore();
      fillAll(); ctx.save(); ctx.globalCompositeOperation = "source-atop"; ctx.globalAlpha = .55;
      ctx.translate(-size * .012, -size * .012); strokeAll(darkInk ? "#ffffff" : mix(ink, p.ground, .5), Math.max(1, size * .014)); ctx.restore();
      break;
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
    if (st.text_fx === "box" && text.trim()) {                // a blank line has no box (an empty plate read as a stray grey square)
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
      if (st.text_fx === "box" && contrastOf(col, p.plate) < 3.5) col = inkOn(p.plate);   // never lost in its own box
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
  // the number is the one thing that must read at a glance: a neon number is solid, bright
  // figures in their glow, never hollow tubes (at number size those blur into the halo)
  const fxFor = { plain: ["hard_shadow", "extrude", "glow", "chrome", "gold", "neon", "long_shadow", "block3d", "foil"].includes(st.text_fx) ? (st.text_fx === "neon" ? "glow" : st.text_fx) : "shadow",
    sticker: "sticker", outline: "shadow", underline: "shadow", neon: "glow", chrome: "chrome", gold: "gold", split: "shadow", stacked: "flat" };
  const fx = fxFor[style] || "flat";
  const onPlate = ["pill", "box", "ticket", "tag", "stacked"].includes(style);
  const col = onPlate ? (contrastOf(p.plate_ink, p.plate) >= 3.5 ? p.plate_ink : inkOn(p.plate)) : p.ink;
  let colors = text.split("").map(() => col);
  if (style === "split") { const cut = text.search(/\d{3}\D*\d/) >= 0 ? text.replace(/\D/g, "").length === 10 ? text.length - 8 : 3 : 3; colors = text.split("").map((_, i) => i < cut ? (lum(p.accent) > .35 ? p.accent : "#ffffff") : col); }
  const sp = inkSprite(text, colors, font, size, st.tracking * .5, fx, p, 0);
  const bodyH = sp.asc + sp.desc;
  let out;
  if (style === "tag") {
    // a swing tag (owner, 2026-10-04: "shrink the number 10% and scoot it up ... to
    // essentially center it and give it proper margin so it's not right next to the dot"):
    // the plate as it was, the figures 10% smaller, centred on the plate by their own ink,
    // starting a clear gap after the hole so the tag reads as a tag
    const px = size * .45, py = size * .14, H = sp.asc * .95 + py * 2;
    const s2 = inkSprite(text, colors, font, size * .9, st.tracking * .5, fx, p, 0);
    const m = canvas(4, 4).getContext("2d"); m.font = fontCss(font, size * .9);
    const ink = m.measureText(text), up = ink.actualBoundingBoxAscent || s2.asc * .72, down = ink.actualBoundingBoxDescent || 0;
    const hole = H * .45, holeR = H * .09, lead = hole + holeR + H * .26;
    const W = lead + s2.inkW + px * .9;
    const c = canvas(W + 24, H + 24), x = c.getContext("2d");
    x.translate(6, 6);
    x.save(); x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = 14; x.shadowOffsetY = 6;
    x.beginPath(); x.moveTo(3 + H * .45, 3); x.lineTo(3 + W, 3); x.lineTo(3 + W, 3 + H); x.lineTo(3 + H * .45, 3 + H); x.lineTo(3, 3 + H / 2); x.closePath();
    x.fillStyle = p.plate; x.fill(); x.restore();
    x.beginPath(); x.arc(3 + hole, 3 + H / 2, holeR, 0, 7); x.fillStyle = p.ground; x.fill();
    // the figures' ink centred on the plate: baseline at the middle plus half their height
    const base = 3 + H / 2 + (up - down) / 2;
    x.drawImage(s2.c, 3 + lead - s2.pad, base - (s2.pad + s2.asc));
    out = c;
  } else if (onPlate || style === "outline") {
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
  if (candidateGround(st.background, x, st, p, W, H, sc, r) || freshGround(st.background, x, st, p, W, H, sc, r) || themeGround(st.background, x, st, p, W, H, sc, r) || vibeBackground(st.background, x, st, p, W, H, sc, r)) {
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
    // one hue from its shadow to its light, the way a lit studio wall falls off: depth without colour travel
    case "tonal": case "aurora": case "drift": {
      const gr = x.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, shade(g, -.28)); gr.addColorStop(.55, g); gr.addColorStop(1, shade(g, -.12)); x.fillStyle = gr; x.fillRect(0, 0, W, H);
      const hz = x.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(W, H) * .5);
      hz.addColorStop(0, rgba(l, .75)); hz.addColorStop(1, rgba(l, 0)); x.fillStyle = hz; x.fillRect(0, 0, W, H);
      break;                                                     // aurora and drift move on top of this every frame
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

/** The size every look is laid out at: the preview's own (720 on the long side). */
export function planSize(aspect) {
  const [W, H] = ASPECTS[aspect] || ASPECTS["1:1"], k = 720 / Math.max(W, H);
  return [Math.round(W * k), Math.round(H * k)];
}
const PLANS = new Map();
/** The plan for a style: laid out once at the plan size, then kept (the last 200). */
export function planFor(style, assets) {
  const a = assets || {}, key = JSON.stringify(style) + "|" + Object.keys(a.phones || {}).length + "|" + Object.keys(a.accents || {}).length;
  let plan = PLANS.get(key);
  if (!plan) {
    const [cw, ch] = planSize({ ...DEFAULT_STYLE, ...style }.aspect);
    plan = new Ad(style, assets, cw, ch, { plan: false }).toPlan();
    PLANS.set(key, plan);
    if (PLANS.size > 200) PLANS.delete(PLANS.keys().next().value);
  }
  return plan;
}

export class Ad {
  /** assets: { phones: {id: {img, meta}} } */
  constructor(style, assets, width, height, opts = {}) {
    this.st = { ...DEFAULT_STYLE, ...style };
    let st = this.st;
    this.W = width || (ASPECTS[st.aspect] || ASPECTS["1:1"])[0];
    this.H = height || (ASPECTS[st.aspect] || ASPECTS["1:1"])[1];
    // Every decision about where things go is made once, at the plan size, and every other
    // size (the gallery's thumbnail, the full-size MP4) draws that same plan, so what a
    // customer previews is what they download. (Audit 2026-10-01: 72 of 200 looks came out
    // with the words, the number or the phones elsewhere in the download.)
    const [cw, ch] = planSize(st.aspect);
    this.plan = opts.plan === false || (this.W === cw && this.H === ch) ? null : planFor(style, assets);
    if (this.plan) { Object.assign(st, this.plan.st); }
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
    if (!this.plan) {
      this._numberBelowPhones();
      this._headlineOffPhones();
      this._wordsOffPhones();
    }
    // how the phones get there is planned from where they finally land (the same draws from this.r as ever)
    this.tLanded = this.phones.length ? planEntries(this.phones, st, this.W, this.H, this.r, this.stageC, this.drawOrder) : .3;
    this._timeline();
    this._typeTimeline();
    this._buildDecor();
    this.bg = background(st, this.p, this.W, this.H, this.stageC, rng(st.seed + 1));
    this.liveGround = ["sunburst", "aurora", "drift"].includes(st.background);
    this._softFloor();
    this.dofBlur = 0;
    if (st.depth === "dof") {
      // a shallow focus: the ground and any phone standing further back go soft
      this.dofBlur = Math.max(1, this.W * .004); this.dofSize = Math.max(0, ...this.phones.map(p => p.size));   // the front phones stay sharp however small the layout made the group
      const b = canvas(this.W, this.H), bx = b.getContext("2d");
      if ("filter" in bx) { bx.filter = `blur(${Math.max(1, this.W * .006)}px)`; bx.drawImage(this.bg, 0, 0); bx.filter = "none"; bx.globalAlpha = .35; bx.drawImage(this.bg, 0, 0); this.bg = b; }
    }
    const ls = lumStats(this.bg);
    this.bgLum = ls.mean; this.bgDark = ls.dark;
    this._scrim();
    this._contrastGuard();
    this.still = null;
    this.acc = canvas(this.W, this.H); this.tmp = canvas(this.W, this.H);
  }

  /** What this look decided, in proportions of the frame, for every other size to draw. */
  toPlan() {
    const W = this.W, H = this.H, U = Math.min(W, H);
    return {
      st: { ...this.st }, lay: this._lay,
      phones: this.phones.map(p => ({ x: p.home[0] / W, y: p.home[1] / H, size: p.size, angle: p.angle })),
      drawOrder: this.drawOrder.slice(), stageC: [this.stageC[0] / W, this.stageC[1] / H], stageSpan: [this.stageSpan[0] / W, this.stageSpan[1] / W],
      burst: this.burst ? { x: this.burst.x / W, y: this.burst.y / H, R: this.burst.R / U } : null,
      stamp: this.stamp ? { k: this.stamp.k, x: this.stamp.x / W, y: this.stamp.y / H } : null,
      tape: this.tape ? this.tape.corner : null, arrowsMode: this.arrowsMode, arrow: !!this.arrow, pinstripe: !!this.pinstripe,
      accents: (this.accents || []).map(a => ({ ...a, x: a.x / W, y: a.y / H, R: a.R / U, t0: undefined, tOut: undefined })),
    };
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
    this.stageC = [s.cx, s.cy]; this.stageSpan = [s.cx - s.hw, s.cx + s.hw];
    const lr = orderByTone((st.phones || []).filter(id => this.assets.phones[id]), id => this.assets.phones[id].meta);
    const spots = arrangement(st.arrangement, lr.length, this.r, W / H < .85, { ...s, W, H });
    // the tones' left-to-right order, onto the layout's spots as they stand left to right
    const ids = new Array(lr.length);
    spots.map((sp, i) => i).sort((a, b) => spots[a][0] - spots[b][0] || a - b).forEach((i, k) => { ids[i] = lr[k]; });
    this.phones = ids.map((id, i) => {
      const a = this.assets.phones[id];
      const p = new Phone(a.img, a.meta, s.ph);
      const [ux, uy, ang, sc] = spots[i];
      p.home = [s.cx + ux * s.hw, s.cy + uy * s.hh]; p.angle = ang; p.size = sc;
      const endsBack = { back: true, front: false, mixed: i % 2 === 0 }[st.end_face] ?? true;
      p.landsBack = endsBack && st.front_glimpse === "spin";
      p.reveal = endsBack && !p.landsBack;
      p.glare = new Glare(rng(st.seed * 101 + i), st.glare);
      p.lens = st.pose === "wide_spin" ? WIDE_LENS : LENS;      // a wide lens makes the spin wide
      p.turnSide = st.seed % 2 ? 1 : -1; p.order = i;           // every phone turns the same way
      return p;
    });
    this.drawOrder = this.phones.map((_, i) => i);
    if (st.arrangement === "hero") this.drawOrder = this.drawOrder.slice(1).concat([0]);
    // a layout that says which phones stand in front draws (and lands) them last
    if (spots.some(sp => sp.length > 4)) this.drawOrder.sort((a, b) => (spots[a][4] || 0) - (spots[b][4] || 0));
    if (this.plan) {                                         // where the plan put them, at this size
      const P = this.plan;
      this.phones.forEach((p, i) => { const q = P.phones[i]; if (q) { p.home = [q.x * W, q.y * H]; p.size = q.size; p.angle = q.angle; } });
      this.drawOrder = P.drawOrder.filter(i => i < this.phones.length);
      this.stageC = [P.stageC[0] * W, P.stageC[1] * H]; this.stageSpan = [P.stageSpan[0] * W, P.stageSpan[1] * W];
      return;
    }
    this._tidyPhones();
    this._phonesInFrame();
  }

  /** The set's house rules (owner, 2026-10-02, over phones stacked on each other):
   *  - one angle: every phone leans the same way ("don't mix angles")
   *  - side by side only: a phone may tuck behind a neighbour from the side, never from
   *    above or below ("from the sides not the top"); stacked phones part sideways
   *  - at most half: a tucked phone shows at least half of itself, and phones that do not
   *    touch keep a little air between them ("allow them some space ... to breathe")
   *  - the middle phone stands on the stage's centre, in front, its neighbours mirrored
   *    on either side ("the middle phone should be centered, it would look more clean")
   *  Only across the stage the layout gave them; where that is not enough, they all stand
   *  a little smaller. */
  _tidyPhones() {
    const phones = this.phones, n = phones.length;
    if (!n) return;
    const W = this.W, H = this.H, mg = Math.min(W, H) * .03, cx = this.stageC[0];
    const byX = () => phones.map((_, i) => i).sort((a, b) => phones[a].home[0] - phones[b].home[0]);
    if (MIRRORED.has(this.st.arrangement) && n > 1) {         // a styled set: each pair a mirror image, the middle upright
      const o = byX(), half = Math.floor(n / 2);
      for (let k = 0; k < half; k++) {
        const L = phones[o[k]], R = phones[o[n - 1 - k]], a = (Math.abs(L.angle) + Math.abs(R.angle)) / 2, sg = Math.sign(L.angle - R.angle) || 0;
        L.angle = sg * a; R.angle = -sg * a;
        const y = (L.home[1] + R.home[1]) / 2, sz = (L.size + R.size) / 2;
        L.home[1] = R.home[1] = y; L.size = R.size = sz;
      }
      if (n % 2) phones[o[(n - 1) / 2]].angle = 0;
    } else {                                                 // otherwise one lean for all
      const angs = phones.map(p => p.angle).sort((a, b) => a - b), common = clamp(angs[Math.floor((n - 1) / 2)], -12, 12);
      phones.forEach(p => { p.angle = common; });
    }
    if (n < 2) { phones[0].home[0] = cx; return; }
    // drawn from the outside in, so the middle stands in front
    const xo = byX(), mid = (n - 1) / 2;
    this.drawOrder = xo.map((i, k) => [i, Math.abs(k - mid)]).sort((a, b) => b[1] - a[1]).map(q => q[0]);
    const outline = (p, e = 0) => { const hw = p.w * p.size / 2 + e, hh = p.h * p.size / 2 + e, th = -p.angle * Math.PI / 180, c = Math.cos(th), sn = Math.sin(th);
      return [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([x, y]) => [p.home[0] + x * c - y * sn, p.home[1] + x * sn + y * c]); };
    const hidden = (back, fronts) => { const P = outline(back), Qs = fronts.map(f => outline(f)).filter(Q => outlinesMeet(P, Q)); if (!Qs.length) return 0; let h = 0, m = 0;
      for (let a = 0; a < 8; a++) for (let b = 0; b < 14; b++) { const u = (a + .5) / 8, w = (b + .5) / 14, q = [P[0][0] + (P[1][0] - P[0][0]) * u + (P[3][0] - P[0][0]) * w, P[0][1] + (P[1][1] - P[0][1]) * u + (P[3][1] - P[0][1]) * w]; m++; if (Qs.some(Q => inOutline(Q, q))) h++; }
      return h / m; };
    const front = (i, j) => this.drawOrder.indexOf(i) > this.drawOrder.indexOf(j);
    const sp = this.stageSpan, pwMax = Math.max(...phones.map(p => p.w * p.size));
    const xs = () => { let x0 = Infinity, x1 = -Infinity; for (const p of phones) for (const [x] of outline(p)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); } return [x0, x1]; };
    const [g0, g1] = xs(), room = [Math.min(g0, Math.max(mg, sp[0] - pwMax / 2)), Math.max(g1, Math.min(W - mg, sp[1] + pwMax / 2))];
    const fits = () => { const [x0, x1] = xs(); return x0 >= room[0] - 1 && x1 <= room[1] + 1; };
    const mirror = () => {                                   // the middle on the centre, neighbours mirrored
      const o = byX(), xsv = o.map(i => phones[i].home[0]), half = Math.floor(n / 2);
      for (let k = 0; k < half; k++) {
        const d = Math.max(0, (xsv[n - 1 - k] - xsv[k]) / 2);
        phones[o[k]].home[0] = cx - d; phones[o[n - 1 - k]].home[0] = cx + d;
      }
      if (n % 2) phones[o[(n - 1) / 2]].home[0] = cx;
    };
    const breach = () => {                                   // the worst rule broken, and the pairs that break it
      const bad = [], ph = phones.reduce((a, p) => a + p.h * p.size, 0) / n, gap = phones.reduce((a, p) => a + p.w * p.size, 0) / n * .05;
      // side by side when the two share nearly all the smaller one's height; otherwise one is above the other
      const ys = phones.map(p => { const O = outline(p); return [Math.min(...O.map(q => q[1])), Math.max(...O.map(q => q[1]))]; });
      const stacked = (i, j) => Math.min(ys[i][1], ys[j][1]) - Math.max(ys[i][0], ys[j][0]) < .9 * Math.min(ys[i][1] - ys[i][0], ys[j][1] - ys[j][0]);
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++)
        if (stacked(i, j) && outlinesMeet(outline(phones[i], gap), outline(phones[j], gap))) bad.push([i, j]);
      for (let i = 0; i < n; i++) {                          // what all its neighbours in front hide of it, together
        const fr = phones.map((_, j) => j).filter(j => j !== i && !stacked(i, j) && front(j, i));
        if (hidden(phones[i], fr.map(j => phones[j])) > .36) for (const j of fr) if (outlinesMeet(outline(phones[i]), outline(phones[j]))) bad.push([i, j]);
      }
      return bad;
    };
    mirror();
    for (let k = 0; k < 9; k++) {
      for (let it = 0; it < 60; it++) {
        const bad = breach(); if (!bad.length) break;
        for (const [i, j] of bad) {                          // part sideways, outward from the centre
          const a = phones[i], b = phones[j], step = pwMax * .035, d = a.home[0] <= b.home[0] ? 1 : -1;
          a.home[0] -= d * step; b.home[0] += d * step;
        }
        mirror();
      }
      if (!breach().length && fits()) break;
      // no room left: the set, smaller, from its own middle
      for (const p of phones) { p.size *= .94; p.home[0] = cx + (p.home[0] - cx) * .94; }
      mirror();
    }
  }

  /** No phone is cut by the edge of the frame where the camera settles (giants bleed on
   *  purpose). The group slides in first and stands smaller only when it cannot fit. */
  _phonesInFrame() {
    if (!this.phones.length || this.st.arrangement === "giants") return;
    const W = this.W, H = this.H, z = settleZoom(this.st) * 1.02, m = Math.min(W, H) * .015;
    // the frame the camera shows, in layout coordinates
    const lo = [W / 2 - (W / 2 - m) / z, Math.max(this.insetTop + m, H / 2 - (H / 2 - m) / z)], hi = [W / 2 + (W / 2 - m) / z, H / 2 + (H / 2 - m) / z];
    const box = () => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const P of this.phones.map(landedOutline)) for (const [x, y] of P) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
      return [x0, y0, x1, y1]; };
    let b = box();
    const k = Math.min(1, (hi[0] - lo[0]) / (b[2] - b[0]), (hi[1] - lo[1]) / (b[3] - b[1]));
    if (k < 1) {
      const cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
      for (const p of this.phones) { p.home = [cx + k * (p.home[0] - cx), cy + k * (p.home[1] - cy)]; p.size *= k; }
      b = box();
    }
    const dx = Math.max(0, lo[0] - b[0]) - Math.max(0, b[2] - hi[0]), dy = Math.max(0, lo[1] - b[1]) - Math.max(0, b[3] - hi[1]);
    if (!dx && !dy) return;
    for (const p of this.phones) p.home = [p.home[0] + dx, p.home[1] + dy];
    this.stageC = [this.stageC[0] + dx, this.stageC[1] + dy];
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
    const gapOf = z => z * (["box", "sticker", "highlighter", "cutout", "double_outline", "glass"].includes(st.text_fx) ? .14 : B ? .09 : .02);
    const ctaOf = () => st.urgency === "pulse_cta" ? { text: st.cta || (st.lang === "es" ? "¡MÁNDANOS TEXTO!" : "TEXT NOW"), hot: this.hot } : null;
    const tagOf = z => { const ph = this.pHead; return st.tag ? trim(inkSprite(applyCase(st.tag, "upper"), st.tag.split("").map(() => ph.ink), st.font, z * .26, .12, lum(ph.ink) < .5 ? "flat" : "shadow", ph).c) : null; };
    if (this.plan) {                                         // the plan's type, at this size
      const L = this.plan.lay, z = L.size * H, ls = headlineLines(st, this.pHead, z, L.bestN), lh = ls[0].asc * .98 + gapOf(z);
      const bh = lh * (ls.length - 1) + ls[0].asc, tg = tagOf(z);
      let nm = numberSprite(st, p, L.nSize * H, ctaOf()); if (L.dropLabel) nm = { ...nm, label: null };
      Object.assign(this, { size: z, lines: ls, lineH: lh, blockH: bh, margin: m, tag: tg, num: nm, pos: this._place(ls, lh, bh, tg, nm, m, z) });
      this._lay = L;
      return this._hookText();
    }
    const alts = [st.number_pos, ...["under-headline", "bottom-center", "bottom-right", "bottom-left"].filter(x => x !== st.number_pos)];
    let pos = null, lines, lineH, blockH, tag, num, firstFit = null, dropLabel = false, nUsed = 0;
    for (let attempt = 0; attempt < 40; attempt++) {
      const lk = size.toFixed(3) + "|" + bestN;
      lines = (this._lineCache ||= new Map()).get(lk) || this._lineCache.set(lk, headlineLines(st, this.pHead, size, bestN)).get(lk);
      const gap = size * (["box", "sticker", "highlighter", "cutout", "double_outline", "glass"].includes(st.text_fx) ? .14 : B ? .09 : .02);
      lineH = lines[0].asc * .98 + gap;
      const widest = Math.max(...lines.map(L => L.inkW));
      blockH = lineH * (lines.length - 1) + lines[0].asc;
      if (widest + 2 * bpad * size > maxW || blockH + (1.6 * bpad + btabs) * size > maxH) { size *= .93; continue; }
      const ph = this.pHead;
      const tk = st.tag + "|" + size.toFixed(3);
      tag = st.tag ? ((this._tagCache ||= new Map()).get(tk) || this._tagCache.set(tk, trim(inkSprite(applyCase(st.tag, "upper"), st.tag.split("").map(() => ph.ink), st.font, size * .26, .12, lum(ph.ink) < .5 ? "flat" : "shadow", ph).c)).get(tk)) : null;
      let nSize = Math.min(size * .72, W * (wide ? .075 : .11)) * (st.number_scale || 1);
      const cta = st.urgency === "pulse_cta" ? { text: st.cta || (st.lang === "es" ? "¡MÁNDANOS TEXTO!" : "TEXT NOW"), hot: this.hot } : null;
      const ns = z => { const k = z.toFixed(3) + "|" + (cta ? 1 : 0) + "|" + st.number_pos; return (this._numCache ||= new Map()).get(k) || this._numCache.set(k, numberSprite(st, p, z, cta)).get(k); };
      num = ns(nSize);
      while (num.c.width > W - 2 * m && nSize > 12) { nSize *= .92; num = ns(nSize); }
      nUsed = nSize;
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
    // however long the words, the look always has its lines, its number and a place: the
    // smallest size tried, laid out as it comes (fuzz 2026-10-01: an 85-letter headline on a
    // wide frame never fitted, so the number was never made and the look threw)
    if (!num || !pos) {
      lines = headlineLines(st, this.pHead, size, bestN);
      lineH = lines[0].asc * .98 + gapOf(size); blockH = lineH * (lines.length - 1) + lines[0].asc;
      tag = null; st.tag = ""; dropLabel = false;
      if (st.urgency === "pulse_cta") st.urgency = "arrows";
      nUsed = Math.min(size * .72, W * (wide ? .075 : .11));
      num = numberSprite(st, p, nUsed, null);
      pos = this._place(lines, lineH, blockH, tag, num, m, size);
    }
    if (st.urgency === "pulse_cta" && !num.label) st.urgency = "arrows";
    Object.assign(this, { size, lines, lineH, blockH, margin: m, tag, num, pos });
    this._lay = { size: size / H, bestN, nSize: nUsed / H, dropLabel };
    this._hookText();
  }

  /** The opening words, which do not depend on where the headline sits. */
  _hookText() {
    const st = this.st, W = this.W, H = this.H, p = this.p, ar = W / H, wide = ar >= 1.3, tall = ar < .85;
    if (this._hook) { Object.assign(this, this._hook); return; }
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
    this._hook = { hookLines: this.hookLines, hookSize: this.hookSize, hookWords: this.hookWords };
  }

  /** When the words and the number arrive, once the phones' timeline is known. */
  _typeTimeline() {
    const st = this.st, n = this.lines.length;
    // words on screen within a second: with no opening line to read first, a long headline's lines follow
    // each other closer, so the last one starts by 0.6 s (two lines keep the full 0.12 s)
    const step = n > 1 && this.tl.text < .6 ? Math.min(.12, Math.max(.06, (.6 - this.tl.text) / (n - 1))) : .12;
    this.tl.lines = this.lines.map((_, i) => this.tl.text + i * step);
    const perLetter = ["slide_letters", "drop_letters", "typewriter", "scramble", "spin_letters"].includes(st.text_in);
    const last = this.tl.lines[n - 1] + (perLetter ? .4 : .26);
    this.tl.hit = this.tl.text + (["slam", "stomp"].includes(st.text_in) ? .42 : .3);
    this.tl.tag = last + .12; this.tl.number = last + .25; this.tl.shine = this.tl.number + .5; this.tl.sparkle = this.tl.number + .35;
    this.tl.still = Math.max(this.tl.still, this.tl.revealEnd + .25);
    // phones that turn once they settle keep moving until the turn is done (a turntable never stops)
    const settled = p => p.reveal ? p.tReveal + .5 : p.tLand + .15;
    const turnEnd = { wide_spin: 1.5 }[st.pose];
    if (turnEnd) this.tl.still = Math.max(this.tl.still, ...this.phones.map(p => settled(p) + turnEnd + p.order * .07));
    this.livePhones = st.pose === "turntable" && this.phones.length > 0;
    // an ending only where the number has had its time on screen first
    const tO = st.duration - 1.1;
    this.tOutro = st.outro && st.outro !== "none" && st.duration >= 4.5 && tO >= this.tl.number + 1.4 ? tO : null;
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

  /** The headline never covers the phones, the image ads' rule 58 (copy is never touched
   *  by the product). Where the phones would cover more than a little of the words, their
   *  tag or their sign, the phones make room as they do for the number: the least move
   *  that clears the words, standing smaller only where moving is not enough, and never
   *  under HEAD_FIT (nor under TOTAL_FIT with what the number already took), because small
   *  phones are a worse ad than words on phones. They stay clear of the number and of what
   *  sits under it, and keep a margin from every edge the layout did not already run them
   *  off, measured where the camera ends (it keeps pushing in). Where nothing clears the
   *  words the phones take the place that covers least, if that at least halves it. A phone
   *  tucked a little under the words, and every look already clear, draws as it did.
   *  (Audit 2026-09-30: in 117 of 400 random looks a quarter or more of the headline's
   *  ink lay on the phones.) */
  _headlineOffPhones() {
    const HEAD_FIT = .5, TOTAL_FIT = .45, END_ZOOM = 1.1;
    if (!this.phones.length || !this.pos) return;
    const W = this.W, H = this.H, z = settleZoom(this.st), pos = this.pos, size = this.size, num = this.num;
    const g = Math.max(size * .08, H * .01);
    const o = pos.board || pos.outer;
    const labH = num.label ? num.label.height + size * .06 : 0;
    const nb = [pos.num[0], pos.num[1] - labH, pos.num[0] + num.c.width, pos.num[1] + num.c.height];
    const under = this.st.number_pos === "under-headline";
    const column = [nb[0] - g * .5, nb[1] - g, nb[2] + g * .5, under ? nb[3] + g : H * 3];
    // how much of the words' box the phones cover, on a grid of points
    const pts = [];
    for (let i = 0; i < 16; i++) for (let j = 0; j < 6; j++) pts.push([lerp(o[0], o[2], (i + .5) / 16), lerp(o[1], o[3], (j + .5) / 6)]);
    const inside = (P, [x, y]) => { let c = false;
      for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > y) !== (P[j][1] > y) && x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c;
      return c; };
    const head = [o[0], o[1], o[2], o[3]];
    const cover = Ps => Ps.some(P => hitsRect(P, head)) ? pts.filter(q => Ps.some(P => inside(P, q))).length / pts.length : 0;
    const outlines = this.phones.map(landedOutline);
    const onCam = Ps => Ps.map(P => onCamera(P, W, H, z));
    const c0 = cover(onCam(outlines));
    if (c0 <= .06) return;
    const box = Ps => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const P of Ps) for (const [x, y] of P) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
      return [x0, y0, x1, y1]; };
    const endCam = Ps => Ps.map(P => onCamera(P, W, H, END_ZOOM)), mg = W * .03;
    const b0 = box(endCam(outlines)), top = this.insetTop;
    // how far the layout already runs past each edge's margin: a moved group may not run further
    const over = [Math.max(0, mg - b0[0]), Math.max(0, top + mg - b0[1]), Math.max(0, b0[2] - W + mg), Math.max(0, b0[3] - H + mg)];
    const bb = box(outlines), ax = (bb[0] + bb[2]) / 2, ay = (bb[1] + bb[3]) / 2;
    const T = (k, dx, dy) => ([x, y]) => [ax + k * (x - ax) + dx, ay + k * (y - ay) + dy];
    const grown = [o[0] - g, o[1] - g, o[2] + g, o[3] + g];
    let clear = null, least = null;
    // phones the number already made smaller may move but not shrink much further
    const kMin = Math.max(HEAD_FIT, TOTAL_FIT / this.phoneFit.k);
    // coarse first, then fine round the best the coarse pass found (the same answer as an
    // exhaustive fine grid in the audit, at a fraction of the work)
    const grid = [];
    for (let k = 1; k >= kMin - 1e-9; k -= .1) for (let i = -8; i <= 8; i++) for (let j = -8; j <= 8; j++) grid.push([k, i * W * .06, j * W * .06]);
    const refine = b => { const out = []; for (let k = Math.min(1, b.k + .05); k >= Math.max(kMin, b.k - .05) - 1e-9; k -= .05) for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) out.push([k, b.dx + i * W * .02, b.dy + j * W * .02]); return out; };
    for (let pass = 0; pass < 2; pass++) {
      const cands = pass ? ((clear || least) ? refine(clear || least) : []) : grid;
      for (const [k, dx, dy] of cands) {
        const cost = (1 - k) * W * 3 + Math.hypot(dx, dy);
        if (clear && cost >= clear.cost) continue;
        const moved = outlines.map(P => P.map(T(k, dx, dy))), Ps = onCam(moved), b = box(endCam(moved));
        if (mg - b[0] > over[0] + 1 || top + mg - b[1] > over[1] + 1 || b[2] - W + mg > over[2] + 1 || b[3] - H + mg > over[3] + 1) continue;
        if (Ps.some(P => hitsRect(P, column))) continue;
        if (!Ps.some(P => hitsRect(P, grown))) { clear = { k, dx, dy, cost }; continue; }
        if (clear) continue;
        const c = cover(Ps), score = c + cost / W * .05;
        if (c <= c0 / 2 && (!least || score < least.score)) least = { k, dx, dy, cost, score };
      }
    }
    const best = clear || least;
    if (!best) return;
    const f = T(best.k, best.dx, best.dy);
    for (const p of this.phones) { p.home = f(p.home); p.size *= best.k; }
    this.stageC = f(this.stageC);
    this.phoneFit = { ...this.phoneFit, k: this.phoneFit.k * best.k, dy: this.phoneFit.dy + best.dy, head: true };
  }

  /** How much of the words' box the phones cover where the camera settles, 0..1. */
  _headCover() {
    const pos = this.pos;
    if (!pos || !this.phones.length) return 0;
    const b = pos.board || pos.outer, g = this.size * .06, o = [b[0] - g, b[1] - g, b[2] + g, b[3] + g], z = settleZoom(this.st);   // with a breath of room round the words
    const Ps = this.phones.map(p => onCamera(landedOutline(p), this.W, this.H, z)), O = onCamera([[o[0], o[1]], [o[2], o[3]]], this.W, this.H, z);
    let n = 0, c = 0;
    for (let i = 0; i < 16; i++) for (let j = 0; j < 6; j++) {
      const q = [lerp(O[0][0], O[1][0], (i + .5) / 16), lerp(O[0][1], O[1][1], (j + .5) / 6)];
      n++; if (Ps.some(P => inOutline(P, q))) c++;
    }
    // and the other way round: a phone half hidden behind a sign board is as bad as words
    // on a phone, though it covers only a sliver of a big board
    let hid = 0;
    for (const P of Ps) {
      let m = 0, h = 0;
      for (let a = 0; a < 6; a++) for (let b = 0; b < 10; b++) {
        const u = (a + .5) / 6, w = (b + .5) / 10, x = P[0][0] + (P[1][0] - P[0][0]) * u + (P[3][0] - P[0][0]) * w, y = P[0][1] + (P[1][1] - P[0][1]) * u + (P[3][1] - P[0][1]) * w;
        m++; if (x >= O[0][0] && x <= O[1][0] && y >= O[0][1] && y <= O[1][1]) h++;
      }
      hid = Math.max(hid, h / m);
    }
    return Math.max(c / n, hid - .12);                    // a phone may tuck its edge under the words, no more
  }

  /** The last resort for words on phones: where the phones cannot make room, the words
   *  move instead, the way an image ad keeps its copy and its product apart. Each other
   *  headline position is laid out afresh (its phones staged for it, from a stream of
   *  their own so nothing else in the look changes) and the one that covers least is
   *  kept; a look already clear keeps everything it had.
   *  (Owner, 2026-09-30, over a centred headline across a stack of phones: "not great
   *  placement here". Placement audit: 59 of 800 looks still had words on phones.) */
  _wordsOffPhones() {
    const OK = .03, BIG = .62, st = this.st, wide = this.W / this.H >= 1.3;
    const big = () => Math.max(...this.phones.map(p => p.size), 0);
    // how a layout did: clear of the words first, then the biggest phones
    const measure = () => { this._shrinkClear(OK); return { cover: this._headCover(), size: big() }; };
    const better = (a, b) => (a.cover <= OK) !== (b.cover <= OK) ? a.cover <= OK : a.cover <= OK ? a.size > b.size + .02 : a.cover < b.cover - .02;
    const first = measure();
    if (!this.phones.length || (first.cover <= OK && first.size >= BIG)) return;
    const F = ["phones", "drawOrder", "stageC", "stageSpan", "size", "lines", "lineH", "blockH", "margin", "tag", "num", "pos", "hookLines", "hookSize", "hookWords", "phoneFit", "_lay"];
    const snap = { st: { ...st } }; for (const f of F) snap[f] = this[f];
    const homes = this.phones.map(p => [p.home.slice(), p.size]);
    const places = (wide ? ["middle-left", "top-left", "bottom-left", "top-right", "top-center", "center"]
      : ["top-left", "top-center", "top-right", "bottom-left", "middle-left", "center"]);
    // every other place for the words with the look's own layout, then, only if none is
    // clean, the calmer layouts in every place
    const order = places.filter(p => p !== snap.st.text_pos).map(p => [p, snap.st.arrangement]);
    for (const a of ["lineup", "showcase"]) if (a !== snap.st.arrangement) for (const p of places) order.push([p, a]);
    const firstCalm = places.length - 1;
    const r0 = this.r;
    const lay = ([alt, arr], k) => {
      Object.assign(st, snap.st, { text_pos: alt, arrangement: arr });
      this.r = rng(st.seed * 131 + k); this._buildPhones(); this.r = r0;
      this._layoutType(); this._numberBelowPhones(); this._headlineOffPhones();
      return measure();
    };
    let best = { ...first, k: -1 }, last = -1;
    for (let k = 0; k < order.length; k++) {
      if (k >= firstCalm && best.cover <= OK && best.size >= .45) break;   // the look's own layout came out clean and big enough: keep it
      const m = lay(order[k], k); last = k;
      if (better(m, best)) best = { ...m, k };
      if (best.cover <= OK && best.size >= BIG) break;
    }
    if (best.k < 0) {                                     // nothing did better: the look as it was
      for (const f of F) this[f] = snap[f];
      Object.assign(st, snap.st);
      this.phones.forEach((p, i) => { p.home = homes[i][0]; p.size = homes[i][1]; });
    } else if (best.k !== last) lay(order[best.k], best.k);
  }

  /** A group that still grazes the words stands a little smaller about its own middle,
   *  which only ever draws its edges in, until it clears (never under 0.6 of itself). */
  _shrinkClear(OK) {
    if (this._headCover() <= OK) return;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const P of this.phones.map(landedOutline)) for (const [x, y] of P) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, home = this.phones.map(p => [p.home.slice(), p.size]);
    for (let k = .95; k >= .6 - 1e-9; k -= .05) {
      this.phones.forEach((p, i) => { p.home = [cx + k * (home[i][0][0] - cx), cy + k * (home[i][0][1] - cy)]; p.size = home[i][1] * k; });
      if (this._headCover() <= OK) { this.phoneFit = { ...this.phoneFit, k: (this.phoneFit.k || 1) * k }; return; }
    }
    this.phones.forEach((p, i) => { p.home = home[i][0]; p.size = home[i][1]; });   // it did not clear: as it was
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
    const tagGap = size * (["box", "sticker", "highlighter", "cutout", "glass"].includes(st.text_fx) ? .34 : .14);
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
    // measured where the camera settles: it pushes in about the middle, so an edge that
    // sits inside the frame at rest can end up cut off
    const z = settleZoom(st), seen = (x, y) => [W / 2 + (x - W / 2) * z, H / 2 + (y - H / 2) * z];
    const inFrame = b => { const a = seen(b[0], b[1]), c = seen(b[2], b[3]); return a[0] >= W * .012 && c[0] <= W * .988 && a[1] >= this.insetTop + H * .008 && c[1] <= H * .99; };
    const ok = inside && inFrame(outer) && inFrame(nb) && ny + num.c.height <= H * .985 && oy >= Math.max(H * .02, this.insetTop + H * .01)
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
    // a sticker never lands on a phone: the back is the product, and the cameras are how
    // a buyer knows the model (placement audit 2026-09-30: 92 of 800 looks)
    for (const P of this.phones.map(p => onCamera(landedOutline(p), W, H, settleZoom(st)))) {   // where the camera shows them
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const [x, y] of P) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
      avoid.push([x0, y0, x1, y1]);
    }
    if (this.decor.has("spray_halo") && !this.board) this.spray = buildSpray(pos.block, size, haloColour(this.pHead), r);
    const U = Math.min(W, H), PL = this.plan;
    const s0 = PL ? (PL.burst && { x: PL.burst.x * W, y: PL.burst.y * H, R: PL.burst.R * U })
      : this.decor.has("starburst") ? this._spot(U * .105, avoid.map(grow)) : null;
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
      if (PL ? PL.arrow : tail[0] > 0 && tail[0] < W && clear) this.arrow = { from: tail, to: tip, color: lum(p.accent) > .35 ? p.accent : "#ff2e88", t0: tl.number + .25 };
    }
    if (st.urgency === "stamp") {
      const col = lum(p.ground) > .45 ? r.pick(["#d62828", "#1d4ed8", "#b5179e"]) : this.hot;
      const text = st.stamp_text || (es ? "EFECTIVO" : "CASH");
      for (let fs = Math.min(size * .5, Math.min(W, H) * .07), k = 0; k < 4 && !this.stamp; k++, fs *= .8) {
        const S = buildStamp(text, fs, col, "oswald", r), R = Math.max(S.width, S.height) * .5;
        const s = PL ? (PL.stamp && PL.stamp.k === k ? { x: PL.stamp.x * W, y: PL.stamp.y * H, over: 0 } : null) : freeSpot(W, H, R, avoid.map(grow), this.stageC);
        if (s && s.over < .1) { this.stamp = { S, x: s.x, y: s.y, t0: tl.number + .55, k }; avoid.push([s.x - R, s.y - R, s.x + R, s.y + R]); }
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
      const best = PL ? (PL.tape ? [PL.tape, 0] : ["", 1]) : ["tr", "tl", "br", "bl"].map(k => [k, score(k)]).sort((a, b) => a[1] - b[1])[0];
      if (best[1] === 0) { this.tape = { corner: best[0], text: st.cta || (es ? "¡NO ESPERES!" : "DON'T WAIT"), t0: tl.number + .35 }; this.cues.tape = this.tape.t0; }
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
      this.arrowsMode = PL ? PL.arrowsMode : chevronRoom(nb, size, W, words, r => this._onPhones(r));
      if (!this.arrowsMode) st.urgency = "flash_border";
    }
    // a pinstripe under the words only where it clears the number
    const yP = o[3] + size * .28, band = [o[0], yP - size * .32, o[2], yP + size * .42];
    this.pinstripe = PL ? PL.pinstripe : this.decor.has("pinstripe") && band[3] < H * .97 && (band[3] < nb[1] || band[1] > nb[3] || band[2] < nb[0] || band[0] > nb[2]);
    // the accents last, in the room everything above left: clear of the words, the number
    // and what points at it, the sign, the stickers, the tape's corner and the phones
    const keep = avoid.map(grow);
    // and the phones' whole group, not just each phone: a mark in the gap between two phones reads as clutter
    if (this.phones.length) {
      let gx0 = Infinity, gy0 = Infinity, gx1 = -Infinity, gy1 = -Infinity;
      for (const P of this.phones.map(q => onCamera(landedOutline(q), W, H, settleZoom(st)))) for (const [px, py] of P) { gx0 = Math.min(gx0, px); gy0 = Math.min(gy0, py); gx1 = Math.max(gx1, px); gy1 = Math.max(gy1, py); }
      keep.push([gx0, gy0, gx1, gy1]);
    }
    if (this.pinstripe) keep.push(band);
    if (this.arrowsMode || st.urgency === "arrows") keep.push([nb[0] - size * 1.4, nb[1] - size * .8, nb[2] + size * 1.4, nb[3] + size * .4]);
    if (this.arrow) keep.push([Math.min(this.arrow.from[0], this.arrow.to[0]) - size * .3, Math.min(this.arrow.from[1], this.arrow.to[1]) - size * .3, Math.max(this.arrow.from[0], this.arrow.to[0]) + size * .3, Math.max(this.arrow.from[1], this.arrow.to[1]) + size * .3]);
    if (this.tape) { const c = this.tape.corner; keep.push([c.includes("l") ? 0 : W * .55, c.includes("t") ? 0 : H * .55, c.includes("l") ? W * .45 : W, c.includes("t") ? H * .45 : H]); }
    if (PL) { this.accents = timeAccents(PL.accents.map(a => ({ ...a, x: a.x * W, y: a.y * H, R: a.R * U })), tl, this.tOutro); return; }
    this.accents = timeAccents(placeAccents(st, W, H, keep, this.board ? [o[0], o[1] - size * .5, o[2], o[3]] : o, (this.assets || {}).accents, rng(st.seed * 61 + 3), this.insetTop, this.phones.length ? onCamera([this.stageC], W, H, settleZoom(st))[0] : null), tl, this.tOutro);
  }

  /** Measure the pixels that will actually sit behind the headline once the
   *  phones have landed, and strengthen the shade behind the type until the
   *  lettering stands out at least 4.5:1 (or the shade is at full strength). */
  _contrastGuard() {
    const W = this.W, H = this.H, q = 4, w = Math.max(8, Math.round(W / q)), h = Math.max(8, Math.round(H / q));
    const c = canvas(w, h), x = c.getContext("2d", { willReadFrequently: true });
    const [bx0, by0, bx1, by1] = this.pos.block;
    const ink = hexRgb(this.st.text_fx === "box" ? this.p.plate_ink : this.p.ink);
    if (["box", "sticker", "cutout", "highlighter", "glass"].includes(this.st.text_fx)) return;   // carried by their own plate
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
    if (s < 0) s = { box: 0, sticker: .25, cutout: .3, highlighter: .2, double_outline: .3, glass: .15, outline: .8, neon: .8 }[st.text_fx] ?? .65;
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

  /** Grounds that keep moving after the phones land: soft light that never stops the frame going dead. */
  _drawLiveGround(ctx, t) {
    const st = this.st, W = this.W, H = this.H, p = this.p, D = Math.hypot(W, H);
    if (st.background === "aurora") {
      // three ribbons of the ground's own light, slow and wide, one faintly in the accent
      const cols = [p.light, p.light, lum(p.accent) > .3 ? p.accent : p.light];
      ctx.save(); ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < 3; i++) {
        const ph = st.seed % 11 + i * 2.1, yc = H * (.22 + .18 * i) + Math.sin(t * .45 + ph) * H * .05, thick = H * (.09 + .03 * i);
        const gr = ctx.createLinearGradient(0, yc - thick, 0, yc + thick);
        const a = i === 2 ? .12 : .2;
        gr.addColorStop(0, rgba(cols[i], 0)); gr.addColorStop(.5, rgba(cols[i], a)); gr.addColorStop(1, rgba(cols[i], 0));
        ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(0, yc + thick);
        for (let xx = 0; xx <= W; xx += W / 24) ctx.lineTo(xx, yc - thick + Math.sin(xx / W * 5 + t * .7 + ph) * thick * .5);
        ctx.lineTo(W, yc + thick * 2); ctx.lineTo(0, yc + thick * 2); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    } else if (st.background === "drift") {
      // two big soft pools of light and shade circling slowly
      for (const [k, col, a] of [[0, p.light, .38], [1, shade(p.ground, -.4), .35]]) {
        const th = t * .35 + k * Math.PI + (st.seed % 7), bx = W / 2 + Math.cos(th) * W * .32, by = H / 2 + Math.sin(th * .8) * H * .28;
        const gr = ctx.createRadialGradient(bx, by, 0, bx, by, D * .42);
        gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0)); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      }
    }
  }

  /** What stands the phones on the ground: a soft pool under the group (drawn once, in the ground). */
  _softFloor() {
    if (this.st.depth !== "soft_floor" || !this.phones.length) return;
    const outs = this.phones.map(landedOutline);
    let x0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const P of outs) for (const [x, y] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const x = this.bg.getContext("2d"), cx = (x0 + x1) / 2, rx = (x1 - x0) * .62, ry = Math.max(this.H * .03, rx * .12);
    x.save(); x.translate(cx, Math.min(y1, this.H * .98)); x.scale(1, ry / rx);
    const g = x.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, "rgba(0,0,0,.34)"); g.addColorStop(.6, "rgba(0,0,0,.12)"); g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g; x.fillRect(-rx, -rx, rx * 2, rx * 2); x.restore();
  }

  /** A phone's mirror image in a glossy floor, under its lowest edge, fading out fast. */
  _reflect(target, p, stt) {
    const [x, y, scale, rot, flip, z, op] = stt;
    if (z > .05 || Math.abs(rot) > 24 || op < .99) return;
    const w = p.w * scale * Math.max(Math.abs(Math.cos(flip)), .02), h = p.h * scale, a = rot * Math.PI / 180;
    const yb = y + Math.abs(w / 2 * Math.sin(a)) + Math.abs(h / 2 * Math.cos(a));
    const depth = h * .32, half = Math.hypot(w, h) / 2 + 4;
    if (yb + 4 > this.H) return;
    const c = this._reflC || (this._reflC = canvas(8, 8));
    const cw = Math.ceil(half * 2), ch = Math.ceil(depth);
    if (c.width < cw || c.height < ch) { c.width = Math.max(c.width, cw); c.height = Math.max(c.height, ch); }
    const rx = c.getContext("2d"); rx.clearRect(0, 0, c.width, c.height);
    rx.save(); rx.translate(half - x, -yb); rx.translate(0, 2 * yb); rx.scale(1, -1);
    drawPhone(rx, p, x, y, scale, rot, flip, 0, 1, this.W, null, true);
    rx.restore();
    rx.globalCompositeOperation = "destination-in";
    const g = rx.createLinearGradient(0, 0, 0, ch); g.addColorStop(0, "rgba(0,0,0,.26)"); g.addColorStop(1, "rgba(0,0,0,0)");
    rx.fillStyle = g; rx.fillRect(0, 0, cw, ch); rx.globalCompositeOperation = "source-over";
    if (this.numBox) { const [a0, b0, a1, b1] = this.numBox; rx.clearRect(a0 - (x - half) - 8, b0 - yb - 8, a1 - a0 + 16, b1 - b0 + 16); }   // never under the number
    target.drawImage(c, 0, 0, cw, ch, x - half, yb, cw, ch);
  }

  /** How far, in pixels, the furthest-travelling corner of any phone moves while one
   *  frame's shutter is open (the slab's turn counts: an edge sweeping across the face). */
  _shutterTravel(t, dt) {
    const span = dt * .55, n = 8;
    let most = 0;
    for (const p of this.phones) {
      let prev = null, d = 0;
      for (let k = 0; k <= n; k++) {
        const s = phoneState(p, t + (k / n - .5) * span, this.st);
        if (!s) { prev = null; continue; }
        const [x, y, sc, rot, flip] = s, hw = p.w * sc / 2 * Math.cos(flip), hh = p.h * sc / 2;
        const a = -rot * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
        const pts = [[hw, hh], [-hw, hh], [hw, -hh], [-hw, -hh]].map(([u, v]) => [x + u * ca - v * sa, y + u * sa + v * ca]);
        if (prev) d += Math.max(...pts.map((q, i) => Math.hypot(q[0] - prev[i][0], q[1] - prev[i][1])));
        prev = pts;
      }
      most = Math.max(most, d);
    }
    return most;
  }

  /** How many moments of the shutter one frame's phones are drawn at. An export takes as
   *  many as the motion needs for no corner to jump more than BLUR_STEP px between two of
   *  them: a fixed 8 left a fast spin as a fan of separate copies, on frame 0 too, which is
   *  the thumbnail. The preview keeps its fixed few, to play live. */
  _subsFor(t, dt, quality) {
    const flying = t < this.tl.landed + .02, moving = t < this.tl.revealEnd + .05;
    const subs = flying ? quality.subsFly : moving ? quality.subsMove : 1;
    if (subs <= 1 || !(quality.maxSubs > subs)) return subs;
    return Math.min(quality.maxSubs, Math.max(subs, Math.ceil(this._shutterTravel(t, dt) / BLUR_STEP) + 1));
  }

  _phonesLayer(t, dt, quality) {
    if (this.still && !this.liveGround && !this.livePhones) return this.still;
    const subs = this._subsFor(t, dt, quality);
    const ax = this.acc.getContext("2d"), tx = this.tmp.getContext("2d");
    for (let s = 0; s < subs; s++) {
      const ts = subs > 1 ? t + (s / (subs - 1) - .5) * dt * .55 : t;
      const target = s === 0 ? ax : tx;
      target.globalAlpha = 1; target.drawImage(this.bg, 0, 0);
      this._drawRays(target, ts);
      if (this.liveGround) this._drawLiveGround(target, ts);
      const refl = this.st.depth === "reflection";
      for (const i of this.drawOrder) {
        const p = this.phones[i], stt = phoneState(p, ts, this.st);
        if (!stt) continue;
        if (refl) this._reflect(target, p, stt);
        const soft = this.dofBlur && p.size < this.dofSize * .93 && "filter" in target;
        if (soft) target.filter = `blur(${this.dofBlur}px)`;
        drawPhone(target, p, ...stt, this.W);
        if (soft) target.filter = "none";
      }
      if (s > 0) { ax.globalAlpha = 1 / (s + 1); ax.drawImage(this.tmp, 0, 0); ax.globalAlpha = 1; }
    }
    if (t > this.tl.still && !this.liveGround && !this.livePhones) {
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
    // an opening with no words opens close on the phones and pulls back, so the thumbnail is
    // the product, not the ground (frame 0 of these hooks showed under 15% of anything)
    if (["flash_cut", "cold_open"].includes(this.st.hook) && t < .6) {
      const e = 1 - outCubic(clamp(t / .6)), z = c[0] * lerp(1, 1.6, e);
      c[1] -= e * z * (this.stageC[0] - this.W / 2) / this.W; c[2] -= e * z * (this.stageC[1] - this.H / 2) / this.H; c[0] = z;
    }
    if (this.st.urgency === "beat_pump") c[0] *= 1 + .022 * beatPulse(t, this.tl.hit, this.st.bpm || 118);
    return c;
  }

  _hookLine(ctx, t, hold = false) {
    const W = this.W, H = this.H, s0 = outCubic(prog(t, 0, .14)), out = hold ? 0 : prog(t, this.hookEnd - .04, .22);
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
    // after the pop the words keep pushing toward the viewer, so the opening second never stands still
    const a = 1 - out, s = lerp(1.25, 1, s0) * (1 + .12 * outCubic(prog(t, .14, .9))) * (1 + .3 * out);
    const lh = this.hookLines[0].asc * 1.02, total = lh * this.hookLines.length;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(W / 2, H / 2); ctx.scale(s, s);
    this.hookLines.forEach((L, i) => ctx.drawImage(L.c, -L.inkW / 2 - L.pad, -total / 2 + i * lh - L.pad));
    ctx.restore();
  }

  /** The opening words hand over to the scene: the whole opening (wash and words) is
   *  drawn as it last stood, then cut away by the look's transition. */
  _transition(ctx, t) {
    const W = this.W, H = this.H, tr = this.st.transition, t0 = this.hookEnd - .04, u = prog(t, t0, .26);
    if (tr === "flash") {                                  // a white frame hides the cut
      if (t < t0 + .05) this._hookLine(ctx, Math.min(t, this.hookEnd - .05), true);
      const f = t - t0; if (f >= 0 && f < .2) { ctx.fillStyle = `rgba(255,255,255,${.55 * (f < .05 ? f / .05 : 1 - (f - .05) / .15)})`; ctx.fillRect(0, 0, W, H); }
      return;
    }
    if (u >= 1) return;
    const c = this._trC || (this._trC = canvas(W, H)), x = c.getContext("2d");
    x.clearRect(0, 0, W, H); this._hookLine(x, Math.min(t, this.hookEnd - .05), true);
    const inE = u * u;                                      // leaves accelerating, like a cut on the beat
    ctx.save();
    switch (tr) {
      case "zoom_through": { const s = 1 + 2.6 * inE; ctx.globalAlpha = 1 - outCubic(u); ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.drawImage(c, -W / 2, -H / 2); break; }
      case "whip": {
        const dx = -W * 1.25 * inE;
        for (let k = 3; k >= 0; k--) { ctx.globalAlpha = k ? .22 * (1 - u) : 1; ctx.drawImage(c, dx + k * W * .05 * u, 0); }
        break;
      }
      case "iris": {
        const [cx, cy] = this.stageC, R = Math.hypot(W, H) * outCubic(u);
        x.globalCompositeOperation = "destination-out"; x.beginPath(); x.arc(cx, cy, R, 0, 7); x.fill(); x.globalCompositeOperation = "source-over";
        ctx.drawImage(c, 0, 0);
        ctx.strokeStyle = rgba("#ffffff", .5 * (1 - u)); ctx.lineWidth = Math.max(2, W * .006); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
        break;
      }
      case "slice": {
        const n = 4, bh = H / n;
        for (let i = 0; i < n; i++) { const q = prog(u, i * .1, .7), dx = (i % 2 ? 1 : -1) * W * 1.1 * q * q; ctx.drawImage(c, 0, i * bh, W, bh + 1, dx, i * bh, W, bh + 1); }
        break;
      }
      case "block": {
        const bw = W * .45, e = lerp(0, W + bw, outCubic(u));   // a bar of the look's loud colour wipes the words away
        ctx.save(); ctx.beginPath(); ctx.rect(e, 0, W, H); ctx.clip(); ctx.drawImage(c, 0, 0); ctx.restore();
        ctx.fillStyle = this.hot; ctx.fillRect(e - bw, 0, bw, H);
        break;
      }
      default: ctx.globalAlpha = 1 - u; ctx.drawImage(c, 0, 0);
    }
    ctx.restore();
  }

  /** The last second: the number is what the viewer is left holding. */
  _outro(ctx, t) {
    const T = this.tOutro; if (T == null || t < T) return;
    const st = this.st, W = this.W, H = this.H, c = this.num.c, [nx, ny] = this.pos.num;
    if (st.outro === "settle") {
      // everything but the number steps back into shade
      const u = outCubic(prog(t, T, .5)), [a0, b0, a1, b1] = this.numBox, g = this.size * .2;
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); if (ctx.roundRect) ctx.roundRect(a0 - g, b0 - g, a1 - a0 + 2 * g, b1 - b0 + 2 * g, g); else ctx.rect(a0 - g, b0 - g, a1 - a0 + 2 * g, b1 - b0 + 2 * g);
      ctx.fillStyle = `rgba(0,0,0,${.34 * u})`; ctx.fill("evenodd"); ctx.restore();
      const sp = prog(t, T + .35, .7); if (sp > 0 && sp < 1) this._shine(ctx, nx, ny, c.width, c.height, sp, c);
      return;
    }
    // end card: a calm wash, and the number alone, big and centred
    const u = outCubic(prog(t, T, .4)), ink = lum(this.p.ink) > .5, wash = mix(this.p.ground, ink ? "#000000" : "#ffffff", .35);
    ctx.fillStyle = rgba(wash, u); ctx.fillRect(0, 0, W, H);
    const gl = ctx.createRadialGradient(W / 2, H * .52, 0, W / 2, H * .52, Math.max(W, H) * .6);
    gl.addColorStop(0, rgba(this.p.light, .3 * u)); gl.addColorStop(1, rgba(this.p.light, 0)); ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    const k = Math.min(W * .8 / c.width, H * .2 / c.height, 1.9), s = lerp(1, k, u);
    const cx = lerp(nx + c.width / 2, W / 2, u), cy = lerp(ny + c.height / 2, H * .52, u);
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.drawImage(c, -c.width / 2, -c.height / 2); ctx.restore();
    const Lc = this.num.label;
    if (Lc) { const ls = Math.min(s * .8, W * .8 / Lc.width); ctx.save(); ctx.globalAlpha = u; ctx.translate(cx, cy - c.height * s / 2 - Lc.height * ls * .75); ctx.scale(ls, ls); ctx.drawImage(Lc, -Lc.width / 2, -Lc.height / 2); ctx.restore(); }
    const sp = prog(t, T + .45, .7);
    if (sp > 0 && sp < 1) { ctx.save(); ctx.translate(cx - c.width * s / 2, cy - c.height * s / 2); ctx.scale(s, s); this._shine(ctx, 0, 0, c.width, c.height, sp, c); ctx.restore(); }
  }

  /** The whole frame's colour, last of all: one grade across every layer, the way a finished film has one. */
  _grade(ctx, t) {
    const g = this.st.grade; if (!g || g === "none") return;
    const W = this.W, H = this.H;
    const tint = (col, a, op) => { ctx.save(); ctx.globalCompositeOperation = op; ctx.fillStyle = rgba(col, a); ctx.fillRect(0, 0, W, H); ctx.restore(); };
    const filt = f => {
      if (!("filter" in ctx)) return;
      const s = this._gradeC || (this._gradeC = canvas(W, H)), sx = s.getContext("2d");
      sx.clearRect(0, 0, W, H); sx.drawImage(ctx.canvas, 0, 0);
      ctx.save(); ctx.filter = f; ctx.drawImage(s, 0, 0); ctx.filter = "none"; ctx.restore();
    };
    const dark = (this.bgLum ?? .5) < .3;                    // a dark scene is lifted, never pushed further into black
    switch (g) {
      case "clean": filt(dark ? "saturate(1.06) brightness(1.05)" : "contrast(1.06) saturate(1.06)"); break;
      case "warm": tint("#ff9a3c", .12, "soft-light"); break;
      case "cool": tint("#3c8cff", .12, "soft-light"); break;
      case "punchy": filt(dark ? "saturate(1.2) brightness(1.06)" : "contrast(1.12) saturate(1.2)"); break;
      case "matte": tint("#15151a", 1, "lighten"); filt("saturate(.92)"); break;
      case "film": {
        tint("#ff9a3c", .08, "soft-light"); tint("#111115", 1, "lighten");
        this._filmNoise = this._filmNoise || noiseTile(256, this.st.seed + 9, 30);
        ctx.save(); ctx.globalAlpha = .16; ctx.translate(Math.floor(t * 83) % 256, Math.floor(t * 57) % 256);
        ctx.fillStyle = ctx.createPattern(this._filmNoise, "repeat"); ctx.fillRect(-256, -256, W + 512, H + 512); ctx.restore();
        break;
      }
    }
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

  frame(ctx, t, quality = EXPORT_QUALITY, dt = 1 / 30) {
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
    if (this.hookLines && t < this.hookEnd + .3) {
      if ((st.transition || "fade") === "fade" || t < this.hookEnd - .04) this._hookLine(ctx, t);
      else this._transition(ctx, t);
    }
    if (st.hook === "flash_cut") for (const p of this.phones) { if (!p.flashIn) continue; const f = t - p.tFlash; if (f >= 0 && f < .09) { ctx.fillStyle = `rgba(255,255,255,${.6 * (1 - f / .09)})`; ctx.fillRect(0, 0, W, H); } }
    if (this.scrimC) { const k = prog(t, tl.text - .1, .4); if (k > 0) { ctx.globalAlpha = k; ctx.drawImage(this.scrimC, 0, 0, W, H); ctx.globalAlpha = 1; } }
    if (this.spray) drawSpray(ctx, this.spray, this.pos.block, t, tl.text);
    if (this.board) drawBoard(ctx, this.board, this.pos.board[0], this.pos.board[1], t, tl.text - .12, W, H);
    if (st.speed_lines) this._speedLines(ctx, t);
    this._headline(ctx, t, dt);
    if (this.tag) { const q = prog(t, tl.tag, .35); if (q > 0) { ctx.globalAlpha = q; ctx.drawImage(this.tag, lerp(this.pos.tag[0] - W * .05, this.pos.tag[0], outCubic(q)), this.pos.tag[1]); ctx.globalAlpha = 1; } }
    if (this.pinstripe) drawPinstripe(ctx, this.pos.outer, this.size, lum(this.p.accent) > .45 ? this.p.accent : "#f6c945", t, tl.tag + .1);
    this._number(ctx, t);
    this._urgency(ctx, t);
    if (this.accents && this.accents.length) drawAccents(ctx, this.accents, t, st, this.p, W, H, (this.assets || {}).accents);
    if (st.sparkles) this._sparkles(ctx, t);
    this._overlay(ctx, t);
    if (this.ticker) { const q = outCubic(prog(t, Math.max(0, tl.text - .25), .3)); if (q > 0) drawTicker(ctx, this.ticker, W, this.tickerY - (1 - q) * (this.tickerY + this.tickerH), t); }
    if (st.urgency === "flash_border") drawFlashBorder(ctx, W, H, this.hot, t, tl.hit, st.bpm || 118);
    if (st.flash) { const f = t - tl.hit; if (f >= 0 && f < .12) { ctx.fillStyle = `rgba(255,255,255,${.27 * (1 - f / .12)})`; ctx.fillRect(0, 0, W, H); } }
    if (st.rgb_hit) { const d = t - tl.hit; if (d >= 0 && d < .16) this._rgbShift(ctx, Math.round(W * .006 * (1 - d / .16))); }
    this._outro(ctx, t);
    this._grade(ctx, t);
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
        case "zoom_blur": { const e = outQuint(q), s = lerp(1.6, 1, e); drawLine(xEnd, y, clamp(q * 2.5), s, s, 0, (1 - e) * this.size * .2); break; }
        case "elastic": drawLine(xEnd, y, clamp(q * 4), Math.max(.01, outElastic(q)), lerp(1.3, 1, outCubic(clamp(q * 2)))); break;
        case "mask_words": {
          // each word rises out of the line it sits on, one after another
          const words = []; let cur = null;
          L.text.split("").forEach((ch, k) => { if (ch === " ") { cur = null; return; } if (!cur) { cur = { a: k, b: k }; words.push(cur); } else cur.b = k; });
          ctx.save(); ctx.beginPath(); ctx.rect(0, y, W, L.c.height - L.pad * .6); ctx.clip();
          words.forEach((wd, wi) => {
            const qw = prog(t, t0 + wi * .07, .42); if (qw <= 0) return;
            const e = outQuint(qw), x0 = Math.max(0, L.xs[wd.a] + L.pad - this.size * .12);
            const x1 = Math.min(L.c.width, (wd.b + 1 < L.xs.length ? L.xs[wd.b + 1] : L.inkW) + L.pad + this.size * .12);
            ctx.drawImage(L.c, x0, 0, x1 - x0, L.c.height, xEnd + x0, y + (1 - e) * L.c.height * .85, x1 - x0, L.c.height);
          });
          ctx.restore();
          if (shineP > 0 && shineP < 1) this._shine(ctx, xEnd, y, L.c.width, L.c.height, shineP, L.c);
          break;
        }
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
      case "glow_on": {
        // it comes up out of a white glow that burns off
        const k = 1 - outCubic(q), s = lerp(1.08, 1, outCubic(q));
        ctx.save(); ctx.globalAlpha = clamp(q * 2.5); ctx.translate(nx + c.width / 2, ny + c.height / 2); ctx.scale(s * pump, s * pump);
        if (k > .02) { ctx.shadowColor = `rgba(255,255,255,${.9 * k})`; ctx.shadowBlur = this.size * .8 * k; }
        ctx.drawImage(c, -c.width / 2, -c.height / 2); ctx.restore(); break;
      }
      case "slot": {
        // each slice spins down like a slot reel and stops, left to right
        const n = Math.max(6, Math.min(12, this.num.text.length));
        for (let i = 0; i < n; i++) {
          const qi = prog(t, tl.number + i * .045, .5); if (qi <= 0) continue;
          const x0 = c.width * i / n, w = c.width / n + 1, e = outCubic(qi), off = ((1 - e) * 3 * c.height) % c.height;
          ctx.save(); ctx.beginPath(); ctx.rect(nx + x0, ny, w, c.height); ctx.clip(); ctx.globalAlpha = qi < 1 ? .85 : 1;
          ctx.drawImage(c, nx, ny + off); if (off > .5) ctx.drawImage(c, nx, ny + off - c.height);
          ctx.restore();
        }
        break;
      }
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
      case "bokeh_drift": {
        // soft discs of light rising slowly, kept off the words and the number
        const r = rng(st.seed * 17), col = lum(this.p.light) > .6 ? this.p.light : "#ffffff", keep = [this.pos.outer, this.numBox].filter(Boolean);
        ctx.save(); ctx.globalCompositeOperation = "screen";
        for (let i = 0; i < 16; i++) {
          const rad = r.uniform(.03, .08) * W, sp = r.uniform(.03, .07) * H, x = r() * W + Math.sin(t * .5 + i) * W * .02;
          const y = ((r() * (H + 2 * rad) - t * sp) % (H + 2 * rad) + H + 2 * rad) % (H + 2 * rad) - rad, a = r.uniform(.1, .22);
          if (keep.some(b => x > b[0] - rad && x < b[2] + rad && y > b[1] - rad && y < b[3] + rad)) continue;
          const g = ctx.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, rgba(col, a)); g.addColorStop(.7, rgba(col, a * .5)); g.addColorStop(1, rgba(col, 0));
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
        }
        ctx.restore(); break;
      }
      case "light_rays": {
        // a few wide shafts from a top corner, turning a little
        const side = st.seed % 2 ? 1 : -1, ox = side > 0 ? W * 1.05 : -W * .05, oy = -H * .08, R = Math.hypot(W, H) * 1.3;
        const base = Math.atan2(H * .6, (W / 2 - ox)) , r = rng(st.seed * 23);
        ctx.save(); ctx.globalCompositeOperation = "screen";
        for (let i = 0; i < 5; i++) {
          const a = base + (i - 2) * .16 + Math.sin(t * .4 + i) * .025, wd = r.uniform(.03, .07);
          const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, R); g.addColorStop(0, "rgba(255,248,230,.2)"); g.addColorStop(1, "rgba(255,248,230,0)");
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.arc(ox, oy, R, a - wd, a + wd); ctx.closePath(); ctx.fill();
        }
        ctx.restore(); break;
      }
      case "dust": {
        const r = rng(st.seed * 29), s0 = Math.max(1, W / 900);
        ctx.save(); ctx.fillStyle = "#ffffff";
        for (let i = 0; i < 46; i++) {
          const x = (r() * W + t * r.uniform(-12, 12) * s0 + W) % W, y = (r() * H - t * r.uniform(4, 16) * s0 + H * 4) % H;
          ctx.globalAlpha = r.uniform(.25, .55) * (.6 + .4 * Math.sin(t * 2 + i)); ctx.beginPath(); ctx.arc(x, y, r.uniform(.8, 2.4) * s0, 0, 7); ctx.fill();
        }
        ctx.restore(); break;
      }
      case "shimmer": {
        // once the number is up, one soft sheen crosses the whole frame
        const u = prog(t, tl.number + .6, 1); if (u <= 0 || u >= 1) return;
        const x = lerp(-W * .6, W * 1.6, u), g = ctx.createLinearGradient(x - W * .25, 0, x + W * .25, H * .4);
        g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(.5, "rgba(255,255,255,.16)"); g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); break;
      }
      case "bloom": {
        // the brightest parts spill a little light: a blurred copy laid on in screen
        if (!("filter" in ctx)) return;
        const s = this._bloomC || (this._bloomC = canvas(W, H)), sx = s.getContext("2d");
        sx.clearRect(0, 0, W, H); sx.filter = `blur(${Math.max(2, W * .012)}px) brightness(.9)`; sx.drawImage(ctx.canvas, 0, 0); sx.filter = "none";
        ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = .2; ctx.drawImage(s, 0, 0); ctx.restore(); break;
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
  stillAt(ctx, t) { this.still = null; this.frame(ctx, t ?? (this.tOutro != null ? this.tOutro - .05 : this.st.duration - .1), { subsFly: 1, subsMove: 1 }); }
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
  // never a photo that failed its check (ok: false). A painted back (repaint) stays: each is
  // a model Apple made in a finish it was sold in, built from a real back and Apple's own
  // straight-on camera where no straight photo of it exists (scripts/bake_extra_phones.py),
  // and the picker says so. Dropping them too, as the owner's "no fake designs" (2026-09-30,
  // after an orange 16 Pro Max that never existed) was first read, would leave no 14, no 15
  // and no 16 Pro: the blue 15 Pros take their camera from Apple's render now as well.
  idx.phones = idx.phones.filter(m => m.ok !== false);
  const phones = {};
  await Promise.all(idx.phones.map(m => new Promise(res => {
    const img = new Image(); img.decoding = "async";
    img.onload = () => { phones[m.id] = { img, meta: m }; PHONE_META[m.id] = m; res(); };
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
