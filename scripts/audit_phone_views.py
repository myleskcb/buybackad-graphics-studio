"""Audit the video maker's phone backs for anything that would look wonky once
the engine turns them (motion/phones). Every check is MEASURED off the pixels:

  size      900 tall, trimmed edge to edge, the width index.json says
  shape     width/height against Apple's published dimensions (same 0.993 scale
            the whole set sits on)
  square    the silhouette is a true rectangle: left/right edges vertical,
            top/bottom level (a back shot at an angle is a keystone)
  lenses    the camera is seen straight on: every lens is round (a camera seen
            at an angle has oval lenses, and its barrel wall reads backwards
            when the engine turns the phone the other way)
  grain     softness in the band the set shares
  design    what the engine draws for the model: notch or Dynamic Island, mute
            switch or Action button, Camera Control (read from engine.js)

Lighting is NOT scored: studio light, glass panels and reflections swamp any
left/right measure (tried; it failed Apple's own flat shots). Judge light by eye
on motion/views-sheet.html, which draws every phone at every angle.

Run:  python3 scripts/audit_phone_views.py [id-prefix ...]   exits 1 on a FAIL
"""
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
PHONES = ROOT / "motion" / "phones"

# Apple's published width x height (mm)
SPEC = {
    "iPhone 18 Pro": (71.9, 150.0), "iPhone 18 Pro Max": (78.0, 163.4),
    "iPhone 17 Pro": (71.9, 150.0), "iPhone 17 Pro Max": (78.0, 163.4), "iPhone 17": (71.5, 149.6),
    "iPhone 17e": (71.5, 146.7), "iPhone 16e": (71.5, 146.7),
    "iPhone 16 Pro": (71.5, 149.6), "iPhone 16 Pro Max": (77.6, 163.0), "iPhone 16": (71.6, 147.6),
    "iPhone 15 Pro": (70.6, 146.6), "iPhone 15 Pro Max": (76.7, 159.9),
    "iPhone 15": (71.6, 147.6), "iPhone 15 Plus": (77.8, 160.9),
    "iPhone 14 Pro": (71.5, 147.5), "iPhone 14 Pro Max": (77.6, 160.7),
    "iPhone 14": (71.5, 146.7), "iPhone 14 Plus": (78.1, 160.8),
}
SCALE = .993


def luma(a):
    return .2126 * a[..., 0] + .7152 * a[..., 1] + .0722 * a[..., 2]


def edges(alpha):
    h, w = alpha.shape
    rows = np.arange(int(h * .25), int(h * .75), 10)
    cols = np.arange(int(w * .3), int(w * .7), 6)
    left = [np.where(alpha[y] > 128)[0].min() for y in rows]
    right = [np.where(alpha[y] > 128)[0].max() for y in rows]
    top = [np.where(alpha[:, x] > 128)[0].min() for x in cols]
    bot = [np.where(alpha[:, x] > 128)[0].max() for x in cols]
    slope = lambda xs, ys: abs(np.polyfit(xs, ys, 1)[0])
    return max(slope(rows, left), slope(rows, right)), max(slope(cols, top), slope(cols, bot))


def lenses(a, alpha):
    """Width/height of each lens: the dark, round blobs in the camera corner."""
    h, w = alpha.shape
    box = (slice(0, int(w * .75)), slice(0, int(w * .75)))
    L = luma(a.astype(float))[box]
    lab, n = ndimage.label(ndimage.binary_opening((L < 40) & (alpha[box] > 200), iterations=2))
    out = []
    for i in range(1, n + 1):
        ys, xs = np.where(lab == i)
        if len(ys) < (w * .07) ** 2:                # lenses only, not the LiDAR dot or a mic
            continue
        hgt, wid = np.ptp(ys) + 1, np.ptp(xs) + 1
        if len(ys) / (np.pi * hgt * wid / 4) < .8:   # two lenses run together, or a lens in its ring's shadow
            continue
        out.append(wid / hgt)
    return out


def sharp(a, alpha):
    g = luma(a.astype(float))
    lap = np.abs(4 * g[1:-1, 1:-1] - g[:-2, 1:-1] - g[2:, 1:-1] - g[1:-1, :-2] - g[1:-1, 2:])
    return float(lap[alpha[1:-1, 1:-1] > 250].mean())


def designs(models):
    js = ("import('./motion/engine.js').then(e=>console.log(JSON.stringify(" +
          json.dumps(models) + ".map(m=>[m,e.designOf(m)]))))")
    try:
        r = subprocess.run(["node", "--no-warnings", "--input-type=module", "-e", js], cwd=ROOT, capture_output=True, text=True, timeout=60)
        return dict(json.loads(r.stdout.strip().splitlines()[-1]))
    except Exception as e:                          # the engine wants a browser for something: say so, don't guess
        return {m: None for m in models}


def main():
    idx = json.loads((PHONES / "index.json").read_text())["phones"]
    pre = sys.argv[1:]
    idx = [p for p in idx if not pre or any(p["id"].startswith(x) for x in pre)]
    des = designs(sorted({p["model"] for p in idx}))
    fails = 0
    print(f"{'phone':26} {'size':9} {'shape':>6} {'square':>7} {'lenses (w/h)':26} {'grain':>5}  design")
    for p in idx:
        im = Image.open(PHONES / f"{p['id']}.webp").convert("RGBA")
        a = np.asarray(im); alpha = a[..., 3]
        bad = []
        ys, xs = np.where(alpha > 128)
        size_ok = im.size == (p["w"], p["h"]) and p["h"] == 900 and xs.min() == 0 and xs.max() == p["w"] - 1 and ys.min() <= 2 and ys.max() == 899
        if not size_ok: bad.append("size")
        sw, sh = SPEC.get(p["model"], (None, None))
        shape = (p["w"] / (900 * SCALE * sw / sh) - 1) * 100 if sw else float("nan")
        if sw and abs(shape) > 1.5: bad.append("shape")
        vs, hs = edges(alpha)
        if max(vs, hs) > .006: bad.append("square")
        ls = lenses(a, alpha)
        if any(abs(r - 1) > .08 for r in ls): bad.append("lens shape")
        g = sharp(a, alpha)
        if not 1.4 <= g <= 3.4: bad.append("grain")
        d = des.get(p["model"])
        dtxt = "?" if not d else f"{'notch' if d['notch'] else 'island'}, {d['left'] or '-'}{', camera control' if d['camCtrl'] else ''}"
        lt = " ".join(f"{r:.2f}" for r in ls) or "-"
        fails += bool(bad)
        print(f"{p['id']:26} {'ok' if size_ok else 'BAD':9} {shape:+5.1f}% {max(vs, hs):7.4f} {lt:26} {g:5.1f}  {dtxt}"
              + (f"   FAIL: {', '.join(bad)}" if bad else ""))
    print(f"\n{len(idx) - fails} of {len(idx)} pass")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
