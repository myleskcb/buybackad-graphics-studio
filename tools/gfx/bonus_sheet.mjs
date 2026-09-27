import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';
const ROOT='/Users/admin/Downloads/gfxv23/';
const man=JSON.parse(readFileSync(ROOT+'.render/themes/manifest.json','utf8')).filter(m=>/^bonus-/.test(m.id));
const U='http://localhost:8899/.render/themes/';
const html=`<style>body{margin:0;background:#0d0f12;font:11px system-ui;color:#9aa4b0}
 .g{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;padding:10px}
 img{width:100%;display:block;border-radius:5px} p{margin:4px 1px 0}</style>
 <div class=g>${man.map(m=>`<div><img src="${U}${m.id}.webp"><p>${m.name}</p></div>`).join('')}</div>`;
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',args:['--no-sandbox'],protocolTimeout:0});
const p=await b.newPage(); await p.setViewport({width:1500,height:900});
await p.goto('http://localhost:8899/'); await p.setContent(html);
await p.evaluate(()=>Promise.all([...document.images].map(i=>i.complete?null:new Promise(r=>{i.onload=i.onerror=r}))));
await p.screenshot({path:ROOT+'.shot/bonus.png',fullPage:true}); await b.close();
console.log('bonus.png ·',man.length,'arrangements');
