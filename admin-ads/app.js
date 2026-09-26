// Ad review (temporary admin): the page. Batches and scoring in lib.js.

import { loadIndex, loadBatch, loadScan, loadAssets, categoriesOf, categoryLabel, allRows, summary, makeLook, loadLookFonts } from "./lib.js";

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const RATINGS = "admin_ads_ratings_v1";
const UI = "admin_ads_ui_v1";

const state = { index: null, batches: [], scans: {}, byId: {}, assets: null, ratings: {}, ui: {} };

// ------------------------------------------------------------ storage (this browser only; export to keep)

function loadRatings() { try { state.ratings = JSON.parse(localStorage.getItem(RATINGS) || "{}") || {}; } catch (e) { state.ratings = {}; } }
function saveRatings() { try { localStorage.setItem(RATINGS, JSON.stringify(state.ratings)); } catch (e) { /* private mode: kept for this visit */ } countRated(); }
function loadUi() { try { state.ui = JSON.parse(localStorage.getItem(UI) || "{}") || {}; } catch (e) { state.ui = {}; } }
function saveUi() { try { localStorage.setItem(UI, JSON.stringify(state.ui)); } catch (e) { /* fine */ } }
const keyOf = (batch, cat, seed) => `${batch}|${cat}|${seed}`;
function countRated() { const n = Object.values(state.ratings).filter(r => r.stars || r.pick || Object.keys(r.votes || {}).length).length; $("rated-count").textContent = n ? `(${n})` : ""; }

// ------------------------------------------------------------ recipe: every ingredient of a look, grouped

const WORDS = ["headline", "tag", "hook_text", "number_label", "cta", "lang"];
function recipeGroups(batch) {
  const c = batch.catalog;
  const groups = (c.GROUPS || []).map(([name, keys]) => [name, keys.slice()]);
  const seen = new Set(groups.flatMap(g => g[1]));
  const extras = [...Object.keys(c.FLAGS || {}), "grain", "decor", "bpm"].filter(k => !seen.has(k));
  groups.unshift(["Words", WORDS]);
  groups.push(["Extras", extras]);
  return groups;
}
const pretty = s => String(s).replace(/[_-]/g, " ").replace(/\b\w/g, ch => ch.toUpperCase());
function labelOf(batch, k) { return (batch.catalog.LABELS && batch.catalog.LABELS[k]) || ({ headline: "Headline", tag: "Tag line", hook_text: "Hook words", number_label: "Number label", cta: "Call to action", lang: "Language", grain: "Film grain", decor: "Decorations", bpm: "Tempo" }[k]) || pretty(k); }
function valueOf(batch, k, v) {
  const c = batch.catalog;
  if (v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length)) return null;
  if (typeof v === "boolean") return v ? "On" : "Off";
  if (Array.isArray(v)) return v.map(pretty).join(", ");
  if ((k === "font" || k === "number_font") && c.FONTS && c.FONTS[v]) return c.FONTS[v][0];
  if (k === "vibe") return categoryLabel(v, batch);
  if (k === "bpm") return `${v} bpm`;
  if (k === "skew") return v === 0 ? "Upright" : v < 0 ? `Back slant ${-v}°` : `Slant ${v}°`;
  if (k === "tracking") return v < 0 ? "Tight" : v === 0 ? "Normal" : v <= .02 ? "Open" : v <= .05 ? "Wide" : "Extra wide";
  if (k === "shake") return ["None", "Some", "Lots"][v] ?? String(v);
  if (k === "glare") return v === .5 ? "Soft" : v === 1 ? "Normal" : "Bright";
  if (k === "lang") return { en: "English", es: "Spanish", both: "Both" }[v] || v;
  if (WORDS.includes(k)) return String(v);
  return pretty(v);
}
// what counts as one ingredient for voting and the formula: arrays vote per item
function ingredientsOf(batch, st) {
  const out = [];
  for (const [group, keys] of recipeGroups(batch)) for (const k of keys) {
    const v = st[k];
    if (Array.isArray(v)) v.forEach(x => out.push({ group, k, v: x, text: pretty(x) }));
    else { const text = valueOf(batch, k, v); if (text != null) out.push({ group, k, v, text }); }
  }
  return out;
}

