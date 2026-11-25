#!/usr/bin/env node
/* A contact sheet of the brand kit (logo/kit.js, DESIGN-LAW 180): every file of the Complete kit for a
   few logos, drawn in Node exactly as the page and the function draw them, written to
   .render/kit-sheet/<n>.html, one page a logo. Look at it before and after any change to a format.

   usage: node scripts/kit_sheet.mjs [--logos 3] [--seed 1] [--looks 0] [--only id,id] */
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join } from "node:path";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const E = await import(pathToFileURL(join(ROOT, "logo/engine.js")).href);
const KIT = await import(pathToFileURL(join(ROOT, "logo/kit.js")).href);
const { LOGO_FACES } = await import(pathToFileURL(join(ROOT, "logo/voices.js")).href);
const faces = {};
for (const f of LOGO_FACES) faces[f] = (await import(pathToFileURL(join(ROOT, "logo/glyphs", f + ".js")).href)).default;

const SAMPLES = [
  { name: "Gold Coast Buyers", cat: "gold", town: "Long Beach", details: { person: "Maria Lopez", role: "Owner", phone: "(562) 555-0148", email: "maria@goldcoastbuyers.com", site: "goldcoastbuyers.com", handle: "goldcoastbuyers", address: "2100 E 4th St, Long Beach", hours: "MON-SAT 10AM-7PM" } },
  { name: "MK Electronics", cat: "devices", town: "Downey", details: { phone: "(562) 555-0123", site: "mkelectronics.com", handle: "mk.electronics" } },
  { name: "Card Vault LA", cat: "pokemon", town: "Los Angeles", details: { person: "Sam Park", role: "Buyer", phone: "(213) 555-0199", email: "sam@cardvault.la", site: "cardvault.la", handle: "cardvaultla" } },
  { name: "Westside Wholesale", cat: "wholesale", town: "Torrance", details: { phone: "(310) 555-0110", site: "westsidewholesale.com" } },
];
const n = +opt("--logos", 3), seed = +opt("--seed", 1), looks = +opt("--looks", 0), only = (opt("--only", "") || "").split(",").filter(Boolean);
const OUT = join(ROOT, ".render/kit-sheet"); mkdirSync(OUT, { recursive: true });
const head = `<!doctype html><meta charset="utf-8"><title>Kit sheet</title><style>body{font:13px system-ui;margin:20px;background:#d9dbe0}h2{margin:22px 0 8px}
.g{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start}figure{margin:0;background:#fff;border-radius:8px;overflow:hidden}
.a{display:flex;align-items:center;justify-content:center;background:repeating-conic-gradient(#e6e8ec 0 25%,#f6f7f9 0 50%) 0 0/16px 16px}
.a svg{display:block}figcaption{padding:5px 8px;color:#333;max-width:420px}</style>`;
for (let i = 0; i < Math.min(n, SAMPLES.length); i++) {
  const s = SAMPLES[i], list = E.gallery({ name: s.name, cat: s.cat, town: s.town }, { seed, n: 24 });
  const design = list.find(d => E.logoSvg(d, faces, {}).ok) || list[0];
  const spec = { design, details: s.details, looks: { social: looks, card: looks, posts: looks, print: looks } };
  let html = head + `<h2>${s.name} · ${s.cat} · ${design.t} · ${design.voice} · ${design.pair}</h2>`;
  for (const step of KIT.FLOW) {
    html += `<h2>${step.title}</h2><div class="g">`;
    for (const F of KIT.FORMATS.filter(f => f.step === step.key && (!only.length || only.includes(f.id)))) {
      let r; try { r = KIT.kitSvg(F.id, spec, faces); } catch (e) { html += `<figure><figcaption><b>${F.id}: ${e.message}</b></figcaption></figure>`; continue; }
      const box = F.card ? 420 : 300, k = Math.min(box * 1.4 / r.w, box / r.h), w = Math.round(r.w * k), h = Math.round(r.h * k);
      html += `<figure><div class="a" style="width:${Math.max(w, 160)}px;height:${h}px;${F.on ? "background:" + F.on : ""}">${r.svg.replace(/ width="[\d.]+" height="[\d.]+"/, ` width="${w}" height="${h}"`)}</div><figcaption>${F.title} · ${F.tier}</figcaption></figure>`;
    }
    html += "</div>";
  }
  writeFileSync(join(OUT, i + ".html"), html);
}
console.log("wrote .render/kit-sheet/0.html …");
