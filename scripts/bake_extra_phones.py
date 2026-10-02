"""Bake extra phone backs for the video maker (motion/phones).

No full-size straight-on photo exists for these finishes, so each is built
from real parts (repaint=true in index.json):

  * Pro / Pro Max (14, 15, 16): the back of the iPhone 15 Pro Blue Titanium
    photo (assets/cutouts/iphone-15-pro-back-blue.webp), straightened, its own
    camera taken out: it was shot from the right, so its plateau shows one side
    wall and reads backwards when the phone turns the other way. In its place
    goes the generation's own plateau from Apple's straight-on render (qs-*),
    then glass and plateau are painted in the finish.
  * 14 / 14 Plus / 15 / 15 Plus: the clean iPhone 16 White back with its pill
    camera patched out and the generation's square diagonal-lens plateau from
    Apple's straight-on render set in, then painted.

Check the result with scripts/audit_phone_views.py and motion/views-sheet.html.

Run:  python3 scripts/bake_extra_phones.py   (needs pillow, numpy, scikit-image)
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from skimage import color

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "motion" / "phones"
CUT = ROOT / "assets" / "cutouts"
H = 900

# (id, model, finish, body colour, width at h=900). Widths are Apple's published
# width/height x 900 x 0.993, the same scale the existing backs sit on (the 16
# is 437 by spec and 434 here; the 17 Pro 431 and 428).
PRO = [
    ("16-pro-max-desert", "iPhone 16 Pro Max", "Desert Titanium", "#c2a78f", 425),
    ("16-pro-desert", "iPhone 16 Pro", "Desert Titanium", "#c2a78f", 427),
    ("16-pro-max-natural", "iPhone 16 Pro Max", "Natural Titanium", "#b9b4aa", 425),
    ("16-pro-natural", "iPhone 16 Pro", "Natural Titanium", "#b9b4aa", 427),
    ("16-pro-max-white", "iPhone 16 Pro Max", "White Titanium", "#e3e2de", 425),
    ("16-pro-white", "iPhone 16 Pro", "White Titanium", "#e3e2de", 427),
    ("16-pro-max-black", "iPhone 16 Pro Max", "Black Titanium", "#3d3d3f", 425),
    ("16-pro-black", "iPhone 16 Pro", "Black Titanium", "#3d3d3f", 427),
    ("15-pro-max-blue", "iPhone 15 Pro Max", "Blue Titanium", None, 429),
    ("15-pro-blue", "iPhone 15 Pro", "Blue Titanium", None, 430),
    ("15-pro-max-black", "iPhone 15 Pro Max", "Black Titanium", "#434345", 429),
    ("15-pro-black", "iPhone 15 Pro", "Black Titanium", "#434345", 430),
    ("15-pro-max-natural", "iPhone 15 Pro Max", "Natural Titanium", "#bcb7ad", 429),
    ("15-pro-natural", "iPhone 15 Pro", "Natural Titanium", "#bcb7ad", 430),
    ("15-pro-max-white", "iPhone 15 Pro Max", "White Titanium", "#e5e4e0", 429),
    ("15-pro-white", "iPhone 15 Pro", "White Titanium", "#e5e4e0", 430),
    ("14-pro-max-purple", "iPhone 14 Pro Max", "Deep Purple", "#5c5166", 432),
    ("14-pro-purple", "iPhone 14 Pro", "Deep Purple", "#5c5166", 433),
    ("14-pro-max-black", "iPhone 14 Pro Max", "Space Black", "#403f42", 432),
    ("14-pro-black", "iPhone 14 Pro", "Space Black", "#403f42", 433),
    ("14-pro-max-gold", "iPhone 14 Pro Max", "Gold", "#efe2c6", 432),
    ("14-pro-gold", "iPhone 14 Pro", "Gold", "#efe2c6", 433),
]
BASE = [
    ("15-plus-pink", "iPhone 15 Plus", "Pink", "#f0d3d8", 432),
    ("15-pink", "iPhone 15", "Pink", "#f0d3d8", 434),
    ("15-plus-blue", "iPhone 15 Plus", "Blue", "#cfe0e8", 432),
    ("15-blue", "iPhone 15", "Blue", "#cfe0e8", 434),
    ("15-plus-green", "iPhone 15 Plus", "Green", "#d2e2cc", 432),
    ("15-green", "iPhone 15", "Green", "#d2e2cc", 434),
    ("14-plus-blue", "iPhone 14 Plus", "Blue", "#a6bbd0", 434),
    ("14-blue", "iPhone 14", "Blue", "#a6bbd0", 435),
    ("14-plus-yellow", "iPhone 14 Plus", "Yellow", "#f4e08e", 434),
    ("14-yellow", "iPhone 14", "Yellow", "#f4e08e", 435),
    ("14-plus-purple", "iPhone 14 Plus", "Purple", "#ddd0e6", 434),
    ("14-purple", "iPhone 14", "Purple", "#ddd0e6", 435),
]


def hex_lab(h):
    rgb = np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], float) / 255
    return color.rgb2lab(rgb[None, None])[0, 0]


def lab_hex(lab):
    rgb = np.clip(color.lab2rgb(np.array(lab, float)[None, None])[0, 0], 0, 1)
    return "#" + "".join(f"{round(v * 255):02x}" for v in rgb)


def smooth(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def paint(im, weight, target, body_l, contrast):
    """Repaint pixels by weight: target hue, source shading kept around body_l."""
    a = np.asarray(im).astype(float) / 255
    lab = color.rgb2lab(a[..., :3])
    t = hex_lab(target)
    new = lab.copy()
    new[..., 0] = np.clip(t[0] + (lab[..., 0] - body_l) * contrast, 0, 100)
    new[..., 1] = t[1]
    new[..., 2] = t[2]
    w = weight[..., None]
    out = lab * (1 - w) + new * w
    rgb = np.clip(color.lab2rgb(out), 0, 1)
    return Image.fromarray(np.dstack([rgb * 255, a[..., 3:] * 255]).round().astype(np.uint8), "RGBA")


SHARP = 2.5   # mean edge energy of the existing backs (17/18 Pro 2.1-2.4, 16 2.3-3.2)


def sharpness(im):
    g = np.asarray(im.convert("L")).astype(float)
    a = np.asarray(im)[..., 3]
    lap = np.abs(4 * g[1:-1, 1:-1] - g[:-2, 1:-1] - g[2:, 1:-1] - g[1:-1, :-2] - g[1:-1, 2:])
    return float(lap[a[1:-1, 1:-1] > 250].mean())


def finish_back(im, w, pid):
    """Match the existing set: trimmed edge to edge, w x 900, same softness, same encode."""
    alpha = im.getchannel("A").point(lambda v: 255 if v > 128 else 0)
    im = im.crop(alpha.getbbox()).resize((w, H), Image.LANCZOS)
    r = 0.0
    while sharpness(im) > SHARP and r < 2:
        r += 0.1
        soft = im.filter(ImageFilter.GaussianBlur(r))
        # soften the colour only; keep the silhouette crisp
        soft.putalpha(im.getchannel("A"))
        if sharpness(soft) <= SHARP:
            im = soft
            break
    im.save(OUT / f"{pid}.webp", quality=80, method=6)
    return im


def metal_of(im):
    a = np.asarray(im).astype(float)
    y = int(im.height * .5)
    x = int(im.width * .02)
    return "#" + "".join(f"{int(v):02x}" for v in a[y, x, :3])


def fit_x(a, ys, glass=False):
    """x of the phone's left edge (alpha) or the right edge of the blue glass, per row."""
    lab = color.rgb2lab(a[..., :3] / 255)
    blue = np.hypot(lab[..., 1], lab[..., 2]) > 15
    return [np.where(blue[y])[0].max() if glass else np.where(a[y, :, 3] > 128)[0].min() for y in ys]


