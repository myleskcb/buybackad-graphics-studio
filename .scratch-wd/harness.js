const fs = require('fs');
const fn = require('/Users/admin/Downloads/gfxv23/.scratch-wd/fn.js');

function mkR(seed) {
  let s = seed >>> 0;
  const rand = () => { // mulberry32
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    f: (a, b) => a + (b - a) * rand(),
    i: (a, b) => Math.floor(a + (b - a + 1) * rand()),
    pick: a => a[Math.floor(rand() * a.length)],
    chance: p => rand() < p
  };
}

const P = { ground:'#0E253C', ground2:'#1B3A5C', ink:'#D4DFEB', body:'#8FA6BE', accent:'#FCACA5', hot:'#7FD8C0', paper:'#F5F8FB', dark:'#050C18' };

const W = 400, H = 864;

// 1. determinism: same seed twice
const a = fn(0,0,W,H,P,mkR(1234),'t1');
const b = fn(0,0,W,H,P,mkR(1234),'t1');
const same = a.defs === b.defs && a.body === b.body;
console.log('DETERMINISTIC:', same);
if (!same) { console.log('A.defs', a.defs); console.log('B.defs', b.defs); console.log('A.body', a.body); console.log('B.body', b.body); }

// checks on output text
console.log('has <text>:', /<text[\s>]/.test(a.defs + a.body));
console.log('has <svg>/<defs> wrapper:', /<svg|<defs/.test(a.defs + a.body));
console.log('has image/href:', /<image|href=|data:/.test(a.defs + a.body));
const ids = (a.defs + a.body).match(/id="([^"]+)"/g) || [];
console.log('ids:', ids.join(' '), '-> all contain t1:', ids.every(s => s.includes('t1')));
// numbers to 1dp
const nums = (a.defs + a.body).match(/(?:x|y|width|height)="(-?[\d.]+)"/g) || [];
const bad = nums.filter(s => { const v = s.split('"')[1]; return !/^-?\d+\.\d$/.test(v); });
console.log('numbers not 1dp:', bad.length ? bad.join(' ') : 'none');
// colours used
const fills = [...new Set(((a.defs + a.body).match(/(?:fill|stop-color)="([^"]+)"/g) || []).map(s=>s.split('"')[1]))];
console.log('fills used:', fills.join(' '));

fs.writeFileSync('/Users/admin/Downloads/gfxv23/.scratch-wd/out.txt', a.defs + '\n----\n' + a.body);

function doc(seed, id) {
  const r = fn(0,0,W,H,P,mkR(seed),id);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${r.defs}</defs>${r.body}</svg>`;
}
fs.writeFileSync('/Users/admin/Downloads/gfxv23/.scratch-wd/card.svg', doc(1234,'t1'));

// a grid of variants, drawn in a sub-box to test that it honours x/y/w/h offsets
let cells = '', defsAll = '';
const CW = 200, CH = 432, COLS = 5, ROWS = 2, PAD = 14;
for (let r = 0; r < ROWS; r++) for (let cI = 0; cI < COLS; cI++) {
  const idx = r*COLS + cI;
  const X = PAD + cI*(CW+PAD), Y = PAD + r*(CH+PAD);
  const res = fn(X, Y, CW, CH, P, mkR(100+idx), 'v'+idx);
  defsAll += res.defs;
  cells += `<rect x="${X-4}" y="${Y-4}" width="${CW+8}" height="${CH+8}" fill="none" stroke="#ff00ff" stroke-width="1"/>` + res.body;
}
const GW = PAD + COLS*(CW+PAD), GH = PAD + ROWS*(CH+PAD);
fs.writeFileSync('/Users/admin/Downloads/gfxv23/.scratch-wd/grid.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" width="${GW}" height="${GH}" viewBox="0 0 ${GW} ${GH}"><rect width="${GW}" height="${GH}" fill="#7a7a7a"/><defs>${defsAll}</defs>${cells}</svg>`);

// bleed test: draw into a sub-box on a bright background, count pixels outside later
const BX = 60, BY = 120, BW = 280, BH = 620;
const rb = fn(BX, BY, BW, BH, P, mkR(77), 'bleed');
fs.writeFileSync('/Users/admin/Downloads/gfxv23/.scratch-wd/bleed.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#00FF00"/><defs>${rb.defs}</defs>${rb.body}</svg>`);
console.log('wrote svgs');