// ------------------------------------------------------------ drawing ads

const THUMB = 300;
function thumb(batch, row, cat, { hoverPlay = true } = {}) {
  const b = document.createElement("button");
  b.className = "ar-thumb"; b.type = "button";
  b.title = `${categoryLabel(cat, batch)}, look ${row.seed}: open the recipe`;
  const c = document.createElement("canvas"); c.width = THUMB; c.height = THUMB;
  b.appendChild(c);
  b.insertAdjacentHTML("beforeend", `<span class="ar-sc">${row.score}</span>`);
  const r = state.ratings[keyOf(batch.id, cat, row.seed)];
  if (r && (r.stars || r.pick)) b.insertAdjacentHTML("beforeend", `<span class="ar-mine">${r.pick ? "♥ " : ""}${r.stars ? "★".repeat(r.stars) : ""}</span>`);
  let ad = null, raf = 0, t0 = 0;
  const draw = async () => {
    if (!row.style) return;
    await loadLookFonts(batch, row.style);
    ad = new batch.engine.Ad(row.style, state.assets, THUMB, THUMB);
    ad.stillAt(c.getContext("2d"));
  };
  queueDraw(draw);
  if (hoverPlay) {
    const loop = now => { if (!ad) return; const t = ((now - t0) / 1000) % ad.st.duration; ad.frame(c.getContext("2d"), t, { subsFly: 2, subsMove: 1 }); raf = requestAnimationFrame(loop); };
    b.addEventListener("mouseenter", () => { if (!ad) return; t0 = performance.now(); raf = requestAnimationFrame(loop); });
    b.addEventListener("mouseleave", () => { cancelAnimationFrame(raf); if (ad) ad.stillAt(c.getContext("2d")); });
  }
  b.addEventListener("click", () => openDetail(batch, cat, row));
  return b;
}
// thumbnails draw one at a time so the page stays responsive
let drawQ = Promise.resolve();
function queueDraw(fn) { drawQ = drawQ.then(() => fn().catch(e => console.warn("thumb", e))).then(() => new Promise(r => setTimeout(r, 0))); }

const emptyCell = text => { const d = document.createElement("div"); d.className = "ar-empty"; d.textContent = text; return d; };

// ------------------------------------------------------------ progress view

const pct = v => v == null ? "–" : Math.round(v * 100) + "%";
const secs = v => v == null ? "–" : v.toFixed(1) + " s";

