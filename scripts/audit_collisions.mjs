#!/usr/bin/env node
/* COLLISION AUDIT — do two things try to occupy the same place?
 *
 * audit_showcase_overlap.mjs asks one question: is something drawn ON TOP of
 * a reading line? It cannot see the owner's own example (2026-09-27): on
 * "Blush & Cobalt · Bubble Pop" the CASH NOW disc sits UNDER the item line,
 * so the line is on top, the disc's words are not a reading role, and the
 * card scored cover 0 while two messages shared the same patch of the ad.
 *
 * This asks the question in both z-orders, on INK, not boxes (rule 50: a box
 * is mostly empty space for an arc, a script face or a centred block):
 *
 *   text × text     — ink pixels of two different lines in the same place.
 *   text × carrier  — a line that STRADDLES a solid shape: part of its ink in
 *                     the shape, part outside. Fully inside is the shape doing
 *                     its job (a plate, a pill, a disc); fully outside is
 *                     unrelated. Half in is a collision, whichever is on top.
 *   product × text  — a cutout's opaque pixels over or under a line's ink.
 *   air             — a line ON a plate needs air at both ends, measured in the
 *                     plate's own frame (rule 64): the straddle test cannot see
 *                     a line that fills its plate end to end.
 *
 * Every layer is rendered alone through buildLayer()/alignPass() (the path
 * renderThumb() takes) at quarter scale and its alpha taken as a mask.
 *
 * usage: node scripts/audit_collisions.mjs [--classics] [--ids a,b] [--json out.json] [--no-air-fix]
 *   default: every showcase record. --classics: the 243 built-in templates.
 * env: GFX_BASE, CHROME, FABRIC_JS (see _showcase_harness.mjs).
 * Exits 1 if any LIVE (undefected) showcase card collides past the threshold.
 */
import { openStudio } from './_showcase_harness.mjs';
import { readFileSync, writeFileSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url).pathname;
const argv = process.argv.slice(2);
const arg = k => { const i = argv.indexOf(k); return i < 0 ? null : argv[i + 1]; };
const CLASSICS = argv.includes('--classics');
const idx = JSON.parse(readFileSync(ROOT + 'assets/showcase/index.json', 'utf8'));
/* A collision is scored as the share of the SMALLER party's ink involved
   (rule 35: overlap is measured against the smaller box). */
const FAIL = 0.06;          // 6% of a line's ink shared with another element
/* air is measured on quarter-scale masks, so a shortfall inside one mask
   pixel (4px) is not a finding */
const AIR_TOL = 4;
/* --no-air-fix renders without the engine's plateAir() step, to measure the before */
const NO_AIR_FIX = argv.includes('--no-air-fix');

const { browser, page, errors } = await openStudio();
if (NO_AIR_FIX) await page.evaluate(() => { window.__noPlateAir = true; });
const ids = arg('--ids') ? arg('--ids').split(',')
  : CLASSICS ? await page.evaluate(() => TEMPLATES.map(t => t.id)) : idx.map(c => c.id);

