#!/usr/bin/env node
/* THE FREE-LICENCE PHOTOGRAPHS INTO THE LIBRARY (2026-11-21): assets/bg-free/, from the candidates
   scripts/fetch_free_photos.mjs downloaded and the contact sheets passed (the ones turned down are listed in
   <staging>/rejected.json). Every photograph here is public domain or CC0: an ad needs no credit for it,
   though its ATTRIBUTION.json keeps where each came from. It writes:
     assets/bg-free/<file> and assets/bg-free/ATTRIBUTION.json;
     spec/ground-tags.json: a scene (a world any product stands in: a city, a road, a room), or for coins and
       gold the goods themselves, which stand only behind an ad for those goods;
     spec/full-grounds.json: a metro's photographs under places, the others into their lines' pools
       (roads: cars; gaming: gaming; coins: coins and silver; collect: the cards; gold: gold).
   Then: GFX_BASE=http://127.0.0.1:8899/ node scripts/build_full_grounds.mjs --measure, and
         node scripts/import_free_photos.mjs --prune   (a photograph measured dim leaves the pools)

   usage:  node scripts/import_free_photos.mjs <staging dir>
           node scripts/import_free_photos.mjs --prune */
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url).pathname, DIR = 'assets/bg-free/';
const SPEC = ROOT + 'spec/full-grounds.json', TAGS = ROOT + 'spec/ground-tags.json';
const spec = JSON.parse(readFileSync(SPEC, 'utf8')), tags = JSON.parse(readFileSync(TAGS, 'utf8'));
const POOLS_OF = { roads: ['cars'], gaming: ['gaming'], coins: ['coins', 'silver'], collect: ['pokemon', 'sports'], gold: ['gold'] };
// a photograph of goods stands only behind an ad for those goods (fullad.js groundFits: never a coin behind gold jewellery)
const GOODS = { coins: { shows: 'product', subject: 'coins' }, gold: { shows: 'product', subject: 'gold' } };
const save = () => { writeFileSync(SPEC, JSON.stringify(spec, null, 2) + '\n'); writeFileSync(TAGS, JSON.stringify(tags, null, 1) + '\n'); };

if (process.argv.includes('--prune')) {
  const dim = f => { const m = spec.photos[f]; return !m || m.L == null || m.L < spec.limits.minL || m.dark > spec.limits.maxDark; };
  let n = 0;
  for (const o of [spec.pools, spec.places || {}]) for (const k of Object.keys(o)) { const was = o[k].length; o[k] = o[k].filter(f => !f.startsWith(DIR) || !dim(f)); n += was - o[k].length; }
  save(); console.log(`pruned ${n} dim photographs from the pools and places`);
  process.exit(0);
}
const STG = process.argv[2]; if (!STG) { console.error('usage: node scripts/import_free_photos.mjs <staging dir> | --prune'); process.exit(2); }
const cand = JSON.parse(readFileSync(STG + '/candidates.json', 'utf8'));
const rejected = new Set(existsSync(STG + '/rejected.json') ? JSON.parse(readFileSync(STG + '/rejected.json', 'utf8')) : []);
mkdirSync(ROOT + DIR, { recursive: true });
const credit = existsSync(ROOT + DIR + 'ATTRIBUTION.json') ? JSON.parse(readFileSync(ROOT + DIR + 'ATTRIBUTION.json', 'utf8')) : [];
const known = new Set(credit.map(c => c.file));
spec.places ||= {};
let added = 0;
for (const c of cand) {
  if (rejected.has(c.file) || !/^(public domain|pd|cc0|cc-zero|cc zero)/i.test(c.license)) continue;
  const src = DIR + c.file;
  if (!known.has(c.file)) {
    copyFileSync(STG + '/' + c.file, ROOT + src);
    credit.push({ file: c.file, cat: c.group, query: c.query, title: c.title, artist: c.artist, license: c.license, usage: c.usage, credit: c.credit, page: c.page, width: c.width, height: c.height });
    known.add(c.file); added++;
  }
  tags.tags[src] ||= { ...(GOODS[c.group] || { shows: 'scene' }) };
  if (c.group.startsWith('geo-')) { const m = c.group.slice(4); spec.places[m] ||= []; if (!spec.places[m].includes(src)) spec.places[m].push(src); }
  else for (const p of POOLS_OF[c.group] || []) { spec.pools[p] ||= []; if (!spec.pools[p].includes(src)) spec.pools[p].push(src); }
}
// a photograph turned down after it came in leaves the library's pools too
for (const o of [spec.pools, spec.places]) for (const k of Object.keys(o)) o[k] = o[k].filter(f => !f.startsWith(DIR) || !rejected.has(f.slice(DIR.length)));
writeFileSync(ROOT + DIR + 'ATTRIBUTION.json', JSON.stringify(credit, null, 1) + '\n');
spec.version = new Date().toISOString().slice(0, 10);
save();
console.log(`added ${added} photographs to ${DIR}; ${credit.length} in all; places: ${Object.entries(spec.places).map(([k, v]) => k + ' ' + v.length).join(', ')}`);
