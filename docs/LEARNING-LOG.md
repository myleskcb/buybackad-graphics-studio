# Learning log

Append-only. Newest at the bottom. Read the last three entries at session start.

---

## 2026-08-28 — Program setup (Hermes)

Studied:
  Read DESIGN-LAW.md in full (42 rules, 680 lines) plus the app structure, to
  find where a curriculum should attach without repeating settled work.

Measured:
  - app.js 7,724 lines / ~560KB; index.html 955; styles.css 1,166
  - 243 templates in the library; 153 designer templates audited by the
    existing DESIGN-LAW work
  - Live site verified 200 at buybackad-graphics-studio.netlify.app
  - studio.scans.ad: record present on Netlify NS, absent from public DNS.
    Root cause: registrar delegation to Namecheap, Netlify zone not
    authoritative. Documented in OPERATIONS.md, needs registrar access.
  - reselling.us/GFX returns 200 but serves RU CRM v1, a different app.

Changed:
  - Committed and pushed 5,080 lines of uncommitted design-law work that had
    been sitting unbacked since the July 8 commit (c301fd4).
  - Added docs/: README, SESSION-PROTOCOL, CURRICULUM, COLOR-THEORY,
    FIELD-RESEARCH, OPERATIONS, and this log.

Rejected:
  - Teaching beginner colour theory. The project is already past it: OKLab
    colour maths, split-complementary accent derivation at ±160°, glyph-masked
    contrast, discord-band hue rules. The curriculum was rewritten to target
    the actual gaps (semantic colour, saliency ordering, CVD simulation,
    reflow regression) instead.
  - Changing DNS at the registrar. It moves a live product's records and is a
    human decision; documented both fix options instead.

RESUME HERE (superseded by the entry below):
  Module 3, gap 3 in COLOR-THEORY.md — simulate deuteranopia and protanopia
  over the 243-template library and re-run the existing contrast audit under
  each simulation. Any template that passes normally and fails simulated is a
  hidden defect. Start by locating the existing contrast audit entry point in
  app.js (search `HOUSE DESIGN LAW` and the COLOUR_FIX table), reuse its
  glyph-masking rather than writing a new sampler — bounding-box sampling is a
  known false-positive trap (bandKnockout: 1.21:1 bbox vs 12.06:1 masked).


---

## 2026-08-28 — Module 3, gap 3: colour-vision deficiency (Hermes)

Studied:
  Colour-vision deficiency as a legibility and commercial concern. Brettel/
  Vienot dichromacy simulation, and why it must run on LINEAR RGB via LMS for
  the same reason DESIGN-LAW rule 40 puts colour maths in a perceptual space.

Measured:
  All ten theme decks, accent against its own gradient start, normal vision vs
  protan/deutan/tritan simulation, WCAG contrast.

  - **Crimson x Mint: 5.26 normal -> 3.84 deuteranopia.** A red ground with a
    green accent, the one pairing deuteranopia collapses. It sits 151 degrees
    apart, squarely inside the band rule 41 approves, so it reads as a
    confident complementary choice and is the worst performer in the set for
    ~5% of men.
  - **Royal x Tangerine: 4.58 -> 4.15 protanopia.** Milder, but it started with
    no margin above 4.5.
  - Teal x Coral fails at 2.75 under NORMAL vision. Pre-existing, unrelated to
    CVD, found incidentally by the sweep. Not fixed — flagged.

  The headline finding: **hue harmony and CVD safety are independent.**
  Satisfying rule 41 says nothing about whether a pairing survives.

Changed:
  - DESIGN-LAW.md rule 43 appended (APPENDED, not spliced — rule 42).
  - scripts/cvd_audit.py — runnable, --json flag, exits 1 on failure so it can
    gate a deploy later.
  - docs/ study program added (README, SESSION-PROTOCOL, CURRICULUM,
    COLOR-THEORY, FIELD-RESEARCH, OPERATIONS, this log).

Rejected:
  - Repainting Crimson x Mint on the spot. Rule 14 is explicit that colour
    theory selects from the vocabulary the real references use, and no field
    research has been done yet to say what replaces mint. Measuring the defect
    and naming it is the finished unit of work; guessing a replacement is not.
  - Guessing template ground colours to audit COLOUR_FIX pairs. First attempt
    used invented hexes and produced numbers that contradicted the file's own
    measurements. Thrown away; the theme decks are authored flat colours and
    are the honest thing to measure without a canvas.
  - Changing scans.ad DNS at the registrar. See OPERATIONS.md.

RESUME HERE:
  Decide the fix for Crimson x Mint and Royal x Tangerine. Do the
  FIELD-RESEARCH.md sampling FIRST so the replacement hue comes from observed
  competitor ads rather than from taste — that is what rule 14 requires. Then
  extend cvd_audit.py from the ten theme decks to the 243 rendered templates,
  reusing the existing glyph-masked sampler in app.js rather than writing a new
  one.


