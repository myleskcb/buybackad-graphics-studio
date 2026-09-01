#!/usr/bin/env node
/* CONVERGE THE THEME INK TABLE AGAINST THE REAL RENDER.
 *
 * bake_contrast.mjs measures the MODELLED state (?nofix=1) and predicts what a
 * candidate ink will deliver. Its prediction is systematically optimistic --
 * it scores an ink as if it painted at exactly its own luminance on every glyph
 * pixel, while the render adds anti-aliasing, strokes and a halo. Measured, the
 * delivered contrast came in around 0.74x the predicted one.
 *
 * A global correction factor gets most of the way and stops. This closes the
 * rest by doing the obvious thing: load the app WITH the table applied, measure
 * what actually rendered, and for anything still short, derive the next ink
 * from a per-layer delivery factor -- that layer's own actual/predicted ratio,
 * not the library's average. Repeat until nothing improves.
 *
 * Because every round measures the repaired state, this converges by
 * construction rather than by calibration. It is the loop converge_contrast.sh
 * was reaching for; that one re-ran a bake that reads ?nofix=1, so every round
 * measured the same unrepaired page and the table never moved.
 *
 * usage: node scripts/converge_themes.mjs [maxRounds]   (needs a server on :8899)
 */
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';
const TABLE = new URL('../assets/contrast-fix.json', import.meta.url).pathname;
const MAX = +(process.argv[2] || 6);

