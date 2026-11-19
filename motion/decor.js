// Phone Ad Maker: LA scenery, sign boards, decorations and the urgency layer.
//
// Everything here is DRAWN (no photos, no fetched art), so a vibe is data plus
// a few painters, and every painter takes the seed's own random stream so the
// same look number always draws the same palms, the same bricks, the same tape.
//
// Two rules hold every line of copy these draw: nothing claims a person
// answers every message (the shop's texts are partly answered by its bot), and
// urgency is only ever TRUE urgency (phones lose value; "text now" is an
// invitation) and never a deadline, a countdown or a price that is about to move.

import { canvas, rrect, rng, lerp, clamp, prog, outCubic, outBack, outBounce, outQuint, lum, mix, rgba, fontCss, noiseTile, contrastOf, oklchOf } from "./engine.js";

const TAU = Math.PI * 2;
// A loop that draws as many random values as the frame has pixels takes its own stream,
// one value from the look's: what comes after draws the same at every size, so the MP4
// shows the ground the preview showed (audit 2026-10-01).
const fork = r => rng((r() * 4294967296) >>> 0);
const shade = (h, k) => mix(h, k < 0 ? "#000000" : "#ffffff", Math.abs(k));

// ------------------------------------------------------------ small painters

function blotches(x, W, H, r, scale, alpha) {
  r = fork(r);
  const w = Math.max(4, Math.round(W / scale)), h = Math.max(4, Math.round(H / scale));
  const c = canvas(w, h), cx = c.getContext("2d"), id = cx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const v = r(), light = v > .5, a = Math.abs(v - .5) * 2;
    id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = light ? 255 : 0;
    id.data[i * 4 + 3] = Math.round(a * 255 * alpha);
  }
  cx.putImageData(id, 0, 0);
  x.save(); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high"; x.drawImage(c, 0, 0, W, H); x.restore();
}

function grain(x, W, H, r, amp = 26, alpha = .45) {
  const n = noiseTile(256, (r() * 1e6) | 0, amp);
  x.save(); x.globalAlpha = alpha; x.fillStyle = x.createPattern(n, "repeat"); x.fillRect(0, 0, W, H); x.restore();
}

// A surface lit by the phones' key light, high on the left where their shadows fall from (rule
// 114): it falls off along that one direction, 45 degrees, whatever the frame's shape, from near
// (the top left corner) to far (the bottom right). scripts/ground_light_audit.mjs measures it.
function keyLit(x, W, H, near, far) {
  const k = (W + H) / 4, gr = x.createLinearGradient(W / 2 - k, H / 2 - k, W / 2 + k, H / 2 + k);
  gr.addColorStop(0, near); gr.addColorStop(1, far); x.fillStyle = gr; x.fillRect(0, 0, W, H);
}

// The key light's reflection in a sheet brushed side to side: the grain spreads a highlight up
// and down, so it is a soft upright streak at xs (sd its spread), in the metal's own light colour
// col (a coloured metal tints what it reflects), a at its brightest a little above the middle,
// level with the light, softer toward the top and a third of that at the foot.
function streak(x, W, H, col, xs, sd, a) {
  const c = canvas(Math.ceil(W), Math.ceil(H)), s = c.getContext("2d");
  const band = s.createLinearGradient(xs - 3 * sd, 0, xs + 3 * sd, 0);
  [[0, 0], [1 / 6, .135], [1 / 3, .61], [.5, 1], [2 / 3, .61], [5 / 6, .135], [1, 0]].forEach(([u, v]) => band.addColorStop(u, rgba(col, a * v)));
  s.fillStyle = band; s.fillRect(0, 0, W, H);
  const fall = s.createLinearGradient(0, 0, 0, H); fall.addColorStop(0, "rgba(0,0,0,.6)"); fall.addColorStop(.4, "rgba(0,0,0,1)"); fall.addColorStop(1, "rgba(0,0,0,.33)");
  s.globalCompositeOperation = "destination-in"; s.fillStyle = fall; s.fillRect(0, 0, W, H);
  x.drawImage(c, 0, 0);
}

function stucco(x, base, W, H, r) {
  x.fillStyle = base; x.fillRect(0, 0, W, H);
  blotches(x, W, H, r, 24, .16);
  blotches(x, W, H, r, 7, .08);
  grain(x, W, H, r, 28, .5);
}

export function palm(x, bx, by, h, lean, color, r) {
  const tx = bx + lean * h, ty = by - h, cx1 = bx + lean * h * .15, cy1 = by - h * .55;
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    pts.push([(1 - t) ** 2 * bx + 2 * (1 - t) * t * cx1 + t * t * tx, (1 - t) ** 2 * by + 2 * (1 - t) * t * cy1 + t * t * ty]);
  }
  x.fillStyle = color; x.strokeStyle = color;
  const left = [], right = [], w0 = h * .05, w1 = h * .022;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const w = lerp(w0, w1, i / (pts.length - 1)) / 2;
    left.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); right.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
  }
  x.beginPath(); x.moveTo(left[0][0], left[0][1]);
  left.forEach(q => x.lineTo(q[0], q[1])); right.reverse().forEach(q => x.lineTo(q[0], q[1]));
  x.closePath(); x.fill();
  x.lineCap = "round";
  const fronds = r.int(9, 12);
  for (let f = 0; f < fronds; f++) {
    const ang = -Math.PI / 2 + (f / (fronds - 1) - .5) * Math.PI * 1.6 + r.uniform(-.12, .12);
    const L = h * r.uniform(.24, .36), droop = h * r.uniform(.08, .2);
    const ex = tx + Math.cos(ang) * L, ey = ty + Math.sin(ang) * L + droop;
    const mx = tx + Math.cos(ang) * L * .55, my = ty + Math.sin(ang) * L * .55 - droop * .2;
    x.lineWidth = h * .008; x.beginPath(); x.moveTo(tx, ty); x.quadraticCurveTo(mx, my, ex, ey); x.stroke();
    const steps = 16;
    for (let i = 2; i <= steps; i++) {
      const t = i / steps;
      const X = (1 - t) ** 2 * tx + 2 * (1 - t) * t * mx + t * t * ex, Y = (1 - t) ** 2 * ty + 2 * (1 - t) * t * my + t * t * ey;
      const tX = 2 * (1 - t) * (mx - tx) + 2 * t * (ex - mx), tY = 2 * (1 - t) * (my - ty) + 2 * t * (ey - my);
      const tl = Math.hypot(tX, tY) || 1, ux = tX / tl, uy = tY / tl;
      const len = L * .27 * Math.pow(1 - t * .75, .8);
      for (const side of [-1, 1]) {
        const a = side * 1.0, lx = ux * Math.cos(a) - uy * Math.sin(a), ly = ux * Math.sin(a) + uy * Math.cos(a);
        x.lineWidth = h * .0065 * (1 - t * .5);
        x.beginPath(); x.moveTo(X, Y); x.lineTo(X + lx * len, Y + ly * len + len * .35); x.stroke();
      }
    }
  }
  for (let k = 0; k < 3; k++) { x.beginPath(); x.arc(tx + r.uniform(-h * .02, h * .02), ty + h * .02 + r.uniform(0, h * .015), h * .014, 0, TAU); x.fill(); }
}

// The image cards' grounds leave the palms out: a card's copy can stand anywhere, and a
// trunk through a line of it is noise (motion/photo-grounds.js). The video keeps them.
let PALMS_OFF = false;
export function withoutPalms(f) { PALMS_OFF = true; try { return f(); } finally { PALMS_OFF = false; } }
function palms(x, W, H, color, r, n) {
  if (PALMS_OFF) return;
  n = n || r.pick([1, 2, 2, 3]);
  for (let i = 0; i < n; i++) {
    const left = i % 2 === 0;
    const bx = left ? W * r.uniform(-.03, .13) : W * r.uniform(.87, 1.03);
    const h = H * r.uniform(.5, .88) * (W / H < .85 ? .62 : 1);
    palm(x, bx, H * 1.02, h, (left ? 1 : -1) * r.uniform(.04, .22), color, r);
  }
}

function skyline(x, W, H, base, color, r) {
  x.fillStyle = color;
  let px = -W * .02;
  const center = W * r.uniform(.3, .7);
  while (px < W * 1.02) {
    const bw = W * r.uniform(.025, .07), near = 1 - Math.min(1, Math.abs(px - center) / (W * .35));
    const bh = H * (r.uniform(.03, .08) + near * r.uniform(.04, .19));
    x.fillRect(px, base - bh, bw + 1, bh + 2);
    if (bh > H * .13 && r() < .45) {
      if (r() < .5) { x.beginPath(); x.arc(px + bw / 2, base - bh, bw * .45, Math.PI, 0); x.fill(); }
      else x.fillRect(px + bw * .45, base - bh - H * .03, Math.max(1.5, bw * .08), H * .03);
    }
    px += bw + W * r.uniform(0, .012);
  }
}

function cloud(x, cx, cy, s, r) {
  x.save(); x.fillStyle = "rgba(255,255,255,.88)"; x.shadowColor = "rgba(255,255,255,.7)"; x.shadowBlur = s * .35;
  for (let k = 0; k < 6; k++) {
    x.beginPath();
    x.arc(cx + (k - 2.5) * s * .42 + r.uniform(-s * .1, s * .1), cy + r.uniform(-s * .2, s * .1) - (k > 0 && k < 5 ? s * .22 : 0), s * r.uniform(.33, .58), 0, TAU);
    x.fill();
  }
  x.restore();
}

function retroSun(x, sx, sy, R, top, bottom, clipH) {
  const c = canvas(R * 2 + 4, R * 2 + 4), s = c.getContext("2d");
  const g = s.createLinearGradient(0, 0, 0, R * 2); g.addColorStop(0, "#fff4b8"); g.addColorStop(.5, top); g.addColorStop(1, bottom);
  s.fillStyle = g; s.beginPath(); s.arc(R + 2, R + 2, R, 0, TAU); s.fill();
  s.globalCompositeOperation = "destination-out";
  for (let k = 0; k < 6; k++) s.fillRect(0, R + 2 + R * (.12 + k * .15), R * 2 + 4, R * (.025 + k * .02));
  x.save(); x.beginPath(); x.rect(0, 0, x.canvas.width, clipH); x.clip(); x.drawImage(c, sx - R - 2, sy - R - 2); x.restore();
}

// ------------------------------------------------------------ backgrounds

/** Paints one of the LA grounds. Returns false for a kind it does not own. */
export function vibeBackground(kind, x, st, p, W, H, sc, r) {
  const decor = st.decor || [];
  const sil = p.sil || mix(p.ground, "#000000", .7);
  switch (kind) {
    case "sunset_sky": {
      const sky = p.sky || [shade(p.ground, -.35), p.ground, p.accent, p.light];
      const hz = H * (W / H < .85 ? .6 : .66);
      const g = x.createLinearGradient(0, 0, 0, hz);
      g.addColorStop(0, sky[0]); g.addColorStop(.45, sky[1]); g.addColorStop(.8, sky[2]); g.addColorStop(1, sky[3]);
      x.fillStyle = g; x.fillRect(0, 0, W, hz + 2);
      const R = Math.min(W, H) * r.uniform(.16, .24), sx = W * r.uniform(.3, .7), sy = hz - R * r.uniform(.12, .5);
      const gl = x.createRadialGradient(sx, sy, R * .4, sx, sy, R * 3.2);
      gl.addColorStop(0, rgba(sky[3], .6)); gl.addColorStop(1, rgba(sky[3], 0)); x.fillStyle = gl; x.fillRect(0, 0, W, hz);
      retroSun(x, sx, sy, R, p.sun || "#ffb347", "#ff4f6d", hz);
      const gg = x.createLinearGradient(0, hz, 0, H); gg.addColorStop(0, mix(sil, sky[2], .5)); gg.addColorStop(1, mix(sil, sky[1], .35));
      x.fillStyle = gg; x.fillRect(0, hz, W, H - hz);
      if (r() < .75) skyline(x, W, H, hz + 2, sil, r);
      palms(x, W, H, sil, r);
      return true;
    }
    case "sky_day": {
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, p.ground); g.addColorStop(1, p.light);
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      for (let i = 0, n = r.int(3, 5); i < n; i++) cloud(x, r() * W, H * r.uniform(.05, .45), Math.min(W, H) * r.uniform(.07, .15), r);
      break;
    }
    case "stucco": stucco(x, p.ground, W, H, r); break;
    case "concrete": {
      stucco(x, p.ground, W, H, r);
      x.strokeStyle = rgba("#000000", .16); x.lineWidth = Math.max(1, W * .002);
      const cols = r.pick([2, 3]), rows = r.pick([2, 3]);
      x.beginPath();
      for (let i = 1; i < cols; i++) { x.moveTo(W * i / cols, 0); x.lineTo(W * i / cols, H); }
      for (let i = 1; i < rows; i++) { x.moveTo(0, H * i / rows); x.lineTo(W, H * i / rows); }
      x.stroke();
      x.strokeStyle = rgba("#000000", .22); x.lineWidth = Math.max(.8, W * .0012);
      for (let k = 0; k < 3; k++) {
        let px = r() * W, py = r() * H; x.beginPath(); x.moveTo(px, py);
        for (let s = 0; s < 14; s++) { px += r.uniform(-W * .03, W * .03); py += r.uniform(0, H * .03); x.lineTo(px, py); }
        x.stroke();
      }
      break;
    }
    case "brick_night": {
      x.fillStyle = shade(p.ground, -.2); x.fillRect(0, 0, W, H);
      const bh = Math.max(8, H * .045), bw = bh * 2.3, mortar = Math.max(1, bh * .12);
      for (let row = 0, y = 0; y < H; row++, y += bh) {
        for (let xx = row % 2 ? -bw / 2 : 0; xx < W; xx += bw) {
          x.fillStyle = mix(p.ground, p.light, r.uniform(.05, .5));
          x.fillRect(xx + mortar / 2, y + mortar / 2, bw - mortar, bh - mortar);
        }
      }
      grain(x, W, H, r, 30, .35);
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "rgba(10,5,30,.42)"); g.addColorStop(1, "rgba(0,0,0,.18)");
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      const gl = x.createRadialGradient(W * .3, H * .3, 0, W * .3, H * .3, W * .75);
      gl.addColorStop(0, rgba(p.accent, .28)); gl.addColorStop(1, rgba(p.accent, 0)); x.fillStyle = gl; x.fillRect(0, 0, W, H);
      break;
    }
    case "candy_flake": {
      const g = x.createRadialGradient(W * .35, H * .3, 0, W * .5, H * .5, Math.hypot(W, H) * .75);
      g.addColorStop(0, p.light); g.addColorStop(.55, p.ground); g.addColorStop(1, shade(p.ground, -.38));
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      const n = Math.round(W * H / 230), k = Math.max(1, W / 540);
      ((r) => { for (let i = 0; i < n; i++) {
        const a = r();
        x.fillStyle = a < .6 ? `rgba(255,255,255,${r.uniform(.05, .45)})` : a < .85 ? rgba(p.accent, r.uniform(.1, .5)) : `rgba(255,220,150,${r.uniform(.1, .5)})`;
        const s = r.uniform(.4, 1.6) * k; x.fillRect(r() * W, r() * H, s, s);
      } })(fork(r));
      const cl = x.createLinearGradient(0, 0, W, H);
      cl.addColorStop(.3, "rgba(255,255,255,0)"); cl.addColorStop(.42, "rgba(255,255,255,.16)"); cl.addColorStop(.5, "rgba(255,255,255,0)");
      x.fillStyle = cl; x.fillRect(0, 0, W, H);
      break;
    }
    case "cork": {
      x.fillStyle = p.ground; x.fillRect(0, 0, W, H);
      const n = Math.round(W * H / 95), k = Math.max(1, W / 700);
      ((r) => { for (let i = 0; i < n; i++) {
        x.fillStyle = r() < .5 ? rgba(shade(p.ground, -.45), r.uniform(.2, .6)) : rgba(shade(p.ground, .35), r.uniform(.15, .5));
        x.beginPath(); x.arc(r() * W, r() * H, r.uniform(.6, 2.4) * k, 0, TAU); x.fill();
      } })(fork(r));
      blotches(x, W, H, r, 18, .12);
      break;
    }
    case "fluoro": {
      x.fillStyle = p.ground; x.fillRect(0, 0, W, H);
      const [cx, cy] = sc, n = 18, R = Math.hypot(W, H);
      x.fillStyle = rgba(p.light, .5);
      for (let i = 0; i < n; i++) { const a0 = i / n * TAU; x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, R, a0, a0 + Math.PI / n); x.closePath(); x.fill(); }
      grain(x, W, H, r, 18, .35);
      break;
    }
    case "asphalt": {
      stucco(x, p.ground === "#ffffff" ? "#3a3a3d" : shade(p.ground, -.55), W, H, r);
      x.save(); x.translate(W / 2, H / 2); x.rotate(r.uniform(-.25, .25));
      const L = Math.hypot(W, H);
      x.fillStyle = "rgba(245,245,240,.85)";
      for (let y = -L; y < L; y += H * .14) x.fillRect(-W * .22, y, W * .012, H * .07);
      x.fillStyle = "rgba(255,204,0,.9)"; x.fillRect(W * .22, -L, W * .01, 2 * L); x.fillRect(W * .245, -L, W * .01, 2 * L);
      x.restore();
      break;
    }
    case "beach": {
      const hz = H * (W / H < .85 ? .38 : .42);
      const g = x.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, shade(p.ground, -.1)); g.addColorStop(1, p.light);
      x.fillStyle = g; x.fillRect(0, 0, W, hz);
      const R = Math.min(W, H) * .09, sx = W * r.uniform(.2, .8), sy = hz * r.uniform(.3, .6);
      const gl = x.createRadialGradient(sx, sy, 0, sx, sy, R * 3); gl.addColorStop(0, "rgba(255,248,200,.9)"); gl.addColorStop(.35, "rgba(255,240,170,.5)"); gl.addColorStop(1, "rgba(255,240,170,0)");
      x.fillStyle = gl; x.fillRect(0, 0, W, hz);
      const og = x.createLinearGradient(0, hz, 0, hz + H * .2); og.addColorStop(0, "#0077b6"); og.addColorStop(1, "#48cae4");
      x.fillStyle = og; x.fillRect(0, hz, W, H * .2);
      x.strokeStyle = "rgba(255,255,255,.55)"; x.lineWidth = Math.max(1.5, W * .003);
      for (let k = 0; k < 5; k++) { const y = hz + H * (.03 + k * .035); x.beginPath(); for (let xx = 0; xx <= W; xx += 10) x.lineTo(xx, y + Math.sin(xx / W * 12 + k) * H * .005); x.stroke(); }
      const sy2 = hz + H * .2;
      x.fillStyle = "rgba(255,255,255,.8)"; x.beginPath(); x.moveTo(0, sy2);
      for (let xx = 0; xx <= W; xx += 12) x.lineTo(xx, sy2 + Math.sin(xx / W * 9) * H * .01); x.lineTo(W, sy2 + H * .03); x.lineTo(0, sy2 + H * .03); x.fill();
      x.fillStyle = p.sand || "#f2d7a6"; x.fillRect(0, sy2 + H * .015, W, H);
      const n = Math.round(W * H / 400), k = Math.max(1, W / 700);
      ((r) => { for (let i = 0; i < n; i++) { x.fillStyle = rgba(r() < .5 ? "#c9a36b" : "#fff3dc", r.uniform(.2, .6)); x.fillRect(r() * W, sy2 + r() * (H - sy2), k, k); } })(fork(r));
      palms(x, W, H, "rgba(10,40,60,.85)", r, r.pick([1, 2]));
      break;
    }
    case "mural_wall": {
      stucco(x, mix(p.light, "#ffffff", .35), W, H, r);
      const cols = [p.ground, p.accent, p.plate, mix(p.ground, p.accent, .5), p.light];
      const style = r.pick(["rays", "circles", "bands"]);
      x.save(); x.globalAlpha = .92;
      if (style === "rays") {
        const cx = r() < .5 ? 0 : W, cy = r() < .5 ? 0 : H, n = r.int(12, 18), R = Math.hypot(W, H) * 1.2;
        for (let i = 0; i < n; i++) { const a0 = i / n * TAU; x.fillStyle = cols[i % cols.length]; x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, R, a0, a0 + TAU / n); x.closePath(); x.fill(); }
        x.fillStyle = cols[2]; x.beginPath(); x.arc(cx, cy, Math.min(W, H) * .22, 0, TAU); x.fill();
      } else if (style === "circles") {
        for (let i = 0; i < 5; i++) {
          x.fillStyle = cols[i % cols.length]; x.beginPath(); x.arc(r() * W, r() * H, Math.min(W, H) * r.uniform(.18, .42), 0, TAU); x.fill();
          if (r() < .5) { x.strokeStyle = cols[(i + 2) % cols.length]; x.lineWidth = W * .018; x.stroke(); }
        }
      } else {
        x.translate(W / 2, H / 2); x.rotate(r.uniform(-.7, .7));
        const L = Math.hypot(W, H); let y = -L;
        for (let i = 0; y < L; i++) { const bw = L * r.uniform(.06, .16); x.fillStyle = cols[i % cols.length]; x.fillRect(-L, y, 2 * L, bw); y += bw; }
      }
      x.restore();
      grain(x, W, H, r, 22, .35);
      break;
    }
    case "velvet": {
      x.fillStyle = p.ground; x.fillRect(0, 0, W, H);
      const folds = r.int(7, 11), fw = W / folds;
      for (let i = 0; i < folds; i++) {
        const g = x.createLinearGradient(i * fw, 0, (i + 1) * fw, 0);
        g.addColorStop(0, shade(p.ground, -.45)); g.addColorStop(.5, p.light); g.addColorStop(1, shade(p.ground, -.45));
        x.fillStyle = g; x.fillRect(i * fw - 1, 0, fw + 2, H);
      }
      const vh = H * .09;
      x.fillStyle = shade(p.ground, -.25); x.fillRect(0, 0, W, vh);
      for (let i = 0; i < folds * 2; i++) { x.beginPath(); x.arc((i + .5) * W / (folds * 2), vh, W / (folds * 4), 0, Math.PI); x.fill(); }
      x.fillStyle = "#d4a017"; x.fillRect(0, vh * .82, W, Math.max(2, H * .006));
      const sh = x.createLinearGradient(0, 0, 0, H); sh.addColorStop(0, "rgba(0,0,0,.1)"); sh.addColorStop(1, "rgba(0,0,0,.45)"); x.fillStyle = sh; x.fillRect(0, 0, W, H);
      break;
    }
    default: return false;
  }
  if (decor.includes("skyline")) skyline(x, W, H, H * 1.001, rgba(sil, .75), r);
  if (decor.includes("palms")) palms(x, W, H, rgba(sil, .88), r);
  return true;
}

