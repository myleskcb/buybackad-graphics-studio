import fs from 'fs';
import puppeteer from '/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const dir='/Users/admin/Downloads/gfxv23/scratch_wh';
const mod=await import(process.argv[2]||(dir+'/fn.mjs'));
const fn=mod.wall_hills;
const tag=process.argv[3]||'a';
function mkR(seed){let s=seed>>>0||1;const rand=()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};
 return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
function cut(W,H,seed){
  const r=fn(0,0,W,H,P,mkR(seed),'q');
  const m=r.body.match(/<circle cx="([-\d.]+)" cy="([-\d.]+)" r="([-\d.]+)"([^>]*)>/);
  if(!m)return null;
  const cx=+m[1],cy=+m[2],rr=+m[3],ring=/stroke-width/.test(m[4]);
  const sw=ring?+m[4].match(/stroke-width="([\d.]+)"/)[1]:0, o=rr+sw/2;
  return {ring,top:cy-o<0,side:cx-o<0||cx+o>W};
}
// collect 6 phone cards with a side-cut sun, 6 squat cards with a top-cut ring
const phoneSide=[],squatTop=[];
for(let k=0;k<4000&&(phoneSide.length<6||squatTop.length<6);k++){
  const s=7+k*7919;
  const a=cut(400,864,s); if(a&&a.side&&phoneSide.length<6)phoneSide.push(s);
  const b=cut(400,300,s); if(b&&b.ring&&b.top&&squatTop.length<6)squatTop.push(s);
}
function sheet(items,W,H,cols,file){
  let g='',dfs='';let i=0;
  for(const s of items){const r=fn(0,0,W,H,P,mkR(s),'x'+i);dfs+=r.defs;
    g+=`<g transform="translate(${(i%cols)*(W+20)},${Math.floor(i/cols)*(H+20)})"><rect width="${W}" height="${H}" fill="#0E253C"/>${r.body}<rect width="${W}" height="${H}" fill="none" stroke="#FF00FF" stroke-width="1"/></g>`;i++;}
  const rows=Math.ceil(items.length/cols);
  fs.writeFileSync(dir+'/'+file,`<svg xmlns="http://www.w3.org/2000/svg" width="${cols*(W+20)}" height="${rows*(H+20)}"><defs>${dfs}</defs><rect width="100%" height="100%" fill="#222"/>${g}</svg>`);
  return [cols*(W+20),rows*(H+20)];
}
const d1=sheet(phoneSide,400,864,6,`cut_phone_${tag}.svg`);
const d2=sheet(squatTop,400,300,3,`cut_squat_${tag}.svg`);
const wide=[]; for(let k=0;k<6;k++)wide.push(31+k*104729);
const d3=sheet(wide,900,320,2,`wide_${tag}.svg`);
const nar=[]; for(let k=0;k<8;k++)nar.push(97+k*7919);
const d4=sheet(nar,120,260,8,`narrow_${tag}.svg`);
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox'],headless:true});
for(const [f,d] of [[`cut_phone_${tag}`,d1],[`cut_squat_${tag}`,d2],[`wide_${tag}`,d3],[`narrow_${tag}`,d4]]){
  const p=await b.newPage(); await p.setViewport({width:Math.min(d[0],3000),height:Math.min(d[1],3000)});
  await p.goto('file://'+dir+'/'+f+'.svg',{waitUntil:'networkidle0'});
  await p.screenshot({path:dir+'/'+f+'.png'}); await p.close();
}
await b.close();
console.log('phoneSide',phoneSide,'squatTop',squatTop);
