#!/usr/bin/env node
/* THE EDITOR IN THE FULL AD'S LOOK, CHECKED (styles.css, DESIGN-LAW 163).
   The site wears main's look (rules 152, 153, 161); the owner chose the full ad's own look for the
   studio's editor ("Full-ad look anyway"). This opens the landing, then Easy Mode (the full ad,
   then a template), its area dialog, ✎ pop-over and colour builder, then the designer, its
   template picker and its export dialog, and the plans page over it, at 390 and 1440, light and
   dark, under the production CSP (_headers), and fails when:
     the look     an editor view is not on the full ad's ground (Silver & Blue light, Navy & Gold
                  dark), or its bar, cards and panels are not set in the full ad's face (Chivo);
     the scope    the landing, or the plans page opened over the editor, is on that ground: the
                  editor's look must be off wherever the site's is meant;
     legibility   a word a customer reads is under 4.5:1 against what is behind it, or under 12px
                  (rule 113; the ORIG swatch's badge, 10.5px, is its one exception). Words on a
                  picture, previews of an ad's own colours or faces, controls that are off
                  (disabled, or held at low opacity) and the brand's mark (a logotype, rule
                  165's colours) are not judged for contrast;
     the print    a control wears the poster's hard offset shadow, or one of its colours (the four
                  signal colours, its blue, its ink and its papers);
     the phone    anything scrolls sideways, or the designer's or Easy Mode's bar runs past a
                  1440 screen;
     the hooks    an id in index.html, or a class there that app.js, full-ad-studio.js or
                  colour-builder.js names, is gone (against --since, HEAD by default);
     errors       any page error, or a CSP refusal.
   usage: node scripts/editor_look_check.mjs [--since <rev>] [--before <rev>] [--json out.json]
          FABRIC_JS=/path/fabric.min.js when cdnjs is out of reach; PLAYWRIGHT_MODULE=/path/to/playwright
          when it is not installed here. --before <rev> serves index.html and the stylesheets as they
          were at <rev>, for the numbers before a change (the poster look fails it by design).
   exits 1 on any failure */
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { join, extname, normalize } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const argv = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const BEFORE = argv('--before'), SINCE = argv('--since') || 'HEAD', JSON_OUT = argv('--json');
const git = (...a) => execFileSync('git', a, { cwd: ROOT, maxBuffer: 64 << 20 }).toString();
const fails = [], ok = (cond, what) => { if (!cond) fails.push(what); return cond; };