/** Scenery for a ground this file does not own (palms and a skyline over a radial). */
export function sceneryOver(x, st, p, W, H, r) {
  const decor = st.decor || [];
  const sil = p.sil || mix(p.ground, "#000000", .7);
  if (decor.includes("skyline")) skyline(x, W, H, H * 1.001, rgba(sil, .6), r);
  if (decor.includes("palms")) palms(x, W, H, rgba(sil, .75), r);
}

// ------------------------------------------------------------ sign boards

/** Build the board the headline sits on. w/h is the room the words and the tag
 *  need; s is the type size. Returns art plus what the frame draws live. */
export function buildBoard(kind, w, h, s, p, st, r, extra) {
  const B = { kind, rot: 0, posts: null, stakes: false, bulbs: null, neon: false, lamps: false };
  const m = s * .6;
  let c, ox = m, oy = m;
  switch (kind) {
    case "freeway": case "freeway_blue": {
      const tabH = s * .42;
      c = canvas(w + m * 2, h + m * 2 + tabH); oy = m + tabH * .7;
      const x = c.getContext("2d");
      x.save(); x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = s * .25; x.shadowOffsetY = s * .08;
      rrect(x, ox, oy, w, h, s * .18); x.fillStyle = kind === "freeway" ? "#006b3f" : "#1d4f9c"; x.fill(); x.restore();
      const b = s * .1; rrect(x, ox + b, oy + b, w - 2 * b, h - 2 * b, s * .12); x.strokeStyle = "#ffffff"; x.lineWidth = Math.max(2, s * .045); x.stroke();
      const label = extra.code ? `EXIT ${extra.code}` : "EXIT";
      x.font = fontCss("oswald", tabH * .72);
      const tw = x.measureText(label).width + tabH * .9, tx = ox + w - tw - s * .3, ty = oy - tabH * .72;
      rrect(x, tx, ty, tw, tabH, tabH * .15); x.fillStyle = "#ffcc00"; x.fill(); x.strokeStyle = "#111"; x.lineWidth = Math.max(1.5, s * .02); x.stroke();
      x.fillStyle = "#111"; x.textBaseline = "middle"; x.fillText(label, tx + tabH * .45, ty + tabH * .53);
      B.posts = { color: "#8b9097", width: s * .16, at: [.2, .8] };
      break;
    }
    case "poster": {
      c = canvas(w + m * 2, h + m * 2); const x = c.getContext("2d");
      const cards = ["#fff200", "#ff9e1b", "#7dff3a", "#00e5ff", "#ffffff"].filter(k => Math.abs(lum(k) - lum(p.ground)) > .08 || k === "#ffffff");
      const card = r.pick(cards);
      x.save(); x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = s * .3; x.shadowOffsetY = s * .1;
      x.fillStyle = card; x.fillRect(ox, oy, w, h); x.restore();
      x.fillStyle = "rgba(0,0,0,.06)"; for (let i = 0; i < 3; i++) x.fillRect(ox, oy + h * (.3 + i * .25), w, 1);
      for (const [px, a] of [[ox + w * .08, -.5], [ox + w * .92, .5]]) {
        x.save(); x.translate(px, oy + s * .05); x.rotate(a); x.fillStyle = "rgba(255,255,255,.62)"; x.fillRect(-s * .45, -s * .14, s * .9, s * .28); x.restore();
      }
      B.rot = r.uniform(-2.5, 2.5) * Math.PI / 180; B.card = card;
      break;
    }
    case "bandit_yellow": case "bandit_white": {
      c = canvas(w + m * 2, h + m * 2); const x = c.getContext("2d");
      const face = kind === "bandit_yellow" ? "#ffd21a" : "#f6f6f1";
      x.save(); x.shadowColor = "rgba(0,0,0,.3)"; x.shadowBlur = s * .25; x.shadowOffsetY = s * .08;
      x.fillStyle = face; x.fillRect(ox, oy, w, h); x.restore();
      for (let xx = ox; xx < ox + w; xx += Math.max(3, s * .1)) { x.fillStyle = "rgba(0,0,0,.07)"; x.fillRect(xx, oy, Math.max(1, s * .018), h); x.fillStyle = "rgba(255,255,255,.25)"; x.fillRect(xx + s * .03, oy, Math.max(1, s * .012), h); }
      B.rot = r.uniform(-3, 3) * Math.PI / 180; B.stakes = true;
      break;
    }
    case "flyer": {
      const tabsH = extra.tabsH;
      c = canvas(w + m * 2, h + tabsH + m * 2); const x = c.getContext("2d");
      x.save(); x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = s * .3; x.shadowOffsetY = s * .1;
      x.fillStyle = "#fbfaf5"; x.fillRect(ox, oy, w, h + tabsH); x.restore();
      const n = Math.max(6, Math.floor(w / (s * .6))), tw = w / n;
      x.strokeStyle = "rgba(0,0,0,.35)"; x.lineWidth = 1; x.setLineDash([s * .08, s * .06]);
      x.beginPath(); x.moveTo(ox, oy + h); x.lineTo(ox + w, oy + h);
      for (let i = 1; i < n; i++) { x.moveTo(ox + i * tw, oy + h); x.lineTo(ox + i * tw, oy + h + tabsH); }
      x.stroke(); x.setLineDash([]);
      const num = extra.numberText || "";
      const fs = Math.min(tw * .55, tabsH / Math.max(6, num.length) * 1.55);
      x.font = fontCss(extra.font || "franklin", fs); x.fillStyle = "#111"; x.textAlign = "center"; x.textBaseline = "middle";
      const gone = new Set([r.int(1, n - 2)]); if (r() < .5) gone.add(r.int(1, n - 2));
      for (let i = 0; i < n; i++) {
        if (gone.has(i)) continue;
        x.save(); x.translate(ox + (i + .5) * tw, oy + h + tabsH / 2); x.rotate(-Math.PI / 2); x.fillText(num, 0, 0); x.restore();
      }
      x.globalCompositeOperation = "destination-out";
      for (const i of gone) x.fillRect(ox + i * tw + 1, oy + h + s * .05, tw - 2, tabsH);
      x.globalCompositeOperation = "source-over";
      const px = ox + w / 2, py = oy + s * .25;
      x.fillStyle = "rgba(0,0,0,.3)"; x.beginPath(); x.arc(px + s * .05, py + s * .07, s * .17, 0, TAU); x.fill();
      x.fillStyle = "#d62828"; x.beginPath(); x.arc(px, py, s * .17, 0, TAU); x.fill();
      x.fillStyle = "rgba(255,255,255,.7)"; x.beginPath(); x.arc(px - s * .05, py - s * .05, s * .05, 0, TAU); x.fill();
      B.rot = r.uniform(-2, 2) * Math.PI / 180;
      break;
    }
    case "neon_box": {
      c = canvas(w + m * 2, h + m * 2); const x = c.getContext("2d");
      rrect(x, ox, oy, w, h, s * .25); x.fillStyle = "rgba(12,6,24,.88)"; x.fill();
      B.neon = { a: lum(p.accent) > .3 ? p.accent : "#ff2e88", b: lum(p.plate) > .3 ? p.plate : "#00e5ff" };
      break;
    }
    case "marquee": {
      c = canvas(w + m * 2, h + m * 2); const x = c.getContext("2d");
      const f = s * .42;
      x.save(); x.shadowColor = "rgba(0,0,0,.45)"; x.shadowBlur = s * .3; x.shadowOffsetY = s * .1;
      rrect(x, ox, oy, w, h, s * .12); const g = x.createLinearGradient(0, oy, 0, oy + h); g.addColorStop(0, "#a4161a"); g.addColorStop(1, "#660708");
      x.fillStyle = g; x.fill(); x.restore();
      x.strokeStyle = "#d4a017"; x.lineWidth = Math.max(2, s * .05); rrect(x, ox, oy, w, h, s * .12); x.stroke();
      rrect(x, ox + f, oy + f, w - 2 * f, h - 2 * f, s * .06);
      const ig = x.createLinearGradient(0, oy + f, 0, oy + h - f); ig.addColorStop(0, "#fffaf0"); ig.addColorStop(1, "#f3e6c8");
      x.fillStyle = ig; x.fill();
      const pts = [], step = s * .36, inset = f / 2;
      const perim = [[ox + inset, oy + inset], [ox + w - inset, oy + inset], [ox + w - inset, oy + h - inset], [ox + inset, oy + h - inset]];
      for (let k = 0; k < 4; k++) {
        const [a, b] = [perim[k], perim[(k + 1) % 4]], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / step));
        for (let i = 0; i < n; i++) pts.push([lerp(a[0], b[0], i / n) - ox, lerp(a[1], b[1], i / n) - oy]);
      }
      B.bulbs = { pts, r: s * .085 };
      break;
    }
    case "store_sign": {
      c = canvas(w + m * 2, h + m * 2); const x = c.getContext("2d");
      const col = p.plate || "#c1121f";
      x.save(); x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = s * .25; x.shadowOffsetY = s * .08;
      rrect(x, ox, oy, w, h, s * .08); x.fillStyle = col; x.fill(); x.restore();
      const b = s * .13; rrect(x, ox + b, oy + b, w - 2 * b, h - 2 * b, s * .05);
      x.strokeStyle = lum(col) > .55 ? "#111" : "#ffffff"; x.lineWidth = Math.max(1.5, s * .03); x.stroke();
      x.fillStyle = "rgba(0,0,0,.35)";
      for (const [bx, by] of [[ox + b * .5, oy + b * .5], [ox + w - b * .5, oy + b * .5], [ox + b * .5, oy + h - b * .5], [ox + w - b * .5, oy + h - b * .5]]) { x.beginPath(); x.arc(bx, by, s * .035, 0, TAU); x.fill(); }
      B.lamps = true;
      break;
    }
    default: {
      const tb = themeBoard(kind, w, h, s, p, st, r, extra, B);
      if (!tb) return null;
      ({ c, ox, oy } = tb);
    }
  }
  B.c = c; B.ox = ox; B.oy = oy; B.w = w; B.h = h; B.s = s;
  return B;
}

/** Draw a board whose top-left (of the room for the words) is at x,y. */
export function drawBoard(ctx, B, x, y, t, t0, W, H) {
  const q = prog(t, t0, .38);
  if (q <= 0) return;
  const sc = Math.max(.01, outBack(q, 1.8));
  const cx = x + B.w / 2, cy = y + B.h / 2;
  ctx.save();
  ctx.globalAlpha = clamp(q * 3);
  ctx.translate(cx, cy); ctx.rotate(B.rot); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
  const fading = (x0, y0, w, len, paint) => {
    const n = 8;
    for (let k = 0; k < n; k++) { ctx.save(); ctx.globalAlpha *= 1 - k / n; paint(x0, y0 + len * k / n, w, len / n + 1); ctx.restore(); }
  };
  if (B.posts) {
    const len = Math.min(B.h * 1.4, H - (y + B.h));
    for (const at of B.posts.at) {
      const px = x + B.w * at - B.posts.width / 2;
      const gg = ctx.createLinearGradient(px, 0, px + B.posts.width, 0);
      gg.addColorStop(0, "#5f646b"); gg.addColorStop(.5, "#b5bac1"); gg.addColorStop(1, "#5f646b");
      if (len > 0) fading(px, y + B.h - 2, B.posts.width, len, (a, b, w, h) => { ctx.fillStyle = gg; ctx.fillRect(a, b, w, h); });
    }
  }
  if (B.stakes) {
    const len = Math.min(B.h * .9, H - (y + B.h));
    for (const at of [.3, .7]) {
      const px = x + B.w * at, lw = Math.max(1.5, B.s * .035);
      if (len > 0) fading(px - lw / 2, y + B.h - B.s * .2, lw, len, (a, b, w, h) => { ctx.fillStyle = "#3a3a3a"; ctx.fillRect(a, b, w, h); });
    }
  }
  if (B.lamps) {
    ctx.strokeStyle = "#1b1b1b"; ctx.lineWidth = Math.max(1.5, B.s * .04);
    for (const at of [.25, .75]) {
      const px = x + B.w * at, top = y - B.s * .5;
      ctx.beginPath(); ctx.moveTo(px, y + B.s * .05); ctx.quadraticCurveTo(px, top, px + B.s * .35, top + B.s * .05); ctx.stroke();
      ctx.fillStyle = "#1b1b1b"; ctx.beginPath(); ctx.moveTo(px + B.s * .2, top); ctx.lineTo(px + B.s * .55, top); ctx.lineTo(px + B.s * .45, top + B.s * .2); ctx.lineTo(px + B.s * .3, top + B.s * .2); ctx.closePath(); ctx.fill();
      const lg = ctx.createRadialGradient(px + B.s * .38, top + B.s * .2, 0, px + B.s * .38, top + B.s * .2, B.s * 1.4);
      lg.addColorStop(0, "rgba(255,236,170,.45)"); lg.addColorStop(1, "rgba(255,236,170,0)"); ctx.fillStyle = lg;
      ctx.fillRect(px - B.s, top, B.s * 2.8, B.s * 2);
    }
  }
  ctx.drawImage(B.c, x - B.ox, y - B.oy);
  if (B.neon) {
    const on = t - t0 < .35 ? (Math.sin((t - t0) * 90) > -.2 ? 1 : .25) : 1;       // a neon tube catches on a flicker
    ctx.save(); ctx.globalAlpha *= on; ctx.lineJoin = "round";
    for (const [col, ins, lw] of [[B.neon.a, B.s * .12, B.s * .07], [B.neon.b, B.s * .26, B.s * .045]]) {
      rrect(ctx, x + ins, y + ins, B.w - 2 * ins, B.h - 2 * ins, B.s * .2);
      ctx.shadowColor = col; ctx.shadowBlur = B.s * .45; ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); ctx.stroke();
      ctx.shadowBlur = 0; ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = lw * .3; ctx.stroke();
    }
    ctx.restore();
  }
  if (B.bulbs) {
    const phase = Math.floor(t * 10);
    for (let i = 0; i < B.bulbs.pts.length; i++) {
      const [bx, by] = B.bulbs.pts[i], lit = (i + phase) % 3 === 0;
      ctx.beginPath(); ctx.arc(x + bx, y + by, B.bulbs.r, 0, TAU);
      if (lit) { ctx.save(); ctx.shadowColor = "#fff2a8"; ctx.shadowBlur = B.bulbs.r * 4; ctx.fillStyle = "#fff8d0"; ctx.fill(); ctx.restore(); }
      else { ctx.fillStyle = "#9c7a1e"; ctx.fill(); }
    }
  }
  ctx.restore();
}

// ------------------------------------------------------------ decorations in front

/** Where a round thing of radius R fits best. It looks across the whole picture,
 *  not only its corners: the spot that covers none of `avoid` (each line, the
 *  number, the phones) with the most open room around it, nearer the stage on a
 *  tie. Before 2026-11-10 it tried the four corners, two edge midpoints and the
 *  top centre against the words' whole block, so the open space beside a short
 *  line and above the phones was never tried, and a CASH! starburst went to a
 *  corner next to the number (owner: "why is it in the corner versus above the
 *  phones in the right empty middle space"). `fits(x, y, R)`, when given, says
 *  whether the camera shows the whole piece there. Returns { x, y, score, over },
 *  `over` the share of R² it covers. */
export function freeSpot(W, H, R, avoid, prefer, { fits } = {}) {
  const m = Math.min(W, H) * .04, U = Math.min(W, H), step = Math.max(2, R * .25);
  const cover = (x, y) => {
    let o = 0;
    for (const b of avoid) {
      const ix = Math.max(0, Math.min(x + R, b[2]) - Math.max(x - R, b[0])), iy = Math.max(0, Math.min(y + R, b[3]) - Math.max(y - R, b[1]));
      o += ix * iy;
    }
    return o / (R * R);
  };
  // the open room around a spot: its distance to the nearest thing it must keep off, or to the margin
  const room = (x, y) => {
    let c = Math.min(x - R - m, W - m - R - x, y - R - m, H - m - R - y);
    for (const b of avoid) { const dx = Math.max(b[0] - x, 0, x - b[2]), dy = Math.max(b[1] - y, 0, y - b[3]); c = Math.min(c, Math.hypot(dx, dy) - R); }
    return c;
  };
  let best = null;
  for (let y = m + R; y <= H - m - R + .01; y += step) for (let x = m + R; x <= W - m - R + .01; x += step) {
    if (fits && !fits(x, y, R)) continue;
    const over = cover(x, y), d = prefer ? Math.hypot(x - prefer[0], y - prefer[1]) / Math.hypot(W, H) : 0;
    const score = over > 0 ? 10 + over + d * .3 : -room(x, y) / U + d * .15;
    if (!best || score < best.score) best = { x, y, score, over };
  }
  return best;
}

export function drawStarburst(ctx, cx, cy, R, text, fill, ink, t, t0, fontName) {
  const q = prog(t, t0, .35); if (q <= 0) return;
  const sc = Math.max(.01, outBack(q, 2.6)), rot = (-12 + Math.sin((t - t0) * 2.4) * 5) * Math.PI / 180;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(sc, sc);
  const n = 18;
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU, rr = i % 2 ? R * .78 : R; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath();
  ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = R * .15; ctx.shadowOffsetY = R * .05; ctx.fillStyle = fill; ctx.fill();
  ctx.shadowColor = "transparent"; ctx.lineWidth = R * .05; ctx.strokeStyle = ink; ctx.stroke();
  const words = text.split(" "), lines = words.length > 1 && text.length > 6 ? [words.slice(0, Math.ceil(words.length / 2)).join(" "), words.slice(Math.ceil(words.length / 2)).join(" ")] : [text];
  let fs = R * (lines.length > 1 ? .42 : .5);
  ctx.font = fontCss(fontName, fs);
  while (Math.max(...lines.map(l => ctx.measureText(l).width)) > R * 1.3 && fs > 6) { fs *= .92; ctx.font = fontCss(fontName, fs); }
  ctx.fillStyle = ink; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  lines.forEach((l, i) => ctx.fillText(l, 0, (i - (lines.length - 1) / 2) * fs * 1.02));
  ctx.restore();
}

export function drawPinstripe(ctx, block, s, color, t, t0) {
  const q = prog(t, t0, .8); if (q <= 0) return;
  const cx = (block[0] + block[2]) / 2, y = block[3] + s * .28, w = Math.max(s * 2, block[2] - block[0]);
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = Math.max(1.5, s * .035); ctx.lineCap = "round";
  ctx.shadowColor = "rgba(0,0,0,.4)"; ctx.shadowBlur = s * .05;
  const L = w * 1.6;
  ctx.setLineDash([L * outCubic(q), L]);
  for (const side of [1, -1]) {
    ctx.save(); ctx.translate(cx, y); ctx.scale(side, 1);
    ctx.beginPath(); ctx.moveTo(s * .15, 0);
    ctx.bezierCurveTo(w * .12, -s * .05, w * .2, s * .28, w * .33, s * .08);
    ctx.bezierCurveTo(w * .4, -s * .03, w * .38, -s * .24, w * .31, -s * .19);
    ctx.bezierCurveTo(w * .26, -s * .15, w * .3, -s * .02, w * .36, -s * .04);
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s * .1, s * .12); ctx.bezierCurveTo(w * .1, s * .2, w * .18, s * .35, w * .26, s * .32); ctx.stroke();
    ctx.restore();
  }
  ctx.setLineDash([]);
  if (q > .6) { ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(cx, y - s * .09); ctx.lineTo(cx + s * .07, y); ctx.lineTo(cx, y + s * .09); ctx.lineTo(cx - s * .07, y); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}

export function buildSpray(block, s, color, r) {
  const pad = s * .9, w = block[2] - block[0] + pad * 2, h = block[3] - block[1] + pad * 2;
  const c = canvas(w, h), x = c.getContext("2d");
  for (let i = 0; i < 420; i++) {
    const px = r() * w, py = r() * h;
    const edge = Math.min(px, w - px, py, h - py) / pad;
    if (r() > clamp(edge * 1.4)) continue;
    const rad = s * r.uniform(.05, .35);
    const g = x.createRadialGradient(px, py, 0, px, py, rad); g.addColorStop(0, rgba(color, .22)); g.addColorStop(1, rgba(color, 0));
    x.fillStyle = g; x.fillRect(px - rad, py - rad, rad * 2, rad * 2);
  }
  const drips = [];
  for (let i = 0; i < r.int(4, 8); i++) drips.push({ x: block[0] + r() * (block[2] - block[0]), len: s * r.uniform(.25, 1.1), w: s * r.uniform(.03, .06), d: r.uniform(0, .5) });
  return { c, ox: block[0] - pad, oy: block[1] - pad, drips, color };
}

export function drawSpray(ctx, S, block, t, t0) {
  const q = prog(t, t0 - .15, .35); if (q <= 0) return;
  ctx.save(); ctx.globalAlpha = q; ctx.drawImage(S.c, S.ox, S.oy); ctx.restore();
  ctx.save(); ctx.fillStyle = S.color; ctx.strokeStyle = S.color; ctx.lineCap = "round";
  for (const d of S.drips) {
    const g = outCubic(prog(t, t0 + .35 + d.d, 1.4)); if (g <= 0) continue;
    const y0 = block[3] - d.len * .1, y1 = y0 + d.len * g;
    ctx.lineWidth = d.w; ctx.beginPath(); ctx.moveTo(d.x, y0); ctx.lineTo(d.x, y1); ctx.stroke();
    ctx.beginPath(); ctx.arc(d.x, y1, d.w * .9, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

export function drawAwning(ctx, W, h, colors, t) {
  const n = 12, sw = W / n;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = colors[i % 2];
    ctx.fillRect(i * sw, 0, sw + 1, h * .82);
    const flutter = Math.sin(t * 3 + i) * h * .02;
    ctx.beginPath(); ctx.arc(i * sw + sw / 2, h * .82 + flutter * .5, sw / 2, 0, Math.PI); ctx.fill();
  }
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "rgba(0,0,0,.28)"); g.addColorStop(.3, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.12)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, h * .82);
  const sh = ctx.createLinearGradient(0, h * .82, 0, h * 1.25); sh.addColorStop(0, "rgba(0,0,0,.25)"); sh.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = sh; ctx.fillRect(0, h * .82, W, h * .45);
}

