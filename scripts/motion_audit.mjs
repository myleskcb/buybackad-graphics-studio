#!/usr/bin/env node
/* Video audit for the living-still engine and its call to action (app.js,
   MOTION parts 1 to 3). For every card it opens the card in Easy Mode, takes
   the exact scene the video export takes (renderEzCanvas keep=true), bakes
   it, and measures:

     cta     whether the call-to-action card was built, and if not, why
             (ctaBake tries leaner stacks before it gives up)
     legib   the worst line on the landed call to action (critic method,
             upper quartile of per-pixel contrast), 3:1 is the bar
     frame0  frame 0 against the scene rendered directly (motionFrameZero)
     flash   the whole clip through MotionFlashCheck, rendered at 270px wide

   usage:  npx http-server -p 8899 -s .   then
           CHROME=/path/to/chrome node scripts/motion_audit.mjs [--set showcase|classics|both] [--limit N] [--strips N]
   FABRIC_JS=/path/fabric.min.js serves fabric from disk where the CDN is
   blocked. Writes .render/motion/audit.json and strips; exits non-zero on a
   frame-0 or flash failure or a page error. */
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';
const OUT = new URL('../.render/motion/', import.meta.url).pathname;
const argv = process.argv.slice(2), arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const SET = arg('--set', 'both'), LIMIT = +arg('--limit', 0), STRIPS = +arg('--strips', 12);
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--force-color-profile=srgb'] });
const errors = [];
const fab = process.env.FABRIC_JS ? readFileSync(process.env.FABRIC_JS) : null;
let page = null;
async function freshPage(){
  if (page) await page.close().catch(() => {});
  page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 1 });
  page.on('pageerror', e => errors.push(String(e)));
  if (fab){
    await page.setRequestInterception(true);
    page.on('request', q => {
      const u = q.url();
      if (/fabric(\.min)?\.js/.test(u) && !u.startsWith(BASE)) q.respond({ status: 200, contentType: 'application/javascript', body: fab });
      else if (!u.startsWith(BASE) && !u.startsWith('data:') && !u.startsWith('blob:')) q.abort();
      else q.continue();
    });
  }
  await page.goto(BASE, { waitUntil: 'load', timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 5000));
  return page.evaluate(async () => {
    account = { email: 'audit@local', role: 'admin', plan: 'pro' };
    const cards = await scLoadIndex();
    return { showcase: cards.filter(c => !c.defect).map(c => c.id), classics: TEMPLATES.filter(t => !/^sc-/.test(t.id)).map(t => t.id) };
  });
}
const lists = await freshPage();
let jobs = [];
if (SET !== 'classics') jobs = jobs.concat(lists.showcase.map(id => ({ kind: 'showcase', id })));
if (SET !== 'showcase') jobs = jobs.concat(lists.classics.map(id => ({ kind: 'classic', id })));
if (LIMIT) jobs = jobs.slice(0, LIMIT);
console.log('showcase', lists.showcase.length, '· classics', lists.classics.length, '· auditing', jobs.length);

