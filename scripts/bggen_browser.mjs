/* Part 3 of scripts/bggen_check.mjs: the generate modal in Chromium, under the
   production CSP, against the real function (stand-in blobs, stand-in fal).
   FABRIC_JS=/path/fabric.min.js when cdnjs is out of reach; SHOT_DIR=/folder
   keeps a screenshot of each screen. */
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { join, extname } from 'node:path';

async function serve(ROOT, api, csp) {
  const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
  const server = createServer(async (req, res) => {
    try {
      const u = new URL(req.url, 'http://127.0.0.1');
      if (u.pathname.startsWith('/api/')) {
        const chunks = []; for await (const c of req) chunks.push(c);
        const r = await api(new Request('https://studio.example' + u.pathname + u.search, { method: req.method, headers: req.headers, body: chunks.length ? Buffer.concat(chunks) : undefined }));
        const h = {}; r.headers.forEach((v, k) => { h[k] = v; });
        res.writeHead(r.status, h); res.end(Buffer.from(await r.arrayBuffer())); return;
      }
      let f = join(ROOT, decodeURIComponent(u.pathname));
      if (u.pathname.endsWith('/')) f = join(f, 'index.html');
      if (!f.startsWith(ROOT) || !existsSync(f)) { res.writeHead(404); res.end('404'); return; }
      res.writeHead(200, Object.assign({ 'Content-Type': TYPES[extname(f)] || 'application/octet-stream' }, csp ? { 'Content-Security-Policy': csp } : {}));
      res.end(readFileSync(f));
    } catch (e) { res.writeHead(500); res.end(String(e)); }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { base: 'http://localhost:' + server.address().port, close: () => server.close() };
}

export async function browserCheck({ ROOT, ok, api, falCalls }) {
  let chromium;
  try { ({ chromium } = await import('playwright')); }
  catch (e) { ({ chromium } = await import(pathToFileURL(join(execSync('npm root -g').toString().trim(), 'playwright/index.mjs')).href)); }
  const csp = (readFileSync(join(ROOT, '_headers'), 'utf8').match(/Content-Security-Policy:\s*(.+)/) || [])[1];
  const srv = await serve(ROOT, api, csp);
  const BASE = srv.base;
  const fabricJs = process.env.FABRIC_JS ? readFileSync(process.env.FABRIC_JS) : null;
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
  const errors = [];
  const shot = async (page, name) => {
    if (!process.env.SHOT_DIR) return;
    mkdirSync(process.env.SHOT_DIR, { recursive: true });
    await page.waitForTimeout(250);
    await page.screenshot({ path: join(process.env.SHOT_DIR, 'bggen-' + name + '.png') });
  };
  const page0 = async (w, h) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h || 900 } });
    const page = await ctx.newPage();
    await page.route('**/*', (route) => {
      const url = route.request().url();
      if (url.startsWith(BASE)) return route.continue();
      if (/fabric(\.min)?\.js/.test(url) && fabricJs) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fabricJs });
      if (/^https:\/\/v3\.fal\.media\//.test(url)) return route.fulfill({ status: 200, contentType: 'image/jpeg', body: readFileSync(join(ROOT, 'assets/bggen-refs/qs-iphone-17-pro-max.jpg')), headers: { 'Access-Control-Allow-Origin': '*' } });
      return route.abort();
    });
    page.on('console', (m) => { if (m.type() === 'error' && /Content Security Policy|Refused to/.test(m.text())) errors.push(m.text().slice(0, 200)); });
    page.on('pageerror', (e) => { if (/bggen/.test(String(e.stack || e.message))) errors.push('page error: ' + e.message); });
    return page;
  };
  const signIn = async (page, email, signup) => {
    await page.goto(BASE + '/index.html');
    await page.waitForFunction(() => window.BGGEN && typeof window.showEasy === 'function', null, { timeout: 30000 });
    const token = await page.evaluate(async ([email, signup]) => {
      const r = await fetch('/api/auth/' + (signup ? 'signup' : 'login'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'a-long-password' }) });
      return (await r.json()).token;
    }, [email, signup]);
    await page.evaluate((t) => localStorage.setItem('pgfx_token', JSON.stringify(t)), token);
    await page.goto(BASE + '/index.html');
    await page.waitForFunction(() => window.BGGEN && typeof window.showEasy === 'function', null, { timeout: 30000 });
    await page.evaluate(() => showEasy(null));
    await page.waitForFunction(() => { try { return !!account; } catch (e) { return false; } }, null, { timeout: 30000 });
    await page.evaluate(() => document.querySelectorAll('.modal-overlay.show').forEach((m) => m.classList.remove('show')));
    return token;
  };
  const openModal = async (page) => {
    await page.evaluate(() => openBgGen());
    await page.waitForSelector('#bggen-overlay.show #bggen-grid .bggen-tile', { timeout: 20000 });
    await page.waitForFunction(() => /left|unlimited/.test(document.getElementById('bggen-bal').textContent), null, { timeout: 20000 });
  };
  const foot = (page) => page.evaluate(() => ({
    cost: document.getElementById('bggen-cost').textContent, bal: document.getElementById('bggen-bal').textContent,
    go: document.getElementById('bggen-go').textContent, disabled: document.getElementById('bggen-go').disabled,
    short: document.getElementById('bggen-cost').classList.contains('short'),
  }));
  const tile = (page, label) => page.locator('#bggen-grid .bggen-tile', { has: page.locator('.bggen-name', { hasText: new RegExp('^' + label.replace(/[()]/g, '\\$&') + '$') }) }).first();

  try {
    /* ---- a free account: pick, price, generate, use ---- */
    const page = await page0(1280);
    await signIn(page, 'shop@x.example', true);
    const nav = await page.locator('#nav-genbg').isVisible();
    if (nav) await page.click('#nav-genbg'); else await page.evaluate(() => openBgGen());
    await page.waitForSelector('#bggen-overlay.show #bggen-grid .bggen-tile', { timeout: 20000 });
    await page.waitForFunction(() => /left/.test(document.getElementById('bggen-bal').textContent), null, { timeout: 20000 });
    const first = await page.evaluate(() => ({
      cats: document.querySelectorAll('#bggen-cats .chip').length, on: (document.querySelector('#bggen-cats .chip.on') || {}).dataset.cat,
      tabs: [...document.querySelectorAll('#bggen-tabs .bggen-tab')].map((t) => t.textContent),
      tiles: document.querySelectorAll('#bggen-grid .bggen-tile').length,
      name: document.querySelector('#bggen-grid .bggen-tile .bggen-name').textContent,
      styles: document.querySelectorAll('#bggen-styles .chip').length, pals: document.querySelectorAll('#bggen-pals .chip').length,
      count: document.querySelectorAll('#bggen-count button').length,
    }));
    ok(first.cats === 13 && first.on === 'phones' && first.tabs[0] === 'iPhone' && first.tiles >= 20 && first.name === 'iPhone 18 Pro Max', 'browser: the modal opens on Phones, iPhone tab, newest first (' + JSON.stringify(first) + ')');
    ok(first.styles >= 8 && first.pals >= 10 && first.count === 4, 'browser: styles, colour schemes and 1-4 images offered');
    await page.waitForFunction(() => { const i = document.querySelector('#bggen-grid .bggen-tile img'); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 10000 });
    let f = await foot(page);
    ok(/1 credit\b/.test(f.cost) && /^5 credits left · this month · resets/.test(f.bal) && /Generate 1 image · 1 credit/.test(f.go), 'browser: the footer prices a plain scene and shows the plan\'s credits (' + JSON.stringify(f) + ')');
    await shot(page, 'open');

    await tile(page, 'iPhone 17 Pro Max').click();
    await tile(page, 'iPhone 16').click();
    await page.locator('#bggen-picked .bggen-sw[title="Teal"]').click();
    const picked = await page.evaluate(() => [...document.querySelectorAll('#bggen-picked .bggen-pick-name')].map((x) => x.textContent));
    ok(picked.length === 2 && picked[1] === 'iPhone 16 Teal', 'browser: two iPhones picked, the 16 in Teal (' + picked.join(' | ') + ')');
    f = await foot(page);
    ok(/2 credits/.test(f.cost) && /with products/.test(f.cost), 'browser: with products the price per image changes, live (' + f.cost + ')');
    await page.click('#bggen-styles .chip[data-style="neon"]');
    await page.click('#bggen-pals .chip[data-pal="custom"]');
    ok(await page.locator('#bggen-custom').isVisible(), 'browser: a custom colour scheme shows its colour pickers');
    await page.click('#bggen-pals .chip[data-pal="volt"]');
    await page.click('#bggen-count button[data-n="4"]');
    f = await foot(page);
    ok(/8 credits/.test(f.cost) && f.short && f.disabled && /Not enough credits/.test(f.go) && /Get more/.test(f.bal), 'browser: 4 images × 2 is 8, more than the 5 left: Generate holds, Get more offered (' + JSON.stringify(f) + ')');
    await page.click('#bggen-count button[data-n="2"]');
    f = await foot(page);
    ok(/4 credits/.test(f.cost) && !f.disabled && /Generate 2 images · 4 credits/.test(f.go), 'browser: 2 images × 2 is 4: Generate goes (' + f.go + ')');
    await page.selectOption('#bggen-aspect', '9:16');
    await page.fill('#bggen-prompt', 'iphones in the rain');
    await shot(page, 'configured');

    const calls = falCalls.length;
    await page.click('#bggen-go');
    await page.waitForFunction(() => document.querySelectorAll('#bggen-results .bggen-card').length === 2, null, { timeout: 5000 });
    await page.waitForFunction(() => [...document.querySelectorAll('#bggen-results .bggen-card')].every((c) => !c.classList.contains('busy')), null, { timeout: 30000 });
    const res = await page.evaluate(() => ({
      imgs: [...document.querySelectorAll('#bggen-results .bggen-card img')].filter((i) => i.complete && i.naturalWidth > 0).length,
      errs: document.querySelectorAll('#bggen-results .bggen-card.err').length,
      bal: document.getElementById('bggen-bal').textContent, go: document.getElementById('bggen-go').textContent, disabled: document.getElementById('bggen-go').disabled,
    }));
    ok(res.imgs === 2 && res.errs === 0, 'browser: two images land (' + JSON.stringify(res) + ')');
    ok(/^1 credit left/.test(res.bal) && res.disabled && /Not enough credits/.test(res.go), 'browser: the balance came down to 1 and Generate holds (' + JSON.stringify(res) + ')');
    ok(await page.evaluate(() => account.credits && account.credits.total === 1), 'browser: the studio\'s own credit count follows the run');
    const sent = falCalls.slice(calls);
    ok(sent.length === 2 && sent.every((c) => c.model === 'fal-ai/bytedance/seedream/v4/edit' && c.body.image_urls.some((u) => /qs-iphone-17-pro-max\.jpg$/.test(u)) && c.body.image_urls.some((u) => /qs-iphone-16-back--teal\.jpg$/.test(u)) && c.body.image_size.height === 2560 && /neon/i.test(c.body.prompt) && /#2563eb/.test(c.body.prompt) && /iphones, rain/.test(c.body.prompt)),
      'browser: fal got two edit calls with both reference photos, story size, neon, electric blue and the words');
    await shot(page, 'results');
    await page.locator('#bggen-results .bggen-card [data-a="use"]').first().click();
    await page.waitForFunction(() => !document.getElementById('bggen-overlay').classList.contains('show'), null, { timeout: 5000 });
    const used = await page.waitForFunction(() => { try { return ez.bg && ez.bg.type === 'image' && /^data:image\//.test(ez.bgData); } catch (e) { return false; } }, null, { timeout: 15000 }).then(() => true).catch(() => false);
    ok(used, 'browser: Use as background puts the image behind the Easy Mode ad');

    /* the cars, searched */
    await openModal(page);
    await page.click('#bggen-cats .chip[data-cat="cars"]');
    ok(await page.locator('#bggen-search').isVisible(), 'browser: Cars has a search');
    await page.fill('#bggen-search', 'tesla');
    const teslas = await page.evaluate(() => [...document.querySelectorAll('#bggen-grid .bggen-tile .bggen-name')].map((n) => n.textContent));
    ok(teslas.length >= 5 && teslas.every((n) => /Tesla/.test(n)), 'browser: searching tesla finds only Teslas (' + teslas.length + ')');
    await shot(page, 'cars');
    await page.context().close();

    /* ---- a phone ---- */
    const phone = await page0(390, 844);
    await signIn(phone, 'shop@x.example', false);
    await openModal(phone);
    const fit = await phone.evaluate(() => {
      const m = document.querySelector('#bggen-overlay .modal').getBoundingClientRect();
      const ft = document.querySelector('.bggen-foot').getBoundingClientRect();
      return { sw: document.documentElement.scrollWidth, mw: Math.round(m.width), left: Math.round(m.left), footBottom: Math.round(ft.bottom), h: innerHeight,
        overflow: [...document.querySelectorAll('#bggen-overlay *')].filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
          // a strip that scrolls sideways on its own (the product tabs) is not the page scrolling
          .filter((e) => { for (let a = e.parentElement; a; a = a.parentElement) { if (/auto|scroll|hidden/.test(getComputedStyle(a).overflowX)) return a.getBoundingClientRect().right > innerWidth + 1; } return true; })
          .map((e) => e.id || e.className).slice(0, 3) };
    });
    ok(fit.sw <= 390 && fit.left >= 0 && fit.mw <= 390 && fit.footBottom <= fit.h && !fit.overflow.length, 'browser: at 390 px no sideways scroll and the price stays on screen (' + JSON.stringify(fit) + ')');
    await shot(phone, 'phone');
    await phone.context().close();

    /* ---- an operator ---- */
    const op = await page0(1280);
    await signIn(op, 'boss@studio.example', false);
    await openModal(op);
    await tile(op, 'iPhone 17 Pro').click();
    const of = await foot(op);
    ok(/Operator · unlimited/.test(of.bal) && /\$0\.0\d at fal/.test(of.cost), 'browser: an operator is unlimited and sees the provider price (' + JSON.stringify(of) + ')');
    await op.evaluate(() => { document.getElementById('bggen-preview').open = true; });
    await op.waitForFunction(() => /Apple iPhone 17 Pro/.test(document.getElementById('bggen-preview-text').textContent), null, { timeout: 10000 });
    ok(true, 'browser: an operator sees the prompt the request would send');
    await shot(op, 'operator');
    await op.evaluate(() => { document.getElementById('bggen-overlay').classList.remove('show'); openAdminBg(); document.getElementById('bggen-admin').open = true; });
    await op.waitForFunction(() => /Provider: fal/.test(document.getElementById('bggen-admin-status').textContent), null, { timeout: 10000 });
    await op.fill('#bggen-admin-json', '{"maxPerRun":2}');
    await op.click('#bggen-admin-save');
    await op.waitForFunction(() => /Saved/.test(document.getElementById('bggen-admin-status').textContent), null, { timeout: 10000 });
    await op.fill('#bggen-grant-email', 'shop@x.example');
    await op.fill('#bggen-grant-n', '5');
    await op.click('#bggen-grant-go');
    await op.waitForFunction(() => /now has 6 AI credits/.test(document.getElementById('bggen-admin-status').textContent), null, { timeout: 10000 }).catch(() => {});
    ok(/now has 6 AI credits: 1 of this month's 5, and 5 bought/.test(await op.locator('#bggen-admin-status').textContent()), 'browser: the console saves the recipe and grants 5 credits (' + await op.locator('#bggen-admin-status').textContent() + ')');
    await op.fill('#bggen-admin-json', '');
    await op.click('#bggen-admin-save');
    await op.waitForFunction(() => /Cleared/.test(document.getElementById('bggen-admin-status').textContent), null, { timeout: 10000 });
    await shot(op, 'console');
    await op.context().close();
  } finally {
    await browser.close();
    srv.close();
  }
  ok(!errors.length, 'browser: no CSP refusals or bggen page errors (' + errors.slice(0, 3).join(' | ') + ')');
}
