#!/usr/bin/env node
/* ┌──────────────────────────────────────────────────────────────────────────┐
 * │ SUPERSEDED 2026-08-31 by scripts/theme_law.mjs + scripts/theme_render.mjs │
 * │                                                                          │
 * │ Kept for provenance. Do NOT read its 10/10 PASS as an audit result:      │
 * │  · Both arrays below are HARD-CODED snapshots. "CURRENT SET" has not     │
 * │    shipped for some time, and "PROPOSED SET" already shipped verbatim as │
 * │    COLOR_THEMES (app.js:4352) — so this grades a copy, not the engine.   │
 * │  · score() uses `const ground = t.bg.c2` and calls it "the worst case    │
 * │    for ink". For WHITE ink the darker stop is the BEST case. Every theme │
 * │    was graded against the end of its own gradient that cannot fail.      │
 * │  · It never looks at PAL (app.js:608) at all — the 12 palettes that      │
 * │    actually paint the 153 designer and 40 street templates.              │
 * │  · Its grounds are the FALLBACK gradient. Every shipped template is      │
 * │    bg.type:'image', so those colours are not what the customer sees.     │
 * │                                                                          │
 * │ theme_law.mjs reads both sets out of app.js and scores the worst stop;   │
 * │ theme_render.mjs measures the actual pixels. Use those.                  │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * SCORE A COLOUR THEME SET — before it ships, not after.
 *
 * The shipped set was built on "complementary hues pull clicks" and never
 * checked. Three of ten fail on contrast once colour-vision deficiency is
 * simulated (cvd_audit.py), and several read as decorative rather than as a
 * cash-buyback ad — the owner's "funky duotone" note.
 *
 * Every theme is scored on four things that can be computed:
 *   INK    white body text on the darker end of the background gradient
 *   ACC    the accent colour on that same ground (this is the money word)
 *   CVD    the worst of protan / deutan / tritan simulations of ACC
 *   WARM   whether the accent sits in the warm/street half of the wheel,
 *          which is the locked house direction (HANDOFF section 6)
 *
 * Pass = ink >= 4.5, accent >= 4.5 (it carries the headline), CVD >= 3.0.
 *
 * usage: node scripts/score_themes.mjs
 */

// --- sRGB -> linear -> relative luminance
const lin = c => { c/=255; return c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4); };
const rgb = hex => { const h=String(hex).replace('#',''); const n=parseInt(h,16);
  return [(n>>16)&255,(n>>8)&255,n&255]; };
const lum = hex => { const [r,g,b]=rgb(hex); return 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b); };
const cr = (a,b) => { const A=lum(a),B=lum(b); const hi=Math.max(A,B),lo=Math.min(A,B);
  return +((hi+0.05)/(lo+0.05)).toFixed(2); };

// --- Brettel/Viénot-style CVD simulation on linear RGB
function simulate(hex, kind){
  let [r,g,b] = rgb(hex).map(lin);
  // LMS
  let L = 0.31399022*r + 0.63951294*g + 0.04649755*b;
  let M = 0.15537241*r + 0.75789446*g + 0.08670142*b;
  let S = 0.01775239*r + 0.10944209*g + 0.87256922*b;
  if (kind === 'protan')  L = 1.05118294*M - 0.05116099*S;
  if (kind === 'deutan')  M = 0.9513092*L + 0.04866992*S;
  if (kind === 'tritan')  S = -0.86744736*L + 1.86727089*M;
  let R =  5.47221206*L - 4.6419601*M + 0.16963708*S;
  let G = -1.1252419*L + 2.29317094*M - 0.1678952*S;
  let B =  0.02980165*L - 0.19318073*M + 1.16364789*S;
  const un = c => { c = Math.max(0, Math.min(1, c));
    return Math.round(255 * (c<=0.0031308 ? c*12.92 : 1.055*Math.pow(c,1/2.4)-0.055)); };
  const [rr,gg,bb] = [un(R),un(G),un(B)];
  return '#' + [rr,gg,bb].map(v=>v.toString(16).padStart(2,'0')).join('');
}
const hueOf = hex => {
  const [r,g,b] = rgb(hex).map(v=>v/255);
  const mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn;
  if (!d) return 0;
  let h;
  if (mx===r) h=((g-b)/d)%6; else if (mx===g) h=(b-r)/d+2; else h=(r-g)/d+4;
  h*=60; if (h<0) h+=360; return Math.round(h);
};
const isWarm = hex => { const h = hueOf(hex); return h <= 65 || h >= 330; };

