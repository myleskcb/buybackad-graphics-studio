/* Video still: the photo that goes out with every video ad.

   OfferUp takes a video only with a photo beside it, so every video download
   brings the ad as a photo too, 1440 pixels on its short side (1440×1440
   square, 1440×2560 story, 2560×1440 wide), drawn at that size by the same
   frame function as the video, never a video frame scaled up. Owner,
   2026-10-03: "every single video ad has a photo because offer requires us to
   put a photo with any video ... we need the HD 1440P version of the ad as a
   photo so find the best point in the video to save".

   The moment is measured, not assumed. Every tenth of a second inside the
   windows the caller names is drawn and judged on its own pixels, on a copy
   320 pixels on its long side:
     detail     the mean luminance step between neighbouring pixels: what can
                be read. A line that has not landed, a fade, motion blur and a
                shaded-down ground all lower it;
     stillness  1 minus the share of the frame that changes by more than 8
                levels in the tenth of a second either side: a frame mid-move,
                mid-beat or mid-flash loses;
     score      detail × stillness². A moment is held to the lowest score of
                itself and its two neighbours, so the winner sits in a held
                stretch rather than on a lone frame between two moves, and of
                moments within half a percent of the best the earliest wins.

   Shared by the studio (app.js) and the video maker (motion/app.js): a plain
   script, like video-help.js, that sets window.VideoStill.

   VideoStill.SHORT                  1440
   VideoStill.size(w, h, short)      the photo's size for a w×h video, in its aspect
   VideoStill.best({ frame, windows, step, onProgress })
       frame(t) draws the video's frame at t seconds and returns its canvas
       (any size; it may return a promise); windows: [[from, to], …] in
       seconds. Resolves { t, score, detail, stillness, rows }.
   VideoStill.toBlob(canvas)         Promise<Blob>, PNG
   VideoStill.name(videoName, w, h)  the photo's file name, beside the video's
   VideoStill.frames(videoBlob, { max, onProgress })
       the video's own frames, read back out of the file: up to `max` (6)
       moments that look different from each other, each the held best of
       its stretch. Resolves [{ t, blob, w, h, score }] in time order.
   VideoStill.frameName(videoName, t, w, h)  a frame's file name */
