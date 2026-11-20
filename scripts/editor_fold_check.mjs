#!/usr/bin/env node
/* THE LONG ROWS, FOLDED, CHECKED (editor-more.js, DESIGN-LAW 163).
   The owner, of the editor's option rows: "Maybe these could just show a few options and then show
   more so it's not all open by default." This walks the rows a visitor meets, at 1440 and 390,
   under the production CSP (_headers), and fails when:
     the fold     a long row (Easy Mode's typefaces and headline styles, the designer's two, the full
                  ad's typefaces) shows more than its first eight and the chosen one, or has no
                  "More …" button after it, or a short row (Outline) is folded;
     the button   it does not open the rest in place and close them again, or its aria-expanded or
                  aria-controls does not say so;
     the chosen   the chosen one is hidden: after a pick made open and then closed, after T steps the
                  typefaces, after the full ad's form is drawn again;
     the order    the headline style's sub-panel (ezTagHost) does not follow the row's button;
     the phone    anything scrolls sideways at 390;
     errors       any page error, or a CSP refusal.
   usage: node scripts/editor_fold_check.mjs   (FABRIC_JS=/path/fabric.min.js when cdnjs is out of
          reach; PLAYWRIGHT_MODULE=/path/to/playwright when it is not installed here)
   exits 1 on any failure */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { join, extname, normalize } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const fails = [], ok = (c, what) => { console.log((c ? '  ok   ' : '  FAIL ') + what); if (!c) fails.push(what); };
const CSP = (readFileSync(join(ROOT, '_headers'), 'utf8').match(/Content-Security-Policy:\s*(.+)/) || [])[1];
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = normalize(join(ROOT, p)), type = TYPES[extname(p).toLowerCase()] || 'application/octet-stream';
  if (!f.startsWith(ROOT) || !existsSync(f) || !statSync(f).isFile()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, Object.assign({ 'Content-Type': type }, CSP && type === 'text/html' ? { 'Content-Security-Policy': CSP } : {}));
  res.end(readFileSync(f));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port + '/';
