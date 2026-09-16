// replicates the fixed geometry to assert no lens/lens and no tab/pad collisions
function mk(seed){let t=seed>>>0;const rand=()=>{t+=0x6D2B79F5;let r=t;r=Math.imul(r^r>>>15,r|1);r^=r+Math.imul(r^r>>>7,r|61);return((r^r>>>14)>>>0)/4294967296;};
 return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
let worstLens=1e9, worstTab=1e9, bad=[];
for (const [w,h] of [[400,864],[100,216],[160,346],[280,600],[560,200],[300,300],[240,700],[700,240]])
for (let sd=0; sd<400; sd++){
  const R=mk(sd), m=Math.min(w,h), x=0,y=0;
  const s1=Math.max(1,m*.016), s2=Math.max(.75,m*.010);
  const fl=R.chance(.5); const X=u=>x+w*(fl?1-u:u), Y=v=>y+h*v;
  const BX=(u0,v0,u1,v1)=>{const a=X(u0),b=X(u1);return{x:Math.min(a,b),y:Y(v0),w:Math.abs(b-a),h:(v1-v0)*h};};
  const bV1=R.f(.375,.43), btV=R.f(.505,.55);
  for(let i=0;i<4;i++) R.chance(.72);                     // chip draws
  const cm=BX(.63,.085,.925,.30);
  const vert=cm.h>=cm.w, nl=R.i(2,3);
  const span=vert?cm.h:cm.w, cross=vert?cm.w:cm.h;
  const lr=Math.min(cross*.30, span/(nl+1)*.42);
  const cs=[];
  for(let i=0;i<nl;i++){const t=(i+1)/(nl+1);
    cs.push([vert?cm.x+cm.w*.40:cm.x+cm.w*t, vert?cm.y+cm.h*t:cm.y+cm.h*.44]);}
  for(let i=0;i<cs.length;i++)for(let j=i+1;j<cs.length;j++){
    const d=Math.hypot(cs[i][0]-cs[j][0],cs[i][1]-cs[j][1]) - (2*lr+s2);
    if(d<worstLens){worstLens=d;globalThis.WL=[w,h,sd,nl,vert];} if(d<0) bad.push(['lens',w,h,sd,d.toFixed(2)]);
  }
  // lens must sit inside the module
  for(const c of cs){ const r=lr+s2/2;
    if(c[0]-r<cm.x-.01||c[0]+r>cm.x+cm.w+.01||c[1]-r<cm.y-.01||c[1]+r>cm.y+cm.h+.01) bad.push(['lens-out',w,h,sd]);}
  const bt=BX(.10,btV,.90,.895);
  const tw=bt.w*.085, th=Math.max(1.4,m*.026);
  const tabs=[0,1].map(i=>({x:bt.x+bt.w*(.415+i*.125), y:bt.y-th, w:tw, h:th}));
  const pd=Math.max(1.2,m*.034);
  const pads=[[X(.20),Y(bV1)],[X(.47),Y(bV1)],[X(.33),Y(btV)],[X(.71),Y(btV)],[X(.88),Y(.30)],[X(.80),Y(btV)]]
    .map(p=>({x:p[0]-pd/2,y:p[1]-pd/2,w:pd,h:pd}));
  const gap=(a,b)=>Math.max(b.x-(a.x+a.w), a.x-(b.x+b.w), b.y-(a.y+a.h), a.y-(b.y+b.h));
  for(const t of tabs) for(const p of pads){ const g=gap(t,p); if(g<worstTab) worstTab=g; if(g<0) bad.push(['tab/pad',w,h,sd,g.toFixed(2)]); }
  // pads must not collide with each other
  for(let i=0;i<pads.length;i++)for(let j=i+1;j<pads.length;j++){ if(gap(pads[i],pads[j])< -0.01) bad.push(['pad/pad',w,h,sd,i,j]); }
}
console.log('worst lens-to-lens gap (px, >0 = clear):', worstLens.toFixed(2));
console.log('worst tab-to-pad gap  (px, >0 = clear):', worstTab.toFixed(2));
console.log('collisions found:', bad.length); console.log('worst lens case (w,h,seed,nl,vert):', globalThis.WL);
