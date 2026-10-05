#!/usr/bin/env node
/* EASY MODE: DO THE THEME AND GROUND CONTROLS DO WHAT THEY SAY?
 *
 * Owner, 2026-09-29, on the colour themes, backgrounds and effects: "make sure
 * we build all features to be completely relevant or at least make them work
 * to redesign the theme." This presses every one of those controls through the
 * real Easy Mode UI and measures the scene it draws, card by card:
 *
 *   themes    every chip, on every sampled card. A theme owns the card's
 *             colour: every plate that carries words is repainted, and no
 *             chromatic colour of the card's own palette survives on a plate,
 *             a line or a mark (a leftover is the old accent beside the new
 *             one). Legibility by the one measure (pgCheck, rule 87): no
 *             critical line under 3:1 that was not already, and "Original"
 *             puts back every colour exactly.
 *   grounds   ORIG, the presets, the custom colour, a drawn ground: each
 *             changes the picture. With no theme, a light one or a dark one,
 *             none may fail a critical line the card passed or take another
 *             reading line under 3:1 (the copy follows its ground).
 *   effects   blur changes a photograph and is switched off, with a reason,
 *             where there is no photograph to blur; each overlay and each
 *             pattern changes the picture, and no overlay takes a critical
 *             line under 3:1 that read before (the shade takes the tone the
 *             copy on the photograph needs, rules 62 and 87).
 *   state     the chip that shows as chosen is the theme that is drawn, after
 *             a template switch too; with a theme on, the six swatches are
 *             the theme's, and a swatch picked under one theme becomes the
 *             same swatch of the next.
 *
 * usage:  npx http-server -p 8899 -s .   then
 *         CHROME=/path/to/chrome [FABRIC_JS=/path/to/fabric.min.js] \
 *           node scripts/ez_theme_audit.mjs [--cards a,b] [--quick] [--shots] [--json out.json]
 * Exits 1 on any failure. --shots writes each themed card to .render/ez-themes/. */
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { BASE, live, offline } from './_showcase_harness.mjs';

const argv = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const QUICK = process.argv.includes('--quick'), SHOTS = process.argv.includes('--shots');
const OUT = new URL('../.render/ez-themes/', import.meta.url).pathname;
if (SHOTS) mkdirSync(OUT, { recursive: true });

/* the sample: the first live card of every layout, four classics from four
   categories, and the card the owner's screenshot was taken on */
const idx = JSON.parse(readFileSync(new URL('../assets/showcase/index.json', import.meta.url), 'utf8'));
const perLayout = {};
idx.filter(live).forEach(c => { if (!perLayout[c.layout]) perLayout[c.layout] = c.id; });
let cards = argv('--cards') ? argv('--cards').split(',') : Object.values(perLayout).concat(['sell_iphone', 'gold_spot', 'cars_kbb', 'pkm_binder', 'lowerThird-nn03-30']);
if (QUICK && !argv('--cards')) cards = cards.filter((_, i) => i % 4 === 0);

const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new', args: ['--no-sandbox'], protocolTimeout: 0 });
/* One page per card. The studio decodes every template's photograph as it
   warms up and keeps each blurred copy it draws, so a single page grows
   without end over a run (6 GB in one renderer after a few cards, which
   starved the machine); a fresh page per card keeps each measurement
   independent of the last and the run bounded. */
