#!/usr/bin/env node
/* THEME AUDIT, MEASURED ON THE REAL RENDER.
 *
 * theme_law.mjs grades the declared colours. Half of what it grades — every
 * ink/accent-vs-bg1/bg2 number — is the FALLBACK gradient, which only paints
 * when a backdrop photo fails to load. All 243 templates ship `bg.type:'image'`
 * with a photo that exists, so those numbers describe a path the customer
 * normally never sees. Reporting them as if they were the shipped look is
 * exactly the "measured something adjacent" mistake this repo has made four
 * times (HANDOFF §8).
 *
 * So this measures the pixels. Method is legibility_audit.mjs's, which is the
 * only honest one available: render the template with its text and again
 * without it, and diff inside each text layer's box. What the glyphs changed IS
 * the ink; what is underneath IS the ground. No blend maths to get wrong.
 *
 * Two cheap changes to that method, because the question here is per-THEME not
 * per-layer: strip ALL text at once rather than one layer at a time (2 renders
 * per template instead of N+1, and plates/cutouts stay in so the ground is the
 * real ground), and run the whole library twice — once on the photo path as it
 * ships, once with the photo suppressed so the fallback gradient is forced.
 * The gap between those two runs is the fallback risk, quantified.
 *
 * usage: node scripts/theme_render.mjs            (needs a server on :8899)
 */
