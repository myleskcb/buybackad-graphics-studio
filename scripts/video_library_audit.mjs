#!/usr/bin/env node
/* Every template, as a video. Answers "does the video engine hold for the
   whole library?" by measuring it, template by template:

     V1     frame 0 and the last frame equal the still export (10 s cut)
     audit  Renderer.selfAudit() at export resolution, for 6, 10 and 15 s —
            number on screen, reading time, layout inside the safe box, no
            overlaps, measured contrast, minimum size. The same gate the
            Download button runs.
     flash  the whole 15 s clip through FlashCheck. Rendered at 270 px wide to
            keep 486 clips tractable; the Download button re-checks every
            real export at full resolution.

   usage:  npx http-server -p 8899 -s .   then
           CHROME=/path/to/chrome node scripts/video_library_audit.mjs [--formats story,square] [--limit N]
   Writes .render/video/library.json. Exits non-zero if anything fails. */
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';
const OUT = new URL('../.render/video/', import.meta.url).pathname;
const argv = process.argv.slice(2), arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const FORMATS = arg('--formats', 'story,square').split(',');
const LIMIT = +arg('--limit', 0);
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--force-color-profile=srgb'] });
const errors = [];
const fab = process.env.FABRIC_JS ? readFileSync(process.env.FABRIC_JS) : null;   // sandboxes whose egress blocks the CDN
let page = null;
/* A fresh page every 25 templates, and after any crash: rendering hundreds of
   full-size clips in one page is a memory test this audit is not meant to be. */
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
  return page.evaluate(() => {
    showEditor();
    account = { email: 'audit@local', role: 'admin', plan: 'pro' };   // operators see every template
    return TEMPLATES.map(t => t.id);
  });
}
const ids = await freshPage();
const list = LIMIT ? ids.slice(0, LIMIT) : ids;
console.log('templates:', ids.length, '· auditing', list.length, 'x', FORMATS.join('+'));

const rows = [];
const t0 = Date.now();
for (const fmt of FORMATS){
  for (const [n, id] of list.entries()){
    if (n && n % 25 === 0) await freshPage();
    const run = () => page.evaluate(async (id, fmt) => {
      const tpl = TEMPLATES.find(t => t.id === id);
      setFormat(fmt, { silent: true });
      loadTemplate(id);
      // photo backdrops load async; wait for the real one (the gradient is only a fallback)
      for (let i = 0; i < 40 && tpl.bg && tpl.bg.type === 'image' && !canvas.backgroundImage; i++){ await new Promise(r => setTimeout(r, 50)); loadTemplate(id); }
      await new Promise(r => setTimeout(r, 120));
      canvas.discardActiveObject(); canvas.renderAll();
      const V = window.PGFXVideo, ad = V.readAd();
      const out = { id, fmt, cat: tpl.cat, photoBg: !!canvas.backgroundImage, phone: !!ad.phone, price: [ad.lead, ad.price, ad.qualifier].filter(Boolean).join(' '), audit: {} };
      // V1 at 540 wide
      {
        const d = exportDims(540), W = d.w - d.w % 2, H = d.h - d.h % 2;
        const rr = new V.Renderer(W, H, ad, 10, { readback: true }); await rr.ready();
        const z = await rr.frameZeroMatches();
        rr.renderAt(0); const a = rr.x.getImageData(0, 0, W, H).data.slice();
        rr.renderAt(10 - 1 / V.FPS); const b = rr.x.getImageData(0, 0, W, H).data;
        let nl = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) nl++;
        out.v1 = z.n; out.v1last = nl;
        rr.dispose();
      }
      // self-audit at export resolution, every length
      const d = exportDims(1080), W = d.w - d.w % 2, H = d.h - d.h % 2;
      for (const len of [6, 10, 15]){
        const rr = new V.Renderer(W, H, ad, len, { readback: true }); await rr.ready();
        const sa = rr.selfAudit();
        out.audit[len] = sa.problems.map(p => p.rule + ': ' + p.msg);
        if (len === 10){ out.accent = rr.accent; out.hardened = rr.groundTarget < 0.012; out.phoneShare = +rr.phoneShare().toFixed(3); }
        rr.dispose();
      }
      // whole-clip flash check, 15 s, at 270 px wide
      {
        const W = 270, H = Math.round(270 * CH / CW / 2) * 2;
        const rr = new V.Renderer(W, H, ad, 15, { readback: true }); await rr.ready();
        const fc = new V.FlashCheck(W, H, V.FPS);
        for (let i = 0; i < 15 * V.FPS; i++){ rr.renderAt(i / V.FPS); fc.add(rr.cv, rr.unchanged); }
        const f = fc.result();
        out.flash = { pass: f.pass, g: f.general.maxFlashesPerSec, ga: +f.general.worstArea.toFixed(3), r: f.red.maxFlashesPerSec, ra: +f.red.worstArea.toFixed(3) };
        rr.dispose();
      }
      return out;
    }, id, fmt);
    let r = await run().catch(e => ({ id, fmt, err: String(e && e.message || e) }));
    if (r.err){ await freshPage(); r = await run().catch(e => ({ id, fmt, err: String(e && e.message || e) })); }   // one retry on a clean page
    rows.push(r);
    const bad = r.err || r.v1 || r.v1last || !r.flash.pass || Object.values(r.audit).some(a => a.length);
    if (bad || n % 20 === 0) console.log(`[${fmt} ${n + 1}/${list.length} ${Math.round((Date.now() - t0) / 1000)}s] ${id}`
      + (r.err ? ' ERROR ' + r.err : `  V1 ${r.v1}/${r.v1last}  flash ${r.flash.pass ? 'ok' : 'FAIL'}  audit ${[6, 10, 15].map(l => r.audit[l].length).join('/')}`
      + (bad ? '\n    ' + [...new Set(Object.values(r.audit).flat())].join('\n    ') : '')));
  }
}

const sum = { templates: list.length, formats: FORMATS, clips: rows.length,
  errors: rows.filter(r => r.err).length,
  v1: rows.filter(r => !r.err && (r.v1 || r.v1last)).length,
  flash: rows.filter(r => !r.err && !r.flash.pass).length,
  audit: rows.filter(r => !r.err && Object.values(r.audit).some(a => a.length)).length,
  noPhone: rows.filter(r => !r.err && !r.phone).length,
  hardened: rows.filter(r => r.hardened).length,
  byRule: {} };
rows.forEach(r => !r.err && Object.values(r.audit).flat().forEach(p => { const k = p.split(':')[0]; sum.byRule[k] = (sum.byRule[k] || 0) + 1; }));
writeFileSync(OUT + 'library.json', JSON.stringify({ sum, rows, errors }, null, 1));
console.log('\nsummary', JSON.stringify(sum, null, 1));
await browser.close();
if (sum.errors || sum.v1 || sum.flash || sum.audit || errors.length) process.exit(1);
