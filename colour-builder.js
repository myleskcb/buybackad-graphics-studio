/* THE COLOUR BUILDER — start from one colour, get the colours that go with it.
 *
 * Owner, 2026-10-03, of the landing's twelve colour sets: "this is too
 * elementary ... we should have a colored pallet builder that can make any
 * amount that uses supportive colors ... if you choose a color, it will show
 * you a list of the most popular supportive/secondary colors", then: "Maybe
 * we have these 12 done for your themes or you can pick a color to start with".
 *
 * So the twelve stay, as the ready-made sets, and beside them a builder:
 * pick a starting colour (one of fourteen, or any colour), see the colours
 * that go with it, best first, each drawn as a small ad, choose which one is
 * the background and which colour the small print takes, and save as many
 * sets as you like. A saved set is a colour theme like the studio's own: it
 * sits in the colour row of Easy Mode and the designer, and the studio's
 * gate still checks every download made with it (DESIGN-LAW 87).
 *
 * WHAT "GOES WITH" MEANS (DESIGN-LAW 108). The partners of each colour are a
 * fixed list of pairings ads and brands have run for decades (rule 103's
 * twelve among them, and they come first, ordered by how many live designs
 * use them, counted on the page). Colour theory does not get to invent a
 * partner (rule 14). Every pairing is then solved and checked before it is
 * shown, by the same law the studio's themes are held to:
 *   - text against both stops of the background: 4.5:1 for normal sight AND
 *     protan, deutan and tritan simulation (rules 43, 51);
 *   - the bright colour: 4.5:1 on both stops, 3:1 at worst for colour-blind
 *     readers, and 1.7:1 from the text so the money word reads as a colour
 *     (theme_law.mjs);
 *   - the small print: 4.5:1 on both stops under all four (rule 51);
 *   - the number on a box of the bright colour: 3:1;
 *   - a warm colour is never drawn under its muddy floor (gold goes mustard,
 *     orange rust, lime olive), and every colour stays in the band where it
 *     still reads as its name (rule 103: muddy(), namedBand(), mirrored
 *     here because scripts/refresh_palettes.mjs is not loaded by the page);
 *   - two families to a set (rules 95, 103): the small print is a shade of
 *     the background's colour or of the bright colour, never a third hue.
 * A pairing that fails in every arrangement is not shown; the builder says
 * which ones it left out and why, in plain words (rule 16).
 *
 * Colour maths in OKLCH through app.js (hexToOklch, oklchFit), luminance and
 * contrast through the house's own (pgLum, pgCr; rule 87). The one thing
 * app.js lacked is colour-blind simulation; cbSim is the Brettel/Viénot
 * method on linear RGB with the matrices of cvd_audit.py and theme_law.mjs.
 *
 * Re-run: node scripts/colour_builder_audit.mjs (every colour, every partner,
 * every arrangement, re-scored by the audit's own maths; exits 1 on a fail).
 */

/* ── the starting colours ─────────────────────────────────────────────────
   Each hue is measured off its reference colour (rule 103's: navy #0b2a6b,
   gold #f5b301, orange #ff7a00, red #e11d2a, cyan #06b6d4, green #16a34a,
   purple #7e22ce, teal #0f766e). `band` is the luminance range in which the
   colour still reads as its name: rule 103's namedBand() where it sets one
   (red, orange, gold and yellow, lime, purple); navy, blue and cyan are
   names of lightness as much as of hue (a light navy is a blue, a dark cyan
   a teal), so their bands are set here. `gY` is the luminance the colour
   takes as a dark background, at most; `ground` says whether it can be one
   (a warm colour drawn dark enough for white text is brown, a dark cyan is
   a teal and a dark pink is wine). Black and white are always the
   background. */
const CB_COLOURS = [
  { key:'navy',   name:'Navy',   hex:'#0b2a6b', band:[0.004, 0.06], ground:true, gY:0.024 },
  { key:'blue',   name:'Blue',   hex:'#1d4ed8', band:[0.04, 0.32],  ground:true, gY:0.06 },
  { key:'cyan',   name:'Cyan',   hex:'#06b6d4', band:[0.25, 0.75] },
  { key:'teal',   name:'Teal',   hex:'#0f766e', band:[0.03, 0.55],  ground:true, gY:0.035 },
  { key:'green',  name:'Green',  hex:'#16a34a', band:[0.04, 0.6],   ground:true, gY:0.035 },
  { key:'lime',   name:'Lime',   hex:'#84cc16', band:[0.22, 0.85] },
  { key:'gold',   name:'Gold',   hex:'#f5b301', band:[0.33, 0.75] },
  { key:'yellow', name:'Yellow', hex:'#facc15', band:[0.4, 0.9] },
  { key:'orange', name:'Orange', hex:'#ff7a00', band:[0.2, 0.55] },
  { key:'red',    name:'Red',    hex:'#e11d2a', band:[0.07, 0.3],   ground:true, gY:0.03 },
  { key:'pink',   name:'Pink',   hex:'#ec4899', band:[0.08, 0.6] },
  { key:'purple', name:'Purple', hex:'#7e22ce', band:[0.02, 0.3],   ground:true, gY:0.035 },
  { key:'black',  name:'Black',  hex:'#1b1c20', neutral:'dark' },
  { key:'white',  name:'White',  hex:'#f3f5f9', neutral:'light' },
];
const CB_BY = Object.fromEntries(CB_COLOURS.map(c => [c.key, c]));
/* What goes with each colour, best first. The pairs among rule 103's twelve
   are sorted to the front at run time by how many live designs use them;
   the rest follow in this order. Every list is mirrored (if gold lists navy,
   navy lists gold), so a pairing is found from either end. */