const measureAndPropose = async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless:'new', args:['--no-sandbox'], protocolTimeout: 0 });
  const page = await browser.newPage();
  const perr = [];
  page.on('pageerror', e => perr.push(String(e).slice(0,200)));
  await page.goto(BASE, { waitUntil:'networkidle2', timeout:60000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => typeof CONTRAST_FIX !== 'undefined' && CONTRAST_FIX !== null, { timeout:20000 }).catch(()=>{});
  await new Promise(r => setTimeout(r, 6000));

  const res = await page.evaluate(async () => {
    const W = TPL_W, H = TPL_H;
    const isText = l => l.kind === 'text' || l.kind === 'textbox' || (!l.kind && l.text);
    const lin = c => { c/=255; return c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4); };
    const lumPx = (d,i) => 0.2126*lin(d[i]) + 0.7152*lin(d[i+1]) + 0.0722*lin(d[i+2]);
    const cr = (a,b) => (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
    const hexOf = (r,g,b) => '#' + [r,g,b].map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('');
    const hexLumOf = h => { const n=parseInt(String(h).replace('#',''),16);
      return 0.2126*lin((n>>16)&255)+0.7152*lin((n>>8)&255)+0.0722*lin(n&255); };
    const toHsl = hex => { const n=parseInt(String(hex).replace('#',''),16);
      const r=((n>>16)&255)/255,g=((n>>8)&255)/255,b=(n&255)/255;
      const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn,l=(mx+mn)/2;
      if(!d) return [0,0,l];
      const s=l>0.5?d/(2-mx-mn):d/(mx+mn);
      let h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4; h*=60; return [h<0?h+360:h,s,l]; };
    const toHex = (h,s,l) => { const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;
      const [r,g,b]=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
      return hexOf((r+m)*255,(g+m)*255,(b+m)*255); };

    function paint(tpl, { noText=false, skipOne=-1 } = {}){
      const sc = new fabric.StaticCanvas(null, { width:W, height:H, renderOnAddRemove:false });
      const bgi = tpl.bg.type === 'image' ? freshBgImage(tpl.bg.src, tpl.bg.blur, tpl.bg.grade) : null;
      if (bgi){
        sc.setBackgroundImage(coverImage(bgi, W, H), () => {});
        if (tpl.bg.scrim) sc.add(scrimRect(tpl.bg.scrim, W, H, tpl.bg.scrimColor, tpl.bg.scrimMode));
      } else sc.add(bgRectFor(tpl.bg.type==='image'?(tpl.bg.fallback||{type:'solid',c:'#101014'}):tpl.bg, W, H));
      const refs = [];
      tpl.layers.forEach((l,i) => {
        if (i === skipOne){ refs.push(null); return; }
        if (noText && isText(l)){ refs.push(null); return; }
        const o = buildLayer(l, tpl.id); sc.add(o); refs.push(o);
      });
      alignPass(sc, W, H); sc.renderAll();
      const d = sc.lowerCanvasEl.getContext('2d').getImageData(0,0,W,H).data;
      sc.dispose();
      return { d, refs };
    }

    const out = [];
    const lib = TEMPLATES;
    for (const tpl of lib){
      let full;
      try { full = paint(tpl); } catch(e){ continue; }
      const boxes = tpl.layers.map((l,i) => {
        const o = full.refs[i];
        if (!o || !isText(l) || !String(l.text||'').trim()) return null;
        return { i, l, b:o.getBoundingRect(true,true), fs:Math.round(o.fontSize||0) };
      }).filter(Boolean);
      const ov = (a,b) => !(a.left+a.width<=b.left || b.left+b.width<=a.left || a.top+a.height<=b.top || b.top+b.height<=a.top);

      for (const info of boxes){
        /* Remove exactly the layer being measured -- never "all the text at
           once". alignPass() moves what remains, so stripping every text layer
           shifts the plates underneath and hands back a ground that was never
           under anything. That shortcut had this loop reading 1.30 on a layer
           that measures 4.86, and a loop that mismeasures does not converge,
           it wanders. */
        let g;
        try { g = paint(tpl, { skipOne:info.i }); } catch(e){ continue; }
        const b = info.b;
        const x0=Math.max(0,Math.floor(b.left)), y0=Math.max(0,Math.floor(b.top));
        const x1=Math.min(W,Math.ceil(b.left+b.width)), y1=Math.min(H,Math.ceil(b.top+b.height));
        const hits = [];
        for (let y=y0;y<y1;y++) for (let x=x0;x<x1;x++){
          const p=(y*W+x)*4;
          const df = Math.abs(full.d[p]-g.d[p])+Math.abs(full.d[p+1]-g.d[p+1])+Math.abs(full.d[p+2]-g.d[p+2]);
          if (df < 150) continue;
          hits.push({ p, gl:lumPx(g.d,p), fl:lumPx(full.d,p) });
        }
        if (hits.length < 40) continue;
        // drop halo pixels: they move the opposite way to the ink
        let pol = 0; hits.forEach(h => pol += (h.fl > h.gl ? 1 : -1));
        const dir = pol >= 0 ? 1 : -1;
        const core = hits.filter(h => (h.fl > h.gl ? 1 : -1) === dir);
        if (core.length < 40) continue;

        const grounds = core.map(h => h.gl);
        const actual = core.reduce((s,h) => s + cr(h.fl,h.gl), 0) / core.length;
        let iR=0,iG=0,iB=0;
        core.forEach(h => { iR+=full.d[h.p]; iG+=full.d[h.p+1]; iB+=full.d[h.p+2]; });
        const inkHex = hexOf(iR/core.length, iG/core.length, iB/core.length);
        const inkL = hexLumOf(inkHex);
        const scoreOf = L => {
          const cs = grounds.map(gg => cr(L,gg)).sort((a,b)=>a-b);
          return { mean: cs.reduce((s,v)=>s+v,0)/cs.length, p10: cs[Math.floor(cs.length*0.10)] };
        };
        const want = info.l.role === 'deco' ? 2.5 : (info.fs >= 30 ? 3.0 : 4.5);
        if (actual >= want * 1.02){
          out.push({ id:tpl.id, layer:info.l.name, role:info.l.role, fs:info.fs, actual:+actual.toFixed(2), ok:true });
          continue;
        }
        /* PER-LAYER DELIVERY. What this exact layer actually delivered against
           what the ideal model said it would. Anti-aliasing on a hairline
           script face costs far more than on a 240px slab, so one global factor
           cannot serve both. */
        const pred = scoreOf(inkL).mean;
        const delivery = Math.max(0.35, Math.min(1.15, actual / (pred || 1)));

        const [h,s] = toHsl(inkHex);
        const cands = ['#f7f3ec', '#141110', '#ffffff', '#000000'];
        for (let L=0.03; L<=0.98; L+=0.05) cands.push(toHex(h,s,L));
        if (s > 0.05) for (let L=0.03; L<=0.98; L+=0.05) cands.push(toHex(h, Math.min(1,s*0.5), L));
        const target = want * 1.06;
        let best = null;
        cands.forEach(hex => {
          const sc = scoreOf(hexLumOf(hex));
          const est = sc.mean * delivery;             // what it should actually deliver
          const estP10 = sc.p10 * delivery;
          const key = Math.min(est, target*1.6)*100 + Math.min(estP10, target*1.6);
          if (!best || key > best.key) best = { hex, key, est:+est.toFixed(2), estP10:+estP10.toFixed(2) };
        });
        /* Smallest move that clears the floor -- but only if it clears it with
           room to spare. Preferring the nearest passing ink at target*1.00 put
           dl_phones_reviewProof_ocean's CTA on #8c8982, predicted 3.21 against
           a floor of 3.0, delivered 2.76. A repair that lands inside its own
           error bar is not a repair. */
        const ok = cands.map(hex => { const sc = scoreOf(hexLumOf(hex));
            return { hex, est:sc.mean*delivery, estP10:sc.p10*delivery }; })
          .filter(c => c.est >= want*1.3 && c.estP10 >= want*0.95)
          .sort((a,b) => Math.abs(hexLumOf(a.hex)-inkL) - Math.abs(hexLumOf(b.hex)-inkL));
        if (ok.length) best = { hex:ok[0].hex, est:+ok[0].est.toFixed(2), estP10:+ok[0].estP10.toFixed(2) };
        /* Same plate test the bake uses, from the rendered ground rather than
           the layer list: a plate is a ground with almost no variance, a
           photograph always varies. Writing onPlate:false unconditionally (as
           this loop first did) tells app.js to hang a halo on text that is
           already sitting on its own solid colour, which rule 21 forbids and
           which only fuzzes the letterform. */
        const gs = grounds.slice().sort((a,b)=>a-b);
        const q = f => gs[Math.min(gs.length-1, Math.floor(gs.length*f))];
        const onPlate = (q(0.95) - q(0.05)) < 0.06;
        /* forceHalo: this layer was MEASURED short, in the real render, after
           the previous round's ink was applied. app.js cannot know that on its
           own — it only has the bake's prediction, which by definition says the
           ink is enough, so a layer that keeps missing never qualified for a
           separation device. That is why ten 18-28px info/website lines sat at
           4.0-4.4 against a 4.5 floor through three rounds of recolouring: no
           ink reaches 4.5 on a mid-luminance ground, and nothing else was
           allowed to help. Not set for text on a plate (rule 21). */
        out.push({ id:tpl.id, layer:info.l.name, role:info.l.role, fs:info.fs,
                   actual:+actual.toFixed(2), want, ok:false,
                   inkFix:best.hex, cr:best.est, p10:best.estP10,
                   forceHalo: !onPlate && best.est < want * 1.35,
                   onPlate, delivery:+delivery.toFixed(3) });
      }
      await new Promise(r=>setTimeout(r,0));
    }
    return out;
  });
  await browser.close();
  return { res, perr };
};

