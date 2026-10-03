#!/usr/bin/env node
/* Every video ad comes with its photo (video-still.js; OfferUp takes a video
   only with a photo beside it). This presses the real video buttons, under
   the production CSP, and checks what lands in the downloads folder:

     /motion   the video maker, once per size (1:1, 4:5, 9:16, 16:9)
     studio    Easy Mode's "Download as video" on a showcase card, square and
               story, as an operator and as a Free account, and the editor's
               "Video" on the same design

   For each press: exactly one video and one PNG; the PNG 1440 on its short
   side in the video's aspect (1080 on Free, the plan's cap, with the
   watermark the video carries); and the photo against the video's own
   decoded frames near the chosen moment (PSNR on a 360px copy), so the photo
   is a moment of that video and not some other picture. And the photo stays
   to hand after it (2026-10-03, "so I have the option"): in the studio one
   button right after the video button pressed (in the editor's export
   pop-up, on the line under its buttons; VideoHelp.keepPhoto) saves the
   same PNG again; in the maker the note under the button has Save photo.

   usage:  npx http-server -p 8899 -s .   then
           CHROME=/path/to/chrome [FABRIC_JS=/path/fabric.min.js] node scripts/video_photo_check.mjs [--only motion|studio] [cardId]
   Writes the files to .render/video-photo/; exits non-zero on any failure. */
import puppeteer from 'puppeteer-core';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';
const argv = process.argv.slice(2), ONLY = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : null;
const CARD = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--only')[0] || 'glassCard-cd06-15';
const OUT = new URL('../.render/video-photo/', import.meta.url).pathname;
rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true });
const csp = (readFileSync(new URL('../_headers', import.meta.url), 'utf8').match(/Content-Security-Policy:\s*(.+)/) || [])[1];
const fab = process.env.FABRIC_JS ? readFileSync(process.env.FABRIC_JS) : null;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--force-color-profile=srgb', '--autoplay-policy=no-user-gesture-required'] });
const results = [], errs = [];

async function openPage(path){
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  page.on('pageerror', e => errs.push(path + ': ' + String(e)));
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
  const cdp = await page.target().createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: OUT, eventsEnabled: true });
  /* every finished download by name: a second save of the same name replaces
     the file here (headless Chrome does not add " (1)"), so the folder alone
     cannot show it */
  const names = new Map(); page.downloads = [];
  cdp.on('Browser.downloadWillBegin', e => names.set(e.guid, e.suggestedFilename));
  cdp.on('Browser.downloadProgress', e => { if (e.state === 'completed') page.downloads.push(names.get(e.guid)); });
  await page.goto(BASE + path, { waitUntil: 'load', timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

const pngSize = f => { const b = readFileSync(f); return b.toString('ascii', 1, 4) === 'PNG' ? [b.readUInt32BE(16), b.readUInt32BE(20)] : null; };
const listing = () => new Set(readdirSync(OUT));
/* the files that landed since `before`, once n have (or the wait runs out) */
async function landed(before, n, ms = 20000){
  const fresh = () => readdirSync(OUT).filter(f => !before.has(f) && !/crdownload|\.json$/.test(f));
  const t0 = Date.now();
  while (fresh().length < n && Date.now() - t0 < ms) await new Promise(r => setTimeout(r, 500));
  await new Promise(r => setTimeout(r, 1500));
  return fresh().map(f => OUT + f);
}

/* the photo against the video's decoded frames within 0.25 s of the moment */
async function compare(page, video, photo, t){
  return page.evaluate(async ({ v64, p64, t }) => {
    const MB = await import(new URL('/vendor/mediabunny-1.60.0.min.mjs', location.origin).href);
    const bytes = Uint8Array.from(atob(v64), c => c.charCodeAt(0));
    const input = new MB.Input({ source: new MB.BufferSource(bytes.buffer), formats: MB.ALL_FORMATS });
    const vt = await input.getPrimaryVideoTrack(), sink = new MB.CanvasSink(vt);
    const img = await createImageBitmap(new Blob([Uint8Array.from(atob(p64), c => c.charCodeAt(0))], { type: 'image/png' }));
    const k = 360 / Math.min(img.width, img.height), w = Math.round(img.width * k), h = Math.round(img.height * k);
    const grab = src => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true }); x.imageSmoothingQuality = 'high'; x.drawImage(src, 0, 0, w, h); return x.getImageData(0, 0, w, h).data; };
    const P = grab(img);
    let best = { psnr: 0, at: null };
    for await (const f of sink.canvases(Math.max(0, t - 0.25), t + 0.25)){
      const V = grab(f.canvas); let se = 0;
      for (let i = 0; i < P.length; i += 4) for (let j = 0; j < 3; j++){ const d = P[i + j] - V[i + j]; se += d * d; }
      const psnr = 10 * Math.log10(255 * 255 / (se / (P.length / 4 * 3)));
      if (psnr > best.psnr) best = { psnr: +psnr.toFixed(2), at: +f.timestamp.toFixed(3) };
    }
    return Object.assign(best, { video: [vt.displayWidth, vt.displayHeight], duration: +(await input.computeDuration()).toFixed(2) });
  }, { v64: readFileSync(video).toString('base64'), p64: readFileSync(photo).toString('base64'), t });
}

