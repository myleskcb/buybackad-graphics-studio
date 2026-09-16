const fn = require('/Users/admin/Downloads/gfxv23/scratch_wf/fn.js');
const P = {ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
function mk(seed){let t=seed>>>0;const rand=()=>{t+=0x6D2B79F5;let z=t;z=Math.imul(z^z>>>15,z|1);z^=z+Math.imul(z^z>>>7,z|61);return((z^z>>>14)>>>0)/4294967296;};
 return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
let bad=0;
for(let s=1;s<=3000;s++){
  const r=fn(0,0,400,864,P,mk(s),'t');
  const txt=r.defs+r.body;
  // real coordinate attributes only (word boundary, not part of stop-opacity / y1 / y2)
  for(const m of txt.matchAll(/(?:^|[\s"])(x|y|cx|cy|r|width|height)="(-?[\d.]+)"/g)){
    const dec=(m[2].split('.')[1]||'').length; if(dec>1){bad++; if(bad<5)console.log('coord >1dp',m[1],m[2]);}
  }
  const rg=r.defs.match(/<radialGradient[^]*?<\/radialGradient>/)[0];
  const offs=[...rg.matchAll(/offset="([\d.]+)"/g)].map(m=>parseFloat(m[1]));
  for(let i=1;i<offs.length;i++) if(offs[i]<offs[i-1]){bad++;console.log('stops out of order',offs);}
  for(const m of txt.matchAll(/opacity="([\d.]+)"/g)){const v=+m[1]; if(!(v>=0&&v<=1)){bad++;console.log('opacity range',m[0]);}}
  if(!/^<g clip-path="url\(#tc\)">/.test(r.body) || !/<\/g>$/.test(r.body)){bad++;console.log('clip wrapper missing');}
}
console.log('real numeric/structure violations over 3000 seeds:', bad);
