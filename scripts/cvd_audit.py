#!/usr/bin/env python3
"""
Colour-vision-deficiency audit for the studio's colour themes (DESIGN-LAW
rules 43 and 123).

Reads COLOR_THEMES out of app.js (the twelve pairings Easy Mode and the
designer offer, rule 123) and simulates protanopia, deuteranopia and
tritanopia over every colour that carries words against both stops of its
own background, reporting the WORST of the four contrast numbers rather than
the normal-vision one:

    text (ink)        >= 4.5:1 on both stops, normal and simulated
    bright colour     >= 4.5:1 on both stops normal, >= 3.0:1 simulated
                      (the floors theme_law.mjs and the colour builder use)
    small print       >= 4.5:1 on both stops, normal and simulated

Until 2026-10-05 this file carried its own hard-coded list of ten themes
("Navy x Orange", "Teal x Coral"...) that matched nothing in app.js, and
failed on it: a check that asks the wrong question (AGENT-BRIEF). It now
reads the live set, so a theme added or re-solved is measured as shipped.

Why a standalone script rather than a pass inside app.js: this measures the
authored palette, not a rendered template, so it needs no canvas and no
browser.

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
import os
import re
import sys

APP = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "app.js")


def read_themes(path=APP):
    """COLOR_THEMES as app.js declares it: name, c1, c2, accent, ink, support."""
    with open(path, encoding="utf-8") as f:
        src = f.read()
    start = src.find("const COLOR_THEMES = [")
    if start < 0:
        sys.exit("COLOR_THEMES not found in app.js")
    end = src.find("\n];", start)
    body = src[start:end]
    themes = []
    for m in re.finditer(r"\{\s*name:'([^']+)'(.*?)\n?\s*\},?\s*$", body, re.M):
        name, rest = m.group(1), m.group(2)
        hexes = dict(re.findall(r"\b(c1|c2|accent|ink|support):'(#[0-9a-fA-F]{6})'", rest))
        if not {"c1", "c2", "accent", "ink"} <= set(hexes):
            sys.exit(f"theme {name}: a colour is missing in app.js ({sorted(hexes)})")
        themes.append({"name": name, **hexes})
    if not themes:
        sys.exit("no theme records parsed from COLOR_THEMES")
    return themes


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
# role: (floor with normal sight, floor under the worst simulation)
FLOORS = {"ink": (4.5, 4.5), "accent": (4.5, 3.0), "support": (4.5, 4.5)}


def worst_on(fg_hex, grounds, kind=None):
    fg = hex_rgb(fg_hex)
    out = []
    for g in grounds:
        bg = hex_rgb(g)
        if kind is None:
            out.append(contrast(fg, bg))
        else:
            out.append(contrast(simulate(fg, kind), simulate(bg, kind)))
    return min(out)


def audit(themes):
    rows = []
    for t in themes:
        grounds = [t["c1"], t["c2"]]
        row = {"theme": t["name"], "fails": []}
        for role, (floor, floor_cvd) in FLOORS.items():
            if role not in t:
                row["fails"].append(f"no {role} colour")
                continue
            normal = worst_on(t[role], grounds)
            sims = {k: worst_on(t[role], grounds, k) for k in KINDS}
            worst = min(sims.values())
            row[role] = {"normal": round(normal, 2), **{k: round(v, 2) for k, v in sims.items()}, "worst": round(worst, 2)}
            if normal < floor:
                row["fails"].append(f"{role} {normal:.2f}:1 with normal sight (floor {floor})")
            elif worst < floor_cvd:
                k = min(sims, key=sims.get)
                row["fails"].append(f"{role} {worst:.2f}:1 for a {k} reader (floor {floor_cvd})")
        row["verdict"] = "ok" if not row["fails"] else "FAIL"
        rows.append(row)
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()
    themes = read_themes()
    rows = audit(themes)

    if args.json:
        print(json.dumps(rows, indent=2))
    else:
        print(f"{'theme':17}{'text':>7}{'cvd':>7}{'bright':>8}{'cvd':>7}{'small':>8}{'cvd':>7}  verdict")
        for r in rows:
            cell = lambda role, k: f"{r[role][k]:7.2f}" if role in r else f"{'-':>7}"
            print(f"{r['theme']:17}{cell('ink', 'normal')}{cell('ink', 'worst')}"
                  f"{cell('accent', 'normal'):>8}{cell('accent', 'worst')}"
                  f"{cell('support', 'normal'):>8}{cell('support', 'worst')}  {r['verdict']}"
                  + ("" if not r["fails"] else "  " + "; ".join(r["fails"])))
        bad = [r for r in rows if r["fails"]]
        print()
        print(f"{len(rows) - len(bad)}/{len(rows)} themes pass under normal sight and protan, deutan and tritan simulation"
              f" (text and small print >= 4.5:1, bright colour >= 4.5:1 and >= 3.0:1 simulated, on both stops).")
    sys.exit(1 if any(r["fails"] for r in rows) else 0)


if __name__ == "__main__":
    main()
