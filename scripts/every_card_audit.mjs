/* EVERY CARD, EVERY CHOICE (DESIGN-LAW rules 83, 87, 90, 100).
 *
 * The owner, 2026-09-30: "make sure all classic and current themes are
 * audited and ready for use with new color schemes, new design language, new
 * typefaces / text design". The other audits each cover one slice: verify
 * gates every card on the thumbnail path only, ez_theme_audit takes the 21
 * themes through a 20-card sample (whose four classics are held, so it skipped
 * them), tagline_audit takes the looks through 82 cards by its own measure.
 * No classic had a colour theme audited, and no library card was gated on the
 * Easy Mode render at all.
 *
 * This one takes every offered classic (TEMPLATES as the studio offers them,
 * held and gated ones left out) and every live library card through the
 * render a visitor gets: Easy Mode's renderEzCanvas, on the card's own
 * photograph (ORIG, not the grey placeholder), each card in a fresh browser
 * context. For each card:
 *   base     the card as offered: any gate failure (pgCheck) is a problem
 *   themes   every colour theme: plates repainted, none of the card's own
 *            chromatic colours left beside the theme's, marks kept on what they
 *            sit on, no critical line newly failing the gate and no other
 *            reading line newly under 3:1, and the picture changed
 *   looks    every tagline look: no line newly failing, by the gate's measure
 *   voices   every type voice (FONT_PAIRS), when the studio has them: no line
 *            newly failing, nothing newly off the card, straddling or colliding
 *   combos   every look under a light theme and a dark one
 *
 * usage:  npx http-server -p 8899 -s -c-1 .   then
 *         CHROME=/path/to/chrome [FABRIC_JS=/path/to/fabric.min.js] \
 *           node scripts/every_card_audit.mjs [--set classics|library|all]
 *             [--ids a,b] [--dims base,themes,looks,voices,combos]
 *             [--workers 4] [--out .render/every-card] [--resume] [--limit N]
 *             [--write-holds]
 * Exits 1 on any problem. Results stream to <out>/results.jsonl, one card a
 * line, so a long run can be resumed (--resume skips the cards already there).
 *
 * --write-holds writes assets/choice-holds.json: each card that fails the gate
 * as offered (the studio then offers it nowhere), and for each card the themes,
 * looks and voices that fail it, with why. The studio offers them nowhere on
 * that card (their chip is off, with the reason): every choice a visitor can
 * make on a card is one this audit passed (rule 76). With --ids the table is
 * updated for those cards only. */
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { BASE as ROOT, offline, live } from './_showcase_harness.mjs';
/* the studio as offered, but every choice clickable: its own holds (choice-holds.json,
   rule 100) are what this audit writes, and a held chip is off */
const BASE = ROOT + (ROOT.includes('?') ? '&' : '?') + 'nochoiceholds=1';

const argv = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const SET = argv('--set') || 'all';
const DIMS = new Set((argv('--dims') || 'base,themes,looks,voices,combos').split(','));
const WORKERS = +(argv('--workers') || 4);
const OUT = argv('--out') || new URL('../.render/every-card/', import.meta.url).pathname;
const LIMIT = +(argv('--limit') || 0);
mkdirSync(OUT, { recursive: true });
const RESULTS = OUT.replace(/\/?$/, '/') + 'results.jsonl';

/* CHROME_ARGS: extra flags for the browser, space separated */
const launch = () => puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new', args: ['--no-sandbox'].concat((process.env.CHROME_ARGS || '').split(' ').filter(Boolean)), protocolTimeout: 0 });

