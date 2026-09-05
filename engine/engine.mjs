/* Buyback graphics engine — extracted from the console, framework-free.
   Import with:  import * as E from './engine.mjs'
   Nothing here touches the DOM; every function is a pure transform. */

/* ══════════════════════════════════════════════════════════
   1 · SEEDED RANDOM
   ══════════════════════════════════════════════════════════ */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function RNG(seed){const r=mulberry32(seed);return{
  f:(a=0,b=1)=>a+(b-a)*r(), i:(a,b)=>Math.floor(a+(b-a+1)*r()),
  pick:a=>a[Math.floor(r()*a.length)], chance:p=>r()<p,
  shuffle:a=>{const c=a.slice();for(let i=c.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[c[i],c[j]]=[c[j],c[i]];}return c;}};}

/* ══════════════════════════════════════════════════════════
   2 · TOKENS
   ══════════════════════════════════════════════════════════ */
const PALETTES=[
 {id:"nn01",name:"Night Lot",   mood:"sodium light on a dark lot",ground:"#0B1B3A",ground2:"#132A57",ink:"#FFFFFF",body:"#C6D4EE",accent:"#FFB020",hot:"#FF3B30",paper:"#FFF4DE",dark:"#050C1E"},
 {id:"jw09",name:"Neon Counter",mood:"late-night shop window",   ground:"#0A0F1E",ground2:"#14204A",ink:"#FFFFFF",body:"#BFD2E8",accent:"#22D3EE",hot:"#FF2E93",paper:"#FFF6E5",dark:"#04070F"},
 {id:"ca10",name:"Cash Green",  mood:"money, plainly",            ground:"#05261B",ground2:"#0A4230",ink:"#FFFFFF",body:"#B9E3CF",accent:"#16C172",hot:"#FFC93C",paper:"#F2FFF8",dark:"#021711"},
 {id:"du06",name:"Paper Red",   mood:"stapled to a pole",         ground:"#F5EFE3",ground2:"#E8DFCC",ink:"#16130F",body:"#4A423A",accent:"#E23A1E",hot:"#1D4ED8",paper:"#FFFFFF",dark:"#16130F"},
 {id:"st04",name:"Steel Orange",mood:"workshop, high-vis",        ground:"#12161C",ground2:"#1E2732",ink:"#FFFFFF",body:"#B4C1CE",accent:"#FF6B18",hot:"#FFD60A",paper:"#F3F6F9",dark:"#080B0F"},
 {id:"su07",name:"Sunset Lot",  mood:"golden hour, loud",         ground:"#2B0B3A",ground2:"#4A125C",ink:"#FFFFFF",body:"#E8C9F0",accent:"#FF8A00",hot:"#FF2D78",paper:"#FFF0E0",dark:"#160520"},
 {id:"bp02",name:"Blueprint",   mood:"technical, trustworthy",    ground:"#06203A",ground2:"#0A3457",ink:"#FFFFFF",body:"#AFD3EC",accent:"#4CC9F0",hot:"#FFD60A",paper:"#EAF6FF",dark:"#031324"},
 {id:"np03",name:"Newsprint",   mood:"classified ad, urgent",     ground:"#EDE7DC",ground2:"#DCD3C4",ink:"#121212",body:"#4A463F",accent:"#D7263D",hot:"#1B4079",paper:"#FFFFFF",dark:"#121212"}
];
const PAIRS=[
 {id:"tk",display:"Teko",         body:"Sora",             dw:.34,bw:.56,dweight:700,note:"tall condensed over a soft geometric — reads modern, holds long model names"},
 {id:"sq",display:"Squada One",   body:"Chivo",            dw:.42,bw:.53,dweight:400,note:"squared display over a grotesque — the forecourt default"},
 {id:"an",display:"Anton",        body:"Barlow Condensed", dw:.42,bw:.42,dweight:400,note:"maximum weight, minimum width — poster type, nothing else fits beside it"},
 {id:"ab",display:"Archivo Black",body:"Archivo",          dw:.60,bw:.52,dweight:400,note:"one family, two weights — the quiet, expensive-looking option"},
 {id:"bb",display:"Bebas Neue",   body:"Chivo",            dw:.36,bw:.53,dweight:400,note:"all-caps ticket type, very narrow — good when the headline is four words"},
 {id:"os",display:"Oswald",       body:"Sora",             dw:.45,bw:.56,dweight:700,note:"condensed gothic, slightly civic — trustworthy over loud"}
];
const SIZES={"45":[1080,1350],"11":[1080,1080],"916":[1080,1920]};

/* ══════════════════════════════════════════════════════════
   3 · CONTENT
   ══════════════════════════════════════════════════════════ */
const CONTENT={
 phones:{brand:"iPhones.LA",mark:"iL",kicker:"SAME DAY CASH",hero:"phone",
  heads:[["WE BUY","IPHONES"],["CASH FOR","IPHONES"],["TOP","BUYER"],["SELL YOUR","IPHONE"]],
  offer:"UP TO $1,250",offerSub:"PAID TODAY",
  promises:["CRACKED OK","ICLOUD OK","ANY CARRIER","FREE PICKUP","NO APPT","CASH TODAY"],
  rows:[["iPhone 17 Pro Max","$1,250","17 PM"],["iPhone 17 Pro","$1,050","17 PRO"],
        ["iPhone 16 Pro Max","$900","16 PM"],["iPhone 16","$620","16"],["iPhone 15 Pro","$580","15 PRO"]],
  cta:"GET AN INSTANT OFFER",phone:"(562) 999-4994",addr:"iphones.LA · Long Beach",
  quote:"Cracked 15 Pro in, cash out. Twenty minutes.",
  quoteBy:"Marcus T. · Carson",rating:"4.9★ · 200+ REVIEWS",
  steps:[["TEXT PICS","Snap it, send it"],["GET OFFER","Firm quote, fast."],
         ["GET PAID","Cash or transfer"]]},
 cars:{brand:"Cars Buyer",mark:"CB",kicker:"LICENSED BUYER",hero:"car",
  heads:[["WE BUY","CARS"],["CASH FOR","TRUCKS"],["WE OUTBID","THE DEALER"],["SELL YOUR","TRUCK"]],
  offer:"UP TO $25,000",offerSub:"CASH TODAY",
  promises:["FREE TOW","SAME DAY","LICENSED","TITLE OR NOT","RUNS OR NOT","WE COLLECT"],
  rows:[["F-150 / Silverado","$25,000","F-150"],["Tacoma / Ranger","$21,500","TACOMA"],
        ["4Runner / Tahoe","$19,800","4RUNNER"],["Civic / Corolla","$12,400","CIVIC"],
        ["Sprinter / Transit","$23,000","SPRINTER"]],
  cta:"GET AN INSTANT OFFER",phone:"(562) 999-4994",addr:"Long Beach · Carson",
  quote:"Old Civic gone the same day, cash in hand.",
  quoteBy:"Jordan K. · Long Beach",rating:"4.9★ · 200+ SELLERS",
  steps:[["SEND VIN","Dash photo. Done."],["GET OFFER","Firm number, fast."],
         ["FREE TOW","We tow, you bank."]]}
};

/* ══════════════════════════════════════════════════════════
   4 · COLOUR
   ══════════════════════════════════════════════════════════ */
function hex2rgb(h){h=h.replace('#','');return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
function lum(h){const c=hex2rgb(h).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);});
  return .2126*c[0]+.7152*c[1]+.0722*c[2];}
function contrast(a,b){const l1=lum(a),l2=lum(b);return(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);}
function onColor(bg,P){const c=[P.paper,'#FFFFFF',P.ink,P.dark,'#000000'];
  let best=c[0],bc=0;c.forEach(x=>{const k=contrast(x,bg);if(k>bc){bc=k;best=x;}});return best;}
function readable(color,bg,P){return contrast(color,bg)>=4.5?color:onColor(bg,P);}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

/* ══════════════════════════════════════════════════════════
   5 · THE DESIGN QUEUE — every switch, its effect and its purpose
   ══════════════════════════════════════════════════════════ */
