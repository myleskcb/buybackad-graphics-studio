/* THE FULL AD IN EASY MODE (DESIGN-LAW 141, 2026-11-13).

   The owner, of a Neon Vault ad downloaded from Easy Mode: "This isn't really a cohesive ad
   ... Where are the assets? ... how do we make it go above and beyond", "How do we integrate the
   type faces and how do we integrate general design language to fix this?", "I know it's a
   sample, but regardless the samples should look good too", "make sure the unification from
   photos and videos is ready".

   The house design language is the full ad (motion/fullad.js, rule 137): a claim, a headline with
   one accent word, the models, the product's own pictures, the selling points, a sticker, the
   number in its pill, the towns and the website, in one of the colour themes as a pair (rule 154). Until
   today it lived only in the video maker; the page where a picture customer starts had no way to
   it (OPEN-ITEMS §BC 3), and the first card that page handed a new visitor was a photograph with
   words on it.

   This module puts it there. It is the first card in Easy Mode's strip for every line the full
   ad draws (motion/subjects.json: 41 lines in 13 categories), and the card a visitor who has
   never picked a design opens on. It is drawn by the video maker's own class, so the picture a
   customer downloads here and the video they make of it there are one ad:

     - the strip: one more card, first, with the line's own full ad on it;
     - step 2: the number, the website and the area as before, then the full ad's own short
       form (what you buy, the words, the colours, the typeface) in place of a template's;
     - step 3: the full ad as the preview; Download saves it at the plan's size after the full
       ad's pre-flight (fullPreflight) has measured the delivered picture; Create video opens
       the video maker on the same ad.

   A template picked from the strip steps it back, and everything about templates is as it was:
   the full ad is never a member of TEMPLATES, so no pass, audit or table of the photo ads sees
   it. Every function it wraps is wrapped, not spliced (AGENT-BRIEF 1).

   Check: node scripts/full_ad_studio_check.mjs */
import { loadPhones, loadFonts, fontsFor } from "./motion/engine.js";
import { DEFAULT_STYLE, DEFAULT_PHONES, TYPE_VOICES, FONTS } from "./motion/catalog.js";
import { loadAccents, ACCENT_SETS } from "./motion/accents.js";
import { FullAd, fullStyle, fullPreflight, fullStill, loadSubjectSet, COLOURWAYS, COLOUR_OF, fullVoiceOk, poolEntryFor } from "./motion/fullad.js";
import * as FULL from "./motion/fullad.js";
/* the ground photograph is loaded before an ad is drawn for keeps (fullGroundReady, 2026-11-18); a
   copy of fullad.js from before it draws no photograph and needs no wait */
const groundReady = st => (typeof FULL.fullGroundReady === "function" ? FULL.fullGroundReady(st) : Promise.resolve());
import { FULL_VOICES } from "./motion/full-voices.js";

const KEY = "pgfx_full_studio", HANDOFF = "pgfx_full_handoff";
/* ?fullad=0: Easy Mode opens on a template as it did before today, for a check of the templates'
   own first run (scripts/area_dialog_check.mjs). The card stays in the strip. */
const DEFAULT_OFF = /[?&]fullad=0\b/.test(location.search);
const at = p => new URL(p, import.meta.url).href;
const WORD_FIELDS = [
  // [key in the saved words, label, what an empty field gives, the most letters]
  ["headline", "Headline", "", 44],
  ["tag", "Line under it", "the models you buy, or how it works", 44],
  ["claim", "Bold claim at the top", "empty gives one from the list", 34],
  ["points", "Selling points", "three, with commas: FREE QUOTE, CASH TODAY, NO FEES", 70],
  ["burst", "Sticker", "one or two short words: CASH!", 14],
  ["label", "Above your number", "CALL OR TEXT", 24],
];

const saved = (() => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } })();
const FA = Object.assign({ on: false, line: {}, set: {}, seed: 1, pair: "", voice: "", words: {}, biz: "", recipe: {} }, saved || {});
if (!FA.recipe || typeof FA.recipe !== "object") FA.recipe = {};
const live = { holding: false, n: 0, ad: null, subjects: [], thumbs: {}, timer: 0, ready: null, loaded: {}, recipes: null, byId: {} };
const assets = { phones: {}, index: [], accents: {} };
const keep = () => { try { localStorage.setItem(KEY, JSON.stringify({ on: FA.on, line: FA.line, set: FA.set, seed: FA.seed, pair: FA.pair, voice: FA.voice, words: FA.words, biz: FA.biz, recipe: FA.recipe })); } catch (e) { /* private mode */ } };

const el = id => document.getElementById(id);
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const linesOf = cat => live.subjects.filter(s => s.cat === cat);
// a line folded into another (the owner's lines, 2026-11-18: the Switch into Handhelds, Android tablets into Androids) is that line
const lineNow = () => { const ls = linesOf(currentCat), k = FA.line[currentCat]; return ls.find(s => s.key === ((live.aliases || {})[k] || k)) || ls[0] || null; };

