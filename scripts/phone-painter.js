/* THE 2026 GALAXY AND PIXEL PICTURES, PAINTED (2026-11-23). Run in a page by scripts/paint_phone_pictures.mjs.

   The owner: "it needs to be 2026 / 2027 adjacent", "z fold 8", "any other new devices?". The library's newest
   Samsung and Pixel pictures were a Galaxy S24 and a Pixel 9 (generated in 2025), and Wikimedia Commons has no
   2026 Galaxy or Pixel photograph an ad can use (searched 2026-11-22: store displays with price tags and cables,
   or credited ones; OPEN-ITEMS BU 9). So they are painted, the way the card pictures are: each phone's own
   shape (the S26 line's camera island, the Pixel's camera bar, the Fold's open square, the Flip's cover screen)
   in its own finishes, with no maker's logo, no word, no screen of anyone's software. A photograph of the
   shop's own stock replaces any of them. */
(() => {
const TAU = Math.PI * 2;
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.round(w); c.height = Math.round(h); return c; };
const stops = (g, st) => { st.forEach((c, i) => Array.isArray(c) ? g.addColorStop(c[0], c[1]) : g.addColorStop(i / (st.length - 1), c)); return g; };
const lin = (x, x0, y0, x1, y1, st) => stops(x.createLinearGradient(x0, y0, x1, y1), st);
const rad = (x, x0, y0, r0, x1, y1, r1, st) => stops(x.createRadialGradient(x0, y0, r0, x1, y1, r1), st);
function rr(x, X, Y, W, H, R) { R = Math.max(0, Math.min(R, W / 2, H / 2)); x.beginPath(); x.moveTo(X + R, Y); x.arcTo(X + W, Y, X + W, Y + H, R); x.arcTo(X + W, Y + H, X, Y + H, R); x.arcTo(X, Y + H, X, Y, R); x.arcTo(X, Y, X + W, Y, R); x.closePath(); }
function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
window.loadFonts = async list => { for (const [fam, b64] of list) { const f = new FontFace(fam, `url(data:font/woff2;base64,${b64})`); await f.load(); document.fonts.add(f); } };
function trim(c, pad = 4) {
  const x = c.getContext('2d'), d = x.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
  for (let y = 0; y < c.height; y++) for (let X = 0; X < c.width; X++) if (d[(y * c.width + X) * 4 + 3] > 8) { if (X < x0) x0 = X; if (X > x1) x1 = X; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const o = mk(x1 - x0 + 1 + pad * 2, y1 - y0 + 1 + pad * 2); o.getContext('2d').drawImage(c, x0 - pad, y0 - pad); return o;
}

/* ---- the finishes: a back's glass (light to deep), its frame's metal ---- */
const FIN = {
  violet:    { glass: ['#b9a7e6', '#8f78cf', '#6e58b3'], metal: ['#d9d2ee', '#8c84a8', '#f1edfa', '#6f6790'] },
  titanium:  { glass: ['#4a4c51', '#2c2e32', '#1b1c1f'], metal: ['#c9c6c0', '#77746f', '#e8e5df', '#5d5a56'] },
  skyblue:   { glass: ['#cfe3f6', '#a8c8ea', '#86acd8'], metal: ['#e3edf7', '#93a6ba', '#f6f9fc', '#7d8fa3'] },
  pink:      { glass: ['#f6d5d8', '#e9b3b9', '#d6939b'], metal: ['#f4e2e2', '#b59a9c', '#fbf2f2', '#957d80'] },
  navy:      { glass: ['#4d5d86', '#2f3d63', '#1e2847'], metal: ['#c7ccd8', '#6e7690', '#e3e6ee', '#59607a'] },
  silver:    { glass: ['#eef0f2', '#d6d9dd', '#bcc1c7'], metal: ['#eef0f2', '#9aa0a7', '#fbfcfc', '#7f858c'] },
  moonstone: { glass: ['#a9b6c4', '#8494a7', '#66778c'], metal: ['#dde3ea', '#8e98a4', '#f2f5f8', '#747e8a'] },
  porcelain: { glass: ['#f2ece2', '#e2d9cb', '#cfc4b3'], metal: ['#f1ece4', '#b3aa9c', '#fbf8f3', '#958c80'] },
  indigo:    { glass: ['#6f74c9', '#4f55ad', '#383d8c'], metal: ['#cfd1ee', '#7b80b8', '#e8e9f8', '#61669c'] },
  lime:      { glass: ['#e6efa3', '#cfdf74', '#b3c653'], metal: ['#eef3cf', '#a9b27a', '#f9fbe9', '#8e9763'] },
  obsidian:  { glass: ['#3a3c40', '#232427', '#141517'], metal: ['#a9abb0', '#4c4e53', '#d5d7db', '#3a3c40'] },
  ice:       { glass: ['#e4f1f2', '#c5dfe2', '#a6cbd0'], metal: ['#e7f2f3', '#97adb1', '#f7fbfb', '#7c9397'] },
};
/* the metal as a band across a frame: light, shade, a bright line, shade (a polished edge) */
const metalFill = (x, X0, Y0, X1, Y1, m) => lin(x, X0, Y0, X1, Y1, [[0, m[2]], [.18, m[0]], [.5, m[1]], [.82, m[0]], [1, m[3]]]);

/* ---- a lens: a metal ring, its black bezel, the glass with its elements and the light caught on it ---- */
function lens(x, cx, cy, r, o = {}) {
  const m = o.metal || FIN.silver.metal;
  x.save();
  x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = r * .25; x.shadowOffsetY = r * .06;
  x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fillStyle = metalFill(x, cx - r, cy - r, cx + r, cy + r, m); x.fill();
  x.restore();
  x.beginPath(); x.arc(cx, cy, r * .86, 0, TAU); x.fillStyle = '#08090b'; x.fill();
  x.beginPath(); x.arc(cx, cy, r * .74, 0, TAU); x.fillStyle = rad(x, cx - r * .2, cy - r * .25, 0, cx, cy, r * .74, ['#2b3350', '#11141f', '#050608']); x.fill();
  x.lineWidth = Math.max(1, r * .035); x.strokeStyle = 'rgba(130,150,210,.32)';
  for (const k of [.52, .34]) { x.beginPath(); x.arc(cx, cy, r * k, 0, TAU); x.stroke(); }
  x.beginPath(); x.arc(cx, cy, r * .2, 0, TAU); x.fillStyle = rad(x, cx, cy, 0, cx, cy, r * .2, ['#0d0f17', '#1c2440']); x.fill();
  x.globalCompositeOperation = 'screen';
  x.beginPath(); x.arc(cx + r * .08, cy + r * .1, r * .5, 0, TAU); x.fillStyle = rad(x, cx + r * .15, cy + r * .2, 0, cx + r * .1, cy + r * .1, r * .5, ['rgba(120,60,200,.35)', 'rgba(40,160,120,.12)', 'rgba(0,0,0,0)']); x.fill();
  x.globalCompositeOperation = 'source-over';
  x.lineCap = 'round'; x.lineWidth = r * .07; x.strokeStyle = 'rgba(255,255,255,.55)';
  x.beginPath(); x.arc(cx, cy, r * .6, Math.PI * 1.08, Math.PI * 1.4); x.stroke();
  x.beginPath(); x.arc(cx - r * .3, cy - r * .34, r * .07, 0, TAU); x.fillStyle = 'rgba(255,255,255,.85)'; x.fill();
}
function flash(x, cx, cy, r) {
  x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fillStyle = '#1a1b1e'; x.fill();
  x.beginPath(); x.arc(cx, cy, r * .78, 0, TAU); x.fillStyle = rad(x, cx - r * .2, cy - r * .2, 0, cx, cy, r * .78, ['#fffdf2', '#f3e6b8', '#d9c78f']); x.fill();
  x.strokeStyle = 'rgba(180,160,110,.6)'; x.lineWidth = r * .08; for (const k of [.5, .25]) { x.beginPath(); x.arc(cx, cy, r * k, 0, TAU); x.stroke(); }
}
function sensor(x, cx, cy, r) { x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fillStyle = '#121316'; x.fill(); x.beginPath(); x.arc(cx - r * .3, cy - r * .3, r * .25, 0, TAU); x.fillStyle = 'rgba(255,255,255,.35)'; x.fill(); }

/* ---- a body: the frame's rail seen past its right edge (a slight turn), the frame, the glass, its light ---- */
function body(x, W, H, R, fin, o = {}) {
  const rail = o.rail ?? Math.round(W * .022), f = o.frame ?? Math.max(6, Math.round(W * .014));
  // the rail and its buttons
  rr(x, rail, 0, W, H, R); x.fillStyle = lin(x, W - R, 0, W + rail, 0, [fin.metal[0], fin.metal[1], fin.metal[3]]); x.fill();
  for (const [y0, h] of o.buttons || [[.2, .1], [.34, .055]]) { rr(x, W + rail - 4, H * y0, 9, H * h, 4); x.fillStyle = metalFill(x, W + rail - 4, 0, W + rail + 5, 0, fin.metal); x.fill(); }
  // the frame
  rr(x, 0, 0, W, H, R); x.fillStyle = metalFill(x, 0, 0, W, H, fin.metal); x.fill();
  x.lineWidth = 2; x.strokeStyle = 'rgba(255,255,255,.28)'; rr(x, 1.5, 1.5, W - 3, H - 3, R - 1.5); x.stroke();
  return f;
}
function glass(x, W, H, R, f, cols, o = {}) {
  x.save(); rr(x, f, f, W - f * 2, H - f * 2, R - f); x.clip();
  x.fillStyle = lin(x, 0, 0, W * .6, H, cols); x.fillRect(0, 0, W, H);
  if (o.matte !== false) { const R2 = rng(o.seed || 3), id = x.getImageData(0, 0, W, H), d = id.data; for (let i = 0; i < d.length; i += 4) { const n = (R2() - .5) * 6; d[i] += n; d[i + 1] += n; d[i + 2] += n; } x.putImageData(id, 0, 0); }
  x.save(); x.filter = `blur(${W * .06}px)`; x.fillStyle = `rgba(255,255,255,${o.sheen ?? .16})`;
  x.beginPath(); x.moveTo(-W * .1, H * .32); x.lineTo(W * .95, -H * .05); x.lineTo(W * 1.1, H * .06); x.lineTo(-W * .1, H * .48); x.closePath(); x.fill(); x.restore();
  x.save(); x.filter = `blur(${W * .03}px)`; x.strokeStyle = 'rgba(0,0,0,.28)'; x.lineWidth = W * .03; rr(x, f, f, W - f * 2, H - f * 2, R - f); x.stroke(); x.restore();
  x.restore();
}
/* a screen: its wallpaper (soft colour fields, nobody's software), the punch-hole camera, a clock where asked */
function screen(x, X, Y, W, H, R, wall, o = {}) {
  x.save(); rr(x, X, Y, W, H, R); x.clip();
  x.fillStyle = wall[0]; x.fillRect(X, Y, W, H);
  x.save(); x.filter = `blur(${Math.min(W, H) * .12}px)`;
  const R2 = rng(o.seed || 9);
  for (let i = 0; i < 6; i++) { x.fillStyle = wall[1 + i % (wall.length - 1)]; x.globalAlpha = .75; x.beginPath(); x.ellipse(X + W * (.1 + R2() * .8), Y + H * (.15 + R2() * .8), W * (.25 + R2() * .3), H * (.12 + R2() * .18), R2() * Math.PI, 0, TAU); x.fill(); }
  x.restore();
  x.globalAlpha = 1;
  const g = lin(x, X, Y, X + W, Y + H, ['rgba(255,255,255,.14)', 'rgba(255,255,255,0)', 'rgba(255,255,255,.06)']); x.fillStyle = g; x.fillRect(X, Y, W, H);
  if (o.crease === 'v') { x.fillStyle = lin(x, X + W / 2 - 10, 0, X + W / 2 + 10, 0, ['rgba(0,0,0,0)', 'rgba(0,0,0,.12)', 'rgba(255,255,255,.08)', 'rgba(0,0,0,0)']); x.fillRect(X + W / 2 - 10, Y, 20, H); }
  if (o.crease === 'h') { x.fillStyle = lin(x, 0, Y + H / 2 - 8, 0, Y + H / 2 + 8, ['rgba(0,0,0,0)', 'rgba(0,0,0,.12)', 'rgba(255,255,255,.08)', 'rgba(0,0,0,0)']); x.fillRect(X, Y + H / 2 - 8, W, 16); }
  if (o.clock) { const cw = o.crease === 'v' ? W / 2 : W;   // on a book foldable the clock keeps to one half
    x.fillStyle = 'rgba(255,255,255,.92)'; x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.font = `400 ${Math.round(cw * .26)}px PxOswald4`; x.fillText(o.clock, X + W * (o.clockX || .5), Y + H * .27);
    x.font = `600 ${Math.round(cw * .045)}px PxOswald6`; x.fillStyle = 'rgba(255,255,255,.8)'; x.fillText(o.date || 'MONDAY 23 NOVEMBER', X + W * (o.clockX || .5), Y + H * .1); }
  x.restore();
  if (o.punch) { const [px, py, pr] = o.punch; x.beginPath(); x.arc(X + W * px, Y + H * py, pr, 0, TAU); x.fillStyle = '#050506'; x.fill(); x.beginPath(); x.arc(X + W * px - pr * .25, Y + H * py - pr * .25, pr * .3, 0, TAU); x.fillStyle = 'rgba(90,110,170,.6)'; x.fill(); }
  // the glass over it
  x.save(); rr(x, X, Y, W, H, R); x.clip(); x.filter = `blur(${W * .05}px)`; x.fillStyle = 'rgba(255,255,255,.1)';
  x.beginPath(); x.moveTo(X - W * .1, Y + H * .4); x.lineTo(X + W, Y - H * .05); x.lineTo(X + W * 1.1, Y + H * .05); x.lineTo(X - W * .1, Y + H * .55); x.closePath(); x.fill(); x.restore();
}
const pad = (W, H, rail) => { const c = mk(W + rail + 40, H + 40), x = c.getContext('2d'); x.translate(20, 20); return [c, x]; };

/* ---- the phones ---- */
/** Galaxy S26 line, back: the lenses in one raised pill at the top left, the flash beside it; the Ultra a fourth lens. */
function galaxyBack(fin, ultra) {
  const W = 780, H = ultra ? 1640 : 1660, R = ultra ? 70 : 118, rail = 18, [c, x] = pad(W, H, rail);
  const f = body(x, W, H, R, fin, { rail }); glass(x, W, H, R, f, fin.glass, { seed: ultra ? 11 : 12 });
  const lr = ultra ? 74 : 66, gap = lr * 2.32, px = W * .14, py = H * .045, pw = lr * 2.5, ph = gap * 2 + lr * 2.5;
  x.save(); x.shadowColor = 'rgba(0,0,0,.3)'; x.shadowBlur = 18; x.shadowOffsetY = 6;
  rr(x, px, py, pw, ph, pw / 2); x.fillStyle = lin(x, px, py, px + pw, py + ph, [fin.glass[0], fin.glass[1], fin.glass[2]]); x.fill(); x.restore();
  rr(x, px, py, pw, ph, pw / 2); x.lineWidth = 5; x.strokeStyle = metalFill(x, px, py, px + pw, py + ph, fin.metal); x.stroke();
  for (let i = 0; i < 3; i++) lens(x, px + pw / 2, py + lr * 1.25 + i * gap, lr, { metal: fin.metal });
  if (ultra) { lens(x, px + pw + lr * 1.05, py + lr * 1.25 + gap * .5, lr * .78, { metal: fin.metal }); flash(x, px + pw + lr * .95, py + lr * 1.25 + gap * 1.45, lr * .3); sensor(x, px + pw + lr * .95, py + lr * 1.25 + gap * 1.9, lr * .16); }
  else flash(x, px + pw + lr * .7, py + lr * 1.1, lr * .32);
  return c;
}
/** Any slab phone's face: thin even bezels, a centred punch hole, the lock screen's clock. */
function slabFront(fin, W, H, R, wall, o = {}) {
  const rail = 16, [c, x] = pad(W, H, rail);
  body(x, W, H, R, fin, { rail });
  rr(x, 7, 7, W - 14, H - 14, R - 7); x.fillStyle = '#050506'; x.fill();
  const b = o.bezel || 26; screen(x, b, b, W - b * 2, H - b * 2, R - b + 8, wall, { punch: [.5, .035, 17], clock: o.clock || '10:26', seed: o.seed });
  return c;
}
/** Pixel 11 line, back: the camera bar across its top, black glass holding the lenses, the flash on the bar's end. */
function pixelBack(fin, pro) {
  const W = 790, H = 1650, R = 150, rail = 18, [c, x] = pad(W, H, rail);
  const f = body(x, W, H, R, fin, { rail, buttons: [[.18, .07], [.3, .12]] }); glass(x, W, H, R, f, fin.glass, { seed: pro ? 21 : 22, sheen: .12 });
  const by = H * .085, bh = H * .1, bx = f + 2, bw = W - f * 2 - 4;
  // the bar, in the frame's metal, raised
  x.save(); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 26; x.shadowOffsetY = 10;
  rr(x, bx, by, bw, bh, bh / 2); x.fillStyle = lin(x, 0, by, 0, by + bh, [fin.metal[2], fin.metal[0], fin.metal[1], fin.metal[3]]); x.fill(); x.restore();
  // its black glass window
  const wx = bx + bh * .32, wy = by + bh * .14, ww = bw * (pro ? .64 : .58), wh = bh * .72;
  rr(x, wx, wy, ww, wh, wh / 2); x.fillStyle = lin(x, 0, wy, 0, wy + wh, ['#26272b', '#0d0e10', '#1b1c20']); x.fill();
  x.save(); rr(x, wx, wy, ww, wh, wh / 2); x.clip(); x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(wx, wy, ww, wh * .35); x.restore();
  const lr = wh * .4, n = 3;
  for (let i = 0; i < n; i++) lens(x, wx + wh * .5 + i * (ww - wh) / (n - 1), wy + wh / 2, lr, { metal: FIN.obsidian.metal });
  flash(x, bx + bw - bh * 1.05, by + bh / 2, bh * .16); sensor(x, bx + bw - bh * .62, by + bh / 2, bh * .1);
  return c;
}
/** Galaxy Z Fold 8, closed, its back: a tall narrow slab, the S line's camera pill. */
function foldBack(fin) {
  const W = 700, H = 1600, R = 64, rail = 30, [c, x] = pad(W, H, rail);
  // a folded phone is two layers thick: a hinge on its left edge, the rail deeper
  const f = body(x, W, H, R, fin, { rail, buttons: [[.24, .09], [.36, .05]] });
  glass(x, W, H, R, f, fin.glass, { seed: 31 });
  x.fillStyle = lin(x, 0, 0, f * 2.2, 0, [fin.metal[3], fin.metal[0], 'rgba(0,0,0,0)']); x.fillRect(0, R, f * 2.2, H - R * 2);
  const lr = 64, gap = lr * 2.3, px = W * .12, py = H * .045, pw = lr * 2.5, ph = gap * 2 + lr * 2.5;
  x.save(); x.shadowColor = 'rgba(0,0,0,.3)'; x.shadowBlur = 16; x.shadowOffsetY = 6; rr(x, px, py, pw, ph, pw / 2); x.fillStyle = lin(x, px, py, px + pw, py + ph, fin.glass); x.fill(); x.restore();
  rr(x, px, py, pw, ph, pw / 2); x.lineWidth = 5; x.strokeStyle = metalFill(x, px, py, px + pw, py + ph, fin.metal); x.stroke();
  for (let i = 0; i < 3; i++) lens(x, px + pw / 2, py + lr * 1.25 + i * gap, lr, { metal: fin.metal });
  flash(x, px + pw + lr * .7, py + lr * 1.1, lr * .3);
  return c;
}
/** A book foldable open, its inner screen: nearly square, the crease a whisper, the frame thin. */
function foldOpen(fin, wall, o = {}) {
  const W = o.w || 1440, H = o.h || 1580, R = o.r || 56, rail = 14, [c, x] = pad(W, H, rail);
  body(x, W, H, R, fin, { rail, buttons: [] });
  rr(x, 6, 6, W - 12, H - 12, R - 6); x.fillStyle = '#050506'; x.fill();
  screen(x, 24, 24, W - 48, H - 48, R - 16, wall, { crease: 'v', punch: [o.punchX || .78, .05, 16], clock: '10:26', clockX: .27, seed: o.seed || 41 });
  // the hinge's edge where the halves meet
  x.fillStyle = lin(x, 0, 0, 0, 20, [fin.metal[2], fin.metal[1]]); x.fillRect(W / 2 - 14, -4, 28, 8); x.fillRect(W / 2 - 14, H - 4, 28, 8);
  return c;
}
/** Galaxy Z Flip 8 closed: the cover screen over the top half, its two lenses at the screen's foot, the glass below. */
function flipClosed(fin, wall) {
  const W = 820, H = 900, R = 90, rail = 30, [c, x] = pad(W, H, rail);
  const f = body(x, W, H, R, fin, { rail, buttons: [[.18, .2]] });
  glass(x, W, H, R, f, fin.glass, { seed: 51 });
  // the hinge across the middle
  x.fillStyle = lin(x, 0, H * .52, 0, H * .58, [fin.metal[3], fin.metal[2], fin.metal[1]]); x.fillRect(f, H * .52, W - f * 2, H * .05);
  // the cover screen
  const sx = f + 10, sy = f + 10, sw = W - (f + 10) * 2, sh = H * .5 - f - 14;
  rr(x, sx - 4, sy - 4, sw + 8, sh + 8, R - f - 4); x.fillStyle = '#060607'; x.fill();
  screen(x, sx, sy, sw, sh, R - f - 10, wall, { seed: 52 });
  x.save(); rr(x, sx, sy, sw, sh, R - f - 10); x.clip();
  x.fillStyle = 'rgba(255,255,255,.92)'; x.textAlign = 'right'; x.font = `400 ${Math.round(sh * .3)}px PxOswald4`; x.fillText('10:26', sx + sw * .93, sy + sh * .42);
  x.font = `600 ${Math.round(sh * .075)}px PxOswald6`; x.fillStyle = 'rgba(255,255,255,.8)'; x.fillText('MON 23 NOV', sx + sw * .93, sy + sh * .56); x.restore();
  const lr = sh * .15; lens(x, sx + lr * 1.6, sy + sh - lr * 1.6, lr, { metal: fin.metal }); lens(x, sx + lr * 4.1, sy + sh - lr * 1.6, lr, { metal: fin.metal }); flash(x, sx + lr * 5.9, sy + sh - lr * 1.6, lr * .32);
  return c;
}
/** Galaxy Z Flip 8 open: a tall phone, the fold across its middle. */
function flipOpen(fin, wall) {
  const W = 700, H = 1640, R = 76, rail = 14, [c, x] = pad(W, H, rail);
  body(x, W, H, R, fin, { rail, buttons: [[.2, .1], [.33, .05]] });
  x.fillStyle = lin(x, 0, H * .49, 0, H * .51, [fin.metal[1], fin.metal[2], fin.metal[3]]); x.fillRect(-2, H * .493, W + rail + 4, H * .014);
  rr(x, 6, 6, W - 12, H - 12, R - 6); x.fillStyle = '#050506'; x.fill();
  screen(x, 24, 24, W - 48, H - 48, R - 14, wall, { crease: 'h', punch: [.5, .03, 15], clock: '10:26', seed: 61 });
  return c;
}

/* wallpapers: colour fields matched to each finish (first, the deep ground) */
const WALL = {
  violet: ['#1b1238', '#6c4fd1', '#c06fe0', '#3a2a8f', '#ff9ed2'],
  blue:   ['#071a33', '#2a7bd8', '#7fd3ff', '#1640a0', '#b2f0ff'],
  warm:   ['#2a0f12', '#ff7a45', '#ffc65c', '#d23a5b', '#ffe2a6'],
  green:  ['#08241c', '#1fae7a', '#9be86b', '#0f6b5e', '#e5ff9e'],
  dusk:   ['#140f2a', '#ff6fa8', '#7a5cff', '#2ad1ff', '#ffd27a'],
};
const MAKE = {
  'sam-s26-ultra-back-violet': () => galaxyBack(FIN.violet, true),
  'sam-s26-ultra-back-titanium': () => galaxyBack(FIN.titanium, true),
  'sam-s26-ultra-front': () => slabFront(FIN.titanium, 780, 1640, 70, WALL.violet, { bezel: 22, seed: 7 }),
  'sam-s26-back-skyblue': () => galaxyBack(FIN.skyblue, false),
  'sam-s26-back-pink': () => galaxyBack(FIN.pink, false),
  'sam-s26-back-navy': () => galaxyBack(FIN.navy, false),
  'sam-fold8-closed-back': () => foldBack(FIN.navy),
  'sam-fold8-open': () => foldOpen(FIN.silver, WALL.blue, { seed: 42 }),
  'sam-flip8-closed-ice': () => flipClosed(FIN.ice, WALL.dusk),
  'sam-flip8-open-violet': () => flipOpen(FIN.violet, WALL.dusk),
  'pix-11-pro-back-moonstone': () => pixelBack(FIN.moonstone, true),
  'pix-11-pro-back-porcelain': () => pixelBack(FIN.porcelain, true),
  'pix-11-pro-back-obsidian': () => pixelBack(FIN.obsidian, true),
  'pix-11-back-indigo': () => pixelBack(FIN.indigo, false),
  'pix-11-back-lime': () => pixelBack(FIN.lime, false),
  'pix-11-pro-front': () => slabFront(FIN.moonstone, 790, 1650, 150, WALL.green, { bezel: 30, seed: 8 }),
  'pix-fold-pro-open': () => foldOpen(FIN.moonstone, WALL.warm, { w: 1500, h: 1420, r: 70, punchX: .74, seed: 44 }),
};
window.PICTURES = Object.keys(MAKE);
window.PAINT = id => { const c = trim(MAKE[id]()); return { w: c.width, h: c.height, png: c.toDataURL('image/png') }; };
})();
