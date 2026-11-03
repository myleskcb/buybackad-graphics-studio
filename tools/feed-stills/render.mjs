#!/usr/bin/env node
/* Feed stills: draw the 32 iPhone cards again with the video engine (harness.js),
   one look each, no two alike, and measure them against the library cards
   they replace.

   usage:  python3 -m http.server 8931 --bind 127.0.0.1   (repo root), then
           node tools/feed-stills/render.mjs [--base http://127.0.0.1:8931] [--ids a,b]

   Writes tools/feed-stills/out/: <id>.jpg (1080 square), report.json,
   sheet.jpg (the new set) and compare.jpg (library card | feed still).

   What "no two alike" means here, checked on every pick:
   - no two stills share their set of phones, and no phone is the front
     phone of more than two;
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
// The video maker's options that put small words on the picture are held off, and the camera
// holds still, so the still is drawn where the plan put everything (the margins are checked there).
// A sign board round the headline (neon box, kraft tag) costs it about a third of its size
// (measured: 98-107px in a board, 151-157px without), and the number with it.
const QUIET = { decor: [], urgency: 'none', overlay: 'none', accents: 0, board: 'none', number_pos: 'bottom-center', number_format: 'parens', camera: 'still', shake: 0, text_scale: 1.25, number_scale: 1.12 };
// The number is the call to action, so it is always drawn as a button, never bare digits.
const BUTTONS = ['pill', 'box', 'sticker', 'ticket', 'tag'];

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

const used = { sets: new Set(), front: {}, ground: new Set(), palette: {}, face: {} };
const report = [];
for (let i = 0; i < cards.length; i++) {
  const card = cards[i];
  let got = null, tried = 0, skipped = {};
  for (let s = 0; s < 80 && !got; s++) {
    const seed = 7001 + i * 97 + s;
    const font = FACES[(i + s) % FACES.length];
    if ((used.face[font] || 0) >= 3) continue;
    tried++;
    const r = await page.evaluate(([content, seed, lock]) => FS.look(content, seed, lock),
      [{ headline: card.headline, feed_line: card.line, feed_site: 'Visit our website at www.iPhones.LA', number: '(562) 999-4994', number_label: card.cta }, seed, { ...QUIET, font, number_style: BUTTONS[(i + s) % BUTTONS.length], text_pos: (i + s) % 2 ? 'top-left' : 'top-center' }]);
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
    phones: st.phones, subjectFit: r.subjectFit, px: r.px, before: before(card.id), skipped,
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
