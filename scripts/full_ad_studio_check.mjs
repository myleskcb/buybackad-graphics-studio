#!/usr/bin/env node
/* THE FULL AD IN EASY MODE, CHECKED (full-ad-studio.js, DESIGN-LAW 141).

   The owner, 2026-11-13: "I know it's a sample, but regardless the samples should look good
   too", "make sure the unification from photos and videos is ready". The full ad, the house
   design language, is the first card in Easy Mode and what a new visitor opens on. This walks
   that page the way a visitor does and fails when:

     first run    a visitor who has never picked a design does not open on the full ad, its card
                  is not first in the strip, or the preview is not drawn;
     the file     Download gives no file, a pop-up stands in the way, or the file is not the
                  picture the preview showed (drawn small and compared, as ez_download_is_preview
                  does); a download with no number goes out;
     every line   any of the lines the full ad draws (motion/subjects.json), in any of Easy
                  Mode's six sizes, has something its own pre-flight says to fix, with the
                  line's own words and a number typed;
     the size     on a square the page does not say how much larger the product would stand on
                  Tall 3:4 (measured there, half again or more), or its one tap does not take it;
     choices      a colour pair or a type pair picked is not the one drawn;
     stepping     a template picked from the strip does not bring the template's form and
                  preview back, the card does not bring the full ad back, a reload forgets it,
                  a design asked for by name is not the one opened, ?fullad=0 does not open a
                  template;
     the video    "Make the video of this ad" does not open the video maker on the same line,
                  headline, colours and type, or the photo the maker saves of it is not the
                  picture Easy Mode saved (one ad, both files compared);
     a phone      anything scrolls sideways at 390 wide; any page error;
     the policy   the site's own Content-Security-Policy (netlify.toml), sent with each page
                  here as production sends it, blocks anything the full ad loads. (A plain file
                  server sends no policy: the theme toggle was dead in production for that.)

   usage:  python3 -m http.server 8899   (in the repo), then
           [GFX_BASE=http://127.0.0.1:8899/] [FABRIC_JS=/path/fabric.min.js] [PLAYWRIGHT_MODULE=...] [SHEET=dir]
           node scripts/full_ad_studio_check.mjs
   SHEET=dir writes the first run's preview and file, and one square per line. Exits 1 on a failure. */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8899/').replace(/\/?$/, '/');
const SHEET = process.env.SHEET || '';
if (SHEET) mkdirSync(SHEET, { recursive: true });
/* CSP_OVERRIDE: another policy, to see this check fail (one that forbids data: pictures blocks the preview) */
const CSP = process.env.CSP_OVERRIDE || (readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8').match(/Content-Security-Policy = "([^"]+)"/) || [])[1] || '';
const blocked = [];
const fails = [], ok = (cond, what, more = '') => { console.log((cond ? '  ok   ' : '  FAIL ') + what + (more && !cond ? ': ' + more : '')); if (!cond) fails.push(what); };

const browser = await chromium.launch();
const open = async (query = '', vp = { width: 1280, height: 900 }) => {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 }), page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
  const origin = new URL(BASE).origin, fabricJs = process.env.FABRIC_JS ? readFileSync(process.env.FABRIC_JS) : null;
  await page.exposeFunction('__cspSaid', v => { blocked.push(v); });
  await page.addInitScript(() => document.addEventListener('securitypolicyviolation', e => window.__cspSaid(e.violatedDirective + ' blocked ' + (e.blockedURI || 'inline') + ' on ' + location.pathname)));
  await page.route('**/*', async route => {
    const req = route.request(), url = req.url();
    if (fabricJs && /\/fabric(\.min)?\.js(\?|$)/.test(url)) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fabricJs });
    /* each page of the site goes out under the site's own policy, as production sends it */
    if (CSP && req.resourceType() === 'document' && url.startsWith(origin)) { const resp = await route.fetch(); return route.fulfill({ response: resp, headers: { ...resp.headers(), 'content-security-policy': CSP } }); }
    if (!fabricJs || url.startsWith(origin) || url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
    return route.abort();
  });
  await page.goto(BASE + '?demo=1' + query, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => typeof showEasy === 'function' && typeof TEMPLATES !== 'undefined' && !!window.FullAdStudio, null, { timeout: 90000 });
  await page.evaluate(() => {
    account = { email: 'audit@local', role: 'admin', plan: 'pro' }; loadAccount = async () => account; recordExport = async () => true;
    window.__dl = []; const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { if (this.download && this.href) { window.__dl.push({ name: this.download, href: this.href }); return; } return click.apply(this, arguments); };
  });
  return { ctx, page, errors };
};
const drawn = page => page.waitForFunction(() => { const i = document.getElementById('fa-preview'); return i && i.dataset.drawn && i.complete && i.naturalWidth > 0 && getComputedStyle(i).display !== 'none'; }, null, { timeout: 30000 }).then(() => true, () => false);
/* the preview is aria-busy until it shows what was last asked of it, and says what it shows
   (data-number, -line, -colour, -type, -fmt): wait on that, with what is expected where a field's
   own pause comes first, never on the clock */
