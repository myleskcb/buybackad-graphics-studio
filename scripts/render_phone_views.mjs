#!/usr/bin/env node
// Lands every phone the video maker draws at every 15-degree turn as a cut-out
// (scripts/phone_views.html draws them with motion/engine.js). Serves the repo on
// a local port, opens the page in headless Chromium, reads the PNGs back from the
// page and writes assets/cutouts/view-<phone>--<back|screen_<wallpaper>>-<l|r><deg>.webp
// (0 for flat) through Python's Pillow, and credits each in
// assets/cutouts/ATTRIBUTION.json as the video maker's own drawing of that phone.
//
//   node scripts/render_phone_views.mjs              every phone
//   ONLY=17-pro-silver node scripts/render_phone_views.mjs
//
// CHROME= sets the browser (default: Playwright's Chromium under /opt/pw-browsers).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CUT = path.join(ROOT, "assets", "cutouts");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json",
  ".webp": "image/webp", ".png": "image/png", ".css": "text/css" };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

function chrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const base = "/opt/pw-browsers";
  for (const d of fs.existsSync(base) ? fs.readdirSync(base) : []) {
    const p = path.join(base, d, "chrome-linux", "chrome");
    if (d.startsWith("chromium-") && fs.existsSync(p)) return p;
  }
  return "chromium";
}

const index = JSON.parse(fs.readFileSync(path.join(ROOT, "motion", "phones", "index.json"), "utf8")).phones;
const ids = (process.env.ONLY ? process.env.ONLY.split(",") : index.filter(m => m.ok !== false && !m.repaint).map(m => m.id));
const att = JSON.parse(fs.readFileSync(path.join(CUT, "ATTRIBUTION.json"), "utf8"));
const tmp = fs.mkdtempSync(path.join(ROOT, ".render", "views-"));
let n = 0;
for (const id of ids) {          // one phone a run: the page hands back its images in its own text
  const url = `http://127.0.0.1:${port}/scripts/phone_views.html?only=${id}`;
  // asynchronously: the page is served from this same process
  const { stdout: dom } = await promisify(execFile)(chrome(), ["--headless=new", "--no-sandbox", "--disable-gpu",
    "--virtual-time-budget=60000", "--dump-dom", url], { maxBuffer: 1 << 30 });
  const m = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/);
  const views = m && m[1] ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")) : [];
  if (!views.length) { console.log(`${id}: nothing drawn`); continue; }
  for (const f of fs.readdirSync(CUT))             // this phone's earlier views go: the angles drawn now replace them
    if (f.startsWith(`view-${id}--`)) { fs.unlinkSync(path.join(CUT, f)); delete att[f.slice(0, -5)]; }
  for (const v of views) {
    const tag = v.deg === 0 ? "0" : (v.deg < 0 ? "l" : "r") + Math.abs(v.deg);
    const name = `view-${v.phone}--${v.side}${v.wall ? "_" + v.wall : ""}-${tag}`;
    const png = path.join(tmp, name + ".png");
    fs.writeFileSync(png, Buffer.from(v.png.split(",")[1], "base64"));
    execFileSync("python3", ["-c", "import sys; from PIL import Image; Image.open(sys.argv[1]).save(sys.argv[2], 'WEBP', quality=92, method=6)",
      png, path.join(CUT, name + ".webp")]);
    fs.unlinkSync(png);
    att[name] = { license: "own photograph (iphones.la inventory)", artist: "BuybackAd video maker (motion/engine.js)",
      page: "motion/phones/" + v.phone + ".webp",
      note: `drawn by scripts/render_phone_views.mjs with the video maker's own phone engine: the ${v.model} in ${v.finish}, ` +
        `${v.side}${v.wall ? ` lit with the showcase engine's "${v.wall}" wallpaper (engine/showcase.mjs)` : ""}, ` +
        `${v.deg === 0 ? "flat" : `turned ${Math.abs(v.deg)} degrees to the ${v.deg < 0 ? "left" : "right"}`}; ` +
        "the back is the owner's own inventory photograph baked for the video maker (motion/phones/index.json)" };
    n++;
  }
  console.log(`${id}: ${views.length} views`);
}
fs.rmSync(tmp, { recursive: true, force: true });
fs.writeFileSync(path.join(CUT, "ATTRIBUTION.json"), JSON.stringify(att, null, 2) + "\n");
server.close();
console.log(`landed ${n} views in assets/cutouts`);
