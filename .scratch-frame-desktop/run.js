const fs = require('fs');
const path = require('path');
const D = '/Users/admin/Downloads/gfxv23/.scratch-frame-desktop';
const fn = require(path.join(D, process.argv[2] || 'fn.js'));

function mkR(seed) {
  let s = seed >>> 0;
  const rand = () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  return {
    f: (a, b) => a + (b - a) * rand(),
    i: (a, b) => Math.floor(a + (b - a + 1) * rand()),
    pick: a => a[Math.floor(rand() * a.length)],
    chance: p => rand() < p
  };
}
const P = { ground:'#0E253C', ground2:'#1B3A5C', ink:'#D4DFEB', body:'#8FA6BE', accent:'#FCACA5', hot:'#7FD8C0', paper:'#F5F8FB', dark:'#050C18' };

const X=0, Y=0, W=400, H=864;

// determinism: same seed twice
const a = fn(X,Y,W,H,P,mkR(20260906),'t1');
const b = fn(X,Y,W,H,P,mkR(20260906),'t1');
const same = (a.defs===b.defs && a.body===b.body);
console.log('DETERMINISTIC:', same);
if (!same) {
  console.log('defs equal:', a.defs===b.defs, 'body equal:', a.body===b.body);
}

// sanity: text / image / svg wrapper / defs leakage
const all = a.defs + a.body;
console.log('has <text>:', /<text[\s>]/.test(all));
console.log('has image/href:', /<image|xlink:href|href=|data:/.test(all));
console.log('body has <defs>:', /<defs/.test(a.body));
console.log('id in every id=:', (all.match(/id="([^"]+)"/g)||[]).every(s=>s.includes('t1')), (all.match(/id="([^"]+)"/g)||[]));
console.log('NaN/undefined:', /NaN|undefined|Infinity/.test(all));
console.log('bytes:', all.length);

// how many decimals appear
const decs = (all.match(/\d+\.\d+/g)||[]).map(s=>s.split('.')[1].length);
console.log('max decimals:', Math.max(...decs), 'counts>1:', decs.filter(d=>d>1).length);

// render helper
function doc(scale, bg) {
  const vw = W, vh = H;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${vw}" height="${vh}" viewBox="0 0 ${vw} ${vh}">
<defs>${a.defs}</defs>
<rect x="0" y="0" width="${vw}" height="${vh}" fill="${bg||P.ground}"/>
${a.body}
<rect x="0.5" y="0.5" width="${vw-1}" height="${vh-1}" fill="none" stroke="#FF00FF" stroke-width="1" stroke-dasharray="6 4"/>
</svg>`;
}
fs.writeFileSync(path.join(D,'out.svg'), doc());
// version with NO box guide, for the clean look
fs.writeFileSync(path.join(D,'clean.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>${a.defs}</defs><rect width="${W}" height="${H}" fill="${P.ground}"/>${a.body}</svg>`);

// several seeds, tiled, to see variation
let tiles='';
for (let k=0;k<4;k++){
  const r = fn(X,Y,W,H,P,mkR(1000+k*7777),'s'+k);
  tiles += `<g transform="translate(${k*(W+16)},0)"><defs>${r.defs}</defs><rect width="${W}" height="${H}" fill="${P.ground}"/>${r.body}<rect x="0.5" y="0.5" width="${W-1}" height="${H-1}" fill="none" stroke="#FF00FF" stroke-width="1"/></g>`;
}
fs.writeFileSync(path.join(D,'grid.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="${4*(W+16)}" height="${H}" viewBox="0 0 ${4*(W+16)} ${H}"><rect width="100%" height="100%" fill="#222"/>${tiles}</svg>`);
console.log('wrote svgs');
