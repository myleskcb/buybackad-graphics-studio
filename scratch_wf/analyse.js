const fn = require('/Users/admin/Downloads/gfxv23/scratch_wf/fn.js');
const P = {ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
function mk(seed){let t=seed>>>0;const rand=()=>{t+=0x6D2B79F5;let z=t;z=Math.imul(z^z>>>15,z|1);z^=z+Math.imul(z^z>>>7,z|61);return((z^z>>>14)>>>0)/4294967296;};
 return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const name = h => Object.keys(P).find(k=>String(P[k]).toLowerCase()===String(h).toLowerCase()) || h;

// landscape hard-edge containment: outer fifth of WIDTH
let W=864,H=400,cross=0,out=0;
for(let s=1;s<=2000;s++){
  const r=fn(0,0,W,H,P,mk(s),'l');
  const m=r.body.match(/<circle cx="([-\d.]+)" cy="([-\d.]+)" r="([\d.]+)"/);
  if(!m)continue; const cx=+m[1],cy=+m[2],rr=+m[3];
  if(cx-rr>W*0.2 && cx+rr<W*0.8) cross++;               // fully inside middle 60%
  if(cx+rr>W*0.2 && cx-rr<W*0.8) out++;                 // touches middle 60% at all
}
console.log('landscape: hard disc touching middle 60% of width:', out, '/2000  (fully inside:',cross,')');

// role distribution of field + mark over 3000 seeds
const fc={},gc={},shapes={soft:0,hard:0};
for(let s=1;s<=3000;s++){
  const r=fn(0,0,400,864,P,mk(s),'t');
  const base=r.body.match(/fill="(#[0-9A-Fa-f]{6})"\/><rect/)[1];
  const glow=r.defs.match(/stop-color="(#[0-9A-Fa-f]{6})"/)[1];
  fc[name(base)]=(fc[name(base)]||0)+1; gc[name(glow)]=(gc[name(glow)]||0)+1;
  if(/<circle/.test(r.body)) shapes.hard++; else shapes.soft++;
}
console.log('field colour counts:',fc);
console.log('mark colour counts:',gc);
console.log('hard disc vs soft pool:',shapes);

// ground never used as the field?
console.log('field ever = ground?', !!fc['ground']);

// output size
const one=fn(0,0,400,864,P,mk(7),'t1');
console.log('bytes defs+body:',(one.defs+one.body).length);

// numeric sanity: all coords 1dp, all opacities <=2dp, stops ascending
let bad=0;
for(let s=1;s<=3000;s++){
  const r=fn(0,0,400,864,P,mk(s),'t');
  const txt=r.defs+r.body;
  for(const m of txt.matchAll(/(?:x|y|cx|cy|r|width|height)="(-?[\d.]+)"/g)){
    const dec=(m[1].split('.')[1]||'').length; if(dec>1){bad++;console.log('coord >1dp',m[0]);}
  }
  const offs=[...r.defs.matchAll(/<radialGradient[^]*?<\/radialGradient>/g)][0][0].match(/offset="([\d.]+)"/g).map(o=>parseFloat(o.slice(8)));
  for(let i=1;i<offs.length;i++) if(offs[i]<offs[i-1]){bad++;console.log('stops out of order',offs);}
  for(const m of txt.matchAll(/opacity="([\d.]+)"/g)){const v=+m[1]; if(v<0||v>1){bad++;console.log('opacity out of range',m[0]);}}
}
console.log('numeric violations:',bad);