const settle = async (page, want = {}) => { await page.waitForTimeout(60);
  await page.waitForFunction(w => { const i = document.getElementById('fa-preview'); return !!i && i.getAttribute('aria-busy') === 'false' && i.complete && i.naturalWidth > 0 && Object.entries(w).every(([k, v]) => (i.dataset[k] || '') === v); }, want, { timeout: 30000 }).catch(() => {}); };
const quiet = page => page.evaluate(() => document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show')));
const diff = (page, a, b) => page.evaluate(async ([a, b]) => {
  const small = async url => { try { const bmp = await createImageBitmap(await (await fetch(url)).blob());
      /* both pictures to 768 px, then halved four times to 48: each halving averages four pixels,
         and the two take the same steps, so two sizes of one picture come out alike. (One jump to
         a thirtieth of the size skips pixels, and pyramids that end on different last steps differ
         in sharpness: either way the measure read 5 to 7 a channel for one picture at two sizes.) */
      let c = document.createElement('canvas'); c.width = c.height = 768; let g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(bmp, 0, 0, 768, 768);
      for (let k = 0; k < 4; k++) { const n = document.createElement('canvas'); n.width = n.height = c.width / 2; g = n.getContext('2d', { willReadFrequently: true }); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(c, 0, 0, n.width, n.height); c = n; }
      return c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, 48, 48).data; } catch (e) { return null; } };
  const [p, q] = await Promise.all([small(a), small(b)]); if (!p || !q) return 999;
  let d = 0; for (let k = 0; k < p.length; k += 4) d += Math.abs(p[k] - q[k]) + Math.abs(p[k + 1] - q[k + 1]) + Math.abs(p[k + 2] - q[k + 2]);
  return +(d / (48 * 48 * 3)).toFixed(2);
}, [a, b]);

