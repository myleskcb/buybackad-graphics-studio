import { writeFileSync } from 'node:fs';
import { wall_schematic as FN } from './fn.mjs';

const NAME = 'wall_schematic';
const P = {ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};

function mk(seed){
  let t = seed >>> 0;
  const rand = () => { t += 0x6D2B79F5; let r = t; r = Math.imul(r ^ r>>>15, r|1); r ^= r + Math.imul(r ^ r>>>7, r|61); return ((r ^ r>>>14)>>>0)/4294967296; };
  return { f:(a,b)=>a+(b-a)*rand(), i:(a,b)=>Math.floor(a+(b-a+1)*rand()), pick:a=>a[Math.floor(rand()*a.length)], chance:p=>rand()<p };
}

function doc(res, w, h, outW){
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${outW||w}" height="${Math.round((outW||w)*h/w)}" viewBox="0 0 ${w} ${h}">`
    + `<defs>${res.defs}</defs>${res.body}</svg>`;
}

// --- determinism: same seed twice ---
const a = FN(0,0,400,864,P,mk(1234),'t1');
const b = FN(0,0,400,864,P,mk(1234),'t1');
const same = a.defs===b.defs && a.body===b.body;
console.log('DETERMINISTIC(same seed, 2 calls):', same);
console.log('len defs/body:', a.defs.length, a.body.length);

// different seeds should differ (variation sanity)
const c = FN(0,0,400,864,P,mk(9),'t1');
console.log('varies with seed:', c.body!==a.body);

// id containment
const allIds = [...a.defs.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
console.log('ids:', allIds, 'all contain id:', allIds.every(i=>i.includes('t1')));
console.log('no <text>:', !/<text|<image|data:/.test(a.body+a.defs));
console.log('no <svg>/<defs> in body:', !/<svg|<defs/.test(a.body));

// --- geometry bounds check (ignoring the clip) ---
function bounds(body){
  let minx=1e9,miny=1e9,maxx=-1e9,maxy=-1e9, worst=null;
  const upd=(x0,y0,x1,y1,tag)=>{
    if(x0<minx)minx=x0; if(y0<miny)miny=y0; if(x1>maxx)maxx=x1; if(y1>maxy)maxy=y1;
  };
  for(const m of body.matchAll(/<rect ([^>]*)\/>/g)){
    const at=Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(k=>[k[1],k[2]]));
    const sw = at['stroke']? parseFloat(at['stroke-width']||0)/2 : 0;
    upd(+at.x-sw, +at.y-sw, +at.x+ +at.width+sw, +at.y+ +at.height+sw);
  }
  for(const m of body.matchAll(/<circle ([^>]*)\/>/g)){
    const at=Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(k=>[k[1],k[2]]));
    const sw = at['stroke']? parseFloat(at['stroke-width']||0)/2 : 0;
    const r=+at.r+sw; upd(+at.cx-r,+at.cy-r,+at.cx+r,+at.cy+r);
  }
  for(const m of body.matchAll(/<path d="M([^"]*)"([^>]*)\/>/g)){
    const at=Object.fromEntries([...m[2].matchAll(/([\w-]+)="([^"]*)"/g)].map(k=>[k[1],k[2]]));
    const sw = parseFloat(at['stroke-width']||0)/2;
    for(const seg of m[1].split('L')){ const [px,py]=seg.trim().split(/\s+/).map(Number); upd(px-sw,py-sw,px+sw,py+sw); }
  }
  return {minx,miny,maxx,maxy};
}
for(const seed of [1234,9,77,4242,31337]){
  const r = FN(0,0,400,864,P,mk(seed),'t1');
  const bb = bounds(r.body);
  const out = bb.minx< -0.05 || bb.miny< -0.05 || bb.maxx>400.05 || bb.maxy>864.05;
  console.log('seed',seed,'bbox', JSON.stringify(bb), out?'*** OUTSIDE BOX ***':'inside');
}

// --- write svg docs ---
writeFileSync('/Users/admin/Downloads/gfxv23/scratch_ws/big.svg', doc(a,400,864));
writeFileSync('/Users/admin/Downloads/gfxv23/scratch_ws/small_scaled.svg', doc(a,400,864,100));
const sm = FN(0,0,100,216,P,mk(1234),'t2');
writeFileSync('/Users/admin/Downloads/gfxv23/scratch_ws/small_native.svg', doc(sm,100,216));
// offset test: draw inside a sub-rect of a bigger canvas
const off = FN(60,80,280,600,P,mk(5),'t3');
writeFileSync('/Users/admin/Downloads/gfxv23/scratch_ws/offset.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="864" viewBox="0 0 400 864"><rect width="400" height="864" fill="#F5F8FB"/><defs>${off.defs}</defs>${off.body}<rect x="60" y="80" width="280" height="600" fill="none" stroke="#FF00FF" stroke-width="1"/></svg>`);
const bbo = bounds(off.body);
console.log('offset bbox', JSON.stringify(bbo), (bbo.minx< 59.95||bbo.miny<79.95||bbo.maxx>340.05||bbo.maxy>680.05)?'*** OUTSIDE ***':'inside');
console.log('OK');
