const fs = require('fs');
const path = require('path');
const D = '/Users/admin/Downloads/gfxv23/scratch_lp';
const which = process.argv[2] || 'orig';
const { frame_laptop } = require(path.join(D, which === 'fix' ? 'fn_fixed.js' : 'fn.js'));

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function mkR(seed){const rand=mulberry32(seed);return{f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};

const BOX={x:0,y:0,w:400,h:864};
function run(seed){return frame_laptop(BOX.x,BOX.y,BOX.w,BOX.h,P,mkR(seed),'t1');}

// determinism: same seed twice
const a=run(7), b2=run(7);
const det = a.defs===b2.defs && a.body===b2.body;
console.log('DETERMINISTIC(seed 7, byte-identical):', det);
if(!det){
  console.log('defs equal:',a.defs===b2.defs,'body equal:',a.body===b2.body);
}
// variation sanity: different seed differs
const c=run(8);
console.log('varies with seed:', c.body!==a.body);

function doc(r, wpx){
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+(wpx||BOX.w)+'" height="'+Math.round((wpx||BOX.w)*BOX.h/BOX.w)+'" viewBox="0 0 '+BOX.w+' '+BOX.h+'">'
    +'<defs>'+r.defs+'</defs>'
    +'<rect width="'+BOX.w+'" height="'+BOX.h+'" fill="'+P.ground+'"/>'
    +'<g id="art">'+r.body+'</g>'
    +'<rect x="0.5" y="0.5" width="'+(BOX.w-1)+'" height="'+(BOX.h-1)+'" fill="none" stroke="#FF00FF" stroke-width="1" stroke-dasharray="4 4"/>'
    +'</svg>';
}
function docNoBox(r,wpx){
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+(wpx||BOX.w)+'" height="'+Math.round((wpx||BOX.w)*BOX.h/BOX.w)+'" viewBox="0 0 '+BOX.w+' '+BOX.h+'">'
    +'<defs>'+r.defs+'</defs>'
    +'<rect width="'+BOX.w+'" height="'+BOX.h+'" fill="'+P.ground+'"/>'
    +'<g id="art">'+r.body+'</g></svg>';
}
const seeds=[7,8,21,99,1234];
for(const s of seeds){
  const r=run(s);
  fs.writeFileSync(path.join(D,which+'_s'+s+'.svg'), doc(r));
  fs.writeFileSync(path.join(D,which+'_s'+s+'_clean.svg'), docNoBox(r));
}
fs.writeFileSync(path.join(D,which+'_body.txt'), a.defs+'\n----\n'+a.body);
console.log('bytes defs/body:',a.defs.length,a.body.length);
console.log('has <text>:', /<text/.test(a.defs+a.body));
// colour audit: every hex used must be palette or an interpolation of two palette entries
const pal=Object.values(P).map(v=>v.toLowerCase());
const used=[...new Set((a.defs+a.body).match(/#[0-9a-fA-F]{6}/g)||[])].map(v=>v.toLowerCase()).filter(v=>v!=='#ff00ff');
function h2(c){c=c.slice(1);return [parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16)];}
const bad=[];
for(const u of used){
  if(pal.includes(u))continue;
  const U=h2(u); let ok=false;
  for(let i=0;i<pal.length&&!ok;i++)for(let j=0;j<pal.length&&!ok;j++){
    if(i===j)continue; const A=h2(pal[i]),B=h2(pal[j]);
    for(let t=0;t<=1000;t++){const tt=t/1000;
      if([0,1,2].every(k=>Math.abs(Math.round(A[k]+(B[k]-A[k])*tt)-U[k])<=1)){ok=true;break;}
    }
  }
  if(!ok)bad.push(u);
}
console.log('colours used:',used.join(' '));
console.log('non-palette colours:', bad.length?bad.join(' '):'none');
// decimal audit
const nums=(a.defs+a.body).match(/[0-9]+\.[0-9]{2,}/g)||[];
console.log('numbers with >1 decimal:', [...new Set(nums)].join(' ')||'none');
