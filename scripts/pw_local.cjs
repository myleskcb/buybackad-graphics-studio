/* PLAYWRIGHT WITH THE REPO ANSWERED IN-PROCESS: the browser checks without a web server.

   Every browser check here expects the repo served at http://127.0.0.1:8931/ (python3 -m
   http.server 8931). A cloud session may not be allowed to start one, and its network blocks
   cdnjs, where the studio's fabric.js lives. This module is Playwright with every context
   answering http://127.0.0.1:8931/ from the files on disk (no port is opened) and cdnjs's fabric
   from a local copy. A check's own routes keep working: its route.fetch() and route.continue()
   for the repo read the disk, so the production CSP the checks inject still applies.

   usage:  PLAYWRIGHT_MODULE=$PWD/scripts/pw_local.cjs node scripts/full_ad_check.mjs
           FABRIC_JS=/path/fabric.min.js for the studio's pages (npm pack fabric@5.3.0, then
           package/dist/fabric.min.js; npm has no 5.3.1, the version cdnjs serves)
   Written 2026-11-12 (OPEN-ITEMS §BE). */
const pw = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = process.env.REPO_ROOT || path.resolve(__dirname, '..');
const FABRIC = process.env.FABRIC_JS || '';
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.avif': 'image/avif', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
  '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
  '.otf': 'font/otf', '.txt': 'text/plain', '.xml': 'application/xml', '.ico': 'image/x-icon', '.md': 'text/plain',
};

async function serve(route) {
  const url = new URL(route.request().url());
  let p = decodeURIComponent(url.pathname);
  let file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) return route.fulfill({ status: 403, body: '' });
  try {
    if (fs.statSync(file).isDirectory()) {
      if (!p.endsWith('/')) return route.fulfill({ status: 301, headers: { location: url.pathname + '/' + url.search } });
      file = path.join(file, 'index.html');
    }
    const body = fs.readFileSync(file);
    return route.fulfill({ status: 200, body, headers: { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' } });
  } catch (e) {
    return route.fulfill({ status: 404, body: 'not found', headers: { 'content-type': 'text/plain' } });
  }
}
async function fabric(route) {
  try { return route.fulfill({ status: 200, body: fs.readFileSync(FABRIC), headers: { 'content-type': 'text/javascript' } }); }
  catch (e) { return route.abort(); }
}
const LOCAL = /^http:\/\/(127\.0\.0\.1|localhost):8931\//;
/* what serve() would answer, as an object shaped like Playwright's APIResponse */
function fromDisk(url) {
  const u = new URL(url); let file = path.join(ROOT, decodeURIComponent(u.pathname));
  try { if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html'); const body = fs.readFileSync(file);
    const h = { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' };
    return { __disk: true, _body: body, status: () => 200, ok: () => true, headers: () => ({ ...h }), body: async () => body, text: async () => body.toString('utf8'), json: async () => JSON.parse(body.toString('utf8')), url: () => url };
  } catch (e) { const body = Buffer.from('not found'); return { __disk: true, _body: body, status: () => 404, ok: () => false, headers: () => ({ 'content-type': 'text/plain' }), body: async () => body, text: async () => 'not found', json: async () => null, url: () => url }; }
}
/* a check's own route handler, given a route whose fetch() and continue() reach the repo on disk */
function local(handler) {
  return (route, req) => {
    const url = route.request().url();
    if (!LOCAL.test(url)) {                       // continue() falls back, so the fabric copy below still answers cdnjs
      const r = Object.create(route);
      r.continue = (o) => route.fallback(o);
      for (const k of ['fallback', 'abort', 'request', 'fulfill', 'fetch']) r[k] = r[k] === r.continue && k !== 'continue' ? r[k] : (k === 'continue' ? r.continue : route[k].bind(route));
      return handler(r, req);
    }
    const r = Object.create(route);
    r.fetch = async () => fromDisk(url);
    r.continue = async () => serve(route);
    r.fulfill = async (o = {}) => { if (o.response && o.response.__disk) { const { response, ...rest } = o; return route.fulfill({ status: response.status(), headers: response.headers(), body: response._body, ...rest }); } return route.fulfill(o); };
    for (const k of ['fallback', 'abort', 'request']) r[k] = route[k].bind(route);
    return handler(r, req);
  };
}
async function wire(ctx) {
  const addRoute = ctx.route.bind(ctx);
  ctx.route = (pattern, handler, opts) => addRoute(pattern, local(handler), opts);
  const newPage = ctx.newPage.bind(ctx);
  ctx.newPage = async () => { const pg = await newPage(); const pr = pg.route.bind(pg); pg.route = (pattern, handler, opts) => pr(pattern, local(handler), opts); return pg; };
  await addRoute(LOCAL, serve);
  await addRoute(/cdnjs\.cloudflare\.com\/ajax\/libs\/fabric\.js\//, fabric);
  return ctx;
}
function wrapBrowser(b) {
  const newContext = b.newContext.bind(b);
  b.newContext = async (o) => wire(await newContext(o));
  b.newPage = async (o) => { const c = await b.newContext(o); const pg = await c.newPage(); pg.__ctx = c; const close = pg.close.bind(pg); pg.close = async (x) => { await close(x); await c.close().catch(() => {}); }; return pg; };
  return b;
}
const chromium = Object.create(pw.chromium);
chromium.launch = async (o) => wrapBrowser(await pw.chromium.launch(o));
chromium.launchPersistentContext = async (dir, o) => wire(await pw.chromium.launchPersistentContext(dir, o));
module.exports = { ...pw, chromium, default: { ...pw, chromium } };
