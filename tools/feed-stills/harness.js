// Feed stills: the Designer Library's iPhone ads redrawn by the video engine.
//
// The owner, 2026-11-03, looking at the 32 iPhone cards iPhones LA was about
// to post: "For any of the ones that use the same image, can we just make a
// variation with different phones or different background", and "make the
// text as large and legible as possible ... take a look at the videos.
// They're much bigger text and big CTA and the headlines are maximizing
// space". So the picture is the video maker's own photo (motion/app.js
// makePhoto: the clearest moment after the number lands, drawn again at full
// size), and this file only changes two things the maker keeps small:
//
// - the tag, which the maker sets at a quarter of the headline (about 40px on
//   a 1080 square), carries how the service works and is set at body size;
// - the label over the number (the call to action) is set at body size too.
//
// The same way the social studio does it (social/media.js CampaignAd): a
// subclass that reuses the engine's painter, placement and collision passes.
// The engine itself is used read-only.
import { Ad, ASPECTS, randomize, loadPhones, loadFonts, fontsFor, inkSprite, splitLines, trim, canvas, lum, prog, outBack } from "../../motion/engine.js";
import { DEFAULT_STYLE, FONTS } from "../../motion/catalog.js";
import { loadAccents } from "../../motion/accents.js";
import { auditLook } from "../../motion/audit.js";

// Proportions of the frame's width. 1080 x .052 = 56px, x .044 = 48px, x .032 = 35px.
// edge: nothing nearer the frame's edge than 38px; gap: no two stacked blocks nearer than 22px.
// claim: the bold claim's badge at the top (its letters 41px, down to 32px to fit); foot: the
// locations and the website under the number (35px).
export const FEED = { tag: .052, label: .044, site: .042, foot: .032, claim: .038, claimMin: .03, edge: .035, gap: .02 };
const LEGIBLE = new Set(["grotesk", "geometric", "condensed", "wide"]);
const REQUIRED = ["words", "headline", "number", "contrast"];

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