let chromium;
try { ({ chromium } = await import('playwright')); }
catch (e) {
  try { ({ chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')); }
  catch (e2) { console.log('editor_fold_check: no playwright (set PLAYWRIGHT_MODULE)'); server.close(); process.exit(2); }
}
const fabricJs = process.env.FABRIC_JS ? readFileSync(process.env.FABRIC_JS) : null;
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });

/* a row as the visitor sees it: how many choices, how many shown, the chosen one shown, its button */
const row = (page, id) => page.evaluate(id => {
  const r = document.getElementById(id), b = document.getElementById(id + '-more');
  if (!r) return null;
  const all = [...r.children].filter(c => c.tagName === 'BUTTON'), shown = all.filter(x => getComputedStyle(x).display !== 'none');
  return { all: all.length, shown: shown.length, chosenShown: all.filter(x => x.classList.contains('active')).every(x => getComputedStyle(x).display !== 'none'),
    btn: b && !b.hidden && getComputedStyle(b).display !== 'none' ? { text: b.textContent, expanded: b.getAttribute('aria-expanded'), controls: b.getAttribute('aria-controls'),
      next: b.nextElementSibling ? b.nextElementSibling.id : '' } : null };
}, id);
const folded = (s, noun) => s && s.all > 10 && s.shown <= 9 && s.chosenShown && s.btn && s.btn.expanded === 'false'
  && new RegExp('^More ' + noun + ' \\(\\d+\\)$').test(s.btn.text);

for (const [w, h] of [[1440, 900], [390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 });
  await ctx.addInitScript(() => { try { localStorage.setItem('pgfx_tut_done', 'true'); localStorage.setItem('pgfx_area_asked', 'true'); } catch (e) {} });
  await ctx.route('**/*', route => {
    const url = route.request().url();
    if (fabricJs && /\/fabric(\.min)?\.js(\?|$)/.test(url)) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fabricJs });
    if (url.startsWith(BASE) || url.startsWith('data:') || url.startsWith('blob:') || (!fabricJs && /cdnjs\.cloudflare\.com/.test(url))) return route.continue();
    return route.abort();
  });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
  page.on('console', m => { if (m.type() === 'error' && /Content Security Policy|Refused to/.test(m.text())) errors.push('CSP: ' + m.text().slice(0, 200)); });
  const quiet = () => page.evaluate(() => document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show')));
  console.log(w + 'px');

  await page.goto(BASE + '?fullad=0', { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => typeof showEasy === 'function' && typeof TEMPLATES !== 'undefined', null, { timeout: 90000 });
  await page.evaluate(() => showEasy()); await page.waitForTimeout(1200); await quiet();
  let s = await row(page, 'ez-voices');
  ok(folded(s, 'typefaces') && s.btn.controls === 'ez-voices', `Easy Mode's typefaces show ${s && s.shown} of ${s && s.all}, behind "${s && s.btn && s.btn.text}"`);
  await page.click('#ez-voices-more'); s = await row(page, 'ez-voices');
  ok(s.shown === s.all && s.btn.expanded === 'true' && s.btn.text === 'Fewer typefaces', 'its button opens them all in place');
  await page.evaluate(() => { const bs = [...document.querySelectorAll('#ez-voices button')]; bs[bs.length - 3].click(); });
  await page.waitForTimeout(300); await page.click('#ez-voices-more'); s = await row(page, 'ez-voices');
  ok(s.btn.expanded === 'false' && s.chosenShown, 'closed again, a late pick stays in view');
  if (w >= 1000) {   // the keys are a desktop's (Easy Mode shows them only where there is a keyboard)
    for (let i = 0; i < 3; i++) { await page.keyboard.press('t'); await page.waitForTimeout(200); }
    s = await row(page, 'ez-voices'); ok(s.chosenShown, 'T steps the typefaces, and the chosen one is shown');
  }
  s = await row(page, 'ez-tag-looks');
  ok(folded(s, 'styles') && s.btn.next === 'ez-tag-more', 'the headline styles fold, and their sub-panel follows the button');
  s = await row(page, 'ez-tag-outline'); ok(s && !s.btn && s.shown === s.all, 'a short row (Outline) stays open');
  ok(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 1, 'nothing scrolls sideways');

  await page.evaluate(() => openAdvancedFromEz()); await page.waitForTimeout(2200); await quiet();
  if (w < 1000) await page.evaluate(() => { const t = document.getElementById('left-drawer-tab'); if (t) t.click(); });
  s = await row(page, 'ed-voices'); ok(folded(s, 'typefaces'), 'the designer\'s typefaces fold');
  s = await row(page, 'ed-tagstyles'); ok(folded(s, 'styles') && s.btn.next === 'ez-tag-more', 'the designer\'s headline styles fold, their sub-panel after the button');

  await page.evaluate(() => showEasy()); await page.waitForTimeout(800); await quiet();
  await page.evaluate(() => document.querySelector('#ez-strip .ez-fulltile').click());
  await page.waitForFunction(() => !!document.getElementById('fa-voices'), null, { timeout: 30000 }).catch(() => {}); await page.waitForTimeout(800);
  s = await row(page, 'fa-voices'); ok(folded(s, 'typefaces'), 'the full ad\'s typefaces fold');
  if (s && s.btn) {
    await page.click('#fa-voices-more');
    await page.evaluate(() => { const bs = [...document.querySelectorAll('#fa-voices button')]; bs[bs.length - 2].click(); });
    await page.waitForTimeout(1500); s = await row(page, 'fa-voices');
    ok(s && s.chosenShown && s.btn, 'a late pick on the full ad is shown when its form is drawn again');
  }
  ok(!errors.length, 'no page error or CSP refusal' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  await ctx.close();
}
await browser.close(); server.close();
console.log(fails.length ? `\n${fails.length} FAILED:\n- ` + fails.join('\n- ') : '\nall passed');
process.exit(fails.length ? 1 : 0);
