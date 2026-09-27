#!/usr/bin/env node
/* THE STUDIO'S OWN TEMPLATES, HELD TO THE SHOWCASE'S BAR.
 *
 * The showcase (assets/showcase) is measured by four audits and the landing
 * hides whatever they reject. The templates the studio itself builds at load
 * (the 243 classics in app.js and the offer family in offer-library.js) were
 * never held to that bar: a classic could ship a number at 58px, a product
 * picture stretched to three times its pixels, or a line promising "OFFER IN
 * 10 MINUTES". The owner, 2026-09-27: "Audit any overlapping issues, bad
 * assets, or inaccurate info / flaws. or bad copy gets removed."
 *
 * One paint per template through the studio's own buildLayer()/alignPass()
 * (with the contrast, number and ground tables applied, as a visitor sees it),
 * and the same measures the showcase audits take:
 *
 *   REJECT (the template is held back: template-holds.js, which app.js reads)
 *     cover      a product or a later line over 12% of a line of copy
 *                (audit_showcase_overlap.mjs)
 *     shape      a solid shape drawn over 12% of a line of copy
 *     clip       a line running more than 6px off the card
 *     legib      a headline, number or call to action under 3:1 at the core of
 *                its strokes, or one that never marks the card
 *                (audit_showcase_legibility.mjs)
 *     number, numInk, offPlate, onProduct, thumb, hierarchy, families, faux
 *                the design school (audit_showcase_school.mjs, same thresholds)
 *     asset      a product picture that is flagged (assets/cutout-flags.json:
 *                garbled lettering, the wrong product, cut off, broken), that
 *                did not load, or that is drawn at more than 1.5x its own
 *                pixels on the 1080 card (soft in a Free export, 3x in Pro)
 *     bg         a backdrop photograph the studio could not load
 *     copy       invented proof, a price, invented hours, a dash, a deadline,
 *                an invented fact (refresh_copy.mjs CLAIM), a competitor, a
 *                licence claim, or another deck's goods
 *     device     a phones headline naming a device no product picture shows
 *     repeat     the same line twice
 *   WARN (reported)
 *     upscale    a product drawn at 1.0x to 1.5x its pixels
 *     small, crowded, contrast   as the school
 *
 * usage: node scripts/audit_templates.mjs [--match REGEX] [--write] [--json out.json]
 *   --write rewrites template-holds.js (every template that fails, with why)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { openStudio } from './_showcase_harness.mjs';
import { PROOF, PRICE, HOURS, DASH, BANNED, COMPANY, LICENSE, CLAIM, foreignWords } from './refresh_copy.mjs';
const ROOT = new URL('../', import.meta.url).pathname;
const WRITE = process.argv.includes('--write');
const argv = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const MATCH = argv('--match') ? new RegExp(argv('--match')) : null;
const FLAGS = JSON.parse(readFileSync(ROOT + 'assets/cutout-flags.json', 'utf8'));
const UPSCALE = { fail: 1.5, warn: 1.0 };
/* the design school's thresholds, as audit_showcase_school.mjs sets them (that
   script runs its audit at import, so they are restated here, not imported) */
const T = { number: 72, numInk: 3, onProduct: 0.12, offPlate: 0.08, thumb: 8, hierarchy: 1.3, families: 2,
  small: 25.2, margin: 0.06, align: 4, empty: 0.25, contrast: 4.5, tile: 160 };

/* weights each face ships (faux = asking for a heavier one) */
const WEIGHTS = {
  'Unbounded': [500, 900], 'Bricolage Grotesque': [500, 800], 'Sofia Sans Extra Condensed': [500, 900], 'Schibsted Grotesk': [400, 900],
  'Gloock': [400], 'Young Serif': [400], 'Tilt Warp': [400], 'JetBrains Mono': [400, 700], 'Big Shoulders Display': [600, 700],
  'Satoshi': [400, 500, 700, 900], 'Clash Display': [500, 600, 700], 'Khand': [600, 700], 'Melodrama': [500, 700], 'Zodiak': [400, 700],
  'Manrope': [400, 500, 700], 'Chivo': [400, 500, 700, 900], 'Libre Franklin': [400, 500, 700, 900], 'Instrument Sans': [400, 500, 700],
  'Zilla Slab': [400, 700], 'DM Mono': [400], 'Sora': [400, 500, 700],
};
const SAYS = s => { s = String(s).toUpperCase(); const o = [];
  if (/\bIPHONES?\b/.test(s)) o.push('iphone'); if (/\bIPADS?\b/.test(s)) o.push('ipad');
  if (/\bMACBOOKS?\b|\bMACS?\b|\bIMACS?\b/.test(s)) o.push('mac'); if (/\bAPPLE WATCH(ES)?\b/.test(s)) o.push('watch'); return o; };
