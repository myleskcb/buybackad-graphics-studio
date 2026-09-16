const path=require('path');
const { wall_poly } = require(path.join(__dirname, process.argv[2]||'fn.js'));
function mkR(seed){let s=(seed>>>0)||1;const rand=()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};
 return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
const Pdup={ground:'#0E253C',ground2:'#0E253C',ink:'#FFFFFF',body:'#FFFFFF',accent:'#FFFFFF',hot:'#FFFFFF',paper:'#FFFFFF',dark:'#0E253C'};
const Pshort={ground:'#111111',ground2:'#111111',ink:'#111111',body:'#111111',accent:'#111111',hot:'#111111',paper:'#111111',dark:'#111111'};
const P3={ground:'#0E253C',ground2:'#000000',ink:'#888888',body:'#888888',accent:'#888888',hot:'#888888',paper:'#FFFFFF',dark:'#000000'};
const sizes=[[400,864],[400,120],[1200,200],[60,900],[300,300],[900,60],[100,100],[40,40],[2000,80],[80,2000]];
const rgb=c=>{let s=String(c||'#000').replace('#','');if(s.length===3)s=s[0]+s[0]+s[1]+s[1]+s[2]+s[2];const n=parseInt(s,16)||0;return[(n>>16)&255,(n>>8)&255,n&255];};
const lum=c=>{const p=rgb(c);return (p[0]*.2126+p[1]*.7152+p[2]*.0722)/255;};
let fails=[], worst=null, triCounts=[];
for (const [pn,PP] of [['main',P],['dup',Pdup],['mono',Pshort],['three',P3]]) {
for (const [w,h] of sizes) {
  for (let s=1; s<=120; s++) {
    let o; const t0=Date.now();
    try { o = wall_poly(10, 20, w, h, PP, mkR(s*2654435761), 'id'+s); }
    catch(e){ fails.push(`${pn} ${w}x${h} seed${s} THREW ${e.message}`); continue; }
    const all=o.defs+o.body;
    if (/NaN|undefined|Infinity/.test(all)) { fails.push(`${pn} ${w}x${h} seed${s} NaN/undef in output`); continue; }
    let mnX=1e9,mxX=-1e9,mnY=1e9,mxY=-1e9,n=0;
    for (const mm of all.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)){const X=+mm[1],Y=+mm[2];if(X<mnX)mnX=X;if(X>mxX)mxX=X;if(Y<mnY)mnY=Y;if(Y>mxY)mxY=Y;n++;}
    const eps=0.06;
    if (mnX<10-eps||mxX>10+w+eps||mnY<20-eps||mxY>20+h+eps) fails.push(`${pn} ${w}x${h} seed${s} OUT OF BOX x[${mnX},${mxX}] y[${mnY},${mxY}]`);
    const tris=(all.match(/<path/g)||[]).length; triCounts.push(tris);
    if (tris<10) fails.push(`${pn} ${w}x${h} seed${s} only ${tris} triangles`);
    // luminance spread actually used
    const cols=[...(all.matchAll(/fill="(#[0-9a-f]{6})"/g))].map(m=>lum(m[1]));
    const spread = Math.max(...cols)-Math.min(...cols);
    if (pn==='main' && (worst===null || spread<worst.spread)) worst={pn,w,h,s,spread:+spread.toFixed(3)};
    if (Date.now()-t0>1500) fails.push(`${pn} ${w}x${h} seed${s} SLOW ${Date.now()-t0}ms`);
  }
}}
console.log('fails:', fails.length); fails.slice(0,15).forEach(x=>console.log('  ',x));
console.log('tri count min/max:', Math.min(...triCounts), Math.max(...triCounts));
console.log('worst luminance spread on main palette:', JSON.stringify(worst));
