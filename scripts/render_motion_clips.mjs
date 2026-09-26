#!/usr/bin/env node
/* Render the landing page's video-ad clips WITH THE PRODUCT'S OWN MOTION CODE.

   The clips on the home page are a promise about what the export button
   produces, so they are not animated separately: this loads the real app,
   builds each template through the real editor path (setFormat + loadTemplate,
   i.e. the same reflow a customer gets), and steps motionBake()/motionDraw()/motionSound()
   from app.js frame by frame. Deterministic in t, so a re-render is identical.

   usage:
     node scripts/render_motion_clips.mjs                     # every clip in CLIPS
     node scripts/render_motion_clips.mjs --probe 0,1,3,5     # stills at those seconds, no encode
     node scripts/render_motion_clips.mjs --only gold_square  # one clip
     node scripts/render_motion_clips.mjs --ids a,b --fmt story --probe 0   # audition candidates

   env:
     GFX_BASE      page to load            (default http://localhost:8899/)
     CHROME        browser executable      (default: Playwright's bundled Chromium)
     FFMPEG        ffmpeg with libx264+aac (default: ffmpeg on PATH)
     FABRIC_LOCAL  path to fabric.min.js, served in place of the cdnjs copy
                   (for sandboxes where cdnjs is unreachable)

   Exits non-zero on any page error (rule 49: a clean-looking render proves
   nothing while the console is dirty), on a template whose photo never
   decoded (rule 22: never record the fallback gradient and call it the ad),
   and on an encoded file with no audio stream (the unmute button would lie). */
import { spawn, spawnSync, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = ROOT + 'assets/video/';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';
const FFMPEG = process.env.FFMPEG || 'ffmpeg';

/* The reel. `fmt` is a FORMATS key from app.js; `px` is the encoded size.
   Chosen for range (four categories, two formats), because every one is free
   for an anonymous visitor (clicking a clip opens the editor, not a paywall),
   and because every text layer passes the house contrast test (<3:1 AND
   ΔE<30 fails) in the clip's own format. top_buyer was the first phones pick
   and was dropped: its CTA measures 1.02:1, ΔE 2 — invisible in every format. Change the list, re-run, and update the <figure>s in
   index.html's #lp-video section to match. */
const CLIPS = [
  { key:'phones_story',  id:'sell_iphone',              fmt:'story',  w:540, h:960 },
  { key:'gold_square',   id:'gold_spot',                fmt:'square', w:720, h:720 },
  { key:'cars_story',    id:'cars_anycond',             fmt:'story',  w:540, h:960 },
  { key:'cards_square',  id:'pkm_zard',                 fmt:'square', w:720, h:720 },
];

const argv = process.argv.slice(2);
const arg = k => { const i = argv.indexOf(k); return i < 0 ? null : argv[i + 1]; };
const probe = arg('--probe');
const only = arg('--only');
const ids = arg('--ids');   // ad-hoc: --ids a,b --fmt story --probe 0  (audition candidates for the reel)
const list = ids
  ? ids.split(',').map(id => ({ key:id + '-' + (arg('--fmt') || 'story'), id, fmt:arg('--fmt') || 'story',
      w:(arg('--fmt') || 'story') === 'story' ? 540 : 720, h:(arg('--fmt') || 'story') === 'story' ? 960 : 720 }))
  : CLIPS.filter(c => !only || c.key === only || c.id === only);
if (!list.length){ console.error('no clip matches ' + only); process.exit(2); }

mkdirSync(OUT, { recursive: true });
// a local install wins; otherwise the global one (`npm i -g playwright`)
let chromium;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = createRequire(execSync('npm root -g', { encoding:'utf8' }).trim() + '/')('playwright')); }
const browser = await chromium.launch(Object.assign({ args:['--force-color-profile=srgb', '--autoplay-policy=no-user-gesture-required'] },
  process.env.CHROME ? { executablePath: process.env.CHROME } : {}));
const page = await (await browser.newContext({ viewport:{ width:1280, height:900 }, deviceScaleFactor:1 })).newPage();
if (process.env.FABRIC_LOCAL){
  const body = readFileSync(process.env.FABRIC_LOCAL);
  await page.route(/cdnjs\.cloudflare\.com\/.*fabric/, r => r.fulfill({ body, contentType:'application/javascript' }));
}
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.goto(BASE, { waitUntil:'load' });
await page.waitForFunction(() => typeof TEMPLATES !== 'undefined' && typeof motionDraw === 'function' && document.fonts.status === 'loaded', null, { timeout:30000 });

