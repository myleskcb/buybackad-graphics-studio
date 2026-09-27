#!/usr/bin/env node
/* DEVICE VARIANTS — one perfected theme, re-set for any device the shop buys.
 *
 * Owner, 2026-09-27: "once a theme is perfect we can make unlimited
 * variations for all types of devices specifically." A variant changes only
 * what names the device; the theme (layout, palette, faces, ground) is the
 * card's own, and the engine's fitting (alignPass: words on their plate,
 * inside the guides, the product clear of the copy) keeps a longer name or a
 * wider device from breaking it.
 *
 *   headline   the device family from assets/devices.json (IPAD AIR, IMAC)
 *   items      the models in that family, named as the storefront names them
 *   product    that device's cut-out, in the finish whose measured colour is
 *              nearest the card's accent (a neutral palette gets a neutral
 *              finish), fitted into the product's own box
 *
 * Variants are generated, not stored: the curated library stays one card per
 * design (DESIGN-LAW rule 60), and a variant exists when someone asks for it.
 *
 * usage: node scripts/device_variants.mjs --base <card id> [--models a,b,c] --out <dir>
 *   writes <dir>/<base>--<model>.json records (render them with the showcase harness)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname;
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const DEV = JSON.parse(readFileSync(ROOT + 'assets/devices.json', 'utf8')).models;
const LIB = Object.fromEntries(JSON.parse(readFileSync(ROOT + 'assets/library.json', 'utf8')).assets.map(a => [a.slug, a]));
const IDX = Object.fromEntries(JSON.parse(readFileSync(ROOT + 'assets/showcase/index.json', 'utf8')).map(c => [c.id, c]));

const LINE = {
  'IPAD AIR': 'iPad Air M2 • M3 • M4 • 11 & 13-inch', 'IPAD PRO': 'iPad Pro M4 • M5 • 11 & 13-inch',
  'IPAD MINI': 'iPad mini 6 • mini (A17 Pro)', 'IPAD': 'iPad 10th gen • iPad (A16)',
  'MACBOOK AIR': 'M1 to M5 • 13 & 15-inch • Every colour', 'MACBOOK PRO': 'M1 to M5 • 14 & 16-inch',
  'MACBOOK NEO': 'MacBook Neo • Every colour', 'IMAC': 'iMac 24-inch • M1 • M3 • M4 • Every colour',
  'APPLE WATCH': 'Series 11 • 10 • 9 • SE', 'WATCH ULTRA': 'Ultra • Ultra 2 • Ultra 3',
  'AIRPODS': 'AirPods • AirPods Pro • AirPods Max', 'AIRPODS PRO': 'AirPods Pro 2 • Pro 3', 'AIRPODS MAX': 'AirPods Max • AirPods Pro',
};
const itemsFor = fam => LINE[fam] || (() => {
  // an iPhone family names its own models: IPHONE 17 PRO -> iPhone 17 Pro • 17 Pro Max
  const names = Object.values(DEV).filter(m => m.family === fam).map(m => m.name).sort();
  return names.length ? names.map((n, i) => i ? n.replace(/^iPhone /, '') : n).join(' • ') : fam;
})();

const hex2rgb = h => { const n = parseInt(String(h).slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const hsv = ([r, g, b]) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0; if (d){ h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
  return { h, s: mx ? d / mx : 0, v: mx }; };
function finishFor(model, accent){
  const fins = Object.entries(model.colours || {}).filter(([, f]) => f.hex && LIB[f.slug]);
  if (!fins.length) return model.art;
  const a = hsv(hex2rgb(accent || '#888888'));
  const score = ([, f]) => { const c = hsv(hex2rgb(f.hex));
    if (a.s < 0.18) return c.s;                                   // a neutral palette takes the most neutral finish
    const dh = Math.min(Math.abs(c.h - a.h), 360 - Math.abs(c.h - a.h)) / 180;
    return dh + 0.6 * Math.abs(c.s - a.s) + (c.s < 0.12 ? 0.5 : 0); };
  return fins.sort((x, y) => score(x) - score(y))[0][1].slug;
}

export function variant(rec, card, key){
  const m = DEV[key]; if (!m) throw new Error('no device ' + key);
  const r = JSON.parse(JSON.stringify(rec)); const L = r.tpl.layers;
  const by = n => L.find(l => l.name === n);
  const h1 = by('Headline 1'), h2 = by('Headline 2'), items = by('Items'), prod = L.find(l => l.kind === 'cutout' && !l.__wall);
  if (!h2 || !prod) throw new Error('base card has no headline or product to re-set');
  if (h1 && !/^(WE BUY|SELL YOUR|CASH IN YOUR|CASH FOR)$/i.test(String(h1.text).trim())) h1.text = 'WE BUY';
  h2.text = m.family;
  if (items) items.text = itemsFor(m.family);
  const slug = finishFor(m, card && (card.accent || card.c1));
  const old = LIB[String(prod.props.src).replace(/^.*\//, '').replace(/\.webp$/, '')], neu = LIB[slug];
  if (!neu) throw new Error('no art for ' + key);
  // fit the new device into the old product's box, about its centre
  const ow = prod.props.w, oh = old ? ow * old.h / old.w : ow, cx = prod.props.left + ow / 2, cy = prod.props.top + oh / 2;
  const ar = neu.w / neu.h; let w = ow, h = w / ar; if (h > oh){ h = oh; w = h * ar; }
  prod.props = Object.assign({}, prod.props, { src: 'assets/cutouts/' + slug + '.webp', w: Math.round(w), left: Math.round(cx - w / 2), top: Math.round(cy - h / 2) });
  r.id = rec.id + '--' + key; r.device = key;
  return r;
}

if (process.argv[1] && process.argv[1].endsWith('device_variants.mjs')){
  const base = arg('--base'), out = arg('--out');
  if (!base || !out){ console.error('usage: --base <card id> --out <dir> [--models a,b]'); process.exit(2); }
  const rec = JSON.parse(readFileSync(ROOT + 'assets/showcase/tpl/' + base + '.json', 'utf8'));
  const models = (arg('--models') || '').split(',').filter(Boolean);
  const keys = models.length ? models : [...new Set(Object.values(DEV).map(m => m.family))]
    .map(f => Object.entries(DEV).filter(([, m]) => m.family === f).sort((a, b) => Object.keys(b[1].colours).length - Object.keys(a[1].colours).length)[0][0]);
  mkdirSync(out, { recursive: true });
  keys.forEach(k => { const v = variant(rec, IDX[base], k); writeFileSync(out + '/' + v.id + '.json', JSON.stringify(v)); });
  console.log('wrote ' + keys.length + ' variants of ' + base + ' to ' + out + ': ' + keys.join(', '));
}