function renderProgress() {
  const bs = state.batches.filter(b => state.scans[b.id]);
  const sums = bs.map(b => summary(allRows(state.scans[b.id])));
  // one card per round
  const cards = $("batch-cards"); cards.innerHTML = "";
  bs.forEach((b, i) => {
    const s = sums[i], prev = sums[i - 1];
    const delta = (a, p, lowerBetter) => { if (p == null || a == null) return ""; const d = a - p; if (Math.abs(d) < .05) return ""; const good = lowerBetter ? d < 0 : d > 0; return `<span class="ar-delta ${good ? "up" : "down"}">${d > 0 ? "+" : ""}${Number.isInteger(d) ? d : d.toFixed(1)}</span>`; };
    const card = document.createElement("div"); card.className = "ar-card";
    const meta = state.index.batches.find(x => x.id === b.id);
    card.innerHTML = `<h3>Round ${i + 1}: ${esc(meta.label)}</h3><span class="ar-when">${esc(meta.date)} · ${categoriesOf(b).length} ${categoriesOf(b).length === 1 ? "category" : "categories"} · ${s.n} ads scored</span>
      <dl><div><dt>Median</dt><dd>${s.score ?? "–"}${delta(s.score, prev && prev.score)}</dd></div>
      <div><dt>Best</dt><dd>${s.best ?? "–"}${delta(s.best, prev && prev.best)}</dd></div>
      <div><dt>90 and up</dt><dd>${pct(s.strong)}</dd></div></dl>`;
    const best = bestOf(b);
    if (best) card.appendChild(thumb(b, best.row, best.cat));
    cards.appendChild(card);
  });
  // chart
  $("chart").innerHTML = chartSvg(bs.map((b, i) => ({ label: `Round ${i + 1}`, median: sums[i].score, best: sums[i].best, strong: sums[i].strong == null ? null : sums[i].strong * 100 })));
  // what passed, round by round
  const rowsT = [["Words on screen by 1 s", "words"], ["Headline readable by 2 s", "headline"], ["Number readable by 3 s", "number"], ["Movement in the first half second", "hook"],
    ["First frame shows something", "frame0"], ["Never still for 0.6 s", "dead"], ["Headline contrast 3:1", "contrast"]];
  $("pass-table").innerHTML = `<thead><tr><th>Share of ads that pass</th>${bs.map((b, i) => `<th>Round ${i + 1}</th>`).join("")}</tr></thead><tbody>` +
    rowsT.map(([label, id]) => `<tr><td>${label}</td>${sums.map(s => `<td>${pct(s.pass[id])}</td>`).join("")}</tr>`).join("") +
    `<tr><td>Median time to the number</td>${sums.map(s => `<td>${secs(s.numberAt)}</td>`).join("")}</tr></tbody>`;
  // category by round: side by side where more than one round made it, then what each round added
  const cats = [...new Set(bs.flatMap(b => categoriesOf(b)))];
  const shared = cats.filter(c => bs.filter(b => (state.scans[b.id].categories[c] || []).length).length > 1);
  const m = $("matrix"); m.innerHTML = "";
  const head = document.createElement("tr"); head.innerHTML = `<th></th>${bs.map((b, i) => `<th>Round ${i + 1}: ${esc(state.index.batches.find(x => x.id === b.id).label)}</th>`).join("")}`;
  m.appendChild(head);
  const labelBatch = bs[bs.length - 1];
  for (const cat of shared) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<th scope="row">${esc(categoryLabel(cat, labelBatch))}</th>`;
    for (const b of bs) {
      const td = document.createElement("td");
      const rows = state.scans[b.id].categories[cat];
      td.appendChild(rows && rows.length ? thumb(b, rows[0], cat) : emptyCell("Not in this round"));
      tr.appendChild(td);
    }
    m.appendChild(tr);
  }
  const added = $("added"); added.innerHTML = "";
  bs.forEach((b, i) => {
    const mine = categoriesOf(b).filter(c => !shared.includes(c) && (state.scans[b.id].categories[c] || []).length);
    if (!mine.length) return;
    const sec = document.createElement("div"); sec.className = "ar-cat";
    sec.innerHTML = `<h3>New in round ${i + 1}: ${esc(state.index.batches.find(x => x.id === b.id).label)}<span>${mine.length} categories no earlier round could make; best of each</span></h3>`;
    const row = document.createElement("div"); row.className = "ar-row";
    for (const cat of mine) {
      const cell = document.createElement("div"); cell.className = "ar-cell";
      cell.appendChild(thumb(b, state.scans[b.id].categories[cat][0], cat));
      cell.insertAdjacentHTML("beforeend", `<span>${esc(categoryLabel(cat, b))}</span>`);
      row.appendChild(cell);
    }
    sec.appendChild(row); added.appendChild(sec);
  });
}
function bestOf(b) {
  let best = null;
  for (const [cat, rows] of Object.entries(state.scans[b.id].categories)) if (rows[0] && (!best || rows[0].score > best.row.score)) best = { cat, row: rows[0] };
  return best;
}

function chartSvg(pts) {
  if (!pts.length) return "";
  const W = 720, H = 240, L = 40, R = 16, T = 16, B = 34;
  const x = i => pts.length === 1 ? (L + W - R) / 2 : L + i * (W - L - R) / (pts.length - 1);
  const y = v => T + (1 - v / 100) * (H - T - B);
  const series = [["best", "Best ad", "var(--btn)"], ["median", "Median ad", "var(--text)"], ["strong", "Share scoring 90+", "#34c77b"]];
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Scores by round">`;
  for (const g of [0, 25, 50, 75, 100]) s += `<line x1="${L}" x2="${W - R}" y1="${y(g)}" y2="${y(g)}" stroke="var(--line)"/><text x="${L - 8}" y="${y(g) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${g}</text>`;
  pts.forEach((p, i) => { s += `<text x="${x(i)}" y="${H - 10}" text-anchor="middle" font-size="12" fill="var(--text-2)">${esc(p.label)}</text>`; });
  for (const [k, , col] of series) {
    const pp = pts.map((p, i) => p[k] == null ? null : [x(i), y(p[k])]).filter(Boolean);
    if (pp.length > 1) s += `<polyline fill="none" stroke="${col}" stroke-width="2.5" stroke-linejoin="round" points="${pp.map(q => q.join(",")).join(" ")}"/>`;
    pts.forEach((p, i) => { if (p[k] == null) return; s += `<circle cx="${x(i)}" cy="${y(p[k])}" r="4" fill="${col}"><title>${esc(p.label)}: ${Math.round(p[k])}</title></circle>`; });
    const last = pts.length - 1; if (pts[last][k] != null) s += `<text x="${x(last) - 8}" y="${y(pts[last][k]) - 8}" text-anchor="end" font-size="12" font-weight="700" fill="${col}">${Math.round(pts[last][k])}${k === "strong" ? "%" : ""}</text>`;
  }
  s += "</svg>";
  return `<div class="ar-legend">${series.map(([, l, c]) => `<span><i style="background:${c}"></i>${l}</span>`).join("")}</div>` + s;
}