const CB_PARTNERS = {
  navy:   ['gold', 'orange', 'cyan', 'red', 'yellow', 'white', 'pink', 'lime'],
  blue:   ['green', 'white', 'orange', 'gold', 'yellow', 'red', 'cyan'],
  cyan:   ['navy', 'black', 'purple', 'orange', 'pink', 'blue'],
  teal:   ['orange', 'gold', 'yellow', 'pink', 'white', 'black'],
  green:  ['gold', 'black', 'blue', 'yellow', 'white', 'orange', 'purple'],
  lime:   ['black', 'navy', 'purple', 'blue'],
  gold:   ['navy', 'purple', 'green', 'black', 'red', 'blue', 'teal'],
  yellow: ['red', 'black', 'navy', 'blue', 'purple', 'green', 'teal'],
  orange: ['navy', 'teal', 'black', 'blue', 'purple', 'green'],
  red:    ['yellow', 'black', 'gold', 'navy', 'white'],
  pink:   ['black', 'navy', 'purple', 'teal', 'white', 'cyan'],
  purple: ['gold', 'yellow', 'lime', 'pink', 'cyan', 'orange', 'green', 'white'],
  black:  ['gold', 'red', 'green', 'yellow', 'cyan', 'orange', 'pink', 'lime'],
  white:  ['blue', 'red', 'navy', 'green', 'purple', 'teal', 'pink'],
};
/* rule 103's twelve, by the two colours that make them */
const CB_READY = {
  'navy+gold':'Navy & Gold', 'navy+orange':'Navy & Orange', 'navy+cyan':'Midnight & Cyan',
  'blue+green':'Blue & Green', 'green+gold':'Green & Gold', 'purple+gold':'Purple & Gold',
  'teal+orange':'Teal & Orange', 'red+yellow':'Red & Yellow', 'black+gold':'Black & Gold',
  'black+red':'Black & Red', 'black+green':'Black & Green', 'white+blue':'Silver & Blue',
};
function cbReady(a, b){ return CB_READY[a + '+' + b] || CB_READY[b + '+' + a] || null; }

/* ── colour maths: the house's, plus colour-blind simulation ─────────────── */
function cbSim(hex, kind){
  const c = pgRgb(hex); if (!c) return hex;
  const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const [r, g, b] = c.slice(0, 3).map(lin);
  let L = 0.31399022 * r + 0.63951294 * g + 0.04649755 * b;
  let M = 0.15537241 * r + 0.75789446 * g + 0.08670142 * b;
  let S = 0.01775239 * r + 0.10944209 * g + 0.87256922 * b;
  if (kind === 'protan') L = 1.05118294 * M - 0.05116099 * S;
  if (kind === 'deutan') M = 0.9513092 * L + 0.04866992 * S;
  if (kind === 'tritan') S = -0.86744736 * L + 1.86727089 * M;
  const out = [5.47221206 * L - 4.6419601 * M + 0.16963708 * S, -1.1252419 * L + 2.29317094 * M - 0.1678952 * S, 0.02980165 * L - 0.19318073 * M + 1.16364789 * S];
  const enc = v => { v = Math.max(0, Math.min(1, v)); return Math.round(255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055)); };
  return '#' + out.map(enc).map(v => v.toString(16).padStart(2, '0')).join('');
}
const CB_VISION = ['normal', 'protan', 'deutan', 'tritan'];
function cbCr(a, b, kind){
  if (kind && kind !== 'normal'){ a = cbSim(a, kind); b = cbSim(b, kind); }
  return pgCr(pgLum(a), pgLum(b));
}
/* the worst contrast of `fg` on any of `grounds`, under the given visions */
function cbWorst(fg, grounds, kinds){
  let w = Infinity;
  (kinds || CB_VISION).forEach(k => grounds.forEach(g => { w = Math.min(w, cbCr(fg, g, k)); }));
  return w;
}
/* the colour of hue h and chroma (at most) C whose luminance is Y */
function cbAtY(h, C, Y){
  let lo = 0, hi = 1, hex = '#000000';
  for (let i = 0; i < 26; i++){
    const L = (lo + hi) / 2; hex = oklchFit({ L, C, h });
    if (pgLum(hex) < Y) lo = L; else hi = L;
  }
  return hex;
}
/* rule 103's muddy(): the lightest luminance a warm hue holds as its colour */
function cbMuddyFloor(h){ return h >= 35 && h < 45 ? 0.12 : h >= 45 && h < 65 ? 0.2 : h >= 65 && h < 105 ? 0.33 : h >= 105 && h < 120 ? 0.3 : h >= 120 && h < 140 ? 0.22 : 0; }
const cbWarm = h => h >= 35 && h < 140;
const cbCool = h => h >= 140 && h <= 330;
function cbGap(a, b){ const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; }
function cbDist(a, b){ const p = hexToOklch(a), q = hexToOklch(b); if (!p || !q) return 1;
  const ar = p.h * Math.PI / 180, br = q.h * Math.PI / 180;
  return Math.hypot(p.L - q.L, p.C * Math.cos(ar) - q.C * Math.cos(br), p.C * Math.sin(ar) - q.C * Math.sin(br)); }
const cbClamp = (x, a, b) => Math.max(a, Math.min(b, x));
/* rule 103's chroma floor (C 0.12, 0.13 for a warm hue: under it gold is
   khaki and blue slate), where the screen can show it. A light blue or a
   mid teal cannot reach 0.12 at all; there the floor is the most the gamut
   holds, less a margin, and never under 0.09. Less the rounding of 8-bit hex. */
function cbMinC(hex){
  const o = hexToOklch(hex), base = cbWarm(o.h) ? 0.13 : 0.12;
  const most = hexToOklch(oklchFit({ L:o.L, C:0.4, h:o.h })).C;
  return Math.max(0.09, Math.min(base, most - 0.012)) - 0.004;
}

/* a colour as the builder uses it: its hue and chroma, the name it reads as,
   and the band and job that name allows. A colour the visitor picks takes
   the band and partners of the named colour nearest it. */
