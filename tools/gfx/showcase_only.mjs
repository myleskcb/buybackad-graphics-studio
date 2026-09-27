/* the showcase grounds alone, no card content — so the geometry can be judged */
import * as SC from '../../engine/showcase.mjs';
import puppeteer from 'puppeteer-core';
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const mk=seed=>{const r=mulberry32(seed);return{f:(a=0,b=1)=>a+(b-a)*r(),i:(a,b)=>Math.floor(a+(b-a+1)*r()),pick:a=>a[Math.floor(r()*a.length)],chance:p=>r()<p};};
const SCRIM=+(process.argv[2]||0);
/* one HTML page, four SVGs: ids must be unique across ALL of them or a
   clip-path resolves against the first match in the document and the later
   cards clip themselves into nothing */
let uid=0;
const cards=Object.keys(SC.LAYOUTS).map(lay=>{
  const defs=[],svg=[];
  const c={W:1080,H:1350,P,R:mk(7),F:{body:'system-ui'},C:{brand:'iPhones.LA'},
    id:p=>p+(uid++),def:d=>defs.push(d),add:(m)=>svg.push(m),cfg:{}};
  SC.drawShowcase(c,{x:0,y:0,w:1080,h:1350},{layout:lay,brand:'iPhones.LA',fade:1});
  return{lay,svg:`<svg viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg"><defs>${defs.join('')}</defs><rect width="1080" height="1350" fill="${P.ground}"/>${svg.join('')}</svg>`};
});
const html=`<style>body{margin:0;background:#111;font:12px system-ui;color:#bbb}
 .g{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:8px}
 svg{width:100%;height:auto;display:block}</style>
 <div class=g>${cards.map(c=>`<div>${c.svg}<p>${c.lay}</p></div>`).join('')}</div>`;
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',args:['--no-sandbox'],protocolTimeout:0});
const p=await b.newPage(); await p.setViewport({width:1500,height:600});
await p.setContent(html); await p.screenshot({path:'.shot/showcase-only.png',fullPage:true});
await b.close(); console.log('showcase-only.png · scrim',SCRIM,'·',cards.map(c=>c.lay).join(', '));
