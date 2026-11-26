/* ═══════════════════════════════════════════════════════════════════════════
   THE LOGO MAKER AND BRAND KIT (logo/, DESIGN-LAW 176 and 180). The owner, 2026-11-24: "they need to be
   good, very, very good"; "they can go through each step and approve each one and then review them and
   then from there they can download the whole folder or they can go through the flow of making it, but
   they can't download it and it's watermarked and not enough quality"; "when you look in the view all
   [it] shows a title and the images listed in some sort of a grid".

   The customer came because they can't design, so every step shows finished results to approve, never
   settings to read: (1) the name, or name ideas from their own words (names.js), (2) a page of finished
   logos (engine.js gallery), (3) the one picked, made theirs, its files, (4 to 7) the kit a step at a time
   (kit.js FLOW: profiles and banners, the business card with their details, posts and stories, signs and
   web), each with Try another look and Looks good, (8) the whole kit in a grid, Essentials or Complete,
   bought once and downloaded as one folder, again any time.

   Paid: everything is designed and seen free, small and marked. The files are drawn by the function
   (/api/kits/file: netlify/lib/logos.mjs, the same engine) for a kit saved on the account: bought
   (plans.mjs KITS, on the page through Stripe's embedded form), or included with Pro and Business.

   The picked logo is saved for the rest of the site (localStorage pgfx_logo_kit): the card maker and the
   full ad's badge wear it. window.LogoMaker is for scripts/logo_check.mjs.
   ═══════════════════════════════════════════════════════════════════════════ */
import * as E from "./engine.js";
import * as KIT from "./kit.js";
import { nameIdeas } from "./names.js";
import { cardPdf, imagePdf, printLinks } from "./pdf.js";

const $ = id => document.getElementById(id);
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const box = (() => { try { const s = window.localStorage, k = "__logo_t"; s.setItem(k, "1"); s.removeItem(k); return s; } catch (e) { return null; } })();
const jget = (k, fb) => { try { const v = box && box.getItem(k); return v == null ? fb : JSON.parse(v); } catch (e) { return fb; } };
const jset = (k, v) => { try { if (box) box.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } };
const usd = c => "$" + (c % 100 ? (c / 100).toFixed(2) : String(c / 100));

/* the lines Easy Mode lists (app.js CATS), in its order, and the trade's own shops (DESIGN-LAW 180) */
const CATS = [["phones", "Phones & devices"], ["gaming", "Games & consoles"], ["gold", "Gold & jewelry"], ["coins", "Rare coins"], ["pokemon", "Trading cards"],
  ["silver", "Silver"], ["cars", "Cars & trucks"], ["sports", "Sports cards"], ["computers", "Computers & parts"], ["audio", "Headphones & audio"],
  ["wearables", "Watches & wearables"], ["cameras", "Cameras & drones"], ["strips", "Diabetic test strips"],
  ["devices", "Device store"], ["wholesale", "Wholesale & bulk lots"], ["resale", "Resale & trade-ins"]];
const STORE = "pgfx_logo", KITKEY = "pgfx_logo_kit";
const state = Object.assign({ name: "", cat: "", town: "", small: "", since: "", seed: 1, group: "", style: "", picked: null, details: {}, looks: {}, ok: {}, tier: "complete", format: "png", card: null, view: "", quiz: null, answers: null, hearts: [], aiPicks: [] }, jget(STORE, null) || {});
if (!KIT.KIT_FORMATS[state.format]) state.format = "png";
state.details ||= {}; state.looks ||= {}; state.ok ||= {};
const keep = () => jset(STORE, { name: state.name, cat: state.cat, town: state.town, small: state.small, since: state.since, seed: state.seed, group: state.group, style: state.style, picked: state.picked, details: state.details, looks: state.looks, ok: state.ok, tier: state.tier, format: state.format, card: state.card, view: state.view, quiz: state.quiz, answers: state.answers, hearts: state.hearts, aiPicks: state.aiPicks });
/** the logo the rest of the site wears: the card maker and the full ad read it */
const keepKit = () => { if (state.picked) jset(KITKEY, { v: E.ENGINE_VERSION, design: state.picked, at: Date.now() }); };
/* card: the layout and background chosen in the card maker (cards/, which writes it here; DESIGN-LAW 185) */
const spec = () => ({ design: state.picked, details: state.details, looks: state.looks, card: state.card });

/** what the customer already told the studio (app.js pgfx_brand, the full ad's pgfx_full_studio, Easy Mode's line) */
function fromStudio() {
  const brand = jget("pgfx_brand", null) || {}, fa = jget("pgfx_full_studio", null) || {}, cat = jget("pgfx_cat", "");
  const area = brand.area || null;
  return { name: brand.name || fa.biz || "", cat: CATS.some(c => c[0] === cat) ? cat : "", town: area && area.home ? String(area.home).split(",")[0].trim() : "", phone: brand.phone || "", site: brand.website || "" };
}
const studio = fromStudio();
/* the details the studio already has go into the kit's own, not only into the form's boxes: the card printed
   the sample number while the box showed the studio's (2026-11-25) */
if (!state.details.phone && studio.phone) state.details.phone = studio.phone;
if (!state.details.site && studio.site) state.details.site = studio.site;

/* ---------- the faces: one module a face, loaded when a logo set in it is drawn ---------- */
const FACES = {}, loading = {};
function need(keys) {
  return Promise.all([...new Set(keys)].map(k => FACES[k] ? null : (loading[k] ||= import(`./glyphs/${k}.js`).then(m => { FACES[k] = m.default; }))));
}
const needFor = ds => need(ds.flatMap(E.facesOf));

/* ---------- drawing: SVG onto a canvas ---------- */
function svgImage(svg) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })), im = new Image();
    im.onload = () => { URL.revokeObjectURL(url); res(im); };
    im.onerror = () => { URL.revokeObjectURL(url); rej(new Error("The logo could not be drawn")); };
    im.src = url;
  });
}
const DPR = () => Math.min(2, window.devicePixelRatio || 1);
/** a logo on a canvas: its ground, the art fitted with a margin, and the WeBuy.AD mark until it is theirs */
async function paint(canvas, d, { form = "primary", fill = .78, w, h, bg = true, marked = false } = {}) {
  await needFor([d]);
  const r = E.logoSvg(d, FACES, { form, bg: false, pad: 0 }), im = await svgImage(r.svg);
  const W = w || canvas.clientWidth || canvas.width, H = h || canvas.clientHeight || canvas.height, k = marked ? Math.min(1, DPR()) : DPR();
  canvas.width = Math.round(W * k); canvas.height = Math.round(H * k);
  const x = canvas.getContext("2d");
  x.setTransform(k, 0, 0, k, 0, 0);
  if (bg) { x.fillStyle = r.ground; x.fillRect(0, 0, W, H); } else x.clearRect(0, 0, W, H);
  const s = Math.min(W * fill / r.w, H * fill / r.h);
  x.drawImage(im, (W - r.w * s) / 2, (H - r.h * s) / 2, r.w * s, r.h * s);
  if (marked && window.PgfxMark) { x.setTransform(1, 0, 0, 1, 0, 0); window.PgfxMark.draw(x, canvas.width, canvas.height); }
  return r;
}

