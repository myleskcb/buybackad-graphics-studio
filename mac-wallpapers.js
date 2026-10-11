/* MAC WALLPAPERS (2026-10-11).

   The owner, over the MacBook card ("Old MacBook. New money.", standing on a
   keyboard photograph): "can we be able to change the background to stock
   apple backgrounds for tahoe or golden gate or the stock background on front
   facing off screen". Two things, both here:

   1. Backgrounds in the look of the two newest Mac releases' wallpapers: Lake
      Tahoe (day, dusk, night, and the layered glass of its default) and the
      Golden Gate (sunset, night, fog, and the warm curves of its default).
      Apple's own wallpaper files are Apple's artwork, not ours to ship inside
      a paid product, so these are drawn here from scratch, as the device
      walls are ("drawn, not photographed", device-walls.js). Each registers
      with the shared ground catalogue (grounds.js GROUNDS.register) as a
      picture in its own colours, not the card's: the studio stores,
      thumbnails, gates and exports it like any photograph, and in the picker
      it takes the soft shade a photograph takes.

   2. A wallpaper ON the laptop's screen. Two of the three MacBook pictures
      (mac-pro-open-front, macbook-open-angle) show a screen that is off. Their
      display corners are measured below (SCREENS), and Easy Mode's "On the
      screen" row lights the screen with a wallpaper, or with a picture of the
      visitor's own (their own copy of Apple's wallpaper, say): straight into
      the front one, through a perspective warp into the angled one, under a
      faint glass sheen, the front one with the notch its 2021 MacBook Pro
      has. The picture is swapped for the lit copy as the card is built
      (buildLayer), only in Easy Mode's render and its hand-off to the
      designer, so a card as designed, its thumbnail and the library's renders
      draw exactly as before.

   Loaded after app.js (and grounds.js); the drawing works without app.js, so
   a test page can paint the wallpapers alone (window.MAC_WALLPAPERS.paint). */
