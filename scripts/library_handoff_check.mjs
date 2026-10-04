#!/usr/bin/env node
/* THE IPHONES LA SIDE, CHECKED (docs/iphonesla-library/).

   The handoff is code for another repository, so it is run here before it is
   handed over:
   1. A stand-in BUYBACK.AD on 127.0.0.1:8897: the real router
      (netlify/lib/library.mjs) behind a key, and this checkout's files.
   2. docs/iphonesla-library/test_buybackad_library.py against it (Python
      3.9+, Pillow for the JPEG checks).
   3. docs/iphonesla-library/example_server.py on 127.0.0.1:8896, and its
      demo listing page driven in Chromium: the picker loads the library's
      ads, a search narrows them, a pick adds the ad to the listing's photos
      as a JPEG File, byte for byte the library's 1080 render.
   5. docs/iphonesla-library.zip holds exactly this folder's files, byte for
      byte (scripts/pack_iphonesla_library.sh makes it).

   4. With SNIPPETS_PYTHON (a Python that has flask, fastapi, httpx and
      pillow): the Flask and FastAPI code in README.md, taken out of the
      README as it stands, run against the stand-in: the routes, a dropped
      parameter, the partner name kept back, a JPEG, a 404.

   usage:  CHROME=/path/to/chrome [SHOT=listing.png] [SNIPPETS_PYTHON=venv/bin/python] node scripts/library_handoff_check.mjs
   Exits non-zero on any failure. */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join, extname } from 'node:path';
import puppeteer from 'puppeteer-core';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const HANDOFF = join(ROOT, 'docs/iphonesla-library');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const KEY = 'bbl_handoff_' + 'q'.repeat(32);
const SITE = 'http://127.0.0.1:8897', SHOP = 'http://127.0.0.1:8896';
const { libraryRoute } = await import(pathToFileURL(join(ROOT, 'netlify/lib/library.mjs')).href);
const bad = [], ok = (c, what) => { if (!c) bad.push(what); return c; };

/* 1. the stand-in BUYBACK.AD */
const TYPES = { '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.html': 'text/html', '.js': 'text/javascript' };
const site = createServer(async (q, s) => {
  const url = new URL(q.url, SITE);
  const p = url.pathname.replace(/^\/api/, '').replace(/\/$/, '') || '/';
  if (url.pathname.startsWith('/api/')) {
    const headers = new Headers();
    for (const h of ['authorization', 'x-library-key', 'accept']) if (q.headers[h]) headers.set(h, q.headers[h]);
    const r = await libraryRoute(new Request(url, { headers }), url, p, { LIBRARY_KEYS: 'iphonesla:' + KEY }, {
      fetchJson: async (u) => JSON.parse(readFileSync(join(ROOT, new URL(u).pathname), 'utf8')),
    });
    if (!r) { s.writeHead(404); return s.end(); }
    s.writeHead(r.status, Object.fromEntries(r.headers)); return s.end(Buffer.from(await r.arrayBuffer()));
  }
  const f = join(ROOT, decodeURIComponent(url.pathname));
  if (!f.startsWith(ROOT) || !existsSync(f) || !statSync(f).isFile()) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'Content-Type': TYPES[extname(f)] || 'application/octet-stream' }); s.end(readFileSync(f));
});
await new Promise((res) => site.listen(8897, '127.0.0.1', res));
const env = { ...process.env, BUYBACKAD_LIBRARY_URL: SITE, BUYBACKAD_LIBRARY_KEY: KEY };

/* 2. the Python client's own tests */
// not spawnSync: the stand-in above answers from this same process, and a blocked loop answers nothing
const ut = await new Promise((res) => {
  const c = spawn('python3', ['-m', 'unittest', 'test_buybackad_library', '-v'], { cwd: HANDOFF, env });
  let out = ''; c.stdout.on('data', (d) => { out += d; }); c.stderr.on('data', (d) => { out += d; });
  const t = setTimeout(() => c.kill(), 300000);
  c.on('close', (status) => { clearTimeout(t); res({ status, out }); });
});
const utOut = ut.out;
const ran = +(utOut.match(/Ran (\d+) test/) || [])[1] || 0, skipped = +(utOut.match(/skipped=(\d+)/) || [])[1] || 0;
ok(ut.status === 0 && ran >= 9 && !skipped, 'the Python tests: ' + utOut.split('\n').filter((l) => /FAIL|ERROR|Ran|OK|skipped/.test(l)).join(' | '));

