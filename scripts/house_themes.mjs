#!/usr/bin/env node
/* THE HOUSE COLOUR THEMES ARE THE LIBRARY'S TWELVE PAIRINGS (DESIGN-LAW rule 114).
 *
 * Easy Mode's and the designer's colour row used to offer 21 themes of their
 * own ("Blue Market", "Orchid Payday", "Gold Offer", "Hot Sale"...), named
 * and built before rule 103 moved the library onto twelve proven two-colour
 * pairings. So the landing said "Navy & Gold" and the studio said "Blue
 * Ticket"; four of the 21 carried a third hue, five drew a brown or olive
 * accent under rule 103's muddy floor, and the chip's title showed internal
 * words ("GFX Grammar", "iOS Flat").
 *
 * This solves each of rule 103's twelve pairings into a theme record through
 * the colour builder's own solver (cbArrangements, colour-builder.js), in the
 * look the builder calls that pairing ready-made in (Silver & Blue on light,
 * the eleven on dark), and prints the COLOR_THEMES literal for app.js, with
 * every retired name under `aka` so a draft or project made under one reopens
 * in the nearest new theme. Deterministic: the engine chooses, it does not
 * roll (rule 75).
 *
 * usage:  npx http-server -p 8899 -s -c-1 .   then
 *         CHROME=/path/to/chrome [FABRIC_JS=/path/to/fabric.min.js] \
 *           node scripts/house_themes.mjs [--json out.json] [--write]
 * Prints the literal; --json also writes the records; --write puts the
 * literal into app.js (the rows of COLOR_THEMES; its comment stays). */
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync } from 'node:fs';
import { BASE, offline } from './_showcase_harness.mjs';
import { PALETTES } from './refresh_palettes.mjs';

const argv = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };

/* the pairings by the two colours that make them, as the builder keys them
   (CB_READY in colour-builder.js); the first colour is the background */
const src = readFileSync(new URL('../colour-builder.js', import.meta.url), 'utf8');
const readyLit = src.slice(src.indexOf('const CB_READY = {'), src.indexOf('};', src.indexOf('const CB_READY = {')) + 2);
const CB_READY = (0, eval)('(' + readyLit.replace(/^const CB_READY = /, '').replace(/;$/, '') + ')');
const PAIRS = Object.entries(CB_READY).map(([k, name]) => { const [g, a] = k.split('+'); return { g, a, name, mode: g === 'white' ? 'light' : 'dark' }; });
PALETTES.forEach(p => { if (!PAIRS.some(q => q.name === p.name)) throw new Error('no builder pair for palette ' + p.name); });
PAIRS.forEach(q => { if (!PALETTES.some(p => p.name === q.name)) throw new Error('builder pair with no palette: ' + q.name); });
/* the pairs come out in the order the library's palettes are listed (rule 103) */
PAIRS.sort((x, y) => PALETTES.findIndex(p => p.name === x.name) - PALETTES.findIndex(p => p.name === y.name));

/* the 21 retired themes, by name, with the colours a draft was made in */
const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const RETIRED = [
  ['Blue Market', '#aae8ff', '#005284'], ['Blue Ticket', '#02383e', '#ff83b6'], ['Mint Market', '#003a21', '#cd92ff'],
  ['Orchid Payday', '#47205e', '#d1b906'], ['Indigo Cash', '#0e253c', '#fe7f78'], ['Indigo Trade', '#cde1ff', '#4839b8'],
  ['Blue Deal', '#afe7ff', '#98056e'], ['Sky Market', '#b9f7f6', '#9b2000'], ['Violet Payday', '#ecefff', '#3d40bc'],
  ['Gold Offer', '#fdf4ee', '#904d03'], ['Mint Counter', '#f2f8ef', '#325f01'], ['Red Cash', '#faf5f7', '#a10966'],
  ['Cash Green', '#123123', '#4ade80'], ['Night Blue', '#0f1b3d', '#ffa62b'], ['Deep Red', '#2a0a0e', '#ff6b57'],
  ['Electric Cyan', '#07222b', '#54d4ee'], ['Clean Slate', '#141a20', '#b1bec9'], ['Hot Sale', '#fff1d6', '#9f2d1f'],
  ['Electric Trust', '#101a3a', '#ff6a55'], ['Fresh Cash', '#174c3c', '#f7a15a'], ['Night Neon', '#121212', '#ff8b3d'],
];

const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new', args: ['--no-sandbox'], protocolTimeout: 0 });
const page = await browser.newPage();
const errors = []; page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
await offline(page);
await page.goto(BASE + '?look=graphite-orchid', { waitUntil: 'networkidle2', timeout: 120000 });
await page.waitForFunction(() => typeof cbArrangements === 'function' && typeof cbTheme === 'function' && typeof hexToOklch === 'function', { timeout: 60000 });

