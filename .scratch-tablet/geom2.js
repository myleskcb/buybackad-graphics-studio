const fn=require(process.env.FNPATH||'./fn.js');
function mkR(seed){let s=seed>>>0;const rand=()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};
 return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
const at=(t,k)=>{const m=t.match(new RegExp(k+'="([-\\d.]+)"'));return m?parseFloat(m[1]):null;};
function elems(svg){return (svg.match(/<(rect|circle|polygon)\b[^>]*>/g)||[]).map(t=>{
  const sw=/stroke="(?!none)/.test(t)?(at(t,'stroke-width')||1)/2:0; let l,tp,r,b;
  if(t.startsWith('<rect')){l=at(t,'x');tp=at(t,'y');r=l+at(t,'width');b=tp+at(t,'height');}
  else if(t.startsWith('<circle')){const cx=at(t,'cx'),cy=at(t,'cy'),rr=at(t,'r');l=cx-rr;r=cx+rr;tp=cy-rr;b=cy+rr;}
  else{const p=t.match(/points="([^"]+)"/)[1].trim().split(/\s+/).map(s=>s.split(',').map(Number));
       l=Math.min(...p.map(q=>q[0]));r=Math.max(...p.map(q=>q[0]));tp=Math.min(...p.map(q=>q[1]));b=Math.max(...p.map(q=>q[1]));}
  return {t,l:l-sw,tp:tp-sw,r:r+sw,b:b+sw};});}
const buckets={};
let worstBy={};
const R0=mkR(777);
for(let k=0;k<6000;k++){
  const x=R0.f(-500,500), y=R0.f(-500,500);
  const w=R0.chance(0.25)?R0.f(2.01,12):R0.f(12,900);
  const h=R0.chance(0.25)?R0.f(2.01,12):R0.f(12,900);
  const r=fn(x,y,w,h,P,mkR(1+k),'g'+k); if(!r.body) continue;
  const small=Math.min(w,h)<12;
  elems(r.body).forEach(e=>{
    const over=Math.max(x-e.l,y-e.tp,e.r-(x+w),e.b-(y+h));
    if(over<=1e-9) return;
    const kind=(e.t.match(/^<(\w+)/)[1])+(e.t.includes('class="screen"')?'.screen':'')+(e.t.includes('stroke-opacity="0.28"')||e.t.includes('stroke-opacity="0.16"')&&e.t.includes('fill="none"')?'.apron':'');
    const key=(small?'SMALL ':'NORMAL ')+kind;
    buckets[key]=(buckets[key]||0)+1;
    if(!worstBy[key]||over>worstBy[key].over) worstBy[key]={over,box:w.toFixed(2)+'x'+h.toFixed(2),t:e.t.slice(0,120)};
  });
}
Object.keys(worstBy).sort().forEach(k=>console.log(k.padEnd(22), 'n='+String(buckets[k]).padEnd(6), 'worst='+worstBy[k].over.toFixed(4), 'box='+worstBy[k].box));
console.log('\nworst offenders:');
Object.keys(worstBy).sort((a,b)=>worstBy[b].over-worstBy[a].over).slice(0,3).forEach(k=>console.log(' ',k,worstBy[k].t));
