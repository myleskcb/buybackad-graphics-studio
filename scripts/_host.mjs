import puppeteer from 'puppeteer-core';
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',args:['--no-sandbox'],protocolTimeout:0});
const p=await b.newPage();
await p.goto('http://localhost:8899/',{waitUntil:'networkidle2',timeout:120000});
await p.evaluate(()=>document.fonts.ready);
await new Promise(r=>setTimeout(r,6000));
console.log(JSON.stringify(await p.evaluate(()=>{
  const W=TPL_W,H=TPL_H,C={x:40,y:762,w:1000,h:258};
  const lin=c=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4)};
  const rows=[];
  for(const t of TEMPLATES.filter(t=>t.id.startsWith('dl_'))){
    const sc=new fabric.StaticCanvas(null,{width:W,height:H,renderOnAddRemove:false});
    const im=freshBgImage(t.bg.src,t.bg.blur,t.bg.grade);
    if(!im){sc.dispose();continue;}
    sc.setBackgroundImage(coverImage(im,W,H),()=>{});
    if(t.bg.scrim) sc.add(scrimRect(t.bg.scrim,W,H,t.bg.scrimColor,t.bg.scrimMode));
    sc.renderAll();
    const d=sc.lowerCanvasEl.getContext('2d').getImageData(C.x,C.y,C.w,C.h).data;
    let sum=0,n=0;const ls=[];
    for(let i=0;i<d.length;i+=16){const L=0.2126*lin(d[i])+0.7152*lin(d[i+1])+0.0722*lin(d[i+2]);ls.push(L);sum+=L;n++}
    const m=sum/n;
    const sd=Math.sqrt(ls.reduce((s,v)=>s+(v-m)*(v-m),0)/n);
    // detail: mean absolute horizontal gradient
    let g=0,gn=0;
    for(let y=0;y<C.h;y+=3)for(let x=1;x<C.w;x+=3){const a=(y*C.w+x)*4,bq=(y*C.w+x-1)*4;
      g+=Math.abs(d[a]-d[bq])+Math.abs(d[a+1]-d[bq+1])+Math.abs(d[a+2]-d[bq+2]);gn++}
    rows.push({id:t.id,lum:+m.toFixed(3),sd:+sd.toFixed(3),detail:+(g/gn).toFixed(2)});
    sc.dispose();
  }
  rows.sort((a,b)=>b.detail-a.detail);
  return {top:rows.slice(0,10), bottom:rows.slice(-3)};
}),null,1));
await b.close();
