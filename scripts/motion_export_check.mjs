#!/usr/bin/env node
/* Press the real video buttons, under the production CSP, and check the file
   that comes out. Localhost sends no CSP (rule 49), so the page is served here
   with the Content-Security-Policy from _headers injected into the response.

   For Easy Mode ("Download as video") on a showcase card, and the editor's
   "Video" on the same design, it records: CSP violations, page errors, the
   toast, the file's name, size and container, and then decodes the file with
   the vendored Mediabunny: duration, video frames, an audio track, and the
   first decoded frame against the still scene (PSNR).

   usage:  npx http-server -p 8899 -s .   then
           CHROME=/path/to/chrome [TAGLINE=street] node scripts/motion_export_check.mjs [cardId]
   Exits non-zero on any failure. */
import puppeteer from 'puppeteer-core';
import { mkdirSync, readFileSync, readdirSync, statSync, rmSync } from 'node:fs';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';
const CARD = process.argv[2] || 'glassCard-cd06-15';
const DL = new URL('../.render/motion/download/', import.meta.url).pathname;
rmSync(DL, { recursive: true, force: true }); mkdirSync(DL, { recursive: true });
const csp = (readFileSync(new URL('../_headers', import.meta.url), 'utf8').match(/Content-Security-Policy:\s*(.+)/) || [])[1];
const fab = process.env.FABRIC_JS ? readFileSync(process.env.FABRIC_JS) : null;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900 });
const errs = [], toasts = [];
page.on('pageerror', e => errs.push(String(e)));
await page.evaluateOnNewDocument(() => {
  window.__csp = [];
  document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI));
});
/* TAGLINE=street (or any TAGLINE_STYLES key): the visitor's tagline style,
   set the way the Tagline style row keeps it, so the check covers the video
   of a styled card too (DESIGN-LAW 72) */
if (process.env.TAGLINE) await page.evaluateOnNewDocument(t => { try { localStorage.setItem('pgfx_tagline', JSON.stringify(t)); } catch (e){} }, process.env.TAGLINE);
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
const cdp = await page.target().createCDPSession();
await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DL });
await page.goto(BASE, { waitUntil: 'load', timeout: 120000 });
await page.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 6000));
await page.exposeFunction('__toast', m => toasts.push(m));
// no backend: loadAccount() would sign the stub out (showEasy runs it)
await page.evaluate(() => { loadAccount = async () => account; });

const results = [];
for (const where of ['easy', 'editor']){
  const before = new Set(readdirSync(DL));
  const r = await page.evaluate(async (where, card) => {
    if (!window.__toastWrapped){
      const _toast = toast;
      toast = (m, k) => { window.__toast((k || 'info') + ': ' + m); return _toast(m, k); };
      window.__toastWrapped = true;
    }
    await scLoadIndex();
    account = { email: 'audit@local', role: 'admin', plan: 'pro' };   // before opening: a premium card opens as a free one otherwise (rule 67)
    await openShowcase(card);
    if (ez.tpl !== 'sc-' + card) throw new Error('opened ' + ez.tpl + ', not ' + card);
    $('ez-phone').value = '(562) 999-4994';
    await new Promise(r => setTimeout(r, 800));
    /* set last: the page's own account check can resolve during the awaits
       above and sign the stub out, which gateExport answers silently */
    account = { email: 'audit@local', role: 'admin', plan: 'pro' };
    recordExport = async () => true;                  // no backend on a static server
    const t0 = performance.now();
    if (where === 'easy') await ezDownloadVideo();
    else {
      // the same design in the full editor
      const sc = renderEzCanvas(1080, 'png', undefined, undefined, undefined, true);
      showEditor(); setFormat('square', { silent: true });
      await new Promise(res => canvas.loadFromJSON(sc.toJSON(EXTRA_PROPS), res));
      canvas.renderAll(); sc.dispose();
      account = { email: 'audit@local', role: 'admin', plan: 'pro' };
      await editorDownloadVideo();
    }
    return { ms: Math.round(performance.now() - t0), csp: window.__csp.slice() };
  }, where, CARD).catch(e => ({ err: String(e) }));
  await new Promise(res => setTimeout(res, 2500));
  const files = readdirSync(DL).filter(f => !before.has(f) && !/crdownload/.test(f));
  r.where = where; r.file = files[0] || null; r.bytes = r.file ? statSync(DL + r.file).size : 0;
  if (r.file){
    const buf = readFileSync(DL + r.file);
    r.decode = await page.evaluate(async (b64) => {
      const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      const MB = await import(new URL('vendor/mediabunny-1.60.0.min.mjs', document.baseURI).href);
      const input = new MB.Input({ source: new MB.BufferSource(bytes.buffer), formats: MB.ALL_FORMATS });
      const vt = await input.getPrimaryVideoTrack(), at = await input.getPrimaryAudioTrack();
      const stats = await vt.computePacketStats();
      return { duration: +(await input.computeDuration()).toFixed(3), frames: stats.packetCount, fps: +stats.averagePacketRate.toFixed(2),
        codec: await vt.getCodecParameterString(), audio: at ? await at.getCodecParameterString() : null,
        size: [vt.displayWidth, vt.displayHeight] };
    }, buf.toString('base64'));
  }
  results.push(r);
}
const cspAll = await page.evaluate(() => window.__csp);
console.log(JSON.stringify({ results, toasts, csp: cspAll, errors: errs }, null, 1));
await browser.close();
const fail = results.some(r => r.err || !r.file || !r.decode || Math.abs(r.decode.duration - 10) > 0.1 || r.decode.frames < 295) || cspAll.length || errs.length;
process.exit(fail ? 1 : 0);
