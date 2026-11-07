#!/usr/bin/env node
/* THE AD GENERATOR: new iPhones LA ads on its own, in the house style, never the same ad twice.

   The owner, 2026-11-07, over the 27 full-element ads: "ads look good keep making more", "can
   we make this self working and creating new styles and new variations", "new elements".

   Each run composes a batch of new ads from the parts below, renders them through every check
   render.mjs and harness.js hold (margin, gaps, contrast on the picture delivered, phones as
   drawn, the engine's own audit), draws each one's video, and adds what it made to the ledger
   (tools/feed-stills/ledger.json), which the next run reads so nothing repeats: no ad's words,
   no phone set.

   What varies, and what never does. The house style the owner approved stays fixed (one face,
   the double outline, the claim badge, the chips, the pill, the footer: render.mjs HOUSE). The
   new styles come from inside it: sixteen colourways (a dark ground and one accent, or cream
   and black), six quiet grounds, five phone arrangements, five icon sets with five idle
   motions, and the video's opening (a third of them cross out what sellers are tired of,
   "NO MORE LOWBALLS"). Every word is a claim the shop already makes: no "#1", "best" or
   "fastest", which would need proof; a seller is asked for the IMEI, never a picture.

   usage:  python3 -m http.server 8931 --bind 127.0.0.1   (repo root), then
           node tools/feed-stills/generate.mjs [--count 24] [--batch 2026-11-07] [--no-video]
   Writes tools/feed-stills/batches/<batch>/: cards.json, <id>.jpg, report.json, sheet.jpg and
   video/<id>.mp4 (videos kept out of git), and appends the ledger. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const ROOT = new URL('../../', import.meta.url).pathname, HERE = ROOT + 'tools/feed-stills/';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const COUNT = +arg('--count', 24), BATCH = arg('--batch', new Date().toISOString().slice(0, 10));
const DIR = `${HERE}batches/${BATCH}/`, LEDGER = HERE + 'ledger.json';
mkdirSync(DIR, { recursive: true });

// mulberry32 on the batch's name: a batch can be made again exactly
let h = 2166136261; for (const ch of BATCH) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
const rnd = (() => { let a = h >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })();
const pick = a => a[Math.floor(rnd() * a.length)];
const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

/* ---------- the words ---------- */
// heroes: [headline, the model it names or null]
const HEROES = [
  ['WE BUY iPHONES'], ['SELL YOUR iPHONE'], ['CASH FOR iPHONES'], ['iPHONES WANTED'], ['TOP iPHONE BUYER'],
  ['HONEST iPHONE BUYER'], ['GET PAID TODAY'], ['TOP DOLLAR FOR iPHONES'], ['ALWAYS BUYING iPHONES'],
  ['CRACKED? WE BUY IT'], ['UPGRADING? SELL YOUR OLD ONE'], ['TURN YOUR iPHONE INTO CASH'], ['MAX CASH FOR iPHONES'],
  ['SELL YOUR iPHONE 15', 'iPhone 15'], ['SELL YOUR iPHONE 16', 'iPhone 16'], ['SELL YOUR iPHONE 17', 'iPhone 17'],
  ['CASH FOR iPHONE 17 PRO', 'iPhone 17 Pro'], ['CASH FOR iPHONE 16 PRO', 'iPhone 16 Pro'], ['WE BUY iPHONE 15 PRO', 'iPhone 15 Pro'],
  ['SELL YOUR 18 PRO MAX', 'iPhone 18 Pro Max'], ['SELL YOUR 17 PRO MAX', 'iPhone 17 Pro Max'], ['SELL YOUR 16 PRO MAX', 'iPhone 16 Pro Max'],
];
const CLAIMS = ['TOP DOLLAR • MAX OFFER', 'ALWAYS AVAILABLE • QUICK REPLIES', 'HONEST BUYER • TOP DOLLAR', 'MAX OFFER • FAST CASH',
  'TOP BUYER • QUICK REPLIES', 'TOP DOLLAR PAID', 'ALWAYS BUYING', 'LOCAL & HONEST', 'TOP DOLLAR • NO LOWBALLS', 'QUICK REPLIES • CASH TODAY'];
// one row at 56px holds about 24 letters: a line that takes two leaves the chips no room
const LINES = ['iPHONE 15 – 18 PRO MAX', 'ALL MODELS WANTED', 'NEW, USED OR CRACKED', 'CRACKED OR LIKE NEW', 'TEXT YOUR IMEI → FIRM QUOTE → GET PAID'];
const LINE_OF_MODEL = ['ANY STORAGE • ANY COLOR', 'NEW, USED OR CRACKED', 'ANY CARRIER WELCOME'];
// the chips: one way to reach us, one about the money, one about trust or ease; 14 letters at
// most, the length of the chips that found room in the first set
const HOW = ['TEXT YOUR IMEI', 'QUOTE BY TEXT', 'FREE QUOTE', 'TEXT US NOW'];
const MONEY = ['CASH SAME DAY', 'PAID TODAY', 'CASH OR ZELLE', 'TOP DOLLAR'];
const EASE = ['NO FEES', 'WE MEET YOU', 'MAIL-IN OK', 'NO LOWBALLS', 'FAIR & HONEST', 'NO OBLIGATION', 'ANY CONDITION', 'LOCAL MEETUP'];
const CTAS = ['TEXT US NOW', 'CALL OR TEXT', 'GET YOUR OFFER', 'TEXT FOR A QUOTE'];
const TOWNS = ['LONG BEACH', 'LAKEWOOD', 'DOWNEY', 'CARSON', 'TORRANCE'];
/* ---------- the looks, inside the house style ---------- */
const COLOURWAYS = ['graphite', 'ink_blue', 'black_gold', 'money_green', 'oxblood', 'klein', 'midnight_glass', 'cream_black',
  'sapphire', 'emerald', 'ruby', 'carbon', 'midnight_teal', 'royal', 'noir', 'midnight'];
