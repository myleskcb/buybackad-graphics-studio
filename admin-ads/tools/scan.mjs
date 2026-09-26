// Score a frozen batch in headless Chromium and write admin-ads/batches/<id>/scan.json.
//   node admin-ads/tools/scan.mjs <batch-id> [<batch-id> ...] [--per 24]
// Needs Playwright (npm i -g playwright, or any install that resolves). Serves the
// repo root on a local port, so the page loads exactly what Netlify would serve.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); }
catch (e) {                                          // a global install
  const g = (await import("node:child_process")).execSync("npm root -g").toString().trim();
  ({ chromium } = require(path.join(g, "playwright")));
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const perAt = args.indexOf("--per");
const per = perAt >= 0 ? parseInt(args.splice(perAt, 2)[1], 10) : undefined;
if (!args.length) { console.error("usage: node admin-ads/tools/scan.mjs <batch-id> [...] [--per N]"); process.exit(1); }

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css",
  ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".jpg": "image/jpeg" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

const exe = fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage();
page.on("pageerror", e => console.error("page error:", e.message));
await page.goto(`http://127.0.0.1:${port}/admin-ads/blank.html`);

for (const id of args) {
  const t0 = Date.now();
  let last = 0;
  await page.exposeFunction(`__prog_${id.replace(/\W/g, "_")}`, (d, n, cat) => {
    if (Date.now() - last > 4000 || d === n) { last = Date.now(); console.log(`${id}: ${d}/${n} (${cat})`); }
  });
  const scan = await page.evaluate(async ([id, per]) => {
    const m = await import("/admin-ads/lib.js");
    return m.scanBatch(id, { per, onProgress: window[`__prog_${id.replace(/\W/g, "_")}`] });
  }, [id, per]);
  const file = path.join(root, "admin-ads/batches", id, "scan.json");
  fs.writeFileSync(file, JSON.stringify(scan) + "\n");
  console.log(`wrote ${path.relative(root, file)} in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
await browser.close();
server.close();
