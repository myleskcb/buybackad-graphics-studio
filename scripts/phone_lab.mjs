#!/usr/bin/env node
/* RENDER THE PHONE-LINE LAB.
 *
 * Draws all 100 specs from phone_specs.mjs onto the SAME host template, in the
 * same place, and crops the same region — so what differs between two cards is
 * the treatment and nothing else. Judging a plate against a different backdrop
 * each time is not judging the plate.
 *
 * The one technique the engine did not have: real frosted glass. blurredEl()
 * blurs a whole backdrop, and the glass layouts only ever laid a flat
 * translucent tint over an unblurred photo. Here a blurred copy of the backdrop
 * is clipped to the plate shape and the tint goes over THAT, which is what
 * frosted glass actually is. The same clip does notches and punch holes.
 *
 * Ink is measured, not assumed: the plate is rendered first, the pixels where
 * the digits will land are sampled, and near-black or near-white is chosen on
 * the result — the same rule as onAccent() and the contrast table.
 *
 * usage: node scripts/phone_lab.mjs        (needs a server on :8899)
 */
import puppeteer from 'puppeteer-core';
import { writeFileSync, mkdirSync } from 'node:fs';
import { SPECS, FACES } from './phone_specs.mjs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';
/* Host chosen by measurement, not taste: scripts/_host.mjs scored every
   designer backdrop for legible detail in the crop region, and this one wins
   (detail 14.6, luminance 0.116). It matters because the tint families are
   judged on how the photograph reads THROUGH them. */
