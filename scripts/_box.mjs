import puppeteer from 'puppeteer-core';
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',args:['--no-sandbox'],protocolTimeout:0});
const p=await b.newPage();
await p.goto('http://localhost:8899/?nofix=1',{waitUntil:'networkidle2',timeout:120000});
await p.evaluate(()=>document.fonts.ready);
await new Promise(r=>setTimeout(r,5000));
console.log(JSON.stringify(await p.evaluate(()=>{
  const t=TEMPLATES.find(x=>x.id.startsWith('dl_')&&x.id.split('_')[2]==='agencyGrid');
  return { id:t.id, pal:t.pal, cutoutExt: (typeof CUTOUT_EXT!=='undefined'?CUTOUT_EXT:'?'),
    layers:t.layers.map(l=>({kind:l.kind,name:l.name,role:l.role,
      fill:l.props&&l.props.fill, grad:l.props&&l.props.grad?[l.props.grad.c1,l.props.grad.c2]:null,
      src:l.props&&l.props.src, box:l.props?[l.props.left,l.props.top,l.props.width,l.props.height]:null,
      text:typeof l.text==='string'?l.text.slice(0,22):undefined})) };
}),null,1));
await b.close();
