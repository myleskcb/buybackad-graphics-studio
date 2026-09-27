import fs from 'fs';
import path from 'path';
const dir = '/Users/admin/Downloads/gfxv23/scratch_wh';
const mod = await import(process.argv[2] || (dir + '/fn.mjs'));
const fn = mod.wall_hills;

export function mkR(seed) {
  let s = seed >>> 0 || 1;
  const rand = () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  return {
    f: (a, b) => a + (b - a) * rand(),
    i: (a, b) => Math.floor(a + (b - a + 1) * rand()),
    pick: a => a[Math.floor(rand() * a.length)],
    chance: p => rand() < p,
  };
}
const P = { ground:'#0E253C', ground2:'#1B3A5C', ink:'#D4DFEB', body:'#8FA6BE', accent:'#FCACA5', hot:'#7FD8C0', paper:'#F5F8FB', dark:'#050C18' };

const doc = (r, W, H) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 400 864"><defs>${r.defs}</defs><rect width="400" height="864" fill="${P.ground}"/>${r.body}</svg>`;

// determinism: same seed twice
const a = fn(0,0,400,864,P,mkR(12345),'t1');
const b = fn(0,0,400,864,P,mkR(12345),'t1');
const same = a.defs === b.defs && a.body === b.body;
console.log('DETERMINISTIC:', same);
if (!same) {
  console.log('defs eq', a.defs===b.defs, 'body eq', a.body===b.body);
}
// forbidden content checks
const all = a.defs + a.body;
console.log('has <text>:', /<text/i.test(all));
console.log('has image/href:', /<image|xlink:href|href=|data:/i.test(all));
console.log('has Math.random in src:', /Math\.random/.test(fn.toString()));
// id presence in every id="..."
const ids = [...all.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
console.log('ids:', ids, 'all contain t1:', ids.every(i=>i.includes('t1')));
// numeric precision check: any number with >1 decimal in output?
const bad = [...all.matchAll(/-?\d+\.\d{2,}/g)].map(m=>m[0]);
console.log('over-precise numbers:', bad.slice(0,10), 'count', bad.length);

fs.writeFileSync(dir+'/big.svg', doc(a, 400, 864));
fs.writeFileSync(dir+'/small.svg', doc(a, 100, 216));
// several seeds for a contact sheet
let sheet = '';
const cols = 6;
for (let k=0;k<12;k++){
  const r = fn(0,0,400,864,P,mkR(1000+k*7919),'s'+k);
  sheet += `<defs>${r.defs}</defs><g transform="translate(${(k%cols)*420},${Math.floor(k/cols)*884})"><rect width="400" height="864" fill="${P.ground}"/>${r.body}</g>`;
}
fs.writeFileSync(dir+'/sheet.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="${cols*420}" height="${2*884}" viewBox="0 0 ${cols*420} ${2*884}"><rect width="100%" height="100%" fill="#333"/>${sheet}</svg>`);
console.log('wrote svgs');
