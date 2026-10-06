// The Look Book (owner, 2026-10-03: "Make more variety and push all into 1 mega library",
// a browsable gallery page). Every ready-made look in one place: the video maker's looks
// (LA looks, audience looks, the approved themes by family), its backgrounds and phone
// sets, drawn live by the video engine, and the image studio's live designs by category.
// Each card is a link that opens the look in its editor (motion/?vibe=…&look=…, ?card=…).
import { Ad, ASPECTS, loadPhones, loadFonts, fontsFor, linkedLook, pickPhones, rng } from "./motion/engine.js";
import { DEFAULT_STYLE, VIBES, OPTIONS, THEME_FAMILIES, GROUND_CANDIDATES } from "./motion/catalog.js";
import { loadAccents } from "./motion/accents.js";

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const pretty = s => String(s).replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
const hash = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return (h >>> 0) % 900000 + 1000; };

// the studio's categories, by the names a visitor knows (app.js CATS)
const CATS = { phones: "Phones & Devices", gaming: "Gaming & Consoles", gold: "Gold & Jewelry", coins: "Rare Coins", pokemon: "Pokémon Cards",
  silver: "Silver", cars: "Cars & Trucks", sports: "Sports Cards", computers: "Computers & Parts", audio: "Headphones & Audio",
  wearables: "Wearables & Glasses", cameras: "Cameras & Drones", strips: "Diabetic Supplies" };
// the one "live" predicate (scripts/_showcase_harness.mjs live = scIsLive in app.js)
const live = c => !!c && !c.defect && c.imagery !== "none" && !(typeof c.chroma === "number" && c.chroma < 0.05);

let number = "(213) 555-0199";
try { const b = JSON.parse(localStorage.getItem("pgfx_brand") || "null"); if (b && b.phone) number = String(b.phone); } catch (e) { /* none */ }

// ------------------------------------------------------------ what the book holds

const items = [];          // { kind, group, label, sub, search, href, draw? | img? }
const vibeIds = Object.keys(VIBES).filter(id => id !== "none" && VIBES[id] && VIBES[id].label);
for (const id of vibeIds) {
  const v = VIBES[id], group = v.family ? "Themes: " + v.family : v.la === false ? "Looks for an audience" : "LA looks";
  const seed = hash(id);
  items.push({ kind: "video", group, label: v.label, sub: v.family || (v.la === false ? "Audience" : "Los Angeles"), search: `${v.label} ${group} ${id}`,
    href: `motion/?vibe=${encodeURIComponent(id)}&look=${seed}&aspect=4:5`, pick: { vibe: id, aspect: "4:5" }, seed });
}
const bgName = b => (GROUND_CANDIDATES[b] || {}).label || pretty(b);
for (const b of OPTIONS.background) {
  const seed = hash("bg-" + b);
  items.push({ kind: "ground", group: "Backgrounds", label: bgName(b), sub: "Video background", search: `${bgName(b)} background ${b}`,
    href: `motion/?bg=${encodeURIComponent(b)}&look=${seed}&aspect=4:5`, pick: { bg: b, aspect: "4:5" }, seed });
}
for (const a of OPTIONS.arrangement) {
  const seed = hash("layout-" + a);
  items.push({ kind: "layout", group: "Phone layouts", label: pretty(a), sub: "Phone layout", search: `${pretty(a)} layout phones ${a}`,
    href: `motion/?layout=${encodeURIComponent(a)}&look=${seed}&aspect=4:5`, pick: { layout: a, aspect: "4:5" }, seed });
}

const TABS = [["all", "All"], ["video", "Video looks"], ["image", "Image ads"], ["ground", "Backgrounds"], ["layout", "Phone layouts"]];
let tab = "all", chip = null, page = {};
try { const s = sessionStorage.getItem("lookbook-tab"); if (TABS.some(t => t[0] === s)) tab = s; } catch (e) { /* fine */ }

// ------------------------------------------------------------ drawing the video looks

let engine = null;
const ready = () => engine || (engine = (async () => {
  const [{ phones, index }, accents] = await Promise.all([loadPhones("motion/phones/"), loadAccents("assets/cutouts/").catch(() => ({}))]);
  return { phones, accents, pool: index.filter(m => phones[m.id]).map(m => m.id) };
})());
const queue = []; let busy = false;
async function pump() {
  if (busy) return; busy = true;
  while (queue.length) {
    const { it, box } = queue.shift();
    try {
      const E = await ready();
      const base = { ...DEFAULT_STYLE, number, phones: pickPhones(E.pool, 3, rng(it.seed)) };
      const { style } = linkedLook(base, it.seed, it.pick);
      await loadFonts(fontsFor(style));
      const [W0, H0] = ASPECTS[style.aspect] || ASPECTS["4:5"], k = 400 / Math.max(W0, H0);
      const ad = new Ad(style, { phones: E.phones, accents: E.accents }, Math.round(W0 * k), Math.round(H0 * k));
      const c = document.createElement("canvas"); c.width = ad.W; c.height = ad.H; ad.stillAt(c.getContext("2d"));
      c.setAttribute("role", "img"); c.setAttribute("aria-label", it.label);
      box.querySelector(".wait").replaceWith(c);
    } catch (e) { box.querySelector(".wait").textContent = "Opens in the editor"; console.warn("Look Book:", it.label, e); }
    await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
  }
  busy = false;
}
const seen = "IntersectionObserver" in window ? new IntersectionObserver(es => {
  for (const e of es) if (e.isIntersecting) { seen.unobserve(e.target); queue.push({ it: e.target._it, box: e.target }); }
  pump();
}, { rootMargin: "400px" }) : null;

