#!/usr/bin/env node
/* A LOCK SCREEN'S TYPE KEEPS ITS OWN PROPORTIONS (DESIGN-LAW 156; 2026-11-19, the owner, through the roadmap
   session, of two face-up iPhones with "9:41" on a green wallpaper: "weird stretch").

   The lock screen was drawn on a 330 by 716 canvas and stretched to each phone's glass, whose shape is its
   photograph's outline (an angled photograph's is wider), and the taller iOS 26 clock was pulled 2.1 times
   down. Now each lock screen is built to its own glass (engine.js glassAspect, fullad.js lockScreen
   opts.aspect), drawn on it at one scale (drawFront covers and crops), and no clock is pulled. This fails when,
   for any phone photograph that can wear a lock screen (motion/phones/index.json, every one not flat) in any
   layout:

     the shape    the lock screen is not its glass's shape, within half a percent (drawn at one scale on a
                  glass of another shape, it would be cropped, or, as before, stretched);
     the clock    the clock's drawn ink, found as what the screen has that the same screen without its clock
                  has not, is not the font's own width to height (measureText of "9:41" in the clock's face),
                  within three percent;
     the fit      drawFront draws the screen at anything but one scale.

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

// the fit, in the code: one scale for both sides
const engine = readFileSync(ROOT + 'motion/engine.js', 'utf8');
ok(/const k = Math\.max\(sw \/ screen\.width, sh \/ screen\.height\), dw = screen\.width \* k, dh = screen\.height \* k;/.test(engine) && !/ctx\.drawImage\(screen, -w \/ 2 \+ s, -h \/ 2 \+ s, sw, sh\)/.test(engine),
  'drawFront draws the screen at one scale, covering the glass (engine.js)');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
const errors = []; page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
await page.goto(BASE + 'motion/', { waitUntil: 'load', timeout: 120000 });
const r = await page.evaluate(async () => {
  const F = await import('/motion/fullad.js'), E = await import('/motion/engine.js');
  const idx = await (await fetch('/motion/phones/index.json')).json(), metas = (idx.phones || []).filter(m => m.ok !== false && !m.flat);
  const FACE = '"SF Pro Display", "SF Pro Text", system-ui, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif';
  // the font's own "9:41": its ink box, as the clock is set (letter spacing a fiftieth of its size, tighter)
  const own = (() => { const c = document.createElement('canvas'), x = c.getContext('2d'), size = 200; x.font = `700 ${size}px ${FACE}`; if ('letterSpacing' in x) x.letterSpacing = `${-Math.round(size * .02)}px`;
    const m = x.measureText('9:41'); return (m.actualBoundingBoxLeft + m.actualBoundingBoxRight) / (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent); })();
  const p = { accent: '#2f8f6b', plate: '#2f8f6b', light: '#9fd8bf', ground: '#0d1f17' };
  const ink = (a, b) => { const A = a.getContext('2d').getImageData(0, 0, a.width, a.height).data, B = b.getContext('2d').getImageData(0, 0, b.width, b.height).data;
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) { const k = (y * a.width + x) * 4; if (Math.abs(A[k] - B[k]) + Math.abs(A[k + 1] - B[k + 1]) + Math.abs(A[k + 2] - B[k + 2]) > 30) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
    return x1 < 0 ? null : (x1 - x0 + 1) / (y1 - y0 + 1); };
  const out = { metas: metas.length, own, shape: [], clock: [], aspects: [] };
  for (const m of metas) {
    const aspect = E.glassAspect(1000 * m.w / m.h, 1000);
    out.aspects.push(+aspect.toFixed(3));
    for (const layout of F.LOCK_LAYOUTS) {
      const opts = { aspect, layout, wall: 'gradient', notch: false };
      const c = F.lockScreen(p, 7, 'en', p.accent, opts), c0 = F.lockScreen(p, 7, 'en', p.accent, { ...opts, noClock: true });
      const shape = (c.width / c.height) / aspect;
      if (Math.abs(shape - 1) > .005) out.shape.push(`${m.id} ${layout}: ${(c.width / c.height).toFixed(3)} on a glass of ${aspect.toFixed(3)}`);
      const drawn = ink(c, c0);
      if (!drawn || Math.abs(drawn / own - 1) > .03) out.clock.push(`${m.id} ${layout}: ${drawn ? drawn.toFixed(3) : 'no clock'} against the font's ${own.toFixed(3)}`);
    }
  }
  return out;
});
console.log(`lock screens: ${r.metas} phone photographs (glass shapes ${Math.min(...r.aspects)} to ${Math.max(...r.aspects)}), ${r.metas * 3} screens`);
ok(!r.shape.length, `each lock screen is its glass's own shape, within half a percent`, r.shape.slice(0, 4).join('; '));
ok(!r.clock.length, `each clock is drawn in its font's own proportions, within three percent (the font's 9:41 is ${r.own.toFixed(3)} wide to high)`, r.clock.slice(0, 4).join('; '));
ok(!errors.length, 'no page errors', errors.slice(0, 2).join(' | '));
await browser.close();
console.log(fails.length ? `\nlock screens: ${fails.length} failed` : '\nlock screens: every clock keeps its own proportions, on every phone');
process.exit(fails.length ? 1 : 0);
