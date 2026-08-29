#!/usr/bin/env node
/* Trace WHY a phone number is invisible: dump the final layer stack around the
   phone layer, and find which later layer overlaps its box. */
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';
const ids = (process.argv[2] || 'dl_cars_hudTech_crimson').split(',');

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args:['--no-sandbox'] });
const page = await browser.newPage();
await page.goto(BASE, { waitUntil:'networkidle2', timeout:60000 });
await page.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 5000));

const out = await page.evaluate((ids) => {
  const W = TPL_W, H = TPL_H;
  const res = [];
  for (const id of ids){
    const tpl = TEMPLATES.find(t => t.id === id);
    if (!tpl){ res.push({ id, error:'not found' }); continue; }
    const sc = new fabric.StaticCanvas(null, { width:W, height:H, renderOnAddRemove:false });
    const objs = tpl.layers.map(l => { const o = buildLayer(l, tpl.id); sc.add(o); return o; });
    alignPass(sc, W, H);
    let pi = tpl.layers.findIndex(l => l.role === 'phone');
    const pb = pi >= 0 ? objs[pi].getBoundingRect(true, true) : null;
    const hit = (a, b) => a && b && !(a.left+a.width < b.left || b.left+b.width < a.left ||
                                     a.top+a.height < b.top  || b.top+b.height < a.top);
    const stack = tpl.layers.map((l, i) => {
      const r = objs[i].getBoundingRect(true, true);
      return { i, kind:l.kind, name:l.name, role:l.role,
               fill: (l.props && (l.props.fill||l.props.grad&&'grad')) || objs[i].fill || null,
               opacity: objs[i].opacity,
               above: i > pi, overlaps: pb ? hit(r, pb) : false,
               box: { l:Math.round(r.left), t:Math.round(r.top), w:Math.round(r.width), h:Math.round(r.height) } };
    });
    sc.dispose();
    res.push({ id, phoneIndex: pi, phoneBox: pb && {l:Math.round(pb.left),t:Math.round(pb.top),w:Math.round(pb.width),h:Math.round(pb.height)},
               total: tpl.layers.length,
               culprits: stack.filter(s => s.above && s.overlaps),
               stack });
  }
  return res;
}, ids);

for (const r of out){
  console.log('\n=== ' + r.id + ' ===');
  if (r.error){ console.log(r.error); continue; }
  console.log('phone is layer ' + r.phoneIndex + ' of ' + r.total + '  box=' + JSON.stringify(r.phoneBox));
  console.log('LAYERS DRAWN AFTER THE PHONE THAT OVERLAP IT:');
  if (!r.culprits.length) console.log('  (none — the phone is on top; problem is colour, not stacking)');
  r.culprits.forEach(c => console.log(`  #${c.i} ${c.kind} "${c.name}" role=${c.role} fill=${c.fill} op=${c.opacity} box=${JSON.stringify(c.box)}`));
}
await browser.close();
