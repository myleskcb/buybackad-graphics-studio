#!/usr/bin/env node
/* How the video maker's phones move and cast shadows, measured off the engine
   itself (motion/engine.js), for every entrance, flat and turned:

     blur    an exported frame draws its phones at several moments of the
             shutter and averages them. Where a corner jumps far between two
             moments, a fast spin shows as a fan of separate copies instead of
             a blur (a fixed 8 moments did, on frame 0, the thumbnail). Each
             copy weighs 1/n of the frame, so what shows is the jump times that
             weight: the worst over the first seconds, in px at 1080, must stay
             under 1 (fixed 8 measured up to 4.9).
     shadow  a phone's shadow softens and grows as it rises. Between two
             heights a hundredth apart it may change no more than 5 times the
             usual step (picking one of three blurs jumped 22 times it).
     turn    one phone of every model turned all the way round (every 2
             degrees upright, every 6 lying on its side): side-on it shows an
             edge at least 0.8 of its model's depth (it was a 1 px hairline),
             no angle leaves a see-through gap inside it, and no step of the
             turn changes it more than 2.5 times the usual step.
     flat    coming flat over its last 2 degrees in steps of 0.05, back and
             screen, no step may change more than 60 pixels visibly (by over
             16 levels): an 18 Pro's dark edge blinked out at 0.86 degrees,
             4,600 to 8,200 pixels in one step, where the slab handed over to
             the bare photograph, and its side buttons jumped edges at 0.

   The phones' shape, depth and buttons against the photographs are
   scripts/audit_phone_views.py's.

   --finish photo   every test on the photo-real finish (rule 123) instead of the standard.
   --poses a,b      the angles the blur test takes (flat and edge_left unless given).

   usage:  python3 -m http.server 8765   (repo root)   then
           node scripts/motion_phone_check.mjs [--port 8765] [--entries fly_spin,deal] [--finish photo] [--poses flat,edge_left]
   Uses puppeteer-core with CHROME=/path/to/chrome, else playwright's chromium.
   Exits 1 on a failure. */
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const PORT = +arg('--port', 8765), ONLY = arg('--entries', ''), FINISH = arg('--finish', 'standard');
const POSES = arg('--poses', 'flat,edge_left').split(',');
const BLUR_BAR = 1, SHADOW_BAR = 5, EDGE_BAR = .8, HOLE_BAR = 2, TURN_BAR = 2.5, FLAT_BAR = 60;

let browser;
try {
  const { default: puppeteer } = await import('puppeteer-core');
  browser = await puppeteer.launch({ executablePath: process.env.CHROME, headless: 'new', args: ['--no-sandbox'] });
} catch (e) {
  const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
  browser = await chromium.launch();
}
const page = await browser.newPage();
page.on('pageerror', e => { console.error('page error:', e.message); process.exitCode = 1; });
await page.goto(`http://localhost:${PORT}/motion/audit-sweep.html`);
await page.waitForFunction(() => window.ready);

