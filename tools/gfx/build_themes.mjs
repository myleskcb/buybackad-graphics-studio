#!/usr/bin/env node
/* TWENTY SHOWCASE THEMES, FIVE VARIATIONS EACH.
 *
 * A theme is a named combination: a layout, a family of palettes it is allowed
 * to wear, the wallpapers its screens may carry, and a type pairing. A variation
 * is the same theme on a different palette and seed — so the five read as one
 * idea seen five ways rather than five unrelated cards.
 *
 * Lighter across the board, as asked: every theme draws from the fifteen light
 * and five mid palettes; the thirteen dark ones sit this set out.
 *
 *   node tools/gfx/build_themes.mjs            render to .render/themes
 *   node tools/gfx/build_themes.mjs --cards    ads instead of bare backgrounds
 */
import * as E from '../../engine/engine.mjs';
import { drawShowcase, WALLS } from '../../engine/showcase.mjs';
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';

const ROOT = new URL('../../', import.meta.url).pathname;
const BASE = process.env.ASSET_BASE || 'http://localhost:8899/';
const CARDS = process.argv.includes('--cards');
const OUT = ROOT + '.render/themes/';
const SIZE = +(process.env.THEME_PX || 1080);

/* THE REFERENCE PALETTES, read off the showcases the owner sent.
   Each is a quiet ground plus a spectrum of five to eight saturated hues —
   which is how those images are built, and it is also the one colour axis the
   reference measurement put this engine below the whole graded corpus on
   (hue entropy: their good ads 1.46, this engine 0.92; three or more hue
   families carrying real area in 57% of good ads against 24% of engine cards).
   Ground and ink stay ours so the card still reads as the shop's; the spectrum
   is theirs. */
const REF = {
  spectrum: { name: 'Spectrum',   ground: '#0B0B0D', ink: '#F4F6F8',
    hues: ['#FF375F', '#FF9F0A', '#FFD60A', '#30D158', '#40C8E0', '#0A84FF', '#BF5AF2', '#FF2D92'] },
  blueprint:{ name: 'Blueprint',  ground: '#071528', ink: '#DCEBFF',
    hues: ['#0A84FF', '#40C8E0', '#5AC8FA', '#2E7BE0', '#8FD3FF', '#1B4FA0'] },
  ember:    { name: 'Ember',      ground: '#120A08', ink: '#FFF0E4',
    hues: ['#FF375F', '#FF6B2C', '#FF9F0A', '#FFD60A', '#C2410C', '#7A1F12'] },
  mint:     { name: 'Mint Room',  ground: '#A8DCD5', ink: '#123833',
    hues: ['#2FA37C', '#F2A03D', '#F4C83C', '#E0524A', '#5B4BC4', '#2E7BE0'] },
  sky:      { name: 'Sky Arcs',   ground: '#BCDCEA', ink: '#10303D',
    hues: ['#39B7E8', '#B84AC8', '#E8455E', '#F2842C', '#F4C83C', '#7FCF4A'] },
  poly:     { name: 'Poly Grey',  ground: '#E8E8EA', ink: '#1A1A1E',
    hues: ['#FF2D92', '#E01B2E', '#7B3FE4', '#B08CF5', '#39B7E8', '#2FBF4A', '#A8E85C'] },
  meadow:   { name: 'Meadow',     ground: '#CFE7F3', ink: '#123044',
    hues: ['#7FCF4A', '#3FA33C', '#39B7E8', '#2E7BE0', '#F4C83C', '#F2842C'] },
  dusk:     { name: 'Dusk',       ground: '#141026', ink: '#F0E8FF',
    hues: ['#FF6B2C', '#FF9F0A', '#E8455E', '#BF5AF2', '#5B4BC4', '#2E7BE0'] },
};

/* the engine still needs a palette record; ground and ink come from the
   reference, the rest is derived so every card stays internally legible */
function refPalette(k) {
  const r = REF[k];
  return { id: 'ref-' + k, name: r.name, mood: 'reference',
    ground: r.ground, ground2: r.hues[4] || r.hues[0], ink: r.ink, body: r.ink,
    accent: r.hues[0], hot: r.hues[1], paper: '#FFFFFF', dark: '#0A0A0C' };
}

const LAYOUT_SET = [
  ['iso',    'Wall',       ['mesh', 'bands', 'poly', 'arcs', 'diagonal']],
  ['family', 'Family',     ['mesh', 'hills', 'arcs', 'field']],
  ['wall',   'Assortment', ['poly', 'bands', 'mesh', 'arcs', 'hills', 'diagonal']],
  ['trio',   'Trio',       ['mesh', 'diagonal', 'arcs', 'bands']],
];
const PAL_SET = ['spectrum', 'blueprint', 'mint', 'sky', 'poly'];

/* five layouts of wallpapers x five reference palettes = twenty themes */
const THEMES = [];
for (const pk of PAL_SET)
  for (const [layout, label, walls] of LAYOUT_SET)
    THEMES.push([`${layout}-${pk}`, `${REF[pk].name} ${label}`, layout, pk, walls]);