const GROUNDS = ['radial', 'spotlight', 'studio_sweep', 'tonal', 'spot_floor', 'linear'];
const ARRANGEMENTS = ['lineup', 'fan', 'showcase', 'podium', 'wings'];
// icons that are 3D artwork (motion/accents.js ACCENT_SETS with an asset), and how they move
const ICONS = ['cash', 'money', 'deal', 'local', 'trust'];
const IDLES = ['pulse', 'bob', 'float', 'heartbeat', 'breathe'];
const STRIKES = ['LOWBALLS', 'FAKE OFFERS', 'SHADY BUYERS', 'TIME WASTERS', 'NO-SHOWS', 'THE RUNAROUND', 'SLOW BUYERS', 'ENDLESS TEXTING'];

const stems = s => new Set(s.toUpperCase().split(/[^A-Z0-9]+/).filter(w => w.length >= 4).map(w => w.slice(0, 5)));
const shares = (a, b) => { const B = stems(b); return [...stems(a)].some(w => B.has(w)); };

const ledger = existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, 'utf8')) : { _doc: 'Every ad generate.mjs has made, so the next run repeats none: its words and its phone set. Appended by tools/feed-stills/generate.mjs.', ads: [] };
const said = new Set(ledger.ads.map(a => [a.headline, a.claim, a.points].join('|')));
const useCount = k => ledger.ads.filter(a => a.palette === k).length;
// colourways the ledger has used least come first, so a new batch brings the ones not seen yet
const order = [...COLOURWAYS].sort((a, b) => useCount(a) - useCount(b) || COLOURWAYS.indexOf(a) - COLOURWAYS.indexOf(b));

const cards = [];
for (let n = 0, guard = 0; n < COUNT && guard < COUNT * 50; guard++) {
  const [headline, model] = pick(HEROES);
  if (cards.filter(c => c.headline === headline).length >= 2) continue;          // two of a hero to a batch at most
  const claim = pick(CLAIMS.filter(c => !shares(c, headline)));
  const steps = !model && rnd() < .15;
  const line = model ? pick(LINE_OF_MODEL) : steps ? LINES[4] : pick(LINES.slice(0, 4));
  const avoid = `${headline} ${claim} ${line}`;
  const chip = list => shuffle(list).find(x => !shares(x, avoid));
  const points = [chip(HOW), chip(MONEY), chip(EASE)].filter(Boolean);
  if (points.length < 3) continue;
  const key = [headline, claim, points.join(', ')].join('|');
  if (said.has(key)) continue;
  said.add(key);
  const cta = pick(CTAS.filter(c => !points.some(p => shares(p, c)) && !shares(c, line)));
  const start = Math.floor(rnd() * TOWNS.length), where = '📍 ' + [0, 1, 2].map(k => TOWNS[(start + k) % TOWNS.length]).join(' • ');
  const strike = rnd() < .33;
  cards.push({
    id: `ad-${BATCH}-${String(n + 1).padStart(2, '0')}`, headline, claim, line, points: points.join(', '), cta: cta || 'CALL OR TEXT', where,
    ...(model ? { model } : {}),
    colourways: order.slice(n % 4).concat(order.slice(0, n % 4)), grounds: shuffle(GROUNDS), arrangements: shuffle(ARRANGEMENTS),
    accents: rnd() < .8 ? 1 : 0, accent_set: pick(ICONS), accent_idle: pick(IDLES),
    ...(strike ? { hook: 'strike_out', strike_text: pick(STRIKES) } : {}),
  });
  n++;
}
writeFileSync(DIR + 'cards.json', JSON.stringify({ _doc: `Batch ${BATCH}, composed by generate.mjs.`, cards }, null, 2) + '\n');
console.log(`batch ${BATCH}: ${cards.length} new ads composed`);

const run = (script, extra) => execFileSync('node', [HERE + script, '--out', DIR, ...extra], { stdio: 'inherit', cwd: ROOT });
run('render.mjs', ['--cards', DIR + 'cards.json', '--avoid', 'tools/feed-stills/ledger.json']);
if (!process.argv.includes('--no-video')) run('video.mjs', []);

// what was made goes into the ledger
const rep = JSON.parse(readFileSync(DIR + 'report.json', 'utf8')).cards.filter(c => c.ok);
for (const r of rep) {
  const c = cards.find(x => x.id === r.id);
  ledger.ads.push({ id: r.id, batch: BATCH, headline: c.headline, claim: c.claim, line: c.line, points: c.points, cta: c.cta, where: c.where,
    palette: r.style.palette, background: r.style.background, arrangement: r.style.arrangement, phones: r.phones, hook: r.style.hook, strike_text: c.strike_text || '' });
}
writeFileSync(LEDGER, JSON.stringify(ledger, null, 1) + '\n');
console.log(`ledger: ${ledger.ads.length} ads (${rep.length} from this batch)`);