const pageErrors = [];
let page = null, ctx = null;
const installHelpers = () => {
  loadAccount = async () => account;
  account = { email: 'audit@local', role: 'user', plan: 'pro' };          // every card opens; nothing is exported
  const GROUND = /^(BG|Scrim|Overlay|Vignette|Grain|Claim Shade|Pattern)$/;
  const isText = o => o && (o.type === 'i-text' || o.type === 'text' || o.type === 'textbox');
  const READ = { headline: 1, phone: 1, cta: 1, info: 1, badges: 1, sub: 1, website: 1, offer: 1 };
  const hexOf = f => { const c = pgRgb(f); return c ? '#' + c.slice(0, 3).map(v => Math.round(v).toString(16).padStart(2, '0')).join('') + (c[3] < 1 ? '/' + (+c[3]).toFixed(2) : '') : null; };
  const paintOf = f => typeof f === 'string' ? hexOf(f) : (f && f.colorStops ? 'g:' + f.colorStops.map(s => hexOf(s.color)).join(',') : null);
  const chroma = f => { const h = (typeof f === 'string' ? hexOf(f) : null) || (f && f.colorStops && f.colorStops.length ? hexOf(f.colorStops[0].color) : null);
    const o = h && hexToOklch(h.slice(0, 7)); return o ? o.C : 0; };
  const alphaOf = f => { if (typeof f !== 'string') return f && f.colorStops ? 1 : 0; const c = pgRgb(f); return c ? c[3] : 0; };
  window.__ez = {
    async open(id){
      document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
      if (TEMPLATES.some(t => t.id === id)){
        showEasy(id);
        document.querySelector('.ez-sw.orig').click();                   // the template's own photograph, as a visitor picks it
      } else {
        await scLoadIndex();
        if (!SHOWCASE.byId[id]){ const all = await fetch('assets/showcase/index.json').then(r => r.json()); const row = all.find(c => c.id === id); if (row) SHOWCASE.byId[id] = row; }
        await openShowcase(id);
      }
      document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
      $('ez-phone').value = '(562) 999-4994';
      /* the card's own photograph and cut-outs, waited for as a visitor waits
         for them: a classic's photograph arrives in the studio's second
         preload wave, and measured before it the card is its fallback
         gradient, on which blur and every overlay "change nothing" */
      const t = ezTpl();
      const load = (src, store) => new Promise(r => { if (!src) return r();
        if (store === TPL_BG_ELS && isDrawnSrc(src)) return loadDrawnBg(src).then(r);
        if (store[src] && store[src].width) return r();
        const el = new Image(); el.onload = () => { store[src] = el; r(); }; el.onerror = () => r();
        el.src = (store === TPL_BG_ELS && window.TPL_BG_DATA && TPL_BG_DATA[src]) || assetUrl(src); });
      await Promise.race([
        Promise.all([load(t.bg && t.bg.type === 'image' && t.bg.src, TPL_BG_ELS)]
          .concat((t.layers || []).filter(l => l.kind === 'cutout' && l.props && l.props.src).map(l => load(l.props.src, CUTOUT_ELS)))),
        new Promise(r => setTimeout(r, 12000)),
      ]);
      await Promise.all(Object.values(TPL_BG_ELS).map(i => i && i.decode ? i.decode().catch(() => {}) : 0));
      await document.fonts.ready;
      try { fabric.util.clearFabricFontCache(); } catch (e){}
      await new Promise(r => setTimeout(r, 400));
      return ez.tpl;
    },
    scene(){ clearTimeout(ezPrevTimer); return renderEzCanvas(1080, 'png', undefined, undefined, 'square', true); },
    /* what the scene paints, keyed so two renders of one card line up */
    inventory(sc){
      const W = sc.getWidth(), H = sc.getHeight(), objs = sc.getObjects(), seen = {}, out = [];
      const bb = o => { o.setCoords(); return o.getBoundingRect(true, true); };
      const ground = o => o.pgBgRect || o.pgScrim || o.pgShade || o.pgPattern || GROUND.test(o.name || '') || o.type === 'image';
      const words = objs.filter(o => isText(o) && o.visible !== false && READ[o.pgRole] && /[A-Za-z0-9]/.test(o.text || ''));
      /* the plates lines stand on, by the house's one finder (pgPlateUnder,
         DESIGN-LAW 87) holding the line's centre, as pgShadeBands asks */
      const carriers = new Set(words.map(t => { const r = bb(t), b = { x: r.left, y: r.top, w: r.width, h: r.height }, pl = pgPlateUnder(objs, t, b, W, H);
        if (!pl) return null; const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
        return cx >= pl.x && cx <= pl.x + pl.w && cy >= pl.y && cy <= pl.y + pl.h ? pl.o : null; }).filter(Boolean));
      objs.forEach((o, k) => {
        if (!o || o.visible === false || ground(o) || o.pgKin) return;
        const key = (o.name || o.type) + '#' + (seen[o.name || o.type] = (seen[o.name || o.type] || 0) + 1);
        if (isText(o)){ if (READ[o.pgRole]) out.push({ key, cls: 'text', role: o.pgRole, paint: paintOf(o.fill), c: chroma(o.fill) }); return; }
        if (!['rect', 'circle', 'polygon', 'path', 'ellipse'].includes(o.type)) return;
        const b = bb(o), area = b.width * b.height;
        const hosts = carriers.has(o);
        const paint = paintOf(o.fill), stroke = o.stroke && o.strokeWidth ? paintOf(o.stroke) : null;
        const c = Math.max(alphaOf(o.fill) >= 0.3 ? chroma(o.fill) : 0, stroke ? chroma(o.stroke) : 0);
        if (hosts) out.push({ key, cls: 'plate', paint, stroke, c });
        else if (area < 0.6 * W * H && (paint || stroke)){
          /* what the mark is drawn on (the smallest solid shape before it holding
             its centre), and how far apart the two are: a tick on a disc */
          const cp = o.getCenterPoint();
          const on = objs.filter((q, j) => j < k && q && q.visible !== false && !ground(q) && q.type !== 'path' && ['rect', 'circle', 'polygon', 'ellipse'].includes(q.type) && alphaOf(q.fill) >= 0.5
            && (() => { const r = bb(q); return cp.x > r.left && cp.x < r.left + r.width && cp.y > r.top && cp.y < r.top + r.height && r.width * r.height > area; })())
            .sort((a, b) => bb(a).width * bb(a).height - bb(b).width * bb(b).height)[0];
          const ink = o.type === 'path' || alphaOf(o.fill) < 0.5 ? o.stroke : o.fill;
          const lum = f => { const h = typeof f === 'string' ? f : (f && f.colorStops ? f.colorStops[0].color : null); const v = h ? pgLum(h) : null; return v; };
          const a = on && typeof ink === 'string' && alphaOf(ink) >= 0.5 ? lum(ink) : null, b = on ? lum(on.fill) : null;
          out.push({ key, cls: 'mark', paint, stroke, c, on: a != null && b != null ? +pgCr(a, b).toFixed(2) : null });
        }
      });
      return out;
    },
    gate(sc){ const r = pgCheck(sc); return { fails: r.fails.map(f => f.code + '|' + f.line), legib: r.legib, lines: r.lines.filter(l => l.core != null).map(l => [l.name, l.role, l.core]) }; },
    pixels(sc){ const c = sc.toCanvasElement(0.25); return Array.from(c.getContext('2d').getImageData(0, 0, c.width, c.height).data.filter((_, i) => i % 4 !== 3)); },
    shot(sc){ return sc.toDataURL({ format: 'jpeg', quality: 0.8, multiplier: 0.5 }); },
    themes(){ return COLOR_THEMES.map(t => t.name); },
    chip(name){ return [...document.querySelectorAll('#ez-themes .ez-theme')].find(b => (b.dataset.theme !== undefined ? b.dataset.theme : (b.title || '').split(' · ')[0]) === name); },
    chosenChip(){ const b = document.querySelector('#ez-themes .ez-theme.active'); return b ? (b.dataset.theme !== undefined ? b.dataset.theme : (b.title || '').split(' · ')[0]) : null; },
    drawnTheme(){ return ez.theme ? (ez.theme.name || ez.theme) : ''; },
  };
};
/* ...in its own browser context: the studio keeps the visitor's draft (the
   overlay, the blur, the theme) in localStorage, and a page opened in the
   same context inherited the previous card's, so a card could start with
   Shade already on and measure Shade as changing nothing. */
