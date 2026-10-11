#!/usr/bin/env node
/* Whether the phones' move once landed (motion/engine.js phoneIdle: spin, pulse,
   breathe, float) can be seen whatever else the ad is set to, including what is
   picked by hand. Owner, 2026-10-11: "we wanna make sure there's no overlapping
   effects that may contradict the breathing in case we were to manually configure
   the effects ... it says breathing, but doesn't breathe it appears broken".

   For each move and each value of every axis that moves something on screen
   (urgency, camera, overlay, phone angle, accents' move, live background, depth,
   ending, grade, decor, the flags), the look is set by hand to that value and that
   move (both locked, through harmonise, as the maker's panel does), then drawn
   twice over the time the phones move: once as set, once with the phones still.

     signal  the most the move changes the phones' box: the mean difference of its
             shapes (luma at a quarter size less its local mean, so film grain and a
             light sweeping over do not count, only things that move) between the
             two drawings at the same moment, at its largest
     noise   what everything else moves in that box in half a second (the still
             drawing against itself 0.5 s earlier), 90th percentile
     seen    signal / noise. A move is drowned when everything else changes the
             phones' box as much as the move does: seen under SEEN_BAR fails.
     room    how much of its rise or swell the room round the words and the number
             leaves the move (Ad._idleRoom): under ROOM_BAR fails, a move too small
             to see (a float with no room to rise did nothing at all). Not for a
             spin: room sets only its bob, the turn is whole whatever the room

   Both are locked, so the clash rules (engine.js IDLE_CLASHES, settleIdleClashes)
   keep the move and what would drown it gives way; the row says what did. A
   failure names the value; the fix is a rule there, never a lower bar.

   usage:  python3 -m http.server 8765   (repo root)   then
           node scripts/motion_idle_audit.mjs [--port 8765] [--moves breathe,pulse] [--axes urgency,camera] [--size 360]
   Uses puppeteer-core with CHROME=/path/to/chrome, else playwright's chromium.
   Exits 1 on a failure. */
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const PORT = +arg('--port', 8765), SIZE = +arg('--size', 360);
const MOVES = arg('--moves', 'breathe,pulse,spin,float').split(','), AXES = arg('--axes', '');
const SEEN_BAR = 1.5, ROOM_BAR = .5;

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