export function drawNeonArrow(ctx, from, to, color, t, t0, s) {
  const q = prog(t, t0, .3); if (q <= 0) return;
  const dx = to[0] - from[0], dy = to[1] - from[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  const segs = 3, phase = Math.floor(t * 5) % (segs + 1);
  ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
  for (let k = 0; k < segs; k++) {
    const a = k / segs, b = (k + .8) / segs, lit = k < phase || phase === segs;
    ctx.strokeStyle = color; ctx.lineWidth = s * .08; ctx.shadowColor = color; ctx.shadowBlur = lit ? s * .5 : 0; ctx.globalAlpha = (lit ? 1 : .3) * q;
    ctx.beginPath(); ctx.moveTo(from[0] + dx * a, from[1] + dy * a); ctx.lineTo(from[0] + dx * b, from[1] + dy * b); ctx.stroke();
  }
  const hx = to[0], hy = to[1], hl = s * .45;
  ctx.globalAlpha = q; ctx.shadowBlur = s * .5; ctx.beginPath();
  ctx.moveTo(hx - ux * hl - uy * hl * .6, hy - uy * hl + ux * hl * .6); ctx.lineTo(hx, hy); ctx.lineTo(hx - ux * hl + uy * hl * .6, hy - uy * hl - ux * hl * .6); ctx.stroke();
  ctx.restore();
}

// ------------------------------------------------------------ urgency

export function buildTicker(items, h, fontName, colors, badge) {
  const unit = items.join("   •   ") + "   •   ";
  const m = canvas(4, 4).getContext("2d"); m.font = fontCss(fontName, h * .52);
  const uw = Math.ceil(m.measureText(unit).width);
  const c = canvas(uw, h), x = c.getContext("2d");
  x.font = fontCss(fontName, h * .52); x.fillStyle = colors.ink; x.textBaseline = "middle"; x.fillText(unit, 0, h * .54);
  let b = null;
  if (badge) {
    m.font = fontCss(fontName, h * .5); const bw = m.measureText(badge).width + h * 1.1;
    b = canvas(bw, h); const bx = b.getContext("2d");
    bx.fillStyle = colors.badge; bx.fillRect(0, 0, bw, h);
    bx.beginPath(); bx.moveTo(bw, 0); bx.lineTo(bw + h * .01, 0); bx.fill();
    bx.font = fontCss(fontName, h * .5); bx.fillStyle = colors.badgeInk; bx.textBaseline = "middle"; bx.fillText(badge, h * .55, h * .54);
  }
  return { c, uw, h, b, colors };
}

export function drawTicker(ctx, T, W, y, t) {
  ctx.save();
  ctx.fillStyle = T.colors.bg; ctx.fillRect(0, y, W, T.h);
  ctx.fillStyle = T.colors.line; ctx.fillRect(0, y, W, Math.max(1, T.h * .06)); ctx.fillRect(0, y + T.h - Math.max(1, T.h * .06), W, Math.max(1, T.h * .06));
  ctx.beginPath(); ctx.rect(0, y, W, T.h); ctx.clip();
  const speed = W * .22, off = (t * speed) % T.uw;
  for (let xx = (T.b ? T.b.width : 0) - off; xx < W; xx += T.uw) ctx.drawImage(T.c, xx, y);
  if (T.b) { ctx.drawImage(T.b, 0, y); ctx.fillStyle = T.colors.badge; ctx.beginPath(); ctx.moveTo(T.b.width, y); ctx.lineTo(T.b.width + T.h * .35, y + T.h / 2); ctx.lineTo(T.b.width, y + T.h); ctx.fill(); }
  ctx.restore();
}

export function drawTape(ctx, W, H, corner, text, t, t0, fontName) {
  const q = prog(t, t0, .4); if (q <= 0) return;
  const band = Math.min(W, H) * .085;
  const [sx, sy] = { tr: [1, -1], tl: [-1, -1], br: [1, 1], bl: [-1, 1] }[corner];
  const cx = W / 2 + sx * W * .4, cy = H / 2 + sy * H * .4;
  const ang = Math.atan2(H, W) * (sx * sy > 0 ? 1 : -1) * .9;
  const L = Math.hypot(W, H) * .5;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-ang);
  ctx.translate((1 - outCubic(q)) * L * sx, 0);              // slides in from its own edge
  ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = band * .3; ctx.shadowOffsetY = band * .1;
  ctx.fillStyle = "#ffd000"; ctx.fillRect(-L / 2, -band / 2, L, band); ctx.shadowColor = "transparent";
  ctx.save(); ctx.beginPath(); ctx.rect(-L / 2, -band / 2, L, band * .14); ctx.rect(-L / 2, band / 2 - band * .14, L, band * .14); ctx.clip();
  ctx.fillStyle = "#111";
  for (let xx = -L / 2; xx < L / 2; xx += band * .4) { ctx.beginPath(); ctx.moveTo(xx, -band / 2); ctx.lineTo(xx + band * .2, -band / 2); ctx.lineTo(xx + band * .2 + band, band / 2); ctx.lineTo(xx + band, band / 2); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  ctx.beginPath(); ctx.rect(-L / 2, -band / 2, L, band); ctx.clip();
  ctx.font = fontCss(fontName, band * .5); ctx.fillStyle = "#111"; ctx.textBaseline = "middle"; ctx.textAlign = "center";
  const unit = text + "   \u2022   ", uw = ctx.measureText(unit).width;
  for (let k = -3; k <= 3; k++) { ctx.fillText(text, k * uw, band * .04); ctx.fillText("\u2022", k * uw + uw / 2, band * .04); }
  ctx.restore();
}

export function buildStamp(text, s, color, fontName, r) {
  const m = canvas(4, 4).getContext("2d"); m.font = fontCss(fontName, s);
  const tw = m.measureText(text).width, pad = s * .35, w = tw + pad * 2, h = s * 1.25;
  const c = canvas(w + 8, h + 8), x = c.getContext("2d");
  x.translate(4, 4);
  x.strokeStyle = color; x.lineWidth = s * .09; rrect(x, 0, 0, w, h, s * .12); x.stroke();
  x.lineWidth = s * .035; rrect(x, s * .12, s * .12, w - s * .24, h - s * .24, s * .06); x.stroke();
  x.font = fontCss(fontName, s); x.fillStyle = color; x.textBaseline = "middle"; x.textAlign = "center"; x.fillText(text, w / 2, h * .55);
  x.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(0,0,0,${r.uniform(.2, .9)})`; x.beginPath(); x.arc(r() * w, r() * h, s * r.uniform(.01, .045), 0, TAU); x.fill(); }
  return c;
}

export function drawStamp(ctx, S, cx, cy, t, t0) {
  const q = prog(t, t0, .22); if (q <= 0) return;
  const sc = lerp(2.4, 1, outCubic(q));
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-.21); ctx.scale(sc, sc); ctx.globalAlpha = clamp(q * 2.5) * .93;
  ctx.drawImage(S, -S.width / 2, -S.height / 2); ctx.restore();
  const d = t - t0 - .22;
  if (d > 0 && d < .5) {
    ctx.save();
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * TAU, R = S.width * (.45 + d * 1.2);
      ctx.fillStyle = `rgba(120,110,100,${.35 * (1 - d / .5)})`;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R * .6, S.height * (.08 + d * .3), 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
}

/** Where arrows at the number can go: "sides", "above", or null when neither is clear of the words
 *  and of whatever blocked() says is in the way. */
export function chevronRoom(rect, s, W, words, blocked = () => false) {
  const [x0, y0, x1, y1] = rect, sz = Math.min(s * .5, (y1 - y0) * .5), cy = (y0 + y1) / 2;
  const sides = [[x0 - sz * 3.2, cy - sz * .5, x0, cy + sz * .5], [x1, cy - sz * .5, x1 + sz * 3.2, cy + sz * .5]];
  if (Math.min(x0, W - x1) > sz * 3.2 && !sides.some(blocked)) return "sides";
  const cx = (x0 + x1) / 2, band = [cx - sz * .6, y0 - sz * 2.4, cx + sz * .6, y0];
  const clear = (!words || band[2] < words[0] || band[0] > words[2] || band[3] < words[1] || band[1] > words[3]) && !blocked(band);
  return clear && band[1] > 0 ? "above" : null;
}

export function drawChevrons(ctx, rect, s, color, t, t0, W, mode) {
  const q = prog(t, t0, .3); if (q <= 0) return;
  const [x0, y0, x1, y1] = rect, cy = (y0 + y1) / 2, sz = Math.min(s * .5, (y1 - y0) * .5);
  const phase = Math.floor(t * 9);
  const room = Math.min(x0, W - x1);
  ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, sz * .28);
  ctx.shadowColor = color;
  if (mode ? mode === "sides" : room > sz * 3.2) {
    for (let i = 0; i < 3; i++) {
      const lit = (phase - i) % 3 === 0; ctx.globalAlpha = q * (lit ? 1 : .35); ctx.shadowBlur = lit ? sz * .8 : 0;
      const lx = x0 - sz * .6 - (2 - i) * sz * .9;
      ctx.beginPath(); ctx.moveTo(lx - sz * .35, cy - sz * .45); ctx.lineTo(lx, cy); ctx.lineTo(lx - sz * .35, cy + sz * .45); ctx.stroke();
      const rx = x1 + sz * .6 + (2 - i) * sz * .9;
      ctx.beginPath(); ctx.moveTo(rx + sz * .35, cy - sz * .45); ctx.lineTo(rx, cy); ctx.lineTo(rx + sz * .35, cy + sz * .45); ctx.stroke();
    }
  } else {
    const cx = (x0 + x1) / 2;
    for (let i = 0; i < 3; i++) {
      const lit = (phase - i) % 3 === 0; ctx.globalAlpha = q * (lit ? 1 : .35); ctx.shadowBlur = lit ? sz * .8 : 0;
      const yy = y0 - sz * .5 - (2 - i) * sz * .7;
      ctx.beginPath(); ctx.moveTo(cx - sz * .45, yy - sz * .3); ctx.lineTo(cx, yy); ctx.lineTo(cx + sz * .45, yy - sz * .3); ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawFlashBorder(ctx, W, H, color, t, tHit, bpm) {
  if (t < tHit) return;
  const beat = 60 / bpm, ph = ((t - tHit) % beat) / beat;
  const a = .45 + .55 * Math.exp(-ph * 6);
  const th = Math.min(W, H) * .018;
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = color; ctx.lineWidth = th; ctx.shadowColor = color; ctx.shadowBlur = th * 1.5;
  ctx.strokeRect(th / 2, th / 2, W - th, H - th); ctx.restore();
}

export function beatPulse(t, tHit, bpm) {
  if (t < tHit) return 0;
  const beat = 60 / bpm, ph = ((t - tHit) % beat) / beat;
  return Math.exp(-ph * 7);
}

export { rng };

// ------------------------------------------------------------ spin-off grounds (in review)

/* Spin-offs of the grounds the 2026-09-30 audit rated best: three each of the
   mural wall, the sunset sky, the night brick and the halftone, two each of the
   rays, the beams, the beach, the velvet, the checker and the candy paint.
   Every one is a candidate until the owner approves it (GROUND_REVIEW in
   catalog.js): only an approved one is ever drawn by a shuffle. Each keeps its
   parent's idea and its palette, and leaves the middle of the frame calm
   enough for the phones and the words. */
export function candidateGround(kind, x, st, p, W, H, sc, r) {
  const sil = p.sil || mix(p.ground, "#000000", .7), D = Math.hypot(W, H), tall = W / H < .85;
  const [cx, cy] = sc;
  const sky = p.sky || [shade(p.ground, -.35), p.ground, p.accent, p.light];
  const wall = cols => { stucco(x, mix(p.light, "#ffffff", .35), W, H, r); return cols; };
  const muralCols = [p.ground, p.accent, p.plate, mix(p.ground, p.accent, .5), p.light];
  const glow = (gx, gy, R, col, a) => { const g = x.createRadialGradient(gx, gy, 0, gx, gy, R); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); x.fillStyle = g; x.fillRect(0, 0, W, H); };
  const bricks = (base, lightK = .5, top = 0, bottom = H) => {
    x.fillStyle = shade(base, -.2); x.fillRect(0, top, W, bottom - top);
    const bh = Math.max(8, H * .045), bw = bh * 2.3, mortar = Math.max(1, bh * .12);
    for (let row = 0, y = top; y < bottom; row++, y += bh)
      for (let xx = row % 2 ? -bw / 2 : 0; xx < W; xx += bw) { x.fillStyle = mix(base, p.light, r.uniform(.05, lightK)); x.fillRect(xx + mortar / 2, y + mortar / 2, bw - mortar, Math.min(bh, bottom - y) - mortar); }
    grain(x, W, H, r, 30, .3);
  };
  const skyTo = (hz, stops = sky) => { const g = x.createLinearGradient(0, 0, 0, hz); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); x.fillStyle = g; x.fillRect(0, 0, W, hz + 2); };
  const radialGround = (k = .75) => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, D * k); g.addColorStop(0, p.light); g.addColorStop(1, p.ground); x.fillStyle = g; x.fillRect(0, 0, W, H); };
  const light = lum(p.ground) > .45 ? shade(p.ground, -.3) : p.light;
  switch (kind) {
    // ---- mural wall
    case "mural_waves": {                                   // painted swells rolling across the wall
      const cols = wall(muralCols), n = r.int(6, 8), amp = H * r.uniform(.03, .06), per = W * r.uniform(.5, .9), tilt = r.uniform(-.25, .25);
      x.save(); x.globalAlpha = .93;
      for (let i = 0; i <= n; i++) {                        // top band first, each lower swell over the one above
        const y0 = H * (i / (n + 1)) * 1.1 - H * .02;
        x.fillStyle = cols[i % cols.length]; x.beginPath(); x.moveTo(0, H);
        for (let xx = 0; xx <= W + 10; xx += 10) x.lineTo(xx, y0 + tilt * (xx - W / 2) + Math.sin(xx / per * TAU + i * 1.3) * amp);
        x.lineTo(W, H); x.closePath(); x.fill();
        x.strokeStyle = "rgba(255,255,255,.7)"; x.lineWidth = Math.max(2, W * .005); x.stroke();
      }
      x.restore(); grain(x, W, H, r, 22, .35); return true;
    }
    case "mural_rainbow": {                                  // a seventies arch of painted bands out of a corner
      const cols = wall(muralCols), ox = r() < .5 ? W * .02 : W * .98, oy = H * 1.02, band = Math.max(W, H) * r.uniform(.07, .1);
      x.save(); x.globalAlpha = .93;
      for (let i = 12; i >= 0; i--) { x.fillStyle = cols[i % cols.length]; x.beginPath(); x.arc(ox, oy, band * (i + 2), 0, TAU); x.fill(); }
      x.fillStyle = mix(p.light, "#ffffff", .35); x.beginPath(); x.arc(ox, oy, band * 1.6, 0, TAU); x.fill();
      x.restore(); grain(x, W, H, r, 22, .35); return true;
    }
    case "mural_shapes": {                                   // a two-tone wall with painted triangles, squiggles and dots
      const cols = wall(muralCols);
      x.save(); x.globalAlpha = .92; x.fillStyle = cols[0];
      x.beginPath(); x.moveTo(0, H * r.uniform(.45, .7)); x.lineTo(W, H * r.uniform(.25, .5)); x.lineTo(W, H); x.lineTo(0, H); x.fill();
      const U = Math.min(W, H);
      for (let i = 0; i < 9; i++) {
        const px = r() * W, py = r() * H, s = U * r.uniform(.05, .11), c = cols[(i + 1) % cols.length], kind2 = i % 3;
        x.save(); x.translate(px, py); x.rotate(r() * TAU); x.fillStyle = c; x.strokeStyle = c; x.lineWidth = U * .014; x.lineCap = "round";
        if (kind2 === 0) { x.beginPath(); x.moveTo(0, -s); x.lineTo(s * .9, s * .6); x.lineTo(-s * .9, s * .6); x.closePath(); x.fill(); }
        else if (kind2 === 1) { x.beginPath(); for (let k = 0; k <= 24; k++) x.lineTo(-s * 1.4 + k * s * 2.8 / 24, Math.sin(k / 24 * TAU * 1.5) * s * .3); x.stroke(); }
        else for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) { x.beginPath(); x.arc((a - 1) * s * .5, (b - 1) * s * .5, s * .12, 0, TAU); x.fill(); }
        x.restore();
      }
      x.restore(); grain(x, W, H, r, 22, .35); return true;
    }
    // ---- sunset sky
    case "sunset_synth": {                                   // the retro sun over a glowing grid floor
      const hz = H * (tall ? .56 : .6); skyTo(hz);
      const R = Math.min(W, H) * r.uniform(.18, .24), sx = W * r.uniform(.35, .65);
      glow(sx, hz, R * 3, sky[3], .55); retroSun(x, sx, hz - R * .35, R, p.sun || "#ffb347", "#ff4f6d", hz);
      x.fillStyle = shade(sil, -.2); x.fillRect(0, hz, W, H - hz);
      x.strokeStyle = rgba(sky[2], .75); x.lineWidth = Math.max(1, W * .0028);
      for (let k = 1; k < 14; k++) { const y = hz + (H - hz) * Math.pow(k / 13, 1.9); x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
      for (let k = -12; k <= 12; k++) { x.beginPath(); x.moveTo(sx + k * W * .02, hz); x.lineTo(sx + k * W * .2, H); x.stroke(); }
      glow(sx, hz, W * .6, sky[2], .25); return true;
    }
    case "sunset_ocean": {                                   // the sun going down into the Pacific, its road of light on the water
      const hz = H * (tall ? .5 : .55); skyTo(hz);
      const R = Math.min(W, H) * r.uniform(.14, .2), sx = W * r.uniform(.3, .7);
      glow(sx, hz, R * 3.4, sky[3], .6); retroSun(x, sx, hz - R * .3, R, p.sun || "#ffb347", "#ff4f6d", hz);
      const og = x.createLinearGradient(0, hz, 0, H); og.addColorStop(0, mix(sky[1], "#0b3a5c", .45)); og.addColorStop(1, mix(sil, "#062238", .5));
      x.fillStyle = og; x.fillRect(0, hz, W, H - hz);
      for (let k = 0; k < 26; k++) {
        const y = hz + (H - hz) * Math.pow((k + .5) / 26, 1.4), w = R * (.4 + 1.6 * (k / 26)) * r.uniform(.5, 1.2);
        x.fillStyle = rgba(k % 3 ? sky[3] : "#fff4b8", .7 - k * .018); x.fillRect(sx - w / 2 + r.uniform(-R * .2, R * .2), y, w, Math.max(1.5, H * .004));
      }
      palms(x, W, H, sil, r, 2); return true;
    }
    case "sunset_dusk": {                                    // later, darker: stars out, the last of the light low, palms framing it
      const hz = H * (tall ? .64 : .7);
      skyTo(hz, [shade(sky[0], -.35), sky[0], sky[1], sky[2]]);
      for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(255,255,255,${r.uniform(.2, .8)})`; const s = r.uniform(.6, 1.8) * Math.max(1, W / 700); x.fillRect(r() * W, r() * hz * .7, s, s); }
      glow(W * r.uniform(.3, .7), hz, W * .7, sky[3], .5);
      x.fillStyle = sil; x.fillRect(0, hz, W, H - hz);
      skyline(x, W, H, hz + 2, sil, r);
      palms(x, W, H, shade(sil, -.3), r, 2); palms(x, W, H, shade(sil, -.3), r, 1); return true;
    }
    // ---- night brick
    case "brick_neon_wash": {                                // two neon signs just out of frame washing the wall in colour
      bricks(p.ground, .45);
      x.fillStyle = "rgba(8,4,24,.5)"; x.fillRect(0, 0, W, H);
      x.save(); x.globalCompositeOperation = "screen";
      glow(0, H * r.uniform(.1, .5), W * .9, p.accent, .55); glow(W, H * r.uniform(.5, .9), W * .9, p.plate || p.light, .5);
      x.restore(); return true;
    }
    case "brick_wet": {                                      // the wall over a wet sidewalk, colour smeared in the puddles, rain
      const fl = H * (tall ? .72 : .68); bricks(p.ground, .45, 0, fl);
      x.fillStyle = "rgba(10,5,30,.4)"; x.fillRect(0, 0, W, fl);
      glow(W * .3, H * .3, W * .7, p.accent, .3);
      const g = x.createLinearGradient(0, fl, 0, H); g.addColorStop(0, shade(p.ground, -.55)); g.addColorStop(1, shade(p.ground, -.8)); x.fillStyle = g; x.fillRect(0, fl, W, H - fl);
      for (let i = 0; i < 40; i++) { const px = r() * W, w = W * r.uniform(.004, .02); x.fillStyle = rgba(r() < .5 ? p.accent : p.light, r.uniform(.08, .3)); x.fillRect(px, fl + r() * H * .05, w, (H - fl) * r.uniform(.3, 1)); }
      x.strokeStyle = "rgba(255,255,255,.18)"; x.lineWidth = Math.max(1, W * .0015);
      for (let i = 0; i < 120; i++) { const px = r() * W, py = r() * H, L = H * r.uniform(.02, .05); x.beginPath(); x.moveTo(px, py); x.lineTo(px - L * .25, py + L); x.stroke(); }
      return true;
    }
    case "brick_lamp": {                                     // one warm streetlamp over a dark wall
      bricks(p.ground, .4);
      x.fillStyle = "rgba(4,2,14,.62)"; x.fillRect(0, 0, W, H);
      const lx = cx + W * r.uniform(-.15, .15);
      x.save(); x.globalCompositeOperation = "screen";
      const cone = x.createLinearGradient(0, 0, 0, H); cone.addColorStop(0, "rgba(255,214,150,.55)"); cone.addColorStop(1, "rgba(255,214,150,.05)");
      x.fillStyle = cone; x.beginPath(); x.moveTo(lx - W * .04, 0); x.lineTo(lx + W * .04, 0); x.lineTo(lx + W * .45, H); x.lineTo(lx - W * .45, H); x.closePath(); x.fill();
      glow(lx, H * .02, W * .25, "#ffe2b0", .8);
      x.restore(); return true;
    }
    // ---- halftone
    case "halftone_duo": {                                   // two dot screens meeting from opposite corners, one in the accent
      radialGround();
      const step = Math.max(10, W * .022), c1 = r() < .5 ? [0, 0] : [W, 0], c2 = [W - c1[0], H];
      for (const [corner, col, a] of [[c1, light, .5], [c2, p.accent, .6]]) {
        x.fillStyle = rgba(col, a);
        for (let yy = 0; yy < H; yy += step) for (let xx = 0; xx < W; xx += step) {
          const d = Math.hypot(xx - corner[0], yy - corner[1]) / D, rad = step * .5 * clamp(1 - d * 2.1);
          if (rad > .5) { x.beginPath(); x.arc(xx + (col === p.accent ? step / 2 : 0), yy + (col === p.accent ? step / 2 : 0), rad, 0, TAU); x.fill(); }
        }
      }
      return true;
    }
    case "halftone_comic": {                                 // a comic panel: action lines out of the phones and a dot screen over all
      radialGround();
      const n = 40; x.fillStyle = rgba(light, .28);
      for (let i = 0; i < n; i++) { const a0 = i / n * TAU + r.uniform(0, .05), a1 = a0 + TAU / n * r.uniform(.2, .5); x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, D, a0, a1); x.closePath(); x.fill(); }
      const step = Math.max(8, W * .016); x.fillStyle = rgba(lum(p.ground) > .45 ? "#000000" : "#ffffff", .1);
      for (let yy = 0, row = 0; yy < H; yy += step * .87, row++) for (let xx = row % 2 ? step / 2 : 0; xx < W; xx += step) { x.beginPath(); x.arc(xx, yy, step * .22, 0, TAU); x.fill(); }
      x.strokeStyle = lum(p.accent) > .3 ? p.accent : p.ink; x.lineWidth = Math.min(W, H) * .018; x.strokeRect(x.lineWidth / 2, x.lineWidth / 2, W - x.lineWidth, H - x.lineWidth);
      return true;
    }
    case "halftone_lines": {                                 // a line screen: diagonal rules that swell toward one corner
      radialGround();
      const per = Math.max(8, W * .02), corner = r.pick([[0, 0], [W, 0], [0, H], [W, H]]);
      x.fillStyle = rgba(light, .5);
      x.save(); x.translate(W / 2, H / 2); x.rotate(-Math.PI / 4);
      for (let s = -D; s < D; s += per) for (let t = -D; t < D; t += per * .5) {
        const c = Math.cos(Math.PI / 4), sn = Math.sin(Math.PI / 4), px = W / 2 + s * c + t * sn, py = H / 2 - s * sn + t * c;
        const w = per * .9 * clamp(1 - Math.hypot(px - corner[0], py - corner[1]) / D * 1.7);
        if (w > .4) x.fillRect(s - w / 2, t, w, per * .5 + .5);
      }
      x.restore(); return true;
    }
    // ---- rays
    case "rays_corner": {                                    // the rays out of a low corner, two tones, like light through a door
      radialGround(.9);
      const ox = r() < .5 ? -W * .05 : W * 1.05, oy = H * 1.05, n = 22;
      for (let i = 0; i < n; i++) { const a0 = Math.PI + i / n * Math.PI, a1 = a0 + Math.PI / n / 1.6; x.fillStyle = rgba(i % 2 ? light : mix(p.light, p.accent, .5), .3); x.beginPath(); x.moveTo(ox, oy); x.arc(ox, oy, D * 1.3, a0, a1); x.closePath(); x.fill(); }
      return true;
    }
    case "rays_bold": {                                      // a full sunburst in the ground and a deeper shade of it, a soft pool behind the phones
      x.fillStyle = p.ground; x.fillRect(0, 0, W, H);
      const n = 16 + (st.seed % 3) * 4, deep = shade(p.ground, lum(p.ground) > .45 ? -.14 : .14);
      x.fillStyle = deep;
      for (let i = 0; i < n; i++) { const a0 = i / n * TAU, a1 = a0 + Math.PI / n; x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, D, a0, a1); x.closePath(); x.fill(); }
      glow(cx, cy, Math.min(W, H) * .45, p.light, .7); return true;
    }
    // ---- beams
    case "beams_cross": {                                    // two searchlights from the floor crossing behind the phones
      x.fillStyle = shade(p.ground, -.45); x.fillRect(0, 0, W, H);
      x.save(); x.globalCompositeOperation = "screen";
      for (const [bx, dir] of [[W * .12, 1], [W * .88, -1]]) {
        const g = x.createLinearGradient(bx, H, bx + dir * W * .5, 0); g.addColorStop(0, rgba(p.light, .6)); g.addColorStop(1, rgba(p.light, 0));
        x.fillStyle = g; x.beginPath(); x.moveTo(bx - W * .02, H); x.lineTo(bx + W * .02, H); x.lineTo(bx + dir * W * .95, -H * .05); x.lineTo(bx + dir * W * .55, -H * .05); x.closePath(); x.fill();
      }
      x.restore(); glow(W / 2, H, W * .6, p.light, .35); return true;
    }
    case "beams_stage": {                                    // lights from the rig onto a stage floor
      const fl = H * (tall ? .7 : .66);
      x.fillStyle = shade(p.ground, -.5); x.fillRect(0, 0, W, H);
      const fg = x.createLinearGradient(0, fl, 0, H); fg.addColorStop(0, shade(p.ground, -.15)); fg.addColorStop(1, shade(p.ground, -.6)); x.fillStyle = fg; x.fillRect(0, fl, W, H - fl);
      x.save(); x.globalCompositeOperation = "screen";
      for (let i = 0; i < 3; i++) {
        const bx = W * (.2 + .3 * i), tx = W * (.3 + .2 * i) + r.uniform(-W * .05, W * .05);
        const g = x.createLinearGradient(0, 0, 0, fl); g.addColorStop(0, rgba(p.light, .55)); g.addColorStop(1, rgba(p.light, .12));
        x.fillStyle = g; x.beginPath(); x.moveTo(bx - W * .015, 0); x.lineTo(bx + W * .015, 0); x.lineTo(tx + W * .13, fl); x.lineTo(tx - W * .13, fl); x.closePath(); x.fill();
        x.fillStyle = rgba(p.light, .35); x.beginPath(); x.ellipse(tx, fl + H * .02, W * .15, H * .03, 0, 0, TAU); x.fill();
      }
      x.restore(); return true;
    }
    // ---- beach
    case "beach_sunset": {                                   // the beach at golden hour: warm sky, the sun on the water, wet sand shining
      const hz = H * (tall ? .4 : .44);
      skyTo(hz, ["#3d1a70", "#b1447a", "#ff8a5b", "#ffc857"]);
      const sx = W * r.uniform(.3, .7), R = Math.min(W, H) * .08;
      glow(sx, hz, R * 5, "#ffd98a", .7); x.fillStyle = "#fff0b8"; x.beginPath(); x.arc(sx, hz, R, Math.PI, 0); x.fill();
      const og = x.createLinearGradient(0, hz, 0, hz + H * .18); og.addColorStop(0, "#6a4a8c"); og.addColorStop(1, "#e08a6d"); x.fillStyle = og; x.fillRect(0, hz, W, H * .18);
      for (let k = 0; k < 12; k++) { const y = hz + H * .18 * (k + .5) / 12, w = R * (1 + k * .25); x.fillStyle = rgba("#ffe0a0", .6 - k * .04); x.fillRect(sx - w / 2, y, w, Math.max(1.5, H * .004)); }
      const sy = hz + H * .18; x.fillStyle = "rgba(255,255,255,.7)"; x.fillRect(0, sy - H * .004, W, H * .01);
      const sg = x.createLinearGradient(0, sy, 0, H); sg.addColorStop(0, "#d99a7a"); sg.addColorStop(1, "#f0c89a"); x.fillStyle = sg; x.fillRect(0, sy + H * .006, W, H);
      palms(x, W, H, "rgba(40,15,50,.9)", r, r.pick([1, 2])); return true;
    }
    case "beach_top": {                                      // from above: sand, the surf's edge and its foam
      x.fillStyle = p.sand || "#f2d7a6"; x.fillRect(0, 0, W, H);
      const n = Math.round(W * H / 380), k = Math.max(1, W / 700);
      ((r) => { for (let i = 0; i < n; i++) { x.fillStyle = rgba(r() < .5 ? "#c9a36b" : "#fff3dc", r.uniform(.2, .6)); x.fillRect(r() * W, r() * H, k, k); } })(fork(r));
      const edge = xx => H * .34 + Math.sin(xx / W * 5 + 1) * H * .05 + Math.sin(xx / W * 13) * H * .012;
      const wg = x.createLinearGradient(0, 0, 0, H * .4); wg.addColorStop(0, "#0077b6"); wg.addColorStop(1, "#48cae4");
      x.fillStyle = wg; x.beginPath(); x.moveTo(0, 0); x.lineTo(W, 0); for (let xx = W; xx >= 0; xx -= 8) x.lineTo(xx, edge(xx)); x.closePath(); x.fill();
      x.fillStyle = "rgba(160,120,70,.18)"; x.beginPath(); for (let xx = 0; xx <= W; xx += 8) x.lineTo(xx, edge(xx) + H * .05); for (let xx = W; xx >= 0; xx -= 8) x.lineTo(xx, edge(xx)); x.fill();
      x.strokeStyle = "rgba(255,255,255,.9)"; x.lineWidth = Math.max(2, W * .008);
      for (let j = 0; j < 3; j++) { x.globalAlpha = 1 - j * .3; x.beginPath(); for (let xx = 0; xx <= W; xx += 8) x.lineTo(xx, edge(xx) - j * H * .03 + Math.sin(xx * .05 + j) * H * .004); x.stroke(); }
      x.globalAlpha = 1; return true;
    }
    // ---- velvet
    case "velvet_parted": {                                  // the curtain drawn back to a lit stage
      x.fillStyle = shade(p.ground, -.7); x.fillRect(0, 0, W, H);
      glow(cx, H * .55, Math.min(W, H) * .55, p.light, .45);
      const side = W * (tall ? .2 : .24), folds = 5;
      for (const left of [true, false]) for (let i = 0; i < folds; i++) {
        const fw = side / folds, x0 = left ? i * fw : W - (i + 1) * fw;
        const g = x.createLinearGradient(x0, 0, x0 + fw, 0); g.addColorStop(0, shade(p.ground, -.45)); g.addColorStop(.5, p.light); g.addColorStop(1, shade(p.ground, -.45));
        x.fillStyle = g; x.beginPath(); x.moveTo(x0, 0); x.lineTo(x0 + fw, 0); x.lineTo(x0 + fw + (left ? -1 : 1) * fw * i * .15, H); x.lineTo(x0 + (left ? -1 : 1) * fw * i * .15, H); x.closePath(); x.fill();
      }
      const vh = H * .08; x.fillStyle = shade(p.ground, -.25); x.fillRect(0, 0, W, vh);
      for (let i = 0; i < 16; i++) { x.beginPath(); x.arc((i + .5) * W / 16, vh, W / 32, 0, Math.PI); x.fill(); }
      x.fillStyle = "#d4a017"; x.fillRect(0, vh * .82, W, Math.max(2, H * .006)); return true;
    }
    case "velvet_bulbs": {                                   // velvet folds inside a frame of marquee bulbs
      x.fillStyle = p.ground; x.fillRect(0, 0, W, H);
      const folds = r.int(7, 11), fw = W / folds;
      for (let i = 0; i < folds; i++) { const g = x.createLinearGradient(i * fw, 0, (i + 1) * fw, 0); g.addColorStop(0, shade(p.ground, -.45)); g.addColorStop(.5, p.light); g.addColorStop(1, shade(p.ground, -.45)); x.fillStyle = g; x.fillRect(i * fw - 1, 0, fw + 2, H); }
      x.fillStyle = "rgba(0,0,0,.35)"; x.fillRect(0, 0, W, H);
      const m = Math.min(W, H) * .035, gap = Math.min(W, H) * .06, bulb = (bx, by) => { const g = x.createRadialGradient(bx, by, 0, bx, by, m * .9); g.addColorStop(0, "#fffbe6"); g.addColorStop(.35, "#ffd36b"); g.addColorStop(1, "rgba(255,190,80,0)"); x.fillStyle = g; x.beginPath(); x.arc(bx, by, m * .9, 0, TAU); x.fill(); };
      x.fillStyle = "#2a1a0a"; x.lineWidth = m * 1.2; x.strokeStyle = "#3a2410"; x.strokeRect(m, m, W - 2 * m, H - 2 * m);
      for (let xx = m; xx <= W - m; xx += gap) { bulb(xx, m); bulb(xx, H - m); }
      for (let yy = m + gap; yy < H - m; yy += gap) { bulb(m, yy); bulb(W - m, yy); }
      return true;
    }
    // ---- checker
    case "checker_floor": {                                  // a checkered floor running back to a lit wall
      const hz = H * (tall ? .55 : .5);
      const wg = x.createLinearGradient(0, 0, 0, hz); wg.addColorStop(0, shade(p.ground, -.2)); wg.addColorStop(1, p.light); x.fillStyle = wg; x.fillRect(0, 0, W, hz);
      x.fillStyle = p.ground; x.fillRect(0, hz, W, H - hz);
      const dark = mix(p.ground, lum(p.ground) > .45 ? "#000000" : "#ffffff", .3), rows = 9, cols = 12, vx = W / 2;
      const Y = k => hz + (H - hz) * Math.pow(k / rows, 1.8), X = (c, y) => vx + (c - cols / 2) * (W * 1.9 / cols) * ((y - hz) / (H - hz));
      x.fillStyle = dark;
      for (let k = 0; k < rows; k++) for (let c = -4; c < cols + 4; c++) if ((k + c) % 2 === 0) {
        const y0 = Y(k), y1 = Y(k + 1); x.beginPath(); x.moveTo(X(c, y0), y0); x.lineTo(X(c + 1, y0), y0); x.lineTo(X(c + 1, y1), y1); x.lineTo(X(c, y1), y1); x.closePath(); x.fill();
      }
      const sh = x.createLinearGradient(0, hz, 0, hz + H * .12); sh.addColorStop(0, "rgba(0,0,0,.35)"); sh.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = sh; x.fillRect(0, hz, W, H * .12);
      return true;
    }
    case "checker_diamond": {                                // the checker turned to diamonds, two tones, lit behind the phones
      x.fillStyle = p.ground; x.fillRect(0, 0, W, H);
      const sq = Math.max(W, H) / r.pick([8, 11]); x.fillStyle = mix(p.ground, p.accent, .28);
      x.save(); x.translate(W / 2, H / 2); x.rotate(Math.PI / 4);
      for (let yy = -D; yy < D; yy += sq) for (let xx = -D; xx < D; xx += sq) if (((xx / sq | 0) + (yy / sq | 0)) % 2) x.fillRect(xx, yy, sq, sq);
      x.restore(); glow(cx, cy, D * .5, p.light, .45); return true;
    }
    // ---- candy paint
    case "candy_flames": {                                   // candy paint with hot-rod flames licking up from the bottom
      if (!vibeBackground("candy_flake", x, st, p, W, H, sc, r)) return false;
      const n = 7, base = H * 1.02, fw = W / (n - 1.5);
      const fg = x.createLinearGradient(0, H * .55, 0, H); fg.addColorStop(0, "#ffe066"); fg.addColorStop(.5, "#ff8c1a"); fg.addColorStop(1, "#d62828");
      x.save(); x.fillStyle = fg; x.strokeStyle = "rgba(255,255,255,.8)"; x.lineWidth = Math.max(1.5, W * .004);
      x.beginPath(); x.moveTo(0, base);
      for (let i = 0; i < n; i++) {
        const bx = i * fw - fw * .3, tip = H * r.uniform(.58, .76), tx = bx + fw * r.uniform(.6, 1);
        x.bezierCurveTo(bx + fw * .1, base - H * .2, tx - fw * .5, tip + H * .1, tx, tip);
        x.bezierCurveTo(tx - fw * .1, tip + H * .12, bx + fw * .9, base - H * .18, bx + fw, base - H * .05);
      }
      x.lineTo(W, base); x.closePath(); x.fill(); x.stroke(); x.restore(); return true;
    }
    case "candy_fade": {                                     // a two-candy fade across the panel under a clear-coat sweep
      const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, shade(p.ground, -.3)); g.addColorStop(.5, p.ground); g.addColorStop(1, mix(p.ground, p.accent, .55));
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      const n = Math.round(W * H / 260), k = Math.max(1, W / 540);
      ((r) => { for (let i = 0; i < n; i++) { x.fillStyle = r() < .7 ? `rgba(255,255,255,${r.uniform(.05, .4)})` : rgba(p.accent, r.uniform(.1, .45)); const s = r.uniform(.4, 1.6) * k; x.fillRect(r() * W, r() * H, s, s); } })(fork(r));
      const cl = x.createLinearGradient(0, H, W, 0); cl.addColorStop(.35, "rgba(255,255,255,0)"); cl.addColorStop(.47, "rgba(255,255,255,.22)"); cl.addColorStop(.52, "rgba(255,255,255,.05)"); cl.addColorStop(.6, "rgba(255,255,255,0)");
      x.fillStyle = cl; x.fillRect(0, 0, W, H); return true;
    }
    default: return false;
  }
}

