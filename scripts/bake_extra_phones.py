"""Bake extra phone backs for the video maker (motion/phones).

No full-size straight-on photo exists for these finishes, so each is built
from real parts (repaint=true in index.json):

  * Pro / Pro Max (14, 15, 16): the back of the iPhone 15 Pro Blue Titanium
    photo (assets/cutouts/iphone-15-pro-back-blue.webp), straightened, its own
    camera taken out: it was shot from the right, so its plateau shows one side
    wall and reads backwards when the phone turns the other way. The back is
    painted in the finish; in place of the camera goes the generation's own
    plateau from Apple's straight-on render (qs-*), lens glass and light as
    rendered, only its metal moved to the finish (module_oem).
  * 14 / 14 Plus / 15 / 15 Plus: the clean iPhone 16 White back with its pill
    camera patched out and the generation's square diagonal-lens plateau from
    Apple's straight-on render set in, then painted.

And from real backs (bake_real), where they exist: the iPhone 13 and 13 Pro in
every finish Apple's straight-on renders show (repaint=false), and the 14 in
(PRODUCT)RED from a straight-on photograph. The 13 mini, the 13 Pro Max and the
14 Plus are the same back at their own size, the camera kept at its own (Apple
put the same camera in each pair); the finishes no render shows, the 13 in
(PRODUCT)RED and the 13 Pro in Silver, are painted on a real 13 back.

Run scripts/clean_phone_edges.py first (the 14 and 15 are built on the 16 White).
Check the result with scripts/audit_phone_views.py and motion/views-sheet.html.

Run:  python3 scripts/bake_extra_phones.py   (needs pillow, numpy, scipy, scikit-image)
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from skimage import color

from phone_rim import clean_rim

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
    ("14-pro-max-silver", "iPhone 14 Pro Max", "Silver", "#e7e8e5", 432),
    ("14-pro-silver", "iPhone 14 Pro", "Silver", "#e7e8e5", 433),
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
    # Midnight and Starlight as Apple's 13 renders show them (the same finishes), a
    # little off the render's black and white
    ("14-plus-midnight", "iPhone 14 Plus", "Midnight", "#1f252d", 434),
    ("14-midnight", "iPhone 14", "Midnight", "#1f252d", 435),
    ("14-plus-starlight", "iPhone 14 Plus", "Starlight", "#f2ede5", 434),
    ("14-starlight", "iPhone 14", "Starlight", "#f2ede5", 435),
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
# the softest the set goes (audit_phone_views takes 1.4 to 3.4): a render enlarged to
# the set's height (the 13s, 503 px tall) or a smooth studio photo (the 14 red, 1.1) is
# sharpened up to it, the 13 Midnight furthest (0.8, 220%); to 1.7 before the encode,
# which takes 0.2 off
SOFT = 1.7


def sharpness(im):
    g = np.asarray(im.convert("L")).astype(float)
    a = np.asarray(im)[..., 3]
    lap = np.abs(4 * g[1:-1, 1:-1] - g[:-2, 1:-1] - g[2:, 1:-1] - g[1:-1, :-2] - g[1:-1, 2:])
    return float(lap[a[1:-1, 1:-1] > 250].mean())


def finish_back(im, w, pid):
    """Match the existing set: trimmed edge to edge, w x 900, a clean rim (phone_rim),
    same softness (SHARP down, SOFT up), same encode."""
    alpha = im.getchannel("A").point(lambda v: 255 if v > 128 else 0)
    im = clean_rim(im.crop(alpha.getbbox()).resize((w, H), Image.LANCZOS))
    r = 0.0
    while sharpness(im) > SHARP and r < 2:
        r += 0.1
        soft = im.filter(ImageFilter.GaussianBlur(r))
        # soften the colour only; keep the silhouette crisp
        soft.putalpha(im.getchannel("A"))
        if sharpness(soft) <= SHARP:
            im = soft
            break
    base = im
    for p in range(20, 260, 20):
        if sharpness(im) >= SOFT:
            break
        im = base.filter(ImageFilter.UnsharpMask(radius=1.0, percent=p, threshold=0))
        im.putalpha(base.getchannel("A"))
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


# Apple's published height x width, mm. A Pro and its Pro Max carry the same camera:
# lens centres 20.5, 20.1, 17.2 mm apart on both 14 renders, 19.4 and 20.7 on the 15
# and 16, the left lens 14 mm in on all six. So the plateau is placed and sized in
# mm, each render's own scale taken from its height, not as a share of the width
# (.53 of it was the Pro Max's camera 5% large and the Pro's small).
MM = {"iPhone 13 mini": (131.5, 64.2), "iPhone 13": (146.7, 71.5), "iPhone 13 Pro": (146.7, 71.5), "iPhone 13 Pro Max": (160.8, 78.1),
      "iPhone 14 Pro": (147.5, 71.5), "iPhone 14 Pro Max": (160.7, 77.6),
      "iPhone 15 Pro": (146.6, 70.6), "iPhone 15 Pro Max": (159.9, 76.7),
      "iPhone 16 Pro": (149.6, 71.5), "iPhone 16 Pro Max": (163.0, 77.6),
      "iPhone 14": (146.7, 71.5), "iPhone 14 Plus": (160.8, 78.1),
      "iPhone 15": (147.6, 71.6), "iPhone 15 Plus": (160.9, 77.8)}
# The Pro plateau as Apple drew it (owner, 2026-10-11: "doesn't really look quite
# OEM ... as natural as possible without the shiny glimmer"). Taking the colour out
# of a render, setting it on a grey and painting it back left flat black lenses
# with white glints on a grey, sticker-like plateau. Now each Pro takes its
# generation's plateau whole, lens glass, coatings and light as rendered, and only
# its metal moves to the finish, from the render nearest the finish in lightness:
# (file, plateau box in px, flash centre and radius in box widths), measured off
# each render; its finish beside it.
OEM = {
    "16": [("qs-iphone-16-pro-max.webp", (11, 11, 148, 146), (.73, .18, .084))],   # White Titanium
    "15": [("qs-iphone-15-pro-max.webp", (12, 12, 147, 147), (.74, .17, .085)),    # Blue Titanium
           ("qs-iphone-15-pro.webp", (13, 11, 143, 146), (.75, .18, .088))],       # Natural Titanium
    "14": [("qs-iphone-14-pro-max.webp", (11, 15, 143, 146), (.76, .13, .087))],   # Deep Purple
}
# How much of the photo's studio light a painted back keeps: it falls 24 L top to
# bottom. Dark backs that are real photos fall 5-10 (16 Black 9, 17 Pro Max Deep
# Blue 10, 18 Pro Black 5) and Apple's 15 Pro Max render 9; 0.8 left the dark ones
# at 19-24, a glare. Light ones fall 12-15 in both, as 0.55 of it does.
LIGHT_DARK, LIGHT_LIGHT = 0.45, 0.55
WORK_H = 1800


def off_lidar(L, size):
    """0 on a Pro's LiDAR, 1 elsewhere: found, not assumed, the dark dot low on the right."""
    yy, xx = np.mgrid[0:size[1], 0:size[0]]
    zone = (xx > size[0] * .6) & (yy > size[1] * .68) & (xx < size[0] * .95) & (yy < size[1] * .97)
    dot = zone & (L < np.percentile(L[zone], 12))
    cy, cx = yy[dot].mean(), xx[dot].mean()
    r = np.sqrt(dot.sum() / np.pi)
    return smooth(np.hypot(xx - cx, yy - cy), r * 1.15, r * 1.6)