def straighten(src):
    """The only straight-on source is shot slightly from the right: the near side
    is taller and its frame, buttons and all, shows. Map the back onto a true
    rectangle, the right edge taken at the glass plus the thin rim every other
    side shows, so the flat shot matches the dead-flat 17 and 18 Pro backs."""
    from skimage import transform
    a = np.asarray(src).astype(float)
    ys = np.arange(250, 1350, 50)
    xs = np.arange(200, 560, 20)
    lx = np.polyfit(ys, fit_x(a, ys), 1)
    rim = 9
    rx = np.polyfit(ys, np.array(fit_x(a, ys, glass=True)) + rim, 1)
    ty = np.polyfit(xs, [np.where(a[:, x, 3] > 128)[0].min() for x in xs], 1)
    by = np.polyfit(xs, [np.where(a[:, x, 3] > 128)[0].max() for x in xs], 1)

    def meet(xl, yl):                                # a vertical-ish x(y) line against a y(x) line
        x = xl[1]
        for _ in range(20):
            y = np.polyval(yl, x); x = np.polyval(xl, y)
        return x, np.polyval(yl, x)
    quad = np.array([meet(lx, ty), meet(rx, ty), meet(rx, by), meet(lx, by)])
    w = round(np.hypot(*(quad[1] - quad[0])) / 2 + np.hypot(*(quad[2] - quad[3])) / 2)
    h = round(np.hypot(*(quad[3] - quad[0])) / 2 + np.hypot(*(quad[2] - quad[1])) / 2)
    rect = np.array([[0, 0], [w, 0], [w, h], [0, h]], float)
    if hasattr(transform.ProjectiveTransform, "from_estimate"):
        tf = transform.ProjectiveTransform.from_estimate(rect, quad)
    else:
        tf = transform.ProjectiveTransform(); tf.estimate(rect, quad)
    out = transform.warp(a / 255, tf, output_shape=(h, w), order=3, cval=0)
    img = Image.fromarray((np.clip(out, 0, 1) * 255).round().astype(np.uint8), "RGBA")
    # the silhouette: the corners every flat back has, the near side's frame gone
    m = Image.new("L", (w * 4, h * 4), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w * 4 - 1, h * 4 - 1), round(w * 4 * .16), fill=255)
    m = m.resize((w, h), Image.LANCZOS)
    img.putalpha(Image.fromarray(np.minimum(np.asarray(m), np.asarray(img.getchannel("A")) + np.asarray(m) * (np.arange(w) > w * .5))))
    return img