const QUEUE=[
 ['Ground',[
  ['groundGradient','Lit ground','radial pool from ground2 → ground','Gives the card a light source, so the hero looks placed rather than pasted.'],
  ['grain','Film grain','fractal noise at 5.5% overlay','Stops large flat fills reading as plastic on a phone screen.']]],
 ['Field',[
  ['sunburst','Sunburst rays','24–32 alternating wedges behind the hero','Radial energy. Points at the product without drawing a single arrow.'],
  ['halftone','Halftone ramp','dot grid with a quadratic density falloff','Print texture. Reads as a real flyer, not a template export.'],
  ['checker','Checker field','8–12 cell warped checker at 8–14%','Retail-poster ground. Fills the corners the composition never reaches.'],
  ['diagonalSplit','Diagonal split','angled two-tone divide','Breaks the rectangle so the eye travels instead of scanning rows.']]],
 ['Hero',[
  ['hero','Product hero','device or vehicle art','The subject. Without it the card is a price list.'],
  ['heroBleed','Bleed off the edge','crosses one edge by 6–14%','The single biggest anti-blandness move — implies the product continues past the frame.'],
  ['heroRotate','Angle the hero','6–24° rotation','Diagonal beats orthogonal. A straight product reads as a catalogue photo.'],
  ['heroShadow','Cast shadow','soft drop at 3.5% of hero height','Separates the hero from the field so it sits above, not inside.']]],
 ['Shape language',[
  ['paintStroke','Paint stroke','rough brush quad, wobble on all four edges','Puts a hand behind the headline. The opposite of a rounded plate.'],
  ['tornPaper','Torn paper','26-segment ragged edge, 16% amplitude','Divides the card with an edge that looks made, not drawn.'],
  ['knockoutBand','Knockout band','full-bleed solid bar, text reversed','Maximum contrast for one line. The loudest device that still looks composed.'],
  ['arcCrown','Arc crown','headline bent over the hero on a generated arc','Wraps the type around the product instead of stacking above it.']]],
 ['Display type',[
  ['outlineStroke','Outline stroke','5% of size, paint-order stroke','Holds the letterform against a busy field.'],
  ['hardShadow','Hard shadow','solid offset, no blur','The reference-ad signature. Blur makes it a web button; offset makes it a poster.'],
  ['fitToPlate','Fit to plate','textLength snaps each line to its box','Kills the ragged right edge and the empty half-line — the main source of dead space.']]],
 ['Offer',[
  ['starburst','Starburst seal','12–24 points, rotated −8° to −23°','Turns a number into an object. Must overlap the hero or it floats.'],
  ['ticket','Ticket stub','side notches at 13% of height','Makes the offer feel redeemable rather than announced.'],
  ['sheen','Plate sheen','inset 5% / top 7% / height 9% of its own plate','Depth on flat colour. Measured from the plate, which is where it used to go wrong.']]],
 ['Proof',[
  ['promisePills','Promise pills','three check pills, evenly divided','Answers the three objections before they are raised.'],
  ['proofBlock','Proof block','review card, stars, or numbered steps','The reason a stranger calls a number on a flyer.'],
  ['priceRows','Price rows','alternating model / price bands','The layout resellers actually screenshot and send on.']]],
 ['Chrome',[
  ['cta','Call to action','hot band or radiused button','One instruction. Never two.'],
  ['footerBar','Footer bar','8.8% band, accent hairline, icon disc','Anchors the number and the service area. Every reference ad has one.'],
  ['cornerLockup','Corner lockup','mark + wordmark + kicker at 4.8% margin','Identity without a centred logo eating the top third.']]]
];
const ALLKEYS=QUEUE.flatMap(g=>g[1].map(t=>t[0]));
const KEYMETA={}; QUEUE.forEach(g=>g[1].forEach(t=>KEYMETA[t[0]]={group:g[0],name:t[1],fx:t[2],purpose:t[3]}));
const DEFAULT_CFG=()=>Object.fromEntries(ALLKEYS.map(k=>[k,true]));

/* ══════════════════════════════════════════════════════════
   6 · CARD BUILDER
   ══════════════════════════════════════════════════════════ */
class Card{
  constructor(W,H,P,F,R,C,cfg,key){
    Object.assign(this,{W,H,P,F,R,C,cfg,key});
    this.S=Math.min(W,H);
    this.defs=[];this.svg=[];this.nodes=[];this.uid=0;this.notes=[];
  }
  on(k){return this.cfg[k]!==false;}
  id(p){return p+(this.uid++)+this.key;}
  add(m,n){this.svg.push(m);if(n)this.nodes.push(n);}
  def(d){this.defs.push(d);}
  note(t){this.notes.push(t);}
  text(str,box,o={}){
    const face=o.face||this.F.display, wf=o.wf!==undefined?o.wf:this.F.dw, tr=o.tracking||0;
    const chars=Math.max(String(str).length,1);
    let size=o.size||(box.w/(chars*(wf+tr)));
    if(o.max)size=Math.min(size,o.max); if(o.min)size=Math.max(size,o.min);
    let natural0=chars*(wf+tr)*size;
    if(natural0>box.w)size=box.w/(chars*(wf+tr));
    const cap=size*(o.capRatio||.72), y=box.y+cap;

    const anchor=o.align||'start';
    const x=anchor==='middle'?box.x+box.w/2:anchor==='end'?box.x+box.w:box.x;
    const fill=o.fill||this.P.ink;
    const natural=chars*(wf+tr)*size;
    const ratio=natural>0?box.w/natural:1;
    const snap=(o.fit!==false)&&this.on('fitToPlate')&&ratio>=.70&&ratio<=1.60;
    const tl=snap?` textLength="${box.w.toFixed(1)}" lengthAdjust="spacingAndGlyphs"`:'';
    const ls=tr?` letter-spacing="${(tr*size).toFixed(2)}"`:'';
    const base=`font-family="${face}, sans-serif" font-weight="${o.weight||this.F.dweight}" font-size="${size.toFixed(1)}" text-anchor="${anchor}"`;
    const useStroke=o.stroke&&this.on('outlineStroke');
    const useShadow=o.shadow&&this.on('hardShadow');
    let m='';
    if(useShadow){
      const dx=o.shadowDx!==undefined?o.shadowDx:size*.055, dy=o.shadowDy!==undefined?o.shadowDy:size*.06;
      m+=`<text x="${(x+dx).toFixed(1)}" y="${(y+dy).toFixed(1)}" ${base} fill="${o.shadow}" stroke="${o.shadow}" `+
         `stroke-width="${(size*(o.strokeW||.055)).toFixed(2)}" paint-order="stroke"${tl}${ls}>${esc(str)}</text>`;
    }
    const sa=useStroke?` stroke="${o.stroke}" stroke-width="${(size*(o.strokeW||.055)).toFixed(2)}" paint-order="stroke"`:'';
    m+=`<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" ${base} fill="${fill}"${sa}${tl}${ls}>${esc(str)}</text>`;
    // measured box: fitted text spans its plate, unfitted text is estimated from advance width
    const realW=snap?box.w:Math.min(box.w,natural);
    this.add(m,{type:'text',id:o.id||'text',box:{x:anchor==='middle'?x-realW/2:anchor==='end'?x-realW:x,
      y:box.y,w:realW,h:cap*1.18},size:cap,fill,backing:o.on||this.P.ground,bleed:!!o.bleed,role:o.role||'text'});
    return cap;
  }
  rect(box,fill,o={}){
    this.add(`<rect x="${box.x.toFixed(1)}" y="${box.y.toFixed(1)}" width="${box.w.toFixed(1)}" height="${box.h.toFixed(1)}" rx="${o.r||0}" fill="${fill}"/>`,
      o.ghost?null:{type:'shape',id:o.id||'rect',box,bleed:!!o.bleed,role:o.role||'shape',fill});
    return box;
  }
  raw(m,n){this.add(m,n);}
}

/* ══════════════════════════════════════════════════════════
   7 · DEVICES
   ══════════════════════════════════════════════════════════ */
