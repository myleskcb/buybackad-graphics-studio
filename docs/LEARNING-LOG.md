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
  - DESIGN-LAW 79-81 (57-59 when written; renumbered after the trunk's 57-67, then after its 68-78).

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
    by category (DESIGN-LAW 82). 161 of 161 pass the audit.
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
  not (OPEN-ITEMS §Q: number styles, urgency elements, sign boards); each is
  built where the tagline style went, for every template. The gaming rooms
  and the ph-* pictures wait on photographs (docs/scrape-intake.md).

## 2026-09-27 (late) — "the worst ad I've ever seen you make": a card rebuilt, and an audit that says so first

The owner took stepsFlow-nn05-30 apart: a headline that was only the item
word, a trust word posing as the headline, too many typefaces, cheesy glossy
pills, blurred small type, a "3" outside its box, a phone covering the
photograph they loved, a CTA too small. Then, three renders in: "not put out
another without 100% validating and self auditing."

What was wrong under the hood was mostly one thing: **the engine judged type
by its box, not its letters.** A 192px line's box reaches 44px above its caps
and 50px under its baseline. So the guides pass thought the headline had left
the canvas and shrank the whole card 1%; the collision pass thought two
display lines 19px apart overlapped and pushed the second onto the first step;
the decoration pass thought a bolt touched the headline and moved it off its
pill; the product pass thought the number's box touched the phone and lifted
the phone off the band; plates centred their words by the box and big type
sat high. One helper, `textInkRect()`, and five passes switched to it.

The "3" was its own bug: a step numeral is decoration and a word, and the
decoration pass counted it as colliding with itself. The first dry render
showed the "1" doing it too, pushed by the headline above.

Two harness lessons. Measuring ink with the drop shadow on shifts a line's
bearing by a different amount per glyph; and an auditor that uses the canvas
width as its height sees nothing below 1080 on a 3:4 card. Both were mine and
the audit caught the second itself (rule 50: suspect the harness first).

Mirroring the phone, which the owner suggested, was the owner's own next
catch: a mirrored iPhone has its cameras on the wrong side. The library had
the same phone photographed leaning the other way.

Result: `scripts/restage_steps_flow.mjs` rebuilds the card (claim, badge from
the bank in the CTA's colour, two faces, flat uniform steps, a real phone
standing on the band, the accent read off the photograph), and
`scripts/audit_card.mjs` passes it 154/154 in the gallery painter, Easy Mode
square and 3:4, and the video. DESIGN-LAW 68-76.

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
  - scripts/neutral_panels.mjs (rule 85): panels holding copy become smoke
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
  - The contradictions above fixed in code; rule 87 and 19 "Superseded"
    pointers in DESIGN-LAW; the pipeline in OPEN-ITEMS §R; the findings in
    docs/COHESION-AUDIT.md.

Rejected:
  - Deleting the duplicate helpers in the classics' passes now: their tables
    were baked with them; consolidation belongs to the classics' re-bake.
  - A gate that blocks: an ad is never held hostage; it is measured, shaded
    when shade fixes it, and otherwise named, with "Download anyway".

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
project (buybackad-finished-copy). OPEN-ITEMS §Q.

## 2026-09-28 — tall formats: centred, then grown, and the call made from the photograph

The owner asked for the 3:4 content to be centred (a phone standing on the band
had joined the steps to the band, pinning all of it to the bottom), then for
the 9:16 to fill its blank space by growing the steps and layering the phone
over them, and for five examples of the right call. The rule became a
decision the engine takes from the photograph: grow into plain rows, fit into
them, or stay centred where the photograph is subject all the way down
(DESIGN-LAW 77). Two of the first six calls were wrong — "keep centred" on
photographs whose subject ended mid-card, which left the plain run empty and
set the steps on the subject — and the fix was a third outcome, fit. The audit
caught two engine faults on the way: the full-canvas scrim taken for the CTA
band, and a deliberately layered phone "rescued" by the product-clearance pass.

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
  - DESIGN-LAW rule 87 (the shade stands where the copy stands), rule 62
    pointer; AGENT-BRIEF; OPEN-ITEMS §R.

Rejected:
  - A floor of shade between the bands (a faint veil "for cohesion"): it is
    the haze the owner asked to lift, and the gate does not need it.
  - Shading by the copy's boxes rather than by bands: a patchwork of
    rectangles reads as plates that are not there; a horizontal band reads
    as light falling on the picture.

## 2026-09-29 — thirty-six patterns, sixteen aesthetic gradients, one sheet

The owner asked for as many patterns as we could make, sized up and down and
slid around in the editor, and for aesthetic colours (a holographic WE BUY
IPHONES). The Easy Mode tagline panel now has one Pattern look with 36
seamless tiles in five families (geometric, themed, material, animal, street),
a size slider (25-300%), two slide sliders, and a drag on the preview itself.
Sixteen gradients join the presets: holographic, iridescent, opal, vaporwave,
Y2K chrome, oil slick, prism and the rest.

What the checks found on the way:
- The old stripes tile was solid ink: its stripes were exactly as wide as
  their spacing. Nobody saw it because the panel check only asked whether the
  preview changed.
- Strokes ended at the tile edge left notches at every seam (chevron, zigzag,
  waves, argyle); lines now run past the tile or are drawn wrapped, and a seam
  metric (the step across the edge against the largest step inside) checks all 36.
- A tile drawn at the design's density is soft in a 2160px download. Tiles
  are now drawn at the render's own density and scaled into the line.
- Per-line tiles made the money signs jump between lines. One sheet per card,
  anchored to the card, and plate air re-anchors any line it moves.
- A full preview takes about a second, too slow to drag. The drag slides the
  sheet on the scene it built once, and its last frame is pixel-identical to
  the full render it settles to (the panel check drags a real pointer).
- The gradient look painted the badge and left the CTA cyan, breaking rule 74.
  Plates of one colour now take one treatment (DESIGN-LAW 74). Street's dark
  pill had hidden the badge's bolt, which is all stroke.
- The first dialog a new visitor sees (service area) caught the test's pointer.
  The check now proves the pointer lands on the preview before it drags.

## 2026-09-29 — the owner's fonts, the phone picker, and a picker that hid itself

More fonts: the owner reviewed 151 faces on 2026-09-01 and approved 56, all
already in assets/fonts, yet Easy Mode fetched most faces from Google. faces.css
now declares every approved face (scripts/fetch_fonts.mjs reads the approved
list), the picker lists them by role, and FONT_PAIRS pairs them by voice
(street, bold, stadium, sport, tech, block, arcade, squad, comic, marker,
retro, pop, luxe, modern, warp, stencil). The sheet check found a real bug:
the loader asked only for weight 400, so a 700 headline in a static family
(Oswald, Teko, Manrope…) painted in the fallback and fabric kept those widths.
Every weight now loads. Nanum Pen Script has no middle dot (LA · OC · IE).

The phone picker: the popular models first (18 Pro Max, 18 Pro, 17 Pro Max,
17 Pro, 17 Air, 17, 16 Pro Max, 16 Pro), Surprise me, the rest of the shop's
factory catalog by series, As designed. Two faults, both caught before
shipping:
- A narrow single-back photo left 95px between itself and the steps, more
  than blockRemap's joining gap, so in 3:4 and 9:16 the phone was stacked
  above the steps as its own block. Side by side is now one row.
- My first version reused the page's existing id ez-device-field and the
  function name ezDeviceSync, which belong to the "Your device" select (re-set
  a card to iPad, Watch…). The later declaration silently replaced the old
  one, and the check passed because it read the other element. A screenshot
  showed it. The picker has its own names now; the check asserts the field is
  laid out on screen and unique, and the old select was re-verified
  (glassCard-nn01-20 re-set to All iPads).
The ip-gen17-plateau-black crop is a square camera bump (16 Pro design), not
the 17 Pro plateau: marked not authentic.

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
  - DESIGN-LAW rules 88 and 91.

Rejected:
  - Apple emoji images from a package (Apple's artwork, not licensed).
  - Non-Apple device emoji as a fallback (the owner: iOS style only).

## 2026-09-29 — Three lines made one: the trunk, the live branch and the one engine

The owner: "ok work around pusha aqnd commit" (after the live site could not
be seen from the cloud session, and the Netlify connector saw only the
finished-copy project).

Found:
  - What was live was none of the three lines on its own. The connector showed
    production on buybackad-finished-copy as claude/fervent-pascal-w6mthe
    (26037de: the gate, the bands shade, emoji accents), deployed by another
    session at 01:37. The trunk had nine commits past this branch's last merge,
    among them the tagline looks v2 and their panel: this branch's six-style
    row was a first draft of a feature the trunk had since rebuilt. Deploying
    any one line would have taken the other two off the site.
  - The trunk's looks v2 kept v1's lightness bug (a white line at 0.88 on a
    mid-grey photograph, a red line on a dark panel made darker), and its
    newer looks failed the critic on the 82 audited templates: a premade
    gradient on 5, glow on 15, the red and blue print on 3.
  - The live branch's gate read a glow's halo, the red and blue offsets and a
    3-D depth as words touching their line: every effect look would have
    failed it. Colour blocks took an emoji accent for a product and gave way on
    every card that had one. The emoji are placed in alignPass, before a look
    could move a line.
  - The trunk's phone picker offered ten phones (iPhone 11, 12, XR, XS) that
    are not in the owner's approval list: the list was enforced where cards are
    built and audited, and the picker chooses a picture at run time.
  - photo_subjects.py was not reproducible (k-means from random centres): a
    run with no photograph changed rewrote 65 maps.
  - Rule numbers collided three ways (the trunk's 64-78, this branch's 68-73,
    the live branch's 64-67), OPEN-ITEMS letters two ways.

Changed:
  - Merged the trunk, then the live branch (merge commits, nobody's history
    rewritten). The card records both sides touched (281) merged field by field:
    words and pictures here, colours, shade and grounds there, no field changed
    by both; the index and number-fix.json per entry; the two owner-approved
    Steps Flow cards kept as approved; the trunk's faces (a superset).
  - One tagline engine: the trunk's looks, gradients, patterns, effects, panel
    and card looks, through one entry point (taglineApply) on every surface,
    with this branch's reset records, ground-aware solving, fitted blocks, the
    editor row (now all twelve looks) and a look's layers that follow their
    line in the editor and survive undo. DESIGN-LAW 83, amended.
  - Every look solved on the card: a preset moves its stops together where
    they do not read; glow and the red and blue print choose their strength by
    the critic at half size, first to read at 3.5:1.
  - The gate measures a look's layers with their line; blocks ignore emoji; the
    emoji are placed again after the look; the editor finishes a card as Easy
    Mode does (number fill, claim shade) before the look.
  - The phone picker asks the owner's approval list and the flags (61 phones in
    its pool, 51 after), and a saved pick of a refused phone is not drawn.
  - photo_subjects.py seeds its k-means; 315 photographs mapped.
  - Rules renumbered (this branch's 79-84, the live branch's 85-88) with every
    reference in the lines each side wrote; AGENT-BRIEF landmine 7.

Measured (the merged build, before the push):
  - Tagline looks: all twelve on the 81 audited templates, the picture and
    the video's frames, 81/81 each by the critic (blocks: 6 gave way to the
    outline where a block would have covered a product).
  - The owner-approved Steps Flow cards: stepsFlow-nn05-30 212/212 and
    stepsFlow-nn01-30 210/210 (audit_card), and the approved 9:16 matches the
    owner's render (0.00% of pixels moved).
  - Showcase: 971 records measured by the gate; 418 live and none of them
    failing it. The 125 that fail are held back (a headline too small as a
    thumbnail 93, legibility 18, the number off its plate 19); content audit
    CLEAN 422, retired 284. Every thumbnail re-rendered (ASSET_REV 20260929u).
  - Classics: all 404 measured whole (?noholds=1), 347 pass; 57 held back,
    in classics-gate.json and template-holds.js alike (the live branch held
    16, by a measure taken before the faces and photographs loaded).
  - Template audit: offer 161/161, street 22/40, designer 70/153, hand 8/50.
    Subject audit: of 438 templates with a product on a photograph, 3 offer
    cards still cover the photograph's subject (of_laptop_row_midnight,
    of_strips_split_bone, of_camera_row_sand: OPEN-ITEMS §S).
  - Static: CSS_FALLBACK in sync, CSP hashes unchanged, every script and JSON
    file parses, every record's pictures resolve (971 of 971, 0 missing).