/* 4. the README's Flask and FastAPI code, as written */
const snippets = {};
if (process.env.SNIPPETS_PYTHON) {
  const md = readFileSync(join(HANDOFF, 'README.md'), 'utf8');
  const block = (label) => (md.split('\n' + label + '\n\n```python\n')[1] || '').split('\n```')[0];
  const first = (await (await fetch(SITE + '/api/library/v1/ads?category=phones&limit=1', { headers: { Authorization: 'Bearer ' + KEY } })).json()).items[0].id;
  const checks = {
    'Flask:': `
from flask import Flask
app = Flask(__name__); app.register_blueprint(bp); c = app.test_client()
r = c.get('/api/buybackad-library/ads?category=gold&limit=2&secret=x'); assert r.status_code == 200 and len(r.get_json()['items']) == 2 and all(a['category'] == 'gold' for a in r.get_json()['items']), r.status_code
assert 'partner' not in c.get('/api/buybackad-library/index').get_json()
assert c.get('/api/buybackad-library/nope').status_code == 404
r = c.get('/api/buybackad-library/jpeg/${first}?max=600'); assert r.status_code == 200 and r.data[:3] == bytes([255, 216, 255]), r.status_code
assert c.get('/api/buybackad-library/jpeg/no-such-picture').status_code == 404
print('ok')`,
    'FastAPI:': `
from fastapi import FastAPI
from fastapi.testclient import TestClient
app = FastAPI(); app.include_router(router); c = TestClient(app)
r = c.get('/api/buybackad-library/ads?category=gold&limit=2&secret=x'); assert r.status_code == 200 and len(r.json()['items']) == 2 and all(a['category'] == 'gold' for a in r.json()['items']), r.status_code
assert 'partner' not in c.get('/api/buybackad-library/index').json()
assert c.get('/api/buybackad-library/nope').status_code == 404
r = c.get('/api/buybackad-library/jpeg/${first}?max=600'); assert r.status_code == 200 and r.content[:3] == bytes([255, 216, 255]), r.status_code
assert c.get('/api/buybackad-library/jpeg/no-such-picture').status_code == 404
print('ok')`,
  };
  for (const [label, test] of Object.entries(checks)) {
    const code = block(label);
    if (!ok(code.includes('lib = BuybackadLibrary.from_env()'), 'README.md has no ' + label + ' block')) continue;
    const out = await new Promise((res) => {
      const c = spawn(process.env.SNIPPETS_PYTHON, ['-c', code + '\n' + test], { cwd: HANDOFF, env: { ...env, PYTHONPATH: HANDOFF } });
      let o = ''; c.stdout.on('data', (d) => { o += d; }); c.stderr.on('data', (d) => { o += d; });
      c.on('close', (status) => res({ status, o }));
    });
    snippets[label] = out.status === 0 && /^ok$/m.test(out.o) ? 'ok' : out.o.trim().split('\n').slice(-3).join(' | ');
    ok(snippets[label] === 'ok', 'the README ' + label + ' code: ' + snippets[label]);
  }
}

