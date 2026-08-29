#!/usr/bin/env python3
"""
Asset audit for the Designer Library backgrounds (DESIGN-LAW rule 44).

Checks every file in assets/bg/ against the spec stated in assets/bg/MANIFEST.md
and against what the paid tier actually demands:

  * present     — every filename the manifest names exists
  * orphaned    — nothing in assets/bg/ that the manifest does not name
  * dimensions  — the manifest's stated 2160x2160
  * sufficiency — can it COVER the largest Pro export without upscaling?

Sufficiency is the one that matters commercially. The plan cap applies to the
SHORT side of the export, and a square background has to cover the LONG side, so
a 9:16 Story at the 2160 Pro cap needs 3840px of background. Auditing against
"2160" alone understates the requirement by 1.8x.

    python3 scripts/asset_audit.py
    python3 scripts/asset_audit.py --json
    python3 scripts/asset_audit.py --tier free    # audit against the 1080 cap

Exits non-zero if anything is missing, orphaned, or too small for the tier.

NOTE ON SHARPNESS: this script deliberately does NOT try to score image
sharpness. A spectral high-frequency metric was tried and separated a native
image from a 2x-upscaled copy of itself by only 0.42 vs 0.40 — too weak to gate
anything. Judge softness with an A/B render at matched display size instead
(rule 44).
"""
import argparse
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BG_DIR = os.path.join(ROOT, "assets", "bg")
MANIFEST = os.path.join(BG_DIR, "MANIFEST.md")

# From the topbar picker in app.js. (w, h) at the 1:1 authoring size.
FORMATS = {
    "Square 1:1":   (1080, 1080),
    "Story 9:16":   (1080, 1920),
    "Flyer 8.5x11": (1080, 1398),
    "Wide 16:9":    (1920, 1080),
}

# maxPx from PLANS in app.js. Applies to the SHORT side of the export.
TIER_CAP = {"free": 1080, "pro": 2160}

SPEC_DIM = 2160  # what MANIFEST.md states


def required_px(cap):
    """Largest background edge any format can demand at this plan cap."""
    worst, worst_fmt = 0, None
    for name, (w, h) in FORMATS.items():
        scale = cap / min(w, h)          # export scales until the SHORT side hits the cap
        need = max(round(w * scale), round(h * scale))
        if need > worst:
            worst, worst_fmt = need, name
    return worst, worst_fmt


def manifest_filenames():
    if not os.path.isfile(MANIFEST):
        return []
    text = open(MANIFEST, encoding="utf-8").read()
    names = re.findall(r"`(dl_[A-Za-z0-9_]+\.jpg)`", text)
    return list(dict.fromkeys(names))          # de-dupe, keep order


def read_size(path):
    try:
        from PIL import Image
    except ImportError:
        print("Pillow is required: pip install Pillow", file=sys.stderr)
        raise
    with Image.open(path) as im:
        return im.size


def audit(tier):
    cap = TIER_CAP[tier]
    need, need_fmt = required_px(cap)

    wanted = manifest_filenames()
    on_disk = sorted(f for f in os.listdir(BG_DIR) if f.lower().endswith(".jpg"))

    missing = [f for f in wanted if f not in set(on_disk)]
    orphaned = [f for f in on_disk if f not in set(wanted)]

    off_spec, too_small, sizes = [], [], {}
    for f in on_disk:
        w, h = read_size(os.path.join(BG_DIR, f))
        sizes[f] = (w, h)
        if (w, h) != (SPEC_DIM, SPEC_DIM):
            off_spec.append(f)
        if min(w, h) < need:
            too_small.append(f)

    return {
        "tier": tier, "cap": cap,
        "required_px": need, "driven_by": need_fmt,
        "manifest_count": len(wanted), "on_disk_count": len(on_disk),
        "missing": missing, "orphaned": orphaned,
        "off_spec_count": len(off_spec), "too_small_count": len(too_small),
        "sizes_seen": sorted({f"{w}x{h}" for w, h in sizes.values()}),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tier", choices=sorted(TIER_CAP), default="pro")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    r = audit(args.tier)

    if args.json:
        print(json.dumps(r, indent=2))
    else:
        print(f"Designer Library background audit — {r['tier']} tier (cap {r['cap']}px)\n")
        print(f"  manifest names      {r['manifest_count']}")
        print(f"  files on disk       {r['on_disk_count']}")
        print(f"  missing             {len(r['missing'])}")
        print(f"  orphaned            {len(r['orphaned'])}")
        print(f"  sizes present       {', '.join(r['sizes_seen'])}")
        print(f"  manifest spec       {SPEC_DIM}x{SPEC_DIM}")
        print(f"  off-spec            {r['off_spec_count']}")
        print()
        print(f"  largest demand      {r['required_px']}px  (driven by {r['driven_by']})")
        print(f"  too small for tier  {r['too_small_count']}")
        for f in r["missing"][:10]:
            print(f"    MISSING  {f}")
        for f in r["orphaned"][:10]:
            print(f"    ORPHAN   {f}")
        if r["too_small_count"]:
            print(f"\n  {r['too_small_count']} background(s) cannot cover a "
                  f"{r['driven_by']} export at the {r['tier']} cap without upscaling.")

    bad = r["missing"] or r["orphaned"] or r["too_small_count"]
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
