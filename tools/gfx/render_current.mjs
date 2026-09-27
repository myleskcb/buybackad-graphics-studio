#!/usr/bin/env node
/* EVERY CARD TODAY'S ENGINE ACTUALLY SHIPS, as gradeable pictures.
   The other sets in the review page were rendered by older builds. This one is
   the engine as it stands after the gate reached 1152/1152 — rendered through
   renderClean() with the owner's real brand block, which is exactly what an
   export would produce. Written as ordinary webp files plus a manifest in the
   shape the review builder reads.
     node tools/gfx/render_current.mjs [seeds=3]  */
import * as E from '../../engine/engine.mjs';
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';

const SEEDS = +(process.argv[2] || 3);
const BASE = process.env.ASSET_BASE || 'http://localhost:8899/';
const OUT = new URL('../../.render/current/', import.meta.url).pathname;
const BRAND = JSON.parse(readFileSync(new URL('../../spec/brand.json', import.meta.url), 'utf8'));
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new', args: ['--no-sandbox'], protocolTimeout: 0 });
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 1200, deviceScaleFactor: 1 });
await page.goto(BASE);

const VERT = { phones: 'Working phones', broken: 'Broken phones', cars: 'Cars' };
const FMT = { '45': '4:5', '11': '1:1', '916': '9:16' };
const man = [];
let n = 0, refused = 0;
for (const [arch, label] of E.ARCHS)
  for (const vert of Object.keys(VERT))
    for (const fmt of Object.keys(FMT))
      for (let s = 0; s < SEEDS; s++) {
        const seed = (s * 104729 + 13) % 999983;
        const r = E.renderClean(arch, seed, vert, fmt,
          { ...E.DEFAULT_CFG(), embedFonts: false, assetBase: BASE, brand: BRAND });
        if (!r) { refused++; continue; }
        const id = `${arch}-${vert}-${fmt}-${seed}`;
        await page.setContent(
          `<style>html,body{margin:0;background:#000}svg{display:block;width:760px;height:auto}</style>` +
          `<style>${E.fontCSS().replace(/\.\.\/assets/g, BASE + 'assets')}</style>${r.svg}`);
        await page.evaluate(async () => { await document.fonts.ready;
          await Promise.all([...document.images].map(i => i.complete ? null
            : new Promise(res => { i.onload = i.onerror = res; setTimeout(res, 1500); }))); });
        const el = await page.$('svg');
        await el.screenshot({ path: OUT + id + '.webp', type: 'webp', quality: 86 });
        man.push({ id, name: `${label} · ${VERT[vert]}`, layout: arch, family: VERT[vert],
                   palette: r.palette.id, cat: vert, seed,
                   c1: r.palette.ground, ink: r.palette.ink,
                   accent: r.palette.accent, support: r.palette.hot,
                   fmt: FMT[fmt], rules: `${r.audit.pass}/${r.audit.total}` });
        if (++n % 24 === 0) console.log(`  ${n} rendered…`);
      }
writeFileSync(OUT + 'manifest.json', JSON.stringify(man, null, 1));
await browser.close();
console.log(`.render/current  ${man.length} cards${refused ? ' · ' + refused + ' REFUSED' : ' · none refused'}`);
