function frame_tablet(x, y, w, h, P, R, id) {
  if (!(w > 2) || !(h > 2)) return { defs: '', body: '' };

  var n = function (v) { return (Math.round(v * 10) / 10).toFixed(1); };
  var rgb = function (c) {
    var s = String(c == null ? '#000000' : c).replace('#', '');
    if (s.length === 3) s = s.charAt(0) + s.charAt(0) + s.charAt(1) + s.charAt(1) + s.charAt(2) + s.charAt(2);
    var v = parseInt(s.slice(0, 6), 16);
    if (!(v >= 0)) v = 0;
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  };
  var mix = function (a, b, t) {
    var A = rgb(a), B = rgb(b), o = '#', i, k;
    for (i = 0; i < 3; i++) {
      k = Math.round(A[i] + (B[i] - A[i]) * t);
      k = k < 0 ? 0 : (k > 255 ? 255 : k);
      o += (k < 16 ? '0' : '') + k.toString(16);
    }
    return o;
  };
  var lum = function (c) { var v = rgb(c); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };

  // deepest and lightest members of the palette, so every palette gives real depth
  var pool = [P.ground, P.ground2, P.ink, P.body, P.accent, P.hot, P.paper, P.dark];
  var shade = null, light = null, i;
  for (i = 0; i < pool.length; i++) {
    if (typeof pool[i] !== 'string') continue;
    if (shade === null || lum(pool[i]) < lum(shade)) shade = pool[i];
    if (light === null || lum(pool[i]) > lum(light)) light = pool[i];
  }
  if (shade === null) return { defs: '', body: '' };

  // fit the slab inside the box, centred, hairline included
  var hair = Math.max(0.6, Math.min(w, h) * 0.0045);
  var slack = hair + 0.3;                                  // hairline + 1dp rounding headroom
  var aw = Math.max(0.2, w - slack), ah = Math.max(0.2, h - slack);
  var land = (w / h) > 1.12;
  var ar = R.pick([0.700, 0.715, 0.735, 0.750]);          // short edge / long edge
  var dw, dh;
  if (land) { dw = Math.min(aw, ah / ar); dh = dw * ar; }
  else { dh = Math.min(ah, aw / ar); dw = dh * ar; }
  var bx = x + (w - dw) / 2, by = y + (h - dh) / 2;
  var S = Math.min(dw, dh);

  var rad = S * 0.07;                                      // corner radius ~7% of width
  var bez = S * R.f(0.036, 0.046);                         // tablet-thin bezel
  var irad = Math.max(rad - bez, rad * 0.34);
  var sx = bx + bez, sy = by + bez, sw = dw - bez * 2, sh = dh - bez * 2;

  // casing shaded with the deepest hue, lit with the lightest, tinted by the ground
  var pale = R.chance(0.34);
  var tintSrc = R.pick([P.ground, P.ground2, P.ground, P.accent]);
  var tintAmt = tintSrc === P.accent ? 0.12 : 0.19;
  var caseA = pale ? mix(mix(light, shade, 0.05), P.ground2, 0.05) : mix(mix(shade, light, 0.21), P.ground, 0.10);
  var caseB = pale ? mix(light, shade, 0.19) : mix(shade, light, 0.02);
  var rimC = pale ? shade : light, rimO = pale ? 0.18 : 0.16;
  var aprC = pale ? shade : light, aprO = pale ? 0.28 : 0.16;
  var scrA = mix(shade, tintSrc, tintAmt);
  var scrB = mix(shade, P.ground2, 0.05);

  var tilt = R.f(0.10, 0.42);
  var gid = id + '-tabcase', sid = id + '-tabscr', cid = id + '-tabclip';

  var defs = ''
    + '<linearGradient id="' + gid + '" x1="' + n(tilt) + '" y1="0" x2="' + n(1 - tilt) + '" y2="1">'
    + '<stop offset="0" stop-color="' + caseA + '"/><stop offset="1" stop-color="' + caseB + '"/></linearGradient>'
    + '<linearGradient id="' + sid + '" x1="0" y1="0" x2="' + n(1 - tilt) + '" y2="1">'
    + '<stop offset="0" stop-color="' + scrA + '"/><stop offset="1" stop-color="' + scrB + '"/></linearGradient>'
    + '<clipPath id="' + cid + '"><rect x="' + n(sx) + '" y="' + n(sy) + '" width="' + n(sw) + '" height="' + n(sh) + '" rx="' + n(irad) + '"/></clipPath>';

  var body = ''
    + '<rect x="' + n(bx) + '" y="' + n(by) + '" width="' + n(dw) + '" height="' + n(dh) + '" rx="' + n(rad) + '"'
    + ' fill="url(#' + gid + ')" stroke="' + rimC + '" stroke-opacity="' + rimO + '" stroke-width="' + n(hair) + '"/>'
    + '<rect class="screen" id="' + id + '-screen" x="' + n(sx) + '" y="' + n(sy) + '" width="' + n(sw) + '" height="' + n(sh) + '"'
    + ' rx="' + n(irad) + '" fill="url(#' + sid + ')"/>'
    + '<rect x="' + n(sx) + '" y="' + n(sy) + '" width="' + n(sw) + '" height="' + n(sh) + '" rx="' + n(irad) + '"'
    + ' fill="none" stroke="' + aprC + '" stroke-opacity="' + aprO + '" stroke-width="' + n(Math.max(0.5, S * 0.003)) + '"/>';

  if (R.chance(0.62)) {
    body += '<g clip-path="url(#' + cid + ')"><polygon points="'
      + n(sx) + ',' + n(sy + sh * 0.34) + ' ' + n(sx + sw * 0.44) + ',' + n(sy) + ' '
      + n(sx + sw * 0.72) + ',' + n(sy) + ' ' + n(sx) + ',' + n(sy + sh * 0.76)
      + '" fill="' + light + '" opacity="0.06"/></g>';
  }

  // flush buttons: power on the top edge, volume pair on the right edge
  var btnT = Math.min(Math.max(0.8, S * 0.008), bez * 0.7), btnL = S * 0.055, btnC = pale ? shade : light, btnO = pale ? 0.22 : 0.20;
  var seam = function (px, py, pw, ph) {
    return '<rect x="' + n(px) + '" y="' + n(py) + '" width="' + n(pw) + '" height="' + n(ph) + '"'
      + ' rx="' + n(Math.min(pw, ph) / 2) + '" fill="' + btnC + '" opacity="' + btnO + '"/>';
  };
  body += seam(bx + dw * 0.74, by, btnL, btnT)
    + seam(bx + dw - btnT, by + dh * 0.10, btnT, btnL)
    + seam(bx + dw - btnT, by + dh * 0.10 + btnL * 1.45, btnT, btnL);

  // camera sits in the bezel band: radius and ring both bounded by it, so the dot
  // can never float off the casing (or out of the box) on a small slab
  var cxc = bx + dw / 2, cyc = by + bez * 0.5, cr = bez * 0.28;
  var crs = Math.min(Math.max(0.4, cr * 0.28), (bez * 0.5 - cr) * 2);
  body += '<circle cx="' + n(cxc) + '" cy="' + n(cyc) + '" r="' + n(cr) + '" fill="' + shade + '" opacity="0.9"/>'
    + '<circle cx="' + n(cxc) + '" cy="' + n(cyc) + '" r="' + n(cr) + '" fill="none" stroke="' + light + '" stroke-opacity="0.14" stroke-width="' + n(crs) + '"/>'
    + '<circle cx="' + n(cxc - cr * 0.26) + '" cy="' + n(cyc - cr * 0.26) + '" r="' + n(cr * 0.34) + '" fill="' + light + '" opacity="0.22"/>';

  return { defs: defs, body: body };
}
module.exports = frame_tablet;