const rows = [];
const stripEvery = Math.max(1, Math.floor(jobs.length / Math.max(1, STRIPS)));
const t0 = Date.now();
for (const [n, j] of jobs.entries()){
  if (n && n % 30 === 0) await freshPage();
  const run = () => page.evaluate(async (j, strip) => {
    if (j.kind === 'showcase') await openShowcase(j.id);
    else { showEasy(j.id); ez.bgPicked = true; }
    $('ez-phone').value = '(562) 999-4994';
    if (typeof schedEzPreview === 'function') schedEzPreview(0);
    await new Promise(r => setTimeout(r, 500));
    const sc = renderEzCanvas(1080, 'png', undefined, undefined, undefined, true);
    const docW = sc.width, docH = sc.height, W = 1080, H = Math.round(1080 * docH / docW / 2) * 2;
    const bake = motionBake(sc, docW, docH, W, H);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const x = cv.getContext('2d', { willReadFrequently: true });
    const z0 = motionFrameZero(sc, bake, x);
    const c = bake.cta;
    const out = { id: j.id, kind: j.kind, cta: !!c, off: bake.ctaOff || null,
      parts: c ? c.parts.map(p => p.key).concat(c.prod ? ['prod'] : []) : [], shade: c ? c.shade : null,
      legib: c ? Math.min(...c.legibility.map(l => l.q75)) : null, number: c ? +(c.texts.find(t => t.role === 'number') || {}).size : null,
      frame0: { off: z0.off, most: z0.most, ok: z0.ok } };
    if (strip){
      const times = [0, 2.0, 5.0, 5.8, 6.1, 6.4, 7.0, 9.9], tw = 180, th = Math.round(tw * H / W), pad = 5;
      const sh = document.createElement('canvas'); sh.width = times.length * (tw + pad) + pad; sh.height = th + 2 * pad + 14;
      const sx = sh.getContext('2d'); sx.fillStyle = '#1b1b1f'; sx.fillRect(0, 0, sh.width, sh.height);
      times.forEach((t, i) => { motionDraw(x, bake, t); sx.drawImage(cv, pad + i * (tw + pad), pad, tw, th);
        sx.fillStyle = '#9a9aa4'; sx.font = '11px sans-serif'; sx.fillText(t.toFixed(1) + 's', pad + i * (tw + pad), th + pad + 12); });
      out.strip = sh.toDataURL('image/jpeg', 0.82);
    }
    // whole-clip flash check at 270px wide
    const w2 = 270, h2 = Math.round(270 * docH / docW / 2) * 2;
    const b2 = motionBake(sc, docW, docH, w2, h2);
    const c2 = document.createElement('canvas'); c2.width = w2; c2.height = h2;
    const x2 = c2.getContext('2d', { willReadFrequently: true });
    const fc = new MotionFlashCheck(w2, h2, MOTION.fps);
    for (let i = 0; i < Math.round(MOTION.dur * MOTION.fps); i++){ motionDraw(x2, b2, i / MOTION.fps); fc.add(x2); }
    const f = fc.result();
    out.flash = { pass: f.pass, g: f.general.perSec, ga: +f.general.area.toFixed(3), r: f.red.perSec, ra: +f.red.area.toFixed(3) };
    sc.dispose();
    return out;
  }, j, n % stripEvery === 0).catch(e => ({ id: j.id, kind: j.kind, err: String(e && e.message || e) }));
  let r = await run();
  if (r.err){ await freshPage(); r = await run(); }
  if (r.strip){ writeFileSync(`${OUT}strip-${r.kind}-${r.id}.jpg`, Buffer.from(r.strip.split(',')[1], 'base64')); delete r.strip; }
  rows.push(r);
  const bad = r.err || !r.frame0.ok || !r.flash.pass;
  if (bad || !r.cta || n % 25 === 0)
    console.log(`[${n + 1}/${jobs.length} ${Math.round((Date.now() - t0) / 1000)}s] ${r.kind} ${r.id}` + (r.err ? ' ERROR ' + r.err
      : `  cta ${r.cta ? r.parts.join('+') + (r.shade ? ' shade ' + r.shade : '') + ' legib ' + r.legib : 'OFF (' + (r.off || '').slice(0, 160) + ')'}  frame0 ${r.frame0.ok ? 'ok' : 'FAIL ' + r.frame0.off}  flash ${r.flash.pass ? 'ok' : 'FAIL'}`));
}
const ok = rows.filter(r => !r.err);
const by = k => ok.filter(r => r.kind === k);
const sum = k => ({ cards: by(k).length, cta: by(k).filter(r => r.cta).length,
  stacks: by(k).filter(r => r.cta).reduce((m, r) => (m[r.parts.join('+')] = (m[r.parts.join('+')] || 0) + 1, m), {}),
  shaded: by(k).filter(r => r.shade > 0).length,
  minLegib: Math.min(...by(k).filter(r => r.cta).map(r => r.legib)),
  frame0Fail: by(k).filter(r => !r.frame0.ok).length, flashFail: by(k).filter(r => !r.flash.pass).length,
  worstFlash: Math.max(0, ...by(k).map(r => Math.max(r.flash.ga, r.flash.ra))) });
const summary = { showcase: sum('showcase'), classics: sum('classic'), errors: rows.filter(r => r.err).length };
writeFileSync(OUT + 'audit.json', JSON.stringify({ summary, rows, pageErrors: errors }, null, 1));
console.log('\nsummary', JSON.stringify(summary, null, 1));
await browser.close();
if (summary.errors || summary.showcase.frame0Fail || summary.classics.frame0Fail || summary.showcase.flashFail || summary.classics.flashFail || errors.length) process.exit(1);
