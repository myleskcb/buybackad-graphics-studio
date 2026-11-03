#!/usr/bin/env node
/* Feed stills: draw the 32 iPhone cards again with the video engine (harness.js),
   one look each, in one house style, no two alike, and measure them against the library cards
   they replace.

   usage:  python3 -m http.server 8931 --bind 127.0.0.1   (repo root), then
           node tools/feed-stills/render.mjs [--base http://127.0.0.1:8931] [--ids a,b]

   Writes tools/feed-stills/out/: <id>.jpg (1080 square), report.json,
   sheet.jpg (the new set) and compare.jpg (library card | feed still).

   What "no two alike" means here, checked on every pick:
   - phones at least 13% of the height as drawn, clear of every text block (the words come
     first: the owner asked for them large);
   - each card shows one iPhone model (15 to 18 Pro Max) in two or three of
     its colours; no two stills share their set of phones, and no phone is
     the front phone of more than two;
   - every card in the house style below; no two share a colourway with the
     same ground, and each colourway carries an even share.
   A look that fails the engine's own audit (words, headline, number,
   contrast) or lets a line drop below body size is skipped for the next seed. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const ROOT = new URL('../../', import.meta.url).pathname;
const OUT = ROOT + 'tools/feed-stills/out/';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://127.0.0.1:8931');
const only = arg('--ids', '');
mkdirSync(OUT, { recursive: true });
// PLAYWRIGHT_MODULE as in scripts/social_studio_check.mjs; else a global install, found the way require() finds it
const { chromium } = process.env.PLAYWRIGHT_MODULE ? await import(process.env.PLAYWRIGHT_MODULE) : createRequire(import.meta.url)('playwright');

const { cards: all } = JSON.parse(readFileSync(ROOT + 'tools/feed-stills/cards.json', 'utf8'));
const cards = only ? all.filter(c => only.split(',').includes(c.id)) : all;

/* THE HOUSE STYLE. The owner, 2026-11-03, over the first full set: "some of the outlines look
   clean but further unify all themes", "drop old ones that look tacky cheesy or ununified ... or
   just look randomized or out of place", "we want scroll stopping award worthy designs".
   So every card is set the same way: one face (Chivo Black), capitals, the double outline,
   one accent word, the number in a pill, centred under the headline. What varies is the
   phones, the colourway (a dark ground with one bright accent, or one light) and a quiet
   ground. The rest of the maker's catalogue (candy, confetti, checkers, arcade, murals, neon
   brick, starfields, script and display faces, boards, stickers) stays out of this set. */
const HOUSE = { font: 'chivo', text_fx: 'double_outline', case: 'upper', color_mode: 'accent_word', number_style: 'pill', text_pos: 'top-center' };
const COLOURWAYS = ['graphite', 'ink_blue', 'black_gold', 'money_green', 'oxblood', 'klein', 'midnight_glass', 'cream_black'];
const GROUNDS = ['radial', 'spotlight', 'studio_sweep', 'tonal', 'spot_floor', 'linear'];
const ARRANGEMENTS = ['lineup', 'fan', 'showcase', 'podium', 'wings'];
// The video maker's options that put small words or stray marks (sparkles, a typing caret) on the
// picture are held off; the phones face back, flat, without the idle spin (caught turned in a
// photo they read as black slabs, not iPhones); and the camera
// holds still, so the still is drawn where the plan put everything (the margins are checked there).
// A sign board round the headline (neon box, kraft tag) costs it about a third of its size
// (measured: 98-107px in a board, 151-157px without), and the number with it.
const QUIET = { decor: [], urgency: 'none', overlay: 'none', accents: 0, board: 'none', number_pos: 'bottom-center', number_format: 'parens', camera: 'still', shake: 0, sparkles: false, text_in: 'slide', pose: 'flat', end_face: 'back', phone_idle: 'breathe', grade: 'none', depth: 'none', text_scale: 1.25, number_scale: 1.12, ...HOUSE };