const HOST = process.env.LAB_HOST || 'dl_coins_gradientWave_royal';
const OUT = new URL('../.render/lab/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless:'new', args:['--no-sandbox'], protocolTimeout: 0 });
const page = await browser.newPage();
const perr = [];
page.on('pageerror', e => perr.push(String(e).slice(0,200)));
await page.goto(BASE, { waitUntil:'networkidle2', timeout:120000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => typeof CONTRAST_FIX !== 'undefined' && CONTRAST_FIX !== null, { timeout:30000 }).catch(()=>{});
await new Promise(r => setTimeout(r, 6000));

// load every face before measuring anything: fabric caches metrics, and a
// fallback serif measured once stays wrong for the rest of the run
await page.evaluate(async (faces) => {
  await Promise.all(faces.map(f => (typeof ensureFont === 'function' ? ensureFont(f) : Promise.resolve())));
  await document.fonts.ready;
  try { fabric.util.clearFabricFontCache(); } catch(e){}
}, FACES);
await new Promise(r => setTimeout(r, 3000));

const cards = await page.evaluate(async (SPECS, HOST) => {
  const W = TPL_W, H = TPL_H;
  const NUM = '(562) 999-4994';
  const CROP = { x: 40, y: 762, w: 1000, h: 258 };
  const tpl = TEMPLATES.find(t => t.id === HOST);
  const lin = c => { c/=255; return c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4); };
  const lumPx = (d,i) => 0.2126*lin(d[i]) + 0.7152*lin(d[i+1]) + 0.0722*lin(d[i+2]);

  // the host, minus whatever it already does at the bottom
  const keep = tpl.layers.filter(l => !/phone|cta|website/i.test(l.name || '') &&
                                      !['phone','cta','website'].includes(l.role));

  const shapeObj = (s, cx, cy) => {
    const w = s.w, h = s.h, rx = s.shape === 'pill' ? h/2 : (s.rx || 0);
    const base = { left: cx - w/2, top: cy - h/2, width: w, height: h,
                   originX:'left', originY:'top', absolutePositioned:true };
    if (s.shape === 'tag'){
      const notch = 46;
      return new fabric.Polygon([
        {x:0,y:0},{x:w-notch,y:0},{x:w,y:h/2},{x:w-notch,y:h},{x:0,y:h}
      ], Object.assign({}, base, { objectCaching:false }));
    }
    if (s.shape === 'ribbon'){
      const tail = 34;
      return new fabric.Polygon([
        {x:tail,y:0},{x:w-tail,y:0},{x:w,y:h/2},{x:w-tail,y:h},{x:tail,y:h},{x:0,y:h/2}
      ], Object.assign({}, base, { objectCaching:false }));
    }
    return new fabric.Rect(Object.assign({}, base, { rx, ry: rx, objectCaching:false }));
  };

  /* backdrop clipped to a shape — blurred for glass, sharp for a punch hole */
  const bgClip = (clip, blur) => {
    const im = freshBgImage(tpl.bg.src, blur || undefined, tpl.bg.grade);
    if (!im) return null;
    coverImage(im, W, H);
    im.clipPath = clip;
    im.selectable = false;
    return im;
  };

  function build(sc, s, withText){
    const cx = W/2, cy = 872;
    const P = { a1:'#ffc247', a2:'#ff8c33', deep:'#141110' };
    const acc = s.accent === 2 ? P.a2 : P.a1;
    const objs = [];
    const shape = () => shapeObj(s, cx, cy);

    if (s.fill === 'glass'){
      /* No blur (the backdrops are shot defocused; blurring a blur is mush and
         you cannot tell what you are looking at). So "glass" here is a colour
         filter at an opacity over the photograph as it is — which is the half
         of the effect that actually survives at thumbnail size. */
      if (s.blur){ const im = bgClip(shape(), s.blur); if (im) objs.push(im); }
      const tintRect = shape();
      tintRect.set({ fill: s.tint, absolutePositioned:false });
      if (s.drop) tintRect.set('shadow', new fabric.Shadow({ color:'rgba(0,0,0,0.38)', blur:34, offsetX:0, offsetY:14 }));
      objs.push(tintRect);
    } else if (s.fill === 'solid' || s.fill === 'grad'){
      const p = shape();
      p.set({ absolutePositioned:false });
      if (s.fill === 'grad') p.set('fill', objGrad({ c1:P.a1, c2:P.a2, a:95 }));
      else p.set('fill', acc);
      p.set('shadow', new fabric.Shadow({ color:'rgba(0,0,0,0.42)', blur:26, offsetX:0, offsetY:10 }));
      objs.push(p);
    }
    if (s.rim && s.shape !== 'none'){
      const r = shape();
      const RIM = { hair:['rgba(255,255,255,0.42)', 1],
                    spec:['rgba(255,255,255,0.72)', 2] }[s.rim]
               || [s.hairline ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.34)', s.hairline ? 1.5 : 1.25];
      r.set({ absolutePositioned:false, fill:'rgba(0,0,0,0)', stroke:RIM[0], strokeWidth:RIM[1] });
      objs.push(r);
    }
    /* SPECULAR. What actually makes a capsule read as glass at 250px wide is
       not the blur -- it is a bright, tight highlight along the top edge and a
       dimmer one catching the bottom. Two rects and no filters. */
    if (s.spec && s.shape !== 'none'){
      const rr = (s.shape === 'pill' ? s.h/2 : (s.rx||0));
      objs.push(new fabric.Rect({ left: cx - s.w/2 + rr*0.55, top: cy - s.h/2 + 2.5,
        width: s.w - rr*1.1, height: 3, rx:1.5, ry:1.5,
        fill:'rgba(255,255,255,0.80)', originX:'left', originY:'top' }));
      objs.push(new fabric.Rect({ left: cx - s.w/2 + rr*0.9, top: cy + s.h/2 - 4,
        width: s.w - rr*1.8, height: 2, rx:1, ry:1,
        fill:'rgba(255,255,255,0.26)', originX:'left', originY:'top' }));
    }
    /* a second sheet inset inside the first: depth without a drop shadow */
    if (s.inner && s.shape !== 'none'){
      const inset = 9;
      const i2 = shapeObj(Object.assign({}, s, { w:s.w-inset*2, h:s.h-inset*2,
        rx: Math.max(0,(s.rx||0)-inset) }), cx, cy);
      i2.set({ absolutePositioned:false, fill:'rgba(255,255,255,0.07)',
               stroke:'rgba(255,255,255,0.16)', strokeWidth:1 });
      objs.push(i2);
    }
    if (s.sheen && s.shape !== 'none'){
      const rr = (s.shape === 'pill' ? s.h/2 : (s.rx||0)) * 0.8;
      objs.push(new fabric.Rect({ left: cx - s.w/2 + rr + 8, top: cy - s.h/2 + 7,
        width: s.w - (rr + 8)*2, height: 9, rx:4.5, ry:4.5,
        fill:'rgba(255,255,255,0.16)', originX:'left', originY:'top' }));
    }
    if (s.shape === 'stub'){
      // punch two notches out of the sides by painting the backdrop back in
      [-1, 1].forEach(dir => {
        const c = new fabric.Circle({ left: cx + dir*(s.w/2) - 19, top: cy - 19,
          radius: 19, originX:'left', originY:'top', absolutePositioned:true });
        const im = bgClip(c, 0);
        if (im) objs.push(im);
      });
    }
    if (s.shape === 'tag'){
      const c = new fabric.Circle({ left: cx + s.w/2 - 34, top: cy - 11, radius: 11,
        originX:'left', originY:'top', absolutePositioned:true });
      const im = bgClip(c, 0);
      if (im) objs.push(im);
    }
    if (s.bracket){
      const bw = s.w/2, bh = s.h/2, len = 30, t = 4;
      [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx, sy]) => {
        objs.push(new fabric.Rect({ left: cx + sx*bw - (sx>0?len:0), top: cy + sy*bh - (sy>0?t:0),
          width: len, height: t, fill:'#ffffff', originX:'left', originY:'top' }));
        objs.push(new fabric.Rect({ left: cx + sx*bw - (sx>0?t:0), top: cy + sy*bh - (sy>0?len:0),
          width: t, height: len, fill:'#ffffff', originX:'left', originY:'top' }));
      });
    }
    if (s.rule){
      objs.push(new fabric.Rect({ left: cx - s.w/2 + 40, top: cy + s.size*0.42,
        width: s.w - 80, height: s.rule, fill:'#ffffff', originX:'left', originY:'top' }));
    }
    objs.forEach(o => sc.add(o));
    return { cx, cy, acc };
  }

  function textFor(s, cx, cy, ink){
    const out = [];
    let nx = cx;
    if (s.split){
      const bw = 150;
      out.push(new fabric.Text(s.icon || '✆', { left: cx - s.w/2 + bw/2, top: cy,
        originX:'center', originY:'center', fontFamily:'Satoshi', fontSize: 46,
        fill: ink, fontWeight:'900' }));
      out.push(new fabric.Rect({ left: cx - s.w/2 + bw, top: cy - s.h/2 + 16, width:1.5,
        height: s.h - 32, fill:'rgba(0,0,0,0.22)', originX:'left', originY:'top' }));
      nx = cx + bw/2;
    } else if (s.icon){
      out.push(new fabric.Text(s.icon, { left: cx - s.w/2 + 52, top: cy,
        originX:'center', originY:'center', fontFamily:'Satoshi', fontSize: 40,
        fill: ink, fontWeight:'900' }));
      nx = cx + 26;
    }
    if (s.kicker){
      out.push(new fabric.Text(s.kicker, { left: nx, top: cy - s.size*0.62 - 16,
        originX:'center', originY:'center', fontFamily:'Satoshi', fontSize: 23,
        fill: ink, fontWeight:'800', charSpacing: 120, opacity: 0.86 }));
    }
    out.push(new fabric.Text(NUM, { left: nx, top: cy + (s.kicker ? 16 : 0),
      originX:'center', originY:'center', fontFamily: s.face, fontSize: s.size,
      fill: ink, fontWeight: s.weight || '700', charSpacing: (s.track || 0) * 10,
      shadow: (s.fill === 'none' || s.hairline)
        ? new fabric.Shadow({ color:'rgba(0,0,0,0.66)', blur: Math.round(s.size*0.22), offsetX:0, offsetY:2 })
        : null }));
    return out;
  }

  function scene(){
    const sc = new fabric.StaticCanvas(null, { width:W, height:H, renderOnAddRemove:false });
    const bgi = freshBgImage(tpl.bg.src, tpl.bg.blur, tpl.bg.grade);
    if (bgi){
      sc.setBackgroundImage(coverImage(bgi, W, H), () => {});
      if (tpl.bg.scrim) sc.add(scrimRect(tpl.bg.scrim, W, H, tpl.bg.scrimColor, tpl.bg.scrimMode));
    } else sc.add(bgRectFor(tpl.bg.fallback, W, H));
    keep.forEach(l => { try { sc.add(buildLayer(l, tpl.id)); } catch(e){} });
    return sc;
  }

  const out = [];
  for (const s of SPECS){
    try {
      // pass 1: plate only, so the ink can be chosen from what is actually there
      const sc = scene();
      const { cx, cy } = build(sc, s, false);
      sc.renderAll();
      const probe = sc.lowerCanvasEl.getContext('2d')
        .getImageData(Math.round(cx - s.w*0.34), Math.round(cy - 16), Math.round(s.w*0.68), 32).data;
      let L = 0, n = 0;
      for (let i = 0; i < probe.length; i += 4){ L += lumPx(probe, i); n++; }
      L /= (n || 1);
      const ink = s.ink === 'auto'
        ? ((1.05/(L+0.05)) > ((L+0.05)/0.05) ? '#f7f3ec' : '#141110')
        : s.ink;
      textFor(s, cx, cy, ink).forEach(o => sc.add(o));
      sc.renderAll();

      const c = document.createElement('canvas');
      c.width = CROP.w; c.height = CROP.h;
      c.getContext('2d').drawImage(sc.lowerCanvasEl, CROP.x, CROP.y, CROP.w, CROP.h, 0, 0, CROP.w, CROP.h);
      out.push({ id:s.id, family:s.family, face:s.face, fill:s.fill, shape:s.shape,
                 blur:s.blur||0, ink, groundLum:+L.toFixed(3),
                 png: c.toDataURL('image/webp', 0.86) });
      sc.dispose();
    } catch(e){ out.push({ id:s.id, family:s.family, err:String(e).slice(0,120) }); }
    await new Promise(r => setTimeout(r, 0));
  }
  return out;
}, SPECS, HOST);
await browser.close();

const ok = cards.filter(c => !c.err);
const bad = cards.filter(c => c.err);
ok.forEach(c => writeFileSync(OUT + c.id + '.webp', Buffer.from(c.png.split(',')[1], 'base64')));
writeFileSync(OUT + 'manifest.json', JSON.stringify(
  ok.map(({png, ...rest}) => rest), null, 1));
const bytes = ok.reduce((s,c) => s + Buffer.from(c.png.split(',')[1],'base64').length, 0);
console.log(`rendered ${ok.length}/${cards.length} · ${(bytes/1048576).toFixed(1)} MB total · host ${HOST}`);
if (bad.length){ console.log('failed:'); bad.slice(0,8).forEach(c => console.log('  ' + c.id + ' ' + c.err)); }
if (perr.length){ console.log('page errors: ' + perr.slice(0,3).join(' | ')); }
console.log('wrote ' + OUT);
