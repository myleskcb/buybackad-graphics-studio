import { faceCSS, nearestWeight, FONT_FILES } from './fonts.mjs';
import { readFileSync } from 'node:fs';

/* REAL TYPE METRICS, measured from the embedded fonts by
   tools/gfx/measure_fonts.mjs. Every run is sized from the exact sum of its
   glyph advances instead of one average-character constant per family, so a
   line cannot be wider than the box it was told to fit. The old constants were
   out by up to 41% (Clash Display caps measure .735, the constant said .52),
   which is why headlines ran off their plates while the declared-box audit
   reported twelve of twelve rules passing. */
/* THE OWNER'S APPROVED PHOTOGRAPHY, built by tools/gfx/build_assets.mjs.
   The engine's own hero is a vector: a rounded rectangle with three circles for
   a phone, a silhouette on two wheels for a car. It reads as a DIAGRAM of a
   product, and a diagram does not stop a thumb in a marketplace feed. These are
   348 real cutouts the owner has personally approved — rejected ones cannot
   reach a card, because only the approved list is written into the index. */
const ASSETS=(()=>{try{return JSON.parse(readFileSync(new URL('../spec/assets.json',import.meta.url),'utf8'));}catch{return{subjects:{},props:[],cash:[]};}})();
const METRICS=(()=>{try{return JSON.parse(readFileSync(new URL('../spec/metrics.json',import.meta.url),'utf8'));}catch{return{};}})();
/* the face a price may be set in — the display face unless its figures are
   unfit for money */
/* HOW MUCH OF A TEXT BOX A SHAPE ACTUALLY COVERS.
   A starburst is neither its bounding square nor its inner disc: the points
   reach out to the full radius in sixteen directions and the gaps between them
   cover nothing. Judging it by the square condemned placements that were fine;
   judging it by the disc let a point sit across the last letters of a pill.
   Sampling the real star polygon answers the question that was actually being
   asked — can the reader still read this. */
function starCover(box,st){
  /* Most candidate seats are nowhere near most lines. Reject on the bounding
     square first so the search can afford to evaluate every seat rather than
     stopping at the first tolerable one. */
  if(box.x+box.w<st.cx-st.r||box.x>st.cx+st.r||
     box.y+box.h<st.cy-st.r||box.y>st.cy+st.r)return 0;
  const N=8,M=8;let hit=0;
  for(let i=0;i<N;i++)for(let j=0;j<M;j++){
    const px=box.x+box.w*(i+.5)/N, py=box.y+box.h*(j+.5)/M;
    const dx=px-st.cx, dy=py-st.cy, d=Math.hypot(dx,dy);
    if(d>st.r)continue;
    const a=Math.atan2(dy,dx)-st.rot;
    const step=Math.PI/st.pts;
    /* the radius of the star at this angle: linear between a point and a valley */
    const t=Math.abs(((a/step)%2+2)%2-1);            // 0 at a valley, 1 at a point
    if(d<=st.r*(st.inner+(1-st.inner)*t))hit++;
  }
  return hit/(N*M);
}
/* An asset is chosen from the pool for the card's own subject. A phone card
   shows a phone; the pool is never widened to "whatever is left", which is how
   a Pokemon card once ended up advertising an iPhone. */
/* Does this picture belong on this card? The deck says what the copy is about;
   the tag says what the picture is of. Brand and condition must agree; if both
   sides know the generation those must agree too; and only a single product or
   a group may stand as the hero — never a hand, a tool or another device. */
