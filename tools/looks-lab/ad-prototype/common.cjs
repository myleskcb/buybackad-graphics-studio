const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const FAB = process.env.FABRIC_JS || '';   // a local fabric.min.js, for a machine that cannot reach the CDN
async function open(opts = {}){
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  p.on('console', m => { if (opts.log || /^\[ad\]/.test(m.text())) console.log('PAGE:', m.text().slice(0, 2000)); });
  p.on('pageerror', e => console.log('PAGEERROR:', String(e).slice(0, 500)));
  if (FAB) await p.route('**/fabric.min.js', r => r.fulfill({ path: FAB, contentType: 'application/javascript' }));
  if (opts.beforeGoto) await opts.beforeGoto(p);
  await p.goto((process.env.LAB_URL || 'http://localhost:8899/') + 'index.html?theme=light', { waitUntil: 'load' });
  await p.waitForTimeout(1500); await p.click('#lp-cta-main'); await p.waitForTimeout(2500);
  const nn = p.locator('button:has-text("Not now")').first(); if (await nn.isVisible().catch(() => false)) await nn.click();
  await p.waitForTimeout(800);
  return { b, p };
}
module.exports = { open, fs, path };
