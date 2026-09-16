const puppeteer = require('/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core');
const fn = require(process.env.FNPATH || '/Users/admin/Downloads/gfxv23/.scratch-tablet/fn.js');
const D = '/Users/admin/Downloads/gfxv23/.scratch-tablet/';
function mkR(seed){let s=seed>>>0;const rand=()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};
 return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
const shapes=[[400,864],[380,240],[240,240],[60,120],[230,80],[40,300],[300,300],[500,120],[3,3],[10,900],[14,14],[20,20],[26,26],[40,40],[60,60],[100,100],[5,5],[4,7],[2.5,900],[860,400]];
(async()=>{
 const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox'],headless:'new'});
 const page=await browser.newPage();
 let worst=0, fails=[];
 for(let si=0;si<shapes.length;si++){
  for(let seed=1;seed<=12;seed++){
   const [bw,bh]=shapes[si];
   const M=30, W=bw+2*M, H=bh+2*M;
   const r=fn(M,M,bw,bh,P,mkR(seed*9176+si*31),'b'+si+'_'+seed);
   const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">'
     +'<rect width="'+W+'" height="'+H+'" fill="#00FF00"/><defs>'+r.defs+'</defs>'+r.body+'</svg>';
   await page.setContent('<html><body></body></html>',{waitUntil:'load'});
   const res=await page.evaluate(async(svgStr,W,H,M,bw,bh)=>{
     const img=new Image();
     await new Promise(ok=>{img.onload=ok;img.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svgStr)));});
     const c=document.createElement('canvas');c.width=Math.ceil(W);c.height=Math.ceil(H);
     const g=c.getContext('2d');g.drawImage(img,0,0);
     W=c.width;H=c.height;const d=g.getImageData(0,0,W,H).data;
     let bad=0,maxOver=0,inkIn=0;
     for(let py=0;py<H;py++)for(let px=0;px<W;px++){
       const i=(py*W+px)*4;
       const isGreen=(d[i]<12&&d[i+1]>243&&d[i+2]<12);
       const inside=(px>=M&&px<M+bw&&py>=M&&py<M+bh);
       if(inside){ if(!isGreen) inkIn++; }
       else if(!isGreen){ bad++;
         const dx=px<M?M-px:(px>=M+bw?px-(M+bw)+1:0);
         const dy=py<M?M-py:(py>=M+bh?py-(M+bh)+1:0);
         maxOver=Math.max(maxOver,dx,dy);
       }
     }
     return {bad,maxOver,inkIn,area:bw*bh};
   },svg,W,H,M,bw,bh);
   worst=Math.max(worst,res.maxOver);
   if(res.bad>0) fails.push({shape:shapes[si].join('x'),seed,bad:res.bad,overshootPx:res.maxOver});
   if(seed===1) console.log(shapes[si].join('x'),'seed1 coverage', (100*res.inkIn/res.area).toFixed(1)+'%');
  }
 }
 console.log('---');
 console.log('total out-of-box violations:',fails.length,'worst overshoot px:',worst);
 fails.slice(0,20).forEach(f=>console.log(' OUT',JSON.stringify(f)));
 await browser.close();
})();
