/* ═══════════════════════════════════════════════════════════════════════════
   THE LOGO MAKER AND BRAND KIT (logo/, DESIGN-LAW 176). The owner, 2026-11-24: "I don't see anywhere
   to generate logos or business cards. We should have business assets generable ... but they need to
   be good, very, very good", and "that's something you would probably be paying for".

   The customer came because they can't design, so every step shows finished results to pick from,
   never settings to read: (1) the business name and what they buy, (2) a page of finished logos in
   that name (engine.js gallery), (3) the one picked, with rows of itself in other colours, lettering,
   shapes and symbols, (4) the brand kit: the files, the business card, the ads' badge, the profile
   picture and the Facebook cover, each drawn from the one logo.

   The picked logo is saved for the rest of the site (localStorage pgfx_logo_kit): the card maker
   (cards/cards.js) sets it on the card, and the full ad (full-ad-studio.js) on its badge.

   Paid: designing and previewing are free; the preview carries the WeBuy.AD mark until the plan
   includes logos. The files are drawn by the function (/api/logo/file: netlify/lib/logos.mjs, the
   same engine), which first checks the plan (Pro and Business: plans.mjs logos) and counts one photo
   download, so the clean vector never comes from a browser that has not paid.

   window.LogoMaker is for scripts/logo_check.mjs.
   ═══════════════════════════════════════════════════════════════════════════ */
import * as E from "./engine.js";

const $ = id => document.getElementById(id);
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const box = (() => { try { const s = window.localStorage, k = "__logo_t"; s.setItem(k, "1"); s.removeItem(k); return s; } catch (e) { return null; } })();
const jget = (k, fb) => { try { const v = box && box.getItem(k); return v == null ? fb : JSON.parse(v); } catch (e) { return fb; } };
const jset = (k, v) => { try { if (box) box.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } };

/* the lines Easy Mode lists (app.js CATS), in its order, in plain words */
const CATS = [["phones", "Phones & devices"], ["gaming", "Games & consoles"], ["gold", "Gold & jewelry"], ["coins", "Rare coins"], ["pokemon", "Trading cards"],
  ["silver", "Silver"], ["cars", "Cars & trucks"], ["sports", "Sports cards"], ["computers", "Computers & parts"], ["audio", "Headphones & audio"],
  ["wearables", "Watches & wearables"], ["cameras", "Cameras & drones"], ["strips", "Diabetic test strips"]];
const STORE = "pgfx_logo", KIT = "pgfx_logo_kit";
const state = Object.assign({ name: "", cat: "", town: "", small: "", seed: 1, group: "", picked: null }, jget(STORE, null) || {});
const keep = () => jset(STORE, { name: state.name, cat: state.cat, town: state.town, small: state.small, seed: state.seed, group: state.group, picked: state.picked });
/** the logo the rest of the site wears: the card maker and the full ad read it */
const keepKit = () => { if (state.picked) jset(KIT, { v: E.ENGINE_VERSION, design: state.picked, at: Date.now() }); };

/** what the customer already told the studio (app.js pgfx_brand, the full ad's pgfx_full_studio, Easy Mode's line) */
function fromStudio() {
  const brand = jget("pgfx_brand", null) || {}, fa = jget("pgfx_full_studio", null) || {}, cat = jget("pgfx_cat", "");
  const area = brand.area || null;
  return { name: brand.name || fa.biz || "", cat: CATS.some(c => c[0] === cat) ? cat : "", town: area && area.home ? String(area.home).split(",")[0].trim() : "", phone: brand.phone || "" };
}
const studio = fromStudio();

/* ---------- the faces: one module a face, loaded when a logo set in it is drawn ---------- */
const FACES = {}, loading = {};
function need(keys) {
  return Promise.all([...new Set(keys)].map(k => FACES[k] ? null : (loading[k] ||= import(`./glyphs/${k}.js`).then(m => { FACES[k] = m.default; }))));
}
const needFor = ds => need(ds.flatMap(E.facesOf));

