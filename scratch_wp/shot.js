const puppeteer = require('/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core');
const fs = require('fs'), path = require('path');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--no-sandbox'], headless: 'new' });
  const jobs = process.argv.slice(2);
  for (const j of jobs) {
    const [file, W, H] = j.split(':');
    const p = await b.newPage();
    await p.setViewport({ width: +W + 40, height: +H + 40, deviceScaleFactor: 1 });
    const svg = fs.readFileSync(path.join(__dirname, file), 'utf8');
    await p.setContent(`<body style="margin:0;background:#FF00FF"><div style="padding:20px;width:${W}px">${svg.replace(/width="\d+" height="\d+"/, `width="${W}" height="${H}"`)}</div></body>`);
    await new Promise(r => setTimeout(r, 200));
    const out = path.join(__dirname, file.replace('.svg','') + '_' + W + '.png');
    await p.screenshot({ path: out });
    console.log('shot', out);
    await p.close();
  }
  await b.close();
})();
