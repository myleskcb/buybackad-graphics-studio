#!/usr/bin/env node
/* THE FULL AD, MEASURED (motion/fullad.js FullAd, and its switch in the video maker).

   The owner, 2026-11-11: "I still don't see picture ads that look in line with the video ads",
   then "need to make sure we're maximize elements.. sizing.. spacing.. positioning.." and "also
   eye catchy elements". The full ad is laid out by rule, so it has to hold for any words a
   customer types, in every size, the first time. This draws it for a spread of words, phones,
   sizes and looks and fails when:

     elements     a block whose words were given is missing from the picture;
     sizing       a line is set under its floor (FULL in fullad.js), or the product stands under
                  15% of the height (30% on a wide frame) with ordinary words;
     spacing      two blocks overlap or stand nearer than the gap, or a block is inside the margin;
     positioning  the words are off their axis (every block's middle on the column's middle);
     eye-catchers an ad with ordinary words has no sticker and no chevrons;
     contrast     a line added to the ground reads under 3.5:1 on the ground drawn under it.

   "Ordinary words" are the lengths the maker's own lists hold. Longer ones (a 44-letter headline,
   three long towns) may cost the product its size or set the headline small; the page says so to
   the customer (syncFull in motion/app.js), and here that is reported, not failed. An overlap or
   a block off the frame fails whatever the words.

   Then every other product the full ad can be about (motion/subjects.json, the offer family's
   35 lines): each drawn in every size with the words its line brings, held to the same rules,
   and its pictures to standing off their ground.

   Then the page: the maker opens on the full ad, its fields redraw it, Any look brings the old
   panel back, the photo downloads at 1440, nothing scrolls sideways at 390, no page error.

   usage:  python3 -m http.server 8931   (in the repo), then
           [GFX_BASE=http://127.0.0.1:8931/] [SEEDS=6] [SHEET=dir] node scripts/full_ad_check.mjs
   Exits non-zero on a failure. SHEET=dir also writes sheet.jpg, one ad per case. */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8931/').replace(/\/?$/, '/');
const SEEDS = +(process.env.SEEDS || 6), SHEET = process.env.SHEET || '';

const WORDS = {
  ordinary: { headline: 'SELL YOUR IPHONE', tag: 'IPHONE 15 – 18 PRO MAX', feed_claim: 'TOP DOLLAR • FAST CASH', points: 'TEXT YOUR IMEI, CASH SAME DAY, NO FEES', number_label: 'CALL OR TEXT', feed_where: 'LONG BEACH • LAKEWOOD • DOWNEY', site: 'www.YourShop.com' },
  short: { headline: 'WE BUY IPHONES', tag: 'ALL MODELS WANTED', feed_claim: 'TOP DOLLAR PAID', points: 'FREE QUOTE, PAID TODAY, NO FEES', number_label: 'TEXT US NOW', feed_where: 'LA', site: 'iPhones.LA' },
  spanish: { headline: 'COMPRAMOS TU IPHONE', tag: 'TODOS LOS MODELOS', feed_claim: 'COMPRADOR LOCAL • PAGO HOY', points: 'COTIZACIÓN GRATIS, PAGO EN EFECTIVO, SIN COMISIONES', number_label: 'LLAMA O MANDA TEXTO', feed_where: 'LONG BEACH • LAKEWOOD • DOWNEY', site: 'www.TuTienda.com', lang: 'es' },
  defaults: { headline: 'CASH FOR IPHONES' },                                  // everything else left for fullStyle to fill
  long: { headline: 'TURN YOUR OLD CRACKED IPHONE INTO CASH TODAY', tag: 'TEXT YOUR IMEI → FIRM QUOTE → GET PAID', feed_claim: 'ALWAYS AVAILABLE • QUICK REPLIES', points: 'NO OBLIGATION, FAIR & HONEST, LOCAL MEETUP', number_label: 'TEXT FOR A QUOTE', feed_where: 'HUNTINGTON BEACH • FOUNTAIN VALLEY • COSTA MESA', site: 'www.a-rather-long-shop-name.com' },
};
const LENIENT = new Set(['long']);                  // where a small headline or a small product is said, not failed
const ASPECTS = ['1:1', '4:5', '9:16', '16:9'];

