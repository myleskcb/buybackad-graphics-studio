#!/usr/bin/env node
/* TUNE THE DUOTONE/WASH GRADE AGAINST THE OWNER'S GOOD BAND.
 *
 * darkness_audit.mjs established the cause: the grade, not the scrim, is what
 * drives the library to median luminance 0.062 against a GOOD reference band of
 * 0.21..0.49. The raw photos already sit at 0.384 — the source material is
 * right and the treatment is destroying it.
 *
 * Mechanism: BlendColor multiply against a shadow colour built as
 * shade(hue, 0.18) — i.e. the hue at 18% of its perceptual lightness, which is
 * nearly black. Multiplying by near-black is a floor on the whole frame, and
 * the screen-blend lift cannot recover detail that multiply has already
 * collapsed.
 *
 * This sweeps the two shadow coefficients and the lift, renders the REAL
 * backdrops, and reports which combination lands the library median inside the
 * good band. It changes nothing — it prints a recommendation to be applied
 * deliberately.
 */
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';

const browser = await puppeteer.launch({ executablePath: CHROME, headless:'new', args:['--no-sandbox'] });
const page = await browser.newPage();
await page.goto(BASE, { waitUntil:'networkidle2', timeout:60000 });
await page.evaluate(() => document.fonts.ready);
// Wait for the measured contrast table (assets/contrast-fix.json) to load and
// apply. It is fetched asynchronously, so a harness that starts measuring too
// early records the PRE-repair colours and reports failures that are already
// fixed on screen.
await page.waitForFunction(() => typeof CONTRAST_FIX !== 'undefined' && CONTRAST_FIX !== null, { timeout: 20000 }).catch(()=>{});
await new Promise(r => setTimeout(r, 6000));

const results = await page.evaluate(async () => {
  const W = TPL_W, H = TPL_H;
  const lum = d => {
    let s = 0; const n = d.data.length/4;
    for (let i = 0; i < d.data.length; i += 4)
      s += (0.2126*d.data[i] + 0.7152*d.data[i+1] + 0.0722*d.data[i+2]) / 255;
    return s/n;
  };
  /* Edge density on the graded ground.
     The first version of this walked y and x in steps of 2 but still indexed
     the neighbour at x+1 / y+1, so it compared pixels it had already skipped
     past and reported a flat 0.0% for every setting — a metric that answers the
     same number for every input is not measuring anything. Walk every pixel and
     compare true neighbours. */
  const edges = d => {
    let c = 0, n = 0;
    const L = i => 0.2126*d.data[i] + 0.7152*d.data[i+1] + 0.0722*d.data[i+2];
    for (let y = 1; y < H-1; y++){
      for (let x = 1; x < W-1; x++){
        const i = (y*W+x)*4;
        const g0 = L(i), g1 = L(i+4), g2 = L(i + W*4);
        if (Math.abs(g0-g1) + Math.abs(g0-g2) > 32) c++;
        n++;
      }
    }
    return n ? c/n : 0;
  };

  function groundLum(tpl, grade, scrim){
    const sc = new fabric.StaticCanvas(null, { width:W, height:H, renderOnAddRemove:false });
    const bgi = freshBgImage(tpl.bg.src, tpl.bg.blur, grade);
    if (!bgi) { sc.dispose(); return null; }
    sc.setBackgroundImage(coverImage(bgi, W, H), () => {});
    if (scrim) sc.add(scrimRect(scrim, W, H, tpl.bg.scrimColor, tpl.bg.scrimMode));
    sc.renderAll();
    const d = sc.lowerCanvasEl.getContext('2d').getImageData(0,0,W,H);
    sc.dispose();
    return { l: lum(d), e: edges(d) };
  }

  // a representative sample: graded styles only, spread across categories
  const pool = TEMPLATES.filter(t => t.bg && t.bg.type === 'image' && t.bg.grade &&
                                     (t.style === 'duotone' || t.style === 'wash'));
  const step = Math.max(1, Math.floor(pool.length / 40));
  const sample = pool.filter((_, i) => i % step === 0).slice(0, 40);

  const med = a => { const s=[...a].sort((x,y)=>x-y); return s[Math.floor(s.length/2)]; };
  const out = [];

  // current behaviour, for reference
  const base = sample.map(t => groundLum(t, t.bg.grade, t.bg.scrim)).filter(Boolean);
  out.push({ name:'AS SHIPPED', shadowK:null, liftK:null,
             lum:med(base.map(r=>r.l)), edge:med(base.map(r=>r.e)) });

  // sweep: shadow lightness coefficient x lift x scrim scale.
  // The scrim has to be in the sweep: it multiplies on top of the grade, so
  // holding it fixed at the authored value put a ceiling on every candidate and
  // made the first run conclude, wrongly, that nothing could reach the band.
  for (const sk of [0.32, 0.45, 0.58, 0.70]){
    for (const lk of [0.55, 0.70]){
      for (const ss of [1.0, 0.75, 0.5]){
        const rs = sample.map(t => {
          const C = CAT_COLOUR[t.cat]; if (!C) return null;
          const base = hexToOklch(C.money) || { L: 0.5 };
          const g = {
            shadow:    setL(C.money, base.L * sk),
            highlight: t.bg.grade.highlight,
            contrast:  t.bg.grade.contrast,
            lift:      lk,
          };
          return groundLum(t, g, (t.bg.scrim || 0) * ss);
        }).filter(Boolean);
        if (!rs.length) continue;
        out.push({ name:`sh*${sk} lift${lk} scrim*${ss}`, shadowK:sk, liftK:lk, scrimK:ss,
                   lum:med(rs.map(r=>r.l)), edge:med(rs.map(r=>r.e)) });
      }
    }
  }
  return out;
});
await browser.close();

const GOOD_LO = 0.21, GOOD_HI = 0.49, GOOD_MED = 0.31;
console.log('Grade sweep on 40 real graded backdrops.');
console.log("owner's GOOD band: luminance 0.21..0.49 (median 0.31)\n");
console.log('  setting                 median lum   edge     verdict');
results.forEach(r => {
  const inBand = r.lum >= GOOD_LO && r.lum <= GOOD_HI;
  const mark = r.name === 'AS SHIPPED' ? '<-- now' : (inBand ? 'IN BAND' : '');
  console.log(`  ${r.name.padEnd(22)} ${r.lum.toFixed(3)}      ${(r.edge*100).toFixed(1)}%   ${mark}`);
});

const cands = results.filter(r => r.shadowK !== null && r.lum >= GOOD_LO && r.lum <= GOOD_HI);
if (cands.length){
  cands.sort((a,b) => Math.abs(a.lum-GOOD_MED) - Math.abs(b.lum-GOOD_MED));
  const best = cands[0];
  console.log(`\nCLOSEST TO THE GOOD MEDIAN: shadow coefficient ${best.shadowK}, lift ${best.liftK}`);
  console.log(`  lands at ${best.lum.toFixed(3)} vs good median ${GOOD_MED}`);
} else {
  console.log('\nNo swept combination lands in band — the scrim may also need easing.');
}
