const fs=require('fs');
const fn=require('/Users/admin/Downloads/gfxv23/.scratch-wd/fn.js');
function mkR(seed){let s=seed>>>0;const rand=()=>{s|=0;s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};
return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
const idx=Number(process.argv[2]||3);
const CW=200,CH=432,COLS=5,PAD=14;
const r=Math.floor(idx/COLS), c=idx%COLS;
const X=PAD+c*(CW+PAD), Y=PAD+r*(CH+PAD);
const res=fn(X,Y,CW,CH,P,mkR(100+idx),'v'+idx);
console.log('cell',idx,'box',X,Y,CW,CH);
console.log(res.body.replace(/></g,'>\n<'));
// isolated doc translated so the box sits at 0,0
fs.writeFileSync('/Users/admin/Downloads/gfxv23/.scratch-wd/one.svg',
 `<svg xmlns="http://www.w3.org/2000/svg" width="${CW}" height="${CH}" viewBox="${X} ${Y} ${CW} ${CH}"><defs>${res.defs}</defs>${res.body}</svg>`);
