#!/usr/bin/env node
/* THE ANY LOOK CALL TO ACTION AND PRE-FLIGHT, CHECKED (2026-11-18).

   The ad census of 2026-11-18 read the 246 looks of the video maker's Any look gallery: 214 had no
   call to action, and none was checked before it went out (the full ad has fullPreflight, rule 138).
   Since then a plain look's number always says what to do with it (engine.js defaultLabel, and the
   label kept over the tag when a layout is crowded), the label is drawn as a sticker where it would
   not read on what is behind it (_labelGuard), and every plain look is measured on its delivered
   picture before a download or a save (motion/look-preflight.js lookPreflight, the page's
   preflightGate), the gallery and New look passing over a look its pre-flight would stop.

   1. The engine, on looks drawn as the gallery draws them (each theme and each studio ground,
      in all four sizes): every one carries a call to action; the default label's words (English,
      Spanish, both, one promise once, a typed label kept); a subclass (FullAd, FeedAd) is left to
      its own label; the pre-flight runs on every look, passes most, and says what it finds.
   2. The page: Any look shows what the pre-flight found under the preview; every look the gallery
      shows passes it; an ordinary look downloads; a look with no number is stopped until the
      customer goes back.

   usage:  python3 -m http.server 8931   (in the repo), then
           [GFX_BASE=http://127.0.0.1:8931/] [N=24] [PLAYWRIGHT_MODULE=/path/to/playwright] node scripts/look_preflight_check.mjs
   Exit 1 on a failure. */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8931/').replace(/\/?$/, '/');
const N = +(process.env.N || 24);
let failed = 0;
const fail = m => { failed++; console.log('  FAIL ' + m); };
const ok = (c, m) => { if (c) console.log('  ok   ' + m); else fail(m); };

