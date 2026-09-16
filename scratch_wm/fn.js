function wall_mesh(x, y, w, h, P, R, id) {
  const n = v => v.toFixed(1);
  const o = v => Math.max(0, Math.min(1, v)).toFixed(2);
  const key = c => {
    let s = String(c == null ? '' : c).trim().toLowerCase().replace(/^#/, '');
    if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    return s.slice(0, 6);
  };
  const ok = s => /^[0-9a-f]{6}$/.test(s);

  const seen = {}, ent = [], gk = key(P.ground);
  const add = c => {
    const k = key(c);
    if (!ok(k) || seen[k]) return;
    seen[k] = 1;
    const v = parseInt(k, 16), r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
    const f = u => { u /= 255; return u <= .03928 ? u / 12.92 : Math.pow((u + .055) / 1.055, 2.4); };
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let hu = 0;
    if (d) hu = 60 * (mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? ((b - r) / d + 2) : ((r - g) / d + 4));
    ent.push({ c: '#' + k, l: .2126 * f(r) + .7152 * f(g) + .0722 * f(b), s: d / 255, h: hu });
  };
  for (const c of [P.dark, P.ink, P.accent, P.hot, P.paper, P.ground2, P.body]) if (key(c) !== gk) add(c);
  if (ent.length < 3) add(P.ground);

  const rect = `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"`;
  if (ent.length < 2) return { defs: '', body: `${rect} fill="${ent.length ? ent[0].c : P.dark}"/>` };

  ent.sort((a, b) => a.l - b.l);
  const light = ent[ent.length - 1].l > .55 && R.chance(.25);
  const base = light ? ent[ent.length - 1] : ent[0];
  const other = ent.filter(e => e !== base);

  const chrom = other.filter(e => e.s >= .18 && Math.abs(e.l - base.l) >= .10).sort((a, b) => b.s - a.s);
  const deck = [];
  for (const e of chrom) {
    if (deck.length >= 3) break;
    if (deck.every(p => { const dh = Math.abs(p.h - e.h); return Math.min(dh, 360 - dh) >= 22; })) deck.push(e);
  }
  for (const e of chrom) if (deck.length < 2 && deck.indexOf(e) < 0) deck.push(e);
  for (const e of other.slice().sort((a, b) => Math.abs(b.l - base.l) - Math.abs(a.l - base.l)))
    if (deck.length < 2 && deck.indexOf(e) < 0) deck.push(e);

  const pale = other.filter(e => deck.indexOf(e) < 0 && Math.abs(e.l - base.l) > .32)
                    .sort((a, b) => Math.abs(b.l - base.l) - Math.abs(a.l - base.l))[0];

  const list = [];
  if (pale && R.chance(.62)) list.push({ e: pale, k: R.f(.66, .84), a: R.f(.74, .95) });
  const ord = deck.slice();
  for (let i = ord.length - 1; i > 0; i--) { const j = R.i(0, i), t = ord[i]; ord[i] = ord[j]; ord[j] = t; }
  const want = Math.min(ord.length, list.length ? R.i(2, 3) : 3);
  for (let i = 0; i < want; i++) list.push({ e: ord[i], k: R.f(.74, 1.14), a: R.f(.9, 1) });

  const S = Math.max(w, h) * .46, cx0 = x + w / 2, cy0 = y + h / 2;
  const start = R.f(0, Math.PI * 2), step = Math.PI * 2 / list.length;
  let d = '', g = '';

  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    const a = start + i * step + R.f(-.34, .34);
    const cx = cx0 + Math.cos(a) * w * R.f(.24, .42);
    const cy = cy0 + Math.sin(a) * h * R.f(.24, .44);
    const rx = S * b.k, ry = rx * R.f(.85, 1.4), rot = R.i(0, 179);
    const gid = id + 'm' + i;
    d += `<radialGradient id="${gid}" cx="50%" cy="50%" r="50%">` +
         `<stop offset="0" stop-color="${b.e.c}" stop-opacity="${o(b.a)}"/>` +
         `<stop offset="58%" stop-color="${b.e.c}" stop-opacity="${o(b.a * .88)}"/>` +
         `<stop offset="100%" stop-color="${b.e.c}" stop-opacity="0"/></radialGradient>`;
    g += `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}"` +
         ` transform="rotate(${rot} ${n(cx)} ${n(cy)})" fill="url(#${gid})"/>`;
  }

  const spark = deck.slice().sort((a, b) =>
    (b.s * .6 + Math.abs(b.l - base.l) * .4) - (a.s * .6 + Math.abs(a.l - base.l) * .4))[0] || ord[0];
  const sr = S * R.f(.36, .52), sq = R.chance(.5) ? 1 : -1, sp = R.chance(.5) ? 1 : -1;
  d += `<radialGradient id="${id}k" cx="50%" cy="50%" r="50%">` +
       `<stop offset="0" stop-color="${spark.c}" stop-opacity=".92"/>` +
       `<stop offset="50%" stop-color="${spark.c}" stop-opacity=".6"/>` +
       `<stop offset="100%" stop-color="${spark.c}" stop-opacity="0"/></radialGradient>`;
  g += `<ellipse cx="${n(cx0 + sq * R.f(.14, .3) * w)}" cy="${n(cy0 + sp * R.f(.18, .36) * h)}"` +
       ` rx="${n(sr)}" ry="${n(sr * R.f(.85, 1.25))}" fill="url(#${id}k)"/>`;

  d += `<filter id="${id}b" x="-70%" y="-70%" width="240%" height="240%" color-interpolation-filters="sRGB">` +
       `<feGaussianBlur stdDeviation="${n(S * R.f(.055, .085))}"/></filter>`;
  d += `<clipPath id="${id}c">${rect}/></clipPath>`;

  let over = '';
  if (R.chance(.75)) {
    d += `<radialGradient id="${id}v" cx="50%" cy="42%" r="78%">` +
         `<stop offset="45%" stop-color="${base.c}" stop-opacity="0"/>` +
         `<stop offset="100%" stop-color="${base.c}" stop-opacity="${o(R.f(.3, .5))}"/></radialGradient>`;
    over = `${rect} fill="url(#${id}v)"/>`;
  }

  return {
    defs: d,
    body: `<g clip-path="url(#${id}c)">${rect} fill="${base.c}"/>` +
          `<g filter="url(#${id}b)">${g}</g>${over}</g>`,
  };
}
module.exports = wall_mesh;
