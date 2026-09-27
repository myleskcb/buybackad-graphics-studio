const fs = require('fs');
const fn = require('/Users/admin/Downloads/gfxv23/scratch_wb/fn.js');

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function mkR(seed){const rand=mulberry32(seed);return{f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}

const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
const W=400,H=864;

function doc(o,bg){return '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'"><defs>'+o.defs+'</defs><rect width="'+W+'" height="'+H+'" fill="'+(bg||'#FF00FF')+'"/>'+o.body+'</svg>';}

// determinism: same seed twice
const a=fn(0,0,W,H,P,mkR(12345),'t1');
const b=fn(0,0,W,H,P,mkR(12345),'t1');
console.log('DETERMINISTIC:', JSON.stringify(a)===JSON.stringify(b));

// variation sanity: different seed differs
const c=fn(0,0,W,H,P,mkR(999),'t1');
console.log('VARIES:', JSON.stringify(a)!==JSON.stringify(c));

// contract checks
const all=a.defs+a.body;
console.log('has <text>:', /<text/.test(all));
console.log('has <svg> or <defs> in body:', /<svg|<defs/.test(a.body));
console.log('ids all contain t1:', (all.match(/id="[^"]+"/g)||[]).every(s=>s.includes('t1')), (all.match(/id="[^"]+"/g)||[]));
console.log('external refs:', /href|url\(http|data:/.test(all));
// decimals
const bad=(all.match(/-?\d+\.\d{2,}/g)||[]);
console.log('numbers with >1 decimal:', bad.length, bad.slice(0,10));
// geometry inside box
let out=[];
const re=/<rect x="([-\d.]+)" y="([-\d.]+)" width="([-\d.]+)" height="([-\d.]+)"/g;let m;
while((m=re.exec(all))){const X=+m[1],Y=+m[2],Ww=+m[3],Hh=+m[4];
 if(X< -0.001||Y< -0.001||X+Ww>W+0.001||Y+Hh>H+0.001||Ww<0||Hh<0) out.push(m[0]);}
console.log('rects outside box:', out.length, out.slice(0,5));
// coverage: do band edges tile the box without gaps? check unique fills count
console.log('rect count:', (a.body.match(/<rect/g)||[]).length);
console.log('bytes:', all.length);

// multi-seed stress
let issues=0;
for(let s=1;s<=200;s++){
  const o=fn(0,0,W,H,P,mkR(s),'x'+s);
  const t=o.defs+o.body;
  if(/NaN|undefined|Infinity/.test(t)){console.log('BAD OUTPUT seed',s, t.slice(0,200));issues++;}
  const rr=/<rect x="([-\d.]+)" y="([-\d.]+)" width="([-\d.]+)" height="([-\d.]+)"/g;let mm;
  while((mm=rr.exec(t))){const X=+mm[1],Y=+mm[2],Ww=+mm[3],Hh=+mm[4];
    if(X<-0.001||Y<-0.001||X+Ww>W+0.001||Y+Hh>H+0.001||Ww<=0||Hh<0){console.log('OOB seed',s,mm[0]);issues++;}}
  // opacity sanity
  (t.match(/opacity="([-\d.]+)"/g)||[]).forEach(p=>{const v=+p.match(/[-\d.]+/)[0]; if(!(v>=0&&v<=1)){console.log('bad opacity seed',s,p);issues++;}});
  // color sanity
  (t.match(/(fill|stop-color)="#[0-9a-fA-F]*"/g)||[]).forEach(p=>{ if(!/#[0-9a-f]{6}"/i.test(p)){console.log('bad color seed',s,p);issues++;} });
  // also non-zero size at odd boxes
}
console.log('stress issues:', issues);

// odd geometry: small/offset boxes
[[10,20,60,40],[0,0,100,20],[200,700,199.7,163.3],[5,5,12,900]].forEach(g=>{
  const o=fn(g[0],g[1],g[2],g[3],P,mkR(7),'g'+g.join('_'));
  const t=o.defs+o.body;
  const rr=/<rect x="([-\d.]+)" y="([-\d.]+)" width="([-\d.]+)" height="([-\d.]+)"/g;let mm,bad2=0;
  while((mm=rr.exec(t))){const X=+mm[1],Y=+mm[2],Ww=+mm[3],Hh=+mm[4];
    if(X<g[0]-0.06||Y<g[1]-0.06||X+Ww>g[0]+g[2]+0.06||Y+Hh>g[1]+g[3]+0.06||Hh<0){bad2++;if(bad2<3)console.log('  oob',g,mm[0]);}}
  console.log('box',g.join(','),'oob rects:',bad2,'NaN:',/NaN/.test(t));
});

fs.writeFileSync('/Users/admin/Downloads/gfxv23/scratch_wb/card.svg', doc(a));
// a few variants sheet
let sheet='<svg xmlns="http://www.w3.org/2000/svg" width="'+(6*210)+'" height="'+(H*0.5+20)+'" viewBox="0 0 '+(6*210)+' '+(H*0.5+20)+'"><defs>';
let bodies='';
for(let s=0;s<6;s++){const o=fn(10+s*210,10,190,H*0.5-10,P,mkR(100+s),'v'+s);sheet+=o.defs;bodies+=o.body;}
sheet+='</defs><rect width="100%" height="100%" fill="#222"/>'+bodies+'</svg>';
fs.writeFileSync('/Users/admin/Downloads/gfxv23/scratch_wb/sheet.svg', sheet);
console.log('wrote svgs');
