const puppeteer = require('/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core');
const path = '/Users/admin/Downloads/gfxv23/.scratch-frame-phone/';
(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox'], headless: 'new'
  });
  const jobs = [
    ['out.svg', 400, 864, 'full.png', 2],
    ['spill.svg', 480, 944, 'spill.png', 1],
    ['out.svg', 100, 216, 'small.png', 3]
  ];
  for (const [file, w, h, out, dpr] of jobs) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: dpr });
    const svg = require('fs').readFileSync(path + file, 'utf8');
    const html = '<html><body style="margin:0;background:#888"><div style="width:'+w+'px;height:'+h+'px">'+
      svg.replace(/width="\d+"/, 'width="'+w+'"').replace(/height="\d+"/, 'height="'+h+'"')+'</div></body></html>';
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: path + out });
    const errs = [];
    page.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
    await page.close();
    console.log('wrote', out);
  }
  await browser.close();
})();
