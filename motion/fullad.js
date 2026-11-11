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
  headlineLines, numberSprite, perksSprite, pointsOf, randomize, harmonise } from "./engine.js";
import { FONTS, PALETTES, DEFAULT_STYLE } from "./catalog.js";
import { drawChevrons } from "./decor.js";
import { placeAccents, timeAccents } from "./accents.js";

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

/** The house style (tools/feed-stills/render.mjs HOUSE and QUIET, 2026-11-03): one face, capitals,
 *  the double outline, one accent word, the number in a pill, and everything in the maker that
 *  puts small words or stray marks on the picture held off. */
export const HOUSE = { font: "chivo", text_fx: "double_outline", case: "upper", color_mode: "accent_word", number_style: "pill", text_pos: "top-center" };
export const QUIET = { decor: [], urgency: "none", overlay: "none", accents: 0, board: "none", number_pos: "bottom-center", number_format: "parens",
  camera: "still", shake: 0, sparkles: false, text_in: "slide", pose: "flat", end_face: "back", phone_idle: "breathe", grade: "none", depth: "none",
  text_scale: 1, number_scale: 1, tracking: 0, skew: 0, hook: "none", season: "none", phone_finish: "standard", transition: "none", ...HOUSE };
export const COLOURWAYS = ["graphite", "ink_blue", "black_gold", "money_green", "oxblood", "klein", "midnight_glass", "cream_black",
  "sapphire", "emerald", "ruby", "carbon", "midnight_teal", "royal", "noir", "midnight"];
export const GROUNDS = ["radial", "spotlight", "studio_sweep", "tonal", "spot_floor", "linear"];
export const ARRANGEMENTS = ["lineup", "fan", "showcase", "podium", "wings"];
export const ICONS = ["cash", "money", "deal", "local", "trust"];
/** What an ad says when its maker has typed nothing: claims any buyer can stand behind (no "#1",
 *  "best" or "fastest", which need proof; DESIGN-LAW's honest-claims rule). */
export const FULL_WORDS = {
  claim: ["TOP DOLLAR • FAST CASH", "HONEST BUYER • TOP DOLLAR", "QUICK REPLIES • CASH TODAY", "LOCAL & HONEST", "TOP DOLLAR PAID"],
  line: ["ALL MODELS WANTED", "NEW, USED OR CRACKED", "ANY CARRIER • ANY CONDITION"],
  points: ["FREE QUOTE, CASH SAME DAY, NO FEES", "QUOTE BY TEXT, PAID TODAY, WE MEET YOU", "TEXT US NOW, TOP DOLLAR, ANY CONDITION"],
  label: ["CALL OR TEXT", "TEXT US NOW", "GET YOUR OFFER"],
  burst: ["CASH!", "FAST CASH", "TOP $$$", "PAID TODAY"],
};

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

const stackRows = (rows, gap) => {
  const c = canvas(Math.max(...rows.map(r => r.width)), Math.ceil(rows.reduce((h, r) => h + r.height, 0) + gap * (rows.length - 1)));
  let y = 0; for (const r of rows) { c.getContext("2d").drawImage(r, (c.width - r.width) / 2, y); y += r.height + gap; }
  return c;
};

