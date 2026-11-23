/* THE FULL AD'S NEW KINDS OF GROUND (2026-11-22, DESIGN-LAW 163).

   The owner: "some backgrounds we'll use more device or brand imagery", "or we use abstract img
   backgrounds", "space?", "what else would we use?", "some times patterns / colors etc. can you list
   what would give us a good amount of variety and what's relevant and makes good design?"; of the
   list (device, abstract, brand in type, colour and shape first): "Yes, build them".

   Four families, each painted, none downloaded:
     product   the ad's own goods as its ground: a wall of them, a close-up out of focus, an echo
               trailing off. Only ever the ad's own product (the owner, 2026-11-18: "never a MacBook
               behind an iPhone"), so it fits every line, cards and cars as much as phones.
     abstract  silk ribbons, liquid chrome, bokeh, frosted glass, a holographic foil, soft spheres,
               a light leak.
     shape     one disc, Bauhaus corners, Swiss bands, pills, colour blocks, a wave, a rising sun.
     type      the goods' own word as a wall, one word too big for the frame, a tape of words. Marks
               are type only (rule 116): no maker's logo is drawn.
   Every one is in the pair's own two colour families (rule 139): the ground's tones, and the far
   end and deep shade the pair's gradients use (decor.js pairGradientColours); a mark beside the
   words steps away from their ink (patternTone). The full ad's evening behind each block of words
   (_evenGround) and its pre-flight read these as they read any ground. */
import { canvas, clamp, rgba, fontCss, oklchOf } from "./engine.js";
import { okHex, pairGradientColours, patternTone } from "./decor.js";

const TAU = Math.PI * 2;
export const FAMILY_GROUNDS = {
  product: ["prod_wall", "prod_macro", "prod_echo"],
  abstract: ["abs_silk", "abs_chrome", "abs_bokeh", "abs_glass", "abs_holo", "abs_spheres", "abs_leak"],
  shape: ["shp_disc", "shp_bauhaus", "shp_bands", "shp_pills", "shp_blocks", "shp_wave", "shp_sun"],
  type: ["typ_wall", "typ_giant", "typ_tape"],
};
export const FAMILY_OF = Object.fromEntries(Object.entries(FAMILY_GROUNDS).flatMap(([k, L]) => L.map(id => [id, k])));
export const FAMILY_NAMES = {
  prod_wall: "Product wall", prod_macro: "Product close-up", prod_echo: "Product echo",
  abs_silk: "Silk", abs_chrome: "Liquid chrome", abs_bokeh: "Bokeh", abs_glass: "Frosted glass", abs_holo: "Holographic", abs_spheres: "Spheres", abs_leak: "Light leak",
  shp_disc: "Disc", shp_bauhaus: "Bauhaus", shp_bands: "Bands", shp_pills: "Pills", shp_blocks: "Colour blocks", shp_wave: "Wave", shp_sun: "Rising sun",
  typ_wall: "Word wall", typ_giant: "Giant word", typ_tape: "Word tape",
};