Rejected:
  - Deploying this branch alone, or the trunk and this branch without the live
    branch: either would have rolled the site back.
  - Picking one of the two tagline engines: the trunk's had the looks and the
    owner's panel, this branch's had what made six styles hold on every
    family; each alone lost something.
  - A dark glow round a white core on a mid ground (it read worse, 2.0 to
    2.9:1), and guessing an effect's parameters from the mean ground: chosen
    by measuring instead.
  - Merging the colour-theme session (claude/eloquent-euler-7jvzfd): minutes
    old and mid-work. Re-running curate_showcase: it re-picks the owner's cut.

## 2026-09-29 — the variant board: what 150 pilot cards taught the engine

The first pilot passed 2 of 30. The audit was right each time, and most of the
failures were engine bugs that the approved card had never exercised:
- **An outline moved the letters.** fabric grows a stroked text's box and keeps
  its top-left, so every outline look shifted the claim half a stroke down and
  right (8px on a 196px line), and every effect copy (glow halo, red and blue,
  3-D depth) sat half a stroke off its letters. Strokes now keep the centre;
  copies are placed by their line's centre. This was live in the Easy Mode
  panel.
- **An outlined band grew on every pass.** fitInsideGuides re-attached a
  full-bleed band from its bounding box, which counts the stroke.
- **A numeral was judged by its box.** Oswald's "2" box hung 5px under its
  plate and section 4c moved it; on letter-laid cards numerals are now judged
  by their letters.
- **An inset CTA card was snugged to the number's box** and grew 30px into the
  steps, lifting the phone; the composer's CTA plate is left alone.
- **The claim merged with the steps** in 3:4 and 9:16 when an outline or a 3-D
  depth brought it within the joining gap; the claim is its own block, and the
  tall-format passes know the look that will paint it.
- **The video clipped a slanted face.** Bangers draws its last letter past its
  advance box; the video's layer crops now keep a quarter em for text.
- **Street's number** was re-centred by numberFill before its outline was drawn
  and left the guides; numberFill now allows for the pending outline.
- **A fixed "deep" accent** read 1.1:1 on a mauve ground; the second line's
  colour on a light ground is solved against the darker fifth of the ground.
Planning mistakes, caught by the numbers: the planner counted rejected
attempts toward coverage (claims came out 64 to 145), and planned faces that
could not set a claim or a number at the rules' sizes. The planner now
measures every face first and counts only what it keeps.
Then a look at the cards themselves, before the full run was a quarter done,
found what no check measured yet: the Comic and Marker voices set "iPHONE" as
"IPHONE" (Bangers and Permanent Marker have no lowercase), Squada One set "#1"
as "#I", and the camo pattern dissolved into every dark ground while its light
patches passed the contrast measure. The run was stopped and re-planned: the
glyphs are measured (`faceGlyphs`), the audit fails a claim its face cannot
spell, Comic and Marker moved to Knewave and Sedgwick Ave Display, camo and
the open-MacBook ground left the board. Lesson: the audit is the floor, not
the review. Contact sheets of the first cards, looked at as the owner would,
catch what the rules have not yet named, and they are cheapest before the run.
The same sheets showed a black claim on a bright mosaic that the contrast check
passed (its upper quartile sat on the light tiles). A luminance-only floor on
the letters' fill failed it, and also failed the owner's own pink "iPHONES" on
grey phones, which reads plainly by its colour. Measured both ways on real
cards, the difference is a pixel that neither lightness nor colour separates:
the mosaic lost 26% of its letters, every other card 3% at most, the pink none.
The gate is on that, not on a threshold picked from one bad card.
The first audits then showed 3:4 and 9:16 rows off by 2 and 4px on cards the
composer had centred to the pixel. Traced pass by pass, no pass moved them: the
tall formats scale the list 1.45x, and a label's drawn top sat 0.7px under its
metric top in the square and 1.6px under it scaled. The approved card had the
same drift and passed only because it started a pixel the other way. The rows
are now re-centred by their drawn letters after the list grows; the approved
9:16 still matches the owner's render (0.04% of pixels moved).
The first version of that fix re-centred row 1 only. It chose each plate's
words by visibility after the first measurement, and measuring draws one object
alone, so plates 2 and 3 found no words and were skipped. The probe that
"proved" the fix printed row 1 alone. Lesson: a check of a fix covers every
instance the fix claims (all three rows, both tall formats), not the first.
Stopping audit shards mid-batch to restart them left 83 audits that judged
nothing: the browser died first, and the audit wrote a "detached frame" record
for every card left in its batch within a second. Counted as failures, they
would have dropped good cards from the board. The board's audit now runs a
crashed audit once more in a fresh browser, and collect reports crashes apart
from designs that failed.
The board as published: 900 planned, 900 audited in every view, 582 passed at
100%; 13 were left out in the owner's-eye review (a MacBook lid whose Apple
logo sat behind the step words, a stencil claim lost in banknote printing); 500
kept, 35-36 per voice where the voice passed that many (Retro 23, Arcade 21,
Warp 32 and Tech 32 gave all they passed), 7 claims, 11 badges, 16 factory
phone photos led by the 17 and 18 Pro Max, 43 looks, 40 grounds, 14 type pairs.

## 2026-09-29 (later) — The theme, background and effects controls do what they show

Owner, with two screenshots of Easy Mode (the Reef lower third, Indigo Trade
picked, the green background swatch on): "make sure we build all features to
be completely relevant or at least make them work to redesign the theme."

Studied:
  What each control under "Suggested color themes", "Background" and
  "Effects" actually does to the scene it draws, card by card, through the
  real UI. Which branch the owner is looking at: the Netlify connector's
  deploy record names `claude/fervent-pascal-w6mthe` (47ec573a, then 26037de3
  an hour later) as production for buybackad-finished-copy; `main` was a
  month behind and the trunk and vibrant-hawking had diverged from it.

Measured (scripts/ez_theme_audit.mjs, new; one live card per layout, four
classics, the screenshot card; every theme; grounds with no theme and under a
light and a dark theme; blur; overlays; patterns; ORIG; the chip; the
swatches):
  live build (26037de3): 1148 problems. Every plate that carries words kept
    its old colour under every theme (420 of 420 pairs), 378 pairs left the
    card's own accent beside the theme's, 32 changed under 1% of the picture;
    176 pairs and the grounds 125 more took lines under the gate or 3:1; blur
    did nothing over a flat colour (20 cards) or on 4 photographs; Shade was
    a white veil failing Sell Your iPhone's headlines; no ORIG; the chip
    disagreed after a template switch; the swatches ignored the theme.
    This branch: no problems over the same 20 cards and 21 themes, no page
    errors. The first full run here read 16. Some were the audit's own: it
    leaked the previous card's saved draft (Shade on) through localStorage,
    and it measured a classic before its photograph had arrived. The rest
    were real: Shade's white veil, and lines under 3:1 on the magenta and
    amber swatches. The next run read 2, both on grounds picked with no theme
    (a see-through panel, a light outline); then none.

Changed:
  - themeScene() (appended to app.js, "A THEME OWNS THE CARD'S COLOUR"): plates,
    marks and lines repainted by the job their colour had in the card's
    palette, every line solved on its own pixels; runs after the layout in
    renderEzCanvas and in the editor hand-off. Built on pgRgb, pgLum, pgCr and
    pgPlateUnder (rule 87).
  - applyColorTheme no longer writes per-line colours into ez.styles (it takes
    back any line colour on a theme or ORIG pick); ORIG chip; the theme
    persists (state, history, projects), follows the visitor across cards,
    and its chip is kept in step (syncEzThemes); ezThemeGround keeps rule 86's
    photo-led / product-led ground and redraws a drawn ground in the theme.
  - The selling points' ✎ style reaches a card's own badge list (Easy Mode and
    the editor hand-off).
  - Blur adds to the photograph's own (ezBlurOn), is switched off with its
    reason over a flat colour or the placeholder (ezSyncFx), and reaches the
    editor for a template or drawn ground.
  - ORIG lit only when the photograph is really drawn; the Layers row shows
    the photo that loaded (ezBgThumbSrc; OPEN-ITEMS §J 8) and names a
    theme's ground; openShowcase refreshes it.
  - The overlay's tone: ezOverlayPre from the ground before the copy is
    solved, ezOverlayFit from the lines on the photograph after. It used to
    come from ezInkLight over the template's record, and Shade was white over
    Sell Your iPhone's dark photograph. In the editor it sits above the ground.
  - The six quick swatches follow the theme: ezPresetSpecs, drawn by
    ezSyncPresets. A pick follows the next theme and leaves with ORIG (a
    slot tag, ezThemeGround). The lit swatch is found by value (ezSameGround).
  - The copy follows a flat or drawn ground the visitor picks with no theme
    on (ezCopyFollowsGround): lightness only; lines on plates and ✎ colours
    are left alone; a see-through panel thickens until its copy reads;
    see-through backings are dropped.
  - A line's ring follows its ink (thRingFit), in the theme and in that
    pass; with no photograph under it, a ring of the ink's own tone goes, as
    on a plate. A theme's see-through backing is neutral. A line whose side
    cannot reach 3:1 goes whichever way reads.
  - The audit:
    - a fresh browser context per card; the previous card's draft in
      localStorage had Shade on before a card's own no-overlay base, and
      Shade then "changed nothing" on it;
    - each card's own photograph is awaited;
    - patterns and their tone are measured at full size;
    - no overlay may take a critical line under the gate;
    - the grounds run with no theme as well;
    - the six swatches must follow the theme.
  - DESIGN-LAW rule 90; AGENT-BRIEF landmine 6 (the live branch is not always
    the newest); OPEN-ITEMS §T.