/* the page-side runner: everything a card needs happens in one evaluate */
const RUNNER = () => {
  /* as the Easy Mode audit reads a scene */
  const isText = o => o && (o.type === 'i-text' || o.type === 'text' || o.type === 'textbox');
  const READ = { headline: 1, phone: 1, cta: 1, info: 1, badges: 1, sub: 1, website: 1, offer: 1 };
  const GROUND = /^(BG|Scrim|Overlay|Vignette|Grain|Claim Shade|Pattern)$/;
  const hexOf = f => { const c = pgRgb(f); return c ? '#' + c.slice(0, 3).map(v => Math.round(v).toString(16).padStart(2, '0')).join('') + (c[3] < 1 ? '/' + (+c[3]).toFixed(2) : '') : null; };
  const paintOf = f => typeof f === 'string' ? hexOf(f) : (f && f.colorStops ? 'g:' + f.colorStops.map(s => hexOf(s.color)).join(',') : null);
  const chroma = f => { const h = (typeof f === 'string' ? hexOf(f) : null) || (f && f.colorStops && f.colorStops.length ? hexOf(f.colorStops[0].color) : null);
    const o = h && hexToOklch(h.slice(0, 7)); return o ? o.C : 0; };
  const alphaOf = f => { if (typeof f !== 'string') return f && f.colorStops ? 1 : 0; const c = pgRgb(f); return c ? c[3] : 0; };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const load = (src, store) => new Promise(r => { if (!src) return r();
    if (store === TPL_BG_ELS && isDrawnSrc(src)) return loadDrawnBg(src).then(r);
    if (store[src] && store[src].width) return r();
    const el = new Image(); el.onload = () => { store[src] = el; r(); }; el.onerror = () => r();
    el.src = (store === TPL_BG_ELS && window.TPL_BG_DATA && TPL_BG_DATA[src]) || assetUrl(src); });
  const scene = () => { clearTimeout(ezPrevTimer); return renderEzCanvas(1080, 'png', undefined, undefined, 'square', true); };
  const inventory = sc => {
    const W = sc.getWidth(), H = sc.getHeight(), objs = sc.getObjects(), seen = {}, out = [];
    const bb = o => { o.setCoords(); return o.getBoundingRect(true, true); };
    const ground = o => o.pgBgRect || o.pgScrim || o.pgShade || o.pgPattern || GROUND.test(o.name || '') || o.type === 'image';
    const words = objs.filter(o => isText(o) && o.visible !== false && READ[o.pgRole] && /[A-Za-z0-9]/.test(o.text || ''));
    const carriers = new Set(words.map(t => { const r = bb(t), b = { x: r.left, y: r.top, w: r.width, h: r.height }, pl = pgPlateUnder(objs, t, b, W, H);
      if (!pl) return null; const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      return cx >= pl.x && cx <= pl.x + pl.w && cy >= pl.y && cy <= pl.y + pl.h ? pl.o : null; }).filter(Boolean));
    objs.forEach((o, k) => {
      if (!o || o.visible === false || ground(o) || o.pgKin) return;
      const key = (o.name || o.type) + '#' + (seen[o.name || o.type] = (seen[o.name || o.type] || 0) + 1);
      if (isText(o)){ if (READ[o.pgRole]) out.push({ key, cls: 'text', paint: paintOf(o.fill), c: chroma(o.fill) }); return; }
      if (!['rect', 'circle', 'polygon', 'path', 'ellipse'].includes(o.type)) return;
      const b = bb(o), area = b.width * b.height;
      const paint = paintOf(o.fill), stroke = o.stroke && o.strokeWidth ? paintOf(o.stroke) : null;
      const c = Math.max(alphaOf(o.fill) >= 0.3 ? chroma(o.fill) : 0, stroke ? chroma(o.stroke) : 0);
      if (carriers.has(o)) out.push({ key, cls: 'plate', paint, stroke, c });
      else if (area < 0.6 * W * H && (paint || stroke)){
        const cp = o.getCenterPoint();
        const on = objs.filter((q, j) => j < k && q && q.visible !== false && !ground(q) && q.type !== 'path' && ['rect', 'circle', 'polygon', 'ellipse'].includes(q.type) && alphaOf(q.fill) >= 0.5
          && (() => { const r = bb(q); return cp.x > r.left && cp.x < r.left + r.width && cp.y > r.top && cp.y < r.top + r.height && r.width * r.height > area; })())
          .sort((a, b) => bb(a).width * bb(a).height - bb(b).width * bb(b).height)[0];
        const ink = o.type === 'path' || alphaOf(o.fill) < 0.5 ? o.stroke : o.fill;
        const lum = f => { const h = typeof f === 'string' ? f : (f && f.colorStops ? f.colorStops[0].color : null); return h ? pgLum(h) : null; };
        const a = on && typeof ink === 'string' && alphaOf(ink) >= 0.5 ? lum(ink) : null, bl = on ? lum(on.fill) : null;
        out.push({ key, cls: 'mark', paint, stroke, c, on: a != null && bl != null ? +pgCr(a, bl).toFixed(2) : null });
      }
    });
    return out;
  };
  const gate = sc => { const r = pgCheck(sc); return { fails: r.fails.map(f => f.code + '|' + f.line), lines: r.lines.filter(l => l.core != null).map(l => [l.name, l.role, l.core]) }; };
  const pixels = sc => { const c = sc.toCanvasElement(0.125); return Array.from(c.getContext('2d').getImageData(0, 0, c.width, c.height).data.filter((_, i) => i % 4 !== 3)); };
  const diffPct = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 3) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 24) n++; return +(100 * n / (a.length / 3)).toFixed(1); };
  /* a critical line newly failing the gate, any other reading line newly
     under 3:1, and (for a change of face) anything newly off the card,
     straddling, colliding or covered */
  /* (a voice) anything the new face's size or width breaks: off the card, off
     its plate, into another line, the headline too small for a feed tile,
     the number under its floor, the number off its plate or on the product.
     The studio's own gate stops a download on each of them */
  const CRIT = /^(legib|numInk|ghost)\|/, FIT = /^(clip|margin|straddle|collide|covered|touch|number|thumb|offPlate|onProduct)\|/;
  const regress = (base, now, fit) => { const was = new Set(base.fails);
    const crit = now.fails.filter(f => (CRIT.test(f) || (fit && FIT.test(f))) && !was.has(f));
    const B = Object.fromEntries(base.lines.map(l => [l[0], l[2]]));
    return crit.concat(now.lines.filter(l => !/^(headline|phone|cta)$/.test(l[1]) && l[2] < 3 && (B[l[0]] == null || B[l[0]] >= 3)).map(l => 'minor|' + l[0] + ' ' + l[2])); };
  const chip = name => [...document.querySelectorAll('#ez-themes .ez-theme')].find(b => b.dataset.theme === name);
  const lookBtn = key => document.querySelector('#ez-tag-field [data-look="' + key + '"]') || [...document.querySelectorAll('#ez-tag-field button')].find(b => b.dataset.tag === key);
  const voiceBtn = key => document.querySelector('#ez-voices [data-voice="' + key + '"]');

  window.__sw = {
    async open(id){
      document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
      if (TEMPLATES.some(t => t.id === id)){ showEasy(id); const o = document.querySelector('.ez-sw.orig'); if (o) o.click(); }
      else { await scLoadIndex(); await openShowcase(id); }
      document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
      const t = ezTpl();
      if (!t || (t.id !== id && t.id !== 'sc-' + id)) return { err: 'the card did not open (' + (t ? t.id : 'nothing') + ' is on screen)' };
      const fams = new Set(), faces = new Set();
      (t.layers || []).forEach(l => { const p = l.props || {}; if (!p.fontFamily) return; fams.add(p.fontFamily); faces.add((p.fontStyle === 'italic' ? 'italic ' : '') + (p.fontWeight || 400) + ' 24px "' + p.fontFamily + '"'); });
      await Promise.race([Promise.all([load(t.bg && t.bg.type === 'image' && t.bg.src, TPL_BG_ELS)]
        .concat((t.layers || []).filter(l => l.kind === 'cutout' && l.props && l.props.src).map(l => load(l.props.src, CUTOUT_ELS)))
        .concat([...fams].map(f => ensureFont(f))).concat([...faces].map(q => document.fonts.load(q).catch(() => {})))), wait(12000)]);
      await document.fonts.ready;
      try { fabric.util.clearFabricFontCache(); } catch (e){}
      await wait(300);
      return { id: t.id };
    },
    async run(dims){
      const res = { ran: {} }, has = k => dims.includes(k);
      const measure = (inv) => { const sc = scene(); const r = { gate: gate(sc), px: pixels(sc) }; if (inv) r.inv = inventory(sc); sc.dispose(); return r; };
      if (chip('')) chip('').click();
      const lookSolid = lookBtn('solid'); if (lookSolid) lookSolid.click();
      const base = measure(true);
      res.base = base.gate.fails;
      if (has('themes')){
        const baseBy = Object.fromEntries(base.inv.map(x => [x.key, x]));
        const plates = base.inv.filter(x => x.cls === 'plate'), chromatic = base.inv.filter(x => x.c >= 0.04);
        res.themes = {};
        for (const th of COLOR_THEMES){
          const b = chip(th.name); if (!b){ res.themes[th.name] = { err: 'no chip' }; continue; }
          b.click();
          const r = measure(true), by = Object.fromEntries(r.inv.map(x => [x.key, x]));
          const row = {};
          const unthemed = plates.filter(p => by[p.key] && by[p.key].paint === p.paint).map(p => p.key);
          const left = chromatic.filter(x => by[x.key] && by[x.key].paint === x.paint && (x.cls !== 'mark' || !x.stroke || by[x.key].stroke === x.stroke)).map(x => x.key);
          const lost = base.inv.filter(x => x.cls === 'mark' && x.on != null && x.on >= 2 && by[x.key] && by[x.key].on != null && by[x.key].on < 2).map(x => x.key + ' ' + by[x.key].on);
          const reg = regress(base.gate, r.gate), ch = diffPct(base.px, r.px);
          if (unthemed.length) row.unthemed = unthemed; if (left.length) row.left = left; if (lost.length) row.lost = lost; if (reg.length) row.reg = reg;
          if (ch < 1) row.same = ch;
          if (Object.keys(row).length) res.themes[th.name] = row;
          res.ran.themes = (res.ran.themes || 0) + 1;
        }
        chip('').click();
      }
      const LOOKS = (typeof EZ_TAG_LOOKS !== 'undefined' ? EZ_TAG_LOOKS : []).map(l => l.key || l[0] || l).filter(k => typeof k === 'string');
      if (has('looks')){
        res.looks = {};
        for (const k of LOOKS){
          const b = lookBtn(k); if (!b){ res.looks[k] = { err: 'no button' }; continue; }
          b.click(); const r = measure(false), reg = regress(base.gate, r.gate);
          if (reg.length) res.looks[k] = { reg };
          res.ran.looks = (res.ran.looks || 0) + 1;
        }
        if (lookSolid) lookSolid.click();
      }
      if (has('voices') && document.getElementById('ez-voices')){
        res.voices = {};
        const keys = [...document.querySelectorAll('#ez-voices [data-voice]')].map(b => b.dataset.voice).filter(Boolean);
        for (const k of keys){
          voiceBtn(k).click();
          await voiceLoad(voiceByKey(k)); try { fabric.util.clearFabricFontCache(); } catch (e){}   // the faces, before the card is measured in them
          const r = measure(false), reg = regress(base.gate, r.gate, true);
          if (reg.length) res.voices[k] = { reg };
          res.ran.voices = (res.ran.voices || 0) + 1;
        }
        const o = voiceBtn(''); if (o) o.click();
      }
      if (has('combos')){
        res.combos = {};
        for (const th of ['Gold Offer', 'Cash Green']){
          const b = chip(th); if (!b) continue; b.click();
          const t0 = measure(false);
          for (const k of LOOKS){
            const lb = lookBtn(k); if (!lb) continue; lb.click();
            const r = measure(false), reg = regress(t0.gate, r.gate);
            if (reg.length) res.combos[th + ' / ' + k] = { reg };
            res.ran.combos = (res.ran.combos || 0) + 1;
          }
          if (lookSolid) lookSolid.click();
        }
        chip('').click();
      }
      return res;
    },
  };
};