const out = await page.evaluate((PAIRS, RETIRED) => {
  const themes = PAIRS.map(q => {
    const S = cbColour(q.g), P = cbColour(q.a);
    const r = cbArrangements(S, P, q.mode);
    /* the ready-made arrangement is the first colour as the background */
    const set = r.ok.find(s => s.g.key === q.g && s.a.key === q.a) || r.ok[0];
    if (!set) return { name: q.name, err: r.why.join('; ') || 'no arrangement passes' };
    /* the small print is a shade of the bright colour's family, so the two
       colours in the name are the two colours on the card: a card whose
       badges and discs carry its own support colour comes out navy and gold
       under Navy & Gold, not navy and pale blue. The builder offers the
       ground's family first; a set the visitor builds may take either. */
    const si = Math.max(0, set.supports.findIndex(s => s.from === 'a'));
    const th = cbTheme(set, si, q.name);
    const chk = cbCheck(th);
    return { name: q.name, look: q.mode === 'light' ? 'Light' : 'Dark', bg: th.bg, accent: th.accent, ink: th.ink, support: th.support,
      supports: set.supports.map(s => s.from + ':' + s.hex), ok: chk.ok, rows: chk.rows, muddy: chk.muddy, plateInk: cbPlateInk(th) };
  });
  /* a retired name goes to the nearest new theme: by the hue of what it led
     with (its accent; a new theme's ground counts too, at a step back, so a
     lilac accent finds the purple ground), then its ground's hue (a black
     or a paper ground is neutral), and the side its ink was on counts most.
     Five whose name says a colour are pinned to that colour. */
  const PIN = { 'Gold Offer': 'Black & Gold', 'Cash Green': 'Black & Green', 'Blue Market': 'Silver & Blue', 'Orchid Payday': 'Purple & Gold', 'Electric Cyan': 'Midnight & Cyan' };
  const gap = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
  const lightOf = th => pgLum(th.ink) < pgLum(th.bg.c1);
  const gGap = (a, b) => (a.C < 0.05) === (b.C < 0.05) ? (a.C < 0.05 ? 0 : gap(a.h, b.h)) : 40;
  RETIRED.forEach(([name, c1, acc]) => {
    const ao = hexToOklch(acc), go = hexToOklch(c1), light = pgLum(c1) > 0.4;
    const score = th => { const t = hexToOklch(th.accent), g = hexToOklch(th.bg.c1);
      const dAcc = ao.C < 0.05 ? 0 : Math.min(gap(ao.h, t.h), g.C >= 0.05 ? gap(ao.h, g.h) + 20 : 999);
      return dAcc + 0.3 * gGap(go, g) + (lightOf(th) === light ? 0 : 40); };
    const live = themes.filter(t => !t.err);
    const best = PIN[name] ? live.find(t => t.name === PIN[name]) : live.slice().sort((x, y) => score(x) - score(y))[0];
    (best.aka = best.aka || []).push(name);
  });
  return themes;
}, PAIRS, RETIRED);

await browser.close();
const bad = out.filter(t => t.err || !t.ok);
out.forEach(t => {
  if (t.err){ console.log(`  ${t.name.padEnd(16)} FAIL  ${t.err}`); return; }
  const r = t.rows, f = v => v.toFixed(2);
  console.log(`  ${t.name.padEnd(16)} ${t.look.padEnd(5)} ${t.bg.c1} ${t.bg.c2}  ink ${t.ink}  bright ${t.accent}  small ${t.support}` +
    `  text ${f(r.text)} bright ${f(r.bright)} cvd ${f(r.brightCvd)} vsText ${f(r.brightVsText)} small ${f(r.small)} number ${f(r.number)}` +
    (t.muddy.length ? '  MUDDY ' + t.muddy.join(',') : '') + (t.ok ? '' : '  FAIL') + (t.aka ? '  aka ' + t.aka.join(', ') : ''));
});
if (errors.length) console.log('page errors:', errors);
console.log(`\n${out.length - bad.length}/${out.length} pass`);

/* the literal for app.js */
const lit = out.filter(t => !t.err).map(t => {
  const aka = t.aka ? `, aka:[${t.aka.map(n => `'${n}'`).join(', ')}]` : '';
  return `  { name:'${t.name}',${' '.repeat(Math.max(1, 16 - t.name.length))}family:'${t.look}',  bg:{type:'grad', c1:'${t.bg.c1}', c2:'${t.bg.c2}', a:170}, accent:'${t.accent}', ink:'${t.ink}', support:'${t.support}'${aka} },`;
}).join('\n');
console.log('\n' + lit);
if (argv('--json')) writeFileSync(argv('--json'), JSON.stringify(out, null, 1));
/* --write puts the literal into app.js in place of the array's rows (the
   comment above the array stays; nothing else in the file is touched) */
if (process.argv.includes('--write') && !bad.length && !errors.length){
  const P = new URL('../app.js', import.meta.url).pathname;
  const a = app.indexOf('const COLOR_THEMES = [\n'), b = app.indexOf('\n];', a);
  if (a < 0 || b < 0) throw new Error('COLOR_THEMES not found in app.js');
  writeFileSync(P, app.slice(0, a) + 'const COLOR_THEMES = [\n' + lit + app.slice(b));
  console.log('wrote app.js: COLOR_THEMES, ' + out.length + ' themes');
}
process.exit(bad.length || errors.length ? 1 : 0);