// ------------------------------------------------------------ best-by-category view

function renderBest() {
  const pick = $("batch-pick");
  const id = pick.value;
  const b = state.batches.find(x => x.id === id);
  const scan = state.scans[id];
  const n = parseInt($("show-n").value, 10);
  const out = $("best"); out.innerHTML = "";
  if (!scan) { out.appendChild(emptyCell("This round has not been scored yet: run admin-ads/tools/scan.mjs")); return; }
  $("best-note").textContent = `${scan.per} looks scored per category; the top ${n} shown. Hover to play.`;
  for (const cat of categoriesOf(b)) {
    const rows = scan.categories[cat] || [];
    const sec = document.createElement("section"); sec.className = "ar-cat";
    const s = summary(rows);
    sec.innerHTML = `<h3>${esc(categoryLabel(cat, b))}<span>median ${s.score ?? "–"}, best ${s.best ?? "–"}, ${pct(s.strong)} score 90+</span></h3>`;
    const row = document.createElement("div"); row.className = "ar-row";
    rows.slice(0, n).forEach(r => row.appendChild(thumb(b, r, cat)));
    sec.appendChild(row); out.appendChild(sec);
  }
}

// ------------------------------------------------------------ the recipe dialog

const player = { ad: null, raf: 0, t: 0, last: 0, playing: true, speed: 1 };
let current = null;

async function openDetail(batch, cat, row) {
  current = { batch, cat, row, key: keyOf(batch.id, cat, row.seed) };
  const meta = state.index.batches.find(x => x.id === batch.id);
  const roundNo = state.index.batches.findIndex(x => x.id === batch.id) + 1;
  $("d-title").textContent = `${categoryLabel(cat, batch)}, round ${roundNo} (${meta.label})`;
  $("d-score").textContent = `${row.score} / 100`;
  $("d-meta").textContent = `look ${row.seed} · made by ${meta.commit}`;
  $("d-checks").innerHTML = Object.entries(row.checks).filter(([id]) => id !== "sound").map(([id, c]) => `<li>${c.ok ? "✅" : "⚠️"} ${esc(CHECK_LABELS[id] || id)}: <b>${esc(c.value)}</b></li>`).join("");
  const st = row.style || makeLook(batch, state.byId, cat, row.seed);
  await loadLookFonts(batch, st);
  const cv = $("player");
  player.ad = new batch.engine.Ad(st, state.assets, cv.width, cv.height);
  player.t = 0; player.last = performance.now(); setPlaying(true);
  renderRating(); renderRecipe(batch, st);
  const latest = state.index.batches[state.index.batches.length - 1].id === batch.id;
  const open = $("d-open");
  open.setAttribute("aria-disabled", String(!latest));
  open.title = latest ? "Opens /motion with this exact look (replaces the look saved there)" : "Only the latest round still matches the live maker";
  open.href = latest ? "../motion/" : "#";
  open.onclick = latest ? () => {
    const locked = ["phones", "headline", "tag", "number", "number_label", "aspect", "duration", "vibe"];
    try { localStorage.setItem("pgfx_motion_v1", JSON.stringify({ style: st, locked })); } catch (e) { /* the maker opens on its own look */ }
  } : e => e.preventDefault();
  if (!$("detail").open) $("detail").showModal();
}
const CHECK_LABELS = { frame0: "First frame shows something", black0: "First frame is not mostly black", hook: "Movement in the first half second",
  words: "Words on screen by 1 s", headline: "Headline readable by 2 s", number: "Number readable by 3 s", dead: "Never still for 0.6 s", contrast: "Headline stands out" };