/* the population */
const probe = await launch();
const pp = await probe.newPage();
await offline(pp);
await pp.goto(BASE, { waitUntil: 'load', timeout: 180000 });
await new Promise(r => setTimeout(r, 2500));
const classics = await pp.evaluate(() => TEMPLATES.filter(t => !/^sc-/.test(t.id) && !t.gated).map(t => t.id));
await probe.close();
const idx = JSON.parse(readFileSync(new URL('../assets/showcase/index.json', import.meta.url), 'utf8'));
const library = idx.filter(live).map(c => c.id);
let cards = argv('--ids') ? argv('--ids').split(',') : SET === 'classics' ? classics : SET === 'library' ? library : classics.concat(library);
if (process.argv.includes('--resume') && existsSync(RESULTS)){
  const done = new Set(readFileSync(RESULTS, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)).filter(r => !r.err).map(r => r.card));   // an errored card is tried again
  cards = cards.filter(c => !done.has(c));
} else if (!argv('--ids')) writeFileSync(RESULTS, '');
if (LIMIT) cards = cards.slice(0, LIMIT);
console.log(`${cards.length} cards (${classics.length} offered classics, ${library.length} live library) · dims ${[...DIMS].join(',')} · ${WORKERS} workers`);

const queue = cards.slice();
let done = 0, errors = 0;
const t0 = Date.now();
/* a browser that dies (a long run lost two workers to "Connection closed") is
   relaunched, and a card that hangs is given up after CARD_MS: the run goes on,
   and --resume picks up what a killed run left */
