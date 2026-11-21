#!/usr/bin/env node
/* A LOCK SCREEN AS APPLE DRAWS ONE (DESIGN-LAW 156).

   2026-11-19, the owner, through the roadmap session, of two face-up iPhones with "9:41" on a green wallpaper:
   "weird stretch". The lock screen was drawn on a 330 by 716 canvas and stretched to each phone's glass, and the
   taller iOS 26 clock was pulled 2.1 times down. 2026-11-20, of the next stills: "it got better but still has an
   irregular gap", then "compare against actual apple imagery". The face's own spacing set the colon tight and
   the 1 loose. The clock is now set as Apple's own press images set it (fullad.js LOCK_CLOCK, lockClock), each
   figure placed by its ink. This fails when, for any phone photograph that can wear a lock screen
   (motion/phones/index.json, every one not flat, angled ones included), in any layout:

     the shape    the lock screen is not its glass's shape, within half a percent (drawn at one scale on a
                  glass of another shape, it would be cropped, or, as before, stretched);
     the fit      drawFront draws the screen at anything but one scale;
     the clock    the clock's drawn ink, found as what the screen has that the same screen without its clock
                  has not, is not the shape lockClock sets (within three percent), or is lifted taller than
                  its face (the classic clock not at all, the tall one at most a fifth);
     the gaps     the four figures touch, or a gap between them is off Apple's (LOCK_CLOCK.gaps) by more than
                  3.5 hundredths of the clock's height (a pixel of each edge's anti-aliasing is ink);
     the colon    the colon is not centred on the figures, within 4 hundredths of their height;
     Apple's      the clock is not Apple's size for the screen's width or not where Apple puts it down the
                  screen (within a hundredth of the width, and of the height). Measured on Apple's Newsroom
                  images: "Apple-WWDC22-iOS16-Personalized-Lockscreen-Widgets" (iOS 16 to 18) and
                  "Apple-WWDC25-iOS-26-hero" (iOS 26 on).

   usage:  python3 -m http.server 8899   (in the repo), then
           [GFX_BASE=http://127.0.0.1:8899/] [PLAYWRIGHT_MODULE=...] node scripts/lock_screen_check.mjs
   Exits 1 on a failure. */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const ROOT = new URL('../', import.meta.url).pathname;
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8899/').replace(/\/?$/, '/');
const fails = [], ok = (cond, what, more = '') => { console.log((cond ? '  ok   ' : '  FAIL ') + what + (more && !cond ? ': ' + more : '')); if (!cond) fails.push(what); };

// Apple's clock, as measured on its own images: its height for the screen's width, and its foot down the screen
const APPLE = { classic: { tall: .186, foot: .24 }, tall: { tall: .46, foot: .36 } };

// the fit, in the code: one scale for both sides
const engine = readFileSync(ROOT + 'motion/engine.js', 'utf8');
ok(/const k = Math\.max\(sw \/ screen\.width, sh \/ screen\.height\), dw = screen\.width \* k, dh = screen\.height \* k;/.test(engine) && !/ctx\.drawImage\(screen, -w \/ 2 \+ s, -h \/ 2 \+ s, sw, sh\)/.test(engine),
  'drawFront draws the screen at one scale, covering the glass (engine.js)');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
