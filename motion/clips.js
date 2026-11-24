/* THE MOVING GROUNDS (DESIGN-LAW 175; the owner, 2026-11-24: backgrounds that move, "cityscapes,
   devices, cars", made cost-effectively, as a library beside the free photographs).

   Each is a square clip, drawn first as a still (Seedream v4 on fal, 3 cents) and animated by MiniMax
   Hailuo 02 (Standard, 27 cents; the aerial on Pro, 48 cents) with the same picture as its first and
   last frame, then faded from its last 0.75 s into its opening so it loops without a jump. Of the test
   batch's fifteen these six were kept: four of five drawn scenes, and one of five library photographs
   (the model mangles a wide photograph's small things: people, traffic, towers); the aerial on Pro.
   scripts/build_clip_grounds.sh makes the files in motion/clips/ from the loops.

   The full ad draws a clip as it draws a photograph (fullad.js _photoGround): a ground_photo whose src
   is the clip's first frame, with clip naming the clip. The first frame is the still every still-only
   path draws (the gallery, the audit, the plan, the pre-flight, a photo download); the preview plays
   the clip under the same grade and overlay; the MP4 export seeks a clip of its own to each frame's
   moment (a seek lands on its exact frame, about 5 ms each: measured in Chrome, 2026-11-24). The
   readability checks read the clip's sheet, twelve moments across it, so the words read on every
   moment and not only on the first. */

export const CLIP_FPS = 24, CLIP_FRAMES = 125, CLIP_SECS = CLIP_FRAMES / CLIP_FPS;
/** The sheet: every 10th frame (0, 10 ... 110), 256 px, four across and three down. */
export const SHEET = { cols: 4, rows: 3, tile: 256, every: 10 };
/** What a line reads on the sheet is divided by this before it counts. Read on the sheet, a small bright speck
 *  (the neon street's lights under a call to action) is softer than on the clip's own frame: on the same twelve
 *  moments the sheet read 5.50:1 where the frame read 4.40:1, and 384 px tiles read 5.33:1 (2026-11-24, five
 *  lines on four clips), so the sheet stays small and is held to its measured gap instead. */
export const SHEET_KIND = 1.25;

/* What each shows and where it may stand, tagged as spec/ground-tags.json tags a photograph:
   L, hue and C measured as scripts/build_full_grounds.mjs measures one (L here is the clip's brightest
   moment, from its sheet: the gold bars' flare runs .29 to .49); shows "scene" goes with any goods,
   "product" only with its own; lines: the GROUND_LINE_CAT categories it suits (none: every line),
   not: those it never stands behind; where: the metro it can be told to be (a seed draws it only for
   an ad there); byHand: never drawn by a seed, only picked in the maker's Background panel. */
export const CLIPS = {
  clip_neon_street: { label: "Neon street at night", L: .057, hue: 276, C: .135, w: 768, shows: "scene", not: ["cars"] },   // generic cars, but cars: never behind a car ad
  clip_circuit: { label: "Glowing circuit board", L: .091, hue: 252, C: .117, w: 768, shows: "scene", lines: ["phones", "gaming", "audio", "computers", "wearables", "cameras"] },
  clip_city_gold: { label: "City at golden hour", L: .306, hue: 62, C: .105, w: 768, shows: "scene", where: "los-angeles" },   // drawn, no landmark, but palm-lined: it reads as Los Angeles
  clip_city_aerial: { label: "Los Angeles from the air", L: .297, hue: 247, C: .153, w: 1080, shows: "scene", where: "los-angeles" },   // assets/bg-free/geo-los-angeles-6.jpg, on Pro
  clip_gold_bars: { label: "Gold bars", L: .492, hue: 80, C: .104, w: 768, shows: "product", lines: ["gold"] },   // assets/bg-free/gold-6.jpg
  // a drawn phone of no model you can name: a photograph of goods stands behind an ad only when they are its own (rule 161)
  clip_phone_light: { label: "Light across a phone", L: .205, hue: null, C: 0, w: 768, shows: "product", lines: ["phones"], byHand: true },
};
export const CLIP_IDS = Object.keys(CLIPS);
/** How often a seed draws a clip where one fits (its line, its place, light words, and a pair of the clip's family:
 *  rule 139), on a stream of its own. Few seeds fit: at .12, 1.7% of iPhone ads in Long Beach stood on a clip, which
 *  New look would almost never show; at .3, 6.0% (clip_grounds_check part 1, 2026-11-24). */
export const CLIP_SHARE = .3;

/** The ground_photo src of a clip: its first frame, from the site's root (as the photographs' are). */
export const clipStill = id => "motion/clips/" + id + ".webp";
/** The clip a ground_photo plays, or null. */
export const clipOf = gp => (gp && CLIPS[gp.clip] ? gp.clip : null);
/** Where a moment of the ad is in its clip (the clip loops). */
export const clipTime = t => ((t % CLIP_SECS) + CLIP_SECS) % CLIP_SECS;
const fileUrl = (id, ext) => new URL("./clips/" + id + ext, import.meta.url).href;