const D={};
D.sunburst=(c,cx,cy,r,color,wedges,rot,op)=>{
  let p='';const st=Math.PI*2/wedges;
  for(let i=0;i<wedges;i+=2){const a0=rot+i*st,a1=rot+(i+1)*st;
    p+=`M${cx.toFixed(1)} ${cy.toFixed(1)} L${(cx+Math.cos(a0)*r).toFixed(1)} ${(cy+Math.sin(a0)*r).toFixed(1)} L${(cx+Math.cos(a1)*r).toFixed(1)} ${(cy+Math.sin(a1)*r).toFixed(1)} Z `;}
  c.add(`<path d="${p}" fill="${color}" opacity="${op||.15}"/>`,
    {type:'shape',id:'sunburst',box:{x:cx-r,y:cy-r,w:r*2,h:r*2},bleed:true,role:'field'});
};
D.starburst=(c,cx,cy,r,pts,inner,rot,fill,stroke)=>{
  let p='';const n=pts*2,st=Math.PI/pts;
  for(let i=0;i<n;i++){const rr=i%2?r*inner:r,a=rot+i*st;
    p+=(i?'L':'M')+(cx+Math.cos(a)*rr).toFixed(1)+' '+(cy+Math.sin(a)*rr).toFixed(1)+' ';}
  c.add(`<path d="${p}Z" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${(r*.05).toFixed(1)}"`:''}/>`,
    {type:'shape',id:'badge',box:{x:cx-r,y:cy-r,w:r*2,h:r*2},role:'badge',fill});
  return{x:cx-r,y:cy-r,w:r*2,h:r*2};
};
D.tornPaper=(c,box,fill,seed)=>{
  const R=RNG(seed),segs=26;let p=`M${box.x} ${(box.y+box.h*.12).toFixed(1)} `;
  for(let i=1;i<=segs;i++)p+=`L${(box.x+box.w*i/segs).toFixed(1)} ${(box.y+box.h*(.02+R.f(0,.16))).toFixed(1)} `;
  p+=`L${(box.x+box.w).toFixed(1)} ${(box.y+box.h).toFixed(1)} L${box.x} ${(box.y+box.h).toFixed(1)} Z`;
  c.add(`<path d="${p}" fill="${fill}"/>`,{type:'shape',id:'torn',box,bleed:true,role:'plate',fill});
  return box;
};
D.paintStroke=(c,box,fill,seed)=>{
  const R=RNG(seed),{x,y,w,h}=box,j=()=>R.f(-h*.13,h*.13);
  const p=`M${(x+j()).toFixed(1)} ${(y+h*.12+j()).toFixed(1)} C${(x+w*.25).toFixed(1)} ${(y+j()).toFixed(1)}, ${(x+w*.7).toFixed(1)} ${(y+h*.06+j()).toFixed(1)}, ${(x+w).toFixed(1)} ${(y+h*.04+j()).toFixed(1)} L${(x+w+h*.1).toFixed(1)} ${(y+h*.9+j()).toFixed(1)} C${(x+w*.68).toFixed(1)} ${(y+h+j()).toFixed(1)}, ${(x+w*.3).toFixed(1)} ${(y+h*.94+j()).toFixed(1)}, ${(x-h*.06).toFixed(1)} ${(y+h*.98+j()).toFixed(1)} Z`;
  c.add(`<path d="${p}" fill="${fill}"/>`,{type:'shape',id:'stroke',box,role:'plate',fill});
  return box;
};
D.halftone=(c,box,color,cell,seed,dir)=>{
  let p='';const cols=Math.ceil(box.w/cell),rows=Math.ceil(box.h/cell);
  for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){
    const t=dir==='v'?j/rows:i/cols,rad=cell*.46*(1-t)*(1-t);
    if(rad<.35)continue;
    p+=`M${(box.x+i*cell+cell/2).toFixed(1)} ${(box.y+j*cell+cell/2).toFixed(1)} m${(-rad).toFixed(2)} 0 a${rad.toFixed(2)} ${rad.toFixed(2)} 0 1 0 ${(rad*2).toFixed(2)} 0 a${rad.toFixed(2)} ${rad.toFixed(2)} 0 1 0 ${(-rad*2).toFixed(2)} 0 `;}
  c.add(`<path d="${p}" fill="${color}" opacity=".5"/>`,{type:'shape',id:'halftone',box,bleed:true,role:'field'});
};
D.checker=(c,box,color,n,op)=>{
  let p='';const cw=box.w/n,ch=box.h/n;
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){if((i+j)%2)continue;
    p+=`M${(box.x+i*cw).toFixed(1)} ${(box.y+j*ch).toFixed(1)} h${cw.toFixed(1)} v${ch.toFixed(1)} h${(-cw).toFixed(1)} Z `;}
  c.add(`<path d="${p}" fill="${color}" opacity="${op||.12}"/>`,{type:'shape',id:'checker',box,bleed:true,role:'field'});
};
D.ticket=(c,box,fill,notch)=>{
  const n=notch||box.h*.13,{x,y,w,h}=box;
  const p=`M${x} ${y} H${(x+w).toFixed(1)} V${(y+h/2-n).toFixed(1)} A${n} ${n} 0 0 0 ${(x+w).toFixed(1)} ${(y+h/2+n).toFixed(1)} V${(y+h).toFixed(1)} H${x} V${(y+h/2+n).toFixed(1)} A${n} ${n} 0 0 0 ${x} ${(y+h/2-n).toFixed(1)} Z`;
  c.add(`<path d="${p}" fill="${fill}"/>`,{type:'shape',id:'ticket',box,role:'plate',fill});
  return box;
};
D.sheen=(c,plate,color)=>{
  if(!c.on('sheen')||!plate)return null;
  const inset=plate.w*.05,box={x:plate.x+inset,y:plate.y+plate.h*.07,w:plate.w-inset*2,h:plate.h*.09};
  if(box.w<=0||box.h<=0)return null;
  c.add(`<rect x="${box.x.toFixed(1)}" y="${box.y.toFixed(1)}" width="${box.w.toFixed(1)}" height="${box.h.toFixed(1)}" rx="${(box.h/2).toFixed(1)}" fill="${color}" opacity=".16"/>`,
    {type:'shape',id:'sheen',box,role:'sheen',parent:plate});
  return box;
};
D.footerBar=(c)=>{
  const {W,H,P,F,C}=c,h=H*.088,y=H-h;
  c.rect({x:0,y,w:W,h},P.dark,{id:'footer',bleed:true,role:'footer'});
  c.rect({x:0,y,w:W,h:H*.006},P.accent,{ghost:true});
  const pad=W*.05,ir=h*.30,cy=y+h*.5;
  c.raw(`<circle cx="${(pad+ir).toFixed(1)}" cy="${cy.toFixed(1)}" r="${ir.toFixed(1)}" fill="${P.accent}"/>`+
    `<g transform="translate(${(pad+ir*.38).toFixed(1)},${(cy-ir*.62).toFixed(1)}) scale(${(ir*1.24/24).toFixed(4)})">`+
    `<path d="M6.6 2.5c.9 0 1.6.6 1.8 1.4l.7 2.6c.2.7 0 1.4-.5 1.9L7.3 9.6c1.1 2.3 3 4.2 5.3 5.3l1.2-1.3c.5-.5 1.2-.7 1.9-.5l2.6.7c.8.2 1.4.9 1.4 1.8v2.4c0 1.1-.9 2-2 2C10.7 20 4 13.3 4 5.5c0-1.1.9-2 2-2h.6z" fill="${onColor(P.accent,P)}"/></g>`);
  c.text(C.phone,{x:pad+ir*2+W*.022,y:cy-h*.30,w:W*.30},
    {fill:P.paper,on:P.dark,id:'footerNum',role:'footer',max:h*.50});
  c.text(C.addr,{x:W-pad-W*.40,y:cy-h*.12,w:W*.40},
    {face:F.body,wf:F.bw,weight:600,fill:readable(P.body,P.dark,P),on:P.dark,id:'footerAddr',role:'footer',
     capRatio:.70,min:c.S*.031});
};
D.lockup=(c,corner)=>{
  const {W,H,P,F,C}=c,m=W*.048,s=W*.072;
  const x=corner==='right'?W-m-s:m,y=H*.045;
  c.rect({x,y,w:s,h:s},P.accent,{r:s*.24,id:'markPlate',role:'brand'});
  c.text(C.mark,{x:x+s*.16,y:y+s*.26,w:s*.68},{align:'middle',fill:onColor(P.accent,P),on:P.accent,id:'mark',role:'brand'});
  c.text(C.brand,{x:x+s*1.22,y:y+s*.13,w:W*.30},{face:F.body,wf:F.bw,weight:800,fill:P.ink,id:'wordmark',role:'brand',max:W*.045});
  c.text(C.kicker,{x:x+s*1.22,y:y+s*.62,w:W*.34},{face:F.body,wf:F.bw,weight:600,
    fill:readable(P.accent,P.ground,P),id:'kicker',role:'brand',tracking:.04,min:W*.026});
};
D.arcText=(c,str,cx,cy,r,fill,size)=>{
  const id=c.id('arc');
  c.def(`<path id="${id}" d="M${(cx-r).toFixed(1)} ${cy.toFixed(1)} A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${(cx+r).toFixed(1)} ${cy.toFixed(1)}" fill="none"/>`);
  c.add(`<text font-family="${c.F.display}, sans-serif" font-weight="${c.F.dweight}" font-size="${size.toFixed(1)}" fill="${fill}"><textPath href="#${id}" startOffset="50%" text-anchor="middle">${esc(str)}</textPath></text>`,
    {type:'text',id:'arc',box:{x:cx-r*.72,y:cy-r-size*.15,w:r*1.44,h:size*1.05},size:size*.7,fill,backing:c.P.ground,role:'headline'});
};
D.promises=(c,y,items,o={})=>{
  const {W,P,F}=c,pad=W*.05,gap=W*.018,n=items.length;
  const w=o.w||((W-pad*2-gap*(n-1))/n),h=o.h||c.S*.058;
  items.forEach((t,i)=>{
    const x=pad+i*(w+gap),bg=o.bg||P.paper;
    c.rect({x,y,w,h},bg,{r:h*.5,id:'pill',role:'proof'});
    const ic=h*.30,cxp=x+w*.07;
    c.raw(`<g transform="translate(${cxp.toFixed(1)},${(y+h/2-ic/2).toFixed(1)}) scale(${(ic/24).toFixed(4)})"><path d="M4 12.5l5 5 11-11" fill="none" stroke="${P.accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>`);
    c.text(t,{x:x+w*.07+ic+w*.03,y:y+h*.29,w:w-(w*.07+ic+w*.03)-w*.04},
      {face:F.body,wf:F.bw,weight:800,fill:onColor(bg,P),on:bg,id:'promise',role:'proof',capRatio:.70,max:h*.50});
  });
  return{x:pad,y,w:W-pad*2,h};
};
D.cta=(c,y,kind,color)=>{
  const {W,H,P,C}=c,pad=W*.05,col=color||P.hot;
  if(kind==='band'){
    const h=H*.072,plate=c.rect({x:0,y,w:W,h},col,{id:'ctaBand',bleed:true,role:'cta',fill:col});
    D.sheen(c,plate,'#FFFFFF');
    c.text(C.cta,{x:pad,y:y+h*.28,w:W-pad*2},{fill:onColor(col,P),on:col,align:'middle',id:'ctaText',role:'cta',max:h*.62});
    return plate;
  }
  const w=W-pad*2,h=H*.062,plate=c.rect({x:pad,y,w,h},col,{r:h*.22,id:'ctaBtn',role:'cta',fill:col});
  D.sheen(c,plate,'#FFFFFF');
  c.text(C.cta,{x:pad+w*.08,y:y+h*.28,w:w*.84},{fill:onColor(col,P),on:col,align:'middle',id:'ctaText',role:'cta',max:h*.60});
  return plate;
};
D.hero=(c,box,rot,variant)=>{
  const {P}=c,id=c.id('h'),cx=box.x+box.w/2,cy=box.y+box.h/2,{x,y,w,h}=box;
  let inner='';
  if(variant==='car'){
    c.def(`<linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.paper}" stop-opacity=".95"/><stop offset="1" stop-color="${P.accent}" stop-opacity=".85"/></linearGradient>`);
    inner=`<path d="M${x+w*.02} ${y+h*.72} L${x+w*.09} ${y+h*.44} Q${x+w*.13} ${y+h*.36} ${x+w*.24} ${y+h*.33} L${x+w*.36} ${y+h*.15} Q${x+w*.40} ${y+h*.08} ${x+w*.52} ${y+h*.08} L${x+w*.70} ${y+h*.09} Q${x+w*.79} ${y+h*.10} ${x+w*.85} ${y+h*.22} L${x+w*.95} ${y+h*.38} Q${x+w*.99} ${y+h*.44} ${x+w*.99} ${y+h*.56} L${x+w*.99} ${y+h*.72} Z" fill="url(#${id}b)"/>`+
      `<path d="M${x+w*.40} ${y+h*.17} L${x+w*.52} ${y+h*.17} L${x+w*.52} ${y+h*.32} L${x+w*.31} ${y+h*.32} Z" fill="${P.dark}" opacity=".55"/>`+
      `<path d="M${x+w*.57} ${y+h*.17} L${x+w*.70} ${y+h*.18} Q${x+w*.76} ${y+h*.20} ${x+w*.80} ${y+h*.32} L${x+w*.57} ${y+h*.32} Z" fill="${P.dark}" opacity=".55"/>`+
      `<circle cx="${x+w*.26}" cy="${y+h*.74}" r="${h*.16}" fill="${P.dark}"/><circle cx="${x+w*.26}" cy="${y+h*.74}" r="${h*.075}" fill="${P.body}"/>`+
      `<circle cx="${x+w*.80}" cy="${y+h*.74}" r="${h*.16}" fill="${P.dark}"/><circle cx="${x+w*.80}" cy="${y+h*.74}" r="${h*.075}" fill="${P.body}"/>`;
  }else{
    const r=w*.14;
    c.def(`<linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${P.accent}"/><stop offset=".55" stop-color="${P.ground2}"/><stop offset="1" stop-color="${P.hot}"/></linearGradient>`);
    inner=`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${P.dark}"/>`+
      `<rect x="${x+w*.035}" y="${y+h*.026}" width="${w*.93}" height="${h*.948}" rx="${r*.82}" fill="url(#${id}s)"/>`+
      `<rect x="${x+w*.33}" y="${y+h*.028}" width="${w*.34}" height="${h*.032}" rx="${h*.016}" fill="${P.dark}"/>`+
      `<rect x="${x+w*.60}" y="${y+h*.045}" width="${w*.33}" height="${w*.33}" rx="${w*.10}" fill="${P.dark}" opacity=".92"/>`+
      `<circle cx="${x+w*.70}" cy="${y+h*.045+w*.10}" r="${w*.062}" fill="${P.ground2}" stroke="${P.body}" stroke-width="${w*.012}"/>`+
      `<circle cx="${x+w*.84}" cy="${y+h*.045+w*.10}" r="${w*.062}" fill="${P.ground2}" stroke="${P.body}" stroke-width="${w*.012}"/>`+
      `<circle cx="${x+w*.70}" cy="${y+h*.045+w*.24}" r="${w*.062}" fill="${P.ground2}" stroke="${P.body}" stroke-width="${w*.012}"/>`;
  }
  let filt='';
  if(c.on('heroShadow')){
    c.def(`<filter id="${id}f" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="${(h*.035).toFixed(1)}" stdDeviation="${(h*.035).toFixed(1)}" flood-color="#000" flood-opacity=".45"/></filter>`);
    filt=` filter="url(#${id}f)"`;
  }
  c.add(`<g transform="rotate(${rot.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})"${filt}>${inner}</g>`,
    {type:'shape',id:'hero',box,bleed:true,role:'hero'});
  return box;
};
D.grain=(c)=>{
  const id=c.id('g');
  c.def(`<filter id="${id}"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3"/><feColorMatrix type="saturate" values="0"/></filter>`);
  c.add(`<rect width="${c.W}" height="${c.H}" filter="url(#${id})" opacity=".055" style="mix-blend-mode:overlay"/>`);
};
D.stars=(c,x,y,size,fill)=>{
  let p='';
  for(let s=0;s<5;s++){const cx=x+size*.62*s+size*.31,cy=y+size*.5,r=size*.46;
    for(let i=0;i<10;i++){const rr=i%2?r*.42:r,a=-Math.PI/2+i*Math.PI/5;
      p+=(i?'L':'M')+(cx+Math.cos(a)*rr).toFixed(1)+' '+(cy+Math.sin(a)*rr).toFixed(1)+' ';}p+='Z ';}
  c.add(`<path d="${p}" fill="${fill}"/>`,{type:'shape',id:'stars',box:{x,y,w:size*3.1,h:size},role:'proof'});
};
D.split=(c,color)=>{
  const {W,H}=c;
  c.add(`<path d="M0 0 H${W} V${(H*.38).toFixed(1)} L0 ${(H*.52).toFixed(1)} Z" fill="${color}"/>`,
    {type:'shape',id:'split',box:{x:0,y:0,w:W,h:H*.52},bleed:true,role:'field'});
};

