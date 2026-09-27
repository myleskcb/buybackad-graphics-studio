const puppeteer = require('/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core');
const path = require('path');
const D = '/Users/admin/Downloads/gfxv23/.scratch-frame-desktop';
const fn = require(path.join(D, process.argv[2] || 'fn.js'));
function mkR(seed){let s=seed>>>0;const r=()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};
 return {f:(a,b)=>a+(b-a)*r(), i:(a,b)=>Math.floor(a+(b-a+1)*r()), pick:a=>a[Math.floor(r()*a.length)], chance:p=>r()<p};}
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
const boxes=[[0,0,400,864],[0,0,400,300],[10,20,380,240],[0,0,300,300],[0,0,120,120],[0,0,100,60],[0,0,900,300],[0,0,60,400],[0,0,40,40],[0,0,200,1000]];

(async()=>{
 const br=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox'],headless:'new'});
 const pg=await br.newPage();
 let worst=0, worstDesc='', bad=0, total=0, empty=0;
 for(const [X,Y,W,H] of boxes){
  for(let s=0;s<40;s++){
   const r=fn(X,Y,W,H,P,mkR(1+s*104729),'k'+s);
   total++;
   if(!r || typeof r.defs!=='string' || typeof r.body!=='string'){ console.log('BAD SHAPE',X,Y,W,H,s); bad++; continue; }
   if(!r.body){ empty++; continue; }
   if(/NaN|undefined|Infinity/.test(r.defs+r.body)){ console.log('NaN',W,H,s); bad++; }
   const pad=200;
   const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W+2*pad}" height="${H+2*pad}" viewBox="${X-pad} ${Y-pad} ${W+2*pad} ${H+2*pad}"><defs>${r.defs}</defs><g id="probe">${r.body}</g></svg>`;
   await pg.setContent(`<body style="margin:0">${svg}</body>`);
   const m=await pg.evaluate(()=>{
     let mnx=1e9,mny=1e9,mxx=-1e9,mxy=-1e9;
     document.querySelectorAll('#probe rect,#probe path,#probe circle,#probe polygon').forEach(el=>{
       let bb; try{bb=el.getBBox();}catch(e){return;}
       if(!isFinite(bb.x)) return;
       const sw=parseFloat(getComputedStyle(el).strokeWidth)||0;
       const st=el.getAttribute('stroke'); const pad=(st&&st!=='none')?sw/2:0;
       // clipped elements: intersect with clip rect is ignored -> conservative
       mnx=Math.min(mnx,bb.x-pad); mny=Math.min(mny,bb.y-pad);
       mxx=Math.max(mxx,bb.x+bb.width+pad); mxy=Math.max(mxy,bb.y+bb.height+pad);
     });
     return {mnx,mny,mxx,mxy};
   });
   const over=Math.max(X-m.mnx, Y-m.mny, m.mxx-(X+W), m.mxy-(Y+H));
   if(over>worst){worst=over; worstDesc=`box ${W}x${H} at ${X},${Y} seed#${s}  bbox=[${m.mnx.toFixed(2)},${m.mny.toFixed(2)} -> ${m.mxx.toFixed(2)},${m.mxy.toFixed(2)}]`;}
  }
 }
 console.log('cases:',total,'bad:',bad,'empty:',empty);
 console.log('WORST OVERFLOW (px beyond box, conservative: clipped shapes counted unclipped):', worst.toFixed(3));
 console.log(worstDesc);
 await br.close();
})().catch(e=>{console.error(e);process.exit(1);});
