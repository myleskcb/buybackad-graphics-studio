#!/usr/bin/env python3
"""Money grounds: real $100 bills falling through depth, on a neutral field.

Owner, 2026-09-27, on the gold Glass Card: "the asset should be on the inner
card while a tile PNG of money or money falling, overlay in BG". DESIGN-LAW
rule 59 records it as the one sanctioned object on the ground rung.

Built from the library's own photograph (assets/cutouts/cash-single-hundred.webp,
1768x782), never clip art, and kept in its own colour (rule 56): no tint, no
duotone. Depth does the work a colour grade used to: far bills are smaller,
softer and darker, near ones larger and sharp, so the field reads as space
behind the card rather than as wallpaper in front of it. The neutral shade the
engine solves per card (naturalGround) then sits on top, as for any photograph.

Deterministic (seeded), so a re-run rewrites byte-identical files.

usage: python3 scripts/build_money_grounds.py   ->  assets/grounds/money-fall-{dark,paper}.webp
"""
import math, os, random
from PIL import Image, ImageFilter, ImageEnhance

ROOT = os.path.join(os.path.dirname(__file__), '..')
OUT = os.path.join(ROOT, 'assets', 'grounds')
SIZE = 2048            # covers Story/Wide at 1080p with no upscale beyond ~1.07x
BILL = Image.open(os.path.join(ROOT, 'assets', 'cutouts', 'cash-single-hundred.webp')).convert('RGBA')

VARIANTS = {
    # field colour, how far back the darkest bills sink, final brightness
    'dark':  {'field': (22, 21, 20), 'far_dim': 0.34, 'near_dim': 0.78},
    'paper': {'field': (236, 233, 227), 'far_dim': 0.92, 'near_dim': 1.0},
}

def bill(scale, angle, blur, dim, shear):
    w = int(BILL.width * scale); h = int(BILL.height * scale)
    b = BILL.resize((w, h), Image.LANCZOS)
    # a falling bill is not flat to the camera: a small shear sells the tilt
    if shear:
        b = b.transform((w + int(abs(shear) * h), h), Image.AFFINE,
                        (1, shear, -shear * h if shear > 0 else 0, 0, 1, 0), Image.BICUBIC)
    rgb, a = b.convert('RGB'), b.getchannel('A')
    rgb = ImageEnhance.Brightness(rgb).enhance(dim)
    b = Image.merge('RGBA', (*rgb.split(), a))
    b = b.rotate(angle, resample=Image.BICUBIC, expand=True)
    if blur > 0.2:
        b = b.filter(ImageFilter.GaussianBlur(blur))
    return b

def build(name, v, seed=20260927):
    rnd = random.Random(seed)
    field = Image.new('RGBA', (SIZE, SIZE), v['field'] + (255,))
    # three depth planes, far to near; spread on a jittered grid so no clump
    # and no bare patch, and bills cross the edges so the field has no border
    planes = [(34, 0.20, 0.30, 5.5), (18, 0.30, 0.42, 2.2), (9, 0.44, 0.60, 0.0)]
    for depth, (n, smin, smax, blur) in enumerate(planes):
        cols = math.ceil(math.sqrt(n)); cell = SIZE / cols
        slots = [(i % cols, i // cols) for i in range(cols * cols)]
        rnd.shuffle(slots)
        t = depth / (len(planes) - 1)
        dim = v['far_dim'] + (v['near_dim'] - v['far_dim']) * t
        for cx, cy in slots[:n]:
            s = rnd.uniform(smin, smax)
            b = bill(s, rnd.uniform(-55, 55), blur * rnd.uniform(0.8, 1.2), dim, rnd.uniform(-0.18, 0.18))
            x = int((cx + rnd.uniform(0.1, 0.9)) * cell - b.width / 2)
            y = int((cy + rnd.uniform(0.1, 0.9)) * cell - b.height / 2)
            field.alpha_composite(b, (x, y)) if 0 <= x and 0 <= y and x + b.width <= SIZE and y + b.height <= SIZE \
                else field.paste(b, (x, y), b)
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, 'money-fall-' + name + '.webp')
    field.convert('RGB').save(path, 'WEBP', quality=82, method=6)
    return path

if __name__ == '__main__':
    for k, v in VARIANTS.items():
        p = build(k, v)
        print(p.replace(ROOT + os.sep, ''), os.path.getsize(p) // 1024, 'KB')
