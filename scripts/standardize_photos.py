#!/usr/bin/env python3
"""
Photo standard: one spec for every photograph the product ships.

    python3 scripts/standardize_photos.py            # audit only; exit 1 if any photo is off-spec
    python3 scripts/standardize_photos.py --write    # bring every off-spec photo onto the spec
    python3 scripts/standardize_photos.py --json     # machine-readable report

Requires Pillow and numpy (pip install Pillow numpy).

WHY THIS EXISTS
The library was assembled from several sources over several sessions (an AI
backdrop board, a batch of transparent product cut-outs, eight original iPhone
photographs) and nothing ever held them to one standard. Measured before this
script existed (2026-09-26):

  * product cut-outs sat on identical 720px canvases at wildly different
    scales: the subject's long side filled anywhere from 20% (coin-slab, a
    144px coin rendered at 67px on four templates) to 92% of its frame, so the
    same layout slot showed products at up to 4x different sizes;
  * iphone-front's brightest pixel was 0.62 (a dull grey phone next to phones
    whose speculars reach 0.9+), and the two graded slabs had their black
    point lifted to 0.50 (milky, washed-out);
  * backdrop median luma ran from 0.079 to 0.956, black points from 0.004 to
    0.443 (washed out) and white points from 0.51 (never reaches white) to 1.0;
  * the eight original iPhone photos were 780, 900, 1024 and 1080px, JPEG q74,
    against a library that is 1200px q91 everywhere else;
  * one backdrop (dl_pokemon_slabPoster_mono) was letterboxed: a 16:9 photo
    padded to square with flat white bars that the template then stretched
    across the canvas.

WHAT IT DOES, per family
  cutouts  assets/cutouts/*.png  - trim to the subject, scale so its long side
           fills FILL of a square CANVAS (never upscaling past MAX_UPSCALE; a
           source too small for that is centred at the cap and reported),
           sharpen only what this script itself upscaled, then a bounded
           black/white-point correction. Resampling is premultiplied, so no
           dark or light fringe is introduced at the matte. A subject that
           was cut at the source (it runs off its frame) stays flush to that
           edge instead of being centred: see bleed_sides().
  photos   assets/bg/*.jpg, assets/tplbg/*.jpg - remove a letterbox, bring the
           frame to SIZE, bounded black/white-point and midtone correction,
           then encode with the library's own quantisation tables.

WHAT IT DELIBERATELY DOES NOT DO
  * Colour. White balance on the should-be-neutral pixels of every cut-out
    measured under 0.03 OKLab chroma and tracks the material (warm coins,
    gold, old silver, a titanium iPhone back), not a defect. Backdrops carry
    an intended mood per palette. Nothing here touches hue.
  * Sharpen backdrops. Their spec is defocused; sharpening bokeh is noise.
  * Upscale backdrops to the 2160px the MANIFEST asks for. A resample adds no
    detail; DESIGN-LAW rule 44 says the honest fix is regeneration.
  * Remove anything from an image that is not a defect of framing or tone.
    tplbg/sell_iphone carries the Gemini AI-generation mark in its corner;
    that is provenance, and whether it goes is the owner's decision.
  * Correct a photo all the way when the correction would be violent. Levels
    gain is capped at MAX_GAIN and midtone gamma at GAMMA_RANGE. A photo that
    hits a cap is a source problem, reported as such, not hidden.

IDEMPOTENT
Every file this script writes carries a marker (a PNG tEXt chunk / a JPEG COM
segment, both ignored by browsers). A marked file is never processed again, so
re-running --write changes nothing and a capped correction is not applied a
second time. A file that is already inside every band is left byte-identical.
A new file dropped in by the photo engine has no marker; the audit fails on it
until --write is run.

The originals of every file this rewrote are in git history at becf16f.
"""
import argparse
import io
import json
import os
import re
import sys

try:
    import numpy as np
    from PIL import Image, ImageFilter, PngImagePlugin
except ImportError:
    print("standardize_photos.py needs Pillow and numpy: pip install Pillow numpy", file=sys.stderr)
    raise

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CUTOUT_DIR = os.path.join(ROOT, "assets", "cutouts")
BG_DIR = os.path.join(ROOT, "assets", "bg")
TPLBG_DIR = os.path.join(ROOT, "assets", "tplbg")

MARK_KEY = "photo-standard"
MARK = "buybackad-photo-standard/1"