# Apple's own straight-on renders, one per generation: (file, plateau box in px).
# The plateau is lit from the front in these, so it reads true at any turn;
# the only full-size back is shot from the right and its camera is not.
MODULES = {
    "16": ("qs-iphone-16-pro-max.webp", (11, 11, 148, 146)),   # White Titanium
    "15": ("qs-iphone-15-pro.webp", (13, 11, 143, 146)),       # Natural Titanium
    "14": ("qs-iphone-14-pro-max.webp", (11, 15, 143, 146)),   # Deep Purple
}
MOD_AT, MOD_SIZE = .034, .53     # plateau offset and size, in phone widths (the renders, measured)
WORK_H = 1800


def _tones(f, box):
    """A render's non-glass lightness: median and spread (the glass is the darkest
    quarter in every one of them)."""
    L = color.rgb2lab(np.asarray(Image.open(CUT / f).convert("RGB").crop(box)) / 255)[..., 0]
    glass = np.percentile(L, 25) + 2
    rest = L[L > glass * 1.4]
    q1, q3 = np.percentile(rest, [25, 75])
    return glass, float(np.median(rest)), float(q3 - q1)


def module_neutral(f, box, size, to_med=None, to_spread=None, lidar=True):
    """A straight-on plateau from Apple's render, colour taken out, its tones set
    on a common grey (the 16 Pro White's unless given) so every generation paints
    alike. The lens glass, and on a Pro the LiDAR, keep their own darks."""
    m = Image.open(CUT / f).convert("RGBA").crop(box).resize(size, Image.LANCZOS)
    lab = color.rgb2lab(np.asarray(m)[..., :3] / 255)
    glass, med, spread = _tones(f, box)
    _, med16, spread16 = _tones(*MODULES["16"])
    to_med = med16 if to_med is None else to_med
    to_spread = spread16 if to_spread is None else to_spread
    L = lab[..., 0]
    # stretch the spread only a little: a low-res render posterises
    mapped = np.clip(to_med + (L - med) * min(1.25, to_spread / spread), 0, 100)
    k = smooth(L, glass * .8, glass * 1.6)
    if lidar:                                       # found, not assumed: the dark dot low on the right
        yy, xx = np.mgrid[0:size[1], 0:size[0]]
        zone = (xx > size[0] * .6) & (yy > size[1] * .68) & (xx < size[0] * .95) & (yy < size[1] * .97)
        dot = zone & (L < np.percentile(L[zone], 12))
        cy, cx = yy[dot].mean(), xx[dot].mean()
        r = np.sqrt(dot.sum() / np.pi)
        k = k * smooth(np.hypot(xx - cx, yy - cy), r * 1.15, r * 1.6)
    lab[..., 0] = L * (1 - k) + mapped * k
    lab[..., 1:] = 0
    rgb = (np.clip(color.lab2rgb(lab), 0, 1) * 255).round().astype(np.uint8)
    return Image.fromarray(np.dstack([rgb, np.asarray(m)[..., 3]]), "RGBA"), to_med