function score(t){
  const ground = t.bg.c2;                 // the darker stop: the worst case for ink
  const ink = cr(t.ink, ground);
  const acc = cr(t.accent, ground);
  const cvd = Math.min(...['protan','deutan','tritan'].map(k => cr(simulate(t.accent,k), simulate(ground,k))));
  const pass = ink >= 4.5 && acc >= 4.5 && cvd >= 3.0;
  return { name:t.name, ink, acc, cvd, hue:hueOf(t.accent), warm:isWarm(t.accent), pass };
}

// ── the set as shipped ──────────────────────────────────────────────────────
const CURRENT = [
  { name:'Navy × Orange',    bg:{c1:'#132a63', c2:'#0a1533'}, accent:'#ff7a1a', ink:'#ffffff' },
  { name:'Teal × Coral',     bg:{c1:'#0c5f5b', c2:'#043a37'}, accent:'#ff6f61', ink:'#ffffff' },
  { name:'Purple × Gold',    bg:{c1:'#4b1d95', c2:'#22093f'}, accent:'#ffd200', ink:'#ffffff' },
  { name:'Forest × Amber',   bg:{c1:'#14532d', c2:'#052012'}, accent:'#fbbf24', ink:'#ffffff' },
  { name:'Crimson × Mint',   bg:{c1:'#9f1239', c2:'#3b0716'}, accent:'#6ee7b7', ink:'#ffffff' },
  { name:'Black × Electric', bg:{c1:'#101018', c2:'#000000'}, accent:'#38bdf8', ink:'#ffffff' },
  { name:'Charcoal × Lime',  bg:{c1:'#26262e', c2:'#101015'}, accent:'#a3e635', ink:'#ffffff' },
  { name:'Royal × Tangerine',bg:{c1:'#1e3a8a', c2:'#0b1540'}, accent:'#fb923c', ink:'#ffffff' },
  { name:'Espresso × Cream', bg:{c1:'#3f2d20', c2:'#1a110a'}, accent:'#f5e6c8', ink:'#ffffff' },
  { name:'Midnight × Pink',  bg:{c1:'#1e1b4b', c2:'#0a0920'}, accent:'#f472b6', ink:'#ffffff' },
];

// ── proposed replacement: warm/street, high contrast, cash-money vocabulary ──
const PROPOSED = [
  { name:'Cash Green',    bg:{c1:'#123123', c2:'#050f0a'}, accent:'#4ade80', ink:'#ffffff' },
  { name:'Street Orange', bg:{c1:'#1c1108', c2:'#0a0603'}, accent:'#ff8c33', ink:'#ffffff' },
  { name:'Gold Standard', bg:{c1:'#241a08', c2:'#0d0903'}, accent:'#fbbf24', ink:'#ffffff' },
  { name:'Money Amber',   bg:{c1:'#1a1206', c2:'#080502'}, accent:'#ffc247', ink:'#ffffff' },
  { name:'Deep Red',      bg:{c1:'#2a0a0e', c2:'#0d0305'}, accent:'#ff6b57', ink:'#ffffff' },
  { name:'Night Blue',    bg:{c1:'#0f1b3d', c2:'#050916'}, accent:'#ffa62b', ink:'#ffffff' },
  { name:'Charcoal Lime', bg:{c1:'#1a1a1f', c2:'#0a0a0d'}, accent:'#b6f24a', ink:'#ffffff' },
  { name:'Clean Slate',   bg:{c1:'#141a20', c2:'#06090c'}, accent:'#e8ecef', ink:'#ffffff' },
  { name:'Warm Cream',    bg:{c1:'#2b2015', c2:'#0f0b07'}, accent:'#f7e3bd', ink:'#ffffff' },
  { name:'Electric Cyan', bg:{c1:'#07222b', c2:'#030d11'}, accent:'#5fd8f0', ink:'#ffffff' },
];

const table = (title, set) => {
  console.log(`\n${title}`);
  console.log('  theme               ink    acc    cvd   hue  warm  verdict');
  set.map(score).forEach(s => {
    console.log(`  ${s.name.padEnd(18)} ${String(s.ink).padStart(5)}  ${String(s.acc).padStart(5)}  ${String(s.cvd).padStart(5)}  ${String(s.hue).padStart(3)}  ${s.warm?'yes ':'no  '}  ${s.pass?'PASS':'FAIL'}`);
  });
  const p = set.map(score).filter(s=>s.pass).length;
  console.log(`  --> ${p}/${set.length} pass`);
  return p;
};

table('CURRENT SET (as shipped)', CURRENT);
table('PROPOSED SET', PROPOSED);
console.log('\npass = white ink >=4.5:1 AND accent >=4.5:1 on the dark stop AND accent >=3.0:1 under the worst CVD simulation');
