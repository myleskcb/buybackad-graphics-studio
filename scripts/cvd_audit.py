#!/usr/bin/env python3
"""
Colour-vision-deficiency audit for the theme palettes (DESIGN-LAW rule 43).

Simulates protanopia, deuteranopia and tritanopia over each theme's accent
against its own gradient start, and reports the WORST of the four contrast
numbers rather than the normal-vision one.

Why a standalone script rather than a pass inside app.js: this measures the
authored palette, not a rendered template, so it needs no canvas and no
browser. Run it after touching THEME_DECKS.

    python3 scripts/cvd_audit.py            # table + exit 1 if anything fails
    python3 scripts/cvd_audit.py --json     # machine-readable

Method notes that matter (see DESIGN-LAW rules 40 and 43):
  * Simulation runs on LINEAR RGB via LMS. Doing it on sRGB values is
    meaningless for the same reason colour maths belongs in a perceptual space.
  * Contrast is WCAG relative luminance, matching the rest of the audit.
  * Glyph-masking does not apply here because these are authored flat colours,
    not ink sampled off a photograph. For template-level checks reuse the
    existing masked sampler instead — a bounding-box average is a known
    false-positive trap (bandKnockout: 1.21:1 bbox vs 12.06:1 masked).
"""
import argparse
import json
import sys

# Accent against its own gradient start (c1), read from THEME_DECKS in app.js.
# Keep in sync by hand; a mismatch here is a silent false pass.
THEMES = [
    ("Navy x Orange",     "#132a63", "#ff7a1a"),
    ("Teal x Coral",      "#0c5f5b", "#ff6f61"),
    ("Purple x Gold",     "#4b1d95", "#ffd200"),
    ("Forest x Amber",    "#14532d", "#fbbf24"),
    ("Crimson x Mint",    "#9f1239", "#6ee7b7"),
    ("Black x Electric",  "#101018", "#38bdf8"),
    ("Charcoal x Lime",   "#26262e", "#a3e635"),
    ("Royal x Tangerine", "#1e3a8a", "#fb923c"),
    ("Espresso x Cream",  "#3f2d20", "#f5e6c8"),
    ("Midnight x Pink",   "#1e1b4b", "#f472b6"),
]

TARGET = 4.5  # WCAG AA for normal-weight text


def hex_rgb(h):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def _to_linear(c):
    c /= 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _encode(c):
    c = max(0.0, min(1.0, c))
    c = 12.92 * c if c <= 0.0031308 else 1.055 * (c ** (1 / 2.4)) - 0.055
    return max(0, min(255, round(c * 255)))


def wcag_luminance(rgb):
    r, g, b = (_to_linear(v) for v in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = wcag_luminance(a), wcag_luminance(b)
    if la < lb:
        la, lb = lb, la
    return (la + 0.05) / (lb + 0.05)


def simulate(rgb, kind):
    """Brettel/Vienot dichromacy simulation, on linear RGB via LMS."""
    r, g, b = (_to_linear(v) for v in rgb)
    L = 0.31399022 * r + 0.63951294 * g + 0.04649755 * b
    M = 0.15537241 * r + 0.75789446 * g + 0.08670142 * b
    S = 0.01775239 * r + 0.10944209 * g + 0.87256922 * b
    if kind == "protan":
        L, M, S = 1.05118294 * M - 0.05116099 * S, M, S
    elif kind == "deutan":
        L, M, S = L, 0.9513092 * L + 0.04866992 * S, S
    elif kind == "tritan":
        L, M, S = L, M, -0.86744736 * L + 1.86727089 * M
    else:
        raise ValueError(kind)
    return (
        _encode(5.47221206 * L - 4.6419601 * M + 0.16963708 * S),
        _encode(-1.1252419 * L + 2.29317094 * M - 0.1678952 * S),
        _encode(0.02980165 * L - 0.19318073 * M + 1.16364789 * S),
    )


KINDS = ("protan", "deutan", "tritan")


def audit():
    out = []
    for name, ground_hex, accent_hex in THEMES:
        ground, accent = hex_rgb(ground_hex), hex_rgb(accent_hex)
        normal = contrast(accent, ground)
        sims = {k: contrast(simulate(accent, k), simulate(ground, k)) for k in KINDS}
        worst = min([normal] + list(sims.values()))
        if normal < TARGET:
            verdict = "fails already"      # pre-existing, not a CVD regression
        elif worst < TARGET:
            verdict = "FAILS UNDER CVD"    # the case this rule exists to catch
        else:
            verdict = "ok"
        out.append({
            "theme": name, "normal": round(normal, 2),
            **{k: round(v, 2) for k, v in sims.items()},
            "worst": round(worst, 2), "verdict": verdict,
        })
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()
    rows = audit()

    if args.json:
        print(json.dumps(rows, indent=2))
    else:
        print(f"{'theme':20}{'normal':>8}{'protan':>8}{'deutan':>8}{'tritan':>8}{'worst':>8}  verdict")
        for r in rows:
            print(f"{r['theme']:20}{r['normal']:8.2f}{r['protan']:8.2f}"
                  f"{r['deutan']:8.2f}{r['tritan']:8.2f}{r['worst']:8.2f}  {r['verdict']}")
        bad = [r for r in rows if r["verdict"] == "FAILS UNDER CVD"]
        pre = [r for r in rows if r["verdict"] == "fails already"]
        print()
        print(f"{len(bad)} theme(s) pass with normal vision and fail under simulation.")
        if pre:
            print(f"{len(pre)} theme(s) fail before simulation (separate problem): "
                  + ", ".join(r["theme"] for r in pre))

    return 1 if any(r["verdict"] == "FAILS UNDER CVD" for r in rows) else 0


if __name__ == "__main__":
    sys.exit(main())
