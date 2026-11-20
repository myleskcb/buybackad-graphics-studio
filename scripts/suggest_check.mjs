#!/usr/bin/env node
/* SUGGEST FOR ME, CHECKED (fullad.js suggestLooks; full-ad-studio.js and motion/app.js, 2026-11-19).

   The owner, through the roadmap session: "what if we have a randomize or not quite randomized but suggest for
   me, which makes some sort of alternate styling based off of the ad you're looking at using other different
   type faces or colors or adjusting BG image or assets". Easy Mode's full ad and the video maker each offer a
   row of other looks for the ad on screen. This opens both and fails when:

     the row      fewer than three suggestions come, or one comes that is not three or more of colour, type,
                  ground, headline treatment, sticker, number style and layout away from the ad and from every
                  other one, or two share a colour family or a type pair;
     use          a suggestion used does not draw the look it showed, changes the ad's words, number or
                  pictures, or fails the download's own pre-flight; Back to mine does not put the ad back;
     locks        a colour or a type picked by hand is not in every suggestion;
     the mark     a signed-out visitor's suggestions are not marked as the preview is (rule 142);
     the maker    the video maker's row, for a full ad and for an Any look, gives fewer than three, or a
                  suggestion used changes the ad's words;
     the page     any page error.

   usage:  python3 -m http.server 8899   (in the repo), then
           [GFX_BASE=http://127.0.0.1:8899/] [PLAYWRIGHT_MODULE=...] node scripts/suggest_check.mjs
   Exits 1 on a failure. */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8899/').replace(/\/?$/, '/');
