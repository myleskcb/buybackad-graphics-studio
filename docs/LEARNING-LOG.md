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
    0 carry health or financial-status phrasing. scripts/copy_audit.mjs.
  - In the 16 national "we buy" ads with a usable description, only 2 show a
    dollar figure, and both are "up to" store credit. 11 of 16 make a speed
    claim; 14 of 16 send the viewer to a URL or app rather than a phone.

Changed:
  - docs/VIDEO-AD-RESEARCH.md (new), docs/README.md map entry.
  - scripts/copy_audit.mjs (new) — counts flagged default copy in the loaded
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
