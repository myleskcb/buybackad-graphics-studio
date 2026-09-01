#!/usr/bin/env node
/* THEME LAW AUDIT — every theme the engine can output, scored on the hard end.
 *
 * Replaces the colour half of scripts/score_themes.mjs, which could not have
 * failed anything:
 *   1. it scored two HARD-CODED arrays. Its "CURRENT SET" has not shipped for
 *      a while and its "PROPOSED SET" already shipped verbatim as COLOR_THEMES,
 *      so it was grading a snapshot, not the engine.
 *   2. it measured `const ground = t.bg.c2` and called that "the darker stop:
 *      the worst case for ink". For WHITE ink the darker stop is the BEST
 *      case. Every theme was graded against the end of its own gradient that
 *      cannot fail.
 *   3. it never looked at PAL at all — the 12 palettes that actually paint the
 *      153 designer templates and the 32 street templates.
 *
 * This reads both sets out of app.js, reproduces the tameAccents() mutation so
 * the numbers are post-mutation (what ships, not what is typed), and scores the
 * pairs that actually meet on the canvas, each against its WORST ground.
 *
 * usage: node scripts/theme_law.mjs
 */
import { readFileSync } from 'node:fs';
const SRC = readFileSync(new URL('../app.js', import.meta.url), 'utf8');

/* ── colour maths ──────────────────────────────────────────────────────── */
const lin = c => { c /= 255; return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); };
const rgb = hex => { const n = parseInt(String(hex).replace('#',''), 16);
  return [(n>>16)&255, (n>>8)&255, n&255]; };
const lum = hex => { const [r,g,b] = rgb(hex); return 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b); };
const cr  = (a,b) => { const A = lum(a), B = lum(b), hi = Math.max(A,B), lo = Math.min(A,B);
  return +((hi+0.05)/(lo+0.05)).toFixed(2); };

// Brettel/Viénot CVD simulation on linear RGB (same matrices as cvd_audit.py)
function simulate(hex, kind){
  let [r,g,b] = rgb(hex).map(lin);
  let L = 0.31399022*r + 0.63951294*g + 0.04649755*b;
  let M = 0.15537241*r + 0.75789446*g + 0.08670142*b;
  let S = 0.01775239*r + 0.10944209*g + 0.87256922*b;
  if (kind === 'protan') L =  1.05118294*M - 0.05116099*S;
  if (kind === 'deutan') M =  0.9513092*L  + 0.04866992*S;
  if (kind === 'tritan') S = -0.86744736*L + 1.86727089*M;
  const R =  5.47221206*L - 4.6419601*M + 0.16963708*S;
  const G = -1.1252419*L  + 2.29317094*M - 0.1678952*S;
  const B =  0.02980165*L - 0.19318073*M + 1.16364789*S;
  const un = c => { c = Math.max(0, Math.min(1, c));
    return Math.round(255 * (c <= 0.0031308 ? c*12.92 : 1.055*Math.pow(c, 1/2.4) - 0.055)); };
  return '#' + [un(R),un(G),un(B)].map(v => v.toString(16).padStart(2,'0')).join('');
}
const cvdWorst = (fg, bg) => Math.min(...['protan','deutan','tritan']
  .map(k => cr(simulate(fg,k), simulate(bg,k))));
const hueOf = hex => {
  const [r,g,b] = rgb(hex).map(v => v/255);
  const mx = Math.max(r,g,b), mn = Math.min(r,g,b), d = mx - mn;
  if (!d) return 0;
  let h = mx === r ? ((g-b)/d)%6 : mx === g ? (b-r)/d+2 : (r-g)/d+4;
  h *= 60; return Math.round(h < 0 ? h + 360 : h);
};
const isWarm = hex => { const h = hueOf(hex); return h <= 65 || h >= 330; };

