const dir='/Users/admin/Downloads/gfxv23/scratch_wh';
const mod=await import(process.argv[2]||(dir+'/fn.mjs'));
const fn=mod.wall_hills;
function mkR(seed){let s=seed>>>0||1;const rand=()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};
 return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const base={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
const pals=[base,
 {ground:'#fff',ground2:'#fff',ink:'#fff',body:'#fff',accent:'#fff',hot:'#fff',paper:'#fff',dark:'#fff'},
 {ground:'#111',ground2:'#111',ink:'#111',body:'#111',accent:'#111',hot:'#111',paper:'#111',dark:'#111'},
 {ground:'#abc',ground2:'#123',ink:'#eee',body:'#999',accent:'#f00',hot:'#0f0',paper:'#fff',dark:'#000'},
 {ground:'#0E253C',ground2:'#0E253C',ink:'#0E253C',body:'#0E253C',accent:'#F5F8FB',hot:'#F5F8FB',paper:'#F5F8FB',dark:'#050C18'}];
const sizes=[[400,864],[400,300],[900,320],[300,300],[120,260],[1000,1000],[40,40]];
let issues=0,cards=0;
for(const P of pals)for(const [W,H] of sizes)for(let k=0;k<300;k++){
  let r;
  try{ r=fn(13,29,W,H,P,mkR(3+k*7919),'z'); }catch(e){ console.log('THROW',W,H,k,e.message); issues++; continue; }
  cards++;
  const s=r.defs+r.body;
  if(/NaN|undefined|Infinity|null/.test(s)){ console.log('BAD TOKEN',W,H,k,s.match(/.{0,40}(NaN|undefined|Infinity|null).{0,20}/)[0]); issues++; }
  if(/#[0-9a-fA-F]*[^0-9a-fA-F"#]/.test(s.replace(/[^#]*?(#[0-9a-fA-F]+)/g,'$1 '))){}
  for(const m of s.matchAll(/(?:fill|stroke|stop-color)="([^"]+)"/g)){
    const v=m[1];
    if(v!=='none'&&!/^url\(#/.test(v)&&!/^#[0-9a-fA-F]{6}$/.test(v)&&!/^#[0-9a-fA-F]{3}$/.test(v)){console.log('BAD COLOR',W,H,k,v);issues++;}
  }
  for(const m of s.matchAll(/r="([-\d.]+)"|width="([-\d.]+)"|stroke-width="([-\d.]+)"/g)){
    const v=+(m[1]||m[2]||m[3]);
    if(!(v>=0)){console.log('NEG DIM',W,H,k,m[0]);issues++;}
  }
}
console.log('cards',cards,'issues',issues);