const rows = await page.evaluate(async ([MOVES, AXES, SIZE]) => {
  const E = await import('./engine.js');
  const { DEFAULT_STYLE, CLASSIC, OPTIONS } = await import('./catalog.js');
  const a = await E.loadPhones('./phones/');
  const idx = {}; a.index.forEach(m => idx[m.id] = m);
  // two looks: the owner's square ad (phones under the words, the number below) and a story
  const BASES = [
    { name: 'square', st: { aspect: '1:1', vibe: 'titanium', arrangement: 'lineup', text_pos: 'top-left' } },
    { name: 'story', st: { aspect: '9:16', vibe: 'none', palette: 'steel', background: 'radial', arrangement: 'showcase', text_pos: 'top-center' } },
  ];
  const CALM = { urgency: 'none', overlay: 'none', camera: 'still', pose: 'flat', accents: 0, depth: 'none', outro: 'none', grade: 'none',
    decor: [], board: 'none', shake: 0, flash: false, shine: false, rgb_hit: false, speed_lines: false, sparkles: false, grain: false, duration: 6 };
  const uniq = xs => [...new Set(xs)];
  const tests = [['(calm)', {}]];
  const axis = (k, vals, extra = {}) => { if (!AXES || AXES.split(',').includes(k)) for (const v of uniq(vals)) tests.push([`${k}=${v}`, { [k]: v, ...extra }]); };
  axis('urgency', OPTIONS.urgency); axis('camera', OPTIONS.camera); axis('overlay', OPTIONS.overlay);
  axis('pose', OPTIONS.pose); axis('accent_idle', OPTIONS.accent_idle, { accents: 2 });
  axis('background', ['sunburst', 'aurora', 'drift']); axis('depth', OPTIONS.depth); axis('outro', OPTIONS.outro); axis('grade', OPTIONS.grade);
  if (!AXES || AXES.split(',').includes('decor')) for (const d of ['starburst', 'neon_arrow', 'spray_halo', 'pinstripe', 'awning']) tests.push([`decor=${d}`, { decor: [d] }]);
  if (!AXES || AXES.split(',').includes('flags')) for (const f of ['flash', 'shine', 'rgb_hit', 'speed_lines', 'sparkles', 'grain']) tests.push([`${f}=on`, { [f]: true }]);
  if (!AXES || AXES.split(',').includes('shake')) tests.push(['shake=2', { shake: 2 }]);

  // the box's shapes: luma a quarter the size (film grain, even sliding grain, averages out)
  // less its mean over 13 cells (light that sweeps or glows over the box shifts both alike),
  // so what is left is edges that move
  const B = 4;
  const luma = (c, box) => {
    const [x0, y0, x1, y1] = box, w = x1 - x0, h = y1 - y0, d = c.getContext('2d', { willReadFrequently: true }).getImageData(x0, y0, w, h).data;
    const hw = Math.floor(w / B), hh = Math.floor(h / B), L = new Float32Array(hw * hh);
    for (let y = 0; y < hh; y++) for (let x = 0; x < hw; x++) {
      let s = 0;
      for (let dy = 0; dy < B; dy++) for (let dx = 0; dx < B; dx++) { const i = ((B * y + dy) * w + B * x + dx) * 4; s += .2126 * d[i] + .7152 * d[i + 1] + .0722 * d[i + 2]; }
      L[y * hw + x] = s / (B * B);
    }
    const I = new Float64Array((hw + 1) * (hh + 1));
    for (let y = 0; y < hh; y++) for (let x = 0, row = 0; x < hw; x++) { row += L[y * hw + x]; I[(y + 1) * (hw + 1) + x + 1] = I[y * (hw + 1) + x + 1] + row; }
    const R = 6, o = new Float32Array(hw * hh);
    for (let y = 0; y < hh; y++) for (let x = 0; x < hw; x++) {
      const a0 = Math.max(0, x - R), b0 = Math.max(0, y - R), a1 = Math.min(hw, x + R + 1), b1 = Math.min(hh, y + R + 1);
      const m = (I[b1 * (hw + 1) + a1] - I[b0 * (hw + 1) + a1] - I[b1 * (hw + 1) + a0] + I[b0 * (hw + 1) + a0]) / ((a1 - a0) * (b1 - b0));
      o[y * hw + x] = L[y * hw + x] - m;
    }
    return o;
  };
  const diff = (p, q) => { let s = 0; for (let i = 0; i < p.length; i++) s += Math.abs(p[i] - q[i]); return s / p.length; };
  const out = [];
  for (const base of BASES) {
    const [W0, H0] = E.ASPECTS[base.st.aspect], k = SIZE / Math.max(W0, H0), W = Math.round(W0 * k), H = Math.round(H0 * k);
    const seed0 = { ...DEFAULT_STYLE, ...CLASSIC, phones: ['18-pro-max-burgundy', '17-pro-cosmic-orange', '18-pro-glacier'], headline: 'We Buy Phones', number: '(562) 999-4994', seed: 7 };
    for (const move of MOVES) for (const [name, set] of tests) {
      const locked = new Set(['phones', 'headline', 'number', 'aspect', 'duration', 'phone_idle', ...Object.keys(base.st), ...Object.keys(CALM), ...Object.keys(set)]);
      let st = E.harmonise(E.randomize({ ...seed0, ...base.st, ...CALM, ...set, phone_idle: move }, 7, locked, [], true), locked, idx);
      await E.loadFonts(E.fontsFor(st));
      const adM = new E.Ad({ ...st }, { phones: a.phones }, W, H);
      const adS = new E.Ad({ ...st, phone_idle: 'still' }, { phones: a.phones }, W, H);
      const row = { look: base.name, move, test: name, kept: adM.st.phone_idle, idleK: +(adM.idleMove.k).toFixed(2) };
      // what harmonise changed of what was asked
      const changed = Object.keys(set).filter(x => JSON.stringify(adM.st[x]) !== JSON.stringify(set[x]));
      if (changed.length) row.gaveWay = changed.map(x => `${x}->${JSON.stringify(adM.st[x])}`).join(' ');
      if (adM.tl.idle == null || adM.st.phone_idle !== move) { row.signal = 0; row.noise = 0; row.seen = 0; out.push(row); continue; }
      // the phones' box, at the camera's furthest push, with room for the move
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const p of adM.phones) { const r = .62 * Math.hypot(p.w, p.h) * p.size; x0 = Math.min(x0, p.home[0] - r); x1 = Math.max(x1, p.home[0] + r); y0 = Math.min(y0, p.home[1] - r); y1 = Math.max(y1, p.home[1] + r); }
      const box = [Math.max(0, Math.floor(x0)), Math.max(0, Math.floor(y0)), Math.min(W, Math.ceil(x1)), Math.min(H, Math.ceil(y1))];
      const cM = document.createElement('canvas'), cS = document.createElement('canvas'); cM.width = cS.width = W; cM.height = cS.height = H;
      const end = (adM.tOutro ?? st.duration) - .05, ts = [];
      for (let t = adM.tl.idle; t <= end; t += 1 / 15) ts.push(t);
      const S = [], sig = [];
      for (const t of ts) {
        adM.still = null; adS.still = null;
        adM.frame(cM.getContext('2d'), t, { subsFly: 1, subsMove: 1 }, 1 / 30); adS.frame(cS.getContext('2d'), t, { subsFly: 1, subsMove: 1 }, 1 / 30);
        const m = luma(cM, box), s = luma(cS, box); S.push(s); sig.push(diff(m, s));
      }
      const lag = 7, noise = [];          // half a second at 15 a second
      for (let i = lag; i < S.length; i++) noise.push(diff(S[i], S[i - lag]));
      noise.sort((p, q) => p - q);
      row.signal = +Math.max(0, ...sig).toFixed(2);
      row.noise = +(noise.length ? noise[Math.floor(noise.length * .9)] : 0).toFixed(2);
      row.seen = +(row.signal / Math.max(.05, row.noise)).toFixed(1);
      out.push(row);
    }
  }
  return out;
}, [MOVES, AXES, SIZE]);

const fails = r => r.seen < SEEN_BAR || (r.move !== 'spin' && r.idleK < ROOM_BAR);
const bad = rows.filter(fails);
for (const r of rows) console.log(`${fails(r) ? 'FAIL' : '    '} ${r.look.padEnd(6)} ${r.move.padEnd(7)} ${r.test.padEnd(26)} seen ${String(r.seen).padStart(5)}  signal ${String(r.signal).padStart(5)}  noise ${String(r.noise).padStart(5)}  room ${r.idleK}${r.kept !== r.move ? '  move became ' + r.kept : ''}${r.gaveWay ? '  gave way: ' + r.gaveWay : ''}`);
console.log(bad.length ? `\n${bad.length} of ${rows.length} fail (seen under ${SEEN_BAR} or room under ${ROOM_BAR})` : `\nall ${rows.length} pass`);
if (bad.length) process.exitCode = 1;
await browser.close();
