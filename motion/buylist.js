// "This week we're buying": the list card a wholesale buyer sends a business
// (owner, 2026-11-10, after the wholesale ads were audited: a reseller or a
// repair shop answers a list of the models wanted, not a flashy picture).
//
// What it says: the models, one a line; that the lot is quoted as one offer; to
// text a list or a photo; the number, and the area when the look has one. No
// price, no claim and no dash, the same rules as the ad's own words.
//
// How it is drawn: the ad's own palette and faces (engine.js pal, fontsFor), the
// phones of the ad standing in a row when the card is tall enough for them.
// Measured before it is saved, as every generation is: each line's contrast
// against what is under it (WCAG, engine.js contrastOf), swapped to near-black or
// white where it falls short, and each line's width, shrunk until it fits. A line
// that still fails is named in `checks`, and the page will not save the card.

import { pal, contrastOf, fontCss, canvas, ASPECTS, PHONE_META, heightOf, areaOf } from "./engine.js";

export const MAX_ROWS = 8;
const MIN_ROWS = 3;

const WORDS = {
  en: { kicker: "THIS WEEK", title: "WE'RE BUYING", mixed: "MIXED MODELS AND CONDITION WELCOME", lot: "ONE OFFER FOR THE WHOLE LOT",
    ask: "TEXT A LIST OR A PHOTO", noNumber: "MESSAGE US A LIST OR A PHOTO", area: a => `BUYING IN ${a}` },
  es: { kicker: "ESTA SEMANA", title: "COMPRAMOS", mixed: "ACEPTAMOS LOTES MIXTOS", lot: "UNA OFERTA POR TODO EL LOTE",
    ask: "MÁNDANOS LA LISTA O UNA FOTO", noNumber: "MÁNDANOS LA LISTA O UNA FOTO", area: a => `COMPRAMOS EN ${a}` },
};

const NEWEST = m => { const n = /iPhone (\d+)/.exec(m || ""); return n ? Number(n[1]) * 10 + (/Pro Max/.test(m) ? 3 : / Pro/.test(m) ? 2 : /Plus|Air/.test(m) ? 1 : 0) : -1; };

/** The models to list: the ad's own, then the newest models on hand, up to
 *  `n`, newest first (Pro Max, Pro, then the rest of each year). */
export function buyListModels(st, metas = PHONE_META, n = 6) {
  const all = Object.values(metas).filter(m => m && m.model && !m.upload && m.ok !== false);
  const own = [...new Set((st.phones || []).map(id => metas[id]).filter(m => m && m.model && !m.upload).map(m => m.model))];
  own.sort((a, b) => NEWEST(b) - NEWEST(a));
  const rest = [...new Set(all.map(m => m.model))].filter(m => !own.includes(m)).sort((a, b) => NEWEST(b) - NEWEST(a));
  return [...own, ...rest].slice(0, Math.max(n, Math.min(own.length, MAX_ROWS))).sort((a, b) => NEWEST(b) - NEWEST(a));
}

/** The list as typed: one model a line, blank and repeated lines dropped, at
 *  most MAX_ROWS, each at most 32 characters. */
export function parseModels(text) {
  const seen = new Set(), out = [];
  for (const raw of String(text || "").split(/\r?\n/)) {
    const line = raw.replace(/\s+/g, " ").trim().slice(0, 32);
    const key = line.toLowerCase();
    if (!line || seen.has(key)) continue;
    seen.add(key); out.push(line);
    if (out.length >= MAX_ROWS) break;
  }
  return out;
}

const BLACK = "#111111", WHITE = "#ffffff";
/** The ink a line is drawn in: its own where it reads (4.5:1, 3:1 for the big
 *  title), else near-black or white, whichever stands further off its ground. */
function inkFor(want, ground, big) {
  const need = big ? 3 : 4.5;
  if (want && contrastOf(want, ground) >= need) return want;
  return contrastOf(BLACK, ground) >= contrastOf(WHITE, ground) ? BLACK : WHITE;
}

