#!/usr/bin/env node
/* RESTAGE THE GLASS CARD — the product on the card, money behind it.
 *
 * Owner, 2026-09-27, on "Cherry & Aqua · Glass Card": "the asset should be on
 * the inner card while a tile PNG of money or money falling, overlay in BG."
 * The layout put a product photograph BEHIND a near-opaque panel: the panel
 * hid the thing being bought, and what showed round its edges read as clutter.
 * The composition is turned inside out (DESIGN-LAW rule 59):
 *
 *   ground   the money-fall photograph (scripts/build_money_grounds.py), dark
 *            or paper to match the card's ink, under the engine's neutral shade
 *   card     taller (188..800), solid enough (>= 0.88) that no bill patterns
 *            behind a letter
 *   on it    kicker ribbon above; headline stacked and centred, sized under
 *            the phone number's rank (H1 72, H2 <= 120; rule 53); the
 *            product cut-out in the card's middle band; the selling points
 *            along the card's foot
 *
 * The product is the record's own cut-out when it had one and it is still
 * approved, else the category's first choice by a stable hash of the id.
 *
 * usage: node scripts/restage_glasscards.mjs [--ids a,b] [--out dir] [--write]
 *   --out writes the restaged records to dir (prototype); --write rewrites
 *   assets/showcase/tpl/<id>.json in place. Thumbnails are re-rendered after.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname;
const argv = process.argv.slice(2);
const arg = k => { const i = argv.indexOf(k); return i < 0 ? null : argv[i + 1]; };
const idx = JSON.parse(readFileSync(ROOT + 'assets/showcase/index.json', 'utf8'));
const lib = Object.fromEntries(JSON.parse(readFileSync(ROOT + 'assets/library.json', 'utf8')).assets.map(a => [a.slug, a]));
const approved = new Set(JSON.parse(readFileSync(ROOT + 'assets/approved-assets.json', 'utf8'))['asset-grid-v1'].approved);

const PRODUCTS = {
  gold:    ['gold-chains', 'gold-jewelry-mixed', 'gold-bracelet-cuban', 'gold-bars-fan'],
  silver:  ['silver-bars-stack', 'silver-rounds-pile', 'silver-flatware-set', 'silver-coins-spill'],
  coins:   ['coin-collection-tray', 'coin-graded-fan-three', 'coin-stack-silver', 'coin-slabs-stack'],
  cars:    ['car-sedan-front', 'car-suv-side', 'car-truck-front', 'car-keys-fob'],
  phones:  ['qs-set-iphone-hero-trio', 'qs-set-iphone-colour-fan', 'qs-set-apple-hero-bundle', 'qs-set-iphone-promax-fan'],
  strips:  ['strip-boxes-fan'],          // strip-boxes reads as blank white cartons at card size
  sports:  ['sports-slabs-stack', 'sports-slab'],
  pokemon: ['poke-slabs-trio'],
};
const DEVICE = [[/MACBOOK|\bMAC\b/, ['qs-set-macbook-pair']], [/IPAD/, ['qs-set-ipad-fan']], [/WATCH/, ['qs-sheet-watch-ultra3-2025']],
  [/IPHONE/, ['qs-set-iphone-hero-trio', 'qs-set-iphone-colour-fan', 'qs-set-iphone-promax-fan']]];
const hash = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const rgba = s => { const m = String(s || '').match(/rgba?\(([^)]+)\)/); if (m){ const p = m[1].split(',').map(Number); return { r:p[0], g:p[1], b:p[2], a:p.length > 3 ? p[3] : 1 }; }
  const h = String(s || '').match(/^#([0-9a-f]{6})$/i); if (h){ const n = parseInt(h[1], 16); return { r:n >> 16, g:(n >> 8) & 255, b:n & 255, a:1 }; } return null; };
const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };

const CX = 540, CARD = { left: 110, top: 188, width: 860, height: 612 };
const PROD = { width: 640 };

function restage(rec, id, cat){
  const tp = rec.tpl, L = tp.layers;
  const by = n => L.find(l => l.name === n);
  const panel = by('Glass Panel'), h1 = by('Headline 1'), h2 = by('Headline 2'), items = by('Items');
  if (!panel || !h2) return null;
  const heroIdx = L.findIndex(l => l.kind === 'cutout');
  const hero = heroIdx >= 0 ? L[heroIdx] : null;
  const words = L.filter(l => typeof l.text === 'string').map(l => l.text.toUpperCase()).join(' ');

  // 1. the product: the record's own if still approved, else the category's
  let slug = hero && hero.props && hero.props.src ? hero.props.src.replace(/^.*\//, '').replace(/\.webp$/, '') : null;
  if (!slug || !approved.has(slug)){
    const dev = cat === 'phones' && DEVICE.find(([re]) => re.test(words));
    const pool = (PRODUCTS[cat] || []).filter(s => approved.has(s) && lib[s]);
    slug = dev ? dev[1][hash(id) % dev[1].length] : pool.length ? pool[hash(id) % pool.length] : null;
  }
  if (!slug || !lib[slug]) return null;
  const a = lib[slug], ar = a.w / a.h;

  // 2. the ground: money, dark or paper to match the ink on the card
  const ink = rgba(h2.props && h2.props.fill) || { r:255, g:255, b:255 };
  const dark = lum(ink) > 0.4;
  tp.bg = { type:'image', src:'assets/grounds/money-fall-' + (dark ? 'dark' : 'paper') + '.webp',
            scrim: dark ? 0.5 : 0.42, scrimColor: dark ? '#0b0b0d' : '#f4f1ea', scrimMode:'normal', blur: 0,
            grade:{ treat:'natural' }, fallback: tp.bg && tp.bg.fallback };

  // 3. the card: taller, and solid enough that no bill patterns behind a letter
  /* a see-through panel's colour is not what anyone saw (they saw the
     photograph through it), so it takes the neutral that carries its ink */
  const f = rgba(panel.props.fill) || { r:18, g:18, b:20, a:0.9 };
  const fill = f.a >= 0.5 ? 'rgba(' + f.r + ',' + f.g + ',' + f.b + ',' + Math.max(0.88, f.a) + ')'
             : dark ? 'rgba(16,16,19,0.86)' : 'rgba(250,248,244,0.9)';
  panel.props = Object.assign({}, panel.props, CARD, { originX:'left', originY:'top', fill });

  /* 4. copy stacked and centred on the card, under the number's rank: the
     headline lines from the top, the selling points (and the city line some
     records carry as Panel Foot) up from the foot; the product takes the
     band between. A third headline line had sat in that band and the product
     was, correctly, removed by the engine for touching it. */
  const LH = 1.13, h3 = by('Headline 3'), foot = by('Panel Foot');
  const centre = (l, top, fs) => { l.props = Object.assign({}, l.props, { left: CX, top: Math.round(top), originX:'center', originY:'top', textAlign:'center' });
    l.props.fontSize = Math.min(l.props.fontSize || fs, fs); return l.props.top + l.props.fontSize * LH; };
  let y = 214;
  [[h1, 72], [h2, 120], [h3, 56]].forEach(([l, fs]) => { if (l) y = centre(l, y, fs) + 4; });
  let yb = CARD.top + CARD.height - 30;
  [[items, 30], [foot, 22]].forEach(([l, fs]) => { if (!l) return; const f = Math.min(l.props.fontSize || fs, fs); yb -= f * LH; centre(l, yb, fs); yb -= 8; });
  const band = { top: y + 14, height: yb - 12 - (y + 14) };
  let w = PROD.width, h = w / ar; if (h > band.height){ h = band.height; w = h * ar; }
  if (band.height < 150) return null;

  // 5. the product on the card, in the band, with a contact shadow
  const layer = { kind:'cutout', name:'Hero Product', role:'photo', props:{
    src:'assets/cutouts/' + slug + '.webp', left: Math.round(CX - w / 2), top: Math.round(band.top + (band.height - h) / 2), w: Math.round(w),
    shadow:{ color:'rgba(0,0,0,0.45)', blur:30, offsetX:0, offsetY:12 } } };
  if (heroIdx >= 0) L.splice(heroIdx, 1);
  L.splice(L.indexOf(panel) + 1, 0, layer);
  return rec;
}

const want = arg('--ids') ? new Set(arg('--ids').split(',')) : null;
const out = arg('--out'), WRITE = argv.includes('--write');
if (out) mkdirSync(out, { recursive: true });
let n = 0, skip = [];
idx.filter(c => c.layout === 'glassCard' && (!want || want.has(c.id))).forEach(c => {
  const p = ROOT + 'assets/showcase/tpl/' + c.id + '.json';
  const rec = JSON.parse(readFileSync(p, 'utf8'));
  if (!rec.tpl || !rec.tpl.layers){ skip.push(c.id + ' (no layers)'); return; }
  const r = restage(rec, c.id, c.cat);
  if (!r){ skip.push(c.id); return; }
  n++;
  if (out) writeFileSync(out + '/' + c.id + '.json', JSON.stringify(r));
  if (WRITE) writeFileSync(p, JSON.stringify(r));
});
console.log('restaged ' + n + (skip.length ? ' · skipped ' + skip.join(', ') : '') + (WRITE ? ' · written' : out ? ' · to ' + out : ' · dry run'));
