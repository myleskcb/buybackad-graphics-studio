#!/usr/bin/env node
/* THE OWNER'S REVIEW PAGE: every offered ad, by category, best to worst, with a thumb up, a thumb
   down and a note (OPEN-ITEMS §BJ, DESIGN-LAW 144).

   The owner, 2026-11-18: "I want to see the entire library categorized and ranked best to worst
   (just for me the admin) so I can audit poor language or write quick changes with pop up prompt
   and thumbs up and down to approve or deny", and of a change to an ad's picture: "there should be
   a drop down of car assets we have", "same goes for phone or other categories".

   Reads the census (scripts/ad_census.mjs: its JSON and the thumbnails beside it) and writes a page
   for the Artifact viewer into .render/ad-review/: index.html (the page, no doctype: the viewer
   wraps it), data/ads.json (one row an ad: words, what it lacks, its old words, its rank in its
   category), data/thumbs.json (the census's thumbnails) and data/pictures.json (every cut-out a
   category may use, as a small thumbnail, for the "replace the picture" choice: never a flagged
   AI render, never one the owner rejected).

   The owner's thumbs and notes are kept in the page's own store (the db capability), where the
   session that published it reads them back and applies them: a thumb down holds the ad
   (template-holds.js, the library's choice-holds), a note is a change to its words or picture.
   Nothing here changes an ad.

   usage:  node scripts/build_review_page.mjs [--census .render/ad-census/census.json] [--out .render/ad-review]
           (the pictures need the static server: GFX_BASE=http://127.0.0.1:8931/) */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const ROOT = new URL('../', import.meta.url).pathname;
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const CENSUS = arg('--census', ROOT + '.render/ad-census/census.json'), OUT = arg('--out', ROOT + '.render/ad-review');
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8931/').replace(/\/?$/, '/');
const census = JSON.parse(readFileSync(CENSUS, 'utf8'));
const thumbsPath = CENSUS.replace(/\.json$/, '.thumbs.json');
/* --extra a.json,b.json: more census readings merged in (the full ad's looks, --variations), rows
   the main census already has left as they are */
const EXTRA = (arg('--extra', '') || '').split(',').filter(Boolean);
const extraThumbs = {};
for (const f of EXTRA) {
  const x = JSON.parse(readFileSync(f, 'utf8')), have = new Set(census.rows.map(r => r.id));
  census.rows.push(...x.rows.filter(r => !have.has(r.id)));
  const tp = f.replace(/\.json$/, '.thumbs.json'); if (existsSync(tp)) Object.assign(extraThumbs, JSON.parse(readFileSync(tp, 'utf8')));
}
const LIST = JSON.parse(readFileSync(ROOT + 'spec/banned-words.json', 'utf8'));
const PHRASES = LIST.phrases.map(e => ({ ...e, re: new RegExp(e.pattern, 'iu'), unlessRe: e.unless ? new RegExp(e.unless, 'iu') : null }));
mkdirSync(OUT + '/data', { recursive: true });

const CAT_NAMES = { phones: 'Phones & Apple', gaming: 'Gaming', audio: 'Audio', computers: 'Computers', wearables: 'Wearables', cameras: 'Cameras',
  gold: 'Gold', silver: 'Silver', coins: 'Coins', cars: 'Cars', strips: 'Test strips', pokemon: 'Pokémon', sports: 'Sports cards' };
const GEN_ORDER = ['full', 'dl', 'of', 'sc', 'any', 'feed'];
const EL_NAMES = { business: 'business name', headline: 'headline', product: 'product picture', number: 'phone number', cta: 'call to action', towns: 'towns', claims: 'claims', sticker: 'sticker', website: 'website' };
const safeId = id => String(id).replace(/[^A-Za-z0-9_.~:@+-]/g, '_').slice(0, 180);

// 1. the ads, ranked within their category: the census's score, lower is better (0: nothing to fix)
const rows = census.rows.filter(r => !r.error).map(r => {
  const words = (r.words || []).map(w => {
    const t = String(w.text || ''), up = t.toUpperCase(), hits = [];
    for (const e of PHRASES) { if (e.only && !e.only.includes(r.cat)) continue; const m = e.re.exec(up); if (m && !(e.unlessRe && e.unlessRe.test(up))) hits.push(e.label); }
    return { w: w.where, t, b: hits };
  });
  return {
    id: r.id, key: safeId(r.id), gen: r.gen, genName: r.genName, name: r.name, cat: r.cat, catName: CAT_NAMES[r.cat] || r.cat, offered: r.offered || '',
    score: r.score, words, banned: [...new Set((r.banned || []).map(b => b.label))], bannedNoName: [...new Set((r.bannedNoName || []).map(b => b.label))],
    lacks: (r.missing || []).map(k => EL_NAMES[k] || k), why: r.gateWhy || [],
    pair: r.colour && r.colour.match ? r.colour.name || r.colour.pair || 'a house pair' : '', offPair: !!(r.colour && !r.colour.match),
    pre: r.pre ? (r.pre.ok === false ? 'fails' : r.pre.ok === true ? 'passes' : 'none') : 'none', preSays: (r.pre && r.pre.says || []).filter(s => !/^warning/.test(s)).slice(0, 3),
    product: r.product ? Math.round((r.product.h || 0) * 100) : 0,
  };
});
const byCat = {};
for (const r of rows) (byCat[r.cat] ||= []).push(r);
for (const list of Object.values(byCat)) {
  list.sort((a, b) => a.score - b.score || GEN_ORDER.indexOf(a.gen) - GEN_ORDER.indexOf(b.gen) || a.name.localeCompare(b.name));
  list.forEach((r, i) => { r.rank = i + 1; r.of = list.length; });
}
writeFileSync(OUT + '/data/ads.json', JSON.stringify({ made: census.made, commit: census.commit, version: LIST.version, cats: CAT_NAMES, rows }));

