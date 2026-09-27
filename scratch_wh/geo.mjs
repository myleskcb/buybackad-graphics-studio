const dir='/Users/admin/Downloads/gfxv23/scratch_wh';
const mod=await import(process.argv[2]||(dir+'/fn.mjs'));
const fn=mod.wall_hills;
function mkR(seed){let s=seed>>>0||1;const rand=()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};
 return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
const sizes=[[400,864],[400,300],[900,320],[300,300],[120,260]];
for(const [W,H] of sizes){
  let n=0,sun=0,ring=0,topCut=0,sideCut=0,botHidden=0,pathOut=0;
  for(let k=0;k<800;k++){
    const r=fn(0,0,W,H,P,mkR(7+k*7919),'g'+k);n++;
    const m=r.body.match(/<circle cx="([-\d.]+)" cy="([-\d.]+)" r="([-\d.]+)"([^>]*)>/);
    if(m){
      sun++;
      const cx=+m[1],cy=+m[2],rr=+m[3],isRing=/stroke-width="([\d.]+)"/.test(m[4]);
      const sw=isRing?+m[4].match(/stroke-width="([\d.]+)"/)[1]:0;
      const outer=rr+sw/2;
      if(isRing)ring++;
      if(cy-outer< -0.05)topCut++;
      if(cx-outer< -0.05||cx+outer>W+0.05)sideCut++;
    }
    // check every path point inside x..x+w horizontally? paths intentionally overhang; check vertical only
    for(const pm of r.body.matchAll(/<path d="([^"]+)"/g)){
      const nums=pm[1].match(/-?\d+\.\d/g).map(Number);
      for(let i=1;i<nums.length;i+=2){ if(nums[i]<-0.05||nums[i]>H+0.05){pathOut++;break;} }
    }
  }
  console.log(`${W}x${H}: cards=${n} sun=${sun} ring=${ring} topCut=${topCut} sideCut=${sideCut} pathVertOut=${pathOut}`);
}
