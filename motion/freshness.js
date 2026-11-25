/* THE FRESHNESS MEMORY (DESIGN-LAW 182; the owner, 2026-11-24: "I need to keep this fresh updating good
   arrangements and assortment of products that don't always look the same", "there's a threshold and
   there's an amount that's OK but too similar", "riffing off of a good design doesn't hurt it always
   helps but then if we keep doing that same thing, it becomes a repetitive cycle"; and of the plan
   that followed, "Build it").

   The studio remembers what a shop downloaded (the last KEEP downloads of the last DAYS days, in this
   browser). New look moves the seed on as it always did, and passes over a look that would repeat a post:
     lookalike  TOO or more of its fingerprint shared with any post remembered: a viewer scrolling past
                takes the two for one ad (set by eye on scripts/freshness_sim.mjs's closest pairs)
     picture    its picture within TWIN of a post's (each shrunk to 24x24): two light grounds read as one
                ad at a glance though they share little else (bone and purple beside white and pink).
                Only the looks the other rules put first are drawn to read it (PICTURE_TRIES at most)
     colours    the colour pair of one of the last PAIRS posts: the same scheme again reads as a series
     layout     the layout of one of the last LAYOUTS posts (the arrangement, the product's side, the
                alignment, the order of the blocks): the same template in other paint, the repeat that
                came first in the test
     goods      the same products as the shop's last post of the line
     riff       a look sharing RIFF or more with one of the last RIFF_EVERY - 1 posts, when one of those
                was a riff already: a riff now and then, never two in a row, one in five at most
   A window is never longer than the line's own variety allows: half the options the line draws over
   the looks New look reads ahead (gold's eight pairs keep four posts apart; one product, or a pair or a
   face picked by hand, keeps no window on it). When no look read ahead keeps every rule, the one that
   breaks the fewest is taken, the gravest rule counted first, so every post is still a designed ad.

   Shared by full-ad-studio.js (New look, Download, the preview's note) and scripts/freshness_sim.mjs
   (the test that set the numbers, and its --guard replay of a shop posting with this memory). */

// what a viewer notices, weighted by how much of the picture it decides (sums to 1)
export const WEIGHTS = {
  pair: .22, ground: .12, groundKind: .06,                                   // colour and ground: seen first
  arrangement: .08, side: .04, align: .04, order: .04,                       // the composition
  face: .12, treatment: .06,                                                 // the type
  sticker: .04, number: .03, cta: .03, plates: .02,                          // the details
  products: .06, points: .02, claim: .02,                                    // the goods and the words
};
/* calibrated by eye on the closest pairs drawn, 2026-11-24 (.render/freshness-calibration.jpg): pairs sharing 63-69% of
   their fingerprint read as one ad, and so did pairs 0.068-0.08 apart in the picture even sharing only 40% (both lavender
   and purple; both red). On the iPhone and gold lines every such pair shared its colour pair; on cars two light grounds did
   not (bone and purple, white and pink), so the picture is read, never stood in for by the pair. */
export const TOO = .5, RIFF = .35, TWIN = .085;   // structure shares; picture distance (mean OKLab ΔE at 24x24)
// the memory: two weeks, a viewer's (the test's longer window); KEEP holds two weeks at fourteen posts a day
export const DAYS = 14, KEEP = 200, PAIRS = 8, LAYOUTS = 10, RIFF_EVERY = 5;
// how many looks New look reads ahead (0.2 ms each in the studio: eighty show a line's every pair, so its windows
// hold still from one press to the next), and how many of the first it draws to read their pictures; the rules,
// the gravest first (a twin at a glance is found by drawing, after the rank: it is passed over for the next in rank)
export const AHEAD = 80, PICTURE_TRIES = 4, RULES = ["lookalike", "colours", "layout", "goods", "riff"];
const STORE = "pgfx_fresh_v1", DAY = 864e5;

/** A ground's kind where the families (motion/full-families.js) do not name it. */
export const kindOf = bg => /^pair_/.test(bg) ? "gradient" : /^pat_/.test(bg) ? "pattern" : /^shp_/.test(bg) ? "shapes" : bg === "photo" ? "photo" : /^clip|^mv_/.test(bg) ? "motion" : ["aurora", "drift", "sky_gradient", "marble_soft", "glow_orbs"].includes(bg) ? "scene" : "house";

/** What a viewer reads in a full ad, from the style the engine drew (fullStyle's own st): its colours and ground,
 *  its composition, its type, its details, its goods and words. familyOf: motion/full-families.js FAMILY_OF. */
