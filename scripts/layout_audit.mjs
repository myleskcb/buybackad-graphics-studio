#!/usr/bin/env node
/* LAYOUT INTEGRITY AUDIT — clipping and collisions, measured on real objects.
 *
 * Two failure modes the contrast audits cannot see:
 *   1. CLIP     — a layer's painted box crosses the canvas edge, so glyphs are
 *                 sliced off. A phone number missing its last digits is worse
 *                 than no phone number, because it looks correct at thumbnail
 *                 size and fails only where it costs a call.
 *   2. COLLIDE  — two text layers overlap enough to garble each other.
 *
 * Everything is measured AFTER alignPass, on the fabric objects, because the
 * authored props are not where the layer ends up.
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';
const OUT = new URL('../.render/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless:'new', args:['--no-sandbox'] });
const page = await browser.newPage();
const perr = [];
page.on('pageerror', e => perr.push(String(e)));
await page.goto(BASE, { waitUntil:'networkidle2', timeout:60000 });
await page.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 6000));

const rows = await page.evaluate(() => {
  const W = TPL_W, H = TPL_H;
  const out = [];
  TEMPLATES.forEach(t => {
    const sc = new fabric.StaticCanvas(null, { width:W, height:H, renderOnAddRemove:false });
    const objs = [];
    t.layers.forEach(l => { const o = buildLayer(l, t.id); sc.add(o); objs.push({ l, o }); });
    alignPass(sc, W, H);

    const clips = [], hits = [];
    const texts = [];
    objs.forEach(({ l, o }) => {
      const b = o.getBoundingRect(true, true);
      const isText = typeof l.text === 'string';
      // 2px tolerance: antialiasing and stroke can round a hair past the edge
      const over = { l: b.left < -2, t: b.top < -2, r: b.left + b.width > W + 2, b: b.top + b.height > H + 2 };
      if (isText && (over.l || over.t || over.r || over.b)){
        clips.push({ name:l.name, role:l.role, text:String(l.text).slice(0,24),
                     box:{l:Math.round(b.left),t:Math.round(b.top),w:Math.round(b.width),h:Math.round(b.height)},
                     over:Object.keys(over).filter(k=>over[k]).join('') });
      }
      if (isText && String(l.text).trim()) texts.push({ name:l.name, role:l.role, b, curved: !!(l.opts && l.opts.curve) || !!l.curve });
    });

    /* Pairwise text overlap.
       CURVED layers are excluded: an arced headline reports the bounding box of
       the whole arc, which is enormous and mostly empty, so a straight line of
       type sitting in the arc's hollow reads as a 34% "collision" while the
       glyphs never touch. That false positive accounted for 8 of the 17 hits
       this audit originally reported, and chasing it would have meant moving
       type that was correctly placed. Bounding boxes are the wrong instrument
       for curved text; until this measures glyphs, it does not get a vote. */
    for (let i = 0; i < texts.length; i++){
      for (let j = i+1; j < texts.length; j++){
        const a = texts[i], c = texts[j];
        if (a.role === 'deco' || c.role === 'deco') continue;
        if (a.curved || c.curved) continue;   // see note above
        const ox = Math.min(a.b.left+a.b.width, c.b.left+c.b.width) - Math.max(a.b.left, c.b.left);
        const oy = Math.min(a.b.top+a.b.height, c.b.top+c.b.height) - Math.max(a.b.top, c.b.top);
        if (ox <= 0 || oy <= 0) continue;
        const area = ox*oy;
        const small = Math.min(a.b.width*a.b.height, c.b.width*c.b.height);
        const frac = area/small;
        if (frac > 0.22) hits.push({ a:a.name, b:c.name, aRole:a.role, bRole:c.role, frac:+frac.toFixed(2) });
      }
    }
    sc.dispose();
    if (clips.length || hits.length) out.push({ id:t.id, style:t.style, clips, hits });
  });
  return out;
});
await browser.close();

const clipped = rows.filter(r => r.clips.length);
const collided = rows.filter(r => r.hits.length);
const phoneClipped = rows.filter(r => r.clips.some(c => c.role === 'phone'));

console.log('templates with CLIPPED text:   ', clipped.length);
console.log('   of which the PHONE is clipped:', phoneClipped.length);
console.log('templates with TEXT COLLISIONS:', collided.length);

if (phoneClipped.length){
  console.log('\n--- PHONE NUMBER CLIPPED (worst class: looks fine small, unusable large) ---');
  phoneClipped.forEach(r => r.clips.filter(c=>c.role==='phone').forEach(c =>
    console.log(`  ${r.id}  ${c.over}  box=${JSON.stringify(c.box)}`)));
}
if (clipped.length){
  console.log('\n--- ALL CLIPPED TEXT (first 30) ---');
  clipped.slice(0,30).forEach(r => r.clips.forEach(c =>
    console.log(`  ${r.id.padEnd(34)} ${String(c.over).padEnd(3)} "${c.text}" ${JSON.stringify(c.box)}`)));
}
if (collided.length){
  console.log('\n--- TEXT COLLISIONS (first 25) ---');
  collided.slice(0,25).forEach(r => r.hits.forEach(h =>
    console.log(`  ${r.id.padEnd(34)} ${h.frac}  "${h.a}" x "${h.b}"`)));
}
if (perr.length){ console.log('\n--- PAGE ERRORS ---'); perr.slice(0,5).forEach(e=>console.log('  '+e)); }

writeFileSync(OUT+'layout-audit.json', JSON.stringify(rows, null, 2));
console.log('\nwrote ' + OUT + 'layout-audit.json');
process.exit(phoneClipped.length ? 1 : 0);