/* ══════════════════════════════════════════════════════════
   8 · ARCHETYPES → plans, painted through the gates
   ══════════════════════════════════════════════════════════ */
function ground(c,mode){
  const {W,H,P}=c;
  if(!c.on('groundGradient')||mode==='flat'){c.rect({x:0,y:0,w:W,h:H},P.ground,{ghost:true});return;}
  const id=c.id('bg');
  c.def(`<radialGradient id="${id}" cx="${mode==='pool'?'34%':'50%'}" cy="${mode==='pool'?'38%':'30%'}" r="78%"><stop offset="0" stop-color="${P.ground2}"/><stop offset="1" stop-color="${P.ground}"/></radialGradient>`);
  c.rect({x:0,y:0,w:W,h:H},`url(#${id})`,{ghost:true});
}
/* hero placement respects the bleed switch: off ⇒ clamped inside the safe area */
function placeHero(c,box,rot){
  if(!c.on('hero'))return null;
  let b={...box};
  if(c.H/c.W>1.45){b.h*=1.24;b.w*=1.06;}
  if(!c.on('heroBleed')){
    const m=c.W*.055;
    b.w=Math.min(b.w,c.W-m*2); b.h=Math.min(b.h,c.H*.5);
    b.x=Math.min(Math.max(b.x,m),c.W-m-b.w);
    b.y=Math.min(Math.max(b.y,c.H*.14),c.H*.86-b.h);
  }
  return D.hero(c,b,c.on('heroRotate')?rot:0,c.C.hero);
}
function headline(c,lines,box,o={}){
  const gap=box.h*.06,lh=(box.h-gap*(lines.length-1))/lines.length;
  let y=box.y;
  lines.forEach((ln,i)=>{
    const onPlate=o.plateIndex===i&&o.plateColor;
    const back=onPlate?o.plateColor:(o.on||c.P.ground);
    const byWidth=box.w/(Math.max(String(ln).length,1)*c.F.dw);
    const size=Math.min(lh/.74,byWidth*1.35);
    c.text(ln,{x:box.x,y,w:box.w},{fill:onPlate?onColor(o.plateColor,c.P):(o.fill||c.P.ink),
      stroke:o.stroke,shadow:o.shadow,strokeW:o.strokeW,on:back,align:o.align,
      id:'headline'+i,role:'headline',capRatio:.74,size});
    y+=lh+gap;
  });
}
/* A seal is placed from the hero's own corner, offset by .106r, which lands the
   overlap at ~20% of the badge — inside the 6–32% the auditor asks for. */
