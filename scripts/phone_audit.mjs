#!/usr/bin/env node
/* PHONE VISIBILITY AUDIT — the conversion check.
 *
 * Every previous contrast audit asked "is the ink contrasty against the
 * backdrop". That is the wrong question, because a plate, a scrim, a cutout or
 * another layer can be painted ON TOP of the phone number afterwards. A
 * template can pass a contrast audit and still ship an invisible phone number.
 *
 * This asks the only question that matters, in pixels:
 *   render the template twice — once as-is, once with the phone layer removed —
 *   and diff the two images inside the phone's bounding box.
 *
 * If removing the phone number barely changes the image, the phone number is
 * not visible. No colour model, no assumption, no blend maths to get wrong.
 *
 * Reports, per template: ink coverage (% of bbox pixels the glyphs actually
 * changed) and the mean perceptual contrast between glyph pixels and the
 * background they land on.
 *
 * usage: node scripts/phone_audit.mjs [--json out.json] [--sheet]
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE   = process.env.GFX_BASE || 'http://localhost:8899/';
const OUT    = new URL('../.render/', import.meta.url).pathname;
const argv   = process.argv.slice(2);
const arg    = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };

mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--force-color-profile=srgb'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900 });
await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
// Wait for the measured contrast table (assets/contrast-fix.json) to load and
// apply. It is fetched asynchronously, so a harness that starts measuring too
// early records the PRE-repair colours and reports failures that are already
// fixed on screen.
await page.waitForFunction(() => typeof CONTRAST_FIX !== 'undefined' && CONTRAST_FIX !== null, { timeout: 20000 }).catch(()=>{});
await new Promise(r => setTimeout(r, 6000));

const results = await page.evaluate(async () => {
  const W = TPL_W, H = TPL_H;

  // render one template to an ImageData at full template resolution,
  // optionally skipping layers by predicate
  function paint(tpl, skip){
    const sc = new fabric.StaticCanvas(null, { width:W, height:H, renderOnAddRemove:false });
    const bgi = tpl.bg.type === 'image' ? freshBgImage(tpl.bg.src, tpl.bg.blur, tpl.bg.grade) : null;
    if (bgi){
      sc.setBackgroundImage(coverImage(bgi, W, H), () => {});
      if (tpl.bg.scrim) sc.add(scrimRect(tpl.bg.scrim, W, H, tpl.bg.scrimColor, tpl.bg.scrimMode));
    } else {
      sc.add(bgRectFor(tpl.bg.type === 'image' ? (tpl.bg.fallback || {type:'solid',c:'#101014'}) : tpl.bg, W, H));
    }
    tpl.layers.forEach(l => { if (!skip || !skip(l)) sc.add(buildLayer(l, tpl.id)); });
    alignPass(sc, W, H);
    sc.renderAll();
    const el = sc.lowerCanvasEl;
    const dat = el.getContext('2d').getImageData(0, 0, W, H);
    sc.dispose();
    return dat;
  }

  /* Where does the phone layer land? Measure the real object AFTER alignPass.
     Getting this wrong is the whole ballgame: alignPass reflows the stack, so a
     box read before it can be ~75px off, and sampling that rectangle reports
     "0% coverage / invisible" for a phone number that is in fact perfectly
     legible 75px lower. The first run of this script did exactly that and
     manufactured 22 fake criticals. Hold a REFERENCE to the object and re-read
     it after the layout runs — never re-find it by a property fabric does not
     carry through. */
  function phoneBox(tpl){
    const sc = new fabric.StaticCanvas(null, { width:W, height:H, renderOnAddRemove:false });
    let ref = null;
    tpl.layers.forEach(l => {
      const o = buildLayer(l, tpl.id);
      sc.add(o);
      if (l.role === 'phone' && !ref) ref = o;
    });
    alignPass(sc, W, H);
    const box = ref ? ref.getBoundingRect(true, true) : null;
    sc.dispose();
    return box;
  }

  const lum = (r,g,b) => {
    const f = c => { c/=255; return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); };
    return 0.2126*f(r) + 0.7152*f(g) + 0.0722*f(b);
  };
  const ratio = (a,b) => { const hi=Math.max(a,b), lo=Math.min(a,b); return (hi+0.05)/(lo+0.05); };

  const out = [];
  for (const tpl of TEMPLATES){
    const hasPhone = tpl.layers.some(l => l.role === 'phone');
    if (!hasPhone){ out.push({ id: tpl.id, cat: tpl.cat, style: tpl.style, error: 'NO PHONE LAYER' }); continue; }
    let rec;
    try {
      const withP = paint(tpl, null);
      const noP   = paint(tpl, l => l.role === 'phone');
      const box   = phoneBox(tpl);
      const x0 = box ? Math.max(0, Math.floor(box.left)) : 0;
      const y0 = box ? Math.max(0, Math.floor(box.top)) : 0;
      const x1 = box ? Math.min(W, Math.ceil(box.left + box.width))  : W;
      const y1 = box ? Math.min(H, Math.ceil(box.top  + box.height)) : H;

      let changed = 0, total = 0, sum = 0, worst = 99;
      for (let y = y0; y < y1; y++){
        for (let x = x0; x < x1; x++){
          const i = (y*W + x)*4;
          total++;
          const dr = Math.abs(withP.data[i]-noP.data[i]);
          const dg = Math.abs(withP.data[i+1]-noP.data[i+1]);
          const db = Math.abs(withP.data[i+2]-noP.data[i+2]);
          if (dr+dg+db < 24) continue;      // this pixel is not glyph
          changed++;
          const lInk = lum(withP.data[i], withP.data[i+1], withP.data[i+2]);
          const lBg  = lum(noP.data[i],   noP.data[i+1],   noP.data[i+2]);
          const cr = ratio(lInk, lBg);
          sum += cr; if (cr < worst) worst = cr;
        }
      }
      const coverage = total ? changed/total : 0;
      rec = { id: tpl.id, cat: tpl.cat, style: tpl.style,
              box: box ? {l:Math.round(box.left),t:Math.round(box.top),w:Math.round(box.width),h:Math.round(box.height)} : null,
              coverage: +(coverage*100).toFixed(2),
              meanContrast: changed ? +(sum/changed).toFixed(2) : 0,
              offCanvas: box ? (box.left < 0 || box.top < 0 || box.left+box.width > W || box.top+box.height > H) : false };
    } catch (e){ rec = { id: tpl.id, cat: tpl.cat, style: tpl.style, error: String(e.message||e) }; }
    out.push(rec);
  }
  return out;
});

