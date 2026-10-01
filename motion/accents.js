// Phone Ad Maker: accents, the small marks that make a video ad read like a finished
// image ad: an iOS emoji, a keyboard symbol drawn clean, or one of the studio's own
// approved cutouts (the cash fan, the money bag, the handshake).
//
// DESIGN-LAW 88 holds here as on the image cards. Emoji are iOS style or none: an
// emoji is a character in the device's own emoji font, drawn only where that font is
// Apple's (an iPhone, an iPad, a Mac), so every emoji in a preview or an MP4 made on
// that device is Apple's own. On any other device the same slot is drawn as the
// accent's cutout or symbol instead, never as someone else's emoji. They are not
// overused: none to three, weighted toward few, and never on the words, the number,
// a sign or a phone (they take only room nothing else uses).
//
// Every accent has an entrance, a way of idling and an exit, from the lists below;
// the look draws each from its seed like every other axis.

import { canvas, clamp, lerp, prog, outCubic, outBack, outBounce, outQuint, lum, rgba, fontCss } from "./engine.js";

const TAU = Math.PI * 2;

export const IOS_EMOJI = (() => {
  try {
    const q = new URLSearchParams(location.search).get("emoji");
    if (q === "ios") return true;                                  // tests on another machine: the geometry only
    if (q === "off") return false;
    return /iPhone|iPad|iPod|Macintosh|Mac OS X/.test(navigator.userAgent || "");
  } catch (e) { return false; }
})();
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

// The studio's approved cutouts an accent may use (assets/approved-assets.json, and
// none flagged in assets/cutout-flags.json on 2026-09-30).
export const ACCENT_ASSETS = ["cash-fan", "cash-stack", "cash-bundles", "money-bag-sack", "handshake-deal",
  "thumbs-up-hand", "location-pin-3d", "shield-check-3d", "cash-fan-hundreds"];

// Each item: an emoji (Apple devices), and what stands in for it elsewhere (a cutout
// or a drawn symbol). A set is a topic, so a look's accents agree with each other.
export const ACCENT_SETS = {
  cash:    [{ e: "💵", asset: "cash-fan" }, { e: "💰", asset: "money-bag-sack" }, { e: "💸", asset: "cash-stack" }],
  money:   [{ e: "🤑", sym: "dollar" }, { e: "💵", asset: "cash-fan-hundreds" }, { e: "💲", sym: "dollar" }],
  hype:    [{ e: "🔥", sym: "bolt" }, { e: "💯", sym: "star" }, { e: "⚡", sym: "bolt" }],
  phones:  [{ e: "📱", sym: "arrow" }, { e: "📲", sym: "arrow" }, { e: "✨", sym: "sparkle" }],
  deal:    [{ e: "🤝", asset: "handshake-deal" }, { e: "👍", asset: "thumbs-up-hand" }, { e: "✅", sym: "check" }],
  local:   [{ e: "📍", asset: "location-pin-3d" }, { e: "🌴", sym: "sparkle" }, { e: "☀️", sym: "star" }],
  trust:   [{ e: "✅", asset: "shield-check-3d" }, { e: "👍", asset: "thumbs-up-hand" }, { e: "⭐", sym: "star" }],
  sparkle: [{ sym: "sparkle" }, { sym: "star" }, { sym: "sparkle" }],
  checks:  [{ sym: "check" }, { sym: "check" }, { sym: "star" }],
};

/** The cutouts, loaded once. Resolves to { name: img } with whatever loaded. */
export function loadAccents(base = "../assets/cutouts/") {
  if (loadAccents._p) return loadAccents._p;
  const out = {};
  return (loadAccents._p = Promise.all(ACCENT_ASSETS.map(n => new Promise(res => {
    const img = new Image(); img.decoding = "async";
    img.onload = () => { out[n] = img; res(); }; img.onerror = () => res(); img.src = base + n + ".webp";
  }))).then(() => out));
}

