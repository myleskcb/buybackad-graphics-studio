// THE OWNER'S NEW STYLES (2026-11-18): twelve grounds and three signs, painted here and drawn like
// every other theme's (decor.js themeGround and themeBoard hand them on). The owner: "can we make more
// of our own custom styles?", "some GTA or LA style?", "or more beach and island style?", "colorful of
// course? we could make a hand generated / apple style / commercial style / avant garde backgrounds".
//
// LA & coast: golden hour over a freeway, a night drive, a boulevard under a billboard, a skyline
// poster; a tiki bar's bamboo, a surf shop's stripes and waves, tropical leaves, cabana stripes. Art &
// studio: paint by hand, soft colour glows, a coloured studio sweep, bold abstract shapes. Each is the
// setting and the era, never a copy of one game's or one brand's art: no logo, no lettering of theirs,
// no characters, no wallpaper of theirs (the LA looks are LA's own: the palms, the overpasses, the sky).
//
// Every ground is drawn in its palette's colours (themes.js THEME_PALETTES: sky, sil, sun, lamp, paint,
// blobs, gels, shapes, leaves, stripes where a ground needs more than the six roles), keeps the busiest
// of what it draws toward the frame's edges and corners, and leaves its middle calm, where the words
// and the product stand; the full ad evens the ground under a small line where it must (rule 158).
import { canvas, rgba, mix, lum, noiseTile } from "./engine.js";

const TAU = Math.PI * 2;
const shade = (h, k) => mix(h, k < 0 ? "#000000" : "#ffffff", Math.abs(k));
const pickOf = (r, a) => a[Math.floor(r() * a.length) % a.length];

function grain(x, W, H, r, amp = 22, alpha = .3) {
  const n = noiseTile(256, (r() * 1e6) | 0, amp);
  x.save(); x.globalAlpha = alpha; x.fillStyle = x.createPattern(n, "repeat"); x.fillRect(0, 0, W, H); x.restore();
}
/** A vertical gradient through the colours given, evenly spaced from y0 to y1. */
function vgrad(x, y0, y1, stops) { const g = x.createLinearGradient(0, y0, 0, y1); stops.forEach((c, i) => g.addColorStop(i / Math.max(1, stops.length - 1), c)); return g; }
/** A soft round light of col at (cx, cy), a at its middle. */
function glow(x, cx, cy, R, col, a) { const g = x.createRadialGradient(cx, cy, 0, cx, cy, R); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); x.fillStyle = g; x.fillRect(cx - R, cy - R, R * 2, R * 2); }

/** A palm in silhouette: a curved trunk from (bx, by), h tall, leaning, its fronds drooping from the top. */
function palm(x, bx, by, h, lean, col, r) {
  x.save(); x.fillStyle = col;
  const tx = bx + lean * h, ty = by - h, tw = h * .026;
  x.beginPath(); x.moveTo(bx - tw, by); x.quadraticCurveTo(bx + lean * h * .25, by - h * .55, tx - tw * .45, ty);
  x.lineTo(tx + tw * .45, ty); x.quadraticCurveTo(bx + lean * h * .25 + tw * 1.6, by - h * .55, bx + tw, by); x.closePath(); x.fill();
  const n = 7 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i / (n - 1) - .5) * Math.PI * 1.55 + (r() - .5) * .25, L = h * (.3 + r() * .14);
    const ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * .55 + L * .32, cx = tx + Math.cos(a) * L * .55, cy = ty + Math.sin(a) * L * .55 - L * .14;
    const nx = -Math.sin(a), ny = Math.cos(a), w = L * .1;
    x.beginPath(); x.moveTo(tx, ty); x.quadraticCurveTo(cx - nx * w, cy - ny * w, ex, ey); x.quadraticCurveTo(cx + nx * w, cy + ny * w, tx, ty); x.fill();
  }
  x.beginPath(); x.arc(tx, ty, tw * 1.6, 0, TAU); x.fill();
  x.restore();
}
/** Palms on both edges of the frame, standing on its foot. */
function palmsAt(x, W, H, col, r, n = 2) {
  for (let i = 0; i < n; i++) {
    const left = i % 2 === 0, h = H * (.5 + r() * .26) * (W / H < .85 ? .7 : 1);
    palm(x, left ? W * (.01 + r() * .1) : W * (.89 + r() * .1), H * 1.01, h, (left ? 1 : -1) * (.05 + r() * .14), col, r);
  }
}
/** A city in silhouette standing on base, taller toward a centre; lit: a few windows in that colour. */
function city(x, W, H, base, col, r, lit) {
  let px = -W * .02; const center = W * (.3 + r() * .4);
  while (px < W * 1.02) {
    const bw = W * (.03 + r() * .05), near = 1 - Math.min(1, Math.abs(px - center) / (W * .4));
    const bh = H * (.04 + r() * .05 + near * (.05 + r() * .16));
    x.fillStyle = col; x.fillRect(px, base - bh, bw + 1, bh + 2);
    if (bh > H * .13 && r() < .4) x.fillRect(px + bw * .45, base - bh - H * .035, Math.max(2, bw * .07), H * .035);
    if (lit) for (let wy = base - bh + H * .014; wy < base - H * .012; wy += H * .018) for (let wx = px + bw * .16; wx < px + bw * .84; wx += bw * .23) {
      if (r() < .22) { x.fillStyle = rgba(lit, .5 + r() * .4); x.fillRect(wx, wy, Math.max(1.5, bw * .09), Math.max(1.5, H * .006)); }
    }
    px += bw + W * .002;
  }
}

