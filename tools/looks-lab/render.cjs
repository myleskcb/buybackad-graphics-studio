// Renders the real site with a candidate look laid over it, and saves a picture.
// The site must be served first:  python3 -m http.server 8899   (repo root)
//
//   node tools/looks-lab/render.cjs out.jpg --finish=counter --look=suite
//   node tools/looks-lab/render.cjs out.jpg --finish=counter --look=suite --extra=ux
//   node tools/looks-lab/render.cjs out.jpg --finish=counter --look=greenback --page=studio --theme=dark
//   node tools/looks-lab/render.cjs out.jpg --look=t1            (a one-change swap, on the live poster look)
//
// --look=NAME     looks/NAME.css (and looks/NAME.js when there is one), stamped as data-lab=NAME
// --extra=NAME    a second sheet on top (ux = the suite bar and the number-first hero)
// --finish=counter  the six full looks are written on top of the counter finish and need it
// --page=studio   click through to the editor      --theme=light|dark
// --w --h --dsf --mobile --full --scroll=SELECTOR --clip=x,y,w,h --wait=MS --q=JPEG_QUALITY
// LAB_URL  where the site is served (default http://localhost:8899/)
// FABRIC_JS  a local fabric.min.js, for a machine that cannot reach the CDN
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const args = Object.fromEntries(process.argv.slice(3).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return [m[1], m[2] ?? '1']; }));
const out = process.argv[2];
const FABRIC = process.env.FABRIC_JS || '';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +(args.w || 1440), height: +(args.h || 900) }, deviceScaleFactor: +(args.dsf || 1), isMobile: !!args.mobile, hasTouch: !!args.mobile });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  if (FABRIC) await p.route('**/fabric.min.js', r => r.fulfill({ path: FABRIC, contentType: 'application/javascript' }));
  const qs = new URLSearchParams();
  if (args.finish) qs.set('finish', args.finish);
  if (args.theme) qs.set('theme', args.theme);
  if (args.skin) qs.set('skin', args.skin);
  const url = (process.env.LAB_URL || 'http://localhost:8899/') + (args.path || 'index.html') + (qs.toString() ? '?' + qs : '');
  await p.goto(url, { waitUntil: 'load', timeout: 60000 });
  if (args.look) {
    let css = fs.readFileSync(path.join(__dirname, 'looks', args.look + '.css'), 'utf8');
    css = css.replace(/\/\* @include ([\w.-]+) \*\//g, (m, f) => fs.readFileSync(path.join(__dirname, 'looks', f), 'utf8'));
    await p.evaluate(({ css, look }) => {
      const fontLinks = [...css.matchAll(/@import url\(['"]?([^'")]+)['"]?\);?/g)].map(m => m[1]);
      fontLinks.forEach(h => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = h; document.head.appendChild(l); });
      const s = document.createElement('style'); s.id = 'lab-css'; s.textContent = css.replace(/@import url\([^)]+\);?/g, ''); document.head.appendChild(s);
      document.documentElement.setAttribute('data-lab', look);
    }, { css, look: args.look });
    const js = path.join(__dirname, 'looks', args.look + '.js');
    if (fs.existsSync(js)) await p.evaluate(fs.readFileSync(js, 'utf8'));
  }
  if (args.extra) {
    const css = fs.readFileSync(path.join(__dirname, 'looks', args.extra + '.css'), 'utf8');
    await p.evaluate(css => { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); }, css);
    const js = path.join(__dirname, 'looks', args.extra + '.js');
    if (fs.existsSync(js)) await p.evaluate(fs.readFileSync(js, 'utf8'));
  }
  if (args.page === 'studio') {
    await p.waitForTimeout(1500);
    await p.click('#lp-cta-main').catch(e => errs.push('click ' + e.message.slice(0, 120)));
    await p.waitForTimeout(2500);
    const nn = p.locator('button:has-text("Not now")').first();
    if (await nn.isVisible().catch(() => false)) { await nn.click(); await p.waitForTimeout(800); }
  }
  if (args.eval) await p.evaluate(fs.readFileSync(args.eval, 'utf8'));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(+(args.wait || 3500));
  if (args.scroll) { await p.evaluate(sel => document.querySelector(sel)?.scrollIntoView({ block: 'start' }), args.scroll); await p.waitForTimeout(900); }
  const opt = { path: out, fullPage: !!args.full };
  if (/\.jpe?g$/.test(out)) { opt.type = 'jpeg'; opt.quality = +(args.q || 86); }
  if (args.clip) { const [x, y, w, h] = args.clip.split(',').map(Number); opt.clip = { x, y, width: w, height: h }; }
  await p.screenshot(opt);
  if (errs.length) console.log('ERR', [...new Set(errs)].slice(0, 4).join(' | '));
  console.log('ok', out);
  await b.close();
})();
