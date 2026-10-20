// iPhones.LA's internal campaign adapter. The shared motion engine owns type,
// composition, timing and encoding. This module owns business presets and the
// placement of an unaltered inventory photograph in that composition.
import { DEFAULT_STYLE } from "../motion/catalog.js";
import { Ad, ASPECTS, EXPORT_QUALITY, canvas, harmonise, loadFonts, fontsFor, inkSprite, splitLines, trim } from "../motion/engine.js";
import { auditLook } from "../motion/audit.js";
import { renderSoundtrack } from "../motion/audio.js";
import { exportMp4, recordRealtime, canEncode, recorderMime } from "../motion/export.js";

const PREVIEW_QUALITY = { subsFly: 2, subsMove: 1 };
const PHONE_IDS = ["16-teal", "16-ultramarine"];
const LOOKS = {
  clean: { palette: "arctic", font: "franklin", background: "flat", text_fx: "flat", number_style: "pill" },
  bold: { palette: "cobalt", font: "franklin", background: "flat", text_fx: "shadow", number_style: "pill" },
  editorial: { palette: "paper", font: "zodiak", background: "flat", text_fx: "flat", number_style: "box" },
};
const PHOTO_ID = "iphonesla-original-photo";
const REQUIRED_CHECKS = new Set(["words", "headline", "number", "contrast"]);
let sharedAssets;
let rendererSerial = 0;

function imageFrom(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The picture could not load. Try a JPG, PNG or WebP image."));
    image.src = url;
  });
}

// Loading the maker's whole catalogue would fetch every phone for a two-phone
// campaign. Its index remains the authority for each picture and its metadata.
async function catalogueAssets() {
  if (!sharedAssets) sharedAssets = (async () => {
    const base = new URL("../motion/phones/", import.meta.url);
    const response = await fetch(new URL("index.json", base));
    if (!response.ok) throw new Error("The studio's device pictures could not load.");
    const index = (await response.json()).phones;
    const phones = {};
    await Promise.all(PHONE_IDS.map(async id => {
      const meta = index.find(row => row.id === id && row.ok !== false && !row.repaint);
      if (!meta) throw new Error("A campaign device picture is unavailable.");
      phones[id] = { img: await imageFrom(new URL(`${id}.webp`, base).href), meta };
    }));
    return { phones };
  })().catch(error => { sharedAssets = null; throw error; });
  return sharedAssets;
}

function shortText(value, max, label, required = false) {
  const text = String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  if (required && !text) throw new Error(`${label} is required.`);
  if (text.length > max) throw new Error(`${label} must be ${max} characters or fewer.`);
  return text;
}

function campaignStyle(draft, hasPhoto) {
  const headline = shortText(draft.headline, 60, "Headline", true);
  const detail = shortText(draft.detail, 40, "Small line");
  const cta = shortText(draft.cta, 24, "Call to action", true);
  const phone = shortText(draft.phone || "(562) 999-4994", 22, "Phone number", true);
  if (!/^(?:1)?\d{10}$/.test(phone.replace(/\D/g, ""))) throw new Error("Enter a complete ten-digit US phone number.");
  if (!["9:16", "4:5", "1:1"].includes(draft.aspect)) throw new Error("Choose Story, Feed or Square.");
  if (![6, 8].includes(Number(draft.duration))) throw new Error("Choose a six- or eight-second video.");
  const look = LOOKS[draft.look] || LOOKS.clean;
  return {
    ...DEFAULT_STYLE, ...look,
    headline, tag: detail, number: phone, number_label: cta,
    aspect: draft.aspect, duration: Number(draft.duration), seed: (Number(draft.seed) || 1) >>> 0,
    phones: hasPhoto ? [PHOTO_ID] : PHONE_IDS.slice(),
    number_font: "oswald", number_format: "dashed", number_pos: "bottom-center",
    number_in: "slide_up", text_pos: "top-center", text_in: "slide", case: "title",
    text_scale: .78, number_scale: 1.1, tracking: 0, skew: 0,
    arrangement: "lineup", phone_scale: hasPhoto ? .95 : .84,
    entry: "float_up", end_face: "back", front_glimpse: "spin", pose: "flat", phone_idle: "still",
    camera: "still", hook: "cold_open", hook_text: "", board: "none", decor: [], accents: 0,
    urgency: "none", cta: "", overlay: "none", outro: "none", grade: "none", depth: "none",
    flash: false, shine: false, shake: 0, glare: 0, grain: false, sparkles: false,
    speed_lines: false, rgb_hit: false, scrim: 0, voice: "off", vo_clip: "", vo_text: "", track: "none",
  };
}

