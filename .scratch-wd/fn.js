function wall_diagonal(x, y, w, h, P, R, id) {
  var f = function (v) { return (Math.round(v * 10) / 10).toFixed(1); };
  var rgb = function (c) {
    var s = String(c == null ? '' : c).replace(/[^0-9a-fA-F]/g, '');
    if (s.length === 3) s = s.charAt(0) + s.charAt(0) + s.charAt(1) + s.charAt(1) + s.charAt(2) + s.charAt(2);
    s = (s + '000000').slice(0, 6);
    return [parseInt(s.slice(0, 2), 16) || 0, parseInt(s.slice(2, 4), 16) || 0, parseInt(s.slice(4, 6), 16) || 0];
  };
  var hx = function (a) {
    var o = '#', i, v;
    for (i = 0; i < 3; i++) {
      v = Math.round(a[i]); v = v < 0 ? 0 : v > 255 ? 255 : v;
      o += ('0' + v.toString(16)).slice(-2);
    }
    return o;
  };
  var norm = function (c) { return hx(rgb(c)); };
  var lum = function (c) { var a = rgb(c); return (0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]) / 255; };
  var dist = function (a, b) {
    var A = rgb(a), B = rgb(b);
    var dr = (A[0] - B[0]) / 255, dg = (A[1] - B[1]) / 255, db = (A[2] - B[2]) / 255;
    return Math.sqrt((2 * dr * dr + 4 * dg * dg + 3 * db * db) / 9);
  };
  var mix = function (a, b, t) {
    var A = rgb(a), B = rgb(b);
    return hx([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
  };
  var shuffle = function (a) {
    var o = a.slice(), i, j, t;
    for (i = o.length - 1; i > 0; i--) { j = R.i(0, i); t = o[i]; o[i] = o[j]; o[j] = t; }
    return o;
  };

  var raw = [P.ground, P.ground2, P.ink, P.body, P.accent, P.hot, P.paper, P.dark];
  var uniq = [], i, c;
  for (i = 0; i < raw.length; i++) {
    if (!raw[i]) continue;
    c = norm(raw[i]);
    if (uniq.indexOf(c) < 0) uniq.push(c);
  }
  if (!uniq.length) uniq = ['#111111', '#eeeeee'];
  if (uniq.length === 1) uniq.push(lum(uniq[0]) > 0.5 ? '#111111' : '#eeeeee');
  var byLum = uniq.slice().sort(function (a, b) { return lum(a) - lum(b); });

  var darkEnd = byLum.slice(0, Math.max(1, Math.min(2, byLum.length - 1)));
  var lightEnd = byLum.slice(Math.max(1, byLum.length - 2));
  var ground = R.pick(R.chance(0.62) ? darkEnd : lightEnd);
  var gl = lum(ground);

  var pool = [], gap, j;
  for (gap = 0.34; gap > 0.05 && pool.length < 3; gap -= 0.07) {
    pool = [];
    for (i = 0; i < uniq.length; i++) if (uniq[i] !== ground && dist(uniq[i], ground) >= gap) pool.push(uniq[i]);
  }
  if (pool.length < 2) {
    pool = [];
    for (i = 0; i < uniq.length; i++) if (uniq[i] !== ground) pool.push(uniq[i]);
  }
  if (!pool.length) pool = [gl > 0.5 ? '#111111' : '#eeeeee'];

  var keep = [], ok;
  for (i = 0; i < pool.length; i++) {
    ok = 1;
    for (j = 0; j < keep.length; j++) if (dist(pool[i], keep[j]) < 0.16) ok = 0;
    if (ok) keep.push(pool[i]);
  }
  pool = keep.length ? keep : pool;
  if (pool.length < 2) pool = [pool[0], ground];

  var n = R.i(5, 7), seq = [], rem = [], best, bi, sc, prev, k;
  for (k = 0; seq.length < n && k < 16; k++) {
    rem = shuffle(pool);
    while (rem.length && seq.length < n) {
      prev = seq.length ? seq[seq.length - 1] : ground;
      best = -1; bi = 0;
      for (j = 0; j < rem.length; j++) {
        sc = dist(rem[j], prev) + R.f(0, 0.06);
        if (rem[j] === prev && rem.length > 1) sc = -1;
        if (sc > best) { best = sc; bi = j; }
      }
      seq.push(rem[bi]); rem.splice(bi, 1);
    }
  }
  while (seq.length < n) seq.push(pool[seq.length % pool.length]);

  var cx = x + w / 2, cy = y + h / 2;
  var dir = R.chance(0.5) ? 1 : -1;
  var ang = dir * R.f(32, 38);
  var rad = ang * Math.PI / 180;
  var ext = Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad));
  var band = ext * R.f(0.30, 0.40);
  var off = ext * R.f(-0.05, 0.05);
  var L = (Math.abs(w) + Math.abs(h)) * 1.2;

  var wts = [], sum = 0;
  for (i = 0; i < n; i++) wts.push(R.f(0.80, 1.25));
  var hero = R.i(0, n - 1);
  if (R.chance(0.55)) wts[hero] *= R.f(1.5, 2.0);
  for (i = 0; i < n; i++) sum += wts[i];
  var minW = Math.max(ext * 0.028, 2);

  var cid = 'c' + id + 'wd', gid = 'g' + id + 'wd';
  var defs = '<clipPath id="' + cid + '"><rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '"/></clipPath>';
  var g2 = mix(ground, gl > 0.5 ? byLum[0] : byLum[byLum.length - 1], 0.10);
  defs += '<linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="' + ground + '"/>' +
    '<stop offset="1" stop-color="' + g2 + '"/></linearGradient>';

  var body = '<g clip-path="url(#' + cid + ')">';
  body += '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '" fill="url(#' + gid + ')"/>';
  body += '<g transform="rotate(' + f(ang) + ' ' + f(cx) + ' ' + f(cy) + ')">';
  var run = cy + off - band / 2, sw;
  for (i = 0; i < n; i++) {
    sw = Math.max(minW, band * wts[i] / sum);
    body += '<rect x="' + f(cx - L / 2) + '" y="' + f(run) + '" width="' + f(L) + '" height="' + f(sw + 0.6) + '" fill="' + seq[i] + '"/>';
    run += sw;
  }
  body += '</g></g>';

  return { defs: defs, body: body };
}
module.exports = wall_diagonal;
