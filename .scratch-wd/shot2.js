const fs=require('fs');
const puppeteer=require('/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core');
const dir='/Users/admin/Downloads/gfxv23/.scratch-wd/';
(async()=>{
 const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox'],headless:true});
 for(const i of [3,6,9]){
  const svg=fs.readFileSync(dir+'one_'+i+'.svg','utf8');
  const html=`<!doctype html><meta charset=utf-8><style>html,body{margin:0;background:#ff00ff}svg{display:block}</style>${svg}`;
  fs.writeFileSync(dir+'one_'+i+'.html',html);
  const p=await b.newPage();
  await p.setViewport({width:200,height:432,deviceScaleFactor:1});
  await p.goto('file://'+dir+'one_'+i+'.html',{waitUntil:'load'});
  await p.screenshot({path:dir+'one_'+i+'.png'});
  await p.close();
 }
 await b.close(); console.log('ok');
})().catch(e=>{console.error(e);process.exit(1)});