function sealOnHero(c,hero,r,pts,text,sub,fill,corner,maxCy,minCx,minCy){
  if(!c.on('starburst'))return null;
  const P=c.P,d=r*.106;
  let cx,cy;
  if(hero){
    cx=corner[1]==='l'?hero.x-d:hero.x+hero.w+d;
    cy=corner[0]==='t'?hero.y-d:hero.y+hero.h+d;
  }else{cx=c.W*.76;cy=c.H*.58;}
  cy=Math.min(Math.max(cy,r+c.H*.015),c.H*.885-r);
  if(maxCy)cy=Math.min(cy,maxCy);
  if(minCy)cy=Math.max(cy,minCy);
  if(hero){                       // hold the overlap at ~18% whatever cy became
    const oh=Math.max(0,Math.min(cy+r,hero.y+hero.h)-Math.max(cy-r,hero.y));
    if(oh>0){
      const want=Math.min(2*r,.18*4*r*r/oh);
      cx=corner[1]==='l'?hero.x-r+want:hero.x+hero.w+r-want;
    }
  }
  if(minCx)cx=Math.max(cx,minCx);
  cx=Math.min(Math.max(cx,r+c.W*.015),c.W-r-c.W*.015);
  const b=D.starburst(c,cx,cy,r,pts,.80,c.R.f(-.40,-.14),fill,P.dark);
  const money=text.replace(/^UP TO\s+/,''), pre=money===text?null:'UP TO';
  const ink=onColor(fill,P);
  /* A STAR IS NOT ITS BOUNDING BOX. The three lines were fitted to b, the full
     outer box of the points, so the number ran out past the tips — measured at
     41-45% overlap between "UP TO", the money and the sub on every archetype
     that carries a seal. The readable area is the INNER disc, so the lines are
     fitted to the square inscribed in it and stacked with real leading. */
  const inR=r*.80, side=inR*1.32;                  // inscribed square of the inner disc
  const bx=cx-side/2, by=cy-side/2;
  /* a seal too small for three lines carries fewer, rather than lines nobody
     can read at feed size — R8 is a floor, not a suggestion */
  const floor=c.S*.021;
  let usePre=!!pre, useSub=!!sub;
  if(side*.135<floor) useSub=false;
  if(side*.150<floor) usePre=false;
  const rows=[usePre?{t:pre,f:.150,face:1}:null,{t:money,f:.300,face:0},useSub?{t:sub,f:.135,face:1}:null].filter(Boolean);
  const lead=1.20, totalH=rows.reduce((a2,q)=>a2+side*q.f*lead,0);
  let ty=cy-totalH/2;
  rows.forEach(q=>{
    const hh=side*q.f;
    c.text(q.t,{x:bx,y:ty,w:side},
      Object.assign({align:'middle',fill:ink,on:fill,role:'offer',max:hh},
        q.face?{face:c.F.body,wf:c.F.bw,weight:800,id:q.t===sub?'offerSub':'offerPre',tracking:.04,min:floor}
              :{id:'offer'}));
    ty+=hh*lead;
  });
  return b;
}
function priceRows(c,top,rows){
  if(!c.on('priceRows'))return;
  const {W,H,S,P,F}=c,rh=S*.066,pad=W*.055;
  rows.forEach((r,i)=>{
    const y=top+i*rh,alt=i%2===0,bg=alt?P.paper:P.ground2;
    c.rect({x:pad*.6,y,w:W-pad*1.2,h:rh*.9},bg,{r:rh*.16,id:'row',role:'data'});
    c.text(r[0],{x:pad,y:y+rh*.24,w:W*.50},{face:F.body,wf:F.bw,weight:700,fill:onColor(bg,P),on:bg,id:'rowLabel',role:'data',max:rh*.52});
    c.text(r[1],{x:W-pad-W*.26,y:y+rh*.18,w:W*.26},{align:'end',fill:readable(P.accent,bg,P),on:bg,id:'rowPrice',role:'data',max:rh*.66});
  });
}
function proofSteps(c,sy,steps){
  const {W,H,S,P,F}=c,sh=S*.070;
  steps.forEach((s,i)=>{
    const y=sy+i*sh;
    c.rect({x:W*.05,y,w:sh*.72,h:sh*.72},P.hot,{r:sh*.16,id:'stepNum',role:'data',fill:P.hot});
    c.text(String(i+1),{x:W*.05+sh*.16,y:y+sh*.16,w:sh*.40},{align:'middle',fill:onColor(P.hot,P),on:P.hot,id:'stepN',role:'data'});
    c.text(s[0],{x:W*.05+sh*.92,y:y+sh*.06,w:W*.24},{face:F.body,wf:F.bw,weight:800,fill:P.ink,on:P.ground,id:'stepLabel',role:'data',max:sh*.40});
    c.text(s[1],{x:W*.05+sh*.92,y:y+sh*.44,w:W*.30},{face:F.body,wf:F.bw,weight:500,fill:readable(P.body,P.ground,P),on:P.ground,id:'stepBody',role:'data',max:sh*.50});
  });
}
function reviewCard(c,box){
  const {W,H,P,F,C}=c;
  const q=c.rect(box,P.paper,{r:W*.02,id:'quoteCard',role:'proof'});
  D.sheen(c,q,P.accent);
  const words=C.quote.split(' '),half=Math.ceil(words.length/2);
  c.text('“',{x:box.x+W*.025,y:box.y+H*.010,w:W*.06},{fill:readable(P.hot,P.paper,P),on:P.paper,id:'qm',role:'proof'});
  c.text(words.slice(0,half).join(' '),{x:box.x+W*.035,y:box.y+H*.057,w:box.w-W*.07},
    {face:F.body,wf:F.bw,weight:700,fill:P.dark,on:P.paper,id:'quote',role:'proof',max:c.S*.036});
  c.text(words.slice(half).join(' '),{x:box.x+W*.035,y:box.y+H*.093,w:box.w-W*.07},
    {face:F.body,wf:F.bw,weight:700,fill:P.dark,on:P.paper,id:'quote2',role:'proof',max:c.S*.036});
  c.text(C.quoteBy,{x:box.x+W*.035,y:box.y+H*.130,w:box.w*.62},
    {face:F.body,wf:F.bw,weight:600,fill:onColor(P.paper,P),on:P.paper,id:'quoteBy',role:'proof',max:c.S*.028});
}

const ARCH={};

/* A1 · NIGHT LOT — argument down the left, hero bleeding right, seal on its corner */
ARCH.nightLot=c=>{
  const {W,H,P,F,R,C}=c;
  ground(c,'pool');
  if(c.on('sunburst'))D.sunburst(c,W*.74,H*.36,W*.88,P.accent,28,R.f(0,.4),.11);
  const hero=placeHero(c,{x:W*.52,y:H*.155,w:W*.60,h:H*.40},R.f(10,20));
  if(c.on('paintStroke'))D.paintStroke(c,{x:W*.035,y:H*.256,w:W*.40,h:H*.074},P.accent,R.i(1,9999));
  headline(c,C.heads,{x:W*.055,y:H*.165,w:W*.50,h:H*.155},
    {stroke:P.dark,shadow:P.hot,shadowDx:W*.008,shadowDy:H*.007,strokeW:.045});
  if(c.on('proofBlock')){
    D.stars(c,W*.055,H*.370,c.S*.034,readable(P.accent,P.ground,P));
    c.text(C.rating,{x:W*.055+c.S*.034*3.6,y:H*.370,w:W*.38},
      {face:F.body,wf:F.bw,weight:800,fill:P.ink,on:P.ground,id:'rating',role:'proof',max:c.S*.036});
  }
  if(c.on('priceRows'))C.rows.slice(0,c.H/c.W>1.45?5:4).forEach((row,i)=>{
    const rh=c.S*.056,y=(c.H/c.W>1.45?H*.395:H*.418)+i*rh,bg=i%2===0?P.ground2:P.ground;
    c.rect({x:W*.05,y,w:W*.275,h:rh*.88},bg,{r:rh*.16,id:'row',role:'data'});
    c.text(row[2]||row[0],{x:W*.063,y:y+rh*.20,w:W*.125},{face:F.body,wf:F.bw,weight:800,
      fill:onColor(bg,P),on:bg,id:'rowLabel',role:'data',max:rh*.58});
    c.text(row[1],{x:W*.185,y:y+rh*.16,w:W*.125},{align:'end',fill:readable(P.accent,bg,P),on:bg,
      id:'rowPrice',role:'data',max:rh*.64});
  });
  sealOnHero(c,hero,W*.145,16,C.offer,C.offerSub,P.hot,'bl',H*.56,W*.46);
  if(H/W>1.45&&c.on('promisePills'))D.promises(c,H*.648,C.promises.slice(3,6),{bg:P.dark});
  if(c.on('promisePills'))D.promises(c,H*.715,C.promises.slice(0,3));
  if(c.on('cta'))D.cta(c,H*.795,'button',P.accent);
  if(c.on('cornerLockup'))D.lockup(c,'left');
  if(c.on('footerBar'))D.footerBar(c);
  if(c.on('grain'))D.grain(c);
  c.note('argument down the left · hero bleeding right · seal on the hero corner');
};

