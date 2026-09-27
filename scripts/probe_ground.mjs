#!/usr/bin/env node
/* Why does a near-white CTA measure 1.01:1?
   Sample the REAL rendered ground directly under a given layer's box, and
   compare it to what washGroundLum() reports for the template as a whole. If
   they differ a lot, the contrast passes are using a frame-average against a
   ground that varies strongly by position — which a banded gradient scrim
   guarantees. */
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';
const ids = (process.argv[2]||'st_silver_topstrip').split(',');

const browser = await puppeteer.launch({ executablePath: CHROME, headless:'new', args:['--no-sandbox'] });
const page = await browser.newPage();
await page.goto(BASE, { waitUntil:'networkidle2', timeout:60000 });
await page.evaluate(() => document.fonts.ready);
// Wait for the measured contrast table (assets/contrast-fix.json) to load and
// apply. It is fetched asynchronously, so a harness that starts measuring too
// early records the PRE-repair colours and reports failures that are already
// fixed on screen.
await page.waitForFunction(() => typeof CONTRAST_FIX !== 'undefined' && CONTRAST_FIX !== null, { timeout: 20000 }).catch(()=>{});
await new Promise(r=>setTimeout(r,5000));

const out = await page.evaluate((ids) => {
  const W=TPL_W,H=TPL_H;
  const res=[];
  for (const id of ids){
    const tpl=TEMPLATES.find(x=>x.id===id); if(!tpl){res.push({id,err:'missing'});continue;}
    // paint WITHOUT any text: this is the true ground
    const sc=new fabric.StaticCanvas(null,{width:W,height:H,renderOnAddRemove:false});
    const bgi=tpl.bg.type==='image'?freshBgImage(tpl.bg.src,tpl.bg.blur,tpl.bg.grade):null;
    if(bgi){ sc.setBackgroundImage(coverImage(bgi,W,H),()=>{});
      if(tpl.bg.scrim) sc.add(scrimRect(tpl.bg.scrim,W,H,tpl.bg.scrimColor,tpl.bg.scrimMode)); }
    else sc.add(bgRectFor(tpl.bg,W,H));
    tpl.layers.forEach(l=>{ if(typeof l.text!=='string') sc.add(buildLayer(l,tpl.id)); });
    sc.renderAll();
    const d=sc.lowerCanvasEl.getContext('2d').getImageData(0,0,W,H);
    sc.dispose();
    const lin=c=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);};
    const bandLum=(y0,y1)=>{let s=0,n=0;
      for(let y=Math.max(0,y0);y<Math.min(H,y1);y+=2)for(let x=0;x<W;x+=2){
        const i=(y*W+x)*4; s+=0.2126*lin(d.data[i])+0.7152*lin(d.data[i+1])+0.0722*lin(d.data[i+2]); n++;}
      return n?s/n:0;};
    const rows=[];
    tpl.layers.forEach(l=>{
      if(typeof l.text!=='string'||!l.props) return;
      if(!/^(cta|headline|phone)$/.test(l.role||'')) return;
      const fs=l.props.fontSize||40, top=l.props.top||0;
      rows.push({ name:l.name, role:l.role, fill:l.props.fill,
                  grad:l.props.grad?[l.props.grad.c1,l.props.grad.c2]:null,
                  top, localGround:+bandLum(top,top+fs).toFixed(4) });
    });
    res.push({ id, frameAvg:+bandLum(0,H).toFixed(4),
               washReported:+(washGroundLum(tpl)||0).toFixed(4), rows });
  }
  return res;
}, ids);
await browser.close();

for (const r of out){
  console.log('\n=== '+r.id+' ===');
  if(r.err){console.log(r.err);continue;}
  console.log(`  washGroundLum() reports ${r.washReported}   true frame average ${r.frameAvg}`);
  r.rows.forEach(x=>{
    const L=c=>{const h=String(c||'').replace('#','');if(!/^[0-9a-f]{6}$/i.test(h))return null;
      const n=parseInt(h,16);const ch=[(n>>16)&255,(n>>8)&255,n&255].map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});
      return 0.2126*ch[0]+0.7152*ch[1]+0.0722*ch[2];};
    const il=L(x.fill)??(x.grad?L(x.grad[0]):null);
    const cr=il==null?null:((Math.max(il,x.localGround)+0.05)/(Math.min(il,x.localGround)+0.05)).toFixed(2);
    console.log(`  ${x.role.padEnd(8)} "${x.name}" top=${x.top} fill=${x.fill} localGround=${x.localGround}  cr_here=${cr}`);
  });
}
