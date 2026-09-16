const fs=require('fs');
const fn=require('/Users/admin/Downloads/gfxv23/.scratch-frame-phone/fn_fixed.js');
function mkR(seed){let s=seed>>>0;const rand=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};return{f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
// contact sheet: 6 boxes of varied shape, each outlined in magenta
const boxes=[[20,20,180,389],[240,20,220,220],[500,20,120,389],[660,20,180,300],[20,440,300,140],[360,440,140,302],[540,440,100,216],[680,440,60,130]];
let defs='',body='';
boxes.forEach((b,i)=>{const r=fn(b[0],b[1],b[2],b[3],P,mkR(1000+i*13),'s'+i);defs+=r.defs;
 body+='<rect x="'+b[0]+'" y="'+b[1]+'" width="'+b[2]+'" height="'+b[3]+'" fill="#F5F8FB"/>'+r.body+
 '<rect x="'+b[0]+'" y="'+b[1]+'" width="'+b[2]+'" height="'+b[3]+'" fill="none" stroke="#FF00FF" stroke-width="0.6"/>';});
fs.writeFileSync('/Users/admin/Downloads/gfxv23/.scratch-frame-phone/sheet.svg',
 '<svg xmlns="http://www.w3.org/2000/svg" width="880" height="800" viewBox="0 0 880 800"><defs>'+defs+'</defs><rect width="880" height="800" fill="#0E253C"/>'+body+'</svg>');
console.log('sheet written');