// This class remains an Ad: all lettering, collision repair, timeline, preview,
// still selection and video encoding run through the existing implementation.
class CampaignAd extends Ad {
  constructor(style, assets, width, height) {
    super(style, assets, width, height);
    // The maker's small line is an uppercase whisper under a giant headline.
    // Social instructions need body-sized type. Reuse its exact text painter
    // and placement/collision passes, preserving the shop's supplied casing.
    const textBlock = (text, scale) => {
      if (!text) return null;
      const size = this.W * scale, maxWidth = this.W * .84;
      const paint = line => trim(inkSprite(line, [...line].map(() => this.pHead.ink), "satoshi", size, 0, "flat", this.pHead).c);
      const whole = paint(text);
      if (whole.width <= maxWidth) return whole;
      const rows = splitLines(text, 2).map(paint);
      const gap = Math.ceil(size * .3), target = canvas(Math.max(...rows.map(row => row.width)), rows.reduce((h, row) => h + row.height, 0) + gap);
      let y = 0;
      for (const row of rows) { target.getContext("2d").drawImage(row, (target.width - row.width) / 2, y); y += row.height + gap; }
      return target;
    };
    this.tag = textBlock(style.tag, .047);
    this.st.tag = style.tag;
    this.num = { ...this.num, label: textBlock(style.number_label, .034) };
    this.pos = this._place(this.lines, this.lineH, this.blockH, this.tag, this.num, this.margin, this.size);
    this._numberBelowPhones();
    this._headlineOffPhones();
    this._shrinkClear(.005);
    // The generic collision gate allows objects to nearly touch. A social
    // supporting line and CTA need a visible gap, including in the square.
    const gap = this.W * .045;
    const top = this.pos.outer[3] + gap;
    const bottom = (this.pos.label?.[1] ?? this.pos.num[1]) - gap;
    if (this.phones.length && bottom > top) {
      const bounds = this.phones.map(phone => {
        const angle = phone.angle * Math.PI / 180;
        const halfWidth = phone.size * (phone.w * Math.abs(Math.cos(angle)) + phone.h * Math.abs(Math.sin(angle))) / 2;
        const halfHeight = phone.size * (phone.h * Math.abs(Math.cos(angle)) + phone.w * Math.abs(Math.sin(angle))) / 2;
        return [phone.home[0] - halfWidth, phone.home[1] - halfHeight, phone.home[0] + halfWidth, phone.home[1] + halfHeight];
      });
      const left = Math.min(...bounds.map(box => box[0])), right = Math.max(...bounds.map(box => box[2]));
      const y0 = Math.min(...bounds.map(box => box[1])), y1 = Math.max(...bounds.map(box => box[3]));
      const k = Math.min(1, (bottom - top) / (y1 - y0), this.W * .84 / (right - left));
      const cx = (left + right) / 2, cy = (y0 + y1) / 2;
      const targetY = Math.max(top + (y1 - y0) * k / 2, Math.min(bottom - (y1 - y0) * k / 2, cy));
      for (const phone of this.phones) {
        phone.home = [this.W / 2 + (phone.home[0] - cx) * k, targetY + (phone.home[1] - cy) * k];
        phone.size *= k;
      }
      this.socialSubjectFit = k;
    } else if (this.phones.length) this.socialSubjectFit = 0;
    // The maker adds a vignette even to its flat ground. A literal flat
    // business ground also keeps the Story safety inset visually seamless.
    const ground = this.bg.getContext("2d");
    ground.fillStyle = this.p.ground;
    ground.fillRect(0, 0, this.W, this.H);
    this._contrastGuard();
    this.still = null;
  }

  _phonesLayer(t, dt, quality) {
    const original = this.assets.phones[PHOTO_ID];
    if (!original) return super._phonesLayer(t, dt, quality);

    // phoneFromFile flood-erases a plain background; drawPhone fabricates the
    // unseen screen/rails. Neither is appropriate for a photo of stock for sale.
    // Keep the complete photo and the shared layout's footprint, face-on.
    const subject = this.phones[0];
    const layer = this.acc;
    const ctx = layer.getContext("2d");
    ctx.globalAlpha = 1;
    ctx.drawImage(this.bg, 0, 0);
    this._drawRays(ctx, t);
    if (this.liveGround) this._drawLiveGround(ctx, t);
    if (subject) {
      const progress = Math.max(0, Math.min(1, (t + .15) / .65));
      const lift = (1 - progress) ** 3 * this.H * .035;
      const width = subject.w * subject.size, height = subject.h * subject.size;
      ctx.drawImage(original.img, subject.home[0] - width / 2, subject.home[1] - height / 2 + lift, width, height);
    }
    return layer;
  }