async function openPage(){
  if (page) await page.close().catch(() => {});
  if (ctx) await ctx.close().catch(() => {});
  ctx = await browser.createBrowserContext();
  page = await ctx.newPage();
  await page.setViewport({ width: 1400, height: 1000 });
  page.on('pageerror', e => pageErrors.push(String(e).slice(0, 200)));
  await offline(page);
  await page.goto(BASE, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => typeof renderEzCanvas === 'function' && typeof pgCheck === 'function' && typeof COLOR_THEMES !== 'undefined', { timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 2000));
  await page.evaluate(installHelpers);
  if (SHOTS) await page.evaluate(() => { window.__shots = true; });
}
await openPage();

const sceneOf = async (act) => page.evaluate(async (act) => {
  if (act) await (new Function('return (async () => {' + act + '})()'))();
  const sc = __ez.scene();
  const r = { inv: __ez.inventory(sc), gate: __ez.gate(sc), px: __ez.pixels(sc), shot: null };
  if (window.__shots) r.shot = __ez.shot(sc);
  sc.dispose();
  return r;
}, act);
const diffPct = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 3) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 24) n++; return +(100 * n / (a.length / 3)).toFixed(1); };
/* a critical line (headline, number, CTA) failing the gate that did not before,
   or any other reading line (selling points, items, kicker, website) falling
   under 3:1 where it read before: the gate only fails the critical three */
