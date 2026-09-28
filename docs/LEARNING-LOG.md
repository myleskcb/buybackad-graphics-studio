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

---

## 2026-09-27 — The video engine: built, self-audited, run against the library

Studied:
  Built the engine from docs/VIDEO-AD-RESEARCH.md §8 (`video.js`, loaded after
  app.js; Export → Make it a video ad). Owner asked twice mid-build: does it
  apply to all our ads, and is it self-audited so it only produces correct
  graphics.

Measured:
  - Frame 0 and the last frame are byte-identical to the Export PNG on every
    template audited (video_audit.mjs: 0 differing values at 6/10/15 s).
  - A price that counts up at 30 fps FAILS the flash check: 10 flashes/s over
    33% of a region. Built as a cascade instead.
  - drawImage downscaling misreads cell luminance by up to 0.29 against an
    exact linear-light average (0.05 at half resolution). The flash check
    reads every pixel.
  - The first self-audit run caught "UP TO" overlapping "$1,100" (a `$` rises
    above cap height). Price layout now stacks on measured glyph bounds.
  - The first library sweep crashed out of memory after 28 templates:
    renderers held five or six frame-sized canvases each. Added dispose().
  - Encoded files decode back to 300 frames, 10.0 s, frame 0 at 40 dB PSNR
    against the still. Under the production CSP (injected, rule 49) the panel
    produces a download with zero policy violations.
  - Library sweep (243 templates x story + square, every length): IN PROGRESS
    at this commit; 141/243 story templates passed with no failures so far.

Changed:
  - video.js (new), vendor/mediabunny-1.60.0.min.mjs (MPL-2.0, licence
    beside it), index.html (button, panel, script tag), styles.css (+ the
    regenerated CSS_FALLBACK line in app.js, nothing else in app.js), cache
    rules in _headers and netlify.toml, README section.
  - scripts/video_audit.mjs, scripts/video_library_audit.mjs,
    scripts/video_gallery.mjs, scripts/gallery/ (playback gallery builder).
  - Playback gallery for the owner: https://claude.ai/artifact/G9CVJtTGMTQBpYA3AyZQmj
    (20 clips, posters only until a clip is played, one video loaded at a time).

Rejected:
  - A counting price (flash, above). A seamless-loop crossfade (the loop
    already closes on the still).
  - Blocking export on "up to" copy. It is a copy decision (rule 24), so the
    panel warns and cites the FTC finding.
  - Blocking export when the ad has no phone number: some sellers trade by
    DM. The bar carries their call to action and the panel says so.

Not verified here:
  - The H.264 encoder itself: this container's Chromium has none, and Chrome
    for Testing could not be downloaded (403). The MP4 muxer was exercised
    with VP9 inside it.

RESUME HERE:
  Export one clip from real Chrome or Safari, play the MP4, and upload it to
  a Reel and a TikTok draft before announcing the feature. Then read
  Facebook's Marketplace commerce policy by hand (research §7.2).

---

## 2026-09-27 (later) — Library sweep result

Measured:
  scripts/video_library_audit.mjs, all 243 templates x story + square = 486
  clips:
  - frame 0 vs the Export PNG: 0 differing; last frame vs frame 0: 0 differing
  - self-audit at 6, 10 and 15 s (1,458 runs): 0 failures
  - whole-clip flash check: 0 failures (worst: 4 transitions/s over 6.9% of a
    region; the limit is 25%)
  - number on screen: at least 99% in every clip; contrast fix needed: 0 clips
  - accent fell back to white: 66 of 486 clips

Changed:
  DESIGN-LAW rules 51-54 (appended, per rule 42).

RESUME HERE:
  Unchanged from the entry above: one real MP4 from Chrome or Safari, then the
  Marketplace commerce policy. Colour lever for later: the 66 white-accent
  clips could take a hue from their backdrop photo (OKLCH, rule 40) instead of
  white. Measure the contrast before changing it.

