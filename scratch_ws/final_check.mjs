import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const src = readFileSync('/Users/admin/Downloads/gfxv23/scratch_ws/final.txt','utf8').trim();
// compiles as a standalone declaration, in strict mode, from the exact returned text
const FN = new Function('"use strict";' + src + '; return wall_schematic;')();
const P = {ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
function mk(seed){let t=seed>>>0;const rand=()=>{t+=0x6D2B79F5;let r=t;r=Math.imul(r^r>>>15,r|1);r^=r+Math.imul(r^r>>>7,r|61);return((r^r>>>14)>>>0)/4294967296;};
 return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
console.log('starts with declaration:', /^function wall_schematic\(x, y, w, h, P, R, id\) \{/.test(src), '| no Math.random:', !/Math\.random/.test(src), '| no fences:', !src.includes('```'));
// byte-identical across repeated calls, many seeds
let allSame = true;
for (const sd of [1234,1,2,3,4,5,6,7,8,99,1000,31337]){
  const a = FN(0,0,400,864,P,mk(sd),'t1'), b = FN(0,0,400,864,P,mk(sd),'t1');
  if (a.defs!==b.defs || a.body!==b.body) { allSame=false; console.log('MISMATCH seed',sd); }
}
console.log('byte-identical for same seed across 12 seeds:', allSame);
const h1 = createHash('sha1').update(JSON.stringify(FN(0,0,400,864,P,mk(1234),'t1'))).digest('hex');
const h2 = createHash('sha1').update(JSON.stringify(FN(0,0,400,864,P,mk(1234),'t1'))).digest('hex');
console.log('sha1 call1', h1, '\nsha1 call2', h2, '| equal:', h1===h2);
// number formatting: every coordinate at most 1 decimal
const r = FN(0,0,400,864,P,mk(1234),'t1');
const nums = (r.defs+r.body).match(/-?\d+\.\d+/g)||[];
console.log('all numbers <=1dp:', nums.every(n=>n.split('.')[1].length<=1), '| count', nums.length);
// unique-id discipline: two instances on one canvas must not share ids
const q1 = FN(0,0,200,400,P,mk(3),'aa'), q2 = FN(200,0,200,400,P,mk(3),'bb');
const idsOf = s => [...s.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
console.log('ids A/B:', idsOf(q1.defs), idsOf(q2.defs), '| disjoint:', idsOf(q1.defs).every(i=>!idsOf(q2.defs).includes(i)));
// tiny + extreme boxes must not throw or loop
for (const [w,h] of [[8,8],[400,20],[20,400],[1,900],[900,1],[3000,3000]]){
  const t=Date.now(); const o=FN(0,0,w,h,P,mk(2),'z'); 
  console.log('size',w,'x',h,'ok len',o.body.length,'ms',Date.now()-t);
}
// palette discipline: only palette hexes appear
const used = [...new Set((r.defs+r.body).match(/#[0-9A-Fa-f]{3,6}/g))];
console.log('colours used:', used, '| all from palette:', used.every(c=>Object.values(P).includes(c)));