  frame(ctx, t, quality = EXPORT_QUALITY, dt = 1 / 30) {
    // Story UI covers the very top and bottom. Inset the entire shared
    // composition, preserving its proportions and collisions at every size.
    // The surrounding ground is the same palette, never a cropped picture.
    if (this.st.aspect !== "9:16") return super.frame(ctx, t, quality, dt);
    const inner = this.socialFrame || (this.socialFrame = canvas(this.W, this.H));
    super.frame(inner.getContext("2d"), t, quality, dt);
    ctx.fillStyle = this.p.ground;
    ctx.fillRect(0, 0, this.W, this.H);
    const scale = .74;
    ctx.drawImage(inner, this.W * (1 - scale) / 2, this.H * (1 - scale) / 2, this.W * scale, this.H * scale);
  }
}

function compositionBlockers(ad, style) {
  const blockers = [];
  if (style.tag && (!ad.tag || ad.st.tag !== style.tag)) blockers.push("The small line does not fit. Shorten the headline or small line.");
  if (style.number_label && !ad.num.label) blockers.push("The call to action does not fit. Shorten the headline or call to action.");
  if (ad._headCover() > .01) blockers.push("The item and words are too close. Shorten the copy or choose another format.");
  if ((ad.socialSubjectFit ?? 1) < .45) blockers.push("There is too little room for the item photo. Shorten the copy or choose a taller format.");
  const rects = [
    ["headline", ad.pos.outer],
    ["phone number", [ad.pos.num[0], ad.pos.num[1], ad.pos.num[0] + ad.num.c.width, ad.pos.num[1] + ad.num.c.height]],
  ];
  if (ad.tag) rects.push(["small line", [ad.pos.tag[0], ad.pos.tag[1], ad.pos.tag[0] + ad.tag.width, ad.pos.tag[1] + ad.tag.height]]);
  if (ad.num.label && ad.pos.label) rects.push(["call to action", [ad.pos.label[0], ad.pos.label[1], ad.pos.label[0] + ad.num.label.width, ad.pos.label[1] + ad.num.label.height]]);
  for (const [label, rect] of rects) {
    if (rect.some(n => !Number.isFinite(n)) || rect[0] < 0 || rect[1] < 0 || rect[2] > ad.W || rect[3] > ad.H)
      blockers.push(`The ${label} reaches outside the design. Shorten the copy or choose another look.`);
  }
  return blockers;
}

