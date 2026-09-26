#!/usr/bin/env node
/* THE DESIGN SCHOOL, RUN OVER THE SHOWCASE.
 *
 * The study session of 2026-09-24..26 ("Teaching the Engine Design", in the
 * iPhones.LA repo) wrote the rules of a WE BUY ad down as numbers and said how
 * the Studio should take them: "the critic runs through the existing
 * audit_showcase_*.mjs pass and stamps `defect` on assets/showcase/index.json,
 * which the landing already filters on". This is that critic. Every check is
 * measured through the studio's own buildLayer()/alignPass() on the pixels a
 * visitor sees, and every one returns a number, so a card gets a score and a
 * list, not an opinion.
 *
 *   REJECT (the card is held back; audit_showcase_content.mjs turns it into
 *   `defect`, which the landing filters on)
 *     number     the phone number under 72px on the 1080 canvas: in a 160px
 *                feed tile its digits are under 7.5px, present and unreadable.
 *                The owner, 2026-09-26: the number must be big or medium.
 *     numInk     the number's worst LETTER under 3:1 against what is behind it.
 *                Judged letter by letter, not per line: averaged over a line,
 *                white type passed at 5:1 while two words sat on a light
 *                patch at about 2:1 (the study session's own finding), and on
 *                2026-09-26 it caught numbers half off their own plate (1.2 to
 *                2.2 per letter) that the line average passed.
 *     offPlate   more than 8% of the number's ink outside the plate it stands
 *                on: a number half on its plate and half on the photograph
 *                (alignPass moved the number and not the plate)
 *     onProduct  the number drawn over a product (the video engine's lesson of
 *                the same week: the number never sits on the phones)
 *     thumb      the headline's largest line under 8px tall in a 160px tile
 *                (the study's thumbnail test, at the size of an OfferUp tile)
 *     hierarchy  the headline under 1.3x the next biggest line: it does not win
 *     families   more than two type families
 *     faux       a weight heavier than any file the face ships (rule 20): the
 *                browser fakes it
 *     copy       invented proof, a price figure, invented hours, a dash, a
 *                deadline or a "real person" claim (refresh_copy.mjs)
 *     device     the headline names a device the card does not show (an
 *                iPhone headline over three Apple Watches): say what is bought
 *   WARN (shown, ranked below clean cards, never in the hero wall)
 *     small      reading text under 25px (the study's 28px at 1200)
 *     margin     reading ink inside the 6% safe margin (an open decision in
 *                the study plan: raise 5% to 6%?)
 *     widow      one word alone on the last line of a block
 *     align      more than four distinct alignment positions
 *     crowded    under 25% of the card left empty
 *     contrast   a headline, CTA or support line whose worst letter is under
 *                4.5:1. A warning, not a reject: on outlined, shadowed display
 *                type the letter is ambiguous (fill, stroke and a 19px shadow
 *                all change the pixels), and a measure that cannot tell the
 *                fill from the halo must not hold a readable card back. The
 *                line-level gate (audit_showcase_legibility.mjs, under 3:1 is a
 *                defect) still applies to every headline, number and CTA.
 *
 * usage: node scripts/audit_showcase_school.mjs [--write] [--ids a,b] [--json out.json]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { openStudio } from './_showcase_harness.mjs';
import { PROOF, PRICE, HOURS, DASH, BANNED, COMPANY, LICENSE } from './refresh_copy.mjs';
const ROOT = new URL('../', import.meta.url).pathname;
const WRITE = process.argv.includes('--write');
const argv = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const idx = JSON.parse(readFileSync(ROOT + 'assets/showcase/index.json', 'utf8'));
const only = argv('--ids') ? new Set(argv('--ids').split(',')) : null;
const work = idx.filter(c => !only || only.has(c.id));
export const T = { number: 72, numInk: 3, onProduct: 0.12, offPlate: 0.08, thumb: 8, hierarchy: 1.3, families: 2,
  small: 25.2, margin: 0.06, align: 4, empty: 0.25, contrast: 4.5, tile: 160 };

/* weights each face ships: assets/fonts/faces.css and the house faces */
const WEIGHTS = {
  'Unbounded': [500, 900], 'Bricolage Grotesque': [500, 800], 'Sofia Sans Extra Condensed': [500, 900], 'Schibsted Grotesk': [400, 900],
  'Gloock': [400], 'Young Serif': [400], 'Tilt Warp': [400], 'JetBrains Mono': [400, 700], 'Big Shoulders Display': [600, 700],
  'Satoshi': [400, 500, 700, 900], 'Clash Display': [500, 600, 700], 'Khand': [600, 700], 'Melodrama': [500, 700], 'Zodiak': [400, 700],
};

