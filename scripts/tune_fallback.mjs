#!/usr/bin/env node
/* TUNE EACH PALETTE'S FALLBACK GRADIENT BY MEASUREMENT.
 *
 * The fallback is the ground a template lands on when its backdrop photo does
 * not load. It has to work with the SAME inks the photo path uses, because a
 * template carries one set of ink colours, not two.
 *
 * The obvious theory — make the fallback's mean luminance equal the photo
 * ground's mean luminance — is wrong, and measurably so: it took the fallback
 * from 66 failing layers to 104. A photograph is bright in places and dark in
 * others, and the inks are a compromise across that spread. A smooth gradient
 * at the same MEAN has no dark regions left to carry the light ink.
 *
 * So do not reason about it. Sweep a lightness scale over each palette's
 * fallback stops, render the whole library on the fallback path at each step,
 * and keep the scale that fails the fewest layers. One page load, all steps.
 *
 * usage: node scripts/tune_fallback.mjs        (needs a server on :8899)
 */
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';
/* Measured: failures fall monotonically as the fallback gets darker
   (k=0.55 -> 20 failing, 0.45 -> 13, 0.35 -> 10), because the inks the photo
   path settled on are mostly light. The first sweep spent six of its nine steps
   above 0.55 confirming that; this one searches the end that was actually
   winning. */
const STEPS = [0.12,0.2,0.3,0.45,0.65,0.9];

/* protocolTimeout:0 — a step renders the whole library and comfortably exceeds
   puppeteer's 180s default; the sweep died there on the first attempt. */
const browser = await puppeteer.launch({ executablePath: CHROME, headless:'new', args:['--no-sandbox'], protocolTimeout: 0 });
const page = await browser.newPage();
await page.goto(BASE, { waitUntil:'networkidle2', timeout:60000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => typeof CONTRAST_FIX !== 'undefined' && CONTRAST_FIX !== null, { timeout:20000 }).catch(()=>{});
await new Promise(r => setTimeout(r, 6000));

const runStep = async (STEPS) => page.evaluate(async (STEPS) => {
  const W = TPL_W, H = TPL_H;
  const isText = l => l.kind==='text' || l.kind==='textbox' || (!l.kind && l.text);
  const lin = c => { c/=255; return c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4); };
  const lumPx = (d,i) => 0.2126*lin(d[i])+0.7152*lin(d[i+1])+0.0722*lin(d[i+2]);
  const cr = (a,b) => (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
  const toHsl = hex => { const n=parseInt(String(hex).replace('#',''),16);
    const r=((n>>16)&255)/255,g=((n>>8)&255)/255,b=(n&255)/255;
    const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn,l=(mx+mn)/2;
    if(!d) return [0,0,l];
    const s=l>0.5?d/(2-mx-mn):d/(mx+mn);
    let h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4; h*=60; return [h<0?h+360:h,s,l]; };
  const toHex = (h,s,l) => { const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;
    const [r,g,b]=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
    const q=v=>Math.round(Math.max(0,Math.min(255,(v+m)*255))).toString(16).padStart(2,'0');
    return '#'+q(r)+q(g)+q(b); };
  const scale = (hex,k) => { const [h,s,l]=toHsl(hex); return toHex(h,s,Math.max(0.012,Math.min(0.86,l*k))); };

  function paint(tpl, fb, { noText=false, skipOne=-1 } = {}){
    const sc = new fabric.StaticCanvas(null,{width:W,height:H,renderOnAddRemove:false});
    sc.add(bgRectFor(fb, W, H));
    const refs=[];
    tpl.layers.forEach((l,i)=>{
      if (i===skipOne){refs.push(null);return;}
      if (noText && isText(l)){refs.push(null);return;}
      const o=buildLayer(l,tpl.id); sc.add(o); refs.push(o);
    });
    alignPass(sc,W,H); sc.renderAll();
    const d=sc.lowerCanvasEl.getContext('2d').getImageData(0,0,W,H).data; sc.dispose();
    return {d,refs};
  }

  const lib = TEMPLATES.filter(t => (t.id.startsWith('dl_')||t.id.startsWith('st_')) && t.bg.fallback);
  const res = {};
  for (const k of STEPS){
    for (const tpl of lib){
      const base = tpl.bg.fallback;
      const fb = { type:'grad', c1:scale(base.c1,k), c2:scale(base.c2,k), a:base.a };
      const stops = base.c1+'|'+base.c2;
      (res[stops] ||= {});
      (res[stops][k] ||= { fail:0, crit:0, n:0, c1:fb.c1, c2:fb.c2 });
      let full;
      try { full = paint(tpl,fb); } catch(e){ continue; }
      const boxes = tpl.layers.map((l,i)=>{ const o=full.refs[i];
        if(!o||!isText(l)||!String(l.text||'').trim()) return null;
        return {i,l,b:o.getBoundingRect(true,true),fs:Math.round(o.fontSize||0)}; }).filter(Boolean);
      const ov=(a,b)=>!(a.left+a.width<=b.left||b.left+b.width<=a.left||a.top+a.height<=b.top||b.top+b.height<=a.top);
      for (const info of boxes){
        // exact: remove only this layer. alignPass() moves the plates when the
        // text is stripped wholesale, so a shared "no text" frame is not the
        // ground -- same trap theme_render.mjs and converge_themes.mjs hit.
        let g;
        try { g = paint(tpl,fb,{skipOne:info.i}); } catch(e){ continue; }
        const b=info.b;
        const x0=Math.max(0,~~b.left),y0=Math.max(0,~~b.top),x1=Math.min(W,Math.ceil(b.left+b.width)),y1=Math.min(H,Math.ceil(b.top+b.height));
        const hits=[];
        for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
          const p=(y*W+x)*4;
          const df=Math.abs(full.d[p]-g.d[p])+Math.abs(full.d[p+1]-g.d[p+1])+Math.abs(full.d[p+2]-g.d[p+2]);
          if(df<150)continue;
          hits.push({gl:lumPx(g.d,p),fl:lumPx(full.d,p)});
        }
        /* A layer with almost no CORE pixels is not a layer to skip -- it is the
           worst case there is. core is the set of pixels the glyph fully owns;
           if nothing reaches that threshold while a quarter of the box changed,
           the ink and the ground are near-identical and the type has vanished.
           The first version of this sweep did `continue` on core<40, which
           dropped 38 of the 51 real failures on the floor and reported 13 where
           the audit found 51. A sweep that cannot see the worst outcome will
           happily optimise toward it. Count them, at their real contrast. */
        const want=info.l.role==='deco'?2.5:(info.fs>=30?3.0:4.5);
        const R=res[stops][k];
        const wide=[]; // df>=24: enough to compute a contrast when core is empty
        for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
          const p=(y*W+x)*4;
          const df=Math.abs(full.d[p]-g.d[p])+Math.abs(full.d[p+1]-g.d[p+1])+Math.abs(full.d[p+2]-g.d[p+2]);
          if(df<24)continue;
          wide.push(cr(lumPx(full.d,p),lumPx(g.d,p)));
        }
        if(wide.length<40) continue;                 // the layer really did not render
        R.n++;
        let c;
        if(hits.length>=40){
          let pol=0; hits.forEach(h=>pol+=(h.fl>h.gl?1:-1));
          const dir=pol>=0?1:-1;
          const core=hits.filter(h=>(h.fl>h.gl?1:-1)===dir);
          c = core.length>=40 ? core.reduce((s,h)=>s+cr(h.fl,h.gl),0)/core.length
                              : wide.reduce((s,v)=>s+v,0)/wide.length;
        } else {
          c = wide.reduce((s,v)=>s+v,0)/wide.length;
        }
        if(c<want){ R.fail++; if(['headline','phone','cta'].includes(info.l.role)) R.crit++; }
      }
      await new Promise(r=>setTimeout(r,0));
    }
  }
  return res;
}, STEPS);

