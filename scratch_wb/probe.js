const fn=require('/Users/admin/Downloads/gfxv23/scratch_wb/fn.js');const fs=require('fs');
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function mkR(s){const r=mulberry32(s);return{f:(a,b)=>a+(b-a)*r(),i:(a,b)=>Math.floor(a+(b-a+1)*r()),pick:a=>a[Math.floor(r()*a.length)],chance:p=>r()<p};}
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
// replicate the colour decision to find seeds where LT===DKX (light c1 branch)
function toRGB(c){var s=String(c).replace('#','');var n=parseInt(s.slice(0,6),16);return[(n>>16)&255,(n>>8)&255,n&255];}
function lum(c){var A=toRGB(c);return (A[0]*.299+A[1]*.587+A[2]*.114)/255;}
const G=P.ground,G2=P.ground2,BD=P.body,AC=P.accent,HO=P.hot,PA=P.paper,DK=P.dark;
const tris=[[DK,AC,HO],[G,AC,PA],[HO,G2,DK],[DK,HO,PA],[G2,HO,DK],[PA,AC,DK],[DK,AC,PA],[G,HO,PA],[G2,AC,DK],[DK,BD,HO],[PA,HO,G],[DK,G2,AC]];
let lightC1=[],darkC1=[];
for(let s=1;s<=400;s++){
  const R=mkR(s); const tri=R.pick(tris).slice(0); let t2=tri; if(R.chance(0.5)) t2=[tri[2],tri[1],tri[0]];
  let c0=t2[0],c1=t2[1],c2=t2[2];
  if(Math.abs(lum(c0)-lum(c2))<0.20) c2 = lum(c0)>0.5?DK:PA;
  if(Math.abs(lum(c1)-lum(c0))<0.14 && Math.abs(lum(c1)-lum(c2))<0.14) c1 = lum(c0)>0.5?HO:AC;
  (lum(c1)>0.55?lightC1:darkC1).push(s);
}
console.log('light-c1 seeds (LT===DKX===dark):',lightC1.slice(0,8),'count',lightC1.length,'of 400');
console.log('dark-c1 seeds count',darkC1.length);
// how many distinct fills in a light-c1 card vs dark-c1 card
function stats(seed){const o=fn(0,0,400,864,P,mkR(seed),'s'+seed);const f=(o.body.match(/fill="#[0-9a-f]{6}"/g)||[]);return {seed,rects:f.length,uniq:new Set(f).size};}
if(lightC1.length) console.log('light-c1 sample stats',stats(lightC1[0]),stats(lightC1[1]||lightC1[0]));
console.log('dark-c1 sample stats',stats(darkC1[0]));
// short/wide boxes -> zero-height bands skipped?
[[0,0,400,20],[0,0,400,40],[0,0,400,864]].forEach(g=>{
  const o=fn(g[0],g[1],g[2],g[3],P,mkR(3),'z'+g[3]);
  const heights=[...o.body.matchAll(/height="([\d.]+)"/g)].map(m=>+m[1]);
  console.log('h='+g[3],'bandrects',heights.length,'zero-h',heights.filter(v=>v===0).length,'min',Math.min(...heights));
});
// write light-c1 card + short card for visual
if(lightC1.length){const o=fn(0,0,400,864,P,mkR(lightC1[0]),'lc');
 fs.writeFileSync('/Users/admin/Downloads/gfxv23/scratch_wb/light.svg','<svg xmlns="http://www.w3.org/2000/svg" width="400" height="864" viewBox="0 0 400 864"><defs>'+o.defs+'</defs><rect width="400" height="864" fill="#FF00FF"/>'+o.body+'</svg>');}
const o2=fn(20,20,360,60,P,mkR(3),'sh');
fs.writeFileSync('/Users/admin/Downloads/gfxv23/scratch_wb/short.svg','<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100" viewBox="0 0 400 100"><defs>'+o2.defs+'</defs><rect width="400" height="100" fill="#FF00FF"/>'+o2.body+'</svg>');
