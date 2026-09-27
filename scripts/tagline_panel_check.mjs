#!/usr/bin/env node
/* The Easy Mode tagline style panel, pressed for real under the production
   CSP: every look through the preview renderer, a preset, adding, removing
   and reversing stops, the angle, outline and effect overrides; the styled
   scene then through the video's bake and CTA shift (frame 0 must be the
   still, the CTA must pass its audit). Writes previews to .render/tagpanel/.

   usage:  npx http-server -p 8899 -s .   then
           CHROME=/path/to/chrome node scripts/tagline_panel_check.mjs [cardId]
   Exits non-zero on any failure. */
import puppeteer from 'puppeteer-core';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';
const CARD = process.argv[2] || 'stepsFlow-nn05-30';
const OUT = new URL('../.render/tagpanel/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const csp = (readFileSync(new URL('../_headers', import.meta.url), 'utf8').match(/Content-Security-Policy:\s*(.+)/) || [])[1];
const fab = process.env.FABRIC_JS ? readFileSync(process.env.FABRIC_JS) : null;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 1000 });
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
page.on('console', m => { if (m.type() === 'warning' && /tagline|numberFill/i.test(m.text())) errs.push(m.text()); });
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
await page.goto(BASE, { waitUntil: 'load', timeout: 120000 });
await page.evaluate(() => { localStorage.removeItem('pgfx_tag'); });
await page.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 5000));
await page.evaluate(() => { loadAccount = async () => account; });

const opened = await page.evaluate(async card => {
  await scLoadIndex();
  account = { email: 'audit@local', role: 'admin', plan: 'pro' };
  await openShowcase(card);
  if (ez.tpl !== 'sc-' + card) throw new Error('opened ' + ez.tpl + ', not ' + card);
  $('ez-phone').value = '(562) 999-4994';
  if (typeof TPL_BG_ELS !== 'undefined') await Promise.all(Object.values(TPL_BG_ELS).map(i => i.decode ? i.decode().catch(() => {}) : 0));
  await document.fonts.ready;
  if (fabric.util.clearFabricFontCache) fabric.util.clearFabricFontCache();
  await new Promise(r => setTimeout(r, 1500));
  return { looks: document.querySelectorAll('#ez-tag-looks button').length, presets: document.querySelectorAll('#ez-tag-presets button').length,
    outline: document.querySelectorAll('#ez-tag-outline button').length, effect: document.querySelectorAll('#ez-tag-effect button').length };
}, CARD).catch(e => ({ err: String(e) }));

// the preview, as the panel draws it: click, wait for the preview image to change
const shot = async (name, act) => page.evaluate(async (name, act) => {
  const img = $('ez-preview'), before = img.src;
  const t0 = performance.now();
  (new Function(act))();
  for (let i = 0; i < 60 && img.src === before; i++) await new Promise(r => setTimeout(r, 50));
  const ms = Math.round(performance.now() - t0);
  const note = $('ez-tag-note');
  return { name, ms, changed: img.src !== before, src: img.src, note: note.hidden ? '' : note.textContent,
    stops: document.querySelectorAll('#ez-tag-stops input').length, grad: !$('ez-tag-grad').hidden, tag: JSON.parse(JSON.stringify(ez.tag)) };
}, name, act);

