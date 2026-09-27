#!/usr/bin/env node
/* Video engine audit — checks rule candidates V1–V4 and V7 from
   docs/VIDEO-AD-RESEARCH.md §9 against real renders, and writes frame strips
   a human (or a vision model) can LOOK at, because landmine 2 applies to video
   too: "it encoded" is not evidence it looks right.

     V1  frame 0 and the last frame are pixel-identical to snapshotPng()
     V2  the phone number is on screen for >= 70% of frames
     V3  every default text beat stays up long enough to read
     V4  real clips pass the flash check; a synthetic strobe FAILS it
     V7  a frame is a pure function of t (same t, same pixels, any order)

   Also encodes real files (MP4 container, and WebM), decodes them back with
   Mediabunny, and compares the decoded first frame against the still.

   usage:  npx http-server -p 8899 -s .   then
           CHROME=/path/to/chrome node scripts/video_audit.mjs [--quick]
   Exits non-zero on any failure. Output: .render/video/ */
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';
const OUT = new URL('../.render/video/', import.meta.url).pathname;
const QUICK = process.argv.includes('--quick');
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--force-color-profile=srgb'] });
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
/* FABRIC_JS=/path/to/fabric.min.js serves fabric from disk instead of cdnjs,
   for sandboxes whose egress blocks the CDN. Other CDN requests are aborted
   there so the page does not wait on them. */
if (process.env.FABRIC_JS){
  const body = readFileSync(process.env.FABRIC_JS);
  await page.setRequestInterception(true);
  page.on('request', q => {
    const u = q.url();
    if (/fabric(\.min)?\.js/.test(u) && !u.startsWith(BASE)) q.respond({ status: 200, contentType: 'application/javascript', body });
    else if (!u.startsWith(BASE) && !u.startsWith('data:') && !u.startsWith('blob:')) q.abort();
    else q.continue();
  });
}
await page.goto(BASE, { waitUntil: 'load', timeout: 120000 });
await page.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 6000));

const setup = await page.evaluate(() => {
  if (!window.PGFXVideo) return { err: 'video.js did not load (window.PGFXVideo missing)' };
  showEditor();
  const free = TEMPLATES.filter(t => !tplLocked(t));
  const withCut = free.filter(t => (t.layers || []).some(l => l.kind === 'cutout'));
  const noCut = free.filter(t => !(t.layers || []).some(l => l.kind === 'cutout'));
  const cats = [...new Set(free.map(t => t.cat))];
  // a spread: cutout and no cutout, several categories, deterministic choice
  const pick = [];
  cats.forEach(c => { const a = withCut.find(t => t.cat === c); if (a) pick.push(a.id); });
  cats.forEach(c => { const b = noCut.find(t => t.cat === c); if (b) pick.push(b.id); });
  return { free: free.length, pick: [...new Set(pick)] };
});
if (setup.err){ console.log('FAIL', setup.err); await browser.close(); process.exit(1); }
const ids = QUICK ? setup.pick.slice(0, 3) : setup.pick.slice(0, 10);
console.log('free templates:', setup.free, '· auditing', ids.length, ':', ids.join(', '));

const fails = [];
const results = [];
const formats = QUICK ? ['story'] : ['square', 'story'];