const SHOWS = src => { const f = String(src || '').toLowerCase().replace(/^.*\//, '');
  return /watch/.test(f) ? 'watch' : /ipad/.test(f) ? 'ipad' : /macbook|imac|mac-/.test(f) ? 'mac' : /iphone|ip-|qs-/.test(f) ? 'iphone' : null; };

const { browser, page, errors } = await openStudio('&noholds=1');
/* the three tables are fetched after boot; wait until each has landed */
await page.waitForFunction(() => {
  const f = id => TEMPLATES.find(t => t.id === id);
  const n = f('neon_sell'), g = f('bold_buyer');
  return Array.isArray(CONTRAST_FIX) && CONTRAST_FIX.length
    && n && n.layers.some(l => l.role === 'phone' && l.props.fontSize === 98)
    && g && g.bg && g.bg.scrim === 0.697;
}, { timeout: 90000 }).catch(() => console.log('(the fix tables did not all land; measuring what the page has)'));
const ids = (await page.evaluate(() => TEMPLATES.filter(t => !/^(sc|hx)-/.test(t.id)).map(t => t.id))).filter(id => !MATCH || MATCH.test(id));
await page.evaluate(T => { window.__T = T; }, T);
const out = {};
for (let i = 0; i < ids.length; i += 6){
  Object.assign(out, await page.evaluate(async (batch, WEIGHTS) => {
    const T = window.__T, R = {};
    const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const lum = (d, k) => 0.2126 * lin(d[k]) + 0.7152 * lin(d[k + 1]) + 0.0722 * lin(d[k + 2]);
    const READ = { headline:1, phone:1, cta:1, info:1, badges:1, sub:1, website:1, offer:1, user:1 };
    const CRIT = { headline:1, phone:1, cta:1 };
    for (const id of batch){
      try {
        const base = TEMPLATES.find(x => x.id === id);
        const t = await __sc.prep({ base: id, tpl: { cat: base.cat } }, id);
        const { sc, refs, bgMissing } = __sc.paint(t);
        const W = TPL_W, H = TPL_H, ctx = sc.lowerCanvasEl.getContext('2d');
        const full = ctx.getImageData(0, 0, W, H).data;
        const box = o => { const b = o.getBoundingRect(true, true); return { x: b.left, y: b.top, w: b.width, h: b.height }; };
        const area = b => Math.max(0, b.w) * Math.max(0, b.h);
        const inter = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
        const op = l => (l.props && l.props.opacity !== undefined ? l.props.opacity : 1);
        const objs = t.layers.map((l, k) => ({ l, k, o: refs[k] })).filter(z => z.o);
        const texts = objs.filter(z => typeof z.l.text === 'string' && /[A-Za-z0-9]/.test(z.l.text) && z.o.visible !== false && op(z.l) >= 0.5)
          .map(z => Object.assign(z, { b: box(z.o), px: (z.o.fontSize || (z.l.props && z.l.props.fontSize) || 0) * (z.o.scaleY || 1), role: z.l.role || '',
            fam: z.o.fontFamily || (z.l.props && z.l.props.fontFamily) || null }));
        const read = texts.filter(x => READ[x.role]);

        /* ── overlap (audit_showcase_overlap.mjs) ── */
        const covers = objs.filter(z => (z.l.kind === 'cutout' || (typeof z.l.text === 'string' && READ[z.l.role])) && op(z.l) >= 0.5 && !z.l.__wall);
        const SHAPE = { rect:1, circle:1, path:1, triangle:1, polygon:1, ellipse:1, image:1, svg:1 };
        const shapes = objs.filter(z => SHAPE[z.l.kind] && !z.l.__wall && !(z.l.kind === 'path' && /Frame|Corner|Bracket/i.test(z.l.name || ''))
          && op(z.l) >= 0.5 && area(box(z.o)) < W * H * 0.5
          && !(z.l.props && !z.l.props.grad && !z.l.grad && (!z.l.props.fill || z.l.props.fill === 'transparent' || /rgba\([^)]*,\s*0(\.0+)?\)$/.test(String(z.l.props.fill)))));
        let cover = 0, coverBy = null, shapeCover = 0, shapeBy = null, clip = 0;
        read.filter(x => area(x.b) >= 400).forEach(x => {
          clip = Math.max(clip, -x.b.x, -x.b.y, x.b.x + x.b.w - W, x.b.y + x.b.h - H);
          covers.forEach(z => { if (z.k <= x.k) return; const f = inter(x.b, box(z.o)) / area(x.b); if (f > cover){ cover = f; coverBy = (z.l.name || z.l.kind) + ' over ' + (x.l.name || x.role); } });
          shapes.forEach(z => { if (z.k <= x.k) return; const f = inter(x.b, box(z.o)) / area(x.b); if (f > shapeCover){ shapeCover = f; shapeBy = (z.l.name || z.l.kind) + ' over ' + (x.l.name || x.role); } });
        });

        /* ── ink: line core (legibility audit) and letter by letter (school) ── */
        const lineCore = x => {
          const b = x.b, x0 = Math.max(0, Math.floor(b.x)), y0 = Math.max(0, Math.floor(b.y));
          const x1 = Math.min(W, Math.ceil(b.x + b.w)), y1 = Math.min(H, Math.ceil(b.y + b.h));
          if (x1 - x0 < 4 || y1 - y0 < 4) return null;
          x.o.visible = false; sc.renderAll();
          const wo = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
          x.o.visible = true;
          const px = []; let total = 0;
          for (let y = y0; y < y1; y++) for (let xx = x0; xx < x1; xx++){
            const f = (y * W + xx) * 4, g = ((y - y0) * (x1 - x0) + (xx - x0)) * 4; total++;
            if (Math.abs(full[f] - wo[g]) + Math.abs(full[f + 1] - wo[g + 1]) + Math.abs(full[f + 2] - wo[g + 2]) < 24) continue;
            const a = lum(full, f), c = lum(wo, g); px.push((Math.max(a, c) + 0.05) / (Math.min(a, c) + 0.05));
          }
          px.sort((p, q) => p - q);
          return { cov: total ? px.length / total : 0, core: px.length ? px[Math.min(px.length - 1, Math.floor(px.length * 0.75))] : 0 };
        };
        const letters = x => {
          const b = x.b, pad = 2;
          const x0 = Math.max(0, Math.floor(b.x) - pad), y0 = Math.max(0, Math.floor(b.y) - pad);
          const x1 = Math.min(W, Math.ceil(b.x + b.w) + pad), y1 = Math.min(H, Math.ceil(b.y + b.h) + pad);
          const w = x1 - x0, h = y1 - y0; if (w < 8 || h < 8) return null;
          x.o.visible = false; sc.renderAll();
          const wo = ctx.getImageData(x0, y0, w, h).data;
          x.o.visible = true;
          const step = Math.max(8, 0.55 * x.px);
          let worst = 99, any = 0;
          for (let c0 = 0; c0 < w; c0 += step){
            const c1 = Math.min(w, c0 + step), v = [];
            for (let y = 0; y < h; y++) for (let xx = Math.floor(c0); xx < Math.ceil(c1); xx++){
              const f = ((y + y0) * W + (xx + x0)) * 4, g = (y * w + xx) * 4;
              if (Math.abs(full[f] - wo[g]) + Math.abs(full[f + 1] - wo[g + 1]) + Math.abs(full[f + 2] - wo[g + 2]) < 24) continue;
              const a = lum(full, f), c = lum(wo, g); v.push((Math.max(a, c) + 0.05) / (Math.min(a, c) + 0.05));
            }
            if (v.length < Math.max(12, 0.03 * step * h)) continue;
            v.sort((p, q) => p - q); worst = Math.min(worst, v[Math.floor(v.length * 0.75)]); any++;
          }
          return any ? +worst.toFixed(2) : null;
        };
        let legib = 99, legibBy = null, ghost = 0;
        read.filter(x => CRIT[x.role]).forEach(x => { const r = lineCore(x); if (!r) return;
          if (r.cov < 0.012){ ghost++; return; }
          if (r.core < legib){ legib = r.core; legibBy = x.role + ' "' + String(x.l.text).slice(0, 24).replace(/\n/g, ' / ') + '"'; } });
        const crit = read.filter(x => CRIT[x.role]); crit.forEach(x => { x.worst = letters(x); });
        const minor = read.filter(x => !CRIT[x.role] && x.px >= 18); minor.forEach(x => { x.worst = letters(x); });
        sc.renderAll();

        /* ── the school ── */
        const phone = read.find(x => x.role === 'phone');
        const heads = read.filter(x => x.role === 'headline');
        const headPx = heads.length ? Math.max(...heads.map(x => x.px)) : 0;
        const nextPx = Math.max(0, ...read.filter(x => x.role !== 'headline' && (String(x.l.text).match(/[A-Za-z0-9]/g) || []).length >= 3).map(x => x.px));
        let onProduct = 0, offPlate = 0;
        if (phone) objs.forEach(z => { if (z.l.kind !== 'cutout' || z.k > phone.k || op(z.l) < 0.5 || z.l.__wall) return;
          onProduct = Math.max(onProduct, inter(phone.b, box(z.o)) / Math.max(1, area(phone.b))); });
        if (phone){
          const b = phone.b, cx = b.x + b.w / 2; let plate = null;
          objs.forEach(z => { if (z.k >= phone.k || z.l.kind !== 'rect' || !z.l.props) return;
            const f = String(z.l.props.fill || ''); if (!f || f === 'transparent' || /rgba\([^)]*,\s*0(\.[0-4]\d*)?\)$/.test(f)) return;
            const c = box(z.o); if (c.w * c.h > 0.6 * W * H) return;
            if (cx >= c.x && cx <= c.x + c.w && c.y < b.y + b.h && c.y + c.h > b.y) plate = c; });
          if (plate){
            const x0 = Math.max(0, Math.floor(b.x)), y0 = Math.max(0, Math.floor(b.y)), w = Math.min(W, Math.ceil(b.x + b.w)) - x0, h = Math.min(H, Math.ceil(b.y + b.h)) - y0;
            sc.renderAll(); const on = ctx.getImageData(x0, y0, w, h).data; phone.o.visible = false; sc.renderAll();
            const off = ctx.getImageData(x0, y0, w, h).data; phone.o.visible = true; sc.renderAll();
            let ink = 0, out = 0;
            for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){ const q = (y * w + x) * 4;
              if (Math.abs(on[q] - off[q]) + Math.abs(on[q + 1] - off[q + 1]) + Math.abs(on[q + 2] - off[q + 2]) < 90) continue;
              ink++; const X = x + x0, Y = y + y0; if (X < plate.x || X > plate.x + plate.w || Y < plate.y || Y > plate.y + plate.h) out++; }
            offPlate = ink ? out / ink : 0;
          }
        }
        const fams = new Set(texts.filter(x => /[A-Za-z0-9]{2}/.test(x.l.text) && x.fam).map(x => x.fam));
        const faux = texts.filter(x => { const w = WEIGHTS[x.fam]; if (!w) return false;
          const fw = x.o.fontWeight ?? (x.l.props && x.l.props.fontWeight) ?? 400;
          const ask = fw === 'bold' ? 700 : fw === 'normal' ? 400 : +fw || 400; return ask > Math.max(...w) + 50; })
          .map(x => x.fam + ' ' + (x.o.fontWeight ?? (x.l.props && x.l.props.fontWeight)));
        const G = 20, gw = Math.ceil(W / G), gh = Math.ceil(H / G), occ = new Uint8Array(gw * gh);
        objs.forEach(z => { if (z.o.visible === false || op(z.l) < 0.35 || ['vignette', 'grain', 'scrim'].includes(z.l.kind)) return;
          const b = box(z.o); if (b.w * b.h > 0.6 * W * H) return; if (typeof z.l.text === 'string' && !z.l.text.trim()) return;
          for (let gy = Math.max(0, Math.floor(b.y / G)); gy < Math.min(gh, Math.ceil((b.y + b.h) / G)); gy++)
            for (let gx = Math.max(0, Math.floor(b.x / G)); gx < Math.min(gw, Math.ceil((b.x + b.w) / G)); gx++) occ[gy * gw + gx] = 1; });
        let used = 0; for (let q = 0; q < occ.length; q++) used += occ[q];

        /* ── assets: every product picture, its pixels against its drawn size ── */
        const cuts = t.layers.map((l, k) => ({ l, o: refs[k] })).filter(z => z.l.kind === 'cutout' && z.l.props && z.l.props.src).map(z => {
          const src = z.l.props.src, el = CUTOUT_ELS[src];
          const missing = !el || !el.width || !z.o || z.o.type !== 'image';
          return { src: src.replace(/^.*\//, '').replace(/\.webp$/, ''), missing, scale: missing ? null : +((z.o.scaleX || 1)).toFixed(2),
            native: missing ? null : [el.naturalWidth || el.width, el.naturalHeight || el.height] };
        });
        const worstOf = a => { const v = a.map(x => x.worst).filter(v => v != null); return v.length ? Math.min(...v) : null; };
        R[id] = {
          cat: t.cat, name: base.name, tag: base.tag || '',
          cover: +cover.toFixed(3), coverBy, shapeCover: +shapeCover.toFixed(3), shapeBy, clip: Math.round(Math.max(0, clip)),
          legib: +legib.toFixed(2), legibBy, ghost, bgMissing: !!bgMissing,
          num: phone ? +phone.px.toFixed(1) : 0, numInk: phone ? phone.worst : null, letters: worstOf(crit), minorInk: worstOf(minor),
          onProduct: +onProduct.toFixed(3), offPlate: +offPlate.toFixed(3),
          headTile: +(headPx * 0.7 * T.tile / W).toFixed(1), hierarchy: nextPx ? +(headPx / nextPx).toFixed(2) : 9,
          families: fams.size, famList: [...fams], faux,
          minPx: read.length ? +Math.min(...read.map(x => x.px)).toFixed(1) : 0, empty: +(1 - used / occ.length).toFixed(3),
          heads: heads.map(x => x.l.text).join(' / '), cuts,
          words: t.layers.filter(l => typeof l.text === 'string' && l.role !== 'website').map(l => l.text),
          /* the same WORDS twice: reading lines only (a row of arrows or a ticker that
             runs twice across the card is decoration) */
          lines: t.layers.filter(l => typeof l.text === 'string' && READ[l.role] && /[A-Za-z]{2}/.test(l.text) && !/marquee|ticker/i.test(l.name || '')).map(l => l.text.trim().toUpperCase()),
        };
        sc.dispose();
      } catch (e){ R[id] = { err: String(e).slice(0, 160) }; }
    }
    return R;
  }, ids.slice(i, i + 6), WEIGHTS));
  if (i % 60 === 0) console.log('…' + Math.min(ids.length, i + 6) + '/' + ids.length);
}
await browser.close();

