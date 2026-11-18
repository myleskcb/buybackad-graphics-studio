#!/usr/bin/env node
/* THE BUYBACK.AD MARK, CHECKED (watermark.js, DESIGN-LAW 142).

   The owner, 2026-11-17, asked whether people can "just download the ad through their browser or
   natively or screenshot the ad and crop it", then "Yes, do it": the mark across the middle, on
   every preview a download would mark, and a download's size and marks from the server. Then "we
   don't want the content to be unreadable or not fun to look at": the mark is light. This fails
   when:

     one mark     the plans app.js downloads marked are not watermark.js's; the studio's or the
                  video maker's mark is not PgfxMark's;
     the lattice  a ninth of a marked picture is left clean (a crop would take the mark off), or
                  the mark is heavy (it moves the picture more than LIGHT a channel on average);
     previews     signed out or Free, the full ad's preview, a template's preview or the editor's
                  export preview is the clean picture; for a paid plan it is marked; signing in or
                  out does not draw them again;
     downloads    with a backend, the size and the marks are not the server's: a page made to say
                  Pro for a Free account still downloads marked at 1080; an answer without the
                  field is marked; a refusal (402) or a dropped connection gives no file; a Free
                  file is not made when the mark did not load;
     the video    the studio's player offers its own Download or picture-in-picture; a signed-out
                  visitor's preview video is made clean; a preview made marked is handed to a plan
                  that downloads clean, instead of the clean video being made;
     the maker    the video maker's player is clean for a signed-out visitor or a Free account,
                  or marked in a copy with no backend or for Pro;
     the words    a page still promises a "small" watermark;
     errors       any page error.

   With a backend, the API is a stand-in here (page.route), answering as netlify/functions/api.mjs
   does for the plan each case names.

   usage:  python3 -m http.server 8899   (in the repo), then
           [GFX_BASE=http://127.0.0.1:8899/] [FABRIC_JS=/path/fabric.min.js] [PLAYWRIGHT_MODULE=...] [SHEET=dir]
           node scripts/watermark_check.mjs
   SHEET=dir writes the full ad's preview marked and clean, and the maker's player both ways.
   Exits 1 on a failure. Written 2026-11-17 (OPEN-ITEMS §BH). */
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8899/').replace(/\/?$/, '/');
const ROOT = new URL('..', import.meta.url).pathname;
const SHEET = process.env.SHEET || '';
if (SHEET) mkdirSync(SHEET, { recursive: true });
const LIGHT = 14;                 // the most a marked picture may differ from the clean one, a channel on average
const fails = [], ok = (cond, what, more = '') => { console.log((cond ? '  ok   ' : '  FAIL ') + what + (more ? ' (' + more + ')' : '')); if (!cond) fails.push(what); };
const allErrors = [];

/* the API, as api.mjs answers it for one plan */
const PLAN = { free: { maxPx: 1080, watermark: true }, basic: { maxPx: 2160, watermark: false }, pro: { maxPx: 2160, watermark: false }, business: { maxPx: 2160, watermark: false } };
const serverFor = (plan, role = 'user', opts = {}) => (p) => {
  const user = { email: 'audit@local', plan, role, exports: { period: 'x', count: 0 }, credits: { allowance: 5, used: 0, left: 5, bought: 0, total: 5 } };
  if (p === '/me') return { json: { user } };
  if (p === '/export/check' || p === '/export') {
    if (opts.drop) return { abort: true };
    if (opts.refuse) return { status: opts.refuse, json: { error: 'Download limit reached for this week', user } };
    if (role === 'admin') return { json: { user, maxPx: 2160, watermark: false, remaining: null } };
    const j = { user, maxPx: PLAN[plan].maxPx, remaining: 3 };
    if (!opts.noField) j.watermark = PLAN[plan].watermark;
    return { json: j };
  }
  return null;
};

