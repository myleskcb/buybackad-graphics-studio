import * as E from '../../engine/engine.mjs';
import puppeteer from 'puppeteer-core';
const BASE='http://localhost:8899/';
const cards=[];
for (const lay of ['iso','family','wall','trio'])
  for (let s=0;s<4;s++){
    const seed=4242+s*977;
    const r=E.render(['nightLot','bandStack','posterBleed','proofWall'][s],seed,'phones','45',
      {...E.DEFAULT_CFG(),allowPlaceholder:true,embedFonts:false,assetBase:BASE,showcaseLayout:lay});
    cards.push({svg:r.svg,cap:`${lay} · ${r.palette.name} · ${r.pair.id} · ${(r.audit.coverage*100).toFixed(0)}% · ${r.audit.pass}/${r.audit.total}`});
  }
const html=`<style>${E.fontCSS()} body{margin:0;background:#111;font:11px system-ui;color:#bbb}
 .g{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:10px}
 .c svg{width:100%;height:auto;display:block} .c p{margin:3px 1px 0}</style>
 <div class=g>${cards.map(c=>`<div class=c>${c.svg}<p>${c.cap}</p></div>`).join('')}</div>`;
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',args:['--no-sandbox'],protocolTimeout:0});
const p=await b.newPage(); await p.setViewport({width:1500,height:1000});
await p.goto(BASE); await p.setContent(html);
await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.complete?null:new Promise(r=>{i.onload=i.onerror=r})))});
await p.screenshot({path:'/Users/admin/Downloads/gfxv23/.shot/showcase.png',fullPage:true});
await b.close(); console.log('showcase.png ·',cards.length,'cards');