const verdict = r => {
  const fail = [], warn = [];
  if (r.err) return { fail: ['error'], warn };
  if (r.cover >= 0.12) fail.push('cover');
  if (r.shapeCover >= 0.12) fail.push('shape');
  if (r.clip > 6) fail.push('clip');
  if (r.legib < 3 || r.ghost) fail.push('legib');
  if (r.num < T.number) fail.push('number');
  if (r.numInk != null && r.numInk < T.numInk) fail.push('numInk');
  if (r.offPlate > T.offPlate) fail.push('offPlate');
  if (r.onProduct > T.onProduct) fail.push('onProduct');
  if (r.headTile < T.thumb) fail.push('thumb');
  if (r.hierarchy < T.hierarchy) fail.push('hierarchy');
  if (r.families > T.families) fail.push('families');
  if (r.faux.length) fail.push('faux');
  if (r.cuts.some(c => c.missing || FLAGS[c.src] || c.scale > UPSCALE.fail)) fail.push('asset');
  else if (r.cuts.some(c => c.scale > UPSCALE.warn)) warn.push('upscale');
  if (r.bgMissing) fail.push('bg');
  const words = r.words.join('\n');
  if (PROOF.test(words) || PRICE.test(words) || HOURS.test(words) || DASH.test(words) || BANNED.test(words) || CLAIM.test(words)
      || COMPANY.test(words) || LICENSE.test(words) || foreignWords(r.cat, words).length) fail.push('copy');
  const says = SAYS(r.heads), shows = [...new Set(r.cuts.map(c => SHOWS(c.src)).filter(Boolean))];
  if (r.cat === 'phones' && says.length && shows.length && !says.some(d => shows.includes(d))) fail.push('device');
  if (r.lines.length !== new Set(r.lines).size) fail.push('repeat');
  if (r.minPx < T.small) warn.push('small');
  if (r.empty < T.empty) warn.push('crowded');
  if ((r.letters != null && r.letters < T.contrast) || (r.minorInk != null && r.minorInk < T.contrast)) warn.push('contrast');
  return { fail, warn };
};
const rows = ids.map(id => ({ id, r: out[id] || { err: 'none' } })).map(x => Object.assign(x, verdict(x.r)));
const count = (k, list) => rows.filter(x => x[list].includes(k)).length;
const fam = id => id.startsWith('of_') ? 'offer' : id.startsWith('dl_') ? 'designer' : id.startsWith('st_') ? 'street' : 'hand';
console.log(`\naudited ${rows.length} · page errors ${errors.length} · errors ${rows.filter(x => x.r.err).length}`);
console.log('REJECT');
['cover', 'shape', 'clip', 'legib', 'number', 'numInk', 'offPlate', 'onProduct', 'thumb', 'hierarchy', 'families', 'faux', 'asset', 'bg', 'copy', 'device', 'repeat']
  .forEach(k => { const n = count(k, 'fail'); if (n) console.log('  ' + k.padEnd(10) + String(n).padStart(4)); });
