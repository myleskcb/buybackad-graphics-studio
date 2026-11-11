/* Renders the explainer videos (videos.js) to MP4, frame by frame.

     python3 -m http.server 8899            # in the repo root, in another terminal
     node tools/explainers/render.mjs       # every video -> assets/explainers/<id>.mp4 + <id>.jpg
     node tools/explainers/render.mjs --only the-math
     node tools/explainers/render.mjs --sheet    # no video: a sheet of frames per video, to look at first
     node tools/explainers/render.mjs --url studio.example.com   # print the site's address on the end card

   Needs Chromium through Playwright (PLAYWRIGHT_MODULE=… when it is not on the
   module path) and ffmpeg with libx264. Each frame is drawn from its time alone
   (engine.js), photographed, and piped to ffmpeg, so a busy machine makes the
   render slower and never drops a frame. The music is one of the public-domain
   recordings the video maker ships (motion/sounds/tracks, its index.json has
   each one's source), faded in and out under the picture. */
import { createRequire } from 'node:module';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../..');
const arg = k => { const i = process.argv.indexOf('--' + k); return i < 0 ? null : (process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true); };
const BASE = (arg('base') || 'http://localhost:8899').replace(/\/$/, '');
const FPS = Number(arg('fps')) || 30, ONLY = arg('only'), SHEET = !!arg('sheet'), URL_LINE = arg('url');
const OUT = path.join(ROOT, 'assets/explainers'), TMP = arg('tmp') || path.join(HERE, '.out');
mkdirSync(OUT, { recursive: true }); mkdirSync(TMP, { recursive: true });

const b = await chromium.launch();
const page = await (await b.newContext({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 })).newPage();
const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('requestfailed', r => errors.push('missing ' + r.url()));
const open = async id => { await page.goto(`${BASE}/tools/explainers/stage.html?render=1&v=${id}${URL_LINE && URL_LINE !== true ? '&url=' + encodeURIComponent(URL_LINE) : ''}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.EX && window.EX.isReady, null, { timeout: 60000 }); return page.evaluate(() => window.EX.total); };
await open('');
const videos = (await page.evaluate(() => window.EX.info())).filter(v => !ONLY || v.id === ONLY);
if (!videos.length) { console.error('no such video:', ONLY); process.exit(1); }

for (const v of videos) {
  const total = await open(v.id), frames = Math.round(total * FPS);
  const shot = t => page.evaluate(([id, tt]) => { window.EX.seek(id, tt); }, [v.id, t]).then(() => page.screenshot({ type: 'jpeg', quality: 95 }));
  if (SHEET) {   // a frame every 0.8 s, small, on one sheet
    const n = Math.ceil(total / .8), cols = 7, T = 270, rows = Math.ceil(n / cols), file = path.join(TMP, v.id + '-sheet.jpg');
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-i', '-', '-vf', `scale=${T}:${T},tile=${cols}x${rows}:padding=4:color=black`, '-frames:v', '1', '-q:v', '3', file]);
    for (let i = 0; i < n; i++) ff.stdin.write(await shot(Math.min(total - .05, i * .8 + .55)));
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
    console.log(v.id, total.toFixed(1) + 's', '->', file); continue;
  }
  const silent = path.join(TMP, v.id + '-silent.mp4'), mp4 = path.join(OUT, v.id + '.mp4'), jpg = path.join(OUT, v.id + '.jpg');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', '-r', String(FPS), silent]);
  let ffErr = ''; ff.stderr.on('data', d => { ffErr += d; });
  const t0 = Date.now();
  for (let f = 0; f < frames; f++) { const buf = await shot(f / FPS); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  if (ffErr.trim()) console.error(ffErr.trim());
  const track = path.join(ROOT, 'motion/sounds/tracks', (v.music || 'small_note_boogaloo') + '.mp3');
  const fade = 1.4;
  const mux = existsSync(track)
    ? ['-y', '-loglevel', 'error', '-i', silent, '-ss', '4', '-i', track, '-filter_complex', `[1:a]volume=0.55,afade=t=in:d=0.35,afade=t=out:st=${(total - fade).toFixed(2)}:d=${fade}[a]`,
       '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-t', total.toFixed(3), '-movflags', '+faststart', mp4]
    : ['-y', '-loglevel', 'error', '-i', silent, '-c', 'copy', '-movflags', '+faststart', mp4];
  const r = spawnSync('ffmpeg', mux, { encoding: 'utf8' }); if (r.status) { console.error(r.stderr); process.exit(1); }
  await page.evaluate(([id, tt]) => { window.EX.seek(id, tt); }, [v.id, v.poster || total * .4]);
  await page.screenshot({ path: jpg, type: 'jpeg', quality: 86 });
  console.log(v.id, `${total.toFixed(1)}s`, frames + ' frames', `${((Date.now() - t0) / 1000).toFixed(0)}s to render`, '->', path.relative(ROOT, mp4));
}
await b.close();
if (errors.length) { console.error('PAGE ERRORS:\n' + [...new Set(errors)].join('\n')); process.exit(1); }
