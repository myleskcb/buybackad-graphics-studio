#!/usr/bin/env node
/* EASY MODE'S STRIP OFFERS THE REBUILT LOOKS, NEVER THE OLD RENDERINGS (DESIGN-LAW 155).

   The owner, 2026-11-19, through the roadmap session, of Easy Mode's "1 Pick a look" strip for Phones &
   Devices, which still offered the designer layouts as the old editor drew them (Deal Checklist,
   Glassline, Arctic Band, Three Steps, Price Point, Stub Mono): "now it's not loading properly or it's
   even worse showing me bad ad styles". The strip now offers the full ad's own card and, for each
   designer layout, its rebuilt ad (full-ad-studio.js strip()). This walks the strip in every category
   and fails when:

     the strip    a card is anything but the full ad's own or a rebuilt layout of the category (a
                  template's id is an old rendering offered); a rebuilt layout of the category is
                  missing; a card's picture is not its still from assets/layout-stills/, or does not load;
                  a layout has no still (scripts/build_recipe_stills.mjs --layouts);
     a card       tapped, it does not open its rebuilt ad in the full ad, marked in the strip, with the
                  old preview put away; the file it downloads is not the picture the preview showed
                  (rule 141, compared as full_ad_studio_check does); the full ad's own card does not
                  bring the visitor's own ad back;
     by name      a layout asked for by name (a link, the last design) opens anything but its rebuilt
                  ad; one with no rebuilt ad, or any other design, opens anything but the full ad; a
                  category changed in Easy Mode opens its first template in place of the full ad;
     the locks    a free visitor sees a PRO tag on a Phones layout or on a category's first three, or
                  none on a premium layout past them, or a locked one opens;
     the page     any page error.

   usage:  python3 -m http.server 8899   (in the repo), then
           [GFX_BASE=http://127.0.0.1:8899/] [PLAYWRIGHT_MODULE=...] node scripts/ez_strip_check.mjs
   Exits 1 on a failure. */
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const ROOT = new URL('../', import.meta.url).pathname;
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8899/').replace(/\/?$/, '/');
const CSP = (readFileSync(ROOT + 'netlify.toml', 'utf8').match(/Content-Security-Policy = "([^"]+)"/) || [])[1] || '';
const fails = [], ok = (cond, what, more = '') => { console.log((cond ? '  ok   ' : '  FAIL ') + what + (more && !cond ? ': ' + more : '')); if (!cond) fails.push(what); };

/* ---------- the stills, on disk ---------- */
const recipes = JSON.parse(readFileSync(ROOT + 'motion/recipes.json', 'utf8')).recipes, layouts = recipes.filter(r => r.gen === 'dl');
const stills = existsSync(ROOT + 'assets/layout-stills/index.json') ? JSON.parse(readFileSync(ROOT + 'assets/layout-stills/index.json', 'utf8')).items || {} : {};
const noStill = layouts.filter(r => !stills[r.id] || !existsSync(ROOT + 'assets/layout-stills/' + r.id + '.webp')).map(r => r.id);
console.log('the rebuilt layouts');
ok(layouts.length > 0 && !noStill.length, `every rebuilt designer layout has its still (${layouts.length - noStill.length} of ${layouts.length})`, noStill.slice(0, 4).join(', '));

