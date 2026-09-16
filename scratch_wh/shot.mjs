import puppeteer from '/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import fs from 'fs';
const dir='/Users/admin/Downloads/gfxv23/scratch_wh';
const b = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args:['--no-sandbox'], headless:true });
const jobs = [['big.svg',400,864],['small.svg',100,216],['sheet.svg',2520,1768]];
for (const [f,W,H] of jobs){
  const p = await b.newPage();
  await p.setViewport({width:W,height:H,deviceScaleFactor:1});
  await p.goto('file://'+dir+'/'+f, {waitUntil:'networkidle0'});
  await p.screenshot({path:dir+'/'+f.replace('.svg','.png')});
  await p.close();
}
await b.close();
console.log('shot ok');
