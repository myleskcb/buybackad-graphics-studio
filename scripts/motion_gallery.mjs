#!/usr/bin/env node
/* Render a round of the "Video Ad Cuts" playback gallery from the living-still
   engine (app.js MOTION, parts 1 to 3): the download's bake, frame-0 check,
   exact encode (motionPlan, Mediabunny), flash check and sound.

   Clips are previews: PREVIEW px wide (480 by default), so the gallery stays
   light to play, but every frame is the 1080 download's frame scaled down:
   the call to action is decided once, at the size the owner downloads, and
   its facts (stack, shade, legibility, number size) are that bake's. The
   frame-0 check runs at 1080, the flash check on the preview's own frames.

   Cards: the owner's hero picks (assets/hero-picks.json) first, then one card
   from each category the picks leave out, then a few classics. Every card is
   rendered square, the format the ads are designed for; the first --three4
   also at 3:4 and the first --story at 9:16 (owner, 2026-09-27: "primarily
   1:1 or 3:4 but occasionally we will do the 9:16").

   usage:  npx http-server -p 8899 -s .   then
           CHROME=/path/to/chrome node scripts/motion_gallery.mjs v2 "label" [--preview 480] [--classics 3] [--three4 6] [--story 2]
   Writes .render/video/gallery/<version>/{manifest.json, clips/, posters/};
   then python3 scripts/gallery/build.py makes the page. */
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';
const argv = process.argv.slice(2), arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const VERSION = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'v2';
const LABEL = argv[1] && !argv[1].startsWith('--') ? argv[1] : 'new language';
const PREVIEW = +arg('--preview', 480), CLASSICS = +arg('--classics', 3), LIMIT = +arg('--limit', 0);
const THREE4 = +arg('--three4', 6), STORY = +arg('--story', 2);
const OUT = new URL(`../.render/video/gallery/${VERSION}/`, import.meta.url).pathname;
mkdirSync(OUT + 'clips', { recursive: true }); mkdirSync(OUT + 'posters', { recursive: true });
const fab = process.env.FABRIC_JS ? readFileSync(process.env.FABRIC_JS) : null;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--force-color-profile=srgb'] });
const errors = [];
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
  // no backend: keep an operator stub signed in, or premium cards open as a free one
  await page.evaluate(() => { loadAccount = async () => account; account = { email: 'audit@local', role: 'admin', plan: 'pro' }; });
}
await freshPage();
let jobs = await page.evaluate(async (nClassics) => {
  const cards = await scLoadIndex(); await scLoadPicks();
  const picked = scPickedCards(cards), have = new Set(picked.map(c => c.cat));
  const extra = [];
  cards.forEach(c => { if (!have.has(c.cat)){ have.add(c.cat); extra.push(c); } });
  const show = picked.concat(extra).map(c => ({ kind: 'showcase', id: c.id, name: c.name, cat: c.cat, font: c.faces && c.faces.display || '', hero: picked.indexOf(c) >= 0 }));
  const cls = TEMPLATES.filter(t => !/^sc-/.test(t.id));
  const step = Math.max(1, Math.floor(cls.length / Math.max(1, nClassics)));
  const classics = [];
  for (let i = 0; i < cls.length && classics.length < nClassics; i += step)
    classics.push({ kind: 'classic', id: cls[i].id, name: cls[i].name || cls[i].id, cat: cls[i].cat || cls[i].category || 'classic', font: '', hero: false });
  return show.concat(classics);
}, CLASSICS);
if (LIMIT) jobs.splice(LIMIT);
jobs = jobs.map(j => ({ ...j, fmt: 'square' }))
  .concat(jobs.slice(0, THREE4).map(j => ({ ...j, fmt: 'three4' })))
  .concat(jobs.slice(0, STORY).map(j => ({ ...j, fmt: 'story' })));
console.log('rendering', jobs.length, 'clips:', jobs.map(j => j.id + (j.fmt === 'square' ? '' : ':' + j.fmt)).join(', '));