function cbColour(keyOrHex){
  if (CB_BY[keyOrHex]) return cbWith(CB_BY[keyOrHex], CB_BY[keyOrHex].hex);
  const hex = String(keyOrHex || '').toLowerCase();
  const o = hexToOklch(hex); if (!o) return null;
  return Object.assign(cbWith(cbNearest(hex), hex), { custom:true });
}
function cbWith(base, hex){
  const o = hexToOklch(hex) || { L:0.5, C:0, h:0 }, Y = pgLum(hex);
  const c = Object.assign({}, base, { hex, h:o.h, C:o.C, L:o.L, Y });
  /* a picked colour that can be a background is drawn as near its own
     lightness as a dark background allows */
  if (hex !== base.hex && base.ground) c.gY = cbClamp(Y, 0.008, base.gY * 1.6);
  return c;
}
function cbNearest(hex){
  const o = hexToOklch(hex);
  if (!o || o.C < 0.045) return CB_BY[o && o.L > 0.6 ? 'white' : 'black'];
  let best = null, bd = Infinity;
  CB_COLOURS.forEach(c => { if (c.neutral) return; const q = hexToOklch(c.hex);
    const d = cbGap(o.h, q.h) / 28 + Math.abs(o.L - q.L) * 4; if (d < bd){ bd = d; best = c; } });
  return best;
}

/* ── one set from two colours ─────────────────────────────────────────────
   cbSolve(G, A, mode) makes the set with G as the background and A as the
   bright colour. mode 'dark': G drawn deep (black stays black), near-white
   text. mode 'light': a white background with a breath of the cool colour
   (or silver), text near-black in the cool colour (navy-, green- or
   purple-black; never a warm hue, rule 103), A drawn dark enough to read on
   white. Returns { set } or { why } with a plain reason. */
const CB_WHY = {
  same:    (g, a) => `${a.name} is too close to ${g.name} to be a second colour`,
  ground:  (g)    => `${g.name} cannot be a dark background: it turns ${g.key === 'cyan' ? 'teal' : g.key === 'lime' ? 'olive' : g.key === 'pink' ? 'wine' : 'brown'}`,
  dull:    (g, a, m) => `${a.name} looks grey at the shade it would need ${m === 'light' ? 'on white' : 'there'}`,
  both:    (g, a) => `${g.name} and ${a.name.toLowerCase()} are both bright colours, so neither can be the background`,
  band:    (g, a, m) => m === 'light' ? `${a.name} is too light to read on white` : `${a.name} cannot be bright enough on ${g.name.toLowerCase()} and still look ${a.name.toLowerCase()}`,
  cvd:     (g, a) => `${a.name} on ${g.name.toLowerCase()} is hard to see for colour-blind readers`,
  support: (g, a) => `${a.name} on ${g.name.toLowerCase()} leaves no colour for the small print that reads`,
};
function cbSolve(G, A, mode){
  if (!G || !A) return { why:'' };
  if (!G.neutral && !A.neutral && cbGap(G.h, A.h) < 30) return { why:CB_WHY.same(G, A) };
  if (A.neutral) return { why:'' };
  if (mode === 'dark' && (G.neutral === 'light' || (!G.neutral && !G.ground))) return { why:CB_WHY.ground(G) };
  if (mode === 'light' && G.neutral === 'dark') return { why:'' };
  const floorA = Math.max(A.band[0], cbMuddyFloor(A.h));
  const accC = Math.max(A.C, cbWarm(A.h) ? 0.17 : 0.16);
  let lastWhy = CB_WHY.band(G, A, mode);
  /* on white: the cool colour of the two (navy, blue, teal, green, purple,
     cyan) tints the white and darkens the text; with none, silver and navy */
  const cool = mode === 'light' ? [G.tint, A].find(c => c && !c.neutral && cbCool(c.h)) : null;
  const grounds = [];
  if (mode === 'dark'){
    /* black is a soft black; a near-black the visitor picked is theirs, as
       dark as it needs to be */
    if (G.neutral === 'dark' && G.custom){ const Y = Math.min(G.Y, 0.03), C = Math.min(G.C, 0.04);
      grounds.push([cbAtY(G.h, C, Y), cbAtY(G.h, C, Y * 0.6)]); }
    else if (G.neutral === 'dark') grounds.push([oklchFit({ L:0.255, C:0.008, h:258 }), oklchFit({ L:0.185, C:0.008, h:258 })]);
    else for (let Y = G.gY; Y >= 0.008; Y *= 0.82){
      const C = Math.min(Math.max(G.C, 0.11), 0.14);
      grounds.push([cbAtY(G.h, C, Y), cbAtY(G.h, C * 0.92, Y * 0.62)]);
    }
  } else {
    /* a near-white the visitor picked keeps its own breath of colour */
    const mine = G.custom && G.neutral === 'light';
    const tc = mine ? Math.min(G.C, 0.02) : cool ? 0.012 : 0.008, th = mine ? G.h : cool ? cool.h : 250;
    grounds.push([oklchFit({ L:0.975, C:tc, h:th }), oklchFit({ L:0.93, C:tc + 0.004, h:th })]);
  }
  for (const [c1, c2] of grounds){
    let ink;
    if (mode === 'dark') ink = oklchFit({ L:0.975, C:G.neutral ? 0.006 : 0.012, h:G.neutral ? 258 : G.h });
    else ink = cbAtY(cool ? cool.h : 264, 0.045, 0.011);
    const Yi = pgLum(ink), Y1 = pgLum(c1), Y2 = pgLum(c2), Ylit = Math.max(Y1, Y2), Ydim = Math.min(Y1, Y2);
    /* the bright colour's window: its band, its muddy floor, 4.5:1 on both
       stops, 1.75:1 from the text */
    let lo, hi;
    if (mode === 'dark'){ lo = Math.max(floorA, 4.5 * (Ylit + 0.05) - 0.05); hi = Math.min(A.band[1], (Yi + 0.05) / 1.75 - 0.05); }
    else { lo = Math.max(floorA, 1.75 * (Yi + 0.05) - 0.05); hi = Math.min(A.band[1], (Ydim + 0.05) / 4.5 - 0.05); }
    if (lo > hi){ lastWhy = CB_WHY.band(G, A, mode); continue; }
    /* as near the colour's own lightness as the window allows; then, if a
       colour-blind reader loses it, walk away from the background */
    let acc = null;
    const want = cbClamp(A.Y, lo, hi), steps = 8;
    for (let k = 0; k <= steps; k++){
      const Y = mode === 'dark' ? want + (hi - want) * k / steps : want - (want - lo) * k / steps;
      const c = cbAtY(A.h, accC, Y);
      const o = hexToOklch(c);
      if (pgLum(c) < floorA - 1e-4){ lastWhy = CB_WHY.band(G, A, mode); continue; }
      if (o.C < cbMinC(c)){ lastWhy = CB_WHY.dull(G, A, mode); continue; }
      if (cbWorst(c, [c1, c2], ['normal']) < 4.5 || cbCr(c, ink) < 1.7){ lastWhy = CB_WHY.band(G, A, mode); continue; }
      if (cbWorst(c, [c1, c2], ['protan', 'deutan', 'tritan']) < 3){ lastWhy = CB_WHY.cvd(G, A); continue; }
      acc = c; break;
    }
    if (!acc) continue;
    const supports = cbSupports(G, A, mode, c1, c2, ink, acc);
    if (!supports.length){ lastWhy = CB_WHY.support(G, A); continue; }
    return { set:{ g:G, a:A, mode, c1, c2, ink, accent:acc, supports } };
  }
  return { why:lastWhy };
}
/* the small print: a shade of the background's family, or of the bright
   colour's, that reads 4.5:1 on both stops for every reader and is plainly
   neither the text nor the bright colour */
