const fs = require('fs');
const fn = require('/Users/admin/Downloads/gfxv23/.scratch-frame-phone/fn.js');

function mkR(seed){
  let s = seed >>> 0;
  const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  return {
    f:(a,b)=>a+(b-a)*rand(),
    i:(a,b)=>Math.floor(a+(b-a+1)*rand()),
    pick:a=>a[Math.floor(rand()*a.length)],
    chance:p=>rand()<p
  };
}
const P = {ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};

const W=400,H=864;
const a = fn(0,0,W,H,P,mkR(12345),'t1');
const b = fn(0,0,W,H,P,mkR(12345),'t1');
const det = (a.defs===b.defs && a.body===b.body);
console.log('DETERMINISTIC:', det);
console.log('defs len', a.defs.length, 'body len', a.body.length);

function doc(r, bg){
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">'+
    '<defs>'+r.defs+'</defs>'+
    '<rect width="'+W+'" height="'+H+'" fill="'+bg+'"/>'+
    r.body+'</svg>';
}
fs.writeFileSync('/Users/admin/Downloads/gfxv23/.scratch-frame-phone/out.svg', doc(a, P.ground));
// second doc: bright paper background + red box outline, to see any spill outside the box
const spill = '<svg xmlns="http://www.w3.org/2000/svg" width="'+(W+80)+'" height="'+(H+80)+'" viewBox="-40 -40 '+(W+80)+' '+(H+80)+'">'+
  '<defs>'+a.defs+'</defs>'+
  '<rect x="-40" y="-40" width="'+(W+80)+'" height="'+(H+80)+'" fill="#FF00FF"/>'+
  '<rect x="0" y="0" width="'+W+'" height="'+H+'" fill="'+P.paper+'"/>'+
  a.body+
  '<rect x="0" y="0" width="'+W+'" height="'+H+'" fill="none" stroke="#00FF00" stroke-width="1"/></svg>';
fs.writeFileSync('/Users/admin/Downloads/gfxv23/.scratch-frame-phone/spill.svg', spill);
fs.writeFileSync('/Users/admin/Downloads/gfxv23/.scratch-frame-phone/body.txt', a.defs+'\n\n'+a.body.replace(/></g,'>\n<'));

// numeric extent check by parsing rect/circle/path coords
let maxX=-1e9,minX=1e9,maxY=-1e9,minY=1e9;
const rects=[...a.body.matchAll(/<rect ([^>]*)\/>/g)];
for(const m of rects){
  const at=Object.fromEntries([...m[1].matchAll(/(\w[\w-]*)="([^"]*)"/g)].map(k=>[k[1],k[2]]));
  const sw=parseFloat(at['stroke-width']||0)/2;
  const X=parseFloat(at.x),Y=parseFloat(at.y),Wd=parseFloat(at.width),Ht=parseFloat(at.height);
  minX=Math.min(minX,X-sw);minY=Math.min(minY,Y-sw);maxX=Math.max(maxX,X+Wd+sw);maxY=Math.max(maxY,Y+Ht+sw);
}
console.log('rect extents x:',minX.toFixed(2),'->',maxX.toFixed(2),' y:',minY.toFixed(2),'->',maxY.toFixed(2));
console.log('box is 0,0 ->',W,H);
