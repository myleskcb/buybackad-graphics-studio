#!/usr/bin/env node
/* THE DOWNLOAD IS THE PREVIEW, AND THE PICTURE IS ON IT (DESIGN-LAW 141).

   The owner, 2026-11-13, of a Neon Vault ad downloaded from Easy Mode: "This isn't really a
   cohesive ad. How did this come out the engine? How do we avoid this mistake? Where are the
   assets?" It had come out on a two-stop gradient with no photograph and no product: the card's
   own photograph was a grey "placeholder" in the preview until a background was picked, and a
   download made without a pick dropped it. Neon Vault is the first card a new visitor opens.
   The gate passed it, and so did every audit: motion_audit, motion_gallery, type_gap_audit and
   every_card_audit each set `ez.bgPicked = true` before they measured, so they measured the one
   state a first-time customer was never in.

   This check takes no such step. Each card is opened the way a visitor opens it, a number is
   typed, and the real Download is pressed. It fails when:

     popup      anything stands between Download and the file (a pop-up left showing);
     nofile     Download gave no file;
     differs    the file is not the picture the preview showed (both drawn small and compared);
     picture    the card stands on a photograph and the file was drawn without it;
     gate       the gate fails the card as opened.

   And it lists, without failing, the cards that open with nothing on them that shows the goods
   (a flat ground and no product picture): words-only designs. `--strict` fails those too.

   usage:  python3 -m http.server 8899   (in the repo), then
           [GFX_BASE=http://127.0.0.1:8899/] [FABRIC_JS=/path/fabric.min.js] [PLAYWRIGHT_MODULE=...]
           node scripts/ez_download_is_preview.mjs [--all | --first | --ids a,b] [--strict] [--json out.json] [--shots dir]
   Default: the first card of every category (what a new visitor is handed) and every designer
   layout (dl_*, the cards that had the placeholder). --all takes every offered card (about
   fifteen minutes). Exits 1 on a failure. FABRIC_JS serves the studio's fabric from disk on a
   machine that cannot reach cdnjs (npm pack fabric@5.3.0, package/dist/fabric.min.js). */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8899/').replace(/\/?$/, '/');
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : ''; };
const ALL = process.argv.includes('--all'), FIRST = process.argv.includes('--first'), STRICT = process.argv.includes('--strict');
const IDS = arg('--ids') ? arg('--ids').split(',').filter(Boolean) : null, JSON_OUT = arg('--json'), SHOTS = arg('--shots');
const DIFF_MAX = 9;                 // mean difference a channel, of 255, between the preview (a 560 JPEG) and the file (a PNG), both at 48 px

const open = async browser => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
  if (process.env.FABRIC_JS) {
    const fabricJs = readFileSync(process.env.FABRIC_JS), origin = new URL(BASE).origin;
    await page.route('**/*', route => {
      const url = route.request().url();
      if (/\/fabric(\.min)?\.js(\?|$)/.test(url)) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fabricJs });
      if (url.startsWith(origin) || url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
      return route.abort();
    });
  }
  await page.goto(BASE + '?demo=1', { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => typeof buildLayer === 'function' && typeof renderEzCanvas === 'function' && typeof TEMPLATES !== 'undefined' && typeof pgCheck === 'function', null, { timeout: 90000 });
  await page.waitForTimeout(2500);
  await page.evaluate(() => {
    account = { email: 'audit@local', role: 'admin', plan: 'pro' }; loadAccount = async () => account;
    /* counting the download against a plan is not this check's subject, and the audit's account
       is in no store to count it in (demo mode's counter threw on it and no file came) */
    recordExport = async () => true;
    /* the file Download hands the browser, kept instead of saved */
    window.__dl = [];
    const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { if (this.download && this.href) { window.__dl.push({ name: this.download, href: this.href }); return; } return click.apply(this, arguments); };
  });
  return { ctx, page, errors };
};

