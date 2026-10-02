#!/usr/bin/env node
/* SUBJECT — what each showcase card is selling, stamped on the index.
 *
 * Owner, 2026-10-02, over a "WE BUY CARDS" card and a "WE BUY HONDAS"
 * motorcycle on the landing: "a little niche", "I was thinking more popular
 * themes, especially on the homepage", then the mix the platform should show:
 * at least half Apple (iPhone 30, Mac 10, iPad 10), the rest across consoles,
 * VR, Samsung, Pixel, gold, coins, Pokémon cards, bullion and cars, then other
 * trading cards, then bikes. platform-mix.js holds that table; this stamps the
 * `subject` it is weighed by.
 *
 * A category is too coarse for it: "phones" holds iPhones, iPads, MacBooks and
 * watches, "cars" holds the motorcycles, "silver" holds bars and flatware. So
 * the subject is read off the card itself: the HEADLINE first (it names what
 * is being bought), then the product picture and the photograph, then the rest
 * of the copy. A card none of that settles keeps its category as its subject
 * and is simply not weighted.
 *
 *   node scripts/tag_subjects.mjs            dry run: counts per subject
 *   node scripts/tag_subjects.mjs --write    stamp the index
 *
 * Run it after hold_showcase.mjs (OPEN-ITEMS §R, the pipeline), and after any
 * change to a card's words or picture.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { live } from './_showcase_harness.mjs';
const DIR = new URL('../assets/showcase/', import.meta.url).pathname;
const WRITE = process.argv.includes('--write');
const raw = readFileSync(DIR + 'index.json', 'utf8'), idx = JSON.parse(raw);

const base = s => String(s || '').split('/').pop().replace(/\.[a-z0-9]+$/i, '').toLowerCase();
const first = (text, table) => {
  /* the subject named EARLIEST in the text wins: "SELL YOUR iPHONE & iPAD"
     is an iPhone card that also takes iPads */
  let best = null, at = Infinity;
  for (const [key, re] of table){ const m = re.exec(text); if (m && m.index < at){ best = key; at = m.index; } }
  return best;
};
const DEVICE_WORDS = [
  ['iphone',  /\bI ?PHONES?\b/],
  ['ipad',    /\bI ?PADS?\b/],
  ['mac',     /\b(?:MAC ?BOOKS?|IMACS?|MACS?|MAC MINI|MAC STUDIO)\b/],
  ['watch',   /\bWATCH(?:ES)?\b/],
  ['samsung', /\b(?:SAMSUNG|GALAXY)\b/],
  ['pixel',   /\bPIXELS?\b/],
];
const DEVICE_PICS = [
  ['iphone',  /^(?:iphone|ip-|qs-iphone|qs-set-iphone|own-apple)|iphones?/],
  ['ipad',    /ipads?/],
  ['mac',     /mac/],
  ['watch',   /watch/],
  ['samsung', /^sam|samsung|galaxy/],
  ['pixel',   /^pix|pixel/],
];
const BIKE = /\b(?:HARLEY|YAMAHA|KAWASAKI|DUCATI|SUZUKI|MOTORCYCLES?|DIRT ?BIKES?|BIKES?|MOTOS?)\b/;
const BULLION_WORDS = /\b(?:BULLION|BARS?|ROUNDS?|EAGLES?|MAPLES?|KRUGERRANDS?|OUNCES?|OZ)\b/;

function subjectOf(row, tpl){
  const layers = (tpl && tpl.layers) || [];
  const heads = layers.filter(l => l.role === 'headline').map(l => String(l.text || '')).join(' ').toUpperCase();
  const words = layers.filter(l => /^(text|textbox)$/.test(l.kind)).map(l => String(l.text || '')).join(' ').toUpperCase();
  const pics = layers.filter(l => l.props && l.props.src).map(l => base(l.props.src))
    .concat([base(tpl && tpl.bg && tpl.bg.src), base(row.product)]).filter(Boolean);
  const picHit = table => { for (const p of pics){ for (const [key, re] of table) if (re.test(p)) return key; } return null; };
  switch (row.cat){
    case 'phones':
      return first(heads, DEVICE_WORDS) || picHit(DEVICE_PICS) || first(words, DEVICE_WORDS) || 'phones';
    case 'cars':
      return (BIKE.test(words) || pics.some(p => /motorcycle|moto|bike/.test(p))) ? 'bikes' : 'cars';
    case 'gold':
      return (BULLION_WORDS.test(heads) || pics.some(p => /bars?\b|-bars?-|bullion/.test(p))) ? 'bullion' : 'gold';
    case 'silver':
      /* silver bought by weight as bars, rounds and coins is bullion; flatware,
         candlesticks and jewelry are not on the owner's list */
      return (BULLION_WORDS.test(heads) || pics.some(p => /silver-(?:bars?|coins?|rounds?)/.test(p))) ? 'bullion' : 'silver';
    case 'coins':   return 'coins';
    case 'pokemon': return 'pokemon';
    case 'sports':  return 'cards';
    default:        return row.cat;
  }
}

let changed = 0, unread = 0;
const per = {}, perLive = {};
for (const row of idx){
  const f = DIR + 'tpl/' + row.id + '.json';
  if (!existsSync(f)){ unread++; continue; }
  let rec = null;
  try { rec = JSON.parse(readFileSync(f, 'utf8')); } catch (e){ unread++; continue; }
  const s = subjectOf(row, rec.tpl || rec);
  if (row.subject !== s){ row.subject = s; changed++; }
  per[s] = (per[s] || 0) + 1;
  if (live(row)) perLive[s] = (perLive[s] || 0) + 1;
}
const fmt = o => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(', ');
console.log(`${idx.length} cards · ${changed} subjects changed` + (unread ? ` · ${unread} records unreadable (left as they were)` : ''));
console.log('live per subject: ' + fmt(perLive));
console.log('all per subject:  ' + fmt(per));
if (WRITE){ writeFileSync(DIR + 'index.json', JSON.stringify(idx) + (raw.endsWith('\n') ? '\n' : '')); console.log('wrote index.json'); }