Rejected:
  - Leaving rule 51 as it was and only lifting its skip: the line on a plate
    would have taken the theme's colour for the theme's ground while its plate
    kept the card's old colour (cyan on magenta, the screenshot).
  - Rule 52's luminance-locked re-hue for everything: it keeps every contrast
    by construction but cannot turn a dark card light, so a cream theme drew
    dark brown panels. Kept only for marks in the card's ground colour.
  - A tint of the theme's hue over the photograph (rule 56; the owner's "ugly
    hideous overlaid colors"), and replacing every photograph with the theme's
    gradient (rule 86 keeps a photo-led card's photograph).
  - The worst tenth of the ground as the measure of a line: a spec list that
    half crosses a paper band came out #6f6f6f. Three quarters of the ground.
  - A backdrop of the ground plus word plates only: it left out the smoke panel
    a line merely crosses and solved that line against bare photograph.
  - Fitting the theme's swatches only to 6:1, as "More grounds" does: under
    dark ink the support colour came out mid-tone (0.35), and a headline that
    crosses the smoke panel read 2.3:1 either way. They sit on the theme's own
    side, well clear of the ink.
  - Turning a chip's see-through backing to paper on a flat ground: the chips
    still read 1.7:1 on the orange swatch. The backing only calms a
    photograph, so on a flat colour it goes.
  - Deciding the overlay's tone only after the copy: the theme had already
    solved the lines against a dark provisional shade.
  - Reunifying the three heads in this session (conflicts in app.js, the
    DESIGN-LAW numbering and binary showcase assets): the owner's call.

RESUME HERE:
  Bring the branches together: this branch is claude/fervent-pascal-w6mthe
  (with its emoji accents, 26037de3) plus the theme work. On the trunk the
  tagline styles run after the layout too (ezApplyTagline reads the scene's
  palette): themeScene must run BEFORE it, so a tagline look takes the
  theme's colours. Then run `node scripts/ez_theme_audit.mjs` (exit 0) and
  `scripts/verify_showcase.mjs` on the merged build.

## 2026-09-29 (evening) — The variant board and the colour themes on the one engine

The owner: "ok work around pusha aqnd commit". After a2311fe was pushed, the
trunk (the variant board) and the colour-theme session both kept committing;
each was merged here twice, as merge commits, nobody's history rewritten.

Found:
  - The trunk's own panel check failed on the owner-approved card before
    either merge (it failed at a2311fe too). Colour blocks gave way: held
    inside the 6% guides, the claim's block slid a whole padding sideways onto
    its badge. Street's video lost its end card: the look sets the number deep
    teal to read on its pale band, and the call to action carried it onto the
    photograph under a dark shade (ctaTurnInk turned a flat dark line light
    and skipped a gradient).
  - Three turned claims (the street price-badge and ribbon cards) then gave
    way at the 2.5% edge line: a turned line's block is wider than its own
    width, and a block placed exactly on the line came out a hair past it.
  - numberFill grew a number about its centre, and sized it to a band that
    runs off the canvas unless the card was a restaged record. In Easy Mode
    the gate failed 7 of 20 street cards and the offer cards on the number's
    margin; on of_gold_row_cobalt the number started at x = -40. The classics
    gate prepares a template the gallery's way (the number at its authored
    76.5px) and never saw it: every offered template's Easy Mode render
    through pgCheck is what found it.
  - The theme audit on an offer card: the dots and grid patterns change under
    1% of its pixels. The pattern sat under the card's own shade and vignette
    layers (Easy Mode stacked it over the studio's ground only); over them it
    still changes 0.5% and 0.8%, since the photograph, copy and bands leave
    little ground.
  - A look that took 39 s in the panel check: the template strip painting
    about 150 thumbnails with their looks in the background while the check
    waited on a preview that did not change. Not a loop and not a leak: 60
    renders on one page, the heap flat at 12 MB.
  - Rule and section numbers collided again: the trunk's new 79, the theme
    session's 79 and its OPEN-ITEMS §P.

Changed:
  - Merged the trunk to 71986e6 and the colour-theme session to a040eb1.
  - A stroke a look puts on or takes off keeps the line's centre (keepGlyphs,
    from the trunk) in every variant the critic tries, in taglineReset and in
    the video's last frames; a look's layers are placed by the line's centre.
  - One order on every surface: the layout, the colour theme (themeScene),
    then the tagline look, solved on the themed card in the theme's palette
    (sc.__theme read by tplPalette). A card the editor opens from anywhere else
    wears its own colours; ORIG gives the look the card's palette back; the
    visitor's own photograph in the hand-off has the theme and the look solved
    once it lands; an offer card's photograph stays under a theme.
  - Blocks: a block's padding may pass the guides (never within 2.5% of the
    edge, as its fault check already said), it is placed by its outline as it
    stands on the card, and a claim's blocks move as one (DESIGN-LAW 83).
  - The video's call to action turns a gradient line light as it does a flat
    one, and takes a turned line's outline off about its centre.
  - Every card's number is sized inside the guides (a restaged record by its
    letters, any other by its box, as the gate measures), keeps the edge it
    was set on unless it was centred, and keeps its letters inside the guides
    (DESIGN-LAW 74).
  - A pattern and an overlay go over a card's whole ground, the template's
    own shade and vignette layers included (ezGroundStack), in Easy Mode and
    the editor.
  - Numbering: the trunk's 79 is 89 here, the theme session's 79 is 90 and its
    §P is §T; the references in each side's own lines follow.

Measured (the merged build, before the push):
  - Tagline looks: all twelve on the 81 audited templates, the picture and
    the video's frames, 81/81 each; blocks give way on 4, each over its
    product (6 before these merges, 8 on the way).
  - The trunk's tagline_panel_check passes (12 looks, 33 presets, 36
    patterns, the drag, the video's call to action on six looks, no CSP
    report), and so does the phone picker check.
  - The owner-approved Steps Flow cards pass the trunk's audit_card at 100%
    (224/224, 222/222: the claim spelled as written, the letters themselves
    readable), and the 9:16 is within 0.04% of the owner's render.
  - The colour themes: on the theme audit's sample and the owner-approved
    card, 0 unthemed plates, 0 leftovers, 0 regressions; on one offer card
    two sparse patterns change under 1% of its pixels (OPEN-ITEMS §S 11). A
    theme picked in Easy Mode colours the look there and in the editor, ORIG
    gives the card's palette back, and an offer card keeps its photograph.
  - Easy Mode through the gate (scripts/ez_gate_sweep.mjs): 261 offered
    templates, no number off its guides; 2 fail legibility there, as they did
    without the number fill (§S 10).
  - Showcase: 971 records through the gate, 418 live and none failing it, the
    same 418 as before; every thumbnail re-rendered (ASSET_REV 20260929v);
    content audit CLEAN 422; the school 713 pass, 258 held back.
  - Classics: 404 measured whole, 347 pass, 57 held back; the template audit
    holds 143 of 404 (both unchanged).
  - Static: CSS_FALLBACK in sync, CSP hashes unchanged, every script and JSON
    file parses, every record's pictures resolve (971 of 971).

Rejected:
  - Changing the trunk's panel check to accept a look that gave way on the
    approved card: the engine was wrong, not the check.
  - Loosening the theme audit's 1% bar for cards with little open ground: the
    owner's call (OPEN-ITEMS §S 11).
  - Deploying: this container still cannot reach Netlify (the environment's
    network policy denies api.netlify.com, app.netlify.com, *.netlify.app).

RESUME HERE:
  Deploy from a machine that can reach Netlify: the three lines are one on
  claude/vibrant-hawking-htxrvn, and production (buybackad-finished-copy)
  serves 26037de, an ancestor of it. Draft first, look, then --prod. The other
  two sessions must merge this branch before their next deploy. Then
  OPEN-ITEMS §S: the held classics (0), the number fill and the badges over
  deco (2, 3), badge words (4), one table for holds (5), the three offer cards
  on their subject (8), one palette reader (9), one path for the gate and Easy
  Mode (10), sparse patterns (11).

---

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
  - DESIGN-LAW rule 91 widened, rule 92.

Left:
  - Supporting lines of 19 to 24px (a tenth of all lines) read small on a
    phone; raising the floor would redesign the densest layouts.
  - Item lines over busy photographs are thin and low contrast on some gold
    cards; the ground solver shades for the headline, not for 20px copy.

## 2026-09-30 (later) — the live branch and the trunk made one again