function judge(r, wantShort){
  const vid = r.files.find(f => /\.(mp4|webm)$/.test(f)), png = r.files.filter(f => /\.png$/.test(f));
  r.video = vid ? vid.slice(OUT.length) : null; r.photo = png[0] ? png[0].slice(OUT.length) : null;
  r.photoSize = png[0] ? pngSize(png[0]) : null;
  if (!vid) r.bad.push('no video');
  if (png.length !== 1) r.bad.push(png.length + ' photos');
  if (r.photoSize && Math.min(...r.photoSize) !== wantShort) r.bad.push('photo short side ' + Math.min(...r.photoSize) + ', not ' + wantShort);
  delete r.files;
  return { vid, png: png[0] };
}

if (ONLY !== 'studio'){
  const page = await openPage('motion/index.html');
  await page.waitForFunction(() => document.getElementById('loading').hidden, { timeout: 120000 });
  for (const aspect of ['1:1', '4:5', '9:16', '16:9']){
    const before = listing();
    const r = { where: 'motion ' + aspect, bad: [] };
    await page.evaluate(() => window.VideoHelp && VideoHelp.close());   // a "saved, with a catch" pop-up would take the click
    await page.click(`#aspects [data-aspect="${aspect}"]`);
    await new Promise(res => setTimeout(res, 1500));
    if (await page.$eval(`#aspects [data-aspect="${aspect}"]`, el => el.getAttribute('aria-checked')) !== 'true') r.bad.push('the size did not change to ' + aspect);
    await page.click('#download');
    await page.waitForFunction(() => /Saved|could not|cannot/.test(document.getElementById('export-note').textContent), { timeout: 300000 }).catch(e => r.bad.push('no note: ' + e.message));
    r.files = await landed(before, 2);
    r.note = await page.$eval('#export-note', n => n.textContent);
    const { vid, png } = judge(r, 1440);
    const [W, H] = { '1:1': [1, 1], '4:5': [4, 5], '9:16': [9, 16], '16:9': [16, 9] }[aspect];
    if (r.photoSize && Math.abs(r.photoSize[0] / r.photoSize[1] - W / H) > 0.01) r.bad.push('photo aspect ' + r.photoSize.join('x'));
    const m = r.note.match(/moment at ([\d.]+) s/);
    r.t = m ? +m[1] : null;
    if (r.t == null) r.bad.push('the note names no moment');
    if (!await page.evaluate(() => [...document.querySelectorAll('#export-note .mo-link')].some(b => b.textContent === 'Save photo'))) r.bad.push('no Save photo under the button');
    if (vid && png && r.t != null){ r.match = await compare(page, vid, png, r.t).catch(e => ({ err: String(e) })); if (!(r.match.psnr >= 24)) r.bad.push('photo is not the video at its moment (' + JSON.stringify(r.match) + ')'); }
    results.push(r);
  }
  const c = await page.evaluate(() => window.__csp); if (c.length) errs.push('motion CSP: ' + c.join(', '));
  await page.close();
}