/** Draw the card for the look `st`. `models` is the list to show; `assets` the
 *  page's phones ({ phones: {id: {img, meta}} }), drawn when there is room;
 *  `scale` draws it larger (a paid plan's 2160). Returns { canvas, checks, rows }. */
export function drawBuyList(st, models, assets = { phones: {} }, { scale = 1 } = {}) {
  const [W0, H0] = ASPECTS[st.aspect] || ASPECTS["4:5"];
  const c = canvas(W0 * scale, H0 * scale), x = c.getContext("2d");
  x.scale(scale, scale);
  const W = W0, H = H0, u = Math.min(W, H) / 1080, P = pal(st);
  const L = WORDS[st.lang === "es" ? "es" : "en"];
  const head = st.font || "franklin", small = "oswald";
  const checks = [];
  const m = 72 * u, inner = W - 2 * m;
  let rows = (models || []).filter(Boolean).slice(0, MAX_ROWS);
  if (rows.length < 1) checks.push({ id: "rows", ok: false, label: "Add at least one model to the list." });

  // fit a line: the largest size from `size` down to `min` at which it fits `width`
  const fit = (text, face, size, min, width) => {
    let s = size;
    for (; s > min; s -= 2) { x.font = fontCss(face, s); if (x.measureText(text).width <= width) return s; }
    x.font = fontCss(face, min);
    return x.measureText(text).width <= width ? min : 0;
  };
  const line = (text, face, size, min, width, ink, ground, cx, y, big = false, align = "center") => {
    const s = fit(text, face, size, min, width);
    if (!s) { checks.push({ id: "width", ok: false, label: `"${text}" does not fit on the card. Shorten it.` }); return 0; }
    const col = inkFor(ink, ground, big);
    const cr = contrastOf(col, ground);
    checks.push({ id: "contrast", ok: cr >= (big ? 3 : 4.5), label: `"${text}" contrast ${cr.toFixed(1)}:1` });
    x.font = fontCss(face, s); x.fillStyle = col; x.textAlign = align; x.textBaseline = "alphabetic";
    x.fillText(text, align === "left" ? cx : cx, y + s * .82);
    return s;
  };
  const round = (X, Y, w, h, r, fill) => { x.beginPath(); if (x.roundRect) x.roundRect(X, Y, w, h, r); else x.rect(X, Y, w, h); x.fillStyle = fill; x.fill(); };

  // the ground: flat, the look's own
  x.fillStyle = P.ground; x.fillRect(0, 0, W, H);

  let y = m;
  const ks = line(L.kicker, small, 44 * u, 26 * u, inner, P.accent, P.ground, W / 2, y);
  y += ks * 1.15 + 6 * u;
  const ts = line(L.title, head, 150 * u, 64 * u, inner, P.ink, P.ground, W / 2, y, true);
  y += ts * 1.02 + 24 * u;

  // the footer, from the bottom up: the number plate, then the ask, then the lot line
  const number = String(st.number || "").trim();
  const area = areaOf(st);
  const plateH = number ? 118 * u : 0;
  const footTop = H - m - plateH;
  let fy = footTop - (number ? 26 * u : 0);
  const askS = 40 * u, lotS = 40 * u, areaS = 32 * u;
  // the lot, the area, then the ask right over the number it asks you to text
  const footLines = [[L.lot, lotS]];
  if (area) footLines.push([L.area(area.toUpperCase()), areaS]);
  footLines.push([number ? L.ask : L.noNumber, askS]);
  let footH = footLines.reduce((s, [, sz]) => s + sz * 1.3, 0);
  fy -= footH;

  // the middle: the ad's phones in a row (a tall card only) over the list plate.
  // The list comes first: the phones give way before a model is left off, rows
  // grow to their best size, the phones take what is left, and the rest centres.
  const ids = (st.phones || []).filter(id => assets.phones && assets.phones[id]).slice(0, 5);
  const listTop0 = y, listBottom = fy - 24 * u, avail = listBottom - listTop0;
  const rowMin = 40 * u, rowMax = 64 * u, padY = 30 * u, noteS = 30 * u, gapB = 18 * u;
  const lo = rowMin * 1.25, hi = rowMax * 1.45;
  const maxBand = H / W >= 1.6 ? 460 * u : 320 * u;
  let band = H / W >= 1.2 && ids.length ? 180 * u : 0;
  const plateAt = rh => padY * 2 + rh * rows.length + noteS * 1.6;
  const needs = () => plateAt(lo) + (band ? band + gapB : 0);
  while (needs() > avail && (band || rows.length > MIN_ROWS)) { if (band) band = 0; else rows = rows.slice(0, -1); }
  let spare = Math.max(0, avail - needs());
  const toRows = Math.min(spare * (band ? .5 : 1), rows.length * (hi - lo));
  const rowH = lo + toRows / Math.max(1, rows.length); spare -= toRows;
  if (band) { const add = Math.min(spare, maxBand - band); band += add; spare -= add; }
  const top = listTop0 + spare / 2;
  const rowS = Math.min(rowMax, rowH / 1.45);

  if (band) {
    const hs = ids.map(id => heightOf(assets.phones[id].meta.model) || 1), tallest = Math.max(...hs);
    const sizes = ids.map((id, i) => { const im = assets.phones[id].img, h = band * hs[i] / tallest; return [h * im.width / im.height, h]; });
    const gap = 18 * u, total = sizes.reduce((s2, [w]) => s2 + w, 0) + gap * (ids.length - 1);
    const k = total > inner ? inner / total : 1;
    let px = W / 2 - total * k / 2;
    const foot = top + band;
    ids.forEach((id, i) => {
      const [w, h] = sizes[i];
      x.drawImage(assets.phones[id].img, px, foot - h * k, w * k, h * k);
      px += (w + gap) * k;
    });
  }

  const plateTop = top + band + (band ? gapB : 0);
  const plateHgt = plateAt(rowH);
  if (plateTop + plateHgt > listBottom + 1) checks.push({ id: "fit", ok: false, label: "The list does not fit on this size. Take a model off, or pick a taller size." });
  round(m, plateTop, inner, plateHgt, 28 * u, P.plate);
  const tick = inkFor(P.accent !== P.plate ? P.accent : P.plate_ink, P.plate, false);
  rows.forEach((name, i) => {
    const ry = plateTop + padY + i * rowH, cy = ry + rowH / 2;
    // a check mark, drawn, in front of each model
    const r = rowS * .42, cx = m + 40 * u + r;
    x.save(); x.strokeStyle = tick; x.lineWidth = Math.max(3, rowS * .11); x.lineCap = "round"; x.lineJoin = "round";
    x.beginPath(); x.moveTo(cx - r * .7, cy); x.lineTo(cx - r * .15, cy + r * .55); x.lineTo(cx + r * .8, cy - r * .6); x.stroke(); x.restore();
    const tx = cx + r + 24 * u;
    line(name, small, rowS, 28 * u, m + inner - 36 * u - tx, P.plate_ink, P.plate, tx, cy - rowS * .5, false, "left");
    if (i < rows.length - 1) { x.fillStyle = inkFor(P.plate_ink, P.plate, false); x.globalAlpha = .18; x.fillRect(tx, ry + rowH - 1 * u, m + inner - 36 * u - tx, Math.max(1, 2 * u)); x.globalAlpha = 1; }
  });
  line(L.mixed, small, noteS, 22 * u, inner - 72 * u, P.plate_ink, P.plate, W / 2, plateTop + padY + rowH * rows.length + noteS * .3);

  for (const [t, sz] of footLines) { const s = line(t, small, sz, 22 * u, inner, P.ink, P.ground, W / 2, fy); fy += (s || sz) * 1.3; }
  if (number) {
    round(m, H - m - plateH, inner, plateH, 26 * u, P.accent);
    line(number, st.number_font && st.number_font !== "same" ? st.number_font : head, 84 * u, 40 * u, inner - 60 * u, P.plate_ink, P.accent, W / 2, H - m - plateH + (plateH - 84 * u) / 2, true);
  }
  return { canvas: c, checks, rows, ok: checks.every(k => k.ok) };
}