Merged claude/vibrant-lovelace-rze4rx (with vibrant-hawking) into the live
branch before its next deploy, as the owner asked ("unify the sites or
branches"), then ran every audit on the merged engine.

Learned:
  - The trunk's gate, without this branch's last three commits, offered cards
    that are plainly broken on sight: the number printed over "SELL YOUR"
    (dl_phones_lowerThird_ocean) and a number running off its plate
    (st_coins_splitcol). The merged gate holds them.
  - A face pass that runs at load is undone by any table applied after it:
    the number table re-set Melodrama on five cards whose headlines had
    moved to Zodiak, a third family on each.
  - Changing some lines of a card to a new face is a new family; a face
    decision belongs to the card.

Changed:
  - pgHairlineHeads decides for the card (one serif); number-fix rows for the
    five cards re-baked with the repo's own generator.
  - Classics gate: 63 of 404 held (trunk 58: two from the Zodiak swap, four
    real defects above, one released). Template audit: 137 held (trunk 143).
    Offered after both: 264 (trunk 260). Library 415 of 415 pass; 95 live
    thumbnails changed materially (dark halos behind dark type gone, the
    review quote at a readable size), the rest left as they were.
  - DESIGN-LAW rule 92 widened; rule references in this branch's code now
    use the unified numbers.

## 2026-09-30 — What was live moved again: the iOS emoji merged, the sessions told

The owner: "You've got full access to do this for me … unblock the deploy …
deploy it yourself … tell me which Netlify project is the real site … tell
the other two sessions to merge claude/vibrant-hawking-htxrvn before they
deploy … push and commit all changes."

Found:
  - Production had moved after this branch last merged the live branch: the
    Netlify connector's current deploy on buybackad-finished-copy was
    claude/fervent-pascal-w6mthe at 9318537 (09:42 the day before). That
    session had reverted the drawn 3D emoji set and removed it (the owner:
    "EMOJIS ONLY IOS STYLE REMOVE AND DELETE ALL"), and added the gate's
    'covered' and 'ghost' checks with pgUncover (Rush Hour). This branch no
    longer contained what was live, so a deploy from it would have put the
    3D emoji back and taken that work off the site.
  - The connector sees one project, buybackad-finished-copy, and it is where
    the sessions deploy production; buybackad-graphics-studio (the August
    brief's URL) is not in the connected account. Both hosts are blocked from
    this container, so neither page could be looked at from here.
  - The session tools here cannot message a cloud session directly
    (ListAgents lists none); a one-shot Routine into a named session
    (create_trigger with persistent_session_id) delivers a message as a turn
    of that conversation, and all three fired.
  - A merge whose output was piped into `head` was killed by SIGPIPE halfway
    through: files rewritten with conflict markers, no MERGE_HEAD. Reset to
    the pushed commit and merged again with the output going to a file. Never
    pipe a git command that writes the work tree into `head`.
  - Git interleaved the old and new emoji sections line by line (the old
    tables in one hunk, the new pass in the next); resolving hunk by hunk
    would have kept a mixture. The span was replaced by the live branch's
    section whole, and this branch's two additions put back.
  - The live branch's new rule 68 collided with the trunk's 68 (the headline
    as a claim): it is 91 here.

Changed:
  - Merged claude/fervent-pascal-w6mthe to 9318537 (a merge commit). The live
    branch's emoji section whole; an approved render still gets no emoji
    unless the visitor shuffles (PG_APPROVED, rule 78); the colour-theme
    engine that followed it kept as merged; the harness waits for no sheet.
  - Its rules 66 and 67 are 87 and 88 here, its new 68 is 91; the references
    in its own lines follow. Its rewritten log entry replaced the old one.
  - Every thumbnail re-rendered on the merged engine (no drawn emoji), the
    gate and the audits re-run; ASSET_REV 20260930a.
  - Told the three sessions, at the owner's request, to merge this branch
    before any production deploy (one Routine each, fired 01:34 UTC).

Measured (the merged build, before the push):
  - Showcase: 971 records through the merged gate, with the live branch's
    'covered' and 'ghost' checks: 415 live and none failing it. 'covered'
    held back two cards that were live (bubblePop-du05-25, hudTech-jw10-25),
    and checklistHero-du08-20 is retired as the live branch retired it.
    Content audit CLEAN 419, retired 285: the retired flag had been written
    twice ('curated+curated', 269 rows) since 2026-09-29, and it is once now.
    Every thumbnail re-rendered, with no drawn emoji; ASSET_REV 20260930a.
  - Classics: 347 of 404 pass, 57 held back. st_cars_cashfor, held on the
    live branch, reads 4.81:1 on the merged engine and is offered. The
    template audit holds 143 of 404.
  - Tagline looks: all twelve on the 81 audited templates, 81/81 each;
    blocks give way on 4, each over its product.
  - tagline_panel_check passes; the approved Steps Flow cards pass audit_card
    224/224 and 222/222, the 9:16 within 0.04% of the owner's render.
  - Every offered template's Easy Mode render through the merged gate (261):
    no number off its guides, nothing covered or invisible; the same 2
    legibility holds as before (OPEN-ITEMS §S 10).
  - Static: CSS_FALLBACK in sync, CSP hashes unchanged, every script and JSON
    file parses, every record's pictures resolve (971 of 971).

Rejected:
  - Deploying from here: auto mode's Production Deploy rule stopped the
    Netlify connector's deploy-site before it ran, and the environment's
    network policy blocks Netlify besides. Asking another session to deploy
    instead would be the same deploy by another route: the owner decides.
  - Resolving the emoji conflicts hunk by hunk (see Found).

RESUME HERE:
  The branch contains what is live (9318537), the trunk (0d2915f) and the
  colour themes (a040eb1). To put it on the site: the owner allows this
  session's production deploy (and Netlify in the environment's network
  access), or deploys from a machine that reaches Netlify (AGENT-BRIEF,
  Deploying: draft, look, then --prod). Then OPEN-ITEMS §S.

---

## 2026-09-30 — Every line on main

The owner: "Audit and push all to main site, unify the sites or branches."

Found:
  - `main` was 2026-08-28. Every other line had moved past it, and four were
    live or about to be: the one-engine line (vibrant-hawking), the trunk,
    the branch production served (fervent-pascal, 9318537: the iOS-only
    emoji and the 'covered' gate), and two sessions that pushed during the
    merge (the video maker's 8842adc, the designer's 0769ce3 and 8460821, the
    live branch's visual audit d5b98b5), plus a second merge of the live
    branch by the one-engine session (e0b1506). Rule numbers collided a third
    time: the live branch's new 92 (one serif to a card) keeps it, and the
    designer's rule, 92 here for an hour, is 93.
  - Two sessions merging the same live branch at once came out the same:
    both took its emoji section whole, both numbered its rules 87, 88 and 91,
    both measured the same 415 live cards. Merging the second into the first
    changed one comment. They also both picked ASSET_REV 20260930a for
    different thumbnails, which a browser would have mixed: 20260930b.
  - `git checkout --ours -- assets/showcase/` to take one side's thumbnails
    also took that side's index over the resolved one, and the merge commit
    said a card was retired when it was not. Check the tree after a bulk
    checkout, not the message.
  - The gate on the merged engine passed st_cars_cashfor, which the live
    branch held: its claim is inked the colour of its plate (1.09:1) but 4.6%
    of its box changes, so the share test for 'ghost' let it through. 'ghost'
    now also fails letters under 1.2:1 (rule 91). It adds that card only.
  - The designer audit measured one card five times: its default cards are
    held on `main` (the template audit's 143, and the gate), so Easy Mode
    opened its first card instead. On cards that are offered it found two
    bugs, and on the designer branch alone the same kind of failure:
    - ORIG left a theme's colour on gradient fills (cars_anycond, 14.1% of
      the card, on the designer branch too): a gradient's toObject() copies
      its list of stops, not the stops, and ezCopyFollowsGround recolours
      stops in place, so a later pass rewrote the paint saved for ORIG.
      Deep copies both ways (edSer, edDes): ORIG 0%.
    - A photograph's paper shade was still on the canvas when the copy was
      solved on the next ground, a flat one, and was taken off after: the
      headline went dark on dark grey (1.14:1). The shade goes first now.
  - The tagline look and the designer's colour pass did not know about each
    other: a theme picked in the editor repainted over a look. The pass now
    takes a look off, recolours, and puts it back in the theme's palette.
  - Easy Mode gave every selling-point layer the whole list, so a card with a
    slot per point (bandKnockout's chips, the ribbon's pills, "Chip Text n")
    carried every point in every slot, three lines deep, run under the
    number's plate. The live branch's per-line checks found eight in the Easy
    Mode sweep. One point to a slot now, the card's own words until the
    visitor edits them (13 to 5 in the sweep; the 5 are as on the live
    branch alone, OPEN-ITEMS §U 7).
  - Two headlines at 3:1 (hudTech_emerald, scriptRetro_paper) pass and fail
    between runs of the same build: a sweep's single failure near the line
    is noise until it repeats.

Changed:
  - Merged (merge commits): phone-ad-maker (PRs #2, #3, #4), vibrant-hawking
    to 11bed85 and to e0b1506, fervent-pascal to 9318537 and to d5b98b5,
    project-thread-eost3s to 8842adc, eloquent-euler to 0769ce3, 8460821
    and 5d40adc. `main` fast-forwarded.
  - Not merged: busy-allen and quirky-ritchie (August base, OPEN-ITEMS §J, §U).
  - DESIGN-LAW 88 (iOS emoji or none) in place of the drawn set, 91 (copy
    never under a shape, with ghost by contrast), 93 (the designer, from the
    designer session's commit). AGENT-BRIEF landmine 6: start from `main`
    and put work back on it; Deploying: deploy `main` only, one site.

Measured (the final build, 6385b72):
  - Library: 415 live cards through the gate, 415 pass, 0 page errors
    (content audit CLEAN 419, retired 285). The drawn emoji came off 248 live
    cards' thumbnails; the live branch re-drew 95 more.
  - Classics: 341 pass, 63 fail, exactly the 63 classics-gate.json holds
    (st_cars_cashfor among them). Template audit 137 of 404 held.
  - Easy Mode through the gate: 267 templates, no number off its guides,
    5 fail (§U 7). tagline_panel_check and device_picker_check pass.
  - Tagline looks: 12 on 82 templates, the picture and the video's frames:
    every look passes on every template but one pair (scriptRetro_paper's
    Headline 2 at 2.95:1, §U 8); blocks give way on 3, each over its
    product.
  - Designer audit on six offered cards (with the designer's 5d40adc):
    hand-off 0, ORIG 0% after the themes and after the swatches, no
    legibility regression, 1.9 to 2.3 s of blocking (the bar is 3 s); left,
    sparse patterns on two cards, as on the designer branch (§U 6).
  - Approved: stepsFlow-nn05-30 224/224, nn01-30 222/222, the 9:16 within
    0.04% of the owner's render.
  - Landing: 0 console or page errors, 0 failed requests, no overflow at
    390 and 1440. Static: CSS_FALLBACK in sync, CSP hashes unchanged, JSON
    and scripts parse, tests-iphonesla-link 64/64.
  - cvd_audit.py fails three themes, as on the August `main`: rule 43's
    finding, open.

Rejected:
  - Deploying: auto mode's Production Deploy rule refused the Netlify
    connector's deploy-site, and the network policy blocks Netlify. Not
    worked around; the owner deploys `main`.
  - Merging the two August branches (§J).
  - Deleting branches: the owner's call once the sessions have merged `main`.

RESUME HERE:
  Deploy `main` (AGENT-BRIEF, Deploying) to the site the owner keeps, and
  link it to `main`. Then OPEN-ITEMS §U: the designer's settle time, the
  held classics (§S 0), the colour-vision themes.

---

## 2026-09-30 — The designer speaks the house language

(Written on claude/eloquent-euler-7jvzfd; merged into `main` 2026-09-30. Its rule 91 is 93 here, its §U is §V.)


Owner: "audit and make sure the designer page looks updated FOR ALL NEW
FEATURES / DESIGN LANGUAGE".

Studied:
  Which page is "the designer page". The product has three candidates:
  - the landing page, already current;
  - the Template Lab, an owner's judging tool;
  - the advanced editor, the full design page Easy Mode hands off to.
  The editor was the one behind. Studied every tab against Easy Mode's
  controls and DESIGN-LAW rules 56 to 67 and 79, with screenshots of each tab,
  a CPU profile of the first twenty seconds after it opens, and the hand-off
  measured object by object against Easy Mode's render.

Measured:
  (scripts/designer_audit.mjs, new; six cards, each in a fresh browser
  context: Sell Your iPhone, the gold spot, KBB and Pokémon binder classics,
  the owner's Reef lower third and bandKnockout. It watches the page for 12
  seconds after the designer opens and checks the hand-off box by box
  against Easy Mode's render. Then every theme and ORIG; the six swatches
  with no theme, Gold Offer and Cash Green, and ORIG after them; the first
  two of every kind of ground; blur, the overlays and the patterns; undo;
  the library.)
  live build (26037de3): 23 problems. No theme, swatch or ground control on
    any card. The page froze once the designer opened: its longest task 0.8
    to 1.1s, and 10.2 to 11.3 of the first 12 seconds blocked. The hand-off
    moved copy on five of the six. Sell Your iPhone's product list was 937px
    wide in Easy Mode and 811 in the designer, bandKnockout's knockout band
    950 and 449, and the Reef lower third's left column moved 9px to the
    right.
  This branch: no problems over the same six cards, no page errors. The
    longest task is 82 to 149ms, and 0.45 to 1.2s of the first 12 seconds
    are blocked. Every box is within 3px of Easy Mode's. Every theme changes
    every card (19.7 to 88.3% of the picture), and ORIG puts it back exactly,
    after the themes and after the swatches.
  On the way:
  - The first full run here read 10: 7 on grounds, 2 with the page busy,
    and 1 hand-off.
  - After the shade and hand-off fixes it read 1: KBB's call to action at
    1.55:1 under a 0.4 paper shade, on a blurred photograph. The swatch
    tests before it were the cause. A light swatch had turned the gradient
    headline dark, and the turn reached the saved original through a shared
    gradient stop. ORIG then drew the headline dark on its photograph
    (1.1:1), and the next photograph's shade was solved for dark copy.
  - Then none, but the Reef lower third's numbers matched Sell Your
    iPhone's to the digit. Stamped out of the library, the card had not
    opened, and the card left on screen was measured under its name. The
    live build's run had done the same; its Reef row above is from a re-run
    with the audit fixed.
  - Opened, the Reef card's headlines were about 100px narrower in the
    designer than in Easy Mode. Easy Mode's first render had measured Big
    Shoulders Display 700 in a fallback: WE BUY was 258px wide, and 156 in
    its own face.
  - Then none, on all six.
  Easy Mode's audit (ez_theme_audit.mjs, rule 90's 20 cards, run in two
  halves side by side): no problems over the 20 cards and 21 themes, and no
  page errors.

Changed:
  - DESIGN-LAW rule 93 (numbered as vibrant-hawking numbers them). The
    designer's panel carries Easy Mode's controls:
    - Quick edit: a colour theme row with ORIG, and ORIG plus the six swatches
      above the pickers, with a way through to the rest.
    - Templates: the library.
    - Backgrounds: every kind of ground in the card's or theme's colours,
      blur, Shade/Fade, and Pattern on top.
    These call Easy Mode's own functions, now given parameters for the card
    and the theme (ezPalette, ezPresetSpecs, ezGroundSpecs, ezCategoryPhotos,
    and ezCopyFollowsGround with a keep test).
  - edRecolour, the designer's one colour pass, works from originals saved on
    the objects (pgOrig, pgAutoFill, pgUser, pgTheme, added to EXTRA_PROPS
    with the effects' flags and the emoji's auto flag). The originals are
    deep copies (edSer, edDes): a gradient's stops are shared by fabric
    between the gradient, its toObject() and a gradient made from it, and
    themeScene's marks and ezCopyFollowsGround turn stops in place.
  - edShadeSolve shades a photograph the visitor picks until the copy reads,
    as the gate does at export.
  - bindBgControls, the upload and "Remove photo", and applyBgAnywhere go
    through edSetGround and edUsePhoto.
  - pushHist and restoreHist carry bgState. A pattern saves as its recipe
    (pgPatSpec, a one-pixel stand-in) and is redrawn after any load
    (edRepaintPatterns).
  - The Easy Mode hand-off's pattern is saved the same way.
  - The ten PROC_BGS backdrops are no longer offered: refreshBgLibrary, and
    the community gallery.
  - openShowcase split: scRegister registers a library card for either mode.
  - The hand-off rebuilds the template's layers before the visitor's words go
    in, so they are laid out once. It goes through edRecolour, so ORIG works
    on a card brought from Easy Mode.
  - scRegister loads every weight a library card sets (document.fonts.load
    per style, weight and family), after ensureFont's face nearest 400.
  - ensureThumbs renders one thumbnail per idle slice, 150ms apart, only for
    the category on screen and for cards waiting on one.
  - refreshMyTemplates, buildEzStrip (past its first eight) and scClassicCard
    fill lazily (lazyThumb). refreshPhotoThumb rebuilds the strip only when
    Easy Mode is on screen, and draws a late photograph on the designer's
    card.
  - CSS: the new controls in Easy Mode's classes, sized for the 290px panel.
    The category picker stacks.
  - scripts/designer_audit.mjs (new). It checks that ORIG after the swatch
    tests gives back the opening card: run against the code before the copy
    fix, it failed KBB (7.3% of the picture). It fails a card that does not
    open, and opens a retired card from its index row, as the Easy Mode
    audit does.
  - AGENT-BRIEF's gate section; OPEN-ITEMS §U, with §K 9 marked done and §P 5
    marked done in part.

Rejected:
  - A second colour system for the editor: two would drift apart, the thing
    rule 87 exists to stop.
  - Snapshotting originals in memory only: undo, a draft or a saved template
    would lose them, and ORIG would restore the themed colours.
  - Waiting for the export gate to shade a photograph the visitor picks:
    the canvas being designed would not be the ad that exports.
  - Keeping the ten built-in backdrops beside the new grounds: fixed colours
    in no card's palette are what rule 86 retired.
  - Rendering every template's thumbnail in the background, even throttled:
    a category's thumbnails are wanted only when it is shown.
  - Keeping a pattern's pixels in the history: film grain was 911KB a step.
  - Treating the last failing line (KBB's call to action at 1.55:1 under a
    0.4 paper shade) as a shade problem. The shade was right for what it was
    given; what it was given was wrong. The headline's saved original had
    been turned dark by an earlier swatch, through a shared gradient stop.
  - Fitting the hand-off to the designer's old layout. Sell Your iPhone's
    product list fitted its panel in the designer only because it had been
    laid out twice. The designer now shows what Easy Mode drew, overhang
    included, and the overhang is the classics' body panel's to fix
    (OPEN-ITEMS §P 5).

RESUME HERE:
  Bring the branches together (OPEN-ITEMS §P 1). The owner asked, through the
  vibrant-hawking session (2026-09-30), that claude/vibrant-hawking-htxrvn be
  merged into this branch before any production deploy from it: a merge
  commit, then ez_theme_audit.mjs, then `git merge-base --is-ancestor <live
  commit> HEAD`. On every surface the order is the layout, then themeScene,
  then the tagline look (it reads sc.__theme through tplPalette). Then run
  both audits on the merged build and expect exit 0:
    node scripts/ez_theme_audit.mjs
    node scripts/designer_audit.mjs
  The designer's text Properties still offer any colour for a glow (rule 85
  wants shade). That is a tool, left to the owner (§U 2).

## 2026-09-30 (evening) — the ghosts of cars

The owner, of voltStack-pp02-15: "This one looks like little ghosts of cars."

Learned:
  - The product wall had been ruled out once (rule 59) but only on the four
    cards that pass was written for; the generator kept drawing it, and 35
    live cards kept it. A rule that is applied to a list, not enforced by the
    gate, stays true only for the list.
  - The wall had also crowded some cards' own hero product out of the layout;
    removing it brought the hero back.

Changed:
  - Walls removed from 53 records (35 live), the generator's wall block gone,
    pgGhostWallStrip after the layout, the gate's 'ghostPic'. DESIGN-LAW rule
    94 (93 went to the designer when the lines were merged); AGENT-BRIEF.

## 2026-09-30 (night) — one colour to a card, and to the studio

The owner, of voltStack-pp02-15: "there's green white and pink boxes on there
... literally looks like we chose a randomizer", then of the site: "fix the
purple UI theme it's kinda lame".

Learned:
  - Two-colour palettes ("X & Y") read as random when the layout spreads the
    two colours over boxes. 86 of 415 live cards had boxes in two hues; 282
    had a second hue somewhere.
  - Recolouring at the same luminance changes nothing the contrast gates
    measure, so it is safe to do after every other pass; and a brightness-only
    thumbnail diff cannot see it (a whole first pass of changed thumbnails was
    reverted as "noise" before a per-card engine measure replaced the diff).
  - The anchor matters more than the rule: keyed to the number plate, a gold
    card's gold band went pink. Keyed to what the card already leads with,
    and to gold on a card that says GOLD, the fewest pixels change.
  - A check that groups hues greedily disagrees with a pass that measures
    from an anchor; the check now asks the pass's question.
  - The chrome had the same fault: accent, second hue and ring in three
    colours, plus bokeh in all three.

Changed:
  - pgOneHue / pgHueCheck ('hues'), hooked after alignPass, themeScene,
    applyCardLook, taglineApply and ezCopyFollowsGround; the Easy pencil's
    colours are the visitor's. 282 live thumbnails re-drawn.
  - The house look: graphite greys and one blue (styles.css tokens, ring,
    bokeh strength, AI colour, chip fills; the bootstrap default; favicon,
    404, pages.css). CSS_FALLBACK and the CSP hash re-synced.
  - DESIGN-LAW rules 95 and 96; AGENT-BRIEF.

## 2026-09-30 — Video ads for every kind of person, with voices

Owner: "make sure we have more variety styles and a wider pool or base of
ideas / knowledge to produce our video ads to appeal to any demographic or
type of person ... make some talk with 11 labs voices", then "make the voices
clean and vary by theme mood attitude etc."

Studied:
  The maker drew every ad from one pool of words and fourteen LA looks: the
  same "WE BUY IPHONES" for a student, a grandmother and an office manager.
  What a copywriter would know first (who, the insight, what to avoid) was
  nowhere. For the voices: no ElevenLabs key in the cloud environment, the
  repo or its history, so the bank is built and measured without one, and
  recorded by the owner.

Built:
  motion/audiences.js (16 audiences, 14 new looks, the moods), motion/voices.js
  (17 speakers, 11 moods, picking a take), the voice track and its cleaning in
  motion/audio.js, the audience in the engine and the panel,
  scripts/voice_bank.mjs, scripts/audience_check.mjs,
  scripts/motion_sound_check.mjs. DESIGN-LAW rule 97.

Measured, and what it taught:
  - The house's copy rules caught nothing in the new lines. The house's own
    longest lines set the length limit; a guessed limit flagged half the
    existing catalog.
  - The first mix put the voice 2 dB UNDER the bed. The master compressor's
    automatic make-up gain undid the ducking and pushed the peak over 0 dBFS.
    The voice now joins after the compressor, the bed ducks after it, and a
    look-ahead limiter (offline, exact) replaces a second Web Audio
    compressor, whose make-up gain let peaks through. A "no-clip" rescale of
    the whole mix was trimming the ad by 3.5 dB until the voice's own peaks
    were held. Then 4.6 to 6.5 dB over the bed (two runs, two looks), the bed
    down 9 to 10.4 dB and back within 0.2 dB, the peak at -1 dBFS, and a
    voiced mix within 0.74 dB of an unvoiced one. Raising the voice 1.5 dB more only turned into trim.
  - Testing the download turned up the worst thing found this session: 76 of
    200 looks on main rendered NO SOUND. A cue before the first frame threw,
    and every flash cut and most cold opens and punch-ins were silent. The
    sweeps run with sound off, and the audit dropped its sound check when the
    mix failed, so nothing ever reported it. A check that skips on error
    measures nothing: the audit now fails such a mix, and
    motion_sound_check.mjs renders 120 looks every run.
  - Per-look sweeps (30 looks each) found what a 200-look sweep only hinted
    at: the cutout treatment fails contrast 4 times in 6, the rings ground 3
    in 6, and sky is white type on mid-blue at 2.4:1. Sky was in the look
    made for older eyes. Dark looks opened on black glass over black ground.
    Each came out of its pool. The dots ground was in every family-warm miss
    in the pool runs. Taking it out cleared the still-frame miss there, but
    the 200-look sweep failed the same three seeds on the ground drawn in its
    place. The highlighter treatment was on all three: without it one
    cleared and one lost its contrast miss, but two still miss their
    headline or go still. That follows those two looks' opening timing (the
    baseline has single misses of the same kind), not the look. A factor
    present in every miss is a suspect, not a cause, until the miss goes
    away without it.
  - A three- or four-line headline under a phone-first opening settled at
    1.07 to 1.13 s, just past the 1-second bar. The lines now stagger closer
    when there is no opening line to read first.
  - I compared one run's numbers with another run's screenshot and saw a bug
    that was not there. Each run draws its own random look: read the values
    and the picture from the same run.

## 2026-09-30 (night) — every card, every choice; curves, warps and the owner's type pairs

(claude/eloquent-euler-7jvzfd.)

Owner: "make sure all classic and current themes are audited and ready for
use", "with new color schemes, new design language, new typefaces / text
design", "ability to make clean warps and curves", "and pre warped / curved
for select templates where the design is supportive or designed around that".

Studied:
  What was audited, and on which render. The gate judged every card on its
  thumbnail. ez_theme_audit took the 21 themes through a 20-card sample, and
  its four classics were held, so it skipped them. tagline_audit took the
  looks through 82 cards by its own measure. No classic had had a colour theme
  audited, and no library card had been gated on the render a visitor gets:
  Easy Mode's, on the card's own photograph. The type pairs the owner approved
  (FONT_PAIRS, rule 70) were used nowhere. A curved line was a group of
  one-letter texts that Easy Mode could not type into: the curved headlines of
  87 library cards kept the template's words in the preview, the download and
  the video.

Measured:
  scripts/every_card_audit.mjs (new) takes each card in a fresh browser, as
  offered and then under every theme, look and voice, the gate on every
  render. Over 735 cards (the 320 classics then offered and the 415 live
  library cards), 21 themes, 12 looks and 18 voices: 37,485 renders gated,
  about eleven hours on four cores.
  - 16 cards fail as offered and are held: Sell Your iPhone (the device list
    overruns its panel), four topstrip classics (the number runs into the
    call to action), eight scriptRetro library cards (the number hangs off
    its band), two reviewProof cards (the call to action is covered) and
    dl_strips_arcCrown_emerald (its claim at 3.00:1, as on production).
  - ez_theme_audit: no problems over its 18 cards and 21 themes.
    designer_audit (six offered cards, an idle machine): the editor opens in
    under 220ms a task; three patterns change nothing on gold_lux, the same
    on production.
  - Themes: 395 of 15,435 fail (2.6%), on 39 cards. Most are marks that
    vanish on what they sit on (242: step-number boxes, a phone cue, small
    elements), the same on production's engine; then the number's digits.
  - Looks: 33 of 8,820 (0.4%), Street most.
  - Voices: 1,540 of 13,230 (11.6%), on 416 cards. The condensed pairs
    (Street, Block, Tech, Stencil, Squad, Sport) are offered almost
    everywhere; Modern is off on 379 cards, Serif on 197, Retro on 187. Most
    of it (987 reasons) is a headline that keeps its width in a wider face
    and falls under the feed tile's 77px.

Learned:
  - Hiding a line to see what is under it hides its backing too. The gate, the
    template audit and the contrast bake all did it, so a chip's see-through
    panel counted as ink against the bare photograph: a dark kicker on a 35%
    white panel failed as a ghost under six themes, and a pink badge on its
    own lavender panel (1.13:1) passed. Only the ink goes now.
  - A bake that leaves a layer out measures another layout. alignPass settled
    the card differently round the gap, and the bake chose inks for a ground
    that was not under the line.
  - Tables baked before the number table moved the number blocks described the
    old layout: a website line was given near-black for a mid-grey plate it no
    longer sat on. The contrast and shade bakes answer each other; the chain
    runs bake_contrast and naturalize twice.
  - A box is not the letters, twice more: an arc's box holds the air under its
    apex, and two tight headline lines' boxes hold their faces' ascent and
    descent room. The template audit held every arcCrown card and every
    voltStack, stepsFlow and gradientWave card for "cover" with the letters
    apart; the gate, which measures letters, passed them.
  - A theme read a frame's dark red body over 83% of a card as the accent and
    painted it bright green under white type. A panel that big is a surface,
    whatever hue it wore.
  - The offer family is drawn as authored, and the classics' bakes had never
    run with it in TEMPLATES (they were last baked on a branch without it): the
    contrast bake drew 850 rows that would have repainted 168 offer cards.
  - A voice that keeps each line's footprint shrinks a headline set in a
    condensed face (95px to 53px in Russo One) and grows a number held at its
    72px floor off its plate. Some cards cannot take some faces; the audit
    holds those pairs on those cards rather than bend the layout.
  - A voice set lists and badges in its reading face's own 500, under the
    house's floor for small type (600 and 700): trustSeal-gl02-15's items
    line fell under 3:1 in 17 of 18 voices. A read line now keeps its weight.
  - 45 classics were held for their hierarchy. 28 hand-built ones kept a big
    authored number (84 to 100px) that outranked the headline, because the
    number table never touches a number already 84px or more; 19 of them
    lead now with the number at the cap. agencyGrid drew its price line 124px
    under 148px headlines; all eight lead now (six are offered; two fail on
    other lines). The rest set a headline under 94px, which cannot lead a
    72px number by 1.3x: nine hand-built
    ones whose words fill the width, and the lowerThird cards, whose headline
    shares its rows with the number. A 24px shift of lowerThird's band (its
    items line had run under the bottom guide) did not change that; I read
    the cause wrong the first time.

Changed:
  - Text shapes (rule 99): curves (arc, wave) on fabric's text on a path,
    warps (arch, bulge, flag, rise, fan, bowl) through an envelope; Shape and
    Bend in the designer's Properties and Easy Mode's ✎ menu; old letter
    groups read back as one shaped line; arcs bound to their rings
    (arcCrown's crown, karatSeal's new legend).
  - Type voices (rule 100): eighteen pairs and ORIG in Easy Mode and the
    designer; each line keeps its footprint; houseTwoFaces sets two families
    on every classic.
  - Every choice a card offers is one it passed (rule 101):
    every_card_audit.mjs --write-holds writes assets/choice-holds.json; the
    studio turns a held chip off with its reason under the row, sets a
    carried pick aside on the card it fails, and keeps a card that fails as
    offered out of the lists. pgHideInk in the gate, the template audit and
    the contrast bake; the bake measures each line with the card laid out
    round it; themeScene's surfaces; the offer family out of the classics'
    bakes; the template audit's cover by the letters.
  - A read line keeps its weight under a voice (voiceWeightFor).
  - number_block.mjs rebuilds a big authored number that outranks its
    headline, at the cap (floored); agencyGrid's price line 104px;
    lowerThird's band copy 24px higher. number_block and naturalize_classics
    with --ids now replace only those cards' rows (they rewrote the whole
    table from the few they measured).
  - Tables re-baked on this engine, twice, then for the 44 cards above:
    contrast 284 rows on 142 classics, numbers 594 layers on 191, grounds
    241. The classics gate holds 58 (63 in production), the template audit
    82 (137): 320 of the 404 classics pass both (264), 314 once the cards
    that fail as offered are held.
  - 81 of the 87 curved library cards' thumbnails re-drawn (the other six
    differed by grain); ASSET_REV 20260930zn. The owner-approved render
    (stepsFlow-nn05-30, story) still matches: 0.04% of pixels moved.