/* ---------- step 1: the name, and name ideas ---------- */
/** a new name or line starts the questionnaire afresh: its answers and hearts were for another business */
function newBusiness(was) {
  if (was === state.name.trim().toUpperCase() + "|" + state.cat && state.view) return;
  state.answers = null; state.hearts = []; state.aiPicks = []; state.quiz = { step: 0, styles: [], pairs: [], marks: [] }; state.view = "quiz"; state.style = "";
}
function input() { return { name: state.name.trim(), cat: state.cat || "phones", town: state.town.trim(), small: state.small.trim(), since: (state.since || "").trim() }; }
function fillForm() {
  $("lg-cat").innerHTML = CATS.map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join("");
  $("lg-name").value = state.name; $("lg-cat").value = state.cat || "phones"; $("lg-town").value = state.town;
  $("lg-small").value = state.small; $("lg-since").value = state.since || "";
  $("lg-small").placeholder = E.smallFor(state.cat || "phones");
}
let nmSeed = 1;
async function drawIdeas(given = null, append = false) {
  const words = $("nm-words").value, cat = $("lg-cat").value || "phones", town = $("lg-town").value;
  const list = given || nameIdeas({ keywords: words, cat, town }, { seed: nmSeed, n: 12 }), grid = $("nm-grid");
  if (!append) grid.innerHTML = "";
  const voices = ["bold", "street", "luxe", "retro", "tech", "stadium", "grotesk", "pop"], pairs = (E.gallery({ name: "X", cat }, { seed: nmSeed, n: 12 }) || []).map(d => d.pair);
  const designs = list.map((x, i) => E.cleanDesign({ t: "stacked", name: x.name, cat, voice: voices[i % voices.length], pair: pairs[i % pairs.length] || "navy_gold", small: " ", seed: i }));
  await needFor(designs);
  list.forEach((x, i) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "nm-idea" + (given ? " ai" : "");
    b.setAttribute("aria-label", "Use the name " + x.name);
    const c = document.createElement("canvas"); b.appendChild(c);
    const cap = document.createElement("span"); cap.innerHTML = `<b>${esc(x.name)}</b><small>${esc(x.why)}</small>`; b.appendChild(cap);
    b.onclick = () => { const was = state.name.trim().toUpperCase() + "|" + state.cat; $("lg-name").value = x.name; state.name = x.name; state.cat = cat; state.town = $("lg-town").value; newBusiness(was); state.seed = 1; state.picked = null; state.ok = {}; keep(); fillForm(); showGallery(true); };
    grid.appendChild(b);
    paint(c, designs[i], { w: 260, h: 130, fill: .86 }).catch(() => {});
  });
  $("nm-more-row").hidden = false;
}

/* the AI's ideas (netlify/lib/names.mjs): Claude mixes the customer's words in, for a few AI credits */
let aiCost = null, aiLogoCost = null;
async function aiReady() {
  try { const r = await fetch(new URL("../api/plans", import.meta.url)); const j = await r.json(); aiCost = j && j.ai && j.ai.names; aiLogoCost = j && j.ai && j.ai.logos; } catch (e) { aiCost = null; aiLogoCost = null; }
  // AI logo picks (DESIGN-LAW 186): offered beside the questions once the function says they are on and priced
  if (aiLogoCost) { $("lq-ai-go").textContent = "Ask AI to pick (" + aiLogoCost + " AI credits)"; doorsUI(); }
  const b = $("nm-ai"); if (b && aiCost) { b.hidden = false; b.textContent = "Ask AI for ideas (" + aiCost + " AI credits)"; }
}
async function askAI(btn) {
  const acct = window.pgfxAccount;
  if (!acct || !acct.signedIn()) { acct && acct.openAuth({ message: "Create a free account, or sign in: AI name ideas use your AI credits (Free has 5 a month).", next: () => askAI(btn) }); return; }
  const label = btn.textContent; btn.disabled = true; btn.textContent = "Thinking up names…";
  try {
    const j = await acct.api("/names", { keywords: $("nm-words").value, cat: $("lg-cat").value, town: $("lg-town").value });
    await drawIdeas(j.names.map(x => ({ ...x, why: x.why + " (AI)" })), false);
  } catch (e) {
    const g = $("nm-grid"), p = document.createElement("p"); p.className = "nm-err"; p.textContent = e.status === 402 ? "Out of AI credits for this month. The free ideas above never run out." : (e.message || "The AI did not answer.");
    g.prepend(p);
  } finally { btn.disabled = false; btn.textContent = label; }
}

/* ---------- step 2: the gallery ---------- */
const SHOW = 24;
let galleryRun = 0;
/* the style chips (DESIGN-LAW 186): All is the calm mix for the line; Bold is the gallery as it was */
const STYLE_KEYS = ["", "classic", "modern", "friendly", "luxury", "bold"];
const labelOf = d => `${E.LOGO_LAYOUTS[d.t].name} in ${E.paletteOf(d.pair).name}, ${E.LOGO_VOICES[d.voice].name} lettering`;
/* the gallery shows one of three views: the questionnaire, the logos (built from its answers and hearts), or the
   templates (every layout in the shop's name, to start from) */
