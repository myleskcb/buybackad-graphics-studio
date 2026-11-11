// Measures, at twelve widths, whether the hero's highlighted phrase ("text you first.")
// sits on ONE line inside its column, and whether the page scrolls sideways.
//   node tools/looks-lab/checklock.cjs signal-oat counter
//   node tools/looks-lab/checklock.cjs t3            (no finish: the live poster look)
// LAB_URL and FABRIC_JS as in render.cjs.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const [look, finish] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(); const rows = [];
  for (const w of [320, 360, 390, 430, 600, 768, 900, 901, 1024, 1280, 1440, 1920]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    if (process.env.FABRIC_JS) await p.route('**/fabric.min.js', r => r.fulfill({ path: process.env.FABRIC_JS, contentType: 'application/javascript' }));
    await p.goto((process.env.LAB_URL || 'http://localhost:8899/') + 'index.html?theme=light' + (finish ? '&finish=' + finish : ''), { waitUntil: 'load' });
    let css = fs.readFileSync(path.join(__dirname, 'looks', look + '.css'), 'utf8').replace(/\/\* @include ([\w.-]+) \*\//g, (m, f) => fs.readFileSync(path.join(__dirname, 'looks', f), 'utf8'));
    await p.evaluate(({ css, look }) => {
      [...css.matchAll(/@import url\(['"]?([^'")]+)['"]?\);?/g)].forEach(m => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = m[1]; document.head.appendChild(l); });
      const s = document.createElement('style'); s.textContent = css.replace(/@import url\([^)]+\);?/g, ''); document.head.appendChild(s);
      document.documentElement.setAttribute('data-lab', look);
    }, { css, look });
    await p.waitForTimeout(1200); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
    rows.push(await p.evaluate(w => {
      const h = document.querySelector('.hero h1'), em = h.querySelector('em'), col = document.querySelector('.hero-copy').getBoundingClientRect();
      const er = em.getBoundingClientRect(), lh = parseFloat(getComputedStyle(h).lineHeight), fs = parseFloat(getComputedStyle(h).fontSize);
      return { w, fontPx: +fs.toFixed(1), h1Lines: Math.round(h.getBoundingClientRect().height / lh), emRects: em.getClientRects().length, emOneLine: er.height < fs * 1.5, emFits: er.right <= col.right + 0.5 && er.left >= col.left - 4, emPctOfCol: Math.round(er.width / col.width * 100), pageOverflow: document.documentElement.scrollWidth > w };
    }, w));
    await p.close();
  }
  console.log(look); rows.forEach(r => console.log(JSON.stringify(r)));
  await b.close();
})();