const steps = [];
// Solid last: the card opens in Solid, and a click that changes nothing redraws nothing
const looks = await page.evaluate(() => EZ_TAG_LOOKS.map(l => l[0]).filter(k => k !== 'solid').concat(['solid']));
for (const k of looks) steps.push(['look-' + k, `document.querySelector('#ez-tag-looks [data-look="${k}"]').click()`]);
steps.push(['preset-neon', `document.querySelector('#ez-tag-presets [data-g="neon"]').click()`]);
steps.push(['add-stop', `[...document.querySelectorAll('#ez-tag-stops button')].find(b => b.textContent === '+').click()`]);
steps.push(['edit-stop', `const i = document.querySelectorAll('#ez-tag-stops input'); i[i.length-1].value = '#ffe14d'; i[i.length-1].dispatchEvent(new Event('input'))`]);
steps.push(['reverse', `[...document.querySelectorAll('#ez-tag-stops button')].find(b => b.title.startsWith('Reverse')).click()`]);
steps.push(['remove-stop', `[...document.querySelectorAll('#ez-tag-stops button')].find(b => b.title.startsWith('Remove')).click()`]);
steps.push(['angle-35', `const a = $('ez-tag-angle'); a.value = 35; a.dispatchEvent(new Event('input'))`]);
steps.push(['outline-white', `document.querySelector('#ez-tag-outline [data-v="white"]').click()`]);
steps.push(['effect-extrude', `document.querySelector('#ez-tag-effect [data-v="extrude"]').click()`]);
steps.push(['effect-glow', `document.querySelector('#ez-tag-effect [data-v="glow"]').click()`]);
steps.push(['multicolor-rainbow', `document.querySelector('#ez-tag-looks [data-look="multicolor"]').click(); document.querySelector('#ez-tag-presets [data-g="rainbow"]').click(); document.querySelector('#ez-tag-effect [data-v="auto"]').click(); document.querySelector('#ez-tag-outline [data-v="auto"]').click()`]);
steps.push(['auto', `document.querySelector('#ez-tag-presets [data-g="auto"]').click()`]);
steps.push(['weak-custom', `document.querySelector('#ez-tag-looks [data-look="signature"]').click(); ez.tag.gradient = ['#20242a','#2a2f36']; ezTagSync(); ezTagSave()`]);

const res = [];
for (const [name, act] of steps){
  const r = await shot(name, act).catch(e => ({ name, err: String(e) }));
  if (r.src){ writeFileSync(OUT + name + '.jpg', Buffer.from(r.src.split(',')[1], 'base64')); delete r.src; }
  res.push(r);
}
const persisted = await page.evaluate(() => localStorage.getItem('pgfx_tag'));

// the video: styled scene → bake → CTA
const video = [];
for (const look of ['street', 'extrude', 'anaglyph', 'glow', 'blocks']){
  const v = await page.evaluate(async look => {
    ez.tag = { look, gradient: null, angle: 90, outline: 'auto', effect: 'auto' };
    const sc = renderEzCanvas(1080, 'png', undefined, undefined, 'square', true);
    const docW = sc.width, docH = sc.height, W = 1080, H = 1080;
    const kin = sc.getObjects().filter(o => o.pgKin).length;
    const bake = motionBake(sc, docW, docH, W, H);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const x = cv.getContext('2d', { willReadFrequently: true });
    const z0 = motionFrameZero(sc, bake, x);
    const units = bake.rig.units, inUnits = new Set(); Object.values(units).forEach(u => u && u.members.forEach(m => inUnits.add(m.o)));
    const kinStray = sc.getObjects().filter(o => o.pgKin && inUnits.has(o.pgKin) && !inUnits.has(o)).length;
    const c = bake.cta, cta = c ? { ok: true, parts: c.parts.map(p => p.key), passed: c.passed, legib: Math.min(...c.legibility.map(l => l.q75)) } : { off: bake.ctaOff || 'none' };
    sc.dispose();
    return { look, kin, kinStray, frame0: z0, cta };
  }, look).catch(e => ({ look, err: String(e) }));
  video.push(v);
}
const csp2 = await page.evaluate(() => window.__csp);
const report = { opened, res, persisted, video, csp: csp2, errors: errs };
writeFileSync(OUT + 'report.json', JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
await browser.close();
const fail = opened.err || opened.looks !== 15 || opened.presets !== 17 || res.some(r => r.err || !r.changed) || errs.length || csp2.length
  || video.some(v => v.err || v.kinStray || !v.frame0 || !v.frame0.ok || !v.cta.ok);
process.exit(fail ? 1 : 0);