/* 3. the reference server and its listing page */
const shop = spawn('python3', ['example_server.py', '8896'], { cwd: HANDOFF, env, stdio: ['ignore', 'pipe', 'pipe'] });
let shopLog = ''; shop.stdout.on('data', (d) => { shopLog += d; }); shop.stderr.on('data', (d) => { shopLog += d; });
for (let i = 0; i < 40 && !(await fetch(SHOP + '/').then((r) => r.ok).catch(() => false)); i++) await new Promise((r) => setTimeout(r, 250));
const page_ = {};
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900 });
  const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto(SHOP + '/', { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelectorAll('.bbl-tile').length > 0, { timeout: 30000 });
  page_.first = await page.$$eval('.bbl-tile', (t) => t.length);
  page_.status = await page.$eval('.bbl-status', (e) => e.textContent);
  page_.categories = await page.$$eval('.bbl select option', (o) => o.length);
  await page.type('.bbl input[type=search]', 'gold');
  await page.waitForFunction((all) => /ads:/.test(document.querySelector('.bbl-status').textContent) && +document.querySelector('.bbl-status').textContent.split(' ')[0] < all, { timeout: 30000 }, +page_.status.split(' ')[0]).catch(() => {});
  page_.searched = await page.$eval('.bbl-status', (e) => e.textContent);
  page_.searchTiles = await page.$$eval('.bbl-tile span', (s) => s.slice(0, 4).map((x) => x.textContent));
  await page.click('.bbl-tile');
  await page.waitForFunction(() => document.querySelectorAll('#photos img').length === 1, { timeout: 30000 }).catch(() => {});
  page_.added = await page.evaluate(async () => {
    const f = photos[0]; if (!f) return null;
    const bmp = await createImageBitmap(f);
    const b = new Uint8Array(await f.arrayBuffer()); let h = 0; for (let i = 0; i < b.length; i++) h = (h * 31 + b[i]) >>> 0;
    return { name: f.name, type: f.type, bytes: f.size, size: [bmp.width, bmp.height], magic: [...b.slice(0, 3)], hash: h };
  });
  if (page_.added){
    const id = page_.added.name.replace(/\.jpg$/, ''), want = readFileSync(join(ROOT, 'assets/library-ads', id + '.jpg'));
    let h = 0; for (const x of want) h = (h * 31 + x) >>> 0;
    page_.added.sameAsRender = h === page_.added.hash && want.length === page_.added.bytes;
  }
  if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT });   // the listing page with its pick, to look at
  page_.errors = errs;
} finally { await browser.close(); shop.kill(); site.close(); }

ok(page_.first > 0 && /ads:/.test(page_.status), 'the picker did not load: ' + page_.status);
ok(page_.categories > 1, 'the categories did not load');
ok(/ads:/.test(page_.searched) && +page_.searched.split(' ')[0] < +page_.status.split(' ')[0] && page_.searchTiles.length, 'the search did not narrow: ' + page_.searched);
ok(page_.added && page_.added.type === 'image/jpeg' && page_.added.magic.join() === '255,216,255' && page_.added.size.join() === '1080,1080', 'the pick did not add a 1080 JPEG: ' + JSON.stringify(page_.added));
ok(page_.added && page_.added.sameAsRender, "the pick is not the library's render byte for byte");

/* 5. the zip is the folder */
const z = spawnSync('unzip', ['-Z1', join(ROOT, 'docs/iphonesla-library.zip')], { encoding: 'utf8' });
const inZip = (z.stdout || '').split('\n').filter((n) => n && !n.endsWith('/'));
const want = readdirSync(HANDOFF).filter((f) => !f.startsWith('.') && f !== '__pycache__').map((f) => 'iphonesla-library/' + f).sort();
ok(z.status === 0 && JSON.stringify(inZip.slice().sort()) === JSON.stringify(want), 'the zip holds ' + JSON.stringify(inZip) + ', the folder ' + JSON.stringify(want));
for (const n of inZip) {
  const a = spawnSync('unzip', ['-p', join(ROOT, 'docs/iphonesla-library.zip'), n]).stdout;
  const f = join(ROOT, 'docs', n);
  if (!existsSync(f) || !readFileSync(f).equals(a)) bad.push('the zip\'s ' + n + ' is not the folder\'s');
}
ok(!page_.errors.length, 'page errors: ' + page_.errors.join(' | '));
ok(!/Traceback/.test(shopLog), 'the reference server raised: ' + shopLog.split('Traceback')[1]);

console.log(JSON.stringify({ python: { ran, skipped, status: ut.status }, snippets, page: page_, failures: bad }, null, 1));
process.exit(bad.length ? 1 : 0);
