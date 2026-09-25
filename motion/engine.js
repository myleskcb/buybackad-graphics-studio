// Phone Ad Maker engine: draws one frame of an ad at any time t.
// Ported from iphoneslainv scripts/phone-ad/adengine (the Mac engine).

import { FONTS, FINE_FACES, PALETTES, FINISH_PALETTES, OPTIONS, WEIGHTS, FLAGS, HEADLINES, TAGS,
  NUMBER_LABELS, DEFAULT_STYLE } from "./catalog.js";

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
function rrect(ctx, x, y, w, h, r) {
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
  if (content) {
    if (!locked.has("headline")) out.headline = r.pick(HEADLINES);
    if (!locked.has("tag")) out.tag = r.pick(TAGS);
    if (!locked.has("number_label")) out.number_label = r.pick(NUMBER_LABELS);
  }
  if (!locked.has("phones") && phonesPool.length > 5) out.phones = r.sample(phonesPool, r.pick([3, 4, 4, 5]));
  return harmonise(out, locked);
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
  const p = pal(st);
  const darkInk = lum(p.ink) < 0.5;
  if (st.text_pos === "bottom-left" && ["bottom-left", "bottom-center"].includes(st.number_pos) && !locked.has("number_pos")) st.number_pos = "bottom-right";
  if (st.text_pos === "top-right" && st.number_pos === "bottom-right" && !locked.has("number_pos")) st.number_pos = "bottom-left";
  if (["top-center", "center"].includes(st.text_pos) && ["bottom-left", "bottom-right"].includes(st.number_pos) && !locked.has("number_pos")) st.number_pos = "bottom-center";
  if (st.number_in === "type" && !locked.has("number_sfx")) st.number_sfx = "ticks";
  if (st.text_fx === "box" && st.color_mode === "split_lines") st.color_mode = "mono";
  // dark type crosses black glass somewhere in almost every layout
  const onPlate = ["sticker", "box", "highlighter", "cutout", "double_outline"];
  if (darkInk && !onPlate.includes(st.text_fx) && !locked.has("text_fx")) st.text_fx = ["sticker", "box", "highlighter", "double_outline"][st.seed % 4];
  if (darkInk && st.text_fx === "neon") st.text_fx = "sticker";
  if (!darkInk && lum(p.accent) < 0.42 && st.color_mode !== "mono" && st.text_fx !== "box" && !locked.has("color_mode")) st.color_mode = "mono";
  // an outline or a neon tube only reads on a darker ground
  if (lum(p.ground) > .5 && ["outline", "neon"].includes(st.text_fx) && !locked.has("text_fx")) st.text_fx = st.text_fx === "outline" ? "double_outline" : "shadow";
  if (lum(p.ground) > .4 && st.number_style === "neon" && !locked.has("number_style")) st.number_style = "pill";
  // one "quote" is enough: a tag and a label must not say the same thing twice
  if (st.tag && st.number_label && /QUOTE/i.test(st.tag) && /QUOTE/i.test(st.number_label) && !locked.has("number_label")) st.number_label = "";
  if (FINE_FACES.has(st.font) && ["outline", "neon", "double_outline", "cutout", "long_shadow"].includes(st.text_fx) && !locked.has("text_fx")) st.text_fx = "shadow";
  if (st.case === "title" && !locked.has("tracking")) st.tracking = Math.min(st.tracking, 0.05);
  if ((FONTS[st.font] || [])[3] === "wide" && !locked.has("tracking")) st.tracking = Math.min(st.tracking, 0.01);
  return st;
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
    p.tIn = .1 + k * stag; p.tLand = p.tIn + dur;
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
  });
  return Math.max(...phones.map(p => p.tLand));
}