/** The library card's own sizes, from its record (assets/showcase/tpl). */
function before(id) {
  const t = JSON.parse(readFileSync(ROOT + `assets/showcase/tpl/${id}.json`, 'utf8')).tpl;
  const sizes = t.layers.filter(l => l.text && l.props && l.props.fontSize).map(l => ({ role: l.role, px: l.props.fontSize }));
  const of = r => sizes.filter(s => s.role === r).map(s => s.px);
  return {
    headline: Math.round(Math.max(...of('headline'))), number: Math.round(Math.max(...of('phone'))),
    smallest: Math.round(Math.min(...sizes.map(s => s.px))), under40: sizes.filter(s => s.px < 40).length,
  };
}

const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', e => console.error('page:', e.message));
await page.goto(BASE + '/tools/feed-stills/index.html');
await page.waitForFunction(() => window.FS && window.VideoStill, null, { timeout: 60000 });
console.log('phones:', await page.evaluate(() => FS.ready()));

/* The phones (owner: "we have the ability to configure phones to any way shape or form"):
   each card shows one model in two or three of its real colours, models the cards name
   (iPhone 15 to 18 Pro Max), newest first, the next model for each card in turn, so no two
   cards share a set and the variety reads as chosen. Fewer, larger phones than the maker's
   own draw of three to five, which on a square full of large words shrank to a strip. */
const models = [];
for (const m of await page.evaluate(() => FS.phones())) {
  if (!/^iPhone 1[5-9]/.test(m.model)) continue;
  let g = models.find(x => x.model === m.model); if (!g) models.push(g = { model: m.model, ids: [] });
  g.ids.push(m.id);
}
const phonesFor = (i, s) => {
  const g = models[(i + Math.floor(s / 10)) % models.length], n = g.ids.length, k = n >= 3 && s % 3 !== 2 ? 3 : Math.min(2, n);
  const start = (Math.floor(i / models.length) * k + s) % n;
  return Array.from({ length: k }, (_, j) => g.ids[(start + j) % n]);
};
console.log('models:', models.map(g => g.model + ' ' + g.ids.length).join(', '));

