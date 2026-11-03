#!/usr/bin/env node
/* THE AREA DIALOG, CHECKED (app.js "── the ask ──", index.html #area-overlay).

   2026-11-03, owner: "these buttons do nothing, i can't configure anything".
   The dialog's pills were <span>s. This walks every control in Chromium the
   way a customer would and reads back what the ads will print:

   1. Typing a city opens the editor; the buyer's town leads the line; every
      pill is a <button>.
   2. Tap a town: it comes off the line, the line and the Reset link follow.
      Tap a nearby town: it goes on the end. The arrow keys move a town; a
      drag moves it; a drag does not take it off. "Add another town" finds a
      town by name near the area. Reset brings the suggestion back.
   3. Eight towns at most: the nearby pills disable, the meter leaves green.
   4. Save writes the line (areaLine = the towns, in order) and the cards
      print it; "Not now" leaves the saved area as it was.
   5. An area saved before this change (no nearby list) gets one on open.
   6. A ZIP resolves; the card open in Easy Mode, when it carries the line, is
      shown cropped to it; no page errors and no CSP refusals under the
      production policy; nothing scrolls sideways at 390px.

   --measure re-takes the meter's two marks (AREA_FIT in app.js): every live
   card that carries the line, drawn in Easy Mode with the line a town longer
   at a time, and the width (x the library's own line) at which cards start
   to print it smaller.

   usage:  node scripts/area_dialog_check.mjs [--measure]
           FABRIC_JS=/path/fabric.min.js when cdnjs is out of reach,
           SHOT_DIR=/folder keeps screenshots, CHROME=/path picks the browser.
   exits non-zero on any failure */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join, extname, normalize } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MEASURE = process.argv.includes('--measure');
const SHOT = process.env.SHOT_DIR || '';
if (SHOT) mkdirSync(SHOT, { recursive: true });
const bad = [];
let passed = 0;
const ok = (cond, what) => { if (cond) passed++; else bad.push(what); return cond; };

/* the folder is the site: a plain static server on a free port, under the
   production CSP (_headers), so a control that needs an inline style or
   script would fail here as it would live */
