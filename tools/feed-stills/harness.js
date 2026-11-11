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
import { ASPECTS, randomize, loadPhones, loadFonts, fontsFor, canvas, lum } from "../../motion/engine.js";
import { DEFAULT_STYLE } from "../../motion/catalog.js";
import { loadAccents } from "../../motion/accents.js";
import { auditLook } from "../../motion/audit.js";
import { FeedAd, FEED, REQUIRED, blockers } from "../../motion/fullad.js";   // the class itself: the video maker draws with it too
export { FEED };


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
    // the phones stand off their ground: burgundy and black phones on a ruby ground vanished.
    // The middle brightness of the phones' pixels against the ground's under them, 1.6:1 or more
    if (pr >= 0) {
      const P = [], G = [];
      for (let y = pt; y <= pb; y += 3) for (let x = pl; x <= pr; x += 3) {
        const q = (y * S + x) * 4, L = (d) => .2126 * lin(d[q]) + .7152 * lin(d[q + 1]) + .0722 * lin(d[q + 2]);
        G.push(L(npx));
        if (Math.abs(gpx[q] - npx[q]) + Math.abs(gpx[q + 1] - npx[q + 1]) + Math.abs(gpx[q + 2] - npx[q + 2]) > 90) P.push(L(gpx));
      }
      const mid = a => { a.sort((x, y) => x - y); return a[Math.floor(a.length / 2)] || 0; };
      const pl2 = mid(P), gl = mid(G), sep = (Math.max(pl2, gl) + .05) / (Math.min(pl2, gl) + .05);
      if (sep < 1.6) why.push(`phones blend into the ground (${sep.toFixed(2)}:1)`);
    }
    // the selling points on the picture delivered (a smaller copy found room this one did not)
    if (st.points && !ad.perks) why.push("selling points missing in the picture");
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
  /** The same ad as a video: every setting as the still had it (report.json's style), drawn
   *  by the engine's own MP4 exporter (motion/export.js), its music without a voice. */
  async video(style, size = 1080) {
    await window.FS.ready();
    await loadFonts([...fontsFor(style), "franklin"]);
    const { exportMp4 } = await import("../../motion/export.js");
    const st = { ...style, voice: "off", vo_clip: "", vo_text: "" };
    const ad = new FeedAd(st, assets, size, size);
    let res;
    try { res = await exportMp4(ad, () => {}); } catch (e) { res = await exportMp4(ad, () => {}, { audioBuf: null }); }
    const url = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(res.blob); });
    return { url, audio: res.audio, bytes: res.blob.size, seconds: st.duration };
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
