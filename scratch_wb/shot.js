const puppeteer=require('/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core');
const fs=require('fs');
(async()=>{
  const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox'],headless:'new'});
  const jobs=[
    ['card.svg','card_400.png',400,864],
    ['card.svg','card_100.png',100,216],
    ['sheet.svg','sheet.png',1260,452],
  ];
  for(const [src,out,w,h] of jobs){
    const p=await b.newPage();
    await p.setViewport({width:w,height:h,deviceScaleFactor:1});
    const svg=fs.readFileSync('/Users/admin/Downloads/gfxv23/scratch_wb/'+src,'utf8');
    await p.setContent('<style>html,body{margin:0;padding:0;background:#ff00ff}svg{display:block;width:'+w+'px;height:'+h+'px}</style>'+svg,{waitUntil:'load'});
    await p.screenshot({path:'/Users/admin/Downloads/gfxv23/scratch_wb/'+out});
    const errs=[];p.on('pageerror',e=>errs.push(String(e)));
    await p.close();
  }
  await b.close();
  console.log('shots done');
})().catch(e=>{console.error(e);process.exit(1)});
