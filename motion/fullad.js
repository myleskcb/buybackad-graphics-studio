// THE FULL AD: every element of a buying ad on one picture, in one house style.
//
// It began as the iPhones LA feed stills (tools/feed-stills, 2026-11-03): the owner, looking at
// the library's iPhone cards beside the videos, asked for "the text as large and legible as
// possible", "all elements.. locations.. selling points.. hero.. sub title... cta.. watermark..
// ideally device models we buy", "a bold claim" at the top, and one house style ("further unify
// all themes", "drop old ones that look tacky cheesy or ununified"). On 2026-11-11 the owner
// asked for the same ad on the site for customers ("I still don't see picture ads that look in
// line with the video ads"), and for every ad to "maximize elements.. sizing.. spacing..
// positioning" with "eye catchy elements". So the class lives here, beside the engine, and the
// video maker (motion/app.js) and the feed-stills tool both draw with it.
//
// A subclass of the engine's Ad, the way the social studio's CampaignAd is (social/media.js): it
// reuses the engine's painter, placement and collision passes and changes only what the maker
// keeps small or leaves out.
import { Ad, inkSprite, splitLines, trim, canvas, lum, prog, outBack, rng, clamp, contrastOf, fontCss, applyCase, labelFont, burstFontFor,
  headlineLines, numberSprite, perksSprite, pointsOf, randomize, harmonise, formatNumber } from "./engine.js";
import { FONTS, FINE_FACES, PALETTES, DEFAULT_STYLE } from "./catalog.js";
import { drawChevrons } from "./decor.js";
import { placeAccents, timeAccents } from "./accents.js";
import { HOUSE_COLOURS, LINES } from "./house-colours.js";

// Proportions of the frame's width. 1080 x .052 = 56px, x .044 = 48px, x .032 = 35px.
// edge: nothing nearer the frame's edge than 38px; gap: no two stacked blocks nearer than 22px.
// claim: the bold claim's badge at the top (its letters 41px, down to 32px to fit); foot: the
// locations and the website under the number (35px).
export const FEED = { tag: .052, label: .044, site: .042, foot: .032, claim: .038, claimMin: .03, edge: .035, gap: .02 };
export const LEGIBLE = new Set(["grotesk", "geometric", "condensed", "wide"]);
export const REQUIRED = ["words", "headline", "number", "contrast"];

/** A row of plain type with colour emoji (the engine's ink painter draws an outline and a shadow
 *  round every glyph, which smears an emoji): the face's own weight, an emoji font behind it. */
