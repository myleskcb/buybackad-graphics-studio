const fs=require('fs');
const fn=require('./fn.js');
function mkR(seed){let s=seed>>>0||1;const rand=()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};
 return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const pals={
 dark:{ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'},
 light:{ground:'#FFFFFF',ground2:'#F2EFE6',ink:'#22201C',body:'#5A564E',accent:'#C8452F',hot:'#E8B33A',paper:'#FBF9F4',dark:'#0B0A08'},
 warm:{ground:'#2B1A12',ground2:'#4A2C1C',ink:'#F6E7D4',body:'#C6A382',accent:'#E2542B',hot:'#F2B705',paper:'#FFF6E8',dark:'#120A06'},
};
const TW=100,TH=216,G=8;
let rows=[],yy=0,svg='';
const names=Object.keys(pals);
let out=`<svg xmlns="http://www.w3.org/2000/svg" width="${8*(TW+G)+G}" height="${names.length*(TH+G)+G}"><rect width="100%" height="100%" fill="#FF00FF"/>`;
names.forEach((nm,ri)=>{
 for(let i=0;i<8;i++){
   const x=G+i*(TW+G), y=G+ri*(TH+G);
   const r=fn(x,y,TW,TH,pals[nm],mkR(7+i*3121+ri*911),'s'+ri+'_'+i);
   out+=`<defs>${r.defs}</defs>${r.body}`;
 }
});
out+='</svg>';
fs.writeFileSync(__dirname+'/sheet.svg',out);
console.log('ok');
