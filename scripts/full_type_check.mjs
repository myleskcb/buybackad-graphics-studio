#!/usr/bin/env node
/* THE TYPE PAIRS THE FULL AD MAY WEAR, MEASURED (DESIGN-LAW 141; motion/full-voices.js).

   The owner, 2026-11-13: "How do we integrate the type faces and how do we integrate general
   design language to fix this?" The full ad was one face (Chivo); the owner's type pairs
   (TYPE_VOICES, the photo ads' FONT_PAIRS, with the 27 Type Lab picks) were only on the older
   looks. A pair is offered on the full ad when the full ad still holds in it: for every pair
   whose display face takes the double outline (not a FINE_FACE), the ad is drawn in every size,
   on a dark and a light colour pair, with ordinary words and with Spanish, and the pair is kept
   only if, in all of them,

     blockers   fullBlockers() names nothing (no block left out, under its floor, in the margin
                or on another);
     pre-flight fullPreflight() on the delivered picture has nothing to fix;
     feed       with ordinary English words, on the square and on 4:5 (the sizes most ads are
                posted in), the pre-flight does not call the headline or the number small in a
                feed's preview. That is the full ad's own reading (PF.thumbHead, PF.thumbNum),
                not a number of this script's: a face whose capitals set small at the size the
                layout gives it is not a headline face for this ad.

   And then each kept pair is looked at, at the size of a feed's preview (SHEET=dir): the
   measures cannot read a word. A pair the eye could not read is held in BY_EYE below with what
   was seen; the owner strikes or restores a line there.

   usage:  python3 -m http.server 8899   (in the repo), then
           [GFX_BASE=http://127.0.0.1:8899/] [PLAYWRIGHT_MODULE=...] [SHEET=dir] node scripts/full_type_check.mjs [--write]
   Without --write it also fails when motion/full-voices.js is not the list it measures.
   SHEET=dir writes one square per pair (kept and cut) to look at. Exits 1 on a failure. */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8899/').replace(/\/?$/, '/');