const browser = await chromium.launch();
let { ctx, page, errors } = await open(browser);
const plan = await page.evaluate(({ ALL, FIRST, IDS }) => {
  /* what a visitor can open: each category's strip as it is drawn (catTemplates leaves out the
     cards held by the gate tables and the retired ones), in the strip's own order */
  const cats = [...new Set(TEMPLATES.filter(t => !t.showcase).map(t => t.cat))], first = [], offered = [], seen = new Set(), keep = currentCat;
  for (const c of cats) { try { setCategory(c); const l = catTemplates().filter(t => !t.showcase); if (l[0]) first.push(l[0].id); l.forEach(t => { if (!seen.has(t.id)) { seen.add(t.id); offered.push(t); } }); } catch (e) {} }
  try { setCategory(keep); } catch (e) {}
  let ids = IDS || (ALL ? offered.map(t => t.id) : FIRST ? first : [...new Set([...first, ...offered.filter(t => /^dl_/.test(t.id)).map(t => t.id)])]);
  return { ids, first, offered: offered.length, firstFree: typeof firstFreeTplId === 'function' ? firstFreeTplId() : null };
}, { ALL, FIRST, IDS });
console.log(`${plan.ids.length} of ${plan.offered} offered cards; a new visitor opens on ${plan.firstFree}`);

const rows = {};
for (let i = 0; i < plan.ids.length; i += 12) {
  if (i && i % 96 === 0) { await ctx.close(); ({ ctx, page, errors } = await open(browser)); }
  const batch = plan.ids.slice(i, i + 12);
  Object.assign(rows, await page.evaluate(async ({ batch, DIFF_MAX, wantShots }) => {
    const small = url => new Promise(res => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 48;
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0, 48, 48); res(x.getImageData(0, 0, 48, 48).data); }; im.onerror = () => res(null); im.src = url; });
    const out = {};
    for (const id of batch) {
      const row = { fails: [] };
      try {
        try { localStorage.removeItem('pgfx_ez_state'); } catch (e) {}
        const t = TEMPLATES.find(x => x.id === id); if (!t) { out[id] = { skip: 'not a template' }; continue; }
        if (currentCat !== t.cat) setCategory(t.cat);
        ez.bg = null; ez.bgRecId = null; ez.bgData = null; ez.bgImgObj = null; ez.theme = null; ez.voice = null; ez.shade = 0;   // a fresh visitor has picked nothing
        showEasy(id);
        if (ez.tpl !== id) { out[id] = { skip: 'opened ' + ez.tpl }; continue; }
        await ensureTplAssets(ezTpl()); await document.fonts.ready;
        document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));       // the area dialog a first visit opens on (flow audit, finding 3) is not this check's
        $('ez-phone').value = '(562) 555-0142';
        const preview = renderEzCanvas(560, 'jpeg');                 // what schedEzPreview puts in #ez-preview
        /* the card as opened, read by the gate */
        const sc = renderEzCanvas(1080, 'png', undefined, undefined, 'square', true), r = pgCheck(sc);
        row.picture = r.picture; row.gate = r.fails.map(f => f.code + (f.line ? ':' + f.line : '')); row.warns = r.warns.map(f => f.code);
        row.wantsPhoto = !!(t.bg && t.bg.type === 'image' && t.bg.src && !(typeof isDrawnSrc === 'function' && isDrawnSrc(t.bg.src)));
        sc.dispose();
        /* the real Download */
        window.__dl.length = 0;
        const fmt = ez.format; ez.format = 'square';
        await ezDownload();
        ez.format = fmt;
        const up = [...document.querySelectorAll('.modal-overlay.show')].map(m => m.id);
        up.forEach(m => document.getElementById(m).classList.remove('show'));
        if (up.length) row.fails.push('popup: ' + up.join(', '));
        const file = window.__dl[0];
        if (!file) { if (!up.length) row.fails.push('nofile'); }
        else {
          row.name = file.name;
          const [a, b] = await Promise.all([small(preview), small(file.href)]);
          if (!a || !b) row.fails.push('differs: a picture would not load');
          else { let d = 0; for (let k = 0; k < a.length; k += 4) d += Math.abs(a[k] - b[k]) + Math.abs(a[k + 1] - b[k + 1]) + Math.abs(a[k + 2] - b[k + 2]);
            row.diff = +(d / (48 * 48 * 3)).toFixed(2); if (row.diff > DIFF_MAX) row.fails.push('differs: ' + row.diff + ' a channel'); }
          if (wantShots) { row.preview = preview; row.file = file.href; }
        }
        if (row.picture && row.picture.missing) row.fails.push('picture: ' + row.picture.missing + ' was not drawn');
        else if (row.wantsPhoto && row.picture && row.picture.ground !== 'photo') row.fails.push('picture: stands on a photograph, drawn on ' + row.picture.ground);
        if (row.gate.length) row.fails.push('gate: ' + row.gate.join(', '));
      } catch (e) { row.fails.push('error: ' + String(e).slice(0, 140)); }
      out[id] = row;
    }
    return out;
  }, { batch, DIFF_MAX, wantShots: !!SHOTS }));
  process.stdout.write(`…${Math.min(plan.ids.length, i + 12)}/${plan.ids.length}\n`);
}
if (SHOTS) {
  mkdirSync(SHOTS, { recursive: true });
  for (const [id, r] of Object.entries(rows)) for (const k of ['preview', 'file']) if (r[k]) { writeFileSync(join(SHOTS, `${id}.${k}.${k === 'preview' ? 'jpg' : 'png'}`), Buffer.from(r[k].split(',')[1], 'base64')); delete r[k]; }
}
await browser.close();

