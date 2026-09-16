const fn = require(process.argv[2] || './fn.js');
function mkR(seed){let s=seed>>>0||1;const rand=()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};
 return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
const pals=[
 ['normal',P],
 ['mono', {ground:'#111111',ground2:'#111111',ink:'#111111',body:'#111111',accent:'#111111',hot:'#111111',paper:'#111111',dark:'#111111'}],
 ['two',  {ground:'#000000',ground2:'#000000',ink:'#FFFFFF',body:'#FFFFFF',accent:'#FFFFFF',hot:'#FFFFFF',paper:'#FFFFFF',dark:'#000000'}],
 ['light',{ground:'#FFFFFF',ground2:'#F2EFE6',ink:'#22201C',body:'#5A564E',accent:'#C8452F',hot:'#E8B33A',paper:'#FBF9F4',dark:'#0B0A08'}],
 ['short',{ground:'#012',ground2:'#345',ink:'#eef',body:'#89a',accent:'#f66',hot:'#6f9',paper:'#fff',dark:'#001'}],
 ['grey', {ground:'#808080',ground2:'#8A8A8A',ink:'#909090',body:'#7A7A7A',accent:'#858585',hot:'#7F7F7F',paper:'#888888',dark:'#818181'}],
 ['onlyground',{ground:'#0E253C',ground2:'#0E253C',ink:'#0E253C',body:'#0E253C',accent:'#0E253C',hot:'#0E253C',paper:'#0E253C',dark:'#0E253C'}],
];
const boxes=[[0,0,400,864],[12.5,33.7,190,450],[100,200,90,90],[0,0,900,120],[5,5,40,700],[0,0,3,3]];
let n=0, bad=[];
for(const [pn,pal] of pals) for(const [x,y,w,h] of boxes) for(let s=1;s<=120;s++){
  let r; try{ r=fn(x,y,w,h,pal,mkR(s*2654435761),'i'+s);}catch(e){bad.push(pn+' box'+w+'x'+h+' seed'+s+' THREW '+e.message); continue;}
  n++;
  if(typeof r!=='object'||typeof r.defs!=='string'||typeof r.body!=='string'){bad.push(pn+' seed'+s+' bad shape');continue;}
  const all=r.defs+r.body;
  if(/<text|<image|xlink:href|data:|<svg|<defs/i.test(all)) bad.push(pn+' seed'+s+' forbidden markup');
  if(/undefined|NaN|Infinity/.test(all)) bad.push(pn+' box'+w+'x'+h+' seed'+s+' has NaN/undefined: '+all.slice(0,200));
  const ids=[...r.defs.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);
  const uid='i'+s;
  for(const i of ids) if(!i.includes(uid)) bad.push(pn+' seed'+s+' id lacks uid: '+i);
  if(new Set(ids).size!==ids.length) bad.push(pn+' seed'+s+' duplicate ids');
  // referenced ids must be defined
  for(const m of all.matchAll(/url\(#([^)]+)\)/g)) if(!ids.includes(m[1])) bad.push(pn+' seed'+s+' dangling ref '+m[1]);
  // determinism
  const r2=fn(x,y,w,h,pal,mkR(s*2654435761),'i'+s);
  if(r2.defs!==r.defs||r2.body!==r.body) bad.push(pn+' seed'+s+' NONDETERMINISTIC');
  // coordinate decimals
  for(const m of all.matchAll(/(?:^|[ "])(?:cx|cy|rx|ry|x|y|width|height|stdDeviation)="(-?[\d.]+)"/g)){
    const v=m[1]; if(v.includes('.')&&v.split('.')[1].length>1) bad.push(pn+' seed'+s+' >1dp coord '+v);
  }
}
console.log('cases', n, 'problems', bad.length);
console.log([...new Set(bad)].slice(0,30).join('\n'));
