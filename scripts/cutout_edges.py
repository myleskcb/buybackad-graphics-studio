#!/usr/bin/env python3
"""A PICTURE CUT OFF AT THE FRAME.

A product cutout trimmed to its own edges is anti-aliased all the way round:
the outermost row or column of pixels is partly transparent. A subject the
photograph cut off (the back of a truck, the ends of a stack of bars, a phone
running off the bottom) instead meets the frame with a run of fully opaque
pixels. This reports, for each cutout, the longest such run along each edge as
a share of that edge. 0 everywhere is a whole object; 0.25 or more along an
edge is a crop you can see once the picture floats on a card (confirmed by eye
2026-09-27 on 24 pictures, now in assets/cutout-flags.json).

One exception needs an eye: a product with a long straight edge (a MacBook
lid, an iPad seen flat on) trimmed without anti-aliasing reads the same way.

usage: python3 scripts/cutout_edges.py [--min 0.25] [--json out.json]
"""
import json, os, sys
import numpy as np
from PIL import Image
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
D = os.path.join(ROOT, 'assets', 'cutouts')
MIN = float(sys.argv[sys.argv.index('--min') + 1]) if '--min' in sys.argv else 0.25
flags = json.load(open(os.path.join(ROOT, 'assets', 'cutout-flags.json')))
def run(v):
    best = cur = 0
    for x in (v >= 250):
        cur = cur + 1 if x else 0
        best = max(best, cur)
    return round(best / len(v), 2)
out = {}
for f in sorted(os.listdir(D)):
    if not f.endswith('.webp'): continue
    a = np.asarray(Image.open(os.path.join(D, f)).convert('RGBA'))[:, :, 3]
    out[f[:-5]] = {'L': run(a[:, 0]), 'R': run(a[:, -1]), 'T': run(a[0, :]), 'B': run(a[-1, :])}
hits = {n: r for n, r in out.items() if max(r.values()) >= MIN}
for n, r in sorted(hits.items(), key=lambda x: -max(x[1].values())):
    print(f"{max(r.values()):.2f}  {n:36s} {r}" + ('  flagged' if n in flags else ''))
print(f'{len(hits)} of {len(out)} meet the frame with a hard edge of {MIN:.0%} or more; {sum(1 for n in hits if n in flags)} already flagged')
if '--json' in sys.argv: json.dump(out, open(sys.argv[sys.argv.index('--json') + 1], 'w'))
