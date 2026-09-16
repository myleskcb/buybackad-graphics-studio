const puppeteer = require('/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core');
const fs = require('fs'), path = require('path');
(async () => {
  const b = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox'], headless: 'new',
  });
  const jobs = JSON.parse(process.argv[2]);
  for (const j of jobs) {
    const p = await b.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(String(e)));
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.setViewport({ width: j.w, height: j.h, deviceScaleFactor: j.dsf || 1 });
    const svg = fs.readFileSync(j.svg, 'utf8');
    await p.setContent(`<body style="margin:0;background:#FF00FF">${svg}</body>`, { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 200));
    await p.screenshot({ path: j.out });
    console.log(j.out, 'errors:', errs.length ? errs.join(' | ') : 'none');
    await p.close();
  }
  await b.close();
})();