console.log('WARN');
['upscale', 'small', 'crowded', 'contrast'].forEach(k => console.log('  ' + k.padEnd(10) + String(count(k, 'warn')).padStart(4)));
const byFam = {}; rows.forEach(x => { const f = fam(x.id); byFam[f] ||= { all: 0, pass: 0 }; byFam[f].all++; if (!x.fail.length) byFam[f].pass++; });
console.log('pass by family: ' + Object.entries(byFam).map(([f, v]) => f + ' ' + v.pass + '/' + v.all).join(' · '));
const held = rows.filter(x => x.fail.length);
held.slice(0, 40).forEach(x => console.log('  held ' + x.id.padEnd(34) + x.fail.join('+') + (x.r.coverBy && x.fail.includes('cover') ? '  [' + x.r.coverBy + ']' : '')
  + (x.fail.includes('asset') ? '  [' + x.r.cuts.map(c => c.src + (c.missing ? ' missing' : FLAGS[c.src] ? ' flagged' : ' x' + c.scale)).join(', ') + ']' : '')));
if (argv('--json')) writeFileSync(argv('--json'), JSON.stringify(Object.fromEntries(rows.map(x => [x.id, Object.assign({ fail: x.fail, warn: x.warn }, x.r)]))));
if (WRITE){
  if (MATCH) { console.log('--write needs the whole set (no --match): the file is the complete list'); process.exit(1); }
  const holds = Object.fromEntries(held.map(x => [x.id, x.fail.join('+')]));
  writeFileSync(ROOT + 'template-holds.js', '/* generated by scripts/audit_templates.mjs; do not edit by hand.\n'
    + '   Templates the studio builds at load that fail the showcase\'s bar (overlap, legibility, the design school,\n'
    + '   a flagged or stretched product picture, invented copy). app.js leaves them out of TEMPLATES. */\n'
    + 'window.TEMPLATE_HOLDS = ' + JSON.stringify(holds, null, 0).replace(/,"/g, ',\n  "').replace(/^\{/, '{\n  ').replace(/\}$/, '\n}') + ';\n');
  console.log('wrote template-holds.js: ' + held.length + ' held of ' + rows.length);
}
if (errors.length) console.log('page errors:', errors.slice(0, 3));