/* ---------- drawing: the engine's SVG onto a canvas ---------- */
function svgImage(svg) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })), im = new Image();
    im.onload = () => { URL.revokeObjectURL(url); res(im); };
    im.onerror = () => { URL.revokeObjectURL(url); rej(new Error("The logo could not be drawn")); };
    im.src = url;
  });
}
const DPR = () => Math.min(2, window.devicePixelRatio || 1);
/** a logo on a canvas: its ground, the art fitted with a margin, and the WeBuy.AD mark where the plan does not include logos */
async function paint(canvas, d, { form = "primary", fill = .78, w, h, bg = true, marked = false } = {}) {
  await needFor([d]);
  const r = E.logoSvg(d, FACES, { form, bg: false, pad: 0 }), im = await svgImage(r.svg);
  const W = w || canvas.clientWidth || canvas.width, H = h || canvas.clientHeight || canvas.height, k = DPR();
  canvas.width = Math.round(W * k); canvas.height = Math.round(H * k);
  const x = canvas.getContext("2d");
  x.setTransform(k, 0, 0, k, 0, 0);
  if (bg) { x.fillStyle = r.ground; x.fillRect(0, 0, W, H); } else x.clearRect(0, 0, W, H);
  const s = Math.min(W * fill / r.w, H * fill / r.h);
  x.drawImage(im, (W - r.w * s) / 2, (H - r.h * s) / 2, r.w * s, r.h * s);
  if (marked && window.PgfxMark) { x.setTransform(1, 0, 0, 1, 0, 0); window.PgfxMark.draw(x, canvas.width, canvas.height); }
  return r;
}
async function paintSvg(canvas, svg, { w, h, marked = false } = {}) {
  const im = await svgImage(svg), k = DPR(), W = w || canvas.width, H = h || canvas.height;
  canvas.width = Math.round(W * k); canvas.height = Math.round(H * k);
  const x = canvas.getContext("2d"); x.drawImage(im, 0, 0, canvas.width, canvas.height);
  if (marked && window.PgfxMark) window.PgfxMark.draw(x, canvas.width, canvas.height);
}

/* ---------- step 1 ---------- */
function input() {
  return { name: state.name.trim(), cat: state.cat || "phones", town: state.town.trim(), small: state.small.trim() };
}
function fillForm() {
  $("lg-cat").innerHTML = CATS.map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join("");
  $("lg-name").value = state.name; $("lg-cat").value = state.cat || "phones"; $("lg-town").value = state.town;
  $("lg-small").value = state.small;
  $("lg-small").placeholder = "WE BUY " + E.LINE_WORDS[state.cat || "phones"];
}

/* ---------- step 2: the gallery ---------- */
const SHOW = 24;
let galleryRun = 0, shown = [];
const GROUPS = { "": "", badge: "badge", wordmark: "wordmark", monogram: "monogram" };
const labelOf = d => `${E.LOGO_LAYOUTS[d.t].name} in ${E.paletteOf(d.pair).name}, ${E.LOGO_VOICES[d.voice].name} lettering`;
async function drawGallery(append = false) {
  const run = ++galleryRun, grid = $("lg-grid");
  if (!append) { grid.innerHTML = ""; shown = []; }
  const list = E.gallery(input(), { seed: state.seed, n: SHOW + 8, group: GROUPS[state.group] || "" });
  const tiles = [];
  for (let i = 0; i < SHOW; i++) { const b = document.createElement("button"); b.type = "button"; b.className = "lg-tile wait"; b.setAttribute("aria-label", "A logo, loading"); grid.appendChild(b); tiles.push(b); }
  await needFor(list);
  if (run !== galleryRun) return;
  let t = 0;
  for (const d of list) {
    if (t >= tiles.length) break;
    const b = tiles[t], c = document.createElement("canvas");
    let r;
    try { b.appendChild(c); r = await paint(c, d, { fill: .8 }); } catch (e) { c.remove(); continue; }
    if (run !== galleryRun) return;
    if (!r.ok) { c.remove(); continue; }   // a name too long for this layout at a size a logo is read at
    b.classList.remove("wait"); b.setAttribute("aria-label", "Pick this logo: " + labelOf(d)); b.title = labelOf(d);
    b.dataset.t = d.t; b.dataset.pair = d.pair; b.dataset.voice = d.voice;
    b.setAttribute("aria-pressed", String(!!state.picked && sameLogo(d, state.picked)));
    b.onclick = () => pick(d, b);
    shown.push(d); t++;
  }
  for (; t < tiles.length; t++) tiles[t].remove();
  grid.dataset.drawn = String(run);
  grid.dataset.count = String(grid.querySelectorAll(".lg-tile:not(.wait)").length);
}
const sameLogo = (a, b) => a && b && a.t === b.t && a.pair === b.pair && a.voice === b.voice && a.icon === b.icon && a.name === b.name;
async function showGallery(scroll) {
  const sec = $("lg-gallery"); sec.hidden = false;
  if (scroll) sec.scrollIntoView({ behavior: "smooth", block: "start" });
  await drawGallery(false);
}

