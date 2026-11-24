#!/usr/bin/env node
/* THE WORDS WE WRITE BY DEFAULT, CHECKED AGAINST THE ONE LIST (DESIGN-LAW 143 and 144).

   The census (scripts/ad_census.mjs) reads every offered ad in a browser, in about seven minutes.
   This reads the lists those ads are written from, in about a second, so a banned phrase cannot go
   back into one of them unnoticed (rule 143's lesson: TOP DOLLAR was taken out of the pre-flight's
   list on 2026-11-12 and stayed in FULL_WORDS for six days):

     the full ad          motion/fullad.js FULL_WORDS
     its selling points   motion/full-points.js PROMISES and each kind's own
     the lines            motion/subjects.json, and offer-library.js LINES (the offer family)
     designer layouts     app.js DECKS
     the video maker      motion/catalog.js HEADLINES, HOOKS, TAGS, NUMBER_LABELS, COPY
     library cards        assets/showcase/tpl, the live ones (scIsLive, less choice-holds)
     iPhones LA's FeedAd  tools/feed-stills/cards.json and batches/<day>/cards.json
     the site's copy      motion/banned-words.js is in step with spec/banned-words.json

   A customer's own typed words are in none of these; the pre-flights note those (fullWords, the
   maker's look pre-flight). A phrase listed for some categories only (TEXT A PIC: phones) is read
   against each source's own category.

   usage:  node scripts/words_check.mjs        exit 1 on a banned phrase or a stale module */
import vm from 'node:vm';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const ROOT = new URL('../', import.meta.url).pathname, read = p => readFileSync(ROOT + p, 'utf8');
const LIST = JSON.parse(read('spec/banned-words.json'));
const PHRASES = LIST.phrases.map(e => ({ ...e, re: new RegExp(e.pattern, 'iu'), unlessRe: e.unless ? new RegExp(e.unless, 'iu') : null }));
const hits = [], counts = {};
function scan(source, cat, text, where) {
  counts[source] = (counts[source] || 0) + 1;
  const t = String(text || '').toUpperCase();
  for (const e of PHRASES) {
    if (e.only && !e.only.includes(cat)) continue;
    const m = e.re.exec(t); if (!m) continue;
    if (e.unlessRe && e.unlessRe.test(t)) continue;
    hits.push({ source, where, label: e.label, text: String(text).replace(/\n/g, ' / ') });
  }
}
const strings = (v, out = []) => { if (typeof v === 'string') out.push(v); else if (Array.isArray(v)) v.forEach(x => strings(x, out)); else if (v && typeof v === 'object') Object.values(v).forEach(x => strings(x, out)); return out; };
const isWords = s => /[A-Za-z]/.test(s) && !/^[a-z0-9_.\/#:-]+$/i.test(s.trim());   // not an id, a path or a colour

// the full ad
const fw = /export const FULL_WORDS = (\{[\s\S]*?\n\});/.exec(read('motion/fullad.js'));
if (!fw) { console.error('FULL_WORDS not found in motion/fullad.js'); process.exit(2); }
const FULL_WORDS = Function('return ' + fw[1])();
for (const [k, list] of Object.entries(FULL_WORDS)) for (const w of list) scan('full ad FULL_WORDS', 'phones', w, k);

// the full ad's selling points, drawn by its seed (motion/full-points.js, rule 164): every phrasing of every promise
const FP = await import(new URL('../motion/full-points.js', import.meta.url).href);
for (const sub of ['iphone', 'ipad', 'watch', 'headphones', 'console', 'camera', 'pokemon', 'gold', 'coins', 'car', 'strips'])
  for (const [k, [, says]] of Object.entries(FP.promisesFor(sub))) for (const w of says) scan('motion/full-points.js', sub === 'iphone' ? 'phones' : sub, w, k);

// the lines: the full ad's table, and the offer family it is made from
for (const s of JSON.parse(read('motion/subjects.json')).subjects) for (const w of strings([s.heads, s.models, s.points, ...(s.variants || []).map(v => [v.heads, v.models])])) scan('motion/subjects.json', s.cat, w, s.key);
const win = {};
try { const box = { window: {} }; vm.runInNewContext(read('offer-assets.js'), box); win.OFFER_ASSETS = box.window.OFFER_ASSETS; } catch (e) { /* none */ }
vm.runInNewContext(read('offer-library.js'), { window: win, TEMPLATES: [], CUTOUT_EXT: '.webp', console, Math, JSON, Object, Array, String, Number });
for (const l of (win.OFFER_LIBRARY && win.OFFER_LIBRARY.lines) || []) for (const w of strings([l.heads, l.models, l.ask, l.check, l.ledger, l.meet])) scan('offer-library.js', l.cat, w, l.key);

// the designer layouts' decks (app.js DECKS: one deck a category, each a line or two of literals)
const app = read('app.js').split('\n'), d0 = app.findIndex(x => /^\s*const DECKS = \{/.test(x));
let deck = '';
for (let i = d0 + 1; i < app.length && !/^\s*\};/.test(app[i]); i++) {
  const k = /^\s{4}(\w+):\s*\{/.exec(app[i]); if (k) deck = k[1];
  for (const m of app[i].matchAll(/'((?:[^'\\]|\\.)*)'/g)) { const w = m[1].replace(/\\n/g, '\n').replace(/\\'/g, "'"); if (isWords(w)) scan('app.js DECKS', deck, w, deck); }
}