// ------------------------------------------------------------ the page

const TAGS = { video: ["v", "Video"], ground: ["b", "Background"], layout: ["l", "Layout"], image: ["i", "Image ad"] };
function card(it) {
  const a = document.createElement("a"); a.className = "look"; a.href = it.href;
  a.setAttribute("aria-label", `${it.label}, ${TAGS[it.kind][1]}: open in the editor`);
  const pic = document.createElement("span"); pic.className = "pic" + (it.kind === "image" ? " sq" : "");
  if (it.img) pic.innerHTML = `<img src="${esc(it.img)}" alt="" loading="lazy" decoding="async">`;
  else { pic.innerHTML = `<span class="wait">Drawing…</span>`; pic._it = it; if (seen) seen.observe(pic); else queue.push({ it, box: pic }); }
  a.appendChild(pic);
  a.insertAdjacentHTML("beforeend", `<span class="cap"><b>${esc(it.label)}</b><span><i class="tag ${TAGS[it.kind][0]}">${TAGS[it.kind][1]}</i> ${esc(it.sub)}</span></span>`);
  return a;
}
const PER = 24;
function render() {
  const q = $("#q").value.trim().toLowerCase();
  const inTab = it => tab === "all" || it.kind === tab;
  const shown = items.filter(it => inTab(it) && (!chip || it.group === chip) && (!q || it.search.toLowerCase().includes(q)));
  // the chips: the groups in this tab
  const groups = [...new Set(items.filter(inTab).map(it => it.group))];
  $("#chips").innerHTML = `<button aria-pressed="${!chip}" data-g="">All groups</button>` + groups.map(g => `<button aria-pressed="${chip === g}" data-g="${esc(g)}">${esc(g)}</button>`).join("");
  $("#tabs").innerHTML = TABS.map(([k, l]) => `<button aria-pressed="${tab === k}" data-t="${k}">${l}<small>${k === "all" ? items.length : items.filter(i => i.kind === k).length}</small></button>`).join("");
  const out = $("#out"); out.replaceChildren(); queue.length = 0; if (seen) seen.disconnect();
  const by = new Map(); shown.forEach(it => { if (!by.has(it.group)) by.set(it.group, []); by.get(it.group).push(it); });
  for (const [g, list] of by) {
    const sec = document.createElement("section"); sec.className = "grp";
    const n = page[g] || PER;
    sec.innerHTML = `<h2>${esc(g)}</h2><p>${list.length} ${list.length === 1 ? "look" : "looks"}</p>`;
    const grid = document.createElement("div"); grid.className = "grid";
    list.slice(0, n).forEach(it => grid.appendChild(card(it)));
    sec.appendChild(grid);
    if (list.length > n) { const b = document.createElement("button"); b.className = "more"; b.textContent = `Show ${Math.min(PER, list.length - n)} more`; b.onclick = () => { page[g] = n + PER; render(); }; sec.appendChild(b); }
    out.appendChild(sec);
  }
  $("#empty").hidden = shown.length > 0;
  pump();
}
$("#tabs").addEventListener("click", e => { const b = e.target.closest("[data-t]"); if (!b) return; tab = b.dataset.t; chip = null; page = {}; try { sessionStorage.setItem("lookbook-tab", tab); } catch (x) { /* fine */ } render(); });
$("#chips").addEventListener("click", e => { const b = e.target.closest("[data-g]"); if (!b) return; chip = b.dataset.g || null; page = {}; render(); });
let tq = 0; $("#q").addEventListener("input", () => { clearTimeout(tq); tq = setTimeout(() => { page = {}; render(); }, 150); });

render();
// the image studio's designs, from its showcase index (thumbnails already made)
fetch("assets/showcase/index.json").then(r => r.json()).then(all => {
  const order = Object.keys(CATS);
  all.filter(live).sort((a, b) => order.indexOf(a.cat) - order.indexOf(b.cat) || (b.affinity || 0) - (a.affinity || 0)).forEach(c => {
    const group = "Image ads: " + (CATS[c.cat] || pretty(c.cat));
    items.push({ kind: "image", group, label: (c.name || c.id).split(" · ").pop(), sub: c.theme || CATS[c.cat] || "", img: c.thumb,
      search: `${c.name || ""} ${c.theme || ""} ${CATS[c.cat] || c.cat} ${c.layout || ""} image`, href: `./?card=${encodeURIComponent(c.id)}` });
  });
  render();
}).catch(e => console.warn("Look Book: the image designs could not be read", e));
