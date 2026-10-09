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
   pop-up, on the line under its buttons; VideoHelp.keepPhoto); in the maker
   Save photo and Other photo in the note under the button.
   The video's photo, picked, and the other one (2026-10-04, rule 110): the
   studio's button and the maker's Other photo open them; two cards, the
   picked HD photo (the same bytes) and one other moment at least half a
   second from it, at the video's size and pixel for pixel the frame the file
   holds at its time (decoded here again: at most 1 level off).

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
  await page.evaluateOnNewDocument((maker) => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI));
    /* a download from the video maker goes through the plan (motion/app.js
       planGate) and this static server has no /api: the maker runs as a
       local copy does, ungated (account.js demo) */
    try { if (maker) localStorage.setItem('pgfx_local_demo', '1'); else localStorage.removeItem('pgfx_local_demo'); } catch (e){}
  }, path.startsWith('motion'));
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

/* The photo pop-up (VideoHelp.photos), opened by `sel` (and the text of the
   one to press): two cards, every Download saves its file, the first the HD
   photo already saved, the other a frame the file holds at its time, pixel
   for pixel, at least half a second from the picked moment. */
async function sheet(page, r, video, photo, sel, text){
  const n0 = page.downloads.length;
  const got = await page.evaluate(async (sel, text) => {
    const b = [...document.querySelectorAll(sel)].find(x => !text || x.textContent === text);
    if (!b) return { err: 'nothing to open the photos with (' + sel + ')' };
    b.click();
    for (let i = 0; i < 240 && document.querySelector('.vh-wait') && /Finding/.test(document.querySelector('.vh-wait').textContent); i++) await new Promise(res => setTimeout(res, 500));
    const w = document.querySelector('.vh-wait');
    const cards = [...document.querySelectorAll('.vh-pic')].map(c => ({ cap: c.querySelector('figcaption').textContent, name: c.querySelector('button').title }));
    for (const c of document.querySelectorAll('.vh-pic button')){ c.click(); await new Promise(res => setTimeout(res, 400)); }
    return { title: (document.querySelector('#vh-title') || {}).textContent, wait: w ? w.textContent : null, cards };
  }, sel, text);
  if (got.err){ r.bad.push(got.err); return; }
  for (let i = 0; i < 20 && page.downloads.length < n0 + got.cards.length; i++) await new Promise(res => setTimeout(res, 500));
  await new Promise(res => setTimeout(res, 800));
  const saved = page.downloads.slice(n0);
  r.sheet = { title: got.title, cards: got.cards.map(c => c.cap), wait: got.wait };
  if (!/Your video's photo$/.test(got.title || '')) r.bad.push('the photo did not open (' + got.title + ')');
  if (got.wait) r.bad.push('the other moment did not come: ' + got.wait);
  if (got.cards.length !== 2) r.bad.push(got.cards.length + ' cards, not the picked photo and one other');
  if (saved.length !== got.cards.length || got.cards.some(c => !saved.includes(c.name))) r.bad.push('the photos saved ' + JSON.stringify(saved) + ' for ' + got.cards.length + ' cards');
  if (got.cards[0] && got.cards[0].name !== photo.slice(OUT.length)) r.bad.push('the first photo is not the HD one');
  else if (saved.includes(got.cards[0] && got.cards[0].name) && !readFileSync(photo).equals(readFileSync(OUT + got.cards[0].name))) r.bad.push('the HD photo saved different bytes');
  const frames = got.cards.slice(1).map(c => c.name);
  if (!frames.length) r.bad.push('no other moment came');
  r.frames = [];
  for (const f of frames){
    const m = f.match(/-frame-([\d.]+)s-(\d+)x(\d+)\.png$/);
    if (!m){ r.bad.push('a frame named ' + f); continue; }
    const res = await page.evaluate(async ({ v64, p64, t }) => {
      const MB = await import(new URL('/vendor/mediabunny-1.60.0.min.mjs', location.origin).href);
      const input = new MB.Input({ source: new MB.BufferSource(Uint8Array.from(atob(v64), c => c.charCodeAt(0)).buffer), formats: MB.ALL_FORMATS });
      const vt = await input.getPrimaryVideoTrack(), dur = await input.computeDuration();
      const img = await createImageBitmap(new Blob([Uint8Array.from(atob(p64), c => c.charCodeAt(0))], { type: 'image/png' }), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
      const px = src => { const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(src, 0, 0); return x.getImageData(0, 0, c.width, c.height).data; };
      /* the name gives the time to a tenth of a second: the frame must be one
         of the file's frames in that tenth, pixel for pixel. Read through, not
         sought (a real-time recording has no index), a canvas to each frame
         (a pooled one can be drawn over while it is read) */
      const P = px(img);
      let best = null;
      for await (const f of new MB.CanvasSink(vt).canvases(0, dur)){
        if (f.timestamp > t + 0.1) break;
        if (f.timestamp < t - 0.1) continue;
        const V = px(f.canvas);
        if (V.length !== P.length) return { err: 'the frame is ' + img.width + 'x' + img.height + ', the video ' + vt.displayWidth + 'x' + vt.displayHeight };
        let most = 0;
        for (let i = 0; i < P.length; i += 4) for (let k = 0; k < 3; k++) most = Math.max(most, Math.abs(P[i + k] - V[i + k]));
        if (!best || most < best.most) best = { at: +f.timestamp.toFixed(3), most };
      }
      if (!best) return { err: 'no frame of the video near ' + t + ' s' };
      return Object.assign(best, { size: [img.width, img.height] });
    }, { v64: readFileSync(video).toString('base64'), p64: readFileSync(OUT + f).toString('base64'), t: +m[1] }).catch(e => ({ err: String(e) }));
    r.frames.push(Object.assign({ t: +m[1] }, res));
    if (r.t != null && Math.abs(+m[1] - r.t) < 0.45) r.bad.push('the other moment (' + m[1] + ' s) is the picked one (' + r.t + ' s)');
    if (res.err) r.bad.push('frame ' + f + ': ' + res.err);
    else if (res.most > 1) r.bad.push('frame ' + f + ' is not the video\'s frame (' + res.most + ' levels off)');
  }
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
    if (vid && png){ await page.evaluate(() => window.VideoHelp && VideoHelp.close()); await sheet(page, r, vid, png, '#export-note .mo-link', 'Other photo'); await page.evaluate(() => VideoHelp.close()); }
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
      const sel = run.editor ? '#export-overlay .modal-actions + .vh-photo' : '#ez-video + .vh-photo';
      await page.evaluate(() => VideoHelp.close());                       // a "saved, with a catch" pop-up (WebM here)
      const kept = await page.evaluate(sel => { const b = document.querySelector(sel); return { here: !!b, n: document.querySelectorAll('.vh-photo').length, label: b ? b.textContent : null }; }, sel);
      r.kept = kept.label;
      if (!kept.here) r.bad.push('no photo button after the video button');
      else if (kept.n !== 1) r.bad.push(kept.n + ' photo buttons');
      else if (vid) await sheet(page, r, vid, png, sel);
      await page.evaluate(() => VideoHelp.close());
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
