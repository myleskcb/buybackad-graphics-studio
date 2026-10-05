#!/usr/bin/env node
/* THE DESIGNER (ADVANCED EDITOR): DOES IT SPEAK THE HOUSE LANGUAGE?
 *
 * Owner, 2026-09-30: "audit and make sure the designer page looks updated FOR
 * ALL NEW FEATURES / DESIGN LANGUAGE". DESIGN-LAW rule 93. This presses every
 * colour and ground control of the advanced editor through its real panel and
 * measures the canvas it draws, card by card, each card in a fresh browser
 * context (the studio keeps its drafts in localStorage):
 *
 *   open      the page answers while it settles: the longest main-thread task
 *             after the first second, and the total blocking time over twelve
 *             seconds (every template thumbnail rendered six at a time used
 *             to freeze it for about twenty).
 *   hand-off  a card opened from Easy Mode arrives as Easy Mode drew it:
 *             every line and plate where Easy Mode put it.
 *   themes    every chip changes the card, fails no critical line the card
 *             passed (the gate, pgCheck, rule 87) and puts no other reading
 *             line under 3:1; the chip lit is the theme drawn; ORIG puts back
 *             exactly the card it started from, after the themes and again
 *             after the swatches.
 *   grounds   ORIG and the six quick swatches, with no theme, a light theme
 *             and a dark one, and the first two of every kind of ground (rule
 *             86): each changes the picture and keeps every line.
 *   effects   blur changes a photograph and is off, with its reason, over a
 *             flat colour; each overlay changes the picture and keeps every
 *             critical line; each pattern and its light tone changes it.
 *   undo      undoing a ground puts the ground and its controls back.
 *   library   the Templates tab lists the category's library cards, and one
 *             opens in the editor.
 *
 * usage:  npx http-server -p 8899 -s .   then
 *         CHROME=/path/to/chrome [FABRIC_JS=/path/to/fabric.min.js] \
 *           node scripts/designer_audit.mjs [--cards a,b] [--quick] [--json out.json]
 * Exits 1 on any failure. */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { BASE, offline } from './_showcase_harness.mjs';

const argv = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const QUICK = process.argv.includes('--quick');
const cards = argv('--cards') ? argv('--cards').split(',') : ['sell_iphone', 'gold_spot', 'cars_kbb', 'pkm_binder', 'lowerThird-nn03-30', 'bandKnockout-pp04-15'];