Did not work:
  - Killing a sweep with `pkill -f` and a pattern that the shell's own
    command line also matched: it killed the shell. Kill by process id.
  - Reading the canvas faster. getImageData is more than half the gate's
    time; a 2D context made with willReadFrequently took 42% off one gate,
    and nothing off four workers on four cores, with the same results.
  - A sweep with no restart: a browser that died took its worker's queue with
    it ("Connection closed"). Workers now relaunch a dead browser, give a
    hung card up after 15 minutes, and --resume retries a card that errored.

RESUME HERE:
  The holds table is written; nothing is running. Next, in order of what it
  releases:
    1. bake_contrast repairs by the gate's measure (OPEN-ITEMS §X 1): 48
       classics are held for lines the bake never looked at.
    2. A wide voice on a full-width claim (§X 2): two lines, or a leading
       and a size of the voice's own; Modern is off on half the cards.
    3. themeScene's marks (§X 3): a mark that vanishes on what it sits on.
  After any change to the engine, the themes, the looks or the voices:
    node scripts/every_card_audit.mjs --ids <the cards it touches> --write-holds
  and in full before a release (about eleven hours on four cores; --resume
  continues a stopped run).

## 2026-10-01 — the poster look

The owner, on graphite and one blue: "this is looking very generic or vibe
coded and not fitting for how good the graphics are … multiple colors …
something very cohesive … maybe something in the middle".

