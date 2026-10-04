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
 * WHAT "GOES WITH" MEANS (DESIGN-LAW 110). The partners of each colour are a
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
   a teal and a dark pink is wine). `lY` is the luminance a colour takes as a
   LIGHT background, for the colours whose name needs light (a yellow sign,
   a gold card, a cyan or pink poster); navy, blue, teal, green, red and
   purple drawn that light are pastels, so on Light they are the words, or a
   breath of colour in a white background. Black and white are always the
   background, black on Dark and white on Light. */
const CB_COLOURS = [
  { key:'navy',   name:'Navy',   hex:'#0b2a6b', band:[0.004, 0.06], ground:true, gY:0.024 },
  { key:'blue',   name:'Blue',   hex:'#1d4ed8', band:[0.04, 0.32],  ground:true, gY:0.06 },
  { key:'cyan',   name:'Cyan',   hex:'#06b6d4', band:[0.25, 0.75], lY:0.55 },
  { key:'teal',   name:'Teal',   hex:'#0f766e', band:[0.03, 0.55],  ground:true, gY:0.035 },
  { key:'green',  name:'Green',  hex:'#16a34a', band:[0.04, 0.6],   ground:true, gY:0.035 },
  { key:'lime',   name:'Lime',   hex:'#84cc16', band:[0.22, 0.85], lY:0.55 },
  { key:'gold',   name:'Gold',   hex:'#f5b301', band:[0.33, 0.75], lY:0.55 },
  { key:'yellow', name:'Yellow', hex:'#facc15', band:[0.4, 0.9], lY:0.7 },
  { key:'orange', name:'Orange', hex:'#ff7a00', band:[0.2, 0.55], lY:0.45 },
  { key:'red',    name:'Red',    hex:'#e11d2a', band:[0.07, 0.3],   ground:true, gY:0.03 },
  { key:'pink',   name:'Pink',   hex:'#ec4899', band:[0.08, 0.6], lY:0.5 },
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
/* the house's OKLCH and luminance (hexToOklch, pgLum), each answer kept: a
   slider's range asks for the same colours thousands of times */
const CB_OK = new Map(), CB_LUM = new Map();
function cbOk(hex){
  let v = CB_OK.get(hex);
  if (v === undefined){ if (CB_OK.size > 40000) CB_OK.clear(); v = hexToOklch(hex); CB_OK.set(hex, v); }
  return v && { L:v.L, C:v.C, h:v.h };
}
function cbLum(hex){
  let v = CB_LUM.get(hex);
  if (v === undefined){ if (CB_LUM.size > 40000) CB_LUM.clear(); v = pgLum(hex); CB_LUM.set(hex, v); }
  return v;
}
/* the same few colours are simulated thousands of times while a slider's
   range is found; each answer is kept (a few thousand entries at most) */
const CB_SIM = new Map();
function cbSim(hex, kind){
  const k = hex + kind, hit = CB_SIM.get(k);
  if (hit) return hit;
  if (CB_SIM.size > 20000) CB_SIM.clear();
  const out = cbSimNow(hex, kind); CB_SIM.set(k, out); return out;
}
function cbSimNow(hex, kind){
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
  return pgCr(cbLum(a), cbLum(b));
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
    if (cbLum(hex) < Y) lo = L; else hi = L;
  }
  return hex;
}
/* rule 103's muddy(): the lightest luminance a warm hue holds as its colour */
function cbMuddyFloor(h){ return h >= 35 && h < 45 ? 0.12 : h >= 45 && h < 65 ? 0.2 : h >= 65 && h < 105 ? 0.33 : h >= 105 && h < 120 ? 0.3 : h >= 120 && h < 140 ? 0.22 : 0; }
const cbWarm = h => h >= 35 && h < 140;
const cbCool = h => h >= 140 && h <= 330;
function cbGap(a, b){ const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; }
function cbDist(a, b){ const p = cbOk(a), q = cbOk(b); if (!p || !q) return 1;
  const ar = p.h * Math.PI / 180, br = q.h * Math.PI / 180;
  return Math.hypot(p.L - q.L, p.C * Math.cos(ar) - q.C * Math.cos(br), p.C * Math.sin(ar) - q.C * Math.sin(br)); }
const cbClamp = (x, a, b) => Math.max(a, Math.min(b, x));
/* rule 103's chroma floor (C 0.12, 0.13 for a warm hue: under it gold is
   khaki and blue slate), where the screen can show it. A light blue, a mid
   teal or a deep teal cannot reach 0.12 at all (a deep teal holds 0.07);
   there the floor is the most the gamut holds, less a margin, and never
   under 0.06. Less the rounding of 8-bit hex. */
const CB_MINC = new Map();
function cbMinC(hex){
  if (CB_MINC.has(hex)) return CB_MINC.get(hex);
  const o = cbOk(hex), base = cbWarm(o.h) ? 0.13 : 0.12;
  const most = cbOk(oklchFit({ L:o.L, C:0.4, h:o.h })).C;
  const v = Math.max(0.06, Math.min(base, most - 0.012)) - 0.004;
  if (CB_MINC.size > 20000) CB_MINC.clear();
  CB_MINC.set(hex, v); return v;
}

/* a colour as the builder uses it: its hue and chroma, the name it reads as,
   and the band and job that name allows. A colour the visitor picks takes
   the band and partners of the named colour nearest it. */
