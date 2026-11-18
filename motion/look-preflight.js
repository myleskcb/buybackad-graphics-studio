/* THE PRE-FLIGHT FOR A LOOK (2026-11-18): an Any look checks itself before it goes out, as the full
   ad does (DESIGN-LAW 138, fullad.js fullPreflight).

   The ad census of 2026-11-18 read every ad the site offers: the full ad had its pre-flight, and the
   246 looks of the maker's Any look gallery had none. This is theirs. It reads the picture as it is
   delivered (the look settled, every block landed, the phones at rest: Ad.stillAt's moment) and
   takes nothing on the layout's word. Each part's ink is found the way the attention audit finds the
   headline's (audit.js): the look drawn again without that part, and the pixels that change are
   the part, with its shadow, outline or plate.

   On the picture:
     edge     the letters of the headline, the line under it, the number and its call to action,
              and the plates that carry them (the number's pill, the pulsing badge, the selling
              points' chips), stay 1.6% of the short side from the frame's edge (17px of 1080). A
              glow round letters may reach it; the phones, a ticker and caution tape may run off by
              design. None of those is counted.
     reads    each line's letters against what is right behind them: 3:1 for the headline and the
              number, 4.5:1 for the call to action and the line under the headline (the small
              lines). Read against what rings the letters just past their soft edge, and against the
              ground under them on the picture drawn without them; the better of the two (readsOn).
              A sticker's letters read against their own ring; letters painted gold, chrome or neon
              are not one colour and are not measured.
     feed     the headline and the number are still letters on a feed's small preview (the picture
              at a quarter of its size): 20px and 16px tall at least
     cta      the number says what to do with it (its label, or the pulsing badge)
   On the words:
     words    no phrase from the house list (spec/banned-words.json, by motion/banned-words.js):
              old wording, claims that need proof, pressure, a price on the picture
     number   a phone number, and one that reads as one

   Each finding is { code, level, say }: "fix" stops a download until the customer chooses to go
   back or to download it anyway (the page's preflightGate); "note" is said under the preview. say
   is in the customer's words (rule 113). lookOk leaves out what the customer typed (the words, the
   number): it is what the gallery and New look go by when they pass over a look. */
import { canvas, pointsOf } from "./engine.js";
import { bannedIn } from "./banned-words.js";

// diff: how far a pixel must change (R+G+B) to be the part's, its shadow, outline and plate included;
// solid: to be the part itself and not the faint reach of its shadow (fullPreflight's 96)
const PF = { edge: .016, small: 4.5, large: 3, thumbHead: 20, thumbNum: 16, diff: 40, solid: 96 };
const LOOK_CODES = new Set(["edge", "reads", "feed", "cta"]);

const lin = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
const ratio = (a, b) => (Math.max(a, b) + .05) / (Math.min(a, b) + .05);

/** The moment a look is delivered at: settled, before any ending (Ad.stillAt's). */
export const settledAt = ad => ad.tOutro != null ? ad.tOutro - .05 : ad.st.duration - .1;

/** The look drawn at t as Ad.stillAt draws it, with one part left out ("headline", "number" with its
 *  label, "label" alone, "tag", "points"), into ctx. Whatever was set aside is put back. */
function drawWithout(ad, ctx, t, off) {
  const keep = { tag: ad.tag, perks: ad.perks, pos: ad.pos }, own = [];
  const mute = name => { own.push([name, Object.prototype.hasOwnProperty.call(ad, name), ad[name]]); ad[name] = () => {}; };
  if (off === "headline") mute("_headline");
  if (off === "number") mute("_number");
  if (off === "label" && ad.pos) ad.pos = { ...ad.pos, label: null };
  if (off === "tag") ad.tag = null;
  if (off === "points") ad.perks = null;
  const was = ad.restPhones; ad.still = null; ad.restPhones = true;
  try { ad.frame(ctx, t, { subsFly: 1, subsMove: 1 }); }
  finally {
    ad.restPhones = was; ad.still = null; ad.tag = keep.tag; ad.perks = keep.perks; ad.pos = keep.pos;
    for (const [name, had, fn] of own) { if (had) ad[name] = fn; else delete ad[name]; }
  }
}

