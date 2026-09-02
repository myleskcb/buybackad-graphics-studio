#!/usr/bin/env node
/* UNIVERSAL LEGIBILITY AUDIT — every text layer, not just the phone number.
 *
 * The phone audit proved the method: render twice, once with the layer and once
 * without, and diff the pixels inside its box. What the glyphs actually changed
 * IS the ink; what is underneath IS the ground. No colour model, no assumption
 * about which plate is on top, no blend maths to get wrong.
 *
 * This runs that test on EVERY text layer in the library, because the same
 * class of bug that hid 82 phone numbers also hides body copy — cream jargon on
 * a cream plate, dim "sub" text on a bright band, a bullet list inside a white
 * bubble it does not contrast with.
 *
 * Thresholds are role-aware. A headline that fails is a dead ad; a decorative
 * marquee at 28px is allowed to sit back. WCAG AA large-text is 3:1, normal
 * text 4.5:1 — applied by rendered size, and coverage catches the case where
 * the glyphs never marked the canvas at all.
 */
import puppeteer from 'puppeteer-core';
import { writeFileSync, mkdirSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';
const OUT = new URL('../.render/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless:'new', args:['--no-sandbox'] });
const page = await browser.newPage();
const perr = [];
page.on('pageerror', e => perr.push(String(e)));
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

  function paint(tpl, skipObj){
    const sc = new fabric.StaticCanvas(null, { width:W, height:H, renderOnAddRemove:false });
    const bgi = tpl.bg.type === 'image' ? freshBgImage(tpl.bg.src, tpl.bg.blur, tpl.bg.grade) : null;
    if (bgi){
      sc.setBackgroundImage(coverImage(bgi, W, H), () => {});
      if (tpl.bg.scrim) sc.add(scrimRect(tpl.bg.scrim, W, H, tpl.bg.scrimColor, tpl.bg.scrimMode));
    } else {
      sc.add(bgRectFor(tpl.bg.type === 'image' ? (tpl.bg.fallback||{type:'solid',c:'#101014'}) : tpl.bg, W, H));
    }
    const refs = [];
    tpl.layers.forEach((l, i) => {
      if (skipObj === i) { refs.push(null); return; }
      const o = buildLayer(l, tpl.id); sc.add(o); refs.push(o);
    });
    alignPass(sc, W, H);
    sc.renderAll();
    const d = sc.lowerCanvasEl.getContext('2d').getImageData(0,0,W,H);
    return { data:d, refs, dispose:()=>sc.dispose() };
  }

  const lum = (r,g,b) => {
    const f=c=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);};
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b);
  };
  const ratio = (a,b)=>{const hi=Math.max(a,b),lo=Math.min(a,b);return (hi+0.05)/(lo+0.05);};

  const out = [];
  TEMPLATES.forEach(tpl => {
    let full;
    try { full = paint(tpl, -1); } catch(e){ return; }
    const boxes = tpl.layers.map((l,i) => {
      const o = full.refs[i];
      if (!o || typeof l.text !== 'string' || !String(l.text).trim()) return null;
      const b = o.getBoundingRect(true, true);
      return { i, name:l.name, role:l.role, text:String(l.text).slice(0,40),
               fs:o.fontSize||0, box:b };
    }).filter(Boolean);

    boxes.forEach(info => {
      let without;
      try { without = paint(tpl, info.i); } catch(e){ return; }
      const b = info.box;
      const x0=Math.max(0,Math.floor(b.left)), y0=Math.max(0,Math.floor(b.top));
      const x1=Math.min(W,Math.ceil(b.left+b.width)), y1=Math.min(H,Math.ceil(b.top+b.height));
      let changed=0,total=0,sum=0,worst=99;
      for (let y=y0;y<y1;y++){
        for (let x=x0;x<x1;x++){
          const i=(y*W+x)*4; total++;
          const dr=Math.abs(full.data.data[i]-without.data.data[i]);
          const dg=Math.abs(full.data.data[i+1]-without.data.data[i+1]);
          const db=Math.abs(full.data.data[i+2]-without.data.data[i+2]);
          if (dr+dg+db < 24) continue;
          changed++;
          const li=lum(full.data.data[i],full.data.data[i+1],full.data.data[i+2]);
          const lb=lum(without.data.data[i],without.data.data[i+1],without.data.data[i+2]);
          const cr=ratio(li,lb); sum+=cr; if(cr<worst) worst=cr;
        }
      }
      without.dispose();
      const cov = total ? changed/total : 0;
      out.push({ id:tpl.id, cat:tpl.cat, style:tpl.style, layer:info.name, role:info.role,
                 text:info.text, fs:Math.round(info.fs),
                 coverage:+(cov*100).toFixed(2),
                 contrast: changed ? +(sum/changed).toFixed(2) : 0 });
    });
    full.dispose();
  });
  return out;
});
await browser.close();

// WCAG: 3:1 for large text (>=24px bold / >=30px), 4.5:1 for normal.
// Decorative marks get a floor of 2.5 — they are texture, not information.
const need = r => {
  if (r.role === 'deco') return 2.5;
  return r.fs >= 30 ? 3.0 : 4.5;
};
const real = rows.filter(r => r.coverage >= 1.2);      // actually marked the canvas
const ghost = rows.filter(r => r.coverage < 1.2);      // effectively not rendered
const fail = real.filter(r => r.contrast < need(r));

const sev = r => (r.role === 'headline' || r.role === 'phone' || r.role === 'cta') ? 'CRITICAL' : 'minor';
const crit = fail.filter(r => sev(r) === 'CRITICAL');

console.log(`text layers measured: ${rows.length}`);
console.log(`  effectively invisible (coverage <1.2%): ${ghost.length}`);
console.log(`  below WCAG for their size:              ${fail.length}`);
console.log(`     of which headline/phone/cta:         ${crit.length}`);

const show = (title, list, n) => {
  if (!list.length) return;
  console.log(`\n--- ${title} (${list.length}) ---`);
  list.sort((a,b)=>a.contrast-b.contrast).slice(0,n).forEach(r =>
    console.log(`  cr=${String(r.contrast).padStart(5)} cov=${String(r.coverage).padStart(5)}% ${String(r.fs).padStart(3)}px ${(r.role||'?').padEnd(8)} ${r.id.padEnd(30)} "${r.text.replace(/\n/g,' / ').slice(0,34)}"`));
};
show('CRITICAL — headline / phone / cta below WCAG', crit, 40);
show('EFFECTIVELY INVISIBLE', ghost, 25);
show('OTHER TEXT BELOW WCAG', fail.filter(r=>sev(r)==='minor'), 30);

const byTpl = {};
[...crit, ...ghost].forEach(r => (byTpl[r.id] ||= []).push(r));
console.log(`\ntemplates with at least one critical/invisible text layer: ${Object.keys(byTpl).length} / 243`);

if (perr.length){ console.log('\nPAGE ERRORS:'); perr.slice(0,4).forEach(e=>console.log('  '+e)); }
writeFileSync(OUT+'legibility.json', JSON.stringify(rows,null,1));
console.log('\nwrote ' + OUT + 'legibility.json');
process.exit(crit.length || ghost.length ? 1 : 0);
