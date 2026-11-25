#!/usr/bin/env node
/* THE BRAND CARD, CHECKED (DESIGN-LAW 185; logo/card.js, the card the brand kit and the card maker share).
   The owner, 2026-11-25: "business cards also dont have any real brand assets? or background options?",
   "needs to looks super clean".

   Draws every layout × background, front and back, for logos of every line (two of the gallery's for each,
   and a long name), with every detail, none, long ones, the person alone and a QR, and holds each side to:
     - the sheet: 1125 × 675, 3.5 × 2 in at 300 dpi on the 1/8 in bleed;
     - every word, the logo, the mark and the QR inside the safe area (Big mark's mark runs off on purpose);
     - nothing under 7 pt (29 px); no two words touching; no word on the logo, the mark or the QR;
     - the colours: words 4.5:1 on the card (and on a band 4.5:1), small lines 3:1, and every texture and
       the sheen's both ends quiet enough that words keep it;
     - the front says nothing that sells (no number, no details but a band's website); the back says only
       what was given, and an empty detail prints nothing (no sample number, address or website);
     - the QR at least 3/4 in across;
   and the kit: kit.js's card files are this card, in the layout and background the card maker chose
   (cleanSpec keeps a valid choice and drops an invalid one), or the look "Try another look" lands on.
   usage: node scripts/brand_card_check.mjs   exits 1 on any failure (no browser, no server) */
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readdirSync } from 'node:fs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const imp = (p) => import(pathToFileURL(join(ROOT, p)).href);
const E = await imp('logo/engine.js'), C = await imp('logo/card.js'), KIT = await imp('logo/kit.js'), PT = await imp('logo/pdf.js');
let fails = 0, passes = 0;
const seen = new Map();
const ok = (c, m, key = m) => { if (c) { passes++; return true; } fails++; const n = (seen.get(key) || 0) + 1; seen.set(key, n); if (n <= 3) console.log('  FAIL ' + m); return false; };

const faces = {};
for (const f of readdirSync(join(ROOT, 'logo/glyphs')).filter((f) => f.endsWith('.js'))) faces[f.replace(/\.js$/, '')] = (await imp('logo/glyphs/' + f)).default;

const designs = [];
for (const cat of E.LINES) {
  designs.push(...E.gallery({ name: 'Harbor Exchange', cat, town: 'Long Beach' }, { seed: 1, n: 2 }).slice(0, 2));
  designs.push(E.gallery({ name: 'Long Beach Premium Gold & Silver Exchange', cat }, { seed: 2, n: 1 })[0]);
}
const DETAILS = {
  full: { person: 'Maria Lopez', role: 'Owner', phone: '(562) 999-4994', email: 'maria@harborexchange.com', site: 'harborexchange.com', handle: '@harborexchange', address: '1200 Pine Ave, Long Beach', hours: 'Mon to Sat, 10 to 7' },
  none: {},
  long: { person: 'Maria Guadalupe Hernandez', role: 'Owner and Lead Buyer', phone: '+1 (562) 999-4994', email: 'maria.hernandez@longbeachgoldexchange.com', site: 'longbeachgoldexchange.com', address: '12345 East Pacific Coast Hwy, Long Beach', hours: 'Mon to Sat 10am to 7pm, Sun 12 to 5' },
  person: { person: 'Maria Lopez' },
  phone: { phone: '(562) 999-4994' },
};
const QR = { cells: Array.from({ length: 29 }, (_, r) => Array.from({ length: 29 }, (_, c) => (r * 7 + c * 3) % 5 < 2)), label: 'Scan to visit' };
const SAMPLES = /555-0123|yourshop|123 Main St|MON-SAT 10AM/i;
const WORD = (b) => !['logo', 'mark', 'qr', 'bigmark'].includes(b.role);
const overlap = (a, b) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0)) > 4;