const regress = (base, now) => { const was = new Set(base.gate.fails);
  const crit = now.gate.fails.filter(f => /^(legib|numInk|ghost)\|/.test(f) && !was.has(f));
  const B = Object.fromEntries(base.gate.lines.map(l => [l[0], l[2]]));
  const minor = now.gate.lines.filter(l => !/^(headline|phone|cta)$/.test(l[1]) && l[2] < 3 && (B[l[0]] == null || B[l[0]] >= 3)).map(l => 'minor|' + l[0] + ' ' + l[2]);
  return crit.concat(minor); };
const save = (name, r) => { if (SHOTS && r.shot) writeFileSync(OUT + name + '.jpg', Buffer.from(r.shot.split(',')[1], 'base64')); };

const THEMES = await page.evaluate(() => __ez.themes());
const themes = QUICK ? THEMES.filter((_, i) => i % 4 === 0) : THEMES;
const problems = [], rows = [];
const P = (card, what, detail) => problems.push({ card, what, detail });

for (const card of cards){
  await openPage();
  const tid = await page.evaluate(id => __ez.open(id), card).catch(e => { P(card, 'open', String(e).slice(0, 120)); return null; });
  if (!tid){ continue; }
  const hasOriginal = await page.evaluate(() => !!__ez.chip(''));
  if (hasOriginal) await page.evaluate(() => __ez.chip('').click());
  const base = await sceneOf('');
  save(card + '-0-original', base);
  const baseBy = Object.fromEntries(base.inv.map(x => [x.key, x]));
  const plates = base.inv.filter(x => x.cls === 'plate'), chromatic = base.inv.filter(x => x.c >= 0.04);
  const row = { card, plates: plates.length, chromatic: chromatic.length, themes: {} };
  for (const name of themes){
    const r = await sceneOf(`__ez.chip(${JSON.stringify(name)}).click();`);
    save(card + '-' + name.replace(/\W+/g, '_'), r);
    const by = Object.fromEntries(r.inv.map(x => [x.key, x]));
    const unthemed = plates.filter(p => by[p.key] && by[p.key].paint === p.paint).map(p => p.key);
    const left = chromatic.filter(x => by[x.key] && by[x.key].paint === x.paint && (x.cls !== 'mark' || !x.stroke || by[x.key].stroke === x.stroke)).map(x => x.key);
    const reg = regress(base, r);
    row.themes[name] = { changed: diffPct(base.px, r.px), unthemed: unthemed.length, left: left.length, legib: r.gate.legib, reg: reg.length };
    const lost = base.inv.filter(x => x.cls === 'mark' && x.on != null && x.on >= 2 && by[x.key] && by[x.key].on != null && by[x.key].on < 2).map(x => x.key + ' ' + by[x.key].on);
    row.themes[name].lost = lost.length;
    if (lost.length) P(card, 'theme ' + name + ': marks lost on what they sit on', lost.join(', '));
    if (unthemed.length) P(card, 'theme ' + name + ': plates left in the old colour', unthemed.join(', '));
    if (left.length) P(card, 'theme ' + name + ': old palette colours left', left.join(', '));
    if (reg.length) P(card, 'theme ' + name + ': legibility regressions', reg.join(', '));
    const st = await page.evaluate(() => ({ chip: __ez.chosenChip(), drawn: __ez.drawnTheme() }));
    if (st.chip !== name || st.drawn !== name) P(card, 'theme ' + name + ': chip and drawing disagree', JSON.stringify(st));
  }
  /* grounds, with no theme, under a light theme and under a dark one: the
     copy has to follow its ground either way (with a theme on, the six
     swatches are the theme's own) */
  for (const name of [hasOriginal ? '' : null, THEMES.find(n => /Silver & Blue/.test(n)), THEMES.find(n => /Black & Green/.test(n))].filter(n => n != null)){
    await page.evaluate(n => __ez.chip(n).click(), name);
    let prev = await sceneOf(`document.querySelector('.ez-sw.orig').click();`);
    const grounds = [['preset 1', `document.querySelector('.ez-sw[data-i="0"]').click();`], ['preset 3', `document.querySelector('.ez-sw[data-i="2"]').click();`],
      ['preset 6', `document.querySelector('.ez-sw[data-i="5"]').click();`], ['custom white', `const i = $('ez-custom-color'); i.value = '#ffffff'; i.dispatchEvent(new Event('input'));`],
      ['drawn ground', `const t = document.querySelector('#ez-bgstyles [data-style="gradient"]'); if (t){ t.click(); const b = document.querySelector('#ez-drawn .ez-gsw'); if (b) b.click(); }`],
      ['ORIG', `document.querySelector('.ez-sw.orig').click();`]];
    for (const [g, act] of grounds){
      const r = await sceneOf(act);
      const label = name || 'No theme';
      save(card + '-' + label.replace(/\W+/g, '_') + '-' + g.replace(/\W+/g, '_'), r);
      const reg = regress(base, r), d = diffPct(prev.px, r.px);
      row['ground ' + label + ' / ' + g] = { changed: d, legib: r.gate.legib, reg: reg.length };
      if (reg.length) P(card, label + ' on ' + g + ': legibility regressions', reg.join(', '));
      prev = r;
    }
  }
  // effects, on the photograph and on a flat ground
  if (hasOriginal) await page.evaluate(() => __ez.chip('').click());
  let prev = await sceneOf(`document.querySelector('.ez-sw.orig').click(); const s = $('fx-blur'); s.value = 0; s.dispatchEvent(new Event('input'));`);
  const photo = await page.evaluate(() => { const t = ezTpl(); return !!(t.bg && t.bg.type === 'image'); });
  const blur = await sceneOf(`const s = $('fx-blur'); s.value = 12; s.dispatchEvent(new Event('input'));`);
  row.blurPhoto = diffPct(prev.px, blur.px);
  if (photo && row.blurPhoto < 1) P(card, 'blur on the photograph changes nothing', row.blurPhoto + '%');
  await sceneOf(`const s = $('fx-blur'); s.value = 0; s.dispatchEvent(new Event('input')); document.querySelector('.ez-sw[data-i="1"]').click();`);
  const flat = await page.evaluate(() => { const s = $('fx-blur'); return { disabled: s.disabled, note: (s.closest('.ez-fxline') || {}).title || '' }; });
  const f0 = await sceneOf(''), f1 = await sceneOf(`const s = $('fx-blur'); if (!s.disabled){ s.value = 12; s.dispatchEvent(new Event('input')); }`);
  row.blurFlat = flat.disabled ? 'off' : diffPct(f0.px, f1.px);
  if (!flat.disabled && row.blurFlat < 1) P(card, 'blur on a flat ground is live and changes nothing', row.blurFlat + '%');
  await page.evaluate(() => { const s = $('fx-blur'); s.disabled = false; s.value = 0; s.dispatchEvent(new Event('input')); document.querySelector('.ez-sw.orig').click();
    document.querySelector('#fx-ov-seg [data-ov="none"]').click(); });
  prev = await sceneOf('');
  for (const ov of ['down', 'up', 'shade', 'tint']){
    const has = await page.evaluate(ov => !!document.querySelector('#fx-ov-seg [data-ov="' + ov + '"]'), ov);
    if (!has) continue;
    const r = await sceneOf(`document.querySelector('#fx-ov-seg [data-ov="${ov}"]').click();`);
    save(card + '-overlay-' + ov, r);
    row['overlay ' + ov] = diffPct(prev.px, r.px);
    if (row['overlay ' + ov] < 1) P(card, 'overlay ' + ov + ' changes nothing', row['overlay ' + ov] + '%');
    const reg = regress(prev, r).filter(f => !/^minor\|/.test(f));
    if (reg.length) P(card, 'overlay ' + ov + ': legibility regressions', reg.join(', '));
  }
  await page.evaluate(() => document.querySelector('#fx-ov-seg [data-ov="none"]').click());
  /* the patterns are fine lines and dots (a 1.5px grid at 0.14): measured at
     full size, in the page, since a quarter-size render blurs them away */
  row.patterns = await page.evaluate(async () => {
    const seg = document.getElementById('fx-pat-seg'); if (!seg) return null;
    const keys = [...seg.querySelectorAll('[data-pat]')].map(b => b.dataset.pat).filter(k => k !== 'none' && k !== '__tone');
    if (!keys.length) return null;
    const px = () => { const sc = __ez.scene(), c = sc.toCanvasElement(1), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; sc.dispose(); return d; };
    const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 24) n++; return +(100 * n / (a.length / 4)).toFixed(1); };
    const press = k => seg.querySelector('[data-pat="' + k + '"]').click();
    press('none'); const p0 = px(), out = {};
    for (const k of keys){ press(k); out[k] = diff(p0, px()); }
    press(keys[0]); const d0 = px(); press('__tone'); out.__tone = diff(d0, px());   // "Light" turns the pattern's ink over
    if (ez.fx.ptone === 'light') press('__tone');
    press('none');
    return out;
  });
  if (row.patterns) Object.entries(row.patterns).forEach(([k, v]) => { if (v < 1) P(card, (k === '__tone' ? 'pattern tone "Light"' : 'pattern ' + k) + ' changes nothing', v + '%'); });
  // "Original" puts every colour back
  if (hasOriginal){
    await page.evaluate(n => __ez.chip(n).click(), THEMES[THEMES.length - 1]);
    const r = await sceneOf(`__ez.chip('').click();`);
    const drift = r.inv.filter(x => baseBy[x.key] && (baseBy[x.key].paint !== x.paint || baseBy[x.key].stroke !== x.stroke)).map(x => x.key);
    if (drift.length) P(card, 'Original does not restore the card', drift.join(', '));
  } else P(card, 'no way back', 'there is no "Original" chip to take a theme off');
  rows.push(row);
  const ts = Object.values(row.themes);
  console.log(card.padEnd(24) + ` plates ${String(row.plates).padStart(2)} · unthemed plates ${ts.filter(t => t.unthemed).length}/${ts.length} themes · leftovers ${ts.reduce((s, t) => s + t.left, 0)}`
    + ` · regressions ${ts.reduce((s, t) => s + t.reg, 0)} · changed ${Math.min(...ts.map(t => t.changed))}-${Math.max(...ts.map(t => t.changed))}% · blur photo ${row.blurPhoto}% flat ${row.blurFlat}`);
}
// the chip follows the drawing across a template switch
{
  const [a, b] = [cards[0], cards[1] || cards[0]];
  await openPage();
  await page.evaluate(id => __ez.open(id), a);
  await page.evaluate(n => __ez.chip(n).click(), THEMES[0]);
  await page.evaluate(id => __ez.open(id), b);
  const st = await page.evaluate(() => ({ chip: __ez.chosenChip(), drawn: __ez.drawnTheme() }));
  if ((st.chip || '') !== (st.drawn || '')) P(b, 'after a template switch the chip and the drawing disagree', JSON.stringify(st));
}
// the six swatches are the theme's, and a swatch picked under one theme is the same swatch of the next
{
  const [a, b] = [THEMES.find(n => /Silver & Blue/.test(n)) || THEMES[0], THEMES.find(n => /Black & Green/.test(n)) || THEMES[1]];
  await openPage();
  await page.evaluate(id => __ez.open(id), cards[0]);
  const st = await page.evaluate((a, b) => {
    const bgs = () => [...document.querySelectorAll('#ez-swatches .ez-sw[data-i]')].map(x => x.style.background).join('|');
    if (__ez.chip('')) __ez.chip('').click();
    const none = bgs(); __ez.chip(a).click(); const A = bgs();
    document.querySelector('.ez-sw[data-i="2"]').click(); __ez.chip(b).click();
    return { none, A, B: bgs(), sel: !!document.querySelector('.ez-sw[data-i="2"].sel'), theme: ez.bg && ez.bg.theme, slot: ez.bg && ez.bg.slot };
  }, a, b);
  if (st.A === st.none || st.B === st.A) P('swatches', 'the six swatches do not follow the theme', JSON.stringify({ none: st.none.slice(0, 60), A: st.A.slice(0, 60) }));
  if (!st.sel || st.theme !== b || st.slot !== 2) P('swatches', 'a swatch picked under one theme is not the same swatch of the next', JSON.stringify(st).slice(0, 200));
}
await browser.close();

console.log('\n' + (problems.length ? problems.length + ' problems' : 'no problems') + ` over ${rows.length} cards × ${themes.length} themes · page errors ${pageErrors.length}`);
const byWhat = {};
problems.forEach(p => { const k = p.what.replace(/^theme [^:]+: /, 'theme: ').replace(/^(No theme|Silver & Blue|Black & Green) on [^:]+: /, 'ground: '); (byWhat[k] = byWhat[k] || []).push(p.card); });
Object.entries(byWhat).forEach(([k, v]) => console.log('  ' + String(v.length).padStart(4) + '  ' + k + '  (' + [...new Set(v)].slice(0, 6).join(', ') + ([...new Set(v)].length > 6 ? ', …' : '') + ')'));
pageErrors.slice(0, 5).forEach(e => console.log('  page error: ' + e));
if (argv('--json')) writeFileSync(argv('--json'), JSON.stringify({ rows, problems, pageErrors }, null, 1));
process.exit(problems.length || pageErrors.length ? 1 : 0);