/** The pair's own colours, as these grounds use them. */
function palette(p) {
  const G = oklchOf(p.ground), { hot, deep, dark } = pairGradientColours(p), Hh = oklchOf(hot);
  const tone = dL => okHex(clamp(G.L + dL, .04, .985), G.C, G.h);
  const hotTone = dL => okHex(clamp(Hh.L + dL, .04, .985), Hh.C, Hh.h);
  return { G, Hh, hot, deep, dark, tone, hotTone, mark: dL => patternTone(p, dL), lit: dL => tone(dark ? dL : -dL) };
}
/** The goods the headline names: WE BUY POKÉMON CARDS gives POKÉMON CARDS. */
export function goodsWord(st) {
  const h = String(st.headline || "").toUpperCase().replace(/[!?.]+$/, "").replace(/^(WE BUY|CASH FOR|SELL YOUR|SELL|TRADE IN YOUR|TRADE IN)\s+/, "").trim();
  return h && h.length <= 22 ? h : "CASH";
}
const away = (sc, W, H, U, k = .3) => (px, py) => Math.hypot(px - sc[0], py - sc[1]) > U * k;
/** A spot away from the product's middle. */
function edgeSpot(r, W, H, ok) { for (let t = 0; t < 40; t++) { const px = r() * W, py = r() * H; if (ok(px, py)) return [px, py]; } return [r() < .5 ? W * .08 : W * .92, r() < .5 ? H * .08 : H * .92]; }
/** A smooth closed blob round (cx, cy). */
function blob(x, cx, cy, R, r, n = 7) {
  const pts = Array.from({ length: n }, (_, i) => { const a = i * TAU / n, k = R * (.72 + r() * .5); return [cx + Math.cos(a) * k, cy + Math.sin(a) * k]; });
  x.beginPath();
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], m0 = mid(pts[n - 1], pts[0]); x.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) { const a = pts[i], m = mid(a, pts[(i + 1) % n]); x.quadraticCurveTo(a[0], a[1], m[0], m[1]); }
  x.closePath();
}
function rr(x, X, Y, W, H, R) { R = Math.max(0, Math.min(R, W / 2, H / 2)); x.beginPath(); x.moveTo(X + R, Y); x.arcTo(X + W, Y, X + W, Y + H, R); x.arcTo(X + W, Y + H, X, Y + H, R); x.arcTo(X, Y + H, X, Y, R); x.arcTo(X, Y, X + W, Y, R); x.closePath(); }
const lin = (x, x0, y0, x1, y1, st) => { const g = x.createLinearGradient(x0, y0, x1, y1); st.forEach((c, i) => Array.isArray(c) ? g.addColorStop(c[0], c[1]) : g.addColorStop(i / (st.length - 1), c)); return g; };
const rad = (x, cx, cy, r0, r1, st) => { const g = x.createRadialGradient(cx, cy, r0, cx, cy, r1); st.forEach((c, i) => Array.isArray(c) ? g.addColorStop(c[0], c[1]) : g.addColorStop(i / (st.length - 1), c)); return g; };
/** The product as a flat shape in one colour (its outline from the cut-out's alpha). */
function silhouette(img, w, h, col) {
  const c = canvas(Math.max(1, Math.round(w)), Math.max(1, Math.round(h))), x = c.getContext("2d");
  x.drawImage(img, 0, 0, c.width, c.height); x.globalCompositeOperation = "source-in"; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
  return c;
}
const sizeOf = img => [img.naturalWidth || img.width || 1, img.naturalHeight || img.height || 1];