function phoneState(p, t, st) {
  if (t < p.tIn) return null;
  const [hx, hy] = p.home, base = p.size;
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

const fontCss = (name, size) => { const [fam, wt] = FONTS[name] || FONTS.franklin; return `${wt} ${Math.round(size)}px "${fam}", "Arial Black", sans-serif`; };

export function applyCase(text, cs) {
  let out = cs === "upper" ? text.toUpperCase() : text.split(/\s+/).map(w => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w).join(" ");
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
      const d = Math.max(2, size * .06); ctx.save(); ctx.translate(d, d); fillAll(accent); ctx.restore(); fillAll(); break;
    }
    case "outline":
      ctx.shadowColor = shadowCol; ctx.shadowBlur = size * .08; strokeAll(null, Math.max(2, size * .05)); break;
    case "sticker": {
      const plate = darkInk ? "#ffffff" : (Math.abs(lum(p.plate) - lum(ink)) < .25 ? "#111111" : p.plate);
      ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = size * .1; ctx.shadowOffsetY = size * .04;
      strokeAll(plate, size * .24); noShadow(); fillAll(); break;
    }
    case "extrude": {
      const depth = Math.max(3, Math.round(size * .08));
      const col = Math.abs(lum(accent) - lum(ink)) < .2 ? shade(ink, darkInk ? .6 : -.65) : accent;
      ctx.shadowColor = "rgba(0,0,0,.3)"; ctx.shadowBlur = size * .08; ctx.shadowOffsetY = size * .03;
      for (let k = depth; k >= 1; k--) { ctx.save(); ctx.translate(k, k); fillAll(col); ctx.restore(); if (k === depth) noShadow(); }
      fillAll(); break;
    }
    case "glow": {
      const g = darkInk ? "#ffffff" : accent;
      ctx.shadowColor = rgba(g.startsWith("#") ? g : "#ffffff", .9); ctx.shadowBlur = size * .38; fillAll(); fillAll(); break;
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
    case "long_shadow": {
      const L = Math.round(size * .35), col = shade(p.ground, -.45);
      for (let k = L; k >= 1; k -= 1) { ctx.save(); ctx.translate(k, k); fillAll(col); ctx.restore(); }
      fillAll(); break;
    }
    case "highlighter": {
      const barCol = lum(p.accent) > .45 ? p.accent : (darkInk ? "#fff176" : p.plate);
      ctx.save(); ctx.globalAlpha = .92; ctx.fillStyle = barCol;
      ctx.beginPath(); ctx.moveTo(pad - size * .1, by - asc * .55); ctx.lineTo(pad + inkW + size * .12, by - asc * .62);
      ctx.lineTo(pad + inkW + size * .08, by + desc * .35); ctx.lineTo(pad - size * .14, by + desc * .45); ctx.closePath(); ctx.fill(); ctx.restore();
      fillAll(Math.abs(lum(barCol) - lum(ink)) < .3 ? (lum(barCol) > .5 ? "#111111" : "#ffffff") : null); break;
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
      const plateCol = darkInk ? ink : "#ffffff";
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
      for (let k = 0; k < wd.length; k++) cols.push(col);
      cols.push(col); wi++;
    });
    return new Line(ln, cols.slice(0, ln.length), st, p, size, letters);
  });
}

function numberSprite(st, p, size) {
  const text = formatNumber(st.number, st.number_format) || "YOUR NUMBER";
  const font = st.number_font === "same" ? st.font : st.number_font;
  const style = st.number_style;
  const fxFor = { plain: ["hard_shadow", "extrude", "glow", "chrome", "neon", "long_shadow"].includes(st.text_fx) ? st.text_fx : "shadow",
    sticker: "sticker", outline: "shadow", underline: "shadow", neon: "neon", chrome: "chrome", split: "shadow", stacked: "flat" };
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
  } else out = sp.c;
  const trimmed = trim(out);
  let label = null;
  if (st.number_label) {
    const lt = applyCase(st.number_label, "upper");
    const lsp = inkSprite(lt, lt.split("").map(() => p.ink), font, Math.max(12, size * .34), .08, lum(p.ink) < .5 ? "flat" : "shadow", p, 0);
    label = trim(lsp.c);
  }
  return { c: trimmed, label, text };
}

function trim(c) {
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
  // vignette
  const vg = x.createRadialGradient(cx, cy, Math.hypot(W, H) * .3, cx, cy, Math.hypot(W, H) * .75);
  vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.28)"); x.fillStyle = vg; x.fillRect(0, 0, W, H);
  if (st.grain) { const nc = noiseTile(256, st.seed, 12); x.globalAlpha = .35; x.fillStyle = x.createPattern(nc, "repeat"); x.fillRect(0, 0, W, H); x.globalAlpha = 1; }
  return c;
}