const browser = await chromium.launch();
const failures = [], notes = [];
const fail = m => { failures.push(m); console.log('  FAIL ' + m); };

/* ---------- 1. the ad itself, drawn by the engine ---------- */
{
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.goto(BASE + 'motion/', { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => document.getElementById('loading').hidden, null, { timeout: 120000 });
  const out = await page.evaluate(async ({ WORDS, ASPECTS, SEEDS, wantSheet }) => {
    const E = await import('/motion/engine.js'), C = await import('/motion/catalog.js'), A = await import('/motion/accents.js'), F = await import('/motion/fullad.js');
    const { phones, index } = await E.loadPhones('/motion/phones/');
    const assets = { phones, index, accents: await A.loadAccents('/assets/cutouts/') };
    const models = [...new Set(index.map(m => m.model))].filter(m => /^iPhone 1[5-8]/.test(m));
    const lin = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
    const lumOf = h => { const [r, g, b] = [1, 3, 5].map(i => lin(parseInt(h.slice(i, i + 2), 16))); return .2126 * r + .7152 * g + .0722 * b; };
    const rows = [], sheet = [];
    let n = 0;
    for (const [name, words] of Object.entries(WORDS)) for (const aspect of ASPECTS) for (let s = 0; s < SEEDS; s++) {
      const seed = 9001 + n++ * 7919, model = models[n % models.length];
      const ids = index.filter(m => m.model === model).map(m => m.id), count = [3, 2, 1, 3, 2][s % 5];
      const st = F.fullStyle({ ...C.DEFAULT_STYLE, ...words, number: '(562) 999-4994', aspect, phones: ids.slice(0, count) }, seed, index);
      await E.loadFonts([...E.fontsFor(st), 'franklin']);
      const [W0, H0] = E.ASPECTS[aspect], k = 1080 / Math.min(W0, H0);
      const ad = new F.FullAd(st, assets, Math.round(W0 * k), Math.round(H0 * k));
      const why = F.fullBlockers(ad), m = F.fullMeasure(ad), R = ad.full.rects, col = ad.full.col, mid = (col[0] + col[1]) / 2;
      // every block whose words were given is on the picture
      const want = { claim: st.feed_claim, line: st.feed_line, 'call to action': st.number_label, footer: st.feed_where || st.feed_site, 'selling points': st.points, product: st.phones.length };
      const missing = Object.entries(want).filter(([b, v]) => v && !R[b]).map(([b]) => b);
      // one axis: the words' blocks centred on the column
      const offAxis = ['claim', 'headline', 'line', 'call to action', 'number', 'footer'].filter(b => R[b] && Math.abs((R[b][0] + R[b][2]) / 2 - mid) > ad.W * .004);
      // the lines added to the ground, against the ground drawn under them: its brightest tenth
      // under light ink (darkest under dark) must still give 3.5:1
      const g = ad.bg.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, ad.W, ad.H).data, ink = ad.pHead.ink, light = lumOf(ink) >= .18;
      const contrast = {};
      for (const b of ['line', 'call to action', 'footer']) {
        const r = R[b]; if (!r) continue;
        const Ls = [];
        for (let y = Math.max(0, r[1] | 0); y < Math.min(ad.H, r[3]); y += 3) for (let x = Math.max(0, r[0] | 0); x < Math.min(ad.W, r[2]); x += 3) { const q = (y * ad.W + x) * 4; Ls.push(.2126 * lin(g[q]) + .7152 * lin(g[q + 1]) + .0722 * lin(g[q + 2])); }
        Ls.sort((a, c) => a - c);
        const worst = Ls[Math.min(Ls.length - 1, Math.floor(Ls.length * (light ? .9 : .1)))], L = lumOf(ink);
        contrast[b] = +((Math.max(L, worst) + .05) / (Math.min(L, worst) + .05)).toFixed(2);
      }
      rows.push({ name, aspect, seed, palette: st.palette, phones: st.phones.length, why, missing, offAxis, contrast, m });
      if (wantSheet && s === 0) {
        const c = E.canvas(ad.W, ad.H), t = Math.max(isFinite(ad.tl.number) ? ad.tl.number + 1.2 : 0, (ad.tLanded || 0) + .6, (ad.tOutro != null ? ad.tOutro : st.duration) - .4);
        ad.still = null; ad.frame(c.getContext('2d'), t, { subsFly: 8, subsMove: 4 }, 1 / 30);
        sheet.push([`${name} ${aspect}`, c.toDataURL('image/jpeg', .88), ad.W, ad.H]);
      }
    }
    return { rows, sheet };
  }, { WORDS, ASPECTS, SEEDS, wantSheet: !!SHEET });
  if (errors.length) fail('page errors while drawing: ' + errors.slice(0, 3).join(' | '));

  const hard = /overlap|px apart|inside the margin|left out|touch/;
  for (const r of out.rows) {
    const id = `${r.name} ${r.aspect} seed ${r.seed} (${r.palette}, ${r.phones} phone${r.phones === 1 ? '' : 's'})`;
    const lenient = LENIENT.has(r.name);
    if (r.missing.length) (lenient ? notes : failures).push(`${id}: missing ${r.missing.join(', ')}`), lenient || console.log(`  FAIL ${id}: missing ${r.missing.join(', ')}`);
    for (const w of r.why) {
      if (hard.test(w) && !(lenient && /left out/.test(w))) fail(`${id}: ${w}`);
      else if (lenient) notes.push(`${id}: ${w}`);
      else fail(`${id}: ${w}`);
    }
    if (r.offAxis.length) fail(`${id}: off the axis: ${r.offAxis.join(', ')}`);
    for (const [b, c] of Object.entries(r.contrast)) if (c < 3.5) fail(`${id}: ${b} reads ${c}:1 on its ground`);
    if (!lenient && r.phones && !r.m.sticker && !r.m.chevrons) fail(`${id}: no sticker and no chevrons`);
  }
  // what the set came to, by size
  const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
  console.log(`drew ${out.rows.length} full ads: ${Object.keys(WORDS).length} sets of words x ${ASPECTS.length} sizes x ${SEEDS} looks`);
  for (const a of ASPECTS) {
    const rs = out.rows.filter(r => r.aspect === a && !LENIENT.has(r.name)), wp = rs.filter(r => r.phones);
    console.log(`  ${a.padEnd(5)} headline ${med(rs.map(r => r.m.px.headline))}px  number ${med(rs.map(r => r.m.px.number))}px  smallest line ${Math.min(...rs.map(r => r.m.smallest))}px  product ${Math.round(med(wp.map(r => r.m.product)) * 100)}% of the height  sticker ${wp.filter(r => r.m.sticker).length}/${wp.length}  icon ${wp.filter(r => r.m.icon).length}/${wp.length}  chevrons ${rs.filter(r => r.m.chevrons).length}/${rs.length}  frame covered ${Math.round(med(rs.map(r => r.m.fill)) * 100)}%`);
  }
  if (notes.length) console.log(`  said to the customer, not failed (long words): ${notes.length}, e.g. ${notes[0]}`);
  if (SHEET && out.sheet.length) {
    mkdirSync(SHEET, { recursive: true });
    const url = await page.evaluate(async (items) => {
      const cell = 300, lab = 20, cols = 4, hs = items.map(i => Math.round(cell * i[3] / i[2])), rowsN = Math.ceil(items.length / cols);
      const rowH = []; for (let r = 0; r < rowsN; r++) rowH.push(Math.max(...hs.slice(r * cols, r * cols + cols)) + lab);
      const c = document.createElement('canvas'); c.width = cols * cell; c.height = rowH.reduce((a, b) => a + b, 0);
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.font = 'bold 13px sans-serif';
      let y = 0;
      for (let i = 0; i < items.length; i++) {
        if (i && i % cols === 0) y += rowH[i / cols - 1];
        const img = new Image(); await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = items[i][1]; });
        x.fillStyle = '#111'; x.fillText(items[i][0], (i % cols) * cell + 4, y + 14); x.drawImage(img, (i % cols) * cell, y + lab, cell - 2, hs[i]);
      }
      return c.toDataURL('image/jpeg', .86);
    }, out.sheet);
    writeFileSync(SHEET.replace(/\/?$/, '/') + 'sheet.jpg', Buffer.from(url.split(',')[1], 'base64'));
    console.log('  wrote ' + SHEET.replace(/\/?$/, '/') + 'sheet.jpg');
  }
  await page.close();
}

