const fn=require('/Users/admin/Downloads/gfxv23/.scratch-wd/fn.js');
function mkR(seed){let s=seed>>>0;const rand=()=>{s|=0;s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};
return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
const rgb=c=>{const s=c.replace('#','');return [parseInt(s.slice(0,2),16),parseInt(s.slice(2,4),16),parseInt(s.slice(4,6),16)];};
const dist=(a,b)=>{const A=rgb(a),B=rgb(b);const dr=(A[0]-B[0])/255,dg=(A[1]-B[1])/255,db=(A[2]-B[2])/255;return Math.sqrt((2*dr*dr+4*dg*dg+3*db*db)/9);};
const lum=c=>{const a=rgb(c);return (0.2126*a[0]+0.7152*a[1]+0.0722*a[2])/255;};
const uniq=Object.values(P).map(c=>c.toLowerCase());
console.log('by lum:', uniq.slice().sort((a,b)=>lum(a)-lum(b)).join(' '));
// pairwise distances
for(const g of ['#d4dfeb','#f5f8fb','#0e253c','#050c18']){
  const row=uniq.filter(c=>c!==g).map(c=>c+':'+dist(c,g).toFixed(2));
  console.log('from',g,row.join('  '));
}
let hits=0, groundsHit={};
for(let seed=1;seed<=600;seed++){
  const r=fn(0,0,400,864,P,mkR(seed),'s'+seed);
  const ground=(r.defs.match(/stop offset="0" stop-color="(#[0-9a-f]{6})"/)||[])[1];
  const st=(r.body.match(/fill="(#[0-9a-f]{6})"/g)||[]).map(t=>t.split('"')[1]);
  const n=st.filter(c=>c===ground).length;
  if(n){hits++; groundsHit[ground]=(groundsHit[ground]||0)+1;}
  if(seed===1) console.log('seed1 ground',ground,'stripes',st.join(' '));
}
console.log('seeds with ground-coloured stripe:',hits,'/600', JSON.stringify(groundsHit));
