import puppeteer from 'puppeteer-core';
/* Measure every backdrop’s own luminance (raw photo, no scrim, no grade) and
   write assets/backdrop-lum.json. Themes pick their photograph from this table:
   a pale theme needs a bright shot under a heavy wash, a deep one needs room to
   stay dark. Re-run when backdrops are added. */
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',args:['--no-sandbox'],protocolTimeout:0});
const { readdirSync } = await import('node:fs');
/* scenes as well as backdrops: the Apple studio flat lays are used as grounds
   for the device lines, and a ground nobody measured is a ground that vanishes */
import { existsSync } from 'node:fs';
const SCENE_SRCS = readdirSync(new URL('../assets/scenes/', import.meta.url).pathname)
  .filter(f=>/\.jpe?g$/i.test(f)).map(f=>'assets/scenes/'+f)
  .concat(existsSync(new URL('../assets/bg-web/', import.meta.url).pathname)
    ? readdirSync(new URL('../assets/bg-web/', import.meta.url).pathname).filter(f=>/\.jpe?g$/i.test(f)).map(f=>'assets/bg-web/'+f) : []);
const p=await b.newPage();
await p.goto('http://localhost:8899/',{waitUntil:'networkidle2',timeout:120000});
await p.evaluate(()=>document.fonts.ready);
await new Promise(r=>setTimeout(r,6000));
await p.evaluate(async srcs => {   // scenes are not in the engine's cache; load them
  await Promise.all(srcs.map(s => new Promise(res => {
    if (TPL_BG_ELS[s]) return res();
    const el = new Image(); el.onload = () => { TPL_BG_ELS[s] = el; res(); };
    el.onerror = () => res(); el.src = s;
  })));
}, SCENE_SRCS);
const rows = await p.evaluate((SCENE_SRCS)=>{
  const W=1080,H=1080;
  const lin=c=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4)};
  const srcs=[...new Set([...TEMPLATES.filter(t=>t.bg&&t.bg.src).map(t=>t.bg.src), ...SCENE_SRCS])];
  const out=[];
  for(const s of srcs){
    const sc=new fabric.StaticCanvas(null,{width:W,height:H,renderOnAddRemove:false});
    const im=freshBgImage(s);              // RAW photo: no scrim, no grade
    if(!im){sc.dispose();continue}
    sc.setBackgroundImage(coverImage(im,W,H),()=>{});
    sc.renderAll();
    const d=sc.lowerCanvasEl.getContext('2d').getImageData(0,0,W,H).data;
    let L=0,n=0;const ls=[];
    for(let i=0;i<d.length;i+=64){const v=0.2126*lin(d[i])+0.7152*lin(d[i+1])+0.0722*lin(d[i+2]);L+=v;ls.push(v);n++}
    L/=n; ls.sort((a,b)=>a-b);
    // detail: mean horizontal gradient. A bokeh macro scores ~0.1; a shot with
    // a recognisable object scores 10+. Cards with no product need the latter.
    let g=0,gn=0;
    for(let y=0;y<H;y+=6)for(let x=1;x<W;x+=6){const a=(y*W+x)*4,b=(y*W+x-1)*4;
      g+=Math.abs(d[a]-d[b])+Math.abs(d[a+1]-d[b+1])+Math.abs(d[a+2]-d[b+2]);gn++}
    out.push({src:s,lum:+L.toFixed(3),p90:+ls[Math.floor(n*0.9)].toFixed(3),detail:+(g/gn).toFixed(2),
      cat:(s.split('/').pop().split('_')[1]||'?')});
    sc.dispose();
  }
  return out.sort((a,b)=>b.lum-a.lum);
}, SCENE_SRCS);
const { writeFileSync } = await import('node:fs');
writeFileSync(new URL('../assets/backdrop-lum.json', import.meta.url).pathname, JSON.stringify(rows,null,1));
const band=t=>rows.filter(o=>t(o.lum)).length;
console.log(`${rows.length} backdrops · dark ${band(l=>l<0.10)} · mid ${band(l=>l>=0.10&&l<0.28)} · light ${band(l=>l>=0.28&&l<0.50)} · airy ${band(l=>l>=0.50)}`);
const byCat={}; rows.forEach(r=>{ (byCat[r.cat] ||= []).push(r.lum); });
Object.entries(byCat).forEach(([c,l])=>console.log('  '+c.padEnd(9)+l.length+' shots · lightest '+Math.max(...l).toFixed(2)));
await b.close();
