#!/usr/bin/env node
/* COLOUR BUILDER AUDIT — is every set the builder offers one the house would
 * ship, and does it hold on real cards? (DESIGN-LAW rule 110)
 *
 * The builder (colour-builder.js) checks its own sets before it shows them.
 * A check that grades its own homework can share its own mistake, so this
 * re-scores every set with maths of its own: WCAG luminance and contrast and
 * the Brettel/Viénot simulation as theme_law.mjs writes them, and rule 103's
 * muddy() and namedBand() imported from refresh_palettes.mjs itself.
 *
 *   sets   both looks (dark and light), every starting colour (and a few
 *          colours a visitor might pick), every partner it lists, every
 *          arrangement, every small-print option. Each must hold:
 *            text on both background stops    >= 4.5 normal, protan, deutan, tritan
 *            bright colour on both stops      >= 4.5 normal, >= 3.0 worst colour-blind
 *            bright colour against the text   >= 1.7 (the money word is a colour)
 *            small print on both stops        >= 4.5 under all four
 *            the number on its bright box     >= 3.0
 *            bright colour and small print not muddy (rule 103), the bright
 *            colour inside its named band, chroma >= 0.09, and the small
 *            print within 30 degrees of the background's or a bright
 *            colour's hue (two families, rules 95 and 103)
 *          and every one of rule 103's twelve ready-made pairs must be
 *          offered from both of its colours, in its own look (Silver &
 *          Blue on light, the other eleven on dark).
 *   tweaks the two ends of every slider on every set (background shade,
 *          bright colour shade and strength, small print shade), each
 *          background style the builder offers, and a list of typed brand
 *          colours on a sample of sets: scored the same way, except the
 *          named band (a visitor may make their red lighter than a red).
 *   cards  (skip with --sets-only) one set per starting colour on a sample of
 *          cards, applied in Easy Mode the way a visitor applies it, measured
 *          by the gate (pgCheck, rule 87) against the card's own colours: a
 *          critical line that fails where it passed, or another reading line
 *          that falls under 3:1, is a regression. Two house themes run as a
 *          control on the same cards. A warm colour drawn under its muddy
 *          floor anywhere on the card is counted and reported (not failed:
 *          on main it comes from the one-colour pass, house themes do it too,
 *          and rule 95's reconciliation on claude/fervent-pascal-w6mthe
 *          fixes it there).
 *
 * usage:  python3 -m http.server 8899   then
 *         CHROME=/path/to/chrome [FABRIC_JS=/path/to/fabric.min.js] \
 *           node scripts/colour_builder_audit.mjs [--sets-only] [--cards a,b] [--json out.json]
 * Exits 1 on any failure. */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { BASE, offline } from './_showcase_harness.mjs';
import { muddy, namedBand, parse, toOklch, atLuminance } from './refresh_palettes.mjs';

const argv = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const SETS_ONLY = process.argv.includes('--sets-only');
/* three classics and four live showcase cards of four layouts: a light set
   (gradientWave, Silver & Blue), a glass card, a band headline, a checklist */
const CARDS = argv('--cards') ? argv('--cards').split(',')
  : ['top_buyer', 'cars_kbb', 'pkm_binder', 'checklistHero-jw07-15', 'gradientWave-nn05-15', 'glassCard-cd06-15', 'bandKnockout-pp02-15'];
const CONTROL = ['Night Blue', 'Orchid Payday'];
const PICKS = ['#0d1b2a', '#3b82f6', '#c2185b', '#9acd32', '#808080', '#ffd700', '#e0f7fa', '#14532d', '#7c2d12', '#f97316'];

