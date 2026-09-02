#!/usr/bin/env node
/* For the templates the PIXEL audit flagged, report the phone layer's final
   fill/opacity/stroke and the fabric object's effective paint — the authored
   value and the painted value are not the same thing. */
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';
const audit = JSON.parse(readFileSync(new URL('../.render/phone-audit.json', import.meta.url).pathname));
const bad = audit.filter(r => !r.error && (r.coverage < 4 || r.meanContrast < 3)).map(r => r.id);

const browser = await puppeteer.launch({ executablePath: CHROME, headless:'new', args:['--no-sandbox'] });
const page = await browser.newPage();
await page.goto(BASE, { waitUntil:'networkidle2', timeout:60000 });
await page.evaluate(() => document.fonts.ready);
// Wait for the measured contrast table (assets/contrast-fix.json) to load and
// apply. It is fetched asynchronously, so a harness that starts measuring too
// early records the PRE-repair colours and reports failures that are already
// fixed on screen.
await page.waitForFunction(() => typeof CONTRAST_FIX !== 'undefined' && CONTRAST_FIX !== null, { timeout: 20000 }).catch(()=>{});
await new Promise(r => setTimeout(r, 5000));

const out = await page.evaluate((ids) => {
  const W = TPL_W, H = TPL_H;
  return ids.map(id => {
    const t = TEMPLATES.find(x => x.id === id);
    if (!t) return { id, error:'missing' };
    const pi = t.layers.findIndex(l => l.role === 'phone');
    const ph = t.layers[pi];
    // build and read the PAINTED object
    const sc = new fabric.StaticCanvas(null, { width:W, height:H, renderOnAddRemove:false });
    let ref = null;
    t.layers.forEach(l => { const o = buildLayer(l, t.id); sc.add(o); if (l.role==='phone' && !ref) ref = o; });
    alignPass(sc, W, H);
    const painted = ref ? {
      fill: typeof ref.fill === 'object' ? 'GRADIENT:' + JSON.stringify((ref.fill.colorStops||[]).map(s=>s.color)) : ref.fill,
      opacity: ref.opacity, visible: ref.visible,
      stroke: ref.stroke, strokeWidth: ref.strokeWidth,
      fontSize: ref.fontSize, text: ref.text,
      scaleX: +(ref.scaleX||1).toFixed(3),
      box: (b => ({l:Math.round(b.left),t:Math.round(b.top),w:Math.round(b.width),h:Math.round(b.height)}))(ref.getBoundingRect(true,true)),
    } : null;
    sc.dispose();
    return { id, style:t.style, layerIndex:pi, totalLayers:t.layers.length,
             authored: { fill: ph.props.fill, opacity: ph.props.opacity, fontSize: ph.props.fontSize,
                         top: ph.props.top, left: ph.props.left },
             painted };
  });
}, bad);
await browser.close();

console.log('inspecting ' + out.length + ' flagged templates\n');
const cnt = {};
out.forEach(r => {
  if (r.error) return;
  const key = `authored=${r.authored.fill} -> painted=${r.painted && r.painted.fill} op=${r.painted && r.painted.opacity}`;
  (cnt[key] ||= []).push(r.id);
});
Object.entries(cnt).sort((a,b)=>b[1].length-a[1].length).forEach(([k,v]) => {
  console.log(`${String(v.length).padStart(3)}x  ${k}`);
  console.log(`      ${v.slice(0,5).join(', ')}`);
});
console.log('\nsample detail:');
console.log(JSON.stringify(out.slice(0,3), null, 2));