/** What one item draws as on this device: "emoji", "asset" or "sym". */
function resolve(item, kind, assets) {
  const hasAsset = item.asset && assets && assets[item.asset] && assets[item.asset].width;
  const want = kind === "mix" ? (item.e && IOS_EMOJI ? "emoji" : hasAsset ? "asset" : "sym") : kind;
  if (want === "emoji" && item.e && IOS_EMOJI) return { as: "emoji", item };
  if ((want === "asset" || want === "emoji") && hasAsset) return { as: "asset", item };
  return { as: "sym", item: { ...item, sym: item.sym || (item.asset ? "star" : "sparkle") } };
}

/** Where the accents go: room no word, number, sign, sticker or phone uses, inside the
 *  frame the camera settles on, near the words where there is room (an accent reads as
 *  part of the message there) and apart from each other. avoid: boxes to keep clear of. */
export function placeAccents(st, W, H, avoid, words, assets, r, insetTop = 0, focus = null) {
  const n = st.accents | 0;
  if (!n) return [];
  const set = ACCENT_SETS[st.accent_set] || ACCENT_SETS.cash;
  const out = [], taken = avoid.slice(), U = Math.min(W, H);
  const mx = W * .07, my = Math.max(H * .07, insetTop + H * .03);
  for (let i = 0; i < n; i++) {
    const res = resolve(set[i % set.length], st.accent_kind || "mix", assets);
    const R = U * (res.as === "asset" ? .085 : res.as === "emoji" ? .07 : .065) * r.uniform(.9, 1.12);
    let best = null;
    for (let a = 0; a <= 12; a++) for (let b = 0; b <= 12; b++) {
      const x = lerp(mx + R, W - mx - R, a / 12), y = lerp(my + R, H - my - R, b / 12);
      let over = 0;
      for (const q of taken) {
        const ix = Math.max(0, Math.min(x + R, q[2]) - Math.max(x - R, q[0])), iy = Math.max(0, Math.min(y + R, q[3]) - Math.max(y - R, q[1]));
        over += ix * iy;
      }
      if (over > 0) continue;                                        // clean or not at all
      const dw = words ? Math.hypot(Math.max(0, words[0] - x, x - words[2]), Math.max(0, words[1] - y, y - words[3])) / U : .5;
      const apart = out.length ? Math.min(...out.map(o => Math.hypot(o.x - x, o.y - y))) / U : 1;
      const score = Math.abs(dw - .06) * 2 - Math.min(apart, .5) + r() * .05;
      if (!best || score < best.score) best = { x, y, score };
    }
    if (!best) continue;
    // an arrow points at the phones (or the middle), never off the frame
    const f = focus || [W / 2, H / 2], aim = Math.atan2(f[1] - best.y, f[0] - best.x) * 180 / Math.PI;
    out.push({ ...res, x: best.x, y: best.y, R, ph: r() * TAU, i, aim });
    taken.push([best.x - R * 1.15, best.y - R * 1.15, best.x + R * 1.15, best.y + R * 1.15]);
  }
  return out;
}

// ------------------------------------------------------------ motion

export const ACCENT_IN = ["fade", "pop", "slide", "fly", "drop", "flip3d", "wide_spin", "zoom", "swing", "orbit"];
export const ACCENT_IDLE = ["bob", "pulse", "wiggle", "turntable", "float", "still"];
export const ACCENT_OUT = ["fade", "pop_out", "fly_out", "spin_out", "drop_out", "none"];

