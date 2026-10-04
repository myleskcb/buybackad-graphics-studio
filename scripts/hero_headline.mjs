#!/usr/bin/env node
/* THE HEADLINE IS THE HERO (DESIGN-LAW 111).
 *
 * The owner, 2026-10-03, over stepsFlow-du01-20 (one word, "iPHONE", at the
 * top left of a Steps card): "How many times do I have to tell you this is
 * not a hero. It's tiny little text that looks extremely out of place
 * compared to every other graphic seriously????"
 *
 * The gate's thumbnail test (pgCheck 'thumb') reads the headline's FONT size,
 * and a 104px extra-condensed word passes it. What the owner sees is how
 * much of the card the headline's letters cover. Measured on the 329 live
 * cards (letters' boxes, textInkRect): the median headline covers 99k px²
 * of the 1080 square, the tenth percentile 46k. Four Steps cards covered
 * 14k to 24k (du01-20, jw05-31, du03-35, pp09-35).
 *
 * For each card this grows the headline lines together, as one block, by the
 * largest factor the card allows, measured on the real render (__sc.paint)
 * after every layout pass:
 *   - the block keeps its left edge (its centre, if it was centred), and its
 *     top may rise in quarters of the way to the 6% guide;
 *   - its letters stay inside the guides, 38px (3.5%) off every object they
 *     were off (copy, the product, plates, the badge), on the plate they stood
 *     on, and on the same ground (a label in a photograph); nothing else on
 *     the card moves or goes (a pass pushing a row down, or leaving the product
 *     out for want of room, is a collision);
 *   - a small mark set beside it (a sparkle) moves with the edge it sat by;
 *   - a grey headline under 4.5:1 takes the card's near-white (near-black on
 *     a light ground): a hero reads;
 *   - no headline line's contrast falls (its 75th percentile and its worst
 *     letter, from the gate's own measure), which keeps a headline printed on
 *     a label in a photograph on the label.
 * The candidates then go through gateRecords, and only what the gate accepts
 * is written.
 *   node scripts/hero_headline.mjs [--ids a,b | --live] [--max 3.5] [--write]
 * Without --ids: every Steps Flow record whose headline letters cover under
 * HERO_MIN (--live: every live library card under it). Prints before and
 * after coverage; --write writes the records. */
import { openStudio, gateRecords, gateSummary } from './_showcase_harness.mjs';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
/* px² of headline letters on the 1080 square. The four the owner's words fit
   covered 14k to 24k; the CASH IN / 3 STEPS cards, which read as heroes, 41k
   to 46k; the live library's median 99k, its tenth percentile 46k */
const HERO_MIN = 30000;
const KMAX = +(arg('--max') || 3.5), WRITE = process.argv.includes('--write');
const DIR = 'assets/showcase/tpl/';
const { browser, page } = await openStudio();

