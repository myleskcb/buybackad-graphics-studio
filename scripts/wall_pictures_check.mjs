#!/usr/bin/env node
/* A PICTURE THAT DOES NOT ARRIVE IS NEVER SHOWN BROKEN (app.js pictureWatch, scWallWatch, scCard).

   The owner, 2026-11-23, of wall tiles showing the browser's broken-picture mark and their alt text
   ("MacBooks (full ad, look 8) template"): "fix this so our final product doesn't have this issue".
   This opens the landing with some pictures made to fail (page.route) and fails when:

     whole      with nothing failing, any wall picture has not loaded or cannot be seen (a still
                missing from the build shows here, before a visitor finds it);
     dropped    a wall picture whose first two requests are dropped shows broken as it waits, or is
                not in, in both copies of its column, once the third is let through;
     never      a wall picture that never comes leaves its card standing: the card must be gone from
                both copies of its column, the two copies still alike (the loop), every other tile in;
     back       it does not return, in both copies, when the connection does;
     library    a library card whose picture never comes stays in the grid;
     in sight   at any moment in any of these, a failed picture would paint: a broken-picture mark
                or alt text a visitor could see;
     errors     any page error.

   A sampler in the page looks ten times a second for a failed picture in sight: one that is
   complete with no width, not clear, not hidden, its card not gone.

   usage:  python3 -m http.server 8899   (in the repo), then
           [GFX_BASE=http://127.0.0.1:8899/] [PLAYWRIGHT_MODULE=...] node scripts/wall_pictures_check.mjs
   Exits 1 on a failure. Written 2026-11-23. */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8899/').replace(/\/?$/, '/');
const fails = [], ok = (cond, what, more = '') => { console.log((cond ? '  ok   ' : '  FAIL ') + what + (more ? ' (' + more + ')' : '')); if (!cond) fails.push(what); };
const PICTURES = '#hero-wall img, #page-landing .tpl-card img';

/* the sampler, in the page before its own scripts: every failed picture a visitor could have seen */
const SAMPLER = `(() => {
  window.__inSight = [];
  const seen = new Set();
  setInterval(() => {
    document.querySelectorAll(${JSON.stringify(PICTURES)}).forEach((im) => {
      if (!(im.complete && !im.naturalWidth && im.getAttribute('src'))) return;
      const s = getComputedStyle(im), card = im.closest('.wall-card, .tpl-card');
      if (s.opacity === '0' || s.visibility === 'hidden' || s.display === 'none') return;
      if (card && getComputedStyle(card).display === 'none') return;
      const key = im.alt + ' ' + im.getAttribute('src');
      if (!seen.has(key)) { seen.add(key); window.__inSight.push(im.alt); }
    });
  }, 100);
})();`;

const browser = await chromium.launch();
/* rules: [{ test: url => bool, how: 'abort' | '404', until: ms since the page opened, or Infinity; open: false }] */
async function open(rules = []) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(), errors = [], t0 = Date.now();
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  await page.addInitScript(SAMPLER);
  await page.route('**/*', (route) => {
    const url = route.request().url();
    for (const r of rules) {
      if (!r.open && Date.now() - t0 < r.until && r.test(url)) { r.hits = (r.hits || 0) + 1; return r.how === '404' ? route.fulfill({ status: 404, contentType: 'text/plain', body: 'gone' }) : route.abort('failed'); }
    }
    return route.continue();
  });
  await page.goto(BASE, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => { const c = document.querySelectorAll('#hero-wall .wall-col'); return c.length && [...c].every((x) => x.querySelectorAll('.wall-card').length >= 2); }, null, { timeout: 120000 });
  await page.waitForFunction(() => { const s = document.querySelector('.hero-stage'); return !s || !s.classList.contains('wall-wait'); }, null, { timeout: 30000 }).catch(() => {});
  return { ctx, page, errors };
}
/* the wall as it stands: each column's cards, both copies */
const wall = (page) => page.evaluate(() => [...document.querySelectorAll('#hero-wall .wall-col')].map((col) => [...col.querySelectorAll('.wall-card')].map((d) => {
  const im = d.querySelector('img'), s = im ? getComputedStyle(im) : null;
  return { title: d.title, src: im ? im.getAttribute('src') : '', gone: getComputedStyle(d).display === 'none', loaded: !!im && im.complete && im.naturalWidth > 0,
    seen: !!im && s.opacity === '1' && s.visibility !== 'hidden', failed: !!im && im.complete && !im.naturalWidth };
})));
const inSight = (page) => page.evaluate(() => window.__inSight || []);
const file = (src) => new URL(src, BASE).pathname;
const both = (cols, title) => cols.flat().filter((t) => t.title === title);
const alike = (cols) => cols.every((col) => { const h = col.length / 2, a = col.slice(0, h).filter((t) => !t.gone).map((t) => t.title), b = col.slice(h).filter((t) => !t.gone).map((t) => t.title); return a.join('|') === b.join('|'); });

