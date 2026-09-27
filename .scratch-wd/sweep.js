const fn=require('/Users/admin/Downloads/gfxv23/.scratch-wd/fn.js');
function mkR(seed){let s=seed>>>0;const rand=()=>{s|=0;s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};
return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
const mono={ground:'#222222',ground2:'#222222',ink:'#222222',body:'#222222',accent:'#222222',hot:'#222222',paper:'#222222',dark:'#222222'};
const two={ground:'#000000',ground2:'#000000',ink:'#ffffff',body:'#ffffff',accent:'#000000',hot:'#ffffff',paper:'#ffffff',dark:'#000000'};
const messy={ground:'0E253C',ground2:'#1b3',ink:'#D4DFEB',body:null,accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
const boxes=[[0,0,400,864],[0,0,100,100],[37.3,912.6,326,180],[0,0,8,8],[0,0,900,120],[-50,-20,400,400]];
let fails=[];
function check(tag,res,box){
  const s=res.defs+res.body;
  if(/NaN|undefined|null|Infinity/.test(s)) fails.push(tag+' NaN/undefined: '+s.slice(0,200));
  if(/<text|<image|href=|data:/.test(s)) fails.push(tag+' forbidden node');
  if(/<svg|<defs/.test(s)) fails.push(tag+' wrapper');
  const ids=(s.match(/id="([^"]+)"/g)||[]);
  if(!ids.length) fails.push(tag+' no ids');
  const nums=(s.match(/(?:^|\s)(?:x|y|width|height)="(-?[\d.]+)"/g)||[]);
  for(const nn of nums){const v=nn.split('"')[1]; if(!/^-?\d+\.\d$/.test(v)) fails.push(tag+' num not 1dp: '+nn);}
  const cols=[...new Set((s.match(/(?:fill|stop-color)="(#[0-9a-f]{6})"/g)||[]).map(t=>t.split('"')[1]))];
  return cols;
}
const palettes={P,mono,two,messy};
for(const [pn,pal] of Object.entries(palettes)){
  for(const box of boxes){
    for(let seed=1;seed<=400;seed++){
      let res;
      const tag=pn+' '+box.join(',')+' s'+seed;
      try{ res=fn(box[0],box[1],box[2],box[3],pal,mkR(seed),'id'+seed); }
      catch(e){ fails.push(tag+' THREW '+e.message); continue; }
      if(!res||typeof res.defs!=='string'||typeof res.body!=='string'){fails.push(tag+' bad shape');continue;}
      check(tag,res,box);
      // determinism
      const r2=fn(box[0],box[1],box[2],box[3],pal,mkR(seed),'id'+seed);
      if(r2.defs!==res.defs||r2.body!==res.body) fails.push(tag+' NONDETERMINISTIC');
      // adjacent duplicate stripe colours
      const st=(res.body.match(/fill="(#[0-9a-f]{6})"/g)||[]).map(t=>t.split('"')[1]);
      for(let i=1;i<st.length;i++) if(st[i]===st[i-1]) fails.push(tag+' adjacent dup stripe '+st[i]);
    }
  }
}
console.log('failures:',fails.length);
console.log(fails.slice(0,25).join('\n'));
