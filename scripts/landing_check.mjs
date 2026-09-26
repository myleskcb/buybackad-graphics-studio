#!/usr/bin/env node
/* LANDING CHECK — load the landing page the way a visitor does, at a phone
 * width and a desktop width, and report what went over the wire.
 *
 * The site once shipped 33.6 MB to a phone by preloading art the page never
 * drew (fc7c92e); nothing measured it until somebody did it by hand. This is
 * that measurement, re-runnable: console errors, page errors, failed or 4xx
 * requests, horizontal overflow (and the elements causing it), and bytes
 * transferred — at first load, and again after scrolling the whole page so
 * every lazy thumbnail has been asked for.
 *
 *   node scripts/landing_check.mjs [base=http://localhost:8899/] [out.json]
 * exits 1 on an error, a 404 or overflow.
 */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { offline } from './_showcase_harness.mjs';
const BASE = process.argv[2] || 'http://localhost:8899/';
/* CHROME and FABRIC_JS as in _showcase_harness.mjs: off the owner's Mac, and
   with no route to the CDNs, off-origin requests are aborted by design and
   are not counted as failures; only the site's own requests are judged. */
const OFFLINE = !!process.env.FABRIC_JS;
const b = await puppeteer.launch({ executablePath:process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:'new', args:['--no-sandbox'] });
const report = {};
let bad = 0;
for (const [label, w, h, mobile] of [['phone-390', 390, 844, true], ['desktop-1440', 1440, 900, false]]){
  const p = await b.newPage();
  await offline(p);
  await p.setViewport({ width:w, height:h, isMobile:mobile, hasTouch:mobile, deviceScaleFactor:mobile ? 3 : 1 });
  const cdp = await p.createCDPSession(); await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled:true });
  const reqs = new Map(); let bytes = 0;
  cdp.on('Network.responseReceived', e => { const r = reqs.get(e.requestId) || {}; r.url = e.response.url; r.status = e.response.status; r.type = e.type; reqs.set(e.requestId, r); });
  cdp.on('Network.loadingFinished', e => { const r = reqs.get(e.requestId) || {}; r.bytes = e.encodedDataLength; bytes += e.encodedDataLength; reqs.set(e.requestId, r); });
  cdp.on('Network.loadingFailed', e => { const r = reqs.get(e.requestId) || {}; r.failed = e.errorText; r.url = r.url || urls.get(e.requestId); reqs.set(e.requestId, r); });
  const urls = new Map(); cdp.on('Network.requestWillBeSent', e => urls.set(e.requestId, e.request.url));   // names a failure that never got a response
  const cons = [], perr = [];
  p.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 200)); });
  p.on('pageerror', e => perr.push(String(e).slice(0, 200)));
  const t0 = Date.now();
  await p.goto(BASE, { waitUntil:'networkidle2', timeout:90000 });
  const loadMs = Date.now() - t0, firstBytes = bytes, firstReqs = reqs.size;
  const over = await p.evaluate(() => {
    const W = document.documentElement.clientWidth, out = [];
    document.querySelectorAll('body *').forEach(el => { const r = el.getBoundingClientRect();
      if (r.width && r.right > -5000 && (r.right > W + 1 || r.left < -1) && getComputedStyle(el).position !== 'fixed'){
        let a = el.parentElement, clipped = false;
        while (a && a !== document.body){ const o = getComputedStyle(a).overflowX; if (o === 'hidden' || o === 'auto' || o === 'scroll' || o === 'clip'){ clipped = true; break; } a = a.parentElement; }
        if (!clipped) out.push((el.id ? '#' + el.id : el.tagName.toLowerCase()) + '.' + String(el.className).split(' ')[0] + ' ' + Math.round(r.left) + '..' + Math.round(r.right)); } });
    return { scrollW:document.documentElement.scrollWidth, W, offenders:out.slice(0, 10) };
  });
  /* scroll the whole page so every lazy image is requested */
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600){ window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } });
  await new Promise(r => setTimeout(r, 2500));
  const list = [...reqs.values()];
  const own = r => !OFFLINE || String(r.url || '').startsWith(new URL(BASE).origin);
  const errs = list.filter(r => (r.failed || (r.status >= 400)) && own(r));
  const byType = {}; list.forEach(r => { byType[r.type || '?'] = (byType[r.type || '?'] || 0) + (r.bytes || 0); });
  const heavy = list.filter(r => r.bytes).sort((x, y) => y.bytes - x.bytes).slice(0, 6).map(r => (r.bytes / 1024).toFixed(0) + ' KB ' + r.url.replace(BASE, ''));
  report[label] = { loadMs, first:{ requests:firstReqs, MB:+(firstBytes / 1048576).toFixed(2) }, afterScroll:{ requests:reqs.size, MB:+(bytes / 1048576).toFixed(2) },
    byTypeKB:Object.fromEntries(Object.entries(byType).map(([k, v]) => [k, Math.round(v / 1024)])), heavy,
    errors:errs.map(r => (r.status || r.failed) + ' ' + r.url), console:cons, pageErrors:perr, overflow:over };
  console.log('\n' + label + ': ' + loadMs + 'ms · first load ' + firstReqs + ' req / ' + report[label].first.MB + ' MB · after full scroll ' + reqs.size + ' req / ' + report[label].afterScroll.MB + ' MB');
  console.log('  by type KB ' + JSON.stringify(report[label].byTypeKB));
  console.log('  heaviest: ' + heavy.join(' | '));
  console.log('  failed/4xx ' + errs.length + (errs.length ? ': ' + errs.slice(0, 5).map(r => (r.status || r.failed) + ' ' + r.url).join(', ') : ''));
  console.log('  console errors ' + cons.length + (cons.length ? ': ' + cons.slice(0, 3).join(' | ') : '') + ' · page errors ' + perr.length);
  console.log('  overflow: scrollWidth ' + over.scrollW + ' vs ' + over.W + (over.offenders.length ? ' · ' + over.offenders.join(', ') : ''));
  if (errs.length || perr.length || over.scrollW > over.W + 1) bad++;
  await p.close();
}
await b.close();
if (process.argv[3]) writeFileSync(process.argv[3], JSON.stringify(report, null, 1));
process.exit(bad ? 1 : 0);
