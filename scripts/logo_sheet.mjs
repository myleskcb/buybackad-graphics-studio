#!/usr/bin/env node
/* A contact sheet of the logo maker's gallery (DESIGN-LAW 176): the finished logos it offers for a few
   real kinds of name and line, drawn by logo/engine.js in Node exactly as the page and the function
   draw them, written to .render/logo-sheet/index.html (with every layout's mark, lockup and one-colour
   versions on a second sheet, forms.html). DESIGN-LAW 183 adds marks.html, every line's family of marks drawn
   solid, as a line and sharp in that line's own colours, and styles.html, one name's gallery in each style.
   Look at them before and after any change to a layout or a mark.

   usage: node scripts/logo_sheet.mjs [--n 24] [--seed 1] [--names "A|B"] [--cats phones,gold] */
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join } from "node:path";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const E = await import(pathToFileURL(join(ROOT, "logo/engine.js")).href);
const { LOGO_FACES } = await import(pathToFileURL(join(ROOT, "logo/voices.js")).href);
const faces = {};
for (const f of LOGO_FACES) faces[f] = (await import(pathToFileURL(join(ROOT, "logo/glyphs", f + ".js")).href)).default;

const names = opt("--names", "Long Beach Phone Buyers|Gold Rush Cash|Sam's Coins|MK Electronics|Westside Watch & Phone Buyers of Orange County|Kash").split("|");
const cats = opt("--cats", "phones,gold,coins,phones,wearables,cars").split(",");
const n = +opt("--n", 24), seed = +opt("--seed", 1);
const OUT = join(ROOT, ".render/logo-sheet"); mkdirSync(OUT, { recursive: true });
const tile = (r, label, bg) => `<figure style="background:${bg || r.ground}"><div class="a">${r.svg.replace(/ width="\d+" height="\d+"/, "")}</div><figcaption>${label}${r.ok ? "" : " <b>SMALL</b>"}</figcaption></figure>`;
let html = `<!doctype html><meta charset="utf-8"><title>Logo sheet</title><style>body{font:13px system-ui;margin:20px;background:#ddd}h2{margin:28px 0 8px}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}figure{margin:0;border-radius:10px;overflow:hidden}
.a{aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;padding:14px}.a svg{max-width:100%;max-height:100%}
figcaption{background:#fff;padding:6px 8px;color:#333}b{color:#c00}</style>`;
names.forEach((name, i) => {
  const cat = cats[i % cats.length], list = E.gallery({ name, cat, town: "Long Beach" }, { seed, n });
  html += `<h2>${name} · ${cat}</h2><div class="g">`;
  for (const d of list.slice(0, n)) {
    const r = E.logoSvg(d, faces, { bg: false, pad: .06 });
    html += tile(r, `${d.t} · ${d.voice} · ${d.pair}${d.icon ? " · " + d.icon : ""}`);
  }
  html += "</div>";
});
writeFileSync(join(OUT, "index.html"), html);

// every layout, its mark, its lockup, and the one-colour versions
let h2 = html.split("<h2>")[0];
const d0 = { name: names[0], cat: cats[0], town: "Long Beach", voice: "bold", pair: "navy_gold", icon: "phone", seed: 2 };
h2 += `<h2>Every layout · ${names[0]}</h2><div class="g">`;
for (const t of Object.keys(E.LOGO_LAYOUTS)) {
  const L = E.LOGO_LAYOUTS[t], voice = Object.keys(E.LOGO_VOICES).find(v => L.kinds.includes(E.LOGO_VOICES[v].kind) && v !== "bold") || "bold";
  const d = { ...d0, t, voice, cat: L.cats ? L.cats[0] : d0.cat };
  h2 += tile(E.logoSvg(d, faces, { bg: false }), t + " primary");
  h2 += tile(E.logoSvg(d, faces, { form: "mark", bg: false }), t + " mark");
  h2 += tile(E.logoSvg(d, faces, { form: "horizontal", bg: false }), t + " horizontal");
  h2 += tile(E.logoSvg(d, faces, { mode: "black" }), t + " black", "#fff");
  h2 += tile(E.logoSvg(d, faces, { mode: "white" }), t + " white", "#222");
}
h2 += "</div><h2>Profile and cover</h2><div class=\"g\">";
for (const t of ["seal", "stacked", "monogram", "crest"]) {
  const d = { ...d0, t, voice: "street", pair: "black_gold" };
  h2 += tile(E.profileSvg(d, faces), t + " profile");
  h2 += tile(E.coverSvg(d, faces, { phone: "(562) 555-0123" }), t + " cover");
}
writeFileSync(join(OUT, "forms.html"), h2 + "</div>");