/* in the page: the headline's letters, and everything it must keep off */
await page.evaluate(() => {
  window.__hero = {
    scene(t){
      const { sc } = __sc.paint(t), objs = sc.getObjects(), W = TPL_W, H = TPL_H;
      const isText = o => o.type === 'i-text' || o.type === 'text' || o.type === 'textbox';
      const box = o => { o.setCoords(); const r = o.getBoundingRect(true, true); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
      const ink = o => { const r = textInkRect(o); return r ? { x: r.left, y: r.top, w: r.width, h: r.height } : box(o); };
      const heads = objs.filter(o => isText(o) && o.pgRole === 'headline' && o.visible !== false && /[A-Za-z0-9]/.test(o.text || ''));
      const hb = heads.map(ink), u = hb.reduce((a, b) => a ? { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), r: Math.max(a.r, b.x + b.w), b: Math.max(a.b, b.y + b.h) } : { x: b.x, y: b.y, r: b.x + b.w, b: b.y + b.h }, null);
      const ground = o => thIsGround(o) || o.pgShade || (o.type === 'image' && o.pgRole !== 'photo') || o.name === 'Frame';
      const others = objs.filter(o => !heads.includes(o) && o.visible !== false && !ground(o) && !(o.opacity != null && o.opacity < 0.3))
        .map(o => ({ name: o.name || o.type, b: isText(o) ? ink(o) : box(o), deco: o.pgRole === 'deco' || !!o.pgEmoji, rect: o.type === 'rect', text: isText(o) }))
        .filter(x => x.b.w * x.b.h < 0.6 * W * H);
      const r = pgCheck(sc), lines = r.lines.filter(l => l.role === 'headline').map(l => ({ name: l.name, core: l.core, letters: l.letters, ink: l.ink, ground: l.ground,
        grey: (() => { const o = heads.find(h => h.name === l.name); return !!o && typeof o.fill === 'string' && !pgHueOf(o.fill) && !o.pgUser; })() }));
      // the ground the headline stands on, with its letters (and their effect layers) hidden
      const hide = objs.filter(o => heads.includes(o) || (o.pgKin && heads.includes(o.pgKin)));
      hide.forEach(o => { o.__v = o.visible; o.visible = false; });
      const cv = sc.toCanvasElement(0.5); hide.forEach(o => { o.visible = o.__v; });
      const inkL = heads.map(o => typeof o.fill === 'string' ? pgLum(o.fill) : null).filter(v => v != null);
      sc.dispose();
      return { block: u && { x: u.x, y: u.y, w: u.r - u.x, h: u.b - u.y }, area: hb.reduce((s, b) => s + b.w * b.h, 0), capH: Math.max(0, ...hb.map(b => b.h)), heads: heads.map(o => o.name), others, lines,
        fails: r.fails.map(f => f.code + '|' + f.line), dark: inkL.length ? Math.max(...inkL) < 0.3 : false,
        ground: (() => { if (!u) return null; const A = 16;   // the letters and 16px of air round them: the ground's edges stay clear of the letters
          const g = cv.getContext('2d'), x0 = Math.max(0, Math.floor((u.x - A) / 2)), y0 = Math.max(0, Math.floor((u.y - A) / 2));
          const w = Math.max(1, Math.min(cv.width - x0, Math.ceil((u.r - u.x + 2 * A) / 2))), h = Math.max(1, Math.min(cv.height - y0, Math.ceil((u.b - u.y + 2 * A) / 2)));
          /* the median of every row and every column of the ground: the edge of
             a label (a border, the frame beyond it) is one dark or light row,
             which no percentile of the whole block can see */
          const d = g.getImageData(x0, y0, w, h).data, med = a => { a.sort((p, q) => p - q); return a[a.length >> 1]; }, rows = [], cols = [];
          for (let y = 0; y < h; y++){ const r = []; for (let x = 0; x < w; x++) r.push(pgLumAt(d, (y * w + x) * 4)); rows.push(med(r)); }
          for (let x = 0; x < w; x++){ const c = []; for (let y = 0; y < h; y++) c.push(pgLumAt(d, (y * w + x) * 4)); cols.push(med(c)); }
          const all = rows.concat(cols);
          return { lo: Math.min(...all), hi: Math.max(...all) }; })() };
    },
  };
});

/* the record with its headline grown k times about its anchor, and its
   companions (small marks beside it) moved with the edge they sat by */
