#!/usr/bin/env node
/* WHY IS THE LIBRARY DARK?
   design_metrics.py says the rendered library sits at median luminance 0.068
   against 0.21..0.49 for the owner's GOOD references — darker than even their
   BAD folder, and 183 of 243 templates fall below the good band. Darkness is
   the single largest measured gap, ahead of edge density.

   Something in the chain is doing the darkening. This isolates the candidates
   by re-rendering each template with one variable neutralised at a time and
   measuring the luminance change, so the lever is identified by evidence
   rather than by reading the passes and guessing.

   Candidates: the scrim (opacity over the photo), the duotone/wash GRADE
   (shadow/highlight remap), and the backdrop photo itself. */
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
await new Promise(r => setTimeout(r, 6000));

const rows = await page.evaluate(async () => {
  const W = TPL_W, H = TPL_H;
  const lum = d => {
    let s = 0; const n = d.data.length / 4;
    for (let i = 0; i < d.data.length; i += 4)
      s += (0.2126*d.data[i] + 0.7152*d.data[i+1] + 0.0722*d.data[i+2]) / 255;
    return s / n;
  };
  // render ONLY the backdrop under a set of overrides — type is not the subject
  function ground(tpl, mut){
    const bg = Object.assign({}, tpl.bg);
    if (mut) mut(bg);
    const sc = new fabric.StaticCanvas(null, { width:W, height:H, renderOnAddRemove:false });
    const bgi = bg.type === 'image' ? freshBgImage(bg.src, bg.blur, bg.grade) : null;
    if (bgi){
      sc.setBackgroundImage(coverImage(bgi, W, H), () => {});
      if (bg.scrim) sc.add(scrimRect(bg.scrim, W, H, bg.scrimColor, bg.scrimMode));
    } else {
      sc.add(bgRectFor(bg.type === 'image' ? (bg.fallback||{type:'solid',c:'#101014'}) : bg, W, H));
    }
    sc.renderAll();
    const d = sc.lowerCanvasEl.getContext('2d').getImageData(0,0,W,H);
    sc.dispose();
    return lum(d);
  }

  const out = [];
  for (const t of TEMPLATES){
    if (!t.bg || t.bg.type !== 'image') continue;
    try {
      const asIs    = ground(t, null);
      const noScrim = ground(t, b => { b.scrim = 0; });
      const noGrade = ground(t, b => { b.grade = null; });
      const raw     = ground(t, b => { b.scrim = 0; b.grade = null; });
      out.push({ id:t.id, style:t.style, cat:t.cat,
                 scrim: t.bg.scrim || 0,
                 asIs:+asIs.toFixed(4), noScrim:+noScrim.toFixed(4),
                 noGrade:+noGrade.toFixed(4), raw:+raw.toFixed(4) });
    } catch(e){ /* skip */ }
  }
  return out;
});
await browser.close();

const med = (a) => { const s=[...a].sort((x,y)=>x-y); return s[Math.floor(s.length/2)]; };
const M = k => med(rows.map(r => r[k]));

console.log(`image-backed templates measured: ${rows.length}\n`);
console.log('MEDIAN BACKDROP LUMINANCE, one variable removed at a time:');
console.log(`  as shipped                 ${M('asIs').toFixed(3)}`);
console.log(`  scrim removed              ${M('noScrim').toFixed(3)}   (+${(M('noScrim')-M('asIs')).toFixed(3)})`);
console.log(`  grade removed              ${M('noGrade').toFixed(3)}   (+${(M('noGrade')-M('asIs')).toFixed(3)})`);
console.log(`  raw photo (both removed)   ${M('raw').toFixed(3)}   (+${(M('raw')-M('asIs')).toFixed(3)})`);
console.log(`\n  owner's GOOD reference band: 0.21 .. 0.49  (median 0.31)`);

const byStyle = {};
rows.forEach(r => { (byStyle[r.style] ||= []).push(r); });
console.log('\nBY STYLE (as shipped -> raw photo):');
Object.entries(byStyle).forEach(([s, v]) => {
  console.log(`  ${s.padEnd(9)} n=${String(v.length).padStart(3)}  ${med(v.map(x=>x.asIs)).toFixed(3)} -> ${med(v.map(x=>x.raw)).toFixed(3)}   median scrim ${med(v.map(x=>x.scrim)).toFixed(2)}`);
});

const dark = rows.filter(r => r.asIs < 0.21);
console.log(`\ntemplates below the good band (<0.21): ${dark.length} / ${rows.length}`);
writeFileSync(OUT+'darkness.json', JSON.stringify(rows, null, 1));
console.log('wrote ' + OUT + 'darkness.json');