let table = JSON.parse(readFileSync(TABLE,'utf8'));
const key = (id,l) => id + '||' + l;
let prevFail = Infinity;

for (let round = 1; round <= MAX; round++){
  const { res, perr } = await measureAndPropose();
  const bad = res.filter(r => !r.ok);
  const crit = bad.filter(r => r.role==='headline'||r.role==='phone'||r.role==='cta');
  console.log(`round ${round}: ${res.length} layers measured · ${bad.length} below floor · ${crit.length} critical`);
  if (perr.length) console.log('   page errors: ' + perr.slice(0,2).join(' | '));
  if (!bad.length){ console.log('   nothing left to fix'); break; }
  if (bad.length >= prevFail){ console.log('   no further improvement — converged'); break; }
  prevFail = bad.length;

  const byKey = {};
  table.forEach(f => byKey[key(f.id,f.layer)] = f);
  let added = 0, updated = 0;
  bad.forEach(r => {
    const k = key(r.id, r.layer);
    const entry = { id:r.id, layer:r.layer, role:r.role, fs:r.fs, onPlate:false,
                    was:r.actual, cr:r.cr, p10:r.p10, inkFix:r.inkFix, ground:0.5 };
    if (byKey[k]){ Object.assign(byKey[k], entry); updated++; }
    else { table.push(entry); byKey[k] = entry; added++; }
  });
  writeFileSync(TABLE, JSON.stringify(table, null, 0));
  console.log(`   table: ${added} added, ${updated} updated, ${table.length} entries total`);
}
console.log('\nfinal table: ' + table.length + ' entries -> ' + TABLE);
