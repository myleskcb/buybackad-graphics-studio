// Phone video ad maker: the page. Engine in engine.js, sound in audio.js, export in export.js.

import { OPTIONS, LABELS, GROUPS, HEADLINES, COPY, FONTS, PALETTES, DEFAULT_STYLE, CLASSIC, VIBES, countLooks } from "./catalog.js";
import { Ad, ASPECTS, randomize, harmonise, loadPhones, loadFonts, fontsFor, phoneFromFile, pal, applyVibe, applyCopy, areaOf } from "./engine.js";
import { renderSoundtrack } from "./audio.js";
import { exportMp4, recordRealtime, canEncode, recorderMime } from "./export.js";
import { auditLook, drawCurve } from "./audit.js";

const $ = id => document.getElementById(id);
const STORE = "pgfx_motion_v1";
// video-help.js (loaded just before this module) holds the pop-up, the retries
// and the safety net. If it did not load, everything still runs, saying less.
const VH = () => window.VideoHelp || { retry: async fn => fn(0), waitVisible: async () => {}, isMemory: () => false, toast: m => console.warn(m),
  show: () => {}, check: async () => null, share: null, save: null, canShareFiles: () => false, safetyNet: () => {}, inApp: false };
VH().safetyNet();
const PREVIEW_MAX = 720;
const DEFAULT_PHONES = ["18-pro-max-burgundy", "17-pro-cosmic-orange", "18-pro-glacier", "16-ultramarine"];

const state = {
  style: { ...DEFAULT_STYLE, ...CLASSIC, phones: DEFAULT_PHONES.slice() },
  locked: new Set(["phones", "headline", "tag", "number", "number_label", "aspect", "duration"]),
  history: [],
  assets: { phones: {} },
  index: [],
  ad: null, playing: true, t0: performance.now(), tPaused: 0, sound: false, audio: null, audioCtx: null, audioSrc: null,
  buildId: 0, gallerySeed: 1000,
};

const BOARD_NAMES = { none: "No sign", freeway: "Green freeway sign", freeway_blue: "Blue freeway sign", poster: "Swap meet poster",
  bandit_yellow: "Yellow street sign", bandit_white: "White street sign", flyer: "Tear-off flyer", neon_box: "Neon box",
  marquee: "Theatre marquee", store_sign: "Corner store sign" };
const URGENCY_NAMES = { none: "None", pulse_cta: "Pulsing TEXT NOW badge", caution_tape: "Caution tape", ticker: "Scrolling ticker",
  stamp: "CASH stamp", arrows: "Arrows at the number", flash_border: "Border flashing on the beat", beat_pump: "Pump on the beat" };
const VIBE_AXES = ["palette", "background", "font", "text_fx", "number_style", "board", "decor", "skew"];
const WORD_KEYS = ["headline", "tag", "number_label", "hook_text"];

const labelFor = (k, v) => {
  if (k === "vibe") return v === "none" ? "None: any look" : VIBES[v].label;
  if (k === "board") return BOARD_NAMES[v] || v;
  if (k === "urgency") return URGENCY_NAMES[v] || v;
  if (k === "font" || k === "number_font") return v === "same" ? "Same as headline" : (FONTS[v] ? FONTS[v][0] : v);
  if (k === "palette") return v === "match" ? "Match a phone's colour" : v.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  if (k === "tracking") return v < 0 ? "Tight" : v === 0 ? "Normal" : v <= .02 ? "Open" : v <= .05 ? "Wide" : "Extra wide";
  if (k === "skew") return v === 0 ? "Upright" : v < 0 ? `Back slant ${-v}°` : `Slant ${v}°`;
  if (k === "shake") return ["None", "Some", "Lots"][v] || v;
  if (k === "glare") return v === .5 ? "Soft" : v === 1 ? "Normal" : "Bright";
  if (k === "front_glimpse") return v === "spin" ? "Flash past in the air" : "Land screen up, then flip";
  if (k === "end_face") return { back: "Their backs", front: "Their screens", mixed: "Half and half" }[v];
  return String(v).replace(/[_-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
};

// ------------------------------------------------------------ persistence

function save() {
  try { localStorage.setItem(STORE, JSON.stringify({ style: state.style, locked: [...state.locked] })); } catch (e) { /* private mode */ }
}
function restore() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE) || "null");
    if (s && s.style && typeof s.style === "object") { state.style = { ...state.style, ...s.style }; state.locked = new Set(Array.isArray(s.locked) ? s.locked : [...state.locked]); }
  } catch (e) { /* fresh start */ }
  // a saved look from an older version must not stop the page from starting
  if (!Array.isArray(state.style.phones)) state.style.phones = DEFAULT_PHONES.slice();
  try {                                              // the studio's brand kit
    const b = JSON.parse(localStorage.getItem("pgfx_brand") || "null");
    if (b && b.phone && !state.style.number) state.style.number = b.phone;
    const home = b && b.area && (b.area.home || b.area.city);
    if (home && !state.style.area) state.style.area = String(home);
  } catch (e) { /* none */ }
  const q = new URLSearchParams(location.search);
  if (q.get("look")) state.style.seed = parseInt(q.get("look"), 10) || state.style.seed;
}

