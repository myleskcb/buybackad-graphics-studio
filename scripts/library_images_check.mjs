#!/usr/bin/env node
/* THE LANDING'S LIBRARY, EVERY PICTURE (OPEN-ITEMS §BK 19).

   The owner, 2026-11-19, of a preview whose library showed six cards and then only their names
   ("Volt Stack template", "Trucks · Photo band template"): "I think as we started to make changes
   something happened and now it's not loading properly". A library whose list and pictures come
   from different trees fails a visitor this way and fails no other check, so this one opens the
   landing's library in every category and in every line inside it, presses "Show more" until the
   list ends, and loads every card's picture.

   It fails on:
     - a picture that does not load (an answer of 400 or more, or an image the browser cannot draw);
     - a count that is not the cards shown ("Showing N of N" once the list is open to its end);
     - a category or a line that shows no card at all.

   usage:  GFX_BASE=http://127.0.0.1:8899/ node scripts/library_images_check.mjs [--only cars,gold] [--json]
           exits 1 on any failure */
import { createRequire } from 'node:module';

const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8899/').replace(/\/?$/, '/');
const arg = (k) => { const a = process.argv.find(x => x.startsWith(k + '=')); if (a) return a.slice(k.length + 1); const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const only = arg('--only') ? arg('--only').split(',') : null;
const require = createRequire(import.meta.url), { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const answers = new Map();   // url -> status, for every picture the page asked for
page.on('response', (r) => { if (/\.(webp|jpe?g|png|avif)(\?|$)/i.test(r.url())) answers.set(r.url(), r.status()); });
page.on('requestfailed', (r) => { if (/\.(webp|jpe?g|png|avif)(\?|$)/i.test(r.url())) answers.set(r.url(), 'failed: ' + (r.failure() || {}).errorText); });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));

await page.goto(BASE, { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => document.querySelectorAll('#lp-chips .chip').length > 1, null, { timeout: 120000 });

const chips = (sel) => page.evaluate((s) => [...document.querySelectorAll(s)].map((c) => ({ key: c.dataset.cat || c.dataset.line, label: c.textContent.trim() })), sel);
const click = (sel, key, attr) => page.evaluate(([s, k, a]) => { const b = [...document.querySelectorAll(s)].find((c) => c.dataset[a] === k); if (b) b.click(); return !!b; }, [sel, key, attr]);

/* open the list to its end, load every picture in it, and read what the grid shows */
async function sweep() {
  for (let i = 0; i < 1000; i++) {
    const more = await page.$('#lp-tpl-more');
    if (!more || !(await more.isVisible())) break;
    await more.click();
  }
  await page.evaluate(() => { for (const i of document.querySelectorAll('#lp-tpl-grid img')) i.loading = 'eager'; });
  await page.waitForFunction(() => [...document.querySelectorAll('#lp-tpl-grid img')].every((i) => i.complete), null, { timeout: 180000 }).catch(() => {});
  return page.evaluate(() => {
    const grid = document.getElementById('lp-tpl-grid');
    const imgs = [...grid.querySelectorAll('img')];
    return {
      cards: grid.children.length,
      count: (document.getElementById('lp-tpl-count') || {}).textContent || '',
      broken: imgs.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => ({ name: (i.alt || '').replace(/ template$/, ''), src: i.currentSrc || i.getAttribute('src') || '' })),
    };
  });
}

const bad = [], rows = [];
const cats = (await chips('#lp-chips .chip')).filter((c) => !only || only.includes(c.key));
for (const cat of cats) {
  await click('#lp-chips .chip', cat.key, 'cat');
  await page.waitForTimeout(200);
  const lines = await chips('#lp-subchips:not([hidden]) .chip');
  const views = [{ line: null }].concat(lines.filter((l) => l.key && l.key !== 'all').map((l) => ({ line: l.key, label: l.label })));
  for (const v of views) {
    if (v.line) { await click('#lp-subchips .chip', v.line, 'line'); await page.waitForTimeout(150); }
    const r = await sweep();
    const where = cat.key + (v.line ? ' / ' + v.line : '');
    const m = /Showing (\d+) of (\d+)/.exec(r.count);
    if (!r.cards) bad.push(`${where}: no card shown`);
    if (!m || +m[1] !== +m[2] || +m[1] !== r.cards) bad.push(`${where}: the count says "${r.count}" with ${r.cards} cards shown`);
    for (const x of r.broken) bad.push(`${where}: "${x.name}" did not load (${answers.get(x.src) ?? 'no answer'}) ${x.src.replace(BASE, '')}`);
    rows.push({ where, cards: r.cards, broken: r.broken.length });
  }
}
for (const [url, st] of answers) if (typeof st !== 'number' || st >= 400) bad.push(`answered ${st}: ${url.replace(BASE, '')}`);
for (const e of pageErrors) bad.push('page error: ' + e);
await browser.close();

const uniq = [...new Set(bad)];
if (process.argv.includes('--json')) console.log(JSON.stringify({ rows, pictures: answers.size, failures: uniq }, null, 1));
else {
  for (const r of rows) console.log(`  ${r.where.padEnd(28)} ${String(r.cards).padStart(5)} cards${r.broken ? `, ${r.broken} broken` : ''}`);
  console.log(uniq.length ? 'FAIL\n  ' + uniq.slice(0, 60).join('\n  ') + (uniq.length > 60 ? `\n  ... and ${uniq.length - 60} more` : '')
    : `the library holds: ${rows.length} views (every category and line) opened to the end, ${answers.size} pictures, every one loaded`);
}
process.exit(uniq.length ? 1 : 0);