const out = {};
for (let i = 0; i < ids.length; i += 8){
  const res = await page.evaluate(async (batch, classics) => {
    const R = {};
    const S = 4, W = TPL_W / S, H = TPL_H / S;                    // quarter scale is plenty for "is there ink here"
    for (const id of batch){
      try {
        const t = classics ? await __sc.prep({ tpl: TEMPLATES.find(x => x.id === id), base: id }, id) : await __sc.load(id);
        const { sc, refs } = __sc.paint(t);
        sc.setBackgroundImage(null, () => {}); sc.backgroundColor = '';
        const all = sc.getObjects();
        const vis = all.map(o => o.visible);
        sc.enableRetinaScaling = false; sc.setDimensions({ width:W, height:H }); sc.setZoom(1 / S);
        const mask = o => {
          all.forEach(x => { x.visible = x === o; });
          /* ink only: a glyph's shadow is a halo, and two neighbouring lines'
             halos touching is not a collision */
          const sh = o.shadow; o.shadow = null;
          sc.renderAll();
          o.shadow = sh;
          const d = sc.lowerCanvasEl.getContext('2d').getImageData(0, 0, W, H).data;
          const m = new Uint8Array(W * H); let n = 0;
          for (let p = 0, q = 3; p < m.length; p++, q += 4) if (d[q] > 110){ m[p] = 1; n++; }
          return { m, n };
        };
        const L = t.layers.map((l, k) => ({ l, k, o: refs[k] })).filter(z => z.o && vis[all.indexOf(z.o)] !== false
          && ((z.l.props && z.l.props.opacity !== undefined ? z.l.props.opacity : 1) >= 0.5));
        const texts = L.filter(z => typeof z.l.text === 'string' && /[A-Za-z0-9]/.test(z.l.text));
        const cuts = L.filter(z => z.l.kind === 'cutout');
        /* a carrier is a solid shape that is not the whole ground */
        const solid = f => f && f !== 'transparent' && !/rgba\([^)]*,\s*0(\.[0-4]\d*)?\)$/.test(String(f));
        const carriers = L.filter(z => ['rect','circle','ellipse','path','polygon','triangle'].includes(z.l.kind)
          && (solid(z.l.props && z.l.props.fill) || (z.l.props && z.l.props.grad) || z.l.grad));
        const M = new Map();
        const get = z => { if (!M.has(z.k)) M.set(z.k, mask(z.o)); return M.get(z.k); };
        const shared = (a, b) => { let n = 0; for (let p = 0; p < a.m.length; p++) if (a.m[p] && b.m[p]) n++; return n; };
        let worst = 0, what = null;
        const hit = (f, s) => { if (f > worst){ worst = f; what = s; } };
        const name = z => (z.l.name || z.l.role || z.l.kind);
        // text × text
        for (let a = 0; a < texts.length; a++) for (let b = a + 1; b < texts.length; b++){
          const A = get(texts[a]), B = get(texts[b]); if (A.n < 20 || B.n < 20) continue;
          hit(shared(A, B) / Math.min(A.n, B.n), 'text×text: ' + name(texts[a]) + ' / ' + name(texts[b]));
        }
        // text × carrier: straddling
        const cmask = new Map();
        const filled = z => { if (cmask.has(z.k)) return cmask.get(z.k); const c = get(z); cmask.set(z.k, c); return c; };
        texts.forEach(tz => { const T = get(tz); if (T.n < 20) return;
          carriers.forEach(cz => { const C = filled(cz); if (C.n < 20 || C.n > W * H * 0.6) return;
            const inside = shared(T, C) / T.n;
            if (inside > 0.04 && inside < 0.96) hit(Math.min(inside, 1 - inside), 'straddles ' + name(cz) + ': ' + name(tz) + ' ' + Math.round(inside * 100) + '% inside');
          });
        });
        /* AIR ON A PLATE (rule 64; owner, 2026-09-27, on CALL FOR INSTANT
           OFFER edge to edge on a tilted badge: "why can't we seem to catch
           this?"). The straddle test above only scores a line PART in and part
           out, and passes one that fills its plate end to end or pokes a
           letter over it. A line whose ink sits on a rectangular plate is
           measured in the plate's own frame (so a tilted sticker is judged
           along its tilt): both ends need plateAirNeed() of air, the same
           margin the engine's plateAir() fits to. */
        let air = 0, airBy = null;
        { const plates = carriers.filter(cz => cz.o && cz.o.type === 'rect');
          texts.forEach(tz => { const T = get(tz); if (T.n < 20) return;
            const pts = [];
            for (let p = 0; p < T.m.length; p++) if (T.m[p]) pts.push(p);
            let host = null;
            plates.forEach(cz => { const o = cz.o;
              if (all.indexOf(o) > all.indexOf(tz.o)) return;          // a plate over the line is not its ground
              const PW = o.width * (o.scaleX || 1), PH = o.height * (o.scaleY || 1);
              if (PW < 40 || PH < 20 || PW > TPL_W * 0.93 || PH > TPL_H * 0.9) return;
              const inv = fabric.util.invertTransform(o.calcTransformMatrix());
              let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, sx = 0, sy = 0;
              pts.forEach(p => { const q = fabric.util.transformPoint(new fabric.Point((p % W + 0.5) * S, (Math.floor(p / W) + 0.5) * S), inv);
                const lx = q.x * (o.scaleX || 1), ly = q.y * (o.scaleY || 1);
                x0 = Math.min(x0, lx); x1 = Math.max(x1, lx); y0 = Math.min(y0, ly); y1 = Math.max(y1, ly); sx += lx; sy += ly; });
              const cx = sx / pts.length, cy = sy / pts.length;
              if (Math.abs(cx) > PW / 2 || Math.abs(cy) > PH / 2) return;
              if (y1 - y0 > PH * 1.15 || x1 - x0 > PW * 1.4) return;        // bigger than the plate: not a line on it
              if (!host || PW * PH < host.PW * host.PH) host = { cz, PW, L: PW / 2 + x0 - S / 2, R: PW / 2 - x1 - S / 2 };
            });
            if (!host) return;
            const fs = (tz.o.fontSize || 30) * (tz.o.scaleY || 1), need = plateAirNeed(host.PW, fs);
            const short = need - Math.min(host.L, host.R);
            if (short > air){ air = short; airBy = name(tz) + ' on ' + name(host.cz) + ': ' + Math.round(host.L) + ' / ' + Math.round(host.R) + 'px, needs ' + Math.round(need); }
          });
        }
        // product × text, either order
        texts.forEach(tz => { const T = get(tz); if (T.n < 20) return;
          cuts.forEach(cz => { const C = get(cz); if (C.n < 20) return; hit(shared(T, C) / T.n, 'product×text: ' + name(cz) + ' / ' + name(tz)); });
        });
        /* THE PRODUCT (owner, 2026-09-27: "the asset should be on the inner
           card"). Two faults, kept apart from text collisions:
           clip — share of the product the edge of the ad cuts off;
           half — the product partly on a panel and partly off it (a gold chain
           hanging off the glass card), scored like a straddle. */
        /* THE GUIDES (owner, 2026-09-27: "make sure everything fits within the
           guides it needs to"). The engine's guide is the 6% safe margin rule
           54 already warns on. guide = the largest share of any line's ink
           inside that margin band; off = px any line's box runs off the ad. */
        const G = Math.round(0.06 * W);
        let guide = 0, guideBy = null, off = 0, offBy = null;
        texts.forEach(tz => { const T = get(tz); if (T.n < 20) return;
          let n = 0;
          for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
            if (T.m[y * W + x] && (x < G || x >= W - G || y < G || y >= H - G)) n++;
          if (n / T.n > guide){ guide = n / T.n; guideBy = name(tz); }
          const b = tz.o.getBoundingRect(true, true);
          const o2 = Math.max(-b.left, -b.top, b.left + b.width - TPL_W, b.top + b.height - TPL_H);
          if (o2 > off){ off = o2; offBy = name(tz); }
        });
        let clipOut = 0, half = 0, halfBy = null;
        cuts.forEach(cz => {
          const b = cz.o.getBoundingRect(true, true), a = b.width * b.height;
          if (a > 0){
            const ix = Math.max(0, Math.min(b.left + b.width, TPL_W) - Math.max(b.left, 0));
            const iy = Math.max(0, Math.min(b.top + b.height, TPL_H) - Math.max(b.top, 0));
            clipOut = Math.max(clipOut, 1 - (ix * iy) / a);
          }
          const P = get(cz); if (P.n < 20) return;
          carriers.forEach(kz => { const K = filled(kz); if (K.n < 20 || K.n > W * H * 0.6) return;
            const inside = shared(P, K) / P.n;
            if (inside > 0.10 && inside < 0.90 && Math.min(inside, 1 - inside) > half){ half = Math.min(inside, 1 - inside); halfBy = name(cz) + ' ' + Math.round(inside * 100) + '% on ' + name(kz); }
          });
        });
        all.forEach((x, n) => { x.visible = vis[n]; });
        sc.dispose();
        R[id] = { collide: +worst.toFixed(3), what, clip: +clipOut.toFixed(3), half: +half.toFixed(3), halfBy,
                  guide: +guide.toFixed(3), guideBy, off: Math.round(Math.max(0, off)), offBy,
                  air: Math.round(air), airBy };
      } catch (e){ R[id] = { err: String(e).slice(0, 90) }; }
    }
    return R;
  }, ids.slice(i, i + 8), CLASSICS);
  Object.assign(out, res);
  if (i % 96 === 0) console.log('…' + Math.min(ids.length, i + 8) + '/' + ids.length);
}
await browser.close();

