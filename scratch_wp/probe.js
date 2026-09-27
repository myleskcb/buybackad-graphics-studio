// replicate the band maths exactly, counting which base index each triangle lands on
function mkR(seed){let s=(seed>>>0)||1;const rand=()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};
 return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const k=3;
let cardsMissing=0, tot=0, globalHist=[0,0,0];
for (let s=1;s<=400;s++){
  const R=mkR(s*2654435761);
  const gx=R.f(-1,1), gy=R.f(-1,1), gn=Math.abs(gx)+Math.abs(gy)+1e-6;
  const hist=[0,0,0];
  // sample the rect densely (centroids of triangles ~ uniform over the rect)
  for(let a=0;a<40;a++)for(let b=0;b<40;b++){
    const fx=(a+.5)/40, fy=(b+.5)/40;
    const u=fx*gx+fy*gy;
    const band=(u+gn)/(2*gn);
    let i=Math.floor(band*k+R.f(-.34,.34));
    i=Math.max(0,Math.min(k-1,i));
    hist[i]++; globalHist[i]++; tot++;
  }
  const zero=hist.filter(v=>v===0).length;
  const tiny=hist.filter(v=>v/1600<0.02).length;
  if(tiny>0) cardsMissing++;
  if(s<=6) console.log('seed',s,'gx',gx.toFixed(2),'gy',gy.toFixed(2),'index share', hist.map(v=>(100*v/1600).toFixed(0)+'%').join(' '));
}
console.log('cards where >=1 of the 3 ramp slots is under 2% of the wall:', cardsMissing, '/400');
console.log('overall index share:', globalHist.map(v=>(100*v/tot).toFixed(1)+'%').join(' '));