def render_back(f):
    """The back's own colour on an Apple render (Lab): the glass below the camera,
    left of the front phone."""
    im = Image.open(CUT / f).convert("RGBA")
    W, H = im.size
    a = np.asarray(im).astype(float)[int(H * .45):int(H * .8), int(W * .03):int(W * .25)] / 255
    return np.median(color.rgb2lab(a[..., :3])[a[..., 3] > .99], axis=0)


def lin(c):
    return np.where(c <= .04045, c / 12.92, ((c + .055) / 1.055) ** 2.4)


def srgb(c):
    return np.where(c <= .0031308, c * 12.92, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - .055)


def render_scale(f):
    """An Apple render's px per mm, from its back's height against Apple's, and
    where that back's left and top edges are."""
    a = np.asarray(Image.open(CUT / f).convert("RGBA"))[..., 3] > 128
    col, row = a[:, 30], a[a.shape[0] // 2]
    top, bot = np.argmax(col), len(col) - 1 - np.argmax(col[::-1])
    model = "iPhone " + f[len("qs-iphone-"):-len(".webp")].replace("-pro-max", " Pro Max").replace("-pro", " Pro").replace("-plus", " Plus")
    return (bot - top + 1) / MM[model][0], int(np.argmax(row)), int(top)


def module_oem(gen, tint, px_mm, table=None, lidar=True):
    """The generation's plateau as Apple rendered it, its metal moved to the finish.
    Down to a darker finish the metal's colour is scaled in linear light by the
    finish over the render's back colour, as a darker paint under the same light,
    so its shading and shine fall with it. Up to a lighter one that would scale
    the shine too (Deep Purple to Gold is 11x, its shadows went blotchy and its
    rims white), so the metal steps up by the Lab difference instead and rolls
    off before white. The lens glass and LiDAR (the dark discs, with the light
    inside them) and the flash keep the render's own colour: glass whatever the finish.
    Returns the plateau at `px_mm` and where it goes on the back."""
    from scipy import ndimage
    f, box, (fx, fy, fr) = min((table or OEM)[gen], key=lambda r: abs(render_back(r[0])[0] - hex_lab(tint)[0]))
    s, left, top = render_scale(f)
    side = round((box[2] - box[0] + box[3] - box[1]) / 2 / s * px_mm)
    size = (side, side)
    at = (round((box[0] - left) / s * px_mm), round((box[1] - top) / s * px_mm))
    m = Image.open(CUT / f).convert("RGBA").crop(box).resize(size, Image.LANCZOS)
    c = np.asarray(m)[..., :3] / 255
    L = color.rgb2lab(c)[..., 0]
    # glass is darker than the render's glass level, and on a dark render darker than
    # a third of its metal: the Deep Purple's shadow round each lens is not glass
    dark = ndimage.binary_fill_holes(L < min(_tones(f, box)[0] * 1.4, render_back(f)[0] * .3))
    parts, n = ndimage.label(dark)
    big = 1 + np.nonzero(ndimage.sum(dark, parts, range(1, n + 1)) > dark.size * .002)[0]
    yy, xx = np.mgrid[0:size[1], 0:size[0]]
    flash = np.hypot(xx - fx * size[0], yy - fy * size[1]) < fr * size[0] * 1.05
    keep = np.isin(parts, big) | flash
    if lidar:
        keep |= off_lidar(L, size) < .05
    k = 1 - ndimage.gaussian_filter(keep.astype(float), 1.0)
    # What the metal is moved from and to. The render's back gives the lightness. The
    # plateau's own tint goes to the finish's at the render's ratio of plateau tint
    # to back tint: a 15's camera is the deeper shade of its back (2.0 on Apple's
    # Pink, 2.7 on its Blue, where the plateau came out greyer than the back), and
    # Blue Titanium's plateau is bluer than its back (1.6), which a Black Titanium,
    # with no tint to deepen, does not take on (it had, from the plateau's own blue).
    back = render_back(f)
    pm = np.median(color.rgb2lab(c)[k > .9][:, 1:], axis=0)
    t = hex_lab(tint)
    t[1:] *= np.clip(np.hypot(*pm) / max(np.hypot(*back[1:]), 2), .5, 3)
    back[1:] = pm
    up = t[0] > back[0]
    # Polished parts keep the render's lightness and take the finish's tint: the
    # flash, which kept Deep Purple's lavender on Space Black and Gold, and going up
    # to a lighter finish the steel lens rims with the dark ring inside them. Rims
    # sit at L 55-58 on Apple's Gold, Sierra Blue and Deep Purple alike (Gold's back
    # 90, Deep Purple's 31): polished metal mirrors the studio, not the finish, and
    # stepped up with the glass they went white on a 14 Pro Gold.
    tinted = flash.copy()
    if up:
        for i in big:
            d = parts == i
            tinted |= ndimage.binary_dilation(d, iterations=max(3, int(np.sqrt(d.sum() / np.pi) * .3))) & ~d
    tw = ndimage.gaussian_filter(tinted.astype(float), 1.0)[..., None]
    lab_c = color.rgb2lab(c)
    # a flash shows a third of its finish's tint on Apple's coloured renders (Blue
    # Titanium .34, Deep Purple .33), a polished rim all of it (.7-1.1)
    # (the black ring inside a rim stays black: no tint under L 25, all of it by 55)
    lab_c[..., 1:] += (t[1:] - back[1:]) * smooth(lab_c[..., :1], 25, 55) * np.where(flash, 1 / 3, 1)[..., None]
    c = c * (1 - tw) + np.clip(color.lab2rgb(lab_c), 0, 1) * tw
    k = k * (1 - tw[..., 0])
    if not up:
        to = lin(np.clip(color.lab2rgb(t[None, None])[0, 0], 0, 1))
        new = srgb(lin(c) * (to / lin(np.clip(color.lab2rgb(back[None, None])[0, 0], 0, 1))))
    else:
        new = color.rgb2lab(c) + (t - back)
        knee = 90
        new[..., 0] = np.where(new[..., 0] > knee, knee + (100 - knee) * np.tanh((new[..., 0] - knee) / (100 - knee)), new[..., 0])
        new = color.lab2rgb(np.clip(new, [0, -128, -128], [100, 127, 127]))
    out = np.clip(srgb(lin(c) * (1 - k[..., None]) + lin(np.clip(new, 0, 1)) * k[..., None]), 0, 1)
    return Image.fromarray(np.dstack([out * 255, np.asarray(m)[..., 3]]).round().astype(np.uint8), "RGBA"), at


def _tones(f, box):
    """A render's non-glass lightness: median and spread (the glass is the darkest
    quarter in every one of them)."""
    L = color.rgb2lab(np.asarray(Image.open(CUT / f).convert("RGB").crop(box)) / 255)[..., 0]
    glass = np.percentile(L, 25) + 2
    rest = L[L > glass * 1.4]
    q1, q3 = np.percentile(rest, [25, 75])
    return glass, float(np.median(rest)), float(q3 - q1)


def harmonic(img, D):
    """Solve Laplace's equation over D with the pixels around it held: the smoothest
    fill that meets its surround, and never lighter or darker than that surround.
    At the picture's own edge there is no neighbour and no term."""
    from scipy import sparse
    from scipy.sparse.linalg import spsolve
    h, w = D.shape
    n = int(D.sum())
    idx = -np.ones(D.shape, int)
    idx[D] = np.arange(n)
    ys, xs = np.nonzero(D)
    diag, r, c, b = np.zeros(n), [], [], np.zeros((n, img.shape[2]))
    for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        ny, nx = ys + dy, xs + dx
        k = np.nonzero((ny >= 0) & (ny < h) & (nx >= 0) & (nx < w))[0]
        diag[k] += 1
        ny, nx = ny[k], nx[k]
        unk = D[ny, nx]
        r.append(k[unk]); c.append(idx[ny[unk], nx[unk]])
        np.add.at(b, k[~unk], img[ny[~unk], nx[~unk]])
    r, c = np.concatenate(r), np.concatenate(c)
    A = sparse.csc_matrix((np.r_[diag, -np.ones(len(r))], (np.r_[np.arange(n), r], np.r_[np.arange(n), c])), shape=(n, n))
    out = img.copy()
    out[D] = spsolve(A, b)
    return out


def erase_module(im):
    """Fill the photo's own (side-lit) camera with plain back, grown in from the back
    right of and below it. The new plateau covers less than this patch, so the strip
    beside and under it shows: carrying each column up from a band lower down left
    streaks and a light band there with a hard edge (owner, 2026-10-11: "the shadows
    on the 14 Pro Max, 15 Pro Max look wrong"). The patch reaches to the top and left
    edges so the frame's shine along them is not held and cannot glow into the fill;
    the light is smooth, so it is solved at quarter size."""
    W = im.width
    a = np.asarray(im).astype(float)
    m = Image.new("L", im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((round(W * .024), round(W * .024), round(W * .69), round(W * .69)), round(W * .14), fill=255)
    k = 4
    top = round(W * .9) // k * k
    sw, sh = W // k, top // k
    small = np.asarray(Image.fromarray(a[:top, :, :3].round().astype(np.uint8)).resize((sw, sh), Image.BOX)).astype(float)
    hole = np.asarray(m.crop((0, 0, W, top)).resize((sw, sh), Image.BOX)) > 0
    hole = np.asarray(Image.fromarray(hole.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(3))) > 0
    yy, xx = np.mgrid[0:sh, 0:sw]
    lim, rim = round(W * .69 / k) + 1, round(W * .06 / k)
    D = hole | ((yy <= lim) & (xx < rim)) | ((xx <= lim) & (yy < rim))
    filled = Image.fromarray(np.clip(harmonic(small, D), 0, 255).round().astype(np.uint8)).resize((W, top), Image.BICUBIC)
    fill = a.copy()
    fill[:top, :, :3] = np.asarray(filled)
    m = np.asarray(m.filter(ImageFilter.GaussianBlur(W * .01))).astype(float)[..., None] / 255
    out = a.copy()
    out[..., :3] = a[..., :3] * (1 - m) + fill[..., :3] * m
    return Image.fromarray(out.round().astype(np.uint8), "RGBA")


def mirror_rim(im, band=.035, feather=.45):
    """The right half's frame as the left's, mirrored. straighten() rebuilds the near
    (right) side at the glass plus a thin rim, so every Pro painted on it showed a dark
    hairline down its right side and squared-off right corners where the left shows the
    titanium band and round ones (owner, 2026-10-13: "the clipped sides ... right side").
    A back is the same frame both sides, so on the right half everything within `band`
    of the outline (rim, the seam to the glass, the corners and the silhouette itself) is
    the left's, mirrored, blended into the glass over the inner part of the band. The
    band is measured on the left's outline, mirrored, so it follows the corners."""
    from scipy import ndimage
    a = np.asarray(im).astype(float)
    W = a.shape[1]
    mir = a[:, ::-1]
    d = ndimage.distance_transform_edt(a[..., 3] > 128)[:, ::-1]
    D = W * band
    w = 1 - smooth(d, D * feather, D)
    w[:, :W // 2] = 0
    out = a * (1 - w[..., None]) + mir * w[..., None]
    return Image.fromarray(out.round().astype(np.uint8), "RGBA")


def bake_pro():
    src = straighten(Image.open(CUT / "iphone-15-pro-back-blue.webp").convert("RGBA"))
    src = src.resize((round(WORK_H * .478), WORK_H), Image.LANCZOS)
    clean = mirror_rim(erase_module(src))
    lab = color.rgb2lab(np.asarray(clean)[..., :3] / 255)
    chroma = np.hypot(lab[..., 1], lab[..., 2])
    body = chroma > 18
    body_l = float(np.median(lab[..., 0][body]))
    blue = lab_hex(render_back(OEM["15"][0][0]))   # Blue Titanium as Apple shows it; the photo's own is bluer
    # blue glass gets the full paint; the steel band gets a lighter tint
    weight = np.maximum(smooth(chroma, 6, 20), 0.85 * smooth(lab[..., 0], 20, 55))
    weight *= np.asarray(clean)[..., 3] / 255 > 0
    out = []
    for pid, model, finish, target, w in PRO:
        tint = target or blue
        dark = hex_lab(tint)[0] < 40
        im = paint(clean, weight, tint, body_l, LIGHT_DARK if dark else LIGHT_LIGHT)
        mod, at = module_oem(pid[:2], tint, src.width / MM[model][1])
        im = im.copy(); im.paste(mod, at, rrect_mask(mod.size, round(mod.width * .2), blur=1.2))
        im = finish_back(im, w, pid)
        out.append(dict(id=pid, model=model, finish=finish, metal=target or metal_of(im),
                        w=w, h=H, repaint=True, ok=True))
    return out


def rrect_mask(size, r, blur=1.5):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), r, fill=255)
    return m.filter(ImageFilter.GaussianBlur(blur))


# The 14 and 15 from Apple's straight-on renders, as the Pros: (file, plateau box
# in px, flash centre and radius in box widths), measured off the render. Their
# camera went the grey-and-paint way the Pros' did, flat black lenses with grey
# glints, and at one share of the width for a 15 and a 15 Plus alike.
BASE_OEM = {
    "15": [("qs-iphone-15.webp", (13, 13, 122, 123), (.75, .23, .09))],    # Blue
    "14": [("qs-iphone-14.webp", (8, 12, 120, 123), (.74, .21, .089))],    # Blue
}


def base_body():
    """The clean iPhone 16 White back, its pill camera patched out with the
    (mirrored) clean top-right corner."""
    body = Image.open(OUT / "16-white.webp").convert("RGBA")
    mir = body.transpose(Image.FLIP_LEFT_RIGHT)
    fm = Image.new("L", body.size, 0)
    ImageDraw.Draw(fm).rounded_rectangle((8, 8, 195, 280), 30, fill=255)
    fm = fm.filter(ImageFilter.GaussianBlur(6))
    return Image.composite(mir, body, fm)


def bake_base():
    body = base_body()
    a = np.asarray(body).astype(float)
    lab = color.rgb2lab(a[..., :3] / 255)
    body_l = float(np.median(lab[..., 0][a[..., 3] > 250]))
    weight = smooth(lab[..., 0], 45, 75) * (a[..., 3] > 0)
    out = []
    for pid, model, finish, target, w in BASE:
        im = paint(body, weight, target, body_l, 0.9)
        mod, at = module_oem(pid[:2], target, im.width / MM[model][1], BASE_OEM, lidar=False)
        im.paste(mod, at, rrect_mask(mod.size, round(mod.width * .22)))
        finish_back(im, w, pid)
        out.append(dict(id=pid, model=model, finish=finish, metal=lab_hex(hex_lab(target) - [8, 0, 0]),
                        w=w, h=H, repaint=True, ok=True))
    return out

# Real backs. (id, model, finish, source, width at h=900). The source is a file in
# assets/cutouts, or the id of a back made earlier in this list: then the back is
# that one at its own model's size (sized) or painted in a finish (painted).
# The 13 renders are the owner's device art (qs-*, 245 x 503, straight on).
R13 = "qs-iphone-13-back--{}.webp"
R13P = "qs-iphone-13-pro-back--{}.webp"
# the camera plateau on each source, in its own px (left, top, right, bottom) and its
# corner radius, measured off the render's outline (and the photo's, squared up)
CAMERA = {"13": ((9, 9, 117, 115), 22), "13 Pro": ((9, 10, 139, 144), 26), "14": ((6, 6, 374, 350), 72)}
# (PRODUCT)RED as the 14's photograph shows it; the 13 Pro's Silver, a cool white
RED, SILVER = "#d6132e", "#e8e9e6"
REAL = [
    ("13-pro-max-graphite", "iPhone 13 Pro Max", "Graphite", ("sized", "13-pro-graphite"), 434),
    ("13-pro-graphite", "iPhone 13 Pro", "Graphite", R13P.format("graphite"), 435),
    ("13-pro-max-gold", "iPhone 13 Pro Max", "Gold", ("sized", "13-pro-gold"), 434),
    ("13-pro-gold", "iPhone 13 Pro", "Gold", R13P.format("gold"), 435),
    ("13-pro-max-silver", "iPhone 13 Pro Max", "Silver", ("sized", "13-pro-silver"), 434),
    ("13-pro-silver", "iPhone 13 Pro", "Silver", ("painted", "13-pro-gold", SILVER), 435),
    ("13-pro-max-sierra-blue", "iPhone 13 Pro Max", "Sierra Blue", ("sized", "13-pro-sierra-blue"), 434),
    ("13-pro-sierra-blue", "iPhone 13 Pro", "Sierra Blue", R13P.format("sierra-blue"), 435),
    ("13-pro-max-alpine-green", "iPhone 13 Pro Max", "Alpine Green", ("sized", "13-pro-alpine-green"), 434),
    ("13-pro-alpine-green", "iPhone 13 Pro", "Alpine Green", R13P.format("alpine-green"), 435),
    ("13-midnight", "iPhone 13", "Midnight", R13.format("midnight"), 435),
    ("13-mini-midnight", "iPhone 13 mini", "Midnight", ("sized", "13-midnight"), 436),
    ("13-starlight", "iPhone 13", "Starlight", R13.format("starlight"), 435),
    ("13-mini-starlight", "iPhone 13 mini", "Starlight", ("sized", "13-starlight"), 436),
    ("13-blue", "iPhone 13", "Blue", R13.format("blue"), 435),
    ("13-mini-blue", "iPhone 13 mini", "Blue", ("sized", "13-blue"), 436),
    ("13-pink", "iPhone 13", "Pink", R13.format("pink"), 435),
    ("13-mini-pink", "iPhone 13 mini", "Pink", ("sized", "13-pink"), 436),
    ("13-green", "iPhone 13", "Green", R13.format("green"), 435),
    ("13-mini-green", "iPhone 13 mini", "Green", ("sized", "13-green"), 436),
    ("13-red", "iPhone 13", "(PRODUCT)RED", ("painted", "13-blue", RED), 435),
    ("13-mini-red", "iPhone 13 mini", "(PRODUCT)RED", ("sized", "13-red"), 436),
    ("14-red", "iPhone 14", "(PRODUCT)RED", "photo-iphone-14-red.webp", 435),
    ("14-plus-red", "iPhone 14 Plus", "(PRODUCT)RED", ("sized", "14-red"), 434),
]
REAL_H = 1800   # worked on at twice the set's height, then finish_back takes it to 900


def camera_of(model):
    return CAMERA["13 Pro" if model.startswith("iPhone 13 Pro") else model[len("iPhone "):].split()[0]]


def square_up(im):
    """A back photographed a little off its axis (a keystone: the 14 (PRODUCT)RED is 822
    px across at the top and 690 at the bottom): the outline's four sides fitted as
    lines, and the quad they make mapped onto a rectangle, so the lenses come out round."""
    from skimage import transform
    a = np.asarray(im).astype(float)
    A = a[..., 3] > 128
    h, w = A.shape
    ys = np.arange(int(h * .2), int(h * .8), 20)
    xs = np.arange(int(w * .3), int(w * .7), 10)
    lx = np.polyfit(ys, [np.where(A[y])[0].min() for y in ys], 1)
    rx = np.polyfit(ys, [np.where(A[y])[0].max() + 1 for y in ys], 1)
    ty = np.polyfit(xs, [np.where(A[:, x])[0].min() for x in xs], 1)
    by = np.polyfit(xs, [np.where(A[:, x])[0].max() + 1 for x in xs], 1)

    def meet(xl, yl):                                # an x(y) line against a y(x) line
        x = xl[1]
        for _ in range(20):
            y = np.polyval(yl, x); x = np.polyval(xl, y)
        return x, np.polyval(yl, x)
    quad = np.array([meet(lx, ty), meet(rx, ty), meet(rx, by), meet(lx, by)])
    W = round(np.hypot(*(quad[1] - quad[0])) / 2 + np.hypot(*(quad[2] - quad[3])) / 2)
    H = round(np.hypot(*(quad[3] - quad[0])) / 2 + np.hypot(*(quad[2] - quad[1])) / 2)
    rect = np.array([[0, 0], [W, 0], [W, H], [0, H]], float)
    if hasattr(transform.ProjectiveTransform, "from_estimate"):
        tf = transform.ProjectiveTransform.from_estimate(rect, quad)
    else:
        tf = transform.ProjectiveTransform(); tf.estimate(rect, quad)
    out = transform.warp(a / 255, tf, output_shape=(H, W), order=3, cval=0)
    return Image.fromarray((np.clip(out, 0, 1) * 255).round().astype(np.uint8), "RGBA")


# photographs taken a little off their axis, squared up before use
KEYSTONED = {"photo-iphone-14-red.webp"}


def trimmed(f):
    im = Image.open(CUT / f).convert("RGBA")
    if f in KEYSTONED:
        im = square_up(im)
    im = im.crop(im.getchannel("A").point(lambda v: 255 if v > 128 else 0).getbbox())
    return im


def sized(im, cam, src, dst):
    """A back at another model's size: the body scaled to `dst` (mm, h x w) at the
    source's px per mm, the camera kept at its own size. The camera is lifted off,
    the hole filled with the smoothest back that meets its surround (harmonic), the
    body scaled, and the camera set back at its scaled place: its corner keeps its
    distance from the frame's, as on Apple's drawings of each pair."""
    (x0, y0, x1, y1), r = cam
    a = np.asarray(im).astype(float)
    W, H = im.size
    cam_im = im.crop((x0, y0, x1, y1))
    # fill the plateau (and a little round it) at half size; the light is smooth
    k = 2
    pad = round((x1 - x0) * .25)
    bx = (max(0, x0 - pad), max(0, y0 - pad), min(W, x1 + pad), min(H, y1 + pad))
    sub = Image.fromarray(a[bx[1]:bx[3], bx[0]:bx[2], :3].round().astype(np.uint8))
    sw, sh = sub.width // k, sub.height // k
    small = np.asarray(sub.resize((sw, sh), Image.BOX)).astype(float)
    m = Image.new("L", sub.size, 0)
    g = round((x1 - x0) * .03)
    ImageDraw.Draw(m).rounded_rectangle((x0 - bx[0] - g, y0 - bx[1] - g, x1 - bx[0] + g, y1 - bx[1] + g), r + g, fill=255)
    D = np.asarray(m.resize((sw, sh), Image.BOX)) > 0
    filled = np.asarray(Image.fromarray(np.clip(harmonic(small, D), 0, 255).round().astype(np.uint8)).resize(sub.size, Image.BICUBIC)).astype(float)
    mw = np.asarray(m.filter(ImageFilter.GaussianBlur(2))).astype(float)[..., None] / 255
    out = a.copy()
    out[bx[1]:bx[3], bx[0]:bx[2], :3] = a[bx[1]:bx[3], bx[0]:bx[2], :3] * (1 - mw) + filled * mw
    body = Image.fromarray(out.round().astype(np.uint8), "RGBA")
    s = H / src[0]
    W2, H2 = round(dst[1] * s), round(dst[0] * s)
    body = body.resize((W2, H2), Image.LANCZOS)
    body.paste(cam_im, (round(x0 * W2 / W), round(y0 * H2 / H)), rrect_mask(cam_im.size, r, blur=1.0))
    return body


def painted(im, target):
    """A real back in a finish Apple sold it in but no render shows: everything with
    colour in it (glass, frame, the plateau's metal and the lens rings) takes the
    finish's hue at the source's own shading; the flash and the logo's mirror, which
    have none, keep theirs, and so does the lens glass, dark with coloured glints in it
    (a 13 in red from the Blue had red lenses, then red glints in black ones)."""
    from scipy import ndimage
    a = np.asarray(im).astype(float) / 255
    lab = color.rgb2lab(a[..., :3])
    chroma = np.hypot(lab[..., 1], lab[..., 2])
    # the lenses: each dark patch of a lens's size, as the whole disc it is part of. The
    # studio light crosses the top of a 13's lens, so the dark is its lower part, the
    # full width across: the disc is as wide as the patch and sits on its bottom.
    glass = (lab[..., 0] < 22) & (a[..., 3] > .99)
    parts, n = ndimage.label(glass)
    yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    lens = np.zeros(glass.shape, bool)
    for i, sl in enumerate(ndimage.find_objects(parts)):
        if (parts[sl] == i + 1).sum() < (im.width * .06) ** 2:
            continue
        r = max(sl[1].stop - sl[1].start, sl[0].stop - sl[0].start) / 2
        lens |= np.hypot(xx - (sl[1].start + sl[1].stop) / 2, yy - (sl[0].stop - r)) < r + 1
    keep = ndimage.gaussian_filter(lens.astype(float), 1.5)
    weight = smooth(chroma, 4, 12) * smooth(lab[..., 0], 14, 24) * (1 - keep) * (a[..., 3] > 0)
    body_l = float(np.median(lab[..., 0][(chroma > 12) & (a[..., 3] > .99)]))
    t = hex_lab(target)
    # a light source to a light finish keeps its light; a mid one (the Blue) to the red
    # shades round the red's own lightness
    return paint(im, weight, target, body_l, 1.0 if abs(t[0] - body_l) < 15 else .8)


def bake_real():
    rows = {r[0]: r for r in REAL}
    made = {}

    def back(pid):
        """(work image, model, painted?, how it was made) for a REAL id, its source first."""
        if pid in made:
            return made[pid]
        _, model, _, src, _ = rows[pid]
        if isinstance(src, str):
            im = trimmed(src)
            made[pid] = (im.resize((round(im.width * REAL_H / im.height), REAL_H), Image.LANCZOS), model, False, None)
        elif src[0] == "sized":
            base, bmodel, rep, _ = back(src[1])
            (x0, y0, x1, y1), r = camera_of(bmodel)
            f = base.height / CAM_SRC_H[bmodel]
            cam = ((round(x0 * f), round(y0 * f), round(x1 * f), round(y1 * f)), round(r * f))
            made[pid] = (sized(base, cam, MM[bmodel], MM[model]), model, True,
                         f"the {bmodel[len('iPhone '):]}'s back at the {model[len('iPhone '):]}'s size")
        else:
            base, bmodel, _, _ = back(src[1])
            made[pid] = (painted(base, src[2]), model, True, None)
        return made[pid]

    out = []
    for pid, model, finish, src, w in REAL:
        im, _, repaint, note = back(pid)
        fin = finish_back(im, w, pid)
        rec = dict(id=pid, model=model, finish=finish, metal=metal_of(fin), w=w, h=H, repaint=repaint, ok=True)
        if note:
            rec["made"] = note
        out.append(rec)
    return out


# the height of each model's source as trimmed, the scale its CAMERA box is in
CAM_SRC_H = {"iPhone 13": 503, "iPhone 13 Pro": 503, "iPhone 14": 1497}


# Backs baked elsewhere whose width is off Apple's spec: the iPhone 17 finishes
# were painted on the 16's back and kept the 16's width (the 17 is 71.5 x 149.6 mm).
REFIT = {"16-white-as-lavender": 427, "16-white-as-sage": 427, "16-white-as-mist-blue": 427}


def refit(idx):
    for p in idx["phones"]:
        w = REFIT.get(p["id"])
        if not w:
            continue
        f = OUT / f"{p['id']}.webp"
        im = Image.open(f).convert("RGBA")
        if im.width != w:
            im.resize((w, H), Image.LANCZOS).save(f, quality=80, method=6)
        p["w"] = w


def main():
    idx_path = OUT / "index.json"
    idx = json.loads(idx_path.read_text())
    refit(idx)
    new = bake_pro() + bake_base() + bake_real()
    ids = {p["id"] for p in new}
    keep = [p for p in idx["phones"] if p["id"] not in ids]
    # generation order: 18 Pro, 17 Pro, 17, 16 Pro, 16, 17e/16e, 15 Pro, 15, 14 Pro, 14, 13 Pro, 13
    def at(pred):
        return next(i for i, p in enumerate(keep) if pred(p))
    pro16 = [p for p in new if p["id"].startswith("16-pro")]
    rest = [p for p in new if not p["id"].startswith("16-pro")]
    i = at(lambda p: p["model"] == "iPhone 16")
    keep[i:i] = pro16
    order = ["15-pro", "15-", "14-pro", "14-", "13-pro", "13-"]
    for pre in order:
        keep += [p for p in rest if p["id"].startswith(pre) and p not in keep]
    idx["phones"] = keep
    idx_path.write_text(json.dumps(idx, indent=1) + "\n")
    print(len(keep), "phones")


if __name__ == "__main__":
    main()