/* ---------- step 3: the one picked ---------- */
function pick(d, tile) {
  state.picked = { ...d, small: state.small, town: state.town };
  keep(); keepKit();
  document.querySelectorAll(".lg-tile").forEach(b => b.setAttribute("aria-pressed", String(b === tile)));
  const first = $("lg-edit").hidden;
  $("lg-edit").hidden = false; $("lg-kit").hidden = false;
  drawPicked();
  if (first || tile) $("lg-edit").scrollIntoView({ behavior: "smooth", block: "start" });
}
let pickRun = 0;
const ROWS = [["row-pair", "pair", d => E.paletteOf(d.pair).name], ["row-voice", "voice", d => E.LOGO_VOICES[d.voice].name],
  ["row-layout", "t", d => E.LOGO_LAYOUTS[d.t].name], ["row-icon", "icon", d => d.icon ? E.LOGO_ICONS[d.icon][1] : "Initials"]];
async function drawPicked() {
  const run = ++pickRun, d = state.picked; if (!d) return;
  const big = $("lg-big");
  const r = await paint(big, d, { w: big.parentElement.clientWidth || 600, h: Math.round((big.parentElement.clientWidth || 600) * .68), fill: .74, marked: !entitled });
  if (run !== pickRun) return;
  big.dataset.drawn = String(run); big.dataset.marked = String(!entitled);
  $("lg-big-cap").textContent = labelOf(d) + (entitled ? "" : ". The WeBuy.AD mark comes off with the files.");
  for (const [id, axis, name] of ROWS) {
    const row = $(id), list = E.variants(d, axis === "t" ? "layout" : axis, 8);
    await needFor(list);
    if (run !== pickRun) return;
    row.innerHTML = "";
    for (const v of list) {
      const b = document.createElement("button"); b.type = "button";
      const on = v[axis] === d[axis];
      b.setAttribute("aria-pressed", String(on)); b.setAttribute("aria-label", name(v)); b.title = name(v);
      b.dataset.v = v[axis];
      const c = document.createElement("canvas"); b.appendChild(c);
      const lab = document.createElement("span"); lab.textContent = name(v); b.appendChild(lab);
      row.appendChild(b);
      b.onclick = () => { state.picked = { ...v }; keep(); keepKit(); files = null; drawPicked(); };
      paint(c, v, { w: 160, h: 120, fill: .8 }).catch(() => {});
    }
  }
  if (run !== pickRun) return;
  await drawKit(run);
}

