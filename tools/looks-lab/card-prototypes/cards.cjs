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
    const steps = cols => (sc, O) => cols.forEach((col, k) => {
      const i = k + 1, ink = inkOn(col), set = (n, f) => { const o = O(n + i); if (o) o.set('fill', f); };
      set('Step Card ', col); set('Step Lab ', ink); set('Step Micro ', ink);
      set('Step Num Box ', ink === '#ffffff' ? '#ffffff' : '#223249'); set('Step Num ', ink === '#ffffff' ? '#101014' : '#ffffff');
    });
    const R = '#c9283b', O = '#ef8a1f', Y = '#f6c21c', G = '#1f9d55', W = '#f7f6f3', N = '#223249';
    const jobs = {
      'gold-today': ['stepsFlow-nn01-31', null], 'gold-fixed': ['stepsFlow-nn01-31', goldFix, goldPost],
      'coins-today': ['stepsFlow-cd10-20', null],
      'coins-1-red-yellow-green': ['stepsFlow-cd10-20', null, steps([R, Y, G])],
      'coins-2-red-orange-yellow': ['stepsFlow-cd10-20', null, steps([R, O, Y])],
      'coins-3-white-white-green': ['stepsFlow-cd10-20', null, steps([W, W, G])],
      'coins-4-white-white-red': ['stepsFlow-cd10-20', null, steps([W, W, R])],
      'coins-5-white-white-yellow': ['stepsFlow-cd10-20', null, steps([W, W, Y])],
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
