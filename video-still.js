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
   VideoStill.name(videoName, w, h)  the photo's file name, beside the video's */
(function(){
  const SHORT = 1440, GRID = 320, STEP = 0.1, MOVE = 8, TIE = 0.995;
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

  const toBlob = c => new Promise((res, rej) => {
    try { c.toBlob(b => b ? res(b) : rej(new Error('the photo could not be encoded (out of memory)')), 'image/png'); }
    catch (e){ rej(e); }
  });

  function name(video, w, h){
    const base = String(video || 'ad').replace(/\.[a-z0-9]+$/i, '').replace(/-video-\d+x\d+$/, '');
    return base + '-photo-' + w + 'x' + h + '.png';
  }

  window.VideoStill = { SHORT, size, best, toBlob, name };
})();