/* ---------- step 4: the kit ---------- */
async function drawKit(run) {
  const d = state.picked; if (!d) return;
  const P = E.paletteOf(d.pair);
  // the versions: as it comes, see-through on a checker, black on white, white on its dark
  const vs = $("kit-versions");
  vs.innerHTML = [["colour", "Full colour"], ["transparent", "See-through"], ["black", "Black"], ["white", "White"]].map(([m, l]) => `<figure><canvas data-m="${m}" width="200" height="150"></canvas><figcaption>${l}</figcaption></figure>`).join("");
  for (const c of vs.querySelectorAll("canvas")) {
    const m = c.dataset.m, r = E.logoSvg(d, FACES, { mode: m, bg: false, pad: 0 }), im = await svgImage(r.svg), k = DPR(), W = 200, H = 150;
    c.width = W * k; c.height = H * k; const x = c.getContext("2d"); x.scale(k, k);
    if (m === "transparent") { for (let i = 0; i < W; i += 12) for (let j = 0; j < H; j += 12) { x.fillStyle = (i + j) / 12 % 2 ? "#d7dbe2" : "#f4f6f9"; x.fillRect(i, j, 12, 12); } }
    else { x.fillStyle = m === "colour" ? P.G : m === "black" ? "#ffffff" : "#1b1d22"; x.fillRect(0, 0, W, H); }
    const s = Math.min(W * .78 / r.w, H * .78 / r.h); x.drawImage(im, (W - r.w * s) / 2, (H - r.h * s) / 2, r.w * s, r.h * s);
    if (!entitled && window.PgfxMark) { x.setTransform(1, 0, 0, 1, 0, 0); window.PgfxMark.draw(x, c.width, c.height); }
  }
  if (run !== pickRun) return;
  // the card: the logo on the front, on its own ground, as the card maker's Logo layout sets it
  const card = $("kit-card"), cw = 700, ch = 400;
  await paint(card, d, { w: cw, h: ch, fill: .62, marked: !entitled });
  // the ads' badge: the name beside the mark, on a pill at the head of a full ad in the logo's colours
  await drawAdMock($("kit-ad"), d);
  await paintSvg($("kit-profile"), E.profileSvg(d, FACES, { size: 540 }).svg, { w: 270, h: 270, marked: !entitled });
  await paintSvg($("kit-cover"), E.coverSvg(d, FACES, { phone: studio.phone }).svg, { w: 820, h: 312, marked: !entitled });
  $("kit-card-go").href = "../cards/?logo=1";
  $("lg-kit").dataset.drawn = String(run);
}
/** what the full ad's badge looks like with the logo: the horizontal lockup on a pill of the logo's
 *  ground, over a picture of an ad in the logo's colours (the real one is drawn in Easy Mode) */
async function drawAdMock(c, d) {
  const P = E.paletteOf(d.pair), W = 300, H = 300, k = DPR();
  c.width = W * k; c.height = H * k; const x = c.getContext("2d"); x.scale(k, k);
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, P.G); g.addColorStop(1, E.mixHex(P.G, P.L, .55));
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const r = E.logoSvg(d, FACES, { form: "horizontal", bg: false, pad: .12 }), im = await svgImage(r.svg);
  const bh = 46, s = Math.min(bh / r.h, (W - 60) / r.w), bw = r.w * s;
  x.fillStyle = P.G; x.strokeStyle = P.A; x.lineWidth = 2;
  const rr = (X, Y, w, h, q) => { x.beginPath(); x.moveTo(X + q, Y); x.arcTo(X + w, Y, X + w, Y + h, q); x.arcTo(X + w, Y + h, X, Y + h, q); x.arcTo(X, Y + h, X, Y, q); x.arcTo(X, Y, X + w, Y, q); x.closePath(); };
  rr((W - bw) / 2, 16, bw, bh, bh / 2); x.fill(); x.stroke();
  x.drawImage(im, (W - bw) / 2, 16, bw, r.h * s);
  // the rest of the ad, as blocks: the headline, the product, the number on its pill
  x.fillStyle = P.I; x.font = "800 30px -apple-system,system-ui,sans-serif"; x.textAlign = "center";
  x.fillText("WE BUY " + (E.LINE_WORDS[d.cat] || "PHONES").split(" ")[0], W / 2, 108);
  const pic = await productPicture(d.cat);
  if (pic) { const k2 = Math.min(150 / pic.naturalWidth, 104 / pic.naturalHeight); x.save(); x.shadowColor = "rgba(0,0,0,.4)"; x.shadowBlur = 14; x.shadowOffsetY = 8; x.drawImage(pic, W / 2 - pic.naturalWidth * k2 / 2, 226 - pic.naturalHeight * k2, pic.naturalWidth * k2, pic.naturalHeight * k2); x.restore(); }
  x.fillStyle = P.P; rr(W / 2 - 100, 240, 200, 40, 20); x.fill();
  x.fillStyle = P.Q; x.font = "800 18px -apple-system,system-ui,sans-serif"; x.fillText(studio.phone || "(555) 555-5555", W / 2, 266);
  if (!entitled && window.PgfxMark) { x.setTransform(1, 0, 0, 1, 0, 0); window.PgfxMark.draw(x, c.width, c.height); }
}

