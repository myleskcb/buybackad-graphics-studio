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

---

## 2026-09-26 — Video ad field research

Studied:
  The owner asked to "expand the video ad logic", then redirected: study
  competitors, good "we buy" video ads and good commercials, and find what grabs
  attention, keeps it and converts in short-form marketplace ads. Four parallel
  research passes: platform creative guidance (Meta, TikTok, Google), 23 "we
  buy" brands and formats, commercials and direct-response craft (System1,
  Ehrenberg-Bass, Nielsen, IPA, DRTV, subtitle standards, flash regulation), and
  marketplace mechanics (surfaces, formats, policy, browser encoding).
  Output: docs/VIDEO-AD-RESEARCH.md.

Measured:
  - There is no video code to expand: app.js, index.html and
    phonegfx-studio.html contain no video / MediaRecorder / captureStream / WebM
    reference. The research file is the spec to build it from.
  - 48 of 243 templates default to "up to" pricing (gold 12, cars 11, phones 9,
    coins 4, sports 4, strips 3, pokemon 3, silver 2), from the category decks.
    4 phone templates advertise iCloud-locked phones, 2 say "blacklisted".
    0 carry health or financial-status phrasing. scripts/claims_audit.mjs.
  - In the 16 national "we buy" ads with a usable description, only 2 show a
    dollar figure, and both are "up to" store credit. 11 of 16 make a speed
    claim; 14 of 16 send the viewer to a URL or app rather than a phone.

Changed:
  - docs/VIDEO-AD-RESEARCH.md (new), docs/README.md map entry.
  - scripts/claims_audit.mjs (new) — counts flagged default copy in the loaded
    library; exits non-zero on a page error. Takes CHROME and GFX_BASE.

Rejected:
  - Treating any figure as verified. The container's egress proxy blocked the
    page fetcher on every help-centre and research domain, and the shared
    search budget (200) ran out, so every figure is from a search extract
    except GitHub-hosted sources. The file labels each one.
  - TikTok's effect sizes (+152% / +280% / +312%) as magnitudes. They are
    observational, self-published comparisons of top ads. Direction only.
  - "More colours and effects" as decoration. No evidence found that glitch,
    particles, flares or money rain help; flashing is prohibited by Meta,
    Google, TikTok, WCAG 2.3.1 and the UK ASA. Colour as hierarchy and
    information-carrying motion are what the evidence supports.
  - Repainting the "up to" copy. That is an owner decision under rule 24; this
    session names the defect and makes it countable.
  - Adding rules V1–V7 to DESIGN-LAW. There is no video output to measure them
    against yet.

RESUME HERE:
  Before building anything for Marketplace, read Facebook's Marketplace commerce
  policy in full by hand — its help text (search excerpt only) says "in search
  of" posts and services are not allowed, which a "we buy" post arguably is.
  Then build the engine from section 8 of VIDEO-AD-RESEARCH.md, starting with
  the rule that frame 0 is the static template and a frame-as-pure-function-of-t
  renderer encoded through WebCodecs.


---

## 2026-09-27 — Reunifying the branches

Studied:
  Why three sessions on 2026-09-26 produced work the owner called "super old
  design language": each started from `main`, which had not moved since
  2026-08-28.

Measured:
  - 14 remote branches. `claude/finished-copy-site-manf7r` (2026-09-26 22:19)
    already contained phone-ad-maker, live-2026-09-22, the three project
    threads, the iPhones LA link, the 2K asset library and the 09-16 backup.
  - Not contained: vibrant-hawking (26 commits, merges clean), vibrant-lovelace
    (1 commit, stale base, 2 small conflicts), busy-allen (1 commit, stale
    base, conflicts in app.js/index.html/headers and 25 modify/delete cut-outs
    the trunk had replaced with 2K WebP), fervent-pascal (2 commits, stale base).
  - The trunk after merging: 243 templates, landing, /motion and library.html
    load with 0 page errors and 0 failed requests.

Changed:
  - Merged vibrant-hawking and vibrant-lovelace into the trunk.
  - claude/fervent-pascal-w6mthe reset to the trunk (its two stale commits,
    bf45814 and ee650df, superseded; see OPEN-ITEMS §J for what survives).
  - OPEN-ITEMS §J: the verified port list. AGENT-BRIEF landmine 6: check that
    `main` is current before building.

