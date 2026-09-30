"""Bake extra phone backs for the video maker (motion/phones).

No straight-on photo exists for these finishes, so each one is painted from a
back we do have (repaint=true in index.json):

  * Pro / Pro Max (14, 15, 16): the iPhone 15 Pro Blue Titanium back
    (assets/cutouts/iphone-15-pro-back-blue.webp). Blue Titanium itself ships
    as-is; every other finish repaints its glass and plateau.
  * 14 / 14 Plus / 15 / 15 Plus: the clean iPhone 16 White back with its pill
    camera patched out and the square diagonal-lens module from the iPhone 14
    Purple photo (assets/cutouts/ip-gen14-back-purple.webp) set in, then
    painted.

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


def bake_pro():
    src = Image.open(CUT / "iphone-15-pro-back-blue.webp").convert("RGBA")
    lab = color.rgb2lab(np.asarray(src)[..., :3] / 255)
    chroma = np.hypot(lab[..., 1], lab[..., 2])
    body = chroma > 18
    body_l = float(np.median(lab[..., 0][body]))
    # blue glass and plateau get the full paint; the steel band gets a lighter tint
    weight = np.maximum(smooth(chroma, 6, 20), 0.85 * smooth(lab[..., 0], 20, 55))
    weight *= np.asarray(src)[..., 3] / 255 > 0
    wimg = Image.fromarray((weight * 255).astype(np.uint8))
    out = []
    for pid, model, finish, target, w in PRO:
        if target is None:
            im = src
        else:
            dark = hex_lab(target)[0] < 40
            im = paint(src, np.asarray(wimg).astype(float) / 255, target, body_l, 0.8 if dark else 0.55)
        im = finish_back(im, w, pid)
        out.append(dict(id=pid, model=model, finish=finish, metal=target or metal_of(im),
                        w=w, h=H, repaint=target is not None, ok=True))
    return out


def rrect_mask(size, r, blur=1.5):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), r, fill=255)
    return m.filter(ImageFilter.GaussianBlur(blur))


def base_composite():
    body = Image.open(OUT / "16-white.webp").convert("RGBA")
    W = body.width
    # patch out the pill camera with the (mirrored) clean top-right corner
    mir = body.transpose(Image.FLIP_LEFT_RIGHT)
    fm = Image.new("L", body.size, 0)
    ImageDraw.Draw(fm).rounded_rectangle((8, 8, 195, 280), 30, fill=255)
    fm = fm.filter(ImageFilter.GaussianBlur(6))
    body = Image.composite(mir, body, fm)
    # the square module from the 14 photo, straightened to a square
    mod = Image.open(CUT / "ip-gen14-back-purple.webp").convert("RGBA").crop((145, 55, 612, 607))
    side = round(W * .43)
    mod = mod.resize((side, side), Image.LANCZOS)
    # neutralise the purple so every finish paints from the same white
    ml = color.rgb2lab(np.asarray(mod)[..., :3] / 255)
    bl = color.rgb2lab(np.asarray(body)[..., :3] / 255)
    body_l = float(np.median(bl[..., 0][np.asarray(body)[..., 3] > 250]))
    mod_l = float(np.median(ml[..., 0][ml[..., 0] > 55]))
    ml[..., 0] = np.clip(ml[..., 0] + (body_l - mod_l) * smooth(ml[..., 0], 30, 60), 0, 100)
    ml[..., 1:] = 0
    mrgb = (np.clip(color.lab2rgb(ml), 0, 1) * 255).round().astype(np.uint8)
    mod = Image.fromarray(np.dstack([mrgb, np.asarray(mod)[..., 3]]), "RGBA")
    mask = rrect_mask((side, side), round(side * .2))
    body.paste(mod, (round(W * .055), round(W * .055)), mask)
    return body, body_l


def bake_base():
    body, body_l = base_composite()
    a = np.asarray(body).astype(float)
    lab = color.rgb2lab(a[..., :3] / 255)
    weight = smooth(lab[..., 0], 45, 75) * (a[..., 3] > 0)
    out = []
    for pid, model, finish, target, w in BASE:
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