/** a picture of what the line buys: the full ad's own cut-out (motion/subjects.json), never a drawn stand-in */
const LINE_FOR = { phones: "iphone", gaming: "console", gold: "gold", coins: "coins", pokemon: "pokemon", silver: "silver", cars: "car", sports: "sports",
  computers: "laptop", audio: "headphones", wearables: "watch", cameras: "camera", strips: "strips" };
let SUBJECTS = null; const pics = {};
async function productPicture(cat) {
  try {
    SUBJECTS ||= fetch(new URL("../motion/subjects.json", import.meta.url)).then(r => r.json()).then(j => j.subjects || []);
    const all = await SUBJECTS, S = all.find(s => s.key === LINE_FOR[cat]) || all.find(s => s.cat === cat);
    const set = S && S.sets && S.sets[0], f = set && set.slice().sort((a, b) => (b.k || 0) - (a.k || 0))[0];
    if (!f) return null;
    return await (pics[f.file] ||= new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = new URL("../assets/cutouts/" + f.file + ".webp", import.meta.url).href; }));
  } catch (e) { return null; }
}

/* ---------- the files: drawn by the function, after the plan is checked ---------- */
const VH = () => window.VideoHelp;
const plansAct = { label: "See plans", primary: true, run: () => { location.href = "../?plans=1"; } };
let entitled = false, files = null;
async function checkEntitled() {
  const acct = window.pgfxAccount;
  if (!acct) { entitled = false; return; }
  if (acct.demo) { entitled = true; return; }
  if (!acct.signedIn()) { entitled = false; return; }
  try { await acct.api("/export/check", { kind: "logo" }); entitled = true; } catch (e) { entitled = e.status === 402; }
}
function note(msg, bad) { const n = $("lg-note"); if (n) { n.textContent = msg; n.classList.toggle("bad", !!bad); } }
/** The design's files, once a design: from the function (which checks the plan and counts one
 *  download), or drawn here in the local demo, which has no function. */
