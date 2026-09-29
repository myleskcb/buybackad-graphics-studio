#!/usr/bin/env node
/* The Easy Mode tagline style panel, pressed for real under the production
   CSP: every look through the preview renderer, a preset, adding, removing
   and reversing stops, the angle, outline and effect overrides; every one of
   the 36 patterns, its size and slide sliders, and a real pointer drag on the
   preview (the drag's last frame must match the full render it settles to);
   the styled scene then through the video's bake and CTA shift (frame 0 must
   be the still, the CTA must pass its audit). Writes previews to
   .render/tagpanel/.

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
    patterns: document.querySelectorAll('#ez-tag-pats button').length, wantLooks: EZ_TAG_LOOKS.length, wantPresets: Object.keys(TAGLINE_GRADIENTS).length + 1,
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
// the patterns: every chip, then size, slide and reset
const pats = await page.evaluate(() => Object.keys(TAGLINE_PATTERNS));
steps.push(['look-pattern-money', `document.querySelector('#ez-tag-looks [data-look="pattern"]').click(); document.querySelector('#ez-tag-pats [data-p="money"]').click()`]);
for (const p of pats.filter(p => p !== 'money')) steps.push(['pat-' + p, `document.querySelector('#ez-tag-pats [data-p="${p}"]').click()`]);
steps.push(['pat-money-again', `document.querySelector('#ez-tag-pats [data-p="money"]').click()`]);
steps.push(['pat-size-200', `const s = $('ez-tag-pscale'); s.value = 200; s.dispatchEvent(new Event('input'))`]);
steps.push(['pat-size-50', `const s = $('ez-tag-pscale'); s.value = 50; s.dispatchEvent(new Event('input'))`]);
steps.push(['pat-slide-x', `const s = $('ez-tag-px'); s.value = 50; s.dispatchEvent(new Event('input'))`]);
steps.push(['pat-slide-y', `const s = $('ez-tag-py'); s.value = 25; s.dispatchEvent(new Event('input'))`]);
steps.push(['pat-reset', `$('ez-tag-patreset').click()`]);
steps.push(['weak-custom', `document.querySelector('#ez-tag-looks [data-look="signature"]').click(); ez.tag.gradient = ['#20242a','#2a2f36']; ezTagSync(); ezTagSave()`]);

const res = [];
for (const [name, act] of steps){
  const r = await shot(name, act).catch(e => ({ name, err: String(e) }));
  if (r.src){ writeFileSync(OUT + name + '.jpg', Buffer.from(r.src.split(',')[1], 'base64')); delete r.src; }
  res.push(r);
}
const persisted = await page.evaluate(() => localStorage.getItem('pgfx_tag'));
const chips = await page.evaluate(() => [...document.querySelectorAll('#ez-tag-pats canvas')].map(c => {
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let lo = 765, hi = 0;
  for (let i = 0; i < d.length; i += 16){ const v = d[i] + d[i + 1] + d[i + 2]; lo = Math.min(lo, v); hi = Math.max(hi, v); }
  return { w: c.width, spread: hi - lo };
}));

// a real drag on the preview: the pattern follows the pointer, and the drag's
// last frame is the render the drop settles to
const drag = await (async () => {
  await page.evaluate(async () => {
    document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));   // a first visit asks for the service area: dismissed, as a visitor would
    document.querySelector('#ez-tag-looks [data-look="pattern"]').click();
    document.querySelector('#ez-tag-pats [data-p="money"]').click();
    $('ez-preview').scrollIntoView({ block: 'center' });
    const img = $('ez-preview'), before = img.src;
    for (let i = 0; i < 80 && img.src === before; i++) await new Promise(r => setTimeout(r, 50));
  });
  const box = await page.evaluate(() => { const r = $('ez-preview').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  const x0 = box.x + box.w * 0.3, y0 = box.y + box.h * 0.12;
  const start = await page.evaluate((x, y) => ({ x: ez.tag.patX, y: ez.tag.patY, tile: ez._patTile, cls: $('ez-preview').className, hit: (document.elementFromPoint(x, y) || {}).id }), x0, y0);
  if (start.hit !== 'ez-preview') throw new Error('the pointer lands on #' + start.hit + ', not the preview');
  await page.mouse.move(x0, y0); await page.mouse.down();
  const frames = [];
  for (let i = 1; i <= 8; i++){
    const t0 = Date.now();
    await page.mouse.move(x0 + i * 5, y0 + i * 3);
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    frames.push(Date.now() - t0);
  }
  const mid = await page.evaluate(() => ({ x: ez.tag.patX, y: ez.tag.patY, src: $('ez-preview').src, dragging: ez._patDrag }));
  await page.mouse.up();
  const after = await page.evaluate(async before => {
    const img = $('ez-preview');
    for (let i = 0; i < 80 && img.src === before; i++) await new Promise(r => setTimeout(r, 50));
    return { x: ez.tag.patX, y: ez.tag.patY, src: img.src, saved: JSON.parse(localStorage.getItem('pgfx_tag') || '{}'), dragging: ez._patDrag };
  }, mid.src);
  // the drag frame against the settled render, at quarter scale (the film grain is random)
  const diff = await page.evaluate(async (a, b) => {
    const load = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = s; });
    const [A, B] = await Promise.all([load(a), load(b)]), w = 140, h = Math.round(140 * A.height / A.width);
    const px = im => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(im, 0, 0, w, h); return x.getImageData(0, 0, w, h).data; };
    const p = px(A), q = px(B); let s = 0; for (let i = 0; i < p.length; i += 4) s += Math.abs(p[i] - q[i]) + Math.abs(p[i + 1] - q[i + 1]) + Math.abs(p[i + 2] - q[i + 2]);
    return +(s / (w * h * 3)).toFixed(2);
  }, mid.src, after.src);
  writeFileSync(OUT + 'drag-frame.jpg', Buffer.from(mid.src.split(',')[1], 'base64'));
  writeFileSync(OUT + 'drag-settled.jpg', Buffer.from(after.src.split(',')[1], 'base64'));
  const want = { x: +(((start.x + 40 * (box.w ? 1080 / box.w : 1) / start.tile.w) % 1 + 1) % 1).toFixed(3), y: +(((start.y + 24 * (box.h ? 1080 / box.h : 1) / start.tile.h) % 1 + 1) % 1).toFixed(3) };
  return { start: { x: start.x, y: start.y, tile: start.tile, grab: /ez-pat-drag/.test(start.cls) }, want, mid: { x: mid.x, y: mid.y, dragging: mid.dragging },
    after: { x: after.x, y: after.y, saved: [after.saved.patX, after.saved.patY], dragging: after.dragging }, frames, diff };
})().catch(e => ({ err: String(e) }));

// the video: styled scene → bake → CTA
const video = [];
for (const look of ['street', 'extrude', 'anaglyph', 'glow', 'blocks', 'pattern']){
  const v = await page.evaluate(async look => {
    ez.tag = { look, gradient: null, angle: 90, outline: 'auto', effect: 'auto', texture: 'leopard', patScale: 1.5, patX: 0.3, patY: 0.6 };
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
const report = { opened, res, persisted, chips, drag, video, csp: csp2, errors: errs };
writeFileSync(OUT + 'report.json', JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
await browser.close();
const near = (a, b) => Math.abs(a - b) < 0.004 || Math.abs(Math.abs(a - b) - 1) < 0.004;
const fail = opened.err || opened.looks !== opened.wantLooks || opened.presets !== opened.wantPresets || opened.patterns !== 36
  || res.some(r => r.err || !r.changed) || errs.length || csp2.length
  || chips.length !== 36 || chips.some(c => !c.w || c.spread < 30)
  || drag.err || !drag.start.grab || !near(drag.mid.x, drag.want.x) || !near(drag.mid.y, drag.want.y) || !drag.mid.dragging
  || drag.after.dragging || drag.after.x !== drag.mid.x || drag.after.saved[0] !== drag.mid.x || drag.after.saved[1] !== drag.mid.y || drag.diff > 2.5
  || video.some(v => v.err || v.kinStray || !v.frame0 || !v.frame0.ok || !v.cta.ok);
process.exit(fail ? 1 : 0);
