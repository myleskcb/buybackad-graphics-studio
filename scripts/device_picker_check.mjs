#!/usr/bin/env node
/* The Easy Mode phone picker, pressed for real under the production CSP: the
   field shows on a card whose product is a catalog phone and hides on one
   whose product is not; every recommended chip swaps the phone into the
   preview; Surprise me picks a different popular model; More models opens the
   rest of the factory catalog, grouped by series; As designed puts the card's
   own phone back; the choice survives a reload. Writes previews to
   .render/devpicker/.

   usage:  npx http-server -p 8899 -s .   then
           CHROME=/path/to/chrome node scripts/device_picker_check.mjs [cardId]
   Exits non-zero on any failure. */
import puppeteer from 'puppeteer-core';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';
const CARD = process.argv[2] || 'stepsFlow-nn05-30';
const OUT = new URL('../.render/devpicker/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const csp = (readFileSync(new URL('../_headers', import.meta.url), 'utf8').match(/Content-Security-Policy:\s*(.+)/) || [])[1];
const fab = process.env.FABRIC_JS ? readFileSync(process.env.FABRIC_JS) : null;
const DEV = JSON.parse(readFileSync(new URL('../assets/cutouts/devices.json', import.meta.url), 'utf8')).devices;
const RECOMMENDED = Object.entries(DEV).filter(([, d]) => d.recommended && d.authentic !== false && /^quote-site/.test(d.source || '')).map(([k]) => k);

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 1000 });
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
await page.evaluateOnNewDocument(() => {
  window.__csp = [];
  document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI));
});
await page.setRequestInterception(true);
page.on('request', async q => {
  const u = q.url();
  if (q.resourceType() === 'document' && u.startsWith(BASE)){
    const r = await fetch(u);
    q.respond({ status: r.status, headers: { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': csp }, body: await r.text() });
  } else if (fab && /fabric(\.min)?\.js/.test(u) && !u.startsWith(BASE)) q.respond({ status: 200, contentType: 'application/javascript', body: fab });
  else if (fab && !u.startsWith(BASE) && !u.startsWith('data:') && !u.startsWith('blob:')) q.abort();
  else q.continue();
});
const open = async (card, clear) => {
  await page.goto(BASE, { waitUntil: 'load', timeout: 120000 });
  if (clear) await page.evaluate(() => { localStorage.removeItem('pgfx_phonepick'); localStorage.removeItem('pgfx_tag'); });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 4000));
  await page.evaluate(() => { loadAccount = async () => account; });
  return page.evaluate(async card => {
    await scLoadIndex();
    account = { email: 'audit@local', role: 'admin', plan: 'pro' };
    await openShowcase(card);
    document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
    $('ez-phone').value = '(562) 999-4994';
    await loadPhoneCatalog();
    for (let i = 0; i < 60 && !document.querySelectorAll('#ez-phonepick .ez-phonepick-item').length; i++) await new Promise(r => setTimeout(r, 50));
    await new Promise(r => setTimeout(r, 1500));
    const img = $('ez-preview');
    const fld = $('ez-phonepick-field'), rr = fld.getBoundingClientRect();
    return { tpl: ez.tpl, shown: !fld.hidden && rr.width > 100 && rr.height > 60 && getComputedStyle(fld).display !== 'none', ids: document.querySelectorAll('[id="ez-phonepick-field"]').length, oldSelect: document.querySelectorAll('#ez-device option').length, chips: [...document.querySelectorAll('#ez-phonepick .ez-phonepick-item')].map(b => b.dataset.src),
      more: document.querySelectorAll('#ez-phonepick-more .ez-phonepick-item').length, groups: document.querySelectorAll('#ez-phonepick-more .ez-phonepick-grp').length,
      active: (document.querySelector('#ez-phonepick .ez-phonepick-item.active, #ez-phonepick-more .ez-phonepick-item.active') || {}).dataset?.src || null, device: ez.phonePick, src: img.src };
  }, card);
};
const act = (name, js) => page.evaluate(async (name, js) => {
  const img = $('ez-preview'), before = img.src;
  (new Function(js))();
  for (let i = 0; i < 120 && img.src === before; i++) await new Promise(r => setTimeout(r, 50));
  // the scene as the visitor downloads it: which photo is the product
  const sc = renderEzCanvas(1080, 'png', undefined, undefined, 'square', true);
  const p = sc.getObjects().find(o => o.name === 'Product');
  const src = p && p._element ? (p._element.currentSrc || p._element.src).replace(location.origin + '/', '').split('?')[0] : null;   // the photo, not its cache-buster
  sc.dispose();
  const actv = document.querySelector('#ez-phonepick-field .ez-phonepick-item.active');
  return { name, changed: img.src !== before, device: ez.phonePick, product: src, active: actv ? actv.dataset.src : null, saved: localStorage.getItem('pgfx_phonepick'),
    moreHidden: $('ez-phonepick-more').hidden, resetDisabled: $('ez-phonepick-reset').disabled, png: img.src };
}, name, js);

const opened = await open(CARD, true);
const steps = [];
for (const src of opened.chips) steps.push(['chip-' + src.replace(/^.*qs-iphone-|\.webp$/g, ''), `document.querySelector('#ez-phonepick [data-src="${src}"]').click()`]);
steps.push(['surprise', `$('ez-phonepick-surprise').click()`]);
steps.push(['more', `$('ez-phonepick-toggle').click(); document.querySelectorAll('#ez-phonepick-more .ez-phonepick-item')[3].click()`]);
steps.push(['as-designed', `$('ez-phonepick-reset').click()`]);
steps.push(['pick-18-pro-max', `document.querySelector('#ez-phonepick [data-src="assets/cutouts/qs-iphone-18-pro-max.webp"]').click()`]);
const res = [];
for (const [name, js] of steps){
  const r = await act(name, js).catch(e => ({ name, err: String(e) }));
  if (r.png){ writeFileSync(OUT + name + '.jpg', Buffer.from(r.png.split(',')[1], 'base64')); delete r.png; }
  res.push(r);
}
// the choice survives a reload
const again = await open(CARD, false);
const afterReload = await page.evaluate(() => {
  const sc = renderEzCanvas(1080, 'png', undefined, undefined, 'square', true);
  const p = sc.getObjects().find(o => o.name === 'Product'), src = p && p._element ? (p._element.currentSrc || p._element.src).replace(location.origin + '/', '').split('?')[0] : null;   // the photo, not its cache-buster
  sc.dispose(); return { device: ez.phonePick, product: src };
});
// a card whose product is not a catalog phone hides the field
const other = await page.evaluate(async () => {
  const t = TEMPLATES.find(t => !tplLocked(t) && !(t.layers || []).some(l => l.kind === 'cutout' && l.name === 'Product' && PHONE_CATALOG[devKey(l.props.src)]));
  selectEzTpl(t.id); await new Promise(r => setTimeout(r, 300));
  const f = $('ez-phonepick-field'); return { tpl: t.id, hidden: f.hidden && f.getBoundingClientRect().height === 0 };
});
const report = { opened: Object.assign({}, opened, { src: undefined }), recommended: RECOMMENDED.length, res, again: { device: again.device, shown: again.shown }, afterReload, other,
  csp: await page.evaluate(() => window.__csp), errors: errs };
writeFileSync(OUT + 'report.json', JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
await browser.close();
const chipRes = res.filter(r => r.name.startsWith('chip-'));
const own = 'assets/cutouts/' + (opened.active || '').replace(/^.*\//, '');
const fail = !opened.shown || opened.ids !== 1 || opened.chips.length !== RECOMMENDED.length || opened.more < 20 || opened.groups < 5
  || chipRes.some(r => r.err || r.product !== r.device || r.active !== r.device || r.saved !== JSON.stringify(r.device) || (!r.changed && r.device !== own))
  || res.find(r => r.name === 'surprise').err || !RECOMMENDED.includes(res.find(r => r.name === 'surprise').device) || res.find(r => r.name === 'surprise').product !== res.find(r => r.name === 'surprise').device
  || res.find(r => r.name === 'more').moreHidden || res.find(r => r.name === 'more').product !== res.find(r => r.name === 'more').device
  || res.find(r => r.name === 'as-designed').device !== null || !res.find(r => r.name === 'as-designed').resetDisabled
  || afterReload.device !== 'assets/cutouts/qs-iphone-18-pro-max.webp' || afterReload.product !== afterReload.device
  || !other.hidden || report.csp.length || errs.length;
process.exit(fail ? 1 : 0);