const res = await page.evaluate(async ([ONLY, FINISH, POSES]) => {
  const { Ad, Phone, drawPhone, loadPhones, designOf, EXPORT_QUALITY } = await import('./engine.js');
  const { DEFAULT_STYLE, OPTIONS } = await import('./catalog.js');
  const { phones, index } = await loadPhones('./phones/');
  const ids = ['17-pro-cosmic-orange', '18-pro-burgundy', '18-pro-glacier'];
  const entries = ONLY ? ONLY.split(',') : OPTIONS.entry, dt = 1 / 30, blur = [];
  // a Phone made here takes the finish being checked
  const mk = (img, meta, ph) => Object.assign(new Phone(img, meta, ph), { finish: FINISH });
  for (const entry of entries) for (const pose of POSES) {
    const st = { ...DEFAULT_STYLE, phone_finish: FINISH, phones: ids, entry, pose, arrangement: 'fan', seed: 3, hook: 'none', headline: '', number: '', camera: 'none', shake: 0 };
    const ad = new Ad(st, { phones }, 1080, 1080);
    let worst = { copy: 0, t: 0, gap: 0, n: 1 };
    for (let t = 0; t <= Math.min(ad.tl.revealEnd + .1, 3); t += dt) {
      const n = ad._subsFor(t, dt, EXPORT_QUALITY), D = ad._shutterTravel(t, dt);
      const gap = n > 1 ? D / (n - 1) : D, copy = n > 1 ? gap / n : 0;
      if (copy > worst.copy) worst = { copy, t, gap, n };
    }
    blur.push({ entry, pose, copy: +worst.copy.toFixed(2), at: +worst.t.toFixed(2), gap: +worst.gap.toFixed(1), moments: worst.n });
  }
  // the shadow, over the height a phone rises to
  const W = 600, c = document.createElement('canvas'); c.width = W; c.height = W;
  const x = c.getContext('2d', { willReadFrequently: true }), shadow = [];
  const luma = () => { const d = x.getImageData(0, 0, W, W).data, o = new Float32Array(W * W); for (let i = 0; i < W * W; i++) o[i] = .2126 * d[i * 4] + .7152 * d[i * 4 + 1] + .0722 * d[i * 4 + 2]; return o; };
  for (const id of ['17-pro-cosmic-orange', '15-plus-pink']) for (const [view, flip] of [['flat', Math.PI], ['turned', Math.PI - .6]]) {
    const p = mk(phones[id].img, index.find(m => m.id === id), 360), steps = [];
    let prev = null;
    for (let k = 0; k <= 100; k++) {
      x.fillStyle = '#d8bb8c'; x.fillRect(0, 0, W, W);
      drawPhone(x, p, W / 2, W / 2, 1, 12, flip, k / 100, 1, W, null);
      const L = luma();
      if (prev) { let s = 0; for (let i = 0; i < L.length; i++) s += Math.abs(L[i] - prev[i]); steps.push(s / L.length); }
      prev = L;
    }
    const med = [...steps].sort((a, b) => a - b)[steps.length >> 1], top = Math.max(...steps);
    shadow.push({ phone: id, view, ratio: +(top / med).toFixed(1), at: (steps.indexOf(top) + 1) / 100 });
  }
  // the turn: one phone of every model, all the way round, upright and on its side
  const T = 320, tc = document.createElement('canvas'); tc.width = T; tc.height = T;
  const tx = tc.getContext('2d', { willReadFrequently: true }), turn = [], seen = new Set();
  for (const m of index) {
    if (seen.has(m.model)) continue;
    seen.add(m.model);
    const p = mk(phones[m.id].img, m, 240), depth = designOf(m.model).depth * p.w;
    for (const [rot, step] of [[0, 2], [90, 6]]) {
      let prev = null, edge = Infinity, hole = 0; const steps = [];
      for (let d = 0; d < 360; d += step) {
        tx.clearRect(0, 0, T, T);
        drawPhone(tx, p, T / 2, T / 2, 1, rot, d * Math.PI / 180, 0, 1, T, null, true);
        const px = tx.getImageData(0, 0, T, T).data, body = new Uint8Array(T * T);
        for (let i = 0; i < T * T; i++) body[i] = px[i * 4 + 3] > 200;
        // a gap is a clear pixel the body surrounds: flood the outside from the border
        const out = new Uint8Array(T * T), st = [];
        for (let i = 0; i < T; i++) for (const j of [i, (T - 1) * T + i, i * T, i * T + T - 1]) if (!body[j] && !out[j]) { out[j] = 1; st.push(j); }
        while (st.length) { const j = st.pop(), jx = j % T;
          for (const k of [jx > 0 ? j - 1 : -1, jx < T - 1 ? j + 1 : -1, j - T, j + T]) if (k >= 0 && k < T * T && !body[k] && !out[k]) { out[k] = 1; st.push(k); } }
        let h = 0; for (let i = 0; i < T * T; i++) if (!body[i] && !out[i]) h++;
        hole = Math.max(hole, h);
        if (d % 180 === 90) {                        // side-on: the edge's width across the middle
          let lo = T, hi = -1;
          for (let i = 0; i < T; i++) { const j = rot ? i * T + T / 2 : (T / 2) * T + i; if (body[j]) { lo = Math.min(lo, i); hi = Math.max(hi, i); } }
          edge = Math.min(edge, (hi - lo + 1) / depth);
        }
        if (prev) { let sum = 0; for (let i = 0; i < px.length; i++) sum += Math.abs(px[i] - prev[i]); steps.push(sum); }
        prev = px;
      }
      const med = [...steps].sort((a, b) => a - b)[steps.length >> 1], top = Math.max(...steps);
      turn.push({ phone: m.id, rot, edge: +edge.toFixed(2), hole, step: +(top / med).toFixed(1), at: (steps.indexOf(top) + 1) * step });
    }
  }
  // coming flat, back and screen, one phone of every model: the last 2 degrees in steps of 0.05
  const flat = [], F = 560, fc = document.createElement('canvas'); fc.width = F; fc.height = F;
  const fx = fc.getContext('2d', { willReadFrequently: true });
  for (const m of index) {
    if (flat.some(r => r.model === m.model)) continue;
    const p = mk(phones[m.id].img, m, 480);
    for (const [face, base] of [['back', Math.PI], ['screen', 0]]) {
      let prev = null; const steps = [];
      for (let k = 40; k >= 0; k--) {
        fx.fillStyle = '#d9c6a5'; fx.fillRect(0, 0, F, F);
        drawPhone(fx, p, F / 2, F / 2, 1, 0, base + k * .05 * Math.PI / 180, 0, 1, F, null, true);
        const px = fx.getImageData(0, 0, F, F).data;
        if (prev) {
          let t = 0;
          for (let i = 0; i < px.length; i += 4) if (Math.max(Math.abs(px[i] - prev[i]), Math.abs(px[i + 1] - prev[i + 1]), Math.abs(px[i + 2] - prev[i + 2])) > 16) t++;
          steps.push([t, (k + 1) * .05]);
        }
        prev = px;
      }
      const top = steps.reduce((a, q) => q[0] > a[0] ? q : a);
      flat.push({ phone: m.id, model: m.model, face, ratio: top[0], at: +top[1].toFixed(2) });
    }
  }
  return { blur, shadow, turn, flat };
}, [ONLY, FINISH, POSES]);
console.log(`finish ${FINISH}`);