(function macWallpapers(){
  if (typeof window === 'undefined' || !window.GROUNDS || typeof GROUNDS.register !== 'function') return;

  /* ── drawing helpers. Every scene is drawn in its own W x H (1080 square as
     a background, the display's own shape on a screen), from fixed seeds, so a
     wallpaper is the same picture every time, as a stock wallpaper is. ─────── */
  const rngOf = seed => { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  const lin = (g, x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  const rad = (g, x, y, r0, r1, stops) => { const gr = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  /* shadowBlur ignores the transform; grounds.js draws a 1080 scene into a
     larger canvas through a scale, so a blur is given in scene pixels and
     scaled here (its filter blur is scaled by grounds.js's own proxy) */
  const kOf = g => { try { const m = g.getTransform(); return Math.hypot(m.a, m.b) || 1; } catch (e){ return 1; } };
  const soft = (g, x, y, rx, ry, color, a) => { g.save(); g.translate(x, y); g.scale(1, ry / rx);
    g.fillStyle = rad(g, 0, 0, 0, rx, [[0, color.replace('A', a)], [0.55, color.replace('A', (a * 0.55).toFixed(3))], [1, color.replace('A', '0')]]);
    g.beginPath(); g.arc(0, 0, rx, 0, Math.PI * 2); g.fill(); g.restore(); };
  /* smooth value noise on [0,1), for ridges and shores */
  function noise(rnd){ const n = 64, v = Array.from({ length: n + 1 }, () => rnd() * 2 - 1); v[n] = v[0];
    return t => { t = ((t % 1) + 1) % 1 * n; const i = Math.floor(t), f = t - i, s = f * f * (3 - 2 * f); return v[i] * (1 - s) + v[i + 1] * s; }; }
  /* a mountain line: overlapping peaks [centre, height, width] in units of
     the scene over a low base, craggy detail from four octaves of noise,
     scaled with the height so the valleys stay smooth */
  function ridge(rnd, W, H, y0, base, peaks, crag){
    const nz = [0, 1, 2, 3].map(() => noise(rnd)), pts = [];
    for (let k = 0; k <= 260; k++){
      const u = k / 260, x = -0.02 * W + u * 1.04 * W;
      let h = base; peaks.forEach(([c, a, w]) => { const t = (u - c) / w; h += a * Math.exp(-t * t); });
      let d = 0, amp = 1; for (let o = 0; o < 4; o++){ d += nz[o](u * 0.11 * (1 << o) + o * 0.23) * amp; amp *= 0.5; }
      pts.push([x, y0 - h * H * (1 + crag * d)]);
    }
    return pts;
  }
  const ridgePath = (g, pts, yb) => { g.beginPath(); g.moveTo(pts[0][0], yb); pts.forEach(p => g.lineTo(p[0], p[1])); g.lineTo(pts[pts.length - 1][0], yb); g.closePath(); };
  /* snow above a ragged altitude */
  function snow(g, rnd, pts, yb, ySnow, rag, H, ink){
    g.save(); ridgePath(g, pts, yb); g.clip();
    const nz = noise(rnd);
    g.beginPath(); g.moveTo(pts[0][0], 0);
    pts.forEach((p, i) => g.lineTo(p[0], ySnow + nz(i / 520 + 0.3) * rag * H + (rnd() - 0.5) * rag * H * 0.8));
    g.lineTo(pts[pts.length - 1][0], 0); g.closePath();
    g.fillStyle = ink; g.fill();
    g.restore();
  }
  /* every peak split into a lit face and a shaded one: from the peak down
     its far side to the next valley, back up a crooked spur to the peak */
  function faces(g, pts, yb, shadow, fromLeft){
    const n = pts.length, peaks = [];
    for (let i = 3; i < n - 3; i++){ let top = true;
      for (let j = Math.max(0, i - 9); j <= Math.min(n - 1, i + 9); j++) if (j !== i && pts[j][1] < pts[i][1]){ top = false; break; }
      if (top) peaks.push(i); }
    const top = Math.min(...pts.map(p => p[1]));
    g.save(); ridgePath(g, pts, yb); g.clip(); g.fillStyle = lin(g, 0, top, 0, yb, [[0, shadow], [0.6, shadow], [1, shadow.replace(/[\d.]+\)$/, m => (parseFloat(m) * 0.35).toFixed(3) + ')')]]);
    peaks.forEach((ip, q) => {
      const dir = fromLeft ? 1 : -1, end = fromLeft ? (q + 1 < peaks.length ? peaks[q + 1] : n - 1) : (q ? peaks[q - 1] : 0);
      let iv = ip; for (let i = ip; i !== end; i += dir) if (pts[i][1] > pts[iv][1]) iv = i;
      if (iv === ip) return;
      const P = pts[ip], V = pts[iv], F = [P[0] + (V[0] - P[0]) * 0.3, yb];
      g.beginPath(); g.moveTo(P[0], P[1]);
      for (let i = ip; i !== iv + dir; i += dir) g.lineTo(pts[i][0], pts[i][1]);
      g.lineTo(V[0], yb); g.lineTo(F[0], F[1]);
      for (let t = 0.8; t > 0.05; t -= 0.2){ const w = Math.sin(ip * 1.7 + t * 9) * Math.abs(V[0] - P[0]) * 0.08;
        g.lineTo(P[0] + (F[0] - P[0]) * t + w, P[1] + (F[1] - P[1]) * t); }
      g.closePath(); g.fill();
    });
    g.restore();
  }
  /* a shore of conifers: a dark band with a ragged crown */
  function trees(g, rnd, W, H, y, h, fill){
    g.fillStyle = fill; g.beginPath(); g.moveTo(-10, y + h * 0.6);
    for (let x = -10; x < W + 10; x += (2 + rnd() * 4) * H / 1000){
      const th = h * (0.35 + rnd() * 0.65), tw = th * (0.22 + rnd() * 0.12);
      g.lineTo(x, y + h * 0.55 - th * 0.15); g.lineTo(x + tw / 2, y + h * 0.55 - th); g.lineTo(x + tw, y + h * 0.55 - th * 0.15);
    }
    g.lineTo(W + 10, y + h); g.lineTo(-10, y + h); g.closePath(); g.fill();
  }
  /* water's surface: thin horizontal glints, denser and shorter far away */
  function ripples(g, rnd, W, H, y0, y1, color, n, a){
    g.strokeStyle = color; g.lineCap = 'round';
    for (let i = 0; i < n; i++){
      const t = Math.pow(rnd(), 1.6), y = y0 + (y1 - y0) * t, len = (0.01 + rnd() * 0.05) * W * (0.3 + t * 1.4), x = rnd() * W;
      g.globalAlpha = (0.3 + rnd() * 0.7) * (a || 0.2); g.lineWidth = (0.6 + t * 2) * H / 1000;
      g.beginPath(); g.moveTo(x - len / 2, y); g.lineTo(x + len / 2, y); g.stroke();
    }
    g.globalAlpha = 1;
  }
  /* the hills again, upside down in the water, fading with depth */
  function reflect(g, W, H, yShore, paint, a){
    g.save(); g.beginPath(); g.rect(0, yShore, W, H - yShore); g.clip();
    g.globalAlpha = a; g.translate(0, yShore * 2); g.scale(1, -1); paint(); g.restore();
  }
  /* a rounded granite boulder, lit from the upper left; `wet` darkens the
     waterline, `under` sinks it under clear water */
  function boulder(g, rnd, x, y, r, light, dark, opts){
    opts = opts || {};
    const n = 10, pts = [];
    for (let i = 0; i < n; i++){ const a = (i / n) * Math.PI * 2, k = 0.8 + rnd() * 0.28; pts.push([x + Math.cos(a) * r * k * (opts.wide || 1.3), y + Math.sin(a) * r * k * 0.75]); }
    const path = () => { g.beginPath();
      for (let i = 0; i < n; i++){ const p = pts[i], q = pts[(i + 1) % n], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
        if (!i){ const z = pts[n - 1]; g.moveTo((z[0] + p[0]) / 2, (z[1] + p[1]) / 2); } g.quadraticCurveTo(p[0], p[1], m[0], m[1]); }
      g.closePath(); };
    path(); g.fillStyle = rad(g, x - r * 0.5, y - r * 0.45, r * 0.05, r * 1.6, [[0, light], [0.6, dark], [1, dark]]); g.fill();
    if (opts.wet){ g.save(); path(); g.clip(); g.fillStyle = lin(g, 0, y + r * 0.05, 0, y + r * 0.8, [[0, 'rgba(0,0,0,0)'], [0.3, opts.wet], [1, opts.wet]]); g.fillRect(x - r * 2, y - r, r * 4, r * 2); g.restore(); }
    if (opts.under){ path(); g.fillStyle = opts.under; g.fill(); }
  }

  /* ── LAKE TAHOE ───────────────────────────────────────────────────────── */
  function tahoe(g, W, H, mode){
    const rnd = rngOf(mode === 'day' ? 26 : mode === 'dusk' ? 2606 : 2626);
    const T = {
      day:   { sky:[[0, '#2a64b8'], [0.55, '#76ade3'], [1, '#d9ebf6']], far:'#8fa7c2', farFoot:'#6d87a3', snow:'#f7f9fc', shade:'rgba(40,62,96,0.42)', haze:'rgba(214,230,244,0.55)',
               hill:'#3e5a52', hillFoot:'#22383a', hillShade:'rgba(8,20,24,0.35)', tree:'#17302f', lake:[[0, '#3a6fa6'], [0.3, '#1f7fb0'], [0.62, '#25a9bd'], [1, '#6fd8d0']],
               glint:'#ffffff', glintA:0.35, refl:0.3, stone:['#d9ccb4', '#8e7f69'], bed:'rgba(30,160,175,0.5)', light:true },
      dusk:  { sky:[[0, '#262f68'], [0.4, '#7a4f8f'], [0.75, '#f08a62'], [1, '#ffd49a']], far:'#7a6290', farFoot:'#5a4774', snow:'#ffd9c8', shade:'rgba(40,24,64,0.45)', haze:'rgba(250,170,150,0.35)',
               hill:'#3a2f56', hillFoot:'#211a36', hillShade:'rgba(10,6,24,0.35)', tree:'#17112a', lake:[[0, '#f3a57c'], [0.3, '#b9708a'], [0.7, '#4c3f6f'], [1, '#2b2a4f']],
               glint:'#ffd9b0', glintA:0.35, refl:0.42, stone:['#7f6474', '#231c33'], bed:'rgba(60,40,90,0.55)' },
      night: { sky:[[0, '#040a1c'], [0.6, '#0f2347'], [1, '#26467a']], far:'#2a3d5e', farFoot:'#1b2a46', snow:'#a9bcd9', shade:'rgba(4,10,24,0.5)', haze:'rgba(40,64,110,0.35)',
               hill:'#121f36', hillFoot:'#0a1324', hillShade:'rgba(0,0,0,0.3)', tree:'#060c18', lake:[[0, '#1d355e'], [0.4, '#102345'], [0.75, '#0b1a36'], [1, '#060f22']],
               glint:'#cfe0ff', glintA:0.25, refl:0.38, stone:['#33425e', '#0a1224'], bed:'rgba(8,20,44,0.6)' },
    }[mode];
    const fromLeft = mode === 'day';                                   // the sun's side; the moon and the dusk sun are on the right
    const yh = H * 0.5;                                                // the far shore
    g.fillStyle = lin(g, 0, 0, 0, yh, T.sky); g.fillRect(0, 0, W, yh + 2);
    if (mode === 'day'){
      for (let i = 0; i < 7; i++) soft(g, W * (0.08 + rnd() * 0.84), H * (0.08 + rnd() * 0.22), W * (0.12 + rnd() * 0.16), H * (0.012 + rnd() * 0.02), 'rgba(255,255,255,A)', 0.55);
    } else if (mode === 'dusk'){
      soft(g, W * 0.68, yh - H * 0.02, W * 0.5, H * 0.24, 'rgba(255,214,150,A)', 0.75);
      g.fillStyle = 'rgba(255,240,215,0.95)'; g.beginPath(); g.arc(W * 0.68, yh - H * 0.035, H * 0.03, 0, Math.PI * 2); g.fill();
      for (let i = 0; i < 6; i++) soft(g, W * (0.05 + rnd() * 0.9), H * (0.1 + rnd() * 0.22), W * (0.14 + rnd() * 0.14), H * (0.01 + rnd() * 0.016), 'rgba(255,170,150,A)', 0.5);
    } else {
      for (let i = 0; i < 260; i++){ const y = Math.pow(rnd(), 1.4) * yh * 0.95; g.globalAlpha = 0.25 + rnd() * 0.75;
        g.fillStyle = '#ffffff'; g.beginPath(); g.arc(rnd() * W, y, (0.4 + rnd() * 1.3) * H / 1000, 0, Math.PI * 2); g.fill(); }
      g.globalAlpha = 1;
      soft(g, W * 0.8, H * 0.14, H * 0.2, H * 0.2, 'rgba(190,210,255,A)', 0.35);
      g.fillStyle = '#f4f2e8'; g.beginPath(); g.arc(W * 0.8, H * 0.14, H * 0.03, 0, Math.PI * 2); g.fill();
    }
    const far = ridge(rngOf(3), W, H, yh, 0.07, [[0.1, 0.12, 0.08], [0.27, 0.17, 0.07], [0.42, 0.1, 0.09], [0.64, 0.19, 0.06], [0.8, 0.13, 0.08], [0.97, 0.1, 0.07]], 0.3);
    const near = ridge(rngOf(5), W, H, yh + H * 0.004, 0.025, [[0.02, 0.09, 0.1], [0.3, 0.05, 0.12], [0.55, 0.04, 0.1], [0.9, 0.08, 0.12]], 0.35);
    const paintHills = () => {
      ridgePath(g, far, yh + 2); g.fillStyle = lin(g, 0, yh - H * 0.3, 0, yh, [[0, T.far], [1, T.farFoot]]); g.fill();
      snow(g, rngOf(7), far, yh + 2, yh - H * 0.15, 0.045, H, T.snow);
      faces(g, far, yh + 2, T.shade, fromLeft);
      g.fillStyle = lin(g, 0, yh - H * 0.14, 0, yh, [[0, 'rgba(0,0,0,0)'], [1, T.haze]]); g.fillRect(0, yh - H * 0.14, W, H * 0.14);   // haze at the foot of the range
      ridgePath(g, near, yh + 2); g.fillStyle = lin(g, 0, yh - H * 0.12, 0, yh, [[0, T.hill], [1, T.hillFoot]]); g.fill();
      faces(g, near, yh + 2, T.hillShade, fromLeft);
      trees(g, rngOf(11), W, H, yh - H * 0.018, H * 0.022, T.tree);
    };
    paintHills();
    g.fillStyle = lin(g, 0, yh, 0, H, T.lake); g.fillRect(0, yh, W, H - yh);
    reflect(g, W, H, yh, paintHills, T.refl);
    g.fillStyle = lin(g, 0, yh, 0, yh + H * 0.34, [[0, 'rgba(0,0,0,0)'], [1, T.lake[1][1]]]); g.globalAlpha = 0.85; g.fillRect(0, yh, W, H * 0.34);
    g.fillStyle = T.lake[1][1]; g.fillRect(0, yh + H * 0.34 - 1, W, H); g.globalAlpha = 1;      // the reflection fades out with depth
    g.fillStyle = lin(g, 0, yh + H * 0.2, 0, H, [[0, 'rgba(0,0,0,0)'], [0.5, T.lake[2][1]], [1, T.lake[3][1]]]); g.fillRect(0, yh + H * 0.2, W, H);
    if (mode === 'dusk' || mode === 'night'){                           // the sun's or the moon's road on the water
      const cx = W * (mode === 'dusk' ? 0.68 : 0.8), rr = rngOf(13);
      for (let i = 0; i < 90; i++){ const t = rr(), y = yh + 3 + t * (H - yh) * 0.9, w = W * (0.006 + t * 0.05) * (0.4 + rr());
        g.globalAlpha = 0.35 * (1 - t * 0.6) + rr() * 0.3; g.fillStyle = mode === 'dusk' ? '#ffe2b8' : '#e8eeff';
        g.fillRect(cx - w / 2 + (rr() - 0.5) * W * 0.04 * (0.4 + t), y, w, (1 + t * 2.4) * H / 1000); }
      g.globalAlpha = 1;
    }
    /* the clear shallows over a bed of granite, Tahoe's own look: stones
       sunk under the water's colour, nearer ones clearer, light rippling
       over them */
    const rb = rngOf(19), bedTop = H * 0.72, sm = t => t * t * (3 - 2 * t);
    const bed = []; for (let i = 0; i < 80; i++){ const t = Math.sqrt(rb()); bed.push([W * (rb() * 1.1 - 0.05), bedTop + t * (H - bedTop) * 1.08, H * (0.01 + t * 0.042) * (0.6 + rb() * 0.8), t]); }
    bed.sort((a, b) => a[1] - b[1]).forEach(([x, y, r, t]) => { g.globalAlpha = sm(Math.min(1, t * 1.6)) * 0.95; boulder(g, rb, x, y, r, T.stone[0], T.stone[1], { under: T.bed }); });
    g.globalAlpha = 1;
    if (T.light){                                                      // the caustics: light rippling on the bed
      const rc = rngOf(23); g.strokeStyle = 'rgb(210,255,250)'; g.lineCap = 'round';
      for (let i = 0; i < 80; i++){ const t = rc(), y = bedTop + t * (H - bedTop), x = rc() * W, len = W * (0.03 + rc() * 0.06) * (0.5 + t), amp = H * 0.005 * (0.5 + t);
        g.globalAlpha = 0.35 * sm(t); g.lineWidth = (0.8 + t * 1.6) * H / 1000; g.beginPath();
        for (let q = 0; q <= 1.0001; q += 0.1) g.lineTo(x + len * q, y + Math.sin(q * 9 + i) * amp); g.stroke(); }
      g.globalAlpha = 1;
    }
    ripples(g, rngOf(17), W, H, yh + 4, bedTop, T.glint, 220, T.glintA);
    /* two dry boulders in front, wet at the waterline */
    [[0.06, 0.985, 0.11, 1.5], [0.9, 1.0, 0.085, 1.35], [0.76, 1.03, 0.05, 1.2]].forEach(([u, v, r, wd]) =>
      boulder(g, rb, W * u, H * v, H * r, T.stone[0], T.stone[1], { wet: mode === 'day' ? 'rgba(60,70,60,0.55)' : 'rgba(0,0,0,0.45)', wide: wd }));
  }

  /* Tahoe's default: layered glass, waves of the lake in blue */
  function tahoeGlass(g, W, H, dark){
    const K = kOf(g);
    g.fillStyle = lin(g, 0, 0, W * 0.3, H, dark ? [[0, '#030b1f'], [1, '#0a2552']] : [[0, '#eaf4fd'], [1, '#a8cdf3']]); g.fillRect(0, 0, W, H);
    const cols = dark ? ['#0d2c66', '#123b85', '#1752a8', '#1c6bc8', '#2a86df', '#47a3ee'] : ['#cfe6fb', '#a3cff6', '#74b3ef', '#4b97e6', '#2a78d6', '#1459b8'];
    for (let i = 0; i < 6; i++){
      const base = H * (0.22 + i * 0.13), A = H * (0.06 + 0.02 * (i % 3)), f = 0.7 + i * 0.13, ph = i * 1.7;
      const y = x => base + A * Math.sin((x / W) * Math.PI * 2 * f + ph) + A * 0.45 * Math.sin((x / W) * Math.PI * 2 * f * 2.3 + ph * 1.9);
      g.save();
      g.beginPath(); g.moveTo(-4, y(-4)); for (let x = 0; x <= W + 8; x += 8) g.lineTo(x, y(x)); g.lineTo(W + 8, H + 8); g.lineTo(-4, H + 8); g.closePath();
      g.shadowColor = dark ? 'rgba(0,0,0,0.55)' : 'rgba(20,60,120,0.28)'; g.shadowBlur = H * 0.04 * K; g.shadowOffsetY = -H * 0.006 * K;
      g.fillStyle = lin(g, 0, base - A, 0, base + H * 0.4, [[0, cols[i]], [1, dark ? '#020814' : cols[Math.min(5, i + 1)]]]);
      g.globalAlpha = 0.92; g.fill(); g.restore();
      g.save(); g.beginPath(); g.moveTo(-4, y(-4)); for (let x = 0; x <= W + 8; x += 8) g.lineTo(x, y(x));
      g.strokeStyle = dark ? 'rgba(140,200,255,0.25)' : 'rgba(255,255,255,0.35)'; g.lineWidth = H * 0.012; g.stroke();
      g.strokeStyle = dark ? 'rgba(170,220,255,0.75)' : 'rgba(255,255,255,0.85)'; g.lineWidth = Math.max(1, H * 0.0025); g.stroke(); g.restore();
    }
  }

  /* ── THE GOLDEN GATE. One perspective: the near tower big on the left, the
     far one smaller, the span between them foreshortened. World position s
     runs along the span (0 the near tower, 1 the far one), height h above
     the water in units of the near tower's height. ─────────────────────── */
  function bridge(g, W, H, o){
    const k = 0.75, X0 = W * 0.26, X1 = W * 0.78, HZ = o.water, S0 = H * 0.55;
    const sx = s => X0 + (X1 - X0) * (s * (1 + k)) / (1 + k * s), sc = s => 1 / (1 + k * s);
    const sy = (s, h) => HZ - h * S0 * sc(s);
    const deck = 0.3, top = 1, sag = deck + 0.035, deckT = 0.04;
    const cableH = s => s >= 0 && s <= 1 ? sag + (top - sag) * Math.pow(2 * s - 1, 2)
      : s < 0 ? deck + (top - deck) * Math.pow((s + 0.55) / 0.55, 1.6) : deck + (top - deck) * Math.pow((1.55 - s) / 0.55, 1.6);
    const lw = (s, px) => Math.max(0.6, px * sc(s) * H / 1000);
    /* the deck and its truss, from the near approach to the far shore */
    const sA = -0.6, sB = 3;
    g.beginPath(); for (let s = sA; s <= sB; s += 0.01) g.lineTo(sx(s), sy(s, deck)); for (let s = sB; s >= sA; s -= 0.01) g.lineTo(sx(s), sy(s, deck - deckT)); g.closePath();
    g.fillStyle = o.truss; g.fill();
    g.beginPath(); for (let s = sA; s <= sB; s += 0.01) g.lineTo(sx(s), sy(s, deck)); g.strokeStyle = o.rail; g.lineWidth = lw(0.5, 3); g.stroke();
    /* suspenders, then the main cable over them */
    g.strokeStyle = o.cable;
    for (let s = -0.5; s <= 1.55; s += 0.018){ if (Math.abs(s) < 0.02 || Math.abs(s - 1) < 0.02) continue;
      g.lineWidth = lw(s, 1.1); g.globalAlpha = 0.85; g.beginPath(); g.moveTo(sx(s), sy(s, cableH(s))); g.lineTo(sx(s), sy(s, deck)); g.stroke(); }
    g.globalAlpha = 1;
    [[-0.55, 0], [0, 1], [1, 1.55]].forEach(([a, b]) => { g.beginPath(); for (let s = a; s <= b + 1e-9; s += 0.005) g.lineTo(sx(s), sy(s, cableH(s)));
      g.strokeStyle = o.cable; g.lineWidth = lw((a + b) / 2, 5); g.stroke(); });
    /* the two towers: two legs, four portals, the stepped crown */
    [1, 0].forEach(s => {
      const cx = sx(s), u = sc(s) * S0, tw = u * 0.13, leg = tw * 0.3, yTop = sy(s, top) - u * 0.04, yFoot = HZ + u * 0.01;
      const face = lin(g, cx - tw / 2, 0, cx + tw / 2, 0, [[0, o.lit], [0.55, o.tower], [1, o.shade]]);
      g.fillStyle = face;
      [-1, 1].forEach(side => {
        const xo = cx + side * (tw / 2 - leg / 2);
        for (let st = 0; st < 4; st++){                                  // each storey a little narrower
          const y0 = yTop + (yFoot - yTop) * st / 4, y1 = st === 3 ? yFoot : yTop + (yFoot - yTop) * (st + 1) / 4, w = leg * (0.82 + st * 0.06);
          g.fillRect(xo - w / 2, y0, w, y1 - y0 + 1);
        }
        g.fillRect(xo - leg * 0.33, yTop - u * 0.022, leg * 0.66, u * 0.023);       // the stepped crown
        g.fillRect(xo - leg * 0.18, yTop - u * 0.034, leg * 0.36, u * 0.013);
      });
      g.fillStyle = o.tower;
      [0.02, 0.2, 0.38, 0.56].forEach((t, i) => {                       // the portals over the road
        const y = yTop + (sy(s, deck) - yTop) * t, h = u * (i ? 0.03 : 0.045);
        g.fillRect(cx - tw / 2 + leg * 0.3, y, tw - leg * 0.6, h);
        g.fillStyle = o.recess; g.fillRect(cx - tw / 2 + leg * 0.9, y + h * 0.28, tw - leg * 1.8, h * 0.44); g.fillStyle = o.tower;
      });
      g.fillStyle = o.shade; g.fillRect(cx - tw / 2 + leg * 0.2, sy(s, deck), tw - leg * 0.4, u * 0.02);   // the road through it
      if (o.glow){ g.save(); g.globalCompositeOperation = 'lighter'; soft(g, cx, (yTop + yFoot) / 2, tw * 1.6, (yFoot - yTop) * 0.55, o.glow, 0.22); g.restore(); }
    });
    if (o.lights){                                                         // the road's lamps and the cable's lights
      g.fillStyle = o.lights;
      for (let s = -0.6; s <= 3; s += 0.03 * (1 + Math.max(0, s - 1))){ const r = lw(s, 2.2); g.globalAlpha = 0.95; g.beginPath(); g.arc(sx(s), sy(s, deck + 0.012), r, 0, Math.PI * 2); g.fill(); }
      for (let s = -0.5; s <= 1.55; s += 0.045){ const r = lw(s, 1.6); g.globalAlpha = 0.75; g.beginPath(); g.arc(sx(s), sy(s, cableH(s)), r, 0, Math.PI * 2); g.fill(); }
      g.globalAlpha = 1;
    }
    return { sx, sy, sc };
  }
  function goldenGate(g, W, H, mode){
    const rnd = rngOf(mode === 'sunset' ? 27 : mode === 'night' ? 2727 : 2770), yw = H * 0.62;
    const T = {
      sunset: { sky:[[0, '#3d4f86'], [0.35, '#a7779a'], [0.68, '#f4a46e'], [1, '#ffd89a']], hillFar:'#6a4a62', hill:'#3a2638', sea:[[0, '#f2b07a'], [0.25, '#9b6a84'], [1, '#2c2440']],
                tower:'#9a2f22', lit:'#e0663a', shade:'#5c1c18', recess:'#3d1512', truss:'#4a1a17', rail:'#d4683f', cable:'#7a2a20' },
      night:  { sky:[[0, '#060e26'], [0.55, '#14305e'], [1, '#2f5486']], hillFar:'#14213d', hill:'#0a1428', sea:[[0, '#1d3560'], [0.4, '#0d1e3c'], [1, '#050c1c']],
                tower:'#b9452a', lit:'#ff9a5c', shade:'#6a2117', recess:'#3a120c', truss:'#2b1410', rail:'#ffb36b', cable:'#c4573a',
                glow:'rgba(255,150,90,A)', lights:'#ffd28a' },
      fog:    { sky:[[0, '#3f86cf'], [0.6, '#8fc1ea'], [1, '#d8ecf8']], hillFar:'#8a9a7a', hill:'#5d6f4f', sea:[[0, '#4f86b0'], [0.5, '#2f6492'], [1, '#1d4a72']],
                tower:'#c8452c', lit:'#e86a48', shade:'#8a2a1a', recess:'#6e2216', truss:'#7a2a1c', rail:'#e2603e', cable:'#b8402a' },
    }[mode];
    g.fillStyle = lin(g, 0, 0, 0, yw, T.sky); g.fillRect(0, 0, W, yw + 2);
    if (mode === 'sunset'){
      soft(g, W * 0.56, yw - H * 0.03, W * 0.6, H * 0.3, 'rgba(255,220,150,A)', 0.8);
      g.fillStyle = 'rgba(255,244,214,0.97)'; g.beginPath(); g.arc(W * 0.56, yw - H * 0.045, H * 0.04, 0, Math.PI * 2); g.fill();
      for (let i = 0; i < 6; i++) soft(g, W * (rnd() * 1.0), H * (0.08 + rnd() * 0.25), W * (0.14 + rnd() * 0.16), H * (0.012 + rnd() * 0.018), 'rgba(255,190,160,A)', 0.55);
    } else if (mode === 'night'){
      for (let i = 0; i < 200; i++){ g.globalAlpha = 0.2 + rnd() * 0.7; g.fillStyle = '#ffffff'; g.beginPath(); g.arc(rnd() * W, Math.pow(rnd(), 1.5) * yw * 0.9, (0.4 + rnd() * 1.2) * H / 1000, 0, Math.PI * 2); g.fill(); }
      g.globalAlpha = 1; soft(g, W * 0.12, H * 0.13, H * 0.17, H * 0.17, 'rgba(200,215,255,A)', 0.3);
      g.fillStyle = '#f3f1e6'; g.beginPath(); g.arc(W * 0.12, H * 0.13, H * 0.026, 0, Math.PI * 2); g.fill();
    } else {
      for (let i = 0; i < 6; i++) soft(g, W * rnd(), H * (0.06 + rnd() * 0.2), W * (0.14 + rnd() * 0.16), H * (0.02 + rnd() * 0.03), 'rgba(255,255,255,A)', 0.7);
    }
    /* the headlands: Marin high on the right, the city's low ground on the left */
    const far = ridge(rnd, W, H, yw, 0, [[0.9, 0.2, 0.16], [1.05, 0.27, 0.12], [0.62, 0.05, 0.1]], 0.12);
    ridgePath(g, far, yw + 2); g.fillStyle = T.hillFar; g.fill();
    const nearL = ridge(rnd, W, H, yw, 0, [[-0.04, 0.1, 0.12], [0.1, 0.05, 0.08]], 0.15);
    ridgePath(g, nearL, yw + 2); g.fillStyle = T.hill; g.fill();
    if (mode === 'night'){                                                  // the towns' lights on the hills
      const rl = rngOf(31);
      [[far, 0.66, 1.02], [nearL, -0.02, 0.2]].forEach(([pts, a, b]) => { for (let i = 0; i < 160; i++){
        const u = a + rl() * (b - a), x = u * W, p = pts[Math.max(0, Math.min(pts.length - 1, Math.round((u + 0.02) / 1.04 * 260)))], y = p[1] + rl() * (yw - p[1]);
        g.globalAlpha = 0.5 + rl() * 0.5; g.fillStyle = rl() < 0.7 ? '#ffd38c' : '#fff3d6'; g.fillRect(x, y, (1 + rl() * 1.5) * H / 1000, (1 + rl() * 1.5) * H / 1000); } });
      g.globalAlpha = 1;
    }
    g.fillStyle = lin(g, 0, yw, 0, H, T.sea); g.fillRect(0, yw, W, H - yw);
    if (mode === 'sunset'){
      const rr = rngOf(33);
      for (let i = 0; i < 120; i++){ const t = rr(), y = yw + 2 + t * (H - yw) * 0.95, w = W * (0.008 + t * 0.06) * (0.4 + rr());
        g.globalAlpha = 0.5 * (1 - t * 0.5) + rr() * 0.3; g.fillStyle = '#ffe6b8';
        g.fillRect(W * 0.56 - w / 2 + (rr() - 0.5) * W * 0.06 * (0.3 + t), y, w, (1 + t * 2.6) * H / 1000); }
      g.globalAlpha = 1;
    }
    ripples(g, rngOf(35), W, H, yw + 3, H, mode === 'night' ? '#9fb8e8' : '#ffffff', 260, mode === 'night' ? 0.12 : 0.22);
    if (mode === 'fog'){                                                    // the fog bank rolling in under the road
      const rf = rngOf(37);
      for (let i = 0; i < 26; i++) soft(g, W * (0.45 + rf() * 0.65), yw - H * (0.01 + rf() * 0.12), W * (0.08 + rf() * 0.12), H * (0.04 + rf() * 0.05), 'rgba(250,252,255,A)', 0.75);
    }
    const B = bridge(g, W, H, Object.assign({ water: yw }, T));
    if (mode === 'night'){                                                  // the lights' long reflections
      const rr = rngOf(39);
      const streak = (x, w, a, c) => { for (let j = 0; j < 14; j++){ const t = j / 14, y = yw + 3 + t * (H - yw) * 0.7;
        g.globalAlpha = a * (1 - t) * (0.5 + rr() * 0.5); g.fillStyle = c;
        g.fillRect(x - w * (0.6 + rr() * 0.8) / 2 + (rr() - 0.5) * w, y, w * (0.6 + rr() * 0.8), (1.5 + t * 4) * H / 1000); } };
      [0, 1].forEach(s => streak(B.sx(s), H * 0.03 * B.sc(s), 0.7, '#ff9a5c'));
      for (let s = -0.6; s <= 1.6; s += 0.16) streak(B.sx(s), H * 0.01 * B.sc(s), 0.45, '#ffd28a');
      g.globalAlpha = 1;
    }
    if (mode === 'fog'){
      const rf = rngOf(41);
      for (let i = 0; i < 18; i++) soft(g, W * (0.55 + rf() * 0.55), yw - H * (0.02 + rf() * 0.08), W * (0.06 + rf() * 0.1), H * (0.03 + rf() * 0.04), 'rgba(255,255,255,A)', 0.6);
    }
    if (mode === 'sunset'){                                                 // the rocks on the near shore, the surf on them
      const rk = rngOf(43);
      [[0.04, 0.97, 0.16], [0.2, 1.0, 0.1], [0.93, 0.98, 0.13], [0.78, 1.02, 0.08]].forEach(([u, v, r]) => {
        const x = W * u, y = H * v, R = H * r;
        boulder(g, rk, x, y, R, '#5d3e46', '#140c14', { wet: 'rgba(10,4,10,0.5)' });
        for (let i = 0; i < 16; i++){ const a = Math.PI * (1.05 + rk() * 0.9), d = R * (1.15 + rk() * 0.3);
          soft(g, x + Math.cos(a) * d * 1.25, y + Math.sin(a) * d * 0.45 + R * 0.3, R * (0.18 + rk() * 0.25), R * (0.04 + rk() * 0.05), 'rgba(255,244,232,A)', 0.6); }
      });
    }
  }

  /* the Golden Gate default: warm gold and cool grey curves, overlapping */
  function goldenCurves(g, W, H, dark){
    const K = kOf(g);
    g.fillStyle = lin(g, 0, 0, W, H, dark ? [[0, '#151418'], [1, '#2a2520']] : [[0, '#f6f0e6'], [1, '#e4d8c4']]); g.fillRect(0, 0, W, H);
    const bands = [
      ['#9aa3ad', '#6b737d', 0.18, -0.15, 0.95, 0.2],
      ['#f2cf7a', '#c78f2c', 0.16, 0.05, 0.7, 0.75],
      ['#d8dde2', '#a8b0b8', 0.1, 0.3, 1.1, 0.35],
      ['#e7b04a', '#9c6a1c', 0.2, 0.55, 0.85, 1.05],
      ['#fbe3a6', '#e0a948', 0.08, 0.75, 1.2, 0.55],
    ];
    bands.forEach(([c1, c2, wd, a, b, c]) => {
      g.save();
      g.shadowColor = dark ? 'rgba(0,0,0,0.6)' : 'rgba(90,60,20,0.28)'; g.shadowBlur = H * 0.05 * K; g.shadowOffsetY = H * 0.012 * K;
      g.strokeStyle = lin(g, 0, 0, W, H, [[0, c1], [1, c2]]); g.lineWidth = H * wd; g.lineCap = 'round'; g.globalAlpha = dark ? 0.92 : 0.88;
      g.beginPath(); g.moveTo(-W * 0.1, H * a); g.bezierCurveTo(W * 0.35, H * (a + 0.5), W * 0.55, H * (b - 0.6), W * 1.1, H * c); g.stroke();
      g.restore();
      g.save(); g.globalAlpha = dark ? 0.22 : 0.32; g.strokeStyle = '#fffaf0'; g.lineWidth = Math.max(1, H * 0.003);
      g.beginPath(); g.moveTo(-W * 0.1, H * a - H * wd * 0.42); g.bezierCurveTo(W * 0.35, H * (a + 0.5) - H * wd * 0.42, W * 0.55, H * (b - 0.6) - H * wd * 0.42, W * 1.1, H * c - H * wd * 0.42); g.stroke();
      g.restore();
    });
  }

  /* ── the catalogue. Keys are letters only (grounds.js parse() reads [A-Za-z]+). ── */
  const WALLS = [
    { key:'wpTahoeDay',     name:'Tahoe, day',          note:'clear water over granite, snow on the peaks',       draw:(g, W, H) => tahoe(g, W, H, 'day') },
    { key:'wpTahoeDusk',    name:'Tahoe, dusk',         note:'the lake under a warm evening sky',                 draw:(g, W, H) => tahoe(g, W, H, 'dusk') },
    { key:'wpTahoeNight',   name:'Tahoe, night',        note:'moonlight on the lake and the snow',                draw:(g, W, H) => tahoe(g, W, H, 'night') },
    { key:'wpTahoeGlass',   name:'Tahoe glass',         note:'layered blue glass, light',                         draw:(g, W, H) => tahoeGlass(g, W, H, false) },
    { key:'wpTahoeGlassDk', name:'Tahoe glass, dark',   note:'layered blue glass, dark',                          draw:(g, W, H) => tahoeGlass(g, W, H, true) },
    { key:'wpGateSunset',   name:'Golden Gate, sunset', note:'the bridge at golden hour, surf on the rocks',      draw:(g, W, H) => goldenGate(g, W, H, 'sunset') },
    { key:'wpGateNight',    name:'Golden Gate, night',  note:'the bridge lit at blue hour',                       draw:(g, W, H) => goldenGate(g, W, H, 'night') },
    { key:'wpGateFog',      name:'Golden Gate, fog',    note:'a clear sky, the fog rolling in under the road',    draw:(g, W, H) => goldenGate(g, W, H, 'fog') },
    { key:'wpGoldCurves',   name:'Golden curves',       note:'warm gold and cool grey curves, light',             draw:(g, W, H) => goldenCurves(g, W, H, false) },
    { key:'wpGoldCurvesDk', name:'Golden curves, dark', note:'warm gold and cool grey curves, dark',              draw:(g, W, H) => goldenCurves(g, W, H, true) },
  ];
  const byKey = Object.fromEntries(WALLS.map(w => [w.key, w]));
  WALLS.forEach(w => GROUNDS.register(w.key, { name: w.name, note: w.note, group: 'wallpapers', draw: (g, W, H) => w.draw(g, W, H) }));

  /** a wallpaper on a fresh canvas of w x h (no grain: a screen is clean) */
  function paint(key, w, h){
    const c = document.createElement('canvas'); c.width = Math.round(w); c.height = Math.round(h);
    const wall = byKey[key]; if (!wall) return c;
    const g = c.getContext('2d'); g.save(); wall.draw(g, c.width, c.height); g.restore();
    return c;
  }

  /* ── THE SCREENS ──────────────────────────────────────────────────────── */
  /* the display's corners in each picture's own pixels, top left, top right,
     bottom right, bottom left: the glass's dark edge on the cut-out, less the
     bezel (measured 2026-10-11, and checked by warping a grid into them). The
     front one is a 2021 MacBook Pro: rounded top corners, and the notch round
     the camera at (940, 38). The angled one is the Touch Bar 13-inch, 16:10
     and no notch. mac-half-open-glow shows its lid, not its screen. */
  const SCREENS = {
    'mac-pro-open-front': { quad: [[306, 27], [1572, 27], [1572, 858], [306, 858]], round: 10, notch: { cx: 939, w: 100, h: 24, r: 8 } },
    'macbook-open-angle': { quad: [[46, 44], [840, 260], [974, 852], [211, 989]], art: [1280, 800] },
  };
  const fileOf = src => (String(src || '').split('?')[0].match(/\/cutouts\/([^/]+)\.[a-z0-9]+$/i) || [])[1] || '';
  const screenOf = src => SCREENS[fileOf(src)] || null;

  /* the projective map taking the unit square's corners to a quad (Heckbert) */
  function homography(q){
    const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
    const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
    let gg = 0, hh = 0;
    if (Math.abs(sx) > 1e-9 || Math.abs(sy) > 1e-9){ const den = dx1 * dy2 - dx2 * dy1; gg = (sx * dy2 - dx2 * sy) / den; hh = (dx1 * sy - sx * dy1) / den; }
    const a = x1 - x0 + gg * x1, b = x3 - x0 + hh * x3, d = y1 - y0 + gg * y1, e = y3 - y0 + hh * y3;
    return (u, v) => { const w = gg * u + hh * v + 1; return [(a * u + b * v + x0) / w, (d * u + e * v + y0) / w]; };
  }
  /* one affine piece: the art's triangle s0 s1 s2 onto d0 d1 d2, clipped a
     hair wide so no seam shows between neighbours */
  function tri(g, img, s0, s1, s2, d0, d1, d2){
    const den = (s1[0] - s0[0]) * (s2[1] - s0[1]) - (s2[0] - s0[0]) * (s1[1] - s0[1]); if (!den) return;
    const ax = d1[0] - d0[0], bx = d2[0] - d0[0], ay = d1[1] - d0[1], by = d2[1] - d0[1];
    const m11 = (ax * (s2[1] - s0[1]) - bx * (s1[1] - s0[1])) / den, m12 = (bx * (s1[0] - s0[0]) - ax * (s2[0] - s0[0])) / den;
    const m21 = (ay * (s2[1] - s0[1]) - by * (s1[1] - s0[1])) / den, m22 = (by * (s1[0] - s0[0]) - ay * (s2[0] - s0[0])) / den;
    const cx = (d0[0] + d1[0] + d2[0]) / 3, cy = (d0[1] + d1[1] + d2[1]) / 3;
    const grow = p => { const dx = p[0] - cx, dy = p[1] - cy, L = Math.hypot(dx, dy) || 1; return [p[0] + dx / L * 0.7, p[1] + dy / L * 0.7]; };
    const a = grow(d0), b = grow(d1), c = grow(d2);
    g.save(); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.closePath(); g.clip();
    g.transform(m11, m21, m12, m22, d0[0] - m11 * s0[0] - m12 * s0[1], d0[1] - m21 * s0[0] - m22 * s0[1]);
    g.drawImage(img, 0, 0); g.restore();
  }
  function warpInto(g, art, q, n){
    const P = homography(q), W = art.width, H = art.height;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++){
      const u0 = i / n, u1 = (i + 1) / n, v0 = j / n, v1 = (j + 1) / n;
      tri(g, art, [u0 * W, v0 * H], [u1 * W, v0 * H], [u1 * W, v1 * H], P(u0, v0), P(u1, v0), P(u1, v1));
      tri(g, art, [u0 * W, v0 * H], [u1 * W, v1 * H], [u0 * W, v1 * H], P(u0, v0), P(u1, v1), P(u0, v1));
    }
  }
  /* a picture of any shape, cropped to fill w x h from its middle */
  function cover(el, w, h){
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const iw = el.naturalWidth || el.width, ih = el.naturalHeight || el.height, k = Math.max(w / iw, h / ih);
    c.getContext('2d').drawImage(el, (w - iw * k) / 2, (h - ih * k) / 2, iw * k, ih * k);
    return c;
  }
  /* the cut-out with its screen lit: the art in the display, a faint sheen
     of glass over it, and the notch */
  function litCanvas(base, spec, artOf){
    const w = base.naturalWidth || base.width, h = base.naturalHeight || base.height, q = spec.quad;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.drawImage(base, 0, 0, w, h);
    g.save(); g.beginPath();
    if (spec.round){
      const [x0, y0] = q[0], x1 = q[1][0], y2 = q[2][1], r = spec.round;
      g.moveTo(x0, y2); g.lineTo(x0, y0 + r); g.quadraticCurveTo(x0, y0, x0 + r, y0); g.lineTo(x1 - r, y0); g.quadraticCurveTo(x1, y0, x1, y0 + r); g.lineTo(x1, y2); g.closePath(); g.clip();
      const aw = x1 - x0, ah = y2 - y0, art = artOf(aw, ah); if (!art) return null;
      g.drawImage(art, x0, y0, aw, ah);
    } else {
      g.moveTo(q[0][0], q[0][1]); q.slice(1).forEach(p => g.lineTo(p[0], p[1])); g.closePath(); g.clip();
      const art = artOf(spec.art[0], spec.art[1]); if (!art) return null;
      warpInto(g, art, q, 12);
    }
    g.fillStyle = lin(g, q[0][0], q[0][1], q[2][0], q[2][1], [[0, 'rgba(255,255,255,0.10)'], [0.42, 'rgba(255,255,255,0.025)'], [0.43, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,0.07)']]);
    g.fillRect(0, 0, w, h);
    g.restore();
    if (spec.notch){
      const n = spec.notch, x = n.cx - n.w / 2, y = q[0][1] - 1;
      g.fillStyle = '#050506'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + n.w, y); g.lineTo(x + n.w, y + n.h - n.r);
      g.quadraticCurveTo(x + n.w, y + n.h, x + n.w - n.r, y + n.h); g.lineTo(x + n.r, y + n.h); g.quadraticCurveTo(x, y + n.h, x, y + n.h - n.r); g.closePath(); g.fill();
    }
    return c;
  }

  /* what is on the screen: '' (off, as photographed), a wallpaper's key, or
     'own' (the visitor's picture, kept on this device only) */
  const jg = (k, fb) => { try { return typeof jget === 'function' ? jget(k, fb) : fb; } catch (e){ return fb; } };
  const js = (k, v) => { try { if (typeof jset === 'function') jset(k, v); } catch (e){} };
  const ST = { key: '', own: null, ownVer: 0 };
  ST.key = (k => k === 'own' || byKey[k] ? k : '')(jg('pgfx_ez_screen', ''));
  const LIT = new Map();                         // a few lit cut-outs, newest last (each is a full-size canvas)
  function litFor(src, base, key){
    const spec = screenOf(src); if (!spec || !key || !base || !(base.naturalWidth || base.width)) return null;
    if (key === 'own' && !ST.own) return null;
    const id = fileOf(src) + '|' + key + '|' + (key === 'own' ? ST.ownVer : '');
    if (LIT.has(id)){ const c = LIT.get(id); LIT.delete(id); LIT.set(id, c); return c; }
    const c = litCanvas(base, spec, (aw, ah) => key === 'own' ? cover(ST.own, Math.round(aw), Math.round(ah)) : paint(key, aw, ah));
    if (!c) return null;
    LIT.set(id, c); while (LIT.size > 4) LIT.delete(LIT.keys().next().value);
    return c;
  }
  /* A lit picture is saved as its recipe (pgScreen and the cut-out's own
     address), as a pattern is (app.js PG_PAT_STUB): saved as its pixels,
     every undo step and the draft would carry a full-size PNG of a laptop.
     Any load of a saved picture lights it again (fabric.Image.fromObject). */
  function light(o, src, key){
    const base = o.getElement && o.getElement(); if (!base || base.tagName === 'CANVAS') return false;
    const lit = litFor(src, base, key); if (!lit) return false;
    const from = base.src || src;
    o.setElement(lit);
    o.pgScreen = key;
    o.toObject = function(props){ const r = fabric.Image.prototype.toObject.call(this, props); r.src = from; return r; };
    return true;
  }

  /* ── THE STUDIO (app.js loaded first; nothing here if it was not) ────────── */
  if (typeof fabric === 'undefined' || typeof buildLayer !== 'function' || typeof renderEzCanvas !== 'function') {
    window.MAC_WALLPAPERS = { list: WALLS.map(w => ({ key: w.key, name: w.name, note: w.note })), paint, SCREENS, screenOf, litFor };
    return;
  }
  try { EXTRA_PROPS.push('pgScreen'); } catch (e){}
  const _fromObject = fabric.Image.fromObject;
  fabric.Image.fromObject = function(obj, cb){
    return _fromObject.call(this, obj, function(img){
      try { if (img && obj && obj.pgScreen) light(img, obj.src, obj.pgScreen); } catch (e){ console.warn('mac wallpapers: relight', e); }
      return typeof cb === 'function' ? cb.apply(this, arguments) : undefined;
    });
  };
  /* the screen is lit only where Easy Mode builds the card: its render (the
     preview, the download, the gate, the video) and the hand-off to the
     designer. Every other build (thumbnails, the library, the audits) draws
     the card as designed. */
  let ON = false;
  const _buildLayer = buildLayer;
  buildLayer = function(l){
    const o = _buildLayer.apply(this, arguments);
    try { if (ON && ST.key && l && l.kind === 'cutout' && l.props && o && o.type === 'image' && screenOf(l.props.src)) light(o, l.props.src, ST.key); }
    catch (e){ console.warn('mac wallpapers: screen', e); }
    return o;
  };
  const onFor = fn => function(){ const was = ON; ON = true; try { return fn.apply(this, arguments); } finally { ON = was; } };
  renderEzCanvas = onFor(renderEzCanvas);
  if (typeof openAdvancedFromEz === 'function') openAdvancedFromEz = onFor(openAdvancedFromEz);

  /* the wallpapers as a background group, beside the photographs */
  if (typeof EZ_GROUND_STYLES !== 'undefined'){
    const i = EZ_GROUND_STYLES.findIndex(s => s.key === 'blurred');
    EZ_GROUND_STYLES.splice(i < 0 ? EZ_GROUND_STYLES.length : i + 1, 0, { key: 'wallpapers', label: 'Wallpapers', kinds: WALLS.map(w => w.key) });
    /* a wallpaper is a picture, not a flat ground: it takes the soft shade a
       photograph takes in the picker, and the gate deepens it only where a
       line needs it (as the device walls and the scenes do) */
    const _ezGroundSpecs = ezGroundSpecs;
    ezGroundSpecs = function(st, PArg){
      const out = _ezGroundSpecs.apply(this, arguments);
      if (st && st.key === 'wallpapers'){ const lightInk = scLum((PArg || ezPalette()).ink) > 0.4;
        out.forEach(x => Object.assign(x.bg, { scrim: 0.42, scrimColor: lightInk ? '#0b0b0d' : '#f6f6f4', scrimMode: 'gradient' })); }
      return out;
    };
    const row = document.getElementById('ez-bgstyles');
    if (row && row.dataset.built){ delete row.dataset.built; row.innerHTML = ''; try { ezDrawnSync(); } catch (e){} }
  }

  /* ── Easy Mode's "On the laptop screen" row, under the backgrounds; shown
     only on a card whose picture has a screen we know ────────────────────── */
  const $id = id => document.getElementById(id);
  function cardHasScreen(){
    let tpl = null; try { tpl = ezTpl(); } catch (e){}
    const hidden = (tpl && ez.hidden && ez.hidden[tpl.id]) || [];
    return !!tpl && (tpl.layers || []).some(l => l.kind === 'cutout' && l.props && screenOf(l.props.src) && !hidden.includes(l.name));
  }
  function pick(key){
    ST.key = key; js('pgfx_ez_screen', key);
    syncRow(); schedEzPreview(0);
  }
  function syncRow(){
    const row = $id('ez-screen'), ttl = $id('ez-screen-ttl'); if (!row) return;
    const on = cardHasScreen(); row.style.display = ttl.style.display = on ? '' : 'none';     // .ez-swatches sets display, so not [hidden]
    const ownB = row.querySelector('[data-screen="own"]');
    if (ownB){ ownB.style.display = ST.own ? '' : 'none'; if (ST.own && ownB.dataset.ver !== String(ST.ownVer)){ ownB.dataset.ver = String(ST.ownVer);
      ownB.style.backgroundImage = 'url("' + cover(ST.own, 96, 60).toDataURL('image/jpeg', 0.85) + '")'; } }
    row.querySelectorAll('[data-screen]').forEach(b => { const sel = b.dataset.screen === ST.key; b.classList.toggle('sel', sel); b.setAttribute('aria-pressed', sel ? 'true' : 'false'); });
  }
  function useOwn(url, save){
    const im = new Image();
    im.onload = () => { ST.own = im; ST.ownVer++; if (save) js('pgfx_ez_screen_own', url); syncRow(); if (ST.key === 'own') schedEzPreview(0); };
    im.src = url;
  }
  function buildRow(){
    const file = $id('ez-bg-file'); if (!file || $id('ez-screen')) return;
    const ttl = document.createElement('div'); ttl.className = 'ez-subttl'; ttl.id = 'ez-screen-ttl'; ttl.textContent = 'On the laptop screen';
    const row = document.createElement('div'); row.className = 'ez-swatches ez-drawn'; row.id = 'ez-screen';
    row.setAttribute('role', 'group'); row.setAttribute('aria-label', 'Picture on the laptop screen');
    const input = document.createElement('input'); input.type = 'file'; input.id = 'ez-screen-file'; input.accept = 'image/*,.heic,.heif'; input.style.display = 'none';
    file.after(ttl, row, input);
    const add = (key, title, dress, onclick) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'ez-sw ez-gsw';
      b.dataset.screen = key; b.title = title; b.setAttribute('aria-label', title); dress(b); b.onclick = onclick || (() => pick(key)); row.appendChild(b); return b; };
    add('', 'Screen off, as photographed', b => { b.textContent = 'OFF'; b.style.background = 'var(--surface-sunk)'; b.style.color = 'var(--text-dim)'; b.style.font = '700 9px/1.1 var(--ui)'; });   // not .orig: syncEzSwatches lights the first .orig
    WALLS.forEach(w => add(w.key, w.name, b => { b.style.backgroundImage = 'url("' + paint(w.key, 96, 60).toDataURL('image/jpeg', 0.85) + '")'; }));
    add('own', 'Your picture', b => { b.style.display = 'none'; });
    const up = document.createElement('button'); up.type = 'button'; up.className = 'ez-sw'; up.title = 'Put your own picture on the screen';
    up.setAttribute('aria-label', up.title); up.textContent = '📷'; up.style.fontSize = '18px'; up.style.background = 'var(--panel2)';
    up.onclick = () => input.click(); row.appendChild(up);
    input.addEventListener('change', async e => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      e.target.value = '';
      try {
        const raw = await fileToDataUrl(f), url = await downscaleDataUrl(raw, 1600);
        useOwn(url, true); ST.key = 'own'; js('pgfx_ez_screen', 'own');
        if (typeof toast === 'function') toast('Your picture is on the screen');
      } catch (err){ if (!err || !err.pgxToasted) toast('That picture could not be read, try a JPG, PNG or HEIC', 'error'); }
    });
    syncRow();
  }
  const _sched = schedEzPreview;
  schedEzPreview = function(){ const r = _sched.apply(this, arguments); try { syncRow(); } catch (e){} return r; };
  if (typeof syncEzSwatches === 'function'){          // it clears .sel from every swatch, this row's too
    const _sync = syncEzSwatches;
    syncEzSwatches = function(){ const r = _sync.apply(this, arguments); try { syncRow(); } catch (e){} return r; };
  }
  buildRow();
  { const url = jg('pgfx_ez_screen_own', null); if (typeof url === 'string' && /^data:image\//.test(url)) useOwn(url, false); }

  window.MAC_WALLPAPERS = { list: WALLS.map(w => ({ key: w.key, name: w.name, note: w.note })), paint, SCREENS, screenOf, litFor, screen: ST };
})();