function cbSupports(G, A, mode, c1, c2, ink, acc){
  const out = [], Yi = pgLum(ink), Ya = pgLum(acc);
  const fams = [];
  /* a shade of the bright colour, turned eight degrees to keep it apart:
     toward crimson for a red or a pink (toward orange is rust, rule 103),
     toward the cooler side otherwise */
  const ah = A.h >= 330 || A.h < 45 ? (A.h + 352) % 360 : (A.h + 8) % 360;
  const fa = { from:'a', h:ah, band:[Math.max(A.band[0] * 0.8, cbMuddyFloor(ah)), Math.min(1, A.band[1] * 1.2)], name:A.name };
  /* the background's own family, lighter; a red one goes salmon that light,
     so a red background takes the bright colour's family first (Red &
     Yellow's small print is yellow) */
  if (!G.neutral){ const fg = { from:'g', h:G.h, band:[0, 1], name:G.name };
    if (G.h >= 330 || G.h < 35) fams.push(fa, fg); else fams.push(fg, fa); }
  else fams.push(fa);
  /* on white, the text's own family (navy on a white & red set) */
  if (mode === 'light' && G.neutral){ const o = hexToOklch(ink); fams.push({ from:'i', h:o.h, band:[0, 1], name:'' }); }
  fams.forEach(f => {
    const floor = Math.max(f.band[0], cbMuddyFloor(f.h)), C = cbWarm(f.h) ? 0.13 : 0.12;
    /* lighter and softer than the bright colour on a dark background (a
       darker warm shade is the olive and mustard rule 103 removed), deeper on
       white */
    const Ys = mode === 'dark' ? [Ya + 0.2, Ya + 0.14, 0.62, 0.5, 0.42] : [Ya * 0.62, Ya * 1.25, 0.075, 0.05, 0.11];
    for (const Y0 of Ys){
      const Y = cbClamp(Y0, floor, f.band[1]);
      const c = cbAtY(f.h, C, Y), o = hexToOklch(c);
      if (o.C < cbMinC(c) || pgLum(c) < floor - 1e-4) continue;
      if (cbWorst(c, [c1, c2]) < 4.5) continue;
      if (cbDist(c, acc) < 0.07 || cbDist(c, ink) < 0.1) continue;
      if (out.some(s => cbDist(s.hex, c) < 0.06)) continue;
      out.push({ hex:c, from:f.from, name:f.name }); break;
    }
  });
  return out;
}
/* the number's colour on a box of the bright colour: the text, a deep
   shade of the background, or white, whichever reads best */
function cbPlateInk(th){
  const g = hexToOklch(th.bg.c1) || { h:258, C:0 };
  const deep = cbAtY(g.C < 0.03 ? 258 : g.h, 0.05, 0.012);
  return [th.ink, deep, '#ffffff'].sort((p, q) => cbCr(q, th.accent) - cbCr(p, th.accent))[0];
}

/* every arrangement of two colours that passes, best first: the first
   colour as the background where it can be one, then the second, then white */
function cbArrangements(S, P){
  const tries = [];
  const add = (G, A, mode) => { if (!tries.some(t => t.G === G && t.A === A && t.mode === mode)) tries.push({ G, A, mode }); };
  if (S.neutral === 'dark' || S.neutral === 'light') add(S, P, S.neutral);
  else if (P.neutral === 'dark' || P.neutral === 'light') add(P, S, P.neutral);
  else {
    add(S, P, 'dark'); add(P, S, 'dark');
    const white = cbWith(CB_BY.white, CB_BY.white.hex);
    add(white, P, 'light'); add(white, S, 'light');
  }
  const ok = [], why = [];
  tries.forEach(t => { const r = t.mode === 'light' && t.G.key === 'white' && !(S.neutral || P.neutral)
      ? cbSolveLightPair(t.A, t.A === P ? S : P) : cbSolve(t.G, t.A, t.mode);
    if (r.set) ok.push(r.set); else if (r.why) why.push(r.why); });
  return { ok, why };
}
/* a white set made from two colours: one is the bright colour, the other
   gives the text (when cool) and the small print its family */
function cbSolveLightPair(A, B){
  const white = cbWith(CB_BY.white, CB_BY.white.hex);
  if (cbGap(A.h, B.h) < 30) return { why:CB_WHY.same(B, A) };
  const r = cbSolve(Object.assign({}, white, { tint:B }), A, 'light');
  if (!r.set) return r;
  /* the small print from B's family, when it reads on white */
  const s = r.set, floor = Math.max(B.band[0], cbMuddyFloor(B.h));
  const sup = [0.08, 0.06, 0.11, 0.045].map(Y => cbAtY(B.h, cbWarm(B.h) ? 0.13 : 0.12, cbClamp(Y, floor, B.band[1])))
    .find(c => pgLum(c) >= floor - 1e-4 && hexToOklch(c).C >= cbMinC(c) && cbWorst(c, [s.c1, s.c2]) >= 4.5 && cbDist(c, s.accent) >= 0.07 && cbDist(c, s.ink) >= 0.1);
  /* the second colour has to be on the card: as the small print. A cool
     colour only tinting the white and the text is not there to see */
  if (!sup) return { why:B.band[1] < 0.15 || floor > 0.143 ? CB_WHY.band(white, B, 'light') : CB_WHY.dull(white, B, 'light') };
  s.supports.unshift({ hex:sup, from:'b', name:B.name });
  s.supports = s.supports.filter(x => x.from !== 'i');
  s.pair = B;
  return r;
}

