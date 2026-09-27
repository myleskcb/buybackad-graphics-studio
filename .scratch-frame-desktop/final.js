function frame_desktop(x, y, w, h, P, R, id) {
  var n = function (v) { return (Math.round(v * 10) / 10).toFixed(1); };
  var o = function (v) { return (Math.round(v * 100) / 100).toFixed(2); };
  var rgb = function (c) {
    var s = String(c == null ? '' : c).replace('#', '').trim();
    if (s.length === 3) s = s.charAt(0) + s.charAt(0) + s.charAt(1) + s.charAt(1) + s.charAt(2) + s.charAt(2);
    if (!/^[0-9a-fA-F]{6}$/.test(s)) s = '808080';
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  };
  var mix = function (a, b, t) {
    var A = rgb(a), B = rgb(b), out = '#', i, v;
    for (i = 0; i < 3; i++) {
      v = Math.round(A[i] + (B[i] - A[i]) * t);
      v = v < 0 ? 0 : (v > 255 ? 255 : v);
      out += (v < 16 ? '0' : '') + v.toString(16);
    }
    return out;
  };
  if (!(w > 0) || !(h > 0)) return { defs: '', body: '' };

  /* ---- proportions, in units of the panel width ---- */
  var ap = R.f(1.34, 1.52);                 /* panel aspect, chin included: a wide display */
  var chin = R.f(0.085, 0.098);             /* chin ~9% of the display height */
  var stand = R.f(0.20, 0.27);              /* neck + foot, as a share of panel height */
  var pad = 0.6;                            /* reserve room for the hairline stroke + rounding */
  var AW = Math.max(1, w - pad * 2), AH = Math.max(1, h - pad * 2);
  var PW = Math.min(AW, AH * ap / (1 + stand)) * 0.995;
  var PH = PW / ap;
  var SD = PH * stand;
  var cx = x + w / 2;
  var PX = cx - PW / 2;
  var PY = y + (h - (PH + SD)) / 2;
  var BOT = PY + PH + SD;

  var rad = Math.max(0.6, PW * R.f(0.024, 0.034));
  var CH = Math.max(1.6, PH * chin);
  var lip = Math.max(0.6, PW * R.f(0.013, 0.019));      /* enclosure edge round the glass */
  var bez = Math.max(0.5, lip * R.f(0.75, 1.0));        /* the thin dark bezel itself */

  var GX = PX + lip, GY = PY + lip;
  var GW = Math.max(1, PW - lip * 2);
  var GH = Math.max(1, (PY + PH - CH) - GY);
  var SX = GX + bez, SY = GY + bez;
  var SW = Math.max(0.6, GW - bez * 2), SH = Math.max(0.6, GH - bez * 2);
  var srad = Math.min(SW, SH) * 0.02;
  var grad = Math.max(srad, rad * 0.55);

  var FH = Math.max(1.2, SD * R.f(0.20, 0.28));         /* flat foot */
  var FW = PW * R.f(0.30, 0.38);
  var FY = BOT - FH;
  var NT = PW * R.f(0.13, 0.17);                        /* neck, tapered wider at the base */
  var NB = NT * R.f(1.22, 1.45);
  var NY0 = PY + PH - Math.max(0.4, PH * 0.012);
  var NY1 = FY + FH * 0.5;
  var hair = Math.max(0.5, PW * 0.0028);

  /* ---- colours: palette entries and pairwise interpolations only ---- */
  var pale = R.chance(0.55);
  var shellHi = pale ? mix(P.paper, P.ground2, 0.08) : mix(P.dark, P.body, 0.44);
  var shellLo = pale ? mix(P.paper, P.dark, 0.18) : mix(P.dark, P.body, 0.20);
  var neckHi = pale ? mix(P.paper, P.dark, 0.10) : mix(P.dark, P.body, 0.32);
  var neckLo = pale ? mix(P.paper, P.dark, 0.34) : mix(P.dark, P.body, 0.10);
  var footLo = pale ? mix(P.paper, P.dark, 0.44) : mix(P.dark, P.body, 0.04);
  var glassA = mix(P.ground2, P.dark, R.f(0.30, 0.46));
  var glassB = mix(P.ground, P.dark, R.f(0.48, 0.64));
  var rim = mix(P.dark, P.paper, 0.30);
  var lens = mix(P.body, P.paper, 0.55);

  var gS = 'dkS_' + id, gG = 'dkG_' + id, gN = 'dkN_' + id, gF = 'dkF_' + id, cS = 'dkC_' + id;
  var tilt = R.f(0.20, 0.55);

  var defs =
    '<linearGradient id="' + gS + '" x1="0" y1="0" x2="' + o(tilt * 0.5) + '" y2="1">' +
      '<stop offset="0" stop-color="' + shellHi + '"/>' +
      '<stop offset="1" stop-color="' + shellLo + '"/>' +
    '</linearGradient>' +
    '<linearGradient id="' + gG + '" x1="0" y1="0" x2="' + o(1 - tilt) + '" y2="1">' +
      '<stop offset="0" stop-color="' + glassA + '"/>' +
      '<stop offset="1" stop-color="' + glassB + '"/>' +
    '</linearGradient>' +
    '<linearGradient id="' + gN + '" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0" stop-color="' + neckLo + '"/>' +
      '<stop offset="0.42" stop-color="' + neckHi + '"/>' +
      '<stop offset="1" stop-color="' + footLo + '"/>' +
    '</linearGradient>' +
    '<linearGradient id="' + gF + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + neckHi + '"/>' +
      '<stop offset="1" stop-color="' + footLo + '"/>' +
    '</linearGradient>' +
    '<clipPath id="' + cS + '">' +
      '<rect x="' + n(SX) + '" y="' + n(SY) + '" width="' + n(SW) + '" height="' + n(SH) +
      '" rx="' + n(srad) + '"/>' +
    '</clipPath>';

  var b = '';

  /* neck first, then foot: both sit behind the display panel */
  b += '<path d="M' + n(cx - NT / 2) + ',' + n(NY0) + 'H' + n(cx + NT / 2) +
       'L' + n(cx + NB / 2) + ',' + n(NY1) + 'H' + n(cx - NB / 2) + 'Z" fill="url(#' + gN + ')"/>';
  b += '<rect x="' + n(cx - FW / 2) + '" y="' + n(FY) + '" width="' + n(FW) + '" height="' + n(FH) +
       '" rx="' + n(Math.min(FH * 0.45, FW * 0.5)) + '" fill="url(#' + gF + ')"/>';
  b += '<rect x="' + n(cx - FW * 0.44) + '" y="' + n(FY + FH * 0.18) + '" width="' + n(FW * 0.88) +
       '" height="' + n(Math.max(0.4, FH * 0.13)) + '" rx="' + n(Math.max(0.2, FH * 0.065)) +
       '" fill="' + P.paper + '" opacity="0.22"/>';

  /* display panel: enclosure, thin dark bezel plate, then the screen */
  b += '<rect x="' + n(PX) + '" y="' + n(PY) + '" width="' + n(PW) + '" height="' + n(PH) +
       '" rx="' + n(rad) + '" fill="url(#' + gS + ')" stroke="' + rim + '" stroke-width="' +
       n(hair) + '" stroke-opacity="0.35"/>';
  b += '<rect x="' + n(GX) + '" y="' + n(GY) + '" width="' + n(GW) + '" height="' + n(GH) +
       '" rx="' + n(grad) + '" fill="' + P.dark + '"/>';
  b += '<rect class="screen" x="' + n(SX) + '" y="' + n(SY) + '" width="' + n(SW) + '" height="' +
       n(SH) + '" rx="' + n(srad) + '" fill="url(#' + gG + ')"/>';

  /* glass sheen, clipped to the display */
  if (R.chance(0.62)) {
    var s1 = SW * R.f(0.30, 0.46), s2 = s1 + SW * R.f(0.10, 0.20);
    b += '<g clip-path="url(#' + cS + ')"><polygon points="' +
      n(SX) + ',' + n(SY + SH) + ' ' + n(SX + s1) + ',' + n(SY) + ' ' +
      n(SX + s2) + ',' + n(SY) + ' ' + n(SX + SW * 0.14) + ',' + n(SY + SH) +
      '" fill="' + P.paper + '" opacity="' + o(R.f(0.04, 0.075)) + '"/></g>';
  }

  /* bezel inner edge */
  b += '<rect x="' + n(SX) + '" y="' + n(SY) + '" width="' + n(SW) + '" height="' + n(SH) +
       '" rx="' + n(srad) + '" fill="none" stroke="' + P.dark + '" stroke-width="' + n(hair) +
       '" stroke-opacity="0.45"/>';

  /* camera pinhole, centred on the top bezel */
  var camR = bez * 0.34;
  if (camR >= 0.7) {
    b += '<circle cx="' + n(cx) + '" cy="' + n(GY + bez * 0.5) + '" r="' + n(camR) + '" fill="' +
         lens + '" opacity="0.35"/>';
  }

  /* top highlight on the enclosure, and the seam where the chin meets the glass */
  b += '<path d="M' + n(PX + rad) + ',' + n(PY + hair) + 'H' + n(PX + PW - rad) + '" stroke="' +
       P.paper + '" stroke-width="' + n(hair) + '" stroke-linecap="round" fill="none" opacity="0.40"/>';
  b += '<path d="M' + n(GX) + ',' + n(PY + PH - CH) + 'H' + n(GX + GW) + '" stroke="' + P.dark +
       '" stroke-width="' + n(hair) + '" fill="none" opacity="0.16"/>';

  return { defs: defs, body: b };
}