const out = {};
for (const k of STEPS){
  const part = await runStep([k]);
  Object.entries(part).forEach(([stops, byK]) => { (out[stops] ||= {}); Object.assign(out[stops], byK); });
  const tot = Object.values(part).reduce((s,v)=>s+Object.values(v)[0].fail,0);
  console.log(`  k=${String(k).padEnd(5)} -> ${tot} failing layers across the library`);
}
await browser.close();

import { readFileSync } from 'node:fs';
const SRC = readFileSync(new URL('../app.js', import.meta.url),'utf8');
const palSrc = SRC.slice(SRC.search(/const PAL = \{/), SRC.indexOf('\n  };', SRC.search(/const PAL = \{/))+4);
const PAL = (0,eval)('('+palSrc.replace(/^const PAL = /,'').replace(/;\s*$/,'')+')');
const nameOf = stops => Object.entries(PAL).find(([k,P]) =>
  (P.fb1?P.fb1+'|'+P.fb2:P.bg1+'|'+P.bg2) === stops || P.bg1+'|'+P.bg2 === stops)?.[0] || stops;

console.log('\npalette   ' + STEPS.map(k=>String(k).padStart(6)).join('') + '   best');
let totalBest = 0;
const picks = {};
Object.entries(out).forEach(([stops, byK]) => {
  const row = STEPS.map(k => byK[k] ? byK[k].crit*100 + byK[k].fail : 9999);
  const bestI = row.indexOf(Math.min(...row));
  const k = STEPS[bestI], B = byK[k];
  totalBest += B.fail;
  picks[nameOf(stops)] = { k, c1:B.c1, c2:B.c2, fail:B.fail, crit:B.crit };
  console.log('  ' + nameOf(stops).padEnd(8) +
    STEPS.map(kk => (byK[kk] ? `${byK[kk].crit}/${byK[kk].fail}` : '-').padStart(6)).join('') +
    `   k=${k}  ${B.c1} ${B.c2}`);
});
console.log('\n(cells are critical/total failing layers for that palette at that scale)');
console.log('best-case total failing layers on the fallback path: ' + totalBest);
console.log('\nfb1/fb2 to write into PAL:');
Object.entries(picks).forEach(([n,p]) => console.log(`  ${n.padEnd(8)} fb1:'${p.c1}', fb2:'${p.c2}',   // k=${p.k}, ${p.crit} critical / ${p.fail} failing`));