/** Paints one of the families' grounds; false when kind is not one of them. prods: the ad's product pictures. */
export function familyGround(kind, x, st, p, W, H, sc, r, prods = []) {
  if (!FAMILY_OF[kind]) return false;
  const P = palette(p), U = Math.min(W, H), D = Math.hypot(W, H), [cx, cy] = sc || [W / 2, H * .55], clear = away([cx, cy], W, H, U);
  const R = r || Math.random;
  // every one starts on the ground, lit softly where the product stands
  x.fillStyle = p.ground; x.fillRect(0, 0, W, H);
  x.fillStyle = rad(x, cx, cy, 0, D * .6, [P.lit(.05), p.ground]); x.fillRect(0, 0, W, H);
  const img = (prods || []).find(i => i && sizeOf(i)[0] > 1);
  if (FAMILY_OF[kind] === "product" && !img) { x.fillStyle = rad(x, cx, cy, 0, D * .6, [P.hot, p.ground, P.deep]); x.fillRect(0, 0, W, H); return true; }
  x.save();
  switch (kind) {
    /* ── the ad's own product ─────────────────────────────────────────────────────────────────── */
    case "prod_wall": {
      // a wall of the product, tone on tone, cleared round the real one
      const [iw, ih] = sizeOf(img), cell = U * .2, k = cell * .78 / Math.max(iw, ih), w = iw * k, h = ih * k, sil = silhouette(img, w, h, P.mark(.14));
      const tilt = (R() - .5) * .3;
      x.translate(W / 2, H / 2); x.rotate(tilt); x.translate(-W / 2, -H / 2);
      for (let row = -1, y = -cell; y < H + cell; row++, y += cell) for (let xx = -cell + (row % 2 ? cell / 2 : 0); xx < W + cell; xx += cell) {
        const d = Math.hypot(xx - cx, y - cy), a = clamp((d - U * .24) / (U * .16), 0, 1); if (a <= 0) continue;
        x.save(); x.globalAlpha = a; x.translate(xx, y); x.rotate((R() - .5) * .35); x.drawImage(sil, -w / 2, -h / 2); x.restore();
      }
      break;
    }
    case "prod_macro": {
      /* the product far too close to fit, out of focus, off to one side: its light and shade kept, its colour the
         ground's own a step lighter or deeper, and faded out before the frame's edges. (Drawn grey at half strength
         first, a laptop on a white ground was a mid-grey mass: the shade behind each block of words stood on it as
         white boxes, and the headline's reached the edge, which the pre-flight stops: full_style_check, laptop 2241.) */
      const [iw, ih] = sizeOf(img), k = U * 2.1 / Math.max(iw, ih), w = iw * k, h = ih * k;
      const tc = canvas(Math.round(w / 3), Math.round(h / 3)), tx = tc.getContext("2d");
      tx.drawImage(img, 0, 0, tc.width, tc.height);
      tx.globalCompositeOperation = "saturation"; tx.fillStyle = "#808080"; tx.fillRect(0, 0, tc.width, tc.height);
      tx.globalCompositeOperation = "destination-in"; tx.drawImage(img, 0, 0, tc.width, tc.height);
      tx.globalCompositeOperation = "source-atop"; tx.globalAlpha = .7; tx.fillStyle = P.lit(.14); tx.fillRect(0, 0, tc.width, tc.height);
      const m = canvas(W, H), mx = m.getContext("2d"), side = R() < .5 ? -1 : 1, px = cx + side * W * .42, py = cy - H * .12, e = U * .12;
      mx.filter = `blur(${Math.round(U * .012)}px)`; mx.translate(px, py); mx.rotate(side * .35); mx.drawImage(tc, -w / 2, -h / 2, w, h);
      mx.filter = "none"; mx.setTransform(1, 0, 0, 1, 0, 0); mx.globalCompositeOperation = "destination-out";
      for (const [x0, y0, x1, y1] of [[0, 0, e, 0], [W, 0, W - e, 0], [0, 0, 0, e], [0, H, 0, H - e]]) { mx.fillStyle = lin(mx, x0, y0, x1, y1, ["rgba(0,0,0,1)", "rgba(0,0,0,0)"]); mx.fillRect(0, 0, W, H); }
      x.globalAlpha = P.dark ? .5 : .42; x.drawImage(m, 0, 0); x.globalAlpha = 1;
      break;
    }
    case "prod_echo": {
      /* the product's echo: its own shape far larger than the frame, on the side away from the real one and cut by
         the edge, solid in one tone with its outline stepped off it. (A trail of small echoes beside the product, the
         first try, lay under the product and its sticker in a square ad, where nothing of it showed.) */
      const [iw, ih] = sizeOf(img), k = U * 1.25 / Math.max(iw, ih), w = iw * k, h = ih * k, sil = silhouette(img, w, h, P.mark(.1));
      const t = Math.max(2, Math.round(U * .006)), ring = canvas(w + t * 4, h + t * 4), rx = ring.getContext("2d"), edge = silhouette(img, w, h, P.mark(.2));
      for (const [ox, oy] of [[-t, 0], [t, 0], [0, -t], [0, t], [-t, -t], [t, t], [-t, t], [t, -t]]) rx.drawImage(edge, t * 2 + ox, t * 2 + oy);
      rx.globalCompositeOperation = "destination-out"; rx.drawImage(edge, t * 2, t * 2);
      const side = cx < W / 2 ? 1 : -1, px = W / 2 + side * W * .36, py = H * (.42 + R() * .16), tilt = side * (.12 + R() * .14);
      x.translate(px, py); x.rotate(tilt);
      x.drawImage(sil, -w / 2, -h / 2);
      x.drawImage(ring, -w / 2 - t * 2 - side * U * .035, -h / 2 - t * 2 - U * .03);
      break;
    }
    /* ── abstract ─────────────────────────────────────────────────────────────────────────────── */
    case "abs_silk": {
      const n = 3 + (R() * 2 | 0);
      for (let i = 0; i < n; i++) {
        const y0 = H * (.12 + R() * .76), amp = H * (.1 + R() * .16), th = U * (.1 + R() * .14), ph = R() * TAU, k = .7 + R() * .8, hot = i % 2 === 0;
        const top = t => [-W * .1 + t * W * 1.2, y0 + Math.sin(t * Math.PI * k + ph) * amp], wid = t => th * (.35 + .65 * Math.abs(Math.sin(t * Math.PI * 1.3 + ph)));
        x.beginPath(); for (let t = 0; t <= 1.0001; t += .02) { const [u, v] = top(t); t ? x.lineTo(u, v) : x.moveTo(u, v); }
        for (let t = 1; t >= -.0001; t -= .02) { const [u, v] = top(t); x.lineTo(u, v + wid(t)); } x.closePath();
        x.fillStyle = lin(x, 0, y0 - amp, 0, y0 + amp + th, [P.deep, hot ? P.hot : P.lit(.12), P.deep]); x.globalAlpha = .9; x.fill();
        x.globalAlpha = .22; x.strokeStyle = "#ffffff"; x.lineWidth = Math.max(1.5, U * .003);
        x.beginPath(); for (let t = 0; t <= 1.0001; t += .02) { const [u, v] = top(t); t ? x.lineTo(u, v) : x.moveTo(u, v); } x.stroke(); x.globalAlpha = 1;
      }
      break;
    }
    case "abs_chrome": {
      const light = P.lit(.32), n = 4;
      for (let i = 0; i < n; i++) {
        const [bx, by] = edgeSpot(R, W, H, away([cx, cy], W, H, U, .38)), Rb = U * (.12 + R() * .14), ang = R() * Math.PI;
        x.save(); x.shadowColor = rgba(P.deep, .5); x.shadowBlur = U * .04; x.shadowOffsetY = U * .015;
        blob(x, bx, by, Rb, R);
        x.fillStyle = lin(x, bx - Math.cos(ang) * Rb, by - Math.sin(ang) * Rb, bx + Math.cos(ang) * Rb, by + Math.sin(ang) * Rb, [[0, P.deep], [.3, light], [.42, P.deep], [.62, P.hot], [.82, light], [1, P.deep]]);
        x.fill(); x.restore();
        x.save(); x.globalAlpha = .55; x.filter = `blur(${Math.max(1, U * .004)}px)`; x.fillStyle = "#ffffff"; x.beginPath(); x.ellipse(bx - Rb * .3, by - Rb * .35, Rb * .22, Rb * .09, -.6, 0, TAU); x.fill(); x.restore();
      }
      break;
    }
    case "abs_bokeh": {
      x.fillStyle = rad(x, cx, cy, 0, D * .65, [P.lit(.06), p.ground, P.tone(P.dark ? -.05 : .03)]); x.fillRect(0, 0, W, H);
      x.globalCompositeOperation = P.dark ? "screen" : "multiply";
      for (let i = 0; i < 42; i++) {
        const [bx, by] = edgeSpot(R, W, H, away([cx, cy], W, H, U, .26)), br = U * (.02 + R() ** 2 * .11), a = .14 + R() * .26, col = R() < .55 ? P.hot : P.lit(.3);
        x.filter = `blur(${Math.max(0, br * .12)}px)`;
        x.fillStyle = rad(x, bx, by, 0, br, [[0, rgba(col, a * .7)], [.85, rgba(col, a)], [1, rgba(col, 0)]]);
        x.beginPath(); x.arc(bx, by, br, 0, TAU); x.fill();
      }
      x.filter = "none";
      break;
    }
    case "abs_glass": {
      x.filter = `blur(${Math.round(U * .05)}px)`;
      for (let i = 0; i < 4; i++) { const [bx, by] = edgeSpot(R, W, H, () => true); x.fillStyle = i % 2 ? P.hot : P.lit(.22); x.beginPath(); x.arc(bx, by, U * (.16 + R() * .14), 0, TAU); x.fill(); }
      x.filter = "none";
      const snap = canvas(W, H); snap.getContext("2d").drawImage(x.canvas, 0, 0);
      for (let i = 0; i < 3; i++) {
        const pw = U * (.34 + R() * .3), ph = U * (.22 + R() * .26), [bx, by] = edgeSpot(R, W, H, away([cx, cy], W, H, U, .34)), a = (R() - .5) * .5;
        x.save(); x.translate(bx, by); x.rotate(a); rr(x, -pw / 2, -ph / 2, pw, ph, U * .03); x.clip();
        x.rotate(-a); x.translate(-bx, -by); x.filter = `blur(${Math.round(U * .02)}px)`; x.drawImage(snap, 0, 0); x.filter = "none";
        x.restore();
        x.save(); x.translate(bx, by); x.rotate(a); rr(x, -pw / 2, -ph / 2, pw, ph, U * .03);
        x.fillStyle = P.dark ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.26)"; x.fill();
        x.lineWidth = Math.max(1.5, U * .0025); x.strokeStyle = "rgba(255,255,255,.4)"; x.stroke();
        x.fillStyle = lin(x, 0, -ph / 2, 0, 0, ["rgba(255,255,255,.18)", "rgba(255,255,255,0)"]); x.fill();
        x.restore();
      }
      break;
    }
    case "abs_holo": {
      // a holographic foil: bands rippling from the ground's deep shade to the pair's far end
      const n = 160, m = Math.max(2, Math.round(n * H / W)), c = canvas(n, m), cx2 = c.getContext("2d"), id = cx2.createImageData(n, m);
      const D0 = oklchOf(P.deep), G = P.G, Hh = P.Hh, dh = (((Hh.h - G.h) % 360) + 540) % 360 - 180, sweep = G.C >= .04 && Hh.C >= .04 && Math.abs(dh) <= 150;
      const ph = R() * TAU, ph2 = R() * TAU, f1 = 2.4 + R() * 1.6, f2 = 1.6 + R() * 1.4;
      const hexRgb = h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16));
      for (let j = 0; j < m; j++) for (let i = 0; i < n; i++) {
        const u = i / n, v = j / m, t = .5 + .5 * Math.sin((u * f1 + v * f2) * Math.PI + Math.sin(v * 4 + ph) * 1.3 + Math.sin(u * 5 + ph2) * .6);
        let L, C, h;
        if (t < .4) { const k = t / .4; L = D0.L + (G.L - D0.L) * k; C = D0.C + (G.C - D0.C) * k; h = G.h; }
        else { const k = (t - .4) / .6; L = G.L + (Hh.L - G.L) * k; C = G.C + (Hh.C - G.C) * k; h = sweep ? (G.h + dh * k + 360) % 360 : (k < .5 ? G.h : Hh.h); C = sweep ? C : C * Math.abs(1 - 2 * k); }
        const [rr0, gg, bb] = hexRgb(okHex(clamp(L, .03, .985), Math.max(0, C), h)), o = (j * n + i) * 4;
        id.data[o] = rr0; id.data[o + 1] = gg; id.data[o + 2] = bb; id.data[o + 3] = 255;
      }
      cx2.putImageData(id, 0, 0); x.imageSmoothingQuality = "high"; x.drawImage(c, 0, 0, W, H);
      x.globalAlpha = .06; x.strokeStyle = "#ffffff"; x.lineWidth = 1.5; for (let k = -H; k < W; k += U * .012) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k + H, H); x.stroke(); } x.globalAlpha = 1;
      break;
    }
    case "abs_spheres": {
      const n = 4 + (R() * 3 | 0), big = R() < .5 ? [W * .08, H * .9] : [W * .92, H * .1];
      const spots = [big, ...Array.from({ length: n - 1 }, () => edgeSpot(R, W, H, away([cx, cy], W, H, U, .36)))];
      spots.forEach(([sx, sy], i) => {
        const sr = i ? U * (.05 + R() * .1) : U * (.26 + R() * .08), body = i % 2 ? P.hot : P.lit(.14);
        x.save(); x.filter = `blur(${Math.round(sr * .2)}px)`; x.fillStyle = rgba(P.deep, .4); x.beginPath(); x.ellipse(sx + sr * .15, sy + sr * .9, sr * .8, sr * .2, 0, 0, TAU); x.fill(); x.restore();
        x.fillStyle = rad(x, sx - sr * .35, sy - sr * .4, sr * .05, sr * 1.25, [P.lit(.3), body, P.deep]); x.beginPath(); x.arc(sx, sy, sr, 0, TAU); x.fill();
      });
      break;
    }
    case "abs_leak": {
      x.globalCompositeOperation = P.dark ? "screen" : "multiply"; x.filter = `blur(${Math.round(U * .09)}px)`;
      for (let i = 0; i < 3; i++) {
        const corner = [[0, 0], [W, 0], [0, H], [W, H]][(R() * 4) | 0], a = Math.atan2(cy - corner[1], cx - corner[0]) + (R() - .5) * .8, L = D * (.35 + R() * .25), w = U * (.12 + R() * .14);
        x.save(); x.translate(corner[0], corner[1]); x.rotate(a); x.fillStyle = lin(x, 0, 0, L, 0, [rgba(i ? P.hot : P.lit(.35), .75), rgba(P.hot, 0)]); x.fillRect(0, -w / 2, L, w); x.restore();
      }
      x.filter = "none"; x.globalCompositeOperation = "source-over";
      x.fillStyle = rad(x, cx, cy, D * .3, D * .75, [rgba(P.deep, 0), rgba(P.deep, .35)]); x.fillRect(0, 0, W, H);
      break;
    }
    /* ── colour and shape ─────────────────────────────────────────────────────────────────────── */
    case "shp_disc": {
      const Rd = U * (.3 + R() * .08);
      x.fillStyle = lin(x, cx - Rd, cy - Rd, cx + Rd, cy + Rd, [P.hot, P.hotTone(P.dark ? -.06 : -.04)]); x.beginPath(); x.arc(cx, cy, Rd, 0, TAU); x.fill();
      x.strokeStyle = P.mark(.12); x.lineWidth = U * .012; x.beginPath(); x.arc(cx + Rd * .16, cy - Rd * .12, Rd * 1.2, 0, TAU); x.stroke();
      x.fillStyle = P.deep; x.beginPath(); x.arc(cx + Rd * 1.05, cy + Rd * .7, U * .028, 0, TAU); x.fill();
      break;
    }
    case "shp_bauhaus": {
      const q = U * (.36 + R() * .1), flip = R() < .5;
      const [ax, ay, a0] = flip ? [0, 0, 0] : [W, 0, Math.PI / 2], [bx, by, b0] = flip ? [W, H, Math.PI] : [0, H, -Math.PI / 2];
      x.fillStyle = P.hot; x.beginPath(); x.moveTo(ax, ay); x.arc(ax, ay, q, a0, a0 + Math.PI / 2); x.closePath(); x.fill();
      x.fillStyle = P.deep; x.beginPath(); x.moveTo(bx, by); x.arc(bx, by, q * .8, b0, b0 + Math.PI / 2); x.closePath(); x.fill();
      x.fillStyle = P.mark(.1); const bw = U * .05; flip ? x.fillRect(W - bw * 1.6, 0, bw, H * .55) : x.fillRect(bw * .6, 0, bw, H * .55);
      x.strokeStyle = P.hot; x.lineWidth = U * .012; x.beginPath(); x.arc(flip ? W * .2 : W * .8, H * .82, U * .05, 0, TAU); x.stroke();
      break;
    }
    case "shp_bands": {
      const n = 5, top = H * (.5 + R() * .1), cols = [P.hot, P.lit(.1), P.deep, P.hotTone(P.dark ? -.08 : -.06), P.lit(.05)];
      let y = top; for (let i = 0; i < n; i++) { const bh = (H - top) * [.13, .16, .2, .23, .28][i]; x.fillStyle = cols[i]; x.fillRect(0, y, W, bh + 1); y += bh; }
      x.fillStyle = P.mark(.08); for (let i = 0; i < 3; i++) x.fillRect(0, top - U * (.03 + i * .035), W, U * .008);
      break;
    }
    case "shp_pills": {
      const a = -Math.PI / 4 + (R() - .5) * .3, n = 8;
      for (let i = 0; i < n; i++) {
        const [px, py] = edgeSpot(R, W, H, away([cx, cy], W, H, U, .34)), pl = U * (.16 + R() * .2), pw = pl * (.3 + R() * .08), k = i % 3;
        x.save(); x.translate(px, py); x.rotate(a); rr(x, -pl / 2, -pw / 2, pl, pw, pw / 2);
        if (k === 0) { x.fillStyle = P.hot; x.fill(); } else if (k === 1) { x.fillStyle = P.deep; x.fill(); } else { x.lineWidth = U * .008; x.strokeStyle = P.mark(.14); x.stroke(); }
        x.restore();
      }
      break;
    }
    case "shp_blocks": {
      const sx = W * (.58 + R() * .14), sy = H * (.62 + R() * .12), g = U * .012, right = R() < .5;
      x.fillStyle = P.hot; right ? x.fillRect(sx, 0, W - sx, sy) : x.fillRect(0, 0, W - sx, sy);
      x.fillStyle = P.deep; x.fillRect(0, sy, W, H - sy);
      x.fillStyle = P.lit(.08); right ? x.fillRect(sx, sy, W - sx, H - sy) : x.fillRect(0, sy, W - sx, H - sy);
      x.fillStyle = p.ground; right ? x.fillRect(sx - g / 2, 0, g, H) : x.fillRect(W - sx - g / 2, 0, g, H); x.fillRect(0, sy - g / 2, W, g);
      break;
    }
    case "shp_wave": {
      const y0 = H * (.58 + R() * .08), y1 = H * (.46 + R() * .1), up = R() < .5;
      const wave = (dy) => { x.beginPath(); x.moveTo(0, (up ? y0 : y1) + dy); x.bezierCurveTo(W * .35, (up ? y0 : y1) + dy - H * .16, W * .65, (up ? y1 : y0) + dy + H * .16, W, (up ? y1 : y0) + dy); };
      wave(-U * .05); x.lineTo(W, H); x.lineTo(0, H); x.closePath(); x.fillStyle = P.lit(.08); x.fill();
      wave(0); x.lineTo(W, H); x.lineTo(0, H); x.closePath(); x.fillStyle = lin(x, 0, y1 - H * .1, 0, H, [P.hot, P.deep]); x.fill();
      wave(-U * .09); x.strokeStyle = P.mark(.12); x.lineWidth = U * .006; x.stroke();
      break;
    }
    case "shp_sun": {
      const R0 = U * (.58 + R() * .1), base = H, steps = 6;
      for (let i = 0; i < steps; i++) { const k = i / (steps - 1), rr0 = R0 * (1 - k * .62); x.fillStyle = i === steps - 1 ? P.hot : okHex(clamp(P.G.L + (P.Hh.L - P.G.L) * k, .04, .985), P.G.C + (P.Hh.C - P.G.C) * k, k < .5 ? P.G.h : P.Hh.h); x.beginPath(); x.arc(cx, base, rr0, Math.PI, TAU); x.closePath(); x.fill(); }
      break;
    }
    /* ── type ─────────────────────────────────────────────────────────────────────────────────── */
    case "typ_wall": {
      const word = goodsWord(st), px = U * .13, line = `${word}  ·  WE BUY  ·  CASH  ·  `, f = fontCss(st.font || "oswald", px);
      x.font = f; const lw = x.measureText(line).width || W;
      x.translate(W / 2, H / 2); x.rotate(-.14); x.translate(-W / 2, -H / 2); x.textBaseline = "middle";
      for (let row = 0, y = -px; y < H + px * 2; row++, y += px * 1.08) {
        const off = -((row * lw * .37) % lw);
        for (let xx = off - lw; xx < W + lw; xx += lw) { if (row % 2) { x.lineWidth = Math.max(1.5, U * .003); x.strokeStyle = P.mark(.12); x.strokeText(line, xx, y); } else { x.fillStyle = P.mark(.07); x.fillText(line, xx, y); } }
      }
      break;
    }
    case "typ_giant": {
      const word = (goodsWord(st).split(/\s+/)[0] || "CASH").replace(/[^\p{L}\p{N}$]/gu, "") || "CASH";
      let px = U; x.font = fontCss(st.font || "oswald", px); const w0 = x.measureText(word).width || 1; px = px * (W * 1.25) / w0; x.font = fontCss(st.font || "oswald", px);
      x.textAlign = "center"; x.textBaseline = "middle"; const y = cy + (R() - .5) * H * .1;
      x.fillStyle = P.mark(.07); x.fillText(word, W / 2 + (R() - .5) * W * .1, y);
      x.lineWidth = Math.max(2, U * .006); x.strokeStyle = P.mark(.14); x.strokeText(word, W / 2 + (R() - .5) * W * .1 + U * .02, y - U * .02);
      break;
    }
    case "typ_tape": {
      /* two tapes, each across a corner only (the top right and the bottom left, at 45 degrees): drawn across the whole
         frame, the first try ran its words under the headline in the maker */
      const word = goodsWord(st), th = U * .075, f = fontCss("oswald", th * .52), txt = `WE BUY ${word}  ·  CASH TODAY  ·  `, k = U * .1;
      [[k, H - k, Math.PI / 4], [W - k, k, Math.PI / 4]].forEach(([tx, ty, a], i) => {
        x.save(); x.translate(tx, ty); x.rotate(a);
        x.shadowColor = rgba(P.deep, .45); x.shadowBlur = U * .02; x.fillStyle = i ? P.hot : P.deep; x.fillRect(-D, -th / 2, D * 2, th); x.shadowColor = "transparent";
        x.font = f; x.textBaseline = "middle"; x.fillStyle = i ? P.tone(P.dark ? -.06 : 0) : P.lit(.18); const lw = x.measureText(txt).width || 100;
        for (let xx = -D; xx < D; xx += lw) x.fillText(txt, xx, 1);
        x.restore();
      });
      break;
    }
  }
  x.restore();
  return true;
}