let fails = 0;
console.log(`blur: worst copy (px at 1080, bar ${BLUR_BAR})`);
for (const r of res.blur) {
  const bad = r.copy > BLUR_BAR; fails += bad;
  console.log(`  ${r.entry.padEnd(10)} ${r.pose.padEnd(9)} ${r.copy.toFixed(2).padStart(5)}  at ${r.at.toFixed(2)}s  ${r.gap.toFixed(1).padStart(5)} px apart, ${String(r.moments).padStart(2)} moments${bad ? '   FAIL' : ''}`);
}
console.log(`shadow: largest step against the usual (bar ${SHADOW_BAR})`);
for (const r of res.shadow) {
  const bad = r.ratio > SHADOW_BAR; fails += bad;
  console.log(`  ${r.phone.padEnd(22)} ${r.view.padEnd(7)} ${r.ratio.toFixed(1).padStart(5)}  at height ${r.at.toFixed(2)}${bad ? '   FAIL' : ''}`);
}
console.log(`turn: edge side-on against the model's depth (bar ${EDGE_BAR}), gap px (bar ${HOLE_BAR}), largest step (bar ${TURN_BAR})`);
for (const r of res.turn) {
  const bad = r.edge < EDGE_BAR || r.hole > HOLE_BAR || r.step > TURN_BAR; fails += bad;
  console.log(`  ${r.phone.padEnd(24)} ${(r.rot ? 'on its side' : 'upright').padEnd(11)} edge ${r.edge.toFixed(2)}  gap ${String(r.hole).padStart(3)}  step ${r.step.toFixed(1).padStart(4)} at ${String(r.at).padStart(3)}°${bad ? '   FAIL' : ''}`);
}
console.log(`flat: coming flat, the most pixels one 0.05 degree step changes visibly (bar ${FLAT_BAR})`);
for (const r of res.flat) {
  const bad = r.ratio > FLAT_BAR; fails += bad;
  console.log(`  ${r.phone.padEnd(24)} ${r.face.padEnd(6)} ${String(r.ratio).padStart(5)} px  from ${r.at.toFixed(2)}°${bad ? '   FAIL' : ''}`);
}
console.log(`\n${fails ? fails + ' failing' : 'all pass'}`);
await browser.close();
process.exit(fails ? 1 : process.exitCode || 0);
