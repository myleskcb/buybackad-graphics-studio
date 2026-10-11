#!/usr/bin/env node
/* One light: every ground the phones stand on is lit by the light that casts their shadows.

   The video maker lights its phones from one key light, high on the left: the shadows
   fall to the lower right, a turning back catches the light from the left, the rim is
   brightest toward it (DESIGN-LAW rules 114 and 124). A ground drawn as a lit surface
   has to agree, or the picture shows two suns. The owner, 2026-10-11, of a Titanium
   ad on Brushed metal: "the shading around the corners because its dark and then light
   around the side ... not actually how shadows work".

   Every ground the maker offers (catalog.js's backgrounds, the themes' grounds, the
   candidates and the approved fresh grounds; the studio's scenes are the same
   painters, photo-grounds.js) is drawn as the maker draws it (Ad.bg: the painter and
   the stage vignette) in 1:1 and 9:16, with the palettes its themes give it and two of
   every tone, and its light is read off the pixels in CIE L*, block by block (18
   across), so the grain and the pattern average out and only the light is left:

     crossed  the corners, three blocks a side each, one diagonal against the other:
              (TR + BL - TL - BR) / 2. Any one light falling off across a wall, any
              pool of light, a lens's fall-off, or all of them together leave it near
              0 (a plane has TL + BR = TR + BL; a pool about the middle lights all four
              alike); a pool toward the key light makes it negative. Positive past
              CROSS_BAR L*, the light is on the diagonal across the key light: from the
              top right or the bottom left, or a band between them, which is what the
              owner saw. Brushed metal measured 25.1 (Titanium, 1:1: corners 55.7,
              78.8, 55.2, 82.3), Diamond plate 15.0.
     facing   L = a + bx u + by v + c1 r + c2 r^2 fitted over the frame, r from the
              stage's centre, so a pool of light about the phones (a background light
              behind them, as a studio has) is its own term; bx and by are then read
              along the key light, 45 degrees from the top left: L* gained across one
              frame width toward the light. The ground may be even, or brighter toward
              the light, but not brighter away from it by more than FACE_BAR: shadows
              that fall toward the bright side say the light is behind the wall.

   Only the grounds that are lit surfaces are held to it (LIT): a wall, a sheet of a
   material, a studio sweep or backdrop. Measured and listed, not failed: a ground whose
   bright and dark are its design (a split, rays from a corner, a colour gradient, neon,
   shapes), a sky (its light is the sky), a scene that draws its own lamp, sign or
   window (it is lit by that), and a scene with an object on it (a plinth, steps: the
   object's lit top reads as light low in the frame). HOLDS are lit surfaces measured
   past a bar and kept, each with its reason.

   usage:  python3 -m http.server 8765   (repo root)   then
           node scripts/ground_light_audit.mjs [--port 8765] [--only brushed_metal] [--all]
   --all fails any ground, lit surface or not. Uses puppeteer-core with CHROME=/path,
   else playwright's chromium (PLAYWRIGHT=/path/to/playwright to point at one).
   Exits 1 on a failure. */
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const PORT = +arg('--port', 8765), ONLY = arg('--only', ''), ALL = process.argv.includes('--all');
const CROSS_BAR = 3, FACE_BAR = 4;

// the grounds that show a lit surface: a wall, a sheet of a material, a studio sweep or
// backdrop. Their bright and dark are light, so they answer to the key light.
const LIT = new Set([
  'radial', 'flat', 'tonal', 'aurora', 'drift', 'spotlight',
  'stucco', 'concrete', 'cork', 'velvet',
  'blueprint', 'newsprint', 'kraft', 'wood', 'tile', 'brushed_metal', 'carbon', 'gingham', 'pegboard', 'diamond_plate', 'notebook',
  'studio_sweep', 'marble_soft', 'tile_gloss', 'spot_floor',
]);
// lit surfaces past a bar, kept: measured and printed, not failed
const HOLDS = {
  tonal: 'a studio backdrop lit from behind the phones, its foot lighter than its head ' +
    '(engine.js: "the way a lit studio wall falls off"): 4.6 L* lit low on Editorial cream, past the bar on 2 of 24 drawings',
};

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