/* ---------- from the library: every older ad as a recipe (motion/recipes.json, DESIGN-LAW 144) ----------
   The owner, 2026-11-18: "rebuild how we arrived to these ads so every single one can be made a
   video". A library card, a designer layout or an offer card, read as it opened (its words, its
   product, its ground photograph, its colours and faces: scripts/build_recipes.mjs), drawn by the
   full ad: a photo here, the same ad as a video in the maker. What the visitor types still wins. */
function loadRecipes() {
  if (!live.recipes) live.recipes = fetch(at("./motion/recipes.json")).then(r => r.json()).then(j => { const L = j.recipes || []; if (j.lean) L.forEach(r => { if (r.hint) r.hint.lean = j.lean; }); live.byId = Object.fromEntries(L.map(r => [r.id, r])); return L; })
    .catch(e => { console.warn("recipes:", e); live.recipes = null; return []; });
  return live.recipes;
}
/** The recipe on for this category, once the recipes are here, and only while its line is the one shown. */
const recipeNow = () => { const r = live.byId[FA.recipe[currentCat]]; const S = lineNow(); return r && S && r.subject === S.key ? r : null; };

/* ---------- what the ad is drawn from ---------- */

/** The lines, the icon, and the pictures and faces of the line on screen. */
function ready() {
  const S = lineNow(); if (!S) return Promise.reject(new Error("no line"));
  live.base = live.base || Promise.all([
    /* the full ad draws one icon, from the "cash" set (fullad.js ICONS): its three cutouts and no
       more (the maker's nine weigh 1.1 MB), so the icon drawn here is the one the maker draws */
    loadAccents(at("./assets/cutouts/"), ACCENT_SETS.cash.map(i => i.asset).filter(Boolean)).then(a => { assets.accents = a; }),
  ]);
  // a recipe's own pictures; or none at all where its words name goods its line has no picture of (words_only)
  const R = recipeNow(), own = !!(R && R.pictures && R.pictures.length), bare = !own && !!(R && R.words_only);
  // a line's pool: only the entry this seed draws is loaded (fullad.js poolEntryFor), so the key names it
  const iph = S.key === "iphone", set = own ? 0 : S.sets.length ? (FA.set[S.key] | 0) % S.sets.length : 0, seed = FA.seed | 0 || 1;
  const ent = !own && !bare && !iph && !set && (S.pool || []).length ? poolEntryFor(S.pool, seed) : -1, k = own ? "recipe|" + R.id : bare ? "bare" : S.key + "|" + set + (ent >= 0 ? "|e" + ent : "");
  if (!live.loaded[k]) live.loaded[k] = (own
    ? loadSubjectSet({ key: "recipe:" + R.id, label: S.label, sets: [R.pictures] }, 0, at("./assets/cutouts/")).then(got => { Object.assign(assets.phones, got.assets); return got.ids; })
    : bare ? Promise.resolve([])
    : iph
    /* every phone the shop buys (1.2 MB), not the default four alone: a full ad nobody picked the phones
       for draws its set by its seed, the in-demand models most (fullad.js drawPhones, 2026-11-18) */
    ? loadPhones(at("./motion/phones/")).then(({ phones, index }) => { Object.assign(assets.phones, phones); assets.index = index; return DEFAULT_PHONES.filter(id => phones[id]); })
    : S.sets.length ? loadSubjectSet(S, set, at("./assets/cutouts/"), ent >= 0 ? { seed } : {}).then(got => { Object.assign(assets.phones, got.assets); return got.ids; }) : Promise.resolve([])
  ).catch(e => { delete live.loaded[k]; throw e; });
  return Promise.all([live.base, live.loaded[k]]).then(([, ids]) => ({ S, ids, set, recipe: own ? R : recipeNow() }));
}

/** The towns a full ad names: the area's own, as the studio's service-area lines say them. */
function whereNow() {
  let a = null; try { a = typeof getArea === "function" ? getArea() : null; } catch (e) { /* none */ }
  if (!a) return "";
  const towns = (a.cover || []).map(s => String(s).split(",")[0].trim().toUpperCase()).filter(Boolean);
  const home = String(a.home || "").split(",")[0].trim().toUpperCase();
  return (towns.length ? [...new Set(home ? [home, ...towns] : towns)].slice(0, 3) : home ? [home] : []).join(" • ");
}

