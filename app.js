'use strict';
/* ═══════════════════════════════════════════════════════
   PhoneGFX Studio, single clean engine, one script block
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
// CW/CH are the LIVE document size, they change with the chosen format, and
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
const F_DISPLAY='Clash Display', F_COND='Khand', F_UI='Satoshi';

const TEMPLATES = [
{ id:'sell_iphone', name:'Sell Your iPhone', tag:'sell', cat:'phones',
  bg:{type:'image', src:'assets/tplbg/sell_iphone.jpg', scrim:0.62, fallback:{type:'grad', c1:'#b01030', c2:'#7b2d9e', a:135}},
  layers:[
    {kind:'rect', name:'Bottom Bar', props:{left:0, top:820, width:CW, height:260, fill:'rgba(0,0,0,0.85)'}},
    {kind:'text', name:'Headline 1', role:'headline', casing:'upper', text:'SELL YOUR', props:{left:CW/2, top:115, originX:'center', fontFamily:F_DISPLAY, fontSize:185, fill:'#ffffff', stroke:'#000000', strokeWidth:9, textAlign:'center', shadow:sh('rgba(0,0,0,0.5)',20,4,4)}},
    {kind:'rect', name:'Top Banner', props:{left:CW/2-130, top:55, width:260, height:50, fill:'#ff5000', rx:4, angle:-2}},
    {kind:'text', name:'Banner Text', role:'sub', casing:'upper', text:'TOP BUYER', props:{left:CW/2, top:68, originX:'center', fontFamily:F_DISPLAY, fontSize:36, fill:'#ffffff', stroke:'#000000', strokeWidth:2, angle:-2}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'IPHONE', props:{left:CW/2, top:282, originX:'center', fontFamily:F_DISPLAY, fontSize:258, fill:'#ff5000', stroke:'#000000', strokeWidth:12, textAlign:'center', shadow:sh('rgba(0,0,0,0.6)',28,6,6)}},
    {kind:'text', name:'Badges', role:'badges', casing:'upper', text:'✓SAFE  ✓QUICK  ✓EASY', props:{left:CW-30, top:30, originX:'right', fontFamily:'Satoshi', fontSize:29, fill:'#ffffff', fontWeight:'800', charSpacing:70, lineHeight:1.5, shadow:sh('rgba(0,0,0,0.6)',10,0,3)}},
    {kind:'textbox', name:'Info Text', role:'info', casing:'upper', text:'SAME DAY CASH, NO HASSLE EASY MEETUP\niCLOUD LOCK, BROKEN, BLACKLIST...\nANY CONDITION ANY CARRIER', props:{left:CW/2, top:615, width:CW-80, originX:'center', fontFamily:F_COND, fontSize:38, fill:'#ffffff', stroke:'#000000', strokeWidth:2, textAlign:'center', fontWeight:'700', lineHeight:1.3, shadow:sh('rgba(0,0,0,0.9)',8,2,2)}},
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
{ id:'we_buy', name:'We Buy, Dark Neon', tag:'buyer', cat:'phones',
  bg:{type:'image', src:'assets/tplbg/we_buy.jpg', scrim:0.62, fallback:{type:'grad', c1:'#060606', c2:'#0f0f0f', a:180}},
  layers:[
    {kind:'circle', name:'Ring Outer', role:'deco', props:{left:CW/2-500, top:CH/2-500, radius:500, fill:'', stroke:'#ffb800', strokeWidth:1, opacity:0.1, selectable:false, evented:false}},
    {kind:'circle', name:'Ring Inner', role:'deco', props:{left:CW/2-360, top:CH/2-360, radius:360, fill:'', stroke:'#ff5000', strokeWidth:2, opacity:0.25, selectable:false, evented:false}},
    {kind:'text', name:'Headline 1', role:'headline', casing:'upper', text:'WE BUY', props:{left:CW/2, top:120, originX:'center', fontFamily:F_DISPLAY, fontSize:180, fill:'#ffffff', stroke:'#000000', strokeWidth:7}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'iPHONES', props:{left:CW/2, top:278, originX:'center', fontFamily:F_DISPLAY, fontSize:255, fill:'#ff5000', stroke:'#000000', strokeWidth:9, shadow:sh('#ff5000',55)}},
    {kind:'textbox', name:'Devices', role:'info', casing:'none', text:'iPads • MacBooks • Samsung\nANY CONDITION, TOP DOLLAR', props:{left:CW/2, top:605, width:CW-60, originX:'center', fontFamily:F_COND, fontSize:44, fill:'#aaaaaa', fontWeight:'600', textAlign:'center', lineHeight:1.3}},
    {kind:'rect', name:'Phone Bar', props:{left:80, top:770, width:CW-160, height:180, fill:'#ff5000', rx:12}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'CALL OR TEXT ANYTIME', props:{left:CW/2, top:785, originX:'center', fontFamily:F_COND, fontSize:30, fill:'rgba(0,0,0,0.65)', fontWeight:'900'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:825, originX:'center', fontFamily:F_DISPLAY, fontSize:100, fill:'#ffffff', stroke:'#c03000', strokeWidth:4}},
  ]},
{ id:'cash_offer', name:'Instant Cash Offer', tag:'promo', cat:'phones',
  bg:{type:'image', src:'assets/tplbg/cash_offer.jpg', scrim:0.5, fallback:{type:'grad', c1:'#f7971e', c2:'#ffd200', a:135}},
  layers:[
    {kind:'text', name:'Headline 1', role:'headline', casing:'upper', text:'INSTANT', props:{left:CW/2, top:100, originX:'center', fontFamily:F_DISPLAY, fontSize:170, fill:'#ffffff'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'CASH OFFER', props:{left:CW/2, top:255, originX:'center', fontFamily:F_DISPLAY, fontSize:155, fill:'#ffffff', stroke:'#ff5000', strokeWidth:4}},
    {kind:'text', name:'Headline 3', role:'sub', casing:'upper', text:'FOR YOUR iPHONE', props:{left:CW/2, top:440, originX:'center', fontFamily:F_COND, fontSize:72, fill:'#ffffff', fontWeight:'900'}},
    {kind:'rect', name:'Phone Plate', props:{left:CW/2-245, top:558, width:490, height:135, fill:'#000000', rx:8}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:595, originX:'center', fontFamily:F_DISPLAY, fontSize:88, fill:'#ffd200'}},
    {kind:'textbox', name:'Info Text', role:'info', casing:'title', text:'Same Day Payment • Local Meetup\nAll Models • Any Condition', props:{left:CW/2, top:750, width:CW-100, originX:'center', fontFamily:F_COND, fontSize:44, fill:'#ffffff', fontWeight:'700', textAlign:'center', lineHeight:1.3}},
  ]},
{ id:'icloud_ok', name:'iCloud OK, We Still Buy', tag:'promo', cat:'phones',
  bg:{type:'image', src:'assets/tplbg/icloud_ok.jpg', scrim:0.5, fallback:{type:'grad', c1:'#0d1117', c2:'#1a2332', a:180}},
  layers:[
    {kind:'text', name:'Title', role:'headline', casing:'upper', text:'WE STILL BUY!', props:{left:CW/2, top:80, originX:'center', fontFamily:F_DISPLAY, fontSize:140, fill:'#22c55e', stroke:'#000000', strokeWidth:5, shadow:sh('#22c55e',32)}},
    {kind:'text', name:'Check', role:'deco', text:'✓', props:{left:CW/2, top:215, originX:'center', fontSize:200, fill:'#22c55e', shadow:sh('#22c55e',65)}},
    {kind:'textbox', name:'Conditions', role:'info', casing:'upper', text:'iCLOUD LOCKED\nBLACKLISTED\nBROKEN SCREEN\nANY CONDITION', props:{left:CW/2, top:435, width:CW-80, originX:'center', fontFamily:F_DISPLAY, fontSize:92, fill:'#ffffff', textAlign:'center', lineHeight:0.95}},
    {kind:'rect', name:'Bottom Bar', props:{left:0, top:868, width:CW, height:212, fill:'#22c55e'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'TEXT US NOW!', props:{left:CW/2, top:878, originX:'center', fontFamily:F_COND, fontSize:34, fill:'rgba(0,0,0,0.6)', fontWeight:'900'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:918, originX:'center', fontFamily:F_DISPLAY, fontSize:90, fill:'#ffffff', stroke:'#000000', strokeWidth:2}},
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
{ id:'bold_buyer', name:'Bold Buyer, Hot Pink', tag:'buyer', cat:'phones',
  bg:{type:'image', src:'assets/tplbg/bold_buyer.jpg', scrim:0.55, fallback:{type:'grad', c1:'#ff1493', c2:'#ff6600', a:135}},
  layers:[
    {kind:'text', name:'Headline 1', role:'headline', casing:'upper', text:'CASH FOR', props:{left:CW/2, top:100, originX:'center', fontFamily:F_DISPLAY, fontSize:170, fill:'#ffffff', stroke:'#000000', strokeWidth:8}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'iPHONES', props:{left:CW/2, top:255, originX:'center', fontFamily:F_DISPLAY, fontSize:260, fill:'#ffffff', shadow:sh('rgba(0,0,0,0.3)',20,5,5)}},
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
    {kind:'text', name:'Kicker', role:'sub', casing:'upper', text:'PAYING UP TO 95% OF', props:{left:CW/2, top:120, originX:'center', fontFamily:'Khand', fontSize:52, fill:'#c9b27c', charSpacing:220, fontWeight:'600'}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'TODAYS GOLD PRICE', props:{left:CW/2, top:200, originX:'center', fontFamily:'Clash Display', fontSize:132, fill:'#f5b700', shadow:sh('rgba(245,183,0,0.45)',34)}},
    {kind:'textbox', name:'Items', role:'info', casing:'upper', text:'RINGS \u2022 CHAINS \u2022 COINS \u2022 DENTAL\nBROKEN JEWELRY WELCOME\n10K \u2022 14K \u2022 18K \u2022 24K', props:{left:CW/2, top:430, width:CW-140, originX:'center', fontFamily:'Khand', fontSize:56, fill:'#ffffff', textAlign:'center', lineHeight:1.35, fontWeight:'600'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'TESTED \u0026 PAID IN FRONT OF YOU', props:{left:CW/2, top:760, originX:'center', fontFamily:F_COND, fontSize:44, fill:'#c9b27c', fontWeight:'700'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:850, originX:'center', fontFamily:'Clash Display', fontSize:100, fill:'#ffffff', shadow:sh('rgba(0,0,0,0.6)',18,3,3)}},
    {kind:'text', name:'Website', role:'website', casing:'none', text:'iphones.LA', props:{left:CW/2, top:980, originX:'center', fontFamily:F_UI, fontSize:26, fill:'rgba(255,255,255,0.4)'}},
  ]},
{ id:'gold_lux', name:'Luxury Minimal Gold', tag:'sell', cat:'gold',
  bg:{type:'solid', c:'#0b0b0d'},
  layers:[
    {kind:'rect', name:'Frame', props:{left:60, top:60, width:CW-120, height:CH-120, fill:'rgba(0,0,0,0)', stroke:'#c9a24b', strokeWidth:2}},
    {kind:'text', name:'Serif Head', role:'headline', casing:'title', text:'We Buy Gold.', props:{left:CW/2, top:300, originX:'center', fontFamily:'Zodiak', fontSize:150, fill:'#e8d9ae', fontStyle:'italic'}},
    {kind:'text', name:'Sub', role:'sub', casing:'upper', text:'PRIVATE \u2022 DISCREET \u2022 FAIR', props:{left:CW/2, top:490, originX:'center', fontFamily:'Satoshi', fontSize:34, fill:'#c9a24b', charSpacing:420, fontWeight:'700'}},
    {kind:'text', name:'Line', role:'deco', text:'\u2500\u2500\u2500\u2500\u2500 \u25C6 \u2500\u2500\u2500\u2500\u2500', props:{left:CW/2, top:580, originX:'center', fontFamily:F_UI, fontSize:30, fill:'#c9a24b'}},
    {kind:'text', name:'Info', role:'info', casing:'title', text:'Estates, Inheritance \u0026 Fine Jewelry', props:{left:CW/2, top:660, originX:'center', fontFamily:'Zodiak', fontSize:42, fill:'#ffffff'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:800, originX:'center', fontFamily:'Satoshi', fontSize:72, fill:'#e8d9ae', fontWeight:'800'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'BY APPOINTMENT \u2014 TEXT ANYTIME', props:{left:CW/2, top:905, originX:'center', fontFamily:'Satoshi', fontSize:26, fill:'rgba(255,255,255,0.55)', charSpacing:260, fontWeight:'600'}},
  ]},
{ id:'gold_scale', name:'On The Scale', tag:'promo', cat:'gold', tier:'premium',
  bg:{type:'grad', c1:'#3a2b00', c2:'#0d0a02', a:180},
  layers:[
    {kind:'text', name:'Big Emoji', role:'deco', text:'\u2696\uFE0F', props:{left:CW/2, top:90, originX:'center', fontSize:150}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'YOUR GOLD IS', props:{left:CW/2, top:300, originX:'center', fontFamily:'Clash Display', fontSize:96, fill:'#ffffff'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'WORTH MORE', props:{left:CW/2, top:410, originX:'center', fontFamily:'Clash Display', fontSize:118, fill:'#f5b700', shadow:sh('#f5b700',40)}},
    {kind:'text', name:'Sub', role:'sub', casing:'upper', text:'THAN YOU THINK', props:{left:CW/2, top:555, originX:'center', fontFamily:'Khand', fontSize:60, fill:'#c9b27c', fontWeight:'600'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Free testing \u2022 No obligation quote\nWatch the scale \u2014 zero tricks', props:{left:CW/2, top:680, width:CW-160, originX:'center', fontFamily:F_UI, fontSize:36, fill:'#ffffff', textAlign:'center', lineHeight:1.4}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:850, originX:'center', fontFamily:'Clash Display', fontSize:96, fill:'#f5b700'}},
  ]},
{ id:'gold_cash_now', name:'Gold = Cash Now', tag:'sell', cat:'gold', tier:'premium',
  bg:{type:'grad', c1:'#f5b700', c2:'#ff8a00', a:135},
  layers:[
    {kind:'rect', name:'Ink Panel', props:{left:70, top:170, width:CW-140, height:740, fill:'#101010', rx:26, shadow:sh('rgba(0,0,0,0.45)',40,0,18)}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'GOLD IN.', props:{left:CW/2, top:250, originX:'center', fontFamily:'Clash Display', fontSize:130, fill:'#f5b700'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'CASH OUT.', props:{left:CW/2, top:395, originX:'center', fontFamily:'Clash Display', fontSize:130, fill:'#ffffff'}},
    {kind:'text', name:'Info', role:'info', casing:'upper', text:'5 MINUTE APPRAISAL \u2014 WALK OUT PAID', props:{left:CW/2, top:580, originX:'center', fontFamily:'Khand', fontSize:42, fill:'#c9b27c', fontWeight:'600'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'TEXT A PHOTO FOR AN INSTANT QUOTE', props:{left:CW/2, top:670, originX:'center', fontFamily:F_COND, fontSize:38, fill:'#ffffff', fontWeight:'700'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:770, originX:'center', fontFamily:'Clash Display', fontSize:92, fill:'#f5b700'}},
    {kind:'text', name:'Badges', role:'badges', casing:'upper', text:'\u2713LICENSED  \u2713INSURED', props:{left:CW-30, top:30, originX:'right', fontFamily:'Satoshi', fontSize:29, fill:'#ffffff', fontWeight:'800', charSpacing:70, lineHeight:1.5, shadow:sh('rgba(0,0,0,0.6)',10,0,3)}},
  ]},
{ id:'gold_estate', name:'Estate Buyer Serif', tag:'buyer', cat:'gold', tier:'premium',
  bg:{type:'solid', c:'#f4ead2'},
  layers:[
    {kind:'rect', name:'Rule Top', props:{left:90, top:120, width:CW-180, height:6, fill:'#1c1710'}},
    {kind:'text', name:'Headline', role:'headline', casing:'title', text:'Settling An Estate?', props:{left:CW/2, top:190, originX:'center', fontFamily:'Zodiak', fontSize:96, fill:'#1c1710'}},
    {kind:'textbox', name:'Body', role:'info', casing:'none', text:'We purchase entire gold and jewelry\ncollections with dignity, discretion\nand documented fair-market offers.', props:{left:CW/2, top:360, width:CW-200, originX:'center', fontFamily:'Zodiak', fontSize:44, fill:'#443b2c', textAlign:'center', lineHeight:1.45, fontStyle:'italic'}},
    {kind:'text', name:'Sub', role:'sub', casing:'upper', text:'HOUSE CALLS AVAILABLE', props:{left:CW/2, top:640, originX:'center', fontFamily:'Satoshi', fontSize:32, fill:'#8a6d1f', charSpacing:340, fontWeight:'700'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:740, originX:'center', fontFamily:'Zodiak', fontSize:84, fill:'#1c1710', fontWeight:'700'}},
    {kind:'rect', name:'Rule Bottom', props:{left:90, top:900, width:CW-180, height:6, fill:'#1c1710'}},
    {kind:'text', name:'Website', role:'website', casing:'none', text:'iphones.LA', props:{left:CW/2, top:940, originX:'center', fontFamily:'Satoshi', fontSize:26, fill:'#8a6d1f', fontWeight:'600'}},
  ]},
{ id:'gold_marker', name:'Handwritten Payout', tag:'promo', cat:'gold', tier:'premium',
  bg:{type:'grad', c1:'#1a1a1f', c2:'#000000', a:180},
  layers:[
    {kind:'text', name:'Headline', role:'headline', casing:'none', text:'That old chain?', props:{left:CW/2, top:170, originX:'center', fontFamily:'Clash Display', fontSize:96, fill:'#ffffff', angle:-3}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'none', text:'PAID.', props:{left:CW/2, top:330, originX:'center', fontFamily:'Clash Display', fontSize:210, fill:'#f5b700', angle:2, shadow:sh('rgba(245,183,0,0.5)',30)}},
    {kind:'text', name:'Arrow', role:'deco', text:'\u2935\uFE0F', props:{left:CW/2+250, top:520, fontSize:80, angle:15}},
    {kind:'text', name:'Info', role:'info', casing:'none', text:'Broken, tangled, one earring \u2014 all of it counts.', props:{left:CW/2, top:640, originX:'center', fontFamily:F_UI, fontSize:38, fill:'#c9b27c'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:760, originX:'center', fontFamily:'Clash Display', fontSize:104, fill:'#ffffff'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'TEXT A PIC \u2192 GET A NUMBER', props:{left:CW/2, top:900, originX:'center', fontFamily:'Clash Display', fontSize:44, fill:'#f5b700'}},
  ]},

/* ── SILVER (5) ── */
{ id:'silver_stack', name:'Stack Buyer', tag:'buyer', cat:'silver',
  bg:{type:'grad', c1:'#20242c', c2:'#0b0d12', a:170},
  layers:[
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'SELLING YOUR', props:{left:CW/2, top:130, originX:'center', fontFamily:'Khand', fontSize:84, fill:'#ffffff', fontWeight:'700'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'SILVER STACK?', props:{left:CW/2, top:230, originX:'center', fontFamily:'Khand', fontSize:120, fill:'#c7d0dc', fontWeight:'700', shadow:sh('rgba(199,208,220,0.35)',28)}},
    {kind:'textbox', name:'Items', role:'info', casing:'upper', text:'EAGLES \u2022 BARS \u2022 JUNK SILVER\n90% COINS \u2022 STERLING FLATWARE', props:{left:CW/2, top:440, width:CW-140, originX:'center', fontFamily:F_COND, fontSize:52, fill:'#8fa3bb', textAlign:'center', lineHeight:1.4, fontWeight:'700'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'PRICED LIVE OFF SPOT \u2014 NO LOWBALLS', props:{left:CW/2, top:660, originX:'center', fontFamily:'Khand', fontSize:40, fill:'#ffffff', fontWeight:'600'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:790, originX:'center', fontFamily:'Clash Display', fontSize:98, fill:'#c7d0dc'}},
    {kind:'text', name:'Website', role:'website', casing:'none', text:'iphones.LA', props:{left:CW/2, top:930, originX:'center', fontFamily:F_UI, fontSize:26, fill:'rgba(255,255,255,0.4)'}},
  ]},
{ id:'silver_ounce', name:'Per Ounce Bold', tag:'promo', cat:'silver',
  bg:{type:'solid', c:'#e9edf2'},
  layers:[
    {kind:'rect', name:'Slab', props:{left:0, top:0, width:CW, height:340, fill:'#10141b'}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'TOP DOLLAR', props:{left:CW/2, top:80, originX:'center', fontFamily:'Clash Display', fontSize:110, fill:'#ffffff'}},
    {kind:'text', name:'Sub', role:'sub', casing:'upper', text:'PER OUNCE \u2014 EVERY OUNCE', props:{left:CW/2, top:225, originX:'center', fontFamily:'Khand', fontSize:48, fill:'#ffffff', fontWeight:'600', charSpacing:160}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Bring the whole box \u2014 tea sets, trays,\ncandlesticks, coins. We sort, weigh\nand pay on the spot.', props:{left:CW/2, top:430, width:CW-180, originX:'center', fontFamily:F_UI, fontSize:42, fill:'#2a3340', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:760, originX:'center', fontFamily:'Clash Display', fontSize:88, fill:'#10141b'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'OPEN 7 DAYS \u2014 WALK-INS WELCOME', props:{left:CW/2, top:900, originX:'center', fontFamily:'Khand', fontSize:34, fill:'#5a6b80', fontWeight:'600', charSpacing:200}},
  ]},
{ id:'silver_mirror', name:'Mirror Shine', tag:'sell', cat:'silver', tier:'premium',
  bg:{type:'grad', c1:'#7c8899', c2:'#3f4b5c', a:135},
  layers:[
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'SILVER', props:{left:CW/2, top:150, originX:'center', fontFamily:'Clash Display', fontSize:250, fill:'#ffffff', stroke:'#10141b', strokeWidth:8, shadow:sh('rgba(0,0,0,0.35)',24,6,6)}},
    {kind:'text', name:'Sub', role:'sub', casing:'upper', text:'BOUGHT \u2022 WEIGHED \u2022 PAID', props:{left:CW/2, top:440, originX:'center', fontFamily:'Satoshi', fontSize:44, fill:'#10141b', fontWeight:'800', charSpacing:260}},
    {kind:'rect', name:'Panel', props:{left:120, top:560, width:CW-240, height:200, fill:'rgba(16,20,27,0.85)', rx:18}},
    {kind:'text', name:'Info', role:'info', casing:'none', text:'Even tarnished pieces \u2014 shine does not matter, weight does.', props:{left:CW/2, top:600, originX:'center', fontFamily:F_UI, fontSize:34, fill:'#c7d0dc', width:CW-300, textAlign:'center'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:670, originX:'center', fontFamily:'Clash Display', fontSize:76, fill:'#ffffff'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'FREE EVALUATIONS DAILY', props:{left:CW/2, top:850, originX:'center', fontFamily:'Khand', fontSize:42, fill:'#10141b', fontWeight:'700'}},
  ]},
{ id:'silver_ster', name:'Sterling Wanted Poster', tag:'buyer', cat:'silver', tier:'premium',
  bg:{type:'solid', c:'#f7f1e3'},
  layers:[
    {kind:'rect', name:'Border', props:{left:50, top:50, width:CW-100, height:CH-100, fill:'rgba(0,0,0,0)', stroke:'#2b2416', strokeWidth:10}},
    {kind:'rect', name:'Border In', props:{left:74, top:74, width:CW-148, height:CH-148, fill:'rgba(0,0,0,0)', stroke:'#2b2416', strokeWidth:3}},
    {kind:'text', name:'Kicker', role:'sub', casing:'upper', text:'\u2605 WANTED \u2605', props:{left:CW/2, top:130, originX:'center', fontFamily:'Zodiak', fontSize:60, fill:'#8a2b1d', fontWeight:'700', charSpacing:300}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'STERLING SILVER', props:{left:CW/2, top:250, originX:'center', fontFamily:'Zodiak', fontSize:100, fill:'#2b2416', fontWeight:'700'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Flatware sets \u2022 Serving pieces \u2022 .925 marked\nGenerous reward paid in cash', props:{left:CW/2, top:430, width:CW-220, originX:'center', fontFamily:'Zodiak', fontSize:44, fill:'#443b2c', textAlign:'center', lineHeight:1.5, fontStyle:'italic'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:680, originX:'center', fontFamily:'Zodiak', fontSize:88, fill:'#2b2416', fontWeight:'700'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'INQUIRE WITHIN \u2014 OR JUST TEXT US', props:{left:CW/2, top:830, originX:'center', fontFamily:'Satoshi', fontSize:30, fill:'#8a2b1d', fontWeight:'700', charSpacing:180}},
  ]},
{ id:'silver_neon', name:'Second Place Pays', tag:'promo', cat:'silver', tier:'premium',
  bg:{type:'solid', c:'#07080c'},
  layers:[
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'SECOND PLACE', props:{left:CW/2, top:170, originX:'center', fontFamily:'Khand', fontSize:140, fill:'rgba(0,0,0,0)', stroke:'#c7d0dc', strokeWidth:4, shadow:sh('#c7d0dc',26)}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'STILL PAYS', props:{left:CW/2, top:330, originX:'center', fontFamily:'Khand', fontSize:190, fill:'#c7d0dc', shadow:sh('#8fa3bb',45)}},
    {kind:'text', name:'Sub', role:'sub', casing:'upper', text:'SILVER BUYER \u2014 CASH TODAY', props:{left:CW/2, top:580, originX:'center', fontFamily:'Khand', fontSize:52, fill:'#ffffff', fontWeight:'600'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:720, originX:'center', fontFamily:'Clash Display', fontSize:100, fill:'#ffffff', shadow:sh('#c7d0dc',20)}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'BARS \u2022 ROUNDS \u2022 90% \u2022 STERLING', props:{left:CW/2, top:880, originX:'center', fontFamily:F_COND, fontSize:40, fill:'#8fa3bb', fontWeight:'700'}},
  ]},

/* ── RARE COINS (6) ── */
{ id:'coins_estate', name:'Coin Collection Buyer', tag:'buyer', cat:'coins',
  bg:{type:'grad', c1:'#1d1408', c2:'#000000', a:180},
  layers:[
    {kind:'text', name:'Coin', role:'deco', text:'\uD83E\uDE99', props:{left:CW/2, top:80, originX:'center', fontSize:130}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'COIN COLLECTIONS', props:{left:CW/2, top:270, originX:'center', fontFamily:'Clash Display', fontSize:110, fill:'#e8d9ae'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'BOUGHT WHOLE', props:{left:CW/2, top:395, originX:'center', fontFamily:'Clash Display', fontSize:110, fill:'#ffffff'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Morgans \u2022 Peace dollars \u2022 Wheat cents\nProof sets \u2022 Inherited albums \u2022 Foreign', props:{left:CW/2, top:560, width:CW-160, originX:'center', fontFamily:'Zodiak', fontSize:42, fill:'#c9b27c', textAlign:'center', lineHeight:1.5}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'NO COLLECTION TOO BIG OR SMALL', props:{left:CW/2, top:740, originX:'center', fontFamily:'Khand', fontSize:38, fill:'#ffffff', fontWeight:'600'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:840, originX:'center', fontFamily:'Clash Display', fontSize:96, fill:'#e8d9ae'}},
  ]},
{ id:'coins_morgan', name:'Morgan Dollar Callout', tag:'promo', cat:'coins', tier:'premium',
  bg:{type:'solid', c:'#10131a'},
  layers:[
    {kind:'rect', name:'Circle Halo', props:{left:CW/2-230, top:60, width:460, height:460, fill:'rgba(232,217,174,0.08)', rx:230}},
    {kind:'text', name:'Year', role:'headline', casing:'none', text:'1878\u20131921', props:{left:CW/2, top:180, originX:'center', fontFamily:'Zodiak', fontSize:110, fill:'#e8d9ae', fontWeight:'700'}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'MORGAN DOLLARS', props:{left:CW/2, top:350, originX:'center', fontFamily:'Khand', fontSize:96, fill:'#ffffff', fontWeight:'700'}},
    {kind:'text', name:'Sub', role:'sub', casing:'upper', text:'PAYING COLLECTOR PRICES \u2014 NOT MELT', props:{left:CW/2, top:490, originX:'center', fontFamily:'Satoshi', fontSize:36, fill:'#c9a24b', fontWeight:'700', charSpacing:120}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Carson City? Key dates? Toned beauties?\nWe know exactly what you have.', props:{left:CW/2, top:600, width:CW-200, originX:'center', fontFamily:'Zodiak', fontSize:38, fill:'#c7d0dc', textAlign:'center', lineHeight:1.5, fontStyle:'italic'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:790, originX:'center', fontFamily:'Clash Display', fontSize:92, fill:'#e8d9ae'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'TEXT PHOTOS FOR A REAL OFFER', props:{left:CW/2, top:925, originX:'center', fontFamily:'Khand', fontSize:34, fill:'rgba(255,255,255,0.6)', fontWeight:'600', charSpacing:160}},
  ]},
{ id:'coins_grandpa', name:'Grandpas Coins', tag:'sell', cat:'coins', tier:'premium',
  bg:{type:'grad', c1:'#2a2118', c2:'#14100b', a:160},
  layers:[
    {kind:'text', name:'Headline', role:'headline', casing:'none', text:'Found a coin jar', props:{left:CW/2, top:150, originX:'center', fontFamily:'Clash Display', fontSize:90, fill:'#ffffff', angle:-2}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'none', text:'in the attic?', props:{left:CW/2, top:280, originX:'center', fontFamily:'Clash Display', fontSize:90, fill:'#e8d9ae', angle:1}},
    {kind:'text', name:'Sub', role:'sub', casing:'upper', text:'IT MIGHT PAY THE RENT.', props:{left:CW/2, top:450, originX:'center', fontFamily:'Clash Display', fontSize:74, fill:'#f5b700', shadow:sh('rgba(245,183,0,0.4)',26)}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Free sorting \u2022 We separate the treasure\nfrom the pocket change \u2014 honestly.', props:{left:CW/2, top:590, width:CW-180, originX:'center', fontFamily:F_UI, fontSize:38, fill:'#c9b27c', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:770, originX:'center', fontFamily:'Clash Display', fontSize:100, fill:'#ffffff'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'HOUSE CALLS FOR BIG FINDS', props:{left:CW/2, top:910, originX:'center', fontFamily:'Clash Display', fontSize:38, fill:'#e8d9ae'}},
  ]},
{ id:'coins_error', name:'Error Coin Hunter', tag:'promo', cat:'coins', tier:'premium',
  bg:{type:'solid', c:'#0d0d10'},
  layers:[
    {kind:'rect', name:'Alert Strip', props:{left:0, top:70, width:CW, height:110, fill:'#8a2b1d'}},
    {kind:'text', name:'Kicker', role:'sub', casing:'upper', text:'\u26A0 CHECK YOUR CHANGE \u26A0', props:{left:CW/2, top:98, originX:'center', fontFamily:'Khand', fontSize:54, fill:'#ffffff', fontWeight:'700'}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'ERROR COINS', props:{left:CW/2, top:250, originX:'center', fontFamily:'Clash Display', fontSize:130, fill:'#ffffff'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'= REAL MONEY', props:{left:CW/2, top:400, originX:'center', fontFamily:'Clash Display', fontSize:110, fill:'#f5b700'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Double dies \u2022 Off-centers \u2022 Wrong planchets\nSome are worth thousands. We will tell you\nwhich \u2014 for free.', props:{left:CW/2, top:560, width:CW-160, originX:'center', fontFamily:F_UI, fontSize:36, fill:'#c7d0dc', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:790, originX:'center', fontFamily:'Clash Display', fontSize:94, fill:'#ffffff'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'TEXT A CLOSE-UP PHOTO NOW', props:{left:CW/2, top:925, originX:'center', fontFamily:'Khand', fontSize:36, fill:'#f5b700', fontWeight:'700'}},
  ]},
{ id:'coins_graded', name:'Graded Slab Buyer', tag:'buyer', cat:'coins', tier:'premium',
  bg:{type:'grad', c1:'#101a2b', c2:'#060a12', a:180},
  layers:[
    {kind:'rect', name:'Slab Frame', props:{left:CW/2-320, top:120, width:640, height:340, fill:'rgba(255,255,255,0.06)', rx:22, stroke:'#3a4a63', strokeWidth:3}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'PCGS \u2022 NGC', props:{left:CW/2, top:180, originX:'center', fontFamily:'Satoshi', fontSize:86, fill:'#ffffff', fontWeight:'900'}},
    {kind:'text', name:'Sub', role:'sub', casing:'upper', text:'GRADED COINS WANTED', props:{left:CW/2, top:310, originX:'center', fontFamily:'Khand', fontSize:56, fill:'#8fb4ff', fontWeight:'600'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'We pay for the grade, the strike and the eye appeal \u2014 registry-quality offers on registry-quality coins.', props:{left:CW/2, top:530, width:CW-180, originX:'center', fontFamily:F_UI, fontSize:38, fill:'#c7d0dc', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:740, originX:'center', fontFamily:'Clash Display', fontSize:96, fill:'#8fb4ff'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'CERT NUMBERS GET INSTANT QUOTES', props:{left:CW/2, top:890, originX:'center', fontFamily:'Khand', fontSize:34, fill:'rgba(255,255,255,0.6)', fontWeight:'600', charSpacing:140}},
  ]},
{ id:'coins_ticket', name:'Gold Rush Ticket', tag:'sell', cat:'coins', tier:'premium',
  bg:{type:'solid', c:'#c9a24b'},
  layers:[
    {kind:'rect', name:'Ticket', props:{left:80, top:200, width:CW-160, height:660, fill:'#141210', rx:30, shadow:sh('rgba(0,0,0,0.4)',36,0,16)}},
    {kind:'text', name:'Kicker', role:'sub', casing:'upper', text:'\u2726 ADMIT YOUR COINS \u2726', props:{left:CW/2, top:260, originX:'center', fontFamily:'Clash Display', fontSize:52, fill:'#c9a24b', charSpacing:120}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'THE COIN', props:{left:CW/2, top:350, originX:'center', fontFamily:'Clash Display', fontSize:130, fill:'#ffffff'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'BUY-OUT', props:{left:CW/2, top:490, originX:'center', fontFamily:'Clash Display', fontSize:130, fill:'#f5b700', shadow:sh('rgba(245,183,0,0.4)',24)}},
    {kind:'text', name:'Info', role:'info', casing:'upper', text:'ONE DAY \u2022 EVERY COIN \u2022 CASH PAID', props:{left:CW/2, top:660, originX:'center', fontFamily:'Khand', fontSize:40, fill:'#c9a24b', fontWeight:'600'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:750, originX:'center', fontFamily:'Clash Display', fontSize:84, fill:'#ffffff'}},
  ]},

/* ── CARS (7) ── */
{ id:'cars_anycond', name:'Running Or Not', tag:'buyer', cat:'cars',
  bg:{type:'grad', c1:'#101418', c2:'#000000', a:180},
  layers:[
    {kind:'rect', name:'Hazard Top', props:{left:0, top:0, width:CW, height:44, fill:'#f5b700'}},
    {kind:'rect', name:'Hazard Bottom', props:{left:0, top:CH-44, width:CW, height:44, fill:'#f5b700'}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'WE BUY CARS', props:{left:CW/2, top:130, originX:'center', fontFamily:'Clash Display', fontSize:150, fill:'#ffffff', stroke:'#000000', strokeWidth:6}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'RUNNING OR NOT', props:{left:CW/2, top:310, originX:'center', fontFamily:'Clash Display', fontSize:104, fill:'#f5b700', shadow:sh('rgba(245,183,0,0.4)',24)}},
    {kind:'textbox', name:'Info', role:'info', casing:'upper', text:'BLOWN ENGINE \u2022 SALVAGE \u2022 NO TITLE?\nWRECKED \u2022 FLOODED \u2022 JUST OLD?\nWE STILL WANT IT.', props:{left:CW/2, top:480, width:CW-140, originX:'center', fontFamily:'Khand', fontSize:52, fill:'#c7d0dc', textAlign:'center', lineHeight:1.35, fontWeight:'600'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'FREE TOW \u2022 PAID ON PICKUP', props:{left:CW/2, top:760, originX:'center', fontFamily:F_COND, fontSize:48, fill:'#ffffff', fontWeight:'800'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:860, originX:'center', fontFamily:'Clash Display', fontSize:96, fill:'#f5b700'}},
  ]},
{ id:'cars_kbb', name:'Beat The Trade-In', tag:'promo', cat:'cars',
  bg:{type:'grad', c1:'#0b2340', c2:'#050d18', a:160},
  layers:[
    {kind:'text', name:'Kicker', role:'sub', casing:'upper', text:'DEALER OFFERED YOU WHAT?', props:{left:CW/2, top:110, originX:'center', fontFamily:'Khand', fontSize:52, fill:'#8fb4ff', fontWeight:'600'}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'WE BEAT', props:{left:CW/2, top:210, originX:'center', fontFamily:'Clash Display', fontSize:140, fill:'#ffffff'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'TRADE-IN OFFERS', props:{left:CW/2, top:370, originX:'center', fontFamily:'Clash Display', fontSize:88, fill:'#4da3ff'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Bring their written offer \u2014 we will top it\nor tell you to take it. Straight answers only.', props:{left:CW/2, top:530, width:CW-160, originX:'center', fontFamily:F_UI, fontSize:40, fill:'#c7d0dc', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'VIN + MILES = OFFER IN 10 MINUTES', props:{left:CW/2, top:700, originX:'center', fontFamily:'Khand', fontSize:42, fill:'#ffffff', fontWeight:'600'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:810, originX:'center', fontFamily:'Clash Display', fontSize:96, fill:'#4da3ff'}},
    {kind:'text', name:'Website', role:'website', casing:'none', text:'iphones.LA', props:{left:CW/2, top:950, originX:'center', fontFamily:F_UI, fontSize:26, fill:'rgba(255,255,255,0.4)'}},
  ]},
{ id:'cars_junk', name:'Junk Car Grunge', tag:'sell', cat:'cars', tier:'premium',
  bg:{type:'solid', c:'#171310'},
  layers:[
    {kind:'text', name:'Headline', role:'headline', casing:'none', text:'That car is not', props:{left:CW/2, top:140, originX:'center', fontFamily:'Clash Display', fontSize:84, fill:'#c7d0dc', angle:-2}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'none', text:'a lawn ornament.', props:{left:CW/2, top:260, originX:'center', fontFamily:'Clash Display', fontSize:84, fill:'#ffffff', angle:1}},
    {kind:'text', name:'Big', role:'headline', casing:'upper', text:'CASH FOR JUNKERS', props:{left:CW/2, top:430, originX:'center', fontFamily:'Clash Display', fontSize:108, fill:'#ff5000', shadow:sh('rgba(255,80,0,0.45)',28)}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Dead battery? Flat tires? Wasp nest\nin the glovebox? We tow it free\nand hand you cash before we leave.', props:{left:CW/2, top:580, width:CW-160, originX:'center', fontFamily:F_UI, fontSize:38, fill:'#c9b27c', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:790, originX:'center', fontFamily:'Clash Display', fontSize:100, fill:'#ffffff'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'SAME-DAY PICKUP MOST AREAS', props:{left:CW/2, top:930, originX:'center', fontFamily:'Clash Display', fontSize:36, fill:'#ff5000'}},
  ]},
{ id:'cars_plate', name:'License Plate Split', tag:'promo', cat:'cars', tier:'premium',
  bg:{type:'solid', c:'#e9edf2'},
  layers:[
    {kind:'rect', name:'Plate', props:{left:CW/2-380, top:120, width:760, height:300, fill:'#ffffff', rx:28, stroke:'#10141b', strokeWidth:10, shadow:sh('rgba(0,0,0,0.25)',24,0,12)}},
    {kind:'text', name:'Plate State', role:'sub', casing:'upper', text:'\u2605 CASH \u2605', props:{left:CW/2, top:150, originX:'center', fontFamily:'Khand', fontSize:40, fill:'#8a2b1d', fontWeight:'700', charSpacing:340}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'4-UR-CAR', props:{left:CW/2, top:210, originX:'center', fontFamily:'Clash Display', fontSize:130, fill:'#10141b', charSpacing:80}},
    {kind:'text', name:'Sub', role:'sub', casing:'upper', text:'ANY YEAR \u2022 ANY MAKE \u2022 ANY SHAPE', props:{left:CW/2, top:500, originX:'center', fontFamily:'Satoshi', fontSize:40, fill:'#2a3340', fontWeight:'800', charSpacing:120}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Licensed \u0026 bonded buyer \u2014 title handled,\nDMV paperwork done for you, zero fees.', props:{left:CW/2, top:600, width:CW-200, originX:'center', fontFamily:F_UI, fontSize:38, fill:'#5a6b80', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:770, originX:'center', fontFamily:'Clash Display', fontSize:86, fill:'#10141b'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'TEXT YOUR VIN \u2192 GET A NUMBER', props:{left:CW/2, top:910, originX:'center', fontFamily:'Khand', fontSize:36, fill:'#8a2b1d', fontWeight:'700'}},
  ]},
{ id:'cars_speed', name:'Racing Stripe Speed', tag:'sell', cat:'cars', tier:'premium',
  bg:{type:'grad', c1:'#c81d25', c2:'#5c0a0e', a:135},
  layers:[
    {kind:'rect', name:'Stripe 1', props:{left:-100, top:640, width:CW+200, height:70, fill:'rgba(255,255,255,0.9)', angle:-6}},
    {kind:'rect', name:'Stripe 2', props:{left:-100, top:730, width:CW+200, height:26, fill:'rgba(255,255,255,0.5)', angle:-6}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'SELL IT', props:{left:CW/2, top:110, originX:'center', fontFamily:'Clash Display', fontSize:210, fill:'#ffffff', fontStyle:'italic', shadow:sh('rgba(0,0,0,0.4)',20,8,8)}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'TODAY.', props:{left:CW/2, top:350, originX:'center', fontFamily:'Clash Display', fontSize:210, fill:'#ffffff', fontStyle:'italic', stroke:'#ffffff', strokeWidth:5}},
    {kind:'text', name:'Info', role:'info', casing:'upper', text:'OFFER \u2192 INSPECTION \u2192 PAID. 60 MINUTES.', props:{left:CW/2, top:655, originX:'center', fontFamily:'Khand', fontSize:42, fill:'#ffffff', fontWeight:'700', angle:-6}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:820, originX:'center', fontFamily:'Clash Display', fontSize:104, fill:'#ffffff'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'7 DAYS \u2022 WE COME TO YOU', props:{left:CW/2, top:950, originX:'center', fontFamily:F_COND, fontSize:38, fill:'rgba(255,255,255,0.75)', fontWeight:'700'}},
  ]},
{ id:'cars_fleet', name:'Fleet + Work Trucks', tag:'buyer', cat:'cars', tier:'premium',
  bg:{type:'grad', c1:'#1c2229', c2:'#0a0d11', a:180},
  layers:[
    {kind:'rect', name:'Caution Tag', props:{left:CW/2-260, top:70, width:520, height:76, fill:'#ff8a00', rx:8, angle:-1}},
    {kind:'text', name:'Kicker', role:'sub', casing:'upper', text:'CONTRACTORS \u2022 FLEETS', props:{left:CW/2, top:88, originX:'center', fontFamily:'Khand', fontSize:44, fill:'#ffffff', fontWeight:'700', angle:-1}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'WORK TRUCKS', props:{left:CW/2, top:220, originX:'center', fontFamily:'Clash Display', fontSize:118, fill:'#ffffff'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'\u0026 VANS WANTED', props:{left:CW/2, top:355, originX:'center', fontFamily:'Clash Display', fontSize:96, fill:'#ff8a00'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Retiring units? Downsizing the yard?\nWe buy 1 or 20 \u2014 high miles fine,\nlettering \u0026 racks fine, diesel preferred.', props:{left:CW/2, top:520, width:CW-160, originX:'center', fontFamily:F_UI, fontSize:38, fill:'#c7d0dc', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:760, originX:'center', fontFamily:'Clash Display', fontSize:96, fill:'#ff8a00'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'BULK QUOTES IN WRITING SAME DAY', props:{left:CW/2, top:900, originX:'center', fontFamily:'Khand', fontSize:34, fill:'rgba(255,255,255,0.6)', fontWeight:'600', charSpacing:120}},
  ]},
{ id:'cars_odometer', name:'Odometer Honest', tag:'promo', cat:'cars', tier:'premium',
  bg:{type:'solid', c:'#08090b'},
  layers:[
    {kind:'rect', name:'Gauge Panel', props:{left:CW/2-350, top:140, width:700, height:260, fill:'#101318', rx:130, stroke:'#2a3340', strokeWidth:4}},
    {kind:'text', name:'Odometer', role:'headline', casing:'none', text:'246,801 mi', props:{left:CW/2, top:210, originX:'center', fontFamily:'Khand', fontSize:110, fill:'#4dff88', fontWeight:'600', shadow:sh('rgba(77,255,136,0.4)',24)}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'HIGH MILES? STILL PAYS.', props:{left:CW/2, top:480, originX:'center', fontFamily:'Clash Display', fontSize:92, fill:'#ffffff'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Hondas \u0026 Toyotas especially \u2014 the miles\nscare dealers, not us. Fair offers based\non what your car is actually worth.', props:{left:CW/2, top:620, width:CW-170, originX:'center', fontFamily:F_UI, fontSize:38, fill:'#8fa3bb', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:830, originX:'center', fontFamily:'Clash Display', fontSize:96, fill:'#4dff88'}},
  ]},

/* ── DIABETIC STRIPS (5) ── */
{ id:'strips_clean', name:'Clean Clinical Strips', tag:'buyer', cat:'strips',
  bg:{type:'solid', c:'#f2f7f6'},
  layers:[
    {kind:'rect', name:'Teal Header', solid:true, props:{left:0, top:0, width:CW, height:300, fill:'#0b5551'}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'EXTRA TEST STRIPS?', props:{left:CW/2, top:80, originX:'center', fontFamily:'Satoshi', fontSize:82, fill:'#ffffff', fontWeight:'900'}},
    {kind:'text', name:'Sub', role:'sub', casing:'upper', text:'TURN THEM INTO CASH \u2014 LEGALLY \u0026 SIMPLY', props:{left:CW/2, top:200, originX:'center', fontFamily:F_UI, fontSize:36, fill:'#ffffff', fontWeight:'600'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Unopened \u2022 Unexpired \u2022 Factory sealed\nAll major brands \u2014 boxes checked\nand paid while you wait.', props:{left:CW/2, top:400, width:CW-180, originX:'center', fontFamily:F_UI, fontSize:44, fill:'#1d3a38', textAlign:'center', lineHeight:1.5}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'MAIL-IN KITS AVAILABLE \u2014 FREE SHIPPING', props:{left:CW/2, top:680, originX:'center', fontFamily:'Satoshi', fontSize:32, fill:'#0f6e6a', fontWeight:'800'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:780, originX:'center', fontFamily:'Satoshi', fontSize:84, fill:'#0f6e6a', fontWeight:'900'}},
    {kind:'text', name:'Website', role:'website', casing:'none', text:'iphones.LA', props:{left:CW/2, top:920, originX:'center', fontFamily:F_UI, fontSize:28, fill:'#5a8683'}},
  ]},
{ id:'strips_box', name:'Box Count Bold', tag:'promo', cat:'strips', tier:'premium',
  bg:{type:'grad', c1:'#123c5e', c2:'#071726', a:170},
  layers:[
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'EVERY SEALED BOX', props:{left:CW/2, top:140, originX:'center', fontFamily:'Clash Display', fontSize:98, fill:'#ffffff'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'= MONEY', props:{left:CW/2, top:260, originX:'center', fontFamily:'Clash Display', fontSize:160, fill:'#4dd7ff', shadow:sh('rgba(77,215,255,0.4)',34)}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Insurance sent too many? Switched meters?\nDo not let good boxes expire in a drawer.\nWe pay by brand \u0026 date \u2014 transparent list.', props:{left:CW/2, top:480, width:CW-160, originX:'center', fontFamily:F_UI, fontSize:40, fill:'#bfe7e4', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'TEXT A PHOTO OF YOUR BOXES', props:{left:CW/2, top:700, originX:'center', fontFamily:'Khand', fontSize:44, fill:'#ffffff', fontWeight:'600'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:810, originX:'center', fontFamily:'Clash Display', fontSize:96, fill:'#4dd7ff'}},
  ]},
{ id:'strips_pickup', name:'Discreet Pickup', tag:'sell', cat:'strips', tier:'premium',
  bg:{type:'solid', c:'#101315'},
  layers:[
    {kind:'text', name:'Lock', role:'deco', text:'\uD83E\uDD10', props:{left:CW/2, top:80, originX:'center', fontSize:110}},
    {kind:'text', name:'Headline', role:'headline', casing:'title', text:'Private. Discreet. Paid.', props:{left:CW/2, top:250, originX:'center', fontFamily:'Zodiak', fontSize:86, fill:'#ffffff', fontStyle:'italic'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Curbside pickup \u2022 No questions beyond\nthe expiration date \u2022 Cash or instant transfer', props:{left:CW/2, top:430, width:CW-170, originX:'center', fontFamily:F_UI, fontSize:42, fill:'#9fc3c0', textAlign:'center', lineHeight:1.5}},
    {kind:'text', name:'Sub', role:'sub', casing:'upper', text:'STRIPS \u2022 SENSORS \u2022 LANCETS', props:{left:CW/2, top:640, originX:'center', fontFamily:'Satoshi', fontSize:36, fill:'#4dd7ff', fontWeight:'800', charSpacing:200}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:760, originX:'center', fontFamily:'Satoshi', fontSize:88, fill:'#ffffff', fontWeight:'900'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'REPLIES IN MINUTES, NOT DAYS', props:{left:CW/2, top:910, originX:'center', fontFamily:'Khand', fontSize:32, fill:'rgba(255,255,255,0.55)', fontWeight:'600', charSpacing:180}},
  ]},
{ id:'strips_cgm', name:'CGM Sensor Buyer', tag:'buyer', cat:'strips', tier:'premium',
  bg:{type:'grad', c1:'#0e2e2c', c2:'#04100f', a:160},
  layers:[
    {kind:'rect', name:'Pill', props:{left:CW/2-300, top:100, width:600, height:96, fill:'#17b8a6', rx:48}},
    {kind:'text', name:'Kicker', role:'sub', casing:'upper', text:'DEXCOM \u2022 LIBRE \u2022 OMNIPOD', props:{left:CW/2, top:126, originX:'center', fontFamily:'Satoshi', fontSize:40, fill:'#ffffff', fontWeight:'900'}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'SENSORS \u0026 PODS', props:{left:CW/2, top:270, originX:'center', fontFamily:'Clash Display', fontSize:104, fill:'#ffffff'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'BOUGHT SEALED', props:{left:CW/2, top:390, originX:'center', fontFamily:'Clash Display', fontSize:88, fill:'#4de3cf'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Top payouts on long-dated boxes.\nDamaged retail box? Still fine if the\ninner seal is intact.', props:{left:CW/2, top:540, width:CW-180, originX:'center', fontFamily:F_UI, fontSize:38, fill:'#bfe7e4', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:760, originX:'center', fontFamily:'Clash Display', fontSize:94, fill:'#4de3cf'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'SAME-DAY LOCAL MEETUPS', props:{left:CW/2, top:900, originX:'center', fontFamily:'Khand', fontSize:34, fill:'rgba(255,255,255,0.6)', fontWeight:'600', charSpacing:160}},
  ]},
{ id:'strips_expiry', name:'Expiry Countdown', tag:'promo', cat:'strips', tier:'premium',
  bg:{type:'solid', c:'#151005'},
  layers:[
    {kind:'text', name:'Clock', role:'deco', text:'\u23F3', props:{left:CW/2, top:70, originX:'center', fontSize:120}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'EXPIRING BOXES', props:{left:CW/2, top:250, originX:'center', fontFamily:'Clash Display', fontSize:110, fill:'#ffb020'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'LOSE VALUE DAILY', props:{left:CW/2, top:380, originX:'center', fontFamily:'Clash Display', fontSize:92, fill:'#ffffff'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'12+ months out pays the most.\nEven 6 months still pays \u2014 but the\nclock only runs one way. Sell now.', props:{left:CW/2, top:540, width:CW-180, originX:'center', fontFamily:F_UI, fontSize:40, fill:'#d8c9a3', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:760, originX:'center', fontFamily:'Clash Display', fontSize:98, fill:'#ffb020'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'QUOTE FROM ONE PHOTO \u2014 TRY IT', props:{left:CW/2, top:905, originX:'center', fontFamily:'Khand', fontSize:36, fill:'rgba(255,255,255,0.65)', fontWeight:'600'}},
  ]},

/* ── POKEMON CARDS (7) ── */
{ id:'pkm_binder', name:'Binder Buy-Out', tag:'buyer', cat:'pokemon',
  bg:{type:'grad', c1:'#12245e', c2:'#080f28', a:160},
  layers:[
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'YOUR OLD BINDER', props:{left:CW/2, top:120, originX:'center', fontFamily:'Clash Display', fontSize:110, fill:'#ffd200', charSpacing:60, shadow:sh('rgba(0,0,0,0.6)',14,5,5)}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'MIGHT BE A GOLDMINE', props:{left:CW/2, top:250, originX:'center', fontFamily:'Clash Display', fontSize:92, fill:'#ffffff', charSpacing:40, shadow:sh('rgba(0,0,0,0.6)',14,5,5)}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Base Set \u2022 Charizards \u2022 1st Editions\nShadowless \u2022 Japanese \u2022 Full binders\nWe grade-check for free, in front of you.', props:{left:CW/2, top:430, width:CW-150, originX:'center', fontFamily:F_UI, fontSize:42, fill:'#bcd0ff', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'CASH \u2014 NOT STORE CREDIT', props:{left:CW/2, top:680, originX:'center', fontFamily:'Khand', fontSize:52, fill:'#ffd200', fontWeight:'700'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:800, originX:'center', fontFamily:'Clash Display', fontSize:96, fill:'#ffffff'}},
    {kind:'text', name:'Website', role:'website', casing:'none', text:'iphones.LA', props:{left:CW/2, top:940, originX:'center', fontFamily:F_UI, fontSize:26, fill:'rgba(255,255,255,0.4)'}},
  ]},
{ id:'pkm_zard', name:'Charizard Callout', tag:'promo', cat:'pokemon',
  bg:{type:'grad', c1:'#ff5000', c2:'#8a1500', a:160},
  layers:[
    {kind:'text', name:'Fire', role:'deco', text:'\uD83D\uDD25', props:{left:CW/2, top:60, originX:'center', fontSize:130}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'GOT A ZARD?', props:{left:CW/2, top:240, originX:'center', fontFamily:'Clash Display', fontSize:180, fill:'#ffffff', stroke:'#000000', strokeWidth:6, shadow:sh('rgba(0,0,0,0.5)',18,6,6)}},
    {kind:'text', name:'Sub', role:'sub', casing:'upper', text:'HOLO \u2022 SHADOWLESS \u2022 GRADED \u2022 RAW', props:{left:CW/2, top:470, originX:'center', fontFamily:'Khand', fontSize:46, fill:'#ffd200', fontWeight:'700'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Serious money for serious cards \u2014\nrecent comps shown with every offer.', props:{left:CW/2, top:590, width:CW-180, originX:'center', fontFamily:F_UI, fontSize:40, fill:'#ffe3c2', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:760, originX:'center', fontFamily:'Clash Display', fontSize:100, fill:'#ffd200', stroke:'#000000', strokeWidth:3}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'TEXT A PIC \u2014 OFFER IN MINUTES', props:{left:CW/2, top:905, originX:'center', fontFamily:'Clash Display', fontSize:44, fill:'#ffffff', charSpacing:40}},
  ]},
{ id:'pkm_sealed', name:'Sealed Product Vault', tag:'buyer', cat:'pokemon', tier:'premium',
  bg:{type:'solid', c:'#0a0d18'},
  layers:[
    {kind:'rect', name:'Vault Frame', props:{left:90, top:90, width:CW-180, height:CH-180, fill:'rgba(0,0,0,0)', stroke:'#ffd200', strokeWidth:3, rx:24}},
    {kind:'text', name:'Kicker', role:'sub', casing:'upper', text:'DO NOT OPEN THAT BOX', props:{left:CW/2, top:150, originX:'center', fontFamily:'Khand', fontSize:48, fill:'#ff5b5b', fontWeight:'700', charSpacing:120}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'SEALED PRODUCT', props:{left:CW/2, top:260, originX:'center', fontFamily:'Clash Display', fontSize:100, fill:'#ffffff'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'PAYS PREMIUM', props:{left:CW/2, top:375, originX:'center', fontFamily:'Clash Display', fontSize:100, fill:'#ffd200'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Booster boxes \u2022 ETBs \u2022 Collections\nVintage WOTC to modern \u2014 factory\nseal intact = top of market paid.', props:{left:CW/2, top:530, width:CW-220, originX:'center', fontFamily:F_UI, fontSize:38, fill:'#bcd0ff', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:750, originX:'center', fontFamily:'Clash Display', fontSize:92, fill:'#ffd200'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'BULK COLLECTIONS WELCOME', props:{left:CW/2, top:890, originX:'center', fontFamily:'Khand', fontSize:34, fill:'rgba(255,255,255,0.6)', fontWeight:'600', charSpacing:180}},
  ]},
{ id:'pkm_attic', name:'Attic Nostalgia', tag:'sell', cat:'pokemon', tier:'premium',
  bg:{type:'grad', c1:'#3d2a10', c2:'#160e04', a:170},
  layers:[
    {kind:'text', name:'Headline', role:'headline', casing:'none', text:'Remember 1999?', props:{left:CW/2, top:140, originX:'center', fontFamily:'Clash Display', fontSize:96, fill:'#ffd27a', angle:-2}},
    {kind:'text', name:'Sub', role:'sub', casing:'none', text:'Your childhood shoebox does.', props:{left:CW/2, top:290, originX:'center', fontFamily:'Zodiak', fontSize:52, fill:'#ffffff', fontStyle:'italic'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Those playground cards are adult money\nnow. Dig out the shoebox \u2014 we will sort\nit together and pay for the hits.', props:{left:CW/2, top:440, width:CW-170, originX:'center', fontFamily:F_UI, fontSize:42, fill:'#d8c9a3', textAlign:'center', lineHeight:1.5}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'FREE LOOK \u2014 ZERO PRESSURE', props:{left:CW/2, top:660, originX:'center', fontFamily:'Khand', fontSize:44, fill:'#ffd27a', fontWeight:'600'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:790, originX:'center', fontFamily:'Clash Display', fontSize:98, fill:'#ffffff'}},
    {kind:'text', name:'Badges', role:'badges', casing:'upper', text:'\u2713LOCAL  \u2713TRUSTED', props:{left:CW-30, top:30, originX:'right', fontFamily:'Satoshi', fontSize:29, fill:'#ffffff', fontWeight:'800', charSpacing:70, lineHeight:1.5, shadow:sh('rgba(0,0,0,0.6)',10,0,3)}},
  ]},
{ id:'pkm_grade', name:'Grade Gap Explainer', tag:'promo', cat:'pokemon', tier:'premium',
  bg:{type:'solid', c:'#101014'},
  layers:[
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'PSA 9 vs PSA 10', props:{left:CW/2, top:130, originX:'center', fontFamily:'Satoshi', fontSize:96, fill:'#ffffff', fontWeight:'900'}},
    {kind:'text', name:'Sub', role:'sub', casing:'upper', text:'CAN BE A 5X PRICE GAP', props:{left:CW/2, top:270, originX:'center', fontFamily:'Khand', fontSize:56, fill:'#ffd200', fontWeight:'600'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'We pre-screen your raw cards with the\nsame checklist graders use \u2014 centering,\nedges, surface \u2014 and pay for the upside.', props:{left:CW/2, top:420, width:CW-170, originX:'center', fontFamily:F_UI, fontSize:40, fill:'#bcd0ff', textAlign:'center', lineHeight:1.5}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'SLABS ALSO BOUGHT AT COMP PRICES', props:{left:CW/2, top:650, originX:'center', fontFamily:'Khand', fontSize:38, fill:'#ffffff', fontWeight:'600'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:780, originX:'center', fontFamily:'Clash Display', fontSize:96, fill:'#ffd200'}},
    {kind:'text', name:'Website', role:'website', casing:'none', text:'iphones.LA', props:{left:CW/2, top:930, originX:'center', fontFamily:F_UI, fontSize:26, fill:'rgba(255,255,255,0.4)'}},
  ]},
{ id:'pkm_jp', name:'Japanese Exclusives', tag:'buyer', cat:'pokemon', tier:'premium',
  bg:{type:'grad', c1:'#c81d4e', c2:'#3d0a1c', a:150},
  layers:[
    {kind:'text', name:'Rising Sun', role:'deco', text:'\u26E9\uFE0F', props:{left:CW/2, top:70, originX:'center', fontSize:110}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'JAPANESE CARDS', props:{left:CW/2, top:240, originX:'center', fontFamily:'Clash Display', fontSize:108, fill:'#ffffff'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'WANTED BADLY', props:{left:CW/2, top:365, originX:'center', fontFamily:'Clash Display', fontSize:108, fill:'#ffd200', shadow:sh('rgba(255,210,0,0.35)',26)}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Promos \u2022 Trophy cards \u2022 Vending sheets\nOld Back anything \u2014 if it is from Japan\nand mint, we are your best offer.', props:{left:CW/2, top:530, width:CW-170, originX:'center', fontFamily:F_UI, fontSize:38, fill:'#ffd9e2', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:760, originX:'center', fontFamily:'Clash Display', fontSize:96, fill:'#ffffff'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'COLLECTION MANAGERS: DM US FIRST', props:{left:CW/2, top:900, originX:'center', fontFamily:'Khand', fontSize:34, fill:'rgba(255,255,255,0.7)', fontWeight:'600', charSpacing:120}},
  ]},
{ id:'pkm_bulk', name:'Bulk By The Pound', tag:'sell', cat:'pokemon', tier:'premium',
  bg:{type:'solid', c:'#0b1e12'},
  layers:[
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'BULK CARDS', props:{left:CW/2, top:140, originX:'center', fontFamily:'Clash Display', fontSize:130, fill:'#4dff88'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'BY THE POUND', props:{left:CW/2, top:290, originX:'center', fontFamily:'Clash Display', fontSize:100, fill:'#ffffff'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Commons, energies, whole tubs \u2014\nyes, even those. Weighed on a certified\nscale, paid per pound, hauled away free.', props:{left:CW/2, top:470, width:CW-170, originX:'center', fontFamily:F_UI, fontSize:40, fill:'#bfe7cd', textAlign:'center', lineHeight:1.5}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'HITS PULLED \u0026 PAID SEPARATELY', props:{left:CW/2, top:680, originX:'center', fontFamily:'Khand', fontSize:42, fill:'#4dff88', fontWeight:'600'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:800, originX:'center', fontFamily:'Clash Display', fontSize:96, fill:'#ffffff'}},
  ]},

/* ── SPORTS CARDS (6) ── */
{ id:'sports_rookie', name:'Rookie Card Radar', tag:'buyer', cat:'sports',
  bg:{type:'grad', c1:'#0b3d2e', c2:'#041a12', a:170},
  layers:[
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'ROOKIE CARDS', props:{left:CW/2, top:130, originX:'center', fontFamily:'Clash Display', fontSize:130, fill:'#ffffff', fontStyle:'italic'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'BOUGHT AT COMPS', props:{left:CW/2, top:285, originX:'center', fontFamily:'Clash Display', fontSize:92, fill:'#4dff88', fontStyle:'italic', shadow:sh('rgba(77,255,136,0.35)',24)}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Prizm \u2022 Topps Chrome \u2022 Bowman 1sts\nAutos \u0026 numbered parallels \u2014 we track\nlive sales, you get the real number.', props:{left:CW/2, top:450, width:CW-160, originX:'center', fontFamily:F_UI, fontSize:42, fill:'#bfe7cd', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'NO CONSIGNMENT WAIT \u2014 PAID TODAY', props:{left:CW/2, top:680, originX:'center', fontFamily:'Khand', fontSize:42, fill:'#ffffff', fontWeight:'600'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:800, originX:'center', fontFamily:'Clash Display', fontSize:96, fill:'#4dff88'}},
    {kind:'text', name:'Website', role:'website', casing:'none', text:'iphones.LA', props:{left:CW/2, top:940, originX:'center', fontFamily:F_UI, fontSize:26, fill:'rgba(255,255,255,0.4)'}},
  ]},
{ id:'sports_score', name:'Scoreboard Flash', tag:'promo', cat:'sports',
  bg:{type:'solid', c:'#0a0a0d'},
  layers:[
    {kind:'rect', name:'Board', props:{left:90, top:110, width:CW-180, height:330, fill:'#111118', rx:18, stroke:'#2a2a36', strokeWidth:4}},
    {kind:'text', name:'Score You', role:'headline', casing:'upper', text:'YOU: PAID', props:{left:CW/2, top:170, originX:'center', fontFamily:'Khand', fontSize:92, fill:'#ffd200', fontWeight:'700', shadow:sh('rgba(255,210,0,0.4)',20)}},
    {kind:'text', name:'Score Them', role:'headline', casing:'upper', text:'EBAY FEES: 0', props:{left:CW/2, top:300, originX:'center', fontFamily:'Khand', fontSize:70, fill:'#ff5b5b', fontWeight:'700'}},
    {kind:'text', name:'Sub', role:'sub', casing:'upper', text:'SKIP THE LISTINGS. SKIP THE FEES.', props:{left:CW/2, top:520, originX:'center', fontFamily:'Clash Display', fontSize:52, fill:'#ffffff'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Full card collections bought outright \u2014\nbasketball, football, baseball, soccer.', props:{left:CW/2, top:640, width:CW-180, originX:'center', fontFamily:F_UI, fontSize:40, fill:'#c7d0dc', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:800, originX:'center', fontFamily:'Clash Display', fontSize:96, fill:'#ffd200'}},
  ]},
{ id:'sports_goat', name:'GOAT Era Vintage', tag:'sell', cat:'sports', tier:'premium',
  bg:{type:'grad', c1:'#3d1508', c2:'#160702', a:160},
  layers:[
    {kind:'text', name:'Kicker', role:'sub', casing:'upper', text:'JORDAN \u2022 BRADY \u2022 MANTLE \u2022 KOBE', props:{left:CW/2, top:110, originX:'center', fontFamily:'Khand', fontSize:42, fill:'#ff9d5c', fontWeight:'600', charSpacing:100}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'GOAT CARDS', props:{left:CW/2, top:210, originX:'center', fontFamily:'Clash Display', fontSize:160, fill:'#ffffff', shadow:sh('rgba(0,0,0,0.5)',20,6,6)}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'DESERVE GOAT OFFERS', props:{left:CW/2, top:400, originX:'center', fontFamily:'Clash Display', fontSize:74, fill:'#ff9d5c'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Vintage to modern grails \u2014 if it hangs\nin a man cave, it cashes out here.\nAuthentication handled on the spot.', props:{left:CW/2, top:540, width:CW-170, originX:'center', fontFamily:F_UI, fontSize:40, fill:'#e8cdb8', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:770, originX:'center', fontFamily:'Clash Display', fontSize:98, fill:'#ffffff'}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'PRIVATE SALES \u2014 NO AUCTION CIRCUS', props:{left:CW/2, top:910, originX:'center', fontFamily:'Khand', fontSize:34, fill:'rgba(255,255,255,0.65)', fontWeight:'600', charSpacing:120}},
  ]},
{ id:'sports_break', name:'Breaker Overflow', tag:'buyer', cat:'sports', tier:'premium',
  bg:{type:'grad', c1:'#1d1040', c2:'#090418', a:160},
  layers:[
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'BREAKERS:', props:{left:CW/2, top:130, originX:'center', fontFamily:'Clash Display', fontSize:120, fill:'#b78bff'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'SELL YOUR HITS', props:{left:CW/2, top:270, originX:'center', fontFamily:'Clash Display', fontSize:96, fill:'#ffffff'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'Weekend breaks piling up? We buy\nyour pulled slabs, autos \u0026 parallels\nin bulk lots \u2014 one transfer, all gone.', props:{left:CW/2, top:430, width:CW-170, originX:'center', fontFamily:F_UI, fontSize:42, fill:'#d9c9ff', textAlign:'center', lineHeight:1.45}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'STANDING WEEKLY BUY-OUTS AVAILABLE', props:{left:CW/2, top:650, originX:'center', fontFamily:'Khand', fontSize:38, fill:'#b78bff', fontWeight:'600'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:780, originX:'center', fontFamily:'Clash Display', fontSize:96, fill:'#ffffff'}},
    {kind:'text', name:'Badges', role:'badges', casing:'upper', text:'\u2713FAST PAY  \u2713BULK OK', props:{left:CW-30, top:30, originX:'right', fontFamily:F_COND, fontSize:32, fill:'#ffffff', fontWeight:'900', backgroundColor:'#b78bff', padding:6}},
  ]},
{ id:'sports_ticket', name:'Season Ticket Stub', tag:'promo', cat:'sports', tier:'premium',
  bg:{type:'solid', c:'#f4efe4'},
  layers:[
    {kind:'rect', name:'Stub', props:{left:70, top:250, width:CW-140, height:560, fill:'#14213d', rx:22, shadow:sh('rgba(0,0,0,0.3)',30,0,14)}},
    {kind:'rect', name:'Perforation', props:{left:CW-300, top:250, width:6, height:560, fill:'rgba(244,239,228,0.5)'}},
    {kind:'text', name:'Kicker', role:'sub', casing:'upper', text:'ADMIT: YOUR COLLECTION', props:{left:100, top:300, fontFamily:'Khand', fontSize:38, fill:'#fca311', fontWeight:'600', charSpacing:160}},
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'CARD SHOW', props:{left:100, top:370, fontFamily:'Clash Display', fontSize:120, fill:'#ffffff'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'PRICES DAILY', props:{left:100, top:510, fontFamily:'Clash Display', fontSize:96, fill:'#fca311'}},
    {kind:'text', name:'Info', role:'info', casing:'none', text:'Why wait for the convention? Show rates, every single day.', props:{left:100, top:650, fontFamily:F_UI, fontSize:34, fill:'#e5e5e5', width:CW-420}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:880, originX:'center', fontFamily:'Clash Display', fontSize:88, fill:'#14213d'}},
  ]},
{ id:'sports_setbuild', name:'Set Builder Wanted', tag:'sell', cat:'sports', tier:'premium',
  bg:{type:'grad', c1:'#15304d', c2:'#081524', a:180},
  layers:[
    {kind:'text', name:'Headline', role:'headline', casing:'upper', text:'COMPLETE SETS', props:{left:CW/2, top:150, originX:'center', fontFamily:'Khand', fontSize:116, fill:'#ffffff', fontWeight:'700'}},
    {kind:'text', name:'Headline 2', role:'headline', casing:'upper', text:'\u0026 WAX BOXES', props:{left:CW/2, top:290, originX:'center', fontFamily:'Khand', fontSize:116, fill:'#4da3ff', fontWeight:'700'}},
    {kind:'textbox', name:'Info', role:'info', casing:'none', text:'86 Fleer to 2024 releases \u2014 sealed wax,\nfactory sets, and the shoebox of doubles\nyou almost threw away. Bring it all.', props:{left:CW/2, top:470, width:CW-160, originX:'center', fontFamily:F_UI, fontSize:42, fill:'#bcd7ff', textAlign:'center', lineHeight:1.5}},
    {kind:'text', name:'CTA', role:'cta', casing:'upper', text:'ESTATES \u0026 STORAGE UNITS: CALL FIRST', props:{left:CW/2, top:690, originX:'center', fontFamily:'Khand', fontSize:38, fill:'#ffffff', fontWeight:'600'}},
    {kind:'text', name:'Phone Number', role:'phone', casing:'none', text:'(562) 999-4994', props:{left:CW/2, top:810, originX:'center', fontFamily:'Clash Display', fontSize:96, fill:'#4da3ff'}},
  ]},

];

/* ═══════════════════ DESIGNER LIBRARY (premium) ═══════════════════
   ~110 studio-grade templates generated from 16 hand-built layout
   architectures × curated complementary palettes × locked font pairings.
   Design language distilled from the brand's strongest ad sets (the
   FIxed / NEWWATERMARK series): rounded ultra-heavy display type, white
   first line + GRADIENT money word, glow, ribbon badges, check-circle
   trust stack, rounded CTA cards, dark bokeh product photography.
   Every template names its own background photo in assets/bg/ (see
   window.BG_MANIFEST + assets/bg/MANIFEST.md) and carries a designed
   gradient fallback so nothing ever renders broken. */
(function designerLibrary(){
  const W = 1080, CX = 540;
  const t  = (name, role, casing, text, props, extra) => Object.assign({ kind:'text', name, role, casing, text, props }, extra || {});
  const tb = (name, role, casing, text, props) => ({ kind:'textbox', name, role, casing, text, props });
  const r  = (name, props) => ({ kind:'rect', name, solid:true, props });
  const rg = (name, props) => ({ kind:'rect', name, props });            // glassy-allowed rect
  const ci = (name, props) => ({ kind:'circle', name, props });

  // ── curated complementary palettes ──  paper:true = light background
  const PAL = {
    volt:    { bg1:'#0b1020', bg2:'#1d2e54', ink:'#ffffff', sub:'#c9d6ff', a1:'#b7ff2e', a2:'#37d6ff', deep:'#07090f', glow:'rgba(183,255,46,0.55)', glow2:'rgba(55,214,255,0.5)' },
    coral:   { paper:true, bg1:'#f6e7d3', bg2:'#eed7ba', ink:'#ffffff', sub:'#ffe4d1', a1:'#ff5a3c', a2:'#ff9d3c', deep:'#171310', glow:'rgba(255,90,60,0.35)', glow2:'rgba(255,157,60,0.3)' },
    gold:    { bg1:'#0d0b07', bg2:'#2a1f10', ink:'#f6ead2', sub:'#cbb98f', a1:'#f5c96b', a2:'#e09b2d', deep:'#0a0805', glow:'rgba(245,201,107,0.5)', glow2:'rgba(224,155,45,0.4)' },
    emerald: { bg1:'#06231c', bg2:'#0e4936', ink:'#f2fff9', sub:'#b8e6d2', a1:'#6bffc9', a2:'#2ec27e', deep:'#04120d', glow:'rgba(107,255,201,0.5)', glow2:'rgba(46,194,126,0.4)' },
    royal:   { bg1:'#140a2e', bg2:'#2f1a6e', ink:'#ffffff', sub:'#cfc4ff', a1:'#ffc24b', a2:'#ff8a5c', deep:'#0d0720', glow:'rgba(255,194,75,0.5)', glow2:'rgba(185,167,255,0.45)' },
    crimson: { bg1:'#1a0c10', bg2:'#43141f', ink:'#fff5f5', sub:'#e8c9cd', a1:'#ff3b52', a2:'#ff8a4b', deep:'#120709', glow:'rgba(255,59,82,0.5)', glow2:'rgba(255,138,75,0.4)' },
    ocean:   { bg1:'#061c2c', bg2:'#0e3d58', ink:'#f2fbff', sub:'#bcdcec', a1:'#45e0ff', a2:'#3c8dff', deep:'#04121c', glow:'rgba(69,224,255,0.5)', glow2:'rgba(60,141,255,0.45)' },
    paper:   { paper:true, bg1:'#f2ead8', bg2:'#e6d9bd', ink:'#ffffff', sub:'#f0e6cf', a1:'#e3a51c', a2:'#c77f14', deep:'#191713', glow:'rgba(227,165,28,0.35)', glow2:'rgba(199,127,20,0.3)' },
    rose:    { bg1:'#16161d', bg2:'#2b2634', ink:'#ffffff', sub:'#d9d3e2', a1:'#ff7ba9', a2:'#ffb17b', deep:'#0e0e13', glow:'rgba(255,123,169,0.5)', glow2:'rgba(255,177,123,0.4)' },
    arctic:  { paper:true, bg1:'#eef3f8', bg2:'#d6e3ef', ink:'#ffffff', sub:'#dce9f7', a1:'#2f7cff', a2:'#19c8e0', deep:'#10233a', glow:'rgba(47,124,255,0.3)', glow2:'rgba(25,200,224,0.3)' },
    mono:    { bg1:'#141417', bg2:'#2a2a30', ink:'#ffffff', sub:'#c8c8cf', a1:'#e8e8f0', a2:'#9a9aa6', deep:'#0c0c0e', glow:'rgba(232,232,240,0.4)', glow2:'rgba(154,154,166,0.35)' },
    sunset:  { bg1:'#1c0f2e', bg2:'#54173f', ink:'#fff7ef', sub:'#ffd9c4', a1:'#ffb13c', a2:'#ff4f7e', deep:'#140a1f', glow:'rgba(255,177,60,0.5)', glow2:'rgba(255,79,126,0.45)' },
  };

  /* ── ACCENT DISCIPLINE ───────────────────────────────────────────────────
     Several accents were pure neon: volt's #b7ff2e lime, ocean's #45e0ff, the
     mint in emerald. Neon is the reason a "we buy your phone, text me" ad can
     read as a scam rather than as a business, and trust IS the conversion
     here, so the saturation was costing money.

     The tension worth naming: these ads have to stop a scroll in a hostile
     feed, so "restrained" cannot mean "quiet". The resolution is the one real
     advertising uses, and it is why a Swiss poster still grabs you from across
     a room: attention comes from CONTRAST AND SCALE, not from saturation. A
     huge white word on a dark photograph out-competes a lime one and looks
     like a company rather than a flyer stapled to a pole.

     So: hue is preserved (volt stays green, ocean stays cyan, each template
     keeps its identity), but anything both very saturated and very light is
     deepened into a rich version of itself. The lightness floor keeps every
     accent bright enough to hold contrast against a near-black ground. */
  (function tameAccents(){
    const toHsl = hex => {
      const n = parseInt(hex.slice(1), 16);
      const r=((n>>16)&255)/255, g=((n>>8)&255)/255, b=(n&255)/255;
      const mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn, l=(mx+mn)/2;
      if (!d) return [0, 0, l];
      const s = l > 0.5 ? d/(2-mx-mn) : d/(mx+mn);
      let h = mx===r ? ((g-b)/d)%6 : mx===g ? (b-r)/d+2 : (r-g)/d+4;
      h *= 60; if (h < 0) h += 360;
      return [h, s, l];
    };
    const toHex = (h, s, l) => {
      const c = (1-Math.abs(2*l-1))*s, x = c*(1-Math.abs((h/60)%2-1)), m = l-c/2;
      const [r,g,b] = h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
      const q = v => Math.round((v+m)*255).toString(16).padStart(2,'0');
      return '#' + q(r) + q(g) + q(b);
    };
    Object.values(PAL).forEach(P => {
      ['a1','a2'].forEach(k => {
        const v = P[k];
        if (typeof v !== 'string' || !/^#[0-9a-f]{6}$/i.test(v)) return;
        const [h, s, l] = toHsl(v);
        if (s > 0.72 && l > 0.58){
          // deepen, but never below a lightness that still reads on near-black
          P[k] = toHex(h, Math.min(s, 0.66), Math.max(0.52, l - 0.16));
        }
      });
    });
  })();

  /* ── locked font pairings [display, support] ──────────────────────────────
     The old set was the free-font shelf: Passion One, Titan One, Lilita One,
     Alfa Slab, Abril Fatface, Bungee, Monoton, Shrikhand, Pacifico, Luckiest
     Guy, Black Ops One, Special Elite, Vast Shadow. Every Canva template in
     existence is already built from those, and half are novelty faces, which
     is the wrong voice entirely for an ad asking a stranger to hand over a
     phone for cash.

     Five voices now, all Fontshare, all self-hosted:
       Clash Display  the money word, a modern grotesque with real character
       Satoshi        everything that is read rather than declared
       Khand          condensed, for long words that a wide face overflows
       Melodrama      high-contrast serif: valuation, not clearance
       Zodiak         editorial serif for quotes and trust copy

     The KEYS are unchanged so every BOOK row still resolves. They no longer
     name a typeface, they name a voice. */
  const PAIRS = {
    // grotesque voice
    passion:  ['Clash Display', 'Satoshi'],
    lilita:   ['Clash Display', 'Satoshi'],
    bungee:   ['Clash Display', 'Satoshi'],
    lucky:    ['Clash Display', 'Satoshi'],
    shrik:    ['Clash Display', 'Satoshi'],
    rowdies:  ['Clash Display', 'Satoshi'],
    // heavy sans voice
    titan:    ['Satoshi', 'Satoshi'],
    right:    ['Satoshi', 'Satoshi'],
    russo:    ['Satoshi', 'Satoshi'],
    blackops: ['Satoshi', 'Satoshi'],
    // condensed voice, for the long money-words
    staat:    ['Khand', 'Satoshi'],
    monoton:  ['Khand', 'Satoshi'],
    ultra:    ['Khand', 'Satoshi'],
    // high-contrast serif voice
    abril:    ['Melodrama', 'Satoshi'],
    cinzel:   ['Melodrama', 'Satoshi'],
    vast:     ['Melodrama', 'Satoshi'],
    // editorial serif voice
    playfair: ['Zodiak', 'Satoshi'],
    slab:     ['Zodiak', 'Satoshi'],
    elite:    ['Zodiak', 'Satoshi'],
    pacifico: ['Zodiak', 'Satoshi'],
  };

  // ── per-category copy decks + background photo scenes ──
  const DECKS = {
    phones:  { k:'TOP BUYER', h1:'SELL YOUR', h2:'iPHONE', alt2:'iPHONES', items:'iPhone • iPad • MacBook • Samsung', sub:'SAME DAY CASH • EASY LOCAL MEETUP\niCLOUD LOCKED, BROKEN, BLACKLISTED\nANY CONDITION • ANY CARRIER', cta:'TEXT US NOW!', price:'UP TO $1,100 PAID TODAY', big:'$1,100', badges:['SAFE','QUICK','EASY'],
               scene:'extreme macro of iPhone Pro camera arrays layered in a fan, shallow depth of field bokeh' },
    gold:    { k:'LICENSED BUYER', h1:'CASH FOR', h2:'GOLD', alt2:'YOUR GOLD', items:'Rings • Chains • Coins • Dental • Broken', sub:'TESTED & PAID IN FRONT OF YOU\n10K • 14K • 18K • 24K WELCOME\nESTATES & INHERITANCE HANDLED DISCREETLY', cta:'GET A FREE QUOTE', price:'PAYING UP TO 95% OF SPOT', big:'95% SPOT', badges:['TESTED','FAIR','PRIVATE'],
               scene:'molten-look gold chains and rings piled on dark velvet, warm rim lighting, macro bokeh' },
    silver:  { k:'BULLION DESK', h1:'WE BUY', h2:'SILVER', alt2:'STERLING', items:'Flatware • Bars • Sterling • 90% Coins', sub:'INSTANT ASSAY • WATCH THE SCALE\nBARS, ROUNDS, FLATWARE, TEA SETS\nPAYING OVER SPOT ON PREMIUMS', cta:'BRING IT IN TODAY', price:'PAYING OVER SPOT', big:'SPOT+', badges:['ASSAYED','HONEST','FAST'],
               scene:'stacked silver bars and coins with cool studio reflections, dark slate background, shallow focus' },
    coins:   { k:'COLLECTIONS WANTED', h1:'RARE', h2:'COINS', alt2:'COIN LOTS', items:'Morgans • Gold Eagles • Proof Sets • Errors', sub:'FULL COLLECTIONS OR SINGLE PIECES\nGRADED & RAW • HONEST NUMISMATIC OFFERS\nHOUSE CALLS FOR LARGE ESTATES', cta:'TEXT PHOTOS FOR OFFER', price:'PAYING OVER GREYSHEET', big:'$25,000', badges:['GRADED','INSURED','LEGIT'],
               scene:'antique silver dollars and gold coins scattered on aged leather, warm candle-like light, macro' },
    cars:    { k:'ANY CONDITION', h1:'WE BUY', h2:'CARS', alt2:'YOUR CAR', items:'Running or not • Same-day pickup • Free tow', sub:'CASH IN HAND BEFORE WE TOW\nNO TITLE? NO PROBLEM • ASK US\nSAME-DAY PICKUP ACROSS LA & OC', cta:'CALL FOR INSTANT OFFER', price:'UP TO $15,000 CASH', big:'$15,000', badges:['FREE TOW','SAME DAY','CASH'],
               scene:'dramatic low-angle of a car silhouette at dusk, city bokeh lights, moody cinematic haze' },
    strips:  { k:'SEALED BOXES ONLY', h1:'CASH FOR', h2:'TEST STRIPS', alt2:'DIABETIC SUPPLIES', items:'Test strips • Lancets • CGM sensors', sub:'UNEXPIRED & SEALED BOXES ONLY\nFAST LOCAL PICKUP OR MAIL-IN\nTOP BOX PRICES • PAID SAME DAY', cta:'TEXT A PHOTO NOW', price:'TOP BOX PRICES PAID', big:'TOP $', badges:['SEALED','FAST','FAIR'],
               scene:'clean pharmacy-style flat lay of sealed medical boxes, soft teal gradient light, gentle blur' },
    pokemon: { k:'SLABS & VINTAGE', h1:'WE BUY', h2:'POKÉMON', alt2:'CARD LOTS', items:'Slabs • Vintage • Sealed • Bulk lots', sub:'PSA / CGC / BGS SLABS WANTED\nVINTAGE WOTC THROUGH MODERN HITS\nSEALED PRODUCT & BULK COLLECTIONS', cta:'DM YOUR BINDER', price:'TOP SLAB PRICES PAID', big:'$10,000', badges:['PSA','CGC','SEALED'],
               scene:'holographic trading card close-up with prismatic light refractions on dark felt, dreamy bokeh' },
    sports:  { k:'VINTAGE & MODERN', h1:'SPORTS', h2:'CARDS', alt2:'CARD LOTS', items:'Rookies • Slabs • Wax • Vintage', sub:'ROOKIES, AUTOS, PATCHES, GRAILS\nGRADED OR RAW • REAL COMP PRICING\nENTIRE COLLECTIONS BOUGHT OUTRIGHT', cta:'TEXT YOUR HITS', price:'TOP DOLLAR FOR SLABS', big:'$5,000', badges:['COMPS','CASH','LEGIT'],
               scene:'vintage baseball cards fanned on worn wood with stadium light bokeh, nostalgic warm grade' },
  };

  // ── shared fragments ──
  const trust = (P, T, badges) => [
    ci('Check Circle', { left:W-318, top:44, radius:44, fill:P.a1, shadow:sh(P.glow, 22) }),
    t('Check', 'deco', 'none', '✓', { left:W-274, top:56, originX:'center', fontFamily:'Satoshi', fontSize:56, fill:P.paper ? '#ffffff' : P.deep, fontWeight:'900' }),
    t('Badges', 'badges', 'upper', badges.join('\n'), { left:W-56, top:40, originX:'right', fontFamily:T.s, fontSize:28, fill:P.ink, fontWeight:'800', lineHeight:1.52, charSpacing:110, opacity:0.95, shadow:P.paper ? null : sh('rgba(0,0,0,0.55)', 9, 0, 2) }),
  ];
  const ribbon = (P, T, text, y) => [
    r('Kicker Ribbon', { left:CX-215, top:y, width:430, height:62, rx:14, angle:-3, grad:{ c1:P.a1, c2:P.a2, a:100 }, shadow:sh('rgba(0,0,0,0.35)', 14, 0, 6) }),
    t('Kicker', 'sub', 'upper', text, { left:CX, top:y+11, originX:'center', fontFamily:T.s, fontStyle:'italic', fontSize:36, fill:P.paper ? '#ffffff' : P.deep, fontWeight:'900', angle:-3 }),
  ];
  const subBlock = (P, T, text, y, size) => tb('Info Text', 'info', 'upper', text, { left:CX, top:y, width:W-140, originX:'center', fontFamily:T.s, fontStyle:'italic', fontSize:size || 40, fill:P.ink, fontWeight:'800', textAlign:'center', lineHeight:1.34, stroke:P.paper ? undefined : '#000000', strokeWidth:P.paper ? 0 : 3, shadow:P.paper ? null : sh('rgba(0,0,0,0.6)', 10, 0, 3) });
  const ctaCard = (P, T, cta) => [
    r('CTA Card', { left:CX-380, top:838, width:760, height:194, rx:28, fill:P.deep, shadow:sh('rgba(0,0,0,0.45)', 30, 0, 12) }),
    t('CTA', 'cta', 'upper', cta, { left:CX, top:862, originX:'center', fontFamily:T.d, fontSize:54, grad:{ c1:P.a1, c2:P.a2, a:95 }, shadow:sh(P.glow, 20) }),
    t('Phone Number', 'phone', 'none', '(562) 999-4994', { left:CX, top:934, originX:'center', fontFamily:'Satoshi', fontSize:58, fill:'#ffffff', fontWeight:'900', stroke:'#000000', strokeWidth:2 }),
    t('Website', 'website', 'none', 'iphones.LA', { left:CX, top:1002, originX:'center', fontFamily:'Satoshi', fontSize:21, fill:'rgba(255,255,255,0.45)' }),
  ];
  const phoneBar = (P, T, y) => [
    r('Phone Plate', { left:CX-330, top:y, width:660, height:118, rx:24, grad:{ c1:P.a1, c2:P.a2, a:95 }, shadow:sh(P.glow, 26) }),
    t('Phone Number', 'phone', 'none', '(562) 999-4994', { left:CX, top:y+22, originX:'center', fontFamily:'Satoshi', fontSize:64, fill:P.paper ? '#ffffff' : P.deep, fontWeight:'900' }),
  ];

  // ── local social-proof copy per category (all layers stay editable) ──
  const TRUST_COPY = {
    phones:  { q:'"Texted photos at noon, had cash by 3pm. Easiest sale ever."',        w:'MARCUS D. • LONG BEACH' },
    gold:    { q:'"Fair price for my grandmother\'s rings, paid on the spot."',         w:'ELENA R. • LAKEWOOD' },
    silver:  { q:'"Weighed everything right in front of me. Honest start to finish."',  w:'PAUL S. • SIGNAL HILL' },
    coins:   { q:'"Knew more about my collection than I did. Strong offer."',           w:'HOWARD B. • CERRITOS' },
    cars:    { q:'"Picked up my old Civic the same day, cash in hand."',                w:'DENISE W. • CARSON' },
    strips:  { q:'"Simple and discreet. Boxes gone, paid fairly."',                     w:'T.J. • NORWALK' },
    pokemon: { q:'"Got real value for my binder, not pawn shop prices."',               w:'ALEX M. • DOWNEY' },
    sports:  { q:'"My rookie cards finally found a fair, serious buyer."',              w:'RAY G. • TORRANCE' },
  };

  /* Ink that actually reads ON the accent. Chip glyphs were hard-coded to
     P.deep, which is right on a bright accent (lime, amber) and wrong on a
     dark one (crimson's #d53447 against #120709 is 1.9:1). Pick whichever of
     near-black / near-white wins against this palette's accent. Pure maths,
     no render needed, so it costs nothing at build time. */
  const onAccent = (P) => {
    const hex = String(P.a1 || '#ffffff').replace('#','');
    const n = parseInt(hex, 16);
    const ch = [(n>>16)&255, (n>>8)&255, n&255].map(v => {
      v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
    });
    const L = 0.2126*ch[0] + 0.7152*ch[1] + 0.0722*ch[2];
    const vsWhite = 1.05 / (L + 0.05);
    const vsDeep  = (L + 0.05) / 0.05;
    return vsWhite > vsDeep ? '#ffffff' : (P.deep || '#0b0b0d');
  };

  const cut = (name, src, props) => ({ kind:'cutout', name, role:'photo', props:Object.assign({ src:'assets/cutouts/' + src + '.png' }, props) });
  // Hard offset shadow: the STREET family wants the sticker look the clean
  // family forbids. See DESIGN-LAW.md rule 13 for why both are correct.
  const hard = (c, d) => sh(c || 'rgba(0,0,0,0.55)', 0, d || 8, d || 8);

  // ── the 16 layout architectures ──
  const LAYOUTS = {
    /* ══ STREET FAMILY ═══════════════════════════════════════════════════════
       Built from the user's own "good design" folder, and deliberately
       breaking three rules the CLEAN family enforces: outlined type, hard
       offset shadows, and pale grounds under saturated colour. Their own A/B
       proves it — same layout, same copy, and the versions they marked good
       are the ones with a QUIET PALE BACKDROP and the money word in ONE
       saturated hue behind a heavy white outline. The ones they marked mid are
       the busy or saturated grounds, and the rainbow-gradient words.
       These layouts are tagged 'street' and skipped by houseType(). */

    // The proven one: their MATTHEW 3.0 / 3.2 / 3.7 structure.
    streetCashFor: (P, T, C) => {
      const marquee = (C.kicker || 'CASH FOR ' + C.h2) + '  TEXT ' + '(562) 999-4994' + '   ';
      const ink = '#ffffff', edge = P.deep;
      return [
        t('Marquee Top', 'deco', 'upper', marquee.repeat(3), { left:CX, top:12, originX:'center', fontFamily:'Khand', fontSize:28, fill:'rgba(255,255,255,0.5)', charSpacing:20 }),
        t('Headline 1', 'headline', 'upper', C.h1 || 'CASH FOR', { left:CX, top:62, originX:'center', fontFamily:T.d, fontSize:123, fill:ink, fontWeight:'700', stroke:edge, strokeWidth:9, shadow:hard('rgba(0,0,0,0.45)', 7) }),
        t('Headline 2', 'headline', 'upper', C.h2, { left:CX, top:168, originX:'center', fontFamily:T.d, fontSize:233, fill:P.a1, fontWeight:'700', stroke:ink, strokeWidth:15, shadow:hard('rgba(0,0,0,0.5)', 12) }),
        rg('Claim Plate', { left:96, top:512, width:888, height:118, rx:16, fill:hexToRgba(P.deep,0.82), shadow:hard('rgba(0,0,0,0.28)', 6) }),
        t('Claim 1', 'info', 'upper', C.badges ? C.badges.join(' • ') : 'ANY CONDITION ANY CARRIER', { left:CX, top:534, originX:'center', fontFamily:'Khand', fontSize:41, fill:P.a2, fontWeight:'700', charSpacing:30 }),
        t('Claim 2', 'info', 'upper', C.sub || 'TOP DOLLAR PAID TODAY', { left:CX, top:578, originX:'center', fontFamily:'Khand', fontSize:41, fill:'#ffffff', fontWeight:'700', charSpacing:30 }),
        t('Area 1', 'info', 'upper', C.a1 || 'IE', { left:CX-268, top:672, originX:'center', fontFamily:T.d, fontSize:98, fill:'#2fbf4f', fontWeight:'700', stroke:ink, strokeWidth:7 }),
        t('Arrow 1', 'deco', 'none', '↓', { left:CX-134, top:686, originX:'center', fontFamily:'Satoshi', fontSize:78, fill:'#e8362c', fontWeight:'900' }),
        t('Area 2', 'info', 'upper', C.a2 || 'OC', { left:CX, top:672, originX:'center', fontFamily:T.d, fontSize:98, fill:'#2fbf4f', fontWeight:'700', stroke:ink, strokeWidth:7 }),
        t('Arrow 2', 'deco', 'none', '↓', { left:CX+134, top:686, originX:'center', fontFamily:'Satoshi', fontSize:78, fill:'#e8362c', fontWeight:'900' }),
        t('Area 3', 'info', 'upper', C.a3 || 'LA', { left:CX+268, top:672, originX:'center', fontFamily:T.d, fontSize:98, fill:'#2fbf4f', fontWeight:'700', stroke:ink, strokeWidth:7 }),
        t('Phone Number', 'phone', 'none', '(562) 999-4994', { left:CX, top:806, originX:'center', fontFamily:T.d, fontSize:150, fill:ink, fontWeight:'700', stroke:edge, strokeWidth:10, shadow:hard('rgba(0,0,0,0.45)', 8) }),
        t('Marquee Base', 'deco', 'upper', marquee.repeat(3), { left:CX, top:1042, originX:'center', fontFamily:'Khand', fontSize:28, fill:'rgba(255,255,255,0.5)', charSpacing:20 }),
      ];
    },

    // Cut-out product as the subject, trust rows down the side.
    streetCutoutHero: (P, T, C) => {
      const ink = '#ffffff';
      const row = (i, y, label, subq) => ([
        ci('Row Dot ' + i, { left:74, top:y, radius:26, fill:P.a1, shadow:hard('rgba(0,0,0,0.35)', 5) }),
        t('Row Mark ' + i, 'deco', 'none', '✓', { left:100, top:y+8, originX:'center', fontFamily:'Satoshi', fontSize:36, fill:onAccent(P), fontWeight:'900' }),
        t('Row Label ' + i, 'info', 'upper', label, { left:146, top:y-2, fontFamily:T.d, fontSize:47, fill:ink, fontWeight:'600', stroke:P.deep, strokeWidth:4 }),
        t('Row Sub ' + i, 'info', 'none', subq, { left:146, top:y+42, fontFamily:'Satoshi', fontSize:27, fill:'rgba(255,255,255,0.82)', fontWeight:'500' }),
      ]);
      return [
        t('Headline 1', 'headline', 'upper', C.h1 || 'WE BUY', { left:54, top:78, fontFamily:T.d, fontSize:109, fill:ink, fontWeight:'700', stroke:P.deep, strokeWidth:8, shadow:hard('rgba(0,0,0,0.45)', 7) }),
        t('Headline 2', 'headline', 'upper', C.h2, { left:54, top:172, fontFamily:T.d, fontSize:187, fill:P.a1, fontWeight:'700', stroke:ink, strokeWidth:13, shadow:hard('rgba(0,0,0,0.5)', 10) }),
        cut('Product', C.cut || 'cash-stack', { left:1032, top:398, originX:'right', w:505, shadow:sh('rgba(0,0,0,0.5)', 40, 0, 22) }),
        ...row(1, 452, (C.badges && C.badges[0]) || 'TOP DOLLAR',   (C.subs && C.subs[0]) || 'Paid in cash, same day'),
        ...row(2, 572, (C.badges && C.badges[1]) || 'FAST & EASY',  (C.subs && C.subs[1]) || 'Text photos, get an offer'),
        ...row(3, 692, (C.badges && C.badges[2]) || 'ANY CONDITION',(C.subs && C.subs[2]) || 'No appointment needed'),
        rg('Phone Plate', { left:54, top:836, width:940, height:132, rx:22, fill:P.a1, shadow:hard('rgba(0,0,0,0.4)', 9) }),
        t('CTA', 'cta', 'upper', C.cta || 'CALL OR TEXT', { left:CX, top:856, originX:'center', fontFamily:'Khand', fontSize:36, fill:onAccent(P), fontWeight:'700', charSpacing:60 }),
        t('Phone Number', 'phone', 'none', '(562) 999-4994', { left:CX, top:892, originX:'center', fontFamily:T.d, fontSize:82, fill:onAccent(P), fontWeight:'700' }),
      ];
    },

    // The "BROKEN iPHONES / ANY MODEL ANY CONDITION" checklist structure.
    streetSpecCheck: (P, T, C) => {
      const ink = '#ffffff';
      const chk = (i, y, label) => ([
        rg('Chk Chip ' + i, { left:54, top:y, width:56, height:56, rx:14, fill:P.a1 }),
        t('Chk Mark ' + i, 'deco', 'none', '✓', { left:98, top:y+9, originX:'center', fontFamily:'Satoshi', fontSize:36, fill:onAccent(P), fontWeight:'900' }),
        t('Chk Label ' + i, 'info', 'upper', label, { left:146, top:y+6, fontFamily:'Khand', fontSize:49, fill:ink, fontWeight:'700', stroke:P.deep, strokeWidth:4, charSpacing:14 }),
      ]);
      const pts = C.points || ['CRACKED SCREEN', "WON'T TURN ON", 'WATER DAMAGE', 'ANY OTHER ISSUE'];
      return [
        t('Headline 1', 'headline', 'upper', C.h1 || 'BUYING', { left:54, top:70, fontFamily:T.d, fontSize:100, fill:ink, fontWeight:'700', stroke:P.deep, strokeWidth:8, shadow:hard('rgba(0,0,0,0.45)', 7) }),
        t('Headline 2', 'headline', 'upper', C.h2, { left:54, top:154, fontFamily:T.d, fontSize:173, fill:P.a1, fontWeight:'700', stroke:ink, strokeWidth:13, shadow:hard('rgba(0,0,0,0.5)', 10) }),
        cut('Product', C.cut || 'iphone-cracked', { left:1030, top:352, originX:'right', w:573, angle:6, shadow:sh('rgba(0,0,0,0.5)', 36, 0, 20) }),
        ...chk(1, 372, pts[0]), ...chk(2, 462, pts[1]), ...chk(3, 552, pts[2]), ...chk(4, 642, pts[3] || 'ANY OTHER ISSUE'),
        rg('CTA Bar', { left:0, top:846, width:W, height:150, fill:P.deep }),
        t('CTA', 'cta', 'upper', C.cta || 'TEXT A PHOTO FOR AN OFFER', { left:CX, top:872, originX:'center', fontFamily:'Khand', fontSize:38, fill:'rgba(255,255,255,0.88)', fontWeight:'700', charSpacing:44 }),
        t('Phone Number', 'phone', 'none', '(562) 999-4994', { left:CX, top:906, originX:'center', fontFamily:T.d, fontSize:93, fill:ink, fontWeight:'700' }),
      ];
    },

    /* ── six more STREET architectures ───────────────────────────────────
       The first four were really only two configurations wearing four names:
       a centred stack, and left-rows-with-a-right-cutout. These six are drawn
       from reference structures that are genuinely different — a bottom icon
       grid, a slanted ribbon, a two-column checklist, a top badge strip, a
       price-and-roundels poster, and a split column. Slants are deliberate
       and small (3-6 degrees): the references tilt the ribbon and the money
       word, never the body copy, because tilted reading text is a gimmick. */

    // #15 / #27: the categories you buy, as an icon grid across the bottom.
    streetIconGrid: (P, T, C) => {
      const ink='#ffffff', cellW=228, gapx=18, y0=676;
      const cell = (i, label, glyph) => {
        const x = 70 + i*(cellW+gapx);
        return [
          rg('Cell '+(i+1), { left:x, top:y0, width:cellW, height:158, rx:18, fill:hexToRgba(P.deep,0.82), shadow:hard('rgba(0,0,0,0.26)', 6) }),
          t('Cell Icon '+(i+1), 'deco', 'none', glyph, { left:x+cellW/2, top:y0+22, originX:'center', fontFamily:'Satoshi', fontSize:58, fill:P.a1 }),
          t('Cell Label '+(i+1), 'info', 'upper', label, { left:x+cellW/2, top:y0+100, originX:'center', fontFamily:'Khand', fontSize:30, fill:'#ffffff', fontWeight:'700', charSpacing:20 }),
        ];
      };
      const g = C.grid || ['PHONES','TABLETS','LAPTOPS','WATCHES'];
      const ic = C.gridIcons || ['▢','▣','▤','◷'];
      return [
        t('Headline 1', 'headline', 'upper', C.h1 || 'WE BUY', { left:54, top:74, fontFamily:T.d, fontSize:95, fill:ink, fontWeight:'700', stroke:P.deep, strokeWidth:8, shadow:hard('rgba(0,0,0,0.45)', 7) }),
        t('Headline 2', 'headline', 'upper', C.h2, { left:54, top:156, fontFamily:T.d, fontSize:167, fill:P.a1, fontWeight:'700', stroke:ink, strokeWidth:13, shadow:hard('rgba(0,0,0,0.5)', 10) }),
        t('Sub', 'sub', 'upper', C.sub || 'FAST • FAIR • CASH ON THE SPOT', { left:54, top:322, fontFamily:'Khand', fontSize:38, fill:ink, fontWeight:'700', charSpacing:26, stroke:P.deep, strokeWidth:3 }),
        cut('Product', C.cut || 'cash-stack', { left:1030, top:352, originX:'right', w:573, shadow:sh('rgba(0,0,0,0.5)', 38, 0, 20) }),
        ...cell(0, g[0], ic[0]), ...cell(1, g[1], ic[1]), ...cell(2, g[2], ic[2]), ...cell(3, g[3], ic[3]),
        rg('Phone Plate', { left:54, top:876, width:940, height:118, rx:20, fill:P.a1, shadow:hard('rgba(0,0,0,0.4)', 8) }),
        t('Phone Number', 'phone', 'none', '(562) 999-4994', { left:CX, top:898, originX:'center', fontFamily:T.d, fontSize:87, fill:onAccent(P), fontWeight:'700' }),
      ];
    },

    // #16 / #17 / #23: slanted ribbon, tilted money word, pills.
    streetRibbon: (P, T, C) => {
      const ink='#ffffff', tilt=-5;
      const pill = (i, x, w, txt) => ([
        rg('Pill '+(i+1), { left:x, top:846, width:w, height:68, rx:34, fill:hexToRgba(P.deep,0.82), angle:-2 }),
        t('Pill Text '+(i+1), 'badges', 'upper', txt, { left:x+w/2, top:864, originX:'center', fontFamily:'Khand', fontSize:30, fill:'#ffffff', fontWeight:'700', charSpacing:18, angle:-2 }),
      ]);
      const b = C.badges || ['FAST','FAIR','SAME DAY'];
      return [
        rg('Ribbon', { left:-40, top:120, width:1160, height:132, fill:P.a1, angle:tilt, shadow:hard('rgba(0,0,0,0.35)', 9) }),
        t('Headline 1', 'headline', 'upper', C.h1 || 'WE BUY', { left:CX, top:150, originX:'center', fontFamily:T.d, fontSize:100, fill:onAccent(P), fontWeight:'700', angle:tilt }),
        t('Headline 2', 'headline', 'upper', C.h2, { left:CX, top:308, originX:'center', fontFamily:T.d, fontSize:204, fill:ink, fontWeight:'700', stroke:P.deep, strokeWidth:14, shadow:hard('rgba(0,0,0,0.5)', 12), angle:-3 }),
        t('Sub', 'sub', 'upper', C.sub || 'TOP DOLLAR PAID TODAY', { left:CX, top:520, originX:'center', fontFamily:'Khand', fontSize:41, fill:ink, fontWeight:'700', charSpacing:30, stroke:P.deep, strokeWidth:3, angle:-2 }),
        cut('Product', C.cut || 'cash-fan', { left:CX, top:534, originX:'center', w:353, angle:4, shadow:sh('rgba(0,0,0,0.5)', 40, 0, 22) }),
        ...pill(0, 70, 280, b[0]), ...pill(1, 372, 300, b[1]), ...pill(2, 694, 316, b[2] || 'CASH NOW'),
        t('Phone Number', 'phone', 'none', '(562) 999-4994', { left:CX, top:944, originX:'center', fontFamily:T.d, fontSize:104, fill:ink, fontWeight:'700', stroke:P.deep, strokeWidth:9, shadow:hard('rgba(0,0,0,0.45)', 8) }),
      ];
    },

    // #17: "what I'm looking for" as a two-column checklist grid.
    streetTwoCol: (P, T, C) => {
      const ink='#ffffff';
      const item = (i, txt) => {
        const col = i % 2, row = (i - col) / 2;
        const x = 70 + col*472, y = 606 + row*88;
        return [
          rg('Item Chip '+(i+1), { left:x, top:y, width:44, height:44, rx:12, fill:P.a1 }),
          t('Item Tick '+(i+1), 'deco', 'none', '✓', { left:x+22, top:y+6, originX:'center', fontFamily:'Satoshi', fontSize:30, fill:onAccent(P), fontWeight:'900' }),
          t('Item Label '+(i+1), 'info', 'upper', txt, { left:x+60, top:y+6, fontFamily:'Khand', fontSize:36, fill:ink, fontWeight:'700', stroke:P.deep, strokeWidth:3, charSpacing:10 }),
        ];
      };
      const pts = C.points || ['SEALED','GRADED','VINTAGE','BULK LOTS','SINGLES','COLLECTIONS'];
      return [
        t('Kicker', 'sub', 'upper', C.kicker || 'PAYING UP TO', { left:CX, top:74, originX:'center', fontFamily:'Khand', fontSize:47, fill:ink, fontWeight:'700', charSpacing:50, stroke:P.deep, strokeWidth:3 }),
        t('Price Line', 'headline', 'upper', C.price || '90%', { left:CX, top:116, originX:'center', fontFamily:T.d, fontSize:196, fill:P.a1, fontWeight:'700', stroke:ink, strokeWidth:15, shadow:hard('rgba(0,0,0,0.5)', 12) }),
        t('Headline 2', 'headline', 'upper', C.h2, { left:CX, top:334, originX:'center', fontFamily:T.d, fontSize:100, fill:ink, fontWeight:'700', stroke:P.deep, strokeWidth:8, shadow:hard('rgba(0,0,0,0.45)', 7) }),
        cut('Product', C.cut || 'cash-bundles', { left:1040, top:392, originX:'right', w:256, angle:5, shadow:sh('rgba(0,0,0,0.5)', 34, 0, 18) }),  // sits in the clear band between the price and the grid; a long price like $15,000 reaches x960 up top
        t('Grid Title', 'sub', 'upper', C.gridTitle || "WHAT WE'RE BUYING", { left:54, top:552, fontFamily:'Khand', fontSize:34, fill:P.a1, fontWeight:'700', charSpacing:26, stroke:P.deep, strokeWidth:3 }),
        ...item(0,pts[0]), ...item(1,pts[1]), ...item(2,pts[2]), ...item(3,pts[3]), ...item(4,pts[4]||'SINGLES'), ...item(5,pts[5]||'COLLECTIONS'),
        rg('Phone Plate', { left:54, top:892, width:940, height:112, rx:20, fill:P.a1 }),
        t('Phone Number', 'phone', 'none', '(562) 999-4994', { left:CX, top:912, originX:'center', fontFamily:T.d, fontSize:82, fill:onAccent(P), fontWeight:'700' }),
      ];
    },

    // #14: badge strip on top, hero in the middle, banner across the bottom.
    streetTopStrip: (P, T, C) => {
      const ink='#ffffff';
      const b = C.badges || ['ANY CONDITION','ANY MODEL','SAME DAY'];
      return [
        rg('Top Strip', { left:0, top:0, width:W, height:96, fill:P.deep }),
        t('Strip 1', 'badges', 'upper', b[0], { left:180, top:30, originX:'center', fontFamily:'Khand', fontSize:34, fill:hexToRgba(P.ink || "#ffffff", 0.92), fontWeight:'700', charSpacing:18 }),
        t('Strip 2', 'badges', 'upper', b[1], { left:CX, top:30, originX:'center', fontFamily:'Khand', fontSize:34, fill:ink, fontWeight:'700', charSpacing:18 }),
        t('Strip 3', 'badges', 'upper', b[2] || 'SAME DAY', { left:900, top:30, originX:'center', fontFamily:'Khand', fontSize:34, fill:hexToRgba(P.ink || "#ffffff", 0.92), fontWeight:'700', charSpacing:18 }),
        t('Headline 1', 'headline', 'upper', C.h1 || 'WE BUY', { left:CX, top:146, originX:'center', fontFamily:T.d, fontSize:98, fill:ink, fontWeight:'700', stroke:P.deep, strokeWidth:8, shadow:hard('rgba(0,0,0,0.45)', 7) }),
        t('Headline 2', 'headline', 'upper', C.h2, { left:CX, top:236, originX:'center', fontFamily:T.d, fontSize:198, fill:P.a1, fontWeight:'700', stroke:ink, strokeWidth:14, shadow:hard('rgba(0,0,0,0.5)', 11) }),
        cut('Product', C.cut || 'iphones-trio', { left:CX, top:446, originX:'center', w:453, shadow:sh('rgba(0,0,0,0.5)', 42, 0, 24) }),
        rg('Banner', { left:0, top:846, width:W, height:150, fill:P.a1, shadow:hard('rgba(0,0,0,0.35)', 8) }),
        t('CTA', 'cta', 'upper', C.cta || 'CALL OR TEXT TODAY', { left:CX, top:868, originX:'center', fontFamily:'Khand', fontSize:36, fill:onAccent(P), fontWeight:'700', charSpacing:46 }),
        t('Phone Number', 'phone', 'none', '(562) 999-4994', { left:CX, top:904, originX:'center', fontFamily:T.d, fontSize:93, fill:onAccent(P), fontWeight:'700' }),
      ];
    },

    // #20: brand top-left, huge price, roundel trust marks, tilted badge.
    streetPriceBadge: (P, T, C) => {
      const ink='#ffffff';
      const roundel = (i, x, label) => ([
        ci('Roundel '+(i+1), { left:x, top:742, radius:52, fill:hexToRgba(P.deep,0.82), shadow:hard('rgba(0,0,0,0.28)', 6) }),
        t('Roundel Icon '+(i+1), 'deco', 'none', '✦', { left:x+52, top:766, originX:'center', fontFamily:'Satoshi', fontSize:41, fill:P.a1 }),
        t('Roundel Label '+(i+1), 'info', 'upper', label, { left:x+52, top:858, originX:'center', fontFamily:'Khand', fontSize:25, fill:ink, fontWeight:'700', charSpacing:12, stroke:P.deep, strokeWidth:3 }),
      ]);
      const b = C.badges || ['SAME DAY','FAIR PRICE','NO HAGGLE'];
      return [
        t('Kicker', 'sub', 'upper', C.brand || 'LOCAL BUYER', { left:54, top:70, fontFamily:'Khand', fontSize:38, fill:ink, fontWeight:'700', charSpacing:44, stroke:P.deep, strokeWidth:3 }),
        t('Headline 1', 'headline', 'upper', C.h1 || 'WE BUY', { left:54, top:124, fontFamily:T.d, fontSize:87, fill:ink, fontWeight:'700', stroke:P.deep, strokeWidth:7, shadow:hard('rgba(0,0,0,0.45)', 6) }),
        t('Headline 2', 'headline', 'upper', C.h2, { left:54, top:206, fontFamily:T.d, fontSize:141, fill:ink, fontWeight:'700', stroke:P.deep, strokeWidth:10, shadow:hard('rgba(0,0,0,0.45)', 8) }),
        t('Price Line', 'headline', 'upper', C.price || '$1,100', { left:54, top:392, fontFamily:T.d, fontSize:165, fill:P.a1, fontWeight:'700', stroke:ink, strokeWidth:16, shadow:hard('rgba(0,0,0,0.5)', 13), angle:-4 }),
        cut('Product', C.cut || 'iphone-front', { left:1048, top:132, originX:'right', w:366, angle:5, shadow:sh('rgba(0,0,0,0.5)', 38, 0, 20) }),
        ...roundel(0, 70, b[0]), ...roundel(1, 232, b[1]), ...roundel(2, 394, b[2] || 'NO HAGGLE'),
        rg('Badge', { left:620, top:762, width:390, height:104, rx:22, fill:P.a1, angle:-4, shadow:hard('rgba(0,0,0,0.35)', 8) }),
        t('CTA', 'cta', 'upper', C.cta || 'CALL OR TEXT', { left:815, top:790, originX:'center', fontFamily:'Khand', fontSize:44, fill:onAccent(P), fontWeight:'700', charSpacing:22, angle:-4 }),
        t('Phone Number', 'phone', 'none', '(562) 999-4994', { left:CX, top:936, originX:'center', fontFamily:T.d, fontSize:100, fill:ink, fontWeight:'700', stroke:P.deep, strokeWidth:8, shadow:hard('rgba(0,0,0,0.45)', 7) }),
      ];
    },

    // #24: hard vertical split — product one side, checklist the other.
    streetSplitCol: (P, T, C) => {
      const ink='#ffffff', midX=520;
      const row = (i, txt) => {
        const y = 330 + i*92;
        return [
          rg('Row Chip '+(i+1), { left:midX+34, top:y, width:42, height:42, rx:11, fill:P.a1 }),
          t('Row Tick '+(i+1), 'deco', 'none', '✓', { left:midX+55, top:y+5, originX:'center', fontFamily:'Satoshi', fontSize:29, fill:onAccent(P), fontWeight:'900' }),
          t('Row Label '+(i+1), 'info', 'upper', txt, { left:midX+92, top:y+4, fontFamily:'Khand', fontSize:36, fill:ink, fontWeight:'700', charSpacing:10, stroke:P.deep, strokeWidth:3 }),
        ];
      };
      const pts = C.points || ['ANY CONDITION','ANY MODEL','PAID IN CASH','SAME DAY'];
      return [
        rg('Split Panel', { left:midX, top:0, width:W-midX, height:W, fill:'rgba(10,12,18,0.55)' }),
        rg('Split Rule', { left:midX-3, top:0, width:6, height:W, fill:P.a1 }),
        t('Headline 1', 'headline', 'upper', C.h1 || 'WE BUY', { left:54, top:86, fontFamily:T.d, fontSize:69, fill:ink, fontWeight:'700', stroke:P.deep, strokeWidth:6, shadow:hard('rgba(0,0,0,0.45)', 6) }),
        t('Headline 2', 'headline', 'upper', C.h2, { left:54, top:152, fontFamily:T.d, fontSize:104, fill:P.a1, fontWeight:'700', stroke:ink, strokeWidth:11, shadow:hard('rgba(0,0,0,0.5)', 9) }),
        cut('Product', C.cut || 'iphones-trio', { left:54, top:352, w:488, shadow:sh('rgba(0,0,0,0.5)', 36, 0, 20) }),
        t('Panel Title', 'sub', 'upper', C.gridTitle || 'WE TAKE', { left:midX+34, top:250, fontFamily:'Khand', fontSize:38, fill:P.a1, fontWeight:'700', charSpacing:32 }),
        ...row(0,pts[0]), ...row(1,pts[1]), ...row(2,pts[2]), ...row(3,pts[3]||'SAME DAY'),
        rg('Phone Plate', { left:midX+34, top:760, width:456, height:106, rx:18, fill:P.a1 }),
        t('CTA', 'cta', 'upper', C.cta || 'TEXT FOR AN OFFER', { left:midX+262, top:778, originX:'center', fontFamily:'Khand', fontSize:28, fill:onAccent(P), fontWeight:'700', charSpacing:22 }),
        t('Phone Number', 'phone', 'none', '(562) 999-4994', { left:midX+262, top:808, originX:'center', fontFamily:T.d, fontSize:50, fill:onAccent(P), fontWeight:'700' }),
      ];
    },

    // Price / percentage led, the "PAYING 85-90%" and "$79" references.
    streetPriceTag: (P, T, C) => {
      const ink = '#ffffff';
      return [
        t('Kicker', 'sub', 'upper', C.kicker || 'PAYING UP TO', { left:CX, top:96, originX:'center', fontFamily:'Khand', fontSize:51, fill:ink, fontWeight:'700', charSpacing:52, stroke:P.deep, strokeWidth:4 }),
        t('Price Line', 'headline', 'upper', C.price || '$1,100', { left:CX, top:150, originX:'center', fontFamily:T.d, fontSize:259, fill:P.a1, fontWeight:'700', stroke:ink, strokeWidth:16, shadow:hard('rgba(0,0,0,0.5)', 13) }),
        t('Headline 2', 'headline', 'upper', C.h2, { left:CX, top:396, originX:'center', fontFamily:T.d, fontSize:109, fill:ink, fontWeight:'700', stroke:P.deep, strokeWidth:8, shadow:hard('rgba(0,0,0,0.45)', 7) }),
        cut('Product', C.cut || 'cash-bundles', { left:CX, top:474, originX:'center', w:409, shadow:sh('rgba(0,0,0,0.5)', 42, 0, 24) }),
        rg('Claim Plate', { left:96, top:836, width:888, height:96, rx:16, fill:hexToRgba(P.deep,0.82) }),
        t('Claim 1', 'info', 'upper', C.badges ? C.badges.join('  •  ') : 'SAME DAY • CASH IN HAND • NO HAGGLING', { left:CX, top:862, originX:'center', fontFamily:'Khand', fontSize:41, fill:'#ffffff', fontWeight:'700', charSpacing:22 }),
        t('Phone Number', 'phone', 'none', '(562) 999-4994', { left:CX, top:908, originX:'center', fontFamily:T.d, fontSize:96, fill:ink, fontWeight:'700', stroke:P.deep, strokeWidth:8, shadow:hard('rgba(0,0,0,0.45)', 7) }),
      ];
    },

    // ── liquid glass helpers: frosted panel + top sheen, works on any backdrop ──
    // (backdrops are gently defocused, so translucency reads as real glass)
    reviewProof: (P, T, C) => {
      const gf = P.paper ? 'rgba(16,17,22,0.58)' : 'rgba(13,16,24,0.52)';  // DARK-tinted glass, not white: see DESIGN-LAW.md rule 10
      const gs = 'rgba(255,255,255,0.35)';
      const panel = (name, x, y, w, h, rx) => [
        rg(name, { left:x, top:y, width:w, height:h, rx:rx, fill:gf, stroke:gs, strokeWidth:1.5, shadow:sh('rgba(0,0,0,0.35)', 26, 0, 12) }),
        rg(name + ' Sheen', { left:x+rx*0.8, top:y+7, width:w-rx*1.6, height:9, rx:4.5, fill:'rgba(255,255,255,0.16)' }),
      ];
      const chip = (i, x, w, txt) => [
        rg('Chip ' + i, { left:x, top:770, width:w, height:74, rx:37, fill:gf, stroke:gs, strokeWidth:1.2 }),
        t('Chip Text ' + i, 'badges', 'upper', txt, { left:x+w/2, top:792, originX:'center', fontFamily:'Satoshi', fontSize:27, fill:'#ffffff', fontWeight:'800', charSpacing:40 }),
      ];
      return [
        ...panel('Rate Pill', CX-330, 82, 660, 92, 46),
        t('Stars', 'deco', 'none', '★★★★★', { left:CX-286, top:104, fontFamily:'Satoshi', fontSize:42, fill:P.a1, charSpacing:60 }),
        t('Rating Line', 'info', 'none', '4.9 · 200+ local sellers', { left:CX+52, top:110, fontFamily:'Satoshi', fontSize:33, fill:'#ffffff', fontWeight:'800' }),
        ...panel('Quote Card', 70, 228, W-140, 336, 34),
        tb('Quote', 'info', 'none', C.quote, { left:CX, top:278, width:W-250, originX:'center', fontFamily:'Satoshi', fontSize:46, fill:'#ffffff', fontWeight:'700', textAlign:'center', lineHeight:1.32 }),
        t('Who', 'info', 'none', C.who, { left:CX, top:492, originX:'center', fontFamily:'Satoshi', fontSize:25, fill:'rgba(255,255,255,0.72)', charSpacing:90 }),
        t('Headline 2', 'headline', 'upper', C.h2, { left:CX, top:606, originX:'center', fontFamily:'Clash Display', fontSize:128, grad:{ c1:P.a1, c2:P.a2, a:100 }, shadow:sh(P.glow, 24) }),
        ...chip(1, 84, 280, '✓ ' + (C.badges[0] || 'FAST')),
        ...chip(2, 384, 312, '✓ ' + (C.badges[1] || 'SAFE')),
        ...chip(3, 716, 280, '✓ ' + (C.badges[2] || 'EASY')),
        ...panel('CTA Bar', 86, 876, W-172, 146, 34),
        t('CTA', 'cta', 'upper', C.cta, { left:132, top:928, fontFamily:'Satoshi', fontSize:34, fill:'#ffffff', fontWeight:'800', charSpacing:30 }),
        r('Phone Pill', { left:CX+58, top:898, width:360, height:102, rx:51, grad:{ c1:P.a1, c2:P.a2, a:95 }, shadow:sh(P.glow, 22) }),
        t('Phone Number', 'phone', 'none', '(562) 999-4994', { left:CX+238, top:928, originX:'center', fontFamily:'Satoshi', fontSize:41, fill:P.deep, fontWeight:'900' }),
      ];
    },
    trustSeal: (P, T, C) => {
      const gf = P.paper ? 'rgba(16,17,22,0.58)' : 'rgba(13,16,24,0.52)';  // DARK-tinted glass, not white: see DESIGN-LAW.md rule 10
      const gs = 'rgba(255,255,255,0.35)';
      const panel = (name, x, y, w, h, rx) => [
        rg(name, { left:x, top:y, width:w, height:h, rx:rx, fill:gf, stroke:gs, strokeWidth:1.5, shadow:sh('rgba(0,0,0,0.35)', 26, 0, 12) }),
        rg(name + ' Sheen', { left:x+rx*0.8, top:y+7, width:w-rx*1.6, height:9, rx:4.5, fill:'rgba(255,255,255,0.16)' }),
      ];
      const tile = (i, x, y, big, small) => [
        ...panel('Tile ' + i, x, y, 442, 148, 30),
        t('Tile Big ' + i, 'info', 'none', big, { left:x+34, top:y+28, fontFamily:'Satoshi', fontSize:52, fill:'#ffffff', fontWeight:'900' }),
        t('Tile Small ' + i, 'info', 'upper', small, { left:x+34, top:y+96, fontFamily:'Satoshi', fontSize:23, fill:'rgba(255,255,255,0.68)', charSpacing:70, fontWeight:'700' }),
      ];
      return [
        ...panel('Status Pill', CX-292, 78, 584, 78, 39),
        ci('Status Dot', { left:CX-252, top:104, radius:13, fill:'#22c55e', shadow:sh('rgba(34,197,94,0.8)', 14) }),
        t('Status Text', 'info', 'upper', 'LICENSED & INSURED LOCAL BUYER', { left:CX+16, top:100, originX:'center', fontFamily:'Satoshi', fontSize:27, fill:'#ffffff', fontWeight:'800', charSpacing:60 }),
        t('Headline 1', 'headline', 'upper', 'TRUSTED LOCAL', { left:CX, top:206, originX:'center', fontFamily:'Satoshi', fontSize:52, fill:'rgba(255,255,255,0.85)', fontWeight:'900', charSpacing:180 }),
        t('Headline 2', 'headline', 'upper', C.h2, { left:CX, top:262, originX:'center', fontFamily:'Clash Display', fontSize:158, grad:{ c1:P.a1, c2:P.a2, a:100 }, shadow:sh(P.glow, 26) }),
        t('Headline 3', 'headline', 'upper', 'BUYER', { left:CX, top:424, originX:'center', fontFamily:'Satoshi', fontSize:44, fill:'rgba(255,255,255,0.85)', fontWeight:'900', charSpacing:300 }),
        ...tile(1, 84, 512, C.big || 'TOP $$$', 'PAID TODAY'),
        ...tile(2, 554, 512, '4.9★', '200+ LOCAL REVIEWS'),
        ...tile(3, 84, 682, 'SINCE 2015', '500+ DEALS CLOSED'),
        ...tile(4, 554, 682, 'SAME DAY', 'CASH OR TRANSFER'),
        t('Items', 'info', 'upper', C.items, { left:CX, top:860, originX:'center', fontFamily:'Satoshi', fontSize:26, fill:'rgba(255,255,255,0.7)', charSpacing:50 }),
        ...phoneBar(P, T, 912),
      ];
    },
    stepsFlow: (P, T, C) => {
      const gf = P.paper ? 'rgba(16,17,22,0.58)' : 'rgba(13,16,24,0.52)';  // DARK-tinted glass, not white: see DESIGN-LAW.md rule 10
      const gs = 'rgba(255,255,255,0.35)';
      const row = (i, y, num, lab, micro) => [
        rg('Step Card ' + i, { left:84, top:y, width:W-168, height:138, rx:30, fill:gf, stroke:gs, strokeWidth:1.5, shadow:sh('rgba(0,0,0,0.35)', 24, 0, 10) }),
        rg('Step Card ' + i + ' Sheen', { left:110, top:y+7, width:W-220, height:8, rx:4, fill:'rgba(255,255,255,0.16)' }),
        r('Step Num Box ' + i, { left:112, top:y+27, width:84, height:84, rx:24, grad:{ c1:P.a1, c2:P.a2, a:120 }, shadow:sh(P.glow, 16) }),
        t('Step Num ' + i, 'deco', 'none', num, { left:154, top:y+38, originX:'center', fontFamily:'Clash Display', fontSize:52, fill:P.deep }),
        t('Step Lab ' + i, 'info', 'upper', lab, { left:226, top:y+26, fontFamily:'Satoshi', fontSize:40, fill:'#ffffff', fontWeight:'900', charSpacing:30 }),
        t('Step Micro ' + i, 'info', 'none', micro, { left:226, top:y+82, fontFamily:'Satoshi', fontSize:26, fill:'rgba(255,255,255,0.7)' }),
      ];
      return [
        rg('Kicker Pill', { left:84, top:84, width:300, height:64, rx:32, fill:gf, stroke:gs, strokeWidth:1.2 }),
        t('Kicker', 'sub', 'upper', 'HOW IT WORKS', { left:234, top:102, originX:'center', fontFamily:'Satoshi', fontSize:26, fill:'#ffffff', fontWeight:'800', charSpacing:120 }),
        t('Headline 1', 'headline', 'upper', 'CASH IN', { left:84, top:172, fontFamily:'Clash Display', fontSize:104, fill:P.ink }),
        t('Headline 2', 'headline', 'upper', '3 STEPS', { left:84, top:274, fontFamily:'Clash Display', fontSize:142, grad:{ c1:P.a1, c2:P.a2, a:100 }, shadow:sh(P.glow, 24) }),
        ...row(1, 452, '1', 'TEXT PICS', 'Snap photos, text them over. 30 seconds.'),
        ...row(2, 606, '2', 'GET OFFER', 'Firm quote in minutes. Zero obligation.'),
        ...row(3, 760, '3', 'GET PAID', 'Cash or instant transfer, same day.'),
        ...phoneBar(P, T, 924),
      ];
    },
    voltStack: (P, T, C) => [
      ...ribbon(P, T, C.k, 92), ...trust(P, T, C.badges),
      t('Headline 1', 'headline', 'upper', C.h1, { left:CX, top:196, originX:'center', fontFamily:T.d, fontSize:148, fill:P.ink, stroke:P.paper ? undefined : P.deep, strokeWidth:P.paper ? 0 : 7, shadow:sh('rgba(0,0,0,0.4)', 16, 0, 6) }),
      t('Headline 2', 'headline', 'upper', C.h2, { left:CX, top:338, originX:'center', fontFamily:T.d, fontSize:226, grad:{ c1:P.a1, c2:P.a2, a:100 }, stroke:P.paper ? P.deep : '#000000', strokeWidth:9, shadow:sh(P.glow, 34) }),
      subBlock(P, T, C.sub, 636), ...ctaCard(P, T, C.cta),
    ],
    arcCrown: (P, T, C) => [
      ci('Halo Ring', { left:CX-330, top:110, radius:330, fill:'', stroke:P.a2, strokeWidth:2, opacity:0.3, selectable:false, evented:false }),
      t('Arc Crown', 'headline', 'upper', C.h1, { left:CX, top:210, fontFamily:T.d, fontSize:96, fill:P.ink, charSpacing:60, shadow:sh('rgba(0,0,0,0.45)', 12, 0, 4) }, { curve:30 }),
      t('Headline 2', 'headline', 'upper', C.h2, { left:CX, top:296, originX:'center', fontFamily:T.d, fontSize:216, grad:{ c1:P.a1, c2:P.a2, a:100 }, stroke:'#000000', strokeWidth:8, shadow:sh(P.glow, 32) }),
      t('Items', 'info', 'upper', C.items, { left:CX, top:590, originX:'center', fontFamily:T.s, fontSize:44, fill:P.sub, fontWeight:'700', charSpacing:60 }),
      subBlock(P, T, C.price, 674, 46), ...phoneBar(P, T, 806),
      t('Website', 'website', 'none', 'iphones.LA', { left:CX, top:966, originX:'center', fontFamily:'Satoshi', fontSize:22, fill:P.sub, opacity:0.7 }),
    ],
    neonNight: (P, T, C) => [
      t('Neon Kicker', 'sub', 'upper', C.k, { left:CX, top:120, originX:'center', fontFamily:'Clash Display', fontSize:40, fill:P.a1, charSpacing:180, shadow:sh(P.glow, 28) }),
      t('Headline 1', 'headline', 'upper', C.h1, { left:CX, top:218, originX:'center', fontFamily:T.d, fontSize:172, fill:'rgba(0,0,0,0)', stroke:P.a1, strokeWidth:5, shadow:sh(P.glow, 38) }),
      t('Headline 2', 'headline', 'upper', C.h2, { left:CX, top:394, originX:'center', fontFamily:T.d, fontSize:196, fill:'rgba(0,0,0,0)', stroke:P.a2, strokeWidth:5, shadow:sh(P.glow2, 42) }),
      t('Items', 'info', 'upper', C.items, { left:CX, top:660, originX:'center', fontFamily:T.s, fontSize:42, fill:P.ink, fontWeight:'600', charSpacing:40, opacity:0.9 }),
      rg('Neon Frame', { left:CX-330, top:790, width:660, height:130, rx:26, fill:'rgba(0,0,0,0.45)', stroke:P.a1, strokeWidth:2.5, shadow:sh(P.glow, 22) }),
      t('Phone Number', 'phone', 'none', '(562) 999-4994', { left:CX, top:818, originX:'center', fontFamily:'Satoshi', fontSize:62, fill:P.ink, fontWeight:'900', shadow:sh(P.glow, 16) }),
      t('Website', 'website', 'none', 'iphones.LA', { left:CX, top:960, originX:'center', fontFamily:'Satoshi', fontSize:22, fill:P.sub, opacity:0.65 }),
    ],
    editorialLux: (P, T, C) => [
      rg('Hairline Frame', { left:56, top:56, width:W-112, height:W-112, rx:20, fill:'rgba(0,0,0,0)', stroke:P.ink, strokeWidth:1.5, opacity:0.5 }),
      t('Kicker', 'sub', 'upper', C.k, { left:CX, top:150, originX:'center', fontFamily:T.s, fontSize:26, fill:P.sub, charSpacing:520, fontWeight:'600' }),
      t('Headline 1', 'headline', 'title', C.h1.toLowerCase(), { left:CX, top:300, originX:'center', fontFamily:T.d, fontSize:120, fill:P.ink, fontStyle:'italic' }),
      t('Headline 2', 'headline', 'title', C.h2 + '.', { left:CX, top:436, originX:'center', fontFamily:T.d, fontSize:168, grad:{ c1:P.a1, c2:P.a2, a:110 }, fontStyle:'italic' }),
      r('Rule', { left:CX-140, top:660, width:280, height:3, rx:2, fill:P.a1, opacity:0.85 }),
      t('Items', 'info', 'title', C.items, { left:CX, top:706, originX:'center', fontFamily:T.s, fontSize:38, fill:P.ink, opacity:0.85 }),
      t('Phone Number', 'phone', 'none', '(562) 999-4994', { left:CX, top:816, originX:'center', fontFamily:'Satoshi', fontSize:66, fill:P.ink, fontWeight:'800' }),
      t('CTA', 'cta', 'upper', C.cta, { left:CX, top:920, originX:'center', fontFamily:T.s, fontSize:26, fill:P.sub, charSpacing:300, fontWeight:'600' }),
    ],
    karatSeal: (P, T, C) => [
      ci('Seal Outer', { left:CX-150, top:96, radius:150, fill:'', stroke:P.a1, strokeWidth:3, shadow:sh(P.glow, 20) }),
      ci('Seal Inner', { left:CX-122, top:124, radius:122, fill:'', stroke:P.a1, strokeWidth:1.5, opacity:0.6 }),
      t('Seal Mark', 'deco', 'none', '$', { left:CX, top:170, originX:'center', fontFamily:T.d, fontSize:150, grad:{ c1:P.a1, c2:P.a2, a:120 }, shadow:sh(P.glow, 24) }),
      t('Headline 1', 'headline', 'upper', C.h1, { left:CX, top:436, originX:'center', fontFamily:T.d, fontSize:74, fill:P.ink, charSpacing:220 }),
      t('Headline 2', 'headline', 'upper', C.h2, { left:CX, top:512, originX:'center', fontFamily:T.d, fontSize:196, grad:{ c1:P.a1, c2:P.a2, a:100 }, shadow:sh(P.glow, 30) }),
      t('Items', 'info', 'upper', C.items, { left:CX, top:742, originX:'center', fontFamily:T.s, fontSize:40, fill:P.sub, charSpacing:40 }),
      ...phoneBar(P, T, 838),
      t('Website', 'website', 'none', 'iphones.LA', { left:CX, top:990, originX:'center', fontFamily:'Satoshi', fontSize:22, fill:P.sub, opacity:0.7 }),
    ],
    bandKnockout: (P, T, C) => [
      ...trust(P, T, C.badges),
      t('Headline 1', 'headline', 'upper', C.h1, { left:CX, top:158, originX:'center', fontFamily:T.d, fontSize:132, fill:P.ink, shadow:sh('rgba(0,0,0,0.4)', 14, 0, 5) }),
      r('Knockout Band', { left:34, top:334, width:W-68, height:252, rx:30, grad:{ c1:P.a1, c2:P.a2, a:100 }, shadow:sh(P.glow, 30, 0, 10) }),
      t('Headline 2', 'headline', 'upper', C.h2, { left:CX, top:366, originX:'center', fontFamily:T.d, fontSize:188, fill:P.paper ? '#ffffff' : P.deep }),
      t('Chip 1', 'badges', 'upper', C.badges[0], { left:CX-250, top:664, originX:'center', fontFamily:T.s, fontSize:34, fill:P.ink, fontWeight:'900', backgroundColor:P.paper ? 'rgba(23,19,16,0.08)' : 'rgba(255,255,255,0.12)', padding:14 }),
      t('Chip 2', 'badges', 'upper', C.badges[1], { left:CX, top:664, originX:'center', fontFamily:T.s, fontSize:34, fill:P.ink, fontWeight:'900', backgroundColor:P.paper ? 'rgba(23,19,16,0.08)' : 'rgba(255,255,255,0.12)', padding:14 }),
      t('Chip 3', 'badges', 'upper', C.badges[2], { left:CX+250, top:664, originX:'center', fontFamily:T.s, fontSize:34, fill:P.ink, fontWeight:'900', backgroundColor:P.paper ? 'rgba(23,19,16,0.08)' : 'rgba(255,255,255,0.12)', padding:14 }),
      ...ctaCard(P, T, C.cta),
    ],
    ticketStub: (P, T, C) => [
      r('Ticket', { left:CX-390, top:150, width:780, height:560, rx:32, fill:P.deep, shadow:sh('rgba(0,0,0,0.5)', 36, 0, 14) }),
      rg('Ticket Perf', { left:CX-362, top:178, width:724, height:504, rx:24, fill:'rgba(0,0,0,0)', stroke:P.a1, strokeWidth:2.5, strokeDashArray:[16,11], opacity:0.9 }),
      t('Admit', 'sub', 'upper', 'ADMIT: INSTANT CASH', { left:CX, top:224, originX:'center', fontFamily:T.s, fontSize:30, fill:P.a2, charSpacing:260, fontWeight:'700' }),
      t('Headline 1', 'headline', 'upper', C.h1, { left:CX, top:290, originX:'center', fontFamily:T.d, fontSize:92, fill:'#ffffff' }),
      t('Headline 2', 'headline', 'upper', C.h2, { left:CX, top:388, originX:'center', fontFamily:T.d, fontSize:150, grad:{ c1:P.a1, c2:P.a2, a:100 }, shadow:sh(P.glow, 24) }),
      t('Price Line', 'info', 'upper', C.price, { left:CX, top:576, originX:'center', fontFamily:T.s, fontSize:42, fill:'#ffffff', fontWeight:'800', charSpacing:40 }),
      t('Items', 'info', 'upper', C.items, { left:CX, top:640, originX:'center', fontFamily:T.s, fontSize:30, fill:'rgba(255,255,255,0.65)', charSpacing:30 }),
      ...phoneBar(P, T, 774),
      t('CTA', 'cta', 'upper', C.cta, { left:CX, top:936, originX:'center', fontFamily:T.s, fontSize:34, fill:P.ink, fontWeight:'800', charSpacing:120 }),
    ],
    glassCard: (P, T, C) => [
      ...ribbon(P, T, C.k, 96),
      rg('Glass Panel', { left:CX-410, top:230, width:820, height:492, rx:36, fill:'rgba(255,255,255,0.10)', stroke:'rgba(255,255,255,0.35)', strokeWidth:1.5, shadow:sh('rgba(0,0,0,0.5)', 40, 0, 18) }),
      t('Headline 1', 'headline', 'upper', C.h1, { left:CX, top:288, originX:'center', fontFamily:T.d, fontSize:104, fill:P.ink, shadow:sh('rgba(0,0,0,0.35)', 12, 0, 4) }),
      t('Headline 2', 'headline', 'upper', C.h2, { left:CX, top:398, originX:'center', fontFamily:T.d, fontSize:174, grad:{ c1:P.a1, c2:P.a2, a:100 }, shadow:sh(P.glow, 28) }),
      t('Items', 'info', 'upper', C.items, { left:CX, top:606, originX:'center', fontFamily:T.s, fontSize:36, fill:P.ink, opacity:0.85, charSpacing:30 }),
      ...ctaCard(P, T, C.cta),
    ],
    diagonalRush: (P, T, C) => [
      ...trust(P, T, C.badges),
      t('Headline 2', 'headline', 'upper', C.h2, { left:CX, top:150, originX:'center', fontFamily:T.d, fontSize:212, grad:{ c1:P.a1, c2:P.a2, a:100 }, stroke:'#000000', strokeWidth:8, shadow:sh(P.glow, 32) }),
      r('Rush Band 1', { left:CX, top:508, originX:'center', originY:'center', width:W+160, height:112, rx:26, angle:-6, grad:{ c1:P.a1, c2:P.a2, a:95 }, shadow:sh('rgba(0,0,0,0.4)', 18, 0, 8) }),
      t('Rush Text 1', 'sub', 'upper', C.price, { left:CX, top:508, originX:'center', originY:'center', fontFamily:T.d, fontSize:56, fill:P.paper ? '#ffffff' : P.deep, angle:-6 }),
      r('Rush Band 2', { left:CX, top:652, originX:'center', originY:'center', width:W+160, height:96, rx:26, angle:-6, fill:P.deep, shadow:sh('rgba(0,0,0,0.35)', 14, 0, 6) }),
      t('Rush Text 2', 'sub', 'upper', C.items, { left:CX, top:652, originX:'center', originY:'center', fontFamily:T.s, fontSize:40, fill:P.a1, fontWeight:'800', angle:-6 }),
      ...phoneBar(P, T, 812),
      t('CTA', 'cta', 'upper', C.cta, { left:CX, top:966, originX:'center', fontFamily:T.s, fontSize:32, fill:P.ink, fontWeight:'800', charSpacing:140 }),
    ],
    bubblePop: (P, T, C) => [
      t('Headline 1', 'headline', 'upper', C.h1, { left:CX-40, top:140, originX:'center', fontFamily:T.d, fontSize:126, fill:P.ink, stroke:P.deep, strokeWidth:10, shadow:sh(P.a2, 0, 9, 9) }),
      t('Headline 2', 'headline', 'upper', C.h2, { left:CX, top:282, originX:'center', fontFamily:T.d, fontSize:216, fill:P.a1, stroke:P.deep, strokeWidth:12, shadow:sh(P.a2, 0, 12, 12) }),
      ci('Sticker', { left:W-322, top:486, radius:112, fill:P.a2, shadow:sh('rgba(0,0,0,0.4)', 20, 0, 8) }),
      t('Sticker Text', 'deco', 'upper', 'TOP $$$', { left:W-210, top:598, fontFamily:T.d, fontSize:44, fill:P.paper ? '#ffffff' : P.deep, angle:10 }, { curve:32 }),
      subBlock(P, T, C.sub, 622), ...ctaCard(P, T, C.cta),
    ],
    slabPoster: (P, T, C) => [
      rg('Poster Frame', { left:50, top:50, width:W-100, height:W-100, rx:22, fill:'rgba(0,0,0,0)', stroke:P.ink, strokeWidth:3, opacity:0.75 }),
      t('Kicker', 'sub', 'upper', C.k, { left:CX, top:140, originX:'center', fontFamily:T.s, fontSize:32, fill:P.sub, charSpacing:400, fontWeight:'700' }),
      t('Headline 1', 'headline', 'upper', C.h1, { left:CX, top:238, originX:'center', fontFamily:T.d, fontSize:110, fill:P.ink }),
      t('Headline 2', 'headline', 'upper', C.h2, { left:CX, top:356, originX:'center', fontFamily:T.d, fontSize:224, fill:P.ink, shadow:sh(P.glow, 0, 10, 10) }),
      r('Price Strip', { left:CX-330, top:650, width:660, height:92, rx:18, grad:{ c1:P.a1, c2:P.a2, a:95 } }),
      t('Price Line', 'info', 'upper', C.price, { left:CX, top:668, originX:'center', fontFamily:T.s, fontSize:44, fill:P.paper ? '#ffffff' : P.deep, fontWeight:'900' }),
      t('Phone Number', 'phone', 'none', '(562) 999-4994', { left:CX, top:806, originX:'center', fontFamily:'Satoshi', fontSize:74, fill:P.ink, fontWeight:'900' }),
      t('Website', 'website', 'none', 'iphones.LA', { left:CX, top:924, originX:'center', fontFamily:'Satoshi', fontSize:24, fill:P.sub }),
    ],
    scriptRetro: (P, T, C) => [
      // connected script faces must stay one run, curving per-glyph severs the joins
      t('Script Line', 'headline', 'title', C.h1.toLowerCase(), { left:CX, top:198, originX:'center', fontFamily:T.d, fontSize:112, fill:P.a1, angle:-4, shadow:sh(P.glow, 22) }),
      t('Headline 2', 'headline', 'upper', C.h2, { left:CX, top:330, originX:'center', fontFamily:'Melodrama', fontSize:172, fill:P.ink, stroke:P.deep, strokeWidth:6, shadow:sh('rgba(0,0,0,0.35)', 14, 0, 6) }),
      t('Divider', 'deco', 'none', '───  ★  ───', { left:CX, top:576, originX:'center', fontFamily:T.s, fontSize:34, fill:P.a2 }),
      t('Items', 'info', 'title', C.items, { left:CX, top:648, originX:'center', fontFamily:T.s, fontSize:40, fill:P.ink, opacity:0.9 }),
      ...phoneBar(P, T, 760),
      t('CTA', 'cta', 'upper', C.cta, { left:CX, top:922, originX:'center', fontFamily:T.s, fontSize:30, fill:P.sub, charSpacing:200, fontWeight:'700' }),
    ],
    hudTech: (P, T, C) => [
      r('HUD Top', { left:CX-160, top:64, width:320, height:5, rx:3, fill:P.a2, shadow:sh(P.glow2, 14) }),
      t('Kicker', 'sub', 'upper', '// ' + C.k + ' //', { left:CX, top:104, originX:'center', fontFamily:T.s, fontSize:34, fill:P.a2, charSpacing:220, fontWeight:'600' }),
      ci('HUD Ring', { left:W-360, top:180, radius:230, fill:'', stroke:P.a2, strokeWidth:1.5, opacity:0.25, selectable:false, evented:false }),
      t('Headline 1', 'headline', 'upper', C.h1, { left:CX, top:200, originX:'center', fontFamily:T.d, fontSize:130, fill:P.ink, shadow:sh(P.glow2, 18) }),
      t('Headline 2', 'headline', 'upper', C.h2, { left:CX, top:344, originX:'center', fontFamily:T.d, fontSize:196, grad:{ c1:P.a2, c2:P.a1, a:100 }, shadow:sh(P.glow, 30) }),
      t('Data Line', 'info', 'upper', C.items, { left:CX, top:600, originX:'center', fontFamily:T.s, fontSize:40, fill:P.sub, charSpacing:80 }),
      r('Tech Chip', { left:CX-340, top:700, width:680, height:124, rx:20, fill:P.deep, stroke:P.a2, strokeWidth:2, shadow:sh(P.glow2, 18) }),
      t('Phone Number', 'phone', 'none', '(562) 999-4994', { left:CX, top:726, originX:'center', fontFamily:'Satoshi', fontSize:60, fill:'#ffffff', fontWeight:'900' }),
      t('CTA', 'cta', 'upper', C.cta, { left:CX, top:886, originX:'center', fontFamily:T.s, fontSize:36, fill:P.a1, charSpacing:160, fontWeight:'700', shadow:sh(P.glow, 14) }),
      r('HUD Bottom', { left:CX-160, top:986, width:320, height:5, rx:3, fill:P.a2, shadow:sh(P.glow2, 14) }),
    ],
    wantedFrame: (P, T, C) => [
      rg('Frame Outer', { left:64, top:64, width:W-128, height:W-128, rx:18, fill:'rgba(0,0,0,0)', stroke:P.ink, strokeWidth:5 }),
      rg('Frame Inner', { left:88, top:88, width:W-176, height:W-176, rx:14, fill:'rgba(0,0,0,0)', stroke:P.ink, strokeWidth:1.5, opacity:0.7 }),
      t('Wanted', 'headline', 'upper', 'WANTED', { left:CX, top:150, originX:'center', fontFamily:T.d, fontSize:140, fill:P.ink, charSpacing:120 }),
      t('Sub Kicker', 'sub', 'upper', C.k, { left:CX, top:318, originX:'center', fontFamily:T.s, fontSize:34, fill:P.sub, charSpacing:280 }),
      t('Headline 2', 'headline', 'upper', C.h2, { left:CX, top:392, originX:'center', fontFamily:T.d, fontSize:164, grad:{ c1:P.a1, c2:P.a2, a:100 } }),
      t('Items', 'info', 'upper', C.items, { left:CX, top:600, originX:'center', fontFamily:T.s, fontSize:38, fill:P.ink, opacity:0.85 }),
      t('Reward', 'info', 'upper', ', REWARD, ', { left:CX, top:678, originX:'center', fontFamily:T.s, fontSize:30, fill:P.sub, charSpacing:340 }),
      t('Price Line', 'info', 'upper', C.price, { left:CX, top:734, originX:'center', fontFamily:T.d, fontSize:44, fill:P.a2 }),
      t('Phone Number', 'phone', 'none', '(562) 999-4994', { left:CX, top:838, originX:'center', fontFamily:T.d, fontSize:66, fill:P.ink }),
      t('Website', 'website', 'none', 'iphones.LA', { left:CX, top:944, originX:'center', fontFamily:T.s, fontSize:24, fill:P.sub }),
    ],
    checklistHero: (P, T, C) => {
      const rows = C.sub.split('\n');
      const mk = (i) => ([
        ci('Tick ' + (i+1), { left:96, top:566 + i*96, radius:27, fill:P.a1, shadow:sh(P.glow, 14) }),
        t('Tick Mark ' + (i+1), 'deco', 'none', '✓', { left:123, top:576 + i*96, originX:'center', fontFamily:'Satoshi', fontSize:38, fill:P.paper ? '#ffffff' : P.deep, fontWeight:'900' }),
        t('Point ' + (i+1), 'info', 'upper', rows[i], { left:164, top:576 + i*96, fontFamily:T.s, fontSize:39, fill:P.ink, fontWeight:'800' }),
      ]);
      return [
        ...trust(P, T, C.badges),
        t('Headline 1', 'headline', 'upper', C.h1, { left:80, top:150, fontFamily:T.d, fontSize:126, fill:P.ink, shadow:sh('rgba(0,0,0,0.4)', 14, 0, 5) }),
        t('Headline 2', 'headline', 'upper', C.h2, { left:76, top:282, fontFamily:T.d, fontSize:212, grad:{ c1:P.a1, c2:P.a2, a:100 }, stroke:'#000000', strokeWidth:8, shadow:sh(P.glow, 30) }),
        ...mk(0), ...mk(1), ...mk(2),
        ...ctaCard(P, T, C.cta),
      ];
    },
    duoSplit: (P, T, C) => [
      r('Side Panel', { left:-60, top:-60, width:560, height:W+120, rx:44, fill:P.deep, shadow:sh('rgba(0,0,0,0.5)', 40, 14, 0) }),
      t('Headline 1', 'headline', 'upper', C.h1, { left:64, top:130, fontFamily:T.d, fontSize:96, fill:'#ffffff' }),
      t('Headline 2', 'headline', 'upper', C.h2, { left:60, top:236, fontFamily:T.d, fontSize:132, grad:{ c1:P.a1, c2:P.a2, a:115 }, shadow:sh(P.glow, 24) }),
      tb('Info Text', 'info', 'upper', C.sub, { left:64, top:462, width:372, fontFamily:T.s, fontSize:28, fill:'rgba(255,255,255,0.85)', fontWeight:'700', lineHeight:1.48 }),
      t('Price Line', 'info', 'upper', C.price, { left:64, top:824, fontFamily:T.d, fontSize:40, fill:P.a1, shadow:sh(P.glow, 16) }),
      t('Kicker', 'sub', 'upper', C.k, { left:770, top:120, originX:'center', fontFamily:T.s, fontSize:32, fill:P.ink, charSpacing:200, fontWeight:'700', backgroundColor:'rgba(0,0,0,0.35)', padding:12 }),
      r('Phone Chip', { left:560, top:860, width:470, height:112, rx:24, grad:{ c1:P.a1, c2:P.a2, a:95 }, shadow:sh(P.glow, 22) }),
      t('Phone Number', 'phone', 'none', '(562) 999-4994', { left:795, top:884, originX:'center', fontFamily:'Satoshi', fontSize:47, fill:P.paper ? '#ffffff' : P.deep, fontWeight:'900' }),
      t('Website', 'website', 'none', 'iphones.LA', { left:795, top:1000, originX:'center', fontFamily:'Satoshi', fontSize:22, fill:P.ink, opacity:0.6 }),
    ],
    gradientWave: (P, T, C) => [
      ...trust(P, T, C.badges),
      t('Headline 1', 'headline', 'upper', C.h1, { left:CX, top:170, originX:'center', fontFamily:T.d, fontSize:120, fill:P.ink, stroke:P.paper ? undefined : P.deep, strokeWidth:P.paper ? 0 : 6 }),
      t('Wave Line', 'headline', 'upper', C.h2, { left:CX, top:400, fontFamily:T.d, fontSize:200, grad:{ c1:P.a1, c2:P.a2, a:90 }, stroke:'#000000', strokeWidth:8, shadow:sh(P.glow, 30) }, { curve:-22 }),
      t('Items', 'info', 'upper', C.items, { left:CX, top:622, originX:'center', fontFamily:T.s, fontSize:40, fill:P.sub, charSpacing:50 }),
      subBlock(P, T, C.price, 700, 44),
      ...ctaCard(P, T, C.cta),
    ],
  };

  // ── professional / agency tier ──
  LAYOUTS.agencyGrid = (P, T, C) => [
    r('Rule Top', { left:70, top:96, width:200, height:5, rx:3, fill:P.a1 }),
    t('Kicker', 'sub', 'upper', C.k, { left:70, top:130, fontFamily:T.s, fontSize:28, fill:P.sub, charSpacing:340, fontWeight:'700' }),
    t('Headline 1', 'headline', 'upper', C.h1, { left:64, top:210, fontFamily:T.d, fontSize:148, fill:P.ink }),
    t('Headline 2', 'headline', 'upper', C.h2, { left:64, top:366, fontFamily:T.d, fontSize:148, grad:{ c1:P.a1, c2:P.a2, a:100 } }),
    r('Rule Mid', { left:70, top:594, width:W-140, height:2, rx:1, fill:P.ink, opacity:0.25 }),
    t('Items', 'info', 'upper', C.items, { left:70, top:628, fontFamily:T.s, fontSize:33, fill:P.sub, charSpacing:60 }),
    t('Price Label', 'info', 'upper', 'PAYING UP TO', { left:70, top:756, fontFamily:T.s, fontSize:25, fill:P.sub, charSpacing:320, fontWeight:'600' }),
    t('Price Line', 'info', 'upper', C.big, { left:64, top:796, fontFamily:T.d, fontSize:124, grad:{ c1:P.a1, c2:P.a2, a:100 } }),
    t('Phone Number', 'phone', 'none', '(562) 999-4994', { left:W-64, top:820, originX:'right', fontFamily:'Satoshi', fontSize:42, fill:P.ink, fontWeight:'800' }),
    t('CTA', 'cta', 'upper', C.cta, { left:W-64, top:884, originX:'right', fontFamily:T.s, fontSize:25, fill:P.a1, charSpacing:130, fontWeight:'700' }),
    t('Website', 'website', 'none', 'iphones.LA', { left:W-64, top:934, originX:'right', fontFamily:'Satoshi', fontSize:20, fill:P.sub, opacity:0.8 }),
  ];
  LAYOUTS.priceAnchor = (P, T, C) => [
    t('Kicker', 'sub', 'upper', C.h1 + ' ' + C.h2, { left:CX, top:118, originX:'center', fontFamily:T.s, fontSize:34, fill:P.ink, charSpacing:260, fontWeight:'700', opacity:0.92 }),
    r('Anchor Rule', { left:CX-60, top:196, width:120, height:5, rx:3, fill:P.a1 }),
    t('Price Label', 'info', 'upper', 'WE PAY UP TO', { left:CX, top:296, originX:'center', fontFamily:T.s, fontSize:29, fill:P.sub, charSpacing:420, fontWeight:'600' }),
    t('Price Line', 'headline', 'upper', C.big, { left:CX, top:372, originX:'center', fontFamily:T.d, fontSize:246, grad:{ c1:P.a1, c2:P.a2, a:100 }, shadow:sh(P.glow, 34) }),
    t('Offer Line', 'info', 'upper', C.items, { left:CX, top:678, originX:'center', fontFamily:T.s, fontSize:35, fill:P.sub, charSpacing:60 }),
    ...phoneBar(P, T, 786),
    t('Website', 'website', 'none', 'iphones.LA', { left:CX, top:948, originX:'center', fontFamily:'Satoshi', fontSize:21, fill:P.sub, opacity:0.7 }),
  ];
  LAYOUTS.lowerThird = (P, T, C) => [
    ...trust(P, T, C.badges),
    r('Third Band', { left:-40, top:640, width:W+80, height:520, rx:44, fill:P.deep, shadow:sh('rgba(0,0,0,0.5)', 34, 0, -10) }),
    r('Accent Tick', { left:70, top:702, width:120, height:6, rx:3, fill:P.a1 }),
    t('Kicker', 'sub', 'upper', C.k, { left:70, top:734, fontFamily:T.s, fontSize:25, fill:P.a1, charSpacing:300, fontWeight:'700' }),
    t('Headline 1', 'headline', 'upper', C.h1, { left:64, top:786, fontFamily:T.d, fontSize:94, fill:'#ffffff' }),
    t('Headline 2', 'headline', 'upper', C.h2, { left:64, top:886, fontFamily:T.d, fontSize:94, grad:{ c1:P.a1, c2:P.a2, a:100 } }),
    t('Items', 'info', 'upper', C.items, { left:70, top:1002, fontFamily:T.s, fontSize:25, fill:'rgba(255,255,255,0.6)', charSpacing:40 }),
    t('Phone Number', 'phone', 'none', '(562) 999-4994', { left:W-70, top:812, originX:'right', fontFamily:'Satoshi', fontSize:52, fill:'#ffffff', fontWeight:'900' }),
    t('CTA', 'cta', 'upper', C.cta, { left:W-70, top:888, originX:'right', fontFamily:T.s, fontSize:27, fill:P.a1, charSpacing:110, fontWeight:'700' }),
  ];

  // ── the curated combo book: category → [layout, palette, pair, display name, featured] ──
  const BOOK = {
    phones: [
      ['voltStack','volt','titan','Volt District',1], ['glassCard','ocean','right','Glassline'], ['neonNight','royal','bungee','Neon Vault'],
      ['arcCrown','crimson','passion','Marquee Arc'], ['bandKnockout','arctic','staat','Arctic Band'], ['diagonalRush','sunset','rowdies','Rush Hour'],
      ['bubblePop','volt','lucky','Bubble Volt'], ['hudTech','ocean','russo','Circuit HUD',1], ['ticketStub','mono','slab','Stub Mono'],
      ['checklistHero','emerald','lilita','Deal Checklist'], ['duoSplit','royal','right','Split Royal'], ['gradientWave','sunset','titan','Sunset Wave'],
      ['slabPoster','mono','ultra','Mono Slab'], ['scriptRetro','rose','pacifico','Rose Retro'],
      ['agencyGrid','mono','staat','Agency Mono',1], ['priceAnchor','volt','passion','Price Point'], ['lowerThird','ocean','right','Broadcast'],
      ['reviewProof','ocean','playfair','Seller Proof',1], ['trustSeal','mono','cinzel','Trust Seal'], ['stepsFlow','volt','russo','Three Steps'],
    ],
    gold: [
      ['karatSeal','gold','cinzel','24K Seal',1], ['editorialLux','gold','playfair','Estate Serif',1], ['voltStack','gold','slab','Bullion Stack'],
      ['bandKnockout','paper','staat','Ledger Band'], ['glassCard','gold','abril','Gilt Glass'], ['ticketStub','gold','slab','Assay Ticket'],
      ['wantedFrame','paper','vast','Gold Rush Frame'], ['arcCrown','gold','cinzel','Crown Karat'], ['slabPoster','paper','ultra','Broadsheet Gold'],
      ['checklistHero','gold','lilita','Scale Checklist'], ['diagonalRush','crimson','rowdies','Vault Rush'], ['scriptRetro','gold','pacifico','Golden Script'],
      ['gradientWave','gold','abril','Molten Wave'], ['duoSplit','gold','right','Karat Split'],
      ['agencyGrid','gold','cinzel','Atelier Grid'], ['priceAnchor','gold','abril','Spot Price',1], ['lowerThird','gold','staat','Gold Standard'],
      ['reviewProof','gold','playfair','Golden Reviews',1], ['trustSeal','gold','cinzel','Assured Gold'], ['stepsFlow','gold','staat','Easy Gold'],
    ],
    silver: [
      ['slabPoster','mono','ultra','Sterling Slab',1], ['editorialLux','arctic','playfair','Assay Serif'], ['voltStack','mono','slab','Bar Stack'],
      ['hudTech','arctic','russo','Spot Ticker'], ['bandKnockout','mono','staat','Ingot Band'], ['glassCard','ocean','right','Silverline'],
      ['ticketStub','arctic','slab','Mint Ticket'], ['karatSeal','mono','cinzel','Hallmark Seal'], ['checklistHero','ocean','lilita','Weigh-In List'],
      ['arcCrown','mono','passion','Sterling Arc'], ['wantedFrame','arctic','elite','Silver Notice'], ['gradientWave','ocean','titan','Quicksilver'],
      ['diagonalRush','mono','rowdies','Melt Rush'],
      ['agencyGrid','arctic','staat','Studio Grid'], ['priceAnchor','mono','ultra','Spot Anchor'], ['lowerThird','ocean','russo','Newsline'],
      ['reviewProof','arctic','playfair','Silver Proof'], ['trustSeal','mono','cinzel','Hallmark Trust'], ['stepsFlow','ocean','russo','Silver Steps'],
    ],
    coins: [
      ['wantedFrame','paper','vast','Old Mint Notice',1], ['editorialLux','paper','playfair','Numismatic'], ['karatSeal','gold','cinzel','Double Eagle'],
      ['ticketStub','paper','elite','Auction Stub'], ['slabPoster','gold','ultra','Mint Poster'], ['voltStack','royal','slab','Collector Stack'],
      ['arcCrown','gold','passion','Liberty Arc'], ['checklistHero','paper','lilita','Estate List'], ['glassCard','royal','right','Proof Glass'],
      ['bandKnockout','gold','staat','Greysheet Band'], ['scriptRetro','paper','pacifico','Heritage Script'], ['gradientWave','royal','abril','Gilded Wave'],
      ['hudTech','mono','russo','Grade Scanner'],
      ['agencyGrid','paper','playfair','Catalogue'], ['priceAnchor','gold','cinzel','Reserve Price'], ['lowerThird','royal','staat','Auction Line'],
      ['reviewProof','paper','playfair','Collector Proof'], ['trustSeal','gold','cinzel','Estate Trust'], ['stepsFlow','royal','staat','Coin Steps'],
    ],
    cars: [
      ['diagonalRush','crimson','rowdies','Tow Rush',1], ['voltStack','ocean','blackops','Motor Stack'], ['bandKnockout','sunset','staat','Sunset Strip'],
      ['hudTech','crimson','russo','Dash HUD'], ['slabPoster','mono','ultra','Junker Poster'], ['neonNight','sunset','bungee','Neon Garage'],
      ['ticketStub','mono','slab','Pink Slip'], ['checklistHero','emerald','lilita','Pickup List'], ['glassCard','ocean','right','Showroom Glass'],
      ['duoSplit','crimson','right','Lot Split'], ['arcCrown','sunset','passion','Boulevard Arc'], ['wantedFrame','paper','vast','Runner Wanted'],
      ['gradientWave','crimson','titan','Redline Wave'],
      ['agencyGrid','mono','blackops','Showroom Grid'], ['priceAnchor','crimson','rowdies','Sticker Price',1], ['lowerThird','sunset','staat','Prime Time'],
      ['reviewProof','mono','playfair','Driver Proof'], ['trustSeal','crimson','cinzel','Title Trust'], ['stepsFlow','sunset','russo','Car Steps'],
    ],
    strips: [
      ['checklistHero','arctic','lilita','Sealed Checklist',1], ['voltStack','emerald','titan','Strip Stack'], ['bandKnockout','arctic','staat','Clinic Band'],
      ['glassCard','emerald','right','Clean Glass'], ['ticketStub','emerald','slab','Pharmacy Stub'], ['slabPoster','arctic','ultra','Box Poster'],
      ['arcCrown','emerald','passion','Care Arc'], ['hudTech','ocean','russo','Sensor HUD'], ['editorialLux','arctic','playfair','Quiet Serif'],
      ['duoSplit','emerald','right','Split Clinic'], ['gradientWave','emerald','titan','Mint Wave'], ['diagonalRush','ocean','rowdies','Priority Rush'],
      ['agencyGrid','arctic','right','Clinical Grid'], ['priceAnchor','emerald','titan','Box Price'], ['lowerThird','emerald','staat','Health Line'],
      ['reviewProof','arctic','playfair','Verified Buyer'], ['trustSeal','emerald','cinzel','Care Seal'], ['stepsFlow','emerald','russo','Box Steps'],
    ],
    pokemon: [
      ['bubblePop','royal','lucky','Holo Pop',1], ['neonNight','royal','bungee','Neon Holo'], ['voltStack','volt','titan','Trainer Stack'],
      ['glassCard','royal','right','Slab Glass'], ['ticketStub','sunset','slab','Booster Stub'], ['bandKnockout','volt','staat','Grade Band'],
      ['hudTech','ocean','russo','Scanner Deck'], ['checklistHero','royal','lilita','Binder List'], ['scriptRetro','sunset','pacifico','Vintage Script'],
      ['arcCrown','royal','passion','Champion Arc'], ['gradientWave','volt','titan','Prism Wave'], ['diagonalRush','sunset','rowdies','Pull Rush'],
      ['slabPoster','mono','ultra','Slab Poster'],
      ['agencyGrid','royal','bungee','Set Grid'], ['priceAnchor','volt','lucky','Grail Price'], ['lowerThird','royal','right','Pull Report'],
      ['reviewProof','royal','playfair','Trainer Proof'], ['trustSeal','royal','cinzel','Graded Trust'], ['stepsFlow','volt','russo','Pull Steps'],
    ],
    sports: [
      ['scriptRetro','paper','pacifico','Pennant Script',1], ['slabPoster','paper','ultra','Box Score'], ['voltStack','crimson','slab','Rookie Stack'],
      ['ticketStub','crimson','slab','Season Ticket'], ['wantedFrame','paper','vast','Grail Wanted'], ['bandKnockout','emerald','staat','Field Band'],
      ['checklistHero','crimson','lilita','Comp Checklist'], ['glassCard','mono','right','Case Glass'], ['hudTech','emerald','russo','Stat HUD'],
      ['arcCrown','crimson','passion','Stadium Arc'], ['neonNight','emerald','bungee','Night Game'], ['gradientWave','crimson','titan','Clutch Wave'],
      ['duoSplit','mono','right','Locker Split'],
      ['agencyGrid','mono','staat','Program Grid'], ['priceAnchor','crimson','ultra','Card Price'], ['lowerThird','emerald','russo','Sports Desk'],
      ['reviewProof','paper','playfair','Fan Proof'], ['trustSeal','crimson','cinzel','Collector Seal'], ['stepsFlow','emerald','russo','Card Steps'],
    ],
  };

  const MOOD = { volt:'electric lime + cyan accents on deep navy', coral:'warm cream daylight, coral tones', gold:'warm amber candlelight on near-black', emerald:'deep green with mint highlights', royal:'violet night with amber warmth', crimson:'moody red neon on black', ocean:'deep teal-blue with cyan glow', paper:'aged warm paper daylight', rose:'soft pink-amber studio dusk', arctic:'bright cool daylight, airy', mono:'neutral charcoal studio, silver light', sunset:'purple-magenta dusk with orange flare' };

  /* ── HOUSE DESIGN LAW (see DESIGN-LAW.md) ───────────────────────────────
     Two treatments were making the library read as amateur, and both were
     hand-applied across ~35 layout call sites rather than decided once.

     1. COLOURED GLOW. A saturated halo behind type is a nightclub-flyer
        signal. Print separates type from a photograph with a soft NEUTRAL
        shadow, which the eye reads as depth rather than as an effect. Every
        chromatic text shadow is rewritten neutral at the same softness.
        Shadows that are ALREADY neutral are left alone: those are doing
        legitimate legibility work, not decoration.

     2. HUE-JUMPING GRADIENT TYPE. A gradient within one hue reads as material
        (brushed gold, warm metal) and is worth keeping. A gradient that
        travels between hues (pink to violet, orange to lime) reads as
        WordArt. Past a 40 degree shift it is flattened to its dominant stop.
        A gradient from a neutral to a colour (white into gold) is left alone,
        because that is the money-word treatment, not a rainbow.

     Enforcing here instead of in every layout means one thing to read, one
     thing to tune, and no way to forget it in the next layout someone adds. */
  const readColor = c => {
    if (typeof c !== 'string') return null;
    const s = c.trim();
    let m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)$/i.exec(s);
    if (m) return { r:+m[1], g:+m[2], b:+m[3], a: m[4] === undefined ? 1 : +m[4] };
    m = /^#([0-9a-f]{6})$/i.exec(s);
    if (m){ const n = parseInt(m[1], 16); return { r:(n>>16)&255, g:(n>>8)&255, b:n&255, a:1 }; }
    m = /^#([0-9a-f]{3})$/i.exec(s);
    if (m){ const h = m[1]; return { r:parseInt(h[0]+h[0],16), g:parseInt(h[1]+h[1],16), b:parseInt(h[2]+h[2],16), a:1 }; }
    return null;
  };
  const chroma = c => (Math.max(c.r,c.g,c.b) - Math.min(c.r,c.g,c.b)) / 255;
  const hueOf = c => {
    const r=c.r/255, g=c.g/255, b=c.b/255;
    const mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn;
    if (!d) return 0;
    let h = mx===r ? ((g-b)/d)%6 : mx===g ? (b-r)/d+2 : (r-g)/d+4;
    h *= 60;
    return h < 0 ? h + 360 : h;
  };
  const hueGap = (a,b) => { const d = Math.abs(hueOf(a) - hueOf(b)); return d > 180 ? 360 - d : d; };
  const GLOW_CHROMA = 0.18;   // above this a shadow is decoration, not depth
  const HUE_LIMIT   = 40;     // degrees of travel a gradient may cover
  const TEXT_KINDS  = { text:1, textbox:1 };
  // Relative luminance, used only to tell light type (sitting on a photo, so
  // it needs separation) from dark type on a paper ground (which does not).
  const lum = c => (0.2126*c.r + 0.7152*c.g + 0.0722*c.b) / 255;
  /* THE ONE WAY type separates from a photograph here: a tight, dense,
     neutral shadow. DENSE because it has to do the work the outline used to
     do, and a polite 0.4 alpha does not (a jade headline over a bright patch
     of a photo simply disappeared in testing). TIGHT because a wide soft one
     is a glow wearing a different hat. Scaled off the type size so a 226px
     hero and a 28px label both get a shadow in proportion to themselves. */
  const separate = (p, P) => {
    const fs = p.fontSize || 40;
    p.shadow = sh(hexToRgba(P.deep, fs >= 60 ? 0.72 : 0.55),
      Math.max(4, Math.round(fs * 0.09)), 0, Math.max(1, Math.round(fs * 0.015)));
  };
  function houseType(layers, P){
    layers.forEach(l => {
      const p = l.props;
      if (!p) return;
      const isText = TEXT_KINDS[l.kind] || (!l.kind && (l.text !== undefined || p.text !== undefined));
      /* 3. OUTLINED TYPE. A stroke around letterforms is the single most
            reliable amateur signal there is: it is what you reach for when
            the type does not have enough contrast against its background,
            and it destroys the letterform's shape while it does it. The fix
            is contrast, not an outline. Strokes on RECTS and CIRCLES stay
            (169 of them) because those are frames and hairline rules doing
            real structural work; only the 139 on type go. Light type that
            loses its stroke and has no shadow gets a soft neutral one, so
            nothing becomes less legible over a photograph than it was. */
      if (isText && p.stroke && p.strokeWidth > 0){
        delete p.stroke;
        delete p.strokeWidth;
        const fill = readColor(p.fill);
        // Dark type on a paper ground never needed the outline and must not
        // gain a shadow. Light type over photography is always recompensated,
        // even if it already had a shadow, because the shadow it had was
        // tuned to sit ALONGSIDE an outline, not to replace one.
        if (!fill || lum(fill) > 0.55) separate(p, P);
      }
      const s = p.shadow;
      if (s && s.color){
        const c = readColor(s.color);
        if (c && chroma(c) > GLOW_CHROMA) separate(p, P);
      }
      /* Rule 2 says light type over a photograph ALWAYS gets separation, but
         this only enforced it for type that was losing a stroke or a glow.
         Type that never had either got nothing, and the audit found exactly
         that: pale grey kickers and price labels sitting unaided on mono
         backdrops. Every designer template is photo-backed, so any light fill
         without a shadow qualifies. */
      if (isText && !p.shadow){
        const fill = readColor(p.fill);
        if (fill && lum(fill) > 0.55) separate(p, P);
      }
      /* Small supporting text was being made quiet by WASHING THE COLOUR OUT
         — dim greys like #c8c8cf at 24-32px. Over photography that is the
         worst case there is: small type needs MORE contrast than large, not
         less, and the audit caught kickers and price labels that had simply
         disappeared. Rule 9 says hierarchy comes from scale, weight and
         space, so the size already does the quietening and the colour does
         not have to. Lift dim small type to the palette's ink. */
      // NOTE the units: lum() here is PLAIN luminance, not gamma-corrected
      // WCAG luminance. #c8c8cf is 0.786 on this scale and 0.581 on that one,
      // so a window written in the wrong units silently matches nothing.
      // Range below excludes white (1.0) and dark type on paper grounds.
      if (isText && (p.fontSize || 0) < 44 && p.fill && !p.grad){
        const fill = readColor(p.fill);
        if (fill && lum(fill) > 0.35 && lum(fill) < 0.88){
          p.fill = P.ink;
          if (!p.shadow) separate(p, P);
        }
      }
      if (p.grad && p.grad.c1 && p.grad.c2){
        const a = readColor(p.grad.c1), b = readColor(p.grad.c2);
        if (a && b && chroma(a) > 0.1 && chroma(b) > 0.1 && hueGap(a, b) > HUE_LIMIT){
          p.fill = p.grad.c1;
          delete p.grad;
        }
      }
    });
  }

  /* With optical alignment measured, the hand-tuned fudges are not just
     redundant, they are now WRONG — they were cancelling a bearing from a
     typeface the library no longer uses. Left-aligned text sitting within a
     few px of a shared column gets snapped onto it, so the authored numbers
     finally say what the design means. Clusters are span-limited so a genuine
     second column (an indent, a nested list) is never swallowed. */
  const COL_TOL = 8;
  function snapColumns(layers){
    const items = layers.filter(l =>
      (l.kind === 'text' || l.kind === 'textbox' || (!l.kind && l.text !== undefined)) &&
      l.props && typeof l.props.left === 'number' &&
      l.props.originX !== 'center' && l.props.originX !== 'right');
    if (items.length < 2) return;
    const sorted = items.slice().sort((a, b) => a.props.left - b.props.left);
    let group = [sorted[0]];
    const flush = () => {
      if (group.length < 2) return;
      const tally = {};
      group.forEach(g => { tally[g.props.left] = (tally[g.props.left] || 0) + 1; });
      const target = +Object.entries(tally).sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
      group.forEach(g => { g.props.left = target; });
    };
    for (let i = 1; i < sorted.length; i++){
      // span-limited: the whole cluster must fit inside the tolerance
      if (sorted[i].props.left - group[0].props.left <= COL_TOL) group.push(sorted[i]);
      else { flush(); group = [sorted[i]]; }
    }
    flush();
  }

  window.BG_MANIFEST = [];
  Object.keys(BOOK).forEach(cat => {
    const D = DECKS[cat];
    BOOK[cat].forEach(row => {
      const [lay, pal, pair, label, feat] = row;
      const P = PAL[pal], T = { d:PAIRS[pair][0], s:PAIRS[pair][1] };
      const C = Object.assign({}, D, { h2: (lay === 'duoSplit' || lay === 'checklistHero') ? D.h2 : D.h2, quote: (TRUST_COPY[cat]||{}).q || '"Great local buyer, fast and fair."', who: (TRUST_COPY[cat]||{}).w || 'A LOCAL SELLER' });
      const id = 'dl_' + cat + '_' + lay + '_' + pal;
      const file = 'assets/bg/' + id + '.jpg';
      /* Scrim compensates for how bright the BACKDROP is, which is a property
         of the palette's mood prompt, not a global constant. mono is "neutral
         charcoal studio, silver light" and arctic is "bright cool daylight,
         airy": those photographs are pale, and pale type vanishes into them.
         The contrast audit found grey "CARS" on a grey car and grey "COINS"
         on grey coins exactly there.
         One global value cannot serve both families — 0.32 everywhere left 22
         failing text layers, and 0.55 everywhere was rejected as too dark. So
         the bright palettes carry more scrim and the dark ones stay thin and
         keep their depth. Measured: this clears 22 failures down to 7. */
      const BRIGHT_PALS = { mono:1, arctic:1, paper:1, coral:1, ocean:1, emerald:1, gold:1 };
      const scrim = BRIGHT_PALS[pal] ? 0.48 : 0.32;
      window.BG_MANIFEST.push({ file:id + '.jpg', category:cat, template:label, scene:D.scene, mood:MOOD[pal], note:'pre-blurred / heavy bokeh, no text, no logos, 2160×2160 JPG q85' });
      const layers = LAYOUTS[lay](P, T, C);
      /* ── house pass: depth and print grain stay, decoration goes ────────
         What was here before ("agency pass") gave every designer template an
         outline stroke on the hero word, a hard offset sticker shadow, and a
         14-spike starburst behind any price. Those are three of the most
         reliable amateur tells in the book: an outline is a substitute for
         real contrast, a hard offset shadow reads as a sticker peeling off
         the page, and a starburst is 1990s clearance-rack retail. Removed.
         The hero now separates from the photograph the way print does it,
         with one soft neutral shadow and nothing else. */
      layers.unshift({ kind:'vignette', name:'Vignette', props:{ strength: P.paper ? 0.22 : 0.34 } });
      layers.push({ kind:'grain', name:'Grain', props:{ opacity: 0.09 } });
      const GLASS_LAYOUTS = ['reviewProof', 'trustSeal', 'stepsFlow'];
      const hero = GLASS_LAYOUTS.includes(lay) ? null : layers
        .filter(x => (x.kind === 'text' || (!x.kind && x.text)) && x.props && x.props.fontSize >= 90 && !x.curve)
        .sort((a, b) => b.props.fontSize - a.props.fontSize)[0];
      /* The corner check roundel: an 88px filled disc with a tick dropped into
         the top-right, at the same coordinates on 46 of 153 templates. It is
         decoration wearing the costume of a trust mark, and it carries no
         information at all. The library already has three layouts that make a
         real trust claim (review, seal, steps) and say something specific.
         Removing the disc gives the corner back as space, which every one of
         these compositions is better for. */
      for (let i = layers.length - 1; i >= 0; i--){
        if (/^Check(\s+Circle)?$/.test(layers[i].name || '')) layers.splice(i, 1);
      }
      // A hero with no separation of its own gets the house one.
      if (hero && !hero.props.shadow) separate(hero.props, P);
      houseType(layers, P);
      snapColumns(layers);
      // Long money-words used to be shrunk here by character count. That is
      // now done by measurement in fitToDoc() at render time, where the fonts
      // are actually loaded. Shrinking twice would only make type smaller than
      // it needs to be, so this pass is deliberately gone.
      TEMPLATES.push({
        id, name:label, tag:'designer', cat, tier:'premium', feat:!!feat,
        bg:{ type:'image', src:file, scrim, fallback:{ type:'grad', c1:P.bg1, c2:P.bg2, a:135 } },
        layers,
      });
    });
  });

  /* ══ STREET FAMILY ═══════════════════════════════════════════════════════
     A second library alongside the clean one, built to the user's reference
     folder rather than to Swiss poster theory. Four structures × eight
     categories = 32.

     Three things make it street and not clean, and each is evidenced:
       1. PALE GROUND. The same photo as the clean family, washed out with a
          WHITE scrim instead of sunk under a black one. Their own A/B is
          unambiguous: pale grounds landed in "good", busy and saturated
          grounds landed in "mid".
       2. OUTLINED TYPE + HARD SHADOW. houseType() strips both from the clean
          family; street templates skip it entirely. On a pale ground the white
          outline plus a hard dark offset is what separates the word — not the
          fill-versus-ground contrast the audit measures, so street is expected
          to score badly there and that is not a defect.
       3. A CUT-OUT PRODUCT as the subject, which is the one structural thing
          every single "good" reference had and the clean family has none of. */
  /* ── MEASURED COLOUR CORRECTIONS ─────────────────────────────────────────
     Not a repaint. Every money word was measured against the ACTUAL pixels
     behind it — glyph-masked, so a knockout on a plate is judged on the plate
     and not on whatever its bounding box overruns into — and 142 of 146 are
     fine. These four were not: the ink and its ground sat in the 25-70 degree
     HUE DISCORD zone (too far apart to read as one family, too near to read
     as deliberate opposition) AND cleared under 3:1 luminance contrast.

     Each replacement comes from the hue vocabulary the user's own GOOD
     references actually use, must beat the original on contrast, and is
     rejected if it would introduce a fresh discord. Everything else keeps its
     identity — colour theory is not a licence to repaint 165 ads.
     Re-derive with the sampler documented in DESIGN-LAW.md if backdrops change. */
  const COLOUR_FIX = {
    dl_gold_diagonalRush_crimson:   ['Headline 2', '#ffffff', 'red on gold, 35deg discord, 1.66:1 -> 6.90:1'],
    dl_sports_voltStack_crimson:    ['Headline 2', '#ffffff', 'red on warm brown, 40deg discord, 1.53:1 -> 6.37:1'],
    dl_coins_voltStack_royal:       ['Headline 2', '#ffffff', 'gold on gold coins, 2.26:1 -> 6.78:1'],
    dl_pokemon_checklistHero_royal: ['Headline 2', '#c7f04a', 'gold on warm amber, 30deg discord, 2.62:1 -> 5.98:1'],
    // second pass, after the warm/street repaint changed several grounds
    dl_strips_agencyGrid_arctic:    ['Headline 2', '#ffffff', 'blue on pale clinical ground, 1.05:1 -> 4.96:1'],
    dl_silver_trustSeal_mono:       ['Headline 2', '#ffffff', 'near-white on silver, 3.66:1 -> 4.46:1'],
    st_strips_speccheck:            ['Headline 2', '#c7f04a', 'cyan on cyan-ish ground, 2.53:1 -> 4.43:1 at dE 96'],
    /* Third pass. Measured PER-PIXEL with each layer's own shadow modelled —
       the mean-ground method was over-reporting on photographic grounds and
       stripping the shadow was over-reporting again. These survived both
       corrections AND a visual check. */
    top_buyer:                      ['Title',      '#ffffff', 'gold on orange brick, ~99% of ink under 2.2:1'],
    icloud_ok:                      [['Title', '#ffffff', 'green on a green-tinted photo'],
                                     ['Check', '#ffffff', 'same green tick, 100% of ink under 2.2:1']],
    sports_ticket:                  [['Headline 2', '#1a1714', 'pale gold on a cream panel'],
                                     ['Kicker',     '#f4efe4', 'sits on the DARK navy stub, not the cream panel']],
    dl_sports_glassCard_mono:       ['Headline 2', '#ffffff', 'grey on grey glass'],
  };
  /* Accepts either a single [layer, hex, why] or a list of them, because some
     templates have two layers that fail together (a title and its tick mark,
     a kicker and its headline). */
  function applyColourFix(id, layers){
    const fix = COLOUR_FIX[id];
    if (!fix) return;
    const list = Array.isArray(fix[0]) ? fix : [fix];
    list.forEach(f => {
      const L = layers.find(l => l.name === f[0]);
      if (!L || !L.props) return;
      delete L.props.grad;        // most of these were gradient words; flatten
      L.props.fill = f[1];
    });
  }

  const STREET_DECK = {
    phones:  { h1:'CASH FOR', h2:'IPHONES',  kicker:'PAYING UP TO', price:'$1,100', cta:'TEXT US NOW',
               badges:['ANY CONDITION','ANY CARRIER'], sub:'IPAD IPHONE MACBOOK BUYER',
               points:['CRACKED SCREEN',"WON'T TURN ON",'ICLOUD LOCKED','ANY OTHER ISSUE'], subs:['Paid in cash, same day','iCloud locked is fine','Text photos for an offer'] },
    gold:    { h1:'CASH FOR', h2:'GOLD',     kicker:'PAYING UP TO', price:'95%',    cta:'GET A FREE QUOTE',
               badges:['ANY KARAT','ANY CONDITION'], sub:'CHAINS RINGS COINS DENTAL',
               points:['BROKEN JEWELRY','SINGLE EARRINGS','DENTAL GOLD','ANY KARAT'], subs:['Tested and weighed in front of you','Broken pieces welcome','Paid on the spot'] },
    silver:  { h1:'WE BUY',   h2:'SILVER',   kicker:'PAYING OVER',  price:'SPOT',   cta:'BRING IT IN TODAY',
               badges:['ANY QUANTITY','WEIGHED IN FRONT OF YOU'], sub:'FLATWARE BARS COINS ROUNDS',
               points:['STERLING FLATWARE','BARS & ROUNDS','90% COINS','TARNISHED IS FINE'], subs:['Scale on the counter, you watch','Tarnish does not matter','No lowball offers'] },
    coins:   { h1:'WE BUY',   h2:'COINS',    kicker:'PAYING UP TO', price:'95%',    cta:'TEXT PHOTOS FOR OFFER',
               badges:['SINGLES OR COLLECTIONS','HONEST GRADING'], sub:'MORGANS EAGLES PROOF SETS',
               points:['WHOLE COLLECTIONS','GRADED OR RAW','SILVER DOLLARS','HOUSE CALLS'], subs:['Singles or whole collections','Graded or raw, both fine','House calls for estates'] },
    cars:    { h1:'WE BUY',   h2:'CARS',     kicker:'PAYING UP TO', price:'$15,000',cta:'CALL FOR INSTANT OFFER',
               badges:['RUNNING OR NOT','FREE TOW'], sub:'SAME DAY PICKUP CASH IN HAND',
               points:['RUNNING OR NOT','NO SMOG NEEDED','FREE TOWING','SAME DAY PICKUP'], subs:['Free tow, we come to you','Title in hand or not','Same day pickup'] },
    strips:  { h1:'CASH FOR', h2:'STRIPS',   kicker:'PAYING UP TO', price:'$100',   cta:'TEXT A PHOTO NOW',
               badges:['SEALED BOXES ONLY','NOT EXPIRED'], sub:'TEST STRIPS LANCETS CGM',
               points:['UNEXPIRED ONLY','SEALED BOXES','ALL MAJOR BRANDS','MAIL IN WELCOME'], subs:['Sealed and unexpired only','All the major brands','Mail in kits available'] },
    pokemon: { h1:'WE BUY',   h2:'POKEMON',  kicker:'PAYING UP TO', price:'90%',    cta:'DM TO SELL TODAY',
               badges:['SEALED OR SINGLES','GRADED OR RAW'], sub:'BOOSTER BOXES SLABS BINDERS',
               points:['SEALED PRODUCT','GRADED SLABS','VINTAGE SETS','WHOLE COLLECTIONS'], subs:['Sealed product or singles','Graded slabs welcome','Real market pricing'] },
    sports:  { h1:'WE BUY',   h2:'CARDS',    kicker:'PAYING UP TO', price:'90%',    cta:'TEXT YOUR HITS',
               badges:['ROOKIES SLABS WAX','FAIR COMP PRICING'], sub:'ROOKIES SLABS WAX VINTAGE',
               points:['GRADED SLABS','ROOKIE AUTOS','SEALED WAX','WHOLE COLLECTIONS'], subs:['Rookies, autos and wax','Graded or raw','Priced off real comps'] },
  };
  // [layout, palette, label, cutout]
  /* Ten architectures, dealt so no category repeats a structure and every
     structure appears across the library. Five per category rather than four:
     the point of the second pass was that four names were only two shapes. */
  const STREET_FACE = {
    st_phones_cashfor: 'Clash Display',
    st_phones_icongrid: 'Satoshi',
    st_phones_speccheck: 'Khand',
    st_phones_pricebadge: 'Melodrama',
    st_phones_splitcol: 'Clash Display',
    st_gold_ribbon: 'Melodrama',
    st_gold_cutouthero: 'Zodiak',
    st_gold_twocol: 'Khand',
    st_gold_topstrip: 'Melodrama',
    st_gold_pricetag: 'Zodiak',
    st_silver_topstrip: 'Clash Display',
    st_silver_cutouthero: 'Satoshi',
    st_silver_speccheck: 'Khand',
    st_silver_icongrid: 'Clash Display',
    st_silver_pricetag: 'Melodrama',
    st_coins_twocol: 'Melodrama',
    st_coins_ribbon: 'Zodiak',
    st_coins_splitcol: 'Melodrama',
    st_coins_pricebadge: 'Zodiak',
    st_coins_cashfor: 'Khand',
    st_cars_pricebadge: 'Clash Display',
    st_cars_cutouthero: 'Khand',
    st_cars_topstrip: 'Satoshi',
    st_cars_twocol: 'Clash Display',
    st_cars_cashfor: 'Khand',
    st_strips_icongrid: 'Satoshi',
    st_strips_ribbon: 'Clash Display',
    st_strips_speccheck: 'Khand',
    st_strips_splitcol: 'Satoshi',
    st_strips_pricetag: 'Clash Display',
    st_pokemon_ribbon: 'Clash Display',
    st_pokemon_twocol: 'Khand',
    st_pokemon_icongrid: 'Satoshi',
    st_pokemon_pricebadge: 'Melodrama',
    st_pokemon_cutouthero: 'Clash Display',
    st_sports_splitcol: 'Clash Display',
    st_sports_cutouthero: 'Zodiak',
    st_sports_twocol: 'Khand',
    st_sports_topstrip: 'Melodrama',
    st_sports_pricetag: 'Satoshi',
  };
  const STREET_BOOK = {
    phones:  [['streetCashFor','volt','Street Cash','iphones-trio'], ['streetIconGrid','ocean','Device Grid','iphones-cash'],
              ['streetSpecCheck','crimson','Street Broken','iphone-cracked'], ['streetPriceBadge','sunset','Payout Badge','iphone-front'],
              ['streetSplitCol','emerald','Split Buyer','iphones-trio']],
    gold:    [['streetRibbon','gold','Gold Ribbon','gold-chains'], ['streetCutoutHero','coral','Gold Lineup','gold-bars'],
              ['streetTwoCol','royal','Gold Checklist','gold-jewelry'], ['streetTopStrip','gold','Gold Strip','gold-chains'],
              ['streetPriceTag','crimson','Gold Payout','cash-bundles']],
    silver:  [['streetTopStrip','arctic','Silver Strip','silver-bars'], ['streetCutoutHero','ocean','Silver Lineup','silver-flatware'],
              ['streetSpecCheck','ocean','Silver Checklist','coin-stack'], ['streetIconGrid','emerald','Silver Grid','silver-bars'],
              ['streetPriceTag','emerald','Silver Payout','cash-stack']],
    coins:   [['streetTwoCol','gold','Coin Checklist','coin-stack'], ['streetRibbon','royal','Coin Ribbon','coin-slab'],
              ['streetSplitCol','gold','Coin Split','gold-bars'], ['streetPriceBadge','crimson','Coin Payout','cash-fan'],
              ['streetCashFor','coral','Coin Street','coin-stack']],
    cars:    [['streetPriceBadge','crimson','Car Payout','car-front'], ['streetCutoutHero','sunset','Car Lineup','car-keys'],
              ['streetTopStrip','ocean','Car Strip','car-front'], ['streetTwoCol','emerald','Car Checklist','car-keys'],
              ['streetCashFor','volt','Car Street','car-front']],
    strips:  [['streetIconGrid','emerald','Strip Grid','strip-boxes'], ['streetRibbon','arctic','Strip Ribbon','strip-kit'],
              ['streetSpecCheck','ocean','Strip Checklist','strip-boxes'], ['streetSplitCol','volt','Strip Split','strip-kit'],
              ['streetPriceTag','volt','Strip Payout','cash-stack']],
    pokemon: [['streetRibbon','royal','Poke Ribbon','poke-booster'], ['streetTwoCol','volt','Poke Checklist','poke-slab'],
              ['streetIconGrid','crimson','Poke Grid','poke-cards-fan'], ['streetPriceBadge','ocean','Poke Payout','poke-slab'],
              ['streetCutoutHero','sunset','Poke Lineup','poke-booster']],
    sports:  [['streetSplitCol','crimson','Card Split','sports-cards'], ['streetCutoutHero','emerald','Card Lineup','sports-slab'],
              ['streetTwoCol','crimson','Card Checklist','sports-cards'], ['streetTopStrip','royal','Card Strip','sports-slab'],
              ['streetPriceTag','royal','Card Payout','cash-bundles']],
  };;
  Object.keys(STREET_BOOK).forEach(cat => {
    const D = Object.assign({}, DECKS[cat], STREET_DECK[cat]);
    // borrow the category's first designer backdrop rather than generating 32 more
    const borrow = BOOK[cat] && BOOK[cat][0];
    const bgSrc = borrow ? 'assets/bg/dl_' + cat + '_' + borrow[0] + '_' + borrow[1] + '.jpg' : null;
    STREET_BOOK[cat].forEach(([lay, pal, label, cutName], i) => {
      const stId = 'st_' + cat + '_' + lay.replace('street', '').toLowerCase();
      const P = PAL[pal], T = { d: STREET_FACE[stId] || 'Clash Display', s:'Satoshi' };
      const C = Object.assign({}, D, { cut:cutName });
      const layers = LAYOUTS[lay](P, T, C);
      snapColumns(layers);              // alignment still applies; houseType deliberately does not
      TEMPLATES.push({
        id: stId,
        name: label, tag:'street', cat, tier:'premium', feat: i === 0,
        bg: bgSrc
          ? { type:'image', src:bgSrc, scrim:0.46, blur:0.014,
              fallback:{ type:'grad', c1:P.bg1, c2:P.bg2, a:135 } }
          : { type:'grad', c1:P.bg1, c2:P.bg2, a:135 },
        layers,
      });
    });
  });

  // Runs after BOTH libraries are built: COLOUR_FIX is a const declared below
  // the designer loop, so calling it from inside that loop would hit the
  // temporal dead zone. It only sets a fill, so order is otherwise irrelevant.
  TEMPLATES.forEach(t => applyColourFix(t.id, t.layers));
})();

// traits: per-template, per-layer canonical styling, this is what Enhance restores
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
    // every template ships its OWN photo (see assets/bg/MANIFEST.md), use it
    // for real when it's loaded; the designed gradient is the graceful fallback
    const bgi = freshBgImage(bg.src, bg.blur, bg.grade);
    if (bgi){
      removeBgRect(cv);
      cv.setBackgroundColor('#101014', () => {});
      cv.setBackgroundImage(coverImage(bgi, CW, CH), () => cv.renderAll());
      let s = (cv.getObjects ? cv.getObjects() : []).find(o => o.pgScrim);
      if (bg.scrim){
        if (!s){ s = scrimRect(bg.scrim, CW, CH, bg.scrimColor, bg.scrimMode); s.pgScrim = true; cv.add(s); }
        else s.set({ left:0, top:0, width:CW, height:CH, fill:(bg.scrimColor === '#ffffff' ? 'rgba(255,255,255,' : 'rgba(0,0,0,') + bg.scrim + ')' });
        if (cv.sendToBack) cv.sendToBack(s);
      } else if (s) cv.remove(s);
      cv.renderAll();
      return;
    }
    return applyBgSpec(cv, bg.fallback || { type:'solid', c:'#101014' });
  }
  if (cv.setBackgroundImage && cv.backgroundImage) cv.setBackgroundImage(null, () => {});
  const oldScrim = (cv.getObjects ? cv.getObjects() : []).find(o => o.pgScrim);
  if (oldScrim) cv.remove(oldScrim);
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
  // icons scale on the SHORT axis like type, so a mark never stretches oval
  if (l.kind === 'path'){
    const s0 = p.size || 100, cx = (p.left || 0) + s0 / 2, cy = (p.top || 0) + s0 / 2, s1 = s0 * u;
    p.size = s1; p.left = cx * sx - s1 / 2; p.top = cy * sy - s1 / 2;
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
let _grainTile = null;
function grainTile(){
  if (_grainTile) return _grainTile;
  const s = 384, cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const x = cv.getContext('2d');
  const d = x.createImageData(s, s);
  for (let i = 0; i < d.data.length; i += 4){
    const v = (118 + Math.random() * 76) | 0;
    d.data[i] = d.data[i+1] = d.data[i+2] = v;
    d.data[i+3] = 255;
  }
  x.putImageData(d, 0, 0);
  _grainTile = cv;
  return cv;
}
/* Headlines are authored against a roughly six-glyph money word. A longer one
   ran straight off the board: "POKÉMON" in slabPoster measured 1423px on a
   1080 canvas and published as "OKÉMO", cut off at BOTH edges.

   The old guard shrank by CHARACTER COUNT, and only past 7 characters, which
   is the wrong unit twice over: POKÉMON is exactly 7 so it never fired at all,
   and a wide display face overflows at fewer glyphs than a condensed one
   regardless of count.

   So measure the real rendered box. This has to happen HERE, at render time,
   and not at library-build time, because at build time the webfonts have not
   loaded yet and every measurement is a lie — the same glyph-cache trap that
   clipped text tails once before.

   Pass `p` when building from a spec; pass null to fit a live canvas object
   (Enhance restores the AUTHORED size from TRAITS, which would otherwise put
   "OKÉMO" straight back on screen in the advanced editor). */
function fitToDoc(obj, p, docW){
  if (!obj || !obj.width) return;
  const fs      = (p && p.fontSize) !== undefined ? p.fontSize : obj.fontSize;
  const left    = (p && p.left)     !== undefined ? p.left     : obj.left;
  const originX = (p && p.originX)  !== undefined ? p.originX  : obj.originX;
  if (!fs || left === undefined) return;
  const margin = Math.round(docW * 0.035);
  // How much room the anchor actually leaves, which depends on the origin.
  const room = originX === 'center' ? (Math.min(left, docW - left) - margin) * 2
             : originX === 'right'  ? left - margin
             :                        docW - left - margin;
  if (room <= 0 || obj.width <= room) return;
  obj.set('fontSize', Math.max(8, Math.floor(fs * (room / obj.width))));
  if (obj.initDimensions) obj.initDimensions();
  if (obj.setCoords) obj.setCoords();
}
/* OPTICAL LEFT ALIGNMENT.
   A glyph does not start at its own origin: every face leaves a left side
   bearing, and it scales with type size. So a 28px kicker and a 148px headline
   set to the same x have INK that starts several px apart, and the column
   reads crooked even though the numbers match.

   The layouts used to compensate by hand — agencyGrid authored its headline at
   64 and its kicker at 70 to cancel Oswald's bearing. Those constants were
   tuned to typefaces the library no longer uses, so after the Fontshare switch
   they over-corrected: measured ink was 4px out on agencyGrid and 3px out the
   other way on checklistHero.

   Measuring the bearing is the fix that cannot go stale. `left` now means
   "where the INK starts", for every face and every size. */
let _bearingCtx = null;
function opticalLeftShift(obj){
  if (!obj || obj.originX === 'center' || obj.originX === 'right') return 0;
  const txt = String(obj.text || '');
  if (!txt) return 0;
  try {
    if (!_bearingCtx) _bearingCtx = document.createElement('canvas').getContext('2d');
    const style = (obj.fontStyle && obj.fontStyle !== 'normal') ? obj.fontStyle + ' ' : '';
    _bearingCtx.font = style + (obj.fontWeight || 400) + ' ' + (obj.fontSize || 40) + 'px "' + (obj.fontFamily || 'sans-serif') + '"';
    const m = _bearingCtx.measureText(txt.split('\n')[0]);
    if (!m || typeof m.actualBoundingBoxLeft !== 'number') return 0;
    // ink starts this far right of the origin; pull the box back by the same
    const bearing = -m.actualBoundingBoxLeft;
    return (isFinite(bearing) && Math.abs(bearing) < (obj.fontSize || 40)) ? bearing : 0;
  } catch (e){ return 0; }
}
/* ═══════════════ ALIGNMENT PASS ═══════════════
   Runs on the BUILT objects, not the authored spec, because both halves of the
   sum are measured: a text's real width only exists once the face has loaded,
   and Easy mode lets the visitor retype the copy. A baked offset table (the
   COLOUR_FIX pattern) would be correct for the shipped words and wrong the
   moment somebody types a longer headline.

   Two corrections, both deliberately narrow:

   1. CENTRE A LONE TEXT ON ITS BACKING. Only when a discrete box holds exactly
      one text. A box holding several — a step card with its number, label and
      description — is a left-aligned row and centring it would be a
      regression, so those are left alone. Measured across the library this
      caught a review pill whose stars sat 177px left of centre, and ~80 chips,
      plates and bands sitting 5-16px low.

   2. PULL TEXT OFF THE CANVAS EDGE. A 104px phone number ending 9px from the
      bottom is the single worst thing here — every social crop clips it.
      Marquee strips are edge-hugging BY DESIGN and are exempt. */
const SAFE_EDGE = 24;
function alignPass(sc, W, H){
  W = W || TPL_W; H = H || TPL_H;
  let objs;
  try { objs = sc.getObjects(); } catch (e){ return; }
  const isText = o => o && (o.type === 'i-text' || o.type === 'text' || o.type === 'textbox');
  const bb = o => { try { o.setCoords(); return o.getBoundingRect(true, true); } catch (e){ return null; } };

  const boxes = objs.filter(o => o && o.type === 'rect')
    .map(o => ({ o, b: bb(o) }))
    .filter(x => x.b && x.b.width > 0 && x.b.width < W * 0.94 && x.b.height < H * 0.5);
  const texts = objs.filter(isText).map(o => ({ o, b: bb(o) })).filter(x => x.b && x.b.width > 0);

  if (boxes.length && texts.length){
    const host = new Map(), tally = new Map();
    const cx = b => b.left + b.width / 2, cy = b => b.top + b.height / 2;
    /* Occupancy is counted by CENTRE-INSIDE, not full containment. A CTA label
       set slightly wider than its own card overflows it, so a strict test read
       the card as holding only the phone number — which then got centred on top
       of the label. Centre-inside counts both, and the card is left alone. */
    texts.forEach(t => {
      boxes.forEach(r => {
        if (cx(t.b) >= r.b.left && cx(t.b) <= r.b.left + r.b.width &&
            cy(t.b) >= r.b.top  && cy(t.b) <= r.b.top  + r.b.height)
          tally.set(r.o, (tally.get(r.o) || 0) + 1);
      });
      const h = boxes.filter(r =>
        t.b.left >= r.b.left - 6 && t.b.top >= r.b.top - 6 &&
        t.b.left + t.b.width  <= r.b.left + r.b.width  + 6 &&
        t.b.top  + t.b.height <= r.b.top  + r.b.height + 6)
        .sort((a, c) => a.b.width * a.b.height - c.b.width * c.b.height)[0];
      if (h) host.set(t, h);
    });
    const hits = (b, skip) => texts.some(u => u !== skip && u.b &&
      b.left < u.b.left + u.b.width && b.left + b.width > u.b.left &&
      b.top  < u.b.top  + u.b.height && b.top  + b.height > u.b.top);
    host.forEach((h, t) => {
      if (tally.get(h.o) !== 1) return;                 // shared box → a row, leave it
      const dx = (h.b.left + h.b.width  / 2) - (t.b.left + t.b.width  / 2);
      const dy = (h.b.top  + h.b.height / 2) - (t.b.top  + t.b.height / 2);
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
      const before = { left: t.o.left, top: t.o.top }, wasClear = !hits(t.b, t);
      t.o.set({ left: t.o.left + dx, top: t.o.top + dy });
      t.o.setCoords();
      const after = bb(t.o);
      // never let a centring nudge push type onto other type
      if (after && wasClear && hits(after, t)){
        t.o.set(before); t.o.setCoords();
        return;
      }
      t.b = after || t.b;
    });
  }

  /* ── 3. PULL COLLIDING TEXT APART ────────────────────────────────────────
     Measured 89 real collisions across 63 templates — a sub-line sitting almost
     entirely inside its own headline, a website inside the phone number. Two
     stacked lines whose boxes merely kiss are normal and are left alone; the
     test is overlap as a share of the SMALLER box, so a 5px touch between two
     headline lines does not trigger and a 60px swallow does.
     Resolved top-down, pushing the lower element down, so one nudge cascades
     correctly into whatever sits beneath it instead of creating a new clash.
     Never pushes past the safe area — if there is no room the overlap stays and
     the edge clamp below wins, because type outside the frame is worse. */
  const stack = texts.filter(t => !/marquee|ticker/i.test(t.o.name || ''))
    .map(t => ({ t, b: bb(t.o) })).filter(x => x.b && x.b.height > 0)
    .sort((a, c) => a.b.top - c.b.top);
  for (let pass = 0; pass < 2; pass++){
    for (let i = 0; i < stack.length; i++){
      for (let j = i + 1; j < stack.length; j++){
        const a = stack[i], c = stack[j];
        const ox = Math.min(a.b.left + a.b.width,  c.b.left + c.b.width)  - Math.max(a.b.left, c.b.left);
        const oy = Math.min(a.b.top  + a.b.height, c.b.top  + c.b.height) - Math.max(a.b.top,  c.b.top);
        if (ox <= 2 || oy <= 2) continue;
        const smaller = Math.min(a.b.width * a.b.height, c.b.width * c.b.height);
        if ((ox * oy) / smaller <= 0.18) continue;        // a kiss, not a collision
        const need = (a.b.top + a.b.height + 6) - c.b.top;
        if (need <= 0) continue;
        const room = (H - SAFE_EDGE) - (c.b.top + c.b.height);
        const shift = Math.min(need, Math.max(0, room));
        if (shift <= 0) continue;
        c.t.o.set('top', c.t.o.top + shift);
        c.t.o.setCoords();
        c.b = bb(c.t.o) || c.b;
      }
    }
  }

  texts.forEach(t => {
    if (/marquee|ticker/i.test(t.o.name || '')) return;  // edge-hugging on purpose
    const b = bb(t.o); if (!b) return;
    let dx = 0, dy = 0;
    if (b.left < SAFE_EDGE) dx = SAFE_EDGE - b.left;
    else if (b.left + b.width > W - SAFE_EDGE) dx = (W - SAFE_EDGE) - (b.left + b.width);
    if (b.top < SAFE_EDGE) dy = SAFE_EDGE - b.top;
    else if (b.top + b.height > H - SAFE_EDGE) dy = (H - SAFE_EDGE) - (b.top + b.height);
    if (b.width  > W - SAFE_EDGE * 2) dx = 0;            // wider than the safe box: leave centred
    if (b.height > H - SAFE_EDGE * 2) dy = 0;
    if (dx || dy){ t.o.set({ left: t.o.left + dx, top: t.o.top + dy }); t.o.setCoords(); }
  });
}
function buildLayer(l, tplId, dw, dh){
  const p = mapSpecToDoc(l, Object.assign({}, l.props), dw || TPL_W, dh || TPL_H);
  const gradSpec = p.grad; delete p.grad;          // {c1,c2,a}, gradient fill, applied below
  // curved text straight from a template spec (left/top = arc CENTER)
  if (l.curve && (l.kind === 'text' || !l.kind)){
    const style = {};
    ['fontFamily','fontSize','fill','stroke','strokeWidth','fontWeight','fontStyle','charSpacing'].forEach(k => { if (p[k] !== undefined) style[k] = p[k]; });
    if (p.shadow) style.shadow = p.shadow;
    if (gradSpec) style.fill = objGrad(gradSpec);
    const pos = { left:p.left, top:p.top, angle:p.angle || 0 };
    const meta = { name:l.name, pgRole:l.role || '', pgCasing:l.casing || 'none', pgTplId:tplId, pos };
    let grp = buildCurvedGroup(l.text, l.curve, style, meta);
    // Curved text arcs outward, so it overflows sooner than its glyph count
    // suggests: the emerald wave line measured 1354px on a 1080 board. Same
    // measure-and-fit rule as straight text, but it has to rebuild the group
    // because the arc geometry is baked in at construction.
    const docW = dw || TPL_W, margin = Math.round(docW * 0.035);
    for (let pass = 0; pass < 2 && grp.width > docW - margin * 2; pass++){
      style.fontSize = Math.max(8, Math.floor((style.fontSize || 40) * ((docW - margin * 2) / grp.width)));
      grp = buildCurvedGroup(l.text, l.curve, style, meta);
    }
    if (gradSpec) grp.pgFillGrad = gradSpec;
    return grp;
  }
  if (p.shadow) p.shadow = new fabric.Shadow(p.shadow);
  // ── agency deco kinds ──
  if (l.kind === 'vignette'){
    const w = dw || TPL_W, h = dh || TPL_H;
    const r = new fabric.Rect({ left:0, top:0, width:w, height:h, selectable:false, evented:false });
    r.set('fill', new fabric.Gradient({
      type:'radial', gradientUnits:'pixels',
      coords:{ x1:w/2, y1:h/2, r1:Math.min(w,h)*0.38, x2:w/2, y2:h/2, r2:Math.max(w,h)*0.8 },
      colorStops:[ {offset:0, color:'rgba(0,0,0,0)'}, {offset:1, color:'rgba(0,0,0,' + (l.props.strength || 0.34) + ')'} ],
    }));
    r.set({ name:l.name||'Vignette', pgRole:'deco', pgTplId:tplId, pgLocked:true });
    return r;
  }
  /* CUTOUT — a transparent-PNG product sitting ON the artwork rather than a
     photo behind it. Every "good design" reference the user supplied is built
     this way: a cut-out phone, cash stack or graded slab as the subject. A
     blurred backdrop with type over it is the pattern their "mid" and "bad"
     piles are full of. Sized by target width so one asset serves any layout. */
  if (l.kind === 'cutout'){
    const el = CUTOUT_ELS[l.props.src];
    if (!el || !el.width){
      // not decoded yet (or missing): occupy nothing rather than break the render
      return new fabric.Rect({ left:-9999, top:-9999, width:1, height:1, opacity:0,
        selectable:false, evented:false, name:l.name || 'Product', pgTplId:tplId });
    }
    const u = (dw || TPL_W) / TPL_W;
    const img = new fabric.Image(el);
    const s = ((l.props.w || 420) * u) / el.width;
    img.set({
      left:p.left, top:p.top,
      originX:p.originX || 'left', originY:p.originY || 'top',
      scaleX:s, scaleY:s, angle:p.angle || 0,
      opacity:p.opacity !== undefined ? p.opacity : 1,
    });
    if (p.shadow) img.set('shadow', p.shadow);
    img.set({ name:l.name || 'Product', pgRole:l.role || 'photo', pgTplId:tplId });
    return img;
  }
  if (l.kind === 'grain'){
    const w = dw || TPL_W, h = dh || TPL_H;
    const tile = grainTile();
    const img = new fabric.Image(tile, { left:0, top:0, selectable:false, evented:false,
      opacity: l.props.opacity !== undefined ? l.props.opacity : 0.09,
      globalCompositeOperation: 'overlay' });
    img.scaleX = w / tile.width; img.scaleY = h / tile.height;
    img.set({ name:l.name||'Grain', pgRole:'deco', pgTplId:tplId, pgLocked:true });
    return img;
  }
  if (l.kind === 'star'){
    const spikes = l.props.spikes || 12;
    const outer = l.props.outer || 120;
    const inner = l.props.inner || Math.round(outer * 0.66);
    const pts = [];
    for (let i = 0; i < spikes * 2; i++){
      const rr = i % 2 === 0 ? outer : inner;
      const a = (Math.PI * i) / spikes - Math.PI / 2;
      pts.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr });
    }
    const poly = new fabric.Polygon(pts, { left:p.left, top:p.top, originX:'center', originY:'center',
      fill: p.fill || l.props.fill || '#ffd200', angle: p.angle || l.props.angle || 0, shadow: p.shadow,
      opacity: p.opacity !== undefined ? p.opacity : 1 });
    poly.set({ name:l.name||'Burst', pgRole:'deco', pgCasing:'none', pgTplId:tplId });
    return poly;
  }
  let obj;
  if (l.kind === 'rect'){
    // color blocks go glassy (45%) so background photos stay visible;
    // stroke-only frames, rgba fills, and layers marked solid:true pass
    // through as designed (bands, CTA cards, seals need full-strength ink)
    if (!l.solid && typeof p.fill === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(p.fill)) p.fill = hexToRgba(p.fill, 0.45);
    obj = new fabric.Rect(p);
  }
  else if (l.kind === 'circle') obj = new fabric.Circle(p);
  else if (l.kind === 'path'){
    /* Authored in a 100-unit box; props.size is the rendered edge in doc units.
       The marks are OUTLINES, so props.fill is read as the mark's colour and
       becomes the stroke — callers should not have to know the difference.
       strokeWidth is deliberately left to scale with the path so a large mark
       gets a proportionally heavier line, which is how a real icon set behaves
       (strokeUniform would make big marks look spindly). */
    const ic = ICONS[l.icon] || ICONS.sparkle;
    const size = p.size || 100, q = Object.assign({}, p);
    const ink = q.stroke || q.fill || '#ffffff';
    delete q.size; delete q.fill;
    obj = new fabric.Path(ic.d, Object.assign(q, {
      scaleX: size / 100, scaleY: size / 100,
      /* One weight at every size. An earlier version thickened the stroke for
         small marks on the theory they looked spindly; at 40px it did the
         opposite — the heavier line closed up the ring's gap and the seal's
         tick into a smudge. Interior detail, not stroke weight, is what limits
         how small one of these can go, which is why the checklist marks below
         are given the whole badge footprint instead of being nested inside it. */
      fill: null, stroke: ink, strokeWidth: ic.sw || ICON_SW,
      strokeLineCap: 'round', strokeLineJoin: 'round',
      originX: 'left', originY: 'top', objectCaching: false
    }));
  }
  else if (l.kind === 'textbox') obj = new fabric.Textbox(l.text, Object.assign({paintFirst:'stroke'}, p));
  else {
    obj = new fabric.IText(l.text, Object.assign({paintFirst:'stroke'}, p));
    fitToDoc(obj, p, dw || TPL_W);
    // after any size change, so the bearing is measured at the size that ships
    if (l.pgOptical !== false) obj.set('left', obj.left - opticalLeftShift(obj));
  }
  if (gradSpec){ obj.set('fill', objGrad(gradSpec)); obj.pgFillGrad = gradSpec; }
  obj.set({ name:l.name, pgRole:l.role||'', pgCasing:l.casing||'none', pgTplId:tplId });
  return obj;
}

// ---------- thumbnail engine: renders REAL previews from the actual specs ----------
const THUMBS = {};
function renderThumb(tpl, px){
  // thumbnails always preview the authored square template, whatever the live doc format
  const sc = new fabric.StaticCanvas(null, { width:TPL_W, height:TPL_H, renderOnAddRemove:false });
  const bgi = tpl.bg.type === 'image' ? freshBgImage(tpl.bg.src, tpl.bg.blur, tpl.bg.grade) : null;
  if (bgi){
    sc.setBackgroundImage(coverImage(bgi, TPL_W, TPL_H), () => {});
    if (tpl.bg.scrim) sc.add(scrimRect(tpl.bg.scrim, TPL_W, TPL_H, tpl.bg.scrimColor, tpl.bg.scrimMode));
  } else {
    sc.add(bgRectFor(tpl.bg.type === 'image' ? (tpl.bg.fallback || { type:'solid', c:'#101014' }) : tpl.bg, TPL_W, TPL_H));
  }
  tpl.layers.forEach(l => sc.add(buildLayer(l, tpl.id)));
  alignPass(sc, TPL_W, TPL_H);
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
    return thumbFallback(tpl, px || 320);       // shown, but not cached, retried next time
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
  // 150+ templates now: warm the cache progressively so first paint stays
  // instant, getThumb() still renders synchronously on demand for any card
  // that scrolls into view before its turn
  if (ensureThumbs._running) return;
  ensureThumbs._running = true;
  const step = () => {
    const batch = TEMPLATES.filter(t => !THUMBS[t.id]).slice(0, 6);
    if (!batch.length){ ensureThumbs._running = false; return; }
    batch.forEach(t => getThumb(t.id, 320));
    setTimeout(step, 60);
  };
  setTimeout(step, 0);
}
// every font family the template library paints with, loaded before thumbs render
function ensureTemplateFonts(){
  const fams = new Set();
  TEMPLATES.forEach(t => t.layers.forEach(l => { const f = l.props && l.props.fontFamily; if (f) fams.add(f); }));
  return Promise.race([
    Promise.all([...fams].map(f => ensureFont(f))),
    new Promise(res => setTimeout(res, 5000)),   // never hold the page hostage
  ]).then(() => {
    try { if (window.fabric && fabric.util && fabric.util.clearFabricFontCache) fabric.util.clearFabricFontCache(); } catch (e){}
  });
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
  // Hero fan, three real renders, chosen to be UNLIKE each other. The fan is
  // the shop window and three near-identical neon phone ads sold one look.
  // Restricted to templates that are free for everyone, because a hero card
  // that opens a paywall is a bad first click.
  /* The shop window must show the BEST work, not the safest. It was showing
     three of the oldest classic designs because those happened to be the
     free-for-everyone ones. Every phones template is free (see tplLocked), so
     the new street family qualifies and is far stronger — lead with it. */
  /* varietyOrder() spreads LAYOUT, which is the one difference you cannot see
     at 320px. Restricted to street+phones it returned three cards sharing a
     backdrop and the words CASH FOR IPHONES — the fan read as one ad printed
     three times. Pick on what is actually legible in a thumbnail instead:
     different photo, different headline, different category. Category range is
     also the pitch — this buys phones AND gold AND consoles. */
  /* The copy string lives on the LAYER (l.text), not in l.props — reading
     l.props.text returned '' for all 243, every card collided on '' === '',
     only one was ever picked and the fan silently fell back to the three
     oldest classics. That is the same shop-window regression as before, so:
     assert the fan is real before trusting it (see the console.warn below). */
  const heroKey = t => {
    const head = (t.layers || [])
      .filter(l => typeof l.text === 'string' && l.text.trim())
      .sort((a, b) => ((b.props && b.props.fontSize) || 0) - ((a.props && a.props.fontSize) || 0))[0];
    return {
      bg:   (t.bg && t.bg.src) || '',
      head: head ? head.text.trim().toUpperCase() : '',
      cat:  t.cat,
      fam:  tplDims(t).fam           // LAYOUT_FAMILY is a lookup table, not a fn
    };
  };
  /* The hero is a shop window onto REAL, clickable templates, so a card must be
     one a visitor can open and find finished: a declared photographic backdrop
     and enough elements to read as a complete ad. A sparse five-element stack
     enlarged to hero size is where "missing assets" comes from. */
  const DECO_K = /^(vignette|grain|noise|grid|bokeh|beams|spot|diag)$/;
  const complete = t => (t.layers || []).filter(l => !DECO_K.test(l.kind || '')).length >= 8;
  const usable = TEMPLATES.filter(t => t.bg && t.bg.type === 'image' && !tplLocked(t));
  const eligible = varietyOrder(usable.filter(complete).length >= 3
    ? usable.filter(complete) : usable);
  const pick = [];
  // two passes: insist on all four axes being distinct, then relax to photo +
  // headline only, so the fan always fills even if the library is narrow
  [4, 2].forEach(strict => eligible.forEach(t => {
    if (pick.length >= 3) return;
    const k = heroKey(t);
    const clash = pick.some(p => {
      const q = heroKey(p);
      return q.bg === k.bg || q.head === k.head ||
             (strict === 4 && (q.cat === k.cat || q.fam === k.fam));
    });
    if (!clash) pick.push(t);
  }));
  let fan = pick.slice(0, 3);
  if (fan.length < 3) console.warn('GraphicsStudio: hero fan picked only ' +
    fan.length + ' of 3 — falling back to classics, check heroKey/tplLocked.');
  /* ORDER BY STRENGTH, because the three slots are not equal: hc3 sits in
     front, unoccluded, and gets read first. Measured on the live fan, the slot
     was holding the DULLEST card — saturation 0.118 against 0.512 for the gold
     one buried behind it, and the fewest elements of the three. Score each
     rendered card for colour and richness and put the best in front.
     Cheap: three 96px renders, once, at boot. */
  if (fan.length === 3){
    /* Score from the template's DECLARED COLOUR, not from a render.
       The render version was correct in principle and useless in practice:
       preloadTplBgs() is async and buildLanding() runs immediately after it, so
       at scoring time zero backdrops had decoded and all three cards were
       measured on their fallback gradients — near-identical scores, arbitrary
       order. Re-sorting later would reshuffle the fan in front of the visitor.
       A template's own ink is available synchronously and is what actually
       separates a gold design from a silver one. Neutrals are skipped so a
       white headline does not read as "colourful", and each fill is weighted by
       the type size carrying it. */
    const strength = t => {
      let w = 0, sum = 0;
      (t.layers || []).forEach(l => {
        const f = l.props && l.props.fill;
        if (typeof f !== 'string' || !/^#[0-9a-f]{6}$/i.test(f)) return;
        const n = parseInt(f.slice(1), 16);
        const r = (n>>16)&255, g = (n>>8)&255, b2 = n&255;
        const mx = Math.max(r,g,b2), mn = Math.min(r,g,b2);
        const sat = mx ? (mx - mn) / mx : 0;
        if (sat < 0.18) return;                         // neutral: carries no hue
        const k = (l.props.fontSize || 40) + (l.props.width || 0) * 0.08;
        sum += sat * k; w += k;
      });
      return w ? sum / w * Math.log2(4 + w / 100) : 0;   // hue strength x how much of it
    };
    const scored = fan.map(t => ({ t, s: strength(t) })).sort((a, b) => a.s - b.s);
    fan = scored.map(x => x.t);          // weakest first -> strongest lands in hc3
  }
  const heroIds = fan.length === 3 ? fan.map(t => t.id) : ['sell_iphone','icloud_ok','top_buyer'];
  document.querySelectorAll('#hero-stack .hero-card').forEach((card, i) => {
    card.innerHTML = '';
    const img = new Image();
    img.src = getThumb(heroIds[i], 320);
    img.alt = TEMPLATES.find(t=>t.id===heroIds[i]).name + ' template preview';
    card.appendChild(img);
    card.style.cursor = 'pointer';
    card.onclick = () => showEasy(heroIds[i]);
  });
  /* Trigger the entrance once the cards actually have their artwork, not on
     DOMContentLoaded — animating empty frames in and filling them afterwards is
     what makes a hero look broken on a slow connection. Then mark it settled so
     the finished animation stops competing with the hover transform. */
  const stack = document.getElementById('hero-stack');
  if (stack && !stack.classList.contains('ready')){
    /* rAF alone is not enough: it does not fire in a background tab, which is
       exactly when a first-time visitor opens a link and switches away. A
       timeout starts it regardless, and both paths are idempotent. */
    const start = () => {
      if (stack.classList.contains('ready')) return;
      stack.classList.add('ready');
      const done = () => stack.classList.add('settled');
      stack.addEventListener('animationend', done, { once:true });
      setTimeout(done, 1800);
    };
    /* A CSS animation does not advance in a hidden tab, so with fill-mode:both
       it parks on its opening frame — opacity 0 — and the hero is blank until
       the tab is focused. Anyone opening the link in a background tab would see
       nothing. If we are not visible, skip the entrance entirely and show the
       finished state; animate only when someone is actually watching. */
    if (document.visibilityState !== 'visible'){
      stack.classList.add('ready', 'settled');
    } else {
      requestAnimationFrame(start);
      setTimeout(start, 400);
    }
  }
  // Gallery: a flagship designer template leads, then the pool is interleaved
  // so no two neighbours share a layout or a palette. Straight authored order
  // put all eight gold designs in one row and read as a single template.
  const grid = $('lp-tpl-grid');
  grid.innerHTML = '';
  /* The gallery is the shop window and it was showing 13 of 24 old classic
     designs, because the pool was "featured + anything not premium" and the
     classics are all non-premium. Lead with the STREET family and the
     featured designer work — the strongest in the library — and let the
     classics fill what is left.
     Within that, unlocked templates are floated to the front so the first
     cards anyone clicks open the editor rather than the upsell. */
  const best = TEMPLATES.filter(t => t.tag === 'street')
    .concat(TEMPLATES.filter(t => t.feat && t.tag !== 'street'))
    .concat(TEMPLATES.filter(t => !t.feat && t.tier !== 'premium'));
  const seen = new Set();
  const pool = best.filter(t => !seen.has(t.id) && seen.add(t.id));
  const ordered = varietyOrder(pool);
  const showcase = ordered.filter(t => !tplLocked(t))
    .concat(ordered.filter(t => tplLocked(t)))
    .slice(0, 24);
  // wave-1 list for preloadTplBgs: exactly what is on screen
  window.__PRIORITY_TPL_IDS = heroIds.concat(showcase.map(t => t.id));
  showcase.forEach(t => {
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
  // Selection chrome follows the UI accent, not a baked-in colour, so it stays
  // right when the theme flips (index.html repaints these on toggle).
  const selAccent = getComputedStyle(document.documentElement)
    .getPropertyValue('--accent').trim() || '#3b9bff';
  fabric.Object.prototype.set({
    transparentCorners:false, cornerColor:selAccent, cornerStrokeColor:'#ffffff',
    borderColor:selAccent, cornerSize:11, cornerStyle:'circle', borderScaleFactor:1.5,
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
      // images, polygons, triangles, groups, scale uniformly, never distort
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
    if (!opts.silent){ pushHist(); toast(f.label + ', ' + CW + '×' + CH); }
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
  if (_t && tplLocked(_t)){ openPlans('“' + _t.name + '” is a premium template, unlock all 8 designs with Starter or Pro.'); return; }
  const tpl = TEMPLATES.find(t => t.id === id);
  if (!tpl || !canvas) return;
  histLock = true;
  canvas.clear();
  bgState = tpl.bg.type === 'solid' ? {type:'solid', c:tpl.bg.c} : Object.assign({}, tpl.bg);
  applyBgSpec(canvas, tpl.bg);
  tpl.layers.forEach(l => canvas.add(buildLayer(l, tpl.id, CW, CH)));
  alignPass(canvas, CW, CH);
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
    s = s.toLowerCase().replace(/(^|[\s(\u2022•\-, /])([a-z])/g, (m,a,b) => a + b.toUpperCase());
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
        // TRAITS holds the AUTHORED size, which for a long money-word is the
        // one that overflowed the board in the first place. Re-fit after
        // restoring, or Enhance undoes the fix every time it runs.
        if (o.type === 'i-text' || o.type === 'text') fitToDoc(o, null, CW);
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
    // 3) optional AI polish, silent fallback when offline / standalone
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
    toast(restored ? '✦ Enhanced, styling restored, text cleaned' : '✦ Enhanced, text cleaned', 'success');
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
`Fix ONLY spelling, punctuation and spacing in these ad text snippets. Keep meaning, word count and line breaks. Do not add or remove words. Respond with ONLY a JSON array of {"i":number,"text":string}, no markdown, no preamble.
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
    const count = (badge.text.match(/[•✓]/g)||[]).length;
    if (badge.text.toUpperCase().includes(w)) { toast('Already on the badge strip'); return; }
    badge.set('text', badge.text + '\n\u2713 ' + w);
    if (count + 1 > 4) toast('Tip: 3-4 points reads best', 'error');
  } else {
    badge = new fabric.IText('\u2713 ' + w, {
      left: CW-30, top: 30, originX:'right', fontFamily:'Satoshi', fontSize:29, fill:'#ffffff',
      fontWeight:'800', charSpacing:70, lineHeight:1.5, shadow:new fabric.Shadow(sh('rgba(0,0,0,0.6)',10,0,3)), paintFirst:'stroke',
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
  if (!objs.length){ list.innerHTML = '<div class="empty-hint">No layers yet. Pick a template or add elements.</div>'; return; }
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
    <div class="layer-main"><div class="layer-name">Background</div><div class="layer-prev">${bgi ? 'Photo, click to change' : 'Color, click to change'}</div></div>
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
    $('pt-bgcolor').value = toHex(src.backgroundColor, '#111111');
  $('pt-bgcolor').style.opacity = src.backgroundColor ? '' : '.35';
  $('pt-bgcolor').title = src.backgroundColor ? 'Text background fill' : 'No fill yet, pick a color to add one';
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
  // highlight strip behind the text (the color the old selling-points pill was
  // stuck on, now editable, and removable)
  $('pt-bgcolor').addEventListener('input', () => { $('pt-bgcolor').style.opacity = ''; withActive(o => { if (o.text !== undefined){ o.set('backgroundColor', $('pt-bgcolor').value); if (!o.padding) o.set('padding', 6); } }); });
  $('pt-bgcolor-off').onclick = () => { $('pt-bgcolor').style.opacity = '.35'; withActive(o => { if (o.text !== undefined){ o.set('backgroundColor', ''); toast('Highlight removed'); } }); };
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
  else if (kind === 'body') o = new fabric.Textbox('Body text, double-click to edit', {left:CW/2, top:CH/2+70, width:600, originX:'center', fontFamily:F_COND, fontSize:36, fill:'#ffffff', textAlign:'center', paintFirst:'stroke', name:'Body text', pgRole:'info', pgCasing:'none', pgTplId:currentTplId});
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
  try { setSaved(saved); } catch(e){ toast('Storage full. Delete an old template first', 'error'); return; }
  currentTplName = name; $('tb-tplname').textContent = name;
  refreshMyTemplates(); toast('Template saved, find it under Templates → My templates', 'success');
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
        () => { if (tplLocked(t)){ openPlans('“' + t.name + '” is a premium template, unlock all 8 designs with Starter or Pro.'); return; } closePicker(); loadTemplate(t.id); });
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
  addHistory(a.download, gate.px, url, d.w, d.h, {
    kind: 'adv', json: canvas.toJSON(EXTRA_PROPS), tplId: currentTplId,
    name: currentTplName, bg: bgState, fmt: docFormat,
  });
  $('export-overlay').classList.remove('show');
  toast('PNG downloaded, ready to post', 'success');
}

// ═══════════════ ORDER PRINTS + POSTING (SCANS.AD handoff) ═══════════════
// Second revenue event from the same design: the finished PNG jumps straight
// into a ScanMap campaign, printed, posted around town, every scan tracked.
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
    // storage, a silent drop (size cap, validation) must not lose the file
    e.source.postMessage({ type:'buybackad:artwork', png: _handoff.png, meta: _handoff.meta }, e.origin);
  } else if (t === 'scansad:artwork-received'){
    clearTimeout(_handoff.timer);
    _handoff = null;
    toast('Artwork sent to SCANS.AD, finish your campaign in the new tab', 'success');
  } else if (t === 'scansad:artwork-rejected'){
    clearTimeout(_handoff.timer);
    const h = _handoff; _handoff = null;
    h.download();
    toast('SCANS.AD could not accept the artwork (' + (e.data.reason || 'rejected') + '), downloaded instead, upload it at the flyer step', 'error');
  }
});
async function orderPrints(fromEz){
  if (!partnerEnabled()){ toast('Printing + posting is not available on this account', 'error'); return; }
  const gate = await gateExport(fromEz ? ezExportPx() : exportSize);
  if (!gate) return;
  let png, w, h, name;
  if (fromEz){
    w = h = gate.px; name = ezTpl().name;
    png = renderEzCanvas(gate.px, 'png', undefined, (!ez.bg && !ez.bgPicked) ? 'export' : undefined);
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
  // the design's own QR target is usually the campaign's destination URL, 
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
  if (png.length > 64000000){   // beyond ScanMap's intake cap, don't pretend the handshake will work
    dl();
    window.open(scanmapUrl() + '/login.html?' + params.toString() + '#partner', '_blank');
    toast('Artwork is too large to hand over automatically, downloaded instead, upload it at the flyer step');
    return;
  }
  const win = window.open(scanmapUrl() + '/login.html?' + params.toString() + '#partner', '_blank');
  if (!win){
    dl();
    toast('Popup blocked, artwork downloaded instead. Open ' + scanmapUrl() + ' and attach it to your campaign.', 'error');
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
    toast('Artwork downloaded, upload it when SCANS.AD asks for your flyer design');
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
  { sel:'#badge-chips',     pos:'right',  title:'Selling points', body:'One tap adds trust badges like QUICK, SAFE or SAME DAY to the yellow strip. Keep it to 3-4 for maximum punch.' },
  { sel:'#enhance-btn',    pos:'bottom', title:'✦ Enhance', body:'Made a mess of fonts or colors? Enhance snaps every layer back to the template\'s pro styling and tidies up your spelling and capitalization, your words stay yours.' },
  { sel:'#panel-right',    pos:'left',  title:'Fine-tune everything', body:'Properties for colors, outlines and glow, plus a Layers tab to reorder, hide or lock elements.' },
  { sel:'#export-btn',     pos:'bottom', title:'Export & post', body:'Downloads a crisp PNG in your chosen format, square for Marketplace & Instagram, story, or a print-ready 8.5×11 flyer. That\'s the whole workflow.' },
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
    // bind controls here too, the tour must control itself even if other wiring failed
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
  catch (err){ console.error('Tutorial step error, ending tour:', err); endTutorial(); }
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
  // Real glyph widths laid cumulatively along the arc, the arc length under
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

// deterministic procedural backgrounds, always available, zero assets
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
const TPL_BG_ELS = {};   // raw <img> elements, shared safely, never owned by any canvas
let _tplBgReport = { loaded: 0, missing: [] };
/* Defocused backdrops for the STREET family.
   Washing a photo out with white is not enough on its own: the borrowed
   backdrops are product shots, so at any wash strength the subject still
   ghosts through as a hard-edged grey rectangle, which reads as an artifact
   rather than as a ground. The user's own best-performing ads sit on heavily
   DEFOCUSED grounds, so blur it properly.
   Blurred once per source into an offscreen canvas and cached — the canvas is
   then used as the image element, so there is no per-render filter cost. */
const _BLUR_ELS = {};
function blurredEl(src, radius){
  const key = src + '|' + radius;
  if (_BLUR_ELS[key]) return _BLUR_ELS[key];
  const el = TPL_BG_ELS[src];
  if (!el || !el.width) return null;
  try {
    const c = document.createElement('canvas');
    c.width = el.width; c.height = el.height;
    const x = c.getContext('2d');
    // scale the blur with the source so it looks the same at any asset size
    x.filter = 'blur(' + Math.max(6, Math.round(el.width * (radius || 0.022))) + 'px)';
    // draw slightly overscanned, or the blur pulls transparent edges inward
    const o = Math.round(el.width * 0.06);
    x.drawImage(el, -o, -o, el.width + o * 2, el.height + o * 2);
    _BLUR_ELS[key] = c;
    return c;
  } catch (e){ return null; }
}
/* `grade` turns a photograph into a DUOTONE: strip it to luminance, widen the
   tonal range, then push the shadows toward one brand hue and the highlights
   toward another. It is the largest visual change available without new art,
   and it fixes two measured gaps at once — a duotone is by construction
   high-contrast (the reference set's tonal range is 0.87 against our 0.53) and
   it is unmistakably COLOURED, where a naturalistic photo under a dark wash is
   effectively grey.
   Order matters: grayscale first or the blends fight the original hues;
   contrast before the blends or the two tints collapse into each other. */
function freshBgImage(src, blur, grade){
  let img = null;
  if (blur){
    const b = blurredEl(src, blur);
    if (b){ try { img = new fabric.Image(b); } catch (e){} }
  }
  if (!img) img = _freshBgImageRaw(src);
  if (img && grade && grade.shadow && grade.highlight){
    try {
      const F = fabric.Image.filters;
      img.filters = [
        new F.Grayscale(),
        new F.Contrast({ contrast: grade.contrast === undefined ? 0.18 : grade.contrast }),
        new F.BlendColor({ color: grade.shadow,    mode: 'multiply', alpha: 1 }),
        new F.BlendColor({ color: grade.highlight, mode: 'screen',
                           alpha: grade.lift === undefined ? 0.72 : grade.lift }),
      ];
      img.applyFilters();
    } catch (e){ /* a filter failure must not cost the whole backdrop */ }
  }
  return img;
}
function _freshBgImageRaw(src){
  // Every render gets its OWN fabric.Image wrapper. Sharing one instance across
  // canvases was the photo-killer: canvas.dispose() gutted the shared object, so
  // the first render worked and every later one silently painted nothing.
  const el = TPL_BG_ELS[src];
  if (!el || !el.width) return null;
  try { return new fabric.Image(el); } catch (e){ return null; }
}
/* Cutout PNGs, cached by src exactly like the backdrops. Kept in a separate
   map because they are FOREGROUND art with an alpha channel, and unlike the
   backdrops there is no embedded base64 copy: they load from assets/cutouts or
   they do not load, and a template that misses one still renders (the layer
   collapses to nothing rather than throwing). */
const CUTOUT_ELS = {};
function preloadCutouts(){
  const srcs = [...new Set(TEMPLATES.flatMap(t =>
    (t.layers || []).filter(l => l.kind === 'cutout' && l.props && l.props.src).map(l => l.props.src)))];
  if (!srcs.length) return Promise.resolve();
  let missing = [];
  return Promise.all(srcs.map(src => new Promise(res => {
    const el = new Image();
    el.onload = () => { CUTOUT_ELS[src] = el; res(); };
    el.onerror = () => { missing.push(src); res(); };
    el.src = src;
  }))).then(() => {
    if (missing.length) console.warn('GraphicsStudio: ' + missing.length + ' cutout(s) missing from assets/cutouts, those layers render empty:', missing.slice(0, 5));
    else console.log('GraphicsStudio: all ' + srcs.length + ' product cutouts ready.');
    /* Only the templates that actually USE a cutout have a stale thumbnail.
       Clearing the whole cache re-rendered all 243 on every load, which is a
       visible hitch for no reason — the other 200 never changed. */
    TEMPLATES.forEach(t => {
      if ((t.layers || []).some(l => l.kind === 'cutout')) delete THUMBS[t.id];
    });
  });
}
/* Backdrops load in TWO WAVES. All 153 at once is ~31MB on the critical path,
   which is fine on office wifi and punishing on anything slower. The ones the
   visitor can actually see — the hero fan, the 24-card gallery, and the strip
   for the opening category — go first; the rest follow once the browser is
   idle. Nothing breaks if a later one is slow: a template without its photo
   renders on its designed gradient and refreshPhotoThumb() upgrades it the
   moment the file lands. */
function visibleFirst(list){
  const wanted = new Set();
  (window.__PRIORITY_TPL_IDS || []).forEach(id => wanted.add(id));
  // the opening category's strip is the next thing anyone looks at
  TEMPLATES.filter(t => t.cat === currentCat).slice(0, 16).forEach(t => wanted.add(t.id));
  const first = list.filter(t => wanted.has(t.id));
  const rest  = list.filter(t => !wanted.has(t.id));
  return first.concat(rest);
}
function preloadTplBgs(){
  const ordered = visibleFirst(TEMPLATES.filter(t => t.bg && t.bg.type === 'image' && t.bg.src));
  const embedded = window.TPL_BG_DATA || {};
  const loadOne = t => new Promise(res => {
    const finish = el => {
      if (el && el.width > 0){
        TPL_BG_ELS[t.bg.src] = el;
        _tplBgReport.loaded++;
        refreshPhotoThumb(t.id);      // self-heal: upgrade previews the moment the photo decodes
      } else _tplBgReport.missing.push(t.bg.src);
      res();
    };
    const el = new Image();
    // fallback chain: embedded base64 → assets/bg file → backend blob (photos
    // published from the admin AI Studio go live without a redeploy)
    const apiSrc = (window.PGFX_API || '') + '/bg/' + t.bg.src.split('/').pop();
    el.onload = () => finish(el);
    el.onerror = () => {
      if (embedded[t.bg.src] && el.src !== embedded[t.bg.src]){ el.src = embedded[t.bg.src]; } // asset file failed → embedded copy
      else if (window.PGFX_API && !el.src.endsWith(apiSrc)){ el.src = apiSrc; }               // → published blob
      else finish(null);
    };
    // embedded data first (cannot 404, works on file://); asset file is the backup
    el.src = embedded[t.bg.src] || t.bg.src;
  });
  /* Wave 1 = what is on screen. Wave 2 = everything else, started only once
     wave 1 has settled, so the visible page is never competing with 130
     background requests it does not need yet. Reordering alone would not have
     helped: every new Image() fires immediately, so the split has to be in
     TIME, not just in array order. */
  /* Firing all 153 at once saturates the connection: the browser runs ~6 in
     parallel and everything — including the images actually on screen —
     finishes together at ~11s. Wave 1 is what is visible. Wave 2 then trickles
     in SMALL CHUNKS so it never competes with a category the user just opened.
     Nothing is blocked on wave 2: a template whose photo has not arrived draws
     on its designed gradient and refreshPhotoThumb() upgrades it on arrival. */
  const PRIORITY = Math.min(ordered.length, 34);
  const wave1 = ordered.slice(0, PRIORITY);
  const wave2 = ordered.slice(PRIORITY);
  const CHUNK = 10;
  const idle = cb => (window.requestIdleCallback || (f => setTimeout(f, 300)))(cb);
  const trickle = i => {
    if (i >= wave2.length) return report();
    Promise.all(wave2.slice(i, i + CHUNK).map(loadOne)).then(() => idle(() => trickle(i + CHUNK)));
  };
  return Promise.all(wave1.map(loadOne)).then(() => { idle(() => trickle(0)); });
  function report(){
    if (_tplBgReport.missing.length){
      console.warn('GraphicsStudio: ' + _tplBgReport.missing.length + ' template background photo(s) not shipped yet, designed gradient fallbacks in use. Drop files into assets/bg/ per assets/bg/MANIFEST.md (list: window.BG_MANIFEST).');
    } else {
      console.log('GraphicsStudio: all ' + _tplBgReport.loaded + ' template background photos ready (embedded).');
    }
  }
}
let _thumbRefreshQueued = false;
function refreshPhotoThumb(tplId){
  delete THUMBS[tplId];
  if (_thumbRefreshQueued) return;
  _thumbRefreshQueued = true;
  setTimeout(() => {                 // batch: one repaint even if all 8 land together
    _thumbRefreshQueued = false;

    if (!$('page-landing').classList.contains('hidden')) buildLanding();
    buildEzStrip();   // strip thumbs must never stay stale, cheap, cache-backed
    if (typeof refreshMyTemplates === 'function' && $('page-editor').classList.contains('active')) refreshMyTemplates();
  }, 120);
}
/* The scrim is normally black, to sink a photo behind light type. The STREET
   family needs the opposite: their best-performing ads put saturated type on a
   PALE, quiet ground, so those templates wash the same photo out with white
   instead. One function, two directions, driven by bg.scrimColor. */
/* MEASURED AGAINST THE REFERENCE FOLDER. A flat wash at 0.72-0.80 destroyed
   everything that makes their "good" set look expensive: median edge density
   fell to 4% against their 29.6%, bright highlights to 0.2% of pixels against
   their 14.7%, tonal range to 0.53 against their 0.87. A photograph under a
   heavy even wash is not a photograph, it is a grey rectangle.
   `mode:'gradient'` keeps the wash where the type is — a strong band top and
   bottom — and lets the middle third of the image come through at full
   strength, which is where the product and its highlights live. Type keeps its
   own separation (outline + shadow), so it no longer needs the whole frame
   flattened on its behalf. */
function scrimRect(alpha, w, h, color, mode){
  w = w || CW; h = h || CH;
  /* Parse any hex, not just the two literals this used to match. It compared
     `color === '#ffffff'` and fell through to BLACK for anything else, so a
     paper-white wash passed as '#f4f1ec' silently rendered as a dark one —
     the opposite of what the caller asked for, on the templates least able to
     survive it. */
  let c = '0,0,0';
  if (color){
    if (color === 'white') c = '255,255,255';
    else {
      const h2 = String(color).replace('#','');
      const hx = h2.length === 3 ? h2.split('').map(ch => ch + ch).join('') : h2;
      if (/^[0-9a-f]{6}$/i.test(hx)){
        const n = parseInt(hx, 16);
        c = ((n>>16)&255) + ',' + ((n>>8)&255) + ',' + (n&255);
      }
    }
  }
  let fill = 'rgba(' + c + ',' + alpha + ')';
  if (mode === 'gradient'){
    fill = new fabric.Gradient({
      type:'linear', coords:{ x1:0, y1:0, x2:0, y2:h },
      colorStops:[
        { offset:0.00, color:'rgba(' + c + ',' + (alpha).toFixed(3) + ')' },
        /* The middle was first set to 0.22 of the peak, which let the photo
           through beautifully and cost the body copy that sits there its
           contrast. 0.40 is the measured compromise: detail and highlights
           survive, mid-band type stays readable. */
        { offset:0.26, color:'rgba(' + c + ',' + (alpha * 0.62).toFixed(3) + ')' },
        { offset:0.50, color:'rgba(' + c + ',' + (alpha * 0.42).toFixed(3) + ')' },
        { offset:0.74, color:'rgba(' + c + ',' + (alpha * 0.64).toFixed(3) + ')' },
        { offset:1.00, color:'rgba(' + c + ',' + (alpha * 0.95).toFixed(3) + ')' },
      ]});
  }
  return new fabric.Rect({ left:0, top:0, width:w, height:h, fill:fill, selectable:false, evented:false, name:'Scrim' });
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
  toast(th.name + ' applied, complementary contrast', 'success');
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
  ['House faces', ['Clash Display','Satoshi','Khand','Melodrama','Zodiak']],
  ['Display & impact', ['Alfa Slab One','Abril Fatface','Bakbak One','Big Shoulders Display','Black Ops One','Bowlby One SC','Bungee','Chango','Concert One','Days One','Fjalla One','Francois One','Graduate','Hammersmith One','Lilita One','Luckiest Guy','Monoton','Passion One','Patua One','Paytone One','Press Start 2P','Racing Sans One','Righteous','Rowdies','Russo One','Secular One','Shrikhand','Sigmar One','Squada One','Staatliches','Titan One','Ultra','Unbounded','Vast Shadow']],
  ['Script & fun', ['Creepster','Fredoka','Gloria Hallelujah','Great Vibes','Knewave','Lobster','Pacifico','Special Elite','Yellowtail']],
  ['Clean & modern', ['Changa','Exo 2','Inter','Josefin Sans','Kanit','Lato','League Spartan','Nunito','Plus Jakarta Sans','Poppins','Prompt','Raleway','Rubik','Saira Condensed','Teko']],
  ['Serif', ['Cinzel','Cormorant Garamond','DM Serif Display','Merriweather','Playfair Display','Zilla Slab']],
  ['System', ['Georgia','Impact','Arial Black']],
];
const CORE_FONTS = new Set(FONT_GROUPS[0][1].concat(FONT_GROUPS[5][1]));
const _fontLoaded = new Set(CORE_FONTS);
// The five house faces are self-hosted, declared in styles.css, and must never
// be requested from Google — that lookup 404s and costs a round trip before
// the harmless onerror fires.
const HOUSE_FACES = ['Clash Display', 'Satoshi', 'Khand', 'Melodrama', 'Zodiak'];
function ensureFont(name){
  if (_fontLoaded.has(name)) return Promise.resolve();
  _fontLoaded.add(name);
  if (HOUSE_FACES.indexOf(name) !== -1){
    const l = (document.fonts && document.fonts.load)
      ? document.fonts.load('400 24px "' + name + '"').catch(() => {}) : Promise.resolve();
    return Promise.race([l, new Promise(r => setTimeout(r, 3000))]).then(() => {
      try { if (window.fabric && fabric.util && fabric.util.clearFabricFontCache) fabric.util.clearFabricFontCache(); } catch(e){}
    });
  }
  // fonts.load() only works AFTER the injected stylesheet's @font-face rules
  // exist, waiting on link.onload first is what makes canvas thumbnails
  // paint with the real face instead of the serif fallback
  return new Promise(res => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(name).replace(/%20/g, '+') + '&display=swap';
    const done = () => {
      // fabric caches per-family glyph widths, anything measured while the
      // face was still loading poisons every later render (clipped tails),
      // so flush the measurement cache the moment a font becomes real
      try { if (window.fabric && fabric.util && fabric.util.clearFabricFontCache) fabric.util.clearFabricFontCache(); } catch (e){}
      res();
    };
    link.onload = () => {
      const l = (document.fonts && document.fonts.load) ? document.fonts.load('400 24px "' + name + '"').catch(() => {}) : Promise.resolve();
      Promise.race([l, new Promise(r => setTimeout(r, 3000))]).then(done, done);
    };
    link.onerror = done;
    document.head.appendChild(link);
    setTimeout(done, 4500);   // hard cap, never block the app on a font
  });
}
function buildFontOptions(sel){
  if (!sel || sel.dataset.fontsBuilt) return;
  sel.dataset.fontsBuilt = '1';
  // each option renders in its own typeface so picking a font is visual
  sel.innerHTML = FONT_GROUPS.map(([g, fonts]) =>
    '<optgroup label="' + g + '">' + fonts.map(f =>
      '<option style="font-family:\'' + f + '\';font-size:15px">' + f + '</option>').join('') + '</optgroup>').join('');
  // the first time the menu is touched, load every picker face once (cached
  // after) so the previews above actually show the real fonts
  const warm = () => FONT_GROUPS.forEach(([, fonts]) => fonts.forEach(f => ensureFont(f)));
  sel.addEventListener('pointerdown', warm, { once: true });
  sel.addEventListener('focus', warm, { once: true });
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
        { name:'Badges', props:{ fontFamily:'Satoshi', fontSize:29, fill:'#ffffff', fontWeight:'800', charSpacing:70, lineHeight:1.5, shadow:sh('rgba(0,0,0,0.6)',10,0,3) } };
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
    if (l) openTxtPop(e.currentTarget, l.name); else toast('This template has no website line, pick one that shows a site', 'error');
  };
}

// ═══════════════ EXPORT HISTORY (re-download costs a credit) ═══════════════
async function histList(){
  return (await bgList()).filter(r => r.kind === 'export').sort((a, b) => b.ts - a.ts);
}
async function addHistory(name, px, dataUrl, w, h, proj){
  const thumb = await downscaleDataUrl(dataUrl, 160);
  // proj = editable project snapshot: {kind:'ez', st, bgData} or
  // {kind:'adv', json, tplId, name, bg, fmt}. Old records without one can only
  // be re-downloaded, not reopened.
  await bgPut({ id:'ex-' + Date.now(), name, px, w: w || px, h: h || px, data: dataUrl, thumb, ts: Date.now(), kind:'export', proj: proj || null });
  const all = await histList();
  for (const r of all.slice(12)) await bgDel(r.id);   // keep the last 12
}

// Re-download an export record (plan gates + watermark + credit apply).
async function redownloadRecord(r){
  const gate = await gateExport(r.px);
  if (!gate) return;
  const rw = r.w || r.px, rh = r.h || r.px;
  let url = r.data, w = rw, h = rh;
  if (gate.px < r.px){ // plan downgraded since, plan caps apply to the SHORT side
    const s = gate.px / Math.min(rw, rh);
    w = Math.round(rw * s); h = Math.round(rh * s);
    url = await downscaleDataUrl(r.data, Math.max(w, h));
  }
  if (gate.watermark) url = await applyWatermark(url, w, h);
  try { await recordExport(); } catch (e){ toast('Could not record export: ' + e.message, 'error'); return; }
  const a = document.createElement('a');
  a.href = url; a.download = r.name.replace(/\.png$/,'') + '-redownload.png';
  document.body.appendChild(a); a.click(); a.remove();
  toast('Re-downloaded, 1 export credit used', 'success');
}

// Reopen an exported project for editing, in whichever editor made it.
function openProject(r){
  const p = r && r.proj;
  if (!p){ toast('This export predates project saving, it can only be re-downloaded', 'error'); return; }
  $('hist-overlay').classList.remove('show');
  document.querySelectorAll('.view-drop.open').forEach(m => m.classList.remove('open'));
  if (p.kind === 'adv'){
    showEditor();
    loadSavedTemplate({ json: p.json, fmt: p.fmt, bg: p.bg, baseTpl: p.tplId, name: p.name || r.name || 'Untitled ad' });
    toast('Project reopened for editing');
  } else {
    applyEzSnapshot(p);
    toast('Project reopened for editing');
  }
}
function applyEzSnapshot(p){
  const st = p.st || {};
  ez.vals = st.vals || {};
  ez.styles = st.styles || {};
  ez.fx = Object.assign({ blur:0, overlay:'none', oc:'#000000', os:45 }, st.fx || {});
  ez.hidden = st.hidden || {};
  ez.bg = st.bg || null;
  ez.bgData = null; ez.bgImgObj = null; ez.bgRecId = null;
  jset('pgfx_ez_state', st);
  // land on the project's category so the strip highlights the right card
  const tpl = TEMPLATES.find(t => t.id === st.tpl);
  if (tpl) setCategory(tpl.cat);
  showEasy(st.tpl || null);
  // selectEzTpl resets chips to the template default, so restore them after
  if (st.chips){ ez.chips = st.chips; syncEzChips(); }
  ez.bgPicked = st.bgPicked === true;
  if (p.bgData) setTimeout(() => useEzPhoto(p.bgData, null), 300);
  else schedEzPreview(0);
}
// Fresh start: clears the easy-mode working state back to defaults.
function resetEzProject(){
  jset('pgfx_ez_state', null);
  ez.vals = {}; ez.chips = null; ez.styles = {}; ez.hidden = {};
  ez.fx = { blur:0, overlay:'none', oc:'#000000', os:45 };
  ez.bg = null; ez.bgData = null; ez.bgImgObj = null; ez.bgRecId = null; ez.bgPicked = false;
  showEasy(jget('pgfx_last', 'sell_iphone'));
  schedEzPreview(0);
}
async function openHistory(){
  const list = $('hist-list');
  list.innerHTML = '<div class="hist-empty">Loading…</div>';
  $('hist-overlay').classList.add('show');
  const items = await histList();
  list.innerHTML = '';
  if (!items.length){ list.innerHTML = '<div class="hist-empty">No exports yet, your downloads will show up here for easy re-downloading.</div>'; return; }
  items.forEach(r => {
    const row = document.createElement('div');
    row.className = 'hist-row';
    const rw = r.w || r.px, rh = r.h || r.px;   // rectangular formats store real dims; old entries were square
    row.innerHTML = `<img src="${r.thumb}" alt=""><span class="hist-main"><span class="hist-name">${escHtml(r.name)}</span><span class="hist-meta">${rw}×${rh} · ${new Date(r.ts).toLocaleString()}</span></span>` +
      (r.proj ? `<button class="hist-edit" title="Reopen this project in the editor">✏️ Edit</button>` : '') +
      `<button class="hist-dl">⬇ Re-download (1 credit)</button>`;
    const ed = row.querySelector('.hist-edit');
    if (ed) ed.onclick = () => openProject(r);
    row.querySelector('.hist-dl').onclick = () => redownloadRecord(r);
    list.appendChild(row);
  });
}

// Shared dropdown for "Export ▾" (easy nav) and "Make my ad ▾" (landing nav):
// action rows first, then the six most recent projects with edit + re-download.
async function fillProjectsMenu(menu, opts){
  const items = (await histList()).slice(0, 6);
  let html = '';
  if (opts.newProject) html += `<button class="view-item" data-xm="new">✚ New project</button>`;
  if (opts.exportNow) html += `<button class="view-item" data-xm="export">⬇ Export this ad</button>`;
  if (items.length){
    html += `<div class="am-email">PREVIOUS PROJECTS</div>`;
    html += items.map(r => `
      <div class="xm-row">
        <img src="${r.thumb}" alt="">
        <span class="xm-name">${escHtml(String(r.name).replace(/\.png$/, '').slice(0, 26))}</span>
        ${r.proj ? `<button class="xm-btn" data-xm-edit="${r.id}" title="Reopen and edit">✏️</button>` : ''}
        <button class="xm-btn" data-xm-dl="${r.id}" title="Re-download (1 credit)">⬇</button>
      </div>`).join('');
  } else {
    html += `<div class="am-email">No previous projects yet</div>`;
  }
  html += `<button class="view-item" data-xm="all">🕘 View full history</button>`;
  menu.innerHTML = html;
  menu.onclick = async (e) => {
    const t = e.target.closest('[data-xm],[data-xm-edit],[data-xm-dl]');
    if (!t) return;
    e.stopPropagation();
    const recs = await histList();
    if (t.dataset.xm === 'new'){ menu.classList.remove('open'); resetEzProject(); }
    else if (t.dataset.xm === 'export'){ menu.classList.remove('open'); ezDownload(); }
    else if (t.dataset.xm === 'all'){ menu.classList.remove('open'); openHistory(); }
    else if (t.dataset.xmEdit){ menu.classList.remove('open'); openProject(recs.find(r => r.id === t.dataset.xmEdit)); }
    else if (t.dataset.xmDl){ redownloadRecord(recs.find(r => r.id === t.dataset.xmDl)); }
  };
}
async function toggleProjectsMenu(menu, opts){
  document.querySelectorAll('.view-drop.open').forEach((m) => { if (m !== menu) m.classList.remove('open'); });
  if (!menu.classList.contains('open')) await fillProjectsMenu(menu, opts);
  menu.classList.toggle('open');
}

// ═══════════════ COMMUNITY GALLERY ═══════════════
// Publish a generated background straight to the community gallery.
async function publishGenerated(url, name){
  if (!url) return;
  if (DEMO){ toast('Community publishing needs the hosted site', 'error'); return; }
  if (!account){ openAuth('Sign in to share backgrounds with the community.'); return; }
  try {
    const data = await downscaleDataUrl(url, 1080);
    const thumb = await downscaleDataUrl(url, 240);
    await api('/community/publish', { name: String(name || 'AI background').slice(0, 40), thumb, data });
    toast('Shared with the community 🌐', 'success');
  } catch (e){ toast('Could not share: ' + e.message, 'error'); }
}
async function openCommunity(){
  const grid = $('comm-grid');
  grid.innerHTML = '';
  $('comm-overlay').classList.add('show');
  $('comm-note').style.display = DEMO ? '' : 'none';
  if (!DEMO){
    try {
      const j = await api('/community/list');
      if (!(j.items || []).length){
        const empty = document.createElement('div');
        empty.className = 'hist-empty';
        empty.style.gridColumn = '1 / -1';
        empty.textContent = 'No shared backgrounds yet. Generate or upload one, then hit 🌐 Share to put it here for everyone.';
        grid.appendChild(empty);
      }
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
  if (!account && !DEMO){ openAuth('Sign in to generate AI backgrounds'); return; }
  $('bggen-overlay').classList.add('show');
  setTimeout(() => $('bggen-prompt').focus(), 60);
}
function bindNavExtras(){
  $('nav-community').onclick = openCommunity;
  $('nav-history').onclick = (e) => { e.stopPropagation(); toggleProjectsMenu($('export-menu'), { exportNow: true }); };
  $('nav-genbg').onclick = openBgGen;
  $('nav-upgrade').onclick = () => openPlans();
  const adm = $('nav-admin');
  if (adm) adm.onclick = openAdminBg;
  $('hist-close').onclick = () => $('hist-overlay').classList.remove('show');
  $('comm-close').onclick = () => $('comm-overlay').classList.remove('show');
  $('bggen-close').onclick = () => $('bggen-overlay').classList.remove('show');
  $('bggen-go').onclick = async () => {
    const btn = $('bggen-go');
    btn.disabled = true; btn.textContent = '… Generating';
    try {
      bggenUrl = await aiGenerateBg($('bggen-prompt').value);
      $('bggen-img').src = bggenUrl;
      $('bggen-result').classList.add('show');
    } catch (err){ toast('Generation failed: ' + (err.message || 'unknown'), 'error'); }
    btn.disabled = false; btn.textContent = '✦ Generate';
  };
  $('bggen-use').onclick = () => { if (bggenUrl){ applyBgAnywhere(bggenUrl); $('bggen-overlay').classList.remove('show'); } };
  $('bggen-share').onclick = () => publishGenerated(bggenUrl, $('bggen-prompt').value || 'AI background');
  $('bggen-save').onclick = async () => {
    if (!bggenUrl) return;
    const data = await downscaleDataUrl(bggenUrl, 2160);
    const thumb = await downscaleDataUrl(bggenUrl, 240);
    await bgPut({ id:'bg-' + Date.now(), name:($('bggen-prompt').value || 'AI background').slice(0, 40), data, thumb, ts:Date.now(), kind:'library' });
    if (typeof refreshBgLibrary === 'function') refreshBgLibrary();
    toast('Saved to library', 'success');
  };
  bindAdminBg();
}

// ═══════════════ QR CODE LAYERS (Pro) ═══════════════
// The bridge into SCANS.AD: design the ad here, embed a tracked QR, order
// printing + posting, and every street scan reports back to the campaign.
// Works standalone too, the code can point at any URL.
const scanmapUrl = () => String(window.SCANMAP_URL || '').replace(/\/+$/, '');
// ── membership gating ──
// The SCANS.AD integration is invisible unless this browser has PROVEN the
// user belongs to BOTH platforms: signed in here, plus evidence of a SCANS.AD
// account, arriving from ScanMap's dashboard link (?scansad=member) or
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
      if (i >= urls.length){ _qrLoad = null; return rej(new Error('QR generator unavailable, check your connection and try again')); }
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
// Operator accounts (ADMIN_EMAILS env on the backend). Admin-only surfaces are
// invisible to everyone else, the nav entry doesn't render at all.
const isAdmin = () => !!account && account.role === 'admin';
async function addQrLayer(){
  if (!isPro()){
    openPlans('Scannable QR codes are a Pro feature, point one at any link, or paste a SCANS.AD tracking link and every printed flyer reports its scans back to you.');
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
    toast('QR code added, set where it points in Properties', 'success');
  });
}
function updateQrObject(o, url){
  if (!o || o.pgRole !== 'qr') return;
  if (!url || !/^(https?:\/\/|tel:|sms:|mailto:)/i.test(url)){ toast('Enter a full link, e.g. https://iphones.la or a SCANS.AD tracking link', 'error'); return; }
  loadQrLib().then(() => {
    o.setSrc(makeQrDataUrl(url, 1024), () => {
      o.pgQrData = url;
      o.dirty = true;   // bust fabric's object cache so the new modules paint everywhere
      canvas.requestRenderAll(); debouncePush(300);
      const tracked = /functions\/v1\/scan/.test(url);
      if (tracked) unlockScansad();   // pasting a tracking link proves a SCANS.AD account
      toast(tracked ? 'Tracked SCANS.AD code updated, scans will report to your campaign' : 'QR code updated', 'success');
    });
  }).catch(e => toast(e.message, 'error'));
}

// ═══════════════ SAAS: PLANS / AUTH / EXPORT GATING ═══════════════
/* Derived, never stated. These two lines used to read "55+ free templates" and
   "All 160+ templates" — written when the library was that size and never
   updated through 105 -> 153 -> 243, so the paid tier was advertising a third
   less than it actually delivers. Counting beats remembering.
   Deliberately independent of freeFirst3(), which is defined further down and
   depends on the signed-in account; this is the anonymous shopper's view. */
/* Read through tplCounts(), which counts via tplLocked() — the same predicate
   the UI actually gates on. An independent re-implementation here disagreed
   with it (65 against the real 54) because it guessed at which three templates
   per category are free instead of asking. One source of truth, or the number
   on the pricing page is a different number from the one in the product. */
const _round = (v, step) => Math.floor(v / step) * step + '+';
let FEAT_FREE_TPL = 'free templates, every Phones design included';
let FEAT_PRO_TPL  = 'the full Designer Library';
function refreshPlanFeats(){
  try {
    const c = tplCounts();
    FEAT_FREE_TPL = c.freeRounded + ' free templates, every Phones design included';
    FEAT_PRO_TPL  = 'All ' + c.totalRounded + ' templates incl. the Designer Library';
    if (typeof PLANS === 'object' && PLANS){
      PLANS.free.feats[1] = FEAT_FREE_TPL;
      PLANS.pro.feats[1]  = FEAT_PRO_TPL;
    }
  } catch (e){}
}
const API_BASE = (window.PGFX_API || '').replace(/\/$/, '');
const DEMO = !API_BASE;
const PLANS = {
  free: { label:'Free', price:0, priceLabel:'$0', per:'forever', maxPx:1080, watermark:true, weekly:3, monthly:null,
          feats:['3 exports per week',FEAT_FREE_TPL,'1080 × 1080 downloads','BUYBACK.AD watermark'] },
  pro:  { label:'Pro', price:15, priceLabel:'$15', per:'/month', maxPx:2160, watermark:false, weekly:null, monthly:100,
          feats:['100 exports per month',FEAT_PRO_TPL,'Up to 2160px, no watermark, every format','Export history & re-downloads'], hot:true },
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
  if (users[email]) throw new Error('An account with that email already exists, sign in instead');
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
  const adm = $('nav-admin');
  if (adm) adm.style.display = isAdmin() ? '' : 'none';
  const pk = $('ez-pack');
  if (pk) pk.style.display = isAdmin() ? '' : 'none';
  refreshTplLocks();   // admin bypass changes lock badges live
  // landing nav auth buttons disappear once signed in
  for (const id of ['lp-login', 'lp-signup']){
    const el = $(id);
    if (el) el.style.display = account ? 'none' : '';
  }
}
function syncQuotaUI(){
  const q = $('ez-quota'); if (!q) return;
  if (!account){ q.innerHTML = 'Free plan: 3 exports/week at 1080p, <span class="up" id="quota-plans">see plans</span>'; }
  else {
    const p = planOf(), rem = exportsRemaining();
    if (rem === Infinity) q.innerHTML = '<b>' + p.label + '</b>, unlimited exports up to ' + p.maxPx + 'px';
    else q.innerHTML = '<b>' + rem + '</b> of ' + (p.weekly || p.monthly) + ' exports left this ' + (p.weekly ? 'week' : 'month') +
      ((account.plan || 'free') === 'free' ? ' · 1080p + watermark, <span class="up" id="quota-plans">upgrade</span>' : '');
  }
  const up = $('quota-plans');
  if (up) up.onclick = () => openPlans();
  const hint = $('ez-dl-hint');
  if (hint) hint.textContent = (planOf().maxPx >= 1440 && account && (account.plan||'free') !== 'free')
    ? '1440×1440 PNG minimum, ready for Marketplace, OfferUp & Instagram'
    : '1080×1080 PNG on the Free plan, upgrade for 1440-2160 and no watermark';
}

// ── auth UI ──
let authMode = 'in', authNext = null;
// Google Sign-In: renders only when the backend reports GOOGLE_CLIENT_ID.
// Zero footprint otherwise, no script load, no button, nothing to configure.
let _gAuthInit = null;
function ensureGoogleAuth(){
  if (DEMO || _gAuthInit) return _gAuthInit;
  _gAuthInit = (async () => {
    try {
      const cfg = await api('/auth/config');
      if (!cfg.google || !cfg.googleClientId) return;
      await new Promise((res, rej) => {
        if (window.google && window.google.accounts) return res();
        const s = document.createElement('script');
        s.src = 'https://accounts.google.com/gsi/client';
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
      window.google.accounts.id.initialize({
        client_id: cfg.googleClientId,
        callback: async (resp) => {
          try {
            const j = await api('/auth/google', { credential: resp.credential });
            jset('pgfx_token', j.token);
            await loadAccount();
            $('auth-forms').style.display = 'none';
            $('auth-ok').style.display = '';
            $('auth-ok-title').textContent = 'Signed in with Google';
            $('auth-ok-sub').textContent = "You're in as " + j.user.email + '.';
          } catch (err){ $('auth-err').textContent = err.message || 'Google sign-in failed'; }
        },
      });
      window.google.accounts.id.renderButton($('auth-google'), { theme:'filled_black', size:'large', shape:'pill', width:300 });
      $('auth-google').style.display = '';
      $('auth-or').style.display = '';
    } catch (e){ /* button simply stays hidden */ }
  })();
  return _gAuthInit;
}

function openAuth(msg, next){
  authNext = next || null;
  ensureGoogleAuth();
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
      $('auth-type').style.display = '';
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
  if (!account){ openAuth('Create an account first, then pick your plan.', () => openPlans()); return; }
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
    openAuth('Sign in to download, free accounts get 3 exports a week.');
    return null;
  }
  if (account.role === 'admin') return { px: pxWanted, watermark: false }; // operators: full res, no watermark, no caps
  const p = planOf();
  if (exportsRemaining() <= 0){
    openPlans("You've used all your " + (p.weekly || p.monthly) + ' ' + p.label + ' exports this ' + (p.weekly ? 'week' : 'month') + ', upgrade to keep posting.');
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
  // Signed out → auth modal. Signed in → proper account menu (no confirm()
  // dialogs in a SaaS).
  const menu = $('acct-menu');
  $('acct-chip').onclick = (e) => {
    if (!account){ openAuth(); return; }
    e.stopPropagation();
    $('am-email').textContent = account.email + ' · ' + planOf().label;
    $('am-admin').style.display = isAdmin() ? '' : 'none';
    menu.classList.toggle('open');
  };
  // one closer for every nav dropdown (account, export, landing projects)
  document.addEventListener('click', (e) => {
    document.querySelectorAll('.view-drop.open').forEach((m) => {
      const wrap = m.closest('.view-menu');
      if (!wrap || !wrap.contains(e.target)) m.classList.remove('open');
    });
  });
  const lpCaret = $('lp-studio-caret');
  if (lpCaret) lpCaret.onclick = (e) => { e.stopPropagation(); toggleProjectsMenu($('lp-projects-menu'), { newProject: true }); };
  const eye = $('auth-pass-eye');
  if (eye) eye.onclick = () => {
    const p = $('auth-pass');
    p.type = p.type === 'password' ? 'text' : 'password';
    eye.style.opacity = p.type === 'password' ? '' : '1';
  };
  // Post-signup onboarding: pick an account type, then straight into the
  // studio where the first-run tutorial fires automatically.
  const finishOnboarding = (pro) => {
    $('auth-type').style.display = 'none';
    $('auth-overlay').classList.remove('show');
    syncAcctUI();
    jset('pgfx_tut_done', false);   // brand-new account always gets the tour
    if (pro){
      openPlans('Pro unlocks all 160+ templates, 2160p exports and no watermark.');
      return;
    }
    showEditor();
    loadTemplate(firstFreeTplId()); // maybeStartTutorial fires from here
    if (authNext) authNext();
  };
  const atFree = $('at-free'), atPro = $('at-pro');
  if (atFree) atFree.onclick = () => finishOnboarding(false);
  if (atPro) atPro.onclick = () => finishOnboarding(true);
  $('am-plans').onclick = () => { menu.classList.remove('open'); openPlans(); };
  $('am-exports').onclick = () => { menu.classList.remove('open'); openHistory(); };
  $('am-admin').onclick = () => { menu.classList.remove('open'); openAdminBg(); };
  $('am-signout').onclick = () => { menu.classList.remove('open'); signOut(); };
  // Landing nav + footer auth entries
  const lpAuth = (mode, msg) => () => { openAuth(msg); setAuthMode(mode); };
  const bindIf = (id, fn) => { const el = $(id); if (el) el.onclick = fn; };
  bindIf('lp-login', lpAuth('in'));
  bindIf('lp-signup', lpAuth('up', 'Create your free account, 3 exports a week, no card needed.'));
  bindIf('lpf-login', (e) => { e.preventDefault(); lpAuth('in')(); });
  bindIf('lpf-signup', (e) => { e.preventDefault(); lpAuth('up', 'Create your free account, 3 exports a week, no card needed.')(); });
  bindIf('lpf-studio', (e) => { e.preventDefault(); showEasy(null); });
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

  // Step 1, try the browser's own decoder first (Safari does HEIC natively,
  // and plenty of ".heic" files are really JPEGs). Seamless when it works.
  const raw = await blobToDataUrl(file);
  if (await urlDecodes(raw)) return raw;

  // Step 2, convert with heic2any (wasm), verify the result really decodes
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
    // heic2any rejects with {code, message} objects, not Errors, surface the truth
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
    ? 'Saved as shared, connect the backend (README) to publish to everyone'
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
    prev: isPhoto ? 'Your photo, tap to change' : (ez.bg === null ? (isTplPhoto ? 'Template photo, tap to change' : 'Template original, tap to change') : 'Color, tap to change'),
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

// ═══════════════ AI BACKGROUND GENERATION (server-side) ═══════════════
// The prompt work lives in the backend (netlify/functions/api.mjs): the
// customer's words are distilled and fused into the proven house prompt
// there, along with moderation and rate limits. The browser only ever sends
// the raw text and receives an image, no keys, no prompt internals.
async function aiGenerateBg(userText){
  if (DEMO) throw new Error('AI backgrounds need the hosted site');
  if (!account){ openAuth('Sign in to generate AI backgrounds'); throw new Error('Sign in first'); }
  const j = await api('/generate-bg', { text: String(userText || ''), category: jget('pgfx_cat', '') || '' });
  if (!j.image) throw new Error('bad-response');
  return j.image;
}

// ── Admin AI Studio (operators only, hidden nav entry) ──
// Fixed house prompts per Designer Library slot, freely editable, regenerate
// until right, then publish: the image goes live for every visitor instantly
// via the /api/bg/ fallback loader (final print-res copy still ships with the
// next deploy from the local ORCHARD board).
let adminBgUrl = null;
let adminPublished = [];
// Color theory: the BACKDROP carries a supporting field for the template's
// palette, accents pop against it instead of shouting the same accent color.
const ADMIN_PAL_BACKDROP = {
  volt:'cool deep blue tones', gold:'warm honey, brass and cream tones',
  emerald:'fresh soft green and mint tones', royal:'soft violet and lavender tones with warm highlights',
  crimson:'clean warm neutral tones with deep red accents', ocean:'airy teal and sky blue tones',
  paper:'warm cream, tan and parchment tones', rose:'soft blush pink and warm grey tones',
  arctic:'bright icy white and pale blue tones', mono:'clean neutral grey and silver tones',
  sunset:'warm peach, coral and magenta dusk tones', coral:'warm terracotta and sand tones',
};
function adminHousePrompt(m){
  const pal = (m.file.match(/_([a-z]+)\.jpg$/) || [])[1];
  const hue = ADMIN_PAL_BACKDROP[pal] || m.mood;
  return m.scene + ', ' + hue + ' color palette, candid unedited photo taken on a modern smartphone, true to life, natural light, bright airy exposure, lifted shadows, no dark corners, slight handheld imperfection, subtle grain, gently defocused background, no readable text or branding, no people';
}
function adminSlotList(){ return window.BG_MANIFEST || []; }
async function openAdminBg(){
  if (!isAdmin()) return;
  $('adminbg-overlay').classList.add('show');
  const sel = $('adminbg-slot');
  if (!sel.options.length){
    let cat = '';
    for (const m of adminSlotList()){
      if (m.category !== cat){
        cat = m.category;
        const og = document.createElement('optgroup');
        og.label = cat;
        sel.appendChild(og);
      }
      const o = document.createElement('option');
      o.value = m.file;
      o.textContent = m.template + ', ' + m.file;
      sel.lastElementChild.appendChild(o);
    }
    sel.onchange = adminSlotSync;
  }
  try { adminPublished = (await api('/admin/bg-status')).published || []; } catch (e){ adminPublished = []; }
  adminSlotSync();
}
function adminSlotSync(){
  const m = adminSlotList().find(x => x.file === $('adminbg-slot').value) || adminSlotList()[0];
  if (!m) return;
  $('adminbg-prompt').value = adminHousePrompt(m);
  $('adminbg-status').textContent = adminPublished.includes(m.file)
    ? '● published, approving again replaces it' : '○ not published yet (gradient fallback live)';
  $('adminbg-result').classList.remove('show');
  adminBgUrl = null;
}
function bindAdminBg(){
  const ov = $('adminbg-overlay');
  if (!ov) return;
  $('adminbg-close').onclick = () => ov.classList.remove('show');
  $('adminbg-go').onclick = async () => {
    const btn = $('adminbg-go');
    btn.disabled = true; btn.textContent = '… Generating';
    try {
      const j = await api('/admin/generate-bg', { prompt: $('adminbg-prompt').value });
      adminBgUrl = j.image;
      $('adminbg-img').src = j.image;
      $('adminbg-result').classList.add('show');
    } catch (err){ toast('Generation failed: ' + (err.message || 'unknown'), 'error'); }
    btn.disabled = false; btn.textContent = '✦ Generate';
  };
  $('adminbg-approve').onclick = async () => {
    if (!adminBgUrl) return;
    const file = $('adminbg-slot').value;
    const btn = $('adminbg-approve');
    btn.disabled = true;
    try {
      await api('/admin/approve-bg', { filename: file, dataUrl: adminBgUrl });
      if (!adminPublished.includes(file)) adminPublished.push(file);
      $('adminbg-status').textContent = '● published, live for every visitor';
      toast(file + ' is live', 'success');
    } catch (err){ toast('Publish failed: ' + (err.message || 'unknown'), 'error'); }
    btn.disabled = false;
  };
}

let lastGenUrl = null;
function bindBackgroundsUI(){
  const runGen = async () => {
    const btn = $('bg-generate');
    btn.disabled = true; btn.textContent = '… Generating';
    try {
      const url = await aiGenerateBg($('bg-prompt').value);
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
  $('bg-share').onclick = () => publishGenerated(lastGenUrl, $('bg-prompt').value || 'AI background');
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
let ez = { tpl: null, vals:{}, chips:null, bg:null, bgPicked:false, custom:'#2563eb', hidden:{}, bgRecId:null, bgData:null, bgImgObj:null, fx:{ blur:0, overlay:'none', oc:'#000000', os:45 }, styles:{}, customPoints: jget('pgfx_custom_points', []) };
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
// ═══════════════ VARIETY ORDER ═══════════════
/* Every category in BOOK runs through the same layout list in the same
   sequence, so rendering in authored order puts all the gold seals together,
   then all the mono grids, then all the step flows. Scrolling that reads as
   one design repeated with the words changed.

   This reorders a list so CONSECUTIVE entries are as unlike each other as
   possible: greedy, picking the candidate that clashes least with what was
   just placed.

   DETERMINISTIC ON PURPOSE, no Math.random(). freeFirst3() reads the same
   order to decide which templates are free, so a reload must never reshuffle
   what is unlocked. */
/* WHY FAMILY EXISTS. Inside one category the layout name is useless as a
   variety signal: BOOK gives each category every layout exactly once, so
   layout never repeats and the term is always zero. Palette is no better
   (gold is 16 of its 20 designs). What actually makes two gold cards feel
   like the same card is the ARCHETYPE: two emblem-and-crest designs in a row
   read as a repeat even though one is karatSeal and the other trustSeal.
   These groupings are what the eye lumps together. */
/* ═══════════════ CATEGORY ICON SET ═══════════════
   One drawing system, not twenty drawings. Every mark is authored in the same
   100x100 box, inset to a 12-unit margin, and rendered as an OUTLINE at a
   single stroke weight with round caps and round joins. That consistency is
   the whole difference between a set that looks bought and a set that looks
   improvised: uniform weight, uniform corner softness, uniform optical size.
   Nothing here has a hard 90-degree corner or a bare point.

   Outline rather than solid on purpose — these sit on photographic grounds,
   where a solid blob reads as a sticker and an outline reads as a mark.

   Shapes are GENERIC BY SILHOUETTE. A graded slab, a booster pack, a bullion
   bar and a test strip are functional object forms that read instantly as
   their category. Brand logos and game characters are neither ours to ship nor
   safe in a commercial template library — the category is already named in the
   headline copy, which is where a real buyer's nominative reference belongs.

   'sw' overrides the default stroke weight; 'caps' marks a mark that carries
   an extra filled dot (drawn as a round cap on a zero-length segment). */
const ICON_SW = 6.5;
const ICONS = {
  /* — trading cards: pokemon, sports — */
  cardStar:  { d:'M38 10 H62 A12 12 0 0 1 74 22 V78 A12 12 0 0 1 62 90 H38 A12 12 0 0 1 26 78 V22 A12 12 0 0 1 38 10 Z '
                +'M50 34 L54.2 45.6 L66.5 46.1 L56.9 53.7 L60.2 65.5 L50 58.4 L39.8 65.5 L43.1 53.7 L33.5 46.1 L45.8 45.6 Z' , min:34 },
  slab:      { d:'M34 10 H66 A14 14 0 0 1 80 24 V76 A14 14 0 0 1 66 90 H34 A14 14 0 0 1 20 76 V24 A14 14 0 0 1 34 10 Z '
                +'M32 32 H68 M32 46 H68' , min:28 },
  boosterPk: { d:'M28 78 V32 L34 22 L40 32 L46 22 L52 32 L58 22 L64 32 L70 22 L76 32 V78 '
                +'A10 10 0 0 1 66 88 H38 A10 10 0 0 1 28 78 Z M36 52 H68' , min:34 },
  sparkle:   { d:'M50 12 C53 35 65 47 88 50 C65 53 53 65 50 88 C47 65 35 53 12 50 C35 47 47 35 50 12 Z' , min:28 },

  /* — sports — */
  baseball:  { d:'M50 14 A36 36 0 1 0 50 86 A36 36 0 1 0 50 14 Z M29 23 Q41 50 29 77 M71 23 Q59 50 71 77' , min:28 },
  trophy:    { d:'M34 14 H66 V38 A16 16 0 0 1 34 38 Z M34 20 H24 A10 10 0 0 0 34 32 M66 20 H76 A10 10 0 0 1 66 32 '
                +'M50 54 V66 M36 78 H64 A4 4 0 0 1 68 82 V86 H32 V82 A4 4 0 0 1 36 78 Z' , min:34 },

  /* — bullion: gold, silver — */
  barStack:  { d:'M40 26 H60 A4 4 0 0 1 63.6 28.2 L69 40 A4 4 0 0 1 65.4 46 H34.6 A4 4 0 0 1 31 40 L36.4 28.2 A4 4 0 0 1 40 26 Z '
                +'M20 58 H40 A4 4 0 0 1 43.6 60.2 L49 72 A4 4 0 0 1 45.4 78 H14.6 A4 4 0 0 1 11 72 L16.4 60.2 A4 4 0 0 1 20 58 Z '
                +'M60 58 H80 A4 4 0 0 1 83.6 60.2 L89 72 A4 4 0 0 1 85.4 78 H54.6 A4 4 0 0 1 51 72 L56.4 60.2 A4 4 0 0 1 60 58 Z' , min:34 },
  ring:      { d:'M50 18 A32 32 0 1 0 50 82 A32 32 0 1 0 50 18 Z M50 38 A12 12 0 1 0 50 62 A12 12 0 1 0 50 38 Z' , min:28 },
  karatSeal: { d:'M50 10 A26 26 0 1 0 50 62 A26 26 0 1 0 50 10 Z '
                +'M50 24 A12 12 0 1 0 50 48 A12 12 0 1 0 50 24 Z '
                +'M38 58 L32 90 L50 80 L68 90 L62 58', min:28 },

  /* — coins — */
  coinStack: { d:'M50 20 C67 20 80 25 80 31 C80 37 67 42 50 42 C33 42 20 37 20 31 C20 25 33 20 50 20 Z '
                +'M20 31 V47 C20 53 33 58 50 58 C67 58 80 53 80 47 V31 '
                +'M20 47 V63 C20 69 33 74 50 74 C67 74 80 69 80 63 V47' , min:34 },
  loupe:     { d:'M44 14 A28 28 0 1 0 44 70 A28 28 0 1 0 44 14 Z M64 64 L86 86' , min:28 },

  /* — cars — */
  carSide:   { d:'M12 62 V50 A8 8 0 0 1 18 42 L36 38 L47 25 A10 10 0 0 1 55 21 H68 A10 10 0 0 1 76 25 L85 40 '
                +'A8 8 0 0 1 88 48 V62 Z '
                +'M28 62 A11 11 0 1 0 50 62 A11 11 0 1 0 28 62 Z M60 62 A11 11 0 1 0 82 62 A11 11 0 1 0 60 62 Z' , min:34 },
  keyFob:    { d:'M38 12 H62 A12 12 0 0 1 74 24 V58 A12 12 0 0 1 62 70 H38 A12 12 0 0 1 26 58 V24 A12 12 0 0 1 38 12 Z '
                +'M50 30 A6 6 0 1 0 50 42 A6 6 0 1 0 50 30 Z M50 70 V88' , min:28 },

  /* — phones — */
  phone:     { d:'M34 8 H66 A12 12 0 0 1 78 20 V80 A12 12 0 0 1 66 92 H34 A12 12 0 0 1 22 80 V20 A12 12 0 0 1 34 8 Z '
                +'M43 20 H57 M40 80 H60' , min:28 },
  lock:      { d:'M32 46 V33 A18 18 0 0 1 68 33 V46 M28 46 H72 A10 10 0 0 1 82 56 V80 A10 10 0 0 1 72 90 H28 '
                +'A10 10 0 0 1 18 80 V56 A10 10 0 0 1 28 46 Z M50 62 V74' , min:28 },

  /* — diabetic test strips — */
  testStrip: { d:'M38 12 H62 A8 8 0 0 1 70 20 V80 A8 8 0 0 1 62 88 H38 A8 8 0 0 1 30 80 V20 A8 8 0 0 1 38 12 Z '
                +'M41 26 H59 A3 3 0 0 1 62 29 V38 A3 3 0 0 1 59 41 H41 A3 3 0 0 1 38 38 V29 A3 3 0 0 1 41 26 Z '
                +'M42 66 V80 M50 66 V80 M58 66 V80' , min:34 },
  sealedBox: { d:'M50 12 L84 30 V70 L50 88 L16 70 V30 Z M16 30 L50 48 L84 30 M50 48 V88' , min:28 },

  /* — universal trust marks — */
  shieldTick:{ d:'M50 10 L82 22 V48 Q82 74 50 90 Q18 74 18 48 V22 Z M38 50 L47 59 L64 40' , min:28 },
  cashTag:   { d:'M54 12 H80 A8 8 0 0 1 88 20 V46 A8 8 0 0 1 85.6 51.7 L48 89 A8 8 0 0 1 36.7 89 L11 63.3 '
                +'A8 8 0 0 1 11 52 L48.4 14.4 A8 8 0 0 1 54 12 Z M70 30 A5 5 0 1 0 70 30.1 Z' , min:28 },
  boltFast:  { d:'M56 10 L26 54 A3 3 0 0 0 28.5 59 H45 L42 90 L74 44 A3 3 0 0 0 71.5 39 H55 Z' , min:28 },
};
/* Which marks belong to which category. First entry is the category's primary
   mark — the one a layout reaches for when it wants ONE icon. */
const CAT_ICONS = {
  pokemon: ['cardStar','slab','boosterPk','sparkle'],
  sports:  ['slab','baseball','trophy','cardStar'],
  gold:    ['barStack','karatSeal','ring','coinStack'],
  silver:  ['barStack','coinStack','karatSeal','ring'],
  coins:   ['coinStack','loupe','karatSeal','sparkle'],
  cars:    ['carSide','keyFob','cashTag','boltFast'],
  phones:  ['phone','lock','boltFast','shieldTick'],
  strips:  ['sealedBox','testStrip','shieldTick','cashTag'],
};
/* Size-aware. A mark is only offered at a size where its interior still
   reads: 'trophy' and 'boosterPk' carry detail that turns to mush in a 40px
   checklist badge, while 'sparkle' and 'boltFast' survive anywhere. When a
   category has too few marks that fit, the universal trust marks fill in
   rather than repeating one mark down all three rows. */
const ICON_FALLBACK = ['shieldTick','cashTag','boltFast','sparkle'];
const catIcon = (cat, n, px) => {
  const set = CAT_ICONS[cat] || CAT_ICONS.phones;
  if (!px) return set[(n || 0) % set.length];
  let fit = set.filter(k => (ICONS[k].min || 0) <= px);
  ICON_FALLBACK.forEach(k => {
    if (fit.length < 3 && !fit.includes(k) && (ICONS[k].min || 0) <= px) fit.push(k);
  });
  if (!fit.length) fit = ['sparkle'];
  return fit[(n || 0) % fit.length];
};
/* Must run HERE, not with the colour-fix pass ~3600 lines earlier: that pass
   sits above these declarations and applyCategoryMarks closes over catIcon,
   so calling it there threw "Cannot access 'catIcon' before initialization"
   and aborted the whole script before THUMBS was ever created. */
/* The two template passes run at the very END of this file — see the block
   after the last declaration. Calling them here aborted the script on a
   temporal-dead-zone reference and silently killed every const below this
   line, which is invisible from a thumbnail render. */
/* Replaces the generic check glyph in checklist rows with a mark from the
   template's own category, cycling so the three rows never repeat. This is the
   one placement that EARNED its place: tried as a big ghost watermark it was
   invisible at 13% on a photo ground, and as a corner badge it read as a
   sticker and collided with the existing chip row. Here the mark does work —
   'iCLOUD LOCKED, BROKEN' next to a padlock says something three identical
   ticks do not.
   Only an exact tick is replaced. Step NUMBERS and star ratings carry
   information of their own and are deliberately left alone. */
function applyCategoryMarks(t){
  if (!t || !t.layers) return 0;
  let n = 0;
  const drop = new Set();
  t.layers.forEach((l, i) => {
    if (l.kind !== 'text' || !/^[✓✔]$/.test(String(l.text || '').trim())) return;
    const p = l.props || {}, fs = p.fontSize || 38;
    let cx = (p.originX === 'center') ? (p.left || 0) : (p.left || 0) + fs * 0.35;
    let cy = (p.top || 0) + fs * 0.45;
    let size = fs * 1.05, ink = p.fill || '#ffffff';
    /* If the tick sat inside a filled badge, take the badge's ENTIRE footprint
       and its colour, and drop the badge. A 40px mark nested in a 54px disc has
       no room — the object marks carry real interior detail (a ring's gap, a
       seal's tick) that a checkmark does not, so they need the full circle, not
       the space left over inside it. */
    const disc = t.layers.find(x => x.kind === 'circle' && x.props &&
      Math.abs((x.props.left || 0) + (x.props.radius || 0) - cx) < 6 &&
      Math.abs((x.props.top || 0) + (x.props.radius || 0) - cy) < 10);
    if (disc){
      /* Keep the filled badge — it is the bullet list's left anchor, and a bare
         outline mark on a photographic ground reads far weaker than the solid
         disc it replaced. Grow it ~22% instead, so the mark sits INSIDE with
         real breathing room rather than filling it corner to corner. */
      const r = (disc.props.radius || 0) * 1.22;
      disc.props.radius = r;
      disc.props.left = (disc.props.left || 0) - r * 0.18;
      disc.props.top  = (disc.props.top  || 0) - r * 0.18;
      cx = (disc.props.left || 0) + r; cy = (disc.props.top || 0) + r;
      size = r * 1.16;                       // ~58% of the badge diameter
    }
    const mark = { kind: 'path', icon: catIcon(t.cat, n, size), name: l.name, role: l.role,
      props: { left: cx - size / 2, top: cy - size / 2, size: size, fill: ink } };
    if (p.opacity !== undefined) mark.props.opacity = p.opacity;
    t.layers[i] = mark;
    n++;
  });
  if (drop.size) t.layers = t.layers.filter(l => !drop.has(l));
  return n;
}
/* ═══════════════ TYPE WEIGHT FLOOR ═══════════════
   44% of the library was authored at fontWeight:normal, including 351 of 464
   HEADLINES. That reads as thin and generic, and for two families it is worse
   than it looks: Clash Display's lightest vendored cut is 500 and Khand's is
   600, so 'normal' does not render at 400 at all — the browser substitutes the
   lightest cut of a display face, which is the one weight it should never be
   set in. Satoshi does ship a real 400, which is why 283 small labels in it
   were genuinely feather-light.

   Only ever RAISES a weight, and only to a cut that exists on disk — asking for
   a weight with no file lets the browser synthesise or substitute, which is how
   this got weak in the first place. Size carries the hierarchy here (a 212px
   headline over a 39px sub), so a floor does not flatten it.
   'deco' is exempt: those are flourishes, not reading matter. */
const FONT_CUTS = {
  'Clash Display': [500, 600, 700],
  'Satoshi':       [400, 500, 700, 900],
  'Khand':         [600, 700],
  'Melodrama':     [500, 700],
  'Zodiak':        [400, 700],
};
const WEIGHT_FLOOR = { headline:700, phone:800, cta:700, badges:700, sub:600, website:700, info:600 };
function snapCut(family, want){
  const cuts = FONT_CUTS[family] || [400, 700];
  return cuts.find(c => c >= want) || cuts[cuts.length - 1];
}
function enforceTypeWeight(t){
  let bumped = 0;
  (t.layers || []).forEach(l => {
    if (typeof l.text !== 'string') return;
    const p = l.props; if (!p) return;
    if (l.role === 'deco') return;
    const fam = p.fontFamily || 'Satoshi';
    const cur = /^\d+$/.test(String(p.fontWeight)) ? +p.fontWeight
              : (p.fontWeight === 'bold' ? 700 : 400);
    let want = WEIGHT_FLOOR[l.role] || 0;
    // small type needs weight whatever it is doing
    if ((p.fontSize || 0) < 30) want = Math.max(want, 600);
    else if ((p.fontSize || 0) < 46) want = Math.max(want, 500);
    /* Snap ALWAYS, not only when raising. A layer authored at Satoshi 800 or
       Clash 900 names a cut that is not on disk, so the browser substitutes
       or synthesises — the exact failure this pass exists to remove. Snapping
       down to 700 there is honest: 700 is what was already rendering. */
    const snapped = snapCut(fam, Math.max(cur, want));
    if (snapped !== cur){ p.fontWeight = snapped; bumped++; }
  });
  return bumped;
}
/* ═══════════════ PLATE SOLIDITY ═══════════════
   buildLayer() washes every rect to 45% alpha unless it is marked solid, so
   background photography stays visible through colour blocks. That is right for
   decorative blocks and wrong for a PLATE — a chip or bar that exists to carry
   dark ink. Washed to 45% over a dark photo, a #d54d34 plate renders muddy
   brown and near-black type on it disappears; st_gold_cutouthero was shipping
   its phone number, the single most important element on a buyback ad, at
   about 1.2:1.

   The rule is structural, not cosmetic: if a rect carries dark ink, it has to
   be opaque, because the ink's legibility depends on the plate's own lightness
   rather than on whatever photo happens to sit behind it. */
function enforcePlateSolidity(t){
  const lum = hex => {
    const h = String(hex).replace('#','');
    if (!/^[0-9a-f]{6}$/i.test(h)) return null;
    const n = parseInt(h,16);
    const c = [(n>>16)&255,(n>>8)&255,n&255].map(v => { v/=255;
      return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); });
    return 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2];
  };
  let fixed = 0;
  (t.layers || []).forEach(r => {
    if (r.kind !== 'rect' || r.solid || !r.props) return;
    if (typeof r.props.fill !== 'string' || !/^#[0-9a-f]{6}$/i.test(r.props.fill)) return;
    const L = r.props.left || 0, T = r.props.top || 0,
          W = r.props.width || 0, H = r.props.height || 0;
    if (!W || !H) return;
    const carriesDarkInk = (t.layers || []).some(x => {
      if (typeof x.text !== 'string' || !x.props) return false;
      const li = lum(x.props.fill);
      if (li === null || li > 0.4) return false;              // only dark ink matters
      const x0 = x.props.left || 0, y0 = x.props.top || 0;
      return x0 >= L - 10 && x0 <= L + W + 10 && y0 >= T - 10 && y0 <= T + H + 10;
    });
    if (carriesDarkInk){ r.solid = true; fixed++; }
  });
  return fixed;
}
/* ═══════════════ BRAND VOCABULARY ═══════════════
   Recognition comes from NAMES. "We buy phones" is a category; "iPHONE 15 PRO
   MAX · GALAXY S24 · PIXEL 8" is a reason to stop scrolling, and it is what
   every real buyback shopfront puts in its window.

   These are word marks used nominatively — naming the goods this buyer
   actually buys — which is the same basis a pawn shop sign uses. Deliberately
   TEXT ONLY: no logo lockups, no characters, no team or marque artwork. Those
   are protected designs and not ours to redistribute in a template library.

   Only replaces a line that is already an enumeration AND carries no proper
   noun of its own — several categories were authored with good specifics
   ("Base Set • Charizards • 1st Editions", "JORDAN • BRADY • MANTLE") and
   overwriting those would trade real copy for a generic list. Keeps the
   original line COUNT so nothing reflows, and follows the line's own casing. */
const BRAND_WORDS = {
  phones:  ['iPHONE 15 PRO MAX','GALAXY S24 ULTRA','PIXEL 8','iPAD','MACBOOK','APPLE WATCH'],
  pokemon: ['BASE SET','CHARIZARD','1ST EDITION','BOOSTER BOXES','PSA 10','SHADOWLESS'],
  sports:  ['PRIZM','TOPPS CHROME','BOWMAN 1ST','PSA / BGS / SGC','ROOKIE AUTOS','NUMBERED'],
  gold:    ['10K / 14K / 18K / 24K','ROLEX','CARTIER','TIFFANY','DENTAL GOLD','BROKEN CHAINS'],
  silver:  ['SILVER EAGLES','MORGAN DOLLARS','.925 STERLING','100 OZ BARS','JUNK SILVER','FLATWARE'],
  coins:   ['MORGAN','PEACE DOLLAR','WALKING LIBERTY','GOLD EAGLES','PRE-1965','WHEAT CENTS'],
  cars:    ['TOYOTA','HONDA','FORD','CHEVY','BMW','RUNNING OR NOT'],
  strips:  ['ONETOUCH','ACCU-CHEK','FREESTYLE','DEXCOM','CONTOUR','SEALED BOXES'],
};
const LIST_LAYER = /^(Items|Info|Info Text|Devices|Sub|Subline|Who|Reward|Data Line|Offer Line|Line|Body|Detail|Kicker)$/;
/* Proper nouns only — a name a shopper would recognise, never a material or a
   condition. 'sterling', 'dental' and 'broken' describe goods; 'Rolex',
   'Charizard' and 'Accu-Chek' identify them. */
const BRAND_MARKERS = /\b(base set|charizard|pikachu|prizm|topps|bowman|panini|morgan|peace dollar|walking liberty|jordan|mantle|kobe|brady|rolex|cartier|tiffany|omega|iphone|galaxy|pixel|macbook|ipad|samsung|onetouch|accu-?chek|freestyle|dexcom|contour|toyota|honda|ford|chevy|bmw|silver eagle)\b/;
function applyBrandVocab(t){
  const words = BRAND_WORDS[t.cat];
  if (!words) return 0;
  /* "Already branded?" must be judged on DISTINCTIVE names only. Deriving the
     test from the brand list itself meant generic material words leaked into
     it — "Rings • Chains • Coins • Dental • Broken" contains 'dental' and
     'broken', so the gold line was read as already specific and skipped. */
  let done = 0;
  (t.layers || []).forEach(l => {
    if (done || typeof l.text !== 'string') return;
    if (!LIST_LAYER.test(l.name || '')) return;
    const txt = l.text.trim();
    const isList = /[•·]/.test(txt) || txt.split(',').length >= 3;
    if (!isList) return;
    const low = txt.toLowerCase();
    // already names something specific → that copy is better than a generic list
    if (BRAND_MARKERS.test(low)) return;
    const rows = txt.split('\n').length;
    const per = Math.ceil(words.length / rows);
    const lines = [];
    for (let i = 0; i < rows; i++) lines.push(words.slice(i * per, (i + 1) * per).join(' • '));
    let out = lines.filter(Boolean).join('\n');
    if (!out) return;
    // match the line's own voice rather than shouting in a sentence-case block
    if (txt === txt.toUpperCase()) out = out.toUpperCase();
    else out = out.replace(/\b([A-Z])([A-Z']+)\b/g, (m, a, b) => a + b.toLowerCase());
    l.text = out;
    done++;
  });
  return done;
}
/* ═══════════════ TEMPLATE COMPLETION ═══════════════
   50 templates are hand-authored classics rather than generated, and only the
   8 phones ones ever got a photograph. The other 42 were a flat gradient with
   a centred text stack — 5 to 7 elements, no imagery, no structure. Next to a
   designer template carrying a photo, a plate, badges and a category mark they
   read as unfinished, which is exactly how they were described.

   1. A REAL BACKDROP. The pool is derived from what the library already uses
      for that category, so it needs no hard-coded filenames and cannot name a
      file that is not on disk. The old gradient is kept as the fallback, so a
      slow or failed photo still renders the design as authored.
   2. CLEARER COPY. A headline has one job: say what is being bought. Several
      were written as jokes that land only if you already know the trade —
      "GOT A ZARD?" asks a question in a slang term a normal seller has never
      read. Voice is fine; voice INSTEAD OF the offer is not. */
/* The wash has to follow the TEMPLATE'S OWN INK, not a fixed value. Several of
   these classics were authored for a pale, papery ground and set their type in
   near-black; dropping a dark photo and a dark scrim behind those made them
   strictly worse than the flat gradient they started with — cars_plate and
   gold_lux went dark-on-dark. Weighted by size, because a 200px headline
   decides how an ad reads and a 21px website line does not. */
const CLASSIC_SCRIM_DARK  = 0.80;   // peak of a GRADIENT, not a flat wash
const CLASSIC_SCRIM_LIGHT = 0.86;   // peak of a GRADIENT, not a flat wash
function inkLuminance(t){
  const lum = c => {
    const h = String(c).replace('#','');
    if (!/^[0-9a-f]{6}$/i.test(h)) return null;
    const n = parseInt(h,16);
    const ch = [(n>>16)&255,(n>>8)&255,n&255].map(v => { v/=255;
      return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); });
    return 0.2126*ch[0] + 0.7152*ch[1] + 0.0722*ch[2];
  };
  let w = 0, sum = 0;
  (t.layers || []).forEach(l => {
    if (typeof l.text !== 'string' || !l.props || l.role === 'deco') return;
    const L = lum(l.props.fill);
    if (L === null) return;
    const k = l.props.fontSize || 30;
    sum += L * k; w += k;
  });
  return w ? sum / w : 1;
}
function bgPoolByCat(){
  const pool = {};
  TEMPLATES.forEach(t => {
    if (t.bg && t.bg.type === 'image' && t.bg.src && t.cat)
      (pool[t.cat] = pool[t.cat] || []).push(t.bg.src);
  });
  Object.keys(pool).forEach(k => pool[k] = [...new Set(pool[k])].sort());
  return pool;
}
/* Rewritten headlines. Each names the goods; the second line keeps the hook. */
const COPY_FIX = {
  pkm_zard:      { Headline:'WE BUY CHARIZARD', Sub:'BASE SET • 1ST EDITION • SHADOWLESS • GRADED OR RAW' },
  /* Both halves of a split headline must be replaced together or the two lines
     stop agreeing — "WE BUY ROOKIE CARDS / DESERVE GOAT OFFERS" was the result
     of fixing only the first. And a fix keyed to a layer NAME silently does
     nothing when the template names its layers something else, which is why
     sports_score needs Score You / Score Them rather than Headline. */
  sports_goat:   { Headline:'WE BUY ROOKIE CARDS', 'Headline 2':'PAID AT COMPS',
                   Kicker:'JORDAN • MANTLE • BRADY • KOBE' },
  sports_score:  { 'Score You':'YOU KEEP 100%', 'Score Them':'EBAY FEES: $0' },
  cars_plate:    { Headline:'WE BUY CARS', Sub:'ANY YEAR • ANY MAKE • RUNNING OR NOT' },
  pkm_attic:     { Headline:'WE BUY VINTAGE POKÉMON', Sub:'1999 BASE SET • WOTC • BOOSTER BOXES' },
  silver_neon:   { Headline:'WE BUY SILVER', 'Headline 2':'PAID TODAY' },
  silver_ounce:  { Headline:'TOP DOLLAR FOR SILVER' },
  silver_mirror: { Headline:'WE BUY SILVER' },
  coins_graded:  { Headline:'WE BUY GRADED COINS', Sub:'PCGS • NGC • RAW COLLECTIONS WELCOME' },
  strips_pickup: { Headline:'WE BUY TEST STRIPS', Sub:'PRIVATE • DISCREET • PAID ON PICKUP' },
};
function completeTemplate(t, pool){
  let changed = 0;
  if (!t.bg || t.bg.type !== 'image'){
    const list = pool[t.cat];
    if (list && list.length){
      let h = 0;
      for (let i = 0; i < t.id.length; i++) h = (h * 31 + t.id.charCodeAt(i)) >>> 0;
      const darkInk = inkLuminance(t) < 0.42;
      t.bg = { type:'image', src:list[h % list.length],
               scrim: darkInk ? CLASSIC_SCRIM_LIGHT : CLASSIC_SCRIM_DARK,
               scrimColor: darkInk ? '#f4f1ec' : undefined,
               scrimMode: 'gradient',
               blur: 0.02,
               fallback: t.bg || { type:'grad', c1:'#141110', c2:'#2a211b', a:135 } };
      changed++;
    }
  }
  /* STRUCTURE for the sparse ones. A five-element ad is a text stack, and next
     to a designer template with a plate, a badge row and a mark it reads as
     unfinished — which is the whole complaint. Two additions, both derived
     from what the template already declares so neither needs measurement:
       - a solid plate behind the phone number, which is the element every one
         of these ads exists to deliver. alignPass centres the number on it.
       - a category mark above the headline, where these centred stacks have
         dead space.
     Skipped when the template already has a rect in that band, so nothing is
     stacked on an existing plate. */
  const DECO_KIND = /^(vignette|grain|noise|grid|bokeh|beams|spot|diag)$/;
  const bodyCount = (t.layers || []).filter(l => !DECO_KIND.test(l.kind || '')).length;
  if (bodyCount < 8){
    const rects = (t.layers || []).filter(l => l.kind === 'rect' && l.props);
    const phone = (t.layers || []).find(l => l.role === 'phone' && l.props);
    const darkInk = inkLuminance(t) < 0.42;
    if (phone){
      const fs = phone.props.fontSize || 70;
      const top = (phone.props.top || 0) - fs * 0.30;
      const h   = fs * 1.62;
      const clash = rects.some(r => {
        const rt = r.props.top || 0, rh = r.props.height || 0;
        return rt < top + h && rt + rh > top;
      });
      if (!clash){
        t.layers.unshift({ kind:'rect', name:'Phone Plate', solid:true,
          props:{ left:76, top:top, width:928, height:h, rx:18, ry:18,
                  fill: darkInk ? '#12100e' : '#f4f1ec',
                  shadow: { color:'rgba(0,0,0,0.42)', blur:26, offsetX:0, offsetY:10 } } });
        phone.props.fill = darkInk ? '#f7f3ec' : '#141110';
        delete phone.props.grad;
        changed++;
      }
    }
    const head = (t.layers || []).filter(l => l.role === 'headline' && l.props)
      .sort((a,b) => (a.props.top||0) - (b.props.top||0))[0];
    if (head && (head.props.top || 0) > 150 &&
        !(t.layers || []).some(l => l.kind === 'path')){
      const size = 96;
      t.layers.unshift({ kind:'path', icon: catIcon(t.cat, 0, size), name:'Category Mark',
        role:'deco', props:{ left: 540 - size/2, top: (head.props.top||0) - size - 34,
                             size: size, fill: darkInk ? '#12100e' : '#ffffff', opacity: 0.9 } });
      changed++;
    }
  }

  const fix = COPY_FIX[t.id];
  if (fix){
    const hit = new Set();
    (t.layers || []).forEach(l => {
      if (typeof l.text !== 'string') return;
      const rep = fix[l.name];
      if (rep === undefined) return;
      hit.add(l.name);
      if (rep !== l.text){ l.text = rep; changed++; }
    });
    Object.keys(fix).forEach(k => { if (!hit.has(k))
      console.warn('GraphicsStudio: COPY_FIX["' + t.id + '"] names layer "' + k +
        '", which this template does not have — that rewrite did nothing.'); });
  }
  /* Emoji standing in as artwork is the single cheapest-looking thing on a
     page, and there is now a real mark for every category. Only PICTORIAL
     emoji are swapped; ✓ and ★ are typographic and stay. */
  (t.layers || []).forEach((l, i) => {
    if (typeof l.text !== 'string' || l.role !== 'deco') return;
    if (!/[\u{1F300}-\u{1FAFF}\u{2696}\u{26A0}\u{26E9}]/u.test(l.text)) return;
    /* Hands and arrows POINT at something — they are wayfinding, not category
       art, and swapping a 👉 beside "TEXT US NOW" for a phone glyph produced a
       mark that pointed nowhere and sat on the words. Ticks are typographic.
       Drop the gesture rather than translating it. */
    if (/[\u{1F446}-\u{1F44F}\u{261A}-\u{261F}\u{2B05}-\u{2B07}\u{27A1}]/u.test(l.text) ||
        /arrow|point|hand|check|tick/i.test(l.name || '')){
      t.layers[i] = null; changed++; return;
    }
    const p = l.props || {}, size = (p.fontSize || 60) * 1.1;
    const cx = (p.originX === 'center') ? (p.left || 0) : (p.left || 0) + size / 2;
    const cy = (p.top || 0) + size * 0.45;
    t.layers[i] = { kind:'path', icon: catIcon(t.cat, 0, size), name: l.name, role:'deco',
      props:{ left: cx - size / 2, top: cy - size / 2, size: size,
              fill: p.fill || '#ffffff', opacity: p.opacity } };
    changed++;
  });
  if (t.layers.some(l => !l)) t.layers = t.layers.filter(Boolean);
  return changed;
}
/* ═══════════════ INK vs PLATE ═══════════════
   The companion to enforcePlateSolidity. That pass makes a plate opaque when it
   carries dark ink; this one fixes the opposite failure — LIGHT ink on a LIGHT
   plate. cars_plate sets a white headline on a white licence-plate rect, so
   "WE BUY CARS" simply dissolved into its own background.

   Chooses the ink from the plate's luminance rather than from the palette,
   which is the only way to get this right for every plate colour: a plate is
   either light enough to need dark type or dark enough to need light type, and
   nothing else about the design changes that. Runs AFTER solidity, because a
   plate's rendered lightness is what is being judged. */
function enforceInkOnPlate(t){
  const lum = c => {
    const h = String(c).replace('#','');
    if (!/^[0-9a-f]{6}$/i.test(h)) return null;
    const n = parseInt(h,16);
    const ch = [(n>>16)&255,(n>>8)&255,n&255].map(v => { v/=255;
      return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); });
    return 0.2126*ch[0] + 0.7152*ch[1] + 0.0722*ch[2];
  };
  const cr = (a,b) => (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
  let fixed = 0;
  (t.layers || []).forEach(r => {
    if (r.kind !== 'rect' || !r.props) return;
    const pl = lum(r.props.fill);
    if (pl === null) return;
    // a washed rect does not govern its ink; only an opaque plate does
    if (!r.solid && pl < 0.55) return;
    const L = r.props.left||0, T = r.props.top||0, W = r.props.width||0, H = r.props.height||0;
    if (!W || !H) return;
    (t.layers || []).forEach(x => {
      if (typeof x.text !== 'string' || !x.props) return;
      const il = lum(x.props.fill);
      if (il === null) return;
      const x0 = x.props.left||0, y0 = x.props.top||0;
      if (!(x0 >= L-10 && x0 <= L+W+10 && y0 >= T-10 && y0 <= T+H+10)) return;
      if (cr(il, pl) >= 3) return;                       // already separates
      /* Keep the hue. Flattening to pure #ffffff / #12100e bought contrast and
         cost colour, and it is most of why a third of the library ended up with
         a completely neutral money word. liftInk walks the SAME colour to the
         lightness it needs. */
      const up = cr(1, pl) > cr(0.02, pl);
      const tgt = up ? Math.min(0.95, 3*(pl+0.05)-0.05) : Math.max(0.02, (pl+0.05)/3-0.05);
      const ink = liftInk(x.props.fill, tgt, up);
      if (ink !== x.props.fill){ x.props.fill = ink; delete x.props.grad; fixed++; }
    });
  });
  return fixed;
}
/* ═══════════════ INK vs WASH, AND SEPARATION ═══════════════
   A single weighted average is a bad summary of a MIXED-INK template.
   silver_ounce sets a #ffffff headline and a #2a3340 body line; the mean came
   out 0.51, picked a dark wash to suit the headline, and left the body text
   invisible — the card the user could not read.

   So the wash decides the ink, per layer, not the other way round. Text sitting
   on a plate is skipped: its plate governs it, and enforceInkOnPlate already
   handles that case.

   Then SEPARATION. Type on a photograph needs a device or it dissolves into
   whatever happens to be behind it, and the user's own labelled references
   score outline-plus-hard-shadow as their best work. Both are applied here:
   a tight dense shadow on everything, and a contrasting outline on the large
   headlines where it reads as deliberate rather than as a crutch. Scaled off
   the type size so a 220px hero and a 30px label each get it in proportion. */
function washGroundLum(t){
  if (!t.bg) return 0.25;
  /* A GRADED backdrop is no longer "a photo averaging 0.25". The duotone and
     wash styles replace its whole tonal range with two chosen colours, and on
     the wash style the bright end IS the money hue — so estimating the ground
     from the raw photo left yellow type on a yellow ground. Take the grade's
     own colours as the ground before the scrim is applied. */
  /* NOTE: this is an ESTIMATE and it under-reads a graded backdrop. fabric's
     'screen' blend brightens far more than a linear mix of the two grade
     colours suggests — measured 0.062 here against a render that was plainly
     bright. Rather than model the blend, the grades themselves are now kept
     deliberately dark (highlight capped well below the accent, lift under 0.45)
     so the ground stays in a range the authored light type already suits.
     If a future style needs a bright ground, sample the rendered pixels; do not
     trust this number to be exact. */
  let base = 0.25;
  if (t.bg.grade){
    const sLum = hexLum(t.bg.grade.shadow), hLum = hexLum(t.bg.grade.highlight);
    if (sLum !== null && hLum !== null){
      const lift = t.bg.grade.lift === undefined ? 0.72 : t.bg.grade.lift;
      base = Math.min(0.85, (sLum * (1 - lift) + hLum * lift) * 1.9);
    }
  }
  const a = t.bg.scrim || 0;
  const sc = t.bg.scrimColor ? 0.88 : 0.0;
  return a * sc + (1 - a) * base;
}
function hexLum(c){
  const h = String(c).replace('#','');
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  const n = parseInt(h,16);
  const ch = [(n>>16)&255,(n>>8)&255,n&255].map(v => { v/=255;
    return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); });
  return 0.2126*ch[0] + 0.7152*ch[1] + 0.0722*ch[2];
}
/* Move a colour toward white or black until it clears the target, KEEPING ITS
   HUE. Flattening every failing layer to #ffffff would erase the palette. */
function liftInk(hex, target, up){
  const h = String(hex).replace('#','');
  if (!/^[0-9a-f]{6}$/i.test(h)) return up ? '#f7f3ec' : '#141110';
  let n = parseInt(h,16);
  let c = [(n>>16)&255,(n>>8)&255,n&255];
  for (let i = 0; i < 24; i++){
    const L = hexLum('#' + c.map(v=>Math.round(v).toString(16).padStart(2,'0')).join(''));
    if (up ? L >= target : L <= target) break;
    c = c.map(v => up ? v + (255 - v) * 0.18 : v * 0.82);
  }
  return '#' + c.map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('');
}
function inkVsWash(t){
  if (!t.bg || t.bg.type !== 'image') return 0;
  const g = washGroundLum(t);
  const needUp = g < 0.4;
  // luminance at which contrast against this ground reaches 3:1
  const target = needUp ? (3 * (g + 0.05) - 0.05) : ((g + 0.05) / 3 - 0.05);
  const plates = (t.layers || []).filter(l => l.kind === 'rect' && l.props &&
    typeof l.props.fill === 'string' && /^#/.test(l.props.fill));
  /* A text belongs to a plate only if its VERTICAL MIDDLE is inside it. The
     first version tested the top edge with a 10px tolerance, so cars_junk's CTA
     at y=930 counted as sitting on a plate that ends at y=922 — it was then
     skipped by the contrast fix and handed a light halo while actually resting
     on a dark photograph. */
  const plateFor = l => {
    const x = l.props.left || 0;
    const mid = (l.props.top || 0) + (l.props.fontSize || 40) * 0.5;
    return plates.find(r => {
      const L = r.props.left||0, T = r.props.top||0, W = r.props.width||0, H = r.props.height||0;
      return W && H && x >= L - 10 && x <= L + W + 10 && mid >= T && mid <= T + H;
    }) || null;
  };
  let fixed = 0;
  (t.layers || []).forEach(l => {
    if (typeof l.text !== 'string' || !l.props || l.role === 'deco') return;
    const plate = plateFor(l);
    const ground = plate ? hexLum(plate.props.fill) : g;
    if (ground === null) return;
    const il = hexLum(l.props.fill);
    const fs = l.props.fontSize || 40;
    if (il !== null){
      const cr = (Math.max(il,ground)+0.05)/(Math.min(il,ground)+0.05);
      if (cr < 3){
        const up = ground < 0.4;
        const tgt = up ? (3*(ground+0.05)-0.05) : ((ground+0.05)/3-0.05);
        l.props.fill = liftInk(l.props.fill, tgt, up);
        delete l.props.grad;
        fixed++;
      }
    }
    /* Separation devices are for type on a PHOTOGRAPH. On a plate the plate is
       already the separation, and a halo there just fuzzes the letterforms —
       that is what made cars_junk's phone number look smeared. */
    if (plate) return;
    /* The halo tone is decided by ink-vs-GROUND, not by the ink alone. A mid
       grey lifted to #a7a6a6 is "dark" on an absolute scale but LIGHTER than
       the wash it sits on, and giving it a light halo drew a glow around type
       that needed a dark one. What separates a letterform is a ring of the
       tone the ground is not. */
    const inkL = hexLum(l.props.fill);
    const lighterThanGround = (inkL === null) ? true : inkL > ground;
    if (!l.props.shadow){
      l.props.shadow = sh(lighterThanGround ? 'rgba(8,6,4,0.72)' : 'rgba(255,253,248,0.6)',
        Math.max(4, Math.round(fs * 0.10)), 0, Math.max(1, Math.round(fs * 0.02)));
      fixed++;
    }
    if (fs >= 72 && !l.props.stroke){
      l.props.stroke = lighterThanGround ? 'rgba(8,6,4,0.85)' : 'rgba(255,253,248,0.9)';
      l.props.strokeWidth = Math.max(2, Math.round(fs * 0.028));
      fixed++;
    }
  });
  return fixed;
}
/* ═══════════════ BACKDROP NORMALISATION ═══════════════
   Two settings were flattening every photograph in the library, and the
   reference measurements name both.

   BLUR. Defocusing the backdrop was introduced so a borrowed product shot
   would not ghost through a white street wash as a hard-edged rectangle. It
   solved that and cost the thing the "good" folder has most of: detail. Median
   edge density measured 4% here against 29.6% in their good set — a 7x gap,
   and blur is what removes edges. Capped hard; the gradient wash now does the
   separating that the blur was being asked to do.

   FLAT WASH. A single even scrim over a photo yields a grey rectangle: it
   crushes highlights (0.2% of pixels above 0.8 luminance here, against 14.7%
   in their good set) and collapses tonal range (0.53 against 0.87). Every
   backdrop now uses the banded gradient — heavy where the type sits, nearly
   clear across the middle third where the product and its specular highlights
   are. Type carries its own outline and shadow, so it no longer needs the
   whole frame dimmed on its behalf. */
/* Zero, not merely low. Blur exists to stop a borrowed product shot ghosting
   through a flat wash; the banded gradient removes that need, and every unit
   of blur is edge density deleted — the metric with the largest gap to the
   reference set (5.7% here against 29.6% there). */
const MAX_BG_BLUR = 0.004;
function normaliseBackdrop(t){
  if (!t.bg || t.bg.type !== 'image') return 0;
  let n = 0;
  if ((t.bg.blur || 0) > MAX_BG_BLUR){ t.bg.blur = MAX_BG_BLUR; n++; }
  if (t.bg.scrimMode !== 'gradient'){ t.bg.scrimMode = 'gradient'; n++; }
  /* Do NOT boost the value when switching to a gradient. Reasoning that "a
     gradient's middle is clear so the peak can go up" and multiplying by 1.55
     double-counted: median dark share went 47% -> 82% and the photo drowned
     entirely. The authored number is already the right peak; the gradient's job
     is to REMOVE wash from the middle, not add it at the ends. */
  return n;
}
/* ═══════════════ HIGHLIGHT BUDGET ═══════════════
   The reference set puts 6.9-24.3% of its pixels above 0.8 luminance — a
   median of 14.7%. This library measured 0.7%. That single number is most of
   why the ads read flat and cheap next to theirs: there is no bright note
   anywhere, so nothing sparkles and nothing leads the eye.

   The cheapest honest highlight is also the most useful one: put the PHONE
   NUMBER — the element the whole ad exists to deliver — on a bright plate. It
   buys the highlight, the focal point and the hierarchy in one move, which is
   exactly what the good references do with their white number bars.
   Only for dark designs; a light design already has its highlights. */
function highlightBudget(t){
  if (!t.bg || t.bg.type !== 'image' || t.bg.scrimColor) return 0;   // light designs opt out
  const phone = (t.layers || []).find(l => l.role === 'phone' && l.props);
  if (!phone) return 0;
  const fs = phone.props.fontSize || 70;
  const top = (phone.props.top || 0) - fs * 0.30, h = fs * 1.62;

  /* THE PHONE'S ACTUAL HORIZONTAL SPAN.
     This used to be ignored entirely, and it is the whole bug. The host search
     below tested only VERTICAL overlap, so it happily selected a rect that
     shares a y-band with the number but sits somewhere else across the frame —
     duoSplit's "Side Panel" (x -60..500) for a phone at x 624..966, agencyGrid's
     centred "Phone Plate" for a right-anchored number, lowerThird's full-width
     "Third Band" for text hanging off its edge. It then painted THAT rect
     near-white and forced the number to near-black regardless, which is how 29
     templates shipped a black phone number on a dark ground: the bright plate
     the darkening was justified by was never behind the number.

     Text is anchored by originX, so a left-anchored and a right-anchored layer
     with the same `left` occupy completely different space. 0.52em per glyph is
     measured against Satoshi 900 at these sizes, which is what every phone
     layer in the library uses. */
  const glyphs = String(phone.text || '(562) 999-4994').length;
  const approxW = glyphs * fs * 0.52;
  const ox = phone.props.originX;
  const px = phone.props.left || 0;
  const px0 = ox === 'center' ? px - approxW / 2 : ox === 'right' ? px - approxW : px;
  const px1 = px0 + approxW;

  const plates = (t.layers || []).filter(l => l.kind === 'rect' && l.props);
  /* A host must genuinely sit BEHIND the number, in both axes.
     Intersection is not enough. st_gold_pricetag's "Claim Plate" spans y
     836..932 while the phone runs 908..1063, so they overlap by 24px — 15% of
     the number — and the old test accepted it, brightened the plate, and set
     the ink near-black. The result: a black number hanging in open dark space
     under a cream bar that belongs to a different line of copy. Require the
     plate to cover most of the number's height, not merely touch it. */
  const host = plates.find(r => {
    const rt = r.props.top || 0,  rh = r.props.height || 0;
    const rl = r.props.left || 0, rw = r.props.width  || 0;
    if (!rh || !rw) return false;
    const covered = Math.min(rt + rh, top + h) - Math.max(rt, top);
    const vCovers = covered >= h * 0.75;               // most of the number's band
    const hCovers = rl <= px0 + 8 && rl + rw >= px1 - 8;
    return vCovers && hCovers;
  });

  if (host){
    /* Is this plate ALREADY a bright enough ground for dark ink?
       This used to read props.fill only, which is meaningless on a
       gradient-filled plate: buildLayer prefers props.grad, so the check was
       inspecting a value that never reached the screen. A gold "Phone Chip"
       (#d59f34 -> #d56234) is a perfectly good bright ground and must be left
       alone; a near-black "CTA Card" (#17181a -> #020202) is not. Judge by what
       actually paints — the darker gradient stop, since the ink has to survive
       the worst part of the ramp, not the average. */
    const g = host.props.grad;
    const stops = g ? [g.c1, g.c2].filter(Boolean) : [String(host.props.fill || '')];
    const lums = stops.map(c => hexLum(String(c))).filter(v => typeof v === 'number');
    const worst = lums.length ? Math.min(...lums) : null;
    if (worst !== null && worst > 0.45) return 0;        // already bright enough, keep the design

    /* Otherwise this plate becomes the highlight — and the gradient MUST go.
       Setting fill while leaving grad in place changed nothing on screen while
       the code below darkened the phone number to near-black on the strength of
       a brightening that never happened. That mismatch hit 138 of the 200
       plates this pass touches and is the single largest cause of unreadable
       phone numbers in the library. */
    delete host.props.grad;
    host.props.fill = '#f6f2ea'; host.solid = true;
    phone.props.fill = '#141110'; delete phone.props.grad;
    delete phone.props.stroke; delete phone.props.strokeWidth; delete phone.props.shadow;
    return 1;
  }

  /* No plate actually sits behind the number, so build one that does. Sized to
     the number rather than to the frame: a full-bleed 76..1004 bar was the old
     behaviour and it is wrong for a right-anchored or off-centre phone.
     TPL_W, not W: `W` is a closure local inside the layout factories and is NOT
     in scope in the pass chain down here. Using it threw a ReferenceError that
     the render harness swallowed per-template while still reporting a clean
     243/243 — landmine 2, exactly as documented. */
  const padX = Math.max(28, fs * 0.42);
  const pl = Math.max(24, px0 - padX);
  const pr = Math.min(TPL_W - 24, px1 + padX);
  t.layers.unshift({ kind:'rect', name:'Phone Plate', solid:true,
    props:{ left:pl, top:top, width:Math.max(120, pr - pl), height:h, rx:18, ry:18, fill:'#f6f2ea',
            shadow:{ color:'rgba(0,0,0,0.45)', blur:30, offsetX:0, offsetY:12 } } });
  phone.props.fill = '#141110'; delete phone.props.grad;
  delete phone.props.stroke; delete phone.props.strokeWidth; delete phone.props.shadow;
  return 1;
}
/* ═══════════════ BODY PANEL ═══════════════
   Letting the photograph through cost exactly one thing: multi-line body copy
   sitting in the middle band, where the gradient is lightest and the picture is
   busiest. Nine templates adjudicated by eye showed six reading well and three
   failing, and all three failed in the same place.

   Darkening the whole frame again would undo the detail and highlights the
   reference measurements say to keep, so the fix is LOCAL: a soft panel behind
   the body block only. This is also what the good references do — their copy
   sits on a tint, not on bare photography.

   Sized from the authored text, since line count and size are known at build
   time even though the rendered width is not; the panel is inset from the
   canvas like every other block here, and alignPass centres the copy on it. */
function bodyPanel(t){
  if (!t.bg || t.bg.type !== 'image') return 0;
  const light = !!t.bg.scrimColor;
  const plates = (t.layers || []).filter(l => l.kind === 'rect' && l.props);
  let added = 0;
  (t.layers || []).slice().forEach(l => {
    if (typeof l.text !== 'string' || !l.props) return;
    if (!/^(info|sub)$/.test(l.role || '')) return;
    const lines = l.text.split('\n').length;
    const fs = l.props.fontSize || 34;
    if (lines < 2 || fs > 60) return;                 // headlines carry their own outline
    const lh = l.props.lineHeight || 1.4;
    const top = (l.props.top || 0) - fs * 0.34;
    const h = lines * fs * lh + fs * 0.5;
    const mid = top + h / 2;
    // already backed?
    if (plates.some(r => { const rt = r.props.top||0, rh = r.props.height||0;
      return rh && mid > rt && mid < rt + rh; })) return;
    // only where the wash is weakest — the middle third
    if (mid < 300 || mid > 820) return;
    t.layers.unshift({ kind:'rect', name:(l.name || 'Body') + ' Panel', solid:true,
      props:{ left:70, top:top, width:940, height:h, rx:22, ry:22,
              fill: light ? 'rgba(248,245,238,0.82)' : 'rgba(12,10,9,0.62)' } });
    added++;
  });
  return added;
}
/* ═══════════════ OKLCH COLOUR ENGINE ═══════════════
   Every colour operation above used to work on sRGB channels — lightening
   multiplied R, G and B toward 255, darkening multiplied them toward 0. That is
   the mechanical reason the combinations looked wrong, and it is a fault rather
   than a matter of taste: sRGB and HSL are not perceptually uniform, so equal
   numeric steps are NOT equal perceived steps. A yellow and a blue at the same
   nominal lightness look nothing alike in brightness. Ottosson's OKLab fixes
   that by construction — equal moves in L look equal at every hue.

   Three consequences, all applied below:
   - Lightening and darkening move L only, so a tint keeps its hue and its
     colourfulness instead of drifting and washing out.
   - Accents become SPLIT-COMPLEMENTARY (base hue +/-160 degrees) rather than
     exact complements. A true 180-degree pair is the crudest option on the
     wheel: maximum contrast, and it vibrates. Twenty degrees off keeps the
     tension and loses the jangle.
   - Chroma is capped. Everything at full saturation reads as a default. */
const _srgbToLin = v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
const _linToSrgb = v => v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
function hexToOklch(hex){
  const h = String(hex).replace('#','');
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  const n = parseInt(h, 16);
  const r = _srgbToLin(((n>>16)&255)/255),
        g = _srgbToLin(((n>>8)&255)/255),
        b = _srgbToLin((n&255)/255);
  const l = Math.cbrt(0.4122214708*r + 0.5363325363*g + 0.0514459929*b);
  const m = Math.cbrt(0.2119034982*r + 0.6806995451*g + 0.1073969566*b);
  const s2 = Math.cbrt(0.0883024619*r + 0.2817188376*g + 0.6299787005*b);
  const L = 0.2104542553*l + 0.7936177850*m - 0.0040720468*s2;
  const A = 1.9779984951*l - 2.4285922050*m + 0.4505937099*s2;
  const B = 0.0259040371*l + 0.7827717662*m - 0.8086757660*s2;
  return { L, C: Math.hypot(A, B), h: (Math.atan2(B, A) * 180 / Math.PI + 360) % 360 };
}
function oklchToHex(o){
  const hr = o.h * Math.PI / 180;
  const A = Math.cos(hr) * o.C, B = Math.sin(hr) * o.C;
  let l = o.L + 0.3963377774*A + 0.2158037573*B;
  let m = o.L - 0.1055613458*A - 0.0638541728*B;
  let s2 = o.L - 0.0894841775*A - 1.2914855480*B;
  l = l*l*l; m = m*m*m; s2 = s2*s2*s2;
  const r = _linToSrgb( 4.0767416621*l - 3.3077115913*m + 0.2309699292*s2);
  const g = _linToSrgb(-1.2684380046*l + 2.6097574011*m - 0.3413193965*s2);
  const b = _linToSrgb(-0.0041960863*l - 0.7034186147*m + 1.7076147010*s2);
  const cl = v => Math.max(0, Math.min(255, Math.round(v * 255)));
  return '#' + [cl(r), cl(g), cl(b)].map(v => v.toString(16).padStart(2,'0')).join('');
}
/* Gamut-safe. An OKLCH triple can name a colour sRGB cannot show, and clipping
   the channels shifts the HUE. Reduce chroma until it fits instead: the hue and
   lightness the design asked for survive, only the intensity gives way. */
function oklchFit(o){
  let c = o.C;
  for (let i = 0; i < 16; i++){
    const hex = oklchToHex({ L:o.L, C:c, h:o.h });
    const back = hexToOklch(hex);
    if (back && Math.abs(back.L - o.L) < 0.02 && Math.abs(back.C - c) < 0.015) return hex;
    c *= 0.86;
  }
  return oklchToHex({ L:o.L, C:Math.max(0, c), h:o.h });
}
/* Move to a target perceptual lightness, keeping hue. Chroma eases toward zero
   near either end, because a near-white cannot hold colourfulness without
   turning into a pastel smear. */
function setL(hex, L){
  const o = hexToOklch(hex); if (!o) return hex;
  const room = 1 - Math.abs(L - 0.55) / 0.55;
  return oklchFit({ L: Math.max(0.02, Math.min(0.98, L)),
                    C: o.C * Math.max(0.25, room), h: o.h });
}
function splitComp(hex, dir){
  const o = hexToOklch(hex); if (!o) return hex;
  return oklchFit({ L: Math.min(0.78, Math.max(0.45, o.L + 0.06)),
                    C: Math.min(0.16, o.C * 0.92),
                    h: (o.h + (dir < 0 ? -160 : 160) + 360) % 360 });
}
/* k > 1 lightens, k < 1 darkens — in PERCEPTUAL lightness. Scaling sRGB
   channels desaturated as it lightened and shifted hue as it darkened. */
function tint(hex, k){
  const o = hexToOklch(hex); if (!o) return hex;
  return setL(hex, o.L + (k - 1) * 0.42);
}

/* ═══════════════ FILL ENRICHMENT ═══════════════
   Counted across the library: 671 solid rectangle fills against 103 gradients,
   1710 solid text fills against 151. Seven eighths of every colour was a flat
   swatch, which is the whole "looks generic" read — a flat fill has no light in
   it, so nothing on the page looks lit.
   Solids become gradients IN THEIR OWN HUE. Same-hue only: DESIGN-LAW rule 5
   exists because hue-jumping gradients land in the reference folder's MID pile
   every time. Now built through OKLCH, so the light end lifts without going
   chalky and the dark end deepens without going muddy. */
function enrichFills(t){
  let n = 0;
  (t.layers || []).forEach(l => {
    const p = l.props; if (!p || p.grad) return;
    const f = p.fill;
    if (typeof f !== 'string' || !/^#[0-9a-f]{6}$/i.test(f)) return;
    if (l.kind === 'rect'){
      const w = p.width || 0, h = p.height || 0;
      if (w < 90 || h < 26) return;                    // hairlines and rules stay flat
      p.grad = { c1: tint(f, 1.16), c2: tint(f, 0.86), a: 90 };
      n++; return;
    }
    if (typeof l.text === 'string' && l.role !== 'deco'){
      if ((p.fontSize || 0) < 64) return;              // display sizes only
      p.grad = { c1: tint(f, 1.14), c2: tint(f, 0.82), a: 90 };
      n++;
    }
  });
  return n;
}
/* ═══════════════ COLOUR THEORY ═══════════════
   Measured: 83 of 243 templates carried NO hue at all in their money word — a
   third of the library set entirely in white and near-black. Some was authored
   that way; a lot of it was my own contrast passes flattening colour to pure
   neutrals to buy legibility. Either way the result is the same: nothing pops,
   because pop is a hue doing work against another hue.

   COLOR_THEMES already encodes complementary pairs but is only reachable as a
   manual action in Easy mode — the shipped templates never touched it.

   Two moves per template, which is 60-30-10 with a complementary accent:
     - the MONEY WORD takes the category's own saturated hue (a gold ad's word
       is gold; that convention is not up for grabs), and
     - ONE secondary element takes its COMPLEMENT, which is what makes the
       first one vibrate. A warm word alone on a warm photo is monochrome and
       reads flat no matter how saturated it is.
   Both are then re-checked for contrast, hue intact. */
/* Defined in OKLCH, not picked in hex. Each money hue is stated as
   {L, C, h} so its PERCEIVED lightness is comparable across categories — the
   old hand-picked set had a gold at roughly L .80 sitting beside a blue at
   L .55 and called them the same tier, which is why some pairings looked
   broken. L is held in a narrow band, chroma is capped well under the sRGB
   maximum, and the accent is derived as a SPLIT-complement rather than typed
   in by eye. */
const CAT_HUE = {
  phones:  { L:0.72, C:0.165, h: 52 },   // amber-orange
  gold:    { L:0.78, C:0.150, h: 88 },   // gold
  silver:  { L:0.80, C:0.055, h:235 },   // cool pewter
  coins:   { L:0.74, C:0.115, h: 70 },   // bronze
  cars:    { L:0.66, C:0.180, h: 34 },   // hot orange-red
  strips:  { L:0.78, C:0.105, h:195 },   // clinical cyan
  pokemon: { L:0.83, C:0.160, h: 96 },   // yellow
  sports:  { L:0.70, C:0.150, h:150 },   // field green
};
const CAT_COLOUR = (() => {
  const out = {};
  Object.keys(CAT_HUE).forEach(k => {
    const money = oklchFit(CAT_HUE[k]);
    out[k] = { money, comp: splitComp(money, k.length % 2 ? 1 : -1) };
  });
  return out;
})();
function satOf(hex){
  const h=String(hex).replace('#','');
  if(!/^[0-9a-f]{6}$/i.test(h)) return 0;
  const n=parseInt(h,16), r=(n>>16)&255, g=(n>>8)&255, b=n&255;
  const mx=Math.max(r,g,b), mn=Math.min(r,g,b);
  return mx ? (mx-mn)/mx : 0;
}
function colourTheory(t){
  const C = CAT_COLOUR[t.cat]; if (!C) return 0;
  const texts = (t.layers||[]).filter(l => typeof l.text==='string' && l.props && l.role!=='deco');
  if (!texts.length) return 0;
  let n = 0;
  // MONEY WORD = the largest headline. Only recolour when it has no hue of its
  // own; a template that already chose a colour keeps it.
  const heads = texts.filter(l => l.role==='headline')
    .sort((a,b)=>(b.props.fontSize||0)-(a.props.fontSize||0));
  const money = heads[0] || texts.slice().sort((a,b)=>(b.props.fontSize||0)-(a.props.fontSize||0))[0];
  if (money && satOf(money.props.fill) < 0.18 && !money.props.grad){
    money.props.fill = C.money; n++;
  }
  /* The complement goes on a SMALL element — a chip, kicker or CTA. On the
     headline it would fight the money word instead of setting it off, and at
     10% of the frame it is an accent rather than a second subject. */
  const accent = texts.find(l => /^(cta|badges)$/.test(l.role||'') && satOf(l.props.fill) < 0.18)
             || texts.find(l => /kicker|badge|chip|tag/i.test(l.name||'') && satOf(l.props.fill) < 0.18);
  if (accent && !accent.props.grad){ accent.props.fill = C.comp; n++; }
  return n;
}
/* Satoshi is a UI grotesk. It was carrying 46 headlines, which is exactly the
   "typeface looks basic" complaint — it is a body face doing a display job. */
const DISPLAY_FACES = ['Clash Display','Khand','Melodrama','Zodiak'];
function displayFaceFix(t){
  const heads=(t.layers||[]).filter(l=>typeof l.text==='string'&&l.props&&l.role==='headline')
    .sort((a,b)=>(b.props.fontSize||0)-(a.props.fontSize||0));
  const h=heads[0]; if(!h) return 0;
  if ((h.props.fontFamily||'') !== 'Satoshi') return 0;
  let k=0; for (let i=0;i<t.id.length;i++) k=(k*31+t.id.charCodeAt(i))>>>0;
  const face = (typeof STREET_FACE!=='undefined' && STREET_FACE[t.id])
    || DISPLAY_FACES[k % DISPLAY_FACES.length];
  heads.forEach(l => { if ((l.props.fontFamily||'')==='Satoshi') l.props.fontFamily = face; });
  return ++k && 1;
}
/* ═══════════════ OPTICAL TRACKING ═══════════════
   Measured: charSpacing was 0 on all 243 templates, at every size. That single
   default is most of the "typeface looks basic" read, because tracking is not
   one setting — it runs OPPOSITE ways at the two ends of the scale:

     - Big display type needs TIGHTENING. Letterfit is drawn for text sizes, so
       at 200px the gaps grow with the glyphs and the word falls apart. Every
       professionally set poster headline is negative-tracked.
     - Small all-caps labels need OPENING. Caps have no ascender/descender
       rhythm to separate them, so at 28px they clot without extra space.

   Leaving both at zero makes the headline look loose and the label look
   cramped, which reads as "nobody set this" even when the faces are good.
   Values are in fabric's 1/1000 em, applied only where the author left it at
   the default — an explicit choice is respected. */
function opticalTracking(t){
  let n = 0;
  (t.layers || []).forEach(l => {
    if (typeof l.text !== 'string' || !l.props) return;
    if (l.props.charSpacing) return;                 // author chose: leave it
    const fs = l.props.fontSize || 40;
    const caps = l.text === l.text.toUpperCase() && /[A-Z]/.test(l.text);
    let cs;
    if (fs >= 150)      cs = -34;
    else if (fs >= 100) cs = -26;
    else if (fs >= 64)  cs = -16;
    else if (fs >= 44)  cs = caps ? 8 : -6;
    else                cs = caps ? 62 : 0;          // small caps want air
    if (cs){ l.props.charSpacing = cs; n++; }
  });
  return n;
}
/* ═══════════════ STYLE FAMILIES ═══════════════
   Everything in the library was one idea — a photograph, dimmed, with type on
   it — so every refinement to it was worth a few percent and the set still read
   as one design. Three genuinely different treatments instead, assigned across
   the library so a customer scrolling sees real alternatives rather than
   variations, and so the same service can be branded three ways.

     PHOTO    the existing naturalistic treatment. Kept: it is the most credible
              of the three and some categories live or die on showing the goods.
     DUOTONE  the photo graded into the category's two brand hues. Maximum
              colour, maximum contrast, unmistakably art-directed.
     WASH     the photo driven hard through ONE hue — near-monochrome, high
              contrast, the loudest of the three. It keeps the photograph: a
              flat colour ground discards the only detail and palette we have.

   Split deterministically by template id so the assignment is stable across
   reloads, and skewed toward the two new looks because the point is change. */
const STYLE_MIX = ['duotone','wash','duotone','photo','wash','duotone'];
function assignStyle(t){
  if (!t.bg || !t.cat) return 0;
  const C = CAT_COLOUR[t.cat]; if (!C) return 0;
  let h = 0; for (let i = 0; i < t.id.length; i++) h = (h * 33 + t.id.charCodeAt(i)) >>> 0;
  const style = STYLE_MIX[h % STYLE_MIX.length];
  t.style = style;
  if (style === 'duotone' && t.bg.type === 'image' && !t.bg.scrimColor){
    /* Shadows to a deep version of the category hue, highlights to the
       complement — so the grade itself carries the complementary pair rather
       than relying on one chip to do it.

       SHADOW COEFFICIENT 0.18 -> 0.58, LIFT 0.40 -> 0.68.
       Measured, not adjusted by eye. The grade is applied as a multiply blend
       against the shadow colour, and shade(hue, 0.18) is that hue at 18% of its
       perceptual lightness — near black. Multiplying a photograph by near-black
       is a floor on the entire frame, and the screen-blend lift cannot restore
       detail that multiply has already collapsed.

       scripts/darkness_audit.mjs isolated it by re-rendering every backdrop with
       one variable removed at a time:

         as shipped               0.062     <- the whole library
         scrim removed            0.088     (the scrim was never the problem)
         GRADE REMOVED            0.275     <- lands inside the good band
         raw photo                0.384

       against the owner's own labelled GOOD references at 0.21..0.49, median
       0.31. The source photography is already right; the treatment was
       destroying it. 207 of 243 templates sat below the good band.

       This also closes the OTHER measured gap. HANDOFF section 5 records edge
       density 25.8-34% in the good folder against ~8% here, and treats cut-out
       product art as the lever. It is the same cause: crushing the photo to
       near-black deletes the texture that produces edges, so the library's
       remaining edges come almost entirely from its lettering while the
       reference ads carry detail in the photograph itself. Recovering the
       midtones recovers the detail. */
    t.bg.grade = { shadow: shade(C.money, 0.58), highlight: shade(C.comp, 0.42),
                   contrast: 0.22, lift: 0.68 };
    t.bg.scrim = Math.min(t.bg.scrim || 0.5, 0.50);
  }
  if (style === 'wash' && t.bg.type === 'image' && !t.bg.scrimColor){
    /* NO FLAT GROUNDS. Replacing the photo with a colour fill throws away the
       only detail and palette in the frame, and reads as a poster rather than
       an ad for actual goods. This style keeps the photograph and drives ONE
       hue hard through it — near-monochrome, high contrast, the loudest of the
       three — with the complement held back for the small accent. Bold from a
       distance, still a picture of the product up close. */
    /* lift 0.90 drove the highlights all the way to the money hue, so ground
       and money word became the same colour and the word vanished. 0.62 keeps
       the wash unmistakably one-hue while leaving the bright end short of the
       accent itself. */
    /* Shadow 0.08 -> 0.52: same finding as duotone above. This style was the
       darkest in the set (median 0.060) precisely because it multiplies by the
       hue at 8% lightness — effectively black — which is why "near-monochrome
       and high contrast" was rendering as "almost entirely black". A wash still
       reads as one hue driven hard; it just keeps the photograph underneath it,
       which is the stated intent of this style. */
    t.bg.grade = { shadow: shade(C.money, 0.52), highlight: shade(C.money, 0.44),
                   contrast: 0.30, lift: 0.66 };
    t.bg.scrim = Math.min(t.bg.scrim || 0.5, 0.48);
  }
  return 1;
}
/* Toward black in PERCEPTUAL lightness. Multiplying channels by k sent a deep
   gold muddy-green, because the three channels do not carry equal weight. */
function shade(hex, k){
  const o = hexToOklch(hex); if (!o) return '#101014';
  return setL(hex, o.L * k);
}
/* ═══════════════ LIVE TEMPLATE COUNTS ═══════════════
   The library grew from 105 to 153 to 243 and the marketing copy did not
   follow: the plans table was still selling "All 160+ templates" and the
   landing page still said 150+, understating the product by a third on the
   page that asks for money. Fourteen hardcoded numbers across app.js and
   index.html, each of which had to be remembered separately.

   So nothing states a count any more — they are derived and written into the
   copy at boot. A number that is computed cannot go stale. */
function tplCounts(){
  let free = 0;
  TEMPLATES.forEach(t => {
    // the anonymous visitor's view, independent of who is signed in now
    if (t.tier !== 'premium') { free++; return; }
    if (t.cat === 'phones') { free++; return; }
    const f3 = freeFirst3()[t.cat];
    if (f3 && f3.has(t.id)) free++;
  });
  const total = TEMPLATES.length;
  return { total, free, pro: total,
           totalRounded: Math.floor(total / 10) * 10 + '+',
           freeRounded:  Math.floor(free  / 5) * 5 + '+' };
}
function refreshCountCopy(){
  const c = tplCounts();
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const hits = [];
  let n;
  while ((n = walk.nextNode())){
    const v = n.nodeValue;
    if (!v || !/\d+\+?\s*(free\s+)?templates/i.test(v)) continue;
    const out = v
      .replace(/\d+\+?\s*free\s+templates/gi, c.freeRounded + ' free templates')
      .replace(/(?<!free\s)\b\d+\+?\s*templates/gi, c.totalRounded + ' templates');
    if (out !== v){ n.nodeValue = out; hits.push(out.trim().slice(0, 40)); }
  }
  return hits.length;
}
/* ═══════════════ PRODUCT CUTOUT ═══════════════
   An earlier version of this dropped a 600px product onto 216 of 243 templates
   and measured 620 collisions with copy across 195 of them — a product laid
   over the headline, the phone number and the CTA at once. That is not layering,
   it is stacking.

   Rewritten around one rule: THE CUTOUT GOES WHERE THE TYPE IS NOT, and if
   there is nowhere, the ad does without. Most of these layouts are full — an ad
   that is already carrying a headline, three selling points, a CTA and a number
   does not need a picture behind them, and the request was explicitly for art
   only where a design looks plain.

   Occupancy is built from the authored text boxes on a 12x12 grid, the largest
   empty rectangle is found, and the product is fitted inside it with a margin.
   Below 300px of clear space there is no cutout at all. */
const CAT_CUTOUTS = {
  phones:  ['iphones-trio','iphone-cracked','iphone-front','iphones-cash','macbook-open','tablet-watch'],
  gold:    ['gold-bars','gold-chains','gold-jewelry'],
  silver:  ['silver-bars','silver-flatware'],
  coins:   ['coin-stack','coin-slab'],
  cars:    ['car-front','car-keys'],
  strips:  ['strip-boxes','strip-kit'],
  pokemon: ['poke-cards-fan','poke-slab','poke-booster'],
  sports:  ['sports-cards','sports-slab'],
};
/* Width of a text layer, estimated from its own metrics. Build time has no
   font loaded, so this is deliberately GENEROUS — over-reserving space costs a
   cutout, under-reserving costs a collision, and only one of those is visible. */
function estTextBox(l, W){
  const p = l.props || {}, fs = p.fontSize || 30;
  const lines = String(l.text || '').split('\n');
  const longest = lines.reduce((m, x) => Math.max(m, x.length), 0);
  const w = p.width || Math.min(W, longest * fs * 0.62);
  const h = lines.length * fs * (p.lineHeight || 1.32);
  let x = p.left || 0;
  if (p.originX === 'center') x -= w / 2;
  else if (p.originX === 'right') x -= w;
  return { x: x - 18, y: (p.top || 0) - fs * 0.3, w: w + 36, h: h + fs * 0.5 };
}
function addProductCutout(t){
  if (!t.cat || !t.layers) return 0;
  if (t.layers.some(l => l.kind === 'cutout')) return 0;
  const pool = CAT_CUTOUTS[t.cat]; if (!pool || !pool.length) return 0;

  const W = 1080, H = 1080, N = 12, cell = W / N;
  const busy = Array.from({ length: N }, () => new Array(N).fill(false));
  const mark = r => {
    const x0 = Math.max(0, Math.floor(r.x / cell)), x1 = Math.min(N - 1, Math.floor((r.x + r.w) / cell));
    const y0 = Math.max(0, Math.floor(r.y / cell)), y1 = Math.min(N - 1, Math.floor((r.y + r.h) / cell));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) busy[y][x] = true;
  };
  t.layers.forEach(l => {
    if (typeof l.text === 'string' && l.props && l.role !== 'deco') mark(estTextBox(l, W));
    else if (l.kind === 'rect' && l.props && (l.props.width || 0) * (l.props.height || 0) > 12000)
      mark({ x:l.props.left||0, y:l.props.top||0, w:l.props.width||0, h:l.props.height||0 });
    else if (l.kind === 'path' && l.props)
      mark({ x:l.props.left||0, y:l.props.top||0, w:l.props.size||0, h:l.props.size||0 });
  });

  // largest empty square block on the grid (histogram scan, squares only —
  // a product photo wants roughly square space)
  let best = null;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++){
    if (busy[y][x]) continue;
    let k = 0;
    grow: while (y + k < N && x + k < N){
      for (let i = 0; i <= k; i++) if (busy[y + k][x + i] || busy[y + i][x + k]) break grow;
      k++;
    }
    if (k >= 3 && (!best || k > best.k)) best = { x, y, k };
  }
  if (!best) return 0;                                  // nowhere to put it: no cutout

  const px = best.k * cell;
  const SIZE = Math.min(560, px - 26);
  if (SIZE < 300) return 0;                             // too cramped to read as a product

  let h = 0; for (let i = 0; i < t.id.length; i++) h = (h * 31 + t.id.charCodeAt(i)) >>> 0;
  const src = 'assets/cutouts/' + pool[h % pool.length] + '.png';
  const left = best.x * cell + (px - SIZE) / 2;
  const top  = best.y * cell + (px - SIZE) / 2;

  let at = 0;
  while (at < t.layers.length && /^(vignette|grain|noise|grid|bokeh|beams|spot|diag)$/.test(t.layers[at].kind || '')) at++;
  t.layers.splice(at, 0, {
    kind:'cutout', name:'Product', role:'photo',
    props:{ src: src, left: left, top: top, w: SIZE, opacity: 0.97,
            shadow:{ color:'rgba(0,0,0,0.6)', blur:46, offsetX:-10, offsetY:16 } }
  });
  return 1;
}
/* ═══════════════ VERTICAL LISTS, WARMER INK ═══════════════

   1. STACK THE SELLING POINTS. 142 lines across 131 templates ran their points
      horizontally — "Silver Eagles • Morgan Dollars • .925 Sterling" as one
      long row. A row like that is read as a sentence and skimmed as a blur; the
      same three facts stacked are read as a LIST, which is what the reference
      folder's good ads do without exception. Split on the bullet, one point per
      line, and drop the separator — the line break is the separator now.
      Capped at four rows so a long run cannot push the block through the CTA,
      and the type is eased down a little because a stack is taller than a row.

   2. LESS WHITE. 589 of 1445 text fills — 41% — were pure or near-pure white,
      which is most of why the set reads as basic: white is what you use when
      you have not chosen a colour. Every near-white becomes an off-white
      carrying a trace of the category hue. It still reads as white on a photo,
      it is still high contrast, but the page stops looking like default
      settings. Pure white is kept ONLY where it sits on a dark plate, where the
      tint would muddy a deliberate knockout. */
function stackBulletRuns(t){
  let n = 0;
  const layers = t.layers || [];
  /* How much vertical room does this layer actually have? Stacking a
     "A • B • C" run into four lines makes the block ~3x taller, and nothing
     here used to check whether that fits. When it did not, alignPass dragged
     the overgrown block UP to keep it on canvas — straight into the headline
     above it. That is the lowerThird collision: seven templates whose item list
     printed on top of the money word, which the clipping audit could not see
     because the text was, technically, still inside the frame.
     Room is the gap to the nearest thing below that shares horizontal space —
     another layer, or the canvas edge with a margin. */
  const roomBelow = (l) => {
    const p = l.props || {};
    const fs = p.fontSize || 34;
    const approxW = Math.max(120, String(l.text || '').split('\n')
      .reduce((m, s) => Math.max(m, s.length), 0) * fs * 0.5);
    const ox = p.originX;
    const x0 = ox === 'center' ? (p.left || 0) - approxW / 2
             : ox === 'right'  ? (p.left || 0) - approxW : (p.left || 0);
    const x1 = x0 + approxW;
    const myTop = p.top || 0;
    let floor = TPL_H - 34;                       // canvas bottom, with a margin
    layers.forEach(o => {
      if (o === l || !o.props) return;
      const q = o.props;
      const ot = q.top || 0;
      if (ot <= myTop + 4) return;                // not below us
      // only things that actually share our column can crowd us
      const ow = q.width || (typeof o.text === 'string'
        ? String(o.text).length * (q.fontSize || 30) * 0.5 : 0);
      if (!ow) return;
      const oox = q.originX;
      const o0 = oox === 'center' ? (q.left || 0) - ow / 2
               : oox === 'right'  ? (q.left || 0) - ow : (q.left || 0);
      const o1 = o0 + ow;
      if (o1 < x0 + 8 || o0 > x1 - 8) return;     // different column
      if (ot < floor) floor = ot;
    });
    return Math.max(0, floor - myTop);
  };

  layers.forEach(l => {
    if (typeof l.text !== 'string' || !l.props) return;
    if (!/^(info|sub|badges)$/.test(l.role || '') && !/items|info|sub|line|detail/i.test(l.name || '')) return;
    const lines = String(l.text).split('\n');
    const out = [];
    lines.forEach(line => {
      const parts = line.split(/\s*[•·]\s*/).map(x => x.trim()).filter(Boolean);
      if (parts.length >= 3) out.push(...parts);      // a real list
      else out.push(line);
    });
    if (out.length === lines.length) return;          // nothing was stacked

    const fs0 = l.props.fontSize || 34;
    const lh = Math.min(l.props.lineHeight || 1.4, 1.34);
    const fs = out.length > lines.length ? Math.max(24, Math.round(fs0 * 0.86)) : fs0;
    /* Never stack into space that does not exist. Cap the run at the number of
       lines that genuinely fit, so the block stays in its own slot instead of
       being pushed into its neighbour. */
    const room = roomBelow(l);
    const fits = Math.max(1, Math.floor(room / (fs * lh)));
    const kept = out.slice(0, Math.min(4, fits));
    if (kept.length === lines.length) return;         // no room to improve on the original
    l.text = kept.join('\n');
    if (kept.length > lines.length) l.props.fontSize = fs;
    l.props.lineHeight = lh;
    n++;
  });
  return n;
}
const CAT_OFFWHITE = {
  phones:'#fdf3ea', gold:'#fdf6e6', silver:'#eef5fb', coins:'#fbf4e8',
  cars:'#fdf1ea', strips:'#edf7fa', pokemon:'#fdf8e6', sports:'#f0faf2',
};
function warmTheWhites(t){
  const tint = CAT_OFFWHITE[t.cat] || '#fbf6ef';
  const plates = (t.layers || []).filter(l => l.kind === 'rect' && l.props &&
    typeof l.props.fill === 'string' && /^#[0-9a-f]{6}$/i.test(l.props.fill));
  let n = 0;
  (t.layers || []).forEach(l => {
    if (typeof l.text !== 'string' || !l.props) return;
    const f = String(l.props.fill || '');
    if (!/^#[0-9a-f]{6}$/i.test(f)) return;
    const v = parseInt(f.slice(1), 16), r = (v>>16)&255, g = (v>>8)&255, b = v&255;
    const mx = Math.max(r,g,b), mn = Math.min(r,g,b);
    if (mx < 228 || (mx - mn) / mx >= 0.06) return;    // not a white
    // on a dark plate a pure knockout is deliberate; leave it
    const x = l.props.left || 0, y = (l.props.top || 0) + (l.props.fontSize || 30) * 0.5;
    const onDarkPlate = plates.some(p2 => {
      const L=p2.props.left||0,T=p2.props.top||0,W2=p2.props.width||0,H2=p2.props.height||0;
      if (!(W2 && H2 && x>=L-20 && x<=L+W2+20 && y>=T && y<=T+H2)) return false;
      const pv=parseInt(p2.props.fill.slice(1),16);
      return (0.2126*((pv>>16)&255) + 0.7152*((pv>>8)&255) + 0.0722*(pv&255)) / 255 < 0.4;
    });
    if (onDarkPlate) return;
    l.props.fill = tint; n++;
  });
  return n;
}
const LAYOUT_FAMILY = {
  karatSeal:'seal',    trustSeal:'seal',    arcCrown:'seal',
  voltStack:'stack',   slabPoster:'stack',  bandKnockout:'stack',
  glassCard:'panel',   ticketStub:'panel',  editorialLux:'panel', duoSplit:'panel',
  agencyGrid:'data',   checklistHero:'data',stepsFlow:'data',     reviewProof:'data', hudTech:'data',
  diagonalRush:'motion', gradientWave:'motion',
  priceAnchor:'price', bubblePop:'price',
  scriptRetro:'retro', wantedFrame:'retro',
  neonNight:'glow',    lowerThird:'band',
};
const _DIMS_CACHE = new Map();
function tplDims(t){
  let d = _DIMS_CACHE.get(t.id);
  if (d) return d;
  // Designer ids are dl_<cat>_<layout>_<palette>. Everything else is a
  // hand-authored classic, which takes its tag as its family.
  const m = /^dl_([a-z]+)_([A-Za-z]+)_([a-z]+)$/.exec(t.id);
  const classic = 'classic:' + (t.tag || '');
  d = {
    cat:    t.cat,
    layout: m ? m[2] : classic,
    pal:    m ? m[3] : classic,
    tag:    t.tag || '',
    fam:    m ? (LAYOUT_FAMILY[m[2]] || m[2]) : classic,
  };
  _DIMS_CACHE.set(t.id, d);
  return d;
}
// Family is the heaviest because it is the only dimension that discriminates
// inside a single category. Layout, palette and category do the work in mixed
// lists like the landing gallery.
const VAR_W = { fam: 7, layout: 6, cat: 4, pal: 3, tag: 2 };
// An immediate repeat is far worse than one four cards back.
const VAR_RECENCY = [1, 0.6, 0.35, 0.2];
/* `seed` is what the eye has already seen. Passing the first group's tail in
   when ordering a second group stops a repeat landing exactly on the seam
   between them, which is otherwise the one place the greedy cannot see. */
function varietyOrder(list, seed){
  if (list.length < 3) return list.slice();
  const rest = list.slice();
  const hist = seed ? seed.slice(-VAR_RECENCY.length) : [];
  const out = [];
  if (!hist.length){ out.push(rest.shift()); hist.push(out[0]); }  // curated lead
  while (rest.length){
    let best = 0, bestPen = Infinity;
    for (let i = 0; i < rest.length; i++){
      const d = tplDims(rest[i]);
      let pen = 0;
      for (let k = 0; k < VAR_RECENCY.length && k < hist.length; k++){
        const p = tplDims(hist[hist.length - 1 - k]), w = VAR_RECENCY[k];
        if (p.fam    === d.fam)    pen += VAR_W.fam    * w;
        if (p.layout === d.layout) pen += VAR_W.layout * w;
        if (p.cat    === d.cat)    pen += VAR_W.cat    * w;
        if (p.pal    === d.pal)    pen += VAR_W.pal    * w;
        if (p.tag    === d.tag)    pen += VAR_W.tag    * w;
      }
      // strict < means ties fall back to authored order, which keeps the
      // result stable and each category's strongest designs near the front
      if (pen < bestPen){ bestPen = pen; best = i; }
    }
    const picked = rest.splice(best, 1)[0];
    out.push(picked); hist.push(picked);
  }
  return out;
}
// One ordering, used by both the views and the free-tier rule, so "the first
// three you see are free" stays literally true.
function orderedCatList(cat){
  const list = TEMPLATES.filter(t => t.cat === cat);
  const isPhoto = t => !!(t.bg && t.bg.type === 'image');
  // Photo backdrops still lead (the placeholder-bg flow depends on it); the
  // variety pass runs inside each group, and the second group is seeded with
  // the first's tail so the join is varied too.
  const photos = varietyOrder(list.filter(isPhoto));
  return [...photos, ...varietyOrder(list.filter(t => !isPhoto(t)), photos)];
}
function catTemplates(){ return orderedCatList(currentCat); }
let _freeFirst3 = null;
function freeFirst3(){
  // the first 3 templates each category shows are free
  if (_freeFirst3) return _freeFirst3;
  _freeFirst3 = {};
  for (const c of new Set(TEMPLATES.map(t => t.cat)))
    _freeFirst3[c] = new Set(orderedCatList(c).slice(0, 3).map(t => t.id));
  return _freeFirst3;
}
function tplLocked(t){
  if (!t || t.tier !== 'premium') return false;
  if (account && account.role === 'admin') return false;      // operators see everything
  if (t.cat === 'phones') return false;                       // every Phones design is free
  if (freeFirst3()[t.cat] && freeFirst3()[t.cat].has(t.id)) return false;
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
  return b.text.split(/[\u2022\u2713\n]/).map(x => x.trim()).filter(Boolean);
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
  $('ez-download').onclick = () => ezDownload();
  const pk = $('ez-pack');
  if (pk) pk.onclick = exportCategoryPack;
  $('nobg-continue').onclick = () => { $('nobg-overlay').classList.remove('show'); ezDownload(true); };
  $('nobg-select').onclick = () => {
    $('nobg-overlay').classList.remove('show');
    $('ez-swatches').scrollIntoView({ behavior:'smooth', block:'center' });
  };
  $('nobg-overlay').addEventListener('click', e => { if (e.target.id === 'nobg-overlay') $('nobg-overlay').classList.remove('show'); });
  $('ez-upload-bg').onclick = () => $('ez-upload-bg-file').click();
  $('ez-upload-bg-file').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    e.target.value = '';
    try {
      const raw = await fileToDataUrl(f);
      const data = await downscaleDataUrl(raw, 2160);
      const thumb = await downscaleDataUrl(raw, 240);
      const recId = 'bg-' + Date.now();
      await bgPut({ id: recId, name: f.name.slice(0, 40), data, thumb, ts: Date.now(), kind: 'library' });
      useEzPhoto(data, recId);
      toast('Background applied', 'success');
    } catch (err){ if (!err.pgxToasted) toast('That photo could not be read', 'error'); }
  });
  const ezOrder = $('ez-order');
  if (ezOrder) ezOrder.onclick = () => {
    const phone = $('ez-phone').value.trim();
    if (!phone){ toast('Type your phone number first, buyers need to reach you', 'error'); $('ez-phone').focus(); return; }
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
  orig.onclick = () => { ez.bg = null; ez.bgRecId = null; ez.bgPicked = true; syncEzSwatches(); refreshEzRecents(); refreshEzLayers(); schedEzPreview(); };
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
      if (!err.pgxToasted) toast('That photo could not be read, try a JPG, PNG or HEIC', 'error');
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
/* Horizontal scrollers hide their overflow at every viewport width: on a phone
   the strip shows two and a half thumbnails, on a laptop eight of nineteen,
   and nothing on screen says the rest exist. This bolts pop-up arrows and edge
   fades onto any scroller, shown only on the side that actually has more.
   Idempotent: buildEzStrip() replaces the strip's children, never the strip,
   so the shell survives a rebuild. */
function attachStripArrows(strip){
  if (!strip || strip.dataset.arrows) return strip && strip._syncArrows;
  strip.dataset.arrows = '1';
  const shell = document.createElement('div');
  shell.className = 'strip-shell';
  strip.parentNode.insertBefore(shell, strip);
  shell.appendChild(strip);
  const page = dir => strip.scrollBy({
    left: dir * Math.max(160, strip.clientWidth * 0.8), behavior: 'smooth' });
  ['left','right'].forEach(dir => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'strip-arrow ' + dir;
    b.setAttribute('aria-label', dir === 'left' ? 'Scroll back' : 'Scroll for more templates');
    b.innerHTML = dir === 'left' ? '‹' : '›';
    b.onclick = () => page(dir === 'left' ? -1 : 1);
    shell.appendChild(b);
  });
  const sync = () => {
    const max = strip.scrollWidth - strip.clientWidth;
    // scroll-snap-type:x mandatory parks scrollLeft a few px off a clean 0, so
    // the ends need a tolerance or the arrow never hides at the start.
    const EDGE = 4;
    shell.classList.toggle('no-scroll', max <= EDGE);
    shell.classList.toggle('at-start', strip.scrollLeft <= EDGE);
    shell.classList.toggle('at-end', strip.scrollLeft >= max - EDGE);
  };
  strip.addEventListener('scroll', sync, { passive:true });
  window.addEventListener('resize', sync);
  if (window.ResizeObserver) new ResizeObserver(sync).observe(strip);
  // Arrow keys move the strip when focus is inside it.
  strip.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight'){ e.preventDefault(); page(1); }
    if (e.key === 'ArrowLeft'){ e.preventDefault(); page(-1); }
  });
  strip._syncArrows = sync;
  return sync;
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
  attachStripArrows(strip);
  // Thumbnails settle a frame later, so the overflow measurement has to wait.
  requestAnimationFrame(() => strip._syncArrows && strip._syncArrows());
  revealSelectedTpl();
}
// Keep the chosen template on screen: after a category switch or a restore the
// selection is often scrolled far off to one side.
function revealSelectedTpl(){
  const sel = document.querySelector('.ez-tpl.sel');
  if (sel && sel.scrollIntoView) sel.scrollIntoView({ block:'nearest', inline:'center' });
}
function selectEzTpl(id){
  const want = TEMPLATES.find(t => t.id === id);
  if (want && tplLocked(want)){
    openPlans('“' + want.name + '” is a premium template, unlock all 8 designs with Starter or Pro.');
    if (!ez.tpl || tplLocked(ezTpl())) id = firstFreeTplId();
    else return;
  }
  ez.tpl = TEMPLATES.some(t => t.id === id) ? id : firstFreeTplId();
  ez.chips = null; // back to this template's default points
  ez.bgPicked = false; // fresh template → background is a placeholder again
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
    if (cur.length >= 4){ toast('4 points max, short and punchy sells', 'error'); return; }
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
  if (w.length > 16){ toast('Keep it under 16 characters, punchy sells', 'error'); return; }
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

// Greyscale + 20% blur placeholder of a template photo (cached per src).
const EZ_PLACEHOLDER_ELS = {};
function placeholderBgImage(src){
  const el = TPL_BG_ELS[src];
  if (!el || !el.width) return null;
  let p = EZ_PLACEHOLDER_ELS[src];
  if (!p){
    const cv = document.createElement('canvas');
    cv.width = el.width; cv.height = el.height;
    const x = cv.getContext('2d');
    x.filter = 'grayscale(1) blur(' + Math.max(6, Math.round(el.width * 0.02)) + 'px)';
    x.drawImage(el, 0, 0, cv.width, cv.height);
    EZ_PLACEHOLDER_ELS[src] = p = cv;
  }
  try { return new fabric.Image(p); } catch (e){ return null; }
}
function renderEzCanvas(px, fmt, q, mode){
  // Easy Mode is deliberately square-only, the guided flow targets Marketplace
  // & Instagram posts; rectangular formats live in the advanced editor
  const tpl = ezTpl();
  const sc = new fabric.StaticCanvas(null, { width:TPL_W, height:TPL_H, renderOnAddRemove:false });
  // solid base first: guarantees no transparent pixels can ever export as black
  sc.setBackgroundColor('#101014', () => {});
  // Until a background is explicitly picked, the template photo previews as a
  // greyscale 20%-blur placeholder; exports in that state go out on the
  // designed base (mode 'export') so a placeholder never ships in an ad.
  const rawBg = ez.bg || tpl.bg;
  let bgSpec = rawBg;
  let photoOk = false;
  if (!ez.bg && rawBg.type === 'image' && rawBg.src){
    if (mode === 'export' && !ez.bgPicked){
      bgSpec = rawBg.fallback || { type:'solid', c:'#101014' };
    } else {
      const tbg = ez.bgPicked ? freshBgImage(rawBg.src, rawBg.blur, rawBg.grade) : placeholderBgImage(rawBg.src);
      if (tbg){
        sc.setBackgroundImage(coverImage(tbg, TPL_W, TPL_H), () => {});
        if (rawBg.scrim) sc.add(scrimRect(rawBg.scrim, TPL_W, TPL_H, rawBg.scrimColor, rawBg.scrimMode));
        photoOk = true;
      } else bgSpec = rawBg.fallback || { type:'solid', c:'#101014' };
    }
  }
  if (!photoOk && bgSpec.type === 'image'){
    const im = ez.bgImgObj;   // the user's own photo, always theirs to use
    if (im && im.width > 0 && im.height > 0){
      sc.setBackgroundImage(coverImage(im, TPL_W, TPL_H), () => {});
      photoOk = true;
    }
  }
  if (!photoOk){
    // color/gradient backgrounds render as a locked bottom rect with a
    // percentage-unit gradient, unambiguous in fabric, identical at any export size
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
      o.set('text', chips.map(c => '\u2713 ' + c).join('\n'));
      sc.add(o);
      return;
    }
    if (l.role === 'website' && !site) return; // no site typed → leave it off the ad
    const o = buildLayer(l, tpl.id);
    let retyped = false;
    if (l.role === 'phone' && phone){ o.set('text', formatPhone(phone)); retyped = true; }
    else if (l.role === 'website'){ o.set('text', cleanText(site, 'none', 'website')); retyped = true; }
    else {
      const v = (ez.vals[tpl.id] || {})[l.name];
      if (v !== undefined){ o.set('text', cleanText(v, l.casing || 'none', l.role)); retyped = true; }
    }
    /* REFIT. buildLayer() runs fitToDoc() against the AUTHORED words, and this
       is where the visitor's own words replace them — so the fit that was
       computed no longer describes the text on the canvas. Typing a headline
       one word longer than the original ran it straight off both edges, which
       is the single most common thing anyone does in this product.
       Textboxes wrap and look after themselves; single-line text does not. */
    if (retyped && l.kind !== 'textbox' && (o.type === 'i-text' || o.type === 'text')){
      fitToDoc(o, l.props, TPL_W);
      if (l.pgOptical !== false) o.set('left', o.left - opticalLeftShift(o));
    }
    sc.add((l.kind === 'text' || l.kind === 'textbox') ? ezApplyStyle(o, l, tpl.id) : o);
  });
  if (!hasBadgeLayer && chips.length){
    const synth = { kind:'text', name:'Badges', role:'badges', casing:'upper',
      props:{ left: TPL_W-30, top: 30, originX:'right', fontFamily:'Satoshi', fontSize:29, fill:'#ffffff',
              fontWeight:'800', charSpacing:70, lineHeight:1.5, shadow:sh('rgba(0,0,0,0.6)',10,0,3) } };
    const bo = new fabric.IText(chips.map(c => '\u2713 ' + c).join('\n'), Object.assign({}, synth.props, {
      paintFirst:'stroke', name:'Badges', pgRole:'badges', pgCasing:'upper', pgTplId: tpl.id,
    }));
    sc.add(ezApplyStyle(bo, synth, tpl.id));
  }
  alignPass(sc, TPL_W, TPL_H);
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
      bgPicked: ez.bgPicked === true,
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
  ez.bgPicked = st.bgPicked === true;
}
function schedEzPreview(delay){
  persistEzState();
  clearTimeout(ezPrevTimer);
  ezPrevTimer = setTimeout(() => { $('ez-preview').src = renderEzCanvas(560, 'jpeg'); }, delay === 0 ? 0 : 250);
}

// One-click category pack: renders every unlocked template in the current
// category on its own backdrop and downloads a single zip. Operator tool.
async function exportCategoryPack(){
  if (!(account && account.role === 'admin')){ openPlans('Category packs are a Pro roadmap feature.'); return; }
  const phone = $('ez-phone').value.trim();
  if (!phone){ toast('Type your phone number first', 'error'); $('ez-phone').focus(); return; }
  const btn = $('ez-pack');
  btn.disabled = true;
  const label = btn.textContent;
  try {
    if (!window.JSZip) await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      s.onload = res; s.onerror = () => rej(new Error('could not load the zip library'));
      document.head.appendChild(s);
    });
    const zip = new JSZip();
    const list = catTemplates().filter(t => !tplLocked(t));
    const keep = { tpl: ez.tpl, bgPicked: ez.bgPicked };
    let n = 0;
    for (const t of list){
      ez.tpl = t.id; ez.bgPicked = true;   // each template ships on its own backdrop
      btn.textContent = '📦 ' + (++n) + ' / ' + list.length + '…';
      await new Promise(r => setTimeout(r, 25));
      const url = renderEzCanvas(1080, 'png');
      zip.file(t.id + '.png', url.split(',')[1], { base64: true });
    }
    ez.tpl = keep.tpl; ez.bgPicked = keep.bgPicked;
    schedEzPreview(0);
    btn.textContent = '📦 Zipping…';
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = currentCat + '-ad-pack.zip';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast(list.length + ' ads packed, go post them', 'success');
  } catch (err){
    toast('Pack failed: ' + (err.message || 'unknown'), 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = label;
  }
}

async function ezDownload(skipBgCheck){
  const phone = $('ez-phone').value.trim();
  if (!phone){
    toast('Type your phone number first, buyers need to reach you', 'error');
    $('ez-phone').focus();
    $('ez-phone').scrollIntoView({ behavior:'smooth', block:'center' });
    return;
  }
  if (!ez.bg && !ez.bgPicked && skipBgCheck !== true){
    $('nobg-overlay').classList.add('show');
    return;
  }
  const gate = await gateExport(ezExportPx());
  if (!gate) return;
  let url = renderEzCanvas(gate.px, 'png', undefined, (!ez.bg && !ez.bgPicked) ? 'export' : undefined);
  if (gate.watermark) url = await applyWatermark(url, gate.px);
  try { await recordExport(); }
  catch (e){ toast('Export could not be recorded: ' + e.message, 'error'); return; }
  const a = document.createElement('a');
  a.href = url;
  a.download = ezTpl().name.toLowerCase().replace(/[^a-z0-9]+/g,'-') + '-ad-' + gate.px + '.png';
  document.body.appendChild(a); a.click(); a.remove();
  addHistory(a.download, gate.px, url, undefined, undefined, {
    kind: 'ez',
    st: { tpl: ez.tpl, vals: ez.vals, chips: ez.chips, styles: ez.styles, fx: ez.fx, hidden: ez.hidden,
          bgPicked: ez.bgPicked === true,
          bg: (ez.bg && ez.bg.type !== 'image') ? ez.bg : null },
    bgData: (ez.bg && ez.bg.type === 'image' && ez.bgData) ? ez.bgData : null,
  });
  toast('Downloaded, go post it!', 'success');
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
      if (chips.length) o.set('text', chips.map(c => '\u2713 ' + c).join('\n'));
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

  /* Below 1100px the two side panels stop being columns and become absolute
     overlays. Both start open, so on a phone a 300px left drawer and a 300px
     right drawer sat on top of each other over a 393px screen and the canvas
     — the entire point of the editor — was not visible at all.
     Collapse both on narrow screens and let the drawer tabs bring one out at
     a time. Only re-runs when the viewport actually crosses the breakpoint,
     so it never fights a choice the user just made. */
  let _wasNarrow = null;
  function autoCollapseDrawers(){
    const narrow = innerWidth < 1100;
    if (narrow === _wasNarrow) return;
    _wasNarrow = narrow;
    [['panel-left','left-drawer-tab','▶','◀'], ['panel-right','right-drawer-tab','◀','▶']]
      .forEach(([panel, tab, closed, open]) => {
        const p = $(panel); if (!p) return;
        p.classList.toggle('collapsed', narrow);
        const t = $(tab); if (t) t.textContent = narrow ? closed : open;
      });
    if (typeof fitZoom === 'function') setTimeout(fitZoom, 320);
  }
  window.addEventListener('resize', autoCollapseDrawers);

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
  autoCollapseDrawers();

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
const CSS_FALLBACK = "/* ═══════════════════════════════════════════════════════════════════════════\n   GRAPHICS STUDIO — Liquid Glass chrome\n\n   Unified with unified-crm and the iphones.la launcher: same field, same glass\n   recipe, same accent, same radii, same tabular-mono law. The templates this\n   app produces went Liquid Glass on Aug 24; the chrome around them was still\n   flat-black-and-orange 2021 SaaS. Now they are one material.\n\n   Laws, carried over from the CRM theme:\n   1. Chrome is glass. Running text is opaque. A blur is for panels, never\n      for paragraphs.\n   2. ONE accent (#ff7a1a). The site now matches the PRODUCT it sells, not\n      the CRM: a page selling loud buyback ads should not look like a SaaS\n      dashboard. Colour that is not the accent means state:\n      green good, amber caution, red stop, violet AI.\n   3. Brand is not accent. BUYBACK.AD's orange lives in the logo mark and\n      wordmark only, as --brand-1/--brand-2, so the accent can be retuned for\n      contrast without repainting the brand.\n   4. Anything the eye compares — prices, counts, percentages, quotas — is set\n      in tabular mono. This is a tool, not prose.\n\n   Legacy tokens (--orange, --surface2, --muted …) are kept as ALIASES onto the\n   new system because app.js writes them into generated markup in ~250 places.\n   Retargeting --orange to the accent is what repaints those call sites.\n   Do not delete an alias without grepping app.js first.\n   ═══════════════════════════════════════════════════════════════════════════ */\n\n/* ── HOUSE TYPE ──────────────────────────────────────────────────────────────\n   Clash Display for anything that declares, Satoshi for anything that is read,\n   Zodiak when a serif is the point. All three are Fontshare (Indian Type\n   Foundry), free for commercial use, and VENDORED into assets/fonts rather\n   than pulled from a CDN: no third-party dependency, no extra CSP origin, no\n   render-blocking round trip to someone else's server. 184KB for nine files.\n\n   Why these and not the previous set: the library ran on Bebas Neue, Anton,\n   Montserrat, Luckiest Guy, Titan One, Bungee, Monoton and Pacifico. Those are\n   the default free-font shelf every Canva template is already built from, and\n   half of them are novelty faces — the opposite of an ad that asks a stranger\n   to hand over a phone for cash. `font-display:swap` so text paints\n   immediately in the fallback and reflows once the face lands. */\n@font-face{font-family:'Clash Display';src:url('assets/fonts/clash-display-500.woff2') format('woff2');font-weight:500;font-style:normal;font-display:swap}\n@font-face{font-family:'Clash Display';src:url('assets/fonts/clash-display-600.woff2') format('woff2');font-weight:600;font-style:normal;font-display:swap}\n@font-face{font-family:'Clash Display';src:url('assets/fonts/clash-display-700.woff2') format('woff2');font-weight:700;font-style:normal;font-display:swap}\n@font-face{font-family:'Satoshi';src:url('assets/fonts/satoshi-400.woff2') format('woff2');font-weight:400;font-style:normal;font-display:swap}\n@font-face{font-family:'Satoshi';src:url('assets/fonts/satoshi-500.woff2') format('woff2');font-weight:500;font-style:normal;font-display:swap}\n@font-face{font-family:'Satoshi';src:url('assets/fonts/satoshi-700.woff2') format('woff2');font-weight:700;font-style:normal;font-display:swap}\n@font-face{font-family:'Satoshi';src:url('assets/fonts/satoshi-900.woff2') format('woff2');font-weight:900;font-style:normal;font-display:swap}\n@font-face{font-family:'Zodiak';src:url('assets/fonts/zodiak-400.woff2') format('woff2');font-weight:400;font-style:normal;font-display:swap}\n@font-face{font-family:'Zodiak';src:url('assets/fonts/zodiak-700.woff2') format('woff2');font-weight:700;font-style:normal;font-display:swap}\n/* Khand carries the long money-words (\"TEST STRIPS\", \"COLLECTIBLES\") that made\n   a wide face overflow; Melodrama is the high-contrast serif for gold, coins\n   and anything that wants to read as valuation rather than clearance. Two more\n   voices so the 153 templates are not all in one typeface. */\n@font-face{font-family:'Khand';src:url('assets/fonts/khand-600.woff2') format('woff2');font-weight:600;font-style:normal;font-display:swap}\n@font-face{font-family:'Khand';src:url('assets/fonts/khand-700.woff2') format('woff2');font-weight:700;font-style:normal;font-display:swap}\n@font-face{font-family:'Melodrama';src:url('assets/fonts/melodrama-500.woff2') format('woff2');font-weight:500;font-style:normal;font-display:swap}\n@font-face{font-family:'Melodrama';src:url('assets/fonts/melodrama-700.woff2') format('woff2');font-weight:700;font-style:normal;font-display:swap}\n\n/* DARK IS THE DEFAULT, matching the CRM. `data-theme` is stamped on <html>\n   before first paint by the inline script in index.html, so there is no white\n   flash. This rule matches both the explicit choice and the bare default, so\n   dark still applies if that script never runs. */\n:root,\n:root[data-theme='dark']{\n  color-scheme:dark;\n\n  /* Field */\n  --field:#141110;\n  --wash-a:rgba(255,138,40,.34);\n  --wash-b:rgba(255,80,30,.26);\n  --wash-c:rgba(255,196,60,.20);\n\n  /* Glass */\n  --glass-bg:rgba(34,27,23,.62);\n  --glass-bg-strong:rgba(34,27,23,.86);\n  --glass-edge:rgba(255,255,255,.13);\n  --glass-blur:blur(34px) saturate(190%) brightness(1.04);\n  --glass-shadow:inset 0 1px 0 rgba(255,255,255,.09),0 14px 38px -12px rgba(0,0,0,.6);\n  --glass-shadow-lift:inset 0 1px 0 rgba(255,255,255,.11),0 24px 60px -14px rgba(0,0,0,.75);\n\n  /* Opaque content surfaces */\n  --surface-solid:#1d1815;\n  --surface-sunk:rgba(255,255,255,.055);\n  --surface-raise:#262019;\n\n  /* Ink — blue-biased neutrals, chosen not inherited */\n  --text:#f6efe8;\n  --text-2:#cfc2b6;\n  --text-dim:#9a8b7e;\n  --hairline:rgba(255,255,255,.09);\n  --hairline-strong:rgba(255,255,255,.16);\n\n  --accent:#ff7a1a;\n  --accent-ink:#1a0d04;\n  --accent-wash:rgba(255,122,26,.18);\n  --accent-deep:#e04e05;\n\n  --good:#30d68f;\n  --warn:#ffb03d;\n  --danger:#ff6259;\n  --ai:#a78bff;\n\n  /* Brand — the mark's own gradient, deliberately NOT the UI accent. */\n  --brand-1:#ff7a33;\n  --brand-2:#f5a623;\n\n  --r-pill:999px;\n  --r-lg:18px;\n  --r-md:13px;\n  --r-sm:9px;\n  --tap:44px;\n\n  --lift-1:0 1px 2px rgba(0,0,0,.4),0 4px 12px -4px rgba(0,0,0,.5);\n  --lift-2:0 2px 6px rgba(0,0,0,.45),0 18px 42px -14px rgba(0,0,0,.68),0 0 0 1px rgba(255,255,255,.045);\n  --lift-3:0 4px 12px rgba(0,0,0,.5),0 40px 90px -22px rgba(0,0,0,.8),0 0 0 1px rgba(255,255,255,.06);\n  --glow-accent:0 8px 30px -6px rgba(255,122,26,.5);\n\n  --stage-1:#1a1512;\n  --stage-2:#0d0a08;\n  --stage-dot:rgba(255,255,255,.045);\n  --scrim:rgba(14,9,6,.74);\n\n  --mono:ui-monospace,SFMono-Regular,'SF Mono',Menlo,monospace;\n  /* Satoshi runs the whole product, chrome included. The system stack stays\n     behind it as the fallback, so a failed font load degrades to exactly the\n     UI we shipped before rather than to Times. */\n  --ui:'Satoshi',-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Roboto,Helvetica,Arial,sans-serif;\n  --display:'Clash Display','Satoshi',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;\n  --serif:'Zodiak',Georgia,'Times New Roman',serif;\n\n  /* ── legacy aliases (app.js depends on every one of these) ── */\n  --bg:var(--field);\n  --surface:var(--surface-solid);\n  --surface2:var(--surface-raise);\n  --surface3:#33291f;\n  --border:var(--hairline);\n  --border2:var(--hairline-strong);\n  --orange:var(--accent);\n  --orange2:var(--accent-deep);\n  --gold:var(--warn);\n  --green:var(--good);\n  --red:var(--danger);\n  --muted:var(--text-dim);\n  --muted2:var(--text-2);\n  --panel:var(--surface-solid);\n  --panel2:var(--surface-raise);\n  --line:var(--hairline);\n  --r:var(--r-md);\n}\n\n/* LIGHT — opt-in, for daylight and for turning the screen toward someone.\n   Higher specificity than the bare :root above, so it wins wherever the dark\n   default set a value. Radii, faces and the mono stack are theme-independent. */\n:root[data-theme='light']{\n  color-scheme:light;\n  --field:#f6f1ea;\n  --wash-a:rgba(255,122,26,.16);\n  --wash-b:rgba(255,80,30,.11);\n  --wash-c:rgba(255,196,60,.12);\n  --glass-bg:rgba(255,255,255,.58);\n  --glass-bg-strong:rgba(255,255,255,.80);\n  --glass-edge:rgba(255,255,255,.9);\n  --glass-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 -1px 0 rgba(9,18,38,.045),0 1px 2px rgba(9,18,38,.05),0 14px 38px -12px rgba(9,18,38,.16);\n  --glass-shadow-lift:inset 0 1px 0 rgba(255,255,255,.95),0 24px 60px -14px rgba(9,18,38,.30);\n  --surface-solid:#ffffff;\n  --surface-sunk:rgba(9,18,38,.042);\n  --surface-raise:#faf4ec;\n  --text:#1a1310;\n  --text-2:#544639;\n  --text-dim:#6f5d4e;\n  --hairline:rgba(9,18,38,.09);\n  --hairline-strong:rgba(9,18,38,.16);\n  --accent:#c2410c;\n  --accent-ink:#ffffff;\n  --accent-wash:rgba(194,65,12,.13);\n  --accent-deep:#9a3412;\n  --good:#0f9d6b;\n  --warn:#c2751a;\n  --danger:#e0342a;\n  --ai:#6c4cff;\n  --brand-1:#f2600c;\n  --brand-2:#e09417;\n  --lift-1:0 1px 2px rgba(9,18,38,.06),0 4px 12px -4px rgba(9,18,38,.10);\n  --lift-2:0 2px 6px rgba(9,18,38,.07),0 18px 42px -14px rgba(9,18,38,.20),0 0 0 1px rgba(9,18,38,.05);\n  --lift-3:0 4px 12px rgba(9,18,38,.08),0 40px 90px -22px rgba(9,18,38,.28),0 0 0 1px rgba(9,18,38,.06);\n  --glow-accent:0 8px 30px -6px rgba(194,65,12,.34);\n  --stage-1:#f2ece4;\n  --stage-2:#e2d8cc;\n  --stage-dot:rgba(9,18,38,.07);\n  --scrim:rgba(120,132,155,.42);\n  --surface3:#efe6da;\n}\n\n*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}\nhtml{scroll-behavior:smooth}\nbody{\n  font-family:var(--ui);\n  font-size:15px;\n  line-height:1.45;\n  letter-spacing:-.006em;\n  background:var(--field);\n  color:var(--text);\n  overflow-x:hidden;\n  -webkit-font-smoothing:antialiased;\n}\n\n/* THE FIELD — three layers, because one gradient looks like a template.\n   1. Aurora: two large soft colour bodies, off-centre and different sizes, so\n      the eye reads atmosphere rather than wallpaper.\n   2. Geometry: thin arcs and a conic wedge, so a blurred panel moving over an\n      EDGE refracts visibly. Glass over flat colour is just tinted plastic.\n   3. Vignette + grain: corners fall away, and wide displays stop banding. */\nbody::before{\n  content:'';position:fixed;inset:-25%;z-index:-2;pointer-events:none;\n  background:\n    radial-gradient(circle at 78% 18%,transparent 27.4%,rgba(120,160,255,.055) 27.6%,rgba(120,160,255,.055) 28.4%,transparent 28.6%),\n    radial-gradient(circle at 16% 74%,transparent 33.4%,rgba(165,97,255,.05) 33.6%,rgba(165,97,255,.05) 34.3%,transparent 34.5%),\n    conic-gradient(from 210deg at 88% 82%,rgba(0,214,180,.05),transparent 38%),\n    radial-gradient(58% 46% at 12% 4%,var(--wash-a),transparent 66%),\n    radial-gradient(50% 50% at 92% 10%,var(--wash-b),transparent 68%),\n    radial-gradient(64% 52% at 58% 104%,var(--wash-c),transparent 70%);\n  animation:field-drift 48s ease-in-out infinite alternate;\n}\n@keyframes field-drift{\n  from{transform:translate3d(0,0,0) scale(1)}\n  to{transform:translate3d(-1.5%,1.2%,0) scale(1.04)}\n}\nbody::after{\n  content:'';position:fixed;inset:0;z-index:-1;opacity:.5;pointer-events:none;\n  background-image:\n    radial-gradient(120% 90% at 50% 45%,transparent 42%,rgba(0,0,0,.30) 100%),\n    url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/><feColorMatrix type='saturate' values='0'/></filter><rect width='140' height='140' filter='url(%23n)' opacity='.035'/></svg>\");\n}\n/* The editor is a full-height app shell that paints its own stage, so the\n   marketing field would only burn GPU behind it. Driven by :has() rather than\n   a body class, so app.js needs no change to page switching. */\nbody:has(#page-editor.active)::before,\nbody:has(#page-editor.active)::after{display:none}\n\nbutton{font-family:inherit}\ninput,textarea,select{font-family:inherit;color:var(--text)}\n::-webkit-scrollbar{width:10px;height:10px}\n::-webkit-scrollbar-track{background:transparent}\n::-webkit-scrollbar-thumb{background:var(--hairline-strong);border-radius:999px;border:3px solid transparent;background-clip:content-box}\n::-webkit-scrollbar-thumb:hover{background:var(--text-dim);background-clip:content-box}\n:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:8px}\n@media (prefers-reduced-motion:reduce){\n  *,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}\n  body::before{animation:none}\n}\n\n/* ═══════════ HOUSE UTILITIES (shared vocabulary with the CRM) ═══════════ */\n.glass{\n  position:relative;\n  background:var(--glass-bg);\n  -webkit-backdrop-filter:var(--glass-blur);\n  backdrop-filter:var(--glass-blur);\n  border:.5px solid var(--glass-edge);\n  box-shadow:var(--glass-shadow);\n}\n/* A single hairline all the way round reads as a border. Real glass catches\n   light on the edge facing the source and loses it on the far side, so this\n   paints a gradient rim: bright top-left, gone by bottom-right. Cheapest thing\n   that separates \"panel with a border\" from \"pane of glass\". */\n.glass::after{\n  content:'';position:absolute;inset:0;border-radius:inherit;padding:1px;\n  background:linear-gradient(145deg,rgba(255,255,255,.30),rgba(255,255,255,.05) 34%,transparent 60%);\n  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);\n  -webkit-mask-composite:xor;mask-composite:exclude;\n  pointer-events:none;z-index:0;\n}\n.glass>*{position:relative;z-index:1}\n.glass-strong{background:var(--glass-bg-strong)}\n/* Anything the eye compares. */\n.num{font-family:var(--mono);font-variant-numeric:tabular-nums;letter-spacing:-.02em}\n.label{font-size:10.5px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--text-dim)}\n\n/* ═══════════ SHARED ═══════════ */\n.btn{\n  display:inline-flex;align-items:center;justify-content:center;gap:7px;\n  min-height:36px;padding:9px 18px;\n  border-radius:var(--r-pill);\n  font-size:14px;font-weight:600;letter-spacing:-.01em;line-height:1.2;\n  cursor:pointer;border:none;text-decoration:none;white-space:nowrap;\n  transition:transform .08s cubic-bezier(.2,0,0,1),filter .15s ease,background .15s ease,border-color .15s ease,color .15s ease;\n}\n.btn:active{transform:scale(.968)}\n.btn-primary{\n  background:linear-gradient(180deg,var(--accent),var(--accent-deep));\n  color:var(--accent-ink);\n  box-shadow:inset 0 1px 0 rgba(255,255,255,.28),var(--glow-accent);\n}\n.btn-primary:hover{filter:brightness(1.06)}\n.btn-ghost{background:transparent;color:var(--text-2)}\n.btn-ghost:hover{color:var(--text);background:var(--surface-sunk)}\n.btn-outline{\n  background:var(--glass-bg-strong);\n  -webkit-backdrop-filter:var(--glass-blur);backdrop-filter:var(--glass-blur);\n  color:var(--text);border:.5px solid var(--glass-edge);box-shadow:var(--glass-shadow);\n}\n.btn-outline:hover{background:var(--surface-raise);color:var(--text)}\n.btn-dark{background:var(--surface-sunk);color:var(--text);border:1px solid var(--hairline)}\n.btn-dark:hover{background:var(--surface-raise)}\n.btn-xl{padding:15px 30px;font-size:16px;min-height:52px}\n.btn:disabled{opacity:.4;cursor:not-allowed;transform:none}\n\n/* Theme toggle — same control on every surface. */\n.theme-btn{\n  width:36px;height:36px;flex:none;display:inline-grid;place-items:center;\n  border-radius:var(--r-pill);background:transparent;border:none;cursor:pointer;\n  color:var(--text-2);font-size:15px;line-height:1;\n  transition:background .15s ease,color .15s ease;\n}\n.theme-btn:hover{background:var(--surface-sunk);color:var(--text)}\n\n.notif{\n  position:fixed;bottom:26px;left:50%;transform:translate(-50%,16px);\n  background:var(--glass-bg-strong);\n  -webkit-backdrop-filter:var(--glass-blur);backdrop-filter:var(--glass-blur);\n  border:.5px solid var(--glass-edge);color:var(--text);\n  padding:12px 20px;border-radius:var(--r-pill);font-size:14px;font-weight:600;\n  z-index:9500;opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;\n  box-shadow:var(--glass-shadow-lift);max-width:min(90vw,480px);text-align:center;\n}\n.notif.show{opacity:1;transform:translate(-50%,0)}\n.notif.success{box-shadow:var(--glass-shadow-lift),0 0 0 1px rgba(48,214,143,.45)}\n.notif.error{box-shadow:var(--glass-shadow-lift),0 0 0 1px rgba(255,98,89,.5)}\n\n/* modal */\n.modal-overlay{\n  position:fixed;inset:0;background:var(--scrim);\n  -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);\n  z-index:8000;display:none;align-items:center;justify-content:center;padding:24px;\n}\n.modal-overlay.show{display:flex}\n.modal{\n  position:relative;\n  background:var(--glass-bg-strong);\n  -webkit-backdrop-filter:var(--glass-blur);backdrop-filter:var(--glass-blur);\n  border:.5px solid var(--glass-edge);\n  border-radius:22px;width:100%;max-width:520px;padding:26px;\n  box-shadow:var(--glass-shadow-lift);animation:pop .18s cubic-bezier(.2,0,0,1);\n}\n@keyframes pop{from{transform:scale(.96);opacity:0}to{transform:scale(1);opacity:1}}\n.modal h3{font-size:20px;font-weight:700;letter-spacing:-.025em;margin-bottom:4px}\n.modal .modal-sub{font-size:13.5px;color:var(--text-dim);margin-bottom:18px;line-height:1.5}\n.modal label{display:block;font-size:10.5px;font-weight:700;color:var(--text-dim);margin:14px 0 6px;text-transform:uppercase;letter-spacing:.09em}\n.modal input[type=text],.modal input[type=tel],.modal input[type=email],.modal input[type=password]{\n  width:100%;background:var(--surface-raise);border:1px solid var(--hairline-strong);\n  border-radius:var(--r-md);padding:11px 13px;font-size:14px;color:var(--text);\n  transition:border-color .14s ease,box-shadow .14s ease;\n}\n.modal input::placeholder{color:var(--text-dim)}\n.modal input:focus{border-color:var(--accent);outline:none;box-shadow:0 0 0 4px var(--accent-wash)}\n.modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:24px}\n\n/* ═══════════ LANDING ═══════════ */\n#page-landing{min-height:100vh}\n.lp-nav{\n  position:fixed;top:0;left:0;right:0;z-index:300;height:64px;\n  display:flex;align-items:center;gap:8px;padding:0 clamp(16px,4vw,40px);\n  background:var(--glass-bg);\n  -webkit-backdrop-filter:var(--glass-blur);backdrop-filter:var(--glass-blur);\n  border-bottom:.5px solid var(--glass-edge);\n  box-shadow:0 1px 0 rgba(0,0,0,.04),0 10px 30px -20px rgba(0,0,0,.6);\n}\n.logo{\n  font-family:var(--display);font-size:17px;font-weight:600;letter-spacing:-.02em;\n  color:var(--text);text-decoration:none;display:flex;align-items:center;gap:10px;\n  cursor:pointer;background:none;border:none;\n}\n.logo .logo-mark{\n  width:30px;height:30px;border-radius:9px;\n  background:linear-gradient(135deg,var(--brand-1),var(--brand-2));\n  display:inline-flex;align-items:center;justify-content:center;font-size:15px;color:#fff;\n  box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 4px 12px -4px rgba(242,96,12,.5);\n}\n/* Brand warmth lives here and nowhere else. */\n.logo em{\n  font-style:normal;\n  background:linear-gradient(135deg,var(--brand-1),var(--brand-2));\n  -webkit-background-clip:text;background-clip:text;color:transparent;\n}\n.lp-nav-links{display:flex;gap:26px;margin-left:40px}\n.lp-nav-links a{font-size:14px;font-weight:550;color:var(--text-2);text-decoration:none;transition:color .15s}\n.lp-nav-links a:hover{color:var(--text)}\n.lp-nav-right{margin-left:auto;display:flex;align-items:center;gap:8px}\n@media(max-width:640px){\n  .lp-nav-links{display:none}\n  /* 343px of usable nav at 375 viewport cannot hold logo + 4 controls, and\n     overflow-x:hidden was silently clipping \"Make my ad\" off the right edge.\n     Log in / Sign up free stay reachable in the footer's Account column and\n     from the studio itself, so the one conversion button survives here. */\n  #lp-login,#lp-signup{display:none}\n  .lp-nav{gap:4px;padding:0 12px}\n  .lp-nav .btn{padding:9px 14px;font-size:13.5px}\n  .lp-nav .lp-caret{padding:9px 10px}\n  .logo{font-size:15px;gap:8px}\n  .logo .logo-mark{width:26px;height:26px;font-size:13px}\n}\n\n.hero{padding:120px clamp(16px,5vw,48px) 72px;max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center;min-height:min(84vh,760px)}\n@media(max-width:900px){.hero{grid-template-columns:1fr;padding-top:120px;gap:44px;min-height:0}}\n.hero-eyebrow{\n  display:inline-flex;align-items:center;gap:8px;\n  font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;\n  color:var(--accent);background:var(--accent-wash);\n  border:.5px solid rgba(255,122,26,.28);\n  border-radius:var(--r-pill);padding:7px 15px;margin-bottom:22px;\n}\n/* The ceiling at which \"in under a minute.\" still sets on ONE line inside the\n   1.05fr column, MEASURED FOR THE FACE THAT SHIPS. This is face-specific and\n   has now caught two typefaces out: the system stack held one line to 68px,\n   Clash Display breaks at 66 (it runs ~8.4x its size for that string against\n   a 548px column at 1280). Re-measure this if --display ever changes again;\n   guessing produces a four-line ragged hero. */\n.hero h1{font-family:var(--display);font-size:clamp(34px,4.5vw,58px);line-height:1.06;letter-spacing:-.028em;margin-bottom:20px;font-weight:700}\n.hero h1 em{font-style:normal;color:var(--accent)}\n.hero p{font-size:17px;line-height:1.65;color:var(--text-2);max-width:480px;margin-bottom:32px}\n.hero-ctas{display:flex;gap:14px;flex-wrap:wrap}\n.hero-note{margin-top:18px;font-size:13px;color:var(--text-dim)}\n\n/* Height is set by the fan's geometry, not by taste: the front card must start\n   BELOW the back cards' phone-number band or it buries the one element the ad\n   exists to deliver. At 460px with 52% cards it covered 53% and 54% of them. */\n.hero-stack{position:relative;height:500px}\n.hero-card{position:absolute;width:44%;aspect-ratio:1;border-radius:20px;overflow:hidden;border:.5px solid var(--glass-edge);box-shadow:var(--lift-3);background:var(--surface-raise);transition:transform .4s cubic-bezier(.2,0,0,1)}\n.hero-card img{width:100%;height:100%;object-fit:cover;display:block}\n/* Fan geometry is measured, not eyeballed. At 57% wide the three cards came to\n   192% of the stack and the back card was 57% OCCLUDED — its headline was\n   sliced in half, which reads as a broken page rather than a designed stack.\n   At 52% the overlap is ~19%/~18% and, more importantly, all of it lands in\n   the LOWER band: hc3 starts at y=201 of a 460 stack, below where every\n   template puts its headline. Change these together, and re-measure the\n   occlusion if you touch the width. */\n.hero-card.hc1{top:0;left:0;transform:rotate(-8deg);z-index:1}\n.hero-card.hc2{top:4%;right:2%;transform:rotate(6deg);z-index:2}\n.hero-card.hc3{bottom:0;left:20%;transform:rotate(-1deg);z-index:3;box-shadow:var(--lift-3),0 30px 90px -20px rgba(255,122,26,.35)}\n/* Mobile fan. MUST come after the base .hero-card rules: at equal specificity\n   the later rule wins, and an earlier media query silently lost to the 52%\n   default — the block applied, the width did not.\n   Taller and narrower here because at 380px the three cards had nowhere to go\n   and the front one landed across the other two's phone numbers (measured 71%\n   and 55% of the number band covered), which is the one element the ad exists\n   to deliver. */\n@media(max-width:900px){\n  .hero-stack{height:446px;max-width:440px;margin:0 auto;width:100%}\n  .hero-card{width:46%}\n  /* Overlap SIDEWAYS, separate VERTICALLY. Pulling the cards fully apart cleared\n     the phone numbers but lost the stack entirely — three scattered squares, no\n     depth. Horizontal overlap gives the layered read back; the vertical gaps are\n     what keep each card's number band uncovered. */\n  .hero-card.hc1{top:0;left:0}\n  .hero-card.hc2{top:7%;right:4%}\n  .hero-card.hc3{bottom:0;left:17%}\n}\n/* Any card can be brought to the front — hover on a pointer device, press and\n   hold on touch. The whole stack dims slightly so the chosen one reads as\n   picked rather than merely bigger. */\n/* ═══════════ HERO ENTRANCE ═══════════\n   The three cards fly in from below-and-apart and settle into the fan, so the\n   stack assembles itself in front of the visitor instead of being there already.\n   Each card keeps its OWN resting transform, so the animation has to end on that\n   exact value or the card snaps when the keyframes hand back to CSS — hence a\n   per-card @keyframes rather than one shared one.\n   Staggered back-to-front so the card you are meant to read lands last.\n   `animation-fill-mode:both` holds the opening frame during the delay, which is\n   what stops all three flashing at their final position on first paint. */\n@keyframes heroIn1{\n  0%  {opacity:0; transform:translate3d(-38px,64px,0) rotate(-16deg) scale(.9)}\n  60% {opacity:1}\n  100%{opacity:1; transform:translate3d(0,0,0) rotate(-8deg) scale(1)}\n}\n@keyframes heroIn2{\n  0%  {opacity:0; transform:translate3d(38px,72px,0) rotate(14deg) scale(.9)}\n  60% {opacity:1}\n  100%{opacity:1; transform:translate3d(0,0,0) rotate(6deg) scale(1)}\n}\n@keyframes heroIn3{\n  0%  {opacity:0; transform:translate3d(0,88px,0) rotate(6deg) scale(.86)}\n  60% {opacity:1}\n  100%{opacity:1; transform:translate3d(0,0,0) rotate(-1deg) scale(1)}\n}\n/* Cards default to VISIBLE. An earlier version set opacity:0 here and relied on\n   a JS class to reveal them — so the moment requestAnimationFrame did not run\n   (a background tab, a script error anywhere above) the hero was simply blank.\n   The animation supplies its own opening frame through fill-mode:both, so\n   nothing needs to be hidden up front for it to work. Fail visible. */\n.hero-stack.ready .hero-card.hc1{animation:heroIn1 .92s cubic-bezier(.16,.84,.28,1) .05s both}\n.hero-stack.ready .hero-card.hc2{animation:heroIn2 .92s cubic-bezier(.16,.84,.28,1) .17s both}\n.hero-stack.ready .hero-card.hc3{animation:heroIn3 1.0s cubic-bezier(.16,.84,.28,1) .30s both}\n/* Once the entrance has finished the animation is removed entirely, so the\n   hover transform is not fighting a finished animation for the same property.\n   Selector must be enumerated per card: `.hero-stack.settled .hero-card` is\n   three classes and LOSES to `.hero-stack.ready .hero-card.hc1`, which is four\n   — so `animation:none` silently never applied and the cards stayed frozen on\n   the animation's opening frame. Matching specificity, declared later, wins. */\n.hero-stack.settled .hero-card.hc1,\n.hero-stack.settled .hero-card.hc2,\n.hero-stack.settled .hero-card.hc3{animation:none;opacity:1}\n@media (prefers-reduced-motion:reduce){\n  .hero-card{opacity:1}\n  .hero-stack.ready .hero-card{animation:none}\n}\n.hero-card{cursor:pointer;will-change:transform}\n.hero-stack:hover .hero-card,.hero-stack.touching .hero-card{filter:brightness(.72) saturate(.9)}\n/* Hover pulls a card OUT of the stack: z-index above its siblings, straightened,\n   lifted and enlarged. Without the z-index the card grew but stayed underneath,\n   which read as a glitch rather than a pick-up. */\n.hero-card.hc1:hover,.hero-card.hc1.lifted,\n.hero-card.hc2:hover,.hero-card.hc2.lifted,\n.hero-card.hc3:hover,.hero-card.hc3.lifted{z-index:9}\n.hero-card.hc1:hover,.hero-card.hc1.lifted{transform:rotate(-2deg) translateY(-18px) scale(1.09)}\n.hero-card.hc2:hover,.hero-card.hc2.lifted{transform:rotate(1.5deg) translateY(-18px) scale(1.09)}\n.hero-card.hc3:hover,.hero-card.hc3.lifted{transform:rotate(0deg) translateY(-20px) scale(1.09)}\n.hero-card:hover,.hero-card.lifted{\n  z-index:9!important;filter:none!important;\n  box-shadow:var(--lift-3),0 34px 90px -18px rgba(255,122,26,.5);\n}\n.hero-card .hc-skel{position:absolute;inset:0;background:linear-gradient(110deg,var(--surface-raise) 40%,var(--surface-sunk) 50%,var(--surface-raise) 60%);background-size:200% 100%;animation:shimmer 1.4s infinite}\n@keyframes shimmer{to{background-position:-200% 0}}\n\n.lp-section{max-width:1200px;margin:0 auto;padding:80px clamp(16px,5vw,48px)}\n.lp-section-head{margin-bottom:38px}\n.lp-kicker{font-size:11px;font-weight:700;letter-spacing:.11em;text-transform:uppercase;color:var(--accent);margin-bottom:10px}\n.lp-section-head h2{font-family:var(--display);font-size:clamp(30px,4vw,44px);font-weight:600;letter-spacing:-.025em;line-height:1.08}\n.lp-section-head p{color:var(--text-dim);font-size:15px;margin-top:12px;max-width:560px;line-height:1.6}\n\n.tpl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(236px,1fr));gap:20px}\n.tpl-card{position:relative;border-radius:var(--r-lg);overflow:hidden;border:.5px solid var(--glass-edge);background:var(--surface-raise);cursor:pointer;transition:transform .2s cubic-bezier(.2,0,0,1),box-shadow .2s;aspect-ratio:1;box-shadow:var(--lift-1)}\n.tpl-card:hover{transform:translateY(-4px);box-shadow:var(--lift-2),0 16px 48px -14px rgba(255,122,26,.4)}\n.tpl-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}\n.tpl-card .tpl-veil{position:absolute;inset:0;backdrop-filter:blur(1.6px) brightness(.86);transition:backdrop-filter .25s,opacity .25s}\n.tpl-card:hover .tpl-veil{backdrop-filter:blur(0) brightness(1);opacity:0}\n.tpl-card .tpl-meta{position:absolute;left:0;right:0;bottom:0;padding:38px 14px 12px;background:linear-gradient(to top,rgba(0,0,0,.85),transparent);display:flex;align-items:flex-end;justify-content:space-between;gap:8px}\n.tpl-card .tpl-name{font-weight:650;font-size:14.5px;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.7)}\n.tpl-card .tpl-tag{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#ffd7a1;background:rgba(0,0,0,.55);border:.5px solid rgba(255,215,161,.35);border-radius:var(--r-pill);padding:4px 9px}\n.tpl-card .tpl-use{position:absolute;top:12px;right:12px;background:linear-gradient(180deg,var(--accent),var(--accent-deep));color:var(--accent-ink);font-size:12.5px;font-weight:700;padding:8px 14px;border-radius:var(--r-pill);opacity:0;transform:translateY(-6px);transition:opacity .2s,transform .2s;box-shadow:var(--glow-accent)}\n.tpl-card:hover .tpl-use{opacity:1;transform:translateY(0)}\n.tpl-card .tpl-skel{position:absolute;inset:0;background:linear-gradient(110deg,var(--surface-raise) 40%,var(--surface-sunk) 50%,var(--surface-raise) 60%);background-size:200% 100%;animation:shimmer 1.4s infinite}\n.tpl-card.tpl-saved-card .tpl-del{position:absolute;top:12px;left:12px;background:rgba(0,0,0,.6);border:.5px solid rgba(255,255,255,.25);color:#fff;width:30px;height:30px;border-radius:var(--r-pill);cursor:pointer;font-size:14px;opacity:0;transition:opacity .2s}\n.tpl-card.tpl-saved-card:hover .tpl-del{opacity:1}\n.tpl-card .tpl-del:hover{color:var(--danger);border-color:var(--danger)}\n\n.flow{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}\n@media(max-width:820px){.flow{grid-template-columns:1fr}}\n.flow-step{\n  position:relative;background:var(--glass-bg);\n  -webkit-backdrop-filter:var(--glass-blur);backdrop-filter:var(--glass-blur);\n  border:.5px solid var(--glass-edge);border-radius:var(--r-lg);padding:26px;\n  box-shadow:var(--glass-shadow);\n}\n.flow-step .fs-num{font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:11px;font-weight:700;letter-spacing:.12em;color:var(--accent);margin-bottom:14px}\n.flow-step h3{font-size:17px;font-weight:650;letter-spacing:-.02em;margin-bottom:8px}\n.flow-step p{font-size:14px;color:var(--text-dim);line-height:1.6}\n\n.lp-cta{max-width:1200px;margin:0 auto 90px;padding:0 clamp(16px,5vw,48px)}\n.lp-cta-inner{\n  position:relative;overflow:hidden;\n  background:var(--glass-bg);\n  -webkit-backdrop-filter:var(--glass-blur);backdrop-filter:var(--glass-blur);\n  border:.5px solid var(--glass-edge);\n  border-radius:26px;padding:56px 40px;text-align:center;\n  box-shadow:var(--glass-shadow-lift);\n}\n/* A wash of accent inside the pane so the CTA reads as lit rather than tinted. */\n.lp-cta-inner::before{\n  content:'';position:absolute;inset:0;pointer-events:none;\n  background:radial-gradient(70% 120% at 50% 0%,var(--accent-wash),transparent 70%);\n}\n.lp-cta-inner>*{position:relative}\n.lp-cta-inner h2{font-family:var(--display);font-size:clamp(30px,4.4vw,48px);font-weight:600;letter-spacing:-.025em;line-height:1.06;margin-bottom:12px}\n.lp-cta-inner p{color:var(--text-2);margin-bottom:28px;font-size:15px}\n.lp-footer{border-top:1px solid var(--hairline);padding:26px clamp(16px,5vw,48px);display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;color:var(--text-dim);font-size:13px}\n\n\n/* ═══════════ EDITOR ═══════════ */\n#page-editor{display:none;height:100vh;flex-direction:column;overflow:hidden}\n#page-editor.active{display:flex}\n#page-landing.hidden{display:none}\n\n.topbar{\n  height:58px;flex:0 0 58px;display:flex;align-items:center;gap:10px;padding:0 14px;\n  background:var(--glass-bg-strong);\n  -webkit-backdrop-filter:var(--glass-blur);backdrop-filter:var(--glass-blur);\n  border-bottom:.5px solid var(--glass-edge);z-index:100;\n}\n.topbar .logo{font-size:15px}\n.tb-sep{width:1px;height:26px;background:var(--hairline);margin:0 4px}\n.tb-tplname{font-size:13px;font-weight:600;color:var(--text-2);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.tb-btn{display:inline-flex;align-items:center;gap:6px;background:transparent;border:1px solid transparent;color:var(--text-2);font-size:13px;font-weight:600;padding:8px 12px;border-radius:var(--r-pill);cursor:pointer;transition:background .15s,color .15s}\n.tb-btn:hover{background:var(--surface-sunk);color:var(--text)}\n.tb-btn:disabled{opacity:.35;cursor:default;background:transparent}\n.tb-btn svg{width:16px;height:16px}\n.tb-spacer{flex:1}\n/* AI is violet everywhere in the house, never the accent. */\n#enhance-btn{border:.5px solid rgba(167,139,255,.4);color:var(--ai);background:rgba(167,139,255,.10)}\n#enhance-btn:hover{background:rgba(167,139,255,.18);color:var(--ai)}\n#enhance-btn.busy{opacity:.6;pointer-events:none}\n#export-btn{background:linear-gradient(180deg,var(--accent),var(--accent-deep));color:var(--accent-ink);border:none;font-weight:650;box-shadow:inset 0 1px 0 rgba(255,255,255,.28),var(--glow-accent)}\n#export-btn:hover{filter:brightness(1.06)}\n@media(max-width:900px){.tb-label{display:none}}\n/* ── editor topbar below laptop width ─────────────────────────────────────\n   Twelve controls in one non-wrapping row is fine at 1280 and broken\n   everywhere else: at iPad portrait the EXPORT button sat at x=848 on an\n   820px screen, and on an iPhone half the bar was past the right edge with\n   no way to reach it. The bar now scrolls horizontally, every control keeps\n   its full size rather than being squeezed, and Export is pinned to the\n   right edge so the one button that matters is never the one you have to go\n   hunting for. */\n@media(max-width:1100px){\n  .topbar{overflow-x:auto;overflow-y:hidden;scrollbar-width:none}\n  .topbar::-webkit-scrollbar{display:none}\n  .topbar > *{flex:none}\n  .topbar .tb-spacer{flex:1 0 8px}\n  #export-btn{\n    position:sticky;right:0;z-index:2;\n    box-shadow:inset 0 1px 0 rgba(255,255,255,.28),var(--glow-accent),\n               -18px 0 18px -10px var(--glass-bg-strong);\n  }\n}\n/* Touch pointers get the 44px minimum. Height only — widening the nav pills\n   would push the row back off the edge, which is the problem we just fixed. */\n@media(pointer:coarse){\n  .btn,.tb-btn,.ez-adv-link,.view-item,.picker-filters button,.plans-close,.logo{min-height:44px}\n  .theme-btn{width:44px;height:44px}\n  .ez-chip,.chip{min-height:40px}\n}\n\n.editor-body{flex:1;display:flex;overflow:hidden;position:relative}\n\n/* panels as drawers */\n.panel{\n  background:var(--glass-bg-strong);\n  -webkit-backdrop-filter:var(--glass-blur);backdrop-filter:var(--glass-blur);\n  display:flex;flex-direction:column;position:relative;transition:margin .28s cubic-bezier(.2,0,0,1);z-index:50;\n}\n.panel-left{width:300px;flex:0 0 300px;border-right:.5px solid var(--glass-edge)}\n.panel-right{width:300px;flex:0 0 300px;border-left:.5px solid var(--glass-edge)}\n.panel-left.collapsed{margin-left:-300px}\n.panel-right.collapsed{margin-right:-300px}\n.drawer-tab{position:absolute;top:50%;transform:translateY(-50%);width:20px;height:64px;background:var(--glass-bg-strong);-webkit-backdrop-filter:var(--glass-blur);backdrop-filter:var(--glass-blur);border:.5px solid var(--glass-edge);color:var(--text-dim);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px;z-index:60;transition:color .15s,background .15s}\n.drawer-tab:hover{color:var(--text);background:var(--surface-raise)}\n.panel-left .drawer-tab{right:-20px;border-left:none;border-radius:0 10px 10px 0}\n.panel-right .drawer-tab{left:-20px;border-right:none;border-radius:10px 0 0 10px}\n\n.panel-tabs{display:flex;border-bottom:1px solid var(--hairline);flex:0 0 auto}\n.panel-tabs button{flex:1;background:none;border:none;border-bottom:2px solid transparent;color:var(--text-dim);font-size:12.5px;font-weight:650;padding:13px 4px;cursor:pointer;transition:color .15s,border-color .15s;letter-spacing:-.01em}\n.panel-tabs button:hover{color:var(--text-2)}\n.panel-tabs button.active{color:var(--text);border-bottom-color:var(--accent)}\n.panel-scroll{flex:1;overflow-y:auto;padding:16px 14px 40px}\n.panel-tabview{display:none}\n.panel-tabview.active{display:block}\n\n.psec{margin-bottom:22px}\n.psec-title{font-size:10.5px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--text-dim);margin-bottom:10px;display:flex;align-items:center;justify-content:space-between}\n.field{margin-bottom:11px}\n.field label{display:block;font-size:12px;font-weight:600;color:var(--text-2);margin-bottom:5px}\n.field input[type=text],.field input[type=tel],.field input[type=number],.field textarea,.field select{width:100%;background:var(--surface-raise);border:1px solid var(--hairline-strong);border-radius:var(--r-sm);padding:9px 11px;font-size:13px;transition:border-color .14s,box-shadow .14s}\n.field textarea{resize:vertical;min-height:56px;line-height:1.4}\n.field input:focus,.field textarea:focus,.field select:focus{border-color:var(--accent);outline:none;box-shadow:0 0 0 4px var(--accent-wash)}\n.field input[type=number]{font-family:var(--mono);font-variant-numeric:tabular-nums}\n.field-row{display:flex;gap:8px}\n.field-row .field{flex:1}\ninput[type=color]{width:100%;height:34px;border:1px solid var(--hairline-strong);border-radius:var(--r-sm);background:var(--surface-raise);cursor:pointer;padding:3px}\ninput[type=range]{width:100%;accent-color:var(--accent)}\n\n.chips{display:flex;flex-wrap:wrap;gap:7px}\n.chip{background:var(--surface-sunk);border:.5px solid var(--hairline);color:var(--text-2);font-size:12px;font-weight:650;padding:7px 12px;border-radius:var(--r-pill);cursor:pointer;transition:all .13s;letter-spacing:-.005em}\n.chip:hover{border-color:var(--accent);color:var(--accent);background:var(--accent-wash)}\n\n.seg{display:flex;background:var(--surface-sunk);border:.5px solid var(--hairline);border-radius:var(--r-pill);overflow:hidden;padding:3px;gap:3px}\n.seg button{flex:1;background:none;border:none;color:var(--text-dim);font-size:12px;font-weight:650;padding:7px 6px;cursor:pointer;border-radius:var(--r-pill);transition:background .13s,color .13s}\n.seg button.active{background:var(--surface-raise);color:var(--text);box-shadow:var(--lift-1)}\n.seg button:hover:not(.active){color:var(--text-2)}\n\n.add-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}\n.add-btn{background:var(--surface-sunk);border:.5px solid var(--hairline);border-radius:var(--r-md);color:var(--text-2);font-size:12.5px;font-weight:600;padding:13px 8px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px;transition:all .13s}\n.add-btn:hover{border-color:var(--accent);color:var(--text);background:var(--accent-wash)}\n.add-btn .ab-ico{font-size:19px;line-height:1}\n.emoji-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}\n.emoji-grid button{background:var(--surface-sunk);border:.5px solid var(--hairline);border-radius:var(--r-sm);font-size:21px;padding:8px 0;cursor:pointer;transition:all .13s}\n.emoji-grid button:hover{border-color:var(--accent);transform:scale(1.08)}\n\n.mini-tpl-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}\n.mini-tpl{position:relative;border-radius:var(--r-md);overflow:hidden;border:.5px solid var(--hairline);cursor:pointer;aspect-ratio:1;background:var(--surface-raise);transition:box-shadow .15s,transform .15s}\n.mini-tpl:hover{transform:translateY(-2px);box-shadow:var(--lift-2)}\n.mini-tpl.current{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent)}\n.mini-tpl img{width:100%;height:100%;object-fit:cover;display:block}\n.mini-tpl .mt-name{position:absolute;left:0;right:0;bottom:0;font-size:10.5px;font-weight:650;color:#fff;padding:14px 7px 5px;background:linear-gradient(to top,rgba(0,0,0,.85),transparent);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.mini-tpl .mt-del{position:absolute;top:5px;right:5px;width:22px;height:22px;border-radius:var(--r-pill);background:rgba(0,0,0,.6);border:.5px solid rgba(255,255,255,.25);color:#fff;font-size:11px;cursor:pointer;opacity:0;transition:opacity .15s}\n.mini-tpl:hover .mt-del{opacity:1}\n.mini-tpl .mt-del:hover{color:var(--danger);border-color:var(--danger)}\n.empty-hint{font-size:12.5px;color:var(--text-dim);line-height:1.55;background:var(--surface-sunk);border:1px dashed var(--hairline-strong);border-radius:var(--r-md);padding:14px;text-align:center}\n\n/* stage */\n.stage{flex:1;position:relative;display:flex;overflow:auto;padding:26px;box-sizing:border-box;background:radial-gradient(circle at 50% 40%,var(--stage-1) 0%,var(--stage-2) 100%)}\n.stage::before{content:'';position:absolute;inset:0;background-image:radial-gradient(var(--stage-dot) 1px,transparent 1px);background-size:26px 26px;pointer-events:none}\n#canvas-holder{position:relative;box-shadow:var(--lift-3);border-radius:6px;overflow:hidden;margin:auto}\n#guide-v,#guide-h{position:absolute;background:var(--accent);opacity:0;pointer-events:none;transition:opacity .08s;z-index:20;box-shadow:0 0 6px rgba(255,122,26,.9)}\n#guide-v{top:0;bottom:0;left:50%;width:1px;transform:translateX(-.5px)}\n#guide-h{left:0;right:0;top:50%;height:1px;transform:translateY(-.5px)}\n#guide-v.on,#guide-h.on{opacity:1}\n.zoombar{\n  position:absolute;right:18px;bottom:16px;display:flex;align-items:center;gap:2px;\n  background:var(--glass-bg-strong);\n  -webkit-backdrop-filter:var(--glass-blur);backdrop-filter:var(--glass-blur);\n  border:.5px solid var(--glass-edge);border-radius:var(--r-pill);padding:4px;z-index:70;\n  box-shadow:var(--glass-shadow-lift);\n}\n.zoombar button{background:none;border:none;color:var(--text-2);width:30px;height:30px;border-radius:var(--r-pill);cursor:pointer;font-size:15px;font-weight:600}\n.zoombar button:hover{background:var(--surface-sunk);color:var(--text)}\n.zoombar .zb-pct{font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:11.5px;font-weight:600;color:var(--text-2);min-width:48px;text-align:center;cursor:pointer;border-radius:var(--r-pill);padding:6px 2px}\n.zoombar .zb-pct:hover{background:var(--surface-sunk);color:var(--text)}\n\n/* layers */\n.layer-row{display:flex;align-items:center;gap:9px;padding:8px 9px;border-radius:var(--r-md);cursor:pointer;border:1px solid transparent;transition:background .12s,border-color .12s;margin-bottom:3px}\n.layer-row:hover{background:var(--surface-sunk)}\n.layer-row.selected{background:var(--accent-wash);border-color:rgba(255,122,26,.4)}\n.layer-row.hidden-l{opacity:.4}\n.layer-ico{width:26px;height:26px;flex:0 0 26px;border-radius:8px;background:var(--surface-sunk);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--text-2)}\n.layer-row .li-text{color:var(--accent)}\n.layer-main{flex:1;min-width:0}\n.layer-name{font-size:12.5px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.layer-prev{font-size:11px;color:var(--text-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}\n.layer-acts{display:flex;gap:2px;flex:0 0 auto}\n.layer-acts button{background:none;border:none;color:var(--text-dim);width:24px;height:24px;border-radius:var(--r-pill);cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center}\n.layer-acts button:hover{background:var(--surface-sunk);color:var(--text)}\n.layer-acts button.on{color:var(--accent)}\n\n.icon-row{display:flex;gap:7px}\n.icon-row button{flex:1;background:var(--surface-sunk);border:.5px solid var(--hairline);border-radius:var(--r-sm);color:var(--text-2);padding:8px 4px;cursor:pointer;font-size:13px;font-weight:650;transition:all .13s}\n.icon-row button:hover{border-color:var(--hairline-strong);color:var(--text)}\n.icon-row button.active{border-color:var(--accent);color:var(--accent);background:var(--accent-wash)}\n\n/* template picker modal */\n.picker-modal{max-width:960px;max-height:86vh;display:flex;flex-direction:column;padding:0;overflow:hidden}\n.picker-head{padding:22px 26px 16px;border-bottom:1px solid var(--hairline);display:flex;align-items:center;gap:14px;flex-wrap:wrap}\n.picker-head h3{font-size:20px;flex:1}\n.picker-filters{display:flex;gap:6px;flex-wrap:wrap}\n.picker-filters button{background:var(--surface-sunk);border:.5px solid var(--hairline);color:var(--text-2);font-size:12.5px;font-weight:650;padding:7px 14px;border-radius:var(--r-pill);cursor:pointer;transition:all .13s}\n.picker-filters button.active{background:var(--accent-wash);border-color:var(--accent);color:var(--accent)}\n.picker-body{flex:1;overflow-y:auto;padding:22px 26px 30px}\n.picker-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(196px,1fr));gap:16px}\n.resume-card{grid-column:1/-1;display:flex;align-items:center;gap:16px;background:var(--accent-wash);border:.5px solid rgba(255,122,26,.35);border-radius:var(--r-lg);padding:14px 16px;cursor:pointer;transition:border-color .15s}\n.resume-card:hover{border-color:var(--accent)}\n.resume-card img{width:64px;height:64px;border-radius:var(--r-md);object-fit:cover;border:.5px solid var(--hairline-strong)}\n.resume-card .rc-title{font-weight:700;font-size:14.5px}\n.resume-card .rc-sub{font-size:12.5px;color:var(--text-dim);margin-top:2px}\n.picker-close{background:none;border:none;color:var(--text-dim);font-size:20px;cursor:pointer;width:34px;height:34px;border-radius:var(--r-pill)}\n.picker-close:hover{background:var(--surface-sunk);color:var(--text)}\n\n/* export modal */\n.export-preview{width:100%;max-height:340px;border-radius:var(--r-lg);border:.5px solid var(--hairline-strong);object-fit:contain;background:var(--surface-sunk);display:block;margin-bottom:16px}\n\n/* tutorial */\n#tut-overlay{position:fixed;inset:0;z-index:9000;display:none;pointer-events:none}\n#tut-bubble{pointer-events:auto}\n#tut-overlay.active{display:block}\n#tut-spot{position:fixed;border-radius:var(--r-lg);box-shadow:0 0 0 9999px var(--scrim),0 0 0 2px var(--accent),0 0 34px rgba(255,122,26,.5);transition:all .3s cubic-bezier(.4,0,.2,1);pointer-events:none;z-index:9001}\n#tut-bubble{\n  position:fixed;width:308px;\n  background:var(--glass-bg-strong);\n  -webkit-backdrop-filter:var(--glass-blur);backdrop-filter:var(--glass-blur);\n  border:.5px solid var(--glass-edge);border-radius:var(--r-lg);padding:18px;z-index:9002;\n  box-shadow:var(--glass-shadow-lift);transition:all .3s cubic-bezier(.4,0,.2,1);\n}\n#tut-bubble .tb-step{font-family:var(--mono);font-size:10.5px;font-weight:700;letter-spacing:.09em;color:var(--accent);text-transform:uppercase;margin-bottom:7px}\n#tut-bubble h4{font-size:16px;font-weight:650;letter-spacing:-.02em;margin-bottom:6px}\n#tut-bubble p{font-size:13.5px;color:var(--text-2);line-height:1.55;margin-bottom:15px}\n.tut-dots{display:flex;gap:5px;margin-bottom:14px}\n.tut-dots span{width:7px;height:7px;border-radius:50%;background:var(--hairline-strong);transition:background .2s}\n.tut-dots span.on{background:var(--accent)}\n.tut-actions{display:flex;align-items:center;gap:9px}\n.tut-actions .tut-skip{background:none;border:none;color:var(--text-dim);font-size:13px;font-weight:600;cursor:pointer;padding:8px 4px}\n.tut-actions .tut-skip:hover{color:var(--text)}\n@media(max-width:1100px){.panel-left,.panel-right{position:absolute;top:0;bottom:0;box-shadow:var(--lift-3)}.panel-left{left:0}.panel-right{right:0}}\n\n/* ═══════════ EASY MODE ═══════════ */\n#page-easy{display:none;min-height:100vh}\n#page-easy.active{display:block}\n.ez-nav{\n  display:flex;align-items:center;justify-content:space-between;gap:8px;\n  padding:12px 26px;position:sticky;top:0;z-index:40;\n  background:var(--glass-bg);\n  -webkit-backdrop-filter:var(--glass-blur);backdrop-filter:var(--glass-blur);\n  border-bottom:.5px solid var(--glass-edge);\n}\n.ez-adv-link{background:none;border:none;color:var(--text-dim);font:600 13px/1 var(--ui);cursor:pointer;padding:9px 12px;border-radius:var(--r-pill)}\n.ez-adv-link:hover{color:var(--text);background:var(--surface-sunk)}\n.ez-wrap{max-width:1160px;margin:0 auto;padding:26px 22px 90px}\n.ez-head h1{font:700 clamp(24px,3.5vw,34px)/1.1 var(--ui);letter-spacing:-.035em;margin:0 0 4px}\n.ez-head p{color:var(--text-dim);margin:0 0 22px;font-size:14px}\n.ez-stepline{display:flex;align-items:center;gap:10px;margin:26px 0 12px}\n/* NOTE: border-radius MUST stay exactly 50% — cssProbeOk() in app.js reads it\n   to decide whether this stylesheet loaded at all. */\n.ez-stepnum{width:26px;height:26px;border-radius:50%;background:linear-gradient(180deg,var(--accent),var(--accent-deep));color:var(--accent-ink);font:700 13px/26px var(--mono);text-align:center;flex:none;box-shadow:var(--glow-accent)}\n.ez-stepline h2{font:650 17px/1 var(--ui);letter-spacing:-.02em;margin:0}\n.ez-stepline small{color:var(--text-dim);font-size:12px;margin-left:2px}\n.ez-strip{display:flex;gap:12px;overflow-x:auto;padding:6px 2px 14px;scroll-snap-type:x mandatory}\n.ez-strip::-webkit-scrollbar{height:8px}\n.ez-strip::-webkit-scrollbar-thumb{background:var(--hairline-strong);border-radius:999px}\n\n/* ── horizontal scroller: pop-up arrows + edge fades ──────────────────────\n   The arrows are the only thing telling a visitor the row continues, so they\n   sit ON the thumbnails rather than outside the rail, and each one hides the\n   moment there is nothing more that way. */\n.strip-shell{position:relative}\n/* Fades are drawn over the rail, not the label row underneath it. */\n.strip-shell::before,.strip-shell::after{\n  content:'';position:absolute;top:0;bottom:22px;width:64px;pointer-events:none;z-index:2;\n  opacity:1;transition:opacity .18s ease;\n}\n.strip-shell::before{left:0;background:linear-gradient(90deg,var(--field),transparent)}\n.strip-shell::after{right:0;background:linear-gradient(270deg,var(--field),transparent)}\n.strip-shell.at-start::before,.strip-shell.at-end::after,\n.strip-shell.no-scroll::before,.strip-shell.no-scroll::after{opacity:0}\n.strip-arrow{\n  position:absolute;top:calc(50% - 11px);transform:translateY(-50%);z-index:3;\n  width:38px;height:38px;display:grid;place-items:center;\n  border-radius:var(--r-pill);cursor:pointer;\n  background:var(--glass-bg-strong);\n  -webkit-backdrop-filter:var(--glass-blur);backdrop-filter:var(--glass-blur);\n  border:.5px solid var(--glass-edge);box-shadow:var(--glass-shadow-lift);\n  color:var(--text);font-size:20px;line-height:1;padding:0 0 3px;\n  transition:opacity .18s ease,transform .12s cubic-bezier(.2,0,0,1),background .15s ease;\n}\n.strip-arrow.left{left:-4px}\n.strip-arrow.right{right:-4px}\n.strip-arrow:hover{background:var(--surface-raise)}\n.strip-arrow:active{transform:translateY(-50%) scale(.92)}\n.strip-shell.at-start .strip-arrow.left,\n.strip-shell.at-end .strip-arrow.right{opacity:0;pointer-events:none}\n.strip-shell.no-scroll .strip-arrow{display:none}\n/* Coarse pointers get a bigger target and no hover-only reveal. */\n@media (pointer:coarse){\n  .strip-arrow{width:44px;height:44px;font-size:22px}\n}\n.ez-tpl{flex:none;width:132px;cursor:pointer;background:none;border:none;padding:0;scroll-snap-align:start;text-align:center;position:relative}\n.ez-tpl img{width:132px;height:132px;border-radius:var(--r-lg);display:block;border:3px solid transparent;transition:border-color .15s,transform .15s,box-shadow .15s;object-fit:cover}\n.ez-tpl span{display:block;font:600 11px/1.2 var(--ui);color:var(--text-dim);margin-top:6px}\n.ez-tpl:hover img{transform:translateY(-2px);box-shadow:var(--lift-2)}\n.ez-tpl.sel img{border-color:var(--accent);box-shadow:var(--glow-accent)}\n.ez-tpl.sel span{color:var(--text)}\n.ez-main{display:grid;grid-template-columns:minmax(0,1fr) 400px;gap:26px;align-items:start}\n.ez-card{\n  background:var(--glass-bg);\n  -webkit-backdrop-filter:var(--glass-blur);backdrop-filter:var(--glass-blur);\n  border:.5px solid var(--glass-edge);border-radius:22px;padding:20px;\n  box-shadow:var(--glass-shadow);\n}\n.ez-field{margin-bottom:14px}\n.ez-field label{display:block;font:700 10.5px/1 var(--ui);color:var(--text-dim);letter-spacing:.09em;text-transform:uppercase;margin-bottom:6px}\n.ez-field input,.ez-field textarea{width:100%;background:var(--surface-raise);border:1px solid var(--hairline-strong);border-radius:var(--r-md);color:var(--text);font:500 15px/1.35 var(--ui);padding:11px 13px;box-sizing:border-box;transition:border-color .14s,box-shadow .14s}\n.ez-field textarea{resize:vertical;min-height:64px}\n.ez-field input:focus,.ez-field textarea:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 4px var(--accent-wash)}\n.ez-chiprow{display:flex;flex-wrap:wrap;gap:8px}\n.ez-chip{background:var(--surface-sunk);border:.5px solid var(--hairline);color:var(--text-2);border-radius:var(--r-pill);padding:8px 14px;font:650 12px/1 var(--ui);cursor:pointer;transition:all .12s}\n.ez-chip:hover{color:var(--text);border-color:var(--hairline-strong)}\n.ez-chip.on{background:var(--accent-wash);border-color:var(--accent);color:var(--accent)}\n.ez-swatches{display:flex;flex-wrap:wrap;gap:10px;align-items:center}\n.ez-sw{width:40px;height:40px;border-radius:12px;border:3px solid transparent;cursor:pointer;padding:0;position:relative;box-shadow:var(--lift-1)}\n.ez-sw.sel{border-color:var(--accent);box-shadow:var(--glow-accent)}\n.ez-sw.orig{background:var(--surface-sunk);color:var(--text-dim);font:700 9px/1.1 var(--ui)}\n.ez-sw input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%}\n.ez-preview-card{position:sticky;top:84px}\n.ez-preview-card img{width:100%;border-radius:var(--r-lg);display:block;background:var(--surface-sunk);min-height:200px}\n/* account dropdown (reuses .view-drop look) */\n.acct-drop{left:auto;right:0;min-width:240px}\n.am-email{font:650 12px/1.3 var(--ui);color:var(--text-dim);padding:8px 10px 10px;border-bottom:1px solid var(--hairline);margin-bottom:6px;word-break:break-all}\n/* project rows inside Export / Make-my-ad dropdowns */\n.caret{opacity:.6;font-size:11px;margin-left:2px}\n.xm-row{display:flex;align-items:center;gap:9px;padding:7px 8px;border-radius:var(--r-md)}\n.xm-row:hover{background:var(--surface-sunk)}\n.xm-row img{width:34px;height:34px;border-radius:var(--r-sm);object-fit:cover;flex:none;background:var(--surface-sunk)}\n.xm-name{flex:1;font:600 12.5px/1.3 var(--ui);color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.xm-btn{background:var(--surface-sunk);border:.5px solid var(--hairline);color:var(--text);border-radius:var(--r-pill);padding:6px 10px;cursor:pointer;font-size:12px;flex:none}\n.xm-btn:hover{border-color:var(--accent);color:var(--accent)}\n/* split Make-my-ad button on the landing nav */\n.lp-split{display:inline-flex}\n.lp-split #lp-open-studio{border-radius:var(--r-pill) 0 0 var(--r-pill);padding-right:14px}\n.lp-caret{border-radius:0 var(--r-pill) var(--r-pill) 0;padding:9px 13px 9px 11px;border-left:1px solid rgba(0,0,0,.22)}\n/* auth modal */\n.auth-modal{max-width:420px;text-align:left}\n.auth-brand{display:flex;justify-content:center;margin-bottom:12px}\n.auth-brand .logo-mark{width:46px;height:46px;border-radius:14px;background:linear-gradient(135deg,var(--brand-1),var(--brand-2));display:inline-flex;align-items:center;justify-content:center;font-size:22px;color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 8px 22px -8px rgba(242,96,12,.6)}\n.auth-modal h3{text-align:center}\n.auth-modal .modal-sub{text-align:center}\n.auth-google{display:flex;justify-content:center;margin:14px 0 4px}\n.auth-or{display:flex;align-items:center;gap:12px;margin:14px 0 4px;color:var(--text-dim);font-size:12px}\n.auth-or::before,.auth-or::after{content:'';flex:1;height:1px;background:var(--hairline)}\n.auth-pass-wrap{position:relative}\n.auth-pass-wrap input{width:100%;padding-right:44px}\n.auth-pass-wrap #auth-pass-eye{position:absolute;right:6px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:15px;opacity:.55;padding:6px}\n.auth-pass-wrap #auth-pass-eye:hover{opacity:1}\n.auth-hint{color:var(--text-dim);font-size:11.5px;margin-top:8px}\n/* account-type chooser after signup */\n.at-card{display:block;width:100%;text-align:left;background:var(--surface-sunk);border:.5px solid var(--hairline);border-radius:var(--r-lg);padding:15px 17px;margin-top:12px;cursor:pointer;transition:border-color .15s,transform .12s,background .15s}\n.at-card:hover{border-color:var(--accent);transform:translateY(-1px)}\n.at-card.hot{border-color:rgba(255,122,26,.5);background:var(--accent-wash)}\n.at-card .at-name{display:flex;justify-content:space-between;align-items:baseline;font:700 15px/1 var(--ui);letter-spacing:-.02em;color:var(--text)}\n.at-card .at-name em{font-style:normal;color:var(--accent);font-size:12.5px}\n.at-card .at-desc{display:block;color:var(--text-dim);font-size:12.5px;margin-top:6px;line-height:1.45}\n/* pencil button in export history */\n.hist-edit{background:var(--surface-sunk);border:.5px solid var(--hairline);color:var(--text);border-radius:var(--r-pill);padding:9px 13px;cursor:pointer;font:600 12.5px/1 var(--ui);margin-right:8px;flex:none}\n.hist-edit:hover{border-color:var(--accent);color:var(--accent)}\n/* big landing footer */\n.lp-footer-big{display:block;padding:46px clamp(16px,4vw,40px) 28px}\n.lpf-cols{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:28px;max-width:1100px;margin:0 auto}\n.lpf-brand p{color:var(--text-dim);font-size:13px;margin-top:10px;max-width:260px}\n.lpf-col h4{font:700 10.5px/1 var(--ui);letter-spacing:.09em;text-transform:uppercase;color:var(--text-dim);margin-bottom:12px}\n.lpf-col a{display:block;color:var(--text-2);text-decoration:none;font-size:13.5px;padding:5px 0}\n.lpf-col a:hover{color:var(--accent)}\n.lpf-base{max-width:1100px;margin:30px auto 0;padding-top:18px;border-top:1px solid var(--hairline);color:var(--text-dim);font-size:12px}\n@media (max-width:760px){.lpf-cols{grid-template-columns:1fr 1fr}}\n.ez-upload-bg{width:100%;margin-top:14px;background:var(--surface-sunk);color:var(--text);border:2px dashed var(--hairline-strong);border-radius:var(--r-lg);font:650 16px/1 var(--ui);padding:16px;cursor:pointer;transition:border-color .15s,background .15s}\n.ez-upload-bg:hover{border-color:var(--accent);background:var(--accent-wash)}\n.ez-dl{width:100%;margin-top:14px;background:linear-gradient(180deg,var(--accent),var(--accent-deep));color:var(--accent-ink);border:none;border-radius:var(--r-lg);font:700 17px/1 var(--ui);letter-spacing:-.015em;padding:17px;cursor:pointer;transition:transform .1s,filter .15s;box-shadow:inset 0 1px 0 rgba(255,255,255,.28),var(--glow-accent)}\n.ez-dl:hover{filter:brightness(1.06)}\n.ez-dl:active{transform:scale(.985)}\n.ez-open-adv{width:100%;margin-top:10px;background:none;border:1px dashed var(--hairline-strong);color:var(--text-dim);border-radius:var(--r-lg);font:600 13px/1 var(--ui);padding:12px;cursor:pointer}\n.ez-open-adv:hover{color:var(--text);border-color:var(--text-dim)}\n.ez-hint{color:var(--text-dim);font-size:12px;margin-top:10px;text-align:center}\n@media (max-width:920px){\n  .ez-main{grid-template-columns:1fr}\n  /* The preview used to be pulled above the form with order:-1, which made a\n     THREE-STEP guided flow read 1 -> 3 -> 2: the visitor was told \"step 2, type\n     your info\" and then had to scroll past an 1180px preview to find the\n     fields. Steps now stack in the order they are numbered.\n     The preview stays useful while typing by sticking to the bottom of the\n     viewport at a height that cannot swallow the page. */\n  .ez-preview-card{position:static;order:0}\n  .ez-preview-card img{max-height:52vh;width:auto;margin:0 auto;display:block}\n}\n/* Narrow phones: smaller thumbs so more than two fit, and the arrows pull in\n   off the very edge where a thumb-swipe would fight them. */\n@media (max-width:480px){\n  .ez-tpl,.ez-tpl img{width:104px}\n  .ez-tpl img{height:104px}\n  .strip-arrow.left{left:0}\n  .strip-arrow.right{right:0}\n  .strip-shell::before,.strip-shell::after{width:44px}\n}\n\n/* view menu */\n.view-menu{position:relative}\n.view-drop{\n  display:none;position:absolute;top:calc(100% + 8px);left:0;\n  background:var(--glass-bg-strong);\n  -webkit-backdrop-filter:var(--glass-blur);backdrop-filter:var(--glass-blur);\n  border:.5px solid var(--glass-edge);border-radius:var(--r-lg);padding:6px;min-width:220px;z-index:60;\n  box-shadow:var(--glass-shadow-lift);\n  animation:menu-in .16s cubic-bezier(.2,0,0,1);transform-origin:top left;\n}\n.view-drop.acct-drop{transform-origin:top right}\n@keyframes menu-in{from{opacity:0;transform:translateY(-6px) scale(.97)}}\n.view-drop.open{display:block}\n.view-item{display:flex;align-items:center;gap:10px;width:100%;background:none;border:none;color:var(--text);font:500 13.5px/1 var(--ui);padding:11px 11px;border-radius:var(--r-md);cursor:pointer;text-align:left;transition:background .12s,color .12s}\n.view-item:hover{background:var(--accent-wash);color:var(--accent)}\n.view-item .vi-check{width:16px;height:16px;border:1.5px solid var(--text-dim);border-radius:5px;flex:none;display:grid;place-items:center;font-size:11px;color:var(--accent-ink)}\n.view-item.on .vi-check{background:var(--accent);border-color:var(--accent)}\n.view-item.on .vi-check::after{content:'✓';color:var(--accent-ink)}\n/* grid overlay */\n#grid-overlay{position:absolute;inset:0;pointer-events:none;z-index:15;display:none;\n  background-image:linear-gradient(rgba(255,255,255,0.09) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.09) 1px, transparent 1px)}\n#grid-overlay.on{display:block}\n/* fill type seg */\n.fillseg{display:flex;gap:3px;background:var(--surface-sunk);border-radius:var(--r-pill);padding:3px;margin-bottom:8px}\n.fillseg button{flex:1;background:none;border:none;color:var(--text-dim);font:600 12px/1 var(--ui);padding:8px;border-radius:var(--r-pill);cursor:pointer}\n.fillseg button.active{background:var(--surface-raise);color:var(--text);box-shadow:var(--lift-1)}\n/* backgrounds tab */\n.bg-gen-box{background:var(--surface-sunk);border:.5px solid var(--hairline);border-radius:var(--r-lg);padding:12px;margin-bottom:14px}\n.bg-gen-box textarea{width:100%;box-sizing:border-box;background:var(--surface-raise);border:1px solid var(--hairline-strong);border-radius:var(--r-sm);color:var(--text);font:500 13px/1.4 var(--ui);padding:9px;resize:vertical;min-height:56px}\n.bg-gen-row{display:flex;gap:8px;margin-top:8px}\n.bg-gen-row select{flex:1;background:var(--surface-raise);border:1px solid var(--hairline-strong);border-radius:var(--r-sm);color:var(--text);font:500 12px/1 var(--ui);padding:8px;min-width:0}\n/* AI generation is violet, the house colour for \"a model did this\". */\n.btn-gen{background:linear-gradient(135deg,var(--ai),#7b5cff);color:#fff;border:none;border-radius:var(--r-pill);font:650 13px/1 var(--ui);padding:11px 16px;cursor:pointer;box-shadow:0 6px 18px -6px rgba(167,139,255,.6)}\n.btn-gen:hover{filter:brightness(1.06)}\n.btn-gen:disabled{opacity:.55;cursor:wait}\n.bg-result{margin-top:10px;display:none}\n.bg-result.show{display:block}\n.bg-result img{width:100%;border-radius:var(--r-md);display:block}\n.bg-result-acts{display:flex;gap:8px;margin-top:8px}\n.bg-result-acts button{flex:1;border:.5px solid var(--hairline);background:var(--surface-sunk);color:var(--text);border-radius:var(--r-pill);font:600 12px/1 var(--ui);padding:10px;cursor:pointer}\n.bg-result-acts button:hover{border-color:var(--accent);color:var(--accent)}\n.bg-lib-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}\n.bg-lib-item{position:relative;border:none;background:var(--surface-sunk);border-radius:var(--r-md);padding:0;cursor:pointer;overflow:hidden;aspect-ratio:1}\n.bg-lib-item img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .15s}\n.bg-lib-item:hover img{transform:scale(1.06)}\n.bg-lib-del{position:absolute;top:4px;right:4px;width:20px;height:20px;border-radius:var(--r-pill);border:none;background:rgba(0,0,0,.65);color:#fff;font-size:11px;cursor:pointer;display:none;line-height:20px;text-align:center}\n.bg-lib-item:hover .bg-lib-del{display:block}\n.bg-lib-badge{position:absolute;left:4px;bottom:4px;background:rgba(0,0,0,.6);color:#eee;font:600 9px/1 var(--ui);padding:3px 6px;border-radius:var(--r-pill);pointer-events:none}\n.gear-btn{background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:13px;padding:4px;font-family:var(--ui);font-weight:600}\n.gear-btn:hover{color:var(--text)}\n.ai-note{color:var(--text-dim);font-size:11.5px;line-height:1.45;margin-top:8px}\n\n\n/* easy recents + layers + star */\n.ez-subttl{font:700 10.5px/1 var(--ui);color:var(--text-dim);letter-spacing:.09em;text-transform:uppercase;margin:12px 0 6px}\n#ez-recents{display:flex;flex-wrap:wrap;gap:10px}\n#ez-recents:empty::after{content:'Photos you use will appear here';color:var(--text-dim);font:500 11.5px/1 var(--ui)}\n.ez-recent{position:relative;width:40px;height:40px;border-radius:12px;border:3px solid transparent;padding:0;cursor:pointer;overflow:hidden;background:var(--surface-sunk)}\n.ez-recent img{width:100%;height:100%;object-fit:cover;display:block}\n.ez-recent.sel{border-color:var(--accent)}\n.star-btn{position:absolute;top:1px;right:1px;width:16px;height:16px;border:none;border-radius:5px;background:rgba(0,0,0,.65);color:var(--warn);font-size:10px;line-height:16px;text-align:center;cursor:pointer;display:none;padding:0}\n.ez-recent:hover .star-btn,.ez-lrow:hover .star-btn{display:block}\n.ez-lrow .star-btn{position:static;width:22px;height:22px;line-height:22px;border-radius:6px;flex:none}\n#star-pop{\n  position:fixed;z-index:9500;\n  background:var(--glass-bg-strong);\n  -webkit-backdrop-filter:var(--glass-blur);backdrop-filter:var(--glass-blur);\n  border:.5px solid var(--glass-edge);border-radius:var(--r-lg);\n  box-shadow:var(--glass-shadow-lift);padding:6px;display:none;min-width:210px;\n}\n#star-pop.open{display:block}\n#star-pop button{display:block;width:100%;background:none;border:none;color:var(--text);font:500 13px/1 var(--ui);padding:10px 11px;border-radius:var(--r-md);cursor:pointer;text-align:left}\n#star-pop button:hover{background:var(--accent-wash);color:var(--accent)}\n/* easy layers list */\n.ez-layers{margin-top:14px;border-top:1px solid var(--hairline);padding-top:12px}\n.ez-lrow{display:flex;align-items:center;gap:9px;padding:7px 6px;border-radius:var(--r-md);cursor:pointer}\n.ez-lrow:hover{background:var(--surface-sunk)}\n.ez-lswatch{width:26px;height:26px;border-radius:8px;flex:none;background:var(--surface-sunk);overflow:hidden;display:grid;place-items:center;font-size:12px;color:var(--text-dim)}\n.ez-lswatch img{width:100%;height:100%;object-fit:cover}\n.ez-lmain{flex:1;min-width:0}\n.ez-lname{font:650 12px/1.2 var(--ui);color:var(--text)}\n.ez-lprev{font:500 10.5px/1.2 var(--ui);color:var(--text-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}\n.ez-ldel{width:22px;height:22px;border:none;border-radius:var(--r-pill);background:none;color:var(--text-dim);cursor:pointer;font-size:12px;flex:none;line-height:22px;padding:0}\n.ez-ldel:hover{background:rgba(255,98,89,.15);color:var(--danger)}\n.ez-restore{background:none;border:none;color:var(--accent);font:600 11.5px/1 var(--ui);cursor:pointer;padding:6px;margin-top:2px}\n\n\n/* effects controls */\n.ez-fxrow{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}\n.ez-fxrow button{background:var(--surface-sunk);border:.5px solid var(--hairline);color:var(--text-dim);border-radius:var(--r-pill);padding:8px 13px;font:600 11.5px/1 var(--ui);cursor:pointer}\n.ez-fxrow button.active{background:var(--accent-wash);color:var(--accent);border-color:var(--accent)}\n.ez-fxline{display:flex;align-items:center;gap:10px;margin-bottom:8px}\n.ez-fxline label{font:600 10.5px/1 var(--ui);color:var(--text-dim);width:64px;flex:none;text-transform:uppercase;letter-spacing:.08em}\n.ez-fxline input[type=range]{flex:1}\n.ez-fxline input[type=color]{width:34px;height:28px;border:1px solid var(--hairline-strong);border-radius:var(--r-sm);background:none;padding:2px}\n.ez-fxline .fxval{font:600 11px/1 var(--mono);font-variant-numeric:tabular-nums;color:var(--text-dim);width:34px;text-align:right}\n/* account chip */\n.acct-chip{display:flex;align-items:center;gap:8px;background:var(--glass-bg-strong);-webkit-backdrop-filter:var(--glass-blur);backdrop-filter:var(--glass-blur);border:.5px solid var(--glass-edge);border-radius:var(--r-pill);padding:7px 13px;font:600 12px/1 var(--ui);color:var(--text);cursor:pointer;box-shadow:var(--glass-shadow)}\n.acct-chip:hover{background:var(--surface-raise)}\n.acct-plan{background:linear-gradient(180deg,var(--accent),var(--accent-deep));color:var(--accent-ink);border-radius:var(--r-pill);padding:3px 9px;font:700 9.5px/1.35 var(--ui);letter-spacing:.06em;text-transform:uppercase}\n.acct-plan.free{background:var(--surface-sunk);color:var(--text-dim)}\n/* auth + pay overlays reuse .modal-overlay/.modal */\n.auth-tabs{display:flex;gap:3px;background:var(--surface-sunk);border-radius:var(--r-pill);padding:3px;margin-bottom:16px}\n.auth-tabs button{flex:1;background:none;border:none;color:var(--text-dim);font:650 13px/1 var(--ui);padding:10px;border-radius:var(--r-pill);cursor:pointer;transition:background .13s,color .13s}\n.auth-tabs button.active{background:var(--surface-raise);color:var(--text);box-shadow:var(--lift-1)}\n.auth-err{color:var(--danger);font:500 12.5px/1.4 var(--ui);margin:8px 0 0;min-height:16px}\n.auth-ok{text-align:center;padding:18px 6px}\n.auth-ok .big{font-size:40px;margin-bottom:10px}\n.demo-note{background:rgba(255,176,61,.12);border:.5px solid rgba(255,176,61,.4);color:var(--warn);border-radius:var(--r-md);padding:10px 12px;font:500 11.5px/1.45 var(--ui);margin-top:12px}\n/* plans page */\n/* Fixed at z-index 8000, so it sits above the body's field pseudo-elements and\n   would otherwise be a flat slab. It carries its own copy of the aurora. */\n#page-plans{\n  display:none;position:fixed;inset:0;z-index:8000;overflow:auto;\n  background:\n    radial-gradient(58% 46% at 12% 4%,var(--wash-a),transparent 66%),\n    radial-gradient(50% 50% at 92% 10%,var(--wash-b),transparent 68%),\n    radial-gradient(64% 52% at 58% 104%,var(--wash-c),transparent 70%),\n    var(--field);\n}\n#page-plans.active{display:block}\n.plans-wrap{max-width:980px;margin:0 auto;padding:34px 22px 80px}\n.plans-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}\n.plans-head h1{font:700 28px/1.1 var(--ui);letter-spacing:-.035em;margin:0}\n.plans-close{background:var(--glass-bg-strong);-webkit-backdrop-filter:var(--glass-blur);backdrop-filter:var(--glass-blur);border:.5px solid var(--glass-edge);color:var(--text);border-radius:var(--r-pill);padding:10px 16px;font:600 13px/1 var(--ui);cursor:pointer}\n.plans-close:hover{background:var(--surface-raise)}\n.plans-sub{color:var(--text-dim);font:500 14px/1.5 var(--ui);margin:0 0 26px}\n.plans-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:18px}\n.plan-card{\n  background:var(--glass-bg);\n  -webkit-backdrop-filter:var(--glass-blur);backdrop-filter:var(--glass-blur);\n  border:.5px solid var(--glass-edge);border-radius:22px;padding:24px;\n  display:flex;flex-direction:column;box-shadow:var(--glass-shadow);\n}\n.plan-card.hot{border-color:var(--accent);box-shadow:var(--glass-shadow),0 0 0 1px var(--accent),0 18px 50px -20px rgba(255,122,26,.5)}\n.plan-name{font:700 17px/1 var(--ui);letter-spacing:-.02em;margin-bottom:4px}\n.plan-price{font:700 32px/1 var(--mono);font-variant-numeric:tabular-nums;letter-spacing:-.03em;margin:10px 0 2px}\n.plan-price small{font:600 13px/1 var(--ui);color:var(--text-dim)}\n.plan-feats{list-style:none;padding:0;margin:16px 0 20px;flex:1}\n.plan-feats li{font:500 13px/1.5 var(--ui);color:var(--text-2);padding:5px 0 5px 22px;position:relative}\n.plan-feats li::before{content:'✓';position:absolute;left:0;color:var(--good);font-weight:700}\n.plan-btn{background:linear-gradient(180deg,var(--accent),var(--accent-deep));color:var(--accent-ink);border:none;border-radius:var(--r-pill);font:650 14px/1 var(--ui);padding:14px;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.28),var(--glow-accent)}\n.plan-btn:hover{filter:brightness(1.06)}\n.plan-btn.ghost{background:var(--surface-sunk);color:var(--text);border:.5px solid var(--hairline);box-shadow:none}\n.plan-btn:disabled{opacity:.5;cursor:default}\n.plan-current{font:650 10.5px/1 var(--ui);color:var(--good);text-transform:uppercase;letter-spacing:.09em;margin-top:10px;text-align:center}\n.ez-quota{color:var(--text-dim);font:600 11.5px/1 var(--ui);text-align:center;margin-top:8px}\n.ez-quota b{color:var(--text);font-family:var(--mono);font-variant-numeric:tabular-nums}\n.ez-quota .up{color:var(--accent);cursor:pointer;text-decoration:underline}\n\n\n/* premium template locks */\n.tpl-lock{position:absolute;top:8px;left:8px;background:rgba(0,0,0,.72);color:var(--warn);font:700 9.5px/1 var(--ui);letter-spacing:.06em;padding:5px 8px;border-radius:var(--r-pill);pointer-events:none;z-index:3}\n.ez-tpl{position:relative}\n.ez-tpl .tpl-lock{top:6px;left:6px}\n.ez-tpl.locked img{filter:grayscale(.35) brightness(.72)}\n.ez-tpl.locked:hover img{filter:grayscale(.15) brightness(.85)}\n.tpl-card.locked img{filter:grayscale(.35) brightness(.7)}\n\n\n/* category row + nav */\n.ez-catrow{display:flex;align-items:center;gap:12px;margin:0 0 12px}\n.ez-catrow label{font:700 10.5px/1 var(--ui);color:var(--text-dim);text-transform:uppercase;letter-spacing:.09em;flex:none}\n.cat-select{background:var(--surface-raise);border:1px solid var(--hairline-strong);border-radius:var(--r-md);color:var(--text);font:600 14px/1 var(--ui);padding:11px 13px;min-width:210px;cursor:pointer}\n.cat-select:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 4px var(--accent-wash)}\n.nav-upgrade{background:linear-gradient(180deg,var(--accent),var(--accent-deep));color:var(--accent-ink);border:none;border-radius:var(--r-pill);padding:9px 15px;font:700 12px/1 var(--ui);cursor:pointer;letter-spacing:-.01em;box-shadow:inset 0 1px 0 rgba(255,255,255,.28),var(--glow-accent)}\n.nav-upgrade:hover{filter:brightness(1.06)}\n/* export history */\n.hist-list{max-height:380px;overflow:auto;margin-top:6px}\n.hist-row{display:flex;align-items:center;gap:12px;padding:9px 6px;border-radius:var(--r-md)}\n.hist-row:hover{background:var(--surface-sunk)}\n.hist-row img{width:52px;height:52px;border-radius:var(--r-md);object-fit:cover;flex:none;background:var(--surface-sunk)}\n.hist-main{flex:1;min-width:0}\n.hist-name{font:650 13px/1.2 var(--ui);color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.hist-meta{font:500 11px/1.3 var(--mono);font-variant-numeric:tabular-nums;color:var(--text-dim)}\n.hist-dl{background:var(--surface-sunk);border:.5px solid var(--hairline);color:var(--text);border-radius:var(--r-pill);font:600 11.5px/1 var(--ui);padding:9px 13px;cursor:pointer;flex:none}\n.hist-dl:hover{border-color:var(--accent);color:var(--accent)}\n.hist-empty{color:var(--text-dim);font:500 13px/1.5 var(--ui);text-align:center;padding:26px 0}\n@media (max-width:760px){ .ez-nav{flex-wrap:wrap;gap:8px} }\n/* The label plus a 210px select is wider than a phone, and overflow-x:hidden\n   was clipping the select's right edge instead of showing it. */\n@media (max-width:560px){\n  .ez-catrow{flex-direction:column;align-items:stretch;gap:6px}\n  .ez-catrow label{margin-bottom:2px}\n  .cat-select{min-width:0;width:100%}\n  .ez-nav{padding:10px 14px}\n  .ez-adv-link{padding:8px;font-size:12.5px}\n  .ez-wrap{padding:20px 14px 80px}\n}\n\n.mini-tpl.locked img, .tpl-mini.locked img{filter:grayscale(.35) brightness(.7)}\n\n/* per-field quick styling */\n.ez-fieldrow{display:flex;gap:8px;align-items:stretch}\n.ez-fieldrow input,.ez-fieldrow textarea{flex:1;min-width:0}\n.ez-edit-btn{flex:none;width:44px;border:1px solid var(--hairline-strong);background:var(--surface-sunk);color:var(--text-dim);border-radius:var(--r-md);cursor:pointer;font-size:15px}\n.ez-edit-btn:hover{color:var(--accent);border-color:var(--accent)}\n#txt-pop{\n  position:fixed;z-index:9400;width:288px;\n  background:var(--glass-bg-strong);\n  -webkit-backdrop-filter:var(--glass-blur);backdrop-filter:var(--glass-blur);\n  border:.5px solid var(--glass-edge);border-radius:var(--r-lg);\n  box-shadow:var(--glass-shadow-lift);padding:14px;display:none;\n}\n#txt-pop.open{display:block}\n#txt-pop .tp-title{font:700 10.5px/1 var(--ui);color:var(--text-dim);text-transform:uppercase;letter-spacing:.09em;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center}\n#txt-pop .tp-title button{background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:13px}\n.tp-row{display:flex;align-items:center;gap:9px;margin-bottom:9px}\n.tp-row label{font:600 10.5px/1 var(--ui);color:var(--text-dim);width:52px;flex:none;text-transform:uppercase;letter-spacing:.08em}\n.tp-row select{flex:1;background:var(--surface-raise);border:1px solid var(--hairline-strong);border-radius:var(--r-sm);color:var(--text);font:600 12.5px/1 var(--ui);padding:8px 9px}\n.tp-row input[type=range]{flex:1}\n.tp-row input[type=color]{width:32px;height:26px;border:1px solid var(--hairline-strong);border-radius:6px;background:none;padding:1px;flex:none}\n.tp-row .tp-val{font:600 10.5px/1 var(--mono);font-variant-numeric:tabular-nums;color:var(--text-dim);width:34px;text-align:right;flex:none}\n.tp-biu{display:flex;gap:5px;flex:1}\n.tp-biu button{flex:1;background:var(--surface-sunk);border:.5px solid var(--hairline);color:var(--text-dim);border-radius:var(--r-sm);padding:7px 0;cursor:pointer;font:700 13px/1 Georgia}\n.tp-biu button.active{background:var(--accent-wash);color:var(--accent);border-color:var(--accent)}\n.tp-reset{width:100%;margin-top:4px;background:none;border:1px dashed var(--hairline-strong);color:var(--text-dim);border-radius:var(--r-pill);font:600 11.5px/1 var(--ui);padding:9px;cursor:pointer}\n.tp-reset:hover{color:var(--text)}\n\n\n.ez-themes{display:flex;flex-wrap:wrap;gap:9px}\n.ez-theme{display:flex;border:2px solid var(--hairline-strong);border-radius:11px;overflow:hidden;padding:0;cursor:pointer;width:52px;height:32px;background:none;transition:border-color .13s,transform .13s}\n.ez-theme span{flex:1;display:block}\n.ez-theme:hover{border-color:var(--accent);transform:translateY(-1px)}\n\n\n.ez-chip-custom{border-style:dashed}\n.chip-x{opacity:.55;font-size:10px;margin-left:2px}\n.ez-chip-custom:hover .chip-x{opacity:1;color:var(--danger)}\n\n.lp-price-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;max-width:720px}\n.lp-price-card{\n  background:var(--glass-bg);\n  -webkit-backdrop-filter:var(--glass-blur);backdrop-filter:var(--glass-blur);\n  border:.5px solid var(--glass-edge);border-radius:22px;padding:26px;\n  box-shadow:var(--glass-shadow);\n}\n.lp-price-card.hot{border-color:var(--accent);box-shadow:var(--glass-shadow),0 0 0 1px var(--accent),0 18px 50px -20px rgba(255,122,26,.5)}\n.lp-price-card h3{font-size:17px;font-weight:650;letter-spacing:-.02em;margin-bottom:6px}\n.lp-price{font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:40px;font-weight:700;letter-spacing:-.04em;margin-bottom:12px}\n.lp-price small{font-family:var(--ui);font-size:15px;font-weight:600;color:var(--text-dim);letter-spacing:-.01em}\n.lp-price-card ul{list-style:none;padding:0;margin:0 0 18px}\n.lp-price-card li{font-size:13.5px;color:var(--text-2);padding:5px 0 5px 22px;position:relative}\n.lp-price-card li::before{content:'\\2713';position:absolute;left:0;color:var(--good);font-weight:700}\n.lp-faq{\n  background:var(--glass-bg);\n  -webkit-backdrop-filter:var(--glass-blur);backdrop-filter:var(--glass-blur);\n  border:.5px solid var(--glass-edge);border-radius:var(--r-lg);padding:0 20px;margin-bottom:10px;\n  box-shadow:var(--glass-shadow);\n}\n.lp-faq summary{font-weight:650;font-size:15px;letter-spacing:-.015em;padding:17px 0;cursor:pointer;list-style:none}\n.lp-faq summary::-webkit-details-marker{display:none}\n.lp-faq summary::after{content:'+';float:right;color:var(--accent);font-size:18px;font-weight:600}\n.lp-faq[open] summary::after{content:'\\2013'}\n.lp-faq p{font-size:14px;color:var(--text-2);line-height:1.6;padding-bottom:17px;margin:0}\n\n/* ── canvas format picker ── */\n.tb-format{appearance:none;-webkit-appearance:none;background:var(--surface-sunk);border:.5px solid var(--hairline);color:var(--text);max-width:190px;border-radius:var(--r-pill);padding:8px 28px 8px 13px;font-size:13px;font-weight:600;background-image:linear-gradient(45deg,transparent 50%,var(--text-2) 50%),linear-gradient(135deg,var(--text-2) 50%,transparent 50%);background-position:calc(100% - 15px) 55%,calc(100% - 10px) 55%;background-size:5px 5px;background-repeat:no-repeat}\n.tb-format:hover{border-color:var(--accent)}\n\n/* ── order prints + posting ── */\n.btn-order{display:flex;flex-direction:column;align-items:center;gap:2px;width:100%;margin-top:12px;background:rgba(48,214,143,.12);border:.5px solid rgba(48,214,143,.45);color:var(--good);font-weight:650;border-radius:var(--r-lg);padding:12px}\n.btn-order:hover{border-color:var(--good);background:rgba(48,214,143,.18)}\n.btn-order .order-sub{font-size:11px;font-weight:500;color:var(--text-dim);letter-spacing:.01em}\n.ez-order{display:block;width:100%;margin-top:10px;background:none;border:1px dashed rgba(48,214,143,.5);color:var(--good);font-size:13px;font-weight:650;padding:11px;border-radius:var(--r-lg);cursor:pointer}\n.ez-order:hover{background:rgba(48,214,143,.10)}\n\n/* ── QR layer ── */\n.ab-pro{position:absolute;top:6px;right:6px;background:var(--warn);color:#1a1206;font-size:9px;font-weight:800;padding:2px 6px;border-radius:var(--r-pill);letter-spacing:.04em}\n.add-btn{position:relative}\n.qr-help{font-size:12px;color:var(--text-2);line-height:1.5;margin-top:8px}\n.qr-help a{color:var(--good);font-weight:650;text-decoration:none}\n.qr-help a:hover{text-decoration:underline}\n";
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
    console.warn('PhoneGFX: <style> tags did not apply, trying re-injection.');
    // Route 1: <style> blocks were stripped by the host, re-inject them
    const st = document.createElement('style');
    st.textContent = CSS_FALLBACK;
    document.head.appendChild(st);
    if (cssProbeOk()){ console.warn('PhoneGFX: inline styles were stripped by the host; CSS re-injected at runtime.'); return; }
    // Route 2: a CSP header is rejecting <style> elements. Constructed stylesheets
    // go through the CSSOM, which style-src does not govern, so this works under CSP.
    if (typeof CSSStyleSheet !== 'undefined' && document.adoptedStyleSheets !== undefined){
      try {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(CSS_FALLBACK);
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
        if (cssProbeOk()){ console.warn('PhoneGFX: host CSP blocks inline styles; CSS applied via constructed stylesheet.'); return; }
      } catch (e2){}
    }
    // still blocked (likely a Content-Security-Policy header), tell the human plainly
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
  // arriving from ScanMap's dashboard proves a SCANS.AD account, unlock the
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
  // designer-library faces must be ready before the first thumbnail renders
  ensureTemplateFonts().then(() => {
    /* Order matters. buildLanding() renders 27 canvas thumbnails synchronously,
       which pegged the main thread for ~3.5s — and because the fetches were
       queued behind it, the first backdrop request did not leave the browser
       until 4.1s. Start the NETWORK first and let it run while the CPU draws:
       the two no longer wait on each other. */
    preloadTplBgs();          // photos start downloading immediately…
    preloadCutouts();         // …as do the street family's product cutouts…
    buildLanding();
    try { refreshPlanFeats(); refreshCountCopy(); } catch (e){}   // copy states counts; make them true           // …while the CPU paints fallbacks, upgraded on arrival
  });
}

// wait for fonts so canvas thumbnails render with the real typefaces
if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', () => document.fonts.ready.then(boot).catch(boot));
} else {
  document.fonts.ready.then(boot).catch(boot);
}


/* ═══════════════ TEMPLATE PASSES ═══════════════
   Deliberately the LAST thing in the file. Both passes close over consts
   declared far below their own definitions (catIcon/ICONS for the marks,
   FONT_CUTS/WEIGHT_FLOOR for the weights), and a function declaration hoists
   while a const does not. Running them earlier threw a ReferenceError that
   aborted the remainder of the script — leaving _DIMS_CACHE, LAYOUT_FAMILY and
   everything else below uninitialised. Nothing about that is visible from a
   thumbnail render, because thumbnails only need code defined above the break,
   so it passed a 243/243 check while tplDims() was dead. Hence the assertion. */
const _BGP = bgPoolByCat();
TEMPLATES.forEach(t => completeTemplate(t, _BGP));
TEMPLATES.forEach(t => applyCategoryMarks(t));
TEMPLATES.forEach(t => applyBrandVocab(t));
TEMPLATES.forEach(t => enforceTypeWeight(t));
TEMPLATES.forEach(t => enforcePlateSolidity(t));
TEMPLATES.forEach(t => enforceInkOnPlate(t));
TEMPLATES.forEach(t => stackBulletRuns(t));
TEMPLATES.forEach(t => addProductCutout(t));
TEMPLATES.forEach(t => assignStyle(t));
TEMPLATES.forEach(t => colourTheory(t));
TEMPLATES.forEach(t => displayFaceFix(t));
TEMPLATES.forEach(t => enrichFills(t));
TEMPLATES.forEach(t => opticalTracking(t));
TEMPLATES.forEach(t => normaliseBackdrop(t));
TEMPLATES.forEach(t => inkVsWash(t));
TEMPLATES.forEach(t => highlightBudget(t));
TEMPLATES.forEach(t => bodyPanel(t));
/* LAST. Run before the contrast passes it went straight back to white: liftInk
   walks a near-neutral toward pure white to buy contrast, so tinting first and
   correcting after put 49% of the type back to plain white — worse than before
   the tint existed. Whatever colour the contrast work lands on, this is the
   final word on it. */
TEMPLATES.forEach(t => warmTheWhites(t));
try {
  tplDims(TEMPLATES[0]);
  /* The old assertion called onAccent({a1:'#ffffff'}) here. onAccent is a const
     arrow declared INSIDE the template-building closure, so it is not in scope
     at this point in the file: the assertion threw a ReferenceError on every
     single page load, which meant the one guard against a dead pass chain was
     itself permanently broken, and its error message ("init aborted before the
     passes ran") was a lie that masked real errors in the console for anyone
     debugging this file. Assert against a hoisted, top-level thing instead —
     LAYOUT_FAMILY is a const declared below the pass calls, so touching it here
     genuinely proves the temporal dead zone was not hit. */
  if (typeof LAYOUT_FAMILY === 'undefined') throw new Error('LAYOUT_FAMILY unset');
} catch (e){
  console.error('GraphicsStudio: init aborted before the passes ran — a const ' +
    'below a call site is in the temporal dead zone. Everything after that ' +
    'point is uninitialised.', e);
}
