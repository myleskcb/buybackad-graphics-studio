#!/usr/bin/env node
/* CHEESE AUDIT — the four things the owner called out by eye, counted.
 *
 *   1. WHITE PLATES   how much of the frame is covered by near-white panels,
 *                     and how many a single template stacks. "Too much white
 *                     background bubbles."
 *   2. BLEED BOXES    rects extending past the canvas edge, which read as a
 *                     solid colour band rather than as part of the design.
 *   3. FLAT FILL      share of the frame that is flat colour (a plate or a
 *                     gradient) rather than photograph — the "cheesy" tell.
 *   4. STACK DEPTH    plates drawn on top of plates.
 *
 * Measured on the real objects after alignPass, and on real pixels for the
 * flat-fill share.
 */
import puppeteer from 'puppeteer-core';
import { writeFileSync, mkdirSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';
const OUT = new URL('../.render/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

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

const rows = await page.evaluate(() => {
  const W = TPL_W, H = TPL_H;
  const lum = hex => {
    const s = String(hex||'').replace('#','');
    if (!/^[0-9a-f]{6}$/i.test(s)) return null;
    const n = parseInt(s,16);
    const ch = [(n>>16)&255,(n>>8)&255,n&255].map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});
    return 0.2126*ch[0]+0.7152*ch[1]+0.0722*ch[2];
  };
  const out = [];
  TEMPLATES.forEach(t => {
    const sc = new fabric.StaticCanvas(null, { width:W, height:H, renderOnAddRemove:false });
    const objs = [];
    t.layers.forEach(l => { const o = buildLayer(l, t.id); sc.add(o); objs.push({l,o}); });
    alignPass(sc, W, H);

    let whiteArea = 0, whiteCount = 0, bleed = 0, plateArea = 0, plateCount = 0;
    const bleedList = [];
    objs.forEach(({l,o}) => {
      if (l.kind !== 'rect' && l.kind !== 'rrect') return;
      const b = o.getBoundingRect(true, true);
      const a = Math.max(0, Math.min(b.left+b.width, W) - Math.max(b.left,0)) *
                Math.max(0, Math.min(b.top+b.height, H) - Math.max(b.top,0));
      const p = l.props || {};
      const fill = p.fill || (p.grad && p.grad.c1);
      const L = lum(fill);
      plateArea += a; plateCount++;
      if (L !== null && L > 0.55){ whiteArea += a; whiteCount++; }
      // extends past an edge by more than a hair
      const over = b.left < -6 || b.top < -6 || b.left+b.width > W+6 || b.top+b.height > H+6;
      const big = a > W*H*0.16;
      if (over && big){ bleed++; bleedList.push({ name:l.name, fill:String(fill).slice(0,24),
        box:{l:Math.round(b.left),t:Math.round(b.top),w:Math.round(b.width),h:Math.round(b.height)} }); }
    });

    sc.renderAll();
    sc.dispose();
    out.push({ id:t.id, cat:t.cat, style:t.style,
      whitePct:+(whiteArea/(W*H)*100).toFixed(1), whiteCount,
      platePct:+(plateArea/(W*H)*100).toFixed(1), plateCount,
      bleed, bleedList });
  });
  return out;
});
await browser.close();

const med = a => { const s=[...a].sort((x,y)=>x-y); return s[Math.floor(s.length/2)]; };
console.log(`templates: ${rows.length}\n`);
console.log('WHITE / NEAR-WHITE PANEL COVERAGE');
console.log(`  median ${med(rows.map(r=>r.whitePct))}%   worst ${Math.max(...rows.map(r=>r.whitePct))}%`);
const heavy = rows.filter(r => r.whitePct > 22).sort((a,b)=>b.whitePct-a.whitePct);
console.log(`  templates over 22% white panel: ${heavy.length}`);
heavy.slice(0,18).forEach(r => console.log(`    ${String(r.whitePct).padStart(5)}%  ${r.whiteCount} panels  ${r.id}`));

const b = rows.filter(r => r.bleed);
console.log(`\nLARGE BOXES BLEEDING OFF-CANVAS: ${b.length} templates`);
b.slice(0,18).forEach(r => {
  console.log(`  ${r.id}`);
  r.bleedList.forEach(x => console.log(`      "${x.name}" fill=${x.fill} box=${JSON.stringify(x.box)}`));
});

console.log(`\nTOTAL PLATE COVERAGE (flat colour over photo)`);
console.log(`  median ${med(rows.map(r=>r.platePct))}%   worst ${Math.max(...rows.map(r=>r.platePct))}%`);
const slab = rows.filter(r => r.platePct > 55).sort((a,b)=>b.platePct-a.platePct);
console.log(`  templates where flat colour covers >55% of the frame: ${slab.length}`);
slab.slice(0,15).forEach(r => console.log(`    ${String(r.platePct).padStart(5)}%  ${r.plateCount} plates  ${r.id}`));

writeFileSync(OUT+'cheese-audit.json', JSON.stringify(rows,null,1));
console.log('\nwrote ' + OUT + 'cheese-audit.json');
