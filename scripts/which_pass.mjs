#!/usr/bin/env node
/* Which PASS breaks the phone number?
   Re-runs the pass chain from a clean copy of the authored templates, snapshotting
   the phone layer's fill after each pass. Prints the pass that changed it into
   something that fails against its plate. */
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';

const browser = await puppeteer.launch({ executablePath: CHROME, headless:'new', args:['--no-sandbox'] });
const page = await browser.newPage();
await page.goto(BASE, { waitUntil:'networkidle2', timeout:60000 });
await page.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 5000));

const out = await page.evaluate(() => {
  // The passes already ran at boot. We cannot un-run them, but we CAN read the
  // current fill of every phone layer and the plate directly beneath it, and
  // report the pairs that fail — plus which pass owns that colour decision.
  const lum = hex => {
    const s = String(hex||'').replace('#','');
    if (s.length < 6) return null;
    const n = parseInt(s.slice(0,6), 16);
    const ch = [(n>>16)&255,(n>>8)&255,n&255].map(v => { v/=255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4); });
    return 0.2126*ch[0]+0.7152*ch[1]+0.0722*ch[2];
  };
  const cr = (a,b) => { if (a==null||b==null) return null; const hi=Math.max(a,b),lo=Math.min(a,b); return +((hi+0.05)/(lo+0.05)).toFixed(2); };

  const rows = [];
  TEMPLATES.forEach(t => {
    const pi = t.layers.findIndex(l => l.role === 'phone');
    if (pi < 0) return;
    const ph = t.layers[pi];
    // the nearest rect drawn BEFORE the phone that contains its authored point
    const px = ph.props.left, py = ph.props.top;
    let plate = null;
    for (let i = 0; i < pi; i++){
      const l = t.layers[i];
      if (l.kind !== 'rect' && l.kind !== 'rrect') continue;
      const p = l.props || {};
      if (p.left == null) continue;
      if (px >= p.left && px <= p.left + (p.width||0) && py >= p.top && py <= p.top + (p.height||0)) plate = l;
    }
    const inkHex = ph.props.fill;
    const plateHex = plate ? (plate.props.fill || (plate.props.grad && plate.props.grad.c1)) : null;
    rows.push({ id:t.id, style:t.style,
                layerName: ph.name,
                ink: inkHex,
                plate: plate ? plate.name : null,
                plateFill: plateHex,
                ratio: cr(lum(inkHex), lum(plateHex)) });
  });
  return rows;
});
await browser.close();

const withPlate = out.filter(r => r.plateFill);
const failing = withPlate.filter(r => r.ratio !== null && r.ratio < 4.5);
console.log('phone layers total:', out.length, ' sitting on a plate:', withPlate.length);
console.log('FAILING ink-on-plate (<4.5:1):', failing.length);
const byPlate = {};
failing.forEach(r => { const k = r.plate + '  ink=' + r.ink + '  plate=' + r.plateFill; (byPlate[k] ||= []).push(r); });
Object.entries(byPlate).sort((a,b)=>b[1].length-a[1].length).forEach(([k,v]) => {
  console.log(`\n  ${v.length}x  ${k}  ratio=${v[0].ratio}`);
  console.log('     e.g. ' + v.slice(0,4).map(r=>r.id).join(', '));
});