/* ---------- whole ---------- */
console.log('whole: nothing failing');
let picks;
{
  const { ctx, page, errors } = await open();
  await page.waitForFunction(() => [...document.querySelectorAll('#hero-wall img')].every((im) => im.complete), null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(600);   // the fade
  const cols = await wall(page), all = cols.flat();
  const notIn = all.filter((t) => !t.loaded || !t.seen || t.gone);
  ok(all.length >= 12 && !notIn.length, `every wall picture has loaded and is seen: ${all.length - notIn.length} of ${all.length}`, notIn.slice(0, 4).map((t) => t.title + ' <- ' + t.src).join('; '));
  ok(alike(cols), 'each column is its list twice');
  ok(!(await inSight(page)).length, 'nothing broken was in sight', (await inSight(page)).join('; '));
  ok(!errors.length, 'no page errors', errors.join(' | '));
  const half = (c) => cols[c].slice(0, cols[c].length / 2);
  // an early one (asked for at once), two late ones (asked for once the wall is in)
  picks = { early: half(1)[0], late: half(0)[4], last: half(2)[5] };
  // the library, further down: its first card's picture
  await page.evaluate(() => { const g = document.querySelector('#page-landing .tpl-card'); if (g) g.scrollIntoView({ block: 'center' }); });
  await page.waitForFunction(() => { const im = document.querySelector('#page-landing .tpl-card img'); return im && im.complete && im.naturalWidth > 0; }, null, { timeout: 30000 }).catch(() => {});
  picks.card = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('#page-landing .tpl-card')];
    const c = cards.find((d) => { const s = d.querySelector('img').getAttribute('src') || ''; return !/^(data|blob):/.test(s); });   // a baked picture, not one drawn here
    return c ? { name: c.querySelector('.tpl-name').textContent, src: c.querySelector('img').getAttribute('src'), count: cards.length } : null;
  });
  await ctx.close();
}
const is = (pick) => (url) => new URL(url).pathname === file(pick.src);

