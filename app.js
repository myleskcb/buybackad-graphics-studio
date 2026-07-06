'use strict';
/* ═══════════════════════════════════════════════════════
   PhoneGFX Studio — single clean engine, one script block
   ═══════════════════════════════════════════════════════ */

// ---------- safe storage (works standalone; degrades to memory) ----------
const store = (() => {
  try { const k='__pgfx_t'; localStorage.setItem(k,'1'); localStorage.removeItem(k); return localStorage; }
  catch(e){ const m={}; return { getItem:k=>(k in m?m[k]:null), setItem:(k,v)=>{m[k]=String(v);}, removeItem:k=>{delete m[k];} }; }
})();
const jget = (k, fb) => { try { const v = store.getItem(k); return v==null ? fb : JSON.parse(v); } catch(e){ return fb; } };
const jset = (k, v) => { try { store.setItem(k, JSON.stringify(v)); } catch(e){} };

const $ = id => document.getElementById(id);
// Template design space: every built-in layout is authored on a 1080×1080 grid.
// CW/CH are the LIVE document size — they change with the chosen format, and
// buildLayer() maps authored coordinates into that space. Each format keeps one
// 1080 axis so text sizes carry over unchanged between formats.
const TPL_W = 1080, TPL_H = 1080;
let CW = 1080, CH = 1080;
const FORMATS = {
  square:    { label:'Square 1:1',      w:1080, h:1080, hint:'Marketplace · Instagram post' },
  story:     { label:'Story 9:16',      w:1080, h:1920, hint:'IG / TikTok story · phone wallpaper' },
  flyer:     { label:'Flyer 8.5×11',    w:1080, h:1398, hint:'Letter-size print · pole & board posting' },
  landscape: { label:'Wide 16:9',       w:1920, h:1080, hint:'Banner · Craigslist header' },
};
let docFormat = 'square';
const fmtOf = () => FORMATS[docFormat] || FORMATS.square;
// export sizing: plan caps apply to the SHORT side, so rectangular formats keep
// their aspect (a Pro story is 2160×3840, a Pro flyer prints at ~250 dpi)
function exportDims(shortPx){
  const s = shortPx / Math.min(CW, CH);
  return { w: Math.round(CW * s), h: Math.round(CH * s) };
}
const EXTRA_PROPS = ['name','pgRole','pgCasing','pgTplId','selectable','evented','padding','paintFirst','pgLocked','pgAdj','underline','fontStyle','pgFillGrad','pgCurved','pgBgRect','pgScrim','pgQrData','crossOrigin'];

function toast(msg, type){ const n=$('notif'); n.textContent=msg; n.className='notif show'+(type?' '+type:''); clearTimeout(n._t); n._t=setTimeout(()=>n.classList.remove('show'), 2800); }

// ---------- template specs (data, not code → traits derive automatically) ----------
function sh(color, blur, x, y){ return { color, blur, offsetX:x||0, offsetY:y||0 }; }
const F_DISPLAY='Bebas Neue', F_COND='Barlow Condensed', F_UI='DM Sans';

const TEMPLATES = [
{ id:'sell_iphone', name:'Sell Your iPhone', tag:'sell', cat:'phones',
  bg:{type:'image', src:'assets/tplbg/sell_iphone.jpg', scrim:0.62, fallback:{type:'grad', c1:'#b01030', c2:'#7b2d9e', a:135}},
  layers:[
    {kind:'rect', name:'Bottom Bar', props:{left:0, top:820, width:CW, height:260, fill:'rgba(0,0,0,0.85)'}},
    {kind:'text', name:'Headline 1', role:'headline', casing:'upper', text:'SELL YOUR', props:{left:CW/2, top:115, originX:'center', fontFamily:F_DISPLAY, fontSize:185, fill:'#ffffff', stroke:'#000000', strokeWidth:9, textAlign:'center', shadow:sh('rgba(0,0,0,0.5)',20,4,4)}},
    {kind:'rect', name:'Top Banner', props:{left:CW/2-130, top:55, width:260, height:50, fill:'#ff5000', rx:4, angle:-2}},
    {kind:'text', name:'Banner Text', role:'sub', casing:'upper', text:'TOP BUYER', props:{left:CW/2, top:68, originX:'center', fontFamily:F_DISPLAY, fontSize:36, fill:'#ffffff', stroke:'#000000', strokeWidth:2, angle:-2}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'IPHONE', props:{left:CW/2, top:282, originX:'center', fontFamily:F_DISPLAY, fontSize:258, fill:'#ff5000', stroke:'#000000', strokeWidth:12, textAlign:'center', shadow:sh('rgba(0,0,0,0.6)',28,6,6)}},
    {kind:'text', name:'Badges', role:'badges', casing:'upper', text:'•SAFE  •QUICK  •EASY', props:{left:CW-30, top:30, originX:'right', fontFamily:F_COND, fontSize:32, fill:'#000000', fontWeight:'900', backgroundColor:'#ffd200', padding:6}},
    {kind:'textbox', name:'Info Text', role:'info', casing:'upper', text:'SAME DAY CASH — NO HASSLE EASY MEETUP\niCLOUD LOCK, BROKEN, BLACKLIST...\nANY CONDITION ANY CARRIER', props:{left:CW/2, top:615, width:CW-80, originX:'center', fontFamily:F_COND, fontSize:38, fill:'#ffffff', stroke:'#000000', strokeWidth:2, textAlign:'center', fontWeight:'700', lineHeight:1.3, shadow:sh('rgba(0,0,0,0.9)',8,2,2)}},
    {kind:'text', name:'Arrow', role:'deco', text:'👉', props:{left:85, top:848, fontSize:62}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'TEXT US NOW!', props:{left:CW/2, top:828, originX:'center', fontFamily:F_DISPLAY, fontSize:56, fill:'#ff5000', stroke:'#000000', strokeWidth:3}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2+20, top:885, originX:'center', fontFamily:F_COND, fontSize:90, fill:'#ff5000', fontWeight:'900', shadow:sh('rgba(255,80,0,0.4)',22)}},
    {kind:'text', name:'Website', role:'website', casing:'none', text:'iphones.LA', props:{left:CW/2, top:950, originX:'center', fontFamily:F_UI, fontSize:26, fill:'rgba(255,255,255,0.45)'}},
  ]},
{ id:'top_buyer', name:'#1 Top Buyer', tag:'buyer', cat:'phones',
  bg:{type:'image', src:'assets/tplbg/top_buyer.jpg', scrim:0.5, fallback:{type:'grad', c1:'#1a1a2e', c2:'#16213e', a:180}},
  layers:[
    {kind:'text', name:'Title', role:'headline', casing:'upper', text:'#1 TOP BUYER', props:{left:CW/2, top:80, originX:'center', fontFamily:F_DISPLAY, fontSize:155, fill:'#ffb800', stroke:'#000000', strokeWidth:6, textAlign:'center', shadow:sh('#ff8c00',45)}},
    {kind:'textbox', name:'Main Headline', role:'headline', casing:'upper', text:'WE BUY\niPHONES', props:{left:CW/2, top:260, width:CW-60, originX:'center', fontFamily:F_DISPLAY, fontSize:205, fill:'#ffffff', stroke:'#000000', strokeWidth:9, textAlign:'center', lineHeight:0.88}},
    {kind:'textbox', name:'Subline', role:'sub', casing:'upper', text:'CASH IN HAND TODAY\nALL MODELS • ALL CONDITIONS', props:{left:CW/2, top:672, width:CW-80, originX:'center', fontFamily:F_COND, fontSize:46, fill:'#ffb800', fontWeight:'800', textAlign:'center', lineHeight:1.3}},
    {kind:'rect', name:'Bottom Bar', props:{left:0, top:800, width:CW, height:280, fill:'#ff5000'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'TEXT OR CALL NOW →', props:{left:CW/2, top:820, originX:'center', fontFamily:F_COND, fontSize:36, fill:'rgba(0,0,0,0.6)', fontWeight:'900'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:860, originX:'center', fontFamily:F_DISPLAY, fontSize:100, fill:'#ffffff', stroke:'#000000', strokeWidth:5}},
  ]},
{ id:'we_buy', name:'We Buy — Dark Neon', tag:'buyer', cat:'phones',
  bg:{type:'image', src:'assets/tplbg/we_buy.jpg', scrim:0.62, fallback:{type:'grad', c1:'#060606', c2:'#0f0f0f', a:180}},
  layers:[
    {kind:'circle', name:'Ring Outer', role:'deco', props:{left:CW/2-500, top:CH/2-500, radius:500, fill:'', stroke:'#ffb800', strokeWidth:1, opacity:0.1, selectable:false, evented:false}},
    {kind:'circle', name:'Ring Inner', role:'deco', props:{left:CW/2-360, top:CH/2-360, radius:360, fill:'', stroke:'#ff5000', strokeWidth:2, opacity:0.25, selectable:false, evented:false}},
    {kind:'text', name:'Headline 1', role:'headline', casing:'upper', text:'WE BUY', props:{left:CW/2, top:120, originX:'center', fontFamily:F_DISPLAY, fontSize:180, fill:'#ffffff', stroke:'#000000', strokeWidth:7}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'iPHONES', props:{left:CW/2, top:278, originX:'center', fontFamily:F_DISPLAY, fontSize:255, fill:'#ff5000', stroke:'#000000', strokeWidth:9, shadow:sh('#ff5000',55)}},
    {kind:'textbox', name:'Devices', role:'info', casing:'none', text:'iPads • MacBooks • Samsung\nANY CONDITION — TOP DOLLAR', props:{left:CW/2, top:605, width:CW-60, originX:'center', fontFamily:F_COND, fontSize:44, fill:'#aaaaaa', fontWeight:'600', textAlign:'center', lineHeight:1.3}},
    {kind:'rect', name:'Phone Bar', props:{left:80, top:770, width:CW-160, height:180, fill:'#ff5000', rx:12}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'CALL OR TEXT ANYTIME', props:{left:CW/2, top:785, originX:'center', fontFamily:F_COND, fontSize:30, fill:'rgba(0,0,0,0.65)', fontWeight:'900'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:825, originX:'center', fontFamily:F_DISPLAY, fontSize:100, fill:'#ffffff', stroke:'#c03000', strokeWidth:4}},
  ]},
{ id:'cash_offer', name:'Instant Cash Offer', tag:'promo', cat:'phones',
  bg:{type:'image', src:'assets/tplbg/cash_offer.jpg', scrim:0.5, fallback:{type:'grad', c1:'#f7971e', c2:'#ffd200', a:135}},
  layers:[
    {kind:'text', name:'Headline 1', role:'headline', casing:'upper', text:'INSTANT', props:{left:CW/2, top:100, originX:'center', fontFamily:F_DISPLAY, fontSize:170, fill:'#000000'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'CASH OFFER', props:{left:CW/2, top:255, originX:'center', fontFamily:F_DISPLAY, fontSize:155, fill:'#000000', stroke:'#ff5000', strokeWidth:4}},
    {kind:'text', name:'Headline 3', role:'sub', casing:'upper', text:'FOR YOUR iPHONE', props:{left:CW/2, top:440, originX:'center', fontFamily:F_COND, fontSize:72, fill:'#000000', fontWeight:'900'}},
    {kind:'rect', name:'Phone Plate', props:{left:CW/2-245, top:558, width:490, height:135, fill:'#000000', rx:8}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:595, originX:'center', fontFamily:F_DISPLAY, fontSize:88, fill:'#ffd200'}},
    {kind:'textbox', name:'Info Text', role:'info', casing:'title', text:'Same Day Payment • Local Meetup\nAll Models • Any Condition', props:{left:CW/2, top:750, width:CW-100, originX:'center', fontFamily:F_COND, fontSize:44, fill:'#000000', fontWeight:'700', textAlign:'center', lineHeight:1.3}},
  ]},
{ id:'icloud_ok', name:'iCloud OK — We Still Buy', tag:'promo', cat:'phones',
  bg:{type:'image', src:'assets/tplbg/icloud_ok.jpg', scrim:0.5, fallback:{type:'grad', c1:'#0d1117', c2:'#1a2332', a:180}},
  layers:[
    {kind:'text', name:'Title', role:'headline', casing:'upper', text:'WE STILL BUY!', props:{left:CW/2, top:80, originX:'center', fontFamily:F_DISPLAY, fontSize:140, fill:'#22c55e', stroke:'#000000', strokeWidth:5, shadow:sh('#22c55e',32)}},
    {kind:'text', name:'Check', role:'deco', text:'✓', props:{left:CW/2, top:215, originX:'center', fontSize:200, fill:'#22c55e', shadow:sh('#22c55e',65)}},
    {kind:'textbox', name:'Conditions', role:'info', casing:'upper', text:'iCLOUD LOCKED\nBLACKLISTED\nBROKEN SCREEN\nANY CONDITION', props:{left:CW/2, top:435, width:CW-80, originX:'center', fontFamily:F_DISPLAY, fontSize:92, fill:'#ffffff', textAlign:'center', lineHeight:0.95}},
    {kind:'rect', name:'Bottom Bar', props:{left:0, top:868, width:CW, height:212, fill:'#22c55e'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'TEXT US NOW!', props:{left:CW/2, top:878, originX:'center', fontFamily:F_COND, fontSize:34, fill:'rgba(0,0,0,0.6)', fontWeight:'900'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:918, originX:'center', fontFamily:F_DISPLAY, fontSize:90, fill:'#000000', stroke:'#000000', strokeWidth:2}},
  ]},
{ id:'same_day', name:'Same Day Cash', tag:'sell', cat:'phones',
  bg:{type:'image', src:'assets/tplbg/same_day.jpg', scrim:0.55, fallback:{type:'grad', c1:'#1a0533', c2:'#2d1b69', a:135}},
  layers:[
    {kind:'text', name:'Headline 1', role:'headline', casing:'upper', text:'SAME DAY', props:{left:CW/2, top:98, originX:'center', fontFamily:F_DISPLAY, fontSize:165, fill:'#ffffff', stroke:'#000000', strokeWidth:6}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'CASH', props:{left:CW/2, top:248, originX:'center', fontFamily:F_DISPLAY, fontSize:285, fill:'#ffb800', stroke:'#000000', strokeWidth:10, shadow:sh('rgba(255,184,0,0.4)',32)}},
    {kind:'text', name:'Headline 3', role:'sub', casing:'upper', text:'FOR YOUR iPHONE', props:{left:CW/2, top:545, originX:'center', fontFamily:F_COND, fontSize:68, fill:'#ffffff', fontWeight:'800', stroke:'#000000', strokeWidth:3}},
    {kind:'rect', name:'Bottom Bar', props:{left:0, top:698, width:CW, height:382, fill:'#ff5000'}},
    {kind:'text', name:'Emoji', role:'deco', text:'📱', props:{left:128, top:768, fontSize:90}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'TEXT US TODAY!', props:{left:CW/2, top:718, originX:'center', fontFamily:F_COND, fontSize:40, fill:'rgba(0,0,0,0.6)', fontWeight:'900'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2+40, top:788, originX:'center', fontFamily:F_DISPLAY, fontSize:95, fill:'#ffffff', stroke:'#c03000', strokeWidth:4}},
    {kind:'text', name:'Website', role:'website', casing:'none', text:'iphones.LA', props:{left:CW/2, top:935, originX:'center', fontFamily:F_UI, fontSize:26, fill:'rgba(255,255,255,0.45)'}},
  ]},
{ id:'bold_buyer', name:'Bold Buyer — Hot Pink', tag:'buyer', cat:'phones',
  bg:{type:'image', src:'assets/tplbg/bold_buyer.jpg', scrim:0.55, fallback:{type:'grad', c1:'#ff1493', c2:'#ff6600', a:135}},
  layers:[
    {kind:'text', name:'Headline 1', role:'headline', casing:'upper', text:'CASH FOR', props:{left:CW/2, top:100, originX:'center', fontFamily:F_DISPLAY, fontSize:170, fill:'#ffffff', stroke:'#000000', strokeWidth:8}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'iPHONES', props:{left:CW/2, top:255, originX:'center', fontFamily:F_DISPLAY, fontSize:260, fill:'#000000', shadow:sh('rgba(0,0,0,0.3)',20,5,5)}},
    {kind:'text', name:'Subline', role:'sub', casing:'upper', text:'WE PAY TOP DOLLAR', props:{left:CW/2, top:520, originX:'center', fontFamily:F_COND, fontSize:68, fill:'#ffffff', fontWeight:'900'}},
    {kind:'rect', name:'Bottom Bar', props:{left:0, top:680, width:CW, height:400, fill:'rgba(0,0,0,0.8)'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'TEXT FOR FREE QUOTE →', props:{left:CW/2, top:700, originX:'center', fontFamily:F_COND, fontSize:40, fill:'#ffffff', fontWeight:'800'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:770, originX:'center', fontFamily:F_DISPLAY, fontSize:105, fill:'#ff1493', stroke:'#000000', strokeWidth:5, shadow:sh('#ff1493',30)}},
  ]},
{ id:'neon_sell', name:'Neon Outline', tag:'sell', cat:'phones',
  bg:{type:'image', src:'assets/tplbg/neon_sell.jpg', scrim:0.45, fallback:{type:'solid', c:'#000000'}},
  layers:[
    {kind:'text', name:'Headline 1', role:'headline', casing:'upper', text:'SELL', props:{left:CW/2, top:80, originX:'center', fontFamily:F_DISPLAY, fontSize:240, fill:'rgba(0,0,0,0)', stroke:'#00ff88', strokeWidth:4, shadow:sh('#00ff88',30)}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'YOUR', props:{left:CW/2, top:290, originX:'center', fontFamily:F_DISPLAY, fontSize:240, fill:'rgba(0,0,0,0)', stroke:'#0088ff', strokeWidth:4, shadow:sh('#0088ff',30)}},
    {kind:'text', name:'Headline 3', role:'headline', casing:'upper', text:'iPHONE', props:{left:CW/2, top:500, originX:'center', fontFamily:F_DISPLAY, fontSize:200, fill:'rgba(0,0,0,0)', stroke:'#ff0066', strokeWidth:4, shadow:sh('#ff0066',35)}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:755, originX:'center', fontFamily:F_COND, fontSize:72, fill:'#ffffff', fontWeight:'900'}},
    {kind:'rect', name:'Bottom Bar', props:{left:0, top:870, width:CW, height:210, fill:'rgba(255,255,255,0.04)'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'TEXT NOW FOR INSTANT CASH', props:{left:CW/2, top:900, originX:'center', fontFamily:F_COND, fontSize:38, fill:'rgba(255,255,255,0.5)', fontWeight:'700'}},
  ]},
/* ── GOLD (6) ── */
{ id:'gold_spot', name:'Spot Price Payout', tag:'buyer', cat:'gold',
  bg:{type:'grad', c1:'#141007', c2:'#2b2008', a:160},
  layers:[
    {kind:'rect', name:'Gold Band', props:{left:0, top:392, width:CW, height:300, fill:'rgba(245,183,0,0.12)'}},
    {kind:'text', name:'Kicker', role:'sub', casing:'upper', text:'PAYING UP TO 95% OF', props:{left:CW/2, top:120, originX:'center', fontFamily:'Oswald', fontSize:52, fill:'#c9b27c', charSpacing:220, fontWeight:'600'}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'TODAYS GOLD PRICE', props:{left:CW/2, top:200, originX:'center', fontFamily:'Anton', fontSize:132, fill:'#f5b700', shadow:sh('rgba(245,183,0,0.45)',34)}},
    {kind:'textbox', name:'Items', role:'info', casing:'upper', text:'RINGS \u2022 CHAINS \u2022 COINS \u2022 DENTAL\nBROKEN JEWELRY WELCOME\n10K \u2022 14K \u2022 18K \u2022 24K', props:{left:CW/2, top:430, width:CW-140, originX:'center', fontFamily:'Oswald', fontSize:56, fill:'#ffffff', textAlign:'center', lineHeight:1.35, fontWeight:'600'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'TESTED \u0026 PAID IN FRONT OF YOU', props:{left:CW/2, top:760, originX:'center', fontFamily:F_COND, fontSize:44, fill:'#c9b27c', fontWeight:'700'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:850, originX:'center', fontFamily:'Anton', fontSize:100, fill:'#ffffff', shadow:sh('rgba(0,0,0,0.6)',18,3,3)}},
    {kind:'text', name:'Website', role:'website', casing:'none', text:'iphones.LA', props:{left:CW/2, top:980, originX:'center', fontFamily:F_UI, fontSize:26, fill:'rgba(255,255,255,0.4)'}},
  ]},
{ id:'gold_lux', name:'Luxury Minimal Gold', tag:'sell', cat:'gold',
  bg:{type:'solid', c:'#0b0b0d'},
  layers:[
    {kind:'rect', name:'Frame', props:{left:60, top:60, width:CW-120, height:CH-120, fill:'rgba(0,0,0,0)', stroke:'#c9a24b', strokeWidth:2}},
    {kind:'text', name:'Serif Head', role:'headline', casing:'title', text:'We Buy Gold.', props:{left:CW/2, top:300, originX:'center', fontFamily:'Georgia', fontSize:150, fill:'#e8d9ae', fontStyle:'italic'}},
    {kind:'text', name:'Sub', role:'sub', casing:'upper', text:'PRIVATE \u2022 DISCREET \u2022 FAIR', props:{left:CW/2, top:490, originX:'center', fontFamily:'Montserrat', fontSize:34, fill:'#c9a24b', charSpacing:420, fontWeight:'700'}},
    {kind:'text', name:'Line', role:'deco', text:'\u2500\u2500\u2500\u2500\u2500 \u25C6 \u2500\u2500\u2500\u2500\u2500', props:{left:CW/2, top:580, originX:'center', fontFamily:F_UI, fontSize:30, fill:'#c9a24b'}},
    {kind:'text', name:'Info', role:'info', casing:'title', text:'Estates, Inheritance \u0026 Fine Jewelry', props:{left:CW/2, top:660, originX:'center', fontFamily:'Georgia', fontSize:42, fill:'#ffffff'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:800, originX:'center', fontFamily:'Montserrat', fontSize:72, fill:'#e8d9ae', fontWeight:'800'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'BY APPOINTMENT \u2014 TEXT ANYTIME', props:{left:CW/2, top:905, originX:'center', fontFamily:'Montserrat', fontSize:26, fill:'rgba(255,255,255,0.55)', charSpacing:260, fontWeight:'600'}},
  ]},
{ id:'gold_scale', name:'On The Scale', tag:'promo', cat:'gold', tier:'premium',
  bg:{type:'grad', c1:'#3a2b00', c2:'#0d0a02', a:180},
  layers:[
    {kind:'text', name:'Big Emoji', role:'deco', text:'\u2696\uFE0F', props:{left:CW/2, top:90, originX:'center', fontSize:150}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'YOUR GOLD IS', props:{left:CW/2, top:300, originX:'center', fontFamily:'Archivo Black', fontSize:96, fill:'#ffffff'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'WORTH MORE', props:{left:CW/2, top:410, originX:'center', fontFamily:'Archivo Black', fontSize:118, fill:'#f5b700', shadow:sh('#f5b700',40)}},
    {kind:'text', name:'Sub', role:'sub', casing:'upper', text:'THAN YOU THINK', props:{left:CW/2, top:555, originX:'center', fontFamily:'Oswald', fontSize:60, fill:'#c9b27c', fontWeight:'600'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Free testing \u2022 No obligation quote\nWatch the scale \u2014 zero tricks', props:{left:CW/2, top:680, width:CW-160, originX:'center', fontFamily:F_UI, fontSize:36, fill:'#ffffff', textAlign:'center', lineHeight:1.4}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:850, originX:'center', fontFamily:'Anton', fontSize:96, fill:'#f5b700'}},
  ]},
{ id:'gold_cash_now', name:'Gold = Cash Now', tag:'sell', cat:'gold', tier:'premium',
  bg:{type:'grad', c1:'#f5b700', c2:'#ff8a00', a:135},
  layers:[
    {kind:'rect', name:'Ink Panel', props:{left:70, top:170, width:CW-140, height:740, fill:'#101010', rx:26, shadow:sh('rgba(0,0,0,0.45)',40,0,18)}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'GOLD IN.', props:{left:CW/2, top:250, originX:'center', fontFamily:'Anton', fontSize:130, fill:'#f5b700'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'CASH OUT.', props:{left:CW/2, top:395, originX:'center', fontFamily:'Anton', fontSize:130, fill:'#ffffff'}},
    {kind:'text', name:'Info', role:'info', casing:'upper', text:'5 MINUTE APPRAISAL \u2014 WALK OUT PAID', props:{left:CW/2, top:580, originX:'center', fontFamily:'Oswald', fontSize:42, fill:'#c9b27c', fontWeight:'600'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'TEXT A PHOTO FOR AN INSTANT QUOTE', props:{left:CW/2, top:670, originX:'center', fontFamily:F_COND, fontSize:38, fill:'#ffffff', fontWeight:'700'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:770, originX:'center', fontFamily:'Anton', fontSize:92, fill:'#f5b700'}},
    {kind:'text', name:'Badges', role:'badges', casing:'upper', text:'\u2022LICENSED  \u2022INSURED', props:{left:CW-30, top:30, originX:'right', fontFamily:F_COND, fontSize:32, fill:'#000000', fontWeight:'900', backgroundColor:'#ffffff', padding:6}},
  ]},
{ id:'gold_estate', name:'Estate Buyer Serif', tag:'buyer', cat:'gold', tier:'premium',
  bg:{type:'solid', c:'#f4ead2'},
  layers:[
    {kind:'rect', name:'Rule Top', props:{left:90, top:120, width:CW-180, height:6, fill:'#1c1710'}},
    {kind:'text', name:'Headline', role:'headline', casing:'title', text:'Settling An Estate?', props:{left:CW/2, top:190, originX:'center', fontFamily:'Georgia', fontSize:96, fill:'#1c1710'}},
    {kind:'textbox', name:'Body', role:'info', casing:'none', text:'We purchase entire gold and jewelry\ncollections with dignity, discretion\nand documented fair-market offers.', props:{left:CW/2, top:360, width:CW-200, originX:'center', fontFamily:'Georgia', fontSize:44, fill:'#443b2c', textAlign:'center', lineHeight:1.45, fontStyle:'italic'}},
    {kind:'text', name:'Sub', role:'sub', casing:'upper', text:'HOUSE CALLS AVAILABLE', props:{left:CW/2, top:640, originX:'center', fontFamily:'Montserrat', fontSize:32, fill:'#8a6d1f', charSpacing:340, fontWeight:'700'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:740, originX:'center', fontFamily:'Georgia', fontSize:84, fill:'#1c1710', fontWeight:'700'}},
    {kind:'rect', name:'Rule Bottom', props:{left:90, top:900, width:CW-180, height:6, fill:'#1c1710'}},
    {kind:'text', name:'Website', role:'website', casing:'none', text:'iphones.LA', props:{left:CW/2, top:940, originX:'center', fontFamily:'Montserrat', fontSize:26, fill:'#8a6d1f', fontWeight:'600'}},
  ]},
{ id:'gold_marker', name:'Handwritten Payout', tag:'promo', cat:'gold', tier:'premium',
  bg:{type:'grad', c1:'#1a1a1f', c2:'#000000', a:180},
  layers:[
    {kind:'text', name:'Headline', role:'headline', casing:'none', text:'That old chain?', props:{left:CW/2, top:170, originX:'center', fontFamily:'Permanent Marker', fontSize:96, fill:'#ffffff', angle:-3}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'none', text:'PAID.', props:{left:CW/2, top:330, originX:'center', fontFamily:'Permanent Marker', fontSize:210, fill:'#f5b700', angle:2, shadow:sh('rgba(245,183,0,0.5)',30)}},
    {kind:'text', name:'Arrow', role:'deco', text:'\u2935\uFE0F', props:{left:CW/2+250, top:520, fontSize:80, angle:15}},
    {kind:'text', name:'Info', role:'info', casing:'none', text:'Broken, tangled, one earring \u2014 all of it counts.', props:{left:CW/2, top:640, originX:'center', fontFamily:F_UI, fontSize:38, fill:'#c9b27c'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:760, originX:'center', fontFamily:'Anton', fontSize:104, fill:'#ffffff'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'TEXT A PIC \u2192 GET A NUMBER', props:{left:CW/2, top:900, originX:'center', fontFamily:'Permanent Marker', fontSize:44, fill:'#f5b700'}},
  ]},

/* ── SILVER (5) ── */
{ id:'silver_stack', name:'Stack Buyer', tag:'buyer', cat:'silver',
  bg:{type:'grad', c1:'#20242c', c2:'#0b0d12', a:170},
  layers:[
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'SELLING YOUR', props:{left:CW/2, top:130, originX:'center', fontFamily:'Oswald', fontSize:84, fill:'#ffffff', fontWeight:'700'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'SILVER STACK?', props:{left:CW/2, top:230, originX:'center', fontFamily:'Oswald', fontSize:120, fill:'#c7d0dc', fontWeight:'700', shadow:sh('rgba(199,208,220,0.35)',28)}},
    {kind:'textbox', name:'Items', role:'info', casing:'upper', text:'EAGLES \u2022 BARS \u2022 JUNK SILVER\n90% COINS \u2022 STERLING FLATWARE', props:{left:CW/2, top:440, width:CW-140, originX:'center', fontFamily:F_COND, fontSize:52, fill:'#8fa3bb', textAlign:'center', lineHeight:1.4, fontWeight:'700'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'PRICED LIVE OFF SPOT \u2014 NO LOWBALLS', props:{left:CW/2, top:660, originX:'center', fontFamily:'Oswald', fontSize:40, fill:'#ffffff', fontWeight:'600'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:790, originX:'center', fontFamily:'Anton', fontSize:98, fill:'#c7d0dc'}},
    {kind:'text', name:'Website', role:'website', casing:'none', text:'iphones.LA', props:{left:CW/2, top:930, originX:'center', fontFamily:F_UI, fontSize:26, fill:'rgba(255,255,255,0.4)'}},
  ]},
{ id:'silver_ounce', name:'Per Ounce Bold', tag:'promo', cat:'silver',
  bg:{type:'solid', c:'#e9edf2'},
  layers:[
    {kind:'rect', name:'Slab', props:{left:0, top:0, width:CW, height:340, fill:'#10141b'}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'TOP DOLLAR', props:{left:CW/2, top:80, originX:'center', fontFamily:'Archivo Black', fontSize:110, fill:'#ffffff'}},
    {kind:'text', name:'Sub', role:'sub', casing:'upper', text:'PER OUNCE \u2014 EVERY OUNCE', props:{left:CW/2, top:225, originX:'center', fontFamily:'Oswald', fontSize:48, fill:'#c7d0dc', fontWeight:'600', charSpacing:160}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Bring the whole box \u2014 tea sets, trays,\ncandlesticks, coins. We sort, weigh\nand pay on the spot.', props:{left:CW/2, top:430, width:CW-180, originX:'center', fontFamily:F_UI, fontSize:42, fill:'#2a3340', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:760, originX:'center', fontFamily:'Archivo Black', fontSize:88, fill:'#10141b'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'OPEN 7 DAYS \u2014 WALK-INS WELCOME', props:{left:CW/2, top:900, originX:'center', fontFamily:'Oswald', fontSize:34, fill:'#5a6b80', fontWeight:'600', charSpacing:200}},
  ]},
{ id:'silver_mirror', name:'Mirror Shine', tag:'sell', cat:'silver', tier:'premium',
  bg:{type:'grad', c1:'#c7d0dc', c2:'#5a6b80', a:135},
  layers:[
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'SILVER', props:{left:CW/2, top:150, originX:'center', fontFamily:'Anton', fontSize:250, fill:'#ffffff', stroke:'#10141b', strokeWidth:8, shadow:sh('rgba(0,0,0,0.35)',24,6,6)}},
    {kind:'text', name:'Sub', role:'sub', casing:'upper', text:'BOUGHT \u2022 WEIGHED \u2022 PAID', props:{left:CW/2, top:440, originX:'center', fontFamily:'Montserrat', fontSize:44, fill:'#10141b', fontWeight:'800', charSpacing:260}},
    {kind:'rect', name:'Panel', props:{left:120, top:560, width:CW-240, height:200, fill:'rgba(16,20,27,0.85)', rx:18}},
    {kind:'text', name:'Info', role:'info', casing:'none', text:'Even tarnished pieces \u2014 shine does not matter, weight does.', props:{left:CW/2, top:600, originX:'center', fontFamily:F_UI, fontSize:34, fill:'#c7d0dc', width:CW-300, textAlign:'center'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:670, originX:'center', fontFamily:'Anton', fontSize:76, fill:'#ffffff'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'FREE EVALUATIONS DAILY', props:{left:CW/2, top:850, originX:'center', fontFamily:'Oswald', fontSize:42, fill:'#10141b', fontWeight:'700'}},
  ]},
{ id:'silver_ster', name:'Sterling Wanted Poster', tag:'buyer', cat:'silver', tier:'premium',
  bg:{type:'solid', c:'#f7f1e3'},
  layers:[
    {kind:'rect', name:'Border', props:{left:50, top:50, width:CW-100, height:CH-100, fill:'rgba(0,0,0,0)', stroke:'#2b2416', strokeWidth:10}},
    {kind:'rect', name:'Border In', props:{left:74, top:74, width:CW-148, height:CH-148, fill:'rgba(0,0,0,0)', stroke:'#2b2416', strokeWidth:3}},
    {kind:'text', name:'Kicker', role:'sub', casing:'upper', text:'\u2605 WANTED \u2605', props:{left:CW/2, top:130, originX:'center', fontFamily:'Georgia', fontSize:60, fill:'#8a2b1d', fontWeight:'700', charSpacing:300}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'STERLING SILVER', props:{left:CW/2, top:250, originX:'center', fontFamily:'Georgia', fontSize:100, fill:'#2b2416', fontWeight:'700'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Flatware sets \u2022 Serving pieces \u2022 .925 marked\nGenerous reward paid in cash', props:{left:CW/2, top:430, width:CW-220, originX:'center', fontFamily:'Georgia', fontSize:44, fill:'#443b2c', textAlign:'center', lineHeight:1.5, fontStyle:'italic'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:680, originX:'center', fontFamily:'Georgia', fontSize:88, fill:'#2b2416', fontWeight:'700'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'INQUIRE WITHIN \u2014 OR JUST TEXT US', props:{left:CW/2, top:830, originX:'center', fontFamily:'Montserrat', fontSize:30, fill:'#8a2b1d', fontWeight:'700', charSpacing:180}},
  ]},
{ id:'silver_neon', name:'Second Place Pays', tag:'promo', cat:'silver', tier:'premium',
  bg:{type:'solid', c:'#07080c'},
  layers:[
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'SECOND PLACE', props:{left:CW/2, top:170, originX:'center', fontFamily:'Bebas Neue', fontSize:140, fill:'rgba(0,0,0,0)', stroke:'#c7d0dc', strokeWidth:4, shadow:sh('#c7d0dc',26)}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'STILL PAYS', props:{left:CW/2, top:330, originX:'center', fontFamily:'Bebas Neue', fontSize:190, fill:'#c7d0dc', shadow:sh('#8fa3bb',45)}},
    {kind:'text', name:'Sub', role:'sub', casing:'upper', text:'SILVER BUYER \u2014 CASH TODAY', props:{left:CW/2, top:580, originX:'center', fontFamily:'Oswald', fontSize:52, fill:'#ffffff', fontWeight:'600'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:720, originX:'center', fontFamily:'Anton', fontSize:100, fill:'#ffffff', shadow:sh('#c7d0dc',20)}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'BARS \u2022 ROUNDS \u2022 90% \u2022 STERLING', props:{left:CW/2, top:880, originX:'center', fontFamily:F_COND, fontSize:40, fill:'#8fa3bb', fontWeight:'700'}},
  ]},

/* ── RARE COINS (6) ── */
{ id:'coins_estate', name:'Coin Collection Buyer', tag:'buyer', cat:'coins',
  bg:{type:'grad', c1:'#1d1408', c2:'#000000', a:180},
  layers:[
    {kind:'text', name:'Coin', role:'deco', text:'\uD83E\uDE99', props:{left:CW/2, top:80, originX:'center', fontSize:130}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'COIN COLLECTIONS', props:{left:CW/2, top:270, originX:'center', fontFamily:'Anton', fontSize:110, fill:'#e8d9ae'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'BOUGHT WHOLE', props:{left:CW/2, top:395, originX:'center', fontFamily:'Anton', fontSize:110, fill:'#ffffff'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Morgans \u2022 Peace dollars \u2022 Wheat cents\nProof sets \u2022 Inherited albums \u2022 Foreign', props:{left:CW/2, top:560, width:CW-160, originX:'center', fontFamily:'Georgia', fontSize:42, fill:'#c9b27c', textAlign:'center', lineHeight:1.5}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'NO COLLECTION TOO BIG OR SMALL', props:{left:CW/2, top:740, originX:'center', fontFamily:'Oswald', fontSize:38, fill:'#ffffff', fontWeight:'600'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:840, originX:'center', fontFamily:'Anton', fontSize:96, fill:'#e8d9ae'}},
  ]},
{ id:'coins_morgan', name:'Morgan Dollar Callout', tag:'promo', cat:'coins', tier:'premium',
  bg:{type:'solid', c:'#10131a'},
  layers:[
    {kind:'rect', name:'Circle Halo', props:{left:CW/2-230, top:60, width:460, height:460, fill:'rgba(232,217,174,0.08)', rx:230}},
    {kind:'text', name:'Year', role:'headline', casing:'none', text:'1878\u20131921', props:{left:CW/2, top:180, originX:'center', fontFamily:'Georgia', fontSize:110, fill:'#e8d9ae', fontWeight:'700'}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'MORGAN DOLLARS', props:{left:CW/2, top:350, originX:'center', fontFamily:'Oswald', fontSize:96, fill:'#ffffff', fontWeight:'700'}},
    {kind:'text', name:'Sub', role:'sub', casing:'upper', text:'PAYING COLLECTOR PRICES \u2014 NOT MELT', props:{left:CW/2, top:490, originX:'center', fontFamily:'Montserrat', fontSize:36, fill:'#c9a24b', fontWeight:'700', charSpacing:120}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Carson City? Key dates? Toned beauties?\nWe know exactly what you have.', props:{left:CW/2, top:600, width:CW-200, originX:'center', fontFamily:'Georgia', fontSize:38, fill:'#c7d0dc', textAlign:'center', lineHeight:1.5, fontStyle:'italic'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:790, originX:'center', fontFamily:'Anton', fontSize:92, fill:'#e8d9ae'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'TEXT PHOTOS FOR A REAL OFFER', props:{left:CW/2, top:925, originX:'center', fontFamily:'Oswald', fontSize:34, fill:'rgba(255,255,255,0.6)', fontWeight:'600', charSpacing:160}},
  ]},
{ id:'coins_grandpa', name:'Grandpas Coins', tag:'sell', cat:'coins', tier:'premium',
  bg:{type:'grad', c1:'#2a2118', c2:'#14100b', a:160},
  layers:[
    {kind:'text', name:'Headline', role:'headline', casing:'none', text:'Found a coin jar', props:{left:CW/2, top:150, originX:'center', fontFamily:'Permanent Marker', fontSize:90, fill:'#ffffff', angle:-2}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'none', text:'in the attic?', props:{left:CW/2, top:280, originX:'center', fontFamily:'Permanent Marker', fontSize:90, fill:'#e8d9ae', angle:1}},
    {kind:'text', name:'Sub', role:'sub', casing:'upper', text:'IT MIGHT PAY THE RENT.', props:{left:CW/2, top:450, originX:'center', fontFamily:'Anton', fontSize:74, fill:'#f5b700', shadow:sh('rgba(245,183,0,0.4)',26)}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Free sorting \u2022 We separate the treasure\nfrom the pocket change \u2014 honestly.', props:{left:CW/2, top:590, width:CW-180, originX:'center', fontFamily:F_UI, fontSize:38, fill:'#c9b27c', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:770, originX:'center', fontFamily:'Anton', fontSize:100, fill:'#ffffff'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'HOUSE CALLS FOR BIG FINDS', props:{left:CW/2, top:910, originX:'center', fontFamily:'Permanent Marker', fontSize:38, fill:'#e8d9ae'}},
  ]},
{ id:'coins_error', name:'Error Coin Hunter', tag:'promo', cat:'coins', tier:'premium',
  bg:{type:'solid', c:'#0d0d10'},
  layers:[
    {kind:'rect', name:'Alert Strip', props:{left:0, top:70, width:CW, height:110, fill:'#8a2b1d'}},
    {kind:'text', name:'Kicker', role:'sub', casing:'upper', text:'\u26A0 CHECK YOUR CHANGE \u26A0', props:{left:CW/2, top:98, originX:'center', fontFamily:'Oswald', fontSize:54, fill:'#ffffff', fontWeight:'700'}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'ERROR COINS', props:{left:CW/2, top:250, originX:'center', fontFamily:'Archivo Black', fontSize:130, fill:'#ffffff'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'= REAL MONEY', props:{left:CW/2, top:400, originX:'center', fontFamily:'Archivo Black', fontSize:110, fill:'#f5b700'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Double dies \u2022 Off-centers \u2022 Wrong planchets\nSome are worth thousands. We will tell you\nwhich \u2014 for free.', props:{left:CW/2, top:560, width:CW-160, originX:'center', fontFamily:F_UI, fontSize:36, fill:'#c7d0dc', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:790, originX:'center', fontFamily:'Anton', fontSize:94, fill:'#ffffff'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'TEXT A CLOSE-UP PHOTO NOW', props:{left:CW/2, top:925, originX:'center', fontFamily:'Oswald', fontSize:36, fill:'#f5b700', fontWeight:'700'}},
  ]},
{ id:'coins_graded', name:'Graded Slab Buyer', tag:'buyer', cat:'coins', tier:'premium',
  bg:{type:'grad', c1:'#101a2b', c2:'#060a12', a:180},
  layers:[
    {kind:'rect', name:'Slab Frame', props:{left:CW/2-320, top:120, width:640, height:340, fill:'rgba(255,255,255,0.06)', rx:22, stroke:'#3a4a63', strokeWidth:3}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'PCGS \u2022 NGC', props:{left:CW/2, top:180, originX:'center', fontFamily:'Montserrat', fontSize:86, fill:'#ffffff', fontWeight:'900'}},
    {kind:'text', name:'Sub', role:'sub', casing:'upper', text:'GRADED COINS WANTED', props:{left:CW/2, top:310, originX:'center', fontFamily:'Oswald', fontSize:56, fill:'#8fb4ff', fontWeight:'600'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'We pay for the grade, the strike and the eye appeal \u2014 registry-quality offers on registry-quality coins.', props:{left:CW/2, top:530, width:CW-180, originX:'center', fontFamily:F_UI, fontSize:38, fill:'#c7d0dc', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:740, originX:'center', fontFamily:'Anton', fontSize:96, fill:'#8fb4ff'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'CERT NUMBERS GET INSTANT QUOTES', props:{left:CW/2, top:890, originX:'center', fontFamily:'Oswald', fontSize:34, fill:'rgba(255,255,255,0.6)', fontWeight:'600', charSpacing:140}},
  ]},
{ id:'coins_ticket', name:'Gold Rush Ticket', tag:'sell', cat:'coins', tier:'premium',
  bg:{type:'solid', c:'#c9a24b'},
  layers:[
    {kind:'rect', name:'Ticket', props:{left:80, top:200, width:CW-160, height:660, fill:'#141210', rx:30, shadow:sh('rgba(0,0,0,0.4)',36,0,16)}},
    {kind:'text', name:'Kicker', role:'sub', casing:'upper', text:'\u2726 ADMIT YOUR COINS \u2726', props:{left:CW/2, top:260, originX:'center', fontFamily:'Bangers', fontSize:52, fill:'#c9a24b', charSpacing:120}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'THE COIN', props:{left:CW/2, top:350, originX:'center', fontFamily:'Bangers', fontSize:130, fill:'#ffffff'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'BUY-OUT', props:{left:CW/2, top:490, originX:'center', fontFamily:'Bangers', fontSize:130, fill:'#f5b700', shadow:sh('rgba(245,183,0,0.4)',24)}},
    {kind:'text', name:'Info', role:'info', casing:'upper', text:'ONE DAY \u2022 EVERY COIN \u2022 CASH PAID', props:{left:CW/2, top:660, originX:'center', fontFamily:'Oswald', fontSize:40, fill:'#c9a24b', fontWeight:'600'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:750, originX:'center', fontFamily:'Anton', fontSize:84, fill:'#ffffff'}},
  ]},

/* ── CARS (7) ── */
{ id:'cars_anycond', name:'Running Or Not', tag:'buyer', cat:'cars',
  bg:{type:'grad', c1:'#101418', c2:'#000000', a:180},
  layers:[
    {kind:'rect', name:'Hazard Top', props:{left:0, top:0, width:CW, height:44, fill:'#f5b700'}},
    {kind:'rect', name:'Hazard Bottom', props:{left:0, top:CH-44, width:CW, height:44, fill:'#f5b700'}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'WE BUY CARS', props:{left:CW/2, top:130, originX:'center', fontFamily:'Anton', fontSize:150, fill:'#ffffff', stroke:'#000000', strokeWidth:6}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'RUNNING OR NOT', props:{left:CW/2, top:310, originX:'center', fontFamily:'Anton', fontSize:104, fill:'#f5b700', shadow:sh('rgba(245,183,0,0.4)',24)}},
    {kind:'textbox', name:'Info', role:'info', casing:'upper', text:'BLOWN ENGINE \u2022 SALVAGE \u2022 NO TITLE?\nWRECKED \u2022 FLOODED \u2022 JUST OLD?\nWE STILL WANT IT.', props:{left:CW/2, top:480, width:CW-140, originX:'center', fontFamily:'Oswald', fontSize:52, fill:'#c7d0dc', textAlign:'center', lineHeight:1.35, fontWeight:'600'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'FREE TOW \u2022 PAID ON PICKUP', props:{left:CW/2, top:760, originX:'center', fontFamily:F_COND, fontSize:48, fill:'#ffffff', fontWeight:'800'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:860, originX:'center', fontFamily:'Anton', fontSize:96, fill:'#f5b700'}},
  ]},
{ id:'cars_kbb', name:'Beat The Trade-In', tag:'promo', cat:'cars',
  bg:{type:'grad', c1:'#0b2340', c2:'#050d18', a:160},
  layers:[
    {kind:'text', name:'Kicker', role:'sub', casing:'upper', text:'DEALER OFFERED YOU WHAT?', props:{left:CW/2, top:110, originX:'center', fontFamily:'Oswald', fontSize:52, fill:'#8fb4ff', fontWeight:'600'}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'WE BEAT', props:{left:CW/2, top:210, originX:'center', fontFamily:'Archivo Black', fontSize:140, fill:'#ffffff'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'TRADE-IN OFFERS', props:{left:CW/2, top:370, originX:'center', fontFamily:'Archivo Black', fontSize:88, fill:'#4da3ff'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Bring their written offer \u2014 we will top it\nor tell you to take it. Straight answers only.', props:{left:CW/2, top:530, width:CW-160, originX:'center', fontFamily:F_UI, fontSize:40, fill:'#c7d0dc', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'VIN + MILES = OFFER IN 10 MINUTES', props:{left:CW/2, top:700, originX:'center', fontFamily:'Oswald', fontSize:42, fill:'#ffffff', fontWeight:'600'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:810, originX:'center', fontFamily:'Anton', fontSize:96, fill:'#4da3ff'}},
    {kind:'text', name:'Website', role:'website', casing:'none', text:'iphones.LA', props:{left:CW/2, top:950, originX:'center', fontFamily:F_UI, fontSize:26, fill:'rgba(255,255,255,0.4)'}},
  ]},
{ id:'cars_junk', name:'Junk Car Grunge', tag:'sell', cat:'cars', tier:'premium',
  bg:{type:'solid', c:'#171310'},
  layers:[
    {kind:'text', name:'Headline', role:'headline', casing:'none', text:'That car is not', props:{left:CW/2, top:140, originX:'center', fontFamily:'Permanent Marker', fontSize:84, fill:'#c7d0dc', angle:-2}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'none', text:'a lawn ornament.', props:{left:CW/2, top:260, originX:'center', fontFamily:'Permanent Marker', fontSize:84, fill:'#ffffff', angle:1}},
    {kind:'text', name:'Big', role:'headline', casing:'upper', text:'CASH FOR JUNKERS', props:{left:CW/2, top:430, originX:'center', fontFamily:'Anton', fontSize:108, fill:'#ff5000', shadow:sh('rgba(255,80,0,0.45)',28)}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Dead battery? Flat tires? Wasp nest\nin the glovebox? We tow it free\nand hand you cash before we leave.', props:{left:CW/2, top:580, width:CW-160, originX:'center', fontFamily:F_UI, fontSize:38, fill:'#c9b27c', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:790, originX:'center', fontFamily:'Anton', fontSize:100, fill:'#ffffff'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'SAME-DAY PICKUP MOST AREAS', props:{left:CW/2, top:930, originX:'center', fontFamily:'Permanent Marker', fontSize:36, fill:'#ff5000'}},
  ]},
{ id:'cars_plate', name:'License Plate Split', tag:'promo', cat:'cars', tier:'premium',
  bg:{type:'solid', c:'#e9edf2'},
  layers:[
    {kind:'rect', name:'Plate', props:{left:CW/2-380, top:120, width:760, height:300, fill:'#ffffff', rx:28, stroke:'#10141b', strokeWidth:10, shadow:sh('rgba(0,0,0,0.25)',24,0,12)}},
    {kind:'text', name:'Plate State', role:'sub', casing:'upper', text:'\u2605 CASH \u2605', props:{left:CW/2, top:150, originX:'center', fontFamily:'Oswald', fontSize:40, fill:'#8a2b1d', fontWeight:'700', charSpacing:340}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'4-UR-CAR', props:{left:CW/2, top:210, originX:'center', fontFamily:'Archivo Black', fontSize:130, fill:'#10141b', charSpacing:80}},
    {kind:'text', name:'Sub', role:'sub', casing:'upper', text:'ANY YEAR \u2022 ANY MAKE \u2022 ANY SHAPE', props:{left:CW/2, top:500, originX:'center', fontFamily:'Montserrat', fontSize:40, fill:'#2a3340', fontWeight:'800', charSpacing:120}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Licensed \u0026 bonded buyer \u2014 title handled,\nDMV paperwork done for you, zero fees.', props:{left:CW/2, top:600, width:CW-200, originX:'center', fontFamily:F_UI, fontSize:38, fill:'#5a6b80', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:770, originX:'center', fontFamily:'Archivo Black', fontSize:86, fill:'#10141b'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'TEXT YOUR VIN \u2192 GET A NUMBER', props:{left:CW/2, top:910, originX:'center', fontFamily:'Oswald', fontSize:36, fill:'#8a2b1d', fontWeight:'700'}},
  ]},
{ id:'cars_speed', name:'Racing Stripe Speed', tag:'sell', cat:'cars', tier:'premium',
  bg:{type:'grad', c1:'#c81d25', c2:'#5c0a0e', a:135},
  layers:[
    {kind:'rect', name:'Stripe 1', props:{left:-100, top:640, width:CW+200, height:70, fill:'rgba(255,255,255,0.9)', angle:-6}},
    {kind:'rect', name:'Stripe 2', props:{left:-100, top:730, width:CW+200, height:26, fill:'rgba(255,255,255,0.5)', angle:-6}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'SELL IT', props:{left:CW/2, top:110, originX:'center', fontFamily:'Anton', fontSize:210, fill:'#ffffff', fontStyle:'italic', shadow:sh('rgba(0,0,0,0.4)',20,8,8)}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'TODAY.', props:{left:CW/2, top:350, originX:'center', fontFamily:'Anton', fontSize:210, fill:'#111111', fontStyle:'italic', stroke:'#ffffff', strokeWidth:5}},
    {kind:'text', name:'Info', role:'info', casing:'upper', text:'OFFER \u2192 INSPECTION \u2192 PAID. 60 MINUTES.', props:{left:CW/2, top:655, originX:'center', fontFamily:'Oswald', fontSize:42, fill:'#111111', fontWeight:'700', angle:-6}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:820, originX:'center', fontFamily:'Anton', fontSize:104, fill:'#ffffff'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'7 DAYS \u2022 WE COME TO YOU', props:{left:CW/2, top:950, originX:'center', fontFamily:F_COND, fontSize:38, fill:'rgba(255,255,255,0.75)', fontWeight:'700'}},
  ]},
{ id:'cars_fleet', name:'Fleet + Work Trucks', tag:'buyer', cat:'cars', tier:'premium',
  bg:{type:'grad', c1:'#1c2229', c2:'#0a0d11', a:180},
  layers:[
    {kind:'rect', name:'Caution Tag', props:{left:CW/2-260, top:70, width:520, height:76, fill:'#ff8a00', rx:8, angle:-1}},
    {kind:'text', name:'Kicker', role:'sub', casing:'upper', text:'CONTRACTORS \u2022 FLEETS', props:{left:CW/2, top:88, originX:'center', fontFamily:'Oswald', fontSize:44, fill:'#111111', fontWeight:'700', angle:-1}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'WORK TRUCKS', props:{left:CW/2, top:220, originX:'center', fontFamily:'Archivo Black', fontSize:118, fill:'#ffffff'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'\u0026 VANS WANTED', props:{left:CW/2, top:355, originX:'center', fontFamily:'Archivo Black', fontSize:96, fill:'#ff8a00'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Retiring units? Downsizing the yard?\nWe buy 1 or 20 \u2014 high miles fine,\nlettering \u0026 racks fine, diesel preferred.', props:{left:CW/2, top:520, width:CW-160, originX:'center', fontFamily:F_UI, fontSize:38, fill:'#c7d0dc', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:760, originX:'center', fontFamily:'Anton', fontSize:96, fill:'#ff8a00'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'BULK QUOTES IN WRITING SAME DAY', props:{left:CW/2, top:900, originX:'center', fontFamily:'Oswald', fontSize:34, fill:'rgba(255,255,255,0.6)', fontWeight:'600', charSpacing:120}},
  ]},
{ id:'cars_odometer', name:'Odometer Honest', tag:'promo', cat:'cars', tier:'premium',
  bg:{type:'solid', c:'#08090b'},
  layers:[
    {kind:'rect', name:'Gauge Panel', props:{left:CW/2-350, top:140, width:700, height:260, fill:'#101318', rx:130, stroke:'#2a3340', strokeWidth:4}},
    {kind:'text', name:'Odometer', role:'headline', casing:'none', text:'246,801 mi', props:{left:CW/2, top:210, originX:'center', fontFamily:'Oswald', fontSize:110, fill:'#4dff88', fontWeight:'600', shadow:sh('rgba(77,255,136,0.4)',24)}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'HIGH MILES? STILL PAYS.', props:{left:CW/2, top:480, originX:'center', fontFamily:'Anton', fontSize:92, fill:'#ffffff'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Hondas \u0026 Toyotas especially \u2014 the miles\nscare dealers, not us. Fair offers based\non what your car is actually worth.', props:{left:CW/2, top:620, width:CW-170, originX:'center', fontFamily:F_UI, fontSize:38, fill:'#8fa3bb', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:830, originX:'center', fontFamily:'Anton', fontSize:96, fill:'#4dff88'}},
  ]},

/* ── DIABETIC STRIPS (5) ── */
{ id:'strips_clean', name:'Clean Clinical Strips', tag:'buyer', cat:'strips',
  bg:{type:'solid', c:'#f2f7f6'},
  layers:[
    {kind:'rect', name:'Teal Header', props:{left:0, top:0, width:CW, height:300, fill:'#0f6e6a'}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'EXTRA TEST STRIPS?', props:{left:CW/2, top:80, originX:'center', fontFamily:'Montserrat', fontSize:82, fill:'#ffffff', fontWeight:'900'}},
    {kind:'text', name:'Sub', role:'sub', casing:'upper', text:'TURN THEM INTO CASH \u2014 LEGALLY \u0026 SIMPLY', props:{left:CW/2, top:200, originX:'center', fontFamily:F_UI, fontSize:36, fill:'#bfe7e4', fontWeight:'600'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Unopened \u2022 Unexpired \u2022 Factory sealed\nAll major brands \u2014 boxes checked\nand paid while you wait.', props:{left:CW/2, top:400, width:CW-180, originX:'center', fontFamily:F_UI, fontSize:44, fill:'#1d3a38', textAlign:'center', lineHeight:1.5}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'MAIL-IN KITS AVAILABLE \u2014 FREE SHIPPING', props:{left:CW/2, top:680, originX:'center', fontFamily:'Montserrat', fontSize:32, fill:'#0f6e6a', fontWeight:'800'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:780, originX:'center', fontFamily:'Montserrat', fontSize:84, fill:'#0f6e6a', fontWeight:'900'}},
    {kind:'text', name:'Website', role:'website', casing:'none', text:'iphones.LA', props:{left:CW/2, top:920, originX:'center', fontFamily:F_UI, fontSize:28, fill:'#5a8683'}},
  ]},
{ id:'strips_box', name:'Box Count Bold', tag:'promo', cat:'strips', tier:'premium',
  bg:{type:'grad', c1:'#123c5e', c2:'#071726', a:170},
  layers:[
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'EVERY SEALED BOX', props:{left:CW/2, top:140, originX:'center', fontFamily:'Anton', fontSize:98, fill:'#ffffff'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'= MONEY', props:{left:CW/2, top:260, originX:'center', fontFamily:'Anton', fontSize:160, fill:'#4dd7ff', shadow:sh('rgba(77,215,255,0.4)',34)}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Insurance sent too many? Switched meters?\nDo not let good boxes expire in a drawer.\nWe pay by brand \u0026 date \u2014 transparent list.', props:{left:CW/2, top:480, width:CW-160, originX:'center', fontFamily:F_UI, fontSize:40, fill:'#bfe7e4', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'TEXT A PHOTO OF YOUR BOXES', props:{left:CW/2, top:700, originX:'center', fontFamily:'Oswald', fontSize:44, fill:'#ffffff', fontWeight:'600'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:810, originX:'center', fontFamily:'Anton', fontSize:96, fill:'#4dd7ff'}},
  ]},
{ id:'strips_pickup', name:'Discreet Pickup', tag:'sell', cat:'strips', tier:'premium',
  bg:{type:'solid', c:'#101315'},
  layers:[
    {kind:'text', name:'Lock', role:'deco', text:'\uD83E\uDD10', props:{left:CW/2, top:80, originX:'center', fontSize:110}},
    {kind:'text', name:'Headline', role:'headline', casing:'title', text:'Private. Discreet. Paid.', props:{left:CW/2, top:250, originX:'center', fontFamily:'Georgia', fontSize:86, fill:'#ffffff', fontStyle:'italic'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Curbside pickup \u2022 No questions beyond\nthe expiration date \u2022 Cash or instant transfer', props:{left:CW/2, top:430, width:CW-170, originX:'center', fontFamily:F_UI, fontSize:42, fill:'#9fc3c0', textAlign:'center', lineHeight:1.5}},
    {kind:'text', name:'Sub', role:'sub', casing:'upper', text:'STRIPS \u2022 SENSORS \u2022 LANCETS', props:{left:CW/2, top:640, originX:'center', fontFamily:'Montserrat', fontSize:36, fill:'#4dd7ff', fontWeight:'800', charSpacing:200}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:760, originX:'center', fontFamily:'Montserrat', fontSize:88, fill:'#ffffff', fontWeight:'900'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'REPLIES IN MINUTES, NOT DAYS', props:{left:CW/2, top:910, originX:'center', fontFamily:'Oswald', fontSize:32, fill:'rgba(255,255,255,0.55)', fontWeight:'600', charSpacing:180}},
  ]},
{ id:'strips_cgm', name:'CGM Sensor Buyer', tag:'buyer', cat:'strips', tier:'premium',
  bg:{type:'grad', c1:'#0e2e2c', c2:'#04100f', a:160},
  layers:[
    {kind:'rect', name:'Pill', props:{left:CW/2-300, top:100, width:600, height:96, fill:'#17b8a6', rx:48}},
    {kind:'text', name:'Kicker', role:'sub', casing:'upper', text:'DEXCOM \u2022 LIBRE \u2022 OMNIPOD', props:{left:CW/2, top:126, originX:'center', fontFamily:'Montserrat', fontSize:40, fill:'#04302b', fontWeight:'900'}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'SENSORS \u0026 PODS', props:{left:CW/2, top:270, originX:'center', fontFamily:'Archivo Black', fontSize:104, fill:'#ffffff'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'BOUGHT SEALED', props:{left:CW/2, top:390, originX:'center', fontFamily:'Archivo Black', fontSize:88, fill:'#4de3cf'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Top payouts on long-dated boxes.\nDamaged retail box? Still fine if the\ninner seal is intact.', props:{left:CW/2, top:540, width:CW-180, originX:'center', fontFamily:F_UI, fontSize:38, fill:'#bfe7e4', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:760, originX:'center', fontFamily:'Anton', fontSize:94, fill:'#4de3cf'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'SAME-DAY LOCAL MEETUPS', props:{left:CW/2, top:900, originX:'center', fontFamily:'Oswald', fontSize:34, fill:'rgba(255,255,255,0.6)', fontWeight:'600', charSpacing:160}},
  ]},
{ id:'strips_expiry', name:'Expiry Countdown', tag:'promo', cat:'strips', tier:'premium',
  bg:{type:'solid', c:'#151005'},
  layers:[
    {kind:'text', name:'Clock', role:'deco', text:'\u23F3', props:{left:CW/2, top:70, originX:'center', fontSize:120}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'EXPIRING BOXES', props:{left:CW/2, top:250, originX:'center', fontFamily:'Anton', fontSize:110, fill:'#ffb020'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'LOSE VALUE DAILY', props:{left:CW/2, top:380, originX:'center', fontFamily:'Anton', fontSize:92, fill:'#ffffff'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'12+ months out pays the most.\nEven 6 months still pays \u2014 but the\nclock only runs one way. Sell now.', props:{left:CW/2, top:540, width:CW-180, originX:'center', fontFamily:F_UI, fontSize:40, fill:'#d8c9a3', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:760, originX:'center', fontFamily:'Anton', fontSize:98, fill:'#ffb020'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'QUOTE FROM ONE PHOTO \u2014 TRY IT', props:{left:CW/2, top:905, originX:'center', fontFamily:'Oswald', fontSize:36, fill:'rgba(255,255,255,0.65)', fontWeight:'600'}},
  ]},

/* ── POKEMON CARDS (7) ── */
{ id:'pkm_binder', name:'Binder Buy-Out', tag:'buyer', cat:'pokemon',
  bg:{type:'grad', c1:'#12245e', c2:'#080f28', a:160},
  layers:[
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'YOUR OLD BINDER', props:{left:CW/2, top:120, originX:'center', fontFamily:'Bangers', fontSize:110, fill:'#ffd200', charSpacing:60, shadow:sh('rgba(0,0,0,0.6)',14,5,5)}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'MIGHT BE A GOLDMINE', props:{left:CW/2, top:250, originX:'center', fontFamily:'Bangers', fontSize:92, fill:'#ffffff', charSpacing:40, shadow:sh('rgba(0,0,0,0.6)',14,5,5)}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Base Set \u2022 Charizards \u2022 1st Editions\nShadowless \u2022 Japanese \u2022 Full binders\nWe grade-check for free, in front of you.', props:{left:CW/2, top:430, width:CW-150, originX:'center', fontFamily:F_UI, fontSize:42, fill:'#bcd0ff', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'CASH \u2014 NOT STORE CREDIT', props:{left:CW/2, top:680, originX:'center', fontFamily:'Oswald', fontSize:52, fill:'#ffd200', fontWeight:'700'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:800, originX:'center', fontFamily:'Anton', fontSize:96, fill:'#ffffff'}},
    {kind:'text', name:'Website', role:'website', casing:'none', text:'iphones.LA', props:{left:CW/2, top:940, originX:'center', fontFamily:F_UI, fontSize:26, fill:'rgba(255,255,255,0.4)'}},
  ]},
{ id:'pkm_zard', name:'Charizard Callout', tag:'promo', cat:'pokemon',
  bg:{type:'grad', c1:'#ff5000', c2:'#8a1500', a:160},
  layers:[
    {kind:'text', name:'Fire', role:'deco', text:'\uD83D\uDD25', props:{left:CW/2, top:60, originX:'center', fontSize:130}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'GOT A ZARD?', props:{left:CW/2, top:240, originX:'center', fontFamily:'Bangers', fontSize:180, fill:'#ffffff', stroke:'#000000', strokeWidth:6, shadow:sh('rgba(0,0,0,0.5)',18,6,6)}},
    {kind:'text', name:'Sub', role:'sub', casing:'upper', text:'HOLO \u2022 SHADOWLESS \u2022 GRADED \u2022 RAW', props:{left:CW/2, top:470, originX:'center', fontFamily:'Oswald', fontSize:46, fill:'#ffd200', fontWeight:'700'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Serious money for serious cards \u2014\nrecent comps shown with every offer.', props:{left:CW/2, top:590, width:CW-180, originX:'center', fontFamily:F_UI, fontSize:40, fill:'#ffe3c2', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:760, originX:'center', fontFamily:'Anton', fontSize:100, fill:'#ffd200', stroke:'#000000', strokeWidth:3}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'TEXT A PIC \u2014 OFFER IN MINUTES', props:{left:CW/2, top:905, originX:'center', fontFamily:'Bangers', fontSize:44, fill:'#ffffff', charSpacing:40}},
  ]},
{ id:'pkm_sealed', name:'Sealed Product Vault', tag:'buyer', cat:'pokemon', tier:'premium',
  bg:{type:'solid', c:'#0a0d18'},
  layers:[
    {kind:'rect', name:'Vault Frame', props:{left:90, top:90, width:CW-180, height:CH-180, fill:'rgba(0,0,0,0)', stroke:'#ffd200', strokeWidth:3, rx:24}},
    {kind:'text', name:'Kicker', role:'sub', casing:'upper', text:'DO NOT OPEN THAT BOX', props:{left:CW/2, top:150, originX:'center', fontFamily:'Oswald', fontSize:48, fill:'#ff5b5b', fontWeight:'700', charSpacing:120}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'SEALED PRODUCT', props:{left:CW/2, top:260, originX:'center', fontFamily:'Archivo Black', fontSize:100, fill:'#ffffff'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'PAYS PREMIUM', props:{left:CW/2, top:375, originX:'center', fontFamily:'Archivo Black', fontSize:100, fill:'#ffd200'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Booster boxes \u2022 ETBs \u2022 Collections\nVintage WOTC to modern \u2014 factory\nseal intact = top of market paid.', props:{left:CW/2, top:530, width:CW-220, originX:'center', fontFamily:F_UI, fontSize:38, fill:'#bcd0ff', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:750, originX:'center', fontFamily:'Anton', fontSize:92, fill:'#ffd200'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'BULK COLLECTIONS WELCOME', props:{left:CW/2, top:890, originX:'center', fontFamily:'Oswald', fontSize:34, fill:'rgba(255,255,255,0.6)', fontWeight:'600', charSpacing:180}},
  ]},
{ id:'pkm_attic', name:'Attic Nostalgia', tag:'sell', cat:'pokemon', tier:'premium',
  bg:{type:'grad', c1:'#3d2a10', c2:'#160e04', a:170},
  layers:[
    {kind:'text', name:'Headline', role:'headline', casing:'none', text:'Remember 1999?', props:{left:CW/2, top:140, originX:'center', fontFamily:'Permanent Marker', fontSize:96, fill:'#ffd27a', angle:-2}},
    {kind:'text', name:'Sub', role:'sub', casing:'none', text:'Your childhood shoebox does.', props:{left:CW/2, top:290, originX:'center', fontFamily:'Georgia', fontSize:52, fill:'#ffffff', fontStyle:'italic'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Those playground cards are adult money\nnow. Dig out the shoebox \u2014 we will sort\nit together and pay for the hits.', props:{left:CW/2, top:440, width:CW-170, originX:'center', fontFamily:F_UI, fontSize:42, fill:'#d8c9a3', textAlign:'center', lineHeight:1.5}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'FREE LOOK \u2014 ZERO PRESSURE', props:{left:CW/2, top:660, originX:'center', fontFamily:'Oswald', fontSize:44, fill:'#ffd27a', fontWeight:'600'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:790, originX:'center', fontFamily:'Anton', fontSize:98, fill:'#ffffff'}},
    {kind:'text', name:'Badges', role:'badges', casing:'upper', text:'\u2022LOCAL  \u2022TRUSTED', props:{left:CW-30, top:30, originX:'right', fontFamily:F_COND, fontSize:32, fill:'#000000', fontWeight:'900', backgroundColor:'#ffd200', padding:6}},
  ]},
{ id:'pkm_grade', name:'Grade Gap Explainer', tag:'promo', cat:'pokemon', tier:'premium',
  bg:{type:'solid', c:'#101014'},
  layers:[
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'PSA 9 vs PSA 10', props:{left:CW/2, top:130, originX:'center', fontFamily:'Montserrat', fontSize:96, fill:'#ffffff', fontWeight:'900'}},
    {kind:'text', name:'Sub', role:'sub', casing:'upper', text:'CAN BE A 5X PRICE GAP', props:{left:CW/2, top:270, originX:'center', fontFamily:'Oswald', fontSize:56, fill:'#ffd200', fontWeight:'600'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'We pre-screen your raw cards with the\nsame checklist graders use \u2014 centering,\nedges, surface \u2014 and pay for the upside.', props:{left:CW/2, top:420, width:CW-170, originX:'center', fontFamily:F_UI, fontSize:40, fill:'#bcd0ff', textAlign:'center', lineHeight:1.5}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'SLABS ALSO BOUGHT AT COMP PRICES', props:{left:CW/2, top:650, originX:'center', fontFamily:'Oswald', fontSize:38, fill:'#ffffff', fontWeight:'600'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:780, originX:'center', fontFamily:'Anton', fontSize:96, fill:'#ffd200'}},
    {kind:'text', name:'Website', role:'website', casing:'none', text:'iphones.LA', props:{left:CW/2, top:930, originX:'center', fontFamily:F_UI, fontSize:26, fill:'rgba(255,255,255,0.4)'}},
  ]},
{ id:'pkm_jp', name:'Japanese Exclusives', tag:'buyer', cat:'pokemon', tier:'premium',
  bg:{type:'grad', c1:'#c81d4e', c2:'#3d0a1c', a:150},
  layers:[
    {kind:'text', name:'Rising Sun', role:'deco', text:'\u26E9\uFE0F', props:{left:CW/2, top:70, originX:'center', fontSize:110}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'JAPANESE CARDS', props:{left:CW/2, top:240, originX:'center', fontFamily:'Anton', fontSize:108, fill:'#ffffff'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'WANTED BADLY', props:{left:CW/2, top:365, originX:'center', fontFamily:'Anton', fontSize:108, fill:'#ffd200', shadow:sh('rgba(255,210,0,0.35)',26)}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Promos \u2022 Trophy cards \u2022 Vending sheets\nOld Back anything \u2014 if it is from Japan\nand mint, we are your best offer.', props:{left:CW/2, top:530, width:CW-170, originX:'center', fontFamily:F_UI, fontSize:38, fill:'#ffd9e2', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:760, originX:'center', fontFamily:'Anton', fontSize:96, fill:'#ffffff'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'COLLECTION MANAGERS: DM US FIRST', props:{left:CW/2, top:900, originX:'center', fontFamily:'Oswald', fontSize:34, fill:'rgba(255,255,255,0.7)', fontWeight:'600', charSpacing:120}},
  ]},
{ id:'pkm_bulk', name:'Bulk By The Pound', tag:'sell', cat:'pokemon', tier:'premium',
  bg:{type:'solid', c:'#0b1e12'},
  layers:[
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'BULK CARDS', props:{left:CW/2, top:140, originX:'center', fontFamily:'Archivo Black', fontSize:130, fill:'#4dff88'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'BY THE POUND', props:{left:CW/2, top:290, originX:'center', fontFamily:'Archivo Black', fontSize:100, fill:'#ffffff'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Commons, energies, whole tubs \u2014\nyes, even those. Weighed on a certified\nscale, paid per pound, hauled away free.', props:{left:CW/2, top:470, width:CW-170, originX:'center', fontFamily:F_UI, fontSize:40, fill:'#bfe7cd', textAlign:'center', lineHeight:1.5}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'HITS PULLED \u0026 PAID SEPARATELY', props:{left:CW/2, top:680, originX:'center', fontFamily:'Oswald', fontSize:42, fill:'#4dff88', fontWeight:'600'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:800, originX:'center', fontFamily:'Anton', fontSize:96, fill:'#ffffff'}},
  ]},

/* ── SPORTS CARDS (6) ── */
{ id:'sports_rookie', name:'Rookie Card Radar', tag:'buyer', cat:'sports',
  bg:{type:'grad', c1:'#0b3d2e', c2:'#041a12', a:170},
  layers:[
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'ROOKIE CARDS', props:{left:CW/2, top:130, originX:'center', fontFamily:'Anton', fontSize:130, fill:'#ffffff', fontStyle:'italic'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'BOUGHT AT COMPS', props:{left:CW/2, top:285, originX:'center', fontFamily:'Anton', fontSize:92, fill:'#4dff88', fontStyle:'italic', shadow:sh('rgba(77,255,136,0.35)',24)}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Prizm \u2022 Topps Chrome \u2022 Bowman 1sts\nAutos \u0026 numbered parallels \u2014 we track\nlive sales, you get the real number.', props:{left:CW/2, top:450, width:CW-160, originX:'center', fontFamily:F_UI, fontSize:42, fill:'#bfe7cd', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'NO CONSIGNMENT WAIT \u2014 PAID TODAY', props:{left:CW/2, top:680, originX:'center', fontFamily:'Oswald', fontSize:42, fill:'#ffffff', fontWeight:'600'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:800, originX:'center', fontFamily:'Anton', fontSize:96, fill:'#4dff88'}},
    {kind:'text', name:'Website', role:'website', casing:'none', text:'iphones.LA', props:{left:CW/2, top:940, originX:'center', fontFamily:F_UI, fontSize:26, fill:'rgba(255,255,255,0.4)'}},
  ]},
{ id:'sports_score', name:'Scoreboard Flash', tag:'promo', cat:'sports',
  bg:{type:'solid', c:'#0a0a0d'},
  layers:[
    {kind:'rect', name:'Board', props:{left:90, top:110, width:CW-180, height:330, fill:'#111118', rx:18, stroke:'#2a2a36', strokeWidth:4}},
    {kind:'text', name:'Score You', role:'headline', casing:'upper', text:'YOU: PAID', props:{left:CW/2, top:170, originX:'center', fontFamily:'Oswald', fontSize:92, fill:'#ffd200', fontWeight:'700', shadow:sh('rgba(255,210,0,0.4)',20)}},
    {kind:'text', name:'Score Them', role:'headline', casing:'upper', text:'EBAY FEES: 0', props:{left:CW/2, top:300, originX:'center', fontFamily:'Oswald', fontSize:70, fill:'#ff5b5b', fontWeight:'700'}},
    {kind:'text', name:'Sub', role:'sub', casing:'upper', text:'SKIP THE LISTINGS. SKIP THE FEES.', props:{left:CW/2, top:520, originX:'center', fontFamily:'Archivo Black', fontSize:52, fill:'#ffffff'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Full card collections bought outright \u2014\nbasketball, football, baseball, soccer.', props:{left:CW/2, top:640, width:CW-180, originX:'center', fontFamily:F_UI, fontSize:40, fill:'#c7d0dc', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:800, originX:'center', fontFamily:'Anton', fontSize:96, fill:'#ffd200'}},
  ]},
{ id:'sports_goat', name:'GOAT Era Vintage', tag:'sell', cat:'sports', tier:'premium',
  bg:{type:'grad', c1:'#3d1508', c2:'#160702', a:160},
  layers:[
    {kind:'text', name:'Kicker', role:'sub', casing:'upper', text:'JORDAN \u2022 BRADY \u2022 MANTLE \u2022 KOBE', props:{left:CW/2, top:110, originX:'center', fontFamily:'Oswald', fontSize:42, fill:'#ff9d5c', fontWeight:'600', charSpacing:100}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'GOAT CARDS', props:{left:CW/2, top:210, originX:'center', fontFamily:'Anton', fontSize:160, fill:'#ffffff', shadow:sh('rgba(0,0,0,0.5)',20,6,6)}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'DESERVE GOAT OFFERS', props:{left:CW/2, top:400, originX:'center', fontFamily:'Anton', fontSize:74, fill:'#ff9d5c'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Vintage to modern grails \u2014 if it hangs\nin a man cave, it cashes out here.\nAuthentication handled on the spot.', props:{left:CW/2, top:540, width:CW-170, originX:'center', fontFamily:F_UI, fontSize:40, fill:'#e8cdb8', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:770, originX:'center', fontFamily:'Anton', fontSize:98, fill:'#ffffff'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'PRIVATE SALES \u2014 NO AUCTION CIRCUS', props:{left:CW/2, top:910, originX:'center', fontFamily:'Oswald', fontSize:34, fill:'rgba(255,255,255,0.65)', fontWeight:'600', charSpacing:120}},
  ]},
{ id:'sports_break', name:'Breaker Overflow', tag:'buyer', cat:'sports', tier:'premium',
  bg:{type:'grad', c1:'#1d1040', c2:'#090418', a:160},
  layers:[
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'BREAKERS:', props:{left:CW/2, top:130, originX:'center', fontFamily:'Archivo Black', fontSize:120, fill:'#b78bff'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'SELL YOUR HITS', props:{left:CW/2, top:270, originX:'center', fontFamily:'Archivo Black', fontSize:96, fill:'#ffffff'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Weekend breaks piling up? We buy\nyour pulled slabs, autos \u0026 parallels\nin bulk lots \u2014 one transfer, all gone.', props:{left:CW/2, top:430, width:CW-170, originX:'center', fontFamily:F_UI, fontSize:42, fill:'#d9c9ff', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'STANDING WEEKLY BUY-OUTS AVAILABLE', props:{left:CW/2, top:650, originX:'center', fontFamily:'Oswald', fontSize:38, fill:'#b78bff', fontWeight:'600'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:780, originX:'center', fontFamily:'Anton', fontSize:96, fill:'#ffffff'}},
    {kind:'text', name:'Badges', role:'badges', casing:'upper', text:'\u2022FAST PAY  \u2022BULK OK', props:{left:CW-30, top:30, originX:'right', fontFamily:F_COND, fontSize:32, fill:'#000000', fontWeight:'900', backgroundColor:'#b78bff', padding:6}},
  ]},
{ id:'sports_ticket', name:'Season Ticket Stub', tag:'promo', cat:'sports', tier:'premium',
  bg:{type:'solid', c:'#f4efe4'},
  layers:[
    {kind:'rect', name:'Stub', props:{left:70, top:250, width:CW-140, height:560, fill:'#14213d', rx:22, shadow:sh('rgba(0,0,0,0.3)',30,0,14)}},
    {kind:'rect', name:'Perforation', props:{left:CW-300, top:250, width:6, height:560, fill:'rgba(244,239,228,0.5)'}},
    {kind:'text', name:'Kicker', role:'sub', casing:'upper', text:'ADMIT: YOUR COLLECTION', props:{left:100, top:300, fontFamily:'Oswald', fontSize:38, fill:'#fca311', fontWeight:'600', charSpacing:160}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'CARD SHOW', props:{left:100, top:370, fontFamily:'Anton', fontSize:120, fill:'#ffffff'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'PRICES DAILY', props:{left:100, top:510, fontFamily:'Anton', fontSize:96, fill:'#fca311'}},
    {kind:'text', name:'Info', role:'info', casing:'none', text:'Why wait for the convention? Show rates, every single day.', props:{left:100, top:650, fontFamily:F_UI, fontSize:34, fill:'#e5e5e5', width:CW-420}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:880, originX:'center', fontFamily:'Anton', fontSize:88, fill:'#14213d'}},
  ]},
{ id:'sports_setbuild', name:'Set Builder Wanted', tag:'sell', cat:'sports', tier:'premium',
  bg:{type:'grad', c1:'#15304d', c2:'#081524', a:180},
  layers:[
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'COMPLETE SETS', props:{left:CW/2, top:150, originX:'center', fontFamily:'Oswald', fontSize:116, fill:'#ffffff', fontWeight:'700'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'\u0026 WAX BOXES', props:{left:CW/2, top:290, originX:'center', fontFamily:'Oswald', fontSize:116, fill:'#4da3ff', fontWeight:'700'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'86 Fleer to 2024 releases \u2014 sealed wax,\nfactory sets, and the shoebox of doubles\nyou almost threw away. Bring it all.', props:{left:CW/2, top:470, width:CW-160, originX:'center', fontFamily:F_UI, fontSize:42, fill:'#bcd7ff', textAlign:'center', lineHeight:1.5}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'ESTATES \u0026 STORAGE UNITS: CALL FIRST', props:{left:CW/2, top:690, originX:'center', fontFamily:'Oswald', fontSize:38, fill:'#ffffff', fontWeight:'600'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:810, originX:'center', fontFamily:'Anton', fontSize:96, fill:'#4da3ff'}},
  ]},

];

// traits: per-template, per-layer canonical styling — this is what Enhance restores
const TRAIT_KEYS = ['fontFamily','fontSize','fill','stroke','strokeWidth','fontWeight','textAlign','lineHeight','backgroundColor','angle','opacity','fontStyle','charSpacing'];
const TRAITS = {};
TEMPLATES.forEach(t => {
  TRAITS[t.id] = {};
  t.layers.forEach(l => {
    const tr = {};
    TRAIT_KEYS.forEach(k => { if (l.props[k] !== undefined) tr[k] = l.props[k]; });
    tr._shadow = l.props.shadow || null;
    tr._casing = l.casing || 'none';
    tr._role = l.role || '';
    TRAITS[t.id][l.name] = tr;
  });
});

const SELL_POINTS = ['QUICK','FAST','EASY','SAFE','5 MINUTES','HASSLE FREE','SAME DAY','TOP $$$','ANY CONDITION','INSTANT CASH','NO GAMES','CALL NOW'];
const EMOJIS = ['📱','💰','💵','✅','✔️','👉','🔥','⭐','📲','🤝'];

// ---------- gradient helper (CSS-angle semantics) ----------
function gradFill(bg, w, h){
  const rad = (bg.a || 0) * Math.PI / 180;
  const vx = Math.sin(rad), vy = -Math.cos(rad);
  const L = (Math.abs(vx)*w + Math.abs(vy)*h) / 2;
  const cx = w/2, cy = h/2;
  return new fabric.Gradient({
    type:'linear', gradientUnits:'pixels',
    coords:{ x1:cx - vx*L, y1:cy - vy*L, x2:cx + vx*L, y2:cy + vy*L },
    colorStops:[ {offset:0, color:bg.c1}, {offset:1, color:bg.c2} ]
  });
}
function applyBgSpec(cv, bg){
  if (bg.type === 'image'){
    // template photos are preview-only dressing — the working canvas gets the designed fallback
    return applyBgSpec(cv, bg.fallback || { type:'solid', c:'#101014' });
  }
  // solid colors are safe as canvas background; gradients render reliably only
  // as percentage-unit object fills, so gradients go through a managed rect
  if (bg.type === 'solid'){
    removeBgRect(cv);
    cv.setBackgroundColor(bg.c, () => cv.renderAll());
    return;
  }
  if (bg.type === 'grad'){
    cv.setBackgroundColor('#101014', () => {});
    let r = (cv.getObjects ? cv.getObjects() : []).find(o => o.pgBgRect);
    if (!r){
      r = bgRectFor(bg);
      r.pgBgRect = true;
      cv.add(r);
    } else {
      r.set('fill', objGrad({ c1: bg.c1, c2: bg.c2, a: bg.a || 0 }));
    }
    if (cv.sendToBack) cv.sendToBack(r);
    cv.renderAll();
  }
}
function removeBgRect(cv){
  const r = (cv.getObjects ? cv.getObjects() : []).find(o => o.pgBgRect);
  if (r) cv.remove(r);
}

// ---------- object builder ----------
// Maps an authored layer spec (1080×1080 template space) into a target document
// space. Positions and rect extents stretch per-axis so full-bleed bars keep
// hugging the edges; text sizes and circle radii scale by the SHORT-axis factor
// (1.0 for every built-in format), so typography never distorts.
function mapSpecToDoc(l, p, dw, dh){
  const sx = dw / TPL_W, sy = dh / TPL_H;
  if (sx === 1 && sy === 1) return p;
  const u = Math.min(sx, sy);
  if (l.kind === 'circle'){
    const r0 = p.radius || 0, cx = (p.left || 0) + r0, cy = (p.top || 0) + r0, r1 = r0 * u;
    p.radius = r1; p.left = cx * sx - r1; p.top = cy * sy - r1;
    return p;
  }
  if (p.left !== undefined) p.left = (p.originX === 'right') ? dw - (TPL_W - p.left) : p.left * sx;
  if (p.top !== undefined) p.top = p.top * sy;
  if (l.kind === 'rect'){
    if (p.width !== undefined) p.width = p.width * sx;
    if (p.height !== undefined) p.height = p.height * sy;
  } else {
    if (p.fontSize) p.fontSize = Math.round(p.fontSize * u);
    if (p.width !== undefined) p.width = p.width * sx;   // textbox wrap width
  }
  return p;
}
function buildLayer(l, tplId, dw, dh){
  const p = mapSpecToDoc(l, Object.assign({}, l.props), dw || TPL_W, dh || TPL_H);
  if (p.shadow) p.shadow = new fabric.Shadow(p.shadow);
  let obj;
  if (l.kind === 'rect'){
    // color blocks go glassy (45%) so background photos stay visible;
    // stroke-only frames and rgba fills pass through as designed, and
    // phone-number boxes are text backgroundColor fills — never touched here
    if (typeof p.fill === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(p.fill)) p.fill = hexToRgba(p.fill, 0.45);
    obj = new fabric.Rect(p);
  }
  else if (l.kind === 'circle') obj = new fabric.Circle(p);
  else if (l.kind === 'textbox') obj = new fabric.Textbox(l.text, Object.assign({paintFirst:'stroke'}, p));
  else obj = new fabric.IText(l.text, Object.assign({paintFirst:'stroke'}, p));
  obj.set({ name:l.name, pgRole:l.role||'', pgCasing:l.casing||'none', pgTplId:tplId });
  return obj;
}

// ---------- thumbnail engine: renders REAL previews from the actual specs ----------
const THUMBS = {};
function renderThumb(tpl, px){
  // thumbnails always preview the authored square template, whatever the live doc format
  const sc = new fabric.StaticCanvas(null, { width:TPL_W, height:TPL_H, renderOnAddRemove:false });
  const bgi = tpl.bg.type === 'image' ? freshBgImage(tpl.bg.src) : null;
  if (bgi){
    sc.setBackgroundImage(coverImage(bgi, TPL_W, TPL_H), () => {});
    if (tpl.bg.scrim) sc.add(scrimRect(tpl.bg.scrim, TPL_W, TPL_H));
  } else {
    sc.add(bgRectFor(tpl.bg.type === 'image' ? (tpl.bg.fallback || { type:'solid', c:'#101014' }) : tpl.bg, TPL_W, TPL_H));
  }
  tpl.layers.forEach(l => sc.add(buildLayer(l, tpl.id)));
  sc.renderAll();
  const url = sc.toDataURL({ format:'jpeg', quality:0.82, multiplier:(px||300)/TPL_W });
  sc.dispose();
  return url;
}
function getThumb(tplId, px){
  if (THUMBS[tplId]) return THUMBS[tplId];
  const tpl = TEMPLATES.find(t => t.id === tplId);
  if (!tpl) return '';
  try {
    THUMBS[tplId] = renderThumb(tpl, px || 320); // cache successes only
    return THUMBS[tplId];
  } catch (err){
    console.error('Thumbnail render failed for', tplId, err);
    return thumbFallback(tpl, px || 320);       // shown, but not cached — retried next time
  }
}
function thumbFallback(tpl, px){
  try {
    const cv = document.createElement('canvas');
    cv.width = cv.height = px;
    const x = cv.getContext('2d');
    const g = x.createLinearGradient(0, 0, px, px);
    const c = (tpl.bg && (tpl.bg.c1 || tpl.bg.c)) || '#26262e';
    g.addColorStop(0, c); g.addColorStop(1, '#101015');
    x.fillStyle = g; x.fillRect(0, 0, px, px);
    x.fillStyle = '#ffffff'; x.font = '700 ' + Math.round(px/10) + 'px sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(tpl.name.slice(0, 18), px/2, px/2);
    return cv.toDataURL('image/jpeg', 0.8);
  } catch (e){ return ''; }
}
function ensureThumbs(){
  TEMPLATES.forEach(t => getThumb(t.id, 320));
}

// ═══════════════ APP STATE ═══════════════
let canvas = null;             // fabric.Canvas, created on first editor open
let zoomScale = 1;
let currentTplId = null;
let currentTplName = 'Untitled ad';
let hist = [], histIdx = -1, histLock = false;
let bgState = { type:'grad', c1:'#b01030', c2:'#7b2d9e', a:135 };
let pushTimer = null, autosaveTimer = null;
let firstLoadDone = false;

const getBrand = () => jget('pgfx_brand', null);
const getSaved = () => jget('pgfx_saved', []);
const setSaved = v => jset('pgfx_saved', v);

// ═══════════════ PAGE ROUTING ═══════════════
function showLanding(){
  $('page-editor').classList.remove('active');
  $('page-easy').classList.remove('active');
  $('page-landing').classList.remove('hidden');
  window.scrollTo(0,0);
}
function showEditor(){
  $('page-landing').classList.add('hidden');
  $('page-easy').classList.remove('active');
  $('page-editor').classList.add('active');
  initCanvasOnce();
  requestAnimationFrame(fitZoom);
}
function openStudio(tplId){
  showEditor();
  if (tplId) loadTemplate(tplId);
  else openPicker();
}

// ═══════════════ LANDING RENDER ═══════════════
function buildLanding(){
  ensureThumbs();
  // hero fan — three real renders
  const heroIds = ['sell_iphone','icloud_ok','top_buyer'];
  document.querySelectorAll('#hero-stack .hero-card').forEach((card, i) => {
    card.innerHTML = '';
    const img = new Image();
    img.src = getThumb(heroIds[i], 320);
    img.alt = TEMPLATES.find(t=>t.id===heroIds[i]).name + ' template preview';
    card.appendChild(img);
    card.style.cursor = 'pointer';
    card.onclick = () => showEasy(heroIds[i]);
  });
  // gallery
  const grid = $('lp-tpl-grid');
  grid.innerHTML = '';
  TEMPLATES.forEach(t => {
    const card = document.createElement('div');
    card.className = 'tpl-card';
    card.setAttribute('role','button');
    card.setAttribute('tabindex','0');
    card.innerHTML = `<img src="${getThumb(t.id, 320)}" alt="${t.name} template">
      <div class="tpl-veil"></div>
      <div class="tpl-use">Use template →</div>
      <div class="tpl-meta"><span class="tpl-name">${t.name}</span><span class="tpl-tag">${t.tag}</span></div>`;
    const go = () => showEasy(t.id);
    card.onclick = go;
    card.onkeydown = e => { if (e.key==='Enter'||e.key===' ') { e.preventDefault(); go(); } };
    grid.appendChild(card);
  });
}

// ═══════════════ CANVAS CORE ═══════════════
function initCanvasOnce(){
  if (canvas) return;
  // restore last format BEFORE the canvas exists (templates bake at 1080×1080
  // when the script loads, so this must not run earlier than here)
  setFormat(jget('pgfx_format', 'square'), { skipRemap:true, silent:true });
  canvas = new fabric.Canvas('c', {
    width: CW, height: CH,
    preserveObjectStacking: true,
    backgroundColor: '#111114',
    selection: true,
  });
  fabric.Object.prototype.set({
    transparentCorners:false, cornerColor:'#ff4d00', cornerStrokeColor:'#ffffff',
    borderColor:'#ff4d00', cornerSize:11, cornerStyle:'circle', borderScaleFactor:1.5,
  });
  bindCanvasEvents();
  bindEditorUI();
  fitZoom();
}

function fitZoom(){
  if (!canvas) return;
  const stage = $('stage');
  const availW = stage.clientWidth - 90, availH = stage.clientHeight - 70;
  setZoom(Math.max(0.06, Math.min(availW / CW, availH / CH)));
}
function setZoom(s){
  zoomScale = Math.min(2.5, Math.max(0.06, s));
  canvas.setDimensions({ width: CW*zoomScale, height: CH*zoomScale });
  canvas.setZoom(zoomScale);
  canvas.requestRenderAll();
  $('zoom-pct').textContent = Math.round(zoomScale*100) + '%';
  syncGridOverlay();
}
function syncGridOverlay(){
  const g = $('grid-overlay');
  g.classList.toggle('on', !!viewCfg.grid);
  const cell = viewCfg.gridSize * zoomScale;
  g.style.backgroundSize = cell + 'px ' + cell + 'px, ' + cell + 'px ' + cell + 'px';
}

// ═══════════════ DOCUMENT FORMAT ═══════════════
// Remaps live objects between document spaces with the same rules buildLayer
// uses (positions & rect extents per-axis, sizes by short-axis factor), so
// square → story → square round-trips losslessly.
function remapObjects(ow, oh, nw, nh){
  const rx = nw / ow, ry = nh / oh;
  // uniform size factor routes through TEMPLATE space so round-trips are
  // lossless: every built-in format keeps one 1080 axis, so u is 1.0 and
  // text / QR / image sizes survive any chain of format switches untouched
  const u = Math.min(nw / TPL_W, nh / TPL_H) / Math.min(ow / TPL_W, oh / TPL_H);
  canvas.getObjects().forEach(o => {
    if (o.pgBgRect || o.pgScrim || o.name === 'BG' || o.name === 'Overlay'){
      o.set({ left:0, top:0, width:nw, height:nh, scaleX:1, scaleY:1 });
      o.setCoords();
      return;
    }
    const c = o.getCenterPoint();
    if (o.type === 'rect'){
      o.set({ width: o.width * rx, height: o.height * ry });
    } else if (o.type === 'circle'){
      o.set({ radius: o.radius * u });
    } else if (o.type === 'textbox'){
      o.set({ width: o.width * rx, fontSize: Math.round(o.fontSize * u) || o.fontSize });
    } else if (o.type === 'i-text' || o.type === 'text'){
      o.set({ fontSize: Math.round(o.fontSize * u) || o.fontSize });
    } else {
      // images, polygons, triangles, groups — scale uniformly, never distort
      o.set({ scaleX: (o.scaleX || 1) * u, scaleY: (o.scaleY || 1) * u });
    }
    o.setPositionByOrigin(new fabric.Point(c.x * rx, c.y * ry), 'center', 'center');
    o.setCoords();
  });
}
function refitBackground(){
  const bgi = canvas.backgroundImage;
  if (bgi && bgi.width) coverImage(bgi, CW, CH);
  else if (bgState && bgState.type !== 'image') applyBgSpec(canvas, bgState);
}
function setFormat(id, opts){
  opts = opts || {};
  const f = FORMATS[id];
  if (!f) return;
  const oldW = CW, oldH = CH;
  docFormat = id; CW = f.w; CH = f.h;
  jset('pgfx_format', id);
  if (canvas){
    if (!opts.skipRemap && (oldW !== CW || oldH !== CH)){
      canvas.discardActiveObject();   // selection-relative coords would corrupt the remap
      remapObjects(oldW, oldH, CW, CH);
      refitBackground();
    }
    canvas.calcOffset();
    fitZoom();
    canvas.requestRenderAll();
    if (!opts.silent){ pushHist(); toast(f.label + ' — ' + CW + '×' + CH); }
  }
  syncFormatUI();
}
function syncFormatUI(){
  const sel = $('tb-format');
  if (sel && sel.value !== docFormat) sel.value = docFormat;
  // export modal reflects real output dimensions for the live format
  document.querySelectorAll('#export-size-seg button').forEach(b => {
    const d = exportDims(+b.dataset.size);
    b.textContent = d.w + ' × ' + d.h + (+b.dataset.size === 2160 ? ' (2×)' : '');
  });
}

// history
function pushHist(){
  if (histLock || !canvas) return;
  // format travels with every snapshot so undo across a format switch
  // restores the canvas size the objects were laid out in
  const snap = JSON.stringify({ __fmt: docFormat, doc: canvas.toJSON(EXTRA_PROPS) });
  if (hist[histIdx] === snap) return;
  hist = hist.slice(0, histIdx+1);
  hist.push(snap);
  if (hist.length > 60) hist.shift();
  histIdx = hist.length - 1;
  updateUndoBtns();
  scheduleAutosave();
}
function debouncePush(ms){ clearTimeout(pushTimer); pushTimer = setTimeout(pushHist, ms||600); }
function restoreHist(json){
  histLock = true;
  let doc = json, fmt = null;
  try { const p = typeof json === 'string' ? JSON.parse(json) : json; if (p && p.doc){ doc = p.doc; fmt = p.__fmt; } } catch(e){}
  if (fmt && fmt !== docFormat) setFormat(fmt, { skipRemap:true, silent:true });
  canvas.loadFromJSON(doc, () => {
    canvas.renderAll(); histLock = false;
    refreshLayers(); refreshQuickFields(); refreshProps();
  });
}
function undo(){ if (histIdx > 0){ histIdx--; restoreHist(hist[histIdx]); updateUndoBtns(); } }
function redo(){ if (histIdx < hist.length-1){ histIdx++; restoreHist(hist[histIdx]); updateUndoBtns(); } }
function updateUndoBtns(){ $('undo-btn').disabled = histIdx <= 0; $('redo-btn').disabled = histIdx >= hist.length-1; }

function scheduleAutosave(){
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    if (!canvas) return;
    try {
      jset('pgfx_draft', {
        json: canvas.toJSON(EXTRA_PROPS), tplId: currentTplId, name: currentTplName,
        thumb: canvas.toDataURL({format:'jpeg', quality:0.6, multiplier: 128/(CW*zoomScale)}),
        ts: Date.now(), bg: bgState, fmt: docFormat,
      });
    } catch(e){}
  }, 1200);
}

// ═══════════════ TEMPLATE LOAD ═══════════════
function loadTemplate(id){
  const _t = TEMPLATES.find(t => t.id === id);
  if (_t && tplLocked(_t)){ openPlans('“' + _t.name + '” is a premium template — unlock all 8 designs with Starter or Pro.'); return; }
  const tpl = TEMPLATES.find(t => t.id === id);
  if (!tpl || !canvas) return;
  histLock = true;
  canvas.clear();
  bgState = tpl.bg.type === 'solid' ? {type:'solid', c:tpl.bg.c} : Object.assign({}, tpl.bg);
  applyBgSpec(canvas, tpl.bg);
  tpl.layers.forEach(l => canvas.add(buildLayer(l, tpl.id, CW, CH)));
  canvas.renderAll();
  histLock = false;
  currentTplId = id; currentTplName = tpl.name;
  $('tb-tplname').textContent = tpl.name;
  applyBrandToCanvas(true);
  hist = []; histIdx = -1; pushHist();
  refreshLayers(); refreshQuickFields(); refreshProps(); syncBgControls();
  maybeStartTutorial();
}

function loadSavedTemplate(saved){
  if (!canvas) return;
  setFormat(saved.fmt || 'square', { skipRemap:true, silent:true });
  histLock = true;
  canvas.loadFromJSON(saved.json, () => {
    canvas.renderAll(); histLock = false;
    currentTplId = saved.baseTpl || null;
    currentTplName = saved.name;
    if (saved.bg) bgState = saved.bg;
    $('tb-tplname').textContent = saved.name;
    hist = []; histIdx = -1; pushHist();
    refreshLayers(); refreshQuickFields(); refreshProps(); syncBgControls();
  });
}

function resumeDraft(){
  const d = jget('pgfx_draft', null);
  if (!d || !canvas) return;
  setFormat(d.fmt || 'square', { skipRemap:true, silent:true });
  histLock = true;
  canvas.loadFromJSON(d.json, () => {
    canvas.renderAll(); histLock = false;
    currentTplId = d.tplId || null;
    currentTplName = d.name || 'Untitled ad';
    if (d.bg) bgState = d.bg;
    $('tb-tplname').textContent = currentTplName;
    hist = []; histIdx = -1; pushHist();
    refreshLayers(); refreshQuickFields(); refreshProps(); syncBgControls();
  });
}

// ═══════════════ BRAND KIT ═══════════════
function openBrandModal(){
  const b = getBrand() || {};
  $('bk-phone').value = b.phone || '';
  $('bk-website').value = b.website || '';
  $('bk-name').value = b.name || '';
  $('brand-overlay').classList.add('show');
  setTimeout(() => $('bk-phone').focus(), 60);
}
function applyBrandToCanvas(silent){
  const b = getBrand();
  if (!b || !canvas) return;
  let n = 0;
  canvas.getObjects().forEach(o => {
    if (o.pgRole === 'phone' && b.phone){ o.set('text', formatPhone(b.phone)); n++; }
    if (o.pgRole === 'website' && b.website){ o.set('text', b.website); n++; }
  });
  if (n){ canvas.renderAll(); if (!silent){ pushHist(); refreshQuickFields(); toast('Brand kit applied'); } }
}
function formatPhone(s){
  const d = String(s).replace(/\D/g,'');
  if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
  if (d.length === 11 && d[0]==='1') return `(${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`;
  return String(s).trim();
}

// ═══════════════ TEXT CLEANUP (Enhance) ═══════════════
function fixBrandWords(s){
  return s.replace(/\biphones?\b/gi, m => m.toLowerCase().endsWith('s') ? 'iPhones' : 'iPhone')
          .replace(/\bipads?\b/gi, m => m.toLowerCase().endsWith('s') ? 'iPads' : 'iPad')
          .replace(/\bicloud\b/gi, 'iCloud')
          .replace(/\bmacbooks?\b/gi, m => m.toLowerCase().endsWith('s') ? 'MacBooks' : 'MacBook')
          .replace(/\bsamsung\b/gi, 'Samsung');
}
function cleanText(t, casing, role){
  let s = String(t).replace(/[ \t]+/g,' ').replace(/ ?\n ?/g,'\n').trim();
  s = s.replace(/\s+([,.!?;:])/g,'$1').replace(/([,;:]){2,}/g,'$1').replace(/!{3,}/g,'!!').replace(/\?{3,}/g,'??');
  if (role === 'phone') return formatPhone(s);
  if (role === 'website') return s.replace(/\s+/g,'');
  if (casing === 'upper') return s.toUpperCase().replace(/IPHONE/g,'iPHONE').replace(/IPAD/g,'iPAD').replace(/ICLOUD/g,'iCLOUD');
  if (casing === 'title'){
    s = s.toLowerCase().replace(/(^|[\s(\u2022•\-—/])([a-z])/g, (m,a,b) => a + b.toUpperCase());
    return fixBrandWords(s);
  }
  s = s.replace(/(^|\n)\s*([a-z])/g, (m,a,b) => a + b.toUpperCase()).replace(/\bi\b/g,'I');
  return fixBrandWords(s);
}

async function enhance(){
  if (!canvas) return;
  const btn = $('enhance-btn');
  btn.classList.add('busy');
  try {
    // 1) restore canonical template styling per layer trait
    let restored = 0;
    canvas.getObjects().forEach(o => {
      if (o.pgCurved) return;
      const tid = o.pgTplId, nm = o.name;
      if (tid && TRAITS[tid] && TRAITS[tid][nm]){
        const tr = TRAITS[tid][nm];
        const apply = {};
        TRAIT_KEYS.forEach(k => { if (tr[k] !== undefined) apply[k] = tr[k]; });
        o.set(apply);
        o.set('shadow', tr._shadow ? new fabric.Shadow(tr._shadow) : null);
        restored++;
      }
    });
    // 2) local text cleanup on every text object
    const texts = [];
    canvas.getObjects().forEach((o,i) => {
      if (o.text === undefined) return;
      const cleaned = cleanText(o.text, o.pgCasing || 'none', o.pgRole || '');
      if (cleaned !== o.text) o.set('text', cleaned);
      if (['headline','sub','info','cta'].includes(o.pgRole)) texts.push({ i, text:o.text, casing:o.pgCasing||'none' });
    });
    canvas.renderAll();
    // 3) optional AI polish — silent fallback when offline / standalone
    if (texts.length){
      try {
        const polished = await aiPolish(texts);
        if (polished){
          polished.forEach(p => {
            const obj = canvas.getObjects()[p.i];
            if (obj && typeof p.text === 'string' && p.text.trim()){
              obj.set('text', cleanText(p.text, obj.pgCasing || 'none', obj.pgRole || ''));
            }
          });
          canvas.renderAll();
        }
      } catch(e){ /* local cleanup already applied */ }
    }
    pushHist(); refreshQuickFields(); refreshLayers(); refreshProps();
    toast(restored ? '✦ Enhanced — styling restored, text cleaned' : '✦ Enhanced — text cleaned', 'success');
  } finally { btn.classList.remove('busy'); }
}

async function aiPolish(texts){
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST', headers:{'Content-Type':'application/json'}, signal: ctrl.signal,
      body: JSON.stringify({
        model:'claude-sonnet-4-6', max_tokens:1000,
        messages:[{ role:'user', content:
`Fix ONLY spelling, punctuation and spacing in these ad text snippets. Keep meaning, word count and line breaks. Do not add or remove words. Respond with ONLY a JSON array of {"i":number,"text":string} — no markdown, no preamble.
${JSON.stringify(texts.map(t => ({ i:t.i, text:t.text })))}` }]
      })
    });
    clearTimeout(to);
    if (!res.ok) return null;
    const data = await res.json();
    const raw = (data.content||[]).map(c => c.text||'').join('').replace(/```json|```/g,'').trim();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : null;
  } catch(e){ clearTimeout(to); return null; }
}

// ═══════════════ CANVAS EVENTS: snap, selection, sync ═══════════════
function bindCanvasEvents(){
  const SNAP = 18;
  canvas.on('object:moving', e => {
    const o = e.target; if (!o) return;
    let sx = false, sy = false;
    if (viewCfg.gridSnap){
      const g = viewCfg.gridSize;
      o.set({ left: Math.round(o.left / g) * g, top: Math.round(o.top / g) * g });
      o.setCoords();
    }
    if (viewCfg.centerSnap){
      const c = o.getCenterPoint();
      if (Math.abs(c.x - CW/2) < SNAP){ o.setPositionByOrigin(new fabric.Point(CW/2, c.y), 'center', 'center'); sx = true; }
      const c2 = o.getCenterPoint();
      if (Math.abs(c2.y - CH/2) < SNAP){ o.setPositionByOrigin(new fabric.Point(c2.x, CH/2), 'center', 'center'); sy = true; }
    }
    $('guide-v').classList.toggle('on', sx);
    $('guide-h').classList.toggle('on', sy);
  });
  canvas.on('mouse:up', () => { $('guide-v').classList.remove('on'); $('guide-h').classList.remove('on'); });

  canvas.on('object:modified', () => { pushHist(); refreshLayers(); refreshQuickFields(); refreshProps(); });
  canvas.on('object:added',    () => { if (!histLock){ debouncePush(80); refreshLayers(); refreshQuickFields(); } });
  canvas.on('object:removed',  () => { if (!histLock){ debouncePush(80); refreshLayers(); refreshQuickFields(); } });
  canvas.on('text:changed', e => {
    // live sync canvas typing → panels
    syncTextPanels(e.target);
    debouncePush(900);
  });
  canvas.on('selection:created', refreshProps);
  canvas.on('selection:updated', refreshProps);
  canvas.on('selection:cleared', refreshProps);
}

function syncTextPanels(obj){
  if (!obj || obj.text === undefined) return;
  const qf = document.querySelector(`#quick-fields [data-qf="${cssEsc(obj.name||'')}"]`);
  if (qf && document.activeElement !== qf) qf.value = obj.text;
  if (canvas.getActiveObject() === obj && document.activeElement !== $('pt-content')) $('pt-content').value = obj.text;
  refreshLayers();
}
function cssEsc(s){ return s.replace(/["\\]/g, '\\$&'); }

// ═══════════════ QUICK EDIT FIELDS ═══════════════
function refreshQuickFields(){
  const wrap = $('quick-fields');
  if (!canvas){ wrap.innerHTML=''; return; }
  const texts = canvas.getObjects().filter(o => o.text !== undefined && o.pgRole !== 'deco' && o.name);
  if (!texts.length){
    wrap.innerHTML = '<div class="empty-hint">Pick a template to get editable fields here.</div>';
    return;
  }
  wrap.innerHTML = '';
  texts.forEach(o => {
    const f = document.createElement('div');
    f.className = 'field';
    const multi = o.text.includes('\n');
    f.innerHTML = `<label>${o.name}</label>` + (multi
      ? `<textarea rows="3" data-qf="${o.name}"></textarea>`
      : `<input type="${o.pgRole==='phone'?'tel':'text'}" data-qf="${o.name}">`);
    const inp = f.querySelector('[data-qf]');
    inp.value = o.text;
    inp.addEventListener('input', () => {
      let v = inp.value;
      if (o.pgCasing === 'upper' && v === v.toLowerCase() && v !== v.toUpperCase()){ /* keep as typed; enhance fixes */ }
      o.set('text', v);
      canvas.requestRenderAll();
      debouncePush(900);
      refreshLayers();
    });
    inp.addEventListener('focus', () => { canvas.setActiveObject(o); canvas.requestRenderAll(); refreshProps(); });
    wrap.appendChild(f);
  });
}

// ═══════════════ SELLING POINT CHIPS ═══════════════
function buildChips(){
  const wrap = $('badge-chips');
  wrap.innerHTML = '';
  SELL_POINTS.forEach(w => {
    const b = document.createElement('button');
    b.className = 'chip'; b.textContent = w;
    b.onclick = () => addSellPoint(w);
    wrap.appendChild(b);
  });
}
function addSellPoint(w){
  if (!canvas) return;
  let badge = canvas.getObjects().find(o => o.pgRole === 'badges');
  if (badge){
    const count = (badge.text.match(/•/g)||[]).length;
    if (badge.text.toUpperCase().includes(w)) { toast('Already on the badge strip'); return; }
    badge.set('text', badge.text + '\n\u2022 ' + w);
    if (count + 1 > 4) toast('Tip: 3–4 points reads best', 'error');
  } else {
    badge = new fabric.IText('\u2022 ' + w, {
      left: CW-30, top: 30, originX:'right', fontFamily:F_COND, fontSize:32, fill:'#000000',
      fontWeight:'900', backgroundColor:'#ffd200', padding:6, paintFirst:'stroke',
      name:'Badges', pgRole:'badges', pgCasing:'upper', pgTplId: currentTplId,
    });
    canvas.add(badge);
  }
  canvas.setActiveObject(badge); canvas.renderAll();
  pushHist(); refreshQuickFields(); refreshLayers();
}

// ═══════════════ BACKGROUND CONTROLS ═══════════════
function bindBgControls(){
  document.querySelectorAll('#qbg-seg button').forEach(b => {
    b.onclick = () => {
      document.querySelectorAll('#qbg-seg button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      const t = b.dataset.bg;
      $('qbg-solid').style.display = t==='solid' ? '' : 'none';
      $('qbg-grad').style.display  = t==='grad'  ? '' : 'none';
      $('qbg-image').style.display = t==='image' ? '' : 'none';
      if (t === 'solid'){ bgState = {type:'solid', c:$('qbg-color').value}; applyBg(); }
      if (t === 'grad'){ bgState = {type:'grad', c1:$('qbg-c1').value, c2:$('qbg-c2').value, a:+$('qbg-angle').value}; applyBg(); }
    };
  });
  $('qbg-color').addEventListener('input', () => { bgState = {type:'solid', c:$('qbg-color').value}; applyBg(); });
  ['qbg-c1','qbg-c2'].forEach(id => $(id).addEventListener('input', () => {
    bgState = {type:'grad', c1:$('qbg-c1').value, c2:$('qbg-c2').value, a:+$('qbg-angle').value}; applyBg();
  }));
  $('qbg-angle').addEventListener('input', () => {
    $('qbg-angle-val').textContent = $('qbg-angle').value + '°';
    bgState = {type:'grad', c1:$('qbg-c1').value, c2:$('qbg-c2').value, a:+$('qbg-angle').value}; applyBg();
  });
  $('qbg-upload').onclick = () => $('qbg-file').click();
  $('qbg-file').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    e.target.value = '';
    let dataUrl;
    try { dataUrl = await fileToDataUrl(f); }
    catch (err){ if (!err.pgxToasted) toast('That image could not be read', 'error'); return; }
    {
      fabric.Image.fromURL(dataUrl, img => {
        if (!img || !img.width || !img.height){ toast('That image could not be read', 'error'); return; }
        const s = Math.max(CW/img.width, CH/img.height);
        img.set({ originX:'left', originY:'top', left:(CW-img.width*s)/2, top:(CH-img.height*s)/2, scaleX:s, scaleY:s });
        canvas.setBackgroundImage(img, () => { canvas.renderAll(); pushHist(); });
        toast('Background photo set');
      });
    }
  });
  $('qbg-remove').onclick = () => { canvas.setBackgroundImage(null, () => { canvas.renderAll(); pushHist(); }); };
}
function applyBg(){
  if (!canvas) return;
  applyBgSpec(canvas, bgState);
  debouncePush(500);
}
function syncBgControls(){
  const t = bgState.type || 'grad';
  document.querySelectorAll('#qbg-seg button').forEach(x => x.classList.toggle('active', x.dataset.bg === t));
  $('qbg-solid').style.display = t==='solid' ? '' : 'none';
  $('qbg-grad').style.display  = t==='grad'  ? '' : 'none';
  $('qbg-image').style.display = t==='image' ? '' : 'none';
  if (t === 'solid' && bgState.c && /^#/.test(bgState.c)) $('qbg-color').value = bgState.c;
  if (t === 'grad'){
    if (bgState.c1) $('qbg-c1').value = bgState.c1;
    if (bgState.c2) $('qbg-c2').value = bgState.c2;
    if (bgState.a !== undefined){ $('qbg-angle').value = bgState.a; $('qbg-angle-val').textContent = bgState.a + '°'; }
  }
}

// ═══════════════ LAYERS PANEL ═══════════════
function refreshLayers(){
  const list = $('layers-list');
  if (!canvas){ list.innerHTML=''; return; }
  const objs = canvas.getObjects().filter(o => !o.pgBgRect && !o.pgScrim).slice().reverse();
  const active = canvas.getActiveObject();
  list.innerHTML = '';
  if (!objs.length){ list.innerHTML = '<div class="empty-hint">No layers yet — pick a template or add elements.</div>'; return; }
  objs.forEach(o => {
    const row = document.createElement('div');
    row.className = 'layer-row' + (o === active ? ' selected' : '') + (o.visible === false ? ' hidden-l' : '');
    const isText = o.text !== undefined;
    const ico = isText ? 'T' : (o.type === 'circle' ? '◯' : (o.type === 'image' ? '🖼' : '▭'));
    const prev = isText ? o.text.replace(/\n/g,' · ').slice(0, 30) : (o.type || 'shape');
    row.innerHTML = `
      <div class="layer-ico ${isText?'li-text':''}">${ico}</div>
      <div class="layer-main"><div class="layer-name">${o.name || (isText?'Text':'Shape')}</div><div class="layer-prev">${escHtml(prev)}</div></div>
      <div class="layer-acts">
        <button class="la-up" title="Move up">▲</button>
        <button class="la-dn" title="Move down">▼</button>
        <button class="la-eye ${o.visible!==false?'on':''}" title="Show / hide">👁</button>
        <button class="la-lock ${o.pgLocked?'on':''}" title="Lock / unlock">${o.pgLocked?'🔒':'🔓'}</button>
      </div>`;
    row.addEventListener('click', e => {
      if (e.target.closest('.layer-acts')) return;
      if (o.pgLocked || o.visible === false) return;
      canvas.setActiveObject(o); canvas.requestRenderAll(); refreshProps(); refreshLayers();
    });
    row.addEventListener('dblclick', e => {
      if (e.target.closest('.layer-acts')) return;
      const nn = prompt('Rename layer', o.name || '');
      if (nn !== null && nn.trim()){ o.name = nn.trim(); pushHist(); refreshLayers(); refreshQuickFields(); }
    });
    row.querySelector('.la-up').onclick   = e => { e.stopPropagation(); canvas.bringForward(o); canvas.renderAll(); pushHist(); refreshLayers(); };
    row.querySelector('.la-dn').onclick   = e => { e.stopPropagation(); canvas.sendBackwards(o); canvas.renderAll(); pushHist(); refreshLayers(); };
    row.querySelector('.la-eye').onclick  = e => { e.stopPropagation(); o.set('visible', o.visible === false); if (o.visible===false && canvas.getActiveObject()===o) canvas.discardActiveObject(); canvas.renderAll(); pushHist(); refreshLayers(); };
    row.querySelector('.la-lock').onclick = e => {
      e.stopPropagation();
      o.pgLocked = !o.pgLocked;
      o.set({ selectable: !o.pgLocked, evented: !o.pgLocked });
      if (o.pgLocked && canvas.getActiveObject() === o) canvas.discardActiveObject();
      canvas.renderAll(); pushHist(); refreshLayers();
    };
    list.appendChild(row);
  });

  // Background pseudo-layer (bottom of the stack)
  const bgRow = document.createElement('div');
  bgRow.className = 'layer-row layer-bg-row';
  const bgi = canvas.backgroundImage;
  let bgSw;
  if (bgi){
    let src = '';
    try { src = (bgi.getSrc && bgi.getSrc()) || (bgi._element && bgi._element.src) || ''; } catch (e){}
    bgSw = src ? `<img src="${src}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:6px">` 
               : '<span style="width:100%;height:100%;display:block;border-radius:6px;background:#333"></span>';
  } else {
    bgSw = `<span style="width:100%;height:100%;display:block;border-radius:6px;background:${cssBg(bgState)}"></span>`;
  }
  bgRow.innerHTML = `
    <div class="layer-ico" style="padding:0;overflow:hidden">${bgSw}</div>
    <div class="layer-main"><div class="layer-name">Background</div><div class="layer-prev">${bgi ? 'Photo — click to change' : 'Color — click to change'}</div></div>
    <div class="layer-acts">${bgi ? '<button class="lb-clear" title="Remove background photo">✕</button>' : ''}</div>`;
  bgRow.addEventListener('click', e => {
    if (e.target.classList.contains('lb-clear')){
      e.stopPropagation();
      canvas.setBackgroundImage(null, () => { canvas.renderAll(); pushHist(); refreshLayers(); });
      return;
    }
    switchLTab('quick');
    $('panel-left').classList.remove('collapsed');
    const el = $('qbg-seg');
    if (el){
      el.scrollIntoView({ behavior:'smooth', block:'center' });
      el.style.outline = '2px solid var(--orange)'; el.style.outlineOffset = '4px'; el.style.borderRadius = '8px';
      setTimeout(() => { el.style.outline = ''; }, 1200);
    }
  });
  list.appendChild(bgRow);
}
function escHtml(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

// ═══════════════ PROPERTIES PANEL ═══════════════
let propsSyncing = false;
function refreshProps(){
  if (!canvas) return;
  const o = canvas.getActiveObject();
  const isCurved = !!o && !!o.pgCurved;
  const isQr = !!o && o.pgRole === 'qr';
  const isText = !!o && (o.text !== undefined || isCurved);
  const isImage = !!o && o.type === 'image' && !isQr;   // photo tweaks would break QR scannability
  const isShape = !!o && !isText && !isImage && !isQr && o.type !== 'activeSelection' && o.type !== 'group';
  $('props-empty').style.display  = o ? 'none' : '';
  $('props-text').style.display   = isText ? '' : 'none';
  $('props-shape').style.display  = isShape ? '' : 'none';
  $('props-image').style.display  = isImage ? '' : 'none';
  $('props-qr').style.display     = isQr ? '' : 'none';
  $('props-common').style.display = o ? '' : 'none';
  if (!o) { refreshLayers(); return; }
  propsSyncing = true;
  if (isQr) $('pq-url').value = o.pgQrData || '';
  if (isText){
    const src = isCurved ? o.pgCurved.style : o;
    $('pt-content').value = isCurved ? o.pgCurved.text : o.text;
    $('pt-font').value = src.fontFamily || 'Bebas Neue';
    $('pt-size').value = Math.round(src.fontSize || 40);
    $('pt-weight').value = String(src.fontWeight || '400');
    document.querySelectorAll('#pt-align button').forEach(b => b.classList.toggle('active', !isCurved && b.dataset.al === (o.textAlign || 'left')));
    $('pt-lsp').value = src.charSpacing || 0; $('pt-lsp-val').textContent = src.charSpacing || 0;
    $('pt-lh').value = Math.round((src.lineHeight || 1.16) * 100); $('pt-lh-val').textContent = (src.lineHeight || 1.16).toFixed(2);
    $('pt-lh').closest('.field').style.display = isCurved ? 'none' : '';
    $('pt-italic').classList.toggle('active', src.fontStyle === 'italic');
    $('pt-under').classList.toggle('active', !isCurved && !!o.underline);
    $('pt-curve').value = isCurved ? o.pgCurved.curve : 0;
    $('pt-curve-val').textContent = isCurved ? o.pgCurved.curve : 0;
    const grad = o.pgFillGrad;
    document.querySelectorAll('#pt-fillseg button').forEach(b => b.classList.toggle('active', b.dataset.ft === (grad ? 'grad' : 'solid')));
    $('pt-fill-solid').style.display = grad ? 'none' : '';
    $('pt-fill-grad').style.display = grad ? '' : 'none';
    if (grad){ $('pt-g1').value = grad.c1; $('pt-g2').value = grad.c2; $('pt-ga').value = grad.a; $('pt-ga-val').textContent = grad.a + '°'; $('pt-stroke2').value = toHex(src.stroke, '#000000'); }
    $('pt-fill').value = toHex(src.fill, '#ffffff');
    $('pt-stroke').value = toHex(src.stroke, '#000000');
    $('pt-sw').value = src.strokeWidth || 0; $('pt-sw-val').textContent = src.strokeWidth || 0;
    const shBlur = (src.shadow && src.shadow.blur) || 0;
    $('pt-shadow').value = shBlur; $('pt-shadow-val').textContent = shBlur;
    $('pt-shadow-color').value = toHex(src.shadow && src.shadow.color, '#000000');
  }
  if (isShape){
    const sg = o.pgFillGrad;
    document.querySelectorAll('#ps-fillseg button').forEach(b => b.classList.toggle('active', b.dataset.ft === (sg ? 'grad' : 'solid')));
    $('ps-fill-solid').style.display = sg ? 'none' : '';
    $('ps-fill-grad').style.display = sg ? '' : 'none';
    if (sg){ $('ps-g1').value = sg.c1; $('ps-g2').value = sg.c2; $('ps-ga').value = sg.a; $('ps-ga-val').textContent = sg.a + '°'; }
    $('ps-fill').value = toHex(o.fill, '#ff4d00');
    $('ps-stroke').value = toHex(o.stroke, '#000000');
    $('ps-sw').value = o.strokeWidth || 0; $('ps-sw-val').textContent = o.strokeWidth || 0;
    $('ps-rx-field').style.display = o.type === 'rect' ? '' : 'none';
    if (o.type === 'rect'){ $('ps-rx').value = o.rx || 0; $('ps-rx-val').textContent = o.rx || 0; }
  }
  if (isImage){
    const a = o.pgAdj || {};
    $('pi-b').value = a.b || 0;  $('pi-b-val').textContent = a.b || 0;
    $('pi-c').value = a.c || 0;  $('pi-c-val').textContent = a.c || 0;
    $('pi-s').value = a.s || 0;  $('pi-s-val').textContent = a.s || 0;
    $('pi-bl').value = a.bl || 0; $('pi-bl-val').textContent = a.bl || 0;
    $('pi-gray').classList.toggle('active', !!a.g);
  }
  $('pc-op').value = Math.round((o.opacity ?? 1) * 100);
  $('pc-op-val').textContent = Math.round((o.opacity ?? 1) * 100) + '%';
  $('pc-rot').value = Math.round(o.angle || 0);
  propsSyncing = false;
  refreshLayers();
}
function toHex(c, fb){
  if (!c || typeof c !== 'string') return fb;
  if (/^#([0-9a-f]{6})$/i.test(c)) return c;
  if (/^#([0-9a-f]{3})$/i.test(c)) return '#' + c.slice(1).split('').map(x=>x+x).join('');
  const m = c.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (m) return '#' + [m[1],m[2],m[3]].map(n => (+n).toString(16).padStart(2,'0')).join('');
  return fb;
}
function withActive(fn){
  const o = canvas && canvas.getActiveObject();
  if (!o || propsSyncing) return;
  fn(o); canvas.requestRenderAll(); debouncePush(500);
}
function bindPropsControls(){
  // QR layer
  $('pq-apply').onclick = () => withActive(o => updateQrObject(o, $('pq-url').value.trim()));
  $('pq-url').addEventListener('keydown', e => { if (e.key === 'Enter') $('pq-apply').click(); });
  const sml = $('pq-scansad');
  if (sml && scanmapUrl()) sml.href = scanmapUrl() + '/login.html';

  const textProp = (key, val) => withActive(o => {
    if (o.pgCurved){ const st = {}; st[key] = val; rebuildCurved(o, { style: st }); }
    else { o.set(key, val); if (key !== 'text') syncTextPanels(o); }
  });
  $('pt-content').addEventListener('input', () => withActive(o => {
    if (o.pgCurved) rebuildCurved(o, { text: $('pt-content').value });
    else if (o.text !== undefined){ o.set('text', $('pt-content').value); syncTextPanels(o); }
  }));
  buildFontOptions($('pt-font'));
  $('pt-font').addEventListener('change', async () => {
    const f = $('pt-font').value;
    await ensureFont(f);
    textProp('fontFamily', f);
    canvas.requestRenderAll();
  });
  $('pt-size').addEventListener('input', () => textProp('fontSize', Math.max(8, +$('pt-size').value || 8)));
  $('pt-weight').addEventListener('change', () => textProp('fontWeight', $('pt-weight').value));
  $('pt-curve').addEventListener('input', () => withActive(o => {
    const v = +$('pt-curve').value;
    $('pt-curve-val').textContent = v;
    if (o.pgCurved) rebuildCurved(o, { curve: v });
    else if (o.text !== undefined && v !== 0) textToCurved(o, v);
    canvas.requestRenderAll();
  }));
  document.querySelectorAll('#pt-align button').forEach(b => b.onclick = () => withActive(o => {
    o.set('textAlign', b.dataset.al);
    document.querySelectorAll('#pt-align button').forEach(x => x.classList.toggle('active', x === b));
  }));
  $('pt-lsp').addEventListener('input', () => { $('pt-lsp-val').textContent = $('pt-lsp').value; textProp('charSpacing', +$('pt-lsp').value); });
  $('pt-lh').addEventListener('input', () => withActive(o => { const v = +$('pt-lh').value / 100; o.set('lineHeight', v); $('pt-lh-val').textContent = v.toFixed(2); }));
  $('pt-italic').onclick = () => withActive(o => {
    const cur = o.pgCurved ? o.pgCurved.style.fontStyle : o.fontStyle;
    const nv = cur === 'italic' ? 'normal' : 'italic';
    $('pt-italic').classList.toggle('active', nv === 'italic');
    if (o.pgCurved) rebuildCurved(o, { style:{ fontStyle: nv } }); else o.set('fontStyle', nv);
  });
  $('pt-under').onclick = () => withActive(o => { o.set('underline', !o.underline); $('pt-under').classList.toggle('active', !!o.underline); });
  $('pt-fill').addEventListener('input', () => withActive(o => { o.pgFillGrad = null; textProp('fill', $('pt-fill').value); }));
  $('pt-stroke').addEventListener('input', () => textProp('stroke', $('pt-stroke').value));
  $('pt-stroke2').addEventListener('input', () => textProp('stroke', $('pt-stroke2').value));
  $('pt-sw').addEventListener('input', () => withActive(o => {
    $('pt-sw-val').textContent = $('pt-sw').value;
    const st = { stroke: (o.pgFillGrad ? $('pt-stroke2') : $('pt-stroke')).value, strokeWidth: +$('pt-sw').value };
    if (o.pgCurved) rebuildCurved(o, { style: st }); else o.set(Object.assign({ paintFirst:'stroke' }, st));
  }));
  // fill type: solid / gradient (text)
  document.querySelectorAll('#pt-fillseg button').forEach(b => b.onclick = () => withActive(o => {
    document.querySelectorAll('#pt-fillseg button').forEach(x => x.classList.toggle('active', x === b));
    const grad = b.dataset.ft === 'grad';
    $('pt-fill-solid').style.display = grad ? 'none' : '';
    $('pt-fill-grad').style.display = grad ? '' : 'none';
    if (grad){
      const spec = { c1:$('pt-g1').value, c2:$('pt-g2').value, a:+$('pt-ga').value };
      if (o.pgCurved){ o.pgFillGrad = spec; rebuildCurved(o, { style:{ fill: objGrad(spec) } }); }
      else setObjGradient(o, spec);
    } else {
      if (o.pgCurved){ o.pgFillGrad = null; rebuildCurved(o, { style:{ fill: $('pt-fill').value } }); }
      else clearObjGradient(o, $('pt-fill').value);
    }
  }));
  const ptGradUpd = () => withActive(o => {
    const spec = { c1:$('pt-g1').value, c2:$('pt-g2').value, a:+$('pt-ga').value };
    $('pt-ga-val').textContent = spec.a + '°';
    if (o.pgCurved){ o.pgFillGrad = spec; rebuildCurved(o, { style:{ fill: objGrad(spec) } }); }
    else setObjGradient(o, spec);
  });
  ['pt-g1','pt-g2','pt-ga'].forEach(id => $(id).addEventListener('input', ptGradUpd));
  const shadowUpd = () => withActive(o => {
    const blur = +$('pt-shadow').value;
    $('pt-shadow-val').textContent = blur;
    const sh = blur ? { color:$('pt-shadow-color').value, blur, offsetX:0, offsetY:0 } : null;
    if (o.pgCurved) rebuildCurved(o, { style:{ shadow: sh } });
    else o.set('shadow', sh ? new fabric.Shadow(sh) : null);
  });
  $('pt-shadow').addEventListener('input', shadowUpd);
  $('pt-shadow-color').addEventListener('input', shadowUpd);

  $('ps-fill').addEventListener('input', () => withActive(o => { o.pgFillGrad = null; o.set('fill', $('ps-fill').value); }));
  document.querySelectorAll('#ps-fillseg button').forEach(b => b.onclick = () => withActive(o => {
    document.querySelectorAll('#ps-fillseg button').forEach(x => x.classList.toggle('active', x === b));
    const grad = b.dataset.ft === 'grad';
    $('ps-fill-solid').style.display = grad ? 'none' : '';
    $('ps-fill-grad').style.display = grad ? '' : 'none';
    if (grad) setObjGradient(o, { c1:$('ps-g1').value, c2:$('ps-g2').value, a:+$('ps-ga').value });
    else clearObjGradient(o, $('ps-fill').value);
  }));
  const psGradUpd = () => withActive(o => {
    const spec = { c1:$('ps-g1').value, c2:$('ps-g2').value, a:+$('ps-ga').value };
    $('ps-ga-val').textContent = spec.a + '°';
    setObjGradient(o, spec);
  });
  ['ps-g1','ps-g2','ps-ga'].forEach(id => $(id).addEventListener('input', psGradUpd));
  $('ps-stroke').addEventListener('input', () => withActive(o => o.set('stroke', $('ps-stroke').value)));
  $('ps-sw').addEventListener('input', () => withActive(o => { o.set({stroke:$('ps-stroke').value, strokeWidth:+$('ps-sw').value}); $('ps-sw-val').textContent = $('ps-sw').value; }));
  $('ps-rx').addEventListener('input', () => withActive(o => { if (o.type==='rect'){ o.set({rx:+$('ps-rx').value, ry:+$('ps-rx').value}); $('ps-rx-val').textContent = $('ps-rx').value; } }));

  $('pc-op').addEventListener('input', () => withActive(o => { o.set('opacity', +$('pc-op').value/100); $('pc-op-val').textContent = $('pc-op').value + '%'; }));
  $('pc-center-h').onclick = () => withActive(o => { o.setPositionByOrigin(new fabric.Point(CW/2, o.getCenterPoint().y), 'center','center'); o.setCoords(); });
  $('pc-center-v').onclick = () => withActive(o => { o.setPositionByOrigin(new fabric.Point(o.getCenterPoint().x, CH/2), 'center','center'); o.setCoords(); });
  $('pc-front').onclick = () => withActive(o => { canvas.bringToFront(o); refreshLayers(); });
  $('pc-fwd').onclick   = () => withActive(o => { canvas.bringForward(o); refreshLayers(); });
  $('pc-back').onclick  = () => withActive(o => { canvas.sendBackwards(o); refreshLayers(); });
  $('pc-rear').onclick  = () => withActive(o => { canvas.sendToBack(o); refreshLayers(); });
  $('pc-dup').onclick = duplicateSelected;
  $('pc-del').onclick = deleteSelected;

  // align to canvas (works for single objects and multi-selections)
  const alignTo = fn => withActive(o => { fn(o, o.getBoundingRect(true, true)); o.setCoords(); });
  $('pc-al-l').onclick = () => alignTo((o,r) => { o.left += 0 - r.left; });
  $('pc-al-r').onclick = () => alignTo((o,r) => { o.left += CW - (r.left + r.width); });
  $('pc-al-t').onclick = () => alignTo((o,r) => { o.top += 0 - r.top; });
  $('pc-al-b').onclick = () => alignTo((o,r) => { o.top += CH - (r.top + r.height); });
  $('pc-flip-h').onclick = () => withActive(o => o.set('flipX', !o.flipX));
  $('pc-flip-v').onclick = () => withActive(o => o.set('flipY', !o.flipY));
  $('pc-rot').addEventListener('input', () => withActive(o => { o.rotate(+$('pc-rot').value || 0); o.setCoords(); }));
  $('pc-rot-reset').onclick = () => withActive(o => { o.rotate(0); o.setCoords(); $('pc-rot').value = 0; });

  // photo adjustments
  const adjUpd = () => withActive(o => {
    if (o.type !== 'image') return;
    o.pgAdj = { b:+$('pi-b').value, c:+$('pi-c').value, s:+$('pi-s').value, bl:+$('pi-bl').value, g: $('pi-gray').classList.contains('active') };
    $('pi-b-val').textContent = o.pgAdj.b; $('pi-c-val').textContent = o.pgAdj.c;
    $('pi-s-val').textContent = o.pgAdj.s; $('pi-bl-val').textContent = o.pgAdj.bl;
    applyImageAdj(o);
  });
  ['pi-b','pi-c','pi-s','pi-bl'].forEach(id => $(id).addEventListener('input', adjUpd));
  $('pi-gray').onclick = () => { $('pi-gray').classList.toggle('active'); adjUpd(); };
  $('pi-reset').onclick = () => withActive(o => {
    if (o.type !== 'image') return;
    o.pgAdj = null; o.filters = []; o.applyFilters();
    refreshProps();
  });
}

function applyImageAdj(o){
  const a = o.pgAdj || {};
  const f = [];
  if (a.b) f.push(new fabric.Image.filters.Brightness({ brightness: a.b / 100 }));
  if (a.c) f.push(new fabric.Image.filters.Contrast({ contrast: a.c / 100 }));
  if (a.s) f.push(new fabric.Image.filters.Saturation({ saturation: a.s / 100 }));
  if (a.bl) f.push(new fabric.Image.filters.Blur({ blur: a.bl / 100 }));
  if (a.g) f.push(new fabric.Image.filters.Grayscale());
  o.filters = f;
  o.applyFilters();
  canvas.requestRenderAll();
}
function duplicateSelected(){
  const o = canvas && canvas.getActiveObject();
  if (!o) return;
  o.clone(cl => {
    cl.set({ left:(o.left||0)+34, top:(o.top||0)+34, name:(o.name||'Layer')+' copy', pgRole:o.pgRole, pgCasing:o.pgCasing, pgTplId:o.pgTplId });
    canvas.add(cl); canvas.setActiveObject(cl); canvas.renderAll();
    pushHist(); refreshLayers(); refreshQuickFields(); refreshProps();
  }, EXTRA_PROPS);
}
function deleteSelected(){
  const sel = canvas && canvas.getActiveObjects();
  if (!sel || !sel.length) return;
  sel.forEach(o => canvas.remove(o));
  canvas.discardActiveObject(); canvas.renderAll();
  pushHist(); refreshLayers(); refreshQuickFields(); refreshProps();
}

// ═══════════════ ADD ELEMENTS ═══════════════
function addElement(kind){
  if (kind === 'qr'){ addQrLayer(); return; }
  if (!canvas) return;
  let o;
  if (kind === 'headline') o = new fabric.IText('YOUR HEADLINE', {left:CW/2, top:CH/2-80, originX:'center', fontFamily:F_DISPLAY, fontSize:120, fill:'#ffffff', stroke:'#000000', strokeWidth:6, paintFirst:'stroke', name:'Headline', pgRole:'headline', pgCasing:'upper', pgTplId:currentTplId});
  else if (kind === 'sub') o = new fabric.IText('SUPPORTING LINE', {left:CW/2, top:CH/2, originX:'center', fontFamily:F_COND, fontSize:54, fill:'#ffd200', fontWeight:'800', paintFirst:'stroke', name:'Subheading', pgRole:'sub', pgCasing:'upper', pgTplId:currentTplId});
  else if (kind === 'body') o = new fabric.Textbox('Body text — double-click to edit', {left:CW/2, top:CH/2+70, width:600, originX:'center', fontFamily:F_COND, fontSize:36, fill:'#ffffff', textAlign:'center', paintFirst:'stroke', name:'Body text', pgRole:'info', pgCasing:'none', pgTplId:currentTplId});
  else if (kind === 'badge') { addSellPoint('QUICK'); return; }
  else if (kind === 'rect') o = new fabric.Rect({left:CW/2-180, top:CH/2-90, width:360, height:180, fill:'#ff4d00', rx:10, name:'Rectangle'});
  else if (kind === 'circle') o = new fabric.Circle({left:CW/2-110, top:CH/2-110, radius:110, fill:'#f5a623', name:'Circle'});
  else if (kind === 'line') o = new fabric.Rect({left:CW/2-220, top:CH/2, width:440, height:6, fill:'#ffffff', name:'Line'});
  else if (kind === 'tri') o = new fabric.Triangle({left:CW/2-130, top:CH/2-120, width:260, height:230, fill:'#22c55e', name:'Triangle'});
  else if (kind === 'star'){
    const pts = [], R = 130, r = 52;
    for (let i = 0; i < 10; i++){
      const rad = (i % 2 ? r : R), ang = -Math.PI/2 + i * Math.PI/5;
      pts.push({ x: rad * Math.cos(ang), y: rad * Math.sin(ang) });
    }
    o = new fabric.Polygon(pts, {left:CW/2-130, top:CH/2-130, fill:'#ffd200', name:'Star'});
  }
  if (!o) return;
  canvas.add(o); canvas.setActiveObject(o); canvas.renderAll();
  pushHist(); refreshLayers(); refreshQuickFields(); refreshProps();
}
function addEmoji(em){
  const o = new fabric.IText(em, {left:CW/2, top:CH/2, originX:'center', originY:'center', fontSize:110, name:'Emoji', pgRole:'deco'});
  canvas.add(o); canvas.setActiveObject(o); canvas.renderAll();
  pushHist(); refreshLayers();
}
async function addImageFromFile(f){
  let dataUrl;
  try { dataUrl = await fileToDataUrl(f); }
  catch (err){ if (!err.pgxToasted) toast('That image could not be read', 'error'); return; }
  fabric.Image.fromURL(dataUrl, img => {
    if (!img || !img.width || !img.height){ toast('That image could not be read', 'error'); return; }
    const s = Math.min(1, 520/Math.max(img.width, img.height));
    img.set({ left:CW/2, top:CH/2, originX:'center', originY:'center', scaleX:s, scaleY:s, name:'Image' });
    canvas.add(img); canvas.setActiveObject(img); canvas.renderAll();
    pushHist(); refreshLayers();
  });
}

// ═══════════════ SAVED TEMPLATES ═══════════════
function snapshotPng(px, fmt, q){
  return canvas.toDataURL({ format:fmt||'png', quality:q||1, multiplier: px/(CW*zoomScale) });
}
function saveCurrentAsTemplate(name){
  const saved = getSaved();
  saved.unshift({
    id:'u_'+Date.now(), name, baseTpl: currentTplId, ts: Date.now(), bg: bgState, fmt: docFormat,
    json: canvas.toJSON(EXTRA_PROPS),
    thumb: snapshotPng(300, 'jpeg', 0.8),
  });
  if (saved.length > 40) saved.pop();
  try { setSaved(saved); } catch(e){ toast('Storage full — delete an old template first', 'error'); return; }
  currentTplName = name; $('tb-tplname').textContent = name;
  refreshMyTemplates(); toast('Template saved — find it under Templates → My templates', 'success');
}
function deleteSavedTemplate(id){
  setSaved(getSaved().filter(s => s.id !== id));
  refreshMyTemplates(); buildPickerGrid(currentFilter);
  toast('Template deleted');
}
function refreshMyTemplates(){
  const saved = getSaved();
  const grid = $('my-tpl-grid');
  $('my-tpl-empty').style.display = saved.length ? 'none' : '';
  grid.innerHTML = '';
  saved.forEach(s => grid.appendChild(miniTplCard(s.thumb, s.name, () => loadSavedTemplate(s), () => deleteSavedTemplate(s.id))));
  // built-ins
  const bg = $('builtin-tpl-grid');
  bg.innerHTML = '';
  ensureThumbs();
  catTemplates().forEach(t => {
    const el = miniTplCard(getThumb(t.id, 320), tplLocked(t) ? '🔒 ' + t.name : t.name, () => loadTemplate(t.id));
    if (t.id === currentTplId) el.classList.add('current');
    if (tplLocked(t)) el.classList.add('locked');
    bg.appendChild(el);
  });
}
function miniTplCard(thumb, name, onUse, onDel){
  const d = document.createElement('div');
  d.className = 'mini-tpl';
  d.innerHTML = `<img src="${thumb}" alt="${escHtml(name)}"><div class="mt-name">${escHtml(name)}</div>` + (onDel ? '<button class="mt-del" title="Delete">✕</button>' : '');
  d.onclick = e => { if (e.target.classList.contains('mt-del')) return; onUse(); };
  if (onDel) d.querySelector('.mt-del').onclick = e => { e.stopPropagation(); if (confirm('Delete "'+name+'"? This can\'t be undone.')) onDel(); };
  return d;
}

// ═══════════════ TEMPLATE PICKER ═══════════════
let currentFilter = 'all';
function openPicker(){
  ensureThumbs();
  buildCatSelect($('picker-cat'));
  buildPickerGrid(currentFilter);
  $('picker-overlay').classList.add('show');
}
function closePicker(){ $('picker-overlay').classList.remove('show'); }
function buildPickerGrid(filter){
  currentFilter = filter;
  document.querySelectorAll('#picker-filters button').forEach(b => b.classList.toggle('active', b.dataset.f === filter));
  const grid = $('picker-grid');
  grid.innerHTML = '';
  // resume draft card
  const d = jget('pgfx_draft', null);
  if (d && filter === 'all'){
    const rc = document.createElement('div');
    rc.className = 'resume-card';
    rc.innerHTML = `<img src="${d.thumb || ''}" alt=""><div><div class="rc-title">Continue where you left off</div><div class="rc-sub">${escHtml(d.name || 'Draft')} · ${new Date(d.ts).toLocaleString()}</div></div>`;
    rc.onclick = () => { closePicker(); resumeDraft(); };
    grid.appendChild(rc);
  }
  if (filter === 'mine' || filter === 'all'){
    getSaved().forEach(s => {
      const c = pickerCard(s.thumb, s.name, 'saved', () => { closePicker(); loadSavedTemplate(s); }, () => deleteSavedTemplate(s.id));
      grid.appendChild(c);
    });
    if (filter === 'mine' && !getSaved().length){
      const eh = document.createElement('div');
      eh.className = 'empty-hint'; eh.style.gridColumn = '1/-1';
      eh.innerHTML = 'No saved templates yet. Build an ad, then hit <b>💾 Save template</b> in the top bar.';
      grid.appendChild(eh);
    }
  }
  if (filter !== 'mine'){
    TEMPLATES.filter(t => filter === 'all' ? t.cat === currentCat : t.cat === filter).forEach(t => {
      const locked = tplLocked(t);
      const c = pickerCard(getThumb(t.id, 320), t.name, locked ? 'premium 🔒' : t.tag,
        () => { if (tplLocked(t)){ openPlans('“' + t.name + '” is a premium template — unlock all 8 designs with Starter or Pro.'); return; } closePicker(); loadTemplate(t.id); });
      if (locked) c.classList.add('locked');
      grid.appendChild(c);
    });
  }
}
function pickerCard(thumb, name, tag, onUse, onDel){
  const card = document.createElement('div');
  card.className = 'tpl-card' + (onDel ? ' tpl-saved-card' : '');
  card.innerHTML = `<img src="${thumb}" alt="${escHtml(name)}"><div class="tpl-veil"></div>
    <div class="tpl-use">Use →</div>
    ${onDel ? '<button class="tpl-del" title="Delete">✕</button>' : ''}
    <div class="tpl-meta"><span class="tpl-name">${escHtml(name)}</span><span class="tpl-tag">${escHtml(tag)}</span></div>`;
  card.onclick = e => { if (e.target.classList.contains('tpl-del')) return; onUse(); };
  if (onDel) card.querySelector('.tpl-del').onclick = e => { e.stopPropagation(); if (confirm('Delete "'+name+'"?')) onDel(); };
  return card;
}

// ═══════════════ EXPORT ═══════════════
let exportSize = 1440;   // requested SHORT side; plan caps clamp it in gateExport
function openExport(){
  canvas.discardActiveObject(); canvas.renderAll();
  $('export-preview').src = snapshotPng(540, 'jpeg', 0.85);
  syncFormatUI();
  $('export-overlay').classList.add('show');
}
async function doExport(){
  const gate = await gateExport(exportSize);
  if (!gate) return;
  const d = exportDims(gate.px);
  let url = snapshotPng(d.w, 'png');
  if (gate.watermark) url = await applyWatermark(url, d.w, d.h);
  try { await recordExport(); }
  catch (e){ toast('Export could not be recorded: ' + e.message, 'error'); return; }
  const a = document.createElement('a');
  a.href = url;
  a.download = (currentTplName || 'phonegfx-ad').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') + '-' + d.w + 'x' + d.h + '.png';
  document.body.appendChild(a); a.click(); a.remove();
  addHistory(a.download, gate.px, url, d.w, d.h);
  $('export-overlay').classList.remove('show');
  toast('PNG downloaded — ready to post', 'success');
}

// ═══════════════ ORDER PRINTS + POSTING (SCANS.AD handoff) ═══════════════
// Second revenue event from the same design: the finished PNG jumps straight
// into a ScanMap campaign — printed, posted around town, every scan tracked.
// Transport is a postMessage handshake between the two tabs, so both products
// stay fully standalone (separate domains, no shared backend, no CORS).
let _handoff = null;
function scanmapOrigin(){
  try { return new URL(scanmapUrl()).origin; } catch (e){ return ''; }
}
window.addEventListener('message', e => {
  if (!_handoff || !_handoff.win || e.source !== _handoff.win) return;
  if (!scanmapOrigin() || e.origin !== scanmapOrigin()) return;
  const t = e.data && e.data.type;
  if (t === 'scansad:ready'){
    // post the artwork but keep the fallback timer armed until ScanMap CONFIRMS
    // storage — a silent drop (size cap, validation) must not lose the file
    e.source.postMessage({ type:'buybackad:artwork', png: _handoff.png, meta: _handoff.meta }, e.origin);
  } else if (t === 'scansad:artwork-received'){
    clearTimeout(_handoff.timer);
    _handoff = null;
    toast('Artwork sent to SCANS.AD — finish your campaign in the new tab', 'success');
  } else if (t === 'scansad:artwork-rejected'){
    clearTimeout(_handoff.timer);
    const h = _handoff; _handoff = null;
    h.download();
    toast('SCANS.AD could not accept the artwork (' + (e.data.reason || 'rejected') + ') — downloaded instead, upload it at the flyer step', 'error');
  }
});
async function orderPrints(fromEz){
  if (!partnerEnabled()){ toast('Printing + posting is not available on this account', 'error'); return; }
  const gate = await gateExport(fromEz ? ezExportPx() : exportSize);
  if (!gate) return;
  let png, w, h, name;
  if (fromEz){
    w = h = gate.px; name = ezTpl().name;
    png = renderEzCanvas(gate.px, 'png');
  } else {
    const d = exportDims(gate.px); w = d.w; h = d.h; name = currentTplName || 'My ad';
    png = snapshotPng(d.w, 'png');
  }
  if (gate.watermark) png = await applyWatermark(png, w, h);
  try { await recordExport(); }
  catch (e){ toast('Export could not be recorded: ' + e.message, 'error'); return; }
  const fname = name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') + '-' + w + 'x' + h + '.png';
  addHistory(fname, gate.px, png, w, h);
  const qr = (!fromEz && canvas) ? canvas.getObjects().find(o => o.pgRole === 'qr') : null;
  // the design's own QR target is usually the campaign's destination URL —
  // but never forward SCANS.AD tracking links (scan loop) or tel:/sms: schemes.
  // The SAME filtered value goes into the URL param AND the postMessage meta.
  const dest = (qr && qr.pgQrData && /^https?:\/\//i.test(qr.pgQrData) && !/functions\/v1\/scan/.test(qr.pgQrData)) ? qr.pgQrData : '';
  const params = new URLSearchParams({ partner:'buybackad', name: name, fmt: fromEz ? 'square' : docFormat, w: String(w), h: String(h) });
  if (qr) params.set('qrpos', qrCorner(qr));
  if (dest) params.set('dest', dest);
  const dl = () => {
    const a = document.createElement('a');
    a.href = png; a.download = fname;
    document.body.appendChild(a); a.click(); a.remove();
  };
  if (png.length > 64000000){   // beyond ScanMap's intake cap — don't pretend the handshake will work
    dl();
    window.open(scanmapUrl() + '/login.html?' + params.toString() + '#partner', '_blank');
    toast('Artwork is too large to hand over automatically — downloaded instead, upload it at the flyer step');
    return;
  }
  const win = window.open(scanmapUrl() + '/login.html?' + params.toString() + '#partner', '_blank');
  if (!win){
    dl();
    toast('Popup blocked — artwork downloaded instead. Open ' + scanmapUrl() + ' and attach it to your campaign.', 'error');
    return;
  }
  if (_handoff) clearTimeout(_handoff.timer);
  _handoff = { win, png, download: dl, meta: { name, fmt: fromEz ? 'square' : docFormat, w, h,
    qrpos: qr ? qrCorner(qr) : '', dest } };
  // no hello or no storage confirmation → put the file in their hands anyway
  _handoff.timer = setTimeout(() => {
    if (!_handoff) return;
    _handoff = null;
    dl();
    toast('Artwork downloaded — upload it when SCANS.AD asks for your flyer design');
  }, 10000);
  $('export-overlay').classList.remove('show');
}
function qrCorner(o){
  const c = o.getCenterPoint();
  return (c.y < CH / 2 ? 'top' : 'bottom') + '-' + (c.x < CW / 2 ? 'left' : 'right');
}

// ═══════════════ TUTORIAL ═══════════════
const TUT_STEPS = [
  { sel:'#canvas-holder',   pos:'right',  title:'This is your ad', body:'Click any text to select it, double-click to type directly on the canvas. Drag near the middle and it snaps to center automatically.' },
  { sel:'#quick-fields-sec', pos:'right', title:'Quick edit fields', body:'The fastest way to work: every text block in the template shows up here. Retype your phone number or headline and the canvas updates live.' },
  { sel:'#badge-chips',     pos:'right',  title:'Selling points', body:'One tap adds trust badges like QUICK, SAFE or SAME DAY to the yellow strip. Keep it to 3–4 for maximum punch.' },
  { sel:'#enhance-btn',     pos:'bottom', title:'✦ Enhance', body:'Made a mess of fonts or colors? Enhance snaps every layer back to the template\'s pro styling and tidies up your spelling and capitalization — your words stay yours.' },
  { sel:'#panel-right',     pos:'left',   title:'Fine-tune everything', body:'Properties for colors, outlines and glow — plus a Layers tab to reorder, hide or lock elements.' },
  { sel:'#export-btn',      pos:'bottom', title:'Export & post', body:'Downloads a crisp PNG in your chosen format — square for Marketplace & Instagram, story, or a print-ready 8.5×11 flyer. That\'s the whole workflow.' },
];
let tutIdx = 0;
function maybeStartTutorial(){
  if (firstLoadDone) return;
  firstLoadDone = true;
  if (jget('pgfx_tut_done', false)) return;
  setTimeout(() => startTutorial(), 450);
}
function tutEsc(e){ if (e.key === 'Escape') endTutorial(); }
function startTutorial(){
  try {
    // make sure targets are visible
    $('panel-left').classList.remove('collapsed');
    $('panel-right').classList.remove('collapsed');
    switchLTab('quick');
    tutIdx = 0;
    // bind controls here too — the tour must control itself even if other wiring failed
    $('tut-next').onclick = () => { tutIdx++; if (tutIdx >= TUT_STEPS.length) endTutorial(); else renderTutStep(); };
    $('tut-back').onclick = () => { if (tutIdx > 0){ tutIdx--; renderTutStep(); } };
    $('tut-skip').onclick = endTutorial;
    document.addEventListener('keydown', tutEsc);
    $('tut-overlay').classList.add('active');
    renderTutStep();
  } catch (err){
    console.error('Tutorial failed to start:', err);
    endTutorial();
  }
}
function endTutorial(){
  $('tut-overlay').classList.remove('active');
  document.removeEventListener('keydown', tutEsc);
  jset('pgfx_tut_done', true);
}
function renderTutStep(){
  try { renderTutStepInner(); }
  catch (err){ console.error('Tutorial step error — ending tour:', err); endTutorial(); }
}
function renderTutStepInner(){
  const st = TUT_STEPS[tutIdx];
  const el = document.querySelector(st.sel);
  if (!el){ tutIdx++; if (tutIdx >= TUT_STEPS.length) return endTutorial(); return renderTutStep(); }
  const r = el.getBoundingClientRect();
  const pad = 8;
  const spot = $('tut-spot');
  spot.style.left = (r.left - pad) + 'px';
  spot.style.top = (r.top - pad) + 'px';
  spot.style.width = (r.width + pad*2) + 'px';
  spot.style.height = (r.height + pad*2) + 'px';
  const b = $('tut-bubble');
  $('tut-stepnum').textContent = 'Step ' + (tutIdx+1) + ' of ' + TUT_STEPS.length;
  $('tut-title').textContent = st.title;
  $('tut-body').textContent = st.body;
  $('tut-dots').innerHTML = TUT_STEPS.map((_,i) => `<span class="${i===tutIdx?'on':''}"></span>`).join('');
  $('tut-back').style.visibility = tutIdx === 0 ? 'hidden' : 'visible';
  $('tut-next').textContent = tutIdx === TUT_STEPS.length-1 ? 'Finish' : 'Next';
  // position bubble
  const bw = 308, bh = b.offsetHeight || 220, gap = 16;
  let x, y;
  if (st.pos === 'right'){ x = r.right + gap; y = r.top; }
  else if (st.pos === 'left'){ x = r.left - bw - gap; y = r.top; }
  else if (st.pos === 'bottom'){ x = r.left + r.width/2 - bw/2; y = r.bottom + gap; }
  else { x = r.left + r.width/2 - bw/2; y = r.top - bh - gap; }
  x = Math.max(12, Math.min(x, window.innerWidth - bw - 12));
  y = Math.max(12, Math.min(y, window.innerHeight - bh - 12));
  b.style.left = x + 'px';
  b.style.top = y + 'px';
}

// ═══════════════ PANEL TABS & DRAWERS ═══════════════
function switchLTab(name){
  document.querySelectorAll('[data-ltab]').forEach(b => b.classList.toggle('active', b.dataset.ltab === name));
  document.querySelectorAll('#panel-left .panel-tabview').forEach(v => v.classList.remove('active'));
  $('ltab-' + name).classList.add('active');
  if (name === 'templates') refreshMyTemplates();
}
function switchRTab(name){
  document.querySelectorAll('[data-rtab]').forEach(b => b.classList.toggle('active', b.dataset.rtab === name));
  document.querySelectorAll('#panel-right .panel-tabview').forEach(v => v.classList.remove('active'));
  $('rtab-' + name).classList.add('active');
  if (name === 'layers') refreshLayers();
}



// ═══════════════ VIEW SETTINGS (grid / snapping) ═══════════════
const GRID_SIZES = [10, 20, 40, 60];
let viewCfg = Object.assign({ grid:false, gridSnap:false, centerSnap:true, gridSize:20 }, jget('pgfx_view', {}));
function saveViewCfg(){ jset('pgfx_view', viewCfg); }
function syncViewMenu(){
  $('vi-grid').classList.toggle('on', !!viewCfg.grid);
  $('vi-gridsnap').classList.toggle('on', !!viewCfg.gridSnap);
  $('vi-centersnap').classList.toggle('on', !!viewCfg.centerSnap);
  $('vi-gridsize-val').textContent = viewCfg.gridSize + 'px';
  syncGridOverlay();
}
function bindViewMenu(){
  $('view-btn').onclick = e => { e.stopPropagation(); $('view-drop').classList.toggle('open'); };
  document.addEventListener('click', e => { if (!e.target.closest('.view-menu')) $('view-drop').classList.remove('open'); });
  $('vi-grid').onclick = () => { viewCfg.grid = !viewCfg.grid; saveViewCfg(); syncViewMenu(); };
  $('vi-gridsnap').onclick = () => { viewCfg.gridSnap = !viewCfg.gridSnap; if (viewCfg.gridSnap && !viewCfg.grid){ viewCfg.grid = true; } saveViewCfg(); syncViewMenu(); };
  $('vi-centersnap').onclick = () => { viewCfg.centerSnap = !viewCfg.centerSnap; saveViewCfg(); syncViewMenu(); };
  $('vi-gridsize').onclick = () => {
    const i = GRID_SIZES.indexOf(viewCfg.gridSize);
    viewCfg.gridSize = GRID_SIZES[(i + 1) % GRID_SIZES.length];
    saveViewCfg(); syncViewMenu();
  };
  syncViewMenu();
}

// ═══════════════ GRADIENT FILLS ═══════════════
function objGrad(spec){
  const rad = (spec.a || 0) * Math.PI / 180;
  const vx = Math.sin(rad) * 0.5, vy = -Math.cos(rad) * 0.5;
  return new fabric.Gradient({
    type:'linear', gradientUnits:'percentage',
    coords:{ x1:0.5 - vx, y1:0.5 - vy, x2:0.5 + vx, y2:0.5 + vy },
    colorStops:[ {offset:0, color:spec.c1}, {offset:1, color:spec.c2} ]
  });
}
function setObjGradient(o, spec){
  o.pgFillGrad = spec;
  o.set('fill', objGrad(spec));
}
function clearObjGradient(o, solid){
  o.pgFillGrad = null;
  o.set('fill', solid);
}

// ═══════════════ CURVED TEXT ═══════════════
const CURVE_STYLE_KEYS = ['fontFamily','fontSize','fill','stroke','strokeWidth','fontWeight','charSpacing','fontStyle','backgroundColor'];
let _measureCtx = null;
function measureChars(chars, style){
  const fs = style.fontSize || 60;
  try {
    if (!_measureCtx) _measureCtx = document.createElement('canvas').getContext('2d');
    _measureCtx.font = (style.fontStyle === 'italic' ? 'italic ' : '') + (style.fontWeight || '400') + ' ' + fs + 'px "' + (style.fontFamily || 'Bebas Neue') + '"';
    return chars.map(ch => {
      const w = _measureCtx.measureText(ch).width;
      return (w && isFinite(w)) ? w : fs * 0.55;
    });
  } catch (e){
    return chars.map(() => fs * 0.55); // headless fallback
  }
}
function buildCurvedGroup(text, curve, style, meta){
  // Real glyph widths laid cumulatively along the arc — the arc length under
  // each character equals its natural advance, so letter spacing stays true.
  const chars = [...String(text).replace(/\n/g,' ')];
  if (!chars.length) chars.push(' ');
  const fs = style.fontSize || 60;
  const widths = measureChars(chars, style);
  const gap = (style.charSpacing || 0) / 1000 * fs;
  const total = widths.reduce((a, b) => a + b, 0) + gap * Math.max(0, chars.length - 1);
  const sweep = Math.abs(curve) / 100 * Math.PI * 1.15;
  const R = Math.max(total / Math.max(sweep, 0.001), fs);
  const up = curve > 0;
  let run = 0;
  const items = chars.map((ch, i) => {
    const centerArc = run + widths[i] / 2;      // arc-length position of this glyph's center
    run += widths[i] + gap;
    const ang = (centerArc - total / 2) / R;    // arc length → angle
    const x = Math.sin(ang) * R;
    const y = (1 - Math.cos(ang)) * R * (up ? 1 : -1);
    return new fabric.Text(ch, Object.assign({}, style, {
      shadow: style.shadow ? new fabric.Shadow(style.shadow) : null,
      left:x, top:y, originX:'center', originY:'center',
      angle: ang * 180 / Math.PI * (up ? 1 : -1),
      paintFirst:'stroke',
    }));
  });
  const grp = new fabric.Group(items, Object.assign({ originX:'center', originY:'center' }, meta.pos || {}));
  grp.set({ name:meta.name, pgRole:meta.pgRole || '', pgCasing:meta.pgCasing || 'none', pgTplId:meta.pgTplId || null });
  grp.pgCurved = { text:String(text), curve, style: Object.assign({}, style, { shadow: style.shadow || null }) };
  return grp;
}
function textToCurved(o, curve){
  const style = {};
  CURVE_STYLE_KEYS.forEach(k => { if (o[k] !== undefined) style[k] = o[k]; });
  if (o.shadow) style.shadow = { color:o.shadow.color, blur:o.shadow.blur, offsetX:o.shadow.offsetX, offsetY:o.shadow.offsetY };
  const c = o.getCenterPoint();
  const grp = buildCurvedGroup(o.text, curve, style, {
    name:o.name, pgRole:o.pgRole, pgCasing:o.pgCasing, pgTplId:o.pgTplId,
    pos:{ left:c.x, top:c.y, angle:o.angle || 0, scaleX:o.scaleX || 1, scaleY:o.scaleY || 1 }
  });
  canvas.remove(o);
  canvas.add(grp);
  canvas.setActiveObject(grp);
  return grp;
}
function curvedToText(grp){
  const d = grp.pgCurved;
  const c = grp.getCenterPoint();
  const o = new fabric.IText(d.text, Object.assign({}, d.style, {
    shadow: d.style.shadow ? new fabric.Shadow(d.style.shadow) : null,
    left:c.x, top:c.y, originX:'center', originY:'center',
    angle:grp.angle || 0, scaleX:grp.scaleX || 1, scaleY:grp.scaleY || 1,
    paintFirst:'stroke', name:grp.name, pgRole:grp.pgRole, pgCasing:grp.pgCasing, pgTplId:grp.pgTplId,
  }));
  canvas.remove(grp);
  canvas.add(o);
  canvas.setActiveObject(o);
  return o;
}
function rebuildCurved(grp, patch){
  const d = grp.pgCurved;
  if (patch.text !== undefined) d.text = patch.text;
  if (patch.curve !== undefined) d.curve = patch.curve;
  if (patch.style) Object.assign(d.style, patch.style);
  if (d.curve === 0) return curvedToText(grp);
  const c = grp.getCenterPoint();
  const ng = buildCurvedGroup(d.text, d.curve, d.style, {
    name:grp.name, pgRole:grp.pgRole, pgCasing:grp.pgCasing, pgTplId:grp.pgTplId,
    pos:{ left:c.x, top:c.y, angle:grp.angle || 0, scaleX:grp.scaleX || 1, scaleY:grp.scaleY || 1 }
  });
  const idx = canvas.getObjects().indexOf(grp);
  canvas.remove(grp);
  canvas.add(ng);
  if (idx >= 0) ng.moveTo(idx);
  canvas.setActiveObject(ng);
  return ng;
}

// ═══════════════ BACKGROUND LIBRARY (IndexedDB + built-ins) ═══════════════
let _idb = null, _memBgs = [];
function idbOpen(){
  return new Promise(res => {
    if (_idb) return res(_idb);
    if (!window.indexedDB) return res(null);
    const rq = indexedDB.open('pgfx', 1);
    rq.onupgradeneeded = () => rq.result.createObjectStore('bgs', { keyPath:'id' });
    rq.onsuccess = () => { _idb = rq.result; res(_idb); };
    rq.onerror = () => res(null);
  });
}
async function bgList(){
  const db = await idbOpen();
  if (!db) return _memBgs.slice();
  return new Promise(res => {
    const rq = db.transaction('bgs').objectStore('bgs').getAll();
    rq.onsuccess = () => res(rq.result || []);
    rq.onerror = () => res([]);
  });
}
async function bgPut(rec){
  const db = await idbOpen();
  if (!db){ _memBgs.push(rec); return; }
  return new Promise(res => {
    const tx = db.transaction('bgs', 'readwrite');
    tx.objectStore('bgs').put(rec);
    tx.oncomplete = res; tx.onerror = res;
  });
}
async function bgDel(id){
  const db = await idbOpen();
  if (!db){ _memBgs = _memBgs.filter(b => b.id !== id); return; }
  return new Promise(res => {
    const tx = db.transaction('bgs', 'readwrite');
    tx.objectStore('bgs').delete(id);
    tx.oncomplete = res; tx.onerror = res;
  });
}

// deterministic procedural backgrounds — always available, zero assets
function seededRand(seed){ let x = seed; return () => (x = (x * 1103515245 + 12345) % 2147483648) / 2147483648; }
const PROC_BGS = [
  { id:'p-beams-red',   name:'Red beams',     kind:'beams',  c:['#b01030','#7b2d9e'] },
  { id:'p-beams-gold',  name:'Gold beams',    kind:'beams',  c:['#f5b700','#ff5000'] },
  { id:'p-bokeh-dark',  name:'Dark bokeh',    kind:'bokeh',  c:['#0d0d12','#2563eb'] },
  { id:'p-bokeh-green', name:'Money bokeh',   kind:'bokeh',  c:['#07130d','#22c55e'] },
  { id:'p-spot-black',  name:'Studio black',  kind:'spot',   c:['#1c1c22','#050507'] },
  { id:'p-spot-navy',   name:'Studio navy',   kind:'spot',   c:['#20304f','#070b14'] },
  { id:'p-diag-orange', name:'Orange energy', kind:'diag',   c:['#ff5000','#c81d25'] },
  { id:'p-diag-purple', name:'Purple pulse',  kind:'diag',   c:['#7b2d9e','#2e1065'] },
  { id:'p-grid-tech',   name:'Tech grid',     kind:'grid',   c:['#0a0f1e','#1e3a8a'] },
  { id:'p-noise-slate', name:'Slate texture', kind:'noise',  c:['#26262e','#101015'] },
];
function drawProcBg(spec, px){
  const cv = document.createElement('canvas');
  cv.width = px; cv.height = px;
  const x = cv.getContext('2d');
  const rnd = seededRand(spec.id.split('').reduce((a,ch) => a + ch.charCodeAt(0), 7));
  const [c1, c2] = spec.c;
  const lg = x.createLinearGradient(0, 0, px, px);
  lg.addColorStop(0, c1); lg.addColorStop(1, c2);
  if (spec.kind === 'spot'){
    const rg = x.createRadialGradient(px/2, px*0.38, px*0.05, px/2, px/2, px*0.85);
    rg.addColorStop(0, c1); rg.addColorStop(1, c2);
    x.fillStyle = rg; x.fillRect(0, 0, px, px);
  } else { x.fillStyle = lg; x.fillRect(0, 0, px, px); }
  if (spec.kind === 'beams'){
    x.globalAlpha = 0.14;
    for (let i = 0; i < 7; i++){
      x.save(); x.translate(px/2, px/2); x.rotate(rnd() * Math.PI * 2);
      x.fillStyle = '#ffffff';
      x.fillRect(-px, -px * (0.02 + rnd() * 0.05), px * 2, px * (0.05 + rnd() * 0.09));
      x.restore();
    }
    x.globalAlpha = 1;
  }
  if (spec.kind === 'bokeh'){
    for (let i = 0; i < 26; i++){
      const r = px * (0.02 + rnd() * 0.09);
      x.globalAlpha = 0.05 + rnd() * 0.16;
      x.fillStyle = '#ffffff';
      x.beginPath(); x.arc(rnd() * px, rnd() * px, r, 0, Math.PI * 2); x.fill();
    }
    x.globalAlpha = 1;
  }
  if (spec.kind === 'diag'){
    x.globalAlpha = 0.10;
    x.fillStyle = '#ffffff';
    for (let i = -6; i < 14; i++){
      x.save(); x.translate(i * px * 0.16, 0); x.rotate(-0.5);
      x.fillRect(0, -px, px * 0.05, px * 3);
      x.restore();
    }
    x.globalAlpha = 1;
  }
  if (spec.kind === 'grid'){
    x.strokeStyle = 'rgba(120,160,255,0.16)'; x.lineWidth = Math.max(1, px / 540);
    const step = px / 14;
    for (let i = 0; i <= 14; i++){
      x.beginPath(); x.moveTo(i * step, 0); x.lineTo(i * step, px); x.stroke();
      x.beginPath(); x.moveTo(0, i * step); x.lineTo(px, i * step); x.stroke();
    }
    const rg = x.createRadialGradient(px/2, px/2, px*0.1, px/2, px/2, px*0.8);
    rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,0.55)');
    x.fillStyle = rg; x.fillRect(0, 0, px, px);
  }
  if (spec.kind === 'noise'){
    for (let i = 0; i < 2600; i++){
      x.globalAlpha = rnd() * 0.05;
      x.fillStyle = rnd() > 0.5 ? '#ffffff' : '#000000';
      x.fillRect(rnd() * px, rnd() * px, 2, 2);
    }
    x.globalAlpha = 1;
  }
  // subtle vignette on all for text pop
  const vg = x.createRadialGradient(px/2, px/2, px*0.35, px/2, px/2, px*0.95);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.38)');
  x.fillStyle = vg; x.fillRect(0, 0, px, px);
  return cv.toDataURL('image/jpeg', 0.88);
}

function setBgFromDataUrl(url, silentHist, blur){
  fabric.Image.fromURL(url, img => {
    if (!img || !img.width || !img.height){ toast('That image could not be read', 'error'); return; }
    if (blur > 0){
      try { img.filters = [new fabric.Image.filters.Blur({ blur: blur / 60 })]; img.applyFilters(); }
      catch (e){ console.warn('blur unsupported:', e); }
    }
    const sc = Math.max(CW / img.width, CH / img.height);
    img.set({ originX:'left', originY:'top', left:(CW - img.width * sc) / 2, top:(CH - img.height * sc) / 2, scaleX:sc, scaleY:sc });
    canvas.setBackgroundImage(img, () => { canvas.renderAll(); if (!silentHist) pushHist(); });
  });
}

async function refreshBgLibrary(){
  const grid = $('bg-lib-grid');
  grid.innerHTML = '';
  const saved = (await bgList()).filter(r => (r.kind || 'library') === 'library');
  saved.sort((a, b) => b.ts - a.ts).forEach(rec => grid.appendChild(bgLibItem(rec.thumb || rec.data, rec.name || 'Saved', () => { setBgFromDataUrl(rec.data); toast('Background applied'); }, async () => { await bgDel(rec.id); refreshBgLibrary(); })));
  PROC_BGS.forEach(spec => {
    grid.appendChild(bgLibItem(drawProcBg(spec, 200), spec.name, () => { setBgFromDataUrl(drawProcBg(spec, 1080)); toast('Background applied'); }, null, 'Built-in'));
  });
}
function bgLibItem(thumb, name, onUse, onDel, badge){
  const b = document.createElement('button');
  b.className = 'bg-lib-item'; b.title = name;
  b.innerHTML = `<img src="${thumb}" alt="${escHtml(name)}">` +
    (onDel ? '<span class="bg-lib-del" role="button" title="Delete">✕</span>' : '') +
    (badge ? `<span class="bg-lib-badge">${badge}</span>` : '');
  b.onclick = e => { if (e.target.classList.contains('bg-lib-del')){ e.stopPropagation(); if (confirm('Delete this background?')) onDel(); return; } onUse(); };
  return b;
}
function downscaleDataUrl(url, maxPx){
  return new Promise(res => {
    const im = new Image();
    im.onload = () => {
      const sc = Math.min(1, maxPx / Math.max(im.width, im.height));
      const cv = document.createElement('canvas');
      cv.width = Math.round(im.width * sc); cv.height = Math.round(im.height * sc);
      cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
      res(cv.toDataURL('image/jpeg', 0.87));
    };
    im.onerror = () => res(url);
    im.src = url;
  });
}








// ═══════════════ TEMPLATE PHOTO BACKGROUNDS ═══════════════
const TPL_BG_ELS = {};   // raw <img> elements — shared safely, never owned by any canvas
let _tplBgReport = { loaded: 0, missing: [] };
function freshBgImage(src){
  // Every render gets its OWN fabric.Image wrapper. Sharing one instance across
  // canvases was the photo-killer: canvas.dispose() gutted the shared object, so
  // the first render worked and every later one silently painted nothing.
  const el = TPL_BG_ELS[src];
  if (!el || !el.width) return null;
  try { return new fabric.Image(el); } catch (e){ return null; }
}
function preloadTplBgs(){
  const photoTpls = TEMPLATES.filter(t => t.bg && t.bg.type === 'image' && t.bg.src);
  const embedded = window.TPL_BG_DATA || {};
  const jobs = photoTpls.map(t => new Promise(res => {
    const finish = el => {
      if (el && el.width > 0){
        TPL_BG_ELS[t.bg.src] = el;
        _tplBgReport.loaded++;
        refreshPhotoThumb(t.id);      // self-heal: upgrade previews the moment the photo decodes
      } else _tplBgReport.missing.push(t.bg.src);
      res();
    };
    const el = new Image();
    el.onload = () => finish(el);
    el.onerror = () => {
      if (embedded[t.bg.src] && el.src !== embedded[t.bg.src]){ el.src = embedded[t.bg.src]; } // asset file failed → embedded copy
      else finish(null);
    };
    // embedded data first (cannot 404, works on file://); asset file is the backup
    el.src = embedded[t.bg.src] || t.bg.src;
  }));
  return Promise.all(jobs).then(() => {
    if (_tplBgReport.missing.length){
      console.error('GraphicsStudio: ' + _tplBgReport.missing.length + ' template photo(s) unavailable:', _tplBgReport.missing);
    } else {
      console.log('GraphicsStudio: all ' + _tplBgReport.loaded + ' template background photos ready (embedded).');
    }
  });
}
let _thumbRefreshQueued = false;
function refreshPhotoThumb(tplId){
  delete THUMBS[tplId];
  if (_thumbRefreshQueued) return;
  _thumbRefreshQueued = true;
  setTimeout(() => {                 // batch: one repaint even if all 8 land together
    _thumbRefreshQueued = false;

    if (!$('page-landing').classList.contains('hidden')) buildLanding();
    buildEzStrip();   // strip thumbs must never stay stale — cheap, cache-backed
    if (typeof refreshMyTemplates === 'function' && $('page-editor').classList.contains('active')) refreshMyTemplates();
  }, 120);
}
function scrimRect(alpha, w, h){
  w = w || CW; h = h || CH;
  return new fabric.Rect({ left:0, top:0, width:w, height:h, fill:'rgba(0,0,0,' + alpha + ')', selectable:false, evented:false, name:'Scrim' });
}
function coverImage(im, w, h){
  w = w || CW; h = h || CH;
  const c = Math.max(w / im.width, h / im.height);
  im.set({ originX:'left', originY:'top', left:(w - im.width * c) / 2, top:(h - im.height * c) / 2, scaleX:c, scaleY:c });
  return im;
}

// ═══════════════ SUGGESTED COLOR THEMES (complementary color theory) ═══════════════
// Each pairs opposite-wheel hues: high-contrast complements are the most
// click-pulling combination for feed ads. bg = scene, accent = the pop color,
// ink = body text on that bg.
const COLOR_THEMES = [
  { name:'Navy × Orange',    bg:{type:'grad', c1:'#132a63', c2:'#0a1533', a:165}, accent:'#ff7a1a', ink:'#ffffff' },
  { name:'Teal × Coral',     bg:{type:'grad', c1:'#0c5f5b', c2:'#043a37', a:160}, accent:'#ff6f61', ink:'#ffffff' },
  { name:'Purple × Gold',    bg:{type:'grad', c1:'#4b1d95', c2:'#22093f', a:160}, accent:'#ffd200', ink:'#ffffff' },
  { name:'Forest × Amber',   bg:{type:'grad', c1:'#14532d', c2:'#052012', a:170}, accent:'#fbbf24', ink:'#ffffff' },
  { name:'Crimson × Mint',   bg:{type:'grad', c1:'#9f1239', c2:'#3b0716', a:160}, accent:'#6ee7b7', ink:'#ffffff' },
  { name:'Black × Electric', bg:{type:'grad', c1:'#101018', c2:'#000000', a:180}, accent:'#38bdf8', ink:'#ffffff' },
  { name:'Charcoal × Lime',  bg:{type:'grad', c1:'#26262e', c2:'#101015', a:180}, accent:'#a3e635', ink:'#ffffff' },
  { name:'Royal × Tangerine',bg:{type:'grad', c1:'#1e3a8a', c2:'#0b1540', a:160}, accent:'#fb923c', ink:'#ffffff' },
  { name:'Espresso × Cream', bg:{type:'grad', c1:'#3f2d20', c2:'#1a110a', a:170}, accent:'#f5e6c8', ink:'#ffffff' },
  { name:'Midnight × Pink',  bg:{type:'grad', c1:'#1e1b4b', c2:'#0a0920', a:165}, accent:'#f472b6', ink:'#ffffff' },
];
function applyColorTheme(th){
  ez.bg = { type:'grad', c1: th.bg.c1, c2: th.bg.c2, a: th.bg.a };
  ez.bgRecId = null;
  const tpl = ezTpl();
  const heads = tpl.layers.filter(l => l.role === 'headline');
  heads.forEach((l, i) => ezSetStyle(l.name, { fill: i === heads.length - 1 ? th.accent : th.ink }));
  tpl.layers.filter(l => l.role === 'cta').forEach(l => ezSetStyle(l.name, { fill: th.accent }));
  tpl.layers.filter(l => l.role === 'sub').forEach(l => ezSetStyle(l.name, { fill: th.ink }));
  syncEzSwatches();
  refreshEzRecents();
  refreshEzLayers();
  schedEzPreview(0);
  toast(th.name + ' applied — complementary contrast', 'success');
}
function buildThemeRow(){
  const row = $('ez-themes');
  if (!row || row.dataset.built) return;
  row.dataset.built = '1';
  COLOR_THEMES.forEach(th => {
    const b = document.createElement('button');
    b.className = 'ez-theme';
    b.title = th.name;
    b.innerHTML = `<span style="background:linear-gradient(135deg, ${th.bg.c1}, ${th.bg.c2})"></span><span style="background:${th.accent}"></span>`;
    b.onclick = () => applyColorTheme(th);
    row.appendChild(b);
  });
}

// ═══════════════ FONT LIBRARY (lazy-loaded from Google Fonts on first use) ═══════════════
const FONT_GROUPS = [
  ['In your templates', ['Bebas Neue','Anton','Archivo Black','Bangers','Permanent Marker','Oswald','Montserrat','Barlow Condensed','DM Sans','Instrument Sans']],
  ['Display & impact', ['Alfa Slab One','Abril Fatface','Bakbak One','Big Shoulders Display','Black Ops One','Bowlby One SC','Bungee','Bungee Shade','Chango','Concert One','Days One','Fjalla One','Francois One','Fugaz One','Graduate','Hammersmith One','Lilita One','Luckiest Guy','Monoton','Passion One','Patua One','Paytone One','Press Start 2P','Racing Sans One','Righteous','Rowdies','Rubik Mono One','Russo One','Secular One','Shrikhand','Sigmar One','Squada One','Staatliches','Titan One','Ultra','Unbounded','Vast Shadow']],
  ['Script & fun', ['Creepster','Fredoka','Gloria Hallelujah','Great Vibes','Knewave','Lobster','Pacifico','Special Elite','Yellowtail']],
  ['Clean & modern', ['Changa','Exo 2','Inter','Josefin Sans','Kanit','Lato','League Spartan','Nunito','Plus Jakarta Sans','Poppins','Prompt','Raleway','Roboto Condensed','Rubik','Saira Condensed','Teko']],
  ['Serif', ['Cinzel','Cormorant Garamond','DM Serif Display','Merriweather','Playfair Display','Zilla Slab']],
  ['System', ['Georgia','Impact','Arial Black']],
];
const CORE_FONTS = new Set(FONT_GROUPS[0][1].concat(FONT_GROUPS[5][1]));
const _fontLoaded = new Set(CORE_FONTS);
function ensureFont(name){
  if (_fontLoaded.has(name)) return Promise.resolve();
  _fontLoaded.add(name);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(name).replace(/%20/g, '+') + '&display=swap';
  document.head.appendChild(link);
  const load = document.fonts && document.fonts.load
    ? document.fonts.load('400 24px "' + name + '"').catch(() => {})
    : Promise.resolve();
  return Promise.race([load, new Promise(res => setTimeout(res, 4000))]);
}
function buildFontOptions(sel){
  if (!sel || sel.dataset.fontsBuilt) return;
  sel.dataset.fontsBuilt = '1';
  sel.innerHTML = FONT_GROUPS.map(([g, fonts]) =>
    '<optgroup label="' + g + '">' + fonts.map(f => '<option>' + f + '</option>').join('') + '</optgroup>').join('');
}

// ═══════════════ PER-FIELD QUICK STYLING ═══════════════
function ezStyleOf(layerName){ return (ez.styles[ez.tpl] || {})[layerName] || null; }
function ezSetStyle(layerName, patch){
  const t = (ez.styles[ez.tpl] = ez.styles[ez.tpl] || {});
  t[layerName] = Object.assign(t[layerName] || {}, patch);
}
function ezClearStyle(layerName){
  if (ez.styles[ez.tpl]) delete ez.styles[ez.tpl][layerName];
}
// build the fabric prop set from a stored override + the layer's base props
function ezStyleProps(st, base){
  const p = {};
  if (st.font) p.fontFamily = st.font;
  if (st.sizeMul) p.fontSize = Math.round((base.fontSize || 60) * st.sizeMul / 100);
  if (st.bold !== undefined) p.fontWeight = st.bold ? '800' : (base.fontWeight || '400');
  if (st.italic !== undefined) p.fontStyle = st.italic ? 'italic' : 'normal';
  if (st.underline !== undefined) p.underline = !!st.underline;
  if (st.fill) p.fill = st.fill;
  if (st.stroke !== undefined || st.sw !== undefined){
    p.stroke = st.stroke || base.stroke || '#000000';
    p.strokeWidth = st.sw !== undefined ? st.sw : (base.strokeWidth || 0);
    p.paintFirst = 'stroke';
  }
  if (st.glow !== undefined){
    p.shadow = st.glow > 0 ? new fabric.Shadow({ color: st.glowC || '#ff5000', blur: st.glow, offsetX:0, offsetY:0 })
                           : (base.shadow ? new fabric.Shadow(base.shadow) : null);
  }
  if (st.bgOn === true){ p.backgroundColor = st.bgc || '#ffd200'; p.padding = base.padding || 6; }
  else if (st.bgOn === false){ p.backgroundColor = ''; }
  return p;
}
// apply override to a freshly built object; returns the object to add (curved → group)
function ezApplyStyle(o, l, tplId){
  const st = ezStyleOf(l.name);
  if (!st) return o;
  o.set(ezStyleProps(st, l.props || {}));
  if (st.curve){
    const style = {};
    CURVE_STYLE_KEYS.forEach(k => { if (o[k] !== undefined) style[k] = o[k]; });
    if (o.shadow) style.shadow = { color:o.shadow.color, blur:o.shadow.blur, offsetX:o.shadow.offsetX, offsetY:o.shadow.offsetY };
    const c = o.getCenterPoint();
    return buildCurvedGroup(o.text, st.curve, style, {
      name:l.name, pgRole:l.role || '', pgCasing:l.casing || 'none', pgTplId:tplId,
      pos:{ left:c.x, top:c.y, angle:o.angle || 0 },
    });
  }
  return o;
}

// popover
let tpTarget = null; // { layerName, base }
function openTxtPop(anchor, layerName){
  const tpl = ezTpl();
  let l = tpl.layers.find(x => x.name === layerName);
  if (!l && layerName === 'Badges'){
    l = tpl.layers.find(x => x.role === 'badges') ||
        { name:'Badges', props:{ fontFamily:F_COND, fontSize:32, fill:'#000000', fontWeight:'900', backgroundColor:'#ffd200', padding:6 } };
  }
  if (!l){ toast('This template has no ' + layerName.toLowerCase() + ' line', 'error'); return; }
  tpTarget = { layerName: l.name || layerName, base: l.props || {} };
  const st = ezStyleOf(layerName) || {};
  $('tp-layer').textContent = 'Style: ' + layerName;
  $('tp-font').value = st.font || tpTarget.base.fontFamily || 'Bebas Neue';
  $('tp-size').value = st.sizeMul || 100; $('tp-size-val').textContent = (st.sizeMul || 100) + '%';
  const baseBold = parseInt(tpTarget.base.fontWeight || 400, 10) >= 700;
  $('tp-b').classList.toggle('active', st.bold !== undefined ? st.bold : baseBold);
  $('tp-i').classList.toggle('active', st.italic !== undefined ? st.italic : tpTarget.base.fontStyle === 'italic');
  $('tp-u').classList.toggle('active', !!st.underline);
  $('tp-fill').value = st.fill || toHex(tpTarget.base.fill, '#ffffff');
  $('tp-stroke').value = st.stroke || toHex(tpTarget.base.stroke, '#000000');
  $('tp-sw').value = st.sw !== undefined ? st.sw : (tpTarget.base.strokeWidth || 0);
  $('tp-sw-val').textContent = $('tp-sw').value;
  const baseGlow = (tpTarget.base.shadow && tpTarget.base.shadow.blur) || 0;
  $('tp-glow').value = st.glow !== undefined ? st.glow : baseGlow;
  $('tp-glow-val').textContent = $('tp-glow').value;
  $('tp-glow-c').value = st.glowC || toHex(tpTarget.base.shadow && tpTarget.base.shadow.color, '#ff5000');
  $('tp-curve').value = st.curve || 0; $('tp-curve-val').textContent = st.curve || 0;
  const baseBgOn = !!tpTarget.base.backgroundColor;
  $('tp-bg-on').classList.toggle('active', st.bgOn !== undefined ? st.bgOn : baseBgOn);
  $('tp-bg-c').value = st.bgc || toHex(tpTarget.base.backgroundColor, '#ffd200');
  const p = $('txt-pop');
  const r = anchor.getBoundingClientRect();
  p.classList.add('open');
  p.style.left = Math.max(8, Math.min(r.right - 288, window.innerWidth - 296)) + 'px';
  p.style.top = Math.min(r.bottom + 8, window.innerHeight - 340) + 'px';
}
function closeTxtPop(){ $('txt-pop').classList.remove('open'); tpTarget = null; }
function bindTxtPop(){
  const upd = patch => { if (!tpTarget) return; ezSetStyle(tpTarget.layerName, patch); schedEzPreview(); };
  $('tp-close').onclick = closeTxtPop;
  buildFontOptions($('tp-font'));
  $('tp-font').addEventListener('change', async () => {
    const f = $('tp-font').value;
    await ensureFont(f);
    upd({ font: f });
    schedEzPreview(0);
  });
  $('tp-size').addEventListener('input', () => { $('tp-size-val').textContent = $('tp-size').value + '%'; upd({ sizeMul: +$('tp-size').value }); });
  $('tp-b').onclick = () => { $('tp-b').classList.toggle('active'); upd({ bold: $('tp-b').classList.contains('active') }); };
  $('tp-i').onclick = () => { $('tp-i').classList.toggle('active'); upd({ italic: $('tp-i').classList.contains('active') }); };
  $('tp-u').onclick = () => { $('tp-u').classList.toggle('active'); upd({ underline: $('tp-u').classList.contains('active') }); };
  $('tp-fill').addEventListener('input', () => upd({ fill: $('tp-fill').value }));
  $('tp-stroke').addEventListener('input', () => upd({ stroke: $('tp-stroke').value, sw: +$('tp-sw').value }));
  $('tp-sw').addEventListener('input', () => { $('tp-sw-val').textContent = $('tp-sw').value; upd({ stroke: $('tp-stroke').value, sw: +$('tp-sw').value }); });
  $('tp-bg-on').onclick = () => { $('tp-bg-on').classList.toggle('active'); upd({ bgOn: $('tp-bg-on').classList.contains('active'), bgc: $('tp-bg-c').value }); };
  $('tp-bg-c').addEventListener('input', () => upd({ bgOn: true, bgc: $('tp-bg-c').value, }) || $('tp-bg-on').classList.add('active'));
  $('tp-glow').addEventListener('input', () => { $('tp-glow-val').textContent = $('tp-glow').value; upd({ glow: +$('tp-glow').value, glowC: $('tp-glow-c').value }); });
  $('tp-glow-c').addEventListener('input', () => upd({ glow: +$('tp-glow').value, glowC: $('tp-glow-c').value }));
  $('tp-curve').addEventListener('input', () => { $('tp-curve-val').textContent = $('tp-curve').value; upd({ curve: +$('tp-curve').value }); });
  $('tp-reset').onclick = () => {
    if (!tpTarget) return;
    ezClearStyle(tpTarget.layerName);
    const name = tpTarget.layerName, btn = document.querySelector(`[data-edit="${cssEsc(name)}"]`) || $('ez-edit-phone');
    schedEzPreview(0);
    openTxtPop(btn, name); // repopulate with template defaults
    toast('Back to template styling');
  };
  document.addEventListener('click', e => {
    if (!e.target.closest('#txt-pop') && !e.target.closest('.ez-edit-btn')) closeTxtPop();
  });
  $('ez-edit-phone').onclick = e => {
    const l = ezTpl().layers.find(x => x.role === 'phone');
    if (l) openTxtPop(e.currentTarget, l.name); else toast('This template has no phone line', 'error');
  };
  $('ez-edit-website').onclick = e => {
    const l = ezTpl().layers.find(x => x.role === 'website');
    if (l) openTxtPop(e.currentTarget, l.name); else toast('This template has no website line — pick one that shows a site', 'error');
  };
}

// ═══════════════ EXPORT HISTORY (re-download costs a credit) ═══════════════
async function histList(){
  return (await bgList()).filter(r => r.kind === 'export').sort((a, b) => b.ts - a.ts);
}
async function addHistory(name, px, dataUrl, w, h){
  const thumb = await downscaleDataUrl(dataUrl, 160);
  await bgPut({ id:'ex-' + Date.now(), name, px, w: w || px, h: h || px, data: dataUrl, thumb, ts: Date.now(), kind:'export' });
  const all = await histList();
  for (const r of all.slice(12)) await bgDel(r.id);   // keep the last 12
}
async function openHistory(){
  const list = $('hist-list');
  list.innerHTML = '<div class="hist-empty">Loading…</div>';
  $('hist-overlay').classList.add('show');
  const items = await histList();
  list.innerHTML = '';
  if (!items.length){ list.innerHTML = '<div class="hist-empty">No exports yet — your downloads will show up here for easy re-downloading.</div>'; return; }
  items.forEach(r => {
    const row = document.createElement('div');
    row.className = 'hist-row';
    const rw = r.w || r.px, rh = r.h || r.px;   // rectangular formats store real dims; old entries were square
    row.innerHTML = `<img src="${r.thumb}" alt=""><span class="hist-main"><span class="hist-name">${escHtml(r.name)}</span><span class="hist-meta">${rw}×${rh} · ${new Date(r.ts).toLocaleString()}</span></span><button class="hist-dl">⬇ Re-download (1 credit)</button>`;
    row.querySelector('.hist-dl').onclick = async () => {
      const gate = await gateExport(r.px);
      if (!gate) return;
      let url = r.data, w = rw, h = rh;
      if (gate.px < r.px){ // plan downgraded since — plan caps apply to the SHORT side
        const s = gate.px / Math.min(rw, rh);
        w = Math.round(rw * s); h = Math.round(rh * s);
        url = await downscaleDataUrl(r.data, Math.max(w, h));
      }
      if (gate.watermark) url = await applyWatermark(url, w, h);
      try { await recordExport(); } catch (e){ toast('Could not record export: ' + e.message, 'error'); return; }
      const a = document.createElement('a');
      a.href = url; a.download = r.name.replace(/\.png$/,'') + '-redownload.png';
      document.body.appendChild(a); a.click(); a.remove();
      toast('Re-downloaded — 1 export credit used', 'success');
    };
    list.appendChild(row);
  });
}

// ═══════════════ COMMUNITY GALLERY ═══════════════
async function openCommunity(){
  const grid = $('comm-grid');
  grid.innerHTML = '';
  $('comm-overlay').classList.add('show');
  $('comm-note').style.display = DEMO ? '' : 'none';
  if (!DEMO){
    try {
      const j = await api('/community/list');
      (j.items || []).forEach(it => grid.appendChild(bgLibItem(it.thumb, it.name || 'Shared', async () => {
        try {
          const full = await api('/community/item?id=' + encodeURIComponent(it.id));
          applyBgAnywhere(full.data);
          $('comm-overlay').classList.remove('show');
        } catch (e){ toast('Could not load that background: ' + e.message, 'error'); }
      }, null, '🌐')));
    } catch (e){ toast('Community unavailable: ' + e.message, 'error'); }
  } else {
    const shared = (await bgList()).filter(r => r.kind === 'library' && r.shared);
    shared.forEach(rec => grid.appendChild(bgLibItem(rec.thumb || rec.data, rec.name || 'Shared', () => { applyBgAnywhere(rec.data); $('comm-overlay').classList.remove('show'); }, null, '🌐')));
  }
  PROC_BGS.forEach(spec => grid.appendChild(bgLibItem(drawProcBg(spec, 180), spec.name, () => { applyBgAnywhere(drawProcBg(spec, 1080)); $('comm-overlay').classList.remove('show'); }, null, 'Built-in')));
}
// apply a background to whichever editor is on screen
function applyBgAnywhere(dataUrl){
  if ($('page-easy').classList.contains('active')){ useEzPhoto(dataUrl, null); toast('Background applied'); }
  else if (canvas){ setBgFromDataUrl(dataUrl); toast('Background applied'); }
  else { showEasy(null); setTimeout(() => useEzPhoto(dataUrl, null), 250); }
}

// ═══════════════ GENERATE-BG MODAL (works from both editors) ═══════════════
let bggenUrl = null;
function openBgGen(){
  const cfg = getAiCfg();
  $('bggen-overlay').classList.add('show');
  if ((cfg.provider === 'openai' && !cfg.key) || (cfg.provider === 'custom' && !cfg.endpoint)){
    toast('Set your AI key first (⚙ in this window)', 'error');
  }
  setTimeout(() => $('bggen-prompt').focus(), 60);
}
function bindNavExtras(){
  $('nav-community').onclick = openCommunity;
  $('nav-history').onclick = openHistory;
  $('nav-genbg').onclick = openBgGen;
  $('nav-upgrade').onclick = () => openPlans();
  $('hist-close').onclick = () => $('hist-overlay').classList.remove('show');
  $('comm-close').onclick = () => $('comm-overlay').classList.remove('show');
  $('bggen-close').onclick = () => $('bggen-overlay').classList.remove('show');
  $('bggen-settings').onclick = () => { $('bggen-overlay').classList.remove('show'); openAiSettings(); };
  $('bggen-go').onclick = async () => {
    const btn = $('bggen-go');
    const cfg = getAiCfg();
    if (cfg.provider === 'openai' && !cfg.key){ openAiSettings(); return; }
    if (cfg.provider === 'custom' && !cfg.endpoint){ openAiSettings(); return; }
    btn.disabled = true; btn.textContent = '… Generating';
    try {
      bggenUrl = await aiGenerateBg($('bggen-prompt').value, $('bggen-style').value);
      $('bggen-img').src = bggenUrl;
      $('bggen-result').classList.add('show');
    } catch (err){ toast('Generation failed: ' + (err.message || 'unknown'), 'error'); }
    btn.disabled = false; btn.textContent = '✦ Generate';
  };
  $('bggen-use').onclick = () => { if (bggenUrl){ applyBgAnywhere(bggenUrl); $('bggen-overlay').classList.remove('show'); } };
  $('bggen-save').onclick = async () => {
    if (!bggenUrl) return;
    const data = await downscaleDataUrl(bggenUrl, 2160);
    const thumb = await downscaleDataUrl(bggenUrl, 240);
    await bgPut({ id:'bg-' + Date.now(), name:($('bggen-prompt').value || 'AI background').slice(0, 40), data, thumb, ts:Date.now(), kind:'library' });
    if (typeof refreshBgLibrary === 'function') refreshBgLibrary();
    toast('Saved to library', 'success');
  };
}
function openAiSettings(){
  const cfg = getAiCfg();
  $('ai-provider').value = cfg.provider;
  $('ai-key').value = cfg.key || '';
  $('ai-endpoint').value = cfg.endpoint || '';
  $('ai-quality').value = cfg.quality || 'medium';
  $('ai-key-field').style.display = cfg.provider === 'openai' ? '' : 'none';
  $('ai-endpoint-field').style.display = cfg.provider === 'custom' ? '' : 'none';
  $('ai-overlay').classList.add('show');
}

// ═══════════════ QR CODE LAYERS (Pro) ═══════════════
// The bridge into SCANS.AD: design the ad here, embed a tracked QR, order
// printing + posting, and every street scan reports back to the campaign.
// Works standalone too — the code can point at any URL.
const scanmapUrl = () => String(window.SCANMAP_URL || '').replace(/\/+$/, '');
// ── membership gating ──
// The SCANS.AD integration is invisible unless this browser has PROVEN the
// user belongs to BOTH platforms: signed in here, plus evidence of a SCANS.AD
// account — arriving from ScanMap's dashboard link (?scansad=member) or
// pasting a SCANS.AD tracking link into a QR layer. Single-product users
// never see the other product mentioned.
const scansadMember = () => !!jget('pgfx_scansad_member', false);
function unlockScansad(){
  if (scansadMember()) return;
  jset('pgfx_scansad_member', true);
  syncPartnerUI();
}
const partnerEnabled = () => !!(scanmapUrl() && account && scansadMember());
function syncPartnerUI(){
  const on = partnerEnabled();
  const ids = ['ex-order', 'ez-order', 'pq-scansad-tip'];
  ids.forEach(id => { const el = $(id); if (el) el.style.display = on ? '' : 'none'; });
}
let _qrLoad = null;
function loadQrLib(){
  if (window.qrcode) return Promise.resolve();
  if (_qrLoad) return _qrLoad;
  _qrLoad = new Promise((res, rej) => {
    const urls = [
      'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js',
      'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js',
      'https://unpkg.com/qrcode-generator@1.4.4/qrcode.js',
    ];
    const tryNext = i => {
      if (i >= urls.length){ _qrLoad = null; return rej(new Error('QR generator unavailable — check your connection and try again')); }
      const sc = document.createElement('script');
      sc.src = urls[i];
      sc.onload = () => window.qrcode ? res() : tryNext(i + 1);
      sc.onerror = () => tryNext(i + 1);
      document.head.appendChild(sc);
    };
    tryNext(0);
  });
  return _qrLoad;
}
function makeQrDataUrl(text, px){
  // error level M + 3-module quiet zone: survives street-flyer printing;
  // rendered oversized (≥1024px) so 2160px exports stay razor sharp
  const qr = window.qrcode(0, 'M');
  qr.addData(String(text));
  qr.make();
  const n = qr.getModuleCount(), quiet = 3, total = n + quiet * 2;
  const scale = Math.max(4, Math.ceil((px || 1024) / total));
  const cv = document.createElement('canvas');
  cv.width = cv.height = total * scale;
  const x = cv.getContext('2d');
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, cv.width, cv.height);
  x.fillStyle = '#000000';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++)
    if (qr.isDark(r, c)) x.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
  return cv.toDataURL('image/png');
}
const isPro = () => !!account && (account.plan || 'free') !== 'free';
async function addQrLayer(){
  if (!isPro()){
    openPlans('Scannable QR codes are a Pro feature — point one at any link, or paste a SCANS.AD tracking link and every printed flyer reports its scans back to you.');
    return;
  }
  try { await loadQrLib(); } catch (e){ toast(e.message, 'error'); return; }
  const brand = getBrand();
  const site = brand && brand.website ? String(brand.website).trim() : '';
  const url = site ? (/^https?:\/\//i.test(site) ? site : 'https://' + site) : 'https://iphones.la';
  const dataUrl = makeQrDataUrl(url, 1024);
  fabric.Image.fromURL(dataUrl, img => {
    const side = Math.round(Math.min(CW, CH) * 0.24);
    const sc = side / img.width;
    img.set({ left: CW - side / 2 - 44, top: CH - side / 2 - 44, originX:'center', originY:'center',
              scaleX: sc, scaleY: sc, name:'QR Code', pgRole:'qr', pgQrData: url, pgTplId: currentTplId });
    canvas.add(img); canvas.setActiveObject(img); canvas.renderAll();
    pushHist(); refreshLayers(); refreshProps();
    const ptab = document.querySelector('[data-rtab="props"]');
    if (ptab) ptab.click();
    setTimeout(() => { const f = $('pq-url'); if (f){ f.focus(); f.select(); } }, 80);
    toast('QR code added — set where it points in Properties', 'success');
  });
}
function updateQrObject(o, url){
  if (!o || o.pgRole !== 'qr') return;
  if (!url || !/^(https?:\/\/|tel:|sms:|mailto:)/i.test(url)){ toast('Enter a full link — e.g. https://iphones.la or a SCANS.AD tracking link', 'error'); return; }
  loadQrLib().then(() => {
    o.setSrc(makeQrDataUrl(url, 1024), () => {
      o.pgQrData = url;
      o.dirty = true;   // bust fabric's object cache so the new modules paint everywhere
      canvas.requestRenderAll(); debouncePush(300);
      const tracked = /functions\/v1\/scan/.test(url);
      if (tracked) unlockScansad();   // pasting a tracking link proves a SCANS.AD account
      toast(tracked ? 'Tracked SCANS.AD code updated — scans will report to your campaign' : 'QR code updated', 'success');
    });
  }).catch(e => toast(e.message, 'error'));
}

// ═══════════════ SAAS: PLANS / AUTH / EXPORT GATING ═══════════════
const API_BASE = (window.PGFX_API || '').replace(/\/$/, '');
const DEMO = !API_BASE;
const PLANS = {
  free: { label:'Free', price:0, priceLabel:'$0', per:'forever', maxPx:1080, watermark:true, weekly:3, monthly:null,
          feats:['3 exports per week','20 starter templates (all 8 phone designs)','1080 × 1080 downloads','BUYBACK.AD watermark'] },
  pro:  { label:'Pro', price:15, priceLabel:'$15', per:'/month', maxPx:2160, watermark:false, weekly:null, monthly:100,
          feats:['100 exports per month','All 50+ templates, every category','Up to 2160 × 2160 — no watermark','Export history & re-downloads'], hot:true },
};
function isoWeek(){ const d = new Date(); const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = new Date(Date.UTC(t.getUTCFullYear(),0,1));
  return t.getUTCFullYear() + '-W' + String(Math.ceil((((t - y) / 86400000) + 1) / 7)).padStart(2,'0'); }
function isoMonth(){ const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0'); }

let account = null; // {email, plan, exports:{period,count}}
const getToken = () => jget('pgfx_token', null);

async function sha256Hex(str){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
async function api(path, body){
  const r = await fetch(API_BASE + path, {
    method: body ? 'POST' : 'GET',
    headers: Object.assign({ 'Content-Type':'application/json' }, getToken() ? { Authorization:'Bearer ' + getToken() } : {}),
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || ('HTTP ' + r.status));
  return j;
}

// demo-mode account store (browser only; real enforcement lives in the Worker)
function demoUsers(){ return jget('pgfx_demo_users', {}); }
async function demoSignup(email, pass){
  const users = demoUsers();
  if (users[email]) throw new Error('An account with that email already exists — sign in instead');
  const salt = Math.random().toString(36).slice(2);
  users[email] = { salt, hash: await sha256Hex(salt + pass), plan:'free', exports:{ period:'', count:0 } };
  jset('pgfx_demo_users', users);
  jset('pgfx_token', 'demo:' + email);
  return loadAccount();
}
async function demoLogin(email, pass){
  const u = demoUsers()[email];
  if (!u || u.hash !== await sha256Hex(u.salt + pass)) throw new Error('Wrong email or password');
  jset('pgfx_token', 'demo:' + email);
  return loadAccount();
}
function demoMe(){
  const t = getToken();
  if (!t || !t.startsWith('demo:')) return null;
  const email = t.slice(5);
  const u = demoUsers()[email];
  return u ? { email, plan: u.plan, exports: u.exports } : null;
}
function demoSave(email, patch){
  const users = demoUsers();
  Object.assign(users[email], patch);
  jset('pgfx_demo_users', users);
}

async function loadAccount(){
  try {
    if (DEMO) account = demoMe();
    else if (getToken()) account = (await api('/me')).user;
    else account = null;
  } catch (e){ account = null; }
  syncAcctUI();
  return account;
}
function planOf(){ const p = (account && account.plan) || 'free'; return PLANS[p] || PLANS.pro; }
function currentPeriod(p){ return p.weekly ? isoWeek() : isoMonth(); }
function exportsUsed(){
  if (!account) return 0;
  const p = planOf();
  const per = currentPeriod(p);
  return (account.exports && account.exports.period === per) ? account.exports.count : 0;
}
function exportsRemaining(){
  const p = planOf();
  const cap = p.weekly || p.monthly;
  return cap === null || cap === undefined ? Infinity : Math.max(0, cap - exportsUsed());
}
function signOut(){ jset('pgfx_token', null); account = null; syncAcctUI(); toast('Signed out'); }

function syncAcctUI(){
  const chip = $('acct-chip'); if (!chip) return;
  if (account){
    $('acct-label').textContent = account.email.split('@')[0];
    const badge = $('acct-plan');
    badge.style.display = '';
    badge.textContent = planOf().label.toUpperCase();
    badge.classList.toggle('free', (account.plan || 'free') === 'free');
  } else {
    $('acct-label').textContent = 'Sign in';
    $('acct-plan').style.display = 'none';
  }
  syncQuotaUI();
  refreshTplLocks();
  syncPartnerUI();   // SCANS.AD surfaces require a signed-in member of both platforms
  const up = $('nav-upgrade');
  if (up) up.style.display = (!account || (account.plan || 'free') === 'free') ? '' : 'none';
}
function syncQuotaUI(){
  const q = $('ez-quota'); if (!q) return;
  if (!account){ q.innerHTML = 'Free plan: 3 exports/week at 1080p — <span class="up" id="quota-plans">see plans</span>'; }
  else {
    const p = planOf(), rem = exportsRemaining();
    if (rem === Infinity) q.innerHTML = '<b>' + p.label + '</b> — unlimited exports up to ' + p.maxPx + 'px';
    else q.innerHTML = '<b>' + rem + '</b> of ' + (p.weekly || p.monthly) + ' exports left this ' + (p.weekly ? 'week' : 'month') +
      ((account.plan || 'free') === 'free' ? ' · 1080p + watermark — <span class="up" id="quota-plans">upgrade</span>' : '');
  }
  const up = $('quota-plans');
  if (up) up.onclick = () => openPlans();
  const hint = $('ez-dl-hint');
  if (hint) hint.textContent = (planOf().maxPx >= 1440 && account && (account.plan||'free') !== 'free')
    ? '1440×1440 PNG minimum — ready for Marketplace, OfferUp & Instagram'
    : '1080×1080 PNG on the Free plan — upgrade for 1440–2160 and no watermark';
}

// ── auth UI ──
let authMode = 'in', authNext = null;
function openAuth(msg, next){
  authNext = next || null;
  $('auth-sub').textContent = msg || 'Sign in to download your ads and track your plan.';
  $('auth-forms').style.display = '';
  $('auth-ok').style.display = 'none';
  $('auth-err').textContent = '';
  $('auth-demo-note').style.display = DEMO ? '' : 'none';
  setAuthMode('in');
  $('auth-overlay').classList.add('show');
  setTimeout(() => $('auth-email').focus(), 60);
}
function setAuthMode(m){
  authMode = m;
  $('auth-tab-in').classList.toggle('active', m === 'in');
  $('auth-tab-up').classList.toggle('active', m === 'up');
  $('auth-go').textContent = m === 'in' ? 'Sign in' : 'Create account';
  $('auth-pass').autocomplete = m === 'in' ? 'current-password' : 'new-password';
}
async function submitAuth(){
  const email = $('auth-email').value.trim().toLowerCase();
  const pass = $('auth-pass').value;
  const err = $('auth-err');
  err.textContent = '';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return err.textContent = 'Enter a valid email address';
  if (pass.length < 8) return err.textContent = 'Password needs at least 8 characters';
  $('auth-go').disabled = true;
  try {
    if (DEMO) await (authMode === 'up' ? demoSignup(email, pass) : demoLogin(email, pass));
    else {
      const j = await api(authMode === 'up' ? '/auth/signup' : '/auth/login', { email, password: pass });
      jset('pgfx_token', j.token);
      await loadAccount();
    }
    if (authMode === 'up'){
      $('auth-forms').style.display = 'none';
      $('auth-ok').style.display = '';
    } else {
      $('auth-overlay').classList.remove('show');
      toast('Welcome back, ' + email.split('@')[0] + '!', 'success');
      if (authNext) authNext();
    }
  } catch (e){ err.textContent = e.message; }
  $('auth-go').disabled = false;
}

// ── plans / checkout ──
function openPlans(msg){
  buildPlansGrid();
  $('plans-sub').textContent = msg || 'Simple pricing for volume posters. Upgrade or cancel anytime.';
  $('plans-demo-note').style.display = DEMO ? '' : 'none';
  $('page-plans').classList.add('active');
}
function buildPlansGrid(){
  const g = $('plans-grid');
  g.innerHTML = '';
  Object.entries(PLANS).forEach(([id, p]) => {
    const cur = account && ((account.plan || 'free') === id || (id === 'pro' && account.plan === 'starter'));
    const card = document.createElement('div');
    card.className = 'plan-card' + (p.hot ? ' hot' : '');
    card.innerHTML = `<div class="plan-name">${p.label}</div>
      <div class="plan-price">${p.priceLabel}<small> ${p.per}</small></div>
      <ul class="plan-feats">${p.feats.map(f => '<li>' + f + '</li>').join('')}</ul>` +
      (cur ? '<div class="plan-current">✓ Your current plan</div>' + (id !== 'free' && !DEMO ? '<button class="plan-btn ghost" id="manage-billing" style="margin-top:10px">Manage billing / cancel</button>' : '')
           : `<button class="plan-btn${id === 'free' ? ' ghost' : ''}" data-plan="${id}">${id === 'free' ? 'Included' : 'Choose ' + p.label}</button>`);
    const btn = card.querySelector('.plan-btn');
    if (btn && id !== 'free') btn.onclick = () => startCheckout('pro');
    if (btn && id === 'free') btn.disabled = true;
    const mb = card.querySelector('#manage-billing');
    if (mb) mb.onclick = async () => {
      try { const j = await api('/portal', {}); location.href = j.url; }
      catch (e){ toast('Billing portal unavailable: ' + e.message, 'error'); }
    };
    g.appendChild(card);
  });
}
async function startCheckout(planId){
  if (!account){ openAuth('Create an account first — then pick your plan.', () => openPlans()); return; }
  if (DEMO){
    if (!confirm('Demo checkout: no backend is connected, so this simulates a successful ' + PLANS[planId].label + ' payment. Continue?')) return;
    demoSave(account.email, { plan: planId });
    await loadAccount();
    showPayResult(true, planId);
    return;
  }
  try {
    const j = await api('/checkout', { plan: planId });
    location.href = j.url; // Stripe-hosted checkout page
  } catch (e){ toast('Checkout failed: ' + e.message, 'error'); }
}
function showPayResult(ok, planId){
  $('page-plans').classList.remove('active');
  $('pay-ico').textContent = ok ? '✅' : '↩️';
  $('pay-title').textContent = ok ? 'Payment successful!' : 'Checkout cancelled';
  $('pay-sub').textContent = ok
    ? 'You are now on the ' + (PLANS[planId] ? PLANS[planId].label : 'new') + ' plan. Watermark off, full resolution on.'
    : 'No charge was made. You are still on your previous plan.';
  $('pay-overlay').classList.add('show');
}
async function handleCheckoutReturn(){
  const q = new URLSearchParams(location.search);
  const st = q.get('checkout');
  if (!st) return;
  history.replaceState(null, '', location.pathname);
  if (st === 'success'){ await loadAccount(); showPayResult(true, account && account.plan); }
  else showPayResult(false);
}

// ── export gate + watermark ──
async function recordExport(){
  if (DEMO){
    const p = planOf(), per = currentPeriod(p);
    const ex = (account.exports && account.exports.period === per) ? account.exports : { period: per, count: 0 };
    ex.period = per; ex.count++;
    demoSave(account.email, { exports: ex });
    account.exports = ex;
    syncQuotaUI();
    return true;
  }
  const j = await api('/export', {});
  account = j.user; syncQuotaUI();
  return true;
}
async function gateExport(pxWanted){
  if (!account) await loadAccount();
  if (!account){
    openAuth('Sign in to download — free accounts get 3 exports a week.');
    return null;
  }
  const p = planOf();
  if (exportsRemaining() <= 0){
    openPlans("You've used all your " + (p.weekly || p.monthly) + ' ' + p.label + ' exports this ' + (p.weekly ? 'week' : 'month') + ' — upgrade to keep posting.');
    return null;
  }
  return { px: Math.min(pxWanted, p.maxPx), watermark: !!p.watermark };
}
function applyWatermark(dataUrl, w, h){
  h = h || w;
  return new Promise(res => {
    const im = new Image();
    im.onload = () => {
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      const x = cv.getContext('2d');
      x.drawImage(im, 0, 0, w, h);
      const base = Math.min(w, h);
      const fs = Math.round(base * 0.032);
      x.font = '800 ' + fs + 'px "DM Sans", sans-serif';
      x.globalAlpha = 0.5;
      x.shadowColor = 'rgba(0,0,0,0.55)'; x.shadowBlur = fs * 0.35;
      x.fillStyle = '#ffffff';
      const pad = Math.round(base * 0.06), t = 'BUYBACK.AD';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      // each corner mark rotated 45° along its corner→center diagonal
      [[pad, pad, 45], [w - pad, pad, -45], [pad, h - pad, -45], [w - pad, h - pad, 45]].forEach(([cx, cy, deg]) => {
        x.save();
        x.translate(cx, cy);
        x.rotate(deg * Math.PI / 180);
        x.fillText(t, 0, 0);
        x.restore();
      });
      res(cv.toDataURL('image/png'));
    };
    im.onerror = () => res(dataUrl);
    im.src = dataUrl;
  });
}

function bindSaasUI(){
  $('acct-chip').onclick = () => {
    if (!account) openAuth();
    else if (confirm('Signed in as ' + account.email + ' (' + planOf().label + ' plan).\n\nOK = see plans · Cancel = sign out')) openPlans();
    else signOut();
  };
  $('auth-tab-in').onclick = () => setAuthMode('in');
  $('auth-tab-up').onclick = () => setAuthMode('up');
  $('auth-go').onclick = submitAuth;
  $('auth-pass').addEventListener('keydown', e => { if (e.key === 'Enter') submitAuth(); });
  $('auth-cancel').onclick = () => $('auth-overlay').classList.remove('show');
  $('auth-ok-btn').onclick = () => { $('auth-overlay').classList.remove('show'); syncAcctUI(); if (authNext) authNext(); };
  $('plans-close').onclick = () => $('page-plans').classList.remove('active');
  $('pay-ok').onclick = () => $('pay-overlay').classList.remove('show');
  loadAccount();
  handleCheckoutReturn();
}

// ═══════════════ HEIC SUPPORT ═══════════════
let _heicLoad = null;
function loadHeic(){
  if (window.heic2any) return Promise.resolve();
  if (_heicLoad) return _heicLoad;
  _heicLoad = new Promise((res, rej) => {
    const urls = [
      'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js',
      'https://unpkg.com/heic2any@0.0.4/dist/heic2any.min.js',
    ];
    const tryNext = i => {
      if (i >= urls.length){ _heicLoad = null; return rej(new Error('heic2any unavailable')); }
      const sc = document.createElement('script');
      sc.src = urls[i];
      sc.onload = () => window.heic2any ? res() : tryNext(i + 1);
      sc.onerror = () => tryNext(i + 1);
      document.head.appendChild(sc);
    };
    tryNext(0);
  });
  return _heicLoad;
}
function isHeic(file){
  const n = (file.name || '').toLowerCase();
  return /image\/hei[cf]/.test(file.type || '') || n.endsWith('.heic') || n.endsWith('.heif');
}
function withTimeout(promise, ms, label){
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error(label + ' timed out')), ms)),
  ]);
}
// One entry point for every photo input: HEIC → JPEG, everything → dataURL
function blobToDataUrl(blob){
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(new Error('read failed'));
    r.readAsDataURL(blob);
  });
}
function urlDecodes(url){
  return new Promise(res => {
    const im = new Image();
    im.onload = () => res(im.width > 0 && im.height > 0);
    im.onerror = () => res(false);
    im.src = url;
  });
}
async function fileToDataUrl(file){
  if (!isHeic(file)) return blobToDataUrl(file);

  // Step 1 — try the browser's own decoder first (Safari does HEIC natively,
  // and plenty of ".heic" files are really JPEGs). Seamless when it works.
  const raw = await blobToDataUrl(file);
  if (await urlDecodes(raw)) return raw;

  // Step 2 — convert with heic2any (wasm), verify the result really decodes
  toast('Converting HEIC photo… (a few seconds)');
  try {
    await withTimeout(loadHeic(), 15000, 'Converter download');
    const out = await withTimeout(
      window.heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 }),
      25000, 'HEIC conversion');
    const url = await blobToDataUrl(Array.isArray(out) ? out[0] : out);
    if (!(await urlDecodes(url))) throw new Error('converted image failed to decode');
    toast('Converted ✓', 'success');
    return url;
  } catch (err){
    // heic2any rejects with {code, message} objects, not Errors — surface the truth
    const msg = (err && (err.message || err.msg)) || (typeof err === 'object' ? JSON.stringify(err) : String(err));
    console.error('HEIC conversion failed:', err);
    toast('HEIC failed: ' + msg, 'error');
    const e = new Error('heic: ' + msg);
    e.pgxToasted = true;
    throw e;
  }
}

// ═══════════════ RECENT PHOTO BACKGROUNDS ═══════════════
async function recentsList(){
  return (await bgList()).filter(r => r.kind === 'recent').sort((a, b) => b.ts - a.ts);
}
async function addRecentBg(dataUrl){
  const data = await downscaleDataUrl(dataUrl, 2160);
  const thumb = await downscaleDataUrl(dataUrl, 200);
  await bgPut({ id:'rc-' + Date.now(), name:'Recent photo', data, thumb, ts:Date.now(), kind:'recent' });
  const rec = await recentsList();
  for (const r of rec.slice(8)) await bgDel(r.id);  // keep the 8 newest
  refreshEzRecents();
}
async function refreshEzRecents(){
  const holder = $('ez-recents');
  if (!holder) return;
  const rec = await recentsList();
  holder.innerHTML = '';
  rec.forEach(r => {
    const b = document.createElement('button');
    b.className = 'ez-recent' + (ez.bg && ez.bg.type === 'image' && ez.bgRecId === r.id ? ' sel' : '');
    b.title = 'Use this photo';
    b.innerHTML = `<img src="${r.thumb}" alt="Recent background"><span class="star-btn" title="Save to a library">★</span>`;
    b.onclick = e => {
      if (e.target.classList.contains('star-btn')){ e.stopPropagation(); openStarPop(e.target, r); return; }
      useEzPhoto(r.data, r.id);
    };
    holder.appendChild(b);
  });
}
function useEzPhoto(dataUrl, recId){
  fabric.Image.fromURL(dataUrl, img => {
    if (!img || !img.width || !img.height){ toast('That photo could not be read', 'error'); return; }
    ez.bgData = dataUrl;
    ez.bgImgObj = img;
    ez.bgRecId = recId || null;
    ez.bg = { type:'image' };
    applyEzBlur();
    $('ez-sw-photo').style.backgroundImage = 'url(' + dataUrl + ')';
    $('ez-sw-photo').style.backgroundSize = 'cover';
    $('ez-sw-photo').textContent = '';
    syncEzSwatches();
    refreshEzRecents();
    refreshEzLayers();
    schedEzPreview(0);
  });
}

// ═══════════════ STAR → LIBRARY POPOVER ═══════════════
let _starRec = null;
function openStarPop(anchor, rec){
  _starRec = rec;
  const p = $('star-pop');
  const r = anchor.getBoundingClientRect();
  p.classList.add('open');
  const pw = 210;
  p.style.left = Math.max(8, Math.min(r.left, window.innerWidth - pw - 8)) + 'px';
  p.style.top = Math.min(r.bottom + 6, window.innerHeight - 96) + 'px';
}
function closeStarPop(){ $('star-pop').classList.remove('open'); _starRec = null; }
async function starSave(shared){
  if (!_starRec) return;
  const src = _starRec;
  closeStarPop();
  await bgPut({ id:'bg-' + Date.now(), name: src.name || 'Saved photo', data: src.data, thumb: src.thumb, ts: Date.now(), kind:'library', shared: !!shared });
  if (typeof refreshBgLibrary === 'function') refreshBgLibrary();
  if (shared && !DEMO){
    if (!account){ openAuth('Sign in to publish to the community gallery.'); return; }
    try {
      const data = await downscaleDataUrl(src.data, 1080);
      const thumb = src.thumb || await downscaleDataUrl(src.data, 240);
      await api('/community/publish', { name: (src.name || 'Background').slice(0, 40), thumb, data });
      toast('Published to the community gallery 🌐', 'success');
    } catch (e){ toast('Publish failed: ' + e.message, 'error'); }
    return;
  }
  toast(shared
    ? 'Saved as shared — connect the backend (README) to publish to everyone'
    : 'Saved to your personal library', 'success');
}

// ═══════════════ EASY LAYERS PANEL ═══════════════
function ezHiddenSet(){
  return (ez.hidden = ez.hidden || {})[ez.tpl] = (ez.hidden[ez.tpl] || []);
}
function ezLayerRow({ swatchHtml, name, prev, onClick, onDel, delTitle, starRec }){
  const row = document.createElement('div');
  row.className = 'ez-lrow';
  row.innerHTML = `<span class="ez-lswatch">${swatchHtml}</span>
    <span class="ez-lmain"><span class="ez-lname">${escHtml(name)}</span>${prev ? `<span class="ez-lprev">${escHtml(prev)}</span>` : ''}</span>` +
    (starRec ? '<button class="star-btn" title="Save to a library">★</button>' : '') +
    (onDel ? `<button class="ez-ldel" title="${delTitle || 'Remove'}">✕</button>` : '');
  row.onclick = e => {
    if (e.target.classList.contains('ez-ldel')){ e.stopPropagation(); onDel(); return; }
    if (e.target.classList.contains('star-btn')){ e.stopPropagation(); openStarPop(e.target, starRec); return; }
    if (onClick) onClick();
  };
  return row;
}
function refreshEzLayers(){
  const list = $('ez-layers-list');
  if (!list) return;
  list.innerHTML = '';
  const tpl = ezTpl();
  const hidden = ezHiddenSet();
  const bgSpec = ez.bg || tpl.bg;

  // Background row
  const isPhoto = bgSpec.type === 'image' && ez.bgData;
  const isTplPhoto = bgSpec.type === 'image' && bgSpec.src;
  const sw = isPhoto ? `<img src="${ez.bgData}" alt="">`
    : isTplPhoto ? `<img src="${bgSpec.src}" alt="">`
    : `<span style="width:100%;height:100%;display:block;background:${cssBg(bgSpec)}"></span>`;
  list.appendChild(ezLayerRow({
    swatchHtml: sw, name: 'Background',
    prev: isPhoto ? 'Your photo — tap to change' : (ez.bg === null ? (isTplPhoto ? 'Template photo — tap to change' : 'Template original — tap to change') : 'Color — tap to change'),
    onClick: () => {
      const el = $('ez-swatches');
      el.scrollIntoView({ behavior:'smooth', block:'center' });
      el.style.outline = '2px solid var(--accent)'; el.style.outlineOffset = '4px'; el.style.borderRadius = '8px';
      setTimeout(() => { el.style.outline = ''; }, 1200);
    },
    onDel: ez.bg !== null ? () => { ez.bg = null; ez.bgRecId = null; syncEzSwatches(); refreshEzRecents(); refreshEzLayers(); schedEzPreview(0); } : null,
    delTitle: 'Reset to template background',
    starRec: isPhoto ? { name:'Background photo', data: ez.bgData, thumb: ez.bgData, ts: Date.now() } : null,
  }));

  // Text layers
  tpl.layers.filter(l => (l.kind === 'text' || l.kind === 'textbox') && EZ_EDIT_ROLES.includes(l.role) && !hidden.includes(l.name)).forEach(l => {
    const v = ((ez.vals[tpl.id] || {})[l.name] !== undefined) ? ez.vals[tpl.id][l.name] : l.text;
    list.appendChild(ezLayerRow({
      swatchHtml: '<b style="font-family:var(--ui)">T</b>', name: l.name,
      prev: String(v).replace(/\n/g, ' · ').slice(0, 34),
      onClick: () => {
        const fid = 'ezf-' + l.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const inp = $(fid);
        if (inp){ inp.scrollIntoView({ behavior:'smooth', block:'center' }); inp.focus(); }
      },
      onDel: () => { hidden.push(l.name); buildEzForm(); refreshEzLayers(); schedEzPreview(0); },
      delTitle: 'Remove from this ad',
    }));
  });

  // Selling points row
  const chips = ezChips();
  if (chips.length){
    list.appendChild(ezLayerRow({
      swatchHtml: '<span style="font-size:9px;background:#ffd200;color:#111;font-weight:900;border-radius:4px;padding:1px 3px">•••</span>',
      name: 'Selling points', prev: chips.join(' • '),
      onClick: () => { const el = $('ez-chips'); el.scrollIntoView({ behavior:'smooth', block:'center' }); },
      onDel: () => { ez.chips = []; syncEzChips(); refreshEzLayers(); schedEzPreview(0); },
      delTitle: 'Remove all selling points',
    }));
  }

  // Restore link
  if (hidden.length){
    const r = document.createElement('button');
    r.className = 'ez-restore';
    r.textContent = '↺ Restore ' + hidden.length + ' hidden layer' + (hidden.length > 1 ? 's' : '');
    r.onclick = () => { hidden.length = 0; buildEzForm(); refreshEzLayers(); schedEzPreview(0); };
    list.appendChild(r);
  }
}

// ═══════════════ SMART EXPORT SIZE (1440 minimum) ═══════════════
function ezExportPx(){
  let px = 1440;
  if (ez.bg && ez.bg.type === 'image' && ez.bgImgObj && ez.bgImgObj.width){
    // a cover-cropped square shows min(w,h) source pixels edge-to-edge:
    // exporting above that upscales the photo, below wastes its quality
    px = Math.min(2160, Math.max(1440, Math.min(ez.bgImgObj.width, ez.bgImgObj.height)));
  }
  return Math.round(px);
}

// ═══════════════ AI BACKGROUND GENERATION (guard-railed) ═══════════════
const AI_STYLE_CLAUSES = {
  studio:  'Professional studio product photography, seamless backdrop, controlled softbox lighting, crisp focus, shallow depth of field.',
  desk:    'Editorial lifestyle photograph, real desk scene, natural window light, photorealistic materials, believable depth of field.',
  cash:    'Documentary-style photograph of genuine US dollar bills alongside the device(s), realistic paper texture and lighting, no illustration.',
  texture: 'Premium abstract background texture only, no devices and no objects, deep rich tones, suitable as a poster backdrop with open space for large text.',
  neon:    'Moody tech photograph with neon rim lighting, dark environment, cinematic contrast, photorealistic.',
};
const AI_LOCKED_PREFIX = 'Photorealistic commercial advertising background photograph, 1:1 square, composed with clear open space for large headline text overlays. ';
const AI_LOCKED_SUFFIX = ' STRICT HARDWARE ACCURACY REQUIREMENTS: any Apple device shown must be a real, currently existing iPhone, iPad or MacBook model reproduced exactly — correct chassis proportions, authentic camera module layout and lens count for that exact model, true official Apple colorways, accurate port and button placement, real Apple design language. Absolutely no invented, concept, prototype or futuristic devices; no wrong camera arrays; no distorted logos; no extra buttons; no CGI-looking renders, no 3D mockups, no illustrations, no cartoon styles, no text, no watermarks, no hands with wrong anatomy. If unsure of a model detail, angle the device or crop so the uncertain detail is not visible.';
function buildBgPrompt(userText, styleKey){
  const cleaned = String(userText || '').replace(/\s+/g, ' ').trim().slice(0, 300);
  return AI_LOCKED_PREFIX + (AI_STYLE_CLAUSES[styleKey] || AI_STYLE_CLAUSES.studio) +
    (cleaned ? ' Subject: ' + cleaned + '.' : ' Subject: modern iPhone lying on a dark premium surface.') +
    AI_LOCKED_SUFFIX;
}
function getAiCfg(){ return jget('pgfx_ai', { provider:'openai', key:'', endpoint:'', quality:'medium' }); }
async function aiGenerateBg(userText, styleKey){
  const cfg = getAiCfg();
  const prompt = buildBgPrompt(userText, styleKey);
  if (cfg.provider === 'custom'){
    if (!cfg.endpoint) throw new Error('no-endpoint');
    const r = await fetch(cfg.endpoint, {
      method:'POST', headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ prompt, size:'1024x1024' }),
    });
    if (!r.ok) throw new Error('http-' + r.status);
    const j = await r.json();
    const img = j.image || j.dataUrl || (j.b64 ? 'data:image/png;base64,' + j.b64 : null);
    if (!img) throw new Error('bad-response');
    return img;
  }
  if (!cfg.key) throw new Error('no-key');
  const r = await fetch('https://api.openai.com/v1/images/generations', {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + cfg.key },
    body: JSON.stringify({ model:'gpt-image-1', prompt, size:'1024x1024', quality: cfg.quality || 'medium', n:1 }),
  });
  if (!r.ok){
    let msg = 'http-' + r.status;
    try { const je = await r.json(); if (je.error && je.error.message) msg = je.error.message; } catch(e){}
    throw new Error(msg);
  }
  const j = await r.json();
  const b64 = j.data && j.data[0] && j.data[0].b64_json;
  if (!b64) throw new Error('bad-response');
  return 'data:image/png;base64,' + b64;
}

let lastGenUrl = null;
function bindBackgroundsUI(){
  $('ai-settings-btn').onclick = openAiSettings;
  $('ai-provider').addEventListener('change', () => {
    $('ai-key-field').style.display = $('ai-provider').value === 'openai' ? '' : 'none';
    $('ai-endpoint-field').style.display = $('ai-provider').value === 'custom' ? '' : 'none';
  });
  $('ai-cancel').onclick = () => $('ai-overlay').classList.remove('show');
  $('ai-save').onclick = () => {
    jset('pgfx_ai', { provider:$('ai-provider').value, key:$('ai-key').value.trim(), endpoint:$('ai-endpoint').value.trim(), quality:$('ai-quality').value });
    $('ai-overlay').classList.remove('show');
    toast('AI settings saved', 'success');
  };
  const runGen = async () => {
    const btn = $('bg-generate');
    const cfg = getAiCfg();
    if (cfg.provider === 'openai' && !cfg.key){ $('ai-settings-btn').click(); toast('Add your API key first', 'error'); return; }
    if (cfg.provider === 'custom' && !cfg.endpoint){ $('ai-settings-btn').click(); toast('Add your endpoint first', 'error'); return; }
    btn.disabled = true; btn.textContent = '… Generating';
    try {
      const url = await aiGenerateBg($('bg-prompt').value, $('bg-style').value);
      lastGenUrl = url;
      $('bg-result-img').src = url;
      $('bg-result').classList.add('show');
    } catch (err){
      toast('Generation failed: ' + (err.message || 'unknown error'), 'error');
    }
    btn.disabled = false; btn.textContent = '✦ Generate';
  };
  $('bg-generate').onclick = runGen;
  $('bg-retry').onclick = runGen;
  $('bg-use').onclick = () => { if (lastGenUrl){ setBgFromDataUrl(lastGenUrl); toast('Background applied'); } };
  $('bg-save').onclick = async () => {
    if (!lastGenUrl) return;
    const data = await downscaleDataUrl(lastGenUrl, 2160);
    const thumb = await downscaleDataUrl(lastGenUrl, 240);
    await bgPut({ id:'bg-' + Date.now(), name:($('bg-prompt').value || 'AI background').slice(0, 40), data, thumb, ts:Date.now(), kind:'library' });
    refreshBgLibrary();
    toast('Saved to library', 'success');
  };
  $('bg-upload-btn').onclick = () => $('bg-upload-file').click();
  $('bg-upload-file').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    e.target.value = '';
    try {
      const raw = await fileToDataUrl(f);
      const data = await downscaleDataUrl(raw, 2160);
      const thumb = await downscaleDataUrl(raw, 240);
      await bgPut({ id:'bg-' + Date.now(), name:f.name.slice(0, 40), data, thumb, ts:Date.now(), kind:'library' });
      refreshBgLibrary();
      toast('Added to library', 'success');
    } catch (err){ if (!err.pgxToasted) toast('That image could not be read', 'error'); }
  });
  refreshBgLibrary();
}

// ═══════════════ EASY MODE ═══════════════
const BG_PRESETS = [
  {type:'grad', c1:'#b01030', c2:'#7b2d9e', a:135},
  {type:'grad', c1:'#1a1a2e', c2:'#16213e', a:180},
  {type:'solid', c:'#0d0d0d'},
  {type:'grad', c1:'#0b3d2e', c2:'#15805c', a:160},
  {type:'grad', c1:'#ff5000', c2:'#c81d25', a:135},
  {type:'grad', c1:'#f5b700', c2:'#ff8a00', a:135},
];
const EZ_EDIT_ROLES = ['headline','sub','cta','info','user','offer'];
let ez = { tpl: null, vals:{}, chips:null, bg:null, custom:'#2563eb', hidden:{}, bgRecId:null, bgData:null, bgImgObj:null, fx:{ blur:0, overlay:'none', oc:'#000000', os:45 }, styles:{}, customPoints: jget('pgfx_custom_points', []) };
let ezBound = false, ezPrevTimer = null;

function ezTpl(){ return TEMPLATES.find(t => t.id === ez.tpl) || TEMPLATES[0]; }
const CATS = [
  { id:'phones',  label:'\uD83D\uDCF1 Phones & Devices' },
  { id:'gold',    label:'\uD83E\uDD47 Gold & Jewelry' },
  { id:'silver',  label:'\uD83E\uDD48 Silver' },
  { id:'coins',   label:'\uD83E\uDE99 Rare Coins' },
  { id:'cars',    label:'\uD83D\uDE97 Cars & Trucks' },
  { id:'strips',  label:'\uD83E\uDE78 Diabetic Supplies' },
  { id:'pokemon', label:'\u26A1 Pok\u00e9mon Cards' },
  { id:'sports',  label:'\uD83C\uDFC0 Sports Cards' },
];
let currentCat = jget('pgfx_cat', 'phones');
function setCategory(cat){
  currentCat = CATS.some(c => c.id === cat) ? cat : 'phones';
  jset('pgfx_cat', currentCat);
  document.querySelectorAll('.cat-select').forEach(sel => { sel.value = currentCat; });
  buildEzStrip();
  const first = TEMPLATES.find(t => t.cat === currentCat && !tplLocked(t)) || TEMPLATES.find(t => t.cat === currentCat);
  if ($('page-easy').classList.contains('active') && ezTpl().cat !== currentCat && first) selectEzTpl(first.id);
  if (typeof refreshMyTemplates === 'function') refreshMyTemplates();
}
function catTemplates(){ return TEMPLATES.filter(t => t.cat === currentCat); }
function tplLocked(t){
  if (!t || t.tier !== 'premium') return false;
  return !account || (account.plan || 'free') === 'free';
}
function firstFreeTplId(){ return (TEMPLATES.find(t => !tplLocked(t)) || TEMPLATES[0]).id; }
function refreshTplLocks(){
  document.querySelectorAll('.ez-tpl').forEach(b => {
    const t = TEMPLATES.find(x => x.id === b.dataset.tpl);
    b.classList.toggle('locked', tplLocked(t));
  });
}
function ezDefaultChips(tpl){
  const b = tpl.layers.find(l => l.role === 'badges');
  if (!b) return [];
  return b.text.split('•').map(x => x.trim()).filter(Boolean);
}
function ezChips(){ return ez.chips !== null ? ez.chips : ezDefaultChips(ezTpl()); }
function cssBg(spec){
  if (spec.type === 'image'){
    if (spec.src) return `url(${spec.src}) center/cover`;
    const fb = spec.fallback;
    return fb ? cssBg(fb) : '#101014';
  }
  return spec.type === 'solid' ? spec.c : `linear-gradient(${spec.a||0}deg, ${spec.c1}, ${spec.c2})`;
}

function showEasy(tplId){
  buildEzStrip();   // pick up any photo thumbs that landed while on other pages
  $('page-landing').classList.add('hidden');
  $('page-editor').classList.remove('active');
  $('page-easy').classList.add('active');
  window.scrollTo(0,0);
  ensureThumbs();
  bindEasyUI();
  const b = getBrand();
  if (b){ if (!$('ez-phone').value) $('ez-phone').value = b.phone || ''; if (!$('ez-website').value) $('ez-website').value = b.website || ''; }
  selectEzTpl(tplId || ez.tpl || jget('pgfx_last', 'sell_iphone'));
  refreshEzRecents();
}

function bindEasyUI(){
  if (ezBound) return;
  ezBound = true;
  $('ez-logo').onclick = showLanding;
  $('ez-adv-link').onclick = () => openAdvancedFromEz();
  $('ez-open-adv').onclick = () => openAdvancedFromEz();
  $('ez-download').onclick = ezDownload;
  const ezOrder = $('ez-order');
  if (ezOrder) ezOrder.onclick = () => {
    const phone = $('ez-phone').value.trim();
    if (!phone){ toast('Type your phone number first — buyers need to reach you', 'error'); $('ez-phone').focus(); return; }
    orderPrints(true);
  };
  syncPartnerUI();
  ['ez-phone','ez-website'].forEach(id => $(id).addEventListener('input', () => {
    const cur = getBrand() || {};
    jset('pgfx_brand', Object.assign(cur, { phone: $('ez-phone').value.trim(), website: $('ez-website').value.trim() }));
    schedEzPreview();
  }));
  restoreEzState();
  // category picker + template strip
  buildCatSelect($('ez-cat'));
  buildEzStrip();
  // chips
  buildEzChipRow();
  $('ez-add-point').onclick = addCustomPoint;
  $('ez-custom-point').addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); addCustomPoint(); } });
  $('ez-edit-badges').onclick = e => openTxtPop(e.currentTarget, 'Badges');
  // background swatches
  const sw = $('ez-swatches');
  const orig = document.createElement('button');
  orig.className = 'ez-sw orig'; orig.textContent = 'ORIG'; orig.title = "Template's original background";
  orig.onclick = () => { ez.bg = null; ez.bgRecId = null; syncEzSwatches(); refreshEzRecents(); refreshEzLayers(); schedEzPreview(); };
  sw.appendChild(orig);
  BG_PRESETS.forEach((p, i) => {
    const b = document.createElement('button');
    b.className = 'ez-sw'; b.style.background = cssBg(p); b.dataset.i = i; b.title = 'Background ' + (i+1);
    b.onclick = () => { ez.bg = p; ez.bgRecId = null; syncEzSwatches(); refreshEzRecents(); refreshEzLayers(); schedEzPreview(); };
    sw.appendChild(b);
  });
  const photo = document.createElement('button');
  photo.className = 'ez-sw'; photo.id = 'ez-sw-photo'; photo.title = 'Use your own photo';
  photo.textContent = '📷';
  photo.style.fontSize = '18px'; photo.style.background = 'var(--panel2)';
  photo.onclick = () => $('ez-bg-file').click();
  sw.appendChild(photo);
  $('ez-bg-file').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    e.target.value = '';
    try {
      const raw = await fileToDataUrl(f);
      const url = await downscaleDataUrl(raw, 2160); // keep quality: the 1440+ export needs headroom
      useEzPhoto(url, null);
      addRecentBg(url);
      toast('Photo set as background');
    } catch (err){
      if (!err.pgxToasted) toast('That photo could not be read — try a JPG, PNG or HEIC', 'error');
    }
  });
  const cust = document.createElement('button');
  cust.className = 'ez-sw'; cust.id = 'ez-sw-custom'; cust.title = 'Pick any color';
  cust.style.background = ez.custom;
  cust.innerHTML = `<input type="color" id="ez-custom-color" value="${ez.custom}" aria-label="Custom background color">`;
  cust.querySelector('input').addEventListener('input', e => {
    ez.custom = e.target.value;
    cust.style.background = ez.custom;
    ez.bg = { type:'solid', c: ez.custom };
    ez.bgRecId = null;
    syncEzSwatches();
    refreshEzRecents();
    refreshEzLayers();
    schedEzPreview();
  });
  sw.appendChild(cust);

  // effects
  $('fx-blur').addEventListener('input', () => {
    ez.fx.blur = +$('fx-blur').value;
    $('fx-blur-val').textContent = ez.fx.blur;
    applyEzBlur();
    schedEzPreview();
  });
  document.querySelectorAll('#fx-ov-seg button').forEach(b => b.onclick = () => {
    document.querySelectorAll('#fx-ov-seg button').forEach(x => x.classList.toggle('active', x === b));
    ez.fx.overlay = b.dataset.ov;
    $('fx-ov-opts').style.display = ez.fx.overlay === 'none' ? 'none' : '';
    schedEzPreview(0);
  });
  $('fx-oc').addEventListener('input', () => { ez.fx.oc = $('fx-oc').value; schedEzPreview(); });
  $('fx-os').addEventListener('input', () => { ez.fx.os = +$('fx-os').value; $('fx-os-val').textContent = ez.fx.os + '%'; schedEzPreview(); });

  bindSaasUI();
  bindNavExtras();
  document.querySelectorAll('[data-goto]').forEach(b => b.onclick = () => b.dataset.goto === 'plans' ? openPlans() : showEasy(null));
  bindTxtPop();
  buildThemeRow();

  // star popover
  $('star-personal').onclick = () => starSave(false);
  $('star-community').onclick = () => starSave(true);
  document.addEventListener('click', e => {
    if (!e.target.closest('#star-pop') && !e.target.classList.contains('star-btn')) closeStarPop();
  });
  refreshEzRecents();
}

function buildCatSelect(sel){
  if (!sel || sel.dataset.built) return;
  sel.dataset.built = '1';
  sel.innerHTML = CATS.map(c => `<option value="${c.id}">${c.label}</option>`).join('');
  sel.value = currentCat;
  sel.addEventListener('change', () => setCategory(sel.value));
}
function buildEzStrip(){
  const strip = $('ez-strip');
  if (!strip) return;
  strip.innerHTML = '';
  catTemplates().forEach(t => {
    const b = document.createElement('button');
    b.className = 'ez-tpl'; b.dataset.tpl = t.id;
    b.innerHTML = `<img src="${getThumb(t.id, 320)}" alt="${escHtml(t.name)}">` +
      (t.tier === 'premium' ? '<span class="tpl-lock">🔒 PRO</span>' : '') +
      `<span>${escHtml(t.name)}</span>`;
    b.onclick = () => selectEzTpl(t.id);
    strip.appendChild(b);
  });
  refreshTplLocks();
  document.querySelectorAll('.ez-tpl').forEach(b => b.classList.toggle('sel', b.dataset.tpl === ez.tpl));
}
function selectEzTpl(id){
  const want = TEMPLATES.find(t => t.id === id);
  if (want && tplLocked(want)){
    openPlans('“' + want.name + '” is a premium template — unlock all 8 designs with Starter or Pro.');
    if (!ez.tpl || tplLocked(ezTpl())) id = firstFreeTplId();
    else return;
  }
  ez.tpl = TEMPLATES.some(t => t.id === id) ? id : firstFreeTplId();
  ez.chips = null; // back to this template's default points
  jset('pgfx_last', ez.tpl);
  document.querySelectorAll('.ez-tpl').forEach(b => b.classList.toggle('sel', b.dataset.tpl === ez.tpl));
  buildEzForm();
  syncEzChips();
  syncEzSwatches();
  refreshEzLayers();
  schedEzPreview(0);
}

function buildEzForm(){
  const tpl = ezTpl();
  const holder = $('ez-text-fields');
  holder.innerHTML = '';
  const hiddenNames = ezHiddenSet();
  tpl.layers.filter(l => (l.kind === 'text' || l.kind === 'textbox') && EZ_EDIT_ROLES.includes(l.role) && !hiddenNames.includes(l.name)).forEach(l => {
    const saved = (ez.vals[tpl.id] || {})[l.name];
    const val = saved !== undefined ? saved : l.text;
    const multi = l.text.includes('\n');
    const f = document.createElement('div');
    f.className = 'ez-field';
    const fid = 'ezf-' + l.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    f.innerHTML = `<label for="${fid}">${escHtml(l.name)}</label><div class="ez-fieldrow">` +
      (multi ? `<textarea id="${fid}" rows="3"></textarea>` : `<input id="${fid}" type="text">`) +
      `<button class="ez-edit-btn" data-edit="${escHtml(l.name)}" title="Style this text">✎</button></div>`;
    f.querySelector('.ez-edit-btn').onclick = e => openTxtPop(e.currentTarget, l.name);
    const inp = f.querySelector('input,textarea');
    inp.value = val;
    inp.addEventListener('input', () => {
      (ez.vals[tpl.id] = ez.vals[tpl.id] || {})[l.name] = inp.value;
      schedEzPreview();
      clearTimeout(inp._lt); inp._lt = setTimeout(refreshEzLayers, 350);
    });
    holder.appendChild(f);
  });
}


function toggleChip(w){
  const cur = ezChips().slice();
  const i = cur.indexOf(w);
  if (i >= 0) cur.splice(i, 1);
  else {
    if (cur.length >= 4){ toast('4 points max — short and punchy sells', 'error'); return; }
    cur.push(w);
  }
  ez.chips = cur;
  syncEzChips();
  refreshEzLayers();
  schedEzPreview();
}
function buildEzChipRow(){
  const cr = $('ez-chips');
  cr.innerHTML = '';
  SELL_POINTS.forEach(w => {
    const c = document.createElement('button');
    c.className = 'ez-chip'; c.textContent = w; c.dataset.w = w;
    c.onclick = () => toggleChip(w);
    cr.appendChild(c);
  });
  ez.customPoints.forEach(w => {
    const c = document.createElement('button');
    c.className = 'ez-chip ez-chip-custom'; c.dataset.w = w;
    c.innerHTML = escHtml(w) + ' <span class="chip-x" title="Delete">✕</span>';
    c.onclick = e => {
      if (e.target.classList.contains('chip-x')){
        e.stopPropagation();
        ez.customPoints = ez.customPoints.filter(x => x !== w);
        jset('pgfx_custom_points', ez.customPoints);
        if (ez.chips) ez.chips = ez.chips.filter(x => x !== w);
        buildEzChipRow(); syncEzChips(); refreshEzLayers(); schedEzPreview();
        return;
      }
      toggleChip(w);
    };
    cr.appendChild(c);
  });
  syncEzChips();
}
function addCustomPoint(){
  const inp = $('ez-custom-point');
  const w = cleanText(inp.value, 'upper', '').trim();
  if (!w) return;
  if (w.length > 16){ toast('Keep it under 16 characters — punchy sells', 'error'); return; }
  if (!ez.customPoints.includes(w) && !SELL_POINTS.includes(w)){
    ez.customPoints.push(w);
    jset('pgfx_custom_points', ez.customPoints);
  }
  inp.value = '';
  buildEzChipRow();
  toggleChip(w);
}

function syncEzChips(){
  const on = ezChips();
  document.querySelectorAll('.ez-chip').forEach(c => c.classList.toggle('on', on.includes(c.dataset.w)));
}
function syncEzSwatches(){
  document.querySelectorAll('.ez-sw').forEach(b => b.classList.remove('sel'));
  if (ez.bg === null) document.querySelector('.ez-sw.orig').classList.add('sel');
  else if (ez.bg.type === 'image') $('ez-sw-photo').classList.add('sel');
  else {
    const idx = BG_PRESETS.indexOf(ez.bg);
    if (idx >= 0) document.querySelector(`.ez-sw[data-i="${idx}"]`).classList.add('sel');
    else $('ez-sw-custom').classList.add('sel');
  }
}

function renderEzCanvas(px, fmt, q){
  // Easy Mode is deliberately square-only — the guided flow targets Marketplace
  // & Instagram posts; rectangular formats live in the advanced editor
  const tpl = ezTpl();
  const sc = new fabric.StaticCanvas(null, { width:TPL_W, height:TPL_H, renderOnAddRemove:false });
  // solid base first: guarantees no transparent pixels can ever export as black
  sc.setBackgroundColor('#101014', () => {});
  // Template photos are showroom dressing (thumbnails only). A selected template
  // renders on its designed fallback so ads never share one generic stock photo.
  const rawBg = ez.bg || tpl.bg;
  const bgSpec = (!ez.bg && rawBg.type === 'image' && rawBg.src) ? (rawBg.fallback || { type:'solid', c:'#101014' }) : rawBg;
  let photoOk = false;
  if (bgSpec.type === 'image'){
    const im = ez.bgImgObj;   // the user's own photo — always theirs to use
    if (im && im.width > 0 && im.height > 0){
      sc.setBackgroundImage(coverImage(im, TPL_W, TPL_H), () => {});
      photoOk = true;
    }
  }
  if (!photoOk){
    // color/gradient backgrounds render as a locked bottom rect with a
    // percentage-unit gradient — unambiguous in fabric, identical at any export size
    const fb = bgSpec.type === 'image' ? { type:'solid', c:'#101014' } : bgSpec;
    sc.add(bgRectFor(fb, TPL_W, TPL_H));
  }
  const ov = ezOverlayRect(TPL_W, TPL_H);
  if (ov) sc.add(ov);
  const phone = $('ez-phone').value.trim();
  const site = $('ez-website').value.trim();
  const chips = ezChips();
  let hasBadgeLayer = false;
  const hiddenNames = (ez.hidden && ez.hidden[tpl.id]) || [];
  tpl.layers.forEach(l => {
    if (hiddenNames.includes(l.name)) return;
    if (l.role === 'badges'){
      hasBadgeLayer = true;
      if (!chips.length) return;
      const o = buildLayer(l, tpl.id);
      o.set('text', chips.map(c => '\u2022 ' + c).join('\n'));
      sc.add(o);
      return;
    }
    if (l.role === 'website' && !site) return; // no site typed → leave it off the ad
    const o = buildLayer(l, tpl.id);
    if (l.role === 'phone' && phone) o.set('text', formatPhone(phone));
    else if (l.role === 'website') o.set('text', cleanText(site, 'none', 'website'));
    else {
      const v = (ez.vals[tpl.id] || {})[l.name];
      if (v !== undefined) o.set('text', cleanText(v, l.casing || 'none', l.role));
    }
    sc.add((l.kind === 'text' || l.kind === 'textbox') ? ezApplyStyle(o, l, tpl.id) : o);
  });
  if (!hasBadgeLayer && chips.length){
    const synth = { kind:'text', name:'Badges', role:'badges', casing:'upper',
      props:{ left: TPL_W-30, top: 30, originX:'right', fontFamily:F_COND, fontSize:32, fill:'#000000',
              fontWeight:'900', backgroundColor:'#ffd200', padding:6 } };
    const bo = new fabric.IText(chips.map(c => '\u2022 ' + c).join('\n'), Object.assign({}, synth.props, {
      paintFirst:'stroke', name:'Badges', pgRole:'badges', pgCasing:'upper', pgTplId: tpl.id,
    }));
    sc.add(ezApplyStyle(bo, synth, tpl.id));
  }
  sc.renderAll();
  const url = sc.toDataURL({ format: fmt || 'jpeg', quality: q || 0.85, multiplier: (px || 560) / TPL_W });
  sc.dispose();
  return url;
}
function hexToRgba(hex, a){
  const h = hex.replace('#',''), n = parseInt(h.length === 3 ? h.split('').map(c=>c+c).join('') : h, 16);
  return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
}
function applyEzBlur(){
  const im = ez.bgImgObj;
  if (!im) return;
  try {
    im.filters = ez.fx.blur > 0 ? [new fabric.Image.filters.Blur({ blur: ez.fx.blur / 60 })] : [];
    im.applyFilters();
  } catch (e){ console.warn('blur unsupported here:', e); }
}
function bgRectFor(spec, w, h){
  const fill = spec.type === 'solid' ? spec.c : objGrad({ c1: spec.c1, c2: spec.c2, a: spec.a || 0 });
  return new fabric.Rect({ left:0, top:0, width:w || CW, height:h || CH, fill, selectable:false, evented:false, name:'BG' });
}
function ezOverlayRect(w, h){
  const f = ez.fx;
  if (f.overlay === 'none' || !f.os) return null;
  const a = f.os / 100;
  let fill;
  if (f.overlay === 'tint') fill = hexToRgba(f.oc, a * 0.75);
  else fill = new fabric.Gradient({
    type:'linear', gradientUnits:'percentage',
    coords: f.overlay === 'down' ? { x1:0.5, y1:0, x2:0.5, y2:1 } : { x1:0.5, y1:1, x2:0.5, y2:0 },
    colorStops:[ { offset:0, color:'rgba(0,0,0,0)' }, { offset:0.45, color: hexToRgba(f.oc, a * 0.25) }, { offset:1, color: hexToRgba(f.oc, a) } ],
  });
  return new fabric.Rect({ left:0, top:0, width:w || CW, height:h || CH, fill, selectable:false, evented:false, name:'Overlay' });
}
let _ezSaveT = null;
function persistEzState(){
  clearTimeout(_ezSaveT);
  _ezSaveT = setTimeout(() => {
    jset('pgfx_ez_state', {
      tpl: ez.tpl, vals: ez.vals, chips: ez.chips, styles: ez.styles, fx: ez.fx, hidden: ez.hidden,
      bg: (ez.bg && ez.bg.type !== 'image') ? ez.bg : null,   // photos live in Recents; specs persist
    });
  }, 400);
}
function restoreEzState(){
  const st = jget('pgfx_ez_state', null);
  if (!st) return;
  if (st.vals) ez.vals = st.vals;
  if (st.chips) ez.chips = st.chips;
  if (st.styles) ez.styles = st.styles;
  if (st.fx) ez.fx = Object.assign(ez.fx, st.fx);
  if (st.hidden) ez.hidden = st.hidden;
  if (st.bg) ez.bg = st.bg;
}
function schedEzPreview(delay){
  persistEzState();
  clearTimeout(ezPrevTimer);
  ezPrevTimer = setTimeout(() => { $('ez-preview').src = renderEzCanvas(560, 'jpeg'); }, delay === 0 ? 0 : 250);
}

async function ezDownload(){
  const phone = $('ez-phone').value.trim();
  if (!phone){
    toast('Type your phone number first — buyers need to reach you', 'error');
    $('ez-phone').focus();
    $('ez-phone').scrollIntoView({ behavior:'smooth', block:'center' });
    return;
  }
  const gate = await gateExport(ezExportPx());
  if (!gate) return;
  let url = renderEzCanvas(gate.px, 'png');
  if (gate.watermark) url = await applyWatermark(url, gate.px);
  try { await recordExport(); }
  catch (e){ toast('Export could not be recorded: ' + e.message, 'error'); return; }
  const a = document.createElement('a');
  a.href = url;
  a.download = ezTpl().name.toLowerCase().replace(/[^a-z0-9]+/g,'-') + '-ad-' + gate.px + '.png';
  document.body.appendChild(a); a.click(); a.remove();
  addHistory(a.download, gate.px, url);
  toast('Downloaded — go post it!', 'success');
}

function openAdvancedFromEz(){
  const tpl = ezTpl();
  showEditor();
  loadTemplate(tpl.id);
  // carry the simple-mode choices onto the live canvas
  const phone = $('ez-phone').value.trim();
  const site = $('ez-website').value.trim();
  const chips = ezChips();
  const vals = ez.vals[tpl.id] || {};
  const hiddenNames = (ez.hidden && ez.hidden[tpl.id]) || [];
  canvas.getObjects().slice().forEach(o => {
    if (hiddenNames.includes(o.name)){ canvas.remove(o); return; }
    if (o.pgRole === 'badges'){
      if (chips.length) o.set('text', chips.map(c => '\u2022 ' + c).join('\n'));
      else canvas.remove(o);
      return;
    }
    if (o.pgRole === 'phone' && phone) o.set('text', formatPhone(phone));
    else if (o.pgRole === 'website'){
      if (site) o.set('text', cleanText(site, 'none', 'website'));
      else canvas.remove(o);
    }
    else if (vals[o.name] !== undefined) o.set('text', cleanText(vals[o.name], o.pgCasing || 'none', o.pgRole));
    const stOv = (ez.styles[tpl.id] || {})[o.name];
    if (stOv && o.text !== undefined){
      const baseL = tpl.layers.find(x => x.name === o.name);
      o.set(ezStyleProps(stOv, (baseL && baseL.props) || {}));
      if (stOv.curve) textToCurved(o, stOv.curve);
    }
  });
  if (ez.bg && ez.bg.type === 'image' && ez.bgData) setBgFromDataUrl(ez.bgData, false, ez.fx.blur);
  else if (ez.bg){ bgState = Object.assign({}, ez.bg); applyBgSpec(canvas, bgState); syncBgControls(); }
  const ovAdv = ezOverlayRect();
  if (ovAdv){ canvas.add(ovAdv); canvas.sendToBack(ovAdv); }
  canvas.renderAll();
  pushHist();
  refreshQuickFields();
  refreshLayers();
}

// ═══════════════ WIRE UP UI (called once) ═══════════════
let uiBound = false;
function bindEditorUI(){
  if (uiBound) return;
  uiBound = true;

  // tabs
  document.querySelectorAll('[data-ltab]').forEach(b => b.onclick = () => switchLTab(b.dataset.ltab));
  document.querySelectorAll('[data-rtab]').forEach(b => b.onclick = () => switchRTab(b.dataset.rtab));

  // drawers
  $('left-drawer-tab').onclick = () => {
    const p = $('panel-left');
    p.classList.toggle('collapsed');
    $('left-drawer-tab').textContent = p.classList.contains('collapsed') ? '▶' : '◀';
    setTimeout(fitZoom, 300);
  };
  $('right-drawer-tab').onclick = () => {
    const p = $('panel-right');
    p.classList.toggle('collapsed');
    $('right-drawer-tab').textContent = p.classList.contains('collapsed') ? '◀' : '▶';
    setTimeout(fitZoom, 300);
  };

  // topbar
  $('ed-logo').onclick = () => showEasy(null);
  $('tb-switch').onclick = openPicker;
  $('undo-btn').onclick = undo;
  $('redo-btn').onclick = redo;
  $('enhance-btn').onclick = enhance;
  $('help-btn').onclick = startTutorial;
  $('brand-btn').onclick = openBrandModal;
  $('save-tpl-btn').onclick = () => {
    $('st-name').value = currentTplName === 'Untitled ad' ? '' : currentTplName;
    $('savetpl-overlay').classList.add('show');
    setTimeout(() => $('st-name').focus(), 60);
  };
  $('export-btn').onclick = openExport;

  // zoom
  $('zoom-in').onclick = () => setZoom(zoomScale * 1.2);
  $('zoom-out').onclick = () => setZoom(zoomScale / 1.2);
  $('zoom-pct').onclick = fitZoom;

  // picker
  $('picker-close').onclick = closePicker;
  document.querySelectorAll('#picker-filters button').forEach(b => b.onclick = () => buildPickerGrid(b.dataset.f));
  $('picker-cat').addEventListener('change', () => { setCategory($('picker-cat').value); buildPickerGrid('all'); });

  // brand modal
  $('bk-cancel').onclick = () => $('brand-overlay').classList.remove('show');
  $('bk-save').onclick = () => {
    jset('pgfx_brand', { phone: $('bk-phone').value.trim(), website: $('bk-website').value.trim(), name: $('bk-name').value.trim() });
    $('brand-overlay').classList.remove('show');
    applyBrandToCanvas(false);
    toast('Brand kit saved', 'success');
  };

  // save-template modal
  $('st-cancel').onclick = () => $('savetpl-overlay').classList.remove('show');
  $('st-save').onclick = () => {
    const name = $('st-name').value.trim();
    if (!name){ $('st-name').focus(); return; }
    $('savetpl-overlay').classList.remove('show');
    saveCurrentAsTemplate(name);
  };
  $('st-name').addEventListener('keydown', e => { if (e.key === 'Enter') $('st-save').click(); });

  // canvas format
  const fsel = $('tb-format');
  if (fsel){
    Object.keys(FORMATS).forEach(k => {
      const f = FORMATS[k], op = document.createElement('option');
      op.value = k; op.textContent = f.label + ' · ' + f.w + '×' + f.h;
      op.title = f.hint;
      fsel.appendChild(op);
    });
    fsel.value = docFormat;
    fsel.onchange = () => setFormat(fsel.value);
  }

  // export modal
  document.querySelectorAll('#export-size-seg button').forEach(b => b.onclick = () => {
    document.querySelectorAll('#export-size-seg button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    exportSize = +b.dataset.size;
  });
  $('ex-cancel').onclick = () => $('export-overlay').classList.remove('show');
  $('ex-download').onclick = doExport;
  const exOrder = $('ex-order');
  if (exOrder) exOrder.onclick = () => orderPrints(false);
  syncPartnerUI();   // hidden unless a signed-in member of both platforms

  // overlay click-to-close
  document.querySelectorAll('.modal-overlay').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.remove('show'); }));

  // tutorial buttons
  $('tut-next').onclick = () => { tutIdx++; if (tutIdx >= TUT_STEPS.length) endTutorial(); else renderTutStep(); };
  $('tut-back').onclick = () => { if (tutIdx > 0){ tutIdx--; renderTutStep(); } };
  $('tut-skip').onclick = endTutorial;

  // add tab
  document.querySelectorAll('[data-add]').forEach(b => b.onclick = () => addElement(b.dataset.add));
  $('add-image-btn').onclick = () => $('add-image-file').click();
  $('add-image-file').addEventListener('change', e => { const f = e.target.files[0]; if (f) addImageFromFile(f); e.target.value=''; });
  const eg = $('emoji-grid');
  EMOJIS.forEach(em => { const b = document.createElement('button'); b.textContent = em; b.onclick = () => addEmoji(em); eg.appendChild(b); });

  buildCatSelect($('adv-cat'));
  buildChips();
  bindBgControls();
  bindPropsControls();
  bindViewMenu();
  bindBackgroundsUI();
  refreshMyTemplates();

  // keyboard
  document.addEventListener('keydown', e => {
    if (!$('page-editor').classList.contains('active')) return;
    if ($('tut-overlay').classList.contains('active') && e.key === 'Escape'){ endTutorial(); return; }
    if (e.key === 'Escape'){ document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show')); return; }
    const tag = (e.target.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    const editing = canvas && canvas.getActiveObject() && canvas.getActiveObject().isEditing;
    if (editing) return;
    if (e.key === 'Delete' || e.key === 'Backspace'){ e.preventDefault(); deleteSelected(); }
    if (e.key === ' ' && !spaceDown){ spaceDown = true; $('stage').style.cursor = 'grab'; e.preventDefault(); }
    if (e.ctrlKey || e.metaKey){
      const k = e.key.toLowerCase();
      if (k === 'z'){ e.preventDefault(); e.shiftKey ? redo() : undo(); }
      if (k === 'y'){ e.preventDefault(); redo(); }
      if (k === 'd'){ e.preventDefault(); duplicateSelected(); }
      if (k === 's'){ e.preventDefault(); $('save-tpl-btn').click(); }
      if (k === 'e'){ e.preventDefault(); openExport(); }
      if (k === 'c'){ copySelected(); }
      if (k === 'x'){ copySelected(); deleteSelected(); }
      if (k === 'v'){ e.preventDefault(); pasteClipboard(); }
      if (k === 'a'){ e.preventDefault(); selectAllObjects(); }
      if (k === '0'){ e.preventDefault(); fitZoom(); }
    }
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){
      const o = canvas && canvas.getActiveObject();
      if (o){
        e.preventDefault();
        const step = e.shiftKey ? 10 : 2;
        if (e.key === 'ArrowUp') o.top -= step;
        if (e.key === 'ArrowDown') o.top += step;
        if (e.key === 'ArrowLeft') o.left -= step;
        if (e.key === 'ArrowRight') o.left += step;
        o.setCoords(); canvas.requestRenderAll(); debouncePush(600);
      }
    }
  });

  document.addEventListener('keyup', e => {
    if (e.key === ' '){ spaceDown = false; panDrag = null; $('stage').style.cursor = ''; }
  });

  // wheel over the canvas area = zoom (Pixlr-style)
  const stage = $('stage');
  stage.addEventListener('wheel', e => {
    e.preventDefault();
    setZoom(zoomScale * (e.deltaY < 0 ? 1.08 : 1/1.08));
  }, { passive:false });

  // hold Space + drag = pan when zoomed in
  stage.addEventListener('mousedown', e => {
    if (!spaceDown) return;
    panDrag = { x:e.clientX, y:e.clientY, sl:stage.scrollLeft, st:stage.scrollTop };
    stage.style.cursor = 'grabbing';
    e.preventDefault(); e.stopPropagation();
  }, true);
  window.addEventListener('mousemove', e => {
    if (!panDrag) return;
    stage.scrollLeft = panDrag.sl - (e.clientX - panDrag.x);
    stage.scrollTop  = panDrag.st - (e.clientY - panDrag.y);
  });
  window.addEventListener('mouseup', () => { if (panDrag){ panDrag = null; $('stage').style.cursor = spaceDown ? 'grab' : ''; } });

  window.addEventListener('resize', () => {
    if ($('page-editor').classList.contains('active')) fitZoom();
    if ($('tut-overlay').classList.contains('active')) renderTutStep();
  });
}

// ═══════════════ CLIPBOARD & SELECT ALL ═══════════════
let _clip = null, spaceDown = false, panDrag = null;
function copySelected(){
  const o = canvas && canvas.getActiveObject();
  if (!o) return;
  o.clone(cl => { _clip = cl; }, EXTRA_PROPS);
}
function pasteClipboard(){
  if (!_clip || !canvas) return;
  _clip.clone(cl => {
    canvas.discardActiveObject();
    cl.set({ left:(cl.left||0)+26, top:(cl.top||0)+26, evented:true, selectable:true });
    if (cl.type === 'activeSelection'){
      cl.canvas = canvas;
      cl.forEachObject(x => canvas.add(x));
      cl.setCoords();
    } else {
      canvas.add(cl);
    }
    canvas.setActiveObject(cl);
    canvas.requestRenderAll();
    pushHist(); refreshLayers(); refreshQuickFields(); refreshProps();
  }, EXTRA_PROPS);
}
function selectAllObjects(){
  if (!canvas) return;
  const objs = canvas.getObjects().filter(o => o.selectable !== false && o.visible !== false && !o.pgBgRect && !o.pgScrim);
  if (!objs.length) return;
  canvas.discardActiveObject();
  const sel = new fabric.ActiveSelection(objs, { canvas });
  canvas.setActiveObject(sel);
  canvas.requestRenderAll();
  refreshProps();
}

// ═══════════════ BOOT ═══════════════
const CSS_FALLBACK = "\n:root{\n  --bg:#0a0a0c; --surface:#121215; --surface2:#1a1a1f; --surface3:#232329;\n  --border:#2a2a32; --border2:#3a3a45;\n  --orange:#ff4d00; --orange2:#ff7a33; --gold:#f5a623;\n  --green:#22c55e; --red:#ef4444;\n  --text:#f4f4f5; --muted:#8b8b96; --muted2:#b6b6c0;\n  --r:10px;\n  /* aliases used by easy-mode / view / backgrounds styles */\n  --panel:var(--surface); --panel2:var(--surface2); --line:var(--border);\n  --accent:var(--orange); --ui:'Instrument Sans',sans-serif;\n}\n*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}\nhtml{scroll-behavior:smooth}\nbody{font-family:'Instrument Sans',sans-serif;background:var(--bg);color:var(--text);overflow-x:hidden}\nbutton{font-family:inherit}\ninput,textarea,select{font-family:inherit;color:var(--text)}\n::-webkit-scrollbar{width:9px;height:9px}\n::-webkit-scrollbar-track{background:transparent}\n::-webkit-scrollbar-thumb{background:var(--border2);border-radius:5px}\n::-webkit-scrollbar-thumb:hover{background:#4a4a56}\n:focus-visible{outline:2px solid var(--orange);outline-offset:2px}\n@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}\n\n/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 SHARED \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */\n.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:9px 18px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;border:none;text-decoration:none;transition:background .15s,color .15s,border-color .15s,transform .15s,box-shadow .15s;white-space:nowrap;line-height:1.2}\n.btn-primary{background:var(--orange);color:#fff;box-shadow:0 3px 16px rgba(255,77,0,.3)}\n.btn-primary:hover{background:var(--orange2);transform:translateY(-1px)}\n.btn-ghost{background:transparent;color:var(--muted2)}\n.btn-ghost:hover{color:var(--text);background:var(--surface2)}\n.btn-outline{background:transparent;color:var(--text);border:1px solid var(--border2)}\n.btn-outline:hover{border-color:var(--orange);color:var(--orange2)}\n.btn-dark{background:var(--surface3);color:var(--text);border:1px solid var(--border)}\n.btn-dark:hover{background:#2b2b33}\n.btn-xl{padding:16px 34px;font-size:16px;border-radius:11px}\n.btn:disabled{opacity:.4;cursor:not-allowed;transform:none}\n\n.notif{position:fixed;bottom:26px;left:50%;transform:translate(-50%,16px);background:var(--surface3);border:1px solid var(--border2);color:var(--text);padding:11px 20px;border-radius:10px;font-size:14px;font-weight:600;z-index:9500;opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;box-shadow:0 10px 40px rgba(0,0,0,.5);max-width:min(90vw,480px);text-align:center}\n.notif.show{opacity:1;transform:translate(-50%,0)}\n.notif.success{border-color:rgba(34,197,94,.45)}\n.notif.error{border-color:rgba(239,68,68,.5)}\n\n/* modal */\n.modal-overlay{position:fixed;inset:0;background:rgba(5,5,7,.72);backdrop-filter:blur(6px);z-index:8000;display:none;align-items:center;justify-content:center;padding:24px}\n.modal-overlay.show{display:flex}\n.modal{background:var(--surface);border:1px solid var(--border);border-radius:16px;width:100%;max-width:520px;padding:26px;box-shadow:0 30px 80px rgba(0,0,0,.6);animation:pop .18s ease}\n@keyframes pop{from{transform:scale(.96);opacity:0}to{transform:scale(1);opacity:1}}\n.modal h3{font-size:19px;margin-bottom:4px}\n.modal .modal-sub{font-size:13px;color:var(--muted);margin-bottom:18px}\n.modal label{display:block;font-size:12px;font-weight:600;color:var(--muted2);margin:14px 0 6px;text-transform:uppercase;letter-spacing:.5px}\n.modal input[type=text],.modal input[type=tel]{width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:11px 13px;font-size:14px}\n.modal input:focus{border-color:var(--orange);outline:none}\n.modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:24px}\n\n/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 LANDING \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */\n#page-landing{min-height:100vh}\n.lp-nav{position:fixed;top:0;left:0;right:0;z-index:300;height:62px;display:flex;align-items:center;padding:0 clamp(16px,4vw,40px);background:rgba(10,10,12,.82);backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,.05)}\n.logo{font-family:'Bebas Neue';font-size:23px;letter-spacing:1.5px;color:var(--text);text-decoration:none;display:flex;align-items:center;gap:9px;cursor:pointer;background:none;border:none}\n.logo .logo-mark{width:28px;height:28px;border-radius:7px;background:linear-gradient(135deg,var(--orange),var(--gold));display:inline-flex;align-items:center;justify-content:center;font-size:15px;color:#fff}\n.logo em{font-style:normal;color:var(--orange)}\n.lp-nav-links{display:flex;gap:26px;margin-left:44px}\n.lp-nav-links a{font-size:14px;font-weight:500;color:var(--muted2);text-decoration:none;transition:color .15s}\n.lp-nav-links a:hover{color:var(--text)}\n.lp-nav-right{margin-left:auto}\n@media(max-width:640px){.lp-nav-links{display:none}}\n\n.hero{padding:150px clamp(16px,5vw,48px) 90px;max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1.05fr .95fr;gap:60px;align-items:center;min-height:88vh}\n@media(max-width:900px){.hero{grid-template-columns:1fr;padding-top:120px;gap:44px;min-height:0}}\n.hero-eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--gold);background:rgba(245,166,35,.08);border:1px solid rgba(245,166,35,.25);border-radius:100px;padding:7px 15px;margin-bottom:22px}\n.hero h1{font-family:'Bebas Neue';font-size:clamp(52px,7vw,92px);line-height:.94;letter-spacing:.5px;margin-bottom:20px}\n.hero h1 em{font-style:normal;color:var(--orange)}\n.hero p{font-size:17px;line-height:1.65;color:var(--muted2);max-width:480px;margin-bottom:32px}\n.hero-ctas{display:flex;gap:14px;flex-wrap:wrap}\n.hero-note{margin-top:18px;font-size:13px;color:var(--muted)}\n\n.hero-stack{position:relative;height:460px}\n@media(max-width:900px){.hero-stack{height:380px;max-width:440px;margin:0 auto;width:100%}}\n.hero-card{position:absolute;width:62%;aspect-ratio:1;border-radius:16px;overflow:hidden;border:1px solid var(--border2);box-shadow:0 24px 70px rgba(0,0,0,.55);background:var(--surface2);transition:transform .4s ease}\n.hero-card img{width:100%;height:100%;object-fit:cover;display:block}\n.hero-card.hc1{top:6%;left:0;transform:rotate(-7deg);z-index:1}\n.hero-card.hc2{top:0;right:2%;transform:rotate(4deg);z-index:2}\n.hero-card.hc3{bottom:0;left:19%;transform:rotate(-1.5deg);z-index:3;box-shadow:0 30px 90px rgba(255,77,0,.18),0 24px 70px rgba(0,0,0,.55)}\n.hero-stack:hover .hc1{transform:rotate(-9deg) translateY(-6px)}\n.hero-stack:hover .hc2{transform:rotate(6deg) translateY(-6px)}\n.hero-stack:hover .hc3{transform:rotate(0) translateY(-8px)}\n.hero-card .hc-skel{position:absolute;inset:0;background:linear-gradient(110deg,var(--surface2) 40%,var(--surface3) 50%,var(--surface2) 60%);background-size:200% 100%;animation:shimmer 1.4s infinite}\n@keyframes shimmer{to{background-position:-200% 0}}\n\n.lp-section{max-width:1200px;margin:0 auto;padding:80px clamp(16px,5vw,48px)}\n.lp-section-head{margin-bottom:38px}\n.lp-kicker{font-size:12.5px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:var(--orange);margin-bottom:10px}\n.lp-section-head h2{font-family:'Bebas Neue';font-size:clamp(34px,4.5vw,52px);letter-spacing:.5px;line-height:1}\n.lp-section-head p{color:var(--muted);font-size:15px;margin-top:10px;max-width:560px;line-height:1.6}\n\n.tpl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(236px,1fr));gap:20px}\n.tpl-card{position:relative;border-radius:14px;overflow:hidden;border:1px solid var(--border);background:var(--surface2);cursor:pointer;transition:transform .2s,border-color .2s,box-shadow .2s;aspect-ratio:1}\n.tpl-card:hover{transform:translateY(-4px);border-color:var(--orange);box-shadow:0 16px 48px rgba(255,77,0,.14)}\n.tpl-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}\n.tpl-card .tpl-veil{position:absolute;inset:0;backdrop-filter:blur(1.6px) brightness(.86);transition:backdrop-filter .25s,opacity .25s}\n.tpl-card:hover .tpl-veil{backdrop-filter:blur(0) brightness(1);opacity:0}\n.tpl-card .tpl-meta{position:absolute;left:0;right:0;bottom:0;padding:38px 14px 12px;background:linear-gradient(to top,rgba(0,0,0,.85),transparent);display:flex;align-items:flex-end;justify-content:space-between;gap:8px}\n.tpl-card .tpl-name{font-weight:700;font-size:14.5px;text-shadow:0 1px 6px rgba(0,0,0,.7)}\n.tpl-card .tpl-tag{font-size:10.5px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--gold);background:rgba(0,0,0,.55);border:1px solid rgba(245,166,35,.4);border-radius:5px;padding:3px 7px}\n.tpl-card .tpl-use{position:absolute;top:12px;right:12px;background:var(--orange);color:#fff;font-size:12.5px;font-weight:800;padding:7px 13px;border-radius:7px;opacity:0;transform:translateY(-6px);transition:opacity .2s,transform .2s;box-shadow:0 6px 20px rgba(0,0,0,.4)}\n.tpl-card:hover .tpl-use{opacity:1;transform:translateY(0)}\n.tpl-card .tpl-skel{position:absolute;inset:0;background:linear-gradient(110deg,var(--surface2) 40%,var(--surface3) 50%,var(--surface2) 60%);background-size:200% 100%;animation:shimmer 1.4s infinite}\n.tpl-card.tpl-saved-card .tpl-del{position:absolute;top:12px;left:12px;background:rgba(0,0,0,.6);border:1px solid var(--border2);color:var(--muted2);width:30px;height:30px;border-radius:7px;cursor:pointer;font-size:14px;opacity:0;transition:opacity .2s}\n.tpl-card.tpl-saved-card:hover .tpl-del{opacity:1}\n.tpl-card .tpl-del:hover{color:var(--red);border-color:var(--red)}\n\n.flow{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}\n@media(max-width:820px){.flow{grid-template-columns:1fr}}\n.flow-step{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:26px}\n.flow-step .fs-num{font-family:'Bebas Neue';font-size:15px;letter-spacing:2px;color:var(--orange);margin-bottom:14px}\n.flow-step h3{font-size:17px;margin-bottom:8px}\n.flow-step p{font-size:14px;color:var(--muted);line-height:1.6}\n\n.lp-cta{max-width:1200px;margin:0 auto 90px;padding:0 clamp(16px,5vw,48px)}\n.lp-cta-inner{background:linear-gradient(135deg,rgba(255,77,0,.14),rgba(245,166,35,.08));border:1px solid rgba(255,77,0,.3);border-radius:20px;padding:56px 40px;text-align:center}\n.lp-cta-inner h2{font-family:'Bebas Neue';font-size:clamp(36px,5vw,58px);letter-spacing:.5px;margin-bottom:12px}\n.lp-cta-inner p{color:var(--muted2);margin-bottom:28px;font-size:15px}\n.lp-footer{border-top:1px solid var(--border);padding:26px clamp(16px,5vw,48px);display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;color:var(--muted);font-size:13px}\n\n\n/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 EDITOR \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */\n#page-editor{display:none;height:100vh;flex-direction:column;overflow:hidden}\n#page-editor.active{display:flex}\n#page-landing.hidden{display:none}\n\n.topbar{height:56px;flex:0 0 56px;display:flex;align-items:center;gap:10px;padding:0 14px;background:var(--surface);border-bottom:1px solid var(--border);z-index:100}\n.topbar .logo{font-size:20px}\n.tb-sep{width:1px;height:26px;background:var(--border);margin:0 4px}\n.tb-tplname{font-size:13px;font-weight:600;color:var(--muted2);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.tb-btn{display:inline-flex;align-items:center;gap:6px;background:transparent;border:1px solid transparent;color:var(--muted2);font-size:13px;font-weight:600;padding:7px 11px;border-radius:8px;cursor:pointer;transition:background .15s,color .15s}\n.tb-btn:hover{background:var(--surface2);color:var(--text)}\n.tb-btn:disabled{opacity:.35;cursor:default;background:transparent}\n.tb-btn svg{width:16px;height:16px}\n.tb-spacer{flex:1}\n#enhance-btn{border:1px solid rgba(245,166,35,.4);color:var(--gold);background:rgba(245,166,35,.07)}\n#enhance-btn:hover{background:rgba(245,166,35,.14);color:#ffd060}\n#enhance-btn.busy{opacity:.6;pointer-events:none}\n#export-btn{background:var(--orange);color:#fff;border:none;font-weight:700}\n#export-btn:hover{background:var(--orange2)}\n@media(max-width:900px){.tb-label{display:none}}\n\n.editor-body{flex:1;display:flex;overflow:hidden;position:relative}\n\n/* panels as drawers */\n.panel{background:var(--surface);display:flex;flex-direction:column;position:relative;transition:margin .28s ease;z-index:50}\n.panel-left{width:300px;flex:0 0 300px;border-right:1px solid var(--border)}\n.panel-right{width:300px;flex:0 0 300px;border-left:1px solid var(--border)}\n.panel-left.collapsed{margin-left:-300px}\n.panel-right.collapsed{margin-right:-300px}\n.drawer-tab{position:absolute;top:50%;transform:translateY(-50%);width:20px;height:64px;background:var(--surface2);border:1px solid var(--border);color:var(--muted);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px;z-index:60;transition:color .15s,background .15s}\n.drawer-tab:hover{color:var(--text);background:var(--surface3)}\n.panel-left .drawer-tab{right:-20px;border-left:none;border-radius:0 8px 8px 0}\n.panel-right .drawer-tab{left:-20px;border-right:none;border-radius:8px 0 0 8px}\n\n.panel-tabs{display:flex;border-bottom:1px solid var(--border);flex:0 0 auto}\n.panel-tabs button{flex:1;background:none;border:none;border-bottom:2px solid transparent;color:var(--muted);font-size:12.5px;font-weight:700;padding:12px 4px;cursor:pointer;transition:color .15s,border-color .15s;letter-spacing:.2px}\n.panel-tabs button:hover{color:var(--muted2)}\n.panel-tabs button.active{color:var(--text);border-bottom-color:var(--orange)}\n.panel-scroll{flex:1;overflow-y:auto;padding:16px 14px 40px}\n.panel-tabview{display:none}\n.panel-tabview.active{display:block}\n\n.psec{margin-bottom:22px}\n.psec-title{font-size:11px;font-weight:800;letter-spacing:1.1px;text-transform:uppercase;color:var(--muted);margin-bottom:10px;display:flex;align-items:center;justify-content:space-between}\n.field{margin-bottom:11px}\n.field label{display:block;font-size:12px;font-weight:600;color:var(--muted2);margin-bottom:5px}\n.field input[type=text],.field input[type=tel],.field input[type=number],.field textarea,.field select{width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:7px;padding:8px 10px;font-size:13px;transition:border-color .15s}\n.field textarea{resize:vertical;min-height:56px;line-height:1.4}\n.field input:focus,.field textarea:focus,.field select:focus{border-color:var(--orange);outline:none}\n.field-row{display:flex;gap:8px}\n.field-row .field{flex:1}\ninput[type=color]{width:100%;height:34px;border:1px solid var(--border);border-radius:7px;background:var(--surface2);cursor:pointer;padding:3px}\ninput[type=range]{width:100%;accent-color:var(--orange)}\n\n.chips{display:flex;flex-wrap:wrap;gap:7px}\n.chip{background:var(--surface2);border:1px solid var(--border);color:var(--muted2);font-size:12px;font-weight:800;padding:7px 11px;border-radius:100px;cursor:pointer;transition:all .13s;letter-spacing:.3px}\n.chip:hover{border-color:var(--gold);color:var(--gold);background:rgba(245,166,35,.07)}\n\n.seg{display:flex;background:var(--surface2);border:1px solid var(--border);border-radius:8px;overflow:hidden}\n.seg button{flex:1;background:none;border:none;color:var(--muted);font-size:12px;font-weight:700;padding:8px 6px;cursor:pointer;transition:background .13s,color .13s}\n.seg button.active{background:var(--surface3);color:var(--text)}\n.seg button:hover:not(.active){color:var(--muted2)}\n\n.add-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}\n.add-btn{background:var(--surface2);border:1px solid var(--border);border-radius:9px;color:var(--muted2);font-size:12.5px;font-weight:600;padding:13px 8px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px;transition:all .13s}\n.add-btn:hover{border-color:var(--orange);color:var(--text)}\n.add-btn .ab-ico{font-size:19px;line-height:1}\n.emoji-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}\n.emoji-grid button{background:var(--surface2);border:1px solid var(--border);border-radius:8px;font-size:21px;padding:8px 0;cursor:pointer;transition:all .13s}\n.emoji-grid button:hover{border-color:var(--orange);transform:scale(1.08)}\n\n.mini-tpl-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}\n.mini-tpl{position:relative;border-radius:9px;overflow:hidden;border:1px solid var(--border);cursor:pointer;aspect-ratio:1;background:var(--surface2);transition:border-color .15s,transform .15s}\n.mini-tpl:hover{border-color:var(--orange);transform:translateY(-2px)}\n.mini-tpl.current{border-color:var(--orange);box-shadow:0 0 0 1px var(--orange)}\n.mini-tpl img{width:100%;height:100%;object-fit:cover;display:block}\n.mini-tpl .mt-name{position:absolute;left:0;right:0;bottom:0;font-size:10.5px;font-weight:700;padding:14px 7px 5px;background:linear-gradient(to top,rgba(0,0,0,.85),transparent);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.mini-tpl .mt-del{position:absolute;top:5px;right:5px;width:22px;height:22px;border-radius:6px;background:rgba(0,0,0,.6);border:1px solid var(--border2);color:var(--muted2);font-size:11px;cursor:pointer;opacity:0;transition:opacity .15s}\n.mini-tpl:hover .mt-del{opacity:1}\n.mini-tpl .mt-del:hover{color:var(--red);border-color:var(--red)}\n.empty-hint{font-size:12.5px;color:var(--muted);line-height:1.55;background:var(--surface2);border:1px dashed var(--border2);border-radius:9px;padding:14px;text-align:center}\n\n/* stage */\n.stage{flex:1;position:relative;display:flex;overflow:auto;padding:26px;box-sizing:border-box;background:radial-gradient(circle at 50% 40%,#131316 0%,#0b0b0e 100%)}\n.stage::before{content:'';position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.045) 1px,transparent 1px);background-size:26px 26px;pointer-events:none}\n#canvas-holder{position:relative;box-shadow:0 24px 90px rgba(0,0,0,.6);border-radius:4px;overflow:hidden;margin:auto}\n#guide-v,#guide-h{position:absolute;background:var(--orange);opacity:0;pointer-events:none;transition:opacity .08s;z-index:20;box-shadow:0 0 6px rgba(255,77,0,.8)}\n#guide-v{top:0;bottom:0;left:50%;width:1px;transform:translateX(-.5px)}\n#guide-h{left:0;right:0;top:50%;height:1px;transform:translateY(-.5px)}\n#guide-v.on,#guide-h.on{opacity:1}\n.zoombar{position:absolute;right:18px;bottom:16px;display:flex;align-items:center;gap:2px;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:4px;z-index:70;box-shadow:0 8px 30px rgba(0,0,0,.4)}\n.zoombar button{background:none;border:none;color:var(--muted2);width:30px;height:30px;border-radius:7px;cursor:pointer;font-size:15px;font-weight:700}\n.zoombar button:hover{background:var(--surface2);color:var(--text)}\n.zoombar .zb-pct{font-size:12px;font-weight:700;color:var(--muted2);min-width:44px;text-align:center;cursor:pointer;border-radius:7px;padding:6px 2px}\n.zoombar .zb-pct:hover{background:var(--surface2);color:var(--text)}\n\n/* layers */\n.layer-row{display:flex;align-items:center;gap:9px;padding:8px 9px;border-radius:8px;cursor:pointer;border:1px solid transparent;transition:background .12s,border-color .12s;margin-bottom:3px}\n.layer-row:hover{background:var(--surface2)}\n.layer-row.selected{background:rgba(255,77,0,.09);border-color:rgba(255,77,0,.4)}\n.layer-row.hidden-l{opacity:.4}\n.layer-ico{width:26px;height:26px;flex:0 0 26px;border-radius:6px;background:var(--surface3);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:var(--muted2)}\n.layer-row .li-text{color:var(--orange2)}\n.layer-main{flex:1;min-width:0}\n.layer-name{font-size:12.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.layer-prev{font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}\n.layer-acts{display:flex;gap:2px;flex:0 0 auto}\n.layer-acts button{background:none;border:none;color:var(--muted);width:24px;height:24px;border-radius:6px;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center}\n.layer-acts button:hover{background:var(--surface3);color:var(--text)}\n.layer-acts button.on{color:var(--orange)}\n\n.icon-row{display:flex;gap:7px}\n.icon-row button{flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--muted2);padding:8px 4px;cursor:pointer;font-size:13px;font-weight:700;transition:all .13s}\n.icon-row button:hover{border-color:var(--border2);color:var(--text)}\n.icon-row button.active{border-color:var(--orange);color:var(--orange2);background:rgba(255,77,0,.07)}\n\n/* template picker modal */\n.picker-modal{max-width:960px;max-height:86vh;display:flex;flex-direction:column;padding:0;overflow:hidden}\n.picker-head{padding:22px 26px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:14px;flex-wrap:wrap}\n.picker-head h3{font-size:20px;flex:1}\n.picker-filters{display:flex;gap:6px}\n.picker-filters button{background:var(--surface2);border:1px solid var(--border);color:var(--muted2);font-size:12.5px;font-weight:700;padding:7px 14px;border-radius:100px;cursor:pointer;transition:all .13s}\n.picker-filters button.active{background:rgba(255,77,0,.1);border-color:var(--orange);color:var(--orange2)}\n.picker-body{flex:1;overflow-y:auto;padding:22px 26px 30px}\n.picker-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(196px,1fr));gap:16px}\n.resume-card{grid-column:1/-1;display:flex;align-items:center;gap:16px;background:linear-gradient(135deg,rgba(255,77,0,.1),rgba(245,166,35,.06));border:1px solid rgba(255,77,0,.35);border-radius:12px;padding:14px 16px;cursor:pointer;transition:border-color .15s}\n.resume-card:hover{border-color:var(--orange)}\n.resume-card img{width:64px;height:64px;border-radius:9px;object-fit:cover;border:1px solid var(--border2)}\n.resume-card .rc-title{font-weight:800;font-size:14.5px}\n.resume-card .rc-sub{font-size:12.5px;color:var(--muted);margin-top:2px}\n.picker-close{background:none;border:none;color:var(--muted);font-size:20px;cursor:pointer;width:34px;height:34px;border-radius:8px}\n.picker-close:hover{background:var(--surface2);color:var(--text)}\n\n/* export modal */\n.export-preview{width:100%;aspect-ratio:1;border-radius:12px;border:1px solid var(--border);object-fit:cover;background:var(--surface2);display:block;margin-bottom:16px}\n\n/* tutorial */\n#tut-overlay{position:fixed;inset:0;z-index:9000;display:none;pointer-events:none}\n#tut-bubble{pointer-events:auto}\n#tut-overlay.active{display:block}\n#tut-spot{position:fixed;border-radius:12px;box-shadow:0 0 0 9999px rgba(4,4,6,.76),0 0 0 3px var(--orange),0 0 34px rgba(255,77,0,.5);transition:all .3s cubic-bezier(.4,0,.2,1);pointer-events:none;z-index:9001}\n#tut-bubble{position:fixed;width:308px;background:var(--surface);border:1px solid var(--border2);border-radius:14px;padding:18px;z-index:9002;box-shadow:0 20px 60px rgba(0,0,0,.6);transition:all .3s cubic-bezier(.4,0,.2,1)}\n#tut-bubble .tb-step{font-size:11px;font-weight:800;letter-spacing:1px;color:var(--orange);text-transform:uppercase;margin-bottom:7px}\n#tut-bubble h4{font-size:16px;margin-bottom:6px}\n#tut-bubble p{font-size:13.5px;color:var(--muted2);line-height:1.55;margin-bottom:15px}\n.tut-dots{display:flex;gap:5px;margin-bottom:14px}\n.tut-dots span{width:7px;height:7px;border-radius:50%;background:var(--border2);transition:background .2s}\n.tut-dots span.on{background:var(--orange)}\n.tut-actions{display:flex;align-items:center;gap:9px}\n.tut-actions .tut-skip{background:none;border:none;color:var(--muted);font-size:13px;font-weight:600;cursor:pointer;padding:8px 4px}\n.tut-actions .tut-skip:hover{color:var(--text)}\n.tut-actions .tut-spacer{flex:1}\n@media(max-width:1100px){.panel-left,.panel-right{position:absolute;top:0;bottom:0;box-shadow:0 0 60px rgba(0,0,0,.5)}.panel-left{left:0}.panel-right{right:0}}\n\n/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 EASY MODE \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */\n#page-easy{display:none;min-height:100vh;background:var(--bg)}\n#page-easy.active{display:block}\n.ez-nav{display:flex;align-items:center;justify-content:space-between;padding:14px 26px;border-bottom:1px solid var(--line);position:sticky;top:0;background:rgba(10,10,14,0.92);backdrop-filter:blur(10px);z-index:40}\n.ez-adv-link{background:none;border:none;color:var(--muted);font:600 13px/1 var(--ui);cursor:pointer;padding:8px 10px;border-radius:8px}\n.ez-adv-link:hover{color:var(--text);background:var(--panel2)}\n.ez-wrap{max-width:1160px;margin:0 auto;padding:26px 22px 90px}\n.ez-head h1{font:800 clamp(24px,3.5vw,34px)/1.1 var(--ui);margin:0 0 4px}\n.ez-head p{color:var(--muted);margin:0 0 22px;font-size:14px}\n.ez-stepline{display:flex;align-items:center;gap:10px;margin:26px 0 12px}\n.ez-stepnum{width:26px;height:26px;border-radius:50%;background:var(--accent);color:#fff;font:800 14px/26px var(--ui);text-align:center;flex:none}\n.ez-stepline h2{font:800 17px/1 var(--ui);margin:0}\n.ez-stepline small{color:var(--muted);font-size:12px;margin-left:2px}\n.ez-strip{display:flex;gap:12px;overflow-x:auto;padding:6px 2px 14px;scroll-snap-type:x mandatory}\n.ez-strip::-webkit-scrollbar{height:8px}\n.ez-strip::-webkit-scrollbar-thumb{background:var(--panel2);border-radius:4px}\n.ez-tpl{flex:none;width:132px;cursor:pointer;background:none;border:none;padding:0;scroll-snap-align:start;text-align:center}\n.ez-tpl img{width:132px;height:132px;border-radius:12px;display:block;border:3px solid transparent;transition:border-color .15s, transform .15s;object-fit:cover}\n.ez-tpl span{display:block;font:600 11px/1.2 var(--ui);color:var(--muted);margin-top:6px}\n.ez-tpl:hover img{transform:translateY(-2px)}\n.ez-tpl.sel img{border-color:var(--accent)}\n.ez-tpl.sel span{color:var(--text)}\n.ez-main{display:grid;grid-template-columns:minmax(0,1fr) 400px;gap:26px;align-items:start}\n.ez-card{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:20px}\n.ez-field{margin-bottom:14px}\n.ez-field label{display:block;font:700 12px/1 var(--ui);color:var(--muted);letter-spacing:.4px;text-transform:uppercase;margin-bottom:6px}\n.ez-field input,.ez-field textarea{width:100%;background:var(--panel2);border:1px solid var(--line);border-radius:10px;color:var(--text);font:500 15px/1.35 var(--ui);padding:11px 12px;box-sizing:border-box}\n.ez-field textarea{resize:vertical;min-height:64px}\n.ez-field input:focus,.ez-field textarea:focus{outline:none;border-color:var(--accent)}\n.ez-chiprow{display:flex;flex-wrap:wrap;gap:8px}\n.ez-chip{background:var(--panel2);border:1px solid var(--line);color:var(--muted);border-radius:999px;padding:8px 13px;font:700 12px/1 var(--ui);cursor:pointer;transition:all .12s}\n.ez-chip:hover{color:var(--text);border-color:var(--muted)}\n.ez-chip.on{background:#ffd200;border-color:#ffd200;color:#111}\n.ez-swatches{display:flex;flex-wrap:wrap;gap:10px;align-items:center}\n.ez-sw{width:40px;height:40px;border-radius:10px;border:3px solid transparent;cursor:pointer;padding:0;position:relative}\n.ez-sw.sel{border-color:var(--accent)}\n.ez-sw.orig{background:var(--panel2);color:var(--muted);font:700 9px/1.1 var(--ui)}\n.ez-sw input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%}\n.ez-preview-card{position:sticky;top:78px}\n.ez-preview-card img{width:100%;border-radius:12px;display:block;background:var(--panel2);min-height:200px}\n.ez-dl{width:100%;margin-top:14px;background:var(--accent);color:#fff;border:none;border-radius:12px;font:800 17px/1 var(--ui);padding:16px;cursor:pointer;transition:transform .1s, filter .15s}\n.ez-dl:hover{filter:brightness(1.08)}\n.ez-dl:active{transform:scale(0.985)}\n.ez-open-adv{width:100%;margin-top:10px;background:none;border:1px dashed var(--line);color:var(--muted);border-radius:12px;font:600 13px/1 var(--ui);padding:11px;cursor:pointer}\n.ez-open-adv:hover{color:var(--text);border-color:var(--muted)}\n.ez-hint{color:var(--muted);font-size:12px;margin-top:10px;text-align:center}\n@media (max-width:920px){\n  .ez-main{grid-template-columns:1fr}\n  .ez-preview-card{position:static;order:-1}\n}\n\n/* view menu */\n.view-menu{position:relative}\n.view-drop{display:none;position:absolute;top:110%;left:0;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:8px;min-width:210px;z-index:60;box-shadow:0 14px 40px rgba(0,0,0,.5)}\n.view-drop.open{display:block}\n.view-item{display:flex;align-items:center;gap:10px;width:100%;background:none;border:none;color:var(--text);font:500 13px/1 var(--ui);padding:9px 10px;border-radius:8px;cursor:pointer;text-align:left}\n.view-item:hover{background:var(--panel2)}\n.view-item .vi-check{width:16px;height:16px;border:1.5px solid var(--muted);border-radius:5px;flex:none;display:grid;place-items:center;font-size:11px;color:#111}\n.view-item.on .vi-check{background:var(--accent);border-color:var(--accent)}\n.view-item.on .vi-check::after{color:#fff}\n.view-item.on .vi-check::after{content:'\u2713'}\n/* grid overlay */\n#grid-overlay{position:absolute;inset:0;pointer-events:none;z-index:15;display:none;\n  background-image:linear-gradient(rgba(255,255,255,0.09) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.09) 1px, transparent 1px)}\n#grid-overlay.on{display:block}\n/* fill type seg */\n.fillseg{display:flex;gap:4px;background:var(--panel2);border-radius:8px;padding:3px;margin-bottom:8px}\n.fillseg button{flex:1;background:none;border:none;color:var(--muted);font:600 12px/1 var(--ui);padding:7px;border-radius:6px;cursor:pointer}\n.fillseg button.active{background:var(--panel);color:var(--text)}\n/* backgrounds tab */\n.bg-gen-box{background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:14px}\n.bg-gen-box textarea{width:100%;box-sizing:border-box;background:var(--panel);border:1px solid var(--line);border-radius:8px;color:var(--text);font:500 13px/1.4 var(--ui);padding:9px;resize:vertical;min-height:56px}\n.bg-gen-row{display:flex;gap:8px;margin-top:8px}\n.bg-gen-row select{flex:1;background:var(--panel);border:1px solid var(--line);border-radius:8px;color:var(--text);font:500 12px/1 var(--ui);padding:8px;min-width:0}\n.btn-gen{background:linear-gradient(135deg,#7b2d9e,#b01030);color:#fff;border:none;border-radius:8px;font:700 13px/1 var(--ui);padding:10px 14px;cursor:pointer}\n.btn-gen:disabled{opacity:.55;cursor:wait}\n.bg-result{margin-top:10px;display:none}\n.bg-result.show{display:block}\n.bg-result img{width:100%;border-radius:10px;display:block}\n.bg-result-acts{display:flex;gap:8px;margin-top:8px}\n.bg-result-acts button{flex:1;border:1px solid var(--line);background:var(--panel);color:var(--text);border-radius:8px;font:600 12px/1 var(--ui);padding:9px;cursor:pointer}\n.bg-result-acts button:hover{border-color:var(--muted)}\n.bg-lib-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}\n.bg-lib-item{position:relative;border:none;background:var(--panel2);border-radius:10px;padding:0;cursor:pointer;overflow:hidden;aspect-ratio:1}\n.bg-lib-item img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .15s}\n.bg-lib-item:hover img{transform:scale(1.06)}\n.bg-lib-del{position:absolute;top:4px;right:4px;width:20px;height:20px;border-radius:6px;border:none;background:rgba(0,0,0,.65);color:#fff;font-size:11px;cursor:pointer;display:none;line-height:20px;text-align:center}\n.bg-lib-item:hover .bg-lib-del{display:block}\n.bg-lib-badge{position:absolute;left:4px;bottom:4px;background:rgba(0,0,0,.6);color:#ddd;font:600 9px/1 var(--ui);padding:3px 6px;border-radius:5px;pointer-events:none}\n.gear-btn{background:none;border:none;color:var(--muted);cursor:pointer;font-size:13px;padding:4px;font-family:var(--ui);font-weight:600}\n.gear-btn:hover{color:var(--text)}\n.ai-note{color:var(--muted);font-size:11.5px;line-height:1.45;margin-top:8px}\n\n\n/* easy recents + layers + star */\n.ez-subttl{font:700 11px/1 var(--ui);color:var(--muted);letter-spacing:.4px;text-transform:uppercase;margin:12px 0 6px}\n#ez-recents{display:flex;flex-wrap:wrap;gap:10px}\n#ez-recents:empty::after{content:'Photos you use will appear here';color:var(--muted);font:500 11.5px/1 var(--ui)}\n.ez-recent{position:relative;width:40px;height:40px;border-radius:10px;border:3px solid transparent;padding:0;cursor:pointer;overflow:hidden;background:var(--panel2)}\n.ez-recent img{width:100%;height:100%;object-fit:cover;display:block}\n.ez-recent.sel{border-color:var(--accent)}\n.star-btn{position:absolute;top:1px;right:1px;width:16px;height:16px;border:none;border-radius:5px;background:rgba(0,0,0,.65);color:#ffd200;font-size:10px;line-height:16px;text-align:center;cursor:pointer;display:none;padding:0}\n.ez-recent:hover .star-btn,.ez-lrow:hover .star-btn{display:block}\n.ez-lrow .star-btn{position:static;width:22px;height:22px;line-height:22px;border-radius:6px;flex:none}\n#star-pop{position:fixed;z-index:9500;background:var(--panel);border:1px solid var(--line);border-radius:10px;box-shadow:0 14px 40px rgba(0,0,0,.55);padding:5px;display:none;min-width:200px}\n#star-pop.open{display:block}\n#star-pop button{display:block;width:100%;background:none;border:none;color:var(--text);font:500 13px/1 var(--ui);padding:9px 10px;border-radius:7px;cursor:pointer;text-align:left}\n#star-pop button:hover{background:var(--panel2)}\n/* easy layers list */\n.ez-layers{margin-top:14px;border-top:1px solid var(--line);padding-top:12px}\n.ez-lrow{display:flex;align-items:center;gap:9px;padding:7px 6px;border-radius:9px;cursor:pointer}\n.ez-lrow:hover{background:var(--panel2)}\n.ez-lswatch{width:26px;height:26px;border-radius:7px;flex:none;background:var(--panel2);overflow:hidden;display:grid;place-items:center;font-size:12px;color:var(--muted)}\n.ez-lswatch img{width:100%;height:100%;object-fit:cover}\n.ez-lmain{flex:1;min-width:0}\n.ez-lname{font:700 12px/1.2 var(--ui);color:var(--text)}\n.ez-lprev{font:500 10.5px/1.2 var(--ui);color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}\n.ez-ldel{width:22px;height:22px;border:none;border-radius:6px;background:none;color:var(--muted);cursor:pointer;font-size:12px;flex:none;line-height:22px;padding:0}\n.ez-ldel:hover{background:rgba(239,68,68,.15);color:var(--red)}\n.ez-restore{background:none;border:none;color:var(--accent);font:600 11.5px/1 var(--ui);cursor:pointer;padding:6px;margin-top:2px}\n\n\n/* effects controls */\n.ez-fxrow{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}\n.ez-fxrow button{background:var(--panel2);border:1px solid var(--line);color:var(--muted);border-radius:8px;padding:7px 11px;font:600 11.5px/1 var(--ui);cursor:pointer}\n.ez-fxrow button.active{background:var(--panel);color:var(--text);border-color:var(--accent)}\n.ez-fxline{display:flex;align-items:center;gap:10px;margin-bottom:8px}\n.ez-fxline label{font:600 11px/1 var(--ui);color:var(--muted);width:64px;flex:none;text-transform:uppercase;letter-spacing:.3px}\n.ez-fxline input[type=range]{flex:1}\n.ez-fxline input[type=color]{width:34px;height:28px;border:1px solid var(--line);border-radius:7px;background:none;padding:2px}\n.ez-fxline .fxval{font:600 11px/1 var(--ui);color:var(--muted);width:34px;text-align:right}\n/* account chip */\n.acct-chip{display:flex;align-items:center;gap:8px;background:var(--panel2);border:1px solid var(--line);border-radius:999px;padding:6px 12px;font:600 12px/1 var(--ui);color:var(--text);cursor:pointer}\n.acct-chip:hover{border-color:var(--muted)}\n.acct-plan{background:var(--accent);color:#fff;border-radius:999px;padding:3px 8px;font:800 9.5px/1 var(--ui);letter-spacing:.5px;text-transform:uppercase}\n.acct-plan.free{background:var(--surface3);color:var(--muted2)}\n/* auth + pay overlays reuse .modal-overlay/.modal */\n.auth-tabs{display:flex;gap:4px;background:var(--panel2);border-radius:10px;padding:4px;margin-bottom:16px}\n.auth-tabs button{flex:1;background:none;border:none;color:var(--muted);font:700 13px/1 var(--ui);padding:9px;border-radius:8px;cursor:pointer}\n.auth-tabs button.active{background:var(--panel);color:var(--text)}\n.auth-err{color:var(--red);font:500 12.5px/1.4 var(--ui);margin:8px 0 0;min-height:16px}\n.auth-ok{text-align:center;padding:18px 6px}\n.auth-ok .big{font-size:40px;margin-bottom:10px}\n.demo-note{background:rgba(245,166,35,.12);border:1px solid rgba(245,166,35,.4);color:var(--gold);border-radius:10px;padding:9px 11px;font:500 11.5px/1.45 var(--ui);margin-top:12px}\n/* plans page */\n#page-plans{display:none;position:fixed;inset:0;z-index:8000;background:var(--bg);overflow:auto}\n#page-plans.active{display:block}\n.plans-wrap{max-width:980px;margin:0 auto;padding:34px 22px 80px}\n.plans-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}\n.plans-head h1{font:800 28px/1.1 var(--ui);margin:0}\n.plans-close{background:var(--panel2);border:1px solid var(--line);color:var(--text);border-radius:10px;padding:9px 14px;font:600 13px/1 var(--ui);cursor:pointer}\n.plans-sub{color:var(--muted);font:500 14px/1.5 var(--ui);margin:0 0 26px}\n.plans-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:18px}\n.plan-card{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:22px;display:flex;flex-direction:column}\n.plan-card.hot{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent), 0 18px 50px rgba(255,77,0,.12)}\n.plan-name{font:800 17px/1 var(--ui);margin-bottom:4px}\n.plan-price{font:800 30px/1 var(--ui);margin:10px 0 2px}\n.plan-price small{font:600 13px/1 var(--ui);color:var(--muted)}\n.plan-feats{list-style:none;padding:0;margin:16px 0 20px;flex:1}\n.plan-feats li{font:500 13px/1.5 var(--ui);color:var(--muted2);padding:5px 0 5px 22px;position:relative}\n.plan-feats li::before{content:'\u2713';position:absolute;left:0;color:var(--green);font-weight:800}\n.plan-btn{background:var(--accent);color:#fff;border:none;border-radius:11px;font:800 14px/1 var(--ui);padding:13px;cursor:pointer}\n.plan-btn.ghost{background:var(--panel2);color:var(--text);border:1px solid var(--line)}\n.plan-btn:disabled{opacity:.5;cursor:default}\n.plan-current{font:700 11px/1 var(--ui);color:var(--green);text-transform:uppercase;letter-spacing:.5px;margin-top:10px;text-align:center}\n.ez-quota{color:var(--muted);font:600 11.5px/1 var(--ui);text-align:center;margin-top:8px}\n.ez-quota b{color:var(--text)}\n.ez-quota .up{color:var(--accent);cursor:pointer;text-decoration:underline}\n\n\n/* premium template locks */\n.tpl-lock{position:absolute;top:8px;left:8px;background:rgba(0,0,0,.72);color:#ffd200;font:800 9.5px/1 var(--ui);letter-spacing:.5px;padding:4px 7px;border-radius:6px;pointer-events:none;z-index:3}\n.ez-tpl{position:relative}\n.ez-tpl .tpl-lock{top:6px;left:6px}\n.ez-tpl.locked img{filter:grayscale(.35) brightness(.72)}\n.ez-tpl.locked:hover img{filter:grayscale(.15) brightness(.85)}\n.tpl-card.locked img{filter:grayscale(.35) brightness(.7)}\n\n\n/* category row + nav */\n.ez-catrow{display:flex;align-items:center;gap:12px;margin:0 0 12px}\n.ez-catrow label{font:700 12px/1 var(--ui);color:var(--muted);text-transform:uppercase;letter-spacing:.4px;flex:none}\n.cat-select{background:var(--surface2);border:1px solid var(--border);border-radius:10px;color:var(--text);font:600 14px/1 var(--ui);padding:10px 12px;min-width:210px;cursor:pointer}\n.cat-select:focus{outline:none;border-color:var(--orange)}\n.nav-upgrade{background:linear-gradient(135deg,#ff5000,#ff8a00);color:#fff;border:none;border-radius:999px;padding:8px 14px;font:800 12px/1 var(--ui);cursor:pointer;letter-spacing:.3px}\n.nav-upgrade:hover{filter:brightness(1.08)}\n/* export history */\n.hist-list{max-height:380px;overflow:auto;margin-top:6px}\n.hist-row{display:flex;align-items:center;gap:12px;padding:9px 6px;border-radius:10px}\n.hist-row:hover{background:var(--surface2)}\n.hist-row img{width:52px;height:52px;border-radius:9px;object-fit:cover;flex:none;background:var(--surface3)}\n.hist-main{flex:1;min-width:0}\n.hist-name{font:700 13px/1.2 var(--ui);color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.hist-meta{font:500 11px/1.3 var(--ui);color:var(--muted)}\n.hist-dl{background:var(--surface3);border:1px solid var(--border);color:var(--text);border-radius:8px;font:600 11.5px/1 var(--ui);padding:8px 11px;cursor:pointer;flex:none}\n.hist-dl:hover{border-color:var(--orange)}\n.hist-empty{color:var(--muted);font:500 13px/1.5 var(--ui);text-align:center;padding:26px 0}\n@media (max-width:760px){ .ez-nav{flex-wrap:wrap;gap:8px} }\n\n.mini-tpl.locked img, .tpl-mini.locked img{filter:grayscale(.35) brightness(.7)}\n\n/* per-field quick styling */\n.ez-fieldrow{display:flex;gap:8px;align-items:stretch}\n.ez-fieldrow input,.ez-fieldrow textarea{flex:1;min-width:0}\n.ez-edit-btn{flex:none;width:42px;border:1px solid var(--border);background:var(--surface2);color:var(--muted);border-radius:10px;cursor:pointer;font-size:15px}\n.ez-edit-btn:hover{color:var(--text);border-color:var(--orange)}\n#txt-pop{position:fixed;z-index:9400;width:288px;background:var(--surface);border:1px solid var(--border2);border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.55);padding:14px;display:none}\n#txt-pop.open{display:block}\n#txt-pop .tp-title{font:800 12px/1 var(--ui);color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center}\n#txt-pop .tp-title button{background:none;border:none;color:var(--muted);cursor:pointer;font-size:13px}\n.tp-row{display:flex;align-items:center;gap:9px;margin-bottom:9px}\n.tp-row label{font:600 10.5px/1 var(--ui);color:var(--muted);width:52px;flex:none;text-transform:uppercase;letter-spacing:.3px}\n.tp-row select{flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--text);font:600 12.5px/1 var(--ui);padding:7px 8px}\n.tp-row input[type=range]{flex:1}\n.tp-row input[type=color]{width:32px;height:26px;border:1px solid var(--border);border-radius:6px;background:none;padding:1px;flex:none}\n.tp-row .tp-val{font:600 10.5px/1 var(--ui);color:var(--muted);width:34px;text-align:right;flex:none}\n.tp-biu{display:flex;gap:5px;flex:1}\n.tp-biu button{flex:1;background:var(--surface2);border:1px solid var(--border);color:var(--muted);border-radius:7px;padding:7px 0;cursor:pointer;font:700 13px/1 Georgia}\n.tp-biu button.active{background:var(--surface3);color:var(--text);border-color:var(--orange)}\n.tp-reset{width:100%;margin-top:4px;background:none;border:1px dashed var(--border);color:var(--muted);border-radius:8px;font:600 11.5px/1 var(--ui);padding:8px;cursor:pointer}\n.tp-reset:hover{color:var(--text)}\n\n\n.ez-themes{display:flex;flex-wrap:wrap;gap:9px}\n.ez-theme{display:flex;border:2px solid var(--border);border-radius:9px;overflow:hidden;padding:0;cursor:pointer;width:52px;height:32px;background:none}\n.ez-theme span{flex:1;display:block}\n.ez-theme:hover{border-color:var(--orange);transform:translateY(-1px)}\n\n\n.ez-chip-custom{border-style:dashed}\n.chip-x{opacity:.55;font-size:10px;margin-left:2px}\n.ez-chip-custom:hover .chip-x{opacity:1;color:var(--red)}\n\n.lp-price-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;max-width:720px}\n.lp-price-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:26px}\n.lp-price-card.hot{border-color:var(--orange);box-shadow:0 0 0 1px var(--orange),0 18px 50px rgba(255,77,0,.12)}\n.lp-price-card h3{font-size:17px;margin-bottom:6px}\n.lp-price{font-family:'Bebas Neue';font-size:44px;margin-bottom:12px}\n.lp-price small{font-size:16px;color:var(--muted)}\n.lp-price-card ul{list-style:none;padding:0;margin:0 0 18px}\n.lp-price-card li{font-size:13.5px;color:var(--muted2);padding:5px 0 5px 22px;position:relative}\n.lp-price-card li::before{content:'\\2713';position:absolute;left:0;color:var(--green);font-weight:800}\n.lp-faq{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:0 18px;margin-bottom:10px}\n.lp-faq summary{font-weight:700;font-size:15px;padding:16px 0;cursor:pointer;list-style:none}\n.lp-faq summary::-webkit-details-marker{display:none}\n.lp-faq summary::after{content:'+';float:right;color:var(--orange);font-size:18px}\n.lp-faq[open] summary::after{content:'\\2013'}\n.lp-faq p{font-size:14px;color:var(--muted2);line-height:1.6;padding-bottom:16px;margin:0}\n";
function cssProbeOk(){
  const t = document.createElement('div');
  t.className = 'ez-stepnum';
  t.style.position = 'absolute'; t.style.visibility = 'hidden';
  document.body.appendChild(t);
  const ok = getComputedStyle(t).borderRadius === '50%';
  t.remove();
  return ok;
}
const PGFX_BUILD = 'v21';
function ensureCss(){
  try {
    console.log('PhoneGFX build ' + PGFX_BUILD);
    if (cssProbeOk()){ console.log('PhoneGFX: styles OK via normal <style> tags.'); return; }
    console.warn('PhoneGFX: <style> tags did not apply — trying re-injection.');
    // Route 1: <style> blocks were stripped by the host — re-inject them
    const st = document.createElement('style');
    st.textContent = CSS_FALLBACK;
    document.head.appendChild(st);
    if (cssProbeOk()){ console.warn('PhoneGFX: inline styles were stripped by the host; CSS re-injected at runtime.'); return; }
    // Route 2: a CSP header is rejecting <style> elements. Constructed stylesheets
    // go through the CSSOM, which style-src does not govern — so this works under CSP.
    if (typeof CSSStyleSheet !== 'undefined' && document.adoptedStyleSheets !== undefined){
      try {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(CSS_FALLBACK);
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
        if (cssProbeOk()){ console.warn('PhoneGFX: host CSP blocks inline styles; CSS applied via constructed stylesheet.'); return; }
      } catch (e2){}
    }
    // still blocked (likely a Content-Security-Policy header) — tell the human plainly
    const b = document.createElement('div');
    b.setAttribute('role', 'alert');
    const bs = b.style;
    bs.position = 'fixed'; bs.top = '0'; bs.left = '0'; bs.right = '0'; bs.zIndex = '99999';
    bs.background = '#b01030'; bs.color = '#fff'; bs.padding = '14px 18px';
    bs.fontFamily = 'sans-serif'; bs.fontSize = '14px'; bs.lineHeight = '1.5';
    b.textContent = '[build ' + PGFX_BUILD + '] All three style routes failed \u2014 this should not happen in a modern browser, so if you are reading this on build v3, screenshot the console (Cmd+Option+J) and the exact browser version. If this message does NOT say build v3, you are looking at an old cached deploy: check the Deploys tab timestamp on Netlify and open the site in an Incognito window.';
    document.body.appendChild(b);
  } catch (e){}
}
function boot(){
  ensureCss();
  // arriving from ScanMap's dashboard proves a SCANS.AD account — unlock the
  // cross-product surfaces in this browser, then strip the param
  try {
    const q = new URLSearchParams(location.search);
    if (q.get('scansad') === 'member'){
      jset('pgfx_scansad_member', true);
      history.replaceState(null, '', location.pathname);
    }
  } catch (e){}
  // landing buttons
  $('lp-logo').onclick = () => window.scrollTo({top:0, behavior:'smooth'});
  $('lp-open-studio').onclick = () => showEasy(null);
  $('lp-cta-main').onclick = () => showEasy(null);
  $('lp-cta-bottom').onclick = () => showEasy(null);
  bindEasyUI();
  // prefill brand modal
  const b = getBrand();
  if (b){ $('bk-phone').value = b.phone || ''; $('bk-website').value = b.website || ''; $('bk-name').value = b.name || ''; }
  buildLanding();          // instant paint on fallbacks…
  preloadTplBgs();          // …photos swap themselves in as they arrive
}

// wait for fonts so canvas thumbnails render with the real typefaces
if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', () => document.fonts.ready.then(boot).catch(boot));
} else {
  document.fonts.ready.then(boot).catch(boot);
}
