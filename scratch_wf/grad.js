const puppeteer = require('/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core');
const fn = require('/Users/admin/Downloads/gfxv23/scratch_wf/fn.js');
const fs=require('fs');
const P = {ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
function mk(seed){let t=seed>>>0;const rand=()=>{t+=0x6D2B79F5;let z=t;z=Math.imul(z^z>>>15,z|1);z^=z+Math.imul(z^z>>>7,z|61);return((z^z>>>14)>>>0)/4294967296;};
 return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const W=200,H=432;
const seeds=[]; for(let s=1;s<=120;s++) seeds.push(s);
const svgs=seeds.map(s=>{const r=fn(0,0,W,H,P,mk(s),'b'+s);
 return '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'"><defs>'+r.defs+'</defs>'+r.body+'</svg>';});
(async()=>{
 const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox'],headless:'new'});
 const p=await b.newPage(); await p.goto('about:blank');
 const out=await p.evaluate(async(svgs,W,H)=>{
   const lum=(r,g,bl)=>{const f=v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(r)+.7152*f(g)+.0722*f(bl)};
   const cv=document.createElement('canvas');cv.width=W;cv.height=H;const cx=cv.getContext('2d',{willReadFrequently:true});
   const res=[];
   for(let i=0;i<svgs.length;i++){
     const img=new Image();
     await new Promise(ok=>{img.onload=ok;img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svgs[i]);});
     cx.clearRect(0,0,W,H);cx.drawImage(img,0,0,W,H);
     const d=cx.getImageData(0,0,W,H).data;
     const y0=Math.round(H*.2),y1=Math.round(H*.8);
     // steepest local change over 6px, inside the middle band
     let steep=0,sx=0,sy=0;
     const L=(x,y)=>{const k=(y*W+x)*4;return lum(d[k],d[k+1],d[k+2]);};
     for(let y=y0;y<y1;y++) for(let x=0;x<W-6;x++){
       const a=L(x,y),c=L(x+6,y); const dv=Math.abs(a-c);
       if(dv>steep){steep=dv;sx=x;sy=y;}
       if(y+6<y1){const e=L(x,y+6); const dv2=Math.abs(a-e); if(dv2>steep){steep=dv2;sx=x;sy=y;}}
     }
     res.push({seed:i+1, steep:+steep.toFixed(4), at:[sx,sy]});
   }
   return res;
 },svgs,W,H);
 await b.close();
 const s=out.map(o=>o.steep).sort((a,b)=>a-b);
 console.log('steepest luminance change per 6px inside the middle 60% (0..1 scale):');
 console.log(' median',s[60],' p90',s[108],' max',s[119]);
 console.log(' worst 6:',out.slice().sort((a,b)=>b.steep-a.steep).slice(0,6).map(o=>o.seed+':'+o.steep+'@'+o.at).join('  '));
 // reference: what a hard edge measures — the disc edge itself
 console.log(' (for scale: a hard black/white edge over 6px would read ~1.0; a flat field ~0.00x)');
})();
