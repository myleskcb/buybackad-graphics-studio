const fn = require('/Users/admin/Downloads/gfxv23/.scratch-frame-phone/fn.js');
function mkR(seed){ let s=seed>>>0; const rand=()=>{s=(s*1664525+1013904223)>>>0; return s/4294967296;};
  return {f:(a,b)=>a+(b-a)*rand(), i:(a,b)=>Math.floor(a+(b-a+1)*rand()), pick:a=>a[Math.floor(rand()*a.length)], chance:p=>rand()<p}; }
const P = {ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};

function extents(body){
  let minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;
  const push=(a,b,c,d)=>{minX=Math.min(minX,a);minY=Math.min(minY,b);maxX=Math.max(maxX,c);maxY=Math.max(maxY,d);};
  for(const m of body.matchAll(/<(rect|circle|path)\s([^>]*?)\/>/g)){
    const at=Object.fromEntries([...m[2].matchAll(/([\w-]+)="([^"]*)"/g)].map(k=>[k[1],k[2]]));
    const hs=parseFloat(at['stroke-width']||0)/2;
    if(m[1]==='rect'){ push(+at.x-hs,+at.y-hs,+at.x+ +at.width+hs,+at.y+ +at.height+hs); }
    else if(m[1]==='circle'){ const r=+at.r+hs; push(+at.cx-r,+at.cy-r,+at.cx+r,+at.cy+r); }
    else {
      // only horizontal segments: "Mx y Hx2" repeated. butt caps: no horizontal overshoot.
      const segs=[...at.d.matchAll(/M(-?[\d.]+)\s+(-?[\d.]+)H(-?[\d.]+)/g)];
      for(const q of segs){ const x1=+q[1],y=+q[2],x2=+q[3];
        push(Math.min(x1,x2), y-hs, Math.max(x1,x2), y+hs); }
    }
  }
  return {minX,minY,maxX,maxY};
}
const sizes=[[400,864],[400,400],[300,700],[200,900],[100,216],[60,130],[40,90],[24,52],[16,40],[12,26],[6,13],[800,900],[900,300],[150,150],[3,7],[2,3],[1200,600],[500,1200]];
let bad=[], worst=0, worstDesc='';
for(const [w,h] of sizes){
  for(let s=1;s<=60;s++){
    const r=fn(10,20,w,h,P,mkR(s*7919),'id'+s);
    if(!r.body) continue;
    const e=extents(r.body);
    const over=Math.max(10-e.minX,20-e.minY,e.maxX-(10+w),e.maxY-(20+h));
    if(over>worst){worst=over;worstDesc=w+'x'+h+' seed'+s+' '+JSON.stringify(e);}
    if(over>0.05) bad.push([w,h,s,over.toFixed(3),JSON.stringify(e)]);
    if(/NaN|Infinity|undefined|null/.test(r.body+r.defs)) bad.push([w,h,s,'BAD TOKEN']);
    for(const m of r.body.matchAll(/width="(-?[\d.]+)" height="(-?[\d.]+)"/g)) if(+m[1]<=0||+m[2]<=0) bad.push([w,h,s,'nonpositive dims '+m[0]]);
    for(const m of r.body.matchAll(/ r="(-?[\d.]+)"/g)) if(+m[1]<0) bad.push([w,h,s,'neg r '+m[0]]);
    const r2=fn(10,20,w,h,P,mkR(s*7919),'id'+s);
    if(r2.body!==r.body||r2.defs!==r.defs) bad.push([w,h,s,'NONDETERMINISTIC']);
  }
}
console.log('violations(>0.05px):', bad.length);
bad.slice(0,20).forEach(b=>console.log(b.join(' | ')));
console.log('worst overshoot:', worst.toFixed(3), worstDesc);
