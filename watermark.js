'use strict';
/* ═══════════════════════════════════════════════════════
   The BUYBACK.AD mark: one drawing for every picture that carries it. That
   is a Free download (photo or video), and every preview a download would
   mark: signed out or Free, the Easy Mode and full ad previews, the editor's
   export preview, the studio's Create video and the video maker's player.

   Owner, 2026-11-17: protect the ads from screenshots and wrongful
   downloads, "but we don't want the content to be unreadable or not fun to
   look at". So it is a light lattice of small words across the whole
   picture, in two tones (a light word over a dark one a pixel apart), so it
   shows on dark and light grounds alike and the ad reads through it. Being
   everywhere, a crop cannot take it off, and a phone's clean-up tool cannot
   paint it out without painting out the product and the number under it.
   The four corner words it replaces went with a crop or four taps.

   The lattice is measured from the picture's short side, so a 560 preview
   and a 1080 download carry the same pattern at their own size.

   window.PgfxMark:
     draw(ctx, w, h)      the lattice over 0..w × 0..h, in ctx's own space
     marked(plan, role)   whether an account's download carries it: Free and
                          signed out (no plan) do, a paid plan or an
                          operator does not
     PLANS                the plans whose downloads carry it; app.js PLANS'
                          watermark:true, held by scripts/watermark_check.mjs
   Loaded before app.js (index.html) and the video maker (motion/index.html).
   ═══════════════════════════════════════════════════════ */
(() => {
  const WORD = 'BUYBACK.AD';
  const PLANS = ['free'];
  const SIZE = 0.03;              // the word's height, of the short side
  const ANGLE = -22;              // degrees
  const LIGHT = 'rgba(255,255,255,0.18)', DARK = 'rgba(0,0,0,0.13)';   // 0.24 and 0.17 read loud on the dark pairs at full size
  const tiles = new Map();        // the lattice drawn once per size: a video draws it on every frame

  const face = fs => '700 ' + fs + 'px Satoshi, "Helvetica Neue", Arial, sans-serif';

  function lattice(w, h){
    const base = Math.min(w, h), fs = Math.max(8, Math.round(base * SIZE)), font = face(fs);
    let ready = true;
    try { ready = !document.fonts || document.fonts.check(font, WORD); } catch (e){}
    const key = w + 'x' + h;
    if (ready && tiles.has(key)) return tiles.get(key);
    const t = document.createElement('canvas'); t.width = w; t.height = h;
    const x = t.getContext('2d');
    x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle';
    const tw = x.measureText(WORD).width, stepX = tw + fs * 3.2, stepY = fs * 4.2;
    const nudge = Math.max(1, Math.round(fs * 0.07)), R = Math.hypot(w, h) / 2 + stepX;
    x.translate(w / 2, h / 2); x.rotate(ANGLE * Math.PI / 180);
    let row = 0;
    for (let y = -R; y <= R; y += stepY, row++){
      for (let cx = -R + (row % 2 ? stepX / 2 : 0); cx <= R; cx += stepX){
        x.fillStyle = DARK; x.fillText(WORD, cx + nudge, y + nudge);
        x.fillStyle = LIGHT; x.fillText(WORD, cx, y);
      }
    }
    /* kept only once its face has loaded, so a fallback face is never kept; three sizes at most */
    if (ready){ if (tiles.size >= 3) tiles.delete(tiles.keys().next().value); tiles.set(key, t); }
    return t;
  }

  function draw(ctx, w, h){
    w = Math.round(w); h = Math.round(h || w);
    if (!ctx || !(w > 0 && h > 0)) return;
    ctx.save();
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    try { ctx.filter = 'none'; } catch (e){}
    ctx.drawImage(lattice(w, h), 0, 0, w, h);
    ctx.restore();
  }

  const marked = (plan, role) => role !== 'admin' && (!plan || PLANS.indexOf(plan) >= 0);

  window.PgfxMark = Object.freeze({ draw, marked, PLANS: Object.freeze(PLANS.slice()), WORD });
})();
