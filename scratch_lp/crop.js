const puppeteer=require('/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core');
const path=require('path');
const D='/Users/admin/Downloads/gfxv23/scratch_lp';
const which=process.argv[2]||'orig';
(async()=>{
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox'],headless:'new'});
const p=await b.newPage();
await p.setViewport({width:400,height:864,deviceScaleFactor:4});
await p.goto('file://'+path.join(D,which+'_s7_clean.svg'));
await p.screenshot({path:path.join(D,which+'_s7_base.png'),clip:{x:0,y:545,width:400,height:80}});
await p.screenshot({path:path.join(D,which+'_s7_top.png'),clip:{x:100,y:275,width:200,height:40}});
await b.close();
})();