/* ---------- 1. the first run, and the file ---------- */
console.log('a visitor who has never picked a design');
{
  const { ctx, page, errors } = await open();
  await page.evaluate(() => showEasy()); await quiet(page);
  const up = await drawn(page);
  const s = await page.evaluate(() => ({ on: FullAdStudio.isOn(), tiles: [...document.querySelectorAll('#ez-strip .ez-tpl')].slice(0, 2).map(b => b.dataset.tpl + (b.classList.contains('sel') ? '*' : '')),
    left: Math.round(document.getElementById('ez-strip').getBoundingClientRect().left - document.querySelector('#ez-strip .ez-tpl').getBoundingClientRect().left),   // how far the first card is off the strip's left edge
    form: !!document.getElementById('fa-headline') && getComputedStyle(document.getElementById('fa-form')).display !== 'none', tplForm: getComputedStyle(document.getElementById('ez-text-fields')).display, oldPrev: getComputedStyle(document.getElementById('ez-preview')).display }));
  ok(s.on && up, 'Easy Mode opens on the full ad, drawn');
  ok(s.tiles[0] === 'full*' && s.left <= 4, 'its card is first in the strip, selected and in view', JSON.stringify(s.tiles) + ' off by ' + s.left);
  ok(s.form && s.tplForm === 'none' && s.oldPrev === 'none', "its own form and preview stand in for a template's");
  // no number: nothing goes out
  await page.evaluate(async () => { window.__dl.length = 0; await ezDownload(); });
  ok((await page.evaluate(() => window.__dl.length)) === 0, 'Download with no number gives no file');
  await page.fill('#ez-phone', '(562) 555-0142'); await settle(page, { number: '(562) 555-0142' });
  const shows = await page.evaluate(() => document.getElementById('fa-preview').dataset.number);
  ok(shows === '(562) 555-0142', 'the preview shows the number typed', String(shows));
  const preview = await page.evaluate(() => document.getElementById('fa-preview').src);
  const dl = await page.evaluate(async () => { window.__dl.length = 0; await ezDownload(); return { f: window.__dl[0] || null, up: [...document.querySelectorAll('.modal-overlay.show')].map(m => m.id) }; });
  ok(!!dl.f && !dl.up.length, 'Download gives the file, nothing in the way', dl.up.join(', ') || 'no file');
  if (dl.f) {
    const d = await diff(page, preview, dl.f.href);
    ok(d <= 4, `the file is the picture the preview showed (${d} a channel of 255; ${dl.f.name})`, d + ' > 4');
    if (SHEET) { writeFileSync(join(SHEET, 'first-run.preview.jpg'), Buffer.from(preview.split(',')[1], 'base64')); writeFileSync(join(SHEET, 'first-run.file.png'), Buffer.from(dl.f.href.split(',')[1], 'base64')); }
  }

  /* where the size is chosen, the page says how much larger the product stands on the tall one, and one tap takes it */
  const tipA = await page.evaluate(() => { const t = document.getElementById('fa-tip'); return t && !t.hidden ? { times: +t.dataset.times, text: t.textContent } : null; });
  ok(!!tipA && tipA.times >= 1.5 && /Tall 3:4/.test(tipA.text), `on a square the page says the product would stand larger on Tall 3:4 (measured ${tipA ? tipA.times : '?'}x)`, JSON.stringify(tipA));
  if (tipA) { await page.click('#fa-tip-go'); await settle(page, { fmt: 'three4' });
    const after = await page.evaluate(() => ({ fmt: ez.format, hidden: document.getElementById('fa-tip').hidden, w: document.getElementById('fa-preview').naturalWidth, h: document.getElementById('fa-preview').naturalHeight }));
    ok(after.fmt === 'three4' && after.hidden && after.h > after.w * 1.25, 'one tap takes the tall size, and the tip goes', JSON.stringify(after));
    await page.click('#ez-sizes .ez-size[data-fmt="square"]'); await settle(page, { fmt: 'square' }); }

  /* ---------- 2. choices ---------- */
  console.log('colours and type');
  const pairs = await page.evaluate(() => FullAdStudio.pairs()), voices = await page.evaluate(() => FullAdStudio.voices());
  ok(pairs.length === 12, 'the twelve proven pairs are offered', String(pairs.length));
  ok(voices.length >= 20, `the owner's type pairs are offered (${voices.length})`, String(voices.length));
  const wrong = [];
  for (const k of [pairs[1], pairs[7], pairs[11]]) { await page.click(`#fa-pairs [data-pair="${k}"]`); await settle(page, { colour: k }); const c = await page.evaluate(() => FullAdStudio.check(1080).then(r => r.colour)); if (c !== k) wrong.push(`${k} drew ${c}`); }
  ok(!wrong.length, 'a colour pair picked is the one drawn', wrong.join('; '));
  wrong.length = 0;
  for (const k of [voices[0], voices[Math.floor(voices.length / 2)], voices[voices.length - 1]]) { await page.click(`#fa-voices [data-voice="${k}"]`); await settle(page, { type: k }); const r = await page.evaluate(() => FullAdStudio.check(1080)); if (r.type !== k) wrong.push(`${k} drew ${r.type || 'the house face'}`); if (!r.ok) wrong.push(`${k}: ${r.fixes[0]}`); }
  ok(!wrong.length, 'a type pair picked is the one drawn, and the ad holds in it', wrong.join('; '));
  await page.click('#fa-voices [data-voice=""]'); await page.click('#fa-pairs [data-pair=""]'); await settle(page);

  /* ---------- 3. stepping back and forth ---------- */
  console.log('templates beside it');
  const second = await page.evaluate(() => document.querySelectorAll('#ez-strip .ez-tpl')[1].dataset.tpl);
  await page.click(`#ez-strip .ez-tpl[data-tpl="${second}"]`); await page.waitForTimeout(900);
  const t = await page.evaluate(() => ({ on: FullAdStudio.isOn(), tpl: ez.tpl, prev: getComputedStyle(document.getElementById('ez-preview')).display, form: getComputedStyle(document.getElementById('ez-text-fields')).display, mine: getComputedStyle(document.getElementById('fa-form')).display,
    sel: [...document.querySelectorAll('#ez-strip .ez-tpl.sel')].map(b => b.dataset.tpl), src: (document.getElementById('ez-preview').src || '').length }));
  ok(!t.on && t.tpl === second && t.prev !== 'none' && t.form !== 'none' && t.mine === 'none' && t.sel.join() === second && t.src > 1000, 'a template picked brings its own form and preview back', JSON.stringify(t).slice(0, 200));
  await page.click('#ez-strip .ez-fulltile'); await settle(page);
  ok(await page.evaluate(() => FullAdStudio.isOn() && [...document.querySelectorAll('#ez-strip .ez-tpl.sel')].map(b => b.dataset.tpl).join() === 'full'), 'the card brings the full ad back');
  await page.reload({ waitUntil: 'load' }); await page.waitForFunction(() => typeof showEasy === 'function' && !!window.FullAdStudio, null, { timeout: 90000 });
  await page.evaluate(() => showEasy()); await quiet(page);
  ok(await drawn(page) && await page.evaluate(() => FullAdStudio.isOn()), 'a reload comes back to the full ad');
  await page.evaluate(id => showEasy(id), second); await page.waitForTimeout(600);
  ok(await page.evaluate(id => !FullAdStudio.isOn() && ez.tpl === id, second), 'a design asked for by name is the one opened');
  ok(!errors.length, 'no page errors', errors.slice(0, 2).join(' | '));
  await ctx.close();
}
{
  const { ctx, page } = await open('&fullad=0');
  await page.evaluate(() => showEasy()); await quiet(page); await page.waitForTimeout(700);
  ok(await page.evaluate(() => !FullAdStudio.isOn() && !!document.querySelector('#ez-strip .ez-fulltile') && getComputedStyle(document.getElementById('ez-preview')).display !== 'none'), '?fullad=0 opens a template, the card still in the strip');
  await ctx.close();
}