const grow = (rec, k, lift, comp, block, inks) => {
  const r = JSON.parse(JSON.stringify(rec)), L = r.tpl.layers;
  const heads = L.filter(l => l.role === 'headline' && (l.kind === 'text' || l.kind === 'textbox') && /[A-Za-z0-9]/.test(l.text || ''));
  const top0 = Math.min(...heads.map(l => l.props.top));
  heads.forEach(l => {
    const p = l.props;
    p.fontSize = +(p.fontSize * k).toFixed(1);
    if (p.strokeWidth) p.strokeWidth = +(p.strokeWidth * k).toFixed(2);
    if (p.width) p.width = Math.round(p.width * k);
    if (p.shadow && p.shadow.blur) p.shadow = Object.assign({}, p.shadow, { blur: +(p.shadow.blur * k).toFixed(1), offsetY: +((p.shadow.offsetY || 0) * k).toFixed(1) });
    p.top = +(top0 + (p.top - top0) * k - lift).toFixed(1);
    if (inks && inks[l.name]) p.fill = inks[l.name];
  });
  // the block grows right from its left edge (or both ways from its centre), down from its top
  const centred = heads.every(l => l.props.originX === 'center');
  const nr = centred ? block.x + block.w / 2 + block.w * k / 2 : block.x + block.w * k;
  comp.forEach(c => {
    const l = L.find(x => x.name === c.name); if (!l || !l.props) return;
    const dx = c.side === 'right' ? nr - (block.x + block.w) : 0;
    const dy = (block.y - lift + block.h * k / 2) - (block.y + block.h / 2);
    l.props.left = +((l.props.left || 0) + dx).toFixed(1); l.props.top = +((l.props.top || 0) + dy).toFixed(1);
  });
  return r;
};

const live = c => !!c && !c.defect && c.imagery !== 'none' && !(typeof c.chroma === 'number' && c.chroma < 0.05);
const ids = arg('--ids') ? arg('--ids').split(',') : process.argv.includes('--live')
  ? JSON.parse(readFileSync('assets/showcase/index.json', 'utf8')).filter(live).map(c => c.id)
  : readdirSync(DIR).filter(f => /^stepsFlow-.*\.json$/.test(f)).map(f => f.slice(0, -5));
