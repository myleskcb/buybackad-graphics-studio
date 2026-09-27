#!/usr/bin/env node
/* RENDER 100 COMPLETE THEMES — as 100 different ADS.
 *
 * The first version held the layout, the category and the product constant and
 * varied only colour, which made a hundred cards that all said the same thing
 * and, worse, put an iPhone headline over a photograph of test-strip boxes.
 * A theme is not a swatch and it is not a recolour: it is a palette, a type
 * pairing, a plate treatment, a composition and a subject that agree.
 *
 * So every card now varies on five axes at once:
 *   palette    100 themes from theme_specs.mjs (OKLCH, legibility built in)
 *   category   the engine's own eight decks, with their real copy
 *   backdrop   from that SAME category, greyscale so the theme owns the hue
 *   product    a real cutout from that category
 *   layout     one of six compositions
 *
 * Colour schemes are portable across compositions on purpose — the owner asked
 * for that — so a palette that works can be seen on more than one structure.
 *
 * usage: node scripts/theme_lab.mjs        (needs a server on :8899)
 */
import puppeteer from 'puppeteer-core';
import { writeFileSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { THEMES, FACES } from './theme_specs.mjs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';
const ROOT = new URL('../', import.meta.url).pathname;
const OUT = ROOT + '.render/themes/';
mkdirSync(OUT, { recursive: true });

const BG = JSON.parse(readFileSync(ROOT + 'assets/backdrop-lum.json', 'utf8'));
/* Product pools per category, read off disk so this never drifts from what is
   actually in assets/cutouts. */
const FILES = readdirSync(ROOT + 'assets/cutouts').filter(f => /\.webp$/.test(f)).map(f => f.replace(/\.webp$/, ''));
const pick = pres => FILES.filter(f => pres.some(p => f.startsWith(p + '-')));
const CUTS = {
  phones:  pick(['iphone','ipad','mac','macbook','sam','pix','phone','watch']),
  gold:    pick(['gold','cash']),
  silver:  pick(['silver']),
  coins:   pick(['coin']),
  cars:    pick(['car']),
  strips:  pick(['strip']),
  pokemon: pick(['poke']),
  sports:  pick(['sports']),
};
const CATS = Object.keys(CUTS);
const LAYOUTS = ['stack','heroCut','splitPanel','bandKnock','posterFrame','lowerThird'];

/* assign category, layout, backdrop and product to each theme */
const PLAN = THEMES.map((th, i) => {
  const cat = CATS[i % CATS.length];
  const layout = LAYOUTS[(i + Math.floor(i / CATS.length)) % LAYOUTS.length];
  const pool = BG.filter(b => b.cat === cat);
  const tL = (() => { const n = parseInt(th.c1.slice(1),16);
    const f = c => { c/=255; return c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4); };
    return 0.2126*f((n>>16)&255) + 0.7152*f((n>>8)&255) + 0.0722*f(n&255); })();
  const shot = (pool.length ? pool : BG).slice()
    .sort((a,b) => Math.abs(a.lum - tL) - Math.abs(b.lum - tL))[Math.floor(i / CATS.length) % 3] || BG[0];
  const cuts = CUTS[cat].length ? CUTS[cat] : CUTS.phones;
  return { id: th.id, cat, layout, bgSrc: shot.src, bgLum: shot.lum,
           cut: 'assets/cutouts/' + cuts[(i * 7) % cuts.length] + '.webp',
           wash: Math.max(0.52, Math.min(0.90, (tL*0.90 - shot.lum) / ((tL - shot.lum) || 1))) };
});

const browser = await puppeteer.launch({ executablePath: CHROME, headless:'new', args:['--no-sandbox'], protocolTimeout: 0 });
const page = await browser.newPage();
const perr = [];
page.on('pageerror', e => perr.push(String(e).slice(0,200)));
await page.goto(BASE, { waitUntil:'networkidle2', timeout:120000 });
await page.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 5000));
await page.evaluate(async faces => {
  await Promise.all(faces.map(f => (typeof ensureFont === 'function' ? ensureFont(f) : Promise.resolve())));
  await document.fonts.ready;
  try { fabric.util.clearFabricFontCache(); } catch(e){}
}, FACES);
/* preloadCutouts() only fetches what the TEMPLATES reference; the lab uses its
   own products, so warm the same cache by hand or buildLayer draws nothing. */
