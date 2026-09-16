const puppeteer=require('/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core');
const path=require('path');
const D='/Users/admin/Downloads/gfxv23/scratch_lp';
const which=process.argv[2]||'orig';
const { frame_laptop } = require(path.join(D, which==='fix'?'fn_fixed.js':'fn.js'));
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function mkR(seed){const rand=mulberry32(seed);return{f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
const boxes=[[0,0,400,864],[20,40,360,300],[0,0,300,120],[0,0,120,300],[10,10,80,60],[0,0,600,200],[5,5,40,30],[0,0,900,900]];
(async()=>{
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox'],headless:'new'});
const p=await b.newPage();
let worst=0, worstDesc='';
let html='<svg xmlns="http://www.w3.org/2000/svg" id="S" width="1000" height="1000" viewBox="0 0 1000 1000"></svg>';
await p.setContent('<!doctype html><body style="margin:0">'+html+'</body>');
for(const bx of boxes){
  for(let s=1;s<=40;s++){
    const r=frame_laptop(bx[0],bx[1],bx[2],bx[3],P,mkR(s),'t'+s);
    const res=await p.evaluate((defs,body)=>{
      const S=document.getElementById('S');
      S.innerHTML='<defs>'+defs+'</defs><g id="art">'+body+'</g>';
      const g=document.getElementById('art');
      let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9,txt=0;
      const rec=(el)=>{
        if(el.tagName&&el.tagName.toLowerCase()==='text')txt++;
        if(el.getBBox&&el.tagName&&!['g','defs'].includes(el.tagName.toLowerCase())){
          try{const bb=el.getBBox();
            const swa=parseFloat(el.getAttribute('stroke-width')||0);
            const sh=(el.getAttribute('stroke')&&el.getAttribute('stroke')!=='none')?swa/2:0;
            if(bb.width||bb.height){x0=Math.min(x0,bb.x-sh);y0=Math.min(y0,bb.y-sh);x1=Math.max(x1,bb.x+bb.width+sh);y1=Math.max(y1,bb.y+bb.height+sh);}
          }catch(e){}
        }
        [...el.children].forEach(rec);
      };
      [...g.children].forEach(rec);
      return {x0,y0,x1,y1,txt};
    }, r.defs, r.body);
    const over=Math.max(bx[0]-res.x0, bx[1]-res.y0, res.x1-(bx[0]+bx[2]), res.y1-(bx[1]+bx[3]));
    if(over>worst){worst=over;worstDesc='box '+bx.join(',')+' seed '+s+' bbox '+[res.x0,res.y0,res.x1,res.y1].map(v=>v.toFixed(2)).join(',');}
    if(res.txt) console.log('TEXT FOUND', bx, s);
  }
}
console.log('worst overflow beyond box (incl. half-stroke):', worst.toFixed(3), 'px |', worstDesc);
await b.close();
})();