for (const fmt of formats){
  for (const id of ids){
    const r = await page.evaluate(async (id, fmt) => {
      setFormat(fmt, { silent: true });
      loadTemplate(id);
      await new Promise(res => setTimeout(res, 400));
      canvas.discardActiveObject(); canvas.renderAll();
      const V = window.PGFXVideo, ad = V.readAd();
      const d = exportDims(1080), W = d.w - d.w % 2, H = d.h - d.h % 2;
      const read = cv => cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
      const diff = (a, b) => { let n = 0, mx = 0; for (let i = 0; i < a.length; i++){ const v = Math.abs(a[i] - b[i]); if (v){ n++; if (v > mx) mx = v; } } return { n, mx }; };
      const still = await new Promise(res => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').drawImage(im, 0, 0, W, H); res(c); }; im.src = snapshotPng(W, 'png'); });
      const out = { id, fmt, W, H, ad: { kicker: ad.kicker, lead: ad.lead, price: ad.price, qualifier: ad.qualifier, phone: ad.phone, accent: ad.accent, font: ad.font } };
      for (const len of [6, 10, 15]){
        const rr = new V.Renderer(W, H, ad, len, { readback: true });
        await rr.ready();
        const sa = rr.selfAudit();
        const n = Math.round(rr.tl.dur * V.FPS);
        rr.renderAt(0); const f0 = read(rr.cv).slice();
        rr.renderAt((n - 1) / V.FPS); const fl = read(rr.cv).slice();
        const v1 = diff(f0, read(still)), v1last = diff(fl, f0);
        // V7: same t, different history
        rr.renderAt(4.2 % rr.tl.dur); const a = read(rr.cv).slice();
        rr.renderAt(1.1); rr.renderAt(0.2); rr.renderAt(4.2 % rr.tl.dur); const b = read(rr.cv);
        const v7 = diff(a, b);
        const dw = rr.dwell();
        out['L' + len] = { v1: v1.n, v1max: v1.mx, v1last: v1last.n, v7: v7.n, phoneShare: +rr.phoneShare().toFixed(3),
          dwellBad: dw.filter(x => !x.ok).map(x => x.label + ' ' + x.have.toFixed(2) + '<' + x.need.toFixed(2)),
          groundLum: +rr.groundLum.toFixed(4), accent: rr.accent, hasProduct: !!rr.product, hasPhoneObj: !!rr.phoneObj,
          audit: sa.problems.map(p => p.msg) };
        if (len === 10){
          // a strip of frames to look at
          const times = [0, 0.3, 0.75, 1.25, 1.9, 2.8, 3.8, 4.5, 5.4, 6.95, 7.2, 7.75, 9.9];
          const tw = fmt === 'story' ? 180 : 240, th = Math.round(tw * H / W), pad = 6;
          const sheet = document.createElement('canvas');
          sheet.width = times.length * (tw + pad) + pad; sheet.height = th + pad * 2 + 18;
          const sx = sheet.getContext('2d');
          sx.fillStyle = '#15151a'; sx.fillRect(0, 0, sheet.width, sheet.height);
          times.forEach((t, i) => { rr.renderAt(t); sx.drawImage(rr.cv, pad + i * (tw + pad), pad, tw, th);
            sx.fillStyle = '#9a9aa5'; sx.font = '12px sans-serif'; sx.fillText(t.toFixed(2) + 's', pad + i * (tw + pad), th + pad + 14); });
          out.sheet = sheet.toDataURL('image/png');
          rr.renderAt(1.9); out.hero = rr.cv.toDataURL('image/jpeg', 0.9);
        }
      }
      return out;
    }, id, fmt);
    if (r.sheet){ writeFileSync(`${OUT}strip-${fmt}-${id}.png`, Buffer.from(r.sheet.split(',')[1], 'base64')); delete r.sheet; }
    if (r.hero){ writeFileSync(`${OUT}price-${fmt}-${id}.jpg`, Buffer.from(r.hero.split(',')[1], 'base64')); delete r.hero; }
    results.push(r);
    for (const len of [6, 10, 15]){
      const L = r['L' + len], tag = `${fmt}/${id}/${len}s`;
      if (L.v1) fails.push(`V1 ${tag}: frame 0 differs from the still in ${L.v1} channel values (max ${L.v1max})`);
      if (L.v1last) fails.push(`V1 ${tag}: last frame differs from frame 0 in ${L.v1last} values`);
      if (L.v7) fails.push(`V7 ${tag}: same t rendered twice differs in ${L.v7} values`);
      if (r.ad.phone && L.phoneShare < 0.7) fails.push(`V2 ${tag}: phone on screen ${(L.phoneShare * 100).toFixed(1)}% < 70%`);
      if (L.dwellBad.length) fails.push(`V3 ${tag}: ${L.dwellBad.join('; ')}`);
      if (L.audit.length) fails.push(`self-audit ${tag}: ${L.audit.join(' | ')}`);
    }
    const L = r.L10;
    console.log(`${fmt.padEnd(6)} ${id.padEnd(34)} V1 ${[6, 10, 15].map(n => r['L' + n].v1).join('/')}  last ${[6, 10, 15].map(n => r['L' + n].v1last).join('/')}  V7 ${L.v7}  phone ${(L.phoneShare * 100).toFixed(0)}%  prod ${L.hasProduct ? 'y' : 'n'}  accent ${L.accent}  price "${r.ad.lead} ${r.ad.price} ${r.ad.qualifier}"`);
  }
}

// ── V4: the flash check itself, on synthetic clips with known answers ──
const synthetic = await page.evaluate(async () => {
  const V = window.PGFXVideo, W = 540, H = 960;
  const run = (secs, draw) => { const fc = new V.FlashCheck(W, H, V.FPS), c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    for (let i = 0; i < secs * V.FPS; i++){ draw(x, i); fc.add(c); } return fc.result(); };
  return {
    strobe: run(2, (x, i) => { x.fillStyle = (Math.floor(i / 2) % 2) ? '#ffffff' : '#000000'; x.fillRect(0, 0, W, H); }),
    redStrobe: run(2, (x, i) => { x.fillStyle = (Math.floor(i / 3) % 2) ? '#ff0000' : '#200000'; x.fillRect(0, 0, W, H); }),
    smallStrobe: run(2, (x, i) => { x.fillStyle = '#000'; x.fillRect(0, 0, W, H); x.fillStyle = (Math.floor(i / 2) % 2) ? '#fff' : '#000'; x.fillRect(20, 20, 40, 40); }),
    slowFade: run(3, (x, i) => { const v = Math.round(255 * i / 90); x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(0, 0, W, H); }),
    // the design that was NOT built: a big price counting up at 30 fps
    counter: run(2, (x, i) => { x.fillStyle = '#101014'; x.fillRect(0, 0, W, H);
      const q = Math.min(1, i / 33), v = Math.round(1100 * (1 - Math.pow(1 - q, 4)));
      x.fillStyle = '#f5b700'; x.font = '700 170px "Clash Display"'; x.textAlign = 'center'; x.fillText('$' + v.toLocaleString('en-US'), W / 2, H / 2); }),
  };
});
console.log('\nflash check, synthetic:');
Object.entries(synthetic).forEach(([k, v]) => console.log(`  ${k.padEnd(12)} ${v.pass ? 'pass' : 'FAIL'}  general ${v.general.maxFlashesPerSec}/s over ${(v.general.worstArea * 100).toFixed(0)}%  red ${v.red.maxFlashesPerSec}/s over ${(v.red.worstArea * 100).toFixed(0)}%`));
if (synthetic.strobe.pass) fails.push('V4: a full-frame 7.5 Hz black/white strobe PASSED the flash check');
if (synthetic.redStrobe.pass) fails.push('V4: a full-frame 5 Hz red strobe PASSED the flash check');
if (!synthetic.smallStrobe.pass) fails.push('V4: a 40 px strobe (under 25% of any region) FAILED — the area rule is not applied');
if (!synthetic.slowFade.pass) fails.push('V4: a slow fade FAILED the flash check');

// ── encode real files, decode them back ──
const encodes = [];
const encIds = QUICK ? ids.slice(0, 1) : ids.slice(0, 2);
for (const fmt of formats){
  for (const id of encIds){
    for (const force of [{ codec: 'vp9', fmt: 'mp4', audio: 'opus' }, null]){
      const e = await page.evaluate(async (id, fmt, force) => {
        setFormat(fmt, { silent: true }); loadTemplate(id);
        await new Promise(res => setTimeout(res, 400));
        const V = window.PGFXVideo; V.force = force;
        const d = exportDims(1080), W = d.w - d.w % 2, H = d.h - d.h % 2;
        const plan = await V.pickPlan(W, H);
        if (!plan) return { id, fmt, err: 'no encoder' };
        const r = new V.Renderer(W, H, V.readAd(), 10, { sound: true });
        await r.ready();
        const t0 = performance.now();
        const res = await V.encode(r, plan, () => {}, () => false);
        const ms = performance.now() - t0;
        V.force = null;
        // decode the file we just made
        const MB = await import(new URL('vendor/mediabunny-1.60.0.min.mjs', location.href).href);
        const input = new MB.Input({ source: new MB.BlobSource(res.blob), formats: MB.ALL_FORMATS });
        const dur = await input.computeDuration();
        const vt = await input.getPrimaryVideoTrack(), at = await input.getPrimaryAudioTrack();
        const stats = await vt.computePacketStats();
        const sink = new MB.CanvasSink(vt, { poolSize: 1 });
        const wc = await sink.getCanvas(0);
        const dc = wc.canvas.getContext ? wc.canvas : null;
        r.renderAt(0);
        const a = r.cv.getContext('2d').getImageData(0, 0, W, H).data;
        const b = dc.getContext('2d').getImageData(0, 0, W, H).data;
        let se = 0; for (let i = 0; i < a.length; i += 4) for (let k = 0; k < 3; k++){ const q = a[i + k] - b[i + k]; se += q * q; }
        const mse = se / (W * H * 3), psnr = mse ? 10 * Math.log10(255 * 255 / mse) : 99;
        const head = new Uint8Array(await res.blob.slice(0, 12).arrayBuffer());
        const box = String.fromCharCode(...head.slice(4, 8));
        return { id, fmt, W, H, container: res.fmt, codec: res.codec, audio: res.audio, box, bytes: res.blob.size, ms: Math.round(ms),
          duration: +dur.toFixed(3), packets: stats.packetCount, audioTrack: !!at, flash: res.flash, psnr0: +psnr.toFixed(1) };
      }, id, fmt, force);
      encodes.push(e);
      if (e.err){ fails.push(`encode ${fmt}/${id}: ${e.err}`); console.log('encode', fmt, id, e.err); continue; }
      console.log(`encode ${fmt.padEnd(6)} ${e.container}/${e.codec}${e.audio ? '+audio' : ''}  ${e.W}x${e.H}  ${(e.bytes / 1024).toFixed(0)} KB  ${e.ms} ms  dur ${e.duration}s  frames ${e.packets}  box '${e.box}'  frame0 PSNR ${e.psnr0} dB  flash ${e.flash.pass ? 'pass' : 'FAIL'} (${e.flash.general.maxFlashesPerSec}/s, ${(e.flash.general.worstArea * 100).toFixed(0)}%)`);
      if (!e.flash.pass) fails.push(`V4 ${fmt}/${id}: a real clip FAILED the flash check`);
      if (e.packets !== 300) fails.push(`encode ${fmt}/${id}: ${e.packets} frames, expected 300`);
      if (Math.abs(e.duration - 10) > 0.05) fails.push(`encode ${fmt}/${id}: duration ${e.duration}s, expected 10`);
      if (e.psnr0 < 35) fails.push(`encode ${fmt}/${id}: decoded frame 0 PSNR ${e.psnr0} dB vs the still (< 35)`);
      if (e.container === 'mp4' && e.box !== 'ftyp') fails.push(`encode ${fmt}/${id}: MP4 does not start with ftyp`);
    }
  }
}

// ── the real flow, under the production CSP (rule 49: localhost sends none) ──
const csp = (readFileSync(new URL('../_headers', import.meta.url), 'utf8').match(/Content-Security-Policy:\s*(.+)/) || [])[1];
const ui = {};
{
  const p2 = await browser.newPage();
  await p2.setViewport({ width: 1400, height: 900, deviceScaleFactor: 1 });
  const uiErr = [];
  p2.on('pageerror', e => uiErr.push(String(e)));
  await p2.evaluateOnNewDocument(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI));
  });
  const fab = process.env.FABRIC_JS ? readFileSync(process.env.FABRIC_JS) : null;
  await p2.setRequestInterception(true);
  p2.on('request', async q => {
    const u = q.url();
    if (q.resourceType() === 'document' && u.startsWith(BASE)){
      const r = await fetch(u);
      q.respond({ status: r.status, headers: { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': csp }, body: await r.text() });
    } else if (fab && /fabric(\.min)?\.js/.test(u) && !u.startsWith(BASE)) q.respond({ status: 200, contentType: 'application/javascript', body: fab });
    else if (fab && !u.startsWith(BASE) && !u.startsWith('data:') && !u.startsWith('blob:')) q.abort();
    else q.continue();
  });
  const dl = OUT + 'download/';
  mkdirSync(dl, { recursive: true });
  const cdp = await p2.target().createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: dl });
  await p2.goto(BASE, { waitUntil: 'load', timeout: 120000 });
  await p2.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 6000));
  const id = ids[0];
  Object.assign(ui, await p2.evaluate(async id => {
    showEditor(); setFormat('story', { silent: true }); loadTemplate(id);
    await new Promise(r => setTimeout(r, 600));
    // an operator account skips plan caps; the export counter has no backend here
    account = { email: 'audit@local', role: 'admin', plan: 'pro' };
    recordExport = async () => true;
    openExport();
    document.getElementById('ex-video').click();
    await new Promise(r => setTimeout(r, 2500));
    const pv = document.getElementById('vid-preview'), d = pv.getContext('2d').getImageData(0, 0, pv.width, pv.height).data;
    let lo = 255, hi = 0; for (let i = 0; i < d.length; i += 4 * 97){ lo = Math.min(lo, d[i]); hi = Math.max(hi, d[i]); }
    const out = { open: document.getElementById('video-overlay').classList.contains('show'),
      previewRange: hi - lo, warn: document.getElementById('vid-warn').textContent,
      kicker: document.getElementById('vid-kicker').value, price: document.getElementById('vid-price').value };
    document.querySelector('#vid-len-seg [data-len="15"]').click();
    await new Promise(r => setTimeout(r, 800));
    out.proofShown = !document.getElementById('vid-proof-sec').hidden;
    document.querySelector('#vid-len-seg [data-len="6"]').click();
    await new Promise(r => setTimeout(r, 800));
    document.getElementById('vid-export').click();
    const t0 = performance.now();
    while (performance.now() - t0 < 240000){
      const k = document.getElementById('vid-status').dataset.kind;
      if (k === 'ok' || k === 'error') break;
      await new Promise(r => setTimeout(r, 250));
    }
    out.status = document.getElementById('vid-status-txt').textContent;
    out.kind = document.getElementById('vid-status').dataset.kind;
    out.cover = !document.getElementById('vid-cover').hidden;
    out.csp = window.__csp;
    return out;
  }, id));
  await new Promise(r => setTimeout(r, 1500));
  const { readdirSync, statSync } = await import('node:fs');
  ui.files = readdirSync(dl).map(f => f + ' ' + statSync(dl + f).size);
  ui.errors = uiErr;
  await p2.close();
}
console.log('\nUI under production CSP:', JSON.stringify(ui, null, 1));
if (!ui.open) fails.push('UI: the video panel did not open');
if (!(ui.previewRange > 20)) fails.push('UI: the preview canvas is blank');
if (!ui.proofShown) fails.push('UI: 15 s did not show the proof fields');
if (results[0] && /\bUP TO\b/.test(results[0].ad.lead + ' ' + results[0].ad.price) && !/Up to/.test(ui.warn || ''))
  fails.push('UI: the copy says "up to" and the panel did not warn');
if (ui.kind !== 'ok') fails.push('UI: export did not finish: ' + ui.status);
if (!ui.files || !ui.files.some(f => /\.(mp4|webm) \d+$/.test(f))) fails.push('UI: no video file was downloaded');
if (ui.csp && ui.csp.length) fails.push('CSP: ' + ui.csp.join(' | '));
if (ui.errors && ui.errors.length) fails.push('UI page errors: ' + ui.errors.join(' | '));

writeFileSync(OUT + 'audit.json', JSON.stringify({ results, synthetic, encodes, ui, fails, errors }, null, 1));
if (errors.length){ console.log('\n--- PAGE ERRORS ---'); errors.slice(0, 10).forEach(e => console.log(e)); }
console.log(fails.length ? '\nFAILURES:\n  ' + fails.join('\n  ') : '\nall checks passed');
console.log('strips and audit.json in', OUT);
await browser.close();
if (fails.length || errors.some(e => !/404|Failed to load resource/i.test(e))) process.exit(1);