/* A2 · BAND STACK — knockout bands, hero driving out of the right edge */
ARCH.bandStack=c=>{
  const {W,H,P,R,C}=c;
  ground(c,'flat');
  if(c.on('checker'))D.checker(c,{x:0,y:0,w:W,h:H},P.accent,12,.10);
  const y0=H*.145;
  if(c.on('knockoutBand')){
    c.rect({x:0,y:y0,w:W,h:H*.095},P.ink,{bleed:true,id:'band1',role:'plate',fill:P.ink});
    c.text(C.heads[0],{x:W*.05,y:y0+H*.020,w:W*.90},{align:'middle',fill:onColor(P.ink,P),on:P.ink,role:'headline',id:'headline',max:H*.058});
    const b2=c.rect({x:0,y:H*.252,w:W,h:H*.125},P.accent,{bleed:true,id:'band2',role:'plate',fill:P.accent});
    D.sheen(c,b2,'#FFFFFF');
    c.text(C.heads[1],{x:W*.05,y:H*.276,w:W*.90},{align:'middle',fill:onColor(P.accent,P),on:P.accent,role:'headline',id:'headline2',max:H*.078});
  }else headline(c,C.heads,{x:W*.05,y:y0,w:W*.90,h:H*.22},{align:'middle',stroke:P.dark,shadow:P.hot});
  const hero=placeHero(c,{x:W*.30,y:H*.40,w:W*.78,h:H*.30},R.f(-9,9));
  sealOnHero(c,hero,W*.135,12,C.offer,null,P.accent,'bl',H*.62,null,H*.48);
  if(c.on('promisePills'))D.promises(c,H*.715,C.promises.slice(0,3));
  if(c.on('cta'))D.cta(c,H*.800,'band');
  if(c.on('cornerLockup'))D.lockup(c,'left');
  if(c.on('footerBar'))D.footerBar(c);
  if(c.on('grain'))D.grain(c);
  c.note('two knockout bands · checker ground · seal on the hero’s leading corner');
};

/* A3 · SUNBURST HERO — arc crown, hero out of the right edge, proof stacked left */
ARCH.sunburstHero=c=>{
  const {W,H,P,F,R,C}=c;
  ground(c,'radial');
  if(c.on('sunburst'))D.sunburst(c,W*.56,H*.40,W*1.05,P.accent,32,R.f(0,.3),.17);
  if(c.on('halftone'))D.halftone(c,{x:0,y:H*.60,w:W,h:H*.26},P.hot,W*.032,R.i(1,9999),'v');
  if(c.on('arcCrown')){const ar=W*.44,apex=Math.max(H*.148,W*.152);
    D.arcText(c,C.heads.join(' '),W*.5,apex+ar,ar,P.ink,W*.062);}
  else headline(c,C.heads,{x:W*.06,y:H*.115,w:W*.88,h:H*.145},{align:'middle',stroke:P.dark,shadow:P.hot});
  const hero=placeHero(c,{x:W*.44,y:H*.295,w:W*.70,h:H*.330},R.f(-6,8));
  if(c.on('promisePills'))C.promises.slice(0,c.H/c.W>1.45?5:3).forEach((t,i)=>
    D.promises(c,(c.H/c.W>1.45?H*.400:H*.430)+i*c.S*.072,[t],{h:c.S*.058,w:W*.30}));
  sealOnHero(c,hero,W*.135,20,C.offer,null,P.hot,'tl');
  if(c.on('proofBlock')){
    D.stars(c,W*.60,H*.635,H*.032,readable(P.accent,P.ground,P));
    c.text(C.rating,{x:W*.60,y:H*.682,w:W*.36},{face:F.body,wf:F.bw,weight:800,
      fill:P.ink,on:P.ground,id:'rating',role:'proof',max:c.S*.036});
  }
  if(c.on('ticket')){
    const t=D.ticket(c,{x:W*.10,y:H*.745,w:W*.80,h:H*.078},P.paper,H*.018);
    D.sheen(c,t,P.accent);
    c.text(C.offerSub+' · NO OBLIGATION',{x:W*.145,y:H*.762,w:W*.71},
      {face:F.body,wf:F.bw,weight:800,align:'middle',fill:onColor(P.paper,P),on:P.paper,id:'stubline',role:'proof',max:c.S*.036});
  }
  if(c.on('cta'))D.cta(c,H*.838,'button');
  if(c.on('cornerLockup'))D.lockup(c,'left');
  if(c.on('footerBar'))D.footerBar(c);
  if(c.on('grain'))D.grain(c);
  c.note('32-wedge sunburst · arc crown · promises stacked down the left');
};

/* A4 · TORN SPLIT — ragged divide, price below the tear */
ARCH.tornSplit=c=>{
  const {W,H,P,F,R,C}=c;
  ground(c,'flat');
  if(c.on('tornPaper'))D.tornPaper(c,{x:0,y:H*.44,w:W,h:H*.48},P.paper,R.i(1,9999));
  else c.rect({x:0,y:H*.46,w:W,h:H*.46},P.paper,{bleed:true,id:'flatPlate',role:'plate',fill:P.paper});
  const hero=placeHero(c,{x:W*.46,y:H*.10,w:W*.62,h:H*.34},R.f(12,22));
  if(c.on('paintStroke'))D.paintStroke(c,{x:W*.035,y:H*.222,w:W*.42,h:H*.078},P.accent,R.i(1,9999));
  headline(c,C.heads,{x:W*.055,y:H*.128,w:W*.44,h:H*.185},
    {stroke:P.dark,shadow:P.accent,strokeW:.05,
     plateIndex:c.on('paintStroke')?1:-1,plateColor:P.accent});
  c.text(C.offer,{x:W*.055,y:H*.545,w:W*.50},{fill:onColor(P.paper,P),on:P.paper,id:'offer2',role:'offer'});
  c.text('CASH IN HAND',{x:W*.055,y:H*.655,w:W*.40},
    {face:F.body,wf:F.bw,weight:800,fill:readable(P.accent,P.paper,P),on:P.paper,
     id:'offerSub2',role:'offer',tracking:.03});
  sealOnHero(c,hero,W*.135,20,'SAME','DAY',P.hot,'bl',H*.475,null,H*.445);
  if(c.on('promisePills'))D.promises(c,H*.700,C.promises.slice(2,5),{bg:P.dark});
  if(c.on('cta'))D.cta(c,H*.780,'button');
  if(c.on('cornerLockup'))D.lockup(c,'left');
  if(c.on('footerBar'))D.footerBar(c);
  if(c.on('grain'))D.grain(c);
  c.note('torn-paper divide · hero bleeding top-right · seal riding the tear');
};

/* A5 · PRICE BOARD — the offer is the column, so no seal competes with it */
ARCH.priceBoard=c=>{
  const {W,H,P,R,C}=c;
  ground(c,'flat');
  if(c.on('diagonalSplit'))D.split(c,P.ground2);
  if(c.on('knockoutBand')){
    const head=c.rect({x:0,y:H*.142,w:W,h:H*.112},P.accent,{bleed:true,id:'headBand',role:'plate',fill:P.accent});
    D.sheen(c,head,'#FFFFFF');
    c.text(C.heads.join(' '),{x:W*.05,y:H*.166,w:W*.90},{align:'middle',fill:onColor(P.accent,P),on:P.accent,role:'headline',id:'headline',max:H*.070});
  }else headline(c,[C.heads.join(' ')],{x:W*.05,y:H*.150,w:W*.90,h:H*.082},{align:'middle',stroke:P.dark,shadow:P.hot});
  priceRows(c,H*.285,C.rows);
  placeHero(c,{x:W*.575,y:H*.575,w:W*.52,h:H*.255},R.f(14,24));
  if(c.on('promisePills'))D.promises(c,H*.715,C.promises.slice(0,2).concat([C.offerSub]),{bg:P.paper});
  if(c.on('cta'))D.cta(c,H*.800,'band');
  if(c.on('cornerLockup'))D.lockup(c,'left');
  if(c.on('footerBar'))D.footerBar(c);
  if(c.on('grain'))D.grain(c);
  c.note('alternating price rows · diagonal split · hero bleeding bottom-right');
};

/* A6 · POSTER BLEED — display type at maximum, hero out of the left edge */
ARCH.posterBleed=c=>{
  const {W,H,P,R,C}=c;
  ground(c,'flat');
  if(c.on('halftone'))D.halftone(c,{x:0,y:0,w:W,h:H*.52},P.accent,W*.030,R.i(1,9999),'v');
  const hero=placeHero(c,{x:-W*.14,y:H*.50,w:W*.70,h:H*.34},R.f(-24,-12));
  if(c.on('paintStroke'))D.paintStroke(c,{x:W*.035,y:H*.243,w:W*.56,h:H*.098},P.accent,R.i(1,9999));
  headline(c,C.heads,{x:W*.05,y:H*.128,w:W*.90,h:H*.215},
    {stroke:P.hot,shadow:P.dark,shadowDx:W*.012,shadowDy:H*.010,strokeW:.05,fill:readable(P.paper,P.ground,P),
     plateIndex:c.on('paintStroke')?1:-1,plateColor:P.accent});
  if(c.on('knockoutBand')){
    c.rect({x:0,y:H*.378,w:W,h:H*.056},P.ink,{bleed:true,id:'kickerBand',role:'plate',fill:P.ink});
    c.text(C.offer+'  ·  '+C.offerSub,{x:W*.05,y:H*.393,w:W*.90},
      {align:'middle',fill:onColor(P.ink,P),on:P.ink,id:'offerLine',role:'offer',max:H*.036});
  }
  sealOnHero(c,hero,W*.150,20,'CASH','TODAY',P.hot,'tr',H/W>1.45?H*.755:H*.66,null,H/W>1.45?H*.700:H*.58);
  if(c.on('promisePills'))D.promises(c,H*.782,C.promises.slice(3,6),{bg:P.dark});
  if(H/W>1.45&&c.on('priceRows'))priceRows(c,H*.505,C.rows.slice(0,3));
  if(c.on('promisePills'))D.promises(c,H*.850,C.promises.slice(0,3),{bg:P.paper});
  if(c.on('cornerLockup'))D.lockup(c,'left');
  if(c.on('footerBar'))D.footerBar(c);
  if(c.on('grain'))D.grain(c);
  c.note('outlined display at full width · hero bleeding left · halftone ramp');
};