/** The style the engine draws: the visitor's words over the line's own, the house style locked. */
function styleNow(S, ids, set, size, R = recipeNow()) {
  const iph = S.key === "iphone", w = FA.words[S.key] || {}, rw = (R && R.words) || {}, own = !!(R && R.pictures && R.pictures.length);
  const F = size || FORMATS[ez.format] || FORMATS.square, ar = F.w / F.h;
  const aspect = ar >= 1.3 ? "16:9" : ar <= .62 ? "9:16" : Math.abs(ar - 1) < .02 ? "1:1" : "4:5";
  const up = v => String(v || "").trim().toUpperCase();
  // words that follow the product the seed drew (a MacBook Neo is named as one: motion/subjects.json variants)
  const V = !own && !R ? (S.variants || []).find(v => ids.some(id => new RegExp(v.match).test(id))) : null;
  const base = { ...DEFAULT_STYLE, lang: "en",
    headline: up(w.headline) || up(rw.headline) || (V ? V.heads[0] : S.heads[0]).toUpperCase(),
    tag: up(w.tag) || up(rw.tag) || (iph ? "" : (V ? V.models : S.models).toUpperCase()),
    points: up(w.points) || up(rw.points) || (iph ? null : S.points),
    number: el("ez-phone").value.trim(), number_label: up(w.label) || up(rw.label),
    site: el("ez-website").value.trim(), biz: String(FA.biz || "").trim(),
    // a recipe's own pictures are kept as given (subject_set: the full ad draws a line's pool only at 0)
    aspect, seed: FA.seed | 0 || 1, subject: iph ? "" : S.key, subject_set: (own || (R && R.words_only)) && !iph ? 1 : set, phones: ids.length ? ids.slice() : ["none"] };
  // a library design is a lean, not a lock (the rebuild, 2026-11-18: "take them as inspiration but rebuild
  // them all"): its photograph is a ground it may stand on where it fits the product drawn, its family and
  // colourway what its seed leans toward (fullad.js fullStyle)
  if (R && R.ground_photo) base.ground_hint = { ...R.ground_photo };
  if (R && R.hint) base.hint = R.hint;
  const where = whereNow(); if (where) base.feed_where = where;
  // a typed business name takes the badge over a library design's claim (the full ad's own rule); typed words over both
  if (up(w.claim)) base.feed_claim = up(w.claim); else if (up(rw.claim) && !String(FA.biz || "").trim()) base.feed_claim = up(rw.claim);
  if (up(w.burst) || up(rw.burst)) base.feed_burst = up(w.burst) || up(rw.burst);
  // the face: one picked, the house face ("house"), or none, and the seed draws one (fullStyle, rule 154). A
  // recipe's card pair and face are leans (its hint), never kept as picked: only a pick by hand is
  const pair = FA.pair || "", voice = FA.voice === "house" ? "house" : fullVoiceOk(FA.voice) ? FA.voice : "";
  const pick = { ...(COLOUR_OF[pair] ? { palette: pair } : {}), ...(voice ? { type_pair: voice } : {}) };
  return { st: fullStyle(base, base.seed, assets.index, pick), W: F.w, H: F.h };
}

async function build(px, size) {
  const { S, ids, set, recipe } = await ready();
  const { st, W, H } = styleNow(S, ids, set, size, recipe);
  await Promise.all([loadFonts([...fontsFor(st), "franklin"]), groundReady(st)]);
  const k = px / Math.min(W, H);
  return { ad: new FullAd(st, assets, Math.round(W * k), Math.round(H * k)), st, S };
}

/* ---------- the preview ---------- */

const PLAIN = { fix: "Fix before you post", note: "Worth a look" };
function say(pre) {
  const box = el("fa-say"); if (!box) return;
  const fs = pre ? pre.findings.filter(f => f.level === "fix" || f.level === "note") : [];
  box.hidden = !fs.length;
  box.innerHTML = fs.slice(0, 3).map(f => `<p class="${f.level}"><b>${PLAIN[f.level]}:</b> ${esc(f.say)}</p>`).join("");
}
/** The size the download will be for this visitor (the plan's cap on the size asked for), without
 *  asking them anything: the preview is laid out at it. */
