#!/usr/bin/env node
/* Type gap audit (DESIGN-LAW 132): every card as Easy Mode draws it, square,
   measured on its letters and its plates.

     touching   lines where two letters' ink meets (the outline counted)
     tight      lines whose closest letters sit under LETTER_GAP of the size
     words      lines whose closest word space (ink to ink) is under WORD_GAP
     plates     plates that end within 6px of a full-width band (or cross it)

   The measure is carried here, not read from app.js, so the same script grades
   a checkout from before the rule and one after it.

   usage:  python3 -m http.server 8765   (repo root)   then
           FABRIC_JS=/path/fabric.min.js node scripts/type_gap_audit.mjs [--base http://localhost:8765/] [--set classics|showcase|both] [--limit N] [--json out.json]
   FABRIC_JS serves fabric from disk where cdnjs is out of reach; PLAYWRIGHT
   points at a playwright module if it is not installed here. Exits 1 on a page
   error or a card that would not open. */
import { readFileSync, writeFileSync } from 'node:fs';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg('--base', process.env.GFX_BASE || 'http://localhost:8765/'), SET = arg('--set', 'both'), LIMIT = +arg('--limit', 0), JSON_OUT = arg('--json', '');
const LETTER_GAP = 0.025, WORD_GAP = 0.2;
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const fab = process.env.FABRIC_JS ? readFileSync(process.env.FABRIC_JS) : null;
const browser = await chromium.launch({ args: ['--force-color-profile=srgb'] });
const errors = [];
let page;
async function fresh() {
  if (page) await page.context().close().catch(() => {});
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  await ctx.route('**/*', r => {
    const u = r.request().url();
    if (fab && /fabric(\.min)?\.js/.test(u) && !u.startsWith(BASE)) return r.fulfill({ status: 200, contentType: 'application/javascript', body: fab });
    if (!u.startsWith(BASE) && !u.startsWith('data:') && !u.startsWith('blob:')) return r.abort();
    return r.continue();
  });
  page = await ctx.newPage();
  page.on('pageerror', e => errors.push(String(e.message || e)));
  await page.goto(BASE + '?demo=1', { waitUntil: 'load', timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(4000);
  return page.evaluate(async () => {
    loadAccount = async () => account; account = { email: 'audit@local', role: 'admin', plan: 'pro' };
    const cards = typeof scLoadIndex === 'function' ? await scLoadIndex() : [];
    return { showcase: cards.filter(c => !c.defect).map(c => c.id), classics: TEMPLATES.filter(t => !/^sc-/.test(t.id)).map(t => t.id) };
  });
}
const lists = await fresh();
let jobs = [];
if (SET !== 'showcase') jobs = jobs.concat(lists.classics.map(id => ({ kind: 'classic', id })));
if (SET !== 'classics') jobs = jobs.concat(lists.showcase.map(id => ({ kind: 'showcase', id })));
if (LIMIT) jobs = jobs.slice(0, LIMIT);

const measure = `(${function (LETTER_GAP, WORD_GAP) {
  // each glyph's ink row by row (left and right edge in ems from its origin), drawn once per face:
  // two letters touch only where both have ink in the same row (a j's tail, an f's hook, a lean do not)
  const rowsOf = new Map(), c = document.createElement('canvas'), S = 100; c.width = 3 * S; c.height = 2 * S;
  const x = c.getContext('2d', { willReadFrequently: true });
  const glyph = (face, ch) => {
    const key = face + '|' + ch; if (rowsOf.has(key)) return rowsOf.get(key);
    x.clearRect(0, 0, c.width, c.height); x.font = face; x.fillText(ch, S, 1.4 * S);
    const d = x.getImageData(0, 0, c.width, c.height).data, rows = [];
    for (let y = 0; y < c.height; y += 2) { let l = -1, r = -1; for (let k = 0; k < c.width; k++) if (d[(y * c.width + k) * 4 + 3] > 96) { if (l < 0) l = k; r = k; } rows.push(l < 0 ? null : [(l - S) / S, (r + 1 - S) / S]); }
    const out = rows.some(Boolean) ? rows : null; rowsOf.set(key, out); return out;
  };
  window.__gapOf = o => {
    if (!o || typeof o.text !== 'string' || !o.text.trim() || !/^(i-text|text|textbox)$/.test(o.type || '')) return null;
    if (/Kaushan|Knewave|Sedgwick|Permanent Marker|Pacifico|Lobster|Great Vibes|Yellowtail|Kalam|Rubik Wet Paint|Cabin Sketch/i.test(o.fontFamily || '')) return null;
    if (typeof tsIsCurve === 'function' && tsIsCurve(o)) return null;
    try { o.initDimensions(); } catch (e) { return null; }
    if (!o.__charBounds) return null;
    const fam = String(o.fontFamily || ''), face = 'normal ' + (o.fontWeight || 400) + ' 100px ' + (/[,"']/.test(fam) ? fam : '"' + fam + '"');   // upright: the slant moves every letter alike
    const fs = o.fontSize || 40, sw = o.stroke && o.strokeWidth ? o.strokeWidth / fs : 0;
    let minL = Infinity, minW = Infinity;
    o._textLines.forEach((line, li) => {
      const cb = o.__charBounds[li]; if (!cb) return;
      let prev = null, space = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (/\s/.test(ch)) { if (prev) space = true; continue; }
        if (!cb[i] || /[\u2500-\u259f_\u2014\u2015]/.test(ch)) { prev = null; continue; }   // rules and box lines join by design
        const R = glyph(face, ch); if (!R) continue;
        const x0 = cb[i].left / fs;
        if (prev) { let g = Infinity; for (let r = 0; r < R.length; r++) if (R[r] && prev.R[r]) g = Math.min(g, x0 + R[r][0] - (prev.x + prev.R[r][1])); g -= sw;
          if (isFinite(g)) { if (space) minW = Math.min(minW, g); else minL = Math.min(minL, g); } }
        prev = { R, x: x0 }; space = false;
      }
    });
    return { letter: minL, word: minW };
  };
}})(${LETTER_GAP}, ${WORD_GAP})`;

const rows = [], t0 = Date.now();
for (const [n, j] of jobs.entries()) {
  if (n && n % 40 === 0) await fresh();
  const run = () => page.evaluate(async ({ j, measure, LETTER_GAP, WORD_GAP }) => {
    (0, eval)(measure);
    const ADMIN = { email: 'audit@local', role: 'admin', plan: 'pro' };
    // a card the site holds back (template-holds.js) opens as another: not on the site, so not graded
    if (j.kind === 'showcase') { account = ADMIN; await openShowcase(j.id); if (ez.tpl !== 'sc-' + j.id) return { id: j.id, held: true }; }
    else { showEasy(); account = ADMIN; selectEzTpl(j.id); ez.bgPicked = true; if (ez.tpl !== j.id) return { id: j.id, held: true }; }
    $('ez-phone').value = '(562) 999-4994';
    for (let i = 0, t = ezTpl(); i < 40; i++) { const src = t.bg && t.bg.type === 'image' && t.bg.src; if (!src || (TPL_BG_ELS[src] && TPL_BG_ELS[src].width)) break; await new Promise(r => setTimeout(r, 100)); }
    await document.fonts.ready;
    const sc = renderEzCanvas(1080, 'png', undefined, undefined, 'square', true);
    const objs = sc.getObjects(), W = 1080, H = 1080;
    const out = { id: j.id, touching: [], tight: [], words: [], plates: [] };
    for (const o of objs) {
      if (o.visible === false) continue;
      const g = window.__gapOf(o); if (!g) continue;
      const nm = (o.name || o.type) + ': ' + String(o.text).replace(/\s+/g, ' ').slice(0, 30);
      if (g.letter <= 0) out.touching.push(nm);
      if (g.letter < LETTER_GAP - 0.002) out.tight.push(nm);
      if (isFinite(g.word) && g.word < WORD_GAP - 0.004) out.words.push(nm);
    }
    const rects = objs.filter(o => o.type === 'rect' && o.visible !== false).map(o => { o.setCoords(); return { o, b: o.getBoundingRect(true, true) }; });
    const bands = rects.filter(r => r.b.width >= W * 0.93 && r.b.height < H * 0.6);
    for (const r of rects) {
      if (bands.includes(r) || r.b.width < 40 || r.b.height < 20 || r.b.width > W * 0.93) continue;
      for (const B of bands) {
        const inside = r.b.top >= B.b.top && r.b.top + r.b.height <= B.b.top + B.b.height;
        if (inside) continue;
        const gapBelow = B.b.top - (r.b.top + r.b.height), gapAbove = r.b.top - (B.b.top + B.b.height);
        const crosses = r.b.top < B.b.top && r.b.top + r.b.height > B.b.top || r.b.top < B.b.top + B.b.height && r.b.top + r.b.height > B.b.top + B.b.height;
        if (crosses || (gapBelow >= 0 && gapBelow < 6) || (gapAbove >= 0 && gapAbove < 6)) out.plates.push((r.o.name || 'rect') + ' / ' + (B.o.name || 'band'));
      }
    }
    sc.dispose && sc.dispose();
    return out;
  }, { j, measure, LETTER_GAP, WORD_GAP }).catch(e => ({ id: j.id, err: String(e && e.message || e) }));
  let r = await run();
  if (r.err) { await fresh(); r = await run(); }
  rows.push(r);
  if (n % 50 === 0 || r.err) console.log(`[${n + 1}/${jobs.length} ${Math.round((Date.now() - t0) / 1000)}s] ${r.id}${r.err ? ' ERROR ' + r.err : ''}`);
}
await browser.close();
const ok = rows.filter(r => !r.err && !r.held), count = k => ok.reduce((a, r) => a + r[k].length, 0), cards = k => ok.filter(r => r[k].length).length;
const sum = { cards: ok.length, held: rows.filter(r => r.held).length, errors: rows.filter(r => r.err).length, pageErrors: errors.length,
  touching: { lines: count('touching'), cards: cards('touching') }, tight: { lines: count('tight'), cards: cards('tight') },
  words: { lines: count('words'), cards: cards('words') }, plates: { pairs: count('plates'), cards: cards('plates') } };
console.log(JSON.stringify(sum, null, 1));
for (const k of ['touching', 'words', 'plates']) {
  const ex = ok.filter(r => r[k].length).slice(0, 6).map(r => `${r.id}: ${r[k].slice(0, 2).join(' | ')}`);
  if (ex.length) console.log(`${k} e.g.\n  ` + ex.join('\n  '));
}
if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ sum, rows }, null, 1));
if (sum.errors || errors.length) { console.log('page errors:', errors.slice(0, 5)); process.exit(1); }