/* the set as a studio colour theme (COLOR_THEMES' shape) */
function cbTheme(set, supIdx, name){
  const sup = set.supports[Math.min(supIdx || 0, set.supports.length - 1)];
  const key = c => c.custom ? c.hex : c.key;
  return { name: name || cbName(set), family:'Yours',
    bg:{ type:'grad', c1:set.c1, c2:set.c2, a:170 }, accent:set.accent, ink:set.ink, support:sup.hex,
    mine:true, made:{ bg:key(set.g), bright:key(set.a), pair:set.pair ? key(set.pair) : null, mode:set.mode } };
}
function cbName(set){
  if (set.mode === 'light') return set.pair ? set.pair.name + ' & ' + set.a.name + ' on White' : 'White & ' + set.a.name;
  return set.g.name + ' & ' + set.a.name;
}
/* the law, re-measured on a finished theme (the audit, and every set before it is saved) */
function cbCheck(th){
  const g = [th.bg.c1, th.bg.c2], rows = {};
  rows.text = cbWorst(th.ink, g);
  rows.bright = cbWorst(th.accent, g, ['normal']);
  rows.brightCvd = cbWorst(th.accent, g, ['protan', 'deutan', 'tritan']);
  rows.brightVsText = cbCr(th.accent, th.ink);
  rows.small = cbWorst(th.support, g);
  rows.number = cbCr(cbPlateInk(th), th.accent);
  const muddy = [th.accent, th.support].filter(c => { const o = hexToOklch(c); return o.C >= 0.05 && pgLum(c) < cbMuddyFloor(o.h) - 1e-4; });
  const ok = rows.text >= 4.5 && rows.bright >= 4.5 && rows.brightCvd >= 3 && rows.brightVsText >= 1.7 && rows.small >= 4.5 && rows.number >= 3 && !muddy.length;
  return { ok, rows, muddy };
}

/* ── the partners of a starting colour ────────────────────────────────────
   Best first: rule 103's ready-made sets, by how many live designs use them
   (`counts`, by set name, counted on the page), then the rest in
   CB_PARTNERS' order. A partner whose set comes out looking the same as one
   already listed (yellow drawn deep enough for white text is gold) is left
   out and said so, like a partner that cannot pass. */
function cbPartners(S, counts){
  const base = S.custom ? cbNearest(S.hex) : CB_BY[S.key];
  const keys = (CB_PARTNERS[base.key] || []).slice();
  const ready = k => cbReady(base.key, k);
  const n = k => (counts && ready(k) && counts[ready(k)]) || 0;
  keys.sort((a, b) => (!!ready(b) - !!ready(a)) || (n(b) - n(a)));
  const list = [], left = [];
  keys.forEach(k => {
    const P = cbColour(k);
    if (S.custom && P.key === base.key) return;
    const r = cbArrangements(S, P);
    if (!r.ok.length){ left.push({ P, why:cbPairWhy(S, P, r.why) }); return; }
    const a = r.ok[0];
    const twin = list.find(x => cbDist(x.sets[0].accent, a.accent) < 0.05 && cbDist(x.sets[0].c1, a.c1) < 0.05);
    if (twin){ left.push({ P, why:`next to ${S.name.toLowerCase()}, ${P.name.toLowerCase()} comes out the same as ${twin.P.name.toLowerCase()}` }); return; }
    list.push({ P, sets:r.ok, ready:ready(k), n:n(k) });
  });
  return { list, left };
}
function cbPairWhy(S, P, whys){
  const bright = c => !c.neutral && !c.ground;
  if (bright(S) && bright(P)) return CB_WHY.both(S, P);
  return whys[0] || '';
}
/* a picked colour, as the builder will draw it in its job: how far it moved,
   and which way, so the builder can say so (rule 16) */
function cbMoved(picked, used){
  if (!picked || !used || cbDist(picked, used) < 0.05) return null;
  return pgLum(used) < pgLum(picked) ? 'darker' : 'lighter';
}

/* ── the visitor's saved sets ─────────────────────────────────────────────
   As many as they like, on this device (localStorage, like the brand kit
   and the drafts). A saved set is found by name wherever a theme is
   (ezThemeByName in app.js reads the same key), so a draft or a project made
   with one reopens in it. */
const CB_KEY = 'pgfx_my_colours';
function cbSaved(){
  const v = jget(CB_KEY, []);
  return Array.isArray(v) ? v.filter(t => t && t.name && t.bg && t.bg.c1 && t.bg.c2 && t.accent && t.ink && t.support) : [];
}
function cbSameColours(a, b){ return a.bg.c1 === b.bg.c1 && a.bg.c2 === b.bg.c2 && a.accent === b.accent && a.ink === b.ink && a.support === b.support; }
function cbSave(th){
  if (!cbCheck(th).ok) return null;
  const list = cbSaved(), same = list.find(t => cbSameColours(t, th));
  if (same) return same;
  const base = 'Your ' + th.name.replace(/^Your /, '');
  const taken = n => list.some(t => t.name === n) || (typeof COLOR_THEMES !== 'undefined' && COLOR_THEMES.some(t => t.name === n));
  let name = base, k = 2;
  while (taken(name)) name = base + ' ' + k++;
  const t = Object.assign({}, th, { name, saved:Date.now() });
  list.push(t); jset(CB_KEY, list);
  cbRefresh();
  return t;
}
function cbDelete(name){ jset(CB_KEY, cbSaved().filter(t => t.name !== name)); cbRefresh(); }

/* ── the studio's colour rows: the visitor's sets after ORIG, and a + ──────
   Easy Mode's row and the designer's call cbThemeChips once they are built;
   every save or delete redraws them. Their own sync (syncEzThemes, edSync,
   choiceHoldSync) marks the chosen chip, as for the house's themes. */