function filePx() {
  let px = 1440; try { px = ezExportPx(); } catch (e) { /* the usual size */ }
  try { if (!(account && account.role === "admin")) px = Math.min(px, (planOf() || {}).maxPx || 1080); } catch (e) { px = Math.min(px, 1080); }
  return px;
}
async function draw() {
  const n = ++live.n;
  try {
    /* THE PREVIEW IS THE FILE, SMALLER (rule 141). The full ad is laid out at the size it is drawn
       (type set to the pixel, sprites trimmed), so a preview laid out at 720 and a file at 1440
       were the same ad a few pixels apart. The preview is the file's own picture, scaled down. */
    busy(true);
    const { ad, st, S } = await build(filePx());
    if (n !== live.n || !FA.on) return;
    const frame = fullStill(ad);
    live.ad = ad;
    const k = Math.min(1, 900 / Math.max(frame.width, frame.height)), small = document.createElement("canvas");
    small.width = Math.round(frame.width * k); small.height = Math.round(frame.height * k);
    const sx = small.getContext("2d"); sx.imageSmoothingQuality = "high"; sx.drawImage(frame, 0, 0, small.width, small.height);
    /* the preview says what it shows (its number, line, colours, type and size) and is aria-busy
       until it is current: a check, and a screen reader, wait on that and not on the clock */
    /* marked as its download would be (app.js previewMarks: signed out or Free), so a screenshot
       or a saved preview is no cleaner than the Free download */
    const img = el("fa-preview"); if (img) { img.src = typeof previewJpeg === "function" ? previewJpeg(small, .9) : small.toDataURL("image/jpeg", .9); img.dataset.drawn = String(n);
      img.dataset.marked = String(typeof previewMarked === "boolean" ? previewMarked : false);
      Object.assign(img.dataset, { number: st.number || "", line: S.key, colour: st.full_colour || "", type: st.full_pair ? st.type_pair : "", fmt: ez.format || "square" }); }
    let pre = null; try { pre = fullPreflight(ad, frame); } catch (e) { console.warn("full ad pre-flight:", e); }
    say(pre);
    await tip(ad, n);
    if (n === live.n) busy(false);            // current: the picture, what the pre-flight says of it, and the size's tip
  } catch (e) { console.warn("full ad:", e); if (n === live.n) { busy(false); fail(e); } }
}
/* THE SIZE THAT SHOWS THE PRODUCT (OPEN-ITEMS §BC 7: "say so where the size is chosen"). A square
   holds nine blocks, and the product is what gives way: measured 2026-11-13 over six lines it
   covers 5 to 8% of a square and 10 to 24% of a Tall 3:4. So where the size is picked, the page
   lays the same ad out tall and says how much larger the product would stand, when it is half
   again or more; one tap takes it. Measured each time, never a figure written here. */
const shareOf = ad => { const g = ad.full && ad.full.group; return g ? (g[2] - g[0]) * (g[3] - g[1]) / (ad.W * ad.H) : 0; };
async function tip(ad, n) {
  let box = el("fa-tip");
  if (!box) { box = document.createElement("div"); box.id = "fa-tip"; box.className = "fa-tip"; box.hidden = true; const sizes = el("ez-sizes"); if (!sizes) return; sizes.insertAdjacentElement("afterend", box); }
  const S = lineNow(), now = shareOf(ad), tallAlready = (FORMATS[ez.format] || FORMATS.square).h > (FORMATS[ez.format] || FORMATS.square).w * 1.2;
  if (!S || !now || tallAlready || !FORMATS.three4) { box.hidden = true; return; }
  try {
    const tall = shareOf((await build(540, FORMATS.three4)).ad);
    if (n !== live.n || !FA.on) return;
    const k = tall / now;
    if (!(k >= 1.5)) { box.hidden = true; return; }
    const times = k >= 2.75 ? "about three times" : k >= 1.9 ? "about twice" : "about half again";
    box.innerHTML = `<span>On <b>Tall 3:4</b> the ${esc(S.label)} would stand ${times} as large on the ad.</span> <button type="button" id="fa-tip-go">Use Tall 3:4</button>`;
    box.dataset.times = k.toFixed(2); box.hidden = false;
    el("fa-tip-go").onclick = () => { const b = document.querySelector('#ez-sizes .ez-size[data-fmt="three4"]'); if (b) b.click(); };
  } catch (e) { box.hidden = true; }
}
const busy = on => { const img = el("fa-preview"); if (img) img.setAttribute("aria-busy", on ? "true" : "false"); };
const later = (ms = 200) => { busy(true); clearTimeout(live.timer); live.timer = setTimeout(draw, ms); };
/** The full ad could not be drawn (a picture or the engine did not arrive): the visitor is put
 *  back on the design they had, never left on an empty preview. */
function fail(e) {
  if (!FA.on) return;
  leave();
  try { schedEzPreview(0); toast("The full ad could not load just now. Your last design is back.", "error"); } catch (x) { /* the page says nothing */ }
}

/* ---------- the strip's card ---------- */