await browser.close();

const ok = results.filter(r => !r.error);
const errs = results.filter(r => r.error);

// A phone number is legible when the glyphs actually mark the canvas AND the
// marks stand apart from what they land on. Thresholds derived below.
const INVISIBLE = r => r.coverage < 4;                       // glyphs barely marked the frame
const LOWCON    = r => !INVISIBLE(r) && r.meanContrast < 3.0; // marked, but washed into the plate

const bad  = ok.filter(INVISIBLE);
const weak = ok.filter(LOWCON);
const off  = ok.filter(r => r.offCanvas);

console.log(`templates audited: ${ok.length}   errors: ${errs.length}`);
console.log(`INVISIBLE phone (coverage <4%):        ${bad.length}`);
console.log(`LOW CONTRAST phone (mean ratio <3.0):  ${weak.length}`);
console.log(`phone box off-canvas:                  ${off.length}`);
console.log(`\ncoverage percentiles: ` + [5,25,50,75,95].map(p => {
  const s = ok.map(r=>r.coverage).sort((a,b)=>a-b);
  return `p${p}=${s[Math.floor(s.length*p/100)]}`;
}).join('  '));

const show = (title, list) => {
  if (!list.length) return;
  console.log(`\n--- ${title} (${list.length}) ---`);
  list.sort((a,b)=>a.coverage-b.coverage).slice(0,40)
      .forEach(r => console.log(`  ${String(r.coverage).padStart(6)}%  cr=${String(r.meanContrast).padStart(5)}  ${r.style||'?'}  ${r.id}`));
};
show('INVISIBLE', bad);
show('LOW CONTRAST', weak);
if (errs.length){ console.log('\n--- ERRORS ---'); errs.slice(0,20).forEach(r=>console.log('  '+r.id+': '+r.error)); }

const jf = arg('--json', OUT + 'phone-audit.json');
writeFileSync(jf, JSON.stringify(results, null, 2));
console.log('\nwrote ' + jf);

process.exit(bad.length || weak.length ? 1 : 0);
