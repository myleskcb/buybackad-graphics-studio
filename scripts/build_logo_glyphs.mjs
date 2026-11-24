#!/usr/bin/env node
/* THE LOGO MAKER'S TYPE, AS OUTLINES (DESIGN-LAW 170).

   A logo is a vector file a sign shop, a printer or a web page uses as it is, so its words are
   outlines, never <text> that falls back to whatever face the reader's machine has. This script
   turns the faces of the type pairs the logo maker sets (logo/engine.js LOGO_VOICES: the full ad's
   vetted pairs, motion/full-voices.js, plus Bold) into one small module a face, logo/glyphs/<face>.js:
   every glyph of Basic Latin and the Latin-1 letters a business name may hold, as SVG path data on
   a 1000-unit em (y down, the baseline at 0), its advance and its ink box; the face's cap height,
   x-height, ascender and descender; and its kerning, read by laying out every pair (so GPOS kerning
   is kept, not only the old kern table). The browser imports a module when a logo is drawn in its
   face; the Netlify function imports the same modules to draw a paid file (netlify/lib/logos.mjs).

   A variable face is instanced at the weight the catalogue names (motion/catalog.js FONTS).

   Needs fontkit (MIT) and wawoff2 (MIT; fontkit cannot instance a variable WOFF2 itself), build-time
   tools only: FONTKIT=/path/to/node_modules/fontkit and WAWOFF2=/path/to/node_modules/wawoff2, or
   both in node_modules. Never edit the glyph files by hand; run this again.

   usage: node scripts/build_logo_glyphs.mjs [--faces a,b] [--check]
          --check  exits 1 when a face the logo maker sets has no module, or a module is stale */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join } from "node:path";
import { createRequire } from "node:module";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const CHECK = args.includes("--check");

const { FONTS } = await import(pathToFileURL(join(ROOT, "motion/catalog.js")).href);
const { LOGO_FACES } = await import(pathToFileURL(join(ROOT, "logo/voices.js")).href);
const want = (opt("--faces") || "").split(",").filter(Boolean);
const faces = want.length ? want : LOGO_FACES;
const OUT = join(ROOT, "logo/glyphs");

if (CHECK) {
  const bad = [];
  for (const f of LOGO_FACES) {
    const out = join(OUT, f + ".js"), src = join(ROOT, "assets/fonts", (FONTS[f] || [])[2] || "?");
    if (!FONTS[f]) bad.push(f + ": not in motion/catalog.js FONTS");
    else if (!existsSync(out)) bad.push(f + ": no logo/glyphs/" + f + ".js");
    else if (existsSync(src) && statSync(src).mtimeMs > statSync(out).mtimeMs + 1000) bad.push(f + ": the font file is newer than its glyphs");
  }
  if (bad.length) { console.error("logo glyphs:\n  " + bad.join("\n  ")); process.exit(1); }
  console.log("logo glyphs: " + LOGO_FACES.length + " faces, every one built");
  process.exit(0);
}

const require = createRequire(import.meta.url);
const fkPath = process.env.FONTKIT || "fontkit";
const fontkit = require(fkPath);
const wawoff2 = require(process.env.WAWOFF2 || "wawoff2");

/* the characters a business name, a town and a small line may hold */
const CHARS = [];
for (let c = 32; c <= 126; c++) CHARS.push(String.fromCharCode(c));
CHARS.push(..."’‘“”•·–—…©®™°");
CHARS.push(..."ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖØÙÚÛÜÝàáâãäåæçèéêëìíîïñòóôõöøùúûüýÿŒœŠšŽž");
/* the pairs kerned: the letters, figures and the marks that sit between them */
const KERN = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,'’-&/:"];