// ------------------------------------------------------------ building the ad

async function rebuild() {
  const id = ++state.buildId;
  try {
    const st = harmonise({ ...state.style }, state.locked, indexById());
    await loadFonts(fontsFor(st));
    if (id !== state.buildId) return;
    const [W, H] = ASPECTS[st.aspect] || ASPECTS["1:1"];
    const k = Math.min(1, PREVIEW_MAX / Math.max(W, H));
    const ad = new Ad(st, state.assets, Math.round(W * k), Math.round(H * k));
    if (id !== state.buildId) return;
    state.ad = ad;
    const c = $("preview"); c.width = ad.W; c.height = ad.H;
    state.t0 = performance.now(); state.tPaused = 0;
    state.audio = null;
    if (state.sound) startAudio(0);
    syncPanel(st);
    $("loading").hidden = true;
    scheduleAudit(st);
    state.lastGood = JSON.parse(JSON.stringify(state.style));
  } catch (e) {
    if (id !== state.buildId) return;
    console.error("This look could not be drawn:", e);
    recoverLook();
  }
}

/* A look that cannot be drawn (a setting from an older version, a bad upload)
   must not leave a dead preview: go back to the last look that worked, then to
   the plain look, keeping the number. Only if even that fails, say so. */
function recoverLook() {
  // counted over a window, not reset by a rebuild that succeeds: a look that
  // builds and then fails every frame must not bounce back and forth forever
  const now = Date.now();
  state.recoveries = (state.recoveries || []).filter(t => now - t < 20000).concat(now);
  const n = state.recoveries.length;
  $("loading").hidden = true;
  if (n > 2) {
    if (state.recoverHalted) return;
    state.recoverHalted = true;                     // until a frame draws again
    VH().show({ title: "The preview could not be drawn", message: "Even the plain look would not draw. Reloading the page usually clears it. If it does not, start from a fresh look (this clears the saved settings on this page).",
      actions: [{ label: "Reload the page", primary: true, run: () => location.reload() },
        { label: "Start from a fresh look", run: () => { try { localStorage.removeItem(STORE); } catch (e) { /* private mode */ } location.reload(); } }] });
    return;
  }
  const last = n === 1 && state.lastGood && JSON.stringify(state.lastGood) !== JSON.stringify(state.style) ? state.lastGood : null;
  const plain = { ...DEFAULT_STYLE, ...CLASSIC, phones: DEFAULT_PHONES.filter(id => state.assets.phones[id]) };
  pushHistory();                                   // Back still reaches the look that failed
  state.style = { ...(last || plain), number: state.style.number };
  save(); syncWords(); drawPhonePicker();
  VH().toast(last ? "That look could not be drawn, so the last one that worked is back." : "That look could not be drawn, so a plain look is back. Your number is kept.");
  rebuild();
}

// ------------------------------------------------------------ attention

let auditTimer = null, auditId = 0;
function scheduleAudit(st) {
  clearTimeout(auditTimer);
  $("attn-score").textContent = "measuring…"; $("attn-score").className = "mo-score";
  auditTimer = setTimeout(async () => {
    const id = ++auditId;
    try {
      const rep = await auditLook(st, state.assets, { size: 200, secs: 4, sound: true });
      if (id !== auditId) return;
      showAudit(rep);
    } catch (e) { console.warn("audit", e); }
  }, 350);
}

function showAudit(rep) {
  const s = $("attn-score");
  s.textContent = `${rep.score} / 100`; s.className = "mo-score " + (rep.score >= 90 ? "good" : rep.score >= 75 ? "ok" : "bad");
  drawCurve($("attn-curve"), rep);
  $("attn-list").innerHTML = rep.checks.map(c => `<li><i>${c.ok ? "✅" : "⚠️"}</i><span>${c.label}: <b>${c.value}</b></span></li>`).join("");
}