/* ── the hooks: what the scripts bind must outlive a restyle ── */
if (!BEFORE) {
  const was = git('show', SINCE + ':index.html'), now = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const ids = s => new Set([...s.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
  const classes = s => new Set([...s.matchAll(/\sclass="([^"]+)"/g)].flatMap(m => m[1].split(/\s+/)).filter(Boolean));
  const js = ['app.js', 'full-ad-studio.js', 'colour-builder.js'].map(f => readFileSync(join(ROOT, f), 'utf8').split('\n').filter(l => !l.startsWith('const CSS_FALLBACK = ')).join('\n')).join('\n');
  const named = c => new RegExp(`['"\`. ]${c.replace(/[-]/g, '\\-')}['"\`\\s.:,)\\]]`).test(js);
  const goneIds = [...ids(was)].filter(i => !ids(now).has(i));
  const goneClasses = [...classes(was)].filter(c => !classes(now).has(c) && named(c));
  ok(!goneIds.length, 'hooks: ids gone from index.html since ' + SINCE + ': ' + goneIds.join(', '));
  ok(!goneClasses.length, 'hooks: classes the scripts name, gone from index.html since ' + SINCE + ': ' + goneClasses.join(', '));
  console.log(`hooks: ${ids(was).size} ids and every class the scripts name, against ${SINCE}` + (goneIds.length + goneClasses.length ? ': FAIL' : ': ok'));
}

/* ── the site, served as production serves it ── */
const CSP = (readFileSync(join(ROOT, '_headers'), 'utf8').match(/Content-Security-Policy:\s*(.+)/) || [])[1];
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4' };
const OLD = new Set(['index.html', 'styles.css', 'house.css', 'full-ad-studio.css']);
const atRev = rel => { try { return git('show', BEFORE + ':' + rel); } catch (e) { return null; } };
const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const rel = p.replace(/^\/+/, ''), type = TYPES[extname(p).toLowerCase()] || 'application/octet-stream';
  const head = Object.assign({ 'Content-Type': type }, CSP && type === 'text/html' ? { 'Content-Security-Policy': CSP } : {});
  if (BEFORE && OLD.has(rel)) { const b = atRev(rel); if (!b) { res.writeHead(404); return res.end(); } res.writeHead(200, head); return res.end(b); }
  const f = normalize(join(ROOT, p));
  if (!f.startsWith(ROOT) || !existsSync(f) || !statSync(f).isFile()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, head); res.end(readFileSync(f));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port + '/';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch (e) {
  try { ({ chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')); }
  catch (e2) { console.log('editor_look_check: no playwright (set PLAYWRIGHT_MODULE)'); server.close(); process.exit(2); }
}
const fabricJs = process.env.FABRIC_JS ? readFileSync(process.env.FABRIC_JS) : null;
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });

/* ── what is measured on a page: every word, every control's shadow and colours ── */
function measure(scopeSel) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const g = cv.getContext('2d', { willReadFrequently: true });
  const memo = new Map();
  const rgba = c => {
    if (memo.has(c)) return memo.get(c);
    g.clearRect(0, 0, 1, 1); g.fillStyle = '#000'; g.fillStyle = c; g.fillRect(0, 0, 1, 1);
    const d = g.getImageData(0, 0, 1, 1).data, v = [d[0], d[1], d[2], d[3] / 255];
    memo.set(c, v); return v;
  };
  const lum = ([r, gg, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(gg) + 0.0722 * f(b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const over = (top, under) => [0, 1, 2].map(i => top[i] * top[3] + under[i] * (1 - top[3]));
  const ROOTS = new Set([document.documentElement, document.body, document.getElementById('page-easy'), document.getElementById('page-editor')]);
  /* previews of an ad (its colours, its faces, its art) are the ad's, not the chrome's */
  const PREVIEW = 'canvas,svg,img,video,.ez-theme:not(.orig),.ez-sw:not(.orig),.ez-gsw,.ez-tagstyle svg,.ez-tag-pat,.ez-tag-preset,.fp-item,.fp-btn,.cb-ad,.cb-start i,.cb-saved-sw,.area-line,.pro-guard,.bggen-sw,.bggen-dots,.tp-biu,#snap-guides,.ez-recent,.mini-tpl img,.ez-tpl img,#ez-preview,#fa-preview,.export-preview,.ez-lswatch,.tpl-card .tpl-veil,.tpl-card .tpl-meta';
  /* the poster's colours (rule 98): signal blue, tomato, marigold, mint, its dark-mode blue, its inks and papers */
  const POSTER = ['#2b56f5', '#ff4a2e', '#ffc21a', '#12b886', '#6f8cff', '#141414', '#0d0c0f', '#f2eee4', '#fffdf8', '#fbf8f1', '#1b1a1f', '#24232a', '#2a2930', '#f4f0e8'].map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
  const isPoster = c => c[3] > 0.5 && POSTER.some(p => p.every((v, i) => Math.abs(v - c[i]) <= 2));
  const bgOf = el => {
    const layers = [];
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      let c = rgba(cs.backgroundColor);
      if (c[3] === 0) {
        const b = getComputedStyle(e, '::before');      // a pill drawn behind the words (the download's)
        if (b.content !== 'none' && b.position === 'absolute' && b.zIndex === '-1') { const bc = rgba(b.backgroundColor); if (bc[3] > 0) c = bc; }
      }
      if (cs.backgroundImage !== 'none' && c[3] < 0.999 && !ROOTS.has(e)) return null;     // words on a picture or a gradient
      if (c[3] > 0) { layers.push(c); if (c[3] >= 0.999) break; }
    }
    let out = [255, 255, 255];
    for (let i = layers.length - 1; i >= 0; i--) out = over(layers[i], out);
    return out;
  };
  const opacity = el => { let o = 1; for (let e = el; e; e = e.parentElement) o *= +getComputedStyle(e).opacity; return o; };
  const path = el => { const p = []; for (let e = el; e && p.length < 4 && e !== document.body; e = e.parentElement) p.unshift(e.id ? '#' + e.id : e.tagName.toLowerCase() + (e.classList.length ? '.' + [...e.classList].slice(0, 2).join('.') : '')); return p.join(' > '); };
  const scopes = [...document.querySelectorAll(scopeSel)].filter(s => s.checkVisibility());
  const out = { words: 0, low: [], small: [], hard: [], poster: [], faces: {} };
  const seen = new Set();
  for (const scope of scopes) {
    const tw = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      if (!n.nodeValue.trim()) continue;
      const el = n.parentElement;
      if (!el || seen.has(el)) continue; seen.add(el);
      if (el.closest(PREVIEW) || !el.checkVisibility({ checkVisibilityCSS: true }) || !el.getClientRects().length) continue;
      if (el.closest('button:disabled,[aria-disabled=true],option') || opacity(el) < 0.99) continue;
      const cs = getComputedStyle(el), size = parseFloat(cs.fontSize);
      out.words++;
      const face = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim(); out.faces[face] = (out.faces[face] || 0) + 1;
      if (size < 12 && !el.closest('.ez-sw.orig')) out.small.push(`${path(el)} "${n.nodeValue.trim().slice(0, 24)}" ${size}px`);
      const bg = bgOf(el); if (!bg) continue;
      const fg = rgba(cs.color); if (fg[3] === 0) continue;          // drawn, not set
      if (el.closest('.wb-word')) continue;   // the brand's mark is a logotype, with no contrast floor (WCAG 1.4.3): rule 165's white AD on #3d8bff is 3.3:1 in dark
      const r = ratio(over(fg, bg), bg);
      if (r < 4.5) out.low.push(`${path(el)} "${n.nodeValue.trim().slice(0, 24)}" ${r.toFixed(2)}:1`);
    }
    /* selects show their chosen option's words in their own box */
    for (const s of scope.querySelectorAll('select')) {
      if (!s.checkVisibility() || s.closest(PREVIEW)) continue;
      const bg = bgOf(s); if (!bg) continue;
      const r = ratio(over(rgba(getComputedStyle(s).color), bg), bg); out.words++;
      if (r < 4.5) out.low.push(`${path(s)} (select) ${r.toFixed(2)}:1`);
    }
    for (const el of [scope, ...scope.querySelectorAll('*')]) {
      if (el.closest(PREVIEW) || !el.checkVisibility()) continue;
      const cs = getComputedStyle(el);
      if (cs.boxShadow !== 'none') {
        for (const sh of cs.boxShadow.split(/,(?![^(]*\))/)) {
          if (/inset/.test(sh)) continue;
          const nums = sh.replace(/(rgba?|color|oklab|oklch|lab|lch)\([^)]*\)/g, '').match(/-?[\d.]+px/g) || [];
          const [x, y, blur] = nums.map(parseFloat);
          if ((x || y) && !blur) { out.hard.push(`${path(el)} ${sh.trim()}`); break; }
        }
      }
      for (const prop of ['color', 'backgroundColor', 'borderTopColor', 'borderLeftColor']) {
        if (prop.startsWith('border') && parseFloat(cs[prop.replace('Color', 'Width')]) === 0) continue;
        if (isPoster(rgba(cs[prop]))) { out.poster.push(`${path(el)} ${prop} ${cs[prop]}`); break; }
      }
    }
  }
  const grounds = ['page-easy', 'page-editor'].map(id => document.getElementById(id)).filter(e => e && e.checkVisibility()).map(e => rgba(getComputedStyle(e).backgroundColor === 'rgba(0, 0, 0, 0)' ? getComputedStyle(document.body).backgroundColor : getComputedStyle(e).backgroundColor));
  const faceOf = sel => { const e = document.querySelector(sel); return e && e.checkVisibility() ? getComputedStyle(e).fontFamily : null; };
  out.ground = grounds[0] || rgba(getComputedStyle(document.body).backgroundColor);
  out.chromeFaces = ['.ez-nav', '.ez-card', '.topbar', '.panel-left', '.modal-overlay.show .modal'].map(faceOf).filter(Boolean);
  out.scroll = document.documentElement.scrollWidth - innerWidth;
  out.bars = ['.ez-nav', '.topbar'].map(s => document.querySelector(s)).filter(e => e && e.checkVisibility()).map(e => [e.className, e.scrollWidth - e.clientWidth]);
  return out;
}

const GROUND = { light: [226, 232, 243], dark: [3, 27, 86] };
const report = {};
for (const [w, h] of [[390, 844], [1440, 900]]) for (const theme of ['light', 'dark']) {
  const tag = `${w}-${theme}`, errors = [];
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme, isMobile: w < 500, hasTouch: w < 500 });
  await ctx.addInitScript(() => { try { localStorage.setItem('pgfx_tut_done', 'true'); localStorage.setItem('pgfx_area_asked', 'true'); } catch (e) {} });
  await ctx.route('**/*', route => {
    const url = route.request().url();
    if (fabricJs && /\/fabric(\.min)?\.js(\?|$)/.test(url)) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fabricJs });
    if (url.startsWith(BASE) || url.startsWith('data:') || url.startsWith('blob:') || (!fabricJs && /cdnjs\.cloudflare\.com/.test(url))) return route.continue();
    return route.abort();
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
  page.on('console', m => { if (m.type() === 'error' && /Content Security Policy|Refused to/.test(m.text())) errors.push('CSP: ' + m.text().slice(0, 200)); });
  const quiet = () => page.evaluate(() => document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show')));
  const settle = async () => { await page.evaluate(() => document.fonts && document.fonts.ready); await page.waitForTimeout(700); };
  const views = {}, scope = {};
  const judge = async (view, scope) => { await settle(); views[view] = await page.evaluate(measure, scope); };

  const fieldNow = () => page.evaluate(() => { const c = document.createElement('canvas').getContext('2d'); c.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--field').trim() || '#000'; c.fillRect(0, 0, 1, 1); return [...c.getImageData(0, 0, 1, 1).data].slice(0, 3); });
  const fullAdGround = rgb => GROUND[theme].every((v, i) => Math.abs(v - rgb[i]) <= 2);
  await page.goto(BASE + `?theme=${theme}`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => typeof showEasy === 'function' && typeof TEMPLATES !== 'undefined' && !!window.FullAdStudio, null, { timeout: 90000 });
  scope.landing = await fieldNow();
  await page.evaluate(() => showEasy()); await quiet();
  await page.waitForFunction(() => { const i = document.getElementById('fa-preview'); return i && i.dataset.drawn && i.complete; }, null, { timeout: 30000 }).catch(() => {});
  await judge('easy, the full ad', '#page-easy');

  await page.goto(BASE + `?theme=${theme}&fullad=0`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => typeof showEasy === 'function' && typeof openAreaDialog === 'function', null, { timeout: 90000 });
  await page.evaluate(() => showEasy('sell_iphone')); await quiet();
  await page.waitForFunction(() => { const i = document.getElementById('ez-preview'); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 30000 }).catch(() => {});
  await judge('easy, a template', '#page-easy');

  await page.evaluate(() => openAreaDialog());
  await page.waitForFunction(() => document.getElementById('area-overlay').classList.contains('show'), null, { timeout: 10000 }).catch(() => {});
  await judge('the area dialog', '#area-overlay.show');
  await quiet();

  await page.evaluate(() => document.getElementById('ez-edit-phone').click());
  await page.waitForFunction(() => document.getElementById('txt-pop').classList.contains('open'), null, { timeout: 10000 }).catch(() => {});
  await judge('the ✎ pop-over', '#txt-pop.open');
  await page.evaluate(() => document.getElementById('txt-pop').classList.remove('open'));

  await page.evaluate(() => { const b = document.querySelector('#ez-themes .cb-make'); if (b) b.click(); });
  await page.waitForFunction(() => { const o = document.getElementById('cb-overlay'); return o && o.classList.contains('show'); }, null, { timeout: 10000 }).catch(() => {});
  await judge('the colour builder', '#cb-overlay.show');
  await quiet();

  await page.evaluate(() => openAdvancedFromEz());
  await page.waitForFunction(() => document.getElementById('page-editor').classList.contains('active'), null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1500); await quiet();
  await page.evaluate(() => { const t = canvas && canvas.getObjects().find(o => o.type === 'i-text' || o.type === 'textbox'); if (t) { canvas.setActiveObject(t); canvas.requestRenderAll(); } });
  await judge('the designer', '#page-editor');

  await page.evaluate(() => openPicker());
  await page.waitForFunction(() => document.getElementById('picker-overlay').classList.contains('show'), null, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(800);
  await judge('the template picker', '#picker-overlay.show');
  await quiet();

  await page.evaluate(() => openExport());
  await page.waitForFunction(() => document.getElementById('export-overlay').classList.contains('show'), null, { timeout: 10000 }).catch(() => {});
  await judge('the export dialog', '#export-overlay.show');
  await quiet();

  await page.evaluate(() => openPlans());
  await page.waitForFunction(() => document.getElementById('page-plans').classList.contains('active'), null, { timeout: 10000 }).catch(() => {});
  scope.plans = await fieldNow();
  await ctx.close();

  console.log(tag);
  for (const [view, m] of Object.entries(views)) {
    const f0 = fails.length, at = `${tag} ${view}: `;
    if (/^(easy|the designer)/.test(view)) ok(GROUND[theme].every((v, i) => Math.abs(v - m.ground[i]) <= 2), at + `the ground is rgb(${m.ground.slice(0, 3).join(',')}), not the pair's`);
    ok(m.chromeFaces.every(f => /BB Chivo/.test(f)), at + 'not in the house face: ' + m.chromeFaces.filter(f => !/BB Chivo/.test(f)).join(' | '));
    ok(!m.low.length, at + `${m.low.length} words under 4.5:1: ` + m.low.slice(0, 6).join('; '));
    ok(!m.small.length, at + `${m.small.length} words under 12px: ` + m.small.slice(0, 6).join('; '));
    ok(!m.hard.length, at + `${m.hard.length} hard offset shadows: ` + m.hard.slice(0, 4).join('; '));
    ok(!m.poster.length, at + `${m.poster.length} poster colours: ` + m.poster.slice(0, 4).join('; '));
    ok(m.scroll <= 1, at + `the page scrolls ${m.scroll}px sideways`);
    if (w >= 1440) ok(m.bars.every(([, o]) => o <= 1), at + 'a bar runs past the screen: ' + m.bars.filter(([, o]) => o > 1).map(([c, o]) => `${c} by ${o}px`).join(', '));
    console.log(`  ${fails.length === f0 ? 'ok  ' : 'FAIL'} ${view}: ${m.words} words, ${m.low.length} under 4.5:1, ${m.small.length} under 12px, ${m.hard.length} hard shadows, ${m.poster.length} poster colours, sideways ${Math.max(0, m.scroll)}px`);
  }
  ok(!fullAdGround(scope.landing), `${tag}: the landing is on the editor's ground, rgb(${scope.landing})`);
  ok(!fullAdGround(scope.plans), `${tag}: the plans page over the editor is on the editor's ground, rgb(${scope.plans})`);
  console.log(`  ${fullAdGround(scope.landing) || fullAdGround(scope.plans) ? 'FAIL' : 'ok  '} the scope: the landing rgb(${scope.landing}), the plans rgb(${scope.plans})`);
  ok(!errors.length, tag + ': page errors or CSP refusals: ' + errors.slice(0, 4).join(' | '));
  report[tag] = { views, errors };
}
await browser.close(); server.close();
if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify(report, null, 1));
console.log(fails.length ? `\n${fails.length} FAILED:\n- ` + fails.join('\n- ') : '\nall passed');
process.exit(fails.length ? 1 : 0);