function noiseTile(n, seed, amp) {
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

// ------------------------------------------------------------ the ad

export class Ad {
  /** assets: { phones: {id: {img, meta}} } */
  constructor(style, assets, width, height) {
    this.st = { ...DEFAULT_STYLE, ...style };
    const st = this.st;
    this.W = width || (ASPECTS[st.aspect] || ASPECTS["1:1"])[0];
    this.H = height || (ASPECTS[st.aspect] || ASPECTS["1:1"])[1];
    this.p = pal(st);
    this.r = rng(st.seed);
    this.assets = assets;
    this._buildPhones();
    this._timeline();
    this._layoutType();
    this.bg = background(st, this.p, this.W, this.H, this.stageC, rng(st.seed + 1));
    this._scrim();
    this.still = null;
    this.acc = canvas(this.W, this.H); this.tmp = canvas(this.W, this.H);
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
    this.tLanded = this.phones.length ? planEntries(this.phones, st, W, H, this.r, this.stageC) : .3;
  }

  _timeline() {
    const r0 = this.tLanded + .35; let k = 0;
    for (const i of this.drawOrder) { const p = this.phones[i]; if (p.reveal) p.tReveal = r0 + (k++) * .1; }
    const revealEnd = k ? r0 + (k - 1) * .1 + .5 : this.tLanded;
    this.tl = { landed: this.tLanded, revealEnd, text: revealEnd + .05, still: revealEnd + .25 };
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
    const mc = canvas(4, 4).getContext("2d"); mc.font = fontCss(st.font, size);
    let bestN = 2, bestS = 0;
    for (const n of [...new Set([1, 2, 3, 4].map(k => Math.min(words, k)))]) {
      const ls = splitLines(text, n);
      const wid = Math.max(...ls.map(l => mc.measureText(l).width + st.tracking * size * l.length));
      const hgt = size * .82 * (.98 * (ls.length - 1) + 1);
      const s2 = size * Math.min(1, maxW / Math.max(wid, 1), maxH / Math.max(hgt, 1));
      if (s2 > bestS * 1.04) { bestN = n; bestS = s2; }
    }
    const alts = [st.number_pos, ...["under-headline", "bottom-center", "bottom-right", "bottom-left"].filter(x => x !== st.number_pos)];
    let pos = null, lines, lineH, blockH, tag, num, firstFit = null, dropLabel = false;
    for (let attempt = 0; attempt < 18; attempt++) {
      lines = headlineLines(st, p, size, bestN);
      const gap = size * (["box", "sticker", "highlighter", "cutout", "double_outline"].includes(st.text_fx) ? .14 : .02);
      lineH = lines[0].asc * .98 + gap;
      const widest = Math.max(...lines.map(L => L.inkW));
      blockH = lineH * (lines.length - 1) + lines[0].asc;
      if (widest > maxW || blockH > maxH) { size *= .93; continue; }
      tag = st.tag ? trim(inkSprite(applyCase(st.tag, "upper"), st.tag.split("").map(() => p.ink), st.font, size * .26, .12, lum(p.ink) < .5 ? "flat" : "shadow", p).c) : null;
      let nSize = Math.min(size * .72, W * (wide ? .075 : .11)) * (st.number_scale || 1);
      num = numberSprite(st, p, nSize);
      while (num.c.width > W - 2 * m && nSize > 12) { nSize *= .92; num = numberSprite(st, p, nSize); }
      if (dropLabel) num = { ...num, label: null };
      for (const np of alts) { st.number_pos = np; pos = this._place(lines, lineH, blockH, tag, num, m, size); if (pos.ok) break; }
      if (pos.ok) break;
      if (firstFit == null) firstFit = size;
      if (size < firstFit * .8) {
        // crowded: rather than shrink the type to a whisper, lose the small extras
        // (the label over the number, then the tag) before anything may overlap
        if (num.label) { dropLabel = true; continue; }
        if (tag) { tag = null; st.tag = ""; continue; }
        let placed = false;
        for (const np of alts) { st.number_pos = np; pos = this._place(lines, lineH, blockH, tag, num, m, size); if (pos.num[1] + num.c.height <= H * .985 && pos.y0 >= H * .02) { placed = true; break; } }
        if (placed) break;
      }
      st.number_pos = alts[0]; size *= .95;
    }
    Object.assign(this, { size, lines, lineH, tag, num, pos });
    const n = lines.length;
    this.tl.lines = lines.map((_, i) => this.tl.text + i * .12);
    const perLetter = ["slide_letters", "drop_letters", "typewriter", "scramble", "spin_letters"].includes(st.text_in);
    const last = this.tl.lines[n - 1] + (perLetter ? .55 : .3);
    this.tl.hit = this.tl.text + (["slam", "stomp"].includes(st.text_in) ? .42 : .3);
    this.tl.tag = last + .15; this.tl.number = last + .45; this.tl.shine = this.tl.number + .5; this.tl.sparkle = this.tl.number + .35;
  }

  _place(lines, lineH, blockH, tag, num, m, size) {
    const st = this.st, W = this.W, H = this.H, pos = st.text_pos;
    const center = ["top-center", "center"].includes(pos), right = pos === "top-right";
    const tagH = tag ? tag.height + size * .14 : 0;
    const y0 = { "top-left": H * .075, "top-center": H * .075, "top-right": H * .075, "middle-left": (H - blockH - tagH) / 2 - H * .03,
      "bottom-left": H * .8 - blockH - tagH }[pos] ?? (H - blockH - tagH) / 2 - H * .05;
    const xs = lines.map(L => center ? (W - L.inkW) / 2 : right ? W - m - L.inkW : m);
    const block = [Math.min(...xs), y0, Math.max(...lines.map((L, i) => xs[i] + L.inkW)), y0 + blockH];
    let tagXY = null;
    if (tag) tagXY = [center ? (W - tag.width) / 2 : right ? W - m - tag.width : m, y0 + blockH + size * (["box", "sticker", "highlighter", "cutout"].includes(st.text_fx) ? .34 : .14)];
    const labH = num.label ? num.label.height + size * .06 : 0;
    let nx, ny;
    if (st.number_pos === "under-headline") {
      ny = (tagXY ? tagXY[1] + tag.height : block[3]) + size * .28 + labH;
      nx = center ? (W - num.c.width) / 2 : right ? W - m - num.c.width : m;
    } else {
      ny = H * .94 - num.c.height;
      nx = { "bottom-left": m, "bottom-right": W - m - num.c.width }[st.number_pos] ?? (W - num.c.width) / 2;
    }
    let labXY = null;
    if (num.label) {
      const lx = ["bottom-left", "under-headline"].includes(st.number_pos) && !center && !right ? nx
        : st.number_pos === "bottom-right" || right ? nx + num.c.width - num.label.width : nx + (num.c.width - num.label.width) / 2;
      labXY = [lx, ny - labH];
    }
    const textBottom = tagXY ? tagXY[1] + tag.height : block[3];
    const nb = [nx, ny - labH, nx + num.c.width, ny + num.c.height];
    const overlapX = !(nb[2] < block[0] || nb[0] > block[2]);
    const ok = ny + num.c.height <= H * .985 && y0 >= H * .02 && (st.number_pos === "under-headline" || !overlapX || nb[1] > textBottom + size * .15);
    return { ok, xs, y0, block, tag: tagXY, num: [nx, ny], label: labXY };
  }

  _scrim() {
    const st = this.st, W = this.W, H = this.H;
    let s = st.scrim;
    if (s < 0) s = { box: 0, sticker: .25, cutout: .3, highlighter: .2, double_outline: .3, outline: .8, neon: .8 }[st.text_fx] ?? .65;
    this.scrimC = null;
    if (s <= 0) return;
    const light = lum(this.p.ink) > .5;
    const c = canvas(W / 4, H / 4), x = c.getContext("2d");
    const boxes = [this.pos.block, [this.pos.num[0], this.pos.num[1], this.pos.num[0] + this.num.c.width, this.pos.num[1] + this.num.c.height]];
    for (const [x0, y0, x1, y1] of boxes) {
      const cx = (x0 + x1) / 8, cy = (y0 + y1) / 8, rx = Math.max(10, (x1 - x0) * .75 / 4), ry = Math.max(10, (y1 - y0) * 1.1 / 4);
      x.save(); x.translate(cx, cy); x.scale(rx, ry);
      const g = x.createRadialGradient(0, 0, 0, 0, 0, 1.6);
      const col = light ? "0,0,0" : "255,255,255";
      g.addColorStop(0, `rgba(${col},${.47 * s})`); g.addColorStop(1, `rgba(${col},0)`);
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
    const lvl = this.st.shake; if (!lvl) return [0, 0];
    let dx = 0, dy = 0;
    const hits = [];
    for (const p of this.phones) { hits.push([p.tLand, .004]); if (p.reveal) hits.push([p.tReveal + .5, .0018]); }
    if (["slam", "stomp"].includes(this.st.text_in)) hits.push([this.tl.hit, .006]);
    for (const [h, amp] of hits) {
      const d = t - h;
      if (d >= 0 && d < .25) { const a = amp * lvl * this.W * Math.exp(-d * 18); dx += a * Math.sin(d * 90 + h * 7); dy += a * Math.cos(d * 75 + h * 5); }
    }
    return [dx, dy];
  }

  _camera(t) {
    const u = t / this.st.duration;
    switch (this.st.camera) {
      case "push_in": return [1 + .05 * u, 0, 0, 0];
      case "push_out": return [1.08 - .07 * outCubic(u), 0, 0, 0];
      case "drift": return [1.05, Math.sin(u * Math.PI) * .015, -.01 * u, 0];
      case "punch": { const d = t - this.tl.hit; return [1.02 + (d > 0 && d < .4 ? .06 * Math.exp(-d * 8) : 0), 0, 0, 0]; }
      case "tilt": return [1.06, 0, 0, (1 - outCubic(clamp(u * 2.5))) * 3];
      case "whip_in": { const q = clamp(t / .5); return [1.04, (1 - outQuint(q)) * .6, 0, 0]; }
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

    if (this.scrimC) { const k = prog(t, tl.text - .1, .4); if (k > 0) { ctx.globalAlpha = k; ctx.drawImage(this.scrimC, 0, 0, W, H); ctx.globalAlpha = 1; } }
    if (st.speed_lines) this._speedLines(ctx, t);
    this._headline(ctx, t, dt);
    if (this.tag) { const q = prog(t, tl.tag, .35); if (q > 0) { ctx.globalAlpha = q; ctx.drawImage(this.tag, lerp(this.pos.tag[0] - W * .05, this.pos.tag[0], outCubic(q)), this.pos.tag[1]); ctx.globalAlpha = 1; } }
    this._number(ctx, t);
    if (st.sparkles) this._sparkles(ctx, t);
    this._overlay(ctx, t);
    if (st.flash) { const f = t - tl.hit; if (f >= 0 && f < .12) { ctx.fillStyle = `rgba(255,255,255,${.27 * (1 - f / .12)})`; ctx.fillRect(0, 0, W, H); } }
    if (st.rgb_hit) { const d = t - tl.hit; if (d >= 0 && d < .16) this._rgbShift(ctx, Math.round(W * .006 * (1 - d / .16))); }
  }

  _headline(ctx, t, dt) {
    const st = this.st, W = this.W, H = this.H, tl = this.tl;
    this.lines.forEach((L, i) => {
      const t0 = tl.lines[i], xEnd = this.pos.xs[i] - L.pad, y = this.pos.y0 + i * this.lineH - L.pad;
      const q = prog(t, t0, .45); if (q <= 0) return;
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
          const x = lerp(start, xEnd, e), v = Math.abs(lerp(start, xEnd, outBack(prog(t + dt, t0, .45), 1.3)) - x);
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
            const qj = prog(t, t0 + j * (st.text_in === "typewriter" ? .05 : .035), st.text_in === "typewriter" ? .01 : .38);
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
            const n = G.filter((g, j) => t >= t0 + j * .05).length;
            if (n < G.length || (t - t0) % .6 < .3) {
              const gx = xEnd + (n < G.length ? G[n].x : G[G.length - 1].x + G[G.length - 1].c.width - L.pad * 1.6) + L.pad;
              ctx.fillStyle = this.p.ink; ctx.fillRect(gx, y + L.pad, Math.max(3, this.size * .06), L.asc);
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
    if (!this._gcache[k]) this._gcache[k] = inkSprite(ch, [col], this.st.font, this.size, 0, this.st.text_fx, this.p, this.st.skew).c;
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
    const draw = (x, y, a = 1, sx = 1, sy = 1) => { ctx.save(); ctx.globalAlpha = a; ctx.translate(x + c.width / 2, y + c.height / 2); ctx.scale(sx, sy); ctx.drawImage(c, -c.width / 2, -c.height / 2); ctx.restore(); };
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
      if (lq > 0) { ctx.globalAlpha = lq; ctx.drawImage(this.num.label, this.pos.label[0], this.pos.label[1] + (1 - outCubic(lq)) * 12); ctx.globalAlpha = 1; }
    }
    if (st.shine && t >= tl.shine + .25) { const sp = prog(t, tl.shine + .25, .6); if (sp > 0 && sp < 1) this._shine(ctx, nx, ny, c.width, c.height, sp, c); }
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
    for (let k = 0; k < 9; k++) {
      const sx = nx + r.uniform(-.08, 1.08) * c.width, sy = ny + r.uniform(-.5, 1.3) * c.height, ph = r.uniform(0, .9);
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

function star(ctx, x, y, s, col) {
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
