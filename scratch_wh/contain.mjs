import fs from 'fs';
import puppeteer from '/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const dir='/Users/admin/Downloads/gfxv23/scratch_wh';
const mod = await import(process.argv[2] || (dir+'/fn.mjs'));
const fn = mod.wall_hills;
function mkR(seed){let s=seed>>>0||1;const rand=()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};
 return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
const RX=60,RY=80,RW=200,RH=300,CW=400,CH=500;
const svgs=[];
for(let k=0;k<60;k++){
  const r=fn(RX,RY,RW,RH,P,mkR(500+k*104729),'c'+k);
  svgs.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${CW}" height="${CH}"><defs>${r.defs}</defs><rect width="${CW}" height="${CH}" fill="#FF00FF"/>${r.body}</svg>`);
}
fs.writeFileSync(dir+'/blank.html','<!doctype html><meta charset=utf-8><body></body>');
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox'],headless:true});
const p=await b.newPage();
await p.goto('file://'+dir+'/blank.html');
const res=await p.evaluate(async(svgs,RX,RY,RW,RH,CW,CH)=>{
  const out=[];
  for(let k=0;k<svgs.length;k++){
    const blob=new Blob([svgs[k]],{type:'image/svg+xml'});
    const url=URL.createObjectURL(blob);
    const img=new Image();
    await new Promise((res,rej)=>{img.onload=res;img.onerror=()=>rej('load fail '+k);img.src=url;});
    const cv=document.createElement('canvas');cv.width=CW;cv.height=CH;
    const cx=cv.getContext('2d');cx.drawImage(img,0,0,CW,CH);
    const d=cx.getImageData(0,0,CW,CH).data;
    let leaks=0, sample=null;
    for(let yy=0;yy<CH;yy++)for(let xx=0;xx<CW;xx++){
      if(xx>=RX&&xx<RX+RW&&yy>=RY&&yy<RY+RH)continue;
      const o=(yy*CW+xx)*4;
      if(!(d[o]>235&&d[o+1]<20&&d[o+2]>235)){leaks++; if(!sample)sample=[xx,yy,d[o],d[o+1],d[o+2]];}
    }
    URL.revokeObjectURL(url);
    out.push({k,leaks,sample});
  }
  return out;
},svgs,RX,RY,RW,RH,CW,CH);
await b.close();
const bad=res.filter(r=>r.leaks>0);
console.log('panels tested:',res.length,'with leaks:',bad.length);
console.log(JSON.stringify(bad.slice(0,8)));
