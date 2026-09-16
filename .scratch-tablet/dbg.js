const puppeteer=require('/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core');
const fn=require('./fn.js');
function mkR(seed){let s=seed>>>0;const rand=()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};
 return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
(async()=>{
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox'],headless:'new'});
const page=await b.newPage(); await page.setContent('<html><body></body></html>');
const M=30,bw=2.5,bh=900,W=bw+2*M,H=bh+2*M;
const r=fn(M,M,bw,bh,P,mkR(5),'z');
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'"><rect width="'+W+'" height="'+H+'" fill="#00FF00"/><defs>'+r.defs+'</defs>'+r.body+'</svg>';
const out=await page.evaluate(async(svgStr,W,H,M,bw,bh)=>{
 const img=new Image(); await new Promise(ok=>{img.onload=ok;img.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svgStr)));});
 const c=document.createElement('canvas'); c.width=Math.ceil(W); c.height=Math.ceil(H);
 const g=c.getContext('2d'); g.drawImage(img,0,0);
 const d=g.getImageData(0,0,c.width,c.height).data; const pts=[];
 for(let py=0;py<c.height;py++)for(let px=0;px<c.width;px++){
   const i=(py*c.width+px)*4; const green=(d[i]<12&&d[i+1]>243&&d[i+2]<12);
   const inside=(px>=M&&px<M+bw&&py>=M&&py<M+bh);
   if(!inside&&!green) pts.push([px,py,d[i],d[i+1],d[i+2],d[i+3]]);
 }
 return {imgW:img.width,imgH:img.height,cw:c.width,ch:c.height,n:pts.length,sample:pts.slice(0,6),last:pts.slice(-4)};
},svg,W,H,M,bw,bh);
console.log(JSON.stringify(out,null,1));
await b.close();})();
