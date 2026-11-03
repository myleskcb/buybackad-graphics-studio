#!/usr/bin/env node
/* PLATE PADDING AUDIT: do the words touch the box they sit in, or the card's edge?
 *
 * The owner, 2026-11-03, over the Designer Library card trustSeal-du07-30
 * ("YOUR LOCAL iPHONE BUYER"): "that green CTA has the number touching the
 * box", then "audit that please so all margins are clean and minimal
 * overlapping touching etc ... so it looks well planned, designed, and
 * thought out". The studio's gate (pgCheck) passed all 70 phone cards, that
 * one included: it reads contrast, size and whether a line is on a plate,
 * not how close its letters come to the plate's edge. A text box is not the
 * letters (fabric's box carries the line height), so this measures ink: each
 * line is drawn with and without itself through the studio's own paint
 * (renderThumb's sequence, after alignPass), and the pixels that change are
 * its letters.
 *
 * Per line, at 1080:
 *   straddle  letters cross a plate's edge (part on it, part off)
 *   tight     on a plate, nearer its top or bottom than 0.18x the letters'
 *             height (min 12px), or its side than 0.25x (min 14px), the side
 *             measured across at the letters' top and bottom rows to the
 *             outline as drawn (round corners, pill ends); a headline on a
 *             highlight bar, a slab that hugs its type by design, 0.1x/0.12x
 *   edge      letters within 32px of the card's edge
 *   small     letters under 18px tall (about 6pt in a phone's feed)
 *   collide   two lines' letters overlap; touch: within 6px of each other
 *
 * usage: python3 -m http.server 8899 (repo root), then
 *   CHROME=... FABRIC_JS=... GFX_BASE=http://127.0.0.1:8899/ \
 *   node scripts/audit_plate_padding.mjs [--cat phones] [--ids a,b] [--json out.json] [--library]
 *   --library: iPhones LA's copies, as render_library_ads.mjs draws them (_library_finish.mjs)
 * Exits 1 when any card has a finding. */
import { openStudio, live } from './_showcase_harness.mjs';
import { installLibraryFinish } from './_library_finish.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname;
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const CAT = arg('--cat', 'phones'), IDS = arg('--ids', ''), JSON_OUT = arg('--json', ''), LIB = process.argv.includes('--library');
const idx = JSON.parse(readFileSync(ROOT + 'assets/showcase/index.json', 'utf8'));
const lib = JSON.parse(readFileSync(ROOT + 'assets/library-ads/index.json', 'utf8')).items;
const ids = IDS ? IDS.split(',') : idx.filter(c => live(c) && lib[c.id] && (CAT === 'all' || c.cat === CAT)).map(c => c.id);

