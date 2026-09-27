const puppeteer=require('/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core');
const fn=require('/Users/admin/Downloads/gfxv23/scratch_wf/fn.js');const fs=require('fs');
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
function mk(seed){let t=seed>>>0;const rand=()=>{t+=0x6D2B79F5;let z=t;z=Math.imul(z^z>>>15,z|1);z^=z+Math.imul(z^z>>>7,z|61);return((z^z>>>14)>>>0)/4294967296;};
 return{f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
// worst seeds at 200x432 geometry, side by side, with the middle-60% band marked
let g='';const seeds=[28,69,95,85,14,38];
seeds.forEach((s,i)=>{const X=i*220+10;const r=fn(X,10,200,432,P,mk(s),'w'+s);g+='<defs>'+r.defs+'</defs>'+r.body;
 g+='<rect x="'+X+'" y="'+(10+432*0.2)+'" width="200" height="'+(432*0.6)+'" fill="none" stroke="#FF00FF" stroke-width="1" stroke-dasharray="4 4"/>';});
fs.writeFileSync('/Users/admin/Downloads/gfxv23/scratch_wf/worst.svg',
 '<svg xmlns="http://www.w3.org/2000/svg" width="1330" height="452" viewBox="0 0 1330 452"><rect width="1330" height="452" fill="#0E253C"/>'+g+'</svg>');
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox'],headless:'new'});
 const p=await b.newPage();await p.setViewport({width:1330,height:452,deviceScaleFactor:1});
 await p.goto('file:///Users/admin/Downloads/gfxv23/scratch_wf/worst.svg');
 await p.screenshot({path:'/Users/admin/Downloads/gfxv23/scratch_wf/worst.png'});await b.close();console.log('ok');})();