/* ---------- 4. every line, in every size ---------- */
console.log('every line the full ad draws, in every size');
{
  const { ctx, page, errors } = await open();
  await page.evaluate(() => showEasy()); await quiet(page); await drawn(page);
  await page.fill('#ez-phone', '(562) 555-0142');
  const res = await page.evaluate(async wantSheet => {
    const out = [], sheet = [], S = FullAdStudio.state;
    for (const L of FullAdStudio.lines()) {
      if (currentCat !== L.cat) setCategory(L.cat);
      S.line[L.cat] = L.key; S.pair = ''; S.voice = ''; S.seed = 1;
      for (const [id, F] of Object.entries(FORMATS)) {
        try { const r = await FullAdStudio.check(1080, F); out.push({ line: L.key, size: id, ok: r.ok, fixes: r.fixes, pictures: r.pictures, sets: L.sets.length, on: FullAdStudio.isOn() }); }
        catch (e) { out.push({ line: L.key, size: id, ok: false, fixes: ['threw ' + String(e).slice(0, 90)], pictures: 0, sets: L.sets.length, on: FullAdStudio.isOn() }); }
      }
      if (wantSheet) { const { ad } = await FullAdStudio.build(540, FORMATS.square); const c = document.createElement('canvas'); c.width = ad.W; c.height = ad.H; ad.still = null;
        const t = Math.max(isFinite(ad.tl.number) ? ad.tl.number + 1.2 : 0, (ad.tLanded || 0) + .6, (ad.tOutro != null ? ad.tOutro : ad.st.duration) - .4); ad.frame(c.getContext('2d'), t, { subsFly: 4, subsMove: 2 }, 1 / 30); sheet.push([L.key, c.toDataURL('image/jpeg', .85)]); }
    }
    return { out, sheet, sizes: Object.keys(FORMATS).length };
  }, !!SHEET);
  if (SHEET) for (const [k, url] of res.sheet) writeFileSync(join(SHEET, 'line-' + k + '.jpg'), Buffer.from(url.split(',')[1], 'base64'));
  const bad = res.out.filter(r => !r.ok), lines = new Set(res.out.map(r => r.line)), bare = [...new Set(res.out.filter(r => r.sets && !r.pictures).map(r => r.line))], noPic = [...new Set(res.out.filter(r => !r.sets).map(r => r.line))];
  ok(!bad.length, `${lines.size} lines in ${res.sizes} sizes (${res.out.length} ads): the pre-flight has nothing to fix`, bad.slice(0, 6).map(r => `${r.line} ${r.size}: ${r.fixes[0]}`).join(' | ') + (bad.length > 6 ? ` … ${bad.length} in all` : ''));
  ok(!bare.length, 'every line that has pictures shows one', bare.join(', '));
  ok(res.out.every(r => r.on), 'a change of category keeps the full ad on');
  if (noPic.length) console.log(`  note ${noPic.length} lines have no clean picture and are drawn with words alone (OPEN-ITEMS §BC 6): ${noPic.join(', ')}`);
  ok(!errors.length, 'no page errors', errors.slice(0, 2).join(' | '));
  await ctx.close();
}