const r = v => Math.round(v);
function pathOf(glyph, k) {
  /* fontkit's path: y up in font units. Out: y down on a 1000 em, relative commands between rounded
     points. After a z the pen is back at the contour's start (SVG's rule), so the next m counts from there. */
  let s = "", px = 0, py = 0, sx = 0, sy = 0;
  const P = (x, y) => [r(x * k), r(-y * k)];
  for (const c of glyph.path.commands) {
    const a = c.args;
    if (c.command === "moveTo") { const [x, y] = P(a[0], a[1]); s += "m" + (x - px) + "," + (y - py); px = sx = x; py = sy = y; }
    else if (c.command === "lineTo") { const [x, y] = P(a[0], a[1]); if (x === px && y === py) continue; s += "l" + (x - px) + "," + (y - py); px = x; py = y; }
    else if (c.command === "quadraticCurveTo") {
      const q = P(a[0], a[1]), e = P(a[2], a[3]);
      s += "q" + (q[0] - px) + "," + (q[1] - py) + " " + (e[0] - px) + "," + (e[1] - py); px = e[0]; py = e[1];
    } else if (c.command === "bezierCurveTo") {
      const c1 = P(a[0], a[1]), c2 = P(a[2], a[3]), e = P(a[4], a[5]);
      s += "c" + (c1[0] - px) + "," + (c1[1] - py) + " " + (c2[0] - px) + "," + (c2[1] - py) + " " + (e[0] - px) + "," + (e[1] - py); px = e[0]; py = e[1];
    } else if (c.command === "closePath") { s += "z"; px = sx; py = sy; }
  }
  return s.replace(/,-/g, "-").replace(/ -/g, "-");
}

mkdirSync(OUT, { recursive: true });
let total = 0;
for (const key of faces) {
  const spec = FONTS[key];
  if (!spec) { console.error("no such face in FONTS: " + key); process.exitCode = 1; continue; }
  const [family, weight, file] = spec;
  const raw = readFileSync(join(ROOT, "assets/fonts", file));
  let font = fontkit.create(/\.woff2$/.test(file) ? Buffer.from(await wawoff2.decompress(raw)) : raw);
  if (font.variationAxes && font.variationAxes.wght) {
    const ax = font.variationAxes.wght, w = Math.max(ax.min, Math.min(ax.max, Number(weight) || ax.default));
    font = font.getVariation({ wght: w });
  }
  const k = 1000 / font.unitsPerEm;
  const g = {};
  for (const ch of CHARS) {
    const gl = font.glyphForCodePoint(ch.codePointAt(0));
    if (!gl || (gl.id === 0 && ch !== " ")) continue;
    const bb = gl.bbox, adv = r(gl.advanceWidth * k);
    const d = ch === " " ? "" : pathOf(gl, k);
    if (ch !== " " && !d) continue;
    g[ch] = d ? [adv, r(bb.minX * k), r(-bb.maxY * k), r(bb.maxX * k), r(-bb.minY * k), d] : [adv, 0, 0, 0, 0, ""];
  }
  const kern = {};
  const has = KERN.filter(c => g[c]);
  for (const a of has) for (const b of has) {
    const run = font.layout(a + b);
    if (run.glyphs.length !== 2) continue;
    const kv = r((run.positions[0].xAdvance - run.glyphs[0].advanceWidth) * k);
    if (Math.abs(kv) >= 4) kern[a + b] = kv;
  }
  const cap = g.H ? -g.H[2] : r((font.capHeight || 700) * k), xh = g.x ? -g.x[2] : r((font.xHeight || 500) * k);
  const data = { key, family, weight: Number(weight) || 400, asc: r(font.ascent * k), desc: r(-font.descent * k), cap, xh, g, k: kern };
  const body = "// " + family + " " + weight + ", from assets/fonts/" + file + ": written by scripts/build_logo_glyphs.mjs, never by hand.\n"
    + "// The face's own licence: the SIL Open Font License (assets/fonts). Outlines on a 1000 em, y down, the baseline at 0.\n"
    + "export default " + JSON.stringify(data) + ";\n";
  writeFileSync(join(OUT, key + ".js"), body);
  total += body.length;
  console.log(key.padEnd(18), String(Object.keys(g).length).padStart(4), "glyphs", String(Object.keys(kern).length).padStart(5), "kern pairs", (body.length / 1024).toFixed(0).padStart(5) + " KB");
}
console.log("total " + (total / 1024).toFixed(0) + " KB in " + faces.length + " faces");