/* ---------- dropped for a while, then let through ---------- */
console.log('dropped: a late picture and an early one fail twice, then come');
{
  // dropped until this says otherwise (not by the clock: a slow page must not let them through early),
  // and let through before the third ask, which comes 6.5 s after the first
  const rules = [{ test: is(picks.late), how: 'abort', until: Infinity }, { test: is(picks.early), how: 'abort', until: Infinity }];
  const { ctx, page, errors } = await open(rules);
  await page.waitForTimeout(2500);
  const mid = await wall(page);
  rules.forEach((r) => { r.open = true; });
  const waiting = [...both(mid, picks.late.title), ...both(mid, picks.early.title)];
  ok(waiting.length === 4 && waiting.every((t) => !t.seen && !t.gone), 'as they wait, their tiles stand and their pictures are not shown', JSON.stringify(waiting.map((t) => [t.title, t.seen, t.gone])));
  await page.waitForFunction((titles) => titles.every((ti) => [...document.querySelectorAll('#hero-wall .wall-card')].filter((d) => d.title === ti).every((d) => { const im = d.querySelector('img'); return im.complete && im.naturalWidth > 0; })), [picks.late.title, picks.early.title], { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(600);
  const end = await wall(page), came = [...both(end, picks.late.title), ...both(end, picks.early.title)];
  ok(came.length === 4 && came.every((t) => t.loaded && t.seen && !t.gone), 'let through, they come in, in both copies of their columns', JSON.stringify(came.map((t) => [t.title, t.loaded, t.seen, t.gone])));
  ok(rules.every((r) => r.hits >= 1), 'and each had been dropped first', rules.map((r) => r.hits).join(', '));
  ok(end.flat().every((t) => t.loaded && t.seen && !t.gone), 'and the whole wall is in');
  ok(!(await inSight(page)).length, 'nothing broken was ever in sight', (await inSight(page)).join('; '));
  ok(!errors.length, 'no page errors', errors.join(' | '));
  await ctx.close();
}

/* ---------- never comes; then the connection returns ---------- */
console.log('never: one picture is gone from the server, one is never reached');
{
  const rules = [{ test: is(picks.early), how: '404', until: Infinity }, { test: is(picks.last), how: 'abort', until: Infinity }];
  const { ctx, page, errors } = await open(rules);
  await page.waitForFunction((titles) => titles.every((ti) => [...document.querySelectorAll('#hero-wall .wall-card')].filter((d) => d.title === ti).every((d) => getComputedStyle(d).display === 'none')), [picks.early.title, picks.last.title], { timeout: 25000 }).catch(() => {});
  const cols = await wall(page), lost = [...both(cols, picks.early.title), ...both(cols, picks.last.title)];
  ok(lost.length === 4 && lost.every((t) => t.gone), 'their cards leave the wall, in both copies of their columns', JSON.stringify(lost.map((t) => [t.title, t.gone])));
  ok(alike(cols), 'the two copies of every column are still alike, so the loop is whole');
  const rest = cols.flat().filter((t) => t.title !== picks.early.title && t.title !== picks.last.title);
  ok(rest.every((t) => t.loaded && t.seen && !t.gone), `every other tile is in: ${rest.filter((t) => t.loaded && t.seen).length} of ${rest.length}`);
  ok(rules.every((r) => r.hits >= 3), 'each was asked for again before it was given up (three asks or more)', rules.map((r) => r.hits).join(', '));
  ok(!(await inSight(page)).length, 'nothing broken was ever in sight', (await inSight(page)).join('; '));
  // back: the server has them again, and the browser says it is online
  rules.forEach((r) => { r.open = true; });
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await page.waitForFunction((titles) => titles.every((ti) => [...document.querySelectorAll('#hero-wall .wall-card')].filter((d) => d.title === ti).every((d) => { const im = d.querySelector('img'); return getComputedStyle(d).display !== 'none' && im.complete && im.naturalWidth > 0; })), [picks.early.title, picks.last.title], { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(600);
  const after = await wall(page), back = [...both(after, picks.early.title), ...both(after, picks.last.title)];
  ok(back.length === 4 && back.every((t) => t.loaded && t.seen && !t.gone), 'back online, they return in both copies', JSON.stringify(back.map((t) => [t.title, t.loaded, t.seen, t.gone])));
  ok(alike(after) && !(await inSight(page)).length, 'the copies alike, and still nothing broken in sight', (await inSight(page)).join('; '));
  ok(!errors.length, 'no page errors', errors.join(' | '));
  await ctx.close();
}

/* ---------- a library card ---------- */
console.log("the library: a card's picture is gone from the server");
if (!picks.card) ok(false, 'the landing shows a library card with a baked picture to try');
else {
  const rule = { test: (url) => new URL(url).pathname === file(picks.card.src), how: '404', until: Infinity };
  const { ctx, page, errors } = await open([rule]);
  await page.evaluate(() => { const g = document.querySelector('#page-landing .tpl-card'); if (g) g.scrollIntoView({ block: 'center' }); });
  // by its picture, not its name: two cards may share a name in different colours
  const cardGone = (src) => { const mine = [...document.querySelectorAll('#page-landing .tpl-card')].filter((d) => d.querySelector('img').getAttribute('src') === src); return mine.length && mine.every((d) => getComputedStyle(d).display === 'none'); };
  await page.waitForFunction(cardGone, picks.card.src, { timeout: 25000 }).catch(() => {});
  const st = await page.evaluate((src) => {
    const cards = [...document.querySelectorAll('#page-landing .tpl-card')], mine = cards.filter((d) => d.querySelector('img').getAttribute('src') === src);
    return { mine: mine.length, gone: mine.filter((d) => getComputedStyle(d).display === 'none').length, standing: cards.filter((d) => getComputedStyle(d).display !== 'none').length, all: cards.length };
  }, picks.card.src);
  ok(st.mine >= 1 && st.gone === st.mine && rule.hits >= 3, `its card steps out of the grid after three asks ("${picks.card.name}")`, JSON.stringify({ ...st, asks: rule.hits }));
  ok(st.standing === st.all - st.mine, 'and every other card stays', JSON.stringify(st));
  ok(!(await inSight(page)).length, 'nothing broken was ever in sight', (await inSight(page)).join('; '));
  ok(!errors.length, 'no page errors', errors.join(' | '));
  await ctx.close();
}

await browser.close();
console.log(fails.length ? '\n' + fails.length + ' FAILED:\n  ' + fails.join('\n  ') : '\nall clear');
process.exit(fails.length ? 1 : 0);