/** Where an accent is and how it stands at t: [x, y, sx, sy, rot, alpha, blur]. */
function pose(a, t, st, W, H) {
  let x = a.x, y = a.y, sx = 1, sy = 1, rot = 0, al = 1, blur = 0;
  const R = a.R, qi = prog(t, a.t0, .62);
  if (qi <= 0) return null;
  // the nearest edge, for the moves that come from (or leave by) one
  const ex = a.x < W / 2 ? -1 : 1, ey = a.y < H / 2 ? -1 : 1, sideX = Math.min(a.x, W - a.x) < Math.min(a.y, H - a.y);
  if (qi < 1) switch (st.accent_in) {
    case "fade": al = qi; sx = sy = lerp(.85, 1, outCubic(qi)); break;
    case "pop": { const e = outBack(qi, 2.4); sx = sy = Math.max(.01, e); al = clamp(qi * 4); break; }
    case "slide": { const e = outCubic(qi); if (sideX) x = lerp(ex < 0 ? -R * 1.3 : W + R * 1.3, a.x, e); else y = lerp(ey < 0 ? -R * 1.3 : H + R * 1.3, a.y, e); break; }
    case "fly": {
      const e = outCubic(qi), sxp = -ex * W * .7, syp = H * .9 * (ey < 0 ? 1 : -1) * .2 - R * 3;
      x = a.x + sxp * (1 - e) ** 2; y = a.y + syp * (1 - e); rot = 540 * (1 - e) * -ex; sx = sy = lerp(.4, 1, e); break;
    }
    case "drop": { const b = outBounce(qi); y = lerp(-R * 2, a.y, b); rot = 25 * (1 - outCubic(qi)) * ex; break; }
    case "flip3d": { const e = outCubic(qi); sx = Math.cos(3 * Math.PI * (1 - e)); sy = lerp(.7, 1, e); al = clamp(qi * 3); break; }
    case "wide_spin": { const e = outQuint(qi); sx = lerp(2.4, 1, e) * Math.cos(TAU * (1 - e)); sy = lerp(.55, 1, e); rot = 20 * (1 - e) * ex; al = clamp(qi * 3); break; }
    case "zoom": { const e = outCubic(qi); sx = sy = lerp(3.2, 1, e); al = clamp(qi * 1.6); blur = (1 - e) * R * .25; break; }
    case "swing": { const e = qi; rot = -70 * ex * Math.exp(-4.2 * e) * Math.cos(e * 9); al = clamp(qi * 4); sx = sy = lerp(.8, 1, outCubic(qi)); break; }
    case "orbit": { const e = outCubic(qi), ang = (1 - e) * TAU * .9 + a.ph, rr = R * 4 * (1 - e); x = a.x + Math.cos(ang) * rr; y = a.y + Math.sin(ang) * rr; sx = sy = lerp(.3, 1, e); al = clamp(qi * 3); break; }
    default: al = qi;
  }
  // idling, once in
  const ti = t - (a.t0 + .62), ramp = clamp(ti / .3);
  if (ti > 0) switch (st.accent_idle) {
    case "bob": y += Math.sin(ti * 2.6 + a.ph) * R * .09 * ramp; break;
    case "pulse": { const k = 1 + .07 * Math.max(0, Math.sin(ti * (st.bpm || 118) / 60 * Math.PI)) * ramp; sx *= k; sy *= k; break; }
    case "wiggle": rot += 7 * Math.sin(ti * 3.4 + a.ph) * ramp; break;
    case "turntable": sx *= lerp(1, Math.max(.12, Math.abs(Math.cos(ti * 1.7 + a.ph * .2))), ramp); break;
    case "float": x += Math.cos(ti * 1.1 + a.ph) * R * .07 * ramp; y += Math.sin(ti * 1.4 + a.ph) * R * .1 * ramp; break;
  }
  // leaving, where the ad has an ending
  if (a.tOut != null && st.accent_out && st.accent_out !== "none") {
    const qo = prog(t, a.tOut, .45);
    if (qo >= 1) return null;
    if (qo > 0) switch (st.accent_out) {
      case "fade": al *= 1 - qo; break;
      case "pop_out": { const k = qo < .3 ? 1 + .25 * (qo / .3) : 1.25 * (1 - (qo - .3) / .7); sx *= k; sy *= k; break; }
      case "fly_out": { const e = qo * qo; if (sideX) x = lerp(x, ex < 0 ? -R * 1.5 : W + R * 1.5, e); else y = lerp(y, ey < 0 ? -R * 1.5 : H + R * 1.5, e); rot += 90 * e * ex; break; }
      case "spin_out": sx *= Math.cos(3 * Math.PI * qo) * (1 - qo); sy *= 1 - qo; break;
      case "drop_out": y += qo * qo * H * .8; rot += 60 * qo * ex; break;
    }
  }
  return [x, y, sx, sy, rot, al, blur];
}

// ------------------------------------------------------------ drawing