/* ── the audit's own maths (theme_law.mjs) ─────────────────────────────── */
const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const rgb = hex => { const n = parseInt(String(hex).replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lum = hex => { const [r, g, b] = rgb(hex); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
const cr = (a, b) => { const A = lum(a), B = lum(b); return (Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05); };
function simulate(hex, kind){
  let [r, g, b] = rgb(hex).map(lin);
  let L = 0.31399022 * r + 0.63951294 * g + 0.04649755 * b;
  let M = 0.15537241 * r + 0.75789446 * g + 0.08670142 * b;
  let S = 0.01775239 * r + 0.10944209 * g + 0.87256922 * b;
  if (kind === 'protan') L = 1.05118294 * M - 0.05116099 * S;
  if (kind === 'deutan') M = 0.9513092 * L + 0.04866992 * S;
  if (kind === 'tritan') S = -0.86744736 * L + 1.86727089 * M;
  const R = 5.47221206 * L - 4.6419601 * M + 0.16963708 * S;
  const G = -1.1252419 * L + 2.29317094 * M - 0.1678952 * S;
  const B = 0.02980165 * L - 0.19318073 * M + 1.16364789 * S;
  const un = c => { c = Math.max(0, Math.min(1, c)); return Math.round(255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055)); };
  return '#' + [un(R), un(G), un(B)].map(v => v.toString(16).padStart(2, '0')).join('');
}
const CVD = ['protan', 'deutan', 'tritan'];
const worst = (fg, grounds, kinds) => Math.min(...kinds.flatMap(k => grounds.map(g => k === 'normal' ? cr(fg, g) : cr(simulate(fg, k), simulate(g, k)))));
const ok = hex => toOklch(parse(hex));
const gap = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

function score(t, tweak){
  const g = [t.c1, t.c2], bad = [];
  const text = worst(t.ink, g, ['normal', ...CVD]);
  const bright = worst(t.accent, g, ['normal']), brightCvd = worst(t.accent, g, CVD);
  const vsText = cr(t.accent, t.ink), small = worst(t.support, g, ['normal', ...CVD]), number = cr(t.pin, t.accent);
  if (text < 4.5) bad.push('text ' + text.toFixed(2));
  if (bright < 4.5) bad.push('bright ' + bright.toFixed(2));
  if (brightCvd < 3) bad.push('bright colour-blind ' + brightCvd.toFixed(2));
  if (vsText < 1.7) bad.push('bright vs text ' + vsText.toFixed(2));
  if (small < 4.5) bad.push('small print ' + small.toFixed(2));
  if (number < 3) bad.push('number on box ' + number.toFixed(2));
  const A = ok(t.accent), Sp = ok(t.support), Ya = lum(t.accent), Ys = lum(t.support);
  if (muddy(A.H, Ya)) bad.push('bright muddy');
  if (Sp.C >= 0.05 && muddy(Sp.H, Ys)) bad.push('small print muddy');
  const band = namedBand(A.H);
  if (!tweak && (Ya < band[0] - 1e-4 || Ya > band[1] + 1e-4)) bad.push(`bright outside its named band (Y ${Ya.toFixed(3)})`);
  /* rule 103's chroma floor where the screen can show it: 0.12 (0.13 warm),
     or the most the gamut holds at that luminance less 0.02, never under
     0.06 (a deep teal holds 0.07) */
  const floorC = (h, Y) => { const most = toOklch(atLuminance(h, 0.4, Y)).C; return Math.max(0.06, Math.min(h >= 35 && h < 140 ? 0.13 : 0.12, most - 0.02)) - 0.005; };
  if (A.C < floorC(A.H, Ya)) bad.push('bright dull C ' + A.C.toFixed(3));
  if (Sp.C < floorC(Sp.H, Ys)) bad.push('small print dull C ' + Sp.C.toFixed(3));
  /* two families at most (rules 95, 103): the bright colour, the small
     print and the background when it is a colour; the text is near-black or
     near-white and does not count; within 30 degrees is one family */
  const fams = [];
  [A, Sp].concat(ok(t.c1).C >= 0.03 ? [ok(t.c1)] : []).forEach(o => { if (!fams.some(h => gap(h, o.H) <= 30)) fams.push(o.H); });
  if (fams.length > 2) bad.push('a third colour family');
  return { bad, text, bright, brightCvd, vsText, small, number };
}

/* ── the page ─────────────────────────────────────────────────────────── */
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new', args: ['--no-sandbox'], protocolTimeout: 0 });
const pageErrors = [];
async function openPage(){
  const ctx = await browser.createBrowserContext(), page = await ctx.newPage();
  await page.setViewport({ width: 1400, height: 1000 });
  page.on('pageerror', e => pageErrors.push(String(e).slice(0, 200)));
  await offline(page);
  await page.goto(BASE, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => typeof renderEzCanvas === 'function' && typeof pgCheck === 'function' && typeof cbPartners === 'function', { timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  return { ctx, page };
}

let fails = 0;
const report = { sets: [], left: [], ready: [], cards: [] };
{
  const { ctx, page } = await openPage();
  /* the live counts the landing sorts by, once the library is in */
  await page.waitForFunction(() => typeof SHOWCASE !== 'undefined' && SHOWCASE.palN, { timeout: 60000 }).catch(() => {});
  const all = await page.evaluate(picks => {
    const out = [], left = [], tweaks = [], counts = (SHOWCASE && SHOWCASE.palN) || {};
    const starts = CB_COLOURS.map(c => c.key).concat(picks);
    const row = (th, extra) => Object.assign({ name: th.name, c1: th.bg.c1, c2: th.bg.c2, ink: th.ink, accent: th.accent, support: th.support, pin: cbPlateInk(th) }, extra);
    const BRAND = { bg: ['#1a1a2e', '#0d3b66', '#2b6cb0', '#14532d', '#3c1361', '#7f1d1d', '#ffffff', '#fff3c4', '#e0f7fa'],
      acc: ['#ffd700', '#e10600', '#ff6b00', '#00a86b', '#7a5c00', '#1e90ff', '#c0c0c0'], sup: ['#00ff00', '#9bd1ff', '#ffe08a'] };
    ['dark', 'light'].forEach(mode => starts.forEach(k => {
      const S = cbColour(k), r = cbPartners(S, counts, mode);
      r.left.forEach(l => left.push({ mode, start: k, partner: l.P.key, why: l.why }));
      r.list.forEach((x, pi) => x.sets.forEach((set, ai) => set.supports.forEach((_, si) => {
        const th = cbTheme(set, si);
        out.push(row(th, { mode, start: k, partner: x.P.key, pi, ai, si, ready: x.ready, n: x.n, setMode: set.mode, pairHex: set.pair ? set.pair.hex : null, own: cbCheck(th).ok && cbTweakOk(th) }));
        if (si || k.startsWith('#')) return;
        /* the tweaks: each slider's two ends, each style the builder offers */
        [['bg', 'L'], ['acc', 'L'], ['acc', 'C'], ['sup', 'L']].forEach(([key, f]) => {
          const rg = cbRange(th, set.mode, {}, key, f); if (!rg) return;
          [rg.lo, rg.hi].forEach(v => { const tw = { [key]: Object.assign(cbCur(th, set.mode, {}, key), { [f]: v }) };
            const t2 = cbApply(th, set.mode, tw); tweaks.push(row(t2, { mode, start: k, partner: x.P.key, what: key + '.' + f + '=' + v.toFixed(3), own: cbTweakOk(t2) })); });
        });
        ['flat', 'deep'].forEach(g => { const t2 = cbApply(th, set.mode, { grad: g, bg: cbLch(th.bg.c1) });
          if (cbTweakOk(t2)) tweaks.push(row(t2, { mode, start: k, partner: x.P.key, what: 'style ' + g, own: true })); });
        /* typed brand colours, on the first set of each starting colour */
        if (pi || ai) return;
        Object.entries(BRAND).forEach(([key, hexes]) => hexes.forEach(hex => { const e = cbExact(th, set.mode, {}, key, hex);
          if (e.tw){ const t2 = cbApply(th, set.mode, e.tw); tweaks.push(row(t2, { mode, start: k, partner: x.P.key, what: key + ' typed ' + hex, own: cbTweakOk(t2) })); } }));
      })));
    }));
    const partners = Object.fromEntries(['dark', 'light'].map(m => [m, Object.fromEntries(CB_COLOURS.map(c => [c.key, cbPartners(cbColour(c.key), counts, m).list.filter(x => x.ready).map(x => x.P.key)]))]));
    return { out, left, tweaks, ready: CB_READY, light: CB_READY_LIGHT, partners };
  }, PICKS);
  for (const t of all.out){
    const s = score(t);
    if (s.bad.length || !t.own){ fails++; console.log(`  FAIL ${t.mode} ${t.start} + ${t.partner} (${t.name}, small print ${t.si}): ${s.bad.join('; ') || 'the builder\'s own check disagrees'}`); }
    report.sets.push(Object.assign({}, t, { score: s }));
  }
  report.tweaks = [];
  let tweakFails = 0;
  for (const t of all.tweaks){
    const s = score(t, true);
    if (s.bad.length || !t.own){ fails++; tweakFails++; if (tweakFails <= 20) console.log(`  FAIL tweak ${t.mode} ${t.start} + ${t.partner} ${t.what}: ${s.bad.join('; ') || 'the builder\'s own check disagrees'}`); }
    report.tweaks.push(Object.assign({}, t, { score: s }));
  }
  /* rule 103's twelve, offered from both ends, in their own look, and as ready-made */
  Object.entries(all.ready).forEach(([pair, name]) => {
    const m = all.light[name] ? 'light' : 'dark', [a, b] = pair.split('+');
    const both = (all.partners[m][a] || []).includes(b) && (all.partners[m][b] || []).includes(a);
    report.ready.push({ name, mode: m, both });
    if (!both){ fails++; console.log(`  FAIL ready-made ${name} is not offered as ready-made from both ${a} and ${b} on ${m}`); }
  });
  report.left = all.left;
  const sum = (list, k, tw) => list.reduce((m, t) => Math.min(m, score(t, tw)[k]), Infinity);
  const worst = (list, tw) => `worst text ${sum(list, 'text', tw).toFixed(2)} · bright ${sum(list, 'bright', tw).toFixed(2)} · bright colour-blind ${sum(list, 'brightCvd', tw).toFixed(2)} · bright vs text ${sum(list, 'vsText', tw).toFixed(2)} · small print ${sum(list, 'small', tw).toFixed(2)} · number ${sum(list, 'number', tw).toFixed(2)}`;
  for (const m of ['dark', 'light']){
    const here = all.out.filter(t => t.mode === m), shown = new Set(here.filter(t => !t.start.startsWith('#')).map(t => t.start + '+' + t.partner)).size;
    console.log(`\n${m}: ${here.length} sets (${shown} pairs from the 14 colours, plus ${PICKS.length} picked colours), ${all.left.filter(l => l.mode === m && !l.start.startsWith('#')).length} pairs left out`);
    console.log('  ' + worst(here));
  }
  console.log(`\ntweaks: ${all.tweaks.length} tweaked sets (slider ends, styles, typed brand colours), ${tweakFails} failing`);
  console.log('  ' + worst(all.tweaks, true));
  console.log(`  ready-made pairs offered from both colours in their own look: ${report.ready.filter(r => r.both).length} of ${report.ready.length}`);
  if (process.argv.includes('--left')) all.left.filter(l => !l.start.startsWith('#')).forEach(l => console.log(`  left out on ${l.mode}: ${l.start} + ${l.partner}: ${l.why}`));
  await ctx.close();

  if (!SETS_ONLY){
    /* the set each starting colour opens on (its first partner), each set
       once: navy and gold both open on Navy & Gold */
    const firsts = all.out.filter(t => !t.start.startsWith('#') && t.pi === 0 && t.ai === 0 && t.si === 0);
    const sample = [...new Map(firsts.map(t => [t.mode + ' ' + t.name, t])).values()];
    console.log(`\ncards: ${sample.length} builder sets (what the 14 colours open on, dark and light) and ${CONTROL.length} house themes on ${CARDS.length} cards`);
    for (const card of CARDS){
      const { ctx, page } = await openPage();
      await page.evaluate(() => { loadAccount = async () => account; account = { email: 'audit@local', role: 'user', plan: 'pro' }; });
      const opened = await page.evaluate(async id => {
        document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
        if (TEMPLATES.some(t => t.id === id)) showEasy(id);
        else { await scLoadIndex(); if (!SHOWCASE.byId[id]) return null; await openShowcase(id); }
        document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
        $('ez-phone').value = '(562) 999-4994';
        const t = ezTpl();
        await new Promise(r => { if (!(t.bg && t.bg.src) || isDrawnSrc(t.bg.src) || (TPL_BG_ELS[t.bg.src] && TPL_BG_ELS[t.bg.src].width)) return r();
          const el = new Image(); el.onload = () => { TPL_BG_ELS[t.bg.src] = el; r(); }; el.onerror = r; el.src = (window.TPL_BG_DATA && TPL_BG_DATA[t.bg.src]) || assetUrl(t.bg.src); setTimeout(r, 12000); });
        await document.fonts.ready; await new Promise(r => setTimeout(r, 400));
        return ez.tpl;
      }, card).catch(() => null);
      /* the card measured is the card named (rule 67); one the studio will not
         open is the studio's problem, not a set's, and is skipped, said so */
      const shown = opened && (opened === card || opened === 'sc-' + card);
      if (!shown){ console.log(`  ${card}: skipped, the studio opened ${opened || 'nothing'}`); report.cards.push({ card, skipped: opened || null }); await ctx.close(); continue; }
      const measure = th => page.evaluate(th => {
        applyColorTheme(th); clearTimeout(ezPrevTimer);
        const sc = renderEzCanvas(1080, 'png', undefined, undefined, 'square', true), r = pgCheck(sc);
        const warm = h => h >= 35 && h < 140, floor = h => h >= 35 && h < 45 ? 0.12 : h >= 45 && h < 65 ? 0.2 : h >= 65 && h < 105 ? 0.33 : h >= 105 && h < 120 ? 0.3 : h >= 120 && h < 140 ? 0.22 : 0;
        const muddy = [];
        sc.getObjects().forEach(o => { if (!o || o.visible === false || o.type === 'image') return;
          const paints = typeof o.fill === 'string' ? [o.fill] : o.fill && o.fill.colorStops ? o.fill.colorStops.map(s => s.color) : [];
          paints.forEach(f => { const c = pgRgb(f); if (!c || c[3] < 0.3) return; const hex = '#' + c.slice(0, 3).map(v => Math.round(v).toString(16).padStart(2, '0')).join(''), k = hexToOklch(hex);
            if (k && k.C >= 0.05 && warm(k.h) && pgLum(hex) < floor(k.h) - 1e-3) muddy.push((o.name || o.type) + ' ' + hex); }); });
        const out = { fails: r.fails.map(f => f.code + '|' + f.line), lines: r.lines.filter(l => l.core != null).map(l => [l.name, l.role, +l.core.toFixed(2)]), muddy };
        sc.dispose(); return out;
      }, th);
      const base = await measure(null);
      const was = new Set(base.fails), B = Object.fromEntries(base.lines.map(l => [l[0], l[2]]));
      const regress = now => now.fails.filter(f => /^(legib|numInk|ghost)\|/.test(f) && !was.has(f))
        .concat(now.lines.filter(l => !/^(headline|phone|cta)$/.test(l[1]) && l[2] < 3 && (B[l[0]] == null || B[l[0]] >= 3)).map(l => 'minor|' + l[0] + ' ' + l[2]));
      const row = { card, builder: {}, control: {} };
      for (const t of sample){
        const th = { name: t.name, family: 'Yours', bg: { type: 'grad', c1: t.c1, c2: t.c2, a: 170 }, accent: t.accent, ink: t.ink, support: t.support };
        const m = await measure(th), reg = regress(m);
        row.builder[t.mode + ' ' + t.name] = { reg, muddy: m.muddy };
        if (reg.length){ fails++; console.log(`  FAIL ${card} in ${t.name} (${t.mode}): ${reg.join(', ')}`); }
      }
      for (const name of CONTROL){
        const m = await page.evaluate(n => COLOR_THEMES.find(t => t.name === n), name).then(measure);
        row.control[name] = { reg: regress(m), muddy: m.muddy };
      }
      const bm = Object.values(row.builder).filter(x => x.muddy.length).length, cm = Object.values(row.control).filter(x => x.muddy.length).length;
      const creg = Object.entries(row.control).filter(([, x]) => x.reg.length).map(([n, x]) => n + ': ' + x.reg.join(', '));
      console.log(`  ${card}: ${Object.values(row.builder).filter(x => !x.reg.length).length} of ${sample.length} sets hold; muddy paint under ${bm} sets (house control: ${cm} of ${CONTROL.length})${creg.length ? '; house control regressions: ' + creg.join('; ') : ''}`);
      report.cards.push(row);
      await ctx.close();
    }
  }
}
if (!SETS_ONLY && report.cards.filter(c => !c.skipped).length < Math.min(4, CARDS.length)){ fails++; console.log('\nfewer than four cards measured'); }
if (pageErrors.length){ fails++; console.log('\npage errors:', pageErrors.slice(0, 5)); }
const out = argv('--json'); if (out) writeFileSync(out, JSON.stringify(report, null, 1));
console.log(fails ? `\n${fails} failure(s)` : '\nall checks pass');
await browser.close();
process.exit(fails ? 1 : 0);