---

## 2026-09-27 (night) — The video rebuilt on the new language; plate air

Owner:
  "this is still bound by our OLD design language", "the bg images / colors
  don't look very good", "it is a good theme for ads to then shift to a CTA..
  starts a fully made graphic image ad", "these colored hazes don't look
  great. Unify with the new design language", "primarily 1:1 or 3:4 but
  occasionally we will do the 9:16", "primarily design for the square
  format", and, on CALL FOR INSTANT OFFER edge to edge on its badge, "why
  can't we seem to catch this? it would need to be shrunk 10-15% to make a
  minimum margin on the sides".

Changed:
  - video.js is gone. The video is the trunk's living still plus a shift to
    the card's own call to action at 5.8 s (DESIGN-LAW rule 65): its own
    parts on its own photograph, the shade near-black and graded to the copy,
    dark lines turned light as rule 62 turns them, lines carried with their
    plates, the words before the picture. Exact encoder, frame-0 gate and
    flash gate on every download (rule 66).
  - plateAir() after alignPass, and the same margin measured by
    audit_collisions.mjs (rule 64).
  - The three video scripts pin their stub account, assert the card that
    opened, wait for the photograph, and take --format (rule 67).
  - Merged the trunk (fervent-pascal: white haze lifted, supportive
    highlights, rule 63) and the audit thread (vibrant-hawking: the 50 offer
    cards' big number) before measuring.
  - The rules this log cited as "51-54" in the two entries above were my
    first build's drafts; the trunk's rules own those numbers. Their findings
    are restated as rule 66.

Measured:
  scripts/motion_audit.mjs, merged trunk:
  - square, curated 398: call to action on 398 (383 with the headline),
    frame 0 fails 0, flash fails 0 (worst 13.9% of a region, limit 25%)
  - square, classics 243: call to action on 238, frame 0 0, flash 0
  - 3:4, curated 398: call to action on 398, flash 0; frame 0 refused one
    card per pixel (faint-halo rounding, worst block 4.9 levels), which the
    block gate passes; a clipped shadow blocks at 17 to 23
  - 9:16, first 60 curated: 60 of 60, frame 0 0, flash 0
  scripts/audit_collisions.mjs, --no-air-fix vs plateAir:
  - classics short of air 25 -> 1, collisions 48 -> 48
  - showcase records short of air 187 -> 1 (live 56 -> 0), collisions
    102 -> 101 (live 0 -> 0)
  scripts/motion_export_check.mjs: both buttons, production CSP, 10.0 s,
  300 frames, VP9 + Opus, 0 violations, 0 errors.
  Gallery v2: 26 clips (18 square, 6 at 3:4, 2 at 9:16), all pass.

Learned:
  - A straddle test cannot see a line that fills its plate: 97% inside is
    "inside". Air is its own measurement, and it has to be taken in the
    plate's frame and on ink.
  - Fourteen "failures" of one shape on fourteen different cards were one
    classic measured fourteen times (rule 67). Suspect the harness first.
  - The second pass of the ink turn made a white halo round white type, the
    haze the owner had just rejected. A treatment tuned to one ink is wrong
    for the other: the halo goes with the outline. The cards' own light
    glows (WE BUY GOLD JEWELRY, a green number plate) did the same once the
    call to action shaded their ground: re-cut dark (rule 27).
  - A gate turns a quiet flaw into a refused download. The living still had
    always clipped the tail of a scaled product's shadow (fabric scales a
    shadow with its object; the bake padded by the unscaled blur); frame 0
    missed the still by 4,076 pixels on scriptRetro-cd06-15, and the new gate
    refused it. Fixed at the cause, not by loosening the gate.
  - A preview must be the download scaled down, not a smaller render: at 480px
    the call to action re-decided on softer pixels and one card lost its
    headline in the gallery while keeping it in the file.