async function getFiles(next) {
  const d = state.picked, key = JSON.stringify(d);
  if (files && files.key === key) return files;
  const acct = window.pgfxAccount;
  let got;
  if (!acct || acct.demo) got = { files: E.kitFiles(d, FACES, { phone: studio.phone }) };
  else {
    const message = "Create a free account, or sign in, to download your logo.";
    if (!acct.signedIn()) { acct.openAuth({ message, next }); return null; }
    try { got = await acct.api("/logo/file", { design: d, phone: studio.phone }); }
    catch (e) {
      if (e.status === 401 || e.status === 404) { acct.signout(); acct.openAuth({ message, next }); return null; }
      if (e.status === 403) { VH().show({ tone: "info", title: "Logo files come with Pro and Business", message: "Design and try as many logos as you like here. The full-size files (vector and picture, colour, see-through, black and white), the profile picture and the cover come with Pro ($60 a month) and Business ($100).", actions: [plansAct] }); return null; }
      if (e.status === 402) { VH().show({ tone: "info", title: "You've used this plan's downloads", message: (e.message ? e.message + ". " : "") + "Your logo files are one of your photo downloads.", actions: [plansAct] }); return null; }
      throw e;
    }
  }
  files = { key, svg: got.files };
  return files;
}
/** a PNG of an SVG at a size: w × h exactly, or its longest side at long */
async function png(svg, { long, w, h, bg } = {}) {
  const im = await svgImage(svg), ar = (im.naturalWidth || 1) / (im.naturalHeight || 1);
  const W = w || Math.round(ar >= 1 ? long : long * ar), H = h || Math.round(ar >= 1 ? long / ar : long);
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d"); if (bg) { x.fillStyle = bg; x.fillRect(0, 0, W, H); }
  x.drawImage(im, 0, 0, W, H);
  return new Promise(res => c.toBlob(b => b.arrayBuffer().then(a => res(new Uint8Array(a))), "image/png"));
}
const slug = () => (state.picked.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "business");
function save(bytes, name, type) { const blob = new Blob([bytes], { type }); if (VH() && VH().save) VH().save(blob, name); else { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); } }
async function busyDo(btn, fn) {
  const label = btn.textContent; btn.disabled = true; btn.textContent = "Making it…";
  try { await fn(); } catch (e) { console.error("logo files:", e); note("That did not work: " + (e.message || e) + ". Try again.", true); }
  finally { btn.disabled = false; btn.textContent = label; }
}
async function downloadKit(btn) {
  await busyDo(btn, async () => {
    const F = await getFiles(() => downloadKit(btn)); if (!F) return;
    const S = F.svg, enc = new TextEncoder(), out = [];
    for (const [n, svg] of Object.entries(S)) if (n.endsWith(".svg") && !/^(profile|cover)/.test(n)) out.push(["svg/" + n, enc.encode(svg)]);
    out.push(["png/logo.png", await png(S["logo.svg"], { long: 2400 })]);
    out.push(["png/logo-on-colour.png", await png(S["logo-on-colour.svg"], { long: 2400 })]);
    out.push(["png/logo-black.png", await png(S["logo-black.svg"], { long: 2400 })]);
    out.push(["png/logo-white.png", await png(S["logo-white.svg"], { long: 2400 })]);
    out.push(["png/logo-side-by-side.png", await png(S["logo-side-by-side.svg"], { long: 2400 })]);
    out.push(["png/mark.png", await png(S["mark.svg"], { long: 1024 })]);
    out.push(["png/favicon-180.png", await png(S["mark-on-colour.svg"], { long: 180 })]);
    out.push(["social/profile-picture.png", await png(S["profile.svg"], { w: 1080, h: 1080 })]);
    out.push(["social/facebook-cover.png", await png(S["cover.svg"], { w: 1640, h: 624 })]);
    out.push(["README.txt", enc.encode(S["README.txt"] || "")]);
    save(zip(out.map(([n, b]) => [slug() + "-logo/" + n, b])), slug() + "-logo.zip", "application/zip");
    note("Downloaded: your logo in vector (SVG) and picture (PNG) files, colour, see-through, black and white, with your profile picture and cover.");
  });
}
async function downloadOne(btn, which) {
  await busyDo(btn, async () => {
    const F = await getFiles(() => downloadOne(btn, which)); if (!F) return;
    if (which === "profile") save(await png(F.svg["profile.svg"], { w: 1080, h: 1080 }), slug() + "-profile-picture.png", "image/png");
    else save(await png(F.svg["cover.svg"], { w: 1640, h: 624 }), slug() + "-facebook-cover.png", "image/png");
    note(which === "profile" ? "Downloaded: your profile picture, 1080 by 1080." : "Downloaded: your Facebook cover, 1640 by 624.");
  });
}

