const crypto = require('crypto');
const fn = require('/Users/admin/Downloads/gfxv23/scratch_wf/fn.js');
const P = { ground: '#0E253C', ground2: '#1B3A5C', ink: '#D4DFEB', body: '#8FA6BE', accent: '#FCACA5', hot: '#7FD8C0', paper: '#F5F8FB', dark: '#050C18' };
function mk(seed) {
  let t = seed >>> 0;
  const rand = () => { t += 0x6D2B79F5; let z = t; z = Math.imul(z ^ z >>> 15, z | 1); z ^= z + Math.imul(z ^ z >>> 7, z | 61); return ((z ^ z >>> 14) >>> 0) / 4294967296; };
  return { f: (a, b) => a + (b - a) * rand(), i: (a, b) => Math.floor(a + (b - a + 1) * rand()), pick: a => a[Math.floor(rand() * a.length)], chance: p => rand() < p };
}
const A = fn(0, 0, 400, 864, P, mk(12345), 't1');
const B = fn(0, 0, 400, 864, P, mk(12345), 't1');
const a = Buffer.from(A.defs + ' ' + A.body);
const b = Buffer.from(B.defs + ' ' + B.body);
console.log('byte length ' + a.length + ' / ' + b.length);
console.log('Buffer.compare: ' + (Buffer.compare(a, b) === 0 ? 'BYTE-IDENTICAL' : 'DIFFERENT'));
console.log('sha256 A ' + crypto.createHash('sha256').update(a).digest('hex').slice(0, 24));
console.log('sha256 B ' + crypto.createHash('sha256').update(b).digest('hex').slice(0, 24));
