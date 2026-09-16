const fs = require('fs');
const path = require('path');
const fn = require('/Users/admin/Downloads/gfxv23/scratch_wf/fn.js');

const P = {ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};

function mk(seed){
  let t = seed >>> 0;
  const rand = () => { t += 0x6D2B79F5; let z = t; z = Math.imul(z ^ z>>>15, z|1); z ^= z + Math.imul(z ^ z>>>7, z|61); return ((z ^ z>>>14) >>> 0) / 4294967296; };
  return { f:(a,b)=>a+(b-a)*rand(), i:(a,b)=>Math.floor(a+(b-a+1)*rand()), pick:a=>a[Math.floor(rand()*a.length)], chance:p=>rand()<p };
}

function doc(res, x,y,w,h, bg){
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="'+x+' '+y+' '+w+' '+h+'">'
    + '<defs>'+res.defs+'</defs>'
    + '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+(bg||P.ground)+'"/>'
    + res.body + '</svg>';
}

// 1. determinism: same seed twice, byte identical
let detFail = 0;
for (let s=1; s<=400; s++){
  const a = fn(0,0,400,864,P,mk(s),'t1');
  const b = fn(0,0,400,864,P,mk(s),'t1');
  if (JSON.stringify(a) !== JSON.stringify(b)) { detFail++; console.log('DET FAIL seed', s); }
}
console.log('determinism over 400 seeds:', detFail===0 ? 'IDENTICAL' : detFail+' failures');

// 2. crash sweep over many seeds and geometries, plus degenerate palettes
const geos = [[0,0,400,864],[12.5,30,90,195],[0,0,864,400],[5,5,100,100],[0,0,60,900],[200,300,333,111]];
const pals = [P,
  {ground:'#0E253C',ground2:'#0E253C',ink:'#0E253C',body:'#0E253C',accent:'#0E253C',hot:'#0E253C',paper:'#0E253C',dark:'#0E253C'},
  {ground:'#111111',ground2:'#121212',ink:'#131313',body:'#141414',accent:'#151515',hot:'#161616',paper:'#171717',dark:'#181818'},
  {ground:null,ground2:'x',ink:'#fff',body:'#000',accent:undefined,hot:'#abc',paper:'#123456',dark:'#654321'}];
let crash = 0, ids = 0, badnum = 0, textUse=0, extUse=0;
for (const pal of pals) for (const g of geos) for (let s=1; s<=250; s++){
  try {
    const r = fn(g[0],g[1],g[2],g[3],pal,mk(s),'k'+s);
    const all = r.defs + r.body;
    if (/<text|<image|data:|href=|xlink:/.test(all)) { textUse++; }
    // every id must contain the id token
    const declared = [...all.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
    for (const dcl of declared) if (dcl.indexOf('k'+s) < 0) { ids++; console.log('BAD ID', dcl); }
    if (/NaN|Infinity|undefined|null/.test(all)) { badnum++; if(badnum<4) console.log('BAD NUM/VAL', pal===pals[3]?'p3':'p?', g.join(','), s, all.slice(0,300)); }
    if (/<svg|<defs/.test(r.body)) console.log('WRAPPER IN BODY');
  } catch(e){ crash++; if (crash<4) console.log('CRASH', g.join(','), s, e.message); }
}
console.log('crashes:', crash, ' bad ids:', ids, ' NaN/undefined:', badnum, ' text/img/href:', textUse);

// 3. geometry: does any *drawn primitive* extend outside the box (pre-clip)?
let outside = 0, clipped = 0, coreCross = 0;
for (let s=1; s<=2000; s++){
  const r = fn(0,0,400,864,P,mk(s),'t1');
  if (r.body.indexOf('clip-path="url(#t1c)"') < 0) clipped++;
  const m = r.body.match(/<circle cx="([-\d.]+)" cy="([-\d.]+)" r="([\d.]+)"/);
  if (m){
    const cx=+m[1], cy=+m[2], rr=+m[3];
    if (cx-rr < -0.01 || cx+rr > 400.01 || cy-rr < -0.01 || cy+rr > 864.01) outside++;
    // hard edge must not enter the vertical middle 60% (0.2h .. 0.8h)
    const top = cy-rr, bot = cy+rr;
    if (bot > 864*0.2 && top < 864*0.8) coreCross++;
  }
}
console.log('circles geometrically outside box (pre-clip):', outside, '/2000');
console.log('bodies missing the clip group:', clipped);
console.log('hard discs entering vertical middle 60%:', coreCross, '/2000');

// 4. write out sample SVGs
const outDir = '/Users/admin/Downloads/gfxv23/scratch_wf';
const main = fn(0,0,400,864,P,mk(7),'t1');
fs.writeFileSync(path.join(outDir,'one.svg'), doc(main,0,0,400,864));
console.log('\n--- seed 7 defs+body ---\n' + main.defs + '\n' + main.body);

// grid of 24 seeds at card size
let g1 = '';
for (let s=0; s<24; s++){
  const col = s%8, row = (s/8)|0;
  const X = col*130+10, Y = row*290+10;
  const r = fn(X,Y,120,270,P,mk(s+1),'q'+s);
  g1 += '<defs>'+r.defs+'</defs>'+r.body;
}
fs.writeFileSync(path.join(outDir,'grid.svg'),
  '<svg xmlns="http://www.w3.org/2000/svg" width="1060" height="880" viewBox="0 0 1060 880"><rect width="1060" height="880" fill="'+P.ground+'"/>'+g1+'</svg>');

// small: 100px wide, same aspect
const sm = fn(0,0,100,216,P,mk(7),'t1');
fs.writeFileSync(path.join(outDir,'small.svg'), doc(sm,0,0,100,216));

// small grid, 12 seeds at 100x216
let g2 = '';
for (let s=0; s<12; s++){
  const col = s%6, row=(s/6)|0;
  const X = col*110+8, Y = row*226+8;
  const r = fn(X,Y,100,216,P,mk(s+1),'m'+s);
  g2 += '<defs>'+r.defs+'</defs>'+r.body;
}
fs.writeFileSync(path.join(outDir,'smallgrid.svg'),
  '<svg xmlns="http://www.w3.org/2000/svg" width="668" height="468" viewBox="0 0 668 468"><rect width="668" height="468" fill="'+P.ground+'"/>'+g2+'</svg>');

// landscape
const ls = fn(0,0,864,400,P,mk(3),'l1');
fs.writeFileSync(path.join(outDir,'wide.svg'), doc(ls,0,0,864,400));

// out-of-box probe: draw into an offset box on a huge canvas, red backdrop shows leaks
const ob = fn(150,150,400,864,P,mk(7),'z1');
fs.writeFileSync(path.join(outDir,'probe.svg'),
 '<svg xmlns="http://www.w3.org/2000/svg" width="700" height="1164" viewBox="0 0 700 1164"><rect width="700" height="1164" fill="#FF00FF"/><defs>'+ob.defs+'</defs>'+ob.body+'</svg>');
console.log('svgs written');
