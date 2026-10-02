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
/* whole lines: the category in the headline, several models side by side
   (owner: "sell your macbook air pro neo … with multiple"); = SC_DEV_GROUPS in app.js */
export const GROUPS = {
  'group-iphone':  { family:'IPHONE',      label:'All iPhones',       models:['iphone-18-pro-max', 'iphone-18-pro', 'iphone-17-pro', 'iphone-16'], line:'iPhone 18 Pro Max • 18 Pro • 17 • 16 • 15' },
  'group-ipad':    { family:'IPAD',        label:'All iPads',         models:['ipad-pro-13-m5', 'ipad-air-13-m4', 'ipad-mini-7-a17-pro'], line:'iPad Pro • Air • mini • iPad' },
  'group-macbook': { family:'MACBOOK',     label:'All MacBooks',      models:['macbook-air-15', 'macbook-pro-14-m5', 'macbook-neo-13'], line:'MacBook Air • Pro • Neo • M1 to M5' },
  'group-mac':     { family:'MAC',         label:'All Macs',          models:['imac-24-m4', 'macbook-air-15', 'macbook-pro-14-m5'], line:'iMac • MacBook Air • MacBook Pro' },
  'group-watch':   { family:'APPLE WATCH', label:'All Apple Watches', models:['watch-ultra3', 'watch-s11', 'watch-se3'], line:'Ultra • Series 11 • 10 • SE' },
  'group-airpods': { family:'AIRPODS',     label:'All AirPods',       models:['airpods-max', 'airpods-pro-3', 'airpods-3'], line:'AirPods • AirPods Pro • AirPods Max' },
  'group-apple':   { family:'APPLE',       label:'Everything Apple',  models:['iphone-17-pro', 'ipad-air-13-m4', 'macbook-air-15', 'watch-s11'], line:'iPhone • iPad • Mac • Apple Watch' },
};
const WEIGHT = { iphone:0.95, ipad:1, mac:1, watch:0.62, airpods:0.66, other:0.72 };
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

/* a card can be re-set only when its product is the hero and its ground does
   not picture a device (a watch headline over a photograph of MacBooks is the
   mismatch fixed on twelve cards); same test as scDeviceReady() in app.js */