/* ---------- a zip, stored (the PNGs are compressed already) ---------- */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
export function zip(entries) {
  const enc = new TextEncoder(), parts = [], central = []; let off = 0;
  const u16 = v => [v & 255, (v >>> 8) & 255], u32 = v => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
  const now = new Date(), dt = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)), dd = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate());
  for (const [name, data] of entries) {
    const nb = enc.encode(name), crc = crc32(data);
    const head = new Uint8Array([...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(dt), ...u16(dd), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nb.length), ...u16(0)]);
    parts.push(head, nb, data);
    central.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(dt), ...u16(dd), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nb.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)]), nb);
    off += head.length + nb.length + data.length;
  }
  const cdLen = central.reduce((a, b) => a + b.length, 0);
  const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(entries.length), ...u16(entries.length), ...u32(cdLen), ...u32(off), ...u16(0)]);
  const all = [...parts, ...central, end], out = new Uint8Array(all.reduce((a, b) => a + b.length, 0)); let o = 0;
  for (const p of all) { out.set(p, o); o += p.length; }
  return out;
}

/* ---------- the page ---------- */
let typing = 0;
function bind() {
  $("lg-form").addEventListener("submit", e => {
    e.preventDefault();
    state.name = $("lg-name").value; state.cat = $("lg-cat").value; state.town = $("lg-town").value;
    if (!state.name.trim()) { $("lg-name").focus(); return; }
    state.seed = 1; keep(); fillForm(); showGallery(true);
  });
  $("lg-cat").addEventListener("change", e => { state.cat = e.target.value; $("lg-small").placeholder = "WE BUY " + E.LINE_WORDS[state.cat]; });
  $("lg-tabs").addEventListener("click", e => {
    const b = e.target.closest("button[data-g]"); if (!b) return;
    state.group = b.dataset.g; keep();
    $("lg-tabs").querySelectorAll("button").forEach(x => x.setAttribute("aria-selected", String(x === b)));
    drawGallery(false);
  });
  $("lg-more").onclick = () => { state.seed++; keep(); drawGallery(true); };
  $("lg-small").addEventListener("input", e => {
    state.small = e.target.value; keep();
    if (!state.picked) return;
    clearTimeout(typing);
    typing = setTimeout(() => { state.picked = { ...state.picked, small: state.small }; keepKit(); files = null; drawPicked(); }, 300);
  });
  $("kit-zip").onclick = e => downloadKit(e.currentTarget);
  $("kit-profile-dl").onclick = e => downloadOne(e.currentTarget, "profile");
  $("kit-cover-dl").onclick = e => downloadOne(e.currentTarget, "cover");
  let resize = 0;
  window.addEventListener("resize", () => { clearTimeout(resize); resize = setTimeout(() => { if (state.picked && !$("lg-edit").hidden) drawPicked(); }, 250); });
}

async function start() {
  if (!state.name && studio.name) state.name = studio.name;
  if (!state.cat) state.cat = studio.cat || "phones";
  if (!state.town && studio.town) state.town = studio.town;
  fillForm(); bind();
  await checkEntitled();
  if (state.name.trim()) {
    $("lg-gallery").hidden = false;
    const g = $("lg-tabs").querySelector(`button[data-g="${state.group || ""}"]`); if (g) $("lg-tabs").querySelectorAll("button").forEach(x => x.setAttribute("aria-selected", String(x === g)));
    const shownGallery = drawGallery(false);
    if (state.picked) { $("lg-edit").hidden = false; $("lg-kit").hidden = false; await drawPicked(); }
    await shownGallery;
  }
  if (window.pgfxAccount && window.pgfxAccount.onChange) window.pgfxAccount.onChange(async () => { await checkEntitled(); files = null; if (state.picked) drawPicked(); });
}

window.LogoMaker = { state, E, FACES, need, zip, input, entitled: () => entitled, drawGallery, pick: i => { const b = document.querySelectorAll(".lg-tile:not(.wait)")[i]; if (b) b.click(); }, getFiles, ready: null };
window.LogoMaker.ready = start().catch(e => { console.error("logo maker:", e); note("The logo maker did not load. Reload the page.", true); });