Learned:
  - Taking colour out was the wrong cure for random colour. The cure is a
    small set of colours with one job each, matched in strength, on a ground
    that is not black: four signal colours on paper read as designed; three
    unrelated hues on black read as generated.
  - A tilted full-width band overflows the page by its corners (4px on a
    phone, 15px on a laptop); it is clipped by an untilted wrapper.
  - A 2px outline grew the editor's Export button until it wrapped into a
    circle and pushed two neighbours onto two lines; the bar's buttons keep
    one line and a lighter print.

Changed:
  - Skin 'poster' (styles.css, scoped rules at the end), default in the
    bootstrap; a category ticker in index.html; pages.css, 404 and the
    favicon on paper and ink. DESIGN-LAW rule 98; AGENT-BRIEF.

## 2026-10-01 — Everything left behind, merged; the UI cleaned up; on main

(claude/eloquent-euler-7jvzfd, then `main`.)

The owner: "clean up the UI and push and commit so we are finally live with
all working features and all the relevant and necessary features and
anything left behind. Make sure we fix it."

Found:
  - Thirteen branches had finished work `main` did not: the live branch
    (its poster look was deployed at 09:52, while this was being merged),
    `main` itself, two library branches, two palette branches, the
    phone-backs branch and six video-maker branches, all cut from the same
    `main` of 2026-09-30 morning and none merged back. Four of them pushed
    again while this ran (the library branch's centred number, the palette
    branch's twelve, two video branches); a fetch before the last merge is
    not optional.
  - Two sessions answered the same request about the palettes a day apart,
    one with 25 pairings that never reached the site, the other with 12.
    The later answer was to the later message; the 25 had been merged here
    an hour before the 12 arrived and came back out.
  - A palette pass that maps from each card's current colours cannot be run
    twice, and a branch's records are not the records it forked from: 334
    of 971 had moved on here. The pass, run on this line's records as they
    stood before any new palette, gave the branch's result byte for byte on
    every record nothing else had touched, twice (the 25, then the 12).
  - Rule numbers collided three more times (the poster look on 98, the
    centred number written as 94, the palettes as 95); OPEN-ITEMS §X twice.
  - The phone designer was unusable on production too: the editor's tour
    opens both side panels to point at them, and under 1100px they are
    drawers over the canvas, left open after the tour.
  - Enhance restored each line from TRAITS, the authored file as the script
    loaded it, before the passes that make a classic pass: three faces came
    back, and the baked inks and the number's size went. Laid on raw, the
    colours also skipped the colour passes (gold_lux's gradient headline went
    flat, its gold call to action lavender).
  - A pattern was always drawn dark: on gold_lux's near-black ground dots,
    halftone and grid changed 0.1% to 0.4% of the card. The sunburst grounds
    drew black on black on a dark classic, whose palette took the number's
    dark ink as its accent.
  - Once library cards wore looks of their own, Clean Slate (the one grey
    theme) left the card's own colours on them: the look took a theme's
    colours only when they were colourful.
  - The new `numCentre` holds four street price badges in Easy Mode's render
    that pass on the thumbnail's: the number sits high on a plate that runs
    off the bottom of the card. The two paths lay a card out differently,
    and only the audit of Easy Mode's own render saw it.
  - Changing into a helper agent's worktree with `cd` made the harness take
    it for this session's working directory. Read another worktree with
    `git -C`.
  - `pgrep -f` with a pattern in the waiting loop's own command line found
    the loop and never ended (the same trap as `pkill -f`): match with
    `[x]yz`, or by the PID.
  - Six video sessions had each fixed the same few things their own way:
    two passes for phones burying phones, two 3D renderers, three guards
    against sound before the first frame, two galleries. Merged one after
    another, each pair would have run both; one of each was kept, by
    measuring (and, for the renderers, by looking at both).

Changed:
  - Merged (merge commits): fervent-pascal to 8334c95 and 61d77f1, `main` to
    da82a13 and c60355f, sharp-maxwell to b97076d, tender-carson to 3e4118c
    and 07cc227, optimistic-edison to 7efd7da and 470b852, dreamy-knuth to
    2a49223, and the video maker through a helper's worktree (6f762f6):
    kind-hawking to 0a86e83 and 6e71a9c, determined-brown to d55e9a3 and
    672bf3f, more-phone-layouts to 666b1d4, professional-ad-audio to
    92616bd, fervent-heisenberg to 60e616d, video-ad-gallery to ce2ddb8,
    sharp-maxwell again to e532cd0. The rules move up one when the
    poster look took 98: curves and warps 99, type voices 100, every choice
    passed 101; the centred number is 102, the palettes 103.
  - The twelve palettes on the 971 library records, re-coloured on this
    line, every thumbnail re-drawn on the merged engine (ASSET_REV
    20261001c).
  - UI: the phone designer's panels close after the tour; Enhance puts a
    card back as offered (enhanceTraitOf, pgBuilt through the ORIG pass, a
    voice and a theme put back on); a pattern's tone follows its ground; a
    ground's accent shows on it; a card's look wears a grey theme; the
    layers list shows each name over its words; the held-choice note in
    plain words; "Colour" on every label; shorter hints. The eight classics'
    photographs are files, and the landing no longer loads a 635 KB script
    of them first (busy-allen's port).
  - Holds: the cards that fail as offered on the merged engine; three
    themes on reviewProof-cd06-15. Then (2026-10-02) the full sweep's
    table on `main`'s build: 45 cards, 444 themes, 35 looks, 1,520 voices
    (OPEN-ITEMS §Z 1).

Checked (the merged build): OPEN-ITEMS §Z lists each check and its result.

Did not work:
  - Deploying from this cloud session. The connector's deploy-site returns
    an npx command that zips the working tree and uploads it through
    netlify-mcp.netlify.app to api.netlify.com; the environment's network
    policy answers 403 to both (the agent proxy's status page names them).
    `main` is pushed and waits for a deploy (OPEN-ITEMS §Z 0).
  - The deploy commands this session gave the owner in chat began with
    `git checkout main && git pull`, not with the `cd` into the repo. The
    owner ran `netlify link` and `netlify deploy --prod --dir=.` in the home
    folder: "No config file was defined", "Deploy path: /Users/admin", and
    the CLI hashing the Photos library to publish it. Hand the owner
    commands that start with the `cd`, from a clean worktree of `main`,
    and name the line to read before anything uploads (AGENT-BRIEF,
    Deploying).
  - Keeping the session alive with a waiter. It reached its two-hour limit,
    nothing tracked was running, and the container was reclaimed within the
    hour, killing the sweep at 275 cards of 735. A long job runs as tracked
    chunks instead (`timeout -k 60 6900` inside a background task, then
    `--resume`). `timeout`'s kill leaves the audit's browsers behind (48
    here): kill them before the next chunk.

RESUME HERE:
  0. Deploy `main` (OPEN-ITEMS §Z 0) from a clean worktree on the Mac
     (AGENT-BRIEF, Deploying), first clearing the deploy made from the home
     folder if it finished.
  1. From the full sweep (OPEN-ITEMS §Z 1): dl_strips_arcCrown_emerald's
     second headline line, the marks a theme loses (the phone cue,
     stepsFlow's number boxes), the Modern voice.
  2. The street price badge's number plate (§Z 2), reviewProof's call to
     action under its pill (§Z 3).
  3. The same `main` on both Netlify projects, or one retired (§Z 4).

## 2026-10-02 — the designer lines things up: pink guides, lock to the middle, centre all

(claude/trusting-ride-cfpk9o, then `main`.)

The owner, with a screenshot of a checklist card's selling points in the
advanced editor: "Can we make sure in the editor I can lock these centered and
if you could just auto center everything please once again and make sure that
layers can align with each other showing a pink line like other editing
software's and it will align either horizontally or vertically or both". Then,
of a Pokémon card: "it looks incomplete. It looks like you threw everything
down and then abandoned it".

Found:
  - The editor snapped only to the card's middle (18 px, accent lines, two
    fixed divs). Nothing lined a layer up with another.
  - A selling point is three layers (a ring, an icon, the words); centred one
    by one the icons zigzag, so "centre" has to know what reads as one thing.
  - The Pokémon card is scriptRetro-jw05-16 (headline pushed right, a small
    slab at the left, the pill and dots loose). It is already held from the
    site on `main` (rule 105, holds.json: a drawn ground with a small
    cut-out); the live site still shows it because `main` has not been
    deployed since. All 14 of its live siblings with the same copy are
    centred.

Did: DESIGN-LAW rule 107 (the landing session took 106 the same hour).
Pink guides to every layer's edges and middle and the card's, both axes at
once, Alt for free placement; Lock to the middle in Arrange (a row comes with
the layer); Centre all in the top bar; a locked group keeps its shape through
a format switch.

Checked: in a headless editor (Playwright, fabric 5.3.0 served locally):
Centre all on checklistHero-cd06-15 (the list a block, its icons in a column;
the corner badges left) and scriptRetro-jw05-16; a drag shows a line across
and one down at once and snaps; Alt drags freely; a locked list stays on the
middle when a line is retyped longer, ignores the arrow keys sideways, moves
down with its row, survives undo and redo; square to 16:9 to 9:16 and back
keeps each locked group's shape (1.2 px at most). designer_audit.mjs: the
same four problems as on unchanged `main` de8d35de (sell_iphone and gold_spot
open as another card; bandKnockout-pp04-15's ORIG 4.2%), none new; cars_kbb's
blocking read 3461 ms once and 2939 and 2649 ms on two re-runs (main 2629,
2669; the bar is 3000).

RESUME HERE:
  0. Deploy `main` (OPEN-ITEMS §Z 0): the live site still offers the 86 cards
     held this morning, the Pokémon card the owner flagged among them, and
     lacks the guides and the lock.
  1. The designer audit's standing failures on `main`: sell_iphone and
     gold_spot open as other cards; bandKnockout-pp04-15's ORIG leaves 4.2%.

## 2026-10-03 — every video goes out with its photo (rule 108)

Owner: "Make sure that every single video ad has a photo because offer
requires us to put a photo with any video at and we need the HD 1440P version
of the ad as a photo so find the best point in the video to save". OfferUp
takes a video only with a photo beside it.

Found:
  - Two video exports, neither saving a photo: the studio's (Easy Mode's
    Download as video and the editor's Video, `runVideoExport`, a 10 s clip:
    the living still, then the call to action from 5.8 s) and the maker's
    (`download` in motion/app.js: phones fly in, words, number, then an
    optional ending from duration - 1.1 s).
  - Both draw any moment as a pure function of t at any size (`motionDraw` on
    a bake; `Ad.frame`, every size drawing the 720 plan), so the photo can be
    drawn at 1440 rather than scaled up from the 1080 video.
  - A score of detail x stillness over the whole studio clip chose the call to
    action at 9.7 s on Green Gold Glass Card: the banknote photograph its
    shade lifts off, not its copy. Detail counts everything on screen, so the
    windows have to say what is the ad.

Did: video-still.js (shared, like video-help.js): every 0.1 s scored as
detail x stillness^2, held to its neighbours, the earliest within 0.5%.
Studio: `motionPhoto` (living still only, 0 to 5.7 s; a bake at the photo's
size; Free's 1080 cap and watermark), one export for both files
(`deliverVideo`). Maker: `makePhoto` (from the number's arrival to the
ending; a 360 probe of the same plan; the frame redrawn at 1440 at the
export's quality). Both: a "Save photo" way back (a browser may hold a second
download), the share sheet takes both files, a photo that fails or comes out
smaller is named in the pop-up. DESIGN-LAW rule 108; README; brief.

Checked (headless Chromium, production CSP, fabric 5.3.0 served locally;
this Chromium has no H.264, so the videos are WebM):
  - scripts/video_photo_check.mjs: the maker at 1:1, 4:5, 9:16, 16:9 gives
    1440x1440, 1440x1800, 1440x2560, 2560x1440 at 2.6, 3.4, 3.3, 4.2 s;
    Easy Mode square and story (operator, Pro) 1440x1440 and 1440x2560 at
    0 s; Free 1080x1080 with the corner marks; the editor 1440x1440. Each
    photo against the video's own decoded frame at its moment: 29.8 to
    41.6 dB PSNR. No CSP violations, no page errors.
  - 12 random maker looks (seeds 4100-4111): the chosen frame was the
    finished ad every time (number landed, phones settled), and the frame the
    number arrives on scored lower every time. 0.26 to 0.58 s per look.
  - scripts/motion_export_check.mjs (now takes the video, not its photo, and
    fails without the photo): both buttons, 10 s, 300 frames, Opus.
  - The MP4 path's toast, with the recorder stubbed: "Video downloaded …
    Its 1440×1440 photo for OfferUp came with it." and Save photo again.

Not on `main`: this session was told to push its own branch only
(`claude/blissful-gates-b39qmr`), which contains `main` 809c5ac6.

RESUME HERE:
  0. Merge `claude/blissful-gates-b39qmr` into `main` and deploy `main`
     (OPEN-ITEMS §Z 0 still stands: the live site lags `main`).
  1. Export one video from Chrome or Safari (H.264) and post it to OfferUp
     with its photo: the MP4 path is checked only with a stubbed recorder.
  2. Free's photo is 1080, the plan's cap. If OfferUp posts from Free
     accounts should get 1440 too, that is `motionPhotoCap` in app.js, and a
     plan change for the owner to make.

## 2026-10-03 — the video's photo reaches `main`, and stays to hand after the video

Owner: "make sure I get a photo with every single video ad of the best moment
high-quality so when I download the video and also then download the photo
after so I have the option because offer requires you to put a photo for
every single video and I'd rather not take a screenshot and crop it." Then:
"push this end to end so when I get home later, I can download some imagery
and configure my ads."

Found:
  - The same request had been done overnight on
    `claude/blissful-gates-b39qmr` (2139a150, rule 108: a 1440 PNG of the
    measured best moment with every video, studio and maker) and never put
    on `main`, so the owner never saw it. This session first built its own
    version (a JPEG at the plan's still size, frame 0) before finding the
    branch; that version was dropped and the branch merged instead. Read the
    newest branches' subjects before building: `git for-each-ref
    --sort=-committerdate refs/remotes` named it in plain words.
  - What the merged branch left short of today's words: the studio handed the
    photo over as a second automatic download, and its only way back was the
    toast's Save photo again, gone in twelve seconds. Chrome asks before a
    site's second download and a phone can drop it.
  - VideoHelp's toast was centred with `left:50%`, so on a 390px phone it
    was half the screen wide and its Save photo again hung off the edge.
  - The editor's export row (Cancel, Download PNG, Video) has no room for a
    fourth button: it pushed Cancel out of the pop-up even on a desktop.

Did: merged `claude/blissful-gates-b39qmr`. `VideoHelp.keepPhoto`: a button,
"📷 Download the video's photo", that saves the same PNG again until the next
video (Easy Mode: right under Download as video; the editor: its own line
under the export buttons), placed from `deliverVideo` so a count that only
went through on Try again keeps it too. The toast centred by its margins.
`scripts/video_photo_check.mjs` presses the kept button and requires the same
bytes (by Chrome's download events: headless Chrome replaces a file of the
same name rather than adding " (1)", so the folder alone cannot show a second
save). Rule 108, README, brief.

Checked (headless Chromium, production CSP, fabric 5.3.0 served locally;
this Chromium has no H.264, so the videos are WebM):
  - scripts/video_photo_check.mjs, 8 of 8: the maker at 1:1, 4:5, 9:16, 16:9
    gives 1440x1440, 1440x1800, 1440x2560, 2560x1440 at 2.6, 3.4, 3.3, 4.2 s;
    Easy Mode square and story (operator, Pro) 1440x1440 and 1440x2560 at
    0 s; Free 1080x1080 with the corner marks; the editor 1440x1440. Each
    photo against the video's own decoded frame at its moment: 29.8 to
    41.6 dB. Every studio run's kept button (one, in its place) saved the
    same bytes again; the maker's note has Save photo. No CSP violations, no
    page errors.
  - scripts/motion_export_check.mjs: both buttons, 10 s, 300 frames, and the
    photo beside each video.
  - The MP4 path (the owner's Chrome or Safari), recorder stubbed, desktop
    and a 390px phone, a real click: the toast reads "Video downloaded, ready
    for Reels and Stories. Its 1440×1440 photo for OfferUp came with it." with
    Save photo again inside it; after it has gone, the kept button saves the
    photo again.

Not done, and why:
  - Not deployed. Every Netlify host is denied from a cloud session
    (api.netlify.com, netlify-mcp.netlify.app, both sites), as on 2026-10-01.
  - The live project the connector sees (`buybackad-finished-copy`) serves
    `claude/fervent-pascal-w6mthe` 37a26d34 (deployed 2026-10-03 01:11), which
    has three commits `main` does not: a6b461e0 "Legible and plain" (readable
    sizes, plain customer words; its rule 99 collides with main's 99), a
    merge and an audit. A deploy of `main` there rolls that copy back. A dry
    merge into this head: 213 conflicts, ~210 of them showcase thumbnails
    both lines re-rendered. A job of its own (AGENT-BRIEF landmine 7).
  - On a phone the editor's export row already clips Cancel at the left edge
    (three buttons, 338px in a 276px row; `.modal-actions` does not wrap).
    Unchanged here: it is every pop-up's row, in styles.css and CSS_FALLBACK.

RESUME HERE:
  0. Reconcile `claude/fervent-pascal-w6mthe` (37a26d34) into `main` (renumber
     its rule 99, re-thumb the conflicting cards, verify), then deploy `main`
     to both Netlify projects. Until then, deploying `main` to
     `buybackad-finished-copy` takes the legibility copy off the live site.
  1. Export one video from Chrome or Safari (H.264) and post it to OfferUp
     with its photo: the MP4 path is checked only with a stubbed recorder.
  2. `.modal-actions` on a phone: let the row wrap (styles.css, then
     sync_css_fallback.mjs).

## 2026-10-03 — the composition audit: does a card line up?

(claude/trusting-ride-cfpk9o, then `main`.)

The owner: "next audit more", the day after a Pokémon card that "looks
incomplete … threw everything down and then abandoned it" and checklist
bullets to be centred.

Found:
  - Every audit so far asked whether a line reads, whether there is a
    photograph, whether the colour holds. None asked whether a card's parts
    share a line. The new question failed 118 of the 309 offered cards.
  - Looking at all 309 on numbered sheets found about thirty; the measure
    found what the eye missed at thumbnail size (ticketStub-ck03-15's number
    100 px left of the middle, four scriptRetro plates exactly 35 px off) and
    the eye found what the measure cannot see (six reviewProof cards whose
    call to action collides with the number).
  - The first cut over-reported (154): sparkles, tilted kicker ribbons and
    the outer chips of a centred row of three line up with nothing on
    purpose. A measure is calibrated against the eye, then trusted.
  - The checklists' empty rings were two defects, not one: a leftover ✓ text
    over the first ring's icon on 18 cards, and white icons on pale rings at
    1.1:1. The icons are line drawings, coloured by stroke: a contrast check
    that reads `fill` finds nothing to fix.
  - The layout pass does not undo a moved `left`; a block-centred list with a
    ragged right edge still reads left-heavy in a thumbnail. Check the
    numbers before believing the picture, and the picture before believing
    the numbers.

Did: DESIGN-LAW rule 109, OPEN-ITEMS §AC. 88 cards centred through the gate,
16 leftover ticks removed, 16 icons or stickers inked to read, 8 held; 321
live, all passing verify_showcase; 49 of 301 still fail the measure (8 are
Steps Flow, left to claude/relaxed-darwin-8aces4), none newly.
  - The writers' gate passed two centrings that every_card_audit then held as
    offered: Easy Mode lays a card out again with the visitor's words, and
    there the centred headline covered the corner badges. A layout change is
    not done until every_card_audit has run on the cards it touched.

## 2026-10-03 — the video maker's phones: the model's body, real blur, steady shadows

(claude/great-johnson-v8ppp6, not yet on `main`: this session may push only
its own branch.)

The owner, with a screenshot of three turned 17 and 18 Pros from a video:
"they look like sim tray devices missing the sim tray so it's got a hole...
audit small detail and fix fill in body color". Then: "make sure we have even
better movements, accuracy, and realism".

Found (each measured, motion/views-sheet.html and the engine in a headless
browser):
  - The hole was Camera Control, drawn #1c1d21 on the rail: 2.2 to 5.1 times
    darker than the rail beside it on every turned 16-and-later phone.
  - The 17 and 18 Pro backs show the side button proud of the rail at 0.311
    to 0.429 of the height (0.287 to 0.394 on the Max): the same 46.8 to 64.4
    mm from the top on both sizes. The engine drew it at 0.27 to 0.405, so a
    turned phone showed two buttons. No other back shows a button that can be
    trusted (the non-Pro stripes sit at one share of the height on both
    sides and both sizes).
  - Every model's edge was 0.115 of its width deep; Apple's depths run from
    0.100 (Plus) to 0.122 (17 Pro). Corners are right: every back's radius is
    within 5% of the engine's 0.165.
  - Motion blur took a fixed 8 moments: at 1080 a fast spin's corners jumped
    7 to 39 px between them, and frame 0 showed a fan of copies.
  - The shadow picked one of three blurs by height and jumped 22 times its
    usual step at a third and two thirds of the way up.
  - Movement curves themselves are smooth: no entrance or pose changes speed
    by more than 26 px a frame within an eighth of a frame, but for the
    bounces of drop and rain, which are meant.

Did: DESIGN-LAW rule 110. Camera Control flush in the body's colour; `BODY`
(Apple's width and depth per model) and `MEASURED_CONTROLS` in designOf;
`Ad._subsFor` and `EXPORT_QUALITY` (8 to 24 moments, 3 px apart at most); the
shadow blended between blurs and as wide as the turned body; a soft band of
light across a turning back, gone at rest. audit_phone_views.py prints each
model's depth and fails a drawn button the back disagrees with;
scripts/motion_phone_check.mjs measures blur and shadow.

Checked: motion_phone_check.mjs, all 46 entrance and pose pairs and four
shadows pass (worst copy 0.48 px, fixed 8 measured up to 4.9; shadow 3.3
against 22). audit_phone_views.py: 56 of 59, the same three 16-white-as-*
shape fails as before. The attention audit (audit-sweep.html, 24 looks, seed
101) gives the same scores and pass rates before and after; contrast moves in
the fourth decimal. A 6 s export draws in 1.2 to 1.8 times the time (headless,
no GPU: 10.6 s to 18.1 s for fly_spin). Views sheet, old engine against new:
only the edge depths, the turned shadows and the 17/18 Pro button change.

RESUME HERE:
  0. Merge claude/great-johnson-v8ppp6 into `main`, then deploy `main`
     (OPEN-ITEMS §Z 0).
  1. A turned 17 or 18 Pro's camera plateau is drawn flat on the back; it
     stands proud of the body. Its height needs a source (a side photograph
     or Apple's drawing) before it is drawn.
  2. The designer audit's standing failures on `main`: sell_iphone and
     gold_spot open as other cards; bandKnockout-pp04-15's ORIG leaves 4.2%.

## 2026-10-03 (later) — every phone, all the way round

(claude/great-johnson-v8ppp6, not yet on `main`.)

The owner: "All devices audit the 360 and any other angles".

Found (every offered phone, 57 of the 59 backs; the two ok:false 16s are never
offered): turned through 360 degrees every 2 upright and every 3 at 45, 90 and
180 degrees in the frame, each angle measured for the body's width, gaps inside
it and its change from the angle before:
  - Side-on (90 and 270 degrees) every phone was 1 to 2 px wide where its edge
    is 12 to 14, beside a full-width shadow: the side was a stack of outlines,
    and side-on each is a line. A wide spin passes there twice, a flip-in
    starts there.
  - The iPhone 15 and 15 Plus were given the Action button; they kept the mute
    switch (the Action button came on the 15 Pro and on every 16).
  - The light band on a turning back was set by the phone's own left, so a
    phone lying at an angle caught a light that was not there.
  - No angle left a gap in the old engine; the first fix (slices filled to the
    one behind) left a see-through seam down the middle side-on, which the
    gap measure caught.

Did: rule 110, all the way round. Each slice of the edge is filled back a
slice and a half (`hull`); designOf gives the 15 and 15 Plus the mute switch;
the band takes the scene's light whatever the phone's angle.
audit_phone_views.py checks each model against Apple's line-up (FACTS; the 17e
and 18 Pro unchecked); motion_phone_check.mjs turns one phone of every model.

Checked: all 57 phones, upright, at 45, on its side and upside down: no gaps;
side-on edges 12 to 14 px, within 10% of each model's depth (a pixel of
rounding); the largest step of a turn 1.7 times the usual (2.4 before).
motion_phone_check.mjs passes all of it (46 entrance and pose pairs, four
shadows, 36 turns); audit_phone_views.py 56 of 59, the same three shape fails.
The attention audit (24 looks, seed 101) is unchanged from the commit before.

RESUME HERE:
  0. Merge claude/great-johnson-v8ppp6 into `main` (it carries `main` at
     b7a67925); reconcile `claude/fervent-pascal-w6mthe` (37a26d34) into
     `main` (renumber its rule 99, re-thumb the conflicting cards, verify),
     then deploy `main` to both Netlify projects.
  1. A turned 17 or 18 Pro's camera plateau is drawn flat; its height needs a
     source before it is drawn. The 17e's and 18 Pro's notch, buttons and
     Camera Control want checking against Apple's sheets (FACTS leaves them out).
  2. Export one video from Chrome or Safari (H.264) and post it to OfferUp
     with its photo: the MP4 path is checked only with a stubbed recorder.
  3. `.modal-actions` on a phone: let the row wrap (styles.css, then
     sync_css_fallback.mjs).
  4. The designer audit's standing failures on `main`: sell_iphone and
     gold_spot open as other cards; bandKnockout-pp04-15's ORIG leaves 4.2%.
