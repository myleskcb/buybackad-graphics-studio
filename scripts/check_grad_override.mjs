#!/usr/bin/env node
/* Does the plate highlightBudget "brightened" actually PAINT bright?
   Hypothesis: the pass sets host.props.fill = '#f6f2ea' but leaves
   host.props.grad in place. If buildLayer prefers grad over fill, the plate
   keeps its original dark gradient while the pass darkens the ink on the
   strength of a brightening that never happened. */
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';

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

const rows = await page.evaluate(() => {
  const out = [];
  TEMPLATES.forEach(t => {
    const phone = (t.layers||[]).find(l => l.role === 'phone' && l.props);
    if (!phone || String(phone.props.fill).toLowerCase() !== '#141110') return;
    // find plates the pass would have treated as the host: fill is the bright value
    (t.layers||[]).forEach(l => {
      if (l.kind !== 'rect' || !l.props) return;
      if (String(l.props.fill).toLowerCase() !== '#f6f2ea') return;
      out.push({ id:t.id, plate:l.name, fill:l.props.fill,
                 hasGrad: !!l.props.grad,
                 grad: l.props.grad ? [l.props.grad.c1, l.props.grad.c2] : null,
                 opacity: l.props.opacity });
    });
  });
  return out;
});
await browser.close();

const withGrad = rows.filter(r => r.hasGrad);
console.log('plates highlightBudget set to #f6f2ea:', rows.length);
console.log('  of those STILL carrying a gradient (fill ignored):', withGrad.length);
if (withGrad.length){
  console.log('\n--- BRIGHTENING SILENTLY DISCARDED ---');
  withGrad.slice(0,25).forEach(r => console.log(`  ${r.id.padEnd(34)} "${r.plate}" grad=${JSON.stringify(r.grad)}`));
}
