const fs = require('fs');
const puppeteer = require('/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core');
const fn = require('/Users/admin/Downloads/gfxv23/scratch_wf/fn.js');
const src = fs.readFileSync('/Users/admin/Downloads/gfxv23/engine/engine.mjs', 'utf8');
const arr = src.slice(src.indexOf('const PALETTES=['), src.indexOf('/* authored + graded'));
const pals = [...arr.matchAll(/\{id:"[^"]+"[^}]*\}/g)].map(m => eval('(' + m[0].replace(/(\w+):/g, '"$1":') + ')'));
function mk(seed) {
  let t = seed >>> 0;
  const rand = () => { t += 0x6D2B79F5; let z = t; z = Math.imul(z ^ z >>> 15, z | 1); z ^= z + Math.imul(z ^ z >>> 7, z | 61); return ((z ^ z >>> 14) >>> 0) / 4294967296; };
  return { f: (a, b) => a + (b - a) * rand(), i: (a, b) => Math.floor(a + (b - a + 1) * rand()), pick: a => a[Math.floor(rand() * a.length)], chance: p => rand() < p };
}
const CW = 100, CH = 216;
let g = '', W = 0, H = 0;
pals.forEach((P, row) => {
  const Y = row * (CH + 12) + 10;
  W = 6 * (CW + 12) + 20;
  g += '<rect x="0" y="' + (Y - 6) + '" width="' + W + '" height="' + (CH + 12) + '" fill="' + P.ground + '"/>';
  for (let c = 0; c < 6; c++) {
    const X = c * (CW + 12) + 10;
    const r = fn(X, Y, CW, CH, P, mk(c * 7 + row + 1), 'x' + row + '_' + c);
    g += '<defs>' + r.defs + '</defs>' + r.body;
  }
  H = Y + CH + 16;
});
fs.writeFileSync('/Users/admin/Downloads/gfxv23/scratch_wf/matrix.svg',
  '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '"><rect width="' + W + '" height="' + H + '" fill="#888888"/>' + g + '</svg>');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--no-sandbox'], headless: 'new' });
  const p = await b.newPage();
  await p.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file:///Users/admin/Downloads/gfxv23/scratch_wf/matrix.svg', { waitUntil: 'networkidle0' });
  await p.screenshot({ path: '/Users/admin/Downloads/gfxv23/scratch_wf/matrix.png' });
  await b.close();
  console.log('matrix ' + W + 'x' + H + ' errors:' + errs.length);
})();
