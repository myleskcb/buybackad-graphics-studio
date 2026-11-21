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
  headlineLines, numberSprite, perksSprite, pointsOf, randomize, harmonise, formatNumber, oklchOf } from "./engine.js";
import { FONTS, FINE_FACES, PALETTES, DEFAULT_STYLE, TYPE_VOICES, DEFAULT_PHONES } from "./catalog.js";
import { drawChevrons, fillGradient, fillTexture, okHex } from "./decor.js";
import { FULL_STYLES, pickFullStyles } from "./full-styles.js";
import { placeAccents, timeAccents } from "./accents.js";
import { HOUSE_COLOURS, LINES, PAIR_LOOKS } from "./house-colours.js";
import { FULL_VOICES } from "./full-voices.js";
import { bannedIn } from "./banned-words.js";
import { PHONE_WEIGHT, PHONE_REST, PHONE_VIEWS, PHONE_COUNTS, PHONE_LINEUP, pickWeighted } from "./product-demand.js";
import { GROUND_SHARES, GROUND_SCENES, GROUND_GRADIENTS, GROUND_PATTERNS, GROUND_POOLS, GROUND_LINE_CAT, GROUND_PHOTOS } from "./full-grounds.js";
import { leanStream, leanPick, pairAnswers } from "./recipe-lean.js";

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

/* THE FULL AD'S LAYOUT (rule 158, 2026-11-18). The owner: the full ads "look shockingly similar to one
   another", "I need text variety placements, and more than just copy variety"; rule 154 gave a seed its
   colours, ground, face and fills, and every ad still stood in one centred stack. Each choice below is a
   grammar the photo ads already speak, drawn from the seed on a stream of its own (drawLayout: the
   colours, ground, face, product and words a seed drew do not move), or picked and locked in the maker:
   - full_align: one alignment to a card, centred or every block on the column's left edge (rule 109);
   - full_order: the product's band in the middle, high (the headline under it) or low (the number over it);
   - full_side: the selling points left or right of the product (a wide frame: the product's side);
   - full_claim: the claim's badge a pill, a square tab, a ribbon with notched ends, or a bar the column's width;
   - full_chips: the points as pills, square tabs, or bare ticks on the ground;
   - full_cta: the call to action as a line over the number, or in a speech bubble pointing at it;
   - full_foot: the towns over the website, on one line, or on a band of the plate's colour.
   The sticker's shape and fill and the number's mark stay rule 154's and 157's. */
export const FULL_LAYOUT = {
  full_align: { center: 3, left: 2 },
  full_order: { classic: 3, hero_low: 2, number_high: 2 },
  full_side: { left: 1, right: 1 },
  full_claim: { pill: 3, tab: 2, ribbon: 2, bar: 2 },
  full_chips: { pill: 3, tab: 2, bare: 1 },
  full_cta: { line: 3, bubble: 1 },
  full_foot: { rows: 2, line: 2, band: 1 },
};
/** A seed's layout (or the choices picked), on a stream of its own. */
export function drawLayout(seed, pick = {}) {
  const r = rng(((seed >>> 0) ^ 0x2545f491) * 37 + 9), out = {};
  for (const [k, w] of Object.entries(FULL_LAYOUT)) { const v = r.weighted(Object.keys(w), w); out[k] = pick[k] != null && w[pick[k]] != null ? pick[k] : v; }
  return out;
}
/** The layout a style carries, made consistent with itself and the frame (a style made before rule 158 is the centred stack). */
export function layoutOf(st, wide) {
  const of = (k, d) => FULL_LAYOUT[k][st[k]] != null ? st[k] : d;
  const L = { align: of("full_align", "center"), order: of("full_order", "classic"), side: of("full_side", "left"), claim: of("full_claim", "pill"),
    chips: of("full_chips", "pill"), cta: of("full_cta", "line"), foot: of("full_foot", "rows") };
  if (L.align === "left" && !wide) L.side = "left";        // a left-aligned card keeps its points on its left edge
  return L;
}
/* THE SIGNS A HEADLINE MAY STAND ON (rule 158): a video look's sign board (the freeway sign, the swap meet
   poster, the price tag, the chalkboard, the LED panel...), its face round the headline and its line. A
   sign's posts, stakes and lamps are left off: they would reach down into the product's band or up into the
   claim's. BOARD_REACH: how far a sign reaches past its face, in headline sizes. */
export const FULL_BOARDS = new Set(["freeway", "freeway_blue", "poster", "bandit_yellow", "bandit_white", "flyer", "neon_box", "marquee", "store_sign",
  "price_tag", "chalkboard", "receipt", "wanted_poster", "sticky_note", "speech_bubble", "ticket_stub", "led_panel", "lightbox", "postcard",
  "billboard", "tiki_plank", "surfboard"]);
const BOARD_REACH = { speech_bubble: { b: .78 }, postcard: { t: .45, r: .3 }, freeway: { t: .32 }, freeway_blue: { t: .32 },
  billboard: { b: .45, l: .12, r: .12, t: .12 }, tiki_plank: { l: .34, r: .34 }, surfboard: { l: .55, r: .55 } };
/** The claim's badge as a path: a pill, a square tab, a ribbon with notched ends, or a bar. */
function claimPath(x, kind, w, h, lw) {
  const a = lw / 2, W = w - lw, H = h - lw, notch = kind === "ribbon" ? H * .32 : 0;
  x.beginPath();
  if (kind === "ribbon") { x.moveTo(a, a); x.lineTo(a + W, a); x.lineTo(a + W - notch, a + H / 2); x.lineTo(a + W, a + H); x.lineTo(a, a + H); x.lineTo(a + notch, a + H / 2); x.closePath(); }
  else x.roundRect(a, a, W, H, kind === "pill" ? H / 2 : H * (kind === "bar" ? .12 : .16));
}
/** The call to action in a speech bubble of the call to action's colour, its tail pointing down at the number. */
function bubbleBadge(text, px, hot, family, weight, left) {
  const ink = contrastOf(hot, "#111111") >= contrastOf(hot, "#ffffff") ? "#111111" : "#ffffff";
  const row = footRow(text, px, ink, family, weight);
  const h = Math.round(px * 1.62), tail = Math.round(h * .34), w = Math.round(row.width + px * 1.5);
  const c = canvas(w, h + tail), x = c.getContext("2d"), tx = left ? Math.min(w / 2, h * .95) : w / 2;
  x.fillStyle = hot; x.beginPath(); x.roundRect(0, 0, w, h, h / 2); x.fill();
  x.beginPath(); x.moveTo(tx - tail * .8, h - 1); x.lineTo(tx, h + tail); x.lineTo(tx + tail * .8, h - 1); x.closePath(); x.fill();
  x.drawImage(row, (w - row.width) / 2, (h - row.height) / 2);
  return c;
}
/** The small lines' ink: the palette's where it reads 4.5:1 on its ground, else whichever of near-black and
 *  white reads best (a video look's palette is chosen for a big headline with its shadow: teal's read 3.3:1). */
export const bodyInkOf = p => [p.ink, "#ffffff", "#111111"].reduce((a, c) => contrastOf(a, p.ground) >= 4.5 || contrastOf(a, p.ground) >= contrastOf(c, p.ground) ? a : c);

/** The house style (tools/feed-stills/render.mjs HOUSE and QUIET, 2026-11-03): one face, capitals,
 *  the double outline, one accent word, the number in a pill, and everything in the maker that
 *  puts small words or stray marks on the picture held off. */
export const HOUSE = { font: "chivo", text_fx: "double_outline", case: "brand", color_mode: "accent_word", number_style: "pill", text_pos: "top-center" };
/* THE TYPE PAIRS A FULL AD MAY WEAR (rule 141). The house style is one face; the owner's pairs
   (TYPE_VOICES, the photo ads' FONT_PAIRS, the Type Lab's picks among them) are offered on it
   where the full ad still passes its own checks in them. A display face too fine or too busy for
   the double outline (FINE_FACES) is never offered: the full ad's headline is always outlined.
   full-voices.js holds the rest, measured: scripts/full_type_check.mjs draws every pair in every
   size and writes the ones that pass (never edit it by hand). */
/** Whether a face can spell the small i of iPHONE: a caps-only face draws its capital for it. Read
 *  off the glyphs (the photo ads' faceGlyphs asks the same of a card's face): the two differ by more
 *  than an eighth of what either covers. The face must be loaded; until it is, nothing is remembered. */
const _smallI = new Map();
export function spellsSmallI(fontKey) {
  if (_smallI.has(fontKey)) return _smallI.get(fontKey);
  if (!FONTS[fontKey]) return true;
  const N = 150, c = canvas(N, N), x = c.getContext("2d", { willReadFrequently: true });
  const ink = ch => { x.clearRect(0, 0, N, N); x.font = fontCss(fontKey, 100); x.textBaseline = "alphabetic"; x.fillStyle = "#000"; x.fillText(ch, 30, 115); return x.getImageData(0, 0, N, N).data; };
  const a = ink("i"), b = ink("I"); let d = 0, n = 0;
  for (let k = 3; k < a.length; k += 4) { const A = a[k] > 90, B = b[k] > 90; if (A || B) n++; if (A !== B) d++; }
  const ok = n > 0 && d / n > .125;
  let loaded = true; try { loaded = document.fonts.check(fontCss(fontKey, 100)); } catch (e) { /* asked anyway */ }
  if (loaded) _smallI.set(fontKey, ok);
  return ok;
}
/** The share of seeded full ads set in the house face; the rest draw one of the owner's pairs (fullStyle). */
export const HOUSE_FACE = .25;
export const fullVoiceOk = (k, any = false) => !!k && !!TYPE_VOICES[k] && !FINE_FACES.has(TYPE_VOICES[k].display) && (any || !FULL_VOICES.length || FULL_VOICES.includes(k));
export const QUIET = { decor: [], urgency: "none", overlay: "none", accents: 0, board: "none", number_pos: "bottom-center", number_format: "parens",
  camera: "still", shake: 0, sparkles: false, text_in: "slide", pose: "flat", end_face: "back", phone_idle: "breathe", grade: "none", depth: "none",
  text_scale: 1, number_scale: 1, tracking: 0, skew: 0, hook: "none", season: "none", phone_finish: "standard", transition: "none", ...HOUSE };
/* The full ad's colours are the photo ads' colour themes, every group (DESIGN-LAW 123, 146: one colour
   vocabulary), by the same names and the same colours as Easy Mode's themes: house-colours.js is
   made from app.js COLOR_THEMES by scripts/build_house_colours.mjs. (It first drew from sixteen of
   the video maker's own palettes, so "Navy & Gold" was two navies and two golds.) The iPhones LA
   feed stills keep their own list (tools/feed-stills/render.mjs). */
export const COLOURWAYS = HOUSE_COLOURS.map(c => c.key);
/* the pairs a seed may draw: every one but a twin (house-colours.js: one scheme with an earlier pair at the
   wall's size, 2026-11-19), which stays a theme and is drawn where it is picked by hand */
export const DRAWN = HOUSE_COLOURS.filter(c => !c.twin).map(c => c.key);
export const COLOUR_OF = Object.fromEntries(HOUSE_COLOURS.map(c => [c.key, c]));
/* Grounds with nothing drawn in them. The review of 2026-11-12 found the others' features under
   the content: the edges of spot_floor's cone ran behind the chips and through the chevrons, and
   studio_sweep's floor line stood as a row of ticks under the number. The depth comes from the
   light the layout puts behind the product, where it knows the product is. */
export const GROUNDS = ["radial", "tonal", "linear"];

/* WHAT THE AD STANDS ON, BEYOND THE HOUSE GRADIENT (2026-11-18; spec/full-grounds.json, written to
   motion/full-grounds.js). The owner: "how come none of the videos use a BG?", "also only have 1 BG
   style?!", "combo of assets and bg is best". A seed now draws a photograph from its line's pool, one
   of the engine's drawn scenes, or the house gradient, in the table's shares, from a stream of its own:
   the pair, the arrangement and the words the seed drew do not move. A photograph is drawn only where
   its own colour keeps the card to two families with the pair the seed drew (rule 139); one given with
   the ad (ground_photo: { src, focus, scrim, from }, a recipe made from an older card) is drawn as
   given. FullAd grades it toward the pair's ground, shades it only where words stand, and pushes in on
   it slowly through the video, holding still from the moment the photo is taken. */
const GROUND_IMG = new Map();
export const groundUrl = src => /^(https?:|\/|data:|blob:)/.test(src) ? src : new URL("../" + src, import.meta.url).href;
/** Load a ground photograph once for the page (a promise of the decoded picture). */
export function loadGroundPhoto(src) {
  if (!src) return Promise.resolve(null);
  let e = GROUND_IMG.get(src);
  if (!e) {
    const img = new Image(); img.decoding = "async"; e = { img: null };
    e.p = new Promise((res, rej) => { img.onload = () => { e.img = img; res(img); }; img.onerror = () => rej(new Error("The background " + src + " did not load.")); });
    e.p.catch(() => {}); img.src = groundUrl(src); GROUND_IMG.set(src, e);
  }
  return e.p;
}
const groundImage = src => (GROUND_IMG.get(src) || {}).img || null;
/** Before a full ad is drawn for keeps (a download, a still for the library): its photograph loaded. */
export async function fullGroundReady(st) {
  const src = st && st.background === "photo" && st.ground_photo && st.ground_photo.src;
  if (src) { try { await loadGroundPhoto(src); } catch (e) { /* drawn on the house gradient */ } }
}
/** A photograph whose own colour is strong suits a pair that has its family (hues within 30 degrees,
 *  as pgHuePlan counts them); one with no strong colour suits every pair. */
function photoSuits(m, pairKey) {
  if (!m || !m.C || m.C < .08 || m.hue == null) return true;
  const c = COLOUR_OF[pairKey]; if (!c) return true;
  const hues = [c.colors.accent, c.colors.ground].map(oklchOf).filter(k => k.C >= .04).map(k => k.h);
  return hues.some(h => Math.min(Math.abs(h - m.hue), 360 - Math.abs(h - m.hue)) <= 30);
}
/* THE GROUND AND THE PRODUCT LINE UP (the owner, 2026-11-18: "ideally bg and assets line up").
   Each photograph is tagged (spec/ground-tags.json, read by eye, carried into GROUND_PHOTOS by
   scripts/build_full_grounds.mjs): a scene, or a photograph of goods with the make and model of a
   vehicle or a phone. A photograph of goods stands behind an ad only when they are the ad's own: the
   same make and model of a vehicle or a phone, the same kind of goods otherwise (never a MacBook
   behind an iPhone, a gold coin behind silver flatware, a Ford behind a RAM). A scene goes with any. */
const GROUND_KIND = { ipad: ["ipad"], mac: ["mac"], watch: ["watch"], smartwatch: ["watch"], headphones: ["headphones"], headset: ["headphones"], earbuds: ["earbuds"], speaker: ["speaker"],
  camera: ["camera"], drone: ["drone"], gold: ["gold"], silver: ["silver", "coins"], coins: ["coins"], strips: ["strips"], pokemon: ["pokemon"], sports: ["sports"], metaglasses: ["metaglasses"] };