/* ---------- 2. every other product ---------- */
{
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.goto(BASE + 'motion/', { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => document.getElementById('loading').hidden, null, { timeout: 120000 });
  const out = await page.evaluate(async ({ ASPECTS, wantSheet }) => {
    const E = await import('/motion/engine.js'), C = await import('/motion/catalog.js'), A = await import('/motion/accents.js'), F = await import('/motion/fullad.js');
    const { phones, index } = await E.loadPhones('/motion/phones/');
    const assets = { phones, index, accents: await A.loadAccents('/assets/cutouts/') };
    const subs = (await (await fetch('/motion/subjects.json', { cache: 'no-store' })).json()).subjects.filter(s => s.key !== 'iphone');
    const rows = [], sheet = [];
    let n = 0;
    for (const S of subs) for (const aspect of ASPECTS) {
      const setN = S.sets.length ? n % S.sets.length : 0, seed = 12001 + n++ * 6151;
      const got = await F.loadSubjectSet(S, setN, '/assets/cutouts/'); Object.assign(assets.phones, got.assets);
      const st = F.fullStyle({ ...C.DEFAULT_STYLE, subject: S.key, phones: got.ids.length ? got.ids : ['none'], headline: S.heads[n % S.heads.length].toUpperCase(), tag: S.models.toUpperCase(), points: S.points,
        number: '(562) 999-4994', aspect, feed_where: 'LONG BEACH • LAKEWOOD • DOWNEY', site: 'www.YourShop.com' }, seed, index);
      await E.loadFonts([...E.fontsFor(st), 'franklin']);
      const [W0, H0] = E.ASPECTS[aspect], k = 1080 / Math.min(W0, H0);
      const ad = new F.FullAd(st, assets, Math.round(W0 * k), Math.round(H0 * k));
      rows.push({ key: S.key, aspect, pictures: got.ids.length, drawn: ad.phones.length, why: F.fullBlockers(ad), m: F.fullMeasure(ad), voice: st.voice });
      if (wantSheet && aspect === '1:1') {
        const c = E.canvas(ad.W, ad.H), t = Math.max(isFinite(ad.tl.number) ? ad.tl.number + 1.2 : 0, (ad.tOutro != null ? ad.tOutro : st.duration) - .4);
        ad.still = null; ad.frame(c.getContext('2d'), t, { subsFly: 8, subsMove: 4 }, 1 / 30);
        const small = E.canvas(360, 360); small.getContext('2d').drawImage(c, 0, 0, 360, 360);
        sheet.push([S.key, small.toDataURL('image/jpeg', .86), 360, 360]);
      }
    }
    return { rows, sheet, lines: subs.length };
  }, { ASPECTS, wantSheet: !!SHEET });
  if (errors.length) fail('page errors while drawing the other products: ' + errors.slice(0, 3).join(' | '));
  // a models line is as long as the offer family wrote it: two rows of it may cost a square's product some height,
  // which is said to the customer; anything else fails
  const soft = /^product \d+% of the height$/;
  let softN = 0;
  for (const r of out.rows) {
    const id = `${r.key} ${r.aspect}`;
    if (r.pictures !== r.drawn) fail(`${id}: ${r.pictures} pictures, ${r.drawn} drawn`);
    if (r.voice !== 'off') fail(`${id}: a phone voice-over on an ad that is not about phones`);
    for (const w of r.why) { if (soft.test(w)) softN++; else fail(`${id}: ${w}`); }
    if (r.pictures && !r.m.sticker && !r.m.chevrons) fail(`${id}: no sticker and no chevrons`);
  }
  const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
  const wp = out.rows.filter(r => r.pictures);
  console.log(`drew ${out.rows.length} full ads for ${out.lines} other products (${new Set(wp.map(r => r.key)).size} with pictures): headline ${med(out.rows.map(r => r.m.px.headline))}px, product ${Math.round(med(wp.map(r => r.m.product)) * 100)}% of the height, sticker ${wp.filter(r => r.m.sticker).length}/${wp.length}` + (softN ? `; ${softN} with a small product, said to the customer` : ''));
  if (SHEET && out.sheet.length) {
    const url = await page.evaluate(async (items) => {
      const cell = 240, lab = 18, cols = 7, rowsN = Math.ceil(items.length / cols);
      const c = document.createElement('canvas'); c.width = cols * cell; c.height = rowsN * (cell + lab);
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.font = 'bold 12px sans-serif';
      for (let i = 0; i < items.length; i++) {
        const img = new Image(); await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = items[i][1]; });
        const cx = (i % cols) * cell, cy = Math.floor(i / cols) * (cell + lab);
        x.fillStyle = '#111'; x.fillText(items[i][0], cx + 4, cy + 13); x.drawImage(img, cx, cy + lab, cell - 2, cell - 2);
      }
      return c.toDataURL('image/jpeg', .86);
    }, out.sheet);
    writeFileSync(SHEET.replace(/\/?$/, '/') + 'subjects.jpg', Buffer.from(url.split(',')[1], 'base64'));
    console.log('  wrote ' + SHEET.replace(/\/?$/, '/') + 'subjects.jpg');
  }
  await page.close();
}