function tick(now) {
  const ad = player.ad; if (!ad) return;
  if (player.playing) { player.t = (player.t + (now - player.last) / 1000 * player.speed) % ad.st.duration; }
  player.last = now;
  ad.frame($("player").getContext("2d"), player.t, undefined, 1 / 60 * player.speed);
  $("d-scrub").value = Math.round(player.t / ad.st.duration * 1000);
  if ($("detail").open) player.raf = requestAnimationFrame(tick);
}
function setPlaying(on) {
  player.playing = on; $("d-play").innerHTML = on ? "&#10074;&#10074;" : "&#9654;"; $("d-play").setAttribute("aria-label", on ? "Pause" : "Play");
  cancelAnimationFrame(player.raf); player.last = performance.now(); player.raf = requestAnimationFrame(tick);
}

function rating() { return state.ratings[current.key] || (state.ratings[current.key] = { votes: {} }); }
function touch() {
  const r = rating();
  r.batch = current.batch.id; r.cat = current.cat; r.seed = current.row.seed; r.score = current.row.score; r.at = new Date().toISOString();
  r.recipe = ingredientsOf(current.batch, current.row.style || makeLook(current.batch, state.byId, current.cat, current.row.seed)).map(({ group, k, v, text }) => ({ group, k, v, text }));
  saveRatings();
}
function renderRating() {
  const r = state.ratings[current.key] || { votes: {} };
  const stars = $("d-stars"); stars.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const b = document.createElement("button"); b.type = "button"; b.textContent = "★"; b.className = i <= (r.stars || 0) ? "on" : "";
    b.setAttribute("aria-label", `${i} star${i > 1 ? "s" : ""}`); b.setAttribute("role", "radio"); b.setAttribute("aria-checked", String(i === r.stars));
    b.onclick = () => { const x = rating(); x.stars = x.stars === i ? 0 : i; touch(); renderRating(); };
    stars.appendChild(b);
  }
  $("d-pick").checked = !!r.pick;
  $("d-notes").value = r.notes || "";
}
function renderRecipe(batch, st) {
  const box = $("d-recipe"); box.innerHTML = "";
  const ings = ingredientsOf(batch, st);
  const byGroup = {};
  ings.forEach(x => (byGroup[x.group] = byGroup[x.group] || []).push(x));
  for (const [group, list] of Object.entries(byGroup)) {
    const g = document.createElement("div"); g.className = "ar-group";
    g.innerHTML = `<h4>${esc(group)}</h4>`;
    for (const ing of list) {
      const vk = `${ing.k}=${ing.v}`;
      const row = document.createElement("div"); row.className = "ar-ing";
      row.innerHTML = `<span>${esc(labelOf(batch, ing.k))}</span><b>${esc(ing.text)}</b><span class="ar-vote"></span>`;
      const vote = row.querySelector(".ar-vote");
      for (const [val, face, name] of [[1, "👍", "Like"], [-1, "👎", "Dislike"]]) {
        const b = document.createElement("button"); b.type = "button"; b.textContent = face; b.title = `${name} ${ing.text}`;
        const cur = () => (state.ratings[current.key] && state.ratings[current.key].votes[vk]) || 0;
        b.setAttribute("aria-pressed", String(cur() === val));
        b.onclick = () => {
          const r = rating(); if (r.votes[vk] === val) delete r.votes[vk]; else r.votes[vk] = val;
          touch(); vote.querySelectorAll("button").forEach((x, i) => x.setAttribute("aria-pressed", String(r.votes[vk] === (i ? -1 : 1))));
        };
        vote.appendChild(b);
      }
      g.appendChild(row);
    }
    box.appendChild(g);
  }
}

