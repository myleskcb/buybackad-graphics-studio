#!/usr/bin/env node
/* Verify the highlightBudget hypothesis:
   the host-plate search tests only VERTICAL overlap, so it can select a rect
   that does not sit behind the phone at all (a side chip, a badge, a narrow
   pill at the same y). It paints that rect bright and sets the phone ink to
   near-black regardless — leaving dark ink on whatever dark thing is actually
   behind the number.

   Reports, for every template whose phone is now #141110, whether the bright
   plate actually covers the phone's horizontal span. */
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';

const browser = await puppeteer.launch({ executablePath: CHROME, headless:'new', args:['--no-sandbox'] });
const page = await browser.newPage();
await page.goto(BASE, { waitUntil:'networkidle2', timeout:60000 });
await page.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 5000));

const rows = await page.evaluate(() => {
  const out = [];
  TEMPLATES.forEach(t => {
    const phone = (t.layers||[]).find(l => l.role === 'phone' && l.props);
    if (!phone) return;
    if (String(phone.props.fill).toLowerCase() !== '#141110') return;  // only the darkened ones
    const fs = phone.props.fontSize || 70;
    const top = (phone.props.top||0) - fs*0.30, h = fs*1.62;
    // the phone's horizontal span — MUST mirror app.js's anchor handling.
    // An earlier version of this script ignored originX:'right', so it reported
    // right-anchored numbers as spanning x 1016..1322 (off a 1080px canvas) and
    // manufactured "mismatches" that did not exist. Keep this in sync.
    const approxW = String(phone.text||'').length * fs * 0.52;
    const ox = phone.props.originX;
    const pxl = phone.props.left || 0;
    const px0 = ox === 'center' ? pxl - approxW/2 : ox === 'right' ? pxl - approxW : pxl;
    const px1 = px0 + approxW;

    // every bright/solid rect that vertically overlaps the phone band
    const plates = (t.layers||[]).filter(l => l.kind === 'rect' && l.props);
    const vHost = plates.find(r => {
      const rt = r.props.top||0, rh = r.props.height||0;
      return rt < top + h && rt + rh > top;
    });
    let covers = null;
    if (vHost){
      const L = vHost.props.left||0, W = vHost.props.width||0;
      covers = (L <= px0 + 4) && (L + W >= px1 - 4);
    }
    out.push({ id:t.id, style:t.style,
               phoneSpan:[Math.round(px0), Math.round(px1)],
               host: vHost ? vHost.name : null,
               hostSpan: vHost ? [Math.round(vHost.props.left||0), Math.round((vHost.props.left||0)+(vHost.props.width||0))] : null,
               hostFill: vHost ? vHost.props.fill : null,
               coversPhone: covers });
  });
  return out;
});
await browser.close();

const noHost   = rows.filter(r => !r.host);
const notCover = rows.filter(r => r.host && r.coversPhone === false);
const good     = rows.filter(r => r.host && r.coversPhone === true);

console.log('templates with near-black phone ink (#141110):', rows.length);
console.log('  bright plate correctly spans the number:', good.length);
console.log('  HOST PLATE DOES NOT COVER THE NUMBER:   ', notCover.length, '  <-- dark ink, no bright plate under it');
console.log('  no host rect at all:                    ', noHost.length);

if (notCover.length){
  console.log('\n--- MISMATCHED HOST (the bug) ---');
  notCover.slice(0, 30).forEach(r =>
    console.log(`  ${r.id}\n      phone x ${r.phoneSpan[0]}..${r.phoneSpan[1]}   host "${r.host}" x ${r.hostSpan[0]}..${r.hostSpan[1]}  fill=${r.hostFill}`));
}
