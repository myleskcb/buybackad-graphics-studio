/* DEVICE FRAMES AND WALLPAPER GENERATORS.
 *
 * Twelve pure drawing functions, each designed and then verified on its own:
 * compiled, rendered in headless Chrome, looked at large and at thumbnail size,
 * checked for drawing outside its box, and called twice with the same seed to
 * confirm the two outputs are byte-identical. They replace the four
 * placeholders written by hand while they were being built.
 *
 * The contract, unchanged:
 *   fn(x, y, w, h, P, R, id) -> { defs, body }
 * P is the card's palette and the ONLY source of colour, so a showcase wears
 * whichever of the thirty-three palettes the card is wearing. R is the seeded
 * RNG — never Math.random, or a seed would stop reproducing its card. Every
 * gradient and clipPath id contains `id`, because a dozen of these appear on
 * one card and duplicate ids collide silently.
 *
 * A frame leaves its screen empty and marks it with class="screen" as the last
 * element of body; showcase.mjs reads that rect and fills it.
 */

/* An all-in-one desktop centred in the box: wide panel (screen aspect 1.48-1.71) with a thin lip + dark bezel plate, a chin ~9% of the panel height, a tapered neck and a flat foot; enclosure flips between a pale build (paper mixed toward ground2/dark) and a dark build (dark mixed toward body), glass is ground2/ground mixed into dark, bezel is dark, sheen and foot highlight are paper at low opacity. */
export function frame_desktop(x, y, w, h, P, R, id) {
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
  /* A 24-inch iMac, measured: 547mm across, a 4480x2520 panel at 218ppi =
     522.0 x 293.6mm of glass. Side bezel (547-522)/2 = 12.5mm, which is 2.29%
     of the width — a good deal thinner than the enclosure edge this used to
     draw. The GLASS is 16:9 (4480/2520 = 1.778); the panel including the chin
     is taller than that, which is what `ap` describes. The chin at ~9% of the
     display height works out at 30mm on a real machine, so that number was
     already right and is left alone. */
  var ap = R.f(1.30, 1.38);                 /* panel aspect, chin included */
  var chin = R.f(0.085, 0.098);             /* chin ~9% of the display height */
  var stand = R.f(0.20, 0.27);              /* neck + foot, as a share of panel height */
  var PW = Math.min(w, h * ap / (1 + stand)) * 0.995;
  var PH = PW / ap;
  var SD = PH * stand;
  var cx = x + w / 2;
  var PX = cx - PW / 2;
  var PY = y + (h - (PH + SD)) / 2;
  var BOT = PY + PH + SD;

  var rad = Math.max(0.6, PW * R.f(0.024, 0.034));
  var CH = Math.max(1.6, PH * chin);
  var lip = Math.max(0.5, PW * R.f(0.006, 0.009));      /* anodised edge round the glass */
  var bez = Math.max(0.5, PW * R.f(0.0210, 0.0248));    /* 2.29% measured, +/- a hair */

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
  var lens = mix(P.body, P.paper, 0.55);
  var glassA = mix(P.ground2, P.dark, R.f(0.30, 0.46));
  var glassB = mix(P.ground, P.dark, R.f(0.48, 0.64));
  var rim = mix(P.dark, P.paper, 0.30);

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

/* Open laptop straight-on — lid shell and hinge from dark↔body mixes, display gradient from ground/ground2 pulled toward dark (class="screen"), base slab and its front lip from body↔paper mixes with a body↔dark trackpad notch flush in the front edge. */
export function frame_laptop(x, y, w, h, P, R, id) {
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
  /* Bezels sized off a machine the shop actually buys. A 16-inch MacBook Pro
     is 355.7mm across the lid with a 345.9mm-wide panel, so each side bezel is
     4.9mm — 1.38% of the lid. This used to be 2.8-4.2%, three to four times
     too fat, which is precisely what read as a 2012 laptop. Top carries the
     camera and is the deepest; the chin is a shade under it. */
  var MODEL = R.pick(LAPTOPS);
  var v = R.f(0.95, 1.05);                  /* one nudge, applied to all three,
                                               so the model stays in proportion */
  var bezS = lidW * MODEL.bez * v;          /* side bezel */
  var bezT = lidW * MODEL.top * v;          /* top bezel, holds the notch */
  var bezB = lidW * MODEL.chin * v;         /* chin */
  var scW = lidW - bezS * 2;
  var scH = scW / MODEL.ar;                 /* 16:10-ish. Never 16:9. */
  var lidH = bezT + scH + bezB;
  var hinH = R.f(0.007, 0.012);
  var basH = R.f(0.04, 0.054);
  var totH = lidH + hinH + basH;

  /* ---- fit that shape inside the given rectangle, centred ---- */
  var dw = Math.min(w, h / totH) * 0.995;
  var dh = dw * totH;
  var ox = x + (w - dw) / 2;
  var oy = y + (h - dh) / 2;
  var cx = ox + dw / 2;

  var LW = lidW * dw, LX = cx - LW / 2, LY = oy, LH = lidH * dw;
  var SX = LX + bezS * dw, SY = LY + bezT * dw, SW = scW * dw, SH = scH * dw;
  var HY = LY + LH, HH = Math.max(0.8, hinH * dw);
  var BY = HY + HH, BH = Math.max(1.6, basH * dw);
  var BTW = LW * 0.995, BBW = dw;                 /* base: top width, front width */
  var bx0t = cx - BTW / 2, bx1t = cx + BTW / 2;
  var bx0b = cx - BBW / 2, bx1b = cx + BBW / 2;
  /* The enclosure corner, and the thin anodised strip that is all you see of
     the aluminium from the front. Everything inside that strip is black. */
  var rLid = Math.min(LW * R.f(0.030, 0.038), LH * 0.4);
  var rim = Math.max(0.6, LW * R.f(0.0035, 0.0052));
  var rBas = Math.min(BH * 0.55, dw * 0.012);
  var sw = Math.max(0.5, dw * 0.0032);

  /* ---- colours: only palette entries and pairwise interpolations ---- */
  /* The rim reads as metal, the plate behind the glass reads as black. Two
     separate materials — the old single mid-grey shell had to be both and so
     was convincingly neither. */
  var shellHi = mix(P.body, P.paper, R.f(0.30, 0.42));
  var shellLo = mix(P.body, P.dark, R.f(0.10, 0.20));
  var plateHi = mix(P.dark, P.body, 0.07);
  var plateLo = P.dark;
  var hinge = mix(P.dark, P.body, 0.08);
  var baseHi = mix(P.body, P.paper, R.f(0.46, 0.58));
  var baseLo = mix(P.body, P.paper, R.f(0.28, 0.4));
  var lipHi = mix(P.body, P.paper, 0.82);
  var frontLo = mix(P.body, P.dark, 0.3);
  var notch = mix(P.body, P.dark, 0.55);
  var edge = mix(P.dark, P.paper, 0.3);
  var glassA = mix(P.ground2, P.dark, R.f(0.24, 0.4));
  var glassB = mix(P.ground, P.dark, R.f(0.5, 0.66));

  var gL = 'lpL_' + id, gS = 'lpS_' + id, gB = 'lpB_' + id, gP = 'lpP_' + id;
  /* Concentric with the enclosure: the glass corner is the lid corner less the
     bezel it sits inside, so the two curves run parallel. A flat 2% here was
     what left a visible black wedge at each corner of the screen. */
  var rScr = Math.max(0, rLid - bezS * dw);
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
    '<linearGradient id="' + gP + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + plateHi + '"/>' +
      '<stop offset="1" stop-color="' + plateLo + '"/>' +
    '</linearGradient>' +
    '<clipPath id="' + cS + '"><rect x="' + n(SX) + '" y="' + n(SY) + '" width="' + n(SW) +
      '" height="' + n(SH) + '" rx="' + n(rScr) + '"/></clipPath>' +
    '<clipPath id="' + cB + '"><path d="' + basePath + '"/></clipPath>';

  var b = '';

  /* lid shell — the anodised edge, and the only metal visible from the front */
  b += '<path d="' + lidPath + '" fill="url(#' + gL + ')" stroke="' + edge +
       '" stroke-width="' + n(sw) + '" stroke-opacity="0.35"/>';

  /* The black plate. Everything inside the metal strip is one dark surface,
     which is what makes a modern lid read as glass edge-to-edge rather than a
     grey picture frame. Its corners are concentric with the enclosure — the
     radius steps down by exactly the rim it sits inside, so the curves stay
     parallel instead of leaving a black wedge in each corner. */
  b += '<rect x="' + n(LX + rim) + '" y="' + n(LY + rim) + '" width="' + n(LW - rim * 2) +
       '" height="' + n(LH - rim) + '" rx="' + n(Math.max(0, rLid - rim)) +
       '" fill="url(#' + gP + ')"/>';

  /* display area — the engine's screen contract */
  b += '<rect class="screen" x="' + n(SX) + '" y="' + n(SY) + '" width="' + n(SW) +
       '" height="' + n(SH) + '" rx="' + n(rScr) + '" fill="url(#' + gS + ')"/>';

  /* glass sheen, clipped to the display */
  if (R.chance(0.62)) {
    var s1 = SH * R.f(0.5, 0.8), s2 = SW * R.f(0.3, 0.46), s3 = s2 + SW * R.f(0.1, 0.2);
    b += '<g clip-path="url(#' + cS + ')"><polygon points="' +
      n(SX) + ',' + n(SY + s1) + ' ' + n(SX + s2) + ',' + n(SY) + ' ' +
      n(SX + s3) + ',' + n(SY) + ' ' + n(SX) + ',' + n(SY + SH) +
      '" fill="' + P.paper + '" opacity="' + o(R.f(0.035, 0.06)) + '"/></g>';
  }

  /* NO camera and NO notch here. showcase.mjs draws the notch on top of the
     wallpaper (its `cutout`), because a cutout drawn before the screen gets
     covered by the artwork. This frame used to draw a lens circle and a darker
     pupil in the top bezel as well, so a finished laptop carried two cameras
     stacked above the glass. The notch is the camera; one of them, drawn once,
     and drawn up there. */

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
       n(Math.max(0.6, BH * 0.13)) + '" fill="' + lipHi + '" opacity="0.42"/>' +
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

/* Flat-on phone: P.dark shell under a two-stop shell gradient (dark to a 20%/7% P.body mix), a P.body rail gradient stroked just inside the edge, side keys drawn under the shell so only the sliver shows, a screen well tinted P.dark toward P.ground/ground2, a P.body lip ring and pill cutout in P.dark; the empty class="screen" rect is the last element. */
export function frame_phone(x, y, w, h, P, R, id){
  var n = function(v){ return (Math.round(v * 10) / 10).toFixed(1); };
  var o = function(v){ return (v < 0.1 ? 0.1 : v > 1 ? 1 : v).toFixed(1); };
  var hex = function(c){
    c = String(c == null ? '#000000' : c).trim();
    if(c.charAt(0) !== '#') c = '#' + c;
    if(c.length === 4) c = '#' + c.charAt(1) + c.charAt(1) + c.charAt(2) + c.charAt(2) + c.charAt(3) + c.charAt(3);
    return c.length === 7 ? c : '#000000';
  };
  var mix = function(a, b, t){
    var A = parseInt(hex(a).slice(1), 16), B = parseInt(hex(b).slice(1), 16);
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    var r = Math.round((A >> 16 & 255) * (1 - t) + (B >> 16 & 255) * t);
    var g = Math.round((A >> 8 & 255) * (1 - t) + (B >> 8 & 255) * t);
    var l = Math.round((A & 255) * (1 - t) + (B & 255) * t);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + l).toString(16).slice(1);
  };
  if(!(w > 1) || !(h > 2)) return { defs: '', body: '' };

  var DARK = hex(P.dark), SOFT = hex(P.body), GR1 = hex(P.ground), GR2 = hex(P.ground2 || P.ground);

  /* a 1 : 2.16 slab, fitted inside the box and centred.
     The 0.2 shaved off keeps every rounded coordinate inside the box. */
  var AR = 2.16;
  var bw = Math.max(Math.min(w, h / AR) - 0.2, 0.5), bh = bw * AR;
  var bx = x + (w - bw) / 2, by = y + (h - bh) / 2;

  var rr    = bw * R.f(0.150, 0.172);          /* corner radius, ~16% of the width */
  var inset = bw * R.f(0.032, 0.038);          /* screen inset, ~3.5% of the width */
  var sw = bw - inset * 2, sh = bh - inset * 2;
  var sx = bx + inset, sy = by + inset;
  var sr = Math.max(rr - inset, rr * 0.5);

  var rail   = Math.max(bw * 0.013, 0.6);
  var railOp = R.f(0.30, 0.44);
  var lit    = mix(DARK, SOFT, 0.20);
  var shade  = mix(DARK, SOFT, 0.07);
  var glass  = mix(DARK, mix(GR1, GR2, 0.5), 0.28);

  var D = [], B = [], L = [], i;

  var gx = R.f(0.05, 0.22);
  D.push('<linearGradient id="' + id + '-shell" x1="' + gx.toFixed(2) + '" y1="' + R.f(0, 0.14).toFixed(2) +
         '" x2="' + (1 - gx).toFixed(2) + '" y2="1">' +
         '<stop offset="0" stop-color="' + lit + '"/>' +
         '<stop offset="0.42" stop-color="' + DARK + '"/>' +
         '<stop offset="1" stop-color="' + shade + '"/></linearGradient>');
  D.push('<linearGradient id="' + id + '-rail" x1="0" y1="0" x2="1" y2="0.3">' +
         '<stop offset="0" stop-color="' + SOFT + '" stop-opacity="' + o(railOp) + '"/>' +
         '<stop offset="0.3" stop-color="' + SOFT + '" stop-opacity="' + o(railOp * 0.3) + '"/>' +
         '<stop offset="0.6" stop-color="' + SOFT + '" stop-opacity="' + o(railOp * 0.9) + '"/>' +
         '<stop offset="1" stop-color="' + SOFT + '" stop-opacity="' + o(railOp * 0.35) + '"/></linearGradient>');

  /* side keys go down first, so only the sliver past the rail shows */
  var prot = Math.min(bw * 0.014, Math.max((w - bw) / 2 - 0.2, 0));
  var keyC = mix(DARK, SOFT, 0.26);
  var key = function(side, t0, len){
    var ky = by + bh * t0, kh = bh * len;
    if(prot >= bw * 0.004){
      var kw = prot + bw * 0.03, kx = side < 0 ? bx - prot : bx + bw - bw * 0.03;
      B.push('<rect x="' + n(kx) + '" y="' + n(ky) + '" width="' + n(kw) + '" height="' + n(kh) +
             '" rx="' + n(Math.min(prot * 0.8, kh / 2)) + '" fill="' + keyC + '"/>');
    } else {                                   /* no room outside the box: mark them on the rail */
      var mw = Math.max(bw * 0.010, 0.6), mx = side < 0 ? bx : bx + bw - mw;
      L.push('<rect x="' + n(mx) + '" y="' + n(ky) + '" width="' + n(mw) + '" height="' + n(kh) +
             '" rx="' + n(mw / 2) + '" fill="' + SOFT + '" opacity="0.2"/>');
    }
  };
  key(-1, 0.140, 0.036);
  key(-1, 0.205, 0.062);
  key(-1, 0.283, 0.062);
  key( 1, 0.235, 0.098);

  /* shell, then the metal rail as a stroke just inside its edge */
  B.push('<rect x="' + n(bx) + '" y="' + n(by) + '" width="' + n(bw) + '" height="' + n(bh) +
         '" rx="' + n(rr) + '" fill="url(#' + id + '-shell)"/>');
  var ri = rail / 2 + 0.15;
  B.push('<rect x="' + n(bx + ri) + '" y="' + n(by + ri) + '" width="' + n(bw - ri * 2) +
         '" height="' + n(bh - ri * 2) + '" rx="' + n(Math.max(rr - ri, 0.1)) +
         '" fill="none" stroke="url(#' + id + '-rail)" stroke-width="' + n(rail) + '"/>');
  for(i = 0; i < L.length; i++) B.push(L[i]);

  /* antenna seams across the rail band, clear of the corner arc and only where they read */
  if(bw > 190 && R.chance(0.55)){
    var seamW = Math.max(bw * 0.006, 0.7), sOp = o(railOp * 0.45), gap = Math.max(bh * 0.105, rr * 1.4);
    var seams = [by + gap, by + bh - gap];
    for(i = 0; i < seams.length; i++){
      B.push('<path d="M' + n(bx) + ' ' + n(seams[i]) + 'H' + n(sx) + 'M' + n(sx + sw) + ' ' + n(seams[i]) +
             'H' + n(bx + bw) + '" fill="none" stroke="' + SOFT + '" stroke-opacity="' + sOp +
             '" stroke-width="' + n(seamW) + '"/>');
    }
  }

  /* the screen well, and the lip where glass meets rail */
  B.push('<rect x="' + n(sx) + '" y="' + n(sy) + '" width="' + n(sw) + '" height="' + n(sh) +
         '" rx="' + n(sr) + '" fill="' + glass + '"/>');
  var lip = Math.max(bw * 0.007, 0.5);
  B.push('<rect x="' + n(sx - lip / 2) + '" y="' + n(sy - lip / 2) + '" width="' + n(sw + lip) +
         '" height="' + n(sh + lip) + '" rx="' + n(sr + lip / 2) + '" fill="none" stroke="' + SOFT +
         '" stroke-opacity="' + o(railOp * 0.45) + '" stroke-width="' + n(lip) + '"/>');

  /* pill camera cutout, near the top of the screen */
  var pw = sw * R.f(0.235, 0.310), ph = pw * R.f(0.300, 0.345);
  var px = sx + (sw - pw) / 2, py = sy + bh * R.f(0.019, 0.028);
  B.push('<rect x="' + n(px) + '" y="' + n(py) + '" width="' + n(pw) + '" height="' + n(ph) +
         '" rx="' + n(ph / 2) + '" fill="' + DARK + '"/>');
  if(pw > 16){
    B.push('<circle cx="' + n(px + pw - ph * 0.56) + '" cy="' + n(py + ph / 2) + '" r="' + n(ph * 0.26) +
           '" fill="' + SOFT + '" opacity="0.2"/>');
  }

  /* THE SCREEN: empty, exact, and last, so the caller can find it and fill it */
  B.push('<rect class="screen" x="' + n(sx) + '" y="' + n(sy) + '" width="' + n(sw) +
         '" height="' + n(sh) + '" rx="' + n(sr) + '" fill="none"/>');

  return { defs: D.join(''), body: B.join('') };
}

/* ── REAL DEVICES ─────────────────────────────────────────────────────────
   Every number below is derived from Apple's own published dimensions, not
   from taste. Body width and height in mm; the active display in pixels at its
   stated ppi, converted to mm; the bezel is what is left over, halved.
   Everything the frames use is then a RATIO of body width, so it survives any
   render size.

     bez   = (bodyW - screenW) / 2 / bodyW      side bezel, share of body width
     ar    = screenH / screenW                  the picture's own proportion
     rad   = corner radius / bodyW

   Worked, so the arithmetic can be checked rather than trusted:
     iPad Pro 13 M4  215.5mm wide, 2064px @264ppi = 198.6mm  ->  8.45mm  = 3.92%
     iPad mini A17   134.8mm wide, 1488px @326ppi = 115.9mm  ->  9.45mm  = 7.01%
     MacBook Pro 16  355.7mm wide, 3456px @254ppi = 345.6mm  ->  5.05mm  = 1.42%

   The spread is the point: an iPad mini's bezel is nearly TWICE a 13-inch
   Pro's as a share of its body, and a MacBook's is a third of either. One
   number for "tablet" cannot be right for both ends of the range — the last
   revision used 2.0-2.7% for every tablet, which is thinner than any iPad
   Apple has ever shipped and made a mini look like a Pro. */
export const TABLETS = [
  /* name,              bez,    ar,    rad   */
  { name: 'iPad Pro 13',  bez: .0392, ar: 1.333, rad: .078 },
  { name: 'iPad Pro 11',  bez: .0479, ar: 1.451, rad: .088 },
  { name: 'iPad Air 13',  bez: .0416, ar: 1.333, rad: .078 },
  { name: 'iPad Air 11',  bez: .0580, ar: 1.439, rad: .088 },
  { name: 'iPad 11',      bez: .0604, ar: 1.439, rad: .088 },
  { name: 'iPad mini',    bez: .0701, ar: 1.523, rad: .098 },
];
/* Laptops: bez is the SIDE bezel; top and chin are their own shares of body
   width, because the lid is not square and a single number would squash them.
   MacBook screens are 16:10-ish (1.54), never 16:9 — the old code offered
   1.7778 as one of three choices, which is a television. */
export const LAPTOPS = [
  { name: 'MacBook Pro 16', bez: .0142, top: .0382, chin: .0312, ar: 1.547 },
  { name: 'MacBook Pro 14', bez: .0163, top: .0438, chin: .0358, ar: 1.540 },
  { name: 'MacBook Air 15', bez: .0203, top: .0475, chin: .0388, ar: 1.545 },
  { name: 'MacBook Air 13', bez: .0227, top: .0552, chin: .0451, ar: 1.538 },
];

/* Flat-on tablet slab (7% corner radius, ~4% bezel, top-centre camera, flush power/volume seams) fitted and centred in the box, portrait or landscape from the box aspect; casing is shaded by the palette's darkest member and lit by its lightest, with the screen and case tinted by ground/ground2/accent, so the one .screen rect is the only fillable target. */
export function frame_tablet(x, y, w, h, P, R, id) {
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
  var aw = Math.max(4, w - hair), ah = Math.max(4, h - hair);
  var land = (w / h) > 1.12;
  /* A REAL MODEL, not a guessed ratio. `ar` here is short/long, which is the
     reciprocal of the spec table's screenH/screenW. */
  var MODEL = R.pick(TABLETS);
  var ar = 1 / MODEL.ar;                                  // short edge / long edge
  var dw, dh;
  if (land) { dw = Math.min(aw, ah / ar); dh = dw * ar; }
  else { dh = Math.min(ah, aw / ar); dw = dh * ar; }
  var bx = x + (w - dw) / 2, by = y + (h - dh) / 2;
  var S = Math.min(dw, dh);

  var rad = S * MODEL.rad;                                 // this model's corner radius
  /* An iPad Pro is 214mm across with about 5mm of bezel — 2.3%. This was
     3.6-4.6%, which is the 2018 body, and the slab was filled edge to edge
     from the palette, so a pale palette produced a WHITE bezel and a tinted
     one produced a purple bezel. Apple has never sold either. Only the rim is
     metal now; everything inside it is black, exactly as on the laptop. */
  /* This model's measured bezel, with a hair of variance so a wall of tablets
     is not mechanically identical. An iPad mini is 7.0% and a 13-inch Pro is
     3.9%: the difference between them is most of what tells them apart. */
  var bez = S * MODEL.bez * R.f(0.94, 1.06);
  var rim = Math.max(0.6, S * R.f(0.005, 0.008));
  var irad = Math.max(rad - bez, rad * 0.34);
  var prad = Math.max(0, rad - rim);
  var sx = bx + bez, sy = by + bez, sw = dw - bez * 2, sh = dh - bez * 2;

  // casing shaded with the deepest hue, lit with the lightest, tinted by the ground
  var pale = R.chance(0.34);
  var tintSrc = R.pick([P.ground, P.ground2, P.ground, P.accent]);
  var tintAmt = tintSrc === P.accent ? 0.12 : 0.19;
  var caseA = pale ? mix(mix(light, shade, 0.05), P.ground2, 0.05) : mix(mix(shade, light, 0.21), P.ground, 0.10);
  var caseB = pale ? mix(light, shade, 0.19) : mix(shade, light, 0.02);
  var rimC = pale ? shade : light, rimO = pale ? 0.18 : 0.16;
  var scrA = mix(shade, tintSrc, tintAmt);
  var scrB = mix(shade, P.ground2, 0.05);
  /* The black plate behind the glass. Keyed to P.dark, never to the palette's
     lightest member, so it cannot come out white. */
  var plateA = mix(P.dark, P.body, 0.07), plateB = P.dark;

  var tilt = R.f(0.10, 0.42);
  var gid = id + '-tabcase', sid = id + '-tabscr', cid = id + '-tabclip', pid = id + '-tabplate';

  var defs = ''
    + '<linearGradient id="' + gid + '" x1="' + n(tilt) + '" y1="0" x2="' + n(1 - tilt) + '" y2="1">'
    + '<stop offset="0" stop-color="' + caseA + '"/><stop offset="1" stop-color="' + caseB + '"/></linearGradient>'
    + '<linearGradient id="' + sid + '" x1="0" y1="0" x2="' + n(1 - tilt) + '" y2="1">'
    + '<stop offset="0" stop-color="' + scrA + '"/><stop offset="1" stop-color="' + scrB + '"/></linearGradient>'
    + '<linearGradient id="' + pid + '" x1="' + n(tilt) + '" y1="0" x2="' + n(1 - tilt) + '" y2="1">'
    + '<stop offset="0" stop-color="' + plateA + '"/><stop offset="1" stop-color="' + plateB + '"/></linearGradient>'
    + '<clipPath id="' + cid + '"><rect x="' + n(sx) + '" y="' + n(sy) + '" width="' + n(sw) + '" height="' + n(sh) + '" rx="' + n(irad) + '"/></clipPath>';

  var body = ''
    + '<rect x="' + n(bx) + '" y="' + n(by) + '" width="' + n(dw) + '" height="' + n(dh) + '" rx="' + n(rad) + '"'
    + ' fill="url(#' + gid + ')" stroke="' + rimC + '" stroke-opacity="' + rimO + '" stroke-width="' + n(hair) + '"/>'
    + '<rect x="' + n(bx + rim) + '" y="' + n(by + rim) + '" width="' + n(dw - rim * 2) + '" height="' + n(dh - rim * 2) + '"'
    + ' rx="' + n(prad) + '" fill="url(#' + pid + ')"/>'
    + '<rect class="screen" id="' + id + '-screen" x="' + n(sx) + '" y="' + n(sy) + '" width="' + n(sw) + '" height="' + n(sh) + '"'
    + ' rx="' + n(irad) + '" fill="url(#' + sid + ')"/>';

  if (R.chance(0.62)) {
    body += '<g clip-path="url(#' + cid + ')"><polygon points="'
      + n(sx) + ',' + n(sy + sh * 0.34) + ' ' + n(sx + sw * 0.44) + ',' + n(sy) + ' '
      + n(sx + sw * 0.72) + ',' + n(sy) + ' ' + n(sx) + ',' + n(sy + sh * 0.76)
      + '" fill="' + light + '" opacity="0.06"/></g>';
  }

  // flush buttons: power on the top edge, volume pair on the right edge
  var btnT = Math.max(0.8, S * 0.008), btnL = S * 0.055, btnC = pale ? shade : light, btnO = pale ? 0.22 : 0.20;
  var seam = function (px, py, pw, ph) {
    return '<rect x="' + n(px) + '" y="' + n(py) + '" width="' + n(pw) + '" height="' + n(ph) + '"'
      + ' rx="' + n(Math.min(pw, ph) / 2) + '" fill="' + btnC + '" opacity="' + btnO + '"/>';
  };
  body += seam(bx + dw * 0.74, by, btnL, btnT)
    + seam(bx + dw - btnT, by + dh * 0.10, btnT, btnL)
    + seam(bx + dw - btnT, by + dh * 0.10 + btnL * 1.45, btnT, btnL);

  /* No lens here. showcase.mjs draws the tablet's camera on top of the
     wallpaper; drawing one underneath as well is where the second camera came
     from, and it was drawn as three stacked circles at that. */

  return { defs: defs, body: body };
}

/* 6-10 nested ellipse rings anchored just outside one corner, tilted and squashed so they sweep edge-on out of frame; ring colours alternate between the palette's dark half (dark/ground2/body/ink) and light half (paper/accent/hot) sorted by measured luminance, so every band boundary is a hard tonal step at 90px; card ground is excluded and a faint P.dark corner-to-corner gradient adds depth. */
export function wall_arcs(x, y, w, h, P, R, id) {
  const n1 = v => v.toFixed(1);
  /* luminance of a palette hex, so neighbouring rings can be forced apart:
     the pattern has to survive at 90px, where contrast is the only thing left */
  const lum = c => {
    let s = String(c == null ? '' : c).replace('#', '');
    if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    const v = parseInt(s.slice(0, 6), 16);
    if (!(v >= 0)) return 0.5;
    return (0.2126 * ((v >> 16) & 255) + 0.7152 * ((v >> 8) & 255) + 0.0722 * (v & 255)) / 255;
  };
  /* the card's own ground is left out: a screen painted the colour of the card
     it sits on reads as a switched-off phone */
  const pool = [];
  [P.paper, P.hot, P.accent, P.ink, P.ground2, P.body, P.dark].forEach(c => {
    if (typeof c === 'string' && c && pool.indexOf(c) < 0) pool.push(c);
  });
  while (pool.length < 2) pool.push(pool.length ? pool[0] : '#000000');
  const sorted = pool.slice().sort((a, b) => lum(a) - lum(b));
  const cut = Math.ceil(sorted.length / 2);
  const dk = sorted.slice(0, cut);              /* darkest first */
  const lt = sorted.slice(cut).reverse();       /* lightest first */
  if (!lt.length) lt.push(dk.pop() || dk[0]);
  if (!dk.length) dk.push(lt[lt.length - 1]);

  /* fewer, fatter rings on a small box: at a 90px phone screen ten bands is mush */
  const n = R.i(6, Math.min(w, h) < 150 ? 8 : 10);
  /* alternate dark ring / light ring so every boundary is a hard tonal step */
  const flip = R.chance(0.5) ? 0 : 1, di = R.i(0, dk.length - 1), li = R.i(0, lt.length - 1);
  const seq = [];
  for (let i = 0; i <= n; i++) seq.push((i + flip) % 2 ? lt[(li + (i >> 1)) % lt.length] : dk[(di + (i >> 1)) % dk.length]);

  /* anchor: one corner, nudged outside the box so the rings run out of frame */
  const right = R.chance(0.5), bottom = R.chance(0.5);
  const cx = right ? x + w * (1 + R.f(0, 0.16)) : x - w * R.f(0, 0.16);
  const cy = bottom ? y + h * (1 + R.f(0, 0.16)) : y - h * R.f(0, 0.16);

  /* squash + tilt: the rainbow seen edge-on */
  const sq = R.f(0.62, 1), sx = R.chance(0.5) ? sq : 1, sy = sx === sq ? 1 : sq;
  const ang = R.f(-26, 26), ca = Math.cos(ang * Math.PI / 180), sa = Math.sin(ang * Math.PI / 180);

  /* biggest radius must clear the far corner in the tilted, squashed frame */
  let far = 0;
  [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(p => {
    const dx = p[0] - cx, dy = p[1] - cy;
    const lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
    const d = Math.sqrt((lx / sx) * (lx / sx) + (ly / sy) * (ly / sy));
    if (d > far) far = d;
  });
  const rMax = far * R.f(1.04, 1.22), rMin = rMax * R.f(0.10, 0.20);

  const wts = [];
  let tot = 0;
  for (let i = 0; i < n; i++) { const v = R.f(0.8, 1.45); wts.push(v); tot += v; }
  let acc = 0, rings = '';
  for (let i = 0; i < n; i++) {
    const r = rMax - (rMax - rMin) * (acc / tot);
    acc += wts[i];
    rings += `<ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(r * sx)}" ry="${n1(r * sy)}" fill="${seq[i + 1]}"/>`;
  }

  const gx1 = right ? 100 : 0, gx2 = right ? 0 : 100, gy1 = bottom ? 100 : 0, gy2 = bottom ? 0 : 100;
  const defs =
    `<clipPath id="${id}ac"><rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}"/></clipPath>` +
    `<linearGradient id="${id}ag" x1="${gx1}%" y1="${gy1}%" x2="${gx2}%" y2="${gy2}%">` +
    `<stop offset="0" stop-color="${P.dark}" stop-opacity="0"/>` +
    `<stop offset="1" stop-color="${P.dark}" stop-opacity="0.22"/></linearGradient>`;

  const body =
    `<g clip-path="url(#${id}ac)">` +
    `<rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" fill="${seq[0]}"/>` +
    `<g transform="rotate(${n1(ang)} ${n1(cx)} ${n1(cy)})">${rings}</g>` +
    `<rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" fill="url(#${id}ag)"/>` +
    `</g>`;

  return { defs, body };
}

/* 40-90 gapless horizontal bands (mostly thin, ~12% fat) whose colour walks c0 to c1 to c2 down the screen, with alternating-sign lightness jitter plus occasional flare/deep bands and hairline streaks for high-contrast neighbours; triples are picked from dark/ground/ground2/accent/hot/paper/body with luminance guards, highlights use paper (or dark on light palettes), hot for a few streaks, and two same-colour opacity gradients add sheen and top/bottom depth. Verified in headless Chrome at 90x190 across 8 palettes and 8 seeds: bold readable stripes, deterministic, no text, all output rounded to 1 decimal and clipped to the rect. */
export function wall_bands(x, y, w, h, P, R, id) {
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

/* A jittered grid split into 30-80 triangles; the palette minus `ground` is sorted by luminance and only its dark end and light end are used, checkerboarded so touching facets always jump value — darks lean on dark/ink/ground2, lights on paper/hot/body, with accent or another mid-value hue swapped in on half the cards. */
export function wall_poly(x, y, w, h, P, R, id) {
  const f = n => n.toFixed(1);
  const rgb = c => { let s = String(c || '#000').replace('#', ''); if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2]; const n = parseInt(s, 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const lum = c => { const p = rgb(c); return (p[0] * .2126 + p[1] * .7152 + p[2] * .0722) / 255; };
  const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); let s = '#'; for (let i = 0; i < 3; i++) { const v = Math.max(0, Math.min(255, Math.round(A[i] + (B[i] - A[i]) * t))); s += (v < 16 ? '0' : '') + v.toString(16); } return s; };

  /* never the card's own ground: a screen the same colour as the card reads as
     switched off. Sort what is left by luminance and use only the two ends of
     that ramp, so neighbouring facets differ in value, not merely in hue. */
  const pool = [];
  [P.dark, P.ink, P.ground2, P.body, P.accent, P.hot, P.paper].forEach(c => { if (c && pool.indexOf(c) < 0) pool.push(c); });
  pool.sort((a, b) => lum(a) - lum(b));
  const k = Math.max(1, Math.min(3, Math.floor(pool.length / 2)));
  const darks = pool.slice(0, k), lights = pool.slice(pool.length - k);
  /* the mid-value hues sit in neither end and would never be seen; let one of
     them in on some cards, on whichever side it is already closest to, so the
     brand accent gets its turn without closing the value gap */
  const mids = pool.slice(k, pool.length - k);
  if (mids.length && R.chance(.5)) {
    const m = R.pick(mids);
    if (lum(lights[0]) - lum(m) <= lum(m) - lum(darks[k - 1])) lights[0] = m; else darks[k - 1] = m;
  }

  /* grid sized so the cells stay chunky whatever the screen's aspect */
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

  const gx = R.f(-1, 1), gy = R.f(-1, 1), gn = Math.abs(gx) + Math.abs(gy) + 1e-6;
  let m = '';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const A = [px[r][c], py[r][c]], B = [px[r][c + 1], py[r][c + 1]];
    const C = [px[r + 1][c + 1], py[r + 1][c + 1]], D = [px[r + 1][c], py[r + 1][c]];
    const tris = R.chance(.5) ? [[A, B, C], [A, C, D]] : [[A, B, D], [B, C, D]];
    for (let t = 0; t < 2; t++) {
      const T = tris[t];
      const cx = (T[0][0] + T[1][0] + T[2][0]) / 3, cy = (T[0][1] + T[1][1] + T[2][1]) / 3;
      const u = (cx - x) / w * gx + (cy - y) / h * gy;
      const band = (u + gn) / (2 * gn);
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

/* A 5-7 stripe ribbon at 32-38 degrees crossing the middle third of the screen over a near-flat ground: ground is picked from the palette's darkest or lightest end, stripe colours are the remaining hues filtered for distance from that ground and from each other, then ordered so touching stripes take the largest colour jump available. */
export function wall_diagonal(x, y, w, h, P, R, id) {
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
  var dist = function (a, b) { /* 0..1 colour gap; hue counts as well as lightness */
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

  /* ground: an extreme of the palette, so the ribbon has clean space above and below */
  var darkEnd = byLum.slice(0, Math.max(1, Math.min(2, byLum.length - 1)));
  var lightEnd = byLum.slice(Math.max(1, byLum.length - 2));
  var ground = R.pick(R.chance(0.62) ? darkEnd : lightEnd);
  var gl = lum(ground);

  /* stripe colours must fight the ground */
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

  /* drop near-twins: two stripes that read as one blur at 90px are wasted */
  var keep = [], ok;
  for (i = 0; i < pool.length; i++) {
    ok = 1;
    for (j = 0; j < keep.length; j++) if (dist(pool[i], keep[j]) < 0.16) ok = 0;
    if (ok) keep.push(pool[i]);
  }
  pool = keep.length ? keep : pool;
  /* a lone usable colour: let the ground itself act as the spacer stripe */
  if (pool.length < 2) pool = [pool[0], ground];

  /* every colour is used once before any repeat, and inside that rule each
     stripe takes the biggest colour jump from the stripe it touches */
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
  var ext = Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad)); /* span across the stripes */
  var band = ext * R.f(0.30, 0.40);                                    /* middle third of it */
  var off = ext * R.f(-0.05, 0.05);
  var L = (Math.abs(w) + Math.abs(h)) * 1.2;                           /* runs past both corners */

  var wts = [], sum = 0;
  for (i = 0; i < n; i++) wts.push(R.f(0.80, 1.25));
  var hero = R.i(0, n - 1);
  if (R.chance(0.55)) wts[hero] *= R.f(1.5, 2.0); /* one fat stripe carries the rhythm */
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

/* Three-to-four huge blurred radial blobs plus a small saturated core over a ground fill; picks the darkest (or, 1-in-4, the lightest) palette colour as the base and chooses blobs by chroma and hue separation from accent/hot/ground2/paper/ink/body/dark, never P.ground. */
export function wall_mesh(x, y, w, h, P, R, id) {
  const n = v => v.toFixed(1);
  const o = v => Math.max(0, Math.min(1, v)).toFixed(2);
  const key = c => {
    let s = String(c == null ? '' : c).trim().toLowerCase().replace(/^#/, '');
    if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    return s.slice(0, 6);
  };
  const ok = s => /^[0-9a-f]{6}$/.test(s);

  /* the deck, measured. luminance decides what can sit on what; chroma and hue
     decide which of them are allowed to be neighbours — three near-whites all
     "contrast" with black and together they make porridge. */
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
  /* the card's own ground is held back: a screen painted the colour of the card
     it sits on reads as a phone that is switched off */
  for (const c of [P.dark, P.ink, P.accent, P.hot, P.paper, P.ground2, P.body]) if (key(c) !== gk) add(c);
  if (ent.length < 3) add(P.ground);

  const rect = `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"`;
  if (ent.length < 2) return { defs: '', body: `${rect} fill="${ent.length ? ent[0].c : P.dark}"/>` };

  ent.sort((a, b) => a.l - b.l);
  const light = ent[ent.length - 1].l > .55 && R.chance(.25);
  const base = light ? ent[ent.length - 1] : ent[0];
  const other = ent.filter(e => e !== base);

  /* the colour blobs: strongest chroma first, and no two within 22 degrees of
     hue, so at 90px the areas separate instead of blending into one bruise */
  const chrom = other.filter(e => e.s >= .18 && Math.abs(e.l - base.l) >= .10).sort((a, b) => b.s - a.s);
  const deck = [];
  for (const e of chrom) {
    if (deck.length >= 3) break;
    if (deck.every(p => { const dh = Math.abs(p.h - e.h); return Math.min(dh, 360 - dh) >= 22; })) deck.push(e);
  }
  for (const e of chrom) if (deck.length < 2 && deck.indexOf(e) < 0) deck.push(e);
  for (const e of other.slice().sort((a, b) => Math.abs(b.l - base.l) - Math.abs(a.l - base.l)))
    if (deck.length < 2 && deck.indexOf(e) < 0) deck.push(e);

  /* one pale (or, on a light mesh, one dark) counterweight — kept smaller and
     softer, because a second white blob is what turns this genre to mush */
  const pale = other.filter(e => deck.indexOf(e) < 0 && Math.abs(e.l - base.l) > .32)
                    .sort((a, b) => Math.abs(b.l - base.l) - Math.abs(a.l - base.l))[0];

  const list = [];
  if (pale && R.chance(.62)) list.push({ e: pale, k: R.f(.66, .84), a: R.f(.74, .95) });
  const ord = deck.slice();
  for (let i = ord.length - 1; i > 0; i--) { const j = R.i(0, i), t = ord[i]; ord[i] = ord[j]; ord[j] = t; }
  const want = Math.min(ord.length, list.length ? R.i(2, 3) : 3);
  for (let i = 0; i < want; i++) list.push({ e: ord[i], k: R.f(.74, 1.14), a: R.f(.9, 1) });

  /* scale off the LONG edge, not the short one: a laptop screen is as wide as a
     phone is tall, and blobs sized to its short edge swallow the whole panel */
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

  /* the hot core: small, saturated, off centre — the one thing that still reads
     as a light source when the whole screen is 90 pixels wide */
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

/* Four bold blocks on the palette's darkest ground (dark/ground/ink, whichever is darkest): battery low, logic board with chips upper left, camera module upper right, right-angle ribbons and pads between them, four corner screws — outlines in P.accent (structure) and P.hot (silicon/ribbons), with a colour-picker that swaps in P.paper when accent or hot fails a 2.8:1 contrast check against that ground, so it never goes invisible on a palette; one mirror flag flips the whole teardown, and stroke weights are a fixed fraction of the screen so it reads the same at 90px and 900px. Verified rendered at 60/68/90px portrait, 170x150, 280x175 landscape and 380x820 across six palettes. */
export function wall_schematic(x, y, w, h, P, R, id) {
  const F = n => n.toFixed(1);
  const m = Math.min(w, h);

  /* The palette is not ours to choose. Pick the darkest ground it offers and
     the two colours that actually separate from it — a schematic whose lines
     sit close to its background is just a switched-off screen. */
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

  /* strokes stay a fixed fraction of the screen, so the drawing has the same
     weight on a 90px phone as on a 900px one */
  const s1 = Math.max(1, m * .016), s2 = Math.max(.75, m * .010), s3 = Math.max(.5, m * .007);

  /* one mirror flag flips the whole teardown left-to-right */
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

  /* a coarse survey grid — cells about a third of the short side, so it stays
     three or four lines wide and never turns into texture-mush */
  const g = m / 3.4;
  for (let gx = x + ((w % g) + g) / 2; gx < x + w - 1; gx += g)
    s += ln([[gx, y], [gx, y + h]], A, s3 * .8, '.10');
  for (let gy = y + ((h % g) + g) / 2; gy < y + h - 1; gy += g)
    s += ln([[x, gy], [x + w, gy]], A, s3 * .8, '.10');

  /* the chassis */
  s += rc(BX(.045, .035, .955, .965), m * .10, null, 0, A, s2, '.40');

  const bV1 = R.f(.375, .43);          /* bottom of the logic board */
  const btV = R.f(.505, .55);          /* top of the battery        */

  /* logic board, upper left (or right, mirrored) */
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

  /* camera module, upper right */
  const cm = BX(.63, .085, .925, .30);
  s += rc(cm, m * .06, B, '.18', B, s1, '.92');
  const vert = cm.h >= cm.w, nl = R.i(2, 3);
  const lr = Math.min(cm.w, cm.h) * (nl === 3 ? .21 : .26);
  for (let i = 0; i < nl; i++) {
    const t = (i + 1) / (nl + 1);
    const lx = vert ? cm.x + cm.w * .40 : cm.x + cm.w * t;
    const ly = vert ? cm.y + cm.h * t : cm.y + cm.h * .44;
    s += ci(lx, ly, lr, null, 0, B, s2, '.95');
    s += ci(lx, ly, lr * .38, A, '.65', null, 0, 0);
  }
  s += ci(vert ? cm.x + cm.w * .78 : cm.x + cm.w * .5, vert ? cm.y + cm.h * .82 : cm.y + cm.h * .82,
          lr * .40, A, '.35', A, s3, '.80');

  /* battery — the biggest, brightest shape on the screen */
  const bt = BX(.10, btV, .90, .895);
  s += rc(bt, m * .045, A, '.16', A, s1 * 1.15, '.95');
  const tw = bt.w * .09, th = Math.max(1.2, m * .026);
  for (let i = 0; i < 2; i++)
    s += rc({ x: bt.x + bt.w * (fl ? .76 - i * .13 : .15 + i * .13), y: bt.y - th * .62, w: tw, h: th }, th * .3, A, '.9', null, 0, 0);
  const nd = R.i(1, 2);
  for (let i = 1; i <= nd; i++) {
    const t = i / (nd + 1);
    if (bt.w >= bt.h) s += ln([[bt.x + bt.w * t, bt.y + bt.h * .14], [bt.x + bt.w * t, bt.y + bt.h * .86]], A, s2, '.55');
    else s += ln([[bt.x + bt.w * .12, bt.y + bt.h * t], [bt.x + bt.w * .88, bt.y + bt.h * t]], A, s2, '.55');
  }

  /* ribbon runs between the blocks, right angles only */
  const j1 = bV1 + (btV - bV1) * .42, j2 = bV1 + (btV - bV1) * .74;
  s += ln([[X(.20), Y(bV1)], [X(.20), Y(j1)], [X(.33), Y(j1)], [X(.33), Y(btV)]], B, s2, '.70');
  s += ln([[X(.47), Y(bV1)], [X(.47), Y(j2)], [X(.71), Y(j2)], [X(.71), Y(btV)]], B, s2, '.70');
  s += ln([[X(.70), Y(.30)], [X(.70), Y(.345)], [X(.565), Y(.345)]], B, s2, '.70');
  s += ln([[X(.88), Y(.30)], [X(.88), Y(btV)]], B, s2, '.55');
  const pd = Math.max(1.2, m * .034);
  for (const p of [[X(.20), Y(bV1)], [X(.47), Y(bV1)], [X(.33), Y(btV)], [X(.71), Y(btV)], [X(.88), Y(.30)]])
    s += rc({ x: p[0] - pd / 2, y: p[1] - pd / 2, w: pd, h: pd }, pd * .28, B, '.85', null, 0, 0);

  /* port and screws */
  const pt = BX(.415, .915, .585, .952);
  s += rc(pt, pt.h * .5, A, '.28', A, s2, '.75');
  const sr = Math.max(.9, m * .026);
  for (const p of [[.085, .062], [.915, .062], [.085, .945], [.915, .945]]) {
    s += ci(X(p[0]), Y(p[1]), sr, null, 0, A, s2, '.60');
    s += ci(X(p[0]), Y(p[1]), sr * .34, A, '.70', null, 0, 0);
  }

  return { defs, body: `<g clip-path="url(#${cid})">${s}</g>` };
}

/* Layered hills: 3-5 stacked ridges over a two-stop sky whose ramp ends at the skyline, plus a sun or moon-ring behind the ridges; ridges are drawn from paper/hot/accent/ink/dark (never the card's ground), alternated light/dark and forced at least .24 luminance apart against their neighbour, so every boundary is a hard tonal step at 90px. */
export function wall_hills(x, y, w, h, P, R, id) {
  const F = n => (Math.round(n * 10) / 10).toFixed(1);
  const rgb = c => {
    let s = String(c == null ? '' : c).replace('#', '').trim();
    if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    const v = parseInt(s.slice(0, 6), 16);
    const n = v >= 0 ? v : 0;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  /* luminance, so neighbouring bands can be forced apart: on a 90px phone
     screen the tonal step is the only thing that still reads */
  const lum = c => {
    const p = rgb(c).map(v => { const s = v / 255; return s <= .03928 ? s / 12.92 : Math.pow((s + .055) / 1.055, 2.4); });
    return .2126 * p[0] + .7152 * p[1] + .0722 * p[2];
  };
  const mix = (a, b, t) => {
    const A = rgb(a), B = rgb(b);
    return '#' + [0, 1, 2].map(i => Math.round(A[i] + (B[i] - A[i]) * t).toString(16).padStart(2, '0')).join('');
  };
  /* forces two colours apart in tone without inventing a hue: the colour walks
     along the line toward whichever of the palette's own anchors — paper or
     dark — is furthest from what it has to sit next to, and only as far as it
     must. One anchor is always at least .45 away, so this always succeeds. */
  const apart = (c, ref, need) => {
    if (Math.abs(lum(c) - lum(ref)) >= need) return c;
    const tgt = Math.abs(lum(P.paper) - lum(ref)) > Math.abs(lum(P.dark) - lum(ref)) ? P.paper : P.dark;
    let out = c;
    for (let k = 2; k <= 5; k++) { out = mix(c, tgt, k / 5); if (Math.abs(lum(out) - lum(ref)) >= need) break; }
    return out;
  };

  /* the card's own ground is left out: a screen painted the colour of the card
     it sits on reads as a switched-off phone, not as a wallpaper */
  const pool = [];
  [P.paper, P.hot, P.accent, P.ink, P.dark].forEach(c => { if (typeof c === 'string' && c && pool.indexOf(c) < 0) pool.push(c); });
  [P.ground2, P.body].forEach(c => { if (pool.length < 2 && typeof c === 'string' && c && pool.indexOf(c) < 0) pool.push(c); });
  while (pool.length < 2) pool.push(mix(pool[0] || P.dark, P.paper, pool.length ? .85 : .15));
  const sorted = pool.slice().sort((a, b) => lum(a) - lum(b));
  const cut = Math.max(1, Math.floor(sorted.length / 2));
  const dk = sorted.slice(0, cut), lt = sorted.slice(cut);
  if (!lt.length) lt.push(mix(dk[dk.length - 1], P.paper, .8));
  if (!dk.length) dk.push(mix(lt[0], P.dark, .8));

  /* SKY: two palette colours, the ramp finishing at the skyline rather than at
     the foot of the screen, so the glow banks up behind the first ridge */
  const pair = R.pick([[P.ink, P.paper], [P.dark, P.hot], [P.accent, P.paper], [P.hot, P.paper],
    [P.dark, P.accent], [P.accent, P.hot], [P.ink, P.hot], [P.dark, P.paper]]);
  const top = pair[0] || P.dark || dk[0];
  let bot = pair[1] || P.paper || lt[lt.length - 1];
  bot = apart(bot, top, .14);
  const mid = R.f(.48, .70), glow = mix(top, bot, R.f(.30, .48));
  const skyAt = t => { const u = Math.max(0, Math.min(1, t)); return u < mid ? mix(top, glow, u / mid) : mix(glow, bot, (u - mid) / (1 - mid)); };

  /* three to five ranges, weighted to the smaller counts: four fat ridges carry
     further than five thin ones */
  const n = R.pick([3, 3, 4, 4, 4, 5]);
  const base = R.f(.46, .56), step = (.97 - base) / (n - 1);
  /* every ridge rises ABOVE its own valley line and never falls below it, so no
     near hill can dip behind the one it stands in front of — at 90px a crossed
     pair reads as a floating lens, not as a landscape */
  const amp = [];
  for (let i = 0; i < n; i++) amp.push(i ? step * R.f(.48, .80) : Math.min(base - .20, step * R.f(.9, 1.5)));
  const sky = Math.max(.08, base - amp[0] - .03);

  /* RIDGES alternate light / dark so no two neighbours can blur together */
  const seq = [], bag = { l: [], d: [] }, seen = {};
  let wantLight = lum(bot) < .5;
  for (let i = 0; i < n; i++) {
    const g = wantLight ? 'l' : 'd';
    if (!bag[g].length) bag[g] = (wantLight ? lt : dk).slice();
    const c = bag[g].splice(R.i(0, bag[g].length - 1), 1)[0];
    /* a colour's second turn comes back as a shaded twin, never a flat repeat */
    seq.push(seen[c] ? mix(c, wantLight ? P.dark : P.paper, .24) : c);
    seen[c] = 1;
    wantLight = !wantLight;
  }
  let prev = bot;                                    /* the sky the first ridge cuts into */
  for (let i = 0; i < n; i++) { seq[i] = apart(seq[i], prev, .24); prev = seq[i]; }

  /* NO SUN. This drew a hard disc at maximum contrast against the sky on 78%
     of hills wallpapers — so most of the set carried the same literal circle,
     and the owner called it basic twice. The ridges already do the work: the
     tonal steps between them are what reads at 90px, and a flat disc on top
     just competes with the type the wallpaper sits behind. Left as an empty
     string rather than deleted from the template so the layer order below is
     unchanged. */
  const sun = '';

  /* far ranges carry more, finer peaks; the near ones come down to one or two
     big humps — that difference is what reads as depth at thumbnail size */
  const over = w * .14, xl = x - over, xr = x + w + over, yb = y + h;
  let m = '';
  /* a wide screen gets proportionally more peaks, or the same three humps
     stretched across a laptop read as flat stripes rather than as hills */
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

/* Flat field in one palette role with a single pool of light (crisp disc 57% of the time, soft-edged pool otherwise) parked in the outer-fifth band so the middle 60% stays a near-uniform ramp; field/light pair chosen by measured contrast (>=3.2:1, one member bright, never the card's ground), leaning ground2/hot/accent fields with paper/ink/accent light, plus a 7-15% `deep` shade falling away from the light. Verified over 8 palettes x 300 seeds and 10 box shapes: p5-p95 lightness spread at 90px 34-85 L*, middle-band spread median 8 / max 25 L*, no NaN, no id leaks, everything clipped to the rect. */
export function wall_field(x, y, w, h, P, R, id) {
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
  /* pairwise blend, used only by the brightness floor below */
  var mixc = function (a, b, t) {
    var A = hex(a), B = hex(b), out = '#', k, v;
    if (!A || !B) return a;
    for (k = 0; k < 3; k++) {
      v = Math.round(parseInt(A.substr(k * 2, 2), 16) + (parseInt(B.substr(k * 2, 2), 16) - parseInt(A.substr(k * 2, 2), 16)) * t);
      v = v < 0 ? 0 : v > 255 ? 255 : v;
      out += (v < 16 ? '0' : '') + v.toString(16);
    }
    return out;
  };

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
  var lift = !R.chance(.15);
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

  /* A FLOOR ON THE FIELD, so a screen is never a dead black rectangle.
     The search above already demands one bright member — but only for the
     pairs it accepts. When nothing clears the bar it falls through to `best`,
     the highest-contrast pair whatever its brightness, and on a dark palette
     that is two near-blacks. Measured on the olive palette: three of nine
     screens on a card came out as unlit glass, which reads as a broken device
     rather than a dark wallpaper. Lift the field toward the brightest member
     of the pool instead of accepting it, and only far enough to clear the
     floor — a deliberately shaded screen is still available above it. */
  /* Lift toward the most SATURATED bright member, not simply the brightest.
     The brightest is almost always `paper`, so lifting toward it turned a dark
     field into grey — trading a dead screen for a washed one. Chroma is what
     the reference showcases are made of; a lifted field has to keep it. */
  var chroma = function (c) {
    var H = hex(c); if (!H) return 0;
    var r = parseInt(H.substr(0, 2), 16), g = parseInt(H.substr(2, 2), 16), b = parseInt(H.substr(4, 2), 16);
    return (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
  };
  var FLOOR = .085;
  if (lum(base) < FLOOR) {
    var bright = null, bs = -1, sc;
    for (i = 0; i < pool.length; i++) {
      if (lum(pool[i]) <= lum(base)) continue;
      sc = chroma(pool[i]) * 2 + Math.min(lum(pool[i]), .5);   /* colour first, brightness second */
      if (sc > bs) { bs = sc; bright = pool[i]; }
    }
    if (bright) {
      /* the smallest mix that clears the floor, so the field keeps its hue */
      for (var t = .2; t <= 1.0001; t += .2) {
        var lifted = mixc(base, bright, t);
        if (lum(lifted) >= FLOOR) { base = lifted; break; }
      }
    }
  }

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