/** The look as delivered, for a photo or a check. */
export function lookStill(ad, t = settledAt(ad)) {
  const c = canvas(ad.W, ad.H);
  drawWithout(ad, c.getContext("2d", { willReadFrequently: true }), t, null);
  return c;
}

/** Where one part's ink is: the pixels that change when the look is drawn without it (m), and of
 *  those the ones that change a lot (s: the part itself, not its glow). */
function partMask(full, other, n) {
  const m = new Uint8Array(n), s = new Uint8Array(n); let k = 0, ks = 0;
  for (let i = 0, q = 0; i < n; i++, q += 4) {
    const d = Math.abs(full[q] - other[q]) + Math.abs(full[q + 1] - other[q + 1]) + Math.abs(full[q + 2] - other[q + 2]);
    if (d > PF.diff) { m[i] = 1; k++; if (d > PF.solid) { s[i] = 1; ks++; } }
  }
  return { m, k, s, ks };
}
const NONE = n => ({ m: new Uint8Array(n), k: 0, s: new Uint8Array(n), ks: 0 });
function boxOf(m, W, H) {
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) { const r = y * W; for (let x = 0; x < W; x++) if (m[r + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
  return x1 < 0 ? null : [x0, y0, x1, y1];
}

const Lhex = h => { const s = String(h || "#000000").replace("#", ""), f = s.length === 3 ? s.split("").map(c => c + c).join("") : s.slice(0, 6); return .2126 * lin(parseInt(f.slice(0, 2), 16)) + .7152 * lin(parseInt(f.slice(2, 4), 16)) + .0722 * lin(parseInt(f.slice(4, 6), 16)); };
const inkOn = bg => ratio(Lhex(bg), 1) >= ratio(Lhex(bg), Lhex("#111111")) ? "#ffffff" : "#111111";
// letters painted with a gradient or a light of their own (gold, chrome, a neon tube) are not one
// colour, so they cannot be told from what is behind them by their ink: such a part is not measured
const PAINTED = new Set(["gold", "chrome", "gradient", "foil", "neon", "glow"]);

const lumE = h => { const s = String(h || "#000000").replace("#", ""); return (.2126 * parseInt(s.slice(0, 2), 16) + .7152 * parseInt(s.slice(2, 4), 16) + .0722 * parseInt(s.slice(4, 6), 16)) / 255; };
/** A sticker's letters are ringed in a plate colour of their own (engine.js inkSprite "sticker"): they
 *  read against that ring whatever is behind it, so the ring's colour is what they are read against. */
function stickerReads(p, inks) {
  const ink = inks[0], plate = lumE(ink) < .5 ? "#ffffff" : (ratio(Lhex(p.plate), Lhex(ink)) < 3 ? "#111111" : p.plate);
  return Math.min(...inks.map(c0 => { const ring = ratio(Lhex(c0), Lhex(plate)) < 3 ? inkOn(c0) : plate; return ratio(Lhex(c0), Lhex(ring)); }));
}

/** One line's letters against what is right behind them, read two ways on the delivered picture and
 *  the better kept. Its letters are the pixels the line itself drew (m: they change when the look is
 *  drawn without it) that have one of its inks' lightness; each ink is read on its own letters. On a
 *  plate (m null) the rect is the plate's inside, and every pixel of an ink's lightness there is a
 *  letter: letters the colour of the ground behind the plate do not change when it is taken away.
 *  On the picture: against what immediately rings them, just past their soft edge (the plate, an
 *  outline, a shadow or the ground, whichever is there), its worst quarter (the brightest under light
 *  ink, the darkest under dark). On the picture drawn without the line (bare): against what is under
 *  the letters themselves, its worst tenth, which small letters need, their soft edges being most of
 *  them. The first counts a plate, an outline or a shadow that carries the letters, the second the
 *  ground they stand on; a line passes on either. Returns the ratio, or 99 where there is nothing to
 *  measure (fewer than a dozen letter pixels of any ink). */
function readsOn(px, bare, m, W, H, r, inks, U) {
  const bx0 = Math.max(0, Math.floor(r[0])), by0 = Math.max(0, Math.floor(r[1])), bw = Math.min(W, Math.ceil(r[2])) - bx0, bh = Math.min(H, Math.ceil(r[3])) - by0;
  if (bw < 6 || bh < 6 || !inks.length) return 99;
  const Ls = inks.map(Lhex), n = bw * bh, Lm = new Float32Array(n), Lb = new Float32Array(n), which = new Int8Array(n).fill(-1);
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
    const g = (by0 + y) * W + bx0 + x, q = g * 4, i = y * bw + x;
    const L = .2126 * lin(px[q]) + .7152 * lin(px[q + 1]) + .0722 * lin(px[q + 2]); Lm[i] = L;
    if (bare) Lb[i] = .2126 * lin(bare[q]) + .7152 * lin(bare[q + 1]) + .0722 * lin(bare[q + 2]);
    if (m && !m[g]) continue;
    let best = -1, br = 1.6; for (let k = 0; k < Ls.length; k++) { const c = ratio(L, Ls[k]); if (c < br) { br = c; best = k; } }
    which[i] = best;
  }
  // grows a set by d pixels, across then down
  const grow = (src, d) => {
    const row = new Uint8Array(n), out = new Uint8Array(n);
    for (let y = 0; y < bh; y++) { let run = -1e9; for (let x = 0; x < bw; x++) { if (src[y * bw + x]) run = x; if (x - run <= d) row[y * bw + x] = 1; } run = 1e9; for (let x = bw - 1; x >= 0; x--) { if (src[y * bw + x]) run = x; if (run - x <= d) row[y * bw + x] = 1; } }
    for (let x = 0; x < bw; x++) { let run = -1e9; for (let y = 0; y < bh; y++) { if (row[y * bw + x]) run = y; if (y - run <= d) out[y * bw + x] = 1; } run = 1e9; for (let y = bh - 1; y >= 0; y--) { if (row[y * bw + x]) run = y; if (run - y <= d) out[y * bw + x] = 1; } }
    return out;
  };
  const d = Math.max(2, Math.round(U * .0045)), pick = (a, at) => { a.sort((u, v) => u - v); return a[Math.min(a.length - 1, Math.floor(a.length * at))]; };
  let worst = 99, any = false;
  for (let k = 0; k < Ls.length; k++) {
    const mine = new Uint8Array(n); let cnt = 0; for (let i = 0; i < n; i++) if (which[i] === k) { mine[i] = 1; cnt++; }
    if (cnt < 12) continue;
    any = true;
    const light = Ls[k] >= .18, ring = grow(mine, d), outer = grow(mine, d * 3), band = [], under = [];
    for (let i = 0; i < n; i++) { if (outer[i] && !ring[i] && which[i] < 0) band.push(Lm[i]); if (bare && ring[i]) under.push(Lb[i]); }
    const onPicture = band.length >= 12 ? ratio(Ls[k], pick(band, light ? .75 : .25)) : 0;
    const onBare = under.length >= 12 ? ratio(Ls[k], pick(under, light ? .9 : .1)) : 0;
    worst = Math.min(worst, Math.max(onPicture, onBare) || 99);
  }
  return any ? worst : 99;
}

/** Where each line of words is drawn on the look, with its inks:
 *  [part, rect, inks, how, plated] where how is "" (read on the picture), "painted" (not measured)
 *  or a ratio already known from the paint (a sticker's ring), and plated says the rect is the
 *  inside of the line's own plate. */
function lineRects(ad) {
  const st = ad.st, p = ad.p, hp = ad.pHead, out = [], pos = ad.pos || {};
  const box = st.text_fx === "box", headInk = box ? hp.plate_ink : hp.ink;
  let heads = [headInk];
  if (st.color_mode && st.color_mode !== "mono") heads.push(hp.accent);
  if (box) heads.push(inkOn(hp.plate));
  // a double outline fills a letter that would not stand off its inner ring in black or white, and
  // rings it in the accent: the accent is then the ring, not a letter (engine.js inkSprite)
  if (st.text_fx === "double_outline") { const inner = ratio(Lhex(hp.ground), Lhex(hp.ink)) >= 3 ? hp.ground : inkOn(hp.ink); heads = heads.map(c0 => ratio(Lhex(c0), Lhex(inner)) < 3 ? inkOn(inner) : c0); }
  heads = [...new Set(heads)];
  // a headline on its own plate (a box, a highlighter's band, glass, a cut-out) or on a sign
  const headPlated = ["box", "highlighter", "glass", "cutout"].includes(st.text_fx) || !!ad.board;
  const headHow = PAINTED.has(st.text_fx) ? "painted" : st.text_fx === "sticker" ? stickerReads(hp, heads) : "";
  (ad.lines || []).forEach((L, i) => {
    const x0 = pos.xs ? pos.xs[i] : 0, y0 = (pos.y0 || 0) + i * (ad.lineH || 0);
    out.push(["headline", [x0, y0, x0 + L.inkW, y0 + L.asc], heads, headHow, headPlated]);
  });
  if (ad.num && pos.num) {
    const [nx, ny] = pos.num, c = ad.num.c, h = c.height, style = st.number_style, onPlate = ["pill", "box", "ticket", "tag", "stacked"].includes(style);
    const col = onPlate ? (ratio(Lhex(p.plate_ink), Lhex(p.plate)) >= 3.5 ? p.plate_ink : inkOn(p.plate)) : p.ink;
    const inks = style === "split" ? [col, lumE(p.accent) > .35 ? p.accent : "#ffffff"] : [col];
    const how = style === "sticker" ? stickerReads(p, inks) : ["neon", "chrome", "gold"].includes(style) || (style === "plain" && PAINTED.has(st.text_fx)) ? "painted" : "";
    // on a plate, its inside: clear of the round ends and of the shadow under it
    out.push(["number", onPlate ? [nx + h * .45, ny + h * .14, nx + c.width - h * .45, ny + h * .7] : [nx, ny, nx + c.width, ny + h], inks, how, onPlate]);
  }
  if (ad.num && ad.num.label && pos.label) {
    const Lc = ad.num.label, [lx, ly] = pos.label;
    // the pulsing badge is a plate of the look's hot colour, its words in whichever of black or white reads on it (ctaBadge)
    if (ad.num.cta) { const h = Lc.height, hot = ad.hot || p.accent; out.push(["label", [lx + h * .4, ly + h * .1, lx + Lc.width - h * .4, ly + h * .62], [ratio(Lhex(hot), Lhex("#111111")) >= ratio(Lhex(hot), 1) ? "#111111" : "#ffffff"], "", true]); }
    else out.push(["label", [lx, ly, lx + Lc.width, ly + Lc.height], [p.ink], ad.num.labelRing ? ratio(Lhex(p.ink), Lhex(ad.num.labelRing)) : "", false]);
  }
  if (ad.tag && pos.tag) out.push(["tag", [pos.tag[0], pos.tag[1], pos.tag[0] + ad.tag.width, pos.tag[1] + ad.tag.height], [hp.ink], "", false]);
  return out;
}

/** The words alone: the house list's phrases in each part, and the number as a number. cat: the
 *  goods the ad is about ("phones" for the maker's looks), since some phrases are barred on some only. */
export function lookWords(ad, cat = "phones") {
  const st = ad.st, out = [], say = (code, level, s) => out.push({ code, level, say: s });
  const label = ad.num && ad.num.label ? (ad.num.cta ? st.cta || (st.lang === "es" ? "¡MÁNDANOS TEXTO!" : "TEXT NOW") : st.number_label) : "";
  const parts = [["headline", st.headline], ["line under the headline", ad.tag ? st.tag : ""], ["call to action", label],
    ["selling points", ad.perks ? pointsOf(st).join(", ") : ""], ["sticker", ad.burst ? ad.burst.text : ""], ["stamp", ad.stamp ? st.stamp_text : ""],
    ["opening words", ad.hookLines && st.hook && st.hook !== "none" ? st.hook_text : ""]].filter(p => p[1] && String(p[1]).trim());
  for (const [name, text] of parts) for (const hit of bannedIn(text, cat)) say("words", "note", `In the ${name}: ${hit.say || `"${hit.match}" is not used on our ads.`}`);
  const digits = String(st.number || "").replace(/\D/g, "");
  if (!digits) say("number", "fix", "There is no phone number on the ad.");
  else if (!(digits.length === 10 || (digits.length === 11 && digits[0] === "1") || (String(st.number).trim()[0] === "+" && digits.length >= 8))) say("number", "note", `The phone number has ${digits.length} digits. A US number has 10.`);
  return out;
}

/** The look as delivered, measured. ad: a plain engine Ad (not a full ad: fullPreflight is its).
 *  Returns { ok, lookOk, clean, checks: [{ id, ok, value }], findings: [{ code, level, say }] }. */
export function lookPreflight(ad, { cat = "phones", t = settledAt(ad) } = {}) {
  const W = ad.W, H = ad.H, U = Math.min(W, H), n = W * H, st = ad.st;
  const findings = [], checks = [], say = (code, level, s) => findings.push({ code, level, say: s });
  const c = canvas(W, H), x = c.getContext("2d", { willReadFrequently: true });
  const shot = off => { drawWithout(ad, x, t, off); return x.getImageData(0, 0, W, H).data; };
  const full = shot(null);
  const hasLabel = !!(ad.num && ad.num.label && ad.pos && ad.pos.label);
  const bare = { headline: shot("headline"), number: shot("number") };
  if (hasLabel) bare.label = shot("label");
  if (ad.tag) bare.tag = shot("tag");
  const head = partMask(full, bare.headline, n), numAll = partMask(full, bare.number, n);
  const lab = hasLabel ? partMask(full, bare.label, n) : NONE(n);
  const tag = ad.tag ? partMask(full, bare.tag, n) : NONE(n);
  const pts = ad.perks ? partMask(full, shot("points"), n) : NONE(n);
  const num = NONE(n);
  for (let i = 0; i < n; i++) if (numAll.m[i] && !lab.m[i]) { num.m[i] = 1; num.k++; if (numAll.s[i]) { num.s[i] = 1; num.ks++; } }

  /* edge: where every word and the number is, against the frame. A line's letters (its pixels of
     its inks' lightness) and a plate (the number's pill, the pulsing badge, the selling points'
     chips) count; a glow or a halo round the letters does not, however bright: cut off at the edge
     it loses nothing that is read. */
  const rects = lineRects(ad), inksOf = {}, platedOf = {};
  for (const [part, , inks, , plated] of rects) { inksOf[part] = [...new Set([...(inksOf[part] || []), ...inks])]; platedOf[part] = platedOf[part] || plated; }
  const lettersOf = (part, key) => {
    if (key === "points" || platedOf[key] || !inksOf[key]) return part.s;
    const Ls = inksOf[key].map(Lhex), o = new Uint8Array(n);
    for (let i = 0, q = 0; i < n; i++, q += 4) if (part.s[i]) { const L = .2126 * lin(full[q]) + .7152 * lin(full[q + 1]) + .0722 * lin(full[q + 2]); if (Ls.some(Li => ratio(L, Li) < 1.6)) o[i] = 1; }
    return o;
  };
  const boxes = {}, NAMES = { headline: "The headline", number: "The phone number", label: "The call to action", tag: "The line under the headline", points: "The selling points" };
  let near = U, nearPart = "";
  for (const [key, part] of [["headline", head], ["number", num], ["label", lab], ["tag", tag], ["points", pts]]) {
    const b = part.ks ? boxOf(lettersOf(part, key), W, H) : null; if (!b) continue;
    boxes[key] = b;
    const d = Math.min(b[0], b[1], W - 1 - b[2], H - 1 - b[3]); if (d < near) { near = d; nearPart = key; }
  }
  const edgeOk = near >= U * PF.edge;
  checks.push({ id: "edge", ok: edgeOk, value: `${Math.round(near / U * 1080)}px from the edge${nearPart ? ` (${NAMES[nearPart].toLowerCase()})` : ""}` });
  if (!edgeOk) say("edge", "fix", `${NAMES[nearPart]} runs to the edge of the picture and may be cut off when it is posted. Try New look.`);

  // reads: each line against what is right behind it, on the delivered picture
  const READ = { headline: ["the headline", PF.large], number: ["the phone number", PF.large], label: ["the call to action over the number", PF.small], tag: ["the line under the headline", PF.small] };
  const got = {};
  const masks = { headline: head.m, number: num.m, label: lab.m, tag: tag.m };
  for (const [part, r, inks, how, plated] of rects) {
    if (how === "painted") continue;
    const v = typeof how === "number" ? how : readsOn(full, plated ? null : bare[part], plated ? null : masks[part], W, H, r, inks, U);
    got[part] = Math.min(got[part] ?? 99, v);
  }
  let worst = 99, worstName = "";
  for (const [part, v] of Object.entries(got)) {
    const [name, need] = READ[part];
    if (v < worst) { worst = v; worstName = name; }
    if (v < need) say("reads", v < need * .8 ? "fix" : "note", `${name[0].toUpperCase() + name.slice(1)} is hard to read against what is behind it. Try another colour, or New look.`);
  }
  checks.push({ id: "reads", ok: !findings.some(f => f.code === "reads"), value: worst > 90 ? "every line clear" : `${worst.toFixed(1)}:1 at the least (${worstName})`, read: got });

  // feed: the letters' height on a small preview (the picture at a quarter of its size)
  const k = 270 / U, hPx = Math.round((ad.size || 0) * .72 * k), nPx = Math.round(((ad._lay && ad._lay.nSize) || 0) * H * .72 * k);
  const feedOk = hPx >= PF.thumbHead && nPx >= PF.thumbNum;
  checks.push({ id: "feed", ok: feedOk, value: `headline ${hPx}px and number ${nPx}px tall in a feed preview` });
  if (hPx < PF.thumbHead) say("feed", "note", "The headline is long, so it is set small: it may not read in a feed's small preview. A shorter headline is set larger.");
  if (nPx < PF.thumbNum) say("feed", "note", "The phone number is small in a feed's preview.");

  // cta: the number says what to do with it
  const ctaOk = hasLabel && lab.k > 0;
  checks.push({ id: "cta", ok: ctaOk, value: ctaOk ? `"${ad.num.cta ? st.cta || "TEXT NOW" : st.number_label}" over the number` : "none drawn" });
  if (!ctaOk) say("cta", "note", "The number does not say what to do with it. A short call over it, like CALL OR TEXT, gets more replies.");

  // the words
  const words = lookWords(ad, cat);
  checks.push({ id: "words", ok: !words.length, value: words.length ? words[0].say : "nothing from the list of words we leave out" });
  findings.push(...words);
  const seen = new Set(), uniq = findings.filter(f => !seen.has(f.say) && seen.add(f.say));
  return { ok: !uniq.some(f => f.level === "fix"), lookOk: !uniq.some(f => f.level === "fix" && LOOK_CODES.has(f.code)), clean: !uniq.length, checks, findings: uniq, boxes };
}