let sides = 0;
for (const [di, d] of designs.entries()) {
  for (const L of C.CARD_LAYOUTS) for (const G of C.CARD_GROUNDS) for (const side of ['front', 'back']) {
    const dk = Object.keys(DETAILS)[(di + C.CARD_LAYOUTS.indexOf(L) + C.CARD_GROUNDS.indexOf(G)) % 5], x = KIT.cleanDetails(DETAILS[dk]);
    const qr = side === 'back' && (di + C.CARD_GROUNDS.indexOf(G)) % 3 === 0 ? QR : null;
    const r = C.brandCardSvg(d, x, faces, { side, layout: L.key, ground: G.key, qr });
    sides++;
    const tag = `${d.name} ${d.t} ${d.pair} ${L.key}/${G.key} ${side} ${dk}${qr ? ' qr' : ''}`;
    ok(r.w === 1125 && r.h === 675 && /viewBox="0 0 1125 675"/.test(r.svg), 'the sheet is 1125 × 675 (' + tag + ')', 'sheet');
    const S = r.safe;
    for (const b of r.boxes) {
      if (b.role === 'bigmark') continue;
      ok(b.x0 >= S.x0 - 1 && b.x1 <= S.x1 + 1 && b.y0 >= S.y0 - 1 && b.y1 <= S.y1 + 1, `${b.role} "${b.text}" inside the safe area (${tag}: ${[b.x0, b.y0, b.x1, b.y1].map(Math.round)})`, 'safe ' + b.role);
      if (WORD(b)) ok(b.em >= 28.99, `${b.role} "${b.text}" at 7 pt or more (${tag}: ${b.em.toFixed(1)} px)`, 'small ' + b.role);
    }
    const words = r.boxes.filter(WORD), art = r.boxes.filter((b) => !WORD(b));
    for (let i = 0; i < words.length; i++) for (let j = i + 1; j < words.length; j++) ok(!overlap(words[i], words[j]), `"${words[i].text}" and "${words[j].text}" apart (${tag})`, 'words touch');
    for (const w of words) for (const a of art) ok(!overlap(w, a), `"${w.text}" off the ${a.role} (${tag})`, 'word on ' + a.role);
    for (let i = 0; i < art.length; i++) for (let j = i + 1; j < art.length; j++) ok(!overlap(art[i], art[j]), `the ${art[i].role} and the ${art[j].role} apart (${tag})`, 'art touch');
    const P = r.palette;
    ok(E.contrast(P.I, P.G) >= 4.5 && E.contrast(P.A, P.G) >= 3 && E.contrast(P.Q, P.P) >= 4.5, `the colours read: words ${E.contrast(P.I, P.G).toFixed(2)}, small ${E.contrast(P.A, P.G).toFixed(2)}, band ${E.contrast(P.Q, P.P).toFixed(2)} (${tag})`, 'contrast ' + G.key);
    for (const t of r.tones) ok(E.contrast(P.I, t) >= 4.5 && (P.A === P.I || E.contrast(P.A, t) >= 3), `words keep their contrast on the ${G.key} (${tag}: ${E.contrast(P.I, t).toFixed(2)})`, 'texture ' + G.key);
    const texts = r.boxes.map((b) => b.text).join(' | ');
    ok(!SAMPLES.test(texts), `no sample detail is printed (${tag}: ${texts})`, 'sample');
    if (side === 'front') ok(r.boxes.every((b) => ['logo', 'bigmark', 'name', 'small', 'band'].includes(b.role)) && !texts.includes(x.phone || '@@'), `the front sells nothing (${tag}: ${texts})`, 'front');
    if (side === 'back') {
      const norm = (t) => String(t).replace(/[\s,|]/g, '').toLowerCase(), all = norm(texts);
      const want = ['person', 'role', 'phone', 'email', 'site', 'handle', 'address', 'hours'].map((k) => x[k]).filter(Boolean);
      ok(want.every((t) => all.includes(norm(t))), `the back says what was given (${tag}: ${texts})`, 'back says');
      if (qr) { const q = r.boxes.find((b) => b.role === 'qr'); ok(q && q.x1 - q.x0 >= 225, `the QR is 3/4 in across or more (${tag}: ${q && Math.round(q.x1 - q.x0)})`, 'qr'); }
    }
  }
}
console.log(`  ${sides} sides drawn (${designs.length} logos × ${C.CARD_LAYOUTS.length} layouts × ${C.CARD_GROUNDS.length} backgrounds × 2)`);

