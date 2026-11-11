// Runs INSIDE the page (injected with page.addScriptTag after Easy Mode is open). Runtime only; nothing is saved.
(() => {
  const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const cr = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  const hexRgb = h => { const n = parseInt(String(h).replace('#', ''), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const hexLum = h => lum(...hexRgb(h));
  const grab = sc => { sc.renderAll(); const c = sc.lowerCanvasEl; return { d: c.getContext('2d').getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height }; };
  const byName = (sc, n) => sc.getObjects().find(o => o.name === n);
  const box = o => { o.setCoords(); const r = o.getBoundingRect(true, true); return { left: r.left, top: r.top, width: r.width, height: r.height }; };

  /* WCAG contrast of a line's FILL against the pixels actually behind it:
     mask = the line drawn alone, fill only (no stroke, no shadow), alpha >= 200;
     ground = the scene with the line hidden; fill = the scene as drawn. */
  function measure(sc, o){
    const objs = sc.getObjects(), vis = objs.map(q => q.visible);
    const full = grab(sc);
    o.visible = false; const ground = grab(sc); o.visible = true;
    const bgI = sc.backgroundImage, bgC = sc.backgroundColor;
    sc.backgroundImage = null; sc.backgroundColor = '';
    objs.forEach(q => { q.visible = q === o; });
    const st = { stroke: o.stroke, shadow: o.shadow };
    o.set({ stroke: 'rgba(0,0,0,0)', shadow: null }); o.dirty = true;
    const mask = grab(sc);
    o.set(st); o.dirty = true; objs.forEach((q, i) => { q.visible = vis[i]; }); sc.backgroundImage = bgI; sc.backgroundColor = bgC; sc.renderAll();
    const r = box(o), x0 = Math.max(0, Math.floor(r.left) - 4), y0 = Math.max(0, Math.floor(r.top) - 4), x1 = Math.min(full.w, Math.ceil(r.left + r.width) + 4), y1 = Math.min(full.h, Math.ceil(r.top + r.height) + 4);
    const ratios = []; let gs = [0, 0, 0], fs = [0, 0, 0], n = 0, gl = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++){
      const i = (y * full.w + x) * 4; if (mask.d[i + 3] < 200) continue;
      const lf = lum(full.d[i], full.d[i + 1], full.d[i + 2]), lg = lum(ground.d[i], ground.d[i + 1], ground.d[i + 2]);
      ratios.push(cr(lf, lg)); n++; gl += lg;
      for (let k = 0; k < 3; k++){ gs[k] += ground.d[i + k]; fs[k] += full.d[i + k]; }
    }
    if (!n) return null;
    ratios.sort((a, b) => a - b);
    const q = p => +ratios[Math.min(n - 1, Math.floor(n * p))].toFixed(2), hx = a => '#' + a.map(v => Math.round(v / n).toString(16).padStart(2, '0')).join('');
    const out = { n, min: +ratios[0].toFixed(2), p05: q(0.05), p10: q(0.10), p25: q(0.25), median: q(0.5), meanGround: hx(gs), meanFill: hx(fs), meanGroundLum: +(gl / n).toFixed(4),
      under45: +(ratios.filter(v => v < 4.5).length / n).toFixed(3), under3: +(ratios.filter(v => v < 3).length / n).toFixed(3) };
    if (typeof o.fill === 'string' && /^#[0-9a-f]{6}$/i.test(o.fill)) out.nominalVsMeanGround = +cr(hexLum(o.fill), hexLum(out.meanGround)).toFixed(2);
    return out;
  }

  /* the new ground: a deep bill-green field with a quiet tone-on-tone "$" lattice,
     registered through grounds.js's own GROUNDS.register so the studio draws it
     like any other drawn ground (ground:<kind>/<palette>/<seed>) */
  function registerDollars(){
    if (GROUNDS.kinds.includes('dollars')) return;
    GROUNDS.register('dollars', { name: 'Dollar signs', note: 'tone-on-tone $ lattice, like a banknote security print', group: 'pattern',
      draw(g, W, H, P){
        const lg = g.createLinearGradient(0, 0, 0, H); lg.addColorStop(0, P.c1); lg.addColorStop(1, P.c2); g.fillStyle = lg; g.fillRect(0, 0, W, H);
        g.save(); g.fillStyle = P.accent; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = '800 54px "Satoshi", "Arial Black", sans-serif';
        const sx = 98, sy = 74; let j = 0;
        for (let y = -sy; y < H + sy; y += sy, j++) for (let x = -sx; x < W + sx; x += sx){
          g.save(); g.translate(x + (j % 2 ? sx / 2 : 0), y); g.rotate(-0.24); g.fillText('$', 0, 0); g.restore(); }
        g.restore();
        /* a soft light behind the headline, and the corners a little deeper: depth without a second hue */
        const rg = g.createRadialGradient(W / 2, H * 0.36, 0, W / 2, H * 0.36, W * 0.72); rg.addColorStop(0, 'rgba(70,170,120,0.06)'); rg.addColorStop(1, 'rgba(70,170,120,0)'); g.fillStyle = rg; g.fillRect(0, 0, W, H);
        const vg = g.createRadialGradient(W / 2, H * 0.45, W * 0.45, W / 2, H * 0.45, W * 0.95); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.34)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
      } });
  }

  function dump(sc){
    return sc.getObjects().map(o => { const r = box(o), f = o.fill, d = { n: o.name || '', t: o.type, box: [r.left, r.top, r.width, r.height].map(v => Math.round(v)),
      fill: typeof f === 'string' ? f : (f && f.colorStops ? 'grad(' + f.colorStops.map(s => s.color).join('>') + ')' : (f && f.source ? 'pattern' : String(f))) };
      if (o.text){ d.text = o.text.replace(/\n/g, ' / ').slice(0, 40); d.fs = +(o.fontSize * (o.scaleY || 1)).toFixed(1); d.stroke = o.stroke; d.sw = +(o.strokeWidth || 0).toFixed(2); d.sh = o.shadow ? o.shadow.color + ' b' + o.shadow.blur + ' y' + o.shadow.offsetY : null;
        const k = textInkRect(o); d.ink = k && [k.left, k.top, k.width, k.height].map(v => Math.round(v)); }
      return d; });
  }

  /* the subline: off-white, and it fills its panel */
  function fixSubline(sc, opt){
    const S = byName(sc, 'Subline'), P = byName(sc, 'Subline Panel'); if (!S || !P) return { err: 'no subline or panel' };
    const pb = box(P), before = { panel: [pb.left, pb.top, pb.width, pb.height].map(v => Math.round(v)), fsEff: +(S.fontSize * (S.scaleY || 1)).toFixed(1), ink: (k => [k.left, k.top, k.width, k.height].map(v => Math.round(v)))(textInkRect(S)) };
    S.set({ fill: opt.fill, scaleX: 1, scaleY: 1, width: 1000 });
    if (opt.lineHeight) S.set('lineHeight', opt.lineHeight);
    const pad = opt.pad, maxW = pb.width - 2 * pad, maxH = pb.height - 2 * pad;
    let lo = 12, hi = 90;
    for (let i = 0; i < 22; i++){ const mid = (lo + hi) / 2; S.set('fontSize', mid); S.initDimensions(); const k = textInkRect(S); if (k.width <= maxW && k.height <= maxH) lo = mid; else hi = mid; }
    S.set('fontSize', opt.grow === false ? before.fsEff : Math.floor(lo * 2) / 2); S.initDimensions();
    S.set('strokeWidth', 0);
    if (S.shadow) S.set('shadow', new fabric.Shadow({ color: 'rgba(8,6,4,0.72)', blur: 5, offsetX: 0, offsetY: 1 }));
    let k = textInkRect(S);
    if (opt.hug){ const w = Math.round(k.width + 2 * opt.hugPadX), cx = pb.left + pb.width / 2; P.set({ width: w / (P.scaleX || 1) }); P.set('left', P.originX === 'center' ? cx : cx - w / 2); P.setCoords(); P.dirty = true; }
    if (opt.centreV){ const Hd = byName(sc, 'Main Headline'), Bar = byName(sc, 'Bottom Bar'), hk = textInkRect(Hd), foot = hk.top + hk.height, barTop = box(Bar).top, cur = box(P);
      const top = Math.round(foot + (barTop - foot - cur.height) / 2); P.set('top', P.top + (top - cur.top)); P.setCoords(); P.dirty = true; }
    const p2 = box(P);
    S.set({ left: S.left + (p2.left + p2.width / 2) - (k.left + k.width / 2), top: S.top + (p2.top + p2.height / 2) - (k.top + k.height / 2) }); S.setCoords(); S.dirty = true;
    k = textInkRect(S);
    return { before, after: { panel: [p2.left, p2.top, p2.width, p2.height].map(v => Math.round(v)), fs: S.fontSize, lineHeight: S.lineHeight, ink: [k.left, k.top, k.width, k.height].map(v => Math.round(v)),
      padX: Math.round(k.left - p2.left), padY: Math.round(k.top - p2.top), fillW: +(k.width / p2.width).toFixed(2), fillH: +(k.height / p2.height).toFixed(2) } };
  }

  const DARK_SHADOW = () => new fabric.Shadow({ color: 'rgba(8,6,4,0.72)', blur: 16, offsetX: 0, offsetY: 4 });

  function render(cfg){
    const keep = { bg: ez.bg, bgPicked: ez.bgPicked, shade: ez.shade, shadeTone: ez.shadeTone, tag: JSON.parse(JSON.stringify(ez.tag)) };
    const rep = { name: cfg.name };
    if (cfg.ground === 'dollars'){
      registerDollars();
      const P = { c1: cfg.c1, c2: cfg.c2, accent: cfg.glyph, support: cfg.glyph, ink: '#f6f2ea' };
      ez.bg = { type: 'image', src: GROUNDS.src('dollars', P, 1), scrim: 0, blur: 0, grade: { treat: 'raw' } };   // the shape ezGroundSpecs() emits
      ez.bgPicked = true; ez.shade = 0; rep.bg = ez.bg.src;
    } else if (cfg.ground === 'photo'){ ez.bg = null; ez.bgPicked = true; ez.shade = cfg.shade || 0; ez.shadeTone = 'dark'; rep.bg = 'template photo, bgPicked=true, shade=' + ez.shade; }
    if (cfg.tagLook) ez.tag.look = cfg.tagLook;
    const orig = fabric.StaticCanvas.prototype.toDataURL;
    fabric.StaticCanvas.prototype.toDataURL = function(){
      const sc = this;
      try {
        rep.engine = dump(sc);                                   // what the engine drew before any override
        const T = byName(sc, 'Title'), Hd = byName(sc, 'Main Headline');
        if (cfg.type){
          T.set({ fill: cfg.type.title, stroke: '#000000', strokeWidth: 6, paintFirst: 'stroke', shadow: cfg.type.titleShadow === 'none' ? null : DARK_SHADOW() }); T.dirty = true;
          Hd.set({ fill: cfg.type.headline, stroke: '#000000', strokeWidth: 9, paintFirst: 'stroke' }); Hd.dirty = true;
          rep.subline = fixSubline(sc, cfg.subline);
        }
        if (cfg.titlePattern){
          /* the studio's own "Money signs" tile painter (TAGLINE_PATTERNS.money) and its
             anchoring (taglinePattern), in this card's two greens */
          const p = taglinePattern('money', 0.8, true, 150, T.fontSize, { obj: T, res: 2, scale: cfg.titlePattern.scale || 1 });
          p.source = taglinePatternTile('money', p.source.width, { money: cfg.titlePattern.glyph, moneyBase: cfg.titlePattern.base });
          T.set('fill', p); T.dirty = true; rep.titlePattern = { tilePx: p.source.width, glyph: cfg.titlePattern.glyph, base: cfg.titlePattern.base, glyphVsBase: +cr(hexLum(cfg.titlePattern.glyph), hexLum(cfg.titlePattern.base)).toFixed(2) };
        }
        sc.renderAll();
        rep.final = dump(sc);
        rep.contrast = {};
        ['Title', 'Main Headline', 'Subline', 'Phone Number', 'CTA'].forEach(n => { const o = byName(sc, n); if (o) rep.contrast[n] = measure(sc, o); });
      } catch (e){ rep.err = String(e && e.stack || e); }
      return orig.apply(this, arguments);
    };
    let url = null;
    try { url = renderEzCanvas(1080, 'png'); } catch (e){ rep.err = (rep.err || '') + ' render: ' + String(e && e.stack || e); }
    fabric.StaticCanvas.prototype.toDataURL = orig;
    ez.bg = keep.bg; ez.bgPicked = keep.bgPicked; ez.shade = keep.shade; ez.shadeTone = keep.shadeTone; ez.tag = keep.tag;
    return { url, rep };
  }
  window.__ad = { render, hexLum, cr };
})();