def erase_module(im):
    """Fill the photo's own (side-lit) camera with plain back: each column's
    colour from the clean band between the camera and the logo, carried up."""
    W = im.width
    a = np.asarray(im).astype(float)
    y0, y1 = round(W * .72), round(W * .84)
    band = a[y0:y1].mean(0)
    slope = (a[y1:y1 + (y1 - y0)].mean(0) - a[y0:y1].mean(0)) / (y1 - y0)   # the light's fall down the back
    ys = np.arange(im.height)[:, None, None] - (y0 + y1) / 2
    fill = np.clip(band[None] + slope[None] * ys, 0, 255)
    m = Image.new("L", im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((round(W * .024), round(W * .024), round(W * .69), round(W * .69)), round(W * .14), fill=255)
    m = np.asarray(m.filter(ImageFilter.GaussianBlur(W * .01))).astype(float)[..., None] / 255
    out = a.copy()
    out[..., :3] = a[..., :3] * (1 - m) + fill[..., :3] * m
    return Image.fromarray(out.round().astype(np.uint8), "RGBA")


def bake_pro():
    src = straighten(Image.open(CUT / "iphone-15-pro-back-blue.webp").convert("RGBA"))
    src = src.resize((round(WORK_H * .478), WORK_H), Image.LANCZOS)
    clean = erase_module(src)
    lab = color.rgb2lab(np.asarray(clean)[..., :3] / 255)
    chroma = np.hypot(lab[..., 1], lab[..., 2])
    body = chroma > 18
    body_l = float(np.median(lab[..., 0][body]))
    blue = lab_hex(np.median(lab[body], axis=0))
    # blue glass gets the full paint; the steel band gets a lighter tint
    weight = np.maximum(smooth(chroma, 6, 20), 0.85 * smooth(lab[..., 0], 20, 55))
    weight *= np.asarray(clean)[..., 3] / 255 > 0
    side = round(src.width * MOD_SIZE)
    mods = {g: module_neutral(*MODULES[g], (side, side)) for g in MODULES}
    mmask = rrect_mask((side, side), round(side * .2), blur=1.2)
    out = []
    for pid, model, finish, target, w in PRO:
        if target is None:
            im = clean
        else:
            dark = hex_lab(target)[0] < 40
            im = paint(clean, weight, target, body_l, 0.8 if dark else 0.55)
        # the plateau and lens rings in the finish's colour, the glass left dark
        mod, ref = mods[pid[:2]]
        ml = color.rgb2lab(np.asarray(mod)[..., :3] / 255)[..., 0]
        mod = paint(mod, smooth(ml, 38, 68) * (1 - smooth(ml, 86, 94)), target or blue, ref, 0.6)
        im = im.copy(); im.paste(mod, (round(src.width * MOD_AT), round(src.width * MOD_AT)), mmask)
        im = finish_back(im, w, pid)
        out.append(dict(id=pid, model=model, finish=finish, metal=target or metal_of(im),
                        w=w, h=H, repaint=True, ok=True))
    return out


def rrect_mask(size, r, blur=1.5):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), r, fill=255)
    return m.filter(ImageFilter.GaussianBlur(blur))