// ------------------------------------------------------------ the themes' signs and grounds

/** The signs the themes add (themes.js THEME_BOARDS). The face of the room for the words
 *  is w by h at (ox, oy) in the canvas returned; B takes the sign's tilt. */
export function themeBoard(kind, w, h, s, p, st, r, extra, B) {
  const m = s * .6, shadow = (x, k = 1) => { x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = s * .28 * k; x.shadowOffsetY = s * .09 * k; };
  let c, ox = m, oy = m, x;
  switch (kind) {
    case "price_tag": {
      const tip = h * .42; c = canvas(w + m * 2 + tip, h + m * 2); ox = m + tip; x = c.getContext("2d");
      const card = ["#fff200", "#ffffff", "#ff9e1b", "#b8ff3a"].filter(k => Math.abs(lum(k) - lum(p.ground)) > .12)[0] || "#ffffff";
      x.save(); shadow(x);
      x.beginPath(); x.moveTo(ox, oy); x.lineTo(ox + w, oy); x.lineTo(ox + w, oy + h); x.lineTo(ox, oy + h); x.lineTo(ox - tip, oy + h / 2); x.closePath();
      x.fillStyle = card; x.fill(); x.restore();
      const hx = ox - tip * .5, hy = oy + h / 2, hr = Math.max(3, s * .12);
      x.globalCompositeOperation = "destination-out"; x.beginPath(); x.arc(hx, hy, hr, 0, TAU); x.fill(); x.globalCompositeOperation = "source-over";
      x.strokeStyle = "rgba(0,0,0,.35)"; x.lineWidth = Math.max(1, s * .03); x.beginPath(); x.arc(hx, hy, hr * 1.35, 0, TAU); x.stroke();
      x.strokeStyle = "#8a6a3c"; x.lineWidth = Math.max(1.5, s * .035); x.beginPath(); x.moveTo(hx, hy - hr); x.quadraticCurveTo(hx - tip * .3, oy - m * .2, m * .2, m * .15); x.stroke();
      x.strokeStyle = "rgba(0,0,0,.18)"; x.setLineDash([s * .1, s * .08]); x.strokeRect(ox + s * .15, oy + s * .15, w - s * .3, h - s * .3); x.setLineDash([]);
      B.rot = r.uniform(-4, 4) * Math.PI / 180;
      break;
    }
    case "chalkboard": {
      const f = s * .34; c = canvas(w + m * 2 + f * 2, h + m * 2 + f * 2); ox = m + f; oy = m + f; x = c.getContext("2d");
      x.save(); shadow(x); const wg = x.createLinearGradient(0, 0, 0, c.height); wg.addColorStop(0, "#8a5a36"); wg.addColorStop(1, "#5b3a22");
      x.fillStyle = wg; x.fillRect(ox - f, oy - f, w + f * 2, h + f * 2); x.restore();
      x.strokeStyle = "rgba(0,0,0,.25)"; x.lineWidth = 1; for (let k = 0; k < 6; k++) { const yy = oy - f + (h + f * 2) * (k + .5) / 6; x.beginPath(); x.moveTo(ox - f, yy); x.lineTo(ox - f * .2, yy + r.uniform(-2, 2)); x.stroke(); }
      const sg = x.createRadialGradient(ox + w / 2, oy + h / 2, 0, ox + w / 2, oy + h / 2, Math.hypot(w, h) * .7); sg.addColorStop(0, "#2f4a3d"); sg.addColorStop(1, "#1b2d25");
      x.fillStyle = sg; x.fillRect(ox, oy, w, h);
      x.save(); x.beginPath(); x.rect(ox, oy, w, h); x.clip();
      for (let k = 0; k < 14; k++) { x.fillStyle = `rgba(255,255,255,${r.uniform(.02, .06)})`; x.beginPath(); x.ellipse(ox + r() * w, oy + r() * h, w * r.uniform(.1, .3), h * r.uniform(.05, .15), r() * 3, 0, TAU); x.fill(); }
      x.restore();
      break;
    }
    case "receipt": {
      const tooth = s * .2; c = canvas(w + m * 2, h + m * 2 + tooth * 2); oy = m + tooth; x = c.getContext("2d");
      x.save(); shadow(x, .8); x.beginPath(); x.moveTo(ox, oy);
      for (let xx = ox; xx < ox + w; xx += tooth) { x.lineTo(xx + tooth / 2, oy - tooth); x.lineTo(Math.min(ox + w, xx + tooth), oy); }
      x.lineTo(ox + w, oy + h);
      for (let xx = ox + w; xx > ox; xx -= tooth) { x.lineTo(xx - tooth / 2, oy + h + tooth); x.lineTo(Math.max(ox, xx - tooth), oy + h); }
      x.closePath(); x.fillStyle = "#fbfbf7"; x.fill(); x.restore();
      x.strokeStyle = "rgba(0,0,0,.14)"; x.setLineDash([s * .06, s * .06]); x.lineWidth = 1;
      for (const yy of [oy + s * .2, oy + h - s * .2]) { x.beginPath(); x.moveTo(ox + s * .2, yy); x.lineTo(ox + w - s * .2, yy); x.stroke(); }
      x.setLineDash([]);
      B.rot = r.uniform(-2.5, 2.5) * Math.PI / 180;
      break;
    }
    case "wanted_poster": {
      c = canvas(w + m * 2, h + m * 2); x = c.getContext("2d");
      x.save(); shadow(x); x.fillStyle = "#e9d3a6"; x.fillRect(ox, oy, w, h); x.restore();
      const eg = x.createRadialGradient(ox + w / 2, oy + h / 2, Math.min(w, h) * .3, ox + w / 2, oy + h / 2, Math.hypot(w, h) * .62);
      eg.addColorStop(0, "rgba(120,70,20,0)"); eg.addColorStop(1, "rgba(90,45,10,.55)"); x.fillStyle = eg; x.fillRect(ox, oy, w, h);
      x.save(); x.beginPath(); x.rect(ox, oy, w, h); x.clip();
      for (let k = 0; k < 20; k++) { x.fillStyle = `rgba(90,50,15,${r.uniform(.03, .08)})`; x.beginPath(); x.arc(ox + r() * w, oy + r() * h, s * r.uniform(.1, .5), 0, TAU); x.fill(); }
      x.restore();
      for (const nx of [ox + s * .3, ox + w - s * .3]) { x.fillStyle = "#3b3b3b"; x.beginPath(); x.arc(nx, oy + s * .3, s * .09, 0, TAU); x.fill(); x.fillStyle = "rgba(255,255,255,.45)"; x.beginPath(); x.arc(nx - s * .03, oy + s * .27, s * .03, 0, TAU); x.fill(); }
      B.rot = r.uniform(-2, 2) * Math.PI / 180;
      break;
    }
    case "sticky_note": {
      c = canvas(w + m * 2, h + m * 2); x = c.getContext("2d");
      const note = ["#ffe45c", "#ff9ecf", "#8fe3ff", "#b8ff8a"].filter(k => Math.abs(lum(k) - lum(p.ground)) > .1)[0] || "#ffe45c";
      x.save(); shadow(x, .7);
      x.beginPath(); x.moveTo(ox, oy); x.lineTo(ox + w, oy); x.lineTo(ox + w, oy + h - s * .5); x.quadraticCurveTo(ox + w - s * .1, oy + h - s * .1, ox + w - s * .6, oy + h); x.lineTo(ox, oy + h); x.closePath();
      x.fillStyle = note; x.fill(); x.restore();
      const cg = x.createLinearGradient(ox + w - s * .6, oy + h - s * .5, ox + w, oy + h); cg.addColorStop(0, "rgba(0,0,0,0)"); cg.addColorStop(1, "rgba(0,0,0,.18)");
      x.fillStyle = cg; x.fillRect(ox + w - s * .7, oy + h - s * .6, s * .7, s * .6);
      x.save(); x.translate(ox + w / 2, oy); x.rotate(r.uniform(-.08, .08)); x.fillStyle = "rgba(255,255,255,.55)"; x.fillRect(-s * .7, -s * .18, s * 1.4, s * .36); x.restore();
      B.rot = r.uniform(-4, 4) * Math.PI / 180;
      break;
    }
    case "speech_bubble": {
      const tail = s * .7; c = canvas(w + m * 2, h + m * 2 + tail); x = c.getContext("2d");
      const tx = ox + w * (r() < .5 ? .28 : .72);
      const path = () => { rrect(x, ox, oy, w, h, Math.min(h * .45, s * .7)); x.moveTo(tx - s * .35, oy + h - 1); x.lineTo(tx + (tx < ox + w / 2 ? -s * .4 : s * .4), oy + h + tail); x.lineTo(tx + s * .35, oy + h - 1); };
      x.save(); shadow(x, .6); x.beginPath(); path(); x.fillStyle = "#ffffff"; x.fill(); x.restore();
      x.beginPath(); path(); x.strokeStyle = "#111111"; x.lineWidth = Math.max(2, s * .08); x.lineJoin = "round"; x.stroke();
      x.fillStyle = "#ffffff"; x.fillRect(tx - s * .31, oy + h - s * .09, s * .62, s * .16);
      break;
    }
    case "ticket_stub": {
      c = canvas(w + m * 2, h + m * 2); x = c.getContext("2d");
      const col = lum(p.plate) > .12 ? p.plate : "#e4002b", n = Math.min(h * .22, s * .35);
      x.save(); shadow(x); x.beginPath(); rrect(x, ox, oy, w, h, s * .12); x.fillStyle = col; x.fill(); x.restore();
      x.globalCompositeOperation = "destination-out";
      for (const nx of [ox, ox + w]) { x.beginPath(); x.arc(nx, oy + h / 2, n, 0, TAU); x.fill(); }
      x.globalCompositeOperation = "source-over";
      x.strokeStyle = lum(col) > .55 ? "rgba(0,0,0,.35)" : "rgba(255,255,255,.55)"; x.lineWidth = Math.max(1.5, s * .03);
      x.setLineDash([s * .08, s * .07]); x.strokeRect(ox + s * .18, oy + s * .18, w - s * .36, h - s * .36); x.setLineDash([]);
      B.rot = r.uniform(-3, 3) * Math.PI / 180;
      break;
    }
    case "led_panel": {
      c = canvas(w + m * 2, h + m * 2); x = c.getContext("2d");
      x.save(); shadow(x); rrect(x, ox, oy, w, h, s * .14); x.fillStyle = "#0b0b0d"; x.fill(); x.restore();
      x.strokeStyle = "#2c2c31"; x.lineWidth = Math.max(2, s * .08); rrect(x, ox, oy, w, h, s * .14); x.stroke();
      x.save(); rrect(x, ox, oy, w, h, s * .14); x.clip();
      const d = Math.max(3, s * .085); x.fillStyle = "rgba(255,176,0,.08)";
      for (let yy = oy + d / 2; yy < oy + h; yy += d) for (let xx = ox + d / 2; xx < ox + w; xx += d) { x.beginPath(); x.arc(xx, yy, d * .28, 0, TAU); x.fill(); }
      x.restore();
      break;
    }
    case "lightbox": {
      c = canvas(w + m * 2, h + m * 2); x = c.getContext("2d");
      x.save(); x.shadowColor = "rgba(255,255,240,.8)"; x.shadowBlur = s * .6; rrect(x, ox, oy, w, h, s * .16); x.fillStyle = "#ffffff"; x.fill(); x.restore();
      const g = x.createLinearGradient(0, oy, 0, oy + h); g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#eef0f2");
      rrect(x, ox, oy, w, h, s * .16); x.fillStyle = g; x.fill();
      x.strokeStyle = "#1c1c1f"; x.lineWidth = Math.max(2, s * .09); rrect(x, ox, oy, w, h, s * .16); x.stroke();
      break;
    }
    case "postcard": {
      c = canvas(w + m * 2, h + m * 2); x = c.getContext("2d");
      x.save(); shadow(x); x.fillStyle = "#fffdf6"; x.fillRect(ox, oy, w, h); x.restore();
      x.strokeStyle = "#1d3557"; x.lineWidth = Math.max(1.5, s * .035); x.strokeRect(ox + s * .14, oy + s * .14, w - s * .28, h - s * .28);
      const sw = s * .75, sh = s * .9, sx = ox + w - sw * .55, sy = oy - sh * .45;         // the stamp hangs off the corner, clear of the words
      x.save(); x.translate(sx + sw / 2, sy + sh / 2); x.rotate(.08);
      x.fillStyle = "#ffffff"; x.fillRect(-sw / 2, -sh / 2, sw, sh); x.fillStyle = "#e63946"; x.fillRect(-sw / 2 + s * .08, -sh / 2 + s * .08, sw - s * .16, sh - s * .16);
      x.fillStyle = "#ffd166"; x.beginPath(); x.arc(0, 0, sw * .22, 0, TAU); x.fill(); x.restore();
      x.strokeStyle = "rgba(29,53,87,.45)"; x.lineWidth = Math.max(1, s * .025);
      for (let k = 0; k < 3; k++) { x.beginPath(); for (let u = 0; u <= 20; u++) x.lineTo(sx - s * 1.4 + u * s * .07, sy + sh * .7 + k * s * .14 + Math.sin(u * .9) * s * .04); x.stroke(); }
      B.rot = r.uniform(-3, 3) * Math.PI / 180;
      break;
    }
    default: return null;
  }
  return { c, ox, oy };
}