const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new', args: ['--no-sandbox'], protocolTimeout: 0 });
const pageErrors = [];
let page = null, ctx = null;
async function openPage(){
  if (page) await page.close().catch(() => {});
  if (ctx) await ctx.close().catch(() => {});
  ctx = await browser.createBrowserContext();
  page = await ctx.newPage();
  await page.setViewport({ width: 1400, height: 1000 });
  page.on('pageerror', e => pageErrors.push(String(e).slice(0, 200)));
  await offline(page);
  await page.evaluateOnNewDocument(() => {
    window.__long = [];
    try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__long.push([e.startTime, e.duration]))).observe({ type: 'longtask', buffered: true }); } catch (e){}
  });
  await page.goto(BASE, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => typeof openAdvancedFromEz === 'function' && typeof pgCheck === 'function', { timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => {
    loadAccount = async () => account;
    account = { email: 'audit@local', role: 'user', plan: 'pro' };          // every card opens; nothing is exported
    const READ = /^(headline|phone|cta)$/;
    window.__ed = {
      /* the editor canvas measured at document size, as pgGate measures it */
      measure(){
        const live = { w: canvas.getWidth(), h: canvas.getHeight(), vpt: canvas.viewportTransform.slice(), ret: canvas.enableRetinaScaling };
        canvas.discardActiveObject(); canvas.enableRetinaScaling = false; canvas.setDimensions({ width: CW, height: CH }); canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        let r, px;
        try { r = pgCheck(canvas); const c = canvas.toCanvasElement(0.25); px = Array.from(c.getContext('2d').getImageData(0, 0, c.width, c.height).data.filter((_, i) => i % 4 !== 3)); }
        finally { canvas.enableRetinaScaling = live.ret; canvas.setDimensions({ width: live.w, height: live.h }); canvas.setViewportTransform(live.vpt); canvas.renderAll(); }
        return { fails: r.fails.map(f => f.code + '|' + f.line), lines: r.lines.filter(l => l.core != null).map(l => [l.name, l.role, l.core]), px };
      },
      boxes(sc){ const out = {}; sc.getObjects().forEach(o => { if (!o.name || o.pgEmojiAuto) return; o.setCoords(); const b = o.getBoundingRect(true, true); out[o.name] = [b.left, b.top, b.width, b.height].map(v => Math.round(v)); }); return out; },
      async open(id){
        document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
        if (TEMPLATES.some(t => t.id === id)){ showEasy(id); document.querySelector('.ez-sw.orig').click(); }
        else {
          /* a card the library no longer offers (the owner's Reef lower
             third is stamped defect:school) is opened from its row, as the
             Easy Mode audit opens it */
          await scLoadIndex();
          if (!SHOWCASE.byId[id]){ const all = await fetch('assets/showcase/index.json').then(r => r.json()); const row = all.find(c => c.id === id); if (row) SHOWCASE.byId[id] = row; }
          await openShowcase(id);
        }
        document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
        const t = ezTpl();
        const load = (src, store) => new Promise(r => { if (!src) return r();
          if (store === TPL_BG_ELS && isDrawnSrc(src)) return loadDrawnBg(src).then(r);
          if (store[src] && store[src].width) return r();
          const el = new Image(); el.onload = () => { store[src] = el; r(); }; el.onerror = () => r();
          el.src = (store === TPL_BG_ELS && window.TPL_BG_DATA && TPL_BG_DATA[src]) || assetUrl(src); });
        await Promise.race([Promise.all([load(t.bg && t.bg.type === 'image' && t.bg.src, TPL_BG_ELS)]
          .concat((t.layers || []).filter(l => l.kind === 'cutout' && l.props && l.props.src).map(l => load(l.props.src, CUTOUT_ELS)))), new Promise(r => setTimeout(r, 12000))]);
        await document.fonts.ready;
        try { fabric.util.clearFabricFontCache(); } catch (e){}
        return t.id;
      },
      easyBoxes(){ clearTimeout(ezPrevTimer); const sc = renderEzCanvas(1080, 'png', undefined, undefined, 'square', true); const b = this.boxes(sc); sc.dispose(); return b; },
      chip(name){ return [...document.querySelectorAll('#ed-themes .ez-theme')].find(b => b.dataset.theme === name); },
      lit(){ const b = document.querySelector('#ed-themes .ez-theme.active'); return b ? b.dataset.theme : null; },
      themes(){ return COLOR_THEMES.map(t => t.name); },
    };
  });
}

const diffPct = (a, b) => { if (!a || !b || a.length !== b.length) return 100; let n = 0; for (let i = 0; i < a.length; i += 3) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 24) n++; return +(100 * n / (a.length / 3)).toFixed(1); };
/* as the Easy Mode audit: a critical line failing the gate that did not
   before, or any other reading line falling under 3:1 where it read */
const regress = (base, now, minorToo = true) => { const was = new Set(base.fails);
  const crit = now.fails.filter(f => /^(legib|numInk|ghost)\|/.test(f) && !was.has(f));
  if (!minorToo) return crit;
  const B = Object.fromEntries(base.lines.map(l => [l[0], l[2]]));
  return crit.concat(now.lines.filter(l => !/^(headline|phone|cta)$/.test(l[1]) && l[2] < 3 && (B[l[0]] == null || B[l[0]] >= 3)).map(l => 'minor|' + l[0] + ' ' + l[2])); };
const act = async (js, wait) => { await page.evaluate(async js => { await (new Function('return (async () => {' + js + '})()'))(); }, js); await new Promise(r => setTimeout(r, wait || 350)); };
const measure = () => page.evaluate(() => __ed.measure());

const problems = [], rows = [];
const P = (card, what, detail) => problems.push({ card, what, detail: detail || '' });

