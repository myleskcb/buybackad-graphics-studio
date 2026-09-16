import fs from 'fs';
import puppeteer from '/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const dir='/Users/admin/Downloads/gfxv23/scratch_wh';
const mod=await import(process.argv[2]||(dir+'/fn2.mjs'));
const fn=mod.wall_hills; const tag=process.argv[3]||'b';
function mkR(seed){let s=seed>>>0||1;const rand=()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};
 return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
function sheet(seeds,W,H,cols,file,scale){
  let g='',dfs='',i=0;
  for(const s of seeds){const r=fn(0,0,W,H,P,mkR(s),'v'+i);dfs+=r.defs;
    g+=`<g transform="translate(${(i%cols)*(W+16)},${Math.floor(i/cols)*(H+16)})"><rect width="${W}" height="${H}" fill="#0E253C"/>${r.body}<rect width="${W}" height="${H}" fill="none" stroke="#FF00FF" stroke-width="1"/></g>`;i++;}
  const rows=Math.ceil(seeds.length/cols), VW=cols*(W+16), VH=rows*(H+16);
  fs.writeFileSync(dir+'/'+file+'.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="${VW*scale}" height="${VH*scale}" viewBox="0 0 ${VW} ${VH}"><rect width="100%" height="100%" fill="#222"/><defs>${dfs}</defs>${g}</svg>`);
  return [Math.round(VW*scale),Math.round(VH*scale)];
}
const S=k=>1000+k*7919;
const jobs=[];
jobs.push([`v_phone_${tag}`, sheet(Array.from({length:12},(_,k)=>S(k)),400,864,6,`v_phone_${tag}`,.55)]);
jobs.push([`v_small_${tag}`, sheet(Array.from({length:12},(_,k)=>S(k)),400,864,12,`v_small_${tag}`,.25)]);
jobs.push([`v_squat_${tag}`, sheet(Array.from({length:6},(_,k)=>S(k+30)),400,300,3,`v_squat_${tag}`,1)]);
jobs.push([`v_wide_${tag}`, sheet(Array.from({length:4},(_,k)=>S(k+50)),900,320,2,`v_wide_${tag}`,1)]);
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox'],headless:true});
for(const [f,d] of jobs){const p=await b.newPage();await p.setViewport({width:Math.max(10,Math.min(d[0],2600)),height:Math.max(10,Math.min(d[1],2600))});
 await p.goto('file://'+dir+'/'+f+'.svg',{waitUntil:'networkidle0'});await p.screenshot({path:dir+'/'+f+'.png'});await p.close();}
await b.close();console.log('ok');
