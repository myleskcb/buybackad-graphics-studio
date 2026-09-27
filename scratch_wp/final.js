function wall_poly(x, y, w, h, P, R, id) {
  const f = n => n.toFixed(1);
  const rgb = c => { let s = String(c || '#000').replace('#', ''); if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2]; const n = parseInt(s, 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const lum = c => { const p = rgb(c); return (p[0] * .2126 + p[1] * .7152 + p[2] * .0722) / 255; };
  const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); let s = '#'; for (let i = 0; i < 3; i++) { const v = Math.max(0, Math.min(255, Math.round(A[i] + (B[i] - A[i]) * t))); s += (v < 16 ? '0' : '') + v.toString(16); } return s; };

  const pool = [];
  [P.dark, P.ink, P.ground2, P.body, P.accent, P.hot, P.paper].forEach(c => { if (c && pool.indexOf(c) < 0) pool.push(c); });
  pool.sort((a, b) => lum(a) - lum(b));
  const k = Math.max(1, Math.min(3, Math.floor(pool.length / 2)));
  const darks = pool.slice(0, k), lights = pool.slice(pool.length - k);
  const mids = pool.slice(k, pool.length - k);
  if (mids.length && R.chance(.5)) {
    const m = R.pick(mids);
    if (lum(lights[0]) - lum(m) <= lum(m) - lum(darks[k - 1])) lights[0] = m; else darks[k - 1] = m;
  }

  const a = Math.max(.18, Math.min(5, w / h));
  const cells = Math.round(R.i(34, 72) / 2);
  let rows = Math.max(2, Math.round(Math.sqrt(cells / a)));
  let cols = Math.max(2, Math.round(a * rows));
  while (cols * rows * 2 > 80) { if (cols / a >= rows) cols--; else rows--; if (cols < 2) { cols = 2; rows--; } if (rows < 2) { rows = 2; break; } }
  while (cols * rows * 2 < 30) { if (cols / a <= rows) cols++; else rows++; }

  const cw = w / cols, ch = h / rows;
  const px = [], py = [];
  for (let r = 0; r <= rows; r++) {
    px.push([]); py.push([]);
    for (let c = 0; c <= cols; c++) {
      px[r].push(x + c * cw + (c > 0 && c < cols ? R.f(-.36, .36) * cw : 0));
      py[r].push(y + r * ch + (r > 0 && r < rows ? R.f(-.36, .36) * ch : 0));
    }
  }

  const gx = R.f(-1, 1), gy = R.f(-1, 1), gn = Math.abs(gx) + Math.abs(gy) + 1e-6, ulo = Math.min(0, gx) + Math.min(0, gy);
  let m = '';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const A = [px[r][c], py[r][c]], B = [px[r][c + 1], py[r][c + 1]];
    const C = [px[r + 1][c + 1], py[r + 1][c + 1]], D = [px[r + 1][c], py[r + 1][c]];
    const tris = R.chance(.5) ? [[A, B, C], [A, C, D]] : [[A, B, D], [B, C, D]];
    for (let t = 0; t < 2; t++) {
      const T = tris[t];
      const cx = (T[0][0] + T[1][0] + T[2][0]) / 3, cy = (T[0][1] + T[1][1] + T[2][1]) / 3;
      const u = (cx - x) / w * gx + (cy - y) / h * gy;
      const band = (u - ulo) / gn;
      let i = Math.floor(band * k + R.f(-.34, .34));
      i = Math.max(0, Math.min(k - 1, i));
      const set = ((r + c + t) % 2 === 0) !== R.chance(.15) ? darks : lights;
      const col = mix(set[i], set[(i + 1) % set.length], R.f(0, .32));
      m += `<path d="M${f(T[0][0])} ${f(T[0][1])}L${f(T[1][0])} ${f(T[1][1])}L${f(T[2][0])} ${f(T[2][1])}Z" fill="${col}" stroke="${col}"/>`;
    }
  }

  return {
    defs: `<clipPath id="${id}poly"><rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}"/></clipPath>`,
    body: `<g clip-path="url(#${id}poly)"><rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${darks[0]}"/>` +
      `<g stroke-width="${Math.max(.4, Math.min(w, h) * .005).toFixed(1)}" stroke-linejoin="round">${m}</g></g>`,
  };
}
