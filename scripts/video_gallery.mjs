#!/usr/bin/env node
/* Render a review set of video ads: small clips plus a still poster each, and a
   manifest with the self-check numbers, for the playback gallery. Clips are
   360 px wide so a page of them stays light; the numbers come from the same
   checks the Download button runs, at the real 1080 export size.

   usage:  npx http-server -p 8899 -s .   then
           CHROME=/path/to/chrome node scripts/video_gallery.mjs [--version v1] [--label "first build"]
   Output: .render/video/gallery/<version>/{clips,posters}/ + manifest.json */
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';
const argv = process.argv.slice(2), arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const VERSION = arg('--version', 'v1'), LABEL = arg('--label', 'first build');
const OUT = new URL(`../.render/video/gallery/${VERSION}/`, import.meta.url).pathname;
mkdirSync(OUT + 'clips', { recursive: true });
mkdirSync(OUT + 'posters', { recursive: true });

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
  return page.evaluate(() => {
    showEditor();
    account = { email: 'audit@local', role: 'admin', plan: 'pro' };
    const cats = [...new Set(TEMPLATES.map(t => t.cat))];
    const has = t => (t.layers || []).some(l => l.kind === 'cutout');
    // per category: one Designer Library template and one classic, preferring ones with a product cutout
    const pick = [];
    cats.forEach(c => {
      const inCat = TEMPLATES.filter(t => t.cat === c);
      const dl = inCat.filter(t => /^dl_/.test(t.id)), cl = inCat.filter(t => !/^dl_/.test(t.id));
      const a = dl.find(has) || dl[0], b = cl.find(has) || cl[0];
      [a, b].forEach(t => t && pick.push({ id: t.id, name: t.name, cat: c }));
    });
    return pick;
  });
}
const picks = await freshPage();
const jobs = picks.map(p => ({ ...p, fmt: 'story', len: 10 }));
if (picks[0]) jobs.push({ ...picks[0], fmt: 'square', len: 10 }, { ...picks[0], fmt: 'story', len: 15 }, { ...picks[0], fmt: 'story', len: 6 });
if (picks[3]) jobs.push({ ...picks[3], fmt: 'square', len: 10 });
console.log('rendering', jobs.length, 'clips');

const clips = [];
for (const [n, j] of jobs.entries()){
  if (n && n % 8 === 0) await freshPage();
  const key = `${j.id}-${j.fmt}-${j.len}s`;
  const r = await page.evaluate(async j => {
    const tpl = TEMPLATES.find(t => t.id === j.id);
    setFormat(j.fmt, { silent: true }); loadTemplate(j.id);
    for (let i = 0; i < 40 && tpl.bg && tpl.bg.type === 'image' && !canvas.backgroundImage; i++){ await new Promise(r => setTimeout(r, 50)); loadTemplate(j.id); }
    await new Promise(r => setTimeout(r, 150));
    canvas.discardActiveObject(); canvas.renderAll();
    const V = window.PGFXVideo, ad = V.readAd();
    // the checks, at the real export size
    const d = exportDims(1080), W = d.w - d.w % 2, H = d.h - d.h % 2;
    const big = new V.Renderer(W, H, ad, j.len, { readback: true }); await big.ready();
    const audit = big.selfAudit(), z = await big.frameZeroMatches();
    const facts = { phoneShare: big.phoneShare(), accent: big.accent, product: !!big.product, groundLum: big.groundLum,
      dwell: big.dwell().map(x => ({ label: x.label, have: +x.have.toFixed(2), need: +x.need.toFixed(2) })) };
    big.dispose();
    // the small clip, same engine, same timeline
    const sw = 360, sh = Math.round(360 * H / W / 2) * 2;
    V.force = { codec: 'vp9', fmt: 'webm', audio: 'opus' };
    const plan = await V.pickPlan(sw, sh);
    V.force = null;
    const r = new V.Renderer(sw, sh, ad, j.len, { readback: true, sound: true }); await r.ready();
    const res = await V.encode(r, plan, () => {}, () => false);
    r.renderAt(0);
    const poster = r.cv.toDataURL('image/jpeg', 0.82);
    r.dispose();
    const buf = new Uint8Array(await res.blob.arrayBuffer());
    let bin = ''; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    return { W, H, sw, sh, ad: { kicker: ad.kicker, lead: ad.lead, price: ad.price, qualifier: ad.qualifier, phone: ad.phone, font: ad.font },
      audit: audit.problems.map(p => p.msg), frame0: z.ok, facts, flash: res.flash, audio: res.audio,
      poster, clip: btoa(bin) };
  }, j).catch(e => ({ err: String(e && e.message || e) }));
  if (r.err){ console.log('FAIL', key, r.err); continue; }
  writeFileSync(`${OUT}clips/${key}.webm`, Buffer.from(r.clip, 'base64'));
  writeFileSync(`${OUT}posters/${key}.jpg`, Buffer.from(r.poster.split(',')[1], 'base64'));
  const bytes = Buffer.from(r.clip, 'base64').length;
  delete r.clip; delete r.poster;
  clips.push({ key, id: j.id, name: j.name, cat: j.cat, fmt: j.fmt, len: j.len, bytes, clip: `clips/${key}.webm`, poster: `posters/${key}.jpg`, ...r });
  console.log(`${String(n + 1).padStart(2)}/${jobs.length} ${key.padEnd(48)} ${(bytes / 1024).toFixed(0).padStart(4)} KB  audit ${r.audit.length ? 'FAIL ' + r.audit.join(' | ') : 'ok'}  frame0 ${r.frame0 ? 'ok' : 'FAIL'}  flash ${r.flash.pass ? 'ok' : 'FAIL'}  phone ${(r.facts.phoneShare * 100).toFixed(0)}%`);
}
const manifest = { version: VERSION, label: LABEL, made: new Date().toISOString(), clips };
writeFileSync(OUT + 'manifest.json', JSON.stringify(manifest, null, 1));
console.log('wrote', clips.length, 'clips to', OUT);
if (errors.length) console.log('page errors:', errors.slice(0, 5));
await browser.close();