const rows = await page.evaluate(async ({ ONLY }) => {
  const { Ad } = await import('./engine.js');
  const { PALETTES, GROUND_CANDIDATES, FRESH_REVIEW } = await import('./catalog.js');
  const { THEME_GROUNDS, THEMES } = await import('./themes.js');
  const { SCENE_GROUPS } = await import('./photo-grounds.js');
  const { DEFAULT_STYLE, OPTIONS } = await import('./catalog.js');
  const kinds = [...new Set([...(OPTIONS && OPTIONS.background || []), ...THEME_GROUNDS, ...Object.keys(GROUND_CANDIDATES),
    ...FRESH_REVIEW.approved, ...SCENE_GROUPS.flatMap(g => g.kinds)])].filter(k => !ONLY || ONLY.split(',').includes(k));
  const lin = v => (v /= 255) <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
  const Lstar = Y => Y > .008856 ? 116 * Math.cbrt(Y) - 16 : 903.3 * Y;
  const tone = id => { const g = PALETTES[id].ground.replace('#', ''), [r, gg, b] = [0, 2, 4].map(i => parseInt(g.slice(i, i + 2), 16)); return .2126 * r + .7152 * gg + .0722 * b; };
  const ids = Object.keys(PALETTES).filter(k => PALETTES[k].ground && PALETTES[k].light);
  const light = ids.filter(k => tone(k) > 150), mid = ids.filter(k => tone(k) > 70 && tone(k) <= 150), dark = ids.filter(k => tone(k) <= 70);
  const out = [];
  for (const kind of kinds) {
    // the palettes its themes wear it in, and two of every tone
    const themed = Object.values(THEMES).filter(t => (t.backgrounds || []).includes(kind)).flatMap(t => t.palettes || []);
    const pals = [...new Set([...themed, 'titanium_grey', light[0], light[3], mid[0], mid[2], dark[0], dark[2]].filter(k => k && PALETTES[k]))];
    for (const aspect of ['1:1', '9:16']) for (const palette of pals) {
      let ad;
      try { ad = new Ad({ ...DEFAULT_STYLE, background: kind, palette, aspect, seed: 7, phones: [], decor: [], grain: false }, { phones: {} }); }
      catch (e) { out.push({ kind, aspect, palette, error: String(e.message || e) }); continue; }
      const c = ad.bg, W = c.width, H = c.height, d = c.getContext('2d').getImageData(0, 0, W, H).data;
      // the light, block by block: 18 across, as many down as keep them square
      const nx = 18, ny = Math.round(18 * H / W), bw = W / nx, bh = H / ny, Lb = [];
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        let s = 0, n = 0;
        for (let y = Math.floor(j * bh); y < Math.floor((j + 1) * bh); y += 2) for (let x = Math.floor(i * bw); x < Math.floor((i + 1) * bw); x += 2) {
          const k = (y * W + x) * 4; s += .2126 * lin(d[k]) + .7152 * lin(d[k + 1]) + .0722 * lin(d[k + 2]); n++;
        }
        Lb.push(Lstar(s / n));
      }
      const at = (i, j) => Lb[j * nx + i];
      // crossed: the corners, three blocks a side each, the two diagonals against each other. Any
      // one light falling off across a wall, any pool of light, any lens's fall-off, or all of them
      // together, leave the two diagonals level (a plane has TL + BR = TR + BL; a pool about the
      // middle lights all four alike); only a light that is not there makes one diagonal dark and
      // the other bright
      const cb = (i0, j0) => { let s = 0; for (let j = j0; j < j0 + 3; j++) for (let i = i0; i < i0 + 3; i++) s += at(i, j); return s / 9; };
      const [TL, TR, BR, BL] = [cb(0, 0), cb(nx - 3, 0), cb(nx - 3, ny - 3), cb(0, ny - 3)];
      const crossed = ((TR + BL) - (TL + BR)) / 2;
      // facing: L = a + bx u + by v + c1 r + c2 r^2, r from the stage's centre, so a pool of light
      // about the phones (a background light behind them, as a studio has) is its own term and only
      // the light's direction is left in bx, by. u and v run -0.5 to 0.5 across the short side.
      const S = Math.min(W, H), [scx, scy] = ad.stageC || [W / 2, H / 2], A = [...Array(5)].map(() => Array(6).fill(0));
      let sL = 0, n = 0;
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const X = (i + .5) * bw, Y = (j + .5) * bh, u = (X - W / 2) / S, v = (Y - H / 2) / S, r = Math.hypot(X - scx, Y - scy) / S, L = at(i, j);
        const f = [1, u, v, r, r * r];
        for (let a = 0; a < 5; a++) { for (let b = 0; b < 5; b++) A[a][b] += f[a] * f[b]; A[a][5] += f[a] * L; }
        sL += L; n++;
      }
      for (let k = 0; k < 5; k++) {
        let piv = k; for (let a = k + 1; a < 5; a++) if (Math.abs(A[a][k]) > Math.abs(A[piv][k])) piv = a;
        [A[k], A[piv]] = [A[piv], A[k]];
        for (let a = 0; a < 5; a++) if (a !== k) { const m = A[a][k] / A[k][k]; for (let b = k; b < 6; b++) A[a][b] -= m * A[k][b]; }
      }
      const bx = A[1][5] / A[1][1], by = A[2][5] / A[2][2];
      // L* gained moving one frame-width toward the key light (up and to the left, 45 degrees)
      const facing = -(bx + by) / Math.SQRT2;
      const corners = [TL, TR, BR, BL].map(v => +v.toFixed(1));
      out.push({ kind, aspect, palette, crossed: +crossed.toFixed(2), facing: +facing.toFixed(2), corners, mean: +(sL / n).toFixed(1) });
    }
  }
  return out;
}, { ONLY });
await browser.close();

