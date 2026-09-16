const puppeteer=require('/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core');const fs=require('fs');
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox'],headless:'new'});
for(const [src,out,w,h] of [['light.svg','light_400.png',400,864],['light.svg','light_100.png',100,216],['short.svg','short.png',400,100]]){
 const p=await b.newPage();await p.setViewport({width:w,height:h});
 await p.setContent('<style>html,body{margin:0;background:#ff00ff}svg{display:block;width:'+w+'px;height:'+h+'px}</style>'+fs.readFileSync('/Users/admin/Downloads/gfxv23/scratch_wb/'+src,'utf8'));
 await p.screenshot({path:'/Users/admin/Downloads/gfxv23/scratch_wb/'+out});await p.close();}
await b.close();console.log('ok');})();
