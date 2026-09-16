const fs=require('fs');
const fn=require('/Users/admin/Downloads/gfxv23/.scratch-wd/fn.js');
const puppeteer=require('/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core');
const dir='/Users/admin/Downloads/gfxv23/.scratch-wd/';
function mkR(seed){let s=seed>>>0;const rand=()=>{s|=0;s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};
return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
// each card is authored at full 400x864 then the whole sheet is scaled by the svg width
function sheet(seeds, cols, pad){
  const CW=400,CH=864; let defs='',cells='';
  seeds.forEach((sd,k)=>{
    const r=Math.floor(k/cols), c=k%cols;
    const X=pad+c*(CW+pad), Y=pad+r*(CH+pad);
    const res=fn(X,Y,CW,CH,P,mkR(sd),'m'+sd);
    defs+=res.defs; cells+=res.body;
  });
  const rows=Math.ceil(seeds.length/cols);
  const GW=pad+cols*(CW+pad), GH=pad+rows*(CH+pad);
  return {svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${GW}" height="${GH}" viewBox="0 0 ${GW} ${GH}"><rect width="${GW}" height="${GH}" fill="#8a8a8a"/><defs>${defs}</defs>${cells}</svg>`,GW,GH};
}
const seeds=[1,2,5,7,9,11,17,23];
const big=sheet(seeds,4,40);
const small=sheet(seeds,8,40);
(async()=>{
 const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox'],headless:true});
 async function shot(o,scale,out){
   const W=Math.round(o.GW*scale),H=Math.round(o.GH*scale);
   const s2=o.svg.replace(/width="\d+" height="\d+"/,`width="${W}" height="${H}"`);
   fs.writeFileSync(dir+'tmp.html',`<!doctype html><meta charset=utf-8><style>html,body{margin:0;background:#8a8a8a}svg{display:block}</style>${s2}`);
   const p=await b.newPage(); await p.setViewport({width:W,height:H,deviceScaleFactor:1});
   await p.goto('file://'+dir+'tmp.html',{waitUntil:'load'});
   await p.screenshot({path:dir+out}); await p.close();
   console.log(out,W,'x',H,'card px wide:',Math.round(400*scale));
 }
 await shot(big,0.5,'sheet_big.png');   // cards at 200px
 await shot(small,0.25,'sheet_100.png'); // cards at 100px
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