# The 14 and 15 from Apple's straight-on renders: (file, plateau box in px, size
# and offset in phone widths, measured off the render).
BASE_MODULES = {
    "15": ("qs-iphone-15.webp", (13, 13, 122, 123), .445, .045),
    "14": ("qs-iphone-14.webp", (8, 12, 120, 123), .457, .045),
}


def base_composite(gen):
    body = Image.open(OUT / "16-white.webp").convert("RGBA")
    W = body.width
    # patch out the pill camera with the (mirrored) clean top-right corner
    mir = body.transpose(Image.FLIP_LEFT_RIGHT)
    fm = Image.new("L", body.size, 0)
    ImageDraw.Draw(fm).rounded_rectangle((8, 8, 195, 280), 30, fill=255)
    fm = fm.filter(ImageFilter.GaussianBlur(6))
    body = Image.composite(mir, body, fm)
    bl = color.rgb2lab(np.asarray(body)[..., :3] / 255)
    body_l = float(np.median(bl[..., 0][np.asarray(body)[..., 3] > 250]))
    f, box, size, at = BASE_MODULES[gen]
    side = round(W * size)
    # the plateau sits a touch darker than the glass around it, as on the phone
    mod, _ = module_neutral(f, box, (side, side), to_med=body_l - 4, to_spread=_tones(f, box)[2], lidar=False)
    body.paste(mod, (round(W * at), round(W * at)), rrect_mask((side, side), round(side * .22)))
    return body, body_l


def bake_base():
    bodies = {}
    for gen in BASE_MODULES:
        body, body_l = base_composite(gen)
        a = np.asarray(body).astype(float)
        lab = color.rgb2lab(a[..., :3] / 255)
        bodies[gen] = (body, body_l, smooth(lab[..., 0], 45, 75) * (a[..., 3] > 0))
    out = []
    for pid, model, finish, target, w in BASE:
        body, body_l, weight = bodies[pid[:2]]
        finish_back(paint(body, weight, target, body_l, 0.9), w, pid)
        out.append(dict(id=pid, model=model, finish=finish, metal=lab_hex(hex_lab(target) - [8, 0, 0]),
                        w=w, h=H, repaint=True, ok=True))
    return out


def main():
    idx_path = OUT / "index.json"
    idx = json.loads(idx_path.read_text())
    new = bake_pro() + bake_base()
    ids = {p["id"] for p in new}
    keep = [p for p in idx["phones"] if p["id"] not in ids]
    # generation order: 18 Pro, 17 Pro, 17, 16 Pro, 16, 17e/16e, 15 Pro, 15, 14 Pro, 14
    def at(pred):
        return next(i for i, p in enumerate(keep) if pred(p))
    pro16 = [p for p in new if p["id"].startswith("16-pro")]
    rest = [p for p in new if not p["id"].startswith("16-pro")]
    i = at(lambda p: p["model"] == "iPhone 16")
    keep[i:i] = pro16
    order = ["15-pro", "15-", "14-pro", "14-"]
    for pre in order:
        keep += [p for p in rest if p["id"].startswith(pre) and p not in keep]
    idx["phones"] = keep
    idx_path.write_text(json.dumps(idx, indent=1) + "\n")
    print(len(keep), "phones")


if __name__ == "__main__":
    main()
