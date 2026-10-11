"""Clean the speckled frame round the photographed phone backs (motion/phones).

The iPhone 16, 16e and 17e backs, and the 17 finishes painted on the 16 White,
carry their frame's reflections as a band of dark dashes round the edge, and their
side buttons as a grey stretch cutting the lines of the rim; the 17 and 18 Pro
backs do neither and are left alone. Run before scripts/bake_extra_phones.py,
which builds the 14 and 15 on the 16 White (and cleans every back it bakes).

Run:  python3 scripts/clean_phone_edges.py   (needs pillow, numpy, scipy)
"""
from pathlib import Path

from PIL import Image

from phone_rim import clean_rim, mend_sides

OUT = Path(__file__).resolve().parent.parent / "motion" / "phones"
IDS = ["16-white", "16-black", "16-pink", "16-teal", "16-ultramarine", "16e-white", "16e-black",
       "17e-white", "17e-black", "17e-soft-pink",
       "16-white-as-lavender", "16-white-as-sage", "16-white-as-mist-blue"]

for pid in IDS:
    f = OUT / f"{pid}.webp"
    clean_rim(mend_sides(Image.open(f))).save(f, quality=80, method=6)
    print(pid)