const clips = [];
for (const [n, j] of jobs.entries()){
  if (n && n % 8 === 0) await freshPage();
  const t0 = Date.now();
  const r = await page.evaluate(async (j, PREVIEW) => {
    if (j.kind === 'showcase'){ await openShowcase(j.id); if (ez.tpl !== 'sc-' + j.id) throw new Error('opened ' + ez.tpl + ', not ' + j.id); }
    else { showEasy(); selectEzTpl(j.id); ez.bgPicked = true; if (ez.tpl !== j.id) throw new Error('opened ' + ez.tpl + ', not ' + j.id); }
    $('ez-phone').value = '(562) 999-4994';
    if (typeof schedEzPreview === 'function') schedEzPreview(0);
    /* the photograph and cutouts draw only once loaded; a render before that
       falls back to the plain ground, so wait for them (up to 6s) */
    for (let i = 0, t = ezTpl(); i < 60; i++){
      const src = t.bg && t.bg.type === 'image' && t.bg.src;
      const cuts = (t.layers || []).filter(l => l.kind === 'cutout' && l.props && l.props.src).map(l => l.props.src);
      if ((!src || (TPL_BG_ELS[src] && TPL_BG_ELS[src].width)) && cuts.every(c => CUTOUT_ELS[c])) break;
      await new Promise(r => setTimeout(r, 100));
    }
    await new Promise(r => setTimeout(r, 600));
    const sc = renderEzCanvas(1080, 'png', undefined, undefined, j.fmt, true);
    const docW = sc.width, docH = sc.height;
    const even = (w) => Math.round(w * docH / docW / 2) * 2;
    // the call to action as the 1080 download builds it
    const big = motionBake(sc, docW, docH, 1080, even(1080)), c = big.cta;
    const num = c && c.texts.find(t => t.role === 'number');
    const fact = { cta: !!c, off: big.ctaOff || null,
      parts: c ? c.parts.map(p => p.key).concat(c.prod ? ['prod'] : []) : [],
      shade: c ? c.shade : null, legib: c ? Math.min(...c.legibility.filter(l => l.px).map(l => l.q75)) : null,
      number: num ? Math.round(num.size) : null, numberMin: Math.round(72 * Math.min(1080, even(1080)) / 1080) };
    /* the clip is the 1080 download, scaled down frame by frame. A bake at
       preview size re-decides the call to action on softer pixels, and a
       borderline card (stepsFlow-jw01-20, 3.12:1 at 1080) previewed as the
       number alone while the download keeps its headline. */
    const w = PREVIEW, h = even(PREVIEW), BW = 1080, BH = even(1080);
    let sound = null;
    try { sound = await motionSound(48000); } catch (e){}
    const bigCv = document.createElement('canvas'); bigCv.width = BW; bigCv.height = BH;
    const bx = bigCv.getContext('2d', { willReadFrequently: true });
    const z0 = motionFrameZero(sc, big, bx);
    const plan = await motionPlan(w, h, sound);
    if (!plan) throw new Error('no encoder for the preview');
    const MB = plan.MB;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const x = cv.getContext('2d', { willReadFrequently: true });
    const output = new MB.Output({ format: plan.fmt === 'mp4' ? new MB.Mp4OutputFormat({ fastStart: 'in-memory' }) : new MB.WebMOutputFormat(), target: new MB.BufferTarget() });
    const vs = new MB.CanvasSource(cv, { codec: plan.codec, quality: MB.QUALITY_HIGH, keyFrameInterval: 2 });
    output.addVideoTrack(vs, { frameRate: MOTION.fps });
    let as = null;
    if (plan.audio){ as = new MB.AudioBufferSource({ codec: plan.audio, quality: MB.QUALITY_HIGH }); output.addAudioTrack(as); }
    await output.start();
    if (as) await as.add(sound);
    const fc = new MotionFlashCheck(w, h, MOTION.fps), n = Math.round(MOTION.dur * MOTION.fps);
    x.imageSmoothingQuality = 'high';
    let poster = null, end = null;
    for (let i = 0; i < n; i++){
      const t = i / MOTION.fps;
      motionDraw(bx, big, t);
      x.drawImage(bigCv, 0, 0, w, h);
      fc.add(x);
      await vs.add(t, 1 / MOTION.fps);
      if (i === 0) poster = cv.toDataURL('image/jpeg', 0.84).split(',')[1];
      if (i === n - 8) end = cv.toDataURL('image/jpeg', 0.84).split(',')[1];   // 0.25 s before the loop
    }
    const fl = fc.result();
    await output.finalize();
    const blob = new Blob([output.target.buffer], { type: plan.fmt === 'mp4' ? 'video/mp4' : 'video/webm' });
    const rec = { mime: blob.type, blob, frameZero: z0, flash: fl };
    const b64 = bl => new Promise(res => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1]); fr.readAsDataURL(bl); });
    sc.dispose();
    return { W: 1080, H: even(1080), sw: w, sh: h, fmt: j.fmt,
      mime: rec.mime, clip: await b64(rec.blob), bytes: rec.blob.size, poster, end, audio: !!sound,
      frame0: { ok: rec.frameZero.ok, off: rec.frameZero.off },
      flash: { pass: rec.flash.pass, perSec: Math.max(rec.flash.general.perSec, rec.flash.red.perSec), area: +Math.max(rec.flash.general.area, rec.flash.red.area).toFixed(3) },
      fact };
  }, j, PREVIEW).catch(e => ({ err: String(e && e.message || e) }));
  if (r.err){ console.log(`[${n + 1}/${jobs.length}] ${j.id} ${j.fmt} ERROR ${r.err}`); clips.push({ id: j.id, err: r.err }); continue; }
  const ext = r.mime.includes('mp4') ? 'mp4' : 'webm', key = `${j.id}-${r.fmt}-10s`;
  writeFileSync(`${OUT}clips/${key}.${ext}`, Buffer.from(r.clip, 'base64'));
  writeFileSync(`${OUT}posters/${key}.jpg`, Buffer.from(r.poster, 'base64'));
  writeFileSync(`${OUT}posters/${key}-end.jpg`, Buffer.from(r.end, 'base64'));
  const f = r.fact, stack = { prod: 'product', head: 'headline', cta: 'call-to-action line', block: 'phone block' };
  const checks = [
    { ok: r.frame0.ok, label: 'Opens on the finished still ad', val: r.frame0.ok ? 'matches' : r.frame0.off + ' px differ' },
    { ok: true, label: f.cta ? 'Shifts to its own call to action' : 'Keeps the living still (no CTA passed)', val: f.cta ? f.parts.map(p => stack[p] || p).join(' + ') : 'fallback' },
    f.cta && { ok: f.legib >= 3, label: 'Call-to-action lines, measured contrast', val: f.legib.toFixed(1) + ':1' },
    f.cta && f.number && { ok: f.number >= f.numberMin, label: 'Phone number size at 1080', val: f.number + ' px' },
    f.cta && { ok: true, label: 'Photo shade under the lines', val: f.shade ? Math.round(f.shade * 100) + '% dark' : 'none needed' },
    { ok: r.flash.pass, label: 'Flashing (WCAG 2.3.1)', val: `max ${r.flash.perSec}/s` },
  ].filter(Boolean);
  clips.push({ key, id: j.id, name: j.name, cat: j.cat, hero: j.hero, fmt: r.fmt, len: 10, bytes: r.bytes,
    clip: `clips/${key}.${ext}`, poster: `posters/${key}.jpg`, end: `posters/${key}-end.jpg`,
    W: r.W, H: r.H, sw: r.sw, sh: r.sh, audio: r.audio,
    copy: [j.hero ? 'Owner hero pick' : j.kind === 'classic' ? 'Classic template' : 'Curated card', j.font && 'type ' + j.font].filter(Boolean).join(' · '),
    notes: f.cta ? [] : [String(f.off || '').slice(0, 240)],
    checks, pass: checks.every(k => k.ok) });
  console.log(`[${n + 1}/${jobs.length} ${Math.round((Date.now() - t0) / 1000)}s] ${j.id} ${r.fmt} ${Math.round(r.bytes / 1024)} KB  ` + checks.map(k => (k.ok ? '' : '✗ ') + k.val).join(' · '));
}
const done = clips.filter(c => !c.err);
writeFileSync(OUT + 'manifest.json', JSON.stringify({ version: VERSION, label: LABEL, made: new Date().toISOString(), schema: 2, clips: done }, null, 1));
console.log(`\n${done.length} clips, ${done.filter(c => c.pass).length} pass every check, ${clips.length - done.length} errors, page errors ${errors.length}`);
await browser.close();
if (clips.length - done.length || errors.length) process.exit(1);