/** A look is strong when it scores 90+ and passes what decides a scroll. */
async function strongSeed(base, locked, pool, content) {
  let best = null;
  for (let k = 0; k < 8; k++) {
    const seed = (Math.random() * 1e9) | 0;
    const st = randomize(base, seed, locked, pool, content);
    const h = harmonise({ ...st }, locked, indexById());
    await loadFonts(fontsFor(h));
    const rep = await auditLook(h, state.assets, { size: 120, secs: 3.4, sound: false });
    const ok = id => rep.checks.find(c => c.id === id)?.ok;
    if (!best || rep.score > best.score) best = { st, score: rep.score };
    if (rep.score >= 90 && ok("frame0") && ok("words") && ok("number") && ok("contrast")) return st;
  }
  return best.st;
}

function indexById() { const o = {}; state.index.forEach(m => { o[m.id] = m; }); Object.values(state.assets.phones).forEach(a => { o[a.meta.id] = a.meta; }); return o; }

function curT() {
  const d = state.ad ? state.ad.st.duration : 6;
  if (!state.playing) return state.tPaused;
  return ((performance.now() - state.t0) / 1000) % (d + .8);
}

function loop() {
  const ad = state.ad;
  // one frame that throws must not stop the preview for good: keep ticking, and
  // after half a second of nothing but failures treat the look as broken
  try {
    if (ad) {
      const t = curT(), d = ad.st.duration;
      const ctx = $("preview").getContext("2d");
      ad.frame(ctx, Math.min(t, d - .001), { subsFly: 3, subsMove: 2 });
      if (state.playing) $("scrub").value = String(Math.round(Math.min(t, d) / d * 1000));
      if (state.playing && state.sound && t < .05 && !state._restarted) { startAudio(0); state._restarted = true; }
      if (t > .1) state._restarted = false;
    }
    state.frameFails = 0; state.recoverHalted = false;
  } catch (e) {
    state.frameFails = (state.frameFails || 0) + 1;
    if (state.frameFails === 1) console.warn("A preview frame could not be drawn:", e);
    if (state.frameFails >= 30) { state.frameFails = 0; recoverLook(); }
  }
  requestAnimationFrame(loop);
}

async function startAudio(from) {
  try {
    if (!state.audioCtx) state.audioCtx = new AudioContext();
    if (state.audioSrc) { try { state.audioSrc.stop(); } catch (e) { /* done */ } }
    if (!state.audio || state.audio.ad !== state.ad) state.audio = { ad: state.ad, buf: await renderSoundtrack(state.ad) };
    const src = state.audioCtx.createBufferSource(); src.buffer = state.audio.buf; src.connect(state.audioCtx.destination);
    src.start(0, Math.max(0, from)); state.audioSrc = src;
  } catch (e) { console.warn("sound", e); }
}
function stopAudio() { if (state.audioSrc) { try { state.audioSrc.stop(); } catch (e) { /* done */ } state.audioSrc = null; } }

// ------------------------------------------------------------ the panel

