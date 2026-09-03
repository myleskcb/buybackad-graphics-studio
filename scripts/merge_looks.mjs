#!/usr/bin/env node
/* Merge the repaired theme collections over the first cut, then backfill to a
   target count with palette variations of the themes that actually render.

   WF=<workflow dir> TARGET=100 node scripts/merge_looks.mjs
   Reads the repair workflow's journal, prefers a repaired collection over the
   original, drops what the repair dropped, and writes assets/looks.json. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname;
const WF = process.env.WF;
const TARGET = +(process.env.TARGET || 100);

const first = JSON.parse(readFileSync(ROOT + 'assets/looks.json', 'utf8')).looks;
const firstBy = {};
first.forEach(t => { (firstBy[norm(t.collection)] ||= []).push(t); });

function norm(k){ return String(k || '').toLowerCase().replace(/\s+/g, '-'); }

const repaired = {}, rechecks = {};
if (WF && existsSync(WF + '/journal.jsonl')){
  readFileSync(WF + '/journal.jsonl', 'utf8').trim().split('\n').forEach(l => {
    let r; try { r = JSON.parse(l); } catch(e){ return; }
    if (r.type !== 'result') return;
    const v = r.value || r.result;
    if (!v || typeof v !== 'object') return;
    if (Array.isArray(v.themes)) repaired[norm(v.key)] = v;
    if (Array.isArray(v.remaining)) rechecks[norm(v.key)] = v;
  });
}

/* the render test tells us which themes are real: a theme that produced cards
   without breaking its own rules is a keeper, one that produced none is not */
const rendered = {};
const dir = process.env.RENDER_DIR || '.render/looks100b';
if (existsSync(ROOT + dir + '/manifest.json')){
  JSON.parse(readFileSync(ROOT + dir + '/manifest.json', 'utf8'))
    .forEach(c => { rendered[c.look] = (rendered[c.look] || 0) + 1; });
}

const out = [];
const seen = new Set();
const collections = [...new Set(first.map(t => norm(t.collection)))];
for (const key of collections){
  const rep = repaired[key];
  const list = rep ? rep.themes : (firstBy[key] || []);
  const note = rep ? rep.collectionNote : (firstBy[key] || [{}])[0].collectionNote;
  list.forEach(t => {
    const id = t.id || t.key;
    if (!id || seen.has(id)) return;
    seen.add(id);
    out.push({ ...t, id, collection: key, collectionNote: note, source: rep ? 'repaired' : 'first-cut',
      renderedCards: rendered[id] || 0 });
  });
}

/* BACKFILL. The owner asked for a hundred themes and for "a couple of variations
   each", so a theme that renders cleanly and has more than one palette spawns a
   sibling on its second palette — a real variation, not a new invention. */
const proven = out.filter(t => t.renderedCards > 0 && (t.palettes || []).length > 1);
let vi = 0;
while (out.length < TARGET && proven.length){
  const base = proven[vi % proven.length];
  const palIx = 1 + Math.floor(vi / proven.length);
  const pal = (base.palettes || [])[palIx % base.palettes.length];
  const id = base.id + '-alt' + (palIx > 1 ? palIx : '');
  vi++;
  if (!pal || seen.has(id)) { if (vi > proven.length * 6) break; continue; }
  seen.add(id);
  out.push({ ...base, id, name: base.name + ' II', palettes: [pal].concat((base.palettes || []).filter(p => p !== pal)),
    oneLine: base.oneLine, source: 'variation-of:' + base.id, renderedCards: 0 });
}

writeFileSync(ROOT + 'assets/looks.json', JSON.stringify({
  built: '2026-09-03', source: 'theme-lock study, repaired and render-tested', looks: out,
}, null, 1));

const bySrc = {}; out.forEach(t => bySrc[String(t.source).split(':')[0]] = (bySrc[String(t.source).split(':')[0]] || 0) + 1);
const byCol = {}; out.forEach(t => byCol[t.collection] = (byCol[t.collection] || 0) + 1);
console.log(`looks.json: ${out.length} themes`);
console.log('  by source:', JSON.stringify(bySrc));
console.log('  by collection:', JSON.stringify(byCol));
console.log('  repaired collections:', Object.keys(repaired).join(', ') || 'none');
console.log('  rechecks:', Object.entries(rechecks).map(([k, v]) => k + ' ' + v.verdict).join(', ') || 'none');