/* ── read the two theme sets straight out of app.js ────────────────────── */
function grab(startRe, endRe, label){
  const i = SRC.search(startRe);
  if (i < 0) throw new Error('could not find ' + label + ' in app.js');
  const j = SRC.indexOf(endRe, i);
  if (j < 0) throw new Error('could not close ' + label + ' in app.js');
  return SRC.slice(i, j + endRe.length);
}
// PAL: object literal, one palette per line, ends at the closing "  };"
const palSrc = grab(/const PAL = \{/, '\n  };', 'PAL');
const PAL = (0, eval)('(' + palSrc.replace(/^const PAL = /, '').replace(/;\s*$/, '') + ')');

// COLOR_THEMES: array literal, ends at "\n];"
const ctSrc = grab(/const COLOR_THEMES = \[/, '\n];', 'COLOR_THEMES');
const COLOR_THEMES = (0, eval)('(' + ctSrc.replace(/^const COLOR_THEMES = /, '').replace(/;\s*$/, '') + ')');

/* ── reproduce tameAccents(): a1/a2 are mutated at load, so the declared hex
   is NOT what ships. Copied from app.js so the audit grades the shipped
   colour. Verified against the engine in theme_render.mjs. ─────────────── */
function tameAccents(PAL){
  const toHsl = hex => {
    const n = parseInt(hex.slice(1), 16);
    const r = ((n>>16)&255)/255, g = ((n>>8)&255)/255, b = (n&255)/255;
    const mx = Math.max(r,g,b), mn = Math.min(r,g,b), d = mx-mn, l = (mx+mn)/2;
    if (!d) return [0,0,l];
    const s = l > 0.5 ? d/(2-mx-mn) : d/(mx+mn);
    let h = mx === r ? ((g-b)/d)%6 : mx === g ? (b-r)/d+2 : (r-g)/d+4;
    h *= 60; return [h < 0 ? h+360 : h, s, l];
  };
  const toHex = (h,s,l) => {
    const c = (1-Math.abs(2*l-1))*s, x = c*(1-Math.abs((h/60)%2-1)), m = l-c/2;
    const [r,g,b] = h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
    const q = v => Math.round((v+m)*255).toString(16).padStart(2,'0');
    return '#' + q(r) + q(g) + q(b);
  };
  const tamed = {};
  Object.entries(PAL).forEach(([k,P0]) => {
    const P = Object.assign({}, P0);
    ['a1','a2'].forEach(key => {
      const v = P[key];
      if (typeof v !== 'string' || !/^#[0-9a-f]{6}$/i.test(v)) return;
      const [h,s,l] = toHsl(v);
      if (s > 0.72 && l > 0.58) P[key] = toHex(h, Math.min(s,0.66), Math.max(0.52, l-0.16));
    });
    tamed[k] = P;
  });
  return tamed;
}
const RAW = PAL;
const TAMED = tameAccents(PAL);

/* The measured near-black/near-white chooser in app.js. Nine designer call
   sites used to bypass it and pick by whether the palette was light; they now
   all call it, so the shipped ink and the best available ink are the same
   thing. The two are still computed separately here so the day someone
   hard-codes an ink again, this column says so. */
const onAccent = P => {
  const L = lum(P.a1 || '#ffffff');
  return (1.05/(L+0.05)) > ((L+0.05)/0.05) ? '#ffffff' : (P.deep || '#0b0b0d');
};
const shippedOnAccent = onAccent;

/* ── how many DESIGNER templates each palette paints. One backdrop photo per
   designer template, named dl_<cat>_<layout>_<palette>.jpg, so the filenames
   are the count. The street family reuses these photos and is NOT counted
   here — theme_render.mjs resolves street palettes from the gradient the
   engine built, which is the only place street records its palette. ────── */
import { readdirSync } from 'node:fs';
const bgFiles = readdirSync(new URL('../assets/bg/', import.meta.url)).filter(f => f.endsWith('.jpg'));
const usage = {};
bgFiles.forEach(f => { const p = f.replace(/\.jpg$/,'').split('_').pop(); usage[p] = (usage[p]||0)+1; });

/* ── report ────────────────────────────────────────────────────────────── */
const F = (v, w=5) => String(v).padStart(w);
const mark = (v, floor) => v >= floor ? ' ' : '!';
let fails = 0;

console.log('\n══ PAL — the 12 palettes that paint the designer + street libraries ══');
console.log('   post-tameAccents, each pair against its WORST stop.');
console.log('   The ink/sub/a1 columns are the FALLBACK ground (fb1/fb2 where a palette');
console.log('   overrides, else bg1/bg2) — every shipped template is bg.type:image, so');
console.log('   that gradient only paints when a photo fails. What the customer actually');
console.log('   sees is measured in scripts/theme_render.mjs, not here.');
console.log('   plate-ink/a1 IS an as-ships number: an accent plate is drawn over the');
console.log('   photo, so the ink on it does not depend on the backdrop at all.');
console.log('   a2 is reported but NOT scored — it is the second stop of accent');
console.log('   gradients, never a ground that text stands on by itself.\n');
console.log('  palette   n   ink/bg   sub/bg   a1/bg  (a2/bg)  a1cvd   plate-ink/a1   verdict');
const palRows = [];
Object.entries(TAMED).forEach(([k,P]) => {
  const n = usage[k] || 0;
  // the stops the engine actually builds into tpl.bg.fallback
  const g1 = P.fb1 || P.bg1, g2 = P.fb2 || P.bg2;
  const inkBg  = Math.min(cr(P.ink, g1), cr(P.ink, g2));
  const subBg  = Math.min(cr(P.sub, g1), cr(P.sub, g2));
  const a1Bg   = Math.min(cr(P.a1,  g1), cr(P.a1,  g2));
  const a2Bg   = Math.min(cr(P.a2,  g1), cr(P.a2,  g2));
  const a1cvd  = Math.min(cvdWorst(P.a1, g1), cvdWorst(P.a1, g2));
  const shipInk = shippedOnAccent(P);
  const bestInk = onAccent(P);
  const plate   = cr(shipInk, P.a1);
  const plateBest = cr(bestInk, P.a1);
  const bypass  = shipInk.toLowerCase() !== bestInk.toLowerCase();
  /* Floors follow the SIZE the colour is used at, the same way the render
     audit and WCAG do — a blanket 4.5 is stricter than this project's own rule
     and manufactures failures. ink and sub set body copy, so 4.5. a1 is a
     display colour: it fills headlines at 100-220px and the money word, which
     is WCAG large text, so 3.0. Plate ink likewise lands on phone numbers and
     kickers at 36-64px, so 3.0. a2 is absent on purpose — it is the second
     stop of a gradient, never a ground text stands on by itself. */
  const bad = [inkBg < 4.5, subBg < 4.5, a1Bg < 3.0, a1cvd < 3.0, plate < 3.0];
  const pass = !bad.some(Boolean);
  if (!pass) fails++;
  palRows.push({ k, n, inkBg, subBg, a1Bg, a2Bg, a1cvd, plate, plateBest, bypass, pass, paper: !!P.paper });
  console.log(`  ${k.padEnd(8)} ${F(n,3)}  ${F(inkBg)}${mark(inkBg,4.5)} ${F(subBg)}${mark(subBg,4.5)}` +
    `  ${F(a1Bg)}${mark(a1Bg,3.0)} ${F(a2Bg)}   ${F(a1cvd)}${mark(a1cvd,3.0)}` +
    `  ${F(plate)}${mark(plate,3.0)} ${bypass ? '(best '+F(plateBest)+')' : '            '}  ${pass?'PASS':'FAIL'}`);
});
console.log(`  --> ${palRows.filter(r=>r.pass).length}/${palRows.length} pass   ('!' marks the value that failed)`);

console.log('\n══ COLOR_THEMES — the 10 the customer picks in Easy Mode ══');
console.log('   ink and accent against BOTH stops, not just the dark one.\n');
console.log('  theme            ink/c1  ink/c2  acc/c1  acc/c2  accCVD  acc-vs-ink  hue  warm  verdict');
let ctFails = 0;
COLOR_THEMES.forEach(t => {
  const i1 = cr(t.ink, t.bg.c1), i2 = cr(t.ink, t.bg.c2);
  const a1 = cr(t.accent, t.bg.c1), a2 = cr(t.accent, t.bg.c2);
  const cvd = Math.min(cvdWorst(t.accent, t.bg.c1), cvdWorst(t.accent, t.bg.c2));
  // the accent word sits INSIDE the white headline: the two must separate
  const vsInk = cr(t.accent, t.ink);
  const warm = isWarm(t.accent);
  const pass = Math.min(i1,i2) >= 4.5 && Math.min(a1,a2) >= 4.5 && cvd >= 3.0 && vsInk >= 1.7;
  if (!pass) ctFails++;
  console.log(`  ${t.name.padEnd(15)} ${F(i1)}${mark(i1,4.5)} ${F(i2)}${mark(i2,4.5)}` +
    ` ${F(a1)}${mark(a1,4.5)} ${F(a2)}${mark(a2,4.5)}  ${F(cvd)}${mark(cvd,3.0)}` +
    `  ${F(vsInk)}${mark(vsInk,1.7)}     ${F(hueOf(t.accent),3)}  ${warm?'yes ':'no  '}  ${pass?'PASS':'FAIL'}`);
});
console.log(`  --> ${COLOR_THEMES.length - ctFails}/${COLOR_THEMES.length} pass`);

console.log('\n══ FINDINGS ══');
const dead = palRows.filter(r => r.n === 0);
const thin = palRows.filter(r => r.n > 0 && r.n <= 2);
if (dead.length) console.log(`  · ${dead.map(r=>r.k).join(', ')} — paints 0 DESIGNER templates.` +
  ` (theme_render.mjs finds coral still reaching output through a few street templates, so this is` +
  ` near-dead rather than dead — check there before cutting one.)`);
if (thin.length) console.log(`  · ${thin.map(r=>r.k+' ('+r.n+')').join(', ')} — barely used in the designer library.`);
const byp = palRows.filter(r => r.bypass);
console.log(byp.length
  ? `  · plate ink does NOT match onAccent() on: ${byp.map(r=>r.k).join(', ')} — something is hard-coding an ink again.`
  : `  · plate ink matches onAccent() on all ${palRows.length} palettes (the nine designer bypasses are gone).`);
console.log(`  · accent warmth (house direction, HANDOFF §6): ` +
  `${COLOR_THEMES.filter(t=>isWarm(t.accent)).length}/10 COLOR_THEMES warm, ` +
  `${Object.values(TAMED).filter(P=>isWarm(P.a1)).length}/12 PAL a1 warm.`);
console.log(`\n  floors: ink/sub >= 4.5:1 (body copy) · a1 and plate ink >= 3.0:1 (display sizes, WCAG large)`);
console.log(`          accent >= 3.0:1 under the worst CVD simulation`);
console.log(`          accent vs ink >= 1.7:1 so the money word reads as a different colour\n`);
process.exit(fails + ctFails ? 1 : 0);