export class FullAd extends Ad {
  constructor(style, assets, width, height) {
    super(style, assets, width, height, { plan: false });   // laid out at this size by the rules below, never from the plain engine's plan
    this._evenGround();
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

  /* the engine's own room-making passes: this layout is final when _layoutType returns */
  _numberBelowPhones() {} _headlineOffPhones() {} _wordsOffPhones() {} _perksRoom() {}

  /** Every block, sized and placed. Called by the engine's constructor after the phones are
   *  built (so no field of this class exists yet: everything is read from this.st). */
  _layoutType() {
    const st = this.st, W = this.W, H = this.H, p = this.p, ph = this.pHead;
    const U = Math.min(W, H), ar = W / H, wide = ar >= 1.3, tall = ar < .7;
    const e = U * FULL.edge, g = U * FULL.gap, ey = tall ? H * .055 : e;    // a story stays clear of the app's bars
    // the column the words stand in; on a wide frame the product has the right of it
    const cx0 = e, cx1 = wide ? W * .56 : W - e, colW = cx1 - cx0, mid = (cx0 + cx1) / 2;
    const font = LEGIBLE.has((FONTS[st.font] || [])[3]) ? st.font : "franklin";
    const [fam, fwt] = FONTS[font] || FONTS.franklin;
    const ink = ph.ink, fx = lum(ink) < .5 ? "flat" : "shadow";
    const upper = t => t.toUpperCase().replace(/\bIPHONE/g, "iPHONE").replace(/\bIPAD/g, "iPAD");
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
    const numFor = z => { const n = numberSprite({ ...st, number_label: "" }, p, z, null); return { ...n, label: null }; };
    let nz = U * .09, num = numFor(nz);
    nz *= Math.min(colW * FULL.pill / num.c.width, U * FULL.number / nz); num = numFor(nz);
    for (let k = 0; k < 4 && num.c.width > colW * FULL.pill * 1.01; k++) { nz *= colW * FULL.pill / num.c.width; num = numFor(nz); }
    if (labB) num = { ...num, label: labB.c };
    // the footer: the towns after a pin, over the website
    const where = (st.feed_where || "").replace(/^\s*\p{Extended_Pictographic}️?\s*/u, "").trim().toUpperCase(), site = (st.feed_site || "").trim();
    let foot = null;
    if (where || site) {
      const [lf, lw] = FONTS[font] || FONTS.franklin;
      const pmin = Math.floor(U * FULL.footMin);
      for (let px = Math.round(U * FULL.foot); ; px = Math.max(pmin, Math.floor(px * .94))) {
        const rows = [where && footRow(where, px, ink, lf, lw, this.hot), site && footRow(site, px, ink, lf, lw)].filter(Boolean);
        if (rows.every(r => r.width <= colW)) { foot = { c: rows.length === 1 ? rows[0] : stackRows(rows, Math.round(U * .006)), px }; break; }
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
        const widest = Math.max(...lines.map(L => L.inkW));
        if (widest <= colW && blockH <= maxH * 1.02) break;
        size *= Math.min(.97, colW / widest, maxH * 1.02 / blockH);
      }
      return { size, lines, lineH, blockH, n: best.n };
    };
    const hasChips = pointsOf(st).length > 0, hasPhones = this.phones.length > 0;
    // the gaps between one block and the next, in units of g; the room left over stretches them all alike
    const gClaim = 1.15, gBand = 1.4, gLab = .8, gFoot = 1.25;
    // the line under the headline clears the outline that hangs under its letters
    const tagGap = hd => Math.max(g * .9, hd.size * .24);
    const fixedOf = hd => (claim ? claim.c.height + g * gClaim : 0) + hd.blockH + (tagB ? tagB.c.height + tagGap(hd) : 0) + g * gBand * 2
      + (labB ? labB.c.height + g * gLab : 0) + num.c.height + (foot ? foot.c.height + g * gFoot : 0);
    // the product's band: what the words must leave it (a wide frame keeps only the chips there)
    const bandMin = wide ? (hasChips ? U * .075 : 0) : H * (!hasPhones && !hasChips ? 0 : !hasPhones ? .1 : tall ? .42 : ar < .9 ? .36 : .215);
    let headMax = H * (wide ? .36 : tall ? .18 : ar < .9 ? .22 : .3), hd = headAt(headMax), band = H - 2 * ey - fixedOf(hd);
    for (let k = 0; k < 14 && band < bandMin && hd.size > U * .072; k++) { headMax *= .93; hd = headAt(headMax); band = H - 2 * ey - fixedOf(hd); }
    band = Math.max(0, band);

    /* ---- the band: selling points | the product | the sticker and the icon ----
       Sized before it is placed: the band takes the height its contents reach, and the room
       left over goes to the gaps. Two shapes are tried, and the one that shows the product
       larger is kept: the points beside the product (a low band), or across the top of it. */
    const items = pointsOf(st), face = labelFont(st);
    const phoneCap = H * (wide ? .8 : tall ? .4 : .46);
    const reach = q => { const a = q.angle * Math.PI / 180; return [q.size * (q.w * Math.abs(Math.cos(a)) + q.h * Math.abs(Math.sin(a))) / 2, q.size * (q.h * Math.abs(Math.cos(a)) + q.w * Math.abs(Math.sin(a))) / 2]; };
    // The engine spreads a set across its stage: a video's phones have the frame to themselves.
    // Here they stand shoulder to shoulder on one floor, in the engine's left-to-right order:
    // the arrangement keeps its character (a line, a fan, a shop window, a podium, wings) at
    // the spacing below, in phone widths. A leaning neighbour may tuck a little behind the
    // middle phone from the side, never from above (the set's house rules, 2026-10-02).
    if (hasPhones) {
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
    const shape = (mode) => {
      if (wide) {
        const chips = items.length ? chipsFor([[items.length, true], [items.length, false], [2, true], [2, false]], colW, band, "c") : null;
        return { mode: "wide", chips, sub: subject(W - e - W * .59, H - 2 * ey), need: chips ? chips.q.h : 0 };
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
    // the shape that shows the product largest; a sticker is worth a quarter of the product's size, an icon a twentieth
    const worth = T => T ? T.sub.k * (1 + (T.sub.rb || T.rb ? .25 : 0) + (T.sub.ri ? .05 : 0)) * (T.chips || !items.length ? 1 : .7) : -1;
    let S = shape("side");
    if (!wide && hasPhones) for (const m of ["stack", "tall"]) { const T = shape(m); if (worth(T) > worth(S) * 1.03) S = T; }
    const chips = S.chips, sub = S.sub, side = S.mode === "side";
    if (globalThis.FULL_DEBUG) console.log('DBG', JSON.stringify({ W, H, band: Math.round(band), colW: Math.round(colW), gw: Math.round(gw), gh: Math.round(gh), n: this.phones.length, mode: S.mode, k: +sub.k.toFixed(3), rb: Math.round(sub.rb), ri: Math.round(sub.ri), subW: Math.round(sub.w), subH: Math.round(sub.h), chipsW: chips ? Math.round(chips.q.w) : 0, chipsH: chips ? Math.round(chips.q.h) : 0, head: Math.round(hd.size) }));
    if (items.length && !chips) F.left.push("selling points");
    // the band takes what its contents reach; what is over is shared: each gap grows by the same step, the rest above and below
    const need = Math.min(band, S.need), spare = Math.max(0, band - need);
    const nStretch = 1 + (claim ? 1 : 0) + (tagB ? 1 : 0) + (labB ? 1 : 0) + (foot ? 1 : 0);
    const stretch = Math.min(g * 1.3, spare / (nStretch + 1.5)), bandH = need, pad = (spare - stretch * nStretch) / 2;
    let y = ey + Math.max(0, pad);
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
    const nr = put("number", num.c), nxy = [nr[0], nr[1]];
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
      this.burst = { ...F.burst, fill, ink: inkc, text: st.feed_burst || (st.lang === "es" ? "¡EFECTIVO!" : "CASH!"), t0: this.tl.hit + .12, font: burstFontFor(st) };
      this.cues.burst = this.burst.t0;
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
    if (this.fullChevrons) drawChevrons(ctx, this.numBox, this.fullChevrons * 2, this.hot, t, this.tl.number + .3, this.W, "sides");
  }
}

/** The style a full ad is drawn with: the customer's words and phones, the house style locked,
 *  and one colourway, ground, arrangement and icon for the seed (or the ones picked). Every
 *  element gets its words: what the customer left empty is filled from FULL_WORDS. keep: what
 *  the customer set by hand elsewhere in the maker (their music, their voice), left as set. */
export function fullStyle(st, seed, phoneIndex = [], pick = {}, keep = []) {
  const r = rng((seed >>> 0) * 7 + 11), one = a => a[Math.floor(r() * a.length) % a.length];
  const es = st.lang === "es";
  const look = { palette: one(COLOURWAYS), background: one(GROUNDS), arrangement: one(ARRANGEMENTS), feed_icon: one(ICONS), ...pick };
  const area = (st.area || "").trim();
  const words = {
    feed_claim: st.feed_claim ?? one(FULL_WORDS.claim),
    feed_line: st.feed_line ?? (st.tag || one(FULL_WORDS.line)),
    // the maker's own points for these words where it has them (its field shows those), else the list's
    points: st.points ?? (pointsOf(st).length ? pointsOf(st).join(", ") : one(FULL_WORDS.points)),
    number_label: st.number_label || (es ? "LLAMA O MANDA TEXTO" : FULL_WORDS.label[0]),
    feed_where: st.feed_where ?? (area ? area.toUpperCase() : ""),
    // the website as a sentence, so it reads as an address (owner, 2026-11-03: "that way they know it's a URL")
    feed_site: st.feed_site ?? (st.site ? (es ? "Visítanos en " : "Visit our website at ") + String(st.site).trim() : ""),
    feed_burst: st.feed_burst ?? (es ? "¡EFECTIVO!" : one(FULL_WORDS.burst)),
  };
  // fewer phones, larger (five on a square full of large words shrank to a strip): two where the
  // product shares its row with the selling points (a square, a wide frame), three where it has the width
  const most = st.aspect === "4:5" || st.aspect === "9:16" ? 3 : 2;
  const have = (st.phones || []).slice(0, most);
  const base = { ...DEFAULT_STYLE, ...st, ...QUIET, ...look, ...words, phones: have, full: true, seed };
  const locked = new Set([...keep, ...Object.keys(QUIET), ...Object.keys(look), ...Object.keys(words), "phones", "headline", "tag", "number", "aspect", "duration", "lang", "lang_mode", "area", "full", "accent_word", "strike_text", "hook_text"]);
  const pool = have.length ? [] : phoneIndex.map(m => m.id);
  const idx = Object.fromEntries(phoneIndex.map(m => [m.id, m]));
  const out = harmonise(randomize(base, seed, locked, pool, false), locked, idx);
  return { ...out, ...QUIET, ...look, ...words, full: true, phones: (out.phones || []).slice(0, most) };
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
  const floor = { headline: .064, number: .07, line: FULL.tagMin, cta: FULL.labelMin, footer: FULL.footMin, claim: FULL.claimMin, chips: FULL.chipMin };
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
