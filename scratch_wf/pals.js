const fs=require('fs');
const fn=require('/Users/admin/Downloads/gfxv23/scratch_wf/fn.js');
let pals=[];
try{ pals = JSON.parse(fs.readFileSync('/Users/admin/Downloads/gfxv23/spec/palettes.json','utf8')); }catch(e){}
const src=fs.readFileSync('/Users/admin/Downloads/gfxv23/engine/engine.mjs','utf8');
const arr=src.slice(src.indexOf('const PALETTES=['), src.indexOf('/* authored + graded'));
for(const m of arr.matchAll(/\{id:"[^"]+"[^}]*\}/g)){
  try{ pals.push(eval('('+m[0].replace(/(\w+):/g,'"$1":')+')')); }catch(e){}
}
console.log('palettes under test:', pals.length);
function mk(seed){let t=seed>>>0;const rand=()=>{t+=0x6D2B79F5;let z=t;z=Math.imul(z^z>>>15,z|1);z^=z+Math.imul(z^z>>>7,z|61);return((z^z>>>14)>>>0)/4294967296;};
 return{f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const ROLES=['ground','ground2','ink','body','accent','hot','paper','dark'];
let invented=0, crash=0, groundField=0, total=0, lowContrast=0;
function lum(c){const s=c.replace('#','');const v=parseInt(s,16);const ch=[(v>>16&255)/255,(v>>8&255)/255,(v&255)/255];const k=[.2126,.7152,.0722];let L=0;for(let i=0;i<3;i++){const u=ch[i];L+=k[i]*(u<=.04045?u/12.92:Math.pow((u+.055)/1.055,2.4));}return L;}
const cr=(a,b)=>{const A=lum(a),B=lum(b);return (Math.max(A,B)+.05)/(Math.min(A,B)+.05);};
for(const P of pals){
  const ok=new Set(ROLES.map(r=>String(P[r]).toLowerCase()));
  for(const geo of [[0,0,400,864],[0,0,90,195],[0,0,864,400]]) for(let s=1;s<=400;s++){
    total++;
    let r; try{ r=fn(geo[0],geo[1],geo[2],geo[3],P,mk(s),'p'); }catch(e){ crash++; continue; }
    const txt=r.defs+r.body;
    for(const m of txt.matchAll(/#[0-9A-Fa-f]{6}/g)){
      if(!ok.has(m[0].toLowerCase())){ invented++; if(invented<5) console.log('INVENTED HUE',P.id,m[0]); }
    }
    const base=r.body.match(/fill="(#[0-9A-Fa-f]{6})"\/>/)[1];
    if(base.toLowerCase()===String(P.ground).toLowerCase()) groundField++;
    if(cr(base,P.ground)<1.15) lowContrast++;
    const glow=r.defs.match(/stop-color="(#[0-9A-Fa-f]{6})"/)[1];
    if(cr(base,glow)<2.0) lowContrast++;
  }
}
console.log('renders:',total,' crashes:',crash,' invented hues:',invented,' field==ground:',groundField,' weak-contrast cases:',lowContrast);