const pairs = [], report = [];
for (const id of ids){
  const rec = JSON.parse(readFileSync(DIR + id + '.json', 'utf8'));
  const base = await page.evaluate(async (rec, id) => __hero.scene(await __sc.prep(rec, id + '__h0')), rec, id);
  if (!base.block || (!arg('--ids') && base.area >= HERO_MIN)) continue;
  const G = Math.round(0.06 * 1080), B = base.block;
  const ov = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const near = (a, b, d) => a.x < b.x + b.w + d && a.x + a.w + d > b.x && a.y < b.y + b.h + d && a.y + a.h + d > b.y;
  // companions: small decorative marks set right beside the block, not on it
  const comp = base.others.filter(o => o.deco && !o.rect && o.b.w * o.b.h < 0.02 * 1080 * 1080 && near(o.b, B, 90) && !ov(o.b, B))
    .map(o => ({ name: o.name, side: o.b.x >= B.x + B.w - 4 ? 'right' : 'other', b: o.b }));
  const cn = new Set(comp.map(c => c.name));
  // what the block stood on (a plate drawn under it), and what it already touched
  const host = base.others.filter(o => o.rect && o.b.x <= B.x + 2 && o.b.y <= B.y + 2 && o.b.x + o.b.w >= B.x + B.w - 2 && o.b.y + o.b.h >= B.y + B.h - 2)
    .sort((a, b) => a.b.w * a.b.h - b.b.w * b.b.h)[0] || null;
  const was = new Set(base.others.filter(o => ov(o.b, B)).map(o => o.name));
  const L0 = Object.fromEntries(base.lines.map(l => [l.name, l]));
  const at0 = Object.fromEntries(base.others.map(o => [o.name, o.b]));
  const fits = s => {
    const b = s.block; if (!b) return false;
    // nothing else on the card moves or goes: a pass pushing a row down to make room, or
    // leaving the product out for want of space (alignPass 4d), is a collision
    const now = new Set(s.others.map(o => o.name));
    if (base.others.some(o => !now.has(o.name))) return false;
    if (s.others.some(o => !cn.has(o.name) && at0[o.name] && (Math.abs(o.b.x - at0[o.name].x) > 3 || Math.abs(o.b.y - at0[o.name].y) > 3))) return false;
    // the ground under the letters stays the ground they stood on (a label in the photograph keeps them)
    if (s.ground && base.ground && (s.dark ? s.ground.lo < base.ground.lo - 0.05 : s.ground.hi > base.ground.hi + 0.05)) return false;
    if (b.x < G - 1 || b.y < G - 1 || b.x + b.w > 1080 - G + 1 || b.y + b.h > 1080 - G + 1) return false;
    if (host && (b.x < host.b.x || b.y < host.b.y || b.x + b.w > host.b.x + host.b.w || b.y + b.h > host.b.y + host.b.h)) return false;
    /* 38px (3.5% of the card) clear of a plate, the badge, the product; copy
       beside it keeps 0.8 of the headline's letter height off it, so two big
       words never read as one (SELL YOUR SPORTS CARDS beside the grade's 10) */
    const bp = (px, py) => ({ x: b.x - px, y: b.y - py, w: b.w + 2 * px, h: b.h + 2 * py }), padT = Math.max(38, 0.8 * s.capH);
    if (s.others.some(o => !cn.has(o.name) && !was.has(o.name) && o !== host && (!host || o.name !== host.name) && ov(o.b, o.text ? bp(padT, 38) : bp(38, 38)))) return false;
    // a companion keeps clear of the copy too, and inside the guides
    if (s.others.some(o => cn.has(o.name) && (o.b.x < G || o.b.x + o.b.w > 1080 - G || s.others.some(q => !cn.has(q.name) && !q.deco && ov(q.b, o.b)) || ov(o.b, b)))) return false;
    return s.lines.every(l => { const o = L0[l.name]; if (!o) return true;
      return (l.core == null || o.core == null || l.core >= Math.min(o.core, 4.5) - 0.1) && (l.letters == null || o.letters == null || l.letters >= Math.min(o.letters, 4.5) - 0.2); });
  };
  /* a hero reads: a grey headline under 4.5:1 on its ground takes the card's
     near-white over a dark ground, its near-black over a light one */
  const weak = base.lines.some(l => l.grey && l.core != null && l.core < 4.5);   // the block reads as one: its grey lines change together
  const inks = Object.fromEntries(base.lines.filter(l => weak && l.grey && l.ink != null && l.ground != null)
    .map(l => [l.name, l.ink > l.ground ? '#f6f6f4' : '#141110']));
  const tryK = async (k, lift) => { const cand = grow(rec, k, lift, comp, B, inks);
    const s = await page.evaluate(async (c, id) => __hero.scene(await __sc.prep(c, id + '__h')), cand, id); return { cand, s, ok: fits(s) }; };
  // the block may rise to the guide; search the factor at each lift
  let best = null;
  const LIFT = Math.max(0, Math.round(B.y - G - 4));
  for (const lift of [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * LIFT)).filter((v, i, a) => a.indexOf(v) === i)){
    let lo = 1, hi = KMAX, found = null;
    for (let i = 0; i < 12; i++){ const mid = (lo + hi) / 2, t = await tryK(mid, lift); if (t.ok){ lo = mid; found = { k: mid, lift, ...t }; } else hi = mid; }
    if (found && (!best || found.s.area > best.s.area)) best = found;
  }
  report.push({ id, before: Math.round(base.area), after: best ? Math.round(best.s.area) : null, k: best ? +best.k.toFixed(2) : null, lift: best ? best.lift : null, comp: comp.map(c => c.name), inks: Object.keys(inks) });
  if (best && best.k > 1.05) pairs.push({ id, rec: best.cand });
}
report.forEach(r => console.log(r.id.padEnd(24), 'letters', String(r.before).padStart(6), '->', String(r.after).padStart(6), 'px²', ' k', r.k, ' lift', r.lift, r.comp.length ? ' moves ' + r.comp.join(',') : '', r.inks.length ? ' inks ' + r.inks.join(',') : ''));
const gate = await gateRecords(page, pairs);
console.log(gateSummary(gate));
Object.entries(gate).forEach(([id, g]) => { if (!g.ok) console.log('  held', id, JSON.stringify(g.fresh || g.err), JSON.stringify(g.lost || [])); });
if (WRITE){
  let n = 0;
  pairs.forEach(({ id, rec }) => { if (gate[id] && gate[id].ok){ writeFileSync(DIR + id + '.json', JSON.stringify(rec)); n++; } });
  console.log('wrote ' + n + ' record(s)');
}
await browser.close();
