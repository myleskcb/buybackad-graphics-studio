// The Cash Buyer ad (top_buyer), redrawn at runtime: nothing in app.js is changed.
// The owner, 2026-11-11: "This ad just doesn't have enough color", "you would hope at least
// cash buyer would be green or we could have $ pattern fill", "iPhones is a bit of a peachy
// color, not a neon ... as well as the subtext not taking up the entire UI box space".
//   python3 -m http.server 8899            (repo root)
//   AD_OUT=/tmp/ad node tools/looks-lab/ad-prototype/make.cjs          all versions
//   AD_OUT=/tmp/ad node tools/looks-lab/ad-prototype/make.cjs A,D      some
// before = today. A green $ ground, green title, neon orange. B = A with $ in the title's
// letters. C = the template's own photo in colour. D, E = one colour (rules 95 and 122).
const { open, fs } = require('./common.cjs');
const OUT = process.env.AD_OUT || require('os').tmpdir();   // pictures and report.json go here, never into the repo
const HERE = __dirname;
fs.mkdirSync(OUT, { recursive: true });
const GREEN = { c1: '#0d3f2d', c2: '#0a3022', glyph: '#114e37' };
const TYPE = { title: '#3ddc74', headline: '#ff6a00' };
const SUB = { fill: '#f6f2ea', pad: 12, hug: true, hugPadX: 30, centreV: true };
const only = process.argv[2] ? process.argv[2].split(',') : null;
const VARIANTS = [
  { name: 'before' },
  { name: 'A', ground: 'dollars', ...GREEN, type: TYPE, subline: SUB },
  { name: 'B', ground: 'dollars', ...GREEN, type: TYPE, subline: SUB, titlePattern: { glyph: '#84f5a9', base: '#33cb6d', scale: 0.72 } },
  { name: 'C', ground: 'photo', shade: 0.45, type: TYPE, subline: SUB },                     // the studio's own neutral shade (ez.shade), so the type reads
  { name: 'D', ground: 'dollars', ...GREEN, type: { title: '#3ddc74', headline: '#3ddc74' }, subline: SUB },   // one colour, one ink (rules 95 and 122)
  { name: 'E', ground: 'dollars', ...GREEN, type: { title: '#f6f2ea', headline: '#f6f2ea' }, subline: SUB },   // banknote: cream ink on green
  { name: 'ref-C-noshade', ground: 'photo', type: TYPE, subline: SUB },                       // bgPicked=true alone
  { name: 'ref-engine-pattern', ground: 'dollars', ...GREEN, tagLook: 'pattern' },            // the studio's existing Pattern > Money signs look, untouched
  { name: 'ref-A-engine-only', ground: 'dollars', ...GREEN },                                 // the new ground, today's type
].filter(v => !only || only.includes(v.name));
(async () => {
  const { b, p } = await open();
  await p.evaluate(() => Promise.all([document.fonts.load('800 64px "Satoshi"', '$'), document.fonts.load('700 64px "Clash Display"', '$'), document.fonts.load('700 40px "Khand"', 'A')]).then(r => console.log('[ad] fonts', r.map(x => x.length).join(','))));
  await p.addScriptTag({ path: HERE + '/page-helpers.js' });
  const all = {};
  for (const v of VARIANTS){
    const { url, rep } = await p.evaluate(cfg => window.__ad.render(cfg), v);
    if (url) fs.writeFileSync(OUT + '/ad-' + v.name + '.png', Buffer.from(url.split(',')[1], 'base64'));
    all[v.name] = rep;
    console.log('\n=== ' + v.name + ' ===', rep.bg || '', rep.err ? 'ERR ' + rep.err : '');
    if (rep.subline) console.log('subline', JSON.stringify(rep.subline));
    if (rep.titlePattern) console.log('titlePattern', JSON.stringify(rep.titlePattern));
    Object.entries(rep.contrast || {}).forEach(([k, c]) => console.log('contrast', k.padEnd(14), JSON.stringify(c)));
    if (process.env.DUMP) (rep.final || []).forEach(o => console.log('  ', JSON.stringify(o)));
  }
  fs.writeFileSync(OUT + '/report.json', JSON.stringify(all, null, 1));
  await b.close();
})();
