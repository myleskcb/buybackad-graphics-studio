const puppeteer = require('/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core');
const fs = require('fs');
const D = '/Users/admin/Downloads/gfxv23/.scratch-tablet/';
(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox'], headless: 'new'
  });
  const jobs = [
    ['big.svg', 400, 864, 'big.png', 2],
    ['small.svg', 100, 216, 'small.png', 4],
    ['clean400.svg', 400, 864, 'clean400.png', 2],
    ['clean100.svg', 100, 216, 'clean100.png', 4],
    ['sheet.svg', 1200, 520, 'sheet.png', 1.5]
  ];
  for (const [f, W, H, out, dsf] of jobs) {
    const page = await browser.newPage();
    const errs = [];
    page.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
    page.on('pageerror', e => errs.push('pageerror: '+e.message));
    await page.setViewport({ width: W, height: H, deviceScaleFactor: dsf });
    await page.goto('file://' + D + f, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: D + out });
    console.log(out, 'errors:', errs.length ? errs : 'none');
    await page.close();
  }
  await browser.close();
})();
