const fn=require('/Users/admin/Downloads/gfxv23/.scratch-wd/fn.js');
function mkR(seed){let s=seed>>>0;const rand=()=>{s|=0;s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};
return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
const hex=c=>c.replace('#','').toLowerCase();
const rgb=c=>{const s=hex(c);return [parseInt(s.slice(0,2),16),parseInt(s.slice(2,4),16),parseInt(s.slice(4,6),16)];};
const pal=Object.values(P).map(c=>hex(c));
function onSegment(c){ // is c an interpolation of two palette colours?
  const C=rgb(c);
  for(let i=0;i<pal.length;i++)for(let j=0;j<pal.length;j++){
    const A=rgb('#'+pal[i]),B=rgb('#'+pal[j]);
    for(let t=0;t<=100;t++){const u=t/100;
      if(Math.abs(A[0]+(B[0]-A[0])*u-C[0])<=1.5&&Math.abs(A[1]+(B[1]-A[1])*u-C[1])<=1.5&&Math.abs(A[2]+(B[2]-A[2])*u-C[2])<=1.5) return true;}
  }
  return false;
}
const dist=(a,b)=>{const A=rgb(a),B=rgb(b);const dr=(A[0]-B[0])/255,dg=(A[1]-B[1])/255,db=(A[2]-B[2])/255;return Math.sqrt((2*dr*dr+4*dg*dg+3*db*db)/9);};
let outside=new Set(), minContrast=9, worst=null, bands=[], nstats={};
for(let seed=1;seed<=600;seed++){
  const r=fn(0,0,400,864,P,mkR(seed),'s'+seed);
  const s=r.defs+r.body;
  const cols=[...new Set((s.match(/(?:fill|stop-color)="(#[0-9a-f]{6})"/g)||[]).map(t=>t.split('"')[1]))];
  for(const c of cols) if(!pal.includes(hex(c))&&!onSegment(c)) outside.add(c);
  const ground=(r.defs.match(/stop offset="0" stop-color="(#[0-9a-f]{6})"/)||[])[1];
  const stripes=(r.body.match(/fill="(#[0-9a-f]{6})"/g)||[]).map(t=>t.split('"')[1]);
  for(const st of stripes){const d=dist(st,ground); if(d<minContrast){minContrast=d;worst=[seed,st,ground];}}
  nstats[stripes.length]=(nstats[stripes.length]||0)+1;
  // total band thickness vs card
  const hs=(r.body.match(/height="([\d.]+)"/g)||[]).map(t=>+t.split('"')[1]).filter(v=>v!==864);
  bands.push(hs.reduce((a,b)=>a+b,0));
}
console.log('non-palette colours:', outside.size?[...outside].join(' '):'none');
console.log('min stripe-vs-ground distance:', minContrast.toFixed(3), worst);
console.log('stripe counts:', JSON.stringify(nstats));
bands.sort((a,b)=>a-b);
console.log('band thickness min/med/max:', bands[0].toFixed(1), bands[300].toFixed(1), bands[bands.length-1].toFixed(1));
