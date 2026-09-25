// Phone video ad maker: the page. Engine in engine.js, sound in audio.js, export in export.js.

import { OPTIONS, LABELS, GROUPS, HEADLINES, HOOKS, FONTS, PALETTES, DEFAULT_STYLE, CLASSIC, countLooks } from "./catalog.js";
import { Ad, ASPECTS, randomize, harmonise, loadPhones, loadFonts, phoneFromFile, pal, rng } from "./engine.js";
import { renderSoundtrack } from "./audio.js";
import { exportMp4, recordRealtime, canEncode } from "./export.js";
import { auditLook, drawCurve } from "./audit.js";

const $ = id => document.getElementById(id);
const STORE = "pgfx_motion_v1";
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

const labelFor = (k, v) => {
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
    if (s && s.style) { state.style = { ...state.style, ...s.style }; state.locked = new Set(s.locked || [...state.locked]); }
  } catch (e) { /* fresh start */ }
  try {                                              // the studio's brand kit
    const b = JSON.parse(localStorage.getItem("pgfx_brand") || "null");
    if (b && b.phone && !state.style.number) state.style.number = b.phone;
  } catch (e) { /* none */ }
  const q = new URLSearchParams(location.search);
  if (q.get("look")) state.style.seed = parseInt(q.get("look"), 10) || state.style.seed;
}

// ------------------------------------------------------------ building the ad

async function rebuild() {
  const id = ++state.buildId;
  const st = harmonise({ ...state.style }, state.locked, indexById());
  await loadFonts([st.font, st.number_font === "same" ? st.font : st.number_font]);
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
    await loadFonts([h.font, h.number_font === "same" ? h.font : h.number_font]);
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
  if (ad) {
    const t = curT(), d = ad.st.duration;
    const ctx = $("preview").getContext("2d");
    ad.frame(ctx, Math.min(t, d - .001), { subsFly: 3, subsMove: 2 });
    if (state.playing) $("scrub").value = String(Math.round(Math.min(t, d) / d * 1000));
    if (state.playing && state.sound && t < .05 && !state._restarted) { startAudio(0); state._restarted = true; }
    if (t > .1) state._restarted = false;
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
  $("headline-list").innerHTML = HEADLINES.map(h => `<option value="${h}">`).join("");
  const design = $("design");
  for (const [title, keys] of GROUPS) {
    const sec = document.createElement("details"); sec.className = "mo-sec"; sec.open = title === "Type" || title === "Scene";
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
  $("new-hook").addEventListener("click", () => { pushHistory(); const r = rng(Date.now() & 0xffff); state.style.hook_text = r.pick(HOOKS); state.locked.add("hook_text"); $("f-hook").value = state.style.hook_text; save(); rebuild(); });
  $("f-number").addEventListener("input", debounce(e => { state.style.number = e.target.value; save(); rebuild(); renderGallery(true); }, 500));
  $("new-headline").addEventListener("click", () => { pushHistory(); const r = rng(Date.now() & 0xffff); state.style.headline = r.pick(HEADLINES); $("f-headline").value = state.style.headline; save(); rebuild(); });

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
    } catch (err) { alert("That picture could not be read. Try a PNG of the phone's back."); }
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
  $("download").addEventListener("click", download);
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
    state.style = $("strong-only").checked ? await strongSeed(state.style, locked, pool, all)
      : randomize(state.style, (Math.random() * 1e9) | 0, locked, pool, all);
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
  if (reset) { g.innerHTML = ""; }
  const [W, H] = ASPECTS[state.style.aspect] || ASPECTS["1:1"];
  const k = 300 / Math.max(W, H);
  for (let i = 0; i < 8; i++) {
    const seed = state.gallerySeed++;
    const st = harmonise(randomize(state.style, seed, state.locked, [], false), state.locked, indexById());
    await loadFonts([st.font, st.number_font === "same" ? st.font : st.number_font]);
    const ad = new Ad(st, state.assets, Math.round(W * k), Math.round(H * k));
    const b = document.createElement("button"); b.className = "mo-thumb"; b.title = "Use this look";
    const c = document.createElement("canvas"); c.width = ad.W; c.height = ad.H;
    ad.stillAt(c.getContext("2d"));
    b.appendChild(c); b.insertAdjacentHTML("beforeend", `<span>${labelFor("font", st.font)}</span>`);
    b.addEventListener("click", () => { pushHistory(); state.style = { ...st, number: state.style.number, phones: state.style.phones }; save(); syncWords(); rebuild(); window.scrollTo({ top: 0, behavior: "smooth" }); });
    g.appendChild(b);
    await new Promise(r => setTimeout(r, 0));
  }
}

// ------------------------------------------------------------ download

async function download() {
  const btn = $("download"); btn.disabled = true;
  $("progress").hidden = false; $("export-note").textContent = "";
  const prog = (p, label) => { $("bar").style.width = Math.round(p * 100) + "%"; $("progress-label").textContent = label; };
  try {
    const st = harmonise({ ...state.style }, state.locked, indexById());
    await loadFonts([st.font, st.number_font === "same" ? st.font : st.number_font]);
    const ad = new Ad(st, state.assets);            // full size
    let out;
    if (canEncode()) out = await exportMp4(ad, prog);
    else { $("export-note").textContent = "This browser records in real time: keep this tab in front for a few seconds."; out = await recordRealtime(ad, prog); }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(out.blob);
    a.download = `we-buy-phones-${st.aspect.replace(":", "x")}-${st.seed}.${out.ext}`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    $("export-note").textContent = `Saved ${a.download} (${(out.blob.size / 1e6).toFixed(1)} MB${out.audio ? ", with sound" : ", no sound: this browser cannot encode audio"}).`;
  } catch (e) {
    console.error(e); $("export-note").textContent = "The video could not be made here: " + (e.message || e) + " Try Chrome or Edge.";
  } finally { btn.disabled = false; setTimeout(() => { $("progress").hidden = true; }, 1500); }
}

function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

// ------------------------------------------------------------ start

(async function main() {
  restore();
  buildPanel();
  const { phones, index } = await loadPhones("./phones/");
  state.assets.phones = phones; state.index = index;
  state.style.phones = state.style.phones.filter(id => phones[id]);
  if (!state.style.phones.length) state.style.phones = DEFAULT_PHONES.filter(id => phones[id]);
  syncWords(); drawPhonePicker();
  await rebuild();
  requestAnimationFrame(loop);
  renderGallery(true);
})();
