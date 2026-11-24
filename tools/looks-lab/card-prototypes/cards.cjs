// Two home-page cards, repainted at runtime to the owner's notes of 2026-11-11.
// Nothing in the repo is written: the records in assets/showcase/tpl are read, changed in memory, painted.
//   python3 -m http.server 8899            (repo root)
//   CARDS_OUT=/tmp/cards node tools/looks-lab/card-prototypes/cards.cjs
// gold  (stepsFlow-nn01-31): "This CTA is awkwardly spaced and has poor alignment since there's no
//        margin and it's touching the edge of the bar the yellow bar". Measured today: the number's
//        box starts 9px ABOVE the band's top edge, with 69px of empty band under the website line.
//        gold-fixed: one plate width, no sheen, the number and website centred in the band (44 / 47px).
// coins (stepsFlow-cd10-20): "This one doesn't make sense with the colors maybe you do red yellow,
//        green, red orange yellow, or white white green, white white red, white white yellow for the
//        third one", then "Or all solid matching colors". Today its plates are two sage and one white.
//        The colours are set on the FINISHED scene: set in the record, the engine's one-colour pass
//        (rule 95) repaints them (the green third plate came out pink).
//        Round 2, same day: "confetti on #3?", "why are the numbers all different colors random? ...
//        we need consistency", "what about outlines? varying colored outlines? glows? pattern fill
//        behind? ideas". The number boxes are now ONE style on all three steps (steps()); coins-3a/b/c
//        are confetti on the third plate; idea-a to idea-i are the outline, glow, pattern and flat versions.
// boxes.json holds every object's final box for each picture.
const { chromium } = require('playwright'); const fs = require('fs');
const FAB = process.env.FABRIC_JS || '';   // a local fabric.min.js, for a machine that cannot reach the CDN
const OUT = process.env.CARDS_OUT || require('os').tmpdir() + '/card-prototypes';   // never into the repo
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  p.on('pageerror', e => console.log('PAGEERROR', String(e).slice(0, 200)));
  if (FAB) await p.route('**/fabric.min.js', r => r.fulfill({ path: FAB, contentType: 'application/javascript' }));
  await p.goto((process.env.LAB_URL || 'http://localhost:8899/') + 'index.html?theme=light', { waitUntil: 'load' });
  await p.waitForFunction(() => typeof renderThumb === 'function' && typeof SHOWCASE !== 'undefined' && SHOWCASE.byId && Object.keys(SHOWCASE.byId).length > 0, { timeout: 60000 });
  const res = await p.evaluate(async () => {
    const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const lum = h => { const n = parseInt(h.slice(1), 16); return 0.2126 * lin(n >> 16 & 255) + 0.7152 * lin(n >> 8 & 255) + 0.0722 * lin(n & 255); };
    const inkOn = h => lum(h) > 0.32 ? '#101014' : '#ffffff';
    async function paint(id, mut, post){
      const tid = await scRegister(id); const t = TEMPLATES.find(x => x.id === tid);
      if (typeof ensureTplAssets === 'function') await ensureTplAssets(t);
      const c = JSON.parse(JSON.stringify(t)); if (mut) mut(c, n => c.layers.find(l => l.name === n));
      const orig = fabric.StaticCanvas.prototype.toDataURL; let boxes = {};
      fabric.StaticCanvas.prototype.toDataURL = function(){ if (post) post(this, n => this.getObjects().find(o => o.name === n)); this.getObjects().forEach(o => { if (!o.name) return; o.setCoords(); const r = o.getBoundingRect(true, true); boxes[o.name] = [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; }); return orig.apply(this, arguments); };
      let url; try { url = renderThumb(c, 1080, 0.92); } finally { fabric.StaticCanvas.prototype.toDataURL = orig; }
      (window.__boxes = window.__boxes || {})[window.__job] = boxes;
      return url;
    }
    /* GOLD: the steps end clear of the band, one plate width, the number centred in the band */
    const goldFix = (c, L) => {
      c.layers = c.layers.filter(l => !/Sheen$/.test(l.name || ''));
      [1, 2, 3].forEach((i, k) => {
        const card = L('Step Card ' + i), dy = -14 * k, inner = -6;
        card.props.width = 660; card.props.height = 126; card.props.top += dy;
        ['Step Num Box ', 'Step Num ', 'Step Lab ', 'Step Micro '].forEach(n => { const l = L(n + i); if (l) l.props.top += dy + inner; });
      });
      const plate = L('Phone Plate'); plate.props.top = 892; plate.props.height = 190;
      const num = L('Phone Number'), cue = L('Phone Cue'), web = L('Website');
      const d = 962 - num.props.top; num.props.top = 962; if (cue) cue.props.top += d; if (web) web.props.top = 1014;
    };
    const goldPost = (sc, O) => {
      const bb = o => { o.setCoords(); return o.getBoundingRect(true, true); };
      const P = bb(O('Phone Plate')), num = O('Phone Number'), web = O('Website'), cue = O('Phone Cue');
      const N = bb(num), Wb = web ? bb(web) : null, bottom = Math.min(1080, P.top + P.height);
      const groupTop = N.top, groupBot = Wb ? Wb.top + Wb.height : N.top + N.height;
      const d = Math.round((P.top + (bottom - P.top - (groupBot - groupTop)) / 2) - groupTop);
      [num, web, cue].forEach(o => { if (o) o.set('top', o.top + d); });
    };
    /* COINS: the three step plates in the owner's suggested colours; ink follows the plate */
    const steps = cols => (sc, O) => {
      const allDark = cols.every(c => inkOn(c) === '#ffffff');                 // every plate dark: the boxes go white; otherwise navy, on all three
      const box = allDark ? '#ffffff' : '#223249', num = allDark ? '#223249' : '#ffffff';
      cols.forEach((col, k) => {
        const i = k + 1, ink = inkOn(col), set = (n, f) => { const o = O(n + i); if (o) o.set('fill', f); };
        set('Step Card ', col); set('Step Lab ', ink); set('Step Micro ', ink); set('Step Num Box ', box); set('Step Num ', num);
        const b = O('Step Num Box ' + i); if (b) b.set({ stroke: allDark ? null : '#ffffff', strokeWidth: allDark ? 0 : 3 });   // a white keyline so the navy box reads on any plate
      });
    };
    const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const confetti = (cols, mode, n, seed) => (sc, O) => {
      steps(cols)(sc, O);
      const card = O('Step Card 3'); card.setCoords(); const B = card.getBoundingRect(true, true), at = sc.getObjects().indexOf(card) + 1, r = rng(seed);
      const pal = mode === 'party' ? ['#ff4d6d', '#ffd60a', '#4cc9f0', '#ffffff', '#ff9f1c', '#b388ff'] : ['#ffffff', '#f6c21c', '#f6c21c', '#d9f2e2'];
      for (let i = 0; i < n; i++){
        let x, y;
        if (mode === 'inside'){ x = B.left + B.width * (0.62 + 0.31 * r()); y = B.top + 16 + (B.height - 32) * r(); }
        else { const a = (-100 + 200 * r()) * Math.PI / 180, d = 30 + 250 * Math.pow(r(), 0.7), ox = B.left + B.width - 150, oy = B.top + B.height / 2; x = ox + Math.cos(a) * d * 0.9; y = oy + Math.sin(a) * d * 0.62; if (mode === 'party' && r() < 0.35){ x = B.left + B.width * (0.45 + 0.5 * r()); y = B.top - 40 + (B.height + 80) * r(); } }
        if (x > 1052 || x < 24) continue;
        const k = r(), fill = pal[Math.floor(r() * pal.length)], ang = 360 * r(), op = 0.78 + 0.22 * r();
        const o = k < 0.62 ? new fabric.Rect({ left: x, top: y, width: 12 + 12 * r(), height: 5 + 4 * r(), rx: 1.5, ry: 1.5, fill, angle: ang, opacity: op, originX: 'center', originY: 'center' })
          : k < 0.86 ? new fabric.Circle({ left: x, top: y, radius: 3.5 + 3 * r(), fill, opacity: op, originX: 'center', originY: 'center' })
          : new fabric.Triangle({ left: x, top: y, width: 13 + 6 * r(), height: 12 + 6 * r(), fill, angle: ang, opacity: op, originX: 'center', originY: 'center' });
        o.name = 'Confetti'; sc.insertAt(o, at, false);
      }
    };
    const dollars = (base, glyph, size) => { const cv = document.createElement('canvas'); cv.width = 84; cv.height = 64; const g = cv.getContext('2d'); g.fillStyle = base; g.fillRect(0, 0, 84, 64); g.fillStyle = glyph; g.font = '800 ' + (size || 30) + 'px "Satoshi","Arial Black",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; [[21, 16], [63, 48]].forEach(([x, y]) => { g.save(); g.translate(x, y); g.rotate(-0.22); g.fillText('$', 0, 0); g.restore(); }); return new fabric.Pattern({ source: cv, repeat: 'repeat' }); };
    const idea = spec => (sc, O) => {
      steps(spec.cols)(sc, O);
      [1, 2, 3].forEach((i, k) => { const c = O('Step Card ' + i); if (!c) return;
        if (spec.stroke) c.set({ stroke: spec.stroke[k] || spec.stroke[0], strokeWidth: spec.sw || 7 });
        if (spec.glow && spec.glow[k]) c.set('shadow', new fabric.Shadow({ color: spec.glow[k], blur: spec.blur || 42, offsetX: 0, offsetY: 0 }));
        if (spec.pattern && spec.pattern[k]) c.set('fill', dollars(...spec.pattern[k]));
        const sheen = O('Step Card ' + i + ' Sheen'); if (sheen && spec.noSheen !== false) sheen.set('opacity', 0);
        if (spec.noBox){ const b = O('Step Num Box ' + i), n = O('Step Num ' + i); if (b) b.set({ opacity: 0 }); if (n) n.set({ fill: spec.noBox, fontWeight: 800 }); }
      });
      if (spec.panel){ const a = O('Step Card 1'), z = O('Step Card 3'); a.setCoords(); z.setCoords(); const A = a.getBoundingRect(true, true), Z = z.getBoundingRect(true, true), m = 26;
        const p = new fabric.Rect({ left: A.left - m, top: A.top - m, width: A.width + 2 * m, height: Z.top + Z.height - A.top + 2 * m, rx: 34, ry: 34, fill: dollars(...spec.panel), stroke: 'rgba(255,255,255,.28)', strokeWidth: 2, name: 'Step Panel' });
        sc.insertAt(p, sc.getObjects().indexOf(a), false); }
    };
    const GOLD = '#f0b90b';
    const R = '#c9283b', O = '#ef8a1f', Y = '#f6c21c', G = '#1f9d55', W = '#f7f6f3', N = '#223249';
    const jobs = {
      'gold-today': ['stepsFlow-nn01-31', null], 'gold-fixed': ['stepsFlow-nn01-31', goldFix, goldPost],
      'coins-today': ['stepsFlow-cd10-20', null],
      'coins-1-red-yellow-green': ['stepsFlow-cd10-20', null, steps([R, Y, G])],
      'coins-2-red-orange-yellow': ['stepsFlow-cd10-20', null, steps([R, O, Y])],
      'coins-3-white-white-green': ['stepsFlow-cd10-20', null, steps([W, W, G])],
      'coins-4-white-white-red': ['stepsFlow-cd10-20', null, steps([W, W, R])],
      'coins-5-white-white-yellow': ['stepsFlow-cd10-20', null, steps([W, W, Y])],
      'idea-a-outline-gold': ['stepsFlow-cd10-20', null, idea({ cols: ['#f7f6f3', '#f7f6f3', '#f7f6f3'], stroke: [GOLD], sw: 7 })],
      'idea-b-outlines-red-orange-yellow': ['stepsFlow-cd10-20', null, idea({ cols: ['#f7f6f3', '#f7f6f3', '#f7f6f3'], stroke: ['#c9283b', '#ef8a1f', '#f6c21c'], sw: 8 })],
      'idea-c-outlines-red-yellow-green': ['stepsFlow-cd10-20', null, idea({ cols: ['#f7f6f3', '#f7f6f3', '#f7f6f3'], stroke: ['#c9283b', '#f6c21c', '#1f9d55'], sw: 8 })],
      'idea-d-glow-on-paid': ['stepsFlow-cd10-20', null, idea({ cols: ['#f7f6f3', '#f7f6f3', '#1f9d55'], glow: [null, null, 'rgba(60,235,135,.95)'], blur: 46 })],
      'idea-e-gold-glow-all': ['stepsFlow-cd10-20', null, idea({ cols: ['#f7f6f3', '#f7f6f3', '#f7f6f3'], glow: ['rgba(255,196,40,.9)', 'rgba(255,196,40,.9)', 'rgba(255,196,40,.9)'], blur: 34 })],
      'idea-f-pattern-in-paid': ['stepsFlow-cd10-20', null, idea({ cols: ['#f7f6f3', '#f7f6f3', '#1f9d55'], pattern: [null, null, ['#1f9d55', '#2bb467', 30]] })],
      'idea-g-pattern-panel-behind': ['stepsFlow-cd10-20', null, idea({ cols: ['#f7f6f3', '#f7f6f3', '#f7f6f3'], panel: ['rgba(24,36,56,.86)', 'rgba(255,255,255,.07)', 30] })],
      'idea-h-confetti': ['stepsFlow-cd10-20', null, confetti(['#f7f6f3', '#f7f6f3', '#1f9d55'], 'inside', 34, 7)],
      'idea-i-flat-navy-gold-numbers': ['stepsFlow-cd10-20', null, idea({ cols: ['#223249', '#223249', '#223249'], noBox: '#f6c21c' })],
      'coins-3a-confetti-inside': ['stepsFlow-cd10-20', null, confetti([W, W, G], 'inside', 30, 7)],
      'coins-3b-confetti-burst': ['stepsFlow-cd10-20', null, confetti([W, W, G], 'burst', 60, 11)],
      'coins-3c-confetti-party': ['stepsFlow-cd10-20', null, confetti([W, W, G], 'party', 90, 5)],
      'coins-6-all-navy': ['stepsFlow-cd10-20', null, steps([N, N, N])],
      'coins-7-all-white': ['stepsFlow-cd10-20', null, steps([W, W, W])],
    };
    const out = {};
    for (const [k, [id, mut, post]] of Object.entries(jobs)){ window.__job = k; try { out[k] = await paint(id, mut, post); } catch (e){ out[k] = 'ERR ' + e; } }
    out.__boxes = window.__boxes;
    return out;
  });
  fs.mkdirSync(OUT, { recursive: true });
  const boxes = res.__boxes; delete res.__boxes; fs.writeFileSync(OUT + '/boxes.json', JSON.stringify(boxes, null, 1));
  for (const k of ['gold-today', 'gold-fixed']){ const B = boxes[k]; if (!B) continue; const P = B['Phone Plate'], N = B['Phone Number'], W = B['Website'], C3 = B['Step Card 3'], C2 = B['Step Card 2'], C1 = B['Step Card 1'];
    console.log(k, 'plate', P, 'number', N, 'website', W, '| card gaps', C2[1] - (C1[1] + C1[3]), C3[1] - (C2[1] + C2[3]), 'card3->plate', P[1] - (C3[1] + C3[3]), '| plate top->number', N[1] - P[1], 'number->website', W ? W[1] - (N[1] + N[3]) : null, 'website->plate bottom', W ? (P[1] + P[3]) - (W[1] + W[3]) : null, 'card widths', C1[2], C2[2], C3[2]); }
  for (const [k, v] of Object.entries(res)){ if (String(v).startsWith('ERR')) console.log(k, v); else { fs.writeFileSync(OUT + '/' + k + '.jpg', Buffer.from(v.split(',')[1], 'base64')); console.log('ok', k); } }
  await b.close();
})();
