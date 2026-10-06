#!/usr/bin/env node
/* The photo-real finish (DESIGN-LAW rule 124) held to rule 114, measured on the pixels.

   Every phone in motion/phones is drawn side on (turned 90 and 270 degrees, so the
   side is nearly all there is to see) in the standard finish and in photo-real, and
   its side's pixels are read back:

     mean     the side's average colour against its own colour (the measured
              aluminium, RAIL, on a 17 or 18 Pro; the body's colour on any other),
              in linear light. A measured side must average 0.89 to 1.10 of its
              colour (rule 114's bar), or no less than the standard finish's own side
              less 0.02 (this crop takes in the buttons, and the standard's Cosmic
              Orange measures 0.88 by it); any other side, being a shade darker than
              the body, must average under it.
     key      the side's brightest pixels (the 99.5th percentile of luminance): in
              photo-real no lighter than the standard finish's side or the body
              colour, whichever is lighter, plus one percent. The softbox streak and
              the catch-light must never read as a lighter key than the body.
     hue      the side's average hue in OKLab against its own colour's, where both
              carry colour (chroma over 0.03): within 12 degrees. The streak stays on
              the band's own colour family.

   usage:  python3 -m http.server 8765   (repo root)   then
           node scripts/motion_finish_check.mjs [--port 8765]
   Uses puppeteer-core with CHROME=/path/to/chrome, else playwright's chromium.
   Exits 1 on a failure. */
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const PORT = +arg('--port', 8765), MEAN_RAIL = [.89, 1.10], KEY_BAR = 1.01, HUE_BAR = 12;

let browser;
try {
  const { default: puppeteer } = await import('puppeteer-core');
  browser = await puppeteer.launch({ executablePath: process.env.CHROME, headless: 'new', args: ['--no-sandbox'] });
} catch (e) {
  const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
  browser = await chromium.launch();
}
const page = await browser.newPage();
page.on('pageerror', e => { console.error('page error:', e.message); process.exitCode = 1; });
await page.goto(`http://localhost:${PORT}/motion/audit-sweep.html`);
await page.waitForFunction(() => window.ready);

const rows = await page.evaluate(async () => {
  const { Phone, drawPhone, loadPhones, RAIL, hexRgb } = await import('./engine.js');
  const { phones, index } = await loadPhones('./phones/');
  const lin = v => (v /= 255) <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
  const Y = ([r, g, b]) => .2126 * r + .7152 * g + .0722 * b;
  const oklab = ([r, g, b]) => {
    const l = Math.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b), m = Math.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b),
      s = Math.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b);
    const a = 1.9779984951 * l - 2.4285922050 * m + .4505937099 * s, bb = .0259040371 * l + .7827717662 * m - .8086757660 * s;
    return { C: Math.hypot(a, bb), h: Math.atan2(bb, a) * 180 / Math.PI };
  };
  const S = 360, c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d', { willReadFrequently: true }), out = [];
  for (const m of index) {
    const own = hexRgb(RAIL[m.id] || m.metal).map(lin), res = { phone: m.id, rail: !!RAIL[m.id] };
    for (const finish of ['standard', 'photo']) {
      const p = Object.assign(new Phone(phones[m.id].img, m, 300), { finish });
      const px = [];
      for (const deg of [90, 270]) {
        x.clearRect(0, 0, S, S);
        drawPhone(x, p, S / 2, S / 2, 1, 0, deg * Math.PI / 180, 0, 1, S, null, true);
        const d = x.getImageData(0, 0, S, S).data;
        for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 250) px.push([lin(d[i]), lin(d[i + 1]), lin(d[i + 2])]);
      }
      const mean = [0, 1, 2].map(k => px.reduce((a, q) => a + q[k], 0) / px.length);
      const ys = px.map(Y).sort((a, b) => a - b);
      res[finish] = { mean: Y(mean) / Y(own), key: ys[Math.floor(ys.length * .995)] / Y(own), hue: oklab(mean), n: px.length };
    }
    const ho = oklab(own), hp = res.photo.hue;
    res.dHue = ho.C > .03 && hp.C > .03 ? Math.abs(((hp.h - ho.h + 540) % 360) - 180) : null;
    out.push(res);
  }
  return out;
});

let fails = 0;
console.log('side on, against its own colour: mean (standard, photo-real), brightest 0.5% (standard, photo-real), hue shift in photo-real');
for (const r of rows) {
  const s = r.standard, p = r.photo, why = [];
  if (r.rail ? p.mean < Math.min(MEAN_RAIL[0], s.mean - .02) || p.mean > MEAN_RAIL[1] : p.mean > 1) why.push('mean');
  if (p.key > Math.max(1, s.key) * KEY_BAR) why.push('key');
  if (r.dHue != null && r.dHue > HUE_BAR) why.push('hue');
  fails += why.length > 0;
  console.log(`  ${r.phone.padEnd(28)} ${r.rail ? 'rail' : 'body'}  mean ${s.mean.toFixed(2)} ${p.mean.toFixed(2)}  key ${s.key.toFixed(2)} ${p.key.toFixed(2)}  hue ${r.dHue == null ? '  -  ' : r.dHue.toFixed(1).padStart(5)}°${why.length ? '   FAIL ' + why.join(',') : ''}`);
}
console.log(`\n${rows.length} phones, ${fails ? fails + ' failing' : 'all pass'}`);
await browser.close();
process.exit(fails ? 1 : process.exitCode || 0);