/* every pair the logo maker offers, on every background: the roles hold their contrast */
for (const pair of E.LOGO_PAIRS) for (const G of C.CARD_GROUNDS) {
  const P = C.cardPalette(pair, G.key);
  ok(E.contrast(P.I, P.G) >= 4.5 && E.contrast(P.A, P.G) >= 3 && E.contrast(P.Q, P.P) >= 4.5, `${pair} on ${G.key}: words ${E.contrast(P.I, P.G).toFixed(2)}, small ${E.contrast(P.A, P.G).toFixed(2)}, band ${E.contrast(P.Q, P.P).toFixed(2)}`, 'pair ' + G.key);
}
ok(C.cardPalette('black_gold', 'paper').G === C.PAPER && C.cardPalette('black_gold', 'paper').I === E.paletteOf('black_gold').G, 'white: the card is paper and the words are the brand\'s own dark');
ok(C.cardPalette('black_gold', 'reverse').G === E.paletteOf('black_gold').P, 'second colour: the card is the logo\'s second colour');

/* the kit draws this card */
const flat = { ...designs[0], finish: 'flat' }, det = DETAILS.full;
const kitSpec = { design: flat, details: det, looks: { card: 3 }, card: { layout: 'band', ground: 'paper' } };
ok(JSON.stringify(KIT.cleanSpec(kitSpec).card) === JSON.stringify({ layout: 'band', ground: 'paper' }), 'cleanSpec keeps the card the card maker chose');
ok(KIT.cleanSpec({ ...kitSpec, card: { layout: 'nope', ground: 'paper' } }).card === undefined, 'cleanSpec drops a card choice it does not know');
const same = (a, b) => a.replace(/ id="[^"]*"|url\(#[^)]*\)/g, '') === b.replace(/ id="[^"]*"|url\(#[^)]*\)/g, '');
for (const side of ['front', 'back']) {
  ok(same(KIT.kitSvg('card-' + side, kitSpec, faces).svg, C.brandCardSvg(flat, KIT.cleanDetails(det), faces, { side, layout: 'band', ground: 'paper' }).svg), `the kit's card ${side} is the card maker's (band on white)`);
  const [l, g] = C.CARD_LOOKS[3];
  ok(same(KIT.kitSvg('card-' + side, { ...kitSpec, card: null }, faces).svg, C.brandCardSvg(flat, KIT.cleanDetails(det), faces, { side, layout: l, ground: g }).svg), `with no choice, the kit's card ${side} is the look "Try another look" landed on (${l} on ${g})`);
}
const empty = C.brandCardSvg(flat, KIT.cleanDetails({}), faces, { side: 'back', layout: 'left', ground: 'solid' });
ok(empty.boxes.every((b) => !b.text || !SAMPLES.test(b.text)) && empty.boxes.some((b) => b.role === 'logo'), 'a kit with no details: the back is the logo, and no sample is printed');

/* print it today: one copy, pure enough for the function */
const links = PT.printLinks('90802');
ok(links.length === 4 && links[0].url.startsWith('https://www.google.com/maps/search/') && !links.some((l) => /UPS/.test(l.name)), 'the kit\'s print links are the card maker\'s (Google Maps with no device to ask; no chain without same-day cards)');

console.log((fails ? 'BRAND CARD: ' + fails + ' failure(s), ' : 'brand_card_check: ') + passes + ' passed');
process.exit(fails ? 1 : 0);
