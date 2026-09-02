import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',args:['--no-sandbox']});
const p = await b.newPage();
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
p.on('requestfailed', r => { if(/contrast-fix/.test(r.url())) errs.push('REQFAIL '+r.url()); });
await p.goto('http://localhost:8899/',{waitUntil:'domcontentloaded',timeout:60000});
await p.evaluate(()=>document.fonts.ready);
await new Promise(r=>setTimeout(r,8000));
const out = await p.evaluate(()=>{
  const t = TEMPLATES.find(x=>x.id==='dl_strips_trustSeal_emerald');
  const l = t && t.layers.find(x=>x.name==='Headline 3');
  return { loaded: typeof CONTRAST_FIX!=='undefined' && CONTRAST_FIX!==null,
           n: (typeof CONTRAST_FIX!=='undefined'&&CONTRAST_FIX)?CONTRAST_FIX.length:0,
           fill: l && l.props.fill,
           hasFn: typeof applyMeasuredContrast };
});
console.log(JSON.stringify(out,null,1));
console.log('ERRORS: '+JSON.stringify(errs.slice(0,4)));
await b.close();