RESUME HERE:
  Export one real MP4 from Chrome or Safari and play it. Then the 3:4 audit
  of the curated set (scripts/motion_audit.mjs --format three4) if it has not
  been run, and the one classic still short of air
  (dl_strips_duoSplit_emerald: its headline is 1.26x its panel).

## 2026-09-27 — The offer cards in every category, and what must not ship

Asked:
  "Double the variation and make an alternate prompt for the same style but
  more variations.. the best ones we go ahead and apply to multiple
  categories." Then, mid-way: "Audit any overlapping issues, bad assets, or
  inaccurate info / flaws. or bad copy gets removed", and the buying lines
  next to phones (Samsung, Pixel, foldables, Meta glasses, consoles, PS5 and
  Xbox, Steam Deck and ROG Ally, Switch, gaming PCs, headphones and gaming
  headsets, controllers, monitors, SSDs, mini PCs, sealed Chromebooks):
  "this is alternate media and we will create some alternate categories for".

Measured:
  - The product pictures, as pictures: OCR over all 478 cutouts found garbled
    lettering on 14 (BOLD gold bars, WILD GOLD silver, FDDERALRESDRVENOTE,
    "copslock", Addrorid); an edge test (a crop meets the frame with fully
    opaque pixels, a real edge is anti-aliased) found 24 used ones cut off at
    the frame; by eye, three "iPhones" were Android phones, the test strip ads
    showed rapid test cassettes, the Pokemon boosters were another game's; two
    were simply too small (a 144px coin drawn at 2.6x). 59 flagged in all.
  - The claims: invented facts in rule 55's other words (TRUSTED on 205
    showcase lines, "30 seconds" and "in minutes" on 81 each, INSTANT on 53,
    WE BEAT 35, TOP BUYER 34, mail-in and house calls); in a second pass, a
    price comparison nobody measured (WE TOP, WE OUTBID, WE MATCH THE COIN
    SHOP on 57 headlines) and car services nobody offers (FREE TOW on 51
    lines, DMV paperwork, same-day pickup, lien payoff, NO SMOG NEEDED); a
    grammar slip in live copy ("SHOW US THE YOUR CARRIER NUMBER"); on the
    owner's 50 offer cards, six headlines that claim more than the ad shows or
    the shop buys.
  - The Studio's own templates had never been held to the showcase's bar:
    measured now, 108 of 243 classics fail it (41 of the 50 hand-built ones,
    mostly three typefaces or a headline that does not win; 38 with a product
    or a line over the words).
  - The landing drew a Studio card's thumbnail before its product picture,
    photograph or face had loaded (it never warms the library, to stay light
    on a phone), so the five new categories showed type on black.
  - Build-time headline fitting: estimated widths ran up to 10% narrow on some
    faces, so a headline set in three lines where two were planned and the
    product sat on it. Calibrated per face in the browser.