# ── the spec ────────────────────────────────────────────────────────────────
# Luma is Rec.709 weights on sRGB-encoded values, 0..1: the same yardstick as
# scripts/design_metrics.py, so numbers here and there are comparable.

CUTOUT = dict(
    CANVAS=720,          # px, square. The size the library already used, so decode cost and
                         # thumbnail downscale ratios do not change.
    FILL=0.85,           # subject long side / canvas side. The e-commerce norm ("product fills
                         # 85% of the frame"), and within 2% of the library's own median (0.83),
                         # so a typical product keeps its size in every hand-placed layout slot.
    FILL_TOL=0.012,
    CENTRE_TOL=4,        # px the subject's box centre may sit off the canvas centre
    MAX_UPSCALE=3.0,     # a 144px source may become 432px, not 612px; beyond 3x a Lanczos
                         # resample of a product reads as blurred at 1080
    BLACK_MAX=0.06,      # p0.5 of opaque luma. Above this the darkest ink is grey: washed out.
    BLACK_TARGET=0.02,
    WHITE_MIN=0.90,      # p99.5 of opaque luma. Below this nothing in the product reaches white.
    WHITE_TARGET=0.97,
    MAX_GAIN=1.45,       # cap on the levels stretch; past this a correction starts to look done
    ALPHA_MIN=8,         # alpha at or below this is background, for trimming and statistics
    BLEED_MIN=0.05,      # share of a canvas edge the subject must run along to count as cut there
)

# The photo bands sit where a difference becomes visible, not at round numbers:
# the library's black points run 16 files above 0.07 and 16 above 0.08 (a
# natural break), its white points 19 below 0.85 and 15 below 0.80. Tighter
# bands flagged 87 of 153 files, most by amounts nobody could see, and every
# flag is a JPEG re-encode.
PHOTO = dict(
    SIZE=1200,           # px, square. What all 153 library backdrops already are.
    BLACK_MAX=0.07,      # p0.5 luma. Above this the shadows read as haze.
    BLACK_TARGET=0.015,
    WHITE_MIN=0.85,      # p99.5 luma. Below this nothing in the frame reaches white.
    WHITE_TARGET=0.96,
    MAX_GAIN=1.45,
    MEDIAN_BAND=(0.18, 0.62),   # median luma. Outside this a photo is either murk or glare.
    GAMMA_RANGE=(0.70, 1.50),   # the most a midtone correction may bend the curve
    LETTERBOX_MIN=8,     # px of perfectly flat pure white/black before a bar counts as one
)

QUALITY_FALLBACK = 91    # only if no library file exists to copy quantisation tables from


# ── measurement ─────────────────────────────────────────────────────────────

def luma(rgb):
    """rgb: float array 0..1, (..., 3) -> Rec.709 luma on encoded values."""
    return 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]


def rgba_array(im):
    return np.asarray(im.convert("RGBA"), dtype=np.float32) / 255.0


def subject_box(a8, thr):
    """Bounding box (x0, y0, x1, y1) of alpha > thr, or None."""
    ys, xs = np.where(a8 > thr)
    if not len(xs):
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def has_mark(path, im):
    if path.lower().endswith(".png"):
        return im.info.get(MARK_KEY) == MARK or (getattr(im, "text", {}) or {}).get(MARK_KEY) == MARK
    return MARK.encode() in (im.info.get("comment") or b"")


def bleed_sides(a8):
    """Sides where the subject was cut at the source: opaque pixels run along
    that canvas edge for at least BLEED_MIN of its length. tablet-watch is the
    one case today, an iPad composed to run off the left of its frame. A
    photograph like that works only while the cut stays on the edge of the ad;
    centred in a layout it reads as a sliced product. So a bleed side is kept
    flush to the canvas edge, and the app puts that edge on the ad's edge."""
    H, W = a8.shape
    t = CUTOUT["ALPHA_MIN"]
    runs = {"left": (a8[:, 0] > t).sum() / H, "right": (a8[:, W - 1] > t).sum() / H,
            "top": (a8[0] > t).sum() / W, "bottom": (a8[H - 1] > t).sum() / W}
    return sorted(k for k, v in runs.items() if v >= CUTOUT["BLEED_MIN"])