const WRITE = process.argv.includes('--write'), SHEET = process.env.SHEET || '';
const OUT = fileURLToPath(new URL('../motion/full-voices.js', import.meta.url));
/* Looked at on the sheet of 2026-11-13, each at 356px (about a feed's preview), and not kept: */
const BY_EYE = {
  gothic: 'blackletter capitals under the double outline: SELL YOUR iPHONE does not read at a glance',
  terminal: "thin pixel strokes: the headline and the number are faint inside their outline and their pill",
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
const errors = []; page.on('pageerror', e => errors.push(String(e)));
await page.goto(BASE + 'motion/', { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => document.getElementById('loading').hidden, null, { timeout: 120000 });
const res = await page.evaluate(async ({ wantSheet }) => {
  const E = await import('/motion/engine.js'), C = await import('/motion/catalog.js'), A = await import('/motion/accents.js'), F = await import('/motion/fullad.js');
  const { phones, index } = await E.loadPhones('/motion/phones/');
  const assets = { phones, index, accents: await A.loadAccents('/assets/cutouts/') };
  const WORDS = {
    ordinary: { headline: 'SELL YOUR IPHONE', tag: 'IPHONE 15 – 18 PRO MAX', feed_claim: 'TOP DOLLAR • FAST CASH', points: 'FREE QUOTE, CASH SAME DAY, NO FEES', number_label: 'CALL OR TEXT', feed_where: 'LONG BEACH • LAKEWOOD • DOWNEY', site: 'www.YourShop.com' },
    spanish: { headline: 'COMPRAMOS TU IPHONE', tag: 'TODOS LOS MODELOS', feed_claim: 'COMPRADOR LOCAL • PAGO HOY', points: 'COTIZACIÓN GRATIS, PAGO EN EFECTIVO, SIN COMISIONES', number_label: 'LLAMA O MANDA TEXTO', feed_where: 'LONG BEACH • LAKEWOOD • DOWNEY', site: 'www.TuTienda.com', lang: 'es' },
  };
  const ASPECTS = ['1:1', '4:5', '9:16', '16:9'], PAIRS = ['navy-gold', 'silver-blue'].filter(k => F.COLOUR_OF[k]);
  const pairs = PAIRS.length === 2 ? PAIRS : F.COLOURWAYS.slice(0, 2);
  const out = {}, sheet = [];
  const draw = (key, words, aspect, palette, seed) => {
    const st = F.fullStyle({ ...C.DEFAULT_STYLE, ...words, number: '(562) 999-4994', aspect, phones: C.DEFAULT_PHONES.slice() }, seed, index, { palette, ...(key ? { type_pair: key, type_any: true } : {}) });
    return st;
  };
  const keys = ['', ...Object.keys(C.TYPE_VOICES)];
  for (const key of keys) {
    const v = key ? C.TYPE_VOICES[key] : null;
    const row = { name: v ? v.name : 'House', display: v ? C.FONTS[v.display][0] : 'Chivo', label: v ? C.FONTS[v.label][0] : 'Chivo', fine: !!v && C.FINE_FACES.has(v.display), why: [], head: 1e9, cases: 0 };
    if (row.fine) { row.why.push('its display face is too fine or too busy for the outline'); out[key || 'house'] = row; continue; }
    let n = 0;
    for (const [wname, words] of Object.entries(WORDS)) for (const aspect of ASPECTS) for (const palette of pairs) {
      const seed = 4001 + (n++) * 7919, st = draw(key, words, aspect, palette, seed);
      if (key && !st.full_pair) { row.why.push('the pair was not taken'); continue; }
      await E.loadFonts([...E.fontsFor(st), 'franklin']);
      const [W0, H0] = E.ASPECTS[aspect], k = 1080 / Math.min(W0, H0);
      let ad; try { ad = new F.FullAd(st, assets, Math.round(W0 * k), Math.round(H0 * k)); } catch (e) { row.why.push(`${wname} ${aspect}: threw ${String(e).slice(0, 60)}`); continue; }
      row.cases++;
      const why = F.fullBlockers(ad), m = F.fullMeasure(ad);
      const frame = F.fullStill(ad), pre = F.fullPreflight(ad, frame);
      row.head = Math.min(row.head, m.px.headline || 0);
      for (const w of why) row.why.push(`${wname} ${aspect} ${palette}: ${w}`);
      for (const f of pre.findings.filter(f => f.level === 'fix')) row.why.push(`${wname} ${aspect} ${palette}: ${f.say}`);
      if (wname === 'ordinary' && (aspect === '1:1' || aspect === '4:5')) for (const f of pre.findings.filter(f => f.code === 'feed')) row.why.push(`${wname} ${aspect}: ${f.say.slice(0, 60)} (${m.px.headline}px)`);
      if (wantSheet && wname === 'ordinary' && aspect === '1:1' && palette === pairs[0]) sheet.push([key || 'house', frame.toDataURL('image/jpeg', .86)]);
    }
    out[key || 'house'] = row;
  }
  return { out, sheet, pairs };
}, { wantSheet: !!SHEET });
await browser.close();

if (SHEET) { mkdirSync(SHEET, { recursive: true }); for (const [k, url] of res.sheet) writeFileSync(`${SHEET}/${k}.jpg`, Buffer.from(url.split(',')[1], 'base64')); }
const rows = Object.entries(res.out), house = res.out.house;
for (const [k, why] of Object.entries(BY_EYE)) if (res.out[k] && !res.out[k].why.length) res.out[k].why.push('held by eye: ' + why);
const kept = rows.filter(([k, r]) => k !== 'house' && !r.why.length).map(([k]) => k);
const cut = rows.filter(([k, r]) => k !== 'house' && r.why.length);
console.log(`the full ad in ${rows.length - 1} type pairs, ${Object.values(res.out)[1]?.cases || 0} ads a pair (4 sizes, 2 colour pairs: ${res.pairs.join(', ')}; English and Spanish)`);
console.log(`house (${house.display}): ${house.why.length ? 'FAILS ' + house.why.slice(0, 3).join(' | ') : 'holds'}, smallest headline ${house.head}px`);
console.log(`\nkept ${kept.length}: ${kept.map(k => `${res.out[k].name} (${res.out[k].display} + ${res.out[k].label}, ${res.out[k].head}px)`).join('; ')}`);
console.log(`\ncut ${cut.length}:`);
for (const [k, r] of cut) console.log(`  ${r.name} (${r.display}): ${[...new Set(r.why.map(w => w.replace(/^(ordinary|spanish) \S+ \S+: /, '').replace(/^(ordinary|spanish) \S+: /, '')))].slice(0, 2).join(' | ')}${r.why.length > 2 ? ` (${r.why.length} findings)` : ''}`);

const src = `// The type pairs the full ad may wear (motion/fullad.js fullVoiceOk, DESIGN-LAW 141).
// Written by scripts/full_type_check.mjs --write: never edit by hand.
// ${kept.length} of ${rows.length - 1} pairs: each drawn in four sizes, on a dark and a light colour pair, in English and
// Spanish, and kept only where the full ad's own blockers and pre-flight have nothing to fix and,
// with ordinary words on a square and on 4:5, the headline and the number read in a feed's preview;
// then looked at, and the ones the eye could not read held (BY_EYE in the script).
export const FULL_VOICES = ${JSON.stringify(kept)};
`;
let bad = errors.length || house.why.length;
if (errors.length) console.log('\npage errors: ' + errors.slice(0, 3).join(' | '));
if (WRITE) { writeFileSync(OUT, src); console.log(`\nwrote motion/full-voices.js: ${kept.length} pairs`); }
else if (readFileSync(OUT, 'utf8') !== src) { console.log('\nFAIL motion/full-voices.js is not the list measured here: run with --write, look at the sheet, commit'); bad = 1; }
else console.log('\nmotion/full-voices.js is the list measured');
process.exit(bad ? 1 : 0);