/** A clean vector mark, centred, radius R, in col with a darker keyline. */
function drawSymbol(ctx, kind, R, col, line, fontName) {
  ctx.fillStyle = col; ctx.strokeStyle = line; ctx.lineJoin = "round"; ctx.lineCap = "round";
  ctx.lineWidth = Math.max(1.5, R * .11);
  ctx.beginPath();
  switch (kind) {
    case "check": {
      ctx.lineWidth = R * .34; ctx.strokeStyle = line; ctx.moveTo(-R * .62, R * .02); ctx.lineTo(-R * .16, R * .5); ctx.lineTo(R * .7, -R * .5); ctx.stroke();
      ctx.lineWidth = R * .2; ctx.strokeStyle = col; ctx.stroke(); return;
    }
    case "star": for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? R * .45 : R; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } break;
    case "sparkle": for (let k = 0; k < 8; k++) { const a = -Math.PI / 2 + k * Math.PI / 4, rr = k % 2 ? R * .22 : R; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } break;
    case "bolt": [[.15, -1], [-.55, .12], [-.05, .12], [-.25, 1], [.6, -.2], [.08, -.2], [.35, -1]].forEach(([u, v], k) => k ? ctx.lineTo(u * R, v * R) : ctx.moveTo(u * R, v * R)); break;
    case "arrow": [[-.9, -.28], [.1, -.28], [.1, -.7], [.95, 0], [.1, .7], [.1, .28], [-.9, .28]].forEach(([u, v], k) => k ? ctx.lineTo(u * R, v * R) : ctx.moveTo(u * R, v * R)); break;
    case "dollar": {
      ctx.font = fontCss(fontName, R * 1.9); ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.strokeText("$", 0, R * .06); ctx.fillText("$", 0, R * .06); return;
    }
    default: ctx.arc(0, 0, R * .6, 0, TAU);
  }
  ctx.closePath(); ctx.stroke(); ctx.fill();
}

/** Draw every accent at t. p: the look's palette. */
export function drawAccents(ctx, list, t, st, p, W, H, assets) {
  for (const a of list) {
    const ps = pose(a, t, st, W, H);
    if (!ps) continue;
    const [x, y, sx, sy, rot, al, blur] = ps;
    if (al <= 0.01 || Math.abs(sx) < .01) continue;
    ctx.save();
    ctx.globalAlpha = clamp(al);
    ctx.translate(x, y); ctx.rotate((rot + (a.as === "sym" && a.item.sym === "arrow" ? a.aim : 0)) * Math.PI / 180); ctx.scale(sx, sy);
    if (blur > .5 && "filter" in ctx) ctx.filter = `blur(${blur}px)`;
    ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = a.R * .22; ctx.shadowOffsetY = a.R * .08;
    if (a.as === "emoji") {
      ctx.font = `${Math.round(a.R * 1.7)}px ${EMOJI_FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(a.item.e, 0, a.R * .05);
    } else if (a.as === "asset") {
      const img = assets[a.item.asset], k = (a.R * 2.1) / Math.max(img.width, img.height);
      ctx.drawImage(img, -img.width * k / 2, -img.height * k / 2, img.width * k, img.height * k);
    } else {
      // the accent where it stands out from the ground, else the hottest colour that does
      const g = lum(p.ground), stands = c => Math.abs(lum(c) - g) > .28;
      const col = [p.accent, p.hot, "#ffd60a", "#ff2d55", g > .5 ? "#111111" : "#ffffff"].find(c => c && stands(c)) || "#ffd60a";
      const line = lum(col) > .5 ? "#141414" : "#ffffff";
      drawSymbol(ctx, a.item.sym, a.R, col, line, st.number_font !== "same" ? st.number_font : st.font);
    }
    ctx.restore();
  }
}

/** Timing: they arrive once the words have landed, one after another, and leave just
 *  before an ending (a look with no ending keeps them to its last frame). */
export function timeAccents(list, tl, tOutro) {
  list.forEach((a, i) => {
    a.t0 = tl.hit + .25 + i * .22;
    a.tOut = tOutro != null ? tOutro - .5 + i * .06 : null;
  });
  return list;
}