/* ---------- the page ---------- */
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 }), page = await ctx.newPage(), errors = [];
page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
const origin = new URL(BASE).origin;
await page.route('**/*', async route => {
  const req = route.request(), url = req.url();
  // each page goes out under the site's own policy, as production sends it
  if (CSP && req.resourceType() === 'document' && url.startsWith(origin)) { const resp = await route.fetch(); return route.fulfill({ response: resp, headers: { ...resp.headers(), 'content-security-policy': CSP } }); }
  return route.continue();
});
await page.goto(BASE + '?demo=1', { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => typeof showEasy === 'function' && typeof TEMPLATES !== 'undefined' && !!window.FullAdStudio, null, { timeout: 90000 });
await page.evaluate(() => {
  account = { email: 'audit@local', role: 'admin', plan: 'pro' }; loadAccount = async () => account; recordExport = async () => true;
  try { localStorage.setItem('pgfx_area_asked', 'true'); } catch (e) { /* asked already */ }
  window.__dl = []; const click = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () { if (this.download && this.href) { window.__dl.push({ name: this.download, href: this.href }); return; } return click.apply(this, arguments); };
  document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
  showEasy();
});
await page.evaluate(() => FullAdStudio.recipes());
const settle = () => page.waitForFunction(() => { const i = document.getElementById('fa-preview'); return !!i && i.getAttribute('aria-busy') === 'false' && i.complete && i.naturalWidth > 0; }, null, { timeout: 30000 }).then(() => true, () => false);
const read = () => page.evaluate(() => ({ on: FullAdStudio.isOn(), cat: currentCat, recipe: FullAdStudio.state.recipe[currentCat] || '', sel: [...document.querySelectorAll('#ez-strip .ez-tpl.sel')].map(b => b.dataset.tpl),
  oldPreview: getComputedStyle(document.getElementById('ez-preview')).display }));

/* every category Easy Mode offers: each card is the full ad's own or a rebuilt layout of the category, from its still */
console.log('the strip, in every category');
const cats = await page.evaluate(() => [...new Set([...TEMPLATES.map(t => t.cat), ...FullAdStudio.lines().map(s => s.cat)])]);
let cards = 0, layoutCards = 0;
for (const cat of cats) {
  const got = await page.evaluate(async cat => {
    setCategory(cat); buildEzStrip(); await new Promise(r => setTimeout(r, 250));
    const imgs = [...document.querySelectorAll('#ez-strip .ez-layout img')];
    await Promise.all(imgs.map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 8000); })));
    const byId = Object.fromEntries((await FullAdStudio.recipes()).map(r => [r.id, r]));
    const want = Object.values(byId).filter(r => r.gen === 'dl' && r.cat === cat).map(r => r.id).sort();
    const tiles = [...document.querySelectorAll('#ez-strip .ez-tpl')].map(b => ({ tpl: b.dataset.tpl, full: b.classList.contains('ez-fulltile'), src: (b.querySelector('img') || {}).getAttribute ? b.querySelector('img').getAttribute('src') || '' : '', w: (b.querySelector('img') || {}).naturalWidth || 0 }));
    const old = tiles.filter(t => !t.full && !/^recipe:/.test(t.tpl)).map(t => t.tpl);
    const stray = tiles.filter(t => /^recipe:/.test(t.tpl)).map(t => t.tpl.slice(7)).filter(id => !byId[id] || byId[id].gen !== 'dl' || byId[id].cat !== cat);
    const offered = tiles.filter(t => /^recipe:/.test(t.tpl)).map(t => t.tpl.slice(7)).sort();
    const badPic = tiles.filter(t => /^recipe:/.test(t.tpl) && (!t.src.includes('assets/layout-stills/' + t.tpl.slice(7) + '.webp') || !t.w)).map(t => t.tpl.slice(7));
    return { n: tiles.length, full: tiles.filter(t => t.full).length, old, stray, missing: want.filter(id => !offered.includes(id)), badPic, layouts: offered.length };
  }, cat);
  cards += got.n; layoutCards += got.layouts;
  ok(got.full === 1 && !got.old.length && !got.stray.length && !got.missing.length && !got.badPic.length,
    `${cat}: the full ad's card and ${got.layouts} rebuilt layout${got.layouts === 1 ? '' : 's'}, each from its still, and no old rendering`,
    JSON.stringify({ full: got.full, old: got.old.slice(0, 3), stray: got.stray.slice(0, 3), missing: got.missing.slice(0, 3), badPicture: got.badPic.slice(0, 3) }));
}
ok(layoutCards === layouts.length, `the strips offer every rebuilt layout once (${layoutCards} of ${layouts.length}, ${cards} cards in all)`);