const byId = Object.fromEntries(idx.map(c => [c.id, c]));
const rows = ids.map(id => ({ id, r: out[id] || { err:'missing' }, live: CLASSICS ? true : !(byId[id] || {}).defect }));
const ok = rows.filter(x => !x.r.err);
const band = (lo, hi, f = () => true) => ok.filter(x => f(x) && x.r.collide >= lo && x.r.collide < hi).length;
console.log('\n' + (CLASSICS ? 'classics' : 'showcase') + ': audited ' + rows.length + ' · errors ' + (rows.length - ok.length) + (errors.length ? ' · pageerrors ' + errors.length : ''));
console.log('worst collision per card (share of the smaller party\'s ink):');
console.log('  clean (<2%)    all ' + band(0, 0.02) + (CLASSICS ? '' : '  live ' + band(0, 0.02, x => x.live)));
console.log('  minor (2-6%)   all ' + band(0.02, FAIL) + (CLASSICS ? '' : '  live ' + band(0.02, FAIL, x => x.live)));
console.log('  COLLIDES (>=6%) all ' + band(FAIL, 2) + (CLASSICS ? '' : '  live ' + band(FAIL, 2, x => x.live)));
ok.filter(x => x.r.collide >= FAIL).sort((a, b) => b.r.collide - a.r.collide).slice(0, 15)
  .forEach(x => console.log('  ' + String(Math.round(x.r.collide * 100)).padStart(3) + '%  ' + (x.live ? 'LIVE ' : '     ') + x.id.padEnd(26) + x.r.what));