const CSP = (readFileSync(join(ROOT, '_headers'), 'utf8').match(/Content-Security-Policy:\s*(.+)/) || [])[1];
const TYPES = { '.html':'text/html', '.js':'application/javascript', '.mjs':'application/javascript', '.css':'text/css', '.json':'application/json',
  '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.woff2':'font/woff2', '.mp3':'audio/mpeg' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = normalize(join(ROOT, p));
  if (!f.startsWith(ROOT) || !existsSync(f) || !statSync(f).isFile()){ res.writeHead(404); return res.end(); }
  const type = TYPES[extname(f).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, Object.assign({ 'Content-Type': type }, CSP && type === 'text/html' ? { 'Content-Security-Policy': CSP } : {}));
  res.end(readFileSync(f));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;

let chromium;
try { ({ chromium } = await import('playwright')); }
catch (e){
  try { const g = execSync('npm root -g').toString().trim(); ({ chromium } = await import(pathToFileURL(join(g, 'playwright/index.mjs')).href)); }
  catch (e2){ console.log('area_dialog_check: no playwright'); server.close(); process.exit(2); }
}
const fabricJs = process.env.FABRIC_JS ? readFileSync(process.env.FABRIC_JS) : null;
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
const errors = [];
async function studio(width, setup){
  const ctx = await browser.newContext({ viewport: { width, height: width < 600 ? 800 : 900 } });
  const page = await ctx.newPage();
  await page.route('**/*', route => {
    const url = route.request().url();
    if (url.startsWith(BASE) || url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
    if (fabricJs && /fabric(\.min)?\.js/.test(url)) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fabricJs });
    if (/cdnjs\.cloudflare\.com\/ajax\/libs\/fabric/.test(url)) return route.continue();
    return route.abort();
  });
  page.on('pageerror', e => errors.push(width + 'px: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && /Content Security Policy|Refused to/.test(m.text())) errors.push(width + 'px CSP: ' + m.text().slice(0, 200)); });
  await page.goto(BASE + '/index.html');
  await page.waitForFunction(() => typeof window.showEasy === 'function' && typeof openAreaDialog === 'function' && window.fabric, null, { timeout: 30000 });
  await page.evaluate(s => { localStorage.setItem('pgfx_area_asked', 'true'); if (s) localStorage.setItem('pgfx_brand', JSON.stringify(s)); showEasy(); }, setup || null);
  await page.waitForTimeout(800);
  return { page, ctx };
}
const state = page => page.evaluate(() => ({
  open: $('area-overlay').classList.contains('show'),
  editor: !$('area-edit').hidden,
  on: [...document.querySelectorAll('#area-on .area-tok')].map(b => b.textContent.replace(/^\d+/, '').replace(/your town/, '').replace(/×$/, '').trim()),
  near: [...document.querySelectorAll('#area-near .area-near-opt')].map(b => ({ t: b.dataset.town, dis: b.disabled })),
  line: document.querySelector('#area-line .area-line-text').textContent,
  reset: !$('area-reset').hidden,
  fit: $('area-fit').className.replace('area-fit', '').trim(),
  save: !$('area-save').disabled,
  spans: document.querySelectorAll('#area-edit .area-chips > :not(button)').length,
  saved: (JSON.parse(localStorage.getItem('pgfx_brand') || '{}').area) || null,
}));
const lineOf = names => names.map(n => n.toUpperCase()).join(' · ');

try {
  /* ---------- 1-4: desktop ---------- */
  const { page, ctx } = await studio(1280);
  await page.evaluate(() => openAreaDialog());
  await page.fill('#area-input', 'Long Beach, CA');
  await page.waitForFunction(() => !$('area-edit').hidden && document.querySelectorAll('#area-on .area-tok').length, null, { timeout: 15000 });
  let s = await state(page);
  ok(s.editor && s.save, '1: typing a city opens the editor and enables Save');
  ok(s.on[0] === 'Long Beach', '1: the buyer\'s town leads the line (got ' + s.on[0] + ')');
  ok(s.on.length === 5, '1: five towns suggested (got ' + s.on.length + ')');
  ok(s.line === lineOf(s.on), '1: the line is the towns in order');
  ok(s.spans === 0 && (await page.$$eval('#area-edit .area-chips > *', els => els.every(e => e.tagName === 'BUTTON'))), '1: every pill is a button');
  ok(s.near.length >= 6, '1: nearby towns offered (' + s.near.length + ')');
  ok(!s.reset, '1: no Reset before an edit');
  ok(s.fit === 'good', '1: the suggested line fits at full size (' + s.fit + ')');
  if (SHOT) await page.locator('#area-overlay .modal').screenshot({ path: join(SHOT, 'area-1-suggested.png') });
  const auto = s.on.slice();

  await page.click('#area-on .area-tok[data-i="1"]');
  s = await state(page);
  ok(s.on.length === 4 && s.on.indexOf(auto[1]) === -1, '2: tapping a town takes it off');
  ok(s.line === lineOf(s.on), '2: the line follows');
  ok(s.reset, '2: Reset shows after an edit');
  ok(s.near.some(n => n.t.split(',')[0] === auto[1]), '2: the town taken off is offered again');

  const add = s.near[0].t;
  await page.click('#area-near .area-near-opt[data-town="' + add + '"]');
  s = await state(page);
  ok(s.on[s.on.length - 1] === add.split(',')[0], '2: tapping a nearby town puts it on the end');

  await page.focus('#area-on .area-tok[data-i="0"]');
  await page.keyboard.press('ArrowRight');
  let s2 = await state(page);
  ok(s2.on[1] === s.on[0] && s2.on[0] === s.on[1], '2: ArrowRight moves a town one place on');
  ok(await page.evaluate(() => document.activeElement && document.activeElement.dataset.i === '1'), '2: the moved town keeps the focus');

  const a = await page.locator('#area-on .area-tok[data-i="0"]').boundingBox();
  const z = await page.locator('#area-on .area-tok[data-i="' + (s2.on.length - 1) + '"]').boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2 + 20, a.y + a.height / 2 + 4, { steps: 3 });
  await page.mouse.move(z.x + z.width * 0.85, z.y + z.height / 2, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(50);
  const s3 = await state(page);
  ok(s3.on.length === s2.on.length, '2: a drag does not take a town off');
  ok(s3.on[s3.on.length - 1] === s2.on[0], '2: dragging the first town past the last puts it last (got ' + s3.on.join(', ') + ')');
  ok(await page.evaluate(() => $('area-overlay').classList.contains('show')), '2: a drag does not close the dialog');

  await page.fill('#area-add', 'Signal');
  await page.waitForSelector('#area-add-suggest .area-opt', { timeout: 5000 });
  const opt = await page.textContent('#area-add-suggest .area-opt');
  ok(/Signal Hill, CA/.test(opt) && / mi/.test(opt), '2: "Add another town" finds Signal Hill near Long Beach, with its distance (' + opt + ')');
  await page.keyboard.press('Enter');
  s = await state(page);
  ok(s.on[s.on.length - 1] === 'Signal Hill', '2: Enter adds the first match');
  ok(await page.inputValue('#area-add') === '', '2: the search clears');

  await page.click('#area-reset');
  s = await state(page);
  ok(s.on.join('|') === auto.join('|') && !s.reset, '2: Reset brings the suggestion back');

  /* 3: the cap */
  for (let i = 0; i < 6; i++){
    const n = await page.$('#area-near .area-near-opt:not([disabled])');
    if (!n) break;
    await n.click();
  }
  s = await state(page);
  ok(s.on.length === 8, '3: eight towns at most (got ' + s.on.length + ')');
  ok(s.near.every(n => n.dis), '3: the nearby towns disable at eight');
  ok(await page.isDisabled('#area-add'), '3: the search disables at eight');
  ok(s.fit !== 'good', '3: eight towns leave the green (' + s.fit + ')');
  if (SHOT) await page.locator('#area-overlay .modal').screenshot({ path: join(SHOT, 'area-3-eight.png') });
  for (let i = 0; i < 4; i++) await page.click('#area-on .area-tok[data-i="' + (s.on.length - 1 - i) + '"]');

  /* 4: save, and the cards print it */
  s = await state(page);
  await page.click('#area-save');
  let saved = (await state(page)).saved;
  ok(!(await state(page)).open, '4: Save closes the dialog');
  ok(saved && saved.areaLine === lineOf(s.on), '4: Save writes the line, in order (' + (saved && saved.areaLine) + ')');
  ok(saved && saved.cover.length === s.on.length, '4: Save writes the towns');
  const printed = await page.evaluate(async () => {
    const tid = await scRegister('glassCard-ca05-35');
    selectEzTpl(tid);
    await new Promise(r => setTimeout(r, 1200));
    const sc = renderEzCanvas(1080, 'png', null, null, 'square', true);
    const o = sc.getObjects().find(o => typeof o.text === 'string' && o.text.indexOf(getArea().areaLine) !== -1);
    const t = o && o.text; sc.dispose(); return t;
  });
  ok(printed === saved.areaLine, '4: a card with the line prints the saved towns (' + printed + ')');

  await page.evaluate(() => openAreaDialog());
  await page.waitForTimeout(400);
  s = await state(page);
  ok(s.on.join('|') === saved.cover.map(c => c.split(',')[0]).join('|'), '4: reopening shows the saved towns');
  ok(await page.evaluate(() => $('area-save').textContent) === 'Save', '4: the button reads Save for a saved area');
  /* 6: the card strip */
  await page.waitForFunction(() => $('area-line').classList.contains('shot') && /^data:image\/jpeg/.test($('area-line-img').src || ''), null, { timeout: 8000 }).catch(() => {});
  ok(await page.evaluate(() => $('area-line').classList.contains('shot')), '6: the card open in Easy Mode is shown cropped to its line');
  if (SHOT) await page.locator('#area-overlay .modal').screenshot({ path: join(SHOT, 'area-4-card-strip.png') });
  await page.click('#area-on .area-tok[data-i="0"]');
  await page.click('#area-skip');
  saved = (await state(page)).saved;
  ok(saved.cover.length === s.on.length && saved.areaLine === lineOf(s.on), '4: "Not now" leaves the saved area as it was');
  await page.evaluate(() => openAreaDialog());
  await page.keyboard.press('Escape');
  ok(!(await state(page)).open, '4: Escape closes the dialog');

  /* 6: a ZIP */
  await page.evaluate(() => openAreaDialog());
  await page.fill('#area-input', '92101');
  await page.waitForFunction(() => /San Diego/.test($('area-home').textContent), null, { timeout: 10000 }).catch(() => {});
  s = await state(page);
  ok(s.on[0] === 'San Diego' && s.line.indexOf('SAN DIEGO') === 0, '6: ZIP 92101 resolves to San Diego, first on its line (' + s.line + ')');
  await ctx.close();

  /* ---------- 5: an area saved before this change ---------- */
  const old = { area: { zip: null, home: 'Fresno, CA', st: 'CA', lat: 36.74773, lon: -119.77237, input: 'Fresno', tier: 'city',
    cover: ['Clovis, CA', 'Madera, CA', 'Sanger, CA'], towns: ['Clovis, CA'], region: 'FRESNO & CLOVIS', areaLine: 'CLOVIS · MADERA · SANGER' } };
  const o = await studio(1280, old);
  await o.page.evaluate(() => openAreaDialog());
  await o.page.waitForFunction(() => document.querySelectorAll('#area-near .area-near-opt').length > 0, null, { timeout: 15000 }).catch(() => {});
  s = await state(o.page);
  ok(s.on.join('|') === 'Clovis|Madera|Sanger', '5: an old area keeps its towns');
  ok(s.near.length > 0, '5: an old area gets nearby towns to add (' + s.near.length + ')');
  await o.ctx.close();

  /* ---------- 6: a phone ---------- */
  const m = await studio(390);
  await m.page.evaluate(() => openAreaDialog());
  await m.page.fill('#area-input', 'Long Beach, CA');
  await m.page.waitForFunction(() => !$('area-edit').hidden, null, { timeout: 15000 });
  const geo = await m.page.evaluate(() => {
    const r = document.querySelector('#area-overlay .modal').getBoundingClientRect();
    return { sideways: document.documentElement.scrollWidth > innerWidth + 1, top: r.top, bottom: r.bottom, vh: innerHeight, left: r.left, right: r.right,
      scrolls: document.querySelector('#area-overlay .modal').scrollHeight > document.querySelector('#area-overlay .modal').clientHeight };
  });
  ok(!geo.sideways, '6: nothing scrolls sideways at 390px');
  ok(geo.top >= 0 && geo.bottom <= geo.vh + 1 && geo.left >= 0 && geo.right <= 391, '6: the dialog sits inside a 390x800 screen (' + JSON.stringify(geo) + ')');
  if (SHOT) await m.page.screenshot({ path: join(SHOT, 'area-6-phone.png') });
  await m.page.click('#area-on .area-tok[data-i="2"]');
  s = await state(m.page);
  ok(s.on.length === 4, '6: a tap takes a town off on a phone');
  await m.ctx.close();

  /* ---------- --measure ---------- */
  if (MEASURE){
    const { page: mp, ctx: mc } = await studio(1280);
    const ids = (await mp.evaluate(async tok => {
      const cards = await scLoadIndex();
      const out = [];
      for (const c of cards){
        const rec = await fetch('assets/showcase/tpl/' + c.id + '.json').then(r => r.ok ? r.json() : null).catch(() => null);
        if (rec && JSON.stringify(rec).indexOf(tok) !== -1) out.push(c.id);
      }
      return out;
    }, 'LONG BEACH · LAKEWOOD · DOWNEY · CARSON · TORRANCE'));
    const res = await mp.evaluate(async ids => {
      const ref = AREA_TOKENS.area, steps = [ref];
      ['NORWALK', 'COMPTON', 'WHITTIER', 'GARDENA', 'ANAHEIM', 'IRVINE'].forEach((t, i, a) => steps.push(ref + ' · ' + a.slice(0, i + 1).join(' · ')));
      for (let k = 1; k <= 12; k++) steps.push(ref + ' · NORWALK · ' + 'WESTMINSTER'.slice(0, k));
      const lines = [...new Set(steps)].sort((a, b) => areaFitOf(a) - areaFitOf(b));
      const base = {}, shrunk = lines.map(() => 0), worst = lines.map(() => 1);
      let n = 0;
      for (const id of ids){
        const tid = await scRegister(id);
        if (!tid) continue;
        selectEzTpl(tid);
        await new Promise(r => setTimeout(r, 700));
        let any = false;
        lines.forEach((line, i) => {
          _areaOverride = { home: 'T, CA', st: 'CA', towns: ['A, CA'], cover: ['A, CA'], region: 'X', areaLine: line };
          let sc; try { sc = renderEzCanvas(1080, 'png', null, null, 'square', true); } finally { _areaOverride = null; }
          const o = sc.getObjects().find(o => typeof o.text === 'string' && o.text.indexOf(line) !== -1);
          if (o){ const fs = o.fontSize * (o.scaleX || 1); if (i === 0) base[id] = fs; else if (base[id] && fs < base[id] * 0.985){ shrunk[i]++; worst[i] = Math.min(worst[i], fs / base[id]); } any = true; }
          sc.dispose();
        });
        if (any) n++;
      }
      return { n, rows: lines.map((l, i) => ({ ratio: +areaFitOf(l).toFixed(3), chars: l.length, shrunk: shrunk[i], worst: +worst[i].toFixed(2) })) };
    }, ids);
    console.log('measure: ' + res.n + ' live cards print the line (of ' + ids.length + ' live cards carrying it)');
    res.rows.forEach(r => console.log('  width x' + r.ratio.toFixed(3) + '  ' + String(r.chars).padStart(3) + ' chars  smaller on ' + String(r.shrunk).padStart(2) + '  worst ' + r.worst));
    const fit = await mp.evaluate(() => AREA_FIT);
    const firstShrink = res.rows.find(r => r.shrunk > 0);
    ok(!firstShrink || firstShrink.ratio > fit.full - 0.02, 'measure: AREA_FIT.full (' + fit.full + ') is at or under the first shrink (' + (firstShrink && firstShrink.ratio) + ')');
    await mc.close();
  }
} catch (e){
  bad.push('threw: ' + (e && e.message || e));
}
ok(!errors.length, 'no page errors: ' + errors.join(' | '));
await browser.close();
server.close();
console.log('area_dialog_check: ' + passed + ' passed, ' + bad.length + ' failed');
bad.forEach(b => console.log('  FAIL ' + b));
process.exit(bad.length ? 1 : 0);
