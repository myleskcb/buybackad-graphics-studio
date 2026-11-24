/* THE CARD LINES' PICTURES, PAINTED (browser side of scripts/paint_card_pictures.mjs).

   The owner, 2026-11-21: "Pokémon cards and sports cards are extremely lacking in variety", then
   chose "paint generic cards" over real card photographs; 2026-11-22, of the card ads: "why arent
   there new card assets like we talked about". The Pokémon line had two pictures (one real graded
   Charizard, three blank slabs), sports had the placeholders of scripts/make_card_assets.py.

   Every picture here is drawn: a trading card of no game (an element's emblem for art, invented
   names, no maker's frame or yellow border), a graded slab of no grader (a plain label, a grade, a
   hologram square), booster packs and a sealed box of no brand, a binder page, and sports cards of no
   league, team or player (a ball for art, an autograph that is a scribble, a jersey swatch of no
   team). Nothing claims to be a real card; each is named ph-* so a real photograph can replace it.

   window.PAINT(id) returns the picture as a PNG data URL; window.PICTURES lists the ids. */
(() => {
const TAU = Math.PI * 2;
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.round(w); c.height = Math.round(h); return c; };
function rr(x, X, Y, W, H, R) { R = Math.max(0, Math.min(R, W / 2, H / 2)); x.beginPath(); x.moveTo(X + R, Y); x.arcTo(X + W, Y, X + W, Y + H, R); x.arcTo(X + W, Y + H, X, Y + H, R); x.arcTo(X, Y + H, X, Y, R); x.arcTo(X, Y, X + W, Y, R); x.closePath(); }
function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const stops = (g, st) => { st.forEach((c, i) => Array.isArray(c) ? g.addColorStop(c[0], c[1]) : g.addColorStop(i / (st.length - 1), c)); return g; };
const lin = (x, x0, y0, x1, y1, st) => stops(x.createLinearGradient(x0, y0, x1, y1), st);
const rad = (x, cx, cy, r0, r1, st) => stops(x.createRadialGradient(cx, cy, r0, cx, cy, r1), st);
const F = { name: 'PxOswald7', sub: 'PxOswald6', thin: 'PxOswald4', num: 'PxTeko7', cond: 'PxSaira7' };
const font = (k, px) => `${px}px ${F[k]}`;
window.loadFonts = async list => { for (const [fam, b64] of list) { const f = new FontFace(fam, `url(data:font/woff2;base64,${b64})`); await f.load(); document.fonts.add(f); } };

/** The picture cut to what it draws, with a little room. */
function trim(c, pad = 6) {
  const x = c.getContext('2d', { willReadFrequently: true }), d = x.getImageData(0, 0, c.width, c.height).data;
  let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
  for (let y = 0; y < c.height; y++) for (let X = 0; X < c.width; X++) if (d[(y * c.width + X) * 4 + 3] > 6) { if (X < x0) x0 = X; if (X > x1) x1 = X; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return c;
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(c.width - 1, x1 + pad); y1 = Math.min(c.height - 1, y1 + pad);
  const o = mk(x1 - x0 + 1, y1 - y0 + 1); o.getContext('2d').drawImage(c, -x0, -y0); return o;
}
/** At most `long` pixels on its long side. */
function fit(c, long) { const k = Math.min(1, long / Math.max(c.width, c.height)); if (k >= 1) return c; const o = mk(c.width * k, c.height * k), x = o.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, o.width, o.height); return o; }

/* ── the trading card game of no game ─────────────────────────────────────────────────────────── */
const TYPES = {
  fire:   { a: '#ff5a1f', b: '#ffc247', d: '#6e0f00', panel: ['#ffe6cc', '#f3a46b'], name: 'CINDERFANG', hp: 120, moves: [['Heat Rush', 30], ['Flare Burst', 120]] },
  water:  { a: '#1c86ff', b: '#7fe6ff', d: '#062a63', panel: ['#d9edff', '#86bdf2'], name: 'RIPTIDE', hp: 110, moves: [['Undertow', 20], ['Tidal Crash', 90]] },
  grass:  { a: '#2bb84a', b: '#c2f56e', d: '#0a4419', panel: ['#e0f7cf', '#98d77f'], name: 'BRAMBLEBACK', hp: 90, moves: [['Leaf Drift', 20], ['Thorn Bloom', 70]] },
  volt:   { a: '#ffcc12', b: '#fff6b0', d: '#3d2a00', panel: ['#fff7c9', '#f0cd55'], name: 'VOLTARA', hp: 100, moves: [['Static Charge', 30], ['Storm Lance', 110]] },
  mystic: { a: '#a54dff', b: '#ff92dc', d: '#26084d', panel: ['#efdfff', '#c49cf0'], name: 'NOCTURNE', hp: 130, moves: [['Mind Veil', 40], ['Moonfall', 130]] },
  dragon: { a: '#d49d1c', b: '#ffe9a3', d: '#3e2600', panel: ['#f5ebcc', '#d8bd74'], name: 'GOLD WYVERN', hp: 170, moves: [['Scale Guard', 50], ['Sky Rend', 200]] },
};
const WEAK = { fire: 'water', water: 'volt', grass: 'fire', volt: 'grass', mystic: 'dragon', dragon: 'mystic' };
const BORDERS = {
  silver: ['#f4f6f9', '#b7bfca', '#ffffff', '#a6afbb', '#e9edf2'],
  gold: ['#fff1b8', '#caa24a', '#fff6d2', '#b38a2e', '#f3dc92'],
  rainbow: ['#ffc4e1', '#bfe1ff', '#c9ffd0', '#fff0b3', '#e2c9ff', '#ffc4e1'],
};

/** An element's emblem, drawn in the unit square round (cx, cy). */
function glyph(x, type, cx, cy, r, col, rib) {
  x.save(); x.translate(cx, cy); x.scale(r, r); x.fillStyle = col; x.beginPath();
  if (type === 'fire') { x.moveTo(0, -.84); x.bezierCurveTo(.38, -.38, .64, -.06, .52, .3); x.bezierCurveTo(.42, .64, .16, .78, 0, .78); x.bezierCurveTo(-.16, .78, -.42, .64, -.52, .3); x.bezierCurveTo(-.6, .02, -.32, -.14, -.24, -.42); x.bezierCurveTo(-.08, -.2, .02, -.32, 0, -.84); }
  else if (type === 'water') { x.moveTo(0, -.84); x.bezierCurveTo(.3, -.38, .56, -.06, .56, .24); x.arc(0, .24, .56, 0, Math.PI); x.bezierCurveTo(-.56, -.06, -.3, -.38, 0, -.84); }
  else if (type === 'grass') { x.moveTo(0, -.84); x.bezierCurveTo(.66, -.5, .62, .42, 0, .84); x.bezierCurveTo(-.62, .42, -.66, -.5, 0, -.84); }
  else if (type === 'volt') { [[.26, -.86], [-.42, .1], [-.03, .1], [-.26, .86], [.44, -.16], [.05, -.16]].forEach(([u, v], i) => i ? x.lineTo(u, v) : x.moveTo(u, v)); x.closePath(); }
  else if (type === 'mystic') { for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + i * Math.PI / 4, k = i % 2 ? .28 : .86; i ? x.lineTo(Math.cos(a) * k, Math.sin(a) * k) : x.moveTo(Math.cos(a) * k, Math.sin(a) * k); } x.closePath(); }
  else { x.moveTo(0, -.86); x.lineTo(.58, 0); x.lineTo(0, .86); x.lineTo(-.58, 0); x.closePath(); }
  x.fill();
  if (type === 'grass' && rib) { x.strokeStyle = rib; x.lineWidth = .07; x.beginPath(); x.moveTo(0, -.7); x.quadraticCurveTo(.06, 0, 0, .78); x.stroke(); }
  if (type === 'dragon' && rib) { x.fillStyle = rib; x.beginPath(); x.moveTo(0, -.46); x.lineTo(.3, 0); x.lineTo(0, .46); x.lineTo(-.3, 0); x.closePath(); x.fill(); }
  x.restore();
}
/** An energy disc: the element's colours, a white rim, the emblem in white. */
function energy(x, type, cx, cy, r) {
  const T = TYPES[type];
  x.save(); x.shadowColor = 'rgba(0,0,0,.32)'; x.shadowBlur = r * .35; x.shadowOffsetY = r * .1;
  x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fillStyle = rad(x, cx - r * .3, cy - r * .35, r * .1, r * 1.2, [T.b, T.a, T.d]); x.fill(); x.restore();
  x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.lineWidth = r * .13; x.strokeStyle = '#fff'; x.stroke();
  glyph(x, type, cx, cy, r * .6, '#fff', T.a);
}
function flame(x, bx, by, w, h, lean, a) {
  x.beginPath(); x.moveTo(bx - w / 2, by);
  x.bezierCurveTo(bx - w * .55, by - h * .45, bx + lean - w * .15, by - h * .7, bx + lean, by - h);
  x.bezierCurveTo(bx + lean + w * .05, by - h * .62, bx + w * .6, by - h * .4, bx + w / 2, by);
  x.closePath(); x.fillStyle = lin(x, 0, by, 0, by - h, [`rgba(255,236,150,${a})`, `rgba(255,140,40,${a * .8})`, 'rgba(255,60,0,0)']); x.fill();
}
function sparkle(x, cx, cy, r, col) { x.fillStyle = col; x.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, k = i % 2 ? r * .22 : r; i ? x.lineTo(cx + Math.cos(a) * k, cy + Math.sin(a) * k) : x.moveTo(cx + Math.cos(a) * k, cy + Math.sin(a) * k); } x.closePath(); x.fill(); }
/** A card's art: the element's own weather, its emblem lit in the middle. */
function art(x, type, X, Y, W, H, R) {
  const T = TYPES[type], cx = X + W / 2, cy = Y + H / 2, U = Math.min(W, H);
  x.save();
  if (type === 'fire') {
    x.fillStyle = rad(x, cx, Y + H * 1.05, U * .1, U * 1.3, [T.b, T.a, T.d, '#1a0300']); x.fillRect(X, Y, W, H);
    x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 16; i++) { const s = U * (.2 + R() * .45); flame(x, X + R() * W, Y + H + s * .05, s * .55, s, (R() - .5) * s * .4, .35 + R() * .3); }
    for (let i = 0; i < 46; i++) { x.fillStyle = `rgba(255,${200 + R() * 55 | 0},120,${.4 + R() * .5})`; x.beginPath(); x.arc(X + R() * W, Y + R() * H * .85, 1 + R() * 3.4, 0, TAU); x.fill(); }
  } else if (type === 'water') {
    x.fillStyle = lin(x, 0, Y, 0, Y + H, [T.b, T.a, T.d]); x.fillRect(X, Y, W, H);
    for (let k = 0; k < 5; k++) {
      const y0 = Y + H * (.42 + k * .13), A = U * (.04 + k * .012), ph = R() * TAU;
      x.beginPath(); x.moveTo(X, Y + H); for (let u = 0; u <= W; u += 8) x.lineTo(X + u, y0 + Math.sin(u / W * TAU * 1.6 + ph) * A); x.lineTo(X + W, Y + H); x.closePath();
      x.fillStyle = `rgba(6,42,99,${.18 + k * .08})`; x.fill();
      x.beginPath(); for (let u = 0; u <= W; u += 8) { const yy = y0 + Math.sin(u / W * TAU * 1.6 + ph) * A; u ? x.lineTo(X + u, yy) : x.moveTo(X, yy); } x.strokeStyle = 'rgba(255,255,255,.32)'; x.lineWidth = 3; x.stroke();
    }
    for (let i = 0; i < 26; i++) { const bx = X + R() * W, by = Y + R() * H, br = 3 + R() ** 2 * 18; x.beginPath(); x.arc(bx, by, br, 0, TAU); x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 2; x.stroke(); x.beginPath(); x.arc(bx - br * .35, by - br * .35, br * .22, 0, TAU); x.fillStyle = 'rgba(255,255,255,.7)'; x.fill(); }
  } else if (type === 'grass') {
    x.fillStyle = rad(x, cx, Y + H * .3, U * .05, U * 1.1, [T.b, T.a, T.d]); x.fillRect(X, Y, W, H);
    x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * .22; x.fillStyle = 'rgba(255,255,220,.06)'; x.beginPath(); x.moveTo(cx, Y - H * .2); x.lineTo(cx + Math.cos(a - .05) * U * 2, Y - H * .2 - Math.sin(a - .05) * -U * 2); x.lineTo(cx + Math.cos(a + .05) * U * 2, Y - H * .2 - Math.sin(a + .05) * -U * 2); x.fill(); }
    x.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 20; i++) {
      const lx = X + R() * W, ly = Y + R() * H, s = U * (.1 + R() * .16);
      if (Math.hypot(lx - cx, ly - cy) < U * .28) continue;
      x.save(); x.translate(lx, ly); x.rotate(R() * TAU); glyph(x, 'grass', 0, 0, s, [T.a, T.d, '#5fd36b'][i % 3], 'rgba(0,0,0,.25)'); x.restore();
    }
  } else if (type === 'volt') {
    x.fillStyle = rad(x, cx, cy, U * .05, U * .95, ['#4b4fa8', '#191b45', '#06071a']); x.fillRect(X, Y, W, H);
    x.fillStyle = rad(x, cx, cy, 0, U * .6, ['rgba(255,214,40,.45)', 'rgba(255,214,40,0)']); x.fillRect(X, Y, W, H);
    x.globalCompositeOperation = 'lighter'; x.lineJoin = 'round';
    for (let k = 0; k < 6; k++) {
      let px = cx + (R() - .5) * U * .2, py = cy; const a = R() * TAU, n = 9;
      x.beginPath(); x.moveTo(px, py);
      for (let i = 0; i < n; i++) { px += Math.cos(a) * U * .07 + (R() - .5) * U * .08; py += Math.sin(a) * U * .07 + (R() - .5) * U * .08; x.lineTo(px, py); }
      x.strokeStyle = 'rgba(255,246,176,.75)'; x.lineWidth = 2.5; x.shadowColor = T.a; x.shadowBlur = 16; x.stroke();
    }
  } else if (type === 'mystic') {
    x.fillStyle = rad(x, cx, cy, U * .05, U * .95, [T.b, T.a, T.d, '#0d0220']); x.fillRect(X, Y, W, H);
    for (let k = 1; k < 9; k++) { x.beginPath(); x.arc(cx, cy, U * .09 * k, 0, TAU); x.strokeStyle = `rgba(255,255,255,${.16 - k * .012})`; x.lineWidth = 2; x.stroke(); }
    for (let i = 0; i < 70; i++) { x.fillStyle = `rgba(255,255,255,${.3 + R() * .6})`; x.beginPath(); x.arc(X + R() * W, Y + R() * H, .8 + R() * 1.8, 0, TAU); x.fill(); }
    for (let i = 0; i < 7; i++) sparkle(x, X + R() * W, Y + R() * H, 6 + R() * 12, 'rgba(255,255,255,.85)');
  } else {
    x.fillStyle = lin(x, X, Y, X + W, Y + H, [T.d, T.a, T.b]); x.fillRect(X, Y, W, H);
    const s = U * .12;
    for (let row = 0, y = Y - s; y < Y + H + s; row++, y += s * .55) for (let xx = X - s + (row % 2) * s / 2; xx < X + W + s; xx += s) {
      x.beginPath(); x.arc(xx, y, s / 2, 0, Math.PI); x.fillStyle = `rgba(62,38,0,${.12 + (row % 3) * .04})`; x.fill(); x.strokeStyle = 'rgba(255,233,163,.35)'; x.lineWidth = 2; x.stroke();
    }
  }
  x.restore();
  // the emblem, lit
  x.save(); x.shadowColor = type === 'volt' ? T.a : T.b; x.shadowBlur = U * .12;
  const em = U * .3, g = lin(x, 0, cy - em, 0, cy + em, ['#ffffff', T.b, type === 'volt' ? '#ffb300' : T.a]);
  glyph(x, type, cx, cy + U * .02, em, g, type === 'grass' ? 'rgba(10,68,25,.45)' : T.d);
  x.restore();
}
/** A holographic finish: a cosmos of coloured specks, and a rainbow laid in. */
function holo(x, X, Y, W, H, R, k = 1) {
  x.save(); x.globalCompositeOperation = 'screen';
  for (let i = 0; i < 80; i++) { const r = 2 + R() ** 2 * 18; x.fillStyle = `hsla(${R() * 360},95%,70%,${.2 * k})`; x.beginPath(); x.arc(X + R() * W, Y + R() * H, r, 0, TAU); x.fill(); }
  x.globalCompositeOperation = 'overlay'; x.globalAlpha = .4 * k;
  x.fillStyle = lin(x, X, Y, X + W, Y + H, ['#ff6b6b', '#ffd93d', '#6bff95', '#4dd8ff', '#b46bff', '#ff6bd6']); x.fillRect(X, Y, W, H);
  x.restore();
}
function star(x, cx, cy, r, col) { x.fillStyle = col; x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? r * .45 : r; i ? x.lineTo(cx + Math.cos(a) * k, cy + Math.sin(a) * k) : x.moveTo(cx + Math.cos(a) * k, cy + Math.sin(a) * k); } x.closePath(); x.fill(); }

