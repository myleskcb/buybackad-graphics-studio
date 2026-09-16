#!/usr/bin/env node
/* LOOK AT ONE CARD, LAYER BY LAYER.
   The owner: "make a unique identifier per so you can look at each layer and
   asset one by one … screenshots are hard to find the exact image again".
   Every card in the lab carries the id <archetype>-<vertical>-<format>-<seed>,
   printed under it on the review page. Give that id to this and it prints the
   whole card: every layer in the order it is painted, with its own id, role,
   depth, box and the asset it came from, then every overlap between layers,
   worst first — and writes a PNG so the picture and the table match.

     node tools/gfx/card.mjs sunburstHero-phones-45-209471
     node tools/gfx/card.mjs <id> --template     (placeholder brand)
*/
import * as E from '../../engine/engine.mjs';
import puppeteer from 'puppeteer-core';
import { readFileSync, mkdirSync } from 'node:fs';

const ID = process.argv[2];
if (!ID) { console.error('usage: node tools/gfx/card.mjs <archetype>-<vertical>-<format>-<seed>'); process.exit(2); }
const TEMPLATE = process.argv.includes('--template');
const m = ID.replace(/^now-/, '').match(/^([A-Za-z]+)-([a-z]+)-(45|11|916)-(\d+)$/);
if (!m) { console.error('id must look like  sunburstHero-phones-45-209471'); process.exit(2); }
const [, arch, vert, fmt, seedS] = m, seed = +seedS;

const BASE = process.env.ASSET_BASE || 'http://localhost:8899/';
const BRAND = JSON.parse(readFileSync(new URL('../../spec/brand.json', import.meta.url), 'utf8'));
const cfg = { ...E.DEFAULT_CFG(), embedFonts: false, assetBase: BASE,
              ...(TEMPLATE ? { allowPlaceholder: true } : { brand: BRAND }) };
const r = E.renderClean(arch, seed, vert, fmt, cfg);
if (!r) { console.error(ID + ' — renderClean REFUSED this card'); process.exit(1); }

const { W, H } = r.card, N = r.card.nodes;
console.log(`\n${ID}   ${W}x${H}   palette ${r.palette.id} "${r.palette.name}"   type ${r.pair.display} + ${r.pair.body}`);
console.log(`rules ${r.audit.pass}/${r.audit.total}   coverage ${r.audit.coverage.toFixed(3)}   ` +
            `seed used ${r.gate.seed}${r.gate.boosted ? '  hero boosted ×' + r.gate.boosted : ''}` +
            `${r.gate.dropped.length ? '  dropped ' + r.gate.dropped.join(',') : ''}`);
const fails = r.audit.rules.filter(x => !x[1]).map(x => x[0]);
console.log(`failing rules: ${fails.length ? fails.join(', ') : 'none'}`);
if (r.card.notes?.length) console.log('notes: ' + r.card.notes.join(' · '));

console.log('\nLAYERS — in the order they are painted (last line is on top)');
console.log('  #  id                 role       depth   x     y     w     h    asset / text');
N.forEach((n, i) => {
  const b = n.box || { x: 0, y: 0, w: 0, h: 0 };
  const what = n.str !== undefined ? JSON.stringify(String(n.str).slice(0, 30)) : (n.asset || '');
  console.log('  ' + String(i).padStart(2) + '  ' + String(n.id).padEnd(18) + ' ' +
    String(n.role || '').padEnd(10) + ' ' + String(n.type === 'text' ? 'text' : 'shape').padEnd(6) +
    [b.x, b.y, b.w, b.h].map(v => String(Math.round(v)).padStart(5)).join(' ') + '  ' + what);
});

const inter = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) *
                        Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
const rows = [];
for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) {
  const a = N[i], b = N[j];
  if (!a.box || !b.box || a.role === 'field' || b.role === 'field') continue;
  const ov = inter(a.box, b.box); if (ov <= 0) continue;
  const small = Math.min(a.box.w * a.box.h, b.box.w * b.box.h); if (small <= 0) continue;
  const pc = ov / small; if (pc < 0.05) continue;
  rows.push([pc, `${b.id} [${b.role}] over ${a.id} [${a.role}]  — ${Math.round(pc * 100)}% of the smaller`]);
}
rows.sort((x, y) => y[0] - x[0]);
console.log(`\nOVERLAPS — what is painted on what (${rows.length} over 5%)`);
if (!rows.length) console.log('  none');
rows.slice(0, 24).forEach(x => console.log('  ' + x[1]));

mkdirSync('.shot', { recursive: true });
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new', args: ['--no-sandbox'], protocolTimeout: 0 });
const page = await b.newPage(); await page.setViewport({ width: 900, height: 1200 });
await page.goto(BASE);
await page.setContent(`<style>html,body{margin:0;background:#111}svg{display:block;width:760px;height:auto}</style>
  <style>${E.fontCSS().replace(/\.\.\/assets/g, BASE + 'assets')}</style>${r.svg}`);
await page.evaluate(async () => { await document.fonts.ready;
  await Promise.all([...document.images].map(i => i.complete ? null : new Promise(res => { i.onload = i.onerror = res; setTimeout(res, 1500); }))); });
const el = await page.$('svg');
await el.screenshot({ path: `.shot/card-${ID}.png` });
await b.close();
console.log(`\npicture: .shot/card-${ID}.png`);