(function(){
  const SHORT = 1440, GRID = 320, STEP = 0.1, MOVE = 8, TIE = 0.995;
  // read once, while this script runs: the decoder sits beside it in vendor/, on either page
  const MB_URL = new URL('vendor/mediabunny-1.60.0.min.mjs', (document.currentScript && document.currentScript.src) || location.href).href;
  // a message round trip, not a timer: a background tab throttles timers
  const yieldNow = () => new Promise(r => { const ch = new MessageChannel(); ch.port1.onmessage = () => r(); ch.port2.postMessage(0); });

  function size(w, h, short = SHORT){
    const k = short / Math.min(w, h);
    return { w: Math.round(w * k), h: Math.round(h * k) };
  }

  let grid = null;
  /* the frame's luminance on the small grid (Rec. 709 weights) */
  function luma(src){
    const k = GRID / Math.max(src.width, src.height);
    const w = Math.max(2, Math.round(src.width * k)), h = Math.max(2, Math.round(src.height * k));
    if (!grid) grid = document.createElement('canvas');
    if (grid.width !== w || grid.height !== h){ grid.width = w; grid.height = h; }
    const x = grid.getContext('2d', { willReadFrequently: true });
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.clearRect(0, 0, w, h); x.drawImage(src, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h).data, L = new Uint8ClampedArray(w * h);
    for (let i = 0, p = 0; p < L.length; i += 4, p++) L[p] = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    return { L, w, h };
  }
  function detail(f){
    const { L, w, h } = f; let s = 0;
    for (let y = 0; y < h - 1; y++) for (let x = 0, p = y * w; x < w - 1; x++, p++) s += Math.abs(L[p + 1] - L[p]) + Math.abs(L[p + w] - L[p]);
    return s / ((w - 1) * (h - 1));
  }
  function change(a, b){
    if (!a || !b) return 0;
    let n = 0;
    for (let p = 0; p < a.L.length; p++) if (Math.abs(a.L[p] - b.L[p]) > MOVE) n++;
    return n / a.L.length;
  }

  async function best(o){
    const step = o.step || STEP, rows = [];
    const windows = (o.windows || []).filter(w => w && isFinite(w[0]) && isFinite(w[1]) && w[1] >= w[0]);
    const total = windows.reduce((s, [a, b]) => s + Math.floor((b - a) / step + 1e-6) + 1, 0);
    let done = 0;
    for (const [a, b] of windows){
      const seg = [], n = Math.floor((b - a) / step + 1e-6);
      for (let i = 0; i <= n; i++){
        const t = +(a + i * step).toFixed(4), f = luma(await o.frame(t));
        seg.push({ t, f, detail: detail(f) });
        if (o.onProgress) o.onProgress(++done / total);
        if (i % 4 === 3) await yieldNow();
      }
      seg.forEach((r, i) => {
        r.stillness = 1 - Math.max(change(seg[i - 1] && seg[i - 1].f, r.f), change(r.f, seg[i + 1] && seg[i + 1].f));
        r.score = r.detail * r.stillness * r.stillness;
      });
      seg.forEach((r, i) => { r.held = Math.min(r.score, seg[i - 1] ? seg[i - 1].score : Infinity, seg[i + 1] ? seg[i + 1].score : Infinity); });
      seg.forEach(r => { delete r.f; rows.push(r); });
    }
    if (!rows.length) throw new Error('there was no moment of the video to take the photo from');
    const top = Math.max(...rows.map(r => r.held));
    const pick = rows.find(r => r.held >= top * TIE);
    return { t: pick.t, score: +pick.held.toFixed(3), detail: +pick.detail.toFixed(3), stillness: +pick.stillness.toFixed(4), rows };
  }

  const toBlob = c => c.convertToBlob ? c.convertToBlob({ type: 'image/png' }) : new Promise((res, rej) => {
    try { c.toBlob(b => b ? res(b) : rej(new Error('the photo could not be encoded (out of memory)')), 'image/png'); }
    catch (e){ rej(e); }
  });

  function name(video, w, h){
    const base = String(video || 'ad').replace(/\.[a-z0-9]+$/i, '').replace(/-video-\d+x\d+$/, '');
    return base + '-photo-' + w + 'x' + h + '.png';
  }
  function frameName(video, t, w, h){
    const base = String(video || 'ad').replace(/\.[a-z0-9]+$/i, '').replace(/-video-\d+x\d+$/, '');
    return base + '-frame-' + t.toFixed(1) + 's-' + w + 'x' + h + '.png';
  }

  /* ---- the video's own frames ----
     Owner, 2026-10-04: "more and more exact versions of real thumbnails in
     the ad"; asked what that meant, "the photo is the exact video frame" and
     "more versions". The HD photo above is the best moment drawn again at
     1440. These are the frames themselves: the finished file is read back
     (Mediabunny, vendor/), so each one is the picture the video holds at that
     instant, pixel for pixel, at the video's own size: what a platform's
     thumbnail picker would show, without the scrubbing.

     Every tenth of a second of the whole clip is scored as above (detail x
     stillness squared, held to its neighbours). Moments are taken best
     first, at least half a second apart, each one only if it looks different
     from every moment already taken: on 32x32 blocks of the 320 copy, at
     least DIFF of the blocks change their mean luminance by more than BLOCK
     levels. Measured 2026-10-04 on seven clips: the same ad with its
     banknote photograph breathing behind it, 0 of the blocks (on 16x16
     blocks at 12 levels it read 0.12 to 0.15, and four near-copies were
     offered); the ad against its call to action, 0.62 to 0.80; the phones
     face-on against the phones landed on their backs, 0.117 to 0.383. A
     moment scoring under FLOOR of the best is not a thumbnail worth
     posting, however different it is. */
  const BLOCK = 20, DIFF = 0.06, FLOOR = 0.4, APART = 0.5, MAXF = 6, BS = 32;
  let mb = null;
  const MB = () => mb || (mb = import(MB_URL));
  function blockMeans(f){
    const { L, w, h } = f, bw = Math.ceil(w / BS), bh = Math.ceil(h / BS), sum = new Float32Array(bw * bh), n = new Uint16Array(bw * bh);
    for (let y = 0; y < h; y++) for (let x = 0, p = y * w; x < w; x++, p++){ const k = Math.floor(y / BS) * bw + Math.floor(x / BS); sum[k] += L[p]; n[k]++; }
    for (let k = 0; k < sum.length; k++) sum[k] /= n[k] || 1;
    return sum;
  }
  function differs(a, b){
    let n = 0;
    for (let k = 0; k < a.length; k++) if (Math.abs(a[k] - b[k]) > BLOCK) n++;
    return n / a.length;
  }
  async function frames(video, o = {}){
    const M = await MB();
    const input = new M.Input({ source: new M.BlobSource(video), formats: M.ALL_FORMATS });
    const vt = await input.getPrimaryVideoTrack();
    if (!vt) throw new Error('the video has no picture in it');
    if (!(await vt.canDecode())) throw new Error('this browser cannot read the video back');
    const dur = await input.computeDuration(), step = o.step || STEP;
    /* a canvas of its own for every frame: with a pool the sink decodes ahead
       into canvases it has already handed out, and a chosen frame was saved
       with a later one drawn over it (16 to 227 levels off, 2026-10-04) */
    const sink = new M.CanvasSink(vt);
    const rows = [];
    let next = 0, k = 0;
    for await (const f of sink.canvases(0, dur)){
      if (f.timestamp < next - 1e-3) continue;           // one frame a tenth of a second
      next = f.timestamp + step;
      const g = luma(f.canvas);
      rows.push({ t: +f.timestamp.toFixed(4), f: g, B: blockMeans(g), detail: detail(g) });
      if (o.onProgress) o.onProgress(Math.min(0.9, 0.9 * f.timestamp / dur));
      if (++k % 4 === 0) await yieldNow();
    }
    if (!rows.length) throw new Error('no frame of the video could be read');
    rows.forEach((r, i) => {
      r.stillness = 1 - Math.max(change(rows[i - 1] && rows[i - 1].f, r.f), change(r.f, rows[i + 1] && rows[i + 1].f));
      r.score = r.detail * r.stillness * r.stillness;
    });
    rows.forEach((r, i) => { r.held = Math.min(r.score, rows[i - 1] ? rows[i - 1].score : Infinity, rows[i + 1] ? rows[i + 1].score : Infinity); });
    const top = Math.max(...rows.map(r => r.held)), picked = [];
    for (const r of rows.slice().sort((a, b) => b.held - a.held || a.t - b.t)){
      if (picked.length >= (o.max || MAXF) || r.held < top * FLOOR) break;
      if (picked.every(p => Math.abs(p.t - r.t) >= APART && differs(p.B, r.B) >= DIFF)) picked.push(r);
    }
    picked.sort((a, b) => a.t - b.t);
    /* the very frames that were scored, read again from the start rather
       than sought: a video recorded in real time (MediaRecorder's WebM) has
       no index to seek by, and getCanvas(t) comes back empty on it */
    const out = [], want = new Map(picked.map(r => [r.t, r]));
    for await (const f of sink.canvases(0, dur)){
      const r = want.get(+f.timestamp.toFixed(4));
      if (!r) continue;
      out.push({ t: r.t, blob: await toBlob(f.canvas), w: f.canvas.width, h: f.canvas.height, score: +r.held.toFixed(3) });
      if (out.length === want.size) break;
    }
    if (o.onProgress) o.onProgress(1);
    return out;
  }

  window.VideoStill = { SHORT, size, best, toBlob, name, frames, frameName };
})();