// the video maker's catalogue (its looks are phone ads)
const C = await import(new URL('../motion/catalog.js', import.meta.url).href);
for (const name of ['HEADLINES', 'HOOKS', 'TAGS', 'NUMBER_LABELS', 'COPY']) for (const w of strings(C[name])) if (isWords(w)) scan('motion/catalog.js ' + name, 'phones', w, name);

// the live library cards
const holds = JSON.parse(read('assets/choice-holds.json')).cards || {};
const live = c => !!c && !c.defect && c.imagery !== 'none' && !(typeof c.chroma === 'number' && c.chroma < 0.05) && !holds[c.id];
for (const c of JSON.parse(read('assets/showcase/index.json')).filter(live)) {
  const rec = JSON.parse(read('assets/showcase/tpl/' + c.id + '.json'));
  for (const l of rec.tpl.layers || []) if (typeof l.text === 'string' && l.text.trim()) scan('library cards', c.cat, l.text, c.id + ' ' + l.name);
}

// the hints the forms show a customer (an example claim is a suggestion too)
for (const f of ['index.html', 'motion/index.html']) if (existsSync(ROOT + f)) for (const m of read(f).matchAll(/placeholder="([^"]*)"/g)) { const w = m[1].replace(/&bull;/g, '•').replace(/&amp;/g, '&'); if (isWords(w)) scan(f + ' placeholders', 'phones', w, 'placeholder'); }

// iPhones LA's FeedAd cards
const feeds = ['tools/feed-stills/cards.json', ...(existsSync(ROOT + 'tools/feed-stills/batches') ? readdirSync(ROOT + 'tools/feed-stills/batches').map(b => `tools/feed-stills/batches/${b}/cards.json`) : [])].filter(p => existsSync(ROOT + p));
const cardsOf = j => Array.isArray(j) ? j : Array.isArray(j.cards) ? j.cards : Object.values(j).filter(v => v && typeof v === 'object');
for (const p of feeds) for (const card of cardsOf(JSON.parse(read(p)))) for (const k of ['headline', 'line', 'cta', 'claim', 'points', 'where', 'burst', 'label', 'tag']) for (const w of strings(card[k])) scan(p, 'phones', w, (card.id || '') + ' ' + k);

// the site's copy of the list
let stale = '';
try { execFileSync(process.execPath, [ROOT + 'scripts/build_banned_words.mjs', '--check'], { stdio: 'pipe' }); }
catch (e) { stale = String(e.stderr || e.stdout || e).trim().split('\n')[0]; }

const total = Object.values(counts).reduce((a, b) => a + b, 0);
console.log(`words_check: ${total} lines read from ${Object.keys(counts).length} sources against ${PHRASES.length} phrases (spec/banned-words.json ${LIST.version})`);
for (const [s, n] of Object.entries(counts)) console.log(`  ${String(n).padStart(5)}  ${s}`);
if (stale) console.log('\n  STALE  ' + stale);
if (hits.length) {
  console.log(`\n${hits.length} banned phrase${hits.length > 1 ? 's' : ''}:`);
  for (const h of hits.slice(0, 80)) console.log(`  ${h.label.padEnd(26)} ${h.source} · ${h.where}: "${h.text}"`);
  if (hits.length > 80) console.log(`  … and ${hits.length - 80} more`);
}
console.log(hits.length || stale ? '\nfailed' : '\nall clear');
process.exit(hits.length || stale ? 1 : 0);