const fails = [], ok = (cond, what, more = '') => { console.log((cond ? '  ok   ' : '  FAIL ') + what + (more && !cond ? ': ' + more : '')); if (!cond) fails.push(what); };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 }), page = await ctx.newPage(), errors = [];
page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
await page.goto(BASE + '?demo=1', { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => typeof showEasy === 'function' && !!window.FullAdStudio && !!window.FullAdStudio.suggest, null, { timeout: 90000 });
await page.evaluate(() => { try { localStorage.setItem('pgfx_area_asked', 'true'); } catch (e) { } showEasy(); document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show')); });

/* one line in Easy Mode: the row, each card used in turn, Back to mine; returns what it saw */
const easy = (line, cat, locks = {}) => page.evaluate(async ({ line, cat, locks }) => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const settled = async () => { const t0 = Date.now(); while (Date.now() - t0 < 25000) { const i = document.getElementById('fa-preview'); if (i && i.getAttribute('aria-busy') === 'false') return true; await wait(120); } return false; };
  const F = await import('/motion/fullad.js'), FS = window.FullAdStudio, FA = FS.state;
  if (currentCat !== cat) setCategory(cat);
  FA.line[cat] = line; FA.recipe[cat] = ''; FA.pair = locks.pair || ''; FA.voice = locks.voice || ''; FA.look = null; FA.seed = 11;
  const ph = document.getElementById('ez-phone'); ph.value = '(562) 555-0142'; ph.dispatchEvent(new Event('input', { bubbles: true }));
  FS.enter(); await wait(300); await settled();
  const before = await FS.check(1080);
  await FS.suggest(false);
  const cards = [...document.querySelectorAll('#fa-suggest .fa-sg-card')].map(c => ({ look: JSON.parse(c.dataset.look || '{}'), marked: c.querySelector('img').dataset.marked }));
  const out = { n: cards.length, cards, before: { colour: before.colour, type: before.type || 'house', headline: before.headline, pictures: before.pictures, subject: before.subject }, used: [] };
  for (let i = 0; i < cards.length; i++) {
    document.querySelectorAll('#fa-suggest .fa-sg-card .fa-sg-use')[i].click(); await wait(250); await settled();
    const r = await FS.check(1080);
    out.used.push({ want: cards[i].look.palette + '/' + cards[i].look.type_pair, got: r.colour + '/' + (r.type || 'house'), headline: r.headline, pictures: r.pictures, subject: r.subject, ok: r.ok, fixes: r.fixes, number: document.getElementById('fa-preview').dataset.number });
  }
  document.getElementById('fa-sg-back').click(); await wait(250); await settled();
  const back = await FS.check(1080); out.back = back.colour + '/' + (back.type || 'house');
  out.families = cards.map(c => F.pairFamily(c.look.palette));
  out.now = F.lookOf ? null : null;
  FA.pair = ''; FA.voice = '';
  return out;
}, { line, cat, locks });

const AXES = ['palette', 'type_pair', 'ground', 'text_fx', 'sticker_shape', 'number_style', 'arrangement'];
const apart = (a, b) => AXES.filter(k => a[k] !== b[k]).length;
console.log('Easy Mode');
for (const [line, cat] of [['iphone', 'phones'], ['car', 'cars'], ['gold', 'gold']]) {
  const r = await easy(line, cat);
  const pairs = r.cards.flatMap((a, i) => r.cards.slice(i + 1).map(b => apart(a.look, b.look))), fam = new Set(r.families), voices = new Set(r.cards.map(c => c.look.type_pair));
  ok(r.n >= 3, `${line}: ${r.n} suggestions`, String(r.n));
  ok(pairs.every(d => d >= 3) && fam.size === r.n && voices.size === r.n, `${line}: each three or more apart from every other, no two in one colour family or one type pair`, JSON.stringify({ pairs, fam: [...fam], voices: [...voices] }));
  const bad = r.used.filter(u => u.got !== u.want || u.headline !== r.before.headline || u.pictures !== r.before.pictures || u.subject !== r.before.subject || u.number !== '(562) 555-0142' || !u.ok);
  ok(!bad.length, `${line}: each used draws its own look, keeps the words, number and pictures, and passes the pre-flight`, JSON.stringify(bad.slice(0, 2)));
  ok(r.back === r.before.colour + '/' + r.before.type, `${line}: Back to mine puts the ad back (${r.back})`, r.back + ' vs ' + r.before.colour + '/' + r.before.type);
}
const locked = await easy('iphone', 'phones', { pair: 'navy_gold', voice: 'press' });
ok(locked.n >= 1 && locked.cards.every(c => c.look.palette === 'navy_gold' && c.look.type_pair === 'press'), `a colour and a type picked by hand are in every suggestion (${locked.n})`, JSON.stringify(locked.cards.map(c => c.look.palette + '/' + c.look.type_pair)));
// signed out, the cards are marked as the preview is
const marks = await page.evaluate(async () => { account = null; await window.FullAdStudio.suggest(false); return { cards: [...document.querySelectorAll('#fa-suggest .fa-sg-card img')].map(i => i.dataset.marked), preview: typeof previewMarks === 'function' ? previewMarks() : null }; });
ok(marks.preview === true && marks.cards.length && marks.cards.every(m => m === 'true'), `a signed-out visitor's suggestions are marked as the preview is (${marks.cards.length})`, JSON.stringify(marks));

/* the video maker: a full ad and an Any look */
console.log('the video maker');
for (const full of [1, 0]) {
  await page.goto(BASE + 'motion/?full=' + full, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => document.getElementById('loading') && document.getElementById('loading').hidden && !!document.getElementById('suggest-look'), null, { timeout: 90000 });
  const m = await page.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), st = () => (JSON.parse(localStorage.getItem('pgfx_motion_v1') || '{}').style || {});
    document.getElementById('suggest-look').click();
    const t0 = Date.now(); while (Date.now() - t0 < 90000) { const b = document.getElementById('mo-suggest'); if (b && !b.hidden && !b.hasAttribute('aria-busy')) break; await wait(200); }
    const cards = [...document.querySelectorAll('#mo-suggest .mo-sg-card')];
    const before = st().headline;
    if (cards[0]) { cards[0].querySelector('.mo-sg-use').click(); await wait(1500); }
    return { n: cards.length, before, after: st().headline, back: !document.getElementById('mo-sg-back').hidden };
  });
  ok(m.n >= 3, `${full ? 'a full ad' : 'an Any look'}: ${m.n} suggestions`, String(m.n));
  ok(!m.before || m.after === m.before, `${full ? 'a full ad' : 'an Any look'}: a suggestion used keeps the words, and Back to mine is offered`, JSON.stringify(m));
}
ok(!errors.length, 'no page errors', errors.slice(0, 2).join(' | '));
await browser.close();
console.log(fails.length ? `\nsuggest: ${fails.length} failed` : '\nsuggest: each suggestion is another look of the same ad, apart from the rest, and passes its pre-flight');
process.exit(fails.length ? 1 : 0);