const CARD_MS = 15 * 60000;
async function worker(n){
  let browser = await launch();
  const fresh = async () => { try { await browser.close(); } catch (e){} browser = await launch(); };
  while (queue.length){
    const card = queue.shift();
    let row = { card };
    if (!browser.connected) await fresh();
    let ctx;
    try { ctx = await browser.createBrowserContext(); } catch (e){ await fresh(); ctx = await browser.createBrowserContext(); }
    let timer;
    try {
      await Promise.race([new Promise((_, no) => { timer = setTimeout(() => no(new Error('timed out after ' + CARD_MS / 60000 + ' min')), CARD_MS); }), (async () => {
      const page = await ctx.newPage();
      await page.setViewport({ width: 1400, height: 1000 });
      await offline(page);
      page.on('pageerror', e => { (row.pageErrors = row.pageErrors || []).push(String(e).slice(0, 160)); });
      await page.goto(BASE, { waitUntil: 'load', timeout: 180000 });
      await new Promise(r => setTimeout(r, 2000));
      await page.evaluate(`(${RUNNER.toString()})()`);
      await page.evaluate(() => { loadAccount = async () => account; account = { email: 'audit@local', role: 'user', plan: 'pro' }; });
      const o = await page.evaluate(id => __sw.open(id), card);
      if (o.err) row.err = o.err;
      else Object.assign(row, await page.evaluate(d => __sw.run(d), [...DIMS]));
      })()]);
    } catch (e){ row.err = String(e).slice(0, 200); errors++; if (/timed out|Connection closed|Target closed|Protocol error/.test(row.err)) await fresh(); }
    clearTimeout(timer);
    await ctx.close().catch(() => {});
    appendFileSync(RESULTS, JSON.stringify(row) + '\n');
    done++;
    if (done % 10 === 0 || !queue.length) console.log(`…${done}/${cards.length} · ${Math.round((Date.now() - t0) / 1000)}s`);
  }
  await browser.close();
}
await Promise.all(Array.from({ length: Math.min(WORKERS, cards.length) }, (_, n) => worker(n)));

