const fs=require('fs');const fn=require('./fn.js');
function mkR(seed){let s=seed>>>0||1;const rand=()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};
 return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
const found=[];
for(let s=1;s<4000&&found.length<8;s++){
  const r=fn(0,0,190,450,P,mkR(s*2654435761),'L'+s);
  const m=r.body.match(/fill="(#[0-9a-f]{6})"/);
  if(m&&m[1]==='#f5f8fb') found.push(s);
}
console.log('light-base seeds:',found.join(','));
let out=`<svg xmlns="http://www.w3.org/2000/svg" width="${8*198+8}" height="466"><rect width="100%" height="100%" fill="#FF00FF"/>`;
found.forEach((s,i)=>{const r=fn(8+i*198,8,190,450,P,mkR(s*2654435761),'L'+s);out+=`<defs>${r.defs}</defs>${r.body}`;});
out+='</svg>';fs.writeFileSync(__dirname+'/light.svg',out);
