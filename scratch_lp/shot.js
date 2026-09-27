const puppeteer=require('/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core');
const fs=require('fs'),path=require('path');
const D='/Users/admin/Downloads/gfxv23/scratch_lp';
const which=process.argv[2]||'orig';
(async()=>{
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox'],headless:'new'});
const page=await browser.newPage();
const seeds=[7,8,21,99,1234];
for(const s of seeds){
  const f=path.join(D,which+'_s'+s+'.svg');
  await page.setViewport({width:400,height:864,deviceScaleFactor:2});
  await page.goto('file://'+f);
  await page.screenshot({path:path.join(D,which+'_s'+s+'.png')});
  // bbox of art vs box
  const bb=await page.evaluate(()=>{
    const g=document.getElementById('art');
    const kids=[...g.children];
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
    const walk=(el)=>{ if(el.getBBox){ try{const b=el.getBBox(); if(b.width||b.height){x0=Math.min(x0,b.x);y0=Math.min(y0,b.y);x1=Math.max(x1,b.x+b.width);y1=Math.max(y1,b.y+b.height);} }catch(e){} } };
    const rec=(el)=>{ walk(el); [...el.children].forEach(rec); };
    kids.forEach(rec);
    const gb=g.getBBox();
    return {union:[x0,y0,x1,y1], gbox:[gb.x,gb.y,gb.x+gb.width,gb.y+gb.height]};
  });
  console.log('seed',s,'gbox',bb.gbox.map(v=>v.toFixed(2)).join(','),'| union(unclipped)',bb.union.map(v=>v.toFixed(2)).join(','));
}
// small render of seed 7
const page2=await browser.newPage();
await page2.setViewport({width:100,height:216,deviceScaleFactor:1});
await page2.goto('file://'+path.join(D,which+'_s7_clean.svg')+'');
await page2.evaluate(()=>{const s=document.querySelector('svg');s.setAttribute('width','100');s.setAttribute('height','216');});
await page2.screenshot({path:path.join(D,which+'_s7_100px.png')});
await page2.setViewport({width:100,height:216,deviceScaleFactor:6});
await page2.screenshot({path:path.join(D,which+'_s7_100px_zoom.png')});
// console errors
await browser.close();
})();