---

## 2026-08-28 (later) — Asset recreation: the background library is undersized

Studied:
  The Designer Library's 153 background photographs in assets/bg/, audited
  against assets/bg/MANIFEST.md and against what the export pipeline actually
  demands at each plan cap.

Measured:
  - 153/153 files present, 0 missing, 0 orphaned. The manifest and the folder
    agree perfectly on WHICH files exist.
  - **All 153 are 1200x1200. The manifest specifies 2160x2160.** Every file in
    the library is off-spec, and has been since it was built.
  - Export demand, because the plan cap applies to the SHORT side while a square
    background must cover the LONG side:
      Square 1:1   at Pro 2160 -> needs 2160  (1.80x upscale)
      Flyer 8.5x11 at Pro 2160 -> needs 2796  (2.33x)
      Story 9:16   at Pro 2160 -> needs 3840  (3.20x)
      Wide 16:9    at Pro 2160 -> needs 3840  (3.20x)
  - Not only a Pro problem: `exportSize` defaults to 1440 short side, so a Story
    at the DEFAULT already needs 2560. At the Free 1080 cap a Story needs 1920.
    Every non-square format upscales for every user on every plan.
  - Visual A/B on the most detailed image in the set
    (dl_cars_ticketStub_mono, water beading on a car panel), native vs 3.2x at
    matched display size: **visibly softer, not broken.** Droplet edges lose
    crispness, speculars smear slightly. A customer would not file a bug; a
    designer comparing exports against a competitor would see it.

Changed:
  - DESIGN-LAW.md rule 44 (appended, per rule 42).
  - scripts/asset_audit.py — checks presence, orphans, dimensions and
    per-tier sufficiency; --tier free|pro, --json; exits non-zero on failure.
    Currently exits 1 on both tiers.

Rejected:
  - **A spectral high-frequency-energy metric for sharpness.** It separated a
    native image from a 2x-upscaled copy of ITSELF by only 0.42 vs 0.40 — far
    too weak to gate anything. Do not re-derive it and trust it. The A/B render
    at matched display size is the honest test, and asset_audit.py deliberately
    does not score sharpness.
  - **A first sharpness check that sampled a black region** of a phones
    background and concluded "no visible artifacts". It was measuring an area
    with no detail in it. Find the highest-variance tile before judging.
  - **Regenerating the 153 images in this session.** That is a generation job
    needing the ORCHARD photo engine or an image model, it costs real compute,
    and it changes 32MB of committed product assets. Measuring the defect and
    making it enforceable is the finished unit of work.

RESUME HERE:
  Decide the regeneration target before generating anything. 2160 satisfies the
  manifest but still upscales 1.78x on Story/Wide; 3840 satisfies every format
  at the Pro cap with no upscale, at roughly 3.2x the file size (32MB -> ~100MB
  committed, which is a real repo-weight decision the owner should make).
  Recommended: regenerate at 3840 for the ~20 templates whose backgrounds carry
  visible detail (the cars/silver/strips sets score highest on local variance),
  and leave the heavily-defocused ones at 2160 where the upscale is invisible.
  Re-run `python3 scripts/asset_audit.py` after; it should exit 0 for the tier
  being targeted.


---

## 2026-09-04 — Theme grammar transplant into the production studio

Studied:
  The useful logic behind four campaign looks from the GFX Grammar prototype,
  then mapped it onto the production editor's existing `COLOR_THEMES` and
  semantic layer roles. The object of study was role hierarchy and campaign
  intent, not copying template geometry or rebuilding the product UI.

Measured:
  - Four of four new theme records pass normal, protan, deutan, and tritan
    checks against both gradient stops.
  - Worst reading-ink contrast: Hot Sale 10.94, Electric Trust 16.57, Fresh
    Cash 8.67, Night Neon 16.47.
  - Worst action-accent contrast: 3.93, 5.27, 4.37, 7.35 respectively.
  - Worst support-role contrast: 4.77, 7.88, 6.96, 11.51 respectively.
  - Accent/ink separation: 2.39, 2.77, 1.88, 2.06 respectively; floor 1.7.
  - The rendered Easy Studio exposes all 21 palettes, exactly four are tagged
    GFX Grammar, and all four can be selected through the existing control.

Changed:
  - Added Hot Sale, Electric Trust, Fresh Cash, and Night Neon as campaign
    intents inside `COLOR_THEMES`.
  - Split small trust/qualification copy into a support role while preserving
    the existing plate-ownership rule.
  - Added active/pressed state and intent labels to the current theme strip.
  - Added `scripts/audit_theme_grammar.mjs` for colour-role checks and
    `scripts/preview_theme_grammar.mjs` for rendered UI reachability.
  - Appended DESIGN-LAW rule 51: a theme is a set of jobs, not a bag of
    attractive swatches.