import puppeteer from 'puppeteer-core';
import { writeFileSync, mkdirSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';
const OUT = new URL('../.render/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless:'new', args:['--no-sandbox'], protocolTimeout: 0 });
const page = await browser.newPage();
const perr = [];
page.on('pageerror', e => perr.push(String(e).slice(0,200)));
await page.goto(BASE, { waitUntil:'networkidle2', timeout:60000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => typeof CONTRAST_FIX !== 'undefined' && CONTRAST_FIX !== null, { timeout:20000 }).catch(()=>{});
await new Promise(r => setTimeout(r, 6000));

const rows = await page.evaluate(async () => {
  const W = TPL_W, H = TPL_H;
  const isText = l => l.kind === 'text' || l.kind === 'textbox' || (!l.kind && l.text);

  /* forceFallback: suppress the photo so bgRectFor() paints the palette
     gradient — the path the manifest promises "never renders broken". */
  function paint(tpl, { noText = false, forceFallback = false, skipOne = -1 } = {}){
    const sc = new fabric.StaticCanvas(null, { width:W, height:H, renderOnAddRemove:false });
    const bgi = (!forceFallback && tpl.bg.type === 'image')
      ? freshBgImage(tpl.bg.src, tpl.bg.blur, tpl.bg.grade) : null;
    if (bgi){
      sc.setBackgroundImage(coverImage(bgi, W, H), () => {});
      if (tpl.bg.scrim) sc.add(scrimRect(tpl.bg.scrim, W, H, tpl.bg.scrimColor, tpl.bg.scrimMode));
    } else {
      sc.add(bgRectFor(tpl.bg.type === 'image' ? (tpl.bg.fallback || {type:'solid',c:'#101014'}) : tpl.bg, W, H));
    }
    const refs = [];
    tpl.layers.forEach((l, i) => {
      if (i === skipOne) { refs.push(null); return; }
      if (noText && isText(l)) { refs.push(null); return; }
      const o = buildLayer(l, tpl.id); sc.add(o); refs.push(o);
    });
    alignPass(sc, W, H);
    sc.renderAll();
    const d = sc.lowerCanvasEl.getContext('2d').getImageData(0,0,W,H);
    sc.dispose();
    return { data:d.data, refs };
  }

  const lum = (r,g,b) => { const f = c => { c/=255; return c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4); };
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
  const ratio = (a,b) => { const hi=Math.max(a,b), lo=Math.min(a,b); return (hi+0.05)/(lo+0.05); };

  function measure(tpl, forceFallback){
    let full;
    try { full = paint(tpl, { forceFallback }); }
    catch(e){ return [{ id:tpl.id, err:String(e).slice(0,90) }]; }

    const out = [];
    // boxes first, so overlap between two text layers can be flagged
    const boxes = tpl.layers.map((l,i) => {
      const o = full.refs[i];
      if (!o || !isText(l) || !String(l.text||'').trim()) return null;
      return { i, l, b:o.getBoundingRect(true,true) };
    }).filter(Boolean);
    const overlaps = (a,b) => !(a.left+a.width <= b.left || b.left+b.width <= a.left ||
                                a.top+a.height <= b.top || b.top+b.height <= a.top);
    const sample = (info, ground) => {
      const b = info.b;
      const x0=Math.max(0,Math.floor(b.left)), y0=Math.max(0,Math.floor(b.top));
      const x1=Math.min(W,Math.ceil(b.left+b.width)), y1=Math.min(H,Math.ceil(b.top+b.height));
      let changed=0,total=0,sum=0,worst=99;
      let gr=0,gg=0,gb=0,gn=0;   // mean ground under the box
      /* Collect first, decide after. Two different things change pixels inside
         a text box and they must not be averaged together:
           - the GLYPH, which moves a pixel toward the ink, and
           - the HALO, the shadow this engine adds as a separation device,
             which moves a pixel the OTHER way.
         A black halo around white type is doing its job, but its pixels look
         like very dark "ink" on a bright plate, and counting them drags the
         reported contrast toward 1:1 -- st_sports_cutouthero's phone number
         measured 2.95 with the halo counted and 12.2 without, and the eye
         agrees with 12.2. So: establish which direction this layer's ink
         moves pixels, then keep only the pixels moving that way. */
      const px = [];
      for (let y=y0;y<y1;y++) for (let x=x0;x<x1;x++){
        const i=(y*W+x)*4; total++;
        gr+=ground.data[i]; gg+=ground.data[i+1]; gb+=ground.data[i+2]; gn++;
        const dr=Math.abs(full.data[i]-ground.data[i]);
        const dg=Math.abs(full.data[i+1]-ground.data[i+1]);
        const db=Math.abs(full.data[i+2]-ground.data[i+2]);
        const df = dr+dg+db;
        if (df < 24) continue;
        changed++;
        const fl = lum(full.data[i],full.data[i+1],full.data[i+2]);
        const gl = lum(ground.data[i],ground.data[i+1],ground.data[i+2]);
        const c = ratio(fl, gl);
        sum += c; if (c < worst) worst = c;
        px.push({ df, fl, gl, c });
      }
      /* polarity: which way do the pixels the glyph fully owns move? */
      let pol = 0;
      px.forEach(q => { if (q.df >= 150) pol += (q.fl > q.gl ? 1 : -1); });
      const dir = pol >= 0 ? 1 : -1;
      let coreN=0, coreSum=0;
      px.forEach(q => {
        if (q.df < 150) return;                       // anti-aliased edge
        if ((q.fl > q.gl ? 1 : -1) !== dir) return;   // halo, not letterform
        coreN++; coreSum += q.c;
      });
      const hex = v => Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0');
      return { ground: gn ? '#'+hex(gr/gn)+hex(gg/gn)+hex(gb/gn) : null,
               id:tpl.id, layer:info.l.name, role:info.l.role,
               fs:Math.round(full.refs[info.i].fontSize||0),
               coverage:+((total?changed/total:0)*100).toFixed(2),
               edgeContrast: changed ? +(sum/changed).toFixed(2) : 0,
               core:coreN,
               contrast: coreN ? +(coreSum/coreN).toFixed(2) : (changed ? +(sum/changed).toFixed(2) : 0) };
    };

    boxes.forEach(info => {
      /* ONE RENDER PER LAYER, removing exactly the layer being measured.
         This started as a cheap two-render trick -- strip all the text at once
         and diff each box against that -- which is N+1 renders cheaper and
         wrong twice over. Overlapping boxes put one layer's glyphs into
         another's frame (st_sports_cutouthero's phone number read 2.95 against
         a plate it clears by four times that, because the CTA on the same plate
         counted as its ink). And, less obviously, alignPass() repositions what
         is left on the canvas: with every text layer gone the PLATES move, so
         the "ground" is not the ground. dl_gold_trustSeal_gold's Tile Big 4
         measured 1.30 that way and 4.86 measured properly -- a clean pass
         reported as a failure, by the audit, for no reason but its own
         shortcut. The whole point of this file is not to do that. */
      let g;
      try { g = paint(tpl, { forceFallback, skipOne: info.i }); } catch(e){ return; }
      out.push(Object.assign(
        { shared: boxes.some(o => o.i !== info.i && overlaps(info.b, o.b)) },
        sample(info, g)));
    });
    return out;
  }

  const lib = TEMPLATES.filter(t => t.id.startsWith('dl_') || t.id.startsWith('st_'));
  const photo = [], fallback = [];
  for (const t of lib){ photo.push(...measure(t, false)); await new Promise(r=>setTimeout(r,0)); }
  for (const t of lib){ fallback.push(...measure(t, true)); await new Promise(r=>setTimeout(r,0)); }

  // palette identity comes from the fallback gradient the engine built
  // the engine records it now (app.js: TEMPLATES.push({... pal ...}))
  const palOf = {};
  lib.forEach(t => { palOf[t.id] = t.pal || '?'; });
  return { photo, fallback, palOf, n:lib.length };
});
await browser.close();

/* ── map gradient stops back to palette names (PAL is IIFE-local) ───────── */
import { readFileSync } from 'node:fs';
const SRC = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const palSrc = SRC.slice(SRC.search(/const PAL = \{/), SRC.indexOf('\n  };', SRC.search(/const PAL = \{/))+4);
const PAL = (0,eval)('(' + palSrc.replace(/^const PAL = /,'').replace(/;\s*$/,'') + ')');
/* The template now carries its own palette name, so nothing has to be matched
   by colour. Matching by gradient stops broke as soon as tuneFallbacks() began
   deriving those stops per template. */
const palName = id => rows.palOf[id] || 'unknown';

/* ── role-aware WCAG floors, same as legibility_audit.mjs ───────────────── */
const need = r => r.role === 'deco' ? 2.5 : (r.fs >= 30 ? 3.0 : 4.5);
const CRIT = new Set(['headline','phone','cta']);

function summarise(list, label){
  const real = list.filter(r => r.coverage >= 1.2 && !r.err);
  const ghost = list.filter(r => !r.err && r.coverage < 1.2);
  const by = {};
  real.forEach(r => {
    const p = palName(r.id);
    (by[p] ||= { n:0, fail:0, crit:0, worst:99, worstOf:null, ghost:0 });
    by[p].n++;
    if (r.contrast < need(r)){ by[p].fail++; if (CRIT.has(r.role)) by[p].crit++; }
    if (r.contrast < by[p].worst){ by[p].worst = r.contrast; by[p].worstOf = r; }
  });
  ghost.forEach(r => { const p = palName(r.id); (by[p] ||= { n:0,fail:0,crit:0,worst:99,worstOf:null,ghost:0 }); by[p].ghost++; });
  console.log(`\n══ ${label} ══`);
  console.log('  palette   layers  below-WCAG  critical  invisible  worst  worst layer');
  Object.entries(by).sort((a,b)=>b[1].crit-a[1].crit || b[1].fail-a[1].fail).forEach(([p,s]) => {
    const w = s.worstOf;
    console.log(`  ${p.padEnd(8)} ${String(s.n).padStart(6)} ${String(s.fail).padStart(11)} ${String(s.crit).padStart(9)}` +
      ` ${String(s.ghost).padStart(10)} ${String(s.worst===99?'-':s.worst).padStart(6)}  ${w?`${w.id} · ${w.layer} (${w.role})`:''}`);
  });
  const tf = real.filter(r => r.contrast < need(r));
  const ef = real.filter(r => r.edgeContrast < need(r));
  console.log(`  --> ${real.length} text layers measured · ${tf.length} below WCAG · ` +
    `${tf.filter(r=>CRIT.has(r.role)).length} of those headline/phone/cta · ${ghost.length} effectively invisible`);
  console.log(`      (edge-inclusive mean, the old measure, would have said ${ef.length} / ` +
    `${ef.filter(r=>CRIT.has(r.role)).length} critical -- ${ef.length-tf.length} of those are anti-aliasing, not a real failure)`);
  return { real, fail:tf, ghost, by };
}

const P = summarise(rows.photo, 'AS IT SHIPS — photo backdrop + scrim (what the customer gets)');
const F = summarise(rows.fallback, 'FALLBACK PATH — photo suppressed, palette gradient forced');

console.log('\n══ FALLBACK EXPOSURE — what a missing photo costs each palette ══');
console.log('  palette   crit(photo) -> crit(fallback)   delta');
const pals = [...new Set([...Object.keys(P.by), ...Object.keys(F.by)])];
pals.sort().forEach(p => {
  const a = (P.by[p]||{crit:0}).crit, b = (F.by[p]||{crit:0}).crit;
  console.log(`  ${p.padEnd(8)} ${String(a).padStart(11)} -> ${String(b).padStart(13)}   ${b-a>0?'+':''}${b-a}`);
});

/* ── WHAT-IF: does a different INK alone clear the floor? ──────────────────
   app.js:816 already defines onAccent(P), the measured near-black/near-white
   chooser. Three call sites (app.js:780, 785, 796 -- the check glyph, the
   kicker and the PHONE NUMBER) ignore it and hard-code
   `P.paper ? '#ffffff' : P.deep`, which picks by whether the palette is light,
   not by what the ink is actually sitting on. This asks, per failing layer,
   what the better of near-white / near-black would score against the ground
   that was actually measured under it. */
const linz = c => { c/=255; return c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4); };
const lumHex = h => { const n=parseInt(h.slice(1),16);
  return 0.2126*linz((n>>16)&255)+0.7152*linz((n>>8)&255)+0.0722*linz(n&255); };
const bestInk = h => { const L = lumHex(h);
  return Math.max(1.05/(L+0.05), (L+0.05)/0.05); };

console.log('\n══ RECOVERABLE BY INK CHOICE ALONE (photo path, as it ships) ══');
const failing = P.fail;
const recover = failing.filter(r => r.ground && bestInk(r.ground) >= need(r));
const stuck   = failing.filter(r => r.ground && bestInk(r.ground) <  need(r));
console.log(`  ${failing.length} layers below WCAG · ${recover.length} clear the floor by repainting the ink only`);
console.log(`  ${stuck.length} need the GROUND changed too (plate colour, scrim, or a darker backdrop)`);
const critFail = failing.filter(r => CRIT.has(r.role));
const critRec  = critFail.filter(r => r.ground && bestInk(r.ground) >= need(r));
console.log(`  of the ${critFail.length} headline/phone/cta failures, ${critRec.length} are ink-only fixes\n`);
console.log('  worst 18 critical failures, with the ink that would fix them:');
console.log('  now   best  floor  role      template · layer                                ground');
critFail.sort((a,b)=>a.contrast-b.contrast).slice(0,18).forEach(r => {
  const best = r.ground ? bestInk(r.ground) : 0;
  const ink  = r.ground ? (1.05/(lumHex(r.ground)+0.05) > (lumHex(r.ground)+0.05)/0.05 ? 'white' : 'black') : '?';
  console.log(`  ${String(r.contrast).padStart(4)}  ${best.toFixed(2).padStart(4)}  ${String(need(r)).padStart(4)}   ${(r.role||'').padEnd(9)} ` +
    `${(r.id+' · '+r.layer).padEnd(46)} ${r.ground} -> ${ink}`);
});

if (perr.length){ console.log('\nPAGE ERRORS:'); perr.slice(0,4).forEach(e=>console.log('  '+e)); }
writeFileSync(OUT+'theme-render.json', JSON.stringify(rows,null,1));
console.log('\nwrote ' + OUT + 'theme-render.json');