const { browser, page } = await openStudio();
if (LIB) await installLibraryFinish(page);
const out = {};
for (const id of ids) {
  out[id] = await page.evaluate(async (id, lib) => {
    const t0 = await __sc.load(id), t = lib ? __lib.copy(t0) : t0;
    if (lib) __lib.on = true;
    const { sc } = __sc.paint(t);
    const W = sc.width, H = sc.height, ctx = sc.lowerCanvasEl.getContext('2d');
    const objs = sc.getObjects();
    const box = o => { const b = o.getBoundingRect(true, true); return { l: b.left, t: b.top, r: b.left + b.width, b: b.top + b.height }; };
    /* plates: solid shapes smaller than most of the card, drawn under a line */
    const solid = o => o.visible !== false && (o.opacity == null || o.opacity >= 0.5) && !o.pgScrim && !o.pgBgRect
      && /^(rect|path|circle|ellipse|polygon)$/.test(o.type) && (() => { const f = String(o.fill || ''); return f && f !== 'transparent' && !/rgba\([^)]*,\s*0(\.[0-4]\d*)?\)$/.test(f); })();
    const plates = objs.map((o, i) => ({ o, i, b: box(o) })).filter(p => solid(p.o) && (p.b.r - p.b.l) * (p.b.b - p.b.t) < 0.6 * W * H && (p.b.r - p.b.l) > 40 && (p.b.b - p.b.t) > 30);
    const lines = objs.map((o, i) => ({ o, i })).filter(x => typeof x.o.text === 'string' && /[A-Za-z0-9]/.test(x.o.text) && x.o.visible !== false && (x.o.pgRole || '') !== 'deco' && !x.o.pgKin && !x.o.pgKinId);
    sc.renderAll();
    const full = ctx.getImageData(0, 0, W, H).data;
    const found = [], inks = [];
    for (const { o, i } of lines) {
      const b = box(o), x0 = Math.max(0, Math.floor(b.l) - 4), y0 = Math.max(0, Math.floor(b.t) - 4), x1 = Math.min(W, Math.ceil(b.r) + 4), y1 = Math.min(H, Math.ceil(b.b) + 4);
      if (x1 - x0 < 2 || y1 - y0 < 2) continue;
      o.visible = false; sc.renderAll();
      const without = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
      o.visible = true;
      let l = W, tp = H, r = -1, bt = -1;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const q = (y * W + x) * 4, k = ((y - y0) * (x1 - x0) + (x - x0)) * 4;
        if (Math.abs(full[q] - without[k]) + Math.abs(full[q + 1] - without[k + 1]) + Math.abs(full[q + 2] - without[k + 2]) > 60) {
          if (x < l) l = x; if (x > r) r = x; if (y < tp) tp = y; if (y > bt) bt = y;
        }
      }
      if (r < 0) continue;
      const ink = { l, t: tp, r: r + 1, b: bt + 1 }, ih = ink.b - ink.t, cx = (ink.l + ink.r) / 2, cy = (ink.t + ink.b) / 2;
      const name = o.name || o.pgRole || 'text', role = o.pgRole || '';
      /* the plate under it: drawn earlier, holding the letters' middle */
      const under = plates.filter(p => p.i < i && cx >= p.b.l && cx <= p.b.r && cy >= p.b.t && cy <= p.b.b).pop();
      if (under) {
        /* the sides measured across, at the top and bottom rows of the letters, to the plate's
           own outline: where a rounded corner or a pill's end curves in, the outline is nearer */
        const p = under.b, rad = Math.min(under.o.rx || 0, (p.r - p.l) / 2, (p.b - p.t) / 2);
        const inset = y => { const dy = Math.max(0, p.t + rad - y, y - (p.b - rad)); return dy >= rad ? rad : rad - Math.sqrt(rad * rad - dy * dy); };
        const side = Math.max(inset(ink.t), inset(ink.b));
        const pad = { top: ink.t - p.t, bottom: p.b - ink.b, left: ink.l - p.l - side, right: p.r - side - ink.r };
        /* a headline on a highlight bar is a slab that hugs its type by design: a tenth of the
           letters' height; every other line on a box: a fifth over and under, a quarter at the sides */
        const slab = role === 'headline';
        const needV = slab ? Math.max(8, 0.1 * ih) : Math.max(12, 0.18 * ih), needH = slab ? Math.max(10, 0.12 * ih) : Math.max(14, 0.25 * ih);
        if (Object.values(pad).some(v => v < 0)) found.push({ code: 'straddle', line: name, role, plate: under.o.name || under.o.type, pad: Object.fromEntries(Object.entries(pad).map(([k, v]) => [k, Math.round(v)])) });
        else {
          const tight = Object.entries(pad).filter(([k, v]) => v < ((k === 'top' || k === 'bottom') ? needV : needH)).map(([k, v]) => k + ' ' + Math.round(v));
          if (tight.length) found.push({ code: 'tight', line: name, role, plate: under.o.name || under.o.type, ink: Math.round(ih), sides: tight });
        }
      }
      /* letters that cross into a plate they are not on, drawn under them or over them
         (a badge running into a ribbon); a headline's own highlight bar is not one */
      const cross = plates.find(p => p !== under && ink.l < p.b.r - 1 && ink.r > p.b.l + 1 && ink.t < p.b.b - 1 && ink.b > p.b.t + 1
        && !(p.i < i && ink.t >= p.b.t && ink.b <= p.b.b && ink.l >= p.b.l && ink.r <= p.b.r));
      if (cross && !(under && role === 'headline')) found.push({ code: 'straddle', line: name, role, plate: cross.o.name || cross.o.type });
      const e = Math.min(ink.l, ink.t, W - ink.r, H - ink.b);
      if (e < 32) found.push({ code: 'edge', line: name, role, px: Math.round(e) });
      if (ih < 18 && role !== 'deco') found.push({ code: 'small', line: name, role, px: ih });
      inks.push({ name, role, ink });
    }
    /* two lines whose letters overlap, or come within 6px of each other */
    for (let a = 0; a < inks.length; a++) for (let b = a + 1; b < inks.length; b++) {
      const A = inks[a].ink, B = inks[b].ink;
      const gx = Math.max(A.l - B.r, B.l - A.r), gy = Math.max(A.t - B.b, B.t - A.b);
      if (Math.max(gx, gy) < 6) found.push({ code: Math.max(gx, gy) < 0 ? 'collide' : 'touch', line: inks[a].name + ' / ' + inks[b].name, role: inks[a].role, px: Math.round(Math.max(gx, gy)) });
    }
    sc.dispose();
    return found;
  }, id, LIB);
}
await browser.close();
const bad = Object.entries(out).filter(([, f]) => f.length);
for (const [id, f] of bad) console.log(id.padEnd(24), f.map(x => `${x.code}:${x.line}${x.sides ? ' (' + x.sides.join(', ') + ')' : x.px != null ? ' ' + x.px + 'px' : ''}`).join(' | '));
const codes = {}; bad.forEach(([, f]) => f.forEach(x => { codes[x.code] = (codes[x.code] || 0) + 1; }));
console.log(`\n${ids.length} cards, ${bad.length} with findings`, codes);
if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify(out, null, 1) + '\n');
process.exit(bad.length ? 1 : 0);