// the mark catalogue: each line's family, solid, as a line and sharp, in the line's own calm colours
const LINE_NAMES = { phones: "Harbor Mobile", devices: "Harbor Devices", computers: "Harbor Tech", gold: "Harbor Gold", silver: "Harbor Silver", coins: "Harbor Coins",
  wearables: "Harbor Watches", pokemon: "Harbor Cards", sports: "Harbor Sports Cards", gaming: "Harbor Games", cars: "Harbor Auto", audio: "Harbor Audio",
  cameras: "Harbor Cameras", strips: "Harbor Strips", wholesale: "Harbor Wholesale", resale: "Harbor Resale" };
const VOICE_OF = { gold: "banker", silver: "banker", coins: "classic", wearables: "engraved", pokemon: "friendly", sports: "sturdy", gaming: "friendly", cars: "sturdy", wholesale: "workshop", resale: "friendly" };
let h3 = html.split("<h2>")[0].replace("<title>Logo sheet</title>", "<title>Mark catalogue</title>") + `<style>.m{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}.m figure{background:#fff}.m .a{aspect-ratio:1;padding:10px}</style>`;
h3 += `<h1 style="font:700 22px system-ui">The mark catalogue (DESIGN-LAW 183): ${Object.keys(E.LOGO_MARKS).length} marks, a family of six to eight a line</h1>`;
for (const [cat, fam] of Object.entries(E.MARKS_FOR)) {
  const d = { name: LINE_NAMES[cat] || "Harbor", cat, voice: VOICE_OF[cat] || "geometric", town: "Long Beach" };
  const gal = E.gallery(d, { seed: 1, n: 8 }).map((x) => x.pair);
  h3 += `<h2>${E.LINE_WORDS[cat]} · ${cat}</h2><div class="g m">`;
  fam.forEach((k, i) => {
    const pair = gal[i % gal.length] || "navy_brass", P = E.paletteOf(pair);
    for (const [line, sharp, lab] of [[false, false, ""], [true, false, " · line"], [false, true, " · sharp"]]) {
      const r = E.markSvg({ ...d, pair }, faces, k, { line, sharp, pad: .1 });
      h3 += `<figure style="background:${P.G}"><div class="a">${r.svg.replace(/ width="\d+" height="\d+"/, "")}</div><figcaption>${E.LOGO_MARKS[k].name}${lab}</figcaption></figure>`;
    }
  });
  h3 += "</div><div class=\"g\" style=\"margin-top:10px\">";
  for (const t of ["lockup", "centred"]) {
    const x = { ...d, t, mark: fam[t === "lockup" ? 0 : 1], pair: gal[t === "lockup" ? 2 : 3] || "paper_navy", voice: VOICE_OF[cat] || "geometric", line: t === "centred" };
    h3 += tile(E.logoSvg(x, faces, { bg: false, pad: .06 }), `${t} · ${x.voice} · ${x.pair} · ${x.mark}${x.line ? " line" : ""}`);
  }
  h3 += "</div>";
}
writeFileSync(join(OUT, "marks.html"), h3);

// one name's gallery in each style: the first gallery (the calm mix), the four calm styles, and Bold
let h4 = html.split("<h2>")[0].replace("<title>Logo sheet</title>", "<title>Logo styles</title>");
const sName = names[0], sCat = cats[0];
for (const st of ["", "classic", "modern", "friendly", "luxury", "bold"]) {
  const list = E.gallery({ name: sName, cat: sCat, town: "Long Beach" }, { seed, n: 12, style: st }).filter((x) => E.logoSvg(x, faces, { bg: false }).ok).slice(0, 10);
  h4 += `<h2>${st ? E.STYLES[st].name + ": " + E.STYLES[st].says : "The first gallery (the calm mix)"} · ${sName}</h2><div class="g">`;
  for (const x of list) h4 += tile(E.logoSvg(x, faces, { bg: false, pad: .06 }), `${x.t} · ${x.voice} · ${x.pair}${x.mark ? " · " + x.mark + (x.line ? " line" : "") : ""}`);
  h4 += "</div>";
}
writeFileSync(join(OUT, "styles.html"), h4);
console.log("wrote .render/logo-sheet/index.html, forms.html, marks.html and styles.html");