/* the device a line names, and the device a product picture shows */
const SAYS = s => { s = String(s).toUpperCase(); const o = [];
  if (/\bIPHONES?\b/.test(s)) o.push('iphone'); if (/\bIPADS?\b/.test(s)) o.push('ipad');
  if (/\bMACBOOKS?\b|\bMACS?\b|\bIMACS?\b/.test(s)) o.push('mac'); if (/\bWATCH(ES)?\b/.test(s)) o.push('watch'); return o; };
const SHOWS = src => { const f = String(src || '').toLowerCase().replace(/^.*\//, '');
  return /watch/.test(f) ? 'watch' : /ipad/.test(f) ? 'ipad' : /macbook|imac|mac-/.test(f) ? 'mac' : /iphone|ip-|qs-/.test(f) ? 'iphone' : null; };

const { browser, page, errors } = await openStudio();
await page.evaluate(T => { window.__T = T; }, T);
const out = {};
for (let i = 0; i < work.length; i += 6){
  const ids = work.slice(i, i + 6).map(c => c.id);
  Object.assign(out, await page.evaluate(async (ids, WEIGHTS) => {
    const T = window.__T, R = {};
    const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const lum = (d, k) => 0.2126 * lin(d[k]) + 0.7152 * lin(d[k + 1]) + 0.0722 * lin(d[k + 2]);
    const READ = { headline:1, phone:1, cta:1, info:1, badges:1, sub:1, website:1, offer:1 };
    const CRIT = { headline:1, phone:1, cta:1 };
    for (const id of ids){
      try {
        const t = await __sc.load(id);
        const { sc, refs } = __sc.paint(t);
        const W = TPL_W, H = TPL_H, ctx = sc.lowerCanvasEl.getContext('2d');
        const full = ctx.getImageData(0, 0, W, H).data;
        const box = o => { const b = o.getBoundingRect(true, true); return { x: b.left, y: b.top, w: b.width, h: b.height }; };
        const inter = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
        const texts = [];
        t.layers.forEach((l, k) => {
          const o = refs[k];
          if (!o || typeof l.text !== 'string' || !/[A-Za-z0-9]/.test(l.text) || o.visible === false) return;
          const op = l.props && l.props.opacity !== undefined ? l.props.opacity : 1;
          if (op < 0.5) return;
          texts.push({ k, l, o, b: box(o), px: (o.fontSize || (l.props && l.props.fontSize) || 0) * (o.scaleY || 1), role: l.role || '', fam: o.fontFamily || (l.props && l.props.fontFamily) || null });
        });
        const read = texts.filter(x => READ[x.role]);
        /* LETTER BY LETTER. Paint without the line: the pixels that change are
           the line's footprint, each against the very pixel that was behind it.
           Cut the footprint into letter-wide columns and judge each column by
           the core of its strokes, the upper quartile of its per-pixel
           contrast (the audit_showcase_legibility.mjs measure, per letter). A
           letter off its plate, on a light patch, or crossed by a line scores
           its own column.
           This replaced a ring method (2026-09-26) that read each letter
           against a 3px ring around the whole footprint: the footprint holds
           the number's soft shadow, so on a plate that hugs the digits the ring
           fell on the photograph outside it, and 471 of 971 numbers that read
           at 5-8:1 on their plates "failed" at about 2.5. */
        const letters = x => {
          const b = x.b, pad = 2;
          const x0 = Math.max(0, Math.floor(b.x) - pad), y0 = Math.max(0, Math.floor(b.y) - pad);
          const x1 = Math.min(W, Math.ceil(b.x + b.w) + pad), y1 = Math.min(H, Math.ceil(b.y + b.h) + pad);
          const w = x1 - x0, h = y1 - y0;
          if (w < 8 || h < 8) return null;
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
              const a = lum(full, f), c = lum(wo, g);
              v.push((Math.max(a, c) + 0.05) / (Math.min(a, c) + 0.05));
            }
            if (v.length < Math.max(12, 0.03 * step * h)) continue;        // a gap between letters
            v.sort((p, q) => p - q);
            worst = Math.min(worst, v[Math.floor(v.length * 0.75)]); any++;
          }
          return any ? +worst.toFixed(2) : null;
        };
        sc.renderAll();
        const crit = read.filter(x => CRIT[x.role]);
        crit.forEach(x => { x.worst = letters(x); });
        const minor = read.filter(x => !CRIT[x.role] && x.px >= 18);
        minor.forEach(x => { x.worst = letters(x); });
        sc.renderAll();
        const phone = read.find(x => x.role === 'phone');
        const heads = read.filter(x => x.role === 'headline');
        const headPx = heads.length ? Math.max(...heads.map(x => x.px)) : 0;
        const nextPx = Math.max(0, ...read.filter(x => x.role !== 'headline' && (String(x.l.text).match(/[A-Za-z0-9]/g) || []).length >= 3).map(x => x.px));  // a lone grade numeral is a graphic, not a level
        /* the number over a product: an opaque cutout under the number's box */
        let onProduct = 0;
        if (phone) t.layers.forEach((l, k) => {
          if (l.kind !== 'cutout' || !refs[k] || k > phone.k) return;
          const op = l.props && l.props.opacity !== undefined ? l.props.opacity : 1;
          if (op < 0.5 || l.__wall) return;
          onProduct = Math.max(onProduct, inter(phone.b, box(refs[k])) / Math.max(1, phone.b.w * phone.b.h));
        });
        /* the number off its plate: the last solid, not full-frame rect drawn
           before it that meets its centre; the share of its ink outside it */
        let offPlate = 0;
        if (phone){
          const b = phone.b, cx = b.x + b.w / 2, cy = b.y + b.h / 2;
          let plate = null;
          t.layers.forEach((l, j) => { if (j >= phone.k || !refs[j] || l.kind !== 'rect' || !l.props) return;
            const f = String(l.props.fill || ''); if (!f || f === 'transparent' || /rgba\([^)]*,\s*0(\.[0-4]\d*)?\)$/.test(f)) return;
            const c = box(refs[j]); if (c.w * c.h > 0.6 * W * H) return;
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
        /* faux = a weight HEAVIER than any file the face ships: that is the case
           the browser fakes (synthetic bold) or silently draws lighter than
           designed. A lighter ask resolves to a real, heavier file and fakes
           nothing. The weight comes from the layer when the object has none
           (a curved line is a group of letters): reading it off the group gave
           400 and flagged 93 cards whose type was drawn from a real file. */
        const faux = texts.filter(x => { const w = WEIGHTS[x.fam]; if (!w) return false;
          const fw = x.o.fontWeight ?? (x.l.props && x.l.props.fontWeight) ?? 400;
          const ask = fw === 'bold' ? 700 : fw === 'normal' ? 400 : +fw || 400;
          return ask > Math.max(...w) + 50; }).map(x => x.fam + ' ' + (x.o.fontWeight ?? (x.l.props && x.l.props.fontWeight)));
        const M = T.margin * W;
        const margin = read.filter(x => x.b.x < M - 2 || x.b.y < M - 2 || x.b.x + x.b.w > W - M + 2 || x.b.y + x.b.h > H - M + 2).length;
        const widow = read.filter(x => { const lines = (x.o._textLines || String(x.l.text).split('\n').map(s => s.split(''))).map(a => (Array.isArray(a) ? a.join('') : String(a)).trim()).filter(Boolean);
          const words = lines.join(' ').split(/\s+/).filter(Boolean); return lines.length >= 2 && words.length >= 3 && lines[lines.length - 1].split(/\s+/).length === 1; }).map(x => x.l.name);
        const anchors = new Set(read.map(x => { const ox = x.o.originX || 'left'; const ax = ox === 'center' ? x.b.x + x.b.w / 2 : ox === 'right' ? x.b.x + x.b.w : x.b.x; return ox + Math.round(ax / 12); }));
        /* empty: a 20px grid, marked by every visible thing that is not the ground */
        const G = 20, gw = Math.ceil(W / G), gh = Math.ceil(H / G), occ = new Uint8Array(gw * gh);
        t.layers.forEach((l, k) => {
          const o = refs[k]; if (!o || o.visible === false) return;
          const op = l.props && l.props.opacity !== undefined ? l.props.opacity : 1;
          if (op < 0.35 || ['vignette', 'grain', 'scrim'].includes(l.kind)) return;
          const b = box(o); if (b.w * b.h > 0.6 * W * H) return;
          if (typeof l.text === 'string' && !l.text.trim()) return;
          for (let gy = Math.max(0, Math.floor(b.y / G)); gy < Math.min(gh, Math.ceil((b.y + b.h) / G)); gy++)
            for (let gx = Math.max(0, Math.floor(b.x / G)); gx < Math.min(gw, Math.ceil((b.x + b.w) / G)); gx++) occ[gy * gw + gx] = 1;
        });
        let used = 0; for (let q = 0; q < occ.length; q++) used += occ[q];
        const cut = t.layers.filter((l, k) => l.kind === 'cutout' && refs[k] && !l.__wall && !((l.props && l.props.opacity !== undefined ? l.props.opacity : 1) < 0.5)).map(l => l.props && l.props.src);
        const worstOf = a => { const v = a.map(x => x.worst).filter(v => v != null); return v.length ? Math.min(...v) : null; };
        R[id] = {
          num: phone ? +phone.px.toFixed(1) : 0,
          numTile: phone ? +(phone.px * 0.7 * T.tile / W).toFixed(1) : 0,
          numInk: phone ? phone.worst : null,
          letters: worstOf(crit),
          lines: crit.concat(minor).map(x => [x.l.name, x.role, x.worst, Math.round(x.px)]),
          ctaInk: worstOf(crit.filter(x => x.role === 'cta')),
          minorInk: worstOf(minor),
          onProduct: +onProduct.toFixed(3),
          offPlate: +offPlate.toFixed(3),
          headTile: +(headPx * 0.7 * T.tile / W).toFixed(1),
          hierarchy: nextPx ? +(headPx / nextPx).toFixed(2) : 9,
          families: fams.size, famList: [...fams],
          faux,
          minPx: read.length ? +Math.min(...read.map(x => x.px)).toFixed(1) : 0,
          margin, widow, align: anchors.size,
          empty: +(1 - used / occ.length).toFixed(3),
          heads: heads.map(x => x.l.text).join(' / '),
          cutouts: cut,
        };
        sc.dispose();
      } catch (e){ R[id] = { err: String(e).slice(0, 160) }; }
    }
    return R;
  }, ids, WEIGHTS));
  if (i % 120 === 0) console.log('…' + (i + ids.length) + '/' + work.length);
}
await browser.close();

/* the verdict, card by card */
const verdict = (c, r) => {
  const fail = [], warn = [];
  if (r.err) return { fail: ['error'], warn };
  if (r.num < T.number) fail.push('number');
  if (r.numInk != null && r.numInk < T.numInk) fail.push('numInk');

  if (r.onProduct > T.onProduct) fail.push('onProduct');
  if (r.offPlate > T.offPlate) fail.push('offPlate');
  if (r.headTile < T.thumb) fail.push('thumb');
  if (r.hierarchy < T.hierarchy) fail.push('hierarchy');
  if (r.families > T.families) fail.push('families');
  if (r.faux.length) fail.push('faux');
  let rec = null; try { rec = JSON.parse(readFileSync(ROOT + 'assets/showcase/tpl/' + c.id + '.json', 'utf8')); } catch (e){}
  if (rec){
    const words = rec.tpl.layers.filter(l => typeof l.text === 'string' && l.role !== 'website').map(l => l.text).join('\n');
    if (PROOF.test(words) || PRICE.test(words) || HOURS.test(words) || DASH.test(words) || BANNED.test(words) || COMPANY.test(words) || LICENSE.test(words)) fail.push('copy');
    /* say what is bought: a phones card whose headline names a device that none of its products is */
    const says = SAYS(r.heads), shows = [...new Set(r.cutouts.map(SHOWS).filter(Boolean))];
    if (c.cat === 'phones' && says.length && shows.length && !says.some(d => shows.includes(d))) fail.push('device');
  }
  if (r.minPx < T.small) warn.push('small');
  if (r.margin) warn.push('margin');
  if (r.widow.length) warn.push('widow');
  if (r.align > T.align) warn.push('align');
  if (r.empty < T.empty) warn.push('crowded');
  if ((r.letters != null && r.letters < T.contrast) || (r.minorInk != null && r.minorInk < T.contrast)) warn.push('contrast');
  return { fail, warn };
};
const rows = work.map(c => ({ c, r: out[c.id] || { err: 'none' } })).map(x => Object.assign(x, verdict(x.c, x.r)));
const count = (key, list) => rows.filter(x => x[list].includes(key)).length;
const live = x => !x.c.defect;
console.log(`\naudited ${rows.length} · page errors ${errors.length} · errors ${rows.filter(x => x.r.err).length}`);
console.log('REJECT (all cards / cards live before this audit)');
['number', 'numInk', 'offPlate', 'onProduct', 'thumb', 'hierarchy', 'families', 'faux', 'copy', 'device'].forEach(k =>
  console.log('  ' + k.padEnd(10) + String(count(k, 'fail')).padStart(4) + ' / ' + String(rows.filter(x => live(x) && x.fail.includes(k)).length).padStart(4)));
console.log('WARN');
['small', 'margin', 'widow', 'align', 'crowded', 'contrast'].forEach(k => console.log('  ' + k.padEnd(10) + String(count(k, 'warn')).padStart(4)));
const clean = rows.filter(x => !x.fail.length), pure = clean.filter(x => !x.warn.length);
console.log(`pass ${clean.length} (${pure.length} with no warning) · held back ${rows.length - clean.length}`);
const med = a => { const s = a.filter(v => v != null).sort((p, q) => p - q); return s.length ? s[Math.floor(s.length / 2)] : null; };
console.log(`median number ${med(rows.map(x => x.r.num))}px (${med(rows.map(x => x.r.numTile))}px in a ${T.tile}px tile) · median worst letter: number ${med(rows.map(x => x.r.numInk))}, critical ${med(rows.map(x => x.r.letters))}`);
if (argv('--json')) writeFileSync(argv('--json'), JSON.stringify(out));
if (WRITE){
  const by = Object.fromEntries(rows.map(x => [x.c.id, x]));
  idx.forEach(c => { const x = by[c.id]; if (!x || x.r.err) return;
    c.num = x.r.num; c.numInk = x.r.numInk; c.letters = x.r.letters;
    c.school = { fail: x.fail, warn: x.warn };
  });
  writeFileSync(ROOT + 'assets/showcase/index.json', JSON.stringify(idx));
  console.log('wrote num / numInk / letters / school onto ' + rows.length + ' index rows');
}
if (errors.length) console.log('page errors:', errors.slice(0, 3));