Rejected:
  - Replacing the existing studio with the standalone prototype. The useful
    unit was the theme logic, so it was transplanted into the mature codebase.
  - Copying Canva layouts, uncontrolled neon, and starburst treatments. They
    conflict with the production design law and add irrelevant visual noise.
  - Recolouring text that sits on its own plate. The theme does not own that
    ground and therefore cannot guarantee the contrast.

RESUME HERE:
  Give the older 17 theme records the same explicit intent/support schema, then
  reconcile the pre-existing failures in `scripts/theme_law.mjs` one palette
  at a time. Do not mass-retune them from the audit table alone; render each
  candidate in representative phone, gold, car, and sports templates first.

---

## 2026-09-26 — The study session into the templates, and the photographs back

Studied:
  The study session "Teaching the Engine Design" (iphoneslainv, 2026-09-24..26)
  and the video maker built beside it: design rules as numbers (hierarchy
  1.3x, 6% margins, 28px at 1200, contrast letter by letter, the 160px
  thumbnail test, two type families), the copy rules (no dollar figures, no
  dashes, no invented reviews or years, no competitor names, no promise about
  how long an offer lasts) and the layering ladder (ground, atmosphere as light
  and shade only, graphic, device, copy). The owner: the video maker had moved
  far ahead of the image templates, the 50 offer cards lacked "a big/medium
  phone number", and then, of the old colour work, "not these ugly hideous
  overlaid colors and duotone background images."

Measured:
  - The number: showcase median 58px on the 1080 canvas (digits ~6px tall in a
    160px tile), classics median 64px, 149 classics under 72px.
  - The copy: on 971 showcase cards, "SINCE 2015" on 145, a rating on 144, a
    price figure on 83, invented hours on 46, an em dash on 61, 43 signed
    testimonials; the classics carried the same set at the source.
  - The colour: 766 of 971 showcase photographs painted as duotones, 483 tinted
    veils; 129 of 243 classics colour-graded; 12 of 21 Easy Mode themes failing
    theme_law.mjs.
  - Layout, on pixels: the street price tags hid 37-53% of the category word
    behind the cash; the ribbons 54-63% of their item line behind the product;
    59 classic lines ran past their own plate.
  - The audits, re-measured: two measures held readable cards back. The line
    gate averaged the letters' soft shadow in as ink (a #101014 label on a
    cyan plate at 6:1 scored 2.85); the critic's per-letter check read each
    number against a ring that fell off its plate (471 of 971 "failed" at
    about 2.5). Both now judge the core of the strokes. After the fixes:
    critical lines under 3:1 went 188 -> 9, the critic holds back 243 for
    real reasons (hierarchy 128, three families 83, headline too small in a
    tile 61, number under 72px 26, number off its plate 9), and 684 of 971
    cards are live (780 before, on a looser bar).

Changed:
  - The number rebuilt on 945 showcase cards and 165 classics (median 84px and
    108px), one of the card's two families, on one axis with its plate.
  - Honest copy on 340 cards (943 lines) and in the classics' source.
  - The design-school critic: its rejects hold a card back as a defect, its
    warnings keep a card off the hero wall.
  - Photographs in their own colour under a neutral shade solved per line of
    copy (rule 56): showcase 0 duotones, 0 tinted veils; classics 128 of 129 via
    assets/ground-fix.json; big pastel panels neutral at the same luminance.
  - The 12 failing themes re-solved in OKLCH, every hue kept: 21 of 21 pass.
  - Products moved off the words on 8 street layouts; four plates sized to
    their words; the spec-check number kept on its bar.
  - Nothing on the number: 38 cards had a rule, cue icon or frame border
    across it after it moved (scripts/clear_number.mjs removes decoration
    there); the critic now rejects a number more than 8% off its plate.
  - 127 weak headline, number or CTA lines repaired in lightness (hue kept)
    or neutral ink (scripts/repair_showcase_ink.mjs).
  - The iPhones LA link now sends pictures that show the phone number (owner:
    "Yes, allow the number").
  - The site's pages: the video maker, what is checked, the data kept.

Rejected:
  - Editing motion/. It mirrors the phone ad engine's repo; its untrue copy is
    listed in docs/handoff-offer-cards-number.md for that repo.
  - Holding every line to its old contrast when the old ground was a crushed
    duotone: the shade then came out near-black. Each line clears 4.5:1 or
    keeps its old ground, whichever is further, so none is darker than it needs.
  - Flipping a coloured line's ink to make one shade work. Only neutral lines
    change side; a coloured one would lose its job.
  - Touching the 50 offer cards: they are in loganipad/iphoneslainv.

RESUME HERE:
  Draft-deploy this branch (netlify deploy, then look at the preview on a
  phone) before --prod. Then the iPhones LA session: run the paste-ready
  prompt in docs/handoff-offer-cards-number.md, and check its server accepts
  pictures that carry the number.
