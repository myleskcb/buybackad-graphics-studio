# Cohesion audit, 2026-09-27

The owner: "audit of any overlapping code, contradictory code, or overall fuzzy
directions. So we can make sure our design is COHESIVE we need it clean no
mistakes so every generation has a self audit process and a check before
they're produced."

Three readings were made in one pass: DESIGN-LAW.md (65 rules), app.js (the
generation pipeline, ~11,400 lines) and scripts/ (150 files, every writer of
the showcase records). This is the record of what was found, what was fixed
the same day, and what is left, so nothing found is lost. DESIGN-LAW rule 66
is the rule that came out of it.

## What was fixed

**One measure.** `pgCheck()` (app.js) is the measure of a card; the legibility
audit and the critic now take their shared numbers from it (compared over 120
live cards before the switch: median difference 0.000 on both contrast
measures, number size identical). `PG_T` is the one threshold table.
`pgLum / pgCr / pgRgb` are the colour helpers to use from now on.

**One gate.** `pgGate()` runs before an Easy Mode download, a video and an
editor export: contrast failures are fixed by neutral shade in the direction
the failing lines need; anything else opens a modal that names the problem
(`#gate-overlay`) with "Go back and fix it" / "Download anyway". Every writer
script (neutral_panels, vary_grounds, darken_grounds, support_highlights)
passes its candidates through `gateRecords()` and writes only what `accept()`
keeps. `scripts/verify_showcase.mjs` is the pre-commit check (exit 1 on any
failure); today: 400 live cards, 0 failures.

**Contradictions removed from the code.**
- `assignStyle()` assigned every classic a duotone or wash grade on load; the
  ground table undid 128 of 129 a second later (async), so the strip showed
  duotones and `neon_sell` kept its grade. No grade is assigned now.
- The Easy Mode overlay laid the visitor's colour over the photograph
  ("Tint"). It is "Shade" now: black under light ink, paper under dark.
- Picking a theme replaced a photo-led card's photograph with a gradient
  (against rule 65). It keeps the photograph and recolours the copy.
- The classics' halo direction was keyed on the ink alone (rule 27's own
  recorded bug); it follows the ink's ground where the bake measured it.
- The watermark and the print order squashed story and wide exports square.
- `audit_showcase_content.mjs --write` cleared every `defect:"curated"` stamp
  (284 cards would have come back); a curation stamp is now kept.
- Four scripts and the app each had their own "live card" test; one now
  (`scIsLive`, `live()`).
- `vary_grounds` counted a wall cut-out as the hero (34 cards); walls are
  texture. `normaliseBackdrop` clamped pixel blurs as fractions.
- Two wrappers on `buildEzForm` fetched the device list twice per rebuild.
- The COLOR_THEMES family named "Duotone" is pastel gradients; renamed.
- The rulebook: 19 rules that a later rule replaced now say so in place;
  rule 66 lists the precedence.

## What was found and is left (with the numbers)

**app.js, duplicated helpers.** 11 luminance helpers (two sRGB knees, 0.03928
and 0.04045; two not gamma-corrected), 8 contrast-ratio formulas, 14 hex/rgba
parsers, 5 saturation measures, colour mixing in four spaces (sRGB walk,
OKLCH, HSL, linear mix), 21 "plate under a line" finders with different
tolerances (±6, ±10, ±12, ±20px; top edge vs centre vs 75% cover; area caps
0.5H, 0.6, 0.9H, 0.94W), four cover-fit copies, six blur implementations in
three unit systems, four text-width estimates. Light/dark cutoffs of 0.4,
0.42, 0.45 and 0.55 in different passes. The classics' passes (`inkVsWash`,
`gradInkContrast`, `localGroundContrast`, `applyMeasuredContrast`) each claim
to be the "last word". Consolidating these means touching the classics'
baked tables, so it waits for the classics' re-bake; new code uses the `pg*`
helpers.

**app.js, render paths.** Ten paths build a card (thumb, fallback, editor,
Easy preview, Easy export, editor snapshot, video, landing, CSS previews,
editor uploads). Known divergences: the Easy preview shows a greyscale
placeholder until a background is picked and the export can ship the fallback
gradient (`nobg-continue`); the editor path does not refit retyped text or
re-run alignPass; the editor drops the synthesised Badges line; thumbnails
draw no pattern or overlay; the user's own photo gets no scrim (the gate now
shades it when a line fails); designer templates get a double vignette with
a built-in background; the video's beat amplitudes are not re-checked against
the guides. `ez.fx` (blur, overlay, pattern) is global across templates.

**Classics vs the later rules.** Every non-solid hex rect is drawn at 45%
alpha (rule 21) on the classics, which rule 64 calls a haze on a photograph;
three dark-ink classics stand on a 0.86 paper scrim (`gold_estate`,
`silver_ster`, `cars_plate`); `completeTemplate` still builds the full-bleed
phone bar that `highlightBudget` calls wrong; nine designer layouts author
the number under 72px and rely on `number-fix.json`; the size slider goes to
50% with no floor; `fitInsideGuides` can scale the number under 72px after
step 4b set it. The gate catches the results at export; the fix is the
classics' re-bake with `naturalize_classics --prefer dark` and the number
block, then `verify`.

**Scripts.** Writers with no check before writing: `import_lab_export`,
`apply_copy_rules`, `fix_cta_straddle`, `restage_glasscards`,
`supply_backgrounds` (which also writes a tinted `tone` scrim, against rule
56), `refresh_showcase` (which reads git HEAD and deletes every `defect`).
Superseded scripts still present: `refresh_palettes.duoFor`, `audit_cards`,
`audit_set`, `legibility_audit` (classics only), `converge_contrast.sh`,
`score_themes`, the phone diagnostics, `theme_lab`, `bake_orientation`,
`decollide_text`, `replace_cutouts`, `tune_grade`. The index field `blur` was
stale on 119 rows (`verify --write` now stamps it). `converge_themes` stores
`onPlate:false` unconditionally.

**Order dependencies** (the pipeline in OPEN-ITEMS §L is the answer):
refresh_showcase before everything (it reads HEAD); import_lab_export before
naturalize (it restores `tone`); naturalize, then darken, never
supply_backgrounds after; number_block before restage and clear_number;
support_highlights before neutral_panels; audit_showcase_overlap before
content; curate last, and content never clears it now.

**The rulebook's fuzzy words**, kept as findings: "hero size" (rule 2),
"large offset" (4), "dim" (12), "pale, quiet, defocused" (13), "one inset"
(17), "a ring" (27), "a few percent" (33), "chroma capped well below" (41),
"its contrast target" (43), "the web address to its minimum" (53), "a touch
of contrast" and "most of the photograph" (56), "overlap a little" (61),
"pale glow" (64), "low strength" (65). Where a number exists in code it is in
`PG_T`; where none exists, the rule is a direction, not a check.
