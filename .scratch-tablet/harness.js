const fs = require('fs');
const fn = require('/Users/admin/Downloads/gfxv23/.scratch-tablet/fn.js');
const D = '/Users/admin/Downloads/gfxv23/.scratch-tablet/';

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

// ---- determinism: same seed twice
const a = fn(0,0,400,864,P,mkR(12345),'t1');
const b = fn(0,0,400,864,P,mkR(12345),'t1');
const identical = (a.defs === b.defs) && (a.body === b.body);
console.log('DETERMINISTIC:', identical);
if (!identical) { console.log('A.defs',a.defs); console.log('B.defs',b.defs); }

function doc(res, W, H, bg) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 400 864">'
    + '<rect width="400" height="864" fill="'+bg+'"/>'
    + '<defs>' + res.defs + '</defs>' + res.body
    + '<rect x="0.5" y="0.5" width="399" height="863" fill="none" stroke="#FF00FF" stroke-width="1" stroke-dasharray="6 4"/>'
    + '</svg>';
}
fs.writeFileSync(D+'big.svg', doc(a, 400, 864, P.ground));
fs.writeFileSync(D+'small.svg', doc(a, 100, 216, P.ground));
// no magenta guide version, for honest look
function clean(res, W, H) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 400 864">'
    + '<rect width="400" height="864" fill="'+P.ground+'"/>'
    + '<defs>' + res.defs + '</defs>' + res.body + '</svg>';
}
fs.writeFileSync(D+'clean400.svg', clean(a,400,864));
fs.writeFileSync(D+'clean100.svg', clean(a,100,216));

// ---- several seeds for variation, as a contact sheet
let sheet = '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="520" viewBox="0 0 1200 520"><rect width="1200" height="520" fill="'+P.ground+'"/>';
let sd='', sb='';
const boxes = [[10,10,180,400,'portrait'],[210,10,380,240,'landscape'],[610,10,240,240,'square'],[870,10,60,120,'tiny'],[950,10,230,80,'wide strip'],[950,110,40,300,'thin col']];
boxes.forEach((bx,k)=>{
  const r = fn(bx[0],bx[1],bx[2],bx[3],P,mkR(1000+k*77),'s'+k);
  sd += r.defs; sb += r.body;
  sb += '<rect x="'+bx[0]+'" y="'+bx[1]+'" width="'+bx[2]+'" height="'+bx[3]+'" fill="none" stroke="#FF00FF" stroke-width="0.6" stroke-dasharray="4 3"/>';
});
sheet += '<defs>'+sd+'</defs>'+sb+'</svg>';
fs.writeFileSync(D+'sheet.svg', sheet);

// ---- bounds check: parse every numeric coordinate-ish shape and compare to box
console.log('LEN defs', a.defs.length, 'body', a.body.length);
console.log('has <text>:', /<text/i.test(a.body+a.defs));
console.log('id in every def id:', (a.defs.match(/id="([^"]+)"/g)||[]).every(s=>s.includes('t1')));
console.log(a.body.slice(0,400));
