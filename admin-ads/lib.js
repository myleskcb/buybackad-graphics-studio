// Ad review (temporary admin): loading frozen batches, making looks, scoring them.
//
// A batch is the video ad maker frozen at one commit (admin-ads/batches/<id>/).
// Every batch is drawn with its OWN engine and scored with the SAME audit
// (admin-ads/audit.js), so a better score means the ads got better, not the ruler.

import { auditLook } from "./audit.js";

export const PHONES_BASE = "../motion/phones/";
export const DEFAULT_PHONES = ["18-pro-max-burgundy", "17-pro-cosmic-orange", "18-pro-glacier", "16-ultramarine"];
export const SAMPLE_NUMBER = "(323) 555-0199";
export const PER_CATEGORY = 24;   // looks scored per category per batch
export const KEEP = 6;            // best looks per category kept with their full recipe

const cache = {};
export async function loadBatch(id) {
  if (!cache[id]) {
    cache[id] = (async () => {
      const [engine, catalog] = await Promise.all([import(`./batches/${id}/engine.js`), import(`./batches/${id}/catalog.js`)]);
      return { id, engine, catalog };
    })();
  }
  return cache[id];
}

export async function loadIndex() {
  return (await fetch("./batches/index.json", { cache: "no-cache" })).json();
}

export async function loadScan(id) {
  try {
    const r = await fetch(`./batches/${id}/scan.json`, { cache: "no-cache" });
    return r.ok ? await r.json() : null;
  } catch (e) { return null; }
}

let phonesP = null;
export function loadAssets(engine) {
  if (!phonesP) phonesP = engine.loadPhones(PHONES_BASE).then(({ phones, index }) => {
    const byId = {}; index.forEach(m => { byId[m.id] = m; });
    return { assets: { phones }, byId };
  });
  return phonesP;
}

/** The categories a batch can make: "none" (no LA vibe) plus each of its vibes. */
export function categoriesOf(batch) {
  const V = batch.catalog.VIBES || {};
  return ["none", ...Object.keys(V)];
}
export function categoryLabel(cat, batch) {
  if (cat === "none") return "Classic (no LA vibe)";
  const V = batch && batch.catalog.VIBES;
  return (V && V[cat] && V[cat].label) || cat.replace(/_/g, " ");
}

// the same category gets the same seeds in every batch, so the first cut and the
// latest are asked for the same looks
const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) % 9000; };
export const seedFor = (cat, i) => 100000 + hash(cat) * 100 + i;

const LOCKED = ["phones", "number", "aspect", "duration", "vibe"];

/** One look of a category, as its engine makes it. */
export function makeLook(batch, byId, cat, seed) {
  const { engine, catalog } = batch;
  const locked = new Set(LOCKED);
  const base = { ...catalog.DEFAULT_STYLE, phones: DEFAULT_PHONES.slice(), number: SAMPLE_NUMBER, aspect: "1:1", duration: 6, vibe: cat };
  const st = engine.randomize(base, seed, locked, [], true);
  return engine.harmonise({ ...st }, locked, byId);
}

/** Load the faces a look draws with (the first cut had no fontsFor). */
export function loadLookFonts(batch, st) {
  const e = batch.engine;
  const f = e.fontsFor ? e.fontsFor(st) : [st.font, st.number_font === "same" || !st.number_font ? st.font : st.number_font, "oswald"];
  return e.loadFonts(f);
}

// Most good looks now score 100, so the score alone cannot pick the best one. The
// rank adds up to one more point for doing better than the pass marks: more
// contrast, the number sooner, the headline sooner, more movement up front.
const part = (v, good, best) => v == null ? 0 : Math.max(0, Math.min(1, (v - good) / (best - good)));
export function rankOf(r) {
  const m = r.m;
  return r.score + .3 * part(m.contrast, 3, 9) + .3 * part(m.numberAt, 3, 1) + .2 * part(m.headlineAt, 2, .6) + .2 * part(m.hookMotion, 6, 24);
}

const fin = v => (typeof v === "number" && isFinite(v) ? Math.round(v * 100) / 100 : null);

/** Score every category of a batch. Returns the scan the page reads (batches/<id>/scan.json). */
export async function scanBatch(id, { per = PER_CATEGORY, onProgress = () => {}, size = 160 } = {}) {
  const batch = await loadBatch(id);
  const { assets, byId } = await loadAssets(batch.engine);
  const cats = categoriesOf(batch);
  const total = cats.length * per;
  let done = 0;
  const out = { batch: id, made: new Date().toISOString(), per, size, categories: {} };
  for (const cat of cats) {
    const rows = [];
    for (let i = 0; i < per; i++) {
      const seed = seedFor(cat, i);
      const st = makeLook(batch, byId, cat, seed);
      await loadLookFonts(batch, st);
      let rep;
      try { rep = await auditLook(st, assets, { AdClass: batch.engine.Ad, size, secs: 4, sound: false }); }
      catch (e) { console.warn("audit failed", id, cat, seed, e); done++; continue; }
      rows.push({
        seed, score: rep.score, style: st,
        m: { wordsAt: fin(rep.wordsAt), headlineAt: fin(rep.headlineAt), numberAt: fin(rep.numberAt), deadAir: fin(rep.deadAir),
          contrast: fin(rep.contrast), cover0: fin(rep.cover0), black0: fin(rep.black0), hookMotion: fin(rep.hookMotion) },
        checks: Object.fromEntries(rep.checks.map(c => [c.id, { ok: c.ok, value: c.value }])),
      });
      onProgress(++done, total, cat);
      await new Promise(r => setTimeout(r, 0));
    }
    rows.forEach(r => { r.rank = rankOf(r); });
    rows.sort((a, b) => b.rank - a.rank);
    rows.forEach((r, k) => { if (k >= KEEP) delete r.style; });
    out.categories[cat] = rows;
  }
  return out;
}

// ------------------------------------------------------------ numbers for the progress view

export const median = a => { const s = a.filter(v => typeof v === "number" && isFinite(v)).sort((p, q) => p - q); return s.length ? s[Math.floor(s.length / 2)] : null; };
export function allRows(scan) { return Object.values(scan.categories).flat(); }
export function summary(rows) {
  const share = id => { const has = rows.filter(r => r.checks[id]); return has.length ? has.filter(r => r.checks[id].ok).length / has.length : null; };
  return {
    n: rows.length,
    score: median(rows.map(r => r.score)),
    best: rows.length ? Math.max(...rows.map(r => r.score)) : null,
    strong: rows.length ? rows.filter(r => r.score >= 90).length / rows.length : null,
    wordsAt: median(rows.map(r => r.m.wordsAt)), numberAt: median(rows.map(r => r.m.numberAt)),
    contrast: median(rows.map(r => r.m.contrast)),
    pass: Object.fromEntries(["frame0", "black0", "hook", "words", "headline", "number", "dead", "contrast"].map(id => [id, share(id)])),
  };
}
