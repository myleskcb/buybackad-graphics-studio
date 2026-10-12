"""Clean the photographed phone backs (motion/phones): their frame, and their glass.

The iPhone 16, 16e and 17e backs, and the 17 finishes painted on the 16 White,
carry their frame's reflections as a band of dark dashes round the edge, and lose
the band inside the outline half way round the top-right corner; phone_rim mends
both. Every back, the 17 and 18 Pro too, carried the lossy codec's square tiles in
its glass; phone_finish smooths them out and saves the back lossless.

Run once, on the backs as photographed (git show 85accb2d:motion/phones/<id>.webp
has them), before scripts/bake_extra_phones.py, which builds the 14 and 15 on the
16 White and finishes every back it bakes the same way.

Run:  python3 scripts/clean_phone_edges.py   (needs pillow, numpy, scipy)
"""
from pathlib import Path

from PIL import Image

from phone_finish import save_back, smooth_body
from phone_rim import clean_rim, mend_top_corner

OUT = Path(__file__).resolve().parent.parent / "motion" / "phones"
EDGES = ["16-white", "16-black", "16-pink", "16-teal", "16-ultramarine", "16e-white", "16e-black",
         "17e-white", "17e-black", "17e-soft-pink",
         "16-white-as-lavender", "16-white-as-sage", "16-white-as-mist-blue"]
GLASS = ["17-pro-cosmic-orange", "17-pro-deep-blue", "17-pro-silver",
         "17-pro-max-cosmic-orange", "17-pro-max-deep-blue", "17-pro-max-silver",
         "18-pro-black", "18-pro-burgundy", "18-pro-glacier",
         "18-pro-max-burgundy", "18-pro-max-glacier", "18-pro-max-silver"]

for pid in EDGES + GLASS:
    f = OUT / f"{pid}.webp"
    im = Image.open(f)
    if pid in EDGES:
        im = clean_rim(mend_top_corner(im))
    save_back(smooth_body(im), f)
    print(pid)