/* ---------- 3. the page ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, acceptDownloads: true });
  await ctx.addInitScript(() => { try { localStorage.setItem('pgfx_local_demo', '1'); } catch (e) { /* none */ } });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  const ok = (c, m) => { if (c) console.log('  ok   ' + m); else fail(m); };
  await page.goto(BASE + 'motion/', { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => document.getElementById('loading').hidden, null, { timeout: 120000 });
  const shown = id => page.evaluate(i => { const e = document.getElementById(i); return !!e && e.getClientRects().length > 0; }, id);
  ok(await page.evaluate(() => document.getElementById('main').dataset.full) === '1', 'the maker opens on the full ad');
  ok(await shown('f-claim') && await shown('f-towns') && await shown('f-site') && await shown('f-burst') && await shown('full-colours'), 'its fields are shown: claim, towns, website, sticker, colours');
  ok(!(await page.evaluate(() => [...document.querySelectorAll('#design select[data-key="palette"], #design select[data-key="text_fx"], #flags')].some(e => e.getClientRects().length))), 'the looks it does not use are put away');
  ok(await page.evaluate(() => !!document.querySelector('#design select[data-key="audience"]') && document.querySelector('#design select[data-key="audience"]').getClientRects().length > 0), 'who the ad is for stays');
  await page.fill('#f-number', '(562) 999-4994'); await page.fill('#f-headline', 'SELL YOUR IPHONE'); await page.fill('#f-towns', 'Long Beach • Lakewood • Downey'); await page.fill('#f-site', 'www.YourShop.com');
  await page.waitForTimeout(1500);
  ok((await page.textContent('#full-note')).trim() === '', 'ordinary words fit: the page has nothing to say (' + JSON.stringify((await page.textContent('#full-note')).trim()) + ')');
  // the photo: the full ad at 1440, by the button a customer presses
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 90000 }), page.click('#download-jpg')]);
  const file = dl.suggestedFilename(), path = await dl.path();
  const dim = await page.evaluate(async (b64) => { const img = new Image(); await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/jpeg;base64,' + b64; }); return [img.naturalWidth, img.naturalHeight]; }, (await import('node:fs')).readFileSync(path).toString('base64'));
  ok(/-photo-\d+x\d+\.jpg$/.test(file) && Math.min(...dim) >= 1080, `Download JPG saves the full ad (${file}, ${dim.join('x')})`);
  // a long headline: the page says what it cost
  await page.fill('#f-headline', 'TURN YOUR OLD CRACKED IPHONE INTO CASH TODAY RIGHT NOW'); await page.waitForTimeout(1500);
  const said = (await page.textContent('#full-note')).trim();
  ok(said === '' || /^[A-Z]/.test(said), 'a very long headline is drawn, and anything it cost is said plainly (' + JSON.stringify(said.slice(0, 90)) + ')');
  await page.fill('#f-headline', 'SELL YOUR IPHONE'); await page.waitForTimeout(900);
  // a colour picked by hand holds; Any look and back
  await page.click('#full-colours [data-colour="emerald"]'); await page.waitForTimeout(900);
  ok(await page.evaluate(() => document.querySelector('#full-colours [data-colour="emerald"]').getAttribute('aria-checked')) === 'true', 'a colour picked by hand is marked');
  await page.click('#mode [data-full="0"]'); await page.waitForTimeout(1500);
  ok(await page.evaluate(() => document.getElementById('main').dataset.full) === '0' && !(await shown('f-claim')) && await page.evaluate(() => document.querySelector('#design select[data-key="text_fx"]').closest('details').getClientRects().length > 0), 'Any look puts the full ad\'s fields away and brings the looks back');
  await page.click('#mode [data-full="1"]'); await page.waitForTimeout(1200);
  ok(await page.inputValue('#f-towns') !== '' && await page.inputValue('#f-site') === 'www.YourShop.com', 'back on the full ad, its words are as they were left');
  await page.reload({ waitUntil: 'load' }); await page.waitForFunction(() => document.getElementById('loading').hidden, null, { timeout: 60000 });
  ok(await page.inputValue('#f-site') === 'www.YourShop.com' && await page.evaluate(() => document.getElementById('main').dataset.full) === '1', 'a reload keeps the mode and the words');
  // another product: its words and pictures come with it, and what only a phone ad uses is put away
  await page.selectOption('#f-subject', 'gold'); await page.waitForTimeout(2200);
  ok(await page.inputValue('#f-headline') === 'WE BUY GOLD' && /GOLD/.test(await page.inputValue('#f-tag')) && !(await shown('quick')) && await page.inputValue('#f-number') === '(562) 999-4994', 'What you buy: Gold brings its headline and its line, keeps the number, and puts Quick ad and the phone picker away');
  const [dl2] = await Promise.all([page.waitForEvent('download', { timeout: 90000 }), page.click('#download-jpg')]);
  ok(/^we-buy-gold-.*-photo-\d+x\d+\.jpg$/.test(dl2.suggestedFilename()), `its photo downloads under its own name (${dl2.suggestedFilename()})`);
  await page.selectOption('#f-subject', 'iphone'); await page.waitForTimeout(1500);
  ok(await page.inputValue('#f-headline') === 'WE BUY IPHONES' && await shown('quick'), 'back to iPhones: the phone words and Quick ad return');
  await page.setViewportSize({ width: 390, height: 800 }); await page.waitForTimeout(900);
  const wide = await page.evaluate(() => document.documentElement.scrollWidth);
  ok(wide <= 391, `nothing scrolls sideways at 390 (${wide})`);
  ok(!errors.length, 'no page errors' + (errors.length ? ': ' + errors.slice(0, 2).join(' | ') : ''));
  await ctx.close();
}
await browser.close();
if (failures.length) { console.log(`\n${failures.length} failed`); process.exit(1); }
console.log('all clear');
