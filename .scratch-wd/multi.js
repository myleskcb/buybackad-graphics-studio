const fs=require('fs');
const fn=require('/Users/admin/Downloads/gfxv23/.scratch-wd/fn.js');
const puppeteer=require('/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core');
const dir='/Users/admin/Downloads/gfxv23/.scratch-wd/';
function mkR(seed){let s=seed>>>0;const rand=()=>{s|=0;s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};
return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
const seeds=[1,2,3,4,5,6,7,8,9,10,11,12];
const CW=400,CH=864,PAD=16;
let defs='',cells='';
seeds.forEach((sd,k)=>{
  const X=PAD+k*(CW+PAD), Y=PAD;
  const r=fn(X,Y,CW,CH,P,mkR(sd),'m'+sd);
  defs+=r.defs; cells+=r.body;
});
const GW=PAD+seeds.length*(CW+PAD), GH=CH+PAD*2;
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${GW}" height="${GH}" viewBox="0 0 ${GW} ${GH}"><rect width="${GW}" height="${GH}" fill="#888"/><defs>${defs}</defs>${cells}</svg>`;
fs.writeFileSync(dir+'strip.svg',svg);
(async()=>{
 const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox'],headless:true});
 for(const [scale,out] of [[0.24,'strip_big.png'],[0.06,'strip_small.png']]){
   const W=Math.round(GW*scale),H=Math.round(GH*scale);
   const s2=svg.replace(/width="\d+" height="\d+"/,`width="${W}" height="${H}"`);
   fs.writeFileSync(dir+'strip.html',`<!doctype html><meta charset=utf-8><style>html,body{margin:0;background:#888}svg{display:block}</style>${s2}`);
   const p=await b.newPage();
   await p.setViewport({width:W,height:H,deviceScaleFactor:1});
   await p.goto('file://'+dir+'strip.html',{waitUntil:'load'});
   await p.screenshot({path:dir+out});
   await p.close();
   console.log(out,W,'x',H);
 }
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