function buildPanel() {
  $("look-count").textContent = `${Number(countLooks()).toExponential(1).replace("e+", " × 10^")} possible looks from ${Object.keys(FONTS).length} typefaces and ${Object.keys(PALETTES).length} palettes.`;
  $("headline-list").innerHTML = [...HEADLINES, ...COPY.es.headlines.filter(h => !h.includes("{"))].map(h => `<option value="${h}">`).join("");
  const design = $("design");
  for (const [title, keys] of GROUPS) {
    const sec = document.createElement("details"); sec.className = "mo-sec"; sec.open = ["Type", "Scene", "LA vibe and urgency"].includes(title);
    sec.innerHTML = `<summary>${title}</summary>`;
    for (const k of keys) {
      const row = document.createElement("div"); row.className = "mo-set";
      const opts = [...new Set(OPTIONS[k])];
      row.innerHTML = `<label>${LABELS[k] || k}<select data-key="${k}">${opts.map(v => `<option value="${v}">${labelFor(k, v)}</option>`).join("")}</select></label>
        <button class="mo-lock" data-lock="${k}" aria-pressed="false" title="Lock: keep this when shuffling">&#128275;</button>`;
      sec.appendChild(row);
      if (k === "palette") { const sw = document.createElement("div"); sw.className = "mo-swatches"; sw.id = "swatches"; sec.appendChild(sw); }
    }
    design.appendChild(sec);
  }
  design.addEventListener("change", e => {
    const k = e.target.dataset.key; if (!k) return;
    const raw = e.target.value, sample = OPTIONS[k][0];
    pushHistory();
    state.style[k] = typeof sample === "number" ? Number(raw) : raw;
    state.locked.add(k);                            // what you choose by hand stays put
    if (k === "vibe") {                             // a vibe is a whole look: show it at once
      VIBE_AXES.forEach(a => state.locked.delete(a));
      state.style = applyVibe(state.style, (Math.random() * 1e9) | 0, state.locked);
    }
    save(); rebuild();
  });
  design.addEventListener("click", e => {
    const b = e.target.closest("[data-lock]"); if (!b) return;
    const k = b.dataset.lock; state.locked.has(k) ? state.locked.delete(k) : state.locked.add(k);
    save(); syncLocks();
  });
  const flags = [["flash", "Flash on the hit"], ["shine", "Light sweep on the type"], ["rgb_hit", "Colour split on the hit"],
    ["speed_lines", "Speed lines"], ["sparkles", "Sparkles by the number"], ["grain", "Film grain"]];
  $("flags").innerHTML = flags.map(([k, l]) => `<label class="mo-check"><input type="checkbox" data-flag="${k}"> ${l}</label>`).join("");
  $("flags").addEventListener("change", e => { const k = e.target.dataset.flag; pushHistory(); state.style[k] = e.target.checked; state.locked.add(k); save(); rebuild(); });

  // words
  const bind = (id, key, fmt = v => v) => $(id).addEventListener("input", debounce(e => { state.style[key] = fmt(e.target.value); state.locked.add(key); save(); rebuild(); }, 280));
  bind("f-headline", "headline", v => v.toUpperCase().slice(0, 60) || "WE BUY PHONES");
  bind("f-tag", "tag"); bind("f-label", "number_label");
  bind("f-hook", "hook_text", v => v.toUpperCase().slice(0, 44));
  // another line in the look's own language, everything else left as it is
  const anotherLine = key => {
    pushHistory();
    const keep = state.style.lang_mode, lk = new Set([...state.locked, ...WORD_KEYS, "cta", "urgent", "stamp_text", "burst_text", "ticker_items"]);
    lk.delete(key);
    state.style = { ...applyCopy({ ...state.style, lang_mode: state.style.lang || "en" }, (Math.random() * 1e9) | 0, lk, true), lang_mode: keep };
    state.locked.add(key); save(); syncWords(); rebuild();
  };
  $("new-hook").addEventListener("click", () => anotherLine("hook_text"));
  $("f-number").addEventListener("input", debounce(e => { state.style.number = e.target.value; save(); rebuild(); renderGallery(true); }, 500));
  $("langs").addEventListener("click", e => {
    const b = e.target.closest("[data-lang]"); if (!b) return;
    pushHistory();
    state.style.lang_mode = b.dataset.lang;
    const lk = new Set(state.locked); WORD_KEYS.forEach(k => lk.delete(k));   // a new language means new words
    state.style = applyCopy(state.style, (Math.random() * 1e9) | 0, lk, true);
    save(); syncWords(); rebuild();
  });
  $("f-area").addEventListener("input", debounce(e => {
    const before = areaOf(state.style);
    state.style.area = e.target.value.slice(0, 30);
    const after = areaOf(state.style);
    if (before && after && before !== after) {             // the city already written into the words follows the field
      const re = new RegExp(`\\b${before.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
      ["headline", "tag", "number_label", "hook_text", "cta", "urgent", "stamp_text", "burst_text"].forEach(k => { if (typeof state.style[k] === "string") state.style[k] = state.style[k].replace(re, after); });
      if (Array.isArray(state.style.ticker_items)) state.style.ticker_items = state.style.ticker_items.map(s => s.replace(re, after));
    }
    save(); syncWords(); rebuild();
  }, 400));
  $("new-headline").addEventListener("click", () => anotherLine("headline"));

  // format
  $("aspects").addEventListener("click", e => { const b = e.target.closest("[data-aspect]"); if (!b) return; state.style.aspect = b.dataset.aspect; save(); rebuild(); renderGallery(true); });
  $("lengths").addEventListener("click", e => { const b = e.target.closest("[data-len]"); if (!b) return; state.style.duration = Number(b.dataset.len); save(); rebuild(); });

  // phones
  $("phones").addEventListener("click", e => {
    const b = e.target.closest("[data-phone]"); if (!b) return;
    const id = b.dataset.phone, list = state.style.phones;
    const i = list.indexOf(id);
    if (i >= 0) { if (list.length > 1) list.splice(i, 1); } else { if (list.length >= 6) list.shift(); list.push(id); }
    save(); drawPhonePicker(); rebuild();
  });
  $("upload").addEventListener("change", async e => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    try {
      const a = await phoneFromFile(f);
      state.assets.phones[a.id] = a; state.index.push(a.meta);
      state.style.phones.push(a.id); if (state.style.phones.length > 6) state.style.phones.shift();
      drawPhonePicker(); rebuild();
    } catch (err) { console.warn(err); VH().toast("That picture could not be read. Try a PNG or JPG of the phone's back, on a plain background."); }
    e.target.value = "";
  });

  // actions
  $("shuffle-look").addEventListener("click", () => shuffle(false));
  $("shuffle-all").addEventListener("click", () => shuffle(true));
  $("undo").addEventListener("click", () => { const prev = state.history.pop(); if (prev) { state.style = prev; save(); syncWords(); drawPhonePicker(); rebuild(); } $("undo").disabled = !state.history.length; });
  $("more").addEventListener("click", () => renderGallery(false));
  $("play").addEventListener("click", togglePlay);
  $("scrub").addEventListener("input", e => {
    const d = state.ad ? state.ad.st.duration : 6;
    state.playing = false; state.tPaused = Number(e.target.value) / 1000 * d; state.ad && (state.ad.still = null);
    stopAudio(); $("play").innerHTML = "&#9654;"; $("play").setAttribute("aria-label", "Play");
  });
  $("sound").addEventListener("click", () => {
    state.sound = !state.sound; $("sound").setAttribute("aria-pressed", String(state.sound)); $("sound").innerHTML = state.sound ? "&#128266;" : "&#128263;";
    if (state.sound && state.playing) startAudio(curT()); else stopAudio();
  });
  $("download").addEventListener("click", () => download());
  document.addEventListener("keydown", e => { if (e.target.matches("input,select,textarea")) return; if (e.key === " ") { e.preventDefault(); togglePlay(); } if (e.key === "n") shuffle(false); });
}

function togglePlay() {
  const d = state.ad ? state.ad.st.duration : 6;
  if (state.playing) { state.tPaused = curT(); state.playing = false; stopAudio(); $("play").innerHTML = "&#9654;"; $("play").setAttribute("aria-label", "Play"); }
  else {
    const from = state.tPaused >= d ? 0 : state.tPaused; state.t0 = performance.now() - from * 1000; state.playing = true;
    if (state.ad && from < (state.ad.tl ? state.ad.tl.still : 0)) state.ad.still = null;
    if (state.sound) startAudio(from);
    $("play").innerHTML = "&#10074;&#10074;"; $("play").setAttribute("aria-label", "Pause");
  }
}

function pushHistory() { state.history.push(JSON.parse(JSON.stringify(state.style))); if (state.history.length > 30) state.history.shift(); $("undo").disabled = false; }

async function shuffle(all) {
  pushHistory();
  const locked = new Set(state.locked);
  if (all) ["headline", "tag", "number_label", "hook_text"].forEach(k => locked.delete(k));
  const pool = all && $("shuffle-phones").checked ? state.index.map(m => m.id) : [];
  if (pool.length) locked.delete("phones"); else locked.add("phones");
  const btns = [$("shuffle-look"), $("shuffle-all")]; btns.forEach(b => b.disabled = true);
  try {
    try {
      state.style = $("strong-only").checked ? await strongSeed(state.style, locked, pool, all)
        : randomize(state.style, (Math.random() * 1e9) | 0, locked, pool, all);
    } catch (e) {                                   // the attention check failed: shuffle without it
      console.warn("Strong-look search failed, shuffling without it:", e);
      state.style = randomize(state.style, (Math.random() * 1e9) | 0, locked, pool, all);
    }
  } finally { btns.forEach(b => b.disabled = false); }
  state.style.number = state.style.number;              // the number is never shuffled
  save(); syncWords(); drawPhonePicker(); rebuild();
}

function syncWords() {
  $("f-headline").value = state.style.headline || "";
  $("f-tag").value = state.style.tag || "";
  $("f-number").value = state.style.number || "";
  $("f-label").value = state.style.number_label || "";
  $("f-hook").value = state.style.hook_text || "";
  if (document.activeElement !== $("f-area")) $("f-area").value = state.style.area || "";
  document.querySelectorAll("#langs [data-lang]").forEach(b => b.setAttribute("aria-checked", String(b.dataset.lang === (state.style.lang_mode || "mix"))));
}

function syncPanel(st) {
  document.querySelectorAll("#design select").forEach(s => { const k = s.dataset.key; s.value = String(st[k]); });
  document.querySelectorAll("[data-flag]").forEach(c => { c.checked = !!st[c.dataset.flag]; });
  document.querySelectorAll("#aspects [data-aspect]").forEach(b => b.setAttribute("aria-checked", String(b.dataset.aspect === st.aspect)));
  document.querySelectorAll("#lengths [data-len]").forEach(b => b.setAttribute("aria-checked", String(Number(b.dataset.len) === st.duration)));
  const p = pal(st);
  $("swatches").innerHTML = ["ground", "light", "ink", "accent", "plate"].map(k => `<i style="background:${p[k]}" title="${k}"></i>`).join("");
  $("seed").textContent = st.seed;
  syncLocks();
}

function syncLocks() {
  document.querySelectorAll("[data-lock]").forEach(b => {
    const on = state.locked.has(b.dataset.lock); b.setAttribute("aria-pressed", String(on)); b.innerHTML = on ? "&#128274;" : "&#128275;";
  });
}

function drawPhonePicker() {
  const sel = state.style.phones;
  $("phones").innerHTML = state.index.map(m => `<button class="mo-phone" data-phone="${m.id}" aria-pressed="${sel.includes(m.id)}" title="${m.model} ${m.finish}${m.repaint ? " (painted)" : ""}">
    <img src="${m.upload ? state.assets.phones[m.id].img.src : "phones/" + m.id + ".webp"}" alt="${m.model} ${m.finish}" loading="lazy"><small>${m.model.replace("iPhone ", "")} ${m.finish}</small></button>`).join("");
  $("phone-count").textContent = `${sel.length} picked`;
}

// ------------------------------------------------------------ more looks

async function renderGallery(reset) {
  const g = $("gallery");
  // a reset starts a new gallery; one still drawing from before stops rather than
  // adding thumbnails of the old size or the old number to the new one
  if (reset) { g.innerHTML = ""; state.galleryGen = (state.galleryGen || 0) + 1; }
  const gen = state.galleryGen || 0;
  const [W, H] = ASPECTS[state.style.aspect] || ASPECTS["1:1"];
  const k = 300 / Math.max(W, H);
  for (let i = 0, made = 0; made < 8 && i < 16; i++) {     // a look that will not draw is skipped for the next
    if (gen !== (state.galleryGen || 0)) return;
    const seed = state.gallerySeed++;
    let st, ad, c;
    try {
      st = harmonise(randomize(state.style, seed, state.locked, [], false), state.locked, indexById());
      await loadFonts(fontsFor(st));
      if (gen !== (state.galleryGen || 0)) return;
      ad = new Ad(st, state.assets, Math.round(W * k), Math.round(H * k));
      c = document.createElement("canvas"); c.width = ad.W; c.height = ad.H;
      ad.stillAt(c.getContext("2d"));
    } catch (e) { console.warn("Gallery look " + seed + " skipped:", e); continue; }
    made++;
    const b = document.createElement("button"); b.className = "mo-thumb"; b.title = "Use this look";
    b.appendChild(c); b.insertAdjacentHTML("beforeend", `<span>${st.vibe && st.vibe !== "none" ? VIBES[st.vibe].label : labelFor("font", st.font)}</span>`);
    b.addEventListener("click", () => { pushHistory(); state.style = { ...st, number: state.style.number, phones: state.style.phones }; save(); syncWords(); rebuild(); window.scrollTo({ top: 0, behavior: "smooth" }); });
    g.appendChild(b);
    await new Promise(r => setTimeout(r, 0));
  }
}

// ------------------------------------------------------------ download

// Plain words for what went wrong, and what the person can do about it.
function exportTrouble(e) {
  const m = String((e && e.message) || e || "");
  if (e && e.code === "no-recorder") return ["This browser cannot make videos", "It has neither a video encoder nor a screen recorder that works on this page."];
  if (e && e.code === "no-h264") return ["This browser cannot write MP4", "It cannot encode H.264 video at this size."];
  if (VH().isMemory(e)) return ["Your device ran out of memory", "Even at a smaller size the video did not fit in this device's memory. Close other tabs or apps, then try again."];
  if (e && e.code === "frames") return ["This look could not be drawn", "Too many frames of this look failed to draw. Try New look, or change the setting you changed last."];
  if (e && (e.name === "EncodingError" || e.name === "NotSupportedError" || /encoder|codec/i.test(m))) return ["The video encoder stopped", "Every way this browser has of making the video failed. Try again, or use another browser."];
  return ["The video could not be made", "Every way this browser has of making the video failed. The details are below."];
}

/* Real time, until it is done: if the tab goes into the background the
   recording would freeze, so it waits for the person to come back and starts
   again instead of failing. */
async function recordUntilDone(ad, audioBuf, prog, note) {
  for (let k = 0; ; k++) {
    if (document.hidden) { note("Paused: come back to this tab and the recording starts again."); await VH().waitVisible(); }
    note("Recording in real time: keep this tab on screen for about " + Math.ceil(ad.st.duration) + " seconds.");
    try { return await recordRealtime(ad, prog, { audioBuf }); }
    catch (e) { if (e.code !== "hidden" || k >= 5) throw e; }
  }
}

/* Every way of making the video, best first. A failure moves on rather than
   stopping: the MP4 encoder again in software, then real time; the sound is
   dropped if it is what fails, and the size comes down if memory runs out.
   Only when every way has failed does the pop-up come up, and it says what
   was tried and what would fix it. */
async function download(opts = {}) {
  const how = opts.how || "auto", withSound = opts.sound !== false;
  const btn = $("download"); if (btn.disabled) return; btn.disabled = true;
  const H = VH();
  $("progress").hidden = false; $("export-note").textContent = "";
  const note = t => { $("export-note").textContent = t; };
  const prog = (p, label) => { $("bar").style.width = Math.round(p * 100) + "%"; $("progress-label").textContent = label; };
  const checkFor = ad => H.check({ w: ad ? ad.W : 1080, h: ad ? ad.H : 1080, fps: 30, sound: withSound, muxer: typeof window.Mp4Muxer !== "undefined" });
  let ad = null;
  const tried = [];
  try {
    const st = harmonise({ ...state.style }, state.locked, indexById());
    await loadFonts(fontsFor(st));
    const [W0, H0] = ASPECTS[st.aspect] || ASPECTS["1:1"];
    let scale = 1;
    const even = v => Math.max(2, Math.round(v / 2) * 2);   // H.264 wants even sides
    const build = () => (scale === 1 ? new Ad(st, state.assets) : new Ad(st, state.assets, even(W0 * scale), even(H0 * scale)));
    ad = build();
    // the sound is made once, up front; if it will not come, the video is made silent
    let buf = null, soundErr = null, soundDropped = null;
    if (withSound) {
      prog(0, "Mixing the sound");
      try { buf = await H.retry(() => renderSoundtrack(ad), { tries: 2 }); }
      catch (e) { soundErr = e; console.error("Soundtrack failed, making the video without sound:", e); }
    }
    const steps = [];
    if (how === "auto" && canEncode()) {
      steps.push({ id: "mp4", label: "the MP4 encoder", run: a => exportMp4(a, prog, { audioBuf: buf }) });
      steps.push({ id: "mp4-sw", label: "the MP4 encoder in software", say: "Trying the MP4 encoder again in software…",
        skip: e => e && e.code === "no-h264", run: a => exportMp4(a, prog, { audioBuf: buf, software: true }) });
    }
    if (recorderMime() !== null) steps.push({ id: "live", label: "real-time recording", run: a => recordUntilDone(a, buf, prog, note) });
    let out = null, last = null, mp4Failed = false;
    for (let i = 0; i < steps.length && !out; i++) {
      const step = steps[i];
      if (step.skip && step.skip(last)) continue;
      if (step.say) note(step.say);
      try { out = await step.run(ad); out.via = step.id; }
      catch (e) {
        last = e; tried.push(step.label + ": " + String(e.message || e)); console.warn(step.label + " failed:", e);
        if (step.id !== "live" && e.code !== "no-h264") mp4Failed = true;
        if (H.isMemory(e) && scale > .5) { scale = scale === 1 ? .67 : .5; ad = build(); note("Low on memory: making it smaller…"); i--; continue; }
        if (buf && (e.code === "audio" || step.id === "live")) { buf = null; soundDropped = e; note("Trying again without the sound…"); i--; continue; }
      }
    }
    if (!out) throw last || Object.assign(new Error("This browser cannot record video."), { code: "no-recorder" });

    const name = `we-buy-phones-${st.aspect.replace(":", "x")}-${st.seed}.${out.ext}`;
    saveVideo(out.blob, name);
    const silent = withSound && !out.audio;
    $("export-note").textContent = `Saved ${name} (${ad.W}×${ad.H}, ${(out.blob.size / 1e6).toFixed(1)} MB${out.audio ? ", with sound" : withSound ? ", no sound" : ", without sound"}). `;
    offerAgain(out.blob, name);
    // saved, but not everything that was asked for: say what happened and how to get the rest
    const catches = [];
    if (out.ext !== "mp4") catches.push("It was saved as WebM, because this browser cannot write MP4. Instagram and TikTok may refuse WebM.");
    if (scale < 1) catches.push(`It was made at ${ad.W}×${ad.H} instead of ${W0}×${H0}, because this device ran low on memory at full size.`);
    if (out.via === "live" && mp4Failed) catches.push("The MP4 encoder failed, so it was recorded in real time instead, which can be less smooth.");
    if (silent) catches.push(soundErr ? "The soundtrack could not be made, so the video has no sound." : soundDropped ? "The sound would not go into the video, so it was saved without it." : "This browser could not add the sound, so the video has no sound.");
    if (H.inApp) catches.push("You are in an app's built-in browser, which often does not keep downloads. If the video does not show up, use Share or open this page in your phone's browser.");
    if (catches.length) {
      const report = await checkFor(ad).catch(() => null);
      const actions = [];
      if (H.canShareFiles()) actions.push({ label: "Share or save to Photos", primary: true, run: () => H.share(out.blob, name) });
      if (silent || scale < 1 || out.via === "live") actions.push({ label: "Try again", run: () => download(opts) });
      H.show({ tone: "info", title: "Video saved, with a catch", message: catches.join(" "), error: tried.join("\n"), report, actions });
    }
  } catch (e) {
    console.error(e);
    const [title, message] = exportTrouble(e);
    note(title + ". " + message);
    const report = await checkFor(ad).catch(() => null);
    if (report && report.none) {
      // nothing to retry: the fix is another browser, which the pop-up offers
      note("This browser cannot make videos. Open this page in Chrome, Edge or Safari 17+.");
      H.show({ title: "This browser cannot make videos", message: "It has no way to encode or record a video on this page. Open this page in " + (/iPhone|iPad/.test(navigator.userAgent) ? "Safari 17 or newer" : "Chrome, Edge or Safari 17+") + " to download it.", report, actions: [] });
    } else {
      const actions = [{ label: "Try again", primary: true, run: () => download(opts) }];
      if (withSound && (!report || report.soundless)) actions.push({ label: "Download without sound", run: () => download({ ...opts, sound: false }) });
      if (e.code === "frames") actions.unshift({ label: "New look", primary: true, run: () => shuffle(false) });
      H.show({ title, message, error: tried.length ? "Tried " + tried.join("\n") : String(e.message || e), report, actions });
    }
  } finally { btn.disabled = false; setTimeout(() => { $("progress").hidden = true; }, 1500); }
}

function saveVideo(blob, name) {
  if (VH().save) return VH().save(blob, name);
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 600000);
}

/* A download can be dropped without a word (an app's built-in browser, a
   blocked pop-up, a phone that saved it somewhere unexpected): keep a way to
   save it again, and on a phone the share sheet, until the next video. */
function offerAgain(blob, name) {
  const n = $("export-note");
  const again = document.createElement("button"); again.className = "mo-link"; again.type = "button"; again.textContent = "Save again";
  again.addEventListener("click", () => saveVideo(blob, name));
  n.appendChild(again);
  if (VH().canShareFiles()) {
    const sh = document.createElement("button"); sh.className = "mo-link"; sh.type = "button"; sh.textContent = "Share or save to Photos";
    sh.addEventListener("click", () => VH().share(blob, name));
    n.appendChild(sh);
  }
}

function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

// ------------------------------------------------------------ start

(async function main() {
  restore();
  try { buildPanel(); }
  catch (e) {
    // a look saved by an older version can break the panel: clear it and start once more
    console.error("The panel could not be built:", e);
    let again = false;
    try { again = !sessionStorage.getItem("pgfx_motion_reset"); sessionStorage.setItem("pgfx_motion_reset", "1"); localStorage.removeItem(STORE); } catch (x) { /* storage off */ }
    if (again) { location.reload(); return; }
    VH().show({ title: "The video maker could not start", message: "Reloading the page usually clears it. If it keeps happening, try another browser.", error: String(e.message || e),
      actions: [{ label: "Reload the page", primary: true, run: () => location.reload() }] });
    return;
  }
  await start();
})();

/* The phones come over the network, so a dropped connection is retried
   before anything is said, and then the pop-up offers to try again. */
async function start() {
  const H = VH();
  let got;
  try {
    got = await H.retry(async () => {
      const r = await loadPhones("./phones/");
      if (!Object.keys(r.phones).length) throw new Error("None of the phone pictures loaded.");
      return r;
    }, { tries: 4, delay: 1000, onRetry: () => { $("loading").textContent = "Still loading the phones, trying again…"; } });
  } catch (e) {
    console.error(e);
    $("loading").textContent = "The phones could not load.";
    H.show({ title: "The phones could not load", message: "The page could not fetch its phone pictures, usually because the connection dropped or a content filter blocked them. Check your internet, then try again.",
      error: String(e.message || e), actions: [{ label: "Try again", primary: true, run: () => { $("loading").textContent = "Loading phones and fonts…"; start(); } },
        { label: "Reload the page", run: () => location.reload() }] });
    return;
  }
  const { phones, index } = got;
  state.assets.phones = phones; state.index = index;
  state.style.phones = state.style.phones.filter(id => phones[id]);
  if (!state.style.phones.length) state.style.phones = DEFAULT_PHONES.filter(id => phones[id]);
  try { sessionStorage.removeItem("pgfx_motion_reset"); } catch (e) { /* storage off */ }
  syncWords(); drawPhonePicker();
  await rebuild();
  if (!state.looping) { state.looping = true; requestAnimationFrame(loop); }
  renderGallery(true).catch(e => console.warn("Gallery:", e));
}