def placement_error(box, size, bleed):
    """How far the subject sits from where the spec puts it, per axis: flush to
    a bleed side, centred otherwise."""
    (x0, y0, x1, y1), (W, H) = box, size
    ex = x0 if "left" in bleed else (W - x1) if "right" in bleed else (x0 + x1) / 2 - W / 2
    ey = y0 if "top" in bleed else (H - y1) if "bottom" in bleed else (y0 + y1) / 2 - H / 2
    return [round(float(ex), 1), round(float(ey), 1)]


def measure_cutout(path):
    im = Image.open(path)
    marked = has_mark(path, im)
    a = rgba_array(im)
    a8 = np.asarray(im.convert("RGBA"))[..., 3]
    W, H = im.size
    box = subject_box(a8, CUTOUT["ALPHA_MIN"])
    if box is None:
        return dict(file=os.path.basename(path), size=[W, H], empty=True, marked=marked)
    x0, y0, x1, y1 = box
    long_side = max(x1 - x0, y1 - y0)
    bleed = bleed_sides(a8)
    y = luma(a[..., :3])[a[..., 3] > 0.5]
    p_lo, p_mid, p_hi = (float(v) for v in np.percentile(y, [0.5, 50, 99.5]))
    return dict(
        file=os.path.basename(path), size=[W, H], mode=im.mode, marked=marked,
        box=list(box), subject_px=[x1 - x0, y1 - y0],
        fill=long_side / max(W, H), bleed=bleed,
        centre_off=placement_error(box, (W, H), bleed),
        black=p_lo, median=p_mid, white=p_hi,
    )


def letterbox(y):
    """Thickness of flat pure-white/black bars on each side of a luma image.

    A bar is rows of near-zero variance at the extremes of the range, ending in
    an abrupt jump into picture. A dark photograph's natural shadow region is
    textured (row sigma 0.01-0.02) and fades gradually, so it never qualifies:
    measured on the six phone backdrops that a naive flat-row test flagged."""
    out = {}
    H, W = y.shape
    for side in ("top", "bottom", "left", "right"):
        line = {"top": lambda i: y[i], "bottom": lambda i: y[H - 1 - i],
                "left": lambda i: y[:, i], "right": lambda i: y[:, W - 1 - i]}[side]
        n, lim = 0, (H if side in ("top", "bottom") else W) // 3
        while n < lim:
            v = line(n)
            if v.std() > 0.006 or 0.02 < v.mean() < 0.97:
                break
            n += 1
        if n >= PHOTO["LETTERBOX_MIN"]:
            bar = line(0).mean()
            ahead = np.mean([line(min(lim, n + k)).mean() for k in range(1, 5)])
            if abs(ahead - bar) < 0.25:     # no hard edge into picture: not a bar
                n = 0
        else:
            n = 0
        out[side] = int(n)
    return out


def measure_photo(path):
    im = Image.open(path)
    marked = has_mark(path, im)
    a = np.asarray(im.convert("RGB"), dtype=np.float32) / 255.0
    y = luma(a)
    p_lo, p_mid, p_hi = (float(v) for v in np.percentile(y, [0.5, 50, 99.5]))
    return dict(
        file=os.path.basename(path), size=list(im.size), marked=marked,
        black=p_lo, median=p_mid, white=p_hi, letterbox=letterbox(y),
        encoding=dict(progressive=bool(im.info.get("progressive") or im.info.get("progression")),
                      exif="exif" in im.info),
    )


# ── the checks ──────────────────────────────────────────────────────────────

def cutout_findings(m):
    """Every way a measured cut-out misses the spec. Empty list = on spec.

    A marked file has been through standardize_cutout(). Its fill may sit BELOW
    the spec only because the source hit MAX_UPSCALE, which is a warning about
    the source rather than a failure of the file; tone was corrected as far as
    MAX_GAIN allows and is not re-judged, or a second run would stretch again."""
    C = CUTOUT
    if m.get("empty"):
        return ["empty: no opaque pixels"]
    f = []
    if m["size"] != [C["CANVAS"], C["CANVAS"]]:
        f.append("canvas %dx%d, spec %dx%d" % (*m["size"], C["CANVAS"], C["CANVAS"]))
    too_big = m["fill"] > C["FILL"] + C["FILL_TOL"]
    too_small = m["fill"] < C["FILL"] - C["FILL_TOL"] and not m["marked"]
    if too_big or too_small:
        f.append("subject fills %.0f%% of the frame, spec %.0f%%" % (m["fill"] * 100, C["FILL"] * 100))
    if max(abs(v) for v in m["centre_off"]) > C["CENTRE_TOL"]:
        where = "off its bleed edge" if m["bleed"] else "off-centre"
        f.append("subject %s by %s px" % (where, m["centre_off"]))
    if not m["marked"]:
        if m["black"] > C["BLACK_MAX"]:
            f.append("black point %.3f (washed out; spec <= %.2f)" % (m["black"], C["BLACK_MAX"]))
        if m["white"] < C["WHITE_MIN"]:
            f.append("white point %.3f (dull; spec >= %.2f)" % (m["white"], C["WHITE_MIN"]))
    return f


