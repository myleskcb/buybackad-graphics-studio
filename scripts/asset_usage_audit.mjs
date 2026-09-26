#!/usr/bin/env node
/* ASSET USAGE AUDIT: is every photo we ship actually in the product?
 *
 * The library shipped 26 product photos and two of them, the iPad
 * (tablet-watch) and the back of an iPhone (iphone-back), appeared on no
 * template at all: the picker was hash(id) % n and nothing ever checked
 * coverage. A photo no template shows is dead weight in the deploy, and here
 * it was also a promise the ads did not keep, because the Phones copy sells
 * "iPhone • iPad • MacBook" over art that showed iPhones only.
 *
 * Measured on the live TEMPLATES after every pass has run, because the passes
 * decide what ships (rule 42: never trust the source to say what renders).
 *
 * Fails, exit 1, when:
 *   - a file in assets/cutouts, assets/bg or assets/tplbg is used by no template
 *   - a template names a photo that did not load
 *   - the Phones category shows no iPhone, no iPad or no Mac product photo
 *   - a product's subject renders smaller than MIN_PRODUCT px on its long side
 *     (the coin was a 67px speck on four templates before the photo standard)
 *   - a photo cut at the source (its subject runs off its frame) is missing
 *     from CUTOUT_BLEED in app.js, or is placed with that cut anywhere except
 *     on the edge of the board, where it reads as a bleed and not a slice
 *   - an asset request goes out without ?v=ASSET_REV, or an index.html image
 *     preload carries a different revision (it would download twice)
 *
 * Companion to scripts/standardize_photos.py, which holds each FILE to the
 * photo standard. This one holds the PRODUCT to using them.
 *
 * usage: node scripts/asset_usage_audit.mjs [--json out.json]
 *        CHROME=/path/to/chrome GFX_BASE=http://localhost:8899/ node scripts/asset_usage_audit.mjs
 */
import puppeteer from 'puppeteer-core';
import { readdirSync, writeFileSync } from 'node:fs';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';
const ROOT = new URL('../', import.meta.url).pathname;
const argv = process.argv.slice(2);
const jsonOut = argv.includes('--json') ? argv[argv.indexOf('--json') + 1] : null;

const MIN_PRODUCT = 150;          // px, subject long side on the 1080 board
const DIRS = { cutouts: '.png', bg: '.jpg', tplbg: '.jpg' };
// Which photos show which Apple device. The Phones copy names all three.
const DEVICES = { iPhone: /(^|\/)iphones?-/, iPad: /(^|\/)(tablet|ipad)-/, Mac: /(^|\/)macbook-/ };

const onDisk = [];
for (const [dir, ext] of Object.entries(DIRS)) {
  let names = [];
  try { names = readdirSync(ROOT + 'assets/' + dir); } catch (e) {}
  names.filter(f => f.toLowerCase().endsWith(ext)).forEach(f => onDisk.push('assets/' + dir + '/' + f));
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900 });
const pageErrors = [], requested = new Set();
page.on('pageerror', e => pageErrors.push(String(e)));
page.on('request', r => { const u = r.url(); if (/\/assets\/(bg|cutouts|tplbg)\//.test(u)) requested.add(u.replace(BASE, '')); });
await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 90000 });
// the backdrop loader trickles its second wave in idle-time chunks: wait until
// both caches stop growing rather than for a fixed time
for (let i = 0, prev = -1; i < 120; i++) {
  const n = await page.evaluate(() => Object.keys(TPL_BG_ELS).length + Object.keys(CUTOUT_ELS).length);
  if (n === prev && i > 5) break;
  prev = n; await new Promise(r => setTimeout(r, 1000));
}

const r = await page.evaluate((MIN_PRODUCT) => {
  const out = { used: {}, notLoaded: [], products: [], bleedDetected: {}, declaredBleed: {}, rev: null, preloads: [] };
  const use = (src, id) => { (out.used[src] = out.used[src] || []).push(id); };
  // subject box and cut edges of each product photo, from its real alpha
  const alphaInfo = {};
  const info = src => {
    if (alphaInfo[src]) return alphaInfo[src];
    const el = CUTOUT_ELS[src];
    const c = document.createElement('canvas'); c.width = el.naturalWidth; c.height = el.naturalHeight;
    const x = c.getContext('2d'); x.drawImage(el, 0, 0);
    const a = x.getImageData(0, 0, c.width, c.height).data, W = c.width, H = c.height;
    let x0 = W, y0 = H, x1 = -1, y1 = -1; const edge = { left: 0, right: 0, top: 0, bottom: 0 };
    for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
      if (a[(y * W + xx) * 4 + 3] <= 8) continue;
      if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (xx === 0) edge.left++; if (xx === W - 1) edge.right++; if (y === 0) edge.top++; if (y === H - 1) edge.bottom++;
    }
    const bleed = Object.keys(edge).filter(k => edge[k] >= 0.05 * ((k === 'left' || k === 'right') ? H : W));
    return (alphaInfo[src] = { W, H, box: [x0, y0, x1 + 1, y1 + 1], bleed });
  };
  TEMPLATES.forEach(t => {
    if (t.bg && t.bg.type === 'image' && t.bg.src) {
      use(t.bg.src, t.id);
      if (!TPL_BG_ELS[t.bg.src]) out.notLoaded.push(t.bg.src);
    }
    (t.layers || []).filter(l => l.kind === 'cutout' && l.props && l.props.src).forEach(l => {
      const src = l.props.src;
      use(src, t.id);
      if (!CUTOUT_ELS[src]) { out.notLoaded.push(src); return; }
      const inf = info(src);
      const o = buildLayer(l, t.id);
      const m = o.calcTransformMatrix();
      // subject box corners, image space -> board space
      const pt = (px, py) => fabric.util.transformPoint(new fabric.Point(px - inf.W / 2, py - inf.H / 2), m);
      const [bx0, by0, bx1, by1] = inf.box;
      const corners = [pt(bx0, by0), pt(bx1, by0), pt(bx0, by1), pt(bx1, by1)];
      const xs = corners.map(p => p.x), ys = corners.map(p => p.y);
      const long = Math.max(bx1 - bx0, by1 - by0) * (o.scaleX || 1);
      const place = {};
      inf.bleed.forEach(side => {
        const v = side === 'left' ? Math.min(...xs) : side === 'right' ? TPL_W - Math.max(...xs)
                : side === 'top' ? Math.min(...ys) : TPL_H - Math.max(...ys);
        place[side] = Math.round(v);           // distance of the cut from the board edge
      });
      out.products.push({ id: t.id, cat: t.cat, src, long: Math.round(long), bleed: inf.bleed, cutFromEdge: place });
    });
  });
  Object.keys(CUTOUT_ELS).forEach(src => { const i = info(src); if (i.bleed.length) out.bleedDetected[src] = i.bleed; });
  try { out.declaredBleed = Object.assign({}, CUTOUT_BLEED); } catch (e) { out.declaredBleed = null; }
  try { out.rev = ASSET_REV; } catch (e) {}
  out.preloads = [...document.querySelectorAll('link[rel=preload][as=image]')].map(l => l.getAttribute('href'));
  out.notLoaded = [...new Set(out.notLoaded)];
  return out;
}, MIN_PRODUCT);
await browser.close();