const list = Object.entries(rows), bad = list.filter(([, r]) => r.fails && r.fails.length), skipped = list.filter(([, r]) => r.skip);
const bare = list.filter(([, r]) => r.warns && r.warns.includes('noPicture'));
const by = {}; bad.forEach(([, r]) => r.fails.forEach(f => { const c = f.split(':')[0]; by[c] = (by[c] || 0) + 1; }));
const grounds = {}; list.forEach(([, r]) => { if (r.picture) grounds[r.picture.ground] = (grounds[r.picture.ground] || 0) + 1; });
const diffs = list.map(([, r]) => r.diff).filter(d => d != null).sort((a, b) => a - b);
console.log(`\nopened ${list.length - skipped.length}: on a photograph ${grounds.photo || 0}, a drawn ground ${grounds.drawn || 0}, a flat colour ${grounds.flat || 0}`);
if (diffs.length) console.log(`the file against the preview: median ${diffs[Math.floor(diffs.length / 2)]}, largest ${diffs[diffs.length - 1]} a channel of 255 (limit ${DIFF_MAX})`);
for (const [id, r] of bad.slice(0, 40)) console.log(`  FAIL ${id}${plan.first.includes(id) ? ' (first in its category)' : ''}: ${r.fails.join('; ')}`);
if (bad.length > 40) console.log(`  … and ${bad.length - 40} more`);
if (skipped.length) console.log(`skipped ${skipped.length}: ${skipped.slice(0, 6).map(([id, r]) => id + ' (' + r.skip + ')').join(', ')}`);
if (bare.length) console.log(`${STRICT ? '  FAIL ' : 'note: '}${bare.length} card${bare.length === 1 ? ' opens' : 's open'} with nothing that shows the goods (a flat ground, no product picture): ${bare.slice(0, 12).map(([id]) => id).join(', ')}${bare.length > 12 ? ', …' : ''}`);
if (errors.length) console.log('page errors: ' + errors.slice(0, 3).join(' | '));
if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ plan, rows }, null, 1));
const failed = bad.length || errors.length || (STRICT && bare.length);
console.log(failed ? `\n${bad.length} failing (${Object.entries(by).map(([k, v]) => k + ' ' + v).join(', ')})` : '\nall clear: every card downloads the picture its preview showed, with its photograph on it');
process.exit(failed ? 1 : 0);