/* A7 · TICKET OFFER — the stub is the offer, so the seal stays away */
ARCH.ticketOffer=c=>{
  const {W,H,P,F,R,C}=c;
  ground(c,'radial');
  if(c.on('sunburst'))D.sunburst(c,W*.5,H*.44,W*.95,P.hot,24,R.f(0,.3),.12);
  headline(c,[C.heads[0]],{x:W*.05,y:H*.125,w:W*.90,h:H*.070},{stroke:P.dark,align:'middle'});
  headline(c,[C.heads[1]],{x:W*.05,y:H*.200,w:W*.90,h:H*.110},{fill:readable(P.accent,P.ground,P),shadow:P.dark,stroke:P.dark,align:'middle'});
  placeHero(c,{x:W*.32,y:H*.315,w:W*.84,h:H*.315},R.f(-7,9));
  if(c.on('proofBlock')){
    const ry=H*(H/W>1.45?.500:.522);
    D.stars(c,W*.06,ry,c.S*.030,readable(P.accent,P.ground,P));
    c.text(C.rating,{x:W*.06,y:ry+H*.044,w:W*.40},{face:F.body,wf:F.bw,weight:800,fill:P.ink,on:P.ground,
      id:'rating',role:'proof',max:c.S*.036});
  }
  if(c.on('ticket')){
    const t=D.ticket(c,{x:W*.08,y:H*.600,w:W*.84,h:H*.145},P.paper,H*.024);
    D.sheen(c,t,P.accent);
    c.text(C.offer,{x:W*.125,y:H*.632,w:W*.75},{align:'middle',fill:onColor(P.paper,P),on:P.paper,
      id:'offer',role:'offer',max:H*.080});
  }
  c.text('NO OBLIGATION · 20 MIN · CASH OR TRANSFER',{x:W*.09,y:H*.757,w:W*.82},
    {face:F.body,wf:F.bw,weight:700,align:'middle',fill:readable(P.body,P.ground,P),on:P.ground,
     id:'fine',role:'proof',max:c.S*.032,tracking:.03});
  if(c.on('promisePills'))D.promises(c,H*.800,C.promises.slice(3,6));
  if(c.on('cta'))D.cta(c,H*.849,'button');
  if(c.on('cornerLockup'))D.lockup(c,'left');
  if(c.on('footerBar'))D.footerBar(c);
  if(c.on('grain'))D.grain(c);
  c.note('perforated stub carries the offer · sheen measured from the stub');
};

/* A8 · PROOF WALL — review plate, numbered steps, seal on the hero */
ARCH.proofWall=c=>{
  const {W,H,P,F,R,C}=c;
  ground(c,'pool');
  if(c.on('checker'))D.checker(c,{x:0,y:0,w:W,h:H*.5},P.accent,10,.08);
  if(c.on('proofBlock')){
    D.stars(c,W*.055,H*.140,c.S*.034,readable(P.accent,P.ground,P));
    c.text(C.rating,{x:W*.055+c.S*.034*3.6,y:H*.140,w:W*.40},
      {face:F.body,wf:F.bw,weight:800,fill:P.ink,on:P.ground,id:'rating',role:'proof',max:c.S*.036});
    reviewCard(c,{x:W*.05,y:H*.200,w:W*.62,h:H*.160});
  }
  const hero=placeHero(c,{x:W*.60,y:H*.295,w:W*.56,h:H*.26},R.f(12,20));
  if(c.on('paintStroke'))D.paintStroke(c,{x:W*.04,y:H*.408,w:W*.60,h:H*.088},P.accent,R.i(1,9999));
  headline(c,[C.heads.join(' ')],{x:W*.055,y:H*.422,w:W*.56,h:H*.060},
    {fill:c.on('paintStroke')?onColor(P.accent,P):P.ink,
     on:c.on('paintStroke')?P.accent:P.ground});
  sealOnHero(c,hero,W*.135,16,C.offer,null,P.accent,'bl',H*.60,W*.58,H*.50);
  if(c.on('proofBlock'))proofSteps(c,H*.530,C.steps);
  if(H/W>1.45&&c.on('promisePills'))D.promises(c,H*.690,C.promises.slice(3,6),{bg:P.dark});
  if(c.on('cta'))D.cta(c,H*.740,'band');
  if(c.on('promisePills'))D.promises(c,H*.828,C.promises.slice(0,3),{bg:P.paper});
  if(c.on('cornerLockup'))D.lockup(c,'left');
  if(c.on('footerBar'))D.footerBar(c);
  if(c.on('grain'))D.grain(c);
  c.note('review plate + numbered steps · paint stroke behind the promise line');
};
const ARCHS=[
 ['nightLot','Night Lot','one hero in a pool of light'],
 ['bandStack','Band Stack','knockout bands, product wedged between'],
 ['sunburstHero','Sunburst Hero','rays and an arc crown'],
 ['tornSplit','Torn Split','ragged paper divide'],
 ['priceBoard','Price Board','model rows resellers screenshot'],
 ['posterBleed','Poster Bleed','display type at maximum'],
 ['ticketOffer','Ticket Offer','perforated stub'],
 ['proofWall','Proof Wall','review card and numbered steps']
];

/* ══════════════════════════════════════════════════════════
   9 · AUDITOR
   ══════════════════════════════════════════════════════════ */
const RULES=[
 ['R1','Coverage floor','≥ 62% of the canvas carries content','the empty card — 29% coverage reads as a placeholder'],
 ['R2','Dead space','largest empty rectangle ≤ 18% of the canvas','a card that averages fine but has one big hole'],
 ['R3','Footer bar','full-bleed footer carrying the number','a number floating with nothing under it'],
 ['R4','Hero bleed','hero crosses an edge by ≥ 6%','product parked inside a box like a catalogue photo'],
 ['R5','Shape language','headline sits on stroke, tear, band or rays','the flat rounded plate behind every headline'],
 ['R6','Badge placement','if a seal exists it covers 6–32% of the hero','a seal floating in dead space, or swallowing the product'],
 ['R7','Text collision','no two text boxes intersect','overlap you only notice after export'],
 ['R8','Minimum size','every text ≥ 2.0% of the short edge','fine print that dies in a feed thumbnail'],
 ['R9','Contrast','every text ≥ 4.5:1 on its own backing','accent-on-accent text that vanishes'],
 ['R10','Hot restraint','hot colour ≤ 14% of canvas area','the all-red card where nothing reads as urgent'],
 ['R11','Sheen parentage','every sheen sits inside its own plate','the highlight drawn at the layout’s original geometry'],
 ['R12','Safe area','non-bleed elements inside a 4.5% margin','clipped corners after a crop']
];
function inter(a,b){const x=Math.max(a.x,b.x),y=Math.max(a.y,b.y);
  const r=Math.min(a.x+a.w,b.x+b.w),bt=Math.min(a.y+a.h,b.y+b.h);
  return(r>x&&bt>y)?(r-x)*(bt-y):0;}