/** The grounds the themes add (themes.js THEME_GROUNDS). Returns false for any other. */
export function themeGround(kind, x, st, p, W, H, sc, r) {
  const U = Math.min(W, H), D = Math.hypot(W, H), g = p.ground, l = p.light;
  const dark = lum(g) < .45, line = dark ? "#ffffff" : "#000000";
  switch (kind) {
    case "blueprint": {
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      const minor = U * .025;
      for (let k = 0, xx = 0; xx < W; xx += minor, k++) { x.fillStyle = rgba("#ffffff", k % 5 ? .07 : .16); x.fillRect(xx, 0, Math.max(1, W * .0012), H); }
      for (let k = 0, yy = 0; yy < H; yy += minor, k++) { x.fillStyle = rgba("#ffffff", k % 5 ? .07 : .16); x.fillRect(0, yy, W, Math.max(1, W * .0012)); }
      x.strokeStyle = rgba("#ffffff", .22); x.lineWidth = Math.max(1, W * .0015);
      for (let k = 0; k < 3; k++) { x.beginPath(); x.arc(r() * W, r() * H, U * r.uniform(.08, .2), 0, TAU); x.stroke(); }
      const vg = x.createRadialGradient(W / 2, H / 2, U * .2, W / 2, H / 2, D * .6); vg.addColorStop(0, rgba(l, .25)); vg.addColorStop(1, rgba(l, 0)); x.fillStyle = vg; x.fillRect(0, 0, W, H);
      return true;
    }
    case "newsprint": {
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      const cols = W / H > 1.2 ? 5 : 3, cw = W / cols, lh = U * .018;
      for (let c = 0; c < cols; c++) for (let yy = U * .05; yy < H - U * .03; yy += lh * 1.6) {
        if (r() < .06) continue;
        x.fillStyle = rgba("#000000", r.uniform(.06, .11)); x.fillRect(c * cw + cw * .08, yy, cw * r.uniform(.6, .84), lh * .55);
      }
      grain(x, W, H, r, 18, .35); return true;
    }
    case "kraft": {
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      blotches(x, W, H, r, 20, .12);
      x.lineWidth = Math.max(.6, W * .001);
      ((r) => { for (let i = 0; i < W * H / 900; i++) { const px = r() * W, py = r() * H, a = r() * TAU, L = U * r.uniform(.01, .04); x.strokeStyle = rgba(r() < .5 ? shade(g, -.35) : shade(g, .3), r.uniform(.15, .4)); x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * L, py + Math.sin(a) * L); x.stroke(); } })(fork(r));
      grain(x, W, H, r, 20, .3); return true;
    }
    case "wood": {
      const n = W / H > 1.2 ? 9 : 6, pw = W / n;
      for (let i = 0; i < n; i++) {
        const base = shade(g, r.uniform(-.12, .1)), gr = x.createLinearGradient(i * pw, 0, (i + 1) * pw, 0);
        gr.addColorStop(0, shade(base, -.12)); gr.addColorStop(.5, base); gr.addColorStop(1, shade(base, -.16)); x.fillStyle = gr; x.fillRect(i * pw, 0, pw + 1, H);
        x.strokeStyle = rgba(shade(base, -.4), .25); x.lineWidth = Math.max(1, W * .0015);
        for (let k = 0; k < 7; k++) { const x0 = i * pw + pw * r.uniform(.1, .9), ph = r() * 6; x.beginPath(); for (let yy = 0; yy <= H; yy += H / 40) x.lineTo(x0 + Math.sin(yy / H * 9 + ph) * pw * .05, yy); x.stroke(); }
        x.fillStyle = "rgba(0,0,0,.35)"; x.fillRect(i * pw - 1, 0, Math.max(1.5, W * .003), H);
      }
      return true;
    }
    case "tile": {
      x.fillStyle = shade(g, -.18); x.fillRect(0, 0, W, H);
      const th = U * .07, tw = th * 2, gap = Math.max(1.5, U * .004);
      for (let row = 0, yy = 0; yy < H; row++, yy += th) for (let xx = row % 2 ? -tw / 2 : 0; xx < W; xx += tw) {
        const gr = x.createLinearGradient(0, yy, 0, yy + th); gr.addColorStop(0, shade(g, .12)); gr.addColorStop(1, shade(g, -.04));
        rrect(x, xx + gap / 2, yy + gap / 2, tw - gap, th - gap, th * .12); x.fillStyle = gr; x.fill();
      }
      return true;
    }
    case "brushed_metal": {
      // lit by the phones' key light (keyLit): the sheet falls off from the top left, and the
      // light's reflection is a streak across the grain, not along it (lines brushed side to side
      // spread a highlight up and down), standing under the light and brightest level with it.
      // It was a band from the top right corner to the bottom left, dark at the other two: no one
      // light does that (owner, 2026-10-11: "not actually how shadows work")
      keyLit(x, W, H, mix(g, l, .6), shade(g, -.06));
      streak(x, W, H, l, W * .32, W * .085, .8);
      ((r) => { for (let i = 0; i < H * .9; i++) { x.fillStyle = rgba(r() < .5 ? "#ffffff" : "#000000", r.uniform(.02, .06)); x.fillRect(0, r() * H, W, Math.max(.5, H * .0012)); } })(fork(r));
      return true;
    }
    case "carbon": {
      x.fillStyle = shade(g, -.2); x.fillRect(0, 0, W, H);
      const cell = U * .03;
      for (let yy = 0, j = 0; yy < H; yy += cell, j++) for (let xx = 0, i = 0; xx < W; xx += cell, i++) {
        const hor = (i + j) % 2 === 0, gr = hor ? x.createLinearGradient(xx, yy, xx, yy + cell) : x.createLinearGradient(xx, yy, xx + cell, yy);
        gr.addColorStop(0, shade(g, -.25)); gr.addColorStop(.5, shade(l, -.05)); gr.addColorStop(1, shade(g, -.25));
        x.fillStyle = gr; x.fillRect(xx + .5, yy + .5, cell - 1, cell - 1);
      }
      const vg = x.createRadialGradient(sc[0], sc[1], 0, sc[0], sc[1], D * .6); vg.addColorStop(0, rgba(l, .18)); vg.addColorStop(1, rgba(l, 0)); x.fillStyle = vg; x.fillRect(0, 0, W, H);
      return true;
    }
    case "gingham": {
      x.fillStyle = "#fbf8f2"; x.fillRect(0, 0, W, H);
      const band = U * .06, col = lum(p.accent) < .8 && Math.abs(lum(p.accent) - .95) > .2 ? p.accent : g;
      for (let xx = 0; xx < W; xx += band * 2) { x.fillStyle = rgba(col, .38); x.fillRect(xx, 0, band, H); }
      for (let yy = 0; yy < H; yy += band * 2) { x.fillStyle = rgba(col, .38); x.fillRect(0, yy, W, band); }
      grain(x, W, H, r, 14, .25); return true;
    }
    case "starfield": {
      const gr = x.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, shade(g, -.3)); gr.addColorStop(1, g); x.fillStyle = gr; x.fillRect(0, 0, W, H);
      x.save(); x.globalCompositeOperation = "screen";
      for (let k = 0; k < 4; k++) { const bx = r() * W, by = r() * H, rad = U * r.uniform(.25, .5), gg = x.createRadialGradient(bx, by, 0, bx, by, rad); gg.addColorStop(0, rgba(k % 2 ? p.accent : l, .22)); gg.addColorStop(1, rgba(l, 0)); x.fillStyle = gg; x.fillRect(0, 0, W, H); }
      x.restore();
      ((r) => { for (let i = 0; i < W * H / 1800; i++) { x.fillStyle = `rgba(255,255,255,${r.uniform(.2, .9)})`; const s2 = r.uniform(.5, 1.8) * Math.max(1, W / 700); x.fillRect(r() * W, r() * H, s2, s2); } })(fork(r));
      return true;
    }
    case "pegboard": {
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      const step = U * .05;
      for (let yy = step / 2; yy < H; yy += step) for (let xx = step / 2; xx < W; xx += step) {
        x.fillStyle = rgba("#000000", .55); x.beginPath(); x.arc(xx, yy, step * .12, 0, TAU); x.fill();
        x.fillStyle = rgba("#ffffff", .12); x.beginPath(); x.arc(xx + step * .03, yy + step * .04, step * .12, 0, Math.PI); x.fill();
      }
      grain(x, W, H, r, 16, .25); return true;
    }
    case "diamond_plate": {
      // the same key light as Brushed metal: the plate falls off from the top left and shows the
      // light as a soft patch above and left of the middle; every raised bar is lit on its side
      // toward the light, dark on the far side, and casts its small shadow away from it. (Each
      // bar was shaded along its own length, so one row was lit from the lower right and the
      // next from the upper right, over a band from the top right corner to the bottom left.)
      keyLit(x, W, H, l, shade(g, -.1));
      const hi = x.createRadialGradient(W * .3, H * .25, 0, W * .3, H * .25, U * .6); hi.addColorStop(0, rgba(l, .4)); hi.addColorStop(1, rgba(l, 0)); x.fillStyle = hi; x.fillRect(0, 0, W, H);
      const step = U * .06, a = step * .3, b = step * .07, o = step * .03;
      const bar = (cx0, cy0, turn) => { x.save(); x.translate(cx0, cy0); x.rotate(turn); x.beginPath(); x.ellipse(0, 0, a, b, 0, 0, TAU); x.restore(); };
      for (let yy = 0, j = 0; yy < H + step; yy += step, j++) for (let xx = (j % 2) * step / 2; xx < W + step; xx += step) {
        const turn = (j % 2 ? 1 : -1) * Math.PI / 4, k = (j % 2 ? a : b) / Math.SQRT2;   // the bar's reach toward the light
        bar(xx + o, yy + o, turn); x.fillStyle = "rgba(0,0,0,.16)"; x.fill();
        const lg = x.createLinearGradient(xx - k, yy - k, xx + k, yy + k); lg.addColorStop(0, rgba("#ffffff", .35)); lg.addColorStop(1, rgba("#000000", .25));
        bar(xx, yy, turn); x.fillStyle = lg; x.fill();
      }
      return true;
    }
    case "racing_stripes": {
      x.fillStyle = l; x.fillRect(0, 0, W, H);
      const cols = [p.accent, g, p.plate || shade(g, -.3)], bw = U * .1, ang = r() < .5 ? -.35 : .35;
      x.save(); x.translate(W / 2, H * r.uniform(.4, .7)); x.rotate(ang);
      cols.forEach((col, i) => { x.fillStyle = col; x.fillRect(-D, (i - 1.5) * bw * 1.15, 2 * D, bw); });
      x.restore(); grain(x, W, H, r, 16, .3); return true;
    }
    case "holo": {
      const gr = x.createLinearGradient(0, 0, W, H);
      ["#ffd6f5", "#c7d2fe", "#a5f3fc", "#fef9c3", "#fbcfe8"].forEach((c2, i, a) => gr.addColorStop(i / (a.length - 1), c2));
      x.fillStyle = gr; x.fillRect(0, 0, W, H);
      x.save(); x.globalCompositeOperation = "soft-light";
      for (let k = 0; k < 5; k++) { const sh = x.createLinearGradient(0, H * r(), W, H * r()); sh.addColorStop(0, "rgba(255,255,255,0)"); sh.addColorStop(.5, "rgba(255,255,255,.7)"); sh.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = sh; x.fillRect(0, 0, W, H); }
      x.restore(); return true;
    }
    case "notebook": {
      x.fillStyle = "#fbfbf6"; x.fillRect(0, 0, W, H);
      const lh = U * .045;
      x.fillStyle = "rgba(60,110,200,.28)"; for (let yy = lh * 2; yy < H; yy += lh) x.fillRect(0, yy, W, Math.max(1, U * .002));
      x.fillStyle = "rgba(220,60,70,.45)"; x.fillRect(W * .12, 0, Math.max(1.5, U * .003), H);
      x.fillStyle = "rgba(0,0,0,.12)"; for (const f of [.2, .5, .8]) { x.beginPath(); x.arc(W * .05, H * f, U * .018, 0, TAU); x.fill(); }
      grain(x, W, H, r, 10, .2); return true;
    }
    default: return false;
  }
}

/* FRESH GROUNDS (owner, 2026-10-03: "Make more variety" ... backgrounds). Twelve new
   clean grounds in the house manner: soft, in the look's own palette, calm in the
   middle for the phones and the words. Candidates until the owner approves them
   (FRESH_REVIEW in catalog.js); a shuffle draws only approved ones. */
