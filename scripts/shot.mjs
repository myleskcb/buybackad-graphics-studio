#!/usr/bin/env node
/* Render named templates to .render/shots/<id>.png so a finding can be LOOKED
 * at rather than believed. Every contrast number in the theme audit was
 * spot-checked this way before it was reported.
 *
 * usage: node scripts/shot.mjs st_sports_cutouthero dl_gold_slabPoster_paper
 */
import puppeteer from 'puppeteer-core';
import { writeFileSync, mkdirSync } from 'node:fs';
const OUT = new URL('../.render/shots/', import.meta.url).pathname;
mkdirSync(OUT,{recursive:true});
const ids = process.argv.slice(2);
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',args:['--no-sandbox'],protocolTimeout:0});
const p=await b.newPage();
await p.goto('http://localhost:8899/',{waitUntil:'networkidle2',timeout:60000});
await p.evaluate(()=>document.fonts.ready);
await p.waitForFunction(()=>typeof CONTRAST_FIX!=='undefined'&&CONTRAST_FIX!==null,{timeout:20000}).catch(()=>{});
await new Promise(r=>setTimeout(r,6000));
const shots=await p.evaluate((ids)=>{
  const W=TPL_W,H=TPL_H; const out=[];
  for(const id of ids){
    const tpl=TEMPLATES.find(t=>t.id===id); if(!tpl){out.push({id,err:'not found'});continue;}
    const sc=new fabric.StaticCanvas(null,{width:W,height:H,renderOnAddRemove:false});
    const bgi=tpl.bg.type==='image'?freshBgImage(tpl.bg.src,tpl.bg.blur,tpl.bg.grade):null;
    if(bgi){sc.setBackgroundImage(coverImage(bgi,W,H),()=>{}); if(tpl.bg.scrim) sc.add(scrimRect(tpl.bg.scrim,W,H,tpl.bg.scrimColor,tpl.bg.scrimMode));}
    else sc.add(bgRectFor(tpl.bg.fallback||{type:'solid',c:'#101014'},W,H));
    tpl.layers.forEach(l=>sc.add(buildLayer(l,tpl.id)));
    alignPass(sc,W,H); sc.renderAll();
    out.push({id,png:sc.lowerCanvasEl.toDataURL('image/png')}); sc.dispose();
  }
  return out;
},ids);
shots.forEach(s=>{ if(s.err){console.log(s.id,s.err);return;}
  writeFileSync(OUT+s.id+'.png', Buffer.from(s.png.split(',')[1],'base64'));
  console.log('wrote',OUT+s.id+'.png'); });
await b.close();