const DEVICE_GROUND = /iphone|ipad|macbook|imac|mac-|watch|airpods|phone|device|tablet|laptop/i;
export function ready(rec){
  const L = rec.tpl.layers, prod = L.find(l => l.kind === 'cutout' && !l.__wall), bg = rec.tpl.bg || {};
  const src = bg.type === 'image' ? String(bg.src || '') : '';
  return !!(L.some(l => l.name === 'Headline 2') && prod && (prod.props.w || 0) >= 260 &&
    (!src || /\/grounds\//.test(src) || !DEVICE_GROUND.test(src.replace(/^.*\//, ''))));
}

export function variant(rec, card, key){
  const grp = GROUPS[key], m = grp ? { family: grp.family } : DEV[key]; if (!m) throw new Error('no device ' + key);
  const r = JSON.parse(JSON.stringify(rec)); const L = r.tpl.layers;
  const by = n => L.find(l => l.name === n);
  const h1 = by('Headline 1'), h2 = by('Headline 2'), items = by('Items'), prod = L.find(l => l.kind === 'cutout' && !l.__wall);
  if (!h2 || !prod) throw new Error('base card has no headline or product to re-set');
  if (h1 && !/^(WE BUY|SELL YOUR|CASH IN YOUR|CASH FOR)$/i.test(String(h1.text).trim())) h1.text = 'WE BUY';
  h2.text = m.family;
  if (items) items.text = grp ? grp.line : itemsFor(m.family);
  const accent = card && (card.accent || card.c1);
  const old = LIB[String(prod.props.src).replace(/^.*\//, '').replace(/\.webp$/, '')];
  const ow = prod.props.w, oh = old ? ow * old.h / old.w : ow, cx = prod.props.left + ow / 2, cy = prod.props.top + oh / 2;
  if (!grp){
    const slug = finishFor(m, accent), neu = LIB[slug];
    if (!neu) throw new Error('no art for ' + key);
    // fit the new device into the old product's box, about its centre
    const ar = neu.w / neu.h; let w = ow, h = w / ar; if (h > oh){ h = oh; w = h * ar; }
    prod.props = Object.assign({}, prod.props, { src: 'assets/cutouts/' + slug + '.webp', w: Math.round(w), left: Math.round(cx - w / 2), top: Math.round(cy - h / 2) });
  } else {
    // the line-up: weighted heights, a small gap, the row fitted into the box and centred
    const its = grp.models.filter(k => DEV[k]).map(k => { const slug = finishFor(DEV[k], accent), a = LIB[slug];
      return a ? { slug, ar: a.w / a.h, wt: WEIGHT[DEV[k].line] || 0.8 } : null; }).filter(Boolean);
    // the row takes the width of the card it stands on; wide devices overlap a little
    const rb = l => { const q = l.props || {}, w = q.width || 0, h = q.height || 0;
      return { x: (q.left || 0) - (q.originX === 'center' ? w / 2 : 0), y: (q.top || 0) - (q.originY === 'center' ? h / 2 : 0), w, h }; };
    const plate = L.filter(l => l.kind === 'rect').map(rb).filter(b => cx > b.x && cx < b.x + b.w && cy > b.y && cy < b.y + b.h && b.w < 1080 * 0.95)
      .sort((a, b) => a.w * a.h - b.w * b.h)[0];
    const roomW = plate ? plate.w - 2 * Math.max(36, plate.w * 0.06) : Math.max(ow, 1080 * 0.7);
    const wide = its.reduce((s, it) => s + it.ar, 0) / its.length > 1.2;
    const gapK = wide ? -0.08 : 0.06, rowW = hh => its.reduce((s, it) => s + hh * it.wt * it.ar, 0) + gapK * hh * (its.length - 1);
    const hh = Math.min(oh, roomW / rowW(1)); let x = cx - rowW(hh) / 2;
    L.splice(L.indexOf(prod), 1, ...its.map((it, i) => { const h = hh * it.wt, w = h * it.ar, l = JSON.parse(JSON.stringify(prod));
      l.name = i ? 'Hero Product ' + (i + 1) : prod.name;
      l.props = Object.assign({}, prod.props, { src: 'assets/cutouts/' + it.slug + '.webp', w: Math.round(w), left: Math.round(x), top: Math.round(cy + hh / 2 - h) });
      x += w + gapK * hh; return l; }));
  }
  r.id = rec.id + '--' + key; r.device = key;
  return r;
}

if (process.argv[1] && process.argv[1].endsWith('device_variants.mjs')){
  const base = arg('--base'), out = arg('--out');
  if (!base || !out){ console.error('usage: --base <card id> --out <dir> [--models a,b]'); process.exit(2); }
  const rec = JSON.parse(readFileSync(ROOT + 'assets/showcase/tpl/' + base + '.json', 'utf8'));
  if (!ready(rec)) console.warn('warning: ' + base + ' has no hero product, or its ground pictures a device; its variants will contradict it');
  const models = (arg('--models') || '').split(',').filter(Boolean);
  const keys = models.length ? models : [...new Set(Object.values(DEV).map(m => m.family))]
    .map(f => Object.entries(DEV).filter(([, m]) => m.family === f).sort((a, b) => Object.keys(b[1].colours).length - Object.keys(a[1].colours).length)[0][0]);
  mkdirSync(out, { recursive: true });
  keys.forEach(k => { const v = variant(rec, IDX[base], k); writeFileSync(out + '/' + v.id + '.json', JSON.stringify(v)); });
  console.log('wrote ' + keys.length + ' variants of ' + base + ' to ' + out + ': ' + keys.join(', '));
}