const VIEWS = ["quiz", "logos", "templates", "ai"];
const viewNow = () => state.view === "ai" && !(state.aiPicks || []).length ? "logos" : VIEWS.includes(state.view) ? state.view : state.answers || state.picked ? "logos" : "quiz";
const HEARTS = 12;
/** a heart keeps what a logo is made of, not the logo (the taste, DESIGN-LAW 186) */
const heartOf = d => ({ t: d.t, voice: d.voice, pair: d.pair, mark: d.mark || "", line: !!d.line, icon: d.icon || "" });
const hearted = d => (state.hearts || []).some(h => h.t === d.t && h.voice === d.voice && h.pair === d.pair && (h.mark || "") === (d.mark || ""));
const taste = () => E.tasteOf(state.answers, state.hearts);
async function drawGallery(append = false) {
  const run = ++galleryRun, grid = $("lg-grid"), view = viewNow(), tpl = view === "templates", ai = view === "ai", whys = {};
  if (!append) grid.innerHTML = "";
  if (ai) (state.aiPicks || []).forEach((x, i) => { whys[i] = x.why; });
  const list = ai ? (state.aiPicks || []).map(x => E.cleanDesign({ ...x.design, ...input(), t: x.design.t })) : tpl ? E.templates(input()) : E.gallery(input(), { seed: state.seed, n: SHOW + 8, style: STYLE_KEYS.includes(state.style) ? state.style : "", like: taste() });
  const tiles = [], n = tpl || ai ? list.length : SHOW;
  for (let i = 0; i < n; i++) {
    const cell = document.createElement("div"); cell.className = "lg-cell";
    const b = document.createElement("button"); b.type = "button"; b.className = "lg-tile wait"; b.setAttribute("aria-label", "A logo, loading");
    cell.appendChild(b); grid.appendChild(cell); tiles.push(b);
  }
  await needFor(list);
  if (run !== galleryRun) return;
  let t = 0;
  for (const [li, d] of list.entries()) {
    if (t >= tiles.length) break;
    const b = tiles[t], c = document.createElement("canvas");
    let r;
    try { b.appendChild(c); r = await paint(c, d, { fill: .8 }); } catch (e) { c.remove(); continue; }
    if (run !== galleryRun) return;
    if (!r.ok) { c.remove(); continue; }   // a name too long for this layout at a size a logo is read at
    b.classList.remove("wait"); b.setAttribute("aria-label", (tpl ? "Start from this template: " : "Pick this logo: ") + labelOf(d)); b.title = labelOf(d);
    b.dataset.t = d.t; b.dataset.pair = d.pair; b.dataset.voice = d.voice; b.dataset.mark = d.mark || "";
    b.setAttribute("aria-pressed", String(!!state.picked && sameLogo(d, state.picked)));
    b.onclick = () => pick(d, b);
    if (ai && whys[li]) { const w = document.createElement("p"); w.className = "lg-why"; w.textContent = whys[li]; b.parentElement.appendChild(w); }
    if (!tpl && !ai) {
      // a heart: More leans toward what the hearted logos are made of
      const h = document.createElement("button"); h.type = "button"; h.className = "lg-heart"; h.textContent = "♥";
      const set = on => { h.setAttribute("aria-pressed", String(on)); h.setAttribute("aria-label", (on ? "Hearted: " : "Heart this logo: ") + labelOf(d)); };
      set(hearted(d));
      h.onclick = () => {
        const on = !hearted(d);
        state.hearts = (state.hearts || []).filter(x => !(x.t === d.t && x.voice === d.voice && x.pair === d.pair && (x.mark || "") === (d.mark || "")));
        if (on) state.hearts = [...state.hearts, heartOf(d)].slice(-HEARTS);
        keep(); set(on); heartsUI();
      };
      b.parentElement.appendChild(h);
    }
    t++;
  }
  for (; t < tiles.length; t++) tiles[t].parentElement.remove();
  grid.dataset.drawn = String(run);
  grid.dataset.count = String(grid.querySelectorAll(".lg-tile:not(.wait)").length);
}
const sameLogo = (a, b) => a && b && a.t === b.t && a.pair === b.pair && a.voice === b.voice && a.icon === b.icon && a.name === b.name && (a.mark || "") === (b.mark || "") && !!a.line === !!b.line;
function heartsUI() {
  const n = (state.hearts || []).length, el = $("lq-hearts");
  el.hidden = !n || viewNow() !== "logos";
  el.textContent = n === 1 ? "More leans toward the logo you hearted." : "More leans toward the " + n + " logos you hearted.";
}
/** the way in and out of each view: the questionnaire, 24 logos now, a template, the logo already picked */
function doorsUI() {
  const view = viewNow(), d = [];
  if (view !== "quiz") d.push(["quiz", state.answers ? "Change my answers" : "Answer 3 quick questions"]);
  if (view !== "logos") d.push(["logos", view === "quiz" ? "Show me 24 logos now" : "Back to the logos"]);
  if (view !== "templates") d.push(["templates", "Start from a template"]);
  if (aiLogoCost) d.push(["ai", view === "ai" ? "Ask AI again" : "Ask AI to pick for me (" + aiLogoCost + " AI credits)"]);
  if (state.picked) d.push(["edit", "Edit the logo I picked"]);
  $("lq-doors").innerHTML = `<span>Or</span>` + d.map(([k, l]) => `<button class="lg-link" type="button" data-go="${k}">${esc(l)}</button>`).join("");
  const sum = $("lq-sum");
  if (view === "templates") { sum.hidden = false; sum.innerHTML = "<b>Templates:</b> every layout, in your name. Tap one, then make it yours: colours, lettering, symbol and words."; }
  else if (view === "ai") { sum.hidden = false; sum.innerHTML = "<b>Picked by AI</b> for what you told it, from the same parts as every logo here. Tap one to make it yours."; }
  else if (view === "logos" && state.answers) {
    const a = state.answers, names = [...(a.styles || []).map(k => E.STYLES[k] && E.STYLES[k].name), ...(a.pairs || []).map(k => E.paletteOf(k).name), ...(a.marks || []).map(k => k === "name" ? "Just my name" : k === "initials" ? "My initials" : E.LOGO_MARKS[k] && E.LOGO_MARKS[k].name)].filter(Boolean);
    sum.hidden = false; sum.innerHTML = names.length ? "<b>Built from your answers:</b> " + esc(names.join(", ")) + "." : "<b>Built from your answers:</b> a surprise in every style that suits what you buy.";
  } else sum.hidden = true;
}
/** step 2 as the view says: the questionnaire, or a grid of logos or templates */
async function renderStep2() {
  const view = viewNow();
  $("lg-quiz").hidden = view !== "quiz"; $("lg-grid").hidden = view === "quiz"; $("lg-tabs").hidden = view !== "logos";
  $("lg-more-row").hidden = view !== "logos";
  $("lg-h2").textContent = view === "quiz" ? "Tell us what you like" : view === "templates" ? "Start from a template" : view === "ai" ? "The AI's picks for you" : "Tap the logo you like";
  doorsUI(); heartsUI();
  if (view === "quiz") return renderQuiz();
  return drawGallery(false);
}
async function showGallery(scroll) {
  const sec = $("lg-gallery"); sec.hidden = false;
  if (scroll) sec.scrollIntoView({ behavior: "smooth", block: "start" });
  await renderStep2();
}
function go(view) {
  if (view === "ai") { const box = $("lq-ai"); box.hidden = false; $("lq-ai-msg").textContent = ""; box.scrollIntoView({ behavior: "smooth", block: "center" }); $("lq-about").focus({ preventScroll: true }); return; }
  if (view === "edit") { if (!state.picked) return; $("lg-edit").hidden = false; drawPicked(); $("lg-edit").scrollIntoView({ behavior: "smooth", block: "start" }); return; }
  if (view === "quiz") state.quiz = { step: 0, styles: (state.answers || {}).styles || [], pairs: (state.answers || {}).pairs || [], marks: (state.answers || {}).marks || [] };
  if (view === "logos") state.seed = 1;
  state.view = view; keep(); renderStep2();
  $("lg-gallery").scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------- Ask AI to pick for me (netlify/lib/logo-ai.mjs, DESIGN-LAW 186) ----------
   Claude reads the shop's own words and the answers so far, and picks logos from the engine's catalogue for a few AI
   credits; the engine draws them here, as every logo on the page is drawn. */
async function askLogoAI() {
  const acct = window.pgfxAccount, btn = $("lq-ai-go"), msg = $("lq-ai-msg");
  if (!acct || !acct.signedIn()) { acct && acct.openAuth({ message: "Create a free account, or sign in: AI logo picks use your AI credits (Free has 5 a month).", next: () => askLogoAI() }); return; }
  const q = state.quiz || {}, answers = state.answers || { styles: q.styles || [], pairs: q.pairs || [], marks: q.marks || [] };
  const label = btn.textContent; btn.disabled = true; btn.textContent = "Picking logos for you…"; msg.textContent = ""; msg.classList.remove("bad");
  try {
    const j = await acct.api("/logo/picks", { about: $("lq-about").value.trim(), ...input(), answers });
    state.aiPicks = (j.picks || []).filter(x => x && x.design && E.LOGO_LAYOUTS[x.design.t]).map(x => ({ design: E.cleanDesign(x.design), why: String(x.why || "").slice(0, 110) }));
    if (!state.aiPicks.length) throw Object.assign(new Error("No picks came back: try again"), { status: 502 });
    state.view = "ai"; keep(); $("lq-ai").hidden = true;
    await renderStep2(); $("lg-gallery").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (e) {
    msg.textContent = e.status === 402 ? "Out of AI credits for this month. The questions, the logos and the templates here never run out." : (e.message || "The AI did not answer.");
    msg.classList.add("bad");
  } finally { btn.disabled = false; btn.textContent = label; }
}

/* ---------- the questionnaire (DESIGN-LAW 186) ---------- */
const QUIZ_STYLES = ["classic", "modern", "friendly", "luxury", "bold"];
let quizRun = 0;
/** a logo to dress in each answer: one of the first liked style's (a mark beside or above the name, where there is one) */
function quizBase(q, inp) {
  const st = (q.styles || []).find(s => s !== "bold") || "";
  const g = E.gallery(inp, { seed: 1, n: 12, style: st });
  const d = g.find(x => x.t === "lockup" || x.t === "centred") || g[0];
  return { ...d, pair: (q.pairs || [])[0] || d.pair };
}
function quizCards(q, inp) {
  if (q.step === 0) return QUIZ_STYLES.map(s => ({ key: s, label: E.STYLES[s].name, sub: E.STYLES[s].says, designs: E.gallery(inp, { seed: 1, n: 8, style: s }) }));
  const base = quizBase(q, inp);
  if (q.step === 1) return E.pairChoices(inp, q.styles).map(k => ({ key: k, label: E.paletteOf(k).name, designs: [{ ...base, pair: k }] }));
  // a symbol is judged by itself: each card shows the mark alone, large, in the shop's colours and initials
  return E.markChoices(inp.cat).map(k => ({ key: k, label: k === "name" ? "Just my name" : k === "initials" ? "My initials" : E.LOGO_MARKS[k].name,
    form: k === "name" ? "primary" : "mark",
    designs: [k === "name" ? { ...base, t: "wordmark", mark: "" } : k === "initials" ? { ...base, t: "interlace", mark: "" } : { ...base, t: "centred", mark: k, line: false }] }));
}
async function renderQuiz() {
  const run = ++quizRun, inp = input();
  const q = state.quiz && typeof state.quiz.step === "number" ? state.quiz : (state.quiz = { step: 0, styles: [], pairs: [], marks: [] });
  q.step = Math.max(0, Math.min(E.QUIZ.length - 1, q.step | 0));
  const Q = E.QUIZ[q.step], picks = q[Q.key] || (q[Q.key] = []);
  $("lq-count").textContent = `Question ${q.step + 1} of ${E.QUIZ.length}`; $("lq-q").textContent = Q.q; $("lq-hint").textContent = Q.hint;
  $("lq-back").hidden = q.step === 0;
  const last = q.step === E.QUIZ.length - 1, next = $("lq-next");
  next.textContent = last ? "Show my logos" : "Next"; next.disabled = !picks.length;
  const grid = $("lq-grid"), cards = quizCards(q, inp);
  grid.innerHTML = ""; grid.dataset.step = String(q.step); delete grid.dataset.drawn;
  const btns = cards.map(card => {
    const b = document.createElement("button"); b.type = "button"; b.className = "lq-card"; b.dataset.key = card.key;
    b.setAttribute("aria-pressed", String(picks.includes(card.key)));
    b.innerHTML = `<canvas></canvas><span>${esc(card.label)}${card.sub ? `<small>${esc(card.sub)}</small>` : ""}</span>`;
    b.setAttribute("aria-label", card.label + (card.sub ? ": " + card.sub : ""));
    b.onclick = () => {
      const i = picks.indexOf(card.key);
      if (i >= 0) picks.splice(i, 1); else { picks.push(card.key); while (picks.length > Q.max) picks.shift(); }
      grid.querySelectorAll(".lq-card").forEach(x => x.setAttribute("aria-pressed", String(picks.includes(x.dataset.key))));
      next.disabled = !picks.length; keep();
    };
    grid.appendChild(b);
    return [b, card];
  });
  await needFor(cards.flatMap(c => c.designs.slice(0, 3)));
  for (const [b, card] of btns) {
    if (run !== quizRun) return;
    const c = b.querySelector("canvas");
    for (const d of card.designs.slice(0, 4)) { try { const r = await paint(c, d, { fill: card.form === "mark" ? .62 : .8, w: 320, h: 240, form: card.form || "primary" }); if (r.ok) break; } catch (e) { /* the next one */ } }
  }
  if (run === quizRun) grid.dataset.drawn = String(run);
}
/** the next question, or the logos built from the answers; skip: this question answered "surprise me" */
function quizNext(skip) {
  const q = state.quiz; if (!q) return;
  if (skip) q[E.QUIZ[q.step].key] = [];
  if (q.step < E.QUIZ.length - 1) { q.step++; keep(); renderQuiz(); $("lg-gallery").scrollIntoView({ behavior: "smooth", block: "start" }); return; }
  state.answers = { styles: q.styles || [], pairs: q.pairs || [], marks: q.marks || [] };
  state.quiz = null; state.view = "logos"; state.seed = 1; state.style = "";
  $("lg-tabs").querySelectorAll("button").forEach(x => x.setAttribute("aria-selected", String(x.dataset.s === "")));
  keep(); renderStep2(); $("lg-gallery").scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------- step 3: the one picked ---------- */
function pick(d, tile) {
  state.picked = { ...d, small: state.small, town: state.town, since: state.since || "" };
  changed(); keepKit(); doorsUI();
  document.querySelectorAll(".lg-tile").forEach(b => b.setAttribute("aria-pressed", String(b === tile)));
  const first = $("lg-edit").hidden;
  $("lg-edit").hidden = false;
  drawPicked();
  if (first || tile) $("lg-edit").scrollIntoView({ behavior: "smooth", block: "start" });
}
/** the logo changed: what was approved after it is looked at again */
function changed() { state.ok = {}; keep(); rail(); }
let pickRun = 0;
// each row's choices and their names come from the engine (a calm logo's Symbol row is its line's catalogue of marks)
const ROWS = [["row-pair", "pair"], ["row-voice", "voice"], ["row-layout", "layout"], ["row-icon", "icon"], ["row-corners", "corners"], ["row-finish", "finish"]];
const sameDesign = (a, b) => JSON.stringify(E.cleanDesign(a)) === JSON.stringify(E.cleanDesign(b));
async function drawPicked() {
  const run = ++pickRun, d = state.picked; if (!d) return;
  const big = $("lg-big"), mine = owned();
  await paint(big, d, { w: big.parentElement.clientWidth || 600, h: Math.round((big.parentElement.clientWidth || 600) * .68), fill: .74, marked: !mine });
  if (run !== pickRun) return;
  big.dataset.drawn = String(run); big.dataset.marked = String(!mine);
  $("lg-big-cap").textContent = labelOf(d) + (mine ? "" : ". The WeBuy.AD mark comes off when the kit is yours.");
  for (const [id, axis] of ROWS) {
    const row = $(id), list = E.variants(d, axis, 8), name = v => E.variantName(v, axis);
    await needFor(list);
    if (run !== pickRun) return;
    // a finish needs a body to sit on: a wordmark has none, so its row is not offered
    if (axis === "finish") { const has = /linearGradient/.test(E.logoSvg({ ...d, finish: "gradient" }, FACES, {}).svg); row.hidden = !has; row.previousElementSibling.hidden = !has; if (!has) { row.innerHTML = ""; continue; } }
    // corners: offered where soft and sharp draw differently (a mark, a tile, a frame or a plate)
    if (axis === "corners") { const has = E.logoSvg({ ...d, sharp: false }, FACES, {}).svg !== E.logoSvg({ ...d, sharp: true }, FACES, {}).svg; row.hidden = !has; row.previousElementSibling.hidden = !has; if (!has) { row.innerHTML = ""; continue; } }
    row.innerHTML = "";
    for (const v of list) {
      const b = document.createElement("button"); b.type = "button";
      b.setAttribute("aria-pressed", String(sameDesign(v, d))); b.setAttribute("aria-label", name(v)); b.title = name(v);
      b.dataset.v = axis === "icon" ? (v.mark || v.icon || "") : String(axis === "layout" ? v.t : axis === "corners" ? !!v.sharp : v[axis]);
      const c = document.createElement("canvas"); b.appendChild(c);
      const lab = document.createElement("span"); lab.textContent = name(v); b.appendChild(lab);
      row.appendChild(b);
      b.onclick = () => { state.picked = { ...v }; changed(); keepKit(); drawPicked(); };
      paint(c, v, { w: 160, h: 120, fill: .8 }).catch(() => {});
    }
  }
  if (run !== pickRun) return;
  await drawStep("logo", run);
  $("lg-edit").dataset.drawn = String(run);
  okUI();
  if (state.ok.logo || !$("kit-review").hidden) { showSteps(); redrawSteps(); }
}

/* ---------- the kit's steps (4 to 7), each a set of files to approve ---------- */
const STEP_NUM = { social: 4, card: 5, posts: 6, print: 7 };
function buildSteps() {
  const host = $("kit-steps");
  host.innerHTML = KIT.FLOW.filter(f => f.key !== "logo").map(f => `
  <section class="kit-step" id="step-${f.key}" data-step="${f.key}" aria-labelledby="step-${f.key}-h" hidden>
    <p class="lg-step"><span>${STEP_NUM[f.key]}</span> ${esc(f.title)}</p>
    <h2 id="step-${f.key}-h">${esc(f.title)}</h2>
    <p class="lg-sub">${esc(f.says)}</p>
    ${f.key === "card" ? detailsForm() : ""}
    <div class="kit-files" id="files-${f.key}"></div>
    ${f.key === "card" ? `<p class="kit-card-more"><a href="../cards/">More layouts and backgrounds for your card</a> <span class="lg-opt">the card you pick there is the one in your kit</span></p>
      <div class="kit-print"><h3 class="kit-h3">Print it today</h3><p>FedEx Office, Staples and Office Depot OfficeMax all offer same-day business cards to pick up in the store if you order by about midday, and other print shops near you may too. Ask for 16 pt card stock, matte or gloss, with the bleed, and call ahead.</p>
      <div class="kit-print-ask"><div class="lg-field"><label for="pt-where">Your ZIP code or town</label><input id="pt-where" type="text" maxlength="40" autocomplete="postal-code" placeholder="90802"></div></div>
      <div class="kit-print-links" id="pt-links"></div>
      <p class="kit-print-small">These open <span id="pt-maps">Google Maps</span> with the search you see. Nothing about you is sent anywhere until you open one. <button class="kit-print-switch" id="pt-switch" type="button">Use Apple Maps instead</button></p></div>` : ""}
    <div class="kit-ok-row"><button class="lg-btn" type="button" data-look="${f.key}">Try another look</button><span class="kit-ok-done" id="ok-${f.key}-done" hidden>✓ Approved</span><button class="lg-btn primary" type="button" id="ok-${f.key}" data-ok="${f.key}">Looks good. Next</button></div>
  </section>`).join("");
  host.querySelectorAll("[data-look]").forEach(b => b.onclick = () => { const k = b.dataset.look; state.looks[k] = ((state.looks[k] || 0) + 1) % 1000; if (k === "card") state.card = null; state.ok[k] = false; keep(); rail(); okUI(); drawStep(k); });
  host.querySelectorAll("[data-ok]").forEach(b => b.onclick = () => approve(b.dataset.ok));
  const det = $("kit-details");
  if (det) det.addEventListener("input", e => {
    const f = e.target.closest("input"); if (!f) return;
    state.details[f.name] = f.value; keep();
    clearTimeout(detTimer); detTimer = setTimeout(() => { for (const k of ["card", "posts", "print"]) drawStep(k); }, 350);
  });
  const pt = $("pt-where");
  if (pt) {
    // the card maker's own Print it today (print-today.js): the maps app the device has, round the area's point
    const area = (jget("pgfx_brand", null) || {}).area || {};
    pt.value = jget("pgfx_print_where", "") || area.zip || "";
    pt.addEventListener("input", () => jset("pgfx_print_where", pt.value));
    import("./print-today.js").then(T => T.mountPrint({ input: pt, links: $("pt-links"), mapsName: $("pt-maps"), switchBtn: $("pt-switch"), linkClass: "kit-print-link", esc }));
  }
}
let detTimer = 0;
const DETAILS = [["person", "Your name", "Maria Lopez", "name"], ["role", "Your title", "Owner", "organization-title"], ["phone", "Phone", "(562) 555-0123", "tel"],
  ["email", "Email", "hello@yourshop.com", "email"], ["site", "Website", "yourshop.com", "url"], ["handle", "Instagram or TikTok", "@yourshop", "off"],
  ["address", "Address", "123 Main St, Long Beach", "street-address"], ["hours", "Hours", "MON-SAT 10AM-7PM", "off"]];
function detailsForm() {
  return `<form class="kit-details" id="kit-details" onsubmit="return false"><p class="kit-details-h">Your details <span class="lg-opt">they go on the back of your card, your posts and your email signature. Leave any blank.</span></p>
    <div class="kit-details-grid">${DETAILS.map(([k, l, ph, ac]) => `<div class="lg-field"><label for="det-${k}">${l}</label><input id="det-${k}" name="${k}" type="${k === "email" ? "email" : k === "phone" ? "tel" : "text"}" maxlength="${KIT.DETAIL_LIMITS[k]}" placeholder="${esc(ph)}" autocomplete="${ac}" value="${esc(state.details[k] || (k === "phone" ? studio.phone : ""))}"></div>`).join("")}</div></form>`;
}
function showSteps() {
  for (const f of KIT.FLOW) if (f.key !== "logo") $("step-" + f.key).hidden = false;
  $("kit-review").hidden = false;
}
function approve(k) {
  state.ok[k] = true; keep(); rail(); okUI();
  const order = KIT.FLOW.map(f => f.key), next = order[order.indexOf(k) + 1];
  if (k === "logo") { showSteps(); redrawSteps(); }
  const to = next ? $("step-" + next) : $("kit-review");
  if (!next) drawReview();
  if (to) to.scrollIntoView({ behavior: "smooth", block: "start" });
}
/** the fast lane (2026-11-25, the owner: "easier to generate, easier to use"): every step approved as it is
    drawn, straight to the review. The steps stay on the page above it, each with Try another look. */
async function approveAll() {
  for (const f of KIT.FLOW) state.ok[f.key] = true;
  keep(); rail(); okUI(); showSteps();
  note("Drawing your whole kit…");
  /* the steps above the review are drawn first: scrolled to before they were, the review moved on down the page
     as they filled in, and the visitor was left at the business card (the iPhone app, 2026-11-25) */
  await Promise.all(KIT.FLOW.filter(f => f.key !== "logo").map(f => drawStep(f.key)));
  drawReview();
  note("");
  requestAnimationFrame(() => $("kit-review").scrollIntoView({ behavior: "smooth", block: "start" }));
}
function okUI() {
  for (const f of KIT.FLOW) {
    const done = $("ok-" + f.key + "-done"), btn = $("ok-" + f.key);
    if (done) done.hidden = !state.ok[f.key];
    if (btn) btn.textContent = state.ok[f.key] ? "Approved. Next" : f.key === "logo" ? "This is my logo. Next" : "Looks good. Next";
  }
}
function redrawSteps() { for (const f of KIT.FLOW) if (f.key !== "logo") drawStep(f.key); drawReview(); }

/** a file's preview: small and marked until the kit is theirs (crisp and clean after) */
const PREVIEW_MAX = 420;
async function drawFile(fig, F, sp, mine, run, k) {
  const r = KIT.kitSvg(F.id, sp, FACES), im = await svgImage(r.svg);
  if (run !== stepRuns[k]) return;
  const c = fig.querySelector("canvas"), box = fig.querySelector(".kit-art");
  const W = r.w, H = r.h, long = mine ? Math.min(1600, Math.max(W, H)) : Math.min(PREVIEW_MAX, Math.max(W, H)), s = long / Math.max(W, H);
  c.width = Math.max(1, Math.round(W * s)); c.height = Math.max(1, Math.round(H * s));
  const x = c.getContext("2d");
  const P = E.paletteOf(sp.design.pair);
  if (F.clear) { x.fillStyle = F.on || P.G; x.fillRect(0, 0, c.width, c.height); }
  x.drawImage(im, 0, 0, c.width, c.height);
  if (!mine && window.PgfxMark) window.PgfxMark.draw(x, c.width, c.height);
  box.classList.toggle("round", F.round === true); box.classList.toggle("hl", F.round === "highlight");
  fig.dataset.drawn = "1"; fig.dataset.marked = String(!mine);
}
const stepRuns = {};
async function drawStep(k, outer) {
  const host = $("files-" + k); if (!host || !state.picked) return;
  const run = stepRuns[k] = (stepRuns[k] || 0) + 1, sp = spec(), mine = owned();
  await needFor([state.picked]);
  if (run !== stepRuns[k]) return;
  const list = KIT.FORMATS.filter(F => F.step === k);
  host.innerHTML = list.map(F => `<figure class="kit-file${F.tier === "complete" ? " complete" : ""}${F.card ? " card" : ""}" data-id="${F.id}">
    <div class="kit-art"><canvas aria-label="${esc(F.title)}"></canvas></div>
    <figcaption><b>${esc(F.title)}</b>${F.sub ? `<small>${esc(F.sub)}</small>` : ""}${F.tier === "complete" ? `<em>Complete</em>` : ""}</figcaption></figure>`).join("");
  host.classList.toggle("essentials", state.tier === "essentials");
  const figs = [...host.querySelectorAll("figure")];
  for (let i = 0; i < list.length; i++) { try { await drawFile(figs[i], list[i], sp, mine, run, k); } catch (e) { console.warn("kit file", list[i].id, e); } if (run !== stepRuns[k]) return; }
  host.dataset.drawn = String(run);
  void outer;
}

/* ---------- the rail: where the customer is, and what is approved ---------- */
function rail() {
  const r = $("kit-rail"); if (!r) return;
  r.hidden = !state.picked;
  const items = [["lg-start", "Name", !!state.name], ["lg-gallery", "Logo", !!state.picked], ["lg-edit", "Make it yours", !!state.ok.logo],
    ...KIT.FLOW.filter(f => f.key !== "logo").map(f => ["step-" + f.key, f.title.replace(/,.*| and .*/, ""), !!state.ok[f.key]]), ["kit-review", "Review", false]];
  $("kit-rail-list").innerHTML = items.map(([id, l, done], i) => `<li><a href="#${id}"${done ? ` class="done"` : ""}><span>${done ? "✓" : i + 1}</span>${esc(l)}</a></li>`).join("");
}

/* ---------- step 8: the review, the kits, the purchase, the download ---------- */
let acctKits = null;   // GET /api/kits: { included, credits, saved, prices }
const PRICES = () => (acctKits && acctKits.prices) || { essentials: KIT.KIT_TIERS.essentials.price, complete: KIT.KIT_TIERS.complete.price, upgrade: KIT.KIT_TIERS.complete.price - KIT.KIT_TIERS.essentials.price, addonOff: 500 };
const keyOf = n => String(n || "").toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
const savedKit = () => acctKits && state.picked ? acctKits.saved.find(k => keyOf(k.name) === keyOf(state.picked.name)) : null;
/** whether this logo's kit is the customer's already (bought, or with the plan): previews unmarked */
function owned() {
  const acct = window.pgfxAccount;
  if (acct && acct.demo) return true;
  return !!(acctKits && (acctKits.included || savedKit()));
}
async function loadKits() {
  const acct = window.pgfxAccount;
  acctKits = null;
  if (!acct || acct.demo || !acct.signedIn()) return mineUI();
  try { acctKits = await acct.api("/kits"); } catch (e) { if (e.status === 401 || e.status === 404) acct.signout(); }
  mineUI();
}
function mineUI() {
  const sec = $("kit-mine"), list = acctKits ? acctKits.saved : [];
  sec.hidden = !list.length;
  $("kit-mine-list").innerHTML = list.map(k => `<div class="kit-mine-item"><div><b>${esc(k.name)}</b><small>${esc(KIT.KIT_TIERS[k.tier].name)} · ${KIT.COUNTS[k.tier]} files · saved ${new Date(k.at).toLocaleDateString()}</small></div>
    <div class="kit-mine-acts"><button class="lg-btn" type="button" data-open="${esc(k.id)}">Open</button><button class="lg-btn primary" type="button" data-dl="${esc(k.id)}">Download again</button></div></div>`).join("");
  sec.querySelectorAll("[data-dl]").forEach(b => b.onclick = () => downloadSaved(b.dataset.dl, b));
  if (list.length) $("kit-mine-list").before(formatPicker());
  sec.querySelectorAll("[data-open]").forEach(b => b.onclick = () => openSaved(b.dataset.open));
}
function openSaved(id) {
  const k = acctKits && acctKits.saved.find(x => x.id === id); if (!k) return;
  const s = k.spec || {};
  state.picked = s.design; state.details = s.details || {}; state.looks = s.looks || {}; state.name = s.design.name; state.cat = s.design.cat; state.town = s.design.town || ""; state.small = s.design.small || "";
  state.ok = { logo: true, social: true, card: true, posts: true, print: true }; state.tier = k.tier; keep(); keepKit(); fillForm();
  state.view = "logos"; $("lg-gallery").hidden = false; renderStep2(); $("lg-edit").hidden = false; buildSteps(); drawPicked().then(() => $("kit-review").scrollIntoView({ behavior: "smooth" }));
}

function tiersUI() {
  const P = PRICES(), sk = savedKit(), inc = acctKits && acctKits.included;
  $("kit-tiers").innerHTML = ["essentials", "complete"].map(t => {
    const T = KIT.KIT_TIERS[t], on = state.tier === t;
    const price = inc ? "Included with your plan" : sk && (sk.tier === "complete" || sk.tier === t) ? "Yours" : sk && t === "complete" ? usd(P.upgrade) + " to upgrade" : usd(P[t]) + " once";
    return `<button type="button" role="radio" aria-checked="${on}" class="kit-tier${on ? " on" : ""}" data-tier="${t}"><b>${T.name}</b><span class="kit-tier-n">${KIT.COUNTS[t]} files</span><span class="kit-tier-p">${esc(price)}</span><small>${esc(T.says)}</small></button>`;
  }).join("");
  $("kit-tiers").querySelectorAll("[data-tier]").forEach(b => b.onclick = () => { state.tier = b.dataset.tier; keep(); tiersUI(); drawReview(); document.querySelectorAll(".kit-files").forEach(h => h.classList.toggle("essentials", state.tier === "essentials")); });
}
let reviewRun = 0;
async function drawReview() {
  if (!state.picked || $("kit-review").hidden) return;
  tiersUI(); buyUI();
  const run = ++reviewRun, sp = spec(), mine = owned(), host = $("kit-all"), list = KIT.kitFor(state.tier);
  await needFor([state.picked]);
  if (run !== reviewRun) return;
  host.innerHTML = KIT.FLOW.map(f => {
    const fs = list.filter(F => F.step === f.key); if (!fs.length) return "";
    return `<h3 class="kit-h3">${esc(f.title)} <span>${fs.length}</span>${state.ok[f.key] ? ` <i>✓ Approved</i>` : ""}</h3><div class="kit-files review">${fs.map(F => `<figure class="kit-file${F.card ? " card" : ""}" data-id="${F.id}"><div class="kit-art"><canvas aria-label="${esc(F.title)}"></canvas></div><figcaption><b>${esc(F.title)}</b><small>${esc(F.sub || sizeOf(F))}</small></figcaption></figure>`).join("")}</div>`;
  }).join("");
  stepRuns.review = run;
  for (const fig of host.querySelectorAll("figure")) { try { await drawFile(fig, KIT.FORMAT[fig.dataset.id], sp, mine, run, "review"); } catch (e) { console.warn(e); } if (run !== reviewRun) return; }
  host.dataset.drawn = String(run);
}
const sizeOf = F => F.w ? F.w + " × " + F.h : "Vector and picture";

/** the purchase panel: what this account can do with this kit now */
function buyUI() {
  const acct = window.pgfxAccount, P = PRICES(), t = state.tier, T = KIT.KIT_TIERS[t], el = $("kit-buy"), sk = savedKit();
  const n = KIT.COUNTS[t], btn = (id, label, cls = "primary") => `<button class="lg-btn ${cls}" id="${id}" type="button">${label}</button>`;
  let html;
  if (acct && acct.demo) html = `<p>Demo: the kit downloads as it would once bought.</p>${btn("kit-dl", "Download my brand kit (" + n + " files)")}`;
  else if (sk && (sk.tier === "complete" || t === "essentials")) html = `<p><b>This kit is yours.</b> It's saved to your account: download it again any time, and change its colours or details whenever you like.</p>${btn("kit-dl", "Download my brand kit (" + KIT.COUNTS[sk.tier] + " files)")}`;
  else if (sk) html = `<p>You have Essentials for this kit. Complete adds ${KIT.COUNTS.complete - KIT.COUNTS.essentials} more files: highlights, stories, posts, more platforms, signs and a brand guide.</p>${btn("kit-up", "Upgrade to Complete for " + usd(P.upgrade))}${btn("kit-dl", "Download Essentials", "")}`;
  else if (acctKits && acctKits.included) html = `<p><b>Your plan includes the Complete kit.</b> It saves to your account when you download it.</p>${btn("kit-dl", "Download my brand kit (" + KIT.COUNTS.complete + " files)")}`;
  else if (acctKits && (acctKits.credits[t] || acctKits.credits.complete)) html = `<p><b>You have a brand kit to use.</b> It's kept for this business name, and you can download it again any time.</p>${btn("kit-dl", "Use it for " + esc(state.picked.name) + " and download")}`;
  else html = `<div class="kit-buy-box"><div><b>${esc(T.name)}: ${n} files, ${usd(P[t])} once</b><p>Yours to keep and download again any time, saved to your account. No subscription. With Starter, a kit is ${usd(P.addonOff)} less.</p></div>
    <label class="kit-agree"><input type="checkbox" id="kit-agree"> I agree to the <a href="../terms.html" target="_blank" rel="noopener">Terms of Service</a> and have read the <a href="../privacy.html" target="_blank" rel="noopener">Privacy Policy</a>.</label>
    ${btn("kit-pay-go", "Buy " + T.name + " for " + usd(P[t]))}<a class="lg-link" href="../?plans=1">Or get a plan: Pro includes Complete</a></div>`;
  el.innerHTML = html;
  const dl = $("kit-dl"); if (dl) { dl.before(formatPicker()); dl.onclick = () => getAndDownload(dl); }
  const up = $("kit-up"); if (up) up.onclick = () => pay("upgrade", up, { kitId: sk.id });
  const go = $("kit-pay-go"); if (go) { go.disabled = true; $("kit-agree").onchange = e => { go.disabled = !e.target.checked; }; go.onclick = () => pay(t, go); }
}
/** the file types: the same designs as PNG, JPG, SVG, PDF or all of them, downloaded again any time */
function formatPicker() {
  const box = document.createElement("div"); box.className = "kit-format"; box.setAttribute("role", "radiogroup"); box.setAttribute("aria-label", "File type");
  box.innerHTML = `<span class="kit-format-h">File type</span>` + Object.entries(KIT.KIT_FORMATS).map(([k, f]) => `<button type="button" role="radio" data-fmt="${k}" aria-checked="${state.format === k}" title="${esc(f.says)}">${f.name}</button>`).join("")
    + `<small>${esc(KIT.KIT_FORMATS[state.format].says)}. Download again in any type, any time.</small>`;
  box.onclick = e => { const b = e.target.closest("[data-fmt]"); if (!b) return; state.format = b.dataset.fmt; keep(); box.replaceWith(formatPicker()); document.querySelectorAll(".kit-mine .kit-format").forEach(x => x.replaceWith(formatPicker())); };
  return box;
}
function note(msg, bad) { const n = $("lg-note"); if (n) { n.textContent = msg; n.classList.toggle("bad", !!bad); } const b = $("kit-buy"); const m = b && b.querySelector(".kit-msg"); if (m) m.remove(); if (b && msg) { const p = document.createElement("p"); p.className = "kit-msg" + (bad ? " bad" : ""); p.textContent = msg; b.appendChild(p); } }
const VH = () => window.VideoHelp;

/** Save this kit on the account (a bought kit, or the plan's), then download it */
async function getAndDownload(btn) {
  const acct = window.pgfxAccount;
  if (acct && acct.demo) return busy(btn, () => downloadFiles({ files: localFiles(state.tier), readme: KIT.readme(spec(), state.tier, FACES), tier: state.tier, name: state.picked.name }, state.format));
  if (!acct || !acct.signedIn()) { acct && acct.openAuth({ message: "Create a free account, or sign in, to keep your brand kit.", next: () => loadKits().then(() => { drawReview(); }) }); return; }
  await busy(btn, async () => {
    let kit;
    try { const j = await acct.api("/kits/save", { spec: spec(), tier: state.tier }); kit = j.kit; acctKits = { ...acctKits, ...j }; delete acctKits.kit; }
    catch (e) { if (e.status === 402) { await loadKits(); drawReview(); note("Buy a kit to download this one."); return; } throw e; }
    mineUI();
    await downloadSaved(kit.id);
  });
}
async function downloadSaved(id, btn) {
  const acct = window.pgfxAccount;
  const run = async () => { const got = await acct.api("/kits/file", { id }); await downloadFiles({ ...got, name: got.kit.name }, state.format); };
  return btn ? busy(btn, run) : run();
}
/** the demo, which has no function: the same files drawn here */
function localFiles(tier) { const sp = spec(), out = {}; for (const F of KIT.kitFor(tier)) out[F.id] = KIT.kitSvg(F.id, sp, FACES).svg; return out; }

/* the folder: every file a PNG at its size (the logo's long side at 2400), the vectors kept as SVG, the
   card's print PDF (both sides drawn at 600 dpi), and the note */
async function png(svg, { long, w, h, scale = 1 } = {}) {
  const im = await svgImage(svg), ar = (im.naturalWidth || 1) / (im.naturalHeight || 1);
  const W = Math.round((w || (ar >= 1 ? long : long * ar)) * scale), H = Math.round((h || (ar >= 1 ? long / ar : long)) * scale);
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  c.getContext("2d").drawImage(im, 0, 0, W, H);
  const bytes = await new Promise(res => c.toBlob(b => b.arrayBuffer().then(a => res(new Uint8Array(a))), "image/png"));
  c.width = c.height = 1;
  return bytes;
}
/** a JPEG at a file's size, on a colour where the file is see-through (a JPEG has no see-through) */
async function jpegAt(svg, { long, w, h, scale = 1 }, bg) {
  const im = await svgImage(svg), ar = (im.naturalWidth || 1) / (im.naturalHeight || 1);
  const W = Math.round((w || (ar >= 1 ? long : long * ar)) * scale), H = Math.round((h || (ar >= 1 ? long / ar : long)) * scale);
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d"); x.fillStyle = bg || "#ffffff"; x.fillRect(0, 0, W, H); x.drawImage(im, 0, 0, W, H);
  const bytes = await new Promise(res => c.toBlob(b => b.arrayBuffer().then(a => res(new Uint8Array(a))), "image/jpeg", .92));
  c.width = c.height = 1;
  return { bytes, w: W, h: H };
}
async function jpeg(svg, w, h) {
  const im = await svgImage(svg), c = document.createElement("canvas"); c.width = w; c.height = h;
  c.getContext("2d").drawImage(im, 0, 0, w, h);
  const bytes = await new Promise(res => c.toBlob(b => b.arrayBuffer().then(a => res(new Uint8Array(a))), "image/jpeg", .95));
  c.width = c.height = 1;
  return { bytes, w, h };
}
const slugOf = n => (String(n || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "business");
async function downloadFiles(got, fmt = "png") {
  if (!KIT.KIT_FORMATS[fmt]) fmt = "png";
  const enc = new TextEncoder(), out = [], list = KIT.kitFor(got.tier), root = slugOf(got.name) + "-brand-kit" + (fmt === "png" ? "" : "-" + fmt) + "/", want = f => fmt === "all" || fmt === f;
  let i = 0;
  for (const F of list) {
    const svg = got.files[F.id]; if (!svg) continue;
    note("Making your files: " + (++i) + " of " + list.length + "…");
    const size = F.long ? { long: F.long } : { w: F.w, h: F.h, scale: F.id === "sign-window" ? 1.5 : 1 }, base = root + F.dir + "/" + F.file;
    if (want("png")) out.push([base + ".png", await png(svg, size)]);
    if (want("jpg")) out.push([base + ".jpg", (await jpegAt(svg, size, F.clear ? (F.on || "#ffffff") : null)).bytes]);
    if (want("svg") || (fmt === "png" && F.vector)) out.push([base + ".svg", enc.encode(svg)]);
    if (want("pdf")) { const j = await jpegAt(svg, size, F.clear ? (F.on || "#ffffff") : null), pt = F.inches ? [F.inches[0] * 72, F.inches[1] * 72] : [j.w * .75, j.h * .75]; out.push([base + ".pdf", imagePdf(j, pt[0], pt[1])]); }
  }
  if (got.files["card-front"] && got.files["card-back"]) {
    const pdf = cardPdf([await jpeg(got.files["card-front"], 2250, 1350), await jpeg(got.files["card-back"], 2250, 1350)]);
    out.push([root + "04-business-card/business-card-print.pdf", pdf]);
  }
  out.push([root + "README.txt", enc.encode(got.readme || "")]);
  save(zip(out), slugOf(got.name) + "-brand-kit" + (fmt === "png" ? "" : "-" + fmt) + ".zip", "application/zip");
  note("Downloaded: your " + KIT.KIT_TIERS[got.tier].name + " brand kit as " + KIT.KIT_FORMATS[fmt].name + ", " + list.length + " files in one folder. Download it again any time, in any file type.");
}
function save(bytes, name, type) { const blob = new Blob([bytes], { type }); if (VH() && VH().save) VH().save(blob, name); else { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); } }
async function busy(btn, fn) {
  const label = btn.textContent; btn.disabled = true; btn.textContent = "Making it…";
  try { await fn(); } catch (e) { console.error("brand kit:", e); note("That did not work: " + (e.message || e) + ". Try again.", true); }
  finally { btn.disabled = false; btn.textContent = label; }
}

/* ---------- paying for a kit, on the page (Stripe's embedded form; its hosted page if that cannot load) ---------- */
let stripeLoad = null;
function loadStripe() {
  if (window.Stripe) return Promise.resolve(window.Stripe);
  return stripeLoad ||= new Promise((res, rej) => { const s = document.createElement("script"); s.src = "https://js.stripe.com/dahlia/stripe.js"; s.async = true; s.onload = () => window.Stripe ? res(window.Stripe) : rej(new Error("Stripe did not load")); s.onerror = () => { stripeLoad = null; rej(new Error("Stripe did not load")); }; document.head.appendChild(s); });
}
let embedded = null;
async function pay(kit, btn, extra = {}) {
  const acct = window.pgfxAccount;
  if (!acct || !acct.signedIn()) { acct && acct.openAuth({ message: "Create a free account, or sign in, so your brand kit is kept for you.", next: () => loadKits().then(() => drawReview()) }); return; }
  keep();
  await busy(btn, async () => {
    let j;
    try { j = await acct.api("/checkout", { kit, consent: true, embedded: true, ...extra }); }
    catch (e) {
      if (/not enabled/i.test(e.message)) { note("Checkout opens soon. Nothing was charged.", true); return; }
      if (e.status === 409 && e.data && e.data.included) { await loadKits(); drawReview(); return; }
      throw e;
    }
    if (!j.clientSecret) { location.href = j.url; return; }
    const Stripe = await loadStripe().catch(() => null);
    if (!Stripe) { const h = await acct.api("/checkout", { kit, consent: true, ...extra }); location.href = h.url; return; }
    if (embedded) { try { embedded.destroy(); } catch (e) { /* gone */ } }
    const stripe = Stripe(j.publishableKey), create = stripe.createEmbeddedCheckoutPage ? "createEmbeddedCheckoutPage" : "initEmbeddedCheckout";
    embedded = await stripe[create]({ fetchClientSecret: () => Promise.resolve(j.clientSecret), onComplete: () => { try { embedded.destroy(); } catch (e) { /* gone */ } embedded = null; $("kit-pay").innerHTML = ""; afterPaid(j.sessionId); } });
    $("kit-pay").innerHTML = `<div class="kit-pay-box"><div id="kit-pay-mount"></div></div>`;
    embedded.mount("#kit-pay-mount");
    $("kit-pay").scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
/** back from paying (the embedded form, or Stripe's page): the kit goes on from Stripe's own record, is
 *  saved for this logo, and downloads */
async function afterPaid(sid) {
  const acct = window.pgfxAccount;
  note("Payment received. Getting your kit ready…");
  try {
    for (let i = 0; i < 4; i++) { const r = await acct.api("/checkout/confirm", { session_id: sid }); if (!r.pending) break; await new Promise(res => setTimeout(res, 1500)); }
    await loadKits();
    drawReview(); drawPicked();
    const b = $("kit-dl"); if (b) { note("Paid. Your kit is yours: download it now, or any time from this page."); b.focus(); }
  } catch (e) { note("Your payment went through, but the kit did not load: reload this page. " + (e.message || ""), true); }
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
    const was = state.name.trim().toUpperCase() + "|" + state.cat;
    state.name = $("lg-name").value; state.cat = $("lg-cat").value; state.town = $("lg-town").value;
    if (!state.name.trim()) { $("lg-name").focus(); return; }
    newBusiness(was); state.seed = 1; keep(); fillForm(); showGallery(true);
  });
  // the questionnaire's buttons and the ways in and out of it (DESIGN-LAW 186)
  $("lq-next").onclick = () => quizNext(false);
  $("lq-skip").onclick = () => quizNext(true);
  $("lq-back").onclick = () => { if (state.quiz && state.quiz.step > 0) { state.quiz.step--; keep(); renderQuiz(); } };
  $("lq-doors").addEventListener("click", e => { const b = e.target.closest("button[data-go]"); if (b) go(b.dataset.go); });
  $("lq-ai-go").onclick = () => askLogoAI();
  $("lq-ai-close").onclick = () => { $("lq-ai").hidden = true; };
  $("lg-cat").addEventListener("change", e => { state.cat = e.target.value; $("lg-small").placeholder = E.smallFor(state.cat); });
  $("nm-open").onclick = () => { const p = $("nm-panel"), open = p.hidden; p.hidden = !open; $("nm-open").setAttribute("aria-expanded", String(open)); if (open) { $("nm-words").focus(); if (!$("nm-grid").children.length) drawIdeas(); } };
  $("nm-go").onclick = () => { nmSeed = 1; drawIdeas(); };
  $("nm-words").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); nmSeed = 1; drawIdeas(); } });
  $("nm-more").onclick = () => { nmSeed++; drawIdeas(); };
  $("nm-ai").onclick = () => askAI($("nm-ai"));
  $("lg-tabs").addEventListener("click", e => {
    const b = e.target.closest("button[data-s]"); if (!b) return;
    state.style = b.dataset.s; state.seed = 1; keep();
    $("lg-tabs").querySelectorAll("button").forEach(x => x.setAttribute("aria-selected", String(x === b)));
    drawGallery(false);
  });
  $("lg-more").onclick = () => { state.seed++; keep(); drawGallery(true); };
  $("lg-small").addEventListener("input", e => {
    state.small = e.target.value; keep();
    if (!state.picked) return;
    clearTimeout(typing);
    typing = setTimeout(() => { state.picked = { ...state.picked, small: state.small }; changed(); keepKit(); drawPicked(); }, 300);
  });
  $("lg-since").addEventListener("input", e => {
    state.since = e.target.value; keep();
    if (!state.picked) return;
    clearTimeout(typing);
    typing = setTimeout(() => { state.picked = { ...state.picked, since: state.since }; changed(); keepKit(); drawPicked(); }, 300);
  });
  $("ok-logo").onclick = () => approve("logo");
  $("ok-all").onclick = approveAll;
  let resize = 0;
  window.addEventListener("resize", () => { clearTimeout(resize); resize = setTimeout(() => { if (state.picked && !$("lg-edit").hidden) paint($("lg-big"), state.picked, { w: $("lg-big").parentElement.clientWidth || 600, h: Math.round(($("lg-big").parentElement.clientWidth || 600) * .68), fill: .74, marked: !owned() }); }, 250); });
}