const CB_ROWS = new Map();
function cbChipHtml(th){
  return `<span style="background:linear-gradient(135deg, ${th.bg.c1}, ${th.bg.c2})"></span><span style="background:${th.accent}"></span><span style="background:${th.support}"></span>`;
}
function cbThemeChips(row, apply){
  if (!row) return;
  CB_ROWS.set(row, apply);
  row.querySelectorAll('.cb-mine, .cb-make').forEach(b => b.remove());
  const orig = row.querySelector('.ez-theme.orig'), at = orig ? orig.nextSibling : row.firstChild;
  cbSaved().forEach(th => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'ez-theme cb-mine'; b.dataset.theme = th.name;
    b.title = th.name + ' · your colours'; b.setAttribute('aria-label', b.title);
    b.innerHTML = cbChipHtml(th);
    b.onclick = () => apply(th);
    row.insertBefore(b, at);
  });
  const mk = document.createElement('button');
  mk.type = 'button'; mk.className = 'ez-theme cb-make';
  mk.title = 'Make your own colours'; mk.setAttribute('aria-label', mk.title);
  mk.innerHTML = '<span aria-hidden="true">+</span>';
  mk.onclick = () => cbOpenModal(apply);
  row.appendChild(mk);
}
function cbRefresh(){
  CB_ROWS.forEach((apply, row) => { if (row.isConnected) cbThemeChips(row, apply); });
  try { if (typeof syncEzThemes === 'function') syncEzThemes(); } catch (e){}
  try { if (typeof edSync === 'function') edSync(); } catch (e){}
  try { if (typeof choiceHoldSync === 'function') choiceHoldSync(); } catch (e){}
  document.querySelectorAll('.cb').forEach(el => { const root = el.parentElement; if (root && root.__cb) cbRender(root); });
}

/* ── the builder ──────────────────────────────────────────────────────────
   cbMount(root, { onUse, useLabel, modal }) draws the builder into `root`
   and keeps its state there: the starting colour (a key, or the hex the
   visitor picked), the partner, the arrangement and the small print. */
