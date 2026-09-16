function frame_laptop(x, y, w, h, P, R, id) {
  var n = function (v) { return (Math.round(v * 10) / 10).toFixed(1); };
  var o = function (v) { return (Math.round(v * 100) / 100).toFixed(2); };
  var hex = function (c) {
    var s = String(c == null ? '' : c).replace('#', '').trim();
    if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    if (!/^[0-9a-fA-F]{6}$/.test(s)) s = '808080';
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  };
  var mix = function (a, b, t) {
    var A = hex(a), B = hex(b), out = '#', i, v;
    for (i = 0; i < 3; i++) {
      v = Math.round(A[i] + (B[i] - A[i]) * t);
      v = v < 0 ? 0 : v > 255 ? 255 : v;
      out += (v < 16 ? '0' : '') + v.toString(16);
    }
    return out;
  };

  /* ---- proportions, expressed in units of the total drawing width ---- */
  var flare = R.f(1.024, 1.055);            /* base front edge is wider than the lid */
  var lidW = 1 / flare;
  var bezS = lidW * R.f(0.028, 0.042);      /* side bezel */
  var bezT = bezS * R.f(1.05, 1.6);         /* top bezel, holds the camera */
  var bezB = bezS * R.f(1.3, 2.0);          /* chin */
  var scW = lidW - bezS * 2;
  var scH = scW / R.pick([1.6, 1.5, 1.7778]);
  var lidH = bezT + scH + bezB;
  var hinH = R.f(0.007, 0.012);
  var basH = R.f(0.04, 0.054);
  var totH = lidH + hinH + basH;

  /* ---- fit that shape inside the given rectangle, centred ----
     hinge, base and stroke have pixel floors so they stay visible when small;
     those floors are what the plain totH ratio does not know about, so the
     fit is solved against the real drawn extent (floors + stroke included). */
  var fH = Math.min(0.8, h * 0.02);          /* hinge floor  */
  var fB = Math.min(1.6, h * 0.04);          /* base floor   */
  var fS = Math.min(0.5, Math.min(w, h) * 0.01); /* stroke floor */
  var strokeOf = function (d) { return Math.max(fS, d * 0.0032); };
  var heightOf = function (d) {
    return lidH * d + Math.max(fH, hinH * d) + Math.max(fB, basH * d) + strokeOf(d) + 0.1;
  };
  /* +0.1 absorbs the outward drift of rounding coordinates to one decimal */
  var widthOf = function (d) { return d + strokeOf(d) + 0.1; };

  var dw = Math.min(w, h / totH) * 0.995, fit, i;
  for (i = 0; i < 12; i++) {
    fit = Math.min(1, w / widthOf(dw), h / heightOf(dw));
    if (fit >= 1) break;
    dw *= fit;
  }

  var sw = strokeOf(dw);
  var LH = lidH * dw;
  var HH = Math.max(fH, hinH * dw);
  var BH = Math.max(fB, basH * dw);
  var dh = LH + HH + BH;                     /* the height actually drawn */
  var ox = x + (w - dw) / 2;
  var oy = y + (h - dh) / 2;
  var cx = ox + dw / 2;

  var LW = lidW * dw, LX = cx - LW / 2, LY = oy;
  var SX = LX + bezS * dw, SY = LY + bezT * dw, SW = scW * dw, SH = scH * dw;
  var HY = LY + LH;
  var BY = HY + HH;
  var BTW = LW * 0.995, BBW = dw;                 /* base: top width, front width */
  var bx0t = cx - BTW / 2, bx1t = cx + BTW / 2;
  var bx0b = cx - BBW / 2, bx1b = cx + BBW / 2;
  var rLid = Math.min(LW * R.f(0.016, 0.028), LH * 0.4);
  var rBas = Math.min(BH * 0.55, dw * 0.012);

  /* ---- colours: only palette entries and pairwise interpolations ---- */
  var shellHi = mix(P.dark, P.body, 0.44);
  var shellLo = mix(P.dark, P.body, 0.22);
  var hinge = mix(P.dark, P.body, 0.08);
  var baseHi = mix(P.body, P.paper, R.f(0.46, 0.58));
  var baseLo = mix(P.body, P.paper, R.f(0.28, 0.4));
  var lipHi = mix(P.body, P.paper, 0.82);
  var frontLo = mix(P.body, P.dark, 0.3);
  var notch = mix(P.body, P.dark, 0.55);
  var edge = mix(P.dark, P.paper, 0.3);
  var glassA = mix(P.ground2, P.dark, R.f(0.24, 0.4));
  var glassB = mix(P.ground, P.dark, R.f(0.5, 0.66));
  var lens = mix(P.body, P.paper, 0.55);

  var gL = 'lpL_' + id, gS = 'lpS_' + id, gB = 'lpB_' + id;
  var cS = 'lpCS_' + id, cB = 'lpCB_' + id;

  /* lid outline: rounded at the top, square where it meets the hinge */
  var lidPath = 'M' + n(LX) + ',' + n(LY + rLid) +
    'Q' + n(LX) + ',' + n(LY) + ' ' + n(LX + rLid) + ',' + n(LY) +
    'H' + n(LX + LW - rLid) +
    'Q' + n(LX + LW) + ',' + n(LY) + ' ' + n(LX + LW) + ',' + n(LY + rLid) +
    'V' + n(LY + LH) + 'H' + n(LX) + 'Z';

  /* base: shallow trapezoid, square at the hinge, rounded at the front edge */
  var kx = (bx1b - bx1t) * (1 - rBas / BH);
  var basePath = 'M' + n(bx0t) + ',' + n(BY) + 'H' + n(bx1t) +
    'L' + n(bx1t + kx) + ',' + n(BY + BH - rBas) +
    'Q' + n(bx1b) + ',' + n(BY + BH) + ' ' + n(bx1b - rBas) + ',' + n(BY + BH) +
    'H' + n(bx0b + rBas) +
    'Q' + n(bx0b) + ',' + n(BY + BH) + ' ' + n(bx0t - kx) + ',' + n(BY + BH - rBas) +
    'Z';

  var defs =
    '<linearGradient id="' + gL + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + shellHi + '"/>' +
      '<stop offset="1" stop-color="' + shellLo + '"/>' +
    '</linearGradient>' +
    '<linearGradient id="' + gS + '" x1="0" y1="0" x2="' + o(R.f(0.55, 1)) + '" y2="1">' +
      '<stop offset="0" stop-color="' + glassA + '"/>' +
      '<stop offset="1" stop-color="' + glassB + '"/>' +
    '</linearGradient>' +
    '<linearGradient id="' + gB + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + baseHi + '"/>' +
      '<stop offset="1" stop-color="' + baseLo + '"/>' +
    '</linearGradient>' +
    '<clipPath id="' + cS + '"><rect x="' + n(SX) + '" y="' + n(SY) + '" width="' + n(SW) +
      '" height="' + n(SH) + '" rx="' + n(Math.min(SW, SH) * 0.02) + '"/></clipPath>' +
    '<clipPath id="' + cB + '"><path d="' + basePath + '"/></clipPath>';

  var b = '';

  /* lid shell */
  b += '<path d="' + lidPath + '" fill="url(#' + gL + ')" stroke="' + edge +
       '" stroke-width="' + n(sw) + '" stroke-opacity="0.35"/>';

  /* display area — the engine's screen contract */
  b += '<rect class="screen" x="' + n(SX) + '" y="' + n(SY) + '" width="' + n(SW) +
       '" height="' + n(SH) + '" rx="' + n(Math.min(SW, SH) * 0.02) + '" fill="url(#' + gS + ')"/>';

  /* glass sheen, clipped to the display */
  if (R.chance(0.62)) {
    var s1 = SH * R.f(0.5, 0.8), s2 = SW * R.f(0.3, 0.46), s3 = s2 + SW * R.f(0.1, 0.2);
    b += '<g clip-path="url(#' + cS + ')"><polygon points="' +
      n(SX) + ',' + n(SY + s1) + ' ' + n(SX + s2) + ',' + n(SY) + ' ' +
      n(SX + s3) + ',' + n(SY) + ' ' + n(SX) + ',' + n(SY + SH) +
      '" fill="' + P.paper + '" opacity="' + o(R.f(0.035, 0.06)) + '"/></g>';
  }

  /* bezel inner edge */
  b += '<rect x="' + n(SX) + '" y="' + n(SY) + '" width="' + n(SW) + '" height="' + n(SH) +
       '" rx="' + n(Math.min(SW, SH) * 0.02) + '" fill="none" stroke="' + P.dark +
       '" stroke-width="' + n(sw) + '" stroke-opacity="0.45"/>';

  /* camera dot, centred on the top bezel */
  var camR = Math.min(Math.max(0.7, dw * R.f(0.0045, 0.0065)), bezT * dw * 0.45);
  var camY = LY + bezT * dw * 0.5;
  b += '<circle cx="' + n(cx) + '" cy="' + n(camY) + '" r="' + n(camR) + '" fill="' + lens +
       '" opacity="0.32"/>';
  if (camR > 1.6) {
    b += '<circle cx="' + n(cx) + '" cy="' + n(camY) + '" r="' + n(camR * 0.42) + '" fill="' +
         P.dark + '" opacity="0.55"/>';
  }

  /* hinge line */
  var hIn = R.chance(0.5) ? LW * R.f(0.06, 0.12) : 0;
  b += '<rect x="' + n(LX + hIn) + '" y="' + n(HY) + '" width="' + n(LW - hIn * 2) +
       '" height="' + n(HH) + '" fill="' + hinge + '"/>';
  if (hIn > 0) {
    b += '<rect x="' + n(LX) + '" y="' + n(HY) + '" width="' + n(LW) + '" height="' + n(HH) +
         '" fill="' + hinge + '" opacity="0.45"/>';
  }

  /* base slab */
  b += '<path d="' + basePath + '" fill="url(#' + gB + ')" stroke="' + frontLo +
       '" stroke-width="' + n(sw) + '" stroke-opacity="0.34"/>';
  b += '<g clip-path="url(#' + cB + ')">' +
       '<rect x="' + n(bx0b) + '" y="' + n(BY) + '" width="' + n(BBW) + '" height="' +
       n(Math.max(Math.min(0.6, BH * 0.5), BH * 0.13)) + '" fill="' + lipHi + '" opacity="0.42"/>' +
       '<rect x="' + n(bx0b) + '" y="' + n(BY + BH * 0.72) + '" width="' + n(BBW) +
       '" height="' + n(BH * 0.28) + '" fill="' + frontLo + '" opacity="0.16"/>';

  /* trackpad notch cut into the front edge, flush with it */
  var nw = dw * R.f(0.095, 0.135), nh = BH * R.f(0.3, 0.42), nr = Math.min(nh * 0.8, nw * 0.22);
  var nx0 = cx - nw / 2, nx1 = cx + nw / 2, ny0 = BY + BH - nh, ny1 = BY + BH;
  b += '<path d="M' + n(nx0) + ',' + n(ny1) + 'V' + n(ny0 + nr) +
       'Q' + n(nx0) + ',' + n(ny0) + ' ' + n(nx0 + nr) + ',' + n(ny0) +
       'H' + n(nx1 - nr) + 'Q' + n(nx1) + ',' + n(ny0) + ' ' + n(nx1) + ',' + n(ny0 + nr) +
       'V' + n(ny1) + 'Z" fill="' + notch + '" opacity="0.78"/></g>';

  return { defs: defs, body: b };
}