/* ---------- 5. the video of the same ad ---------- */
console.log('the video of this ad');
{
  const { ctx, page } = await open();
  await page.evaluate(() => { localStorage.setItem('pgfx_area_asked', 'true'); showEasy(); }); await quiet(page); await drawn(page);
  await page.fill('#ez-phone', '(562) 555-0142');
  await page.evaluate(() => { setCategory('gold'); }); await settle(page, { line: 'gold' });
  const want = await page.evaluate(() => { const p = FullAdStudio.pairs()[3], v = FullAdStudio.voices()[2]; document.querySelector(`#fa-pairs [data-pair="${p}"]`).click(); document.querySelector(`#fa-voices [data-voice="${v}"]`).click(); return { p, v }; });
  await settle(page, { colour: want.p, type: want.v });
  const here = await page.evaluate(() => FullAdStudio.check(1080));
  const mine = await page.evaluate(async () => { window.__dl.length = 0; await ezDownload(); return (window.__dl[0] || {}).href || ''; });   // the picture, as downloaded here
  await Promise.all([page.waitForURL(/\/motion\//, { timeout: 30000 }).catch(() => {}), page.evaluate(() => ezDownloadVideo({ preview: true }))]);
  const there = await page.waitForFunction(() => document.getElementById('loading') && document.getElementById('loading').hidden, null, { timeout: 120000 }).then(() => true, () => false);
  await page.waitForTimeout(1500);
  const m = there ? await page.evaluate(() => ({ full: document.querySelector('#f-subject') ? document.getElementById('f-subject').value : '', head: document.getElementById('f-headline') ? document.getElementById('f-headline').value : '',
    colour: (document.querySelector('#full-colours [aria-checked="true"]') || { dataset: {} }).dataset.colour, voice: (document.querySelector('#full-voices [aria-checked="true"]') || { dataset: {} }).dataset.voice, num: document.getElementById('f-number').value, url: location.pathname + location.search })) : {};
  ok(there && /\/motion\/$/.test(m.url || ''), '"Make the video of this ad" opens the video maker', m.url || 'never loaded');
  ok(m.full === 'gold' && m.colour === want.p && m.voice === want.v && (m.head || '').toUpperCase() === here.headline.toUpperCase() && /555/.test(m.num || ''), 'on the same line, headline, number, colours and type', JSON.stringify(m) + ' vs ' + JSON.stringify({ ...want, head: here.headline }));
  /* one ad: the photo the video maker saves of it is the picture Easy Mode saved */
  if (there && mine) {
    const got = await Promise.all([page.waitForEvent('download', { timeout: 90000 }), page.click('#download-jpg')]).then(([dl]) => dl.path().then(p => ({ p, name: dl.suggestedFilename() })), e => ({ err: String(e).slice(0, 120) }));
    if (got.p) {
      const theirs = 'data:image/jpeg;base64,' + readFileSync(got.p).toString('base64'), d = await diff(page, mine, theirs);
      ok(d <= 4, `the maker's photo of it is the picture Easy Mode saved (${d} a channel of 255; ${got.name})`, d + ' > 4');
      if (SHEET) { writeFileSync(join(SHEET, 'one-ad.studio.png'), Buffer.from(mine.split(',')[1], 'base64')); writeFileSync(join(SHEET, 'one-ad.maker.jpg'), readFileSync(got.p)); }
    } else ok(false, "the maker's photo of it is the picture Easy Mode saved", got.err || 'no file');
  } else ok(false, "the maker's photo of it is the picture Easy Mode saved", 'no file from Easy Mode, or the maker did not open');
  await ctx.close();
}

/* ---------- 6. a phone ---------- */
console.log('at 390 wide');
{
  const { ctx, page, errors } = await open('', { width: 390, height: 844 });
  await page.evaluate(() => showEasy()); await quiet(page); await drawn(page);
  const w = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: window.innerWidth, on: FullAdStudio.isOn() }));
  ok(w.on && w.sw <= w.vw + 1, `nothing scrolls sideways (${w.sw} in ${w.vw})`, JSON.stringify(w));
  ok(!errors.length, 'no page errors', errors.slice(0, 2).join(' | '));
  await ctx.close();
}
await browser.close();
console.log("the site's policy");
ok(!!CSP, 'the policy was read from netlify.toml and sent with every page');
ok(!blocked.length, 'it blocks nothing the full ad loads, here or in the video maker', [...new Set(blocked)].slice(0, 4).join(' | '));
console.log(fails.length ? `\n${fails.length} failing` : '\nall clear');
process.exit(fails.length ? 1 : 0);
