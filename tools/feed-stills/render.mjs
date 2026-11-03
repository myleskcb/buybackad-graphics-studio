#!/usr/bin/env node
/* Feed stills: draw the 32 iPhone cards again with the video engine (harness.js),
   one look each, no two alike, and measure them against the library cards
   they replace.

   usage:  python3 -m http.server 8931 --bind 127.0.0.1   (repo root), then
           node tools/feed-stills/render.mjs [--base http://127.0.0.1:8931] [--ids a,b]

   Writes tools/feed-stills/out/: <id>.jpg (1080 square), report.json,
   sheet.jpg (the new set) and compare.jpg (library card | feed still).

   What "no two alike" means here, checked on every pick:
   - phones at least 13% of the height (the words come first: the owner asked for them large);
   - each card shows one iPhone model (15 to 18 Pro Max) in two or three of
     its colours; no two stills share their set of phones, and no phone is
     the front phone of more than two;
   - no two share a palette with the same background, and no palette is
     used more than twice;
   - the headline's typeface rotates through heavy, legible faces, so no
     face carries more than three.
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

// Heavy faces that stay legible in a thumbnail; the rounded/bubbly ones first.
const FACES = ['luckiest', 'tilt-warp', 'bungee', 'unbounded', 'franklin', 'satoshi', 'chivo', 'clash',
  'bricolage', 'schibsted', 'russo', 'bangers', 'sofia-xcond', 'oswald'];
// A long headline ("SELL YOUR iPHONE & iPAD") takes three lines in a wide face and leaves the
// phones no room; a condensed face sets it in two, as large.
const CONDENSED = ['sofia-xcond', 'oswald', 'big-shoulders', 'barlow-cond', 'saira-cond', 'teko', 'khand', 'squada'];
// The video maker's options that put small words or stray marks (sparkles, a typing caret) on the
// picture are held off, and the camera
// holds still, so the still is drawn where the plan put everything (the margins are checked there).
// A sign board round the headline (neon box, kraft tag) costs it about a third of its size
// (measured: 98-107px in a board, 151-157px without), and the number with it.
const QUIET = { decor: [], urgency: 'none', overlay: 'none', accents: 0, board: 'none', number_pos: 'bottom-center', number_format: 'parens', camera: 'still', shake: 0, sparkles: false, text_in: 'slide', text_scale: 1.25, number_scale: 1.12 };
// The number is the call to action, so it is always drawn as a button, never bare digits.
const BUTTONS = ['pill', 'box', 'tag'];

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

const used = { sets: new Set(), front: {}, ground: new Set(), palette: {}, face: {} };
const report = [];
for (let i = 0; i < cards.length; i++) {
  const card = cards[i];
  let got = null, tried = 0, skipped = {};
  const faces = card.headline.length > 16 ? CONDENSED : FACES;
  for (let s = 0; s < 120 && !got; s++) {
    const seed = 7001 + i * 97 + s;
    const font = faces[(i + s) % faces.length];
    if ((used.face[font] || 0) >= 3) continue;
    const phones = phonesFor(i, s);
    if (used.sets.has([...phones].sort().join(','))) { skipped['same phones as another card'] = (skipped['same phones as another card'] || 0) + 1; continue; }
    // the engine grows a headline to fill up to 36% of the height; where that leaves the
    // phones no room, the later tries start it a little smaller (still 120-140px)
    const long = card.headline.length > 16, scale = long ? (s < 50 ? 1.05 : .9) : (s < 60 ? 1.25 : 1.05);
    tried++;
    const r = await page.evaluate(([content, seed, lock]) => FS.look(content, seed, lock),
      [{ headline: card.headline, feed_line: card.line, feed_site: 'Visit our website at www.iPhones.LA', number: '(562) 999-4994', number_label: card.cta }, seed, { ...QUIET, font, number_style: BUTTONS[(i + s) % BUTTONS.length], text_pos: (i + s) % 2 ? 'top-left' : 'top-center', text_scale: scale, phones }]);
    const st = r.style, set = [...st.phones].sort().join(','), front = st.phones[0];
    const ground = st.palette + '|' + st.background;
    const clash = !r.ok ? r.why.join('; ')
      : used.sets.has(set) ? 'same phones as another card'
      : (used.front[front] || 0) >= 2 ? 'front phone used twice already'
      : used.ground.has(ground) ? 'same palette and background as another card'
      : (used.palette[st.palette] || 0) >= 2 ? 'palette used twice already' : '';
    if (clash) { skipped[clash] = (skipped[clash] || 0) + 1; continue; }
    got = { r, seed, font };
    used.sets.add(set); used.ground.add(ground);
    used.front[front] = (used.front[front] || 0) + 1;
    used.palette[st.palette] = (used.palette[st.palette] || 0) + 1;
    used.face[font] = (used.face[font] || 0) + 1;
  }
  if (!got) { console.log(`${card.id}: no look passed in ${tried} tries`, skipped); report.push({ id: card.id, ok: false, skipped }); continue; }
  const { r, seed } = got, st = r.style;
  writeFileSync(OUT + card.id + '.jpg', Buffer.from(r.url.split(',')[1], 'base64'));
  const row = {
    id: card.id, ok: true, seed, headline: card.headline, line: card.line, cta: card.cta,
    look: { font: st.font, number_style: st.number_style, palette: st.palette, background: st.background, arrangement: st.arrangement, board: st.board, text_fx: st.text_fx, case: st.case },
    phones: st.phones, subjectFit: r.subjectFit, px: r.px, contrast: r.contrast, before: before(card.id), skipped,
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
