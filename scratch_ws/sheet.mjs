import { writeFileSync } from 'node:fs';
import { wall_schematic as FN } from './fn.mjs';
const P = {ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
function mk(seed){let t=seed>>>0;const rand=()=>{t+=0x6D2B79F5;let r=t;r=Math.imul(r^r>>>15,r|1);r^=r+Math.imul(r^r>>>7,r|61);return((r^r>>>14)>>>0)/4294967296;};
 return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
// 6 tall panels, different seeds
let defs='',body='';
const seeds=[1234,2,3,4,5,6];
seeds.forEach((sd,i)=>{
  const r=FN(20+i*200, 20, 160, 346, P, mk(sd), 'q'+i);
  defs+=r.defs; body+=r.body;
});
// wide boxes to exercise the w>h branches
[7,8].forEach((sd,i)=>{
  const r=FN(20+i*580, 400, 560, 200, P, mk(sd), 'wq'+i);
  defs+=r.defs; body+=r.body;
});
writeFileSync('/Users/admin/Downloads/gfxv23/scratch_ws/sheet.svg',
 `<svg xmlns="http://www.w3.org/2000/svg" width="1220" height="640" viewBox="0 0 1220 640"><rect width="1220" height="640" fill="#F5F8FB"/><defs>${defs}</defs>${body}</svg>`);
console.log('ok');