/** A trading card: plain, holo (the art holographic) or full art (the art over the whole card). */
function tcgCard(type, o = {}) {
  const W = 700, H = 980, c = mk(W, H), x = c.getContext('2d'), T = TYPES[type], R = rng(o.seed || 7), border = o.border || 'silver', full = o.variant === 'full', shiny = o.variant !== 'plain', no = String(o.no || 12).padStart(3, '0');
  rr(x, 0, 0, W, H, 34); x.save(); x.clip();
  x.fillStyle = lin(x, 0, 0, W, H, BORDERS[border]); x.fillRect(0, 0, W, H);
  rr(x, 22, 22, W - 44, H - 44, 18); x.save(); x.clip();
  if (full) {
    art(x, type, 22, 22, W - 44, H - 44, R);
    x.save(); x.globalAlpha = .08; x.strokeStyle = '#fff'; x.lineWidth = 2; for (let k = -H; k < W; k += 11) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k + H, H); x.stroke(); } x.restore();
    holo(x, 22, 22, W - 44, H - 44, R, .7);
    x.fillStyle = lin(x, 0, 22, 0, 200, ['rgba(0,0,0,.5)', 'rgba(0,0,0,0)']); x.fillRect(0, 0, W, 200);
    x.fillStyle = lin(x, 0, 560, 0, H, ['rgba(0,0,0,0)', 'rgba(0,0,0,.62)']); x.fillRect(0, 560, W, H);
  } else {
    x.fillStyle = lin(x, 0, 22, 0, H, T.panel); x.fillRect(0, 0, W, H);
    x.save(); x.globalAlpha = .05; x.strokeStyle = '#000'; x.lineWidth = 1.5; for (let k = -H; k < W; k += 9) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k + H, H); x.stroke(); } x.restore();
  }
  x.restore();
  const ink = full ? '#ffffff' : '#16181d';
  x.save(); if (full) { x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = 10; }
  x.fillStyle = ink; x.textBaseline = 'alphabetic'; x.textAlign = 'left'; x.font = font('name', 48); x.fillText(T.name, 50, 84);
  x.textAlign = 'right'; x.font = font('num', 66); x.fillText(String(T.hp), W - 100, 90);
  x.restore();
  energy(x, type, W - 64, 68, 25);
  if (!full) {
    const AX = 52, AY = 106, AW = W - 104, AH = 404;
    x.save(); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 14; x.shadowOffsetY = 4; rr(x, AX - 8, AY - 8, AW + 16, AH + 16, 8); x.fillStyle = lin(x, AX, AY, AX + AW, AY + AH, BORDERS[border === 'rainbow' ? 'gold' : border]); x.fill(); x.restore();
    rr(x, AX, AY, AW, AH, 4); x.save(); x.clip(); art(x, type, AX, AY, AW, AH, R); if (shiny) holo(x, AX, AY, AW, AH, R); x.restore();
    rr(x, 78, AY + AH + 16, W - 156, 30, 15); x.fillStyle = lin(x, 0, 0, W, 0, BORDERS.gold); x.fill();
    x.fillStyle = '#4a3a12'; x.font = font('sub', 19); x.textAlign = 'center'; x.fillText(`NO. ${no}   ·   ${type.toUpperCase()}   ·   STAGE ${1 + (o.seed || 1) % 2}`, W / 2, AY + AH + 38);
  }
  const y0 = full ? 650 : 606;
  T.moves.forEach(([nm, dmg], i) => {
    const y = y0 + i * (full ? 116 : 126), n = i + 1;
    for (let k = 0; k < n; k++) energy(x, type, 78 + k * 46, y, 19);
    x.save(); if (full) { x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = 8; }
    x.textAlign = 'left'; x.fillStyle = ink; x.font = font('name', 38); x.fillText(nm, 78 + n * 46 + 6, y + 13);
    x.textAlign = 'right'; x.font = font('num', 60); x.fillText(String(dmg), W - 60, y + 22);
    x.restore();
    x.fillStyle = full ? 'rgba(255,255,255,.45)' : 'rgba(22,24,29,.2)';
    rr(x, 62, y + 40, 360 + R() * 180, 9, 4.5); x.fill(); if (i === 1) { rr(x, 62, y + 60, 200 + R() * 220, 9, 4.5); x.fill(); }
    if (i === 0) { x.fillStyle = full ? 'rgba(255,255,255,.3)' : 'rgba(22,24,29,.16)'; x.fillRect(56, y + 84, W - 112, 2); }
  });
  const fy = H - 78, small = full ? 'rgba(255,255,255,.8)' : 'rgba(22,24,29,.6)';
  x.fillStyle = small; x.font = font('sub', 21); x.textAlign = 'left';
  x.fillText('weakness', 62, fy); energy(x, WEAK[type], 176, fy - 7, 14); x.fillStyle = small; x.fillText('×2', 197, fy);
  x.fillText('retreat', W / 2 - 30, fy); for (let k = 0; k < 1 + (o.seed || 1) % 3; k++) { x.beginPath(); x.arc(W / 2 + 58 + k * 30, fy - 7, 11, 0, TAU); x.fillStyle = full ? 'rgba(255,255,255,.7)' : '#c9ccd2'; x.fill(); }
  x.fillStyle = small; x.font = font('sub', 22); x.fillText(`${no}/150`, 62, H - 40);
  star(x, W - 74, H - 48, 14, full ? '#fff' : '#16181d');
  x.globalCompositeOperation = 'screen';
  x.fillStyle = lin(x, 0, 0, W, H, [[0, 'rgba(255,255,255,0)'], [.4, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.16)'], [.6, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]); x.fillRect(0, 0, W, H);
  x.restore();
  return c;
}

/* ── a graded slab of no grader ──────────────────────────────────────────────────────────────── */
function slab(card, o = {}) {
  const W = 720, H = 1190, c = mk(W, H), x = c.getContext('2d');
  rr(x, 0, 0, W, H, 30); x.fillStyle = lin(x, 0, 0, W, H, ['#eef2f6', '#d6dde6', '#f4f7fa', '#ccd4de']); x.fill();
  x.save(); rr(x, 0, 0, W, H, 30); x.clip();
  x.lineWidth = 3; x.strokeStyle = 'rgba(255,255,255,.95)'; rr(x, 10, 10, W - 20, H - 20, 22); x.stroke();
  x.lineWidth = 2; x.strokeStyle = 'rgba(110,125,140,.4)'; rr(x, 16, 16, W - 32, H - 32, 18); x.stroke();
  const L = { x: 38, y: 38, w: W - 76, h: 206 }, dark = !!o.dark;
  rr(x, L.x - 6, L.y - 6, L.w + 12, L.h + 12, 10); x.fillStyle = '#bcc6d1'; x.fill();
  rr(x, L.x, L.y, L.w, L.h, 6); x.fillStyle = dark ? lin(x, 0, L.y, 0, L.y + L.h, ['#202127', '#0b0c0f']) : lin(x, 0, L.y, 0, L.y + L.h, ['#ffffff', '#f1f2f0']); x.fill();
  const band = o.band || '#1d3557', ink = dark ? '#ecd9a0' : '#1a1d24', sub = dark ? 'rgba(236,217,160,.72)' : '#5b6573';
  x.save(); rr(x, L.x, L.y, L.w, L.h, 6); x.clip(); x.fillStyle = band; x.fillRect(L.x, L.y, 26, L.h); x.restore();
  x.textAlign = 'left'; x.textBaseline = 'alphabetic'; x.fillStyle = ink; x.font = font('name', 46); x.fillText(o.title || 'GEM MINT', L.x + 50, L.y + 64);
  x.fillStyle = sub; x.font = font('sub', 30); x.fillText(o.line1 || '', L.x + 50, L.y + 114);
  x.font = font('sub', 24); x.fillText(o.line2 || '', L.x + 50, L.y + 156);
  x.textAlign = 'right'; x.fillStyle = ink; x.font = font('num', 160); x.fillText(o.grade || '10', L.x + L.w - 26, L.y + 176);
  const hx = L.x + L.w - 250, hy = L.y + 138; rr(x, hx, hy, 74, 44, 6); x.fillStyle = lin(x, hx, hy, hx + 74, hy + 44, ['#ff9ad5', '#9ad8ff', '#b8ffb0', '#fff19a', '#d7a8ff']); x.fill();
  x.globalAlpha = .5; x.strokeStyle = '#fff'; x.lineWidth = 1.5; for (let k = 0; k < 6; k++) { x.beginPath(); x.moveTo(hx + 8 + k * 11, hy + 4); x.lineTo(hx + 2 + k * 11, hy + 40); x.stroke(); } x.globalAlpha = 1;
  const C = { x: 54, y: 282, w: W - 108, h: H - 282 - 50 };
  rr(x, C.x, C.y, C.w, C.h, 16); x.fillStyle = '#c4ccd6'; x.fill(); x.lineWidth = 2; x.strokeStyle = 'rgba(255,255,255,.85)'; x.stroke();
  const cw = C.w - 26, ch = cw * card.height / card.width, cy = C.y + (C.h - ch) / 2;
  x.save(); x.shadowColor = 'rgba(0,0,0,.25)'; x.shadowBlur = 10; x.drawImage(card, C.x + 13, cy, cw, ch); x.restore();
  x.save(); x.filter = 'blur(18px)'; x.fillStyle = 'rgba(255,255,255,.24)'; x.beginPath(); x.moveTo(0, H * .24); x.lineTo(W * .64, 0); x.lineTo(W * .88, 0); x.lineTo(0, H * .46); x.closePath(); x.fill(); x.restore();
  x.save(); x.filter = 'blur(8px)'; x.fillStyle = 'rgba(255,255,255,.14)'; x.beginPath(); x.moveTo(W, H * .62); x.lineTo(W * .3, H); x.lineTo(W * .4, H); x.lineTo(W, H * .7); x.closePath(); x.fill(); x.restore();
  x.restore();
  rr(x, 1.5, 1.5, W - 3, H - 3, 29); x.lineWidth = 3; x.strokeStyle = 'rgba(100,115,132,.6)'; x.stroke();
  return c;
}

/** Items fanned: round their middles (slabs, boxes) or from a hand's pivot at their foot (cards, packs). */
function fan(items, o = {}) {
  const spread = (o.spread ?? 12) * Math.PI / 180, step = o.step ?? .3, lift = o.lift ?? .03, n = items.length, foot = !!o.foot;
  const w = Math.max(...items.map(i => i.width)), h = Math.max(...items.map(i => i.height));
  const Wc = Math.round(w * (1.6 + step * (n - 1)) + w), Hc = Math.round(h * 2.2), c = mk(Wc, Hc), x = c.getContext('2d');
  const mid = (n - 1) / 2, ord = [...Array(n).keys()].sort((a, b) => o.ltr ? a - b : Math.abs(b - mid) - Math.abs(a - mid));
  for (const i of ord) {
    const it = items[i], a = (i - mid) * spread, px = Wc / 2 + (i - mid) * step * w, py = Hc / 2 + Math.abs(i - mid) * lift * h;
    x.save(); x.shadowColor = 'rgba(0,0,0,.3)'; x.shadowBlur = Math.max(18, w * .05); x.shadowOffsetY = w * .025;
    if (foot) { x.translate(px, py + h * .5); x.rotate(a); x.drawImage(it, -it.width / 2, -it.height); }
    else { x.translate(px, py); x.rotate(a); x.drawImage(it, -it.width / 2, -it.height / 2); }
    x.restore();
  }
  return trim(c);
}

/* ── packs and boxes ─────────────────────────────────────────────────────────────────────────── */
function pack(theme, o = {}) {
  const W = 440, H = 760, c = mk(W, H), x = c.getContext('2d'), R = rng(o.seed || 3), crimp = 54, tooth = 11;
  x.beginPath(); x.moveTo(0, tooth);
  for (let i = 0; i < W; i += tooth * 2) { x.lineTo(i + tooth, 0); x.lineTo(Math.min(W, i + tooth * 2), tooth); }
  x.lineTo(W, H - tooth);
  for (let i = W; i > 0; i -= tooth * 2) { x.lineTo(i - tooth, H); x.lineTo(Math.max(0, i - tooth * 2), H - tooth); }
  x.closePath(); x.save(); x.clip();
  theme(x, W, H, R);
  for (const y0 of [0, H - crimp]) {
    x.fillStyle = lin(x, 0, y0, 0, y0 + crimp, ['rgba(255,255,255,.32)', 'rgba(0,0,0,.16)', 'rgba(255,255,255,.26)']); x.fillRect(0, y0, W, crimp);
    x.strokeStyle = 'rgba(0,0,0,.16)'; x.lineWidth = 2; for (let i = 5; i < W; i += 9) { x.beginPath(); x.moveTo(i, y0 + 7); x.lineTo(i, y0 + crimp - 7); x.stroke(); }
  }
  x.globalCompositeOperation = 'screen';
  x.fillStyle = lin(x, 0, 0, W, 0, [[0, 'rgba(255,255,255,0)'], [.16, 'rgba(255,255,255,.3)'], [.28, 'rgba(255,255,255,0)'], [.72, 'rgba(255,255,255,0)'], [.84, 'rgba(255,255,255,.18)'], [1, 'rgba(255,255,255,0)']]); x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'multiply';
  x.fillStyle = lin(x, 0, 0, W, 0, [[0, 'rgba(0,0,0,.4)'], [.07, 'rgba(0,0,0,0)'], [.93, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.4)']]); x.fillRect(0, 0, W, H);
  x.restore();
  return c;
}
function outlined(x, text, cx, y, px, fill, stroke, k = 'name') { x.font = font(k, px); x.textAlign = 'center'; x.lineJoin = 'round'; x.lineWidth = px * .16; x.strokeStyle = stroke; x.strokeText(text, cx, y); x.fillStyle = fill; x.fillText(text, cx, y); }
const tcgPackTheme = type => (x, W, H, R) => {
  const T = TYPES[type];
  x.fillStyle = lin(x, 0, 0, W, 0, [T.d, T.a, T.d]); x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'overlay'; for (let i = 0; i < 7; i++) { x.fillStyle = `rgba(255,255,255,${.1 + R() * .12})`; const y = R() * H; x.beginPath(); x.moveTo(0, y); x.lineTo(W, y - 200); x.lineTo(W, y - 160); x.lineTo(0, y + 40); x.fill(); }
  x.globalCompositeOperation = 'source-over';
  const cx = W / 2, cy = H * .5, r = 150;
  x.save(); x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.clip(); art(x, type, cx - r, cy - r, r * 2, r * 2, R); holo(x, cx - r, cy - r, r * 2, r * 2, R, .8); x.restore();
  x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.lineWidth = 10; x.strokeStyle = lin(x, cx - r, cy - r, cx + r, cy + r, BORDERS.gold); x.stroke();
  outlined(x, 'BOOSTER', cx, 150, 66, '#ffffff', T.d); outlined(x, 'PACK', cx, 208, 50, T.b, T.d);
  rr(x, cx - 92, H - 150, 184, 46, 23); x.fillStyle = '#ffffff'; x.fill(); x.fillStyle = T.d; x.font = font('sub', 28); x.textAlign = 'center'; x.fillText('10 CARDS', cx, H - 117);
  x.fillStyle = 'rgba(255,255,255,.8)'; x.font = font('sub', 20); x.fillText('TRADING CARD GAME', cx, H - 72);
};

/** A sealed box in an oblique view: the front, its top and its side, shrink-wrapped. */
function box(front, top, side) {
  const FW = front.width, FH = front.height, TD = top.height, SW = side.width, dx = Math.round(FW * .26), dy = -Math.round(FH * .32);
  const c = mk(FW + dx + 60, FH - dy + 60), x = c.getContext('2d'), ox = 30, oy = 30 - dy;
  x.save(); x.setTransform(1, 0, dx / TD, dy / TD, ox, oy); x.drawImage(top, 0, 0); x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(0, 0, FW, TD); x.restore();
  x.save(); x.setTransform(dx / SW, dy / SW, 0, 1, ox + FW, oy); x.drawImage(side, 0, 0); x.fillStyle = 'rgba(0,0,0,.32)'; x.fillRect(0, 0, SW, FH); x.restore();
  x.drawImage(front, ox, oy);
  const outline = () => { x.beginPath(); x.moveTo(ox, oy); x.lineTo(ox + dx, oy + dy); x.lineTo(ox + FW + dx, oy + dy); x.lineTo(ox + FW + dx, oy + FH + dy); x.lineTo(ox + FW, oy + FH); x.lineTo(ox, oy + FH); x.closePath(); };
  x.save(); outline(); x.clip(); x.filter = 'blur(10px)'; x.fillStyle = 'rgba(255,255,255,.16)';
  for (let k = 0; k < 3; k++) { const s = ox + 120 + k * FW * .38; x.beginPath(); x.moveTo(s, oy + FH); x.lineTo(s + 80, oy + FH); x.lineTo(s + 80 + dx * 1.4, oy + dy); x.lineTo(s + dx * 1.4, oy + dy); x.fill(); }
  x.filter = 'none'; x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 3; x.beginPath(); x.moveTo(ox, oy); x.lineTo(ox + FW, oy); x.lineTo(ox + FW + dx, oy + dy); x.stroke();
  x.restore();
  return trim(c);
}
function tcgBox() {
  const FW = 1000, FH = 560, f = mk(FW, FH), x = f.getContext('2d'), R = rng(41);
  x.fillStyle = lin(x, 0, 0, FW, FH, ['#121a42', '#2a1660', '#0b1030']); x.fillRect(0, 0, FW, FH);
  ['fire', 'water', 'grass', 'volt', 'mystic'].forEach((t, k) => { const s = 470 + k * 105; x.fillStyle = TYPES[t].a; x.beginPath(); x.moveTo(s, FH); x.lineTo(s + 80, FH); x.lineTo(s + 380, 0); x.lineTo(s + 300, 0); x.closePath(); x.fill(); });
  x.save(); x.beginPath(); x.arc(780, 250, 170, 0, TAU); x.clip(); art(x, 'dragon', 610, 80, 340, 340, R); holo(x, 610, 80, 340, 340, R, .8); x.restore();
  x.beginPath(); x.arc(780, 250, 170, 0, TAU); x.lineWidth = 12; x.strokeStyle = lin(x, 610, 80, 950, 420, BORDERS.gold); x.stroke();
  x.textAlign = 'left'; x.fillStyle = '#ffffff'; x.font = font('name', 118); x.fillText('BOOSTER', 52, 158); x.fillStyle = '#ffd34d'; x.fillText('BOX', 52, 284);
  rr(x, 52, 326, 470, 64, 8); x.fillStyle = '#ffffff'; x.fill(); x.fillStyle = '#121a42'; x.font = font('sub', 40); x.fillText('36 PACKS · 10 CARDS EACH', 72, 372);
  ['fire', 'water', 'grass', 'volt', 'mystic', 'dragon'].forEach((t, k) => energy(x, t, 80 + k * 66, 460, 24));
  x.fillStyle = 'rgba(255,255,255,.7)'; x.font = font('sub', 24); x.fillText('TRADING CARD GAME', 52, 530);
  const top = mk(FW, 300), tx = top.getContext('2d'); tx.fillStyle = lin(tx, 0, 0, FW, 300, ['#26306a', '#352079']); tx.fillRect(0, 0, FW, 300); tx.fillStyle = '#ffd34d'; tx.fillRect(0, 120, FW, 46);
  const side = mk(300, FH), sx = side.getContext('2d'); sx.fillStyle = '#121a42'; sx.fillRect(0, 0, 300, FH); sx.fillStyle = '#ffd34d'; sx.fillRect(0, 326, 300, 64);
  return box(f, top, side);
}

/* ── a binder of nine-pocket pages ───────────────────────────────────────────────────────────── */
function binder(cards, o = {}) {
  const PW = 760, PH = 1040, gap = 70, W = PW * 2 + gap + 60, H = PH + 60, c = mk(W, H), x = c.getContext('2d');
  rr(x, 0, 0, W, H, 34); x.fillStyle = lin(x, 0, 0, W, H, o.cover || ['#262a34', '#15171d', '#2c303a']); x.fill();
  x.setLineDash([14, 10]); x.lineWidth = 3; x.strokeStyle = 'rgba(255,255,255,.22)'; rr(x, 14, 14, W - 28, H - 28, 26); x.stroke(); x.setLineDash([]);
  x.fillStyle = lin(x, W / 2 - gap / 2 - 24, 0, W / 2 + gap / 2 + 24, 0, ['rgba(0,0,0,0)', 'rgba(0,0,0,.5)', 'rgba(255,255,255,.07)', 'rgba(0,0,0,.5)', 'rgba(0,0,0,0)']); x.fillRect(W / 2 - gap / 2 - 24, 0, gap + 48, H);
  for (let p = 0; p < 2; p++) {
    const px = 30 + p * (PW + gap), py = 30;
    rr(x, px, py, PW, PH, 10); x.fillStyle = '#e6eaee'; x.fill();
    const cw = (PW - 4 * 22) / 3, ch = cw * 1.4, gy = (PH - 3 * ch) / 4;
    for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) {
      const cx = px + 22 + k * (cw + 22), cy = py + gy + r * (ch + gy), card = cards[(p * 9 + r * 3 + k) % cards.length];
      rr(x, cx - 7, cy - 7, cw + 14, ch + 14, 6); x.fillStyle = 'rgba(255,255,255,.6)'; x.fill();
      x.drawImage(card, cx, cy, cw, ch);
      x.fillStyle = lin(x, cx, cy, cx + cw, cy + ch, [[0, 'rgba(255,255,255,.2)'], [.4, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,.08)']]); x.fillRect(cx - 7, cy - 7, cw + 14, ch + 14);
      x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 2; x.beginPath(); x.moveTo(cx - 7, cy + 12); x.lineTo(cx + cw + 7, cy + 12); x.stroke();
    }
  }
  return c;
}

/* ── sports cards of no league, team or player ───────────────────────────────────────────────── */
const TEAMS = [
  { c1: '#0b2a5b', c2: '#1f6fd1', acc: '#ffcf3d' }, { c1: '#5b0b14', c2: '#d1283a', acc: '#ffffff' }, { c1: '#063d2c', c2: '#12925e', acc: '#ffd166' },
  { c1: '#2a0b5b', c2: '#7b2cbf', acc: '#ffb703' }, { c1: '#6b1d00', c2: '#ff6b00', acc: '#ffffff' }, { c1: '#00343f', c2: '#00a3ad', acc: '#ff7a59' },
];
const SPORTS = { basketball: { pos: 'POINT GUARD', num: '23' }, baseball: { pos: 'SHORTSTOP', num: '7' }, football: { pos: 'WIDE RECEIVER', num: '88' }, soccer: { pos: 'FORWARD', num: '10' }, hockey: { pos: 'CENTER', num: '91' } };
function ball(x, sport, cx, cy, r) {
  const sh = () => { x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = r * .25; x.shadowOffsetY = r * .08; };
  x.save();
  if (sport === 'basketball') {
    sh(); x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fillStyle = rad(x, cx - r * .35, cy - r * .4, r * .1, r * 1.2, ['#ffb15c', '#f07c1a', '#9a3f08']); x.fill();
    x.shadowColor = 'transparent'; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.clip();
    x.strokeStyle = '#2b1204'; x.lineWidth = r * .045;
    x.beginPath(); x.moveTo(cx, cy - r); x.lineTo(cx, cy + r); x.moveTo(cx - r, cy); x.lineTo(cx + r, cy); x.stroke();
    x.beginPath(); x.ellipse(cx - r * 1.08, cy, r * .66, r * 1.1, 0, -Math.PI / 2, Math.PI / 2); x.stroke();
    x.beginPath(); x.ellipse(cx + r * 1.08, cy, r * .66, r * 1.1, 0, Math.PI / 2, Math.PI * 1.5); x.stroke();
  } else if (sport === 'baseball') {
    sh(); x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fillStyle = rad(x, cx - r * .35, cy - r * .4, r * .1, r * 1.2, ['#ffffff', '#eeece6', '#b8b4aa']); x.fill();
    x.shadowColor = 'transparent'; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.clip();
    for (const s of [-1, 1]) {
      const ox = cx + s * r * 1.32, R0 = r * 1.0, a0 = s < 0 ? -.82 : Math.PI - .82, a1 = s < 0 ? .82 : Math.PI + .82;
      x.strokeStyle = 'rgba(160,150,140,.6)'; x.lineWidth = r * .02; x.beginPath(); x.arc(ox, cy, R0, a0, a1); x.stroke();
      x.strokeStyle = '#d62828'; x.lineWidth = r * .022;
      for (let k = 0; k <= 14; k++) { const a = a0 + (a1 - a0) * k / 14, px = ox + Math.cos(a) * R0, py = cy + Math.sin(a) * R0, nx = Math.cos(a), ny = Math.sin(a), tx = -ny, ty = nx, L = r * .07;
        x.beginPath(); x.moveTo(px - nx * L + tx * L * .5, py - ny * L + ty * L * .5); x.lineTo(px, py); x.lineTo(px + nx * L + tx * L * .5, py + ny * L + ty * L * .5); x.stroke(); }
    }
  } else if (sport === 'football') {
    x.translate(cx, cy); x.rotate(-.5); sh();
    x.beginPath(); x.ellipse(0, 0, r * 1.18, r * .7, 0, 0, TAU); x.fillStyle = rad(x, -r * .3, -r * .25, r * .1, r * 1.3, ['#b8653a', '#7a3a16', '#3d1a06']); x.fill();
    x.shadowColor = 'transparent'; x.beginPath(); x.ellipse(0, 0, r * 1.18, r * .7, 0, 0, TAU); x.clip();
    x.strokeStyle = '#ffffff'; x.lineWidth = r * .07; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(s * r * .8, 0, r * .1, r * .75, 0, 0, TAU); x.stroke(); }
    x.lineWidth = r * .045; x.beginPath(); x.moveTo(-r * .38, -r * .05); x.lineTo(r * .38, -r * .05); x.stroke();
    for (let k = -3; k <= 3; k++) { x.beginPath(); x.moveTo(k * r * .11, -r * .15); x.lineTo(k * r * .11, r * .05); x.stroke(); }
  } else if (sport === 'soccer') {
    sh(); x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fillStyle = rad(x, cx - r * .35, cy - r * .4, r * .1, r * 1.2, ['#ffffff', '#ececec', '#9e9e9e']); x.fill();
    x.shadowColor = 'transparent'; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.clip();
    const pent = (px, py, R, rot) => { x.beginPath(); for (let i = 0; i < 5; i++) { const a = rot + i * TAU / 5; i ? x.lineTo(px + Math.cos(a) * R, py + Math.sin(a) * R) : x.moveTo(px + Math.cos(a) * R, py + Math.sin(a) * R); } x.closePath(); x.fillStyle = '#1b1b1b'; x.fill(); };
    pent(cx, cy, r * .33, -Math.PI / 2);
    x.strokeStyle = 'rgba(60,60,60,.7)'; x.lineWidth = r * .02;
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5, b = a + TAU / 10; x.beginPath(); x.moveTo(cx + Math.cos(a) * r * .33, cy + Math.sin(a) * r * .33); x.lineTo(cx + Math.cos(a) * r * .62, cy + Math.sin(a) * r * .62); x.stroke(); pent(cx + Math.cos(b) * r * .92, cy + Math.sin(b) * r * .92, r * .3, b); }
  } else {
    // hockey: a face-off circle of white ice under the sticks and the puck, so the black puck stands on white
    sh(); x.beginPath(); x.arc(cx, cy, r * 1.04, 0, TAU); x.fillStyle = rad(x, cx - r * .3, cy - r * .35, r * .1, r * 1.15, ['#ffffff', '#eef4fb', '#c4d4e8']); x.fill();
    x.shadowColor = 'transparent'; x.lineWidth = r * .075; x.strokeStyle = '#d7263d'; x.beginPath(); x.arc(cx, cy, r * .9, 0, TAU); x.stroke();
    x.save(); x.lineCap = 'round';
    for (const s of [-1, 1]) {
      x.save(); x.translate(cx, cy + r * .1); x.rotate(s * .62);
      x.fillStyle = lin(x, -r * .07, 0, r * .07, 0, ['#c98b4a', '#e8b77a', '#a86b2f']); rr(x, -r * .07, -r * 1.25, r * .14, r * 2.1, r * .05); x.fill();
      x.fillStyle = '#1b1b1b'; x.fillRect(-r * .075, -r * 1.2, r * .15, r * .28); x.fillRect(-r * .075, r * .5, r * .15, r * .1);
      x.fillStyle = '#1b1b1b'; x.save(); x.translate(0, r * .85); x.rotate(s * -1.25); rr(x, -r * .07, -r * .02, r * .14, r * .5, r * .05); x.fill(); x.restore();
      x.restore();
    }
    x.restore();
    sh(); x.fillStyle = '#121212'; x.beginPath(); x.ellipse(cx, cy + r * .16, r * .72, r * .28, 0, 0, TAU); x.fill(); x.fillRect(cx - r * .72, cy - r * .1, r * 1.44, r * .26);
    x.shadowColor = 'transparent'; x.fillStyle = rad(x, cx - r * .2, cy - r * .2, r * .05, r * .8, ['#4a4a4a', '#232323', '#111111']); x.beginPath(); x.ellipse(cx, cy - r * .1, r * .72, r * .28, 0, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = r * .02; x.beginPath(); x.ellipse(cx, cy - r * .1, r * .5, r * .19, 0, 0, TAU); x.stroke();
  }
  x.restore();
}
function signature(x, X, Y, W, H, R, col = '#1d3fbf') {
  x.save(); x.strokeStyle = col; x.lineCap = 'round'; x.lineJoin = 'round'; x.lineWidth = H * .045;
  const py = Y + H * .6; let px = X + W * .05;
  x.beginPath(); x.moveTo(px, py);
  x.bezierCurveTo(px + W * .03, py - H * .8, px + W * .17, py - H * .72, px + W * .1, py - H * .04);
  x.bezierCurveTo(px + W * .07, py + H * .32, px - W * .02, py + H * .1, px + W * .13, py - H * .1);
  let cx = px + W * .15; const n = 7 + Math.floor(R() * 3);
  for (let i = 0; i < n && cx < X + W * .9; i++) {
    const w = W * (.055 + R() * .03), h = H * Math.max(.12, .36 - i * .025) * (R() < .25 ? 1.7 : 1);
    x.bezierCurveTo(cx + w * .2, py - h, cx + w * .7, py - h, cx + w * .5, py); x.bezierCurveTo(cx + w * .4, py + h * .3, cx + w * .9, py + h * .2, cx + w, py - h * .1); cx += w;
  }
  x.stroke();
  x.lineWidth = H * .03; x.beginPath(); x.moveTo(X + W * .08, Y + H * .86); x.bezierCurveTo(X + W * .4, Y + H * .7, X + W * .74, Y + H * .96, X + W * .95, Y + H * .64); x.stroke();
  x.restore();
}
function swatch(x, X, Y, W, H, team) {
  x.save(); rr(x, X, Y, W, H, 10); x.clip();
  x.fillStyle = team.c2; x.fillRect(X, Y, W, H);
  x.fillStyle = '#ffffff'; x.fillRect(X, Y + H * .36, W, H * .05); x.fillRect(X, Y + H * .62, W, H * .05);
  x.fillStyle = team.acc; x.fillRect(X, Y + H * .41, W, H * .21);
  x.fillStyle = 'rgba(0,0,0,.22)'; for (let yy = Y + 3, r = 0; yy < Y + H; yy += 7, r++) for (let xx = X + (r % 2 ? 3.5 : 0); xx < X + W; xx += 7) { x.beginPath(); x.arc(xx, yy, 1.6, 0, TAU); x.fill(); }
  x.filter = 'blur(5px)'; x.strokeStyle = 'rgba(0,0,0,.5)'; x.lineWidth = 12; rr(x, X, Y, W, H, 10); x.stroke(); x.filter = 'none';
  x.restore();
  rr(x, X, Y, W, H, 10); x.lineWidth = 5; x.strokeStyle = lin(x, X, Y, X + W, Y + H, BORDERS.gold); x.stroke();
}
function shield(x, cx, cy, s, fill, ink) {
  x.beginPath(); x.moveTo(cx - s * .5, cy - s * .55); x.lineTo(cx + s * .5, cy - s * .55); x.lineTo(cx + s * .5, cy + s * .1); x.quadraticCurveTo(cx + s * .45, cy + s * .45, cx, cy + s * .62); x.quadraticCurveTo(cx - s * .45, cy + s * .45, cx - s * .5, cy + s * .1); x.closePath();
  x.fillStyle = fill; x.fill(); x.lineWidth = s * .06; x.strokeStyle = ink; x.stroke();
  x.fillStyle = ink; x.font = font('name', s * .46); x.textAlign = 'center'; x.fillText('RC', cx, cy + s * .15);
}
/** A sports card: base, refractor (a rainbow burst), autograph, or a patch autograph. */
function sportsCard(sport, team, o = {}) {
  const W = 700, H = 980, c = mk(W, H), x = c.getContext('2d'), R = rng(o.seed || 11), S = SPORTS[sport], signed = !!(o.auto || o.patch);
  rr(x, 0, 0, W, H, 26); x.save(); x.clip();
  x.fillStyle = o.chrome ? lin(x, 0, 0, W, H, BORDERS.silver) : '#f7f7f4'; x.fillRect(0, 0, W, H);
  const I = 20; rr(x, I, I, W - 2 * I, H - 2 * I, 12); x.save(); x.clip();
  x.fillStyle = lin(x, 0, 0, W * .4, H, [team.c2, team.c1]); x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'screen';
  for (let i = 0; i < 9; i++) { x.fillStyle = `rgba(255,255,255,${.04 + R() * .07})`; const y = R() * H * 1.3, t = 20 + R() * 90; x.beginPath(); x.moveTo(0, y); x.lineTo(W, y - W * .55); x.lineTo(W, y - W * .55 + t); x.lineTo(0, y + t); x.closePath(); x.fill(); }
  const bcy = signed ? H * .27 : H * .4;
  if (o.refractor) for (let i = 0; i < 56; i++) { const a = i * TAU / 56; x.fillStyle = `hsla(${i * 360 / 14 % 360},95%,62%,${i % 2 ? .05 : .2})`; x.beginPath(); x.moveTo(W / 2, bcy); x.arc(W / 2, bcy, H * 1.2, a, a + TAU / 56); x.closePath(); x.fill(); }
  x.globalCompositeOperation = 'source-over';
  x.fillStyle = 'rgba(255,255,255,.08)'; for (let y = H * .55, k = 0; y < H; y += 16, k++) { const rr0 = 2 + 5 * (y - H * .55) / (H * .45); for (let xx = k % 2 * 8; xx < W; xx += 16) { x.beginPath(); x.arc(xx, y, rr0, 0, TAU); x.fill(); } }
  ball(x, sport, W / 2, bcy, signed ? 150 : 195);
  shield(x, 78, 84, 84, '#ffffff', team.c1);
  x.beginPath(); x.arc(W - 88, 90, 52, 0, TAU); x.fillStyle = 'rgba(255,255,255,.94)'; x.fill(); x.fillStyle = team.c1; x.font = font('num', 74); x.textAlign = 'center'; x.fillText(S.num, W - 88, 114);
  if (o.serial) { x.save(); x.textAlign = 'left'; x.font = font('num', 50); x.fillStyle = lin(x, 0, 150, 0, 200, BORDERS.gold); x.shadowColor = 'rgba(0,0,0,.4)'; x.shadowBlur = 6; x.fillText(o.serial, 40, 196); x.restore(); }
  if (signed) {
    const P = { x: 54, y: 500, w: W - 108, h: o.patch ? 300 : 250 };
    x.save(); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 16; rr(x, P.x, P.y, P.w, P.h, 14); x.fillStyle = '#fbfbf8'; x.fill(); x.restore();
    rr(x, P.x + 8, P.y + 8, P.w - 16, P.h - 16, 10); x.lineWidth = 3; x.strokeStyle = team.c2; x.stroke();
    if (o.patch) { swatch(x, W / 2 - 150, P.y + 24, 300, 112, team); signature(x, P.x + 40, P.y + 140, P.w - 80, 110, R); }
    else signature(x, P.x + 40, P.y + 30, P.w - 80, 160, R);
    x.fillStyle = '#6a6f78'; x.font = font('sub', 22); x.textAlign = 'center'; x.fillText(o.patch ? 'ROOKIE PATCH AUTOGRAPH' : 'CERTIFIED AUTOGRAPH', W / 2, P.y + P.h - 22);
    const ny = H - 150; x.beginPath(); x.moveTo(0, ny + 12); x.lineTo(W, ny - 12); x.lineTo(W, ny + 92); x.lineTo(0, ny + 116); x.closePath(); x.fillStyle = team.acc; x.fill();
    x.fillStyle = team.c1; x.font = font('name', 54); x.textAlign = 'center'; x.fillText(S.pos, W / 2, ny + 70);
  } else {
    const ny = Math.round(H * .74);
    x.beginPath(); x.moveTo(0, ny + 14); x.lineTo(W, ny - 14); x.lineTo(W, ny + 112); x.lineTo(0, ny + 140); x.closePath(); x.fillStyle = team.acc; x.fill();
    x.beginPath(); x.moveTo(0, ny + 140); x.lineTo(W, ny + 112); x.lineTo(W, ny + 126); x.lineTo(0, ny + 154); x.closePath(); x.fillStyle = '#ffffff'; x.fill();
    x.fillStyle = team.c1; x.font = font('name', 62); x.textAlign = 'center'; x.fillText(S.pos, W / 2, ny + 84);
    x.fillStyle = '#ffffff'; x.font = font('num', 50); x.fillText('ROOKIE', W / 2, H - 52);
  }
  x.restore();
  if (o.chrome) { x.globalCompositeOperation = 'screen'; x.fillStyle = lin(x, 0, 0, W, H, [[0, 'rgba(255,255,255,0)'], [.45, 'rgba(255,255,255,0)'], [.52, 'rgba(255,255,255,.2)'], [.6, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]); x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over'; }
  rr(x, I, I, W - 2 * I, H - 2 * I, 12); x.lineWidth = 3; x.strokeStyle = o.chrome ? 'rgba(90,100,115,.6)' : 'rgba(200,204,210,.9)'; x.stroke();
  x.restore();
  return c;
}
const waxTheme = (team, sport) => (x, W, H, R) => {
  x.fillStyle = lin(x, 0, 0, 0, H, ['#fbf6ea', '#efe5cf']); x.fillRect(0, 0, W, H);
  for (let k = 0; k < 3; k++) { x.fillStyle = [team.c1, team.c2, team.acc][k]; x.beginPath(); const s = -200 + k * 70; x.moveTo(0, H * .7 + s); x.lineTo(W, H * .42 + s); x.lineTo(W, H * .42 + s + 46); x.lineTo(0, H * .7 + s + 46); x.closePath(); x.fill(); }
  ball(x, sport, W / 2, H * .5, 120);
  x.fillStyle = team.c1; x.font = font('name', 60); x.textAlign = 'center'; x.fillText('TRADING', W / 2, 140); x.fillText('CARDS', W / 2, 200);
  rr(x, W / 2 - 96, H - 150, 192, 46, 23); x.fillStyle = team.c1; x.fill(); x.fillStyle = '#ffffff'; x.font = font('sub', 28); x.fillText('12 CARDS', W / 2, H - 117);
  x.fillStyle = team.c2; x.font = font('sub', 22); x.fillText('SERIES ONE', W / 2, H - 74);
};
const chromeTheme = (team, sport) => (x, W, H, R) => {
  x.fillStyle = lin(x, 0, 0, W, H, ['#1d2230', '#4b5568', '#1a1f2b']); x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'screen'; for (let i = 0; i < 40; i++) { const a = i * TAU / 40; x.fillStyle = `hsla(${i * 360 / 10 % 360},95%,60%,${i % 2 ? .04 : .16})`; x.beginPath(); x.moveTo(W / 2, H * .5); x.arc(W / 2, H * .5, H, a, a + TAU / 40); x.closePath(); x.fill(); }
  x.globalCompositeOperation = 'source-over';
  ball(x, sport, W / 2, H * .5, 120);
  outlined(x, 'CHROME', W / 2, 150, 64, '#ffffff', team.c1); outlined(x, 'HOBBY', W / 2, 206, 44, team.acc, team.c1);
  rr(x, W / 2 - 96, H - 150, 192, 46, 23); x.fillStyle = '#ffffff'; x.fill(); x.fillStyle = team.c1; x.font = font('sub', 28); x.textAlign = 'center'; x.fillText('8 CARDS', W / 2, H - 117);
};
function hobbyBox() {
  const FW = 1000, FH = 560, f = mk(FW, FH), x = f.getContext('2d'), T = TEAMS[1];
  x.fillStyle = lin(x, 0, 0, FW, FH, ['#121a2e', '#1c2846', '#0c1220']); x.fillRect(0, 0, FW, FH);
  x.globalCompositeOperation = 'screen'; for (let i = 0; i < 30; i++) { const a = -Math.PI + i * Math.PI / 30; x.fillStyle = `hsla(${i * 24 % 360},95%,60%,${i % 2 ? .03 : .12})`; x.beginPath(); x.moveTo(800, FH); x.arc(800, FH, 900, a, a + Math.PI / 30); x.closePath(); x.fill(); }
  x.globalCompositeOperation = 'source-over';
  [['basketball', 700, 210, 90], ['baseball', 860, 330, 80], ['football', 700, 420, 80]].forEach(([s, bx, by, r]) => ball(x, s, bx, by, r));
  x.fillStyle = T.c2; x.fillRect(0, 0, 26, FH);
  x.textAlign = 'left'; x.fillStyle = '#ffffff'; x.font = font('name', 120); x.fillText('HOBBY', 60, 160); x.fillStyle = '#ffcf3d'; x.fillText('BOX', 60, 284);
  rr(x, 60, 326, 440, 64, 8); x.fillStyle = '#ffffff'; x.fill(); x.fillStyle = '#121a2e'; x.font = font('sub', 40); x.fillText('12 PACKS · 20 CARDS', 80, 372);
  x.fillStyle = 'rgba(255,255,255,.75)'; x.font = font('sub', 30); x.fillText('ROOKIES · AUTOGRAPHS · RELICS', 60, 452);
  x.fillStyle = 'rgba(255,255,255,.5)'; x.font = font('sub', 22); x.fillText('TRADING CARDS', 60, 520);
  const top = mk(FW, 300), tx = top.getContext('2d'); tx.fillStyle = lin(tx, 0, 0, FW, 300, ['#26355c', '#1a2544']); tx.fillRect(0, 0, FW, 300); tx.fillStyle = T.c2; tx.fillRect(0, 120, FW, 46);
  const side = mk(300, FH), sx = side.getContext('2d'); sx.fillStyle = '#121a2e'; sx.fillRect(0, 0, 300, FH); sx.fillStyle = T.c2; sx.fillRect(0, 326, 300, 64);
  return box(f, top, side);
}

/** A collection laid out: a binder behind, a slab standing, packs and a hand of cards in front. */
function collection(bnd, sl, packs, hand) {
  const W = 2400, H = 1700, c = mk(W, H), x = c.getContext('2d');
  const put = (img, cx, cy, k, a) => { x.save(); x.translate(cx, cy); x.rotate(a * Math.PI / 180); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 40; x.shadowOffsetY = 18; x.drawImage(img, -img.width * k / 2, -img.height * k / 2, img.width * k, img.height * k); x.restore(); };
  put(bnd, W * .4, H * .44, .95, -4);
  put(sl, W * .8, H * .45, .9, 6);
  put(packs, W * .56, H * .66, .72, 0);
  put(hand, W * .26, H * .7, .66, -6);
  return trim(c);
}

const CACHE = {};
const once = (k, f) => CACHE[k] || (CACHE[k] = f());
const poke = {
  fire: () => once('pf', () => tcgCard('fire', { variant: 'holo', border: 'gold', seed: 3, no: 6 })),
  water: () => once('pw', () => tcgCard('water', { variant: 'holo', border: 'silver', seed: 5, no: 31 })),
  grass: () => once('pg', () => tcgCard('grass', { variant: 'holo', border: 'silver', seed: 8, no: 44 })),
  volt: () => once('pv', () => tcgCard('volt', { variant: 'holo', border: 'gold', seed: 2, no: 25 })),
  mystic: () => once('pm', () => tcgCard('mystic', { variant: 'holo', border: 'rainbow', seed: 9, no: 97 })),
  dragon: () => once('pd', () => tcgCard('dragon', { variant: 'holo', border: 'gold', seed: 4, no: 149 })),
  full: () => once('pfa', () => tcgCard('water', { variant: 'full', border: 'silver', seed: 5, no: 88 })),
  fullFire: () => once('pff', () => tcgCard('fire', { variant: 'full', border: 'gold', seed: 13, no: 140 })),
};
const pokeBinderCards = () => once('pbc', () => ['fire', 'water', 'grass', 'volt', 'mystic', 'dragon'].flatMap((t, i) => [
  tcgCard(t, { variant: i % 2 ? 'plain' : 'holo', border: ['silver', 'gold', 'rainbow'][i % 3], seed: 20 + i, no: 10 + i * 7 }),
  tcgCard(t, { variant: 'plain', border: 'silver', seed: 40 + i, no: 60 + i * 5 }),
  tcgCard(t, { variant: i === 2 ? 'full' : 'holo', border: 'silver', seed: 60 + i, no: 100 + i * 3 })]).sort((a, b) => 0));
const pokeSlab = (t, o) => slab(poke[t](), o);
const pokePacks = () => once('ppk', () => fan(['fire', 'water', 'volt', 'mystic'].map((t, i) => pack(tcgPackTheme(t), { seed: 70 + i })), { spread: 11, step: .5, foot: true }));
const sp = {
  soccer: () => once('ss', () => sportsCard('soccer', TEAMS[5], { seed: 3 })),
  hockey: () => once('sh', () => sportsCard('hockey', TEAMS[4], { seed: 5 })),
  auto: () => once('sa', () => sportsCard('basketball', TEAMS[3], { auto: true, seed: 7, serial: '12/50' })),
  patch: () => once('sp', () => sportsCard('football', TEAMS[2], { patch: true, chrome: true, seed: 9, serial: '07/25' })),
  ref: s => once('sr' + s, () => sportsCard(s, TEAMS[{ baseball: 0, basketball: 1, soccer: 5, hockey: 4, football: 2 }[s]], { refractor: true, chrome: true, seed: 30 + s.length })),
};
const sportsBinderCards = () => once('sbc', () => ['basketball', 'baseball', 'football', 'soccer', 'hockey', 'baseball'].flatMap((s, i) => [
  sportsCard(s, TEAMS[i % TEAMS.length], { seed: 80 + i }), sportsCard(s, TEAMS[(i + 2) % TEAMS.length], { refractor: i % 2 === 0, chrome: i % 2 === 0, seed: 90 + i }),
  sportsCard(s, TEAMS[(i + 4) % TEAMS.length], { auto: i === 1 || i === 4, seed: 100 + i })]));
const sportsPacks = () => once('spk', () => fan([pack(waxTheme(TEAMS[1], 'baseball')), pack(chromeTheme(TEAMS[0], 'basketball')), pack(waxTheme(TEAMS[2], 'football')), pack(chromeTheme(TEAMS[3], 'soccer'))], { spread: 11, step: .5, foot: true }));

const MAKE = {
  'ph-poke-card-holo': () => poke.fire(),
  'ph-poke-card-fullart': () => poke.full(),
  'ph-poke-cards-fan': () => fan([poke.grass(), poke.water(), poke.fire(), poke.volt(), poke.mystic()], { spread: 9, step: .24, foot: true }),
  'ph-poke-slab': () => pokeSlab('volt', { title: 'GEM MINT', line1: 'VOLTARA · HOLO', line2: '2025 · NO. 025', grade: '10', band: '#1d3557' }),
  'ph-poke-slabs-trio': () => fan([pokeSlab('fire', { title: 'GEM MINT', line1: 'CINDERFANG · HOLO', line2: '2025 · NO. 006', grade: '10', band: '#1d3557' }),
    once('pfs', () => slab(poke.fullFire(), { title: 'PRISTINE', line1: 'CINDERFANG · FULL ART', line2: '2025 · NO. 140', grade: '10', dark: true, band: '#c9a24a' })),
    pokeSlab('mystic', { title: 'MINT', line1: 'NOCTURNE · RAINBOW', line2: '2025 · NO. 097', grade: '9', band: '#0f766e' })], { spread: 9, step: .56 }),
  'ph-poke-binder': () => binder(pokeBinderCards(), { cover: ['#1f2a5a', '#121a3a', '#26326a'] }),
  'ph-poke-packs-fan': () => pokePacks(),
  'ph-poke-booster-box': () => tcgBox(),
  'ph-poke-collection': () => collection(binder(pokeBinderCards(), { cover: ['#1f2a5a', '#121a3a', '#26326a'] }), pokeSlab('dragon', { title: 'GEM MINT', line1: 'GOLD WYVERN · HOLO', line2: '2025 · NO. 149', grade: '10', band: '#1d3557' }), pokePacks(),
    fan([poke.water(), poke.fire(), poke.volt()], { spread: 10, step: .3, foot: true })),
  'ph-sports-card-soccer': () => sp.soccer(),
  'ph-sports-card-hockey': () => sp.hockey(),
  'ph-sports-card-auto': () => sp.auto(),
  'ph-sports-card-patch': () => sp.patch(),
  'ph-sports-refractor-fan': () => fan(['baseball', 'basketball', 'soccer', 'hockey'].map(s => sp.ref(s)), { spread: 9, step: .3, foot: true }),
  'ph-sports-auto-slab': () => slab(sp.auto(), { title: 'AUTHENTIC', line1: 'ROOKIE AUTOGRAPH · 12/50', line2: '2025 · BASKETBALL', grade: '10', band: '#0f766e' }),
  'ph-sports-slabs-autos': () => fan([slab(sp.ref('baseball'), { title: 'GEM MINT', line1: 'ROOKIE REFRACTOR', line2: '2025 · BASEBALL', grade: '10', band: '#1d3557' }),
    slab(sp.patch(), { title: 'PRISTINE', line1: 'PATCH AUTO · 07/25', line2: '2025 · FOOTBALL', grade: '10', dark: true, band: '#c9a24a' }),
    slab(sp.auto(), { title: 'MINT', line1: 'ROOKIE AUTOGRAPH', line2: '2025 · BASKETBALL', grade: '9', band: '#0f766e' })], { spread: 9, step: .56 }),
  'ph-sports-binder': () => binder(sportsBinderCards(), { cover: ['#2b2b2b', '#151515', '#333333'] }),
  'ph-sports-packs-fan': () => sportsPacks(),
  'ph-sports-hobby-box': () => hobbyBox(),
  'ph-sports-collection': () => collection(binder(sportsBinderCards(), { cover: ['#2b2b2b', '#151515', '#333333'] }), slab(sp.patch(), { title: 'PRISTINE', line1: 'PATCH AUTO · 07/25', line2: '2025 · FOOTBALL', grade: '10', dark: true, band: '#c9a24a' }), sportsPacks(),
    fan([sp.ref('baseball'), sp.auto(), sp.ref('basketball')], { spread: 10, step: .3, foot: true })),
};
window.PICTURES = Object.keys(MAKE);
window.PAINT = id => { const c = fit(MAKE[id](), 1600); return { w: c.width, h: c.height, png: c.toDataURL('image/png') }; };

/* THE CARD LINE'S PHOTOGRAPH GROUNDS, PAINTED (2026-11-23). The two Pokémon grounds the studio stood its card
   ads on were photographs of real graded Charizards at a convention (CC BY-SA, a photographer's mark in the
   corner, the maker's art on every card): a paid ad may carry none of that (DESIGN-LAW 161). These are the same
   scene, painted: a glossy white display table, slabs of no grader on clear stands, a shop blurred behind, so
   the designs laid out over the photographs keep their light where their words stand. */
function cardBack() {
  const W = 700, H = 980, c = mk(W, H), x = c.getContext('2d');
  rr(x, 0, 0, W, H, 34); x.save(); x.clip();
  x.fillStyle = lin(x, 0, 0, W, H, ['#18286a', '#2a48b8', '#16245e']); x.fillRect(0, 0, W, H);
  x.save(); x.translate(W / 2, H / 2); x.globalAlpha = .1; x.fillStyle = '#9fc3ff';
  for (let i = 0; i < 24; i++) { x.rotate(TAU / 24); x.beginPath(); x.moveTo(0, 0); x.lineTo(W, -46); x.lineTo(W, 46); x.closePath(); x.fill(); }
  x.restore();
  x.lineWidth = 22; x.strokeStyle = '#d9b44e'; rr(x, 30, 30, W - 60, H - 60, 22); x.stroke();
  x.beginPath(); x.arc(W / 2, H / 2, 176, 0, TAU); x.fillStyle = 'rgba(255,255,255,.08)'; x.fill(); x.lineWidth = 16; x.strokeStyle = '#d9b44e'; x.stroke();
  star(x, W / 2, H / 2, 128, '#f0cf62');
  x.restore(); return c;
}
const layer = (W, H, draw, blur = 0) => { const c = mk(W, H); draw(c.getContext('2d')); if (!blur) return c; const o = mk(W, H), y = o.getContext('2d'); y.filter = `blur(${blur}px)`; y.drawImage(c, 0, 0); return o; };
/** A clear easel: the plate it stands on and the back that holds it (drawn before the slab), its lip (after). */
function standBack(x, cx, by, w) {
  x.save(); x.beginPath(); x.moveTo(cx - w * .64, by + w * .05); x.lineTo(cx + w * .64, by + w * .05); x.lineTo(cx + w * .5, by - w * .1); x.lineTo(cx - w * .5, by - w * .1); x.closePath();
  x.fillStyle = 'rgba(214,228,242,.32)'; x.fill(); x.lineWidth = 2.5; x.strokeStyle = 'rgba(255,255,255,.85)'; x.stroke();
  x.beginPath(); x.moveTo(cx - w * .2, by - w * .08); x.lineTo(cx - w * .12, by - w * 1.1); x.lineTo(cx + w * .12, by - w * 1.1); x.lineTo(cx + w * .2, by - w * .08); x.closePath();
  x.fillStyle = 'rgba(205,222,240,.2)'; x.fill(); x.strokeStyle = 'rgba(255,255,255,.5)'; x.stroke(); x.restore();
}
function standFront(x, cx, by, w) {
  x.save(); x.fillStyle = 'rgba(232,240,250,.45)'; rr(x, cx - w * .54, by - w * .14, w * 1.08, w * .09, 4); x.fill();
  x.lineWidth = 2; x.strokeStyle = 'rgba(255,255,255,.9)'; x.stroke(); x.restore();
}
/** An empty easel, leaning back, as a shop's display has between its cards. */
function emptyStand(x, cx, by, h, lean) {
  x.save(); x.translate(cx, by); x.transform(1, 0, lean, 1, 0, 0);
  x.beginPath(); x.moveTo(-h * .2, 0); x.lineTo(-h * .16, -h); x.lineTo(h * .16, -h); x.lineTo(h * .2, 0); x.closePath();
  x.fillStyle = lin(x, -h * .2, 0, h * .2, 0, ['rgba(200,215,235,.18)', 'rgba(255,255,255,.42)', 'rgba(190,205,225,.16)']); x.fill();
  x.lineWidth = 3; x.strokeStyle = 'rgba(255,255,255,.8)'; x.stroke(); x.restore();
  standBack(x, cx, by, h * .42); standFront(x, cx, by, h * .42);
}
/** The slab on its easel with its shadow and its reflection in the glossy top. */
function displayed(x, img, cx, by, h, o = {}) {
  const w = h * img.width / img.height, X = cx - w / 2, Y = by - h;
  x.save(); x.filter = 'blur(16px)'; x.fillStyle = 'rgba(40,36,32,.22)'; x.beginPath(); x.ellipse(cx, by + h * .012, w * .62, h * .035, 0, 0, TAU); x.fill(); x.restore();
  const r = mk(w, h * .4), y = r.getContext('2d');
  y.save(); y.translate(0, h); y.scale(1, -1); y.drawImage(img, 0, 0, w, h); y.restore();
  y.globalCompositeOperation = 'destination-in'; y.fillStyle = lin(y, 0, 0, 0, h * .4, ['rgba(0,0,0,.32)', 'rgba(0,0,0,0)']); y.fillRect(0, 0, w, h * .4);
  const sw = w * .9;
  x.save(); x.filter = `blur(${2 + (o.blur || 0)}px)`; x.drawImage(r, X, by + h * .02); x.restore();
  const body = layer(w + 40, h + 40, z => { standBack(z, w / 2 + 20, h + 20 + h * .015, sw * .55); z.drawImage(img, 20, 20, w, h); standFront(z, w / 2 + 20, h + 20 + h * .03, sw * .55); }, o.blur || 0);
  x.drawImage(body, X - 20, Y - 20);
}
function displayScene(v) {
  const W = 1920, H = 1280, c = mk(W, H), x = c.getContext('2d'), R = rng(v.seed);
  // the shop behind, out of focus
  const shop = layer(W, H, b => {
    b.fillStyle = lin(b, 0, 0, 0, H, v.wall); b.fillRect(0, 0, W, H);
    b.fillStyle = lin(b, 0, 0, W * v.pillar[0], 0, v.pillar[1]); b.fillRect(0, 0, W * v.pillar[0], H * .8);
    for (const [px, py, pw, ph, col] of v.boxes) { b.fillStyle = col; b.fillRect(px * W, py * H, pw * W, ph * H); }
  }, 30);
  x.drawImage(shop, 0, 0);
  x.drawImage(layer(W, H, b => {
    for (let i = 0; i < v.dots.n; i++) { const bx = (v.dots.x0 + R() * (v.dots.x1 - v.dots.x0)) * W, by = (.04 + R() * .4) * H, br = 12 + R() * 34;
      b.globalAlpha = .25 + R() * .45; b.fillStyle = v.dots.cols[Math.floor(R() * v.dots.cols.length)]; b.beginPath(); b.arc(bx, by, br, 0, TAU); b.fill(); }
  }, 5), 0, 0);
  // the glossy white display top
  const top = H * v.top, cx = W * v.tcx, rx = W * v.rx, ry = H * .66, cy = top + ry;
  x.save(); x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, TAU); x.clip();
  x.fillStyle = lin(x, 0, top, 0, H, v.table); x.fillRect(0, 0, W, H);
  // a glossy top mirrors the shop, faintly and softly, and the ceiling's lights in rows
  x.save(); x.globalAlpha = .1; x.filter = 'blur(10px)'; x.translate(0, 2 * top); x.scale(1, -1); x.drawImage(shop, 0, 0); x.restore();
  x.filter = 'blur(7px)';
  for (const [lx, ly, lw, lh, a] of v.glints) { x.globalAlpha = a; x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(lx * W, ly * H, lw * W, lh * H, 0, 0, TAU); x.fill(); }
  for (const [ry0, n, rw, rh, ra] of v.rows || []) for (let i = 0; i < n; i++) { x.globalAlpha = ra * (.7 + R() * .3); x.beginPath(); x.ellipse((.18 + i * .74 / Math.max(1, n - 1) + (R() - .5) * .04) * W, ry0 * H, rw * W, rh * H, 0, 0, TAU); x.fill(); }
  x.globalAlpha = .5; x.filter = 'blur(40px)'; x.fillStyle = v.spill; x.beginPath(); x.ellipse(W * .5, top + H * .05, W * .5, H * .06, 0, 0, TAU); x.fill();
  x.restore();
  x.save(); x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, TAU); x.lineWidth = 5; x.strokeStyle = 'rgba(110,104,98,.32)'; x.stroke();
  x.beginPath(); x.ellipse(cx, cy + 7, rx, ry, 0, Math.PI * 1.05, Math.PI * 1.95); x.lineWidth = 3; x.strokeStyle = 'rgba(255,255,255,.7)'; x.stroke(); x.restore();
  // what stands on it, back to front: the far ones softer
  for (const it of v.items) {
    if (it.kind === 'stand') emptyStand(x, it.x * W, it.y * H, it.h * H, it.lean || -.12);
    else displayed(x, it.img(), it.x * W, it.y * H, it.h * H, { blur: it.blur || 0 });
  }
  // the lens: a little light fall-off and grain
  const g = x.createRadialGradient(W * .52, H * .56, H * .35, W * .52, H * .56, W * .78); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${v.vignette})`);
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const id = x.getImageData(0, 0, W, H), d = id.data; for (let i = 0; i < d.length; i += 4) { const n = (R() - .5) * 9; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  x.putImageData(id, 0, 0);
  return c;
}
const backSlab = () => once('bks', () => slab(cardBack(), { title: 'GEM MINT', line1: 'CARD BACK · 1ST EDITION', line2: '2025 · NO. 001', grade: '10', band: '#1d3557' }));
const SCENES = {
  'pokemon-slabs-display-1': () => displayScene({ seed: 61, top: .5, tcx: .58, rx: .7, vignette: .22,
    wall: ['#3b352f', '#5a5149', '#7d7268'], pillar: [.24, ['#7d7771', '#5f5a55']],
    rows: [[.6, 5, .022, .007, .85], [.7, 4, .03, .009, .7]],
    boxes: [[.4, 0, .34, .13, 'rgba(236,236,232,.92)'], [.52, .16, .22, .05, 'rgba(255,238,205,.55)'], [.63, .22, .04, .14, 'rgba(70,190,90,.75)'],
      [.46, .21, .035, .1, 'rgba(235,140,60,.6)'], [.3, .1, .03, .09, 'rgba(60,160,225,.65)'], [.8, .05, .2, .35, 'rgba(30,28,26,.7)']],
    dots: { n: 22, x0: .26, x1: 1, cols: ['#ffe6c0', '#fff4dc', '#ffd59a', '#f5f5f0'] },
    table: ['#f4f1ed', '#ebe7e2', '#d6d1cb'], spill: 'rgba(120,112,104,.35)',
    glints: [[.36, .62, .05, .012, .8], [.52, .66, .06, .012, .75], [.76, .63, .05, .012, .7], [.6, .9, .12, .03, .35]],
    items: [{ kind: 'stand', x: .11, y: .7, h: .23, lean: -.18 },
      { img: backSlab, x: .33, y: .55, h: .3, blur: 3 },
      { img: () => pokeSlab('fire', { title: 'GEM MINT', line1: 'CINDERFANG · HOLO', line2: '2025 · NO. 006', grade: '10', band: '#b3261e' }), x: .55, y: .76, h: .52 }] }),
  'pokemon-slabs-display-2': () => displayScene({ seed: 83, top: .42, tcx: .6, rx: .74, vignette: .18,
    wall: ['#4a423c', '#6d635b', '#8f857c'], pillar: [.3, ['#a0968e', '#7f766f']],
    rows: [[.52, 5, .025, .008, .9], [.62, 4, .034, .01, .75]],
    boxes: [[.62, 0, .38, .3, 'rgba(24,22,20,.85)'], [.66, .04, .1, .1, 'rgba(240,160,70,.7)'], [.8, .02, .04, .16, 'rgba(70,190,90,.8)'],
      [.5, .02, .1, .06, 'rgba(255,245,225,.8)'], [.88, .2, .12, .08, 'rgba(255,215,150,.55)']],
    dots: { n: 26, x0: .5, x1: 1, cols: ['#ffcf8a', '#ffe9c6', '#ff9f5a', '#d8f5c0'] },
    table: ['#f8f6f3', '#eeebe7', '#dcd7d1'], spill: 'rgba(130,120,110,.3)',
    glints: [[.42, .55, .06, .012, .85], [.58, .58, .07, .012, .8], [.84, .56, .05, .012, .7], [.5, .86, .16, .035, .4]],
    items: [{ kind: 'stand', x: .31, y: .66, h: .27, lean: -.16 },
      { img: backSlab, x: .5, y: .5, h: .3, blur: 3 },
      { img: () => slab(poke.fullFire(), { title: 'GEM MINT', line1: 'CINDERFANG · FULL ART', line2: '2025 · NO. 140', grade: '10', band: '#b3261e' }), x: .62, y: .74, h: .54 }] }),
};
window.SCENE_IDS = Object.keys(SCENES);
/* the scene at 1920x1280, and the offer card's ground cut from its centre at 1080 with p90, the 90th percentile
   luminance of its upper two thirds (scripts/make_offer_grounds.py's measure, where a headline stands) */
window.SCENE = id => {
  const c = SCENES[id](), o = mk(1080, 1080), y = o.getContext('2d'), s = Math.min(c.width, c.height);
  y.imageSmoothingQuality = 'high'; y.drawImage(c, (c.width - s) / 2, (c.height - s) / 2, s, s, 0, 0, 1080, 1080);
  const d = y.getImageData(0, 0, 1080, 720).data, L = [];
  for (let i = 0; i < d.length; i += 4) L.push(.299 * d[i] + .587 * d[i + 1] + .114 * d[i + 2]);
  L.sort((a, b) => a - b);
  return { jpg: c.toDataURL('image/jpeg', .9), offer: o.toDataURL('image/jpeg', .88), p90: Math.round(L[Math.floor(L.length * .9)]) };
};
})();