const browser = await chromium.launch();
const fabricJs = process.env.FABRIC_JS ? readFileSync(process.env.FABRIC_JS) : null;
const open = async ({ demo = true, token = null, server = null, path = '' } = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 }), page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => { const s = String(e).slice(0, 200); errors.push(s); allErrors.push(path + ': ' + s); });
  await page.addInitScript(([demo, token]) => {
    try {
      if (demo) localStorage.setItem('pgfx_local_demo', '1'); else localStorage.removeItem('pgfx_local_demo');
      if (token) localStorage.setItem('pgfx_token', JSON.stringify(token)); else localStorage.removeItem('pgfx_token');
    } catch (e) { /* none */ }
  }, [demo, token]);
  const origin = new URL(BASE).origin;
  ctx.server = server;
  await page.route('**/*', async route => {
    const req = route.request(), url = req.url();
    if (fabricJs && /\/fabric(\.min)?\.js(\?|$)/.test(url)) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fabricJs });
    if (url.startsWith(origin + '/api/')) {
      const r = ctx.server ? ctx.server(new URL(url).pathname.replace(/^\/api/, '')) : null;
      if (!r) return route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"not in this check"}' });
      if (r.abort) return route.abort('failed');
      return route.fulfill({ status: r.status || 200, contentType: 'application/json', body: JSON.stringify(r.json || {}) });
    }
    if (!fabricJs || url.startsWith(origin) || url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
    return route.abort();
  });
  await page.goto(BASE + path, { waitUntil: 'load', timeout: 120000 });
  return { ctx, page, errors };
};
const studio = async (opts = {}) => {
  const o = await open({ ...opts, path: opts.demo === false ? '' : '?demo=1' });
  await o.page.waitForFunction(() => typeof showEasy === 'function' && !!window.FullAdStudio && !!window.PgfxMark, null, { timeout: 90000 });
  await o.page.evaluate(() => {
    window.__dl = []; const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { if (this.download && this.href) { window.__dl.push({ name: this.download, href: this.href }); return; } return click.apply(this, arguments); };
    window.__plans = []; openPlans = m => { window.__plans.push(String(m)); };
    pgGateAsk = async () => true;               // a design's own pre-flight question is not this check's
  });
  return o;
};
const quiet = page => page.evaluate(() => document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show')));
/* the full ad's preview, once it shows what was last asked and says whether it is marked */
const faPreview = (page, marked) => page.waitForFunction(m => { const i = document.getElementById('fa-preview');
  return !!i && i.getAttribute('aria-busy') === 'false' && i.complete && i.naturalWidth > 0 && i.dataset.marked === String(m); }, marked, { timeout: 30000 })
  .then(() => page.evaluate(() => document.getElementById('fa-preview').src), () => null);

/* How a marked picture differs from its clean one: the share of pixels moved in each ninth, and
   the move a channel on average over the whole picture (both drawn at the same size first). */
const compare = (page, a, b) => page.evaluate(async ([a, b]) => {
  const px = async url => { const bmp = await createImageBitmap(await (await fetch(url)).blob());
    const c = document.createElement('canvas'); c.width = c.height = 540; const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(bmp, 0, 0, 540, 540); return g.getImageData(0, 0, 540, 540).data; };
  let p, q; try { [p, q] = await Promise.all([px(a), px(b)]); } catch (e) { return null; }
  const cells = Array(9).fill(0), per = 180 * 180; let sum = 0;
  for (let y = 0; y < 540; y++) for (let x = 0; x < 540; x++) {
    const k = (y * 540 + x) * 4, d = Math.abs(p[k] - q[k]) + Math.abs(p[k + 1] - q[k + 1]) + Math.abs(p[k + 2] - q[k + 2]);
    sum += d; if (d > 30) cells[Math.floor(y / 180) * 3 + Math.floor(x / 180)]++;
  }
  return { cells: cells.map(n => +(n / per * 100).toFixed(1)), mean: +(sum / (540 * 540 * 3)).toFixed(2) };
}, [a, b]);
const covered = (m, what) => {
  ok(!!m && Math.min(...m.cells) >= 0.8, what + ': the mark is in every ninth of the picture', m ? 'least ' + Math.min(...m.cells) + '% of a ninth moved, ' + m.cells.join(' ') : 'not compared');
  ok(!!m && m.mean <= LIGHT, what + ': and light', m ? m.mean + ' a channel on average, at most ' + LIGHT : 'not compared');
};
const same = (m, what) => ok(!!m && Math.max(...m.cells) < 0.8, what, m ? 'most ' + Math.max(...m.cells) + '% of a ninth moved' : 'not compared');
const save = (name, url) => { if (SHEET && url) writeFileSync(join(SHEET, name), Buffer.from(url.split(',')[1], 'base64')); };

/* ---------- one mark ---------- */
console.log('one mark');
{
  const app = readFileSync(join(ROOT, 'app.js'), 'utf8'), maker = readFileSync(join(ROOT, 'motion/app.js'), 'utf8');
  ok(/function drawWatermarkMarks\([^)]*\)\{[^}]*PgfxMark\.draw\(/.test(app), "the studio's mark is PgfxMark's (app.js drawWatermarkMarks)");
  ok(/function drawMarks\([^)]*\) \{[^}]*PgfxMark\.draw\(/.test(maker), "the video maker's mark is PgfxMark's (motion/app.js drawMarks)");
  ok(/if \(state\.marks && window\.PgfxMark\) window\.PgfxMark\.draw\(ctx, ad\.W, ad\.H\)/.test(maker), "the maker's player draws it while state.marks says so");
  for (const [f, re] of [['index.html', /<script src="watermark\.js"><\/script>\s*\n\s*<script src="platform-mix\.js"><\/script>[\s\S]*<script src="app\.js">/], ['motion/index.html', /<script src="\.\.\/watermark\.js" defer><\/script>[\s\S]*<script type="module" src="app\.js">/]])
    ok(re.test(readFileSync(join(ROOT, f), 'utf8')), f + ' loads watermark.js before the code that draws it');
  const pages = ['index.html', 'app.js', 'about.html', 'learn.html', ...readdirSync(join(ROOT, 'ads')).filter(f => f.endsWith('.html')).map(f => 'ads/' + f)];
  const small = pages.filter(f => { try { return /\bsmall (BUYBACK\.AD )?watermark\b/i.test(readFileSync(join(ROOT, f), 'utf8')); } catch (e) { return false; } });
  ok(!small.length, 'no page promises a "small" watermark', small.join(', '));
}

/* ---------- the studio, signed out (no backend) ---------- */
console.log('the studio, signed out');
{
  const { ctx, page, errors } = await studio();
  const plans = await page.evaluate(() => ({ app: Object.keys(PLANS).filter(k => PLANS[k].watermark).sort(), mark: PgfxMark.PLANS.slice().sort(),
    marked: ['free', 'basic', 'pro', 'business'].map(p => PgfxMark.marked(p, 'user')), admin: PgfxMark.marked('free', 'admin'), none: PgfxMark.marked(null) }));
  ok(JSON.stringify(plans.app) === JSON.stringify(plans.mark), "the plans app.js downloads marked are watermark.js's", JSON.stringify(plans.app) + ' against ' + JSON.stringify(plans.mark));
  ok(JSON.stringify(plans.marked) === '[true,false,false,false]' && plans.admin === false && plans.none === true, 'PgfxMark.marked: Free and no plan yes; Starter, Pro, Business and an operator no', JSON.stringify(plans));

  await page.evaluate(() => showEasy()); await quiet(page);
  const marked = await faPreview(page, true);
  ok(!!marked, "the full ad's preview, signed out, is drawn marked");
  /* the same preview with the mark held off, so only the mark differs: a paid plan's preview is
     laid out at its own larger size, which moves pixels everywhere by itself */
  await page.evaluate(() => { window.__pm = previewMarks; previewMarks = () => false; FullAdStudio.draw(); });
  const clean = await faPreview(page, false);
  await page.evaluate(() => { previewMarks = window.__pm; syncAcctUI(); });
  covered(marked && clean ? await compare(page, marked, clean) : null, "the full ad's preview");
  save('full-ad-marked.jpg', marked); save('full-ad-clean.jpg', clean);
  ok(!!await faPreview(page, true), 'the account read again, it is drawn marked again');
  await page.evaluate(() => { account = { email: 'audit@local', role: 'user', plan: 'pro', exports: { period: 'x', count: 0 } }; syncAcctUI(); });
  ok(!!await faPreview(page, false), 'signed in on Pro, the preview is drawn again, clean');
  await page.evaluate(() => { account = null; syncAcctUI(); });
  ok(!!await faPreview(page, true), 'signed out again, it is drawn marked again');

  /* a template's preview */
  await page.evaluate(() => { const b = [...document.querySelectorAll('#ez-strip .ez-tpl')].find(x => !/full ad/i.test(x.textContent)); b.click(); });
  await page.waitForFunction(() => !FullAdStudio.isOn() && document.getElementById('ez-preview').complete && document.getElementById('ez-preview').naturalWidth > 0, null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const tpl = await page.evaluate(() => ({ shown: document.getElementById('ez-preview').src, clean: renderEzCanvas(560, 'jpeg'), tpl: ez.tpl }));
  covered(await compare(page, tpl.shown, tpl.clean), "a template's preview (" + tpl.tpl + ')');
  await page.evaluate(() => { account = { email: 'audit@local', role: 'user', plan: 'basic', exports: { period: 'x', count: 0 } }; syncAcctUI(); });
  await page.waitForTimeout(1200);
  const tplPaid = await page.evaluate(() => ({ shown: document.getElementById('ez-preview').src, clean: renderEzCanvas(560, 'jpeg') }));
  same(await compare(page, tplPaid.shown, tplPaid.clean), "on Starter the template's preview is the clean picture");

  /* the studio's video: the preview video carries what the download would */
  await page.evaluate(() => { window.__vo = []; runVideoExport = async o => { window.__vo.push({ preview: !!o.preview, watermark: !!o.watermark }); }; document.getElementById('ez-phone').value = '(562) 555-0134'; });
  await page.evaluate(() => { account = null; syncAcctUI(); });
  await page.evaluate(() => ezDownloadVideo({ preview: true }));
  await page.evaluate(() => { account = { email: 'audit@local', role: 'user', plan: 'pro', exports: { period: 'x', count: 0 } }; });
  await page.evaluate(() => ezDownloadVideo({ preview: true }));
  const vo = await page.evaluate(() => window.__vo);
  ok(vo.length === 2 && vo[0].preview && vo[0].watermark && vo[1].preview && !vo[1].watermark, 'Create video: made marked signed out, clean on Pro', JSON.stringify(vo));
  /* the player: no Download of its own; a marked preview is made again clean for a plan that downloads clean */
  await page.evaluate(() => { window.__vo = []; previewVideo({ sc: { dispose() {} }, watermark: true, px: 1080, kind: 'ez', name: 'check', btn: null, actx: null },
    { blob: new Blob([new Uint8Array(32)], { type: 'video/webm' }), w: 64, h: 64, ext: 'webm', name: 'check.webm' }); });
  const player = await page.evaluate(() => { const v = document.querySelector('.vh-video video'); return v ? { list: v.getAttribute('controlslist') || '', pip: v.disablePictureInPicture } : null; });
  ok(!!player && /nodownload/.test(player.list) && player.pip === true, "the studio's video player has no Download or picture-in-picture of its own", JSON.stringify(player));
  await page.evaluate(() => { const b = document.getElementById('vh-mp4'); b && b.click(); });
  await page.waitForFunction(() => window.__vo.length > 0, null, { timeout: 10000 }).catch(() => {});
  const remade = await page.evaluate(() => window.__vo);
  ok(remade.length === 1 && !remade[0].preview && !remade[0].watermark, 'Download MP4 on Pro after a marked preview makes the clean video, not the marked one', JSON.stringify(remade));
  await page.evaluate(() => window.VideoHelp && VideoHelp.close && VideoHelp.close());

  /* the editor's export preview */
  await page.evaluate(() => { account = null; syncAcctUI(); openStudio(ez.tpl); });
  await page.waitForTimeout(3000);
  await page.evaluate(() => openExport());
  await page.waitForTimeout(1200);
  const ex = await page.evaluate(() => ({ shown: document.getElementById('export-preview').src, clean: snapshotPng(540, 'jpeg', 0.85) }));
  covered(await compare(page, ex.shown, ex.clean), "the editor's export preview");

  /* a Free file is not made when the mark did not load */
  const missing = await page.evaluate(async () => { const M = window.PgfxMark; delete window.PgfxMark;
    let out; try { await applyWatermark(snapshotPng(300, 'png'), 300, 300); out = 'made'; } catch (e) { out = 'refused'; }
    window.PgfxMark = M; return out; });
  ok(missing === 'refused', 'with the mark missing, a Free file is refused, not made clean', missing);
  ok(!errors.length, 'no page errors', errors.join(' | '));
  await ctx.close();
}

/* ---------- the studio with a backend: the server decides ---------- */
console.log('the studio with a backend (a stand-in answering as api.mjs)');
{
  const { ctx, page, errors } = await studio({ demo: false, token: 'check-token', server: serverFor('free') });
  await page.waitForFunction(() => !!account && account.plan === 'free', null, { timeout: 30000 }).catch(() => {});
  /* the page made to say Pro; the server says Free */
  const forged = await page.evaluate(async () => { account.plan = 'pro'; syncAcctUI(); const before = previewMarks(); const g = await gateExport(2160); return { before, g, after: previewMarks(), plan: account.plan }; });
  ok(forged.before === false, 'a page made to say Pro shows a clean preview (display only)');
  ok(!!forged.g && forged.g.px === 1080 && forged.g.watermark === true, 'and its download is the server\'s Free: 1080 and marked', JSON.stringify(forged.g));
  ok(forged.plan === 'free' && forged.after === true, 'the server\'s account replaces the page\'s, and the previews are marked again', JSON.stringify(forged));
  /* the full ad's real download, on that answer */
  await page.evaluate(() => { showEasy(); document.getElementById('ez-phone').value = '(562) 555-0134'; account.plan = 'pro'; window.__aw = []; const aw = applyWatermark; applyWatermark = (u, w, h) => { window.__aw.push([w, h]); return aw(u, w, h); }; pgGateAsk = async () => true; });
  await quiet(page);
  await faPreview(page, false);
  await page.evaluate(() => ezDownload());
  await page.waitForFunction(() => window.__dl.length > 0, null, { timeout: 30000 }).catch(() => {});
  const file = await page.evaluate(async () => { const d = window.__dl[0]; if (!d) return null; const b = await createImageBitmap(await (await fetch(d.href)).blob()); return { name: d.name, w: b.width, aw: window.__aw }; });
  ok(!!file && file.w === 1080 && file.aw.length === 1 && file.aw[0][0] === 1080, 'the full ad downloads at 1080, marked, on the server\'s word', JSON.stringify(file));
  /* the server's other answers */
  ctx.server = serverFor('free', 'user', { noField: true });
  const noField = await page.evaluate(() => gateExport(2160));
  ok(!!noField && noField.watermark === true, 'an answer without the watermark field is marked', JSON.stringify(noField));
  ctx.server = serverFor('pro');
  const pro = await page.evaluate(() => gateExport(2160));
  ok(!!pro && pro.px === 2160 && pro.watermark === false, 'Pro, on the server\'s word: 2160, clean', JSON.stringify(pro));
  ctx.server = serverFor('free', 'user', { refuse: 402 });
  const refused = await page.evaluate(async () => { window.__plans = []; const g = await gateExport(1080); return { g, plans: window.__plans.length }; });
  ok(refused.g === null && refused.plans === 1, 'out of downloads (402): no file, the plans instead', JSON.stringify(refused));
  ctx.server = serverFor('free', 'user', { drop: true });
  const dropped = await page.evaluate(() => gateExport(1080));
  ok(dropped === null, 'a dropped connection: no file', JSON.stringify(dropped));
  ok(!errors.length, 'no page errors', errors.join(' | '));
  await ctx.close();
}

/* ---------- the video maker's player ---------- */
console.log("the video maker's player");
const player = async (opts, want) => {
  const { ctx, page, errors } = await open({ ...opts, path: 'motion/' });
  const got = await page.waitForFunction(m => { const c = document.getElementById('preview'); return !!c && c.dataset.marked === String(m) && c.width > 0; }, want, { timeout: 60000 }).then(() => true, () => false);
  await page.waitForTimeout(2500);
  /* paused on the last frame, so two pages draw the same picture */
  const frame = await page.evaluate(async () => { const s = document.getElementById('scrub'); s.value = '1000'; s.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 600)); return document.getElementById('preview').toDataURL('image/png'); });
  return { ctx, page, errors, got, frame };
};
{
  const demo = await player({ demo: true }, false);
  ok(demo.got, 'a copy with no backend (demo): the player is clean, as its downloads are not gated');
  const out = await player({ demo: false }, true);
  ok(out.got, 'signed out: the player is marked');
  covered(await compare(out.page, out.frame, demo.frame), "the maker's player, signed out");
  save('maker-marked.png', out.frame); save('maker-clean.png', demo.frame);
  const free = await player({ demo: false, token: 'check-token', server: serverFor('free') }, true);
  ok(free.got, 'Free: the player is marked');
  const pro = await player({ demo: false, token: 'check-token', server: serverFor('pro') }, false);
  ok(pro.got, 'Pro: the player is clean');
  for (const p of [demo, out, free, pro]) { ok(!p.errors.length, 'no page errors', p.errors.join(' | ')); await p.ctx.close(); }
}

await browser.close();
console.log(fails.length ? '\n' + fails.length + ' FAILED:\n  ' + fails.join('\n  ') : '\nall clear');
process.exit(fails.length ? 1 : 0);
