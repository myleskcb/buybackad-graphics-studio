#!/usr/bin/env python3
"""Measure the CURRENT library against the owner's labelled reference folders.

HANDOFF.md section 5 records a measured formula: the GOOD references are BUSIER
than the bad ones (edge density 25.8-34% vs the library's ~8%), and carry a
wider palette (11-18 buckets vs ~7). That measurement predates the current
library and every pass added since. This re-runs it so the gap is a number
anyone can reproduce, not a remembered one.

Renders are produced by scripts/render_sheet.mjs; this reads PNGs from
.render/singles/ (one file per template) plus the three reference folders.

usage:
  python3 scripts/design_metrics.py                 # compare all three sets
  python3 scripts/design_metrics.py --json out.json
"""
import json
import os
import sys
from pathlib import Path

from PIL import Image, ImageFilter

HOME = Path.home()
REF = HOME / "Desktop" / "designs examples"
BANDS = {"good": "good design", "mid": "mid design", "bad": "bad design"}
RENDERS = Path(__file__).resolve().parent.parent / ".render" / "singles"
SIZE = 256


def load(p):
    try:
        im = Image.open(p).convert("RGB")
    except Exception:
        return None
    return im.resize((SIZE, SIZE), Image.LANCZOS)


def edge_density(im):
    """Fraction of pixels sitting on an edge. Proxy for visual busyness /
    information density — the metric that separated good from bad."""
    g = im.convert("L").filter(ImageFilter.FIND_EDGES)
    px = list(g.getdata())
    return sum(1 for v in px if v > 32) / len(px)


def palette_spread(im):
    """How many coarse colour buckets to reach 90% of the image. A low number
    means the frame is essentially two or three colours."""
    q = im.quantize(colors=64, method=Image.MEDIANCUT).convert("RGB")
    counts = {}
    for p in q.getdata():
        b = (p[0] // 32, p[1] // 32, p[2] // 32)
        counts[b] = counts.get(b, 0) + 1
    tot = sum(counts.values())
    run = 0
    for i, (_, c) in enumerate(sorted(counts.items(), key=lambda kv: -kv[1]), 1):
        run += c
        if run >= tot * 0.90:
            return i
    return len(counts)


def luminance_stats(im):
    px = [(0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 for r, g, b in im.getdata()]
    px.sort()
    n = len(px)
    median = px[n // 2]
    lo, hi = px[int(n * 0.02)], px[int(n * 0.98)]
    bright = sum(1 for v in px if v > 0.8) / n
    return median, hi - lo, bright


def measure(p):
    im = load(p)
    if im is None:
        return None
    med, rng, bright = luminance_stats(im)
    return {
        "file": p.name,
        "edge": edge_density(im),
        "palette": palette_spread(im),
        "median_lum": med,
        "tonal_range": rng,
        "bright_frac": bright,
    }


def summarise(rows, label):
    if not rows:
        return None
    def band(key):
        vs = sorted(r[key] for r in rows)
        n = len(vs)
        return vs[n // 4], vs[n // 2], vs[(3 * n) // 4]
    out = {"label": label, "n": len(rows)}
    for k in ("edge", "palette", "median_lum", "tonal_range", "bright_frac"):
        q1, med, q3 = band(k)
        out[k] = {"q1": q1, "median": med, "q3": q3}
    return out


def fmt(s):
    if not s:
        return f"  (no samples)"
    return (f"  {s['label']:<12} n={s['n']:<4} "
            f"edge {s['edge']['median']*100:5.1f}%  "
            f"palette {s['palette']['median']:4.0f}  "
            f"lum {s['median_lum']['median']:.2f}  "
            f"range {s['tonal_range']['median']:.2f}  "
            f"bright {s['bright_frac']['median']*100:5.1f}%")


def main():
    sets = {}
    for key, folder in BANDS.items():
        d = REF / folder
        if not d.is_dir():
            print(f"missing reference folder: {d}", file=sys.stderr)
            continue
        rows = []
        for p in sorted(d.iterdir()):
            if p.suffix.lower() not in (".png", ".jpg", ".jpeg", ".webp"):
                continue
            r = measure(p)
            if r:
                rows.append(r)
        sets[key] = rows

    lib = []
    if RENDERS.is_dir():
        for p in sorted(RENDERS.glob("*.png")):
            r = measure(p)
            if r:
                lib.append(r)

    print("MEASURED DESIGN METRICS (medians)\n")
    print(fmt(summarise(sets.get("good"), "GOOD ref")))
    print(fmt(summarise(sets.get("mid"), "MID ref")))
    print(fmt(summarise(sets.get("bad"), "BAD ref")))
    print(fmt(summarise(lib, "LIBRARY")))

    g, l = summarise(sets.get("good"), "g"), summarise(lib, "l")
    if g and l:
        print("\nGAP TO THE GOOD BAND (library median vs good q1..q3):")
        for k, nice, scale in (("edge", "edge density", 100),
                               ("palette", "palette spread", 1),
                               ("median_lum", "median luminance", 1),
                               ("tonal_range", "tonal range", 1),
                               ("bright_frac", "bright pixels", 100)):
            lo, hi = g[k]["q1"] * scale, g[k]["q3"] * scale
            v = l[k]["median"] * scale
            verdict = "IN BAND" if lo <= v <= hi else ("BELOW" if v < lo else "ABOVE")
            print(f"  {nice:<18} library {v:7.2f}   good {lo:6.2f}..{hi:6.2f}   {verdict}")

    if "--json" in sys.argv:
        out = sys.argv[sys.argv.index("--json") + 1]
        Path(out).write_text(json.dumps(
            {"reference": sets, "library": lib}, indent=1))
        print(f"\nwrote {out}")


if __name__ == "__main__":
    main()