export async function createRenderer() {
  const rendererId = ++rendererSerial;
  let assets = await catalogueAssets();
  let photo = null, photoUrl = null, style = null, preview = null, stillTime = null;
  let report = null, version = 0, photoVersion = 0, disposed = false;
  const assertReady = () => {
    if (disposed || !preview || !style) throw new Error("Build a campaign preview first.");
    if (report?.blockers.length) throw new Error(report.blockers.join(" "));
  };
  const make = (width, height) => new CampaignAd(style, assets, width, height);
  const dimensions = () => {
    const [width, height] = ASPECTS[style?.aspect] || ASPECTS["9:16"];
    return { width, height, w: width, h: height, aspect: style?.aspect || "9:16", duration: style?.duration || 6 };
  };
  const still = async (onProgress = () => {}) => {
    if (stillTime != null) return stillTime;
    const VS = window.VideoStill;
    if (!VS) throw new Error("The studio's photo exporter did not load. Reload this page.");
    const { width, height } = dimensions(), scale = 320 / Math.max(width, height);
    const probe = make(Math.round(width * scale), Math.round(height * scale));
    const target = canvas(probe.W, probe.H);
    const from = Math.max(probe.tl.number + .65, probe.tl.tag + .4, probe.tl.still);
    const to = Math.max(from, Math.min(style.duration - .15, from + 1.5));
    const best = await VS.best({
      frame(t) { probe.frame(target.getContext("2d"), t, PREVIEW_QUALITY); return target; },
      windows: [[from, to]], onProgress,
    });
    stillTime = best.t;
    return stillTime;
  };

  return {
    async build(draft, options = {}) {
      if (disposed) throw new Error("This preview has been closed.");
      const buildVersion = ++version;
      // Invalid edits never leave the old campaign available for export.
      preview = null; style = null; report = null; stillTime = null;
      if (Object.prototype.hasOwnProperty.call(options, "photoFile")) {
        const file = options.photoFile;
        let nextPhoto = null, nextUrl = null;
        if (file != null) {
          if (!(file instanceof Blob) || file.size > 20 * 1024 * 1024) throw new Error("Choose an image smaller than 20 MB.");
          nextUrl = URL.createObjectURL(file);
          try {
            const image = await imageFrom(nextUrl);
            if (image.naturalWidth * image.naturalHeight > 40e6) throw new Error("Choose a photo smaller than 40 megapixels.");
            nextPhoto = { img: image, meta: { id: PHOTO_ID, model: "Original inventory photo", finish: "Original", w: image.naturalWidth, h: image.naturalHeight, metal: "#777777" } };
          } catch (error) { URL.revokeObjectURL(nextUrl); throw error; }
        }
        if (buildVersion !== version || disposed) { if (nextUrl) URL.revokeObjectURL(nextUrl); return { stale: true, blockers: [] }; }
        if (photoUrl) URL.revokeObjectURL(photoUrl);
        photo = nextPhoto; photoUrl = nextUrl; photoVersion++;
      }
      const base = await catalogueAssets();
      const nextAssets = { phones: { ...base.phones, ...(photo ? { [PHOTO_ID]: photo } : {}) } };
      const raw = campaignStyle(draft, !!photo);
      // The engine caches layout by style and asset count. Two replacement
      // photos can have different proportions despite keeping one asset slot.
      raw.social_photo_version = `${rendererId}:${photoVersion}`;
      const nextStyle = harmonise(raw, new Set(Object.keys(raw)), Object.fromEntries(Object.entries(nextAssets.phones).map(([id, item]) => [id, item.meta])));
      await loadFonts([...fontsFor(nextStyle), "satoshi"]);
      if (buildVersion !== version || disposed) return { stale: true, blockers: [] };
      const [width, height] = ASPECTS[nextStyle.aspect];
      const scale = 640 / Math.max(width, height);
      const nextPreview = new CampaignAd(nextStyle, nextAssets, Math.round(width * scale), Math.round(height * scale));
      const blockers = compositionBlockers(nextPreview, nextStyle);
      const audit = await auditLook(nextStyle, nextAssets, { AdClass: CampaignAd, size: 240, secs: 3.4, sound: false });
      if (buildVersion !== version || disposed) return { stale: true, blockers: [] };
      for (const check of audit.checks) if (REQUIRED_CHECKS.has(check.id) && !check.ok)
        blockers.push(`${check.label}: ${check.value}. Shorten the copy or choose another look.`);
      if (draft.category === "inventory" && !photo) blockers.push("Add a photo of the actual item before exporting an inventory ad.");
      const warnings = audit.checks.filter(check => !check.ok && !REQUIRED_CHECKS.has(check.id)).map(check => `${check.label}: ${check.value}.`);
      report = { audit, blockers: [...new Set(blockers)], warnings, hasPhoto: !!photo };
      style = nextStyle; assets = nextAssets; preview = nextPreview;
      return report;
    },
    draw(target, { video = false, time = 0 } = {}) {
      if (!preview || disposed) return;
      if (target.width !== preview.W || target.height !== preview.H) { target.width = preview.W; target.height = preview.H; }
      const t = video ? Math.max(0, Math.min(style.duration - .001, Number(time) || 0))
        : (stillTime ?? Math.max(preview.tl.number + .8, preview.tl.tag + .4, preview.tl.still));
      preview.frame(target.getContext("2d"), t, PREVIEW_QUALITY);
    },
    async jpg(onProgress = () => {}) {
      assertReady();
      const exportVersion = version, t = await still(p => onProgress(p * .4, "Choosing the clearest frame"));
      if (exportVersion !== version) throw new Error("The campaign changed. Export the new preview.");
      const VS = window.VideoStill, { width, height } = dimensions();
      const { w, h } = VS.size(width, height);
      const ad = make(w, h), target = canvas(w, h);
      ad.frame(target.getContext("2d"), t, EXPORT_QUALITY);
      onProgress(.8, "Saving the photo");
      const blob = await VS.toBlob(target);
      onProgress(1, "Photo ready");
      return { blob, ext: "jpg", w, h, width: w, height: h, t };
    },
    async video(onProgress = () => {}) {
      assertReady();
      const { width, height, duration } = dimensions();
      const ad = make(width, height);
      let result, audioBuf = null, soundLost = false;
      try {
        onProgress(0, "Mixing the music");
        audioBuf = await renderSoundtrack(ad);
      } catch (error) {
        soundLost = true;
        console.warn("Campaign soundtrack failed; the clip can still be saved.", error);
        onProgress(0, "Music could not load; making the clip without sound");
      }
      if (await canEncode(width, height)) {
        try { result = await exportMp4(ad, onProgress, { audioBuf }); }
        catch (error) {
          if (error.code === "frames") throw error;
          if (error.code === "audio") { audioBuf = null; soundLost = true; }
          try { result = await exportMp4(ad, onProgress, { audioBuf, software: true }); }
          catch (retryError) {
            if (retryError.code === "frames" || recorderMime() === null) throw retryError;
            result = await recordRealtime(ad, onProgress, { audioBuf });
          }
        }
      } else {
        if (recorderMime() === null) throw new Error("This browser cannot record video. Open this tool in Chrome or Safari.");
        result = await recordRealtime(ad, onProgress, { audioBuf });
      }
      return { ...result, soundLost: soundLost || !!result.soundLost, w: width, h: height, width, height, seconds: duration };
    },
    dimensions,
    dispose() {
      disposed = true; version++;
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      photoUrl = null; photo = null; preview = null; assets = null; style = null;
    },
  };
}