def photo_findings(m):
    P = PHOTO
    f = []
    if m["size"] != [P["SIZE"], P["SIZE"]]:
        f.append("size %dx%d, spec %dx%d" % (*m["size"], P["SIZE"], P["SIZE"]))
    bars = {k: v for k, v in m["letterbox"].items() if v}
    if bars:
        f.append("letterboxed %s" % bars)
    if m["marked"]:
        return f            # tone was corrected as far as the caps allow; see warnings
    lo, hi = P["MEDIAN_BAND"]
    if m["black"] > P["BLACK_MAX"]:
        f.append("black point %.3f (washed out; spec <= %.2f)" % (m["black"], P["BLACK_MAX"]))
    if m["white"] < P["WHITE_MIN"]:
        f.append("white point %.3f (muddy; spec >= %.2f)" % (m["white"], P["WHITE_MIN"]))
    if not lo <= m["median"] <= hi:
        f.append("median luma %.3f outside %.2f-%.2f" % (m["median"], lo, hi))
    return f


def warnings_for(m, kind):
    """A marked file still outside a band hit a cap: the source is the problem."""
    w = []
    if kind == "cutout":
        if m.get("marked") and m["fill"] < CUTOUT["FILL"] - CUTOUT["FILL_TOL"]:
            w.append("source too small: capped at %.1fx, fills %.0f%% not %.0f%% - needs a larger source"
                     % (CUTOUT["MAX_UPSCALE"], m["fill"] * 100, CUTOUT["FILL"] * 100))
        return w
    if not m.get("marked"):
        return w
    lo, hi = PHOTO["MEDIAN_BAND"]
    if not lo <= m["median"] <= hi:
        w.append("median %.3f still outside %.2f-%.2f after the gamma cap - a reshoot candidate"
                 % (m["median"], lo, hi))
    if m["black"] > PHOTO["BLACK_MAX"]:
        w.append("black point %.3f still lifted after the gain cap" % m["black"])
    return w


# ── the corrections ─────────────────────────────────────────────────────────

def levels(values, black, white, spec):
    """Bounded black/white-point stretch as a 0..1 -> 0..1 curve on `values`.

    Each end moves only if it is outside its tolerance. If the full stretch
    would exceed MAX_GAIN, both ends move the same fraction of the way, so the
    result is the gentlest correction in the right direction, never a jump."""
    bt = spec["BLACK_TARGET"] if black > spec["BLACK_MAX"] else black
    wt = spec["WHITE_TARGET"] if white < spec["WHITE_MIN"] else white
    if (bt, wt) == (black, white) or white - black < 1e-3:
        return values, 1.0
    gain = (wt - bt) / (white - black)
    if gain > spec["MAX_GAIN"]:
        k = (spec["MAX_GAIN"] - 1) / (gain - 1)
        bt, wt = black + k * (bt - black), white + k * (wt - white)
        gain = (wt - bt) / (white - black)
    return np.clip(bt + (values - black) * gain, 0, 1), gain


def apply_curve(rgb, curve):
    """Apply a tone curve to LIGHTNESS ONLY: each pixel's luma goes through the
    curve and R, G and B are scaled together to land on it, so the ratio
    between the channels, hue and saturation, is exactly what it was.

    The obvious way, the same curve on each of R, G and B, was tried first and
    rejected on sight: darkening a pale photo that way drives its saturation
    up (the mint strips backdrops came out vivid green), and a levels stretch
    raised the graded slabs' saturation by the full 45% gain. House rule: the
    ad gets its attention from contrast, never from saturation.

    A channel is never pushed past 1.0 to reach its target; a saturated
    highlight lands a little darker rather than shifting hue."""
    x = rgb.astype(np.float32) / 255.0
    y = luma(x)
    yn = np.interp(y, np.linspace(0.0, 1.0, len(curve)), curve)
    s = yn / np.maximum(y, 1e-4)
    s = np.minimum(s, 1.0 / np.maximum(x.max(-1), 1e-4))
    out = np.where((y > 1e-4)[..., None], x * s[..., None], yn[..., None])
    return np.uint8(np.clip(np.round(out * 255), 0, 255))