const fails = [], listed = [];
const byKind = new Map();
for (const r of rows) (byKind.get(r.kind) || byKind.set(r.kind, []).get(r.kind)).push(r);
for (const [kind, rs] of byKind) {
  const errs = rs.filter(r => r.error);
  if (errs.length) { console.log(`${kind.padEnd(16)} ERROR ${errs[0].error}`); fails.push(kind); continue; }
  const crossed = rs.filter(r => r.crossed > CROSS_BAR), away = rs.filter(r => r.facing < -FACE_BAR);
  const held = ALL || (LIT.has(kind) && !HOLDS[kind]), bad = crossed.length || away.length;
  const minFace = Math.min(...rs.map(r => r.facing)), maxCross = Math.max(...rs.map(r => r.crossed));
  const tag = !bad ? 'ok  ' : held ? 'FAIL' : HOLDS[kind] ? 'held' : 'list';
  const ex = crossed.sort((a, b) => b.crossed - a.crossed)[0] || away.sort((a, b) => a.facing - b.facing)[0];
  console.log(`${tag} ${kind.padEnd(16)} ${LIT.has(kind) ? 'lit ' : 'art '} crossed<=${maxCross.toFixed(1).padStart(5)}  facing>=${minFace.toFixed(1).padStart(6)}  ` +
    (bad ? `${crossed.length} of ${rs.length} crossed, ${away.length} lit away; e.g. ${ex.palette} ${ex.aspect} corners TL TR BR BL ${ex.corners.join(' ')} crossed ${ex.crossed} facing ${ex.facing}` : ''));
  if (bad && held) fails.push(kind); else if (bad && HOLDS[kind]) console.log(`     ${kind}: ${HOLDS[kind]}`); else if (bad) listed.push(kind);
}
console.log(`\n${byKind.size} grounds, ${rows.length} drawings; ${fails.length} lit surfaces fail${fails.length ? ': ' + fails.join(', ') : ''}; ${listed.length} designed grounds listed${listed.length ? ': ' + listed.join(', ') : ''}`);
if (fails.length) process.exitCode = 1;