function plainRow(text, px, color, family, weight) {
  const m = canvas(4, 4).getContext("2d"), font = `${weight} ${px}px "${family}", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
  m.font = font;
  const w = Math.ceil(m.measureText(text).width) + 4, h = Math.ceil(px * 1.3);
  const c = canvas(w, h), x = c.getContext("2d");
  x.font = font; x.fillStyle = color; x.textBaseline = "middle"; x.fillText(text, 2, h / 2);
  return c;
}

export class FeedAd extends Ad {
  constructor(style, assets, width, height) {
    // laid out at this size, never from a plan made by the plain engine: the plan knows nothing
    // of what this class changes, and a photo drawn from it put the phones somewhere else
    super(style, assets, width, height, { plan: false });
    const st = this.st, W = this.W;
    const font = LEGIBLE.has((FONTS[st.font] || [])[3]) ? st.font : "franklin";
    const ink = this.pHead.ink, fx = lum(ink) < .5 ? "flat" : "shadow";
    const block = (text, scale, keepCase = false) => {
      if (!text) return null;
      const size = W * scale, maxWidth = W * .86, up = keepCase ? text : text.toUpperCase().replace(/\bIPHONE/g, "iPHONE").replace(/\bIPAD/g, "iPAD");
      const paint = line => trim(inkSprite(line, [...line].map(() => ink), font, size, .02, fx, this.pHead).c);
      // the fewest rows that fit at full size: one; two, broken at a separator ("A • B • C");
      // then one item per row, the way the library's checklists stack. A line without
      // separators breaks between words; a line with them never breaks inside an item.
      const items = up.split(/ (?:•|→) /), arrow = up.includes("→");
      const join = (a, b) => items.slice(a, b).join(arrow ? " → " : " • ") + (arrow && b < items.length ? " →" : "");
      const tries = [[up]];
      if (items.length === 1) tries.push(splitLines(up, 2));
      for (let i = 1; i < items.length; i++) tries.push([join(0, i), join(i, items.length)]);
      if (items.length === 3) tries.push(items.map((t, i) => t + (arrow && i < 2 ? " →" : "")));
      let rows = null;
      for (const n of [1, 2, 3]) {
        const fits = tries.filter(t => t.length === n).map(t => t.map(paint)).filter(r => Math.max(...r.map(x => x.width)) <= maxWidth);
        if (fits.length) { rows = fits.sort((a, b) => Math.max(...a.map(x => x.width)) - Math.max(...b.map(x => x.width)))[0]; break; }
      }
      if (!rows) return null;                                                // never shrunk to fit: dropped and reported
      if (rows.length === 1) return rows[0];
      const gap = Math.ceil(size * .28), c = canvas(Math.max(...rows.map(r => r.width)), rows.reduce((h, r) => h + r.height, 0) + gap * (rows.length - 1));
      let y = 0;
      for (const r of rows) { c.getContext("2d").drawImage(r, (c.width - r.width) / 2, y); y += r.height + gap; }
      return c;
    };
    this.feedPx = { tag: W * (st.feed_tag || FEED.tag), label: W * (st.feed_label || FEED.label) };
    this.tag = block(st.feed_line, st.feed_tag || FEED.tag);
    this.st.tag = this.tag ? st.feed_line : "";
    this.num = { ...this.num, label: block(st.number_label, st.feed_label || FEED.label) };
    this.pos = this._place(this.lines, this.lineH, this.blockH, this.tag, this.num, this.margin, this.size);
    this._numberBelowPhones();
    this._headlineOffPhones();
    this._shrinkClear(.005);
    // a clear step between the headline and the service line (the engine leaves 14% of the headline)
    if (this.tag && this.pos.tag) { const d = W * .012; this.pos.tag = [this.pos.tag[0], this.pos.tag[1] + d]; this.pos.outer = [...this.pos.outer.slice(0, 3), this.pos.outer[3] + d]; }
    // the website under the number (owner, 2026-11-03: "show the real domain ... visit our
    // website at www.iPhones.LA, that way they know it's a URL"); the number and its call to
    // action rise to make room for it inside the frame's margin
    // the footer: where (the towns, after a pin) over the website, both in the label's face
    const fam = (FONTS[font] || FONTS.franklin)[0], fw = (FONTS[font] || FONTS.franklin)[1];   // the weight that is loaded
    const rows = [st.feed_where, st.feed_site].filter(Boolean).map(t => plainRow(t, Math.round(W * FEED.foot), ink, fam, fw));
    this.site = null;
    if (rows.length && rows.every(r => r.width <= W * .9)) {
      const g = Math.round(W * .008), c = canvas(Math.max(...rows.map(r => r.width)), rows.reduce((h, r) => h + r.height, 0) + g * (rows.length - 1));
      let y = 0; for (const r of rows) { c.getContext("2d").drawImage(r, (c.width - r.width) / 2, y); y += r.height + g; }
      this.site = c;
    }
    if (this.site) {
      const nTop = this.pos.num[1], nBottom = nTop + this.num.c.height, sGap = W * FEED.gap * 1.2;
      const lift = Math.max(0, nBottom + sGap + this.site.height - (this.H - W * FEED.edge));
      this.pos.num = [this.pos.num[0], nTop - lift];
      if (this.pos.label) this.pos.label = [this.pos.label[0], this.pos.label[1] - lift];
      this.pos.site = [this.pos.num[0] + (this.num.c.width - this.site.width) / 2, nBottom - lift + sGap];
    }
    // the call to action stands clear of its number (the engine's own label sits 7-12px over it)
    if (this.num.label && this.pos.label) {
      const want = this.pos.num[1] - W * FEED.gap * 1.1 - this.num.label.height;
      if (this.pos.label[1] > want) this.pos.label = [this.pos.label[0], want];
    }
    // the phones fill what the words leave, between the service line and the call to action
    const gap = W * .04, top = this.pos.outer[3] + gap, bottom = (this.pos.label?.[1] ?? this.pos.num[1]) - gap;
    if (this.phones.length && bottom > top) {
      const box = this.phones.map(p => {
        const a = p.angle * Math.PI / 180;
        const hw = p.size * (p.w * Math.abs(Math.cos(a)) + p.h * Math.abs(Math.sin(a))) / 2;
        const hh = p.size * (p.h * Math.abs(Math.cos(a)) + p.w * Math.abs(Math.sin(a))) / 2;
        return [p.home[0] - hw, p.home[1] - hh, p.home[0] + hw, p.home[1] + hh];
      });
      const l = Math.min(...box.map(b => b[0])), r = Math.max(...box.map(b => b[2]));
      const y0 = Math.min(...box.map(b => b[1])), y1 = Math.max(...box.map(b => b[3]));
      // the phones fill the room the words leave: shrunk to fit, or grown up to 1.8x
      const k = Math.min(1.8, (bottom - top) / (y1 - y0), W * .9 / (r - l));
      const cx = (l + r) / 2, cy = (y0 + y1) / 2;
      const ty = Math.max(top + (y1 - y0) * k / 2, Math.min(bottom - (y1 - y0) * k / 2, cy));
      for (const p of this.phones) { p.home = [W / 2 + (p.home[0] - cx) * k, ty + (p.home[1] - cy) * k]; p.size *= k; }
      this.subjectFit = k;
    } else this.subjectFit = this.phones.length ? 0 : 1;
    // the bold claim, in a badge in the room _insets() kept at the top
    this.claim = null;
    if (st.feed_claim) {
      const fill = this.p.plate || this.p.accent, inkc = this.p.plate_ink || "#ffffff";
      let px = Math.round(W * FEED.claim), row, padX, h, w;
      for (;;) {
        row = plainRow(st.feed_claim.toUpperCase(), px, inkc, (FONTS[st.font] || FONTS.franklin)[0], (FONTS[st.font] || FONTS.franklin)[1]);
        padX = px * .75; h = Math.round(px * 1.7); w = Math.round(row.width + padX * 2);
        if (w <= W * .9 || px <= W * FEED.claimMin) break;
        px = Math.max(Math.round(W * FEED.claimMin), Math.round(px * .94));
      }
      if (w <= W * .9) {
        const c = canvas(w, h), x = c.getContext("2d");
        x.fillStyle = fill; x.beginPath(); x.roundRect(0, 0, w, h, h / 2); x.fill();
        x.drawImage(row, (w - row.width) / 2, (h - row.height) / 2);
        this.claim = { c, x: (W - w) / 2, y: W * FEED.edge, fill, ink: inkc };
      }
    }
    // the selling points and the accents, placed again round the layout as it now stands; where
    // the points take a side, the phones centre in what is left, and the decoration is placed
    // once more round them (the points stay on their side: the phones moved away from them)
    this._buildDecor();
    if (this.perks && this.phones.length) {
      const P = this.perks, pr = [P.x + P.sp.pad, P.y + P.sp.pad, P.x + P.sp.pad + P.sp.w, P.y + P.sp.pad + P.sp.h];
      const pb = phoneBox(this), e = W * FEED.edge, g = W * FEED.gap;
      const left = (pr[0] + pr[2]) / 2 < W / 2, sideBy = pr[1] < pb[3] && pr[3] > pb[1];
      if (sideBy) {
        const lo = left ? pr[2] + g : e, hi = left ? W - e : pr[0] - g, dx = (lo + hi) / 2 - (pb[0] + pb[2]) / 2;
        if (hi - lo >= pb[2] - pb[0] && Math.abs(dx) > 1) { for (const p of this.phones) p.home = [p.home[0] + dx, p.home[1]]; this._buildDecor(); }
      }
    }
    this._contrastGuard();
    this.still = null;
  }

  /** The claim's room at the top: the engine sets the headline under insetTop. */
  _insets() {
    super._insets();
    if (this.st.feed_claim) this.insetTop += this.W * (FEED.edge + FEED.claim * 1.7 + FEED.gap * 1.6) - this.H * .035;
  }

  frame(ctx, t, quality, dt) {
    super.frame(ctx, t, quality, dt);
    const C = this.claim;
    if (C) {
      // pops in with the headline (after the video's opening: a strike-out has the screen to
      // itself), then its glow breathes (a 1.6 s pulse) for the rest of the ad
      const q = prog(t, Math.max(.1, (this.tl.text ?? .25) - .15), .45);
      if (q > 0) {
        const s = .7 + .3 * outBack(q), cx = C.x + C.c.width / 2, cy = C.y + C.c.height / 2;
        const glow = .5 + .5 * Math.sin(t * Math.PI * 2 / 1.6);
        ctx.save(); ctx.globalAlpha = Math.min(1, q * 2);
        ctx.translate(cx, cy); ctx.scale(s, s);
        ctx.shadowColor = C.fill; ctx.shadowBlur = this.W * (.012 + .018 * glow);
        ctx.drawImage(C.c, -C.c.width / 2, -C.c.height / 2);
        ctx.restore();
      }
    }
    if (this.site) {
      const q = prog(t, this.tl.number + .15, .35);
      if (q > 0) { ctx.save(); ctx.globalAlpha = q; ctx.drawImage(this.site, this.pos.site[0], this.pos.site[1] + (1 - q) * this.W * .02); ctx.restore(); }
    }
  }
}

/** What would stop this still going out, in words (after social/media.js compositionBlockers). */
export function blockers(ad, st) {
  const out = [];
  if (st.feed_line && !ad.tag) out.push("service line did not fit at body size");
  if (st.number_label && !ad.num.label) out.push("call to action did not fit at body size");
  if (ad._headCover() > .01) out.push("words touch the phones");
  // the phones, at least 11% of the height (119px on a 1080 square): the words come first, and
  // the full brief (claim, hero, models, selling points, call to action, towns, site) fills a square
  // (their size is checked on the picture delivered, in look(): the layout's own estimate ran
  // under what was drawn)
  const rects = [["headline", ad.pos.outer], ["number", [ad.pos.num[0], ad.pos.num[1], ad.pos.num[0] + ad.num.c.width, ad.pos.num[1] + ad.num.c.height]]];
  if (ad.tag) rects.push(["service line", [ad.pos.tag[0], ad.pos.tag[1], ad.pos.tag[0] + ad.tag.width, ad.pos.tag[1] + ad.tag.height]]);
  if (ad.num.label && ad.pos.label) rects.push(["call to action", [ad.pos.label[0], ad.pos.label[1], ad.pos.label[0] + ad.num.label.width, ad.pos.label[1] + ad.num.label.height]]);
  if ((st.feed_site || st.feed_where) && !ad.site) out.push("footer did not fit at body size");
  if (ad.site) rects.push(["footer", [ad.pos.site[0], ad.pos.site[1], ad.pos.site[0] + ad.site.width, ad.pos.site[1] + ad.site.height]]);
  if (st.feed_claim && !ad.claim) out.push("claim did not fit");
  if (ad.claim) rects.push(["claim", [ad.claim.x, ad.claim.y, ad.claim.x + ad.claim.c.width, ad.claim.y + ad.claim.c.height]]);
  if (st.points && !ad.perks) out.push("selling points found no room");
  if (ad.perks) {
    // the engine places the chips with its own clearance (_perkSearch), and its box includes the
    // chips' shadow: only a chip that meets a line (under 6px) is refused here
    const P = ad.perks, pr = [P.x + P.sp.pad, P.y + P.sp.pad, P.x + P.sp.pad + P.sp.w, P.y + P.sp.pad + P.sp.h], g = ad.W * .0055;
    for (const [name, r] of rects.filter(([n]) => n === "claim" || n === "footer" || n === "call to action" || n === "service line"))
      if (pr[0] < r[2] + g && pr[2] > r[0] - g && pr[1] < r[3] + g && pr[3] > r[1] - g) out.push(`selling points reach the ${name}`);
  }
  // the margin: every block clear of the frame's edge
  const edge = ad.W * FEED.edge;
  for (const [name, r] of rects) if (r.some(n => !Number.isFinite(n)) || r[0] < edge - .5 || r[1] < edge - .5 || r[2] > ad.W - edge + .5 || r[3] > ad.H - edge + .5) out.push(name + " inside the margin");
  // the gaps: blocks that share a column, one above the other, never nearer than FEED.gap
  // (the headline and its service line are one block, spaced by the engine)
  const gap = ad.W * FEED.gap, stack = rects.filter(([n]) => n !== "service line");
  if (ad.phones.length) stack.push(["phones", phoneBox(ad)]);
  for (let i = 0; i < stack.length; i++) for (let j = i + 1; j < stack.length; j++) {
    const [an, a] = stack[i], [bn, b] = stack[j];
    if (Math.min(a[2], b[2]) - Math.max(a[0], b[0]) <= 0) continue;
    const apart = Math.max(b[1] - a[3], a[1] - b[3]);
    if (apart < gap) out.push(`${an} and ${bn} ${apart < 0 ? "overlap" : Math.round(apart / ad.W * 1080) + "px apart"}`);
  }
  return out;
}

/** The phones' footprint, as FeedAd fits them. */
export function phoneBox(ad) {
  const box = ad.phones.map(p => {
    const a = p.angle * Math.PI / 180;
    const hw = p.size * (p.w * Math.abs(Math.cos(a)) + p.h * Math.abs(Math.sin(a))) / 2;
    const hh = p.size * (p.h * Math.abs(Math.cos(a)) + p.w * Math.abs(Math.sin(a))) / 2;
    return [p.home[0] - hw, p.home[1] - hh, p.home[0] + hw, p.home[1] + hh];
  });
  return [Math.min(...box.map(b => b[0])), Math.min(...box.map(b => b[1])), Math.max(...box.map(b => b[2])), Math.max(...box.map(b => b[3]))];
}


/* ══════════════════════════════════════════════════════════════════════════════════════════
   THE FULL AD, LAID OUT BY RULE (2026-11-11)

   FeedAd above takes the engine's own placement and nudges it, and the tool that drives it
   tries seed after seed (up to 120) until a look passes every check. That suits a batch made
   overnight; it cannot serve a customer typing their own headline, who needs the ad to fit the
   first time, in every format. FullAd places every block itself, top to bottom:

       claim badge
       HEADLINE (as large as the width and its share of the height allow)
       the line under it (the models bought)
       selling points | the product | a sticker and an icon
       the call to action
       ‹‹‹ the number ›››
       the towns
       the website

   The owner's four words for it (2026-11-11): "maximize elements.. sizing.. spacing..
   positioning", and "eye catchy elements".
   - elements: every block above is drawn when its words are given, and fullStyle() gives
     every one a default, so no ad goes out bare;
   - sizing: each block takes the largest size its room allows (the headline the full width,
     the product the whole height of its band), and nothing is set under the body sizes below;
   - spacing: one margin, one gap, and the room left over shared equally between the blocks;
   - positioning: one axis for the words, and the middle band split into columns that never
     leave a third of the frame empty;
   - eye-catchers: the glowing claim, the accent word, a starburst sticker beside the product,
     chevrons at the number, and one 3D icon where the format has the room. None lands on a
     word or a phone, and the two-colour rule holds: the sticker wears the card's own ink.

   Sizes are shares of U, the frame's short side (so a wide frame is not set as if it were
   1920 tall): 1080 x .052 = 56px. */
export const FULL = {
  edge: .035, gap: .02,
  claim: .038, claimMin: .03,
  tag: .052, tagMin: .04,
  label: .044, labelMin: .036,
  foot: .032, footMin: .027,
  chip: .042, chipMin: .03,
  number: .125, pill: .7,           // the number's glyphs at most 12.5% of U; its pill 70% of the column, the chevrons take the rest
  burst: .112, burstMin: .08,       // the sticker's radius
  icon: .085, iconMin: .055,
};
/** The chevrons' size and weight, farthest from the number first (_chevrons: never their opacity). */
export const CHEVRON_STEP = [.7, .85, 1];

/** The house style (tools/feed-stills/render.mjs HOUSE and QUIET, 2026-11-03): one face, capitals,
 *  the double outline, one accent word, the number in a pill, and everything in the maker that
 *  puts small words or stray marks on the picture held off. */
export const HOUSE = { font: "chivo", text_fx: "double_outline", case: "brand", color_mode: "accent_word", number_style: "pill", text_pos: "top-center" };
export const QUIET = { decor: [], urgency: "none", overlay: "none", accents: 0, board: "none", number_pos: "bottom-center", number_format: "parens",
  camera: "still", shake: 0, sparkles: false, text_in: "slide", pose: "flat", end_face: "back", phone_idle: "breathe", grade: "none", depth: "none",
  text_scale: 1, number_scale: 1, tracking: 0, skew: 0, hook: "none", season: "none", phone_finish: "standard", transition: "none", ...HOUSE };
/* The full ad's colours are the photo ads' twelve proven pairs (DESIGN-LAW 123: one colour
   vocabulary), by the same names and the same colours as Easy Mode's themes: house-colours.js is
   made from app.js COLOR_THEMES by scripts/build_house_colours.mjs. (It first drew from sixteen of
   the video maker's own palettes, so "Navy & Gold" was two navies and two golds.) The iPhones LA
   feed stills keep their own list (tools/feed-stills/render.mjs). */
export const COLOURWAYS = HOUSE_COLOURS.map(c => c.key);
export const COLOUR_OF = Object.fromEntries(HOUSE_COLOURS.map(c => [c.key, c]));
/* Grounds with nothing drawn in them. The review of 2026-11-12 found the others' features under
   the content: the edges of spot_floor's cone ran behind the chips and through the chevrons, and
   studio_sweep's floor line stood as a row of ticks under the number. The depth comes from the
   light the layout puts behind the product, where it knows the product is. */
export const GROUNDS = ["radial", "tonal", "linear"];
export const ARRANGEMENTS = ["lineup", "fan", "showcase", "podium", "wings"];
/* One icon, where a size has room for one: the fan of banknotes. The review of 2026-11-12: the
   handshake is a photograph of two suits (clip art beside flat type), the red pin repeats the
   footer's pin, and pin and shield each bring a third colour onto a two-colour card. */
export const ICONS = ["cash"];
/** What an ad says when its maker has typed nothing: claims any buyer can stand behind (no "#1",
 *  "best" or "fastest", which need proof; DESIGN-LAW's honest-claims rule). */
export const FULL_WORDS = {
  claim: ["TOP DOLLAR • FAST CASH", "HONEST BUYER • TOP DOLLAR", "QUICK REPLIES • CASH TODAY", "LOCAL & HONEST", "TOP DOLLAR PAID"],
  line: ["ALL MODELS WANTED", "NEW, USED OR CRACKED", "ANY CARRIER • ANY CONDITION"],
  points: ["FREE QUOTE, CASH SAME DAY, NO FEES", "QUOTE BY TEXT, PAID TODAY, WE MEET YOU", "TEXT US NOW, TOP DOLLAR, ANY CONDITION"],
  label: ["CALL OR TEXT", "TEXT US NOW", "GET YOUR OFFER"],
  burst: ["CASH!", "FAST CASH", "TOP $$$", "PAID TODAY", "SAME DAY", "EASY SALE"],
  burst_es: ["PAGO HOY", "PAGO YA", "FÁCIL"],
};

/* ONE PROMISE, ONCE. The review of 2026-11-12 found the same promise three times on one square:
   "CASH TODAY" in the claim, "CASH PAID" in a chip, "PAID TODAY" on the sticker. Two lines share a
   promise when they share a word's stem (four letters and up, its first five), the test the
   iPhones LA generator uses (tools/feed-stills/generate.mjs). */
const stems = s => new Set(String(s || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[^A-Z0-9$]+/).filter(w => w.length >= 4 || w === "$$$").map(w => w.slice(0, 5)));
export const sharesWord = (a, b) => { const B = stems(b); return [...stems(a)].some(w => B.has(w)); };

/** A colour's OKLCH chroma and hue (DESIGN-LAW 40: colour is judged in OKLCH, never in sRGB). */
export function oklchOf(hex) {
  const f = v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
  const [r, g, b] = [1, 3, 5].map(i => f(parseInt(String(hex).slice(i, i + 2), 16) || 0));
  const l = Math.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b), m = Math.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b), s = Math.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b);
  const A = 1.9779984951 * l - 2.4285922050 * m + .4505937099 * s, B = .0259040371 * l + .7827717662 * m - .8086757660 * s;
  return { L: .2104542553 * l + .793617785 * m - .0040720468 * s, C: Math.hypot(A, B), h: (Math.atan2(B, A) * 180 / Math.PI + 360) % 360 };
}

/* A WORD THAT NAMES A COLOUR IS DRAWN IN IT, OR NOT ACCENTED (rule 138). The accent goes to the
   goods, so on a gold or silver ad it paints the metal's own name: before this, WE BUY GOLD drew
   GOLD in cyan, green, red or blue on seven of the twelve pairs, and WE BUY SILVER drew SILVER in
   gold, orange or yellow on seven. Gold is the gold-and-yellow band of rule 103's namedBand (hue
   65 to 110, C .1 and up: Red & Yellow's #e5b800 is gold, Navy & Orange's #ff7a00 is not); silver
   is a cool colour (hue 180 to 285: cyan, blue) or no colour at all. (The photo ads hold the same
   line: pgHuePlan keeps gold among a card's two families when its headline says GOLD.) */
const COLOUR_WORD = { GOLD: "gold", GOLDEN: "gold", ORO: "gold", SILVER: "silver", PLATA: "silver" };
export function wordAgrees(word, hex) {
  const named = COLOUR_WORD[String(word || "").toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ]/g, "")];
  if (!named || !hex) return true;
  const { C, h } = oklchOf(hex);
  return named === "gold" ? C >= .1 && h >= 65 && h < 110 : C < .04 || (h >= 180 && h < 285);
}

/** Which word of the headline wears the accent: the goods, else the money, else the verb, else the
 *  last word. ("UPGRADING? SELL YOUR OLD ONE" accented ONE, the one word that says nothing.) Given
 *  the accent's colour, a word naming another colour is passed over: WE BUY GOLD on Black & Red
 *  accents BUY, and GOLD stays in the ink. */
const GOODS = /^(I?PHONES?|IPADS?|IMACS?|MACBOOKS?|WATCH(ES)?|GALAXY|PIXEL|FOLDABLES?|TABLETS?|CONSOLES?|SWITCH|CONTROLLERS?|LAPTOPS?|HEADSETS?|HANDHELDS?|PCS?|HEADPHONES|EARBUDS|SPEAKERS?|MONITORS?|SSDS?|CHROMEBOOKS?|GLASSES|SMARTWATCH(ES)?|GOLD|SILVER|COINS?|CARS?|TRUCKS?|STRIPS|CARDS?|CAMERAS?|DRONES?|CELULAR(ES)?|TEL[EÉ]FONOS?|ORO|PLATA|MONEDAS?|CARROS?)$/;
const MONEY = /^(CASH|PAID|MONEY|DOLLAR|EFECTIVO|DINERO)$/, VERB = /^(SELL|BUY|TRADE|VENDE|COMPRAMOS)$/;
export function accentWord(headline, accent) {
  const ws = String(headline || "").toUpperCase().split(/\s+/).map(w => w.replace(/[^A-ZÁÉÍÓÚÑ0-9]/g, ""));
  const ok = i => wordAgrees(ws[i], accent);
  for (const re of [GOODS, MONEY, VERB]) { for (let i = ws.length - 1; i >= 0; i--) if (re.test(ws[i]) && ok(i)) return i; }
  for (let i = ws.length - 1; i >= 0; i--) if (ws[i] && ok(i)) return i;
  return ws.length - 1;
}

/** The pairs a seeded ad may be drawn in: those that suit its line (house-colours.js suits, from
 *  the library's AFFINITY), and, when its headline names a colour, those whose accent is that
 *  colour, so the accent can paint it. All twelve, in their order, for any other ad: a seed that
 *  drew a pair before draws the same one. A pair picked by hand is never narrowed (fullStyle). */
export function pairsFor(subject, headline) {
  let keys = LINES.includes(subject) ? HOUSE_COLOURS.filter(c => (c.suits || []).includes(subject)).map(c => c.key) : COLOURWAYS;
  const named = String(headline || "").toUpperCase().split(/\s+/).filter(w => COLOUR_WORD[w.replace(/[^A-ZÁÉÍÓÚÑ]/g, "")]);
  if (named.length) {
    const agree = keys.filter(k => named.some(w => wordAgrees(w, COLOUR_OF[k].colors.accent)));
    if (agree.length) keys = agree;
  }
  return keys.length ? keys : COLOURWAYS;
}

/** A map pin, drawn (an emoji pin is a different picture on every device, and none on some). */
function pin(x, cx, cy, h, fill, dot) {
  const r = h * .34;
  x.save(); x.fillStyle = fill; x.beginPath();
  x.arc(cx, cy - h / 2 + r, r, Math.PI * .85, Math.PI * .15);
  x.lineTo(cx, cy + h / 2); x.closePath(); x.fill();
  x.fillStyle = dot; x.beginPath(); x.arc(cx, cy - h / 2 + r, r * .38, 0, Math.PI * 2); x.fill(); x.restore();
}

/** One row of plain type in the label's face, a drawn pin before it when asked. */
function footRow(text, px, color, family, weight, pinFill) {
  const m = canvas(4, 4).getContext("2d"), font = `${weight} ${px}px "${family}", sans-serif`;
  m.font = font;
  const pw = pinFill ? px * .95 : 0, w = Math.ceil(m.measureText(text).width + pw) + 4, h = Math.ceil(px * 1.3);
  const c = canvas(w, h), x = c.getContext("2d");
  if (pinFill) pin(x, 2 + px * .32, h / 2, px * .98, pinFill, color);
  x.font = font; x.fillStyle = color; x.textBaseline = "middle"; x.fillText(text, 2 + pw, h / 2 + px * .04);
  return c;
}

/** The number on its pill, the figures centred in it by their own ink. The engine's pill is set
 *  from the face's ascent, so the brackets of "(562)", which hang under the baseline, came within
 *  4px of its lower edge while 22px stood clear above (review, 2026-11-12; DESIGN-LAW 58: copy is
 *  never touched by a plate's edge). Returns the sprite, the margin its shadow takes round the
 *  pill, and the pill's own size. */
function numberPill(text, size, font, p) {
  const col = contrastOf(p.plate_ink, p.plate) >= 3.5 ? p.plate_ink : (lum(p.plate) > .5 ? "#111111" : "#ffffff");
  const P = { ...p, ink: col, accent: col };
  const ink = trim(inkSprite(text, [...text].map(() => col), font, size, 0, "flat", P, 0).c);
  const padX = size * .5, padY = Math.max(size * .17, ink.height * .19), w = Math.ceil(ink.width + padX * 2), h = Math.ceil(ink.height + padY * 2);
  const sk = Math.max(.2, size / 96), m = Math.ceil(16 * sk);
  const c = canvas(w + m * 2, h + m * 2), x = c.getContext("2d");
  x.save(); x.shadowColor = "rgba(0,0,0,.32)"; x.shadowBlur = 11 * sk; x.shadowOffsetY = 4 * sk;
  x.beginPath(); x.roundRect(m, m, w, h, h / 2); x.fillStyle = p.plate; x.fill(); x.restore();
  x.drawImage(ink, m + (w - ink.width) / 2, m + (h - ink.height) / 2);
  return { c, pad: m, w, h, inkH: ink.height };
}

const stackRows = (rows, gap) => {
  const c = canvas(Math.max(...rows.map(r => r.width)), Math.ceil(rows.reduce((h, r) => h + r.height, 0) + gap * (rows.length - 1)));
  let y = 0; for (const r of rows) { c.getContext("2d").drawImage(r, (c.width - r.width) / 2, y); y += r.height + gap; }
  return c;
};

export class FullAd extends Ad {
  constructor(style, assets, width, height) {
    super(style, assets, width, height, { plan: false });   // laid out at this size by the rules below, never from the plain engine's plan
    this._productLight();
    this._evenGround();
  }

  /** A light behind the product, in the colourway's own lighter tone, painted into the ground once.
   *  The review of 2026-11-12: a deep-blue phone on charcoal, a black tablet on navy and a dark
   *  laptop on indigo stood in the dark. The layout knows where the product is; a ground does not. */
  _productLight() {
    const G = this.full && this.full.group; if (!G) return;
    const x = this.bg.getContext("2d"), cx = (G[0] + G[2]) / 2, cy = (G[1] + G[3]) / 2, rx = (G[2] - G[0]) * .8, ry = (G[3] - G[1]) * .74;
    const [r, g, b] = [1, 3, 5].map(i => parseInt(this.p.light.slice(i, i + 2), 16)), up = v => Math.round(v + (255 - v) * .35), c = a => `rgba(${up(r)},${up(g)},${up(b)},${a})`;
    x.save(); x.translate(cx, cy); x.scale(rx, ry);
    const gl = x.createRadialGradient(0, 0, 0, 0, 0, 1); gl.addColorStop(0, c(.6)); gl.addColorStop(.55, c(.22)); gl.addColorStop(1, c(0));
    x.fillStyle = gl; x.fillRect(-1, -1, 2, 2); x.restore();
  }

  /** The small lines stand on the ground itself, and a ground has a lit patch or a floor: dark ink
   *  on the cream colourway's grey floor read 2.65:1 (full_ad_check, 2026-11-11). Where a line
   *  reads under 4.5:1 on the ground drawn under it, that stretch of ground is evened toward the
   *  colourway's own ground colour, soft at its edges: the ink was chosen against that colour. */
  _evenGround() {
    const F = this.full, R = F.rects, W = this.W, H = this.H, ink = this.pHead.ink, bx = this.bg.getContext("2d", { willReadFrequently: true });
    const lin = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
    const L = h => { const [r, g, b] = [1, 3, 5].map(i => lin(parseInt(h.slice(i, i + 2), 16))); return .2126 * r + .7152 * g + .0722 * b; };
    const Li = L(ink), light = Li >= .18;
    const reads = r => {
      const x0 = Math.max(0, r[0] | 0), y0 = Math.max(0, r[1] | 0), w = Math.min(W, Math.ceil(r[2])) - x0, h = Math.min(H, Math.ceil(r[3])) - y0;
      if (w < 2 || h < 2) return 99;
      const d = bx.getImageData(x0, y0, w, h).data, Ls = [];
      for (let i = 0; i < d.length; i += 4 * 5) Ls.push(.2126 * lin(d[i]) + .7152 * lin(d[i + 1]) + .0722 * lin(d[i + 2]));
      Ls.sort((a, b) => a - b);
      const worst = Ls[Math.min(Ls.length - 1, Math.floor(Ls.length * (light ? .9 : .1)))];
      return (Math.max(Li, worst) + .05) / (Math.min(Li, worst) + .05);
    };
    F.evened = [];
    for (const name of ["line", "call to action", "footer"]) {
      const r = R[name]; if (!r) continue;
      for (let a = .55; reads(r) < 4.5 && a <= 1.001; a += .15) {
        const pad = (r[3] - r[1]) * .5, blur = pad * .9;
        bx.save(); bx.globalAlpha = a; bx.fillStyle = this.p.ground; bx.shadowColor = this.p.ground; bx.shadowBlur = blur;
        bx.beginPath(); bx.roundRect(r[0] - pad, r[1] - pad * .5, r[2] - r[0] + pad * 2, r[3] - r[1] + pad, pad); bx.fill(); bx.restore();
        if (!F.evened.includes(name)) F.evened.push(name);
      }
    }
    if (F.evened.length) { this.still = null; }
  }

  /** An ad with no product picture (a line the library has no clean picture of): the engine's
   *  styled arrangements give a spot even for no phones, and a spot with no phone threw. */
  _buildPhones() {
    if (!(this.st.phones || []).some(id => this.assets.phones[id])) this.st.arrangement = "lineup";
    super._buildPhones();
  }

  /* the engine's own room-making passes: this layout is final when _layoutType returns */
  _numberBelowPhones() {} _headlineOffPhones() {} _wordsOffPhones() {} _perksRoom() {}

  /** Every block, sized and placed. Called by the engine's constructor after the phones are
   *  built (so no field of this class exists yet: everything is read from this.st). */
  _layoutType() {
    const st = this.st, W = this.W, H = this.H, p = this.p, ph = this.pHead;
    const U = Math.min(W, H), ar = W / H, wide = ar >= 1.3, tall = ar < .7;
    const e = U * FULL.edge, g = U * FULL.gap;
    // A story is shown under the app's own bars: the account's name across the top, the reply box and the
    // button across the bottom. Meta asks for about 14% clear at the top and 20% at the bottom of a 9:16
    // (250 and 340px of 1920); the ground runs under them, the ad stands between.
    const eyT = tall ? H * .125 : e, eyB = tall ? H * .17 : e;
    // the column the words stand in; on a wide frame the product has the right of it
    const cx0 = e, cx1 = wide ? W * .56 : W - e, colW = cx1 - cx0, mid = (cx0 + cx1) / 2;
    const font = LEGIBLE.has((FONTS[st.font] || [])[3]) ? st.font : "franklin";
    const [fam, fwt] = FONTS[font] || FONTS.franklin;
    const ink = ph.ink, fx = lum(ink) < .5 ? "flat" : "shadow";
    const upper = t => applyCase(t, "brand");                 // one spelling on the card: the headline's
    const paint = (line, px) => trim(inkSprite(line, [...line].map(() => ink), font, px, .02, fx, ph).c);
    /* A line of body type in the fewest rows that fit: one; two, broken at a separator
       ("A • B • C") or between words; three, one item a row. Smaller only when no break
       fits, and never under its floor: then it is left out and fullBlockers says so. */
    const body = (text, px0, pxMin, maxRows = 2) => {
      if (!text) return null;
      const up = upper(text), items = up.split(/ (?:•|→) /), arrow = up.includes("→");
      const join = (a, b) => items.slice(a, b).join(arrow ? " → " : " • ") + (arrow && b < items.length ? " →" : "");
      const tries = [[up]];
      if (items.length === 1) tries.push(splitLines(up, 2));
      for (let i = 1; i < items.length; i++) tries.push([join(0, i), join(i, items.length)]);
      if (items.length === 3) tries.push(items.map((t, i) => t + (arrow && i < 2 ? " →" : "")));
      for (let px = px0; px >= pxMin - .01; px = Math.max(pxMin, px * .94)) {
        for (let n = 1; n <= maxRows; n++) {
          const fits = tries.filter(t => t.length === n).map(t => t.map(l => paint(l, px))).filter(r => Math.max(...r.map(x => x.width)) <= colW);
          if (fits.length) { const rows = fits.sort((a, b) => Math.max(...a.map(x => x.width)) - Math.max(...b.map(x => x.width)))[0]; return { c: rows.length === 1 ? rows[0] : stackRows(rows, Math.ceil(px * .28)), px, rows: rows.length }; }
        }
        if (px <= pxMin) break;
      }
      return null;
    };

    /* ---- the blocks that do not depend on the headline ---- */
    const F = this.full = { U, e, g, wide, tall, col: [cx0, cx1], rects: {}, px: {}, left: [] };
    // the claim, in a badge
    let claim = null;
    if (st.feed_claim) {
      const fill = p.plate || p.accent, inkc = p.plate_ink || "#ffffff", text = st.feed_claim.toUpperCase();
      const [cf, cw] = FONTS[st.font] || FONTS.franklin;
      const pmin = Math.floor(U * FULL.claimMin);
      for (let px = Math.round(U * FULL.claim); ; px = Math.max(pmin, Math.floor(px * .94))) {
        const row = footRow(text, px, inkc, cf, cw), h = Math.round(px * 1.7), w = Math.round(row.width + px * 1.5);
        if (w <= colW) { const c = canvas(w, h), x = c.getContext("2d"); x.fillStyle = fill; x.beginPath(); x.roundRect(0, 0, w, h, h / 2); x.fill(); x.drawImage(row, (w - row.width) / 2, (h - row.height) / 2); claim = { c, fill, ink: inkc, px }; break; }
        if (px <= pmin) break;
      }
      if (!claim) F.left.push("claim");
    }
    const line = st.feed_line != null ? st.feed_line : st.tag;
    const tagB = body(line, U * FULL.tag, U * FULL.tagMin, 2);
    if (line && !tagB) F.left.push("line");
    const labB = body(st.number_label, U * FULL.label, U * FULL.labelMin, 1);
    if (st.number_label && !labB) F.left.push("call to action");
    // the number: its pill a fixed share of the column, the chevrons either side of it
    const numText = formatNumber(st.number, st.number_format) || "YOUR NUMBER";
    let numFont = st.number_font === "same" ? st.font : st.number_font; if (FINE_FACES.has(numFont) || !FONTS[numFont]) numFont = "oswald";
    const numFor = z => { const n = numberPill(numText, z, numFont, p); return { ...n, text: numText, label: null }; };
    let nz = U * .09, num = numFor(nz);
    nz *= Math.min(colW * FULL.pill / num.w, U * FULL.number / nz); num = numFor(nz);
    for (let k = 0; k < 4 && num.w > colW * FULL.pill * 1.01; k++) { nz *= colW * FULL.pill / num.w; num = numFor(nz); }
    if (labB) num = { ...num, label: labB.c };
    // the footer: the towns after a pin, over the website
    const where = (st.feed_where || "").replace(/^\s*\p{Extended_Pictographic}️?\s*/u, "").trim().toUpperCase(), site = (st.feed_site || "").trim();
    let foot = null;
    if (where || site) {
      const [lf, lw] = FONTS[font] || FONTS.franklin;
      const pmin = Math.floor(U * FULL.footMin);
      for (let px = Math.round(U * FULL.foot); ; px = Math.max(pmin, Math.floor(px * .94))) {
        const rows = [where && footRow(where, px, ink, lf, lw, this.hot), site && footRow(site, px, ink, lf, lw)].filter(Boolean);
        if (rows.every(r => r.width <= colW)) { foot = { c: trim(rows.length === 1 ? rows[0] : stackRows(rows, Math.round(U * .006))), px }; break; }   // trimmed: a gap is measured to its letters
        if (px <= pmin) break;
      }
      if (!foot) F.left.push("footer");
    }

    /* ---- the headline: the largest that leaves the product its band ---- */
    const text = applyCase(st.headline, st.case), words = text.split(/\s+/).length;
    const gapOf = z => z * (["box", "sticker", "highlighter", "cutout", "double_outline", "glass"].includes(st.text_fx) ? .14 : .02);
    const mc = canvas(4, 4).getContext("2d");
    const headAt = (maxH) => {
      // how many lines: whichever lets the type be biggest in the room it has (the engine's own rule)
      const ref = U * .1; mc.font = fontCss(st.font, ref);
      let best = null;
      for (const n of [...new Set([1, 2, 3].map(k => Math.min(words, k)))]) {
        const ls = splitLines(text, n), wid = Math.max(...ls.map(l => mc.measureText(l).width + (st.tracking || 0) * ref * l.length)) * 1.06;   // the outline's width
        const hgt = ref * (.82 * (.98 * (ls.length - 1) + 1) + .14 * (ls.length - 1));
        const s = ref * Math.min(colW / wid, maxH / hgt);
        if (!best || s > best.s * 1.04) best = { n, s };
      }
      let size = Math.min(best.s, U * .2 * (st.text_scale || 1)), lines, lineH, blockH;
      for (let k = 0; k < 8; k++) {
        const lk = size.toFixed(2) + "|" + best.n;
        lines = (this._lineCache ||= new Map()).get(lk) || this._lineCache.set(lk, headlineLines(st, ph, size, best.n)).get(lk);
        lineH = lines[0].asc * .98 + gapOf(size); blockH = lineH * (lines.length - 1) + lines[0].asc;
        // the letters and the outline round them stay inside the column: a headline as wide as the column
        // put its outline 17px from the frame's edge, in the margin (found by the pre-flight on the picture)
        const widest = Math.max(...lines.map(L => L.inkW)) + size * .34;
        if (widest <= colW && blockH <= maxH * 1.02) break;
        size *= Math.min(.97, colW / widest, maxH * 1.02 / blockH);
      }
      return { size, lines, lineH, blockH, n: best.n };
    };
    const hasChips = pointsOf(st).length > 0, hasPhones = this.phones.length > 0;
    // the gaps between one block and the next, in units of g; the room left over stretches them all alike
    const gClaim = 1.15, gBand = 1.4, gLab = .8, gFoot = 1.1;
    // the line under the headline clears the outline that hangs under its letters
    const tagGap = hd => Math.max(g * .9, hd.size * .24);
    const fixedOf = hd => (claim ? claim.c.height + g * gClaim : 0) + hd.blockH + (tagB ? tagB.c.height + tagGap(hd) : 0) + g * gBand * 2
      + (labB ? labB.c.height + g * gLab : 0) + num.h + (foot ? foot.c.height + g * gFoot : 0);

    /* ---- the band: selling points | the product | the sticker and the icon ----
       Sized before it is placed: the band takes the height its contents reach, and the room
       left over goes to the gaps. Three shapes are tried, and the one that shows the product
       largest is kept: the points beside the product (a low band), across the top of it, or
       (a tall frame) in a stack with the sticker beside them and the product under both. */
    const items = pointsOf(st), face = labelFont(st);
    const Hu = H - eyT - eyB;                                 // the height the ad stands in (a story's, between the app's bars)
    const phoneCap = wide ? H * .8 : Hu * (tall ? .52 : .49);
    const reach = q => { const a = q.angle * Math.PI / 180; return [q.size * (q.w * Math.abs(Math.cos(a)) + q.h * Math.abs(Math.sin(a))) / 2, q.size * (q.h * Math.abs(Math.cos(a)) + q.w * Math.abs(Math.sin(a))) / 2]; };
    // The engine spreads a set across its stage: a video's phones have the frame to themselves.
    // Here they stand shoulder to shoulder on one floor, in the engine's left-to-right order:
    // the arrangement keeps its character (a line, a fan, a shop window, a podium, wings) at
    // the spacing below, in phone widths. A leaning neighbour may tuck a little behind the
    // middle phone from the side, never from above (the set's house rules, 2026-10-02).
    const flat = this.phones.some(q => q.meta && q.meta.flat);
    if (hasPhones && flat) {
      // a product's own pictures (a subject from the offer family): side by side as they are, the
      // second at its size beside the first, a tenth of the narrower's width between them, feet level
      const ps = this.phones, PH = Math.max(...ps.map(q => q.h * (q.meta.k || 1)));
      let x = 0, was = 0;
      ps.forEach(q => { const sc = q.meta.k || 1, hw = q.w * sc / 2; q.angle = 0; q.size = sc; x += was ? was + Math.min(was, hw) * .2 + hw : hw; q.home = [x, (PH - q.h * sc) / 2]; was = hw; });
      this.drawOrder = ps.map((_, i) => i);
    } else if (hasPhones) {
      const ps = [...this.phones].sort((a, b) => a.home[0] - b.home[0]), n = ps.length;
      const PW = Math.max(...ps.map(q => q.w)), PH = Math.max(...ps.map(q => q.h));
      const spot = ({
        fan: (o, k) => [o * (n === 2 ? 1.2 : 1.02), k * .03, o * 8, 1],
        showcase: (o, k) => [o * (n === 2 ? 1.12 : .93), 0, 0, n === 2 ? 1 : k ? .86 : 1.08],
        podium: (o, k) => [o * 1.04, 0, 0, n === 2 ? 1 : 1.06 - .15 * k],
        wings: (o, k) => [o * (n === 2 ? 1.22 : 1.1), k * .02, -o * 7, 1],
      })[st.arrangement] || ((o) => [o * 1.14, 0, 0, 1]);
      ps.forEach((q, i) => {
        const o = i - (n - 1) / 2, k = Math.abs(o), [x, yy, ang, sc] = spot(o, k);
        q.angle = ang; q.size = sc;
        q.home = [x * PW, yy * PH + (PH - q.h * sc) / 2];           // every foot on the tallest's floor
      });
      // the middle in front: outer phones are drawn (and land) first
      this.drawOrder = this.phones.map((_, i) => i).sort((a, b) => Math.abs(ps.indexOf(this.phones[b]) - (n - 1) / 2) - Math.abs(ps.indexOf(this.phones[a]) - (n - 1) / 2));
    }
    const bb = this.phones.map(q => { const [hw, hh] = reach(q); return [q.home[0] - hw, q.home[1] - hh, q.home[0] + hw, q.home[1] + hh]; });
    const G = hasPhones ? [Math.min(...bb.map(b => b[0])), Math.min(...bb.map(b => b[1])), Math.max(...bb.map(b => b[2])), Math.max(...bb.map(b => b[3]))] : [0, 0, 1, 1];
    const gw = G[2] - G[0], gh = G[3] - G[1], gx = g * 1.6;
    const chipsFor = (shapes, maxW, maxH, align) => {
      for (const [n, row] of shapes) {
        if (n > items.length || n < 1) continue;
        for (let fs = U * FULL.chip; ; fs = Math.max(U * FULL.chipMin, fs * .95)) {
          const key = `${n}|${row}|${align}|${fs.toFixed(2)}`, q = (this._chipCache ||= new Map()).get(key) || this._chipCache.set(key, perksSprite(items.slice(0, n), fs, this.hot, align, row, face)).get(key);
          if (q.w <= maxW && q.h <= maxH) return { q, fs, n, row };
          if (fs <= U * FULL.chipMin) break;
        }
      }
      return null;
    };
    /* the product in a box bw x bh, with the sticker beside it (worth at most a sixth of the
       product's size) and the icon under the sticker where the box is tall enough for both */
    const wantBurst = st.feed_burst !== "", wantIcon = st.feed_icon !== "";
    const subject = (bw, bh, sticker = wantBurst) => {
      if (!hasPhones || bw < U * .1 || bh < U * .08) return { k: 0, rb: 0, ri: 0, w: 0, h: 0, colH: 0 };
      const kMax = Math.min(bw / gw, bh / gh, phoneCap / gh);
      let k = kMax, rb = 0, ri = 0;
      if (sticker) for (let q = U * FULL.burst; q >= U * FULL.burstMin - .01; q -= U * .004) {
        const rr = Math.min(q, bh * .5), kk = Math.min(kMax, (bw - gx * .8 - rr * 2) / gw);
        if (rr >= U * FULL.burstMin - .01 && kk >= kMax * .84) { k = kk; rb = rr; break; }
      }
      // the icon under the sticker, as large as the box's height leaves it
      if (rb && wantIcon) { const r2 = Math.min(U * FULL.icon, rb * .9, (bh - rb * 2 - g * 1.5) / 2); if (r2 >= U * FULL.iconMin) ri = r2; }
      const colH = rb ? rb * 2 + (ri ? g * 1.5 + ri * 2 : 0) : 0;
      const beside = { k, rb, ri, w: gw * k + (rb ? gx * .8 + rb * 2 : 0), h: Math.max(gh * k, colH), colH };
      // a tall box (a wide frame's right column): the sticker and the icon in a row under the product
      if (sticker && !rb) {
        const rr = Math.min(U * FULL.burst, bw * .24), kk = Math.min(kMax, (bh - g * 1.6 - rr * 2) / gh);
        if (rr >= U * FULL.burstMin && kk >= kMax * .8) {
          const r2 = wantIcon ? Math.min(U * FULL.icon, rr * .9) : 0, rowW = rr * 2 + (r2 ? gx + r2 * 2 : 0);
          return { k: kk, rb: rr, ri: rowW <= bw ? r2 : 0, w: Math.max(gw * kk, rowW <= bw ? rowW : rr * 2), h: gh * kk + g * 1.6 + rr * 2, colH: 0, below: true };
        }
      }
      return beside;
    };
    const shape = (mode, band) => {
      if (wide) {
        const chips = items.length ? chipsFor([[items.length, true], [items.length, false], [2, true], [2, false]], colW, band, "c") : null;
        return { mode: "wide", chips, sub: subject(W - e - W * .59, H - 2 * e), need: chips ? chips.q.h : 0 };
      }
      if (mode === "side") {
        const chips = items.length && band > U * .05 ? chipsFor(hasPhones ? [[items.length, false], [2, false]] : [[items.length, true], [items.length, false], [2, false]], hasPhones ? colW * .47 : colW, band, hasPhones ? "l" : "c") : null;
        const sub = subject(colW - (chips ? chips.q.w + gx : 0), band);
        return { mode, chips, sub, need: Math.max(chips ? chips.q.h : 0, sub.h) };
      }
      if (mode === "tall") {
        // a tall frame: the points in a stack with the sticker beside them, the product across the width under both
        const chips = items.length ? chipsFor([[items.length, false], [2, false]], colW * .6, band * .4, "l") : null;
        if (!chips || !wantBurst) return null;
        const rb = Math.min(U * FULL.burst, chips.q.h * .5, (colW - chips.q.w - gx) / 2);
        if (rb < U * FULL.burstMin) return null;
        const topH = Math.max(chips.q.h, rb * 2), sub = subject(colW, band - topH - g * 1.4, false);
        return { mode, chips, sub, rb, topH, need: topH + (sub.h ? g * 1.4 : 0) + sub.h };
      }
      const chips = items.length && band > U * .05 ? chipsFor([[items.length, true], [items.length, false], [2, true]], colW, band * .36, "c") : null;
      const sub = subject(colW, band - (chips ? chips.q.h + g * 1.4 : 0));
      return { mode, chips, sub, need: (chips ? chips.q.h + (sub.h ? g * 1.4 : 0) : 0) + sub.h };
    };
    // the shape that shows the product largest; a sticker is worth a quarter of the product's size, an icon a
    // twentieth, and larger points break a tie (a stack of them at 43px against a strip at 33px)
    const worth = T => T ? T.sub.k * (1 + (T.sub.rb || T.rb ? .25 : 0) + (T.sub.ri ? .05 : 0)) * (T.chips ? (T.chips.fs / (U * FULL.chip)) ** .35 : items.length ? .7 : 1) : -1;
    const bestShape = band => { let S = shape("side", band); if (!wide && hasPhones) for (const m of ["stack", "tall"]) { const T = shape(m, band); if (worth(T) > worth(S) * 1.03) S = T; } return S; };

    /* ---- the headline gives way only while the product is held back by the band's height ----
       The band is owed a share of the frame (bandMin), but only a product that can use it: a
       laptop or a car is as wide as the column long before it is that tall, and the review of
       2026-11-12 found "CASH FOR MACBOOKS" set at 70px to keep room no laptop could fill. */
    const bandMin = wide ? (hasChips ? U * .075 : 0) : Hu * (!hasPhones && !hasChips ? 0 : !hasPhones ? .1 : tall ? .45 : ar < .9 ? .38 : .23);
    // what the band's contents would take of the share they are owed: all of it for phones, less for a wide picture
    const wantBand = Math.min(bandMin, bestShape(bandMin).need || bandMin);
    const bandOf = h => Math.max(0, Hu - fixedOf(h));
    let headMax = wide ? H * .36 : Hu * (tall ? .26 : ar < .9 ? .235 : .32), hd = headAt(headMax), band = bandOf(hd);
    for (let k = 0; k < 14 && band < wantBand - 1 && hd.size > U * .072; k++) { headMax *= .93; hd = headAt(headMax); band = bandOf(hd); }
    let S = bestShape(band);
    // and room the band's contents cannot use goes back to the headline, while it makes the headline larger
    // (a headline as wide as the column gains nothing) and costs the product nothing
    for (let k = 0; k < 8 && band - S.need > g * 2.5; k++) {
      const h2 = headAt(headMax * 1.07); if (h2.size <= hd.size * 1.01) break;
      const raw = Hu - fixedOf(h2), S2 = bestShape(Math.max(0, raw));
      // never at the cost of the points (an ad with no picture grew its headline until they fell out
      // and the footer left the frame: full_ad_check, sealed SSDs on a wide frame)
      if (raw < S2.need - 1 || worth(S2) < worth(S) * .985 || !!S2.chips !== !!S.chips || (S.chips && S2.chips.fs < S.chips.fs * .98)) break;
      headMax *= 1.07; hd = h2; band = raw; S = S2;
    }
    // and whatever the words, the stack stays inside the frame: the headline goes on giving way
    for (let k = 0; k < 12 && Hu - fixedOf(hd) < S.need - 1 && hd.size > U * .05; k++) { headMax *= .93; hd = headAt(headMax); band = bandOf(hd); S = bestShape(band); }
    const chips = S.chips, sub = S.sub, side = S.mode === "side";
    if (globalThis.FULL_DEBUG) console.log('DBG', JSON.stringify({ W, H, band: Math.round(band), need: Math.round(S.need), colW: Math.round(colW), gw: Math.round(gw), gh: Math.round(gh), n: this.phones.length, mode: S.mode, k: +sub.k.toFixed(3), rb: Math.round(sub.rb), ri: Math.round(sub.ri), chips: chips ? Math.round(chips.fs) : 0, head: Math.round(hd.size) }));
    if (items.length && !chips) F.left.push("selling points");
    // the band takes what its contents reach; what is over is shared: each gap grows by the same step, the rest above and below
    const need = Math.min(band, S.need), spare = Math.max(0, band - need);
    const nStretch = 1 + (claim ? 1 : 0) + (tagB ? 1 : 0) + (labB ? 1 : 0) + (foot ? 1 : 0);
    const stretch = Math.min(g * 1.3, spare / (nStretch + 1.5)), bandH = need, pad = (spare - stretch * nStretch) / 2;
    let y = eyT + Math.max(0, pad);
    const R = F.rects, put = (name, c, cx = mid) => { const r = [cx - c.width / 2, y, cx + c.width / 2, y + c.height]; R[name] = r; y += c.height; return r; };
    if (claim) { const r = put("claim", claim.c); claim.x = r[0]; claim.y = r[1]; y += g * gClaim + stretch; }
    const y0 = y, xs = hd.lines.map(L => mid - L.inkW / 2);
    const block = [Math.min(...xs), y0, Math.max(...hd.lines.map((L, i) => xs[i] + L.inkW)), y0 + hd.blockH];
    R.headline = block.slice(); y += hd.blockH;
    let tagXY = null;
    if (tagB) { y += tagGap(hd) + stretch; const r = put("line", tagB.c); tagXY = [r[0], r[1]]; }
    const outer = [Math.min(block[0], tagXY ? tagXY[0] : W), block[1], Math.max(block[2], tagXY ? tagXY[0] + tagB.c.width : 0), y];
    y += g * gBand + stretch * .5;
    const bandTop = y, bandBot = y + bandH; y = bandBot + g * gBand + stretch * .5;
    let labXY = null;
    if (labB) { const r = put("call to action", labB.c); labXY = [r[0], r[1]]; y += g * gLab + stretch; }
    // the pill is what is spaced and measured; its sprite carries the shadow's margin round it
    const nr = R.number = [mid - num.w / 2, y, mid + num.w / 2, y + num.h], nxy = [nr[0] - num.pad, nr[1] - num.pad]; y += num.h;
    let footXY = null;
    if (foot) { y += g * gFoot + stretch; const r = put("footer", foot.c); footXY = [r[0], r[1]]; }
    F.band = [cx0, bandTop, cx1, bandBot]; F.mode = S.mode;

    // where the row of the product and its eye-catchers stands: [x0, x1] and its middle line
    let rowX0, rowX1, rowCy;
    if (wide) {
      if (chips) { chips.x = mid - chips.q.w / 2; chips.y = bandTop + (bandH - chips.q.h) / 2; }
      rowX0 = W * .59; rowX1 = W - e; rowCy = H / 2;
    } else if (side) {
      // the points and the product's row centred together across the column
      const total = (chips ? chips.q.w + (sub.w ? gx : 0) : 0) + sub.w, x0 = cx0 + (colW - total) / 2;
      if (chips) { chips.x = x0; chips.y = bandTop + (bandH - chips.q.h) / 2; }
      rowX0 = x0 + (chips ? chips.q.w + gx : 0); rowX1 = rowX0 + sub.w; rowCy = bandTop + bandH / 2;
    } else if (S.mode === "tall") {
      const rowW = chips.q.w + gx + S.rb * 2, x0 = mid - rowW / 2;
      chips.x = x0; chips.y = bandTop + (S.topH - chips.q.h) / 2;
      F.burst = { x: x0 + chips.q.w + gx + S.rb, y: bandTop + S.topH / 2, R: S.rb };
      const top = bandTop + S.topH + g * 1.4;
      rowX0 = cx0; rowX1 = cx1; rowCy = top + (bandBot - top) / 2;
    } else {
      if (chips) { chips.x = mid - chips.q.w / 2; chips.y = bandTop; }
      const top = bandTop + (chips ? chips.q.h + g * 1.4 : 0);
      rowX0 = cx0; rowX1 = cx1; rowCy = top + (bandBot - top) / 2;
    }
    if (chips) R["selling points"] = [chips.x, chips.y, chips.x + chips.q.w, chips.y + chips.q.h];
    F.chips = chips;

    /* ---- the product at its size; the sticker and the icon beside it ---- */
    if (S.mode !== "tall") F.burst = null;
    else R.sticker = [F.burst.x - F.burst.R, F.burst.y - F.burst.R, F.burst.x + F.burst.R, F.burst.y + F.burst.R];
    F.iconSlot = null; F.subjectFit = hasPhones ? sub.k : 1; F.group = null;
    if (hasPhones && sub.k > 0) {
      const k = sub.k, x0 = rowX0 + (rowX1 - rowX0 - sub.w) / 2, gcx = x0 + gw * k / 2, ocx = (G[0] + G[2]) / 2, ocy = (G[1] + G[3]) / 2;
      for (const q of this.phones) { q.home = [gcx + (q.home[0] - ocx) * k, rowCy + (q.home[1] - ocy) * k]; q.size *= k; }
      this.stageC = [gcx, rowCy]; this.stageSpan = [gcx - gw * k / 2, gcx + gw * k / 2];
      F.group = [gcx - gw * k / 2, rowCy - gh * k / 2, gcx + gw * k / 2, rowCy + gh * k / 2];
      R.product = F.group.slice();
      if (sub.below) {
        // the product at the top of its box, the sticker (and the icon beside it) centred under it
        const rb = sub.rb, ri = sub.ri, top = rowCy - sub.h / 2, mx = (rowX0 + rowX1) / 2, dy = top + gh * k / 2 - rowCy;
        for (const q of this.phones) q.home = [q.home[0] + mx - gcx, q.home[1] + dy];
        this.stageC = [mx, top + gh * k / 2]; this.stageSpan = [mx - gw * k / 2, mx + gw * k / 2];
        F.group = [mx - gw * k / 2, top, mx + gw * k / 2, top + gh * k]; R.product = F.group.slice();
        const rowW = rb * 2 + (ri ? gx + ri * 2 : 0), bx = mx - rowW / 2 + rb, by = top + gh * k + g * 1.6 + rb;
        F.burst = { x: bx, y: by, R: rb }; R.sticker = [bx - rb, by - rb, bx + rb, by + rb];
        if (ri) { const ix = bx + rb + gx + ri; F.iconSlot = { x: ix, y: by, R: ri }; R.icon = [ix - ri, by - ri, ix + ri, by + ri]; }
      } else if (sub.rb) {
        const rb = sub.rb, ri = sub.ri, bx = x0 + gw * k + gx * .8 + rb, by = rowCy - sub.colH / 2 + rb;
        F.burst = { x: bx, y: by, R: rb };
        R.sticker = [bx - rb, by - rb, bx + rb, by + rb];
        if (ri) { const iy = by + rb + g * 1.5 + ri; F.iconSlot = { x: bx, y: iy, R: ri }; R.icon = [bx - ri, iy - ri, bx + ri, iy + ri]; }
      }
    }

    /* ---- hand the engine its layout ---- */
    const pos = { ok: true, xs, y0, oy: y0, block, board: null, outer, tag: tagXY, num: nxy, label: labXY, site: footXY };
    Object.assign(this, { size: hd.size, lines: hd.lines, lineH: hd.lineH, blockH: hd.blockH, margin: e, tag: tagB ? tagB.c : null, num, pos });
    this.st.tag = tagB ? (line || "") : "";
    this._lay = { size: hd.size / H, bestN: hd.n, nSize: nz / H, dropLabel: !labB };
    this.claim = claim; this.site = foot ? foot.c : null;
    Object.assign(F.px, { headline: Math.round(hd.size), number: Math.round(nz), line: tagB ? Math.round(tagB.px) : 0, cta: labB ? Math.round(labB.px) : 0,
      footer: foot ? foot.px : 0, claim: claim ? claim.px : 0, chips: chips ? Math.round(chips.fs) : 0 });
    this._hookText();
  }

  /** A product's own pictures are drawn as they are, face on: the engine's phone painter turns a
   *  picture as a phone (a screen behind it, rails down its sides), which a console, a ring or a
   *  car is not (the social studio's CampaignAd does the same for a photograph of stock). Each
   *  rises into its place with a floor shadow under it, then breathes. */
  _phonesLayer(t, dt, quality) {
    if (!this.phones.some(q => q.meta && q.meta.flat)) return super._phonesLayer(t, dt, quality);
    const ctx = this.acc.getContext("2d"), H = this.H;
    ctx.globalAlpha = 1; ctx.drawImage(this.bg, 0, 0);
    this._drawRays(ctx, t);
    if (this.liveGround) this._drawLiveGround(ctx, t);
    this.drawOrder.forEach((i, n) => {
      const q = this.phones[i], p = prog(t, .12 + n * .14, .6); if (p <= 0) return;
      const w = q.w * q.size, h = q.h * q.size, rise = (1 - (1 - (1 - p) ** 3)) * H * .05;
      const s = (.84 + .16 * outBack(p, 1.3)) * (1 + .012 * Math.sin((t + n * .7) * Math.PI * 2 / 2.6) * Math.min(1, Math.max(0, t - 1.2)));
      ctx.save(); ctx.globalAlpha = Math.min(1, p * 1.5);
      ctx.save(); ctx.translate(q.home[0], q.home[1] + h * .49); ctx.scale(w * .5, Math.max(4, h * .05));
      const sh = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); sh.addColorStop(0, "rgba(0,0,0,.42)"); sh.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sh; ctx.fillRect(-1, -1, 2, 2); ctx.restore();
      ctx.translate(q.home[0], q.home[1] + rise); ctx.scale(s, s);
      ctx.drawImage(q.img, -w / 2, -h / 2, w, h);
      ctx.restore();
    });
    return this.acc;
  }

  /** The selling points go where the layout put them (the engine's search is not run). */
  _placePerks(avoid) {
    this.perks = null;
    const C = this.full && this.full.chips; if (!C) return;
    const q = C.q, cx = C.x + q.w / 2;
    this.perks = { sp: q, x: C.x - q.pad, y: C.y - q.pad, fs: C.fs, n: C.n, align: "l", t0: this.tl.number + .35, dir: cx < this.W * .4 ? -1 : cx > this.W * .6 ? 1 : 0 };
    avoid.push([C.x, C.y, C.x + q.w, C.y + q.h]);
  }

  _buildDecor() {
    const F = this.full, st = this.st, R = F.rects;
    this.keepClear = ["claim", "footer", "sticker", "icon"].map(k => R[k]).filter(Boolean);
    super._buildDecor();
    this.numBox = R.number.slice();                       // the pill alone: the chevrons centre on it, not on the label over it
    // the sticker, in the card's own ink (two colour families to a card: no third hue for a sticker)
    this.burst = null;
    if (F.burst) {
      const ph = this.pHead, fill = ph.ink, inkc = contrastOf(fill, this.p.ground) >= 3 ? this.p.ground : (lum(fill) > .5 ? "#111111" : "#ffffff");
      this.burst = { ...F.burst, fill, ink: inkc, text: st.feed_burst || (st.lang === "es" ? "PAGO HOY" : "CASH!"), t0: this.tl.hit + .12, font: burstFontFor(st) };
      this.cues.burst = this.burst.t0;
      // the size its words come out at (decor.js drawStarburst: two rows for two words, shrunk until the widest fits)
      const text = applyCase(this.burst.text, "upper"), ws = text.split(" "), rows = ws.length > 1 && text.length > 6 ? [ws.slice(0, Math.ceil(ws.length / 2)).join(" "), ws.slice(Math.ceil(ws.length / 2)).join(" ")] : [text];
      const m = canvas(4, 4).getContext("2d"); let fs = F.burst.R * (rows.length > 1 ? .42 : .5);
      m.font = fontCss(this.burst.font, fs);
      while (Math.max(...rows.map(l => m.measureText(l).width)) > F.burst.R * 1.3 && fs > 6) { fs *= .92; m.font = fontCss(this.burst.font, fs); }
      F.px.sticker = Math.round(fs);
    }
    // one 3D icon in its slot (the engine resolves the artwork; the slot is this layout's)
    this.accents = [];
    if (F.iconSlot && st.feed_icon !== "") {
      const a = placeAccents({ ...st, accents: 1, accent_set: st.feed_icon || st.accent_set || "cash", accent_kind: "asset" }, this.W, this.H, [], null, (this.assets || {}).accents, rng(st.seed * 61 + 3), 0, this.stageC)[0];
      if (a && a.as === "asset") { Object.assign(a, F.iconSlot); this.accents = timeAccents([a], this.tl, this.tOutro); }
      else delete R.icon;
    }
    // the chevrons either side of the number, where the pill leaves them their room
    const nb = this.numBox, sz = (nb[3] - nb[1]) * .42;
    this.fullChevrons = Math.min(nb[0] - F.col[0], F.col[1] - nb[2]) >= sz * 2.9 ? sz : 0;
  }

  frame(ctx, t, quality, dt) {
    super.frame(ctx, t, quality, dt);
    const C = this.claim, U = this.full.U;
    if (C) {
      // pops in with the headline, then its glow breathes (a 1.6 s pulse) for the rest of the ad
      const q = prog(t, Math.max(.1, (this.tl.text ?? .25) - .15), .45);
      if (q > 0) {
        const s = .7 + .3 * outBack(q), cx = C.x + C.c.width / 2, cy = C.y + C.c.height / 2, glow = .5 + .5 * Math.sin(t * Math.PI * 2 / 1.6);
        ctx.save(); ctx.globalAlpha = Math.min(1, q * 2); ctx.translate(cx, cy); ctx.scale(s, s);
        ctx.shadowColor = C.fill; ctx.shadowBlur = U * (.012 + .018 * glow);
        ctx.drawImage(C.c, -C.c.width / 2, -C.c.height / 2); ctx.restore();
      }
    }
    if (this.site && this.pos.site) {
      const q = prog(t, this.tl.number + .15, .35);
      if (q > 0) { ctx.save(); ctx.globalAlpha = q; ctx.drawImage(this.site, this.pos.site[0], this.pos.site[1] + (1 - q) * U * .02); ctx.restore(); }
    }
    this._chevrons(ctx, t);
  }

  /** Three chevrons either side of the number, larger the nearer they stand to it, a glow
   *  running inward along them. (The engine's own light one of three by the clock, so a photo
   *  caught whichever was lit: the outer one on one ad, the middle one on the next.)
   *  Every chevron is the pair's accent at full strength. They first stepped toward the number
   *  in opacity (.32, .6, 1), and a see-through accent is the accent mixed into the ground in
   *  sRGB: gold over navy drew #504b3a (OKLCH C .028, khaki-grey), orange over navy a brown,
   *  gold over purple a rose-brown (hue 25, a third family), lime-gold over green an olive. Rule
   *  103: an accent keeps C .12 or more, and a warm hue is never drawn under its muddy floor. So
   *  the step is in size and weight, which no ground can turn into a third colour (rule 138). */
  _chevrons(ctx, t) {
    const sz = this.fullChevrons; if (!sz) return;
    const q = prog(t, this.tl.number + .3, .3); if (q <= 0) return;
    const [x0, y0, x1, y1] = this.numBox, cy = (y0 + y1) / 2, pulse = Math.floor(t * 5) % 3, K = CHEVRON_STEP;
    // each tip .6 of the size off the pill, then a step of .9 of the two neighbours' mean size: a smaller chevron stands nearer its neighbour
    const tip = [sz * (.6 + .9 * ((K[2] + K[1]) / 2 + (K[1] + K[0]) / 2)), sz * (.6 + .9 * (K[2] + K[1]) / 2), sz * .6];
    ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = this.hot; ctx.shadowColor = this.hot; ctx.globalAlpha = q;
    for (let i = 0; i < 3; i++) {                           // 0 is the farthest from the number
      const k = K[i], d = tip[i], lx = x0 - d, rx = x1 + d, ax = sz * .35 * k, ay = sz * .45 * k;
      ctx.lineWidth = Math.max(2, sz * .28 * k);
      ctx.shadowBlur = i === 2 ? sz * .6 : i === pulse ? sz * .35 : 0;
      ctx.beginPath(); ctx.moveTo(lx - ax, cy - ay); ctx.lineTo(lx, cy); ctx.lineTo(lx - ax, cy + ay); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(rx + ax, cy - ay); ctx.lineTo(rx, cy); ctx.lineTo(rx + ax, cy + ay); ctx.stroke();
    }
    ctx.restore();
  }
}

/** The style a full ad is drawn with: the customer's words and phones, the house style locked,
 *  and one colourway, ground, arrangement and icon for the seed (or the ones picked). Every
 *  element gets its words: what the customer left empty is filled from FULL_WORDS. keep: what
 *  the customer set by hand elsewhere in the maker (their music, their voice), left as set. */
export function fullStyle(st, seed, phoneIndex = [], pick = {}, keep = []) {
  const r = rng((seed >>> 0) * 7 + 11), one = a => a[Math.floor(r() * a.length) % a.length];
  const es = st.lang === "es";
  // the colours: one of the twelve by the seed (of those that suit the line and any colour its
  // headline names: pairsFor), or the one picked; carried as the palette's own colours (the
  // engine's pal() lays st.colors over the palette named), so the catalogue is not touched
  const first = one(pairsFor(st.subject, st.headline)), key = COLOUR_OF[pick.palette] ? pick.palette : first, { palette: _p, ...picked } = pick;
  const look = { palette: "midnight", colors: { ...COLOUR_OF[key].colors }, full_colour: key, background: one(GROUNDS), arrangement: one(ARRANGEMENTS), feed_icon: one(ICONS), ...picked };
  const area = (st.area || "").trim();
  // What the customer left empty is filled from the lists, each line chosen so that it does not
  // repeat a promise the lines before it already make (the customer's own words are never changed:
  // fullWords() says where they repeat). The order is the order they are read in.
  const fresh = (list, said) => { const start = Math.floor(r() * list.length); for (let i = 0; i < list.length; i++) { const w = list[(start + i) % list.length]; if (!said.some(x => sharesWord(w, x))) return w; } return list[start]; };
  const line = st.feed_line ?? (st.tag || one(FULL_WORDS.line));
  const points = st.points ?? (pointsOf(st).length ? pointsOf(st).join(", ") : fresh(FULL_WORDS.points, [st.headline, line]));
  const label = st.number_label || (es ? "LLAMA O MANDA TEXTO" : FULL_WORDS.label[0]);
  const claim = st.feed_claim ?? fresh(FULL_WORDS.claim, [st.headline, line, points]);
  const burst = st.feed_burst ?? fresh(es ? FULL_WORDS.burst_es : FULL_WORDS.burst, [st.headline, line, points, claim, label]);
  const words = {
    feed_claim: claim, feed_line: line, points, number_label: label,
    feed_where: st.feed_where ?? (area ? area.toUpperCase() : ""),
    // the website as a sentence, so it reads as an address (owner, 2026-11-03: "that way they know it's a URL")
    feed_site: st.feed_site ?? (st.site ? (es ? "Visítanos en " : "Visit our website at ") + String(st.site).trim() : ""),
    feed_burst: burst,
    accent_word: accentWord(st.headline, look.colors.accent),
  };
  // fewer phones, larger (five on a square full of large words shrank to a strip): two where the
  // product shares its row with the selling points (a square, a wide frame), three where it has the width
  // (a subject from the offer family brings its own set of one or two pictures: all of it)
  const subject = !!st.subject && st.subject !== "iphone";
  const most = subject ? 4 : st.aspect === "4:5" || st.aspect === "9:16" ? 3 : 2;
  const have = (st.phones || []).slice(0, most);
  const base = { ...DEFAULT_STYLE, ...st, ...QUIET, ...look, ...words, phones: have, full: true, seed };
  const locked = new Set([...keep, ...Object.keys(QUIET), ...Object.keys(look), ...Object.keys(words), "phones", "headline", "tag", "number", "aspect", "duration", "lang", "lang_mode", "area", "full", "accent_word", "strike_text", "hook_text"]);
  const pool = have.length || subject ? [] : phoneIndex.map(m => m.id);   // another product never borrows iPhones
  const idx = Object.fromEntries(phoneIndex.map(m => [m.id, m]));
  const out = harmonise(randomize(base, seed, locked, pool, false), locked, idx);
  // the voice-over's lines are about phones: an ad for anything else plays its music alone
  const quiet = subject ? { voice: "off", vo_clip: "", vo_text: "" } : {};
  return { ...out, ...QUIET, ...look, ...words, ...quiet, full: true, phones: subject ? have : (out.phones || []).slice(0, most) };
}

/** What would stop this ad going out, in words: a block left out for want of room, a block
 *  inside the margin, two blocks nearer than the gap, type under its floor, a product too
 *  small to read as one. Empty when the ad is sound. */
export function fullBlockers(ad) {
  const F = ad.full, out = [], U = F.U, R = F.rects, W = ad.W, H = ad.H;
  for (const k of F.left) out.push(k + " left out: no room at a readable size");
  const edge = U * FULL.edge - .5;
  for (const [name, r] of Object.entries(R)) if (r.some(n => !Number.isFinite(n)) || r[0] < edge || r[1] < edge || r[2] > W - edge || r[3] > H - edge) out.push(name + " inside the margin");
  const names = Object.keys(R), gap = U * FULL.gap * .7;
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
    const a = R[names[i]], b = R[names[j]], dx = Math.max(a[0] - b[2], b[0] - a[2]), dy = Math.max(a[1] - b[3], b[1] - a[3]);
    if (names[i] === "headline" && names[j] === "line") { if (dy < U * .006) out.push("headline and line touch"); continue; }
    if (dx < 0 && dy < 0) out.push(`${names[i]} and ${names[j]} overlap`);
    else if (Math.max(dx, dy) < gap) out.push(`${names[i]} and ${names[j]} ${Math.round(Math.max(dx, dy) / U * 1080)}px apart`);
  }
  const floor = { headline: .064, number: .07, line: FULL.tagMin, cta: FULL.labelMin, footer: FULL.footMin, claim: FULL.claimMin, chips: FULL.chipMin, sticker: .026 };
  for (const [k, v] of Object.entries(F.px)) if (v && v < U * floor[k] - 1) out.push(`${k} set at ${Math.round(v / U * 1080)}px, under its floor`);
  if (ad.phones.length) { const gph = F.group ? (F.group[3] - F.group[1]) / H : 0; if (gph < (F.wide ? .3 : .15)) out.push(`product ${Math.round(gph * 100)}% of the height`); }
  return out;
}

/** How full the frame is, and how even: the numbers the check script holds an ad to. */
export function fullMeasure(ad) {
  const F = ad.full, R = F.rects, W = ad.W, H = ad.H, U = F.U;
  const area = Object.values(R).reduce((a, r) => a + Math.max(0, r[2] - r[0]) * Math.max(0, r[3] - r[1]), 0) / (W * H);
  const k = 1080 / U, px = Object.fromEntries(Object.entries(F.px).map(([n, v]) => [n, Math.round(v * k)]));
  const smallest = Math.min(...Object.values(px).filter(Boolean));
  return { blocks: Object.keys(R), fill: +area.toFixed(3), px, smallest, product: F.group ? +((F.group[3] - F.group[1]) / H).toFixed(3) : 0, sticker: !!F.burst, icon: !!(ad.accents && ad.accents.length), chevrons: !!ad.fullChevrons };
}

/** A subject's set of pictures (motion/subjects.json, from the offer family) as the engine's
 *  assets: { ids, assets }. Each is marked flat, so FullAd draws it as it is. */
export async function loadSubjectSet(subject, setIndex = 0, base = "../assets/cutouts/") {
  const sets = subject.sets || [];
  if (!sets.length) return { ids: [], assets: {} };
  const set = sets[((setIndex % sets.length) + sets.length) % sets.length], assets = {}, ids = [];
  await Promise.all(set.map(async ({ file, k }) => {
    const img = await new Promise((res, rej) => { const i = new Image(); i.decoding = "async"; i.onload = () => res(i); i.onerror = () => rej(new Error("The picture " + file + " did not load.")); i.src = base + file + ".webp"; });
    const id = "sub-" + file;
    assets[id] = { img, meta: { id, model: subject.label, finish: "", w: img.naturalWidth, h: img.naturalHeight, metal: "#888888", flat: true, k: k || 1 } };
  }));
  for (const { file } of set) ids.push("sub-" + file);
  return { ids, assets };
}

/* ══════════════════════════════════════════════════════════════════════════════════════════
   THE PRE-FLIGHT (2026-11-12): the ad checks itself before it goes out

   Owner: "is there anything we can do to add another layer of intelligence another layer of self
   validating or auditing before it's generated or in the generating process", and "how do these
   ads never have mistakes always look perfect".

   The layout above is its own first check (fullBlockers reads the layout's numbers). A layout's
   numbers are what it meant to draw. This reads what it drew: the delivered picture, pixel by
   pixel, with none of the layout's code in the measuring, plus the words as words. The house
   rule it serves is DESIGN-LAW 87 (every generation is measured before it is produced) and the
   brief's warning under it: a check that shares the mistake it is checking for passes it.

   On the picture (frame: the ad as delivered; ad.bg: its ground alone):
     edge        nothing drawn nearer the frame's edge than 1.6% of the short side (17px of 1080)
     reads       every line against the pixels actually behind its letters: 4.5:1 for the small
                 lines, 3:1 for the headline and the number (a product, a sticker or a glow under
                 a line counts, because it is in the picture)
     product     the product stands off the ground behind it: 1.25:1 at the middle of each
     feed        the headline and the number are still letters on a feed's small preview (the
                 picture at a quarter of its size): 20px and 16px tall at least
   On the words:
     once        no promise made twice (two lines sharing a word's stem)
     proof       no claim that needs proof ("#1", "best", "highest", "fastest", "guaranteed"),
                 and no "up to" price, which buyers read as the usual one (FTC, 2012)
     address     the website reads as an address; the number is a number
   And the layout's own (fullBlockers): margins, gaps, floors, the product's share.

   Each finding is { code, level, say }: level "fix" stops a download until the customer says
   go on; "note" is said and does not stop it. say is in the customer's words (rule 113). */
const PF = { edge: .016, small: 4.5, large: 3, product: 1.25, thumbHead: 20, thumbNum: 16 };   // edge: 17px of 1080; a shadow's fringe on a light ground reaches 21
const PROOF = /(^|[^A-Z0-9])(#\s?1|NO\.?\s?1|NUMBER ONE|BEST|HIGHEST|FASTEST|GUARANTEED?|MOST MONEY|LOWEST|UNBEATABLE)([^A-Z0-9]|$)/i;

/** The words alone: what repeats, what needs proof, what will not read as what it is. */
export function fullWords(st) {
  const out = [], say = (code, level, s) => out.push({ code, level, say: s });
  const parts = [["headline", st.headline], ["line under the headline", st.feed_line], ["claim", st.feed_claim], ["selling points", st.points], ["sticker", st.feed_burst]].filter(p => p[1]);
  // a promise made twice: the claim, the points and the sticker against each other (the headline and its
  // line name the goods, and may share the goods' name with anything)
  const promises = parts.filter(p => ["claim", "selling points", "sticker"].includes(p[0]));
  for (let i = 0; i < promises.length; i++) for (let j = i + 1; j < promises.length; j++) {
    const A = stems(promises[i][1]), shared = [...stems(promises[j][1])].filter(w => A.has(w));
    if (shared.length) say("once", "note", `The ${promises[i][0]} and the ${promises[j][0]} both say ${shared[0]}. Say it once and use the other for something new.`);
  }
  for (const [name, text] of parts) {
    const m = PROOF.exec(String(text)); if (m) say("proof", "note", `"${m[2].trim().toUpperCase()}" in the ${name} is a claim you may be asked to prove. "Top dollar" or "fair offer" says it without the risk.`);
    if (/\bUP TO\s*\$?\d/i.test(String(text))) say("proof", "note", `"Up to" a price in the ${name} is read as the usual price. Name what you pay for one model, or leave the price out.`);
  }
  const site = String(st.site || st.feed_site || "").trim();
  if (site && !/[a-z0-9-]+\.[a-z]{2,}/i.test(site)) say("address", "note", "The website does not look like an address. Write it as it is typed, like www.yourshop.com.");
  const digits = String(st.number || "").replace(/\D/g, "");
  if (!digits) say("address", "fix", "There is no phone number on the ad.");
  else if (!(digits.length === 10 || (digits.length === 11 && digits[0] === "1") || (String(st.number).trim()[0] === "+" && digits.length >= 8))) say("address", "note", `The phone number has ${digits.length} digits. A US number has 10.`);
  const pts = String(st.points || "").split(",").map(s => s.trim()).filter(Boolean);
  if (pts.some(p => p.length > 18)) say("once", "note", "A selling point is long. Three or four short words read best in a chip.");
  return out;
}

/** The delivered picture, measured. frame: a canvas holding the ad as drawn at ad.W x ad.H, every
 *  block landed. Returns { ok, checks: [{ id, ok, value }], findings: [{ code, level, say }] }. */
export function fullPreflight(ad, frame) {
  const F = ad.full, R = F.rects, W = ad.W, H = ad.H, U = F.U, st = ad.st;
  const findings = [], checks = [], say = (code, level, s) => findings.push({ code, level, say: s });
  const px = frame.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, W, H).data;
  const bg = ad.bg.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, W, H).data;
  const lin = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
  const Lat = (d, q) => .2126 * lin(d[q]) + .7152 * lin(d[q + 1]) + .0722 * lin(d[q + 2]);
  const Lhex = h => { const [r, g, b] = [1, 3, 5].map(i => lin(parseInt(h.slice(i, i + 2), 16))); return .2126 * r + .7152 * g + .0722 * b; };
  const cr = (a, b) => (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  const drawn = q => Math.abs(px[q] - bg[q]) + Math.abs(px[q + 1] - bg[q + 1]) + Math.abs(px[q + 2] - bg[q + 2]) > 96;   // a letter, a plate, a product: not a glow

  // edge: the box of everything drawn, against the frame
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (drawn((y * W + x) * 4)) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const near = x1 < 0 ? U : Math.min(x0, y0, W - 1 - x1, H - 1 - y1), edgeOk = near >= U * PF.edge;
  checks.push({ id: "edge", ok: edgeOk, value: `${Math.round(near / U * 1080)}px from the edge` });
  if (!edgeOk) say("edge", "fix", "Something on the ad runs to the edge of the picture and may be cut off when it is posted.");

  /* reads: inside a block's box, the pixels of its ink's colour are its letters; what stands behind
     them is every pixel that is not a letter NOR within a few pixels of one. That ring matters: a
     letter's soft edge is a blend of ink and ground, and counted as ground it reads 1:1 however
     clear the type is (docs/THEME-AUDIT.md, correction 1: the first cut of this check failed
     readable lines on exactly that, 2026-11-12). The ground's worst tenth (its brightest under
     light ink, its darkest under dark) must still give the ratio. */
  const reads = (r, inkHex) => {
    const bx0 = Math.max(0, r[0] | 0), by0 = Math.max(0, r[1] | 0), bw = Math.min(W, Math.ceil(r[2])) - bx0, bh = Math.min(H, Math.ceil(r[3])) - by0;
    if (bw < 6 || bh < 6) return 99;
    const Li = Lhex(inkHex), light = Li >= .18, n = bw * bh, Lm = new Float32Array(n), isInk = new Uint8Array(n);
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) { const L = Lat(px, ((by0 + y) * W + bx0 + x) * 4), i = y * bw + x; Lm[i] = L; if (cr(L, Li) < 1.6) isInk[i] = 1; }
    // the ring round the letters: grown by d pixels, across then down
    const d = Math.max(2, Math.round(U * .0045)), row = new Uint8Array(n), ring = new Uint8Array(n);
    for (let y = 0; y < bh; y++) { let run = -1e9; for (let x = 0; x < bw; x++) { if (isInk[y * bw + x]) run = x; if (x - run <= d) row[y * bw + x] = 1; } run = 1e9; for (let x = bw - 1; x >= 0; x--) { if (isInk[y * bw + x]) run = x; if (run - x <= d) row[y * bw + x] = 1; } }
    for (let x = 0; x < bw; x++) { let run = -1e9; for (let y = 0; y < bh; y++) { if (row[y * bw + x]) run = y; if (y - run <= d) ring[y * bw + x] = 1; } run = 1e9; for (let y = bh - 1; y >= 0; y--) { if (row[y * bw + x]) run = y; if (run - y <= d) ring[y * bw + x] = 1; } }
    const Ls = []; for (let i = 0; i < n; i += 2) if (!ring[i]) Ls.push(Lm[i]);
    if (Ls.length < 24) return 99;                          // letters fill the box: nothing behind them to measure
    Ls.sort((a, b) => a - b);
    return cr(Li, Ls[Math.min(Ls.length - 1, Math.floor(Ls.length * (light ? .9 : .1)))]);
  };
  // a pill's box holds its round ends, where the ground shows: the words are measured on the pill's straight middle
  const inPill = r => { const h = r[3] - r[1]; return [r[0] + h * .5, r[1] + h * .14, r[2] - h * .5, r[3] - h * .14]; };
  const ink = ad.pHead.ink, plateInk = contrastOf(ad.p.plate_ink, ad.p.plate) >= 3.5 ? ad.p.plate_ink : (lum(ad.p.plate) > .5 ? "#111111" : "#ffffff");
  const lines = [["line", "the line under the headline", ink, PF.small], ["call to action", "the line over the number", ink, PF.small], ["footer", "the towns and website", ink, PF.small],
    ["number", "the phone number", plateInk, PF.large], ["claim", "the claim", ad.claim ? ad.claim.ink : plateInk, PF.small]];
  let worst = 99, worstName = "";
  for (const [key, name, col, need] of lines) {
    let r = R[key]; if (!r) continue;
    if (key === "number") r = inPill(r);
    if (key === "claim") r = inPill([ad.claim.x, ad.claim.y, ad.claim.x + ad.claim.c.width, ad.claim.y + ad.claim.c.height]);
    const got = reads(r, col);
    if (got < worst) { worst = got; worstName = name; }
    if (got < need) say("reads", got < need * .8 ? "fix" : "note", `${name[0].toUpperCase() + name.slice(1)} is hard to read against what is behind it. Try another colour, or New look.`);
  }
  checks.push({ id: "reads", ok: !findings.some(f => f.code === "reads"), value: worst > 90 ? "every line clear" : `${worst.toFixed(1)}:1 at the least (${worstName})` });

  // product: the middle of each product against the ground behind it
  if (F.group && ad.phones.length) {
    let low = 99;
    for (const q of ad.phones) {
      const cx = q.home[0] | 0, cy = q.home[1] | 0, s = Math.max(4, Math.round(Math.min(q.w, q.h) * q.size * .12)), P = [], G = [];
      for (let y = cy - s; y <= cy + s; y += 2) for (let x = cx - s; x <= cx + s; x += 2) { if (x < 0 || y < 0 || x >= W || y >= H) continue; const o = (y * W + x) * 4; P.push(Lat(px, o)); G.push(Lat(bg, o)); }
      if (!P.length) continue;
      const mid = a => { a.sort((u, v) => u - v); return a[a.length >> 1]; };
      low = Math.min(low, cr(mid(P), mid(G)));
    }
    const pOk = low >= PF.product;
    checks.push({ id: "product", ok: pOk, value: low > 90 ? "clear" : `${low.toFixed(2)}:1 against the ground` });
    if (!pOk) say("product", "note", "One of the products is close to the background's colour and may be hard to see. Try another colour for the ad.");
  }

  // feed: the letters' height on a small preview (the picture at a quarter of its size)
  const k = 270 / U, hPx = Math.round((F.px.headline || 0) * .72 * k), nPx = Math.round((ad.num && ad.num.inkH ? ad.num.inkH : (F.px.number || 0) * .72) * k);
  const feedOk = hPx >= PF.thumbHead && nPx >= PF.thumbNum;
  checks.push({ id: "feed", ok: feedOk, value: `headline ${hPx}px and number ${nPx}px tall in a feed preview` });
  if (hPx < PF.thumbHead) say("feed", "note", "The headline is long, so it is set small: it may not read in a feed's small preview. A shorter headline is set larger.");
  if (nPx < PF.thumbNum) say("feed", "note", "The phone number is small in a feed's preview.");

  // the layout's own findings, and the words
  const lay = fullBlockers(ad), soft = /^(product \d+% of the height|headline set at)/;
  checks.push({ id: "layout", ok: !lay.some(w => !soft.test(w)), value: lay.length ? lay[0] : "every block in its place" });
  for (const w of lay) {
    if (/^headline set at/.test(w)) continue;                                     // said by the feed check
    if (/^product \d+%/.test(w)) say("layout", "note", "The product is small on this size. A shorter headline, or the Feed 4:5 size, gives it more room.");
    else if (/left out/.test(w)) say("layout", "fix", /selling points/.test(w) ? "The selling points did not fit. Use shorter ones, or a shorter headline." : `The ${w.split(" left out")[0].replace("line", "line under the headline").replace("footer", "towns and website")} did not fit at a readable size. Shorten it.`);
    else if (/sticker set at/.test(w)) say("layout", "note", "The sticker's words are long, so they are set small. One or two short words read best.");
    else say("layout", "fix", "Two parts of the ad are too close together or outside the margin. Shorter words will fix it.");
  }
  const words = fullWords(st);
  checks.push({ id: "words", ok: !words.length, value: words.length ? words[0].say : "no promise twice, nothing that needs proof" });
  findings.push(...words);
  const seen = new Set(), uniq = findings.filter(f => !seen.has(f.say) && seen.add(f.say));
  return { ok: !uniq.some(f => f.level === "fix"), clean: !uniq.length, checks, findings: uniq };
}

/** The ad drawn as it will be delivered (every block landed), for the pre-flight and for a photo. */
export function fullStill(ad) {
  const c = canvas(ad.W, ad.H), st = ad.st;
  const t = Math.max(isFinite(ad.tl.number) ? ad.tl.number + 1.2 : 0, (ad.tLanded || 0) + .6, (ad.tOutro != null ? ad.tOutro : st.duration) - .4);
  ad.still = null; ad.frame(c.getContext("2d"), t, { subsFly: 4, subsMove: 2 }, 1 / 30);
  return c;
}