/* the summary, over every card in the results file */
const rows = [...new Map(readFileSync(RESULTS, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)).map(r => [r.card, r])).values()];   // a card's latest row
const problems = [];
rows.forEach(r => {
  if (r.err) problems.push([r.card, 'open', r.err]);
  if (r.pageErrors) problems.push([r.card, 'page errors', r.pageErrors[0]]);
  if (r.base && r.base.length) problems.push([r.card, 'base: fails the gate as offered', r.base.join(', ')]);
  for (const [dim, set] of [['theme', r.themes], ['look', r.looks], ['voice', r.voices], ['combo', r.combos]]){
    for (const [k, v] of Object.entries(set || {})){
      if (v.err) problems.push([r.card, dim + ' ' + k + ': ' + v.err, '']);
      if (v.unthemed) problems.push([r.card, dim + ': plates left in the old colour', k + ' · ' + v.unthemed.join(', ')]);
      if (v.left) problems.push([r.card, dim + ': old palette colours left', k + ' · ' + v.left.join(', ')]);
      if (v.lost) problems.push([r.card, dim + ': marks lost on what they sit on', k + ' · ' + v.lost.join(', ')]);
      if (v.reg) problems.push([r.card, dim + ': legibility or fit regressions', k + ' · ' + v.reg.join(', ')]);
      if (v.same != null) problems.push([r.card, dim + ': changes nothing', k + ' · ' + v.same + '%']);
    }
  }
});
writeFileSync(OUT.replace(/\/?$/, '/') + 'summary.json', JSON.stringify({ cards: rows.length, problems }, null, 1));
if (process.argv.includes('--write-holds')){
  const FILE = new URL('../assets/choice-holds.json', import.meta.url).pathname;
  let prev = null; try { prev = JSON.parse(readFileSync(FILE, 'utf8')); } catch (e){}
  const holds = argv('--ids') && prev ? prev : { about: '', cards: {}, themes: {}, looks: {}, voices: {} };
  holds.about = 'Cards and choices that fail on the render a visitor gets (scripts/every_card_audit.mjs --write-holds). A card under cards is not offered; a theme, look or voice under a card is off on that card, and says why. DESIGN-LAW rule 100.';
  holds.date = new Date().toISOString().slice(0, 10);
  /* the reason, as the chip's title tells a visitor */
  const lineOf = n => /^Phone Number/.test(n) ? 'the number' : /^Headline/.test(n) ? 'the headline' : /^CTA$/.test(n) ? 'the call to action' : '“' + n + '”';
  const said = g => { const [code, rest] = g.split('|'); const n = String(rest || '').replace(/ ([\d.]+)$/, ''), v = (/ ([\d.]+)$/.exec(rest || '') || [])[1];
    return code === 'minor' ? lineOf(n) + ' would read ' + v + ':1'
      : code === 'legib' ? lineOf(n) + ' would be hard to read' : code === 'numInk' ? 'the number’s digits would be hard to read'
      : code === 'ghost' ? lineOf(n) + ' would all but vanish' : /^(clip|margin)$/.test(code) ? lineOf(n) + ' would run off the card'
      : /^(collide|touch)$/.test(code) ? lineOf(n) + ' would run into another line' : code === 'straddle' ? lineOf(n) + ' would hang off its plate'
      : code === 'covered' ? lineOf(n) + ' would be covered' : code === 'number' ? 'the number would come out too small'
      : code === 'thumb' ? 'the headline would be too small in a feed' : code === 'offPlate' ? 'the number would run off its plate'
      : code === 'onProduct' ? 'the number would sit on the product' : lineOf(n) + ' would not work (' + code + ')'; };
  const why = v => v.reg ? [...new Set(v.reg.map(said))].join('; ')
    : v.unthemed ? 'a plate would keep the card’s old colour' : v.left ? 'the card’s own colours would stay beside it' : v.lost ? 'a mark would vanish on what it sits on' : 'it changes nothing here';
  const done = new Set(rows.map(r => r.card));
  /* a card that fails the gate as offered is not offered at all */
  holds.cards = holds.cards || {};
  done.forEach(c => delete holds.cards[c]);
  rows.forEach(r => { if (!r.err && r.base && r.base.length) holds.cards[r.card] = [...new Set(r.base.map(said))].join('; '); });
  for (const dim of ['themes', 'looks', 'voices']){
    holds[dim] = holds[dim] || {};
    done.forEach(c => delete holds[dim][c]);
    rows.forEach(r => {
      const bad = Object.entries(r[dim] || {}).filter(([k, v]) => !v.err && (v.reg || v.unthemed || v.left || v.lost));
      if (bad.length) holds[dim][r.card] = Object.fromEntries(bad.map(([k, v]) => [k, why(v)]));
    });
  }
  writeFileSync(FILE, JSON.stringify(holds, null, 0));
  console.log('wrote assets/choice-holds.json: cards ' + Object.keys(holds.cards).length + ', ' + ['themes', 'looks', 'voices'].map(d => d + ' ' + Object.values(holds[d]).reduce((n, o) => n + Object.keys(o).length, 0)).join(', '));
}
const by = {};
problems.forEach(([card, what]) => { (by[what] = by[what] || new Set()).add(card); });
const ran = {}; rows.forEach(r => Object.entries(r.ran || {}).forEach(([k, n]) => ran[k] = (ran[k] || 0) + n));
console.log(`\n${problems.length ? problems.length + ' problems' : 'no problems'} over ${rows.length} cards · renders measured: ${Object.entries(ran).map(([k, n]) => k + ' ' + n).join(', ')} · ${Math.round((Date.now() - t0) / 60000)} min`);
Object.entries(by).sort((a, b) => b[1].size - a[1].size).forEach(([what, cs]) => console.log(String(cs.size).padStart(6) + '  ' + what + '  (' + [...cs].slice(0, 6).join(', ') + (cs.size > 6 ? ', …' : '') + ')'));
process.exit(problems.length ? 1 : 0);