export const FRESH_GROUNDS = {
  studio_sweep: "Studio sweep",       // a photo studio's curved wall into the floor
  pill_stage:   "Stage pill",         // a rounded plinth the phones stand on
  arch_window:  "Arch",               // one tall soft arch behind the middle
  paper_cut:    "Paper cut",          // layered paper hills along the foot
  ribbon_wave:  "Ribbons",            // two broad soft ribbons across a corner
  concentric:   "Rounded rings",      // rounded frames stepping in to the middle
  split_soft:   "Soft split",         // two tones on a soft diagonal
  spot_floor:   "Spot on the floor",  // a pool of light on a dark stage floor
  bokeh_night:  "City bokeh",         // out-of-focus lights low in a night frame
  marble_soft:  "Soft marble",        // pale veins in a polished stone
  tile_gloss:   "Glossy tile",        // large glazed tiles with a sheen
  grid_glow:    "Horizon grid",       // a faint grid running to a lit horizon
  // the second batch (owner, 2026-10-04: "now more")
  sky_gradient: "Evening sky",        // a clean three-stop sky, no scenery
  pastel_blobs: "Pastel clouds",      // big soft pastel shapes, out of focus
  neon_frame:   "Neon frame",         // a glowing rounded frame round the edge
  halftone_fade:"Halftone fade",      // dots that fade from one corner
  diagonal_lines:"Pinstripe",         // fine diagonal pinstripes over a soft glow
  window_light: "Window light",       // soft window shadows across a wall
  podium_steps: "Steps",              // two broad steps the phones stand on
  sun_rays:     "Soft rays",          // wide soft rays from the top
  confetti_soft:"Soft confetti",      // a few blurred confetti flecks
  wave_lines:   "Line waves",         // thin parallel wavy lines
  checker_fade: "Fading checks",      // a checkerboard fading into the ground
  glow_orbs:    "Glow orbs",          // two glowing orbs behind the middle
  // colour (owner, 2026-10-04, of soft confetti: "maybe some background confetti like
  // this but with color"; "Keep going use creativity get more variety")
  confetti_pop: "Confetti",           // bright flecks in several colours, round the edges
  sprinkles:    "Sprinkles",          // little rounded sprinkles, like a cake top
  streamers:    "Streamers",          // curling party streamers from the corners
  polka_pop:    "Polka dots",         // big soft polka dots in two colours
  terrazzo:     "Terrazzo",           // a polished stone floor with coloured chips
  paper_shapes: "Paper shapes",       // cut-paper circles, triangles and squiggles
};
// the confetti colours: the look's accent, its plate, and a few brights that sit with them
const partyCols = p => [p.accent, p.plate || p.accent, "#ff4d6d", "#ffd60a", "#2ec4b6", "#4d7cff", "#ff8a3d", "#b56cff"]
  .filter((c, i, a) => c && a.indexOf(c) === i);
