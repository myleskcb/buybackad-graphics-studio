const fs=require('fs');const fn=require('./fn.js');
function mkR(seed){let s=seed>>>0||1;const rand=()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};
 return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
const boxes=[[20,20,860,120,'wide 860x120'],[20,160,300,300,'sq 300x300'],[340,160,540,300,'16:9 540x300'],[20,480,120,300,'tall 120x300'],[160,480,720,60,'strip 720x60'],[160,560,90,180,'tiny 90x180'],[270,560,200,180,'200x180'],[490,560,390,180,'390x180']];
let out=`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="760"><rect width="100%" height="100%" fill="#FF00FF"/>`;
boxes.forEach(([x,y,w,h,l],i)=>{const r=fn(x,y,w,h,P,mkR(31+i*4051),'a'+i);out+=`<defs>${r.defs}</defs>${r.body}`;});
out+='</svg>';fs.writeFileSync(__dirname+'/aspects.svg',out);console.log('ok');