/** The clips a seed may draw for a line's category and a metro (byHand ones never). */
export function clipsFor(cat, place) {
  return CLIP_IDS.filter(id => {
    const c = CLIPS[id];
    return !c.byHand && (!c.lines || c.lines.includes(cat)) && !(c.not || []).includes(cat) && (!c.where || c.where === place);
  });
}

// ------------------------------------------------------------ the sheets

const SHEETS = new Map();
/** Load a clip's sheet once for the page (a promise of the decoded picture). */
export function loadClipSheet(id) {
  if (!CLIPS[id]) return Promise.resolve(null);
  let e = SHEETS.get(id);
  if (!e) {
    const img = new Image(); img.decoding = "async"; e = { img: null };
    e.p = new Promise((res, rej) => { img.onload = () => { e.img = img; res(img); }; img.onerror = () => rej(new Error("The moving background " + id + " did not load.")); });
    e.p.catch(() => {}); img.src = fileUrl(id, "-sheet.webp"); SHEETS.set(id, e);
  }
  return e.p;
}
export const clipSheet = id => (SHEETS.get(id) || {}).img || null;
/** The k-th moment of a sheet: where it sits in the sheet, and the scale from the clip's own pixels. */
export const sheetTile = (id, k) => ({ x: (k % SHEET.cols) * SHEET.tile, y: Math.floor(k / SHEET.cols) * SHEET.tile, k: SHEET.tile / CLIPS[id].w });

// ------------------------------------------------------------ the player

/** A clip as a picture to draw from. live: kept in the page, playing (the preview); otherwise kept out
 *  of it and moved by seek() alone (an export). */
export class ClipPlayer {
  constructor(id, { live = false } = {}) {
    const v = document.createElement("video");
    v.muted = true; v.defaultMuted = true; v.playsInline = true; v.loop = true; v.preload = "auto";
    v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("aria-hidden", "true");
    if (live) {
      // in the page and on screen, if only a pixel: a browser may pause a muted video it cannot see
      v.style.cssText = "position:fixed;left:0;top:0;width:2px;height:2px;opacity:0;pointer-events:none;z-index:-1";
      document.body.appendChild(v);
    }
    v.src = fileUrl(id, ".mp4");
    Object.assign(this, { id, v, live, noPlay: false });
  }
  /** It has a frame to draw. */
  get ready() { return this.v.readyState >= 2; }
  /** Resolves once it can draw (rejects if it will not load). */
  load(timeout = 20000) {
    if (this.ready) return Promise.resolve(this);
    return new Promise((res, rej) => {
      const v = this.v, done = ok => { clearTimeout(tm); v.removeEventListener("loadeddata", on); v.removeEventListener("error", off); ok ? res(this) : rej(v.error || new Error("The moving background " + this.id + " did not load.")); };
      const on = () => done(true), off = () => done(false), tm = setTimeout(() => done(this.ready), timeout);
      v.addEventListener("loadeddata", on); v.addEventListener("error", off);
    });
  }
  /** To the frame at clip time t, exactly (an export, a photo): resolves when that frame is up. */
  seek(t) {
    const v = this.v, f = Math.min(CLIP_FRAMES - 1, Math.max(0, Math.floor(clipTime(t) * CLIP_FPS + 1e-6))), at = (f + .5) / CLIP_FPS;
    if (this.frame === f && !v.seeking) return Promise.resolve();
    this.frame = f;
    return new Promise(res => {
      const done = () => { clearTimeout(tm); v.removeEventListener("seeked", done); res(); };
      const tm = setTimeout(done, 3000);   // a seek that never answers keeps the frame before rather than stopping the export
      v.addEventListener("seeked", done); v.currentTime = at;
    });
  }
  /** The preview: playing near clip time t while the ad plays, on its frame while it is paused. */
  follow(t, playing) {
    const v = this.v; t = clipTime(t);
    if (!this.ready && v.readyState === 0) return;
    if (!playing || this.noPlay) {
      if (!v.paused) v.pause();
      if (!v.seeking && Math.abs(v.currentTime - t) > (playing ? 1.5 : .5) / CLIP_FPS) v.currentTime = t;
      return;
    }
    if (v.paused) {
      v.currentTime = t;
      v.play().catch(() => { this.noPlay = true; });   // a browser that will not play it: stepped frame by frame instead
      return;
    }
    let d = v.currentTime - t; if (d > CLIP_SECS / 2) d -= CLIP_SECS; if (d < -CLIP_SECS / 2) d += CLIP_SECS;
    if (Math.abs(d) > .15 && !v.seeking) v.currentTime = t;
  }
  pause() { if (!this.v.paused) this.v.pause(); }
  dispose() { const v = this.v; v.pause(); v.removeAttribute("src"); v.load(); v.remove(); }
}
