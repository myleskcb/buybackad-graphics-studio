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
module.exports = frame_phone;