const used = { sets: new Set(), front: {}, ground: new Set(), palette: {} };
const PALETTE_MAX = Math.ceil(cards.length / COLOURWAYS.length);
const report = [];
for (let i = 0; i < cards.length; i++) {
  const card = cards[i];
  let got = null, tried = 0, skipped = {};
  for (let s = 0; s < 120 && !got; s++) {
    const seed = 7001 + i * 97 + s;
    const palette = COLOURWAYS[(i + Math.floor(s / GROUNDS.length)) % COLOURWAYS.length], background = GROUNDS[(i + s) % GROUNDS.length];
    if ((used.palette[palette] || 0) >= PALETTE_MAX || used.ground.has(palette + '|' + background)) continue;
    const arrangement = ARRANGEMENTS[(2 * i + s) % ARRANGEMENTS.length];
    const phones = phonesFor(i, s);
    if (used.sets.has([...phones].sort().join(','))) { skipped['same phones as another card'] = (skipped['same phones as another card'] || 0) + 1; continue; }
    // the engine grows a headline to fill up to 36% of the height, in three lines if that is
    // larger; started at .85 it sets 'SELL YOUR / iPHONE' in two at about 138px and leaves the
    // claim, the selling points and the phones their room
    const long = card.headline.length > 16, scale = long ? (s < 50 ? .75 : .68) : (s < 60 ? .85 : .78);
    tried++;
    const r = await page.evaluate(([content, seed, lock]) => FS.look(content, seed, lock),
      [{ headline: card.headline, feed_line: card.line, feed_site: 'Visit our website at www.iPhones.LA', feed_where: card.where, feed_claim: card.claim, points: card.points, number: '(562) 999-4994', number_label: card.cta }, seed, { ...QUIET, palette, background, arrangement, text_scale: scale, phones, accents: 1, accent_set: ['cash', 'deal', 'local'][i % 3], accent_kind: 'asset', accent_in: 'pop', accent_idle: 'pulse' }]);
    const st = r.style, set = [...st.phones].sort().join(','), front = st.phones[0];
    const ground = st.palette + '|' + st.background;
    const clash = !r.ok ? r.why.join('; ')
      : used.sets.has(set) ? 'same phones as another card'
      : (used.front[front] || 0) >= 2 ? 'front phone used twice already'
      : used.ground.has(ground) ? 'same palette and background as another card'
      : (used.palette[st.palette] || 0) >= PALETTE_MAX ? 'colourway used enough already' : '';
    if (clash) { skipped[clash] = (skipped[clash] || 0) + 1; continue; }
    got = { r, seed };
    used.sets.add(set); used.ground.add(ground);
    used.front[front] = (used.front[front] || 0) + 1;
    used.palette[st.palette] = (used.palette[st.palette] || 0) + 1;
  }
  if (!got) { console.log(`${card.id}: no look passed in ${tried} tries`, skipped); report.push({ id: card.id, ok: false, skipped }); continue; }
  const { r, seed } = got, st = r.style;
  writeFileSync(OUT + card.id + '.jpg', Buffer.from(r.url.split(',')[1], 'base64'));
  const row = {
    id: card.id, ok: true, seed, headline: card.headline, line: card.line, cta: card.cta,
    look: { font: st.font, number_style: st.number_style, palette: st.palette, background: st.background, arrangement: st.arrangement, board: st.board, text_fx: st.text_fx, case: st.case },
    phones: st.phones, subjectFit: r.subjectFit, px: r.px, contrast: r.contrast, phonesDrawn: r.phonesDrawn, before: before(card.id), skipped,
  };
  report.push(row);
  console.log(`${String(i + 1).padStart(2)} ${card.id.padEnd(22)} seed ${seed} ${st.font.padEnd(11)} ${st.palette}/${st.background} ` +
    `head ${row.before.headline}→${r.px.headline} num ${row.before.number}→${r.px.number} smallest ${row.before.smallest}→${r.px.smallest} phones ${st.phones.length}`);
}

const done = report.filter(r => r.ok);
const median = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
const summary = {
  made: done.length, of: cards.length,
  before: { headline: median(done.map(r => r.before.headline)), number: median(done.map(r => r.before.number)), smallest: median(done.map(r => r.before.smallest)), cardsWithTextUnder40: done.filter(r => r.before.under40 > 0).length },
  after: { headline: median(done.map(r => r.px.headline)), number: median(done.map(r => r.px.number)), smallest: median(done.map(r => r.px.smallest)), minSmallest: Math.min(...done.map(r => r.px.smallest)) },
  distinct: { phoneSets: new Set(done.map(r => [...r.phones].sort().join(','))).size, grounds: new Set(done.map(r => r.look.palette + '|' + r.look.background)).size, faces: new Set(done.map(r => r.look.font)).size },
};
writeFileSync(OUT + 'report.json', JSON.stringify({ made: new Date().toISOString(), summary, cards: report }, null, 1) + '\n');
console.log(JSON.stringify(summary, null, 1));

// the sheets, drawn in the page
const url = f => 'data:image/jpeg;base64,' + readFileSync(f).toString('base64');
const after = done.map((r, i) => [`${i + 1} ${r.id}`, url(OUT + r.id + '.jpg')]);
const sheet = await page.evaluate(([items]) => FS.sheet(items, 8, 270), [after]);
writeFileSync(OUT + 'sheet.jpg', Buffer.from(sheet.split(',')[1], 'base64'));
const pairs = done.flatMap((r, i) => [[`${i + 1} before`, url(ROOT + `assets/library-ads/${r.id}.jpg`)], [`${i + 1} after`, url(OUT + r.id + '.jpg')]]);
const compare = await page.evaluate(([items]) => FS.sheet(items, 8, 270), [pairs]);
writeFileSync(OUT + 'compare.jpg', Buffer.from(compare.split(',')[1], 'base64'));
await browser.close();
console.log('wrote', OUT);