const carOf = f => { const m = /^car-([a-z]+)-([a-z0-9]+)/.exec(f || ""); return m ? { make: m[1] === "chevrolet" ? "chevy" : m[1], model: m[2], van: /van|transit|sprinter|promaster/.test(f) } : null; };
const iphoneOf = id => { const m = /^(\d+e?)((?:-pro|-plus|-mini)?(?:-max)?)(?:-|$)/.exec(id || "") || /iphone-(\d+e?)((?:-pro|-plus|-mini)?(?:-max)?)/.exec(id || ""); return m ? (m[1] + m[2].replace(/-/g, " ")).trim() : ""; };
/** What an ad shows, as its ground is matched against it: { kind, makes, models, van, files }. */
export function productFor(subject, have) {
  const line = subject && subject !== "iphone" ? subject : "iphone";
  const files = (have || []).filter(Boolean).map(id => String(id).replace(/^sub-/, "").replace(/^recipe:[^/]*\//, ""));
  if (line === "iphone") return { kind: "iphone", models: files.map(iphoneOf), files };
  if (line === "car") { const c = files.map(carOf).filter(Boolean); return { kind: "car", makes: c.map(x => x.make), models: c.map(x => x.model), van: c.some(x => x.van), files }; }
  // an ad that stands on its words alone (a recipe whose goods its line has no picture of: words_only) shows nothing
  if (!files.length || files.every(f => f === "none")) return { kind: line, files: [], bare: true };
  return { kind: line, files };
}
/** Whether a ground photograph's tag agrees with the product (productFor). */
export function groundFits(t, P) {
  if (!t || t.never) return false;
  if (!t.shows || t.shows === "scene" || !P) return true;
  if (!P.files || !P.files.length) return P.kind === "car" || P.kind === "iphone" ? false : (GROUND_KIND[P.kind] || []).includes(t.subject);
  if (P.kind === "car") {
    if (!t.make || !P.makes.length || P.makes.some(m => m !== t.make)) return false;
    if (t.subject === "car-key") return true;
    if (t.subject !== "car" || (P.van && t.vehicle !== "van")) return false;
    if (t.cuts && !P.files.every(f => t.cuts.includes(f))) return false;   // the photograph's own cut-outs only (an E46 is not a G80 M3)
    return !t.model || P.models.every(m => !m || m === t.model);
  }
  if (P.kind === "iphone") return t.subject === "iphone" && !!t.model && P.models.length > 0 && P.models.every(m => m === t.model);
  return (GROUND_KIND[P.kind] || []).includes(t.subject);
}
/** The ground a seed draws for a line and the pair it drew: { background, ground_photo? }, or null
 *  for the house gradient the seed already drew. product (productFor): only a photograph that agrees
 *  with it is drawn. */
export function groundFor(subject, seed, pairKey, product, lean = null) {
  const cat = !subject || subject === "iphone" ? "phones" : (GROUND_LINE_CAT[subject] || "");
  /* an ad that shows no product (productFor: bare) never stands on a photograph (2026-11-19; the owner, of the
     VR headset ad: "clearly wasn't audited or ever rebuilt"): with nothing in front of it, a room or a desk is
     the picture, and the VR headsets' words stood on a dim room with a console in it. Its words stand on a
     painted ground: a gradient, a pattern, a scene or the house's own. */
  const bare = !!(product && product.bare);
  const pool = bare ? [] : (GROUND_POOLS[cat] || []).filter(src => GROUND_PHOTOS[src] && photoSuits(GROUND_PHOTOS[src], pairKey) && groundFits(GROUND_PHOTOS[src], product));
  // the drawn scenes are night skies, auroras and glows made for light words: under dark words (a light pair,
  // a lime or aqua ground: rule 154) their deep tones turn grey and the shade behind the words runs to the
  // frame's edge (full_ad_check, 2026-11-18), so those pairs stand on the other kinds
  const pc = COLOUR_OF[pairKey], darkWords = !!pc && lum(pc.colors.ink) < lum(pc.colors.ground);
  const share = { photo: pool.length ? GROUND_SHARES.photo : 0, scene: GROUND_SCENES.length && !darkWords ? GROUND_SHARES.scene : 0, gradient: GROUND_GRADIENTS.length ? (GROUND_SHARES.gradient || 0) : 0,
    pattern: GROUND_PATTERNS.length ? (GROUND_SHARES.pattern || 0) : 0, house: GROUND_SHARES.house };
  /* a rebuilt recipe's lean (motion/recipe-lean.js; the owner, 2026-11-18: "take them as inspiration but
     rebuild them all", "retire but bg counts"): a kind of ground or one ground its card stood for, of
     those this ad may stand on; for a photograph, the one its card stood on where that is measured, not
     dim, fits the product drawn and keeps the card to two families, else one of the line's */
  if (lean && lean.want && lean.want.length) {
    const p0 = lean.photo && lean.photo.src, m0 = p0 ? GROUND_PHOTOS[p0] : null;
    const own = !bare && m0 && !m0.dim && groundFits({ ...m0, ...lean.photo }, product) && photoSuits(m0, pairKey) ? { src: p0, focus: lean.photo.focus || m0.focus || [.5, .5] } : null;   // the engine's own shade, for this pair (its card's was for its card)
    const can = [...(own || pool.length ? ["photo"] : []), ...(share.scene ? ["scene", ...GROUND_SCENES] : []), ...(share.gradient ? ["gradient", ...GROUND_GRADIENTS] : []),
      ...(share.pattern ? ["pattern", ...GROUND_PATTERNS] : []), "house", ...GROUNDS];
    const got = lean.pick(can, lean.want, "ground"), of = L => L[Math.floor(lean.r() * L.length) % L.length];
    if (got === "photo") { if (own) return { background: "photo", ground_photo: own }; const src = of(pool); return { background: "photo", ground_photo: { src, focus: GROUND_PHOTOS[src].focus || [.5, .5] } }; }
    if (got) return { background: got === "scene" ? of(GROUND_SCENES) : got === "gradient" ? of(GROUND_GRADIENTS) : got === "pattern" ? of(GROUND_PATTERNS) : got === "house" ? of(GROUNDS) : got };
  }
  // the line's own stream: two lines on one seed do not stand on the same kind of ground
  let h = 0x811c9dc5; for (const ch of String(subject || "iphone")) { h ^= ch.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  const g = rng(mixSeed((mixSeed(seed >>> 0) ^ h) >>> 0)); g();
  let u = g() * (share.photo + share.scene + share.gradient + share.pattern + share.house);
  if ((u -= share.photo) < 0) { const src = pool[Math.floor(g() * pool.length) % pool.length]; return { background: "photo", ground_photo: { src, focus: GROUND_PHOTOS[src].focus || [.5, .5] } }; }
  if ((u -= share.scene) < 0) return { background: GROUND_SCENES[Math.floor(g() * GROUND_SCENES.length) % GROUND_SCENES.length] };
  // a vivid gradient in the pair's own two families (decor.js pairGradientGround; the owner: "Also don't see any gradients really?")
  if ((u -= share.gradient) < 0) return { background: GROUND_GRADIENTS[Math.floor(g() * GROUND_GRADIENTS.length) % GROUND_GRADIENTS.length] };
  // a tone-on-tone pattern or texture in the pair's own ground colour (decor.js fullPatternGround; rule 154)
  if ((u -= share.pattern) < 0) return { background: GROUND_PATTERNS[Math.floor(g() * GROUND_PATTERNS.length) % GROUND_PATTERNS.length] };
  return null;
}
export const ARRANGEMENTS = ["lineup", "fan", "showcase", "podium", "wings"];
/** How far past its letters a headline treatment reaches, in its size, counting both sides (the letters
 *  are centred on the column): an outline's .17 a side by default; a long shadow's .35 to one side; a
 *  plate's own margin (box .22, glass .2 and its blur, a cut-out plate .18); a 3-D block's depth and blur. */
export const FX_REACH = { long_shadow: .72, box: .46, glass: .44, cutout: .38, block3d: .4 };
/* One icon, where a size has room for one: the fan of banknotes. The review of 2026-11-12: the
   handshake is a photograph of two suits (clip art beside flat type), the red pin repeats the
   footer's pin, and pin and shield each bring a third colour onto a two-colour card. */
export const ICONS = ["cash"];
/** What an ad says when its maker has typed nothing: claims any buyer can stand behind (no "#1",
 *  "best" or "fastest", which need proof; DESIGN-LAW's honest-claims rule), and none of the one
 *  list's banned phrases (spec/banned-words.json, rule 143; scripts/words_check.mjs fails a commit
 *  that puts one back). The claim is read first and, with no business name typed, is the badge:
 *  the research's verdict on TOP DOLLAR there was "replace with identity or place" (2026-11-12),
 *  and until 2026-11-18 it still stood on 33 of the 35 first full ads (OPEN-ITEMS §BI). */
export const FULL_WORDS = {
  claim: ["LOCAL & HONEST", "QUICK REPLIES • CASH TODAY", "LOCAL BUYER • FAIR OFFERS", "FAIR OFFER • NO PRESSURE", "HONEST BUYER • PAID TODAY"],
  line: ["ALL MODELS WANTED", "NEW, USED OR CRACKED", "ANY CARRIER • CRACKED OK"],
  points: ["FREE QUOTE, CASH SAME DAY, NO FEES", "QUOTE BY TEXT, PAID TODAY, WE MEET YOU", "TEXT US NOW, FAIR OFFER, NO HASSLE"],
  label: ["CALL OR TEXT", "TEXT US NOW", "GET YOUR OFFER"],
  burst: ["CASH!", "FAST CASH", "NO FEES", "PAID TODAY", "SAME DAY", "EASY SALE"],
  burst_es: ["PAGO HOY", "PAGO YA", "FÁCIL"],
};

/* ONE PROMISE, ONCE. The review of 2026-11-12 found the same promise three times on one square:
   "CASH TODAY" in the claim, "CASH PAID" in a chip, "PAID TODAY" on the sticker. Two lines share a
   promise when they share a word's stem (four letters and up, its first five), the test the
   iPhones LA generator uses (tools/feed-stills/generate.mjs). */
const stems = s => new Set(String(s || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[^A-Z0-9$]+/).filter(w => w.length >= 4 || w === "$$$").map(w => w.slice(0, 5)));
export const sharesWord = (a, b) => { const B = stems(b); return [...stems(a)].some(w => B.has(w)); };

/* A WORD THAT NAMES A COLOUR IS DRAWN IN IT, OR NOT ACCENTED (rule 139). The accent goes to the
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

/* TWO COLOUR FAMILIES TO A CARD, THE PRODUCT COUNTED (rule 139). The owner's default set stands
   a Cosmic Orange 17 Pro Max in the middle, and the seed drew any of the twelve pairs under it: an
   orange phone on Midnight & Cyan, Blue & Green or Purple & Gold is a third colour. A phone counts
   when its picture is a colour (meta.body, measured at load: C .07 and up, the six bold finishes);
   hues within 30 degrees are one family (the photo ads' pgHuePlan), a neutral ground (C under .04)
   none. The seed draws from the pairs that keep the card to two; where the phones alone are two
   (a pink and an ultramarine), from those that add the fewest and from the neutral grounds. */
export const BOLD_C = .07, FAMILY_GAP = 30;
const hueGap = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
export function familyCount(hues) { const f = []; for (const h of hues) if (!f.some(x => hueGap(x, h) <= FAMILY_GAP)) f.push(h); return f.length; }
const pairHues = c => [c.colors.ground, c.colors.accent].map(oklchOf).filter(k => k.C >= .04).map(k => k.h);

/** The pairs a seeded ad may be drawn in: those that suit its line (house-colours.js suits, from
 *  the library's AFFINITY); when its headline names a colour, those whose accent is that colour,
 *  so the accent can paint it; and of those, the ones that keep it to two colour families with the
 *  bold phones on it (phoneHues: the body hues of the phones it shows). Every pair, in its order,
 *  for any other ad: a seed that drew a pair before draws the same one. A pair picked by hand is
 *  never narrowed (fullStyle). */
/** WHICH PAIR A LINE'S FIRST AD OPENS IN (2026-11-18). Seed 1 is every new visitor's first full
 *  ad, and a seed's first draw is the same number whatever the line: 31 of the 35 lines opened in
 *  Green & Gold (OPEN-ITEMS §BI, found 12). Each line turns that draw by a step of its own (its key,
 *  hashed and spread over the list), so the first ads of the lines spread over the pairs; the
 *  iPhone line turns by none and opens as before. Still one draw from the seed's stream, so the
 *  ground, the arrangement and the words a seed drew do not move, and a restricted line (gold,
 *  silver, test strips, Pokémon: pairsFor) turns within the pairs that suit it. */
export function lineTurn(subject, n) {
  if (!subject || subject === "iphone" || !(n > 1)) return 0;
  let h = 0x811c9dc5;
  for (const ch of String(subject)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return Math.floor((Math.imul(h, 2654435761) >>> 0) / 2 ** 32 * n);
}

export function pairsFor(subject, headline, phoneHues = []) {
  let keys = LINES.includes(subject) ? HOUSE_COLOURS.filter(c => !c.twin && (c.suits || []).includes(subject)).map(c => c.key) : DRAWN;
  const named = String(headline || "").toUpperCase().split(/\s+/).filter(w => COLOUR_WORD[w.replace(/[^A-ZÁÉÍÓÚÑ]/g, "")]);
  if (named.length) {
    const agree = keys.filter(k => named.some(w => wordAgrees(w, COLOUR_OF[k].colors.accent)));
    if (agree.length) keys = agree;
  }
  if (phoneHues.length && keys.length) {
    const n = Object.fromEntries(keys.map(k => [k, familyCount([...pairHues(COLOUR_OF[k]), ...phoneHues])]));
    const best = Math.max(2, Math.min(...Object.values(n))), many = familyCount(phoneHues) >= 2;
    // phones that are two colours by themselves stand on a neutral ground too (black, silver): it adds
    // only its accent, where every coloured ground would add a family (and pink, ultramarine and teal
    // 16s drew Silver & Blue on every seed)
    keys = keys.filter(k => n[k] <= best || (many && oklchOf(COLOUR_OF[k].colors.ground).C < .04));
  }
  return keys.length ? keys : DRAWN;
}

/* THE LOOKS' SHARES (2026-11-19; the owner, of the home page's wall: "these are all so dark and unoptimized
   colors... why don't we have any of the video style ads on here that looked happier and more vibrant").
   A third of every seed's ads were dark. Now a vivid ground is drawn most (44%), a light one next (36%) and a
   dark one least (20%), each scaled as before where a look holds fewer than four pairs (a restricted line's). */
export const LOOK_SHARE = { light: 1, vivid: 1.2, dark: .55 };
/** THE LOOK FIRST, THEN THE PAIR (2026-11-18, rule 154). Eleven of the twelve proven pairs were a
 *  navy, black or deep ground under a warm accent, so a page of seeded ads read as one look "with
 *  5% variety or difference" (the owner). The pairs are now every colour theme (house-colours.js),
 *  each with its look (light, vivid or dark), and a seed's one draw u picks the look first, by its
 *  share (LOOK_SHARE) where a look holds four pairs or more (one that holds fewer, a restricted line's, in
 *  proportion: gold has one vivid pair, which is not a share of gold's), then the pair within the look.
 *  The draw is turned by the line's own step (lineTurn) before either is read, so the first ads of
 *  the lines (seed 1, one draw for all of them) spread over the looks and the pairs alike; the iPhone
 *  line turns by none. Still one draw of the seed's stream: the ground, the arrangement and the words
 *  a seed drew do not move. */
export function drawPair(keys, u, subject) {
  const looks = PAIR_LOOKS.filter(k => keys.some(x => (COLOUR_OF[x] || {}).look === k));
  const groups = looks.map(k => keys.filter(x => (COLOUR_OF[x] || {}).look === k));
  const rest = keys.filter(x => !PAIR_LOOKS.includes((COLOUR_OF[x] || {}).look)); if (rest.length) groups.push(rest);
  if (!groups.length) return keys[0];
  const w = groups.map((l, i) => Math.min(1, l.length / 4) * (LOOK_SHARE[looks[i]] ?? 1)), sum = w.reduce((a, b) => a + b, 0);
  let v = ((clamp(u, 0, .999999) + lineTurn(subject, 9973) / 9973) % 1) * sum, i = 0;
  while (i < groups.length - 1 && v >= w[i]) { v -= w[i]; i++; }
  const L = groups[i], f = clamp(v / w[i], 0, .999999);
  return L[Math.floor(f * L.length) % L.length];
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
function numberPill(text, size, font, p, style = "pill", grad = false, bare = p.ink) {
  /* the number's treatment (spec/full-styles.json, 2026-11-18: "all of the CTA still look a little too
     common and similar"): a pill, a box, a ticket with its notches, a swing tag with its hole, or no
     plate at all and a bar of the accent under the figures, in the lines' own ink (bare) with their
     soft shadow; any plate may be lit from above (grad). The figures keep their clear margin on
     every one (DESIGN-LAW 58). */
  /* the plate's fill (2026-11-18, rule 154): grad true or "gradient" (lit from above), "stripes", "dots",
     "foil" (decor.js fillTexture: the plate's own hue moved away from its figures), or "glass" (a frosted
     pane) and "outline" (its edge alone in the accent), which leave the ground to show through and so
     carry the figures in the lines' own ink (bare), as the underlined number does */
  const mode = grad === true ? "gradient" : typeof grad === "string" && grad ? grad : "solid";
  const plate = style !== "underline", open = plate && (mode === "glass" || mode === "outline");
  const col = plate && !open ? (contrastOf(p.plate_ink, p.plate) >= 3.5 ? p.plate_ink : (lum(p.plate) > .5 ? "#111111" : "#ffffff")) : bare;
  const P = { ...p, ink: col, accent: col };
  const ink = trim(inkSprite(text, [...text].map(() => col), font, size, 0, (plate && !open) || lum(col) < .5 ? "flat" : "shadow", P, 0).c);
  const padX = size * .5, padY = Math.max(size * .17, ink.height * .19), h = Math.ceil(ink.height + padY * 2);
  const extra = style === "tag" ? h * .55 : style === "ticket" ? h * .3 : 0, w = Math.ceil(ink.width + padX * 2 + extra);
  const sk = Math.max(.2, size / 96), m = Math.ceil(16 * sk);
  const c = canvas(w + m * 2, h + m * 2), x = c.getContext("2d");
  if (!plate) {
    const bar = Math.max(4, size * .09); let acc = p.accent; if (Math.abs(lum(acc) - lum(p.ground)) < .15) acc = col;
    x.drawImage(ink, m + (w - ink.width) / 2, m + (h - ink.height) / 2 - bar * .35);
    x.beginPath(); x.roundRect(m + (w - ink.width) / 2, m + h - bar * 1.15, ink.width, bar, bar / 2); x.fillStyle = acc; x.fill();
    return { c, pad: m, w, h, inkH: ink.height, plate: false, bar: acc };   // the bar is the number's own mark: the pre-flight sets it aside
  }
  const fill = mode === "gradient" ? fillGradient(x, 0, m, 0, m + h, p.plate, col, 3.5) : p.plate;
  x.save(); x.shadowColor = open ? "rgba(0,0,0,.18)" : "rgba(0,0,0,.32)"; x.shadowBlur = (open ? 7 : 11) * sk; x.shadowOffsetY = (open ? 2 : 4) * sk;
  x.beginPath();
  if (style === "box") x.roundRect(m, m, w, h, h * .2);
  else if (style === "ticket") x.roundRect(m, m, w, h, h * .12);
  else if (style === "tag") {
    const pt = h * .45, rr = h * .12;
    x.moveTo(m + pt, m); x.lineTo(m + w - rr, m); x.quadraticCurveTo(m + w, m, m + w, m + rr); x.lineTo(m + w, m + h - rr);
    x.quadraticCurveTo(m + w, m + h, m + w - rr, m + h); x.lineTo(m + pt, m + h); x.lineTo(m, m + h / 2); x.closePath();
  } else x.roundRect(m, m, w, h, h / 2);
  plateBody(x, mode, fill, p.plate, col, m, m, m + w, m + h, h, p.hot || p.accent);
  if (style === "ticket") {
    x.save(); x.globalCompositeOperation = "destination-out";
    [m, m + w].forEach(cx => { x.beginPath(); x.arc(cx, m + h / 2, h * .16, 0, 7); x.fill(); }); x.restore();
    x.setLineDash([h * .07, h * .07]); x.strokeStyle = rgba(col, .55); x.lineWidth = Math.max(1.5, h * .035);
    x.beginPath(); x.moveTo(m + h * .36, m + h * .2); x.lineTo(m + h * .36, m + h * .8); x.stroke(); x.setLineDash([]);
  }
  if (style === "tag") { x.save(); x.globalCompositeOperation = "destination-out"; x.beginPath(); x.arc(m + h * .3, m + h / 2, h * .085, 0, 7); x.fill(); x.restore(); }
  const shift = style === "tag" ? h * .275 : style === "ticket" ? h * .15 : 0;
  x.drawImage(ink, m + (w - ink.width) / 2 + shift, m + (h - ink.height) / 2);
  return { c, pad: m, w, h, inkH: ink.height, plate: true };
}

/** A plate's body on the path just drawn, inside the caller's save() (its shadow set), which this
 *  restores (2026-11-18, rule 154): flat or lit from above (fill), with stripes, dots or a foil's sheen
 *  laid over it without the shadow (decor.js fillTexture); or a pane of glass, smoked under light words
 *  and frosted under dark ones, so it only ever moves the ground away from them; or its edge alone in
 *  the accent. Glass and the edge leave the ground to show: their words are the lines' own ink. */
function plateBody(x, mode, fill, plate, ink, x0, y0, x1, y1, h, edge) {
  if (mode === "glass") {
    const light = lum(ink) > .5;
    x.fillStyle = light ? "rgba(0,0,0,.24)" : "rgba(255,255,255,.62)"; x.fill(); x.restore();
    x.save(); x.clip();
    const hl = x.createLinearGradient(0, y0, 0, y0 + (y1 - y0) * .5); hl.addColorStop(0, "rgba(255,255,255,.16)"); hl.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = hl; x.fillRect(x0, y0, x1 - x0, y1 - y0); x.restore();
    x.lineWidth = Math.max(1.5, h * .035); x.strokeStyle = light ? "rgba(255,255,255,.5)" : rgba(ink, .35); x.stroke();
    return;
  }
  if (mode === "outline") { x.lineWidth = Math.max(2, h * .07); x.strokeStyle = edge; x.stroke(); x.restore(); return; }
  x.fillStyle = fill; x.fill(); x.restore();
  fillTexture(x, mode, plate, ink, x0, y0, x1, y1);
}

const stackRows = (rows, gap, left = false) => {
  const c = canvas(Math.max(...rows.map(r => r.width)), Math.ceil(rows.reduce((h, r) => h + r.height, 0) + gap * (rows.length - 1)));
  let y = 0; for (const r of rows) { c.getContext("2d").drawImage(r, left ? 0 : (c.width - r.width) / 2, y); y += r.height + gap; }
  return c;
};

export class FullAd extends Ad {
  constructor(style, assets, width, height) {
    super(style, assets, width, height, { plan: false });   // laid out at this size by the rules below, never from the plain engine's plan
    // a video look's rays (rule 158) are laid into the ground once, at rest: drawn over it every frame, they ran
    // over the shade the small lines are given (_evenGround) and reached the frame's edges in the pre-flight
    if (["rays", "sunburst"].includes(this.st.background) && !this.groundImg) { super._drawRays(this.bg.getContext("2d"), 0); this._raysAtRest = true; }
    // and a video look's shade round its words is laid into its ground once too: it is the ground's shading, as a
    // photograph's is, not something drawn on it (over a sunset's bright stripes the pre-flight read it as a mark at the edge)
    if (this.st.full_look && this.scrimC && !this.liveGround) { this.bg.getContext("2d").drawImage(this.scrimC, 0, 0, this.W, this.H); this.scrimC = null; }
    this._photoGround();
    // a drawn scene that moves (aurora, drift) paints over the ground every frame: what must stay readable
    // over it (the shade behind the words, the pool behind a screen) is kept in layers drawn after it
    if (!this.groundImg && this.liveGround && !GROUNDS.includes(this.st.background)) { this.groundEven = {}; this.productOver = canvas(this.W, this.H); }
    this._productLight();
    // a phone that lands face up shows a lock screen in the card's own colours, its glass the one of
    // them that stands farthest off the ground lit behind it (lockScreen, screenBase)
    if (this.st.end_face && this.st.end_face !== "back") {
      const wall = LOCK_WALLS[mixSeed((this.st.seed >>> 0) * 31 + 5) % LOCK_WALLS.length];   // one wallpaper for the ad's phones, as a set is shot
      const layout = LOCK_LAYOUTS[mixSeed((this.st.seed >>> 0) * 17 + 3) % LOCK_LAYOUTS.length];   // and one layout
      this.phones.forEach((q, i) => { if (!(q.meta && q.meta.flat) && !q.screen) q.screen = lockScreen(this.p, (this.st.seed | 0) + i, this.st.lang, screenBase(this.p, this._groundAt(q)), { wall, layout, notch: !!(q.design && q.design.notch) }); });
    }
    this._evenProduct();
    this._evenGround();
  }

  _drawRays(ctx, t) { if (!this._raysAtRest) super._drawRays(ctx, t); }

  /** A screen that reads like the ground behind it (2026-11-18). A lock screen's glass is chosen to stand
   *  off the ground (screenBase), and then its own glow can bring its middle back to the ground's tone: on
   *  a photograph or a drawn scene the first iPhone ad read 1.05:1. Where the screen's middle and the
   *  ground behind it are within 1.5:1, a pool is laid behind the phone in the pair's own colours, the
   *  ground's deep shade behind a light screen, its light behind a dark one. The house gradients are left
   *  as they were. */
  _evenProduct() {
    if (GROUNDS.includes(this.st.background)) return;
    const xs = [this.bg, this.groundOver || this.productOver].filter(Boolean).map(c => c.getContext("2d"));
    for (const q of this.phones) {
      if (!q.screen) continue;
      const sc = q.screen, d = sc.getContext("2d", { willReadFrequently: true }).getImageData((sc.width * .3) | 0, (sc.height * .38) | 0, (sc.width * .4) | 0, (sc.height * .24) | 0).data, Ls = [];
      for (let i = 0; i < d.length; i += 16) Ls.push(.2126 * lin8(d[i]) + .7152 * lin8(d[i + 1]) + .0722 * lin8(d[i + 2]));
      Ls.sort((u, v) => u - v);
      const Lp = Ls[Ls.length >> 1], Lg = this._groundAt(q);
      if ((Math.max(Lp, Lg) + .05) / (Math.min(Lp, Lg) + .05) >= 1.5) continue;
      const light = Lp > .16, col = light ? lift(this.p.ground, -.55) : lift(this.p.light, .55);
      const cx = q.home[0], cy = q.home[1], rx = q.w * q.size * .95, ry = q.h * q.size * .66;
      for (const x of xs) {
        x.save(); x.translate(cx, cy); x.scale(rx, ry);
        const gl = x.createRadialGradient(0, 0, 0, 0, 0, 1); gl.addColorStop(0, rgba(col, .9)); gl.addColorStop(.62, rgba(col, .55)); gl.addColorStop(1, rgba(col, 0));
        x.fillStyle = gl; x.fillRect(-1, -1, 2, 2); x.restore();
      }
    }
  }

  /** The ground behind a phone's middle, as the pre-flight reads it: the median relative luminance of
   *  the lit ground over the patch at its centre. */
  _groundAt(q) {
    const W = this.W, H = this.H, cx = q.home[0] | 0, cy = q.home[1] | 0, s = Math.max(4, Math.round(Math.min(q.w, q.h) * q.size * .12));
    const x0 = Math.max(0, cx - s), y0 = Math.max(0, cy - s), w = Math.min(W, cx + s + 1) - x0, h = Math.min(H, cy + s + 1) - y0;
    if (w <= 0 || h <= 0) return relLum(this.p.ground);
    const d = this.bg.getContext("2d", { willReadFrequently: true }).getImageData(x0, y0, w, h).data, L = [];
    for (let i = 0; i < d.length; i += 8) L.push(.2126 * lin8(d[i]) + .7152 * lin8(d[i + 1]) + .0722 * lin8(d[i + 2]));
    L.sort((u, v) => u - v); return L[L.length >> 1];
  }

  /** A light behind the product, in the colourway's own lighter tone, painted into the ground once.
   *  The review of 2026-11-12: a deep-blue phone on charcoal, a black tablet on navy and a dark
   *  laptop on indigo stood in the dark. The layout knows where the product is; a ground does not. */
  _productLight() {
    const G = this.full && this.full.group; if (!G) return;
    const cx = (G[0] + G[2]) / 2, cy = (G[1] + G[3]) / 2, rx = (G[2] - G[0]) * .8, ry = (G[3] - G[1]) * .74;
    const [r, g, b] = [1, 3, 5].map(i => parseInt(this.p.light.slice(i, i + 2), 16)), up = v => Math.round(v + (255 - v) * .35), c = a => `rgba(${up(r)},${up(g)},${up(b)},${a})`;
    for (const x of this._groundCtxs()) {            // on a photograph, into its overlay too, which moves with nothing
      x.save(); x.translate(cx, cy); x.scale(rx, ry);
      const gl = x.createRadialGradient(0, 0, 0, 0, 0, 1); gl.addColorStop(0, c(.6)); gl.addColorStop(.55, c(.22)); gl.addColorStop(1, c(0));
      x.fillStyle = gl; x.fillRect(-1, -1, 2, 2); x.restore();
    }
  }

  /** The ground's canvases a painter writes into: the ground, and on a photograph its overlay. */
  _groundCtxs() { return [this.bg, this.groundOver].filter(Boolean).map(c => c.getContext("2d", { willReadFrequently: true })); }

  /** A photograph as the ground (ground_photo, 2026-11-18): cover-fit round its focus, graded toward
   *  the pair's ground, a vignette in the ground's colour; the overlay (grade, vignette, and the light
   *  and evening painted after) is kept apart from the picture so the picture can move under it.
   *  this.bg is the picture as the still shows it (the moment fullStill takes), so the pre-flight
   *  reads the ground the delivered picture has. A photograph not loaded yet: the house gradient now,
   *  the photograph as soon as it loads (a preview redraws it; fullGroundReady waits for it). */
  _photoGround() {
    const st = this.st, gp = st.background === "photo" && st.ground_photo; if (!gp || !gp.src) return false;
    const img = groundImage(gp.src);
    if (!img) {
      loadGroundPhoto(gp.src).then(() => { if (this._photoGround()) { this._productLight(); this._evenProduct(); this._evenGround(); this.still = null; } }).catch(() => {});
      return false;
    }
    if (this.groundImg) return false;
    const W = this.W, H = this.H, m = GROUND_PHOTOS[gp.src] || {};
    this.groundImg = img; this.groundFocus = Array.isArray(gp.focus) ? gp.focus : (m.focus || [.5, .5]);
    // a scene with a floor (a desk top, a court, a sill: spec/ground-tags.json) is framed so the floor is
    // the foot of the product band, where the product's own shadow falls (the owner: "bg and assets line up")
    const shows = gp.shows || m.shows, floor = gp.floor != null ? +gp.floor : m.floor;
    this.groundFloor = shows === "scene" && floor > 0 && floor < 1 && this.full && this.full.group ? floor : null;
    // the still's moment (fullStill's): the picture pushes in until then, and holds
    this.tHold = Math.max(isFinite(this.tl.number) ? this.tl.number + 1.2 : 0, (this.tLanded || 0) + .6, (this.tOutro != null ? this.tOutro : st.duration) - .4);
    this.groundDrift = ((st.seed | 0) % 2 ? 1 : -1) * .025;
    // the grade: the pair's ground over the picture, heavier on a bright picture and a dark pair
    const darkPair = relLum(this.p.ground) < .2, L = m.L != null ? m.L : .25;
    const a = gp.scrim != null ? clamp(+gp.scrim, 0, .9) : clamp((darkPair ? .3 : .38) + (L - .2) * .6, .22, .6);
    const over = canvas(W, H), ox = over.getContext("2d");
    ox.fillStyle = rgba(this.p.ground, a); ox.fillRect(0, 0, W, H);
    const D = Math.hypot(W, H), vg = ox.createRadialGradient(W / 2, H / 2, D * .28, W / 2, H / 2, D * .72);
    vg.addColorStop(0, rgba(this.p.ground, 0)); vg.addColorStop(1, rgba(this.p.ground, darkPair ? .5 : .35));
    ox.fillStyle = vg; ox.fillRect(0, 0, W, H);
    this.groundOver = over; this.groundEven = {};   // the evening behind each block of words, kept apart: each comes in with its words
    const bg = canvas(W, H), bx = bg.getContext("2d");
    this._drawPhoto(bx, this.tHold); bx.drawImage(over, 0, 0);
    this.bg = bg; this.liveGround = true; this.still = null;
    return true;
  }

  /** The photograph at a moment: a slow push-in round the focus and a little drift across, eased to
   *  rest at the still's moment (tHold) and held there. */
  _drawPhoto(ctx, t) {
    const img = this.groundImg, W = this.W, H = this.H, iw = img.naturalWidth, ih = img.naturalHeight;
    const u = clamp(t / Math.max(.5, this.tHold), 0, 1), e = 1 - (1 - u) ** 3;   // eases to rest
    const k = Math.max(W / iw, H / ih);
    let zoom = 1.02 + .07 * e, sh = H / (k * zoom), sy;
    if (this.groundFloor != null) {
      // the floor line onto the product's foot: as close as cover-fit allows, pushing in (to 1.45x at
      // most) where the photograph is too short above or below its floor to reach it otherwise
      const fl = this.groundFloor, base = clamp(this.full.group[3], 1, H - 1);
      const shMax = Math.min(fl * ih * H / base, (1 - fl) * ih * H / (H - base));
      this.floorReach = shMax > 0 && H / (k * shMax) <= 1.45 + 1e-6;   // false: the photograph cannot bring its floor that far within 1.45x; it comes as close as it can
      if (shMax > 0 && sh > shMax) { zoom = Math.min(H / (k * shMax), 1.45); sh = H / (k * zoom); }
      sy = clamp(fl * ih - base * sh / H, 0, Math.max(0, ih - sh));
      this.floorAt = (fl * ih - sy) * H / sh;   // where the floor line lands on the frame (full_colour_check holds it at the product's foot)
    }
    const sw = W / (k * zoom);
    const [fx, fy] = this.groundFocus, dx = this.groundDrift * (1 - e) * iw;
    const sx = clamp(fx * iw - sw / 2 + dx, 0, Math.max(0, iw - sw));
    if (sy == null) sy = clamp(fy * ih - sh / 2, 0, Math.max(0, ih - sh));
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
  }

  /** A photograph moves under its overlay every frame; the engine's own live grounds otherwise. */
  _drawLiveGround(ctx, t) {
    if (this.groundImg) {
      this._drawPhoto(ctx, Math.min(t, this.tHold)); ctx.drawImage(this.groundOver, 0, 0);
      // the shade behind each block fades in as its words do, so no empty panel stands on the picture before them
      const tl = this.tl, cue = { headline: (tl.text ?? .25) - .15, line: tl.tag ?? tl.text, "call to action": (tl.number ?? 1) - .05, footer: (tl.number ?? 1) + .15 };
      for (const [name, c] of Object.entries(this.groundEven)) {
        const a = clamp((t - (isFinite(cue[name]) ? cue[name] : 0)) / .35, 0, 1);
        if (a > 0) { ctx.save(); ctx.globalAlpha = a; ctx.drawImage(c, 0, 0); ctx.restore(); }
      }
      return;
    }
    super._drawLiveGround(ctx, t);
    if (this.productOver) ctx.drawImage(this.productOver, 0, 0);
    if (this.groundEven) {
      const tl = this.tl, cue = { headline: (tl.text ?? .25) - .15, line: tl.tag ?? tl.text, "call to action": (tl.number ?? 1) - .05, footer: (tl.number ?? 1) + .15 };
      for (const [name, c] of Object.entries(this.groundEven)) {
        const a = clamp((t - (isFinite(cue[name]) ? cue[name] : 0)) / .35, 0, 1);
        if (a > 0) { ctx.save(); ctx.globalAlpha = a; ctx.drawImage(c, 0, 0); ctx.restore(); }
      }
    }
  }

  /** The small lines stand on the ground itself, and a ground has a lit patch or a floor: dark ink
   *  on the cream colourway's grey floor read 2.65:1 (full_ad_check, 2026-11-11). Where a line
   *  reads under 4.5:1 on the ground drawn under it, that stretch of ground is evened toward the
   *  colourway's own ground colour, soft at its edges: the ink was chosen against that colour. */
  _evenGround() {
    const F = this.full, R = F.rects, W = this.W, H = this.H, bx = this.bg.getContext("2d", { willReadFrequently: true });
    const lin = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
    const L = h => { const [r, g, b] = [1, 3, 5].map(i => lin(parseInt(h.slice(i, i + 2), 16))); return .2126 * r + .7152 * g + .0722 * b; };
    // each line's own ink: the headline's, and the small lines' on the ground (F.ink, rule 158: near-black or
    // white where a video look's palette ink reads under 4.5:1 small)
    let Li = 0, light = false;
    const inkOf = name => { Li = L(name === "headline" ? this.pHead.ink : F.ink || this.p.ink); light = Li >= .18; };
    // a photograph or a drawn scene has small bright or dark detail (a keyboard's keys under a line): there
    // every pixel is read and its worst twentieth counts, as the pre-flight reads the delivered picture
    const fine = !GROUNDS.includes(this.st.background), step = fine ? 1 : 5, tail = fine ? .05 : .1;
    const reads = r => {
      const x0 = Math.max(0, r[0] | 0), y0 = Math.max(0, r[1] | 0), w = Math.min(W, Math.ceil(r[2])) - x0, h = Math.min(H, Math.ceil(r[3])) - y0;
      if (w < 2 || h < 2) return 99;
      const d = bx.getImageData(x0, y0, w, h).data, Ls = [];
      for (let i = 0; i < d.length; i += 4 * step) Ls.push(.2126 * lin(d[i]) + .7152 * lin(d[i + 1]) + .0722 * lin(d[i + 2]));
      Ls.sort((a, b) => a - b);
      const worst = Ls[Math.min(Ls.length - 1, Math.floor(Ls.length * (light ? 1 - tail : tail)))];
      return (Math.max(Li, worst) + .05) / (Math.min(Li, worst) + .05);
    };
    F.evened = [];
    // the house gradients are the pair's own colours; a photograph or a drawn scene has detail of its own, so the headline is read too
    // the lines that stand on the ground itself (F.onGround: not on a sign, a speech bubble or a band; bare ticks too)
    const busy = !GROUNDS.includes(this.st.background), m = busy ? 1.15 : 1;
    const targets = [...(busy && !F.board ? [["headline", 3 * m]] : []), ...(F.onGround || ["line", "call to action", "footer"]).map(n => [n, 4.5 * m])];
    for (const [name, need] of targets) {
      const r = R[name]; if (!r) continue;
      inkOf(name);
      // on a photograph, into a layer of the block's own as well, which fades in with its words (_drawLiveGround)
      const xs = [bx, ...(this.groundEven ? [(this.groundEven[name] ||= canvas(W, H)).getContext("2d")] : [])];
      for (let a = .55; reads(r) < need && a <= 1.001; a += .15) {
        const pad = (r[3] - r[1]) * (name === "headline" ? .22 : .5), blur = pad * .9;
        for (const x of xs) {
          x.save(); x.globalAlpha = a; x.fillStyle = this.p.ground; x.shadowColor = this.p.ground; x.shadowBlur = blur;
          x.beginPath(); x.roundRect(r[0] - pad, r[1] - pad * .5, r[2] - r[0] + pad * 2, r[3] - r[1] + pad, pad); x.fill(); x.restore();
        }
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
    const st = this.st, W = this.W, H = this.H, p = this.p;
    // wide: the product beside the words, from 3:2 up (16:9 is 1.78). It was 1.3 until 2026-11-13, when the
    // studio's full ad first drew a 4:3 (1.33, a size the video maker has not): the side-by-side
    // layout left every line's blocks too close there; laid out upright, all 35 lines hold.
    const U = Math.min(W, H), ar = W / H, wide = ar >= 1.5, tall = ar < .7;
    const e = U * FULL.edge, g = U * FULL.gap;
    // A story is shown under the app's own bars: the account's name across the top, the reply box and the
    // button across the bottom. Meta asks for about 14% clear at the top and 20% at the bottom of a 9:16
    // (250 and 340px of 1920); the ground runs under them, the ad stands between.
    const eyT = tall ? H * .125 : e, eyB = tall ? H * .17 : e;
    // the layout (rule 158): one alignment, the blocks' order, the points' side, the shapes of the claim, the
    // points, the call to action and the footer. On a wide frame the product has one side of the frame.
    const Lay = layoutOf(st, wide), left = Lay.align === "left", flip = wide && Lay.side === "left";
    const cx0 = flip ? W * .44 : e, cx1 = wide && !flip ? W * .56 : W - e, colW = cx1 - cx0, mid = (cx0 + cx1) / 2;
    const xAt = w => left ? cx0 : mid - w / 2;
    // A TYPE PAIR ON THE FULL AD (rule 141; fullStyle sets full_pair). One of the owner's pairs
    // (TYPE_VOICES, the photo ads' FONT_PAIRS): its display face letters the headline, the number
    // and the sticker; its reading face everything that is read at a small size, the claim, the
    // line, the call to action, the selling points, the towns and the website. With no pair picked
    // the house's one face does all of it, as before.
    const pair = st.full_pair ? TYPE_VOICES[st.type_pair] || null : null;
    const font = pair ? pair.label : LEGIBLE.has((FONTS[st.font] || [])[3]) ? st.font : "franklin";
    const [fam, fwt] = FONTS[font] || FONTS.franklin;
    // a sign under the headline (a video look's: rule 158): the headline and its line take the sign's colours
    // (pHead), every other line the ground's; a sign that would cost the product its band is left off (below)
    let B = null, ph = p, reach = null, bw0 = 0, bh0 = 0;
    const setSign = b => {
      B = b; ph = b ? this.pHead : p; reach = { l: 0, r: 0, t: 0, b: 0, ...(b ? BOARD_REACH[st.board] || {} : {}) };
      bw0 = b ? 2 * b.pad + reach.l + reach.r : 0; bh0 = b ? 1.6 * b.pad + (b.tabs || 0) + reach.t + reach.b : 0;
    };
    setSign(this.boardDef && FULL_BOARDS.has(st.board) ? this.boardDef : null);
    // the small lines' ink on the ground (bodyInkOf: the palette's own where it reads 4.5:1, as every pair's does)
    const gInk = bodyInkOf(p), pg = gInk === p.ink ? p : { ...p, ink: gInk };
    const fxOf = c => lum(c) < .5 ? "flat" : "shadow";
    // one spelling on the card: the headline's. A caps-only display face (Bungee, Bahiana, Barrio,
    // Silkscreen) draws a capital for the small i, so its headline reads IPHONE; the lines under it
    // then say IPHONE too, and not iPHONE beside it (the review's fault 2, back with the pairs).
    const upper = t => applyCase(t, pair && !spellsSmallI(st.font) ? "upper" : "brand");
    const paint = (line, px, P) => trim(inkSprite(line, [...line].map(() => P.ink), font, px, .02, fxOf(P.ink), P).c);
    /* A line of body type in the fewest rows that fit: one; two, broken at a separator
       ("A • B • C") or between words; three, one item a row. Smaller only when no break
       fits, and never under its floor: then it is left out and fullBlockers says so. */
    const body = (text, px0, pxMin, maxRows = 2, maxW = colW, P = pg) => {
      if (!text) return null;
      const up = upper(text), items = up.split(/ (?:•|→) /), arrow = up.includes("→");
      const join = (a, b) => items.slice(a, b).join(arrow ? " → " : " • ") + (arrow && b < items.length ? " →" : "");
      const tries = [[up]];
      if (items.length === 1) tries.push(splitLines(up, 2));
      for (let i = 1; i < items.length; i++) tries.push([join(0, i), join(i, items.length)]);
      if (items.length === 3) tries.push(items.map((t, i) => t + (arrow && i < 2 ? " →" : "")));
      for (let px = px0; px >= pxMin - .01; px = Math.max(pxMin, px * .94)) {
        for (let n = 1; n <= maxRows; n++) {
          const fits = tries.filter(t => t.length === n).map(t => t.map(l => paint(l, px, P))).filter(r => Math.max(...r.map(x => x.width)) <= maxW);
          if (fits.length) { const rows = fits.sort((a, b) => Math.max(...a.map(x => x.width)) - Math.max(...b.map(x => x.width)))[0]; return { c: rows.length === 1 ? rows[0] : stackRows(rows, Math.ceil(px * .28), left), px, rows: rows.length }; }
        }
        if (px <= pxMin) break;
      }
      return null;
    };

    /* ---- the blocks that do not depend on the headline ---- */
    const F = this.full = { U, e, g, wide, tall, col: [cx0, cx1], rects: {}, px: {}, left: [], layout: Lay, onGround: [], board: "", ink: gInk };
    // the claim, on its badge (a pill, a square tab, a ribbon, a bar the column's width)
    let claim = null;
    if (st.feed_claim) {
      // its badge wears the plates' fill (rule 154); glass or an edge alone carries the words in the lines' ink
      const mode = st.plate_fill || (st.plate_grad ? "gradient" : "solid"), open = mode === "glass" || mode === "outline";
      const fill = p.plate || p.accent, text = st.feed_claim.toUpperCase();
      // a video look's plate ink may sit close to its plate (rule 158): then near-black or white, whichever reads
      const inkc = open ? gInk : contrastOf(p.plate_ink || "#ffffff", fill) >= 4.5 ? p.plate_ink || "#ffffff" : contrastOf(fill, "#111111") >= contrastOf(fill, "#ffffff") ? "#111111" : "#ffffff";
      const [cf, cw] = FONTS[pair ? pair.label : st.font] || FONTS.franklin;
      const pmin = Math.floor(U * FULL.claimMin), kind = Lay.claim;
      for (let px = Math.round(U * FULL.claim); ; px = Math.max(pmin, Math.floor(px * .94))) {
        const row = footRow(text, px, inkc, cf, cw), h = Math.round(px * 1.7), notch = kind === "ribbon" ? Math.round(h * .32) : 0;
        const w = kind === "bar" ? Math.floor(colW) : Math.round(row.width + px * 1.5 + notch * 2);
        if (w <= colW && row.width + px * 1.3 <= colW) {
          const c = canvas(w, h), x = c.getContext("2d"), lw = open ? Math.max(2, h * .07) : 0;
          x.save(); claimPath(x, kind, w, h, lw);
          plateBody(x, mode, mode === "gradient" ? fillGradient(x, 0, 0, 0, h, fill, inkc, 4.5) : fill, fill, inkc, 0, 0, w, h, h, p.hot || p.accent);
          // glass or an edge alone glows in nothing: a glow of the plate's colour round words standing on the ground
          // is a halo of their own colour, and they stop reading (the claim read 1.9:1, full_ad_check, 2026-11-18)
          x.drawImage(row, kind === "bar" && left ? px * .75 : (w - row.width) / 2, (h - row.height) / 2); claim = { c, fill, ink: inkc, px, glow: !open && kind !== "bar" && !left, kind }; break;
        }
        if (px <= pmin) break;
      }
      if (!claim) F.left.push("claim");
    }
    const line = st.feed_line != null ? st.feed_line : st.tag;
    let tagB = null;
    // the call to action: a line over the number, or a speech bubble pointing down at it
    let labB = null;
    if (st.number_label) {
      if (Lay.cta === "bubble") {
        const pmin = U * FULL.labelMin;
        for (let px = U * FULL.label; px >= pmin - .01; px = Math.max(pmin, px * .94)) {
          const c = bubbleBadge(upper(st.number_label), Math.round(px), this.hot, fam, fwt, left);
          if (c.width <= colW) { labB = { c, px, bubble: true }; break; }
          if (px <= pmin) break;
        }
      }
      if (!labB) labB = body(st.number_label, U * FULL.label, U * FULL.labelMin, 1);
      if (!labB) F.left.push("call to action");
    }
    // the number: its pill a fixed share of the column, the chevrons either side of it
    const numText = formatNumber(st.number, st.number_format) || "YOUR NUMBER";
    let numFont = st.number_font === "same" ? st.font : st.number_font; if (FINE_FACES.has(numFont) || !FONTS[numFont]) numFont = pair ? pair.label : "oswald";
    const numFor = z => { const n = numberPill(numText, z, numFont, p, st.number_style, st.plate_fill || !!st.plate_grad, gInk); return { ...n, text: numText, label: null }; };
    let nz = U * .09, num = numFor(nz);
    nz *= Math.min(colW * FULL.pill / num.w, U * FULL.number / nz); num = numFor(nz);
    for (let k = 0; k < 4 && num.w > colW * FULL.pill * 1.01; k++) { nz *= colW * FULL.pill / num.w; num = numFor(nz); }
    // a plate whose shape costs width (the tag's point and hole, the ticket's stub) can set the figures of a
    // long number in a wide face under their floor (fullBlockers' .07 U; the pixel pair did, 2026-11-18):
    // that number is drawn on the pill instead, plated as before
    if ((st.number_style === "tag" || st.number_style === "ticket") && nz < U * .07) {
      st.number_style = "pill"; nz = U * .09; num = numFor(nz);
      nz *= Math.min(colW * FULL.pill / num.w, U * FULL.number / nz); num = numFor(nz);
      for (let k = 0; k < 4 && num.w > colW * FULL.pill * 1.01; k++) { nz *= colW * FULL.pill / num.w; num = numFor(nz); }
    }
    // a seeded face whose figures run wide (rule 154: Galindo, the toon pair's) can still set a long number
    // under its floor in a narrow column (a tablet's 4:5, 73px, 2026-11-18): the number takes the house's own
    // condensed figures, the face that the floor was measured in
    if (nz < U * .07 && numFont !== "oswald") {
      numFont = "oswald"; nz = U * .09; num = numFor(nz);
      nz *= Math.min(colW * FULL.pill / num.w, U * FULL.number / nz); num = numFor(nz);
      for (let k = 0; k < 4 && num.w > colW * FULL.pill * 1.01; k++) { nz *= colW * FULL.pill / num.w; num = numFor(nz); }
    }
    if (labB) num = { ...num, label: labB.c };
    // the footer: the towns after a pin and the website, in rows, on one line, or on a band of the plate's colour
    const where = (st.feed_where || "").replace(/^\s*\p{Extended_Pictographic}️?\s*/u, "").trim().toUpperCase(), site = (st.feed_site || "").trim();
    let foot = null;
    if (where || site) {
      const [lf, lw] = FONTS[font] || FONTS.franklin;
      const band = Lay.foot === "band" && p.plate && p.plate_ink && contrastOf(p.plate_ink, p.plate) >= 4.5;
      const fInk = band ? p.plate_ink : gInk, fPin = band ? p.plate_ink : this.hot, pmin = Math.floor(U * FULL.footMin);
      for (let px = Math.round(U * FULL.foot); ; px = Math.max(pmin, Math.floor(px * .94))) {
        const padX = band ? px * .8 : 0, padY = band ? px * .42 : 0, room = colW - padX * 2;
        let c = null;
        if (Lay.foot === "line" && where && site) { const one = trim(footRow(where + "  •  " + site, px, fInk, lf, lw, fPin)); if (one.width <= room) c = one; }
        if (!c) {
          const rows = [where && footRow(where, px, fInk, lf, lw, fPin), site && footRow(site, px, fInk, lf, lw)].filter(Boolean);
          if (rows.every(r => r.width <= room)) c = trim(rows.length === 1 ? rows[0] : stackRows(rows, Math.round(U * .006), left));   // trimmed: a gap is measured to its letters
        }
        if (c && band) {
          const b = canvas(Math.ceil(c.width + padX * 2), Math.ceil(c.height + padY * 2)), x = b.getContext("2d");
          x.fillStyle = p.plate; x.beginPath(); x.roundRect(0, 0, b.width, b.height, Math.min(b.height / 2, px * .6)); x.fill();
          x.drawImage(c, padX, padY); c = b;
        }
        if (c) { foot = { c, px, band }; break; }
        if (px <= pmin) break;
      }
      if (!foot) F.left.push("footer");
    }

    /* ---- the headline: the largest that leaves the product its band ---- */
    const text = applyCase(st.headline, st.case), words = text.split(/\s+/).length;
    const gapOf = z => z * (["box", "sticker", "highlighter", "cutout", "double_outline", "glass"].includes(st.text_fx) ? .14 : .02);
    const mc = canvas(4, 4).getContext("2d");
    const headAt = (maxH, maxW = colW) => {
      // how many lines: whichever lets the type be biggest in the room it has (the engine's own rule); a sign's
      // padding and reach count, per unit of the headline's size (bw0, bh0)
      const ref = U * .1; mc.font = fontCss(st.font, ref);
      let best = null;
      for (const n of [...new Set([1, 2, 3].map(k => Math.min(words, k)))]) {
        const ls = splitLines(text, n), wid = Math.max(...ls.map(l => mc.measureText(l).width + (st.tracking || 0) * ref * l.length)) * 1.06;   // the outline's width
        const hgt = ref * (.82 * (.98 * (ls.length - 1) + 1) + .14 * (ls.length - 1));
        const s = ref * Math.min(maxW / (wid + bw0 * ref), maxH / (hgt + bh0 * ref));
        if (!best || s > best.s * 1.04) best = { n, s };
      }
      let size = Math.min(best.s, U * .2 * (st.text_scale || 1)), lines, lineH, blockH;
      for (let k = 0; k < 8; k++) {
        const lk = size.toFixed(2) + "|" + best.n + "|" + (B ? 1 : 0);
        lines = (this._lineCache ||= new Map()).get(lk) || this._lineCache.set(lk, headlineLines(st, ph, size, best.n)).get(lk);
        lineH = lines[0].asc * .98 + gapOf(size); blockH = lineH * (lines.length - 1) + lines[0].asc;
        // the letters and the outline round them stay inside the column: a headline as wide as the column
        // put its outline 17px from the frame's edge, in the margin (found by the pre-flight on the picture).
        // A treatment that reaches further takes its own room (FX_REACH): a long shadow falls a third of the
        // size to one side and ran 13px from the frame (full_ad_check, toyota 9:16, 2026-11-18)
        const widest = Math.max(...lines.map(L => L.inkW)) + size * (B ? bw0 : FX_REACH[st.text_fx] || .34), tallest = blockH + bh0 * size;
        if (widest <= maxW && tallest <= maxH * 1.02) break;
        size *= Math.min(.97, maxW / widest, maxH * 1.02 / tallest);
      }
      return { size, lines, lineH, blockH, n: best.n };
    };
    const hasChips = pointsOf(st).length > 0, hasPhones = this.phones.length > 0;
    // a headline on a plate of its own (a box, letters cut out of one, a pane of glass, a marker's bar: rule 154)
    // has the plate standing a fifth of its size over its capitals: the block above it keeps clear of that too
    // (a cut-out plate met the claim's badge and the claim read 1.9:1, full_ad_check, 2026-11-18)
    const overClaim = hd => !B && ["box", "cutout", "glass", "highlighter"].includes(st.text_fx) ? hd.size * .16 : 0;
    // the line under the headline clears the outline that hangs under its letters (on a sign, the sign's own air)
    const tagGap = hd => B ? Math.max(g * .6, hd.size * .16) : Math.max(g * .9, hd.size * .24);
    // the headline's block: its letters, its line, and the sign under both, with the sign's reach past its face
    const signOf = hd => {
      if (!B) return null;
      const padX = B.pad * hd.size, padY = B.pad * .8 * hd.size, tabs = (B.tabs || 0) * hd.size;
      const innerW = Math.max(...hd.lines.map(L => L.inkW), tagB ? tagB.c.width : 0), w = innerW + padX * 2;
      const h = padY * 2 + hd.blockH + (tagB ? tagGap(hd) + tagB.c.height : 0) + tabs;
      const tip = st.board === "price_tag" ? (h - tabs) * .42 : 0, tilt = w * .035;
      const ext = { l: tip + reach.l * hd.size, r: reach.r * hd.size, t: reach.t * hd.size + tilt, b: reach.b * hd.size + tilt };
      return { padX, padY, tabs, innerW, w, h, ext, full: [w + ext.l + ext.r, h + ext.t + ext.b] };
    };
    const headH = hd => { const S = signOf(hd); return S ? S.full[1] : hd.blockH + (tagB ? tagB.c.height + tagGap(hd) : 0); };

    /* ---- the order of the blocks, top to bottom, and the gap before each, in units of g (rule 158) ----
       The product's band in the middle (the classic stack), high (the headline under it) or low (the
       number over it); the room left over stretches every gap alike (a gap beside the band half as much). */
    const seq = [];
    if (claim) seq.push("claim");
    const ctaSeq = [...(labB ? ["call to action"] : []), "number"];
    if (Lay.order === "hero_low") seq.push("band", "headline", ...ctaSeq);
    else if (Lay.order === "number_high") seq.push("headline", ...ctaSeq, "band");
    else seq.push("headline", "band", ...ctaSeq);
    if (foot) seq.push("footer");
    const gClaim = 1.15, gBand = 1.4, gLab = .8, gFoot = 1.1;
    const gapIn = (a, b) => a === "band" || b === "band" ? [gBand, .5] : a === "call to action" ? [labB && labB.bubble ? .45 : gLab, 1] : b === "footer" ? [gFoot, 1] : a === "claim" ? [gClaim, 1] : [gBand, 1];
    const sizeOf = (name, hd) => ({ claim: claim && claim.c.height, headline: headH(hd), "call to action": labB && labB.c.height, number: num.h, footer: foot && foot.c.height })[name] || 0;
    const fixedOf = hd => seq.reduce((s, n, i) => s + sizeOf(n, hd) + (i ? g * gapIn(seq[i - 1], n)[0] + (n === "headline" ? overClaim(hd) : 0) : 0), 0);

    /* ---- the band: selling points | the product | the sticker and the icon ----
       Sized before it is placed: the band takes the height its contents reach, and the room
       left over goes to the gaps. Three shapes are tried, and the one that shows the product
       largest is kept: the points beside the product (a low band), across the top of it, or
       (a tall frame) in a stack with the sticker beside them and the product under both. */
    const items = pointsOf(st), face = labelFont(st);
    const Hu = H - eyT - eyB;                                 // the height the ad stands in (a story's, between the app's bars)
    const phoneCap = wide ? H * .8 : Hu * (tall ? .52 : .49);
    const reachOf = q => { const a = q.angle * Math.PI / 180; return [q.size * (q.w * Math.abs(Math.cos(a)) + q.h * Math.abs(Math.sin(a))) / 2, q.size * (q.h * Math.abs(Math.cos(a)) + q.w * Math.abs(Math.sin(a))) / 2]; };
    // The engine spreads a set across its stage: a video's phones have the frame to themselves.
    // Here they stand shoulder to shoulder on one floor, in the engine's left-to-right order:
    // the arrangement keeps its character (a line, a fan, a shop window, a podium, wings, a hand of
    // cards, a crown...: every one the video maker has, rule 158) at the spacing below, in phone
    // widths. A leaning neighbour may tuck a little behind the middle phone from the side, never from
    // above (the set's house rules, 2026-10-02).
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
      // [x in phone widths, y in phone heights, tilt in degrees, scale], for the phone o places from the middle
      const spot = ({
        fan: (o, k) => [o * (n === 2 ? 1.2 : 1.02), k * .03, o * 8, 1],
        showcase: (o, k) => [o * (n === 2 ? 1.12 : .93), 0, 0, n === 2 ? 1 : k ? .86 : 1.08],
        podium: (o, k) => [o * 1.04, 0, 0, n === 2 ? 1 : 1.06 - .15 * k],
        wings: (o, k) => [o * (n === 2 ? 1.22 : 1.1), k * .02, -o * 7, 1],
        hand: (o, k) => [o * (n === 2 ? .95 : .78), k * .05, o * 13, 1],
        burst: (o, k) => [o * (n === 2 ? 1.05 : .9), k * .06, o * 17, 1],
        fanfare: (o, k) => [o * (n === 2 ? 1.1 : .96), k * .045, o * 11, 1],
        tilt_row: (o) => [o * 1.16, 0, 6, 1],
        lean_in: (o, k) => [o * (n === 2 ? 1.14 : 1.04), 0, -o * 4, k ? .95 : 1],
        rise: (o) => [o * 1.12, -o * .07, 0, 1],
        crown: (o, k) => [o * (n === 2 ? 1.12 : .98), k * .07, -o * 5, n === 2 ? 1 : k ? .9 : 1.1],
        headliner: (o, k) => [o * (n === 2 ? 1.1 : .96), 0, 0, n === 2 ? (o < 0 ? 1.08 : .84) : k ? .8 : 1.14],
        spotlight: (o, k) => [o * (n === 2 ? 1.14 : 1.02), 0, 0, n === 2 ? 1 : k ? .78 : 1.1],
        gallery: (o) => [o * 1.3, 0, 0, 1],
        tents: (o, k, i) => [o * 1.1, 0, i % 2 ? 7 : -7, 1],
      })[st.arrangement] || ((o) => [o * 1.14, 0, 0, 1]);
      ps.forEach((q, i) => {
        const o = i - (n - 1) / 2, k = Math.abs(o), [x, yy, ang, sc] = spot(o, k, i);
        q.angle = ang; q.size = sc;
        q.home = [x * PW, yy * PH + (PH - q.h * sc) / 2];           // every foot on the tallest's floor
      });
      // the middle in front: outer phones are drawn (and land) first
      this.drawOrder = this.phones.map((_, i) => i).sort((a, b) => Math.abs(ps.indexOf(this.phones[b]) - (n - 1) / 2) - Math.abs(ps.indexOf(this.phones[a]) - (n - 1) / 2));
    }
    const bb = this.phones.map(q => { const [hw, hh] = reachOf(q); return [q.home[0] - hw, q.home[1] - hh, q.home[0] + hw, q.home[1] + hh]; });
    const G = hasPhones ? [Math.min(...bb.map(b => b[0])), Math.min(...bb.map(b => b[1])), Math.max(...bb.map(b => b[2])), Math.max(...bb.map(b => b[3]))] : [0, 0, 1, 1];
    const gw = G[2] - G[0], gh = G[3] - G[1], gx = g * 1.6;
    // the points as pills, square tabs or bare ticks on the ground (in the small lines' ink, the ground evened under them)
    const chipLook = Lay.chips === "bare" ? { shape: "bare", ink: gInk, ground: p.ground } : { shape: Lay.chips };
    const chipAlign = left ? "l" : "c";
    const chipsFor = (shapes, maxW, maxH, align) => {
      for (const [n, row] of shapes) {
        if (n > items.length || n < 1) continue;
        for (let fs = U * FULL.chip; ; fs = Math.max(U * FULL.chipMin, fs * .95)) {
          const key = `${n}|${row}|${align}|${Lay.chips}|${fs.toFixed(2)}`, q = (this._chipCache ||= new Map()).get(key) || this._chipCache.set(key, perksSprite(items.slice(0, n), fs, this.hot, align, row, face, !!this.st.plate_grad, chipLook)).get(key);
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
      // a tall box (a wide frame's product column): the sticker and the icon in a row under the product
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
        const chips = items.length ? chipsFor([[items.length, true], [items.length, false], [2, true], [2, false]], colW, band, chipAlign) : null;
        return { mode: "wide", chips, sub: subject(W - e - W * .59, H - 2 * e), need: chips ? chips.q.h : 0 };
      }
      if (mode === "side") {
        const chips = items.length && band > U * .05 ? chipsFor(hasPhones ? [[items.length, false], [2, false]] : [[items.length, true], [items.length, false], [2, false]], hasPhones ? colW * .47 : colW, band, hasPhones ? "l" : chipAlign) : null;
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
      const chips = items.length && band > U * .05 ? chipsFor([[items.length, true], [items.length, false], [2, true]], colW, band * .36, chipAlign) : null;
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
    let headMax, headW, hd, band, S;
    const sizeAll = () => {
      tagB = body(line, U * FULL.tag, U * FULL.tagMin, 2, B ? colW * .8 : colW, B ? ph : pg);
      headMax = (wide ? H * .36 : Hu * (tall ? .26 : ar < .9 ? .235 : .32)) * (B ? 1.15 : 1); headW = colW; hd = headAt(headMax, headW);
      // a sign's tip and tilt are known once the headline is: narrow the room until the whole sign fits
      for (let k = 0; k < 5 && B; k++) { const Sg = signOf(hd); if (Sg.full[0] <= colW + .5) break; headW -= Sg.full[0] - colW + 2; hd = headAt(headMax, headW); }
      if (B && tagB) {   // the line, re-set narrower where its sign is narrower than the room it was first set for
        const Sg = signOf(hd), inner = colW - Sg.ext.l - Sg.ext.r - Sg.padX * 2;
        if (tagB.c.width > inner) tagB = body(line, U * FULL.tag, U * FULL.tagMin, 2, inner, ph);
      }
      band = bandOf(hd);
      for (let k = 0; k < 14 && band < wantBand - 1 && hd.size > U * .072; k++) { headMax *= .93; hd = headAt(headMax, headW); band = bandOf(hd); }
      S = bestShape(band);
      // and room the band's contents cannot use goes back to the headline, while it makes the headline larger
      // (a headline as wide as the column gains nothing) and costs the product nothing
      for (let k = 0; k < 8 && band - S.need > g * 2.5; k++) {
        const h2 = headAt(headMax * 1.07, headW); if (h2.size <= hd.size * 1.01) break;
        const raw = Hu - fixedOf(h2), S2 = bestShape(Math.max(0, raw));
        // never at the cost of the points (an ad with no picture grew its headline until they fell out
        // and the footer left the frame: full_ad_check, sealed SSDs on a wide frame)
        if (raw < S2.need - 1 || worth(S2) < worth(S) * .985 || !!S2.chips !== !!S.chips || (S.chips && S2.chips.fs < S.chips.fs * .98)) break;
        headMax *= 1.07; hd = h2; band = raw; S = S2;
      }
      // and whatever the words, the stack stays inside the frame: the headline goes on giving way
      for (let k = 0; k < 12 && Hu - fixedOf(hd) < S.need - 1 && hd.size > U * .05; k++) { headMax *= .93; hd = headAt(headMax, headW); band = bandOf(hd); S = bestShape(band); }
    };
    sizeAll();
    // a sign that would cost the product its band, or its line, or that will not fit the column, is left off:
    // the headline stands on the ground
    if (B && (band < wantBand * .95 - 1 || (line && !tagB) || signOf(hd).full[0] > colW + .5 || Hu - fixedOf(hd) < S.need - 1)) { setSign(null); sizeAll(); }
    // short of the product's band, with the points left out, or with the headline under what reads in a feed's preview (the pre-flight's
    // 20px at a quarter of the size: 111px of 1080), the costlier shapes give way before the headline does
    // (rule 116: the hero stays a hero): the bubble becomes a line, a footer on a band or in rows one line
    if ((band < wantBand * .95 - 1 && hd.size < U * .1) || hd.size < U * PF.thumbHead / (.72 * 270) || (hasChips && !S.chips)) {   // or the points would be left out
      const cheaper = Lay.cta === "bubble" && labB ? { full_cta: "line" } : Lay.foot === "band" ? { full_foot: "line" } : Lay.foot === "rows" && where && site ? { full_foot: "line" } : null;
      if (cheaper && !this._cheaper) { this._cheaper = true; Object.assign(st, cheaper); try { return this._layoutType(); } finally { this._cheaper = false; } }
    }
    if (line && !tagB) F.left.push("line");
    const chips = S.chips, sub = S.sub, side = S.mode === "side";
    if (globalThis.FULL_DEBUG) console.log('DBG', JSON.stringify({ W, H, band: Math.round(band), need: Math.round(S.need), colW: Math.round(colW), gw: Math.round(gw), gh: Math.round(gh), n: this.phones.length, mode: S.mode, k: +sub.k.toFixed(3), rb: Math.round(sub.rb), ri: Math.round(sub.ri), chips: chips ? Math.round(chips.fs) : 0, head: Math.round(hd.size), sign: B ? st.board : "" }));
    if (items.length && !chips) F.left.push("selling points");

    /* ---- every block down the frame, in the layout's order ---- */
    // the band takes what its contents reach; what is over is shared: each gap grows by the same step, the rest above and below
    const need = Math.min(band, S.need), spare = Math.max(0, band - need);
    const inner = tagB && !B ? 1 : 0;                       // the step between the headline and its line grows too
    const weights = seq.slice(1).reduce((s, n, i) => s + gapIn(seq[i], n)[1], 0) + inner;
    const stretch = Math.min(g * 1.3, spare / (weights + 1.5)), bandH = need, pad = (spare - stretch * weights) / 2;
    let y = eyT + Math.max(0, pad);
    const R = F.rects;
    let tagXY = null, labXY = null, nxy = null, footXY = null, bandTop = 0, bandBot = 0, xs = [], y0 = 0, block = null, outer = null, boardRect = null;
    seq.forEach((name, i) => {
      if (i) { const [gg, w] = gapIn(seq[i - 1], name); y += g * gg + stretch * w + (name === "headline" ? overClaim(hd) : 0); }
      if (name === "claim") {
        const x = Lay.claim === "bar" ? cx0 : xAt(claim.c.width); claim.x = x; claim.y = y;
        R.claim = [x, y, x + claim.c.width, y + claim.c.height]; y += claim.c.height;
      } else if (name === "headline") {
        const Sg = signOf(hd);
        if (Sg) {
          // the sign: its face at (bx, by), the headline and its line on it
          const bx = left ? cx0 + Sg.ext.l : mid - Sg.full[0] / 2 + Sg.ext.l, by = y + Sg.ext.t;
          boardRect = [bx, by, bx + Sg.w, by + Sg.h];
          y0 = by + Sg.padY;
          xs = hd.lines.map(L => left ? bx + Sg.padX : bx + Sg.padX + (Sg.innerW - L.inkW) / 2);
          block = [Math.min(...xs), y0, Math.max(...hd.lines.map((L, j) => xs[j] + L.inkW)), y0 + hd.blockH];
          if (tagB) tagXY = [left ? bx + Sg.padX : bx + (Sg.w - tagB.c.width) / 2, y0 + hd.blockH + tagGap(hd)];
          outer = boardRect.slice();
          R.headline = [bx - Sg.ext.l, y, bx + Sg.w + Sg.ext.r, y + Sg.full[1]];
          y += Sg.full[1];
        } else {
          // on the left edge the letters stand in by half their treatment's reach (an outline, a box, a long shadow
          // reaches past them: headAt kept that room), so the treatment, not the letters, meets the margin
          const lead = left ? hd.size * (FX_REACH[st.text_fx] || .34) / 2 : 0;
          y0 = y; xs = hd.lines.map(L => left ? cx0 + lead : mid - L.inkW / 2);
          block = [Math.min(...xs), y0, Math.max(...hd.lines.map((L, j) => xs[j] + L.inkW)), y0 + hd.blockH];
          R.headline = block.slice(); y += hd.blockH;
          if (tagB) {
            y += tagGap(hd) + stretch * inner; const x = xAt(tagB.c.width); tagXY = [x, y];
            R.line = [x, y, x + tagB.c.width, y + tagB.c.height]; y += tagB.c.height; F.onGround.push("line");
          }
          outer = [Math.min(block[0], tagXY ? tagXY[0] : W), block[1], Math.max(block[2], tagXY ? tagXY[0] + tagB.c.width : 0), y];
        }
      } else if (name === "band") {
        bandTop = y; bandBot = y + bandH; y = bandBot;
      } else if (name === "call to action") {
        const x = xAt(labB.c.width); labXY = [x, y]; R["call to action"] = [x, y, x + labB.c.width, y + labB.c.height]; y += labB.c.height;
        if (!labB.bubble) F.onGround.push("call to action");
        else F.cta = { ink: contrastOf(this.hot, "#111111") >= contrastOf(this.hot, "#ffffff") ? "#111111" : "#ffffff", h: Math.round(labB.px * 1.62) };
      } else if (name === "number") {
        // the pill is what is spaced and measured; its sprite carries the shadow's margin round it
        const x = xAt(num.w); R.number = [x, y, x + num.w, y + num.h]; nxy = [x - num.pad, y - num.pad]; y += num.h;
      } else if (name === "footer") {
        const x = xAt(foot.c.width); footXY = [x, y]; R.footer = [x, y, x + foot.c.width, y + foot.c.height]; y += foot.c.height;
        if (!foot.band) F.onGround.push("footer"); else F.footBand = { ink: p.plate_ink };
      }
    });
    // the bubble's tail over the number's middle on a centred card
    if (labB && labB.bubble && labXY && !left) { labXY[0] = R.number[0] + (num.w - labB.c.width) / 2; R["call to action"] = [labXY[0], labXY[1], labXY[0] + labB.c.width, labXY[1] + labB.c.height]; }
    F.numBar = num.bar || "";                              // a number with no plate: its bar, for the pre-flight
    F.band = [cx0, bandTop, cx1, bandBot]; F.mode = S.mode; F.order = seq.slice(); F.board = B ? st.board : "";
    if (B) F.onBoard = ["headline", ...(tagB ? ["line"] : [])];

    // where the row of the product and its eye-catchers stands: [x0, x1] and its middle line
    let rowX0, rowX1, rowCy;
    const mirror = Lay.side === "right" && !wide;          // [sticker][product] [points], the mirror of [points] [product][sticker]
    if (wide) {
      if (chips) { chips.x = xAt(chips.q.w); chips.y = bandTop + (bandH - chips.q.h) / 2; }
      [rowX0, rowX1] = flip ? [e, W * .41] : [W * .59, W - e]; rowCy = H / 2;
    } else if (side) {
      // the points and the product's row together across the column (from its left edge on a left-aligned card)
      const total = (chips ? chips.q.w + (sub.w ? gx : 0) : 0) + sub.w, x0 = left ? cx0 : cx0 + (colW - total) / 2;
      if (mirror) { rowX0 = x0; rowX1 = x0 + sub.w; if (chips) { chips.x = rowX1 + (sub.w ? gx : 0); chips.y = bandTop + (bandH - chips.q.h) / 2; } }
      else { if (chips) { chips.x = x0; chips.y = bandTop + (bandH - chips.q.h) / 2; } rowX0 = x0 + (chips ? chips.q.w + gx : 0); rowX1 = rowX0 + sub.w; }
      rowCy = bandTop + bandH / 2;
    } else if (S.mode === "tall") {
      const rowW = chips.q.w + gx + S.rb * 2, x0 = left ? cx0 : mid - rowW / 2;
      if (mirror) { F.burst = { x: x0 + S.rb, y: bandTop + S.topH / 2, R: S.rb }; chips.x = x0 + S.rb * 2 + gx; }
      else { chips.x = x0; F.burst = { x: x0 + chips.q.w + gx + S.rb, y: bandTop + S.topH / 2, R: S.rb }; }
      chips.y = bandTop + (S.topH - chips.q.h) / 2;
      const top = bandTop + S.topH + g * 1.4;
      rowX0 = cx0; rowX1 = cx1; rowCy = top + (bandBot - top) / 2;
    } else {
      if (chips) { chips.x = xAt(chips.q.w); chips.y = bandTop; }
      const top = bandTop + (chips ? chips.q.h + g * 1.4 : 0);
      rowX0 = cx0; rowX1 = cx1; rowCy = top + (bandBot - top) / 2;
    }
    if (chips) { R["selling points"] = [chips.x, chips.y, chips.x + chips.q.w, chips.y + chips.q.h]; if (Lay.chips === "bare") F.onGround.push("selling points"); }
    F.chips = chips;

    /* ---- the product at its size; the sticker and the icon beside it ---- */
    if (S.mode !== "tall") F.burst = null;
    else R.sticker = [F.burst.x - F.burst.R, F.burst.y - F.burst.R, F.burst.x + F.burst.R, F.burst.y + F.burst.R];
    F.iconSlot = null; F.subjectFit = hasPhones ? sub.k : 1; F.group = null;
    if (hasPhones && sub.k > 0) {
      const k = sub.k, x0 = rowX0 + (rowX1 - rowX0 - sub.w) / 2, sl = mirror && sub.rb && !sub.below ? sub.rb * 2 + gx * .8 : 0;
      const gcx = x0 + sl + gw * k / 2, ocx = (G[0] + G[2]) / 2, ocy = (G[1] + G[3]) / 2;
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
        const rb = sub.rb, ri = sub.ri, bx = mirror ? x0 + rb : x0 + gw * k + gx * .8 + rb, by = rowCy - sub.colH / 2 + rb;
        F.burst = { x: bx, y: by, R: rb };
        R.sticker = [bx - rb, by - rb, bx + rb, by + rb];
        if (ri) { const iy = by + rb + g * 1.5 + ri; F.iconSlot = { x: bx, y: iy, R: ri }; R.icon = [bx - ri, iy - ri, bx + ri, iy + ri]; }
      }
    }

    /* ---- hand the engine its layout ---- */
    const pos = { ok: true, xs, y0, oy: y0, block, board: boardRect, outer, tag: tagXY, num: nxy, label: labXY, site: footXY };
    Object.assign(this, { size: hd.size, lines: hd.lines, lineH: hd.lineH, blockH: hd.blockH, margin: e, tag: tagB ? tagB.c : null, num, pos });
    if (!B) { this.boardDef = null; this.pHead = p; this.st.board = "none"; }
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
    if (this.board) Object.assign(this.board, { posts: null, stakes: false, lamps: false });   // a sign hangs in its place (FULL_BOARDS)
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
    // a tall number keeps its chevrons a little smaller where the room either side is short: a narrow seeded
    // face (rule 154) sets its figures taller, and the chevrons sized to them no longer fit (2026-11-18)
    // a left-aligned card (rule 158) has room only on the number's right: its mark stands there, pointing back
    const leftCard = !!F.layout && F.layout.align === "left";
    this.markSide = leftCard ? 1 : -1;
    const room = leftCard ? F.col[1] - nb[2] : Math.min(nb[0] - F.col[0], F.col[1] - nb[2]), fit = Math.min(sz, room / 2.9);
    /* THE CALL TO ACTION'S MARK (st.cta_mark, spec/full-styles.json; the owner, 2026-11-18: "every single
       one has the same arrows pointing to the CTA ... some without arrows some with more direct pointing
       arrows maybe some with a phone or text icon"). Each takes the room either side of the pill it needs
       (in the pill's own size: chevrons 2.9, an arrow 2.7, the curved one 2.8, an icon 2.2) and is drawn
       where it keeps .7 of its size; none is drawn only beside a sticker (an ad keeps one thing that
       catches the eye), else one arrow. A mark that does not fit gives way to the chevrons, then to none. */
    let mark = st.cta_mark || "chevrons";
    if (leftCard) mark = { chevrons: "arrow", arrows: "arrow", phone_text: "phone" }[mark] || mark;   // the two-sided marks, one-sided
    if (mark === "none" && !F.burst) mark = "arrow";
    const need = { chevrons: 2.9, arrow: 2.7, arrows: 2.7, curved: 2.8, phone: 2.2, message: 2.2, phone_text: 2.2 };
    const size = m => Math.min(sz, room / (need[m] || 2.9)), fits = m => m === "none" || size(m) >= sz * .7;
    if (!fits(mark)) mark = !leftCard && fits("chevrons") ? "chevrons" : leftCard && fits("arrow") ? "arrow" : "none";
    this.ctaMark = mark;
    this.markSize = mark === "none" ? 0 : size(mark);
    this.fullChevrons = mark === "chevrons" && fit >= sz * .7 ? fit : 0;
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
        if (C.glow !== false) { ctx.shadowColor = C.fill; ctx.shadowBlur = Math.max(0, Math.min(U * (.012 + .018 * glow), C.y - U * .022)); }
        ctx.drawImage(C.c, -C.c.width / 2, -C.c.height / 2); ctx.restore();
      }
    }
    if (this.site && this.pos.site) {
      const q = prog(t, this.tl.number + .15, .35);
      if (q > 0) { ctx.save(); ctx.globalAlpha = q; ctx.drawImage(this.site, this.pos.site[0], this.pos.site[1] + (1 - q) * U * .02); ctx.restore(); }
    }
    this._ctaMark(ctx, t);
  }

  /** The call to action's mark, drawn and moved its own way (_buildDecor chose it and its size): the
   *  chevrons' glow running inward; an arrow, or two, pushing toward the number on a beat; the curved
   *  arrow drawing itself in; the phone ringing (a shake and a ripple), the message bubble bouncing with
   *  its three dots typing. Every mark in the pair's accent (this.hot, rule 139), its glyph in the ink that
   *  reads on it. At rest on the photo. */
  _ctaMark(ctx, t) {
    const kind = this.ctaMark || "chevrons";
    if (kind === "chevrons") return this._chevrons(ctx, t);
    if (kind === "none" || !this.markSize || !this.numBox) return;
    const t0 = this.tl.number + .3, q = prog(t, t0, .35); if (q <= 0) return;
    const [x0, y0, x1, y1] = this.numBox, cy = (y0 + y1) / 2, sz = this.markSize, hot = this.hot;
    const S = this.markSide || -1, edge = S < 0 ? x0 : x1;   // the side it stands: the number's left (as ever), or its right (a left-aligned card)
    const ink = contrastOf(this.p.plate_ink, hot) >= 3 ? this.p.plate_ink : (lum(hot) > .5 ? "#111111" : "#ffffff");
    const beat = Math.max(0, t - t0 - .35), still = !!this._still;   // the photo: every mark at rest
    ctx.save(); ctx.globalAlpha = q; ctx.fillStyle = hot; ctx.strokeStyle = hot; ctx.lineCap = "round"; ctx.lineJoin = "round";
    const arrow = (tip, dir) => {   // a bold arrow, its tip at tip, pointing dir (1 right, -1 left)
      const len = sz * 2.1, sh = sz * .3, hw = sz * .6, hl = sz * .78;
      ctx.beginPath();
      ctx.moveTo(tip, cy); ctx.lineTo(tip - dir * hl, cy - hw); ctx.lineTo(tip - dir * hl, cy - sh / 2); ctx.lineTo(tip - dir * len, cy - sh / 2);
      ctx.lineTo(tip - dir * len, cy + sh / 2); ctx.lineTo(tip - dir * hl, cy + sh / 2); ctx.lineTo(tip - dir * hl, cy + hw); ctx.closePath();
      ctx.lineWidth = sz * .1; ctx.fill(); ctx.stroke();
    };
    if (kind === "arrow" || kind === "arrows") {
      const push = still ? 0 : sz * .17 * Math.max(0, Math.sin(beat * Math.PI * 2 / 1.1)) ** 2;   // a push toward the number on a beat
      arrow(edge + S * (sz * .5 - push), -S);
      if (kind === "arrows" && S < 0) arrow(x1 + sz * .5 - push, -1);
    } else if (kind === "curved") {
      // a hand-drawn swoop from above and to the left, into the number's side, drawn in, then still
      const sx = edge + S * sz * 2.45, sy0 = y0 - sz * .85, cx1 = edge + S * sz * 2.7, cy1 = cy + sz * .75, ex = edge + S * sz * .38, ey = cy;
      const drawn = prog(t, t0, .55);
      ctx.lineWidth = sz * .24;
      const L = sz * 4.2; ctx.setLineDash([L, L]); ctx.lineDashOffset = L * (1 - drawn);
      ctx.beginPath(); ctx.moveTo(sx, sy0); ctx.quadraticCurveTo(cx1, cy1, ex, ey); ctx.stroke(); ctx.setLineDash([]);
      if (drawn > .92) {   // the open head, along the curve's last direction
        const a = Math.atan2(ey - cy1, ex - cx1), hl = sz * .6;
        ctx.beginPath(); ctx.moveTo(ex - Math.cos(a - .55) * hl, ey - Math.sin(a - .55) * hl); ctx.lineTo(ex, ey); ctx.lineTo(ex - Math.cos(a + .55) * hl, ey - Math.sin(a + .55) * hl); ctx.stroke();
      }
    } else {
      const ri = sz * .9, gap = sz * .32;
      const phoneAt = (cxp) => {
        // rings in bursts: a shake for .45 s every 1.8 s, a ripple going out from it
        const ph = beat % 1.8, shake = !still && beat > 0 && ph < .45 ? Math.sin(ph * Math.PI * 2 * 9) * .2 * (1 - ph / .45) : 0;
        if (!still && beat > 0 && ph < .9) { ctx.save(); ctx.globalAlpha = q * (1 - ph / .9) * .55; ctx.lineWidth = sz * .08; ctx.beginPath(); ctx.arc(cxp, cy, ri * (1 + ph * .7), 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
        ctx.beginPath(); ctx.arc(cxp, cy, ri, 0, Math.PI * 2); ctx.fill();
        ctx.save(); ctx.translate(cxp, cy); ctx.rotate(shake); const g = ri * 1.15 / 24; ctx.scale(g, g); ctx.translate(-12, -12);
        ctx.fillStyle = ink; ctx.fill(new Path2D("M5.2 3.4h3.6l1.6 4.6-2.3 1.7c1.2 2.6 3.4 4.8 6 6l1.7-2.3 4.6 1.6v3.6c0 1.1-.9 2-2 2C10.5 20.6 3.4 13.5 3.2 5.4c0-1.1.9-2 2-2z"));
        ctx.restore();
      };
      const messageAt = (cxm) => {
        // bounces on a beat of 1.4 s, its three dots typing
        const bounce = still ? 1 : 1 + .09 * Math.max(0, Math.sin(beat * Math.PI * 2 / 1.4)) ** 6;
        const bw = ri * 2.1, bh = ri * 1.6;
        ctx.save(); ctx.translate(cxm, cy); ctx.scale(bounce, bounce);
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh * .45); else ctx.rect(-bw / 2, -bh / 2, bw, bh);
        ctx.moveTo(-bw * .28, bh * .42); ctx.lineTo(-bw * .42, bh * .72); ctx.lineTo(-bw * .06, bh * .46); ctx.fill();
        for (let i = 0; i < 3; i++) { ctx.save(); ctx.globalAlpha = q * (still ? 1 : .35 + .65 * Math.max(0, Math.sin(beat * Math.PI * 2 * 1.5 - i * .9))); ctx.fillStyle = ink; ctx.beginPath(); ctx.arc((i - 1) * bw * .24, 0, bh * .11, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
        ctx.restore();
      };
      if (kind === "phone" || kind === "phone_text") phoneAt(edge + S * (gap + ri));
      if (kind === "message") messageAt(edge + S * (gap + ri * 1.05));
      if (kind === "phone_text" && S < 0) messageAt(x1 + gap + ri * 1.05);
    }
    ctx.restore();
  }

  /** Three chevrons either side of the number, larger the nearer they stand to it, a glow
   *  running inward along them. (The engine's own light one of three by the clock, so a photo
   *  caught whichever was lit: the outer one on one ad, the middle one on the next.)
   *  Every chevron is the pair's accent at full strength. They first stepped toward the number
   *  in opacity (.32, .6, 1), and a see-through accent is the accent mixed into the ground in
   *  sRGB: gold over navy drew #504b3a (OKLCH C .028, khaki-grey), orange over navy a brown,
   *  gold over purple a rose-brown (hue 25, a third family), lime-gold over green an olive. Rule
   *  103: an accent keeps C .12 or more, and a warm hue is never drawn under its muddy floor. So
   *  the step is in size and weight, which no ground can turn into a third colour (rule 139). */
  _chevrons(ctx, t) {
    const marks = chevronMarks(this); if (!marks.length) return;
    const q = prog(t, this.tl.number + .3, .3); if (q <= 0) return;
    const sz = this.fullChevrons, pulse = Math.floor(t * 5) % 3;
    ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = this.hot; ctx.shadowColor = this.hot; ctx.globalAlpha = q;
    for (const m of marks) {                                // i 0 is the farthest from the number
      ctx.lineWidth = m.width;
      ctx.shadowBlur = m.i === 2 ? sz * .6 : m.i === pulse ? sz * .35 : 0;
      ctx.beginPath(); ctx.moveTo(m.lx - m.ax, m.cy - m.ay); ctx.lineTo(m.lx, m.cy); ctx.lineTo(m.lx - m.ax, m.cy + m.ay); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(m.rx + m.ax, m.cy - m.ay); ctx.lineTo(m.rx, m.cy); ctx.lineTo(m.rx + m.ax, m.cy + m.ay); ctx.stroke();
    }
    ctx.restore();
  }
}

/** Where the full ad's chevrons stand: for each of the three (i 0 the farthest from the number), the
 *  left and right tips (lx, rx), the middle line (cy), the arms' reach (ax, ay) and the stroke. Each
 *  tip .6 of the size off the pill, then a step of .9 of the two neighbours' mean size, so a smaller
 *  chevron stands nearer its neighbour. The painter and full_colour_check.mjs both read it. */
export function chevronMarks(ad) {
  const sz = ad.fullChevrons; if (!sz || !ad.numBox || (ad.ctaMark && ad.ctaMark !== "chevrons")) return [];
  const [x0, y0, x1, y1] = ad.numBox, cy = (y0 + y1) / 2, K = CHEVRON_STEP;
  const tip = [sz * (.6 + .9 * ((K[2] + K[1]) / 2 + (K[1] + K[0]) / 2)), sz * (.6 + .9 * (K[2] + K[1]) / 2), sz * .6];
  return K.map((k, i) => ({ i, k, lx: x0 - tip[i], rx: x1 + tip[i], cy, ax: sz * .35 * k, ay: sz * .45 * k, width: Math.max(2, sz * .28 * k) }));
}

/* ══════════════════════════════════════════════════════════════════════════════════════════
   THE PRODUCT NOBODY PICKED (2026-11-18). The owner: "why are the same elements being used on the
   hero... same phones.. or same ipad arrangements.. we need infinite but prioritized by recent
   popular and expensive models", "not just front and back", "any possible style.. side profile...
   front with lock screens.. backs.. diagonal.. multi.. or just 1", "all colors too", "but obviously
   the most will be the hot in demand models". Until then a full ad nobody picked the product for
   showed the maker's four default phones, or a line's first set of pictures, on every seed.

   Now the seed draws it, from streams of its own (the colours, the ground and the words a seed drew
   do not move): for the iPhone line, how many phones (PHONE_COUNTS for the frame), which models by
   their demand (PHONE_WEIGHT: spec/product-demand.json, through motion/product-demand.js), in any
   finish, one model in several finishes PHONE_LINEUP of the time; and how they stand (PHONE_VIEWS:
   back, turned a third of the way, front with a lock screen, side on, or fronts and backs mixed),
   drawn by the engine itself, which turns every phone it has. For every other line, one entry of
   its pool (motion/subjects.json, by scripts/build_full_subjects.mjs from the same table): the
   offer family's own sets, the line's Apple models in every finish, the pictures the table names.
   A customer's own pick is never changed: phones chosen in Phones (anything but the default four)
   and a picture chosen with Picture (a set other than the first) stay as chosen.
   ══════════════════════════════════════════════════════════════════════════════════════════ */
const sameIds = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
/* a seed's own stream for each of these, mixed first: mulberry32 started from seeds a step apart gives
   early numbers that move together (the first twelve seeds all turned their phones the same way) */
const mixSeed = s => { s = Math.imul((s >>> 0) ^ 0x9e3779b9, 0x85ebca6b); s ^= s >>> 13; s = Math.imul(s, 0xc2b2ae35); return (s ^ (s >>> 16)) >>> 0; };
/** True when nobody picked the phones: none, or the maker's own default four. */
export function phonesUnpicked(phones) {
  const ids = (phones || []).filter(id => id && id !== "none");
  return !ids.length || sameIds(ids, DEFAULT_PHONES);
}
/** A set of phones for a seed, from the phones on hand (index), the in-demand models most. */
export function drawPhones(seed, aspect, index, most = 3) {
  const r = rng(mixSeed((seed >>> 0) * 131 + 977));
  const byModel = new Map();
  for (const m of index || []) if (m.ok !== false) { if (!byModel.has(m.model)) byModel.set(m.model, []); byModel.get(m.model).push(m.id); }
  if (!byModel.size) return [];
  const models = [...byModel.keys()].sort().map(k => [k, PHONE_WEIGHT[k] ?? PHONE_REST]);
  const n = Math.max(1, Math.min(most, pickWeighted(r(), PHONE_COUNTS[aspect] || PHONE_COUNTS["1:1"]) || 1));
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const first = pickWeighted(r(), models), finishes = shuffle(byModel.get(first).slice());
  // one model in several of its finishes, as a shop window shows a line-up
  if (n > 1 && r() < PHONE_LINEUP && finishes.length >= n) return finishes.slice(0, n);
  // or a range: other models, each in one of its finishes, the dearest in the middle
  const out = [finishes[0]], used = new Set([first]);
  while (out.length < n) {
    const left = models.filter(([k]) => !used.has(k)); if (!left.length) break;
    const k = pickWeighted(r(), left); used.add(k); out.push(shuffle(byModel.get(k).slice())[0]);
  }
  if (out.length === 3) out.splice(1, 0, out.shift());
  return out;
}
const VIEW_OF = { back: ["flat", "back"], back_turned: ["edge", "back"], front: ["flat", "front"], front_turned: ["edge", "front"], profile: ["profile", "back"], mixed: ["flat", "mixed"] };
/** How a set of n phones stands, for a seed: { view, pose, end_face } (the engine's own pose and end_face).
 *  backs: phones the customer picked show the finish they picked, so only the views that show a back. */
export function phoneView(seed, n = 1, backs = false) {
  const r = rng(mixSeed((seed >>> 0) * 173 + 59));
  const v = pickWeighted(r(), PHONE_VIEWS.filter(([k]) => (k !== "mixed" || n > 1) && (!backs || VIEW_OF[k][1] === "back"))) || "back";
  const [pose, end_face] = VIEW_OF[v] || VIEW_OF.back, side = r() < .5 ? "left" : "right";
  return { view: v, pose: pose === "edge" ? "edge_" + side : pose === "profile" ? "profile_" + side : "flat", end_face };
}
/** A drawn set's phones, each in a finish that stands off the ground lit behind it: one under 1.6:1 there (by
 *  its measured lightness) gives way to the same model in a neutral finish that reads, else to the most wanted
 *  model in one; a neutral finish adds no colour family to the card (rule 139). */
export function readableFinishes(ids, colors, index) {
  // the ground at the product's middle as FullAd lights it (_productLight: the light tone, a third of the
  // way to white, at .6 over the ground), and a body's luminance from its measured lightness (OKLab L cubed)
  const mix = (u, v, t) => "#" + [1, 3, 5].map(i => Math.round((parseInt(u.slice(i, i + 2), 16) || 0) * (1 - t) + (parseInt(v.slice(i, i + 2), 16) || 0) * t).toString(16).padStart(2, "0")).join("");
  // a phone at the side of a set stands where the light has faded (.22 at half its reach), so the ground is
  // read both lit (.6) and at the side (.25), and a finish must stand off both
  const lit = t => relLum(mix(colors.ground, lift(colors.light || colors.ground, .35), t)), gA = lit(.6), gB = lit(.25);
  const cr = b => ids.length > 1 ? Math.min(ratio(b.L ** 3, gA), ratio(b.L ** 3, gB)) : ratio(b.L ** 3, gA);   // one phone alone stands in the middle of the light
  const byId = Object.fromEntries((index || []).map(m => [m.id, m])), NEED = 1.6, taken = new Set(ids);
  const neutral = o => o.body && o.body.C < BOLD_C && !taken.has(o.id);
  return ids.map(id => {
    const m = byId[id], b = m && m.body; if (!b || cr(b) >= NEED) return id;
    // the same model in a neutral finish that reads; else the most wanted model that has one; else the best of what there is
    const same = (index || []).filter(o => o.model === m.model && neutral(o)).sort((p, q) => cr(q.body) - cr(p.body))[0];
    const other = (index || []).filter(o => neutral(o) && cr(o.body) >= NEED).sort((p, q) => (PHONE_WEIGHT[q.model] ?? PHONE_REST) - (PHONE_WEIGHT[p.model] ?? PHONE_REST) || cr(q.body) - cr(p.body))[0];
    const pick = same && cr(same.body) >= NEED ? same : other || (same && cr(same.body) > cr(b) ? same : null);
    if (!pick) return id;
    taken.delete(id); taken.add(pick.id); return pick.id;
  });
}
/* each line's pool, as loadSubjectSet loaded it: [{ ids, w }] */
const POOLS = new Map();
/** The entry of a pool a seed draws (its index), over the whole pool by its weights: what a maker
 *  loads before it draws that seed, so a line's pool is never loaded whole (cars run to 12 MB). */
export function poolEntryFor(pool, seed) {
  const list = (pool || []).map((e, i) => [i, e.w]);
  return list.length ? pickWeighted(rng(mixSeed((seed >>> 0) * 197 + 31))(), list) : -1;
}
/** One entry of a line's pool for a seed: the one poolEntryFor names, when its pictures are loaded
 *  (null otherwise: the maker loads it first). With the whole pool loaded, as the checks load it,
 *  this is the draw it always was. */
export function subjectDraw(key, seed, loaded) {
  const P = POOLS.get(key); if (!P || !P.length) return null;
  const e = P[poolEntryFor(P, seed)], have = new Set(loaded || []);
  return e && e.ids.every(id => have.has(id)) ? e.ids : null;
}
/* A LOCK SCREEN for a phone that lands face up (the owner's "front with lock screens"; and, 2026-11-18,
   "audit the iPhone backgrounds to look clean good... and actual iOS"). Drawn, not loaded, so a photo
   taken on the first frame has it, and laid out as iOS lays out its lock screen: the status bar beside
   the island or within the notch's shoulders (signal, Wi-Fi, battery), the date over a large clock in
   the system face (SF on an Apple device, Helvetica Neue elsewhere), the flashlight and the camera in
   glass circles at the foot, and the home bar. The audit found a flat fill crossed by three see-through
   rings under a dark band (a yellow screen went olive under it, rule 103), the clock small and low, no
   status bar, and flat discs with boxes for glyphs.
   The wallpaper is one of the clean ones a lock screen wears (LOCK_WALLS: a glow, a gradient, waves,
   ripples), one for the whole ad, in tones of the screen's own colour only (screenBase: one of the card's
   two families, rule 95; two families blended in sRGB would draw a third, rule 139), never darkened
   into mud (a warm hue only lightens, rule 103). Its middle stays the screen's own colour, so the face
   of the phone still stands off the ground (screenBase, _evenProduct). The clock, the date and the
   glyphs are white on a deep wallpaper and a deep tone of it on a light one, as iOS tints them. */
const LOCK_DAY = { en: "Tuesday, September 9", es: "martes, 9 de septiembre" };
const LOCK_FACE = '"SF Pro Display", "SF Pro Text", system-ui, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif';
export const LOCK_WALLS = ["glow", "gradient", "waves", "ripples"];
export const LOCK_LAYOUTS = ["classic", "widgets", "tall", "compact"];
const LOCK_LAYOUTS_SET = LOCK_LAYOUTS;
const rgba = (hex, a) => { const h = String(hex || "#000000"); const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) || 0); return `rgba(${r},${g},${b},${a})`; };
const lin8 = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
const relLum = hex => { const h = String(hex || "#000000"); return .2126 * lin8(parseInt(h.slice(1, 3), 16) || 0) + .7152 * lin8(parseInt(h.slice(3, 5), 16) || 0) + .0722 * lin8(parseInt(h.slice(5, 7), 16) || 0); };
const ratio = (a, b) => (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
const lift = (hex, k) => { const h = String(hex || "#000000"); return "#" + [1, 3, 5].map(i => { const v = parseInt(h.slice(i, i + 2), 16) || 0; return Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k)).toString(16).padStart(2, "0"); }).join(""); };
/** The colour a lock screen's glass is filled with: of the card's own (its accent, lighter or as it is,
 *  its light tone, its ground in deep shade), the one farthest from the ground lit behind the phone. */
export function screenBase(p, groundY) {
  const a = p.accent || p.plate || "#ffffff", l = p.light || a, g = p.ground || "#101418";
  // the accent first (a lit, coloured screen), then lighter tones, then the ground's deep shade: the first
  // that stands 1.8:1 off the ground, else whichever stands farthest
  const cand = [a, lift(a, .35), lift(l, .45), lift(g, -.6)].map(c => [c, ratio(relLum(c), groundY)]);
  return (cand.find(([, k]) => k >= 1.8) || cand.sort((u, v) => v[1] - u[1])[0])[0];
}
export function lockScreen(p, seed = 1, lang = "en", base = null, opts = {}) {
  const w = 330, h = 716, c = canvas(w, h), x = c.getContext("2d", { willReadFrequently: true }), r = rng(mixSeed((seed >>> 0) * 53 + 7));
  const a = base || p.accent || p.plate || "#ffffff", A = oklchOf(a), G = oklchOf(p.ground || "#101418");
  const warm = A.C >= .06 && A.h >= 35 && A.h < 118;
  // a white, grey or black screen takes a pale tint of the ground's own hue in its tones, as few iOS
  // wallpapers are no colour at all (still the card's two families); never a warm one, which goes olive on grey
  const tint = A.C < .03 && G.C >= .05 && !(G.h >= 35 && G.h < 118), hue = tint ? G.h : A.h, chroma = tint ? .05 : A.C;
  // a tone of the screen's own colour: dL in OKLCH lightness (a warm hue darkens a quarter as far), kC its chroma
  const tone = (dL, kC = 1) => okHex(clamp(A.L + (warm && dL < 0 ? dL * .25 : dL), .1, .97), chroma * kC, hue);
  const blob = (cx, cy, rad, col, al) => { const gr = x.createRadialGradient(cx, cy, 0, cx, cy, rad); gr.addColorStop(0, rgba(col, al)); gr.addColorStop(1, rgba(col, 0)); x.fillStyle = gr; x.fillRect(0, 0, w, h); };
  const kind = LOCK_WALLS.includes(opts.wall) ? opts.wall : LOCK_WALLS[Math.floor(r() * LOCK_WALLS.length) % LOCK_WALLS.length];
  x.fillStyle = a; x.fillRect(0, 0, w, h);
  if (kind === "gradient") {
    const v = x.createLinearGradient(0, 0, 0, h); v.addColorStop(0, tone(-.16)); v.addColorStop(.5, a); v.addColorStop(1, tone(.13, .8));
    x.fillStyle = v; x.fillRect(0, 0, w, h);
  } else if (kind === "glow") {
    blob(w * (.15 + .7 * r()), h * (.14 + .12 * r()), h * .55, tone(.17, .75), .9);
    blob(w * (.25 + .5 * r()), h * (.82 + .1 * r()), h * .48, tone(-.14), .75);
  } else if (kind === "waves") {
    // smooth bands across the lower half, each a step lighter, as iOS's flowing wallpapers
    const flip = r() < .5 ? 1 : -1;
    blob(w * .5, h * .1, h * .42, tone(.1, .9), .55);
    for (let i = 0; i < 3; i++) {
      const y0 = h * (.5 + .14 * i), amp = h * (.045 + .02 * r());
      x.beginPath(); x.moveTo(0, y0 + amp * flip);
      x.bezierCurveTo(w * .34, y0 - amp * 1.7 * flip, w * .66, y0 + amp * 1.7 * flip, w, y0 - amp * flip);
      x.lineTo(w, h); x.lineTo(0, h); x.closePath();
      x.fillStyle = tone((i + 1) * .055, 1 - i * .1); x.fill();
    }
  } else {   // ripples: flat rings of one colour from a lower corner, each a tone lighter
    const cx = r() < .5 ? -w * .15 : w * 1.15, cy = h * (1.02 + .08 * r());
    for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(cx, cy, h * (.86 - .18 * i), 0, Math.PI * 2); x.fillStyle = tone(.035 * (i + 1), 1 - i * .06); x.fill(); }
  }
  // what the clock, the date and the glyphs stand on: white on a deep wallpaper, a deep tone of it on a light one
  const lumOf = (x0, y0, x1, y1) => { const d = x.getImageData(x0 | 0, y0 | 0, (x1 - x0) | 0, (y1 - y0) | 0).data; let t = 0, n = 0;
    for (let q = 0; q < d.length; q += 16) { t += .2126 * lin8(d[q]) + .7152 * lin8(d[q + 1]) + .0722 * lin8(d[q + 2]); n++; } return n ? t / n : 0; };
  const topY = lumOf(w * .15, h * .02, w * .85, h * .27), footY = lumOf(0, h * .85, w, h * .95);
  // white as iOS sets it, on all but a near-white wallpaper (gold, orange, a mid blue keep a white clock)
  const deep = okHex(.27, Math.min(.12, chroma * .7), hue), ink = topY < .68 ? "#ffffff" : deep;
  // the status bar, in iOS's own measures (u: one point of its 393-point screen): signal, Wi-Fi and battery,
  // 72 points of them, ending 34 points in from the right edge, level with the island's middle; under a
  // notch a touch smaller and lower, in the ear between the notch and the glass's round corner (the
  // owner, 2026-11-18: "readjust the status bar size and positioning slightly")
  const u = w / 393, k = opts.notch ? .94 : 1, sy = opts.notch ? 24 * u : .0805 * w, ex = (opts.notch ? 356 : 359) * u;
  x.fillStyle = ink; x.strokeStyle = ink;
  const rr = (x0, y0, ww, hh, rad) => { x.beginPath(); if (x.roundRect) x.roundRect(x0, y0, ww, hh, rad); else x.rect(x0, y0, ww, hh); };
  // battery: a 25 x 12 body (its outline faint), its charge inset two points, a cap
  const bw = 25 * u * k, bh = 12 * u * k, bx = ex - 2.4 * u * k - bw;
  x.globalAlpha = .4; x.lineWidth = 1.1 * u; rr(bx, sy - bh / 2, bw, bh, 3.8 * u * k); x.stroke();
  rr(bx + bw + u * k, sy - 2 * u * k, 1.4 * u * k, 4 * u * k, .7 * u); x.fill();
  x.globalAlpha = 1; rr(bx + 2 * u * k, sy - bh / 2 + 2 * u * k, (bw - 4 * u * k) * .8, bh - 4 * u * k, 2.2 * u * k); x.fill();
  // Wi-Fi: 16 x 12, three arcs over a dot, six points before the battery
  const wcx = bx - (6 + 8) * u * k, wy = sy + 5.6 * u * k;
  x.lineCap = "round"; x.lineWidth = 2.5 * u * k;
  for (const ra of [3.3, 7.2, 11.1]) { x.beginPath(); x.arc(wcx, wy, ra * u * k, Math.PI * 1.25, Math.PI * 1.75); x.stroke(); }
  x.beginPath(); x.arc(wcx, wy - .4 * u * k, 1.5 * u * k, 0, Math.PI * 2); x.fill();
  // signal: four bars, 3 points wide with 1.7 between, rising from 4 to 11, five points before the Wi-Fi
  const gx = wcx - 8 * u * k - 5 * u * k - 17.1 * u * k;
  for (let i = 0; i < 4; i++) { const bhh = (4 + 2.35 * i) * u * k; rr(gx + i * 4.7 * u * k, sy + 5.5 * u * k - bhh, 3 * u * k, bhh, .9 * u); x.fill(); }
  /* THE LAYOUT, one for the ad's phones (LOCK_LAYOUTS; the owner, 2026-11-18: "What are the other iOS lock
     screen layouts? Don't somehow have widgets what about some that are closer to the iOS 26 or 27"):
     classic, the date over a large clock; widgets, a row of four under it (iOS 16 on); tall, iOS 26's
     Glass clock stretched to fill the top, its widgets moved to the foot; compact, iOS 27's small clock
     in the top row beside two widgets, the wallpaper left open. Widgets are tinted one colour, as iOS
     tints them, on a vibrant disc of it: weather, a battery ring, an alarm, the calendar's day. */
  const layout = LOCK_LAYOUTS_SET.includes(opts.layout) ? opts.layout : "classic", es = lang === "es";
  const footInk = footY < .68 ? "#ffffff" : deep;
  x.textAlign = "center"; x.textBaseline = "alphabetic";
  const dateAt = (y, size, col = ink, align = "center", ax = w / 2) => { x.save(); x.textAlign = align; x.fillStyle = col; x.globalAlpha = .9; x.font = `600 ${Math.round(w * size)}px ${LOCK_FACE}`; x.fillText(LOCK_DAY[lang] || LOCK_DAY.en, ax, y); x.restore(); };
  const clockAt = (cx, y, size, stretch = 1, glass = false, align = "center") => {
    x.save(); x.textAlign = align; x.font = `700 ${Math.round(w * size)}px ${LOCK_FACE}`;
    if ("letterSpacing" in x) x.letterSpacing = `${-Math.round(w * size * .02)}px`;
    x.translate(cx, y); x.scale(1, stretch);
    if (glass) {   // Liquid Glass: the numerals clear at their foot, brighter at their head, a lit edge round them
      const g = x.createLinearGradient(0, -w * size * .74, 0, 0); g.addColorStop(0, rgba(ink, .82)); g.addColorStop(1, rgba(ink, .34));
      x.fillStyle = g; x.fillText("9:41", 0, 0);
      x.lineWidth = Math.max(1, w * .0045) / stretch; x.strokeStyle = rgba(ink, .9); x.strokeText("9:41", 0, 0);
    } else { x.fillStyle = ink; x.fillText("9:41", 0, 0); }
    x.restore();
  };
  const widget = (kind, cx, cy, r0, col) => {
    x.save(); x.beginPath(); x.arc(cx, cy, r0, 0, Math.PI * 2); x.fillStyle = rgba(col, .16); x.fill();
    x.fillStyle = col; x.strokeStyle = col; x.textAlign = "center"; x.lineCap = "round";
    if (kind === "battery") {   // a ring, eighty-two percent round, the figure inside
      x.lineWidth = r0 * .13; x.globalAlpha = .3; x.beginPath(); x.arc(cx, cy, r0 * .72, 0, Math.PI * 2); x.stroke();
      x.globalAlpha = 1; x.beginPath(); x.arc(cx, cy, r0 * .72, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * .82); x.stroke();
      x.font = `700 ${Math.round(r0 * .58)}px ${LOCK_FACE}`; x.fillText("82", cx, cy + r0 * .2);
    } else if (kind === "weather") {   // the sun over the temperature
      const sx0 = cx, sy0 = cy - r0 * .22, sr = r0 * .2; x.beginPath(); x.arc(sx0, sy0, sr, 0, Math.PI * 2); x.fill();
      x.lineWidth = r0 * .07; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; x.beginPath(); x.moveTo(sx0 + Math.cos(a) * sr * 1.45, sy0 + Math.sin(a) * sr * 1.45); x.lineTo(sx0 + Math.cos(a) * sr * 1.9, sy0 + Math.sin(a) * sr * 1.9); x.stroke(); }
      x.font = `600 ${Math.round(r0 * .44)}px ${LOCK_FACE}`; x.fillText("72°", cx + r0 * .06, cy + r0 * .62);
    } else if (kind === "alarm") {   // a clock face with its two bells, the time under it
      const ay = cy - r0 * .2, ar = r0 * .26; x.lineWidth = r0 * .08; x.beginPath(); x.arc(cx, ay, ar, 0, Math.PI * 2); x.stroke();
      x.beginPath(); x.moveTo(cx, ay); x.lineTo(cx, ay - ar * .55); x.moveTo(cx, ay); x.lineTo(cx + ar * .4, ay); x.stroke();
      for (const sgn of [-1, 1]) { x.beginPath(); x.arc(cx + sgn * ar * .85, ay - ar * .85, ar * .32, 0, Math.PI * 2); x.fill(); }
      x.font = `600 ${Math.round(r0 * .38)}px ${LOCK_FACE}`; x.fillText("7:00", cx, cy + r0 * .62);
    } else {   // the calendar: the day's name over its number
      x.font = `700 ${Math.round(r0 * .3)}px ${LOCK_FACE}`; x.globalAlpha = .8; x.fillText(es ? "MAR" : "TUE", cx, cy - r0 * .22); x.globalAlpha = 1;
      x.font = `700 ${Math.round(r0 * .72)}px ${LOCK_FACE}`; x.fillText("9", cx, cy + r0 * .5);
    }
    x.restore();
  };
  const kinds = ["weather", "battery", "alarm", "calendar"].map(k => [k, r()]).sort((p0, p1) => p0[1] - p1[1]).map(p0 => p0[0]);
  const row = (y, n, r0, col) => { const gap = r0 * .5, total = n * 2 * r0 + (n - 1) * gap; let cx = w / 2 - total / 2 + r0; for (const k of kinds.slice(0, n)) { widget(k, cx, y, r0, col); cx += 2 * r0 + gap; } };
  if (layout === "tall") {
    dateAt(h * .118, .054);
    clockAt(w / 2, h * .425, .3, 2.1, true);
    row(h * .795, 3, w * .082, footInk);
  } else if (layout === "compact") {
    dateAt(h * .112, .05, ink, "left", w * .085);
    clockAt(w * .08, h * .19, .17, 1, false, "left");
    const r0 = w * .07; widget(kinds[0], w * .66, h * .165, r0, ink); widget(kinds[1], w * .84, h * .165, r0, ink);
  } else {
    dateAt(h * .134, .056);
    clockAt(w / 2, h * .262, .285);
    if (layout === "widgets") row(h * .335, 4, w * .082, ink);
  }
  // the flashlight and the camera, in glass circles at the foot: smoked over a light wallpaper, frosted over a deep one
  const cr = w * .075, cy = h * .905, glass = footY < .1 ? "rgba(255,255,255,.2)" : "rgba(0,0,0,.26)";
  for (const bxx of [w * .17, w * .83]) { x.beginPath(); x.arc(bxx, cy, cr, 0, Math.PI * 2); x.fillStyle = glass; x.fill(); x.lineWidth = Math.max(1, w * .003); x.strokeStyle = "rgba(255,255,255,.22)"; x.stroke(); }
  x.fillStyle = "#ffffff";
  { // the flashlight: a head wider than its body, the switch a dark slot
    const fx = w * .17, s = cr;
    x.beginPath(); x.moveTo(fx - s * .27, cy - s * .5); x.lineTo(fx + s * .27, cy - s * .5); x.lineTo(fx + s * .19, cy - s * .2); x.lineTo(fx - s * .19, cy - s * .2); x.closePath(); x.fill();
    x.beginPath(); if (x.roundRect) x.roundRect(fx - s * .16, cy - s * .24, s * .32, s * .74, s * .07); else x.rect(fx - s * .16, cy - s * .24, s * .32, s * .74); x.fill();
    x.beginPath(); if (x.roundRect) x.roundRect(fx - s * .05, cy - s * .08, s * .1, s * .2, s * .05); else x.rect(fx - s * .05, cy - s * .08, s * .1, s * .2); x.fillStyle = "rgba(0,0,0,.45)"; x.fill();
  }
  x.fillStyle = "#ffffff";
  { // the camera: a body, its viewfinder bump, its lens
    const kx = w * .83, s = cr;
    x.beginPath(); if (x.roundRect) x.roundRect(kx - s * .44, cy - s * .27, s * .88, s * .62, s * .12); else x.rect(kx - s * .44, cy - s * .27, s * .88, s * .62); x.fill();
    x.beginPath(); if (x.roundRect) x.roundRect(kx - s * .17, cy - s * .38, s * .34, s * .16, s * .05); else x.rect(kx - s * .17, cy - s * .38, s * .34, s * .16); x.fill();
    x.beginPath(); x.arc(kx, cy + s * .04, s * .19, 0, Math.PI * 2); x.fillStyle = "rgba(0,0,0,.5)"; x.fill();
    x.beginPath(); x.arc(kx, cy + s * .04, s * .1, 0, Math.PI * 2); x.fillStyle = "#ffffff"; x.fill();
  }
  // the home bar
  x.fillStyle = ink === "#ffffff" ? "rgba(255,255,255,.92)" : rgba(deep, .85);
  x.beginPath(); if (x.roundRect) x.roundRect(w * .33, h * .972, w * .34, h * .008, h * .004); else x.rect(w * .33, h * .972, w * .34, h * .008); x.fill();
  return c;
}

/** The style a full ad is drawn with: the customer's words and phones, the house style locked,
 *  and one colourway, ground, arrangement and icon for the seed (or the ones picked). Every
 *  element gets its words: what the customer left empty is filled from FULL_WORDS. keep: what
 *  the customer set by hand elsewhere in the maker (their music, their voice), left as set. */
/* A VIDEO LOOK ON THE FULL AD (rule 158, 2026-11-18). The owner: "for every single video, I want a photo ad
   equivalent.. and if it doesn't meet the requirement, modify or fix it"; "the video ads originally.. those
   backgrounds those patterns those text those fonts and those arrangement/assortment of devices were really
   good". A full ad may wear one of the video maker's 78 looks (its 50 themes and its vibes): the look's
   palette, ground or pattern, type pair, treatment, colour use, number style, sign and arrangement, with every
   element the full ad adds. opts.look: "own" wears the look the style carries (the maker's look on screen, a
   look from its gallery); "seed" draws one from the seed as New look does; "mix" draws one for VIDEO_SHARE of
   seeds and the house's own look for the rest; none (every check, every recipe) the house's own, as before. */
export const VIDEO_SHARE = .35;
// a video look's number style, as the nearest the full ad's number draws (pill, box, ticket, tag, or a bar under bare figures)
const NUMBER_OF = { pill: "pill", box: "box", ticket: "ticket", tag: "tag", underline: "underline", plain: "underline", outline: "box", stacked: "box",
  sticker: "pill", neon: "pill", chrome: "pill", gold: "pill", split: "pill" };
// a ground that moves every frame, as the nearest that holds still: the shade the small lines need is laid on
// the ground once (_evenGround), and a moving ground ran over it (a sunburst's rays under the line, 2026-11-18)
const STILL_GROUND = { sunburst: "rays", aurora: "mesh", drift: "bokeh" };   // the rays are then laid into the ground at rest (FullAd)
export function videoLookFor(st, seed, mode) {
  if (mode === "own") return st;
  if (mode === "seed" || (mode === "mix" && rng(((seed >>> 0) ^ 0x7f4a7c15) * 53 + 3)() < VIDEO_SHARE)) {
    const held = new Set(["phones", "headline", "tag", "number", "aspect", "duration", "lang", "lang_mode", "area", "number_label", "points", "hook_text", "strike_text", "subject", "subject_set"]);
    return harmonise(randomize({ ...DEFAULT_STYLE, ...st }, seed, held, [], false), held);
  }
  return null;
}

export function fullStyle(st, seed, phoneIndex = [], pick = {}, keep = [], opts = {}) {
  const r = rng((seed >>> 0) * 7 + 11), one = a => a[Math.floor(r() * a.length) % a.length];
  const es = st.lang === "es";
  // the colours: one of the pairs by the seed, the look first (drawPair) (of those that suit the line and any colour its
  // headline names: pairsFor), or the one picked; carried as the palette's own colours (the
  // engine's pal() lays st.colors over the palette named), so the catalogue is not touched
  // fewer phones, larger (five on a square full of large words shrank to a strip): two where the
  // product shares its row with the selling points (a square, a wide frame), three where it has the width
  // (a subject from the offer family brings its own set of one or two pictures: all of it). The bold
  // ones among them have a say in the colours (pairsFor).
  const subject = !!st.subject && st.subject !== "iphone";
  const most = subject ? 4 : st.aspect === "4:5" || st.aspect === "9:16" ? 3 : 2;
  // the product: the customer's own pick as picked; when nobody picked it, a set drawn by the seed
  // from the line's pool or the shop's phones, the in-demand models most (drawPhones, subjectDraw)
  const picked0 = (st.phones || []).slice(0, most);
  const drawnSub = subject && !(st.subject_set | 0) ? subjectDraw(st.subject, seed, st.phones || []) : null;
  // a Quick ad keeps the phones of the ad it follows (pin_phones, set by the maker's quickAd): its
  // listing is about those phones and their price, so only the look changes; New look or a phone
  // picked by hand clears the pin. They still turn and stand as a drawn set does.
  const pinned = !subject && phonesUnpicked(st.phones) && Array.isArray(st.pin_phones) && st.pin_phones.length ? st.pin_phones.slice(0, most) : null;
  let have = drawnSub ? drawnSub.slice(0, most) : pinned ? pinned : !subject && phonesUnpicked(st.phones) && phoneIndex.length ? drawPhones(seed, st.aspect, phoneIndex, most) : picked0;
  const idx = Object.fromEntries(phoneIndex.map(m => [m.id, m]));
  const bold = subject ? [] : have.map(id => (idx[id] || {}).body).filter(b => b && b.C >= BOLD_C).map(b => b.h);
  // a photograph given with the ad whose colour is strong counts toward the two families, as a bold phone does
  const given = st.ground_photo && st.ground_photo.src ? GROUND_PHOTOS[st.ground_photo.src] : null;
  if (given && given.C >= .08 && given.hue != null) bold.push(given.hue);
  /* A REBUILT RECIPE'S LEAN (motion/recipe-lean.js, spec/recipe-looks.json; the owner, 2026-11-18, of the
     library cards and the offer family: "take them as inspiration but rebuild them all"): st.hint names
     what its card stood for, and hint.lean how often its seed draws from it; on a stream of its own, so
     the seed's other draws, and every ad with no hint, are what they were. */
  const H = st.hint && typeof st.hint === "object" && st.hint.lean ? st.hint : null, lr = H ? leanStream(seed) : null;
  const lean = H ? { hint: H, r: lr, pick: (options, want, k) => leanPick(lr, H.lean[k], options, want) } : null;
  const pairs = pairsFor(st.subject, st.headline, bold);
  let first = drawPair(pairs, r(), st.subject);
  // its colourway: a pair of its tone and hue (or a neutral ground), of those that suit the line and its words
  if (lean && (H.tone || H.hue != null || H.neutral)) first = lean.pick(pairs, pairs.filter(k => pairAnswers(COLOUR_OF[k], H)), "colour") || first;
  const key = COLOUR_OF[pick.palette] ? pick.palette : first, { palette: _p, type_pair: _t, type_any: _a, ...picked } = pick;
  // the type: the house's one face, or one of the owner's pairs when one is picked (pick.type_pair, a
  // TYPE_VOICES key that FULL_VOICES holds). Carried in the look, after QUIET, so it is the face drawn.
  /* THE FACE A SEED DRAWS (2026-11-18, rule 154): every seeded full ad was set in the one house face,
     so a page of them read as one ad "with 5% variety or difference" (the owner). A seed nobody styled
     now draws one of the owner's vetted pairs (FULL_VOICES: proven in every size, on a dark and a
     light pair, in English and Spanish, rule 141), the house face about a quarter of the time, on a
     stream of its own (the colours, ground, product and words it drew do not move). A pair picked by
     hand is kept; "house" keeps the house face. */
  let vk = fullVoiceOk(pick.type_pair, pick.type_any) ? pick.type_pair : "";   // type_any: the check that writes the list tries every pair
  if (!vk && pick.type_pair !== "house") {
    const faces = FULL_VOICES.filter(k => fullVoiceOk(k)), vr = rng(((seed >>> 0) ^ 0x6a09e667) * 31 + lineTurn(st.subject, 7919) + 17);
    if (faces.length && vr() >= HOUSE_FACE) vk = faces[Math.floor(vr() * faces.length) % faces.length];
  }
  // a rebuilt recipe leans to its card's face, then to its family's faces (never over a face picked by hand)
  if (lean && !fullVoiceOk(pick.type_pair, pick.type_any) && pick.type_pair !== "house") vk = lean.pick(FULL_VOICES.filter(k => fullVoiceOk(k)), H.face, "face") || vk;
  const voice = vk ? TYPE_VOICES[vk] : null;
  const type = voice ? { type_pair: vk, font: voice.display, number_font: voice.numberRead ? voice.label : "same", full_pair: true } : { full_pair: false };
  // how the phones stand: back, turned, front with a lock screen, side on, or fronts and backs mixed
  // (phoneView; a subject's own pictures are drawn as they are)
  // a drawn phone (never a picked one) that would stand dark on a dark card, or light on a light one,
  // is shown in another of its finishes that reads, a neutral one (no new colour family, rule 139)
  // (a phone that lands face up shows its lock screen, whose glass is chosen against the ground: FullAd)
  const view = subject ? {} : (({ pose, end_face }) => ({ pose, end_face }))(phoneView(seed, have.length, have === picked0));
  if (!subject && have !== picked0 && view.end_face !== "front") have = readableFinishes(have, COLOUR_OF[key].colors, phoneIndex);
  const look = { palette: "midnight", colors: { ...COLOUR_OF[key].colors }, full_colour: key, background: one(GROUNDS), arrangement: one(ARRANGEMENTS), feed_icon: one(ICONS), ...view, ...type, ...picked };
  if (lean && !("arrangement" in picked)) look.arrangement = lean.pick(ARRANGEMENTS, H.arrangement, "arrangement") || look.arrangement;
  // the ground: a photograph given with the ad as given; otherwise the seed's own draw (groundFor), unless one was picked by hand
  if (st.ground_photo && st.ground_photo.src) { look.background = "photo"; look.ground_photo = { ...st.ground_photo }; }
  else if (!("background" in picked)) {
    const gd = groundFor(st.subject, seed, key, productFor(st.subject, have), lean && H.ground ? { want: H.ground, photo: st.ground_hint || null, r: lr, pick: lean.pick } : null);
    if (gd) Object.assign(look, gd); else delete look.ground_photo;
  }
  if (look.ground_photo) loadGroundPhoto(look.ground_photo.src).catch(() => {});
  /* THE LOOK'S STYLES (spec/full-styles.json, motion/full-styles.js; the owner, 2026-11-18: "notice how
     it's all same spiky circle?", "no variety in the text pure outlines?", "don't see any gradients
     really?"): the sticker's shape and fill, the headline's treatment (and the shade round its words)
     and entrance, the number's treatment and the plates' fill, drawn on a stream of the seed's own,
     so the colours, ground, product and words it drew do not move. Where a style was picked by hand
     (pick, or a key the maker holds, keep, when it is one of the table's own) that one is drawn, and a
     treatment picked by hand keeps the engine's own shade. They stand after QUIET (HOUSE's treatment,
     number and entrance are the fallback of a look made before them). */
  const kept = new Set(keep), own = { sticker_shape: FULL_STYLES.sticker, text_fx: FULL_STYLES.headline, text_in: FULL_STYLES.entrance, number_style: FULL_STYLES.number };
  const held = k => kept.has(k) && st[k] != null && (!own[k] || own[k].some(e => e.key === st[k]));
  // dark: the words are lighter than the ground (a vivid ground under white words is dark here); busy: a
  // photograph or a drawn scene, not one of the house's own painted grounds (its gradients and its
  // tone-on-tone patterns are the pair's own colours, solved for the words: rule 154)
  const own2 = COLOUR_OF[key].colors, painted = [...GROUNDS, ...GROUND_GRADIENTS, ...GROUND_PATTERNS].includes(look.background);
  const styles = pickFullStyles(rng(((seed >>> 0) ^ 0x51ed27f3) * 13 + lineTurn(st.subject, 99991) + 5),
    { dark: lum(own2.ink) > lum(own2.ground), busy: !painted, lean });
  if ("text_fx" in picked || held("text_fx")) delete styles.scrim;
  for (const [k, v] of Object.entries(styles)) if (!(k in picked)) look[k] = held(k) ? st[k] : v;
  // a video look (videoLookFor): its own art direction over the house's draw; the full ad's sticker, its fills and
  // the number's mark stay the seed's
  const vid = opts.look ? videoLookFor(st, seed, opts.look) : null;
  if (vid && PALETTES[vid.palette]) {
    // its plate's words read on its plate (a video palette's plate ink is chosen for a big sign, and sat 2:1 on a small one)
    const colors = { ...PALETTES[vid.palette], ...(vid.colors || {}) };
    if (colors.plate && contrastOf(colors.plate_ink || "#ffffff", colors.plate) < 4.5) colors.plate_ink = contrastOf(colors.plate, "#111111") >= contrastOf(colors.plate, "#ffffff") ? "#111111" : "#ffffff";
    // and its words read on its ground: white letters on a mid orange or teal (3:1) sent the engine for a heavy shade
    // behind them, which reached the frame's edges and sank the small lines under it. Such a palette's words take
    // near-black or white, whichever reads, as the house's two-colour pairs do (Black on Orange)
    let cm = vid.color_mode;
    if (contrastOf(colors.ink, colors.ground) < 4.5) {
      colors.ink = contrastOf(colors.ground, "#111111") >= contrastOf(colors.ground, "#ffffff") ? "#111111" : "#ffffff";
      if (contrastOf(colors.accent, colors.ground) < 3) cm = "mono";   // an accent word that would be lost on the ground goes with the rest
    }
    Object.assign(look, { palette: vid.palette, colors, full_colour: "", vibe: vid.vibe || "none", full_look: true,
      background: STILL_GROUND[vid.background] || vid.background, text_fx: vid.text_fx, color_mode: cm, case: vid.case === "title" ? "title" : "brand",
      // the shade round the headline the house's table gives its treatment (the engine's own reached the frame's edges)
      scrim: (FULL_STYLES.headline.find(e => e.key === vid.text_fx) || {}).scrim ?? 0,
      number_style: NUMBER_OF[vid.number_style] || "pill", board: FULL_BOARDS.has(vid.board) ? vid.board : "none",
      ...(["typewriter", "scramble"].includes(vid.text_in) ? {} : { text_in: vid.text_in }) });
    if (!("arrangement" in picked) && vid.arrangement) look.arrangement = vid.arrangement;
    // a video look's ground is never one of the house's plain painted ones: what the style table keeps to those
    // ("where": "plain": a pane of glass, an edge alone, bare figures over a bar) goes on a plate here (a sunset
    // sky runs light under the number, asphalt and a spotlight's falloff are busy: the figures stopped reading)
    if (["glass", "outline"].includes(look.plate_fill)) { look.plate_fill = "solid"; look.plate_grad = false; }
    if (look.number_style === "underline" && !("number_style" in picked)) look.number_style = "pill";
    delete look.ground_photo;
    if (!fullVoiceOk(pick.type_pair, pick.type_any) && fullVoiceOk(vid.type_pair, true)) {
      const v = TYPE_VOICES[vid.type_pair];
      Object.assign(look, { type_pair: vid.type_pair, font: v.display, number_font: v.numberRead ? v.label : "same", full_pair: true });
    }
  } else look.full_look = false;
  // the layout (rule 158), on a stream of its own: what the seed drew above does not move
  Object.assign(look, drawLayout(seed, pick));
  const area = (st.area || "").trim();
  // What the customer left empty is filled from the lists, each line chosen so that it does not
  // repeat a promise the lines before it already make (the customer's own words are never changed:
  // fullWords() says where they repeat). The order is the order they are read in.
  const fresh = (list, said) => { const start = Math.floor(r() * list.length); for (let i = 0; i < list.length; i++) { const w = list[(start + i) % list.length]; if (!said.some(x => sharesWord(w, x))) return w; } return list[start]; };
  const label = st.number_label || (es ? "LLAMA O MANDA TEXTO" : FULL_WORDS.label[0]);
  // a look's small line that says what the call to action says (a video look's tag CALL OR TEXT over its CALL OR
  // TEXT, rule 158) gives way to one from the list: the ad never says one thing twice
  const line = st.feed_line ?? (st.tag && !sharesWord(st.tag, label) ? st.tag : st.tag ? fresh(FULL_WORDS.line, [st.headline, label]) : one(FULL_WORDS.line));
  const points = st.points ?? (pointsOf(st).length ? pointsOf(st).join(", ") : fresh(FULL_WORDS.points, [st.headline, line]));
  // who is buying: a business name, where one is given, takes the badge (the first thing read). An ad
  // with no name on it is the pattern of the buyers nobody trusts (competitor research, 2026-11-12:
  // the brand is what carries the eye to the rest of an ad; "top dollar" is on every sign in the trade)
  const biz = String(st.biz || "").trim();
  const claim = st.feed_claim ?? (biz ? biz.toUpperCase() : fresh(FULL_WORDS.claim, [st.headline, line, points]));
  const burst = st.feed_burst ?? fresh(es ? FULL_WORDS.burst_es : FULL_WORDS.burst, [st.headline, line, points, claim, label]);
  const words = {
    feed_claim: claim, feed_line: line, points, number_label: label,
    feed_where: st.feed_where ?? (area ? area.toUpperCase() : ""),
    // the website as a sentence, so it reads as an address (owner, 2026-11-03: "that way they know it's a URL")
    feed_site: st.feed_site ?? (st.site ? (es ? "Visítanos en " : "Visit our website at ") + String(st.site).trim() : ""),
    feed_burst: burst,
    accent_word: accentWord(st.headline, look.colors.accent),
  };
  const base = { ...DEFAULT_STYLE, ...st, ...QUIET, ...look, ...words, phones: have, full: true, seed };
  const locked = new Set([...keep, ...Object.keys(QUIET), ...Object.keys(look), ...Object.keys(words), "phones", "headline", "tag", "number", "aspect", "duration", "lang", "lang_mode", "area", "full", "accent_word", "strike_text", "hook_text"]);
  const pool = have.length || subject ? [] : phoneIndex.map(m => m.id);   // another product never borrows iPhones
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
    // a speech bubble's tail points down at its number (rule 158)
    if ([names[i], names[j]].sort().join() === "call to action,number" && F.layout && F.layout.cta === "bubble" && dx < 0 && dy >= 0) continue;
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
  return { blocks: Object.keys(R), fill: +area.toFixed(3), px, smallest, product: F.group ? +((F.group[3] - F.group[1]) / H).toFixed(3) : 0, sticker: !!F.burst, icon: !!(ad.accents && ad.accents.length), chevrons: !!ad.fullChevrons && (ad.ctaMark || "chevrons") === "chevrons", cta_mark: ad.ctaMark || "chevrons", mark: !!ad.ctaMark && ad.ctaMark !== "none" && !!(ad.markSize || ad.fullChevrons),
    layout: F.layout, board: F.board || "", order: F.order };
}

/** A subject's set of pictures (motion/subjects.json, from the offer family) as the engine's
 *  assets: { ids, assets }. Each is marked flat, so FullAd draws it as it is. */
export async function loadSubjectSet(subject, setIndex = 0, base = "../assets/cutouts/", opts = {}) {
  const sets = subject.sets || [], pool = subject.pool || [];
  // the first set is the line's pool when it has one, and each seed draws one entry of it
  // (subjectDraw). Given the seed (opts.seed), only the entry it draws is loaded (poolEntryFor): a
  // pool 3-5x the size it was (2026-11-18) is pictures nobody sees. Without a seed the whole pool
  // is loaded, as the checks want it. A set picked with Picture is that set alone.
  const auto = !(setIndex | 0) && pool.length > 0;
  if (!sets.length && !auto) return { ids: [], assets: {} };
  const one = auto && Number.isFinite(+opts.seed) && opts.seed !== null && opts.seed !== undefined ? poolEntryFor(pool, +opts.seed) : -1;
  const set = auto ? (one >= 0 ? pool[one].set : pool.flatMap(e => e.set)) : sets[((setIndex % sets.length) + sets.length) % sets.length], assets = {}, ids = [];
  // a picture's id carries its size beside the first when that is not 1: one file may stand alone in one entry and second in another
  const idOf = ({ file, k }) => "sub-" + file + (k && k !== 1 ? "@" + k : "");
  const imgs = new Map();
  await Promise.all([...new Set(set.map(p => p.file))].map(async file => {
    const img = await new Promise((res, rej) => { const i = new Image(); i.decoding = "async"; i.onload = () => res(i); i.onerror = () => rej(new Error("The picture " + file + " did not load.")); i.src = base + file + ".webp"; });
    imgs.set(file, img);
  }));
  for (const p of set) {
    const id = idOf(p), img = imgs.get(p.file);
    if (!assets[id]) { assets[id] = { img, meta: { id, model: subject.label, finish: "", w: img.naturalWidth, h: img.naturalHeight, metal: "#888888", flat: true, k: p.k || 1 } }; ids.push(id); }
  }
  if (auto) POOLS.set(subject.key, pool.map(e => ({ ids: e.set.map(idOf), w: e.w })));
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
const PF = { edge: .016, small: 4.5, large: 3, product: 1.25, thumbHead: 20, thumbNum: 16, calm: .32 };   // calm: JPEG bytes a pixel at 540 (see fullPreflight); the 120 phone ads of full_ad_check weigh .105 to .243   // edge: 17px of 1080; a shadow's fringe on a light ground reaches 21
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
  // the one list of words no ad of ours says (spec/banned-words.json, rule 143, through
  // motion/banned-words.js): what PROOF and "up to" already say is not said twice. A phone ad is
  // one with no other subject (the iPhone line) or one the maker marks so (subject_cat).
  const cat = st.subject_cat || (!st.subject || st.subject === "iphone" ? "phones" : "");
  const SAID_ABOVE = new Set(["up-to-price", "highest", "number-one", "best", "superlative", "guaranteed"]);
  const told = new Set();
  for (const [name, text] of parts) {
    const m = PROOF.exec(String(text)); if (m) say("proof", "note", `"${m[2].trim().toUpperCase()}" in the ${name} is a claim you may be asked to prove. "Fair offer" or "cash today" says it without the risk.`);
    if (/\bUP TO\s*\$?\d/i.test(String(text))) say("proof", "note", `"Up to" a price in the ${name} is read as the usual price. Name what you pay for one model, or leave the price out.`);
    for (const b of bannedIn(text, cat)) if (!SAID_ABOVE.has(b.id) && !told.has(b.id)) { told.add(b.id); say("words", "note", `${b.say} (In the ${name}.)`); }
  }
  const site = String(st.site || st.feed_site || "").trim();
  if (site && !/[a-z0-9-]+\.[a-z]{2,}/i.test(site)) say("address", "note", "The website does not look like an address. Write it as it is typed, like www.yourshop.com.");
  if (!site && !String(st.biz || "").trim()) say("identity", "note", "Nothing on the ad says who is buying. Add your business name: a named buyer is the one people trust.");
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
  // markHex: a mark the line carries in another colour (the footer's pin, in the accent) is the line's own,
  // not what stands behind it: its pixels are set aside with the letters (2026-11-18: a cyan pin read as
  // the ground under white towns, 2.8:1, and stopped a quarter of the quick ads on the cool pairs)
  const reads = (r, inkHex, markHex) => {
    const bx0 = Math.max(0, r[0] | 0), by0 = Math.max(0, r[1] | 0), bw = Math.min(W, Math.ceil(r[2])) - bx0, bh = Math.min(H, Math.ceil(r[3])) - by0;
    if (bw < 6 || bh < 6) return 99;
    const Li = Lhex(inkHex), light = Li >= .18, n = bw * bh, Lm = new Float32Array(n), isInk = new Uint8Array(n);
    const mk = markHex ? [1, 3, 5].map(i => parseInt(markHex.slice(i, i + 2), 16)) : null;
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      const o = ((by0 + y) * W + bx0 + x) * 4, L = Lat(px, o), i = y * bw + x; Lm[i] = L;
      if (cr(L, Li) < 1.6 || (mk && Math.abs(px[o] - mk[0]) + Math.abs(px[o + 1] - mk[1]) + Math.abs(px[o + 2] - mk[2]) < 90)) isInk[i] = 1;
    }
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
  // a number with no plate, or on a pane of glass or inside an edge alone (rule 154), stands on the ground in the ink
  const numInk = ad.st.number_style === "underline" || ["glass", "outline"].includes(ad.st.plate_fill) ? ink : plateInk;
  // each small line in its own ink (rule 158): on the ground the small lines' (F.ink), on a sign the sign's, in a
  // speech bubble or on a band that plate's; a bubble and a band are read on their straight middles, as a pill is
  const gk = F.ink || ink, onSign = !!F.board;
  const lines = [["line", "the line under the headline", onSign ? ink : gk, PF.small], ["call to action", "the line over the number", F.cta ? F.cta.ink : gk, PF.small], ["footer", "the towns and website", F.footBand ? F.footBand.ink : gk, PF.small],
    ["number", "the phone number", numInk, PF.large], ["claim", "the claim", ad.claim ? ad.claim.ink : plateInk, PF.small]];
  let worst = 99, worstName = "";
  for (const [key, name, col, need] of lines) {
    let r = R[key]; if (!r) continue;
    if (key === "number" && ad.st.number_style !== "underline") r = inPill(r);
    if (key === "call to action" && F.cta) r = inPill([r[0], r[1], r[2], r[1] + F.cta.h]);
    if (key === "footer" && F.footBand) r = inPill(r);
    if (key === "claim") r = inPill([ad.claim.x, ad.claim.y, ad.claim.x + ad.claim.c.width, ad.claim.y + ad.claim.c.height]);
    const got = reads(r, col, key === "footer" ? ad.hot : key === "number" && F.numBar ? F.numBar : null);
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

  /* calm: how busy the picture is, by what it weighs compressed. Dense detail is the measured thing that
     costs an ad attention in a feed, and compressed size is how the eye-tracking work measured it
     (competitor research, 2026-11-12). The bar is set over what this layout draws today (full_ad_check
     prints the spread), so it catches the day a ground, an effect or an icon makes the ad busier. */
  // weighed at one size (540 on the short side), whatever size the picture is: a small picture weighs more a pixel
  let bpp = 0;
  try {
    // on a photograph (2026-11-18) the ground's own detail is the owner's choice, not the ad's busyness:
    // what is weighed is what stands on it, every pixel of the ground laid flat in the pair's ground colour
    let src = frame;
    if (ad.groundImg) {
      const flat = canvas(W, H), fx = flat.getContext("2d"), id = fx.createImageData(W, H), o = id.data, [gr, gg, gb] = [1, 3, 5].map(i => parseInt(ad.p.ground.slice(i, i + 2), 16));
      for (let q = 0; q < o.length; q += 4) { if (drawn(q)) { o[q] = px[q]; o[q + 1] = px[q + 1]; o[q + 2] = px[q + 2]; } else { o[q] = gr; o[q + 1] = gg; o[q + 2] = gb; } o[q + 3] = 255; }
      fx.putImageData(id, 0, 0); src = flat;
    }
    const k = 540 / U, sw = Math.round(W * k), sh = Math.round(H * k), sc = canvas(sw, sh); sc.getContext("2d").drawImage(src, 0, 0, sw, sh); bpp = sc.toDataURL("image/jpeg", .8).length * .75 / (sw * sh);
  }
  catch (e) { /* a canvas that cannot be read is not measured */ }
  checks.push({ id: "calm", ok: !bpp || bpp <= PF.calm, value: bpp ? `${(bpp * 100).toFixed(1)} of ${(PF.calm * 100).toFixed(0)} allowed` : "not measured", bpp });
  if (bpp > PF.calm) say("calm", "note", "The picture is busy. A plainer look reads faster in a feed: try New look.");

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
  ad.still = null; ad._still = true;   // the call to action's mark at rest (_ctaMark)
  try { ad.frame(c.getContext("2d"), t, { subsFly: 4, subsMove: 2 }, 1 / 30); } finally { ad._still = false; }
  return c;
}