const CB_PARTNER_CACHE = new Map();
function cbCounts(){ return (typeof SHOWCASE !== 'undefined' && SHOWCASE.palN) || {}; }
function cbPartnersOf(start){
  const counts = cbCounts(), k = start + '|' + Object.keys(counts).map(n => n + counts[n]).join();
  if (!CB_PARTNER_CACHE.has(k)) CB_PARTNER_CACHE.set(k, cbPartners(cbColour(start) || cbColour('navy'), counts));
  return CB_PARTNER_CACHE.get(k);
}
/* the landing's counts arrive with the library (scBuildFamilies) */
function cbOnCounts(){
  const n = Object.keys(cbCounts()).length, el = document.querySelector('#cb-tab-ready .n');
  if (el && n) el.textContent = String(n);
  document.querySelectorAll('.cb').forEach(c => { const root = c.parentElement; if (root && root.__cb) cbRender(root); });
}
function cbMount(root, opts){
  if (!root) return;
  const last = jget('pgfx_cb_start', 'navy');
  root.__cb = root.__cb || { start:(CB_BY[last] || /^#[0-9a-f]{6}$/i.test(String(last))) ? last : 'navy', p:0, a:0, s:0 };
  root.__cb.opts = opts || {};
  cbRender(root);
}
/* a sample ad in a set's colours: the jobs of rule 51, as an ad shows them */
function cbAdHtml(th, big){
  const label = big ? ` role="img" aria-label="A sample ad in ${escHtml(th.name)}"` : ' aria-hidden="true"';
  return `<span class="cb-ad${big ? ' big' : ''}"${label} style="--g1:${th.bg.c1};--g2:${th.bg.c2};--ink:${th.ink};--acc:${th.accent};--sup:${th.support};--pin:${cbPlateInk(th)}">
      <span class="cb-ad-k">WE BUY</span><span class="cb-ad-h">PHONES</span>
      <span class="cb-ad-s">Text a photo for a quote</span><span class="cb-ad-n">(555) 012-3456</span>
    </span>`;
}
/* a colour's plain name for a chip: light navy, deep red, gold */
function cbShadeName(hex){
  const Y = pgLum(hex), n = cbNearest(hex).name.toLowerCase();
  return Y > 0.35 ? 'light ' + n : Y < 0.09 ? 'deep ' + n : n;
}
function cbSetLabel(set){ return (set.mode === 'light' ? 'White' : set.g.name) + ' with ' + set.a.name.toLowerCase(); }
function cbRender(root){
  const st = root.__cb, opts = st.opts || {};
  const S = cbColour(st.start) || cbColour('navy');
  const { list, left } = cbPartnersOf(st.start);
  const focus = document.activeElement && root.contains(document.activeElement) ? document.activeElement.dataset.cbf : null;
  st.p = cbClamp(st.p, 0, Math.max(0, list.length - 1));
  const pick = list[st.p] || null;
  const sets = pick ? pick.sets : [];
  st.a = cbClamp(st.a, 0, Math.max(0, sets.length - 1));
  const set = sets[st.a] || null;
  st.s = set ? cbClamp(st.s, 0, set.supports.length - 1) : 0;
  const th = set ? cbTheme(set, st.s) : null;
  const saved = cbSaved();
  const isSaved = th && saved.find(t => cbSameColours(t, th));
  const nm = S.name.toLowerCase();
  /* a picked colour drawn darker or lighter in its job says so (rule 16) */
  let note = '';
  if (S.custom && set){
    const job = set.g.hex === S.hex ? ['background', set.c1] : set.a.hex === S.hex ? ['bright colour', set.accent]
      : set.pair && set.pair.hex === S.hex ? ['small print', (set.supports.find(x => x.from === 'b') || {}).hex] : null;
    const moved = job && job[1] && cbMoved(S.hex, job[1]);
    if (moved) note = `Your colour is used a little ${moved} as the ${job[0]}, so the words read.`;
  }
  const custom = S.custom ? S.hex : '#2b56f5';
  root.innerHTML = `<div class="cb${opts.modal ? ' in-modal' : ''}">
    <div class="cb-main">
      <section class="cb-step">
        <h3 class="cb-label"><span class="cb-num">1</span>Start with a colour</h3>
        <div class="cb-starts" role="radiogroup" aria-label="Colour to start with">
          ${CB_COLOURS.map(c => { const on = !S.custom && S.key === c.key;
            return `<button type="button" class="cb-start${on ? ' on' : ''}" role="radio" aria-checked="${on}" tabindex="${on || (S.custom && c.key === CB_COLOURS[0].key) ? 0 : -1}" data-k="${c.key}" data-cbf="s-${c.key}"><i style="background:${c.hex}"></i><span>${c.name}</span></button>`; }).join('')}
          <label class="cb-start cb-any${S.custom ? ' on' : ''}" data-cbf="s-any"><input type="color" value="${custom}" aria-label="Any colour" data-cbf="s-any-in"><i style="${S.custom ? 'background:' + S.hex : ''}"></i><span>Any colour</span></label>
        </div>
        ${S.custom ? `<p class="cb-hint">Your colour is nearest to ${nm}, so these are the colours that go with ${nm}.</p>` : ''}
      </section>
      <section class="cb-step">
        <h3 class="cb-label"><span class="cb-num">2</span>Pick a second colour</h3>
        <p class="cb-hint">What goes with ${nm}: our ready-made sets first, then other classic pairs. Each one is checked before you see it. The words read on it, for colour-blind people too.</p>
        <div class="cb-pairs" role="radiogroup" aria-label="Second colour">
          ${list.map((x, i) => { const t = cbTheme(x.sets[0], 0), on = i === st.p;
            return `<button type="button" class="cb-pair${on ? ' on' : ''}" role="radio" aria-checked="${on}" tabindex="${on ? 0 : -1}" data-i="${i}" data-cbf="p-${x.P.key}">
              ${cbAdHtml(t)}
              <span class="cb-pair-name">${escHtml(x.P.name)}</span>
              <span class="cb-pair-meta">${x.ready ? (x.n ? 'Ready-made · ' + x.n + ' designs' : 'Ready-made set') : 'Classic pair'}</span>
            </button>`; }).join('')}
        </div>
        ${left.length ? `<p class="cb-left"><b>Not shown:</b> ${left.map(l => escHtml(l.P.name) + ', because ' + escHtml(l.why.charAt(0).toLowerCase() + l.why.slice(1))).join('. ')}.</p>` : ''}
      </section>
    </div>
    <aside class="cb-side">
      <h3 class="cb-label"><span class="cb-num">3</span>Your colours</h3>
      ${th ? `
      ${cbAdHtml(th, true)}
      <div class="cb-name" aria-live="polite">${escHtml(th.name)}</div>
      <ul class="cb-roles">
        <li><i style="background:linear-gradient(135deg, ${th.bg.c1}, ${th.bg.c2})"></i><b>Background</b></li>
        <li><i style="background:${th.ink}"></i><b>Text</b></li>
        <li><i style="background:${th.accent}"></i><b>Bright colour</b><span>big words, the number's box</span></li>
        <li><i style="background:${th.support}"></i><b>Small print</b></li>
      </ul>
      ${sets.length > 1 ? `<div class="cb-opt"><div class="cb-sublabel">Background</div><div class="cb-chips">
        ${sets.map((x, i) => `<button type="button" class="chip${i === st.a ? ' on' : ''}" aria-pressed="${i === st.a}" data-a="${i}" data-cbf="a-${i}"><i style="background:${x.c1}"></i>${escHtml(cbSetLabel(x))}</button>`).join('')}
      </div></div>` : ''}
      ${set.supports.length > 1 ? `<div class="cb-opt"><div class="cb-sublabel">Small print</div><div class="cb-chips">
        ${set.supports.map((x, i) => `<button type="button" class="chip${i === st.s ? ' on' : ''}" aria-pressed="${i === st.s}" data-s="${i}" data-cbf="u-${i}"><i style="background:${x.hex}"></i>${escHtml(cbShadeName(x.hex))}</button>`).join('')}
      </div></div>` : ''}
      ${note ? `<p class="cb-note">${escHtml(note)}</p>` : ''}
      <div class="cb-actions">
        <button type="button" class="btn btn-primary" data-act="use" data-cbf="use">${escHtml(opts.useLabel || 'Use on a design')} &rarr;</button>
        <button type="button" class="btn btn-outline" data-act="save" data-cbf="save"${isSaved ? ' aria-pressed="true"' : ''}>${isSaved ? 'Saved' : 'Save'}</button>
      </div>
      ${pick.ready && pick.n && !opts.modal ? `<button type="button" class="cb-link" data-act="ready" data-cbf="ready">See the ${pick.n} ready-made ${escHtml(pick.ready)} designs</button>` : ''}
      ` : `<p class="cb-hint">Nothing goes with this colour yet. Try another.</p>`}
      <div class="cb-saved">
        <div class="cb-sublabel">Saved colours${saved.length ? ' <span class="n">' + saved.length + '</span>' : ''}</div>
        ${saved.length ? `<ul>${saved.map((t, i) => `<li><button type="button" class="cb-saved-use" data-u="${i}" data-cbf="v-${i}" title="Use ${escHtml(t.name)}"><span class="cb-saved-sw">${cbChipHtml(t)}</span>${escHtml(t.name.replace(/^Your /, ''))}</button><button type="button" class="cb-saved-del" data-d="${i}" data-cbf="d-${i}" aria-label="Delete ${escHtml(t.name)}">&times;</button></li>`).join('')}</ul>`
          : `<p class="cb-hint">Saved colours show up in the studio's colour row too. Using a set saves it.</p>`}
      </div>
    </aside>
  </div>`;
  /* events */
  const go = fn => e => { fn(e); cbRender(root); };
  root.querySelectorAll('.cb-start[data-k]').forEach(b => b.onclick = go(() => { st.start = b.dataset.k; st.p = st.a = st.s = 0; jset('pgfx_cb_start', st.start); }));
  const inp = root.querySelector('.cb-any input');
  if (inp){
    inp.oninput = () => { const i = root.querySelector('.cb-any i'); if (i) i.style.background = inp.value; };
    inp.onchange = go(() => { st.start = inp.value.toLowerCase(); st.p = st.a = st.s = 0; jset('pgfx_cb_start', st.start); });
  }
  root.querySelectorAll('.cb-pair').forEach(b => b.onclick = e => { st.p = +b.dataset.i; st.a = st.s = 0; cbRender(root);
    /* one column (a phone): the set is drawn below the list, so bring it up */
    if (e.isTrusted && window.matchMedia && matchMedia('(max-width:900px)').matches){ const side = root.querySelector('.cb-side'); if (side) side.scrollIntoView({ behavior:'smooth', block:'start' }); } });
  root.querySelectorAll('[data-a]').forEach(b => b.onclick = go(() => { st.a = +b.dataset.a; st.s = 0; }));
  root.querySelectorAll('[data-s]').forEach(b => b.onclick = go(() => { st.s = +b.dataset.s; }));
  root.querySelectorAll('.cb-saved-use').forEach(b => b.onclick = () => { const t = saved[+b.dataset.u]; if (t && opts.onUse) opts.onUse(t); });
  root.querySelectorAll('.cb-saved-del').forEach(b => b.onclick = () => { const t = saved[+b.dataset.d]; if (t){ cbDelete(t.name); toast(t.name.replace(/^Your /, '') + ' deleted'); } });
  const act = n => root.querySelector(`[data-act="${n}"]`);
  if (act('use')) act('use').onclick = () => { const t = cbSave(th); if (t && opts.onUse) opts.onUse(t); };
  if (act('save')) act('save').onclick = () => { if (isSaved) return; const t = cbSave(th); if (t) toast('Saved: ' + t.name.replace(/^Your /, '') + '. It is in the studio’s colour row too.', 'success'); };
  if (act('ready')) act('ready').onclick = () => {
    if (typeof SHOWCASE !== 'undefined' && SHOWCASE.filter && SHOWCASE.filter.fam === pick.ready){ const sec = $('lp-templates'); if (sec) sec.scrollIntoView({ behavior:'smooth', block:'start' }); return; }
    const b = [...document.querySelectorAll('#fam-grid .fam-card')].find(x => x.dataset.fam === pick.ready);
    if (b) b.click();
  };
  /* arrow keys move along a radio row, as a radio group should */
  root.querySelectorAll('[role=radiogroup]').forEach(g => g.addEventListener('keydown', e => {
    const items = [...g.querySelectorAll('[role=radio]')], i = items.indexOf(document.activeElement);
    if (i < 0) return;
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!d) return;
    e.preventDefault(); const n = items[(i + d + items.length) % items.length]; n.focus(); n.click();
  }));
  if (focus){ const el = root.querySelector(`[data-cbf="${focus}"]`); if (el) el.focus({ preventScroll:true }); }
}

/* ── the landing: the twelve ready-made sets, or build your own ─────────── */
function cbLandingInit(){
  const tabs = $('cb-tabs'), grid = $('fam-grid'), root = $('cb-root');
  if (!tabs || !grid || !root) return;
  grid.setAttribute('role', 'tabpanel'); grid.setAttribute('aria-labelledby', 'cb-tab-ready');
  const show = which => {
    const build = which === 'build';
    tabs.querySelectorAll('[role=tab]').forEach(b => { const on = b.dataset.tab === which; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; b.classList.toggle('on', on); });
    grid.hidden = build; root.hidden = !build;
    if (build && !root.__cb) cbMount(root, { onUse: th => { showEasy(null); applyColorTheme(th); } });
    try { localStorage.setItem('pgfx_cb_tab', which); } catch (e){}
  };
  tabs.querySelectorAll('[role=tab]').forEach(b => {
    b.onclick = () => show(b.dataset.tab);
    b.onkeydown = e => { if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return; e.preventDefault();
      const all = [...tabs.querySelectorAll('[role=tab]')], n = all[(all.indexOf(b) + 1) % all.length]; n.focus(); show(n.dataset.tab); };
  });
  let last = 'ready'; try { last = localStorage.getItem('pgfx_cb_tab') || 'ready'; } catch (e){}
  show(last === 'build' ? 'build' : 'ready');
}

/* ── the studio: the same builder in a dialog, from the + in a colour row ── */
function cbOpenModal(apply){
  let ov = $('cb-overlay');
  if (!ov){
    ov = document.createElement('div'); ov.className = 'modal-overlay'; ov.id = 'cb-overlay';
    ov.innerHTML = `<div class="modal cb-modal" role="dialog" aria-modal="true" aria-labelledby="cb-modal-title">
        <h3 id="cb-modal-title">Make your own colours</h3>
        <div class="modal-sub">Pick a colour to start with, then a second colour that goes with it.</div>
        <div id="cb-modal-root"></div>
        <div class="modal-actions"><button type="button" class="btn btn-ghost" id="cb-close">Close</button></div>
      </div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click', e => { if (e.target === ov) cbCloseModal(); });
    $('cb-close').onclick = cbCloseModal;
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && ov.classList.contains('show')) cbCloseModal(); });
  }
  cbOpenModal.back = document.activeElement;
  cbMount($('cb-modal-root'), { modal:true, useLabel:'Use these colours', onUse: th => { cbCloseModal(); apply(th); } });
  ov.classList.add('show');
  const first = ov.querySelector('.cb-start.on') || ov.querySelector('.cb-start');
  if (first) first.focus({ preventScroll:true });
}
function cbCloseModal(){
  const ov = $('cb-overlay'); if (ov) ov.classList.remove('show');
  const b = cbOpenModal.back; if (b && b.isConnected) try { b.focus({ preventScroll:true }); } catch (e){}
}

function cbInit(){
  cbLandingInit();
  /* a colour row app.js built before this file loaded */
  const ezr = $('ez-themes');
  if (ezr && ezr.dataset.built && !CB_ROWS.has(ezr)){ cbThemeChips(ezr, applyColorTheme); syncEzThemes(); }
  const edr = $('ed-themes');
  if (edr && typeof edBind === 'function' && edBind.done && !CB_ROWS.has(edr)) cbThemeChips(edr, th => { edRecolour({ theme: th }); toast(th.name + ' on the whole card', 'success'); });
  if (typeof SHOWCASE !== 'undefined' && SHOWCASE.palN) cbOnCounts();
}
if (typeof document !== 'undefined'){
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', cbInit); else cbInit();
}