export function fingerprint(st, familyOf = {}) {
  const bg = String(st.background || ""), photo = bg === "photo" && st.ground_photo && st.ground_photo.src;
  const pts = Array.isArray(st.points) ? st.points.join(", ") : String(st.points || "");
  return {
    line: st.subject || "iphone", seed: st.seed | 0,
    pair: st.full_colour || "", ground: photo ? "photo:" + String(st.ground_photo.src).split("/").pop() + (st.full_treat ? ":" + st.full_treat : "") : bg, groundKind: familyOf[bg] || kindOf(bg),
    arrangement: st.arrangement || "", side: st.full_side ?? null, align: st.full_align ?? null, order: st.full_order != null ? JSON.stringify(st.full_order) : null, pose: st.pose || "",
    face: st.full_pair ? st.type_pair || "" : "house", treatment: st.text_fx || "",
    sticker: st.sticker_shape || "", number: st.number_style || "", cta: st.cta_mark || "", plates: st.plate_fill || "",
    products: (st.phones || []).map(String).filter(id => id && id !== "none"), points: pts, claim: st.feed_claim || "", headline: st.headline || "",
  };
}

export const layoutOf = f => [f.arrangement, f.side, f.align, f.order].join("|");
const goodsOf = f => [...(f.products || [])].sort().join(",");
/** One design: the same seed of the same line in the same colours, layout and face (another size of it, or its words
 *  changed, is that design again). */
export const sameDesign = (a, b) => a.line === b.line && a.seed === b.seed && a.pair === b.pair && a.face === b.face && layoutOf(a) === layoutOf(b);

/** The weighted share of the fingerprint two ads share: 0 nothing, 1 everything. */
export function structure(a, b) {
  const W = WEIGHTS, same = k => (a[k] != null && a[k] === b[k]) ? W[k] : 0;
  const A = new Set(a.products || []), B = new Set(b.products || []), inter = [...A].filter(x => B.has(x)).length, uni = new Set([...A, ...B]).size;
  return same("pair") + same("ground") + same("groundKind") + same("arrangement") + same("side") + same("align") + same("order")
    + same("face") + same("treatment") + same("sticker") + same("number") + same("cta") + same("plates")
    + (uni ? W.products * inter / uni : W.products) + same("points") + same("claim");
}
/** How far apart two ads look at a glance: each shrunk to 24x24 (lab: OKLab, three numbers a pixel), the mean distance. */
export function picture(a, b) { let t = 0; for (let i = 0; i < a.lab.length; i += 3) t += Math.hypot(a.lab[i] - b.lab[i], a.lab[i + 1] - b.lab[i + 1], a.lab[i + 2] - b.lab[i + 2]); return t / (a.lab.length / 3); }
export const tooSimilar = (s, v) => s >= TOO || v < TWIN;

/** An ad's picture as the test reads it: the frame at 540 on its long side, then 24x24, in OKLab (three numbers a pixel).
 *  In a browser only (a canvas). The test drew its ads at 540, so a larger frame is brought to 540 first. */
export function pictureOf(frame) {
  const mk = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
  let src = frame;
  const k = 540 / Math.max(frame.width, frame.height);
  if (k < 1) { const m = mk(Math.round(frame.width * k), Math.round(frame.height * k)), x = m.getContext("2d"); x.imageSmoothingQuality = "high"; x.drawImage(frame, 0, 0, m.width, m.height); src = m; }
  const t = mk(24, 24), x = t.getContext("2d"); x.imageSmoothingQuality = "high"; x.drawImage(src, 0, 0, 24, 24);
  return labOf(x.getImageData(0, 0, 24, 24).data);
}
/** RGBA bytes as OKLab, three numbers a pixel. */
export function labOf(px) {
  const lin = v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }, lab = [];
  for (let i = 0; i < px.length; i += 4) {
    const r = lin(px[i]), g = lin(px[i + 1]), b = lin(px[i + 2]);
    const l = Math.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b), m = Math.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b), s = Math.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b);
    lab.push(+(.2104542553 * l + .793617785 * m - .0040720468 * s).toFixed(4), +(1.9779984951 * l - 2.428592205 * m + .4505937099 * s).toFixed(4), +(.0259040371 * l + .7827717662 * m - .808675766 * s).toFixed(4));
  }
  return lab;
}
// kept as a byte a number (L over 0..1, a and b over -0.5..0.5: steps of 0.004, against a line at 0.085), in base64
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
export function packLab(lab) {
  const q = lab.map((v, i) => Math.max(0, Math.min(255, Math.round((i % 3 ? v + .5 : v) * 255)))); let s = "";
  for (let i = 0; i < q.length; i += 3) { const n = (q[i] << 16) | ((q[i + 1] || 0) << 8) | (q[i + 2] || 0); s += B64[n >> 18 & 63] + B64[n >> 12 & 63] + B64[n >> 6 & 63] + B64[n & 63]; }
  return s;
}
export function unpackLab(s) {
  const out = [];
  for (let i = 0; i < s.length; i += 4) { const n = (B64.indexOf(s[i]) << 18) | (B64.indexOf(s[i + 1]) << 12) | (B64.indexOf(s[i + 2]) << 6) | B64.indexOf(s[i + 3]); out.push(n >> 16 & 255, n >> 8 & 255, n & 255); }
  return out.map((v, i) => i % 3 ? v / 255 - .5 : v / 255);
}
const labOfPost = p => p.lab || (p.pic ? (p.lab = unpackLab(p.pic)) : null);
/** The post (the latest) whose picture is within TWIN of this one's: a look-alike seen at a glance; null when none is. */
export function twinOf(lab, posts) {
  for (let i = posts.length - 1; i >= 0; i--) { const L = labOfPost(posts[i]); if (L && L.length === lab.length && picture({ lab }, { lab: L }) < TWIN) return posts[i]; }
  return null;
}

