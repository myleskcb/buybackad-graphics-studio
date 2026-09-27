function wall_bands(x, y, w, h, P, R, id) {
  var toRGB = function (c) {
    var s = String(c == null ? '' : c).replace('#', '');
    if (s.length === 3) s = s.charAt(0) + s.charAt(0) + s.charAt(1) + s.charAt(1) + s.charAt(2) + s.charAt(2);
    var n = parseInt(s.slice(0, 6), 16);
    if (!isFinite(n)) n = 0;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  var mix = function (a, b, t) {
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    var A = toRGB(a), B = toRGB(b);
    var r = Math.round(A[0] + (B[0] - A[0]) * t);
    var g = Math.round(A[1] + (B[1] - A[1]) * t);
    var l = Math.round(A[2] + (B[2] - A[2]) * t);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + l).toString(16).slice(1);
  };
  var lum = function (c) { var A = toRGB(c); return (A[0] * 0.299 + A[1] * 0.587 + A[2] * 0.114) / 255; };

  var G = P.ground, G2 = P.ground2, BD = P.body, AC = P.accent, HO = P.hot, PA = P.paper, DK = P.dark;
  var tri = R.pick([
    [DK, AC, HO], [G, AC, PA], [HO, G2, DK], [DK, HO, PA],
    [G2, HO, DK], [PA, AC, DK], [DK, AC, PA], [G, HO, PA],
    [G2, AC, DK], [DK, BD, HO], [PA, HO, G], [DK, G2, AC]
  ]).slice(0);
  if (R.chance(0.5)) tri = [tri[2], tri[1], tri[0]];
  var c0 = tri[0], c1 = tri[1], c2 = tri[2];
  if (Math.abs(lum(c0) - lum(c2)) < 0.20) c2 = lum(c0) > 0.5 ? DK : PA;
  if (Math.abs(lum(c1) - lum(c0)) < 0.14 && Math.abs(lum(c1) - lum(c2)) < 0.14) c1 = lum(c0) > 0.5 ? HO : AC;
  var LT = lum(c1) > 0.55 ? DK : PA;
  var DKX = lum(c1) > 0.55 ? DK : (lum(DK) < lum(G) ? DK : G);

  var n = R.i(40, 90);
  var amp = R.f(0.13, 0.28);
  var wts = [], tot = 0, i;
  for (i = 0; i < n; i++) {
    var wt = R.chance(0.12) ? R.f(1.9, 3.6) : R.f(0.45, 1.05);
    wts.push(wt); tot += wt;
  }
  var edge = [], acc = 0;
  edge.push(+y.toFixed(1));
  for (i = 0; i < n; i++) { acc += wts[i]; edge.push(+(y + h * acc / tot).toFixed(1)); }
  edge[n] = +(y + h).toFixed(1);

  var X = x.toFixed(1), W = w.toFixed(1);
  var base = mix(c0, c2, 0.5);
  var body = '<rect x="' + X + '" y="' + y.toFixed(1) + '" width="' + W + '" height="' + h.toFixed(1) + '" fill="' + base + '"/>';

  for (i = 0; i < n; i++) {
    var t = (i + 0.5) / n;
    var col = t < 0.5 ? mix(c0, c1, t * 2) : mix(c1, c2, (t - 0.5) * 2);
    var j = amp * (i % 2 ? 1 : -1) * R.f(0.45, 1);
    col = j > 0 ? mix(col, LT, j) : mix(col, DKX, -j);
    if (R.chance(0.11)) col = mix(col, LT, R.f(0.55, 0.90));
    else if (R.chance(0.09)) col = mix(col, DKX, R.f(0.55, 0.88));
    var bh = edge[i + 1] - edge[i];
    if (bh <= 0) continue;
    body += '<rect x="' + X + '" y="' + edge[i].toFixed(1) + '" width="' + W + '" height="' + bh.toFixed(1) + '" fill="' + col + '"/>';
  }

  var hair = Math.max(0.8, h * 0.004);
  var streaks = R.i(3, 6);
  for (i = 0; i < streaks; i++) {
    var k = R.i(1, n - 1);
    var sh = hair * R.f(1, 2.6);
    var sy = edge[k] - sh * 0.5;
    if (sy < y) sy = y;
    if (sy + sh > y + h) sy = y + h - sh;
    body += '<rect x="' + X + '" y="' + sy.toFixed(1) + '" width="' + W + '" height="' + sh.toFixed(1) +
      '" fill="' + (R.chance(0.35) ? HO : LT) + '" opacity="' + R.f(0.55, 0.95).toFixed(1) + '"/>';
  }
  for (i = 0; i < 2; i++) {
    var k2 = R.i(1, n - 1);
    var dy = edge[k2];
    if (dy + hair > y + h) dy = y + h - hair;
    body += '<rect x="' + X + '" y="' + dy.toFixed(1) + '" width="' + W + '" height="' + hair.toFixed(1) +
      '" fill="' + DKX + '" opacity="' + R.f(0.4, 0.8).toFixed(1) + '"/>';
  }

  var sheenAt = R.f(0.25, 0.75);
  var defs =
    '<clipPath id="wbc' + id + '"><rect x="' + X + '" y="' + y.toFixed(1) + '" width="' + W + '" height="' + h.toFixed(1) + '"/></clipPath>' +
    '<linearGradient id="wbs' + id + '" x1="0" y1="0" x2="1" y2="0">' +
    '<stop offset="0" stop-color="' + LT + '" stop-opacity="0"/>' +
    '<stop offset="' + sheenAt.toFixed(1) + '" stop-color="' + LT + '" stop-opacity="' + R.f(0.08, 0.18).toFixed(1) + '"/>' +
    '<stop offset="1" stop-color="' + LT + '" stop-opacity="0"/></linearGradient>' +
    '<linearGradient id="wbd' + id + '" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="' + DKX + '" stop-opacity="' + R.f(0.10, 0.30).toFixed(1) + '"/>' +
    '<stop offset="0.5" stop-color="' + DKX + '" stop-opacity="0"/>' +
    '<stop offset="1" stop-color="' + DKX + '" stop-opacity="' + R.f(0.10, 0.34).toFixed(1) + '"/></linearGradient>';

  body += '<rect x="' + X + '" y="' + y.toFixed(1) + '" width="' + W + '" height="' + h.toFixed(1) + '" fill="url(#wbs' + id + ')"/>' +
    '<rect x="' + X + '" y="' + y.toFixed(1) + '" width="' + W + '" height="' + h.toFixed(1) + '" fill="url(#wbd' + id + ')"/>';

  return { defs: defs, body: '<g clip-path="url(#wbc' + id + ')">' + body + '</g>' };
}
module.exports = wall_bands;
