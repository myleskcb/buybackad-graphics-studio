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

import { canvas, rrect, rng, lerp, clamp, prog, outCubic, outBack, outBounce, outQuint, lum, mix, rgba, fontCss, noiseTile } from "./engine.js";

const TAU = Math.PI * 2;
const shade = (h, k) => mix(h, k < 0 ? "#000000" : "#ffffff", Math.abs(k));

// ------------------------------------------------------------ small painters

function blotches(x, W, H, r, scale, alpha) {
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

function palms(x, W, H, color, r, n) {
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
      for (let i = 0; i < n; i++) {
        const a = r();
        x.fillStyle = a < .6 ? `rgba(255,255,255,${r.uniform(.05, .45)})` : a < .85 ? rgba(p.accent, r.uniform(.1, .5)) : `rgba(255,220,150,${r.uniform(.1, .5)})`;
        const s = r.uniform(.4, 1.6) * k; x.fillRect(r() * W, r() * H, s, s);
      }
      const cl = x.createLinearGradient(0, 0, W, H);
      cl.addColorStop(.3, "rgba(255,255,255,0)"); cl.addColorStop(.42, "rgba(255,255,255,.16)"); cl.addColorStop(.5, "rgba(255,255,255,0)");
      x.fillStyle = cl; x.fillRect(0, 0, W, H);
      break;
    }
    case "cork": {
      x.fillStyle = p.ground; x.fillRect(0, 0, W, H);
      const n = Math.round(W * H / 95), k = Math.max(1, W / 700);
      for (let i = 0; i < n; i++) {
        x.fillStyle = r() < .5 ? rgba(shade(p.ground, -.45), r.uniform(.2, .6)) : rgba(shade(p.ground, .35), r.uniform(.15, .5));
        x.beginPath(); x.arc(r() * W, r() * H, r.uniform(.6, 2.4) * k, 0, TAU); x.fill();
      }
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
      for (let i = 0; i < n; i++) { x.fillStyle = rgba(r() < .5 ? "#c9a36b" : "#fff3dc", r.uniform(.2, .6)); x.fillRect(r() * W, sy2 + r() * (H - sy2), k, k); }
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
    default: return null;
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

/** Where a round thing of radius R fits best: the corner or edge that covers
 *  the least of the words and the number. */
export function freeSpot(W, H, R, avoid, prefer) {
  const m = Math.min(W, H) * .04;
  const cands = [[W - m - R, m + R], [m + R, m + R], [W - m - R, H - m - R], [m + R, H - m - R], [W - m - R, H * .5], [m + R, H * .5], [W * .5, m + R]];
  let best = null;
  for (const [x, y] of cands) {
    let o = 0;
    for (const b of avoid) {
      const ix = Math.max(0, Math.min(x + R, b[2]) - Math.max(x - R, b[0])), iy = Math.max(0, Math.min(y + R, b[3]) - Math.max(y - R, b[1]));
      o += ix * iy;
    }
    const d = prefer ? Math.hypot(x - prefer[0], y - prefer[1]) / Math.hypot(W, H) : 0;
    const score = o / (R * R) + d * .3;
    if (!best || score < best.score) best = { x, y, score, over: o / (R * R) };
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