// ------------------------------------------------------------ my formula

// A star rating says something about every ingredient in the ad, a little; a thumb
// says a lot about one. Stars count 0.5 per ingredient (1 star = -0.5, 3 = 0,
// 5 = +0.5), a thumb counts 1.
function tally() {
  const t = {};
  for (const r of Object.values(state.ratings)) {
    if (!r.recipe) continue;
    const base = r.stars ? (r.stars - 3) / 4 : 0;
    for (const ing of r.recipe) {
      const vk = `${ing.k}=${ing.v}`;
      const vote = (r.votes || {})[vk] || 0;
      if (!base && !vote && !r.pick) continue;
      const e = t[vk] || (t[vk] = { group: ing.group, k: ing.k, v: ing.v, text: ing.text, score: 0, n: 0, up: 0, down: 0 });
      e.score += base + vote + (r.pick ? .25 : 0); e.n++;
      if (vote > 0) e.up++; if (vote < 0) e.down++;
    }
  }
  return Object.values(t);
}

function renderFormula() {
  const rated = Object.values(state.ratings).filter(r => r.recipe && (r.stars || r.pick || Object.keys(r.votes || {}).length));
  $("formula-note").textContent = rated.length ? `${rated.length} ads rated.` : "Nothing rated yet: open any ad and give it stars or thumbs.";
  // favourites and top rated
  const picks = $("picks"); picks.innerHTML = "";
  const top = rated.filter(r => r.pick || r.stars >= 4).sort((a, b) => (b.pick - a.pick) || (b.stars || 0) - (a.stars || 0)).slice(0, 12);
  if (top.length) {
    const p = document.createElement("div"); p.className = "ar-panel";
    p.innerHTML = `<h2>Your favourites</h2><p class="ar-note">Favourites first, then 4 and 5 stars.</p>`;
    const row = document.createElement("div"); row.className = "ar-row";
    for (const r of top) {
      const b = state.batches.find(x => x.id === r.batch); const scan = state.scans[r.batch];
      const found = scan && (scan.categories[r.cat] || []).find(x => x.seed === r.seed);
      if (b && found) row.appendChild(thumb(b, found, r.cat));
    }
    p.appendChild(row); picks.appendChild(p);
  }
  // ingredient scores
  const t = tally();
  const box = $("formula"); box.innerHTML = "";
  if (!t.length) return;
  const byGroup = {};
  t.forEach(e => (byGroup[e.group] = byGroup[e.group] || []).push(e));
  const grid = document.createElement("div"); grid.className = "ar-fgrid";
  for (const [group, list] of Object.entries(byGroup)) {
    const col = document.createElement("div"); col.className = "ar-fcol";
    col.innerHTML = `<h3>${esc(group)}</h3>`;
    const byK = {};
    list.forEach(e => (byK[e.k] = byK[e.k] || []).push(e));
    for (const [k, es] of Object.entries(byK)) {
      const latest = state.batches[state.batches.length - 1];
      col.insertAdjacentHTML("beforeend", `<h4>${esc(labelOf(latest, k))}</h4>`);
      es.sort((a, b) => b.score / b.n - a.score / a.n);
      for (const e of es.slice(0, 8)) {
        const avg = e.score / e.n, w = Math.min(50, Math.abs(avg) * 50);
        col.insertAdjacentHTML("beforeend", `<div class="ar-frow" title="${e.n} rated ad${e.n > 1 ? "s" : ""}, ${e.up} 👍 ${e.down} 👎"><span>${esc(e.text)}</span><div class="ar-fbar"><i class="${avg >= 0 ? "pos" : "neg"}" style="width:${w}%"></i></div><em>${e.n}</em></div>`);
      }
    }
    grid.appendChild(col);
  }
  box.appendChild(grid);
}