function placeholder(c) {
  const g = c ? c.colors : { ground: "#12234f", accent: "#f5b301" };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 132 132"><rect width="132" height="132" fill="${g.ground}"/><rect x="18" y="92" width="96" height="22" rx="11" fill="${g.accent}"/><rect x="26" y="26" width="80" height="14" rx="4" fill="#ffffff"/><rect x="34" y="46" width="64" height="14" rx="4" fill="${g.accent}"/></svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}
async function thumb(img, S) {
  const k = S.key + "|" + (FA.pair || "") + "|" + (FA.voice || "") + "|" + (FA.seed | 0) + "|" + (FA.recipe[currentCat] || "");
  if (live.thumbs[k]) { img.src = live.thumbs[k]; return; }
  if (!img.getAttribute("src")) img.src = placeholder(COLOUR_OF[FA.pair] || COLOUR_OF[COLOURWAYS[0]]);
  try {
    const got = await ready(); if (got.S !== lineNow()) return;
    const { st } = styleNow(got.S, got.ids, got.set, FORMATS.square, got.recipe);
    /* the strip shows a card with the studio's sample number, as every card beside it does */
    const shown = { ...st, number: "(562) 999-4994" };
    await Promise.all([loadFonts([...fontsFor(shown), "franklin"]), groundReady(shown)]);
    const c = fullStill(new FullAd(shown, assets, 396, 396));
    live.thumbs[k] = c.toDataURL("image/jpeg", .86);
    if (img.isConnected) img.src = live.thumbs[k];
  } catch (e) { /* the placeholder stays */ }
}
function tile() {
  const strip = el("ez-strip"), S = lineNow(); if (!strip) return;
  let b = strip.querySelector(".ez-fulltile");
  if (!S) { if (b) b.remove(); return; }
  if (!b) {
    b = document.createElement("button"); b.type = "button"; b.className = "ez-tpl ez-fulltile"; b.dataset.tpl = "full";
    b.title = "Every part of a buying ad on one picture, in one style. The same ad makes your video.";
    b.innerHTML = `<img alt="The full ad"><span class="tpl-name"><b class="fa-new">NEW</b>Full ad</span>`;
    b.onclick = () => selectEzTpl("full");
    strip.prepend(b);
  }
  mark();
  thumb(b.querySelector("img"), S);
}
function mark() {
  const strip = el("ez-strip");
  document.querySelectorAll("#ez-strip .ez-tpl").forEach(b => b.classList.toggle("sel", FA.on ? b.dataset.tpl === "full" : b.dataset.tpl === ez.tpl));
  /* the card that is on is the first one: the strip had been scrolled to the template under it */
  if (FA.on && strip) { strip.scrollLeft = 0; requestAnimationFrame(() => { strip.scrollLeft = 0; if (strip._syncArrows) strip._syncArrows(); }); }
}

/* ---------- the form ---------- */

/** The library's designs for this category, grouped by what they buy, as a choice. */
function libraryField() {
  if (!live.recipes) loadRecipes().then(() => { if (FA.on) buildForm(); });
  const L = Object.values(live.byId).filter(r => r.cat === currentCat);
  if (!L.length) return "";
  const on = FA.recipe[currentCat] || "", groups = {};
  for (const r of L) (groups[r.subject] ||= []).push(r);
  return `<div class="ez-field"><label for="fa-recipe">From the library <span class="fa-opt">a library design drawn as this ad, photo and video</span></label><select id="fa-recipe" class="cat-select"><option value="">None: the line's own words and pictures</option>`
    + Object.entries(groups).map(([k, rs]) => `<optgroup label="${esc((live.subjects.find(s => s.key === k) || {}).label || k)}">${rs.map(r => `<option value="${esc(r.id)}"${r.id === on ? " selected" : ""}>${esc(r.label)}</option>`).join("")}</optgroup>`).join("")
    + `</select></div>`;
}

function buildForm() {
  let f = el("fa-form");
  if (!f) {
    f = document.createElement("div"); f.id = "fa-form";
    const after = el("ez-area") && el("ez-area").closest(".ez-field");
    if (after) after.insertAdjacentElement("afterend", f); else el("ez-form-card").appendChild(f);
  }
  const S = lineNow(); if (!S) return;
  const ls = linesOf(currentCat), w = FA.words[S.key] || {}, voices = FULL_VOICES.filter(k => fullVoiceOk(k)), R = recipeNow(), rw = (R && R.words) || {};
  const field = ([k, label, hint, max]) => `<div class="ez-field"><label for="fa-${k}">${label}${hint ? ` <span class="fa-opt">${esc(hint)}</span>` : ""}</label>
    <div class="ez-fieldrow"><input id="fa-${k}" data-word="${k}" type="text" maxlength="${max}" value="${esc(w[k] || "")}" placeholder="${rw[k] ? esc(rw[k]) : k === "headline" ? esc(S.heads[0].toUpperCase()) : k === "tag" && S.key !== "iphone" ? esc(S.models.toUpperCase()) : ""}">${k === "headline" && S.heads.length > 1 ? `<button type="button" class="ez-edit-btn" id="fa-next-head" title="Another headline">&#10227;</button>` : ""}</div></div>`;
  f.innerHTML =
    (ls.length > 1 ? `<div class="ez-field"><label for="fa-line">What you buy <span class="fa-opt">its pictures and its models line come with it</span></label><select id="fa-line" class="cat-select">${ls.map(s => `<option value="${s.key}"${s === S ? " selected" : ""}>${esc(s.label)}</option>`).join("")}</select></div>` : "")
    + libraryField()
    + `<div class="ez-field"><label for="fa-biz">Your business name <span class="fa-opt">optional: it takes the badge at the top</span></label><div class="ez-fieldrow"><input id="fa-biz" type="text" maxlength="28" value="${esc(FA.biz || "")}" placeholder="Long Beach Phone Buyers"></div></div>`
    + WORD_FIELDS.map(field).join("")
    + `<div class="ez-field"><label>Colours <span class="fa-opt">${COLOURWAYS.length} pairs, light, vivid and dark</span></label><div class="ez-themes" id="fa-pairs" role="group" aria-label="Colours">
        <button type="button" class="fa-any${FA.pair ? "" : " active"}" data-pair="" aria-pressed="${FA.pair ? "false" : "true"}" title="New look picks a pair that suits what you buy">Any</button>`
        + COLOURWAYS.map(k => { const c = COLOUR_OF[k], on = FA.pair === k; return `<button type="button" class="ez-theme${on ? " active" : ""}" data-pair="${k}" aria-pressed="${on}" title="${esc(c.name)}" aria-label="${esc(c.name)}"><span style="background:${c.colors.ground}"></span><span style="background:${c.colors.accent}"></span></button>`; }).join("")
    + `</div></div>`
    + `<div class="ez-field"><label>Typeface <span class="fa-opt">a headline face and a reading face</span></label><div class="ez-fxrow fa-voices" id="fa-voices" role="group" aria-label="Typeface">
        <button type="button" data-voice="" class="${fullVoiceOk(FA.voice) || FA.voice === "house" ? "" : "active"}" title="New look picks a face from these">Any</button>
        <button type="button" data-voice="house" class="${FA.voice === "house" ? "active" : ""}" title="Chivo, the house face">House</button>`
        + voices.map(k => `<button type="button" data-voice="${k}" class="${FA.voice === k ? "active" : ""}" title="${esc(FONTS[TYPE_VOICES[k].display][0] + " + " + FONTS[TYPE_VOICES[k].label][0])}">${esc(TYPE_VOICES[k].name)}</button>`).join("")
    + `</div></div>`
    + `<div class="ez-field fa-actions"><div class="ez-fxrow"><button type="button" id="fa-shuffle" title="Another arrangement, and another colour pair unless you picked one">&#127922; New look</button>`
    + (S.key !== "iphone" && S.sets.length > 1 ? `<button type="button" id="fa-picture" title="Another picture of ${esc(S.label)}">Another picture</button>` : "")
    + `</div></div><div id="fa-say" class="fa-say" role="status" hidden></div>`;

  const words = () => (FA.words[S.key] = FA.words[S.key] || {});
  f.querySelectorAll("input[data-word]").forEach(i => i.addEventListener("input", () => { words()[i.dataset.word] = i.value; keep(); later(); }));
  el("fa-biz").addEventListener("input", e => { FA.biz = e.target.value; keep(); later(); });
  const sel = el("fa-line"); if (sel) sel.addEventListener("change", () => { FA.line[currentCat] = sel.value; delete FA.recipe[currentCat]; keep(); buildForm(); tile(); later(0); });
  const rs = el("fa-recipe"); if (rs) rs.addEventListener("change", () => {
    const r = live.byId[rs.value]; FA.recipe[currentCat] = r ? r.id : "";
    // the design's own words, colours and face: what was typed for the line before gives way to them
    if (r) { FA.line[currentCat] = r.subject; FA.words[r.subject] = {}; FA.pair = ""; FA.voice = ""; FA.seed = r.seed || 1; }
    keep(); live.thumbs = {}; buildForm(); tile(); later(0);
  });
  const nh = el("fa-next-head"); if (nh) nh.onclick = () => { const cur = (words().headline || S.heads[0]).toUpperCase(), i = S.heads.findIndex(h => h.toUpperCase() === cur); const next = S.heads[(i + 1) % S.heads.length].toUpperCase(); words().headline = next; el("fa-headline").value = next; keep(); later(0); };
  el("fa-pairs").addEventListener("click", e => { const b = e.target.closest("button[data-pair]"); if (!b) return; FA.pair = b.dataset.pair; keep();
    el("fa-pairs").querySelectorAll("button[data-pair]").forEach(x => { const on = x === b; x.classList.toggle("active", on); x.setAttribute("aria-pressed", on); }); tile(); later(0); });
  el("fa-voices").addEventListener("click", e => { const b = e.target.closest("button[data-voice]"); if (!b) return; FA.voice = b.dataset.voice; keep();
    el("fa-voices").querySelectorAll("button[data-voice]").forEach(x => x.classList.toggle("active", x === b)); tile(); later(0); });
  el("fa-shuffle").onclick = () => { FA.seed = ((FA.seed | 0) || 1) + 1; keep(); tile(); later(0); };
  const pic = el("fa-picture"); if (pic) pic.onclick = () => { FA.set[S.key] = ((FA.set[S.key] | 0) + 1) % S.sets.length; keep(); live.thumbs = {}; tile(); later(0); };
}

/* ---------- on and off ---------- */

function enter() {
  if (!lineNow()) return false;
  FA.on = true; keep();
  const page = el("page-easy"); if (page) page.classList.add("fa-on");
  if (!el("fa-preview")) { const im = document.createElement("img"); im.id = "fa-preview"; im.alt = "Live preview of your ad"; const p = el("ez-preview"); if (p) p.insertAdjacentElement("afterend", im); }
  buildForm(); mark();
  const v = el("ez-video"); if (v && !v.dataset.faWas) { v.dataset.faWas = v.innerHTML; v.innerHTML = "&#127916;&nbsp; Make the video of this ad"; }
  const hint = el("ez-dl-hint"); if (hint) hint.dataset.faOn = "1";
  draw();
  return true;
}
function leave() {
  if (!FA.on) return;
  FA.on = false; keep(); live.n++;
  const page = el("page-easy"); if (page) page.classList.remove("fa-on");
  const v = el("ez-video"); if (v && v.dataset.faWas) { v.innerHTML = v.dataset.faWas; delete v.dataset.faWas; }
  mark();
}

/* ---------- download, and the video ---------- */

function ask(fixes) {
  if (typeof pgGateAsk !== "function") return Promise.resolve(true);
  return pgGateAsk({ fails: fixes.map(s => ({ code: "full", say: s })) });
}
async function download() {
  const phone = el("ez-phone").value.trim();
  if (!phone) { toast("Type your phone number first, buyers need to reach you", "error"); el("ez-phone").focus(); el("ez-phone").scrollIntoView({ behavior: "smooth", block: "center" }); return; }
  const gate = await gateExport(ezExportPx()); if (!gate) return;
  let made; try { made = await build(gate.px); } catch (e) { toast("The full ad could not load just now. Try again in a moment.", "error"); return; }
  const { ad, st } = made, frame = fullStill(ad);
  /* the full ad's own gate: the delivered picture, measured (rule 138) */
  let pre = null; try { pre = fullPreflight(ad, frame); } catch (e) { console.warn("full ad pre-flight:", e); }
  if (pre && !pre.ok && !await ask(pre.findings.filter(f => f.level === "fix").map(f => f.say))) return;
  let url = frame.toDataURL("image/png");
  if (gate.watermark) url = await applyWatermark(url, ad.W, ad.H);
  try { await recordExport(); } catch (e) { toast("Export could not be recorded: " + e.message, "error"); return; }
  const a = document.createElement("a");
  a.href = url;
  a.download = String(st.headline || "full ad").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-full-ad-" + (ez.format && ez.format !== "square" ? ez.format + "-" : "") + gate.px + ".png";
  document.body.appendChild(a); a.click(); a.remove();
  try { await addHistory(a.download, gate.px, url, ad.W, ad.H, null); } catch (e) { /* the file is saved */ }
  toast("Downloaded, go post it!", "success");
}
/** The video of a full ad is the video maker's: the same class draws it moving. What the visitor
 *  set here goes with them (the maker reads it once, motion/app.js restore). */
function toVideo() {
  const S = lineNow(); if (!S) return;
  const R = recipeNow(), rw = (R && R.words) || {};
  const w = FA.words[S.key] || {}, up = v => String(v || "").trim().toUpperCase(), F = FORMATS[ez.format] || FORMATS.square, ar = F.w / F.h;
  const hand = { subject: S.key, subject_set: S.sets.length ? (FA.set[S.key] | 0) % S.sets.length : 0, seed: FA.seed | 0 || 1, full_palette: FA.pair || "", full_type: FA.voice === "house" ? "house" : fullVoiceOk(FA.voice) ? FA.voice : "",
    recipe: R ? R.id : "",
    headline: up(w.headline) || up(rw.headline) || S.heads[0].toUpperCase(), tag: up(w.tag) || up(rw.tag) || (S.key === "iphone" ? "" : S.models.toUpperCase()), points: up(w.points) || up(rw.points) || (S.key === "iphone" ? null : S.points),
    feed_claim: up(w.claim) || (String(FA.biz || "").trim() ? "" : up(rw.claim)), feed_burst: up(w.burst) || up(rw.burst), number_label: up(w.label) || up(rw.label), biz: String(FA.biz || "").trim(),
    number: el("ez-phone").value.trim(), site: el("ez-website").value.trim(), feed_where: whereNow(),
    aspect: ar >= 1.3 ? "16:9" : ar <= .62 ? "9:16" : Math.abs(ar - 1) < .02 ? "1:1" : "4:5", at: Date.now() };
  try { localStorage.setItem(HANDOFF, JSON.stringify(hand)); } catch (e) { /* the maker opens on its own look */ }
  location.href = at("./motion/") + "?full=1&from=studio";
}

/* ---------- the studio's own functions, wrapped ---------- */

function install() {
  const hide = id => { const n = el(id) && el(id).closest(".ez-field"); if (n) n.classList.add("fa-hide"); };
  ["ez-chips", "ez-themes", "ez-swatches"].forEach(hide);
  ["ez-edit-phone", "ez-edit-website"].forEach(id => { const n = el(id); if (n) n.classList.add("fa-hide"); });

  const _strip = buildEzStrip;
  buildEzStrip = function () { const r = _strip.apply(this, arguments); try { tile(); } catch (e) { console.warn("full ad card:", e); } return r; };

  const _select = selectEzTpl;
  selectEzTpl = function (id) {
    if (id === "full") { if (!enter()) return _select.call(this, firstFreeTplId()); return; }
    if (FA.on && !live.holding) leave();
    const r = _select.apply(this, arguments);
    mark();
    return r;
  };

  /* Easy Mode opened with no design asked for: a visitor who has never picked one starts on the
     full ad, and one who left on it comes back to it. A design asked for by name (a card on the
     landing, a library card, a saved project) is opened as asked. */
  const _show = showEasy;
  showEasy = function (tplId) {
    let fresh = false; try { fresh = !tplId && !saved && !DEFAULT_OFF && localStorage.getItem("pgfx_last") == null && !live.shown; } catch (e) { /* asked for nothing */ }
    const stay = !tplId && (FA.on || fresh) && !!live.subjects.length;
    live.holding = stay; live.shown = true;
    let r; try { r = _show.apply(this, arguments); } finally { live.holding = false; }
    if (stay) { if (!enter()) leave(); } else if (tplId && FA.on) leave();
    return r;
  };

  const _cat = setCategory;
  setCategory = function () {
    const stay = FA.on; live.holding = stay;
    let r; try { r = _cat.apply(this, arguments); } finally { live.holding = false; }
    if (stay) { if (!enter()) { leave(); try { schedEzPreview(0); } catch (e) { /* drawn on the next change */ } } }
    return r;
  };

  const _sched = schedEzPreview;
  schedEzPreview = function (delay) { if (FA.on) { later(delay === 0 ? 0 : 200); return; } return _sched.apply(this, arguments); };

  const _download = ezDownload;
  ezDownload = function () { return FA.on ? download() : _download.apply(this, arguments); };

  const _video = ezDownloadVideo;
  ezDownloadVideo = function () { if (FA.on) { toVideo(); return Promise.resolve(); } return _video.apply(this, arguments); };

  const _explain = pgExplain;
  pgExplain = function (f) { return f && f.code === "full" ? f.say : _explain.apply(this, arguments); };

  /* for the checks (scripts/full_ad_studio_check.mjs): the ad as it would be downloaded at a size,
     read by its own pre-flight */
  const check = async (px, size) => { const { ad, st } = await build(px || 1080, size); const frame = fullStill(ad), pre = fullPreflight(ad, frame);
    return { ok: pre.ok, fixes: pre.findings.filter(f => f.level === "fix").map(f => f.say), notes: pre.findings.filter(f => f.level === "note").map(f => f.say), W: ad.W, H: ad.H,
      colour: st.full_colour, type: st.full_pair ? st.type_pair : "", headline: st.headline, subject: st.subject || "iphone", pictures: ad.phones.length }; };
  const useRecipe = async id => {
    await loadRecipes(); const r = live.byId[id]; if (!r) return null;
    if (currentCat !== r.cat) setCategory(r.cat);
    FA.recipe[r.cat] = r.id; FA.line[r.cat] = r.subject; FA.words[r.subject] = {}; FA.pair = ""; FA.voice = ""; FA.set = {};
    FA.seed = r.seed || 1;   // its own look: a recipe opens on its own seed (New look moves on from it)
    return r;
  };
  window.FullAdStudio = { state: FA, enter, leave, draw, build, check, lines: () => live.subjects, aliases: () => live.aliases || {}, isOn: () => FA.on, voices: () => FULL_VOICES.filter(k => fullVoiceOk(k)), pairs: () => COLOURWAYS.slice(),
    recipes: loadRecipes, useRecipe };
  /* Easy Mode may be open already (a module runs after the page's own scripts) */
  if (el("ez-strip") && el("page-easy") && el("page-easy").classList.contains("active")) {
    tile();
    if (FA.on) { if (!enter()) leave(); }
  }
  window.dispatchEvent(new Event("full-ad-ready"));
}

fetch(at("./motion/subjects.json")).then(r => r.json()).then(j => { live.subjects = j.subjects || []; live.aliases = j.aliases || {}; install(); })
  .catch(e => console.warn("full ad in Easy Mode: not loaded", e));