def premult_resize(im, size):
    """Resample RGBA with premultiplied alpha, or transparent pixels bleed their
    (arbitrary) colour into the matte as a fringe."""
    return im.convert("RGBa").resize(size, Image.LANCZOS).convert("RGBA")


def bleed_edges(im):
    """RGB of an RGBA image with the transparent pixels given the colour of the
    nearest subject, so a sharpening kernel that reaches past the matte reads
    subject colour rather than whatever black or white sits under alpha 0.
    Pixels that carry colour (alpha > ~2%) keep their own."""
    a = np.asarray(im)
    rgb = a[..., :3].astype(np.float32)
    known = a[..., 3] > 5
    out = rgb.copy()
    for r in (2, 6, 16, 40):
        if known.all():
            break
        w = known.astype(np.float32)
        wb = np.asarray(Image.fromarray(np.uint8(w * 255), "L").filter(ImageFilter.GaussianBlur(r)),
                        dtype=np.float32) / 255.0
        grow = ~known & (wb > 0.002)
        for c in range(3):
            ch = Image.fromarray(np.uint8(np.clip(out[..., c] * w, 0, 255)), "L").filter(ImageFilter.GaussianBlur(r))
            out[..., c] = np.where(grow, np.asarray(ch, dtype=np.float32) / np.maximum(wb, 0.002), out[..., c])
        known = known | grow
    return np.uint8(np.clip(np.round(out), 0, 255))


def standardize_cutout(path):
    C = CUTOUT
    src = Image.open(path).convert("RGBA")
    m = measure_cutout(path)
    # Scale is set by the SUBJECT (alpha > ALPHA_MIN); the crop keeps every
    # pixel with any alpha at all, so a faint contact shadow or haze is carried
    # along rather than guillotined at the subject's box.
    sx0, sy0, sx1, sy1 = m["box"]
    crop = subject_box(np.asarray(src)[..., 3], 0)
    subj = src.crop(crop)
    target = C["FILL"] * C["CANVAS"]
    scale = min(target / max(sx1 - sx0, sy1 - sy0), C["MAX_UPSCALE"])
    nw, nh = max(1, round(subj.width * scale)), max(1, round(subj.height * scale))
    subj = premult_resize(subj, (nw, nh))

    rgba = np.asarray(subj).copy()
    rgb = bleed_edges(subj)
    if scale > 1.1:
        # Put back the edge contrast a Lanczos upscale spreads out, and only as
        # much as this script took: radius and amount track the scale factor.
        sharp = Image.fromarray(rgb, "RGB").filter(ImageFilter.UnsharpMask(
            radius=round(0.45 * scale + 0.35, 2), percent=int(min(110, 55 * (scale - 1) + 25)), threshold=2))
        rgb = np.asarray(sharp)

    # tone: measured on the scaled subject's opaque pixels
    op = rgba[..., 3] > 127
    y = luma(rgb.astype(np.float32) / 255.0)[op]
    lo, hi = (float(v) for v in np.percentile(y, [0.5, 99.5]))
    curve, gain = levels(np.arange(256) / 255.0, lo, hi, C)
    rgb = apply_curve(rgb, curve)

    out = np.concatenate([rgb, rgba[..., 3:4]], -1)
    S = C["CANVAS"]
    canvas = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    piece = Image.fromarray(out, "RGBA")
    # the subject's own box, not the crop's, is what gets placed: centred, or
    # flush to the side it was cut on
    b = subject_box(np.asarray(piece)[..., 3], C["ALPHA_MIN"])
    bleed = m["bleed"]
    ox = -b[0] if "left" in bleed else S - b[2] if "right" in bleed else round(S / 2 - (b[0] + b[2]) / 2)
    oy = -b[1] if "top" in bleed else S - b[3] if "bottom" in bleed else round(S / 2 - (b[1] + b[3]) / 2)
    canvas.paste(piece, (ox, oy))
    # zero the colour under alpha 0 again, so the PNG compresses and nothing
    # hidden can resurface under a future filter
    arr = np.asarray(canvas).copy()
    arr[arr[..., 3] == 0] = 0
    canvas = Image.fromarray(arr, "RGBA")

    meta = PngImagePlugin.PngInfo()
    meta.add_text(MARK_KEY, MARK)
    buf = io.BytesIO()
    canvas.save(buf, "PNG", optimize=True, pnginfo=meta)
    return buf.getvalue(), dict(scale=round(scale, 3), gain=round(gain, 3), capped=scale >= C["MAX_UPSCALE"],
                                **({"bleed": bleed} if bleed else {}))