/** Your taste as WEIGHTS for catalog.js: 1 is neutral, 2 twice as likely, 0.5 half. */
function suggestedWeights() {
  const latest = state.batches[state.batches.length - 1];
  const O = latest.catalog.OPTIONS || {};
  const out = {};
  for (const e of tally()) {
    if (!O[e.k] || !O[e.k].includes(e.v) || typeof e.v === "boolean") continue;
    const avg = e.score / e.n;
    const w = Math.round(Math.min(4, Math.max(.25, 2 ** (avg * 2))) * 100) / 100;
    if (w !== 1) (out[e.k] = out[e.k] || {})[e.v] = w;
  }
  return out;
}

function download(name, text, type = "application/json") {
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// ------------------------------------------------------------ wiring

function showTab(name) {
  document.querySelectorAll(".ar-tabs button").forEach(b => b.setAttribute("aria-selected", String(b.dataset.tab === name)));
  document.querySelectorAll(".ar-tab").forEach(s => { s.hidden = s.id !== "tab-" + name; });
  state.ui.tab = name; saveUi();
  if (name === "best") renderBest();
  if (name === "formula") renderFormula();
}

(async function main() {
  loadRatings(); loadUi(); countRated();
  state.index = await loadIndex();
  state.batches = await Promise.all(state.index.batches.map(b => loadBatch(b.id)));
  const scans = await Promise.all(state.index.batches.map(b => loadScan(b.id)));
  state.index.batches.forEach((b, i) => { if (scans[i]) state.scans[b.id] = scans[i]; });
  const { assets, byId } = await loadAssets(state.batches[state.batches.length - 1].engine);
  state.assets = assets; state.byId = byId;

  const pick = $("batch-pick");
  pick.innerHTML = state.index.batches.map((b, i) => `<option value="${esc(b.id)}">Round ${i + 1}: ${esc(b.label)}</option>`).join("");
  pick.value = state.ui.batch && state.scans[state.ui.batch] ? state.ui.batch : state.index.batches[state.index.batches.length - 1].id;
  pick.onchange = () => { state.ui.batch = pick.value; saveUi(); renderBest(); };
  $("show-n").onchange = renderBest;
  document.querySelectorAll(".ar-tabs button").forEach(b => b.addEventListener("click", () => showTab(b.dataset.tab)));

  $("d-close").onclick = () => $("detail").close();
  $("detail").addEventListener("close", () => { cancelAnimationFrame(player.raf); player.ad = null; if (!$("tab-best").hidden) renderBest(); if (!$("tab-formula").hidden) renderFormula(); });
  $("detail").addEventListener("click", e => { if (e.target === $("detail")) $("detail").close(); });
  $("d-play").onclick = () => setPlaying(!player.playing);
  $("d-scrub").oninput = e => { if (!player.ad) return; player.t = e.target.value / 1000 * player.ad.st.duration; setPlaying(false); };
  $("d-speed").querySelectorAll("button").forEach(b => b.onclick = () => {
    player.speed = parseFloat(b.dataset.speed);
    $("d-speed").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
  });
  $("d-pick").onchange = e => { rating().pick = e.target.checked; touch(); };
  $("d-notes").oninput = e => { rating().notes = e.target.value; touch(); };

  $("export").onclick = () => download(`ad-ratings-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ kind: "ad-review-ratings", version: 1, exported: new Date().toISOString(), ratings: state.ratings }, null, 2));
  $("import").onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (d.kind !== "ad-review-ratings") throw new Error("not a ratings file");
      Object.assign(state.ratings, d.ratings); saveRatings(); renderFormula();
      $("formula-note").textContent = `Imported ${Object.keys(d.ratings).length} ratings.`;
    } catch (err) { $("formula-note").textContent = "That file could not be read: " + err.message; }
    e.target.value = "";
  };
  $("export-weights").onclick = () => {
    const w = suggestedWeights();
    download("weights-from-ratings.js", `// Suggested from ${Object.keys(state.ratings).length} ratings on ${new Date().toISOString().slice(0, 10)}.\n// 1 is neutral, 2 is twice as likely to be drawn, 0.5 half. Merge into WEIGHTS in motion/catalog.js.\nexport const WEIGHTS_FROM_RATINGS = ${JSON.stringify(w, null, 2)};\n`, "text/javascript");
  };

  renderProgress();
  showTab(state.ui.tab || "progress");
})();

