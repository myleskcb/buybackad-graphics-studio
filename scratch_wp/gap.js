const puppeteer=require('/Users/admin/Downloads/gfxv23/node_modules/puppeteer-core');
const {wall_poly}=require('./fn2.js');
function mkR(seed){let s=(seed>>>0)||1;const rand=()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};
 return {f:(a,b)=>a+(b-a)*rand(),i:(a,b)=>Math.floor(a+(b-a+1)*rand()),pick:a=>a[Math.floor(rand()*a.length)],chance:p=>rand()<p};}
const P={ground:'#0E253C',ground2:'#1B3A5C',ink:'#D4DFEB',body:'#8FA6BE',accent:'#FCACA5',hot:'#7FD8C0',paper:'#F5F8FB',dark:'#050C18'};
(async()=>{
 const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox'],headless:'new'});
 const p=await b.newPage(); await p.setViewport({width:440,height:920});
 let worstGap=0, worstSeed=0;
 for(let s=1;s<=8;s++){
  const o=wall_poly(20,20,400,864,P,mkR(s*7777),'g'+s);
  // strip the backing rect so any un-tiled sliver shows as magenta
  const bodyNoBg=o.body.replace(/<rect[^>]*fill="#[0-9a-f]{6}"\/>/i,'');
  await p.setContent(`<body style="margin:0;background:#FF00FF"><svg xmlns="http://www.w3.org/2000/svg" width="440" height="904" viewBox="0 0 440 904"><defs>${o.defs}</defs>${bodyNoBg}</svg></body>`);
  await new Promise(r=>setTimeout(r,120));
  const buf=await p.screenshot({encoding:'base64'});
  const n=await p.evaluate(async d=>{const im=new Image();im.src='data:image/png;base64,'+d;await im.decode();
   const cv=document.createElement('canvas');cv.width=im.width;cv.height=im.height;const cx=cv.getContext('2d');cx.drawImage(im,0,0);
   const q=cx.getImageData(20,20,400,864).data;let bad=0;for(let i=0;i<q.length;i+=4){if(q[i]>200&&q[i+1]<60&&q[i+2]>200)bad++;}return bad;},buf);
  if(n>worstGap){worstGap=n;worstSeed=s;}
  console.log('seed',s,'magenta pixels inside the box (gaps):',n,'of',400*864);
 }
 // extreme aspect + bleed check
 const o=wall_poly(20,20,400,60,P,mkR(4242),'x1');
 await p.setContent(`<body style="margin:0;background:#FF00FF"><svg xmlns="http://www.w3.org/2000/svg" width="440" height="100" viewBox="0 0 440 100"><defs>${o.defs}</defs>${o.body}</svg></body>`);
 await new Promise(r=>setTimeout(r,120));
 await p.screenshot({path:'wide.png',clip:{x:0,y:0,width:440,height:100}});
 console.log('worst gap seed',worstSeed,worstGap);
 await b.close();
})();
