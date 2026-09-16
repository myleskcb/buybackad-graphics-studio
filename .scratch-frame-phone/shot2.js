const puppeteer=require('/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core');
const p='/Users/admin/Downloads/gfxv23/.scratch-frame-phone/';
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox'],headless:'new'});
const errs=[];
for(const [f,w,h,out,dpr] of [['sheet.svg',880,800,'sheet.png',1.5]]){
 const page=await b.newPage();page.on('pageerror',e=>errs.push(''+e));page.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 await page.setViewport({width:w,height:h,deviceScaleFactor:dpr});
 await page.setContent('<html><body style="margin:0">'+require('fs').readFileSync(p+f,'utf8')+'</body></html>',{waitUntil:'load'});
 await page.screenshot({path:p+out});await page.close();console.log('wrote',out);}
console.log('console errors:',errs.length?errs:'none');
await b.close();})();