const browser = await chromium.launch();
let stopping = [];                                   // looks part 1 found its pre-flight stops, for the page's gate
const closeDialogs = async page => { for (let k = 0; k < 4 && await page.$('.vh-back'); k++) { await page.keyboard.press('Escape'); await page.waitForTimeout(250); } };
try {
  /* ---------- 1. the engine ---------- */
  {
    console.log('1. the engine: the call to action and the pre-flight on looks drawn as the gallery draws them');
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = []; page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
    await page.goto(BASE + 'motion/', { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => { const l = document.getElementById('loading'); return l && l.hidden; }, null, { timeout: 120000 });
    const R = await page.evaluate(async (N) => {
      const E = await import('/motion/engine.js'), C = await import('/motion/catalog.js'), P = await import('/motion/look-preflight.js'), A = await import('/motion/accents.js');
      const { phones, index } = await E.loadPhones('/motion/phones/', C.DEFAULT_PHONES);
      const assets = { phones, index, accents: await A.loadAccents('/assets/cutouts/') };
      const vibes = Object.keys(C.VIBES), bgs = C.OPTIONS.background, looks = [];
      const base = aspect => ({ ...C.DEFAULT_STYLE, ...C.CLASSIC, phones: C.DEFAULT_PHONES.slice(), number: '(619) 555-0142', area: 'San Diego', aspect });
      for (const aspect of ['1:1', '4:5', '9:16', '16:9']) for (let i = 0; i < N; i++) {
        // as shelfStyle draws a gallery look: a theme with its axes free, or a studio ground held; the customer's words held
        const seed = 3000 + i, locked = new Set(['phones', 'headline', 'tag', 'number', 'number_label', 'aspect', 'duration', 'vibe']);
        const b = { ...base(aspect), vibe: i % 2 ? vibes[(i * 7) % vibes.length] : 'none' };
        if (i % 2 === 0) { locked.add('background'); b.background = bgs[(i * 5) % bgs.length]; }
        const st = E.harmonise(E.randomize(b, seed, locked, [], false), locked, {});
        await E.loadFonts(E.fontsFor(st));
        const [w0, h0] = E.ASPECTS[aspect], k = 540 / Math.min(w0, h0);
        let row = { aspect, seed, look: (st.vibe !== 'none' ? st.vibe : st.background), st };
        try {
          const ad = new E.Ad(st, assets, Math.round(w0 * k), Math.round(h0 * k));
          const t0 = performance.now(), rep = P.lookPreflight(ad), ms = performance.now() - t0;
          if (rep.lookOk) delete row.st;
          Object.assign(row, { cta: !!(ad.num && ad.num.label), label: ad.num && ad.num.cta ? (ad.st.cta || 'TEXT NOW') : ad.st.number_label, sticker: !!ad.num.labelRing, ms, ok: rep.ok, lookOk: rep.lookOk,
            fixes: rep.findings.filter(f => f.level === 'fix').map(f => f.say), notes: rep.findings.filter(f => f.level === 'note').length, shape: rep.checks.map(c => c.id).join(',') });
        } catch (e) { row.error = String(e && e.stack || e).slice(0, 240); }
        looks.push(row);
      }
      // the default label's words
      const lab = s => E.defaultLabel({ ...base('1:1'), ...s });
      const words = {
        plain: lab({ headline: 'WE BUY PHONES', lang: 'en' }), repeat: lab({ headline: 'TEXT US YOUR IPHONE', lang: 'en' }),
        es: lab({ headline: 'COMPRAMOS IPHONES', lang: 'es' }), both: lab({ headline: 'WE BUY PHONES', lang: 'both' }),
      };
      const draw = s => { const st = E.harmonise({ ...base('1:1'), seed: 77, ...s }, new Set(), {}); return new E.Ad(st, assets, 540, 540); };
      const typed = draw({ number_label: 'TEXT JOE' }), empty = draw({ number_label: '' });
      class Own extends E.Ad {}
      const sub = new Own(E.harmonise({ ...base('1:1'), seed: 77, number_label: '' }, new Set(), {}), assets, 540, 540, { plan: false });
      // what the customer typed is theirs: no number is a fix for the download, not for the look; an old phrase is a note
      const noNum = P.lookPreflight(draw({ number: '' })), old = P.lookPreflight(draw({ headline: 'HIGHEST CASH FOR IPHONES' }));   // HIGHEST: banned on every line (TOP DOLLAR is said again since rule 180)
      return { looks, words, typed: typed.st.number_label, typedDrawn: !!typed.num.label, empty: empty.st.number_label, sub: sub.st.number_label,
        noNum: { ok: noNum.ok, lookOk: noNum.lookOk, says: noNum.findings.map(f => f.level + ': ' + f.say) }, old: old.findings.filter(f => f.code === 'words').map(f => f.level + ': ' + f.say) };
    }, N);
    const L = R.looks, errs = L.filter(r => r.error), withCta = L.filter(r => r.cta), pass = L.filter(r => r.lookOk);
    ok(!errs.length, `the pre-flight runs on every look (${L.length} looks${errs.length ? '; ' + errs[0].aspect + ' ' + errs[0].seed + ': ' + errs[0].error : ''})`);
    ok(withCta.length === L.length, `every look carries a call to action over its number (${withCta.length} of ${L.length}; ${L.filter(r => r.sticker).length} set as a sticker where the ground would not carry it)`);
    for (const a of ['1:1', '4:5', '9:16', '16:9']) {
      const A = L.filter(r => r.aspect === a && !r.error), p = A.filter(r => r.lookOk);
      ok(A.length && p.length / A.length >= .85, `${a}: ${p.length} of ${A.length} looks pass their own pre-flight (85% at least), ${Math.round(A.reduce((s, r) => s + r.ms, 0) / Math.max(1, A.length))} ms a look at 540`);
    }
    for (const r of L.filter(r => !r.error && !r.lookOk).slice(0, 6)) console.log(`       stopped: ${r.aspect} seed ${r.seed} (${r.look}): ${r.fixes.join(' ')}`);
    ok(L.every(r => r.error || r.shape === 'edge,reads,feed,cta,words'), 'every report has its five checks: edge, reads, feed, cta, words');
    ok(R.words.plain === 'CALL OR TEXT' && R.words.repeat === 'CALL NOW' && R.words.es === 'LLAMA O MANDA TEXTO' && /^CALL OR TEXT . LLAMA O ESCRIBE$/.test(R.words.both),
      `the default label: ${JSON.stringify(R.words)} (a headline that says TEXT gets CALL NOW: one promise, once)`);
    ok(R.typed === 'TEXT JOE' && R.typedDrawn, 'a label the customer typed is drawn as typed');
    ok(R.empty === 'CALL OR TEXT', `an empty label draws the default (${JSON.stringify(R.empty)})`);
    ok(R.sub === '', 'a subclass of the engine (FullAd, FeedAd) is left to its own label');
    ok(!R.noNum.ok && R.noNum.lookOk && R.noNum.says.some(s => /no phone number/.test(s)), `no number: the download is stopped, the look is not passed over (${R.noNum.says[0] || 'nothing said'})`);
    ok(R.old.length && R.old.every(s => /^note: In the headline: "Highest"/.test(s)), `an old phrase typed in the headline is a note (${R.old[0] || 'nothing said'})`);
    ok(!errors.length, 'no page errors' + (errors.length ? ': ' + errors[0] : ''));
    stopping = L.filter(r => !r.error && !r.lookOk && r.st).map(r => r.st);
    await page.close();
  }

  /* ---------- 2. the page ---------- */
  {
    console.log('2. the page: Any look checked under the preview, the gallery, the download gate');
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, acceptDownloads: true });
    await ctx.addInitScript(() => { try { localStorage.setItem('pgfx_local_demo', '1'); } catch (e) { /* none */ } });
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
    await page.goto(BASE + 'motion/', { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => document.getElementById('loading').hidden, null, { timeout: 120000 });
    // every look the gallery draws is kept, to be read again as the download reads it
    await page.evaluate(async () => {
      const eng = await import('/motion/engine.js'); window.__looks = [];
      const orig = eng.Ad.prototype.stillAt;
      eng.Ad.prototype.stillAt = function (ctx, ...a) { const r = orig.call(this, ctx, ...a); try { if (this.st && !this.st.full) window.__looks.push(this); } catch (e) { } return r; };
    });
    await page.fill('#f-number', '(619) 555-0142');
    await page.waitForFunction(() => { try { return (JSON.parse(localStorage.getItem('pgfx_motion_v1') || '{}').style || {}).number === '(619) 555-0142'; } catch (e) { return false; } }, null, { timeout: 20000 }).catch(() => {});
    await closeDialogs(page);
    await page.click('#mode [data-full="0"]');
    await page.waitForFunction(() => { const s = document.getElementById('look-checks-sum'); return s && /\d+ of \d+/.test(s.textContent); }, null, { timeout: 30000 }).catch(() => {});
    const box = await page.evaluate(() => { const b = document.getElementById('look-checks'); return b ? { shown: b.getClientRects().length > 0, sum: document.getElementById('look-checks-sum').textContent, items: [...document.querySelectorAll('#look-checks-list li')].map(li => li.textContent) } : null; });
    ok(box && box.shown && /\d+ of \d+/.test(box.sum), `Any look shows "Checked before it goes out" under the preview (${box ? box.sum + ': ' + box.items.slice(0, 5).join(' | ') : 'missing'})`);
    ok(await page.evaluate(() => { const b = document.getElementById('full-checks'); return !b || b.getClientRects().length === 0; }), "the full ad's own checks are put away");
    await page.locator('#looks').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelectorAll('#gallery .mo-thumb').length >= 12, null, { timeout: 120000 }).catch(() => {});
    const gal = await page.evaluate(async () => {
      const E = await import('/motion/engine.js'), P = await import('/motion/look-preflight.js');
      const shown = new Set([...document.querySelectorAll('#gallery .mo-thumb canvas')]);
      const seen = window.__looks.filter(ad => ad && ad.W <= 400), out = [];
      for (const ad of seen) {
        const k = 540 / Math.min(ad.W, ad.H), big = new E.Ad(ad.plan ? ad.plan.st : ad.st, ad.assets, Math.round(ad.W * k), Math.round(ad.H * k), ad.plan ? { plan: ad.plan } : {});
        const rep = P.lookPreflight(big);
        out.push({ seed: ad.st.seed, lookOk: rep.lookOk, cta: !!(ad.num && ad.num.label), fixes: rep.findings.filter(f => f.level === 'fix').map(f => f.say) });
      }
      return { thumbs: shown.size, read: out };
    });
    ok(gal.read.length >= 12, `the gallery drew its looks (${gal.thumbs} thumbnails, ${gal.read.length} read again at 540)`);
    const bad = gal.read.filter(r => !r.lookOk);
    ok(!bad.length, `every look the gallery shows passes the pre-flight the download runs (${gal.read.length - bad.length} of ${gal.read.length}${bad.length ? '; seed ' + bad[0].seed + ': ' + bad[0].fixes[0] : ''})`);
    ok(gal.read.every(r => r.cta), `every gallery look carries a call to action (${gal.read.filter(r => r.cta).length} of ${gal.read.length})`);
    // an ordinary look downloads as it is
    await closeDialogs(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 120000 }).catch(() => null), page.click('#download-jpg')]);
    ok(!!dl && /\.jpg$/.test(dl.suggestedFilename()), `Download JPG saves an ordinary look with no stop (${dl ? dl.suggestedFilename() : 'no download'})`);
    // a look its pre-flight stops (one part 1 found), opened as a saved look: stopped until the customer goes back
    let tried = 0, stopped = false, said = '';
    for (const st of stopping.slice(0, 3)) {
      tried++;
      await closeDialogs(page);
      await page.evaluate(st => localStorage.setItem('pgfx_motion_v1', JSON.stringify({ style: { ...st, number: '(619) 555-0142' }, locked: ['phones', 'headline', 'tag', 'number', 'number_label', 'aspect', 'duration', 'vibe', 'background'], full: false })), st);
      await page.reload({ waitUntil: 'load' });
      await page.waitForFunction(() => document.getElementById('loading').hidden, null, { timeout: 120000 });
      await page.waitForFunction(() => { const s = document.getElementById('look-checks-sum'); return s && /\d+ of \d+/.test(s.textContent); }, null, { timeout: 30000 }).catch(() => {});
      const bad = await page.evaluate(() => /bad/.test(document.getElementById('look-checks-sum').className));
      if (!bad) continue;                              // drawn on the page, this look came out clear: try the next
      said = (await page.textContent('#look-note')).trim();
      await closeDialogs(page);
      await page.click('#download-jpg');
      stopped = await page.waitForFunction(() => /Check this ad before it goes out/.test(document.body.textContent), null, { timeout: 30000 }).then(() => true).catch(() => false);
      if (stopped) { await page.getByRole('button', { name: 'Go back and fix it' }).click(); await page.waitForTimeout(500); }
      break;
    }
    ok(stopped, `a look its pre-flight stops: the page says so under the preview (${JSON.stringify(said.slice(0, 80))}) and the download stops until the customer chooses (${tried} tried)`);
    ok(!stopped || /waiting for its fix/.test(await page.textContent('#export-note')), `going back saves nothing (${JSON.stringify((await page.textContent('#export-note')).trim().slice(0, 60))})`);
    ok(!errors.length, 'no page errors' + (errors.length ? ': ' + errors[0] : ''));
    await ctx.close();
  }
} finally { await browser.close(); }
console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);
