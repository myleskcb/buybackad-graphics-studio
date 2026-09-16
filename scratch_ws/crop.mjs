import puppeteer from '/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import { readFileSync } from 'node:fs';
const D='/Users/admin/Downloads/gfxv23/scratch_ws/';
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox'],headless:true});
const p=await b.newPage();
await p.setViewport({width:400,height:864,deviceScaleFactor:3});
await p.setContent(`<body style="margin:0;background:#888">${readFileSync(D+process.argv[2],'utf8')}</body>`);
await p.screenshot({path:D+process.argv[3], clip:{x:+process.argv[4],y:+process.argv[5],width:+process.argv[6],height:+process.argv[7]}});
await b.close(); console.log('ok');