if (ONLY !== 'motion'){
  const page = await openPage('index.html');
  await new Promise(res => setTimeout(res, 6000));
  await page.evaluate(() => { loadAccount = async () => account; recordExport = async () => true; });   // no backend on a static server
  const runs = [
    { where: 'easy square operator', fmt: 'square', acct: { role: 'admin', plan: 'pro' }, short: 1440 },
    { where: 'easy story pro', fmt: 'story', acct: { plan: 'pro' }, short: 1440 },
    { where: 'easy square free', fmt: 'square', acct: { plan: 'free', exports: { count: 0 } }, short: 1080, watermark: true },
    { where: 'editor square operator', fmt: 'square', acct: { role: 'admin', plan: 'pro' }, short: 1440, editor: true },
  ];
  for (const run of runs){
    const before = listing();
    const r = { where: 'studio ' + run.where, bad: [] };
    const out = await page.evaluate(async ({ card, run }) => {
      const acct = Object.assign({ email: 'audit@local' }, run.acct);
      account = acct;
      await scLoadIndex();
      await openShowcase(card);
      // a Free account opens a premium card as the first free one (rule 67): any card will do for its size and watermark
      if (ez.tpl !== 'sc-' + card && run.acct.plan !== 'free') throw new Error('opened ' + ez.tpl + ', not ' + card);
      ez.format = run.fmt;                              // Easy Mode's size chips (buildEzSizes)
      $('ez-phone').value = '(562) 999-4994';
      await new Promise(res => setTimeout(res, 800));
      account = acct;
      const seen = [];
      const S = VideoStill.best; VideoStill.best = async o => { const p = await S(o); seen.push(p.t); return p; };
      try {
        if (!run.editor) await ezDownloadVideo();
        else {
          const sc = renderEzCanvas(1080, 'png', undefined, undefined, undefined, true);
          showEditor(); setFormat(run.fmt, { silent: true });
          await new Promise(res => canvas.loadFromJSON(sc.toJSON(EXTRA_PROPS), res));
          canvas.renderAll(); sc.dispose();
          account = acct;
          await editorDownloadVideo();
        }
      } finally { VideoStill.best = S; }
      return { t: seen[0], fmt: run.editor ? docFormat : ez.format, card: ez.tpl };
    }, { card: CARD, run }).catch(e => ({ err: String(e) }));
    if (out.err) r.bad.push(out.err);
    r.t = out.t; r.format = out.fmt; r.card = out.card;
    r.files = await landed(before, 2);
    const { vid, png } = judge(r, run.short);
    /* the photo stays a tap away right after the video button: one button, and it saves the same file again */
    if (png){
      const was = readFileSync(png), n0 = page.downloads.length, sel = run.editor ? '#export-overlay .modal-actions + .vh-photo' : '#ez-video + .vh-photo';
      const kept = await page.evaluate(sel => { const b = document.querySelector(sel); if (b) b.click(); return { here: !!b, n: document.querySelectorAll('.vh-photo').length, label: b ? b.textContent : null }; }, sel);
      r.kept = kept.label;
      if (!kept.here) r.bad.push('no photo button after the video button');
      else if (kept.n !== 1) r.bad.push(kept.n + ' photo buttons');
      else {
        for (let i = 0; i < 16 && page.downloads.length === n0; i++) await new Promise(res => setTimeout(res, 500));
        await new Promise(res => setTimeout(res, 500));
        const got = page.downloads.slice(n0);
        if (got.length !== 1 || got[0] !== r.photo || !readFileSync(png).equals(was)) r.bad.push('the photo button did not save the same photo (' + JSON.stringify(got) + ')');
      }
    }
    if (vid && png && r.t != null){
      r.match = await compare(page, vid, png, r.t).catch(e => ({ err: String(e) }));
      if (!(r.match.psnr >= 24)) r.bad.push('photo is not the video at its moment (' + JSON.stringify(r.match) + ')');
    }
    results.push(r);
    if (!run.editor) await page.evaluate(() => { try { showEasy(); } catch (e){} });
  }
  const c = await page.evaluate(() => window.__csp); if (c.length) errs.push('studio CSP: ' + c.join(', '));
  await page.close();
}

await browser.close();
writeFileSync(OUT + 'report.json', JSON.stringify({ results, errors: errs }, null, 1));
console.log(JSON.stringify({ results, errors: errs }, null, 1));
process.exit(results.some(r => r.bad.length) || errs.length ? 1 : 0);
