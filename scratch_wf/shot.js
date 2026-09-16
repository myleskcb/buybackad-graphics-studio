const puppeteer = require('/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core');
const fs = require('fs');
(async () => {
  const b = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args:['--no-sandbox'], headless:'new' });
  const jobs = [
    ['one.svg', 400, 864, 1],
    ['grid.svg', 1060, 880, 1],
    ['small.svg', 100, 216, 1],
    ['smallgrid.svg', 668, 468, 1],
    ['wide.svg', 864, 400, 1],
    ['probe.svg', 700, 1164, 1],
  ];
  for (const [f,w,h,sf] of jobs){
    const p = await b.newPage();
    await p.setViewport({ width:w, height:h, deviceScaleFactor:sf });
    const errs=[]; p.on('pageerror',e=>errs.push(String(e))); p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
    await p.goto('file:///Users/admin/Downloads/gfxv23/scratch_wf/'+f, {waitUntil:'networkidle0'});
    await p.screenshot({ path:'/Users/admin/Downloads/gfxv23/scratch_wf/'+f.replace('.svg','.png') });
    if (errs.length) console.log(f,'ERRORS',errs);
    await p.close();
  }
  // small.svg upscaled so I can actually look at it
  const p2 = await b.newPage();
  await p2.setViewport({width:100,height:216,deviceScaleFactor:4});
  await p2.goto('file:///Users/admin/Downloads/gfxv23/scratch_wf/small.svg');
  await p2.screenshot({path:'/Users/admin/Downloads/gfxv23/scratch_wf/small_zoom.png'});
  await p2.close();
  const p3 = await b.newPage();
  await p3.setViewport({width:668,height:468,deviceScaleFactor:2});
  await p3.goto('file:///Users/admin/Downloads/gfxv23/scratch_wf/smallgrid.svg');
  await p3.screenshot({path:'/Users/admin/Downloads/gfxv23/scratch_wf/smallgrid_zoom.png'});
  await p3.close();
  await b.close();
  console.log('shots done');
})();