const inMargin = ok.filter(x => x.r.guide >= 0.02), offCard = ok.filter(x => x.r.off > 2);
console.log('\ncopy inside the 6% safe margin (>=2% of a line\'s ink): all ' + inMargin.length + (CLASSICS ? '' : '  live ' + inMargin.filter(x => x.live).length));
console.log('copy running off the ad (>2px):                     all ' + offCard.length + (CLASSICS ? '' : '  live ' + offCard.filter(x => x.live).length));
inMargin.sort((a, b) => b.r.guide - a.r.guide).slice(0, 6).forEach(x => console.log('  ' + String(Math.round(x.r.guide * 100)).padStart(3) + '%  ' + (x.live ? 'LIVE ' : '     ') + x.id.padEnd(26) + x.r.guideBy));
const airless = ok.filter(x => x.r.air > AIR_TOL);
console.log('\ncopy without air at the ends of its plate (>' + AIR_TOL + 'px short): all ' + airless.length + (CLASSICS ? '' : '  live ' + airless.filter(x => x.live).length));
airless.sort((a, b) => b.r.air - a.r.air).slice(0, 12).forEach(x => console.log('  ' + String(x.r.air).padStart(3) + 'px  ' + (x.live ? 'LIVE ' : '     ') + x.id.padEnd(26) + x.r.airBy));
const clipped = ok.filter(x => x.r.clip >= 0.08), halves = ok.filter(x => x.r.half >= 0.10);
console.log('\nproduct cut off by the edge of the ad (>=8% of it): all ' + clipped.length + (CLASSICS ? '' : '  live ' + clipped.filter(x => x.live).length));
console.log('product half on a panel, half off (>=10%):         all ' + halves.length + (CLASSICS ? '' : '  live ' + halves.filter(x => x.live).length));
halves.sort((a, b) => b.r.half - a.r.half).slice(0, 8).forEach(x => console.log('  ' + (x.live ? 'LIVE ' : '     ') + x.id.padEnd(26) + x.r.halfBy));
if (arg('--json')) writeFileSync(arg('--json'), JSON.stringify(out));
process.exit(ok.some(x => x.live && (x.r.collide >= FAIL || x.r.air > AIR_TOL)) ? 1 : 0);