/* a card tapped opens its rebuilt ad in the full ad, and the file is the picture the preview showed */
console.log('a card, tapped');
await page.evaluate(() => { setCategory('phones'); buildEzStrip(); });
await page.waitForTimeout(300);
const first = await page.evaluate(() => (document.querySelector('#ez-strip .ez-layout') || {}).dataset ? document.querySelector('#ez-strip .ez-layout').dataset.tpl : '');
await page.evaluate(() => { const p = document.getElementById('ez-phone'); p.value = '(562) 555-0142'; p.dispatchEvent(new Event('input', { bubbles: true })); });
await page.click(`#ez-strip .ez-tpl[data-tpl="${first}"]`);
await page.waitForFunction(id => FullAdStudio.state.recipe[currentCat] === id, first.slice(7), { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(400); const drew = await settle();
const t = await read();
ok(drew && t.on && t.recipe === first.slice(7) && t.sel.join() === first && t.oldPreview === 'none', `a layout tapped opens its rebuilt ad in the full ad, marked in the strip, the old preview put away (${first.slice(7)})`, JSON.stringify(t));
const preview = await page.evaluate(() => document.getElementById('fa-preview').src);
const dl = await page.evaluate(async () => { window.__dl.length = 0; document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show')); await ezDownload(); return window.__dl[0] || null; });
const diff = !dl ? 999 : await page.evaluate(async ([a, b]) => {
  const small = async url => { const bmp = await createImageBitmap(await (await fetch(url)).blob());
    let c = document.createElement('canvas'); c.width = c.height = 768; let g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(bmp, 0, 0, 768, 768);
    for (let k = 0; k < 4; k++) { const n = document.createElement('canvas'); n.width = n.height = c.width / 2; g = n.getContext('2d', { willReadFrequently: true }); g.imageSmoothingQuality = 'high'; g.drawImage(c, 0, 0, n.width, n.height); c = n; }
    return c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, 48, 48).data; };
  const [p, q] = await Promise.all([small(a), small(b)]); let d = 0;
  for (let k = 0; k < p.length; k += 4) d += Math.abs(p[k] - q[k]) + Math.abs(p[k + 1] - q[k + 1]) + Math.abs(p[k + 2] - q[k + 2]);
  return +(d / (48 * 48 * 3)).toFixed(2);
}, [preview, dl.href]);
ok(!!dl && diff <= 4, `its download is the picture the preview showed (${diff} a channel of 255${dl ? '; ' + dl.name : ''})`, dl ? diff + ' > 4' : 'no file');
await page.click('#ez-strip .ez-fulltile');
await page.waitForFunction(() => !FullAdStudio.state.recipe[currentCat], null, { timeout: 20000 }).catch(() => {});
await settle(); const b = await read();
ok(b.on && !b.recipe && b.sel.join() === 'full' && b.oldPreview === 'none', "the full ad's own card brings the visitor's own ad back", JSON.stringify(b));

/* by name: a layout opens its rebuilt ad; one with none, or any other design, the full ad */
console.log('by name');
const names = await page.evaluate(async () => {
  const byId = Object.fromEntries((await FullAdStudio.recipes()).map(r => [r.id, r]));
  const dl = TEMPLATES.filter(t => /^dl_/.test(t.id));
  return { rebuilt: (dl.find(t => byId['r-' + t.id] && t.cat === 'phones') || dl.find(t => byId['r-' + t.id]) || {}).id || '', none: (dl.find(t => !byId['r-' + t.id]) || {}).id || '',
    other: (TEMPLATES.find(t => !/^dl_/.test(t.id)) || {}).id || '' };
});
if (names.rebuilt) {
  await page.evaluate(id => showEasy(id), names.rebuilt);
  await page.waitForFunction(id => FullAdStudio.state.recipe[currentCat] === 'r-' + id, names.rebuilt, { timeout: 20000 }).catch(() => {});
  const s = await read();
  ok(s.on && s.recipe === 'r-' + names.rebuilt && s.oldPreview === 'none', `a layout asked for by name opens its rebuilt ad (${names.rebuilt})`, JSON.stringify(s));
}
for (const id of [names.none, names.other].filter(Boolean)) {
  await page.evaluate(id => showEasy(id), id); await page.waitForTimeout(1200);
  const s = await read();
  ok(s.on && !s.recipe.startsWith('r-dl_') && s.oldPreview === 'none' && s.sel.join() === 'full', `${id} asked for by name opens the full ad, not its old rendering`, JSON.stringify(s));
}
// a category changed in Easy Mode keeps the full ad: its first template is never opened in its place
for (const cat of ['gold', 'cars', 'phones']) {
  await page.evaluate(cat => { const sel = document.querySelector('#page-easy .cat-select') || document.querySelector('.cat-select'); if (sel) { sel.value = cat; sel.dispatchEvent(new Event('change', { bubbles: true })); } else setCategory(cat); }, cat);
  await page.waitForTimeout(900);
  const c = await read();
  ok(c.cat === cat && c.on && c.oldPreview === 'none', `a category changed to ${cat} keeps the full ad, not its first template`, JSON.stringify(c));
}

/* the locks: as a signed-out visitor, a layout keeps its own lock */
console.log('the locks, signed out');
const lk = await page.evaluate(async () => {
  account = null; const out = {};
  for (const cat of ['phones', 'gold', 'cars']) {
    setCategory(cat); buildEzStrip(); await new Promise(r => setTimeout(r, 200)); refreshTplLocks();
    out[cat] = [...document.querySelectorAll('#ez-strip .ez-layout')].map(b => b.classList.contains('locked') ? 1 : 0);
  }
  const lockedOne = document.querySelector('#ez-strip .ez-layout.locked');
  let opened = null;
  if (lockedOne) { const before = FullAdStudio.state.recipe[currentCat] || ''; lockedOne.click(); await new Promise(r => setTimeout(r, 900)); opened = (FullAdStudio.state.recipe[currentCat] || '') !== before; document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show')); }
  account = { email: 'audit@local', role: 'admin', plan: 'pro' };
  return { ...out, opened };
});
ok(!lk.phones.some(Boolean), `every Phones layout is free (${lk.phones.length})`, JSON.stringify(lk.phones));
const firstThree = c => (lk[c] || []).slice(0, 3).every(x => !x) && (lk[c] || []).slice(3).every(x => x);
ok(firstThree('gold') && firstThree('cars'), 'elsewhere the first three are free and the rest wear PRO, as the layouts did', JSON.stringify({ gold: lk.gold, cars: lk.cars }));
ok(lk.opened === false, 'a locked layout tapped does not open', String(lk.opened));

ok(!errors.length, 'no page errors', errors.slice(0, 2).join(' | '));
await browser.close();
console.log(fails.length ? `\nez strip: ${fails.length} failed` : '\nez strip: the strip offers the full ad and the rebuilt layouts, never an old rendering');
process.exit(fails.length ? 1 : 0);