function cbColour(keyOrHex){
  if (CB_BY[keyOrHex]) return cbWith(CB_BY[keyOrHex], CB_BY[keyOrHex].hex);
  const hex = String(keyOrHex || '').toLowerCase();
  const o = cbOk(hex); if (!o) return null;
  return Object.assign(cbWith(cbNearest(hex), hex), { custom:true });
}
function cbWith(base, hex){
  const o = cbOk(hex) || { L:0.5, C:0, h:0 }, Y = cbLum(hex);
  const c = Object.assign({}, base, { hex, h:o.h, C:o.C, L:o.L, Y });
  /* a picked colour that can be a background is drawn as near its own
     lightness as a dark background allows */
  if (hex !== base.hex && base.ground) c.gY = cbClamp(Y, 0.008, base.gY * 1.6);
  return c;
}
function cbNearest(hex){
  const o = cbOk(hex);
  if (!o || o.C < 0.045) return CB_BY[o && o.L > 0.6 ? 'white' : 'black'];
  let best = null, bd = Infinity;
  CB_COLOURS.forEach(c => { if (c.neutral) return; const q = cbOk(c.hex);
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
  light:   (g)    => `${g.name} drawn light enough for a light background is a pastel`,
  white:   ()     => `on a dark background white is already the text; it is the background on Light`,
  black:   ()     => `on a light background black is already the text; it is the background on Dark`,
};
function cbSolve(G, A, mode){
  if (!G || !A) return { why:'' };
  if (!G.neutral && !A.neutral && cbGap(G.h, A.h) < 30) return { why:CB_WHY.same(G, A) };
  if (A.neutral) return { why:'' };
  if (mode === 'dark' && (G.neutral === 'light' || (!G.neutral && !G.ground))) return { why:CB_WHY.ground(G) };
  if (mode === 'light' && G.neutral === 'dark') return { why:CB_WHY.black() };
  if (mode === 'light' && !G.neutral && !G.lY) return { why:CB_WHY.light(G) };
  const floorA = Math.max(A.band[0], cbMuddyFloor(A.h));
  const accC = Math.max(A.C, cbWarm(A.h) ? 0.17 : 0.16);
  let lastWhy = CB_WHY.band(G, A, mode);
  /* on white: the cool colour of the two (navy, blue, teal, green, purple,
     cyan) tints the white and darkens the text; with none, silver and navy */
  const cool = mode === 'light' ? [G.tint, A, G.neutral ? null : G].find(c => c && !c.neutral && cbCool(c.h)) : null;
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
  } else if (!G.neutral){
    /* a light colour as the background: a real colour, never a pastel (rule
       103), as near its own lightness as the words allow */
    const C = Math.min(Math.max(G.C, 0.15), 0.2);
    [G.lY, G.lY * 1.12, G.lY * 1.25, G.lY * 0.9].forEach(Y0 => {
      const Y = cbClamp(Y0, G.band[0], Math.min(G.band[1], 0.86)), c1 = cbAtY(G.h, C, Y);
      if (cbOk(c1).C >= cbMinC(c1) && !grounds.some(g => g[0] === c1)) grounds.push([c1, cbAtY(G.h, C, Y * 0.86)]);
    });
  } else {
    /* a near-white the visitor picked keeps its own breath of colour */
    const mine = G.custom && G.neutral === 'light';
    const tc = mine ? Math.min(G.C, 0.02) : cool ? 0.012 : 0.008, th = mine ? G.h : cool ? cool.h : 250;
    grounds.push([oklchFit({ L:0.975, C:tc, h:th }), oklchFit({ L:0.93, C:tc + 0.004, h:th })]);
  }
  for (const [c1, c2] of grounds){
    let ink;
    if (mode === 'dark') ink = oklchFit({ L:0.975, C:G.neutral ? 0.006 : 0.012, h:G.neutral ? 258 : G.h });
    else ink = cbAtY(cool ? cool.h : 264, 0.045, G.neutral ? 0.011 : 0.008);
    const Yi = cbLum(ink), Y1 = cbLum(c1), Y2 = cbLum(c2), Ylit = Math.max(Y1, Y2), Ydim = Math.min(Y1, Y2);
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
      const o = cbOk(c);
      if (cbLum(c) < floorA - 1e-4){ lastWhy = CB_WHY.band(G, A, mode); continue; }
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
  const out = [], Yi = cbLum(ink), Ya = cbLum(acc);
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
  if (mode === 'light' && G.neutral){ const o = cbOk(ink); fams.push({ from:'i', h:o.h, band:[0, 1], name:'' }); }
  fams.forEach(f => {
    const floor = Math.max(f.band[0], cbMuddyFloor(f.h)), C = cbWarm(f.h) ? 0.13 : 0.12;
    /* lighter and softer than the bright colour on a dark background (a
       darker warm shade is the olive and mustard rule 103 removed), deeper on
       white */
    const Ys = mode === 'dark' ? [Ya + 0.2, Ya + 0.14, 0.62, 0.5, 0.42] : [Ya * 0.62, Ya * 1.25, 0.075, 0.05, 0.11];
    for (const Y0 of Ys){
      const Y = cbClamp(Y0, floor, f.band[1]);
      const c = cbAtY(f.h, C, Y), o = cbOk(c);
      if (o.C < cbMinC(c) || cbLum(c) < floor - 1e-4) continue;
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
  const g = cbOk(th.bg.c1) || { h:258, C:0 };
  const deep = cbAtY(g.C < 0.03 ? 258 : g.h, 0.05, 0.012);
  return [th.ink, deep, '#ffffff'].sort((p, q) => cbCr(q, th.accent) - cbCr(p, th.accent))[0];
}

/* every arrangement of two colours that passes in a look, best first.
   Dark: the first colour as the deep background where it can be one, then
   the second; black is always the background, white is the text. Light:
   the first colour as a light background where it can be one, then the
   second, then white with either as the big words; white is always the
   background, black is the text. */
function cbArrangements(S, P, mode){
  mode = mode === 'light' ? 'light' : 'dark';
  const ok = [], why = [];
  const run = r => { if (r.set) ok.push(r.set); else if (r.why) why.push(r.why); };
  if (mode === 'dark'){
    if (S.neutral === 'light' || P.neutral === 'light') return { ok, why:[CB_WHY.white()] };
    if (S.neutral === 'dark') run(cbSolve(S, P, 'dark'));
    else if (P.neutral === 'dark') run(cbSolve(P, S, 'dark'));
    else { run(cbSolve(S, P, 'dark')); run(cbSolve(P, S, 'dark')); }
  } else {
    if (S.neutral === 'dark' || P.neutral === 'dark') return { ok, why:[CB_WHY.black()] };
    if (S.neutral === 'light') run(cbSolve(S, P, 'light'));
    else if (P.neutral === 'light') run(cbSolve(P, S, 'light'));
    else { run(cbSolve(S, P, 'light')); run(cbSolve(P, S, 'light')); run(cbSolveLightPair(P, S)); run(cbSolveLightPair(S, P)); }
  }
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
    .find(c => cbLum(c) >= floor - 1e-4 && cbOk(c).C >= cbMinC(c) && cbWorst(c, [s.c1, s.c2]) >= 4.5 && cbDist(c, s.accent) >= 0.07 && cbDist(c, s.ink) >= 0.1);
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
  if (set.mode === 'light' && set.g.neutral) return set.pair ? set.pair.name + ' & ' + set.a.name + ' on White' : 'White & ' + set.a.name;
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
  const muddy = [th.accent, th.support].filter(c => { const o = cbOk(c); return o.C >= 0.05 && cbLum(c) < cbMuddyFloor(o.h) - 1e-4; });
  const ok = rows.text >= 4.5 && rows.bright >= 4.5 && rows.brightCvd >= 3 && rows.brightVsText >= 1.7 && rows.small >= 4.5 && rows.number >= 3 && !muddy.length;
  return { ok, rows, muddy };
}

/* ── the partners of a starting colour ────────────────────────────────────
   Best first: rule 103's ready-made sets, by how many live designs use them
   (`counts`, by set name, counted on the page), then the rest in
   CB_PARTNERS' order. A partner whose set comes out looking the same as one
   already listed (yellow drawn deep enough for white text is gold) is left
   out and said so, like a partner that cannot pass. */
const CB_READY_LIGHT = { 'Silver & Blue':1 };
function cbPartners(S, counts, mode){
  mode = mode === 'light' ? 'light' : 'dark';
  const base = S.custom ? cbNearest(S.hex) : CB_BY[S.key];
  const keys = (CB_PARTNERS[base.key] || []).slice();
  /* a ready-made set is ready-made in its own look: Silver & Blue is light,
     the other eleven dark */
  const ready = k => { const r = cbReady(base.key, k); return r && !!CB_READY_LIGHT[r] === (mode === 'light') ? r : null; };
  const n = k => (counts && ready(k) && counts[ready(k)]) || 0;
  keys.sort((a, b) => (!!ready(b) - !!ready(a)) || (n(b) - n(a)));
  const list = [], left = [];
  keys.forEach(k => {
    const P = cbColour(k);
    if (S.custom && P.key === base.key) return;
    const r = cbArrangements(S, P, mode);
    if (!r.ok.length){
      const other = mode === 'light' ? 'dark' : 'light';
      left.push({ P, why:cbPairWhy(S, P, r.why, mode), other: cbArrangements(S, P, other).ok.length ? other : null }); return; }
    const a = r.ok[0];
    const twin = list.find(x => cbDist(x.sets[0].accent, a.accent) < 0.05 && cbDist(x.sets[0].c1, a.c1) < 0.05);
    if (twin){ left.push({ P, why:`next to ${S.name.toLowerCase()}, ${P.name.toLowerCase()} comes out the same as ${twin.P.name.toLowerCase()}` }); return; }
    list.push({ P, sets:r.ok, ready:ready(k), n:n(k) });
  });
  return { list, left };
}
function cbPairWhy(S, P, whys, mode){
  const bright = c => !c.neutral && !c.ground;
  if (mode !== 'light' && bright(S) && bright(P)) return CB_WHY.both(S, P);
  /* the attempt that got furthest says most: one that made a background and
     failed on the words, before one that could not make the background */
  const deeper = whys.filter(w => !/cannot be a dark background|is a pastel/.test(w));
  return deeper[0] || whys[0] || '';
}
/* a picked colour, as the builder will draw it in its job: how far it moved,
   and which way, so the builder can say so (rule 16) */
function cbMoved(picked, used){
  if (!picked || !used || cbDist(picked, used) < 0.05) return null;
  return cbLum(used) < cbLum(picked) ? 'darker' : 'lighter';
}

/* ── making a set your own ────────────────────────────────────────────────
   Owner, 2026-10-04: "we just need to be able to tweak it to our liking or
   the style of our business". Every control moves one colour of one job, and
   only as far as the set still passes: a slider's ends are the last values
   that pass with the other colours as they stand (cbRange), so a tweak makes
   a set lighter, darker, quieter or louder, never unreadable. A colour
   typed or picked exactly (a business's own) is used as typed where it
   passes; where it does not, the others move first to make room for it, then
   it moves, keeping its hue, and the page says what moved (rule 16). The
   tweaks are `tw`: { bg, acc, sup } as OKLCH {L, C, h}, `grad` (flat, soft,
   deep) and `name`. */
const CB_JOBS = { bg:'background', acc:'bright colour', sup:'small print' };
function cbLch(hex){ const o = cbOk(hex) || { L:0.5, C:0, h:0 }; return { L:o.L, C:o.C, h:o.h }; }
function cbRoleHex(th, key){ return key === 'bg' ? th.bg.c1 : key === 'acc' ? th.accent : th.support; }
/* the background's second stop for a style: Soft is the set's own step
   from the first stop to the second (as the solver drew it), Deep twice
   that, Flat none */
function cbStop2(c1, base, grad){
  if (grad === 'flat') return c1;
  const o = cbLch(c1), b1 = cbLch(base.bg.c1), b2 = cbLch(base.bg.c2);
  const dL = Math.max(0.02, b1.L - b2.L), kC = b1.C > 0.005 ? Math.min(1.2, b2.C / b1.C) : 1;
  return oklchFit({ L:Math.max(0.02, o.L - (grad === 'deep' ? Math.max(2 * dL, 0.1) : dL)), C:o.C * kC, h:o.h });
}
function cbApply(base, mode, tw){
  tw = tw || {};
  const th = { name:base.name, family:'Yours', bg:Object.assign({}, base.bg), accent:base.accent, ink:base.ink, support:base.support,
    mine:true, made:Object.assign({}, base.made || {}, { mode }) };
  if (base.aka) th.aka = base.aka.slice();
  if (tw.bg){
    th.bg.c1 = oklchFit(tw.bg);
    /* on Dark the text is a near-white with a breath of the background */
    if (mode !== 'light'){ const o = cbLch(th.bg.c1); th.ink = oklchFit({ L:0.975, C:o.C < 0.03 ? 0.006 : 0.012, h:o.h }); }
  }
  if (tw.bg || tw.grad) th.bg.c2 = cbStop2(th.bg.c1, base, tw.grad || 'soft');
  if (tw.grad) th.made.grad = tw.grad;
  if (tw.acc) th.accent = oklchFit(tw.acc);
  if (tw.sup) th.support = oklchFit(tw.sup);
  if (tw.name && tw.name.trim()) th.name = tw.name.trim().slice(0, 40);
  return th;
}
/* the law, and three jobs in three colours: the bright colour stays a colour
   (rule 103's chroma floor), the small print is neither the bright colour
   nor the text */
function cbTweakOk(th){
  if (!cbCheck(th).ok) return false;
  const ac = cbOk(th.accent), sp = cbOk(th.support), g = cbOk(th.bg.c1), ik = cbOk(th.ink);
  if (ac.C < cbMinC(th.accent) || sp.C < cbMinC(th.support)) return false;
  if (cbDist(th.accent, th.support) < 0.06 || cbDist(th.support, th.ink) < 0.08) return false;
  return cbFamilies(th) <= 2;
}
/* how many colour families a set carries (rules 95, 103: two at most): the
   bright colour, the small print and the background when it is a colour;
   the text is near-black or near-white and does not count. Within 30
   degrees is one family. */
function cbFamilies(th){
  const hues = [th.accent, th.support].concat(th.bg.c1).map(cbOk)
    .filter((o, i) => i < 2 || o.C >= 0.03).map(o => o.h);
  const fams = [];
  hues.forEach(h => { if (!fams.some(f => cbGap(f, h) <= 30)) fams.push(h); });
  return fams.length;
}
function cbCur(base, mode, tw, key){ return Object.assign(cbLch(cbRoleHex(cbApply(base, mode, tw), key)), tw[key] || {}); }
/* the passing range of one field of one job, the others held: the run of
   passing values (on the grid cur ± k·step, so a slider stepping from its
   low end lands only on checked values) that holds the current value, or
   the nearest run to it */
function cbRange(base, mode, tw, key, field){
  const cur = cbCur(base, mode, tw, key);
  const step = field === 'L' ? 0.01 : 0.005, lo0 = field === 'L' ? 0.03 : 0, hi0 = field === 'L' ? 0.99
    : Math.max(cur.C, cbOk(oklchFit({ L:cur.L, C:0.4, h:cur.h })).C);     // as vivid as the screen goes at that lightness
  const ok = v => cbTweakOk(cbApply(base, mode, Object.assign({}, tw, { [key]:Object.assign({}, cur, { [field]:v }) })));
  const c = Math.min(cur[field], hi0), vals = [];
  for (let v = c; v >= lo0 - 1e-9; v -= step) vals.unshift(v);
  for (let v = c + step; v <= hi0 + 1e-9; v += step) vals.push(v);
  const pass = vals.map(ok), at = vals.indexOf(c);
  let i = at;
  if (!pass[i]){ let best = -1; pass.forEach((p, j) => { if (p && (best < 0 || Math.abs(j - at) < Math.abs(best - at))) best = j; }); if (best < 0) return null; i = best; }
  let a = i, z = i;
  while (a > 0 && pass[a - 1]) a--;
  while (z < vals.length - 1 && pass[z + 1]) z++;
  return { lo:vals[a], hi:vals[z], v:vals[i], step };
}
/* the nearest lightness of one job that passes, its hue held; a bright
   colour or small print keeps rule 103's chroma floor at the lightness it
   moves to (an olive lightened at its own chroma is khaki) */
function cbFit(base, mode, tw, key){
  const cur = cbCur(base, mode, tw, key), C0 = key === 'bg' ? cur.C : Math.max(cur.C, cbWarm(cur.h) ? 0.13 : 0.12);
  for (let d = 0; d <= 0.95; d += 0.005)
    for (const L of d ? [cur.L - d, cur.L + d] : [cur.L]){
      if (L < 0.02 || L > 0.995) continue;
      const t = Object.assign({}, tw, { [key]:Object.assign({}, cur, { L, C:d ? C0 : cur.C }) });
      if (cbTweakOk(cbApply(base, mode, t))) return t;
    }
  return null;
}
/* a fresh small print for a changed set: rule 103's shades of the
   background's family or the bright colour's, as the solver picks them */
function cbFreshSupport(base, mode, tw){
  const th = cbApply(base, mode, tw);
  const G = cbColour(th.bg.c1), A = cbColour(th.accent);
  if (!G || !A || A.neutral) return null;
  const list = cbSupports(G, A, mode, th.bg.c1, th.bg.c2, th.ink, th.accent);
  for (const s of list){ const t = Object.assign({}, tw, { sup:cbLch(s.hex) }); if (cbTweakOk(cbApply(base, mode, t))) return t; }
  return null;
}
/* after an exact colour: keep it where the set can be made to pass around
   it. Plans, in order: the small print alone (fitted, then fresh), the other
   main colour, the other main colour with a fresh small print, and only then
   the visitor's own colour. Returns the tweaks and the jobs that moved. */
function cbSettle(base, mode, tw, key){
  const ok = t => cbTweakOk(cbApply(base, mode, t));
  if (ok(tw)) return { tw, moved:[] };
  const solve = (t, keys) => {
    if (ok(t)) return t;
    if (!keys.length) return null;
    const [k, ...rest] = keys;
    if (k === 'fresh'){ const f = cbFreshSupport(base, mode, t); return f && (rest.length ? solve(f, rest) : f); }
    if (!rest.length) return cbFit(base, mode, t, k);
    const cur = cbCur(base, mode, t, k);
    for (let d = 0; d <= 0.9; d += 0.02)
      for (const L of d ? [cur.L - d, cur.L + d] : [cur.L]){
        if (L < 0.02 || L > 0.995) continue;
        const r = solve(Object.assign({}, t, { [k]:Object.assign({}, cur, { L }) }), rest);
        if (r) return r;
      }
    return null;
  };
  const other = key === 'bg' ? 'acc' : 'bg';
  const plans = key === 'sup' ? [['sup']] : [['sup'], ['fresh'], [other], [other, 'fresh'], [key], [key, 'fresh']];
  const was = cbApply(base, mode, tw);
  for (const plan of plans){
    const t = solve(tw, plan);
    if (t){ const now = cbApply(base, mode, t);
      return { tw:t, moved:['bg', 'acc', 'sup'].filter(k => cbRoleHex(was, k) !== cbRoleHex(now, k)) }; }
  }
  return null;
}
/* an exact colour for a job; a small print in the old colour's family moves
   to the new one, so the set stays two families (rules 95, 103) */
function cbExact(base, mode, tw, key, hex){
  const before = cbApply(base, mode, tw), next = cbLch(hex);
  let t = Object.assign({}, tw, { [key]:next });
  if (key !== 'sup'){
    const old = cbLch(cbRoleHex(before, key)), sp = cbLch(before.support);
    if (old.C >= 0.03 && cbGap(old.h, sp.h) <= 30 && next.C >= 0.03) t.sup = Object.assign({}, sp, { h:(next.h + (sp.h - old.h) + 360) % 360 });
  }
  /* a grey, white or black is not a bright colour: the money word has to be
     a colour to stand out from the text */
  if (key !== 'bg' && next.C < 0.03) return { why:`A grey, white or black cannot be the ${CB_JOBS[key]}: it has to be a colour to stand out. It can be the background.` };
  /* a light background on Dark, a dark one on Light, is the other look */
  if (key === 'bg' && mode !== 'light' && cbLum(hex) > 0.3) return { why:'That is a light colour. Switch to Light to use it as the background.', other:'light' };
  if (key === 'bg' && mode === 'light' && cbLum(hex) < 0.12) return { why:'That is a dark colour. Switch to Dark to use it as the background.', other:'dark' };
  const r = cbSettle(base, mode, t, key);
  if (!r){
    if (key === 'sup' && cbFamilies(cbApply(base, mode, t)) > 2) return { why:'The small print has to be a shade of the background or the bright colour, so the ad stays two colours. That one would be a third.' };
    return { why:`That colour cannot be the ${CB_JOBS[key]} of this set and still read. Try another, or change the background first.` };
  }
  const after = cbApply(base, mode, r.tw), notes = [];
  if (cbDist(hex, cbRoleHex(after, key)) >= 0.02){
    const dir = cbLum(cbRoleHex(after, key)) < cbLum(hex) ? 'darker' : 'lighter';
    notes.push(`Your ${hex} is used a little ${dir} (${cbRoleHex(after, key)}) as the ${CB_JOBS[key]}, so the words read.`);
  }
  r.moved.filter(k => k !== key).forEach(k => { const a = cbRoleHex(before, k), b = cbRoleHex(after, k);
    if (cbDist(a, b) >= 0.02) notes.push(`The ${CB_JOBS[k]} is now ${b}, to go with your colour.`); });
  return { tw:r.tw, note:notes.join(' ') };
}

/* ── the visitor's saved sets ─────────────────────────────────────────────
   As many as they like, on this device (localStorage, like the brand kit
   and the drafts). A saved set is found by name wherever a theme is
   (ezThemeByName in app.js reads the same key, and an old name kept in
   `aka` after a rename), so a draft or a project made with one reopens in
   it. */
const CB_KEY = 'pgfx_my_colours';
function cbSaved(){
  const v = jget(CB_KEY, []);
  return Array.isArray(v) ? v.filter(t => t && t.name && t.bg && t.bg.c1 && t.bg.c2 && t.accent && t.ink && t.support) : [];
}
function cbSameColours(a, b){ return a.bg.c1 === b.bg.c1 && a.bg.c2 === b.bg.c2 && a.accent === b.accent && a.ink === b.ink && a.support === b.support; }
function cbUniqueName(want, list, except){
  const taken = n => list.some(t => t.name === n && t.name !== except) || (typeof COLOR_THEMES !== 'undefined' && COLOR_THEMES.some(t => t.name === n));
  let name = want, k = 2;
  while (taken(name)) name = want + ' ' + k++;
  return name;
}
/* a new set: named as the visitor typed it, else "Your Navy & Gold" */
function cbSave(th, typed){
  if (!cbTweakOk(th)) return null;
  const list = cbSaved(), same = list.find(t => cbSameColours(t, th) && (!typed || t.name === th.name));
  if (same) return same;
  const t = Object.assign({}, th, { name:cbUniqueName(typed ? th.name : 'Your ' + th.name.replace(/^Your /, ''), list), saved:Date.now() });
  delete t.aka;
  list.push(t); jset(CB_KEY, list);
  cbRefresh();
  return t;
}
/* an edited set replaces itself; a new name keeps the old one in `aka` */
function cbUpdate(oldName, th){
  if (!cbTweakOk(th)) return null;
  const list = cbSaved(), i = list.findIndex(t => t.name === oldName);
  if (i < 0) return cbSave(th, true);
  const prev = list[i], name = cbUniqueName(th.name || oldName, list, oldName);
  const aka = (prev.aka || []).concat(name !== oldName ? [oldName] : []).filter((n, j, a) => n !== name && a.indexOf(n) === j);
  const t = Object.assign({}, th, { name, saved:prev.saved || Date.now(), edited:Date.now() });
  if (aka.length) t.aka = aka; else delete t.aka;
  list[i] = t; jset(CB_KEY, list);
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
   and keeps its state there: the look (dark or light), the starting colour
   (a key, or the hex the visitor picked), a second colour the visitor
   picked, the partner, the arrangement, the small print, the tweaks, and
   the saved set being edited. */
const CB_PARTNER_CACHE = new Map();
function cbCounts(){ return (typeof SHOWCASE !== 'undefined' && SHOWCASE.palN) || {}; }
function cbPartnersOf(start, mode){
  const counts = cbCounts(), k = mode + '|' + start + '|' + Object.keys(counts).map(n => n + counts[n]).join();
  if (!CB_PARTNER_CACHE.has(k)) CB_PARTNER_CACHE.set(k, cbPartners(cbColour(start) || cbColour('navy'), counts, mode));
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
  root.__cb = root.__cb || { start:(CB_BY[last] || /^#[0-9a-f]{6}$/i.test(String(last))) ? last : 'navy',
    mode:jget('pgfx_cb_mode', 'dark') === 'light' ? 'light' : 'dark', p:0, a:0, s:0, tw:{}, pHex:null, edit:null, note:'', noteOther:null };
  root.__cb.opts = opts || {};
  cbRender(root);
}
/* a fresh choice clears the tweaks, the note and an edit */
function cbFresh(st){ st.p = st.a = st.s = 0; st.tw = {}; st.note = ''; st.noteOther = null; st.edit = null; }
/* a sample ad in a set's colours: the jobs of rule 51, as an ad shows them */
function cbAdHtml(th, big){
  const label = big ? ` role="img" aria-label="A sample ad in ${escHtml(th.name)}"` : ' aria-hidden="true"';
  return `<span class="cb-ad${big ? ' big' : ''}"${label} style="${cbAdVars(th)}">
      <span class="cb-ad-k">WE BUY</span><span class="cb-ad-h">PHONES</span>
      <span class="cb-ad-s">Text a photo for a quote</span><span class="cb-ad-n">(555) 012-3456</span>
    </span>`;
}
function cbAdVars(th){ return `--g1:${th.bg.c1};--g2:${th.bg.c2};--ink:${th.ink};--acc:${th.accent};--sup:${th.support};--pin:${cbPlateInk(th)}`; }
/* a colour's plain name for a chip: light navy, deep red, gold */
function cbShadeName(hex){
  const Y = cbLum(hex), n = cbNearest(hex).name.toLowerCase();
  return Y > 0.35 ? 'light ' + n : Y < 0.09 ? 'deep ' + n : n;
}
function cbSetLabel(set){ return (set.mode === 'light' && set.g.neutral ? 'White' : set.g.name) + ' with ' + set.a.name.toLowerCase(); }
function cbModeName(m){ return m === 'light' ? 'Light' : 'Dark'; }
/* what the builder is showing: the partner list, and the set in the panel */
function cbView(st){
  const S = cbColour(st.start) || cbColour('navy');
  const { list, left } = cbPartnersOf(st.start, st.mode);
  let own = null;
  if (st.pHex){
    const P = cbColour(st.pHex), r = P && cbArrangements(S, P, st.mode);
    own = { P:Object.assign({}, P, { name:'Your colour' }), own:true, sets:r ? r.ok : [], why:r && !r.ok.length ? cbPairWhy(S, P, r.why, st.mode) : '' };
  }
  const items = own && own.sets.length ? [own].concat(list) : list;
  st.p = cbClamp(st.p, 0, Math.max(0, items.length - 1));
  const pick = st.edit ? null : items[st.p] || null, sets = pick ? pick.sets : [];
  st.a = cbClamp(st.a, 0, Math.max(0, sets.length - 1));
  const set = sets[st.a] || null;
  if (set) st.s = cbClamp(st.s, 0, set.supports.length - 1);
  let base = null, mode = st.mode;
  if (st.edit){ base = st.edit.base; mode = st.edit.mode; }
  else if (set){ base = cbTheme(set, st.s); mode = set.mode; }
  return { S, list, left, own, items, pick, sets, set, base, mode, th:base ? cbApply(base, mode, st.tw) : null };
}
/* one slider of the tweaks: its passing range, or off when there is no room */
function cbSlider(v, key, field, label, ends){
  const r = cbRange(v.base, v.mode, v.st.tw, key, field), id = 'cb-' + key + field + '-' + v.uid;
  const off = !r || r.hi - r.lo < r.step * 1.5;
  const val = r ? r.v : 0, lo = r ? r.lo : 0, hi = r ? r.hi : 1, step = r ? r.step : 0.01;
  return `<div class="cb-slide${off ? ' off' : ''}"><label for="${id}">${label}</label>
    <input type="range" id="${id}" class="cb-range" data-k="${key}" data-f="${field}" data-cbf="r-${key}${field}" min="${lo}" max="${hi}" step="${step}" value="${val}"${off ? ' disabled' : ''}
      title="${off ? 'No room here: any change would make the words hard to read' : ''}">
    <span class="cb-ends" aria-hidden="true"><span>${ends[0]}</span><span>${ends[1]}</span></span></div>`;
}
function cbPicker(key, hex, label){
  return `<span class="cb-exact"><label class="cb-pick" title="Pick the ${label}"><input type="color" value="${hex}" data-x="${key}" data-cbf="x-${key}" aria-label="Pick the ${label}"><i data-sw="${key}" style="background:${hex}"></i></label>
    <input class="cb-hex" type="text" value="${hex}" data-h="${key}" data-cbf="h-${key}" maxlength="7" spellcheck="false" autocomplete="off" aria-label="${label} colour code"></span>`;
}
let _cbUid = 0;
function cbRender(root){
  const st = root.__cb, opts = st.opts || {};
  const focus = document.activeElement && root.contains(document.activeElement) ? document.activeElement.dataset.cbf : null;
  const v = cbView(st); v.st = st; v.uid = root.__cbUid || (root.__cbUid = ++_cbUid);
  const { S, left, own, items, pick, sets, set, th, base, mode } = v;
  const saved = cbSaved(), nm = S.name.toLowerCase(), other = st.mode === 'light' ? 'dark' : 'light';
  const isSaved = th && !st.edit && saved.find(t => cbSameColours(t, th));
  const wrongEnd = (st.mode === 'light' && S.neutral === 'dark') || (st.mode === 'dark' && S.neutral === 'light');
  /* a picked colour drawn darker or lighter in its job says so (rule 16) */
  let pickNote = '';
  if (S.custom && set && !st.edit){
    const job = set.g.hex === S.hex ? ['background', set.c1] : set.a.hex === S.hex ? ['bright colour', set.accent]
      : set.pair && set.pair.hex === S.hex ? ['small print', (set.supports.find(x => x.from === 'b') || {}).hex] : null;
    const moved = job && job[1] && cbMoved(S.hex, job[1]);
    if (moved) pickNote = `Your colour is used a little ${moved} as the ${job[0]}, so the words read.`;
  }
  const away = left.filter(l => l.other), notHere = left.filter(l => !l.other);
  const tuned = Object.keys(st.tw).some(k => k !== 'name');
  const checks = th ? cbCheck(th) : null, good = th && cbTweakOk(th);
  root.innerHTML = `<div class="cb${opts.modal ? ' in-modal' : ''}">
    <div class="cb-main">
      <div class="cb-look" role="radiogroup" aria-label="Look">
        ${['dark', 'light'].map(m => `<button type="button" class="cb-look-btn${st.mode === m ? ' on' : ''}" role="radio" aria-checked="${st.mode === m}" tabindex="${st.mode === m ? 0 : -1}" data-mode="${m}" data-cbf="m-${m}">
          <i class="cb-look-sw ${m}" aria-hidden="true"></i><b>${cbModeName(m)}</b><small>${m === 'light' ? 'Light background, deep words' : 'Deep background, bright words'}</small></button>`).join('')}
      </div>
      <section class="cb-step">
        <h3 class="cb-label"><span class="cb-num">1</span>Start with a colour</h3>
        <div class="cb-starts" role="radiogroup" aria-label="Colour to start with">
          ${CB_COLOURS.map(c => { const on = !S.custom && S.key === c.key, off = (st.mode === 'light' && c.neutral === 'dark') || (st.mode === 'dark' && c.neutral === 'light');
            return `<button type="button" class="cb-start${on ? ' on' : ''}${off ? ' off' : ''}" role="radio" aria-checked="${on}" tabindex="${on || (S.custom && c.key === CB_COLOURS[0].key) ? 0 : -1}" data-k="${c.key}" data-cbf="s-${c.key}"${off ? ` title="${c.name} is a ${c.neutral} background: it is on ${cbModeName(c.neutral === 'dark' ? 'dark' : 'light')}"` : ''}><i style="background:${c.hex}"></i><span>${c.name}</span></button>`; }).join('')}
          <label class="cb-start cb-any${S.custom ? ' on' : ''}" data-cbf="s-any"><input type="color" value="${S.custom ? S.hex : '#2b56f5'}" aria-label="Any colour to start with" data-cbf="s-any-in"><i style="${S.custom ? 'background:' + S.hex : ''}"></i><span>Any colour</span></label>
        </div>
        ${S.custom ? `<p class="cb-hint">Your colour is nearest to ${nm}, so these are the colours that go with ${nm}.</p>` : ''}
      </section>
      <section class="cb-step">
        <h3 class="cb-label"><span class="cb-num">2</span>Pick a second colour</h3>
        ${wrongEnd ? `<p class="cb-hint cb-wrong">${S.name} is a ${st.mode === 'light' ? 'dark' : 'light'} background, so it is on ${cbModeName(other)}. <button type="button" class="cb-switch" data-go="${other}" data-cbf="go-${other}">Show ${cbModeName(other)}</button></p>`
          : `<p class="cb-hint">What goes with ${nm} on ${cbModeName(st.mode).toLowerCase()}: our ready-made sets first, then other classic pairs. Each one is checked before you see it. The words read on it, for colour-blind people too.</p>`}
        <div class="cb-pairs" role="radiogroup" aria-label="Second colour">
          ${items.map((x, i) => { const t = cbTheme(x.sets[0], 0), on = !st.edit && i === st.p;
            return `<button type="button" class="cb-pair${on ? ' on' : ''}" role="radio" aria-checked="${on}" tabindex="${on || (st.edit && i === 0) ? 0 : -1}" data-i="${i}" data-cbf="p-${x.own ? 'own' : x.P.key}">
              ${cbAdHtml(t)}
              <span class="cb-pair-name">${escHtml(x.P.name)}</span>
              <span class="cb-pair-meta">${x.own ? 'Your pick' : x.ready ? (x.n ? 'Ready-made · ' + x.n + ' designs' : 'Ready-made set') : 'Classic pair'}</span>
            </button>`; }).join('')}
          ${wrongEnd ? '' : `<label class="cb-pair cb-own" data-cbf="p-pick"><input type="color" value="${st.pHex || '#ff4a2e'}" aria-label="Your own second colour" data-cbf="p-pick-in">
            <span class="cb-own-sw" aria-hidden="true"><i style="${st.pHex ? 'background:' + st.pHex : ''}"></i></span>
            <span class="cb-pair-name">Your own</span><span class="cb-pair-meta">Pick your brand's second colour</span></label>`}
        </div>
        ${own && own.why ? `<p class="cb-note">Your colour ${escHtml(own.P.hex)}: ${escHtml(own.why.charAt(0).toLowerCase() + own.why.slice(1))}.</p>` : ''}
        ${notHere.length ? `<p class="cb-left"><b>Not shown:</b> ${notHere.map(l => escHtml(l.P.name) + ', because ' + escHtml(l.why.charAt(0).toLowerCase() + l.why.slice(1))).join('. ')}.</p>` : ''}
        ${away.length && !wrongEnd ? `<p class="cb-left"><b>On ${cbModeName(other)}:</b> ${away.map(l => escHtml(l.P.name)).join(', ')}. <button type="button" class="cb-switch" data-go="${other}" data-cbf="go2-${other}">Show ${cbModeName(other)}</button></p>` : ''}
      </section>
    </div>
    <aside class="cb-side">
      <h3 class="cb-label"><span class="cb-num">3</span>${st.edit ? 'Editing your colours' : 'Your colours'}</h3>
      ${th ? `
      ${cbAdHtml(th, true)}
      <label class="cb-namefield"><span class="cb-sublabel">Name</span><input type="text" class="cb-nameinput" data-cbf="name" maxlength="40" value="${escHtml(st.tw.name != null ? st.tw.name : st.edit ? base.name : '')}" placeholder="${escHtml(base.name)}"></label>
      ${!st.edit && sets.length > 1 ? `<div class="cb-opt"><div class="cb-sublabel">Background</div><div class="cb-chips">
        ${sets.map((x, i) => `<button type="button" class="chip${i === st.a ? ' on' : ''}" aria-pressed="${i === st.a}" data-a="${i}" data-cbf="a-${i}"><i style="background:${x.c1}"></i>${escHtml(cbSetLabel(x))}</button>`).join('')}
      </div></div>` : ''}
      <details class="cb-tune" open>
        <summary>Make it yours</summary>
        <p class="cb-hint">Move a colour lighter, darker or stronger, or type your own colour code. Each slider stops where the words would get hard to read.</p>
        <div class="cb-role"><div class="cb-role-head"><b>Background</b>${cbPicker('bg', th.bg.c1, 'background')}</div>
          ${cbSlider(v, 'bg', 'L', 'Shade', ['darker', 'lighter'])}
          <div class="cb-chips cb-grad" role="group" aria-label="Background style">
            ${[['flat', 'Flat'], ['soft', 'Soft fade'], ['deep', 'Deep fade']].map(([g, n]) => { const cur = (st.tw.grad || 'soft') === g;
              const can = cur || cbTweakOk(cbApply(base, mode, Object.assign({}, st.tw, { grad:g, bg:st.tw.bg || cbLch(th.bg.c1) })));
              return `<button type="button" class="chip${cur ? ' on' : ''}" aria-pressed="${cur}" data-grad="${g}" data-cbf="g-${g}"${can ? '' : ' disabled title="The words would get hard to read"'}><i style="background:linear-gradient(135deg, ${th.bg.c1}, ${cbStop2(th.bg.c1, base, g)})"></i>${n}</button>`; }).join('')}
          </div></div>
        <div class="cb-role"><div class="cb-role-head"><b>Bright colour</b><small>big words, the number's box</small>${cbPicker('acc', th.accent, 'bright colour')}</div>
          ${cbSlider(v, 'acc', 'L', 'Shade', ['darker', 'lighter'])}
          ${cbSlider(v, 'acc', 'C', 'Strength', ['softer', 'stronger'])}</div>
        <div class="cb-role"><div class="cb-role-head"><b>Small print</b>${cbPicker('sup', th.support, 'small print')}</div>
          ${!st.edit && set && set.supports.length > 1 ? `<div class="cb-chips">${set.supports.map((x, i) => `<button type="button" class="chip${i === st.s ? ' on' : ''}" aria-pressed="${i === st.s}" data-s="${i}" data-cbf="u-${i}"><i style="background:${x.hex}"></i>${escHtml(cbShadeName(x.hex))}</button>`).join('')}</div>` : ''}
          ${cbSlider(v, 'sup', 'L', 'Shade', ['darker', 'lighter'])}</div>
        <div class="cb-role cb-role-text"><div class="cb-role-head"><b>Text</b><small>follows the background</small><span class="cb-exact"><i class="cb-text-sw" data-sw="ink" style="background:${th.ink}"></i></span></div></div>
        ${tuned ? `<button type="button" class="cb-link" data-act="reset" data-cbf="reset">Undo my changes</button>` : ''}
      </details>
      <ul class="cb-checks" aria-label="Checks">
        <li class="${checks.rows.text >= 4.5 ? 'ok' : 'no'}">Words easy to read</li>
        <li class="${checks.rows.bright >= 4.5 && checks.rows.brightVsText >= 1.7 ? 'ok' : 'no'}">Big words stand out</li>
        <li class="${checks.rows.brightCvd >= 3 && checks.rows.text >= 4.5 ? 'ok' : 'no'}">Clear for colour-blind readers</li>
        <li class="${checks.rows.small >= 4.5 ? 'ok' : 'no'}">Small print reads</li>
      </ul>
      ${pickNote ? `<p class="cb-note">${escHtml(pickNote)}</p>` : ''}
      ${st.note ? `<p class="cb-note" role="status">${escHtml(st.note)}${st.noteOther ? ` <button type="button" class="cb-switch" data-go="${st.noteOther}" data-cbf="go3">Switch to ${cbModeName(st.noteOther)}</button>` : ''}</p>` : ''}
      <div class="cb-actions">
        <button type="button" class="btn btn-primary" data-act="use" data-cbf="use"${good ? '' : ' disabled'}>${escHtml(opts.useLabel || 'Use on a design')} &rarr;</button>
        ${st.edit ? `<button type="button" class="btn btn-outline" data-act="update" data-cbf="update"${good ? '' : ' disabled'}>Save changes</button>`
          : `<button type="button" class="btn btn-outline" data-act="save" data-cbf="save"${isSaved || !good ? ' disabled' : ''}${isSaved ? ' aria-pressed="true"' : ''}>${isSaved ? 'Saved' : 'Save'}</button>`}
      </div>
      ${st.edit ? `<div class="cb-editbar"><button type="button" class="cb-link" data-act="asnew" data-cbf="asnew">Save as a new set</button><button type="button" class="cb-link" data-act="done" data-cbf="done">Stop editing</button></div>` : ''}
      ${!st.edit && pick && pick.ready && pick.n && !opts.modal && !tuned ? `<button type="button" class="cb-link" data-act="ready" data-cbf="ready">See the ${pick.n} ready-made ${escHtml(pick.ready)} designs</button>` : ''}
      ` : `<p class="cb-hint">${wrongEnd ? 'Pick a colour above, or switch the look.' : 'Nothing goes with this colour on this look yet. Try another, or switch the look.'}</p>`}
      <div class="cb-saved">
        <div class="cb-sublabel">Saved colours${saved.length ? ' <span class="n">' + saved.length + '</span>' : ''}</div>
        ${saved.length ? `<ul>${saved.map((t, i) => `<li class="${st.edit && st.edit.name === t.name ? 'on' : ''}"><button type="button" class="cb-saved-use" data-u="${i}" data-cbf="v-${i}" title="Use ${escHtml(t.name)}"><span class="cb-saved-sw">${cbChipHtml(t)}</span>${escHtml(t.name.replace(/^Your /, ''))}</button><button type="button" class="cb-saved-edit" data-e="${i}" data-cbf="e-${i}" aria-label="Edit ${escHtml(t.name)}" title="Edit">&#9998;</button><button type="button" class="cb-saved-del" data-d="${i}" data-cbf="d-${i}" aria-label="Delete ${escHtml(t.name)}" title="Delete">&times;</button></li>`).join('')}</ul>`
          : `<p class="cb-hint">Saved colours show up in the studio's colour row too. Using a set saves it.</p>`}
      </div>
    </aside>
  </div>`;
  cbBind(root, v, saved);
  if (focus){ const el = root.querySelector(`[data-cbf="${focus}"]`); if (el && !el.disabled) el.focus({ preventScroll:true }); }
}
/* the live picture while a slider moves; the panel is drawn again when it stops */
function cbPaint(root, th){
  const ad = root.querySelector('.cb-ad.big'); if (ad) ad.setAttribute('style', cbAdVars(th));
  [['bg', th.bg.c1], ['acc', th.accent], ['sup', th.support], ['ink', th.ink]].forEach(([k, hex]) => {
    root.querySelectorAll(`[data-sw="${k}"]`).forEach(el => { el.style.background = hex; });
    root.querySelectorAll(`[data-h="${k}"], [data-x="${k}"]`).forEach(el => { el.value = hex; });
  });
}
function cbBind(root, v, saved){
  const st = root.__cb, opts = st.opts || {}, { base, mode, th, pick } = v;
  /* the set as it is now: the name is typed without drawing the panel again */
  const now = () => cbApply(base, mode, st.tw);
  const go = fn => e => { fn(e); cbRender(root); };
  const phone = () => window.matchMedia && matchMedia('(max-width:900px)').matches;
  const toSide = () => { if (phone()){ const side = root.querySelector('.cb-side'); if (side) side.scrollIntoView({ behavior:'smooth', block:'start' }); } };
  const setMode = m => { st.mode = m === 'light' ? 'light' : 'dark'; jset('pgfx_cb_mode', st.mode); cbFresh(st); };
  root.querySelectorAll('[data-mode]').forEach(b => b.onclick = go(() => setMode(b.dataset.mode)));
  root.querySelectorAll('[data-go]').forEach(b => b.onclick = go(() => setMode(b.dataset.go)));
  root.querySelectorAll('.cb-start[data-k]').forEach(b => b.onclick = go(() => { st.start = b.dataset.k; st.pHex = null; cbFresh(st); jset('pgfx_cb_start', st.start); }));
  const anyIn = root.querySelector('.cb-any input');
  if (anyIn){
    anyIn.oninput = () => { const i = root.querySelector('.cb-any i'); if (i) i.style.background = anyIn.value; };
    anyIn.onchange = go(() => { st.start = anyIn.value.toLowerCase(); st.pHex = null; cbFresh(st); jset('pgfx_cb_start', st.start); });
  }
  root.querySelectorAll('.cb-pair[data-i]').forEach(b => b.onclick = e => { const i = +b.dataset.i; cbFresh(st); st.p = i; cbRender(root); if (e.isTrusted) toSide(); });
  const ownIn = root.querySelector('.cb-own input');
  if (ownIn){
    ownIn.oninput = () => { const i = root.querySelector('.cb-own i'); if (i) i.style.background = ownIn.value; };
    ownIn.onchange = e => { st.pHex = ownIn.value.toLowerCase(); cbFresh(st); cbRender(root); if (e.isTrusted) toSide(); };
  }
  root.querySelectorAll('[data-a]').forEach(b => b.onclick = go(() => { st.a = +b.dataset.a; st.s = 0; st.tw = { name:st.tw.name }; st.note = ''; }));
  /* another small print: keep the other tweaks, and fit it to them */
  root.querySelectorAll('[data-s]').forEach(b => b.onclick = go(() => {
    st.s = +b.dataset.s; const tw = Object.assign({}, st.tw); delete tw.sup; st.tw = tw;
    const b2 = cbTheme(v.set, st.s);
    if (!cbTweakOk(cbApply(b2, mode, st.tw))){ const f = cbFit(b2, mode, st.tw, 'sup'); if (f) st.tw = f; }
  }));
  root.querySelectorAll('.cb-range').forEach(r => {
    r.oninput = () => { const k = r.dataset.k, f = r.dataset.f;
      st.tw = Object.assign({}, st.tw, { [k]:Object.assign(cbCur(base, mode, st.tw, k), { [f]:+r.value }) });
      st.note = ''; cbPaint(root, cbApply(base, mode, st.tw)); };
    r.onchange = () => cbRender(root);
  });
  root.querySelectorAll('[data-grad]').forEach(b => b.onclick = go(() => { st.tw = Object.assign({}, st.tw, { grad:b.dataset.grad, bg:st.tw.bg || cbLch(th.bg.c1) }); }));
  /* an exact colour: the picker as it moves only shows it; on letting go,
     or a typed code, the set is settled round it */
  const exact = (key, raw) => {
    let hex = String(raw || '').trim().toLowerCase(); if (!hex.startsWith('#')) hex = '#' + hex;
    if (/^#[0-9a-f]{3}$/.test(hex)) hex = '#' + hex.slice(1).split('').map(c => c + c).join('');
    if (!/^#[0-9a-f]{6}$/.test(hex)){ st.note = 'Type a colour code like #1a2b3c.'; st.noteOther = null; cbRender(root); return; }
    const r = cbExact(base, mode, st.tw, key, hex);
    if (r.why){ st.note = r.why; st.noteOther = r.other || null; }
    else { st.tw = r.tw; st.note = r.note || ''; st.noteOther = null; }
    cbRender(root);
  };
  root.querySelectorAll('input[type=color][data-x]').forEach(i => {
    i.oninput = () => root.querySelectorAll(`[data-sw="${i.dataset.x}"]`).forEach(el => { el.style.background = i.value; });
    i.onchange = () => exact(i.dataset.x, i.value);
  });
  root.querySelectorAll('.cb-hex').forEach(i => {
    i.onchange = () => exact(i.dataset.h, i.value);
    i.onkeydown = e => { if (e.key === 'Enter'){ e.preventDefault(); exact(i.dataset.h, i.value); } };
  });
  const name = root.querySelector('.cb-nameinput');
  if (name) name.oninput = () => { st.tw = Object.assign({}, st.tw, { name:name.value }); const ad = root.querySelector('.cb-ad.big'); if (ad) ad.setAttribute('aria-label', 'A sample ad in ' + (name.value.trim() || base.name)); };
  const act = n => root.querySelector(`[data-act="${n}"]`);
  const typed = () => !!(st.tw.name && st.tw.name.trim());
  const editSaved = t => { st.edit = { name:t.name, base:t, mode:(t.made && t.made.mode) || (cbLum(t.bg.c1) > 0.3 ? 'light' : 'dark') }; st.tw = {}; st.note = ''; st.noteOther = null; };
  if (act('reset')) act('reset').onclick = go(() => { st.tw = st.tw.name != null ? { name:st.tw.name } : {}; st.note = ''; st.noteOther = null; });
  if (act('use')) act('use').onclick = () => { const t = st.edit ? cbUpdate(st.edit.name, now()) : cbSave(now(), typed()); if (t && opts.onUse) opts.onUse(t); };
  if (act('save')) act('save').onclick = () => { const t = cbSave(now(), typed()); if (!t) return; editSaved(t); cbRender(root);
    toast('Saved: ' + t.name.replace(/^Your /, '') + '. It is in the studio’s colour row too.', 'success'); };
  if (act('update')) act('update').onclick = () => { const t = cbUpdate(st.edit.name, now()); if (!t) return; editSaved(t); cbRender(root); toast('Saved your changes to ' + t.name.replace(/^Your /, ''), 'success'); };
  if (act('asnew')) act('asnew').onclick = () => { const t = cbSave(now(), true); if (!t) return; editSaved(t); cbRender(root); toast('Saved as ' + t.name.replace(/^Your /, ''), 'success'); };
  if (act('done')) act('done').onclick = go(() => { st.edit = null; st.tw = {}; st.note = ''; });
  if (act('ready')) act('ready').onclick = () => {
    if (typeof SHOWCASE !== 'undefined' && SHOWCASE.filter && SHOWCASE.filter.fam === pick.ready){ const sec = $('lp-templates'); if (sec) sec.scrollIntoView({ behavior:'smooth', block:'start' }); return; }
    const b = [...document.querySelectorAll('#fam-grid .fam-card')].find(x => x.dataset.fam === pick.ready);
    if (b) b.click();
  };
  root.querySelectorAll('.cb-saved-use').forEach(b => b.onclick = () => { const t = saved[+b.dataset.u]; if (t && opts.onUse) opts.onUse(t); });
  root.querySelectorAll('.cb-saved-edit').forEach(b => b.onclick = e => { const t = saved[+b.dataset.e]; if (!t) return; editSaved(t); cbRender(root); if (e.isTrusted) toSide(); });
  root.querySelectorAll('.cb-saved-del').forEach(b => b.onclick = () => { const t = saved[+b.dataset.d]; if (!t) return;
    if (st.edit && st.edit.name === t.name){ st.edit = null; st.tw = {}; }
    cbDelete(t.name); toast(t.name.replace(/^Your /, '') + ' deleted'); });
  /* arrow keys move along a radio row, as a radio group should */
  root.querySelectorAll('[role=radiogroup]').forEach(g => g.addEventListener('keydown', e => {
    const items = [...g.querySelectorAll('[role=radio]')], i = items.indexOf(document.activeElement);
    if (i < 0) return;
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!d) return;
    e.preventDefault(); const n = items[(i + d + items.length) % items.length]; n.focus(); n.click();
  }));
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