Changed:
  - The offer family in the Studio (offer-library.js): the owner's offer card
    with every axis doubled (six layouts, twenty looks, twelve pairings), 161
    cards over 35 buying lines in all 13 categories, five of them new (Gaming
    & Consoles, Headphones & Audio, Computers & Parts, Wearables & Glasses,
    Cameras & Drones). Lines with no clean picture are set in type. Every card
    passes scripts/audit_templates.mjs.
  - assets/cutout-flags.json, swap_flagged_cutouts.py, cutout_edges.py: bad
    pictures named, and every showcase card that drew one given a whole, clean
    picture of the same kind inside the old footprint (355 pictures over three
    passes; none left).
  - CLAIM / CLAIM_FIX (refresh_copy.mjs), honest_claims.mjs: 690 lines on the
    showcase (540 on 423 cards, then 150 on 116) and the same words in app.js.
    A comparison becomes an invitation ("SKIP THE COIN SHOP"), a tow becomes
    AS-IS, a pickup becomes CASH IN HAND WHEN WE MEET.
  - Three dead brand-logo layers removed (app.js cannot ink them, so they drew
    nothing), two status dots moved off the words they sat on.
  - template-holds.js: what fails the bar is left out of TEMPLATES (108 of 404).
  - The landing fetches a shown Studio card's own assets and draws it again.
  - The showcase: 620 records re-measured; 692 of 971 pass every check (690
    before, under looser rules).
  - docs/offer-cards-prompt-v2.md: the brief for the owner's generator, every
    axis doubled, the category banks, the new honesty rules, the review of the
    first 50.
  - DESIGN-LAW 68-70 (57-59 when written; renumbered after the trunk's 57-67).

Rejected:
  - Fetching product photos from Wikimedia Commons or the makers' sites (the
    owner offered): this container's network policy denies them. The fetch is
    described in the v2 brief for the owner's Mac.
  - Moving the voltStack and stepsFlow headlines apart by hand to clear their
    box overlap: their number blocks were solved for the current positions
    (assets/number-fix.json). They are held until the number block is re-baked.
  - Treating iCloud-locked copy as inaccurate: it is a product line the studio
    offers resellers, though the owner's own offer brief bans it for iPhones.LA.
  - Unholding the five trustSeal cards that repeat FREE QUOTE: they fail the
    design school too, so a copy fix alone would not bring them back.

RESUME HERE:
  Draft-deploy this branch and look at the landing's new category chips and
  the Offer cards chip on a phone. Then the owner's Mac: redraw the six offer
  card headlines in the v2 review, and source real photos for the type-only
  lines (the v2 brief says how).

## 2026-09-27, later — real cards, photographs behind them, faces with a voice

Asked:
  "they are good designs, they are definitely lacking and type faces that have
  personality or flavor and the gray sections should have a background image
  and it feels really incomplete because the cards don't even have a brand or
  image on them. We need actual cards", then "At least give us a bare minimum
  of base images that we can start using as placeholders", and for the rest,
  "We can just scrape separately and implement as assets into our engine."

Measured:
  - The owner's own picture review (assets/approved-assets.json, 2026-09-03)
    had never been consulted by this session's audits or swaps: 131 showcase
    cards (89 live) drew a picture the owner had rejected, some put there by
    the first swap (iphone-fan-four, mac-air-open-angle, silver-tea-set).
  - Under that list, Pokemon had one usable picture (a trio of blank pastel
    slabs), test strips one small one, sports cards two blank ones.
  - This container reaches Google Fonts, npm, PyPI and raw GitHub files; every
    image host (Commons, the Met, the Library of Congress, Openverse, stock
    sites) is denied.

Changed:
  - poke-psa-charizard: a real PSA 10 1999 Charizard, cut straight-on from a
    Commons photograph already in the repo (the perspective fitted to the
    card's and the label's borders with OpenCV; certificate number softened).
  - ph-sports-*: placeholder cards, a slab, fans and a sealed box that show a
    card face and no invented brand (scripts/make_card_assets.py).
  - The offer family on photographs of its goods with a solved neutral shade,
    the small type on panels, and seventeen vendored display faces assigned
    by category (DESIGN-LAW 71). 161 of 161 pass the audit.
  - scripts/picture_gate.mjs: the owner's list and the flags, one rule for
    every audit and the swap; 247 pictures on 162 showcase cards swapped
    again, none of them now rejected; 692 of 971 showcase cards live.
  - scripts/ingest_assets.py and docs/scrape-intake.md: scraped files in
    incoming/ become cut-out, checked, credited, approved and wired assets
    (offer-assets.js) in one command, with the shot list of what to fetch.
  - The landing's offer and category chips draw each card again once its own
    pictures, photograph and faces land.

Rejected:
  - Pulling vintage card scans from other people's GitHub repositories: raw
    GitHub is reachable, but this session only works in the owner's repository.
  - Pictogram athletes on the placeholder cards: they read as a child's toy.
    The placeholders carry a ball on a light burst instead.
  - Filling the owner's blank slab frames (sports-slab-graded is broken at a
    corner and landscape); the placeholder slab is drawn to the real PSA
    slab's proportions, measured off the Charizard photograph.