/** How long each window can be for the looks a line draws (those New look reads ahead): half the options among
 *  them, at most the house's own; and whether its goods vary at all. */
export function windowsFor(looks) {
  const n = k => new Set(looks.map(k)).size;
  return { pairs: Math.min(PAIRS, Math.floor(n(f => f.pair) / 2)), layouts: Math.min(LAYOUTS, Math.floor(n(layoutOf) / 2)), goods: n(goodsOf) > 1 };
}
/** A post that riffs on one of the few before it (posts: oldest first). */
export const isRiff = (f, posts) => posts.slice(-(RIFF_EVERY - 1)).some(p => structure(f, p) >= RIFF);

/** The rules a look would break after the posts remembered (oldest first), the gravest first: [] when it is fresh. */
export function breaks(f, posts, win) {
  const out = [], last = k => k > 0 ? posts.slice(-k) : [];
  if (posts.some(p => structure(f, p) >= TOO)) out.push("lookalike");
  if (last(win.pairs).some(p => p.pair === f.pair)) out.push("colours");
  if (last(win.layouts).some(p => layoutOf(p) === layoutOf(f))) out.push("layout");
  if (win.goods) { const prev = posts.filter(p => p.line === f.line).pop(); if (prev && goodsOf(prev) === goodsOf(f)) out.push("goods"); }
  const near = posts.slice(-(RIFF_EVERY - 1));
  if (near.some(p => p.riff) && near.some(p => structure(f, p) >= RIFF)) out.push("riff");
  return out;
}

/** The looks read ahead in the order New look would take them: those that break no rule first, in the order it reaches
 *  them; then the rest by the rules they break, the gravest rule deciding first. [{ i, breaks }]: a look's place among
 *  looks and the rules it breaks ([] when fresh). */
export function rankFresh(looks, posts, win = windowsFor(looks)) {
  const key = b => RULES.map(r => b.includes(r) ? "1" : "0").join("");   // compared as text: the gravest rule decides first
  return looks.map((f, i) => { const b = breaks(f, posts, win); return { i, breaks: b, k: key(b) }; })
    .sort((a, b) => a.k < b.k ? -1 : a.k > b.k ? 1 : a.i - b.i).map(({ i, breaks }) => ({ i, breaks }));
}
/** The look New look shows next, its picture unread (the first of rankFresh): { i, breaks, win }. The studio reads the
 *  pictures of the first PICTURE_TRIES and passes over a twin of a post (full-ad-studio.js nextFresh). */
export function pickFresh(looks, posts, win = windowsFor(looks)) {
  return { ...(rankFresh(looks, posts, win)[0] || { i: -1, breaks: [] }), win };
}

/* ---------- the memory, in this browser ---------- */

const store = () => { try { return globalThis.localStorage || null; } catch (e) { return null; } };
/** The posts remembered (oldest first), those of the last DAYS days, at most KEEP. */
export function recall(now = Date.now(), S = store()) {
  try {
    const j = S ? JSON.parse(S.getItem(STORE) || "null") : null;
    return (j && Array.isArray(j.posts) ? j.posts : []).filter(p => p && p.line && now - (+p.at || 0) <= DAYS * DAY && +p.at <= now + DAY).slice(-KEEP);
  } catch (e) { return []; }
}
/** A download remembered as a post: the same design downloaded again (another size, the next day) is one post, at its
 *  latest; riff says whether it riffed on the posts before it. Returns the posts as kept. */
export function remember(f, lab = null, now = Date.now(), S = store()) {
  const posts = recall(now, S).filter(p => !sameDesign(p, f));
  const post = { ...f, at: now, riff: isRiff(f, posts), ...(lab && lab.length ? { pic: packLab(lab) } : {}) };
  posts.push(post);
  try { if (S) S.setItem(STORE, JSON.stringify({ v: 1, posts: posts.slice(-KEEP) })); } catch (e) { /* private mode: nothing kept */ }
  return posts.slice(-KEEP);
}
/** What the posts remembered say of a look (its picture too, when given): the same design posted ("posted"), one too
 *  close to it in its parts or at a glance ("close"), or nothing. */
export function postedLike(f, posts, lab = null) {
  const same = posts.filter(p => sameDesign(p, f)).pop();
  if (same) return { kind: "posted", at: same.at };
  const near = posts.filter(p => structure(f, p) >= TOO).pop() || (lab ? twinOf(lab, posts) : null);
  return near ? { kind: "close", at: near.at } : null;
}