/** The new grounds (THEME_GROUNDS in themes.js). Returns false for any other kind. */
export function styleGround(kind, x, st, p, W, H, sc, r) {
  const U = Math.min(W, H), D = Math.hypot(W, H), sky = p.sky || [p.ground, mix(p.ground, p.plate, .5), p.plate, p.accent], sil = p.sil || shade(p.ground, -.55);
  switch (kind) {
    case "golden_hour": {
      // the sky going gold over a freeway overpass, the sun in its haze, palms on the edges
      x.fillStyle = vgrad(x, 0, H * .76, sky); x.fillRect(0, 0, W, H);
      const sun = p.sun || p.accent, sx = W * (.36 + r() * .28), sy = H * .62, R = U * .16;
      glow(x, sx, sy, R * 3.4, sun, .42);
      x.fillStyle = sun; x.beginPath(); x.arc(sx, sy, R, 0, TAU); x.fill();
      for (let i = 0; i < 6; i++) { x.fillStyle = rgba(sky[2], .92); x.fillRect(sx - R * 1.1, sy + R * (.12 + i * .15), R * 2.2, Math.max(2, R * (.02 + i * .013))); }
      x.fillStyle = mix(sil, sky[2], .42); x.beginPath(); x.moveTo(0, H * .7); for (let k = 0; k <= 9; k++) x.lineTo(W * k / 9, H * (.66 + r() * .05)); x.lineTo(W, H); x.lineTo(0, H); x.fill();
      const dy = H * .75, dh = H * .034;
      x.fillStyle = sil; x.fillRect(0, dy, W, dh); x.fillRect(0, dy - dh * .45, W, Math.max(2, dh * .2));
      for (let k = 0; k < 8; k++) x.fillRect(W * (.04 + k * .135 + (r() - .5) * .02), dy + dh, W * .024, H - dy);
      for (let i = 0; i < 3; i++) { x.fillStyle = rgba(i % 2 ? "#ff3b3b" : "#fff2c4", .55); x.fillRect(0, dy + dh * (.28 + i * .22), W, Math.max(1.5, dh * .08)); }
      x.fillStyle = sil; x.fillRect(0, H * .92, W, H * .08);
      palmsAt(x, W, H, sil, r, 2 + (r() < .5 ? 1 : 0));
      grain(x, W, H, r, 18, .22); return true;
    }
    case "night_drive": {
      // a boulevard at night running to the horizon, streetlights down both sides, their light on the wet road
      const hz = H * .55, vx = W * (.42 + r() * .16), lamp = p.lamp || "#ffcf6b";
      x.fillStyle = vgrad(x, 0, hz, [p.ground, mix(p.ground, p.accent, .32)]); x.fillRect(0, 0, W, hz);
      glow(x, vx, hz, W * .6, p.accent, .32);
      city(x, W, H, hz, shade(p.ground, -.3), r, lamp);
      x.fillStyle = vgrad(x, hz, H, [shade(p.ground, -.25), shade(p.ground, -.62)]); x.fillRect(0, hz, W, H - hz);
      x.fillStyle = rgba(shade(p.ground, -.75), .9);
      x.beginPath(); x.moveTo(vx - W * .015, hz); x.lineTo(vx + W * .015, hz); x.lineTo(W * 1.25, H); x.lineTo(-W * .25, H); x.closePath(); x.fill();
      for (let k = 0; k < 9; k++) {
        const d = (k + 1) / 9, y = hz + (H - hz) * d * d, half = (W * .015 + W * .7 * d * d);
        const ph = H * (.03 + .32 * d * d), lw = Math.max(1.5, U * .008 * d);
        for (const side of [-1, 1]) {
          const px = vx + side * half;
          x.fillStyle = rgba(shade(p.ground, -.7), 1); x.fillRect(px - lw / 2, y - ph, lw, ph);
          glow(x, px, y - ph, U * (.02 + .09 * d), lamp, .85);
          const rg = x.createLinearGradient(0, y, 0, Math.min(H, y + (H - hz) * .5 * d + U * .05)); rg.addColorStop(0, rgba(lamp, .35)); rg.addColorStop(1, rgba(lamp, 0));
          x.fillStyle = rg; x.fillRect(px - U * .02 * d - 2, y, U * .04 * d + 4, (H - hz) * .5 * d + U * .05);
        }
        if (k % 2 === 0) { x.fillStyle = rgba(p.plate || "#ffd23f", .7); const dw = Math.max(2, U * .006 * d * 2); x.fillRect(vx - dw / 2, y, dw, (H - hz) * .06 * d + 2); }
      }
      grain(x, W, H, r, 16, .2); return true;
    }
    case "boulevard": {
      // a boulevard under a big sky: palms down the edges, a row of low shops with their awnings at the foot
      x.fillStyle = vgrad(x, 0, H * .8, sky); x.fillRect(0, 0, W, H);
      const sun = p.sun || p.accent; glow(x, W * (.25 + r() * .5), H * .7, U * .55, sun, .5);
      const base = H * .86; x.fillStyle = sil; x.fillRect(0, base, W, H - base);
      let px = -W * .02;
      while (px < W) {
        const bw = W * (.1 + r() * .08), bh = H * (.05 + r() * .05);
        x.fillStyle = shade(sil, r() * .12); x.fillRect(px, base - bh, bw - W * .004, bh + 1);
        x.fillStyle = pickOf(r, [p.accent, p.plate, mix(p.plate, "#ffffff", .3)]); x.fillRect(px + bw * .08, base - bh * .62, bw * .8, Math.max(3, bh * .14));
        px += bw;
      }
      palmsAt(x, W, H, sil, r, 3);
      grain(x, W, H, r, 16, .2); return true;
    }
    case "skyline_poster": {
      // the downtown skyline and palms under a big gradient sky, the sun going down behind them
      x.fillStyle = vgrad(x, 0, H * .82, sky); x.fillRect(0, 0, W, H);
      const sun = p.sun || p.accent, sx = W * (.35 + r() * .3), sy = H * .66, R = U * .2;
      glow(x, sx, sy, R * 3, sun, .38); x.fillStyle = rgba(sun, .95); x.beginPath(); x.arc(sx, sy, R, 0, TAU); x.fill();
      city(x, W, H, H * .84, mix(sil, sky[1], .25), r, null);
      city(x, W, H, H * .88, sil, r, sun);
      x.fillStyle = sil; x.fillRect(0, H * .88, W, H * .12);
      palmsAt(x, W, H, shade(sil, -.3), r, 2);
      grain(x, W, H, r, 18, .24); return true;
    }
    case "bamboo": {
      // a tiki bar's wall of bamboo canes, their nodes, a lamp's warm light in the middle
      x.fillStyle = shade(p.ground, -.45); x.fillRect(0, 0, W, H);
      let px = -U * .02;
      while (px < W) {
        const w = U * (.055 + r() * .04), c = r() < .5 ? p.ground : p.light;
        const g = x.createLinearGradient(px, 0, px + w, 0);
        g.addColorStop(0, shade(c, -.38)); g.addColorStop(.32, shade(c, .18)); g.addColorStop(.55, c); g.addColorStop(1, shade(c, -.5));
        x.fillStyle = g; x.fillRect(px, 0, w, H);
        for (let ny = r() * U * .2; ny < H; ny += U * (.16 + r() * .12)) {
          x.fillStyle = rgba(shade(c, -.6), .85); x.fillRect(px, ny, w, Math.max(2, U * .009));
          x.fillStyle = rgba(shade(c, .4), .5); x.fillRect(px, ny + U * .009, w, Math.max(1, U * .004));
        }
        px += w + U * .004;
      }
      glow(x, W / 2, H * .45, D * .45, p.accent, .2);
      grain(x, W, H, r, 22, .3); return true;
    }
    case "surf_sunset": {
      // a surf shop's stripes: bands of sunset colour running out of a corner, waves along the foot
      x.fillStyle = vgrad(x, 0, H, [p.light, p.ground]); x.fillRect(0, 0, W, H);
      const bands = p.stripes || [p.accent, p.plate, mix(p.plate, p.accent, .5), "#ffffff"], left = r() < .5;
      const ox = left ? -W * .1 : W * 1.1, oy = H * .08, bw = U * .07;
      bands.forEach((c, i) => {
        x.strokeStyle = c; x.lineWidth = bw; x.lineCap = "butt";
        x.beginPath(); x.arc(ox, oy, U * .5 + i * bw * 1.05, left ? 0 : Math.PI * .5, left ? Math.PI * .5 : Math.PI); x.stroke();
      });
      for (let k = 0; k < 3; k++) {
        const y = H * (.84 + k * .055), amp = U * .025, wl = U * (.16 - k * .02);
        x.fillStyle = k === 0 ? mix(p.ground, "#ffffff", .55) : k === 1 ? shade(p.ground, -.08) : shade(p.ground, -.22);
        x.beginPath(); x.moveTo(0, H);
        for (let xx = -wl; xx <= W + wl; xx += wl) { x.lineTo(xx, y); x.quadraticCurveTo(xx + wl * .25, y - amp * 1.6, xx + wl * .5, y - amp * .2); x.quadraticCurveTo(xx + wl * .75, y + amp * .6, xx + wl, y); }
        x.lineTo(W, H); x.closePath(); x.fill();
      }
      grain(x, W, H, r, 16, .18); return true;
    }
    case "tropical": {
      // big tropical leaves round the frame's edges, the middle left bright
      x.fillStyle = vgrad(x, 0, H, [p.light, p.ground]); x.fillRect(0, 0, W, H);
      const greens = p.leaves || ["#0f5132", "#1f7a4d", "#2e9e62"];
      const spots = [[0, 0, .2], [W, 0, Math.PI - .2], [0, H, -.4], [W, H, Math.PI + .4]];   // the corners only: a leaf at a side ran behind a small line
      for (const [cx, cy, a0] of spots) {
        const n = 2 + Math.floor(r() * 2);
        for (let i = 0; i < n; i++) {
          const a = a0 + (r() - .5) * .9, L = U * (.2 + r() * .14), col = pickOf(r, greens);
          if (r() < .5) monstera(x, cx, cy, a, L, col, r); else frond(x, cx, cy, a, L, col, r);
        }
      }
      grain(x, W, H, r, 14, .16); return true;
    }
    case "cabana": {
      // a cabana's wide stripes, an awning's scalloped edge across the top, the sun in a corner
      const n = W / H > 1.2 ? 12 : 8, sw = W / n;
      for (let i = 0; i < n; i++) {
        const g = x.createLinearGradient(i * sw, 0, (i + 1) * sw, 0), c = i % 2 ? p.light : p.ground;
        g.addColorStop(0, shade(c, -.05)); g.addColorStop(.5, c); g.addColorStop(1, shade(c, -.07));
        x.fillStyle = g; x.fillRect(i * sw, 0, sw + 1, H);
      }
      const aw = p.awning || p.accent, ah = U * .06, sc2 = U * .07;
      x.fillStyle = aw; x.fillRect(0, 0, W, ah);
      for (let xx = 0; xx < W + sc2; xx += sc2 * 2) { x.beginPath(); x.arc(xx + sc2, ah, sc2, 0, Math.PI); x.fill(); }
      x.fillStyle = "#ffffff"; x.fillRect(0, ah * .78, W, Math.max(2, ah * .08));
      const sun = p.sun || "#ffc93c", corner = r() < .5; glow(x, corner ? 0 : W, H, U * .55, sun, .35);
      x.fillStyle = sun; x.beginPath(); x.arc(corner ? 0 : W, H, U * .2, 0, TAU); x.fill();
      grain(x, W, H, r, 14, .16); return true;
    }
    case "brush_paint": {
      // paint by hand on paper: broad brush strokes in the palette's paints, bristle marks and a few spatters
      x.fillStyle = p.ground; x.fillRect(0, 0, W, H);
      const paints = p.paint || [p.accent, p.plate, p.light], n = 5 + Math.floor(r() * 2);
      for (let i = 0; i < n; i++) brush(x, W, H, U, pickOf(r, paints), r, i);
      grain(x, W, H, r, 24, .3); return true;
    }
    case "soft_blobs": {
      // big soft fields of colour melting into each other over a clean ground, lit like glass
      x.fillStyle = p.ground; x.fillRect(0, 0, W, H);
      const cols = p.blobs || [p.accent, p.plate, p.light], k = 10, small = canvas(Math.ceil(W / k), Math.ceil(H / k)), sx = small.getContext("2d");
      const dark = lum(p.ground) < .3;
      // on a dark ground the colours add up as light does (screen), larger and fuller, so it glows as the light one does
      if (dark) sx.globalCompositeOperation = "screen";
      for (let i = 0; i < (dark ? 7 : 6); i++) {
        const edge = i % 2 === 0, ax = edge ? (r() < .5 ? r() * .3 : .7 + r() * .3) : .2 + r() * .6, ay = edge ? r() : (r() < .5 ? r() * .25 : .75 + r() * .25);
        const R = U * (dark ? .36 + r() * .28 : .28 + r() * .26) / k, c = pickOf(r, cols), g = sx.createRadialGradient(ax * W / k, ay * H / k, 0, ax * W / k, ay * H / k, R);
        g.addColorStop(0, rgba(c, dark ? 1 : .9)); g.addColorStop(.6, rgba(c, dark ? .55 : .5)); g.addColorStop(1, rgba(c, 0));
        sx.fillStyle = g; sx.fillRect(0, 0, small.width, small.height);
      }
      x.save(); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high"; x.drawImage(small, 0, 0, W, H); x.restore();
      const sheen = x.createLinearGradient(0, 0, W, H); sheen.addColorStop(0, rgba("#ffffff", dark ? .05 : .22)); sheen.addColorStop(.5, rgba("#ffffff", 0)); sheen.addColorStop(1, rgba("#ffffff", dark ? .03 : .12));
      x.fillStyle = sheen; x.fillRect(0, 0, W, H);
      grain(x, W, H, r, 10, .14); return true;
    }
    case "color_studio": {
      // a product shoot: a seamless sweep in one strong colour, two coloured lights on it, a pool of light on the floor
      x.fillStyle = vgrad(x, 0, H, [shade(p.ground, -.12), p.ground, shade(p.ground, .1), shade(p.ground, .22)]); x.fillRect(0, 0, W, H);
      const gels = p.gels || [p.accent, p.plate];
      glow(x, W * .12, H * .3, U * .75, gels[0], .5); glow(x, W * .88, H * .28, U * .7, gels[1] || gels[0], .45);
      const fy = sc ? sc[1] : H * .62, fx = sc ? sc[0] : W / 2;
      x.save(); x.translate(fx, Math.min(H * .92, fy + U * .18)); x.scale(1, .28); glow(x, 0, 0, U * .55, shade(p.ground, .45), .55); x.restore();
      const vg = x.createRadialGradient(W / 2, H / 2, U * .35, W / 2, H / 2, D * .62); vg.addColorStop(0, rgba("#000000", 0)); vg.addColorStop(1, rgba("#000000", .22));
      x.fillStyle = vg; x.fillRect(0, 0, W, H);
      grain(x, W, H, r, 12, .16); return true;
    }
    case "bold_shapes": {
      // bold abstract shapes in flat colour round the frame's edges: a disc, a half moon, a band, a block, a ring, dots
      x.fillStyle = p.ground; x.fillRect(0, 0, W, H);
      const cols = (p.shapes || [p.accent, p.plate, p.ink]).slice();
      const take = () => cols.length ? cols.splice(Math.floor(r() * cols.length) % cols.length, 1)[0] : p.accent;
      const corners = [[0, 0], [W, 0], [0, H], [W, H]].sort(() => r() - .5);
      x.fillStyle = take(); x.beginPath(); x.arc(corners[0][0], corners[0][1], U * (.34 + r() * .12), 0, TAU); x.fill();
      x.fillStyle = take(); x.beginPath(); const [hx, hy] = corners[1]; x.arc(hx === 0 ? W * .5 : W * .5, hy, U * .22, hy === 0 ? 0 : Math.PI, hy === 0 ? Math.PI : TAU); x.fill();
      x.save(); x.translate(corners[2][0], corners[2][1]); x.rotate(corners[2][0] === 0 ? -Math.PI / 4 : Math.PI / 4); x.fillStyle = take(); x.fillRect(-U * .6, -U * .06, U * 1.2, U * .12); x.restore();
      const bx = corners[3][0] === 0 ? 0 : W - U * .2, by = corners[3][1] === 0 ? 0 : H - U * .3; x.fillStyle = take(); x.fillRect(bx, by, U * .2, U * .3);
      x.strokeStyle = p.ink; x.lineWidth = U * .014; x.beginPath(); x.arc(corners[3][0] === 0 ? U * .32 : W - U * .32, corners[3][1] === 0 ? U * .22 : H - U * .22, U * .09, 0, TAU); x.stroke();
      x.fillStyle = rgba(p.ink, .8); const gx0 = corners[0][0] === 0 ? W - U * .26 : U * .06, gy0 = H * .42;
      for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) { x.beginPath(); x.arc(gx0 + i * U * .045, gy0 + j * U * .045, U * .007, 0, TAU); x.fill(); }
      grain(x, W, H, r, 20, .22); return true;
    }
  }
  return false;
}

