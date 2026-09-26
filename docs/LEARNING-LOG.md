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

## 2026-09-26 — Module 7 (commercial polish) + video ads

Studied:
  The first-run experience against rule 36, and the landing page against the
  whole of DESIGN-LAW, which had governed the templates but never the page
  that sells them. Then, at the owner's request mid-session, video ads:
  muted autoplay in condensed formats with a small unmute in the corner.

Measured:
  - Chrome tokens pass WCAG AA in both themes (lowest: dim text on raised
    surface 4.89:1 dark; accent kicker on field 4.61:1 light). Not the problem.
  - Copy vs product: meta/share text said 160+ (real 243); sign-up card said
    "Starter … 20 templates" (no Starter plan; real 54 free); bottom CTA
    promised "Unlimited exports" to a 3/week plan; FAQ said exports are square
    only (4 formats exist) and that plates are semi-transparent (rule 21 made
    them opaque); og:image pointed at assets/tplbg/, which does not exist.
  - Easy Mode at 390px rendered 495px wide: `1fr` cannot shrink below the
    preview <img>'s ~439px min-content. Inputs and the ad were cut off.
  - Easy Mode opened every template on a grey, blurred placeholder and
    exported a flat fallback unless "ORIG" was clicked (while ORIG already
    showed as selected), against the locked direction "every template keeps
    a photograph".
  - The "PRO" badge in Easy Mode was wrong on 34 of 243 templates (25 Phones).
  - Landing gallery: blurred until hover (never sharp on touch); 24 one-up
    cards on a phone made a 13,784px page (now 9,125px).
  - __PRIORITY_TPL_IDS was set after preloadTplBgs() had already ordered
    wave 1, so the "visible first" preload never saw the landing picks.
  - Layers panel requested assets/tplbg/<id>.jpg for classic templates: a 404
    and a blank swatch, on the original build too.
  - Video export: 1.6 → 1.8 → 2.3 → 30.0 fps across three measured fixes
    (DESIGN-LAW 54). Sound: 91% of energy <500 Hz, rebalanced for a phone
    speaker (53). Clips: 4 × (MP4 + WebM + poster) = 2.4 MB.
  - Under the production CSP (served locally from _headers): 0 violations
    across landing, theme toggle, reel playback + unmute and a full export.

Changed:
  - index.html / styles.css / app.js: landing rebuilt (hero names all eight
    categories; derived proof row; video reel; "why they get calls" = the
    house rules; filterable sharp gallery, 2-up on phones; how-it-works
    matching Easy Mode; formats from FORMATS; pricing from PLANS; FAQ fixed;
    true CTA). SVG icon sprite replaces emoji/Unicode chrome glyphs.
  - Video export (MOTION section, appended): living-still motion, synthesized
    sound, bake-and-composite renderer, MediaRecorder with an honest MIME
    choice, gated/counted/watermarked like a PNG. Easy Mode + export modal.
  - Easy Mode: overflow fix, template photo is the default background, Pro
    badge from tplLocked(), cssBg/tplPhotoUrl resolve embedded photos.
  - scripts/render_motion_clips.mjs (clips + clips.json, measured button
    corner, refuses silent or backdrop-less renders);
    scripts/sync_css_fallback.mjs (CSS_FALLBACK had no regenerator in repo).
  - DESIGN-LAW rules 51–56, appended.

Rejected:
  - A REVEAL animation (type flying in). Every frame before the number lands
    is a frame that cannot convert in a muted, fast-scrolling feed.
  - top_buyer as the reel's phones clip: its CTA measures 1.02:1, ΔE 2 —
    invisible in every format. Named here, NOT repainted (rule 14 needs field
    research first). sell_iphone replaced it.
  - Luminance-only contrast for picking clips: it failed orange-on-brown
    type that reads fine. Used the house method (<3:1 AND ΔE<30).
  - Showing an unmute button on silent clips, or a play button on clips the
    browser cannot decode (rule 55).
  - Trusting requestAnimationFrame to pace a recorder (rule 54).
  - Changing canonical/og:url off buyback.ad (no DNS). Only og:image moved to
    the working netlify host; the domain is the owner's decision.

Known, not fixed (out of scope, logged so nobody rediscovers them):
  - Module 6 reflow: several designer phones templates shrink the phone
    number to a small plate in Story 9:16 (e.g. dl_phones_voltStack_volt).
  - top_buyer CTA 1.02:1 (above). The phone audit never looks at CTAs; a
    CTA/secondary-text audit is the natural extension.
  - MediaRecorder WebM files carry no duration header (Chrome behaviour);
    platforms re-encode, but a desktop player shows no scrub bar.
  - The sound is a synthesized placeholder. Nobody has listened to it.

RESUME HERE:
  1. Owner: audition the sound (assets/video/*.mp4, unmute) and the motion on
     a real phone, then draft-deploy (netlify deploy --dir=.) and run
     scripts/verify_csp.mjs against the draft URL before --prod.
  2. Test MP4 recording in real Chrome ≥126 and Safari: this sandbox's
     Chromium has no H.264, so only the WebM path was exercised end to end.
  3. Module 6: a reflow regression check that renders every template in all
     four formats and asserts phone-number height and CTA contrast per format
     (reuse the glyph-masked method in scripts/ + the clip renderer's harness).