let failed = 0;
const manifest = [];
for (const c of list){
  const ok = await page.evaluate(async c => {
    const tpl = TEMPLATES.find(t => t.id === c.id);
    if (!tpl) return 'no template ' + c.id;
    if (tplLocked(tpl)) return c.id + ' is locked for anonymous visitors, pick a free one';
    const src = tpl.bg && tpl.bg.type === 'image' && tpl.bg.src;
    for (let i = 0; src && i < 200 && !(TPL_BG_ELS[src] && TPL_BG_ELS[src].width); i++) await new Promise(r => setTimeout(r, 100));
    if (src && !(TPL_BG_ELS[src] && TPL_BG_ELS[src].width)) return 'backdrop never decoded: ' + src;
    showEditor(); setFormat(c.fmt, { silent:true }); loadTemplate(c.id);
    if (typeof endTutorial === 'function') endTutorial();
    canvas.discardActiveObject(); canvas.renderAll();
    const sc = new fabric.StaticCanvas(null, { width:CW, height:CH, renderOnAddRemove:false, enableRetinaScaling:false });
    await new Promise(res => sc.loadFromJSON(canvas.toJSON(EXTRA_PROPS), res));
    sc.setDimensions({ width:c.w, height:c.h }); sc.setZoom(c.w / CW);
    window.__clip = { sc, rig: motionRig(sc, CW, CH) };
    // the export's own compositor: bake once, draw each frame
    const out = document.createElement('canvas'); out.width = c.w; out.height = c.h;
    window.__clip.out = out; window.__clip.bake = motionBake(sc, CW, CH, c.w, c.h);
    /* Where the sound button goes: the corner with the least TEXT under it
       (text boxes plus the plates behind them), measured on this layout in
       this format — rule 15, protect the region that carries the message. A
       fixed bottom-right sat on the phone plate of the gold ad. */
    const objs = sc.getObjects(), boxes = [];
    objs.filter(o => motionIsText(o) && o.visible !== false).forEach(o => {
      boxes.push(motionBox(o));
      const pl = motionPlate(objs, o, CW, CH); if (pl) boxes.push(motionBox(pl));
    });
    const m = 0.015 * Math.min(CW, CH), sz = 0.13 * Math.min(CW, CH);
    const sq = { br:[CW - m - sz, CH - m - sz], bl:[m, CH - m - sz], tr:[CW - m - sz, m], tl:[m, m] };
    const hit = ([x, y]) => boxes.reduce((a, b) => a + Math.max(0, Math.min(x + sz, b.x + b.w) - Math.max(x, b.x)) * Math.max(0, Math.min(y + sz, b.y + b.h) - Math.max(y, b.y)), 0);
    const cover = Object.fromEntries(Object.entries(sq).map(([k, v]) => [k, Math.round(100 * hit(v) / (sz * sz))]));
    window.__clip.corner = ['br', 'bl', 'tr', 'tl'].reduce((a, k) => cover[k] < cover[a] ? k : a, 'br');
    window.__clip.cover = cover;
    const u = window.__clip.rig.units;
    window.__clip.report = Object.fromEntries(Object.entries(u).map(([k, v]) =>
      [k, v ? v.members.map(m => (m.o.pgRole || m.o.type) + (m.o.text ? ':' + String(m.o.text).slice(0, 18) : '')).join(' + ') : null]));
    return true;
  }, c);
  if (ok !== true){ console.error('✗ ' + c.key + ': ' + ok); failed++; continue; }
  const meta = await page.evaluate(() => ({ report: window.__clip.report, corner: window.__clip.corner, cover: window.__clip.cover }));
  console.log('• ' + c.key + ' beats: ' + JSON.stringify(meta.report) + '  sound button: ' + meta.corner + ' (text coverage % by corner ' + JSON.stringify(meta.cover) + ')');
  const frame = (t, q) => page.evaluate(([t, q]) => {
    const k = window.__clip;
    motionDraw(k.out.getContext('2d'), k.bake, t);
    return k.out.toDataURL('image/jpeg', q).split(',')[1];
  }, [t, q]);

  if (probe){
    for (const t of probe.split(',').map(Number)){
      const f = OUT + '.probe-' + c.key + '-' + t.toFixed(2) + 's.jpg';
      writeFileSync(f, Buffer.from(await frame(t, 0.9), 'base64'));
      console.log('  ' + f);
    }
    continue;
  }

  // sound, rendered by the page's own motionSound() and written as 16-bit WAV
  const wavB64 = await page.evaluate(async () => {
    const b = await motionSound(48000);
    const n = b.length, ch = b.numberOfChannels, dv = new DataView(new ArrayBuffer(44 + n * ch * 2));
    const w = (o, s) => [...s].forEach((x, i) => dv.setUint8(o + i, x.charCodeAt(0)));
    w(0, 'RIFF'); dv.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
    dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, ch, true);
    dv.setUint32(24, b.sampleRate, true); dv.setUint32(28, b.sampleRate * ch * 2, true);
    dv.setUint16(32, ch * 2, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, n * ch * 2, true);
    const data = [...Array(ch)].map((_, i) => b.getChannelData(i));
    for (let i = 0, o = 44; i < n; i++) for (let k = 0; k < ch; k++, o += 2)
      dv.setInt16(o, Math.max(-1, Math.min(1, data[k][i])) * 0x7fff, true);
    let s = ''; const u8 = new Uint8Array(dv.buffer);
    for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(s);
  });
  const wav = tmpdir() + '/gfx-motion-sound.wav';
  writeFileSync(wav, Buffer.from(wavB64, 'base64'));

  const mp4 = OUT + c.key + '.mp4', webm = OUT + c.key + '.webm', poster = OUT + c.key + '.jpg';
  writeFileSync(poster, Buffer.from(await frame(0, 0.86), 'base64'));   // frame 0 IS the finished ad
  /* H.264/AAC for Chrome, Edge, Safari and iOS; VP9/Opus for browsers built
     without H.264 (open-source Chromium, some Linux Firefox). Both encoded
     from the same frames in one pass, never one transcoded from the other. */
  const input = ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-',
    '-i', wav, '-map', '0:v', '-map', '1:a', '-shortest', '-pix_fmt', 'yuv420p'];
  const encs = [
    spawn(FFMPEG, input.concat(['-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-profile:v', 'high',
      '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '96k', mp4]), { stdio:['pipe', 'inherit', 'inherit'] }),
    spawn(FFMPEG, input.concat(['-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '36', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2',
      '-c:a', 'libopus', '-b:a', '96k', webm]), { stdio:['pipe', 'inherit', 'inherit'] }),
  ];
  const total = Math.round(8 * 30);
  for (let i = 0; i < total; i++){
    const buf = Buffer.from(await frame(i / 30, 0.95), 'base64');
    for (const e of encs) if (!e.stdin.write(buf)) await new Promise(r => e.stdin.once('drain', r));
  }
  encs.forEach(e => e.stdin.end());
  const codes = await Promise.all(encs.map(e => new Promise(r => e.on('close', r))));
  if (codes.some(x => x !== 0)){ console.error('✗ ' + c.key + ': ffmpeg exited ' + codes); failed++; continue; }
  const probeA = f => spawnSync(FFMPEG, ['-hide_banner', '-i', f], { encoding:'utf8' }).stderr;
  if (!/Audio: aac/.test(probeA(mp4)) || !/Audio: opus/.test(probeA(webm))){ console.error('✗ ' + c.key + ': missing audio stream'); failed++; continue; }
  manifest.push({ key:c.key, tpl:c.id, fmt:c.fmt, corner:meta.corner, poster:poster.replace(ROOT, ''), mp4:mp4.replace(ROOT, ''), webm:webm.replace(ROOT, '') });
  console.log('✓ ' + c.key + ' → ' + [mp4, webm, poster].map(f => f.replace(ROOT, '')).join(' + '));
}
await browser.close();
try { rmSync(tmpdir() + '/gfx-motion-sound.wav'); } catch {}
/* clips.json tells the page where each clip's sound button goes. Merged by
   key, so rendering one clip (--only) keeps the others' entries. */
if (!probe && !ids && manifest.length){
  const f = OUT + 'clips.json';
  let prev = []; try { prev = JSON.parse(readFileSync(f, 'utf8')); } catch {}
  const byKey = Object.fromEntries(prev.map(x => [x.key, x]));
  manifest.forEach(x => { byKey[x.key] = x; });
  const order = CLIPS.map(c => c.key);
  writeFileSync(f, JSON.stringify(Object.values(byKey).filter(x => order.includes(x.key)).sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key)), null, 2) + '\n');
  console.log('wrote ' + f.replace(ROOT, ''));
}
if (errors.length){ console.error('page errors:\n  ' + errors.join('\n  ')); failed++; }
process.exit(failed ? 1 : 0);