for (const card of cards){
  await openPage();
  const row = { card };
  const tid = await page.evaluate(id => __ed.open(id), card).catch(e => { P(card, 'open', String(e).slice(0, 120)); return null; });
  /* the card on screen is the card asked for: the Reef lower third did not
     open and Sell Your iPhone, still on screen, was measured in its place */
  if (tid && tid !== card && tid !== 'sc-' + card){ P(card, 'the card did not open', tid + ' is on screen'); rows.push(row); continue; }
  if (!tid){ rows.push(row); continue; }
  // the hand-off, and how the page answers while it settles
  const easy = await page.evaluate(() => __ed.easyBoxes());
  const t0 = await page.evaluate(() => performance.now());
  await act(`openAdvancedFromEz(); const s = [...document.querySelectorAll('button')].find(b => /skip tour/i.test(b.textContent)); if (s) s.click();
    document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));`, 12000);
  const long = await page.evaluate(t0 => window.__long.filter(e => e[0] >= t0), t0);
  row.longest = Math.round(Math.max(0, ...long.filter(e => e[0] >= t0 + 1000).map(e => e[1])));
  row.blocking = Math.round(long.reduce((s, e) => s + Math.max(0, e[1] - 50), 0));
  if (row.longest > 400) P(card, 'the page freezes after the editor opens', 'longest task ' + row.longest + 'ms after the first second');
  if (row.blocking > 3000) P(card, 'the page is busy after the editor opens', row.blocking + 'ms of blocking in 12s');
  const ed = await page.evaluate(() => __ed.boxes(canvas));
  const off = Object.keys(easy).filter(k => ed[k] && easy[k].some((v, i) => Math.abs(v - ed[k][i]) > 3)).map(k => k + ' ' + easy[k] + ' / ' + ed[k]);
  row.handoff = off.length;
  if (off.length) P(card, 'the hand-off moves copy from where Easy Mode put it', off.slice(0, 4).join('; '));
  const controls = await page.evaluate(() => !!document.querySelector('#ed-themes .ez-theme') && !!document.querySelector('#ed-swatches .ez-sw') && !!document.getElementById('ed-bgstyles'));
  if (!controls){ P(card, 'the designer has no theme, swatch or ground controls'); rows.push(row); continue; }
  // themes, from the card's own colours
  await act(`__ed.chip('').click();`);
  const base = await measure();
  const THEMES = await page.evaluate(() => __ed.themes());
  row.themes = {};
  for (const name of QUICK ? THEMES.filter((_, i) => i % 4 === 0) : THEMES){
    await act(`__ed.chip(${JSON.stringify(name)}).click();`);
    const r = await measure(), reg = regress(base, r), lit = await page.evaluate(() => __ed.lit());
    row.themes[name] = { changed: diffPct(base.px, r.px), reg: reg.length };
    if (row.themes[name].changed < 1) P(card, 'theme ' + name + ' changes nothing');
    if (reg.length) P(card, 'theme ' + name + ': legibility regressions', reg.join(', '));
    if (lit !== name) P(card, 'theme ' + name + ': the chip lit is ' + lit);
  }
  await act(`__ed.chip('').click();`);
  const back = await measure();
  row.orig = diffPct(base.px, back.px);
  if (row.orig > 0.5) P(card, 'ORIG does not put the card back', row.orig + '% of the picture differs');
  // grounds: ORIG and the six, with no theme, a light theme and a dark one
  for (const th of ['', 'Silver & Blue', 'Black & Green']){   // no theme, a light one, a dark one (rule 114)
    await act(`__ed.chip(${JSON.stringify(th)}).click(); document.querySelector('#ed-swatches .ez-sw.orig').click();`);
    const b0 = await measure();
    for (let i = 0; i < 6; i++){
      await act(`document.querySelector('#ed-swatches .ez-sw[data-i="${i}"]').click();`);
      const r = await measure(), reg = regress(b0, r);
      if (diffPct(b0.px, r.px) < 1) P(card, (th || 'no theme') + ' swatch ' + (i + 1) + ' changes nothing');
      if (reg.length) P(card, (th || 'no theme') + ' swatch ' + (i + 1) + ': legibility regressions', reg.join(', '));
    }
  }
  await act(`__ed.chip('').click(); document.querySelector('#ed-swatches .ez-sw.orig').click(); document.querySelector('#panel-left [data-ltab="bg"]').click();`, 600);
  const g0 = await measure();
  /* the swatches' passes turn the copy on a flat ground; ORIG after them is
     the card again (a gradient's stops shared with its saved original came
     back turned: cars_kbb's headline, dark on its photograph) */
  row.origAfter = diffPct(base.px, g0.px);
  if (row.origAfter > 0.5) P(card, 'ORIG after the swatches does not put the card back', row.origAfter + '% of the picture differs');
  const styles = await page.evaluate(() => [...document.querySelectorAll('#ed-bgstyles button')].map(b => b.dataset.style));
  row.grounds = {};
  for (const st of styles){
    await act(`[...document.querySelectorAll('#ed-bgstyles button')].find(b => b.dataset.style === ${JSON.stringify(st)}).click();`, 500);
    const n = await page.evaluate(() => document.querySelectorAll('#ed-drawn .ez-gsw').length);
    for (let i = 0; i < Math.min(2, n); i++){
      await act(`document.querySelectorAll('#ed-drawn .ez-gsw')[${i}].click();`, 450);
      const r = await measure(), reg = regress(g0, r), d = diffPct(g0.px, r.px);
      row.grounds[st + ' ' + (i + 1)] = d;
      if (d < 1) P(card, 'ground ' + st + ' ' + (i + 1) + ' changes nothing');
      if (reg.length) P(card, 'ground ' + st + ' ' + (i + 1) + ': legibility regressions', reg.join(', '));
    }
    if (!n && st !== 'photo' && st !== 'blurred') P(card, 'ground style ' + st + ' offers nothing');
  }
  // blur on a photograph, and its reason over a flat colour
  await act(`document.querySelector('#ed-swatches .ez-sw.orig').click();`);
  const photo = await page.evaluate(() => !document.getElementById('ed-blur').disabled);
  if (photo){
    const p0 = await measure();
    await act(`const s = document.getElementById('ed-blur'); s.value = 12; s.dispatchEvent(new Event('input'));`, 700);
    const p1 = await measure();
    row.blur = diffPct(p0.px, p1.px);
    if (row.blur < 1) P(card, 'blur on the photograph changes nothing', row.blur + '%');
    await act(`const s = document.getElementById('ed-blur'); s.value = 0; s.dispatchEvent(new Event('input'));`, 700);
  }
  await act(`document.querySelector('#ed-swatches .ez-sw[data-i="2"]').click();`);
  const flat = await page.evaluate(() => ({ off: document.getElementById('ed-blur').disabled, why: document.getElementById('ed-blur-note').textContent }));
  if (!flat.off || !flat.why) P(card, 'blur over a flat colour is live, or says nothing', JSON.stringify(flat));
  // overlays and patterns, on the card's own ground
  await act(`document.querySelector('#ed-swatches .ez-sw.orig').click(); document.querySelector('#ed-ov-seg [data-ov="none"]').click();`);
  const o0 = await measure();
  row.overlays = {};
  for (const ov of ['down', 'up', 'shade']){
    await act(`document.querySelector('#ed-ov-seg [data-ov="${ov}"]').click();`);
    const r = await measure(), reg = regress(o0, r, false);
    row.overlays[ov] = diffPct(o0.px, r.px);
    if (row.overlays[ov] < 1) P(card, 'overlay ' + ov + ' changes nothing');
    if (reg.length) P(card, 'overlay ' + ov + ': legibility regressions', reg.join(', '));
  }
  await act(`document.querySelector('#ed-ov-seg [data-ov="none"]').click();`);
  row.patterns = await page.evaluate(async () => {
    const seg = document.getElementById('ed-pat-seg');
    const keys = [...seg.querySelectorAll('[data-pat]')].map(b => b.dataset.pat).filter(k => k !== 'none' && k !== '__tone');
    const px = () => { const d = __ed.measure(); return d.px; };
    const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 3) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 24) n++; return +(100 * n / (a.length / 3)).toFixed(1); };
    const full = () => { const live = { w: canvas.getWidth(), h: canvas.getHeight(), vpt: canvas.viewportTransform.slice(), ret: canvas.enableRetinaScaling };
      canvas.enableRetinaScaling = false; canvas.setDimensions({ width: CW, height: CH }); canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      const c = canvas.toCanvasElement(1), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      canvas.enableRetinaScaling = live.ret; canvas.setDimensions({ width: live.w, height: live.h }); canvas.setViewportTransform(live.vpt); canvas.renderAll(); return d; };
    const d4 = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 24) n++; return +(100 * n / (a.length / 4)).toFixed(1); };
    const press = k => seg.querySelector('[data-pat="' + k + '"]').click();
    const wait = () => new Promise(r => setTimeout(r, 250));
    press('none'); await wait(); const p0 = full(), out = {};
    for (const k of keys){ press(k); await wait(); out[k] = d4(p0, full()); }
    press(keys[0]); await wait(); const t0 = full(); press('__tone'); await wait(); out.__tone = d4(t0, full());
    press('none'); await wait();
    return out;
  });
  Object.entries(row.patterns).forEach(([k, v]) => { if (v < 1) P(card, (k === '__tone' ? 'pattern tone "Light"' : 'pattern ' + k) + ' changes nothing', v + '%'); });
  // undo puts a ground and its controls back
  const u = await page.evaluate(async () => {
    const before = JSON.stringify(bgState);
    document.querySelector('#ed-swatches .ez-sw[data-i="4"]').click(); await new Promise(r => setTimeout(r, 400));
    document.getElementById('undo-btn').click(); await new Promise(r => setTimeout(r, 900));
    return { same: JSON.stringify(bgState) === before, orig: document.querySelector('#ed-swatches .ez-sw.orig').classList.contains('sel') };
  });
  if (!u.same) P(card, 'undo does not put the ground back');
  // the library of current designs, in the Templates tab
  const lib = await page.evaluate(async () => {
    document.querySelector('#panel-left [data-ltab="templates"]').click(); await new Promise(r => setTimeout(r, 900));
    const cards = [...document.querySelectorAll('#ed-lib-grid .mini-tpl')], free = cards.find(c => !c.classList.contains('locked'));
    if (!free) return { n: cards.length };
    free.click(); await new Promise(r => setTimeout(r, 5000));
    return { n: cards.length, opened: currentTplId };
  });
  row.library = lib.n;
  if (!lib.n) P(card, 'the Templates tab lists no library designs');
  else if (lib.opened && !/^sc-/.test(lib.opened)) P(card, 'a library design did not open', JSON.stringify(lib));
  else if (lib.opened){
    const own = await measure();
    const crit = own.fails.filter(f => /^(legib|numInk|ghost)\|/.test(f));
    if (crit.length) P(card, 'the library design opened fails the gate', lib.opened + ' ' + crit.join(', '));
  }
  rows.push(row);
  const ts = Object.values(row.themes || {});
  console.log(card.padEnd(24) + ` open: longest ${row.longest}ms, blocking ${row.blocking}ms · hand-off off ${row.handoff} · themes ${ts.length} changed ${Math.min(...ts.map(t => t.changed))}-${Math.max(...ts.map(t => t.changed))}% · ORIG ${row.orig}% (after swatches ${row.origAfter}%) · library ${row.library}`);
}
await browser.close();

console.log('\n' + (problems.length ? problems.length + ' problems' : 'no problems') + ` over ${rows.length} cards · page errors ${pageErrors.length}`);
const byWhat = {};
problems.forEach(p => { const k = p.what.replace(/^theme [^:]+: /, 'theme: ').replace(/^(no theme|Silver & Blue|Black & Green) swatch \d+/, 'swatch').replace(/^ground \S+ \d+/, 'ground'); (byWhat[k] = byWhat[k] || []).push(p.card); });
Object.entries(byWhat).forEach(([k, v]) => console.log('  ' + String(v.length).padStart(4) + '  ' + k + '  (' + [...new Set(v)].slice(0, 6).join(', ') + ')'));
pageErrors.slice(0, 5).forEach(e => console.log('  page error: ' + e));
if (argv('--json')) writeFileSync(argv('--json'), JSON.stringify({ rows, problems, pageErrors }, null, 1));
process.exit(problems.length || pageErrors.length ? 1 : 0);
