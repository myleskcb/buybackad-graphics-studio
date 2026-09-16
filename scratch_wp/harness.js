const fs = require('fs');
const path = require('path');
const FN = process.argv[2] || 'fn.js';
const { wall_poly } = require(path.join(__dirname, FN));

function mkR(seed) {
  let s = seed >>> 0;
  const rand = () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  return {
    f: (a, b) => a + (b - a) * rand(),
    i: (a, b) => Math.floor(a + (b - a + 1) * rand()),
    pick: a => a[Math.floor(rand() * a.length)],
    chance: p => rand() < p,
  };
}
const P = { ground:'#0E253C', ground2:'#1B3A5C', ink:'#D4DFEB', body:'#8FA6BE', accent:'#FCACA5', hot:'#7FD8C0', paper:'#F5F8FB', dark:'#050C18' };

// determinism check
const o1 = wall_poly(0,0,400,864,P,mkR(12345),'t1');
const o2 = wall_poly(0,0,400,864,P,mkR(12345),'t1');
const det = (o1.defs === o2.defs) && (o1.body === o2.body);
console.log('DETERMINISTIC:', det, 'bodyLen', o1.body.length);

// contract checks
const all = o1.defs + o1.body;
console.log('has <text>:', /<text[\s>]/.test(all));
console.log('has <svg>/<defs> in body:', /<svg[\s>]|<defs[\s>]/.test(o1.body));
console.log('has image/href:', /<image|href=|xlink/.test(all));
console.log('ids contain t1:', (all.match(/id="([^"]+)"/g)||[]));
// numbers with >1 decimal?
const bad = all.match(/-?\d+\.\d\d+/g);
console.log('numbers with >1dp:', bad ? bad.slice(0,10) : 'none');
// colours used
const cols = [...new Set((all.match(/(?:fill|stroke)="([^"]+)"/g)||[]))];
console.log('distinct fill/stroke count:', cols.length);
// bounds check on path coords
let minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9;
for (const mm of all.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)) {
  const X=+mm[1], Y=+mm[2];
  if(X<minX)minX=X; if(X>maxX)maxX=X; if(Y<minY)minY=Y; if(Y>maxY)maxY=Y;
}
console.log('coord bounds x:', minX, maxX, ' y:', minY, maxY);
console.log('paths:', (all.match(/<path/g)||[]).length);

function doc(o, W, H) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 400 864"><defs>${o.defs}</defs>${o.body}</svg>`;
}
fs.writeFileSync(path.join(__dirname,'out.svg'), doc(o1,400,864));
fs.writeFileSync(path.join(__dirname,'out_small.svg'), doc(o1,100,216));
// a few other seeds for variety
for (let s=1; s<=4; s++) fs.writeFileSync(path.join(__dirname,`out_s${s}.svg`), doc(wall_poly(0,0,400,864,P,mkR(s*7777),'t'+s),400,864));
// off-origin call to confirm it honours x,y
const o3 = wall_poly(40,60,200,300,P,mkR(999),'t3');
let mnX=1e9,mxX=-1e9,mnY=1e9,mxY=-1e9;
for (const mm of (o3.defs+o3.body).matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)) { const X=+mm[1],Y=+mm[2]; if(X<mnX)mnX=X; if(X>mxX)mxX=X; if(Y<mnY)mnY=Y; if(Y>mxY)mxY=Y; }
console.log('offset call bounds x:', mnX, mxX, '(want 40..240)  y:', mnY, mxY, '(want 60..360)');
