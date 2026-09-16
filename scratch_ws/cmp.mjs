import { wall_schematic as A } from './fn2.mjs';
import { wall_schematic as B } from './fn3.mjs';
const P = {ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
function mk(seed){let t=seed>>>0;const rand=()=>{t+=0x6D2B79F5;let r=t;r=Math.imul(r^r>>>15,r|1);r^=r+Math.imul(r^r>>>7,r|61);return((r^r>>>14)>>>0)/4294967296;};
 return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
for (const [w,h] of [[400,864],[100,216],[280,600],[160,346],[560,200]]){
  const a=A(0,0,w,h,P,mk(1234),'t1'), b=B(0,0,w,h,P,mk(1234),'t1');
  console.log(w+'x'+h, 'identical to screenshotted version:', a.body===b.body && a.defs===b.defs);
}
for (const [w,h] of [[8,8],[400,20],[20,400],[1,900],[900,1],[3000,3000]]){
  console.log('guarded', w+'x'+h, 'body bytes', B(0,0,w,h,P,mk(2),'z').body.length);
}
