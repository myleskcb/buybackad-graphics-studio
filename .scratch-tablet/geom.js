const fn=require(process.env.FNPATH||'./fn.js');
function mkR(seed){let s=seed>>>0;const rand=()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};
 return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
const at=(t,k)=>{const m=t.match(new RegExp(k+'="([-\\d.]+)"'));return m?parseFloat(m[1]):null;};
// exact extents of every emitted element, stroke half-width included
function extents(svg){
  let L=Infinity,T=Infinity,Rr=-Infinity,B=-Infinity,bad=[];
  (svg.match(/<(rect|circle|polygon)\b[^>]*>/g)||[]).forEach(t=>{
    const sw=/stroke="(?!none)/.test(t)?(at(t,'stroke-width')||1)/2:0;
    let l,tp,r,b;
    if(t.startsWith('<rect')){ l=at(t,'x'); tp=at(t,'y'); r=l+at(t,'width'); b=tp+at(t,'height'); }
    else if(t.startsWith('<circle')){ const cx=at(t,'cx'),cy=at(t,'cy'),rr=at(t,'r'); l=cx-rr;r=cx+rr;tp=cy-rr;b=cy+rr; }
    else { const pts=t.match(/points="([^"]+)"/)[1].trim().split(/\s+/).map(s=>s.split(',').map(Number));
           l=Math.min(...pts.map(p=>p[0]));r=Math.max(...pts.map(p=>p[0]));tp=Math.min(...pts.map(p=>p[1]));b=Math.max(...pts.map(p=>p[1])); }
    if([l,tp,r,b].some(v=>!isFinite(v))) bad.push('NON-FINITE: '+t);
    L=Math.min(L,l-sw);T=Math.min(T,tp-sw);Rr=Math.max(Rr,r+sw);B=Math.max(B,b+sw);
  });
  return {L,T,R:Rr,B,bad};
}
let worst=0,fails=0,tested=0,nonfinite=0,clipNote=0;
const R0=mkR(777);
for(let k=0;k<4000;k++){
  const x=R0.f(-500,500), y=R0.f(-500,500);
  const w=R0.chance(0.25)?R0.f(2.01,12):R0.f(12,900);
  const h=R0.chance(0.25)?R0.f(2.01,12):R0.f(12,900);
  const r=fn(x,y,w,h,P,mkR(1+k),'g'+k);
  if(!r.body){continue;}
  tested++;
  if(/NaN|Infinity|undefined|null/.test(r.body+r.defs)){nonfinite++;console.log('BAD OUTPUT',w.toFixed(2),h.toFixed(2));}
  const e=extents(r.body);
  if(e.bad.length){nonfinite++;console.log(e.bad[0]);}
  const over=Math.max(x-e.L, y-e.T, e.R-(x+w), e.B-(y+h));
  if(over>1e-6){fails++; if(over>worst){worst=over;console.log('over',over.toFixed(4),'box',w.toFixed(2)+'x'+h.toFixed(2));}}
}
console.log('geometric check: tested',tested,'boxes; out-of-box',fails,'worst overshoot',worst.toFixed(4),'units; non-finite',nonfinite);
