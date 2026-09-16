export function wall_hills(x, y, w, h, P, R, id) {
  const F = n => (Math.round(n * 10) / 10).toFixed(1);
  const rgb = c => {
    let s = String(c == null ? '' : c).replace('#', '').trim();
    if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    const v = parseInt(s.slice(0, 6), 16);
    const n = v >= 0 ? v : 0;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const lum = c => {
    const p = rgb(c).map(v => { const s = v / 255; return s <= .03928 ? s / 12.92 : Math.pow((s + .055) / 1.055, 2.4); });
    return .2126 * p[0] + .7152 * p[1] + .0722 * p[2];
  };
  const mix = (a, b, t) => {
    const A = rgb(a), B = rgb(b);
    return '#' + [0, 1, 2].map(i => Math.round(A[i] + (B[i] - A[i]) * t).toString(16).padStart(2, '0')).join('');
  };
  const apart = (c, ref, need) => {
    if (Math.abs(lum(c) - lum(ref)) >= need) return c;
    const tgt = Math.abs(lum(P.paper) - lum(ref)) > Math.abs(lum(P.dark) - lum(ref)) ? P.paper : P.dark;
    let out = c;
    for (let k = 2; k <= 5; k++) { out = mix(c, tgt, k / 5); if (Math.abs(lum(out) - lum(ref)) >= need) break; }
    return out;
  };

  const pool = [];
  [P.paper, P.hot, P.accent, P.ink, P.dark].forEach(c => { if (typeof c === 'string' && c && pool.indexOf(c) < 0) pool.push(c); });
  [P.ground2, P.body].forEach(c => { if (pool.length < 2 && typeof c === 'string' && c && pool.indexOf(c) < 0) pool.push(c); });
  while (pool.length < 2) pool.push(mix(pool[0] || P.dark, P.paper, pool.length ? .85 : .15));
  const sorted = pool.slice().sort((a, b) => lum(a) - lum(b));
  const cut = Math.max(1, Math.floor(sorted.length / 2));
  const dk = sorted.slice(0, cut), lt = sorted.slice(cut);
  if (!lt.length) lt.push(mix(dk[dk.length - 1], P.paper, .8));
  if (!dk.length) dk.push(mix(lt[0], P.dark, .8));

  const pair = R.pick([[P.ink, P.paper], [P.dark, P.hot], [P.accent, P.paper], [P.hot, P.paper],
    [P.dark, P.accent], [P.accent, P.hot], [P.ink, P.hot], [P.dark, P.paper]]);
  const top = pair[0] || P.dark || dk[0];
  let bot = pair[1] || P.paper || lt[lt.length - 1];
  bot = apart(bot, top, .14);
  const mid = R.f(.48, .70), glow = mix(top, bot, R.f(.30, .48));
  const skyAt = t => { const u = Math.max(0, Math.min(1, t)); return u < mid ? mix(top, glow, u / mid) : mix(glow, bot, (u - mid) / (1 - mid)); };

  const n = R.pick([3, 3, 4, 4, 4, 5]);
  const base = R.f(.46, .56), step = (.97 - base) / (n - 1);
  const amp = [];
  for (let i = 0; i < n; i++) amp.push(i ? step * R.f(.48, .80) : Math.min(base - .20, step * R.f(.9, 1.5)));
  const sky = Math.max(.08, base - amp[0] - .03);

  const seq = [], bag = { l: [], d: [] }, seen = {};
  let wantLight = lum(bot) < .5;
  for (let i = 0; i < n; i++) {
    const g = wantLight ? 'l' : 'd';
    if (!bag[g].length) bag[g] = (wantLight ? lt : dk).slice();
    const c = bag[g].splice(R.i(0, bag[g].length - 1), 1)[0];
    seq.push(seen[c] ? mix(c, wantLight ? P.dark : P.paper, .24) : c);
    seen[c] = 1;
    wantLight = !wantLight;
  }
  let prev = bot;
  for (let i = 0; i < n; i++) { seq[i] = apart(seq[i], prev, .24); prev = seq[i]; }

  let sun = '';
  if (R.chance(.78)) {
    const band = h * sky;
    const sr = Math.min(Math.min(w, h) * R.f(.13, .21), band * .62);
    const sc = x + w * R.f(.16, .84), sy = y + Math.max(sr * 1.08, band * R.f(.5, 1));
    const back = skyAt((sy - y) / band);
    const disc = apart(pool.reduce((b, c) => Math.abs(lum(c) - lum(back)) > Math.abs(lum(b) - lum(back)) ? c : b, pool[0]), back, .28);
    sun = R.chance(.35)
      ? `<circle cx="${F(sc)}" cy="${F(sy)}" r="${F(sr)}" fill="none" stroke="${disc}" stroke-width="${F(sr * .34)}"/>`
      : `<circle cx="${F(sc)}" cy="${F(sy)}" r="${F(sr)}" fill="${disc}"/>`;
  }

  const over = w * .14, xl = x - over, xr = x + w + over, yb = y + h;
  let m = '';
  const detail = Math.sqrt(Math.max(1, (w / h) / .55));
  for (let i = 0; i < n; i++) {
    const v = y + h * (base + step * i), a = h * amp[i];
    const segs = Math.max(2, Math.min(8, Math.round((R.i(3, 5) - i * .8) * detail)));
    const up = R.chance(.5) ? 1 : 0, sp = (xr - xl) / segs, pts = [];
    for (let j = 0; j <= segs; j++)
      pts.push([xl + sp * j + (j > 0 && j < segs ? R.f(-sp * .32, sp * .32) : 0),
        v - a * (j % 2 === up ? R.f(.62, 1) : R.f(0, .16))]);
    let d = `M${F(pts[0][0])} ${F(pts[0][1])}`;
    for (let j = 1; j < segs; j++)
      d += `Q${F(pts[j][0])} ${F(pts[j][1])} ${F((pts[j][0] + pts[j + 1][0]) / 2)} ${F((pts[j][1] + pts[j + 1][1]) / 2)}`;
    d += `L${F(pts[segs][0])} ${F(pts[segs][1])}L${F(xr)} ${F(yb)}L${F(xl)} ${F(yb)}Z`;
    m += `<path d="${d}" fill="${seq[i]}"/>`;
  }

  return {
    defs: `<linearGradient id="${id}s" gradientUnits="userSpaceOnUse" x1="${F(x)}" y1="${F(y)}" x2="${F(x)}" y2="${F(y + h * sky)}">` +
      `<stop offset="0" stop-color="${top}"/><stop offset="${mid.toFixed(1)}" stop-color="${glow}"/>` +
      `<stop offset="1" stop-color="${bot}"/></linearGradient>` +
      `<clipPath id="${id}c"><rect x="${F(x)}" y="${F(y)}" width="${F(w)}" height="${F(h)}"/></clipPath>`,
    body: `<g clip-path="url(#${id}c)"><rect x="${F(x)}" y="${F(y)}" width="${F(w)}" height="${F(h)}" fill="url(#${id}s)"/>${sun}${m}</g>`,
  };
}