const errors = []; page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
await page.goto(BASE + 'motion/', { waitUntil: 'load', timeout: 120000 });
const r = await page.evaluate(async (APPLE) => {
  const F = await import('/motion/fullad.js'), E = await import('/motion/engine.js');
  const idx = await (await fetch('/motion/phones/index.json')).json(), metas = (idx.phones || []).filter(m => m.ok !== false && !m.flat);
  const p = { accent: '#2f8f6b', plate: '#2f8f6b', light: '#9fd8bf', ground: '#0d1f17' };
  // the clock's ink: what the screen has that the same screen without its clock has not
  const ink = (a, b) => {
    const A = a.getContext('2d').getImageData(0, 0, a.width, a.height).data, B = b.getContext('2d').getImageData(0, 0, b.width, b.height).data;
    const on = new Uint8Array(a.width * a.height); let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) { const k = (y * a.width + x) * 4; if (Math.abs(A[k] - B[k]) + Math.abs(A[k + 1] - B[k + 1]) + Math.abs(A[k + 2] - B[k + 2]) > 30) { on[y * a.width + x] = 1; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
    if (x1 < 0) return null;
    const runs = []; let s = -1;
    for (let x = x0; x <= x1 + 1; x++) { let any = false; if (x <= x1) for (let y = y0; y <= y1; y++) if (on[y * a.width + x]) { any = true; break; } if (any && s < 0) s = x; if (!any && s >= 0) { runs.push([s, x - 1]); s = -1; } }
    const rowsOf = ([c0, c1]) => { let t = 1e9, b = -1; for (let y = y0; y <= y1; y++) for (let x = c0; x <= c1; x++) if (on[y * a.width + x]) { if (y < t) t = y; if (y > b) b = y; } return [t, b]; };
    return { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1, runs, rowsOf };
  };
  const out = { metas: metas.length, shape: [], clock: [], lift: [], gaps: [], colon: [], apple: [], aspects: [], lifts: {} };
  for (const m of metas) {
    const aspect = E.glassAspect(1000 * m.w / m.h, 1000);
    out.aspects.push(+aspect.toFixed(3));
    for (const layout of F.LOCK_LAYOUTS) {
      const kind = layout === 'tall' ? 'tall' : 'classic', K = F.LOCK_CLOCK[kind];
      const opts = { aspect, layout, wall: 'gradient', notch: false };
      const c = F.lockScreen(p, 7, 'en', p.accent, opts), c0 = F.lockScreen(p, 7, 'en', p.accent, { ...opts, noClock: true });
      const id = `${m.id} ${layout}`;
      if (Math.abs((c.width / c.height) / aspect - 1) > .005) out.shape.push(`${id}: ${(c.width / c.height).toFixed(3)} on a glass of ${aspect.toFixed(3)}`);
      const C = F.lockClock(c.getContext('2d'), kind, c.width), d = ink(c, c0);
      out.lifts[kind] = Math.max(out.lifts[kind] || 0, C.lift);
      if (!d) { out.clock.push(`${id}: no clock`); continue; }
      const want = C.width / (C.ink * C.lift), got = d.w / d.h;
      if (Math.abs(got / want - 1) > .03) out.clock.push(`${id}: ${got.toFixed(3)} wide to high, set ${want.toFixed(3)}`);
      if (C.lift > K.maxLift + 1e-9 || (kind === 'classic' && C.lift !== 1)) out.lift.push(`${id}: lifted ${C.lift.toFixed(3)}`);
      if (d.runs.length !== 4) out.gaps.push(`${id}: ${d.runs.length} runs of ink, not four figures`);
      else {
        const g = d.runs.slice(1).map((q, i) => (q[0] - d.runs[i][1] - 1) / d.h), off = g.map((v, i) => Math.abs(v - K.gaps[i]));
        if (Math.max(...off) > .035) out.gaps.push(`${id}: gaps ${g.map(v => v.toFixed(3)).join(' ')}, Apple's ${K.gaps.join(' ')}`);
        const [t, b] = d.rowsOf(d.runs[1]), mid = (t + b) / 2, figMid = (d.y0 + d.y1) / 2;
        if (Math.abs(mid - figMid) / d.h > .04) out.colon.push(`${id}: colon centred ${((mid - d.y0) / d.h).toFixed(3)} down the figures`);
      }
      const A = APPLE[kind], tall = d.h / c.width, foot = (d.y1 + 1) / c.height;
      if (Math.abs(tall - A.tall) > .01 || Math.abs(foot - A.foot) > .01) out.apple.push(`${id}: ${tall.toFixed(3)} of the width tall (Apple's ${A.tall}), foot ${foot.toFixed(3)} down (Apple's ${A.foot})`);
    }
  }
  // APPLE'S OWN WALLPAPERS (deviceWall; 2026-11-21, the owner chose Apple's images on about a third of phones):
  // every family's loaded, each pick of the screen's own family or neutral, a third of seeds, and the clock held
  // to all of the above on one wallpaper of each family, in every layout
  await E.loadDeviceWalls('/motion/phones/', metas);
  const bases = ['#0b2a6b', '#1d4ed8', '#06b6d4', '#0f766e', '#16a34a', '#84cc16', '#f5b301', '#ff7a00', '#e11d2a', '#ec4899', '#7e22ce', '#1b1c20', '#f3f5f9', '#8a8f98'];
  const gap = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
  const fams = new Map(); out.walls = { families: 0, picked: new Set(), offFamily: [], noWalls: [] };
  for (const m of metas) {
    if (!m.walls || !m.walls.length) { if (E.wallFamily(m.model)) out.walls.noWalls.push(m.id); continue; }
    fams.set(E.wallFamily(m.model), m);
    for (const b of bases) {
      const wl = F.deviceWall(m, b); if (!wl) continue;
      out.walls.picked.add(wl.file);
      const T = E.oklchOf(wl.tone), B = E.oklchOf(b);
      if (T.C >= .04 && !(B.C >= .04 && gap(T.h, B.h) <= 30)) out.walls.offFamily.push(`${m.id} on ${b}: ${wl.file}`);
    }
  }
  out.walls.families = fams.size; out.walls.picked = out.walls.picked.size;
  let turns = 0; for (let s = 1; s <= 900; s++) if (F.ownWallTurn(s)) turns++;
  out.walls.share = turns / 900;
  for (const [fam, m] of fams) {
    const wl = m.walls[0], aspect = E.glassAspect(1000 * m.w / m.h, 1000);
    for (const layout of F.LOCK_LAYOUTS) {
      const kind = layout === 'tall' ? 'tall' : 'classic', K = F.LOCK_CLOCK[kind], id = `${fam} ${wl.file} ${layout}`;
      const opts = { aspect, layout, image: wl.img, notch: false };
      const c = F.lockScreen(p, 7, 'en', wl.tone, opts), c0 = F.lockScreen(p, 7, 'en', wl.tone, { ...opts, noClock: true });
      const d = ink(c, c0); if (!d) { out.clock.push(`${id}: no clock`); continue; }
      if (d.runs.length !== 4) out.gaps.push(`${id}: ${d.runs.length} runs of ink, not four figures`);
      const A = APPLE[kind], tall = d.h / c.width, foot = (d.y1 + 1) / c.height;
      if (Math.abs(tall - A.tall) > .01 || Math.abs(foot - A.foot) > .01) out.apple.push(`${id}: ${tall.toFixed(3)} tall, foot ${foot.toFixed(3)}`);
    }
  }
  return out;
}, APPLE);
console.log(`lock screens: ${r.metas} phone photographs (glass shapes ${Math.min(...r.aspects)} to ${Math.max(...r.aspects)}), ${r.metas * 3} screens; the tall clock lifted ${(r.lifts.tall || 1).toFixed(3)}`);
ok(!r.shape.length, `each lock screen is its glass's own shape, within half a percent`, r.shape.slice(0, 4).join('; '));
ok(!r.clock.length, `each clock is drawn in the shape lockClock sets, within three percent`, r.clock.slice(0, 4).join('; '));
ok(!r.lift.length, `no clock is lifted past its face's own (classic not at all, tall at most a fifth)`, r.lift.slice(0, 4).join('; '));
ok(!r.gaps.length, `the four figures stand apart at Apple's gaps, within 3.5 hundredths of the clock's height`, r.gaps.slice(0, 4).join('; '));
ok(!r.colon.length, `the colon is centred on the figures, as Apple's is`, r.colon.slice(0, 4).join('; '));
ok(!r.apple.length, `each clock is Apple's size for the screen and sits where Apple's does, within a hundredth`, r.apple.slice(0, 4).join('; '));
const Wl = r.walls;
console.log(`Apple's own wallpapers: ${Wl.families} families loaded, ${Wl.picked} wallpapers chosen across ${14} screen colours, a share of ${(Wl.share * 100).toFixed(1)}% of seeds`);
ok(!Wl.noWalls.length, 'every phone of a model with its own wallpaper has them loaded', Wl.noWalls.slice(0, 6).join(', '));
ok(!Wl.offFamily.length, "each wallpaper chosen is of the screen's own colour family, or neutral (never a third colour)", Wl.offFamily.slice(0, 4).join('; '));
ok(Wl.share > .3 && Wl.share < .37, `about a third of ads put their phones in their own model's wallpaper (${(Wl.share * 100).toFixed(1)}%)`);
ok(!errors.length, 'no page errors', errors.slice(0, 2).join(' | '));
await browser.close();
console.log(fails.length ? `\nlock screens: ${fails.length} failed` : '\nlock screens: every clock is set as Apple sets 9:41, on every phone');
process.exit(fails.length ? 1 : 0);
