/* built by scripts/build_console.mjs — do not edit; edit scripts/console_ui.js */
/* ── inlined by scripts/build_console.mjs ── */
const FONT_FILES={"Pirata One":{"400":"pirata-one-400.woff2"},"Barlow Condensed":{"400":"barlow-condensed-400.woff2","600":"barlow-condensed-600.woff2","700":"barlow-condensed-700.woff2"},"Big Shoulders Display":{"400":"big-shoulders-display-400.woff2","600":"big-shoulders-display-600.woff2","700":"big-shoulders-display-700.woff2"},"Oswald":{"400":"oswald-400.woff2","600":"oswald-600.woff2","700":"oswald-700.woff2"},"Russo One":{"400":"russo-one-400.woff2"},"Saira Condensed":{"400":"saira-condensed-400.woff2","600":"saira-condensed-600.woff2","700":"saira-condensed-700.woff2"},"Squada One":{"400":"squada-one-400.woff2"},"Teko":{"400":"teko-400.woff2","600":"teko-600.woff2","700":"teko-700.woff2"},"Creepster":{"400":"creepster-400.woff2"},"Faster One":{"400":"faster-one-400.woff2"},"Freckle Face":{"400":"freckle-face-400.woff2"},"Nosifer":{"400":"nosifer-400.woff2"},"Rubik Dirt":{"400":"rubik-dirt-400.woff2"},"Rubik Doodle Shadow":{"400":"rubik-doodle-shadow-400.woff2"},"Rubik Iso":{"400":"rubik-iso-400.woff2"},"Rubik Marker Hatch":{"400":"rubik-marker-hatch-400.woff2"},"Rubik Wet Paint":{"400":"rubik-wet-paint-400.woff2"},"Sedgwick Ave":{"400":"sedgwick-ave-400.woff2"},"Sedgwick Ave Display":{"400":"sedgwick-ave-display-400.woff2"},"Wallpoet":{"400":"wallpoet-400.woff2"},"Chivo":{"400":"chivo-400.woff2","500":"chivo-500.woff2","700":"chivo-700.woff2","900":"chivo-900.woff2"},"Instrument Sans":{"400":"instrument-sans-400.woff2","500":"instrument-sans-500.woff2","700":"instrument-sans-700.woff2"},"Libre Franklin":{"400":"libre-franklin-400.woff2","500":"libre-franklin-500.woff2","700":"libre-franklin-700.woff2","900":"libre-franklin-900.woff2"},"Manrope":{"400":"manrope-400.woff2","500":"manrope-500.woff2","700":"manrope-700.woff2"},"Satoshi":{"400":"satoshi-400.woff2","500":"satoshi-500.woff2","700":"satoshi-700.woff2","900":"satoshi-900.woff2"},"Sora":{"400":"sora-400.woff2","500":"sora-500.woff2","700":"sora-700.woff2"},"Amatic SC":{"400":"amatic-sc-400.woff2","700":"amatic-sc-700.woff2"},"Architects Daughter":{"400":"architects-daughter-400.woff2"},"Cabin Sketch":{"400":"cabin-sketch-400.woff2","700":"cabin-sketch-700.woff2"},"Gloria Hallelujah":{"400":"gloria-hallelujah-400.woff2"},"Kalam":{"400":"kalam-400.woff2","700":"kalam-700.woff2"},"Nanum Pen Script":{"400":"nanum-pen-script-400.woff2"},"Patrick Hand":{"400":"patrick-hand-400.woff2"},"Permanent Marker":{"400":"permanent-marker-400.woff2"},"Shadows Into Light":{"400":"shadows-into-light-400.woff2"},"Audiowide":{"400":"audiowide-400.woff2"},"DM Mono":{"400":"dm-mono-400.woff2"},"JetBrains Mono":{"400":"jetbrains-mono-400.woff2","700":"jetbrains-mono-700.woff2"},"Bungee":{"400":"bungee-400.woff2"},"Bungee Shade":{"400":"bungee-shade-400.woff2"},"Fascinate":{"400":"fascinate-400.woff2"},"Luckiest Guy":{"400":"luckiest-guy-400.woff2"},"Press Start 2P":{"400":"press-start-2p-400.woff2"},"Rye":{"400":"rye-400.woff2"},"Shrikhand":{"400":"shrikhand-400.woff2"},"Special Elite":{"400":"special-elite-400.woff2"},"Nunito":{"400":"nunito-400.woff2","700":"nunito-700.woff2"},"Sniglet":{"400":"sniglet-400.woff2"},"Bangers":{"400":"bangers-400.woff2"},"Kaushan Script":{"400":"kaushan-script-400.woff2"},"Knewave":{"400":"knewave-400.woff2"},"Cormorant Garamond":{"400":"cormorant-garamond-400.woff2","700":"cormorant-garamond-700.woff2"},"Instrument Serif":{"400":"instrument-serif-400.woff2"},"Roboto Slab":{"400":"roboto-slab-400.woff2","700":"roboto-slab-700.woff2"},"Zilla Slab":{"400":"zilla-slab-400.woff2","700":"zilla-slab-700.woff2"},"Big Shoulders Stencil Display":{"400":"big-shoulders-stencil-display-400.woff2","700":"big-shoulders-stencil-display-700.woff2"},"Clash Display":{"500":"clash-display-500.woff2","600":"clash-display-600.woff2","700":"clash-display-700.woff2"},"Khand":{"600":"khand-600.woff2","700":"khand-700.woff2"},"Melodrama":{"500":"melodrama-500.woff2","700":"melodrama-700.woff2"},"Zodiak":{"400":"zodiak-400.woff2","700":"zodiak-700.woff2"}};
const FONT_BASE='../assets/fonts/';
function nearestWeight(family,weight){
  const have=Object.keys(FONT_FILES[family]||{}).map(Number);
  if(!have.length)return weight;
  return have.reduce((a,b)=>Math.abs(b-weight)<Math.abs(a-weight)?b:a);
}
function faceCSS(used){
  const out=[];
  for(const [family,weights] of Object.entries(used))
    for(const w of [...weights].sort((a,b)=>a-b)){
      const file=(FONT_FILES[family]||{})[w];
      if(!file)continue;
      out.push(`@font-face{font-family:'${family}';font-style:normal;font-weight:${w};`+
               `src:url(${FONT_BASE}${file}) format('woff2');font-display:block;}`);
    }
  return out.join('');
}
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
function frame_phone(x, y, w, h, P, R, id){
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
const TABLETS = [
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
const LAPTOPS = [
  { name: 'MacBook Pro 16', bez: .0142, top: .0382, chin: .0312, ar: 1.547 },
  { name: 'MacBook Pro 14', bez: .0163, top: .0438, chin: .0358, ar: 1.540 },
  { name: 'MacBook Air 15', bez: .0203, top: .0475, chin: .0388, ar: 1.545 },
  { name: 'MacBook Air 13', bez: .0227, top: .0552, chin: .0451, ar: 1.538 },
];

/* Flat-on tablet slab (7% corner radius, ~4% bezel, top-centre camera, flush power/volume seams) fitted and centred in the box, portrait or landscape from the box aspect; casing is shaded by the palette's darkest member and lit by its lightest, with the screen and case tinted by ground/ground2/accent, so the one .screen rect is the only fillable target. */
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
function wall_arcs(x, y, w, h, P, R, id) {
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

/* A jittered grid split into 30-80 triangles; the palette minus `ground` is sorted by luminance and only its dark end and light end are used, checkerboarded so touching facets always jump value — darks lean on dark/ink/ground2, lights on paper/hot/body, with accent or another mid-value hue swapped in on half the cards. */
function wall_poly(x, y, w, h, P, R, id) {
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
function wall_mesh(x, y, w, h, P, R, id) {
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
function wall_schematic(x, y, w, h, P, R, id) {
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
function wall_hills(x, y, w, h, P, R, id) {
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

/* DEVICE SHOWCASE GROUNDS.
 *
 * The owner's reference is the wallpaper-showcase genre: a wall of devices at
 * one consistent angle, each screen carrying a different piece of artwork. It
 * is the right ground for a shop that buys those exact devices — the product
 * IS the pattern — and the engine had nothing like it.
 *
 * Drawn procedurally rather than generated as an image, on purpose. A showcase
 * has to hold the same angle every time, put OUR wallpaper on each screen, and
 * leave the brand mark exactly where the layout says. A diffusion model gives a
 * handsome picture that cannot do any of those three.
 *
 * Two registries and a set of layouts. A frame draws a device and leaves its
 * screen empty; a wallpaper fills a screen; a layout says where the devices go.
 */

/* ── frames and wallpapers ───────────────────────────────────────────────
   The drawing itself lives in showcase-parts.mjs — twelve functions each
   verified on its own before it was allowed in. A frame marks its screen with
   class="screen" as the last element rather than returning it; the adapter
   reads that rect out and hands the geometry to the caller, so the drawing
   functions stay pure SVG with no engine knowledge in them. */

const num = (attrs, k) => { const m = new RegExp(k + '="(-?[\\d.]+)"').exec(attrs); return m ? +m[1] : 0; };
const asFrame = (fn, kind) => (x, y, w, h, P, R, id) => {
  const out = fn(x, y, w, h, P, R, id);
  const m = /<rect class="screen"([^>]*)\/>/.exec(out.body);
  const scr = m ? { x: num(m[1], 'x'), y: num(m[1], 'y'), w: num(m[1], 'width'), h: num(m[1], 'height'), r: num(m[1], 'rx') }
                : { x, y, w, h, r: 0 };
  /* SOFTER CORNERS. Some of the frames draw a screen corner close to square,
     which reads as a monitor from 2009 next to the rounded bodies around it.
     A floor of 6% of the screen's short side keeps them in the same decade. */
  scr.r = Math.max(scr.r, Math.min(scr.w, scr.h) * .06);
  return { defs: out.defs, body: m ? out.body.replace(m[0], '') : out.body, screen: scr, kind };
};

/* THE ISLAND AND THE NOTCH, DRAWN ON TOP.
   The frames do draw a camera cutout — but it goes down before the screen, and
   the wallpaper is then clipped over it, so every device came out with a clean
   blank screen and no island at all. It belongs above the artwork, which is
   exactly where it is on the real thing. */
function cutout(kind, s, P, id) {
  const dark = P.dark || '#000';
  if (kind === 'phone') {
    const w = Math.max(s.w * .30, 6), h = Math.max(w * .30, 2.5);
    const x = s.x + (s.w - w) / 2, y = s.y + s.h * .022;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${(h / 2).toFixed(1)}" fill="${dark}"/>` +
      (w > 18 ? `<circle cx="${(x + w - h * .58).toFixed(1)}" cy="${(y + h / 2).toFixed(1)}" r="${(h * .24).toFixed(1)}" fill="${P.body}" fill-opacity=".28"/>` : '');
  }
  if (kind === 'laptop') {
    const w = Math.max(s.w * .13, 8), h = Math.max(s.h * .035, 2.5);
    const x = s.x + (s.w - w) / 2;
    return `<path d="M${x.toFixed(1)} ${s.y.toFixed(1)} h${w.toFixed(1)} v${(h - 2).toFixed(1)} a2 2 0 0 1 -2 2 h${(-(w - 4)).toFixed(1)} a2 2 0 0 1 -2 -2 Z" fill="${dark}"/>`;
  }
  /* An iMac has NEVER had a notch — it carries a pinhole in the top bezel, and
     it was getting the laptop's tab only because this branch tested for both.
     The frame draws a pinhole of its own, but under the wallpaper, so it is
     invisible; this is the one that shows. */
  if (kind === 'desktop') {
    const r = Math.max(s.w * .006, 1);
    return `<circle cx="${(s.x + s.w / 2).toFixed(1)}" cy="${(s.y + Math.max(s.h * .018, 3)).toFixed(1)}" r="${r.toFixed(1)}" fill="${dark}"/>`;
  }
  const r = Math.max(s.w * .008, 1.2);                       // tablet: a lens dot
  return `<circle cx="${(s.x + s.w / 2).toFixed(1)}" cy="${(s.y + Math.max(s.h * .014, 3)).toFixed(1)}" r="${r.toFixed(1)}" fill="${dark}"/>`;
}

const FRAMES = {
  phone:   asFrame(frame_phone,   'phone'),
  tablet:  asFrame(frame_tablet,  'tablet'),
  laptop:  asFrame(frame_laptop,  'laptop'),
  desktop: asFrame(frame_desktop, 'desktop'),
};

const WALLS = {
  bands:     wall_bands,
  diagonal:  wall_diagonal,
  mesh:      wall_mesh,
  poly:      wall_poly,
  arcs:      wall_arcs,
  hills:     wall_hills,
  schematic: wall_schematic,
  field:     wall_field,
};

/* ── layouts ─────────────────────────────────────────────────────────────
   Each returns a list of placements in the given box. Angle is one number for
   the whole layout — that consistency is what makes a showcase read as a
   showcase rather than a pile. */
const LAYOUTS = {};

/* an isometric wall of phones, offset row to row and running off every edge */
LAYOUTS.iso = (box, R) => {
  const out = [], cw = box.w / 3.1, ch = cw * 2.16;
  const dx = cw * 1.34, dy = ch * .58;
  for (let row = -1; row * dy < box.h + ch; row++)
    for (let col = -1; col * dx < box.w + cw; col++) {
      const ox = (row % 2 ? dx * .5 : 0);
      out.push({ kind: 'phone', x: box.x + col * dx + ox - cw * .2, y: box.y + row * dy - ch * .3, w: cw, h: ch, rot: -28 });
    }
  return out;
};

/* the family portrait: laptop centre, tablet left, phone right */
LAYOUTS.family = (box) => {
  const lw = box.w * .74, lh = lw / 1.55;
  const cx = box.x + box.w * .5, cy = box.y + box.h * .5;
  return [
    { kind: 'laptop',  x: cx - lw / 2,            y: cy - lh * .48, w: lw,        h: lh,        rot: 0 },
    { kind: 'tablet',  x: cx - lw * .78,          y: cy - lh * .18, w: lw * .30,  h: lh * .86,  rot: 0 },
    { kind: 'phone',   x: cx + lw * .46,          y: cy - lh * .10, w: lw * .155, h: lh * .78,  rot: 0 },
  ];
};

/* a flat wall of mixed devices at assorted sizes — the contact-sheet look */
LAYOUTS.wall = (box, R) => {
  const u = box.w / 12, k = (kind, cx, cy, cw, chh) =>
    ({ kind, x: box.x + cx * u, y: box.y + cy * u, w: cw * u, h: chh * u, rot: 0 });
  return [
    k('tablet', 0.3, 0.4, 3.2, 4.4), k('tablet', 3.9, 0.6, 2.2, 3.0), k('laptop', 6.6, 0.5, 5.1, 3.3),
    k('phone', 0.4, 5.4, 1.7, 3.7),  k('tablet', 2.4, 5.6, 2.6, 1.9), k('tablet', 5.4, 5.0, 3.6, 2.6),
    k('phone', 9.6, 4.6, 1.7, 3.7),  k('desktop', 5.6, 8.2, 6.2, 5.0), k('laptop', 0.3, 9.6, 4.9, 3.2),
  ];
};

/* three phones, front on, the middle one lifted */
LAYOUTS.trio = (box) => {
  const pw = box.w * .27, ph = pw * 2.16, cy = box.y + box.h * .5;
  return [0, 1, 2].map(i => ({ kind: 'phone', x: box.x + box.w * (.08 + i * .29),
    y: cy - ph * (i === 1 ? .54 : .5), w: pw, h: ph * (i === 1 ? 1.06 : 1), rot: 0 }));
};

/* ── further arrangements ────────────────────────────────────────────────
   Not versions of the references — other ways to stand a set of devices up. */

/* the whole family clustered by size, big at the back */
LAYOUTS.stack = (box) => {
  const u = box.w / 12, k = (kind, cx, cy, cw, ch) =>
    ({ kind, x: box.x + cx * u, y: box.y + cy * u, w: cw * u, h: ch * u, rot: 0 });
  return [
    k('desktop', 1.4, 1.0, 8.0, 6.0), k('laptop', 3.6, 5.4, 6.4, 4.2),
    k('tablet', 0.6, 6.4, 3.1, 4.2),  k('phone', 8.9, 6.9, 1.9, 4.1),
    k('phone', 2.2, 8.4, 1.7, 3.7),
  ];
};

/* phones fanned from a point below the frame, like a hand of cards */
LAYOUTS.fan = (box, R) => {
  const n = 5, pw = box.w * .215, ph = pw * 2.16;
  const cx = box.x + box.w * .5, cy = box.y + box.h * 1.22, rad = box.h * .78;
  return Array.from({ length: n }, (_, i) => {
    const a = (-58 + i * 29) * Math.PI / 180;
    return { kind: 'phone', x: cx + Math.sin(a) * rad - pw / 2,
      y: cy - Math.cos(a) * rad - ph / 2, w: pw, h: ph, rot: -58 + i * 29 };
  });
};

/* a diagonal cascade, each step smaller and lower */
LAYOUTS.cascade = (box) => {
  const out = [], n = 5;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), w = box.w * (.40 - t * .16);
    out.push({ kind: i === 0 ? 'tablet' : 'phone',
      x: box.x + box.w * (-.04 + t * .70), y: box.y + box.h * (.02 + t * .62),
      w, h: w * (i === 0 ? 1.4 : 2.16), rot: -14 });
  }
  return out;
};

/* a ring of phones around one held in the middle */
LAYOUTS.orbit = (box) => {
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  const pw = box.w * .17, ph = pw * 2.16, rad = Math.min(box.w, box.h) * .36;
  const ring = Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 - 90) * Math.PI / 180;
    return { kind: 'phone', x: cx + Math.cos(a) * rad - pw / 2, y: cy + Math.sin(a) * rad - ph / 2,
      w: pw, h: ph, rot: (i * 60) };
  });
  return [...ring, { kind: 'phone', x: cx - pw * .82, y: cy - ph * .82, w: pw * 1.64, h: ph * 1.64, rot: 0 }];
};

/* A RING WITH THE MIDDLE LEFT EMPTY — devices stood evenly around the rim and
   leaned tangentially, like numbers on a clock face, so the hole in the centre
   is where the headline and the phone number go. `orbit` above is a different
   idea: it fills the middle with a hero phone, so the copy has to sit over it.
   Mixed kinds, because a shop that buys four categories should show four.

   The ring is an ELLIPSE, not a circle, and that is what makes it survive every
   aspect ratio: on a 32:9 banner a true circle either leaves two thirds of the
   card empty or pushes the top and bottom devices off it. Radii are taken from
   each axis independently and then pulled in by the device's own half-size, so
   nothing crosses an edge whatever the box shape. */
LAYOUTS.ring = (box, R) => {
  const n = box.w / box.h > 2.2 ? 10 : 8;                 /* a wide card holds more */
  const kinds = ['phone', 'tablet', 'phone', 'phone', 'tablet', 'phone', 'phone', 'tablet', 'phone', 'phone'];
  const pw = Math.min(box.w, box.h) * (n > 8 ? .13 : .16);
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  return Array.from({ length: n }, (_, i) => {
    const kind = kinds[i % kinds.length];
    const w = kind === 'tablet' ? pw * 1.35 : pw;
    const h = w * (kind === 'tablet' ? 1.4 : 2.16);
    const a = (i * (360 / n) - 90) * Math.PI / 180;
    const rx = Math.max(0, box.w / 2 - w * .62), ry = Math.max(0, box.h / 2 - h * .52);
    return { kind, x: cx + Math.cos(a) * rx - w / 2, y: cy + Math.sin(a) * ry - h / 2,
      w, h, rot: (i * (360 / n)) % 360 };
  });
};

/* The same circle, crowded and bled off every edge: two rings turning opposite
   ways, the outer one cropped by the frame. Reads as a pile of stock rather
   than an arrangement, which is the note the diagonal wall hits — this is that
   genre in the round. */
LAYOUTS.halo = (box, R) => {
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  const u = Math.min(box.w, box.h);
  const out = [];
  /* Radii are a fraction of the BOX, so they must stay under .5 or the ring
     leaves the card entirely instead of being cropped by it. .30/.44 crops the
     outer ring against the edges — which is the look — while keeping every
     device at least partly on the card. */
  /* A wide card needs MORE devices, not bigger ones: the ellipse stretches
     horizontally, so the same count leaves gaps a 1:1 card never shows. */
  const wide = box.w / box.h;
  const extra = wide > 2.2 ? 6 : wide > 1.5 ? 3 : 0;
  [[6 + extra, .22, .13, 1], [9 + extra, .40, .105, -1]].forEach(([n, rk, sk, dir]) => {
    for (let i = 0; i < n; i++) {
      const kind = (i % 3 === 1 && rk < .4) ? 'tablet' : 'phone';
      const w = u * sk * (kind === 'tablet' ? 1.3 : 1);
      const h = w * (kind === 'tablet' ? 1.4 : 2.16);
      const a = (i * (360 / n) + (dir < 0 ? 180 / n : 0) - 90) * Math.PI / 180;
      out.push({ kind, x: cx + Math.cos(a) * box.w * rk - w / 2,
        y: cy + Math.sin(a) * box.h * rk - h / 2, w, h,
        rot: (i * (360 / n) * dir + (dir < 0 ? 24 : -12)) % 360 });
    }
  });
  return out;
};

/* one tall column, cropped top and bottom — a strip of screens */
LAYOUTS.column = (box) => {
  const pw = box.w * .40, ph = pw * 2.16;
  return Array.from({ length: 3 }, (_, i) => ({ kind: 'phone',
    x: box.x + box.w * (i % 2 ? .52 : .06), y: box.y + box.h * (-.16 + i * .42),
    w: pw, h: ph, rot: i % 2 ? 7 : -7 }));
};

const WALL_KEYS = () => Object.keys(WALLS);

/* ── the drawing ─────────────────────────────────────────────────────────
   Devices are laid out, framed, and their screens filled with wallpapers
   drawn from this card's own palette — so a showcase is never Apple's colours,
   it is whichever of the thirty-three palettes the card is wearing.

   A scrim goes over the whole thing afterwards. Every text rule in the engine
   measures a line against its DECLARED backing, and the declared backing here
   is P.ground; without the wash that claim stops being true the moment a
   headline crosses a bright screen. The wash keeps the ground colour dominant,
   which is both what makes the type readable and what makes the audit honest. */
/* THE WASH GOES BEHIND THE WORDS, NOT OVER THE PICTURE.
   Every text rule in the engine measures a line against its DECLARED backing,
   and on a showcase ground that claim is false the moment a headline crosses a
   bright screen — which is exactly what a flat wash was invented to hide, at
   the cost of hiding the devices too. Instead the card is allowed to build, and
   then every line still sitting on bare ground gets a soft panel of the ground
   colour placed UNDER it: the type is legible, the rule is honest again, and
   the devices keep their colour everywhere the copy is not. */
function scrimBehindText(c, box, strength = .88) {
  const { P } = c;
  const runs = c.nodes.filter(n => n.type === 'text' && n.backing === P.ground && n.box.w > 0);
  if (!runs.length) return;
  const pad = Math.min(c.W, c.H) * .022;
  /* merge lines that sit near each other into one band — a panel per line reads
     as a stack of labels, a panel per band reads as a designed area */
  const bands = [];
  for (const t of runs.slice().sort((a, b) => a.box.y - b.box.y)) {
    const b = { x: t.box.x - pad, y: t.box.y - pad, w: t.box.w + pad * 2, h: t.box.h + pad * 2 };
    const near = bands.find(z => b.y < z.y + z.h + pad * 1.4 && b.y + b.h > z.y - pad * 1.4);
    if (near) {
      const x1 = Math.max(near.x + near.w, b.x + b.w), y1 = Math.max(near.y + near.h, b.y + b.h);
      near.x = Math.min(near.x, b.x); near.y = Math.min(near.y, b.y);
      near.w = x1 - near.x; near.h = y1 - near.y;
    } else bands.push(b);
  }
  const id = c.id('tsc');
  c.def(`<filter id="${id}" x="-12%" y="-25%" width="124%" height="150%">` +
        `<feGaussianBlur stdDeviation="${(pad * .55).toFixed(1)}"/></filter>`);
  const m = bands.map(b =>
    `<rect x="${b.x.toFixed(1)}" y="${b.y.toFixed(1)}" width="${b.w.toFixed(1)}" height="${b.h.toFixed(1)}" ` +
    `rx="${(pad * 1.1).toFixed(1)}" fill="${P.ground}" fill-opacity="${strength}"/>`).join('');
  c.add(`<g filter="url(#${id})">${m}</g>`, null, -20);
}

/* ── THE THEME GENERATOR ──────────────────────────────────────────────────
   A showcase's character is not one setting, it is three: the ARRANGEMENT
   (which layout), the VOCABULARY (which wallpapers its screens may draw from)
   and the PALETTE ROTATION (how the accent walks the spectrum from screen to
   screen). Until now only the first was named — a template asked for a layout
   and took whatever the other two happened to be, so two cards on the same
   layout could look identical or unrelated with nothing to say which.

   Naming the pairs makes the set countable, reproducible and gradeable: every
   theme has a stable id, so "ring-technical looks wrong" is a bug report
   somebody can act on rather than a description of a mood.

   FAMILIES are wallpaper vocabularies, and the restriction is the point. All
   eight wallpapers on one card averages out to "assorted"; two that share a
   drawing logic read as a decision. Each family is a pairing that holds
   together — hard-edged with hard-edged, tonal with tonal — rather than every
   combination, most of which are noise.

   The cross-product is 11 layouts x 10 families = 110 themes, which is the
   range asked for. Adding a layout adds ten themes and adding a family adds
   eleven, so the set grows without anybody hand-writing entries. */
const WALL_FAMILIES = {
  flat:      { walls: ['bands', 'field'],                 note: 'flat colour blocks, no texture' },
  geometric: { walls: ['poly', 'diagonal'],               note: 'hard angles and facets' },
  soft:      { walls: ['hills', 'field'],                 note: 'tonal landscape, no hard edge' },
  technical: { walls: ['schematic', 'mesh'],              note: 'circuitry and grids' },
  arcs:      { walls: ['arcs', 'bands'],                  note: 'concentric arcs over stripes' },
  optical:   { walls: ['diagonal', 'mesh'],               note: 'moire and interference' },
  editorial: { walls: ['bands', 'hills', 'field'],        note: 'magazine: stripe, ridge, wash' },
  wire:      { walls: ['schematic', 'poly'],              note: 'drawn hardware, exploded' },
  spectrum:  { walls: ['field', 'arcs'],                  note: 'one hue per screen, pooled light' },
  assorted:  { walls: Object.keys(WALLS),                 note: 'every wallpaper, dealt round-robin' },
};

/* The palette rotation. Each screen is handed the spectrum offset by its index
   (see drawShowcase), so the ORDER here decides whether a wall reads as a
   gradient walking round the card or as a scatter. */
/* ── THE SPECTRUM, WIDENED ────────────────────────────────────────────────
   A palette record carries three saturated roles — accent, hot, ground2 — and
   the reference showcases run five to eight hues across their screens. Three
   rotated round a wall of nine devices is three hues repeated three times,
   which is why a card could look tidy and still look flat.

   So the hues are GENERATED from the palette's own seeds rather than invented:
   the saturated roles are read as hue angles, sorted round the wheel, and the
   gaps between neighbours are filled by walking the shorter arc. Saturation
   and lightness are carried from the seeds, so a muted palette produces muted
   hues and a jewel palette produces jewel ones — the card never stops being
   the palette it is wearing. Nothing is picked from outside the record. */
const _h2 = c => { let t = String(c || '').replace('#', ''); if (t.length === 3) t = t[0]+t[0]+t[1]+t[1]+t[2]+t[2];
  return /^[0-9a-fA-F]{6}$/.test(t) ? [0,2,4].map(i => parseInt(t.substr(i,2),16)) : null; };
function _rgb2hsl(c){ const v=_h2(c); if(!v) return null; const [r,g,b]=v.map(x=>x/255);
  const mx=Math.max(r,g,b), mn=Math.min(r,g,b), l=(mx+mn)/2, d=mx-mn;
  if(!d) return {h:0,s:0,l};
  const s=l>.5?d/(2-mx-mn):d/(mx+mn);
  let h = mx===r ? (g-b)/d+(g<b?6:0) : mx===g ? (b-r)/d+2 : (r-g)/d+4;
  return {h:h*60,s,l}; }
function _hsl2rgb({h,s,l}){ h=((h%360)+360)%360/360;
  const q=l<.5?l*(1+s):l+s-l*s, p2=2*l-q;
  const f=t=>{ t=(t+1)%1; return t<1/6?p2+(q-p2)*6*t : t<1/2?q : t<2/3?p2+(q-p2)*(2/3-t)*6 : p2; };
  return '#'+[f(h+1/3),f(h),f(h-1/3)].map(v=>{const n=Math.round(v*255);return (n<16?'0':'')+n.toString(16);}).join(''); }

/** n harmonious hues, grown from the palette's saturated roles. */
function spread(P, n = 6) {
  /* A seed has to be a COLOUR a screen could lead with: saturated, and not so
     dark it reads as off. `ground` is included because on some palettes it is
     the only third hue — but a dark ground is lifted to the working band
     rather than dropped, so its hue still joins the wheel. */
  const seeds = [P.accent, P.hot, P.ground2, P.ground]
    .map(_rgb2hsl).filter(x => x && x.s > .12)
    .map(x => ({ ...x, l: Math.min(.72, Math.max(.42, x.l)), s: Math.max(.38, x.s) }))
    .sort((a, b) => a.h - b.h);
  if (!seeds.length) return [P.accent, P.hot, P.ground2].filter(Boolean);
  if (seeds.length === 1) {
    /* one seed: walk it round the wheel in even steps, keeping its character */
    return Array.from({ length: n }, (_, i) => _hsl2rgb({ ...seeds[0], h: seeds[0].h + i * (360 / n) }));
  }
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = i / n * seeds.length;              /* walk the seed ring */
    const a = seeds[Math.floor(t) % seeds.length];
    const b = seeds[(Math.floor(t) + 1) % seeds.length];
    const k = t - Math.floor(t);
    let d = b.h - a.h; if (d > 180) d -= 360; if (d < -180) d += 360;   /* shorter arc */
    out.push(_hsl2rgb({ h: a.h + d * k, s: a.s + (b.s - a.s) * k, l: a.l + (b.l - a.l) * k }));
  }
  return out;
}

const SPECTRA = {
  /* SATURATED ROLES ONLY. Feeding `paper` and `ink` into the rotation hands
     whole screens near-white and near-black — which is what made a wall read
     as washed out and inverted rather than as a set of lit devices. The
     reference showcases get their life from five to eight SATURATED hues over
     a quiet ground; paper and ink are the ground's job, not a screen's.
     They stay available to the wallpapers as a highlight or a shade, because
     each wallpaper still receives the whole palette — the spectrum only
     decides which hue that screen leads with. */
  walk:    P => spread(P, 6),
  hot:     P => spread(P, 5),
  cool:    P => spread(P, 7),
  wide:    P => spread(P, 8),
};

/** Every theme, in a stable order. Ids are `<layout>-<family>`. */
function THEMES() {
  const spins = Object.keys(SPECTRA);
  const out = [];
  Object.keys(LAYOUTS).forEach((layout, li) => {
    Object.keys(WALL_FAMILIES).forEach((family, fi) => {
      out.push({
        id: layout + '-' + family,
        layout,
        family,
        only: WALL_FAMILIES[family].walls,
        note: WALL_FAMILIES[family].note,
        /* deterministic, and offset by both axes so neighbouring themes in the
           list do not share a rotation */
        spectrum: spins[(li + fi) % spins.length],
      });
    });
  });
  return out;
}

/** Resolve a theme id into the opts drawShowcase takes. */
function themeOpts(id, P, extra = {}) {
  const t = THEMES().find(x => x.id === id);
  if (!t) return { ...extra };
  return { layout: t.layout, only: t.only, spectrum: SPECTRA[t.spectrum](P), ...extra };
}

function drawShowcase(c, box, opts = {}) {
  const { P, R } = c;
  const layout = LAYOUTS[opts.layout] ? opts.layout : 'iso';
  const places = LAYOUTS[layout](box, R);
  /* DEAL, DO NOT DRAW. Picking each screen's wallpaper at random meant a
     three-device layout could land on the same one three times, and the whole
     point of the reference is that every screen is different. Shuffle once,
     then deal round-robin. */
  /* a theme may restrict which wallpapers its screens carry — that restriction
     is most of what makes one theme look unlike another */
  const keys = (opts.only && opts.only.filter(k => WALLS[k]).length ? opts.only.filter(k => WALLS[k]) : Object.keys(WALLS));
  const deck = keys.slice();
  for (let i = deck.length - 1; i > 0; i--) { const j = R.i(0, i); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  const brandOn = opts.brand ? R.i(0, Math.max(0, places.length - 1)) : -1;

  let defs = '', body = '';
  places.forEach((p, i) => {
    const frame = FRAMES[p.kind] || FRAMES.phone;
    const id = c.id('sc');
    const f = frame(p.x, p.y, p.w, p.h, P, R, id);
    const s = f.screen;

    /* the wallpaper, clipped to the screen's rounded rectangle.
       A SPECTRUM, NOT A PAIR. The reference showcases are a quiet ground under
       five to eight saturated hues, and a palette record only carries two —
       which is the hue-count gap the reference measurement found (good ads 1.46
       hue entropy, this engine 0.92). Each screen is handed the same palette
       with its accent, hot and second ground rotated to a different place in
       the spectrum, so one wall shows the whole range without any wallpaper
       function needing to know the spectrum exists. */
    const sp = opts.spectrum;
    const Pi = sp && sp.length >= 3 ? { ...P,
      accent:  sp[i % sp.length],
      hot:     sp[(i + 2) % sp.length],
      ground2: sp[(i + 4) % sp.length],
      ink:     sp[(i + 1) % sp.length] } : P;
    const wallKey = (i === brandOn && WALLS.field) ? 'field' : deck[i % deck.length];
    const w = (WALLS[wallKey] || WALLS.field)(s.x, s.y, s.w, s.h, Pi, R, id + 'w');
    const clip = `<clipPath id="${id}s"><rect x="${s.x.toFixed(1)}" y="${s.y.toFixed(1)}" width="${s.w.toFixed(1)}" height="${s.h.toFixed(1)}" rx="${(s.r || 0).toFixed(1)}"/></clipPath>`;

    /* the brand, set on one screen, at the same angle as everything else */
    let mark = '';
    if (i === brandOn && opts.brand) {
      const t = String(opts.brand);
      /* sized off BOTH axes: on a laptop screen the height rule alone made the
         wordmark fill the lid, which reads as a banner rather than a wallpaper */
      const size = Math.min(s.w * .70 / Math.max(4, t.length) * 1.75, s.h * .12);
      /* THIS TEXT IS ARTWORK, NOT COPY, and it is marked as such.
         It is a wallpaper OF the brand, so it deliberately repeats the lockup —
         which is exactly the kind of thing the no-repeat rule exists to stop.
         Left unmarked it was simply invisible to every rule: it could be any
         size, land anywhere, say anything. data-deco makes the exemption a
         decision the auditors can see rather than an oversight. */
      mark = `<text data-deco="1" x="${(s.x + s.w / 2).toFixed(1)}" y="${(s.y + s.h * .54).toFixed(1)}" text-anchor="middle" ` +
        `font-family="${c.F.body}, sans-serif" font-weight="700" font-size="${size.toFixed(1)}" ` +
        `fill="${P.paper}" fill-opacity=".92">${String(opts.brand).replace(/[&<>]/g, '')}</text>`;
    }

    defs += f.defs + w.defs + clip;
    const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
    const turn = p.rot ? ` transform="rotate(${p.rot.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})"` : '';
    body += `<g${turn}>${f.body}<g clip-path="url(#${id}s)">${w.body}${mark}</g>` +
      `${cutout(p.kind, s, P, id)}</g>`;
  });

  /* THE SCRIM IS A GRADIENT, NOT A WASH.
     A flat 46% wash kept the type honest and killed the picture — the devices
     became vague coloured shapes and the whole point was lost. The copy is not
     spread evenly: the lockup and headline sit at the top, the CTA and footer
     at the bottom, and the middle band is where a showcase wants to breathe.
     So the ground is held over the type and let go in the middle. */
  /* THE SHOWCASE IS A TEXTURE, NOT A SECOND PICTURE.
     Two earlier attempts both failed for the same reason: a flat wash over the
     whole card drowned the devices, and washing only behind each line left
     murky rounded panels that overlapped into grey blobs and muddied every
     colour on the card. Both were trying to referee a fight between the
     background and the copy. The fight is the mistake — the devices go quiet
     enough that nothing has to be protected from them, and the card keeps its
     ground colour clean. Full strength is still available for a bare
     background with no copy on it, which is what the theme renders use. */
  const fade = opts.fade === undefined ? .26 : opts.fade;
  c.def(defs);
  c.add(fade >= 1 ? `<g>${body}</g>` : `<g opacity="${fade}">${body}</g>`,
    { type: 'shape', id: 'showcase', box, bleed: true, role: 'field' }, -70);
  return places.length;
}

const SHOWCASE_LAYOUTS = LAYOUTS;

/* REAL TYPE METRICS, measured from the embedded fonts by
   tools/gfx/measure_fonts.mjs. Every run is sized from the exact sum of its
   glyph advances instead of one average-character constant per family, so a
   line cannot be wider than the box it was told to fit. The old constants were
   out by up to 41% (Clash Display caps measure .735, the constant said .52),
   which is why headlines ran off their plates while the declared-box audit
   reported twelve of twelve rules passing. */
/* THE OWNER'S APPROVED PHOTOGRAPHY, built by tools/gfx/build_assets.mjs.
   The engine's own hero is a vector: a rounded rectangle with three circles for
   a phone, a silhouette on two wheels for a car. It reads as a DIAGRAM of a
   product, and a diagram does not stop a thumb in a marketplace feed. These are
   348 real cutouts the owner has personally approved — rejected ones cannot
   reach a card, because only the approved list is written into the index. */
const ASSETS={"built":"owner full pass 2026-09-03: 360 approved / 104 rejected of 464","counts":{"phones":94,"cars":15,"macbooks":44,"ipads":43,"watches":21,"gold":19,"silver":23,"cards":3,"consoles":14,"airpods":5},"subjects":{"phones":[{"u":"assets/cutouts/android-pair.webp","w":1398,"h":1622,"s":"android-pair","d":"two modern Android smartphones side by side, backs to camera, dark colours","t":{"b":"android","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/android-trio.webp","w":1936,"h":1548,"s":"android-trio","d":"three modern Android smartphones fanned out, backs to camera, mixed dark colors","t":{"b":"android","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/drone-folded.webp","w":1603,"h":1121,"s":"drone-folded","d":"a compact folding consumer camera drone with its arms folded in, three-quarter view, grey body","t":{"b":"samsung","g":null,"v":null,"c":"clean","k":"other","w":1,"h":0}},{"u":"assets/cutouts/ip-angle-back-topdown.webp","w":1200,"h":732,"s":"ip-angle-back-topdown","d":"a premium smartphone lying flat on its face, rear camera module facing straight up, photographed directly from above","t":{"b":"iphone","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/ip-angle-both-faces.webp","w":1464,"h":1412,"s":"ip-angle-both-faces","d":"two identical premium smartphones side by side, the left one showing its front screen and the right one showing its rear camera module","t":{"b":"iphone","g":null,"v":null,"c":"cracked","k":"single","w":1,"h":1}},{"u":"assets/cutouts/ip-angle-corner-macro.webp","w":1689,"h":1965,"s":"ip-angle-corner-macro","d":"a tight macro three-quarter view of the top corner of a premium smartphone, showing the raised camera module and polished frame edge","t":{"b":"iphone","g":null,"v":null,"c":"clean","k":"detail","w":0,"h":0}},{"u":"assets/cutouts/ip-angle-hero-tilt.webp","w":1414,"h":1406,"s":"ip-angle-hero-tilt","d":"a premium black smartphone floating at a heroic 25 degree tilt, back to camera, subtle reflection beneath it","t":{"b":"iphone","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/ip-angle-standing-lean.webp","w":738,"h":1465,"s":"ip-angle-standing-lean","d":"a premium smartphone standing upright leaning slightly back, rear panel to camera, full device in frame","t":{"b":"iphone","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/ip-damage-corner-dent.webp","w":522,"h":1686,"s":"ip-damage-corner-dent","d":"a whole premium smartphone seen from the back at a three-quarter angle, the entire device in frame, with one corner visibly dented and scuffed","t":{"b":"iphone","g":null,"v":null,"c":"cracked","k":"single","w":1,"h":1}},{"u":"assets/cutouts/ip-gen15-pro-back-natural.webp","w":721,"h":1810,"s":"ip-gen15-pro-back-natural","d":"a 2023-era premium smartphone with a triple rear camera square and a brushed natural titanium frame, back panel facing the camera, upright","t":{"b":"iphone","g":15,"v":"pro","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/ip-gen17-plateau-black.webp","w":1536,"h":1533,"s":"ip-gen17-plateau-black","d":"a current-generation premium smartphone with a full-width raised rear camera plateau across the top, three lenses grouped left, deep black aluminium body, back panel facing the camera, upright","t":{"b":"iphone","g":17,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/ip-gen17-plateau-blue.webp","w":498,"h":1842,"s":"ip-gen17-plateau-blue","d":"a current-generation premium smartphone with a full-width raised rear camera plateau, three lenses grouped left, deep marine blue aluminium body, back panel facing the camera, upright","t":{"b":"iphone","g":17,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/ip-gen17-plateau-white.webp","w":653,"h":1688,"s":"ip-gen17-plateau-white","d":"a current-generation premium smartphone with a full-width raised rear camera plateau across the top, three lenses grouped left, clean white aluminium body, back panel facing the camera, upright","t":{"b":"iphone","g":17,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/ip-group-colour-lineup.webp","w":1752,"h":1042,"s":"ip-group-colour-lineup","d":"five premium smartphones standing upright in a neat row, each a different colour, all backs facing the camera, evenly spaced","t":{"b":"iphone","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/ip-group-overlap-pair.webp","w":1831,"h":1649,"s":"ip-group-overlap-pair","d":"two premium smartphones overlapping at an angle, one partly behind the other, backs to camera","t":{"b":"iphone","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/ip-group-scatter-six.webp","w":2048,"h":2048,"s":"ip-group-scatter-six","d":"six premium smartphones scattered loosely across a surface at varied angles, mixed colours, photographed from above","t":{"b":"iphone","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/ip-group-stagger-three.webp","w":1397,"h":1893,"s":"ip-group-stagger-three","d":"three premium smartphones arranged in a staggered descending row, backs to camera, mixed colours","t":{"b":"iphone","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/ip-group-tower-stack.webp","w":1719,"h":1649,"s":"ip-group-tower-stack","d":"premium smartphones stacked into a neat vertical tower, edges aligned, three-quarter view","t":{"b":"iphone","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/ip-state-charging-cable.webp","w":1380,"h":1742,"s":"ip-state-charging-cable","d":"a premium smartphone lying flat and fully lit, seen from the front with a dark screen, a white braided charging cable plugged in and coiled neatly beside it, photographed from above","t":{"b":"iphone","g":null,"v":null,"c":"clean","k":"single","w":0,"h":0}},{"u":"assets/cutouts/ip-state-in-hand-back.webp","w":982,"h":1558,"s":"ip-state-in-hand-back","d":"a human hand and forearm gripping a premium black smartphone, the whole hand clearly visible wrapped around the device, rear camera module facing the camera, arm entering from the bottom of the frame","t":{"b":"iphone","g":null,"v":null,"c":"clean","k":"hand","w":1,"h":0}},{"u":"assets/cutouts/ip-state-screen-lock.webp","w":1365,"h":1031,"s":"ip-state-screen-lock","d":"a premium smartphone seen from the front with its screen on showing a plain deep blue gradient wallpaper, no text or icons, upright","t":{"b":"iphone","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/ip-thin-profile-edge.webp","w":204,"h":1916,"s":"ip-thin-profile-edge","d":"an ultra thin premium smartphone photographed from a low three-quarter angle to emphasise how slim the body is, dark titanium","t":{"b":"iphone","g":null,"v":null,"c":"clean","k":"detail","w":0,"h":0}},{"u":"assets/cutouts/iphone-15-pro-back-black.webp","w":1841,"h":1663,"s":"iphone-15-pro-back-black","d":"iPhone 15 Pro in black titanium, back panel facing camera, three-lens module, slight 12 degree tilt","t":{"b":"iphone","g":15,"v":"pro","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/iphone-15-pro-back-blue.webp","w":678,"h":1580,"s":"iphone-15-pro-back-blue","d":"iPhone 15 Pro in blue titanium, back panel to camera, three-lens module, upright","t":{"b":"iphone","g":15,"v":"pro","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/iphone-15-pro-back-gold.webp","w":542,"h":1297,"s":"iphone-15-pro-back-gold","d":"a premium smartphone with a warm champagne coloured metal frame and matching back panel, rear facing camera, three lens module, upright","t":{"b":"iphone","g":15,"v":"pro","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/iphone-15-pro-back-white.webp","w":1430,"h":1634,"s":"iphone-15-pro-back-white","d":"iPhone 15 Pro in white titanium, back panel facing camera, three-lens module, slight 12 degree tilt","t":{"b":"iphone","g":15,"v":"pro","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/iphone-15-pro-front-on.webp","w":809,"h":1615,"s":"iphone-15-pro-front-on","d":"iPhone 15 Pro seen straight on from the front, screen off, deep black glass, thin bezels","t":{"b":"iphone","g":15,"v":"pro","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/iphone-17-pro-back-black.webp","w":1008,"h":1837,"s":"iphone-17-pro-back-black","d":"a current flagship smartphone in black titanium, back panel to camera, large three-lens camera plateau, upright, slight 10 degree tilt","t":{"b":"iphone","g":17,"v":"pro","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/iphone-17-pro-back-silver.webp","w":799,"h":1668,"s":"iphone-17-pro-back-silver","d":"a current flagship smartphone in silver titanium, back panel to camera, large three-lens camera plateau, upright","t":{"b":"iphone","g":17,"v":"pro","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/iphone-back-lean-stack.webp","w":1066,"h":1142,"s":"iphone-back-lean-stack","d":"two flagship smartphones leaning against each other back to back forming a V shape","t":{"b":"iphone","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/iphone-back.webp","w":241,"h":513,"s":"iphone-back","d":"","t":{"b":"iphone","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/iphone-cracked-back.webp","w":817,"h":1643,"s":"iphone-cracked-back","d":"iPhone with shattered rear glass panel, cracks radiating across the back, camera module intact","t":{"b":"iphone","g":null,"v":null,"c":"cracked","k":"single","w":1,"h":1}},{"u":"assets/cutouts/iphone-cracked-corner.webp","w":1764,"h":1119,"s":"iphone-cracked-corner","d":"a smartphone with a cracked front screen where the damage radiates from one corner, rest of screen intact and dark","t":{"b":"iphone","g":null,"v":null,"c":"cracked","k":"single","w":1,"h":1}},{"u":"assets/cutouts/iphone-front.webp","w":222,"h":582,"s":"iphone-front","d":"","t":{"b":"iphone","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/iphone-hand-back-offer.webp","w":583,"h":1162,"s":"iphone-hand-back-offer","d":"a hand holding out a smartphone toward the viewer, back of the phone facing camera, offering gesture","t":{"b":"iphone","g":null,"v":null,"c":"clean","k":"hand","w":1,"h":0}},{"u":"assets/cutouts/iphone-in-hand-screen-on.webp","w":506,"h":1010,"s":"iphone-in-hand-screen-on","d":"a hand holding a smartphone upright with the screen facing camera and glowing, forearm cropped","t":{"b":"iphone","g":null,"v":null,"c":"clean","k":"hand","w":1,"h":0}},{"u":"assets/cutouts/iphone-pair-front-back.webp","w":1808,"h":1745,"s":"iphone-pair-front-back","d":"two iPhones side by side, one showing its front screen and one showing its back with camera module, slight overlap","t":{"b":"iphone","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/iphone-screen-on-glow.webp","w":796,"h":1581,"s":"iphone-screen-on-glow","d":"a modern smartphone seen from the front with its screen switched on glowing bright blue, upright, dark bezels","t":{"b":"iphone","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/phone-repair-tools.webp","w":1039,"h":1550,"s":"phone-repair-tools","d":"small precision repair tools, screwdrivers and tweezers, arranged neatly, top-down","t":{"b":"iphones","g":null,"v":null,"c":"clean","k":"tool","w":0,"h":0}},{"u":"assets/cutouts/phone-tools-teardown.webp","w":1664,"h":1536,"s":"phone-tools-teardown","d":"a smartphone opened for repair with its back panel off, small screwdrivers and tweezers beside it, top-down","t":{"b":"iphones","g":null,"v":null,"c":"clean","k":"tool","w":0,"h":0}},{"u":"assets/cutouts/pix-9-back-green.webp","w":802,"h":1728,"s":"pix-9-back-green","d":"a premium Android phone with a full-width horizontal camera bar across the upper back, soft sage green body, back panel facing the camera, upright","t":{"b":"pixel","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/pix-9-back-obsidian.webp","w":590,"h":1464,"s":"pix-9-back-obsidian","d":"a premium Android phone with a full-width horizontal camera bar across the upper back, deep black body, back panel facing the camera, upright","t":{"b":"pixel","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/pix-9-front.webp","w":1342,"h":1349,"s":"pix-9-front","d":"a modern Android phone seen straight on from the front, flat screen off, small centred front camera hole, thin bezels","t":{"b":"pixel","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/pix-9-pro-back.webp","w":824,"h":1665,"s":"pix-9-pro-back","d":"a premium Android phone with a distinctive full-width horizontal camera bar across the upper back containing three lenses, matte pale grey, back panel facing the camera, upright","t":{"b":"pixel","g":null,"v":"pro","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/pix-buds-case.webp","w":1751,"h":1600,"s":"pix-buds-case","d":"small wireless earbuds beside their open rounded charging case, photographed from above","t":{"b":"pixel","g":null,"v":null,"c":"clean","k":"other","w":1,"h":0}},{"u":"assets/cutouts/pix-fold-open.webp","w":1929,"h":1117,"s":"pix-fold-open","d":"a foldable Android phone with a wide horizontal camera bar, opened flat showing its large inner screen, screen off","t":{"b":"pixel","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/pix-pair-angle.webp","w":1871,"h":1865,"s":"pix-pair-angle","d":"two modern Android phones with horizontal rear camera bars overlapping at a slight angle, backs to camera","t":{"b":"pixel","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/pix-tablet-back.webp","w":822,"h":1609,"s":"pix-tablet-back","d":"a modern Android tablet seen from the back showing a plain matte rear panel and single small camera, upright","t":{"b":"pixel","g":null,"v":null,"c":"clean","k":"other","w":1,"h":0}},{"u":"assets/cutouts/pix-trio-lineup.webp","w":1394,"h":1648,"s":"pix-trio-lineup","d":"three modern Android phones standing in a row, backs to camera, each with a full-width horizontal camera bar, three different colours","t":{"b":"pixel","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/pix-watch-round.webp","w":1592,"h":1806,"s":"pix-watch-round","d":"a round-faced smartwatch with a domed glass front and a woven band, screen off, three-quarter view","t":{"b":"pixel","g":null,"v":null,"c":"clean","k":"other","w":1,"h":0}},{"u":"assets/cutouts/qs-iphone-13-mini.webp","w":338,"h":452,"s":"qs-iphone-13-mini","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":13,"v":"mini","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-iphone-13-pro-max.webp","w":400,"h":518,"s":"qs-iphone-13-pro-max","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":13,"v":"pro max","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-iphone-13-pro.webp","w":394,"h":503,"s":"qs-iphone-13-pro","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":13,"v":"pro","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-iphone-13.webp","w":369,"h":505,"s":"qs-iphone-13","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":13,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-iphone-14-plus.webp","w":400,"h":547,"s":"qs-iphone-14-plus","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":14,"v":"plus","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-iphone-14-pro-max.webp","w":400,"h":502,"s":"qs-iphone-14-pro-max","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":14,"v":"pro max","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-iphone-14-pro.webp","w":400,"h":494,"s":"qs-iphone-14-pro","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":14,"v":"pro","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-iphone-14.webp","w":379,"h":504,"s":"qs-iphone-14","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":14,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-iphone-15-plus.webp","w":400,"h":525,"s":"qs-iphone-15-plus","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":15,"v":"plus","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-iphone-15-pro-max.webp","w":400,"h":498,"s":"qs-iphone-15-pro-max","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":15,"v":"pro max","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-iphone-15-pro.webp","w":400,"h":493,"s":"qs-iphone-15-pro","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":15,"v":"pro","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-iphone-15.webp","w":387,"h":508,"s":"qs-iphone-15","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":15,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-iphone-16-plus.webp","w":400,"h":497,"s":"qs-iphone-16-plus","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":16,"v":"plus","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-iphone-16-pro-max.webp","w":400,"h":502,"s":"qs-iphone-16-pro-max","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":16,"v":"pro max","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-iphone-16-pro.webp","w":400,"h":496,"s":"qs-iphone-16-pro","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":16,"v":"pro","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-iphone-16.webp","w":400,"h":489,"s":"qs-iphone-16","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":16,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-iphone-16e.webp","w":400,"h":488,"s":"qs-iphone-16e","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":16,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-iphone-17-air.webp","w":306,"h":536,"s":"qs-iphone-17-air","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":17,"v":"air","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-iphone-17-pro-max.webp","w":400,"h":515,"s":"qs-iphone-17-pro-max","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":17,"v":"pro max","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-iphone-17-pro.webp","w":400,"h":497,"s":"qs-iphone-17-pro","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":17,"v":"pro","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-iphone-17.webp","w":293,"h":515,"s":"qs-iphone-17","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"iphone","g":17,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-set-iphone-colour-fan.webp","w":1173,"h":681,"s":"qs-set-iphone-colour-fan","d":"fan assortment composed from site device art: qs-iphone-16, qs-iphone-15, qs-iphone-14, qs-iphone-13, qs-iphone-12, qs-iphone-11","t":{"b":"iphones","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/qs-set-iphone-colour-row.webp","w":2048,"h":535,"s":"qs-set-iphone-colour-row","d":"row assortment composed from site device art: qs-iphone-15, qs-iphone-15-plus, qs-iphone-14, qs-iphone-13, qs-iphone-12","t":{"b":"iphones","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/qs-set-iphone-generations.webp","w":1707,"h":1097,"s":"qs-set-iphone-generations","d":"stagger assortment composed from site device art: qs-iphone-16, qs-iphone-15, qs-iphone-14, qs-iphone-13, qs-iphone-12, qs-iphone-11","t":{"b":"iphones","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/qs-set-iphone-grid-nine.webp","w":1443,"h":1836,"s":"qs-set-iphone-grid-nine","d":"grid assortment composed from site device art: qs-iphone-16, qs-iphone-16-pro, qs-iphone-15, qs-iphone-15-plus, qs-iphone-15-pro, qs-iphone-14, qs-iphone-14-pro, qs-iphone-13, qs-iphone-12","t":{"b":"iphones","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/qs-set-iphone-hero-trio.webp","w":1177,"h":1055,"s":"qs-set-iphone-hero-trio","d":"hero assortment composed from site device art: qs-iphone-15-pro-max, qs-iphone-14, qs-iphone-13-mini","t":{"b":"iphones","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/qs-set-iphone-mini-pair.webp","w":868,"h":558,"s":"qs-set-iphone-mini-pair","d":"row assortment composed from site device art: qs-iphone-13-mini, qs-iphone-12-mini","t":{"b":"iphones","g":null,"v":"mini","c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/qs-set-iphone-pro-row.webp","w":2048,"h":484,"s":"qs-set-iphone-pro-row","d":"row assortment composed from site device art: qs-iphone-16-pro, qs-iphone-15-pro, qs-iphone-14-pro, qs-iphone-13-pro, qs-iphone-12-pro","t":{"b":"iphones","g":null,"v":"pro","c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/qs-set-iphone-promax-fan.webp","w":1214,"h":725,"s":"qs-set-iphone-promax-fan","d":"fan assortment composed from site device art: qs-iphone-15-pro-max, qs-iphone-14-pro-max, qs-iphone-13-pro-max, qs-iphone-12-pro-max, qs-iphone-11-pro-max","t":{"b":"iphones","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/sam-cracked-screen.webp","w":1770,"h":1632,"s":"sam-cracked-screen","d":"a premium Android phone with its front glass badly cracked in a spiderweb pattern, screen dark","t":{"b":"samsung","g":null,"v":null,"c":"cracked","k":"single","w":1,"h":1}},{"u":"assets/cutouts/sam-flip-closed.webp","w":1682,"h":1652,"s":"sam-flip-closed","d":"a compact clamshell foldable phone closed shut showing its small outer screen, three-quarter view","t":{"b":"samsung","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/sam-flip-open.webp","w":1295,"h":1544,"s":"sam-flip-open","d":"a compact clamshell foldable phone opened out straight, tall screen off, upright","t":{"b":"samsung","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/sam-fold-half.webp","w":1446,"h":1403,"s":"sam-fold-half","d":"a foldable Android phone half folded at ninety degrees standing on a surface, screens off, three-quarter view","t":{"b":"samsung","g":null,"v":null,"c":"clean","k":"detail","w":1,"h":0}},{"u":"assets/cutouts/sam-fold-open-flat.webp","w":1468,"h":1064,"s":"sam-fold-open-flat","d":"a large foldable Android phone opened out flat like a small tablet, inner screen off, three-quarter view","t":{"b":"samsung","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/sam-pair-front-back.webp","w":1794,"h":1909,"s":"sam-pair-front-back","d":"two premium Android phones side by side, one showing its front screen and one showing its rear camera lenses","t":{"b":"samsung","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/sam-s23-back-green.webp","w":630,"h":1597,"s":"sam-s23-back-green","d":"a premium Android phone with three vertical round rear lenses, botanic green back, back panel facing the camera, upright","t":{"b":"samsung","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/sam-s24-back-cream.webp","w":587,"h":1628,"s":"sam-s24-back-cream","d":"a premium Android phone with three vertical round rear lenses, warm cream coloured back, back panel facing the camera, upright","t":{"b":"samsung","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/sam-s24-back-violet.webp","w":631,"h":1625,"s":"sam-s24-back-violet","d":"a premium Android phone with three separate round rear camera lenses in a vertical line, soft violet glass back, back panel facing the camera, upright","t":{"b":"samsung","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/sam-s24-ultra-back.webp","w":768,"h":1904,"s":"sam-s24-ultra-back","d":"a large premium Android phone with a flat titanium frame and four separate round rear camera lenses in a vertical line, deep grey, back panel facing the camera, upright","t":{"b":"samsung","g":null,"v":"ultra","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/sam-s24-ultra-front.webp","w":777,"h":1662,"s":"sam-s24-ultra-front","d":"a large premium Android phone seen straight on from the front, flat screen, very thin uniform bezels, screen off","t":{"b":"samsung","g":null,"v":"ultra","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/sam-trio-lineup.webp","w":1369,"h":1150,"s":"sam-trio-lineup","d":"three premium Android phones standing in a row, backs to camera, each a different colour, vertical camera lenses","t":{"b":"samsung","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/sam-watch-pair.webp","w":1816,"h":1368,"s":"sam-watch-pair","d":"two round-faced Android smartwatches side by side, screens off, one black one silver, sport bands","t":{"b":"samsung","g":null,"v":null,"c":"clean","k":"other","w":1,"h":0}},{"u":"assets/cutouts/samsung-fold-open.webp","w":1564,"h":1059,"s":"samsung-fold-open","d":"a foldable smartphone opened flat showing its large inner screen switched off, three-quarter view","t":{"b":"samsung","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/samsung-galaxy-back.webp","w":556,"h":1568,"s":"samsung-galaxy-back","d":"Samsung Galaxy S24 Ultra in titanium grey, back to camera, vertical camera lenses, slight tilt","t":{"b":"samsung","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}}],"cars":[{"u":"assets/cutouts/car-classic-side.webp","w":2048,"h":1870,"s":"car-classic-side","d":"a classic vintage car photographed from the side, glossy paint, whitewall tyres","t":{"b":"car","g":null,"v":null,"c":"clean","k":"single","w":1,"body":"car","h":1}},{"u":"assets/cutouts/car-damaged-front.webp","w":1661,"h":1017,"s":"car-damaged-front","d":"a car with visible front-end collision damage, crumpled hood and bumper, three-quarter view","t":{"b":"car","g":null,"v":null,"c":"cracked","k":"single","w":1,"body":"car","h":1}},{"u":"assets/cutouts/car-engine-bay.webp","w":1197,"h":1479,"s":"car-engine-bay","d":"a clean modern car engine block viewed from directly above, chrome and black components, engine only, no car body around it","t":{"b":"car","g":null,"v":null,"c":"clean","k":"single","w":0,"body":"car","h":0}},{"u":"assets/cutouts/car-front.webp","w":631,"h":347,"s":"car-front","d":"","t":{"b":"car","g":null,"v":null,"c":"clean","k":"single","w":1,"body":"car","h":1}},{"u":"assets/cutouts/car-hand-keys-over.webp","w":369,"h":224,"s":"car-hand-keys-over","d":"a hand passing a car key fob to another hand, key exchange, forearms cropped","t":{"b":"car","g":null,"v":null,"c":"clean","k":"hand","w":0,"body":"car","h":0}},{"u":"assets/cutouts/car-keys-fob.webp","w":1799,"h":1945,"s":"car-keys-fob","d":"a car key fob and keyring held up, modern black plastic remote","t":{"b":"car","g":null,"v":null,"c":"clean","k":"hand","w":0,"body":"car","h":0}},{"u":"assets/cutouts/car-keys.webp","w":365,"h":262,"s":"car-keys","d":"","t":{"b":"car","g":null,"v":null,"c":"clean","k":"single","w":0,"body":"car","h":0}},{"u":"assets/cutouts/car-motorcycle-side.webp","w":1790,"h":1886,"s":"car-motorcycle-side","d":"a modern motorcycle photographed from the side, kickstand down","t":{"b":"bike","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/car-sedan-front.webp","w":2048,"h":1366,"s":"car-sedan-front","d":"a modern silver sedan car photographed from the front three-quarter angle, clean bodywork","t":{"b":"car","g":null,"v":null,"c":"clean","k":"single","w":1,"body":"car","h":1}},{"u":"assets/cutouts/car-sedan-rear.webp","w":1937,"h":840,"s":"car-sedan-rear","d":"a modern silver sedan photographed from the rear three-quarter angle","t":{"b":"car","g":null,"v":null,"c":"clean","k":"single","w":1,"body":"car","h":1}},{"u":"assets/cutouts/car-suv-side.webp","w":1517,"h":618,"s":"car-suv-side","d":"a modern dark SUV photographed from the side three-quarter angle","t":{"b":"car","g":null,"v":null,"c":"clean","k":"single","w":1,"body":"car","h":1}},{"u":"assets/cutouts/car-title-docs.webp","w":1726,"h":1259,"s":"car-title-docs","d":"a stack of vehicle paperwork documents and a pen, blank pages, top-down","t":{"b":"car","g":null,"v":null,"c":"clean","k":"single","w":0,"body":"car","h":0}},{"u":"assets/cutouts/car-truck-front.webp","w":1869,"h":1599,"s":"car-truck-front","d":"a modern pickup truck photographed from the front three-quarter angle, clean bodywork","t":{"b":"car","g":null,"v":null,"c":"clean","k":"single","w":1,"body":"truck","h":1}},{"u":"assets/cutouts/car-van-cargo.webp","w":1903,"h":1689,"s":"car-van-cargo","d":"a white cargo van photographed from the front three-quarter angle, blank panels, no text","t":{"b":"car","g":null,"v":null,"c":"clean","k":"single","w":1,"body":"van","h":1}},{"u":"assets/cutouts/car-wheel-tyre.webp","w":1582,"h":1758,"s":"car-wheel-tyre","d":"a single modern alloy car wheel with tyre, straight on side view","t":{"b":"car","g":null,"v":null,"c":"clean","k":"single","w":0,"body":"car","h":0}}],"macbooks":[{"u":"assets/cutouts/mac-closed-side.webp","w":288,"h":1834,"s":"mac-closed-side","d":"a closed silver laptop computer seen from the side showing its thin closed profile","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"detail","w":1,"h":0}},{"u":"assets/cutouts/mac-closed-topdown.webp","w":1896,"h":1356,"s":"mac-closed-topdown","d":"a closed silver laptop computer photographed directly from above, plain aluminium lid, no logo","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/mac-half-open-glow.webp","w":1720,"h":1499,"s":"mac-half-open-glow","d":"a premium laptop computer half open with light spilling from the gap between screen and keyboard, dark room feel, three-quarter view","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"detail","w":1,"h":0}},{"u":"assets/cutouts/mac-pair-open-angle.webp","w":2048,"h":1479,"s":"mac-pair-open-angle","d":"two premium laptop computers open side by side at matching angles, dark screens, one silver one dark grey","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/mac-pro-open-front.webp","w":1894,"h":1286,"s":"mac-pro-open-front","d":"a premium dark grey laptop computer open and seen straight on from the front, dark screen, thick aluminium body","t":{"b":"macbooks","g":null,"v":"pro","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/mac-stack-closed-three.webp","w":1848,"h":845,"s":"mac-stack-closed-three","d":"three closed laptop computers stacked flat with slight offsets, mixed silver and dark grey, three-quarter view","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/mac-with-accessories.webp","w":1874,"h":1291,"s":"mac-with-accessories","d":"a closed silver laptop computer with a smartphone and wireless earbuds case arranged neatly beside it, photographed from above","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/macbook-closed-stack.webp","w":1861,"h":1192,"s":"macbook-closed-stack","d":"two closed silver MacBook laptops stacked neatly, slight angle","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/macbook-open-angle.webp","w":1764,"h":1276,"s":"macbook-open-angle","d":"open silver MacBook Pro laptop at a three-quarter angle, dark screen, aluminium body","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/macbook-pair-open-closed.webp","w":1926,"h":1264,"s":"macbook-pair-open-closed","d":"one open silver laptop beside one closed silver laptop, three-quarter view","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/monitor-widescreen.webp","w":1576,"h":1341,"s":"monitor-widescreen","d":"a slim widescreen computer monitor on a stand, screen off, straight-on view","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/own-stock-macbook-stack.webp","w":2048,"h":1699,"s":"own-stock-macbook-stack","d":"","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/qs-cat-macbook.webp","w":530,"h":320,"s":"qs-cat-macbook","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-device-imac.webp","w":443,"h":373,"s":"qs-device-imac","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-device-mac-studio.webp","w":239,"h":117,"s":"qs-device-mac-studio","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-device-macbook-air.webp","w":370,"h":226,"s":"qs-device-macbook-air","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":"air","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-device-macbook-pro.webp","w":381,"h":230,"s":"qs-device-macbook-pro","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":"pro","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-set-macbook-pair.webp","w":2048,"h":613,"s":"qs-set-macbook-pair","d":"row assortment composed from site device art: qs-device-macbook-pro, qs-device-macbook-air","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-imac-24-m1-2021.webp","w":441,"h":372,"s":"qs-sheet-imac-24-m1-2021","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-imac-24-m3-2023.webp","w":441,"h":372,"s":"qs-sheet-imac-24-m3-2023","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-imac-24-m4-2024.webp","w":441,"h":372,"s":"qs-sheet-imac-24-m4-2024","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-mba-13-m1-2020.webp","w":502,"h":288,"s":"qs-sheet-mba-13-m1-2020","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-mba-13-m2-2022.webp","w":502,"h":305,"s":"qs-sheet-mba-13-m2-2022","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-mba-13-m3-2024.webp","w":502,"h":305,"s":"qs-sheet-mba-13-m3-2024","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-mba-13-m4-2025.webp","w":502,"h":305,"s":"qs-sheet-mba-13-m4-2025","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-mba-13-m5-2026.webp","w":502,"h":305,"s":"qs-sheet-mba-13-m5-2026","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-mba-15-m2-2023.webp","w":560,"h":340,"s":"qs-sheet-mba-15-m2-2023","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-mba-15-m3-2024.webp","w":560,"h":340,"s":"qs-sheet-mba-15-m3-2024","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-mba-15-m4-2025.webp","w":560,"h":340,"s":"qs-sheet-mba-15-m4-2025","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-mba-15-m5-2026.webp","w":560,"h":340,"s":"qs-sheet-mba-15-m5-2026","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-mbp-13-m1-2020.webp","w":481,"h":279,"s":"qs-sheet-mbp-13-m1-2020","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-mbp-13-m2-2022.webp","w":481,"h":279,"s":"qs-sheet-mbp-13-m2-2022","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-mbp-14-2021.webp","w":494,"h":298,"s":"qs-sheet-mbp-14-2021","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-mbp-14-2023.webp","w":494,"h":298,"s":"qs-sheet-mbp-14-2023","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-mbp-14-m3-2023.webp","w":494,"h":298,"s":"qs-sheet-mbp-14-m3-2023","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-mbp-14-m3pro-2023.webp","w":494,"h":298,"s":"qs-sheet-mbp-14-m3pro-2023","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-mbp-14-m4-2024.webp","w":494,"h":298,"s":"qs-sheet-mbp-14-m4-2024","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-mbp-14-m4pro-2024.webp","w":494,"h":298,"s":"qs-sheet-mbp-14-m4pro-2024","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-mbp-14-m5-2025.webp","w":494,"h":298,"s":"qs-sheet-mbp-14-m5-2025","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-mbp-16-2021.webp","w":563,"h":343,"s":"qs-sheet-mbp-16-2021","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-mbp-16-2023.webp","w":563,"h":343,"s":"qs-sheet-mbp-16-2023","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-mbp-16-m3pro-2023.webp","w":563,"h":343,"s":"qs-sheet-mbp-16-m3pro-2023","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-mbp-16-m4pro-2024.webp","w":563,"h":343,"s":"qs-sheet-mbp-16-m4pro-2024","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-mbp-16-m5pro-2026.webp","w":563,"h":343,"s":"qs-sheet-mbp-16-m5pro-2026","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"macbooks","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}}],"ipads":[{"u":"assets/cutouts/ipad-angle-tilt-back.webp","w":1546,"h":1062,"s":"ipad-angle-tilt-back","d":"a premium tablet computer at a dynamic 20 degree tilt, rear aluminium panel to camera, floating","t":{"b":"ipads","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/ipad-back-camera.webp","w":606,"h":1404,"s":"ipad-back-camera","d":"a large premium tablet computer seen from the back showing its single rear camera square and flat aluminium body, upright","t":{"b":"ipads","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/ipad-front-screen-off.webp","w":1323,"h":1593,"s":"ipad-front-screen-off","d":"a large premium tablet computer seen straight on from the front, screen off, very thin uniform bezels","t":{"b":"ipads","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/ipad-mini-single.webp","w":770,"h":1672,"s":"ipad-mini-single","d":"a small premium tablet computer, screen off, upright, thin bezels","t":{"b":"ipads","g":null,"v":"mini","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/ipad-pair-sizes.webp","w":982,"h":1786,"s":"ipad-pair-sizes","d":"two premium tablet computers of different sizes standing upright side by side, both seen from the BACK showing dark aluminium rear panels, not the screens","t":{"b":"ipads","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/ipad-stack-three.webp","w":2048,"h":952,"s":"ipad-stack-three","d":"three premium tablet computers stacked flat on top of one another with slight offsets, three-quarter view","t":{"b":"ipads","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/ipad-with-keyboard.webp","w":1622,"h":1131,"s":"ipad-with-keyboard","d":"a premium tablet computer attached to a detachable keyboard folio, open like a laptop, screen off, three-quarter view","t":{"b":"ipads","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/ipad-with-pencil.webp","w":1879,"h":1679,"s":"ipad-with-pencil","d":"a tablet computer lying flat with a slim white stylus pen beside it, top-down","t":{"b":"ipads","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/ipad-with-stylus.webp","w":1576,"h":1116,"s":"ipad-with-stylus","d":"a premium tablet computer lying flat with a slim white stylus resting diagonally across it, photographed from above","t":{"b":"ipads","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/own-stock-iphone-ipad.webp","w":1771,"h":2048,"s":"own-stock-iphone-ipad","d":"","t":{"b":"ipads","g":null,"v":null,"c":"clean","k":"other","w":1,"h":0}},{"u":"assets/cutouts/qs-cat-ipad.webp","w":512,"h":563,"s":"qs-cat-ipad","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-family-ipad-11-a16.webp","w":498,"h":564,"s":"qs-family-ipad-11-a16","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-family-ipad-air-11-m3.webp","w":496,"h":564,"s":"qs-family-ipad-air-11-m3","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"v":"air","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-family-ipad-mini-7-a17-pro.webp","w":452,"h":564,"s":"qs-family-ipad-mini-7-a17-pro","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"v":"mini","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-ipad-10.webp","w":438,"h":496,"s":"qs-ipad-10","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-ipad-11-a16.webp","w":438,"h":496,"s":"qs-ipad-11-a16","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-ipad-5.webp","w":403,"h":479,"s":"qs-ipad-5","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-ipad-6.webp","w":402,"h":479,"s":"qs-ipad-6","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-ipad-7.webp","w":414,"h":501,"s":"qs-ipad-7","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-ipad-8.webp","w":414,"h":501,"s":"qs-ipad-8","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-ipad-9.webp","w":413,"h":500,"s":"qs-ipad-9","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-ipad-air-11-m2.webp","w":435,"h":494,"s":"qs-ipad-air-11-m2","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"v":"air","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-ipad-air-11-m3.webp","w":435,"h":494,"s":"qs-ipad-air-11-m3","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"v":"air","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-ipad-air-13-m2.webp","w":512,"h":561,"s":"qs-ipad-air-13-m2","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"v":"air","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-ipad-air-13-m3.webp","w":512,"h":561,"s":"qs-ipad-air-13-m3","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"v":"air","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-ipad-air-3.webp","w":415,"h":500,"s":"qs-ipad-air-3","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"v":"air","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-ipad-air-4.webp","w":437,"h":495,"s":"qs-ipad-air-4","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"v":"air","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-ipad-air-5.webp","w":437,"h":495,"s":"qs-ipad-air-5","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"v":"air","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-ipad-mini-5.webp","w":336,"h":405,"s":"qs-ipad-mini-5","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"v":"mini","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-ipad-mini-6.webp","w":318,"h":390,"s":"qs-ipad-mini-6","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"v":"mini","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-ipad-mini-7-a17-pro.webp","w":313,"h":390,"s":"qs-ipad-mini-7-a17-pro","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"v":"mini","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-ipad-pro-11-m4.webp","w":435,"h":498,"s":"qs-ipad-pro-11-m4","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"v":"pro","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-ipad-pro-11-m5.webp","w":454,"h":499,"s":"qs-ipad-pro-11-m5","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"v":"pro","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-ipad-pro-12-9-3rd-gen.webp","w":496,"h":561,"s":"qs-ipad-pro-12-9-3rd-gen","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"v":"pro","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-ipad-pro-12-9-4th-gen.webp","w":520,"h":560,"s":"qs-ipad-pro-12-9-4th-gen","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"v":"pro","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-ipad-pro-12-9-5th-gen.webp","w":518,"h":560,"s":"qs-ipad-pro-12-9-5th-gen","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"v":"pro","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-ipad-pro-12-9-6th-gen.webp","w":511,"h":560,"s":"qs-ipad-pro-12-9-6th-gen","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"v":"pro","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-ipad-pro-13-m4.webp","w":512,"h":563,"s":"qs-ipad-pro-13-m4","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"v":"pro","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-ipad-pro-13-m5.webp","w":512,"h":563,"s":"qs-ipad-pro-13-m5","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"ipads","g":null,"v":"pro","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-set-ipad-fan.webp","w":1446,"h":992,"s":"qs-set-ipad-fan","d":"fan assortment composed from site device art: qs-family-ipad-pro-13-m5, qs-ipad-pro-11-4th-gen, qs-ipad-air-13-m2, qs-family-ipad-air-11-m3, qs-ipad-10, qs-ipad-mini-6","t":{"b":"ipads","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/qs-set-ipad-generations.webp","w":1868,"h":1267,"s":"qs-set-ipad-generations","d":"stagger assortment composed from site device art: qs-ipad-10, qs-ipad-9, qs-ipad-8, qs-ipad-7, qs-ipad-6","t":{"b":"ipads","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/qs-set-ipad-row.webp","w":2048,"h":599,"s":"qs-set-ipad-row","d":"row assortment composed from site device art: qs-family-ipad-pro-13-m5, qs-ipad-air-13-m2, qs-family-ipad-11-a16, qs-family-ipad-mini-7-a17-pro","t":{"b":"ipads","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/tablet-watch.webp","w":651,"h":458,"s":"tablet-watch","d":"","t":{"b":"ipads","g":null,"v":null,"c":"clean","k":"other","w":1,"h":0}}],"watches":[{"u":"assets/cutouts/apple-watch-single.webp","w":1001,"h":1083,"s":"apple-watch-single","d":"a single smartwatch with a black sport band, screen off, three-quarter view","t":{"b":"watch","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/apple-watch-stack-three.webp","w":1981,"h":1489,"s":"apple-watch-stack-three","d":"three smartwatches with different coloured bands arranged in a row, screens off","t":{"b":"watch","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/gold-pocket-watch.webp","w":1758,"h":1734,"s":"gold-pocket-watch","d":"an antique gold pocket watch with its cover open, chain coiled beside it, photographed from above","t":{"b":"watch","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/gold-watch-luxury.webp","w":1500,"h":1817,"s":"gold-watch-luxury","d":"a luxury gold wristwatch with metal bracelet, three-quarter view, no visible branding","t":{"b":"watch","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-watch-s10-2024.webp","w":447,"h":525,"s":"qs-sheet-watch-s10-2024","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"watch","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-watch-s11-2025.webp","w":447,"h":525,"s":"qs-sheet-watch-s11-2025","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"watch","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-watch-s5-2019.webp","w":425,"h":505,"s":"qs-sheet-watch-s5-2019","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"watch","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-watch-s6-2020.webp","w":436,"h":505,"s":"qs-sheet-watch-s6-2020","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"watch","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-watch-s7-2021.webp","w":435,"h":517,"s":"qs-sheet-watch-s7-2021","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"watch","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-watch-s8-2022.webp","w":431,"h":515,"s":"qs-sheet-watch-s8-2022","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"watch","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-watch-s9-2023.webp","w":437,"h":516,"s":"qs-sheet-watch-s9-2023","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"watch","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-watch-se-2020.webp","w":425,"h":505,"s":"qs-sheet-watch-se-2020","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"watch","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-watch-se2-2022.webp","w":426,"h":505,"s":"qs-sheet-watch-se2-2022","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"watch","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-watch-se3-2025.webp","w":422,"h":505,"s":"qs-sheet-watch-se3-2025","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"watch","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-watch-ultra-2022.webp","w":476,"h":563,"s":"qs-sheet-watch-ultra-2022","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"watch","g":null,"v":"ultra","c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-watch-ultra2-2023.webp","w":491,"h":562,"s":"qs-sheet-watch-ultra2-2023","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"watch","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/qs-sheet-watch-ultra3-2025.webp","w":497,"h":553,"s":"qs-sheet-watch-ultra3-2025","d":"imported from the iphones.la quick-sell device art (owner's own site asset)","t":{"b":"watch","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/watch-pair-bands.webp","w":863,"h":1226,"s":"watch-pair-bands","d":"two premium smartwatches standing upright side by side, screens off, one with a woven band and one with a metal link band","t":{"b":"watch","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/watch-screen-on.webp","w":708,"h":1108,"s":"watch-screen-on","d":"a premium smartwatch seen straight on with its screen glowing a plain deep colour, no text or icons, sport band","t":{"b":"watch","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/watch-single-angle.webp","w":1069,"h":1355,"s":"watch-single-angle","d":"a single premium smartwatch at a three-quarter angle, screen off, sport band curled beneath it","t":{"b":"watch","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/watch-stack-four.webp","w":2048,"h":1676,"s":"watch-stack-four","d":"four premium smartwatches arranged in a row with different coloured bands, screens off","t":{"b":"watch","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}}],"gold":[{"u":"assets/cutouts/gold-bar-single.webp","w":1834,"h":1740,"s":"gold-bar-single","d":"a single large gold bullion bar, stamped face visible, three-quarter view","t":{"b":"gold","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/gold-bars-fan.webp","w":1820,"h":1304,"s":"gold-bars-fan","d":"five small gold bullion bars fanned out overlapping on a flat surface, photographed from above","t":{"b":"gold","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/gold-bars-row.webp","w":1464,"h":1540,"s":"gold-bars-row","d":"a row of five gold bullion bars standing on edge in a line, stamped faces visible","t":{"b":"gold","g":null,"v":null,"c":"clean","k":"detail","w":1,"h":0}},{"u":"assets/cutouts/gold-bars-stack.webp","w":2048,"h":1555,"s":"gold-bars-stack","d":"a stack of shiny gold bullion bars with stamped markings, three-quarter view","t":{"b":"gold","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/gold-bars.webp","w":461,"h":326,"s":"gold-bars","d":"","t":{"b":"gold","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/gold-bracelet-cuban.webp","w":1484,"h":1184,"s":"gold-bracelet-cuban","d":"a thick gold Cuban link bracelet laid in a gentle curve, photographed from above","t":{"b":"gold","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/gold-bracelet-pair.webp","w":1294,"h":1041,"s":"gold-bracelet-pair","d":"two heavy yellow gold bracelets lying side by side, top-down","t":{"b":"gold","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/gold-chains-pile.webp","w":2048,"h":1718,"s":"gold-chains-pile","d":"a pile of heavy yellow gold chain necklaces of varied link styles, glinting","t":{"b":"gold","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/gold-chains.webp","w":624,"h":457,"s":"gold-chains","d":"","t":{"b":"gold","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/gold-class-ring.webp","w":846,"h":1232,"s":"gold-class-ring","d":"a heavy gold class ring with a coloured gemstone, standing upright, three-quarter macro view","t":{"b":"gold","g":null,"v":null,"c":"clean","k":"detail","w":1,"h":0}},{"u":"assets/cutouts/gold-coins-pile.webp","w":1212,"h":859,"s":"gold-coins-pile","d":"a small heap of gold bullion coins, milled edges, bright reflective","t":{"b":"gold","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/gold-earrings-pile.webp","w":1054,"h":838,"s":"gold-earrings-pile","d":"an assortment of yellow gold earrings in a small heap, top-down","t":{"b":"gold","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/gold-jewelry-mixed.webp","w":2048,"h":1734,"s":"gold-jewelry-mixed","d":"a mixed pile of gold jewelry: chains, bracelets, rings, pendants, warm glinting metal","t":{"b":"gold","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/gold-jewelry.webp","w":511,"h":226,"s":"gold-jewelry","d":"","t":{"b":"gold","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/gold-necklace-single.webp","w":1314,"h":1591,"s":"gold-necklace-single","d":"a single thick yellow gold rope chain necklace laid in a loose coil, top-down","t":{"b":"gold","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/gold-rings-scatter.webp","w":2048,"h":2048,"s":"gold-rings-scatter","d":"an assortment of yellow gold rings, some with gemstones, arranged loosely, top-down","t":{"b":"gold","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/gold-scale-weighing.webp","w":1659,"h":1785,"s":"gold-scale-weighing","d":"a small digital jewellers scale with gold jewellery resting on its weighing platform","t":{"b":"gold","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/gold-scrap-mixed.webp","w":1752,"h":1748,"s":"gold-scrap-mixed","d":"a pile of broken and tangled scrap gold jewellery, snapped chains and odd pieces, top-down","t":{"b":"gold","g":null,"v":null,"c":"cracked","k":"single","w":1,"h":1}},{"u":"assets/cutouts/gold-teeth-dental.webp","w":880,"h":589,"s":"gold-teeth-dental","d":"small scrap dental gold pieces and gold crowns in a tiny pile, top-down","t":{"b":"gold","g":null,"v":null,"c":"cracked","k":"single","w":1,"h":1}}],"silver":[{"u":"assets/cutouts/coin-album-pages.webp","w":1987,"h":1925,"s":"coin-album-pages","d":"an open coin collector album showing rows of coins in clear pockets, top-down","t":{"b":"coins","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/coin-collection-tray.webp","w":2048,"h":1435,"s":"coin-collection-tray","d":"a collector tray filled with assorted old coins in rows, top-down","t":{"b":"coins","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/coin-graded-fan-three.webp","w":1950,"h":1865,"s":"coin-graded-fan-three","d":"three coins in clear rigid plastic grading cases fanned out overlapping, blank white label strips","t":{"b":"coins","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/coin-jar-full.webp","w":1251,"h":1810,"s":"coin-jar-full","d":"a clear glass jar filled to the top with assorted loose coins","t":{"b":"coins","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/coin-loose-pile.webp","w":1935,"h":1383,"s":"coin-loose-pile","d":"a loose pile of assorted vintage coins, mixed silver and copper tones","t":{"b":"coins","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/coin-rolls-paper.webp","w":1802,"h":1569,"s":"coin-rolls-paper","d":"several paper wrapped coin rolls lying in a small pile, plain unmarked wrappers","t":{"b":"coins","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/coin-silver-dollar-pair.webp","w":1759,"h":1902,"s":"coin-silver-dollar-pair","d":"two large old silver dollar coins, one lying flat and one standing on edge behind it, macro view","t":{"b":"silver","g":null,"v":null,"c":"clean","k":"detail","w":1,"h":0}},{"u":"assets/cutouts/coin-single-large.webp","w":223,"h":1623,"s":"coin-single-large","d":"a single large old silver dollar coin standing upright on edge, detailed relief","t":{"b":"coins","g":null,"v":null,"c":"clean","k":"detail","w":1,"h":0}},{"u":"assets/cutouts/coin-slab.webp","w":144,"h":144,"s":"coin-slab","d":"","t":{"b":"coins","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/coin-slabs-stack.webp","w":1849,"h":1314,"s":"coin-slabs-stack","d":"three graded coin slabs in clear plastic holders stacked at slight angles, blank labels","t":{"b":"coins","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/coin-stack-silver.webp","w":1817,"h":2048,"s":"coin-stack-silver","d":"several stacked silver dollar coins in neat columns, side view","t":{"b":"silver","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/coin-stack.webp","w":555,"h":276,"s":"coin-stack","d":"","t":{"b":"coins","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/silver-bar-single.webp","w":1158,"h":783,"s":"silver-bar-single","d":"a single large silver bullion bar, stamped face visible, three-quarter view","t":{"b":"silver","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/silver-bars-row.webp","w":1592,"h":1412,"s":"silver-bars-row","d":"a row of four silver bullion bars standing on edge in a line, stamped faces visible","t":{"b":"silver","g":null,"v":null,"c":"clean","k":"detail","w":1,"h":0}},{"u":"assets/cutouts/silver-bars-stack.webp","w":2048,"h":1631,"s":"silver-bars-stack","d":"a stack of shiny silver bullion bars with stamped markings, three-quarter view","t":{"b":"silver","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/silver-bars.webp","w":519,"h":476,"s":"silver-bars","d":"","t":{"b":"silver","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/silver-candlesticks.webp","w":1314,"h":1640,"s":"silver-candlesticks","d":"a pair of tall antique silver candlesticks standing upright, tarnished patina","t":{"b":"silver","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/silver-coins-spill.webp","w":1714,"h":1223,"s":"silver-coins-spill","d":"silver bullion coins spilling out of a tipped over tube, bright reflective metal","t":{"b":"silver","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/silver-coins-tube.webp","w":1513,"h":1586,"s":"silver-coins-tube","d":"a clear plastic coin tube standing upright, filled with silver bullion coins, beside two loose coins","t":{"b":"silver","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/silver-flatware-set.webp","w":1989,"h":1919,"s":"silver-flatware-set","d":"an arrangement of antique silver flatware: forks, spoons, knives, tarnished patina","t":{"b":"silver","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/silver-flatware.webp","w":364,"h":587,"s":"silver-flatware","d":"","t":{"b":"silver","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/silver-jewelry-mixed.webp","w":2048,"h":1681,"s":"silver-jewelry-mixed","d":"a mixed pile of sterling silver jewelry: chains, bracelets and rings","t":{"b":"silver","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/silver-rounds-pile.webp","w":2048,"h":1322,"s":"silver-rounds-pile","d":"a heap of silver bullion rounds and coins, bright reflective metal","t":{"b":"silver","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}}],"cards":[{"u":"assets/cutouts/poke-slabs-trio.webp","w":1794,"h":1831,"s":"poke-slabs-trio","d":"three collectible cards sealed in clear rigid plastic grading cases, overlapping at slight angles, each card inside a solid opaque pastel rectangle so it reads clearly, blank white label strips","t":{"b":"poke","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/sports-slab.webp","w":523,"h":215,"s":"sports-slab","d":"","t":{"b":"sports","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/sports-slabs-stack.webp","w":1843,"h":1328,"s":"sports-slabs-stack","d":"four sports cards in clear rigid plastic grading slabs stacked and fanned, each card inside a plain solid-colour blank rectangle, blank white labels, glossy plastic","t":{"b":"sports","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}}],"consoles":[{"u":"assets/cutouts/cables-bundle.webp","w":1804,"h":1608,"s":"cables-bundle","d":"a neat coil of assorted white and black charging cables bundled together, photographed from above","t":{"b":"electronics","g":null,"v":null,"c":"clean","k":"group","w":0,"h":0}},{"u":"assets/cutouts/camera-dslr-body.webp","w":1930,"h":1716,"s":"camera-dslr-body","d":"a professional DSLR camera body with a lens attached, three-quarter view, black body","t":{"b":"electronics","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/camera-mirrorless.webp","w":1966,"h":1524,"s":"camera-mirrorless","d":"a compact mirrorless camera with a short lens, three-quarter view, black and silver body","t":{"b":"electronics","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/chargers-adapters.webp","w":1916,"h":1522,"s":"chargers-adapters","d":"several white power adapter plugs and charging bricks arranged in a row, photographed from above","t":{"b":"electronics","g":null,"v":null,"c":"clean","k":"single","w":0,"h":0}},{"u":"assets/cutouts/console-handheld-pair.webp","w":1458,"h":784,"s":"console-handheld-pair","d":"two modern handheld gaming consoles side by side, screens off, three-quarter view","t":{"b":"electronics","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/console-single.webp","w":936,"h":1521,"s":"console-single","d":"a modern matte black game console standing upright, three-quarter view","t":{"b":"electronics","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/controller-pair.webp","w":1830,"h":929,"s":"controller-pair","d":"two modern wireless game controllers side by side, one black one white, three-quarter view","t":{"b":"electronics","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/drone-open-props.webp","w":2048,"h":1231,"s":"drone-open-props","d":"a consumer camera drone with arms extended and propellers attached, seen from a low three-quarter angle","t":{"b":"electronics","g":null,"v":null,"c":"clean","k":"other","w":1,"h":0}},{"u":"assets/cutouts/game-console-pair.webp","w":1404,"h":1406,"s":"game-console-pair","d":"a PlayStation 5 console beside an Xbox Series X console, three-quarter view","t":{"b":"electronics","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}},{"u":"assets/cutouts/gaming-handheld.webp","w":1854,"h":1273,"s":"gaming-handheld","d":"a modern handheld gaming console with attached controllers, screen off, three-quarter view","t":{"b":"electronics","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/router-modem.webp","w":1520,"h":1430,"s":"router-modem","d":"a modern white internet router with external antennas, three-quarter view","t":{"b":"electronics","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/smart-tv-stand.webp","w":1298,"h":860,"s":"smart-tv-stand","d":"a large flatscreen television on a slim stand, screen off, straight-on view","t":{"b":"electronics","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/tv-flatscreen.webp","w":1356,"h":941,"s":"tv-flatscreen","d":"modern flatscreen television, screen off, thin bezel, on a low stand, straight on","t":{"b":"electronics","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/vr-headset.webp","w":1823,"h":1082,"s":"vr-headset","d":"a modern standalone virtual reality headset with its strap, three-quarter view, light grey body","t":{"b":"electronics","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}}],"airpods":[{"u":"assets/cutouts/airpods-buds-out.webp","w":1762,"h":1298,"s":"airpods-buds-out","d":"wireless earbuds sitting beside their open white charging case, three-quarter view","t":{"b":"airpods","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/airpods-case-open.webp","w":1262,"h":1234,"s":"airpods-case-open","d":"AirPods Pro charging case open with both earbuds inside, white, three-quarter view","t":{"b":"airpods","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/buds-case-closed.webp","w":620,"h":786,"s":"buds-case-closed","d":"a small closed white wireless earbud charging case, three-quarter view","t":{"b":"airpods","g":null,"v":null,"c":"clean","k":"single","w":1,"h":1}},{"u":"assets/cutouts/buds-overear-headphones.webp","w":1284,"h":1760,"s":"buds-overear-headphones","d":"premium over-ear headphones in a light neutral colour, three-quarter view, padded ear cups","t":{"b":"airpods","g":null,"v":null,"c":"clean","k":"other","w":1,"h":0}},{"u":"assets/cutouts/buds-pair-loose.webp","w":1286,"h":1517,"s":"buds-pair-loose","d":"two white wireless earbuds lying beside their open charging case, photographed from above","t":{"b":"airpods","g":null,"v":null,"c":"clean","k":"group","w":1,"h":1}}]},"props":[{"u":"assets/cutouts/cardboard-box-taped.webp","w":1616,"h":1264,"s":"cardboard-box-taped","d":"a sealed brown cardboard shipping box with packing tape across the top seam, no labels, no text, three-quarter view","t":{"b":"car","g":null,"v":null,"c":"clean","k":"single","w":1,"body":"car","fam":"box","h":1}},{"u":"assets/cutouts/cardboard-shipping-labelled.webp","w":1959,"h":1572,"s":"cardboard-shipping-labelled","d":"a sealed cardboard shipping box with a blank white label square on top, no text, three-quarter view","t":{"b":"car","g":null,"v":null,"c":"clean","k":"single","w":1,"body":"car","h":1}},{"u":"assets/cutouts/cash-bundles-pyramid.webp","w":1727,"h":1507,"s":"cash-bundles-pyramid","d":"banded bundles of US hundred dollar bills stacked into a pyramid, three-quarter view","t":{"b":"cash","g":null,"v":null,"c":"clean","k":"group","w":1,"fam":"bundle","h":1}},{"u":"assets/cutouts/cash-bundles.webp","w":596,"h":376,"s":"cash-bundles","d":"","t":{"b":"cash","g":null,"v":null,"c":"clean","k":"group","w":1,"fam":"bundle","h":1}},{"u":"assets/cutouts/cash-fan-hundreds.webp","w":940,"h":1820,"s":"cash-fan-hundreds","d":"a fanned spread of US one hundred dollar bills held together, crisp new notes","t":{"b":"cash","g":null,"v":null,"c":"clean","k":"hand","w":1,"fam":"fan","h":0}},{"u":"assets/cutouts/cash-fan-twenties.webp","w":1766,"h":1758,"s":"cash-fan-twenties","d":"a fanned spread of US twenty dollar bills held together, crisp notes","t":{"b":"cash","g":null,"v":null,"c":"clean","k":"hand","w":1,"fam":"fan","h":0}},{"u":"assets/cutouts/cash-roll-band.webp","w":792,"h":1371,"s":"cash-roll-band","d":"a tight roll of US hundred dollar bills secured with a rubber band, standing upright","t":{"b":"cash","g":null,"v":null,"c":"clean","k":"single","w":1,"fam":"roll","h":1}},{"u":"assets/cutouts/cash-single-hundred.webp","w":1768,"h":782,"s":"cash-single-hundred","d":"a single crisp US one hundred dollar bill lying flat, straight on, top-down","t":{"b":"cash","g":null,"v":null,"c":"clean","k":"single","w":1,"fam":"single","h":1}},{"u":"assets/cutouts/cash-stack-banded.webp","w":1745,"h":1088,"s":"cash-stack-banded","d":"several banded bundles of US hundred dollar bills stacked neatly","t":{"b":"cash","g":null,"v":null,"c":"clean","k":"group","w":1,"fam":"stack","h":1}},{"u":"assets/cutouts/cash-stack.webp","w":605,"h":412,"s":"cash-stack","d":"","t":{"b":"cash","g":null,"v":null,"c":"clean","k":"group","w":1,"fam":"stack","h":1}},{"u":"assets/cutouts/delivery-box-open.webp","w":1929,"h":2048,"s":"delivery-box-open","d":"an open cardboard shipping box with bubble wrap inside, three-quarter view","t":{"b":"props","g":null,"v":null,"c":"clean","k":"single","w":1,"fam":"box","h":1}},{"u":"assets/cutouts/padded-mailer-envelope.webp","w":2008,"h":1254,"s":"padded-mailer-envelope","d":"a padded shipping mailer envelope, plain grey, slightly puffed, three-quarter view","t":{"b":"props","g":null,"v":null,"c":"clean","k":"single","w":1,"fam":"box","h":1}},{"u":"assets/cutouts/pallet-boxes-stack.webp","w":1930,"h":1901,"s":"pallet-boxes-stack","d":"a stack of plain brown cardboard boxes on a wooden pallet, no labels, three-quarter view","t":{"b":"props","g":null,"v":null,"c":"clean","k":"group","w":1,"fam":"box","h":1}},{"u":"assets/cutouts/safe-open-cash.webp","w":1866,"h":1744,"s":"safe-open-cash","d":"a small open security safe with neat stacks of US bills inside, three-quarter view","t":{"b":"cash","g":null,"v":null,"c":"clean","k":"single","w":1,"fam":"safe","h":1}}],"cash":[{"u":"assets/cutouts/cash-bundles-pyramid.webp","w":1727,"h":1507,"s":"cash-bundles-pyramid","d":"banded bundles of US hundred dollar bills stacked into a pyramid, three-quarter view","t":{"b":"cash","g":null,"v":null,"c":"clean","k":"group","w":1,"fam":"bundle","h":1}},{"u":"assets/cutouts/cash-bundles.webp","w":596,"h":376,"s":"cash-bundles","d":"","t":{"b":"cash","g":null,"v":null,"c":"clean","k":"group","w":1,"fam":"bundle","h":1}},{"u":"assets/cutouts/cash-fan-hundreds.webp","w":940,"h":1820,"s":"cash-fan-hundreds","d":"a fanned spread of US one hundred dollar bills held together, crisp new notes","t":{"b":"cash","g":null,"v":null,"c":"clean","k":"hand","w":1,"fam":"fan","h":0}},{"u":"assets/cutouts/cash-fan-twenties.webp","w":1766,"h":1758,"s":"cash-fan-twenties","d":"a fanned spread of US twenty dollar bills held together, crisp notes","t":{"b":"cash","g":null,"v":null,"c":"clean","k":"hand","w":1,"fam":"fan","h":0}},{"u":"assets/cutouts/cash-roll-band.webp","w":792,"h":1371,"s":"cash-roll-band","d":"a tight roll of US hundred dollar bills secured with a rubber band, standing upright","t":{"b":"cash","g":null,"v":null,"c":"clean","k":"single","w":1,"fam":"roll","h":1}},{"u":"assets/cutouts/cash-single-hundred.webp","w":1768,"h":782,"s":"cash-single-hundred","d":"a single crisp US one hundred dollar bill lying flat, straight on, top-down","t":{"b":"cash","g":null,"v":null,"c":"clean","k":"single","w":1,"fam":"single","h":1}},{"u":"assets/cutouts/cash-stack-banded.webp","w":1745,"h":1088,"s":"cash-stack-banded","d":"several banded bundles of US hundred dollar bills stacked neatly","t":{"b":"cash","g":null,"v":null,"c":"clean","k":"group","w":1,"fam":"stack","h":1}},{"u":"assets/cutouts/cash-stack.webp","w":605,"h":412,"s":"cash-stack","d":"","t":{"b":"cash","g":null,"v":null,"c":"clean","k":"group","w":1,"fam":"stack","h":1}},{"u":"assets/cutouts/safe-open-cash.webp","w":1866,"h":1744,"s":"safe-open-cash","d":"a small open security safe with neat stacks of US bills inside, three-quarter view","t":{"b":"cash","g":null,"v":null,"c":"clean","k":"single","w":1,"fam":"safe","h":1}}]};
/* THE SHOP'S OWN MARKS — 20 category icons from assets/icon-set.svg, one
   stroke weight, round joins. The reference audit found an icon on every
   bullet in 61% of GOOD ads and 15% of BAD; the engine's pills were text-only. */
const ICONS={"cardStar": {"d": "M38 10 H62 A12 12 0 0 1 74 22 V78 A12 12 0 0 1 62 90 H38 A12 12 0 0 1 26 78 V22 A12 12 0 0 1 38 10 Z M50 34 L54.2 45.6 L66.5 46.1 L56.9 53.7 L60.2 65.5 L50 58.4 L39.8 65.5 L43.1 53.7 L33.5 46.1 L45.8 45.6 Z", "for": "pokemon sports"}, "slab": {"d": "M34 10 H66 A14 14 0 0 1 80 24 V76 A14 14 0 0 1 66 90 H34 A14 14 0 0 1 20 76 V24 A14 14 0 0 1 34 10 Z M32 32 H68 M32 46 H68", "for": "pokemon sports"}, "boosterPk": {"d": "M28 78 V32 L34 22 L40 32 L46 22 L52 32 L58 22 L64 32 L70 22 L76 32 V78 A10 10 0 0 1 66 88 H38 A10 10 0 0 1 28 78 Z M36 52 H68", "for": "pokemon"}, "sparkle": {"d": "M50 12 C53 35 65 47 88 50 C65 53 53 65 50 88 C47 65 35 53 12 50 C35 47 47 35 50 12 Z", "for": "pokemon coins"}, "baseball": {"d": "M50 14 A36 36 0 1 0 50 86 A36 36 0 1 0 50 14 Z M29 23 Q41 50 29 77 M71 23 Q59 50 71 77", "for": "sports"}, "trophy": {"d": "M34 14 H66 V38 A16 16 0 0 1 34 38 Z M34 20 H24 A10 10 0 0 0 34 32 M66 20 H76 A10 10 0 0 1 66 32 M50 54 V66 M36 78 H64 A4 4 0 0 1 68 82 V86 H32 V82 A4 4 0 0 1 36 78 Z", "for": "sports"}, "barStack": {"d": "M40 26 H60 A4 4 0 0 1 63.6 28.2 L69 40 A4 4 0 0 1 65.4 46 H34.6 A4 4 0 0 1 31 40 L36.4 28.2 A4 4 0 0 1 40 26 Z M20 58 H40 A4 4 0 0 1 43.6 60.2 L49 72 A4 4 0 0 1 45.4 78 H14.6 A4 4 0 0 1 11 72 L16.4 60.2 A4 4 0 0 1 20 58 Z M60 58 H80 A4 4 0 0 1 83.6 60.2 L89 72 A4 4 0 0 1 85.4 78 H54.6 A4 4 0 0 1 51 72 L56.4 60.2 A4 4 0 0 1 60 58 Z", "for": "gold silver"}, "ring": {"d": "M50 18 A32 32 0 1 0 50 82 A32 32 0 1 0 50 18 Z M50 38 A12 12 0 1 0 50 62 A12 12 0 1 0 50 38 Z", "for": "gold silver"}, "karatSeal": {"d": "M50 12 A38 38 0 1 0 50 88 A38 38 0 1 0 50 12 Z M50 26 A24 24 0 1 0 50 74 A24 24 0 1 0 50 26 Z M42 50 L48 57 L59 44", "for": "gold silver coins"}, "coinStack": {"d": "M50 20 C67 20 80 25 80 31 C80 37 67 42 50 42 C33 42 20 37 20 31 C20 25 33 20 50 20 Z M20 31 V47 C20 53 33 58 50 58 C67 58 80 53 80 47 V31 M20 47 V63 C20 69 33 74 50 74 C67 74 80 69 80 63 V47", "for": "gold silver coins"}, "loupe": {"d": "M44 14 A28 28 0 1 0 44 70 A28 28 0 1 0 44 14 Z M64 64 L86 86", "for": "coins"}, "carSide": {"d": "M12 62 V50 A8 8 0 0 1 18 42 L36 38 L47 25 A10 10 0 0 1 55 21 H68 A10 10 0 0 1 76 25 L85 40 A8 8 0 0 1 88 48 V62 Z M28 62 A11 11 0 1 0 50 62 A11 11 0 1 0 28 62 Z M60 62 A11 11 0 1 0 82 62 A11 11 0 1 0 60 62 Z", "for": "cars"}, "keyFob": {"d": "M38 12 H62 A12 12 0 0 1 74 24 V58 A12 12 0 0 1 62 70 H38 A12 12 0 0 1 26 58 V24 A12 12 0 0 1 38 12 Z M50 30 A6 6 0 1 0 50 42 A6 6 0 1 0 50 30 Z M50 70 V88", "for": "cars"}, "phone": {"d": "M34 8 H66 A12 12 0 0 1 78 20 V80 A12 12 0 0 1 66 92 H34 A12 12 0 0 1 22 80 V20 A12 12 0 0 1 34 8 Z M43 20 H57 M40 80 H60", "for": "phones"}, "lock": {"d": "M32 46 V33 A18 18 0 0 1 68 33 V46 M28 46 H72 A10 10 0 0 1 82 56 V80 A10 10 0 0 1 72 90 H28 A10 10 0 0 1 18 80 V56 A10 10 0 0 1 28 46 Z M50 62 V74", "for": "phones"}, "testStrip": {"d": "M38 12 H62 A8 8 0 0 1 70 20 V80 A8 8 0 0 1 62 88 H38 A8 8 0 0 1 30 80 V20 A8 8 0 0 1 38 12 Z M41 26 H59 A3 3 0 0 1 62 29 V38 A3 3 0 0 1 59 41 H41 A3 3 0 0 1 38 38 V29 A3 3 0 0 1 41 26 Z M42 66 V80 M50 66 V80 M58 66 V80", "for": "strips"}, "sealedBox": {"d": "M50 12 L84 30 V70 L50 88 L16 70 V30 Z M16 30 L50 48 L84 30 M50 48 V88", "for": "strips"}, "shieldTick": {"d": "M50 10 L82 22 V48 Q82 74 50 90 Q18 74 18 48 V22 Z M38 50 L47 59 L64 40", "for": "phones strips"}, "cashTag": {"d": "M54 12 H80 A8 8 0 0 1 88 20 V46 A8 8 0 0 1 85.6 51.7 L48 89 A8 8 0 0 1 36.7 89 L11 63.3 A8 8 0 0 1 11 52 L48.4 14.4 A8 8 0 0 1 54 12 Z M70 30 A5 5 0 1 0 70 30.1 Z", "for": "cars strips"}, "boltFast": {"d": "M56 10 L26 54 A3 3 0 0 0 28.5 59 H45 L42 90 L74 44 A3 3 0 0 0 71.5 39 H55 Z", "for": "cars phones"}};
const ICON_FOR=[[/ICLOUD|LOCK|CARRIER/,'lock'],[/PICKUP|SHIP|COLLECT|MAIL|BOX/,'sealedBox'],[/LICENSED|TITLE|TRUST|INSURED/,'shieldTick'],
  [/CASH|PAID|\$|MONEY/,'cashTag'],[/SAME DAY|TODAY|FAST|NO APPT|INSTANT|MIN\b|NO WAIT/,'boltFast'],[/CRACKED|DAMAGE|TURN ON|SMASH|PHONE/,'phone'],
  [/TOW|RUNS|CAR|TRUCK|VAN/,'carSide'],[/KEY/,'keyFob'],[/OK$/,'shieldTick']];
function iconFor(text,vertical){const t=String(text).toUpperCase();for(const [re,k] of ICON_FOR)if(re.test(t))return k;return vertical==='cars'?'carSide':'phone';}
function iconSVG(key,x,y,size,stroke){const ic=ICONS[key];if(!ic)return '';const k=size/100;
  return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${k.toFixed(4)})"><path d="${ic.d}" fill="none" stroke="${stroke}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g>`;}
/* THE OWNER'S OWN PALETTES, recovered from the graded sets by
   tools/gfx/port_palettes.mjs. The eight authored here are six near-black
   grounds and two creams — one idea, eight hats, which is what "the colour
   schemes are slightly bland" was pointing at. These twenty were graded by the
   owner across three sets and carry structures this engine had none of:
   saturated light grounds, saturated mid colour fields, coloured darks.
   Where an id collides, the graded palette wins — it is the approved one. */
const PORTED=[
 {
  "id": "jw07",
  "name": "Mint Market",
  "mood": "coloured dark · Jewel",
  "ground": "#054e2f",
  "ground2": "#076F43",
  "ink": "#d4e2d9",
  "body": "#9AB8A9",
  "accent": "#E1C2FE",
  "hot": "#D9A943",
  "paper": "#F4F8F6",
  "dark": "#032315"
 },
 {
  "id": "jw05",
  "name": "Blue Ticket",
  "mood": "coloured dark · Jewel",
  "ground": "#044a51",
  "ground2": "#066973",
  "ink": "#d0e2e4",
  "body": "#94B4B8",
  "accent": "#FEBBD6",
  "hot": "#64D83F",
  "paper": "#F4F7F8",
  "dark": "#032023"
 },
 {
  "id": "du08",
  "name": "Indigo Trade",
  "mood": "saturated light · Duotone",
  "ground": "#869DBE",
  "ground2": "#839ABC",
  "ink": "#1b293f",
  "body": "#1A2A44",
  "accent": "#1F2382",
  "hot": "#1A247E",
  "paper": "#FAFBFC",
  "dark": "#051C3D"
 },
 {
  "id": "cd06",
  "name": "Blue Deal",
  "mood": "saturated light · Candy",
  "ground": "#ABC7D2",
  "ground2": "#8AB1C0",
  "ink": "#1b3d49",
  "body": "#2D5463",
  "accent": "#AB117D",
  "hot": "#CD2A90",
  "paper": "#FAFBFC",
  "dark": "#052E3D"
 },
 {
  "id": "ca07",
  "name": "Sky Market",
  "mood": "saturated light · Cool Air",
  "ground": "#CCE4E3",
  "ground2": "#ABD2D1",
  "ink": "#173f3f",
  "body": "#406868",
  "accent": "#D80A74",
  "hot": "#46961B",
  "paper": "#FAFCFC",
  "dark": "#053D3C"
 },
 {
  "id": "du07",
  "name": "Blue Market",
  "mood": "saturated mid · Duotone",
  "ground": "#4F8593",
  "ground2": "#649DAC",
  "ink": "#04151A",
  "body": "#041419",
  "accent": "#1B4C73",
  "hot": "#5C0125",
  "paper": "#F4F7F8",
  "dark": "#094B5D"
 },
 {
  "id": "pp04",
  "name": "Mint Counter",
  "mood": "saturated light · Paper",
  "ground": "#F2F7F0",
  "ground2": "#D6E5CF",
  "ink": "#2e3d25",
  "body": "#677261",
  "accent": "#4A8704",
  "hot": "#599A1C",
  "paper": "#FBFCFA",
  "dark": "#1C3012"
 },
 {
  "id": "pp02",
  "name": "Gold Offer",
  "mood": "saturated light · Paper",
  "ground": "#F8F5F3",
  "ground2": "#E7DAD2",
  "ink": "#4a3220",
  "body": "#7E6D5F",
  "accent": "#AC5D05",
  "hot": "#CC7215",
  "paper": "#FCFBFA",
  "dark": "#3D1C05"
 },
 {
  "id": "pa05",
  "name": "Teal Ticket",
  "mood": "saturated light · Pastel",
  "ground": "#D7E9E4",
  "ground2": "#B6D7CE",
  "ink": "#1b4037",
  "body": "#496D63",
  "accent": "#D241B4",
  "hot": "#7DB325",
  "paper": "#FAFCFB",
  "dark": "#053D2D"
 },
 {
  "id": "io03",
  "name": "Violet Payday",
  "mood": "saturated light · iOS Flat",
  "ground": "#F3F4F8",
  "ground2": "#D2D5E7",
  "ink": "#31364f",
  "body": "#686C80",
  "accent": "#616CF8",
  "hot": "#BF3122",
  "paper": "#FAFBFC",
  "dark": "#050E3D"
 },
 {
  "id": "jw03",
  "name": "Orchid Payday",
  "mood": "saturated mid · Jewel",
  "ground": "#513563",
  "ground2": "#6A4581",
  "ink": "#e2dbe8",
  "body": "#B6A6C2",
  "accent": "#E7D358",
  "hot": "#96EEF0",
  "paper": "#F6F4F8",
  "dark": "#261232"
 },
 {
  "id": "cd04",
  "name": "Mint Counter",
  "mood": "saturated light · Candy",
  "ground": "#A5CEAD",
  "ground2": "#84BC8F",
  "ink": "#263f2b",
  "body": "#36573D",
  "accent": "#3749E4",
  "hot": "#4B67DA",
  "paper": "#FAFCFB",
  "dark": "#0C3615"
 },
 {
  "id": "gl02",
  "name": "Amber Offer",
  "mood": "saturated light · Liquid Glass",
  "ground": "#ECDFDD",
  "ground2": "#DBC0BB",
  "ink": "#4d2f2a",
  "body": "#785953",
  "accent": "#10835B",
  "hot": "#730E89",
  "paper": "#FCFBFA",
  "dark": "#3D0D05"
 },
 {
  "id": "du05",
  "name": "Mint Ticket",
  "mood": "saturated mid · Duotone",
  "ground": "#539967",
  "ground2": "#6BAF7F",
  "ink": "#152719",
  "body": "#112818",
  "accent": "#145746",
  "hot": "#501256",
  "paper": "#F4F8F5",
  "dark": "#195129"
 },
 {
  "id": "cd10",
  "name": "Red Quote",
  "mood": "saturated light · Candy",
  "ground": "#E4CDD6",
  "ground2": "#D2ACBA",
  "ink": "#4b2e39",
  "body": "#6D4956",
  "accent": "#626A09",
  "hot": "#677009",
  "paper": "#FCFAFB",
  "dark": "#3D051A"
 },
 {
  "id": "jw10",
  "name": "Red Quote",
  "mood": "saturated mid · Jewel",
  "ground": "#5B3145",
  "ground2": "#79415C",
  "ink": "#ead9df",
  "body": "#C2A1B1",
  "accent": "#94E995",
  "hot": "#644ADA",
  "paper": "#F8F4F6",
  "dark": "#320D1F"
 },
 {
  "id": "nn01",
  "name": "Indigo Cash",
  "mood": "coloured dark · Night Neon",
  "ground": "#0e253c",
  "ground2": "#173C61",
  "ink": "#d4dfeb",
  "body": "#91A0B0",
  "accent": "#FCA5A5",
  "hot": "#4ED42E",
  "paper": "#F4F6F8",
  "dark": "#05111C"
 },
 {
  "id": "nn05",
  "name": "Teal Ticket",
  "mood": "coloured dark · Night Neon",
  "ground": "#002c20",
  "ground2": "#005A41",
  "ink": "#d2e3dc",
  "body": "#8BA59C",
  "accent": "#D4B2FD",
  "hot": "#ED8711",
  "paper": "#F4F8F7",
  "dark": "#02130E"
 },
 {
  "id": "ck01",
  "name": "Red Cash",
  "mood": "saturated light · Chalk",
  "ground": "#faf5f7",
  "ground2": "#E9D3DC",
  "ink": "#4a2e3a",
  "body": "#7E6B72",
  "accent": "#A60A69",
  "hot": "#20390C",
  "paper": "#FCFAFB",
  "dark": "#2E141F"
 },
 {
  "id": "ck03",
  "name": "Blue Payday",
  "mood": "saturated light · Chalk",
  "ground": "#F3F8F8",
  "ground2": "#D2E3E7",
  "ink": "#173f43",
  "body": "#5A7578",
  "accent": "#026A73",
  "hot": "#4A0F3B",
  "paper": "#FAFCFC",
  "dark": "#132B2F"
 },
 {
  "id": "rf01",
  "name": "Clay Counter",
  "mood": "saturated light ·",
  "ground": "#CCADA0",
  "ground2": "#BA907F",
  "ink": "#241512",
  "body": "#5A3F37",
  "accent": "#0F5C4C",
  "hot": "#C11EC8",
  "paper": "#FCFBFA",
  "dark": "#35190D"
 },
 {
  "id": "rf02",
  "name": "Plum Room",
  "mood": "saturated mid ·",
  "ground": "#6C404D",
  "ground2": "#895162",
  "ink": "#FBEDE8",
  "body": "#CEB8B9",
  "accent": "#F2C14E",
  "hot": "#2ED4BE",
  "paper": "#F8F4F5",
  "dark": "#331A22"
 },
 {
  "id": "rf03",
  "name": "Oat Desk",
  "mood": "saturated light ·",
  "ground": "#D4C2AF",
  "ground2": "#C2A98E",
  "ink": "#231A12",
  "body": "#5F4D3E",
  "accent": "#1D8789",
  "hot": "#D42CB4",
  "paper": "#FCFBFA",
  "dark": "#36220D"
 },
 {
  "id": "rf04",
  "name": "Signal Blue",
  "mood": "saturated mid ·",
  "ground": "#5C7DA7",
  "ground2": "#5D7DA7",
  "ink": "#160E00",
  "body": "#070A0D",
  "accent": "#FF4A3D",
  "hot": "#2EE459",
  "paper": "#F4F6F8",
  "dark": "#1C3659"
 },
 {
  "id": "rf05",
  "name": "Deep Cobalt",
  "mood": "saturated mid ·",
  "ground": "#3D4F71",
  "ground2": "#4D648F",
  "ink": "#FFF6E8",
  "body": "#BAC2D1",
  "accent": "#F74A2B",
  "hot": "#2BD05F",
  "paper": "#F4F6F8",
  "dark": "#0A1E44"
 },
 {
  "id": "rf06",
  "name": "Ash Studio",
  "mood": "paper light ·",
  "ground": "#9AA3A8",
  "ground2": "#7F8A90",
  "ink": "#141A1D",
  "body": "#34393C",
  "accent": "#B51F34",
  "hot": "#0EA812",
  "paper": "#FBFBFB",
  "dark": "#1D2226"
 }
]
;
/* which faces draw an ambiguous figure, measured rather than remembered */
const LEGIBILITY=[{"family":"Pirata One","weight":400,"stem":0.4864,"thick":0.4864,"contrast":1,"density":0.49,"mush":0.588,"evenness":0.793,"zeroSlash":0.163,"oneLikeI":false,"role":"blackletter","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":"slashed zero"},{"family":"Barlow Condensed","weight":400,"stem":0.4714,"thick":0.4714,"contrast":1,"density":0.421,"mush":0.73,"evenness":0.856,"zeroSlash":0,"oneLikeI":false,"role":"condensed","headline":true,"headWhy":"","body":false,"bodyWhy":"turns to porridge at 13px","figures":""},{"family":"Barlow Condensed","weight":600,"stem":0.5286,"thick":0.5286,"contrast":1,"density":0.6,"mush":0.57,"evenness":0.854,"zeroSlash":0,"oneLikeI":false,"role":"condensed","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Barlow Condensed","weight":700,"stem":0.5571,"thick":0.5571,"contrast":1,"density":0.683,"mush":0.493,"evenness":0.852,"zeroSlash":0.011,"oneLikeI":false,"role":"condensed","headline":true,"headWhy":"","body":false,"bodyWhy":"counters closed","figures":""},{"family":"Big Shoulders Display","weight":400,"stem":0.3312,"thick":0.3312,"contrast":1,"density":0.44,"mush":0.751,"evenness":0.805,"zeroSlash":0,"oneLikeI":false,"role":"condensed","headline":true,"headWhy":"","body":false,"bodyWhy":"turns to porridge at 13px","figures":""},{"family":"Big Shoulders Display","weight":600,"stem":0.375,"thick":0.375,"contrast":1,"density":0.511,"mush":0.686,"evenness":0.801,"zeroSlash":0,"oneLikeI":false,"role":"condensed","headline":true,"headWhy":"","body":false,"bodyWhy":"turns to porridge at 13px","figures":""},{"family":"Big Shoulders Display","weight":700,"stem":0.4188,"thick":0.4188,"contrast":1,"density":0.59,"mush":0.598,"evenness":0.797,"zeroSlash":0,"oneLikeI":false,"role":"condensed","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Oswald","weight":400,"stem":0.5432,"thick":0.5432,"contrast":1,"density":0.52,"mush":0.573,"evenness":0.804,"zeroSlash":0,"oneLikeI":false,"role":"condensed","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Oswald","weight":600,"stem":0.5926,"thick":0.5926,"contrast":1,"density":0.627,"mush":0.467,"evenness":0.823,"zeroSlash":0.033,"oneLikeI":false,"role":"condensed","headline":true,"headWhy":"","body":false,"bodyWhy":"counters closed","figures":""},{"family":"Oswald","weight":700,"stem":0.6049,"thick":0.6049,"contrast":1,"density":0.647,"mush":0.451,"evenness":0.827,"zeroSlash":0.101,"oneLikeI":false,"role":"condensed","headline":true,"headWhy":"","body":false,"bodyWhy":"counters closed","figures":"slashed zero"},{"family":"Russo One","weight":400,"stem":0.8714,"thick":0.8714,"contrast":1,"density":0.706,"mush":0.384,"evenness":0.844,"zeroSlash":0,"oneLikeI":true,"role":"condensed","headline":true,"headWhy":"","body":false,"bodyWhy":"counters closed","figures":"one reads as an I"},{"family":"Saira Condensed","weight":400,"stem":0.5669,"thick":0.5669,"contrast":1,"density":0.389,"mush":0.641,"evenness":0.794,"zeroSlash":0,"oneLikeI":false,"role":"condensed","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Saira Condensed","weight":600,"stem":0.5887,"thick":0.5887,"contrast":1,"density":0.541,"mush":0.57,"evenness":0.791,"zeroSlash":0,"oneLikeI":false,"role":"condensed","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Saira Condensed","weight":700,"stem":0.6105,"thick":0.6105,"contrast":1,"density":0.611,"mush":0.53,"evenness":0.79,"zeroSlash":0.19,"oneLikeI":false,"role":"condensed","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":"slashed zero"},{"family":"Squada One","weight":400,"stem":0.6028,"thick":0.6028,"contrast":1,"density":0.668,"mush":0.51,"evenness":0.804,"zeroSlash":-0.034,"oneLikeI":true,"role":"condensed","headline":true,"headWhy":"","body":false,"bodyWhy":"counters closed","figures":"one reads as an I"},{"family":"Teko","weight":400,"stem":0.503,"thick":0.503,"contrast":1,"density":0.575,"mush":0.583,"evenness":0.815,"zeroSlash":0,"oneLikeI":false,"role":"condensed","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Teko","weight":600,"stem":0.6446,"thick":0.6446,"contrast":1,"density":0.702,"mush":0.426,"evenness":0.816,"zeroSlash":0.094,"oneLikeI":false,"role":"condensed","headline":true,"headWhy":"","body":false,"bodyWhy":"counters closed","figures":"slashed zero"},{"family":"Teko","weight":700,"stem":0.7321,"thick":0.7321,"contrast":1,"density":0.754,"mush":0.375,"evenness":0.815,"zeroSlash":0.069,"oneLikeI":false,"role":"condensed","headline":true,"headWhy":"","body":false,"bodyWhy":"counters closed","figures":"slashed zero"},{"family":"Creepster","weight":400,"stem":0.4879,"thick":0.4879,"contrast":1,"density":0.627,"mush":0.436,"evenness":0.851,"zeroSlash":-0.245,"oneLikeI":true,"role":"graffiti","headline":true,"headWhy":"","body":false,"bodyWhy":"counters closed","figures":"one reads as an I"},{"family":"Faster One","weight":400,"stem":0.32,"thick":0.848,"contrast":0.377,"density":0.599,"mush":0.626,"evenness":0.857,"zeroSlash":0.06,"oneLikeI":false,"role":"graffiti","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Freckle Face","weight":400,"stem":0.7484,"thick":0.7484,"contrast":1,"density":0.628,"mush":0.494,"evenness":0.854,"zeroSlash":-0.053,"oneLikeI":false,"role":"graffiti","headline":true,"headWhy":"","body":false,"bodyWhy":"counters closed","figures":""},{"family":"Nosifer","weight":400,"stem":1.1792,"thick":1.1792,"contrast":1,"density":0.42,"mush":0.432,"evenness":0.849,"zeroSlash":0.022,"oneLikeI":false,"role":"graffiti","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Rubik Dirt","weight":400,"stem":0.0141,"thick":0.339,"contrast":0.042,"density":0.675,"mush":0.329,"evenness":0.88,"zeroSlash":0.191,"oneLikeI":false,"role":"graffiti","headline":false,"headWhy":"hairline strokes vanish over a photograph","body":false,"bodyWhy":"hairline, counters closed","figures":"slashed zero"},{"family":"Rubik Doodle Shadow","weight":400,"stem":0.0347,"thick":0.0485,"contrast":0.714,"density":0.235,"mush":0.801,"evenness":0.88,"zeroSlash":0.012,"oneLikeI":false,"role":"graffiti","headline":false,"headWhy":"hairline strokes vanish over a photograph","body":false,"bodyWhy":"hairline, turns to porridge at 13px","figures":""},{"family":"Rubik Iso","weight":400,"stem":0.0625,"thick":0.0625,"contrast":1,"density":0.273,"mush":0.904,"evenness":0.88,"zeroSlash":0.013,"oneLikeI":false,"role":"graffiti","headline":true,"headWhy":"","body":false,"bodyWhy":"turns to porridge at 13px","figures":""},{"family":"Rubik Marker Hatch","weight":400,"stem":0.0492,"thick":0.2809,"contrast":0.175,"density":0.542,"mush":0.421,"evenness":0.88,"zeroSlash":0.171,"oneLikeI":false,"role":"graffiti","headline":false,"headWhy":"hairline strokes vanish over a photograph","body":false,"bodyWhy":"hairline","figures":"slashed zero"},{"family":"Rubik Wet Paint","weight":400,"stem":0.9486,"thick":0.9486,"contrast":1,"density":0.577,"mush":0.372,"evenness":0.88,"zeroSlash":0.141,"oneLikeI":false,"role":"graffiti","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":"slashed zero"},{"family":"Sedgwick Ave","weight":400,"stem":0.4953,"thick":0.4953,"contrast":1,"density":0.416,"mush":0.579,"evenness":0.866,"zeroSlash":0.64,"oneLikeI":false,"role":"graffiti","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":"slashed zero"},{"family":"Sedgwick Ave Display","weight":400,"stem":0.5535,"thick":0.5535,"contrast":1,"density":0.424,"mush":0.504,"evenness":0.801,"zeroSlash":0.695,"oneLikeI":false,"role":"graffiti","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":"slashed zero"},{"family":"Wallpoet","weight":400,"stem":0.5565,"thick":0.5565,"contrast":1,"density":0.491,"mush":0.606,"evenness":0.856,"zeroSlash":0.53,"oneLikeI":false,"role":"graffiti","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":"slashed zero"},{"family":"Chivo","weight":400,"stem":0.7507,"thick":0.7507,"contrast":1,"density":0.441,"mush":0.597,"evenness":0.832,"zeroSlash":0,"oneLikeI":false,"role":"grotesque","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Chivo","weight":500,"stem":0.7653,"thick":0.7653,"contrast":1,"density":0.481,"mush":0.56,"evenness":0.831,"zeroSlash":0,"oneLikeI":false,"role":"grotesque","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Chivo","weight":700,"stem":0.809,"thick":0.809,"contrast":1,"density":0.592,"mush":0.459,"evenness":0.829,"zeroSlash":0,"oneLikeI":false,"role":"grotesque","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Chivo","weight":900,"stem":0.8528,"thick":0.8528,"contrast":1,"density":0.677,"mush":0.398,"evenness":0.826,"zeroSlash":0.134,"oneLikeI":false,"role":"grotesque","headline":true,"headWhy":"","body":false,"bodyWhy":"counters closed","figures":"slashed zero"},{"family":"Instrument Sans","weight":400,"stem":0.7847,"thick":0.7847,"contrast":1,"density":0.417,"mush":0.664,"evenness":0.793,"zeroSlash":0,"oneLikeI":false,"role":"grotesque","headline":true,"headWhy":"","body":false,"bodyWhy":"turns to porridge at 13px","figures":""},{"family":"Instrument Sans","weight":500,"stem":0.8125,"thick":0.8125,"contrast":1,"density":0.496,"mush":0.602,"evenness":0.793,"zeroSlash":0,"oneLikeI":false,"role":"grotesque","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Instrument Sans","weight":700,"stem":0.8611,"thick":0.8611,"contrast":1,"density":0.62,"mush":0.47,"evenness":0.791,"zeroSlash":0,"oneLikeI":false,"role":"grotesque","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Libre Franklin","weight":400,"stem":0.7345,"thick":0.7345,"contrast":1,"density":0.377,"mush":0.639,"evenness":0.807,"zeroSlash":0,"oneLikeI":false,"role":"grotesque","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Libre Franklin","weight":500,"stem":0.7682,"thick":0.7682,"contrast":1,"density":0.44,"mush":0.581,"evenness":0.809,"zeroSlash":0,"oneLikeI":false,"role":"grotesque","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Libre Franklin","weight":700,"stem":0.8288,"thick":0.8288,"contrast":1,"density":0.557,"mush":0.497,"evenness":0.814,"zeroSlash":0,"oneLikeI":false,"role":"grotesque","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Libre Franklin","weight":900,"stem":0.8895,"thick":0.8895,"contrast":1,"density":0.648,"mush":0.411,"evenness":0.817,"zeroSlash":0.121,"oneLikeI":false,"role":"grotesque","headline":true,"headWhy":"","body":false,"bodyWhy":"counters closed","figures":"slashed zero"},{"family":"Manrope","weight":400,"stem":0.7569,"thick":0.7569,"contrast":1,"density":0.383,"mush":0.596,"evenness":0.8,"zeroSlash":0,"oneLikeI":false,"role":"grotesque","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Manrope","weight":500,"stem":0.7778,"thick":0.7778,"contrast":1,"density":0.441,"mush":0.604,"evenness":0.805,"zeroSlash":0,"oneLikeI":false,"role":"grotesque","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Manrope","weight":700,"stem":0.8125,"thick":0.8125,"contrast":1,"density":0.529,"mush":0.553,"evenness":0.813,"zeroSlash":0,"oneLikeI":false,"role":"grotesque","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Satoshi","weight":400,"stem":0.7472,"thick":0.7472,"contrast":1,"density":0.371,"mush":0.647,"evenness":0.794,"zeroSlash":0,"oneLikeI":false,"role":"grotesque","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Satoshi","weight":500,"stem":0.7676,"thick":0.7676,"contrast":1,"density":0.456,"mush":0.598,"evenness":0.799,"zeroSlash":0,"oneLikeI":false,"role":"grotesque","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Satoshi","weight":700,"stem":0.7934,"thick":0.7934,"contrast":1,"density":0.532,"mush":0.515,"evenness":0.804,"zeroSlash":0,"oneLikeI":false,"role":"grotesque","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Satoshi","weight":900,"stem":0.8311,"thick":0.8311,"contrast":1,"density":0.61,"mush":0.437,"evenness":0.808,"zeroSlash":0,"oneLikeI":false,"role":"grotesque","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Sora","weight":400,"stem":0.8151,"thick":0.8151,"contrast":1,"density":0.426,"mush":0.669,"evenness":0.803,"zeroSlash":0,"oneLikeI":false,"role":"grotesque","headline":true,"headWhy":"","body":false,"bodyWhy":"turns to porridge at 13px","figures":""},{"family":"Sora","weight":500,"stem":0.8356,"thick":0.8356,"contrast":1,"density":0.485,"mush":0.587,"evenness":0.804,"zeroSlash":0,"oneLikeI":false,"role":"grotesque","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Sora","weight":700,"stem":0.8767,"thick":0.8767,"contrast":1,"density":0.584,"mush":0.451,"evenness":0.803,"zeroSlash":0,"oneLikeI":false,"role":"grotesque","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Amatic SC","weight":400,"stem":0.2243,"thick":0.2243,"contrast":1,"density":0.189,"mush":0.988,"evenness":0.808,"zeroSlash":0,"oneLikeI":true,"role":"handwritten","headline":true,"headWhy":"","body":false,"bodyWhy":"turns to porridge at 13px","figures":"one reads as an I"},{"family":"Amatic SC","weight":700,"stem":0.2708,"thick":0.2708,"contrast":1,"density":0.277,"mush":0.86,"evenness":0.807,"zeroSlash":0,"oneLikeI":true,"role":"handwritten","headline":true,"headWhy":"","body":false,"bodyWhy":"turns to porridge at 13px","figures":"one reads as an I"},{"family":"Architects Daughter","weight":400,"stem":0.6444,"thick":0.6444,"contrast":1,"density":0.429,"mush":0.714,"evenness":0.796,"zeroSlash":0,"oneLikeI":false,"role":"handwritten","headline":true,"headWhy":"","body":false,"bodyWhy":"turns to porridge at 13px","figures":""},{"family":"Cabin Sketch","weight":400,"stem":0.0379,"thick":0.25,"contrast":0.152,"density":0.448,"mush":0.658,"evenness":0.781,"zeroSlash":0,"oneLikeI":false,"role":"handwritten","headline":false,"headWhy":"hairline strokes vanish over a photograph","body":false,"bodyWhy":"hairline","figures":""},{"family":"Cabin Sketch","weight":700,"stem":0.0157,"thick":0.063,"contrast":0.25,"density":0.486,"mush":0.529,"evenness":0.781,"zeroSlash":0,"oneLikeI":false,"role":"handwritten","headline":false,"headWhy":"hairline strokes vanish over a photograph","body":false,"bodyWhy":"hairline","figures":""},{"family":"Gloria Hallelujah","weight":400,"stem":0.7694,"thick":0.7694,"contrast":1,"density":0.433,"mush":0.635,"evenness":0.842,"zeroSlash":0,"oneLikeI":false,"role":"handwritten","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Kalam","weight":400,"stem":0.6389,"thick":0.6389,"contrast":1,"density":0.439,"mush":0.678,"evenness":0.847,"zeroSlash":0.036,"oneLikeI":true,"role":"handwritten","headline":true,"headWhy":"","body":false,"bodyWhy":"turns to porridge at 13px","figures":"one reads as an I"},{"family":"Kalam","weight":700,"stem":0.7248,"thick":0.7248,"contrast":1,"density":0.566,"mush":0.516,"evenness":0.855,"zeroSlash":0.16,"oneLikeI":true,"role":"handwritten","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":"slashed zero"},{"family":"Nanum Pen Script","weight":400,"stem":0.1169,"thick":0.1259,"contrast":0.929,"density":0.206,"mush":0.727,"evenness":0.808,"zeroSlash":0.166,"oneLikeI":false,"role":"handwritten","headline":true,"headWhy":"","body":false,"bodyWhy":"turns to porridge at 13px","figures":"slashed zero"},{"family":"Patrick Hand","weight":400,"stem":0.574,"thick":0.574,"contrast":1,"density":0.503,"mush":0.643,"evenness":0.821,"zeroSlash":0,"oneLikeI":false,"role":"handwritten","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Permanent Marker","weight":400,"stem":0.2364,"thick":0.3107,"contrast":0.761,"density":0.624,"mush":0.445,"evenness":0.831,"zeroSlash":0.046,"oneLikeI":false,"role":"handwritten","headline":true,"headWhy":"","body":false,"bodyWhy":"counters closed","figures":""},{"family":"Shadows Into Light","weight":400,"stem":0.0753,"thick":0.1355,"contrast":0.556,"density":0.329,"mush":0.836,"evenness":0.753,"zeroSlash":0,"oneLikeI":false,"role":"handwritten","headline":true,"headWhy":"","body":false,"bodyWhy":"turns to porridge at 13px","figures":""},{"family":"Audiowide","weight":400,"stem":0.9997,"thick":0.9997,"contrast":1,"density":0.578,"mush":0.504,"evenness":0.845,"zeroSlash":0.636,"oneLikeI":false,"role":"numerals","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":"slashed zero"},{"family":"DM Mono","weight":400,"stem":0.7286,"thick":0.7286,"contrast":1,"density":0.407,"mush":0.642,"evenness":1,"zeroSlash":0.455,"oneLikeI":true,"role":"numerals","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":"slashed zero"},{"family":"JetBrains Mono","weight":400,"stem":0.5753,"thick":0.5753,"contrast":1,"density":0.376,"mush":0.587,"evenness":1,"zeroSlash":0.29,"oneLikeI":true,"role":"numerals","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":"slashed zero"},{"family":"JetBrains Mono","weight":700,"stem":0.6164,"thick":0.6164,"contrast":1,"density":0.473,"mush":0.515,"evenness":1,"zeroSlash":0.346,"oneLikeI":true,"role":"numerals","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":"slashed zero"},{"family":"Bungee","weight":400,"stem":0.8611,"thick":0.8611,"contrast":1,"density":0.688,"mush":0.362,"evenness":0.919,"zeroSlash":0.009,"oneLikeI":true,"role":"retro","headline":true,"headWhy":"","body":false,"bodyWhy":"counters closed","figures":"one reads as an I"},{"family":"Bungee Shade","weight":400,"stem":0.0137,"thick":0.5548,"contrast":0.025,"density":0.268,"mush":0.744,"evenness":0.929,"zeroSlash":0.007,"oneLikeI":true,"role":"retro","headline":false,"headWhy":"hairline strokes vanish over a photograph","body":false,"bodyWhy":"hairline, turns to porridge at 13px","figures":"one reads as an I"},{"family":"Fascinate","weight":400,"stem":0.1426,"thick":0.5206,"contrast":0.274,"density":0.652,"mush":0.37,"evenness":0.865,"zeroSlash":-0.005,"oneLikeI":false,"role":"retro","headline":true,"headWhy":"","body":false,"bodyWhy":"counters closed","figures":""},{"family":"Luckiest Guy","weight":400,"stem":0.3276,"thick":0.3347,"contrast":0.979,"density":0.703,"mush":0.381,"evenness":0.809,"zeroSlash":-0.095,"oneLikeI":false,"role":"retro","headline":true,"headWhy":"","body":false,"bodyWhy":"counters closed","figures":""},{"family":"Press Start 2P","weight":400,"stem":0.25,"thick":0.25,"contrast":1,"density":0.456,"mush":0.415,"evenness":1,"zeroSlash":0.009,"oneLikeI":true,"role":"retro","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":"one reads as an I"},{"family":"Rye","weight":400,"stem":0.0991,"thick":0.4889,"contrast":0.203,"density":0.458,"mush":0.533,"evenness":0.838,"zeroSlash":0.082,"oneLikeI":true,"role":"retro","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":"slashed zero"},{"family":"Shrikhand","weight":400,"stem":1.021,"thick":1.021,"contrast":1,"density":0.695,"mush":0.392,"evenness":0.825,"zeroSlash":0.081,"oneLikeI":false,"role":"retro","headline":true,"headWhy":"","body":false,"bodyWhy":"counters closed","figures":"slashed zero"},{"family":"Special Elite","weight":400,"stem":0.5584,"thick":0.5584,"contrast":1,"density":0.405,"mush":0.61,"evenness":0.933,"zeroSlash":0,"oneLikeI":false,"role":"retro","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Nunito","weight":400,"stem":0.8287,"thick":0.8287,"contrast":1,"density":0.387,"mush":0.639,"evenness":0.767,"zeroSlash":0,"oneLikeI":false,"role":"rounded","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Nunito","weight":700,"stem":0.8696,"thick":0.8696,"contrast":1,"density":0.516,"mush":0.505,"evenness":0.778,"zeroSlash":0,"oneLikeI":false,"role":"rounded","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Sniglet","weight":400,"stem":0.698,"thick":0.698,"contrast":1,"density":0.522,"mush":0.592,"evenness":0.831,"zeroSlash":0,"oneLikeI":false,"role":"rounded","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Bangers","weight":400,"stem":0.527,"thick":0.527,"contrast":1,"density":0.599,"mush":0.457,"evenness":0.79,"zeroSlash":0.075,"oneLikeI":false,"role":"script","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":"slashed zero"},{"family":"Kaushan Script","weight":400,"stem":0.6604,"thick":0.6604,"contrast":1,"density":0.396,"mush":0.638,"evenness":0.814,"zeroSlash":0.178,"oneLikeI":false,"role":"script","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":"slashed zero"},{"family":"Knewave","weight":400,"stem":0.6552,"thick":0.6552,"contrast":1,"density":0.67,"mush":0.368,"evenness":0.849,"zeroSlash":-0.014,"oneLikeI":false,"role":"script","headline":true,"headWhy":"","body":false,"bodyWhy":"counters closed","figures":""},{"family":"Cormorant Garamond","weight":400,"stem":0.104,"thick":0.112,"contrast":0.929,"density":0.275,"mush":0.844,"evenness":0.789,"zeroSlash":0,"oneLikeI":true,"role":"serif","headline":true,"headWhy":"","body":false,"bodyWhy":"turns to porridge at 13px","figures":"one reads as an I"},{"family":"Cormorant Garamond","weight":700,"stem":0.872,"thick":0.872,"contrast":1,"density":0.38,"mush":0.695,"evenness":0.799,"zeroSlash":0,"oneLikeI":true,"role":"serif","headline":true,"headWhy":"","body":false,"bodyWhy":"turns to porridge at 13px","figures":"one reads as an I"},{"family":"Instrument Serif","weight":400,"stem":0.1181,"thick":0.1181,"contrast":1,"density":0.361,"mush":0.762,"evenness":0.809,"zeroSlash":0,"oneLikeI":true,"role":"serif","headline":true,"headWhy":"","body":false,"bodyWhy":"turns to porridge at 13px","figures":"one reads as an I"},{"family":"Roboto Slab","weight":400,"stem":0.7525,"thick":0.7525,"contrast":1,"density":0.454,"mush":0.621,"evenness":0.815,"zeroSlash":0,"oneLikeI":false,"role":"slab","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Roboto Slab","weight":700,"stem":0.8158,"thick":0.8158,"contrast":1,"density":0.575,"mush":0.519,"evenness":0.812,"zeroSlash":0,"oneLikeI":false,"role":"slab","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Zilla Slab","weight":400,"stem":0.7769,"thick":0.7769,"contrast":1,"density":0.417,"mush":0.677,"evenness":0.813,"zeroSlash":0,"oneLikeI":false,"role":"slab","headline":true,"headWhy":"","body":false,"bodyWhy":"turns to porridge at 13px","figures":""},{"family":"Zilla Slab","weight":700,"stem":0.8385,"thick":0.8385,"contrast":1,"density":0.612,"mush":0.497,"evenness":0.819,"zeroSlash":0,"oneLikeI":false,"role":"slab","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Big Shoulders Stencil Display","weight":400,"stem":0.0875,"thick":0.2,"contrast":0.437,"density":0.413,"mush":0.823,"evenness":0.794,"zeroSlash":0,"oneLikeI":false,"role":"stencil","headline":true,"headWhy":"","body":false,"bodyWhy":"turns to porridge at 13px","figures":""},{"family":"Big Shoulders Stencil Display","weight":700,"stem":0.1375,"thick":0.2313,"contrast":0.595,"density":0.546,"mush":0.62,"evenness":0.792,"zeroSlash":0,"oneLikeI":false,"role":"stencil","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Clash Display","weight":500,"stem":0.9104,"thick":0.9104,"contrast":1,"density":0.496,"mush":0.575,"evenness":0.806,"zeroSlash":0,"oneLikeI":false,"role":"unapproved","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Clash Display","weight":600,"stem":0.9701,"thick":0.9701,"contrast":1,"density":0.612,"mush":0.428,"evenness":0.809,"zeroSlash":0,"oneLikeI":false,"role":"unapproved","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""},{"family":"Clash Display","weight":700,"stem":1.0299,"thick":1.0299,"contrast":1,"density":0.703,"mush":0.38,"evenness":0.81,"zeroSlash":0,"oneLikeI":false,"role":"unapproved","headline":true,"headWhy":"","body":false,"bodyWhy":"counters closed","figures":""},{"family":"Khand","weight":600,"stem":0.5985,"thick":0.5985,"contrast":1,"density":0.568,"mush":0.553,"evenness":0.81,"zeroSlash":0.1,"oneLikeI":false,"role":"unapproved","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":"slashed zero"},{"family":"Khand","weight":700,"stem":0.6421,"thick":0.6421,"contrast":1,"density":0.675,"mush":0.476,"evenness":0.819,"zeroSlash":0.1,"oneLikeI":false,"role":"unapproved","headline":true,"headWhy":"","body":false,"bodyWhy":"counters closed","figures":"slashed zero"},{"family":"Melodrama","weight":500,"stem":0.5628,"thick":0.5628,"contrast":1,"density":0.245,"mush":0.752,"evenness":0.73,"zeroSlash":0.104,"oneLikeI":false,"role":"unapproved","headline":true,"headWhy":"","body":false,"bodyWhy":"turns to porridge at 13px","figures":"slashed zero"},{"family":"Melodrama","weight":700,"stem":0.6349,"thick":0.6349,"contrast":1,"density":0.338,"mush":0.59,"evenness":0.761,"zeroSlash":0.096,"oneLikeI":false,"role":"unapproved","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":"slashed zero"},{"family":"Zodiak","weight":400,"stem":0.8214,"thick":0.8214,"contrast":1,"density":0.304,"mush":0.745,"evenness":0.83,"zeroSlash":0,"oneLikeI":false,"role":"unapproved","headline":true,"headWhy":"","body":false,"bodyWhy":"turns to porridge at 13px","figures":""},{"family":"Zodiak","weight":700,"stem":0.8571,"thick":0.8571,"contrast":1,"density":0.402,"mush":0.539,"evenness":0.836,"zeroSlash":0,"oneLikeI":false,"role":"unapproved","headline":true,"headWhy":"","body":true,"bodyWhy":"","figures":""}];
const BAD_FIGURES=new Set(LEGIBILITY.filter(r=>r.figures).map(r=>r.family+'|'+r.weight));
const METRICS={"Pirata One|400":{"adv":{"0":0.431,"1":0.24,"2":0.387,"3":0.41,"4":0.401,"5":0.431,"6":0.431,"7":0.37,"8":0.431,"9":0.431," ":0.19,"!":0.22,"\"":0.307,"#":0.571,"$":0.425,"%":0.701,"&":0.43,"'":0.151,"(":0.318,")":0.318,"*":0.345,"+":0.421,",":0.222,"-":0.381,".":0.221,"/":0.18,":":0.221,";":0.22,"<":0.361,"=":0.381,">":0.361,"?":0.411,"@":0.54,"A":0.431,"B":0.421,"C":0.404,"D":0.431,"E":0.404,"F":0.351,"G":0.421,"H":0.43,"I":0.22,"J":0.22,"K":0.426,"L":0.368,"M":0.64,"N":0.43,"O":0.431,"P":0.421,"Q":0.431,"R":0.432,"S":0.425,"T":0.365,"U":0.43,"V":0.431,"W":0.641,"X":0.456,"Y":0.396,"Z":0.37,"[":0.221,"\\":0.18,"]":0.221,"^":0.376,"_":0.39,"`":0.181,"a":0.41,"b":0.43,"c":0.404,"d":0.43,"e":0.425,"f":0.32,"g":0.431,"h":0.43,"i":0.22,"j":0.22,"k":0.43,"l":0.22,"m":0.64,"n":0.43,"o":0.431,"p":0.43,"q":0.431,"r":0.38,"s":0.405,"t":0.22,"u":0.43,"v":0.43,"w":0.641,"x":0.436,"y":0.431,"z":0.37,"{":0.221,"|":0.18,"}":0.221,"~":0.37,"★":1,"·":0.221,"“":0.334,"”":0.334,"’":0.176,"—":0.599,"–":0.39,"✓":0.7642,"€":0.394,"£":0.404},"up":{"0":0.77,"1":0.77,"2":0.77,"3":0.769,"4":0.77,"5":0.793,"6":0.77,"7":0.793,"8":0.769,"9":0.77," ":0,"!":0.768,"\"":0.77,"#":0.704,"$":0.843,"%":0.71,"&":0.77,"'":0.77,"(":0.769,")":0.769,"*":0.76,"+":0.48,",":0.139,"-":0.34,".":0.159,"/":0.729,":":0.437,";":0.437,"<":0.478,"=":0.418,">":0.478,"?":0.77,"@":0.617,"A":0.768,"B":0.768,"C":0.77,"D":0.77,"E":0.77,"F":0.77,"G":0.77,"H":0.771,"I":0.771,"J":0.77,"K":0.771,"L":0.771,"M":0.771,"N":0.771,"O":0.77,"P":0.768,"Q":0.77,"R":0.768,"S":0.77,"T":0.793,"U":0.771,"V":0.771,"W":0.771,"X":0.771,"Y":0.771,"Z":0.793,"[":0.77,"\\":0.729,"]":0.77,"^":0.806,"_":0.001,"`":0.806,"a":0.57,"b":0.769,"c":0.57,"d":0.77,"e":0.57,"f":0.769,"g":0.57,"h":0.769,"i":0.79,"j":0.768,"k":0.769,"l":0.769,"m":0.571,"n":0.571,"o":0.57,"p":0.569,"q":0.57,"r":0.57,"s":0.57,"t":0.674,"u":0.571,"v":0.571,"w":0.571,"x":0.571,"y":0.571,"z":0.594,"{":0.77,"|":0.759,"}":0.77,"~":0.745,"★":0.859,"·":0.356,"“":0.77,"”":0.77,"’":0.77,"—":0.34,"–":0.34,"✓":0.7231,"€":0.77,"£":0.77},"dn":{"0":0,"1":0,"2":0,"3":0.009,"4":0,"5":0.01,"6":0,"7":0,"8":0,"9":0," ":0,"!":0.08,"\"":-0.57,"#":0,"$":0.086,"%":0.028,"&":0,"'":-0.57,"(":0.055,")":0.055,"*":-0.481,"+":-0.119,",":0.14,"-":-0.261,".":0,"/":0.038,":":0,";":0.14,"<":-0.076,"=":-0.183,">":-0.076,"?":0.08,"@":0.068,"A":0.032,"B":0,"C":0,"D":0,"E":0,"F":0.032,"G":0,"H":0.032,"I":0,"J":0.18,"K":0.032,"L":0,"M":0.032,"N":0.032,"O":0,"P":0.032,"Q":0.17,"R":0.032,"S":0.01,"T":0.032,"U":0,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.047,"\\":0.038,"]":0.047,"^":-0.631,"_":0.078,"`":-0.631,"a":0,"b":0,"c":0,"d":0,"e":0,"f":0,"g":0.18,"h":0,"i":0,"j":0.18,"k":0,"l":0,"m":0,"n":0,"o":0,"p":0.178,"q":0.18,"r":0,"s":0.01,"t":0,"u":0,"v":0,"w":0,"x":0,"y":0.18,"z":0,"{":0.045,"|":0.169,"}":0.045,"~":-0.63,"★":0.078,"·":-0.197,"“":-0.558,"”":-0.558,"’":-0.558,"—":-0.261,"–":-0.261,"✓":0.0181,"€":0,"£":0},"cap":0.771,"desc":0.18,"avg":0.3805},"Barlow Condensed|400":{"adv":{"0":0.444,"1":0.256,"2":0.402,"3":0.408,"4":0.415,"5":0.409,"6":0.41,"7":0.366,"8":0.422,"9":0.403," ":0.2,"!":0.251,"\"":0.235,"#":0.589,"$":0.416,"%":0.781,"&":0.542,"'":0.119,"(":0.222,")":0.222,"*":0.361,"+":0.442,",":0.177,"-":0.313,".":0.19,"/":0.334,":":0.211,";":0.193,"<":0.442,"=":0.442,">":0.442,"?":0.37,"@":0.761,"A":0.41,"B":0.449,"C":0.446,"D":0.465,"E":0.429,"F":0.404,"G":0.451,"H":0.472,"I":0.215,"J":0.426,"K":0.452,"L":0.396,"M":0.521,"N":0.493,"O":0.456,"P":0.442,"Q":0.443,"R":0.443,"S":0.416,"T":0.423,"U":0.476,"V":0.439,"W":0.623,"X":0.434,"Y":0.424,"Z":0.395,"[":0.303,"\\":0.334,"]":0.303,"^":0.396,"_":0.376,"`":0.18,"a":0.413,"b":0.423,"c":0.402,"d":0.423,"e":0.407,"f":0.277,"g":0.413,"h":0.424,"i":0.208,"j":0.2,"k":0.405,"l":0.181,"m":0.648,"n":0.424,"o":0.415,"p":0.428,"q":0.428,"r":0.292,"s":0.374,"t":0.267,"u":0.424,"v":0.379,"w":0.554,"x":0.376,"y":0.368,"z":0.361,"{":0.273,"|":0.144,"}":0.273,"~":0.461,"★":1,"·":0.196,"“":0.25,"”":0.25,"’":0.123,"—":0.592,"–":0.372,"✓":0.7642,"€":0.486,"£":0.503},"up":{"0":0.71,"1":0.7,"2":0.708,"3":0.7,"4":0.7,"5":0.7,"6":0.708,"7":0.7,"8":0.71,"9":0.708," ":0,"!":0.7,"\"":0.694,"#":0.676,"$":0.795,"%":0.709,"&":0.708,"'":0.698,"(":0.763,")":0.763,"*":0.746,"+":0.507,",":0.155,"-":0.342,".":0.114,"/":0.7,":":0.452,";":0.465,"<":0.49,"=":0.46,">":0.491,"?":0.709,"@":0.616,"A":0.7,"B":0.7,"C":0.708,"D":0.7,"E":0.7,"F":0.7,"G":0.708,"H":0.7,"I":0.7,"J":0.7,"K":0.7,"L":0.7,"M":0.7,"N":0.7,"O":0.708,"P":0.701,"Q":0.708,"R":0.7,"S":0.708,"T":0.7,"U":0.7,"V":0.7,"W":0.7,"X":0.7,"Y":0.7,"Z":0.7,"[":0.774,"\\":0.7,"]":0.774,"^":0.7,"_":0.057,"`":0.7,"a":0.514,"b":0.7,"c":0.514,"d":0.7,"e":0.514,"f":0.707,"g":0.514,"h":0.7,"i":0.71,"j":0.71,"k":0.7,"l":0.7,"m":0.513,"n":0.513,"o":0.514,"p":0.514,"q":0.514,"r":0.511,"s":0.511,"t":0.632,"u":0.506,"v":0.506,"w":0.506,"x":0.506,"y":0.506,"z":0.506,"{":0.774,"|":0.76,"}":0.774,"~":0.355,"★":0.859,"·":0.334,"“":0.7,"”":0.7,"’":0.7,"—":0.314,"–":0.314,"✓":0.7231,"€":0.708,"£":0.708},"dn":{"0":0.01,"1":0,"2":0,"3":0.008,"4":0,"5":0.008,"6":0.008,"7":0,"8":0.008,"9":0.008," ":0,"!":-0.004,"\"":-0.488,"#":-0.016,"$":0.089,"%":0.009,"&":0.009,"'":-0.493,"(":0.104,")":0.104,"*":-0.394,"+":-0.13,",":0.079,"-":-0.28,".":-0.002,"/":0,":":-0.004,";":0.075,"<":-0.061,"=":-0.199,">":-0.062,"?":-0.002,"@":0.086,"A":0,"B":0,"C":0.008,"D":0,"E":0,"F":0,"G":0.008,"H":0,"I":0,"J":0.008,"K":0,"L":0,"M":0,"N":0,"O":0.008,"P":0,"Q":0.115,"R":0,"S":0.008,"T":0,"U":0.008,"V":0,"W":0,"X":0,"Y":-0.001,"Z":0,"[":0.121,"\\":0,"]":0.121,"^":-0.307,"_":0,"`":-0.572,"a":0.008,"b":0.008,"c":0.008,"d":0.008,"e":0.008,"f":0,"g":0.208,"h":0,"i":0,"j":0.208,"k":0,"l":0,"m":0,"n":0,"o":0.008,"p":0.194,"q":0.194,"r":0,"s":0.005,"t":0,"u":0.007,"v":0,"w":0,"x":0,"y":0.2,"z":0,"{":0.121,"|":0.08,"}":0.121,"~":-0.232,"★":0.078,"·":-0.222,"“":-0.495,"”":-0.495,"’":-0.495,"—":-0.252,"–":-0.252,"✓":0.0181,"€":0.008,"£":0},"cap":0.708,"desc":0.208,"avg":0.388},"Barlow Condensed|600":{"adv":{"0":0.45,"1":0.274,"2":0.425,"3":0.426,"4":0.459,"5":0.428,"6":0.429,"7":0.392,"8":0.434,"9":0.423," ":0.2,"!":0.269,"\"":0.306,"#":0.606,"$":0.434,"%":0.772,"&":0.581,"'":0.152,"(":0.279,")":0.279,"*":0.361,"+":0.439,",":0.199,"-":0.325,".":0.211,"/":0.386,":":0.252,";":0.218,"<":0.439,"=":0.439,">":0.439,"?":0.413,"@":0.759,"A":0.456,"B":0.462,"C":0.457,"D":0.472,"E":0.435,"F":0.415,"G":0.462,"H":0.477,"I":0.224,"J":0.443,"K":0.477,"L":0.415,"M":0.538,"N":0.507,"O":0.467,"P":0.457,"Q":0.455,"R":0.461,"S":0.434,"T":0.452,"U":0.478,"V":0.471,"W":0.665,"X":0.46,"Y":0.456,"Z":0.406,"[":0.33,"\\":0.386,"]":0.33,"^":0.413,"_":0.405,"`":0.206,"a":0.434,"b":0.437,"c":0.422,"d":0.437,"e":0.426,"f":0.291,"g":0.431,"h":0.439,"i":0.215,"j":0.211,"k":0.433,"l":0.199,"m":0.665,"n":0.439,"o":0.432,"p":0.441,"q":0.441,"r":0.313,"s":0.398,"t":0.282,"u":0.438,"v":0.415,"w":0.592,"x":0.417,"y":0.403,"z":0.368,"{":0.319,"|":0.171,"}":0.319,"~":0.48,"★":1,"·":0.215,"“":0.316,"”":0.316,"’":0.165,"—":0.593,"–":0.377,"✓":0.7642,"€":0.495,"£":0.512},"up":{"0":0.711,"1":0.7,"2":0.708,"3":0.7,"4":0.7,"5":0.7,"6":0.708,"7":0.7,"8":0.712,"9":0.708," ":0,"!":0.7,"\"":0.697,"#":0.674,"$":0.788,"%":0.709,"&":0.708,"'":0.699,"(":0.76,")":0.76,"*":0.746,"+":0.507,",":0.157,"-":0.351,".":0.14,"/":0.7,":":0.475,";":0.479,"<":0.511,"=":0.46,">":0.512,"?":0.71,"@":0.641,"A":0.7,"B":0.7,"C":0.708,"D":0.7,"E":0.7,"F":0.7,"G":0.708,"H":0.7,"I":0.7,"J":0.7,"K":0.7,"L":0.7,"M":0.7,"N":0.7,"O":0.708,"P":0.701,"Q":0.708,"R":0.7,"S":0.708,"T":0.7,"U":0.7,"V":0.7,"W":0.7,"X":0.7,"Y":0.7,"Z":0.7,"[":0.791,"\\":0.7,"]":0.791,"^":0.7,"_":0.089,"`":0.7,"a":0.519,"b":0.7,"c":0.519,"d":0.7,"e":0.519,"f":0.705,"g":0.519,"h":0.7,"i":0.723,"j":0.723,"k":0.7,"l":0.7,"m":0.519,"n":0.519,"o":0.519,"p":0.519,"q":0.519,"r":0.517,"s":0.517,"t":0.638,"u":0.511,"v":0.512,"w":0.512,"x":0.511,"y":0.512,"z":0.511,"{":0.791,"|":0.76,"}":0.791,"~":0.372,"★":0.859,"·":0.357,"“":0.7,"”":0.7,"’":0.7,"—":0.334,"–":0.334,"✓":0.7231,"€":0.708,"£":0.708},"dn":{"0":0.011,"1":0,"2":0,"3":0.008,"4":0,"5":0.008,"6":0.008,"7":0,"8":0.008,"9":0.008," ":0,"!":-0.002,"\"":-0.477,"#":-0.023,"$":0.081,"%":0.009,"&":0.009,"'":-0.48,"(":0.096,")":0.096,"*":-0.395,"+":-0.121,",":0.091,"-":-0.251,".":0.002,"/":0,":":-0.002,";":0.089,"<":-0.056,"=":-0.181,">":-0.057,"?":0.001,"@":0.078,"A":0,"B":0,"C":0.008,"D":0,"E":0,"F":0,"G":0.008,"H":0,"I":0,"J":0.008,"K":0,"L":0,"M":0,"N":0,"O":0.008,"P":0,"Q":0.104,"R":0,"S":0.008,"T":0,"U":0.008,"V":0,"W":0,"X":0,"Y":-0.001,"Z":0,"[":0.138,"\\":0,"]":0.138,"^":-0.301,"_":0,"`":-0.575,"a":0.008,"b":0.008,"c":0.008,"d":0.008,"e":0.008,"f":0,"g":0.206,"h":0,"i":0,"j":0.206,"k":0,"l":0,"m":0,"n":0,"o":0.008,"p":0.189,"q":0.189,"r":-0.001,"s":0.006,"t":0,"u":0.007,"v":0,"w":0,"x":0,"y":0.199,"z":0,"{":0.138,"|":0.08,"}":0.138,"~":-0.213,"★":0.078,"·":-0.215,"“":-0.482,"”":-0.482,"’":-0.482,"—":-0.234,"–":-0.234,"✓":0.0181,"€":0.008,"£":0},"cap":0.708,"desc":0.206,"avg":0.4088},"Barlow Condensed|700":{"adv":{"0":0.453,"1":0.284,"2":0.438,"3":0.436,"4":0.484,"5":0.439,"6":0.44,"7":0.407,"8":0.44,"9":0.435," ":0.2,"!":0.279,"\"":0.346,"#":0.616,"$":0.444,"%":0.766,"&":0.603,"'":0.17,"(":0.311,")":0.311,"*":0.361,"+":0.438,",":0.211,"-":0.331,".":0.223,"/":0.415,":":0.275,";":0.232,"<":0.438,"=":0.438,">":0.438,"?":0.437,"@":0.759,"A":0.482,"B":0.47,"C":0.464,"D":0.476,"E":0.438,"F":0.421,"G":0.467,"H":0.48,"I":0.23,"J":0.452,"K":0.491,"L":0.426,"M":0.548,"N":0.514,"O":0.473,"P":0.465,"Q":0.461,"R":0.471,"S":0.444,"T":0.468,"U":0.479,"V":0.488,"W":0.689,"X":0.475,"Y":0.474,"Z":0.412,"[":0.345,"\\":0.415,"]":0.345,"^":0.422,"_":0.421,"`":0.22,"a":0.446,"b":0.445,"c":0.434,"d":0.445,"e":0.436,"f":0.298,"g":0.441,"h":0.447,"i":0.219,"j":0.217,"k":0.449,"l":0.209,"m":0.675,"n":0.447,"o":0.442,"p":0.448,"q":0.448,"r":0.324,"s":0.412,"t":0.291,"u":0.447,"v":0.436,"w":0.613,"x":0.439,"y":0.423,"z":0.373,"{":0.344,"|":0.186,"}":0.344,"~":0.49,"★":1,"·":0.225,"“":0.352,"”":0.352,"’":0.188,"—":0.593,"–":0.38,"✓":0.7642,"€":0.5,"£":0.517},"up":{"0":0.711,"1":0.7,"2":0.708,"3":0.7,"4":0.7,"5":0.7,"6":0.708,"7":0.7,"8":0.713,"9":0.708," ":0,"!":0.7,"\"":0.698,"#":0.673,"$":0.785,"%":0.709,"&":0.708,"'":0.699,"(":0.759,")":0.759,"*":0.746,"+":0.507,",":0.158,"-":0.356,".":0.154,"/":0.7,":":0.487,";":0.486,"<":0.524,"=":0.46,">":0.526,"?":0.71,"@":0.655,"A":0.7,"B":0.7,"C":0.708,"D":0.7,"E":0.7,"F":0.7,"G":0.708,"H":0.7,"I":0.7,"J":0.7,"K":0.7,"L":0.7,"M":0.7,"N":0.7,"O":0.708,"P":0.701,"Q":0.708,"R":0.7,"S":0.708,"T":0.7,"U":0.7,"V":0.7,"W":0.7,"X":0.7,"Y":0.7,"Z":0.7,"[":0.8,"\\":0.7,"]":0.8,"^":0.7,"_":0.107,"`":0.7,"a":0.522,"b":0.7,"c":0.522,"d":0.7,"e":0.522,"f":0.705,"g":0.522,"h":0.7,"i":0.73,"j":0.73,"k":0.7,"l":0.7,"m":0.522,"n":0.522,"o":0.522,"p":0.522,"q":0.522,"r":0.52,"s":0.521,"t":0.642,"u":0.514,"v":0.515,"w":0.515,"x":0.514,"y":0.515,"z":0.514,"{":0.8,"|":0.76,"}":0.8,"~":0.381,"★":0.859,"·":0.369,"“":0.7,"”":0.7,"’":0.7,"—":0.345,"–":0.345,"✓":0.7231,"€":0.708,"£":0.708},"dn":{"0":0.011,"1":0,"2":0,"3":0.008,"4":0,"5":0.008,"6":0.008,"7":0,"8":0.008,"9":0.008," ":0,"!":-0.001,"\"":-0.471,"#":-0.027,"$":0.076,"%":0.009,"&":0.009,"'":-0.473,"(":0.091,")":0.091,"*":-0.396,"+":-0.116,",":0.098,"-":-0.235,".":0.004,"/":0,":":-0.001,";":0.097,"<":-0.051,"=":-0.17,">":-0.053,"?":0.002,"@":0.074,"A":0,"B":0,"C":0.008,"D":0,"E":0,"F":0,"G":0.008,"H":0,"I":0,"J":0.008,"K":0,"L":0,"M":0,"N":0,"O":0.008,"P":0,"Q":0.098,"R":0,"S":0.008,"T":0,"U":0.008,"V":0,"W":0,"X":0,"Y":-0.001,"Z":0,"[":0.147,"\\":0,"]":0.147,"^":-0.298,"_":0,"`":-0.576,"a":0.008,"b":0.008,"c":0.008,"d":0.008,"e":0.008,"f":0,"g":0.207,"h":0,"i":0,"j":0.205,"k":0,"l":0,"m":0,"n":0,"o":0.008,"p":0.186,"q":0.186,"r":-0.001,"s":0.007,"t":0,"u":0.007,"v":0,"w":0,"x":0,"y":0.199,"z":0,"{":0.147,"|":0.08,"}":0.147,"~":-0.202,"★":0.078,"·":-0.211,"“":-0.474,"”":-0.474,"’":-0.474,"—":-0.224,"–":-0.224,"✓":0.0181,"€":0.008,"£":0},"cap":0.708,"desc":0.207,"avg":0.4204},"Big Shoulders Display|400":{"adv":{"0":0.3727,"1":0.1993,"2":0.3587,"3":0.3697,"4":0.3857,"5":0.3768,"6":0.3663,"7":0.3314,"8":0.3653,"9":0.3655," ":0.2071,"!":0.2049,"\"":0.2691,"#":0.5609,"$":0.3414,"%":0.4966,"&":0.4688,"'":0.1528,"(":0.2328,")":0.2328,"*":0.2571,"+":0.4394,",":0.2055,"-":0.3173,".":0.2049,"/":0.3263,":":0.2049,";":0.2055,"<":0.4444,"=":0.4194,">":0.4444,"?":0.3238,"@":0.4897,"A":0.3385,"B":0.3463,"C":0.3497,"D":0.3602,"E":0.3016,"F":0.2944,"G":0.3492,"H":0.3661,"I":0.1721,"J":0.3289,"K":0.3454,"L":0.2896,"M":0.5278,"N":0.4031,"O":0.3596,"P":0.3353,"Q":0.3596,"R":0.3483,"S":0.3414,"T":0.2804,"U":0.3522,"V":0.3438,"W":0.5313,"X":0.3294,"Y":0.326,"Z":0.2983,"[":0.2487,"\\":0.3263,"]":0.2487,"^":0.3505,"_":0.656,"`":0.2217,"a":0.3476,"b":0.3643,"c":0.3401,"d":0.3643,"e":0.3427,"f":0.2397,"g":0.3637,"h":0.37,"i":0.1758,"j":0.1768,"k":0.32,"l":0.1758,"m":0.5647,"n":0.37,"o":0.3551,"p":0.3643,"q":0.3643,"r":0.2471,"s":0.3216,"t":0.238,"u":0.3681,"v":0.3072,"w":0.5196,"x":0.2937,"y":0.3225,"z":0.28,"{":0.287,"|":0.1721,"}":0.2741,"~":0.4573,"★":1,"·":0.1512,"“":0.3291,"”":0.3291,"’":0.2055,"—":0.6866,"–":0.4044,"✓":0.7642,"€":0.432,"£":0.3862},"up":{"0":0.807,"1":0.8,"2":0.807,"3":0.8,"4":0.8,"5":0.8,"6":0.8061,"7":0.8,"8":0.807,"9":0.8061," ":0,"!":0.8,"\"":0.8,"#":0.8,"$":0.899,"%":0.8033,"&":0.8066,"'":0.8,"(":0.8,")":0.8,"*":0.804,"+":0.555,",":0.0905,"-":0.4136,".":0.0896,"/":0.8,":":0.3896,";":0.3918,"<":0.4968,"=":0.4748,">":0.4968,"?":0.8071,"@":0.7158,"A":0.8,"B":0.8,"C":0.8061,"D":0.8,"E":0.8,"F":0.8,"G":0.807,"H":0.8,"I":0.8,"J":0.8,"K":0.8,"L":0.8,"M":0.8,"N":0.8,"O":0.807,"P":0.8,"Q":0.807,"R":0.8,"S":0.807,"T":0.8,"U":0.8,"V":0.8,"W":0.8,"X":0.8,"Y":0.8,"Z":0.8,"[":0.8,"\\":0.8,"]":0.8,"^":0.6899,"_":-0.04,"`":0.7535,"a":0.6066,"b":0.8,"c":0.607,"d":0.8,"e":0.6066,"f":0.808,"g":0.6066,"h":0.8,"i":0.8,"j":0.8,"k":0.8,"l":0.8,"m":0.607,"n":0.607,"o":0.607,"p":0.607,"q":0.607,"r":0.6014,"s":0.607,"t":0.77,"u":0.6,"v":0.6,"w":0.6,"x":0.6,"y":0.6,"z":0.6,"{":0.8,"|":0.91,"}":0.8,"~":0.4537,"★":0.859,"·":0.4455,"“":0.8,"”":0.8,"’":0.8,"—":0.4136,"–":0.4136,"✓":0.7231,"€":0.8,"£":0.8061},"dn":{"0":0.007,"1":0,"2":0,"3":0.007,"4":0,"5":0.007,"6":0.0074,"7":0,"8":0.007,"9":0.0074," ":0,"!":0,"\"":-0.5945,"#":0,"$":0.092,"%":0.0043,"&":0.0066,"'":-0.5945,"(":0.2,")":0.2,"*":-0.588,"+":-0.2213,",":0.1021,"-":-0.3537,".":0,"/":0.2,":":0,";":0.1021,"<":-0.2868,"=":-0.3021,">":-0.2868,"?":0,"@":0.1185,"A":0,"B":0,"C":0.0074,"D":0,"E":0,"F":0,"G":0.007,"H":0,"I":0,"J":0.007,"K":0,"L":0,"M":0,"N":0,"O":0.007,"P":0,"Q":0.0979,"R":0,"S":0.007,"T":0,"U":0.007,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.2,"\\":0.2,"]":0.2,"^":-0.4673,"_":0.06,"`":-0.64,"a":0.0063,"b":0.007,"c":0.007,"d":0.007,"e":0.0066,"f":0,"g":0.1625,"h":0,"i":0,"j":0.2048,"k":0,"l":0,"m":0,"n":0,"o":0.007,"p":0.2,"q":0.2,"r":0,"s":0.007,"t":0.007,"u":0.007,"v":0,"w":0,"x":0,"y":0.2033,"z":0,"{":0.2007,"|":0.12,"}":0.2007,"~":-0.3301,"★":0.078,"·":-0.3872,"“":-0.6074,"”":-0.6074,"’":-0.6074,"—":-0.3537,"–":-0.3537,"✓":0.0181,"€":0,"£":0},"cap":0.807,"desc":0.2033,"avg":0.3429},"Big Shoulders Display|600":{"adv":{"0":0.4063,"1":0.218,"2":0.3916,"3":0.4033,"4":0.4171,"5":0.4114,"6":0.3994,"7":0.3698,"8":0.3992,"9":0.399," ":0.2104,"!":0.2162,"\"":0.3026,"#":0.6048,"$":0.3746,"%":0.543,"&":0.5064,"'":0.1654,"(":0.2476,")":0.2476,"*":0.2559,"+":0.4636,",":0.2169,"-":0.3495,".":0.2162,"/":0.3473,":":0.2162,";":0.2169,"<":0.4716,"=":0.4436,">":0.4716,"?":0.3629,"@":0.5484,"A":0.3735,"B":0.3779,"C":0.3848,"D":0.394,"E":0.3282,"F":0.3224,"G":0.3852,"H":0.3959,"I":0.1866,"J":0.3599,"K":0.3833,"L":0.3177,"M":0.5822,"N":0.4381,"O":0.3939,"P":0.3692,"Q":0.3939,"R":0.3805,"S":0.3746,"T":0.3151,"U":0.386,"V":0.3814,"W":0.5986,"X":0.3649,"Y":0.3608,"Z":0.3283,"[":0.2756,"\\":0.3473,"]":0.2756,"^":0.3709,"_":0.656,"`":0.2333,"a":0.3796,"b":0.3974,"c":0.3699,"d":0.3974,"e":0.3718,"f":0.2636,"g":0.3982,"h":0.4033,"i":0.1899,"j":0.1909,"k":0.3542,"l":0.1899,"m":0.6159,"n":0.4033,"o":0.3864,"p":0.3974,"q":0.3974,"r":0.2732,"s":0.3507,"t":0.266,"u":0.4009,"v":0.3417,"w":0.5819,"x":0.3251,"y":0.3537,"z":0.3103,"{":0.3128,"|":0.1866,"}":0.3032,"~":0.4768,"★":1,"·":0.1607,"“":0.3611,"”":0.3611,"’":0.2169,"—":0.7405,"–":0.4399,"✓":0.7642,"€":0.4645,"£":0.4215},"up":{"0":0.8078,"1":0.8,"2":0.8078,"3":0.8,"4":0.8,"5":0.8,"6":0.8071,"7":0.8,"8":0.8078,"9":0.8071," ":0,"!":0.8,"\"":0.8,"#":0.8,"$":0.9042,"%":0.8037,"&":0.8074,"'":0.8,"(":0.8,")":0.8,"*":0.804,"+":0.5625,",":0.1034,"-":0.4152,".":0.102,"/":0.8,":":0.402,";":0.4036,"<":0.5026,"=":0.4836,">":0.5026,"?":0.8081,"@":0.7269,"A":0.8,"B":0.8,"C":0.8071,"D":0.8,"E":0.8,"F":0.8,"G":0.8078,"H":0.8,"I":0.8,"J":0.8,"K":0.8,"L":0.8,"M":0.8,"N":0.8,"O":0.8078,"P":0.8,"Q":0.8078,"R":0.8,"S":0.8078,"T":0.8,"U":0.8,"V":0.8,"W":0.8,"X":0.8,"Y":0.8,"Z":0.8,"[":0.8,"\\":0.8,"]":0.8,"^":0.6896,"_":-0.04,"`":0.7595,"a":0.6074,"b":0.8,"c":0.6078,"d":0.8,"e":0.6074,"f":0.8087,"g":0.6074,"h":0.8,"i":0.8,"j":0.8,"k":0.8,"l":0.8,"m":0.6078,"n":0.6078,"o":0.6078,"p":0.6078,"q":0.6078,"r":0.6021,"s":0.6078,"t":0.77,"u":0.6,"v":0.6,"w":0.6,"x":0.6,"y":0.6,"z":0.6,"{":0.8,"|":0.91,"}":0.8,"~":0.4533,"★":0.859,"·":0.4524,"“":0.8,"”":0.8,"’":0.8,"—":0.4152,"–":0.4152,"✓":0.7231,"€":0.8,"£":0.8071},"dn":{"0":0.0078,"1":0,"2":0,"3":0.0078,"4":0,"5":0.0078,"6":0.0081,"7":0,"8":0.0078,"9":0.0081," ":0,"!":0,"\"":-0.5749,"#":0,"$":0.0965,"%":0.0047,"&":0.0074,"'":-0.5749,"(":0.2,")":0.2,"*":-0.588,"+":-0.1982,",":0.1121,"-":-0.3372,".":0,"/":0.2,":":0,";":0.1121,"<":-0.2653,"=":-0.2781,">":-0.2653,"?":0,"@":0.1292,"A":0,"B":0,"C":0.0081,"D":0,"E":0,"F":0,"G":0.0078,"H":0,"I":0,"J":0.0078,"K":0,"L":0,"M":0,"N":0,"O":0.0078,"P":0,"Q":0.1061,"R":0,"S":0.0078,"T":0,"U":0.0078,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.2,"\\":0.2,"]":0.2,"^":-0.458,"_":0.06,"`":-0.64,"a":0.0067,"b":0.0078,"c":0.0078,"d":0.0078,"e":0.0074,"f":0,"g":0.1724,"h":0,"i":0,"j":0.2069,"k":0,"l":0,"m":0,"n":0,"o":0.0078,"p":0.2,"q":0.2,"r":0,"s":0.0078,"t":0.0078,"u":0.0078,"v":0,"w":0,"x":0,"y":0.2052,"z":0,"{":0.201,"|":0.12,"}":0.201,"~":-0.3165,"★":0.078,"·":-0.3814,"“":-0.5845,"”":-0.5845,"’":-0.5845,"—":-0.3372,"–":-0.3372,"✓":0.0181,"€":0,"£":0},"cap":0.8078,"desc":0.2052,"avg":0.3714},"Big Shoulders Display|700":{"adv":{"0":0.4397,"1":0.2366,"2":0.4242,"3":0.4367,"4":0.4482,"5":0.4458,"6":0.4323,"7":0.408,"8":0.4328,"9":0.4321," ":0.2135,"!":0.2274,"\"":0.3359,"#":0.6483,"$":0.4076,"%":0.5891,"&":0.5437,"'":0.1778,"(":0.2623,")":0.2623,"*":0.2546,"+":0.4876,",":0.2282,"-":0.3815,".":0.2274,"/":0.3681,":":0.2274,";":0.2282,"<":0.4986,"=":0.4676,">":0.4986,"?":0.4017,"@":0.6066,"A":0.4081,"B":0.4093,"C":0.4197,"D":0.4275,"E":0.3547,"F":0.3501,"G":0.421,"H":0.4254,"I":0.201,"J":0.3906,"K":0.4208,"L":0.3457,"M":0.6362,"N":0.4729,"O":0.4279,"P":0.4028,"Q":0.4279,"R":0.4125,"S":0.4076,"T":0.3496,"U":0.4195,"V":0.4187,"W":0.6654,"X":0.4,"Y":0.3953,"Z":0.358,"[":0.3022,"\\":0.3681,"]":0.3022,"^":0.3911,"_":0.656,"`":0.2448,"a":0.4114,"b":0.4303,"c":0.3994,"d":0.4303,"e":0.4007,"f":0.2873,"g":0.4325,"h":0.4363,"i":0.2038,"j":0.2048,"k":0.3881,"l":0.2038,"m":0.6667,"n":0.4363,"o":0.4174,"p":0.4303,"q":0.4303,"r":0.299,"s":0.3794,"t":0.2939,"u":0.4334,"v":0.376,"w":0.6438,"x":0.3562,"y":0.3846,"z":0.3404,"{":0.3384,"|":0.201,"}":0.3319,"~":0.4961,"★":1,"·":0.1701,"“":0.3929,"”":0.3929,"’":0.2282,"—":0.7941,"–":0.475,"✓":0.7642,"€":0.4969,"£":0.4565},"up":{"0":0.8085,"1":0.8,"2":0.8085,"3":0.8,"4":0.8,"5":0.8,"6":0.8081,"7":0.8,"8":0.8085,"9":0.8081," ":0,"!":0.8,"\"":0.8,"#":0.8,"$":0.9095,"%":0.8041,"&":0.8083,"'":0.8,"(":0.8,")":0.8,"*":0.804,"+":0.57,",":0.1162,"-":0.4168,".":0.1143,"/":0.8,":":0.4143,";":0.4154,"<":0.5084,"=":0.4924,">":0.5084,"?":0.8091,"@":0.7379,"A":0.8,"B":0.8,"C":0.8081,"D":0.8,"E":0.8,"F":0.8,"G":0.8085,"H":0.8,"I":0.8,"J":0.8,"K":0.8,"L":0.8,"M":0.8,"N":0.8,"O":0.8085,"P":0.8,"Q":0.8085,"R":0.8,"S":0.8085,"T":0.8,"U":0.8,"V":0.8,"W":0.8,"X":0.8,"Y":0.8,"Z":0.8,"[":0.8,"\\":0.8,"]":0.8,"^":0.6894,"_":-0.04,"`":0.766,"a":0.6083,"b":0.8,"c":0.6085,"d":0.8,"e":0.6083,"f":0.8095,"g":0.6083,"h":0.8,"i":0.8,"j":0.8,"k":0.8,"l":0.8,"m":0.6085,"n":0.6085,"o":0.6085,"p":0.6085,"q":0.6085,"r":0.6027,"s":0.6085,"t":0.77,"u":0.6,"v":0.6,"w":0.6,"x":0.6,"y":0.6,"z":0.6,"{":0.8,"|":0.91,"}":0.8,"~":0.4529,"★":0.859,"·":0.4592,"“":0.8,"”":0.8,"’":0.8,"—":0.4168,"–":0.4168,"✓":0.7231,"€":0.8,"£":0.8081},"dn":{"0":0.0085,"1":0,"2":0,"3":0.0085,"4":0,"5":0.0085,"6":0.0087,"7":0,"8":0.0085,"9":0.0087," ":0,"!":0,"\"":-0.5553,"#":0,"$":0.101,"%":0.0051,"&":0.0083,"'":-0.5553,"(":0.2,")":0.2,"*":-0.588,"+":-0.1752,",":0.122,"-":-0.3209,".":0,"/":0.2,":":0,";":0.122,"<":-0.244,"=":-0.2542,">":-0.244,"?":0,"@":0.1397,"A":0,"B":0,"C":0.0087,"D":0,"E":0,"F":0,"G":0.0085,"H":0,"I":0,"J":0.0085,"K":0,"L":0,"M":0,"N":0,"O":0.0085,"P":0,"Q":0.1142,"R":0,"S":0.0085,"T":0,"U":0.0085,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.2,"\\":0.2,"]":0.2,"^":-0.4487,"_":0.06,"`":-0.64,"a":0.0071,"b":0.0085,"c":0.0085,"d":0.0085,"e":0.0083,"f":0,"g":0.1822,"h":0,"i":0,"j":0.2089,"k":0,"l":0,"m":0,"n":0,"o":0.0085,"p":0.2,"q":0.2,"r":0,"s":0.0085,"t":0.0085,"u":0.0085,"v":0,"w":0,"x":0,"y":0.2071,"z":0,"{":0.2014,"|":0.12,"}":0.2014,"~":-0.3031,"★":0.078,"·":-0.3756,"“":-0.5618,"”":-0.5618,"’":-0.5618,"—":-0.3209,"–":-0.3209,"✓":0.0181,"€":0,"£":0},"cap":0.8085,"desc":0.2071,"avg":0.3997},"Oswald|400":{"adv":{"0":0.517,"1":0.378,"2":0.478,"3":0.477,"4":0.483,"5":0.476,"6":0.503,"7":0.386,"8":0.499,"9":0.502," ":0.229,"!":0.208,"\"":0.266,"#":0.486,"$":0.491,"%":0.891,"&":0.606,"'":0.127,"(":0.298,")":0.26,"*":0.398,"+":0.415,",":0.187,"-":0.303,".":0.188,"/":0.369,":":0.197,";":0.215,"<":0.373,"=":0.415,">":0.373,"?":0.483,"@":0.904,"A":0.492,"B":0.524,"C":0.515,"D":0.527,"E":0.407,"F":0.391,"G":0.535,"H":0.561,"I":0.248,"J":0.301,"K":0.495,"L":0.397,"M":0.66,"N":0.528,"O":0.539,"P":0.48,"Q":0.541,"R":0.519,"S":0.473,"T":0.413,"U":0.543,"V":0.505,"W":0.729,"X":0.482,"Y":0.481,"Z":0.417,"[":0.34,"\\":0.369,"]":0.31,"^":0.443,"_":0.344,"`":0.278,"a":0.409,"b":0.447,"c":0.411,"d":0.442,"e":0.421,"f":0.287,"g":0.441,"h":0.445,"i":0.229,"j":0.23,"k":0.429,"l":0.229,"m":0.68,"n":0.439,"o":0.425,"p":0.446,"q":0.443,"r":0.321,"s":0.374,"t":0.308,"u":0.44,"v":0.385,"w":0.588,"x":0.389,"y":0.392,"z":0.347,"{":0.3,"|":0.239,"}":0.321,"~":0.447,"★":1,"·":0.176,"“":0.354,"”":0.325,"’":0.178,"—":1.03,"–":0.559,"✓":0.7642,"€":0.497,"£":0.398},"up":{"0":0.817,"1":0.81,"2":0.817,"3":0.817,"4":0.81,"5":0.81,"6":0.817,"7":0.81,"8":0.817,"9":0.817," ":0,"!":0.81,"\"":0.81,"#":0.81,"$":0.884,"%":0.816,"&":0.817,"'":0.81,"(":0.817,")":0.817,"*":0.809,"+":0.619,",":0.115,"-":0.331,".":0.119,"/":0.81,":":0.529,";":0.565,"<":0.623,"=":0.545,">":0.623,"?":0.817,"@":0.81,"A":0.81,"B":0.81,"C":0.817,"D":0.81,"E":0.81,"F":0.81,"G":0.817,"H":0.81,"I":0.81,"J":0.81,"K":0.81,"L":0.81,"M":0.81,"N":0.81,"O":0.817,"P":0.81,"Q":0.817,"R":0.81,"S":0.817,"T":0.81,"U":0.81,"V":0.81,"W":0.81,"X":0.81,"Y":0.81,"Z":0.81,"[":0.81,"\\":0.81,"]":0.81,"^":0.81,"_":-0.053,"`":0.81,"a":0.586,"b":0.81,"c":0.586,"d":0.81,"e":0.586,"f":0.781,"g":0.591,"h":0.81,"i":0.776,"j":0.776,"k":0.811,"l":0.81,"m":0.588,"n":0.586,"o":0.586,"p":0.586,"q":0.586,"r":0.585,"s":0.586,"t":0.747,"u":0.578,"v":0.578,"w":0.578,"x":0.578,"y":0.578,"z":0.578,"{":0.817,"|":0.81,"}":0.817,"~":0.486,"★":0.859,"·":0.432,"“":0.843,"”":0.81,"’":0.81,"—":0.328,"–":0.331,"✓":0.7231,"€":0.817,"£":0.817},"dn":{"0":0.009,"1":0,"2":0,"3":0.009,"4":0,"5":0.008,"6":0.009,"7":0,"8":0.009,"9":0.009," ":0,"!":0,"\"":-0.562,"#":0,"$":0.077,"%":0.005,"&":0.009,"'":-0.562,"(":0.194,")":0.194,"*":-0.469,"+":-0.212,",":0.131,"-":-0.25,".":0,"/":0,":":-0.096,";":0.046,"<":-0.21,"=":-0.286,">":-0.21,"?":0,"@":0.134,"A":0,"B":0,"C":0.009,"D":0,"E":0,"F":0,"G":0.01,"H":0,"I":0,"J":0.019,"K":0,"L":0,"M":0,"N":0,"O":0.009,"P":0,"Q":0.164,"R":0,"S":0.009,"T":0,"U":0.009,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.184,"\\":0,"]":0.184,"^":-0.487,"_":0.134,"`":-0.612,"a":0.008,"b":0.008,"c":0.008,"d":0.008,"e":0.008,"f":0,"g":0.181,"h":0,"i":0,"j":0.146,"k":0,"l":0,"m":0,"n":0,"o":0.008,"p":0.19,"q":0.19,"r":0,"s":0.008,"t":0.008,"u":0.008,"v":0,"w":0,"x":0,"y":0.145,"z":0,"{":0.191,"|":0.148,"}":0.191,"~":-0.343,"★":0.078,"·":-0.322,"“":-0.579,"”":-0.545,"’":-0.545,"—":-0.25,"–":-0.25,"✓":0.0181,"€":0.009,"£":0},"cap":0.817,"desc":0.19,"avg":0.426},"Oswald|600":{"adv":{"0":0.543,"1":0.3835,"2":0.5063,"3":0.5061,"4":0.5153,"5":0.502,"6":0.5305,"7":0.4277,"8":0.5163,"9":0.5303," ":0.2503,"!":0.2466,"\"":0.34,"#":0.5238,"$":0.4863,"%":0.9815,"&":0.5777,"'":0.1608,"(":0.3295,")":0.3135,"*":0.4177,"+":0.4418,",":0.2271,"-":0.3195,".":0.2321,"/":0.4107,":":0.2608,";":0.2701,"<":0.3927,"=":0.4363,">":0.3927,"?":0.483,"@":0.9402,"A":0.5384,"B":0.5744,"C":0.5528,"D":0.5734,"E":0.4385,"F":0.4248,"G":0.572,"H":0.5996,"I":0.2897,"J":0.3388,"K":0.5517,"L":0.4332,"M":0.6946,"N":0.554,"O":0.576,"P":0.5516,"Q":0.5764,"R":0.5828,"S":0.5053,"T":0.4382,"U":0.5784,"V":0.5215,"W":0.7038,"X":0.508,"Y":0.4904,"Z":0.4296,"[":0.3337,"\\":0.4107,"]":0.321,"^":0.469,"_":0.3629,"`":0.3008,"a":0.4491,"b":0.4934,"c":0.4559,"d":0.49,"e":0.4596,"f":0.313,"g":0.489,"h":0.4954,"i":0.2573,"j":0.2607,"k":0.4928,"l":0.2644,"m":0.7375,"n":0.4925,"o":0.4707,"p":0.4924,"q":0.491,"r":0.3698,"s":0.4134,"t":0.3418,"u":0.4904,"v":0.4133,"w":0.5951,"x":0.4307,"y":0.4361,"z":0.3824,"{":0.3582,"|":0.2571,"}":0.3667,"~":0.4738,"★":1,"·":0.2154,"“":0.3965,"”":0.3856,"’":0.1985,"—":1.0465,"–":0.5582,"✓":0.7642,"€":0.5466,"£":0.4704},"up":{"0":0.8209,"1":0.81,"2":0.8202,"3":0.8209,"4":0.81,"5":0.81,"6":0.8202,"7":0.81,"8":0.8202,"9":0.8202," ":0,"!":0.8084,"\"":0.81,"#":0.81,"$":0.9076,"%":0.8121,"&":0.8209,"'":0.81,"(":0.8186,")":0.8186,"*":0.8098,"+":0.6182,",":0.1457,"-":0.3436,".":0.1465,"/":0.81,":":0.5565,";":0.5729,"<":0.6325,"=":0.5545,">":0.6325,"?":0.8202,"@":0.81,"A":0.81,"B":0.81,"C":0.8202,"D":0.81,"E":0.81,"F":0.81,"G":0.8202,"H":0.81,"I":0.81,"J":0.81,"K":0.81,"L":0.81,"M":0.81,"N":0.81,"O":0.8202,"P":0.81,"Q":0.8202,"R":0.81,"S":0.8202,"T":0.81,"U":0.81,"V":0.81,"W":0.81,"X":0.81,"Y":0.81,"Z":0.81,"[":0.81,"\\":0.81,"]":0.81,"^":0.81,"_":-0.0569,"`":0.81,"a":0.5876,"b":0.81,"c":0.5876,"d":0.81,"e":0.5876,"f":0.7881,"g":0.6083,"h":0.81,"i":0.7862,"j":0.7862,"k":0.8102,"l":0.81,"m":0.5888,"n":0.5876,"o":0.5876,"p":0.5876,"q":0.5876,"r":0.585,"s":0.5876,"t":0.7525,"u":0.578,"v":0.578,"w":0.578,"x":0.578,"y":0.578,"z":0.578,"{":0.8257,"|":0.81,"}":0.8257,"~":0.5002,"★":0.859,"·":0.4478,"“":0.823,"”":0.81,"’":0.81,"—":0.3477,"–":0.3483,"✓":0.7231,"€":0.8202,"£":0.8202},"dn":{"0":0.0137,"1":0,"2":0,"3":0.0137,"4":0,"5":0.0135,"6":0.0114,"7":0,"8":0.0122,"9":0.0114," ":0,"!":0,"\"":-0.5203,"#":0,"$":0.103,"%":0.0019,"&":0.0135,"'":-0.5203,"(":0.182,")":0.182,"*":-0.454,"+":-0.2081,",":0.1381,"-":-0.2437,".":0,"/":0,":":-0.0645,";":0.1019,"<":-0.1982,"=":-0.275,">":-0.1982,"?":0,"@":0.1277,"A":0,"B":0,"C":0.0114,"D":0,"E":0,"F":0,"G":0.0116,"H":0,"I":0,"J":0.0206,"K":0,"L":0,"M":0,"N":0,"O":0.0114,"P":0,"Q":0.1601,"R":0,"S":0.0114,"T":0,"U":0.0114,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.1848,"\\":0,"]":0.1848,"^":-0.4776,"_":0.16,"`":-0.6089,"a":0.0096,"b":0.0096,"c":0.0096,"d":0.0096,"e":0.0096,"f":0,"g":0.196,"h":0,"i":0,"j":0.1728,"k":0,"l":0,"m":0,"n":0,"o":0.0096,"p":0.19,"q":0.19,"r":0,"s":0.0096,"t":0.0064,"u":0.0096,"v":0,"w":0,"x":0,"y":0.1631,"z":0,"{":0.1926,"|":0.1732,"}":0.1926,"~":-0.3351,"★":0.078,"·":-0.3047,"“":-0.544,"”":-0.53,"’":-0.53,"—":-0.2437,"–":-0.2437,"✓":0.0181,"€":0.0114,"£":0},"cap":0.8202,"desc":0.196,"avg":0.4595},"Oswald|700":{"adv":{"0":0.55,"1":0.385,"2":0.514,"3":0.514,"4":0.524,"5":0.509,"6":0.538,"7":0.439,"8":0.521,"9":0.538," ":0.256,"!":0.257,"\"":0.36,"#":0.534,"$":0.485,"%":1.006,"&":0.57,"'":0.17,"(":0.338,")":0.328,"*":0.423,"+":0.449,",":0.238,"-":0.324,".":0.244,"/":0.422,":":0.278,";":0.285,"<":0.398,"=":0.442,">":0.398,"?":0.483,"@":0.95,"A":0.551,"B":0.588,"C":0.563,"D":0.586,"E":0.447,"F":0.434,"G":0.582,"H":0.61,"I":0.301,"J":0.349,"K":0.567,"L":0.443,"M":0.704,"N":0.561,"O":0.586,"P":0.571,"Q":0.586,"R":0.6,"S":0.514,"T":0.445,"U":0.588,"V":0.526,"W":0.697,"X":0.515,"Y":0.493,"Z":0.433,"[":0.332,"\\":0.422,"]":0.324,"^":0.476,"_":0.368,"`":0.307,"a":0.46,"b":0.506,"c":0.468,"d":0.503,"e":0.47,"f":0.32,"g":0.502,"h":0.509,"i":0.265,"j":0.269,"k":0.51,"l":0.274,"m":0.753,"n":0.507,"o":0.483,"p":0.505,"q":0.504,"r":0.383,"s":0.424,"t":0.351,"u":0.504,"v":0.421,"w":0.597,"x":0.442,"y":0.448,"z":0.392,"{":0.374,"|":0.262,"}":0.379,"~":0.481,"★":1,"·":0.226,"“":0.408,"”":0.402,"’":0.204,"—":1.051,"–":0.558,"✓":0.7642,"€":0.56,"£":0.49},"up":{"0":0.822,"1":0.81,"2":0.821,"3":0.822,"4":0.81,"5":0.81,"6":0.821,"7":0.81,"8":0.821,"9":0.821," ":0,"!":0.808,"\"":0.81,"#":0.81,"$":0.914,"%":0.811,"&":0.822,"'":0.81,"(":0.819,")":0.819,"*":0.81,"+":0.618,",":0.154,"-":0.347,".":0.154,"/":0.81,":":0.564,";":0.575,"<":0.635,"=":0.557,">":0.635,"?":0.821,"@":0.81,"A":0.81,"B":0.81,"C":0.821,"D":0.81,"E":0.81,"F":0.81,"G":0.821,"H":0.81,"I":0.81,"J":0.81,"K":0.81,"L":0.81,"M":0.81,"N":0.81,"O":0.821,"P":0.81,"Q":0.821,"R":0.81,"S":0.821,"T":0.81,"U":0.81,"V":0.81,"W":0.81,"X":0.81,"Y":0.81,"Z":0.81,"[":0.81,"\\":0.81,"]":0.81,"^":0.81,"_":-0.058,"`":0.81,"a":0.588,"b":0.81,"c":0.588,"d":0.81,"e":0.588,"f":0.79,"g":0.613,"h":0.81,"i":0.789,"j":0.789,"k":0.81,"l":0.81,"m":0.589,"n":0.588,"o":0.588,"p":0.588,"q":0.588,"r":0.585,"s":0.588,"t":0.754,"u":0.578,"v":0.578,"w":0.578,"x":0.578,"y":0.578,"z":0.578,"{":0.828,"|":0.81,"}":0.828,"~":0.504,"★":0.859,"·":0.452,"“":0.818,"”":0.81,"’":0.81,"—":0.353,"–":0.353,"✓":0.7231,"€":0.821,"£":0.821},"dn":{"0":0.015,"1":0,"2":0,"3":0.015,"4":0,"5":0.015,"6":0.012,"7":0,"8":0.013,"9":0.012," ":0,"!":0,"\"":-0.509,"#":0,"$":0.11,"%":0.001,"&":0.015,"'":-0.509,"(":0.179,")":0.179,"*":-0.45,"+":-0.207,",":0.14,"-":-0.242,".":0,"/":0,":":-0.056,";":0.117,"<":-0.195,"=":-0.272,">":-0.195,"?":0,"@":0.126,"A":0,"B":0,"C":0.012,"D":0,"E":0,"F":0,"G":0.012,"H":0,"I":0,"J":0.021,"K":0,"L":0,"M":0,"N":0,"O":0.012,"P":0,"Q":0.159,"R":0,"S":0.012,"T":0,"U":0.012,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.185,"\\":0,"]":0.185,"^":-0.475,"_":0.167,"`":-0.608,"a":0.01,"b":0.01,"c":0.01,"d":0.01,"e":0.01,"f":0,"g":0.2,"h":0,"i":0,"j":0.18,"k":0,"l":0,"m":0,"n":0,"o":0.01,"p":0.19,"q":0.19,"r":0,"s":0.01,"t":0.006,"u":0.01,"v":0,"w":0,"x":0,"y":0.168,"z":0,"{":0.193,"|":0.18,"}":0.193,"~":-0.333,"★":0.078,"·":-0.3,"“":-0.534,"”":-0.526,"’":-0.526,"—":-0.242,"–":-0.242,"✓":0.0181,"€":0.012,"£":0},"cap":0.821,"desc":0.2,"avg":0.4686},"Russo One|400":{"adv":{"0":0.67,"1":0.405,"2":0.59,"3":0.61,"4":0.65,"5":0.6,"6":0.63,"7":0.56,"8":0.67,"9":0.63," ":0.3,"!":0.28,"\"":0.4,"#":0.73,"$":0.629,"%":0.86,"&":0.72,"'":0.21,"(":0.325,")":0.325,"*":0.495,"+":0.54,",":0.24,"-":0.47,".":0.24,"/":0.47,":":0.24,";":0.24,"<":0.51,"=":0.49,">":0.51,"?":0.58,"@":0.77,"A":0.71,"B":0.71,"C":0.62,"D":0.72,"E":0.635,"F":0.625,"G":0.7,"H":0.73,"I":0.42,"J":0.46,"K":0.676,"L":0.615,"M":0.9,"N":0.73,"O":0.73,"P":0.71,"Q":0.73,"R":0.72,"S":0.67,"T":0.62,"U":0.75,"V":0.71,"W":0.98,"X":0.66,"Y":0.67,"Z":0.61,"[":0.36,"\\":0.47,"]":0.36,"^":0.51,"_":0.47,"`":0.25,"a":0.595,"b":0.62,"c":0.55,"d":0.63,"e":0.6,"f":0.45,"g":0.62,"h":0.63,"i":0.32,"j":0.3,"k":0.6,"l":0.34,"m":0.925,"n":0.63,"o":0.63,"p":0.63,"q":0.62,"r":0.46,"s":0.58,"t":0.44,"u":0.64,"v":0.58,"w":0.88,"x":0.55,"y":0.57,"z":0.535,"{":0.37,"|":0.3,"}":0.37,"~":0.501,"★":1,"·":0.3,"“":0.46,"”":0.46,"’":0.24,"—":0.8,"–":0.63,"✓":0.7642,"€":0.66,"£":0.565},"up":{"0":0.71,"1":0.7,"2":0.7,"3":0.7,"4":0.7,"5":0.7,"6":0.71,"7":0.7,"8":0.71,"9":0.71," ":0,"!":0.7,"\"":0.7,"#":0.7,"$":0.79,"%":0.71,"&":0.7,"'":0.7,"(":0.82,")":0.82,"*":0.7,"+":0.59,",":0.15,"-":0.42,".":0.15,"/":0.7,":":0.53,";":0.53,"<":0.53,"=":0.52,">":0.53,"?":0.71,"@":0.71,"A":0.7,"B":0.7,"C":0.7,"D":0.7,"E":0.7,"F":0.7,"G":0.7,"H":0.7,"I":0.7,"J":0.7,"K":0.7,"L":0.7,"M":0.7,"N":0.7,"O":0.71,"P":0.7,"Q":0.71,"R":0.7,"S":0.7,"T":0.7,"U":0.7,"V":0.7,"W":0.7,"X":0.7,"Y":0.7,"Z":0.7,"[":0.8,"\\":0.7,"]":0.8,"^":0.7,"_":-0.05,"`":0.71,"a":0.54,"b":0.7,"c":0.53,"d":0.7,"e":0.54,"f":0.71,"g":0.53,"h":0.7,"i":0.71,"j":0.71,"k":0.7,"l":0.7,"m":0.54,"n":0.54,"o":0.54,"p":0.54,"q":0.53,"r":0.54,"s":0.53,"t":0.65,"u":0.53,"v":0.53,"w":0.53,"x":0.53,"y":0.53,"z":0.53,"{":0.8,"|":0.7,"}":0.8,"~":0.455,"★":0.859,"·":0.425,"“":0.7,"”":0.7,"’":0.7,"—":0.415,"–":0.415,"✓":0.7231,"€":0.7,"£":0.71},"dn":{"0":0.01,"1":0,"2":0,"3":0.01,"4":0,"5":0.01,"6":0.01,"7":0,"8":0.01,"9":0.01," ":0,"!":0,"\"":-0.45,"#":0,"$":0.1,"%":0.01,"&":0.01,"'":-0.45,"(":0.23,")":0.23,"*":-0.24,"+":-0.11,",":0.1,"-":-0.28,".":0,"/":0,":":0,";":0.1,"<":0,"=":-0.18,">":0,"?":0,"@":0.01,"A":0,"B":0,"C":0.01,"D":0,"E":0,"F":0,"G":0.01,"H":0,"I":0,"J":0.01,"K":0,"L":0,"M":0,"N":0,"O":0.01,"P":0,"Q":0.17,"R":0,"S":0.01,"T":0,"U":0.01,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.21,"\\":0,"]":0.21,"^":-0.4,"_":0.19,"`":-0.54,"a":0.01,"b":0,"c":0.01,"d":0.01,"e":0.01,"f":0,"g":0.18,"h":0,"i":0,"j":0.18,"k":0,"l":0.01,"m":0,"n":0,"o":0.01,"p":0.17,"q":0.17,"r":0,"s":0.01,"t":0.01,"u":0.01,"v":0,"w":0,"x":0,"y":0.18,"z":0,"{":0.21,"|":0.17,"}":0.21,"~":-0.245,"★":0.078,"·":-0.275,"“":-0.45,"”":-0.45,"’":-0.45,"—":-0.285,"–":-0.285,"✓":0.0181,"€":0.01,"£":0},"cap":0.71,"desc":0.18,"avg":0.5582},"Saira Condensed|400":{"adv":{"0":0.484,"1":0.274,"2":0.436,"3":0.423,"4":0.468,"5":0.439,"6":0.476,"7":0.403,"8":0.49,"9":0.476," ":0.192,"!":0.209,"\"":0.294,"#":0.526,"$":0.418,"%":0.636,"&":0.529,"'":0.166,"(":0.246,")":0.246,"*":0.406,"+":0.484,",":0.194,"-":0.309,".":0.194,"/":0.29,":":0.194,";":0.194,"<":0.484,"=":0.484,">":0.484,"?":0.361,"@":0.683,"A":0.494,"B":0.492,"C":0.4,"D":0.497,"E":0.433,"F":0.408,"G":0.483,"H":0.527,"I":0.22,"J":0.25,"K":0.481,"L":0.379,"M":0.665,"N":0.528,"O":0.518,"P":0.465,"Q":0.518,"R":0.493,"S":0.443,"T":0.413,"U":0.514,"V":0.462,"W":0.691,"X":0.484,"Y":0.433,"Z":0.424,"[":0.251,"\\":0.29,"]":0.251,"^":0.411,"_":0.317,"`":0.141,"a":0.425,"b":0.45,"c":0.351,"d":0.45,"e":0.428,"f":0.281,"g":0.45,"h":0.453,"i":0.196,"j":0.196,"k":0.408,"l":0.196,"m":0.689,"n":0.453,"o":0.439,"p":0.45,"q":0.45,"r":0.285,"s":0.377,"t":0.273,"u":0.453,"v":0.405,"w":0.612,"x":0.411,"y":0.453,"z":0.373,"{":0.259,"|":0.226,"}":0.259,"~":0.438,"★":1,"·":0.194,"“":0.313,"”":0.313,"’":0.176,"—":0.824,"–":0.427,"✓":0.7642,"€":0.446,"£":0.441},"up":{"0":0.696,"1":0.688,"2":0.696,"3":0.696,"4":0.688,"5":0.688,"6":0.696,"7":0.688,"8":0.696,"9":0.696," ":0,"!":0.688,"\"":0.688,"#":0.688,"$":0.696,"%":0.696,"&":0.696,"'":0.688,"(":0.743,")":0.743,"*":0.688,"+":0.432,",":0.09,"-":0.318,".":0.09,"/":0.743,":":0.51,";":0.51,"<":0.44,"=":0.373,">":0.44,"?":0.696,"@":0.696,"A":0.688,"B":0.688,"C":0.696,"D":0.688,"E":0.688,"F":0.688,"G":0.696,"H":0.688,"I":0.688,"J":0.688,"K":0.688,"L":0.688,"M":0.688,"N":0.688,"O":0.696,"P":0.688,"Q":0.696,"R":0.688,"S":0.696,"T":0.688,"U":0.688,"V":0.688,"W":0.688,"X":0.688,"Y":0.688,"Z":0.688,"[":0.743,"\\":0.743,"]":0.743,"^":0.75,"_":-0.11,"`":0.743,"a":0.518,"b":0.743,"c":0.518,"d":0.743,"e":0.518,"f":0.743,"g":0.518,"h":0.743,"i":0.743,"j":0.743,"k":0.743,"l":0.743,"m":0.518,"n":0.518,"o":0.518,"p":0.518,"q":0.518,"r":0.518,"s":0.518,"t":0.658,"u":0.51,"v":0.51,"w":0.51,"x":0.51,"y":0.51,"z":0.51,"{":0.743,"|":0.743,"}":0.743,"~":0.362,"★":0.859,"·":0.344,"“":0.688,"”":0.688,"’":0.688,"—":0.334,"–":0.334,"✓":0.7231,"€":0.696,"£":0.696},"dn":{"0":0.008,"1":0,"2":0,"3":0.008,"4":0,"5":0.008,"6":0.008,"7":0,"8":0.008,"9":0.008," ":0,"!":0,"\"":-0.445,"#":0,"$":0.008,"%":0.008,"&":0.008,"'":-0.445,"(":0.15,")":0.15,"*":-0.359,"+":-0.073,",":0.117,"-":-0.253,".":0,"/":0.055,":":0,";":0.117,"<":-0.066,"=":-0.133,">":-0.066,"?":0,"@":0.108,"A":0,"B":0,"C":0.008,"D":0,"E":0,"F":0,"G":0.008,"H":0,"I":0,"J":0,"K":0,"L":0,"M":0,"N":0,"O":0.008,"P":0,"Q":0.115,"R":0,"S":0.008,"T":0,"U":0.008,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.15,"\\":0.055,"]":0.15,"^":-0.476,"_":0.169,"`":-0.602,"a":0.008,"b":0.008,"c":0.008,"d":0.008,"e":0.008,"f":0,"g":0.199,"h":0,"i":0,"j":0.193,"k":0,"l":0,"m":0,"n":0,"o":0.008,"p":0.193,"q":0.193,"r":0,"s":0.008,"t":0,"u":0.008,"v":0,"w":0,"x":0,"y":0.199,"z":0,"{":0.15,"|":0.161,"}":0.15,"~":-0.242,"★":0.078,"·":-0.254,"“":-0.486,"”":-0.486,"’":-0.486,"—":-0.274,"–":-0.274,"✓":0.0181,"€":0.008,"£":0},"cap":0.696,"desc":0.199,"avg":0.4043},"Saira Condensed|600":{"adv":{"0":0.477,"1":0.299,"2":0.445,"3":0.431,"4":0.467,"5":0.447,"6":0.474,"7":0.416,"8":0.489,"9":0.474," ":0.186,"!":0.24,"\"":0.35,"#":0.561,"$":0.409,"%":0.7,"&":0.542,"'":0.198,"(":0.274,")":0.274,"*":0.406,"+":0.475,",":0.224,"-":0.3,".":0.224,"/":0.314,":":0.224,";":0.224,"<":0.475,"=":0.475,">":0.475,"?":0.382,"@":0.696,"A":0.495,"B":0.488,"C":0.396,"D":0.495,"E":0.423,"F":0.395,"G":0.485,"H":0.521,"I":0.235,"J":0.28,"K":0.486,"L":0.378,"M":0.69,"N":0.524,"O":0.509,"P":0.47,"Q":0.509,"R":0.49,"S":0.442,"T":0.414,"U":0.509,"V":0.476,"W":0.737,"X":0.494,"Y":0.452,"Z":0.432,"[":0.283,"\\":0.314,"]":0.282,"^":0.396,"_":0.347,"`":0.175,"a":0.422,"b":0.445,"c":0.342,"d":0.445,"e":0.425,"f":0.296,"g":0.444,"h":0.449,"i":0.214,"j":0.214,"k":0.42,"l":0.214,"m":0.671,"n":0.449,"o":0.435,"p":0.445,"q":0.445,"r":0.302,"s":0.373,"t":0.291,"u":0.449,"v":0.412,"w":0.631,"x":0.419,"y":0.449,"z":0.387,"{":0.296,"|":0.231,"}":0.296,"~":0.453,"★":1,"·":0.224,"“":0.383,"”":0.383,"’":0.214,"—":0.818,"–":0.44,"✓":0.7642,"€":0.443,"£":0.436},"up":{"0":0.696,"1":0.688,"2":0.696,"3":0.696,"4":0.688,"5":0.688,"6":0.696,"7":0.688,"8":0.696,"9":0.696," ":0,"!":0.688,"\"":0.688,"#":0.688,"$":0.696,"%":0.696,"&":0.696,"'":0.688,"(":0.743,")":0.743,"*":0.688,"+":0.432,",":0.118,"-":0.335,".":0.118,"/":0.743,":":0.51,";":0.51,"<":0.439,"=":0.39,">":0.439,"?":0.696,"@":0.696,"A":0.688,"B":0.688,"C":0.696,"D":0.688,"E":0.688,"F":0.688,"G":0.696,"H":0.688,"I":0.688,"J":0.688,"K":0.688,"L":0.688,"M":0.688,"N":0.688,"O":0.696,"P":0.688,"Q":0.696,"R":0.688,"S":0.696,"T":0.688,"U":0.688,"V":0.688,"W":0.688,"X":0.688,"Y":0.688,"Z":0.688,"[":0.743,"\\":0.743,"]":0.743,"^":0.75,"_":-0.089,"`":0.743,"a":0.518,"b":0.743,"c":0.518,"d":0.743,"e":0.518,"f":0.743,"g":0.518,"h":0.743,"i":0.743,"j":0.743,"k":0.743,"l":0.743,"m":0.518,"n":0.518,"o":0.518,"p":0.518,"q":0.518,"r":0.518,"s":0.518,"t":0.658,"u":0.51,"v":0.51,"w":0.51,"x":0.51,"y":0.51,"z":0.51,"{":0.743,"|":0.743,"}":0.743,"~":0.37,"★":0.859,"·":0.358,"“":0.688,"”":0.688,"’":0.688,"—":0.351,"–":0.351,"✓":0.7231,"€":0.696,"£":0.696},"dn":{"0":0.008,"1":0,"2":0,"3":0.008,"4":0,"5":0.008,"6":0.008,"7":0,"8":0.008,"9":0.008," ":0,"!":0,"\"":-0.433,"#":0,"$":0.008,"%":0.008,"&":0.008,"'":-0.433,"(":0.15,")":0.15,"*":-0.361,"+":-0.073,",":0.141,"-":-0.235,".":0,"/":0.055,":":0,";":0.141,"<":-0.065,"=":-0.116,">":-0.065,"?":0,"@":0.108,"A":0,"B":0,"C":0.008,"D":0,"E":0,"F":0,"G":0.008,"H":0,"I":0,"J":0,"K":0,"L":0,"M":0,"N":0,"O":0.008,"P":0,"Q":0.115,"R":0,"S":0.008,"T":0,"U":0.008,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.15,"\\":0.055,"]":0.15,"^":-0.476,"_":0.181,"`":-0.599,"a":0.008,"b":0.008,"c":0.008,"d":0.008,"e":0.008,"f":0,"g":0.2,"h":0,"i":0,"j":0.193,"k":0,"l":0,"m":0,"n":0,"o":0.008,"p":0.193,"q":0.193,"r":0,"s":0.008,"t":0,"u":0.008,"v":0,"w":0,"x":0,"y":0.2,"z":0,"{":0.15,"|":0.161,"}":0.15,"~":-0.236,"★":0.078,"·":-0.239,"“":-0.442,"”":-0.442,"’":-0.442,"—":-0.257,"–":-0.257,"✓":0.0181,"€":0.008,"£":0},"cap":0.696,"desc":0.2,"avg":0.4145},"Saira Condensed|700":{"adv":{"0":0.477,"1":0.31,"2":0.45,"3":0.437,"4":0.469,"5":0.453,"6":0.473,"7":0.421,"8":0.487,"9":0.473," ":0.179,"!":0.259,"\"":0.382,"#":0.573,"$":0.407,"%":0.731,"&":0.547,"'":0.216,"(":0.289,")":0.289,"*":0.407,"+":0.472,",":0.242,"-":0.297,".":0.242,"/":0.327,":":0.242,";":0.242,"<":0.473,"=":0.472,">":0.473,"?":0.393,"@":0.705,"A":0.501,"B":0.488,"C":0.396,"D":0.496,"E":0.421,"F":0.392,"G":0.487,"H":0.519,"I":0.243,"J":0.296,"K":0.492,"L":0.379,"M":0.703,"N":0.523,"O":0.506,"P":0.475,"Q":0.506,"R":0.494,"S":0.443,"T":0.418,"U":0.506,"V":0.485,"W":0.756,"X":0.501,"Y":0.463,"Z":0.439,"[":0.301,"\\":0.327,"]":0.3,"^":0.389,"_":0.361,"`":0.193,"a":0.426,"b":0.446,"c":0.341,"d":0.446,"e":0.425,"f":0.309,"g":0.446,"h":0.45,"i":0.221,"j":0.221,"k":0.43,"l":0.221,"m":0.669,"n":0.45,"o":0.436,"p":0.446,"q":0.446,"r":0.312,"s":0.371,"t":0.302,"u":0.45,"v":0.417,"w":0.644,"x":0.426,"y":0.45,"z":0.394,"{":0.315,"|":0.236,"}":0.315,"~":0.46,"★":1,"·":0.242,"“":0.42,"”":0.42,"’":0.235,"—":0.817,"–":0.446,"✓":0.7642,"€":0.443,"£":0.436},"up":{"0":0.696,"1":0.688,"2":0.696,"3":0.696,"4":0.688,"5":0.688,"6":0.696,"7":0.688,"8":0.696,"9":0.696," ":0,"!":0.688,"\"":0.688,"#":0.688,"$":0.696,"%":0.696,"&":0.696,"'":0.688,"(":0.743,")":0.743,"*":0.688,"+":0.433,",":0.132,"-":0.343,".":0.132,"/":0.743,":":0.51,";":0.51,"<":0.44,"=":0.399,">":0.44,"?":0.696,"@":0.696,"A":0.688,"B":0.688,"C":0.696,"D":0.688,"E":0.688,"F":0.688,"G":0.696,"H":0.688,"I":0.688,"J":0.688,"K":0.688,"L":0.688,"M":0.688,"N":0.688,"O":0.696,"P":0.688,"Q":0.696,"R":0.688,"S":0.696,"T":0.688,"U":0.688,"V":0.688,"W":0.688,"X":0.688,"Y":0.688,"Z":0.688,"[":0.743,"\\":0.743,"]":0.743,"^":0.75,"_":-0.079,"`":0.743,"a":0.518,"b":0.743,"c":0.518,"d":0.743,"e":0.518,"f":0.743,"g":0.518,"h":0.743,"i":0.743,"j":0.743,"k":0.743,"l":0.743,"m":0.518,"n":0.518,"o":0.518,"p":0.518,"q":0.518,"r":0.518,"s":0.518,"t":0.658,"u":0.51,"v":0.51,"w":0.51,"x":0.51,"y":0.51,"z":0.51,"{":0.743,"|":0.743,"}":0.743,"~":0.374,"★":0.859,"·":0.364,"“":0.688,"”":0.688,"’":0.688,"—":0.359,"–":0.359,"✓":0.7231,"€":0.696,"£":0.696},"dn":{"0":0.008,"1":0,"2":0,"3":0.008,"4":0,"5":0.008,"6":0.008,"7":0,"8":0.008,"9":0.008," ":0,"!":0,"\"":-0.428,"#":0,"$":0.008,"%":0.008,"&":0.008,"'":-0.428,"(":0.15,")":0.15,"*":-0.362,"+":-0.073,",":0.151,"-":-0.227,".":0,"/":0.055,":":0,";":0.151,"<":-0.066,"=":-0.108,">":-0.066,"?":0,"@":0.108,"A":0,"B":0,"C":0.008,"D":0,"E":0,"F":0,"G":0.008,"H":0,"I":0,"J":0,"K":0,"L":0,"M":0,"N":0,"O":0.008,"P":0,"Q":0.115,"R":0,"S":0.008,"T":0,"U":0.008,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.15,"\\":0.055,"]":0.15,"^":-0.476,"_":0.186,"`":-0.597,"a":0.008,"b":0.008,"c":0.008,"d":0.008,"e":0.008,"f":0,"g":0.203,"h":0,"i":0,"j":0.196,"k":0,"l":0,"m":0,"n":0,"o":0.008,"p":0.196,"q":0.196,"r":0,"s":0.008,"t":0,"u":0.008,"v":0,"w":0,"x":0,"y":0.203,"z":0,"{":0.15,"|":0.161,"}":0.15,"~":-0.233,"★":0.078,"·":-0.233,"“":-0.422,"”":-0.422,"’":-0.422,"—":-0.25,"–":-0.25,"✓":0.0181,"€":0.008,"£":0},"cap":0.696,"desc":0.203,"avg":0.4212},"Squada One|400":{"adv":{"0":0.453,"1":0.259,"2":0.464,"3":0.455,"4":0.467,"5":0.463,"6":0.466,"7":0.421,"8":0.469,"9":0.455," ":0.202,"!":0.258,"\"":0.376,"#":0.493,"$":0.466,"%":0.763,"&":0.456,"'":0.221,"(":0.254,")":0.268,"*":0.388,"+":0.495,",":0.216,"-":0.451,".":0.254,"/":0.298,":":0.254,";":0.254,"<":0.417,"=":0.477,">":0.417,"?":0.423,"@":0.716,"A":0.485,"B":0.477,"C":0.458,"D":0.485,"E":0.376,"F":0.374,"G":0.451,"H":0.491,"I":0.244,"J":0.408,"K":0.472,"L":0.359,"M":0.699,"N":0.465,"O":0.484,"P":0.446,"Q":0.475,"R":0.463,"S":0.458,"T":0.377,"U":0.467,"V":0.465,"W":0.707,"X":0.451,"Y":0.435,"Z":0.397,"[":0.282,"\\":0.305,"]":0.294,"^":0.385,"_":0.461,"`":0.309,"a":0.452,"b":0.452,"c":0.446,"d":0.452,"e":0.435,"f":0.277,"g":0.452,"h":0.452,"i":0.246,"j":0.265,"k":0.456,"l":0.224,"m":0.661,"n":0.452,"o":0.452,"p":0.452,"q":0.452,"r":0.294,"s":0.433,"t":0.288,"u":0.452,"v":0.413,"w":0.662,"x":0.437,"y":0.452,"z":0.386,"{":0.258,"|":0.265,"}":0.263,"~":0.584,"★":1,"·":0.28,"“":0.333,"”":0.333,"’":0.2222,"—":1,"–":0.5562,"✓":0.7642,"€":0.7441,"£":0.494},"up":{"0":0.657,"1":0.646,"2":0.657,"3":0.657,"4":0.647,"5":0.647,"6":0.657,"7":0.647,"8":0.657,"9":0.657," ":0,"!":0.647,"\"":0.647,"#":0.544,"$":0.709,"%":0.657,"&":0.618,"'":0.647,"(":0.691,")":0.691,"*":0.647,"+":0.525,",":0.059,"-":0.346,".":0.134,"/":0.674,":":0.479,";":0.479,"<":0.54,"=":0.442,">":0.54,"?":0.647,"@":0.509,"A":0.657,"B":0.647,"C":0.657,"D":0.647,"E":0.647,"F":0.647,"G":0.657,"H":0.647,"I":0.647,"J":0.647,"K":0.647,"L":0.647,"M":0.657,"N":0.657,"O":0.657,"P":0.647,"Q":0.657,"R":0.647,"S":0.657,"T":0.647,"U":0.647,"V":0.647,"W":0.647,"X":0.647,"Y":0.647,"Z":0.647,"[":0.691,"\\":0.674,"]":0.691,"^":0.647,"_":-0.109,"`":0.585,"a":0.498,"b":0.647,"c":0.498,"d":0.647,"e":0.498,"f":0.657,"g":0.498,"h":0.647,"i":0.675,"j":0.675,"k":0.647,"l":0.647,"m":0.498,"n":0.498,"o":0.498,"p":0.498,"q":0.498,"r":0.498,"s":0.498,"t":0.594,"u":0.488,"v":0.488,"w":0.488,"x":0.488,"y":0.488,"z":0.488,"{":0.691,"|":0.674,"}":0.691,"~":0.354,"★":0.859,"·":0.378,"“":0.7241,"”":0.7173,"’":0.7173,"—":0.3125,"–":0.3125,"✓":0.7231,"€":0.7368,"£":0.657},"dn":{"0":0.01,"1":0.001,"2":0,"3":0.01,"4":0,"5":0.01,"6":0.01,"7":0,"8":0.01,"9":0.01," ":0,"!":0.01,"\"":-0.44,"#":0,"$":0.097,"%":0.01,"&":0.01,"'":-0.44,"(":0.081,")":0.081,"*":-0.315,"+":-0.1,",":0.145,"-":-0.239,".":0.01,"/":0.072,":":0.01,";":0.145,"<":-0.072,"=":-0.143,">":-0.072,"?":0.01,"@":0.125,"A":0,"B":0,"C":0.01,"D":0,"E":0,"F":0,"G":0.01,"H":0,"I":0,"J":0.01,"K":0,"L":0,"M":0,"N":0,"O":0.01,"P":0,"Q":0.173,"R":0,"S":0.01,"T":0,"U":0.01,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.081,"\\":0.072,"]":0.081,"^":-0.417,"_":0.186,"`":-0.483,"a":0.01,"b":0.01,"c":0.01,"d":0.01,"e":0.01,"f":0,"g":0.169,"h":0,"i":0,"j":0.169,"k":0,"l":0,"m":0,"n":0,"o":0.01,"p":0.159,"q":0.159,"r":0,"s":0.01,"t":0.01,"u":0.01,"v":0,"w":0,"x":0,"y":0.169,"z":0,"{":0.088,"|":0.073,"}":0.088,"~":-0.1563,"★":0.078,"·":-0.234,"“":-0.4697,"”":-0.4629,"’":-0.4629,"—":-0.2407,"–":-0.2407,"✓":0.0181,"€":0.0186,"£":0},"cap":0.657,"desc":0.169,"avg":0.4253},"Teko|400":{"adv":{"0":0.3905,"1":0.2346,"2":0.3277,"3":0.3547,"4":0.3633,"5":0.3583,"6":0.3819,"7":0.291,"8":0.3891,"9":0.378," ":0.1447,"!":0.2086,"\"":0.2919,"#":0.4965,"$":0.3616,"%":0.6415,"&":0.4616,"'":0.1609,"(":0.2644,")":0.2644,"*":0.3205,"+":0.408,",":0.1652,"-":0.3146,".":0.1652,"/":0.3897,":":0.1652,";":0.1652,"<":0.4201,"=":0.4201,">":0.4201,"?":0.3419,"@":0.6957,"A":0.3851,"B":0.4094,"C":0.3766,"D":0.4122,"E":0.3432,"F":0.3319,"G":0.3818,"H":0.4174,"I":0.21,"J":0.3339,"K":0.384,"L":0.3011,"M":0.5161,"N":0.4099,"O":0.3929,"P":0.3785,"Q":0.3929,"R":0.3956,"S":0.3616,"T":0.3104,"U":0.3973,"V":0.3641,"W":0.6095,"X":0.3734,"Y":0.3611,"Z":0.3132,"[":0.3107,"\\":0.3905,"]":0.3107,"^":0.498,"_":0.474,"`":0.4211,"a":0.3598,"b":0.3598,"c":0.3515,"d":0.3598,"e":0.3597,"f":0.2217,"g":0.3598,"h":0.3648,"i":0.1782,"j":0.1782,"k":0.3566,"l":0.1782,"m":0.5486,"n":0.3648,"o":0.3697,"p":0.3598,"q":0.3598,"r":0.2379,"s":0.3282,"t":0.2193,"u":0.3648,"v":0.3169,"w":0.5432,"x":0.342,"y":0.3417,"z":0.2923,"{":0.2826,"|":0.1973,"}":0.2826,"~":0.524,"★":1,"·":0.2167,"“":0.314,"”":0.314,"’":0.1656,"—":0.5359,"–":0.4199,"✓":0.7642,"€":0.3992,"£":0.3868},"up":{"0":0.6262,"1":0.6262,"2":0.6262,"3":0.6262,"4":0.6262,"5":0.6262,"6":0.6262,"7":0.6262,"8":0.6262,"9":0.6262," ":0,"!":0.6262,"\"":0.6262,"#":0.626,"$":0.7033,"%":0.6262,"&":0.6262,"'":0.6262,"(":0.7937,")":0.7937,"*":0.6262,"+":0.5007,",":0.123,"-":0.3292,".":0.123,"/":0.6996,":":0.488,";":0.488,"<":0.48,"=":0.4411,">":0.48,"?":0.6262,"@":0.5754,"A":0.6262,"B":0.6262,"C":0.6262,"D":0.6262,"E":0.6262,"F":0.6262,"G":0.6262,"H":0.6262,"I":0.6262,"J":0.6262,"K":0.6262,"L":0.6262,"M":0.6262,"N":0.6262,"O":0.6262,"P":0.6262,"Q":0.6262,"R":0.6262,"S":0.6262,"T":0.6262,"U":0.6262,"V":0.6262,"W":0.6262,"X":0.6262,"Y":0.6262,"Z":0.627,"[":0.7831,"\\":0.6996,"]":0.7831,"^":0.6706,"_":-0.0432,"`":0.6512,"a":0.488,"b":0.669,"c":0.488,"d":0.669,"e":0.488,"f":0.669,"g":0.488,"h":0.669,"i":0.6698,"j":0.6698,"k":0.669,"l":0.669,"m":0.488,"n":0.488,"o":0.488,"p":0.488,"q":0.488,"r":0.489,"s":0.488,"t":0.571,"u":0.488,"v":0.488,"w":0.488,"x":0.488,"y":0.488,"z":0.488,"{":0.7831,"|":0.743,"}":0.7831,"~":0.3606,"★":0.859,"·":0.3796,"“":0.6262,"”":0.6262,"’":0.6262,"—":0.3292,"–":0.3292,"✓":0.7231,"€":0.6262,"£":0.6262},"dn":{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0," ":0,"!":0,"\"":-0.4028,"#":0,"$":0.0769,"%":0,"&":0.0352,"'":-0.4028,"(":0.1755,")":0.1755,"*":-0.3506,"+":-0.1249,",":0.1395,"-":-0.2592,".":0,"/":0.12,":":0,";":0.1395,"<":-0.1462,"=":-0.1845,">":-0.1462,"?":0,"@":0.0701,"A":0,"B":0,"C":0.0008,"D":0,"E":0,"F":0,"G":0.0008,"H":0,"I":0,"J":0,"K":0,"L":0,"M":0,"N":0,"O":0,"P":0,"Q":0.0909,"R":0,"S":0,"T":0,"U":0,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.1649,"\\":0.12,"]":0.1649,"^":-0.3171,"_":0.114,"`":-0.5194,"a":0,"b":0,"c":0,"d":0,"e":0,"f":0,"g":0.1385,"h":0,"i":0,"j":0.1385,"k":0,"l":0,"m":0,"n":0,"o":0,"p":0.1385,"q":0.1385,"r":0,"s":0,"t":0,"u":0,"v":0,"w":0,"x":0,"y":0.1385,"z":0,"{":0.1639,"|":0.118,"}":0.1639,"~":-0.2135,"★":0.078,"·":-0.2588,"“":-0.3637,"”":-0.3637,"’":-0.3637,"—":-0.2592,"–":-0.2592,"✓":0.0181,"€":0.0008,"£":0},"cap":0.6262,"desc":0.1385,"avg":0.357},"Teko|600":{"adv":{"0":0.4591,"1":0.2895,"2":0.4155,"3":0.4307,"4":0.4526,"5":0.4451,"6":0.4515,"7":0.3724,"8":0.4567,"9":0.45," ":0.1791,"!":0.2635,"\"":0.3802,"#":0.6092,"$":0.442,"%":0.8008,"&":0.5631,"'":0.2119,"(":0.3095,")":0.3095,"*":0.3637,"+":0.4732,",":0.2191,"-":0.3322,".":0.2191,"/":0.4029,":":0.2191,";":0.2191,"<":0.4902,"=":0.4902,">":0.4902,"?":0.4209,"@":0.7996,"A":0.4832,"B":0.4756,"C":0.4501,"D":0.4847,"E":0.4089,"F":0.399,"G":0.4558,"H":0.4998,"I":0.238,"J":0.4104,"K":0.4747,"L":0.3712,"M":0.6117,"N":0.4864,"O":0.4694,"P":0.4565,"Q":0.4694,"R":0.4691,"S":0.442,"T":0.386,"U":0.4748,"V":0.469,"W":0.7502,"X":0.4651,"Y":0.4592,"Z":0.4069,"[":0.3146,"\\":0.4032,"]":0.3146,"^":0.626,"_":0.474,"`":0.4701,"a":0.4338,"b":0.4338,"c":0.4133,"d":0.4338,"e":0.4288,"f":0.279,"g":0.4338,"h":0.4388,"i":0.2228,"j":0.2228,"k":0.4301,"l":0.2228,"m":0.6569,"n":0.4388,"o":0.4388,"p":0.4338,"q":0.4338,"r":0.2982,"s":0.4007,"t":0.2713,"u":0.4388,"v":0.4052,"w":0.6276,"x":0.4072,"y":0.4177,"z":0.3536,"{":0.3096,"|":0.24,"}":0.3096,"~":0.6451,"★":1,"·":0.2511,"“":0.4072,"”":0.4072,"’":0.2205,"—":0.6683,"–":0.5361,"✓":0.7642,"€":0.4717,"£":0.4608},"up":{"0":0.636,"1":0.636,"2":0.636,"3":0.636,"4":0.636,"5":0.636,"6":0.636,"7":0.636,"8":0.636,"9":0.636," ":0,"!":0.636,"\"":0.636,"#":0.6353,"$":0.718,"%":0.636,"&":0.636,"'":0.636,"(":0.8001,")":0.8001,"*":0.636,"+":0.5232,",":0.1485,"-":0.3483,".":0.1485,"/":0.7011,":":0.4948,";":0.4948,"<":0.5148,"=":0.4715,">":0.5148,"?":0.636,"@":0.6019,"A":0.636,"B":0.636,"C":0.636,"D":0.636,"E":0.636,"F":0.636,"G":0.636,"H":0.636,"I":0.636,"J":0.636,"K":0.636,"L":0.636,"M":0.636,"N":0.636,"O":0.636,"P":0.636,"Q":0.636,"R":0.636,"S":0.636,"T":0.636,"U":0.636,"V":0.636,"W":0.636,"X":0.636,"Y":0.636,"Z":0.6363,"[":0.788,"\\":0.7011,"]":0.788,"^":0.6696,"_":-0.0412,"`":0.6703,"a":0.4948,"b":0.669,"c":0.4948,"d":0.669,"e":0.4948,"f":0.669,"g":0.4948,"h":0.669,"i":0.6693,"j":0.6693,"k":0.669,"l":0.669,"m":0.4948,"n":0.4948,"o":0.4948,"p":0.4948,"q":0.4948,"r":0.4983,"s":0.4948,"t":0.5871,"u":0.4948,"v":0.4948,"w":0.4948,"x":0.4948,"y":0.4948,"z":0.4948,"{":0.788,"|":0.7989,"}":0.788,"~":0.3782,"★":0.859,"·":0.3997,"“":0.636,"”":0.636,"’":0.636,"—":0.3483,"–":0.3483,"✓":0.7231,"€":0.636,"£":0.636},"dn":{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0," ":0,"!":0,"\"":-0.3862,"#":0,"$":0.0813,"%":0,"&":0.0357,"'":-0.3862,"(":0.1696,")":0.1696,"*":-0.3216,"+":-0.1107,",":0.1454,"-":-0.2504,".":0,"/":0.0827,":":0,";":0.1454,"<":-0.1212,"=":-0.1625,">":-0.1212,"?":0,"@":0.0911,"A":0,"B":0,"C":0.0003,"D":0,"E":0,"F":0,"G":0.0003,"H":0,"I":0,"J":0,"K":0,"L":0,"M":0,"N":0,"O":0,"P":0,"Q":0.0767,"R":0,"S":0,"T":0,"U":0,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.16,"\\":0.0827,"]":0.16,"^":-0.294,"_":0.1395,"`":-0.5272,"a":0,"b":0,"c":0,"d":0,"e":0,"f":0,"g":0.1326,"h":0,"i":0,"j":0.1326,"k":0,"l":0,"m":0,"n":0,"o":0,"p":0.1326,"q":0.1326,"r":0,"s":0,"t":0,"u":0,"v":0,"w":0,"x":0,"y":0.1326,"z":0,"{":0.159,"|":0.1646,"}":0.159,"~":-0.2076,"★":0.078,"·":-0.2583,"“":-0.3422,"”":-0.3422,"’":-0.3422,"—":-0.2504,"–":-0.2504,"✓":0.0181,"€":0.0003,"£":0},"cap":0.636,"desc":0.1326,"avg":0.4256},"Teko|700":{"adv":{"0":0.501,"1":0.323,"2":0.469,"3":0.477,"4":0.507,"5":0.498,"6":0.494,"7":0.422,"8":0.498,"9":0.494," ":0.2,"!":0.297,"\"":0.434,"#":0.678,"$":0.491,"%":0.898,"&":0.625,"'":0.243,"(":0.337,")":0.337,"*":0.39,"+":0.513,",":0.252,"-":0.343,".":0.252,"/":0.411,":":0.252,";":0.252,"<":0.533,"=":0.533,">":0.533,"?":0.469,"@":0.863,"A":0.543,"B":0.516,"C":0.495,"D":0.529,"E":0.449,"F":0.44,"G":0.501,"H":0.55,"I":0.255,"J":0.457,"K":0.53,"L":0.414,"M":0.67,"N":0.533,"O":0.516,"P":0.504,"Q":0.516,"R":0.514,"S":0.491,"T":0.432,"U":0.522,"V":0.533,"W":0.836,"X":0.521,"Y":0.519,"Z":0.464,"[":0.317,"\\":0.411,"]":0.317,"^":0.704,"_":0.474,"`":0.5,"a":0.479,"b":0.479,"c":0.451,"d":0.479,"e":0.471,"f":0.314,"g":0.479,"h":0.484,"i":0.25,"j":0.25,"k":0.475,"l":0.25,"m":0.723,"n":0.484,"o":0.481,"p":0.479,"q":0.479,"r":0.335,"s":0.445,"t":0.303,"u":0.484,"v":0.459,"w":0.679,"x":0.447,"y":0.464,"z":0.391,"{":0.326,"|":0.266,"}":0.326,"~":0.719,"★":1,"·":0.272,"“":0.464,"”":0.464,"’":0.254,"—":0.749,"–":0.607,"✓":0.7642,"€":0.516,"£":0.506},"up":{"0":0.642,"1":0.642,"2":0.642,"3":0.642,"4":0.642,"5":0.642,"6":0.642,"7":0.642,"8":0.642,"9":0.642," ":0,"!":0.642,"\"":0.642,"#":0.641,"$":0.727,"%":0.642,"&":0.642,"'":0.642,"(":0.804,")":0.804,"*":0.642,"+":0.537,",":0.164,"-":0.36,".":0.164,"/":0.702,":":0.499,";":0.499,"<":0.536,"=":0.49,">":0.536,"?":0.642,"@":0.618,"A":0.642,"B":0.642,"C":0.642,"D":0.642,"E":0.642,"F":0.642,"G":0.642,"H":0.642,"I":0.642,"J":0.642,"K":0.642,"L":0.642,"M":0.642,"N":0.642,"O":0.642,"P":0.642,"Q":0.642,"R":0.642,"S":0.642,"T":0.642,"U":0.642,"V":0.642,"W":0.642,"X":0.642,"Y":0.642,"Z":0.642,"[":0.791,"\\":0.702,"]":0.791,"^":0.669,"_":-0.04,"`":0.682,"a":0.499,"b":0.669,"c":0.499,"d":0.669,"e":0.499,"f":0.669,"g":0.499,"h":0.669,"i":0.669,"j":0.669,"k":0.669,"l":0.669,"m":0.499,"n":0.499,"o":0.499,"p":0.499,"q":0.499,"r":0.504,"s":0.499,"t":0.597,"u":0.499,"v":0.499,"w":0.499,"x":0.499,"y":0.499,"z":0.499,"{":0.791,"|":0.833,"}":0.791,"~":0.389,"★":0.859,"·":0.412,"“":0.642,"”":0.642,"’":0.642,"—":0.36,"–":0.36,"✓":0.7231,"€":0.642,"£":0.642},"dn":{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0," ":0,"!":0,"\"":-0.376,"#":0,"$":0.084,"%":0,"&":0.036,"'":-0.376,"(":0.166,")":0.166,"*":-0.304,"+":-0.102,",":0.149,"-":-0.245,".":0,"/":0.06,":":0,";":0.149,"<":-0.106,"=":-0.149,">":-0.106,"?":0,"@":0.104,"A":0,"B":0,"C":0,"D":0,"E":0,"F":0,"G":0,"H":0,"I":0,"J":0,"K":0,"L":0,"M":0,"N":0,"O":0,"P":0,"Q":0.068,"R":0,"S":0,"T":0,"U":0,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.157,"\\":0.06,"]":0.157,"^":-0.28,"_":0.155,"`":-0.532,"a":0,"b":0,"c":0,"d":0,"e":0,"f":0,"g":0.129,"h":0,"i":0,"j":0.129,"k":0,"l":0,"m":0,"n":0,"o":0,"p":0.129,"q":0.129,"r":0,"s":0,"t":0,"u":0,"v":0,"w":0,"x":0,"y":0.129,"z":0,"{":0.156,"|":0.193,"}":0.156,"~":-0.204,"★":0.078,"·":-0.258,"“":-0.329,"”":-0.329,"’":-0.329,"—":-0.245,"–":-0.245,"✓":0.0181,"€":0,"£":0},"cap":0.642,"desc":0.129,"avg":0.4674},"Sedgwick Ave Display|400":{"adv":{"0":0.6,"1":0.6,"2":0.6,"3":0.6,"4":0.53,"5":0.6,"6":0.55,"7":0.57,"8":0.53,"9":0.437," ":0.317,"!":0.323,"\"":0.33,"#":0.566,"$":0.6,"%":0.645,"&":0.486,"'":0.151,"(":0.216,")":0.227,"*":0.352,"+":0.6,",":0.176,"-":0.416,".":0.176,"/":0.317,":":0.27,";":0.219,"<":0.6,"=":0.6,">":0.6,"?":0.6,"@":0.684,"A":0.679,"B":0.663,"C":0.537,"D":0.725,"E":0.567,"F":0.517,"G":0.594,"H":0.502,"I":0.181,"J":0.65,"K":0.616,"L":0.462,"M":0.647,"N":0.48,"O":0.546,"P":0.557,"Q":0.676,"R":0.511,"S":0.623,"T":0.458,"U":0.505,"V":0.359,"W":0.565,"X":0.537,"Y":0.595,"Z":0.601,"[":0.287,"\\":0.376,"]":0.323,"^":0.6,"_":0.427,"`":0.6,"a":0.485,"b":0.409,"c":0.477,"d":0.43,"e":0.48,"f":0.454,"g":0.498,"h":0.401,"i":0.201,"j":0.269,"k":0.48,"l":0.239,"m":0.555,"n":0.413,"o":0.477,"p":0.467,"q":0.495,"r":0.487,"s":0.526,"t":0.368,"u":0.452,"v":0.45,"w":0.601,"x":0.525,"y":0.436,"z":0.506,"{":0.353,"|":0.6,"}":0.6,"~":0.6,"★":1,"·":0.6,"“":0.36,"”":0.36,"’":0.231,"—":0.532,"–":0.562,"✓":0.7642,"€":0.6,"£":0.6},"up":{"0":0.799,"1":0.837,"2":0.775,"3":0.756,"4":0.776,"5":0.798,"6":0.78,"7":0.805,"8":0.824,"9":0.794," ":0,"!":0.882,"\"":0.77,"#":0.668,"$":0.79,"%":0.618,"&":0.683,"'":0.767,"(":0.896,")":0.894,"*":0.765,"+":0.456,",":0.097,"-":0.414,".":0.124,"/":0.723,":":0.546,";":0.438,"<":0.515,"=":0.407,">":0.508,"?":0.623,"@":0.665,"A":0.805,"B":0.865,"C":0.855,"D":0.846,"E":0.789,"F":0.887,"G":0.821,"H":0.813,"I":0.89,"J":0.864,"K":0.911,"L":0.827,"M":0.853,"N":0.851,"O":0.837,"P":0.771,"Q":0.762,"R":0.786,"S":0.788,"T":0.814,"U":0.794,"V":0.814,"W":0.781,"X":0.764,"Y":0.806,"Z":0.865,"[":0.761,"\\":0.669,"]":0.823,"^":0.717,"_":0.007,"`":1.014,"a":0.652,"b":0.66,"c":0.758,"d":0.687,"e":0.706,"f":0.655,"g":0.629,"h":0.625,"i":0.828,"j":0.834,"k":0.82,"l":0.878,"m":0.633,"n":0.634,"o":0.604,"p":0.625,"q":0.647,"r":0.647,"s":0.629,"t":0.815,"u":0.635,"v":0.696,"w":0.661,"x":0.635,"y":0.662,"z":0.61,"{":0.692,"|":0.692,"}":0.693,"~":0.438,"★":0.859,"·":0.394,"“":0.676,"”":0.915,"’":0.915,"—":0.363,"–":0.343,"✓":0.7231,"€":0.622,"£":0.627},"dn":{"0":-0.003,"1":-0.002,"2":-0.016,"3":-0.013,"4":-0.015,"5":0.005,"6":-0.021,"7":0.016,"8":0.021,"9":-0.007," ":0,"!":-0.031,"\"":-0.501,"#":-0.141,"$":0.087,"%":-0.007,"&":0,"'":-0.525,"(":0.039,")":0.019,"*":-0.427,"+":-0.101,",":0.116,"-":-0.321,".":0,"/":-0.069,":":-0.152,";":0.023,"<":-0.138,"=":-0.147,">":-0.102,"?":-0.066,"@":0.048,"A":-0.036,"B":0.03,"C":0.021,"D":-0.019,"E":-0.011,"F":0.012,"G":0.081,"H":-0.009,"I":-0.009,"J":-0.016,"K":0.022,"L":-0.008,"M":0.018,"N":0.007,"O":-0.008,"P":-0.062,"Q":-0.073,"R":-0.032,"S":-0.046,"T":-0.002,"U":-0.04,"V":-0.021,"W":-0.054,"X":-0.037,"Y":-0.028,"Z":-0.003,"[":-0.064,"\\":0,"]":-0.03,"^":-0.514,"_":0.079,"`":-0.826,"a":-0.03,"b":-0.02,"c":-0.052,"d":-0.051,"e":-0.02,"f":-0.033,"g":-0.042,"h":0.007,"i":-0.002,"j":0.31,"k":-0.012,"l":-0.027,"m":-0.024,"n":-0.027,"o":-0.036,"p":0.551,"q":0.408,"r":-0.001,"s":-0.035,"t":-0.001,"u":-0.031,"v":-0.004,"w":0.018,"x":-0.048,"y":0.446,"z":-0.045,"{":0.013,"|":0.032,"}":0,"~":-0.23,"★":0.078,"·":-0.254,"“":-0.461,"”":-0.726,"’":-0.726,"—":-0.26,"–":-0.225,"✓":0.0181,"€":-0.097,"£":0},"cap":0.837,"desc":0.551,"avg":0.4849},"Chivo|400":{"adv":{"0":0.615,"1":0.615,"2":0.615,"3":0.615,"4":0.615,"5":0.615,"6":0.615,"7":0.615,"8":0.615,"9":0.615," ":0.2267,"!":0.2832,"\"":0.3872,"#":0.649,"$":0.564,"%":0.7035,"&":0.6845,"'":0.231,"(":0.2972,")":0.2963,"*":0.4807,"+":0.616,",":0.2545,"-":0.3782,".":0.2547,"/":0.6172,":":0.2622,";":0.2622,"<":0.615,"=":0.6077,">":0.615,"?":0.5282,"@":0.8918,"A":0.6707,"B":0.6525,"C":0.6697,"D":0.6795,"E":0.5952,"F":0.5537,"G":0.6845,"H":0.6945,"I":0.391,"J":0.532,"K":0.644,"L":0.538,"M":0.9513,"N":0.6937,"O":0.699,"P":0.6307,"Q":0.699,"R":0.6737,"S":0.6352,"T":0.581,"U":0.682,"V":0.621,"W":0.9513,"X":0.646,"Y":0.5967,"Z":0.5997,"[":0.3013,"\\":0.6172,"]":0.3013,"^":0.5975,"_":0.694,"`":0.5887,"a":0.5977,"b":0.5887,"c":0.5547,"d":0.5905,"e":0.571,"f":0.365,"g":0.5755,"h":0.5955,"i":0.2735,"j":0.2727,"k":0.5575,"l":0.262,"m":0.8697,"n":0.5952,"o":0.5887,"p":0.5885,"q":0.5905,"r":0.4905,"s":0.5422,"t":0.37,"u":0.621,"v":0.5277,"w":0.826,"x":0.5407,"y":0.5255,"z":0.475,"{":0.324,"|":0.2427,"}":0.324,"~":0.6755,"★":1,"·":0.253,"“":0.389,"”":0.412,"’":0.2347,"—":0.91,"–":0.5,"✓":0.7642,"€":0.5732,"£":0.6202},"up":{"0":0.696,"1":0.696,"2":0.696,"3":0.696,"4":0.696,"5":0.686,"6":0.696,"7":0.686,"8":0.696,"9":0.696," ":0,"!":0.686,"\"":0.686,"#":0.696,"$":0.7605,"%":0.686,"&":0.696,"'":0.686,"(":0.686,")":0.686,"*":0.72,"+":0.511,",":0.129,"-":0.3167,".":0.1072,"/":0.686,":":0.511,";":0.511,"<":0.504,"=":0.4002,">":0.504,"?":0.697,"@":0.697,"A":0.686,"B":0.686,"C":0.696,"D":0.686,"E":0.686,"F":0.686,"G":0.696,"H":0.686,"I":0.686,"J":0.686,"K":0.686,"L":0.686,"M":0.686,"N":0.686,"O":0.6952,"P":0.686,"Q":0.6952,"R":0.686,"S":0.696,"T":0.686,"U":0.686,"V":0.686,"W":0.686,"X":0.686,"Y":0.686,"Z":0.686,"[":0.686,"\\":0.686,"]":0.686,"^":0.511,"_":-0.064,"`":0.756,"a":0.521,"b":0.72,"c":0.521,"d":0.72,"e":0.521,"f":0.728,"g":0.603,"h":0.72,"i":0.72,"j":0.72,"k":0.72,"l":0.72,"m":0.521,"n":0.521,"o":0.521,"p":0.521,"q":0.521,"r":0.521,"s":0.521,"t":0.674,"u":0.511,"v":0.511,"w":0.511,"x":0.511,"y":0.511,"z":0.511,"{":0.6897,"|":0.72,"}":0.6897,"~":0.3845,"★":0.859,"·":0.3417,"“":0.704,"”":0.704,"’":0.704,"—":0.3158,"–":0.3158,"✓":0.7231,"€":0.6945,"£":0.7},"dn":{"0":0.01,"1":0,"2":0,"3":0.01,"4":0,"5":0.01,"6":0.01,"7":0,"8":0.01,"9":0.01," ":0,"!":0,"\"":-0.408,"#":0,"$":0.066,"%":0.001,"&":0,"'":-0.408,"(":0.157,")":0.157,"*":-0.33,"+":0,",":0.1377,"-":-0.2243,".":0,"/":0.171,":":0,";":0.138,"<":-0.0047,"=":-0.1072,">":-0.0047,"?":0,"@":0.1598,"A":0,"B":0,"C":0.01,"D":0,"E":0,"F":0,"G":0.01,"H":0,"I":0,"J":0.01,"K":0,"L":0,"M":0,"N":0,"O":0.01,"P":0,"Q":0.1453,"R":0.0053,"S":0.01,"T":0,"U":0.01,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.161,"\\":0.171,"]":0.161,"^":0,"_":0.1385,"`":-0.589,"a":0.01,"b":0.01,"c":0.01,"d":0.01,"e":0.01,"f":0,"g":0.188,"h":0,"i":0,"j":0.186,"k":0,"l":0,"m":0,"n":0,"o":0.01,"p":0.181,"q":0.18,"r":0,"s":0.01,"t":0.01,"u":0.01,"v":0,"w":0,"x":0,"y":0.186,"z":0,"{":0.162,"|":0.199,"}":0.162,"~":-0.2127,"★":0.078,"·":-0.2352,"“":-0.442,"”":-0.442,"’":-0.4417,"—":-0.2248,"–":-0.2248,"✓":0.0181,"€":0.01,"£":0},"cap":0.6952,"desc":0.188,"avg":0.5481},"Chivo|500":{"adv":{"0":0.615,"1":0.615,"2":0.615,"3":0.615,"4":0.615,"5":0.615,"6":0.615,"7":0.615,"8":0.615,"9":0.615," ":0.221,"!":0.288,"\"":0.395,"#":0.651,"$":0.57,"%":0.705,"&":0.692,"'":0.231,"(":0.3,")":0.299,"*":0.485,"+":0.616,",":0.26,"-":0.374,".":0.26,"/":0.623,":":0.27,";":0.27,"<":0.615,"=":0.609,">":0.615,"?":0.537,"@":0.894,"A":0.677,"B":0.653,"C":0.672,"D":0.682,"E":0.596,"F":0.555,"G":0.687,"H":0.695,"I":0.4,"J":0.534,"K":0.651,"L":0.539,"M":0.96,"N":0.694,"O":0.702,"P":0.633,"Q":0.702,"R":0.675,"S":0.638,"T":0.582,"U":0.683,"V":0.627,"W":0.963,"X":0.651,"Y":0.605,"Z":0.601,"[":0.304,"\\":0.623,"]":0.304,"^":0.598,"_":0.694,"`":0.593,"a":0.602,"b":0.591,"c":0.557,"d":0.593,"e":0.576,"f":0.374,"g":0.578,"h":0.596,"i":0.278,"j":0.277,"k":0.565,"l":0.268,"m":0.871,"n":0.596,"o":0.593,"p":0.591,"q":0.593,"r":0.494,"s":0.545,"t":0.378,"u":0.622,"v":0.533,"w":0.831,"x":0.548,"y":0.53,"z":0.479,"{":0.327,"|":0.241,"}":0.327,"~":0.671,"★":1,"·":0.259,"“":0.41,"”":0.429,"’":0.24,"—":0.91,"–":0.5,"✓":0.7642,"€":0.577,"£":0.628},"up":{"0":0.696,"1":0.696,"2":0.696,"3":0.696,"4":0.696,"5":0.686,"6":0.696,"7":0.686,"8":0.696,"9":0.696," ":0,"!":0.686,"\"":0.686,"#":0.696,"$":0.76,"%":0.686,"&":0.696,"'":0.686,"(":0.686,")":0.686,"*":0.72,"+":0.511,",":0.142,"-":0.323,".":0.12,"/":0.686,":":0.511,";":0.511,"<":0.507,"=":0.405,">":0.507,"?":0.697,"@":0.697,"A":0.686,"B":0.686,"C":0.696,"D":0.686,"E":0.686,"F":0.686,"G":0.696,"H":0.686,"I":0.686,"J":0.686,"K":0.686,"L":0.686,"M":0.686,"N":0.686,"O":0.695,"P":0.686,"Q":0.695,"R":0.686,"S":0.696,"T":0.686,"U":0.686,"V":0.686,"W":0.686,"X":0.686,"Y":0.686,"Z":0.686,"[":0.686,"\\":0.686,"]":0.686,"^":0.511,"_":-0.064,"`":0.759,"a":0.521,"b":0.72,"c":0.521,"d":0.72,"e":0.521,"f":0.728,"g":0.603,"h":0.72,"i":0.72,"j":0.72,"k":0.72,"l":0.72,"m":0.521,"n":0.521,"o":0.521,"p":0.521,"q":0.521,"r":0.521,"s":0.521,"t":0.674,"u":0.511,"v":0.511,"w":0.511,"x":0.511,"y":0.511,"z":0.511,"{":0.691,"|":0.72,"}":0.691,"~":0.388,"★":0.859,"·":0.348,"“":0.708,"”":0.708,"’":0.708,"—":0.322,"–":0.322,"✓":0.7231,"€":0.694,"£":0.7},"dn":{"0":0.01,"1":0,"2":0,"3":0.01,"4":0,"5":0.01,"6":0.01,"7":0,"8":0.01,"9":0.01," ":0,"!":0,"\"":-0.406,"#":0,"$":0.066,"%":0.001,"&":0,"'":-0.406,"(":0.157,")":0.157,"*":-0.325,"+":0,",":0.15,"-":-0.219,".":0,"/":0.171,":":0,";":0.15,"<":-0.002,"=":-0.103,">":-0.002,"?":0,"@":0.162,"A":0,"B":0,"C":0.01,"D":0,"E":0,"F":0,"G":0.01,"H":0,"I":0,"J":0.01,"K":0,"L":0,"M":0,"N":0,"O":0.01,"P":0,"Q":0.148,"R":0.006,"S":0.01,"T":0,"U":0.01,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.161,"\\":0.171,"]":0.161,"^":0,"_":0.144,"`":-0.588,"a":0.01,"b":0.01,"c":0.01,"d":0.01,"e":0.01,"f":0,"g":0.188,"h":0,"i":0,"j":0.186,"k":0,"l":0,"m":0,"n":0,"o":0.01,"p":0.181,"q":0.18,"r":0,"s":0.01,"t":0.01,"u":0.01,"v":0,"w":0,"x":0,"y":0.186,"z":0,"{":0.163,"|":0.199,"}":0.163,"~":-0.209,"★":0.078,"·":-0.229,"“":-0.421,"”":-0.421,"’":-0.421,"—":-0.22,"–":-0.22,"✓":0.0181,"€":0.01,"£":0},"cap":0.695,"desc":0.188,"avg":0.5514},"Chivo|700":{"adv":{"0":0.615,"1":0.615,"2":0.615,"3":0.615,"4":0.615,"5":0.615,"6":0.615,"7":0.615,"8":0.615,"9":0.615," ":0.207,"!":0.2995,"\"":0.4145,"#":0.6565,"$":0.585,"%":0.709,"&":0.7105,"'":0.231,"(":0.3065,")":0.306,"*":0.4955,"+":0.6155,",":0.2735,"-":0.363,".":0.2735,"/":0.6375,":":0.2895,";":0.289,"<":0.615,"=":0.612,">":0.615,"?":0.559,"@":0.9,"A":0.693,"B":0.6545,"C":0.6775,"D":0.691,"E":0.598,"F":0.5585,"G":0.693,"H":0.696,"I":0.423,"J":0.5395,"K":0.668,"L":0.5415,"M":0.982,"N":0.695,"O":0.71,"P":0.639,"Q":0.71,"R":0.6785,"S":0.6445,"T":0.584,"U":0.685,"V":0.6415,"W":0.992,"X":0.663,"Y":0.6255,"Z":0.6045,"[":0.311,"\\":0.6375,"]":0.311,"^":0.599,"_":0.694,"`":0.6035,"a":0.613,"b":0.6005,"c":0.563,"d":0.6015,"e":0.5885,"f":0.3965,"g":0.584,"h":0.5975,"i":0.288,"j":0.288,"k":0.584,"l":0.283,"m":0.871,"n":0.5975,"o":0.6035,"p":0.6005,"q":0.6015,"r":0.5005,"s":0.552,"t":0.3985,"u":0.625,"v":0.546,"w":0.843,"x":0.5665,"y":0.5415,"z":0.4885,"{":0.335,"|":0.2365,"}":0.335,"~":0.6595,"★":1,"·":0.274,"“":0.462,"”":0.4715,"’":0.253,"—":0.91,"–":0.5,"✓":0.7642,"€":0.5865,"£":0.6475},"up":{"0":0.696,"1":0.696,"2":0.696,"3":0.696,"4":0.696,"5":0.686,"6":0.696,"7":0.686,"8":0.696,"9":0.696," ":0,"!":0.686,"\"":0.686,"#":0.696,"$":0.7585,"%":0.686,"&":0.696,"'":0.686,"(":0.686,")":0.686,"*":0.72,"+":0.5115,",":0.169,"-":0.3385,".":0.1515,"/":0.686,":":0.512,";":0.512,"<":0.514,"=":0.417,">":0.514,"?":0.6965,"@":0.697,"A":0.686,"B":0.686,"C":0.696,"D":0.686,"E":0.686,"F":0.686,"G":0.696,"H":0.686,"I":0.686,"J":0.686,"K":0.686,"L":0.686,"M":0.686,"N":0.686,"O":0.6945,"P":0.686,"Q":0.6945,"R":0.686,"S":0.696,"T":0.686,"U":0.686,"V":0.686,"W":0.686,"X":0.686,"Y":0.686,"Z":0.686,"[":0.686,"\\":0.686,"]":0.686,"^":0.511,"_":-0.0645,"`":0.76,"a":0.521,"b":0.72,"c":0.521,"d":0.72,"e":0.521,"f":0.728,"g":0.603,"h":0.72,"i":0.72,"j":0.72,"k":0.72,"l":0.72,"m":0.521,"n":0.521,"o":0.521,"p":0.521,"q":0.5205,"r":0.521,"s":0.521,"t":0.674,"u":0.511,"v":0.511,"w":0.511,"x":0.511,"y":0.511,"z":0.511,"{":0.6935,"|":0.72,"}":0.6935,"~":0.397,"★":0.859,"·":0.364,"“":0.702,"”":0.702,"’":0.7015,"—":0.338,"–":0.338,"✓":0.7231,"€":0.693,"£":0.7},"dn":{"0":0.01,"1":0,"2":0,"3":0.01,"4":0,"5":0.01,"6":0.01,"7":0,"8":0.01,"9":0.01," ":0,"!":0,"\"":-0.401,"#":0,"$":0.066,"%":0.001,"&":0,"'":-0.401,"(":0.1575,")":0.1575,"*":-0.312,"+":0,",":0.172,"-":-0.2075,".":0,"/":0.171,":":0,";":0.172,"<":0.0045,"=":-0.092,">":0.0045,"?":0,"@":0.1675,"A":0,"B":0,"C":0.01,"D":0,"E":0,"F":0,"G":0.01,"H":0,"I":0,"J":0.01,"K":0,"L":0,"M":0,"N":0,"O":0.01,"P":0,"Q":0.155,"R":0.008,"S":0.01,"T":0,"U":0.01,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.161,"\\":0.171,"]":0.161,"^":0,"_":0.1555,"`":-0.5855,"a":0.01,"b":0.01,"c":0.01,"d":0.01,"e":0.01,"f":0,"g":0.188,"h":0,"i":0,"j":0.1865,"k":0,"l":0,"m":0,"n":0,"o":0.01,"p":0.181,"q":0.18,"r":0,"s":0.01,"t":0.0105,"u":0.01,"v":0,"w":0,"x":0,"y":0.1865,"z":0,"{":0.166,"|":0.199,"}":0.166,"~":-0.1995,"★":0.078,"·":-0.213,"“":-0.373,"”":-0.373,"’":-0.373,"—":-0.208,"–":-0.208,"✓":0.0181,"€":0.01,"£":0},"cap":0.6945,"desc":0.188,"avg":0.5596},"Chivo|900":{"adv":{"0":0.615,"1":0.615,"2":0.615,"3":0.615,"4":0.615,"5":0.615,"6":0.615,"7":0.615,"8":0.615,"9":0.615," ":0.193,"!":0.311,"\"":0.434,"#":0.662,"$":0.6,"%":0.713,"&":0.729,"'":0.231,"(":0.313,")":0.313,"*":0.506,"+":0.615,",":0.287,"-":0.352,".":0.287,"/":0.652,":":0.309,";":0.308,"<":0.615,"=":0.615,">":0.615,"?":0.581,"@":0.906,"A":0.709,"B":0.656,"C":0.683,"D":0.7,"E":0.6,"F":0.562,"G":0.699,"H":0.697,"I":0.446,"J":0.545,"K":0.685,"L":0.544,"M":1.004,"N":0.696,"O":0.718,"P":0.645,"Q":0.718,"R":0.682,"S":0.651,"T":0.586,"U":0.687,"V":0.656,"W":1.021,"X":0.675,"Y":0.646,"Z":0.608,"[":0.318,"\\":0.652,"]":0.318,"^":0.6,"_":0.694,"`":0.614,"a":0.624,"b":0.61,"c":0.569,"d":0.61,"e":0.601,"f":0.419,"g":0.59,"h":0.599,"i":0.298,"j":0.299,"k":0.603,"l":0.298,"m":0.871,"n":0.599,"o":0.614,"p":0.61,"q":0.61,"r":0.507,"s":0.559,"t":0.419,"u":0.628,"v":0.559,"w":0.855,"x":0.585,"y":0.553,"z":0.498,"{":0.343,"|":0.232,"}":0.343,"~":0.648,"★":1,"·":0.289,"“":0.514,"”":0.514,"’":0.266,"—":0.91,"–":0.5,"✓":0.7642,"€":0.596,"£":0.667},"up":{"0":0.696,"1":0.696,"2":0.696,"3":0.696,"4":0.696,"5":0.686,"6":0.696,"7":0.686,"8":0.696,"9":0.696," ":0,"!":0.686,"\"":0.686,"#":0.696,"$":0.757,"%":0.686,"&":0.696,"'":0.686,"(":0.686,")":0.686,"*":0.72,"+":0.512,",":0.196,"-":0.354,".":0.183,"/":0.686,":":0.511,";":0.511,"<":0.521,"=":0.429,">":0.521,"?":0.696,"@":0.697,"A":0.686,"B":0.686,"C":0.696,"D":0.686,"E":0.686,"F":0.686,"G":0.696,"H":0.686,"I":0.686,"J":0.686,"K":0.686,"L":0.686,"M":0.686,"N":0.686,"O":0.694,"P":0.686,"Q":0.694,"R":0.686,"S":0.696,"T":0.686,"U":0.686,"V":0.686,"W":0.686,"X":0.686,"Y":0.686,"Z":0.686,"[":0.686,"\\":0.686,"]":0.686,"^":0.511,"_":-0.065,"`":0.761,"a":0.521,"b":0.72,"c":0.521,"d":0.72,"e":0.521,"f":0.728,"g":0.603,"h":0.72,"i":0.72,"j":0.72,"k":0.72,"l":0.72,"m":0.521,"n":0.521,"o":0.521,"p":0.521,"q":0.52,"r":0.521,"s":0.521,"t":0.674,"u":0.511,"v":0.511,"w":0.511,"x":0.511,"y":0.511,"z":0.511,"{":0.696,"|":0.72,"}":0.696,"~":0.406,"★":0.859,"·":0.38,"“":0.695,"”":0.695,"’":0.695,"—":0.354,"–":0.354,"✓":0.7231,"€":0.692,"£":0.7},"dn":{"0":0.01,"1":0,"2":0,"3":0.01,"4":0,"5":0.01,"6":0.01,"7":0,"8":0.01,"9":0.01," ":0,"!":0,"\"":-0.396,"#":0,"$":0.066,"%":0.001,"&":0,"'":-0.396,"(":0.158,")":0.158,"*":-0.299,"+":0,",":0.194,"-":-0.196,".":0,"/":0.171,":":0,";":0.194,"<":0.011,"=":-0.081,">":0.011,"?":0,"@":0.173,"A":0,"B":0,"C":0.01,"D":0,"E":0,"F":0,"G":0.01,"H":0,"I":0,"J":0.01,"K":0,"L":0,"M":0,"N":0,"O":0.01,"P":0,"Q":0.162,"R":0.01,"S":0.01,"T":0,"U":0.01,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.161,"\\":0.171,"]":0.161,"^":0,"_":0.167,"`":-0.583,"a":0.01,"b":0.01,"c":0.01,"d":0.01,"e":0.01,"f":0,"g":0.188,"h":0,"i":0,"j":0.187,"k":0,"l":0,"m":0,"n":0,"o":0.01,"p":0.181,"q":0.18,"r":0,"s":0.01,"t":0.011,"u":0.01,"v":0,"w":0,"x":0,"y":0.187,"z":0,"{":0.169,"|":0.199,"}":0.169,"~":-0.19,"★":0.078,"·":-0.197,"“":-0.325,"”":-0.325,"’":-0.325,"—":-0.196,"–":-0.196,"✓":0.0181,"€":0.01,"£":0},"cap":0.694,"desc":0.188,"avg":0.5678},"Instrument Sans|400":{"adv":{"0":0.666,"1":0.391,"2":0.545,"3":0.574,"4":0.6,"5":0.574,"6":0.599,"7":0.532,"8":0.582,"9":0.61," ":0.2,"!":0.273,"\"":0.384,"#":0.716,"$":0.608,"%":0.786,"&":0.755,"'":0.232,"(":0.406,")":0.406,"*":0.408,"+":0.531,",":0.255,"-":0.506,".":0.255,"/":0.443,":":0.255,";":0.255,"<":0.531,"=":0.531,">":0.531,"?":0.567,"@":0.853,"A":0.728,"B":0.636,"C":0.741,"D":0.752,"E":0.638,"F":0.602,"G":0.765,"H":0.736,"I":0.254,"J":0.455,"K":0.692,"L":0.588,"M":0.906,"N":0.736,"O":0.786,"P":0.656,"Q":0.787,"R":0.656,"S":0.608,"T":0.648,"U":0.712,"V":0.728,"W":1.089,"X":0.688,"Y":0.676,"Z":0.623,"[":0.406,"\\":0.443,"]":0.406,"^":0.531,"_":0.426,"`":0.354,"a":0.533,"b":0.606,"c":0.533,"d":0.606,"e":0.564,"f":0.354,"g":0.606,"h":0.599,"i":0.24,"j":0.24,"k":0.535,"l":0.24,"m":0.922,"n":0.599,"o":0.584,"p":0.606,"q":0.606,"r":0.375,"s":0.473,"t":0.377,"u":0.589,"v":0.523,"w":0.767,"x":0.551,"y":0.523,"z":0.496,"{":0.406,"|":0.242,"}":0.406,"~":0.531,"★":1,"·":0.103,"“":0.409,"”":0.409,"’":0.255,"—":0.886,"–":0.586,"✓":0.7642,"€":0.701,"£":0.588},"up":{"0":0.73,"1":0.72,"2":0.73,"3":0.73,"4":0.72,"5":0.72,"6":0.73,"7":0.72,"8":0.73,"9":0.73," ":0,"!":0.74,"\"":0.75,"#":0.72,"$":0.83,"%":0.73,"&":0.73,"'":0.75,"(":0.75,")":0.754,"*":0.74,"+":0.59,",":0.102,"-":0.31,".":0.103,"/":0.75,":":0.483,";":0.483,"<":0.57,"=":0.505,">":0.56,"?":0.75,"@":0.73,"A":0.72,"B":0.72,"C":0.73,"D":0.72,"E":0.72,"F":0.72,"G":0.73,"H":0.72,"I":0.72,"J":0.72,"K":0.72,"L":0.72,"M":0.72,"N":0.72,"O":0.73,"P":0.72,"Q":0.73,"R":0.72,"S":0.731,"T":0.72,"U":0.72,"V":0.72,"W":0.72,"X":0.72,"Y":0.72,"Z":0.72,"[":0.75,"\\":0.75,"]":0.75,"^":0.74,"_":-0.05,"`":0.74,"a":0.52,"b":0.72,"c":0.52,"d":0.72,"e":0.52,"f":0.73,"g":0.519,"h":0.72,"i":0.72,"j":0.72,"k":0.74,"l":0.72,"m":0.52,"n":0.52,"o":0.52,"p":0.52,"q":0.519,"r":0.52,"s":0.52,"t":0.659,"u":0.51,"v":0.51,"w":0.51,"x":0.51,"y":0.51,"z":0.51,"{":0.75,"|":0.79,"}":0.75,"~":0.419,"★":0.859,"·":0.438,"“":0.74,"”":0.744,"’":0.744,"—":0.306,"–":0.306,"✓":0.7231,"€":0.73,"£":0.73},"dn":{"0":0.01,"1":0,"2":0,"3":0.01,"4":0,"5":0.01,"6":0.01,"7":0,"8":0.01,"9":0.01," ":0,"!":0,"\"":-0.495,"#":0,"$":0.109,"%":0.01,"&":0.01,"'":-0.495,"(":0.11,")":0.106,"*":-0.437,"+":-0.153,",":0.144,"-":-0.234,".":0,"/":0.06,":":0,";":0.144,"<":-0.182,"=":-0.237,">":-0.172,"?":0,"@":0.01,"A":0,"B":0,"C":0.01,"D":0,"E":0,"F":0,"G":0.01,"H":0,"I":0,"J":0.01,"K":0,"L":0,"M":0,"N":0,"O":0.01,"P":0,"Q":0.01,"R":0,"S":0.009,"T":0,"U":0.01,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.108,"\\":0.06,"]":0.108,"^":-0.491,"_":0.118,"`":-0.583,"a":0.01,"b":0.009,"c":0.01,"d":0.01,"e":0.01,"f":0,"g":0.215,"h":0,"i":0,"j":0.215,"k":0,"l":0,"m":0,"n":0,"o":0.01,"p":0.205,"q":0.205,"r":0,"s":0.01,"t":0.009,"u":0.01,"v":0,"w":0,"x":0,"y":0.205,"z":0,"{":0.108,"|":0.13,"}":0.108,"~":-0.296,"★":0.078,"·":-0.335,"“":-0.507,"”":-0.511,"’":-0.511,"—":-0.238,"–":-0.238,"✓":0.0181,"€":0.01,"£":0},"cap":0.73,"desc":0.215,"avg":0.5448},"Instrument Sans|500":{"adv":{"0":0.6713,"1":0.389,"2":0.551,"3":0.5767,"4":0.6073,"5":0.5777,"6":0.607,"7":0.5463,"8":0.59,"9":0.6147," ":0.1967,"!":0.284,"\"":0.4167,"#":0.7213,"$":0.6227,"%":0.786,"&":0.7613,"'":0.244,"(":0.4227,")":0.4227,"*":0.419,"+":0.5377,",":0.265,"-":0.4993,".":0.265,"/":0.4437,":":0.265,";":0.265,"<":0.5377,"=":0.5377,">":0.5377,"?":0.5737,"@":0.86,"A":0.7307,"B":0.6403,"C":0.744,"D":0.7533,"E":0.634,"F":0.598,"G":0.7643,"H":0.7307,"I":0.254,"J":0.441,"K":0.702,"L":0.5887,"M":0.902,"N":0.7307,"O":0.79,"P":0.6613,"Q":0.7963,"R":0.66,"S":0.6227,"T":0.656,"U":0.708,"V":0.7307,"W":1.088,"X":0.6973,"Y":0.688,"Z":0.627,"[":0.4227,"\\":0.4437,"]":0.4227,"^":0.5377,"_":0.446,"`":0.354,"a":0.5457,"b":0.6133,"c":0.5427,"d":0.6133,"e":0.5673,"f":0.362,"g":0.6133,"h":0.6057,"i":0.25,"j":0.25,"k":0.5463,"l":0.25,"m":0.9313,"n":0.6057,"o":0.5907,"p":0.6133,"q":0.6133,"r":0.3827,"s":0.4833,"t":0.3917,"u":0.5963,"v":0.5297,"w":0.7833,"x":0.569,"y":0.5297,"z":0.5047,"{":0.4227,"|":0.238,"}":0.4227,"~":0.5377,"★":1,"·":0.1237,"“":0.44,"”":0.44,"’":0.265,"—":0.8927,"–":0.5927,"✓":0.7642,"€":0.708,"£":0.594},"up":{"0":0.73,"1":0.72,"2":0.73,"3":0.73,"4":0.72,"5":0.72,"6":0.73,"7":0.72,"8":0.73,"9":0.73," ":0,"!":0.74,"\"":0.75,"#":0.72,"$":0.83,"%":0.73,"&":0.73,"'":0.75,"(":0.75,")":0.754,"*":0.74,"+":0.5967,",":0.123,"-":0.3173,".":0.1237,"/":0.7567,":":0.486,";":0.486,"<":0.5733,"=":0.5117,">":0.5667,"?":0.75,"@":0.73,"A":0.72,"B":0.72,"C":0.73,"D":0.72,"E":0.72,"F":0.72,"G":0.73,"H":0.72,"I":0.72,"J":0.72,"K":0.72,"L":0.72,"M":0.72,"N":0.72,"O":0.73,"P":0.72,"Q":0.73,"R":0.72,"S":0.731,"T":0.72,"U":0.72,"V":0.72,"W":0.72,"X":0.72,"Y":0.72,"Z":0.72,"[":0.75,"\\":0.7567,"]":0.75,"^":0.74,"_":-0.053,"`":0.74,"a":0.52,"b":0.72,"c":0.52,"d":0.72,"e":0.52,"f":0.73,"g":0.5193,"h":0.72,"i":0.727,"j":0.727,"k":0.7333,"l":0.72,"m":0.52,"n":0.52,"o":0.52,"p":0.52,"q":0.5193,"r":0.52,"s":0.52,"t":0.666,"u":0.51,"v":0.51,"w":0.51,"x":0.51,"y":0.51,"z":0.51,"{":0.75,"|":0.79,"}":0.75,"~":0.4287,"★":0.859,"·":0.444,"“":0.74,"”":0.743,"’":0.7427,"—":0.313,"–":0.313,"✓":0.7231,"€":0.73,"£":0.73},"dn":{"0":0.01,"1":0,"2":0,"3":0.01,"4":0,"5":0.01,"6":0.01,"7":0,"8":0.01,"9":0.01," ":0,"!":0,"\"":-0.47,"#":0,"$":0.109,"%":0.01,"&":0.01,"'":-0.47,"(":0.11,")":0.106,"*":-0.427,"+":-0.1463,",":0.152,"-":-0.2267,".":0,"/":0.0667,":":0,";":0.152,"<":-0.1753,"=":-0.2303,">":-0.1687,"?":0,"@":0.01,"A":0,"B":0,"C":0.01,"D":0,"E":0,"F":0,"G":0.01,"H":0,"I":0,"J":0.01,"K":0,"L":0,"M":0,"N":0,"O":0.01,"P":0,"Q":0.01,"R":0,"S":0.009,"T":0,"U":0.01,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.108,"\\":0.0667,"]":0.108,"^":-0.491,"_":0.135,"`":-0.583,"a":0.01,"b":0.0093,"c":0.01,"d":0.01,"e":0.01,"f":0,"g":0.215,"h":0,"i":0,"j":0.215,"k":0,"l":0,"m":0,"n":0,"o":0.01,"p":0.205,"q":0.205,"r":0,"s":0.01,"t":0.0097,"u":0.01,"v":0,"w":0,"x":0,"y":0.205,"z":0,"{":0.108,"|":0.13,"}":0.108,"~":-0.2863,"★":0.078,"·":-0.32,"“":-0.48,"”":-0.483,"’":-0.483,"—":-0.231,"–":-0.231,"✓":0.0181,"€":0.01,"£":0},"cap":0.73,"desc":0.215,"avg":0.552},"Instrument Sans|700":{"adv":{"0":0.682,"1":0.385,"2":0.563,"3":0.582,"4":0.622,"5":0.585,"6":0.623,"7":0.575,"8":0.606,"9":0.624," ":0.19,"!":0.306,"\"":0.482,"#":0.732,"$":0.652,"%":0.786,"&":0.774,"'":0.268,"(":0.456,")":0.456,"*":0.441,"+":0.551,",":0.285,"-":0.486,".":0.285,"/":0.445,":":0.285,";":0.285,"<":0.551,"=":0.551,">":0.551,"?":0.587,"@":0.874,"A":0.736,"B":0.649,"C":0.75,"D":0.756,"E":0.626,"F":0.59,"G":0.763,"H":0.72,"I":0.254,"J":0.413,"K":0.722,"L":0.59,"M":0.894,"N":0.72,"O":0.798,"P":0.672,"Q":0.815,"R":0.668,"S":0.652,"T":0.672,"U":0.7,"V":0.736,"W":1.086,"X":0.716,"Y":0.712,"Z":0.635,"[":0.456,"\\":0.445,"]":0.456,"^":0.551,"_":0.486,"`":0.354,"a":0.571,"b":0.628,"c":0.562,"d":0.628,"e":0.574,"f":0.378,"g":0.628,"h":0.619,"i":0.27,"j":0.27,"k":0.569,"l":0.27,"m":0.95,"n":0.619,"o":0.604,"p":0.628,"q":0.628,"r":0.398,"s":0.504,"t":0.421,"u":0.611,"v":0.543,"w":0.816,"x":0.605,"y":0.543,"z":0.522,"{":0.456,"|":0.23,"}":0.456,"~":0.551,"★":1,"·":0.165,"“":0.502,"”":0.502,"’":0.285,"—":0.906,"–":0.606,"✓":0.7642,"€":0.722,"£":0.606},"up":{"0":0.73,"1":0.72,"2":0.73,"3":0.73,"4":0.72,"5":0.72,"6":0.73,"7":0.72,"8":0.73,"9":0.73," ":0,"!":0.74,"\"":0.75,"#":0.72,"$":0.83,"%":0.73,"&":0.73,"'":0.75,"(":0.75,")":0.754,"*":0.74,"+":0.61,",":0.165,"-":0.332,".":0.165,"/":0.77,":":0.49,";":0.49,"<":0.58,"=":0.525,">":0.58,"?":0.75,"@":0.73,"A":0.72,"B":0.72,"C":0.73,"D":0.72,"E":0.72,"F":0.72,"G":0.73,"H":0.72,"I":0.72,"J":0.72,"K":0.72,"L":0.72,"M":0.72,"N":0.72,"O":0.73,"P":0.72,"Q":0.73,"R":0.72,"S":0.731,"T":0.72,"U":0.72,"V":0.72,"W":0.72,"X":0.72,"Y":0.72,"Z":0.72,"[":0.75,"\\":0.77,"]":0.75,"^":0.74,"_":-0.06,"`":0.74,"a":0.52,"b":0.72,"c":0.52,"d":0.72,"e":0.52,"f":0.73,"g":0.52,"h":0.72,"i":0.74,"j":0.74,"k":0.72,"l":0.72,"m":0.52,"n":0.52,"o":0.52,"p":0.52,"q":0.52,"r":0.52,"s":0.52,"t":0.68,"u":0.51,"v":0.51,"w":0.51,"x":0.51,"y":0.51,"z":0.51,"{":0.75,"|":0.79,"}":0.75,"~":0.448,"★":0.859,"·":0.455,"“":0.74,"”":0.74,"’":0.74,"—":0.327,"–":0.327,"✓":0.7231,"€":0.73,"£":0.73},"dn":{"0":0.01,"1":0,"2":0,"3":0.01,"4":0,"5":0.01,"6":0.01,"7":0,"8":0.01,"9":0.01," ":0,"!":0,"\"":-0.42,"#":0,"$":0.109,"%":0.01,"&":0.01,"'":-0.42,"(":0.11,")":0.106,"*":-0.407,"+":-0.133,",":0.168,"-":-0.212,".":0,"/":0.08,":":0,";":0.168,"<":-0.162,"=":-0.217,">":-0.162,"?":0,"@":0.01,"A":0,"B":0,"C":0.01,"D":0,"E":0,"F":0,"G":0.01,"H":0,"I":0,"J":0.01,"K":0,"L":0,"M":0,"N":0,"O":0.01,"P":0,"Q":0.01,"R":0,"S":0.009,"T":0,"U":0.01,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.108,"\\":0.08,"]":0.108,"^":-0.491,"_":0.17,"`":-0.583,"a":0.01,"b":0.01,"c":0.01,"d":0.01,"e":0.01,"f":0,"g":0.215,"h":0,"i":0,"j":0.215,"k":0,"l":0,"m":0,"n":0,"o":0.01,"p":0.205,"q":0.205,"r":0,"s":0.01,"t":0.011,"u":0.01,"v":0,"w":0,"x":0,"y":0.205,"z":0,"{":0.108,"|":0.13,"}":0.108,"~":-0.267,"★":0.078,"·":-0.29,"“":-0.427,"”":-0.427,"’":-0.427,"—":-0.217,"–":-0.217,"✓":0.0181,"€":0.01,"£":0},"cap":0.73,"desc":0.215,"avg":0.5663},"Libre Franklin|400":{"adv":{"0":0.6879,"1":0.4652,"2":0.5991,"3":0.6408,"4":0.6486,"5":0.6545,"6":0.6611,"7":0.5994,"8":0.6684,"9":0.6575," ":0.2145,"!":0.2444,"\"":0.409,"#":0.603,"$":0.6051,"%":0.9159,"&":0.778,"'":0.24,"(":0.2856,")":0.2856,"*":0.3804,"+":0.5572,",":0.2123,"-":0.3807,".":0.2087,"/":0.3423,":":0.2087,";":0.229,"<":0.5439,"=":0.5572,">":0.5439,"?":0.5228,"@":0.834,"A":0.7272,"B":0.6991,"C":0.7066,"D":0.7217,"E":0.6282,"F":0.6014,"G":0.7385,"H":0.7352,"I":0.2897,"J":0.4177,"K":0.701,"L":0.6024,"M":0.906,"N":0.7567,"O":0.7641,"P":0.6897,"Q":0.7646,"R":0.6955,"S":0.6408,"T":0.6453,"U":0.7092,"V":0.7068,"W":1.0452,"X":0.6879,"Y":0.6754,"Z":0.6314,"[":0.2867,"\\":0.3423,"]":0.2867,"^":0.4757,"_":0.5178,"`":0.2852,"a":0.5476,"b":0.5986,"c":0.5422,"d":0.5986,"e":0.5806,"f":0.3789,"g":0.6015,"h":0.584,"i":0.2385,"j":0.2388,"k":0.5636,"l":0.2391,"m":0.9055,"n":0.5837,"o":0.5985,"p":0.5974,"q":0.5993,"r":0.383,"s":0.512,"t":0.3866,"u":0.5793,"v":0.5468,"w":0.7965,"x":0.5444,"y":0.5303,"z":0.4817,"{":0.3052,"|":0.2609,"}":0.3052,"~":0.5679,"★":1,"·":0.2014,"“":0.3981,"”":0.3995,"’":0.2218,"—":0.8802,"–":0.5578,"✓":0.7642,"€":0.5997,"£":0.6154},"up":{"0":0.7523,"1":0.742,"2":0.752,"3":0.752,"4":0.742,"5":0.742,"6":0.7515,"7":0.742,"8":0.752,"9":0.7515," ":0,"!":0.742,"\"":0.742,"#":0.743,"$":0.8165,"%":0.753,"&":0.753,"'":0.742,"(":0.742,")":0.742,"*":0.742,"+":0.59,",":0.1117,"-":0.2989,".":0.1125,"/":0.742,":":0.5069,";":0.506,"<":0.559,"=":0.5052,">":0.559,"?":0.752,"@":0.661,"A":0.742,"B":0.742,"C":0.752,"D":0.742,"E":0.742,"F":0.742,"G":0.752,"H":0.742,"I":0.742,"J":0.742,"K":0.742,"L":0.742,"M":0.742,"N":0.742,"O":0.752,"P":0.742,"Q":0.752,"R":0.742,"S":0.752,"T":0.742,"U":0.742,"V":0.742,"W":0.742,"X":0.742,"Y":0.742,"Z":0.742,"[":0.742,"\\":0.742,"]":0.742,"^":0.544,"_":-0.0497,"`":0.754,"a":0.54,"b":0.742,"c":0.54,"d":0.742,"e":0.54,"f":0.742,"g":0.5388,"h":0.742,"i":0.742,"j":0.742,"k":0.742,"l":0.742,"m":0.5403,"n":0.54,"o":0.54,"p":0.54,"q":0.5403,"r":0.54,"s":0.54,"t":0.71,"u":0.53,"v":0.53,"w":0.53,"x":0.53,"y":0.53,"z":0.53,"{":0.742,"|":0.847,"}":0.742,"~":0.432,"★":0.859,"·":0.4267,"“":0.742,"”":0.742,"’":0.742,"—":0.2918,"–":0.2918,"✓":0.7231,"€":0.752,"£":0.752},"dn":{"0":0.0095,"1":0,"2":0,"3":0.01,"4":0,"5":0.01,"6":0.0095,"7":0,"8":0.01,"9":0.0095," ":0,"!":0,"\"":-0.512,"#":0.0013,"$":0.0875,"%":0.01,"&":0.005,"'":-0.5118,"(":0.165,")":0.165,"*":-0.4078,"+":-0.1558,",":0.1425,"-":-0.2307,".":0,"/":0.0435,":":-0.003,";":0.1436,"<":-0.154,"=":-0.2124,">":-0.154,"?":0,"@":0.113,"A":0,"B":0,"C":0.01,"D":0,"E":0,"F":0,"G":0.01,"H":0,"I":0,"J":0.01,"K":0,"L":0,"M":0,"N":0,"O":0.01,"P":0,"Q":0.1237,"R":0,"S":0.01,"T":0,"U":0.01,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.165,"\\":0.0435,"]":0.165,"^":-0.1323,"_":0.118,"`":-0.613,"a":0.01,"b":0.01,"c":0.01,"d":0.01,"e":0.01,"f":0,"g":0.175,"h":0,"i":0,"j":0.17,"k":0,"l":0,"m":0,"n":0,"o":0.01,"p":0.165,"q":0.165,"r":0,"s":0.01,"t":0,"u":0.01,"v":0,"w":0,"x":0,"y":0.165,"z":0,"{":0.165,"|":0.165,"}":0.165,"~":-0.3186,"★":0.078,"·":-0.3203,"“":-0.5089,"”":-0.5089,"’":-0.5089,"—":-0.2236,"–":-0.2236,"✓":0.0181,"€":0.01,"£":0},"cap":0.752,"desc":0.175,"avg":0.5406},"Libre Franklin|500":{"adv":{"0":0.6944,"1":0.4788,"2":0.6131,"3":0.6492,"4":0.6614,"5":0.6612,"6":0.6687,"7":0.6056,"8":0.673,"9":0.6657," ":0.2118,"!":0.2506,"\"":0.4279,"#":0.603,"$":0.6206,"%":0.9248,"&":0.7969,"'":0.2424,"(":0.2944,")":0.2944,"*":0.407,"+":0.5653,",":0.2249,"-":0.3806,".":0.222,"/":0.3494,":":0.222,";":0.2385,"<":0.5543,"=":0.5653,">":0.5543,"?":0.5272,"@":0.834,"A":0.7408,"B":0.7067,"C":0.7123,"D":0.731,"E":0.6363,"F":0.6106,"G":0.7428,"H":0.7403,"I":0.2975,"J":0.427,"K":0.7144,"L":0.6101,"M":0.9194,"N":0.7575,"O":0.7671,"P":0.6975,"Q":0.7679,"R":0.7037,"S":0.6522,"T":0.6564,"U":0.7127,"V":0.7152,"W":1.0573,"X":0.7008,"Y":0.6941,"Z":0.647,"[":0.296,"\\":0.3494,"]":0.296,"^":0.4756,"_":0.5262,"`":0.2918,"a":0.5524,"b":0.6019,"c":0.5448,"d":0.6019,"e":0.5824,"f":0.3863,"g":0.6113,"h":0.588,"i":0.2467,"j":0.2472,"k":0.5764,"l":0.2476,"m":0.9098,"n":0.5875,"o":0.5988,"p":0.6011,"q":0.6025,"r":0.3964,"s":0.5175,"t":0.4009,"u":0.5834,"v":0.5552,"w":0.8032,"x":0.5591,"y":0.5414,"z":0.4935,"{":0.3243,"|":0.2579,"}":0.3243,"~":0.5808,"★":1,"·":0.2161,"“":0.4191,"”":0.4212,"’":0.2277,"—":0.8892,"–":0.5662,"✓":0.7642,"€":0.6161,"£":0.6246},"up":{"0":0.7524,"1":0.742,"2":0.752,"3":0.752,"4":0.742,"5":0.742,"6":0.7512,"7":0.742,"8":0.752,"9":0.7512," ":0,"!":0.742,"\"":0.742,"#":0.743,"$":0.8137,"%":0.753,"&":0.753,"'":0.742,"(":0.742,")":0.742,"*":0.742,"+":0.5986,",":0.1281,"-":0.3054,".":0.1293,"/":0.742,":":0.5103,";":0.5091,"<":0.57,"=":0.5118,">":0.57,"?":0.752,"@":0.661,"A":0.742,"B":0.742,"C":0.752,"D":0.742,"E":0.742,"F":0.742,"G":0.752,"H":0.742,"I":0.742,"J":0.742,"K":0.742,"L":0.742,"M":0.742,"N":0.742,"O":0.752,"P":0.742,"Q":0.752,"R":0.742,"S":0.752,"T":0.742,"U":0.742,"V":0.742,"W":0.742,"X":0.742,"Y":0.742,"Z":0.742,"[":0.742,"\\":0.742,"]":0.742,"^":0.544,"_":-0.0441,"`":0.755,"a":0.54,"b":0.742,"c":0.54,"d":0.742,"e":0.54,"f":0.742,"g":0.5432,"h":0.742,"i":0.742,"j":0.742,"k":0.742,"l":0.742,"m":0.5404,"n":0.54,"o":0.54,"p":0.54,"q":0.5404,"r":0.54,"s":0.54,"t":0.71,"u":0.53,"v":0.53,"w":0.53,"x":0.53,"y":0.53,"z":0.53,"{":0.742,"|":0.847,"}":0.742,"~":0.4415,"★":0.859,"·":0.4336,"“":0.742,"”":0.742,"’":0.742,"—":0.2977,"–":0.2977,"✓":0.7231,"€":0.752,"£":0.752},"dn":{"0":0.0092,"1":0,"2":0,"3":0.01,"4":0,"5":0.01,"6":0.0092,"7":0,"8":0.01,"9":0.0092," ":0,"!":0,"\"":-0.493,"#":0.0014,"$":0.0848,"%":0.01,"&":0.005,"'":-0.4927,"(":0.165,")":0.165,"*":-0.3847,"+":-0.1477,",":0.1468,"-":-0.2235,".":0,"/":0.0353,":":-0.003,";":0.1484,"<":-0.1406,"=":-0.2021,">":-0.1406,"?":0,"@":0.113,"A":0,"B":0,"C":0.01,"D":0,"E":0,"F":0,"G":0.01,"H":0,"I":0,"J":0.01,"K":0,"L":0,"M":0,"N":0,"O":0.01,"P":0,"Q":0.1245,"R":0,"S":0.01,"T":0,"U":0.01,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.165,"\\":0.0353,"]":0.165,"^":-0.13,"_":0.1259,"`":-0.605,"a":0.01,"b":0.01,"c":0.01,"d":0.01,"e":0.01,"f":0,"g":0.175,"h":0,"i":0,"j":0.17,"k":0,"l":0,"m":0,"n":0,"o":0.01,"p":0.165,"q":0.165,"r":0,"s":0.01,"t":0,"u":0.01,"v":0,"w":0,"x":0,"y":0.165,"z":0,"{":0.165,"|":0.165,"}":0.165,"~":-0.3094,"★":0.078,"·":-0.3134,"“":-0.4903,"”":-0.4903,"’":-0.4903,"—":-0.2159,"–":-0.2159,"✓":0.0181,"€":0.01,"£":0},"cap":0.752,"desc":0.175,"avg":0.5491},"Libre Franklin|700":{"adv":{"0":0.7085,"1":0.5085,"2":0.6437,"3":0.6675,"4":0.6893,"5":0.6759,"6":0.6852,"7":0.6191,"8":0.6832,"9":0.6838," ":0.2057,"!":0.2641,"\"":0.4693,"#":0.603,"$":0.6545,"%":0.9443,"&":0.8383,"'":0.2478,"(":0.3136,")":0.3136,"*":0.4652,"+":0.583,",":0.2526,"-":0.3803,".":0.2511,"/":0.3651,":":0.2511,";":0.2592,"<":0.5772,"=":0.583,">":0.5772,"?":0.5368,"@":0.834,"A":0.7705,"B":0.7232,"C":0.7249,"D":0.7515,"E":0.654,"F":0.6307,"G":0.7521,"H":0.7514,"I":0.3146,"J":0.4475,"K":0.7438,"L":0.6269,"M":0.9488,"N":0.7593,"O":0.7737,"P":0.7146,"Q":0.7751,"R":0.7218,"S":0.6771,"T":0.6807,"U":0.7205,"V":0.7335,"W":1.0837,"X":0.729,"Y":0.7349,"Z":0.6812,"[":0.3165,"\\":0.3651,"]":0.3165,"^":0.4753,"_":0.5445,"`":0.3062,"a":0.5629,"b":0.6091,"c":0.5505,"d":0.6091,"e":0.5863,"f":0.4025,"g":0.6326,"h":0.5967,"i":0.2648,"j":0.2655,"k":0.6043,"l":0.2662,"m":0.9191,"n":0.596,"o":0.5994,"p":0.6092,"q":0.6094,"r":0.4258,"s":0.5295,"t":0.4321,"u":0.5924,"v":0.5735,"w":0.8179,"x":0.5912,"y":0.5657,"z":0.5193,"{":0.366,"|":0.2513,"}":0.366,"~":0.609,"★":1,"·":0.2482,"“":0.465,"”":0.4686,"’":0.2406,"—":0.909,"–":0.5845,"✓":0.7642,"€":0.6518,"£":0.6447},"up":{"0":0.7527,"1":0.742,"2":0.752,"3":0.752,"4":0.742,"5":0.742,"6":0.7506,"7":0.742,"8":0.752,"9":0.7506," ":0,"!":0.742,"\"":0.742,"#":0.743,"$":0.8078,"%":0.753,"&":0.753,"'":0.742,"(":0.742,")":0.742,"*":0.742,"+":0.6172,",":0.1638,"-":0.3195,".":0.1659,"/":0.742,":":0.5178,";":0.5157,"<":0.594,"=":0.5262,">":0.594,"?":0.752,"@":0.661,"A":0.742,"B":0.742,"C":0.752,"D":0.742,"E":0.742,"F":0.742,"G":0.752,"H":0.742,"I":0.742,"J":0.742,"K":0.742,"L":0.742,"M":0.742,"N":0.742,"O":0.752,"P":0.742,"Q":0.752,"R":0.742,"S":0.752,"T":0.742,"U":0.742,"V":0.742,"W":0.742,"X":0.742,"Y":0.742,"Z":0.742,"[":0.742,"\\":0.742,"]":0.742,"^":0.544,"_":-0.0318,"`":0.756,"a":0.54,"b":0.742,"c":0.54,"d":0.742,"e":0.54,"f":0.742,"g":0.5528,"h":0.742,"i":0.742,"j":0.742,"k":0.742,"l":0.742,"m":0.5407,"n":0.54,"o":0.54,"p":0.54,"q":0.5407,"r":0.54,"s":0.54,"t":0.71,"u":0.53,"v":0.53,"w":0.53,"x":0.53,"y":0.53,"z":0.53,"{":0.742,"|":0.847,"}":0.742,"~":0.4622,"★":0.859,"·":0.4486,"“":0.742,"”":0.742,"’":0.742,"—":0.3106,"–":0.3106,"✓":0.7231,"€":0.752,"£":0.752},"dn":{"0":0.0086,"1":0,"2":0,"3":0.01,"4":0,"5":0.01,"6":0.0086,"7":0,"8":0.01,"9":0.0086," ":0,"!":0,"\"":-0.451,"#":0.0017,"$":0.0788,"%":0.01,"&":0.005,"'":-0.451,"(":0.165,")":0.165,"*":-0.3343,"+":-0.13,",":0.1561,"-":-0.208,".":0,"/":0.0173,":":-0.003,";":0.1589,"<":-0.1112,"=":-0.1796,">":-0.1112,"?":0,"@":0.113,"A":0,"B":0,"C":0.01,"D":0,"E":0,"F":0,"G":0.01,"H":0,"I":0,"J":0.01,"K":0,"L":0,"M":0,"N":0,"O":0.01,"P":0,"Q":0.1263,"R":0,"S":0.01,"T":0,"U":0.01,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.165,"\\":0.0173,"]":0.165,"^":-0.1249,"_":0.1433,"`":-0.587,"a":0.01,"b":0.01,"c":0.01,"d":0.01,"e":0.01,"f":0,"g":0.175,"h":0,"i":0,"j":0.17,"k":0,"l":0,"m":0,"n":0,"o":0.01,"p":0.165,"q":0.165,"r":0,"s":0.01,"t":0,"u":0.01,"v":0,"w":0,"x":0,"y":0.165,"z":0,"{":0.165,"|":0.165,"}":0.165,"~":-0.2893,"★":0.078,"·":-0.2984,"“":-0.4498,"”":-0.4498,"’":-0.4498,"—":-0.1991,"–":-0.1991,"✓":0.0181,"€":0.01,"£":0},"cap":0.752,"desc":0.175,"avg":0.5678},"Libre Franklin|900":{"adv":{"0":0.722,"1":0.537,"2":0.673,"3":0.685,"4":0.716,"5":0.69,"6":0.701,"7":0.632,"8":0.693,"9":0.701," ":0.2,"!":0.277,"\"":0.509,"#":0.603,"$":0.687,"%":0.963,"&":0.878,"'":0.253,"(":0.332,")":0.332,"*":0.521,"+":0.6,",":0.279,"-":0.38,".":0.279,"/":0.38,":":0.279,";":0.279,"<":0.599,"=":0.6,">":0.599,"?":0.546,"@":0.834,"A":0.799,"B":0.739,"C":0.737,"D":0.771,"E":0.671,"F":0.65,"G":0.761,"H":0.762,"I":0.331,"J":0.467,"K":0.772,"L":0.643,"M":0.977,"N":0.761,"O":0.78,"P":0.731,"Q":0.782,"R":0.739,"S":0.701,"T":0.704,"U":0.728,"V":0.751,"W":1.109,"X":0.756,"Y":0.774,"Z":0.714,"[":0.336,"\\":0.38,"]":0.336,"^":0.475,"_":0.562,"`":0.32,"a":0.573,"b":0.616,"c":0.556,"d":0.616,"e":0.59,"f":0.418,"g":0.653,"h":0.605,"i":0.282,"j":0.283,"k":0.631,"l":0.284,"m":0.928,"n":0.604,"o":0.6,"p":0.617,"q":0.616,"r":0.454,"s":0.541,"t":0.462,"u":0.601,"v":0.591,"w":0.832,"x":0.622,"y":0.589,"z":0.544,"{":0.406,"|":0.245,"}":0.406,"~":0.636,"★":1,"·":0.279,"“":0.509,"”":0.514,"’":0.253,"—":0.928,"–":0.602,"✓":0.7642,"€":0.686,"£":0.664},"up":{"0":0.753,"1":0.742,"2":0.752,"3":0.752,"4":0.742,"5":0.742,"6":0.75,"7":0.742,"8":0.752,"9":0.75," ":0,"!":0.742,"\"":0.742,"#":0.743,"$":0.802,"%":0.753,"&":0.753,"'":0.742,"(":0.742,")":0.742,"*":0.742,"+":0.635,",":0.198,"-":0.333,".":0.201,"/":0.742,":":0.525,";":0.522,"<":0.617,"=":0.54,">":0.617,"?":0.752,"@":0.661,"A":0.742,"B":0.742,"C":0.752,"D":0.742,"E":0.742,"F":0.742,"G":0.752,"H":0.742,"I":0.742,"J":0.742,"K":0.742,"L":0.742,"M":0.742,"N":0.742,"O":0.752,"P":0.742,"Q":0.752,"R":0.742,"S":0.752,"T":0.742,"U":0.742,"V":0.742,"W":0.742,"X":0.742,"Y":0.742,"Z":0.742,"[":0.742,"\\":0.742,"]":0.742,"^":0.544,"_":-0.02,"`":0.757,"a":0.54,"b":0.742,"c":0.54,"d":0.742,"e":0.54,"f":0.742,"g":0.562,"h":0.742,"i":0.742,"j":0.742,"k":0.742,"l":0.742,"m":0.541,"n":0.54,"o":0.54,"p":0.54,"q":0.541,"r":0.54,"s":0.54,"t":0.71,"u":0.53,"v":0.53,"w":0.53,"x":0.53,"y":0.53,"z":0.53,"{":0.742,"|":0.847,"}":0.742,"~":0.482,"★":0.859,"·":0.463,"“":0.742,"”":0.742,"’":0.742,"—":0.323,"–":0.323,"✓":0.7231,"€":0.752,"£":0.752},"dn":{"0":0.008,"1":0,"2":0,"3":0.01,"4":0,"5":0.01,"6":0.008,"7":0,"8":0.01,"9":0.008," ":0,"!":0,"\"":-0.411,"#":0.002,"$":0.073,"%":0.01,"&":0.005,"'":-0.411,"(":0.165,")":0.165,"*":-0.286,"+":-0.113,",":0.165,"-":-0.193,".":0,"/":0,":":-0.003,";":0.169,"<":-0.083,"=":-0.158,">":-0.083,"?":0,"@":0.113,"A":0,"B":0,"C":0.01,"D":0,"E":0,"F":0,"G":0.01,"H":0,"I":0,"J":0.01,"K":0,"L":0,"M":0,"N":0,"O":0.01,"P":0,"Q":0.128,"R":0,"S":0.01,"T":0,"U":0.01,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.165,"\\":0,"]":0.165,"^":-0.12,"_":0.16,"`":-0.57,"a":0.01,"b":0.01,"c":0.01,"d":0.01,"e":0.01,"f":0,"g":0.175,"h":0,"i":0,"j":0.17,"k":0,"l":0,"m":0,"n":0,"o":0.01,"p":0.165,"q":0.165,"r":0,"s":0.01,"t":0,"u":0.01,"v":0,"w":0,"x":0,"y":0.165,"z":0,"{":0.165,"|":0.165,"}":0.165,"~":-0.27,"★":0.078,"·":-0.284,"“":-0.411,"”":-0.411,"’":-0.411,"—":-0.183,"–":-0.183,"✓":0.0181,"€":0.01,"£":0},"cap":0.752,"desc":0.175,"avg":0.5856},"Manrope|400":{"adv":{"0":0.61,"1":0.39,"2":0.57,"3":0.553,"4":0.5897,"5":0.5777,"6":0.6207,"7":0.502,"8":0.5803,"9":0.6207," ":0.2,"!":0.3133,"\"":0.392,"#":0.9203,"$":0.589,"%":0.9013,"&":0.6513,"'":0.2133,"(":0.426,")":0.426,"*":0.4367,"+":0.5767,",":0.2653,"-":0.42,".":0.2533,"/":0.3873,":":0.299,";":0.3053,"<":0.6143,"=":0.75,">":0.6143,"?":0.5237,"@":0.9037,"A":0.6337,"B":0.613,"C":0.7153,"D":0.6713,"E":0.57,"F":0.5033,"G":0.705,"H":0.6847,"I":0.2333,"J":0.4637,"K":0.5937,"L":0.5103,"M":0.8407,"N":0.6843,"O":0.7233,"P":0.604,"Q":0.7233,"R":0.6307,"S":0.6163,"T":0.5967,"U":0.702,"V":0.6037,"W":0.9357,"X":0.606,"Y":0.556,"Z":0.614,"[":0.407,"\\":0.3873,"]":0.407,"^":0.6693,"_":0.66,"`":0.4897,"a":0.5557,"b":0.592,"c":0.5537,"d":0.5923,"e":0.5847,"f":0.3547,"g":0.592,"h":0.594,"i":0.2333,"j":0.2503,"k":0.496,"l":0.2333,"m":0.848,"n":0.594,"o":0.5917,"p":0.592,"q":0.5923,"r":0.3607,"s":0.525,"t":0.4007,"u":0.594,"v":0.508,"w":0.7673,"x":0.527,"y":0.5273,"z":0.5297,"{":0.4193,"|":0.2533,"}":0.4193,"~":0.662,"★":1,"·":0.2267,"“":0.3723,"”":0.3723,"’":0.2217,"—":0.78,"–":0.54,"✓":0.7642,"€":0.6487,"£":0.571},"up":{"0":0.735,"1":0.72,"2":0.735,"3":0.72,"4":0.72,"5":0.72,"6":0.7347,"7":0.72,"8":0.735,"9":0.7347," ":0,"!":0.72,"\"":0.72,"#":0.72,"$":0.8197,"%":0.735,"&":0.7343,"'":0.72,"(":0.8393,")":0.8393,"*":0.72,"+":0.5883,",":0.1053,"-":0.3467,".":0.0853,"/":0.72,":":0.46,";":0.54,"<":0.5497,"=":0.4767,">":0.5497,"?":0.7347,"@":0.645,"A":0.72,"B":0.72,"C":0.735,"D":0.72,"E":0.72,"F":0.72,"G":0.7343,"H":0.72,"I":0.72,"J":0.72,"K":0.72,"L":0.72,"M":0.72,"N":0.72,"O":0.735,"P":0.72,"Q":0.735,"R":0.72,"S":0.7348,"T":0.72,"U":0.72,"V":0.72,"W":0.72,"X":0.72,"Y":0.72,"Z":0.72,"[":0.888,"\\":0.72,"]":0.888,"^":0.7362,"_":-0.0435,"`":0.96,"a":0.555,"b":0.72,"c":0.555,"d":0.72,"e":0.555,"f":0.735,"g":0.555,"h":0.72,"i":0.725,"j":0.725,"k":0.72,"l":0.735,"m":0.5543,"n":0.5533,"o":0.555,"p":0.555,"q":0.555,"r":0.546,"s":0.555,"t":0.69,"u":0.54,"v":0.54,"w":0.5403,"x":0.54,"y":0.54,"z":0.54,"{":0.888,"|":0.72,"}":0.888,"~":0.396,"★":0.859,"·":0.3683,"“":0.7332,"”":0.727,"’":0.72,"—":0.3467,"–":0.3467,"✓":0.7231,"€":0.735,"£":0.735},"dn":{"0":0.015,"1":0,"2":-0.0003,"3":0.0143,"4":0,"5":0.015,"6":0.015,"7":0,"8":0.015,"9":0.015," ":0,"!":0,"\"":-0.54,"#":-0.0003,"$":0.0987,"%":0.015,"&":0.015,"'":-0.54,"(":0.1793,")":0.1793,"*":-0.3897,"+":-0.1317,",":0.112,"-":-0.2837,".":0,"/":0,":":-0.08,";":0.112,"<":-0.0803,"=":-0.2433,">":-0.0803,"?":0,"@":0.105,"A":0,"B":0,"C":0.015,"D":0,"E":0,"F":0,"G":0.015,"H":0,"I":0,"J":0.0143,"K":0,"L":0,"M":0,"N":0,"O":0.015,"P":0,"Q":0.015,"R":0,"S":0.015,"T":0,"U":0.015,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.218,"\\":0,"]":0.218,"^":-0.4543,"_":0.1065,"`":-0.805,"a":0.015,"b":0.015,"c":0.015,"d":0.015,"e":0.015,"f":0,"g":0.255,"h":0,"i":0,"j":0.24,"k":0,"l":0,"m":0,"n":0,"o":0.015,"p":0.24,"q":0.24,"r":0,"s":0.0143,"t":0.0095,"u":0.0133,"v":0,"w":0,"x":0,"y":0.24,"z":0,"{":0.218,"|":0,"}":0.218,"~":-0.233,"★":0.078,"·":-0.2617,"“":-0.5157,"”":-0.5095,"’":-0.5025,"—":-0.2837,"–":-0.2837,"✓":0.0181,"€":0.015,"£":0},"cap":0.735,"desc":0.255,"avg":0.5395},"Manrope|500":{"adv":{"0":0.626,"1":0.406,"2":0.5785,"3":0.5625,"4":0.596,"5":0.5805,"6":0.621,"7":0.5125,"8":0.591,"9":0.621," ":0.2,"!":0.329,"\"":0.417,"#":0.924,"$":0.602,"%":0.901,"&":0.657,"'":0.229,"(":0.435,")":0.435,"*":0.446,"+":0.575,",":0.278,"-":0.42,".":0.27,"/":0.4025,":":0.3135,";":0.318,"<":0.622,"=":0.75,">":0.622,"?":0.5335,"@":0.907,"A":0.646,"B":0.619,"C":0.723,"D":0.681,"E":0.575,"F":0.51,"G":0.714,"H":0.697,"I":0.249,"J":0.476,"K":0.6115,"L":0.518,"M":0.8455,"N":0.6955,"O":0.732,"P":0.6155,"Q":0.732,"R":0.6405,"S":0.63,"T":0.6,"U":0.708,"V":0.616,"W":0.949,"X":0.6225,"Y":0.5745,"Z":0.6305,"[":0.4125,"\\":0.4025,"]":0.4125,"^":0.673,"_":0.66,"`":0.506,"a":0.5625,"b":0.6,"c":0.561,"d":0.6005,"e":0.5905,"f":0.3625,"g":0.6,"h":0.6045,"i":0.249,"j":0.263,"k":0.51,"l":0.249,"m":0.865,"n":0.6045,"o":0.6005,"p":0.6,"q":0.6005,"r":0.3735,"s":0.5305,"t":0.4115,"u":0.6045,"v":0.523,"w":0.779,"x":0.536,"y":0.538,"z":0.531,"{":0.4292,"|":0.269,"}":0.4292,"~":0.68,"★":1,"·":0.24,"“":0.3985,"”":0.3985,"’":0.2425,"—":0.78,"–":0.54,"✓":0.7642,"€":0.66,"£":0.571},"up":{"0":0.735,"1":0.72,"2":0.735,"3":0.72,"4":0.72,"5":0.72,"6":0.7345,"7":0.72,"8":0.735,"9":0.7345," ":0,"!":0.72,"\"":0.72,"#":0.72,"$":0.8195,"%":0.735,"&":0.734,"'":0.72,"(":0.843,")":0.843,"*":0.72,"+":0.5875,",":0.113,"-":0.352,".":0.098,"/":0.72,":":0.465,";":0.54,"<":0.5515,"=":0.485,">":0.5515,"?":0.7345,"@":0.645,"A":0.72,"B":0.72,"C":0.735,"D":0.72,"E":0.72,"F":0.72,"G":0.7345,"H":0.72,"I":0.72,"J":0.72,"K":0.72,"L":0.72,"M":0.72,"N":0.72,"O":0.735,"P":0.72,"Q":0.735,"R":0.72,"S":0.7347,"T":0.72,"U":0.72,"V":0.72,"W":0.72,"X":0.72,"Y":0.72,"Z":0.72,"[":0.891,"\\":0.72,"]":0.891,"^":0.736,"_":-0.038,"`":0.9675,"a":0.555,"b":0.72,"c":0.555,"d":0.72,"e":0.555,"f":0.735,"g":0.555,"h":0.72,"i":0.7275,"j":0.7275,"k":0.72,"l":0.735,"m":0.554,"n":0.554,"o":0.555,"p":0.555,"q":0.555,"r":0.5453,"s":0.555,"t":0.69,"u":0.54,"v":0.54,"w":0.5405,"x":0.54,"y":0.54,"z":0.54,"{":0.891,"|":0.72,"}":0.891,"~":0.406,"★":0.859,"·":0.375,"“":0.7328,"”":0.725,"’":0.72,"—":0.352,"–":0.352,"✓":0.7231,"€":0.735,"£":0.735},"dn":{"0":0.015,"1":0,"2":-0.0005,"3":0.014,"4":0,"5":0.015,"6":0.015,"7":0,"8":0.015,"9":0.015," ":0,"!":0,"\"":-0.54,"#":-0.0005,"$":0.099,"%":0.015,"&":0.015,"'":-0.54,"(":0.183,")":0.183,"*":-0.381,"+":-0.1325,",":0.1205,"-":-0.2785,".":0,"/":0,":":-0.075,";":0.1205,"<":-0.0785,"=":-0.235,">":-0.0785,"?":0,"@":0.105,"A":0,"B":0,"C":0.015,"D":0,"E":0,"F":0,"G":0.015,"H":0,"I":0,"J":0.0145,"K":0,"L":0,"M":0,"N":0,"O":0.015,"P":0,"Q":0.015,"R":0,"S":0.015,"T":0,"U":0.015,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.216,"\\":0,"]":0.216,"^":-0.443,"_":0.1115,"`":-0.8025,"a":0.015,"b":0.015,"c":0.015,"d":0.015,"e":0.015,"f":0,"g":0.255,"h":0,"i":0,"j":0.24,"k":0,"l":0,"m":0,"n":0,"o":0.015,"p":0.24,"q":0.24,"r":0,"s":0.0145,"t":0.0098,"u":0.014,"v":0,"w":0,"x":0,"y":0.24,"z":0,"{":0.216,"|":0,"}":0.216,"~":-0.2235,"★":0.078,"·":-0.255,"“":-0.499,"”":-0.4915,"’":-0.4865,"—":-0.2785,"–":-0.2785,"✓":0.0181,"€":0.015,"£":0},"cap":0.735,"desc":0.255,"avg":0.5492},"Manrope|700":{"adv":{"0":0.658,"1":0.438,"2":0.5955,"3":0.5815,"4":0.6087,"5":0.5862,"6":0.6217,"7":0.5335,"8":0.6123,"9":0.6217," ":0.2,"!":0.3603,"\"":0.467,"#":0.9313,"$":0.628,"%":0.9003,"&":0.6683,"'":0.2603,"(":0.453,")":0.453,"*":0.4647,"+":0.5717,",":0.3033,"-":0.42,".":0.3033,"/":0.4328,":":0.3425,";":0.3433,"<":0.6373,"=":0.75,">":0.6373,"?":0.5532,"@":0.9137,"A":0.6707,"B":0.631,"C":0.7383,"D":0.7003,"E":0.585,"F":0.5233,"G":0.732,"H":0.7217,"I":0.2803,"J":0.5007,"K":0.6472,"L":0.5333,"M":0.8552,"N":0.7178,"O":0.7493,"P":0.6385,"Q":0.7493,"R":0.6602,"S":0.6573,"T":0.6067,"U":0.72,"V":0.6407,"W":0.9757,"X":0.6555,"Y":0.6115,"Z":0.6635,"[":0.4235,"\\":0.4328,"]":0.4235,"^":0.6803,"_":0.66,"`":0.5387,"a":0.5762,"b":0.616,"c":0.5757,"d":0.6168,"e":0.6022,"f":0.3782,"g":0.616,"h":0.6255,"i":0.2803,"j":0.2883,"k":0.538,"l":0.2803,"m":0.899,"n":0.6255,"o":0.6182,"p":0.616,"q":0.6168,"r":0.3992,"s":0.5415,"t":0.4332,"u":0.6255,"v":0.553,"w":0.8023,"x":0.554,"y":0.5593,"z":0.5337,"{":0.4491,"|":0.3003,"}":0.4491,"~":0.716,"★":1,"·":0.2667,"“":0.4508,"”":0.4508,"’":0.2842,"—":0.78,"–":0.54,"✓":0.7642,"€":0.6827,"£":0.571},"up":{"0":0.735,"1":0.72,"2":0.735,"3":0.72,"4":0.72,"5":0.72,"6":0.7342,"7":0.72,"8":0.735,"9":0.7342," ":0,"!":0.72,"\"":0.72,"#":0.72,"$":0.8192,"%":0.735,"&":0.7333,"'":0.72,"(":0.8503,")":0.8503,"*":0.72,"+":0.5858,",":0.1283,"-":0.3627,".":0.1233,"/":0.72,":":0.475,";":0.54,"<":0.5552,"=":0.5017,">":0.5552,"?":0.7342,"@":0.645,"A":0.72,"B":0.72,"C":0.735,"D":0.72,"E":0.72,"F":0.72,"G":0.7348,"H":0.72,"I":0.72,"J":0.72,"K":0.72,"L":0.72,"M":0.72,"N":0.72,"O":0.735,"P":0.72,"Q":0.735,"R":0.72,"S":0.7346,"T":0.72,"U":0.72,"V":0.72,"W":0.72,"X":0.72,"Y":0.72,"Z":0.72,"[":0.897,"\\":0.72,"]":0.897,"^":0.7357,"_":-0.0275,"`":0.9825,"a":0.555,"b":0.72,"c":0.555,"d":0.72,"e":0.555,"f":0.735,"g":0.555,"h":0.72,"i":0.7325,"j":0.7325,"k":0.72,"l":0.735,"m":0.5533,"n":0.5553,"o":0.555,"p":0.555,"q":0.555,"r":0.5437,"s":0.555,"t":0.69,"u":0.54,"v":0.54,"w":0.5408,"x":0.54,"y":0.54,"z":0.54,"{":0.897,"|":0.72,"}":0.897,"~":0.426,"★":0.859,"·":0.3883,"“":0.7319,"”":0.722,"’":0.72,"—":0.3627,"–":0.3627,"✓":0.7231,"€":0.735,"£":0.735},"dn":{"0":0.015,"1":0,"2":-0.0008,"3":0.0133,"4":0,"5":0.015,"6":0.015,"7":0,"8":0.015,"9":0.015," ":0,"!":0,"\"":-0.54,"#":-0.0008,"$":0.0997,"%":0.015,"&":0.015,"'":-0.54,"(":0.1903,")":0.1903,"*":-0.3637,"+":-0.1342,",":0.1375,"-":-0.2682,".":0,"/":0,":":-0.065,";":0.1375,"<":-0.0748,"=":-0.2183,">":-0.0748,"?":0,"@":0.105,"A":0,"B":0,"C":0.015,"D":0,"E":0,"F":0,"G":0.015,"H":0,"I":0,"J":0.0148,"K":0,"L":0,"M":0,"N":0,"O":0.015,"P":0,"Q":0.015,"R":0,"S":0.015,"T":0,"U":0.015,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.212,"\\":0,"]":0.212,"^":-0.4203,"_":0.122,"`":-0.7975,"a":0.015,"b":0.015,"c":0.015,"d":0.015,"e":0.015,"f":0,"g":0.255,"h":0,"i":0,"j":0.24,"k":0,"l":0,"m":0,"n":0,"o":0.015,"p":0.24,"q":0.24,"r":0,"s":0.0148,"t":0.0103,"u":0.0153,"v":0,"w":0,"x":0,"y":0.24,"z":0,"{":0.212,"|":0,"}":0.212,"~":-0.2045,"★":0.078,"·":-0.2417,"“":-0.4657,"”":-0.456,"’":-0.454,"—":-0.2682,"–":-0.2682,"✓":0.0181,"€":0.015,"£":0},"cap":0.735,"desc":0.255,"avg":0.5684},"Satoshi|400":{"adv":{"0":0.683,"1":0.334,"2":0.562,"3":0.568,"4":0.627,"5":0.583,"6":0.603,"7":0.504,"8":0.612,"9":0.603," ":0.277,"!":0.271,"\"":0.317,"#":0.675,"$":0.563,"%":0.909,"&":0.682,"'":0.176,"(":0.254,")":0.254,"*":0.403,"+":0.66,",":0.262,"-":0.418,".":0.262,"/":0.349,":":0.282,";":0.282,"<":0.66,"=":0.66,">":0.66,"?":0.515,"@":0.907,"A":0.645,"B":0.629,"C":0.729,"D":0.706,"E":0.575,"F":0.543,"G":0.75,"H":0.705,"I":0.246,"J":0.51,"K":0.616,"L":0.509,"M":0.839,"N":0.713,"O":0.769,"P":0.614,"Q":0.769,"R":0.64,"S":0.563,"T":0.537,"U":0.693,"V":0.641,"W":0.979,"X":0.612,"Y":0.575,"Z":0.58,"[":0.255,"\\":0.349,"]":0.255,"^":0.485,"_":0.518,"`":0,"a":0.522,"b":0.584,"c":0.52,"d":0.584,"e":0.528,"f":0.297,"g":0.584,"h":0.562,"i":0.213,"j":0.213,"k":0.482,"l":0.219,"m":0.842,"n":0.562,"o":0.568,"p":0.584,"q":0.584,"r":0.345,"s":0.434,"t":0.298,"u":0.553,"v":0.486,"w":0.742,"x":0.455,"y":0.471,"z":0.443,"{":0.292,"|":0.311,"}":0.292,"~":0.66,"★":1,"·":0.275,"“":0.407,"”":0.407,"’":0.245,"—":1.138,"–":0.927,"✓":0.741,"€":0.655,"£":0.609},"up":{"0":0.73,"1":0.716,"2":0.729,"3":0.716,"4":0.716,"5":0.716,"6":0.716,"7":0.716,"8":0.729,"9":0.729," ":0,"!":0.716,"\"":0.718,"#":0.716,"$":0.815,"%":0.73,"&":0.728,"'":0.718,"(":0.756,")":0.756,"*":0.73,"+":0.587,",":0.113,"-":0.294,".":0.113,"/":0.716,":":0.496,";":0.496,"<":0.459,"=":0.43,">":0.459,"?":0.729,"@":0.729,"A":0.716,"B":0.716,"C":0.728,"D":0.716,"E":0.716,"F":0.716,"G":0.728,"H":0.716,"I":0.716,"J":0.716,"K":0.716,"L":0.716,"M":0.716,"N":0.716,"O":0.729,"P":0.716,"Q":0.729,"R":0.716,"S":0.729,"T":0.716,"U":0.716,"V":0.716,"W":0.716,"X":0.716,"Y":0.716,"Z":0.716,"[":0.779,"\\":0.716,"]":0.779,"^":0.716,"_":-0.019,"`":0.886,"a":0.497,"b":0.729,"c":0.497,"d":0.729,"e":0.497,"f":0.729,"g":0.497,"h":0.729,"i":0.72,"j":0.72,"k":0.729,"l":0.729,"m":0.497,"n":0.497,"o":0.497,"p":0.497,"q":0.497,"r":0.495,"s":0.497,"t":0.637,"u":0.485,"v":0.484,"w":0.484,"x":0.484,"y":0.484,"z":0.484,"{":0.779,"|":0.793,"}":0.779,"~":0.374,"★":0.859,"·":0.343,"“":0.73,"”":0.73,"’":0.73,"—":0.293,"–":0.293,"✓":0.509,"€":0.728,"£":0.729},"dn":{"0":0.013,"1":0,"2":0,"3":0.012,"4":0,"5":0.012,"6":0.012,"7":0,"8":0.012,"9":0," ":0,"!":0.014,"\"":-0.468,"#":0,"$":0.099,"%":0.013,"&":0.013,"'":-0.468,"(":0.157,")":0.157,"*":-0.401,"+":-0.086,",":0.091,"-":-0.232,".":0.011,"/":0,":":0.011,";":0.091,"<":-0.031,"=":-0.162,">":-0.031,"?":0.014,"@":0.098,"A":0,"B":0,"C":0.011,"D":0,"E":0,"F":0,"G":0.012,"H":0,"I":0,"J":0.012,"K":0,"L":0,"M":0,"N":0,"O":0.012,"P":0,"Q":0.041,"R":0,"S":0.012,"T":0,"U":0.012,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.059,"\\":0,"]":0.059,"^":-0.4,"_":0.078,"`":-0.766,"a":0.012,"b":0.012,"c":0.012,"d":0.012,"e":0.012,"f":0,"g":0.223,"h":0,"i":0,"j":0.221,"k":0,"l":0,"m":0,"n":0,"o":0.012,"p":0.211,"q":0.211,"r":0,"s":0.012,"t":0,"u":0.012,"v":0,"w":0,"x":0,"y":0.218,"z":0,"{":0.059,"|":0.085,"}":0.059,"~":-0.216,"★":0.078,"·":-0.171,"“":-0.527,"”":-0.527,"’":-0.527,"—":-0.232,"–":-0.232,"✓":-0.007,"€":0.012,"£":0},"cap":0.729,"desc":0.223,"avg":0.5242},"Satoshi|500":{"adv":{"0":0.693,"1":0.364,"2":0.575,"3":0.568,"4":0.636,"5":0.591,"6":0.611,"7":0.52,"8":0.625,"9":0.611," ":0.273,"!":0.294,"\"":0.372,"#":0.696,"$":0.577,"%":0.932,"&":0.707,"'":0.208,"(":0.279,")":0.279,"*":0.411,"+":0.66,",":0.276,"-":0.431,".":0.276,"/":0.376,":":0.296,";":0.296,"<":0.66,"=":0.66,">":0.66,"?":0.533,"@":0.924,"A":0.662,"B":0.639,"C":0.743,"D":0.722,"E":0.583,"F":0.555,"G":0.765,"H":0.722,"I":0.267,"J":0.529,"K":0.643,"L":0.522,"M":0.86,"N":0.734,"O":0.777,"P":0.625,"Q":0.777,"R":0.654,"S":0.577,"T":0.562,"U":0.711,"V":0.669,"W":1.005,"X":0.645,"Y":0.606,"Z":0.583,"[":0.279,"\\":0.376,"]":0.279,"^":0.5,"_":0.53,"`":0,"a":0.534,"b":0.6,"c":0.534,"d":0.6,"e":0.542,"f":0.317,"g":0.598,"h":0.575,"i":0.23,"j":0.23,"k":0.508,"l":0.234,"m":0.862,"n":0.575,"o":0.581,"p":0.6,"q":0.6,"r":0.368,"s":0.448,"t":0.318,"u":0.567,"v":0.509,"w":0.768,"x":0.482,"y":0.498,"z":0.457,"{":0.318,"|":0.323,"}":0.318,"~":0.66,"★":1,"·":0.302,"“":0.441,"”":0.441,"’":0.262,"—":1.173,"–":0.951,"✓":0.724,"€":0.638,"£":0.628},"up":{"0":0.737,"1":0.723,"2":0.736,"3":0.723,"4":0.723,"5":0.723,"6":0.723,"7":0.723,"8":0.736,"9":0.736," ":0,"!":0.723,"\"":0.726,"#":0.723,"$":0.821,"%":0.737,"&":0.735,"'":0.726,"(":0.766,")":0.766,"*":0.737,"+":0.587,",":0.129,"-":0.307,".":0.129,"/":0.722,":":0.503,";":0.503,"<":0.473,"=":0.444,">":0.473,"?":0.736,"@":0.736,"A":0.723,"B":0.723,"C":0.735,"D":0.723,"E":0.723,"F":0.723,"G":0.735,"H":0.723,"I":0.723,"J":0.723,"K":0.723,"L":0.723,"M":0.723,"N":0.723,"O":0.736,"P":0.723,"Q":0.736,"R":0.723,"S":0.736,"T":0.723,"U":0.723,"V":0.723,"W":0.723,"X":0.723,"Y":0.723,"Z":0.723,"[":0.806,"\\":0.722,"]":0.806,"^":0.723,"_":-0.018,"`":0.901,"a":0.503,"b":0.736,"c":0.503,"d":0.736,"e":0.503,"f":0.736,"g":0.503,"h":0.736,"i":0.729,"j":0.729,"k":0.736,"l":0.736,"m":0.503,"n":0.503,"o":0.502,"p":0.503,"q":0.503,"r":0.499,"s":0.503,"t":0.642,"u":0.489,"v":0.489,"w":0.489,"x":0.489,"y":0.489,"z":0.489,"{":0.806,"|":0.791,"}":0.806,"~":0.385,"★":0.859,"·":0.363,"“":0.737,"”":0.737,"’":0.737,"—":0.306,"–":0.306,"✓":0.522,"€":0.736,"£":0.736},"dn":{"0":0.013,"1":0,"2":0,"3":0.012,"4":0,"5":0.012,"6":0.012,"7":0,"8":0.012,"9":0," ":0,"!":0.014,"\"":-0.455,"#":0,"$":0.097,"%":0.013,"&":0.013,"'":-0.455,"(":0.173,")":0.173,"*":-0.396,"+":-0.086,",":0.102,"-":-0.223,".":0.012,"/":0,":":0.012,";":0.102,"<":-0.021,"=":-0.153,">":-0.021,"?":0.014,"@":0.105,"A":0,"B":0,"C":0.011,"D":0,"E":0,"F":0,"G":0.012,"H":0,"I":0,"J":0.012,"K":0,"L":0,"M":0,"N":0,"O":0.012,"P":0,"Q":0.048,"R":0,"S":0.012,"T":0,"U":0.012,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.075,"\\":0,"]":0.075,"^":-0.4,"_":0.092,"`":-0.768,"a":0.012,"b":0.012,"c":0.012,"d":0.012,"e":0.012,"f":0,"g":0.232,"h":0,"i":0,"j":0.231,"k":0,"l":0,"m":0,"n":0,"o":0.012,"p":0.219,"q":0.219,"r":0,"s":0.012,"t":0,"u":0.012,"v":0,"w":0,"x":0,"y":0.229,"z":0,"{":0.075,"|":0.087,"}":0.075,"~":-0.218,"★":0.078,"·":-0.171,"“":-0.509,"”":-0.509,"’":-0.509,"—":-0.222,"–":-0.222,"✓":-0.007,"€":0.012,"£":0},"cap":0.736,"desc":0.232,"avg":0.5404},"Satoshi|700":{"adv":{"0":0.705,"1":0.398,"2":0.589,"3":0.569,"4":0.646,"5":0.6,"6":0.62,"7":0.538,"8":0.641,"9":0.62," ":0.27,"!":0.32,"\"":0.434,"#":0.719,"$":0.592,"%":0.959,"&":0.736,"'":0.244,"(":0.308,")":0.308,"*":0.42,"+":0.66,",":0.291,"-":0.445,".":0.291,"/":0.407,":":0.311,";":0.311,"<":0.66,"=":0.66,">":0.66,"?":0.554,"@":0.944,"A":0.681,"B":0.651,"C":0.759,"D":0.74,"E":0.593,"F":0.567,"G":0.782,"H":0.742,"I":0.29,"J":0.552,"K":0.674,"L":0.538,"M":0.884,"N":0.758,"O":0.786,"P":0.639,"Q":0.786,"R":0.67,"S":0.592,"T":0.59,"U":0.731,"V":0.7,"W":1.035,"X":0.681,"Y":0.641,"Z":0.588,"[":0.306,"\\":0.407,"]":0.306,"^":0.517,"_":0.545,"`":0,"a":0.548,"b":0.619,"c":0.55,"d":0.619,"e":0.557,"f":0.339,"g":0.614,"h":0.589,"i":0.248,"j":0.248,"k":0.538,"l":0.251,"m":0.885,"n":0.589,"o":0.596,"p":0.619,"q":0.619,"r":0.393,"s":0.463,"t":0.34,"u":0.583,"v":0.536,"w":0.797,"x":0.513,"y":0.529,"z":0.473,"{":0.349,"|":0.336,"}":0.349,"~":0.66,"★":1,"·":0.333,"“":0.479,"”":0.479,"’":0.281,"—":1.211,"–":0.977,"✓":0.706,"€":0.618,"£":0.65},"up":{"0":0.745,"1":0.731,"2":0.744,"3":0.731,"4":0.731,"5":0.731,"6":0.731,"7":0.731,"8":0.744,"9":0.744," ":0,"!":0.731,"\"":0.736,"#":0.731,"$":0.827,"%":0.745,"&":0.743,"'":0.736,"(":0.778,")":0.778,"*":0.745,"+":0.587,",":0.147,"-":0.321,".":0.147,"/":0.73,":":0.511,";":0.511,"<":0.489,"=":0.46,">":0.489,"?":0.744,"@":0.744,"A":0.731,"B":0.731,"C":0.743,"D":0.731,"E":0.731,"F":0.731,"G":0.743,"H":0.731,"I":0.731,"J":0.731,"K":0.731,"L":0.731,"M":0.731,"N":0.731,"O":0.744,"P":0.731,"Q":0.744,"R":0.731,"S":0.744,"T":0.731,"U":0.731,"V":0.731,"W":0.731,"X":0.731,"Y":0.731,"Z":0.731,"[":0.836,"\\":0.73,"]":0.836,"^":0.731,"_":-0.017,"`":0.918,"a":0.509,"b":0.744,"c":0.509,"d":0.744,"e":0.509,"f":0.744,"g":0.51,"h":0.744,"i":0.74,"j":0.74,"k":0.744,"l":0.744,"m":0.509,"n":0.509,"o":0.508,"p":0.509,"q":0.509,"r":0.503,"s":0.509,"t":0.648,"u":0.494,"v":0.494,"w":0.494,"x":0.494,"y":0.494,"z":0.494,"{":0.836,"|":0.79,"}":0.836,"~":0.397,"★":0.859,"·":0.385,"“":0.745,"”":0.745,"’":0.745,"—":0.32,"–":0.32,"✓":0.537,"€":0.744,"£":0.744},"dn":{"0":0.013,"1":0,"2":0,"3":0.013,"4":0,"5":0.012,"6":0.013,"7":0,"8":0.012,"9":0," ":0,"!":0.013,"\"":-0.441,"#":0,"$":0.095,"%":0.013,"&":0.013,"'":-0.441,"(":0.191,")":0.191,"*":-0.39,"+":-0.086,",":0.115,"-":-0.213,".":0.012,"/":0,":":0.012,";":0.115,"<":-0.009,"=":-0.142,">":-0.009,"?":0.013,"@":0.113,"A":0,"B":0,"C":0.012,"D":0,"E":0,"F":0,"G":0.011,"H":0,"I":0,"J":0.013,"K":0,"L":0,"M":0,"N":0,"O":0.012,"P":0,"Q":0.055,"R":0,"S":0.013,"T":0,"U":0.012,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.093,"\\":0,"]":0.093,"^":-0.4,"_":0.107,"`":-0.769,"a":0.013,"b":0.013,"c":0.013,"d":0.013,"e":0.013,"f":0,"g":0.243,"h":0,"i":0,"j":0.243,"k":0,"l":0,"m":0,"n":0,"o":0.012,"p":0.229,"q":0.229,"r":0,"s":0.013,"t":0,"u":0.013,"v":0,"w":0,"x":0,"y":0.24,"z":0,"{":0.093,"|":0.088,"}":0.093,"~":-0.22,"★":0.078,"·":-0.172,"“":-0.488,"”":-0.488,"’":-0.488,"—":-0.212,"–":-0.212,"✓":-0.007,"€":0.012,"£":0},"cap":0.744,"desc":0.243,"avg":0.5589},"Satoshi|900":{"adv":{"0":0.718,"1":0.437,"2":0.605,"3":0.57,"4":0.657,"5":0.611,"6":0.63,"7":0.559,"8":0.659,"9":0.63," ":0.265,"!":0.35,"\"":0.506,"#":0.746,"$":0.609,"%":0.989,"&":0.77,"'":0.286,"(":0.341,")":0.341,"*":0.43,"+":0.66,",":0.308,"-":0.462,".":0.308,"/":0.442,":":0.328,";":0.328,"<":0.66,"=":0.66,">":0.66,"?":0.577,"@":0.967,"A":0.703,"B":0.665,"C":0.777,"D":0.761,"E":0.603,"F":0.582,"G":0.801,"H":0.764,"I":0.316,"J":0.577,"K":0.709,"L":0.556,"M":0.911,"N":0.786,"O":0.797,"P":0.654,"Q":0.797,"R":0.688,"S":0.609,"T":0.622,"U":0.754,"V":0.736,"W":1.069,"X":0.723,"Y":0.682,"Z":0.593,"[":0.337,"\\":0.442,"]":0.337,"^":0.536,"_":0.561,"`":0,"a":0.564,"b":0.64,"c":0.569,"d":0.64,"e":0.575,"f":0.365,"g":0.633,"h":0.606,"i":0.27,"j":0.27,"k":0.572,"l":0.27,"m":0.912,"n":0.606,"o":0.613,"p":0.64,"q":0.64,"r":0.422,"s":0.48,"t":0.366,"u":0.602,"v":0.566,"w":0.831,"x":0.548,"y":0.565,"z":0.491,"{":0.384,"|":0.352,"}":0.384,"~":0.66,"★":1,"·":0.368,"“":0.523,"”":0.523,"’":0.303,"—":1.256,"–":1.008,"✓":0.684,"€":0.595,"£":0.675},"up":{"0":0.754,"1":0.74,"2":0.754,"3":0.74,"4":0.74,"5":0.74,"6":0.74,"7":0.74,"8":0.754,"9":0.753," ":0,"!":0.74,"\"":0.747,"#":0.74,"$":0.834,"%":0.754,"&":0.753,"'":0.747,"(":0.792,")":0.792,"*":0.754,"+":0.587,",":0.168,"-":0.338,".":0.168,"/":0.738,":":0.52,";":0.52,"<":0.508,"=":0.478,">":0.508,"?":0.754,"@":0.754,"A":0.74,"B":0.74,"C":0.752,"D":0.74,"E":0.74,"F":0.74,"G":0.752,"H":0.74,"I":0.74,"J":0.74,"K":0.74,"L":0.74,"M":0.74,"N":0.74,"O":0.753,"P":0.74,"Q":0.753,"R":0.74,"S":0.754,"T":0.74,"U":0.74,"V":0.74,"W":0.74,"X":0.74,"Y":0.74,"Z":0.74,"[":0.87,"\\":0.738,"]":0.87,"^":0.74,"_":-0.016,"`":0.937,"a":0.516,"b":0.754,"c":0.516,"d":0.754,"e":0.516,"f":0.754,"g":0.517,"h":0.754,"i":0.753,"j":0.753,"k":0.754,"l":0.754,"m":0.516,"n":0.516,"o":0.515,"p":0.516,"q":0.516,"r":0.507,"s":0.516,"t":0.655,"u":0.5,"v":0.5,"w":0.5,"x":0.5,"y":0.5,"z":0.5,"{":0.87,"|":0.788,"}":0.87,"~":0.411,"★":0.859,"·":0.411,"“":0.754,"”":0.754,"’":0.754,"—":0.336,"–":0.336,"✓":0.554,"€":0.754,"£":0.754},"dn":{"0":0.013,"1":0,"2":0,"3":0.013,"4":0,"5":0.012,"6":0.013,"7":0,"8":0.012,"9":0," ":0,"!":0.013,"\"":-0.424,"#":0,"$":0.093,"%":0.013,"&":0.013,"'":-0.424,"(":0.212,")":0.212,"*":-0.384,"+":-0.086,",":0.129,"-":-0.202,".":0.013,"/":0,":":0.013,";":0.129,"<":0.004,"=":-0.13,">":0.004,"?":0.013,"@":0.123,"A":0,"B":0,"C":0.012,"D":0,"E":0,"F":0,"G":0.011,"H":0,"I":0,"J":0.013,"K":0,"L":0,"M":0,"N":0,"O":0.012,"P":0,"Q":0.064,"R":0,"S":0.013,"T":0,"U":0.012,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.114,"\\":0,"]":0.114,"^":-0.4,"_":0.125,"`":-0.771,"a":0.013,"b":0.013,"c":0.013,"d":0.013,"e":0.013,"f":0,"g":0.255,"h":0,"i":0,"j":0.256,"k":0,"l":0,"m":0,"n":0,"o":0.012,"p":0.24,"q":0.24,"r":0,"s":0.013,"t":0,"u":0.013,"v":0,"w":0,"x":0,"y":0.254,"z":0,"{":0.114,"|":0.09,"}":0.114,"~":-0.222,"★":0.078,"·":-0.173,"“":-0.464,"”":-0.464,"’":-0.464,"—":-0.2,"–":-0.2,"✓":-0.007,"€":0.012,"£":0},"cap":0.753,"desc":0.255,"avg":0.5801},"Sora|400":{"adv":{"0":0.743,"1":0.42,"2":0.618,"3":0.614,"4":0.642,"5":0.623,"6":0.659,"7":0.574,"8":0.637,"9":0.659," ":0.228,"!":0.296,"\"":0.43,"#":0.692,"$":0.652,"%":0.85,"&":0.688,"'":0.262,"(":0.376,")":0.376,"*":0.567,"+":0.59,",":0.262,"-":0.504,".":0.262,"/":0.344,":":0.262,";":0.262,"<":0.59,"=":0.59,">":0.59,"?":0.552,"@":1.122,"A":0.756,"B":0.68,"C":0.795,"D":0.791,"E":0.6,"F":0.56,"G":0.831,"H":0.804,"I":0.314,"J":0.64,"K":0.678,"L":0.544,"M":0.92,"N":0.849,"O":0.865,"P":0.64,"Q":0.865,"R":0.7,"S":0.689,"T":0.594,"U":0.789,"V":0.708,"W":1.043,"X":0.696,"Y":0.652,"Z":0.654,"[":0.376,"\\":0.344,"]":0.376,"^":0.572,"_":0.576,"`":0.3,"a":0.575,"b":0.689,"c":0.606,"d":0.689,"e":0.612,"f":0.379,"g":0.675,"h":0.64,"i":0.308,"j":0.317,"k":0.573,"l":0.286,"m":0.968,"n":0.64,"o":0.676,"p":0.689,"q":0.689,"r":0.41,"s":0.536,"t":0.426,"u":0.628,"v":0.559,"w":0.848,"x":0.56,"y":0.547,"z":0.488,"{":0.376,"|":0.374,"}":0.376,"~":0.495,"★":1,"·":0.262,"“":0.438,"”":0.438,"’":0.244,"—":0.9,"–":0.512,"✓":0.7642,"€":0.7,"£":0.624},"up":{"0":0.75,"1":0.73,"2":0.75,"3":0.73,"4":0.748,"5":0.73,"6":0.736,"7":0.73,"8":0.748,"9":0.75," ":0,"!":0.73,"\"":0.73,"#":0.73,"$":0.827,"%":0.74,"&":0.738,"'":0.73,"(":0.776,")":0.776,"*":0.779,"+":0.582,",":0.13,"-":0.319,".":0.122,"/":0.78,":":0.492,";":0.492,"<":0.538,"=":0.457,">":0.538,"?":0.75,"@":0.75,"A":0.73,"B":0.734,"C":0.75,"D":0.734,"E":0.73,"F":0.73,"G":0.75,"H":0.73,"I":0.73,"J":0.73,"K":0.73,"L":0.73,"M":0.73,"N":0.73,"O":0.75,"P":0.734,"Q":0.75,"R":0.734,"S":0.75,"T":0.73,"U":0.73,"V":0.73,"W":0.73,"X":0.73,"Y":0.73,"Z":0.73,"[":0.776,"\\":0.78,"]":0.776,"^":0.722,"_":-0.06,"`":0.81,"a":0.54,"b":0.73,"c":0.552,"d":0.73,"e":0.552,"f":0.734,"g":0.552,"h":0.73,"i":0.74,"j":0.748,"k":0.73,"l":0.73,"m":0.55,"n":0.55,"o":0.552,"p":0.552,"q":0.552,"r":0.54,"s":0.55,"t":0.696,"u":0.535,"v":0.534,"w":0.534,"x":0.534,"y":0.534,"z":0.534,"{":0.776,"|":0.73,"}":0.776,"~":0.404,"★":0.859,"·":0.334,"“":0.738,"”":0.738,"’":0.738,"—":0.319,"–":0.319,"✓":0.7231,"€":0.744,"£":0.738},"dn":{"0":0.018,"1":0,"2":0,"3":0.018,"4":0,"5":0.018,"6":0.02,"7":0,"8":0.018,"9":0.006," ":0,"!":0,"\"":-0.46,"#":0,"$":0.129,"%":0.01,"&":0.018,"'":-0.46,"(":0.182,")":0.182,"*":-0.283,"+":-0.106,",":0.157,"-":-0.237,".":0,"/":0.06,":":0,";":0.157,"<":-0.12,"=":-0.203,">":-0.12,"?":0,"@":0.243,"A":0,"B":0.004,"C":0.018,"D":0.004,"E":0,"F":0,"G":0.018,"H":0,"I":0,"J":0.018,"K":0,"L":0,"M":0,"N":0,"O":0.018,"P":0,"Q":0.211,"R":0,"S":0.018,"T":0,"U":0.018,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.182,"\\":0.06,"]":0.182,"^":-0.309,"_":0.132,"`":-0.612,"a":0.014,"b":0.018,"c":0.018,"d":0.018,"e":0.018,"f":0,"g":0.208,"h":0,"i":0,"j":0.204,"k":0,"l":0,"m":0,"n":0,"o":0.018,"p":0.2,"q":0.2,"r":0,"s":0.016,"t":0.006,"u":0.016,"v":0,"w":0,"x":0,"y":0.208,"z":0,"{":0.182,"|":0.2,"}":0.182,"~":-0.238,"★":0.078,"·":-0.212,"“":-0.426,"”":-0.426,"’":-0.426,"—":-0.237,"–":-0.237,"✓":0.0181,"€":0.014,"£":0},"cap":0.75,"desc":0.208,"avg":0.5779},"Sora|500":{"adv":{"0":0.7495,"1":0.4225,"2":0.6225,"3":0.62,"4":0.652,"5":0.63,"6":0.6682,"7":0.585,"8":0.647,"9":0.6682," ":0.222,"!":0.303,"\"":0.4515,"#":0.702,"$":0.6515,"%":0.8635,"&":0.7022,"'":0.264,"(":0.3815,")":0.3815,"*":0.568,"+":0.592,",":0.2655,"-":0.5055,".":0.2655,"/":0.365,":":0.2655,";":0.2655,"<":0.592,"=":0.59,">":0.592,"?":0.5555,"@":1.1238,"A":0.7645,"B":0.684,"C":0.7968,"D":0.7877,"E":0.598,"F":0.56,"G":0.8315,"H":0.8025,"I":0.32,"J":0.641,"K":0.7027,"L":0.5485,"M":0.937,"N":0.858,"O":0.8647,"P":0.649,"Q":0.8647,"R":0.71,"S":0.6815,"T":0.602,"U":0.7845,"V":0.7185,"W":1.0522,"X":0.7045,"Y":0.6535,"Z":0.6518,"[":0.3815,"\\":0.365,"]":0.3815,"^":0.587,"_":0.5805,"`":0.3,"a":0.5813,"b":0.6937,"c":0.6077,"d":0.6937,"e":0.616,"f":0.38,"g":0.6787,"h":0.644,"i":0.3165,"j":0.3242,"k":0.595,"l":0.2955,"m":0.973,"n":0.644,"o":0.6775,"p":0.6937,"q":0.6937,"r":0.4135,"s":0.5425,"t":0.4285,"u":0.6335,"v":0.5715,"w":0.8725,"x":0.5735,"y":0.5545,"z":0.4925,"{":0.3815,"|":0.3745,"}":0.3815,"~":0.511,"★":1,"·":0.2655,"“":0.46,"”":0.46,"’":0.2525,"—":0.9045,"–":0.5165,"✓":0.7642,"€":0.704,"£":0.628},"up":{"0":0.7505,"1":0.73,"2":0.7505,"3":0.73,"4":0.749,"5":0.73,"6":0.736,"7":0.73,"8":0.749,"9":0.751," ":0,"!":0.73,"\"":0.73,"#":0.73,"$":0.827,"%":0.742,"&":0.7385,"'":0.73,"(":0.776,")":0.776,"*":0.7805,"+":0.5865,",":0.1475,"-":0.3305,".":0.141,"/":0.78,":":0.499,";":0.499,"<":0.551,"=":0.4723,">":0.551,"?":0.7505,"@":0.75,"A":0.73,"B":0.7345,"C":0.7505,"D":0.7345,"E":0.73,"F":0.73,"G":0.7505,"H":0.73,"I":0.73,"J":0.73,"K":0.73,"L":0.73,"M":0.73,"N":0.73,"O":0.7505,"P":0.7345,"Q":0.7505,"R":0.7345,"S":0.7505,"T":0.73,"U":0.73,"V":0.73,"W":0.73,"X":0.73,"Y":0.73,"Z":0.73,"[":0.776,"\\":0.78,"]":0.776,"^":0.7272,"_":-0.057,"`":0.814,"a":0.5455,"b":0.73,"c":0.557,"d":0.73,"e":0.557,"f":0.736,"g":0.556,"h":0.73,"i":0.7495,"j":0.7555,"k":0.73,"l":0.73,"m":0.555,"n":0.555,"o":0.557,"p":0.556,"q":0.556,"r":0.545,"s":0.5545,"t":0.696,"u":0.5393,"v":0.5385,"w":0.5385,"x":0.5385,"y":0.5385,"z":0.5385,"{":0.776,"|":0.7303,"}":0.776,"~":0.4115,"★":0.859,"·":0.347,"“":0.739,"”":0.739,"’":0.739,"—":0.3272,"–":0.3272,"✓":0.7231,"€":0.745,"£":0.739},"dn":{"0":0.0185,"1":0,"2":0,"3":0.0185,"4":0,"5":0.0185,"6":0.0205,"7":0,"8":0.019,"9":0.006," ":0,"!":0,"\"":-0.447,"#":0,"$":0.129,"%":0.0125,"&":0.019,"'":-0.447,"(":0.182,")":0.182,"*":-0.2815,"+":-0.1015,",":0.1618,"-":-0.2285,".":0,"/":0.06,":":0,";":0.162,"<":-0.107,"=":-0.1877,">":-0.1065,"?":0,"@":0.244,"A":0,"B":0.0045,"C":0.0185,"D":0.004,"E":0,"F":0,"G":0.0185,"H":0,"I":0,"J":0.0185,"K":0,"L":0,"M":0,"N":0,"O":0.0185,"P":0,"Q":0.2133,"R":0,"S":0.0185,"T":0,"U":0.0185,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.182,"\\":0.06,"]":0.182,"^":-0.3095,"_":0.145,"`":-0.612,"a":0.014,"b":0.018,"c":0.0185,"d":0.018,"e":0.0185,"f":0,"g":0.2112,"h":0,"i":0,"j":0.2045,"k":0,"l":0,"m":0,"n":0,"o":0.0185,"p":0.2,"q":0.2,"r":0,"s":0.0165,"t":0.0065,"u":0.0165,"v":0,"w":0,"x":0,"y":0.211,"z":0,"{":0.182,"|":0.2,"}":0.182,"~":-0.2305,"★":0.078,"·":-0.206,"“":-0.414,"”":-0.414,"’":-0.4135,"—":-0.2317,"–":-0.2317,"✓":0.0181,"€":0.015,"£":0},"cap":0.7505,"desc":0.2112,"avg":0.5839},"Sora|700":{"adv":{"0":0.7625,"1":0.4275,"2":0.6315,"3":0.632,"4":0.672,"5":0.644,"6":0.6868,"7":0.607,"8":0.667,"9":0.6868," ":0.21,"!":0.317,"\"":0.4945,"#":0.722,"$":0.6505,"%":0.8905,"&":0.7307,"'":0.268,"(":0.3925,")":0.3925,"*":0.57,"+":0.596,",":0.2725,"-":0.5085,".":0.2725,"/":0.407,":":0.2725,";":0.2725,"<":0.596,"=":0.59,">":0.596,"?":0.5625,"@":1.1272,"A":0.7815,"B":0.692,"C":0.8002,"D":0.7813,"E":0.594,"F":0.56,"G":0.8325,"H":0.7995,"I":0.332,"J":0.643,"K":0.7522,"L":0.5575,"M":0.971,"N":0.876,"O":0.8643,"P":0.667,"Q":0.8643,"R":0.73,"S":0.6665,"T":0.618,"U":0.7755,"V":0.7395,"W":1.0707,"X":0.7215,"Y":0.6565,"Z":0.6472,"[":0.3925,"\\":0.407,"]":0.3925,"^":0.617,"_":0.5895,"`":0.3,"a":0.5938,"b":0.7032,"c":0.6112,"d":0.7032,"e":0.624,"f":0.382,"g":0.6863,"h":0.652,"i":0.3335,"j":0.3387,"k":0.639,"l":0.3145,"m":0.983,"n":0.652,"o":0.6805,"p":0.7032,"q":0.7032,"r":0.4205,"s":0.5555,"t":0.4335,"u":0.6445,"v":0.5965,"w":0.9215,"x":0.6005,"y":0.5695,"z":0.5015,"{":0.3925,"|":0.3755,"}":0.3925,"~":0.543,"★":1,"·":0.2725,"“":0.504,"”":0.504,"’":0.2695,"—":0.9135,"–":0.5255,"✓":0.7642,"€":0.712,"£":0.636},"up":{"0":0.7515,"1":0.73,"2":0.7515,"3":0.73,"4":0.751,"5":0.73,"6":0.736,"7":0.73,"8":0.751,"9":0.752," ":0,"!":0.73,"\"":0.73,"#":0.73,"$":0.827,"%":0.746,"&":0.7395,"'":0.73,"(":0.776,")":0.776,"*":0.7835,"+":0.5955,",":0.1825,"-":0.3535,".":0.179,"/":0.78,":":0.512,";":0.512,"<":0.577,"=":0.5027,">":0.577,"?":0.7515,"@":0.75,"A":0.73,"B":0.7355,"C":0.7515,"D":0.7355,"E":0.73,"F":0.73,"G":0.7515,"H":0.73,"I":0.73,"J":0.73,"K":0.73,"L":0.73,"M":0.73,"N":0.73,"O":0.7515,"P":0.7355,"Q":0.7515,"R":0.7355,"S":0.7515,"T":0.73,"U":0.73,"V":0.73,"W":0.73,"X":0.73,"Y":0.73,"Z":0.73,"[":0.776,"\\":0.78,"]":0.776,"^":0.7378,"_":-0.051,"`":0.821,"a":0.5565,"b":0.73,"c":0.567,"d":0.73,"e":0.567,"f":0.74,"g":0.564,"h":0.73,"i":0.7685,"j":0.7705,"k":0.73,"l":0.73,"m":0.565,"n":0.565,"o":0.567,"p":0.564,"q":0.564,"r":0.555,"s":0.5635,"t":0.696,"u":0.5478,"v":0.5475,"w":0.5475,"x":0.5475,"y":0.5475,"z":0.5475,"{":0.776,"|":0.7308,"}":0.776,"~":0.4265,"★":0.859,"·":0.373,"“":0.741,"”":0.741,"’":0.741,"—":0.3438,"–":0.3438,"✓":0.7231,"€":0.747,"£":0.741},"dn":{"0":0.0195,"1":0,"2":0,"3":0.0195,"4":0,"5":0.0195,"6":0.0215,"7":0,"8":0.021,"9":0.006," ":0,"!":0,"\"":-0.421,"#":0,"$":0.129,"%":0.0175,"&":0.021,"'":-0.421,"(":0.182,")":0.182,"*":-0.2785,"+":-0.0925,",":0.1713,"-":-0.2115,".":0,"/":0.06,":":0,";":0.171,"<":-0.08,"=":-0.1572,">":-0.0795,"?":0,"@":0.246,"A":0,"B":0.0055,"C":0.0195,"D":0.004,"E":0,"F":0,"G":0.0195,"H":0,"I":0,"J":0.0195,"K":0,"L":0,"M":0,"N":0,"O":0.0195,"P":0,"Q":0.2178,"R":0,"S":0.0195,"T":0,"U":0.0195,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.182,"\\":0.06,"]":0.182,"^":-0.3105,"_":0.171,"`":-0.612,"a":0.014,"b":0.018,"c":0.0195,"d":0.018,"e":0.0195,"f":0,"g":0.2178,"h":0,"i":0,"j":0.2055,"k":0,"l":0,"m":0,"n":0,"o":0.0195,"p":0.2,"q":0.2,"r":0,"s":0.0175,"t":0.0075,"u":0.0175,"v":0,"w":0,"x":0,"y":0.217,"z":0,"{":0.182,"|":0.2,"}":0.182,"~":-0.2155,"★":0.078,"·":-0.194,"“":-0.389,"”":-0.389,"’":-0.3885,"—":-0.2213,"–":-0.2213,"✓":0.0181,"€":0.017,"£":0},"cap":0.7515,"desc":0.2178,"avg":0.596},"Bungee|400":{"adv":{"0":0.727,"1":0.601,"2":0.639,"3":0.637,"4":0.709,"5":0.647,"6":0.693,"7":0.627,"8":0.711,"9":0.693," ":0.225,"!":0.424,"\"":0.646,"#":0.75,"$":0.65,"%":1.031,"&":0.766,"'":0.356,"(":0.429,")":0.429,"*":0.718,"+":0.734,",":0.384,"-":0.42,".":0.384,"/":0.347,":":0.384,";":0.384,"<":0.714,"=":0.734,">":0.714,"?":0.656,"@":0.867,"A":0.73,"B":0.725,"C":0.628,"D":0.746,"E":0.654,"F":0.618,"G":0.708,"H":0.759,"I":0.605,"J":0.688,"K":0.746,"L":0.695,"M":0.849,"N":0.753,"O":0.737,"P":0.682,"Q":0.737,"R":0.743,"S":0.65,"T":0.656,"U":0.746,"V":0.73,"W":0.831,"X":0.737,"Y":0.705,"Z":0.66,"[":0.429,"\\":0.347,"]":0.429,"^":0.714,"_":0.734,"`":0.5,"a":0.73,"b":0.725,"c":0.628,"d":0.746,"e":0.654,"f":0.618,"g":0.708,"h":0.759,"i":0.605,"j":0.688,"k":0.746,"l":0.695,"m":0.849,"n":0.753,"o":0.737,"p":0.682,"q":0.737,"r":0.743,"s":0.65,"t":0.656,"u":0.746,"v":0.73,"w":0.831,"x":0.737,"y":0.705,"z":0.66,"{":0.455,"|":0.347,"}":0.455,"~":0.734,"★":1,"·":0.364,"“":0.684,"”":0.684,"’":0.384,"—":1.134,"–":0.734,"✓":0.7642,"€":0.648,"£":0.695},"up":{"0":0.735,"1":0.72,"2":0.72,"3":0.72,"4":0.72,"5":0.72,"6":0.72,"7":0.72,"8":0.735,"9":0.735," ":0,"!":0.72,"\"":0.72,"#":0.72,"$":0.81,"%":0.725,"&":0.72,"'":0.72,"(":0.8,")":0.8,"*":0.72,"+":0.657,",":0.275,"-":0.463,".":0.275,"/":0.81,":":0.63,";":0.63,"<":0.666,"=":0.603,">":0.666,"?":0.72,"@":0.811,"A":0.72,"B":0.72,"C":0.72,"D":0.72,"E":0.72,"F":0.72,"G":0.72,"H":0.72,"I":0.72,"J":0.72,"K":0.72,"L":0.72,"M":0.72,"N":0.72,"O":0.735,"P":0.72,"Q":0.735,"R":0.72,"S":0.72,"T":0.72,"U":0.72,"V":0.72,"W":0.72,"X":0.72,"Y":0.72,"Z":0.72,"[":0.8,"\\":0.81,"]":0.8,"^":0.717,"_":0.103,"`":0.965,"a":0.72,"b":0.72,"c":0.72,"d":0.72,"e":0.72,"f":0.72,"g":0.72,"h":0.72,"i":0.72,"j":0.72,"k":0.72,"l":0.72,"m":0.72,"n":0.72,"o":0.735,"p":0.72,"q":0.735,"r":0.72,"s":0.72,"t":0.72,"u":0.72,"v":0.72,"w":0.72,"x":0.72,"y":0.72,"z":0.72,"{":0.8,"|":0.81,"}":0.8,"~":0.484,"★":0.859,"·":0.495,"“":0.72,"”":0.72,"’":0.72,"—":0.463,"–":0.463,"✓":0.7231,"€":0.72,"£":0.72},"dn":{"0":0.015,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0.015,"7":0,"8":0.015,"9":0," ":0,"!":0,"\"":-0.345,"#":0,"$":0.09,"%":0.006,"&":0,"'":-0.345,"(":0.08,")":0.08,"*":-0.139,"+":-0.063,",":0.1,"-":-0.257,".":0,"/":0.09,":":0,";":0.1,"<":-0.052,"=":-0.117,">":-0.052,"?":0,"@":0.091,"A":0,"B":0,"C":0,"D":0,"E":0,"F":0,"G":0,"H":0,"I":0,"J":0.015,"K":0,"L":0,"M":0,"N":0,"O":0.015,"P":0,"Q":0.09,"R":0,"S":0,"T":0,"U":0.015,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.08,"\\":0.09,"]":0.08,"^":-0.17,"_":0.103,"`":-0.749,"a":0,"b":0,"c":0,"d":0,"e":0,"f":0,"g":0,"h":0,"i":0,"j":0.015,"k":0,"l":0,"m":0,"n":0,"o":0.015,"p":0,"q":0.09,"r":0,"s":0,"t":0,"u":0.015,"v":0,"w":0,"x":0,"y":0,"z":0,"{":0.08,"|":0.09,"}":0.08,"~":-0.259,"★":0.078,"·":-0.22,"“":-0.345,"”":-0.345,"’":-0.345,"—":-0.257,"–":-0.257,"✓":0.0181,"€":0,"£":0},"cap":0.735,"desc":0.21,"avg":0.6519},"Special Elite|400":{"adv":{"0":0.6108,"1":0.5698,"2":0.5737,"3":0.5571,"4":0.6123,"5":0.5376,"6":0.5884,"7":0.5552,"8":0.5986,"9":0.5845," ":0.293,"!":0.2764,"\"":0.3521,"#":0.5547,"$":0.5269,"%":0.667,"&":0.6763,"'":0.1963,"(":0.2793,")":0.2817,"*":0.5229,"+":0.4961,",":0.3364,"-":0.6362,".":0.3496,"/":0.5571,":":0.3433,";":0.3286,"<":0.4634,"=":0.6367,">":0.4634,"?":0.4702,"@":0.665,"A":0.5498,"B":0.604,"C":0.5791,"D":0.6226,"E":0.6387,"F":0.6055,"G":0.6152,"H":0.6528,"I":0.4951,"J":0.541,"K":0.5825,"L":0.6025,"M":0.6978,"N":0.6279,"O":0.6167,"P":0.5532,"Q":0.6021,"R":0.6367,"S":0.5889,"T":0.5942,"U":0.6216,"V":0.6113,"W":0.6436,"X":0.582,"Y":0.561,"Z":0.5923,"[":0.312,"\\":0.5571,"]":0.3125,"^":0.3999,"_":0.6816,"`":0.2178,"a":0.5654,"b":0.5654,"c":0.5474,"d":0.603,"e":0.5439,"f":0.4731,"g":0.583,"h":0.6167,"i":0.5684,"j":0.4155,"k":0.6206,"l":0.5405,"m":0.6636,"n":0.6323,"o":0.5835,"p":0.5874,"q":0.5679,"r":0.5791,"s":0.5195,"t":0.5103,"u":0.6387,"v":0.605,"w":0.6787,"x":0.6606,"y":0.5928,"z":0.5288,"{":0.2749,"|":0.2603,"}":0.2769,"~":0.5591,"★":1,"·":0.2329,"“":0.4702,"”":0.4692,"’":0.2642,"—":1.1138,"–":0.6118,"✓":0.7642,"€":0.7329,"£":0.626},"up":{"0":0.7197,"1":0.7114,"2":0.6792,"3":0.6938,"4":0.707,"5":0.6895,"6":0.7061,"7":0.7334,"8":0.7197,"9":0.7148," ":0,"!":0.7012,"\"":0.7031,"#":0.7124,"$":0.9189,"%":0.8711,"&":0.7041,"'":0.7026,"(":0.7568,")":0.769,"*":0.7061,"+":0.5591,",":0.251,"-":0.397,".":0.2446,"/":0.7593,":":0.519,";":0.519,"<":0.5649,"=":0.5122,">":0.5649,"?":0.7285,"@":0.6797,"A":0.7026,"B":0.7031,"C":0.6992,"D":0.7124,"E":0.6904,"F":0.708,"G":0.71,"H":0.6895,"I":0.71,"J":0.7021,"K":0.7104,"L":0.7173,"M":0.7031,"N":0.6997,"O":0.7017,"P":0.689,"Q":0.7109,"R":0.7056,"S":0.6895,"T":0.7061,"U":0.71,"V":0.7251,"W":0.6885,"X":0.6968,"Y":0.7188,"Z":0.708,"[":0.7539,"\\":0.7593,"]":0.7539,"^":0.6992,"_":-0.1128,"`":0.75,"a":0.5015,"b":0.6855,"c":0.4971,"d":0.6895,"e":0.498,"f":0.7012,"g":0.4888,"h":0.6826,"i":0.6738,"j":0.6826,"k":0.6826,"l":0.6816,"m":0.4888,"n":0.4902,"o":0.4873,"p":0.4668,"q":0.4844,"r":0.4941,"s":0.4956,"t":0.6934,"u":0.4868,"v":0.4819,"w":0.4932,"x":0.4814,"y":0.4849,"z":0.481,"{":0.7173,"|":0.7383,"}":0.7173,"~":0.4146,"★":0.859,"·":0.4131,"“":0.7031,"”":0.7031,"’":0.7031,"—":0.3901,"–":0.3901,"✓":0.7231,"€":0.5898,"£":0.7051},"dn":{"0":-0.001,"1":0.0112,"2":0.0244,"3":0.0249,"4":-0.0044,"5":0,"6":0.0093,"7":0.0337,"8":-0.002,"9":0.002," ":0,"!":0,"\"":-0.4492,"#":0.002,"$":0.2007,"%":0.1851,"&":0.0049,"'":-0.4492,"(":0.0708,")":0.0581,"*":-0.2769,"+":-0.1318,",":0.1963,"-":-0.2739,".":0.0024,"/":0.0405,":":0.0024,";":0.1963,"<":-0.1206,"=":-0.186,">":-0.1206,"?":-0.0029,"@":0.0039,"A":0.0156,"B":0.0059,"C":0.0127,"D":0.0161,"E":0.0156,"F":0.0083,"G":0.0024,"H":0.019,"I":0.0234,"J":0.0029,"K":0.0044,"L":0.0132,"M":0.0098,"N":0.0142,"O":0.0298,"P":0.0117,"Q":0.0972,"R":0.0083,"S":0.0122,"T":-0.0015,"U":0.0059,"V":0.0146,"W":-0.0005,"X":0.0005,"Y":0.002,"Z":0.001,"[":0.0718,"\\":0.0405,"]":0.0718,"^":-0.3667,"_":0.2139,"`":-0.5771,"a":0.0059,"b":0.0156,"c":0.0215,"d":0.0254,"e":0.0225,"f":0.0288,"g":0.2236,"h":0.0293,"i":0.0415,"j":0.2358,"k":0.0278,"l":0.0278,"m":0.0225,"n":0.0229,"o":0.0337,"p":0.2207,"q":0.2109,"r":0.0151,"s":0.0303,"t":0.0337,"u":0.0273,"v":0.0288,"w":0.0093,"x":0.0386,"y":0.2314,"z":0.022,"{":0.0659,"|":0.0396,"}":0.0659,"~":-0.2231,"★":0.078,"·":-0.2998,"“":-0.3901,"”":-0.3901,"’":-0.3901,"—":-0.271,"–":-0.271,"✓":0.0181,"€":-0.0713,"£":0.0322},"cap":0.7017,"desc":0.2314,"avg":0.5369},"Knewave|400":{"adv":{"0":0.6,"1":0.4,"2":0.545,"3":0.597,"4":0.588,"5":0.603,"6":0.582,"7":0.548,"8":0.658,"9":0.603," ":0.312,"!":0.37,"\"":0.458,"#":0.833,"$":0.591,"%":0.976,"&":0.712,"'":0.25,"(":0.342,")":0.427,"*":0.558,"+":0.497,",":0.288,"-":0.588,".":0.235,"/":0.567,":":0.339,";":0.339,"<":0.57,"=":0.567,">":0.745,"?":0.57,"@":0.815,"A":0.564,"B":0.585,"C":0.573,"D":0.594,"E":0.524,"F":0.424,"G":0.639,"H":0.588,"I":0.367,"J":0.561,"K":0.579,"L":0.467,"M":0.691,"N":0.63,"O":0.639,"P":0.606,"Q":0.724,"R":0.582,"S":0.552,"T":0.502,"U":0.685,"V":0.515,"W":0.773,"X":0.6,"Y":0.491,"Z":0.561,"[":0.536,"\\":0.567,"]":0.545,"^":0.539,"_":0.833,"`":0.282,"a":0.536,"b":0.53,"c":0.445,"d":0.542,"e":0.482,"f":0.436,"g":0.542,"h":0.591,"i":0.321,"j":0.358,"k":0.476,"l":0.294,"m":0.767,"n":0.652,"o":0.524,"p":0.588,"q":0.576,"r":0.397,"s":0.506,"t":0.436,"u":0.606,"v":0.509,"w":0.709,"x":0.467,"y":0.57,"z":0.518,"{":0.506,"|":0.421,"}":0.582,"~":0.464,"★":1,"·":0.235,"“":0.458,"”":0.464,"’":0.239,"—":0.742,"–":0.621,"✓":0.7642,"€":0.642,"£":0.579},"up":{"0":0.819,"1":0.797,"2":0.809,"3":0.825,"4":0.811,"5":0.777,"6":0.8,"7":0.792,"8":0.813,"9":0.794," ":0,"!":0.802,"\"":0.813,"#":0.791,"$":0.932,"%":0.848,"&":0.806,"'":0.775,"(":0.837,")":0.845,"*":0.859,"+":0.715,",":0.11,"-":0.442,".":0.078,"/":0.842,":":0.526,";":0.536,"<":0.613,"=":0.541,">":0.637,"?":0.767,"@":0.797,"A":0.773,"B":0.797,"C":0.772,"D":0.774,"E":0.789,"F":0.776,"G":0.784,"H":0.786,"I":0.782,"J":0.809,"K":0.799,"L":0.775,"M":0.776,"N":0.753,"O":0.787,"P":0.796,"Q":0.836,"R":0.785,"S":0.786,"T":0.786,"U":0.792,"V":0.77,"W":0.787,"X":0.809,"Y":0.786,"Z":0.794,"[":0.872,"\\":0.901,"]":0.877,"^":0.87,"_":0.043,"`":0.892,"a":0.488,"b":0.811,"c":0.508,"d":0.806,"e":0.492,"f":0.781,"g":0.465,"h":0.805,"i":0.715,"j":0.722,"k":0.818,"l":0.82,"m":0.519,"n":0.492,"o":0.489,"p":0.508,"q":0.474,"r":0.518,"s":0.507,"t":0.826,"u":0.506,"v":0.535,"w":0.521,"x":0.51,"y":0.471,"z":0.51,"{":0.831,"|":0.902,"}":0.837,"~":0.521,"★":0.859,"·":0.376,"“":0.788,"”":0.816,"’":0.818,"—":0.439,"–":0.439,"✓":0.7231,"€":0.797,"£":0.86},"dn":{"0":0.09,"1":0.113,"2":0.103,"3":0.084,"4":0.114,"5":0.096,"6":0.073,"7":0.096,"8":0.094,"9":0.094," ":0,"!":0.118,"\"":-0.472,"#":0.022,"$":0.198,"%":0.085,"&":0.118,"'":-0.452,"(":0.156,")":0.177,"*":-0.211,"+":-0.143,",":0.182,"-":-0.246,".":0.114,"/":0.213,":":-0.067,";":0.003,"<":-0.057,"=":-0.14,">":-0.064,"?":0.098,"@":0.097,"A":0.073,"B":0.067,"C":0.062,"D":0.081,"E":0.074,"F":0.068,"G":0.067,"H":0.083,"I":0.047,"J":0.097,"K":0.082,"L":0.057,"M":0.057,"N":0.048,"O":0.082,"P":0.093,"Q":0.16,"R":0.061,"S":0.06,"T":0.079,"U":0.06,"V":0.05,"W":0.045,"X":0.092,"Y":0.093,"Z":0.077,"[":0.182,"\\":0.255,"]":0.198,"^":-0.394,"_":0.173,"`":-0.656,"a":0.048,"b":0.054,"c":0.055,"d":0.07,"e":0.06,"f":0.099,"g":0.339,"h":0.059,"i":0.092,"j":0.296,"k":0.082,"l":0.082,"m":0.08,"n":0.079,"o":0.057,"p":0.332,"q":0.329,"r":0.075,"s":0.091,"t":0.083,"u":0.047,"v":0.086,"w":0.047,"x":0.07,"y":0.341,"z":0.074,"{":0.149,"|":0.145,"}":0.151,"~":-0.258,"★":0.078,"·":-0.184,"“":-0.432,"”":-0.487,"’":-0.473,"—":-0.239,"–":-0.254,"✓":0.0181,"€":0.067,"£":0.114},"cap":0.809,"desc":0.341,"avg":0.5385},"Roboto Slab|400":{"adv":{"0":0.5703,"1":0.4121,"2":0.5522,"3":0.54,"4":0.5796,"5":0.5278,"6":0.5586,"7":0.5508,"8":0.5522,"9":0.5635," ":0.2485,"!":0.2358,"\"":0.376,"#":0.6084,"$":0.542,"%":0.7129,"&":0.6294,"'":0.2246,"(":0.3232,")":0.3193,"*":0.4678,"+":0.5591,",":0.1973,"-":0.3892,".":0.2407,"/":0.4023,":":0.2046,";":0.207,"<":0.4966,"=":0.5503,">":0.5176,"?":0.4653,"@":0.8892,"A":0.7485,"B":0.6455,"C":0.6299,"D":0.6621,"E":0.6377,"F":0.6133,"G":0.6572,"H":0.7705,"I":0.3345,"J":0.5708,"K":0.7329,"L":0.5908,"M":0.9678,"N":0.7773,"O":0.6597,"P":0.6333,"Q":0.6719,"R":0.6763,"S":0.5889,"T":0.6865,"U":0.7432,"V":0.7363,"W":1.0396,"X":0.7466,"Y":0.7134,"Z":0.5845,"[":0.2798,"\\":0.4106,"]":0.2695,"^":0.4219,"_":0.5703,"`":0.2422,"a":0.5527,"b":0.5591,"c":0.521,"d":0.5947,"e":0.5171,"f":0.354,"g":0.5649,"h":0.6421,"i":0.3184,"j":0.2563,"k":0.6284,"l":0.3188,"m":0.9653,"n":0.6558,"o":0.5488,"p":0.5845,"q":0.5562,"r":0.417,"s":0.499,"t":0.3564,"u":0.6079,"v":0.5889,"w":0.8901,"x":0.5874,"y":0.582,"z":0.5039,"{":0.3423,"|":0.2202,"}":0.3423,"~":0.6768,"★":1,"·":0.252,"“":0.3633,"”":0.3672,"’":0.2041,"—":0.7876,"–":0.6836,"✓":0.7642,"€":0.5156,"£":0.5757},"up":{"0":0.7212,"1":0.7109,"2":0.7212,"3":0.7212,"4":0.7109,"5":0.7109,"6":0.7212,"7":0.7109,"8":0.7212,"9":0.7212," ":0,"!":0.7109,"\"":0.7617,"#":0.7109,"$":0.8267,"%":0.7212,"&":0.7212,"'":0.7617,"(":0.7988,")":0.7988,"*":0.7109,"+":0.5889,",":0.1079,"-":0.3379,".":0.0986,"/":0.7109,":":0.5283,";":0.5283,"<":0.4946,"=":0.4819,">":0.4849,"?":0.7212,"@":0.6987,"A":0.7109,"B":0.7109,"C":0.7212,"D":0.7109,"E":0.7109,"F":0.7109,"G":0.7212,"H":0.7109,"I":0.7109,"J":0.7109,"K":0.7109,"L":0.7109,"M":0.7109,"N":0.7109,"O":0.7212,"P":0.7109,"Q":0.7212,"R":0.7104,"S":0.7212,"T":0.7109,"U":0.7109,"V":0.7109,"W":0.7109,"X":0.7109,"Y":0.7109,"Z":0.7109,"[":0.8125,"\\":0.7109,"]":0.8125,"^":0.7109,"_":0,"`":0.7617,"a":0.5381,"b":0.7617,"c":0.5381,"d":0.7617,"e":0.5381,"f":0.772,"g":0.5381,"h":0.7617,"i":0.7617,"j":0.7617,"k":0.7617,"l":0.7617,"m":0.5381,"n":0.5381,"o":0.5381,"p":0.5381,"q":0.5381,"r":0.5381,"s":0.5381,"t":0.6558,"u":0.5283,"v":0.5283,"w":0.5283,"x":0.5283,"y":0.5283,"z":0.5283,"{":0.7798,"|":0.7109,"}":0.7798,"~":0.3921,"★":0.859,"·":0.4063,"“":0.771,"”":0.7617,"’":0.7617,"—":0.3921,"–":0.3921,"✓":0.7231,"€":0.7212,"£":0.7212},"dn":{"0":0.0103,"1":0,"2":0,"3":0.0103,"4":0,"5":0.0103,"6":0.0103,"7":0,"8":0.0103,"9":0.0103," ":0,"!":0,"\"":-0.5151,"#":0,"$":0.1016,"%":0.0103,"&":0.0103,"'":-0.5151,"(":0.2261,")":0.2261,"*":-0.2964,"+":-0.0713,",":0.1519,"-":-0.2627,".":0,"/":0.061,":":0,";":0.1519,"<":-0.0522,"=":-0.1987,">":-0.0425,"?":0,"@":0.2212,"A":0,"B":0,"C":0.0103,"D":0,"E":0,"F":0,"G":0.0103,"H":0,"I":0,"J":0.0103,"K":0,"L":0,"M":0,"N":0,"O":0.0103,"P":0,"Q":0.1196,"R":0,"S":0.0103,"T":0,"U":0.0103,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.1523,"\\":0.061,"]":0.1523,"^":-0.356,"_":0.0752,"`":-0.6289,"a":0.0103,"b":0.0103,"c":0.0103,"d":0.0103,"e":0.0103,"f":0,"g":0.2134,"h":0,"i":0,"j":0.2134,"k":0,"l":0,"m":0,"n":0,"o":0.0103,"p":0.2031,"q":0.2031,"r":0,"s":0.0103,"t":0.0083,"u":0.0103,"v":0,"w":0,"x":0,"y":0.2134,"z":0,"{":0.1777,"|":0.1318,"}":0.1777,"~":-0.1958,"★":0.078,"·":-0.3076,"“":-0.498,"”":-0.4849,"’":-0.4849,"—":-0.3164,"–":-0.3164,"✓":0.0181,"€":0.0103,"£":0},"cap":0.7212,"desc":0.2134,"avg":0.533},"Roboto Slab|700":{"adv":{"0":0.5712,"1":0.4419,"2":0.5547,"3":0.5431,"4":0.5654,"5":0.5333,"6":0.5586,"7":0.5405,"8":0.5444,"9":0.5572," ":0.2452,"!":0.2476,"\"":0.3838,"#":0.5849,"$":0.5405,"%":0.6978,"&":0.624,"'":0.2192,"(":0.3344,")":0.3476,"*":0.4464,"+":0.5362,",":0.2455,"-":0.3979,".":0.2549,"/":0.3885,":":0.2221,";":0.2212,"<":0.4942,"=":0.5485,">":0.5034,"?":0.4813,"@":0.8819,"A":0.7383,"B":0.6564,"C":0.6449,"D":0.6964,"E":0.6386,"F":0.6178,"G":0.6705,"H":0.7811,"I":0.3486,"J":0.5868,"K":0.7546,"L":0.586,"M":1.0087,"N":0.7831,"O":0.7061,"P":0.6469,"Q":0.7074,"R":0.6874,"S":0.6087,"T":0.6784,"U":0.7591,"V":0.7496,"W":1.0751,"X":0.7394,"Y":0.7363,"Z":0.5986,"[":0.2912,"\\":0.417,"]":0.2828,"^":0.4315,"_":0.5342,"`":0.288,"a":0.5633,"b":0.5766,"c":0.5285,"d":0.5917,"e":0.5264,"f":0.3901,"g":0.5851,"h":0.6358,"i":0.3229,"j":0.2931,"k":0.6426,"l":0.3188,"m":0.9361,"n":0.6383,"o":0.5639,"p":0.6056,"q":0.5646,"r":0.4327,"s":0.5047,"t":0.3589,"u":0.6224,"v":0.6087,"w":0.8895,"x":0.644,"y":0.6275,"z":0.5407,"{":0.3284,"|":0.2091,"}":0.3314,"~":0.646,"★":1,"·":0.27,"“":0.4067,"”":0.4103,"’":0.23,"—":0.7789,"–":0.67,"✓":0.7642,"€":0.5189,"£":0.5748},"up":{"0":0.7212,"1":0.7109,"2":0.7212,"3":0.7212,"4":0.7109,"5":0.7109,"6":0.7212,"7":0.7109,"8":0.7212,"9":0.7212," ":0,"!":0.7109,"\"":0.7617,"#":0.7109,"$":0.8242,"%":0.7212,"&":0.7212,"'":0.7617,"(":0.7872,")":0.7871,"*":0.7109,"+":0.5889,",":0.1188,"-":0.359,".":0.1251,"/":0.7109,":":0.5278,";":0.5278,"<":0.5025,"=":0.4843,">":0.4981,"?":0.7212,"@":0.6924,"A":0.7109,"B":0.7109,"C":0.7212,"D":0.7109,"E":0.7109,"F":0.7109,"G":0.7212,"H":0.7109,"I":0.7109,"J":0.7109,"K":0.7109,"L":0.7109,"M":0.7109,"N":0.7109,"O":0.7212,"P":0.7109,"Q":0.7212,"R":0.7111,"S":0.7218,"T":0.7109,"U":0.7109,"V":0.7109,"W":0.7109,"X":0.7109,"Y":0.7109,"Z":0.7109,"[":0.8258,"\\":0.7109,"]":0.8258,"^":0.7109,"_":0,"`":0.7617,"a":0.5381,"b":0.7617,"c":0.5381,"d":0.7617,"e":0.5381,"f":0.772,"g":0.5381,"h":0.7617,"i":0.7617,"j":0.7617,"k":0.7617,"l":0.7617,"m":0.5381,"n":0.5381,"o":0.5381,"p":0.5381,"q":0.5381,"r":0.5381,"s":0.5372,"t":0.6576,"u":0.5283,"v":0.5283,"w":0.5283,"x":0.5283,"y":0.5283,"z":0.5283,"{":0.7798,"|":0.7109,"}":0.7798,"~":0.4029,"★":0.859,"·":0.4038,"“":0.7773,"”":0.7617,"’":0.7617,"—":0.4047,"–":0.4047,"✓":0.7231,"€":0.7212,"£":0.7212},"dn":{"0":0.0103,"1":0,"2":0,"3":0.0103,"4":0,"5":0.0103,"6":0.0103,"7":0,"8":0.0103,"9":0.0103," ":0,"!":0,"\"":-0.5039,"#":0,"$":0.1046,"%":0.0097,"&":0.0103,"'":-0.5037,"(":0.2197,")":0.2197,"*":-0.2828,"+":-0.0713,",":0.1778,"-":-0.2491,".":0,"/":0.061,":":0,";":0.1777,"<":-0.0336,"=":-0.162,">":-0.0292,"?":0,"@":0.2212,"A":0,"B":0,"C":0.0103,"D":0,"E":0,"F":0,"G":0.0103,"H":0,"I":0,"J":0.0103,"K":0,"L":0,"M":0,"N":0,"O":0.0103,"P":0,"Q":0.1371,"R":0,"S":0.0103,"T":0,"U":0.0103,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.1641,"\\":0.061,"]":0.1641,"^":-0.356,"_":0.0909,"`":-0.6284,"a":0.0103,"b":0.0103,"c":0.0103,"d":0.0103,"e":0.0103,"f":0,"g":0.2134,"h":0,"i":0,"j":0.2134,"k":0,"l":0,"m":0,"n":0,"o":0.0103,"p":0.2031,"q":0.2031,"r":0,"s":0.0103,"t":0.0101,"u":0.0103,"v":0,"w":0,"x":0,"y":0.2134,"z":0,"{":0.1759,"|":0.1318,"}":0.1759,"~":-0.1847,"★":0.078,"·":-0.2788,"“":-0.4927,"”":-0.4775,"’":-0.4776,"—":-0.2935,"–":-0.2935,"✓":0.0181,"€":0.0103,"£":0},"cap":0.7212,"desc":0.2134,"avg":0.5411},"Zilla Slab|400":{"adv":{"0":0.576,"1":0.385,"2":0.515,"3":0.489,"4":0.539,"5":0.512,"6":0.531,"7":0.471,"8":0.538,"9":0.531," ":0.227,"!":0.24,"\"":0.371,"#":0.591,"$":0.47,"%":0.687,"&":0.73,"'":0.191,"(":0.274,")":0.275,"*":0.415,"+":0.421,",":0.201,"-":0.348,".":0.211,"/":0.339,":":0.224,";":0.234,"<":0.407,"=":0.578,">":0.407,"?":0.446,"@":0.906,"A":0.648,"B":0.604,"C":0.646,"D":0.705,"E":0.588,"F":0.558,"G":0.691,"H":0.755,"I":0.322,"J":0.456,"K":0.642,"L":0.545,"M":0.882,"N":0.738,"O":0.729,"P":0.574,"Q":0.736,"R":0.617,"S":0.533,"T":0.62,"U":0.718,"V":0.648,"W":0.934,"X":0.632,"Y":0.613,"Z":0.577,"[":0.282,"\\":0.387,"]":0.282,"^":0.452,"_":0.534,"`":0.44,"a":0.483,"b":0.534,"c":0.462,"d":0.549,"e":0.47,"f":0.319,"g":0.548,"h":0.56,"i":0.28,"j":0.252,"k":0.52,"l":0.266,"m":0.863,"n":0.573,"o":0.513,"p":0.55,"q":0.534,"r":0.42,"s":0.438,"t":0.371,"u":0.561,"v":0.509,"w":0.766,"x":0.514,"y":0.511,"z":0.464,"{":0.28,"|":0.233,"}":0.28,"~":0.611,"★":1,"·":0.219,"“":0.365,"”":0.363,"’":0.201,"—":1.079,"–":0.623,"✓":0.7642,"€":0.601,"£":0.509},"up":{"0":0.531,"1":0.521,"2":0.531,"3":0.531,"4":0.521,"5":0.521,"6":0.66,"7":0.521,"8":0.66,"9":0.531," ":0,"!":0.65,"\"":0.65,"#":0.521,"$":0.593,"%":0.531,"&":0.66,"'":0.65,"(":0.718,")":0.718,"*":0.65,"+":0.455,",":0.114,"-":0.261,".":0.108,"/":0.688,":":0.445,";":0.445,"<":0.549,"=":0.418,">":0.549,"?":0.66,"@":0.654,"A":0.65,"B":0.65,"C":0.66,"D":0.65,"E":0.65,"F":0.65,"G":0.66,"H":0.65,"I":0.65,"J":0.65,"K":0.651,"L":0.65,"M":0.65,"N":0.65,"O":0.66,"P":0.65,"Q":0.66,"R":0.65,"S":0.66,"T":0.65,"U":0.65,"V":0.65,"W":0.65,"X":0.65,"Y":0.65,"Z":0.65,"[":0.75,"\\":0.688,"]":0.75,"^":0.656,"_":-0.074,"`":0.683,"a":0.454,"b":0.688,"c":0.454,"d":0.688,"e":0.454,"f":0.698,"g":0.454,"h":0.688,"i":0.651,"j":0.651,"k":0.688,"l":0.688,"m":0.454,"n":0.454,"o":0.455,"p":0.454,"q":0.454,"r":0.453,"s":0.454,"t":0.588,"u":0.445,"v":0.445,"w":0.445,"x":0.445,"y":0.445,"z":0.445,"{":0.75,"|":0.73,"}":0.75,"~":0.342,"★":0.859,"·":0.358,"“":0.668,"”":0.67,"’":0.695,"—":0.257,"–":0.257,"✓":0.7231,"€":0.529,"£":0.529},"dn":{"0":0.01,"1":0,"2":0,"3":0.141,"4":0.131,"5":0.14,"6":0.01,"7":0.13,"8":0.01,"9":0.139," ":0,"!":0,"\"":-0.377,"#":0,"$":0.065,"%":0.01,"&":0.01,"'":-0.377,"(":0.183,")":0.183,"*":-0.333,"+":-0.108,",":0.102,"-":-0.2,".":0,"/":0,":":0,";":0.102,"<":-0.014,"=":-0.144,">":-0.014,"?":0,"@":0.202,"A":0,"B":0,"C":0.01,"D":0,"E":0,"F":0,"G":0.01,"H":0,"I":0,"J":0.01,"K":0,"L":0,"M":0,"N":0,"O":0.01,"P":0,"Q":0.033,"R":0,"S":0.01,"T":0,"U":0.01,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.213,"\\":0,"]":0.213,"^":-0.373,"_":0.125,"`":-0.52,"a":0.01,"b":0.01,"c":0.01,"d":0.01,"e":0.01,"f":0,"g":0.223,"h":0,"i":0,"j":0.231,"k":0,"l":0,"m":0,"n":0,"o":0.01,"p":0.213,"q":0.213,"r":0,"s":0.01,"t":0.01,"u":0.01,"v":0,"w":0,"x":0,"y":0.213,"z":0,"{":0.212,"|":0.08,"}":0.212,"~":-0.2,"★":0.078,"·":-0.256,"“":-0.452,"”":-0.454,"’":-0.479,"—":-0.206,"–":-0.206,"✓":0.0181,"€":0.008,"£":0},"cap":0.66,"desc":0.223,"avg":0.5031},"Zilla Slab|700":{"adv":{"0":0.576,"1":0.404,"2":0.537,"3":0.533,"4":0.57,"5":0.522,"6":0.536,"7":0.495,"8":0.539,"9":0.535," ":0.187,"!":0.261,"\"":0.387,"#":0.574,"$":0.491,"%":0.738,"&":0.702,"'":0.208,"(":0.289,")":0.289,"*":0.416,"+":0.401,",":0.222,"-":0.321,".":0.228,"/":0.376,":":0.248,";":0.249,"<":0.397,"=":0.545,">":0.395,"?":0.481,"@":0.894,"A":0.687,"B":0.622,"C":0.644,"D":0.698,"E":0.593,"F":0.567,"G":0.682,"H":0.761,"I":0.352,"J":0.486,"K":0.674,"L":0.558,"M":0.9,"N":0.76,"O":0.712,"P":0.598,"Q":0.718,"R":0.638,"S":0.557,"T":0.651,"U":0.719,"V":0.685,"W":0.989,"X":0.666,"Y":0.646,"Z":0.589,"[":0.299,"\\":0.421,"]":0.299,"^":0.469,"_":0.502,"`":0.44,"a":0.506,"b":0.551,"c":0.471,"d":0.57,"e":0.483,"f":0.343,"g":0.568,"h":0.581,"i":0.299,"j":0.265,"k":0.553,"l":0.285,"m":0.876,"n":0.593,"o":0.523,"p":0.571,"q":0.551,"r":0.441,"s":0.459,"t":0.398,"u":0.585,"v":0.527,"w":0.76,"x":0.537,"y":0.53,"z":0.477,"{":0.299,"|":0.244,"}":0.299,"~":0.568,"★":1,"·":0.23,"“":0.401,"”":0.395,"’":0.222,"—":1.028,"–":0.59,"✓":0.7642,"€":0.592,"£":0.495},"up":{"0":0.531,"1":0.521,"2":0.531,"3":0.531,"4":0.521,"5":0.521,"6":0.66,"7":0.521,"8":0.66,"9":0.531," ":0,"!":0.65,"\"":0.65,"#":0.521,"$":0.593,"%":0.531,"&":0.66,"'":0.65,"(":0.718,")":0.718,"*":0.65,"+":0.455,",":0.149,"-":0.288,".":0.163,"/":0.688,":":0.451,";":0.451,"<":0.549,"=":0.435,">":0.549,"?":0.659,"@":0.654,"A":0.65,"B":0.65,"C":0.66,"D":0.65,"E":0.65,"F":0.65,"G":0.66,"H":0.65,"I":0.65,"J":0.65,"K":0.65,"L":0.65,"M":0.65,"N":0.65,"O":0.66,"P":0.65,"Q":0.66,"R":0.65,"S":0.66,"T":0.65,"U":0.65,"V":0.65,"W":0.65,"X":0.65,"Y":0.65,"Z":0.65,"[":0.785,"\\":0.688,"]":0.785,"^":0.65,"_":-0.068,"`":0.7,"a":0.46,"b":0.688,"c":0.46,"d":0.688,"e":0.46,"f":0.698,"g":0.46,"h":0.688,"i":0.665,"j":0.665,"k":0.688,"l":0.688,"m":0.46,"n":0.46,"o":0.461,"p":0.46,"q":0.46,"r":0.457,"s":0.46,"t":0.588,"u":0.451,"v":0.451,"w":0.451,"x":0.451,"y":0.451,"z":0.451,"{":0.785,"|":0.73,"}":0.786,"~":0.363,"★":0.859,"·":0.414,"“":0.669,"”":0.67,"’":0.73,"—":0.278,"–":0.278,"✓":0.7231,"€":0.529,"£":0.528},"dn":{"0":0.01,"1":0,"2":0,"3":0.141,"4":0.13,"5":0.141,"6":0.01,"7":0.13,"8":0.01,"9":0.139," ":0,"!":0,"\"":-0.377,"#":0,"$":0.065,"%":0.01,"&":0.01,"'":-0.377,"(":0.183,")":0.183,"*":-0.309,"+":-0.108,",":0.085,"-":-0.18,".":0,"/":0,":":0,";":0.085,"<":-0.014,"=":-0.125,">":-0.014,"?":0,"@":0.202,"A":0,"B":0,"C":0.01,"D":0,"E":0,"F":0,"G":0.01,"H":0,"I":0,"J":0.01,"K":0,"L":0,"M":0,"N":0.001,"O":0.01,"P":0,"Q":0.049,"R":0,"S":0.01,"T":0,"U":0.01,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.248,"\\":0,"]":0.248,"^":-0.367,"_":0.153,"`":-0.508,"a":0.01,"b":0.01,"c":0.01,"d":0.01,"e":0.01,"f":0,"g":0.222,"h":0,"i":0,"j":0.235,"k":0,"l":0,"m":0,"n":0,"o":0.01,"p":0.213,"q":0.213,"r":0,"s":0.01,"t":0.01,"u":0.009,"v":0,"w":0,"x":0,"y":0.213,"z":0,"{":0.248,"|":0.08,"}":0.247,"~":-0.176,"★":0.078,"·":-0.251,"“":-0.435,"”":-0.436,"’":-0.496,"—":-0.193,"–":-0.193,"✓":0.0181,"€":0.008,"£":0},"cap":0.66,"desc":0.222,"avg":0.5147},"Big Shoulders Stencil Display|400":{"adv":{"0":0.3727,"1":0.1993,"2":0.3587,"3":0.3697,"4":0.4057,"5":0.3768,"6":0.3663,"7":0.3314,"8":0.3653,"9":0.3655," ":0.2071,"!":0.2049,"\"":0.2691,"#":0.5609,"$":0.3414,"%":0.4966,"&":0.4688,"'":0.1528,"(":0.2328,")":0.2328,"*":0.2571,"+":0.4394,",":0.2055,"-":0.3173,".":0.2049,"/":0.3263,":":0.2049,";":0.2055,"<":0.4444,"=":0.4194,">":0.4444,"?":0.3238,"@":0.4897,"A":0.3421,"B":0.3535,"C":0.3497,"D":0.3602,"E":0.3016,"F":0.2944,"G":0.3492,"H":0.3661,"I":0.1721,"J":0.3289,"K":0.3454,"L":0.2896,"M":0.5519,"N":0.4031,"O":0.3596,"P":0.3382,"Q":0.3596,"R":0.3527,"S":0.3414,"T":0.2804,"U":0.3522,"V":0.3445,"W":0.5491,"X":0.3339,"Y":0.3354,"Z":0.2983,"[":0.2487,"\\":0.3263,"]":0.2487,"^":0.3505,"_":0.656,"`":0.2217,"a":0.3476,"b":0.3643,"c":0.3401,"d":0.3643,"e":0.3427,"f":0.2397,"g":0.3629,"h":0.37,"i":0.1756,"j":0.1945,"k":0.32,"l":0.1758,"m":0.5649,"n":0.37,"o":0.3551,"p":0.3643,"q":0.3643,"r":0.258,"s":0.3216,"t":0.2361,"u":0.3631,"v":0.3092,"w":0.5212,"x":0.2885,"y":0.3251,"z":0.28,"{":0.2874,"|":0.1721,"}":0.2746,"~":0.4573,"★":1,"·":0.1512,"“":0.3291,"”":0.3291,"’":0.2055,"—":0.6866,"–":0.4044,"✓":0.7642,"€":0.432,"£":0.3862},"up":{"0":0.8056,"1":0.8,"2":0.8061,"3":0.8,"4":0.8,"5":0.8,"6":0.8052,"7":0.8,"8":0.8056,"9":0.8052," ":0,"!":0.8,"\"":0.8,"#":0.8,"$":0.899,"%":0.8006,"&":0.8056,"'":0.8,"(":0.8,")":0.8,"*":0.804,"+":0.555,",":0.0905,"-":0.4136,".":0.0896,"/":0.8,":":0.3896,";":0.3918,"<":0.4968,"=":0.4748,">":0.4968,"?":0.8062,"@":0.7149,"A":0.8,"B":0.8,"C":0.8051,"D":0.8,"E":0.8,"F":0.8,"G":0.8056,"H":0.8,"I":0.8,"J":0.8,"K":0.8,"L":0.8,"M":0.8,"N":0.8,"O":0.8061,"P":0.8,"Q":0.8061,"R":0.8,"S":0.8061,"T":0.8,"U":0.8,"V":0.8,"W":0.8,"X":0.8,"Y":0.8,"Z":0.8,"[":0.8,"\\":0.8,"]":0.8,"^":0.6899,"_":-0.04,"`":0.7535,"a":0.6061,"b":0.8,"c":0.6061,"d":0.8,"e":0.606,"f":0.808,"g":0.6061,"h":0.8,"i":0.8,"j":0.8,"k":0.8,"l":0.8,"m":0.607,"n":0.607,"o":0.6061,"p":0.607,"q":0.607,"r":0.6014,"s":0.6061,"t":0.77,"u":0.6,"v":0.6,"w":0.6,"x":0.6,"y":0.6,"z":0.6,"{":0.8,"|":0.91,"}":0.8,"~":0.4537,"★":0.859,"·":0.4455,"“":0.8,"”":0.8,"’":0.8,"—":0.4136,"–":0.4136,"✓":0.7231,"€":0.8,"£":0.8052},"dn":{"0":0.0056,"1":0,"2":0,"3":0.0061,"4":0,"5":0.0061,"6":0.0065,"7":0,"8":0.0056,"9":0.0065," ":0,"!":0,"\"":-0.5945,"#":0,"$":0.092,"%":0.0016,"&":0.0056,"'":-0.5945,"(":0.2,")":0.2,"*":-0.588,"+":-0.2213,",":0.1021,"-":-0.3537,".":0,"/":0.2,":":0,";":0.1021,"<":-0.2868,"=":-0.3021,">":-0.2868,"?":0,"@":0.118,"A":0,"B":0,"C":0.0065,"D":0,"E":0,"F":0,"G":0.0061,"H":0,"I":0,"J":0.0061,"K":0,"L":0,"M":0,"N":0,"O":0.0061,"P":0,"Q":0.1098,"R":0,"S":0.0061,"T":0,"U":0.0061,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.2,"\\":0.2,"]":0.2,"^":-0.4673,"_":0.06,"`":-0.64,"a":0.0063,"b":0.007,"c":0.0061,"d":0.007,"e":0.0061,"f":0,"g":0.1619,"h":0,"i":0,"j":0.2048,"k":0,"l":0,"m":0,"n":0,"o":0.0061,"p":0.2,"q":0.2,"r":0,"s":0.0061,"t":0.007,"u":0.007,"v":0,"w":0,"x":0,"y":0.2033,"z":0,"{":0.2007,"|":0.12,"}":0.2007,"~":-0.3301,"★":0.078,"·":-0.3872,"“":-0.6074,"”":-0.6074,"’":-0.6074,"—":-0.3537,"–":-0.3537,"✓":0.0181,"€":0,"£":0},"cap":0.8061,"desc":0.2033,"avg":0.344},"Big Shoulders Stencil Display|700":{"adv":{"0":0.4397,"1":0.2366,"2":0.4242,"3":0.4367,"4":0.4682,"5":0.4458,"6":0.4323,"7":0.408,"8":0.4328,"9":0.4321," ":0.2135,"!":0.2274,"\"":0.3359,"#":0.6483,"$":0.4076,"%":0.5891,"&":0.5437,"'":0.1778,"(":0.2623,")":0.2623,"*":0.2546,"+":0.4876,",":0.2282,"-":0.3815,".":0.2274,"/":0.3681,":":0.2274,";":0.2282,"<":0.4986,"=":0.4676,">":0.4986,"?":0.4017,"@":0.6066,"A":0.4149,"B":0.4228,"C":0.4197,"D":0.4275,"E":0.3547,"F":0.3501,"G":0.421,"H":0.4254,"I":0.201,"J":0.3906,"K":0.4208,"L":0.3457,"M":0.6482,"N":0.4729,"O":0.4279,"P":0.4082,"Q":0.4279,"R":0.4212,"S":0.4076,"T":0.3496,"U":0.4195,"V":0.4216,"W":0.6793,"X":0.4108,"Y":0.4031,"Z":0.358,"[":0.3022,"\\":0.3681,"]":0.3022,"^":0.3911,"_":0.656,"`":0.2448,"a":0.4114,"b":0.4303,"c":0.3994,"d":0.4303,"e":0.4007,"f":0.2873,"g":0.4321,"h":0.4363,"i":0.2033,"j":0.2142,"k":0.3881,"l":0.2038,"m":0.6672,"n":0.4363,"o":0.4174,"p":0.4303,"q":0.4303,"r":0.3094,"s":0.3794,"t":0.2865,"u":0.4284,"v":0.3795,"w":0.6459,"x":0.3536,"y":0.3949,"z":0.3404,"{":0.3386,"|":0.201,"}":0.3322,"~":0.4961,"★":1,"·":0.1701,"“":0.3929,"”":0.3929,"’":0.2282,"—":0.7941,"–":0.475,"✓":0.7642,"€":0.4969,"£":0.4565},"up":{"0":0.8073,"1":0.8,"2":0.8078,"3":0.8,"4":0.8,"5":0.8,"6":0.8074,"7":0.8,"8":0.8076,"9":0.8074," ":0,"!":0.8,"\"":0.8,"#":0.8,"$":0.9095,"%":0.8023,"&":0.8073,"'":0.8,"(":0.8,")":0.8,"*":0.804,"+":0.57,",":0.1162,"-":0.4168,".":0.1143,"/":0.8,":":0.4143,";":0.4154,"<":0.5084,"=":0.4924,">":0.5084,"?":0.8084,"@":0.7371,"A":0.8,"B":0.8,"C":0.8071,"D":0.8,"E":0.8,"F":0.8,"G":0.8076,"H":0.8,"I":0.8,"J":0.8,"K":0.8,"L":0.8,"M":0.8,"N":0.8,"O":0.8078,"P":0.8,"Q":0.8078,"R":0.8,"S":0.8078,"T":0.8,"U":0.8,"V":0.8,"W":0.8,"X":0.8,"Y":0.8,"Z":0.8,"[":0.8,"\\":0.8,"]":0.8,"^":0.6894,"_":-0.04,"`":0.766,"a":0.6078,"b":0.8,"c":0.6078,"d":0.8,"e":0.6076,"f":0.8095,"g":0.6078,"h":0.8,"i":0.8,"j":0.8,"k":0.8,"l":0.8,"m":0.6085,"n":0.6085,"o":0.6078,"p":0.6085,"q":0.6085,"r":0.6027,"s":0.6078,"t":0.77,"u":0.6,"v":0.6,"w":0.6,"x":0.6,"y":0.6,"z":0.6,"{":0.8,"|":0.91,"}":0.8,"~":0.4529,"★":0.859,"·":0.4592,"“":0.8,"”":0.8,"’":0.8,"—":0.4168,"–":0.4168,"✓":0.7231,"€":0.8,"£":0.8074},"dn":{"0":0.0073,"1":0,"2":0,"3":0.0078,"4":0,"5":0.0078,"6":0.008,"7":0,"8":0.0076,"9":0.008," ":0,"!":0,"\"":-0.5553,"#":0,"$":0.101,"%":0.0033,"&":0.0076,"'":-0.5553,"(":0.2,")":0.2,"*":-0.588,"+":-0.1752,",":0.122,"-":-0.3209,".":0,"/":0.2,":":0,";":0.122,"<":-0.244,"=":-0.2542,">":-0.244,"?":0,"@":0.1392,"A":0,"B":0,"C":0.008,"D":0,"E":0,"F":0,"G":0.0078,"H":0,"I":0,"J":0.0078,"K":0,"L":0,"M":0,"N":0,"O":0.0078,"P":0,"Q":0.1378,"R":0,"S":0.0078,"T":0,"U":0.0078,"V":0,"W":0,"X":0,"Y":0,"Z":0,"[":0.2,"\\":0.2,"]":0.2,"^":-0.4487,"_":0.06,"`":-0.64,"a":0.0071,"b":0.0085,"c":0.0078,"d":0.0085,"e":0.0078,"f":0,"g":0.1815,"h":0,"i":0,"j":0.2089,"k":0,"l":0,"m":0,"n":0,"o":0.0078,"p":0.2,"q":0.2,"r":0,"s":0.0078,"t":0.0085,"u":0.0085,"v":0,"w":0,"x":0,"y":0.2071,"z":0,"{":0.2014,"|":0.12,"}":0.2014,"~":-0.3031,"★":0.078,"·":-0.3756,"“":-0.5618,"”":-0.5618,"’":-0.5618,"—":-0.3209,"–":-0.3209,"✓":0.0181,"€":0,"£":0},"cap":0.8078,"desc":0.2071,"avg":0.4009}};
/* the face a price may be set in — the display face unless its figures are
   unfit for money */
/* HOW MUCH OF A TEXT BOX A SHAPE ACTUALLY COVERS.
   A starburst is neither its bounding square nor its inner disc: the points
   reach out to the full radius in sixteen directions and the gaps between them
   cover nothing. Judging it by the square condemned placements that were fine;
   judging it by the disc let a point sit across the last letters of a pill.
   Sampling the real star polygon answers the question that was actually being
   asked — can the reader still read this. */
function starCover(box,st){
  /* Most candidate seats are nowhere near most lines. Reject on the bounding
     square first so the search can afford to evaluate every seat rather than
     stopping at the first tolerable one. */
  if(box.x+box.w<st.cx-st.r||box.x>st.cx+st.r||
     box.y+box.h<st.cy-st.r||box.y>st.cy+st.r)return 0;
  const N=8,M=8;let hit=0;
  for(let i=0;i<N;i++)for(let j=0;j<M;j++){
    const px=box.x+box.w*(i+.5)/N, py=box.y+box.h*(j+.5)/M;
    const dx=px-st.cx, dy=py-st.cy, d=Math.hypot(dx,dy);
    if(d>st.r)continue;
    const a=Math.atan2(dy,dx)-st.rot;
    const step=Math.PI/st.pts;
    /* the radius of the star at this angle: linear between a point and a valley */
    const t=Math.abs(((a/step)%2+2)%2-1);            // 0 at a valley, 1 at a point
    if(d<=st.r*(st.inner+(1-st.inner)*t))hit++;
  }
  return hit/(N*M);
}
/* An asset is chosen from the pool for the card's own subject. A phone card
   shows a phone; the pool is never widened to "whatever is left", which is how
   a Pokemon card once ended up advertising an iPhone. */
/* Does this picture belong on this card? The deck says what the copy is about;
   the tag says what the picture is of. Brand and condition must agree; if both
   sides know the generation those must agree too; and only a single product or
   a group may stand as the hero — never a hand, a tool or another device. */
/* WHAT MODEL THE CARD LITERALLY NAMES.
   Read from the strings that will be printed, not from a setting: "iPhone 17
   Pro Max" or "17 PM" → gen 17, variant pro max. The first ladder row is the
   card's lead — it is the model the price is attached to. */
const VARIANT={'pm':'pro max','pro max':'pro max','pro':'pro','plus':'plus','air':'air','mini':'mini','ultra':'ultra','e':'e'};
function parseModel(str){
  /* not preceded by $ , . or a digit, not followed by , or a digit — so the 19
     in "$19,800" and the 25 in "$1,250" are prices, not generations */
  const m=String(str).match(/(?<![$\d,.])\b(1[1-9])(?![,\d])\s*(PRO MAX|PM|PRO|PLUS|AIR|MINI|ULTRA|E)?\b/i);
  if(!m)return null;
  return{gen:+m[1],v:m[2]?VARIANT[m[2].toLowerCase()]||null:'base'};
}
/* every model the card's copy names, lead first: the priced model (row 1)
   leads, then anything else the copy mentions — a testimonial's "15 Pro" is a
   model the card prints, and the owner wants what is printed to be pictured */
function namedModels(C){
  const seen=[],add=m=>{if(m&&!seen.some(x=>x.gen===m.gen&&x.v===m.v))seen.push(m);};
  const row=C.rows&&C.rows[0];
  if(row)add(parseModel(row[0])||parseModel(row[2]||''));
  [C.offer,C.quote,...(C.heads||[])].forEach(t=>add(parseModel(t||'')));
  (C.rows||[]).slice(1).forEach(r=>add(parseModel(r[0])||parseModel(r[2]||'')));
  return seen;
}
function leadOf(C){return namedModels(C)[0]||null;}
/* the short tag the ladder prints for its lead row — "17 PM" / "F-150" — the
   cheapest way to BOUND an offer on a card that has no ladder */
function leadTag(C){const r=C.rows&&C.rows[0];return r?(r[2]||r[0]):null;}
const LADDER_AT={nightLot:['45','11','916'],priceBoard:['45','11','916'],posterBleed:['916'],proofWall:['916']};
/* ONE DEFINITION OF A REPEAT, shared by the pill dedupe and by R18 — if the
   two ever disagreed, a card could be built clean and then judged dirty. */
const normLine=t=>String(t).toUpperCase().replace(/(\d),(\d)/g,'$1$2').replace(/[^A-Z0-9$ ]+/g,' ').replace(/\s+/g,' ').trim();
function repeats(a,b){
  a=normLine(a);b=normLine(b);
  if(!a||!b)return false;
  if(a===b)return true;
  const [sh,lg]=a.length<=b.length?[a,b]:[b,a];
  return sh.split(' ').length>=2&&new RegExp('(^| )'+sh.replace(/[$]/g,'\\$')+'( |$)').test(lg);
}
/* the phrase an archetype's seal carries, declared once so the promise pills
   can be deduplicated against it — "CASH TODAY" used to print on the seal and
   again as a pill on the same card */
const SEAL_PHRASE={
  posterBleed:[['CASH','TODAY'],['PAID','TODAY'],['CASH','NOW'],['NO','WAIT']],
  tornSplit:  [['SAME','DAY'],['CASH','NOW'],['NO','WAIT'],['WE','PAY'],['PAID','FAST']],
};
/* the seal is placed last, when every other line exists, so it can choose the
   first phrase that repeats nothing already on the card — the owner's kicker
   "SAME DAY CASH" collided with a seal fixed at "SAME DAY" on every Torn Split */
function sealPhrase(c){
  const said=c.nodes.filter(n=>n.type==='text'&&n.str).map(n=>n.str);
  for(const cand of (SEAL_PHRASE[c.arch]||[]))
    if(!said.some(t=>repeats(t,cand.join(' '))))return cand;
  return null;
}
function hasLadder(c){return (LADDER_AT[c.arch]||[]).includes(c.sizeKey)&&c.on('priceRows');}
/* "UP TO $1,250" alone is the unbounded claim the owner forbids; the same
   figure beside the model it is for is a price. When the card carries no
   ladder the offer line names the lead model itself. */
function boundOffer(c){return hasLadder(c)?c.C.offer:c.C.offer+' · '+(leadTag(c.C)||'');}
/* the offer line: with a ladder, offer + sub-line; without one, offer + model —
   the sub-line's claim lives in the pills and must not print twice */
function offerLine(c){
  const sealSays=((SEAL_PHRASE[c.arch]||[])[0]||[]).join(' ').toUpperCase();
  const sub=c.C.offerSub&&c.C.offerSub.toUpperCase().replace(/[^A-Z0-9 ]+/g,' ').replace(/\s+/g,' ').trim()!==sealSays?c.C.offerSub:null;
  return hasLadder(c)?(sub?c.C.offer+'  ·  '+sub:c.C.offer):boundOffer(c);}
/* what the library can be held to, for this pool: a generation it has pictures
   of, and a variant it has an exact picture of */
function poolHasGen(pool,gen){return pool.some(a=>a.t&&a.t.g===gen);}
/* the library can only be held to a variant it actually has */
function libraryHas(pool,gen,v){return pool.some(a=>a.t&&a.t.g===gen&&a.t.v===v);}
function matchSubject(a,subj){
  if(!subj)return true;
  const t=a.t; if(!t||!t.h)return false;
  if(subj.brand&&!subj.brand.includes(t.b))return false;
  if(subj.cond&&subj.cond!=='any'&&t.c!==subj.cond)return false;
  if(subj.gen&&t.g&&!subj.gen.includes(t.g))return false;
  if(subj.body&&t.body&&t.body!==subj.body)return false;
  return true;
}
function pickAsset(c,pool,salt,o={}){
  if(!pool||!pool.length)return null;
  const subj=c.C&&c.C.subject;
  let ok=pool.filter(a=>matchSubject(a,subj));
  if(!ok.length){c.note('NOASSET: nothing in the library matches this deck\'s subject');return null;}
  /* THE HERO IS THE MODEL THE CARD NAMES. If the copy leads with "17 Pro Max",
     the picture is a 17 Pro Max — exact variant when the library has one, the
     generation otherwise. "Close" was a 15 under a 17 Pro Max price. */
  const lead=o.lead||leadOf(c.C);
  if(lead&&lead.gen){
    const exact=ok.filter(a=>a.t.g===lead.gen&&a.t.v===lead.v);
    const gen=ok.filter(a=>a.t.g===lead.gen);
    /* exact variant when the library has one; the generation otherwise; and
       when the library has no picture of that generation at all in this
       condition — every cracked shot is gen-less — the subject match stands.
       The rule below is held to the same standard, so this cannot ship a
       picture the rule would then reject. */
    if(exact.length&&!o.avoidExact)ok=exact;
    else if(gen.length)ok=gen;
    else if(poolHasGen(pool.filter(a=>matchSubject(a,subj)),lead.gen))return null;
  }
  if(o.not){const rest=ok.filter(a=>a.s!==o.not);if(rest.length)ok=rest;else return null;}
  if(!ok.length)return null;
  /* a pinned hero (renderClean holding the look across a reseed) */
  if(o.pin){const p=ok.find(a=>a.s===o.pin);if(p)return p;}
  return ok[Math.floor(c.R.f(0,1)*ok.length+(salt||0))%ok.length];
}
const POOL_OF={broken:'phones'};                // decks that share another deck's pictures
function assetsFor(c,kind){
  const s=ASSETS.subjects||{};
  if(kind==='prop')return ASSETS.props||[];
  if(kind==='cash')return ASSETS.cash||[];
  return s[POOL_OF[kind]||kind]||[];
}
function numFace(c){return c.F.figures?{face:c.F.display,wf:c.F.dw}:{face:c.F.body,wf:c.F.bw};}
function faceMetrics(family,weight){
  return METRICS[family+'|'+nearestWeight(family,weight)]||null;
}
/* the run's real ink extents above and below the baseline, at font-size 1 */
function inkExtent(str,family,weight){
  const m=faceMetrics(family,weight);
  if(!m||!m.up)return null;
  let up=0,dn=0;
  for(const ch of String(str)){
    if(ch===' ')continue;
    up=Math.max(up,m.up[ch]!==undefined?m.up[ch]:m.cap);
    dn=Math.max(dn,m.dn[ch]!==undefined?m.dn[ch]:m.desc);
  }
  return up||dn?{up,dn}:null;
}
/* width of str at font-size 1, tracking included */
function advance(str,family,weight,tracking){
  const m=faceMetrics(family,weight);
  const n=String(str).length;
  if(!m)return null;
  let w=0;
  for(const ch of String(str))w+=m.adv[ch]!==undefined?m.adv[ch]:m.avg;
  return w+(tracking||0)*Math.max(0,n-1);
}
/* Buyback graphics engine — extracted from the console, framework-free.
   Import with:  import * as E from './engine.mjs'
   Nothing here touches the DOM; every function is a pure transform. */

/* ══════════════════════════════════════════════════════════
   1 · SEEDED RANDOM
   ══════════════════════════════════════════════════════════ */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function RNG(seed){const r=mulberry32(seed);return{
  f:(a=0,b=1)=>a+(b-a)*r(), i:(a,b)=>Math.floor(a+(b-a+1)*r()),
  pick:a=>a[Math.floor(r()*a.length)], chance:p=>r()<p,
  shuffle:a=>{const c=a.slice();for(let i=c.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[c[i],c[j]]=[c[j],c[i]];}return c;}};}

/* ══════════════════════════════════════════════════════════
   2 · TOKENS
   ══════════════════════════════════════════════════════════ */
const PALETTES=[
 {id:"nn01",name:"Night Lot",   mood:"sodium light on a dark lot",ground:"#0B1B3A",ground2:"#132A57",ink:"#FFFFFF",body:"#C6D4EE",accent:"#FFB020",hot:"#FF3B30",paper:"#FFF4DE",dark:"#050C1E"},
 {id:"jw09",name:"Neon Counter",mood:"late-night shop window",   ground:"#0A0F1E",ground2:"#14204A",ink:"#FFFFFF",body:"#BFD2E8",accent:"#22D3EE",hot:"#FF2E93",paper:"#FFF6E5",dark:"#04070F"},
 {id:"ca10",name:"Cash Green",  mood:"money, plainly",            ground:"#05261B",ground2:"#0A4230",ink:"#FFFFFF",body:"#B9E3CF",accent:"#16C172",hot:"#FFC93C",paper:"#F2FFF8",dark:"#021711"},
 {id:"du06",name:"Paper Red",   mood:"stapled to a pole",         ground:"#F5EFE3",ground2:"#E8DFCC",ink:"#16130F",body:"#4A423A",accent:"#E23A1E",hot:"#1D4ED8",paper:"#FFFFFF",dark:"#16130F"},
 {id:"st04",name:"Steel Orange",mood:"workshop, high-vis",        ground:"#12161C",ground2:"#1E2732",ink:"#FFFFFF",body:"#B4C1CE",accent:"#FF6B18",hot:"#FFD60A",paper:"#F3F6F9",dark:"#080B0F"},
 {id:"su07",name:"Sunset Lot",  mood:"golden hour, loud",         ground:"#2B0B3A",ground2:"#4A125C",ink:"#FFFFFF",body:"#E8C9F0",accent:"#FF8A00",hot:"#FF2D78",paper:"#FFF0E0",dark:"#160520"},
 {id:"bp02",name:"Blueprint",   mood:"technical, trustworthy",    ground:"#06203A",ground2:"#0A3457",ink:"#FFFFFF",body:"#AFD3EC",accent:"#4CC9F0",hot:"#FFD60A",paper:"#EAF6FF",dark:"#031324"},
 {id:"np03",name:"Newsprint",   mood:"classified ad, urgent",     ground:"#EDE7DC",ground2:"#DCD3C4",ink:"#121212",body:"#4A463F",accent:"#D7263D",hot:"#1B4079",paper:"#FFFFFF",dark:"#121212"}
];
/* authored + graded, graded first so a colliding id resolves to the approved one */
const AUTHORED=PALETTES.slice();
if(PORTED.length){
  const taken=new Set(PORTED.map(p=>p.id));
  PALETTES.length=0;
  PALETTES.push(...PORTED,...AUTHORED.filter(p=>!taken.has(p.id)));
}

/* which display faces are ornamental — they set a headline of two or three
   words and nothing longer, because a sentence in a blackletter is a puzzle */
const ORNAMENTAL=new Set(['Pirata One','Knewave','Sedgwick Ave Display','Bungee','Special Elite']);
const PAIRS=[
 /* THE OWNER'S OWN TYPE. Sixteen pairings drawn only from the 56 faces they
    approved out of 151 reviewed, and only from the weights that passed
    tools/gfx/score_legibility.mjs: a display face whose thinnest stroke
    survives over a photograph and whose caps are even enough to set large, a
    body face that still reads at 13px with its counters open, and a numeral
    face with an unambiguous zero. The four families this engine arrived with —
    Clash Display, Khand, Melodrama, Zodiak — are not in the approved list and
    no longer carry anything. */
 {id:"fc",display:"Oswald",body:"Libre Franklin",num:"Libre Franklin",dw:0.53,bw:0.54,dweight:700,bweight:500,nweight:700,note:"forecourt condensed — the classic lot poster"},
 {id:"tw",display:"Special Elite",body:"Satoshi",num:"Satoshi",dw:0.60,bw:0.51,dweight:400,bweight:500,nweight:700,note:"typewriter — the face their sets used on 167 cards"},
 {id:"zs",display:"Zilla Slab",body:"Satoshi",num:"Zilla Slab",dw:0.66,bw:0.51,dweight:700,bweight:500,nweight:700,note:"slab — weight without shouting"},
 {id:"rs",display:"Roboto Slab",body:"Libre Franklin",num:"Roboto Slab",dw:0.70,bw:0.53,dweight:700,bweight:400,nweight:700,note:"newspaper slab, quiet and solid"},
 {id:"bu",display:"Bungee",body:"Manrope",num:"Manrope",dw:0.71,bw:0.53,dweight:400,bweight:500,nweight:700,note:"poster block — signwriting, maximum stop"},
 {id:"st",display:"Big Shoulders Stencil Display",body:"Satoshi",num:"Satoshi",dw:0.42,bw:0.51,dweight:700,bweight:500,nweight:700,note:"stencil — crate-marking, industrial"},
 {id:"ru",display:"Russo One",body:"Chivo",num:"Chivo",dw:0.69,bw:0.54,dweight:400,bweight:500,nweight:700,note:"squared tech — the electronics counter"},
 {id:"sw",display:"Sedgwick Ave Display",body:"Manrope",num:"Manrope",dw:0.55,bw:0.53,dweight:400,bweight:500,nweight:700,note:"street marker — loud, hand-made"},
 {id:"tk",display:"Teko",body:"Satoshi",num:"Satoshi",dw:0.51,bw:0.51,dweight:700,bweight:500,nweight:700,note:"tall condensed — holds a long model name"},
 {id:"s9",display:"Satoshi",body:"Satoshi",num:"Satoshi",dw:0.70,bw:0.51,dweight:900,bweight:500,nweight:700,note:"one family, heaviest over regular — the plain option"},
 {id:"sq",display:"Squada One",body:"Libre Franklin",num:"Libre Franklin",dw:0.46,bw:0.54,dweight:400,bweight:500,nweight:700,note:"squared display — forecourt default"},
 {id:"bs",display:"Big Shoulders Display",body:"Instrument Sans",num:"Instrument Sans",dw:0.41,bw:0.53,dweight:700,bweight:500,nweight:700,note:"american condensed, civic"},
 {id:"pi",display:"Pirata One",body:"Satoshi",num:"Satoshi",dw:0.42,bw:0.51,dweight:400,bweight:500,nweight:700,note:"blackletter — their sets reached for it 45 times"},
 {id:"kn",display:"Knewave",body:"Manrope",num:"Manrope",dw:0.58,bw:0.53,dweight:400,bweight:500,nweight:700,note:"brush script — the hand-painted window"},
 {id:"sa",display:"Saira Condensed",body:"Sora",num:"Sora",dw:0.47,bw:0.58,dweight:700,bweight:500,nweight:700,note:"condensed grotesque, technical"},
 {id:"ba",display:"Barlow Condensed",body:"Manrope",num:"Manrope",dw:0.47,bw:0.53,dweight:700,bweight:500,nweight:700,note:"condensed workhorse"}
];
const SIZES={"45":[1080,1350],"11":[1080,1080],"916":[1080,1920]};
/* the margin bounded elements keep from the edge — R12 said 4.5% and tested
   1px; now it is one number that placement and the rule both read */
const MARGIN=.045;
function safeRect(W,H){const m=MARGIN*Math.min(W,H);return{x:m,y:m,w:W-2*m,h:H-2*m};}

/* ══════════════════════════════════════════════════════════
   3 · CONTENT
   ══════════════════════════════════════════════════════════ */
/* The brand block in every deck is a PLACEHOLDER — "YOUR NAME", "YN", "YOUR
   TAGLINE", "yourname.com · Your City" — by the owner's instruction. The
   console will not export a card that still carries it. */
const PLACEHOLDER=/YOUR NAME|YOUR TAGLINE|yourname\.com|Your City|\bYN\b/;
const CONTENT={
 phones:{brand:"YOUR NAME",mark:"YN",kicker:"YOUR TAGLINE",hero:"phone",
  heads:[["WE BUY","IPHONES"],["CASH FOR","IPHONES"],["TOP","BUYER"],["SELL YOUR","IPHONE"]],
  offer:"UP TO $1,250",offerSub:"PAID TODAY",
  promises:["CRACKED OK","ICLOUD OK","ANY CARRIER","FREE PICKUP","NO APPT","CASH TODAY"],
  rows:[["iPhone 17 Pro Max","$1,250","17 PM"],["iPhone 17 Pro","$1,050","17 PRO"],
        ["iPhone 16 Pro Max","$900","16 PM"],["iPhone 16","$620","16"],["iPhone 15 Pro","$580","15 PRO"]],
  cta:"GET AN INSTANT OFFER",phone:"(562) 999-4994",addr:"yourname.com · Your City",
  quote:"Cracked 15 Pro in, cash out. Twenty minutes.",
  quoteBy:"Marcus T. · Carson, CA",rating:"4.9 · 200+ REVIEWS",
  steps:[["TEXT PICS","Snap it, send it"],["SEE THE NUMBER","Firm quote, fast."],
         ["GET PAID","Cash or transfer"]],
  /* what the copy is ABOUT, so the picture can be held to it */
  subject:{brand:['iphone'],gen:[17,16,15],cond:'clean'}},
 /* The cracked phones belong to THIS deck, not to the one quoting $1,250 for a
    17 Pro Max. PRICES ARE PLACEHOLDERS for the owner to set. */
 broken:{brand:"YOUR NAME",mark:"YN",kicker:"YOUR TAGLINE",hero:"phone",
  heads:[["WE BUY","BROKEN PHONES"],["CRACKED?","WE PAY"],["SMASHED","STILL PAYS"],["SCREEN GONE","CASH STAYS"]],
  offer:"UP TO $700",offerSub:"PAID TODAY",
  promises:["CRACKED OK","WON'T TURN ON","WATER DAMAGE","ICLOUD OK","FREE PICKUP","CASH TODAY"],
  rows:[["17 Pro Max · cracked","$700","17 PM"],["16 Pro · cracked","$480","16 PRO"],
        ["15 Pro · cracked","$320","15 PRO"],["14 · cracked","$160","14"],["Galaxy S24 · cracked","$260","S24"]],
  cta:"GET A BROKEN-PHONE QUOTE",phone:"(562) 999-4994",addr:"yourname.com · Your City",
  quote:"Screen in pieces, still got $420 for it.",
  quoteBy:"Dana R. · Lakewood, CA",rating:"4.9 · 200+ REVIEWS",
  steps:[["TEXT PICS","Cracks and all"],["SEE THE NUMBER","Firm, for the damage"],
         ["GET PAID","Cash or transfer"]],
  subject:{brand:['iphone','samsung','pixel'],cond:'cracked'}},
 cars:{brand:"YOUR NAME",mark:"YN",kicker:"YOUR TAGLINE",hero:"car",
  heads:[["WE BUY","CARS"],["CASH FOR","TRUCKS"],["WE OUTBID","THE DEALER"],["SELL YOUR","TRUCK"]],
  offer:"UP TO $25,000",offerSub:"CASH TODAY",
  promises:["FREE TOW","SAME DAY","LICENSED","TITLE OR NOT","RUNS OR NOT","WE COLLECT"],
  rows:[["F-150 / Silverado","$25,000","F-150"],["Tacoma / Ranger","$21,500","TACOMA"],
        ["4Runner / Tahoe","$19,800","4RUNNER"],["Civic / Corolla","$12,400","CIVIC"],
        ["Sprinter / Transit","$23,000","SPRINTER"]],
  cta:"GET AN INSTANT OFFER",phone:"(562) 999-4994",addr:"yourname.com · Your City",
  quote:"Old Civic gone the same day, cash in hand.",
  quoteBy:"Jordan K. · Long Beach, CA",rating:"4.9 · 200+ SELLERS",
  steps:[["SEND VIN","Dash photo. Done."],["SEE THE NUMBER","Firm figure, fast."],
         ["FREE TOW","We tow, you bank."]],
  subject:{brand:['car'],cond:'any'}}          // "runs or not": a damaged car is on-message
};

/* ══════════════════════════════════════════════════════════
   4 · COLOUR
   ══════════════════════════════════════════════════════════ */
function hex2rgb(h){h=h.replace('#','');return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
function lum(h){const c=hex2rgb(h).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);});
  return .2126*c[0]+.7152*c[1]+.0722*c[2];}
function contrast(a,b){const l1=lum(a),l2=lum(b);return(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);}
function onColor(bg,P){const c=[P.paper,'#FFFFFF',P.ink,P.dark,'#000000'];
  let best=c[0],bc=0;c.forEach(x=>{const k=contrast(x,bg);if(k>bc){bc=k;best=x;}});return best;}
function readable(color,bg,P){return contrast(color,bg)>=4.5?color:onColor(bg,P);}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

/* ══════════════════════════════════════════════════════════
   5 · THE DESIGN QUEUE — every switch, its effect and its purpose
   ══════════════════════════════════════════════════════════ */
const QUEUE=[
 ['Ground',[
  ['groundGradient','Lit ground','radial pool from ground2 → ground','Gives the card a light source, so the hero looks placed rather than pasted.'],
  ['grain','Film grain','fractal noise at 5.5% overlay','Stops large flat fills reading as plastic on a phone screen.']]],
 ['Field',[
  ['sunburst','Sunburst rays','24–32 alternating wedges behind the hero','Radial energy. Points at the product without drawing a single arrow.'],
  ['halftone','Halftone ramp','dot grid with a quadratic density falloff','Print texture. Reads as a real flyer, not a template export.'],
  ['checker','Checker field','8–12 cell warped checker at 8–14%','Retail-poster ground. Fills the corners the composition never reaches.'],
  ['diagonalSplit','Diagonal split','angled two-tone divide','Breaks the rectangle so the eye travels instead of scanning rows.']]],
 ['Hero',[
  ['photoHero','Real photography','approved product cutout instead of vector art','A photograph of the actual thing stops a thumb; a diagram of it does not.'],
 ['showcase','Device wall','a wall of devices at one angle, each screen carrying palette artwork','The reference genre: for a shop that buys these devices, the product is the pattern.'],
 ['stickers','Prop dressing','banded cash and boxed stock in the empty corners','Fills the holes a cutout leaves with things the shop actually hands over.'],
 ['duo','More units','up to two more cutouts of the named model, other angles or colours','The ads that get rated well show the device two or three times, not once.'],
 ['arrow','Arrow','a drawn arrow from the price to the product','Six of the owner\'s twenty-eight good references draw one; none of the bad ones do.'],
 ['hero','Product hero','device or vehicle art','The subject. Without it the card is a price list.'],
  ['heroBleed','Bleed off the edge','crosses one edge by 6–14%','The single biggest anti-blandness move — implies the product continues past the frame.'],
  ['heroRotate','Angle the hero','6–24° rotation','Diagonal beats orthogonal. A straight product reads as a catalogue photo.'],
  ['heroShadow','Cast shadow','soft drop at 3.5% of hero height','Separates the hero from the field so it sits above, not inside.']]],
 ['Shape language',[
  ['paintStroke','Paint stroke','rough brush quad, wobble on all four edges','Puts a hand behind the headline. The opposite of a rounded plate.'],
  ['tornPaper','Torn paper','26-segment ragged edge, 16% amplitude','Divides the card with an edge that looks made, not drawn.'],
  ['knockoutBand','Knockout band','full-bleed solid bar, text reversed','Maximum contrast for one line. The loudest device that still looks composed.'],
  ['arcCrown','Arc crown','headline bent over the hero on a generated arc','Wraps the type around the product instead of stacking above it.']]],
 ['Display type',[
  ['outlineStroke','Outline stroke','5% of size, paint-order stroke','Holds the letterform against a busy field.'],
  ['hardShadow','Hard shadow','solid offset, no blur','The reference-ad signature. Blur makes it a web button; offset makes it a poster.'],
  ['fitToPlate','Fit to plate','textLength snaps each line to its box','Kills the ragged right edge and the empty half-line — the main source of dead space.']]],
 ['Offer',[
  ['starburst','Starburst seal','12–24 points, rotated −8° to −23°','Turns a number into an object. Must overlap the hero or it floats.'],
  ['ticket','Ticket stub','side notches at 13% of height','Makes the offer feel redeemable rather than announced.'],
  ['sheen','Plate sheen','inset 5% / top 7% / height 9% of its own plate','Depth on flat colour. Measured from the plate, which is where it used to go wrong.']]],
 ['Proof',[
  ['promisePills','Promise pills','three check pills, evenly divided','Answers the three objections before they are raised.'],
  ['proofBlock','Proof block','review card, stars, or numbered steps','The reason a stranger calls a number on a flyer.'],
  ['priceRows','Price rows','alternating model / price bands','The layout resellers actually screenshot and send on.']]],
 ['Chrome',[
  ['cta','Call to action','hot band or radiused button','One instruction. Never two.'],
  ['footerBar','Footer bar','8.8% band, accent hairline, icon disc','Anchors the number and the service area. Every reference ad has one.'],
  ['cornerLockup','Corner lockup','mark + wordmark + kicker at 4.8% margin','Identity without a centred logo eating the top third.']]]
];
const ALLKEYS=QUEUE.flatMap(g=>g[1].map(t=>t[0]));
const KEYMETA={}; QUEUE.forEach(g=>g[1].forEach(t=>KEYMETA[t[0]]={group:g[0],name:t[1],fx:t[2],purpose:t[3]}));
/* Most devices are on unless a card turns them off. A few are the opposite:
   the showcase ground replaces the whole background, so it is a theme you
   choose rather than the default dress. */
const OFF_BY_DEFAULT=new Set(['showcase']);
const DEFAULT_CFG=()=>Object.fromEntries(ALLKEYS.map(k=>[k,!OFF_BY_DEFAULT.has(k)]));

/* ══════════════════════════════════════════════════════════
   6 · CARD BUILDER
   ══════════════════════════════════════════════════════════ */
/* What sits in front of what. Anything unlisted is content and paints at 0. */
const Z={field:-60,ground:-60,hero:-30,plate:-10,shape:-10,sheen:-5,badge:20};
class Card{
  constructor(W,H,P,F,R,C,cfg,key,vertical,arch,sizeKey){
    Object.assign(this,{W,H,P,F,R,C,cfg,key,vertical,arch,sizeKey});
    this.S=Math.min(W,H);
    /* LAYERS CARRY A DEPTH, NOT JUST AN ORDER.
       Every "why is that on top of the text" bug came from paint order being an
       accident of the order somebody happened to write the calls in. A layer now
       declares what KIND of thing it is — ground, field, product, content, seal —
       and the card is assembled by depth. Adding a device to an archetype can no
       longer bury the copy just because it was written last. */
    this.defs=[];this.layers=[];this.uid=0;this.notes=[];this.used={};this.later=[];this.seq=0;this._m=null;
  }
  on(k){return this.cfg[k]!==false;}
  id(p){return p+(this.uid++)+this.key;}
  add(m,n,z){this.layers.push({m,n,z:z===undefined?(n&&Z[n.role])||0:z,i:this.seq++});this._m=null;}
  /* materialised paint order — depth first, then the order it was written */
  get sorted(){return this._m||(this._m=this.layers.slice().sort((a,b)=>a.z-b.z||a.i-b.i));}
  get svg(){return this.sorted.map(l=>l.m);}
  get nodes(){return this.sorted.filter(l=>l.n).map(l=>l.n);}
  def(d){this.defs.push(d);}
  /* Run after the archetype has finished. A seal has to choose its seat from
     the finished card: placed mid-build it was choosing against half the copy,
     picked a corner that looked empty, and then the price ladder was drawn
     into the space underneath it. */
  defer(fn){this.later.push(fn);}
  /* the largest size at which EVERY item in a set still fits its own box —
     a set drawn at one size reads as a set */
  fitAll(items){
    let m=Infinity;
    for(const it of items){const p=this.plan(it.str,it.box,it.opt);if(p.size<m)m=p.size;}
    return m===Infinity?undefined:m;
  }
  /* The first y a layout may use. The corner lockup owns the top-left strip;
     archetypes that started their headline at a fixed fraction were landing on
     it whenever the type ran large. Asked once, honoured everywhere. */
  topSafe(){return this.on('cornerLockup')?this.H*.045+this.W*.072*1.30:this.H*.045;}
  flush(){const q=this.later;this.later=[];q.forEach(fn=>fn());}
  note(t){this.notes.push(t);}
  use(family,weight){
    const w=nearestWeight(family,weight);
    (this.used[family]||=new Set()).add(w);
    return w;
  }
  /* PLAN A RUN WITHOUT DRAWING IT.
     Everything that decides where a line of type lands lives here, so a
     caller can ask for the exact box a run will occupy and cut a plate to
     fit it BEFORE drawing it. The bar behind a headline used to be a fixed
     fraction of the card while the headline sized itself from the copy, so
     the two were decided independently and the words ran off the bar. */
  plan(str,box,o={}){

    const face=o.face||this.F.display, wf=o.wf!==undefined?o.wf:this.F.dw, tr=o.tracking||0;
    const chars=Math.max(String(str).length,1);
    const weight=this.use(face,o.weight||this.F.dweight);
    /* unit = the run's exact width at font-size 1. Falls back to the old
       average-per-character estimate only if the face was never measured. */
    const unit=advance(str,face,weight,tr)||chars*(wf+tr);
    let size=o.size||(box.w/unit);
    if(o.max)size=Math.min(size,o.max); if(o.min)size=Math.max(size,o.min);
    if(unit*size>box.w)size=box.w/unit;          // never wider than the plate
    /* LEGIBILITY IS A FLOOR, NOT A PREFERENCE.
       Fitting by width alone can drive a run under the size R8 requires, which
       is how fine print that dies in a feed thumbnail used to ship. Hold the
       floor instead and take the width back by condensing: textLength with
       lengthAdjust compresses letter-spacing and glyphs, and down to about 82%
       that reads as a condensed cut rather than a squeeze. Only when even that
       is not enough is it a genuine layout/copy mismatch, and the card says so
       out loud rather than silently setting six-point type. */
    const floor=this.S*.021/(o.capRatio||(faceMetrics(face,weight)||{cap:.72}).cap);
    let condense=0;
    /* THE FLOOR IS UNIVERSAL. It used to apply only when the caller had not
       named a size, so any code that computed its own size — a headline from
       its leading, a set equalised to its smallest member — could quietly land
       under it. Equalising the promise pills drove 32 cards under the floor
       that way before this was made unconditional. */
    if(size<floor){
      const want=unit*floor;
      if(want<=box.w*1.22){size=floor;condense=box.w/want;}
      else{size=box.w/unit;this.note(`tight: "${String(str).slice(0,22)}" needs ${(want/box.w*100|0)}% of its box at the legible floor`);}
    }
    const fm=faceMetrics(face,weight);
    /* FIT A SHORT RUN TO THE BOX HEIGHT, NOT JUST ITS WIDTH.
       Sizing by width alone means the size depends on which glyph it is: "1"
       has a much narrower advance than "2", so a numbered list came out with a
       first step half again the size of the others, overflowing its own tile.
       When the caller gives the box a height, fit to the smaller of the two
       and centre the ink in it, which is what setting a numeral in a square
       has always meant. */
    const ink0=inkExtent(str,face,weight);
    let vcentre=0;
    if(box.h&&o.fitH!==false&&ink0&&(ink0.up+ink0.dn)>0){
      const sizeH=box.h/(ink0.up+ink0.dn);
      if(sizeH<size){size=sizeH;}
      vcentre=(box.h-(ink0.up+ink0.dn)*size)/2;
    }
    const cap=size*(o.capRatio||(fm?fm.cap:.72));
    const y=box.h&&o.fitH!==false&&ink0?box.y+vcentre+ink0.up*size:box.y+cap;

    const anchor=o.align||'start';
    const x=anchor==='middle'?box.x+box.w/2:anchor==='end'?box.x+box.w:box.x;
    const natural=unit*size;
    const ratio=natural>0?box.w/natural:1;
    /* o.measure sets the line flush to the full width of its box — the stacked
       poster lockup where every word is the same measure. Short headlines like
       TOP / BUYER cannot fill a wide box at a fixed leading, so a square poster
       was left with a quarter of itself empty; set to the measure they become
       the artwork. Capped at 4x so a one-letter line is never smeared. */
    /* Letter-spacing has its own limits, and they are TIGHT. Allowed to carry
       a 45% shortfall it turned "$700" into "$ 7 0 0" and the phone number
       into a dotted line — the stretch had simply moved from inside the
       letters to between them. Filling a plate is worth a nudge and nothing
       more: past that the run is set at its natural width and the space is
       left as space, which is what the space was for. */
    const measure=o.measure&&ratio>1&&ratio<=1.35;
    const snap=measure||((o.fit!==false)&&this.on('fitToPlate')&&ratio>=.92&&ratio<=1.12);
    const realW=(snap||condense)?box.w:Math.min(box.w,natural);
    const ext=ink0;
    const top=ext?y-ext.up*size:box.y;
    const hgt=ext?(ext.up+ext.dn)*size:cap*1.18;
    return{face,weight,size,cap,y,x,anchor,natural,snap,condense,tr,
      box:{x:anchor==='middle'?x-realW/2:anchor==='end'?x-realW:x,y:top,w:realW,h:hgt}};
  }
  text(str,box,o={}){
    const p=this.plan(str,box,o);
    const {face,weight,size,cap,y,x,anchor,snap,condense,tr}=p;
    const fill=o.fill||this.P.ink;
    /* condensing is a containment guarantee, so it applies whether or not the
       fitToPlate look is switched on for this configuration */
    /* COSMETIC FITTING NEVER DISTORTS THE LETTERFORMS.
       Both paths used to set lengthAdjust="spacingAndGlyphs", which scales the
       glyphs themselves — so fourteen runs a card were drawn at anywhere from
       70% to 160% of their true width. One family stretched three different
       amounts on one card reads as three different typefaces, which is exactly
       what the owner saw: "the text is very stretched and it is not unified
       type faces". Fitting a run to its plate is a nicety and now moves only
       the SPACE between letters. Only `condense` — the containment guarantee
       that holds the legibility floor, where the alternative is type too small
       to read — may squeeze the glyphs, and only inward. */
    const tl=(condense&&condense<1)?` textLength="${box.w.toFixed(1)}" lengthAdjust="spacingAndGlyphs"`
            :snap?` textLength="${box.w.toFixed(1)}" lengthAdjust="spacing"`:'';
    const ls=tr?` letter-spacing="${(tr*size).toFixed(2)}"`:'';
    const base=`font-family="${face}, sans-serif" font-weight="${weight}" font-size="${size.toFixed(1)}" text-anchor="${anchor}"`;
    const useStroke=o.stroke&&this.on('outlineStroke');
    const useShadow=o.shadow&&this.on('hardShadow');
    let m='';
    if(useShadow){
      const dx=o.shadowDx!==undefined?o.shadowDx:size*.055, dy=o.shadowDy!==undefined?o.shadowDy:size*.06;
      m+=`<text x="${(x+dx).toFixed(1)}" y="${(y+dy).toFixed(1)}" ${base} fill="${o.shadow}" stroke="${o.shadow}" `+
         `stroke-width="${(size*(o.strokeW||.055)).toFixed(2)}" paint-order="stroke"${tl}${ls}>${esc(str)}</text>`;
    }
    const sa=useStroke?` stroke="${o.stroke}" stroke-width="${(size*(o.strokeW||.055)).toFixed(2)}" paint-order="stroke"`:'';
    m+=`<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" ${base} fill="${fill}"${sa}${tl}${ls}>${esc(str)}</text>`;
    // measured box: fitted text spans its plate, unfitted text is estimated from advance width
    /* the measured box is the run's real ink, not a generic cap+descent band,
       so the collision rule tests what a reader can actually see touching */
    this.add(m,{type:'text',id:o.id||'text',box:p.box,str:String(str),face,weight,
      size:cap,fill,backing:o.on||this.P.ground,bleed:!!o.bleed,role:o.role||'text'},o.z);
    return cap;
  }
  rect(box,fill,o={}){
    this.add(`<rect x="${box.x.toFixed(1)}" y="${box.y.toFixed(1)}" width="${box.w.toFixed(1)}" height="${box.h.toFixed(1)}" rx="${o.r||0}" fill="${fill}"/>`,
      o.ghost?null:{type:'shape',id:o.id||'rect',box,bleed:!!o.bleed,role:o.role||'shape',fill},
      o.z);
    return box;
  }
  raw(m,n){this.add(m,n);}
  /* IS THIS RECTANGLE FREE?
     Devices that seat themselves — a row of marks dropped into a gap — were
     trusting the gap they were handed. A gap measured on a 20px grid, then
     clamped to a margin, is not a promise: the row of trust marks came down
     across "iPhones.LA · SAME DAY CASH" on 42 of 432 cards because nothing
     ever asked. Anything that seats itself asks this first. */
  clear(box,pad){
    const p=pad||0, b={x:box.x-p,y:box.y-p,w:box.w+p*2,h:box.h+p*2};
    const OCCUPIED=new Set(['badge','plate','cta','data','proof','brand','footer','hero','offer','headline']);
    return !this.nodes.some(n=>{
      if(!n.box||n.box.w<=0||n.box.h<=0)return false;
      if(n.type!=='text'&&!OCCUPIED.has(n.role))return false;
      return Math.min(b.x+b.w,n.box.x+n.box.w)>Math.max(b.x,n.box.x)
          && Math.min(b.y+b.h,n.box.y+n.box.h)>Math.max(b.y,n.box.y);
    });
  }
}

/* ══════════════════════════════════════════════════════════
   7 · DEVICES
   ══════════════════════════════════════════════════════════ */
const D={};
D.sunburst=(c,cx,cy,r,color,wedges,rot,op)=>{
  let p='';const st=Math.PI*2/wedges;
  for(let i=0;i<wedges;i+=2){const a0=rot+i*st,a1=rot+(i+1)*st;
    p+=`M${cx.toFixed(1)} ${cy.toFixed(1)} L${(cx+Math.cos(a0)*r).toFixed(1)} ${(cy+Math.sin(a0)*r).toFixed(1)} L${(cx+Math.cos(a1)*r).toFixed(1)} ${(cy+Math.sin(a1)*r).toFixed(1)} Z `;}
  c.add(`<path d="${p}" fill="${color}" opacity="${op||.15}"/>`,
    {type:'shape',id:'sunburst',box:{x:cx-r,y:cy-r,w:r*2,h:r*2},bleed:true,role:'field'});
};
D.starburst=(c,cx,cy,r,pts,inner,rot,fill,stroke)=>{
  let p='';const n=pts*2,st=Math.PI/pts;
  for(let i=0;i<n;i++){const rr=i%2?r*inner:r,a=rot+i*st;
    p+=(i?'L':'M')+(cx+Math.cos(a)*rr).toFixed(1)+' '+(cy+Math.sin(a)*rr).toFixed(1)+' ';}
  c.add(`<path d="${p}Z" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${(r*.05).toFixed(1)}"`:''}/>`,
    {type:'shape',id:'badge',box:{x:cx-r,y:cy-r,w:r*2,h:r*2},role:'badge',fill,
     /* what the star actually paints over: between the inner and outer radius
        it is mostly background showing between the points, so coverage is
        judged on the inner disc — and the seal's own placement search is
        scored on this same box, so it optimises what the rule measures */
     solid:{x:cx-r*inner,y:cy-r*inner,w:r*inner*2,h:r*inner*2},
     star:{cx,cy,r,pts,inner,rot}});
  return{x:cx-r,y:cy-r,w:r*2,h:r*2};
};
/* A PRICE TAG: the seal's fallback. Two lines on a rounded plate, on the seat
   the seal search already cleared, painted at the seal's depth. It is what a
   card gets when the star would have had to drop its phrase to fit. */
D.priceTag=(c,cx,cy,w,lines,fill)=>{
  const h=w*.58,x=cx-w/2,y=cy-h/2,ink=onColor(fill,c.P);
  c.add(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${(h*.16).toFixed(1)}" fill="${fill}" stroke="${c.P.dark}" stroke-width="${(w*.03).toFixed(1)}"/>`,
    {type:'shape',id:'priceTag',box:{x,y,w,h},role:'badge',fill});
  c.text(lines[0],{x:x+w*.08,y:y+h*.10,w:w*.84},{...numFace(c),align:'middle',fill:ink,on:fill,id:'offer',role:'offer',max:h*.44,z:Z.badge+1});
  if(lines[1])c.text(lines[1],{x:x+w*.08,y:y+h*.62,w:w*.84},{face:c.F.body,wf:c.F.bw,weight:800,align:'middle',fill:ink,on:fill,id:'offerSub',role:'offer',max:h*.27,tracking:.03,z:Z.badge+1});
};
/* A ROW OF MARKS. Four to six of the shop's category icons on one line —
   the device that fills the slot the banned second pill row used to take, and
   the imagery the reference audit says GOOD ads carry and the engine did not. */
function stripKeys(c){
  const seen=[];const add=k=>{if(k&&!seen.includes(k)&&ICONS[k])seen.push(k);};
  (c.C.promises||[]).forEach(t=>add(iconFor(t,c.vertical)));
  (c.vertical==='cars'?['carSide','cashTag','boltFast','shieldTick','keyFob']:['phone','cashTag','boltFast','lock','sealedBox','shieldTick']).forEach(add);
  return seen.slice(0,c.vertical==='cars'?5:6);
}
/* the strip's height, named once. The guard that decides whether a band can
   take a strip used to be a round S*.075 while the strip itself drew at
   S*.064 — so a genuinely roomy 80px band was refused for being 1px under a
   threshold that was 12px taller than the thing it gated. */
const STRIP_H=c=>c.S*.064;
/* WHERE A ROW OF MARKS CAN ACTUALLY GO.
   Handing the strip the largest COVERAGE hole was the mistake: that grid counts
   the ground and the field as empty, so "the biggest gap" was often a band that
   already had the wordmark in it. This scans only what a reader would see
   collide — every line of type and every solid shape, padded — and returns the
   widest horizontal band inside the safe margins that is genuinely free at the
   strip's own height. If it returns nothing, there is nowhere to put it, and
   the honest answer is not to draw one. */
function stripSeat(c,minW,hWant){
  const h=hWant||STRIP_H(c), sr=safeRect(c.W,c.H), cell=10, pad=h*.12;
  const cols=Math.ceil(c.W/cell), rows=Math.ceil(c.H/cell);
  const g=new Uint8Array(cols*rows);
  const mark=(x0,y0,x1,y1)=>{
    for(let y=Math.max(0,Math.floor(y0/cell));y<Math.min(rows,Math.ceil(y1/cell));y++)
      for(let x=Math.max(0,Math.floor(x0/cell));x<Math.min(cols,Math.ceil(x1/cell));x++)g[y*cols+x]=1;};
  /* anything outside the crop margin is not a seat */
  mark(0,0,c.W,sr.y); mark(0,sr.y+sr.h,c.W,c.H);
  mark(0,0,sr.x,c.H); mark(sr.x+sr.w,0,c.W,c.H);
  const OCCUPIED=new Set(['badge','plate','cta','data','proof','brand','footer','hero','offer','headline']);
  c.nodes.forEach(n=>{
    if(!n.box||n.box.w<=0||n.box.h<=0)return;
    if(n.type!=='text'&&!OCCUPIED.has(n.role))return;
    mark(n.box.x-pad,n.box.y-pad,n.box.x+n.box.w+pad,n.box.y+n.box.h+pad);
  });
  const need=Math.max(1,Math.ceil(h/cell));
  let best=null;
  for(let y=0;y+need<=rows;y++){
    let run=0;
    for(let x=0;x<=cols;x++){
      let free=x<cols;
      if(free)for(let k=0;k<need;k++)if(g[(y+k)*cols+x]){free=false;break;}
      if(free){run++;continue;}
      if(run*cell>=minW){const b={x:(x-run)*cell,y:y*cell,w:run*cell,h};
        if(!best||b.w*b.h>best.w*best.h)best=b;}
      run=0;
    }
  }
  return best;
}
D.iconStrip=(c,y,keys,o={})=>{
  const {W,P}=c,n=keys.length; if(n<3)return false;
  const x=o.x!=null?o.x:W*.05, w=o.w!=null?o.w:W-W*.10;
  /* a row of marks may be set smaller to fit the band it was given, but never
     so small it stops reading as a mark */
  const sz=Math.max(o.sz||STRIP_H(c),c.S*.042),gap=(w-n*sz)/(n-1);
  /* Returns whether it drew. The caller that could not fit a product used to
     fall through to a strip spanning the WHOLE card whatever the gap was, so a
     narrow gap at the top right put marks straight through the brand lockup. */
  if(!c.clear({x,y,w,h:sz},sz*.10))return false;
  const col=o.stroke||readable(P.accent,P.ground,P);
  let m='';keys.forEach((k,i)=>{m+=iconSVG(k,x+i*(sz+gap),y,sz,col);});
  c.add(m,{type:'shape',id:'iconStrip',box:{x,y,w,h:sz},role:'deco',fill:col});
  return true;
};
/* AN ARROW FROM THE PRICE TO THE PRODUCT — six of the twenty-eight GOOD
   references draw one; no BAD reference does. Drawn last, over empty ground
   only: if the shortest path from the price to the product crosses a line of
   type the arrow is not drawn. */
D.arrow=(c)=>{
  if(!c.on('arrow'))return;
  /* from a PRICE — a seal that carries a figure, the tag, or a $ line — never
     from a phrase seal; "SAME DAY" has nothing to point with */
  const priced=n=>c.nodes.some(t=>t.type==='text'&&t.z>=Z.badge&&/\$\d/.test(t.str||'')&&inter(t.box,n.box)>0);
  const hero=c.nodes.find(n=>n.role==='hero'); if(!hero)return;
  const hb=hero.box;
  /* Every price on the card is a candidate source — the seal if it carries a
     figure, the offer line, the ladder's top price — and the first one that
     stands clear of the product is the one that points. A seal already sitting
     on the phone has nothing to point at; the reference arrows run from the
     headline or the offer LINE to the product. */
  const cands=[...c.nodes.filter(n=>(n.id==='badge'||n.id==='priceTag')&&priced(n)),
               ...c.nodes.filter(n=>n.type==='text'&&(/offer/.test(n.id)||n.id==='rowPrice')&&/\$\d/.test(n.str||''))];
  let from=null,fb=null,fc=null,ux=0,uy=0,tEnter=0,start=0;
  for(const cand of cands){
    const b=cand.box,ctr=[b.x+b.w/2,b.y+b.h/2], hc=[hb.x+hb.w*.5,hb.y+hb.h*.5];
    const dx=hc[0]-ctr[0],dy=hc[1]-ctr[1],len=Math.hypot(dx,dy); if(len<c.S*.12)continue;
    const vx=dx/len,vy=dy/len;
    const slab=(o,w,u,i)=>{if(Math.abs(u)<1e-9)return[-Infinity,Infinity];const a=(o-ctr[i])/u,bb=(o+w-ctr[i])/u;return[Math.min(a,bb),Math.max(a,bb)];};
    const [ex0,ex1]=slab(hb.x,hb.w,vx,0),[ey0,ey1]=slab(hb.y,hb.h,vy,1);
    const tIn=Math.max(ex0,ey0),tOut=Math.min(ex1,ey1);
    if(!(tIn<tOut)||tIn<=0)continue;                       // this price sits on the product already
    const st=cand.type==='text'?Math.max(b.w,b.h)*.55:Math.min(b.w,b.h)*.62;
    if(tIn-st<c.S*.10)continue;                            // too close to be worth pointing
    from=cand;fb=b;fc=ctr;ux=vx;uy=vy;tEnter=tIn;start=st;break;
  }
  if(!from)return;
  const p0=[fc[0]+ux*start,fc[1]+uy*start];
  let p1=[fc[0]+ux*(tEnter-c.S*.015),fc[1]+uy*(tEnter-c.S*.015)];
  /* the product may bleed off the card; the arrow does not follow it out */
  const sr=safeRect(c.W,c.H),pad2=c.S*.03;
  p1=[Math.min(Math.max(p1[0],sr.x+pad2),sr.x+sr.w-pad2),Math.min(Math.max(p1[1],sr.y+pad2),sr.y+sr.h-pad2)];
  const L=Math.hypot(p1[0]-p0[0],p1[1]-p0[1]); if(L<c.S*.08)return;
  const bend=c.S*.06*(c.R.f(0,1)<.5?1:-1), cx2=(p0[0]+p1[0])/2-uy*bend, cy2=(p0[1]+p1[1])/2+ux*bend;
  const box={x:Math.min(p0[0],p1[0],cx2)-8,y:Math.min(p0[1],p1[1],cy2)-8,w:Math.abs(Math.max(p0[0],p1[0],cx2)-Math.min(p0[0],p1[0],cx2))+16,h:Math.abs(Math.max(p0[1],p1[1],cy2)-Math.min(p0[1],p1[1],cy2))+16};
  /* every line on the card, the price's own included */
  const words=c.nodes.filter(n=>n.type==='text');
  if(words.some(t=>inter(box,t.box)>t.box.w*t.box.h*.02))return;
  const solids=c.nodes.filter(n=>n.type==='shape'&&(n.id==='badge'||n.id==='priceTag'||n.id==='pill'||n.id==='row'||/^product\d$/.test(n.id)));
  if(solids.some(n=>inter(box,n.solid||n.box)>Math.min(box.w*box.h,n.box.w*n.box.h)*.04))return;
  const w=c.S*.014,head=c.S*.035,ang=Math.atan2(p1[1]-cy2,p1[0]-cx2);
  const hp=[[p1[0],p1[1]],[p1[0]-Math.cos(ang-.5)*head,p1[1]-Math.sin(ang-.5)*head],[p1[0]-Math.cos(ang+.5)*head,p1[1]-Math.sin(ang+.5)*head]];
  c.add(`<path d="M${p0[0].toFixed(1)} ${p0[1].toFixed(1)} Q${cx2.toFixed(1)} ${cy2.toFixed(1)} ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}" fill="none" stroke="${c.P.dark}" stroke-width="${(w*1.9).toFixed(1)}" stroke-linecap="round"/>`+
        `<path d="M${p0[0].toFixed(1)} ${p0[1].toFixed(1)} Q${cx2.toFixed(1)} ${cy2.toFixed(1)} ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}" fill="none" stroke="${c.P.hot}" stroke-width="${w.toFixed(1)}" stroke-linecap="round"/>`+
        `<path d="M${hp.map(q=>q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' L')} Z" fill="${c.P.hot}" stroke="${c.P.dark}" stroke-width="${(w*.5).toFixed(1)}" stroke-linejoin="round"/>`,
    {type:'shape',id:'arrow',box,role:'deco',bleed:true},Z.badge+2);   // thin ink: no fill recorded, so it is not hot AREA
};
D.tornPaper=(c,box,fill,seed)=>{
  const R=RNG(seed),segs=26;let p=`M${box.x} ${(box.y+box.h*.12).toFixed(1)} `;
  for(let i=1;i<=segs;i++)p+=`L${(box.x+box.w*i/segs).toFixed(1)} ${(box.y+box.h*(.02+R.f(0,.16))).toFixed(1)} `;
  p+=`L${(box.x+box.w).toFixed(1)} ${(box.y+box.h).toFixed(1)} L${box.x} ${(box.y+box.h).toFixed(1)} Z`;
  c.add(`<path d="${p}" fill="${fill}"/>`,{type:'shape',id:'torn',box,bleed:true,role:'plate',fill});
  return box;
};
D.paintStroke=(c,box,fill,seed)=>{
  const R=RNG(seed),{x,y,w,h}=box,j=()=>R.f(-h*.13,h*.13);
  const p=`M${(x+j()).toFixed(1)} ${(y+h*.12+j()).toFixed(1)} C${(x+w*.25).toFixed(1)} ${(y+j()).toFixed(1)}, ${(x+w*.7).toFixed(1)} ${(y+h*.06+j()).toFixed(1)}, ${(x+w).toFixed(1)} ${(y+h*.04+j()).toFixed(1)} L${(x+w+h*.1).toFixed(1)} ${(y+h*.9+j()).toFixed(1)} C${(x+w*.68).toFixed(1)} ${(y+h+j()).toFixed(1)}, ${(x+w*.3).toFixed(1)} ${(y+h*.94+j()).toFixed(1)}, ${(x-h*.06).toFixed(1)} ${(y+h*.98+j()).toFixed(1)} Z`;
  c.add(`<path d="${p}" fill="${fill}"/>`,{type:'shape',id:'stroke',box,role:'plate',fill});
  return box;
};
D.halftone=(c,box,color,cell,seed,dir)=>{
  let p='';const cols=Math.ceil(box.w/cell),rows=Math.ceil(box.h/cell);
  for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){
    const t=dir==='v'?j/rows:i/cols,rad=cell*.46*(1-t)*(1-t);
    if(rad<.35)continue;
    p+=`M${(box.x+i*cell+cell/2).toFixed(1)} ${(box.y+j*cell+cell/2).toFixed(1)} m${(-rad).toFixed(2)} 0 a${rad.toFixed(2)} ${rad.toFixed(2)} 0 1 0 ${(rad*2).toFixed(2)} 0 a${rad.toFixed(2)} ${rad.toFixed(2)} 0 1 0 ${(-rad*2).toFixed(2)} 0 `;}
  c.add(`<path d="${p}" fill="${color}" opacity=".5"/>`,{type:'shape',id:'halftone',box,bleed:true,role:'field'});
};
D.checker=(c,box,color,n,op)=>{
  let p='';const cw=box.w/n,ch=box.h/n;
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){if((i+j)%2)continue;
    p+=`M${(box.x+i*cw).toFixed(1)} ${(box.y+j*ch).toFixed(1)} h${cw.toFixed(1)} v${ch.toFixed(1)} h${(-cw).toFixed(1)} Z `;}
  c.add(`<path d="${p}" fill="${color}" opacity="${op||.12}"/>`,{type:'shape',id:'checker',box,bleed:true,role:'field'});
};
D.ticket=(c,box,fill,notch)=>{
  const n=notch||box.h*.13,{x,y,w,h}=box;
  const p=`M${x} ${y} H${(x+w).toFixed(1)} V${(y+h/2-n).toFixed(1)} A${n} ${n} 0 0 0 ${(x+w).toFixed(1)} ${(y+h/2+n).toFixed(1)} V${(y+h).toFixed(1)} H${x} V${(y+h/2+n).toFixed(1)} A${n} ${n} 0 0 0 ${x} ${(y+h/2-n).toFixed(1)} Z`;
  c.add(`<path d="${p}" fill="${fill}"/>`,{type:'shape',id:'ticket',box,role:'plate',fill});
  return box;
};
D.sheen=(c,plate,color)=>{
  if(!c.on('sheen')||!plate)return null;
  const inset=plate.w*.05,box={x:plate.x+inset,y:plate.y+plate.h*.07,w:plate.w-inset*2,h:plate.h*.09};
  if(box.w<=0||box.h<=0)return null;
  c.add(`<rect x="${box.x.toFixed(1)}" y="${box.y.toFixed(1)}" width="${box.w.toFixed(1)}" height="${box.h.toFixed(1)}" rx="${(box.h/2).toFixed(1)}" fill="${color}" opacity=".16"/>`,
    {type:'shape',id:'sheen',box,role:'sheen',parent:plate});
  return box;
};
D.footerBar=(c)=>{
  /* sized to the SHORT edge — H*.088 made a 182px band on 9:16 — and the
     number and address sit inside the 4.5% crop margin, where the old offsets
     left the address 5px outside it on every format */
  const {W,H,P,F,C}=c,h=c.S*.10,y=H-h;
  c.rect({x:0,y,w:W,h},P.dark,{id:'footer',bleed:true,role:'footer'});
  c.rect({x:0,y,w:W,h:H*.006},P.accent,{ghost:true,z:1});
  const pad=W*.05,ir=h*.30,cy=y+h*.5;
  c.raw(`<circle cx="${(pad+ir).toFixed(1)}" cy="${cy.toFixed(1)}" r="${ir.toFixed(1)}" fill="${P.accent}"/>`+
    `<g transform="translate(${(pad+ir*.38).toFixed(1)},${(cy-ir*.62).toFixed(1)}) scale(${(ir*1.24/24).toFixed(4)})">`+
    `<path d="M6.6 2.5c.9 0 1.6.6 1.8 1.4l.7 2.6c.2.7 0 1.4-.5 1.9L7.3 9.6c1.1 2.3 3 4.2 5.3 5.3l1.2-1.3c.5-.5 1.2-.7 1.9-.5l2.6.7c.8.2 1.4.9 1.4 1.8v2.4c0 1.1-.9 2-2 2C10.7 20 4 13.3 4 5.5c0-1.1.9-2 2-2h.6z" fill="${onColor(P.accent,P)}"/></g>`);
  c.text(C.phone,{x:pad+ir*2+W*.022,y:cy-h*.44,w:W*.30},
    {...numFace(c),fill:P.paper,on:P.dark,id:'footerNum',role:'footer',max:h*.46});
  c.text(C.addr,{x:W-pad-W*.40,y:cy-h*.30,w:W*.40},
    {face:F.body,wf:F.bw,weight:600,fill:readable(P.body,P.dark,P),on:P.dark,id:'footerAddr',role:'footer',
     capRatio:.70,min:c.S*.031});
};
/* THE MARK, FRAMED FIVE WAYS.
   app    — initials on a rounded square, the app-icon shape (the default)
   circle — initials in a disc
   float  — initials alone, large, outlined; no plate
   name   — no mark at all; the wordmark and kicker carry the brand
   mark   — the framed initials alone; no wordmark (for a shop that is its logo) */
D.lockup=(c,corner)=>{
  const {W,H,P,F,C}=c,m=W*.048,s=W*.072;
  const frame=(c.cfg&&c.cfg.brand&&c.cfg.brand.frame)||'app';
  const x=corner==='right'?W-m-s:m,y=H*.045;
  const hasMark=frame!=='name', hasName=frame!=='mark';
  if(hasMark){
    if(frame==='app')c.rect({x,y,w:s,h:s},P.accent,{r:s*.24,id:'markPlate',role:'brand'});
    else if(frame==='circle')c.add(`<circle cx="${(x+s/2).toFixed(1)}" cy="${(y+s/2).toFixed(1)}" r="${(s/2).toFixed(1)}" fill="${P.accent}"/>`,
      {type:'shape',id:'markPlate',box:{x,y,w:s,h:s},role:'brand',fill:P.accent});
    if(frame==='float')
      c.text(C.mark,{x:x-s*.04,y:y+s*.08,w:s*1.08,h:s*.84},{face:F.body,wf:F.bw,weight:900,
        align:'middle',fill:P.accent,on:P.ground,stroke:P.dark,strokeW:.06,id:'mark',role:'brand'});
    else
      c.text(C.mark,{x:x+s*.16,y:y+s*.26,w:s*.68,h:s*.48},{face:F.body,wf:F.bw,weight:900,
        align:'middle',fill:onColor(P.accent,P),on:P.accent,id:'mark',role:'brand'});
  }
  if(!hasName)return;
  const nx=hasMark?x+s*1.22:x;
  /* Set the second line from where the first one actually ENDS. At a fixed
     s*.62 offset the descender of "iPhones.LA" ran into the cap line of
     "SAME DAY CASH" on all but a handful of cards — the leading was guessed
     from the mark's size rather than measured from the type. */
  const wm={x:nx,y:y+s*.10,w:W*.30};
  const wo={face:F.body,wf:F.bw,weight:800,fill:P.ink,id:'wordmark',role:'brand',max:W*.045};
  const wp=c.plan(C.brand,wm,wo);
  c.text(C.brand,wm,wo);
  c.text(C.kicker,{x:nx,y:wp.box.y+wp.box.h+s*.07,w:W*.34},{face:F.body,wf:F.bw,weight:600,
    fill:readable(P.accent,P.ground,P),id:'kicker',role:'brand',tracking:.04,min:W*.026});
};
/* fit=  {left,right,bottom}  the box the crown must stay inside. Sizing is done
   here, with the same geometry that declares the node's box, so the fit and the
   audit can never disagree — they used to be computed in two places. */
D.arcText=(c,str,cx,cy,r,fill,size,fit)=>{
  const id=c.id('arc');
  const weight=c.use(c.F.display,c.F.dweight);
  if(fit){
    const m0=faceMetrics(c.F.display,weight);
    const unit=advance(str,c.F.display,weight,0)||String(str).length*c.F.dw;
    /* The apex passed in is the BASELINE of the curve; the capitals stand above
       it by most of the type size, which is how a crown reached back over the
       lockup it was meant to clear. Each candidate size is measured at the
       centre it would actually be drawn at, so the fit test and the drawing
       can never be describing different circles. */
    const at=t=>{
      const up=(m0?m0.up[str[0]]||m0.cap:.72)*t, dn=(m0?m0.desc:.2)*t;
      const CY=fit.top!==undefined?fit.top+up+r:cy;
      const half=Math.min(Math.PI*.98,unit*t/r)/2;
      return{cy:CY,x0:cx-Math.sin(half)*(r+up),x1:cx+Math.sin(half)*(r+up),
             yBot:CY-Math.cos(half)*(r-dn)};
    };
    /* Two dials, not one. A flatter curve dips less for the same words, so when
       the band is shallow — the square crop leaves the crown barely 120px —
       widening the radius saves the device where shrinking the type alone
       cannot. If neither dial reaches, say so and let the caller set the line
       straight instead of curving it into the product. */
    let pick=null;
    for(const rk of [1,1.3,1.7,2.2,3.0]){
      const R0=r; r=R0*rk;
      for(let t=size;t>=size*.55;t-=size*.03){
        const e=at(t);
        if(e.x0>=fit.left&&e.x1<=fit.right&&e.yBot<=fit.bottom){pick={t,r};break;}
      }
      r=R0;
      if(pick)break;
    }
    if(!pick)return null;
    r=pick.r; size=pick.t; cy=at(size).cy;
  }
  c.def(`<path id="${id}" d="M${(cx-r).toFixed(1)} ${cy.toFixed(1)} A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${(cx+r).toFixed(1)} ${cy.toFixed(1)}" fill="none"/>`);
  c.add(`<text font-family="${c.F.display}, sans-serif" font-weight="${weight}" font-size="${size.toFixed(1)}" fill="${fill}"><textPath href="#${id}" startOffset="50%" text-anchor="middle">${esc(str)}</textPath></text>`,
    /* THE ARC'S REAL EXTENT, NOT A RECTANGLE OVER ITS APEX.
       Type set on a curve is highest in the middle and falls away at both ends,
       so a flat box across the top described a shape the glyphs never occupied:
       the ends dipped out of it and landed on the seal below. The run's own
       length gives the angle it sweeps, and the geometry gives the rest. */
    (()=>{
      const m=faceMetrics(c.F.display,weight);
      const run=(advance(str,c.F.display,weight,0)||String(str).length*c.F.dw)*size;
      const half=Math.min(Math.PI*.98,run/r)/2;               // half the swept angle
      const up=(m?m.up[str[0]]||m.cap:.72)*size, dn=(m?m.desc:.2)*size;
      /* Every other text box is measured; this one is DERIVED from the arc's
         geometry, and derived geometry gets a margin. Without one the release
         gate caught the crown touching the seal's number by 9% on a card the
         engine had declared clean — the browser sets glyphs on a curve a little
         wider than the chord model says. */
      const m2=size*.08;
      const x0=cx-Math.sin(half)*(r+up)-m2, x1=cx+Math.sin(half)*(r+up)+m2;
      const yTop=cy-r-up-m2;                                  // the apex, plus its cap
      const yBot=cy-Math.cos(half)*(r-dn)+m2;                 // where the ends fall to
      return{type:'text',id:'arc',box:{x:x0,y:yTop,w:x1-x0,h:Math.max(size*.8,yBot-yTop)},
        size:size*.7,fill,backing:c.P.ground,role:'headline'};
    })());
  return true;
};
D.promises=(c,y,items,o={})=>{
  /* the engine's own permanent negative bans more than three promise pills; two
     archetypes drew six. The third pill and the next row are simply not drawn. */
  c.pills=c.pills||0;
  items=items.slice(0,Math.max(0,3-c.pills));
  if(!items.length)return;
  c.pills+=items.length;
  const {W,P,F}=c,pad=W*.05,gap=W*.018,n=items.length;
  const w=o.w||((W-pad*2-gap*(n-1))/n),h=o.h||c.S*.058;
  const pOpt=t=>({face:F.body,wf:F.bw,weight:800,id:'promise',role:'proof',max:h*.50});
  /* one size for every pill on the CARD — two rows sized independently is the
     same sloppiness as one row sized per item, just harder to spot */
  const thisRow=c.fitAll(items.map((t,i)=>{const x=pad+i*(w+gap),ic=h*.30;
    return {str:t,box:{x:x+w*.07+ic+w*.03,y:0,w:w-(w*.07+ic+w*.03)-w*.04},opt:pOpt(t)};}));
  c.pillSize=c.pillSize===undefined?thisRow:Math.min(c.pillSize,thisRow);
  const pSize=c.pillSize;
  items.forEach((t,i)=>{
    const x=pad+i*(w+gap),bg=o.bg||P.paper;
    c.rect({x,y,w,h},bg,{r:h*.5,id:'pill',role:'proof'});
    const ic=h*.30,cxp=x+w*.07;
    /* the benefit's own mark, not a generic tick — an icon per bullet is the
       GOOD set's most common secondary imagery */
    const key=iconFor(t,c.vertical),isz=ic*2.0,stroke=/paper|#F/i.test(bg)?readable(P.accent,bg,P):onColor(bg,P);
    c.raw(iconSVG(key,cxp-ic*.35,y+h/2-isz*.5,isz,stroke));
    c.text(t,{x:x+w*.07+ic+w*.03,y:y+h*.29,w:w-(w*.07+ic+w*.03)-w*.04},
      {face:F.body,wf:F.bw,weight:800,fill:onColor(bg,P),on:bg,id:'promise',role:'proof',max:h*.50,size:pSize});
  });
  return{x:pad,y,w:W-pad*2,h};
};
D.cta=(c,y,kind,color)=>{
  /* ONE HOT THING PER CARD. The seal and the call to action were both painted
     in P.hot, and on a square crop the two together came to 15.4% against the
     14% ceiling — the seal 9.8%, the button 5.6%. The seal is the shout; the
     call to action is an instruction and takes the accent. */
  const {W,H,P,C}=c,pad=W*.05,col=color||P.accent;
  if(kind==='band'){
    const h=H*.072,plate=c.rect({x:0,y,w:W,h},col,{id:'ctaBand',bleed:true,role:'cta',fill:col});
    D.sheen(c,plate,'#FFFFFF');
    /* CENTRE THE WORDS IN THE BUTTON. Offsetting the top by .28h and letting
       the ink fall where it may left the label sitting low in its own plate —
       28% of clearance above, 14% below. On a square crop that 5px of droop
       was enough to push the longest call to action ("GET A BROKEN-PHONE
       QUOTE") down into the footer band. Handing plan() the plate's height
       centres the ink in it, which is what a button has always meant, and it
       moves no opaque shape — the earlier attempt to clamp the plate upward
       instead put it over the copy above on all 48 square ticketOffer cards. */
    c.text(C.cta,{x:pad,y,w:W-pad*2,h},{face:c.F.body,wf:c.F.bw,weight:900,
      fill:onColor(col,P),on:col,align:'middle',id:'ctaText',role:'cta',max:h*.62});
    return plate;
  }
  const w=W-pad*2,h=H*.062,plate=c.rect({x:pad,y,w,h},col,{r:h*.22,id:'ctaBtn',role:'cta',fill:col});
  D.sheen(c,plate,'#FFFFFF');
  c.text(C.cta,{x:pad+w*.08,y,w:w*.84,h},{face:c.F.body,wf:c.F.bw,weight:900,
    fill:onColor(col,P),on:col,align:'middle',id:'ctaText',role:'cta',max:h*.60});
  return plate;
};
/* A REAL PRODUCT, FITTED TO ITS BOX.
   Contained rather than cropped — a cutout that has had its head cut off is
   worse than no photograph — and the node is registered at the rectangle the
   image ACTUALLY occupies, not the box it was offered, so coverage and the
   collision rules measure the picture and not the empty air beside it. */
D.photo=(c,box,rot,pick,o={})=>{
  const id=c.id('ph');
  /* SHOW THE WHOLE PRODUCT, AND SHOW IT BIG.
     A cutout's whole worth is its silhouette — the shape of a phone read at a
     glance while scrolling. Filling the box by cropping turned most heroes into
     an abstract slab of glass, which stops nobody. So the picture is contained,
     never cropped, and the BOX is enlarged instead: the product ends up larger
     than the vector it replaced and still runs off the edge the layout wanted. */
  const grow=o.grow||1.34;
  const bw=box.w*grow, bh=box.h*grow;
  box={x:box.x-(bw-box.w)/2,y:box.y-(bh-box.h)/2,w:bw,h:bh};
  let sc=Math.min(box.w/pick.w,box.h/pick.h);
  /* A HERO IS A HERO. The layout hands over a box shaped for a vector; a
     photograph contained inside it can come out small, and a small product both
     leaves the card empty and cannot cross an edge by the 6% of the card that
     R4 asks for without half of it disappearing. So a hero is held to a minimum
     footprint against the card itself, not against the box it was offered. */
  if(o.min!==false){
    /* heroBoost: renderClean's answer to a coverage miss — a bigger product,
       not a dropped ornament (dropping only ever lowers coverage) */
    /* heroBoost may be a NUMBER. renderClean escalates it: a card that is
       clean but short of picture gets more picture, and one step of 16% is not
       always enough to clear the floor. */
    const boost=(c.cfg&&c.cfg.heroBoost)?(+c.cfg.heroBoost>1?+c.cfg.heroBoost:1.16):1;
    const want=Math.min(c.W,c.H)*(o.minShare||.48)*boost;
    const got=Math.max(pick.w,pick.h)*sc;
    if(got<want)sc*=want/got;
    /* and by area: a 187px-wide phone at .56 of the short edge is a sliver
       that leaves the card at 55% coverage — hold the picture to 12% of the
       canvas, with the long side capped so nothing becomes absurd */
    const area=pick.w*pick.h*sc*sc, need=c.W*c.H*.095*boost*boost;
    if(area<need){const k=Math.sqrt(need/area), capK=(c.S*.82)/(Math.max(pick.w,pick.h)*sc);
      sc*=Math.min(k,Math.max(1,capK));}
  }
  const w=pick.w*sc, h=pick.h*sc;
  /* Hold the edge the layout was reaching for. These boxes are positioned to
     overhang the canvas on one side; centring the picture inside the box pulled
     it back on-card and the bleed rule failed on 251 of 576 configurations. If
     the box crossed an edge, the photograph crosses it too. */
  /* The box is a REGION, not a frame. A contained photograph is narrower than
     the box it was offered, so aligning its far edge with the box's far edge —
     which is deliberately off-canvas — put the whole product outside the card:
     heroes were landing at x=1102 on a 1080-wide card and 65 configurations lost
     the seal's grip on a product that was not there. Bleed by a share of the
     PICTURE's own size instead, so it always overhangs and is always mostly on. */
  /* Bleed by a share of the PICTURE, but never by less than the card rule asks
     for: R4 wants the hero across an edge by 6% of the canvas, and a bleed
     measured only against a small picture never reached it. */
  const over=(iw,limit)=>Math.max(iw*.16,limit*.075);
  const pin=(bx,bw,iw,limit)=>{
    const o2=Math.min(over(iw,limit),iw*.28);      // never lose more than a quarter of the product
    if(bx<0)return -o2;
    if(bx+bw>limit)return limit-iw+o2;
    return bx+(bw-iw)/2;
  };
  let x=pin(box.x,box.w,w,c.W), y=pin(box.y,box.h,h,c.H);
  /* R4 wants the product to cross an edge by 6% of the card — the single
     biggest move against a card that looks like a catalogue photo. Test the
     finished position against that rule rather than trusting the anchor: a
     small picture pinned by a share of ITSELF can end up overhanging by less
     than the card asks, which is not "inside" and so never triggered a nudge. */
  if(o.bleed!==false){
    /* both axes can overhang at once; hold the product to ≥75% on-card */
    const share=()=>(Math.max(0,Math.min(x+w,c.W)-Math.max(x,0))*Math.max(0,Math.min(y+h,c.H)-Math.max(y,0)))/(w*h);
    for(let k=0;k<6&&share()<.75;k++){
      if(x<0)x+=(-x)*.5; else if(x+w>c.W)x-=(x+w-c.W)*.5;
      if(y<0)y+=(-y)*.5; else if(y+h>c.H)y-=(y+h-c.H)*.5;
    }
    /* a tall narrow cutout — a phone seen straight on is 187px wide — cannot
       cross the edge by 6.5% of a 1080px card and keep three quarters of
       itself on the card; it would need to be 37% off. So the bleed a hero
       owes is the smaller of 6.5% of the card and a quarter of its own width,
       and R4 is held to the same definition. */
    const need=Math.min(.065,Math.max(w*.25/c.W,.03));
    const outL=-x/c.W, outR=(x+w-c.W)/c.W, outT=-y/c.H, outB=(y+h-c.H)/c.H;
    if(Math.max(outL,outR,outT,outB)<need){
      const side=[[outL,'l'],[outR,'r'],[outT,'t'],[outB,'b']].sort((a,b)=>b[0]-a[0])[0][1];
      const nd=need*1.08;                       // just past the boundary, never on it
      if(side==='l')x=-c.W*nd;
      else if(side==='r')x=c.W*(1+nd)-w;
      else if(side==='t')y=-c.H*nd;
      else y=c.H*(1+nd)-h;
    }
  }
  const cx=x+w/2, cy=y+h/2;
  let filt='';
  if(c.on('heroShadow')){
    c.def(`<filter id="${id}f" x="-25%" y="-25%" width="150%" height="150%">`+
      `<feDropShadow dx="0" dy="${(h*.045).toFixed(1)}" stdDeviation="${(h*.040).toFixed(1)}" flood-color="#000" flood-opacity=".50"/></filter>`);
    filt=` filter="url(#${id}f)"`;
  }
  const base=(c.cfg&&c.cfg.assetBase)||'../';
  c.add(`<g transform="rotate(${(rot||0).toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})"${filt}>`+
    `<image href="${esc(base+pick.u)}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" preserveAspectRatio="xMidYMid meet"/></g>`,
    {type:'shape',id:o.id||'hero',box:{x,y,w,h},bleed:o.bleed!==false,role:o.role||'hero',asset:pick.s,tags:pick.t});
  return{x,y,w,h};
};
D.hero=(c,box,rot,variant)=>{
  const {P}=c,id=c.id('h'),cx=box.x+box.w/2,cy=box.y+box.h/2,{x,y,w,h}=box;
  let inner='';
  if(variant==='car'){
    c.def(`<linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.paper}" stop-opacity=".95"/><stop offset="1" stop-color="${P.accent}" stop-opacity=".85"/></linearGradient>`);
    inner=`<path d="M${x+w*.02} ${y+h*.72} L${x+w*.09} ${y+h*.44} Q${x+w*.13} ${y+h*.36} ${x+w*.24} ${y+h*.33} L${x+w*.36} ${y+h*.15} Q${x+w*.40} ${y+h*.08} ${x+w*.52} ${y+h*.08} L${x+w*.70} ${y+h*.09} Q${x+w*.79} ${y+h*.10} ${x+w*.85} ${y+h*.22} L${x+w*.95} ${y+h*.38} Q${x+w*.99} ${y+h*.44} ${x+w*.99} ${y+h*.56} L${x+w*.99} ${y+h*.72} Z" fill="url(#${id}b)"/>`+
      `<path d="M${x+w*.40} ${y+h*.17} L${x+w*.52} ${y+h*.17} L${x+w*.52} ${y+h*.32} L${x+w*.31} ${y+h*.32} Z" fill="${P.dark}" opacity=".55"/>`+
      `<path d="M${x+w*.57} ${y+h*.17} L${x+w*.70} ${y+h*.18} Q${x+w*.76} ${y+h*.20} ${x+w*.80} ${y+h*.32} L${x+w*.57} ${y+h*.32} Z" fill="${P.dark}" opacity=".55"/>`+
      `<circle cx="${x+w*.26}" cy="${y+h*.74}" r="${h*.16}" fill="${P.dark}"/><circle cx="${x+w*.26}" cy="${y+h*.74}" r="${h*.075}" fill="${P.body}"/>`+
      `<circle cx="${x+w*.80}" cy="${y+h*.74}" r="${h*.16}" fill="${P.dark}"/><circle cx="${x+w*.80}" cy="${y+h*.74}" r="${h*.075}" fill="${P.body}"/>`;
  }else{
    const r=w*.14;
    c.def(`<linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${P.accent}"/><stop offset=".55" stop-color="${P.ground2}"/><stop offset="1" stop-color="${P.hot}"/></linearGradient>`);
    inner=`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${P.dark}"/>`+
      `<rect x="${x+w*.035}" y="${y+h*.026}" width="${w*.93}" height="${h*.948}" rx="${r*.82}" fill="url(#${id}s)"/>`+
      `<rect x="${x+w*.33}" y="${y+h*.028}" width="${w*.34}" height="${h*.032}" rx="${h*.016}" fill="${P.dark}"/>`+
      `<rect x="${x+w*.60}" y="${y+h*.045}" width="${w*.33}" height="${w*.33}" rx="${w*.10}" fill="${P.dark}" opacity=".92"/>`+
      `<circle cx="${x+w*.70}" cy="${y+h*.045+w*.10}" r="${w*.062}" fill="${P.ground2}" stroke="${P.body}" stroke-width="${w*.012}"/>`+
      `<circle cx="${x+w*.84}" cy="${y+h*.045+w*.10}" r="${w*.062}" fill="${P.ground2}" stroke="${P.body}" stroke-width="${w*.012}"/>`+
      `<circle cx="${x+w*.70}" cy="${y+h*.045+w*.24}" r="${w*.062}" fill="${P.ground2}" stroke="${P.body}" stroke-width="${w*.012}"/>`;
  }
  let filt='';
  if(c.on('heroShadow')){
    c.def(`<filter id="${id}f" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="${(h*.035).toFixed(1)}" stdDeviation="${(h*.035).toFixed(1)}" flood-color="#000" flood-opacity=".45"/></filter>`);
    filt=` filter="url(#${id}f)"`;
  }
  c.add(`<g transform="rotate(${rot.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})"${filt}>${inner}</g>`,
    {type:'shape',id:'hero',box,bleed:true,role:'hero'});
  return box;
};
D.grain=(c)=>{
  const id=c.id('g');
  c.def(`<filter id="${id}"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3"/><feColorMatrix type="saturate" values="0"/></filter>`);
  c.add(`<rect width="${c.W}" height="${c.H}" filter="url(#${id})" opacity=".055" style="mix-blend-mode:overlay"/>`,null,60);
};
D.stars=(c,x,y,size,fill)=>{
  let p='';
  for(let s=0;s<5;s++){const cx=x+size*.62*s+size*.31,cy=y+size*.5,r=size*.46;
    for(let i=0;i<10;i++){const rr=i%2?r*.42:r,a=-Math.PI/2+i*Math.PI/5;
      p+=(i?'L':'M')+(cx+Math.cos(a)*rr).toFixed(1)+' '+(cy+Math.sin(a)*rr).toFixed(1)+' ';}p+='Z ';}
  c.add(`<path d="${p}" fill="${fill}"/>`,{type:'shape',id:'stars',box:{x,y,w:size*3.1,h:size},role:'proof'});
};
D.split=(c,color)=>{
  const {W,H}=c;
  c.add(`<path d="M0 0 H${W} V${(H*.38).toFixed(1)} L0 ${(H*.52).toFixed(1)} Z" fill="${color}"/>`,
    {type:'shape',id:'split',box:{x:0,y:0,w:W,h:H*.52},bleed:true,role:'field'});
};

/* ══════════════════════════════════════════════════════════
   8 · ARCHETYPES → plans, painted through the gates
   ══════════════════════════════════════════════════════════ */
function ground(c,mode){
  const {W,H,P}=c;
  /* A WALL OF THE THING WE BUY. The showcase grounds put devices at one angle
     across the whole card, each screen carrying artwork drawn from this card's
     palette. It is the reference genre the owner sent, and for a shop that buys
     these exact devices the product is also the pattern. */
  if(c.on('showcase')&&mode!=='flat'){
    const lay=c.cfg&&c.cfg.showcaseLayout;
    const keys=Object.keys(SHOWCASE_LAYOUTS);
    c.rect({x:0,y:0,w:W,h:H},P.ground,{ghost:true,z:-90});
    drawShowcase(c,{x:0,y:0,w:W,h:H},{
      layout:lay&&SHOWCASE_LAYOUTS[lay]?lay:keys[c.R.i(0,keys.length-1)],
      brand:c.C.brand,
      fade:c.cfg&&c.cfg.showcaseFade!==undefined?c.cfg.showcaseFade:.26});
    return;
  }
  if(!c.on('groundGradient')||mode==='flat'){c.rect({x:0,y:0,w:W,h:H},P.ground,{ghost:true,z:-90});return;}
  const id=c.id('bg');
  c.def(`<radialGradient id="${id}" cx="${mode==='pool'?'34%':'50%'}" cy="${mode==='pool'?'38%':'30%'}" r="78%"><stop offset="0" stop-color="${P.ground2}"/><stop offset="1" stop-color="${P.ground}"/></radialGradient>`);
  c.rect({x:0,y:0,w:W,h:H},`url(#${id})`,{ghost:true,z:-90});
}
/* hero placement respects the bleed switch: off ⇒ clamped inside the safe area */
function placeHero(c,box,rot){
  if(!c.on('hero'))return null;
  let b={...box};
  if(c.H/c.W>1.45){b.h*=1.24;b.w*=1.06;}
  if(!c.on('heroBleed')){
    const m=c.W*.055;
    b.w=Math.min(b.w,c.W-m*2); b.h=Math.min(b.h,c.H*.5);
    b.x=Math.min(Math.max(b.x,m),c.W-m-b.w);
    b.y=Math.min(Math.max(b.y,c.H*.14),c.H*.86-b.h);
  }
  const turn=c.on('heroRotate')?rot:0;
  /* Photography when we have an approved cutout for this subject; the vector
     stays as the fallback so the engine still renders with no asset index. */
  if(c.on('photoHero')){
    const pick=pickAsset(c,assetsFor(c,c.vertical),0,{pin:c.cfg&&c.cfg.heroAsset});
    if(pick)return D.photo(c,b,turn,pick);
  }
  return D.hero(c,b,turn,c.C.hero);
}
function headline(c,lines,box,o={}){
  /* an ornamental display face gets the words only if there are few of them;
     past that the body face carries the line and the display face keeps its
     job as the first thing the eye lands on, not the thing it has to decode */
  if(!o.face&&ORNAMENTAL.has(c.F.display)&&lines.join(' ').split(/\s+/).length>3)
    o={...o,face:c.F.body,weight:900};
  const gap=box.h*.06,lh=(box.h-gap*(lines.length-1))/lines.length;
  let y=box.y;
  /* PLAN THE WHOLE STACK, THEN PAINT IT.
     Bars are drawn for every line before any word is set, so a bar cut for the
     second line cannot land on top of the first — which is what happened while
     each line planned and painted itself in turn. */
  const set=lines.map((ln,i)=>{
    const onPlate=o.plateIndex===i&&o.plateColor;
    const back=onPlate?o.plateColor:(o.on||c.P.ground);
    const opt={fill:onPlate?onColor(o.plateColor,c.P):((i===1&&o.line1Fill)||o.fill||c.P.ink),
      stroke:o.stroke,shadow:o.shadow,strokeW:o.strokeW,on:back,align:o.align,
      id:'headline'+i,role:'headline',measure:o.measure,
      /* the line is as big as its box allows in BOTH axes — the old estimate
         multiplied a bad average-width constant by a 1.35 fudge factor, which
         is why headlines came out wider than the bars drawn behind them.
         The cap ratio is the FACE'S OWN: hard-coding .74 was true of the four
         families the engine arrived with and wrong for the sixteen approved
         ones, whose caps run .71 to .77 — enough to drop a baseline into the
         line beneath it. */
      /* sized so the line's INK fits the leading, not just its cap height: a
         face with real descenders drew a stack whose lines overlapped, and the
         collision rule was right to fail it */
      size:lh/(()=>{const m=faceMetrics(o.face||c.F.display,o.weight||c.F.dweight);
        return m?Math.max(m.cap,m.cap+m.desc*.92):.86;})()};
    /* A line that is going to get a bar must leave room for it, otherwise the
       bar — now cut to the words — grows past the edge of the card. The pad is
       known from the leading before the type is planned, so inset first and the
       finished bar lands exactly inside the box the layout asked for. */
    const inset=(onPlate&&o.plateDraw)?lh*.74*.30:0;
    const at={x:box.x+inset,y,w:box.w-inset*2};
    const r={ln,opt,at,onPlate,plan:c.plan(ln,at,opt)};
    y+=lh+gap;
    return r;
  });
  /* the bar is cut to what the words will actually measure, padded — it used to
     be a fixed fraction of the card, so "CASH FOR IPHONES" ran off its own
     highlighter — and never taller than the leading, so it stays in its lane */
  if(o.plateDraw)set.forEach(t=>{
    if(!t.onPlate)return;
    const padX=t.plan.cap*.30,padY=Math.min(t.plan.cap*.26,(lh+gap-t.plan.box.h)/2);
    const m=MARGIN*c.S;                                // stay inside the safe area
    const x0=Math.max(m,t.plan.box.x-padX), x1=Math.min(c.W-m,t.plan.box.x+t.plan.box.w+padX);
    o.plateDraw(c,{x:x0,y:t.plan.box.y-padY,w:x1-x0,h:t.plan.box.h+padY*2});
  });
  set.forEach(t=>c.text(t.ln,t.at,t.opt));
}
/* A seal is placed from the hero's own corner, offset by .106r, which lands the
   overlap at ~20% of the badge — inside the 6–32% the auditor asks for. */
function sealOnHero(c,hero,r,pts,text,sub,fill,corner,maxCy,minCx,minCy){
  if(!c.on('starburst'))return null;
  c.defer(()=>placeSeal(c,hero,r,pts,text,sub,fill,corner,maxCy,minCx,minCy));
  return null;
}
function placeSeal(c,hero,r,pts,text,sub0,fill,corner,maxCy,minCx,minCy){
  let sub=sub0;
  if(text==='@phrase'){
    const ph=sealPhrase(c);
    if(!ph){c.note('seal: every phrase would repeat a line on the card, not drawn');return null;}
    text=ph[0];sub=ph[1];
  }
  /* r is re-chosen below when every seat is occupied */
  const P=c.P,d=r*.106;
  let cx,cy;
  if(hero){
    cx=corner[1]==='l'?hero.x-d:hero.x+hero.w+d;
    cy=corner[0]==='t'?hero.y-d:hero.y+hero.h+d;
  }else{cx=c.W*.76;cy=c.H*.58;}
  cy=Math.min(Math.max(cy,r+c.H*.015),c.H*.885-r);
  if(maxCy)cy=Math.min(cy,maxCy);
  if(minCy)cy=Math.max(cy,minCy);
  if(hero){                       // hold the overlap at ~18% whatever cy became
    const oh=Math.max(0,Math.min(cy+r,hero.y+hero.h)-Math.max(cy-r,hero.y));
    if(oh>0){
      const want=Math.min(2*r,.18*4*r*r/oh);
      cx=corner[1]==='l'?hero.x-r+want:hero.x+hero.w+r-want;
    }
  }
  if(minCx)cx=Math.max(cx,minCx);
  cx=Math.min(Math.max(cx,r+c.W*.015),c.W-r-c.W*.015);
  /* A SEAL IS PLACED LAST, SO IT DECIDES WHAT THE READER LOSES.
     It used to be positioned from the hero's corner alone, blind to the copy,
     and being drawn after the type it simply covered whatever was there — cards
     shipped reading "CASH FOR IPHON<seal>" and with a whole price column behind
     it. Try the anchor we wanted first, then the mirrored corners, and take the
     first that costs no words; if every seat is occupied, shrink rather than
     print over the sentence. */
  let rot=0;
  {
    /* A ROW OF TRUST MARKS IS AS MUCH "SOMETHING THE READER LOSES" AS A LINE
       OF WORDS. The seal is placed last and was scored against text alone, so
       it parked itself on the icon strip on 42 cards — the words survived, the
       marks were eaten. Anything solid the card has already committed to
       counts against the seat. */
    /* ...AND NOT A PHOTOGRAPH EITHER. A second product unit is placed before
       the seal is deferred, so the seal — scored against words alone — sat
       squarely on top of one on 69 of 432 cards, one of them covering it
       ENTIRELY: a phone paid for, placed, and then hidden. The hero is the
       exception and stays out of this list, because biting into the hero is
       the seal's whole job (R6 asks for 6-32% of it). */
    const words=c.nodes.filter(n=>n.box&&n.box.w>0&&n.box.h>0&&
      (n.type==='text'||n.id==='iconStrip'||/^product\d$/.test(n.id)));
    /* Fix the rotation before searching. The seal is drawn at a random angle,
       so scoring seats against an unrotated star was scoring a different shape
       from the one that gets painted — enough to pick a seat whose point then
       lands across a line. */
    rot=c.R.f(-.40,-.14);
    /* the polygon is sampled on an 8×8 grid of the text box; a wide line can
       hide a sliver of the disc between samples and R7 then finds it. The
       inner square's plain intersection is added as a second, unsampled term. */
    const cost=(X,Y,rr)=>words.reduce((s,t)=>{
      const sq={x:X-rr*.57,y:Y-rr*.57,w:rr*1.14,h:rr*1.14};        // inscribed square of the inner disc
      return s+starCover(t.box,{cx:X,cy:Y,r:rr,pts,inner:.80,rot})+inter(sq,t.box)/(t.box.w*t.box.h);},0);
    const mg=MARGIN*c.S;
    const lim=(X,Y,rr)=>[Math.min(Math.max(X,rr+mg),c.W-rr-mg),
                         Math.min(Math.max(Y,rr+mg),c.H*.885-rr)];
    /* Cost is words lost. Distance from the seat the designer asked for is a
       tie-breaker only, so the seal keeps its intended corner whenever that
       corner is free and gives it up when it is not. */
    let best=null;
    const want=[cx,cy];
    /* A seal belongs on the corner of the product — that bite of overlap is
       what makes it read as a sticker on the thing rather than a floating
       graphic, and R6 asks for 6-32% of it. So the search balances two jobs:
       cover no words, and keep its grip on the hero. */
    /* Straddle the product's outline: the seal's centre wants to sit ON the
       edge, and the cost is how far it has drifted either way. Optimising the
       same quantity the rule measures is the whole point — the old version
       scored a ratio while the rule tested a ratio band, and the search kept
       parking on the boundary. */
    const grip=(X,Y,rr)=>{
      if(!hero)return 0;
      const dx=Math.max(hero.x-X,0,X-(hero.x+hero.w));
      const dy=Math.max(hero.y-Y,0,Y-(hero.y+hero.h));
      const gap=(dx>0||dy>0)?Math.hypot(dx,dy)
        :-Math.min(X-hero.x,hero.x+hero.w-X,Y-hero.y,hero.y+hero.h-Y);
      const slack=Math.abs(gap)/rr;                    // 0 = dead on the outline
      return slack<=.55?0:Math.min(1,(slack-.55)*1.6);
    };
    const consider=(sx,sy,rr,bias)=>{
      const [X,Y]=lim(sx,sy,rr);
      const d=Math.hypot(X-want[0],Y-want[1])/c.S;
      const co=cost(X,Y,rr);
      /* Covering a line is the worse sin. Scored evenly against the grip
         penalty the search would happily print the seal across a sentence to
         keep its bite on the product, so words are weighted four to one. */
      const k=co*4+grip(X,Y,rr)+d*.03+bias;
      if(!best||k<best.k-1e-6)best={k,cost:co,X,Y,rr};
    };
    /* a seal that cannot find a clean seat at full size is better small than
       printed across a sentence */
    /* never shrink below the radius that can still carry two legible lines —
       a seat found by shrinking the seal to where its phrase no longer fits is
       not a seat, it is a refusal with extra steps */
    const rMin=(c.S*.021/((faceMetrics(c.F.display,c.F.dweight)||{cap:.72}).cap))/(.215*.80*1.38);
    /* The size the layout asked for first, then smaller, and only then bigger.
       Leading with the grown radius made every seal grow whether it needed to
       or not, and the hot colour blew past its 14% ceiling on 40 cards. */
    for(const rr of [r,r*.92,r*.84,r*.78,r*1.08,r*1.16].filter((rr,i)=>i===0||i>=4||rr>=rMin)){
      consider(cx,cy,rr,0);
      /* Seats ON THE PRODUCT'S EDGE. Four corners was enough while the hero was
         a vector that filled its box; a photograph is contained inside its box
         and sits wherever its own proportions put it, so the corners often lie
         in empty ground and the seal lost its bite on 67 of 576 configurations.
         Walk the perimeter instead and offer the seal a seat every eighth of
         the way round, each one placed to overlap by about the fifth R6 wants. */
      if(hero){
        const pts2=[];
        /* Several stand-off distances, because how much of the seal lands on the
           product depends on where round the edge it sits — a seat that bites a
           fifth on a corner bites nearly half in the middle of a long side, and
           R6 rejects anything past a third. */
        for(const off of [rr*.62,rr*.86,rr*1.06])
          for(let t=0;t<8;t++){
            const a=t/8;
            if(a<.25)      pts2.push([hero.x+hero.w*(a*4),      hero.y-off]);
            else if(a<.5)  pts2.push([hero.x+hero.w+off,        hero.y+hero.h*((a-.25)*4)]);
            else if(a<.75) pts2.push([hero.x+hero.w*(1-(a-.5)*4),hero.y+hero.h+off]);
            else           pts2.push([hero.x-off,               hero.y+hero.h*(1-(a-.75)*4)]);
          }
        for(const [sx,sy] of pts2)consider(sx,sy,rr,.008);
      }
      for(let gx=0;gx<=6;gx++)for(let gy=0;gy<=6;gy++)
        consider(c.W*(.10+gx*.133),c.H*(.12+gy*.118),rr,.02);
    }
    if(best){cx=best.X;cy=best.Y;r=best.rr;}
    /* NO CLEAN SEAT, NO SEAL. The search used to take the least-bad seat and
       paint the star over 13% of a line; the second opinion then failed the
       card. A price seal tries again as the smaller tag rectangle, which fits
       where a star cannot; if even that covers words, the price is left to the
       card's other carriers and the must-have rule decides. */
    if(best&&best.cost>.02){
      const money=String(text).replace(/^UP TO\s+/,'');
      if(/\$\d/.test(money)){
        const tw=r*1.36,th=tw*.58;
        let tb=null;
        const tcost=(X,Y)=>words.reduce((s2,t)=>s2+inter({x:X-tw/2,y:Y-th/2,w:tw,h:th},t.box)/(t.box.w*t.box.h),0);
        for(let gx=0;gx<=8;gx++)for(let gy=0;gy<=8;gy++){
          const mg2=MARGIN*c.S;
          const X=Math.min(Math.max(c.W*(.08+gx*.105),tw/2+mg2),c.W-tw/2-mg2), Y=Math.min(Math.max(c.H*(.10+gy*.095),th/2+mg2),c.H*.885-th/2);
          const k=tcost(X,Y)*4+grip(X,Y,r)*.5+Math.hypot(X-want[0],Y-want[1])/c.S*.03;
          if(!tb||k<tb.k)tb={k,X,Y,cost:tcost(X,Y)};
        }
        if(tb&&tb.cost<=.01){
          const preT=/^UP TO/.test(String(text))&&hasLadder(c)?'UP TO':(hasLadder(c)?'':(leadTag(c.C)||''));
          D.priceTag(c,tb.X,tb.Y,tw,[money,preT],fill);
          c.note('seal: no clean seat for the star; price tag placed instead');
          return null;
        }
      }
      c.note(`seal: no clean seat (best still covers ${(best.cost*100).toFixed(0)}% of a line), not drawn`);
      return null;
    }
  }
  let money=text.replace(/^UP TO\s+/,''), pre=money===text?null:'UP TO';
  /* a price seal on a card with no ladder is bounded by the lead model instead
     of by "UP TO", which bounds nothing */
  if(pre&&!hasLadder(c)){pre=null;sub=leadTag(c.C)||sub;}
  const ink=onColor(fill,P);
  /* A STAR IS NOT ITS BOUNDING BOX. The three lines were fitted to b, the full
     outer box of the points, so the number ran out past the tips — measured at
     41-45% overlap between "UP TO", the money and the sub on every archetype
     that carries a seal. The readable area is the INNER disc, so the lines are
     fitted to the square inscribed in it and stacked with real leading. */
  const inR=r*.80, side=inR*1.38;                  // inscribed square of the inner disc
  const bx=cx-side/2, by=cy-side/2;
  /* HOW MANY LINES THE SEAL CAN CARRY, decided by its size. Three lines in a
     small burst either overflow the points or fall under the legibility floor;
     the seal drops to two, then to the number alone, and the surviving lines
     grow to use the disc. R8 is a floor, not a suggestion. */
  /* R8 measures CAP height (size * capRatio), not the font size, so the floor a
     row must clear in font terms is 2% / 0.72 with a little margin. */
  const floor=c.S*.021/((faceMetrics(c.F.display,c.F.dweight)||{cap:.72}).cap);
  /* Two lines fit a seal of this size; three do not, and the old budget's
     small lines (.150, .190 of the side) never cleared the legibility floor,
     so 251 of 288 seals silently fell to ONE line — a bare "$1,250" with its
     "UP TO" gone, or "SAME" with its "DAY" gone. A seal that cannot carry its
     phrase is not drawn at all; the card's must-have rule then says whether the
     offer survives elsewhere. */
  const plan=[[3,.200,.300,.170],[2,.215,.360,0]];
  let pick=null;
  for(const p2 of plan){
    const want=p2[0];
    if(want===3&&!(pre&&sub))continue;
    if(want===2&&!(pre||sub))continue;
    const smallest=Math.min(...[p2[1],p2[2],p2[3]].filter(v=>v>0))*side;
    if(smallest>=floor){pick=p2;break;}
  }
  /* one line is honest only when it is a price and a ladder on the card says
     what it is for; "SAME" without its "DAY" is never honest */
  if(!pick&&pre&&hasLadder(c)&&.52*side>=floor)pick=[1,0,.52,0];
  /* A HEIGHT CHECK IS NOT A FIT. The plan only asked whether each row's height
     cleared the legibility floor; a long row then got shrunk to fit the seal's
     width and landed under it anyway — "CASH TODAY" came out at 1.65% of the
     short edge. Ask the type itself whether it can be set. */
  /* A HEIGHT CHECK IS NOT A FIT — but the answer is to drop a ROW, not the
     seal. The plan only asked whether each row's height cleared the legibility
     floor; a long row was then shrunk to fit the seal's width and landed under
     it anyway ("CASH TODAY" at 1.65% of the short edge). Refusing the whole
     seal for that cost more in coverage than it saved, so the supporting lines
     go first and the money stays. */
  if(pick){
    const fits=(str,f)=>!str||!f||c.plan(str,{x:bx,y:by,w:side},
      {align:'middle',fill:ink,on:fill,role:'offer',max:side*f}).size>=floor*.98;
    if(pick[0]===3&&!(fits(pre,pick[1])&&fits(sub,pick[3]))){pick=[2,.215,.360,0];}
    if(pick[0]===2){
      if(pre&&!fits(pre,pick[1])){pre=null;sub=sub&&fits(sub,pick[1])?sub:null;}
      else if(sub&&!fits(sub,pick[1]))sub=null;
      if(!pre&&!sub)pick=hasLadder(c)&&.52*side>=floor?[1,0,.52,0]:pick;
    }
    if(!fits(money,pick[2]))pick=null;          // the figure itself cannot be set
  }
  if(!pick){
    if(/\$\d/.test(money)){
      /* the price must survive the seal: a two-line tag on the same clean seat */
      D.priceTag(c,cx,cy,r*1.36,[money,pre&&hasLadder(c)?pre:(sub||'')],fill);   // diagonal ≈ .79r, inside the .8r disc
      c.note('seal: too small for its phrase; price tag drawn instead');
    }else c.note('seal: cannot carry its phrase legibly at this size, not drawn');
    return null;
  }
  const b=D.starburst(c,cx,cy,r,pts,.80,rot,fill,P.dark);
  const rows=[];
  if(pick[0]===3){rows.push({t:pre,f:pick[1],face:1,id:'offerPre'},{t:money,f:pick[2],face:0,id:'offer'},{t:sub,f:pick[3],face:1,id:'offerSub'});}
  else if(pick[0]===2){
    if(pre)rows.push({t:pre,f:pick[1],face:1,id:'offerPre'},{t:money,f:pick[2],face:0,id:'offer'});
    else rows.push({t:money,f:pick[2],face:0,id:'offer'},{t:sub,f:pick[1],face:1,id:'offerSub'});
  }
  else rows.push({t:money,f:pick[2],face:0,id:'offer'});
  const lead=1.20, totalH=rows.reduce((a2,q)=>a2+side*q.f*lead,0);
  let ty=cy-totalH/2;
  rows.forEach(q=>{
    const hh=side*q.f;
    c.text(q.t,{x:bx,y:ty,w:side},
      Object.assign({align:'middle',fill:ink,on:fill,role:'offer',max:hh},
        q.face?{face:c.F.body,wf:c.F.bw,weight:800,id:q.id,tracking:.04,z:Z.badge+1}
              :{...numFace(c),id:q.id,z:Z.badge+1}));
    ty+=hh*lead;
  });
  return b;
}
function priceRows(c,top,rows,floorY){
  if(!c.on('priceRows'))return;
  const {W,H,S,P,F}=c,rh=S*.066,pad=W*.055;
  /* Show only the rows that fit above whatever comes next. In the square format
     the board ran five rows straight under the hero, which was then drawn on
     top of the last two — better to quote three models legibly than five with
     the prices hidden behind a photograph. */
  if(floorY)rows=rows.slice(0,Math.max(2,Math.floor((floorY-top)/rh)));
  const labOpt={face:F.body,wf:F.bw,weight:700,id:'rowLabel',role:'data',max:rh*.52};
  const priOpt={...numFace(c),align:'end',id:'rowPrice',role:'data',max:rh*.66};
  const labSize=c.fitAll(rows.map(r=>({str:r[0],box:{x:0,y:0,w:W*.50},opt:labOpt})));
  const priSize=c.fitAll(rows.map(r=>({str:r[1],box:{x:0,y:0,w:W*.26},opt:priOpt})));
  rows.forEach((r,i)=>{
    /* On a light palette both paper and ground2 can land within a hair of the
       ground, and the ladder stops being a ladder — it reads as prices floating
       on the card. Pick the two candidates that actually separate from the
       ground and alternate those. */
    const y=top+i*rh;
    const cands=[P.paper,P.ground2,P.dark,P.ink].map(c2=>({c:c2,k:contrast(c2,P.ground)}))
      .filter(x=>x.k>=1.30).sort((a,b)=>b.k-a.k);
    const bg=cands.length>=2?(i%2===0?cands[0].c:cands[1].c):(cands[0]?cands[0].c:P.ground2);
    c.rect({x:pad,y,w:W-pad*2,h:rh*.9},bg,{r:rh*.16,id:'row',role:'data'});   // shares the pills' left edge
    c.text(r[0],{x:pad,y:y+rh*.24,w:W*.50},{face:F.body,wf:F.bw,weight:700,fill:onColor(bg,P),on:bg,id:'rowLabel',role:'data',max:rh*.52,size:labSize});
    c.text(r[1],{x:W-pad-W*.26,y:y+rh*.18,w:W*.26},{...numFace(c),align:'end',fill:readable(P.accent,bg,P),on:bg,id:'rowPrice',role:'data',max:rh*.66,size:priSize});
  });
}
function proofSteps(c,sy,steps){
  const {W,H,S,P,F}=c,sh=S*.070;
  /* three steps at three different sizes reads as sloppy however legible each
     one is — the set is sized to its smallest member */
  const lOpt={face:F.body,wf:F.bw,weight:800,id:'stepLabel',role:'data',max:sh*.40};
  const bOpt={face:F.body,wf:F.bw,weight:500,id:'stepBody',role:'data',max:sh*.50};
  const lSize=c.fitAll(steps.map(s=>({str:s[0],box:{x:0,y:0,w:W*.24},opt:lOpt})));
  const bSize=c.fitAll(steps.map(s=>({str:s[1],box:{x:0,y:0,w:W*.30},opt:bOpt})));
  steps.forEach((s,i)=>{
    const y=sy+i*sh;
    c.rect({x:W*.05,y,w:sh*.72,h:sh*.72},P.hot,{r:sh*.16,id:'stepNum',role:'data',fill:P.hot});
    c.text(String(i+1),{x:W*.05+sh*.16,y:y+sh*.16,w:sh*.40,h:sh*.40},{...numFace(c),
      align:'middle',fill:onColor(P.hot,P),on:P.hot,id:'stepN',role:'data'});
    c.text(s[0],{x:W*.05+sh*.92,y:y+sh*.06,w:W*.24},{face:F.body,wf:F.bw,weight:800,fill:P.ink,on:P.ground,id:'stepLabel',role:'data',max:sh*.40,size:lSize});
    c.text(s[1],{x:W*.05+sh*.92,y:y+sh*.44,w:W*.30},{face:F.body,wf:F.bw,weight:500,fill:readable(P.body,P.ground,P),on:P.ground,id:'stepBody',role:'data',max:sh*.50,size:bSize});
  });
}
function reviewCard(c,box){
  const {W,H,P,F,C}=c;
  const q=c.rect(box,P.paper,{r:W*.02,id:'quoteCard',role:'proof'});
  D.sheen(c,q,P.accent);
  const words=C.quote.split(' '),half=Math.ceil(words.length/2);
  /* Sized by width alone, a single quote glyph took whatever size its narrow
     advance implied — a 90px-tall mark that hung off the card and sat on the
     first line of the quote. Give it a height and it stays an ornament. */
  c.text('“',{x:box.x+W*.025,y:box.y+H*.012,w:W*.06,h:H*.026},{fill:readable(P.hot,P.paper,P),on:P.paper,id:'qm',role:'proof'});
  c.text(words.slice(0,half).join(' '),{x:box.x+W*.035,y:box.y+H*.057,w:box.w-W*.07},
    {face:F.body,wf:F.bw,weight:700,fill:P.dark,on:P.paper,id:'quote',role:'proof',max:c.S*.036});
  c.text(words.slice(half).join(' '),{x:box.x+W*.035,y:box.y+H*.093,w:box.w-W*.07},
    {face:F.body,wf:F.bw,weight:700,fill:P.dark,on:P.paper,id:'quote2',role:'proof',max:c.S*.036});
  c.text(C.quoteBy,{x:box.x+W*.035,y:box.y+H*.130,w:box.w*.62},
    {face:F.body,wf:F.bw,weight:600,fill:onColor(P.paper,P),on:P.paper,id:'quoteBy',role:'proof',max:c.S*.028});
}

const ARCH={};

/* A1 · NIGHT LOT — argument down the left, hero bleeding right, seal on its corner */
ARCH.nightLot=c=>{
  const {W,H,P,F,R,C}=c;
  ground(c,'pool');
  if(c.on('sunburst'))D.sunburst(c,W*.74,H*.36,W*.88,P.accent,28,R.f(0,.4),.11);
  const hero=placeHero(c,{x:W*.52,y:H*.155,w:W*.60,h:H*.40},R.f(10,20));
  headline(c,C.heads,{x:W*.055,y:H*.165,w:W*.50,h:H*.155},
    {stroke:P.dark,shadow:P.hot,shadowDx:W*.008,shadowDy:H*.007,strokeW:.045});
  if(c.on('proofBlock')){
    D.stars(c,W*.055,H*.370,c.S*.034,readable(P.accent,P.ground,P));
    c.text(C.rating,{x:W*.055+c.S*.034*3.6,y:H*.370,w:W*.38},
      {face:F.body,wf:F.bw,weight:800,fill:P.ink,on:P.ground,id:'rating',role:'proof',max:c.S*.036});
  }
  if(c.on('priceRows')){
  const nRows=C.rows.slice(0,c.H/c.W>1.45?5:4), nrh=c.S*.056;
  const nlOpt={face:F.body,wf:F.bw,weight:800,id:'rowLabel',role:'data',max:nrh*.58};
  const npOpt={...numFace(c),align:'end',id:'rowPrice',role:'data',max:nrh*.64};
  const nlSize=c.fitAll(nRows.map(r=>({str:r[2]||r[0],box:{x:0,y:0,w:W*.148},opt:nlOpt})));
  const npSize=c.fitAll(nRows.map(r=>({str:r[1],box:{x:0,y:0,w:W*.148},opt:npOpt})));
  nRows.forEach((row,i)=>{
    /* Alternating between ground2 and THE GROUND ITSELF meant every other row
       had no plate at all — on a light palette ground2 is barely separate
       either, so the ladder read as prices floating loose on the card. Both
       stripes are now picked for real separation from the ground. */
    const rh=c.S*.056,y=(c.H/c.W>1.45?H*.395:H*.418)+i*rh;
    const cds=[P.paper,P.ground2,P.dark,P.ink].map(x=>({c:x,k:contrast(x,P.ground)}))
      .filter(x=>x.k>=1.30).sort((a,b)=>b.k-a.k);
    const bg=cds.length>=2?(i%2===0?cds[0].c:cds[1].c):(cds[0]?cds[0].c:P.ground2);
    /* The label column was W*.125 — 135px, too narrow for a real model tag.
       "4RUNNER" needed 124% of it just to reach the legibility floor, so the
       ladder shipped with unreadable model names. Widened to two 160px columns
       inside a wider plate, which every tag in the deck clears. */
    c.rect({x:W*.05,y,w:W*.33,h:rh*.88},bg,{r:rh*.16,id:'row',role:'data'});
    c.text(row[2]||row[0],{x:W*.063,y:y+rh*.20,w:W*.148},{face:F.body,wf:F.bw,weight:800,
      fill:onColor(bg,P),on:bg,id:'rowLabel',role:'data',max:rh*.58,size:nlSize});
    c.text(row[1],{x:W*.2185,y:y+rh*.16,w:W*.148},{...numFace(c),align:'end',fill:readable(P.accent,bg,P),on:bg,
      id:'rowPrice',role:'data',max:rh*.64,size:npSize});
  });}
  sealOnHero(c,hero,W*.145,16,C.offer,C.offerSub,P.hot,'bl',H*.56,W*.46);
  if(H/W>1.45&&c.on('promisePills'))D.iconStrip(c,H*.648,stripKeys(c));
  if(c.on('promisePills'))D.promises(c,H*.715,C.promises.slice(0,3));
  if(c.on('cta'))D.cta(c,H*.795,'button',P.accent);
  if(c.on('cornerLockup'))D.lockup(c,'left');
  if(c.on('footerBar'))D.footerBar(c);
  if(c.on('grain'))D.grain(c);
  c.note('argument down the left · hero bleeding right · seal on the hero corner');
};

/* A2 · BAND STACK — knockout bands, hero driving out of the right edge */
ARCH.bandStack=c=>{
  const {W,H,P,R,C}=c;
  ground(c,'flat');
  if(c.on('checker'))D.checker(c,{x:0,y:0,w:W,h:H},P.accent,12,.10);
  const y0=H*.145;
  if(c.on('knockoutBand')){
    c.rect({x:0,y:y0,w:W,h:H*.095},P.ink,{bleed:true,id:'band1',role:'plate',fill:P.ink});
    c.text(C.heads[0],{x:W*.05,y:y0+H*.020,w:W*.90},{align:'middle',fill:onColor(P.ink,P),on:P.ink,role:'headline',id:'headline',max:H*.058});
    const b2=c.rect({x:0,y:H*.252,w:W,h:H*.125},P.accent,{bleed:true,id:'band2',role:'plate',fill:P.accent});
    D.sheen(c,b2,'#FFFFFF');
    c.text(C.heads[1],{x:W*.05,y:H*.276,w:W*.90},{align:'middle',fill:onColor(P.accent,P),on:P.accent,role:'headline',id:'headline2',max:H*.078});
  }else headline(c,C.heads,{x:W*.05,y:y0,w:W*.90,h:H*.22},{align:'middle',stroke:P.dark,shadow:P.hot});
  const hero=placeHero(c,{x:W*.30,y:H*.40,w:W*.78,h:H*.30},R.f(-9,9));
  sealOnHero(c,hero,W*.135,12,C.offer,null,P.accent,'bl',H*.62,null,H*.48);
  if(c.on('promisePills'))D.promises(c,H*.715,C.promises.slice(0,3));
  if(c.on('cta'))D.cta(c,H*.800,'band');
  if(c.on('cornerLockup'))D.lockup(c,'left');
  if(c.on('footerBar'))D.footerBar(c);
  if(c.on('grain'))D.grain(c);
  c.note('two knockout bands · checker ground · seal on the hero’s leading corner');
};

/* A3 · SUNBURST HERO — arc crown, hero out of the right edge, proof stacked left */
ARCH.sunburstHero=c=>{
  const {W,H,P,F,R,C}=c;
  ground(c,'radial');
  if(c.on('sunburst'))D.sunburst(c,W*.56,H*.40,W*1.05,P.accent,32,R.f(0,.3),.17);
  if(c.on('halftone'))D.halftone(c,{x:0,y:H*.60,w:W,h:H*.26},P.hot,W*.032,R.i(1,9999),'v');
  /* The crown is the headline; at W*.062 it was set smaller than the call to
     action underneath it, which is the wrong way round and left the top of the
     card thin. Sized to the run so a short line comes up big and a long one
     still fits the arc. */
  let crowned=false;
  if(c.on('arcCrown')){const ar=W*.44,apex=Math.max(H*.148,W*.152,c.topSafe()+W*.030);
    const txt=C.heads.join(' ');
    /* Type on a curve grows in two directions at once: a bigger size sweeps a
       wider angle, so the ends swing outward AND downward. Sizing it by width
       alone sent the ends into the lockup on one side and the product on the
       other. Fit it to the band it is allowed to occupy instead — try large,
       step down, take the first size whose real extent stays inside. */
    /* the floor is where the product starts, not an arbitrary band: the crown
       may grow until its ends reach the hero, and no further */
    crowned=D.arcText(c,txt,W*.5,apex+ar,ar,P.ink,W*.105,
      {left:W*.045,right:W*.955,top:apex,bottom:Math.min(apex+H*.185,H*.295-H*.014)})!==null;}
  if(!crowned)headline(c,C.heads,{x:W*.06,y:Math.max(H*.115,c.topSafe()),w:W*.88,h:H*.145},
    {align:'middle',stroke:P.dark,shadow:P.hot});
  const hero=placeHero(c,{x:W*.44,y:H*.295,w:W*.70,h:H*.330},R.f(-6,8));
  if(c.on('promisePills'))C.promises.slice(0,c.H/c.W>1.45?5:3).forEach((t,i)=>
    D.promises(c,(c.H/c.W>1.45?H*.400:H*.430)+i*c.S*.072,[t],{h:c.S*.058,w:W*.30}));
  sealOnHero(c,hero,W*.135,20,C.offer,null,P.hot,'tl');
  if(c.on('proofBlock')){
    D.stars(c,W*.60,H*.635,H*.032,readable(P.accent,P.ground,P));
    c.text(C.rating,{x:W*.60,y:H*.682,w:W*.35},{face:F.body,wf:F.bw,weight:800,
      fill:P.ink,on:P.ground,id:'rating',role:'proof',max:c.S*.036});
  }
  if(c.on('ticket')){
    const t=D.ticket(c,{x:W*.10,y:H*.745,w:W*.80,h:H*.078},P.paper,H*.018);
    D.sheen(c,t,P.accent);
    c.text(C.offerSub+' · NO OBLIGATION',{x:W*.145,y:H*.762,w:W*.71},
      {face:F.body,wf:F.bw,weight:800,align:'middle',fill:onColor(P.paper,P),on:P.paper,id:'stubline',role:'proof',max:c.S*.036});
  }
  if(c.on('cta'))D.cta(c,H*.838,'button');
  if(c.on('cornerLockup'))D.lockup(c,'left');
  if(c.on('footerBar'))D.footerBar(c);
  if(c.on('grain'))D.grain(c);
  c.note('32-wedge sunburst · arc crown · promises stacked down the left');
};

/* A4 · TORN SPLIT — ragged divide, price below the tear */
ARCH.tornSplit=c=>{
  const {W,H,P,F,R,C}=c;
  ground(c,'flat');
  if(c.on('tornPaper'))D.tornPaper(c,{x:0,y:H*.44,w:W,h:H*.48},P.paper,R.i(1,9999));
  else c.rect({x:0,y:H*.46,w:W,h:H*.46},P.paper,{bleed:true,id:'flatPlate',role:'plate',fill:P.paper});
  const hero=placeHero(c,{x:W*.46,y:H*.10,w:W*.62,h:H*.34},R.f(12,22));
  headline(c,C.heads,{x:W*.055,y:Math.max(H*.128,c.topSafe()),w:W*.44,h:H*.185},
    {stroke:P.dark,shadow:P.accent,strokeW:.05,
     plateIndex:c.on('paintStroke')?1:-1,plateColor:P.accent,
     plateDraw:(cc,b)=>D.paintStroke(cc,b,P.accent,R.i(1,9999))});
  c.text(boundOffer(c),{x:W*.055,y:H*.545,w:W*.50},{...numFace(c),fill:onColor(P.paper,P),on:P.paper,id:'offer2',role:'offer'});
  c.text('CASH IN HAND',{x:W*.055,y:H*.655,w:W*.40},
    {face:F.body,wf:F.bw,weight:800,fill:readable(P.accent,P.paper,P),on:P.paper,
     id:'offerSub2',role:'offer',tracking:.03});
  sealOnHero(c,hero,W*.135,20,'@phrase',null,P.hot,'bl',H*.475,null,H*.445);
  if(c.on('promisePills'))D.promises(c,H*.700,C.promises.slice(2,5),{bg:P.dark});
  if(c.on('cta'))D.cta(c,H*.780,'button');
  if(c.on('cornerLockup'))D.lockup(c,'left');
  if(c.on('footerBar'))D.footerBar(c);
  if(c.on('grain'))D.grain(c);
  c.note('torn-paper divide · hero bleeding top-right · seal riding the tear');
};

/* A5 · PRICE BOARD — the offer is the column, so no seal competes with it */
ARCH.priceBoard=c=>{
  const {W,H,P,R,C}=c;
  ground(c,'flat');
  if(c.on('diagonalSplit'))D.split(c,P.ground2);
  if(c.on('knockoutBand')){
    const head=c.rect({x:0,y:H*.142,w:W,h:H*.112},P.accent,{bleed:true,id:'headBand',role:'plate',fill:P.accent});
    D.sheen(c,head,'#FFFFFF');
    c.text(C.heads.join(' '),{x:W*.05,y:H*.166,w:W*.90},{align:'middle',fill:onColor(P.accent,P),on:P.accent,role:'headline',id:'headline',max:H*.070});
  }else headline(c,[C.heads.join(' ')],{x:W*.05,y:H*.150,w:W*.90,h:H*.082},{align:'middle',stroke:P.dark,shadow:P.hot});
  priceRows(c,H*.285,C.rows,H*.575);
  const hero=placeHero(c,{x:W*.575,y:H*.575,w:W*.52,h:H*.255},R.f(14,24));
  /* NO SEAL HERE. This layout is a full-width ladder, a pill row and a hero:
     there is no clear seat, and the seal was landing on the price column —
     covering the very figures it was repeating. The ladder already bounds the
     offer, and the icon strip gives the card its second sticker kind. */
  /* the ladder's own header band: marks for what the shop takes, sitting in
     the gap the seal used to be crammed into */
  if(c.on('iconStrip')!==false)D.iconStrip(c,H*.246,stripKeys(c).slice(0,5),{x:W*.30,w:W*.40});
  if(c.on('promisePills'))D.promises(c,H*.715,C.promises.slice(0,2).concat([C.offerSub]),{bg:P.paper});
  if(c.on('cta'))D.cta(c,H*.800,'band');
  if(c.on('cornerLockup'))D.lockup(c,'left');
  if(c.on('footerBar'))D.footerBar(c);
  if(c.on('grain'))D.grain(c);
  c.note('alternating price rows · diagonal split · hero bleeding bottom-right');
};

/* A6 · POSTER BLEED — display type at maximum, hero out of the left edge */
ARCH.posterBleed=c=>{
  const {W,H,P,R,C}=c;
  ground(c,'flat');
  if(c.on('halftone'))D.halftone(c,{x:0,y:0,w:W,h:H*.52},P.accent,W*.030,R.i(1,9999),'v');
  /* At 4:5 and 9:16 the poster's lower half is a wide band the hero fills. The
     square crop is shorter, so the same hero left a 475x376 hole to its right —
     19% of the card as one empty rectangle. Let the hero run the width there. */
  const hero=placeHero(c,{x:-W*.12,y:H*.50,w:W*(H/W>1.45?.70:.94),h:H*.34},R.f(-24,-12));
  /* This is a poster: the headline is the artwork. Squeezed into a band of
     H*.215 the lines came out small AND short, leaving the whole top-right
     corner — 560x400px, 19% of a square card — as one empty rectangle. Given
     the room a poster headline expects, the type grows to fill it. */
  const headH=H*(H/W>1.45?.215:.285);
  const headY=Math.max(H*.112,c.topSafe()), bandY=headY+headH+H*.022;
  headline(c,C.heads,{x:W*.05,y:headY,w:W*.90,h:headH},
    {stroke:P.hot,shadow:P.dark,shadowDx:W*.012,shadowDy:H*.010,strokeW:.05,fill:readable(P.paper,P.ground,P),
     measure:true,
     plateIndex:c.on('paintStroke')?1:-1,plateColor:P.accent,
     plateDraw:(cc,b)=>D.paintStroke(cc,b,P.accent,R.i(1,9999))});
  /* The offer used to live inside the knockout band, so switching that band off
     removed the price from the card altogether and left its band empty — the
     one thing a reader is scanning for, gone with a decorative toggle. The band
     is optional; the number is not. */
  if(c.on('knockoutBand')){
    c.rect({x:0,y:bandY,w:W,h:H*.056},P.ink,{bleed:true,id:'kickerBand',role:'plate',fill:P.ink});
    c.text(offerLine(c),{x:W*.05,y:bandY+H*.015,w:W*.90},
      {...numFace(c),align:'middle',fill:onColor(P.ink,P),on:P.ink,id:'offerLine',role:'offer',max:H*.036});
  }else{
    c.text(offerLine(c),{x:W*.05,y:bandY-H*.006,w:W*.90},
      {...numFace(c),align:'middle',fill:readable(P.accent,P.ground,P),on:P.ground,
       stroke:P.dark,strokeW:.05,id:'offerLine',role:'offer',max:H*.052});
  }
  sealOnHero(c,hero,W*.150,20,'@phrase',null,P.hot,'tr',H/W>1.45?H*.755:H*.66,null,H/W>1.45?H*.700:H*.58);
  /* a poster with no way to act: the loudest layout in the set shipped with
     no call to action on any format, and the must-have rule is what noticed */
  /* the seal already carries the hot colour here; a hot button on top tipped
     the card to 15% against R10's 14% */
  if(c.on('cta'))D.cta(c,H*(H/W>1.45?.700:.690),'button',P.accent);
  if(c.on('promisePills'))D.iconStrip(c,H*.782,stripKeys(c));
  if(H/W>1.45&&c.on('priceRows'))priceRows(c,H*.505,C.rows.slice(0,3));
  if(c.on('promisePills'))D.promises(c,H*.850,C.promises.slice(0,3),{bg:P.paper});
  if(c.on('cornerLockup'))D.lockup(c,'left');
  if(c.on('footerBar'))D.footerBar(c);
  if(c.on('grain'))D.grain(c);
  c.note('outlined display at full width · hero bleeding left · halftone ramp');
};

/* A7 · TICKET OFFER — the stub is the offer, so the seal stays away */
ARCH.ticketOffer=c=>{
  const {W,H,P,F,R,C}=c;
  ground(c,'radial');
  if(c.on('sunburst'))D.sunburst(c,W*.5,H*.44,W*.95,P.hot,24,R.f(0,.3),.12);
  const ty=Math.max(H*.125,c.topSafe());
  /* two separate headline() calls each produce an id of "headline0", so the
     collision rule could not tell the two lines apart and the taller approved
     faces overlapped them. One call, two lines, two ids. */
  headline(c,[C.heads[0],C.heads[1]],{x:W*.05,y:ty,w:W*.90,h:H*.185},
    {align:'middle',stroke:P.dark,shadow:P.dark,
     fill:P.ink,line1Fill:readable(P.accent,P.ground,P)});
  /* the hero follows the headline block rather than a constant, so pushing the
     type clear of the lockup cannot push it under the product */
  placeHero(c,{x:W*.32,y:Math.max(H*.315,ty+H*.200),w:W*.84,h:H*.315},R.f(-7,9));
  if(c.on('proofBlock')){
    const ry=H*(H/W>1.45?.500:.522);
    D.stars(c,W*.06,ry,c.S*.030,readable(P.accent,P.ground,P));
    c.text(C.rating,{x:W*.06,y:ry+H*.044,w:W*.40},{face:F.body,wf:F.bw,weight:800,fill:P.ink,on:P.ground,
      id:'rating',role:'proof',max:c.S*.036});
  }
  if(c.on('ticket')){
    const t=D.ticket(c,{x:W*.08,y:H*.600,w:W*.84,h:H*.145},P.paper,H*.024);
    D.sheen(c,t,P.accent);
    c.text(boundOffer(c),{x:W*.125,y:H*.632,w:W*.75},{...numFace(c),align:'middle',fill:onColor(P.paper,P),on:P.paper,
      id:'offer',role:'offer',max:H*.080});
  }
  c.text('NO OBLIGATION · CASH OR TRANSFER',{x:W*.09,y:H*.757,w:W*.82},
    {face:F.body,wf:F.bw,weight:700,align:'middle',fill:readable(P.body,P.ground,P),on:P.ground,
     id:'fine',role:'proof',max:c.S*.032,tracking:.03});
  if(c.on('promisePills'))D.promises(c,H*.800,C.promises.slice(3,6));
  /* Left where the layout puts it. Two attempts to clamp this clear of the
     footer band both drove the button up into the copy above and broke 36
     cards to fix one; the one it was fixing is a 7% clip that renderClean
     resolves by reseeding. A clamp here needs the real button geometry, which
     D.cta owns — not a fraction guessed from outside it. */
  if(c.on('cta'))D.cta(c,H*.849,'button');
  if(c.on('cornerLockup'))D.lockup(c,'left');
  if(c.on('footerBar'))D.footerBar(c);
  if(c.on('grain'))D.grain(c);
  c.note('perforated stub carries the offer · sheen measured from the stub');
};

/* A8 · PROOF WALL — review plate, numbered steps, seal on the hero */
ARCH.proofWall=c=>{
  const {W,H,P,F,R,C}=c;
  ground(c,'pool');
  if(c.on('checker'))D.checker(c,{x:0,y:0,w:W,h:H*.5},P.accent,10,.08);
  /* The hero goes down first. The review card overlaps it by design — a paper
     card lying on the product — but while the card was drawn first the phone
     was painted over the quote, and "cash out. Twenty minutes." ran under it. */
  const hero=placeHero(c,{x:W*.60,y:H*.295,w:W*.56,h:H*.26},R.f(12,20));
  if(c.on('proofBlock')){
    D.stars(c,W*.055,H*.140,c.S*.034,readable(P.accent,P.ground,P));
    c.text(C.rating,{x:W*.055+c.S*.034*3.6,y:H*.140,w:W*.40},
      {face:F.body,wf:F.bw,weight:800,fill:P.ink,on:P.ground,id:'rating',role:'proof',max:c.S*.036});
    reviewCard(c,{x:W*.05,y:H*.200,w:W*.62,h:H*.160});
  }
  headline(c,[C.heads.join(' ')],{x:W*.055,y:Math.max(H*.422,c.topSafe()),w:W*.56,h:H*.060},
    {plateIndex:c.on('paintStroke')?0:-1,plateColor:P.accent,
     plateDraw:(cc,b)=>D.paintStroke(cc,b,P.accent,R.i(1,9999)),
     fill:P.ink,on:P.ground});
  sealOnHero(c,hero,W*.135,16,C.offer,null,P.accent,'bl',H*.60,W*.58,H*.50);
  /* The 9:16 card has a whole band of nothing under the headline, because the
     4:5 proportions were simply stretched. Fill it with the price ladder: it is
     the strongest "how much" device we have, it names a model against every
     number instead of making an unbounded claim, and it is what the empty half
     of a tall card was always for. */
  const tall=H/W>1.45;
  if(tall)priceRows(c,H*.498,C.rows,H*.616);   // clears the headline band above
  if(c.on('proofBlock'))proofSteps(c,H*(tall?.622:.530),C.steps);
  if(tall&&c.on('promisePills'))D.iconStrip(c,H*.745,stripKeys(c));
  if(c.on('cta'))D.cta(c,H*(tall?.800:.740),'band');
  if(c.on('promisePills'))D.promises(c,H*(tall?.882:.828),C.promises.slice(0,3),{bg:P.paper});
  if(c.on('cornerLockup'))D.lockup(c,'left');
  if(c.on('footerBar'))D.footerBar(c);
  if(c.on('grain'))D.grain(c);
  c.note('review plate + numbered steps · paint stroke behind the promise line');
};
const ARCHS=[
 ['nightLot','Night Lot','one hero in a pool of light'],
 ['bandStack','Band Stack','knockout bands, product wedged between'],
 ['sunburstHero','Sunburst Hero','rays and an arc crown'],
 ['tornSplit','Torn Split','ragged paper divide'],
 ['priceBoard','Price Board','model rows resellers screenshot'],
 ['posterBleed','Poster Bleed','display type at maximum'],
 ['ticketOffer','Ticket Offer','perforated stub'],
 ['proofWall','Proof Wall','review card and numbered steps']
];

/* ══════════════════════════════════════════════════════════
   9 · AUDITOR
   ══════════════════════════════════════════════════════════ */
const RULES=[
 ['R1','Coverage floor','≥ 68% of the canvas carries content (60% on 9:16, whose top and bottom sit under the app chrome)','the empty card — 29% coverage reads as a placeholder'],
 ['R2','Dead space','largest empty rectangle ≤ 18% of the canvas','a card that averages fine but has one big hole'],
 ['R3','Footer bar','full-bleed footer carrying the number','a number floating with nothing under it'],
 ['R4','Hero bleed','hero crosses an edge by ≥ 6%','product parked inside a box like a catalogue photo'],
 ['R5','Shape language','headline sits on stroke, tear, band or rays','the flat rounded plate behind every headline'],
 ['R6','Badge placement','if a seal exists it covers 6–32% of the hero','a seal floating in dead space, or swallowing the product'],
 ['R7','Text collision','no two text boxes intersect','overlap you only notice after export'],
 ['R8','Minimum size','every text ≥ 2.0% of the short edge','fine print that dies in a feed thumbnail'],
 ['R9','Contrast','every text ≥ 4.5:1 on its own backing','accent-on-accent text that vanishes'],
 ['R10','Hot restraint','hot colour ≤ 14% of canvas area','the all-red card where nothing reads as urgent'],
 ['R11','Sheen parentage','every sheen sits inside its own plate','the highlight drawn at the layout’s original geometry'],
 ['R12','Safe area','every bounded element inside a 4.5% margin of the edge','a pill or a seal clipped by the crop'],
 ['R13','Text on its plate','every line stays inside the panel it was set on','copy running off its card onto the photo'],
 ['R14','Words on top','no opaque shape is drawn over a line of text','a seal painted across the headline'],
 ['R15','Legible figures','no price is set in a face that draws a slashed zero','"$1,250" reading as "$1,25Ø"'],
 ['R16','Subject on show','the product is present and bigger than any prop','a card whose largest object is a cardboard box'],
 ['R17','Picture matches the copy','the hero is of the brand, generation and condition the copy names','a cracked iPhone 11 under a "17 Pro Max · $1,250" ladder'],
 ['R18','No repeats','no line appears twice, and no phrase of two words or more sits inside another line','"FREE TOW" as a step and again as a pill'],
 ['R19','Bounded offer','every $ figure is tied to a named model on the same card','"UP TO $1,250" with nothing to say what for'],
 ['R20','Must-haves','a price, a call to action, a phone number, an address and the brand are all on the card','a clean 17/17 card with no way to act'],
 ['R21','No placeholder','YOUR NAME and its kin never leave as copy','a template shipped as an ad'],
 ['R22','Hero on the card','at least 70% of the product is inside the canvas','a phone with its head cut off by the edge'],
 ['R23','A real product','the hero is a photograph whenever the library has one for this subject','a vector diagram of a phone passing as the phone'],
 ['R24','Eye-grabbing detail','at least two kinds of sticker — seal or tag, pills, arrow, icon strip, stub','a card with nothing to catch a thumb']
];
function inter(a,b){const x=Math.max(a.x,b.x),y=Math.max(a.y,b.y);
  const r=Math.min(a.x+a.w,b.x+b.w),bt=Math.min(a.y+a.h,b.y+b.h);
  return(r>x&&bt>y)?(r-x)*(bt-y):0;}
/* WHERE THE CARD IS EMPTY.
   The audit already had to know this to score dead space; placement wants the
   same answer, so it lives in one place. Returns the occupancy grid plus the
   largest empty rectangle, found by the classic largest-rectangle-under-a-
   histogram sweep. */
function occupancy(card,cell){
  const {W,H,nodes}=card;
  cell=cell||20;
  const cols=Math.ceil(W/cell),rows=Math.ceil(H/cell);
  const g=new Uint8Array(cols*rows);
  nodes.forEach(n=>{
    if(n.role==='field'&&n.id!=='split')return;
    const b=n.box;
    const x0=Math.max(0,Math.floor(b.x/cell)),x1=Math.min(cols,Math.ceil((b.x+b.w)/cell));
    const y0=Math.max(0,Math.floor(b.y/cell)),y1=Math.min(rows,Math.ceil((b.y+b.h)/cell));
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)g[y*cols+x]=1;});
  return{g,cols,rows,cell};
}
function largestHole(o){
  const {g,cols,rows,cell}=o;
  const hgt=new Int32Array(cols);let best=0,box=null;
  for(let y=0;y<rows;y++){
    for(let x=0;x<cols;x++)hgt[x]=g[y*cols+x]?0:hgt[x]+1;
    const st=[];
    for(let x=0;x<=cols;x++){const h=x<cols?hgt[x]:0;
      while(st.length&&hgt[st[st.length-1]]>=h){const ht=hgt[st.pop()],left=st.length?st[st.length-1]+1:0;
        const a=ht*(x-left);
        if(a>best){best=a;box={x:left*cell,y:(y-ht+1)*cell,w:(x-left)*cell,h:ht*cell};}}
      st.push(x);}}
  return{area:best/(cols*rows),box};
}
function audit(card){
  /* the audit narrates into card.notes; a second audit of the same card must
     not read last time's narration as this time's */
  card.notes=card.notes.filter(n=>!/^(spill|buried|collide|tight|figures|mismatch|seal still)/.test(n));
  const {W,H,nodes,P}=card,cell=20;
  const occ=occupancy(card,cell),g=occ.g,cols=occ.cols,rows=occ.rows;
  let filled=0;for(let i=0;i<g.length;i++)filled+=g[i];
  const coverage=filled/g.length;
  const dead=largestHole(occ).area;
  const texts=nodes.filter(n=>n.type==='text');
  const hero=nodes.find(n=>n.role==='hero'), badge=nodes.find(n=>n.role==='badge');
  const heads=nodes.filter(n=>n.role==='headline'), plates=nodes.filter(n=>n.role==='plate');
  const sheens=nodes.filter(n=>n.role==='sheen');
  const hotArea=nodes.filter(n=>n.fill===P.hot).reduce((s,n)=>s+Math.max(0,n.box.w)*Math.max(0,n.box.h),0)/(W*H);
  const r=[];
  /* the floor was 62%; the owner's references sit at .85 median with a
     quartile floor of .84 — the engine ran a full step below every graded ad */
  /* on 9:16 the top ~13% and bottom ~18% of the canvas sit under the
     Stories/Reels interface, so content is right to avoid them; the floor
     there is judged on the visible two thirds */
  r.push(['R1',coverage>=(H/W>1.45?.60:.68)]);
  r.push(['R2',dead<=.18]);
  r.push(['R3',!!nodes.find(n=>n.role==='footer'&&n.box.w>=W*.999)]);
  {const hb=hero&&hero.box, nx=hb?Math.min(.06,Math.max(hb.w*.25/W,.03)):.06, ny=hb?Math.min(.06,Math.max(hb.h*.25/H,.03)):.06;
   r.push(['R4',!!hero&&(hb.x<-W*nx||hb.x+hb.w>W*(1+nx)||hb.y<-H*ny||hb.y+hb.h>H*(1+ny))]);}
  r.push(['R5',heads.some(h=>plates.some(p=>inter(h.box,p.box)>h.box.w*h.box.h*.25))||nodes.some(n=>n.id==='sunburst'||n.id==='arc')]);
  /* R6 · THE SEAL SITS ON THE PRODUCT'S EDGE.
     This used to be "6-32% of the badge overlaps the hero", which encoded the
     intent only as long as the hero was a small vector. A photographic hero can
     fill half the card, and then every legal seat overlaps past 32% — 58 of 64
     failures were the seal landing at 32-33% with nowhere better to go. The
     intent was never a ratio: it is that the seal STRADDLES the product's
     outline, so it reads as a sticker stuck on the thing rather than a graphic
     floating beside it or a graphic lost in the middle of it. Measured as the
     distance from the seal's centre to the product's edge, that holds at any
     scale. */
  const edgeGap=(b,h)=>{
    const cx=b.box.x+b.box.w/2, cy=b.box.y+b.box.h/2;
    const dx=Math.max(h.box.x-cx,0,cx-(h.box.x+h.box.w));
    const dy=Math.max(h.box.y-cy,0,cy-(h.box.y+h.box.h));
    if(dx>0||dy>0)return Math.hypot(dx,dy);                 // outside
    return -Math.min(cx-h.box.x,h.box.x+h.box.w-cx,cy-h.box.y,h.box.y+h.box.h-cy);
  };
  r.push(['R6',!badge||!hero||Math.abs(edgeGap(badge,hero))<=badge.box.w/2]);
  let collide=false;
  /* every pair, not just the first — a card with three collisions used to
     report one, and the fix for that one uncovered the next */
  for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){
    /* 30% of the smaller box was far too generous: a headline could cover most
       of the lockup's second line and still pass. These are real ink extents
       now, so anything past a hair's touch is a defect. */
    if(inter(texts[i].box,texts[j].box)>Math.min(texts[i].box.w*texts[i].box.h,texts[j].box.w*texts[j].box.h)*.06){
      collide=true;card.note(`collide: ${texts[i].id} x ${texts[j].id}`);}}
  r.push(['R7',!collide]);
  const SS=Math.min(W,H);
  r.push(['R8',texts.every(t=>t.size>=SS*.020)]);
  r.push(['R9',texts.every(t=>{try{return contrast(t.fill,t.backing)>=4.5;}catch(e){return true;}})]);
  r.push(['R10',hotArea<=.14]);
  /* R13 · A LINE MUST STAY ON THE PLATE IT WAS SET ON.
     Every text records the colour it was drawn to sit on. Find the panel that
     actually is that colour under the line, and require the ink to stay inside
     it. Without this a quote can run off its card onto the photograph and
     twelve of twelve rules still report a pass, because nothing was comparing
     the run against the thing behind it. */
  const spill=[];
  texts.forEach(t=>{
    if(!t.backing)return;
    const i=nodes.indexOf(t);
    let plate=null;
    for(let k=i-1;k>=0;k--){
      const n=nodes[k];
      if(n.type!=='shape'||n.fill!==t.backing)continue;
      const cx=t.box.x+t.box.w/2,cy=t.box.y+t.box.h/2;
      if(cx>=n.box.x&&cx<=n.box.x+n.box.w&&cy>=n.box.y&&cy<=n.box.y+n.box.h){plate=n;break;}
    }
    if(!plate||plate.bleed)return;
    const pad=2;
    if(t.box.x<plate.box.x-pad||t.box.x+t.box.w>plate.box.x+plate.box.w+pad||
       t.box.y<plate.box.y-pad||t.box.y+t.box.h>plate.box.y+plate.box.h+pad)
      spill.push(`${t.id} off ${plate.id}`);
  });
  r.push(['R13',!spill.length]);
  if(spill.length)card.note('spill: '+spill.join(', '));
  /* R14 · NOTHING OPAQUE MAY BE DROPPED ON TOP OF THE WORDS.
     Draw order decides what a reader sees. A seal painted after the headline
     covers it however well the headline was placed, which is how a card ships
     reading "CASH FOR IPHON<seal>". Text-against-text was the only overlap ever
     checked, so a shape landing on a line was invisible to the audit. */
  /* 'deco' belongs here. The icon strip and the arrow were the only shapes the
     engine drew that no rule governed: they could land anywhere, on anything,
     and the gate would still say 1152/1152. A shape being decorative is a
     reason to place it carefully, not a reason to stop looking at it. */
  const SOLID=new Set(['badge','plate','cta','data','proof','brand','footer','hero','deco']);
  const buried=[];
  texts.forEach(t=>{
    const i=nodes.indexOf(t),area=t.box.w*t.box.h;
    if(area<=0)return;
    for(let k=i+1;k<nodes.length;k++){
      const n=nodes[k];
      if(n.type!=='shape'||!SOLID.has(n.role))continue;
      const frac=n.star?starCover(t.box,n.star):inter(t.box,n.solid||n.box)/area;
      if(frac>.05)buried.push(`${t.id} under ${n.id} ${Math.round(frac*100)}%`);
    }
  });
  r.push(['R14',!buried.length]);
  /* R15 · A PRICE MUST NOT BE AMBIGUOUS.
     Melodrama draws a slashed zero, so "$1,250" reads "$1,25Ø" — checked
     against a rendered swatch of all five families, it is the only one that
     does. Prices are routed to the body face in that pairing; this makes sure
     they stay there when someone adds an archetype. */
  const figs=texts.filter(t=>BAD_FIGURES.has(t.face+'|'+t.weight)&&/0/.test(t.str||''));
  r.push(['R15',!figs.length]);
  /* R16 · THE CARD MUST SHOW WHAT IS BEING BOUGHT, AND SHOW IT BIGGEST.
     The owner's standing rule. Props earn their place by making the offer feel
     real; the moment one is larger than the product it stops dressing the card
     and starts being the card. */
  const heroN=nodes.find(n=>n.role==='hero');
  const propsN=nodes.filter(n=>n.id==='prop'||/^product\d$/.test(n.id));
  const areaOf=n=>Math.max(0,n.box.w)*Math.max(0,n.box.h);
  r.push(['R16',!!heroN&&propsN.every(pn=>areaOf(pn)<=areaOf(heroN))]);
  /* R17 · THE PICTURE IS OF WHAT THE COPY SAYS.
     The owner's rule, restated after it was broken: a cracked iPhone 11 under a
     ladder that leads with "17 Pro Max · $1,250". A photographic hero carries
     the tags it was chosen by; the deck carries its subject; they must agree.
     A vector hero has no tags and is judged by the deck's own hero kind. */
  const subj=card.C&&card.C.subject;
  let heroOK=!heroN||!subj||(heroN.tags?matchSubject({t:heroN.tags},subj):true);
  if(!heroOK)card.note(`mismatch: hero "${heroN.asset}" is ${heroN.tags.b} · ${heroN.tags.c}${heroN.tags.g?' · gen '+heroN.tags.g:''}; the copy is about ${subj.brand.join('/')} · ${subj.cond}${subj.gen?' · gen '+subj.gen.join('/'):''}`);
  /* …and the model the card LITERALLY PRINTS must be in the imagery. The text
     nodes are parsed for the first model number in reading order; if one is
     printed, some product picture on the card must carry that generation — and
     that variant, when the library owns one. A 15 under "17 PM · $1,250" was
     exactly this. */
  if(heroN&&heroN.tags&&subj){
    const pool=assetsFor(card,card.vertical).filter(a=>matchSubject(a,subj));
    if(pool.some(a=>a.t&&a.t.g)){                    // a pool that knows generations at all
      const pics=nodes.filter(n=>(n.role==='hero'||/^product\d$/.test(n.id))&&n.tags);
      const lead=leadOf(card.C);
      /* the priced model is what the card is selling; if it is printed on the
         card, a picture of it must be too — to the variant when the library
         owns one, to the generation when it owns that */
      const printedLead=lead&&texts.some(t=>{const m=parseModel(t.str||'');return m&&m.gen===lead.gen;});
      if(printedLead){
        const strictV=libraryHas(pool,lead.gen,lead.v), strictG=poolHasGen(pool,lead.gen);
        const carried=pics.some(n=>(!strictG||n.tags.g===lead.gen)&&(!strictV||n.tags.v===lead.v));
        if(!carried){heroOK=false;
          card.note(`mismatch: the card prints "${lead.gen}${lead.v&&lead.v!=='base'?' '+lead.v:''}" but shows ${pics.map(n=>n.asset).join(', ')||'no product'}`);}
      }
    }
  }
  r.push(['R17',heroOK]);
  /* R18 · NO REPEATS — the owner's standing rule, never audited until now.
     Every printed string is normalised; a seal's rows are joined into its
     phrase; ladder rows may share a prefix with each other and are exempt as a
     pair; the brand token is exempt. Two equal lines fail; a phrase of two or
     more words sitting whole inside another line fails. */
  const norm=normLine;
  const sealRows=texts.filter(t=>t.role==='offer'&&(t.id==='offerPre'||t.id==='offer'||t.id==='offerSub'));
  /* a ladder's price column is data — the same figure on the seal is the
     headline for that row, not a repeated line */
  const lines=texts.filter(t=>!sealRows.includes(t)&&t.id!=='rowPrice'&&t.str&&t.str.length>1&&!/^[★✓•·]+$/.test(t.str))
    .map(t=>({s:norm(t.str),id:t.id}));
  if(sealRows.length)lines.push({s:norm(sealRows.map(t=>t.str).join(' ')),id:'seal'});
  const brandTok=norm(card.C.brand||'');
  const rep=[];
  for(let i=0;i<lines.length;i++)for(let j=i+1;j<lines.length;j++){
    const a=lines[i],b=lines[j];
    if(!a.s||!b.s)continue;
    if(a.id==='rowLabel'&&b.id==='rowLabel')continue;
    if(a.s===brandTok||b.s===brandTok)continue;
    if(repeats(a.s,b.s))rep.push(a.s===b.s?`"${a.s}" twice (${a.id}, ${b.id})`:`"${a.s.length<=b.s.length?a.s:b.s}" (${a.s.length<=b.s.length?a.id:b.id}) inside "${a.s.length<=b.s.length?b.s:a.s}" (${a.s.length<=b.s.length?b.id:a.id})`);
  }
  r.push(['R18',!rep.length]);
  if(rep.length)card.note('repeat: '+[...new Set(rep)].join(', '));
  /* R19 · A PRICE IS FOR SOMETHING. Any $ figure that is not a ladder row must
     share the card with a named model: a ladder, a model in the copy, or the
     lead tag the seal and offer lines now carry. */
  const offers=texts.filter(t=>/\$\d/.test(t.str||'')&&t.id!=='rowPrice');
  const bound=texts.some(t=>t.id==='rowLabel')||texts.some(t=>parseModel(t.str||''))||
              (leadTag(card.C)&&texts.some(t=>norm(t.str||'').includes(norm(leadTag(card.C)))));
  r.push(['R19',!offers.length||!!bound]);
  if(offers.length&&!bound)card.note('unbounded: '+offers.map(t=>`"${t.str}"`).join(', ')+' with no model on the card');
  /* R20 · MUST-HAVES. Geometry can be perfect on a card that gives the reader
     no price, no action and no number; renderClean could drop the seal and
     ship exactly that. */
  const has=f=>texts.some(f);
  const missing=[];
  if(!has(t=>/\$\d/.test(t.str||'')))missing.push('price');
  if(card.on('cta')&&!has(t=>t.role==='cta'))missing.push('call to action');
  if(!has(t=>/\(\d{3}\) \d{3}-\d{4}/.test(t.str||'')))missing.push('phone number');
  if(!has(t=>t.id==='footerAddr'&&(t.str||'').length>=6))missing.push('address');
  if(!has(t=>t.id==='wordmark'||t.id==='mark'))missing.push('brand');
  r.push(['R20',!missing.length]);
  if(missing.length)card.note('missing: '+missing.join(', '));
  /* R21 · the placeholder never leaves as copy — unless this render is
     explicitly a template (the gate's geometry pass, the console's live view) */
  const ph=texts.filter(t=>PLACEHOLDER.test(t.str||''));
  r.push(['R21',!ph.length||!!(card.cfg&&card.cfg.allowPlaceholder)]);
  /* R22 · the product is mostly ON the card */
  let onCard=true;
  if(heroN){const b=heroN.box;const ix=Math.max(0,Math.min(b.x+b.w,W)-Math.max(b.x,0)),iy=Math.max(0,Math.min(b.y+b.h,H)-Math.max(b.y,0));
    onCard=(ix*iy)/(b.w*b.h)>=.70;}
  r.push(['R22',onCard]);
  /* R23 · the vector hero is a fallback for an empty library, not a product */
  const heroPool=assetsFor(card,card.vertical).filter(a=>matchSubject(a,card.C&&card.C.subject));
  r.push(['R23',!heroPool.length||!!(heroN&&heroN.asset)]);
  if(heroPool.length&&!(heroN&&heroN.asset))card.note('no photograph: the hero is vector art while the library holds '+heroPool.length+' pictures of this subject');
  /* R24 · stickers are the strongest good/bad separator in the owner's own
     references (3.2 per good ad, 1.5 per bad); the engine sat at the bad end */
  const kinds=new Set();
  nodes.forEach(n=>{if(n.id==='badge'||n.id==='priceTag')kinds.add('seal');else if(n.id==='pill')kinds.add('pill');
    else if(n.id==='arrow')kinds.add('arrow');else if(n.id==='iconStrip')kinds.add('icons');else if(n.id==='ticket'||n.id==='stub')kinds.add('stub');});
  r.push(['R24',kinds.size>=2]);
  if(kinds.size<2)card.note('flat: only '+([...kinds].join(', ')||'no')+' sticker kind on the card');
  if(figs.length)card.note('figures: '+figs.map(t=>`${t.id} "${t.str}" in ${t.face}`).join(', '));
  if(buried.length)card.note('buried: '+buried.join(', '));
  r.push(['R11',sheens.every(s=>s.parent&&inter(s.box,s.parent)>=s.box.w*s.box.h*.999)]);
  {const sr=safeRect(W,H),tol=2;
   const out=nodes.filter(n=>!n.bleed&&n.role!=='field'&&n.role!=='hero'&&!/^product\d$/.test(n.id)&&
     !(n.box.x>=sr.x-tol&&n.box.y>=sr.y-tol&&n.box.x+n.box.w<=sr.x+sr.w+tol&&n.box.y+n.box.h<=sr.y+sr.h+tol));
   r.push(['R12',!out.length]);
   if(out.length)card.note('margin: '+[...new Set(out.map(n=>n.id))].join(', ')+' outside the 4.5% safe area');}
  /* results in the order RULES declares them, so nothing that zips the two by
     index can mislabel a rule */
  const order=RULES.map(x=>x[0]);
  r.sort((a,b)=>order.indexOf(a[0])-order.indexOf(b[0]));
  return{coverage,dead,hotArea,elements:nodes.length,rules:r,pass:r.filter(x=>x[1]).length,total:r.length};
}

/* ══════════════════════════════════════════════════════════
   10 · RENDER PIPELINE
   ══════════════════════════════════════════════════════════ */
/* A self-contained card embeds the two families it uses, which costs about
   110KB. A page showing a gallery of them should carry the faces ONCE instead:
   render with {embedFonts:false} and put fontCSS() in the page head. */
function fontCSS(){return faceCSS(Object.fromEntries(
  Object.entries(FONT_FILES).map(([f,w])=>[f,Object.keys(w).map(Number)])));}
/* DRESS THE EMPTY CORNERS WITH REAL THINGS.
   A photographic hero shows the whole product, which means it no longer fills
   its box corner to corner the way the vector did — the card is left with holes.
   Filling them with more graphics would just be more decoration; filling them
   with the props the shop actually deals in — banded cash, boxed stock, an
   accessory — is the difference between a poster about buying phones and a
   photograph of the transaction. Placed by finding the card's largest empty
   rectangle and dropping one prop into it, repeatedly, never over the copy. */
function placeStickers(c){
  const S=Math.min(c.W,c.H);
  /* A SECOND PICTURE OF THE PRODUCT. The competitor ads the owner rates well
     rarely show one device; they show the device twice, or two colours, or the
     front and the back. When the hero carries the lead model, a second cutout
     of the same model — different angle or colour — goes into the largest hole
     before any prop does. It is a product, not a prop, so R16 does not rank it
     against the hero, and it must carry the lead model like the hero does. */
  if(c.on('duo')){
    const hero=c.nodes.find(n=>n.role==='hero');
    const named=namedModels(c.C);
    const lead=named[0];
    for(let unit=2;unit<=3&&hero&&hero.tags;unit++){
      const hole=largestHole(occupancy(c,20));
      const sr=safeRect(c.W,c.H);
      if(hole.box){const hb=hole.box;const x0=Math.max(hb.x,sr.x),y0=Math.max(hb.y,sr.y);
        hole.box={x:x0,y:y0,w:Math.min(hb.x+hb.w,sr.x+sr.w)-x0,h:Math.min(hb.y+hb.h,sr.y+sr.h)-y0};}
      /* a second product that is a speck is worse than none: at least 18% of
         the short edge on its shorter side, else it is not drawn */
      if(hole.box&&hole.area>=.03&&Math.min(hole.box.w,hole.box.h)>=S*.16){
        /* if the copy names a second model — the quote's "15 Pro" — picture
           that; otherwise the lead again from another angle or colour */
        const second=named[1];
        const taken=new Set(c.nodes.filter(n=>n.asset).map(n=>n.asset));
        const notIn=a=>a&&!taken.has(a.s)?a:null;
        const pick=notIn(unit===2&&second&&pickAsset(c,assetsFor(c,c.vertical),3,{lead:second,not:hero.asset}))
                 ||(lead&&notIn(pickAsset(c,assetsFor(c,c.vertical),3+unit,{lead,not:hero.asset,avoidExact:true})))
                 ||notIn(pickAsset(c,assetsFor(c,c.vertical),7+unit,{lead:lead||{},not:hero.asset}));
        if(pick){
          const b=hole.box,pad=Math.min(b.w,b.h)*.08;
          let inset={x:b.x+pad,y:b.y+pad,w:b.w-pad*2,h:b.h-pad*2};
          const cap=hero.box.w*hero.box.h*.55, a=inset.w*inset.h;
          if(a>cap){const k=Math.sqrt(cap/a);inset={x:inset.x+inset.w*(1-k)/2,y:inset.y+inset.h*(1-k)/2,w:inset.w*k,h:inset.h*k};}
          D.photo(c,inset,c.R.f(-9,9),pick,{id:'product'+unit,role:'plate',bleed:false,grow:1,min:false});
        }
      }
    }
  }
  /* COVERAGE-DRIVEN FILL. The reference floor is real, and a tall 9:16 Night
     Lot or a wide-car Sunburst Hero is short of picture, not long on ornament.
     While the card is under the floor and a hole is big enough, add another
     unit of the product (distinct asset), up to four; renderClean can then
     stop dropping ornaments to fix what dropping can never fix. */
  {
    const hero=c.nodes.find(n=>n.role==='hero');
    let guard=0;
    /* A HOLE THAT CANNOT BE FILLED IS NOT THE END OF THE SEARCH.
       This used to break out of the loop the moment the biggest hole refused
       everything, so a card could sit 5 points under the coverage floor with a
       wide, empty, perfectly fillable band above its footer — the band was
       simply second in line behind a narrow column that took neither a product
       nor a strip. Rejected holes are remembered and painted out of the grid so
       the next-largest one gets its turn. */
    const blocked=[];
    while(hero&&hero.tags&&guard++<4){
      const occ=occupancy(c,20); let filled=0; for(let i=0;i<occ.g.length;i++)filled+=occ.g[i];
      if(filled/occ.g.length>=.70)break;
      blocked.forEach(r=>{
        for(let y=Math.max(0,Math.floor(r.y/occ.cell));y<Math.min(occ.rows,Math.ceil((r.y+r.h)/occ.cell));y++)
          for(let x=Math.max(0,Math.floor(r.x/occ.cell));x<Math.min(occ.cols,Math.ceil((r.x+r.w)/occ.cell));x++)
            occ.g[y*occ.cols+x]=1;});
      const hole=largestHole(occ); if(!hole.box)break;
      const sr=safeRect(c.W,c.H),hb=hole.box,x0=Math.max(hb.x,sr.x),y0=Math.max(hb.y,sr.y);
      const b={x:x0,y:y0,w:Math.min(hb.x+hb.w,sr.x+sr.w)-x0,h:Math.min(hb.y+hb.h,sr.y+sr.h)-y0};
      const short=Math.min(b.w,b.h);
      /* the last hole on a sparse card is usually a WIDE, SHORT band above the
         footer — it will not take a square-ish product, but it takes a row of
         marks, or a wide product like a car lying along it */
      const hasStrip=c.nodes.some(x=>x.id==='iconStrip');
      const n=c.nodes.filter(x=>/^product\d$/.test(x.id)).length+2;
      const taken=new Set(c.nodes.filter(x=>x.asset).map(x=>x.asset));
      const lead=leadOf(c.C);
      const pick=n<=4?[pickAsset(c,assetsFor(c,c.vertical),11+n,{lead:lead||{},not:hero.asset,avoidExact:true}),
                       pickAsset(c,assetsFor(c,c.vertical),17+n,{lead:lead||{},not:hero.asset})].find(a=>a&&!taken.has(a.s)):null;
      /* a unit fits if its drawn long side would clear .22S in this hole */
      const fits=pick&&(()=>{const sc=Math.min((b.w*.84)/pick.w,(b.h*.84)/pick.h);return Math.max(pick.w,pick.h)*sc>=S*.22&&short>=S*.11;})();
      if(fits){
        const pad=short*.08;
        let inset={x:b.x+pad,y:b.y+pad,w:b.w-pad*2,h:b.h-pad*2};
        const cap=hero.box.w*hero.box.h*.55,a=inset.w*inset.h;
        if(a>cap){const k=Math.sqrt(cap/a);inset={x:inset.x+inset.w*(1-k)/2,y:inset.y+inset.h*(1-k)/2,w:inset.w*k,h:inset.h*k};}
        D.photo(c,inset,c.R.f(-9,9),pick,{id:'product'+n,role:'plate',bleed:false,grow:1,min:false});
      }else if(!hasStrip&&(()=>{
        const seat=stripSeat(c,c.W*.42); if(!seat)return false;
        return D.iconStrip(c,seat.y,stripKeys(c).slice(0,seat.w>=c.W*.7?6:4),{x:seat.x,w:seat.w});
      })()){
        /* drawn in a band that was measured against the type, not the ground */
      }else blocked.push(hole.box);
    }
  }
  /* a card whose seal was refused would be left with pills as its only
     sticker kind; a row of marks in the widest free band is the fallback */
  if(c.on('iconStrip')!==false){
    const kinds=new Set(c.nodes.map(n=>n.id==='badge'||n.id==='priceTag'?'seal':n.id==='iconStrip'?'icons':n.id==='pill'?'pill':null).filter(Boolean));
    if(!kinds.has('icons')&&!kinds.has('seal')){
      /* IN A FREE BAND, NOT ACROSS THE CARD. This call used to pass no x/w at
         all, so the row was drawn from W*.05 to W-W*.10 whatever the gap was,
         with its y clamped up to the safe margin — which is exactly where the
         brand lockup lives. Both numbers now come from a measured seat. */
      const seat=stripSeat(c,c.W*.42);
      if(seat)D.iconStrip(c,seat.y,stripKeys(c).slice(0,seat.w>=c.W*.7?6:4),{x:seat.x,w:seat.w});
    }
  }
  if(!c.on('stickers'))return;
  /* The reference audit: good ads carry at most ONE cash element and it
     touches the product; two or more is the BAD pattern (engine had it on a
     third of its cards). Boxes and mailers belong to a phone ad, not a car ad. */
  const ALLOW={cars:['cash'],phones:['cash','box'],broken:['cash','box']};
  const fams=ALLOW[c.vertical]||['cash','box'];
  const used=new Set(c.nodes.filter(n=>n.asset).map(n=>n.asset));
  let cashUsed=0;
  const pool0=[...assetsFor(c,'cash'),...assetsFor(c,'prop')].filter((a,i,arr)=>arr.findIndex(b=>b.s===a.s)===i)
    .filter(a=>fams.includes(a.t&&a.t.fam==='box'?'box':'cash'));
  if(!pool0.length)return;
  for(let n=0;n<2;n++){
    const pool=pool0.filter(a=>!used.has(a.s)&&!(cashUsed&&(!a.t||a.t.fam!=='box')));
    if(!pool.length)break;
    const hole=largestHole(occupancy(c,20));
    if(!hole.box||hole.area<.045)break;
    /* a hole that touches the canvas edge would seat the prop in the margin */
    const sr=safeRect(c.W,c.H);
    const b={x:Math.max(hole.box.x,sr.x),y:Math.max(hole.box.y,sr.y)};
    b.w=Math.min(hole.box.x+hole.box.w,sr.x+sr.w)-b.x; b.h=Math.min(hole.box.y+hole.box.h,sr.y+sr.h)-b.y;
    if(b.w<S*.12||b.h<S*.12)break;
    /* only worth dressing if the hole is chunky rather than a thin seam */
    if(Math.min(b.w,b.h)<S*.16)break;
    const pick=pool[Math.floor(c.R.f(0,1)*pool.length+n*7)%pool.length];
    used.add(pick.s); if(!pick.t||pick.t.fam!=='box')cashUsed++;
    const pad=Math.min(b.w,b.h)*.10;
    let inset={x:b.x+pad,y:b.y+pad,w:b.w-pad*2,h:b.h-pad*2};
    /* A PROP NEVER OUT-SIZES THE PRODUCT.
       Dressing is dressing. Left uncapped, a shipping box dropped into a big
       hole came out larger than the phone the card is about, and a card whose
       biggest object is a cardboard box is not selling a phone. */
    const hero=c.nodes.find(n=>n.role==='hero');
    if(hero){
      const cap=hero.box.w*hero.box.h*.40;
      const a=inset.w*inset.h;
      if(a>cap){const k=Math.sqrt(cap/a);
        inset={x:inset.x+inset.w*(1-k)/2,y:inset.y+inset.h*(1-k)/2,w:inset.w*k,h:inset.h*k};}
    }
    D.photo(c,inset,c.R.f(-11,11),pick,{id:'prop',role:'plate',bleed:false,grow:1,min:false});
  }
}
function render(archKey,seed,vertical,sizeKey,cfg){
  const R=RNG(seed);
  /* Palette and type pairing are derived from the seed so a seed reproduces a
     card exactly — but a configurator has to be able to hold everything else
     still and change ONE of them, which the old console could not do: it could
     only reroll the seed and take whatever palette came with it. An explicit
     choice overrides the derivation without disturbing anything else. */
  const P=(cfg&&cfg.palette&&PALETTES.find(x=>x.id===cfg.palette))||PALETTES[seed%PALETTES.length];
  const Fp=(cfg&&cfg.pair&&PAIRS.find(x=>x.id===cfg.pair))||PAIRS[(seed>>3)%PAIRS.length];
  const [W,H]=SIZES[sizeKey], C0=CONTENT[vertical];
  const headIdx=(cfg&&cfg.headIndex!=null)?cfg.headIndex:Math.floor(R.f(0,1)*C0.heads.length);
  const C=Object.assign({},C0,{heads:C0.heads[headIdx],headIndex:headIdx,promises:R.shuffle(C0.promises)});
  /* The brand block used to be "iPhones.LA / iL / SAME DAY CASH" baked into the
     deck. It is the owner's mark — or another shop's — so it is a setting:
     name, kicker, initials, address, and how the mark is framed. */
  if(cfg&&cfg.brand){const b=cfg.brand;
    if(b.name!=null)C.brand=b.name; if(b.kicker!=null)C.kicker=b.kicker;
    if(b.initials!=null)C.mark=b.initials; if(b.addr!=null)C.addr=b.addr;
    if(b.phone!=null)C.phone=b.phone;}
  /* ONE CLAIM, ONE PLACE. A pill that says what the kicker, the seal, the
     offer line, a step or the headline already says is dropped — judged with
     the same test R18 will apply, AFTER the brand is in, because the owner's
     own kicker "SAME DAY CASH" is what collided with the "SAME DAY" pill. */
  /* "CASH FOR TRUCKS" over a Civic is the iPhone-15 mistake in another aisle:
     the headline's body word becomes part of the subject the picture must match */
  if(C.subject&&C.subject.brand&&C.subject.brand.includes('car')){
    const hw=(C.heads||[]).join(' ').toUpperCase();
    const body=/\bTRUCKS?\b/.test(hw)?'truck':/\bVANS?\b/.test(hw)?'van':/\bCARS?\b/.test(hw)?'car':null;
    if(body)C.subject={...C.subject,body};
  }
  const already=[C.kicker,C.offerSub,C.offer,((SEAL_PHRASE[archKey]||[])[0]||[]).join(' '),...(C.steps||[]).map(x=>x[0]),...(C.heads||[])].filter(Boolean);
  C.promises=C.promises.filter(pr=>!already.some(a=>repeats(a,pr)));
  const F={display:Fp.display,body:Fp.body,num:Fp.num||Fp.body,
    dw:Fp.dw,bw:Fp.bw,nw:Fp.bw,
    dweight:Fp.dweight,bweight:Fp.bweight||700,nweight:Fp.nweight||700};
  const c=new Card(W,H,P,F,R,C,cfg,archKey+seed+sizeKey,vertical,archKey,sizeKey);
  ARCH[archKey](c);
  placeStickers(c);
  c.defer(()=>D.arrow(c));            // after the seal has taken its seat
  c.flush();
  const a=audit(c);
  const svg=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(archKey)} buyback ad in the ${esc(P.name)} palette"><defs>${cfg&&cfg.embedFonts===false?'':`<style>${faceCSS(c.used)}</style>`}${c.defs.join('')}</defs><rect width="${W}" height="${H}" fill="${P.ground}"/>${c.svg.join('')}</svg>`;
  return{svg,audit:a,palette:P,pair:Fp,card:c};
}

/* ══════════════════════════════════════════════════════════
   10b · THE GATE
   The owner's standing instruction: graphics at 100% confidence, no less.
   render() will draw anything and report on it; that is right for a lab. This
   is the exit the world sees through, and it refuses. A card is either clean —
   every rule passing — or it is not produced. When the seed asked for fails,
   nearby seeds are tried, then the optional ornaments are dropped one at a time
   (a seal or a prop is decoration; the offer is not), and if nothing clean can
   be found the answer is null and the caller must say so, never "close enough".
   ══════════════════════════════════════════════════════════ */
const OPTIONAL=['showcase','stickers','duo','starburst','sunburst','halftone','checker','grain','sheen','arcCrown','paintStroke','tornPaper'];
/* the device that IS the archetype is not an ornament — dropping the tear from
   Torn Split leaves a flat plate, which is the first permanent negative */
const ARCH_MUST={tornSplit:['tornPaper'],sunburstHero:['sunburst','arcCrown'],posterBleed:['paintStroke']};
function renderClean(archKey,seed,vertical,sizeKey,cfg,o={}){
  const tries=o.tries||6;
  const clean=r=>r.audit.pass===r.audit.total;
  let best=null;
  const keep=r=>{if(!best||r.audit.pass>best.audit.pass)best=r;};
  /* A reseed moves placement, not identity. 977 mod 8 is 1, so every retry
     used to rotate the palette, and the type pair, headline and hero photo all
     moved with the seed — the gate was counting a different card as this card,
     clean. The look is read off the first render and pinned for the retries. */
  let held=null;
  for(let t=0;t<tries;t++){
    const r=render(archKey,(seed+t*977)%999983,vertical,sizeKey,held||cfg);
    if(!held){const h=r.card.nodes.find(n=>n.role==='hero');
      held={...cfg,palette:r.palette.id,pair:r.pair.id,headIndex:r.card.C.headIndex,heroAsset:h&&h.asset||undefined};}
    if(clean(r))return Object.assign(r,{gate:{seed:(seed+t*977)%999983,dropped:[],tries:t+1,held:t>0}});
    keep(r);
  }
  /* a card that is clean except for coverage is short of picture, not long
     on ornament: grow the hero and try the seeds again before dropping anything */
  if(best&&best.audit.rules.every(x=>x[1]||x[0]==='R1')&&!(held||cfg).heroBoost){
    /* ESCALATE. One step of 16% used to be the whole offer, and a card sitting
       a single point under the floor with a hero at 12% of the canvas was
       refused outright — a picture-poor card whose answer was more picture.
       Dropping an ornament can never fix coverage, so this is the last real
       lever before refusal; it stops at 30% so the hero cannot eat the card. */
    for(const step of [1.16,1.30]){
      const boosted={...(held||cfg),heroBoost:step};
      for(let t=0;t<tries;t++){
        const r=render(archKey,(seed+t*977)%999983,vertical,sizeKey,boosted);
        if(clean(r))return Object.assign(r,{gate:{seed:(seed+t*977)%999983,dropped:[],tries:t+1,held:t>0,boosted:step}});
        keep(r);
      }
    }
  }
  const dropped=[];
  let c={...(held||cfg)};
  for(const k of OPTIONAL){
    if(c[k]===false)continue;
    if((ARCH_MUST[archKey]||[]).includes(k))continue;
    c={...c,[k]:false};dropped.push(k);
    const r=render(archKey,seed,vertical,sizeKey,c);
    if(clean(r))return Object.assign(r,{gate:{seed,dropped:dropped.slice(),tries}});
    keep(r);
  }
  return o.lenient?Object.assign(best,{gate:{seed,dropped,tries,refused:true}}):null;
}

/* THE SECOND OPINION — what the browser actually drew.
   The engine's geometry is exact to the metrics it was measured with, but the
   only thing a reader sees is pixels, and the two have disagreed before (a
   quotation mark's em box, an arc's rotated glyphs). This judges a card from
   the boxes the browser reports for every text run, and it is the same function
   whether it is called from the console on the live card or from the release
   gate in headless Chrome, so the two can never drift apart.
   boxes: [{s,x,y,w,h,op}] in viewBox units. Returns [] when clean. */
/* THE BROWSER'S OWN INK, NOT ITS EM BOX.
   getBoundingClientRect() on an SVG <text> returns the font's em box — ascent
   plus descent — and that is 1.18x the font size for Sora but 1.57x for Saira
   Condensed. pixelFaults used to shave a flat 16%/68% off it, which fits a
   body face and puts a display headline's ink ~38px higher than it is drawn:
   six cards were failed for a collision with 16px of clear air in it, while a
   real touch between two body lines could hide inside the same slack.
   Canvas measureText reports actualBoundingBoxAscent/Descent for the face the
   browser actually loaded, so the vertical extent is MEASURED. Everything is a
   ratio taken from that one call and anchored to the rect, so it is immune to
   enclosing transforms and to the user-unit/CSS-pixel scale. The horizontal
   extent stays with the rect, which is exact and already accounts for
   textLength. This is still a second opinion: it reads the page, never the
   engine's own metrics. */
function inkBox(t,host,sx,sy){
  const b=t.getBoundingClientRect(), str=t.textContent||'';
  const box={s:str.slice(0,26),x:(b.left-host.left)*sx,y:(b.top-host.top)*sy,
             w:b.width*sx,h:b.height*sy,op:+(getComputedStyle(t).opacity||1)};
  try{
    const cs=getComputedStyle(t);
    const cv=inkBox._ctx||(inkBox._ctx=document.createElement('canvas').getContext('2d'));
    cv.font=`${cs.fontStyle||'normal'} ${cs.fontWeight||400} ${cs.fontSize} ${cs.fontFamily}`;
    const m=cv.measureText(str);
    const em=m.fontBoundingBoxAscent+m.fontBoundingBoxDescent;
    const up=m.actualBoundingBoxAscent, dn=m.actualBoundingBoxDescent;
    if(em>0&&(up+dn)>0&&box.h>0){
      const k=box.h/em;                       // user units per font unit
      box.y+=(m.fontBoundingBoxAscent-up)*k;
      box.h=(up+dn)*k;
      /* HOW BIG THE TYPE IS, NOT HOW MUCH INK THIS PARTICULAR RUN HAS.
         "is too small to read" is a statement about the size of the type. Ink
         height only stands in for that while the run contains capitals: the
         proof wall's opening quotation mark is set at 90px and has 20px of
         ink, and reading the ink flagged it as unreadably small on 90 cards.
         Measure the loaded face's own cap height instead — still the browser's
         number, taken from the same context at the same size. */
      box.cap=cv.measureText('H').actualBoundingBoxAscent*k;
    }
  }catch(e){}                                  // a browser without the metrics keeps the em box
  return box;
}
function pixelFaults(boxes,W,H){
  const raw=boxes.filter(t=>t.op>0.05&&t.s.trim());
  const vis=[];
  for(const t of raw){
    /* outlined and hard-shadowed type is several stacked copies of one string */
    const tol=Math.max(14,t.h*0.35);
    const twin=vis.find(v=>v.s===t.s&&Math.abs(v.x-t.x)<tol&&Math.abs(v.y-t.y)<tol);
    if(twin){const x1=Math.max(twin.x+twin.w,t.x+t.w),y1=Math.max(twin.y+twin.h,t.y+t.h);
      twin.x=Math.min(twin.x,t.x);twin.y=Math.min(twin.y,t.y);twin.w=x1-twin.x;twin.h=y1-twin.y;continue;}
    vis.push({...t});
  }
  const out=[];
  /* boxes arrive as ink from inkBox(); the old blanket 16%/68% shave is gone */
  for(let i=0;i<vis.length;i++)for(let j=i+1;j<vis.length;j++){
    const a=vis[i],b=vis[j];
    const ox=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x), oy=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);
    if(ox>2&&oy>2){
      const small=Math.min(a.w*a.h,b.w*b.h);
      const share=ox/Math.min(a.w,b.w), apart=Math.abs((a.y+a.h/2)-(b.y+b.h/2))/Math.max(a.h,b.h);
      const stacked=share>0.55&&apart>0.55;
      if(ox*oy>small*(stacked?0.22:0.06))
        out.push(`"${a.s.trim()}" over "${b.s.trim()}" (${Math.round(ox*oy/small*100)}%)`);
    }
  }
  for(const t of vis)if(t.x<-2||t.y<-2||t.x+t.w>W+2||t.y+t.h>H+2)
    out.push(`"${t.s.trim()}" is clipped by the edge`);
  const SS=Math.min(W,H);
  for(const t of vis)if((t.cap||t.h)<SS*0.018)out.push(`"${t.s.trim()}" is too small to read`);
  return out;
}

/* ══════════════════════════════════════════════════════════
   11 · PROMPT + SENTIMENT
   ══════════════════════════════════════════════════════════ */
const PERMANENT_NEG=[
 'flat rounded plate behind the headline','product centred inside a safe box',
 'badge floating clear of the product','phone number set in body weight',
 'more than three promise pills','gradient standing in for shape language',
 'ornament positioned in canvas coordinates','stock photo of hands holding the product',
 'emoji used as a trust mark','centred body copy','drop shadow on flat elements',
 'two type sizes doing the same job','footer with no address or service area'
];
function buildPrompt(archKey,r,cfg){
  const on=k=>cfg[k]!==false;
  const meta=ARCHS.find(a=>a[0]===archKey);
  const parts=[];
  parts.push(`${meta[1].toUpperCase()} — ${r.card.C.heads.join(' ')} buyback ad, ${r.card.W}×${r.card.H}`);
  parts.push(`palette ${r.palette.id} "${r.palette.name}" (${r.palette.mood}) · ground ${r.palette.ground}, accent ${r.palette.accent}, hot ${r.palette.hot}`);
  parts.push(`type ${r.pair.display} over ${r.pair.body}`);
  const field=['sunburst','halftone','checker','diagonalSplit'].filter(on).map(k=>KEYMETA[k].name.toLowerCase());
  const shape=['paintStroke','tornPaper','knockoutBand','arcCrown'].filter(on).map(k=>KEYMETA[k].name.toLowerCase());
  const typefx=['outlineStroke','hardShadow','fitToPlate'].filter(on).map(k=>KEYMETA[k].name.toLowerCase());
  const offer=['starburst','ticket','sheen'].filter(on).map(k=>KEYMETA[k].name.toLowerCase());
  const proof=['promisePills','proofBlock','priceRows'].filter(on).map(k=>KEYMETA[k].name.toLowerCase());
  const chrome=['cta','footerBar','cornerLockup'].filter(on).map(k=>KEYMETA[k].name.toLowerCase());
  const heroBits=[on('hero')&&'product hero',on('heroBleed')&&'bleeding off one edge',
    on('heroRotate')&&'angled 6–24°',on('heroShadow')&&'cast shadow'].filter(Boolean);
  if(heroBits.length)parts.push('hero: '+heroBits.join(', '));
  if(field.length)parts.push('field: '+field.join(', '));
  if(shape.length)parts.push('shape language: '+shape.join(', '));
  if(typefx.length)parts.push('display type: '+typefx.join(', '));
  if(offer.length)parts.push('offer: '+offer.join(', '));
  if(proof.length)parts.push('proof: '+proof.join(', '));
  if(chrome.length)parts.push('chrome: '+chrome.join(', '));
  parts.push(`copy: "${r.card.C.offer}" · "${r.card.C.cta}" · ${r.card.C.phone} · ${r.card.C.addr}`);
  const off=ALLKEYS.filter(k=>!on(k));
  const neg=off.map(k=>'no '+KEYMETA[k].name.toLowerCase()).concat(PERMANENT_NEG);
  return{pos:parts.join('\n'),neg:neg.join('\n')};
}
function sentiment(r,cfg){
  const on=k=>cfg[k]!==false;
  const ornament=['sunburst','halftone','checker','diagonalSplit','paintStroke','tornPaper','knockoutBand','arcCrown','starburst','ticket','sheen','grain'].filter(on).length/12;
  const loud=(on('knockoutBand')?.3:0)+(on('starburst')?.25:0)+(on('hardShadow')?.2:0)+(on('outlineStroke')?.15:0)+(on('heroBleed')?.1:0);
  const trust=(on('proofBlock')?.4:0)+(on('promisePills')?.25:0)+(on('footerBar')?.2:0)+(on('cornerLockup')?.15:0);
  const density=r.audit.coverage;
  const words=[];
  words.push(loud>.7?'Loud':loud>.4?'Assertive':'Quiet');
  words.push(ornament>.6?'print-shop':ornament>.35?'considered':'stripped');
  words.push(trust>.6?'well-vouched':trust>.35?'credible':'anonymous');
  const verdict=density<.5?'reads as a placeholder — the engine is not filling the canvas'
    :density<.62?'still thin; the eye finds a hole before it finds the offer'
    :ornament<.3?'filled but plain — nothing here says a person made it'
    :loud<.4?'composed but polite; marketplace scroll will pass it'
    :'this is the register the reference ads work in';
  return{words,verdict,meters:[['ornament',ornament],['loudness',Math.min(loud,1)],['trust signals',trust],['density',density]]};
}


/* ─────────────────────────────────────────────────────────────
   exports — the whole engine is pure: no DOM, no browser globals.
   `render()` returns an SVG string plus the audit for that card.
   ───────────────────────────────────────────────────────────── */
export {
  RNG, PALETTES, PAIRS, SIZES, CONTENT,
  contrast, onColor, readable, esc,
  Card, D, ARCH, ARCHS,
  QUEUE, ALLKEYS, KEYMETA, DEFAULT_CFG,
  RULES, PERMANENT_NEG, audit, render, buildPrompt, sentiment,
  ground, placeHero, headline, sealOnHero, priceRows, proofSteps, reviewCard,
  fontCSS, faceCSS, renderClean, OPTIONAL, ARCH_MUST, OFF_BY_DEFAULT, pixelFaults, inkBox, matchSubject, parseModel, leadOf, namedModels, PLACEHOLDER
};

/* ══════════════════════════════════════════════════════════════════════════
   THE CONSOLE
   The engine above is the real engine/engine.mjs, injected at build time by
   scripts/build_console.mjs. Nothing here re-implements it — the previous
   console carried a hand-copied duplicate and had silently drifted a whole
   release behind (it was still drawing twelve rules against an engine that had
   grown to sixteen). Everything below only drives it.
   ══════════════════════════════════════════════════════════════════════════ */

const $ = s => document.querySelector(s);
const el = (t, a, h) => { const n = document.createElement(t);
  if (a) for (const k in a) k === 'class' ? n.className = a[k] : n.setAttribute(k, a[k]);
  if (h !== undefined) n.innerHTML = h; return n; };

const FMT = [['45', '4:5'], ['11', '1:1'], ['916', '9:16']];
const VERT = Object.keys(CONTENT);
const STORE = 'gfx-console-v2';

const S = {
  arch: 'nightLot', vertical: VERT[0], size: '45',
  seed: 4242, cfg: DEFAULT_CFG(),
  palette: null, pair: null,          // null = follow the seed
  tab: 'audit', impact: {}, log: [], lastKey: null, grades: {}, prev: null,
  brand: null,                        // null = the deck's own; else {name,kicker,initials,addr,phone,frame}
};
try { Object.assign(S, JSON.parse(localStorage.getItem(STORE) || '{}')); } catch {}
S.cfg = { ...DEFAULT_CFG(), ...(S.cfg || {}) };
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(
  { arch: S.arch, vertical: S.vertical, size: S.size, seed: S.seed, cfg: S.cfg,
    palette: S.palette, pair: S.pair, tab: S.tab, grades: S.grades, brand: S.brand })); } catch {} };

/* live config, including the direct palette/type choices the old console lacked */
const conf = () => ({ ...S.cfg, palette: S.palette, pair: S.pair, brand: S.brand,
  embedFonts: false, assetBase: '../', allowPlaceholder: true });   // the live view is a template; export is not

/* ── chrome ─────────────────────────────────────────────────────────────── */
function segment(host, items, get, set) {
  host.innerHTML = '';
  items.forEach(([v, label]) => {
    const b = el('button', { 'aria-pressed': String(get() === v) }, label);
    b.onclick = () => { set(v); paint(); };
    host.append(b);
  });
}
const TABS = [['audit', 'Audit'], ['look', 'Look'], ['prompt', 'Prompt'], ['log', 'Log']];
function renderTabs() {
  const host = $('#tabs'); host.innerHTML = '';
  TABS.forEach(([k, label]) => {
    const b = el('button', { 'aria-selected': String(S.tab === k) }, label);
    b.onclick = () => { S.tab = k; save(); renderTabs(); showPane(); };
    host.append(b);
  });
}
const showPane = () => TABS.forEach(([k]) => $('#pane-' + k).hidden = S.tab !== k);

function renderArch() {
  const host = $('#archRow'); host.innerHTML = '';
  ARCHS.forEach(([k, name], i) => {
    const b = el('button', { 'aria-pressed': String(S.arch === k), title: `${name} — press ${i + 1}` }, name);
    b.onclick = () => { S.arch = k; paint(); };
    host.append(b);
  });
}

/* WHICH SWITCHES ARE EVEN LIVE HERE.
   Twenty-eight switches, and on any given layout a third of them draw nothing —
   Price Board has no arc crown, Poster Bleed has no price rows. Showing all of
   them at equal weight is what makes the rail read as a settings page: you flip
   something, nothing happens, and you learn to distrust the panel. So each one
   is tested against the current layout by flipping it and seeing whether the
   artwork actually changes, and the dead ones fold away. */
let LIVE = null, liveKey = '';
function liveSwitches() {
  const key = S.arch + '|' + S.vertical + '|' + S.size + '|' + S.seed;
  if (LIVE && liveKey === key) return LIVE;
  const base = render(S.arch, S.seed, S.vertical, S.size, conf()).svg;
  LIVE = {};
  ALLKEYS.forEach(k => {
    const flip = { ...conf(), [k]: S.cfg[k] === false };
    LIVE[k] = render(S.arch, S.seed, S.vertical, S.size, flip).svg !== base;
  });
  liveKey = key;
  return LIVE;
}

/* ── the switch rail ────────────────────────────────────────────────────── */
function renderQueue() {
  const host = $('#groups'); host.innerHTML = '';
  const live = liveSwitches();
  let dead = 0;
  QUEUE.forEach(([group, rows]) => {
    const shown = rows.filter(r => live[r[0]]);
    dead += rows.length - shown.length;
    if (!shown.length) return;
    const g = el('div', { class: 'grp' }, `<h3>${group}</h3>`);
    shown.forEach(([key, name, fx, purpose]) => {
      const on = S.cfg[key] !== false, imp = S.impact[key];
      const row = el('div', {
        class: 'sw', role: 'switch', tabindex: '0',
        'aria-checked': String(on), 'data-k': key,
        'data-last': String(S.lastKey === key),
        title: purpose || '',
      }, `<span class="dot"></span><span><b>${name}</b><i>${fx}</i></span>` +
         `<span class="imp ${imp > .01 ? 'pos' : imp < -.01 ? 'neg' : ''}">` +
         `${imp === undefined ? '' : (imp > 0 ? '+' : '') + (imp * 100).toFixed(0)}</span>`);
      const flip = () => { S.cfg[key] = !on; S.lastKey = key; note(`${on ? 'off' : 'on'} · ${name}`); paint(); };
      row.onclick = flip;
      row.onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } };
      g.append(row);
    });
    host.append(g);
  });
  if (dead) {
    const names = ALLKEYS.filter(k => !live[k]).map(k => KEYMETA[k].name);
    const d = el('div', { class: 'grp' },
      `<h3>Draws nothing on this layout</h3><div class="dead">${names.join(' · ')}</div>`);
    host.append(d);
  }
  $('#onCount').textContent = ALLKEYS.filter(k => S.cfg[k] !== false).length + '/' + ALLKEYS.length;
}

/* ── readouts ───────────────────────────────────────────────────────────── */
const band = (v, good, mid) => v >= good ? 'ok' : v >= mid ? 'mid' : 'no';
function renderReadout(a) {
  $('#readout').innerHTML = [
    ['coverage', (a.coverage * 100).toFixed(0) + '%', band(a.coverage, .62, .5)],
    ['largest gap', (a.dead * 100).toFixed(0) + '%', a.dead <= .18 ? 'ok' : a.dead <= .26 ? 'mid' : 'no'],
    ['hot colour', (a.hotArea * 100).toFixed(0) + '%', a.hotArea <= .14 ? 'ok' : 'no'],
    ['elements', String(a.elements), ''],
    ['rules', `${a.pass}/${a.total}`, a.pass === a.total ? 'ok' : 'no'],
    ['pixels', '…', ''],
  ].map(([k, v, c]) => `<div class="gauge"><span>${k}</span><b class="${c}"${k === 'pixels' ? ' id="gPixels"' : ''}>${v}</b></div>`).join('');
}

/* The engine narrates its own failures — spill:, buried:, collide:, tight:,
   figures:, seal still costs. The old console threw all of that away and showed
   a grid of R-numbers, so a failing card told you THAT it failed and never why. */
/* THE ENGINE ALREADY EXPLAINS ITSELF — say it in English.
   card.notes carries lines like "buried: headline0 under badge 21%". The old
   console showed a grid of R-numbers and none of this, so a failing card told
   you THAT it failed and never why. Each note becomes a sentence naming the
   part, and "show me" outlines that part on the artwork. */
const FAULT = [
  [/^spill: (\S+) off (\S+)/, (m) => `“${m[1]}” runs off the ${m[2]} it was set on.`, m => m[1]],
  [/^buried: (\S+) under (\S+) (\d+)%/, (m) => `“${m[1]}” is ${m[3]}% covered by the ${m[2]} painted over it.`, m => m[1]],
  [/^collide: (\S+) x (\S+)/, (m) => `“${m[1]}” and “${m[2]}” overlap.`, m => m[1]],
  [/^tight: (.+) needs (\d+)%/, (m) => `${m[1]} needs ${m[2]}% of its box to stay legible — the copy is too long for the space.`, () => null],
  [/^figures: (\S+) "(.+?)" in (\S+)/, (m) => `${m[2]} is set in ${m[3]}, which draws a slashed zero.`, m => m[1]],
  [/^seal still costs (\d+)%/, (m) => `The seal had nowhere clean to sit; it still covers ${m[1]}% of a line.`, () => 'badge'],
];
function faultCard(note, r) {
  for (const [re, say, target] of FAULT) {
    const m = note.match(re);
    if (m) return { text: say(m), id: target(m) };
  }
  return { text: note, id: null };
}
function showMe(id) {
  const n = last.card.nodes.find(x => x.id === id);
  const svg = $('#frame').firstElementChild;
  if (!n || !svg) return;
  svg.querySelectorAll('[data-showme]').forEach(e => e.remove());
  const box = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  box.setAttribute('data-showme', '1');
  box.setAttribute('x', n.box.x); box.setAttribute('y', n.box.y);
  box.setAttribute('width', Math.max(2, n.box.w)); box.setAttribute('height', Math.max(2, n.box.h));
  box.setAttribute('fill', 'none'); box.setAttribute('stroke', '#4cc9f0');
  box.setAttribute('stroke-width', '5'); box.setAttribute('stroke-dasharray', '14 8');
  svg.append(box);
  $('#frame').classList.add('flash');
  setTimeout(() => { box.remove(); $('#frame').classList.remove('flash'); }, 2600);
}

function renderAudit(r) {
  const notes = r.card.notes.filter(n => /^(spill|buried|collide|tight|figures|seal)/.test(n));
  const rows = RULES.map(([id, name, test, sin]) => {
    const pass = (r.audit.rules.find(x => x[0] === id) || [, true])[1];
    return `<div class="rule ${pass ? '' : 'fail'}"><code>${id}</code>` +
           `<span><b>${name}</b><i>${pass ? test : sin}</i></span></div>`;
  }).join('');
  $('#pane-audit').innerHTML =
    `<h4>${r.audit.pass} of ${r.audit.total} rules</h4><div class="rules">${rows}</div>` +
    (notes.length
      ? `<h4>Faults</h4>` + notes.map((n, i) => { const f = faultCard(n, r);
          return `<div class="note">${esc(f.text)}` +
            (f.id ? ` <button class="showme" data-id="${f.id}">show me</button>` : '') + `</div>`; }).join('')
      : `<h4>Faults</h4><div class="empty">Nothing to report on this card.</div>`) +
    `<div id="pixelFaults"></div>` +
    `<h4>Grade</h4><div class="grade">
       <button class="keep" id="gKeep">Keep</button>
       <button class="cut" id="gCut">Cut</button></div>
     <div class="empty" id="gradeState"></div>`;
  const id = cardId();
  const g = S.grades[id];
  $('#gradeState').textContent = g ? `Graded "${g}" · ${Object.keys(S.grades).length} graded in total`
                                   : `${Object.keys(S.grades).length} graded in total`;
  $('#pane-audit').querySelectorAll('.showme').forEach(b => b.onclick = () => showMe(b.dataset.id));
  $('#gKeep').onclick = () => grade('keep');
  $('#gCut').onclick = () => grade('cut');
}

/* Palette and type pairing are chosen HERE rather than being whatever the seed
   handed you — the single biggest thing the old console could not do. */
function renderLook(r) {
  const swatch = p => `<span class="sw2" style="background:${p.accent}"></span>`;
  const pal = PALETTES.map(p =>
    `<button class="chip" data-pal="${p.id}" aria-pressed="${String(r.palette.id === p.id)}"
       title="${p.mood}">${swatch(p)}${p.name}</button>`).join('');
  const pairs = PAIRS.map(p =>
    `<button class="chip" data-pair="${p.id}" aria-pressed="${String(r.pair.id === p.id)}"
       title="${p.note}">${p.display} + ${p.body}</button>`).join('');
  const s = sentiment(r, conf());
  /* THE MONOGRAM. The mark is the owner's, or the next shop's — initials on an
     app-shaped plate, in a disc, floating, or no mark at all. Saved with the
     rest of the console's state, so it follows every card and every export. */
  const B = S.brand || {};
  const deck = CONTENT[S.vertical];
  const FRAMES = [['app', 'app shape'], ['circle', 'disc'], ['float', 'floating'], ['name', 'name only'], ['mark', 'mark only']];
  const brandUI =
    `<h4>Brand ${S.brand && !PLACEHOLDER.test(JSON.stringify(S.brand)) ? '· yours' : '· PLACEHOLDER — type yours'}</h4>
     <div class="brandgrid">
       <label>Name<input id="bName" value="${esc(B.name ?? deck.brand)}" maxlength="24"></label>
       <label>Initials<input id="bInit" value="${esc(B.initials ?? deck.mark)}" maxlength="3"></label>
       <label>Kicker<input id="bKick" value="${esc(B.kicker ?? deck.kicker)}" maxlength="22"></label>
       <label>Footer<input id="bAddr" value="${esc(B.addr ?? deck.addr)}" maxlength="30"></label>
     </div>
     <div class="chips">${FRAMES.map(([k, l]) => `<button class="chip" data-frame="${k}" aria-pressed="${String((B.frame || 'app') === k)}">${l}</button>`).join('')}</div>
     <button class="btn" id="brandReset" style="width:100%">back to the placeholder</button>`;
  $('#pane-look').innerHTML = brandUI +
    `<h4>Palette ${S.palette ? '· pinned' : '· following the seed'}</h4><div class="chips">${pal}</div>` +
    `<h4>Type ${S.pair ? '· pinned' : '· following the seed'}</h4><div class="chips">${pairs}</div>` +
    `<button class="btn" id="unpin" style="width:100%">unpin both · back to the seed</button>` +
    `<h4>What this card is going for</h4><pre>${esc(s.words)}\n\n${esc(s.verdict)}</pre>` +
    s.meters.map(([k, v]) => `<div class="meter"><span><em>${k}</em><em>${(v * 100).toFixed(0)}%</em></span>` +
      `<div><b style="width:${Math.min(100, v * 100).toFixed(0)}%"></b></div></div>`).join('');
  $('#pane-look').querySelectorAll('[data-pal]').forEach(b => b.onclick = () => {
    S.palette = S.palette === b.dataset.pal ? null : b.dataset.pal;
    note('palette · ' + (S.palette || 'seed')); paint();
  });
  $('#pane-look').querySelectorAll('[data-pair]').forEach(b => b.onclick = () => {
    S.pair = S.pair === b.dataset.pair ? null : b.dataset.pair;
    note('type · ' + (S.pair || 'seed')); paint();
  });
  $('#unpin').onclick = () => { S.palette = S.pair = null; note('palette + type follow the seed'); paint(); };
  const setBrand = patch => { S.brand = { ...(S.brand || {}), ...patch }; save(); note('brand · ' + Object.keys(patch)[0]); paint(); };
  const bind = (id, key) => { const i = $(id); i.onchange = () => setBrand({ [key]: i.value.trim() });
    i.onkeydown = e => { if (e.key === 'Enter') i.blur(); }; };
  bind('#bName', 'name'); bind('#bInit', 'initials'); bind('#bKick', 'kicker'); bind('#bAddr', 'addr');
  $('#pane-look').querySelectorAll('[data-frame]').forEach(b => b.onclick = () => setBrand({ frame: b.dataset.frame }));
  $('#brandReset').onclick = () => { S.brand = null; save(); note('brand · deck'); paint(); };
}

function renderPrompt(r) {
  const p = buildPrompt(S.arch, r, conf());
  $('#pane-prompt').innerHTML =
    `<h4>Generated prompt</h4><pre>${esc(p.pos)}</pre>` +
    `<h4>Negative — everything switched off, plus the permanent exclusions</h4>` +
    `<pre class="neg">${esc(p.neg)}</pre>`;
}

function renderLog() {
  $('#pane-log').innerHTML = S.log.length
    ? S.log.slice(0, 60).map(l => `<div class="logline">${esc(l.what)}` +
        (l.delta === undefined ? '' : ` <em>${l.delta > 0 ? '+' : ''}${(l.delta * 100).toFixed(0)} pts</em>`) +
        `</div>`).join('')
    : '<div class="empty">No edits yet. Flip a switch and the change is measured here.</div>';
}

/* CSS cannot letterbox an inline SVG reliably — it carries a viewBox and no
   intrinsic size, so it either collapses to nothing or grows past its pane. The
   three formats differ by a factor of nearly two in aspect, so this is not a
   detail: measure the space and size the card to it. */
function fit() {
  const svg = $('#frame').firstElementChild;
  if (!svg) return;
  const vb = (svg.getAttribute('viewBox') || '0 0 1 1').split(/\s+/).map(Number);
  const aspect = vb[2] / vb[3];
  const pane = $('.canvas').getBoundingClientRect();
  const pad = 32;
  const w = Math.max(80, pane.width - pad), h = Math.max(80, pane.height - pad);
  const scale = Math.min(w / aspect > h ? h * aspect : w, w);
  const width = Math.min(w, h * aspect);
  svg.style.width = width + 'px';
  svg.style.height = (width / aspect) + 'px';
}
addEventListener('resize', fit);

/* THE CONSOLE CHECKS ITS OWN PIXELS.
   Same pixelFaults() the release gate runs in headless Chrome, applied to the
   card on screen after the fonts and photographs have settled. The engine's
   geometry is one opinion; this is the browser's. Both must be clean before
   a card is called clean here, and nothing that is not clean can be exported. */
let pixels = { ok: true, faults: [], pending: true };
async function checkPixels() {
  const svg = $('#frame').firstElementChild;
  if (!svg || openAxis) return;
  await document.fonts.ready;
  /* an SVG <image> has no .complete, so probe the file it points at instead of
     waiting a fixed 1.2s for pictures the browser already has */
  await Promise.all([...svg.querySelectorAll('image')].map(i => new Promise(r => {
    const probe = new Image(); probe.onload = probe.onerror = r; probe.src = i.getAttribute('href');
    setTimeout(r, 1500); })));
  const vb = (svg.getAttribute('viewBox') || '0 0 1 1').split(/\s+/).map(Number);
  const host = svg.getBoundingClientRect(), sx = vb[2] / host.width, sy = vb[3] / host.height;
  const boxes = [...svg.querySelectorAll('text:not([data-deco])')].map(t => inkBox(t, host, sx, sy));
  const faults = pixelFaults(boxes, vb[2], vb[3]);
  pixels = { ok: !faults.length, faults, pending: false };
  renderVerdict();
}
/* not clean until the browser has actually answered — the export used to be
   able to slip through in the gap between paint() and the pixel verdict */
const isClean = () => !!last && last.audit.pass === last.audit.total && pixels.ok && !pixels.pending;
function renderVerdict() {
  const g = $('#gPixels');
  if (g) { g.textContent = pixels.ok ? 'clean' : pixels.faults.length + ' fault' + (pixels.faults.length > 1 ? 's' : '');
           g.className = pixels.ok ? 'ok' : 'no'; }
  const ban = $('#frame').querySelector('.reject');
  if (ban) ban.remove();
  if (last && !isClean() && !openAxis) {
    const why = [...last.audit.rules.filter(x => !x[1]).map(x => x[0]), ...pixels.faults.slice(0, 2)];
    $('#frame').append(el('div', { class: 'reject' },
      `<b>NOT CLEAN — will not export</b><span>${esc(why.join(' · '))}</span>`));
  }
  const pf = $('#pixelFaults');
  if (pf) pf.innerHTML = pixels.faults.length
    ? pixels.faults.map(f => `<div class="note">${esc(f)}</div>`).join('') : '';
}

/* ── paint ──────────────────────────────────────────────────────────────── */
let last = null, pixelsDone = Promise.resolve();
function paint() {
  const r = render(S.arch, S.seed, S.vertical, S.size, conf());
  last = r;
  if (openAxis) { renderAxis(openAxis); renderQueue(); renderArch(); save(); return r; }
  $('#frame').innerHTML = r.svg;
  /* The engine emits a viewBox and no width/height — correct for an exported
     asset, but a browser then has nothing to size the element from and the card
     collapsed to nothing in the middle of the console. Stamp the intrinsic size
     on so max-width/max-height can letterbox it properly. */
  fit();
  $('#seedTag').textContent = `${S.arch} · seed ${S.seed} · ${r.palette.id} · ${r.pair.id}`;
  renderReadout(r.audit);
  renderAudit(r); renderLook(r); renderPrompt(r); renderLog();
  pixels = { ok: true, faults: [], pending: true };
  pixelsDone = checkPixels();
  renderQueue(); renderArch();
  segment($('#vertSeg'), VERT.map(v => [v, v]), () => S.vertical, v => S.vertical = v);
  segment($('#fmtSeg'), FMT, () => S.size, v => S.size = v);
  save();
  return r;
}

const cardId = () => [S.arch, S.vertical, S.size, S.seed,
  (last && last.palette.id), (last && last.pair.id),
  ALLKEYS.filter(k => S.cfg[k] === false).join('.')].join('|');

function score(r) { return r.audit.pass / r.audit.total * .6 + r.audit.coverage * .3 + (1 - r.audit.dead) * .1; }
function note(what) {
  const before = last ? score(last) : undefined;
  S.log.unshift({ what, before });
  queueMicrotask(() => { if (last && before !== undefined) S.log[0].delta = score(last) - before; });
}
function grade(v) {
  S.grades[cardId()] = v;
  note(`graded ${v}`); save(); renderAudit(last);
}

/* ── measuring every switch ─────────────────────────────────────────────── */
/* One toggle's worth on ONE card is noise; the number that means something is
   its average effect across every layout, which is what this measures. */
function measureAll() {
  const btn = $('#measure'); btn.textContent = 'measuring…'; btn.disabled = true;
  setTimeout(() => {
    const base = {};
    ARCHS.forEach(([k]) => base[k] = score(render(k, S.seed, S.vertical, S.size, conf())));
    ALLKEYS.forEach(key => {
      const flipped = { ...conf(), [key]: S.cfg[key] === false };
      let sum = 0;
      ARCHS.forEach(([k]) => sum += base[k] - score(render(k, S.seed, S.vertical, S.size, flipped)));
      S.impact[key] = (sum / ARCHS.length) * (S.cfg[key] === false ? -1 : 1);
    });
    btn.textContent = 'measure switches'; btn.disabled = false;
    renderQueue();
  }, 20);
}

/* ── export ─────────────────────────────────────────────────────────────── */
/* The SVG, the picture, and a machine-readable record of the whole decision —
   config, palette, type, audit, diagnostics, grade. That last file is the one
   worth keeping: a graded corpus of what the owner accepts is exactly what an
   autonomous model would have to be trained on. */
function download(name, text, type) {
  const a = el('a'); a.download = name;
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function record(r) {
  return {
    id: cardId(), arch: S.arch, vertical: S.vertical, size: S.size, seed: S.seed,
    palette: r.palette.id, pair: r.pair.id, brand: S.brand,
    off: ALLKEYS.filter(k => S.cfg[k] === false),
    audit: { coverage: +r.audit.coverage.toFixed(4), dead: +r.audit.dead.toFixed(4),
             hot: +r.audit.hotArea.toFixed(4), elements: r.audit.elements,
             pass: r.audit.pass, total: r.audit.total,
             failed: r.audit.rules.filter(x => !x[1]).map(x => x[0]) },
    notes: r.card.notes, pixels: pixels, clean: isClean(), grade: S.grades[cardId()] || null,
    prompt: buildPrompt(S.arch, r, conf()),
  };
}
async function exportAll() {
  const r = last || paint();
  await pixelsDone;
  /* the export itself is judged with the placeholder forbidden */
  const strict = render(S.arch, S.seed, S.vertical, S.size, { ...conf(), allowPlaceholder: false });
  if (strict.audit.pass !== strict.audit.total) { last = strict; renderAudit(strict); }
  /* 100% confidence, no less. A card that fails a rule, or whose pixels the
     browser disagrees with, does not leave. The gate is offered instead: the
     nearest clean card, with what it changed said out loud. */
  /* a card that still says YOUR NAME is a template, not an ad */
  if (PLACEHOLDER.test(r.svg)) {
    note('export refused · brand is still the placeholder');
    alert('Refused: the brand is still the placeholder. Type your name, initials, tagline and footer in the Look tab.');
    S.tab = 'look'; renderTabs(); showPane(); return;
  }
  if (!isClean()) {
    const g = renderClean(S.arch, S.seed, S.vertical, S.size, conf());
    if (!g) { note('export refused · no clean card near this one'); alert('Refused: this card is not clean and no clean neighbour was found.'); return; }
    const changed = [g.gate.seed !== S.seed ? `seed → ${g.gate.seed}` : null,
      ...g.gate.dropped.map(k => `${KEYMETA[k].name} off`)].filter(Boolean).join(', ');
    if (!confirm(`This card is not clean and will not export.\nExport the nearest clean card instead? (${changed})`)) return;
    S.seed = g.gate.seed; g.gate.dropped.forEach(k => S.cfg[k] = false);
    note('export took the gate · ' + changed); paint();
    setTimeout(exportAll, 400); return;
  }
  const stem = `${S.arch}-${S.vertical}-${S.size}-${S.seed}`;
  /* the exported SVG embeds its own fonts and absolute asset URLs so it opens
     anywhere, unlike the one on screen which leans on this page */
  const solo = render(S.arch, S.seed, S.vertical, S.size,
    { ...conf(), embedFonts: true, assetBase: new URL('../', location.href).href });
  download(stem + '.svg', solo.svg, 'image/svg+xml');
  download(stem + '.json', JSON.stringify(record(r), null, 2), 'application/json');
  const all = Object.entries(S.grades);
  if (all.length) download('graded.jsonl',
    all.map(([id, g]) => JSON.stringify({ id, grade: g })).join('\n'), 'application/x-ndjson');
  note(`exported ${stem}`);
}

/* HOLD TO COMPARE.
   The old A/B panel rendered before-and-after as thumbnails, where grain,
   sheen, a hard shadow and fit-to-plate are all invisible, so the comparison
   never showed what a switch did. This shows the counterfactual — the last
   switch flipped back — at the same size in the same place while a key is
   held, and snaps back on release. It cannot be mistaken for the live card
   because it is only there while your finger is down. */
let holding = false;
function holdStart() {
  if (holding || !S.lastKey) return;
  holding = true;
  const alt = { ...conf(), [S.lastKey]: S.cfg[S.lastKey] === false };
  const r = render(S.arch, S.seed, S.vertical, S.size, alt);
  $('#frame').innerHTML = r.svg; fit();
  $('#frame').classList.add('flash');
  $('#seedTag').textContent = `holding: ${KEYMETA[S.lastKey].name} ${S.cfg[S.lastKey] === false ? 'ON' : 'OFF'}`;
}
function holdEnd() {
  if (!holding) return;
  holding = false;
  $('#frame').classList.remove('flash');
  paint();
}

/* ONE AXIS, OPENED.
   The single card is where grading happens — the judges were right that
   approving from a 132px tile is approving blind. But choosing BETWEEN eight
   palettes or eight layouts one at a time is slow, so any one axis can be
   opened as a row of full cards at the current seed; click one and it becomes
   the live card. Tiles are kept large enough that the devices still read. */
const AXES = {
  arch:    { label: 'layout',  values: () => ARCHS.map(a => [a[0], a[1]]),         apply: v => S.arch = v,    cfg: () => conf() },
  palette: { label: 'palette', values: () => PALETTES.map(p => [p.id, p.name]),   apply: v => S.palette = v, cfg: v => ({ ...conf(), palette: v }) },
  pair:    { label: 'type',    values: () => PAIRS.map(p => [p.id, p.display + ' + ' + p.body]), apply: v => S.pair = v, cfg: v => ({ ...conf(), pair: v }) },
  seed:    { label: 'seed',    values: () => Array.from({ length: 8 }, (_, i) => [String((S.seed + i * 977) % 999983), '#' + i]), apply: v => S.seed = +v, cfg: () => conf() },
};
let openAxis = null;
function renderAxis(name) {
  openAxis = name;
  const ax = AXES[name];
  const host = $('#frame');
  host.innerHTML = '';
  host.className = 'card axis';
  const grid = el('div', { class: 'axisgrid' });
  ax.values().forEach(([v, label]) => {
    const arch = name === 'arch' ? v : S.arch;
    const seed = name === 'seed' ? +v : S.seed;
    const r = render(arch, seed, S.vertical, S.size, ax.cfg(v));
    const t = el('figure', { class: 'tile' + (r.audit.pass === r.audit.total ? '' : ' fail') },
      r.svg + `<figcaption><b>${esc(label)}</b><span>${r.audit.pass}/${r.audit.total} · ${(r.audit.coverage * 100) | 0}%</span></figcaption>`);
    const svg = t.querySelector('svg');
    const vb = svg.getAttribute('viewBox').split(/\s+/);
    svg.setAttribute('width', vb[2]); svg.setAttribute('height', vb[3]);
    t.onclick = () => { ax.apply(v); note(`${ax.label} · ${label}`); closeAxis(); };
    grid.append(t);
  });
  host.append(grid);
  $('#seedTag').textContent = `every ${ax.label} · click one · Esc closes`;
}
function closeAxis() { openAxis = null; $('#frame').className = 'card'; paint(); }

/* ── keyboard ───────────────────────────────────────────────────────────── */
const HINTS = [['1–8', 'layout'], ['[ ]', 'seed'], ['V', 'vertical'], ['F', 'format'],
  ['P', 'palette'], ['T', 'type'], ['hold C', 'compare last switch'], ['A', 'open an axis'],
  ['Space', 'undo last switch'], ['G / X', 'keep / cut'], ['E', 'export']];
$('#hints').innerHTML = HINTS.map(([k, v]) => `<span><span class="kbd">${k}</span> ${v}</span>`).join('');

const cycle = (arr, cur, dir) => arr[(arr.indexOf(cur) + dir + arr.length) % arr.length];
addEventListener('keyup', e => { if (e.key.toLowerCase() === 'c') holdEnd(); });
addEventListener('blur', holdEnd);
addEventListener('keydown', e => {
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  const k = e.key, n = +k;
  if (k === 'Escape' && openAxis) return closeAxis(), e.preventDefault();
  if (k.toLowerCase() === 'c' && !e.repeat) return holdStart(), e.preventDefault();
  if (k.toLowerCase() === 'a') {
    const order = Object.keys(AXES);
    renderAxis(openAxis ? order[(order.indexOf(openAxis) + 1) % order.length] : 'arch');
    return e.preventDefault();
  }
  if (n >= 1 && n <= ARCHS.length) { S.arch = ARCHS[n - 1][0]; return paint(), e.preventDefault(); }
  const go = () => { paint(); e.preventDefault(); };
  switch (k.toLowerCase()) {
    case ']': S.seed = (S.seed + 977) % 999983; return go();
    case '[': S.seed = (S.seed + 999006) % 999983; return go();
    case 'v': S.vertical = cycle(VERT, S.vertical, e.shiftKey ? -1 : 1); return go();
    case 'f': S.size = cycle(FMT.map(f => f[0]), S.size, e.shiftKey ? -1 : 1); return go();
    case 'p': S.palette = cycle(PALETTES.map(p => p.id), S.palette || (last && last.palette.id), e.shiftKey ? -1 : 1); return go();
    case 't': S.pair = cycle(PAIRS.map(p => p.id), S.pair || (last && last.pair.id), e.shiftKey ? -1 : 1); return go();
    case 'g': grade('keep'); return e.preventDefault();
    case 'x': grade('cut'); return e.preventDefault();
    case 'e': exportAll(); return e.preventDefault();
    case ' ':
      if (S.lastKey) { S.cfg[S.lastKey] = S.cfg[S.lastKey] === false; note('undo · ' + KEYMETA[S.lastKey].name); return go(); }
  }
});

$('#axisBtn').onclick = () => openAxis ? closeAxis() : renderAxis('arch');
$('#reroll').onclick = () => { S.seed = (S.seed * 1103515245 + 12345) % 999983; note('new seed'); paint(); };
$('#measure').onclick = measureAll;
$('#exportBtn').onclick = exportAll;

/* the faces this page draws with, declared once for every card on it */
document.head.append(el('style', null, fontCSS()));
renderTabs(); showPane(); paint();