/** A monstera leaf from (cx, cy) toward angle a, L long: a broad heart, its splits cut in, its midrib drawn. */
function monstera(x, cx, cy, a, L, col, r) {
  const c = canvas(Math.ceil(L * 2.2), Math.ceil(L * 2.2)), s = c.getContext("2d"), o = L * 1.1;
  s.translate(o, o); s.rotate(a);
  s.fillStyle = col; s.beginPath(); s.moveTo(0, 0);
  s.bezierCurveTo(L * .25, -L * .55, L * .95, -L * .5, L * 1.02, 0); s.bezierCurveTo(L * .95, L * .5, L * .25, L * .55, 0, 0); s.fill();
  s.globalCompositeOperation = "destination-out";
  for (let k = 0; k < 6; k++) { const t = .22 + k * .12, side = k % 2 ? 1 : -1; s.beginPath(); s.moveTo(L * t, side * L * .07); s.lineTo(L * (t + .1), side * L * .6); s.lineTo(L * (t + .16), side * L * .6); s.lineTo(L * (t + .05), side * L * .07); s.fill(); }
  s.globalCompositeOperation = "source-over"; s.strokeStyle = shade(col, .25); s.lineWidth = Math.max(1.5, L * .018); s.beginPath(); s.moveTo(0, 0); s.lineTo(L * .98, 0); s.stroke();
  x.drawImage(c, cx - o, cy - o);
}
/** A palm frond from (cx, cy) toward angle a, L long: a curved midrib with leaflets down both sides. */
function frond(x, cx, cy, a, L, col, r) {
  x.save(); x.translate(cx, cy); x.rotate(a); x.strokeStyle = col; x.lineCap = "round";
  const bend = L * (.12 + r() * .1);
  x.lineWidth = Math.max(2, L * .02); x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(L * .5, -bend, L, bend * .2); x.stroke();
  for (let k = 1; k < 22; k++) {
    const t = k / 22, px = L * t, py = -bend * 4 * t * (1 - t) + bend * .2 * t * t, len = L * .28 * Math.sin(Math.PI * Math.min(1, t * 1.1));
    x.lineWidth = Math.max(1.5, L * .03 * (1 - t * .5));
    for (const side of [-1, 1]) { x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + len * .3, py + side * len * .5, px + len * .55, py + side * len); x.stroke(); }
  }
  x.restore();
}
/** One brush stroke across part of the frame, its bristle marks, a few spatters: kept toward an edge. */
function brush(x, W, H, U, col, r, i) {
  const edge = i % 4, w = U * (.07 + r() * .07);
  const pts = edge === 0 ? [[-.05, .08 + r() * .2], [.5, -.02 + r() * .14], [1.05, .06 + r() * .2]]
    : edge === 1 ? [[-.05, .78 + r() * .16], [.45, .86 + r() * .12], [1.05, .8 + r() * .16]]
    : edge === 2 ? [[.06 + r() * .14, -.05], [-.02 + r() * .12, .5], [.08 + r() * .14, 1.05]]
    : [[.86 + r() * .1, -.05], [.92 + r() * .1, .5], [.84 + r() * .12, 1.05]];
  const P = pts.map(([u, v]) => [u * W, v * H]);
  x.save(); x.lineCap = "round"; x.lineJoin = "round"; x.strokeStyle = rgba(col, .92); x.lineWidth = w;
  x.beginPath(); x.moveTo(...P[0]); x.quadraticCurveTo(...P[1], ...P[2]); x.stroke();
  for (let k = 0; k < 14; k++) {
    const off = (k / 13 - .5) * w * .95, a = r() < .5 ? .25 : .55;
    x.strokeStyle = rgba(k % 3 ? shade(col, -.18) : shade(col, .25), a * .6); x.lineWidth = Math.max(1, w * .03);
    const dx = (P[2][1] - P[0][1]), dy = -(P[2][0] - P[0][0]), n = Math.hypot(dx, dy) || 1, ox = dx / n * off, oy = dy / n * off;
    x.beginPath(); x.moveTo(P[0][0] + ox, P[0][1] + oy); x.quadraticCurveTo(P[1][0] + ox, P[1][1] + oy, P[2][0] + ox, P[2][1] + oy); x.stroke();
  }
  x.fillStyle = rgba(col, .85);
  for (let k = 0; k < 10; k++) { const t = r(), bx = (1 - t) * (1 - t) * P[0][0] + 2 * (1 - t) * t * P[1][0] + t * t * P[2][0], by = (1 - t) * (1 - t) * P[0][1] + 2 * (1 - t) * t * P[1][1] + t * t * P[2][1]; x.beginPath(); x.arc(bx + (r() - .5) * w * 2.4, by + (r() - .5) * w * 2.4, U * (.003 + r() * .008), 0, TAU); x.fill(); }
  x.restore();
}

