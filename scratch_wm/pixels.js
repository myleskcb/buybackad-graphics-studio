const puppeteer = require('/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core');
const fn = require(process.argv[2] || './fn.js');
function mkR(seed){let s=seed>>>0||1;const rand=()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};
 return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
const W=200,H=432,PAD=30;
const docs=[];
for(let s=0;s<24;s++){
  const r=fn(PAD,PAD,W,H,P,mkR(1+s*97531),'p'+s);
  docs.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W+2*PAD}" height="${H+2*PAD}" viewBox="0 0 ${W+2*PAD} ${H+2*PAD}"><rect width="100%" height="100%" fill="#FF00FF"/><defs>${r.defs}</defs>${r.body}</svg>`);
}
(async()=>{
 const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox'],headless:'new'});
 const p=await b.newPage();
 await p.setViewport({width:W+2*PAD,height:H+2*PAD});
 await p.setContent('<body style="margin:0"></body>');
 const out=await p.evaluate(async (docs,W,H,PAD)=>{
   const res=[];
   for(let i=0;i<docs.length;i++){
     const url='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(docs[i]);
     const img=new Image();
     await new Promise((ok,no)=>{img.onload=ok;img.onerror=()=>no(new Error('img fail '+i));img.src=url;});
     const cw=W+2*PAD, ch=H+2*PAD;
     const c=document.createElement('canvas');c.width=cw;c.height=ch;
     const g=c.getContext('2d');g.drawImage(img,0,0);
     const d=g.getImageData(0,0,cw,ch).data;
     let bleed=0, worst=0, inside=0, insideMagenta=0;
     for(let yy=0;yy<ch;yy++)for(let xx=0;xx<cw;xx++){
       const o=(yy*cw+xx)*4, r=d[o],gg=d[o+1],bb=d[o+2];
       const isMag = r>250 && gg<5 && bb>250;
       const outside = xx<PAD||yy<PAD||xx>=PAD+W||yy>=PAD+H;
       if(outside){ if(!isMag){bleed++; const dev=Math.abs(255-r)+gg+Math.abs(255-bb); if(dev>worst)worst=dev;} }
       else { inside++; if(isMag) insideMagenta++; }
     }
     res.push({i,bleed,worst,insideMagentaPct:+(100*insideMagenta/inside).toFixed(2)});
   }
   return res;
 },docs,W,H,PAD);
 const bad=out.filter(o=>o.bleed>0||o.insideMagentaPct>0);
 console.log('variants',out.length,'with bleed or holes:',bad.length);
 console.log(JSON.stringify(bad.slice(0,8)));
 await b.close();
})();