RESUME HERE:
  The owner scrapes; drop the files in incoming/ and run
  python3 scripts/ingest_assets.py, then --write, then the template audit.
  The ph-* placeholders go first (docs/scrape-intake.md).

## 2026-09-27 (late) — One engine: the tagline everywhere, products off the subject, gaming rooms

The owner: "Make sure that the latest tagline update that we are currently
building gets implemented to these graphics for final unification. You don't
build anything in this repo if it's not 100% unified into all design language
not just portions ... we don't have logic that only applies to one type of ad
or worse, one type of category only". Then: "keep in mind where the
background subject is in relation to the secondary asset", and "particularly
for these game consoles ... gamer bedrooms, gamer living rooms, aesthetic
gaming set ups".

Found:
  - The tagline styles existed only as a lab experiment (taglineStyle, called
    by scripts/tagline_lab after a render). No surface offered them; the
    offer family had no palette to give them; the editor could not switch one
    back off.
  - Measured on every family (scripts/tagline_audit.mjs, 82 templates, every
    style, the critic on every line and the video's frame zero), the lab's
    styles failed 1 to 8 cards each: gradient and pair took a pure-white line
    to a pastel at 0.88 (2.8:1 on a mid-grey photograph), and read a red line
    on a dark panel as "dark" and made it darker (2.2:1); street put a 3px rim
    on a 20px label, swept a number on its own orange band, and could not tell
    a translucent glass panel from a dark photograph; outline read by its rim
    alone on a cream ticket; blocks fell back on every offer "band" card
    (their tagline sits on the 6% guide).
  - The video cut the end off an italic T on a tagline block: the bake crops a
    moving line to its box plus 6px, and a line's shadow had always widened
    that crop. A block takes the shadow away. Not a style bug: an engine bug
    that only a style without a shadow could show.
  - The owner's two examples (coins centred on the ring photograph, the strip
    fan on the Contour bottle) were not "covering" by a share-of-subject
    measure: the coins hide a fifth of three rings, and all of the one that
    matters. Covering has to include sitting on the centre of a concentrated
    subject.
  - No photograph of a gaming room exists in the repo, and every image host is
    still denied here.