/** The new signs (THEME_BOARDS in themes.js): the face of the room for the words is w by h at (ox, oy)
 *  in the canvas returned; B takes the sign's tilt, posts and lamps. Returns null for any other kind. */
export function styleBoard(kind, w, h, s, p, st, r, extra, B) {
  const m = s * .6, shadow = (x, k = 1) => { x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = s * .28 * k; x.shadowOffsetY = s * .09 * k; };
  let c, ox = m, oy = m, x;
  switch (kind) {
    case "billboard": {
      // a roadside billboard: a steel frame round a cream face, a catwalk under it, posts and lamps (the full ad hangs it without them)
      const cat = s * .32; c = canvas(w + m * 2, h + m * 2 + cat); x = c.getContext("2d");
      const b = s * .12;
      x.save(); shadow(x); x.fillStyle = "#3b3f45"; x.fillRect(ox - b, oy - b, w + b * 2, h + b * 2); x.restore();
      const face = x.createLinearGradient(0, oy, 0, oy + h); face.addColorStop(0, "#fffdf6"); face.addColorStop(1, "#efe9db");
      x.fillStyle = face; x.fillRect(ox, oy, w, h);
      x.fillStyle = "#2c3036"; x.fillRect(ox - b, oy + h + b + cat * .45, w + b * 2, Math.max(2, cat * .14));
      for (let k = 0; k <= 8; k++) x.fillRect(ox - b + (w + b * 2) * k / 8 - 1, oy + h + b, Math.max(1.5, s * .025), cat * .5);
      B.posts = { color: "#5f646b", width: s * .2, at: [.22, .78] }; B.lamps = true;
      break;
    }
    case "tiki_plank": {
      // a carved plank of a tiki bar's sign, lashed with rope at both ends
      const lash = s * .32; c = canvas(w + m * 2 + lash * 2, h + m * 2); ox = m + lash; x = c.getContext("2d");
      x.save(); shadow(x);
      const g = x.createLinearGradient(0, oy, 0, oy + h); g.addColorStop(0, "#9a6a3a"); g.addColorStop(.5, "#7a4a22"); g.addColorStop(1, "#5e3618");
      x.fillStyle = g; x.beginPath(); x.roundRect(ox, oy, w, h, s * .12); x.fill(); x.restore();
      x.save(); x.beginPath(); x.roundRect(ox, oy, w, h, s * .12); x.clip();
      for (let k = 0; k < 9; k++) { x.strokeStyle = rgba("#3b2210", .25 + r() * .2); x.lineWidth = Math.max(1, s * .02); x.beginPath(); const yy = oy + h * (k + .5) / 9; x.moveTo(ox, yy); x.bezierCurveTo(ox + w * .3, yy + s * (r() - .5) * .2, ox + w * .7, yy + s * (r() - .5) * .2, ox + w, yy); x.stroke(); }
      x.restore();
      x.strokeStyle = "#3b2210"; x.lineWidth = Math.max(2, s * .06); x.beginPath(); x.roundRect(ox + s * .1, oy + s * .1, w - s * .2, h - s * .2, s * .08); x.stroke();
      for (const ex of [ox - lash * .55, ox + w + lash * .55]) {
        x.fillStyle = "#d9b77a"; x.fillRect(ex - lash * .4, oy + h * .1, lash * .8, h * .8);
        x.strokeStyle = "#a07f45"; x.lineWidth = Math.max(1, s * .03);
        for (let yy = oy + h * .12; yy < oy + h * .9; yy += s * .14) { x.beginPath(); x.moveTo(ex - lash * .4, yy); x.lineTo(ex + lash * .4, yy + s * .1); x.stroke(); }
      }
      B.rot = r.uniform(-3, 3) * Math.PI / 180;
      break;
    }
    case "surfboard": {
      // a surfboard laid on its side: a long white board, rails of colour along its edges, the words across it
      const nose = h * .5; c = canvas(w + m * 2 + nose * 2, h + m * 2); ox = m + nose; x = c.getContext("2d");
      const path = () => { x.beginPath(); x.moveTo(ox - nose, oy + h / 2); x.bezierCurveTo(ox - nose * .6, oy - h * .02, ox + w * .1, oy, ox + w * .5, oy); x.bezierCurveTo(ox + w * .9, oy, ox + w + nose * .7, oy + h * .05, ox + w + nose, oy + h / 2);
        x.bezierCurveTo(ox + w + nose * .7, oy + h * .95, ox + w * .9, oy + h, ox + w * .5, oy + h); x.bezierCurveTo(ox + w * .1, oy + h, ox - nose * .6, oy + h * 1.02, ox - nose, oy + h / 2); x.closePath(); };
      x.save(); shadow(x, .8); path(); x.fillStyle = "#fdfbf6"; x.fill(); x.restore();
      x.save(); path(); x.clip();
      x.fillStyle = p.accent; x.fillRect(ox - nose, oy, w + nose * 2, h * .09); x.fillRect(ox - nose, oy + h * .91, w + nose * 2, h * .09);
      x.fillStyle = rgba(p.plate || p.accent, .9); x.fillRect(ox - nose, oy + h * .11, w + nose * 2, h * .03); x.fillRect(ox - nose, oy + h * .86, w + nose * 2, h * .03);
      x.restore();
      x.strokeStyle = "rgba(0,0,0,.18)"; x.lineWidth = Math.max(1, s * .02); path(); x.stroke();
      B.rot = r.uniform(-4, 4) * Math.PI / 180;
      break;
    }
    default: return null;
  }
  return { c, ox, oy };
}
