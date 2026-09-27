function wall_field(x, y, w, h, P, R, id) {
  /* The quiet screen of the set: one flat colour field, one mark. The mark rides
     in a corner band — the outer fifth of the long side — so its hard edge can
     never cut through the middle 60%, where the caller stamps a brand mark; all
     that crosses the middle is a slow, smooth falloff. No fine detail anywhere,
     so nothing here turns to mush when the screen is 90px wide. */
  var n = function (v) { return v.toFixed(1); };
  var o = function (v) { return v.toFixed(2); };

  /* contrast is measured, not assumed, so the mark still reads after the card
     recolours itself into a palette this function never saw */
  var hex = function (c) {
    var s = String(c == null ? '' : c).replace('#', '');
    if (s.length === 3) s = s.charAt(0) + s.charAt(0) + s.charAt(1) + s.charAt(1) + s.charAt(2) + s.charAt(2);
    return /^[0-9a-fA-F]{6}$/.test(s) ? s : null;
  };
  var lum = function (c) {
    var s = hex(c); if (!s) return .5;
    var v = parseInt(s, 16), ch = [(v >> 16 & 255) / 255, (v >> 8 & 255) / 255, (v & 255) / 255];
    var kk = [.2126, .7152, .0722], L = 0, t, u;
    for (t = 0; t < 3; t++) { u = ch[t]; L += kk[t] * (u <= .04045 ? u / 12.92 : Math.pow((u + .055) / 1.055, 2.4)); }
    return L;
  };
  var cr = function (a, b) { var A = lum(a), B = lum(b); return (Math.max(A, B) + .05) / (Math.min(A, B) + .05); };

  /* every role except the card's own ground: a screen painted the colour of the
     card it sits on reads as a phone that is switched off. Ground comes back
     only as a last resort, if the palette is too thin to build a field from. */
  var all = [P.accent, P.hot, P.ink, P.ground2, P.paper, P.dark, P.body], pool = [], seen = {}, i, j, c, k;
  var gk = String(P.ground == null ? '' : P.ground).toLowerCase();
  for (i = 0; i < all.length; i++) {
    c = all[i]; k = String(c == null ? '' : c).toLowerCase();
    if (!hex(c) || seen[k] || k === gk) continue;
    seen[k] = 1; pool.push(c);
  }
  if (pool.length < 2 && hex(P.ground)) pool.push(P.ground);
  if (pool.length < 2) pool = ['#000000', '#FFFFFF'];

  /* the light is usually the lighter of the pair — a pool of light on a deep
     field. Now and then it inverts, which reads as a shaded screen. */
  var lift = !R.chance(.25);
  var wide = [], byBase = {}, bases = [], best = null, p, q, up, L;
  for (i = 0; i < pool.length; i++) for (j = 0; j < pool.length; j++) {
    if (i === j) continue;
    q = cr(pool[i], pool[j]);
    L = Math.max(lum(pool[i]), lum(pool[j]));
    up = lum(pool[j]) > lum(pool[i]);
    p = { base: pool[i], glow: pool[j], k: q, up: up };
    if (!best || q > best.k) best = p;
    /* 3.2:1, and one of the two genuinely bright — two dim colours a few stops
       apart are still one grey smudge once the card is on a shelf */
    if (q < 3.2 || L < .32 || cr(pool[i], P.ground) < 1.15) continue;
    wide.push(p);
    if (up !== lift) continue;
    if (!byBase[pool[i]]) { byBase[pool[i]] = []; bases.push(pool[i]); }
    byBase[pool[i]].push(p);
  }
  /* pick the field first, so no one palette role owns most of the seeds */
  p = bases.length ? R.pick(byBase[R.pick(bases)]) : (wide.length ? R.pick(wide) : best);
  var base = p.base, glow = p.glow;

  /* the deepest role left over, for the shade that falls away from the light */
  var deep = null;
  for (i = 0; i < pool.length; i++) if (pool[i] !== base && pool[i] !== glow && (!deep || lum(pool[i]) < lum(deep))) deep = pool[i];
  if (!deep) for (i = 0; i < pool.length; i++) if (pool[i] !== base && (!deep || lum(pool[i]) < lum(deep))) deep = pool[i];

  var tall = h >= w, s = Math.min(w, h);
  var near = R.chance(.6);                                   /* top / left, else bottom / right */
  var band = (tall ? h : w) * .2;                            /* the strip the mark lives in */
  var off = R.f(-.18, .42) * band;                           /* the mark may hang off the edge */
  var lim = band - off;                                      /* room left before the middle */
  var along = R.f(.11, .36); if (R.chance(.5)) along = 1 - along;
  var cx, cy;
  if (tall) { cx = x + w * along; cy = near ? y + off : y + h - off; }
  else { cy = y + h * along; cx = near ? x + off : x + w - off; }

  /* a soft pool only where the light is the lighter colour: a dark blob with no
     edge reads as a smudge on the glass, a dark disc with one reads as drawn */
  var soft = p.up && R.chance(.4) && lim > s * .1;
  var core = soft ? 0 : Math.min(lim * R.f(.74, .97), s * .5);
  var pr = soft ? Math.max(s * .38, Math.min(s * .95, lim * R.f(1.25, 1.85)))
                : Math.max(s * .5, Math.min(s * 1.25, lim * R.f(1.7, 2.7)));
  var po = soft ? R.f(.80, .95) : R.f(.40, .58);
  var pl = soft ? R.f(.40, .56) : R.f(.16, .28);             /* plateau, so the light has a body */

  var d = '<radialGradient id="' + id + 'g" gradientUnits="userSpaceOnUse" cx="' + n(cx) + '" cy="' + n(cy) + '" r="' + n(pr) + '">' +
    '<stop offset="0" stop-color="' + glow + '" stop-opacity="' + o(po) + '"/>' +
    '<stop offset="' + o(pl) + '" stop-color="' + glow + '" stop-opacity="' + o(po * .92) + '"/>' +
    '<stop offset="' + o(pl + (soft ? .26 : .3)) + '" stop-color="' + glow + '" stop-opacity="' + o(po * .42) + '"/>' +
    '<stop offset="1" stop-color="' + glow + '" stop-opacity="0"/></radialGradient>' +
    '<clipPath id="' + id + 'c"><rect x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) + '"/></clipPath>';

  var rect = '<rect x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) + '" ';
  var b = rect + 'fill="' + base + '"/>';

  /* a slow shade falling away from the light, so the flat field has a direction */
  if (deep && cr(deep, base) > 1.25) {
    var fx = tall ? .5 : (near ? 1 : 0), fy = tall ? (near ? 1 : 0) : .5;   /* the far end */
    d += '<linearGradient id="' + id + 's" x1="' + o(fx) + '" y1="' + o(fy) + '" x2="' + o(1 - fx) + '" y2="' + o(1 - fy) + '">' +
      '<stop offset="0" stop-color="' + deep + '" stop-opacity="' + o(R.f(.07, .15)) + '"/>' +
      '<stop offset=".62" stop-color="' + deep + '" stop-opacity="0"/></linearGradient>';
    b += rect + 'fill="url(#' + id + 's)"/>';
  }

  b += rect + 'fill="url(#' + id + 'g)"/>';
  if (core > 0) b += '<circle cx="' + n(cx) + '" cy="' + n(cy) + '" r="' + n(core) + '" fill="' + glow + '" fill-opacity="' + o(R.f(.9, 1)) + '"/>';

  return { defs: d, body: '<g clip-path="url(#' + id + 'c)">' + b + '</g>' };
}
module.exports = wall_field;
