const puppeteer = require('/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core');
const fn = require('/Users/admin/Downloads/gfxv23/scratch_wf/fn.js');
const P = {ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
function mk(seed){let t=seed>>>0;const rand=()=>{t+=0x6D2B79F5;let z=t;z=Math.imul(z^z>>>15,z|1);z^=z+Math.imul(z^z>>>7,z|61);return((z^z>>>14)>>>0)/4294967296;};
 return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const W=200,H=432;
const svgs=[];
for(let s=1;s<=120;s++){
  const r=fn(0,0,W,H,P,mk(s),'b'+s);
  svgs.push('<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'"><defs>'+r.defs+'</defs>'+r.body+'</svg>');
}
(async()=>{
 const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox'],headless:'new'});
 const p=await b.newPage();
 await p.goto('about:blank');
 const out=await p.evaluate(async(svgs,W,H)=>{
   const lum=(r,g,bl)=>{const f=v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(r)+.7152*f(g)+.0722*f(bl)};
   const cv=document.createElement('canvas'); cv.width=W; cv.height=H; const cx=cv.getContext('2d',{willReadFrequently:true});
   const res=[];
   for(let i=0;i<svgs.length;i++){
     const img=new Image();
     await new Promise((ok,no)=>{img.onload=ok;img.onerror=()=>no('img fail');img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svgs[i]);});
     cx.clearRect(0,0,W,H); cx.drawImage(img,0,0,W,H);
     let d; try{ d=cx.getImageData(0,0,W,H).data; }catch(e){ return {err:String(e)} }
     // middle 60% vertically
     const y0=Math.round(H*0.2), y1=Math.round(H*0.8);
     let mn=1,mx=0, alpha0=0;
     for(let y=y0;y<y1;y++) for(let x=0;x<W;x++){
       const k=(y*W+x)*4;
       if(d[k+3]<250) alpha0++;
       const L=lum(d[k],d[k+1],d[k+2]);
       if(L<mn)mn=L; if(L>mx)mx=L;
     }
     const ratio=(mx+.05)/(mn+.05);
     res.push({seed:i+1, mn:+mn.toFixed(3), mx:+mx.toFixed(3), swing:+ratio.toFixed(2), transparent:alpha0});
   }
   return {res};
 }, svgs, W, H);
 await b.close();
 if(out.err){console.log('CANVAS ERR',out.err);return;}
 const r=out.res;
 const sw=r.map(o=>o.swing).sort((a,b)=>a-b);
 console.log('luminance swing across the middle 60% (max/min contrast ratio) over 120 seeds:');
 console.log('  median',sw[60],' p90',sw[108],' max',sw[119]);
 console.log('  worst 6:',r.slice().sort((a,b)=>b.swing-a.swing).slice(0,6).map(o=>o.seed+':'+o.swing).join(' '));
 console.log('  seeds with swing > 2.0 :', r.filter(o=>o.swing>2).length, '/120');
 console.log('  seeds with swing > 3.0 :', r.filter(o=>o.swing>3).length, '/120');
 console.log('  any transparent pixel inside the box:', r.reduce((a,o)=>a+o.transparent,0));
})();
