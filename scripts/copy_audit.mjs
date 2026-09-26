#!/usr/bin/env node
/* Count templates whose default copy carries claims the video research flags
   (docs/VIDEO-AD-RESEARCH.md): "up to" pricing, locked/blacklisted-phone copy,
   and phrasing Meta's ad standards reject when a post is boosted (personal
   health or financial status, money-flip wording). Serve the repo first:  npx http-server -p 8899 -s .
   Then:  node scripts/copy_audit.mjs  (GFX_BASE overrides the URL). */
import puppeteer from 'puppeteer-core';
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';
const b = await puppeteer.launch({ executablePath: CHROME, headless:'new', args:['--no-sandbox'] });
const p = await b.newPage();
const errs = [];
p.on('pageerror', e => errs.push(String(e)));
await p.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 });
await p.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 4000));
const r = await p.evaluate(() => {
  const T = window.TEMPLATES || (typeof TEMPLATES !== 'undefined' ? TEMPLATES : null);
  if (!T) return { error: 'no TEMPLATES' };
  const txt = t => (t.layers || []).map(l => typeof l.text === 'string' ? l.text : '').join(' | ');
  const hit = re => T.filter(t => re.test(txt(t)));
  const upto = hit(/\bup to\b/i), bl = hit(/blacklist/i), locked = hit(/icloud lock/i);
  const attr = hit(/diabetic\?|need cash|short on cash|behind on|\bbills\b|in debt|money flip|cash flip|share to win|in search of/i);
  const byCat = a => a.reduce((m, t) => (m[t.cat] = (m[t.cat] || 0) + 1, m), {});
  return { total: T.length, upto: upto.length, uptoByCat: byCat(upto),
           blacklist: bl.length, icloudLocked: locked.length, blByCat: byCat(bl),
           personalAttribute: attr.length, attrIds: attr.map(t => t.id),
           uptoSamples: [...new Set(upto.map(t => (txt(t).match(/[^|]*\bup to\b[^|]*/i) || [''])[0].trim()))].slice(0, 12) };
});
console.log(JSON.stringify(r, null, 1));
console.log('page errors:', errs.length, errs.slice(0, 3));
await b.close();
if (r.error || errs.length) process.exit(1);
