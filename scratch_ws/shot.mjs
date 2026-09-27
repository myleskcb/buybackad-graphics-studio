import puppeteer from '/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import { readFileSync } from 'node:fs';
const D='/Users/admin/Downloads/gfxv23/scratch_ws/';
const browser = await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args:['--no-sandbox'], headless:true});
const page = await browser.newPage();
const jobs = [
  ['big.svg', 400, 864, 2],
  ['small_native.svg', 100, 216, 4],
  ['small_scaled.svg', 100, 216, 4],
  ['offset.svg', 400, 864, 2],
];
for (const [f,w,h,dpr] of jobs){
  await page.setViewport({width:w,height:h,deviceScaleFactor:dpr});
  const svg = readFileSync(D+f,'utf8');
  await page.setContent(`<body style="margin:0;background:#888">${svg}</body>`);
  const errs = [];
  page.on('pageerror', e=>errs.push(String(e)));
  await page.screenshot({path: D+f.replace('.svg','.png')});
  console.log(f,'shot', errs);
}
await browser.close();
