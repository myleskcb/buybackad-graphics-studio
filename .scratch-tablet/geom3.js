const fn=require(process.env.FNPATH||'./fn.js');
function mkR(seed){let s=seed>>>0;const rand=()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};
 return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
function attrs(tag){const o={};let m,re=/([a-zA-Z-]+)="([^"]*)"/g;while((m=re.exec(tag)))o[m[1]]=m[2];return o;}
function extents(tag){
  const a=attrs(tag), name=tag.match(/^<(\w+)/)[1];
  const sw=(a.stroke&&a.stroke!=='none')?parseFloat(a['stroke-width']||1)/2:0;
  let l,t,r,b;
  if(name==='rect'){l=+a.x;t=+a.y;r=l+ +a.width;b=t+ +a.height;}
  else if(name==='circle'){l=+a.cx-+a.r;r=+a.cx+ +a.r;t=+a.cy-+a.r;b=+a.cy+ +a.r;}
  else if(name==='polygon'){const p=a.points.trim().split(/\s+/).map(s=>s.split(',').map(Number));
    l=Math.min(...p.map(q=>q[0]));r=Math.max(...p.map(q=>q[0]));t=Math.min(...p.map(q=>q[1]));b=Math.max(...p.map(q=>q[1]));}
  else return null;
  if(![l,t,r,b,sw].every(isFinite)) return {bad:true,tag};
  return {l:l-sw,t:t-sw,r:r+sw,b:b+sw,tag};
}
let fails=[],tested=0,nonfinite=0,maxOver=0;
const R0=mkR(777);
for(let k=0;k<8000;k++){
  const x=R0.f(-500,500), y=R0.f(-500,500);
  const w=R0.chance(0.25)?R0.f(2.01,12):R0.f(12,900);
  const h=R0.chance(0.25)?R0.f(2.01,12):R0.f(12,900);
  const res=fn(x,y,w,h,P,mkR(1+k),'g'+k); if(!res.body) continue; tested++;
  if(/NaN|Infinity|undefined/.test(res.body+res.defs)){nonfinite++;continue;}
  const tags=(res.body+res.defs).match(/<(rect|circle|polygon)\b[^>]*>/g)||[];
  for(const tg of tags){
    const e=extents(tg); if(!e){continue;} if(e.bad){nonfinite++;continue;}
    const over=Math.max(x-e.l,y-e.t,e.r-(x+w),e.b-(y+h));
    if(over>1e-9){ if(over>maxOver){maxOver=over;} fails.push({over,box:w.toFixed(2)+'x'+h.toFixed(2),tag:tg.slice(0,110)}); }
  }
}
fails.sort((a,b)=>b.over-a.over);
console.log('boxes tested:',tested,' non-finite outputs:',nonfinite);
console.log('elements outside box:',fails.length,' worst overshoot:',maxOver.toFixed(4),'user units');
fails.slice(0,4).forEach(f=>console.log('  '+f.over.toFixed(4)+'  box '+f.box+'  '+f.tag));
console.log('overshoot >0.30u:',fails.filter(f=>f.over>0.3).length,'  >0.15u:',fails.filter(f=>f.over>0.15).length);
