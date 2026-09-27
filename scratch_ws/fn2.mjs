export function wall_schematic(x, y, w, h, P, R, id) {
  const F = n => n.toFixed(1);
  const m = Math.min(w, h);

  const lin = v => (v /= 255) <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4);
  const L = c => {
    const t = String(c || '').replace('#', '');
    const q = t.length === 3 ? t[0] + t[0] + t[1] + t[1] + t[2] + t[2] : t.slice(0, 6);
    if (!/^[0-9a-fA-F]{6}$/.test(q)) return .18;
    const n = parseInt(q, 16);
    return .2126 * lin((n >> 16) & 255) + .7152 * lin((n >> 8) & 255) + .0722 * lin(n & 255);
  };
  const CR = (a, b) => { const p = L(a), q = L(b); return (Math.max(p, q) + .05) / (Math.min(p, q) + .05); };
  let bg = P.dark;
  for (const c of [P.dark, P.ground, P.ink, P.ground2])
    if (typeof c === 'string' && L(c) < L(bg)) bg = c;
  const far = c => typeof c === 'string' && CR(c, bg) >= 2.8;
  const ranked = [P.accent, P.hot, P.paper, P.body, P.ink, P.ground2]
    .filter(c => typeof c === 'string')
    .sort((a, b) => CR(b, bg) - CR(a, bg));
  const A = far(P.accent) ? P.accent : (ranked[0] || P.paper);
  const B = (far(P.hot) && P.hot !== A) ? P.hot : (ranked.find(c => c !== A && far(c)) || A);

  const s1 = Math.max(1, m * .016), s2 = Math.max(.75, m * .010), s3 = Math.max(.5, m * .007);

  const fl = R.chance(.5);
  const X = u => x + w * (fl ? 1 - u : u);
  const Y = v => y + h * v;
  const BX = (u0, v0, u1, v1) => {
    const a = X(u0), b = X(u1);
    return { x: Math.min(a, b), y: Y(v0), w: Math.abs(b - a), h: (v1 - v0) * h };
  };
  const rc = (b, r, fill, fo, st, sw, so) =>
    `<rect x="${F(b.x)}" y="${F(b.y)}" width="${F(b.w)}" height="${F(b.h)}" rx="${F(r)}"` +
    (fill ? ` fill="${fill}" fill-opacity="${fo}"` : ' fill="none"') +
    (st ? ` stroke="${st}" stroke-width="${F(sw)}" stroke-opacity="${so}"` : '') + '/>';
  const ci = (cx, cy, r, fill, fo, st, sw, so) =>
    `<circle cx="${F(cx)}" cy="${F(cy)}" r="${F(r)}"` +
    (fill ? ` fill="${fill}" fill-opacity="${fo}"` : ' fill="none"') +
    (st ? ` stroke="${st}" stroke-width="${F(sw)}" stroke-opacity="${so}"` : '') + '/>';
  const ln = (pts, st, sw, so) =>
    `<path d="M${pts.map(p => F(p[0]) + ' ' + F(p[1])).join('L')}" fill="none" stroke="${st}" ` +
    `stroke-width="${F(sw)}" stroke-opacity="${so}" stroke-linejoin="round" stroke-linecap="round"/>`;

  const gid = id + 'gl', cid = id + 'cp';
  const defs =
    `<radialGradient id="${gid}" gradientUnits="userSpaceOnUse" cx="${F(X(.34))}" cy="${F(Y(.26))}" r="${F(Math.max(w, h) * .78)}">` +
    `<stop offset="0" stop-color="${A}" stop-opacity=".24"/>` +
    `<stop offset="1" stop-color="${A}" stop-opacity="0"/></radialGradient>` +
    `<clipPath id="${cid}"><rect x="${F(x)}" y="${F(y)}" width="${F(w)}" height="${F(h)}"/></clipPath>`;

  let s = `<rect x="${F(x)}" y="${F(y)}" width="${F(w)}" height="${F(h)}" fill="${bg}"/>` +
          `<rect x="${F(x)}" y="${F(y)}" width="${F(w)}" height="${F(h)}" fill="url(#${gid})"/>`;

  const g = m / 3.4;
  for (let gx = x + ((w % g) + g) / 2; gx < x + w - 1; gx += g)
    s += ln([[gx, y], [gx, y + h]], A, s3 * .8, '.10');
  for (let gy = y + ((h % g) + g) / 2; gy < y + h - 1; gy += g)
    s += ln([[x, gy], [x + w, gy]], A, s3 * .8, '.10');

  s += rc(BX(.045, .035, .955, .965), m * .10, null, 0, A, s2, '.40');

  const bV1 = R.f(.375, .43);
  const btV = R.f(.505, .55);

  const bd = BX(.105, .085, .565, bV1);
  s += rc(bd, m * .03, A, '.09', A, s1, '.90');
  const chips = [
    { a: .07, b: .09, c: .55, d: .45, soc: 1 },
    { a: .62, b: .09, c: .93, d: .31, k: 1 },
    { a: .62, b: .40, c: .93, d: .62, k: 1 },
    { a: .07, b: .56, c: .43, d: .91, k: 1 },
    { a: .51, b: .70, c: .93, d: .91, k: 1 },
  ];
  for (const q of chips) {
    if (q.k && !R.chance(.72)) continue;
    const a = fl ? 1 - q.c : q.a, c = fl ? 1 - q.a : q.c;
    const cb = { x: bd.x + bd.w * a, y: bd.y + bd.h * q.b, w: bd.w * (c - a), h: bd.h * (q.d - q.b) };
    if (q.soc) {
      s += rc(cb, m * .012, B, '.22', B, s2, '.95');
      s += rc({ x: cb.x + cb.w * .2, y: cb.y + cb.h * .2, w: cb.w * .6, h: cb.h * .6 }, m * .008, null, 0, B, s3, '.60');
    } else {
      s += rc(cb, m * .010, A, '.14', A, s2, '.78');
    }
  }

  const cm = BX(.63, .085, .925, .30);
  s += rc(cm, m * .06, B, '.18', B, s1, '.92');
  const vert = cm.h >= cm.w, nl = R.i(2, 3);
  const span = vert ? cm.h : cm.w, cross = vert ? cm.w : cm.h;
  const lr = Math.min(cross * .30, span / (nl + 1) * .42);
  for (let i = 0; i < nl; i++) {
    const t = (i + 1) / (nl + 1);
    const lx = vert ? cm.x + cm.w * .40 : cm.x + cm.w * t;
    const ly = vert ? cm.y + cm.h * t : cm.y + cm.h * .44;
    s += ci(lx, ly, lr, null, 0, B, s2, '.95');
    s += ci(lx, ly, lr * .38, A, '.65', null, 0, 0);
  }
  s += ci(vert ? cm.x + cm.w * .78 : cm.x + cm.w * .5, vert ? cm.y + cm.h * .82 : cm.y + cm.h * .82,
          lr * .40, A, '.35', A, s3, '.80');

  const bt = BX(.10, btV, .90, .895);
  s += rc(bt, m * .045, A, '.16', A, s1 * 1.15, '.95');
  const tw = bt.w * .085, th = Math.max(1.4, m * .026);
  for (let i = 0; i < 2; i++)
    s += rc({ x: bt.x + bt.w * (.415 + i * .125), y: bt.y - th, w: tw, h: th }, th * .3, A, '.9', null, 0, 0);
  const nd = R.i(1, 2);
  for (let i = 1; i <= nd; i++) {
    const t = i / (nd + 1);
    if (bt.w >= bt.h) s += ln([[bt.x + bt.w * t, bt.y + bt.h * .14], [bt.x + bt.w * t, bt.y + bt.h * .86]], A, s2, '.55');
    else s += ln([[bt.x + bt.w * .12, bt.y + bt.h * t], [bt.x + bt.w * .88, bt.y + bt.h * t]], A, s2, '.55');
  }

  const j1 = bV1 + (btV - bV1) * .42, j2 = bV1 + (btV - bV1) * .74;
  s += ln([[X(.20), Y(bV1)], [X(.20), Y(j1)], [X(.33), Y(j1)], [X(.33), Y(btV)]], B, s2, '.70');
  s += ln([[X(.47), Y(bV1)], [X(.47), Y(j2)], [X(.71), Y(j2)], [X(.71), Y(btV)]], B, s2, '.70');
  s += ln([[X(.70), Y(.30)], [X(.70), Y(.345)], [X(.565), Y(.345)]], B, s2, '.70');
  s += ln([[X(.88), Y(.30)], [X(.88), Y(btV - .028)], [X(.80), Y(btV - .028)], [X(.80), Y(btV)]], B, s2, '.55');
  const pd = Math.max(1.2, m * .034);
  for (const p of [[X(.20), Y(bV1)], [X(.47), Y(bV1)], [X(.33), Y(btV)], [X(.71), Y(btV)], [X(.88), Y(.30)], [X(.80), Y(btV)]])
    s += rc({ x: p[0] - pd / 2, y: p[1] - pd / 2, w: pd, h: pd }, pd * .28, B, '.85', null, 0, 0);

  const pt = BX(.415, .915, .585, .952);
  s += rc(pt, pt.h * .5, A, '.28', A, s2, '.75');
  const sr = Math.max(.9, m * .026);
  for (const p of [[.085, .062], [.915, .062], [.085, .945], [.915, .945]]) {
    s += ci(X(p[0]), Y(p[1]), sr, null, 0, A, s2, '.60');
    s += ci(X(p[0]), Y(p[1]), sr * .34, A, '.70', null, 0, 0);
  }

  return { defs, body: `<g clip-path="url(#${cid})">${s}</g>` };
}