await page.evaluate(async srcs => {
  await Promise.all(srcs.map(s => new Promise(res => {
    if (CUTOUT_ELS[s]) return res();
    const el = new Image();
    el.onload = () => { CUTOUT_ELS[s] = el; res(); };
    el.onerror = () => res();
    el.src = s;
  })));
}, [...new Set(PLAN.map(p => p.cut))]);
await new Promise(r => setTimeout(r, 2500));

const cards = await page.evaluate(async (THEMES, PLAN) => {
  const W = 1080, H = 1080, CX = W/2, SIZE = 640;
  const lin = c => { c/=255; return c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4); };
  const lumPx = (d,i) => 0.2126*lin(d[i]) + 0.7152*lin(d[i+1]) + 0.0722*lin(d[i+2]);
  const lumHex = hex => { const n = parseInt(hex.slice(1),16);
    return 0.2126*lin((n>>16)&255) + 0.7152*lin((n>>8)&255) + 0.0722*lin(n&255); };
  const hexA = (hex,a) => { const n = parseInt(hex.slice(1),16);
    return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')'; };
  const D = DECKS_SNAPSHOT;

  const T = (txt,o) => new fabric.Text(txt, Object.assign({ originX:'left', originY:'top',
    fontFamily:'Manrope', fontWeight:'700' }, o));
  const R = o => new fabric.Rect(Object.assign({ originX:'left', originY:'top' }, o));
  const fit = (o, maxW) => { let g = 0; while (o.width > maxW && g++ < 60) o.set('fontSize', o.fontSize - 2); return o; };

  function product(sc, src, o){
    try {
      const l = { kind:'cutout', name:'Product', role:'photo',
        props: Object.assign({ src, shadow:{ color:'rgba(0,0,0,0.42)', blur:38, offsetX:0, offsetY:18 } }, o) };
      const obj = buildLayer(l, 'lab');
      if (obj) sc.add(obj);
    } catch(e){}
  }

  function plateShape(P, cx, cy, w, h){
    const rx = P.shape === 'pill' ? h/2 : (P.rx || 0);
    const base = { left:cx-w/2, top:cy-h/2, width:w, height:h, originX:'left', originY:'top' };
    if (P.shape === 'tag') return new fabric.Polygon(
      [{x:0,y:0},{x:w-42,y:0},{x:w,y:h/2},{x:w-42,y:h},{x:0,y:h}], Object.assign({},base,{objectCaching:false}));
    return new fabric.Rect(Object.assign({}, base, { rx, ry:rx, objectCaching:false }));
  }

  function drawPlate(sc, th, cx, cy, w, h){
    const P = th.plate, light = lumHex(th.c1) > 0.22;
    if (P.fill === 'tint'){
      const s1 = plateShape(P, cx, cy, w, h);
      s1.set({ fill: light ? hexA(th.accent, P.faint ? 0.30 : 0.94) : hexA('#ffffff', P.faint ? 0.10 : 0.16) });
      if (P.drop) s1.set('shadow', new fabric.Shadow({ color:'rgba(0,0,0,0.26)', blur:30, offsetX:0, offsetY:12 }));
      sc.add(s1);
    }
    if (P.rim){
      const r = plateShape(P, cx, cy, w, h);
      r.set({ fill:'rgba(0,0,0,0)',
        stroke: light ? hexA('#ffffff', P.rim==='spec'?0.62:0.34) : hexA(th.accent, P.rim==='spec'?0.95:0.62),
        strokeWidth: P.rim==='spec'?2:1.25 });
      sc.add(r);
    }
    if (P.spec){
      const rr = P.shape==='pill' ? h/2 : P.rx;
      sc.add(R({ left:cx-w/2+rr*0.55, top:cy-h/2+3, width:w-rr*1.1, height:3, rx:1.5, ry:1.5, fill:hexA('#ffffff',0.72) }));
      sc.add(R({ left:cx-w/2+rr*0.9, top:cy+h/2-4, width:w-rr*1.8, height:2, rx:1, ry:1, fill:hexA('#ffffff',0.30) }));
    }
    if (P.inner){
      const i2 = plateShape(P, cx, cy, w-18, h-18);
      i2.set({ fill:hexA('#ffffff',0.07), stroke:hexA('#ffffff',0.18), strokeWidth:1 });
      sc.add(i2);
    }
    if (P.shape === 'stub') [-1,1].forEach(d => sc.add(new fabric.Circle({
      left:cx+d*(w/2)-19, top:cy-19, radius:19, fill:th.c1, originX:'left', originY:'top' })));
    if (P.shape === 'tag') sc.add(new fabric.Circle({
      left:cx+w/2-36, top:cy-11, radius:11, fill:hexA(th.ink,0.55), originX:'left', originY:'top' }));
    if (P.bracket){
      const bw=w/2, bh=h/2, len=30, t=4;
      [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sy])=>{
        sc.add(R({ left:cx+sx*bw-(sx>0?len:0), top:cy+sy*bh-(sy>0?t:0), width:len, height:t, fill:th.accent }));
        sc.add(R({ left:cx+sx*bw-(sx>0?t:0), top:cy+sy*bh-(sy>0?len:0), width:t, height:len, fill:th.accent }));
      });
    }
    if (P.split){
      sc.add(R({ left:cx-w/2+128, top:cy-h/2+16, width:1.5, height:h-32, fill:hexA(th.ink,0.28) }));
      sc.add(T('✆', { left:cx-w/2+64, top:cy, originX:'center', originY:'center',
        fontFamily:'Satoshi', fontSize:42, fill:th.ink, fontWeight:'900' }));
    }
    return { nx: P.split ? cx+64 : cx, ny: cy };
  }

  const chip = (sc, th, x, y, txt, anchor) => {
    const w = Math.min(330, 22 + txt.length * 12.4);
    sc.add(R({ left: anchor === 'right' ? x-w : x, top:y, width:w, height:52, rx:26, ry:26, fill:th.support }));
    sc.add(T(txt, { left:(anchor==='right'?x-w:x)+w/2, top:y+26, originX:'center', originY:'center',
      fontFamily:th.faces.support, fontSize:19, fill:th.onSupport, fontWeight:'800', charSpacing:70 }));
  };
  const features = (sc, th, x, y, rows, gap) => rows.forEach((line, i) => {
    const yy = y + i*gap;
    sc.add(new fabric.Circle({ left:x, top:yy, radius:17, fill:th.accent, originX:'left', originY:'top' }));
    sc.add(T('✓', { left:x+17, top:yy+17, originX:'center', originY:'center', fontFamily:'Satoshi',
      fontSize:20, fill:th.onAccent, fontWeight:'900' }));
    sc.add(fit(T(line, { left:x+52, top:yy-1, fontFamily:th.faces.support, fontSize:29, fill:th.ink, fontWeight:'700' }), W-x-110));
  });

  function compose(sc, th, p){
    const d = D[p.cat], L = p.layout;
    const items = (d.items || '').split('•').map(s => s.trim()).filter(Boolean);
    const subs  = (d.sub || '').split('\n').map(s => s.trim()).filter(Boolean);
    let plate = { cx:CX, cy:952, w:640, h:120 };

    if (L === 'stack'){
      sc.add(T(d.k, { left:64, top:66, fontFamily:th.faces.support, fontSize:22, fill:th.sub, fontWeight:'800', charSpacing:150 }));
      sc.add(fit(T(d.h1, { left:62, top:142, fontFamily:th.faces.display, fontSize:96, fill:th.ink }), 620));
      /* the copy column owns the left 560px and the product the right side;
         fitting h2 to 660 let long words ("iPHONE") run under the cutout */
      sc.add(fit(T(d.h2, { left:58, top:244, fontFamily:th.faces.display, fontSize:164, fill:th.accent }), 552));
      product(sc, p.cut, { left:1046, top:330, originX:'right', w:376 });
      sc.add(fit(T(items.slice(0,3).join(' · '), { left:64, top:452, fontFamily:th.faces.support, fontSize:27, fill:th.sub, fontWeight:'600' }), 640));
      features(sc, th, 64, 540, subs.slice(0,3), 84);
      chip(sc, th, W-56, 60, d.badges.slice(0,2).join(' · '), 'right');
    } else if (L === 'heroCut'){
      sc.add(T(d.k, { left:CX, top:74, originX:'center', fontFamily:th.faces.support, fontSize:22, fill:th.sub, fontWeight:'800', charSpacing:150 }));
      sc.add(fit(T(d.h1, { left:CX, top:136, originX:'center', fontFamily:th.faces.display, fontSize:82, fill:th.ink }), 860));
      sc.add(fit(T(d.h2, { left:CX, top:220, originX:'center', fontFamily:th.faces.display, fontSize:150, fill:th.accent }), 940));
      product(sc, p.cut, { left:CX, top:400, originX:'center', w:430 });
      sc.add(fit(T(d.price, { left:CX, top:830, originX:'center', fontFamily:th.faces.support, fontSize:34, fill:th.ink, fontWeight:'800' }), 820));
      chip(sc, th, CX-165, 890, d.cta, 'left');
      plate = { cx:CX, cy:1000, w:600, h:104 };
    } else if (L === 'splitPanel'){
      sc.add(R({ left:0, top:0, width:596, height:H, fill:hexA(th.c2, 0.55) }));
      product(sc, p.cut, { left:1058, top:250, originX:'right', w:520 });
      sc.add(T(d.k, { left:56, top:78, fontFamily:th.faces.support, fontSize:21, fill:th.sub, fontWeight:'800', charSpacing:130 }));
      sc.add(fit(T(d.h1, { left:54, top:144, fontFamily:th.faces.display, fontSize:80, fill:th.ink }), 500));
      sc.add(fit(T(d.h2, { left:50, top:230, fontFamily:th.faces.display, fontSize:124, fill:th.accent }), 520));
      features(sc, th, 56, 420, subs.slice(0,3), 78);
      sc.add(fit(T(d.price, { left:56, top:680, fontFamily:th.faces.support, fontSize:30, fill:th.ink, fontWeight:'800' }), 500));
      plate = { cx:318, cy:830, w:520, h:112 };
    } else if (L === 'bandKnock'){
      sc.add(fit(T(d.h1, { left:64, top:104, fontFamily:th.faces.display, fontSize:90, fill:th.ink }), 640));
      sc.add(R({ left:36, top:214, width:W-72, height:194, rx:26, ry:26, fill:th.accent }));
      sc.add(fit(T(d.h2, { left:CX, top:311, originX:'center', originY:'center', fontFamily:th.faces.display,
        fontSize:150, fill:th.onAccent }), W-140));
      product(sc, p.cut, { left:1046, top:452, originX:'right', w:400 });
      sc.add(fit(T(items.slice(0,3).join('\n'), { left:64, top:470, fontFamily:th.faces.support, fontSize:30,
        fill:th.ink, fontWeight:'700', lineHeight:1.5 }), 560));
      chip(sc, th, 64, 690, d.badges.join(' · '), 'left');
      plate = { cx:CX, cy:930, w:660, h:122 };
    } else if (L === 'posterFrame'){
      sc.add(R({ left:44, top:44, width:W-88, height:H-88, rx:22, ry:22, fill:'rgba(0,0,0,0)',
        stroke:hexA(th.ink,0.42), strokeWidth:2.5 }));
      sc.add(T(d.k, { left:CX, top:110, originX:'center', fontFamily:th.faces.support, fontSize:22, fill:th.sub, fontWeight:'800', charSpacing:170 }));
      sc.add(fit(T(d.h1, { left:CX, top:180, originX:'center', fontFamily:th.faces.display, fontSize:78, fill:th.ink }), 800));
      sc.add(fit(T(d.h2, { left:CX, top:262, originX:'center', fontFamily:th.faces.display, fontSize:146, fill:th.accent }), 860));
      product(sc, p.cut, { left:CX, top:452, originX:'center', w:330 });
      sc.add(fit(T(d.price, { left:CX, top:772, originX:'center', fontFamily:th.faces.support, fontSize:32, fill:th.ink, fontWeight:'800' }), 760));
      plate = { cx:CX, cy:900, w:600, h:112 };
    } else { // lowerThird
      product(sc, p.cut, { left:CX, top:120, originX:'center', w:560 });
      sc.add(R({ left:0, top:606, width:W, height:H-606, fill:hexA(th.c1, 0.90) }));
      sc.add(T(d.k, { left:64, top:648, fontFamily:th.faces.support, fontSize:21, fill:th.sub, fontWeight:'800', charSpacing:140 }));
      sc.add(fit(T(d.h1 + ' ' + d.h2, { left:62, top:696, fontFamily:th.faces.display, fontSize:96, fill:th.ink }), W-130));
      sc.add(fit(T(items.slice(0,3).join(' · '), { left:64, top:812, fontFamily:th.faces.support, fontSize:26, fill:th.sub, fontWeight:'600' }), W-140));
      chip(sc, th, W-56, 646, d.badges[0], 'right');
      plate = { cx:CX, cy:930, w:680, h:118 };
    }
    return plate;
  }

  const out = [];
  for (let i = 0; i < THEMES.length; i++){
    const th = THEMES[i], p = PLAN[i];
    try {
      const sc = new fabric.StaticCanvas(null, { width:W, height:H, renderOnAddRemove:false });
      const im = freshBgImage(p.bgSrc);
      if (im){
        try { im.filters = [new fabric.Image.filters.Grayscale(),
                            new fabric.Image.filters.Contrast({ contrast: 0.06 })];
              im.applyFilters(); } catch(e){}
        sc.setBackgroundImage(coverImage(im, W, H), () => {});
      }
      sc.add(R({ left:0, top:0, width:W, height:H, fill: hexA(th.c1, p.wash) }));
      sc.add(R({ left:0, top:H*0.52, width:W, height:H*0.48,
        fill: objGrad({ c1: hexA(th.c1, 0), c2: hexA(th.c2, 0.5), a: 90 }) }));

      const pl = compose(sc, th, p);
      /* keep the plate clear of the website line: each layout proposes its own
         y, and heroCut's put the capsule straight through it */
      pl.cy = Math.min(pl.cy, H - 78 - pl.h/2);
      const g = drawPlate(sc, th, pl.cx, pl.cy, pl.w, pl.h);
      sc.renderAll();
      const px = sc.lowerCanvasEl.getContext('2d')
        .getImageData(Math.round(g.nx-150), Math.round(g.ny-16), 300, 32).data;
      let L = 0, n = 0;
      for (let k = 0; k < px.length; k += 4){ L += lumPx(px, k); n++; }
      L /= (n||1);
      const ink = (1.05/(L+0.05)) > ((L+0.05)/0.05) ? '#ffffff' : '#101014';
      sc.add(new fabric.Text('(562) 999-4994', { left:g.nx, top:g.ny, originX:'center', originY:'center',
        fontFamily:th.faces.num, fontSize:Math.round(pl.h*0.50), fill:ink, fontWeight:'700', charSpacing:8 }));
      sc.add(new fabric.Text('iphones.LA', { left:CX, top:H-30, originX:'center', originY:'center',
        fontFamily:th.faces.support, fontSize:21, fill:th.sub, fontWeight:'600', charSpacing:60 }));
      sc.renderAll();

      const c = document.createElement('canvas');
      c.width = SIZE; c.height = SIZE;
      const g2 = c.getContext('2d'); g2.imageSmoothingQuality = 'high';
      g2.drawImage(sc.lowerCanvasEl, 0, 0, W, H, 0, 0, SIZE, SIZE);
      out.push({ id:th.id, name:th.name, family:th.family, faces:th.faces,
                 c1:th.c1, ink:th.ink, accent:th.accent, support:th.support,
                 plate:th.plate.shape+'/'+th.plate.fill, cat:p.cat, layout:p.layout,
                 product:p.cut.split('/').pop().replace('.webp',''),
                 png: c.toDataURL('image/webp', 0.82) });
      sc.dispose();
    } catch(e){ out.push({ id:th.id, err:String(e).slice(0,140) }); }
    await new Promise(r => setTimeout(r, 0));
  }
  return out;
}, THEMES, PLAN);
await browser.close();

const ok = cards.filter(c => !c.err), bad = cards.filter(c => c.err);
ok.forEach(c => writeFileSync(OUT + c.id + '.webp', Buffer.from(c.png.split(',')[1],'base64')));
writeFileSync(OUT + 'manifest.json', JSON.stringify(ok.map(({png,...r}) => r), null, 1));
const mb = ok.reduce((s,c) => s + Buffer.from(c.png.split(',')[1],'base64').length, 0)/1048576;
console.log(`rendered ${ok.length}/${cards.length} · ${mb.toFixed(1)} MB`);
console.log('categories: ' + [...new Set(ok.map(c=>c.cat))].join(', '));
console.log('layouts: ' + [...new Set(ok.map(c=>c.layout))].join(', '));
console.log('distinct products: ' + new Set(ok.map(c=>c.product)).size);
if (bad.length) bad.slice(0,6).forEach(c => console.log('  FAIL ' + c.id + ' ' + c.err));
if (perr.length) console.log('page errors: ' + perr.slice(0,3).join(' | '));