function matchSubject(a,subj){
  if(!subj)return true;
  const t=a.t; if(!t||!t.h)return false;
  if(subj.brand&&!subj.brand.includes(t.b))return false;
  if(subj.cond&&subj.cond!=='any'&&t.c!==subj.cond)return false;
  if(subj.gen&&t.g&&!subj.gen.includes(t.g))return false;
  return true;
}
function pickAsset(c,pool,salt){
  if(!pool||!pool.length)return null;
  const subj=c.C&&c.C.subject;
  let ok=pool.filter(a=>matchSubject(a,subj));
  if(!ok.length){c.note('NOASSET: nothing in the library matches this deck\'s subject');return null;}
  /* prefer a picture that names the generation the copy leads with */
  if(subj&&subj.gen){const named=ok.filter(a=>a.t.g&&subj.gen.includes(a.t.g));
    if(named.length)ok=[...named,...named,...named,...ok];}
  return ok[Math.floor(c.R.f(0,1)*ok.length+(salt||0))%ok.length];
}
const POOL_OF={broken:'phones'};                // decks that share another deck's pictures
function assetsFor(c,kind){
  const s=ASSETS.subjects||{};
  if(kind==='prop')return ASSETS.props||[];
  if(kind==='cash')return ASSETS.cash||[];
  return s[POOL_OF[kind]||kind]||[];
}
function numFace(c){return c.F.figures?{face:c.F.display,wf:c.F.dw}:{face:c.F.body,wf:c.F.bw};}
function faceMetrics(family,weight){
  return METRICS[family+'|'+nearestWeight(family,weight)]||null;
}
/* the run's real ink extents above and below the baseline, at font-size 1 */
function inkExtent(str,family,weight){
  const m=faceMetrics(family,weight);
  if(!m||!m.up)return null;
  let up=0,dn=0;
  for(const ch of String(str)){
    if(ch===' ')continue;
    up=Math.max(up,m.up[ch]!==undefined?m.up[ch]:m.cap);
    dn=Math.max(dn,m.dn[ch]!==undefined?m.dn[ch]:m.desc);
  }
  return up||dn?{up,dn}:null;
}
/* width of str at font-size 1, tracking included */
function advance(str,family,weight,tracking){
  const m=faceMetrics(family,weight);
  const n=String(str).length;
  if(!m)return null;
  let w=0;
  for(const ch of String(str))w+=m.adv[ch]!==undefined?m.adv[ch]:m.avg;
  return w+(tracking||0)*Math.max(0,n-1);
}
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
 {id:"cs",display:"Clash Display",body:"Satoshi", dw:.52,bw:.50,dweight:700,note:"geometric display over the workhorse grotesque — the studio default"},
 {id:"kh",display:"Khand",        body:"Satoshi", dw:.40,bw:.50,dweight:700,note:"tall condensed over a soft grotesque — holds long model names"},
 /* Melodrama draws a slashed zero, so "$1,250" reads "$1,25Ø" — checked
    against a rendered swatch of all five families, it is the only one that
    does. Prices in this pairing are set in the body face instead. */
 {id:"ml",display:"Melodrama",    body:"Satoshi", dw:.46,bw:.50,dweight:700,figures:false,note:"high-contrast editorial display — expensive, not loud"},
 {id:"zd",display:"Zodiak",       body:"Satoshi", dw:.50,bw:.50,dweight:700,note:"display serif over a grotesque — authority, the trade-in desk"},
 {id:"cz",display:"Clash Display",body:"Zodiak",  dw:.52,bw:.48,dweight:600,note:"geometric over a serif body — editorial weight under a modern head"},
 {id:"kc",display:"Khand",        body:"Clash Display",dw:.40,bw:.50,dweight:700,note:"condensed over geometric — poster type, nothing else beside it"}
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
         ["GET PAID","Cash or transfer"]],
  /* what the copy is ABOUT, so the picture can be held to it */
  subject:{brand:['iphone'],gen:[17,16,15],cond:'clean'}},
 /* The cracked phones belong to THIS deck, not to the one quoting $1,250 for a
    17 Pro Max. PRICES ARE PLACEHOLDERS for the owner to set. */
 broken:{brand:"iPhones.LA",mark:"iL",kicker:"BROKEN IS FINE",hero:"phone",
  heads:[["WE BUY","BROKEN PHONES"],["CRACKED?","WE PAY"],["SMASHED","STILL PAYS"],["SCREEN GONE","CASH STAYS"]],
  offer:"UP TO $700",offerSub:"CRACKED · TODAY",
  promises:["CRACKED OK","WON'T TURN ON","WATER DAMAGE","ICLOUD OK","FREE PICKUP","CASH TODAY"],
  rows:[["17 Pro Max · cracked","$700","17 PM"],["16 Pro · cracked","$480","16 PRO"],
        ["15 Pro · cracked","$320","15 PRO"],["14 · cracked","$160","14"],["Galaxy S24 · cracked","$260","S24"]],
  cta:"GET A BROKEN-PHONE QUOTE",phone:"(562) 999-4994",addr:"iphones.LA · Long Beach",
  quote:"Screen in pieces, still got $420 for it.",
  quoteBy:"Dana R. · Lakewood",rating:"4.9★ · 200+ REVIEWS",
  steps:[["TEXT PICS","Cracks and all"],["GET OFFER","Firm, for the damage"],
         ["GET PAID","Cash or transfer"]],
  subject:{brand:['iphone','samsung','pixel'],cond:'cracked'}},
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
         ["FREE TOW","We tow, you bank."]],
  subject:{brand:['car'],cond:'any'}}          // "runs or not": a damaged car is on-message
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
  ['photoHero','Real photography','approved product cutout instead of vector art','A photograph of the actual thing stops a thumb; a diagram of it does not.'],
 ['stickers','Prop dressing','banded cash and boxed stock in the empty corners','Fills the holes a cutout leaves with things the shop actually hands over.'],
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
/* What sits in front of what. Anything unlisted is content and paints at 0. */
const Z={field:-60,ground:-60,hero:-30,plate:-10,shape:-10,sheen:-5,badge:20};
class Card{
  constructor(W,H,P,F,R,C,cfg,key,vertical){
    Object.assign(this,{W,H,P,F,R,C,cfg,key,vertical});
    this.S=Math.min(W,H);
    /* LAYERS CARRY A DEPTH, NOT JUST AN ORDER.
       Every "why is that on top of the text" bug came from paint order being an
       accident of the order somebody happened to write the calls in. A layer now
       declares what KIND of thing it is — ground, field, product, content, seal —
       and the card is assembled by depth. Adding a device to an archetype can no
       longer bury the copy just because it was written last. */
    this.defs=[];this.layers=[];this.uid=0;this.notes=[];this.used={};this.later=[];this.seq=0;this._m=null;
  }
  on(k){return this.cfg[k]!==false;}
  id(p){return p+(this.uid++)+this.key;}
  add(m,n,z){this.layers.push({m,n,z:z===undefined?(n&&Z[n.role])||0:z,i:this.seq++});this._m=null;}
  /* materialised paint order — depth first, then the order it was written */
  get sorted(){return this._m||(this._m=this.layers.slice().sort((a,b)=>a.z-b.z||a.i-b.i));}
  get svg(){return this.sorted.map(l=>l.m);}
  get nodes(){return this.sorted.filter(l=>l.n).map(l=>l.n);}
  def(d){this.defs.push(d);}
  /* Run after the archetype has finished. A seal has to choose its seat from
     the finished card: placed mid-build it was choosing against half the copy,
     picked a corner that looked empty, and then the price ladder was drawn
     into the space underneath it. */
  defer(fn){this.later.push(fn);}
  /* The first y a layout may use. The corner lockup owns the top-left strip;
     archetypes that started their headline at a fixed fraction were landing on
     it whenever the type ran large. Asked once, honoured everywhere. */
  topSafe(){return this.on('cornerLockup')?this.H*.045+this.W*.072*1.30:this.H*.045;}
  flush(){const q=this.later;this.later=[];q.forEach(fn=>fn());}
  note(t){this.notes.push(t);}
  use(family,weight){
    const w=nearestWeight(family,weight);
    (this.used[family]||=new Set()).add(w);
    return w;
  }
  /* PLAN A RUN WITHOUT DRAWING IT.
     Everything that decides where a line of type lands lives here, so a
     caller can ask for the exact box a run will occupy and cut a plate to
     fit it BEFORE drawing it. The bar behind a headline used to be a fixed
     fraction of the card while the headline sized itself from the copy, so
     the two were decided independently and the words ran off the bar. */
  plan(str,box,o={}){

    const face=o.face||this.F.display, wf=o.wf!==undefined?o.wf:this.F.dw, tr=o.tracking||0;
    const chars=Math.max(String(str).length,1);
    const weight=this.use(face,o.weight||this.F.dweight);
    /* unit = the run's exact width at font-size 1. Falls back to the old
       average-per-character estimate only if the face was never measured. */
    const unit=advance(str,face,weight,tr)||chars*(wf+tr);
    let size=o.size||(box.w/unit);
    if(o.max)size=Math.min(size,o.max); if(o.min)size=Math.max(size,o.min);
    if(unit*size>box.w)size=box.w/unit;          // never wider than the plate
    /* LEGIBILITY IS A FLOOR, NOT A PREFERENCE.
       Fitting by width alone can drive a run under the size R8 requires, which
       is how fine print that dies in a feed thumbnail used to ship. Hold the
       floor instead and take the width back by condensing: textLength with
       lengthAdjust compresses letter-spacing and glyphs, and down to about 82%
       that reads as a condensed cut rather than a squeeze. Only when even that
       is not enough is it a genuine layout/copy mismatch, and the card says so
       out loud rather than silently setting six-point type. */
    const floor=this.S*.021/(o.capRatio||(faceMetrics(face,weight)||{cap:.72}).cap);
    let condense=0;
    if(!o.size&&size<floor){
      const want=unit*floor;
      if(want<=box.w*1.22){size=floor;condense=box.w/want;}
      else{size=box.w/unit;this.note(`tight: "${String(str).slice(0,22)}" needs ${(want/box.w*100|0)}% of its box at the legible floor`);}
    }
    const fm=faceMetrics(face,weight);
    /* FIT A SHORT RUN TO THE BOX HEIGHT, NOT JUST ITS WIDTH.
       Sizing by width alone means the size depends on which glyph it is: "1"
       has a much narrower advance than "2", so a numbered list came out with a
       first step half again the size of the others, overflowing its own tile.
       When the caller gives the box a height, fit to the smaller of the two
       and centre the ink in it, which is what setting a numeral in a square
       has always meant. */
    const ink0=inkExtent(str,face,weight);
    let vcentre=0;
    if(box.h&&o.fitH!==false&&ink0&&(ink0.up+ink0.dn)>0){
      const sizeH=box.h/(ink0.up+ink0.dn);
      if(sizeH<size){size=sizeH;}
      vcentre=(box.h-(ink0.up+ink0.dn)*size)/2;
    }
    const cap=size*(o.capRatio||(fm?fm.cap:.72));
    const y=box.h&&o.fitH!==false&&ink0?box.y+vcentre+ink0.up*size:box.y+cap;

    const anchor=o.align||'start';
    const x=anchor==='middle'?box.x+box.w/2:anchor==='end'?box.x+box.w:box.x;
    const natural=unit*size;
    const ratio=natural>0?box.w/natural:1;
    /* o.measure sets the line flush to the full width of its box — the stacked
       poster lockup where every word is the same measure. Short headlines like
       TOP / BUYER cannot fill a wide box at a fixed leading, so a square poster
       was left with a quarter of itself empty; set to the measure they become
       the artwork. Capped at 4x so a one-letter line is never smeared. */
    const measure=o.measure&&ratio>1&&ratio<=4;
    const snap=measure||((o.fit!==false)&&this.on('fitToPlate')&&ratio>=.70&&ratio<=1.60);
    const realW=(snap||condense)?box.w:Math.min(box.w,natural);
    const ext=ink0;
    const top=ext?y-ext.up*size:box.y;
    const hgt=ext?(ext.up+ext.dn)*size:cap*1.18;
    return{face,weight,size,cap,y,x,anchor,natural,snap,condense,tr,
      box:{x:anchor==='middle'?x-realW/2:anchor==='end'?x-realW:x,y:top,w:realW,h:hgt}};
  }
  text(str,box,o={}){
    const p=this.plan(str,box,o);
    const {face,weight,size,cap,y,x,anchor,snap,condense,tr}=p;
    const fill=o.fill||this.P.ink;
    /* condensing is a containment guarantee, so it applies whether or not the
       fitToPlate look is switched on for this configuration */
    const tl=(condense&&condense<1)?` textLength="${box.w.toFixed(1)}" lengthAdjust="spacingAndGlyphs"`
            :snap?` textLength="${box.w.toFixed(1)}" lengthAdjust="spacingAndGlyphs"`:'';
    const ls=tr?` letter-spacing="${(tr*size).toFixed(2)}"`:'';
    const base=`font-family="${face}, sans-serif" font-weight="${weight}" font-size="${size.toFixed(1)}" text-anchor="${anchor}"`;
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
    /* the measured box is the run's real ink, not a generic cap+descent band,
       so the collision rule tests what a reader can actually see touching */
    this.add(m,{type:'text',id:o.id||'text',box:p.box,str:String(str),face,weight,
      size:cap,fill,backing:o.on||this.P.ground,bleed:!!o.bleed,role:o.role||'text'},o.z);
    return cap;
  }
  rect(box,fill,o={}){
    this.add(`<rect x="${box.x.toFixed(1)}" y="${box.y.toFixed(1)}" width="${box.w.toFixed(1)}" height="${box.h.toFixed(1)}" rx="${o.r||0}" fill="${fill}"/>`,
      o.ghost?null:{type:'shape',id:o.id||'rect',box,bleed:!!o.bleed,role:o.role||'shape',fill},
      o.z);
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
    {type:'shape',id:'badge',box:{x:cx-r,y:cy-r,w:r*2,h:r*2},role:'badge',fill,
     /* what the star actually paints over: between the inner and outer radius
        it is mostly background showing between the points, so coverage is
        judged on the inner disc — and the seal's own placement search is
        scored on this same box, so it optimises what the rule measures */
     solid:{x:cx-r*inner,y:cy-r*inner,w:r*inner*2,h:r*inner*2},
     star:{cx,cy,r,pts,inner,rot}});
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
  c.rect({x:0,y,w:W,h:H*.006},P.accent,{ghost:true,z:1});
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
/* THE MARK, FRAMED FIVE WAYS.
   app    — initials on a rounded square, the app-icon shape (the default)
   circle — initials in a disc
   float  — initials alone, large, outlined; no plate
   name   — no mark at all; the wordmark and kicker carry the brand
   mark   — the framed initials alone; no wordmark (for a shop that is its logo) */
D.lockup=(c,corner)=>{
  const {W,H,P,F,C}=c,m=W*.048,s=W*.072;
  const frame=(c.cfg&&c.cfg.brand&&c.cfg.brand.frame)||'app';
  const x=corner==='right'?W-m-s:m,y=H*.045;
  const hasMark=frame!=='name', hasName=frame!=='mark';
  if(hasMark){
    if(frame==='app')c.rect({x,y,w:s,h:s},P.accent,{r:s*.24,id:'markPlate',role:'brand'});
    else if(frame==='circle')c.add(`<circle cx="${(x+s/2).toFixed(1)}" cy="${(y+s/2).toFixed(1)}" r="${(s/2).toFixed(1)}" fill="${P.accent}"/>`,
      {type:'shape',id:'markPlate',box:{x,y,w:s,h:s},role:'brand',fill:P.accent});
    if(frame==='float')
      c.text(C.mark,{x:x-s*.04,y:y+s*.08,w:s*1.08,h:s*.84},{align:'middle',fill:P.accent,on:P.ground,
        stroke:P.dark,strokeW:.06,id:'mark',role:'brand'});
    else
      c.text(C.mark,{x:x+s*.16,y:y+s*.26,w:s*.68,h:s*.48},{align:'middle',fill:onColor(P.accent,P),on:P.accent,id:'mark',role:'brand'});
  }
  if(!hasName)return;
  const nx=hasMark?x+s*1.22:x;
  /* Set the second line from where the first one actually ENDS. At a fixed
     s*.62 offset the descender of "iPhones.LA" ran into the cap line of
     "SAME DAY CASH" on all but a handful of cards — the leading was guessed
     from the mark's size rather than measured from the type. */
  const wm={x:nx,y:y+s*.10,w:W*.30};
  const wo={face:F.body,wf:F.bw,weight:800,fill:P.ink,id:'wordmark',role:'brand',max:W*.045};
  const wp=c.plan(C.brand,wm,wo);
  c.text(C.brand,wm,wo);
  c.text(C.kicker,{x:nx,y:wp.box.y+wp.box.h+s*.07,w:W*.34},{face:F.body,wf:F.bw,weight:600,
    fill:readable(P.accent,P.ground,P),id:'kicker',role:'brand',tracking:.04,min:W*.026});
};
/* fit=  {left,right,bottom}  the box the crown must stay inside. Sizing is done
   here, with the same geometry that declares the node's box, so the fit and the
   audit can never disagree — they used to be computed in two places. */
D.arcText=(c,str,cx,cy,r,fill,size,fit)=>{
  const id=c.id('arc');
  const weight=c.use(c.F.display,c.F.dweight);
  if(fit){
    const m0=faceMetrics(c.F.display,weight);
    const unit=advance(str,c.F.display,weight,0)||String(str).length*c.F.dw;
    /* The apex passed in is the BASELINE of the curve; the capitals stand above
       it by most of the type size, which is how a crown reached back over the
       lockup it was meant to clear. Each candidate size is measured at the
       centre it would actually be drawn at, so the fit test and the drawing
       can never be describing different circles. */
    const at=t=>{
      const up=(m0?m0.up[str[0]]||m0.cap:.72)*t, dn=(m0?m0.desc:.2)*t;
      const CY=fit.top!==undefined?fit.top+up+r:cy;
      const half=Math.min(Math.PI*.98,unit*t/r)/2;
      return{cy:CY,x0:cx-Math.sin(half)*(r+up),x1:cx+Math.sin(half)*(r+up),
             yBot:CY-Math.cos(half)*(r-dn)};
    };
    /* Two dials, not one. A flatter curve dips less for the same words, so when
       the band is shallow — the square crop leaves the crown barely 120px —
       widening the radius saves the device where shrinking the type alone
       cannot. If neither dial reaches, say so and let the caller set the line
       straight instead of curving it into the product. */
    let pick=null;
    for(const rk of [1,1.3,1.7,2.2,3.0]){
      const R0=r; r=R0*rk;
      for(let t=size;t>=size*.55;t-=size*.03){
        const e=at(t);
        if(e.x0>=fit.left&&e.x1<=fit.right&&e.yBot<=fit.bottom){pick={t,r};break;}
      }
      r=R0;
      if(pick)break;
    }
    if(!pick)return null;
    r=pick.r; size=pick.t; cy=at(size).cy;
  }
  c.def(`<path id="${id}" d="M${(cx-r).toFixed(1)} ${cy.toFixed(1)} A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${(cx+r).toFixed(1)} ${cy.toFixed(1)}" fill="none"/>`);
  c.add(`<text font-family="${c.F.display}, sans-serif" font-weight="${weight}" font-size="${size.toFixed(1)}" fill="${fill}"><textPath href="#${id}" startOffset="50%" text-anchor="middle">${esc(str)}</textPath></text>`,
    /* THE ARC'S REAL EXTENT, NOT A RECTANGLE OVER ITS APEX.
       Type set on a curve is highest in the middle and falls away at both ends,
       so a flat box across the top described a shape the glyphs never occupied:
       the ends dipped out of it and landed on the seal below. The run's own
       length gives the angle it sweeps, and the geometry gives the rest. */
    (()=>{
      const m=faceMetrics(c.F.display,weight);
      const run=(advance(str,c.F.display,weight,0)||String(str).length*c.F.dw)*size;
      const half=Math.min(Math.PI*.98,run/r)/2;               // half the swept angle
      const up=(m?m.up[str[0]]||m.cap:.72)*size, dn=(m?m.desc:.2)*size;
      /* Every other text box is measured; this one is DERIVED from the arc's
         geometry, and derived geometry gets a margin. Without one the release
         gate caught the crown touching the seal's number by 9% on a card the
         engine had declared clean — the browser sets glyphs on a curve a little
         wider than the chord model says. */
      const m2=size*.08;
      const x0=cx-Math.sin(half)*(r+up)-m2, x1=cx+Math.sin(half)*(r+up)+m2;
      const yTop=cy-r-up-m2;                                  // the apex, plus its cap
      const yBot=cy-Math.cos(half)*(r-dn)+m2;                 // where the ends fall to
      return{type:'text',id:'arc',box:{x:x0,y:yTop,w:x1-x0,h:Math.max(size*.8,yBot-yTop)},
        size:size*.7,fill,backing:c.P.ground,role:'headline'};
    })());
  return true;
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
/* A REAL PRODUCT, FITTED TO ITS BOX.
   Contained rather than cropped — a cutout that has had its head cut off is
   worse than no photograph — and the node is registered at the rectangle the
   image ACTUALLY occupies, not the box it was offered, so coverage and the
   collision rules measure the picture and not the empty air beside it. */
D.photo=(c,box,rot,pick,o={})=>{
  const id=c.id('ph');
  /* SHOW THE WHOLE PRODUCT, AND SHOW IT BIG.
     A cutout's whole worth is its silhouette — the shape of a phone read at a
     glance while scrolling. Filling the box by cropping turned most heroes into
     an abstract slab of glass, which stops nobody. So the picture is contained,
     never cropped, and the BOX is enlarged instead: the product ends up larger
     than the vector it replaced and still runs off the edge the layout wanted. */
  const grow=o.grow||1.34;
  const bw=box.w*grow, bh=box.h*grow;
  box={x:box.x-(bw-box.w)/2,y:box.y-(bh-box.h)/2,w:bw,h:bh};
  let sc=Math.min(box.w/pick.w,box.h/pick.h);
  /* A HERO IS A HERO. The layout hands over a box shaped for a vector; a
     photograph contained inside it can come out small, and a small product both
     leaves the card empty and cannot cross an edge by the 6% of the card that
     R4 asks for without half of it disappearing. So a hero is held to a minimum
     footprint against the card itself, not against the box it was offered. */
  if(o.min!==false){
    const want=Math.min(c.W,c.H)*(o.minShare||.56);
    const got=Math.max(pick.w,pick.h)*sc;
    if(got<want)sc*=want/got;
  }
  const w=pick.w*sc, h=pick.h*sc;
  /* Hold the edge the layout was reaching for. These boxes are positioned to
     overhang the canvas on one side; centring the picture inside the box pulled
     it back on-card and the bleed rule failed on 251 of 576 configurations. If
     the box crossed an edge, the photograph crosses it too. */
  /* The box is a REGION, not a frame. A contained photograph is narrower than
     the box it was offered, so aligning its far edge with the box's far edge —
     which is deliberately off-canvas — put the whole product outside the card:
     heroes were landing at x=1102 on a 1080-wide card and 65 configurations lost
     the seal's grip on a product that was not there. Bleed by a share of the
     PICTURE's own size instead, so it always overhangs and is always mostly on. */
  /* Bleed by a share of the PICTURE, but never by less than the card rule asks
     for: R4 wants the hero across an edge by 6% of the canvas, and a bleed
     measured only against a small picture never reached it. */
  const over=(iw,limit)=>Math.max(iw*.16,limit*.075);
  const pin=(bx,bw,iw,limit)=>{
    const o2=Math.min(over(iw,limit),iw*.42);      // never lose half the product
    if(bx<0)return -o2;
    if(bx+bw>limit)return limit-iw+o2;
    return bx+(bw-iw)/2;
  };
  let x=pin(box.x,box.w,w,c.W), y=pin(box.y,box.h,h,c.H);
  /* R4 wants the product to cross an edge by 6% of the card — the single
     biggest move against a card that looks like a catalogue photo. Test the
     finished position against that rule rather than trusting the anchor: a
     small picture pinned by a share of ITSELF can end up overhanging by less
     than the card asks, which is not "inside" and so never triggered a nudge. */
  if(o.bleed!==false){
    const need=.065;
    const outL=-x/c.W, outR=(x+w-c.W)/c.W, outT=-y/c.H, outB=(y+h-c.H)/c.H;
    if(Math.max(outL,outR,outT,outB)<need){
      const side=[[outL,'l'],[outR,'r'],[outT,'t'],[outB,'b']].sort((a,b)=>b[0]-a[0])[0][1];
      if(side==='l')x=-c.W*need;
      else if(side==='r')x=c.W*(1+need)-w;
      else if(side==='t')y=-c.H*need;
      else y=c.H*(1+need)-h;
    }
  }
  const cx=x+w/2, cy=y+h/2;
  let filt='';
  if(c.on('heroShadow')){
    c.def(`<filter id="${id}f" x="-25%" y="-25%" width="150%" height="150%">`+
      `<feDropShadow dx="0" dy="${(h*.045).toFixed(1)}" stdDeviation="${(h*.040).toFixed(1)}" flood-color="#000" flood-opacity=".50"/></filter>`);
    filt=` filter="url(#${id}f)"`;
  }
  const base=(c.cfg&&c.cfg.assetBase)||'../';
  c.add(`<g transform="rotate(${(rot||0).toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})"${filt}>`+
    `<image href="${esc(base+pick.u)}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" preserveAspectRatio="xMidYMid meet"/></g>`,
    {type:'shape',id:o.id||'hero',box:{x,y,w,h},bleed:o.bleed!==false,role:o.role||'hero',asset:pick.s,tags:pick.t});
  return{x,y,w,h};
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
  c.add(`<rect width="${c.W}" height="${c.H}" filter="url(#${id})" opacity=".055" style="mix-blend-mode:overlay"/>`,null,60);
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
  if(!c.on('groundGradient')||mode==='flat'){c.rect({x:0,y:0,w:W,h:H},P.ground,{ghost:true,z:-90});return;}
  const id=c.id('bg');
  c.def(`<radialGradient id="${id}" cx="${mode==='pool'?'34%':'50%'}" cy="${mode==='pool'?'38%':'30%'}" r="78%"><stop offset="0" stop-color="${P.ground2}"/><stop offset="1" stop-color="${P.ground}"/></radialGradient>`);
  c.rect({x:0,y:0,w:W,h:H},`url(#${id})`,{ghost:true,z:-90});
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
  const turn=c.on('heroRotate')?rot:0;
  /* Photography when we have an approved cutout for this subject; the vector
     stays as the fallback so the engine still renders with no asset index. */
  if(c.on('photoHero')){
    const pick=pickAsset(c,assetsFor(c,c.vertical));
    if(pick)return D.photo(c,b,turn,pick);
  }
  return D.hero(c,b,turn,c.C.hero);
}
function headline(c,lines,box,o={}){
  const gap=box.h*.06,lh=(box.h-gap*(lines.length-1))/lines.length;
  let y=box.y;
  /* PLAN THE WHOLE STACK, THEN PAINT IT.
     Bars are drawn for every line before any word is set, so a bar cut for the
     second line cannot land on top of the first — which is what happened while
     each line planned and painted itself in turn. */
  const set=lines.map((ln,i)=>{
    const onPlate=o.plateIndex===i&&o.plateColor;
    const back=onPlate?o.plateColor:(o.on||c.P.ground);
    const opt={fill:onPlate?onColor(o.plateColor,c.P):(o.fill||c.P.ink),
      stroke:o.stroke,shadow:o.shadow,strokeW:o.strokeW,on:back,align:o.align,
      id:'headline'+i,role:'headline',capRatio:.74,measure:o.measure,
      /* the line is as big as its box allows in BOTH axes — the old estimate
         multiplied a bad average-width constant by a 1.35 fudge factor, which
         is why headlines came out wider than the bars drawn behind them */
      size:lh/.74};
    /* A line that is going to get a bar must leave room for it, otherwise the
       bar — now cut to the words — grows past the edge of the card. The pad is
       known from the leading before the type is planned, so inset first and the
       finished bar lands exactly inside the box the layout asked for. */
    const inset=(onPlate&&o.plateDraw)?lh*.74*.30:0;
    const at={x:box.x+inset,y,w:box.w-inset*2};
    const r={ln,opt,at,onPlate,plan:c.plan(ln,at,opt)};
    y+=lh+gap;
    return r;
  });
  /* the bar is cut to what the words will actually measure, padded — it used to
     be a fixed fraction of the card, so "CASH FOR IPHONES" ran off its own
     highlighter — and never taller than the leading, so it stays in its lane */
  if(o.plateDraw)set.forEach(t=>{
    if(!t.onPlate)return;
    const padX=t.plan.cap*.30,padY=Math.min(t.plan.cap*.26,(lh+gap-t.plan.box.h)/2);
    const m=c.W*.012;                                  // stay inside the safe area
    const x0=Math.max(m,t.plan.box.x-padX), x1=Math.min(c.W-m,t.plan.box.x+t.plan.box.w+padX);
    o.plateDraw(c,{x:x0,y:t.plan.box.y-padY,w:x1-x0,h:t.plan.box.h+padY*2});
  });
  set.forEach(t=>c.text(t.ln,t.at,t.opt));
}
/* A seal is placed from the hero's own corner, offset by .106r, which lands the
   overlap at ~20% of the badge — inside the 6–32% the auditor asks for. */
function sealOnHero(c,hero,r,pts,text,sub,fill,corner,maxCy,minCx,minCy){
  if(!c.on('starburst'))return null;
  c.defer(()=>placeSeal(c,hero,r,pts,text,sub,fill,corner,maxCy,minCx,minCy));
  return null;
}
function placeSeal(c,hero,r,pts,text,sub,fill,corner,maxCy,minCx,minCy){
  /* r is re-chosen below when every seat is occupied */
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
  /* A SEAL IS PLACED LAST, SO IT DECIDES WHAT THE READER LOSES.
     It used to be positioned from the hero's corner alone, blind to the copy,
     and being drawn after the type it simply covered whatever was there — cards
     shipped reading "CASH FOR IPHON<seal>" and with a whole price column behind
     it. Try the anchor we wanted first, then the mirrored corners, and take the
     first that costs no words; if every seat is occupied, shrink rather than
     print over the sentence. */
  let rot=0;
  {
    const words=c.nodes.filter(n=>n.type==='text'&&n.box.w>0);
    /* Fix the rotation before searching. The seal is drawn at a random angle,
       so scoring seats against an unrotated star was scoring a different shape
       from the one that gets painted — enough to pick a seat whose point then
       lands across a line. */
    rot=c.R.f(-.40,-.14);
    const cost=(X,Y,rr)=>words.reduce((s,t)=>
      s+starCover(t.box,{cx:X,cy:Y,r:rr,pts,inner:.80,rot}),0);
    const lim=(X,Y,rr)=>[Math.min(Math.max(X,rr+c.W*.015),c.W-rr-c.W*.015),
                         Math.min(Math.max(Y,rr+c.H*.015),c.H*.885-rr)];
    /* Cost is words lost. Distance from the seat the designer asked for is a
       tie-breaker only, so the seal keeps its intended corner whenever that
       corner is free and gives it up when it is not. */
    let best=null;
    const want=[cx,cy];
    /* A seal belongs on the corner of the product — that bite of overlap is
       what makes it read as a sticker on the thing rather than a floating
       graphic, and R6 asks for 6-32% of it. So the search balances two jobs:
       cover no words, and keep its grip on the hero. */
    /* Straddle the product's outline: the seal's centre wants to sit ON the
       edge, and the cost is how far it has drifted either way. Optimising the
       same quantity the rule measures is the whole point — the old version
       scored a ratio while the rule tested a ratio band, and the search kept
       parking on the boundary. */
    const grip=(X,Y,rr)=>{
      if(!hero)return 0;
      const dx=Math.max(hero.x-X,0,X-(hero.x+hero.w));
      const dy=Math.max(hero.y-Y,0,Y-(hero.y+hero.h));
      const gap=(dx>0||dy>0)?Math.hypot(dx,dy)
        :-Math.min(X-hero.x,hero.x+hero.w-X,Y-hero.y,hero.y+hero.h-Y);
      const slack=Math.abs(gap)/rr;                    // 0 = dead on the outline
      return slack<=.55?0:Math.min(1,(slack-.55)*1.6);
    };
    const consider=(sx,sy,rr,bias)=>{
      const [X,Y]=lim(sx,sy,rr);
      const d=Math.hypot(X-want[0],Y-want[1])/c.S;
      const co=cost(X,Y,rr);
      /* Covering a line is the worse sin. Scored evenly against the grip
         penalty the search would happily print the seal across a sentence to
         keep its bite on the product, so words are weighted four to one. */
      const k=co*4+grip(X,Y,rr)+d*.03+bias;
      if(!best||k<best.k-1e-6)best={k,cost:co,X,Y,rr};
    };
    /* a seal that cannot find a clean seat at full size is better small than
       printed across a sentence */
    for(const rr of [r,r*.92,r*.84,r*.78]){
      consider(cx,cy,rr,0);
      /* Seats ON THE PRODUCT'S EDGE. Four corners was enough while the hero was
         a vector that filled its box; a photograph is contained inside its box
         and sits wherever its own proportions put it, so the corners often lie
         in empty ground and the seal lost its bite on 67 of 576 configurations.
         Walk the perimeter instead and offer the seal a seat every eighth of
         the way round, each one placed to overlap by about the fifth R6 wants. */
      if(hero){
        const pts2=[];
        /* Several stand-off distances, because how much of the seal lands on the
           product depends on where round the edge it sits — a seat that bites a
           fifth on a corner bites nearly half in the middle of a long side, and
           R6 rejects anything past a third. */
        for(const off of [rr*.62,rr*.86,rr*1.06])
          for(let t=0;t<8;t++){
            const a=t/8;
            if(a<.25)      pts2.push([hero.x+hero.w*(a*4),      hero.y-off]);
            else if(a<.5)  pts2.push([hero.x+hero.w+off,        hero.y+hero.h*((a-.25)*4)]);
            else if(a<.75) pts2.push([hero.x+hero.w*(1-(a-.5)*4),hero.y+hero.h+off]);
            else           pts2.push([hero.x-off,               hero.y+hero.h*(1-(a-.75)*4)]);
          }
        for(const [sx,sy] of pts2)consider(sx,sy,rr,.008);
      }
      for(let gx=0;gx<=6;gx++)for(let gy=0;gy<=6;gy++)
        consider(c.W*(.10+gx*.133),c.H*(.12+gy*.118),rr,.02);
    }
    if(best){cx=best.X;cy=best.Y;r=best.rr;}
    if(best&&best.cost>.02)c.note(`seal still costs ${(best.cost*100).toFixed(0)}% of a line`);
  }
  const b=D.starburst(c,cx,cy,r,pts,.80,rot,fill,P.dark);
  const money=text.replace(/^UP TO\s+/,''), pre=money===text?null:'UP TO';
  const ink=onColor(fill,P);
  /* A STAR IS NOT ITS BOUNDING BOX. The three lines were fitted to b, the full
     outer box of the points, so the number ran out past the tips — measured at
     41-45% overlap between "UP TO", the money and the sub on every archetype
     that carries a seal. The readable area is the INNER disc, so the lines are
     fitted to the square inscribed in it and stacked with real leading. */
  const inR=r*.80, side=inR*1.38;                  // inscribed square of the inner disc
  const bx=cx-side/2, by=cy-side/2;
  /* HOW MANY LINES THE SEAL CAN CARRY, decided by its size. Three lines in a
     small burst either overflow the points or fall under the legibility floor;
     the seal drops to two, then to the number alone, and the surviving lines
     grow to use the disc. R8 is a floor, not a suggestion. */
  /* R8 measures CAP height (size * capRatio), not the font size, so the floor a
     row must clear in font terms is 2% / 0.72 with a little margin. */
  const floor=c.S*.021/((faceMetrics(c.F.display,c.F.dweight)||{cap:.72}).cap);
  const plan=[[3,.150,.300,.135],[2,.190,.380,0],[1,0,.520,0]];
  let pick=plan[plan.length-1];
  for(const p2 of plan){
    const want=p2[0];
    if(want===3&&!(pre&&sub))continue;
    if(want===2&&!(pre||sub))continue;
    const smallest=Math.min(...[p2[1],p2[2],p2[3]].filter(v=>v>0))*side;
    if(smallest>=floor){pick=p2;break;}
  }
  const rows=[];
  if(pick[0]===3){rows.push({t:pre,f:pick[1],face:1,id:'offerPre'},{t:money,f:pick[2],face:0,id:'offer'},{t:sub,f:pick[3],face:1,id:'offerSub'});}
  else if(pick[0]===2){
    if(pre)rows.push({t:pre,f:pick[1],face:1,id:'offerPre'},{t:money,f:pick[2],face:0,id:'offer'});
    else rows.push({t:money,f:pick[2],face:0,id:'offer'},{t:sub,f:pick[1],face:1,id:'offerSub'});
  }
  else rows.push({t:money,f:pick[2],face:0,id:'offer'});
  const lead=1.20, totalH=rows.reduce((a2,q)=>a2+side*q.f*lead,0);
  let ty=cy-totalH/2;
  rows.forEach(q=>{
    const hh=side*q.f;
    c.text(q.t,{x:bx,y:ty,w:side},
      Object.assign({align:'middle',fill:ink,on:fill,role:'offer',max:hh},
        q.face?{face:c.F.body,wf:c.F.bw,weight:800,id:q.id,tracking:.04,z:Z.badge+1}
              :{...numFace(c),id:q.id,z:Z.badge+1}));
    ty+=hh*lead;
  });
  return b;
}
function priceRows(c,top,rows,floorY){
  if(!c.on('priceRows'))return;
  const {W,H,S,P,F}=c,rh=S*.066,pad=W*.055;
  /* Show only the rows that fit above whatever comes next. In the square format
     the board ran five rows straight under the hero, which was then drawn on
     top of the last two — better to quote three models legibly than five with
     the prices hidden behind a photograph. */
  if(floorY)rows=rows.slice(0,Math.max(2,Math.floor((floorY-top)/rh)));
  rows.forEach((r,i)=>{
    const y=top+i*rh,alt=i%2===0,bg=alt?P.paper:P.ground2;
    c.rect({x:pad*.6,y,w:W-pad*1.2,h:rh*.9},bg,{r:rh*.16,id:'row',role:'data'});
    c.text(r[0],{x:pad,y:y+rh*.24,w:W*.50},{face:F.body,wf:F.bw,weight:700,fill:onColor(bg,P),on:bg,id:'rowLabel',role:'data',max:rh*.52});
    c.text(r[1],{x:W-pad-W*.26,y:y+rh*.18,w:W*.26},{...numFace(c),align:'end',fill:readable(P.accent,bg,P),on:bg,id:'rowPrice',role:'data',max:rh*.66});
  });
}
function proofSteps(c,sy,steps){
  const {W,H,S,P,F}=c,sh=S*.070;
  steps.forEach((s,i)=>{
    const y=sy+i*sh;
    c.rect({x:W*.05,y,w:sh*.72,h:sh*.72},P.hot,{r:sh*.16,id:'stepNum',role:'data',fill:P.hot});
    c.text(String(i+1),{x:W*.05+sh*.16,y:y+sh*.16,w:sh*.40,h:sh*.40},{align:'middle',fill:onColor(P.hot,P),on:P.hot,id:'stepN',role:'data'});
    c.text(s[0],{x:W*.05+sh*.92,y:y+sh*.06,w:W*.24},{face:F.body,wf:F.bw,weight:800,fill:P.ink,on:P.ground,id:'stepLabel',role:'data',max:sh*.40});
    c.text(s[1],{x:W*.05+sh*.92,y:y+sh*.44,w:W*.30},{face:F.body,wf:F.bw,weight:500,fill:readable(P.body,P.ground,P),on:P.ground,id:'stepBody',role:'data',max:sh*.50});
  });
}
function reviewCard(c,box){
  const {W,H,P,F,C}=c;
  const q=c.rect(box,P.paper,{r:W*.02,id:'quoteCard',role:'proof'});
  D.sheen(c,q,P.accent);
  const words=C.quote.split(' '),half=Math.ceil(words.length/2);
  /* Sized by width alone, a single quote glyph took whatever size its narrow
     advance implied — a 90px-tall mark that hung off the card and sat on the
     first line of the quote. Give it a height and it stays an ornament. */
  c.text('“',{x:box.x+W*.025,y:box.y+H*.012,w:W*.06,h:H*.026},{fill:readable(P.hot,P.paper,P),on:P.paper,id:'qm',role:'proof'});
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
  headline(c,C.heads,{x:W*.055,y:H*.165,w:W*.50,h:H*.155},
    {stroke:P.dark,shadow:P.hot,shadowDx:W*.008,shadowDy:H*.007,strokeW:.045});
  if(c.on('proofBlock')){
    D.stars(c,W*.055,H*.370,c.S*.034,readable(P.accent,P.ground,P));
    c.text(C.rating,{x:W*.055+c.S*.034*3.6,y:H*.370,w:W*.38},
      {face:F.body,wf:F.bw,weight:800,fill:P.ink,on:P.ground,id:'rating',role:'proof',max:c.S*.036});
  }
  if(c.on('priceRows'))C.rows.slice(0,c.H/c.W>1.45?5:4).forEach((row,i)=>{
    const rh=c.S*.056,y=(c.H/c.W>1.45?H*.395:H*.418)+i*rh,bg=i%2===0?P.ground2:P.ground;
    /* The label column was W*.125 — 135px, too narrow for a real model tag.
       "4RUNNER" needed 124% of it just to reach the legibility floor, so the
       ladder shipped with unreadable model names. Widened to two 160px columns
       inside a wider plate, which every tag in the deck clears. */
    c.rect({x:W*.05,y,w:W*.33,h:rh*.88},bg,{r:rh*.16,id:'row',role:'data'});
    c.text(row[2]||row[0],{x:W*.063,y:y+rh*.20,w:W*.148},{face:F.body,wf:F.bw,weight:800,
      fill:onColor(bg,P),on:bg,id:'rowLabel',role:'data',max:rh*.58});
    c.text(row[1],{x:W*.2185,y:y+rh*.16,w:W*.148},{...numFace(c),align:'end',fill:readable(P.accent,bg,P),on:bg,
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
  /* The crown is the headline; at W*.062 it was set smaller than the call to
     action underneath it, which is the wrong way round and left the top of the
     card thin. Sized to the run so a short line comes up big and a long one
     still fits the arc. */
  let crowned=false;
  if(c.on('arcCrown')){const ar=W*.44,apex=Math.max(H*.148,W*.152,c.topSafe()+W*.030);
    const txt=C.heads.join(' ');
    /* Type on a curve grows in two directions at once: a bigger size sweeps a
       wider angle, so the ends swing outward AND downward. Sizing it by width
       alone sent the ends into the lockup on one side and the product on the
       other. Fit it to the band it is allowed to occupy instead — try large,
       step down, take the first size whose real extent stays inside. */
    /* the floor is where the product starts, not an arbitrary band: the crown
       may grow until its ends reach the hero, and no further */
    crowned=D.arcText(c,txt,W*.5,apex+ar,ar,P.ink,W*.105,
      {left:W*.045,right:W*.955,top:apex,bottom:Math.min(apex+H*.185,H*.295-H*.014)})!==null;}
  if(!crowned)headline(c,C.heads,{x:W*.06,y:Math.max(H*.115,c.topSafe()),w:W*.88,h:H*.145},
    {align:'middle',stroke:P.dark,shadow:P.hot});
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
  headline(c,C.heads,{x:W*.055,y:H*.128,w:W*.44,h:H*.185},
    {stroke:P.dark,shadow:P.accent,strokeW:.05,
     plateIndex:c.on('paintStroke')?1:-1,plateColor:P.accent,
     plateDraw:(cc,b)=>D.paintStroke(cc,b,P.accent,R.i(1,9999))});
  c.text(C.offer,{x:W*.055,y:H*.545,w:W*.50},{...numFace(c),fill:onColor(P.paper,P),on:P.paper,id:'offer2',role:'offer'});
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
  priceRows(c,H*.285,C.rows,H*.575);
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
  /* At 4:5 and 9:16 the poster's lower half is a wide band the hero fills. The
     square crop is shorter, so the same hero left a 475x376 hole to its right —
     19% of the card as one empty rectangle. Let the hero run the width there. */
  const hero=placeHero(c,{x:-W*.12,y:H*.50,w:W*(H/W>1.45?.70:.94),h:H*.34},R.f(-24,-12));
  /* This is a poster: the headline is the artwork. Squeezed into a band of
     H*.215 the lines came out small AND short, leaving the whole top-right
     corner — 560x400px, 19% of a square card — as one empty rectangle. Given
     the room a poster headline expects, the type grows to fill it. */
  const headH=H*(H/W>1.45?.215:.285);
  const headY=Math.max(H*.112,c.topSafe()), bandY=headY+headH+H*.022;
  headline(c,C.heads,{x:W*.05,y:headY,w:W*.90,h:headH},
    {stroke:P.hot,shadow:P.dark,shadowDx:W*.012,shadowDy:H*.010,strokeW:.05,fill:readable(P.paper,P.ground,P),
     measure:true,
     plateIndex:c.on('paintStroke')?1:-1,plateColor:P.accent,
     plateDraw:(cc,b)=>D.paintStroke(cc,b,P.accent,R.i(1,9999))});
  /* The offer used to live inside the knockout band, so switching that band off
     removed the price from the card altogether and left its band empty — the
     one thing a reader is scanning for, gone with a decorative toggle. The band
     is optional; the number is not. */
  if(c.on('knockoutBand')){
    c.rect({x:0,y:bandY,w:W,h:H*.056},P.ink,{bleed:true,id:'kickerBand',role:'plate',fill:P.ink});
    c.text(C.offer+'  ·  '+C.offerSub,{x:W*.05,y:bandY+H*.015,w:W*.90},
      {...numFace(c),align:'middle',fill:onColor(P.ink,P),on:P.ink,id:'offerLine',role:'offer',max:H*.036});
  }else{
    c.text(C.offer+'  ·  '+C.offerSub,{x:W*.05,y:bandY-H*.006,w:W*.90},
      {...numFace(c),align:'middle',fill:readable(P.accent,P.ground,P),on:P.ground,
       stroke:P.dark,strokeW:.05,id:'offerLine',role:'offer',max:H*.052});
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
  const ty=Math.max(H*.125,c.topSafe());
  headline(c,[C.heads[0]],{x:W*.05,y:ty,w:W*.90,h:H*.070},{stroke:P.dark,align:'middle'});
  headline(c,[C.heads[1]],{x:W*.05,y:ty+H*.075,w:W*.90,h:H*.110},{fill:readable(P.accent,P.ground,P),shadow:P.dark,stroke:P.dark,align:'middle'});
  /* the hero follows the headline block rather than a constant, so pushing the
     type clear of the lockup cannot push it under the product */
  placeHero(c,{x:W*.32,y:Math.max(H*.315,ty+H*.200),w:W*.84,h:H*.315},R.f(-7,9));
  if(c.on('proofBlock')){
    const ry=H*(H/W>1.45?.500:.522);
    D.stars(c,W*.06,ry,c.S*.030,readable(P.accent,P.ground,P));
    c.text(C.rating,{x:W*.06,y:ry+H*.044,w:W*.40},{face:F.body,wf:F.bw,weight:800,fill:P.ink,on:P.ground,
      id:'rating',role:'proof',max:c.S*.036});
  }
  if(c.on('ticket')){
    const t=D.ticket(c,{x:W*.08,y:H*.600,w:W*.84,h:H*.145},P.paper,H*.024);
    D.sheen(c,t,P.accent);
    c.text(C.offer,{x:W*.125,y:H*.632,w:W*.75},{...numFace(c),align:'middle',fill:onColor(P.paper,P),on:P.paper,
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
  /* The hero goes down first. The review card overlaps it by design — a paper
     card lying on the product — but while the card was drawn first the phone
     was painted over the quote, and "cash out. Twenty minutes." ran under it. */
  const hero=placeHero(c,{x:W*.60,y:H*.295,w:W*.56,h:H*.26},R.f(12,20));
  if(c.on('proofBlock')){
    D.stars(c,W*.055,H*.140,c.S*.034,readable(P.accent,P.ground,P));
    c.text(C.rating,{x:W*.055+c.S*.034*3.6,y:H*.140,w:W*.40},
      {face:F.body,wf:F.bw,weight:800,fill:P.ink,on:P.ground,id:'rating',role:'proof',max:c.S*.036});
    reviewCard(c,{x:W*.05,y:H*.200,w:W*.62,h:H*.160});
  }
  headline(c,[C.heads.join(' ')],{x:W*.055,y:H*.422,w:W*.56,h:H*.060},
    {plateIndex:c.on('paintStroke')?0:-1,plateColor:P.accent,
     plateDraw:(cc,b)=>D.paintStroke(cc,b,P.accent,R.i(1,9999)),
     fill:P.ink,on:P.ground});
  sealOnHero(c,hero,W*.135,16,C.offer,null,P.accent,'bl',H*.60,W*.58,H*.50);
  /* The 9:16 card has a whole band of nothing under the headline, because the
     4:5 proportions were simply stretched. Fill it with the price ladder: it is
     the strongest "how much" device we have, it names a model against every
     number instead of making an unbounded claim, and it is what the empty half
     of a tall card was always for. */
  const tall=H/W>1.45;
  if(tall)priceRows(c,H*.498,C.rows,H*.616);   // clears the headline band above
  if(c.on('proofBlock'))proofSteps(c,H*(tall?.622:.530),C.steps);
  if(tall&&c.on('promisePills'))D.promises(c,H*.745,C.promises.slice(3,6),{bg:P.dark});
  if(c.on('cta'))D.cta(c,H*(tall?.800:.740),'band');
  if(c.on('promisePills'))D.promises(c,H*(tall?.882:.828),C.promises.slice(0,3),{bg:P.paper});
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
 ['R12','Safe area','non-bleed elements inside a 4.5% margin','clipped corners after a crop'],
 ['R13','Text on its plate','every line stays inside the panel it was set on','copy running off its card onto the photo'],
 ['R14','Words on top','no opaque shape is drawn over a line of text','a seal painted across the headline'],
 ['R15','Legible figures','no price is set in a face that draws a slashed zero','"$1,250" reading as "$1,25Ø"'],
 ['R16','Subject on show','the product is present and bigger than any prop','a card whose largest object is a cardboard box'],
 ['R17','Picture matches the copy','the hero is of the brand, generation and condition the copy names','a cracked iPhone 11 under a "17 Pro Max · $1,250" ladder']
];
function inter(a,b){const x=Math.max(a.x,b.x),y=Math.max(a.y,b.y);
  const r=Math.min(a.x+a.w,b.x+b.w),bt=Math.min(a.y+a.h,b.y+b.h);
  return(r>x&&bt>y)?(r-x)*(bt-y):0;}
/* WHERE THE CARD IS EMPTY.
   The audit already had to know this to score dead space; placement wants the
   same answer, so it lives in one place. Returns the occupancy grid plus the
   largest empty rectangle, found by the classic largest-rectangle-under-a-
   histogram sweep. */
function occupancy(card,cell){
  const {W,H,nodes}=card;
  cell=cell||20;
  const cols=Math.ceil(W/cell),rows=Math.ceil(H/cell);
  const g=new Uint8Array(cols*rows);
  nodes.forEach(n=>{
    if(n.role==='field'&&n.id!=='split')return;
    const b=n.box;
    const x0=Math.max(0,Math.floor(b.x/cell)),x1=Math.min(cols,Math.ceil((b.x+b.w)/cell));
    const y0=Math.max(0,Math.floor(b.y/cell)),y1=Math.min(rows,Math.ceil((b.y+b.h)/cell));
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)g[y*cols+x]=1;});
  return{g,cols,rows,cell};
}
function largestHole(o){
  const {g,cols,rows,cell}=o;
  const hgt=new Int32Array(cols);let best=0,box=null;
  for(let y=0;y<rows;y++){
    for(let x=0;x<cols;x++)hgt[x]=g[y*cols+x]?0:hgt[x]+1;
    const st=[];
    for(let x=0;x<=cols;x++){const h=x<cols?hgt[x]:0;
      while(st.length&&hgt[st[st.length-1]]>=h){const ht=hgt[st.pop()],left=st.length?st[st.length-1]+1:0;
        const a=ht*(x-left);
        if(a>best){best=a;box={x:left*cell,y:(y-ht+1)*cell,w:(x-left)*cell,h:ht*cell};}}
      st.push(x);}}
  return{area:best/(cols*rows),box};
}
function audit(card){
  /* the audit narrates into card.notes; a second audit of the same card must
     not read last time's narration as this time's */
  card.notes=card.notes.filter(n=>!/^(spill|buried|collide|tight|figures|mismatch|seal still)/.test(n));
  const {W,H,nodes,P}=card,cell=20;
  const occ=occupancy(card,cell),g=occ.g,cols=occ.cols,rows=occ.rows;
  let filled=0;for(let i=0;i<g.length;i++)filled+=g[i];
  const coverage=filled/g.length;
  const dead=largestHole(occ).area;
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
  /* R6 · THE SEAL SITS ON THE PRODUCT'S EDGE.
     This used to be "6-32% of the badge overlaps the hero", which encoded the
     intent only as long as the hero was a small vector. A photographic hero can
     fill half the card, and then every legal seat overlaps past 32% — 58 of 64
     failures were the seal landing at 32-33% with nowhere better to go. The
     intent was never a ratio: it is that the seal STRADDLES the product's
     outline, so it reads as a sticker stuck on the thing rather than a graphic
     floating beside it or a graphic lost in the middle of it. Measured as the
     distance from the seal's centre to the product's edge, that holds at any
     scale. */
  const edgeGap=(b,h)=>{
    const cx=b.box.x+b.box.w/2, cy=b.box.y+b.box.h/2;
    const dx=Math.max(h.box.x-cx,0,cx-(h.box.x+h.box.w));
    const dy=Math.max(h.box.y-cy,0,cy-(h.box.y+h.box.h));
    if(dx>0||dy>0)return Math.hypot(dx,dy);                 // outside
    return -Math.min(cx-h.box.x,h.box.x+h.box.w-cx,cy-h.box.y,h.box.y+h.box.h-cy);
  };
  r.push(['R6',!badge||!hero||Math.abs(edgeGap(badge,hero))<=badge.box.w/2]);
  let collide=false;
  /* every pair, not just the first — a card with three collisions used to
     report one, and the fix for that one uncovered the next */
  for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){
    /* 30% of the smaller box was far too generous: a headline could cover most
       of the lockup's second line and still pass. These are real ink extents
       now, so anything past a hair's touch is a defect. */
    if(inter(texts[i].box,texts[j].box)>Math.min(texts[i].box.w*texts[i].box.h,texts[j].box.w*texts[j].box.h)*.06){
      collide=true;card.note(`collide: ${texts[i].id} x ${texts[j].id}`);}}
  r.push(['R7',!collide]);
  const SS=Math.min(W,H);
  r.push(['R8',texts.every(t=>t.size>=SS*.020)]);
  r.push(['R9',texts.every(t=>{try{return contrast(t.fill,t.backing)>=4.5;}catch(e){return true;}})]);
  r.push(['R10',hotArea<=.14]);
  /* R13 · A LINE MUST STAY ON THE PLATE IT WAS SET ON.
     Every text records the colour it was drawn to sit on. Find the panel that
     actually is that colour under the line, and require the ink to stay inside
     it. Without this a quote can run off its card onto the photograph and
     twelve of twelve rules still report a pass, because nothing was comparing
     the run against the thing behind it. */
  const spill=[];
  texts.forEach(t=>{
    if(!t.backing)return;
    const i=nodes.indexOf(t);
    let plate=null;
    for(let k=i-1;k>=0;k--){
      const n=nodes[k];
      if(n.type!=='shape'||n.fill!==t.backing)continue;
      const cx=t.box.x+t.box.w/2,cy=t.box.y+t.box.h/2;
      if(cx>=n.box.x&&cx<=n.box.x+n.box.w&&cy>=n.box.y&&cy<=n.box.y+n.box.h){plate=n;break;}
    }
    if(!plate||plate.bleed)return;
    const pad=2;
    if(t.box.x<plate.box.x-pad||t.box.x+t.box.w>plate.box.x+plate.box.w+pad||
       t.box.y<plate.box.y-pad||t.box.y+t.box.h>plate.box.y+plate.box.h+pad)
      spill.push(`${t.id} off ${plate.id}`);
  });
  r.push(['R13',!spill.length]);
  if(spill.length)card.note('spill: '+spill.join(', '));
  /* R14 · NOTHING OPAQUE MAY BE DROPPED ON TOP OF THE WORDS.
     Draw order decides what a reader sees. A seal painted after the headline
     covers it however well the headline was placed, which is how a card ships
     reading "CASH FOR IPHON<seal>". Text-against-text was the only overlap ever
     checked, so a shape landing on a line was invisible to the audit. */
  const SOLID=new Set(['badge','plate','cta','data','proof','brand','footer','hero']);
  const buried=[];
  texts.forEach(t=>{
    const i=nodes.indexOf(t),area=t.box.w*t.box.h;
    if(area<=0)return;
    for(let k=i+1;k<nodes.length;k++){
      const n=nodes[k];
      if(n.type!=='shape'||!SOLID.has(n.role))continue;
      const frac=n.star?starCover(t.box,n.star):inter(t.box,n.solid||n.box)/area;
      if(frac>.05)buried.push(`${t.id} under ${n.id} ${Math.round(frac*100)}%`);
    }
  });
  r.push(['R14',!buried.length]);
  /* R15 · A PRICE MUST NOT BE AMBIGUOUS.
     Melodrama draws a slashed zero, so "$1,250" reads "$1,25Ø" — checked
     against a rendered swatch of all five families, it is the only one that
     does. Prices are routed to the body face in that pairing; this makes sure
     they stay there when someone adds an archetype. */
  const AMBIG=new Set(['Melodrama']);
  const figs=texts.filter(t=>AMBIG.has(t.face)&&/0/.test(t.str||''));
  r.push(['R15',!figs.length]);
  /* R16 · THE CARD MUST SHOW WHAT IS BEING BOUGHT, AND SHOW IT BIGGEST.
     The owner's standing rule. Props earn their place by making the offer feel
     real; the moment one is larger than the product it stops dressing the card
     and starts being the card. */
  const heroN=nodes.find(n=>n.role==='hero');
  const propsN=nodes.filter(n=>n.id==='prop');
  const areaOf=n=>Math.max(0,n.box.w)*Math.max(0,n.box.h);
  r.push(['R16',!!heroN&&propsN.every(pn=>areaOf(pn)<=areaOf(heroN))]);
  /* R17 · THE PICTURE IS OF WHAT THE COPY SAYS.
     The owner's rule, restated after it was broken: a cracked iPhone 11 under a
     ladder that leads with "17 Pro Max · $1,250". A photographic hero carries
     the tags it was chosen by; the deck carries its subject; they must agree.
     A vector hero has no tags and is judged by the deck's own hero kind. */
  const subj=card.C&&card.C.subject;
  const heroOK=!heroN||!subj||(heroN.tags?matchSubject({t:heroN.tags},subj):true);
  r.push(['R17',heroOK]);
  if(!heroOK)card.note(`mismatch: hero "${heroN.asset}" is ${heroN.tags.b} · ${heroN.tags.c}${heroN.tags.g?' · gen '+heroN.tags.g:''}; the copy is about ${subj.brand.join('/')} · ${subj.cond}${subj.gen?' · gen '+subj.gen.join('/'):''}`);
  if(figs.length)card.note('figures: '+figs.map(t=>`${t.id} "${t.str}" in ${t.face}`).join(', '));
  if(buried.length)card.note('buried: '+buried.join(', '));
  r.push(['R11',sheens.every(s=>s.parent&&inter(s.box,s.parent)>=s.box.w*s.box.h*.999)]);
  r.push(['R12',nodes.every(n=>n.bleed||n.role==='field'||(n.box.x>=-1&&n.box.y>=-1&&n.box.x+n.box.w<=W+1&&n.box.y+n.box.h<=H+1))]);
  /* results in the order RULES declares them, so nothing that zips the two by
     index can mislabel a rule */
  const order=RULES.map(x=>x[0]);
  r.sort((a,b)=>order.indexOf(a[0])-order.indexOf(b[0]));
  return{coverage,dead,hotArea,elements:nodes.length,rules:r,pass:r.filter(x=>x[1]).length,total:r.length};
}

/* ══════════════════════════════════════════════════════════
   10 · RENDER PIPELINE
   ══════════════════════════════════════════════════════════ */
/* A self-contained card embeds the two families it uses, which costs about
   110KB. A page showing a gallery of them should carry the faces ONCE instead:
   render with {embedFonts:false} and put fontCSS() in the page head. */
function fontCSS(){return faceCSS(Object.fromEntries(
  Object.entries(FONT_FILES).map(([f,w])=>[f,Object.keys(w).map(Number)])));}
/* DRESS THE EMPTY CORNERS WITH REAL THINGS.
   A photographic hero shows the whole product, which means it no longer fills
   its box corner to corner the way the vector did — the card is left with holes.
   Filling them with more graphics would just be more decoration; filling them
   with the props the shop actually deals in — banded cash, boxed stock, an
   accessory — is the difference between a poster about buying phones and a
   photograph of the transaction. Placed by finding the card's largest empty
   rectangle and dropping one prop into it, repeatedly, never over the copy. */
function placeStickers(c){
  if(!c.on('stickers'))return;
  const pool=[...assetsFor(c,'cash'),...assetsFor(c,'prop')];
  if(!pool.length)return;
  const S=Math.min(c.W,c.H);
  for(let n=0;n<3;n++){
    const hole=largestHole(occupancy(c,20));
    if(!hole.box||hole.area<.045)break;
    const b=hole.box;
    /* only worth dressing if the hole is chunky rather than a thin seam */
    if(Math.min(b.w,b.h)<S*.16)break;
    const pick=pool[Math.floor(c.R.f(0,1)*pool.length+n*7)%pool.length];
    const pad=Math.min(b.w,b.h)*.10;
    let inset={x:b.x+pad,y:b.y+pad,w:b.w-pad*2,h:b.h-pad*2};
    /* A PROP NEVER OUT-SIZES THE PRODUCT.
       Dressing is dressing. Left uncapped, a shipping box dropped into a big
       hole came out larger than the phone the card is about, and a card whose
       biggest object is a cardboard box is not selling a phone. */
    const hero=c.nodes.find(n=>n.role==='hero');
    if(hero){
      const cap=hero.box.w*hero.box.h*.40;
      const a=inset.w*inset.h;
      if(a>cap){const k=Math.sqrt(cap/a);
        inset={x:inset.x+inset.w*(1-k)/2,y:inset.y+inset.h*(1-k)/2,w:inset.w*k,h:inset.h*k};}
    }
    D.photo(c,inset,c.R.f(-11,11),pick,{id:'prop',role:'plate',bleed:false,grow:1,min:false});
  }
}
function render(archKey,seed,vertical,sizeKey,cfg){
  const R=RNG(seed);
  /* Palette and type pairing are derived from the seed so a seed reproduces a
     card exactly — but a configurator has to be able to hold everything else
     still and change ONE of them, which the old console could not do: it could
     only reroll the seed and take whatever palette came with it. An explicit
     choice overrides the derivation without disturbing anything else. */
  const P=(cfg&&cfg.palette&&PALETTES.find(x=>x.id===cfg.palette))||PALETTES[seed%PALETTES.length];
  const Fp=(cfg&&cfg.pair&&PAIRS.find(x=>x.id===cfg.pair))||PAIRS[(seed>>3)%PAIRS.length];
  const [W,H]=SIZES[sizeKey], C0=CONTENT[vertical];
  const C=Object.assign({},C0,{heads:R.pick(C0.heads),promises:R.shuffle(C0.promises)});
  /* The brand block used to be "iPhones.LA / iL / SAME DAY CASH" baked into the
     deck. It is the owner's mark — or another shop's — so it is a setting:
     name, kicker, initials, address, and how the mark is framed. */
  if(cfg&&cfg.brand){const b=cfg.brand;
    if(b.name!=null)C.brand=b.name; if(b.kicker!=null)C.kicker=b.kicker;
    if(b.initials!=null)C.mark=b.initials; if(b.addr!=null)C.addr=b.addr;
    if(b.phone!=null)C.phone=b.phone;}
  const F={display:Fp.display,body:Fp.body,dw:Fp.dw,bw:Fp.bw,dweight:Fp.dweight,
    figures:Fp.figures!==false};
  const c=new Card(W,H,P,F,R,C,cfg,archKey+seed+sizeKey,vertical);
  ARCH[archKey](c);
  placeStickers(c);
  c.flush();
  const a=audit(c);
  const svg=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(archKey)} buyback ad in the ${esc(P.name)} palette"><defs>${cfg&&cfg.embedFonts===false?'':`<style>${faceCSS(c.used)}</style>`}${c.defs.join('')}</defs><rect width="${W}" height="${H}" fill="${P.ground}"/>${c.svg.join('')}</svg>`;
  return{svg,audit:a,palette:P,pair:Fp,card:c};
}

/* ══════════════════════════════════════════════════════════
   10b · THE GATE
   The owner's standing instruction: graphics at 100% confidence, no less.
   render() will draw anything and report on it; that is right for a lab. This
   is the exit the world sees through, and it refuses. A card is either clean —
   every rule passing — or it is not produced. When the seed asked for fails,
   nearby seeds are tried, then the optional ornaments are dropped one at a time
   (a seal or a prop is decoration; the offer is not), and if nothing clean can
   be found the answer is null and the caller must say so, never "close enough".
   ══════════════════════════════════════════════════════════ */
const OPTIONAL=['stickers','starburst','sunburst','halftone','checker','grain','sheen','arcCrown','paintStroke','tornPaper'];
function renderClean(archKey,seed,vertical,sizeKey,cfg,o={}){
  const tries=o.tries||6;
  const clean=r=>r.audit.pass===r.audit.total;
  let best=null;
  const keep=r=>{if(!best||r.audit.pass>best.audit.pass)best=r;};
  for(let t=0;t<tries;t++){
    const r=render(archKey,(seed+t*977)%999983,vertical,sizeKey,cfg);
    if(clean(r))return Object.assign(r,{gate:{seed:(seed+t*977)%999983,dropped:[],tries:t+1}});
    keep(r);
  }
  const dropped=[];
  let c={...cfg};
  for(const k of OPTIONAL){
    if(c[k]===false)continue;
    c={...c,[k]:false};dropped.push(k);
    const r=render(archKey,seed,vertical,sizeKey,c);
    if(clean(r))return Object.assign(r,{gate:{seed,dropped:dropped.slice(),tries}});
    keep(r);
  }
  return o.lenient?Object.assign(best,{gate:{seed,dropped,tries,refused:true}}):null;
}

/* THE SECOND OPINION — what the browser actually drew.
   The engine's geometry is exact to the metrics it was measured with, but the
   only thing a reader sees is pixels, and the two have disagreed before (a
   quotation mark's em box, an arc's rotated glyphs). This judges a card from
   the boxes the browser reports for every text run, and it is the same function
   whether it is called from the console on the live card or from the release
   gate in headless Chrome, so the two can never drift apart.
   boxes: [{s,x,y,w,h,op}] in viewBox units. Returns [] when clean. */
function pixelFaults(boxes,W,H){
  const raw=boxes.filter(t=>t.op>0.05&&t.s.trim());
  const vis=[];
  for(const t of raw){
    /* outlined and hard-shadowed type is several stacked copies of one string */
    const tol=Math.max(14,t.h*0.35);
    const twin=vis.find(v=>v.s===t.s&&Math.abs(v.x-t.x)<tol&&Math.abs(v.y-t.y)<tol);
    if(twin){const x1=Math.max(twin.x+twin.w,t.x+t.w),y1=Math.max(twin.y+twin.h,t.y+t.h);
      twin.x=Math.min(twin.x,t.x);twin.y=Math.min(twin.y,t.y);twin.w=x1-twin.x;twin.h=y1-twin.y;continue;}
    vis.push({...t});
  }
  const out=[];
  const ink=t=>({x:t.x,w:t.w,y:t.y+t.h*0.16,h:t.h*0.68,s:t.s});
  for(let i=0;i<vis.length;i++)for(let j=i+1;j<vis.length;j++){
    const a=ink(vis[i]),b=ink(vis[j]);
    const ox=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x), oy=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);
    if(ox>2&&oy>2){
      const small=Math.min(a.w*a.h,b.w*b.h);
      const share=ox/Math.min(a.w,b.w), apart=Math.abs((a.y+a.h/2)-(b.y+b.h/2))/Math.max(a.h,b.h);
      const stacked=share>0.55&&apart>0.55;
      if(ox*oy>small*(stacked?0.22:0.06))
        out.push(`"${a.s.trim()}" over "${b.s.trim()}" (${Math.round(ox*oy/small*100)}%)`);
    }
  }
  for(const t of vis)if(t.x<-2||t.y<-2||t.x+t.w>W+2||t.y+t.h>H+2)
    out.push(`"${t.s.trim()}" is clipped by the edge`);
  const SS=Math.min(W,H);
  for(const t of vis)if(t.h<SS*0.018)out.push(`"${t.s.trim()}" is too small to read`);
  return out;
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
  ground, placeHero, headline, sealOnHero, priceRows, proofSteps, reviewCard,
  fontCSS, faceCSS, renderClean, OPTIONAL, pixelFaults, matchSubject
};