// 2. the census's thumbnails, by the same key
if (existsSync(thumbsPath)) {
  const T = { ...extraThumbs, ...JSON.parse(readFileSync(thumbsPath, 'utf8')) }, out = {};
  for (const r of census.rows) if (T[r.id]) out[safeId(r.id)] = T[r.id];
  writeFileSync(OUT + '/data/thumbs.json', JSON.stringify(out));
}

// 3. the pictures each category may use, as 96px thumbnails (a flagged AI render or a rejected
//    picture is never offered)
const PREFIX = {
  phones: /^(iphone|qs-iphone|own-apple|photo-iphone|ip-|view-|ipad|qs-ipad|qs-family|photo-ipad|apple-ipad|mac-|macbook|qs-macbook|photo-macbook|qs-imac|sam-|samsung|pix-|phone)/,
  gaming: /^(game|console|controller|photo-gaming|laptop-gaming|vr-|gaming)/, audio: /^(buds|airpods|speaker|photo-audio|headphone)/,
  computers: /^(laptop|qs-device|qs-macbook|qs-imac|mac-|macbook|smart-tv|tv-|monitor)/, wearables: /^(watch|photo-wear|sam-watch|apple-watch|qs-watch)/,
  cameras: /^(photo-camera|camera|drone)/, gold: /^(gold|photo-gold)/, silver: /^(silver|photo-silver)/, coins: /^(coin|photo-coin)/,
  cars: /^car-/, strips: /^strip/, pokemon: /^poke/, sports: /^sports/,
};
const flags = JSON.parse(readFileSync(ROOT + 'assets/cutout-flags.json', 'utf8'));
const grid = JSON.parse(readFileSync(ROOT + 'assets/approved-assets.json', 'utf8'))['asset-grid-v1'] || {};
const rejected = new Set([].concat(grid.rejected || []).map(x => typeof x === 'string' ? x : x.id));
const names = existsSync(ROOT + 'assets/asset-names.json') ? JSON.parse(readFileSync(ROOT + 'assets/asset-names.json', 'utf8')) : {};
const files = readdirSync(ROOT + 'assets/cutouts').filter(f => f.endsWith('.webp')).map(f => f.replace(/\.webp$/, '')).filter(f => !flags[f] && !rejected.has(f));
const want = {};
for (const f of files) for (const [cat, re] of Object.entries(PREFIX)) if (re.test(f)) (want[cat] ||= []).push(f);
const all = [...new Set(Object.values(want).flat())];
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch(), page = await browser.newPage();
await page.goto(BASE + '404.html');
const thumbs = {};
for (let i = 0; i < all.length; i += 40) {
  const got = await page.evaluate(async ({ ids, base }) => {
    const out = {};
    await Promise.all(ids.map(async id => {
      try {
        const img = new Image(); img.src = base + 'assets/cutouts/' + id + '.webp'; await img.decode();
        const c = document.createElement('canvas'); c.width = c.height = 96; const g = c.getContext('2d');
        const k = Math.min(92 / img.naturalWidth, 92 / img.naturalHeight), w = img.naturalWidth * k, h = img.naturalHeight * k;
        g.drawImage(img, (96 - w) / 2, (96 - h) / 2, w, h); out[id] = c.toDataURL('image/webp', 0.72);
      } catch (e) { /* not a picture the browser can read: left out */ }
    }));
    return out;
  }, { ids: all.slice(i, i + 40), base: BASE });
  Object.assign(thumbs, got);
}
await browser.close();
const pictures = {};
for (const [cat, list] of Object.entries(want)) pictures[cat] = list.filter(f => thumbs[f]).map(f => ({ f, n: names[f] || f.replace(/^(photo|qs|own)-/, '').replace(/-/g, ' ') }));
writeFileSync(OUT + '/data/pictures.json', JSON.stringify({ thumbs, pictures }));

// 4. the page
copyFileSync(new URL('./review_page.html', import.meta.url).pathname, OUT + '/index.html');
const sz = f => (readFileSync(OUT + '/data/' + f).length / 1e6).toFixed(1) + ' MB';
console.log(`review page: ${rows.length} ads in ${Object.keys(byCat).length} categories; ${Object.values(pictures).reduce((a, l) => a + l.length, 0)} pictures for ${Object.keys(pictures).length} categories`);
console.log(`  ${OUT}/index.html, data/ads.json ${sz('ads.json')}, data/thumbs.json ${existsSync(OUT + '/data/thumbs.json') ? sz('thumbs.json') : 'none'}, data/pictures.json ${sz('pictures.json')}`);
