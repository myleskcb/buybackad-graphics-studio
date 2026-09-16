import crypto from 'crypto';
const mod=await import(process.argv[2]);
const fn=mod.wall_hills;
function mkR(seed){let s=seed>>>0||1;const rand=()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};
 return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
let h=crypto.createHash('sha256');
for(let k=0;k<200;k++){const r=fn(0,0,400,864,P,mkR(12345+k),'t1');h.update(r.defs+'|'+r.body+'\n');}
console.log(h.digest('hex'));
const a=fn(0,0,400,864,P,mkR(12345),'t1'), b=fn(0,0,400,864,P,mkR(12345),'t1');
console.log('twice-identical:', a.defs===b.defs && a.body===b.body);