_QTABLES = None


def library_qtables():
    """The quantisation tables the backdrop library is encoded with, so a
    rewritten photo is compressed exactly like the 153 it sits beside. Files
    this script writes carry the same tables, so the choice is stable across
    runs whichever file is read first."""
    global _QTABLES
    if _QTABLES is None:
        _QTABLES = False
        for f in files_in(BG_DIR, ".jpg"):
            q = Image.open(f).quantization
            if q:
                _QTABLES = q
                break
    return _QTABLES or None


def fix_letterbox(im, bars):
    """Crop to the picture and rebuild the square around it: the picture keeps
    its full width, and the space the bars held is filled with the same
    picture scaled to cover and defocused, which is what the backdrop spec asks
    for anyway (heavy bokeh). The seam is feathered."""
    W, H = im.size
    pic = im.crop((bars["left"], bars["top"], W - bars["right"], H - bars["bottom"]))
    pw, ph = pic.size
    S = PHOTO["SIZE"]
    cover = max(S / pw, S / ph)
    bg = pic.resize((round(pw * cover), round(ph * cover)), Image.LANCZOS)
    bg = bg.crop(((bg.width - S) // 2, (bg.height - S) // 2, (bg.width - S) // 2 + S, (bg.height - S) // 2 + S))
    bg = bg.filter(ImageFilter.GaussianBlur(S * 0.035))
    fit = min(S / pw, S / ph)
    fg = pic.resize((round(pw * fit), round(ph * fit)), Image.LANCZOS)
    mask = Image.new("L", fg.size, 255)
    feather = max(8, round(S * 0.03))
    mk = np.full((fg.height, fg.width), 255, np.float32)
    ramp = np.linspace(0, 255, feather, dtype=np.float32)
    if fg.height < S:
        mk[:feather, :] = np.minimum(mk[:feather, :], ramp[:, None])
        mk[-feather:, :] = np.minimum(mk[-feather:, :], ramp[::-1][:, None])
    if fg.width < S:
        mk[:, :feather] = np.minimum(mk[:, :feather], ramp[None, :])
        mk[:, -feather:] = np.minimum(mk[:, -feather:], ramp[::-1][None, :])
    mask = Image.fromarray(np.uint8(mk), "L")
    bg.paste(fg, ((S - fg.width) // 2, (S - fg.height) // 2), mask)
    return bg


def standardize_photo(path):
    P = PHOTO
    im = Image.open(path).convert("RGB")
    m = measure_photo(path)
    notes = {}
    bars = m["letterbox"]
    if any(bars.values()):
        im = fix_letterbox(im, bars)
        notes["letterbox"] = {k: v for k, v in bars.items() if v}
    if im.size != (P["SIZE"], P["SIZE"]):
        w, h = im.size
        s = P["SIZE"] / min(w, h)
        im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
        l, t = (im.width - P["SIZE"]) // 2, (im.height - P["SIZE"]) // 2
        im = im.crop((l, t, l + P["SIZE"], t + P["SIZE"]))
        if s > 1.1:
            im = im.filter(ImageFilter.UnsharpMask(radius=round(0.45 * s + 0.35, 2),
                                                   percent=int(min(80, 45 * (s - 1) + 15)), threshold=3))
        notes["resized_from"] = m["size"]

    rgb = np.asarray(im)
    y = luma(rgb.astype(np.float32) / 255.0)
    lo, hi = (float(v) for v in np.percentile(y, [0.5, 99.5]))
    x = np.arange(256) / 255.0
    curve, gain = levels(x, lo, hi, P)
    # midtone: measure the median AFTER levels, then bend toward the band edge
    med = float(np.interp(np.median(y), x, curve))
    band_lo, band_hi = P["MEDIAN_BAND"]
    gamma = 1.0
    if med < band_lo or med > band_hi:
        # aim a hair inside the edge: an 8-bit curve plus a JPEG round trip
        # moves the median by ~0.005, and landing ON the edge reads as a miss
        t = band_lo + 0.01 if med < band_lo else band_hi - 0.01
        gamma = float(np.clip(np.log(t) / np.log(max(med, 1e-4)), *P["GAMMA_RANGE"]))
        curve = np.power(curve, gamma)
    rgb = apply_curve(rgb, curve)
    notes.update(gain=round(gain, 3), gamma=round(gamma, 3))

    out = Image.fromarray(rgb, "RGB")
    buf = io.BytesIO()
    qt = library_qtables()
    kw = dict(qtables=qt) if qt else dict(quality=QUALITY_FALLBACK)
    out.save(buf, "JPEG", subsampling="4:2:0", optimize=True, progressive=False,
             comment=MARK.encode(), **kw)
    return buf.getvalue(), notes


# ── driver ──────────────────────────────────────────────────────────────────

def files_in(d, ext):
    return sorted(os.path.join(d, f) for f in os.listdir(d) if f.lower().endswith(ext)) if os.path.isdir(d) else []


def run(write):
    report = {"cutouts": [], "photos": [], "written": [], "failures": 0, "warnings": 0}
    jobs = [("cutout", p) for p in files_in(CUTOUT_DIR, ".png")] + \
           [("photo", p) for p in files_in(BG_DIR, ".jpg") + files_in(TPLBG_DIR, ".jpg")]
    for kind, path in jobs:
        m = measure_cutout(path) if kind == "cutout" else measure_photo(path)
        fx = cutout_findings(m) if kind == "cutout" else photo_findings(m)
        rel = os.path.relpath(path, ROOT)
        if fx and write and not m.get("marked"):
            data, notes = (standardize_cutout if kind == "cutout" else standardize_photo)(path)
            with open(path, "wb") as fh:
                fh.write(data)
            report["written"].append({"file": rel, **notes})
            m = measure_cutout(path) if kind == "cutout" else measure_photo(path)
            fx = cutout_findings(m) if kind == "cutout" else photo_findings(m)
        w = warnings_for(m, kind)
        entry = {"file": rel, "findings": fx, "warnings": w,
                 **{k: (round(v, 4) if isinstance(v, float) else v) for k, v in m.items() if k != "file"}}
        report["cutouts" if kind == "cutout" else "photos"].append(entry)
        report["failures"] += bool(fx)
        report["warnings"] += len(w)
    return report


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--write", action="store_true", help="rewrite every off-spec photo onto the spec")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()
    r = run(args.write)
    if args.json:
        print(json.dumps(r, indent=1))
    else:
        n_c, n_p = len(r["cutouts"]), len(r["photos"])
        print("Photo standard (%s)\n" % MARK)
        print("  cut-outs  %3d   canvas %dpx, subject fills %.0f%%, centred, black <= %.2f, white >= %.2f"
              % (n_c, CUTOUT["CANVAS"], CUTOUT["FILL"] * 100, CUTOUT["BLACK_MAX"], CUTOUT["WHITE_MIN"]))
        print("  photos    %3d   %dpx square, no letterbox, black <= %.2f, white >= %.2f, median %.2f-%.2f"
              % (n_p, PHOTO["SIZE"], PHOTO["BLACK_MAX"], PHOTO["WHITE_MIN"], *PHOTO["MEDIAN_BAND"]))
        if r["written"]:
            print("\n  rewrote %d file(s)" % len(r["written"]))
        bad = [e for e in r["cutouts"] + r["photos"] if e["findings"]]
        warn = [e for e in r["cutouts"] + r["photos"] if e["warnings"]]
        print("\n  off-spec  %d" % len(bad))
        for e in bad[:40]:
            print("    FAIL  %-44s %s" % (e["file"], "; ".join(e["findings"])))
        if len(bad) > 40:
            print("    ... and %d more (--json for all)" % (len(bad) - 40))
        print("  source warnings  %d" % len(warn))
        for e in warn:
            print("    WARN  %-44s %s" % (e["file"], "; ".join(e["warnings"])))
        if bad and not args.write:
            print("\n  run with --write to bring them onto the spec")
    return 1 if r["failures"] else 0


if __name__ == "__main__":
    sys.exit(main())