/** back from Stripe's own page: /logo/?checkout=success&session_id=… */
async function checkoutReturn() {
  const q = new URLSearchParams(location.search), sid = q.get("session_id");
  if (q.get("checkout") === "cancel") { note("Checkout closed. Nothing was charged."); history.replaceState(null, "", location.pathname); return; }
  if (q.get("checkout") !== "success" || !sid) return;
  history.replaceState(null, "", location.pathname);
  const acct = window.pgfxAccount;
  if (acct && acct.signedIn()) await afterPaid(sid);
}

async function start() {
  if (!state.name && studio.name) state.name = studio.name;
  if (!state.cat) state.cat = studio.cat || "phones";
  if (!state.town && studio.town) state.town = studio.town;
  fillForm(); bind(); buildSteps(); rail();
  aiReady();
  await loadKits();
  if (state.name.trim()) {
    $("lg-gallery").hidden = false;
    const g = $("lg-tabs").querySelector(`button[data-s="${STYLE_KEYS.includes(state.style) ? state.style : ""}"]`); if (g) $("lg-tabs").querySelectorAll("button").forEach(x => x.setAttribute("aria-selected", String(x === g)));
    const shownGallery = renderStep2();
    if (state.picked) { $("lg-edit").hidden = false; await drawPicked(); }
    await shownGallery;
  }
  await checkoutReturn();
  if (window.pgfxAccount && window.pgfxAccount.onChange) window.pgfxAccount.onChange(async () => { await loadKits(); if (state.picked) { drawPicked(); } });
}

window.LogoMaker = { state, E, KIT, FACES, need, zip, input, owned, kits: () => acctKits, drawGallery, renderStep2, go, drawReview, approve, spec,
  pick: i => { const b = document.querySelectorAll(".lg-tile:not(.wait)")[i]; if (b) b.click(); }, localFiles, downloadFiles, ready: null };
window.LogoMaker.ready = start().catch(e => { console.error("logo maker:", e); note("The logo maker did not load. Reload the page.", true); });