class FeedAd extends Ad {
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
      // pops in first, then its glow breathes (a 1.6 s pulse) for the rest of the ad
      const q = prog(t, .1, .45);
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
function blockers(ad, st) {
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
function phoneBox(ad) {
  const box = ad.phones.map(p => {
    const a = p.angle * Math.PI / 180;
    const hw = p.size * (p.w * Math.abs(Math.cos(a)) + p.h * Math.abs(Math.sin(a))) / 2;
    const hh = p.size * (p.h * Math.abs(Math.cos(a)) + p.w * Math.abs(Math.sin(a))) / 2;
    return [p.home[0] - hw, p.home[1] - hh, p.home[0] + hw, p.home[1] + hh];
  });
  return [Math.min(...box.map(b => b[0])), Math.min(...box.map(b => b[1])), Math.max(...box.map(b => b[2])), Math.max(...box.map(b => b[3]))];
}

const assets = {};
let booted = null;
async function boot() {
  const { phones, index } = await loadPhones("./phones/");                      // from /motion/, the page's base
  assets.phones = phones; assets.index = index;
  assets.accents = await loadAccents("../assets/cutouts/");
  await loadFonts(["franklin"]);
}

async function still(st, size) {
  const VS = window.VideoStill;
  const [W0, H0] = ASPECTS[st.aspect];
  const g = VS.size(W0, H0, 360), probe = new FeedAd(st, assets, g.w, g.h);
  const pc = canvas(probe.W, probe.H), px = pc.getContext("2d");
  // the photo is taken only once everything has landed: the number's entrance done (a wipe
  // caught half way cut it to "999-49"), the service line in, the phones down (caught in flight
  // they drew as a grey speck); the checks above measure the landed layout, so this is that
  const from = Math.max(isFinite(probe.tl.number) ? probe.tl.number + .8 : 0, (probe.tl.tag || 0) + .5, (probe.tLanded || 0) + .3);
  const to = Math.max(from + .1, (probe.tOutro != null ? probe.tOutro : st.duration) - .05);
  const pick = await VS.best({ frame: t => { probe.still = null; probe.frame(px, t, { subsFly: 2, subsMove: 2 }); return pc; }, windows: probe.photoWindows(from, to) });
  const { w, h } = VS.size(W0, H0, size), ad = new FeedAd(st, assets, w, h);
  const c = canvas(ad.W, ad.H);
  ad.still = null; ad.frame(c.getContext("2d"), pick.t, { subsFly: 8, subsMove: 4 }, 1 / 30);
  return { c, ad, t: pick.t };
}

window.FS = {
  async ready() { booted = booted || boot(); await booted; return Object.keys(assets.phones).length; },
  phones() { return assets.index.map(m => ({ id: m.id, model: m.model, finish: m.finish, repaint: !!m.repaint })); },
  /** One look: the card's words locked, everything else the maker's own draw for this seed. */
  async look(content, seed, lock = {}, size = 1080) {
    await window.FS.ready();
    // __force (debugging): draw the picture even when a check fails, with the reasons
    const force = !!lock.__force; lock = { ...lock }; delete lock.__force;
    // the engine's own small tag is kept in, so its timeline brings the line on; FeedAd redraws it
    const base = { ...DEFAULT_STYLE, ...lock, ...content, aspect: "1:1", tag: content.feed_line || "" };
    const locked = new Set([...Object.keys(lock), ...Object.keys(content), "aspect", "tag"]);
    const pool = lock.phones ? [] : (content.pool || Object.keys(assets.phones));
    const st = randomize(base, seed, locked, pool, false);
    await loadFonts([...fontsFor(st), "franklin"]);
    const plan = new FeedAd(st, assets, 540, 540);
    const why = blockers(plan, st);
    if (why.length && !force) return { ok: false, why, style: st };
    const audit = await auditLook(st, assets, { AdClass: FeedAd, size: 240, secs: 3.4, sound: false });
    for (const c of audit.checks) if (REQUIRED.includes(c.id) && !c.ok) why.push(c.label + ": " + c.value);
    if (why.length && !force) return { ok: false, why, style: st };
    const { c, ad, t } = await still(st, size);
    // Everything below is measured on the picture that is delivered (1080, at the photo's own
    // moment), drawn twice more: without the lines this file adds, and without them and the
    // phones. A smaller copy is not the same picture: for some entrances (rain) the phones of a
    // 540 copy stood at the side while the 1080 photo had them as a grey speck in the middle.
    const S = ad.W, bare = (phones) => {
      const x = new FeedAd(st, assets, S, S), xc = canvas(S, S);
      x.tag = null; x.num = { ...x.num, label: null }; x.site = null; x.still = null; x.accents = []; x.perks = null;
      if (!phones) x.drawOrder = [];
      x.frame(xc.getContext("2d"), t, { subsFly: 8, subsMove: 4 }, 1 / 30);
      return xc.getContext("2d").getImageData(0, 0, S, S).data;
    };
    const gpx = bare(true), npx = bare(false), ink = ad.pHead.ink, light = lum(ink) >= .5;
    const lin = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
    const parts = [["service line", ad.tag && ad.pos.tag, ad.tag], ["call to action", ad.num.label && ad.pos.label, ad.num.label], ["footer", ad.site && ad.pos.site, ad.site]];
    // the lines this file adds, against the ground they stand on: the ground's brightest tenth
    // under light ink (darkest under dark) must give 3.5:1, the large-text standard with room
    // to spare, so a busy ground cannot swallow them
    const contrast = {};
    for (const [name, at, spr] of parts) {
      if (!at || !spr) continue;
      const Ls = [];
      for (let y = Math.max(0, at[1] | 0); y < Math.min(S, at[1] + spr.height); y += 3)
        for (let x = Math.max(0, at[0] | 0); x < Math.min(S, at[0] + spr.width); x += 3) { const q = (y * S + x) * 4; Ls.push(.2126 * lin(gpx[q]) + .7152 * lin(gpx[q + 1]) + .0722 * lin(gpx[q + 2])); }
      Ls.sort((a, b) => a - b);
      const worst = Ls[Math.min(Ls.length - 1, Math.floor(Ls.length * (light ? .9 : .1)))], [r, gg, b] = [ink.slice(1, 3), ink.slice(3, 5), ink.slice(5, 7)].map(h => lin(parseInt(h, 16)));
      const L = .2126 * r + .7152 * gg + .0722 * b, cr = (Math.max(L, worst) + .05) / (Math.min(L, worst) + .05);
      contrast[name] = +cr.toFixed(2);
      if (cr < 3.5) why.push(`${name} contrast ${cr.toFixed(1)}:1`);
    }
    // the phones as drawn: the pixels that change without them. At least 11% of the height,
    // clear of every block of words
    let pl = S, pt = S, pr = -1, pb = -1;
    for (let y = 0; y < S; y += 3) for (let x = 0; x < S; x += 3) {
      const q = (y * S + x) * 4;
      if (Math.abs(gpx[q] - npx[q]) + Math.abs(gpx[q + 1] - npx[q + 1]) + Math.abs(gpx[q + 2] - npx[q + 2]) > 90) { if (x < pl) pl = x; if (x > pr) pr = x; if (y < pt) pt = y; if (y > pb) pb = y; }
    }
    const drawn = pr < 0 ? 0 : (pb - pt) / S;
    if (drawn < .11) why.push(`phones drawn ${Math.round(drawn * 100)}% of the height`);
    else {
      const gp = S * FEED.gap * .8, rects = [["headline", ad.pos.outer], ["number", [ad.pos.num[0], ad.pos.num[1], ad.pos.num[0] + ad.num.c.width, ad.pos.num[1] + ad.num.c.height]]];
      if (ad.claim) rects.push(["claim", [ad.claim.x, ad.claim.y, ad.claim.x + ad.claim.c.width, ad.claim.y + ad.claim.c.height]]);
      for (const [name, at, spr] of parts) if (at && spr) rects.push([name, [at[0], at[1], at[0] + spr.width, at[1] + spr.height]]);
      for (const [name, r] of rects) if (pl < r[2] && pr > r[0] && pt < r[3] + gp && pb > r[1] - gp) why.push(`phones as drawn reach the ${name}`);
    }
    if (why.length && !force) return { ok: false, why, style: st };
    const H = ad.H;
    const px = {
      headline: Math.round(ad.size), number: Math.round(ad._lay.nSize * H),
      service: ad.tag ? Math.round(ad.feedPx.tag) : 0, cta: ad.num.label ? Math.round(ad.feedPx.label) : 0,
      website: ad.site ? Math.round(H * FEED.site) : 0,
    };
    px.smallest = Math.min(...Object.values(px).filter(Boolean));
    return { ok: !why.length, why, url: c.toDataURL("image/jpeg", .9), t, px, contrast, phonesDrawn: +drawn.toFixed(2), phoneInk: [pl, pt, pr, pb], subjectFit: +ad.subjectFit.toFixed(2),
      audit: audit.checks.map(c => ({ id: c.id, ok: c.ok, value: c.value })), style: st };
  },
  /** A contact sheet: rows of [label, dataURL]. */
  async sheet(items, cols = 8, cell = 270) {
    const rows = Math.ceil(items.length / cols), lab = 22;
    const c = canvas(cols * cell, rows * (cell + lab)), x = c.getContext("2d");
    x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
    x.font = "bold 15px sans-serif"; x.fillStyle = "#111";
    for (let i = 0; i < items.length; i++) {
      const [label, url] = items[i], img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
      const cx = (i % cols) * cell, cy = Math.floor(i / cols) * (cell + lab);
      x.fillText(label, cx + 4, cy + 16);
      x.drawImage(img, cx, cy + lab, cell - 2, cell - 2);
    }
    return c.toDataURL("image/jpeg", .86);
  },
};