// a fleck's place: anywhere but the middle, where the phones and the words stand
const edgeSpot = (r, W, H, cx, cy, U, k = .34) => { for (let t = 0; t < 30; t++) { const x = r() * W, y = r() * H; if (Math.hypot((x - cx) / W, (y - cy) / H) > k) return [x, y]; } return [r() * W, r() < .5 ? r() * H * .12 : H - r() * H * .12]; };
export function freshGround(kind, x, st, p, W, H, sc, r) {
  if (!(kind in FRESH_GROUNDS)) return false;
  const [cx, cy] = sc, D = Math.hypot(W, H), U = Math.min(W, H), dark = lum(p.ground) < .4;
  const g = p.ground, l = p.light, a = p.accent;
  const lin = (x0, y0, x1, y1, stops) => { const gr = x.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  const rad = (gx, gy, r0, r1, stops) => { const gr = x.createRadialGradient(gx, gy, r0, gx, gy, r1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  const fill = (s) => { x.fillStyle = s; x.fillRect(0, 0, W, H); };
  switch (kind) {
    case "studio_sweep": {
      const fy = H * .72;
      fill(lin(0, 0, 0, H, [[0, shade(g, -.12)], [.55, l], [.72, mix(l, g, .35)], [1, shade(g, -.18)]]));
      x.save(); x.translate(cx, fy + U * .05); x.scale(1, .28); x.fillStyle = rad(0, 0, 0, U * .45, [[0, "rgba(0,0,0,.22)"], [1, "rgba(0,0,0,0)"]]); x.fillRect(-W, -U * 2, W * 2, U * 4); x.restore();
      fill(rad(cx, H * .35, 0, D * .6, [[0, rgba(l, .35)], [1, rgba(l, 0)]]));
      grain(x, W, H, r, 12, .25); return true;
    }
    case "pill_stage": {
      fill(lin(0, 0, 0, H, [[0, shade(g, -.15)], [1, g]]));
      fill(rad(cx, H * .4, 0, D * .55, [[0, rgba(l, .5)], [1, rgba(l, 0)]]));
      const pw = W * .78, ph = U * .12, px = cx - pw / 2, py = H * .8;
      x.fillStyle = shade(g, dark ? .14 : -.1); x.beginPath(); x.ellipse(cx, py + ph, pw / 2, ph * .55, 0, 0, TAU); x.fill();
      x.fillStyle = lin(px, 0, px + pw, 0, [[0, shade(l, -.12)], [.5, l], [1, shade(l, -.12)]]);
      x.beginPath(); x.ellipse(cx, py, pw / 2, ph * .55, 0, 0, TAU); x.fill();
      x.fillStyle = shade(g, dark ? .22 : -.05); x.fillRect(px, py, pw, ph); x.beginPath(); x.ellipse(cx, py + ph, pw / 2, ph * .55, 0, 0, Math.PI); x.fill();
      x.fillStyle = lin(px, 0, px + pw, 0, [[0, shade(l, -.08)], [.5, mix(l, "#ffffff", .25)], [1, shade(l, -.08)]]); x.beginPath(); x.ellipse(cx, py, pw / 2, ph * .55, 0, 0, TAU); x.fill();
      grain(x, W, H, r, 10, .2); return true;
    }
    case "arch_window": {
      fill(lin(0, 0, 0, H, [[0, g], [1, shade(g, -.12)]]));
      const aw = Math.min(W * .62, H * .5), ah = H * .78, ax = cx - aw / 2, ay = H - ah;
      x.save(); x.beginPath(); x.moveTo(ax, H); x.lineTo(ax, ay + aw / 2); x.arc(cx, ay + aw / 2, aw / 2, Math.PI, 0); x.lineTo(ax + aw, H); x.closePath();
      x.fillStyle = lin(0, ay, 0, H, [[0, mix(l, "#ffffff", .2)], [1, l]]); x.shadowColor = "rgba(0,0,0,.18)"; x.shadowBlur = U * .05; x.fill(); x.restore();
      grain(x, W, H, r, 10, .22); return true;
    }
    case "paper_cut": {
      fill(lin(0, 0, 0, H, [[0, l], [1, g]]));
      const n = 4;
      for (let i = 0; i < n; i++) {
        const base = H * (.62 + i * .1), amp = H * .04, ph0 = r() * TAU, f = r.uniform(.8, 1.6);
        x.save(); x.shadowColor = "rgba(0,0,0,.2)"; x.shadowBlur = U * .03; x.shadowOffsetY = -U * .006;
        x.fillStyle = mix(l, shade(g, -.25), (i + 1) / (n + 1)); x.beginPath(); x.moveTo(0, H);
        for (let xx = 0; xx <= W + 8; xx += 8) x.lineTo(xx, base + Math.sin(xx / W * TAU * f + ph0) * amp);
        x.lineTo(W, H); x.closePath(); x.fill(); x.restore();
      }
      grain(x, W, H, r, 14, .3); return true;
    }
    case "ribbon_wave": {
      fill(lin(0, 0, W, H, [[0, g], [1, shade(g, -.1)]]));
      const d = r() < .5 ? 1 : -1;
      [[.0, rgba(a, .22)], [.12, rgba(l, .28)]].forEach(([off, col], i) => {
        x.fillStyle = col; x.beginPath();
        const y0 = H * (.05 + off), w0 = U * (.16 + .05 * i);
        x.moveTo(d > 0 ? -W * .1 : W * 1.1, y0);
        x.bezierCurveTo(W * .35, y0 + H * .35, W * .65, y0 - H * .1, d > 0 ? W * 1.1 : -W * .1, y0 + H * .5);
        x.lineTo(d > 0 ? W * 1.1 : -W * .1, y0 + H * .5 + w0);
        x.bezierCurveTo(W * .65, y0 - H * .1 + w0, W * .35, y0 + H * .35 + w0, d > 0 ? -W * .1 : W * 1.1, y0 + w0);
        x.closePath(); x.fill();
      });
      grain(x, W, H, r, 10, .2); return true;
    }
    case "concentric": {
      fill(g);
      const n = 6;
      for (let i = 0; i < n; i++) {
        const k = 1 - i / n, w = W * (.2 + .95 * k), h = H * (.2 + .95 * k), rr = Math.min(w, h) * .12;
        x.fillStyle = mix(g, l, (i + 1) / (n + 1)); x.shadowColor = "rgba(0,0,0,.18)"; x.shadowBlur = U * .02;
        x.beginPath(); x.roundRect ? x.roundRect(cx - w / 2, cy - h / 2, w, h, rr) : x.rect(cx - w / 2, cy - h / 2, w, h); x.fill();
      }
      grain(x, W, H, r, 10, .2); return true;
    }
    case "split_soft": {
      fill(g);
      const t = r.uniform(-.2, .2);
      x.save(); x.filter = `blur(${Math.round(U * .02)}px)`; x.fillStyle = mix(g, l, .9);
      x.beginPath(); x.moveTo(W * (.55 + t), -U * .1); x.lineTo(W + U * .1, -U * .1); x.lineTo(W + U * .1, H + U * .1); x.lineTo(W * (.35 + t), H + U * .1); x.closePath(); x.fill(); x.restore();
      grain(x, W, H, r, 12, .25); return true;
    }
    case "spot_floor": {
      const deep = shade(g, dark ? -.35 : -.55);
      fill(lin(0, 0, 0, H, [[0, deep], [.7, shade(deep, .08)], [1, deep]]));
      x.save(); x.globalCompositeOperation = "lighter";
      x.fillStyle = lin(0, 0, 0, H * .8, [[0, rgba(l, .0)], [1, rgba(l, .22)]]);
      x.beginPath(); x.moveTo(cx - W * .08, 0); x.lineTo(cx + W * .08, 0); x.lineTo(cx + W * .36, H * .82); x.lineTo(cx - W * .36, H * .82); x.closePath(); x.fill(); x.restore();
      x.save(); x.translate(cx, H * .82); x.scale(1, .22); x.fillStyle = rad(0, 0, 0, W * .42, [[0, rgba(l, .55)], [1, rgba(l, 0)]]); x.fillRect(-W, -W, W * 2, W * 2); x.restore();
      grain(x, W, H, r, 12, .3); return true;
    }
    case "bokeh_night": {
      const deep = shade(g, dark ? -.3 : -.6);
      fill(lin(0, 0, 0, H, [[0, deep], [1, shade(deep, .1)]]));
      for (let i = 0; i < 40; i++) {
        const bx = r() * W, by = H * (.62 + r() * .38), br = U * r.uniform(.015, .05), col = r() < .5 ? a : l;
        x.fillStyle = rad(bx, by, 0, br, [[0, rgba(col, .45)], [.7, rgba(col, .3)], [1, rgba(col, 0)]]); x.beginPath(); x.arc(bx, by, br, 0, TAU); x.fill();
      }
      grain(x, W, H, r, 12, .3); return true;
    }
    case "marble_soft": {
      fill(lin(0, 0, W, H, [[0, l], [1, mix(l, g, .25)]]));
      x.save(); x.strokeStyle = rgba(shade(g, -.3), .32); x.lineCap = "round";
      for (let i = 0; i < 9; i++) {
        let px = r() * W, py = -U * .1; x.lineWidth = U * r.uniform(.002, .008); x.beginPath(); x.moveTo(px, py);
        for (let k = 0; k < 14; k++) { px += r.uniform(-.12, .2) * U; py += H / 12; x.lineTo(px, py); }
        x.stroke();
      }
      x.restore(); grain(x, W, H, r, 8, .2); return true;
    }
    case "tile_gloss": {
      fill(l);
      const s = U * .22, m = Math.max(1, s * .04);
      for (let y = 0; y < H; y += s) for (let xx = 0; xx < W; xx += s) {
        x.fillStyle = mix(l, g, r.uniform(.15, .35)); x.fillRect(xx + m, y + m, s - m * 2, s - m * 2);
        x.fillStyle = lin(xx, y, xx + s, y + s, [[0, "rgba(255,255,255,.22)"], [.45, "rgba(255,255,255,0)"]]); x.fillRect(xx + m, y + m, s - m * 2, s - m * 2);
      }
      fill(rad(cx, cy, 0, D * .6, [[0, "rgba(0,0,0,0)"], [1, "rgba(0,0,0,.18)"]]));
      grain(x, W, H, r, 8, .2); return true;
    }
    case "sky_gradient": {
      fill(lin(0, 0, 0, H, [[0, shade(g, dark ? -.25 : -.45)], [.55, g], [1, mix(a, l, .55)]]));
      fill(rad(cx, H, 0, W * .8, [[0, rgba(a, .35)], [1, rgba(a, 0)]]));
      grain(x, W, H, r, 10, .2); return true;
    }
    case "pastel_blobs": {
      fill(mix(l, "#ffffff", .25));
      x.save(); x.filter = `blur(${Math.round(U * .06)}px)`;
      [[.2, .25, a], [.8, .2, g], [.3, .85, mix(a, l, .5)], [.85, .8, mix(g, "#ffffff", .4)]].forEach(([u, v, col]) => { x.fillStyle = rgba(col, .55); x.beginPath(); x.arc(W * u, H * v, U * r.uniform(.22, .32), 0, TAU); x.fill(); });
      x.restore(); grain(x, W, H, r, 8, .2); return true;
    }
    case "neon_frame": {
      const deep = shade(g, dark ? -.35 : -.65); fill(lin(0, 0, 0, H, [[0, deep], [1, shade(deep, .08)]]));
      const m = U * .05, rr = U * .06, col = lum(a) > .3 ? a : "#7cf5ff";
      x.save(); x.shadowColor = col; x.shadowBlur = U * .035; x.strokeStyle = col; x.lineWidth = Math.max(2, U * .008);
      x.beginPath(); x.roundRect ? x.roundRect(m, m, W - 2 * m, H - 2 * m, rr) : x.rect(m, m, W - 2 * m, H - 2 * m); x.stroke(); x.stroke();
      x.shadowBlur = 0; x.strokeStyle = "rgba(255,255,255,.85)"; x.lineWidth = Math.max(1, U * .0025); x.stroke(); x.restore();
      grain(x, W, H, r, 10, .25); return true;
    }
    case "halftone_fade": {
      fill(lin(0, 0, W, H, [[0, g], [1, shade(g, -.08)]]));
      const step = U * .03, ox = r() < .5 ? 0 : W, oy = H;
      x.fillStyle = rgba(dark ? l : shade(g, -.35), .5);
      for (let yy = step / 2; yy < H; yy += step) for (let xx = step / 2; xx < W; xx += step) {
        const d = Math.hypot(xx - ox, yy - oy) / D, rad0 = step * .45 * Math.max(0, 1 - d * 1.6);
        if (rad0 > .4) { x.beginPath(); x.arc(xx, yy, rad0, 0, TAU); x.fill(); }
      }
      grain(x, W, H, r, 8, .2); return true;
    }
    case "diagonal_lines": {
      fill(g); fill(rad(cx, cy, 0, D * .6, [[0, rgba(l, .45)], [1, rgba(l, 0)]]));
      x.save(); x.strokeStyle = rgba(dark ? "#ffffff" : "#000000", .06); x.lineWidth = Math.max(1, U * .004);
      const per = U * .025; x.beginPath(); for (let k = -H; k < W + H; k += per) { x.moveTo(k, 0); x.lineTo(k - H, H); } x.stroke(); x.restore();
      grain(x, W, H, r, 8, .2); return true;
    }
    case "window_light": {
      fill(lin(0, 0, W, H, [[0, mix(l, g, .3)], [1, g]]));
      x.save(); x.filter = `blur(${Math.round(U * .018)}px)`; x.fillStyle = rgba("#000000", dark ? .25 : .12);
      x.translate(W * .1, -H * .05); x.transform(1, 0, -.45, 1, 0, 0);
      const pw = W * .16, gap = W * .04;
      for (let j = 0; j < 3; j++) x.fillRect(W * .2 + j * (pw + gap), H * .02, gap * .9, H * 1.1);
      x.fillRect(0, H * .48, W * 1.4, gap * .9);
      x.restore(); grain(x, W, H, r, 10, .2); return true;
    }
    case "podium_steps": {
      fill(lin(0, 0, 0, H, [[0, g], [1, shade(g, -.1)]]));
      fill(rad(cx, H * .35, 0, D * .55, [[0, rgba(l, .4)], [1, rgba(l, 0)]]));
      const y1 = H * .8, y2 = H * .88, w1 = W * .6, w2 = W * .86;
      x.fillStyle = shade(l, -.06); x.fillRect(cx - w1 / 2, y1, w1, y2 - y1); x.fillStyle = shade(l, -.14); x.fillRect(cx - w1 / 2, y1 + (y2 - y1) * .82, w1, (y2 - y1) * .18);
      x.fillStyle = shade(l, -.1); x.fillRect(cx - w2 / 2, y2, w2, H * .07); x.fillStyle = shade(l, -.2); x.fillRect(cx - w2 / 2, y2 + H * .055, w2, H * .015);
      grain(x, W, H, r, 10, .22); return true;
    }
    case "sun_rays": {
      fill(lin(0, 0, 0, H, [[0, mix(g, l, .4)], [1, g]]));
      x.save(); x.globalCompositeOperation = "lighter"; x.filter = `blur(${Math.round(U * .02)}px)`;
      for (let i = -4; i <= 4; i++) { const t0 = i * .16; x.fillStyle = rgba(l, i % 2 ? .06 : .11); x.beginPath(); x.moveTo(cx, -H * .2); x.lineTo(cx + Math.tan(t0 - .05) * H * 1.4, H * 1.2); x.lineTo(cx + Math.tan(t0 + .05) * H * 1.4, H * 1.2); x.closePath(); x.fill(); }
      x.restore(); grain(x, W, H, r, 10, .2); return true;
    }
    case "confetti_soft": {
      fill(lin(0, 0, 0, H, [[0, l], [1, mix(l, g, .4)]]));
      x.save(); x.filter = `blur(${Math.round(U * .004)}px)`;
      const cols = [a, g, p.plate || a, shade(a, .3)];
      for (let i = 0; i < 26; i++) { const px = r() * W, py = r() * H; if (Math.hypot(px - cx, py - cy) < U * .32) continue;
        x.save(); x.translate(px, py); x.rotate(r() * TAU); x.fillStyle = rgba(cols[i % cols.length], .55); x.fillRect(-U * .012, -U * .005, U * .024, U * .01); x.restore(); }
      x.restore(); grain(x, W, H, r, 8, .2); return true;
    }
    case "wave_lines": {
      fill(lin(0, 0, W, H, [[0, g], [1, shade(g, dark ? .08 : -.08)]]));
      x.save(); x.strokeStyle = rgba(dark ? l : shade(g, -.35), .22); x.lineWidth = Math.max(1, U * .003);
      const n = 18, amp = H * .02;
      for (let i = 0; i < n; i++) { const y0 = H * (i + .5) / n; x.beginPath(); for (let xx = 0; xx <= W + 8; xx += 8) x.lineTo(xx, y0 + Math.sin(xx / W * TAU * 1.5 + i * .35) * amp); x.stroke(); }
      x.restore(); grain(x, W, H, r, 8, .2); return true;
    }
    case "checker_fade": {
      fill(g); const s2 = U * .08;
      for (let yy = 0; yy < H; yy += s2) for (let xx = 0; xx < W; xx += s2) if (((xx / s2) + (yy / s2)) % 2 < 1) {
        const k = Math.max(0, 1 - (yy / H) * 1.4); if (k <= 0) continue; x.fillStyle = rgba(dark ? l : shade(g, -.3), .36 * k); x.fillRect(xx, yy, s2, s2); }
      grain(x, W, H, r, 8, .2); return true;
    }
    case "glow_orbs": {
      const deep = shade(g, dark ? -.25 : -.5); fill(deep);
      x.save(); x.globalCompositeOperation = "lighter";
      fill(rad(cx - W * .18, cy - H * .05, 0, U * .45, [[0, rgba(a, .45)], [1, rgba(a, 0)]]));
      fill(rad(cx + W * .2, cy + H * .08, 0, U * .4, [[0, rgba(l, .35)], [1, rgba(l, 0)]]));
      x.restore(); grain(x, W, H, r, 10, .25); return true;
    }
    case "confetti_pop": {
      fill(lin(0, 0, 0, H, [[0, l], [1, mix(l, g, .35)]]));
      const cols = partyCols(p);
      for (let i = 0; i < 70; i++) {
        const [px, py] = edgeSpot(r, W, H, cx, cy, U, .3), col = cols[i % cols.length], kind = i % 3, sz = U * r.uniform(.012, .022);
        x.save(); x.translate(px, py); x.rotate(r() * TAU); x.globalAlpha = r.uniform(.75, .95); x.fillStyle = col;
        if (kind === 0) x.fillRect(-sz, -sz * .45, sz * 2, sz * .9);
        else if (kind === 1) { x.beginPath(); x.arc(0, 0, sz * .7, 0, TAU); x.fill(); }
        else { x.beginPath(); x.moveTo(-sz, sz * .6); x.lineTo(sz, sz * .6); x.lineTo(0, -sz * .9); x.closePath(); x.fill(); }
        x.restore();
      }
      grain(x, W, H, r, 8, .18); return true;
    }
    case "sprinkles": {
      fill(lin(0, 0, W, H, [[0, mix(l, "#ffffff", .2)], [1, l]]));
      const cols = partyCols(p); x.save(); x.lineCap = "round";
      for (let i = 0; i < 120; i++) {
        const [px, py] = edgeSpot(r, W, H, cx, cy, U, .28), a0 = r() * TAU, len = U * r.uniform(.014, .024);
        x.strokeStyle = cols[i % cols.length]; x.lineWidth = U * .008; x.beginPath(); x.moveTo(px - Math.cos(a0) * len / 2, py - Math.sin(a0) * len / 2); x.lineTo(px + Math.cos(a0) * len / 2, py + Math.sin(a0) * len / 2); x.stroke();
      }
      x.restore(); grain(x, W, H, r, 8, .15); return true;
    }
    case "streamers": {
      fill(lin(0, 0, 0, H, [[0, g], [1, shade(g, dark ? .06 : -.06)]]));
      const cols = partyCols(p); x.save(); x.lineCap = "round";
      for (let i = 0; i < 7; i++) {
        const fromLeft = i % 2 === 0, y0 = H * r.uniform(-.05, .3) + (i > 3 ? H * .65 : 0);
        x.strokeStyle = rgba(cols[i % cols.length], .85); x.lineWidth = U * r.uniform(.008, .013); x.beginPath();
        for (let k = 0; k <= 40; k++) { const t = k / 40, xx = fromLeft ? t * W * .38 : W - t * W * .38, yy = y0 + t * H * .12 + Math.sin(t * TAU * 2 + i) * U * .045; k ? x.lineTo(xx, yy) : x.moveTo(xx, yy); }
        x.stroke();
      }
      x.restore(); grain(x, W, H, r, 8, .2); return true;
    }
    case "polka_pop": {
      fill(l); const cols = [a, p.plate || shade(a, -.2)], st = U * .16;
      for (let yy = 0, row = 0; yy < H + st; yy += st * .87, row++) for (let xx = row % 2 ? st / 2 : 0; xx < W + st; xx += st) {
        const d = Math.hypot((xx - cx) / W, (yy - cy) / H); x.fillStyle = rgba(cols[(row + Math.round(xx / st)) % 2], d < .3 ? .12 : .32);
        x.beginPath(); x.arc(xx, yy, st * .22, 0, TAU); x.fill(); }
      grain(x, W, H, r, 8, .15); return true;
    }
    case "terrazzo": {
      fill(mix(l, "#ffffff", .3)); const cols = partyCols(p).concat([shade(g, -.2), mix(l, g, .5)]);
      for (let i = 0; i < 160; i++) { const px = r() * W, py = r() * H, rr = U * r.uniform(.006, .022);
        x.fillStyle = rgba(cols[i % cols.length], Math.hypot((px - cx) / W, (py - cy) / H) < .28 ? .35 : .8); x.beginPath();
        for (let k = 0; k < 6; k++) { const a0 = k / 6 * TAU, q = rr * r.uniform(.6, 1.2); k ? x.lineTo(px + Math.cos(a0) * q, py + Math.sin(a0) * q) : x.moveTo(px + Math.cos(a0) * q, py + Math.sin(a0) * q); }
        x.closePath(); x.fill(); }
      grain(x, W, H, r, 10, .2); return true;
    }
    case "paper_shapes": {
      fill(lin(0, 0, 0, H, [[0, l], [1, mix(l, g, .25)]])); const cols = partyCols(p);
      for (let i = 0; i < 12; i++) {
        const [px, py] = edgeSpot(r, W, H, cx, cy, U, .36), col = cols[i % cols.length], sz = U * r.uniform(.04, .07);
        x.save(); x.translate(px, py); x.rotate(r() * TAU); x.shadowColor = "rgba(0,0,0,.18)"; x.shadowBlur = U * .012; x.shadowOffsetY = U * .006; x.fillStyle = col; x.strokeStyle = col;
        if (i % 3 === 0) { x.beginPath(); x.arc(0, 0, sz * .6, 0, TAU); x.fill(); }
        else if (i % 3 === 1) { x.beginPath(); x.moveTo(-sz * .6, sz * .5); x.lineTo(sz * .6, sz * .5); x.lineTo(0, -sz * .55); x.closePath(); x.fill(); }
        else { x.lineWidth = sz * .18; x.lineCap = "round"; x.beginPath(); for (let k = 0; k <= 20; k++) { const t = k / 20; const xx = (t - .5) * sz * 1.8, yy = Math.sin(t * TAU * 1.5) * sz * .25; k ? x.lineTo(xx, yy) : x.moveTo(xx, yy); } x.stroke(); }
        x.restore();
      }
      grain(x, W, H, r, 8, .18); return true;
    }
    case "grid_glow": {
      const hz = H * .58, deep = shade(g, dark ? -.3 : -.55);
      fill(lin(0, 0, 0, H, [[0, deep], [hz / H, shade(deep, .12)], [1, deep]]));
      fill(rad(cx, hz, 0, W * .55, [[0, rgba(a, .35)], [1, rgba(a, 0)]]));
      x.save(); x.strokeStyle = rgba(l, .16); x.lineWidth = Math.max(1, U * .002); x.beginPath();
      for (let i = -12; i <= 12; i++) { x.moveTo(cx + i * W * .02, hz); x.lineTo(cx + i * W * .2, H); }
      for (let k = 1; k < 10; k++) { const yy = hz + (H - hz) * (k / 10) ** 1.8; x.moveTo(0, yy); x.lineTo(W, yy); }
      x.stroke(); x.restore();
      grain(x, W, H, r, 10, .25); return true;
    }
  }
  return false;
}


/* ══════════════════════════════════════════════════════════════════════════════════════════
   THE FULL AD'S STYLES (2026-11-18; spec/full-styles.json, motion/full-styles.js)

   The owner, of the full ads and the recipes they draw: "notice how it's all same spiky circle?",
   "and there's no variety in the text pure outlines?", "Also don't see any gradients really?".
   A seed now draws a sticker shape, a headline treatment, an entrance and a number treatment from
   one table; these are the sticker shapes, the gradient a plate may wear, and the two-colour
   gradient grounds, every one in the card's own two colour families (rules 95 and 139).
   ══════════════════════════════════════════════════════════════════════════════════════════ */

/** OKLCH to sRGB hex, the chroma eased down until the colour is in gamut. */
export function okHex(L, C, h) {
  for (let c = Math.max(0, C); c >= 0; c -= .004) {
    const a = c * Math.cos(h * Math.PI / 180), b = c * Math.sin(h * Math.PI / 180);
    const l = (L + .3963377774 * a + .2158037573 * b) ** 3, m = (L - .1055613458 * a - .0638541728 * b) ** 3, s = (L - .0894841775 * a - 1.291485548 * b) ** 3;
    const rgb = [4.0767416621 * l - 3.3077115913 * m + .2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s, -.0041960863 * l - .7034186147 * m + 1.707614701 * s];
    if (rgb.every(v => v >= -.001 && v <= 1.001)) {
      const f = v => { v = Math.min(1, Math.max(0, v)); return Math.round(255 * (v <= .0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - .055)); };
      return "#" + rgb.map(v => f(v).toString(16).padStart(2, "0")).join("");
    }
  }
  const g = Math.round(255 * Math.min(1, Math.max(0, L)));
  return "#" + [g, g, g].map(v => v.toString(16).padStart(2, "0")).join("");
}
/** The same colour, lighter or deeper by dL of OKLCH lightness: its hue and chroma kept. */
export function toneOf(hex, dL) { const k = oklchOf(hex); return okHex(Math.min(.985, Math.max(.04, k.L + dL)), k.C, k.h); }

/** The two ends of a fill lit from above, [top, foot], never harder to read on than the flat fill (the
 *  roadmap, 2026-11-18: "a gradient plate keeps the contrast the solid plate had"): the fill's own
 *  colour at one end, the same hue moved away from its ink at the other, so under light ink the foot
 *  deepens and over dark ink the top lifts, and every point of it gives the ink at least the flat
 *  fill's contrast. A fill at the end of the scale, which cannot move away, stays flat (top = foot). */
export function gradientEnds(fill, ink) {
  const lightInk = lum(ink) > lum(fill), flat = contrastOf(ink, fill);
  for (const d of [.14, .1, .06]) {
    const top = lightInk ? fill : toneOf(fill, d), foot = lightInk ? toneOf(fill, -d) : fill, moved = lightInk ? foot : top;
    if (moved !== fill && contrastOf(ink, moved) >= flat + .05) return [top, foot];
  }
  return [fill, fill];
}
/** A fill lit from above (gradientEnds) as a canvas gradient from (x0, y0) to (x1, y1); the flat fill
 *  where it cannot bend, or where the ink would read under minCr (or under the flat fill's own) on it. */
export function fillGradient(ctx, x0, y0, x1, y1, fill, ink, minCr = 3) {
  const [top, foot] = gradientEnds(fill, ink);
  if (top === foot || Math.min(contrastOf(ink, top), contrastOf(ink, foot)) < Math.min(minCr, contrastOf(ink, fill))) return fill;
  const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, top); g.addColorStop(1, foot); return g;
}

/** The sticker's shapes, beside the starburst (drawStarburst, which Any look keeps). */
export const STICKER_SHAPES = ["starburst", "seal", "badge", "ribbon", "tag", "stamp", "pill"];
const STICKER_TILT = { starburst: -12, seal: -8, badge: -6, ribbon: -4, tag: -12, stamp: -9, pill: -10 };
/** The room each shape leaves its words, as a share of R: [width, height]. Every shape stands inside the
 *  circle of radius R the layout gave the starburst, tilted or not (its farthest corner within .99 R): a
 *  ribbon whose tails reached 1.14 R ran into the frame's margin where the room sits by the edge
 *  (galaxy, switch, jdm in Easy Mode's tall and wide sizes, 2026-11-18). */
const STICKER_BOX = { starburst: [1.3, 1.15], seal: [1.28, 1.08], badge: [1.34, 1.1], ribbon: [1.16, .54], tag: [1.2, .76], stamp: [1.32, .52], pill: [1.52, .6] };

/** One sticker, centred on (cx, cy) inside a circle of radius R: its shape, its fill (flat or lit
 *  from above when grad), its ink, its words fitted to the shape's own room; it pops in at t0 and
 *  sways a little, as the starburst does. */
export function drawSticker(ctx, shape, cx, cy, R, text, fill, ink, t, t0, fontName, grad = false) {
  shape = STICKER_SHAPES.includes(shape) ? shape : "starburst";
  // the fill (2026-11-18, rule 146): flat, lit from above (grad true or "gradient"), striped, dotted, a
  // foil's sheen (fillTexture), or the outline alone: no plate, so its edge, its rings and its words are
  // all in the fill, the card's own ink, which reads on the ground
  const mode = grad === true ? "gradient" : typeof grad === "string" && grad ? grad : "solid", line = mode === "outline";
  if (shape === "starburst" && mode === "solid") return drawStarburst(ctx, cx, cy, R, text, fill, ink, t, t0, fontName);
  const q = prog(t, t0, .35); if (q <= 0) return;
  const sc = Math.max(.01, outBack(q, 2.6)), rot = (STICKER_TILT[shape] + Math.sin((t - t0) * 2.4) * 4) * Math.PI / 180;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(sc, sc);
  if (line) ink = fill;
  const paint = (y0, y1, f = fill) => mode === "gradient" ? fillGradient(ctx, 0, y0, 0, y1, f, ink, 3) : f;
  const shadow = () => { ctx.shadowColor = line ? "rgba(0,0,0,.28)" : "rgba(0,0,0,.35)"; ctx.shadowBlur = R * (line ? .06 : .15); ctx.shadowOffsetY = R * (line ? .02 : .05); };
  const flat = () => { ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; };
  // the shape's body on the path just drawn: filled and textured, or its edge alone
  const body = (y0, y1, f = fill) => {
    if (line) { ctx.lineWidth = R * .075; ctx.strokeStyle = f; ctx.stroke(); flat(); return; }
    ctx.fillStyle = paint(y0, y1, f); ctx.fill(); flat(); fillTexture(ctx, mode, f, ink, -R * 1.1, y0, R * 1.1, y1);
  };
  const ring = (rr, w) => { ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.lineWidth = w; ctx.strokeStyle = ink; ctx.stroke(); };
  switch (shape) {
    case "starburst": {
      const n = 18; ctx.beginPath();
      for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU, rr = i % 2 ? R * .78 : R; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      ctx.closePath(); shadow(); body(-R, R); flat(); if (!line) { ctx.lineWidth = R * .05; ctx.strokeStyle = ink; ctx.stroke(); } break;
    }
    case "seal": {   // a scalloped seal, a thin ring inside its edge
      const n = 22; ctx.beginPath();
      for (let i = 0; i <= 180; i++) { const a = i / 180 * TAU, rr = R * (.93 + .07 * Math.cos(n * a)); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      ctx.closePath(); shadow(); body(-R, R); ring(R * .79, R * .035); break;
    }
    case "badge": {  // a round badge with a ring
      ctx.beginPath(); ctx.arc(0, 0, R * .97, 0, TAU); shadow(); body(-R, R);
      ring(R * .86, R * .05); if (!line) ring(R * .97, R * .02); break;
    }
    case "ribbon": { // a banner with folded, notched tails behind it
      const bw = R * 1.408, bh = R * .74, tw = R * .42, th = R * .56, dy = R * .06, tail = toneOf(fill, -.12);   // the tails' far corners at .99 R
      // (an outline alone is the banner without its folded tails: their edges would cross behind its words)
      if (!line) [-1, 1].forEach(sd => {
        const x0 = sd * (bw / 2 - tw * .35), x1 = sd * (bw / 2 + tw * .55);
        ctx.beginPath(); ctx.moveTo(x0, -th / 2 + dy); ctx.lineTo(x1, -th / 2 + dy); ctx.lineTo(x1 - sd * tw * .32, dy); ctx.lineTo(x1, th / 2 + dy); ctx.lineTo(x0, th / 2 + dy); ctx.closePath();
        shadow(); ctx.fillStyle = tail; ctx.fill(); flat();
      });
      rrect(ctx, -bw / 2, -bh / 2, bw, bh, R * .06); shadow(); body(-bh / 2, bh / 2);
      ctx.lineWidth = R * .025; ctx.strokeStyle = ink; rrect(ctx, -bw / 2 + R * .07, -bh / 2 + R * .07, bw - R * .14, bh - R * .14, R * .04); ctx.stroke(); break;
    }
    case "tag": {    // a price tag, its point to the left and a punched hole
      const tw = R * 1.8, th = R * 1, x0 = -tw / 2, pt = th * .42;   // its rounded corners at .99 R
      ctx.beginPath(); ctx.moveTo(x0 + pt, -th / 2); ctx.lineTo(tw / 2 - R * .08, -th / 2); ctx.quadraticCurveTo(tw / 2, -th / 2, tw / 2, -th / 2 + R * .08);
      ctx.lineTo(tw / 2, th / 2 - R * .08); ctx.quadraticCurveTo(tw / 2, th / 2, tw / 2 - R * .08, th / 2); ctx.lineTo(x0 + pt, th / 2); ctx.lineTo(x0, 0); ctx.closePath();
      shadow(); body(-th / 2, th / 2);
      if (!line) { ctx.save(); ctx.globalCompositeOperation = "destination-out"; ctx.beginPath(); ctx.arc(x0 + pt * .62, 0, R * .09, 0, TAU); ctx.fill(); ctx.restore(); }
      ctx.beginPath(); ctx.arc(x0 + pt * .62, 0, R * .13, 0, TAU); ctx.lineWidth = R * .025; ctx.strokeStyle = ink; ctx.stroke();
      ctx.translate(R * .12, 0); break;   // the words sit right of the hole
    }
    case "stamp": {  // a rubber stamp's plate: a double rule inside its edge
      const sw = R * 1.76, sh = R * .92;   // its corners at .99 R
      rrect(ctx, -sw / 2, -sh / 2, sw, sh, R * .07); shadow(); body(-sh / 2, sh / 2);
      ctx.strokeStyle = ink; ctx.lineWidth = R * .05; rrect(ctx, -sw / 2 + R * .08, -sh / 2 + R * .08, sw - R * .16, sh - R * .16, R * .05); ctx.stroke();
      ctx.lineWidth = R * .022; rrect(ctx, -sw / 2 + R * .17, -sh / 2 + R * .17, sw - R * .34, sh - R * .34, R * .03); ctx.stroke(); break;
    }
    case "pill": {   // a tilted pill label, a hairline inside its edge
      const pw = R * 1.92, ph = R * .8;
      rrect(ctx, -pw / 2, -ph / 2, pw, ph, ph / 2); shadow(); body(-ph / 2, ph / 2);
      ctx.lineWidth = R * .03; ctx.strokeStyle = ink; rrect(ctx, -pw / 2 + R * .07, -ph / 2 + R * .07, pw - R * .14, ph - R * .14, (ph - R * .14) / 2); ctx.stroke(); break;
    }
  }
  // the words: one row where the shape is wide, two where it is round and the words long
  const [bwk, bhk] = STICKER_BOX[shape], bw = R * bwk, bh = R * bhk, wide = bwk / bhk > 1.6;
  const ws = text.split(" "), lines = !wide && ws.length > 1 && text.length > 6 ? [ws.slice(0, Math.ceil(ws.length / 2)).join(" "), ws.slice(Math.ceil(ws.length / 2)).join(" ")] : [text];
  let fs = Math.min(R * (lines.length > 1 ? .42 : .5), bh / lines.length * .86);
  ctx.font = fontCss(fontName, fs);
  while (Math.max(...lines.map(l => ctx.measureText(l).width)) > bw && fs > 6) { fs *= .93; ctx.font = fontCss(fontName, fs); }
  ctx.fillStyle = ink; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  lines.forEach((l, i) => ctx.fillText(l, 0, (i - (lines.length - 1) / 2) * fs * 1.02));
  ctx.restore();
}

/** The grounds of two colours (owner: "Also don't see any gradients really?"): the pair's ground and
 *  its accent's hue at a lightness the words already read on (a dark ground's accent lifted a little,
 *  a warm one out of its muddy floor, rule 103), as a linear sweep, a radial glow behind the product
 *  or a soft mesh of blobs. Two families only: the ground's and the accent's. Keys: pair_linear,
 *  pair_radial, pair_mesh. Returns false for any other kind (the engine's background() asks each
 *  painter in turn). */
/* 2026-11-18 (rule 146; the owner: "still not enough colors, gradients, pattern fill, or other ways
   instead of colors"): five more fields beside the sweep, the glow and the mesh. A conic sweep round
   the product, a sky that burns low behind it (sunset), a hard two-tone diagonal (split), a duotone
   glow from two corners (corner), and a tall arch of the accent's colour blocked in behind the
   product (arch). The same two colours, along the same OKLCH path, so a field can be hard-edged and
   still never draw a third hue or a tone the words do not read on. */
export const PAIR_GRADIENTS = ["pair_linear", "pair_radial", "pair_mesh", "pair_conic", "pair_sunset", "pair_split", "pair_corner", "pair_arch"];
export function pairGradientColours(p) {
  // a ground is "dark" for this where its words are lighter than it: a vivid ground under white words
  // (White on Pink, L .52) keeps its far end darker, never lighter, than the words read on
  const G = oklchOf(p.ground), A = oklchOf(p.accent), dark = p.ink ? lum(p.ink) > lum(p.ground) : G.L < .56, warm = A.h >= 25 && A.h < 115;
  const L2 = dark ? Math.min(.5, Math.max(G.L + .07, warm ? .42 : .3)) : Math.min(.93, Math.max(.6, G.L - .06));
  const hot0 = okHex(L2, Math.min(.17, Math.max(.1, A.C)), A.h), Hy = oklchOf(hot0);
  /* a tone of the ground alone where the accent cannot be the far end: a two-colour pair's accent is its
     words' white or black (no hue to go to), and a warm accent at a depth light words still read on is
     under its muddy floor (rule 103: gold at OKLCH .42 is olive, orange is rust; the owner, of the
     conic sweep on Navy & Orange it drew, would see brown). A deep ground lifts toward its own lighter
     tone, a mid one (White on Pink) deepens, a light one lifts. */
  const floor = h => h >= 35 && h < 45 ? .12 : h >= 45 && h < 65 ? .2 : h >= 65 && h < 105 ? .33 : h >= 105 && h < 120 ? .3 : h >= 120 && h < 140 ? .22 : 0;
  const relY = h => { const [r, g, b] = [1, 3, 5].map(k => { const v = parseInt(h.slice(k, k + 2), 16) / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * r + .7152 * g + .0722 * b; };
  if (A.C < .04 || relY(hot0) < floor(Hy.h)) {
    /* 2026-11-19 (the owner, of the home page's wall: "no pattern fills and only 1 gradient multi color", and
       asked, "Show more of them"): a ground of a colour goes to a neighbour of its own hue, 40 degrees on
       (pink to coral, teal to blue, navy to violet, violet to magenta), or 40 back where on lands in the
       yellows and browns (red to crimson, orange to red, sand to peach): two hues, never a muddy one. A black,
       white or grey ground has no hue to go from, and keeps its one tone. */
    const Lh = dark ? (G.L < .4 ? Math.min(.5, G.L + .15) : Math.max(.12, G.L - .15)) : Math.min(.975, G.L + .07);
    const on = (G.h + 40) % 360, ph = on >= 40 && on <= 130 ? (G.h + 320) % 360 : on, partner = G.C >= .04;
    const hot = partner ? okHex(Lh, Math.max(G.C, .06), ph) : okHex(Lh, G.C, G.h);
    const deep = okHex(dark ? Math.max(.1, G.L - .07) : Math.min(.975, G.L + .03), G.C, G.h);
    return { hot, deep, dark, tonal: !partner, partner };
  }
  const hot = hot0;
  const deep = okHex(dark ? Math.max(.1, G.L - .08) : Math.min(.975, G.L + .03), G.C, G.h);
  return { hot, deep, dark };
}
const smooth01 = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
export function pairGradientGround(kind, x, st, p, W, H, sc, r) {
  if (!PAIR_GRADIENTS.includes(kind)) return false;
  /* Painted as a field from the ground (0) to the accent (1), each pixel's colour taken in OKLCH
     along deep → ground → a quiet middle → hot: the ground's hue fades out before the accent's comes
     in, so no pixel is a third hue (an sRGB blend of navy and orange passes through brown, of blue
     and green through cyan). Drawn at 128 across and scaled up smooth. */
  const { hot, deep, tonal, partner, dark } = pairGradientColours(p), G = oklchOf(p.ground), Hh = oklchOf(hot), Dd = oklchOf(deep);
  /* the ground's hue turns into the far end's along the shorter way round, its colour kept all the way
     (2026-11-19: "only 1 gradient multi color"): navy into cyan, purple through magenta into gold, red
     through orange into yellow. Where the two are more than 150 degrees apart, or the ground has no hue,
     the field passes through a quiet middle as before (a turn that long is a rainbow), and so does a dark
     one whose way runs through the yellows (70 to 125 degrees): at a depth light words read on they are
     olive (Teal & Orange would pass from teal through khaki). */
  const dh = (((Hh.h - G.h) % 360) + 540) % 360 - 180;
  const olive = dark && Array.from({ length: 19 }, (_, i) => (((G.h + dh * (i + 1) / 20) % 360) + 360) % 360).some(h => h >= 70 && h <= 125);
  const sweep = partner || (!tonal && G.C >= .04 && Hh.C >= .04 && Math.abs(dh) <= 150 && !olive);
  const [cx, cy] = sc || [W / 2, H * .6];
  const ux = cx / W, uy = cy / H, asp = H / W;
  // the hard-edged fields are drawn finer, so their edge is a line and not a blur scaled up from 128
  const hard = kind === "pair_split" || kind === "pair_arch", n = hard ? Math.min(540, Math.round(W / 2)) : 128, e = 1.4 / n;
  let field;
  if (kind === "pair_linear") {
    const a = (r ? r.uniform(.12, .38) : .25) * Math.PI, dx = Math.cos(a), dy = Math.sin(a) * H / W, n = Math.hypot(dx, dy);
    field = (u, v) => .5 + ((u - .5) * dx + (v - .5) * dy) / n / 1.15;
  } else if (kind === "pair_radial") {
    const k = Math.max(1, H / W);
    field = (u, v) => 1 - Math.min(1, Math.hypot(u - ux, (v - uy) * k) / .62) - (v < .42 ? (.42 - v) * .9 : 0);
  } else if (kind === "pair_conic") {
    // a sweep round the product: the angle from its middle, the accent's side turned by the seed
    const a0 = (r ? r() : .3) * TAU;
    field = (u, v) => { const th = Math.atan2((v - uy) * asp, u - ux), d = Math.min(1, Math.hypot(u - ux, (v - uy) * asp) / .9); return .5 + .44 * Math.cos(th - a0) * (.55 + .45 * d); };
  } else if (kind === "pair_sunset") {
    // deep at the top, the ground's own colour through the middle, the accent's burning low on a horizon
    // just under the product, and the floor below it falling back to the ground
    const hv = clamp(uy + .1, .55, .82), su = r ? r.uniform(-.12, .12) : 0;
    field = (u, v) => {
      const sky = v < hv ? .04 + .9 * (v / hv) ** 2.3 : .94 - .6 * ((v - hv) / (1 - hv)) ** .8;
      return sky + .22 * Math.exp(-(((u - ux - su) ** 2) + ((v - hv) * asp) ** 2) / .03);
    };
  } else if (kind === "pair_split") {
    // two tones meeting on a hard diagonal through the product's middle
    const a = (r ? r.uniform(.95, 1.3) : 1.1) * (r && r() < .5 ? -1 : 1), sa = Math.sin(a), ca = Math.cos(a);
    field = (u, v) => .2 + .6 * smooth01(-e, e, (u - ux) * sa * -1 + (v - uy) * asp * ca);
  } else if (kind === "pair_corner") {
    // a duotone: the accent's glow from one corner, the ground's deep shade from the opposite one
    const tl = r ? r() < .5 : true, [ax, ay, bx, by] = tl ? [0, 0, 1, 1] : [1, 0, 0, 1];
    field = (u, v) => .44 + .62 * Math.exp(-((u - ax) ** 2 + ((v - ay) * asp) ** 2) / .32) - .44 * Math.exp(-((u - bx) ** 2 + ((v - by) * asp) ** 2) / .26);
  } else if (kind === "pair_arch") {
    // a tall arch of the accent's colour blocked in behind the product, standing on the frame's foot
    const R = W > H ? .19 : .3, top = clamp(uy * asp - .32 + R, R + .04, asp);   // in units of the width: the arch's round top .32 over the product's middle
    field = (u, v) => {
      const X = u - ux, Y = v * asp, sd = Y >= top ? Math.abs(X) - R : Math.hypot(X, Y - top) - R;
      return .24 + .56 * (1 - smooth01(-e, e, sd));
    };
  } else {
    const blobs = Array.from({ length: 4 }, (_, i) => ({ u: r ? r() * .9 + .05 : (i * .37 + .1) % 1, v: r ? r() * .9 + .05 : (i * .61 + .2) % 1, rad: r ? r.uniform(.28, .45) : .36, w: i % 2 ? -.45 : .62 }));
    field = (u, v) => .42 + blobs.reduce((t, b) => t + b.w * Math.exp(-((u - b.u) ** 2 + ((v - b.v) * H / W) ** 2) / (b.rad * b.rad)), 0);
  }
  const midL = (G.L + Hh.L) / 2, m = Math.max(2, Math.round(n * H / W)), c = canvas(n, m), cx2 = c.getContext("2d"), id = cx2.createImageData(n, m);
  const toRgb = (L, C, h) => {
    const a = C * Math.cos(h * Math.PI / 180), b = C * Math.sin(h * Math.PI / 180);
    const l = (L + .3963377774 * a + .2158037573 * b) ** 3, mm = (L - .1055613458 * a - .0638541728 * b) ** 3, ss = (L - .0894841775 * a - 1.291485548 * b) ** 3;
    return [4.0767416621 * l - 3.3077115913 * mm + .2309699292 * ss, -1.2684380046 * l + 2.6097574011 * mm - .3413193965 * ss, -.0041960863 * l - .7034186147 * mm + 1.707614701 * ss]
      .map(v => { v = Math.min(1, Math.max(0, v)); return Math.round(255 * (v <= .0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - .055)); });
  };
  for (let j = 0; j < m; j++) for (let i = 0; i < n; i++) {
    const t = Math.min(1, Math.max(0, field((i + .5) / n, (j + .5) / m)));
    let L, C, h;
    if (tonal) { h = G.h; C = G.C; L = t < .35 ? lerp(Dd.L, G.L, t / .35) : lerp(G.L, Hh.L, (t - .35) / .65); }   // one hue: no grey middle to pass through
    else if (t < .35) { const k = t / .35; L = lerp(Dd.L, G.L, k); C = lerp(Dd.C, G.C, k); h = G.h; }
    // (a hard-edged field, split or arch, is two blocks: the far one in the far end's own hue, never one on the way)
    else if (sweep) { const k = (t - .35) / .65; L = lerp(G.L, Hh.L, k); C = lerp(G.C, Hh.C, k); h = hard ? (k >= .5 ? Hh.h : G.h) : (G.h + dh * k + 360) % 360; }
    else if (t < .55) { const k = (t - .35) / .2; L = lerp(G.L, midL, k); C = G.C * (1 - k); h = G.h; }
    else { const k = (t - .55) / .45; L = lerp(midL, Hh.L, k); C = Hh.C * k; h = Hh.h; }
    const [R, Gr, B] = toRgb(L, C, h), o = (j * n + i) * 4;
    id.data[o] = R; id.data[o + 1] = Gr; id.data[o + 2] = B; id.data[o + 3] = 255;
  }
  cx2.putImageData(id, 0, 0);
  x.save(); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high"; x.drawImage(c, 0, 0, W, H); x.restore();
  return true;
}

/* ═══════════════════════════════════════════════════════════════════════════════════════════════
   THE FULL AD'S PATTERNS AND TEXTURES (2026-11-18, rule 146). The owner: "still not enough colors,
   gradients, pattern fill, or other ways instead of colors". The engine's own patterned grounds
   (dots, stripes, checker, halftone...) were kept off the full ad (rule 137's review, 2026-11-12):
   drawn in the light or the accent at a strength made for a bare phone video, their features ran
   under the chips and through the chevrons. These are made for an ad full of words: every mark is
   one tone of the ground's own colour (tone-on-tone, one colour family), a small step in OKLCH
   lightness, away from the words' ink, or toward the middle of the scale only where the words keep
   7:1 on it either way, so no line reads worse on a mark than on the ground; and the marks thin out
   behind the product, which stands on a quiet middle. Still in the video (drawn once).
   ═══════════════════════════════════════════════════════════════════════════════════════════════ */
export const FULL_PATTERNS = ["pat_halftone", "pat_stripes", "pat_checks", "pat_grid", "pat_waves", "pat_zigzag", "pat_rays", "pat_rings",
  "pat_topo", "pat_polka", "pat_gingham", "pat_memphis", "pat_grain", "pat_paper", "pat_riso"];
/** The tone a pattern's marks take on this pair: the ground's own hue and chroma, dL lighter or deeper. */
export function patternTone(p, dL = .06) {
  const G = oklchOf(p.ground), ink = p.ink || (G.L < .56 ? "#ffffff" : "#111111");
  const up = okHex(Math.min(.985, G.L + dL), G.C, G.h), down = okHex(Math.max(.05, G.L - dL), G.C, G.h);
  const cu = contrastOf(ink, up), cd = contrastOf(ink, down);
  if (cu >= 7 && cd >= 7) return G.L < .5 ? up : down;
  return cu >= cd ? up : down;
}
const hexRgb = h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16));
export function fullPatternGround(kind, x, st, p, W, H, sc, r) {
  if (!FULL_PATTERNS.includes(kind)) return false;
  r = fork(r || rng(7));
  const U = Math.min(W, H), [cx, cy] = sc || [W / 2, H * .58], D = Math.hypot(W, H);
  // the ground, lit a little behind the product in its own lighter tone
  x.fillStyle = p.ground; x.fillRect(0, 0, W, H);
  const lit = x.createRadialGradient(cx, cy, 0, cx, cy, D * .6);
  lit.addColorStop(0, rgba(p.light || p.ground, .55)); lit.addColorStop(1, rgba(p.light || p.ground, 0)); x.fillStyle = lit; x.fillRect(0, 0, W, H);
  // the marks, on a layer of their own: thinned behind the product, then laid on the ground
  /* the step from the ground (2026-11-19; the owner, of the home page's wall: "no pattern fills", then "Show
     more of them"): a step of .05 read as a flat ground at the wall's size, so the marks now stand nearly
     twice as far off it. patternTone still keeps the words at 7:1 on them where both ways allow it, and
     otherwise moves them away from the words. */
  const step = { pat_grain: .1, pat_paper: .06, pat_riso: .1, pat_topo: .09, pat_grid: .08, pat_waves: .085 }[kind] || .095;
  const tone = patternTone(p, step), [tr, tg, tb] = hexRgb(tone), c = canvas(W, H), m = c.getContext("2d");
  m.fillStyle = tone; m.strokeStyle = tone; m.lineCap = "round"; m.lineJoin = "round";
  const speckle = (n, alpha) => {   // a tile of single grains in the tone
    const t = canvas(n, n), tx = t.getContext("2d"), id = tx.createImageData(n, n);
    for (let i = 0; i < n * n; i++) { const o = i * 4; id.data[o] = tr; id.data[o + 1] = tg; id.data[o + 2] = tb; id.data[o + 3] = alpha(); }
    tx.putImageData(id, 0, 0); return t;
  };
  switch (kind) {
    case "pat_halftone": {   // a dot screen at 45 degrees, the dots growing toward one corner
      const s = U * .03, a = Math.PI / 4, corner = r() < .5 ? [0, 0] : [W, 0];
      m.save(); m.translate(W / 2, H / 2); m.rotate(a);
      for (let yy = -D / 2; yy < D / 2; yy += s) for (let xx = -D / 2; xx < D / 2; xx += s) {
        const gx = W / 2 + xx * Math.cos(a) - yy * Math.sin(a), gy = H / 2 + xx * Math.sin(a) + yy * Math.cos(a);
        const k = 1 - Math.hypot(gx - corner[0], gy - corner[1]) / D, rad = s * .46 * clamp(k * 1.25 - .1, .06, 1);
        m.beginPath(); m.arc(xx, yy, rad, 0, TAU); m.fill();
      }
      m.restore(); break;
    }
    case "pat_stripes": {    // broad diagonal stripes
      const w = U * .034, dir = r() < .5 ? 1 : -1;
      m.save(); m.translate(W / 2, H / 2); m.rotate(dir * Math.PI / 4);
      for (let s = -D; s < D; s += w * 2) m.fillRect(s, -D, w, D * 2);
      m.restore(); break;
    }
    case "pat_checks": {     // a checkerboard, big enough to read as a floor and not as noise
      const q = U / (r() < .5 ? 9 : 12);
      for (let yy = 0, j = 0; yy < H; yy += q, j++) for (let xx = 0, i = 0; xx < W; xx += q, i++) if ((i + j) % 2) m.fillRect(xx, yy, q, q);
      break;
    }
    case "pat_grid": {       // graph paper: a fine grid, every fifth line heavier
      const q = U * .045;
      for (let i = 0, xx = (W / 2) % q; xx < W; xx += q, i++) { m.lineWidth = Math.max(1, U * (i % 5 ? .0022 : .005)); m.beginPath(); m.moveTo(xx, 0); m.lineTo(xx, H); m.stroke(); }
      for (let j = 0, yy = (H / 2) % q; yy < H; yy += q, j++) { m.lineWidth = Math.max(1, U * (j % 5 ? .0022 : .005)); m.beginPath(); m.moveTo(0, yy); m.lineTo(W, yy); m.stroke(); }
      break;
    }
    case "pat_waves": {      // thin parallel waves across the frame
      const q = U * .042, amp = U * .011, wl = U * .17, ph = r() * TAU; m.lineWidth = Math.max(1.5, U * .0055);
      for (let yy = -q; yy < H + q; yy += q) { m.beginPath(); for (let xx = 0; xx <= W; xx += U * .01) m.lineTo(xx, yy + Math.sin(xx / wl * TAU + ph + yy * .013) * amp); m.stroke(); }
      break;
    }
    case "pat_zigzag": {     // rows of chevrons
      const q = U * .06, w = U * .045; m.lineWidth = Math.max(2, U * .008);
      for (let yy = 0; yy < H + q; yy += q) { m.beginPath(); for (let xx = -w, i = 0; xx <= W + w; xx += w, i++) m.lineTo(xx, yy + (i % 2 ? w * .5 : 0)); m.stroke(); }
      break;
    }
    case "pat_rays": {       // a sunburst from behind the product
      const n = 28, off = r() * TAU / n;
      for (let i = 0; i < n; i += 2) { const a0 = off + i / n * TAU, a1 = off + (i + 1) / n * TAU; m.beginPath(); m.moveTo(cx, cy); m.lineTo(cx + Math.cos(a0) * D, cy + Math.sin(a0) * D); m.lineTo(cx + Math.cos(a1) * D, cy + Math.sin(a1) * D); m.closePath(); m.fill(); }
      break;
    }
    case "pat_rings": {      // rings round the product
      const q = U * .052; m.lineWidth = U * .013;
      for (let rad = q; rad < D; rad += q) { m.beginPath(); m.arc(cx, cy, rad, 0, TAU); m.stroke(); }
      break;
    }
    case "pat_topo": {       // a contour map: the lines of a smooth field of a few hills from the seed
      const n = Math.min(480, Math.round(W / 2)), mm = Math.max(2, Math.round(n * H / W)), hills = Array.from({ length: 6 }, () => ({ u: r(), v: r(), s: r.uniform(.12, .32), w: r.uniform(-1, 1) }));
      const f = (u, v) => hills.reduce((t, h) => t + h.w * Math.exp(-((u - h.u) ** 2 + ((v - h.v) * H / W) ** 2) / (h.s * h.s)), 0) * 9;
      const band = new Int16Array(n * mm); for (let j = 0; j < mm; j++) for (let i = 0; i < n; i++) band[j * n + i] = Math.floor(f(i / n, j / mm));
      const t = canvas(n, mm), tx = t.getContext("2d"), id = tx.createImageData(n, mm);
      for (let j = 0; j < mm - 1; j++) for (let i = 0; i < n - 1; i++) { const b = band[j * n + i]; if (b !== band[j * n + i + 1] || b !== band[(j + 1) * n + i]) { const o = (j * n + i) * 4; id.data[o] = tr; id.data[o + 1] = tg; id.data[o + 2] = tb; id.data[o + 3] = 255; } }
      tx.putImageData(id, 0, 0); m.imageSmoothingEnabled = true; m.imageSmoothingQuality = "high"; m.drawImage(t, 0, 0, W, H); m.drawImage(t, W / n * .5, H / mm * .5, W, H);
      break;
    }
    case "pat_polka": {      // big polka dots in offset rows
      const q = U * .15, rad = U * .038;
      for (let yy = 0, j = 0; yy < H + q; yy += q * .866, j++) for (let xx = (j % 2) * q / 2; xx < W + q; xx += q) { m.beginPath(); m.arc(xx, yy, rad, 0, TAU); m.fill(); }
      break;
    }
    case "pat_gingham": {    // a gingham check: bands both ways, the crossings a step deeper
      const q = U * .12, b = q / 2; m.globalAlpha = .6;
      for (let xx = 0; xx < W; xx += q) m.fillRect(xx, 0, b, H);
      for (let yy = 0; yy < H; yy += q) m.fillRect(0, yy, W, b);
      m.globalAlpha = 1; break;
    }
    case "pat_memphis": {    // a scatter of paper shapes: triangles, squiggles, rings and crosses
      const n = Math.round(W * H / (U * U) * 26);
      for (let i = 0; i < n; i++) {
        const px = r() * W, py = r() * H, s = U * r.uniform(.018, .04), a = r() * TAU, k = Math.floor(r() * 4);
        m.save(); m.translate(px, py); m.rotate(a); m.lineWidth = Math.max(2, U * .007);
        if (k === 0) { m.beginPath(); m.moveTo(0, -s); m.lineTo(s * .87, s * .5); m.lineTo(-s * .87, s * .5); m.closePath(); m.fill(); }
        else if (k === 1) { m.beginPath(); for (let t = 0; t <= 1.001; t += .1) m.lineTo((t - .5) * s * 2.4, Math.sin(t * TAU * 1.5) * s * .35); m.stroke(); }
        else if (k === 2) { m.beginPath(); m.arc(0, 0, s * .6, 0, TAU); m.stroke(); }
        else { m.fillRect(-s * .7, -s * .14, s * 1.4, s * .28); m.fillRect(-s * .14, -s * .7, s * .28, s * 1.4); }
        m.restore();
      }
      break;
    }
    case "pat_grain": {      // film grain over the soft light
      m.fillStyle = m.createPattern(speckle(256, () => Math.round(r() ** 2.2 * 255)), "repeat"); m.fillRect(0, 0, W, H);
      break;
    }
    case "pat_paper": {      // paper: a soft cloudy fibre and a scatter of short fibres
      const n = 64, t = canvas(n, Math.max(2, Math.round(n * H / W))), tx = t.getContext("2d"), id = tx.createImageData(t.width, t.height);
      for (let i = 0; i < t.width * t.height; i++) { const o = i * 4; id.data[o] = tr; id.data[o + 1] = tg; id.data[o + 2] = tb; id.data[o + 3] = Math.round(r() * 150); }
      tx.putImageData(id, 0, 0); m.imageSmoothingEnabled = true; m.imageSmoothingQuality = "high"; m.drawImage(t, 0, 0, W, H);
      m.lineWidth = Math.max(1, U * .0018);
      for (let i = 0; i < 240; i++) { const px = r() * W, py = r() * H, a = r() * TAU, l = U * r.uniform(.01, .05); m.beginPath(); m.moveTo(px, py); m.quadraticCurveTo(px + Math.cos(a + .6) * l * .5, py + Math.sin(a + .6) * l * .5, px + Math.cos(a) * l, py + Math.sin(a) * l); m.stroke(); }
      break;
    }
    case "pat_riso": {       // a risograph print: a coarse dot screen a hair off register, and its grain
      const s = U * .022, off = U * .004;
      for (let yy = 0, j = 0; yy < H + s; yy += s, j++) for (let xx = (j % 2) * s / 2; xx < W + s; xx += s) {
        const k = .5 + .5 * Math.sin(xx / W * 3.1 + yy / H * 2.3 + 1.7), rad = s * .42 * (.25 + .75 * k);
        m.beginPath(); m.arc(xx + off, yy - off, rad, 0, TAU); m.fill();
      }
      m.fillStyle = m.createPattern(speckle(128, () => r() < .18 ? 200 : 0), "repeat"); m.fillRect(0, 0, W, H);
      break;
    }
  }
  // thinned behind the product: the middle keeps a third of the marks, the frame's edges all of them
  m.globalCompositeOperation = "destination-in";
  const fade = m.createRadialGradient(cx, cy, U * .08, cx, cy, Math.max(W, H) * .62);
  fade.addColorStop(0, "rgba(0,0,0,.32)"); fade.addColorStop(.55, "rgba(0,0,0,.8)"); fade.addColorStop(1, "rgba(0,0,0,1)");
  m.fillStyle = fade; m.fillRect(0, 0, W, H); m.globalCompositeOperation = "source-over";
  x.drawImage(c, 0, 0);
  return true;
}

/* THE FILLS OF THE STICKER, THE PLATES AND THE BADGE (2026-11-18, rule 146): beside the flat colour
   and the light from above (fillGradient), stripes, a dot screen and a pressed foil's sheen. Each is
   the fill's own hue moved away from the ink it carries, so every point of it reads at least as well
   as the flat fill (gradientEnds' rule); laid on the path the caller has just filled, clipped to it. */
export const FILL_TEXTURES = ["stripes", "dots", "foil"];
/** A texture's tone: the fill moved d away from its ink; the fill itself where it cannot move further
 *  (a white plate under dark figures: OKLCH tops out at .985, a grey that read 4% worse, 2026-11-18). */
export function textureTone(fill, ink, d) {
  const t = toneOf(fill, lum(ink) > lum(fill) ? -d : d);
  return contrastOf(ink, t) >= contrastOf(ink, fill) ? t : fill;
}
export function fillTexture(ctx, mode, fill, ink, x0, y0, x1, y1) {
  if (!FILL_TEXTURES.includes(mode)) return;
  const w = x1 - x0, h = y1 - y0, u = Math.max(4, Math.min(w, h));
  const away = d => textureTone(fill, ink, d);
  ctx.save(); ctx.clip();
  if (mode === "stripes") {
    ctx.fillStyle = away(.09); const sw = u * .16, D = Math.hypot(w, h);
    ctx.translate(x0 + w / 2, y0 + h / 2); ctx.rotate(-Math.PI / 4);
    for (let s = -D; s < D; s += sw * 2) ctx.fillRect(s, -D, sw, D * 2);
  } else if (mode === "dots") {
    ctx.fillStyle = away(.1); const s = u * .2;
    for (let yy = y0, j = 0; yy < y1 + s; yy += s * .87, j++) for (let xx = x0 + (j % 2) * s / 2; xx < x1 + s; xx += s) { ctx.beginPath(); ctx.arc(xx, yy, s * .2, 0, TAU); ctx.fill(); }
  } else {
    // foil: a sheen across it in two bands, one wide and one narrow, the way light catches pressed metal
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    [[0, fill], [.22, away(.16)], [.36, fill], [.58, fill], [.68, away(.1)], [.76, fill], [1, away(.05)]].forEach(([o, c2]) => g.addColorStop(o, c2));
    ctx.fillStyle = g; ctx.fillRect(x0, y0, w, h);
  }
  ctx.restore();
}