Rejected:
  - Merging busy-allen or the old fervent-pascal: both would lay August code
    over September work (old default copy over the study session's honest
    copy, `.png` cut-out names the trunk no longer has, a landing the owner
    abandoned). Ported item by item instead.
  - A `-s ours` merge to mark them "merged": it would claim work was
    integrated when none of it was.

RESUME HERE:
  1. Owner decision: fast-forward `main` to this trunk so new sessions start
     from current code (main is an ancestor, so it is a fast-forward).
  2. The owner's reported card defects (overlaps; colour theory on the pale
     palettes), then OPEN-ITEMS §J items 5–9 (small, verified), then 1–2.

## 2026-09-27 (later) — One design language: collisions, guides, the Glass Card, the curated 400

Studied:
  The owner's four asks after the reunification: overlaps and legibility
  ("audit any overlapping elements, poor quality assets, or hard to read
  designs"), the guides ("make sure everything fits within the guides"), the
  Glass Card ("the asset should be on the inner card while a tile PNG of
  money … in BG"), and "of the 780 possible themes, take out at least half …
  so we have the 400 that showed the least mistakes". Plus the device art the
  owner uploaded (devices, ad-backs, iPad, Mac, Watch), and "main text doesn't
  seem to be centered".

Measured:
  - A bounding-box overlap audit could not see the faults (a box round italic
    type is mostly air; rule 50). scripts/audit_collisions.mjs renders each
    layer alone into an ink mask. Baseline: 285 of 684 live cards collided at
    6% of the smaller party's ink, and copy sat in the 6% margin on 293.
  - Each layout repeated ONE fault: the phone plate over the CTA line
    (scriptRetro, hudTech, ticketStub), the website under the plate (arcCrown,
    neonNight), the product under three step cards (47 stepsFlow), left-aligned
    copy outside its ticket or glass panel, a sticker disc on the item line.
  - My own first plate fix made 5 layouts collide that had been clean: a plate
    grown about its centre reaches the line below it. The audit caught it on
    the next run; growth is now limited to clear space.
  - Redundancy: 632 of 690 live cards sat in 91 (category, layout) groups of
    four or more, up to 17 recolours of one composition. Pixel similarity
    separated same-layout from different-layout pairs by 4.90 vs 5.24, too
    weak to decide anything, so redundancy is judged structurally.
  - Device art: the site's renders are 640px squares with the device at 400
    to 560px; the qs- copies had been capped at 400 and two were unusable
    (Mac mini 155x62, Watch 47x55).

Changed:
  - alignPass: 2c one axis for centred stacks; 4 plates grow into clear space
    only; 4b words stay on their plate (widen, slide in, then shrink, with a
    72% floor); 4c decoration yields (a sticker is removed, never moved);
    4d the product keeps clear of the copy; 5 fitInsideGuides moves the whole
    composition into the 6% margin. After: live collisions 269 -> 52, copy in
    the margin 293 -> 0.
  - Glass Card restaged (53 records): money-fall ground, card solid enough
    to read, product on the card between the headline and the selling points.
  - 12 cards read WE BUY IPHONES over an Apple Watch photograph with watch
    selling points: the headline was the slip, now WE BUY WATCHES.
  - Curation (scripts/curate_showcase.mjs): 65 disqualified (collisions,
    critic rejects, a critical line under 3:1); the rest ranked by the
    critic's warnings, contrast shortfalls and the measured overlaps; kept in
    proportion per category, round-robin across layouts so every design's
    best card comes before any design's second. 400 kept, 114 of 118
    designs, largest recolour group 17 -> 8, the owner's hero picks all kept.
    Thumbnails of the 400 re-rendered through the new engine.
  - 165 device cutouts imported under the owner's floors, 26 upgraded in place.
  - Device catalogue (118 models, 139 finishes) and variants: one card re-set
    for any device, the finish chosen to answer the palette. A finish's colour
    is measured where finishes DIFFER (the body), not over the whole cut-out:
    the first measure read the shared wallpaper, five MacBook Air finishes as
    one blue.
  - Regression caught by the critic: the "taller than its plate" rule shrank
    phone numbers on snug pills (76 -> 55px, 63 cards). Fixed to fire only on
    real overflow and never on the number.
  - Chrome: the public Look menu removed (it offered the abandoned ember look),
    the header fits 390 to 1440px, CSS_FALLBACK regenerated, ASSET_REV ported.

Rejected:
  - Moving a clashing sticker to the nearest clear spot: it landed as a bare
    disc mid-photograph with its curved label dark on dark. Removed instead.
  - Forcing a centred stack onto the card's centre: a column set beside a
    product would slide into it. The widest line's axis is used.
  - Restyling /motion here: it is synced from the phone ad engine's repo, and
    the next sync would undo it. Listed in OPEN-ITEMS §K.

RESUME HERE:
  1. Owner decision: fast-forward `main` to this trunk.
  2. OPEN-ITEMS §K.

## 2026-09-27 (evening) — Colour kept, everything moves, fonts you can see

Studied:
  The owner's notes on the curated library ("make sure it still keeps good
  colors. a lot of these have a white haze overlay", "doesn't look great"),
  then "make everything animateable", "make sure the type faces render as
  previews of their name typed out", category variants ("sell your macbook
  air pro neo … with multiple") and "use supportive highlights on some themes
  if it looks good".

Measured:
  - 238 of the 400 kept cards shaded their photograph with white paper at
    0.3 to 0.6 (rule 56 allowed paper under dark ink). On a photograph it is a
    milky veil.
  - First dark pass: 31 cards held back by coloured dark copy. Rendered, two
    failures the solver could not see: a light line left on a pale
    see-through band, and dark copy on a see-through plate that turned
    mid-grey once the ground under it darkened (about 2:1).
  - The studio had no animation at all; only /motion (phones, its own looks).
  - Font menus: <option> font-family is honoured only by some desktop Chrome
    builds, so on a Mac or a phone every name showed in the system font.
  - The support colour was on 213 of 400 cards, always on frames, ribbons or
    plates, never on the supporting copy rule 51 assigns it to.

Changed:
  - scripts/darken_grounds.mjs (rule 62): 224 of 226 hazed cards re-grounded
    dark (128 graded, 96 flat, median 0.56), 826 lines re-inked light,
    coloured lines keep their hue with the lightness turned over, 218 bands
    under the copy follow what the eye saw.
  - Video export on every design (the living-still engine, ported from the
    superseded bf45814): Easy Mode "Download as video", the editor's "Video".
  - Font picker: a button in the current face, a list with every name in its
    own face, lazy-loaded, searchable.
  - Whole-line variants: All iPhones / iPads / MacBooks / Macs / Watches /
    AirPods / Everything Apple, the models side by side on the card.

Rejected:
  - Leaving coloured-ink cards in their haze (the first pass): the owner's
    complaint was the haze.
  - Re-inking coloured copy white: the palette would be gone.
  - Sizing a line-up to the single product it replaced: three MacBooks as
    stamps.

## 2026-09-27 (night) — No hue over the photograph

Studied:
  The owner: "these colored hazes don't look great. Unify with the new design
  language in the 'template and content audit update' thread." That thread's
  language is DESIGN-LAW rule 56 (rung 1 is light and shade, never a colour).
  Its one new commit since the reunification (the offer cards' number) is in
  another repo's tool and does not touch the showcase.

Measured:
  - Every live card's shade was already neutral (#0b0b0d, #000, paper) and
    every grade natural: the hazes were drawn ON the photograph, not in it.
  - 182 cards laid a hue over the picture: see-through tinted rects (step
    cards at a median 0.52, tiles, item panels, chips) and solid pastel or
    deep-tinted panels holding the copy (lavender, navy, olive, cherry, beige).
  - 423 wide pale or tinted glows round plates, panels and products, set for
    the old white shade; on the dark grounds each plate sat in a haze.
  - 947 light lines with light halos: the dark-ground pass re-inked them and
    left their halos, so they glowed (rule 27 says the halo takes the tone the
    ground is not).
  - While testing sibling panels: every step digit on all 44 live Steps Flow
    cards sat 23 to 60px right of its box. alignPass 4c tested a mark made of
    type against its own box, so it always "collided" with itself.

Changed:
  - scripts/neutral_panels.mjs (rule 64): panels holding copy become smoke
    under light copy, paper (0.9 and more) under dark, a same-luminance grey
    when mixed; siblings share one treatment; glows become shade; halos take
    the ground's opposite tone. Every line judged on its own pixels before and
    after. 366 cards; no line lost contrast; a second run changes nothing.
  - darken_grounds.mjs and restage_glasscards.mjs can no longer produce a
    tinted band or card.
  - alignPass 4c: a mark is not tested against itself. 44 cards' digits back
    in their boxes.

Rejected:
  - Keeping each panel's luminance in grey everywhere: mid-grey panels read as
    dull as the tints did. Smoke or paper wherever all the copy on the panel
    points one way; grey only where it does not.
  - Treating Headline 1 to 3 as a sibling set for ink: it would have turned
    the yellow money word pale.
  - A light halo behind dark copy on a coloured plate: rule 27 says the plate
    is the separation; a glow there fuzzes the number.

## 2026-09-27 (late night) — Every kind of ground

Studied:
  The owner: "backgrounds that are solid colors, sunburst all sorts of styles
  even patterns overlays so we have all varieties some images some blurred
  images … or we can always use a photo of the Apple Store background".

Measured:
  - 400 live cards: 373 photographs (84 "blurred"), 27 money-fall, 0 drawn.
    grounds.js (115 ticked tiles, 33 styles) was never loaded by the studio,
    and /scripts/* is 404'd at Netlify's edge, so it could not have been.
  - The 84 blurred cards were flat smears. Showcase records store blur in
    pixels on the 1080 card, blurredEl() read it as a fraction of the width:
    4 meant four widths. The lab rendered through the same function, so the
    smear is what everyone saw and approved.
  - Once really blurred, 55 of the 84 fell under 4.5:1: their shade had been
    solved against the smear. The solver's "never worse than the old ground"
    let them stay worse, because the old ground was the smear.

Changed:
  - grounds.js moved to the site root, loaded by index.html; it paints a
    ground or a photo-with-pattern as a background source, so every render
    path draws it. New kinds: solid, sunburst, accent sunburst, light from
    above; neutral overlays: dots, halftone, grid, stripes, rays, scanlines,
    grain.
  - blurredEl reads pixels as pixels. Blurred cards set at 14 to 24px and
    re-solved strictly: 0 under 3:1, median worst line 6.13.
  - scripts/vary_grounds.mjs: 100 cards re-grounded, all on their own
    palette, each gated line by line on its pixels.
  - Easy Mode: "More grounds" and "Pattern on top".

Rejected:
  - Drawn grounds under photo-led cards: the owner called headline-on-flat
    "lacking imagery"; only cards with a hero cut-out moved.
  - Keeping the smear and calling it blur: the owner asked for blurred images.
  - A hue in a pattern overlay (rule 56).

## 2026-09-27 (small hours) — One measure, one gate

Studied:
  The owner: "audit of any overlapping code, contradictory code, or overall
  fuzzy directions … every generation has a self audit process and a check
  before they're produced." Three readings: the rulebook, the pipeline in
  app.js, the writer scripts.

Measured:
  - app.js: 11 luminance helpers (two sRGB knees), 8 contrast formulas, 14
    hex parsers, 21 plate finders with different tolerances; scripts: 30 more
    luminance helpers, four live-card predicates, ten contrast measures
    against three thresholds. The rulebook: 37 rule pairs pointing opposite
    ways, 19 of them a later rule replacing an earlier one silently.
  - Nothing measured a card at export. The classics loaded with duotone
    grades the ground table undid a second later. The Easy overlay laid the
    visitor's colour over the photograph. A theme replaced a photo-led
    card's photograph. The content audit's --write would have un-retired
    all 284 curated cards. The watermark squashed story exports square.
  - The shared measure (pgCheck) reproduces the two audits it replaces:
    median difference 0.000 on both contrast measures over 120 live cards.
  - The first gate fix shaded the wrong way on a card whose dark copy sat on
    plates: majority ink is not the question; the failing lines' own ground is.

Changed:
  - pgCheck / PG_T / pgGate in app.js; __sc.check, accept, gateRecords and
    live() in the harness; verify_showcase.mjs; the writers gated; the
    legibility audit and the critic on the one measure.
  - The contradictions above fixed in code; rule 66 and 19 "Superseded"
    pointers in DESIGN-LAW; the pipeline in OPEN-ITEMS §L; the findings in
    docs/COHESION-AUDIT.md.

Rejected:
  - Deleting the duplicate helpers in the classics' passes now: their tables
    were baked with them; consolidation belongs to the classics' re-bake.
  - A gate that blocks: an ad is never held hostage; it is measured, shaded
    when shade fixes it, and otherwise named, with "Download anyway".

## 2026-09-28 — The classics under the gate

Studied:
  The owner: "fix and push all redesigns, audited before pushing." The
  open items of the cohesion audit, taken in order, each measured by the
  gate before the push.

Measured:
  - Baseline: 38 of 243 classics failed the gate (22 legib, 15 numbers
    under 72px, 4 off their plate, 2 numInk, 1 thumb). The 15 small numbers
    were the guides fit: fitInsideGuides scaled a lowerThird card by 0.92
    and took its 72px number to 66.
  - The 45% wash sat on 14 classics, 66 rects (item chips, rules, hazard
    stripes); no live showcase card has one.
  - naturalize_classics selected only graded templates; with no grade
    assigned it wrote an empty table and every classic lost its shade.
  - The critic's plate finder took a claim strip above the number for its
    plate: three street price tags at 98% "off plate".
  - After the re-bake: 16 of 243 fail; they are held back by the gate table.
    The first floor grew the plate with the number and pushed a band's
    number 412px off; grown about its own centre, a pill grows to hold it
    and a band lets it slide.

Changed:
  - pgNumberFloor after alignPass; fitToDoc floors the number at 72; one
    plate finder (pgPlateUnder) for the gate and the floor; solid hex plates,
    see-through rules; the editor hand-off refits, adds Badges, re-aligns.
  - verify --classics (--write -> assets/classics-gate.json, read by
    loadClassicsGate); bake_contrast takes CHROME and FABRIC_JS;
    naturalize_classics covers every image-backed classic and keeps a
    skipped template's previous row.
  - 20 superseded scripts removed; FAQ copy for shade, patterns and neutral
    panels; the stat reads 399.

Rejected:
  - Scaling the plate with the number: a full-width band is not a pill.
  - Shipping the 16 that still fail: rule 60's "not offered" now applies to
    the strip as it does to the library.

## 2026-09-28 (later) — The shade stands where the copy stands

Owner: "just make sure the backgrounds are visible if possible."

Learned:
  - How much of a photograph shows through is a number: the shaded ground's
    mean luminance against the bare photograph's (scratch visibility.mjs).
    Baseline: median 26% on the library's photo cards (197 of 273 under a
    flat veil at 0.55), 49% on the classics.
  - Lightening a whole-card veil barely moves it. Solving for the core of
    the strokes instead of the worst tenth, then 3.5:1 for supporting copy,
    took the library from 26% to 29% and the classics from 49% to 50%: the
    veil must be as strong everywhere as the copy needs it anywhere, and one
    line at the bottom holds the whole picture dark.
  - The shade that shows the picture is the one that stands only where the
    copy stands: full strength across the bands of the height that hold a
    line on the photograph, feathered 6% of the height, nothing between
    them. At the same strength it holds every line the flat veil held (the
    line's box is inside its band), so the solver tries it first and falls
    back to the graded and the even veil only when the bands cannot hold
    every line.
  - The gate's plate finder returns a plate the line merely overlaps (a
    headline whose last line touches the panel below it); for "is this line
    on a plate" the plate has to hold the line's centre, or the headline is
    left out of the bands and the studio's gate opens its modal instead of
    shading.
  - After: library median 62% (p25 50%), 4 cards under 30% (from 48), shade median 0.44 (from 0.55); classics median 72%, 1 under 30%, shade median 0.27 (from 0.48). 264 of 273 photo cards re-solved (5 held back: a line would have lost contrast), 399 of 399 pass the gate; 230 of 235 classics bands, 227 of 243 pass, the same 16 held back.

Changed:
  - scrimRect draws `bands:a-b,c-d` (scrimBands parses, SCRIM_FEATHER 0.06);
    normaliseBackdrop keeps a bands mode; naturalGround solves 'bands' first
    (darken_grounds --lighten, naturalize_classics); the studio's own shade
    is bands from the scene after the layout (pgShadeBands, pgShadeFit,
    ezShadeRect, advShade); ASSET_REV 20260928a.
  - DESIGN-LAW rule 66 (the shade stands where the copy stands), rule 62
    pointer; AGENT-BRIEF; OPEN-ITEMS §L.

Rejected:
  - A floor of shade between the bands (a faint veil "for cohesion"): it is
    the haze the owner asked to lift, and the gate does not need it.
  - Shading by the copy's boxes rather than by bands: a patchwork of
    rectangles reads as plates that are not there; a horizontal band reads
    as light falling on the picture.

## 2026-09-29 — iOS emoji or none; copy under a shape

Owner: "EMOJIS ONLY IOS STYLE REMOVE AND DELETE ALL !", "AND DON'T OVER USE
ONLY FOR SOME", and of Rush Hour in Easy Mode: "this sucks sorry".

Learned:
  - A drawn emoji set, however polished, is not what the owner means by
    emoji: the iPhone's own. Apple's artwork cannot ship as files; the
    device's emoji font can be used, and it is Apple's only on Apple devices.
  - Placed on every other card (239 of 399), emoji read as overuse. Three in
    ten eligible, one each, reads as an accent.
  - fitInsideGuides rebuilt edge-attached rects from their bounding box; a
    rotated band's box is not its size. Two bands doubled and covered copy.
  - The gate could not see copy under a shape, nor an invisible line outside
    the three critical roles. Once it could, it found seven broken classics
    that had been offered all along.
  - A status dot under the first letters of a chip reads as a typo; a small
    mark on words moves in front of them.
  - 28 library cards had emoji typed into the design, drawn in Google's style
    on the server's thumbnails: the iOS-only rule covers them too.
  - Re-rendering every thumbnail shows every one changed: the grain layer is
    random per render. Only thumbnails that changed materially (over 400
    pixels by more than 24 levels) are worth committing; 567 of the 570 that
    did were retired cards nobody sees.

Changed:
  - The Fluent set and its thumbnails reverted; ASSET_REV 20260929b.
  - pgEmojiPass (device-font emoji, Apple devices only, 3 in 10 cards, one
    each), pgEmojiCheck in the gate, Easy Mode's Emoji row and the editor's
    picker shown on Apple devices only; ?emoji=ios forces the pass for tests.
  - fitInsideGuides keeps a rotated band's thickness; stackBulletRuns leaves a
    line on a band or a pill; pgCoverCheck ('ghost' any role, 'covered');
    pgUncover after the layout.
  - DESIGN-LAW rules 67 and 68.

Rejected:
  - Apple emoji images from a package (Apple's artwork, not licensed).
  - Non-Apple device emoji as a fallback (the owner: iOS style only).

## 2026-09-30 — Looking at every card

Owner: "looks better now keep updating and auditing the bad ones".

Learned:
  - The gate passes what it measures. Rendering all 226 offered classics
    into labelled contact sheets and looking at each found six kinds of
    defect it could not see: lines straddling plate edges, lines touching,
    stacked lists under plates, dark glows on dark type, hairline serifs on
    busy photographs, plates grown past the guides or over other plates.
  - Almost all of them were on the designer layouts, and most came from one
    pass running where it did not belong (the list stacker) or one stage
    growing a plate without asking what else was there (step 4's padding).
  - A text's box and fabric's line heights disagree by the last line's
    leading; the gate and the resolver must use the same line boxes or one
    sees a straddle the other does not.
  - Luminance contrast cannot see camouflage: gold hairlines on a gold photo
    measured like a readable headline.

Changed:
  - pgUncover now settles straddle, collide (touching counts), covered, marks
    and copy on a product; clamps plates to the guides; trims overlapping
    word-carrying plates. pgStraddleCheck in the gate ('straddle', 'collide'),
    per-line bodies everywhere (pgLineBodies, pgTextLineBoxes fitted to the
    box). stackBulletRuns skips dl_ layouts. pgDarkGlow. pgHairlineHeads.
  - DESIGN-LAW rule 68 widened, rule 69.

Left:
  - Supporting lines of 19 to 24px (a tenth of all lines) read small on a
    phone; raising the floor would redesign the densest layouts.
  - Item lines over busy photographs are thin and low contrast on some gold
    cards; the ground solver shades for the headline, not for 20px copy.