Changed:
  - TAGLINE_STYLES (app.js): one choice for every template, applied in
    renderEzCanvas (preview, download, pack, video) and on the editor canvas;
    colours from tplPalette (theme, family palette, scene, reference sweep);
    ground-aware (gradient and pair solve their lightness on the measured
    ground; street darkens plates and mid-toned bands, sweeps deep on large
    light panels, leaves type under 34px alone; outline rims harder on light
    grounds; the design's ink breaks a tie); blocks measured from the drawn
    ink with shared padding in a tight stack; switchable (pgTagRest,
    taglineReset), blocks follow their lines in the editor. Every style passes
    on all 82 audited templates.
  - motionBake: a moving text's crop allows a third of its size.
  - photo_subjects.py -> photo-subjects.js (330 photographs, 16x16 maps) and
    productYield with alignPass: products step off a covered subject without
    touching words, plates or other products. Over the 427 cards that stand a
    product on a photograph: designer 0 of 30 covered, street 1 of 37 (moved),
    offer 7 of 140 (4 moved, 3 still cover a little), showcase 0 of 220 (its
    products hide at most 12% of a subject).
  - make_gaming_grounds.py: three drawn rooms (an RGB desk setup, a bedroom at
    night, a living room with the TV) for the gaming lines, gaming headsets and
    monitors, marked placeholders, on the scrape list.
  - The trunk's showcase: the gated swap (157 pictures on 111 cards) and the
    claim rewrite (198 lines on 145 cards) applied again after the merge, and
    re-measured: no flagged picture and no invented claim left (102 and 145
    before), 415 of 971 cards live, 9 lines repaired to 3:1 on 4 cards.

Rejected:
  - A box per photograph for the subject: the ring photograph is rings edge to
    edge; a coarse saliency map shares a room's weight over its screens and
    strips, and holds a ring's in the middle.
  - Moving the photograph instead of the product: it would change what lies
    under every line of type the legibility audit already passed.
  - A nudge that only crosses the threshold (a laptop moved 27px, 0.13 to
    0.11): a move has to show the subject, 40% less hidden or clear of its
    centre by 6% of the card.
  - Each gaming room's screen as its subject: 13 of 30 gaming cards moved,
    most into a corner or onto a band. A console in front of a room's TV
    reads as a console in a room. (Found on the way: a full-width band was
    not a plate to the move, so a product could slide onto the steps band;
    it is now.)
  - Styling the thumbnails in Easy Mode's strip per style: a render per card
    per change for a preview the big picture already shows.

RESUME HERE:
  The owner picks from what the video maker (motion/) has that templates do
  not (OPEN-ITEMS §O: number styles, urgency elements, sign boards); each is
  built where the tagline style went, for every template. The gaming rooms
  and the ph-* pictures wait on photographs (docs/scrape-intake.md).

## 2026-09-28 — Audit and validation of the branch

The owner: "audit and validate".

Checked, all passing on the branch as pushed after this entry:
  - Every shipped script and every script in scripts/ and tools/gfx parses
    (143); the Python scripts compile (13); all 1,028 JSON files are valid.
  - Every file a card names exists: 971 showcase records, their thumbnails,
    backdrops and pictures; the offer grounds; every photograph in
    photo-subjects.js. None of the 382 pictures on live showcase cards is
    flagged or refused by the owner's list.
  - The landing (390 and 1440px): no failed request, no console or page
    error, no sideways scroll. The release gate (tools/gfx/gate.mjs, 8 seeds):
    1152 asked, 1152 clean.
  - The template audit (dry run) agrees with template-holds.js (119 of 404
    held, the offer family 161/161); the subject audit repeats its moves (437
    cards); the tagline audit passes every style on all 82 sampled templates,
    picture and video (5 blocks give way to the outline, each because a block
    would cover the product).
  - The real video buttons under the production CSP, as designed and with
    blocks, from Easy Mode and the editor: 10s, 300 frames, audio, no
    violation.

Found and fixed:
  - One inline script's hash (the FAQ JSON-LD) was missing from the CSP in
    netlify.toml and _headers, from before this branch. JSON-LD is never
    executed, so nothing broke, but scripts/verify_csp.mjs counts it; the
    hashes were rewritten with scripts/csp_hashes.mjs.
  - A code review of the branch, each case then driven in the editor, found
    the tagline styles' editor side unsound: Enhance threw on every text (an
    older fitToDoc bug: `(null && p.fontSize) !== undefined` is true) and,
    wrapped by the style, took the style away with it; a style switched while
    several objects were selected wrote absolute positions into a selection's
    relative frame; the recorded positions went stale after a format switch or
    a nudge (a line kept the block's shrink as its "designed" size); Quick Edit
    and the properties panel left a line off its block; a duplicated line
    shared its original's block; opening the editor from Easy Mode with the
    visitor's own photograph solved the style on the template's photograph;
    Fresh start and a History re-download kept or lost the theme the styles
    read; the scene palette read the zoomed canvas width. All fixed: moves are
    recorded as moves, blocks refit before every draw, copies get a block of
    their own, blocks are not layers of their own, the selection is dropped
    first, Enhance runs inside the style as one history step, and the style is
    solved again when the visitor's photograph lands. Switching through every
    style and back restores the designed card exactly (four templates).

Not verifiable from a cloud session: what is live. Its network policy denies
*.netlify.app, and the Netlify connector attached there sees a different
project (buybackad-finished-copy). OPEN-ITEMS §O.