/* BONUS — other ways to stand a set of devices up, not versions of the
   references. Five arrangements, four variations each. */
const BONUS = [
  ['stack',   'Stack',   ['mesh', 'bands', 'hills', 'arcs', 'field']],
  ['fan',     'Fan',     ['bands', 'diagonal', 'mesh', 'arcs']],
  ['cascade', 'Cascade', ['poly', 'mesh', 'diagonal', 'bands']],
  ['orbit',   'Orbit',   ['arcs', 'mesh', 'field', 'bands', 'poly']],
  ['column',  'Column',  ['schematic', 'bands', 'mesh', 'diagonal']],
];
const BONUS_PAL = ['spectrum', 'sky', 'mint', 'poly'];

/* a card object thin enough to drive drawShowcase without the whole engine */
function bareCard(pal, seed, px) {
  const R = E.RNG(seed);
  let uid = 0;
  const defs = [], svg = [];
  return {
    W: px, H: px, S: px, P: pal, R, F: { body: 'Satoshi', display: 'Satoshi', bw: .51, dw: .70, dweight: 700 },
    C: { brand: null }, cfg: {}, nodes: [], notes: [],
    id: p => p + (uid++) + 's' + seed, def: d => defs.push(d), add: m => svg.push(m),
    on: () => true, note: () => {},
    out: () => `<svg viewBox="0 0 ${px} ${px}" xmlns="http://www.w3.org/2000/svg">` +
      `<defs>${defs.join('')}</defs><rect width="${px}" height="${px}" fill="${pal.ground}"/>${svg.join('')}</svg>`,
  };
}

if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const jobs = [];
THEMES.forEach(([id, name, layout, pk, walls]) => {
  for (let v = 0; v < 5; v++) {
    const seed = (id.length * 7919 + v * 104729 + 13) % 999983;
    jobs.push({ id: `${id}-${v + 1}`, theme: id, name, layout, pk, walls, seed, v });
  }
});
BONUS.forEach(([layout, label, walls]) => {
  BONUS_PAL.forEach((pk, v) => {
    const seed = (layout.length * 6997 + v * 104729 + 77) % 999983;
    jobs.push({ id: `bonus-${layout}-${v + 1}`, theme: 'bonus-' + layout,
      name: `${label} · ${REF[pk].name}`, layout, pk, walls, seed, v });
  });
});

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new', args: ['--no-sandbox'], protocolTimeout: 0 });
const page = await browser.newPage();
await page.goto(BASE);
await page.setViewport({ width: SIZE, height: SIZE, deviceScaleFactor: 1 });

const manifest = [];
for (const j of jobs) {
  let svg, meta = {};
  if (CARDS) {
    const r = E.render(['nightLot', 'bandStack', 'proofWall', 'posterBleed', 'priceBoard'][j.v], j.seed, 'phones', '11',
      { ...E.DEFAULT_CFG(), allowPlaceholder: true, showcase: true, showcaseLayout: j.layout,
        palette: j.pal, embedFonts: false, assetBase: BASE });
    svg = r.svg; meta = { rules: `${r.audit.pass}/${r.audit.total}`, cov: +(r.audit.coverage).toFixed(3), pair: r.pair.id };
  } else {
    const r = REF[j.pk];
    const pal = refPalette(j.pk);
    const c = bareCard(pal, j.seed, SIZE);
    /* the variation rotates the spectrum, so the five read as one idea seen
       five ways rather than the same wall five times */
    const sp = r.hues.slice(j.v).concat(r.hues.slice(0, j.v));
    drawShowcase(c, { x: 0, y: 0, w: SIZE, h: SIZE },
      { layout: j.layout, brand: null, fade: 1, spectrum: sp,
        only: j.walls.filter(k => WALLS[k]) });
    svg = c.out();
    meta = { palette: pal.id, ground: r.ground };
  }
  await page.setContent(`<style>html,body{margin:0}svg{display:block;width:100vw;height:auto}</style>${svg}`);
  await page.evaluate(async () => { await document.fonts.ready;
    await Promise.all([...document.images].map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 1200); }))); });
  const el = await page.$('svg');
  await el.screenshot({ path: OUT + j.id + '.webp', type: 'webp', quality: 88 });
  const r = REF[j.pk];
  manifest.push({ id: j.id, theme: j.theme, name: `${j.name} ${j.v + 1}`, family: REF[j.pk].name,
    layout: j.layout, cat: 'showcase', palette: j.pk, seed: j.seed,
    c1: r.ground, ink: r.ink, accent: r.hues[j.v % r.hues.length], support: r.hues[(j.v + 2) % r.hues.length], ...meta });
}
await browser.close();
writeFileSync(OUT + 'manifest.json', JSON.stringify(manifest, null, 1));
console.log(`${manifest.length} rendered to .render/themes  (${THEMES.length} themes x 5)`);
