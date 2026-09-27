#!/usr/bin/env node
/* Dump the full authored layer list for one template, so the geometry can be
   read directly instead of inferred. */
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';
const id = process.argv[2];

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

const out = await page.evaluate((id) => {
  const t = TEMPLATES.find(x => x.id === id);
  if (!t) return { error: 'not found' };
  return { id: t.id, cat: t.cat, style: t.style,
    layers: t.layers.map((l, i) => ({
      i, kind:l.kind, name:l.name, role:l.role, solid:l.solid,
      text: typeof l.text === 'string' ? l.text.slice(0, 40) : undefined,
      left:l.props&&l.props.left, top:l.props&&l.props.top,
      width:l.props&&l.props.width, height:l.props&&l.props.height,
      originX:l.props&&l.props.originX,
      fontSize:l.props&&l.props.fontSize,
      fill:l.props&&l.props.fill,
      grad:l.props&&l.props.grad ? [l.props.grad.c1,l.props.grad.c2] : undefined,
    })) };
}, id);
await browser.close();
console.log(JSON.stringify(out, null, 1));