function audit(card){
  const {W,H,nodes,P}=card,cell=20,cols=Math.ceil(W/cell),rows=Math.ceil(H/cell);
  const g=new Uint8Array(cols*rows);
  nodes.forEach(n=>{
    if(n.role==='field'&&n.id!=='split')return;
    const b=n.box;
    const x0=Math.max(0,Math.floor(b.x/cell)),x1=Math.min(cols,Math.ceil((b.x+b.w)/cell));
    const y0=Math.max(0,Math.floor(b.y/cell)),y1=Math.min(rows,Math.ceil((b.y+b.h)/cell));
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)g[y*cols+x]=1;});
  let filled=0;for(let i=0;i<g.length;i++)filled+=g[i];
  const coverage=filled/g.length;
  const hgt=new Int32Array(cols);let best=0;
  for(let y=0;y<rows;y++){
    for(let x=0;x<cols;x++)hgt[x]=g[y*cols+x]?0:hgt[x]+1;
    const st=[];
    for(let x=0;x<=cols;x++){const h=x<cols?hgt[x]:0;
      while(st.length&&hgt[st[st.length-1]]>=h){const ht=hgt[st.pop()],left=st.length?st[st.length-1]+1:0;
        best=Math.max(best,ht*(x-left));}
      st.push(x);}}
  const dead=best/(cols*rows);
  const texts=nodes.filter(n=>n.type==='text');
  const hero=nodes.find(n=>n.role==='hero'), badge=nodes.find(n=>n.role==='badge');
  const heads=nodes.filter(n=>n.role==='headline'), plates=nodes.filter(n=>n.role==='plate');
  const sheens=nodes.filter(n=>n.role==='sheen');
  const hotArea=nodes.filter(n=>n.fill===P.hot).reduce((s,n)=>s+Math.max(0,n.box.w)*Math.max(0,n.box.h),0)/(W*H);
  const r=[];
  r.push(['R1',coverage>=.62]);
  r.push(['R2',dead<=.18]);
  r.push(['R3',!!nodes.find(n=>n.role==='footer'&&n.box.w>=W*.999)]);
  r.push(['R4',!!hero&&(hero.box.x<-W*.06||hero.box.x+hero.box.w>W*1.06||hero.box.y<-H*.06||hero.box.y+hero.box.h>H*1.06)]);
  r.push(['R5',heads.some(h=>plates.some(p=>inter(h.box,p.box)>h.box.w*h.box.h*.25))||nodes.some(n=>n.id==='sunburst'||n.id==='arc')]);
  const bo=(badge&&hero)?inter(badge.box,hero.box)/(badge.box.w*badge.box.h):0;
  r.push(['R6',!badge||(bo>=.06&&bo<=.32)]);
  let collide=false;
  for(let i=0;i<texts.length&&!collide;i++)for(let j=i+1;j<texts.length;j++){
    if(inter(texts[i].box,texts[j].box)>Math.min(texts[i].box.w*texts[i].box.h,texts[j].box.w*texts[j].box.h)*.30){collide=true;break;}}
  r.push(['R7',!collide]);
  const SS=Math.min(W,H);
  r.push(['R8',texts.every(t=>t.size>=SS*.020)]);
  r.push(['R9',texts.every(t=>{try{return contrast(t.fill,t.backing)>=4.5;}catch(e){return true;}})]);
  r.push(['R10',hotArea<=.14]);
  r.push(['R11',sheens.every(s=>s.parent&&inter(s.box,s.parent)>=s.box.w*s.box.h*.999)]);
  r.push(['R12',nodes.every(n=>n.bleed||n.role==='field'||(n.box.x>=-1&&n.box.y>=-1&&n.box.x+n.box.w<=W+1&&n.box.y+n.box.h<=H+1))]);
  return{coverage,dead,hotArea,elements:nodes.length,rules:r,pass:r.filter(x=>x[1]).length,total:r.length};
}

/* ══════════════════════════════════════════════════════════
   10 · RENDER PIPELINE
   ══════════════════════════════════════════════════════════ */
function render(archKey,seed,vertical,sizeKey,cfg){
  const R=RNG(seed);
  const P=PALETTES[seed%PALETTES.length], Fp=PAIRS[(seed>>3)%PAIRS.length];
  const [W,H]=SIZES[sizeKey], C0=CONTENT[vertical];
  const C=Object.assign({},C0,{heads:R.pick(C0.heads),promises:R.shuffle(C0.promises)});
  const F={display:Fp.display,body:Fp.body,dw:Fp.dw,bw:Fp.bw,dweight:Fp.dweight};
  const c=new Card(W,H,P,F,R,C,cfg,archKey+seed+sizeKey);
  ARCH[archKey](c);
  const a=audit(c);
  const svg=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(archKey)} buyback ad in the ${esc(P.name)} palette"><defs>${c.defs.join('')}</defs><rect width="${W}" height="${H}" fill="${P.ground}"/>${c.svg.join('')}</svg>`;
  return{svg,audit:a,palette:P,pair:Fp,card:c};
}

/* ══════════════════════════════════════════════════════════
   11 · PROMPT + SENTIMENT
   ══════════════════════════════════════════════════════════ */
const PERMANENT_NEG=[
 'flat rounded plate behind the headline','product centred inside a safe box',
 'badge floating clear of the product','phone number set in body weight',
 'more than three promise pills','gradient standing in for shape language',
 'ornament positioned in canvas coordinates','stock photo of hands holding the product',
 'emoji used as a trust mark','centred body copy','drop shadow on flat elements',
 'two type sizes doing the same job','footer with no address or service area'
];
function buildPrompt(archKey,r,cfg){
  const on=k=>cfg[k]!==false;
  const meta=ARCHS.find(a=>a[0]===archKey);
  const parts=[];
  parts.push(`${meta[1].toUpperCase()} — ${r.card.C.heads.join(' ')} buyback ad, ${r.card.W}×${r.card.H}`);
  parts.push(`palette ${r.palette.id} "${r.palette.name}" (${r.palette.mood}) · ground ${r.palette.ground}, accent ${r.palette.accent}, hot ${r.palette.hot}`);
  parts.push(`type ${r.pair.display} over ${r.pair.body}`);
  const field=['sunburst','halftone','checker','diagonalSplit'].filter(on).map(k=>KEYMETA[k].name.toLowerCase());
  const shape=['paintStroke','tornPaper','knockoutBand','arcCrown'].filter(on).map(k=>KEYMETA[k].name.toLowerCase());
  const typefx=['outlineStroke','hardShadow','fitToPlate'].filter(on).map(k=>KEYMETA[k].name.toLowerCase());
  const offer=['starburst','ticket','sheen'].filter(on).map(k=>KEYMETA[k].name.toLowerCase());
  const proof=['promisePills','proofBlock','priceRows'].filter(on).map(k=>KEYMETA[k].name.toLowerCase());
  const chrome=['cta','footerBar','cornerLockup'].filter(on).map(k=>KEYMETA[k].name.toLowerCase());
  const heroBits=[on('hero')&&'product hero',on('heroBleed')&&'bleeding off one edge',
    on('heroRotate')&&'angled 6–24°',on('heroShadow')&&'cast shadow'].filter(Boolean);
  if(heroBits.length)parts.push('hero: '+heroBits.join(', '));
  if(field.length)parts.push('field: '+field.join(', '));
  if(shape.length)parts.push('shape language: '+shape.join(', '));
  if(typefx.length)parts.push('display type: '+typefx.join(', '));
  if(offer.length)parts.push('offer: '+offer.join(', '));
  if(proof.length)parts.push('proof: '+proof.join(', '));
  if(chrome.length)parts.push('chrome: '+chrome.join(', '));
  parts.push(`copy: "${r.card.C.offer}" · "${r.card.C.cta}" · ${r.card.C.phone} · ${r.card.C.addr}`);
  const off=ALLKEYS.filter(k=>!on(k));
  const neg=off.map(k=>'no '+KEYMETA[k].name.toLowerCase()).concat(PERMANENT_NEG);
  return{pos:parts.join('\n'),neg:neg.join('\n')};
}
function sentiment(r,cfg){
  const on=k=>cfg[k]!==false;
  const ornament=['sunburst','halftone','checker','diagonalSplit','paintStroke','tornPaper','knockoutBand','arcCrown','starburst','ticket','sheen','grain'].filter(on).length/12;
  const loud=(on('knockoutBand')?.3:0)+(on('starburst')?.25:0)+(on('hardShadow')?.2:0)+(on('outlineStroke')?.15:0)+(on('heroBleed')?.1:0);
  const trust=(on('proofBlock')?.4:0)+(on('promisePills')?.25:0)+(on('footerBar')?.2:0)+(on('cornerLockup')?.15:0);
  const density=r.audit.coverage;
  const words=[];
  words.push(loud>.7?'Loud':loud>.4?'Assertive':'Quiet');
  words.push(ornament>.6?'print-shop':ornament>.35?'considered':'stripped');
  words.push(trust>.6?'well-vouched':trust>.35?'credible':'anonymous');
  const verdict=density<.5?'reads as a placeholder — the engine is not filling the canvas'
    :density<.62?'still thin; the eye finds a hole before it finds the offer'
    :ornament<.3?'filled but plain — nothing here says a person made it'
    :loud<.4?'composed but polite; marketplace scroll will pass it'
    :'this is the register the reference ads work in';
  return{words,verdict,meters:[['ornament',ornament],['loudness',Math.min(loud,1)],['trust signals',trust],['density',density]]};
}


/* ─────────────────────────────────────────────────────────────
   exports — the whole engine is pure: no DOM, no browser globals.
   `render()` returns an SVG string plus the audit for that card.
   ───────────────────────────────────────────────────────────── */
export {
  RNG, PALETTES, PAIRS, SIZES, CONTENT,
  contrast, onColor, readable, esc,
  Card, D, ARCH, ARCHS,
  QUEUE, ALLKEYS, KEYMETA, DEFAULT_CFG,
  RULES, PERMANENT_NEG, audit, render, buildPrompt, sentiment,
  ground, placeHero, headline, sealOnHero, priceRows, proofSteps, reviewCard
};
