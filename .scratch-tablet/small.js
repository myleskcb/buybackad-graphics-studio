const puppeteer=require('/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core');
const fn=require('./fn.js'); const fs=require('fs');
function mkR(seed){let s=seed>>>0;const rand=()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};
 return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
// true 1:1 sizes: the box is literally 40/60/100/160 px wide
let x=0, parts='', W=0, H=350;
[[40,86],[60,130],[100,216],[160,346]].forEach((s,k)=>{
  const r=fn(x+10,10,s[0],s[1],P,mkR(12345),'z'+k);
  parts+='<defs>'+r.defs+'</defs>'+r.body; x+=s[0]+20; W=x;
});
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'"><rect width="'+W+'" height="'+H+'" fill="'+P.ground+'"/>'+parts+'</svg>';
fs.writeFileSync('sizes.svg',svg);
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox'],headless:'new'});
 const p=await b.newPage();
 await p.setViewport({width:W,height:H,deviceScaleFactor:1});
 await p.goto('file://'+__dirname+'/sizes.svg',{waitUntil:'networkidle0'}); await p.screenshot({path:'sizes_1x.png'});
 await p.setViewport({width:W,height:H,deviceScaleFactor:3});
 await p.reload({waitUntil:'networkidle0'}); await p.screenshot({path:'sizes_3x.png'});
 console.log('W',W); await b.close();})();
