const puppeteer=require('/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core');
const fs=require('fs');
(async()=>{
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox'],headless:'new'});
const p=await b.newPage();await p.setViewport({width:900,height:700});
await p.setContent('<body style="margin:0"></body>');
const svg=fs.readFileSync('sheet.svg','utf8');
const r=await p.evaluate(async(svg)=>{
 const img=new Image();
 await new Promise((ok,no)=>{img.onload=ok;img.onerror=no;img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);});
 const cw=img.width,ch=img.height;
 const c=document.createElement('canvas');c.width=cw;c.height=ch;
 const g=c.getContext('2d');g.drawImage(img,0,0);
 const d=g.getImageData(0,0,cw,ch).data;
 const TW=100,TH=216,G=8,rows=3,cols=8;
 const inTile=(x,y)=>{for(let ri=0;ri<rows;ri++)for(let i=0;i<cols;i++){const tx=G+i*(TW+G),ty=G+ri*(TH+G);
   if(x>=tx&&x<tx+TW&&y>=ty&&y<ty+TH)return true;}return false;};
 let bleed=[],cnt=0;
 for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){
  if(inTile(x,y))continue;
  const o=(y*cw+x)*4;
  if(!(d[o]>250&&d[o+1]<5&&d[o+2]>250)){cnt++;if(bleed.length<12)bleed.push([x,y,d[o],d[o+1],d[o+2]]);}
 }
 return {cw,ch,cnt,bleed};
},svg);
console.log(JSON.stringify(r));
await b.close();})();
