# Change log

What changed in the product and the engine, newest first. One entry per
shipped change, written for the owner, not for git. The commit is there for
anyone who wants the diff.

Read alongside `OPEN-QUESTIONS.md`, which is the list of things this log has
*not* settled, and `docs/LEARNING-LOG.md`, which records the study sessions
behind the design rules.

Conventions: **Added** / **Changed** / **Fixed** / **Removed**, and a
**Measured** line wherever a number was checked rather than asserted
(DESIGN-LAW rule 37).

---

## 2026-09-28 — Design console, change log, open questions

**Added**
- `console.html` — a design console. Every procedural design decision the
  engine makes (the 19-pass chain, the house type law, accent deepening, the
  money-word colour fix, the Easy Mode colour-theme row, the CSS fallback) is a
  switch. Toggle it and the studio rebuilds in a live preview. Presets:
  *Shipped*, *Authored only*, *No colour work*, *All photo / duotone / wash*,
  *No cutouts / icons*. A share link (`index.html?flags=…`) reproduces any
  configuration; nothing set here changes the product for anyone else.
- `flags.js` — the single registry those switches come from, loaded by both the
  studio and the console. Each entry names the DESIGN-LAW rule it enforces.
- The console's **Last run** tab reads back from the studio what actually
  executed: which passes ran, how many templates each touched, how long, and
  the photo / duotone / wash split the hashed assignment produced.
- `CHANGELOG.md` (this file) and `OPEN-QUESTIONS.md` (contradictions between the
  forks of the design language, with a proposed resolution for each). Both are
  readable inside the console.

**Changed**
- `app.js`: every pass in the chain at the end of the file now runs through
  `runPass(id, fn)`, which checks its flag and logs the result. `houseType`,
  `tameAccents`, `applyColourFix`, `assignStyle`, `buildThemeRow` and
  `ensureCss` each gained a one-line flag check. With no flags stored the
  behaviour is byte-for-byte the shipped one; with `flags.js` missing, every
  flag reads as on.
- `assignStyle` accepts a forced family (`styleForce`) instead of the hashed
  split, which is the first concrete step toward HANDOFF section 4's
  "explicit design record per template".
- `_headers` / `netlify.toml`: the console and the flag registry are served
  `must-revalidate` like `app.js`. `robots.txt` disallows the console.

**Measured**
- 243 templates boot with every switch on and with every switch off; the TDZ
  assertion at the end of `app.js` passes in both states (see the verification
  in the commit).

---

## 2026-08-28 — Design law rules 45–50; "good is busier" corrected
Commit `becf16f`.

**Changed**
- DESIGN-LAW.md gained rules 45–50: a style that sets `fill` must delete
  `grad` (45); ask whether the plate is behind the *text* (46); a layout pass
  may not grow a block into unchecked space (47); a treatment that darkens is
  deleting detail (48); localhost cannot test a policy only production sends
  (49); an audit's own geometry is the first thing to doubt (50).
- The earlier finding that the owner's *good* references were "busier" was
  wrong and is corrected: the good set is *paler and less saturated*, the mid
  set is the busy one.

## 2026-08-28 — Fix CSP: the theme toggle had been dead in production
Commit `1556399`.

**Fixed**
- Two inline scripts in `index.html` (theme stamp, theme toggle) were blocked by
  the site's own Content-Security-Policy. Invisible on localhost, which sends no
  CSP. Hashes added to `_headers` and `netlify.toml`; `scripts/verify_csp.mjs`
  and `scripts/csp_hashes.mjs` added so it cannot regress silently.

## 2026-08-28 — Recover the photograph
Commit `9aca5e4`.

**Fixed**
- The duotone grade multiplied every backdrop by a near-black shadow colour,
  flooring the whole library. Shadow coefficient 0.18 → 0.58, lift 0.40 → 0.68.

**Measured**
- Median backdrop luminance 0.062 → inside the good band (0.21–0.49);
  `scripts/darkness_audit.mjs` isolated the grade as the cause (scrim removed:
  0.088; grade removed: 0.275; raw photo: 0.384).

## 2026-08-28 — Fix the phone number
Commit `1b22dd8`.

**Fixed**
- 82 of 243 templates shipped the phone number unreadable and 45 more at low
  contrast. `highlightBudget` chose its plate by vertical overlap only, set
  `fill` on plates that still carried `grad` (so 138 of 200 brightenings never
  reached the screen), and counted a plate that merely clipped the number as
  its background.

**Measured**
- phone invisible 82 → 0 · phone low-contrast 45 → 0 · text collisions 17 → 0,
  via `scripts/phone_audit.mjs` and `scripts/layout_audit.mjs`.

## 2026-08-28 — Rule 44: the background library is undersized
Commit `b4bc1b6`.

**Changed**
- Finding recorded: the backdrops are authored below the 2160px Pro export
  size. Rule 44 added. Asset recreation is open (see OPEN-QUESTIONS).

## 2026-08-28 — Agent brief and session prompts
Commit `504a14b`.

**Added**
- `AGENT-BRIEF.md`, `docs/PROMPTS.md`, `docs/SESSION-PROTOCOL.md`,
  `docs/CURRICULUM.md`, `docs/COLOR-THEORY.md`, `docs/FIELD-RESEARCH.md`,
  `docs/OPERATIONS.md`, `docs/LEARNING-LOG.md`: the study program.

## 2026-08-27 — Block internal docs from the public site; real 404
Commit `c03c7a9`.

**Changed**
- `netlify.toml` 404s `/docs/*`, `/scripts/*`, the root markdown files.
  `404.html` added, dependency-free.

## 2026-08-27 — Rule 43: audit the palette under colour-vision deficiency
Commit `97cc89a`.

**Measured**
- Worst money-word contrast against ground under protan / deutan / tritan
  simulation: 5.37, clears AA. `scripts/cvd_audit.py` added.

## 2026-08-27 — Design law pass: 153 templates audited, house rules in code
Commit `c301fd4`.

**Added**
- `DESIGN-LAW.md`, rules 1–42. `houseType()` enforces rules 1–5 in code.
- `styles.css` rewritten as the warm "Liquid Glass" chrome with one accent
  (`#ff7a1a`) and a light theme; legacy `--orange` / `--surface2` tokens kept
  as aliases because `app.js` writes them into markup in ~250 places.
- The full audit tooling in `scripts/`.

**Changed**
- Accents deepened, never neon (rule 8). Five self-hosted house faces replace
  the Google Fonts stylesheet (rule 9). Colour maths moved to OKLab (rule 40),
  split-complementary at ±160° (rule 41).

## 2026-07-08 — Selling-points restyle, editable highlight colour, professional tier
Commit `b38484d`.

## 2026-07-08 — Designer Library: 105 premium templates, engine upgrades
Commit `66225f8`.

**Added**
- The `dl_<category>_<layout>_<palette>` designer library on the 12 curated
  palettes in `PAL`. Library grows to 243 templates.

## 2026-07-06 → 07-07 — First deploys
Commits `991f255`, `493fd0e`, `2509488`, `772e1a7`.

**Added**
- The app as a single repository: `index.html` + `app.js` + `styles.css`, the
  Cloudflare Worker backend, the Easy Mode flow, four canvas formats, the
  SCANS.AD hand-off. `SCANMAP_URL` moved GitHub Pages → Netlify →
  `https://scans.ad`.
- `phonegfx-studio.html`, the earlier single-file build, was committed
  alongside and has not been referenced since (OPEN-QUESTIONS 1).