// ── judge ──────────────────────────────────────────────────────────────────
const fail = [], note = [];
const used = new Set(Object.keys(r.used));
const unused = onDisk.filter(f => !used.has(f));
unused.forEach(f => fail.push(`UNUSED     ${f} is shipped but no template shows it`));
r.notLoaded.forEach(f => fail.push(`NOT LOADED ${f} is named by a template but did not load`));

const phones = new Set(r.products.filter(p => p.cat === 'phones').map(p => p.src));
for (const [device, re] of Object.entries(DEVICES)) {
  const hits = [...phones].filter(s => re.test(s));
  if (!hits.length) fail.push(`DEVICE     Phones shows no ${device} photo on any template`);
  else note.push(`${device.padEnd(6)} ${hits.map(s => s.split('/').pop()).join(', ')}`);
}

r.products.filter(p => p.long < MIN_PRODUCT)
  .forEach(p => fail.push(`TOO SMALL  ${p.id}: ${p.src.split('/').pop()} renders ${p.long}px long, minimum ${MIN_PRODUCT}`));

if (r.declaredBleed === null) fail.push('BLEED      CUTOUT_BLEED is not defined in app.js');
for (const [src, sides] of Object.entries(r.bleedDetected)) {
  const name = src.split('/').pop().replace(/\.png$/, '');
  const decl = r.declaredBleed && r.declaredBleed[name];
  if (!decl || !sides.includes(decl)) fail.push(`BLEED      ${name} runs off its frame (${sides.join('+')}) but CUTOUT_BLEED says ${decl || 'nothing'}`);
}
r.products.filter(p => p.bleed.length).forEach(p => {
  Object.entries(p.cutFromEdge).forEach(([side, d]) => {
    if (d > 1) fail.push(`BLEED      ${p.id}: ${p.src.split('/').pop()} is cut on its ${side} but sits ${d}px in from the board edge`);
  });
});

if (!r.rev) fail.push('REVISION   ASSET_REV is not defined in app.js');
if (r.rev) [...requested].filter(u => !u.includes('?v=' + r.rev))
  .forEach(u => fail.push(`REVISION   ${u} requested without ?v=${r.rev} (30-day cache: returning visitors keep the old file)`));
if (r.rev) r.preloads.filter(h => /^assets\//.test(h) && !h.endsWith('?v=' + r.rev))
  .forEach(h => fail.push(`PRELOAD    index.html preloads ${h}, the app asks for ?v=${r.rev}: it downloads twice`));
pageErrors.forEach(e => fail.push('PAGE ERROR ' + e));

const count = src => (r.used[src] || []).length;
const cutouts = onDisk.filter(f => f.startsWith('assets/cutouts/'));
console.log(`Asset usage audit\n`);
console.log(`  shipped photos     ${onDisk.length}  (cutouts ${cutouts.length}, backdrops ${onDisk.length - cutouts.length})`);
console.log(`  used by a template ${onDisk.length - unused.length}`);
console.log(`  products placed    ${r.products.length}, smallest ${Math.min(...r.products.map(p => p.long))}px long (minimum ${MIN_PRODUCT})`);
console.log(`  product photo uses ${cutouts.map(f => f.split('/').pop().replace('.png', '') + ' ' + count(f)).join(' · ')}`);
console.log(`  Phones shows       ${note.join('\n                     ')}`);
console.log(`  asset revision     ${r.rev} on ${requested.size} requests`);
console.log(fail.length ? `\n  FAILED ${fail.length}\n    ` + fail.join('\n    ') : '\n  OK: every shipped photo is in the product');
if (jsonOut) writeFileSync(jsonOut, JSON.stringify({ ...r, onDisk, unused, fail }, null, 1));
process.exit(fail.length ? 1 : 0);
