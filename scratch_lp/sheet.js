const puppeteer=require('/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core');
const path=require('path'),fs=require('fs');
const D='/Users/admin/Downloads/gfxv23/scratch_lp';
const { frame_laptop } = require(path.join(D,'fn_fixed.js'));
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function mkR(s){const r=mulberry32(s);return{f:(a,b)=>a+(b-a)*r(),i:(a,b)=>Math.floor(a+(b-a+1)*r()),pick:a=>a[Math.floor(r()*a.length)],chance:p=>r()<p};}
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
// grid of 6 small cells 140x110 to test small-size legibility + box discipline
const CW=140,CH=110,cols=6,rows=2;
let d='',b='';
for(let k=0;k<cols*rows;k++){
  const cx=(k%cols)*CW, cy=Math.floor(k/cols)*CH;
  const r=frame_laptop(cx+6,cy+6,CW-12,CH-12,P,mkR(100+k),'g'+k);
  d+=r.defs; b+='<rect x="'+(cx+6)+'" y="'+(cy+6)+'" width="'+(CW-12)+'" height="'+(CH-12)+'" fill="none" stroke="#FF00FF" stroke-width="0.5" stroke-dasharray="3 3"/>'+r.body;
}
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+(CW*cols)+'" height="'+(CH*rows)+'" viewBox="0 0 '+(CW*cols)+' '+(CH*rows)+'"><defs>'+d+'</defs><rect width="100%" height="100%" fill="'+P.ground+'"/>'+b+'</svg>';
fs.writeFileSync(path.join(D,'fix_grid.svg'),svg);
(async()=>{
const br=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox'],headless:'new'});
const p=await br.newPage();
const errs=[];p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});p.on('pageerror',e=>errs.push(String(e)));
await p.setViewport({width:CW*cols,height:CH*rows,deviceScaleFactor:3});
await p.goto('file://'+path.join(D,'fix_grid.svg'));
await p.screenshot({path:path.join(D,'fix_grid.png')});
await p.setViewport({width:400,height:864,deviceScaleFactor:2});
await p.goto('file://'+path.join(D,'fix_s7.svg'));
await p.screenshot({path:path.join(D,'fix_s7.png')});
console.log('console errors:',errs.length?errs:'none');
await br.close();
})();
