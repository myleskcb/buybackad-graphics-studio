const fs = require('fs');
const path = require('path');
const fn = require(process.argv[2] || './fn.js');

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

const W = 400, H = 864;
const a = fn(0, 0, W, H, P, mkR(12345), 't1');
const b = fn(0, 0, W, H, P, mkR(12345), 't1');
const same = a.defs === b.defs && a.body === b.body;
console.log('DETERMINISTIC:', same);
if (!same) {
  console.log('--A defs--\n' + a.defs + '\n--B defs--\n' + b.defs);
  console.log('--A body--\n' + a.body + '\n--B body--\n' + b.body);
}
console.log('defs len', a.defs.length, 'body len', a.body.length);
console.log('has <text>:', /<text/i.test(a.body + a.defs));
console.log('has href/image:', /(xlink:href|href=|<image)/i.test(a.body + a.defs));
const ids = [...(a.defs.matchAll(/id="([^"]+)"/g))].map(m => m[1]);
console.log('ids:', ids.join(','), 'all contain t1:', ids.every(i => i.includes('t1')));
const nums = [...(a.body+a.defs).matchAll(/="(-?\d+\.\d{2,})"/g)].map(m=>m[1]);
console.log('numbers with >1 decimal (attr):', JSON.stringify(nums.slice(0,20)));

// margin doc: draw on a magenta page bigger than the box so overflow is visible
function doc(res, w, h, pad, scale) {
  const vw = w + pad * 2, vh = h + pad * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${(vw*scale).toFixed(0)}" height="${(vh*scale).toFixed(0)}" viewBox="${-pad} ${-pad} ${vw} ${vh}">`
    + `<rect x="${-pad}" y="${-pad}" width="${vw}" height="${vh}" fill="#FF00FF"/>`
    + `<defs>${res.defs}</defs>${res.body}</svg>`;
}
function plain(res, w, h, scale) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${(w*scale).toFixed(1)}" height="${(h*scale).toFixed(1)}" viewBox="0 0 ${w} ${h}">`
    + `<defs>${res.defs}</defs>${res.body}</svg>`;
}
const dir = __dirname;
fs.writeFileSync(path.join(dir, 'big.svg'), plain(a, W, H, 1));
fs.writeFileSync(path.join(dir, 'bleed.svg'), doc(a, W, H, 40, 1));
fs.writeFileSync(path.join(dir, 'small.svg'), plain(a, W, H, 100 / W));

// variants grid with different seeds
let grid = `<svg xmlns="http://www.w3.org/2000/svg" width="${6*210}" height="${470}" viewBox="0 0 ${6*210} 470"><rect width="100%" height="100%" fill="#FF00FF"/>`;
for (let i = 0; i < 6; i++) {
  const r = fn(10 + i * 210, 10, 190, 450, P, mkR(1000 + i * 7717), 'v' + i);
  grid += `<defs>${r.defs}</defs>${r.body}`;
}
grid += '</svg>';
fs.writeFileSync(path.join(dir, 'grid.svg'), grid);
console.log('files written');
