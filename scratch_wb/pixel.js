const puppeteer=require('/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core');
const fn=require('/Users/admin/Downloads/gfxv23/scratch_wb/fn.js');
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function mkR(s){const r=mulberry32(s);return{f:(a,b)=>a+(b-a)*r(),i:(a,b)=>Math.floor(a+(b-a+1)*r()),pick:a=>a[Math.floor(r()*a.length)],chance:p=>r()<p};}
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
(async()=>{
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox'],headless:'new'});
const p=await b.newPage();await p.setViewport({width:440,height:904});
const seeds=[12345,1,4,77,900];
for(const s of seeds){
 const o=fn(20,20,400,864,P,mkR(s),'p'+s);
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="440" height="904" viewBox="0 0 440 904"><defs>'+o.defs+'</defs><rect width="440" height="904" fill="#FF00FF"/>'+o.body+'</svg>';
 const res=await p.evaluate(async(svg)=>{
   const img=new Image();const url='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
   await new Promise((ok,no)=>{img.onload=ok;img.onerror=no;img.src=url;});
   const c=document.createElement('canvas');c.width=440;c.height=904;const g=c.getContext('2d');g.drawImage(img,0,0);
   const d=g.getImageData(0,0,440,904).data;
   let inMag=0,outNonMag=0,inside=0,uniq=new Set();
   for(let yy=0;yy<904;yy++)for(let xx=0;xx<440;xx++){
     const i=(yy*440+xx)*4;const mag=d[i]>240&&d[i+1]<15&&d[i+2]>240;
     const isIn=xx>=20&&xx<420&&yy>=20&&yy<884;
     if(isIn){inside++;if(mag)inMag++;uniq.add(d[i]+','+d[i+1]+','+d[i+2]);}
     else if(!mag)outNonMag++;
   }
   return {inMag,outNonMag,inside,uniqColors:uniq.size};
 },svg);
 console.log('seed',s,JSON.stringify(res));
}
await b.close();})().catch(e=>{console.error(e);process.exit(1)});
