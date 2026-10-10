# Graphics Studio — open items

Status as of 2026-08-28. Live build verified: local and production `app.js`
hash identical (`226169392f04c437d94c49f9844cf561`).

**Live URL: https://buybackad-graphics-studio.netlify.app**
(`studio.scans.ad` still does not resolve — no CNAME.)

## Current build

| | |
|---|---|
| templates | 243 · 54 free / 189 Pro |
| passes | 23 (all defined, integrity-checked) |
| design rules | 49 |
| renders | 243/243, 0 errors, 0 text clipped |
| text collisions | 8 (no vertical room to resolve) |
| cutouts over text | 43 |
| design law | `gfxv23/DESIGN-LAW.md` |

---

## A. Requested, never built

1. **Emoji as a deliberate large-format style.** Asked twice ("certain iOS
   emojis sometimes can look good", "use icons emojis everything that could
   catch your eye"). Pictorial emoji were *removed* earlier as cheesy; the ask
   is to bring them back as an intentional oversized treatment, not filler.
   **2026-09-29:** a drawn 3D set was built and removed the same day (owner:
   "EMOJIS ONLY IOS STYLE"). Now DESIGN-LAW rule 88: the device's own emoji
   font, on Apple devices only, one on some cards. Still open: an oversized
   hero emoji layout, and whether the library's server-made thumbnails should
   show iOS emoji (they cannot be drawn on the server).
2. **Colourable / editable vectors.** "Maybe the vectors can have colors applied
   to them, make it as creative as possible with as much free rein to edit as a
   customer would like." The 20-mark icon set exists and renders, but `path`
   layers are not exposed as editable objects in the editor's properties panel.
3. **Style variations as a customer-facing choice.** "A lot of styles and
   variations, especially for the illusion of choice so we can have different
   branding for the same service." Three internal style families exist
   (duotone/wash/photo) but there is no chooser — the visitor cannot switch one.
4. **Template editor / explicit design records.** Proposed by the owner, agreed
   as the correct architectural fix. See section D.
5. **Corner radius system.** "Too many generic elements, boxes, sharp cornered
   squares." No radius scale exists; radii are ad-hoc per layer.

## B. Diagnosed, not resolved

6. **"Strange overlays"** — flagged by the owner, never pinned down. Needs them
   to point at one specific template; I could not identify which treatment was
   meant and guessing would waste a pass.
7. **8 text collisions** where there is no vertical room to separate without
   pushing type off-canvas. Currently the overlap is kept; clipping is worse.
8. **43 cutouts still overlapping text** (down from 620). The remaining ones are
   in layouts where the free-space grid found room that the text estimate
   under-reserved.
9. **25 templates under 8 elements.** They have backdrop, phone, selling point —
   just leaner than the rest.

## C. Authorised but not spent

10. **fal cutout generation.** The owner offered budget and said "or use our
    FAL". Only **$0.33** has been spent (2 prompt probes + a 4-model bakeoff).
    The proven lever remains: templates with a cutout score 7.8 edge density vs
    4.6 without (+70%), and only 68/243 have one.
    **~54 more cutouts ≈ $3** at Seedream v4 $0.03/image (it beat Nano Banana
    Pro at 5× the price in a measured bakeoff). Generator:
    `scratchpad/make-cutouts.js`, resumable. Key in `~/Desktop/apple-photo-engine`.

## D. The architectural item (highest leverage)

Templates are transformed by **23 sequential procedural passes**, several of
which decide by `hash(template_id)`. That is why the set reads as "configured at
random" — it is randomised. Each pass is individually defensible; the
composition of 23 is not a design.

The fix is a **token system + authored layouts**, with passes demoted to
*defaults for new templates* rather than filters over finished ones:

- a fixed spacing scale, a type ramp, and an OKLCH lightness ladder per category
  (the OKLCH engine already exists — that is the hard half)
- a small number of real layout archetypes, composed deliberately
- each template's look stored as an explicit, inspectable, editable spec

This is what makes polish accumulate instead of costing a percent per round.

## E. Blocked on owner access

11. **studio.scans.ad** — one CNAME (`studio` → `buybackad-graphics-studio.netlify.app`).
    Netlify side already configured. ~2 minutes.
12. **reselling.us/gfx** — Worker written and ready at `~/Desktop/gfx-deploy/`.
    Needs pasting into Cloudflare + route `reselling.us/gfx*`. The app is
    already mount-aware (`PGFX_API` derives from `location.pathname`).

## F. Never verified — do not claim these work

13. Stripe checkout · auth end-to-end · community gallery · project history ·
    export caps actually enforcing · watermark rendering. No live keys.

---

## Provenance note

DESIGN-LAW rules 43–49 and several passes (`highlightBudget` rewrite,
`gradInkContrast`, `panelDiet`, `localGroundContrast`, `purgePlateGradients`)
appeared in this repo without being written by this assistant. They are correct
where checked — rule 43's colour-vision figures reproduce exactly under
independent simulation. Do not assume every comment in `app.js` reflects one
author.

## F. 2026-09-02 — Set 7 (retheme_lab)

Built from the owner's review notes on Set 5 (137 of 500 kept, saved as set 5
in `assets/approved-templates.json`; the `5a` partial read is gone). Every
item below is enforced in `scripts/retheme_lab.mjs` and, where it can be
measured, in `scripts/audit_set.mjs` (rules 10-12):

- Product cutouts never sit over words; the placement search uses the asset's
  real proportions (a coin on edge cleared a square spot, then got re-homed
  over the tiles). Audit rule 10.
- Stars are always five. Audit rule 11.
- No two cards alike: the category walks with the variant number. Audit rule 12
  (same palette, same words, same products).
- Kicker plates hug their kicker (origin-centred ribbons were read as
  left-edged by the signature pass).
- `ip-gen*` AI phone renders are out of every pool; only the `qs-*` press
  images and the `iphone-17-pro-back-*` photographs remain.
- Assortments (`LAB_ASSORT=all|off|third`): lineups of related products in the
  largest free band or side column, plus a ghosted wall of the same family,
  never under the headline.
- Curved headlines arc up on two cards in three.
- `natural` backdrop treatment on one card in three: colour kept, blurred,
  neutral scrim.
- Every card leaves with at least two selling-point lines.
- Bikes, trucks and work vans are decks that ride the cars templates
  (`bgcat` picks their own `assets/bg-web/` photographs; 25 kept, 11 rejected).
- Theme families Night Neon (`nn`) and Chalk (`ck`); `LAB_DONORS` overrides the
  palette list.

Set 7 lives at `lab/templates-set7.{html,js}` (variants start at 15); the
manifest is `assets/set7-manifest.json`.

## G. 2026-09-02 evening — the landing, the looks, and location-aware copy

Three things landed together; each has a regeneration path.

**The landing shows the newest set as real templates.** `scripts/retheme_lab.mjs`
now takes `LAB_EXPORT=1` and writes `templates.json` beside the renders — every
card's FINAL template record (the `t2` it was painted from). The landing page
no longer renders 27 canvas thumbnails at boot; it reads `assets/showcase/`:
`index.json` (one row per card, with the owner's approval affinity for its
layout+palette pair), `<id>.webp` (448px), `tpl/<id>.json` (the record). A click
fetches the record, registers it in `TEMPLATES` as `sc-<id>` and opens Easy Mode
with the photo ON. Nothing in the pass chain touches these — they are finished.
To refresh after a new lab set:

    LAB_EXPORT=1 LAB_OUT=.render/export7 LAB_TOTAL=250 LAB_VSTART=15 \
      LAB_DONORS=du07,jw05,pp04,pp02,cd06,jw07,du08,pa05,ca07,io03,cd10,cd04,jw03,jw10,gl02,du05,nn01,nn05,ck01,ck03 \
      node scripts/retheme_lab.mjs
    node .render/export7/shrink.mjs        # 448px thumbs → assets/showcase/  (copy of scripts/shrink_thumbs.mjs)
    # then the python snippet in the session notes builds index.json + tpl/*.json:
    # bg.scrimMode='normal', bg.grade={treat: bg.treat||'tone'} — the lab paints a flat
    # scrim over a toned photograph, and freshBgImage() now honours grade.treat.

`COLOR_THEMES` (the Easy Mode theme row) is 17 entries: twelve from
`theme_specs.mjs` and the five old ones that were not brown or amber.

**The chrome has a Look menu.** Three axes on `<html>`: `data-skin`
(graphite default / night / paper / ember = the old warm look), `data-accent`
(blue default / mint / orchid / gold / orange), `data-theme` (dark / light).
`?look=night-mint` in the URL sets and remembers a look. Every hard-coded
orange in `styles.css` became `rgba(var(--accent-rgb),…)`; the brand mark
follows the accent. The pre-paint stamp and the toggle script in `index.html`
are inline, so `node scripts/csp_hashes.mjs` after any edit to them.

**Location-aware copy.** First visit to the studio asks for a ZIP or city
(`#area-overlay`; also in the Brand Kit and the Easy form). `assets/geo/`
holds GeoNames US ZIP centroids and 16k places with population (CC BY 4.0),
fetched only when resolving. `geoArea()` sorts the area by population within
30 miles into metro / city / town / rural and reaches 22 / 35 / 55 / 95 miles
with a matching distance penalty and population floor, so a metro names the
close suburbs and a rural area names the small towns further out.
`localizeText()` swaps the author's exact tokens — the eight reviewer cities,
`LA & OC`, the service-area line and the Long Beach address — inside
`buildLayer()` and the Easy form defaults, so every render path is covered and
an unset area is a no-op. `tests`: none yet; the checks were done by hand for
92101, 91945, 95758, 73301, 10001, 04101, 57501, 59527, Bozeman and Fresno.

## H. 2026-09-22 — the refresh, and the recipe that replaces §G's snippet

The "python snippet in the session notes" is now `scripts/import_lab_export.mjs`.
The whole chain, from a lab export to a live, audited showcase:

    LAB_EXPORT=1 LAB_OUT=.render/exportN ... node scripts/retheme_lab.mjs
    node scripts/import_lab_export.mjs .render/exportN     # tpl/*.json + index rows
    node scripts/refresh_showcase.mjs                      # palettes, faces, duotone, copy rules, bake
    node scripts/fix_cta_straddle.mjs
    node scripts/repair_showcase_contrast.mjs
    node scripts/audit_showcase_overlap.mjs --write
    node scripts/audit_showcase_legibility.mjs --write
    node scripts/measure_showcase_color.mjs
    node scripts/audit_showcase_content.mjs --write        # stamps `defect`; the app filters it
    node scripts/sample_sheet.mjs .render/sheet.png 48 7   # then LOOK at it
    node scripts/landing_check.mjs                         # 390 + 1440, errors, 404s, overflow, bytes

`refresh_showcase.mjs` reads the records from git (REFRESH_FROM, default HEAD),
so run it against the commit that holds the lab import. What changed and what
is still open: `docs/refresh-2026-09-22.md`.

## I. 2026-09-26 — the study session in the templates, natural photographs

What landed (DESIGN-LAW 53-56; the log entry of the same date has the numbers):
the phone number rebuilt big on every card (`scripts/number_block.mjs`,
`assets/number-fix.json` for the classics), the copy rules
(`scripts/refresh_copy.mjs` honestCopy), the design-school critic
(`scripts/audit_showcase_school.mjs`, its rejects become `defect`), the
photographs in their own colour under a neutral solved shade
(`scripts/naturalize_showcase.mjs`, `scripts/naturalize_classics.mjs` ->
`assets/ground-fix.json`), the twelve failing Easy Mode themes re-solved, and
the site's pages brought up to date.

The §H recipe with this session's steps in place. `refresh_showcase.mjs` no
longer paints duotones; the natural pass must run after it:

    node scripts/refresh_showcase.mjs                      # palettes, faces, copy rules, bake
    node scripts/number_block.mjs --write                  # the number, big (rule 53)
    node scripts/naturalize_showcase.mjs --write           # photo in its own colour (rule 56)
    node scripts/restage_glasscards.mjs --write            # Glass Card: product on the card (rule 59)
    node scripts/darken_grounds.mjs --write                # shade dark, never milky (rule 62)
    node scripts/support_highlights.mjs --write            # support colour on the selling points (rule 63)
    node scripts/neutral_panels.mjs --write                # no hue over the photograph (rule 85)
    node scripts/vary_grounds.mjs --write                  # every kind of ground (rule 86)
    node scripts/clear_number.mjs --write                  # nothing drawn on the number
    node scripts/audit_showcase_overlap.mjs --write
    node scripts/audit_showcase_legibility.mjs --write --json .render/legib.json
    node scripts/repair_showcase_ink.mjs --from .render/legib.json --write
    ONLY=<repaired ids> node scripts/audit_showcase_legibility.mjs --write
    node scripts/audit_showcase_school.mjs --write         # the critic (rule 54)
    node scripts/audit_showcase_content.mjs --write        # stamps `defect`, school rejects included
    node scripts/rethumb_showcase.mjs
    node scripts/measure_showcase_color.mjs
    node scripts/landing_check.mjs

The classics: after any change to the passes, the palette or the backdrops,
re-bake in this order, each with the tables after it switched off by its own
flag: `bake_contrast.mjs` (?nofix=1), `number_block.mjs --classics --write`
(?nonum=1), `naturalize_classics.mjs --write` (?noground=1).

Off the owner's Mac (a sandbox, CI): `CHROME=/path/to/chrome` and
`FABRIC_JS=/path/to/fabric.min.js` for every script above.

Still open:

- **The 50 offer cards** live in `loganipad/iphoneslainv`, out of this repo's
  reach. `docs/handoff-offer-cards-number.md` has the rule at 1200px and a
  paste-ready prompt. Owner's call inside it: does the marketplace set carry
  the number too.
- **iPhones LA's server** now receives pictures that show the number; whether
  `/api/buy-ads/studio/images` or Auto-post accepts them is untested from here.
- **The video maker's page** says a few things its code does not (listed in the
  handoff); fix in the phone ad engine's repo, then sync `motion/`.
- **38 classic lines still run past their plate** by the measure used here; the
  big ones are deliberate (duoSplit and ticketStub headlines cross their panel),
  the rest 3-35px. The ticketStub item lists are small (critic: warn).
- **neon_sell** keeps its colour grade: its number is carried by a plate no
  neutral shade can serve. Rebuild that layout rather than special-case it.
- **Not verified here** (no route to them from the session): the live site,
  Stripe and sign-in, the Netlify headers as served. Draft-deploy and look.

## J. 2026-09-27 — the branches reunified, and what was ported rather than merged

`main` had not moved since 2026-08-28 while the product moved on across a dozen
branches, so three sessions on 2026-09-26 started from a month-old codebase and
rebuilt things that no longer existed. The trunk is now one line:
`claude/finished-copy-site-manf7r` + `claude/vibrant-hawking-htxrvn` (the study
session, clean merge) + `claude/vibrant-lovelace-rze4rx` (video ad research; its
`copy_audit.mjs` kept as `scripts/claims_audit.mjs`, since the study session's
copy-rules audit already had the name).

**Not merged, because they were cut from the stale August main.** Merging
either would put August code over September work. Their still-useful parts
are listed to port, each checked against the trunk on 2026-09-27:

`claude/busy-allen-2d5iv1` (photo standard, 317597c):
1. ~~**`tplbg-data.js` is still a 635KB render-blocking base64 script**~~
   Ported 2026-10-01 (§Y): the eight photos are files in `assets/tplbg/`.
2. **No asset cache-busting** (`ASSET_REV` absent) while art is cached 30 days,
   so a replaced photo never reaches a returning visitor. Port the `?v=` revision.
3. The photo standard itself (subject fill, tone band, 1200px) and
   `standardize_photos.py` / `asset_usage_audit.mjs` were written against the
   26 legacy PNG cut-outs, which the trunk replaced with 478 2K WebP cut-outs.
   Re-derive against the WebP library before running anything; do not copy
   its 97 rewritten files over the trunk's.
4. Least-used photo picker (every photo appears before any repeats): the idea
   ports, the code does not (`.png` names, old picker).

`claude/fervent-pascal-w6mthe` before 2026-09-27 (bf45814, ee650df): a rebuilt
landing in the abandoned warm/orange language and a second video engine that
duplicated `/motion`. Both discarded. Verified still present on the trunk:
5. **`CSS_FALLBACK` in app.js is out of sync with styles.css**, so a host that
   blocks the stylesheet gets the OLD design. A regenerator
   (`scripts/sync_css_fallback.mjs`, with `--check`) is in bf45814.
6. Easy Mode's "PRO" badge reads `t.tier === 'premium'`, not `tplLocked(t)`, the
   gate itself: measured on the August library it labelled 34 of 243 free
   templates PRO (25 of them Phones).
7. Easy Mode resets every template to a grey, blurred placeholder
   (`ez.bgPicked = false`) and exports a flat fallback unless ORIG is clicked,
   while ORIG already shows as selected.
8. The Easy layers panel draws classic templates' photo from the raw
   `assets/tplbg/…` path, which is not shipped: a 404 and a blank swatch.
9. Three Pro prompts still say "unlock all 8 designs with Starter or Pro"; there
   is no Starter plan.
Already fixed on the trunk independently, so not ported: og:image, "Unlimited
exports", the Starter sign-up card, the preload ordering, the 390px overflow.

**Reported by the owner 2026-09-27, next:** overlapping elements on library
cards (a "CASH NOW" disc on the item line and an appraisal pill over the number
on *Blush & Cobalt · Bubble Pop*; the product over the headline on *Kiwi &
Violet · Script Retro*; card captions laid over the number band), and colour
theory on the pale palettes, where the ink washes into the ground. `/motion` is
still in its own light chrome, unlike the rest of the site.

## K. 2026-09-27 (later) — one design language: what is done, what is next

Done on the trunk (DESIGN-LAW rules 57 to 60, LEARNING-LOG same date): the
collision audit and the alignPass rules behind it, the 6% guides, the Glass
Card with its product on the card over falling money, the curated 400, the
storefront's device art, one house look in the chrome. The owner-reported
list at the end of §J is covered: the CASH NOW disc (stickers on copy are
removed), the appraisal pill over the number (plates grow only into clear
space), the product over the headline (4d), and the centring of WE BUY /
POKÉMON (one axis).

Next, in order of what the owner will see:

1. **Bump `ASSET_REV` in app.js whenever art changes** (assets/bg, cutouts,
   grounds, showcase). Every assets/ URL carries it; without a bump a replaced
   file stays cached for 30 days.
2. **The 65 disqualified cards are retired, not fixed** (52 collisions, 17
   critic rejects, most for a number the guides fit took under 72px). Three
   layouts account for most: reviewProof's chat rows (the reply text is set
   beside its bubble, not in it), neonNight's items line off its panel, and
   trustSeal's tile wall. Fix the layout builders, re-run
   `scripts/audit_collisions.mjs`, and a card that measures clean can be
   brought back by deleting its `defect:"curated"` stamp.
3. **48 of the 243 classic templates still collide** (was 112 before the
   alignPass rules): mostly the `ribbon` layouts, whose headline sits half on
   its ribbon, `diagonalRush`'s second band, and `lowerThird`'s product over
   its kicker. The classics are not curated, so these still ship in the Easy
   Mode strip: fix the builders, then re-run
   `scripts/audit_collisions.mjs --classics`.
4. **Device variants in the studio.** The owner: "once a theme is perfect we
   can make unlimited variations for all types of devices specifically."
   `assets/devices.json` (scripts/device_catalog.py: 118 models, 139 finishes,
   each finish's colour measured on the device body) and
   `scripts/device_variants.mjs` (re-set a card for a device: family headline,
   that family's models as the selling points, the finish nearest the card's
   accent) exist and were proved on one Glass Card across 11 devices. Next: a
   device picker in Easy Mode that applies `variant()` to the open card, so a
   variant exists when someone asks for it rather than as more library cards.
5. **Art the upload did not contain:** the iPhone 17 Pro / 17 Pro Max / 18 Pro
   / 18 Pro Max colour backs the ad-backs manifest reads "in place from the
   storefront" (`file: null`; the owner pasted four of them as images). Relic
   models (iPhone 7/8/X/SE, home-button iPads, Intel Macs, Watch Series 1 to 5)
   were left out by the owner's floor; import them only if model-specific ads
   for them are wanted.
6. **`/motion` keeps its own light chrome** (53 faces, 121 palettes). It is
   synced from the phone ad engine's repo, so restyle it there and re-sync;
   an edit here would be overwritten.
7. **Colour hazes (rule 85) are cleared on the showcase only.** The classics
   (243, built at runtime by `assignStyle()`) and the Easy Mode themes were not
   measured for tinted panels, pale glows or light halos on light ink. Run the
   same census on them (`scripts/neutral_panels.mjs` reads the showcase
   records; the classics need their builders changed, not their records).
8. **The Apple Store photograph** (owner: "we can always use a photo of the
   Apple Store background that is a good one"). Not in the repo, and the
   session's network policy refused every free-photo host (Wikimedia,
   Unsplash, Pexels, Pixabay, Flickr). Supply one (or allow one of those hosts
   and run `scripts/fetch_backdrops.mjs` with an Apple Store query), save it to
   `assets/bg-web/` with its ATTRIBUTION row, and it becomes a photograph like
   any other: a record's `bg.src`, a "Photos" swatch in Easy Mode for its
   category. Mind the logo: a store interior with the Apple mark reads as
   Apple's own ad; blurred (the "Blurred photos" style), it is atmosphere.
9. **The advanced editor's Background** is still Solid / Gradient / Image. A
   drawn ground opened from Easy Mode carries over (applyBgSpec draws it), but
   the editor has no picker of its own for them yet.
   **Done 2026-09-30** (DESIGN-LAW rule 91, §U): its Backgrounds tab offers
   every kind of ground in the card's or the theme's palette, with blur,
   Shade/Fade and the patterns, and Quick edit has the six swatches.
10. §J items 1 and 6 to 9 remain (2, ASSET_REV, and 5, CSS_FALLBACK, are
   done): `tplbg-data.js` as a 635KB render-blocking script, the PRO badge
   predicate, the grey Easy Mode placeholder, the `assets/tplbg/` 404 swatch,
   the three "Starter" prompts.

## L. 2026-09-27 (night) — video on the new language, plate air

Done (DESIGN-LAW rules 64 to 67, LEARNING-LOG same date): every design
downloads as a 10 s video that opens on the finished ad and shifts to its own
call to action; exact encoder, frame-0 and flash gates; words on a plate keep
air at both ends (plateAir, and the collision audit measures it); the video
scripts prove they opened the card they name.

Next:

1. **Export one MP4 from real Chrome or Safari and play it** (the test
   container has no H.264 encoder; the WebM path is the one verified end to
   end). Then upload it to a Reel and a TikTok draft.
2. **9:16 across the curated set.** Square (all 641) and 3:4 (curated 398)
   are audited clean; 9:16 has a 60-card sample, clean. Run
   `scripts/motion_audit.mjs --set showcase --format story` when 9:16 ads are
   next wanted.
3. **Cards that keep the still** (no call to action passes its audit): five
   classics. `neon_sell` (a plate no neutral shade serves, rule 56),
   `silver_ster`, and dl_gold_voltStack_gold, dl_coins_voltStack_royal and
   dl_sports_voltStack_crimson, whose action line reads 2.5 to 2.9:1 on its
   own plate in every stack. Fix the voltStack plate colour in the builder
   and they get one; the clip is a correct living still meanwhile.
4. **One classic short of air**: dl_strips_duoSplit_emerald's TEST STRIPS is
   1.26x its side panel, so the 72% floor leaves it 20px short. Fix the layout
   builder (a smaller authored size or a wider panel), not the floor.
5. **Decide the call to action once, at 1080.** Its legibility test reads the
   export's own pixels, so a Pro 2160 download can choose a fuller stack than
   the 1080 one (both are audited, so neither is wrong, but they can differ).
   Bake the decision at 1080 and render the chosen stack at the export size;
   the gallery already previews the 1080 decision.
6. **The live site** may not carry alignPass step 4b yet (the owner's
   screenshot of CALL FOR INSTANT OFFER over its badge is the unfitted,
   authored state; every render path on this branch fits it). Deploy the
   trunk to see the fix.

## M. 2026-09-27 (night) — tagline styles (picked, and on every template: §Q)

The owner: "who said the main tagline had to be one color? why not patterns,
gradients, or color blocking?", "My favorite ads kept a cohesive gradient on
assets", "We can also do white with black outline?", and a reference (#1
BUYER: one orange-yellow-lime sweep on every line that sells, heavy black
outlines, dark bands).

Built as an option, not yet offered in the UI: `taglineStyle(sc, mode, pal)`
in app.js (solid, street, gradient, outline, blocks, pair, pattern), applied
to a finished scene. `scripts/tagline_lab/render.mjs` renders the curated
cards in every style through Easy Mode and measures them with the critic;
`scripts/tagline_lab/build.py` builds the review page, published as the
Tagline Lab (artifact GDYju2JKXZhEEKCYN8XkUv, picks stored in its `picks`
collection). First run, 21 cards: every style but pattern passes the critic
on all 21 (pattern 18 of 21).

Done (2026-09-27, later; DESIGN-LAW 83): the owner kept solid, street,
gradient, blocks, pair and outline (pattern dropped). They are one Tagline
style row in Easy Mode and in the editor, for every template in every family
and category, in the picture, the download and the video; rules 1 and 5 are
amended for them. `scripts/tagline_audit.mjs` measures them on every family:
every style passes on all 82 sampled templates.

Still open:
1. The reference's heavy italic display face is its own axis (a font choice);
   the styles keep each card's face.
2. Easy Mode's template strip shows each card as designed, not in the chosen
   style (the preview, the downloads and the video carry it). Re-thumbing the
   strip per style would cost a render per card per change.

## N. 2026-09-27 (late) — the audited card, and what the owner asked for next

Done: stepsFlow-nn05-30 restaged and passing `scripts/audit_card.mjs` at
154/154 (gallery, Easy Mode square and 3:4, video). Engine: letters not boxes
in five layout passes, `blockRemap()` for tall formats, numeral self-collision,
badge plates, number centred on the seen band. DESIGN-LAW 68-76.

Asked for, not done yet:
1. **The variation board**: "at least 500 options … themes, taglines, fonts,
   colors, everything … even shapes for the background box/bubble like the
   CTA (with or without outline) … types of devices … your best unique 500".
   Built on the audited card; every variant through audit_card before it is
   shown; the engine chooses cohesive combinations (rule 75), not random ones.
2. **Aesthetic gradients**: holographic / iridescent / opal / vaporwave /
   sherbet / Y2K chrome presets (the owner's WE BUY IPHONES reference).
3. **Pattern library**: about 30 procedural textures, each with a scale
   slider (bigger money, or more of it) and position sliders to slide the
   tile in the editor.
4. **Product swap in Easy Mode**: popular models first (17 Pro Max, 17 Pro),
   randomise, the photo that faces the right way (rule 73); cutouts tagged
   with the direction they face.
5. **More faces across the library** ("we should be using more fonts, but
   that's another story"): more pairs to choose from, still two per card.
6. stepsFlow-nn01-30 has the same bare "iPHONE" headline: restage it the
   same way and audit it.
7. Known, not caused here: the tagline lab's tiles are from before the
   restage.

### N.1 Devices: authentic imagery, and generated angles

- Only these photos are the real 17-series design: qs-iphone-17-pro (Cosmic
  Orange, back and front), qs-iphone-17-pro-max (Silver), ip-gen17-plateau-white,
  -blue, -black (a crop). Every own-apple-* photo is a re-skin; the
  iphone-17-pro-back-* files are mislabelled (square bump). `assets/cutouts/devices.json`.
- The owner wants FAL used to make more angles from real photos as reference
  entities. Not wired: no FAL key in this environment (add `FAL_KEY` in the
  environment's settings). The plan when it is: a spec sheet per model (camera
  plateau and lens layout, buttons incl. Action button and Camera Control,
  Dynamic Island vs notch, rail material and colour, e.g. Pacific Blue's chrome
  rail) as ground truth, generation from real reference photos, and a QA gate
  that compares each render against the sheet and the reference and refuses
  anything off; only passes enter devices.json as authentic.

### N.2 The letter layout, library-wide

The letter passes apply to `__ink` records only (DESIGN-LAW 76). Moving the
library over: restage or flag a card, run audit_card and the collision audit on
it, keep it only if nothing regresses. The ungated run's diff (2026-09-27)
named what to fix first: authored straddles the box push had been hiding
(scriptRetro and trustSeal phone numbers half off their bands), and
stepsFlow-du01-30's number wedged 3px between step 3 and the website.

### N.3 Tall formats (2026-09-28)

DESIGN-LAW 77. Lab records for the five examples are in .render/restage/lab/
(`restage_steps_flow.mjs --as=… --bg=… --product=… --variant=…`, audited with
`audit_card.mjs --lab <id>`). stepsFlow-nn01-30 was restaged for real (its bare
"iPHONE" headline): FAST CASH FOR iPHONES + EZ BUYER, silver 17 Pro Max, 210/210.
Backgrounds: many scenes show older iPhones (13-16) behind the product, and
the green studio trio and the titanium photograph do too; a background
catalog like devices.json (what each photograph shows, its model year) should
let the engine prefer photographs without older devices.

## P. 2026-09-27 — the offer family, new categories, and what must not ship

What landed (DESIGN-LAW 79-82, the log entry of the same date has the numbers):
the offer family (`offer-library.js`, 161 cards over 35 buying lines, six
layouts, twenty looks, twelve pairings, in all 13 categories, five of them
new), the picture flags (`assets/cutout-flags.json`: garbled, wrong product,
cut off at the frame, broken, too small) with every showcase card's picture
swapped for a whole one, the invented-claim rewrite (`refresh_copy.mjs` CLAIM /
CLAIM_FIX), the Studio's own templates held to the showcase's bar
(`template-holds.js`), and the v2 generator brief
(`docs/offer-cards-prompt-v2.md`).

After any change to app.js's templates, the passes or the tables, re-run in
this order (each with the tables after it switched off by its own flag, as §I):

    python3 scripts/cutout_edges.py                    # new pictures: cut off at the frame?
    python3 scripts/swap_flagged_cutouts.py --write    # showcase cards off flagged pictures
    node scripts/honest_claims.mjs --write             # invented facts rewritten
    ... the §I showcase chain (overlap, legibility, school, content, rethumb) ...
    node scripts/audit_templates.mjs --write           # classics + offer family -> template-holds.js
    node scripts/landing_check.mjs

To add a product picture: put the cutout in assets/cutouts (trimmed, whole,
at least 1.5x the size it will be drawn), OCR it and run cutout_edges.py, look
at it, then give the line a `sets` entry in offer-library.js with its pixel
size in SIZE. The type-only lines waiting for one: PC handhelds, gaming PCs,
gaming headsets, SSDs, mini PCs, sealed Chromebooks, Meta glasses.

Still open:

- **Product photos from the web.** The owner offered Wikimedia Commons and the
  makers' and retailers' pictures; this container's network policy denies
  those hosts (Network access in the environment settings would open them).
  The v2 brief describes the sourcing for the owner's Mac.
- **Held classics.** 108 of 243 fail the bar and are out of the Studio: 41 of
  the 50 hand-built ones (three typefaces, a headline that does not win) and
  the voltStack, stepsFlow, gradientWave, diagonalRush and agencyGrid layouts
  in every category (box overlaps, a headline under 1.3x the number). Fixing a
  layout function brings back eight at once, but its number block
  (assets/number-fix.json) must be re-baked after: `number_block.mjs --classics`.
- **Held showcase cards.** 279 of 971 fail a check (249 the design school,
  22 a product or line over the words, 13 a shape over the words, 10 a line
  under 3:1, 5 the same words twice; a card can fail more than one). They are
  hidden, not deleted.
- **The six offer-card headlines** in the review (docs/offer-cards-prompt-v2.md)
  need drawing again on the owner's Mac, both versions of each.
- **Placeholders to replace with real photographs** (docs/scrape-intake.md,
  scripts/ingest_assets.py): ph-sports-slab, ph-sports-slabs-fan,
  ph-sports-cards-fan, ph-sports-box; Pokemon boxes, packs and larger slabs
  (the real Charizard is 369 x 610, so the street templates that draw it
  bigger are held); sealed test strip boxes (only strip-boxes, 444 x 418, is
  approved); the seven type-only lines; Galaxy, Pixel and foldable
  photographs (those lines stand on NASA pictures).
- **Not verified here**: the live site and the Netlify headers as served (the
  two new scripts are revalidated like app.js; faces.css is versioned in its
  URL because /assets/fonts/* is immutable for a year). Draft-deploy and look.

## Q. 2026-09-27 (late) — one engine: the tagline everywhere, products off the subject, gaming rooms

What landed (DESIGN-LAW 83-84; the log entry of the same date has the numbers):

- **Tagline styles on every template** (§M done): `TAGLINE_STYLES` in app.js,
  applied in `renderEzCanvas` and on the editor canvas, colours from
  `tplPalette`, switchable (`taglineReset`), ground-aware, measured by
  `scripts/tagline_audit.mjs`. The video engine's crop now allows for letters
  that reach past their box (it cut an italic T off on a tagline block).
- **Products off the photograph's subject**: `scripts/photo_subjects.py` ->
  `photo-subjects.js` (loaded before app.js), `productYield` with alignPass,
  measured by `scripts/subject_audit.mjs`. A new or replaced ground needs
  `python3 scripts/photo_subjects.py` run after it (docs/scrape-intake.md).
- **Gaming rooms**: `scripts/make_gaming_grounds.py` draws three placeholders
  (an RGB desk setup, a bedroom at night, a living room with the TV) that the
  gaming lines, gaming headsets and monitors stand on instead of the NASA
  pictures. Real photographs are item 5 of docs/scrape-intake.md.
- **The trunk's showcase re-cleaned**: the gated picture swap (157 pictures on
  111 cards) and the invented-claim rewrite (198 lines on 145 cards) applied
  again after the merge, then the §I measurements and the re-thumb. Content
  audit after: flagged pictures 0 (102 before), invented copy 0 (145
  before), 415 of 971 cards live; held: 284 retired by the curation (§K),
  270 the design school, 17 words covered by other words, 8 under 3:1, 5 the
  same words twice, 2 a shape over the words (a card can fail more than one).

After a change to a style, a pass, a ground or a template family, add these to
the §P order (after the showcase chain, before `audit_templates.mjs`):

    python3 scripts/photo_subjects.py                  # a new or replaced photograph: map its subject
    node scripts/subject_audit.mjs --sheet             # products off their subjects, every family
    node scripts/tagline_audit.mjs --per 2 --sheet     # every style on every family, picture and video

Audited 2026-09-28 (the log entry of that date): every check below passes
on the branch, and the editor's tagline cases a code review found are fixed.
Open from that audit:

- **What is live is unknown from a cloud session.** Its network policy
  denies `*.netlify.app`, and the Netlify connector attached there sees one
  project, `buybackad-finished-copy`, not `buybackad-graphics-studio` (the
  one AGENT-BRIEF deploys). Deploy from the Mac as the brief says, or give the
  connector the right team before deploying through it.
- **photo-subjects.js loads with every page** (107 KB, 28 KB compressed),
  the landing included, because a render must never run before it (a product
  would stand differently in the first thumbnails than in the Studio). Loading
  it with the backdrops would need every early render re-drawn once it lands.

The video maker (`motion/`, mirrored from the phone ad engine: do not edit
here) has its own vocabulary for the same ideas. The Studio's styles, in its
terms, so the two can be joined in that repo:

| Studio tagline style | motion/ `text_fx` / `color_mode` |
|---|---|
| as designed | the card's own |
| street | `gradient` + `outline`, on every line (`color_mode` split) |
| gradient | `gradient` |
| pair | `gradient` (two-colour) |
| blocks | `box` / `highlighter` |
| outline | `outline` |

What the video maker has that the Studio's templates do not, for the owner to
pick from before any is built here: the number styles (`number_style`: pill,
box, sticker, ticket, tag, neon, split, stacked, chrome, gold), the urgency
elements (ticker, caution tape, stamp, arrows, flash border) and the sign
boards. Built as Studio choices they would go where the tagline style went: in
`renderEzCanvas`, for every template, never one family.

## R. 2026-09-27 (night) — one measure, one gate, the pipeline in one place

Done (DESIGN-LAW rule 87, docs/COHESION-AUDIT.md): `pgCheck` is the measure,
`pgGate` runs before every export, `gateRecords` before every record write,
`verify_showcase.mjs` before a commit; the classics no longer load graded;
the Easy overlay is shade; a theme keeps a photo-led card's photograph; the
content audit keeps curation stamps; one live predicate.

**The showcase pipeline, in order** (replaces the §H, §I and §K lists; each
step is measured by the gate before it writes):

    node scripts/refresh_showcase.mjs                      # palettes, faces, copy rules, from git HEAD: FIRST, or it discards everything after
    node scripts/import_lab_export.mjs                     # new records from the lab (restores the tone grade: before naturalize)
    node scripts/repalette_showcase.mjs --write            # palettes only, on the records as they stand (the proven 25, 2026-09-30); any time
    node scripts/number_block.mjs --write                  # the number, big (rule 53)
    node scripts/naturalize_showcase.mjs --write           # photo in its own colour (rule 56)
    node scripts/restage_glasscards.mjs --write            # Glass Card: product on the card (rule 59)
    node scripts/darken_grounds.mjs --write                # shade dark, never milky (rule 62)
    node scripts/darken_grounds.mjs --resolve --ids <blurred ids> --write   # blurred cards: strict shade (rule 86)
    node scripts/darken_grounds.mjs --lighten --ids <live photo ids> --write   # bands, the lightest shade that passes the gate (rule 87)
    node scripts/clear_number.mjs --write                  # nothing drawn on the number
    node scripts/support_highlights.mjs --write            # support colour on the selling points (rule 63); BEFORE neutral_panels
    node scripts/neutral_panels.mjs --write                # no hue over the photograph (rule 85)
    node scripts/vary_grounds.mjs --write                  # every kind of ground (rule 86)
    node scripts/audit_showcase_overlap.mjs --write        # cover / clip stamps (before content)
    node scripts/audit_showcase_legibility.mjs --write     # legib stamps (the one measure)
    node scripts/audit_showcase_school.mjs --write         # the critic (the one measure + its own checks)
    node scripts/audit_collisions.mjs --json .render/collide.json
    node scripts/audit_showcase_content.mjs --write        # `defect` from the stamps (keeps `curated`)
    node scripts/curate_showcase.mjs --write               # the owner's cut
    node scripts/hold_showcase.mjs --write                 # the owner's audit (assets/showcase/holds.json, rule 105), LAST
    node scripts/tag_subjects.mjs --write                  # what each card sells, for the landing's mix (rule 106)
    node scripts/mix_check.mjs                             # the landing keeps the owner's mix: exit 1 on a drift
    node scripts/verify_showcase.mjs --write               # the gate over the library: exit 1 stops the commit
    node scripts/rethumb_showcase.mjs                      # then bump ASSET_REV in app.js
    node scripts/measure_showcase_color.mjs
    node scripts/landing_check.mjs

Never after darken: `supply_backgrounds.mjs` (it writes a tinted tone scrim;
retire it or rewrite it on the gate). Never on the showcase: `decollide_text`,
`replace_cutouts` (alignPass 4b/4d and number_block do their jobs).

Done on 2026-09-28 ("fix and push all redesigns, audited before pushing"):
the classics re-baked under the gate. `assignStyle` grades nothing; the
contrast table (289 layers), the number table (509 layers on 162 classics,
median number 64 -> 109px) and the ground table (235 classics, every
image-backed one, a skipped solve keeps its previous row) re-solved in that
order; the engine floors the number at 72px after the guides fit
(`pgNumberFloor`: a pill grows, a band lets it slide); a hex block big enough
to carry copy is drawn solid, thin rules stay at 45%; the editor hand-off
refits the visitor's words and re-runs alignPass. Measured: classics 38 ->
16 failing the gate (of 243); the 16 are held back from every list by
`assets/classics-gate.json` (`verify_showcase.mjs --classics --write`).
Showcase 399 pass. Superseded scripts removed (20 files).

Still open, from the audit (numbers in docs/COHESION-AUDIT.md):

0. **The 16 gated classics**, each a layout that the tables cannot fix:
   `neon_sell` (its number on a plate no shade serves: rebuild the layout);
   `reviewProof` x4 and `editorialLux` (the number's ink on a paper plate at
   2 to 2.9:1: the paper palette's number plate needs its own ink rule);
   `agencyGrid` x2, `trustSeal`, `arcCrown`, `voltStack`, `slabPoster`
   (headline or CTA on the photograph under 3:1 with no neutral scrim that
   holds every line: re-set the copy on a plate); `pkm_attic` (headline too
   small as a tile); `splitcol` x2 (the number off its column plate). Fix the
   layout builders, run `verify --classics --write`, and a card that passes
   leaves the gate table by itself.
1. **The classics' re-bake** (done above; kept for the order): `assignStyle` no longer grades, so the 129
   rows of ground-fix.json now only supply the shade; three dark-ink
   classics stand on 0.86 paper, every hex plate is drawn at 45% (rule 21 vs
   64), nine designer layouts author the number under 72px. Re-bake with
   `naturalize_classics --prefer dark`, `number_block --classics`, then run
   the gate over TEMPLATES (a classics `verify` is the missing script).
2. **The editor path** (done 2026-09-28: the hand-off refits and re-aligns;
   the editor's gate shade is bands from the scene, like Easy Mode's).
3. **The classics' passes** (inkVsWash, gradInkContrast, localGroundContrast,
   applyMeasuredContrast) each carry their own luminance, contrast and plate
   finder and each claims to be final. Fold them onto `pgCheck` at the
   re-bake; until then they are frozen.
4. **Retire the superseded scripts** listed in the audit once nothing in
   .render depends on them.
5. **A classics verify** (`verify_showcase.mjs --classics`): the gate over
   TEMPLATES, so the Easy strip is held to the same measure as the library.
   (Done 2026-09-28.)
6. **Backgrounds visible** (2026-09-28, "make sure the backgrounds are
   visible"): done as the bands shade (rule 87): library median 62% of the photograph showing (26% before), classics 72% (49%). Still whole-card:
   the Easy photo swatches' base scrim (0.36 to 0.42 graded) before the gate
   shades further; `naturalize_showcase.mjs` still solves 'normal' only (it
   runs before darken, which re-solves).

## M. 2026-09-30 — the visual audit

Every offered classic rendered and looked at (contact sheets); the defects the
gate could not see are now rules 91 (widened) and 92 and are settled in the
engine. Still open:

1. **Small supporting copy.** A tenth of all reading lines are 19 to 24px on
   the 1080 card, about 7 to 9pt on a phone. A floor would redesign the
   densest layouts; do it per layout.
2. **Item lines over busy photographs** (some gold cards): the shade is solved
   for the headline; the 20px list over the chains reads poorly.
3. **The library's 415 cards** have not had the same by-eye pass yet.
4. **Two classics held back by the Zodiak swap (rule 92)**: Zodiak sets about
   35% wider than Melodrama, so `coins_graded`'s long headline is fitted
   under the 160px-tile floor and `dl_strips_duoSplit_emerald`'s headline no
   longer fits its column. Each needs its own layout fix (a shorter line or a
   wider column); the swap stays, since it makes some twenty gold, silver and
   coin headlines readable.
6. **The designer audit's default cards include four held classics**
   (sell_iphone, gold_spot, cars_kbb, pkm_binder, all in template-holds.js
   on every line), so `designer_audit.mjs` reports "the card did not open"
   for them on any build; its two library cards pass every measure. Point
   its default list at offered cards.
5. **Four more classics held on the merged engine** (2026-09-30), each a
   real defect the trunk's gate could not see and each needing its own layout
   fix: `st_coins_splitcol` (the number runs off the left of its plate),
   `dl_phones_lowerThird_ocean` (the number sits on "SELL YOUR"),
   `dl_gold_priceAnchor_gold` (the one-line item list over the watch, 2.93:1),
   `of_mac_center_sun` (the laptop cutout touches "Sell it.").

## S. 2026-09-29 — three lines of work made one

The owner: "ok work around push and commit" (the live site could not be seen
from the cloud session, and the Netlify connector sees only the
finished-copy project). What the connector showed: production on
`buybackad-finished-copy` was `claude/fervent-pascal-w6mthe` (26037de, the
gate, the bands shade, emoji accents), deployed by another session at 01:37;
the trunk (`claude/vibrant-lovelace-rze4rx`) had nine commits past this
branch's last merge (the tagline looks v2 and their panel, the number fill,
patterns, the phone picker, the owner's fonts); and this branch held the
one-engine work neither had. A deploy of any one would have taken the other
two off the site.

Done (DESIGN-LAW 83 amended; the log entry of the same date has the numbers):
- Merged the trunk, then the live branch, into this one (merge commits, no
  rebase). One tagline engine: the trunk's looks and panel with this
  branch's every-template machinery; every look solved on the card; the
  gate, the shade and the emoji on every card with the looks after them.
- Rule numbers: the trunk keeps 64-78; this branch's are 79-84; the live
  branch's 64-67 are 85-88. OPEN-ITEMS: this branch's N/O are P/Q, the live
  branch's L is R.
- AGENT-BRIEF landmine 7: a production deploy must contain what is live.

Found on the way, and done:
- The live branch's classics gate measured each classic before its faces and
  photograph had loaded, and passed cards that do not read: measured whole,
  24 classics read under 3:1 on the live branch itself (we_buy's "iPHONES"
  2.54:1). verify_showcase --classics prepares each card now, and both tables
  hold the 24 back (classics-gate.json and template-holds.js agree).
- The trunk's phone picker offered ten phones outside the owner's approval
  list; it asks the list now.
- The live branch's emoji accents changed the owner-approved 9:16 render; a
  card in assets/approved/ gets no accent unless the visitor shuffles.
- The trunk's plate air slid a line past the 6% guides on a plate running
  off the card; its room now stops at the guides.
- The content and school audits hold a card that fails the gate, and honour
  the owner's approved copy (rule 78 over 80) and letter-audited records
  (rule 76).

Open:
0. **Bring the held classics back** (57 of 404 fail the gate measured
   whole; 24 of them the live branch still offered). Re-solve their shade with the corrected
   measure (naturalize_classics / darken_grounds --lighten, both under the
   gate, which now loads each card whole), then verify --classics --write and
   audit_templates --write: a card that passes leaves both tables by itself.
1. **Other sessions keep building on their own branches.** Merged here
   later the same day: the trunk to 2653d81 (the variant board) and the
   colour-theme session (`claude/eloquent-euler-7jvzfd`) to 9aa5ed0; both
   were still committing. Whichever of the three deploys next must merge the
   other two first (AGENT-BRIEF landmine 7), or it takes their work off the
   site. `claude/quirky-ritchie-f0zuc8` (the design console) is cut from the
   August `main`: port its console, do not merge it.
   2026-09-30: production had moved again (the live branch deployed 9318537
   at 09:42, the iOS-only emoji); it is merged here, so this branch contains
   what is live, the trunk to 0d2915f and the colour themes to a040eb1. At
   the owner's request each of the three sessions was told, by a one-shot
   Routine into its own conversation, to merge this branch before any
   deploy. `claude/project-thread-hkdmrf` (the video work, merged with
   `phone-ad-maker`) is cut from the August `main` too: not merged.
2. **The number fill ignores deco.** `numberFill` grows the number to fill
   its plate and keeps it off other copy and products, not off a drawn mark:
   on checklistHero-du07-15 the number now reaches the sparkle on the plate's
   left edge. Teach it the deco marks (paths) on its plate.
3. **The synthesised badges ignore deco too** (on the live branch before the
   merge): Easy Mode writes the selling points at a fixed spot (top right),
   where some cards draw a sparkle (checklistHero-du07-15 shows "CA$H").
4. **Badge words and rule 80.** The owner's own badge list (BADGE_WORDS:
   #1 BUYER, TOP BUYER, BEST BUYER) is a rank, which rule 80 takes out of
   headlines; the owner-approved Steps Flow cards say TOP iPHONE BUYER. The
   owner decides which stands.
5. **Two tables hold classics back**: template-holds.js (this branch's
   template audit: 143 of 404, the whole design school) and
   assets/classics-gate.json (the live branch's gate, which now measures every
   classic: 57 fail, all of them among the 143). One table and one measure is
   the unification left to do.
6. **Looks choose a variant on the card**: glow, the red and blue print, 3-D
   block and the fills (street, multicolour, pattern, a gradient's side) are
   measured by the critic and can end tamer than drawn on a hard ground (a
   glow as a deep rim, a pattern pushed deep). If the owner would rather see
   the look as drawn and a note, the critic's note is the place for it (the
   variants are in taglineStyle).
7. **Not verifiable from a cloud session**: the live site. The environment's
   network policy denies api.netlify.com, app.netlify.com and *.netlify.app,
   so neither a look nor a deploy reaches Netlify from here. On 2026-09-30 the
   owner asked this session to deploy; auto mode's Production Deploy rule
   stopped the Netlify connector's deploy-site before it ran. A production
   deploy from here needs the owner's own permission for it (or a deploy from
   their machine: AGENT-BRIEF, Deploying).
8. **Three offer cards still cover their photograph's subject** (rule 84;
   the subject audit, 438 templates): of_laptop_row_midnight (12.6% of the
   subject), of_strips_split_bone (25.1%) and of_camera_row_sand (30.1%).
   The product could not move off it inside the guides. Neither table holds
   them; hold them or give them a photograph whose subject leaves room.
9. **Two readers of a card's palette.** The looks read it with `tplPalette`
   (the showcase record, the family PAL, the scene), the colour themes with
   `thSourcePalette` (the record, else the scene by the jobs its colours
   do). They agree on showcase cards and can differ on a classic. One
   reader, used by both, is the unification left to do.
10. **Easy Mode and the gate's own path draw different cards.** The classics
   gate prepares a template the gallery's way and measured the offer card
   of_gold_row_cobalt's number at 76.5px; Easy Mode grows it to 109px
   (numberFill), and ran it off the card until today. Two templates the gate
   passes fail it in Easy Mode (dl_gold_priceAnchor_gold "Price Line",
   dl_strips_arcCrown_emerald "Headline 2", legibility). The sweep that found
   it, `scripts/ez_gate_sweep.mjs` (every offered template through
   renderEzCanvas and pgCheck; 261 swept, no number off its guides now),
   belongs in verify_showcase --classics: one path for both.
11. **Sparse patterns on a card with little open ground.** The theme audit's
   pattern check fails dots (0.5% of pixels) and grid (0.8%) on
   of_gold_row_cobalt, whose photograph, copy and bands leave little ground.
   The pattern now sits over a card's own shade and vignette as it does on
   every other card (ezGroundStack). Decide: a denser pattern where little
   ground shows, or the audit measures the change over the ground that shows.

## T. 2026-09-29 — the theme, background and effects controls do what they show

Lettered P on the colour-theme branch; T here, after §P to §S merged before
it (its references follow).

Done (DESIGN-LAW rule 90, `scripts/ez_theme_audit.mjs`): a colour theme
repaints every plate, mark and line and solves each line on its own pixels; an
ORIG chip; the theme follows the visitor and its chip stays in step; the
selling points' ✎ style works on a card's own list; blur adds to the
photograph's own, says why when it is off, and reaches the editor; ORIG is lit
only over a real photograph; the Layers row's background swatch is the photo
that loaded (§J 8, fixed); the overlay takes the tone the copy on the
photograph needs; the six swatches are the theme's; the copy follows a ground
the visitor picks, theme or none. The audit reads 1148 problems on the live
build and none here (20 cards, 21 themes).

Still open:

1. **Three heads.** This branch is `claude/fervent-pascal-w6mthe` (what
   production serves) plus this work; `claude/vibrant-lovelace-rze4rx` (the
   trunk: tagline styles, tall formats, patterns) and
   `claude/vibrant-hawking-htxrvn` diverged from it. When they meet,
   themeScene runs before ezApplyTagline (the tagline reads the scene's
   palette), and DESIGN-LAW's 67 exists twice (emoji accents here, a different
   rule on the trunk).
2. **Seventeen of the twenty-one themes have no support colour**, so a card's
   support plates (kicker ribbons, price strips, phone pills) take the theme's
   ink: a white pill on a dark theme, a near-black one on a light theme. They
   read (the audit measures them), but a support colour per theme, chosen the
   way rule 51 chose the four GFX Grammar ones, would give those plates a job
   of their own. The owner's call which hues.
3. **The grey placeholder** (§J 7): Easy Mode still previews a classic's
   photograph grey and blurred until a background is picked, and exports the
   flat fallback in that state. The swatch row no longer says ORIG is chosen
   while it does; whether to keep the placeholder at all is the owner's.
4. **Themed thumbnails.** The strip and the landing show each card in its own
   colours; a theme is seen in the preview only. Re-rendering the strip in the
   theme costs a render per card per pick.
5. **Easy Mode and the editor lay some cards out differently.** On Sell Your
   iPhone, Easy's product list is larger (937 by 146 against 809 by 125) and
   hangs off its smoke panel onto the paper band. There no single ink serves
   all three lines, and the theme treats it as standing on the ground. The
   editor keeps it on the panel. This predates the theme work; both read.
   **Done in part 2026-09-30** (DESIGN-LAW rule 91, §U): the two agree. The
   editor laid the visitor's words out a second time over objects already
   fitted, and that second layout was the smaller list (0.81 of its size,
   against Easy Mode's 0.935). It now lays them out once, and every box is
   within 3px of Easy Mode's. The overhang stays, now in both. The panel is
   the classics' bodyPanel, sized from the authored text before the layout
   sets the list, so the fix belongs to the classics' passes (then
   `verify_showcase.mjs --classics --write`).
6. **Photographs the visitor uploads** are not re-inked (a shade does that
   job, rule 62), so white copy on a bright photo of their own still depends
   on the gate's shade at download.

## U. 2026-09-30 — every line of work on `main`

The owner: "Audit and push all to main site, unify the sites or branches."
`main` had not moved since 2026-08-28. It is now the whole product: every
branch below is an ancestor of it, merged with merge commits (nobody's
history rewritten), audited, and `main` fast-forwarded to the result.

Merged, in order (the log entry of the same date has the numbers):
- `claude/vibrant-hawking-htxrvn` to 11bed85 and again to e0b1506 (the one
  engine, and its own merge of the live branch, which agreed with this one);
- `phone-ad-maker` (PRs #2, #3, #4) and so `claude/project-thread-hkdmrf`,
  `-j2pq9z`, `-kte3ml` (every commit of theirs was already in; the merge
  records it);
- `claude/fervent-pascal-w6mthe` to 9318537, what production served (the
  iOS-only emoji, copy never under a shape);
- `claude/project-thread-eost3s` to 8842adc (the video maker, 2026-09-30);
- `claude/eloquent-euler-7jvzfd` to 0769ce3, 8460821 and 5d40adc (the
  designer speaks the house language, rule 93, its §V; its shade and hand-off
  fixes, thumbnails at half the cost, library cards in their own weights);
- `claude/fervent-pascal-w6mthe` again to d5b98b5 (a visual audit of every
  classic: rule 91 widened, one serif to a card, rule 92);
- the trunk, `claude/vibrant-lovelace-rze4rx`, is the branch this was built on.

Not merged, on purpose (§J): `claude/busy-allen-2d5iv1` (the photo standard)
and `claude/quirky-ritchie-f0zuc8` (the design console) are cut from the
August `main`; merged, they would lay August code over September's. Port from
them. Still worth porting: the console's pass switches, re-derived for
today's pass chain (busy-allen's move of `tplbg-data.js` to files was ported
on 2026-10-01, §Y).

Open:
1. **Deploy `main`.** The cloud sessions cannot: the environment's network
   policy denies `*.netlify.app` and `api.netlify.com`, and auto mode's
   Production Deploy rule stops the Netlify connector's deploy-site. From the
   Mac: `git checkout main && git pull`, then AGENT-BRIEF, Deploying (draft,
   look, `--prod`).
2. **One site.** `buybackad-finished-copy` (the connector's, where sessions
   deployed) and `buybackad-graphics-studio` (the Mac's CLI) have served
   different branches. Deploy `main` to both or retire one, and link the one
   kept to this repository's `main` so a push deploys (AGENT-BRIEF, Deploying).
3. **PR #1** (`claude/project-thread-hkdmrf` into `main`, "Bring main up to
   date") is superseded: its head is in `main`.
4. **Branches.** Every `claude/*` branch but the two August ones is in
   `main`; they can be deleted once the sessions on them have merged `main`
   (the owner's call; none was deleted here).
5. **The colour-vision audit** (`scripts/cvd_audit.py`) fails three themes
   (Crimson x Mint and Royal x Tangerine under simulation, Teal x Coral
   before it),
   exactly as it does on the August `main` and on every branch: rule 43's
   finding, waiting on the field research rule 14 asks for.
6. **The designer audit** (`scripts/designer_audit.mjs`, rule 93). Its
   default cards sell_iphone, gold_spot, cars_kbb and pkm_binder are held by
   the template audit on `main`, and lowerThird-nn03-30 by the gate, so Easy
   Mode opens its first card in their place and the audit measures one card
   five times; run it with `--cards` (icloud_ok, bold_buyer, gold_lux,
   cars_anycond, bandKnockout-pp04-15, stepsFlow-jw07-15 were used). On the
   final build (with the designer's 5d40adc): hand-off 0 and ORIG 0% on all
   six, after the themes and after the swatches, no legibility regression,
   1.9 to 2.3 s of blocking in the 12 s after the editor opens (the bar is
   3 s). Left: sparse patterns that change under 1% of gold_lux (dots,
   halftone, grid) and cars_anycond (grid), as on the designer branch (§S 11).
7. **Easy Mode through the gate** (`scripts/ez_gate_sweep.mjs`, 267 offered
   templates): 5 fail, each as on the live branch alone. dl_strips_arcCrown_
   emerald's Headline 2 (legibility, §S 10); one of dl_sports_hudTech_emerald
   and dl_sports_scriptRetro_paper, whose Headline 2 sits at 3:1 and flips
   between runs; dl_strips_duoSplit_emerald's Headline 2 across its plate
   ('straddle', rule 91 widened); of_mac_center_sun's headline under its
   product ('covered'); st_cars_cashfor ('ghost', held by the classics gate,
   which the sweep does not apply). The export gate still asks on each.
   Eight more (the bandKnockout family) were Easy Mode putting every selling
   point in every chip; fixed here (one point to a slot).
8. **dl_sports_scriptRetro_paper's Headline 2 sits at 3:1.** Released by the
   live branch's visual audit (2026-09-30), it is new to the tagline audit:
   with the pair look it reads 2.95:1 (82 templates, every other look and
   template passes; blocks give way on 3, each over its product), and in the
   Easy Mode sweep it passes and fails between runs. The export gate shades
   it when it fails; a line a design keeps at the edge of the bar wants its
   ink moved, or the card held.

## V. 2026-09-30 — the designer speaks the house language

Written on the designer branch as its §U (its §P is §T here); lettered V,
after this file's §U (every line on `main`), and its rule 91 is rule 93.

Done (DESIGN-LAW rule 93, `scripts/designer_audit.mjs`):
- **Colour themes and ORIG** in the advanced editor, from one colour pass
  whose originals survive undo, drafts and saved templates, and are copies:
  ORIG puts the card back exactly after the themes and after the swatches.
  The theme follows the visitor.
- **Grounds and effects:** the six theme swatches, every kind of ground in the
  card's or theme's colours, blur, Shade/Fade and patterns. The ten
  fixed-colour backdrops are retired. A photograph the visitor picks is
  shaded until the copy reads.
- **The library** in the Templates tab. A library card is drawn in its own
  faces from its first render: every weight it sets is loaded, not only the
  face nearest 400 (66 of the 399 live cards set Big Shoulders Display 700).
- **The hand-off** lays the visitor's words out once, as Easy Mode does
  (§P 5, done in part).
- **Undo** carries the ground.
- **Loading:** thumbnails render in idle time and grids fill lazily. The
  designer no longer freezes after it opens, and the landing page loads
  faster.

`scripts/designer_audit.mjs` reads 23 problems on the live build and none here
(six cards, 21 themes). Easy Mode's audit still reads none (20 cards).

Still open:

1. **Easy Mode shades a picked photograph only at download.** In the designer
   the shade is solved when the photograph is picked (edShadeSolve). Easy
   Mode's preview still shows the copy unshaded on a photograph the visitor
   picks, until the gate shades it at download. The same solve on Easy
   Mode's scene (ez.shade) would make its preview honest too.
2. **The designer's Properties** still offer any colour for a line's glow and
   outline. Rule 85 wants glows to be shade, neutral. It is a manual tool, so
   whether to narrow it is the owner's call.
3. **The Template Lab** (`lab/`, linked from the landing page's top bar) is
   an owner's judging tool in an older look. Its index still calls Set 7 and
   Set 9 "newest", and it names a Look menu the site no longer has. It is out
   of this change: it is not the product, and its sets are the record of what
   was judged.

## W. 2026-09-30 — video ads for every kind of person, with voices

Done (DESIGN-LAW rule 97):
- **Sixteen audiences** (`motion/audiences.js`), each with its insight, its
  looks, music, words in English and Spanish, speakers, moods and voiceover
  scripts. Picking one in the maker ("Made for") turns the whole ad to it.
- **Fourteen new looks** beside the LA signs, each measured on its own and
  pruned of what failed.
- **Voices** (`motion/voices.js`): eleven moods, seventeen speakers, each
  played by ElevenLabs voices in order. `scripts/voice_bank.mjs` records the
  bank; the maker picks a take that fits the ad's length. `motion/audio.js`
  cleans it (trim, rumble cut, presence, de-ess, compressor, levelled,
  look-ahead limited) and ducks the bed under it.
- **Every look has sound again.** 76 of 200 looks on `main` had rendered
  silent (a cue before the first frame threw inside the mix), and the audit
  hid it. Fixed, and `scripts/motion_sound_check.mjs` now fails on it.
- **Long headlines land inside the first second** under openings with no line
  to read first.
- `scripts/audience_check.mjs` checks every line, look and script;
  `scripts/motion_sound_check.mjs` checks the sound of 120 looks, all sixteen
  audiences through the real panel, and the voice mix.

Still open:

1. **Record the voice bank (owner).** No ElevenLabs key reached this session:
   none is in the cloud environment, the repo or its history. On a machine
   with the key:

       ELEVENLABS_API_KEY=… node scripts/voice_bank.mjs --dry   # the plan and its characters
       ELEVENLABS_API_KEY=… node scripts/voice_bank.mjs         # 180 takes, 10,414 characters

   (or put the key in the repo's `.env`, which git ignores). In a cloud
   session, the key goes in the environment's settings (environment
   variables), and `api.elevenlabs.io` must be allowed in its network access.
   Then commit `motion/voice/`, and run `scripts/motion_sound_check.mjs`,
   which measures a real take once the bank has one. Until then the maker
   shows each ad's script and plays it with music and sound only.
2. **Listen to the takes.** The mix is measured on a synthetic voice. The
   first real bank should be heard: a speaker who does not suit its cast is
   one line in `CASTS` (the voices it tries, in order), and a mood that reads
   wrong is one line in `VOICE_MOODS`.
3. **Spanish voices.** A Spanish line uses a Spanish-labelled voice from the
   account if there is one, else a premade voice speaking Spanish through the
   multilingual model. Adding one or two native Mexican-Spanish voices to the
   ElevenLabs account (Voice Library) before recording would make the vecina
   and the vecino sound local.
4. **Gamer RGB's contrast reads 0.83** on the audit: its misses are the neon
   tube, which the house's neon motel shares (0.80). Neon stays, the owner's
   first choice; if the audit's reading of a glowing tube is wrong, that is
   a change to the measure, not to the look.

## X. 2026-09-30 (night) — every card, every choice; curves, warps, type pairs

The owner: "make sure all classic and current themes are audited and ready
for use with new color schemes, new design language, new typefaces / text
design", "ability to make clean warps and curves", "and pre warped / curved
for select templates where the design is supportive or designed around that".

Done (DESIGN-LAW rules 99, 100, 101; `scripts/every_card_audit.mjs`):
- **Curves and warps** on live text, in the designer's Properties and Easy
  Mode's ✎ menu; arcs bound to their rings; the library's curved headlines
  take the visitor's words again.
- **The owner's eighteen type pairs** as a choice for the whole card, in Easy
  Mode and the designer; two families on every classic.
- **Every offered card under every choice**, on Easy Mode's render: 735
  cards, 37,485 renders gated. 16 cards fail as offered and are held; 395 of
  15,435 theme renders fail (2.6%), 33 of 8,820 looks (0.4%), 1,540 of 13,230
  voices (11.6%), each held on its card (assets/choice-holds.json): its chip
  is off, the reason is under the row, a carried pick is set aside there.
  314 classics and 405 library cards are offered.
- **The gate, the template audit and the contrast bake** see a line's own
  backing as its ground; the bake measures each line with the card laid out
  round it; the template audit judges a line over a line, or anything over a
  curve, by the letters.
- **The classics' tables** re-baked on this engine, twice, with held classics
  baked too and the offer family left as authored: contrast 284 rows on 142
  classics, numbers 594 layers on 191, grounds 241. The classics gate holds
  58 (63 in production), the template audit 82 (137): 320 of the 404
  classics pass both (264), and 314 once the cards that fail as offered are
  held.

Still open:

1. **The contrast bake repairs by its own measure, not the gate's** (rule 87:
   one measure). Of the 59 lines the gate fails on the 48 classics held for
   legibility, 53 have no row in assets/contrast-fix.json: the bake judged
   them by the mean of an ideal ink against the ground, the gate by the 75th
   percentile of what the letters actually changed. Have bake_contrast repair
   any line the gate fails (a critical line under 3:1 by pgCheck's core),
   then run the chain and sweep the cards it releases (`--ids`).
2. **A wide voice on a full-width claim.** A voice keeps each line's
   footprint, so a claim already as wide as the card shrinks in a wider face:
   987 of the voice holds are a headline under the feed tile's 77px, and
   Modern (Unbounded) is off on 379 cards, Serif on 197, Retro (Bungee) on
   187. On a card set in a condensed face the number, held at its 72px floor,
   also runs off its plate (reviewProof-cd06-15 in Russo One: the headline
   95px to 53px). Unbounded and Bungee are tall for their width too, so
   stacked lines run into each other. The answer is a voice that knows its
   own width: the claim on two lines at size, or a leading and a size floor
   of the voice's own, and a second layout pass after it.
3. **A mark vanishes on what it sits on under a theme** (242 of the theme
   holds, on 22 library cards; the same on production's engine): stepsFlow's
   step-number boxes, trustSeal's phone cue, small elements. themeScene's
   marks step fixes a mark against the plate it finds under it (hostOf), and
   these sit on something it does not count as a plate.
4. **Headlines under 94px.** With the number at its 72px floor a headline
   needs 94px to lead by 1.3x (rule 53). Nine hand-built classics (gold_spot,
   silver_ster, coins_grandpa, coins_graded, strips_clean, strips_pickup,
   sports_score, sports_goat, pkm_attic) and three lowerThird cards (phones,
   strips, sports) set theirs smaller, most because the words fill the width.
   They stay held; the answer is a two-line claim at a larger size, which is
   the owner's copy to break.
5. **The visitor's device list overruns a classic's info panel** (§P 5).
   In Easy Mode the phone pick writes the devices into the info line, three
   lines where the card drew two: Sell Your iPhone's list runs out of its
   dark panel onto the cream bar, where its last line is light on light. The
   settle pass (pgUncover) finds no clear slide onto either plate and does
   not combine a smaller size with a slide. The card is held as offered; the
   answer is the body panel that follows its words. The same pass leaves the
   four topstrip classics' number on their call to action, and eight
   scriptRetro library cards' number half off its band.
6. **The tagline critic still hides the whole line** (`taglineCritic`,
   `fillLegibility`): a look on a line with a backing is judged against the
   bare photograph. No classic's headline has a backing today. A depth copy
   (`cloneText`) also copies its line's backing, which would stack panels.
7. **One-off repair scripts still hide whole layers** (audit_card,
   clear_number, neutral_panels, repair_showcase_contrast,
   repair_showcase_ink, support_highlights, tagline_audit, vary_grounds).
   None of them runs in the classics' chain; switch each to `pgHideInk` when
   it is next used.
8. **scripts/neutral_panels.mjs** throws a ReferenceError before it measures
   anything (found while tracing the gate, not investigated).
9. ~~**Enhance undoes the face passes.**~~ Fixed 2026-10-01 (§Y): Enhance
   restores each line as the studio offers the card now (`enhanceTraitOf`:
   the load-time faces, tables and sizes), and its colours as built
   (`pgBuilt`, through the ORIG pass), then puts a theme and a type voice
   back on. Checked on three classics: a hand colour, face and size undone
   exactly, and theme plus voice as on a fresh card.
10. ~~**Three patterns change nothing on gold_lux**~~ Fixed 2026-10-01
    (§Y): a pattern's tone was always dark, black dots on a near-black card.
    The first pattern now takes the tone that shows on its ground (Easy
    Mode reads the preview, the designer the ground; Light still turns it
    over): dots, halftone and grid change 1.6%, 11% and 2.3% of gold_lux
    (0.1% to 0.4% before).
11. **The sweep takes about eleven hours on four cores** (the gate reads each
    line's pixels back after a render: 1.3s a render, more than half of it
    getImageData). Run it with `--ids` for the cards a change touches, and in
    full before a release that changes the engine, the themes, the looks or
    the voices. `--resume` continues a stopped run.

## Y. 2026-10-01 — proven palettes

Done (DESIGN-LAW rule 103, written as 95 on its branch): the showcase's 29 palettes ("Lilac & Citrus",
"Grape Soda", 19 of them food) replaced by twelve proven pairings (Navy &
Gold, Navy & Orange, Midnight & Cyan, Blue & Green, Green & Gold, Purple &
Gold, Teal & Orange, Red & Yellow, Black & Gold, Black & Red, Black & Green,
Silver & Blue). Colour only: `scripts/repalette_showcase.mjs --write` re-hues
every record under the luminance lock, then the thumbnails, the colour
measure and the gate were re-run: 415 of 415 live cards pass, none lost,
median critical contrast 5.56 to 5.55:1, 0 colour-blind regressions. The palette grid's swatch now
comes from the card with the most vivid accent (`scBuildFamilies`).

Re-running it: `repalette_showcase.mjs` works on the working tree and maps
from each card's CURRENT roles, so run it from the commit before this one
(`git checkout <that>^ -- assets/showcase/`) or it re-hues colours it already
moved. `refresh_showcase.mjs` now imports `familyOf` from
`refresh_palettes.mjs`.

Still open:

1. **Light red and light orange are hard.** Pale accent type cannot be red or
   orange (it reads salmon or peach), so those palettes only go to cards
   whose accent is mid or dark, and red is further held back by the
   colour-blind check: Black & Red carries fewer cards than the others. A
   layout that puts white words on a red plate, rather than red words on
   black, would let red go further; that is a layout change, not a colour pass.
2. **The classics** (the 243 in `app.js`) and the Easy Mode colour themes
   (`THEME_DECKS`) were not touched; they have their own palettes.
3. Off the owner's Mac the thumbnails were drawn with fabric 5.3.0 from npm
   (cdnjs, which serves the page's 5.3.1, is blocked here). The gate passed on
   the same renderer; a re-draw on the Mac would use 5.3.1.

## Z. 2026-10-01 — everything left behind, merged; the UI cleaned up; on `main`

The owner: "clean up the UI and push and commit so we are finally live with
all working features and all the relevant and necessary features and
anything left behind. Make sure we fix it."

Thirteen branches carried finished work `main` did not have, several still
being pushed to while this was merged. Merged into
`claude/eloquent-euler-7jvzfd` with merge commits (nobody's history
rewritten), checked, and `main` moved to the result:
- `claude/fervent-pascal-w6mthe` to 8334c95 and again to 61d77f1, what
  production served (one colour to a card, rules 95 and 96; the poster look,
  rule 98);
- `main` to da82a13 and c60355f (video ads for every kind of person, with
  voices, rule 97);
- `claude/sharp-maxwell-q2aq4o` to b97076d (34 phone backs for the video
  maker, one angle a video, turned phones as 3D slabs);
- `claude/optimistic-edison-xbbk02` to 7efd7da and again to 470b852 (library
  cards wear the headline looks, emoji on sparse cards, plates that hug the
  number, the iPhone 18 lines; the gate's `numCentre`, rule 102);
- `claude/dreamy-knuth-9123rb` to 2a49223 (the backdrop generator,
  candidates only; its 25 palettes were merged and then replaced, below);
- `claude/tender-carson-jq5lbr` to 3e4118c and again to 07cc227 (the
  palettes' food names, then twelve proven pairings, rule 103, §Y);
- the video maker's branches, merged by a helper session in its own
  worktree and brought in at 6f762f6: `claude/kind-hawking-kbuw14` to
  0a86e83 and 6e71a9c (phones that do not bury one another, shelves by
  look, 24 ground spin-offs, clean placements, the Phone angle, accents,
  fifty themes held, what is previewed is what is downloaded),
  `claude/determined-brown-ned7iy` to d55e9a3 and 672bf3f (phones in flight
  at frame 0; real instruments, 13 grooves, 16 public-domain tunes and
  recorded sounds), `claude/more-phone-layouts-3bgshy` to 666b1d4 (15
  layouts, 11 entrances, a rating round on /admin-ads),
  `claude/professional-ad-audio-5e9i1b` to 92616bd (the commercial score,
  -16 LUFS), `claude/fervent-heisenberg-d1edfb` to 60e616d (video export
  that falls back instead of failing, and says what is missing),
  `claude/video-ad-gallery-2kzfho` to ce2ddb8 (the full-width gallery of
  moving looks) and `claude/sharp-maxwell-q2aq4o` again to e532cd0
  (straight-on cameras on the phone backs);
- this branch's own work (curves and warps, type voices, every choice
  passed: rules 99 to 101, §X).

Not merged, on purpose (§J, §U): `claude/busy-allen-2d5iv1` and
`claude/quirky-ritchie-f0zuc8`, cut from the August `main`. Port from them;
busy-allen's `tplbg-data.js` move is ported (below).

Decisions the owner may want to look at:
1. **Palettes: twelve, not twenty-five.** Two sessions answered the same
   request ("not super obscure or niche ones ... appealing and proven to get
   clicks", 2026-09-30; "less niche color schemes, and more proven",
   2026-10-01): the palette session with 25 pairings, never deployed, and
   this morning the palette-names session with 12 (Navy & Gold, Navy &
   Orange, Midnight & Cyan, Blue & Green, Green & Gold, Purple & Gold, Teal
   & Orange, Red & Yellow, Black & Gold, Black & Red, Black & Green, Silver
   & Blue), checked for colour-blind readers and muddy warm colours, with no
   food names. The twelve, the answer to the later message, are on the
   site. The 25 are in the history (dreamy-knuth's 0a99ea91) if the owner
   wants them back. The backdrop generator keeps its own 25 for its
   candidates (scripts/backdrop_palettes.json).
2. **The library's records were re-coloured here, not taken from the palette
   branch**: 334 of them had moved on since it forked (rule 94's cut-off
   products, the library looks and plates, the centred numbers). Its own
   colour-only pass, run on this line's records as they stood before any new
   palette, gives the same palette to all 971 cards and the branch's records
   byte for byte where nothing else had changed.
3. **Rule numbers.** The poster look took 98 on the live branch, so this
   branch's rules are 99 to 101; the library branch's centred number,
   written as 94, is 102; the palettes, written as 95, are 103.
4. **The video maker, where two branches answered the same thing** (the
   helper's choices): one spread pass (kind-hawking's); one 3D renderer
   (sharp-maxwell's slab, chosen by rendering both) with kind-hawking's five
   Phone angle choices; one guard against sound before the first frame;
   professional's commercial bed with main's voice over it and
   determined-brown's grooves and tunes played through it; one gallery. Two
   are the owner's to tune: a shuffle picks a tune in about 86 of 120 looks
   (`WEIGHTS.melody.none` and `WEIGHTS.accent.none` in motion/catalog.js set
   how often the plain commercial score plays), and no audience names any of
   the 13 grooves yet.

Fixed on the merged build (the first five were on production too):
- The phone designer showed no canvas after its tour (both side panels were
  left open over it).
- Enhance put back the authored file, not the card as offered: three faces,
  and the inks and the number size the tables had fixed (§X 9).
- A pattern drew black dots on a black card; five of six sunburst grounds
  drew black on black on a dark card (§X 10).
- Easy Mode's layers list ran each name into its words ("TitleCASH BUYER").
- The landing loaded `tplbg-data.js` (635 KB of eight photographs as base64)
  before the studio; they are files in assets/tplbg/ now.
- Under the one grey theme (Clean Slate) a card's own look kept the card's
  colours (once the library cards wore looks).
- The held-choice note speaks the visitor's language; "Colour" everywhere;
  shorter hints.

Checked on the merged build: every JS file parses (265); CSS_FALLBACK in
sync; the CSP hashes unchanged; ten pages at 390 and 1440 with no page or
console error and no sideways scroll; the landing check clean (0 failed
requests, 3.58 MB first load); the library gate 415 of 415 on the twelve
palettes (414 since neonNight-jw04-20 moved, held); the classics gate 58
held, the same 58; the theme audit's six findings answered (two fixed,
three held on one card); the designer audit's theme and ORIG checks (its
timings were taken on a loaded machine); Enhance and the pattern tone
checked on three classics; the studio's video download under the
production CSP (exit 0, 10 s, 300 frames, sound); on the video maker
(the helper, on its final head) audience_check, motion_sound_check over
120 looks, every new sound at -16 LUFS, downloads at 1:1 and 9:16 with
sound. This Chromium has no H.264, so the MP4 path itself is untested here.

Open:
0. **Deploy `main`.** It is pushed (2b5fc56 and on) and contains what
   production serves (61d77f1). This cloud session could not deploy it: the
   Netlify connector's deploy-site hands back
   `npx @netlify/mcp --site-id … --proxy-path https://netlify-mcp.netlify.app/proxy/…`,
   which zips the working tree (all but node_modules and .git, about 400
   MB) and uploads it through `netlify-mcp.netlify.app` to `api.netlify.com`,
   and the environment's network policy answers 403 to both (twice, a fresh
   token the second time). Either allow those two hosts in the environment's
   Network access and deploy from a session, or from the Mac: AGENT-BRIEF,
   Deploying (a clean worktree of `origin/main`, then the draft and
   `--prod`). The owner's first try from the Mac ran in the home folder, not
   the repo (AGENT-BRIEF, Deploying): if that deploy finished, publish the
   last good deploy again and delete it from the project's deploy list
   before anything else.
1. **The choice holds, measured on the merged engine (done 2026-10-02).**
   The full sweep (`node scripts/every_card_audit.mjs --write-holds`) ran on
   `main` at 8c15d48: 735 cards, 37,485 renders (themes 15,435, looks 8,820,
   voices 13,230), no card that failed to open, no page errors. A container
   restart cut it at 275 cards; `--resume` in tracked chunks finished it.
   assets/choice-holds.json now holds 45 cards as offered (37 for `numCentre`,
   §Z 2; four topstrip classics whose call to action and number collide;
   two reviewProof cards, §Z 3; sell_iphone; dl_strips_arcCrown_emerald,
   below), 444 themes on 53 cards, 35 looks on 27 cards and 1,520 voices on
   416 cards. Against the table it replaced: themes 125 new and 79 cleared,
   looks 5 and 3, voices 13 and 33. The app was checked loading it: the held
   cards are out of the strip and the library, and a held chip is off with
   its reason. Still open from it:
   - dl_strips_arcCrown_emerald is held for its second headline line, which
     sits on the legibility line: it failed four of six measurements since
     2026-09-30, two of three on this build. Raise that line's contrast, then
     `--ids dl_strips_arcCrown_emerald --dims base --write-holds`.
   - 333 of the 444 theme holds are a mark that falls under 2:1 on what it
     sits on, on 30 cards (slabPoster 12, scriptRetro 6, stepsFlow 5); the
     marks are mostly the phone cue and stepsFlow's three step-number boxes.
     A few marks on a few families: worth one look at how a theme paints
     them before 333 holds stand.
   - The Modern voice is off on 379 cards: the headline too small in a feed
     on 239, the number or the call label running into another line on
     about 140 each. Serif (198 cards) and Retro (186) fail mostly for the
     headline's size. A voice that fails on half the cards wants a fix in
     the voice, not holds.
2. **A number alone on a band that runs off the bottom** (rule 102). 37
   cards are held as offered for `numCentre`: 16 stepsFlow and 16 trustSeal
   library cards (their band holds the number and the website; with the
   visitor's website empty, Easy Mode leaves the number high on it) and the
   four street price badges; and neonNight-jw04-20, whose number the
   library session moved to stay on its plate at 9:16 and whose gallery
   thumbnail still fails (0.14). The layout centres a lone number as far as the
   bottom guide lets it (`numberCentreY`), the gate measures the band as
   seen, and these bands are too shallow under the guide for both: centred
   as far as the guide allows, stepsFlow-cd04-30's number is still 12.1%
   off. The answer is a plate that hugs the number when it is alone (as
   `scripts/hug_number_pill.mjs` did for the scriptRetro bars), then
   `every_card_audit.mjs --ids <them> --dims base --write-holds`.
3. **reviewProof's call to action runs under its number's pill** (on
   production too): two of the family are held as offered, and
   reviewProof-cd06-15 has three themes held for it.
4. **One site.** As §U 2: two projects serve the app.
   `buybackad-graphics-studio` (studio.scans.ad, deployed from the Mac's CLI)
   serves what was last deployed from the Mac; `buybackad-finished-copy`
   (the connector's) serves 61d77f1. Deploy the same `main` to both, or
   retire one.
5. **Branches.** Every `claude/*` branch but the two August ones is in
   `main` now; delete them once their sessions have merged `main` (the
   owner's call). Sessions were still pushing while this was merged; merge
   `main` before building on any of them.
6. **Held for the owner:** the fifty video themes (`THEME_REVIEW` in
   motion/catalog.js) and the backdrop candidates (scripts/gen_backdrops.py,
   `.render/backdrops/`); nothing of either is offered until approved.

## AA. 2026-10-02 — the owner's audit: 85 cards off the site, plate words in the plate's colour

Done (DESIGN-LAW rules 104, 105):
- **Every live card looked at.** 86 of 415 are held (`assets/showcase/holds.json`,
  `scripts/hold_showcase.mjs`): 65 drawn grounds with no photograph, 7 cards
  whose photograph is covered by a panel or wash, 13 whose headline does not
  read (a smudged band headline, an outlined serif over a busy photograph, a
  dark headline on its own colour), and `neonNight-jw04-20`, which fails the
  gate on main as well. 329 stay live.
- **Plate words wear the plate's colour** (`pgPlateInk`, after `pgOneHue`): a
  dark number on a light blue box is now a deep blue, at the same luminance.
- Thumbnails redrawn, colour measured, the gate re-run: 329 of 329 live cards
  pass; the classics 346 of 404 as on main (the two whose codes changed were
  already held). ASSET_REV bumped.

Not live until deployed: this is on `main` once merged, and the site is
deployed by hand from the Mac (AGENT-BRIEF, Deploying): on 2026-10-02 the live
project still showed the 29 old palettes from a 2026-10-01 deploy of
`claude/fervent-pascal-w6mthe`, whose every commit is in `main`.

Still open:

1. **Give the 65 drawn-ground cards a photograph** instead of holding them,
   if the owner wants those layouts back: each needs a scene picked for its
   product (the generator in `scripts/` that made `assets/showcase/bg/`
   tiles, or a library photograph), then the gate.
2. **The band headline** (bandKnockout and some slabPoster layouts) sets a
   dark word with a heavy shadow on a coloured band; nine cards were held for
   it. The layout wants a light word on a dark band, or no shadow.

## AB. 2026-10-02 — the landing is at least half Apple (DESIGN-LAW 106)

Done: `platform-mix.js` (the owner's table), `scMix` in app.js on the hero
wall, the All gallery and the category chips, offer cards mixed in beside
the showcase's, `subject` stamped on the index (`scripts/tag_subjects.mjs`),
`scripts/mix_check.mjs`, the category order (`CATS`) to match.

Measured on main's library, loaded headless at 1440 and 390 with every
request served from the checkout: 0 page errors, 0 missing files. The wall:
iPhone 5, Mac 2, iPad 2, then one each of consoles, VR, Samsung, Pixel, gold,
coins, Pokémon, bullion and cars. The first page: iPhone 5, Mac 2, iPad 1,
consoles 1, VR 1, Samsung 1, Pixel 1, gold 1, coins 1, Pokémon 1, bullion 1.
Apple holds half of every prefix to card 146, where its 74 cards run out.

Not live until deployed (AGENT-BRIEF, Deploying).

Still open:

1. **Supply is thin where the owner put weight.** Mac has 16 cards, VR, Samsung
   and Pixel 5 each, bikes 3, and consoles, VR, Samsung and Pixel have no
   showcase card at all (only offer cards). More cards there keep the mix true
   further down the list.
2. **Nine of the eighteen wall slots are offer cards**, drawn in the browser
   after their own picture and faces load (most of the iPhone showcase cards
   are photo-led, and the wall takes only product-led ones). Watch the
   landing's phone weight with `landing_check.mjs` after a deploy.
3. **The VR line is PRO-locked** for a signed-out visitor (Gaming is not a
   free category), so its wall and first-page card opens the plan page.
4. The hand-picked hero list (`assets/hero-picks.json`) still names two test
   strip cards: `stepsFlow-cd06-30` is held (rule 105), and the mix keeps
   `checklistHero-pp02-20` off the wall. Re-pick on `/lab/hero.html` if the
   owner wants the list to match.


## AC. 2026-10-03 — the composition audit: 88 cards centred, 8 held (DESIGN-LAW 109)

The owner: "next audit more", after a Pokémon card that "looks incomplete".
`scripts/composition_audit.mjs` (exits 1 on a failing offered card) and
`scripts/centre_showcase.mjs` (the gated repair). 118 of 309 offered cards
failed; 88 were centred, 16 lost a leftover ✓ in their first ring, 16 had an
invisible icon or sticker text inked to read; 8 were held (holds.json);
verify_showcase passes all 321 live cards; 49 of 301 still fail the measure.
every_card_audit on the changed cards: no card newly held as offered (two
whose centred headline covered the corner badges were put back,
checklistHero-cd04-15 and -cd06-20, keeping the tick and ink repairs); one
theme (neonNight-nn05-15, Electric Trust) and one look (trustSeal-cd06-26,
glow) newly off; the voices' table moved on 16 cards.

Not live until deployed (AGENT-BRIEF, Deploying).

Still open:

1. **The gate held 11 centrings**, each because a line would sit on a
   brighter or darker patch of the photograph and lose contrast, or a
   kicker would be covered: checklistHero-jw10-15, checklistHero-du07-15
   (both still carry the leftover ✓ and need it removed without the move),
   neonNight-jw07-15, scriptRetro-io03-15, scriptRetro-cd06-15,
   scriptRetro-ca07-20, voltStack-du01-20, voltStack-gl04-20,
   reviewProof-jw05-30 (held), hudTech-du01-30, bubblePop-du09-35. Each
   needs its shade re-solved after the move (naturalize, then verify).
2. **Fifteen came out no better** (a wave layout, a card whose parts collide
   when centred, a part centred onto another): trustSeal-su02-20,
   neonNight-nn03-20, neonNight-jw05-20, neonNight-cd06-25,
   ticketStub-jw07-20, hudTech-cd10-20, voltStack-jw10-30,
   scriptRetro-nn01-30, scriptRetro-du01-30, bandKnockout-jw10-30,
   bandKnockout-pa03-35, checklistHero-pa01-35, checklistHero-pp09-35,
   reviewProof-cd08-35 (held), hudTech-nn08-35 (held). A person's eye, or a
   relayout, not a nudge.
3. **Steps Flow**: eight fail the measure (the number's plate off the middle
   on several); claude/relaxed-darwin-8aces4 is re-laying them out and is
   not on `main`. Run composition_audit on them after it merges.
4. The left-aligned designs that share an edge (most voltStack, neonNight,
   hudTech left headlines) pass and were not touched. If the owner wants
   every card centred, `centre_showcase.mjs --ids` takes any list.

## AD. 2026-10-04 — one alignment to a card (DESIGN-LAW 109, continued)

The owner: "align left for everything … or if you're going to center it then
you can't leave the second line of the hero aligned left" (hudTech-jw07-16),
"same thing here" (ticketStub-ck03-15). The measure now fails a mix of
centred and side-aligned parts, and lines on a plate out of step; the repair
centres all, or aligns all to the headline's side, or moves nothing. 39 cards
given one alignment, 10 held, 311 live; verify_showcase passes all 311;
composition 45 of 291 fail, none newly. every_card_audit on the 39: no card
newly held as offered; choices off across the table fell (themes 445 to 426,
voices 1,525 to 1,513).

Not live until deployed (AGENT-BRIEF, Deploying).

Still open:

1. **Eight read as one alignment by eye but fail `mixed`** by a part a little
   off its axis: checklistHero-cd06-16, voltStack-gl02-15, neonNight-jw07-15,
   hudTech-cd04-20, voltStack-jw10-30, arcCrown-jw10-30, bandKnockout-ck04-35,
   bandKnockout-ck07-35. Each wants one part nudged by hand in the designer.
2. **The ten held cards** (holds.json, audit 2026-10-04) need a new layout,
   not a nudge: the headline's side is taken by pictures, or an arc heading
   sits over left-aligned lines.
3. **Steps Flow** (15 fail): measure again after claude/relaxed-darwin-8aces4
   merges.

## AE. 2026-10-03 — build your own colours (DESIGN-LAW 112)

(claude/eager-hopper-khk7ct, from `main` at 809c5ac6. **Not on `main`**: this
session was told to develop and push on that branch only.)

The landing's colour section is two tabs: the twelve ready-made sets, and
Build your own (`colour-builder.js`). Pick a colour (fourteen, or any), see
what goes with it as small ads (ready-made pairs first, by how many live
designs use them), choose the background and the small print, save as many
as you like. Saved sets sit after ORIG in Easy Mode's and the designer's
colour rows, beside a + that opens the same builder in a dialog.

Checked: `scripts/colour_builder_audit.mjs` (310 sets, 0 failing on its own
maths; 12 of 12 ready-made pairs offered from both colours; 0 of 77 card
renders lose a line); a mutation (mustard gold, grey small print) fails it;
the flow end to end in headless Chromium (landing, Use, Easy Mode, reload,
the + dialog, the designer, delete, Escape); the production CSP from
`_headers`, light and dark; `landing_check.mjs` at 390 and 1440 (0 errors,
0 failed requests, no overflow); `designer_audit.mjs` (only `main`'s standing
problems: sell_iphone and gold_spot do not open, bandKnockout-pp04-15's ORIG
4.2%); `ez_theme_audit.mjs --quick` (no problems, 4 cards x 6 themes).

Still open:

1. **`main` is not what is live.** Production (`buybackad-finished-copy`)
   serves `claude/fervent-pascal-w6mthe` at 37a26d34, three commits `main`
   lacks (the plain-words copy; rule 95 reconciled with rule 103). A trial
   merge conflicts on the CSS_FALLBACK line (regenerate), DESIGN-LAW and the
   log (keep both; its "rule 104" needs the next free number), and
   `assets/showcase/index.json` plus 209 thumbnails both sides re-drew (re-draw
   from the merged code, `verify_showcase.mjs --write`, bump ASSET_REV). Merge
   it, then this branch, then run the audits AGENT-BRIEF lists.
2. **A warm bright colour lets two passes draw dark shapes muddy**, house
   themes as much as built sets (rule 112, "Known"): the one-colour pass
   (fixed on the live branch) and the plate ink of rule 104 (a dark number on
   an orange or gold box goes brown; no branch guards it). Under the muddy
   floor the plate ink should take the deep hue.
3. Once the live branch's copy is in, the colour section's heading and the
   FAQ answer "Can I change the colours?" can mention building your own (left
   alone here so the merge stays clean).
4. Choice holds (rule 101) do not cover built sets; the gate does (pgGate
   before every download). If a built set should be held per card like the
   house themes, `every_card_audit.mjs` needs to learn them.

**2026-10-04, the look and the tweaks** (same branch). A Dark / Light look
at the head of the builder; on Light the colours whose name needs light
(yellow, gold, lime, cyan, pink, orange) are the background and the partner
is drawn deep. Make it yours: shade and strength sliders that stop where the
words would get hard to read, exact colours by picker or code (used as typed
where they pass, else the nearest that does, said so), flat / soft / deep
background, a name, and saved sets that open for editing (a rename keeps the
old name in `aka`, so drafts still find the set). Checked: the audit on both
looks and 1,804 tweaked sets, 0 failing; on cards, the twenty sets the fourteen colours open on in both looks, on six cards (bandKnockout-pp02-15 no longer opens on `main` and was skipped): 0 of 120 renders lose a line. Muddy paint under 47 of them (dark 19 of 60, light 28 of 60; house control 7 of 12), all from item 2's passes: the same twenty sets on three classics draw muddy paint in 24 of 60 renders here and 0 of 60 on `claude/fervent-pascal-w6mthe`, with no line lost on either; the flow in
headless Chromium (save with a typed name, edit, rename, use, reload by the
old name, gate passing); the production CSP light and dark; landing_check
clean at 390 and 1440.

5. **Light sets on a gold or yellow background meet item 2 hardest**: on
   `main` the one-colour pass folds a card's dark panels into the card's
   leading hue, and on Light that hue is the warm background. The live
   branch's rule 95 reconciliation is the fix (item 1).

**2026-10-04, the live branch merged into this branch** (for the owner's "make
sure it's deployed"). `claude/fervent-pascal-w6mthe` (37a26d34, what
production serves) is now in `claude/eager-hopper-khk7ct`, so a deploy of
this branch no longer rolls the site back. Its plain-words rule is 113 here
(104 on its branch). The 209 thumbnails both sides had re-drawn were re-drawn
again from the merged code, all 311 live cards with them; the index took
`main`'s rows (subjects, holds, colour) and was stamped again by the gate.
Measured on the merge: the gate 311 of 311 live cards pass; classics 58
held, the same 58 on `main` and on the live branch; the landing mix holds;
the composition audit fails the same 45 of 291 cards as clean `main` (none
new, none fixed); cvd_audit.py fails as on `main` (the old theme decks).
Item 1 is done on this branch, not on `main`. Item 2 after the merge: the
same twenty builder sets on three classics draw muddy paint in 3 of 60
renders (24 before), all one case, a near-black green number on Lime & Navy's
lime box (`#0a1a00`, rule 104's plate ink).

   With `main` at b5684f57 merged in as well (the library is the ads): the
   311 library ads re-rendered from the merged code (render_library_ads
   --stale), library_api_check and library_handoff_check pass.

6. **Choice holds were not re-swept** on the merged build: the one-colour pass
   changed (two families), so `node scripts/every_card_audit.mjs
   --write-holds` (hours; `--resume`) should be run before the holds are
   trusted again. The gate still checks every download.
## AF. 2026-10-02 — Steps Flow: one gap down to the CTA, and a CTA that is not a fourth step (DESIGN-LAW 115)

The owner, over `stepsFlow-du08-15` and a green-CTA Steps card in the
library: "audit the margin between each bubble", "the CTA should have even
margin", "if we have three boxes of the same color, maybe the CTA is a
different color? Or maybe it has a highlight?", then "most importantly,
continue the same margin between each bubble".

Done: `pgStepRhythm` and `pgCtaStandOut` in app.js, wrapped onto the layout
(and the rhythm again after `numberFill`, the colour again after every
repaint), `scripts/steps_rhythm_audit.mjs`, the Steps Flow thumbnails
re-rendered, ASSET_REV bumped.

Measured: 83 of 83 Steps cards in one rhythm (2 before), no CTA plate in its
rows' neutral (6 before), no gate result changed on any card; the classic in
Easy Mode in all six formats, one rhythm in each and the gate clean; the
every-choice audit on the 21 live Steps cards and both classics wrote the
same holds `main` has, card for card (only contrast figures in the second
decimal moved), so `assets/choice-holds.json` is unchanged. It did catch one
new hold on the way (du02-20 under Electric Trust, the phone cue on a plate
the theme repainted), fixed before this commit (rule 115).

Not on `main`: this session may push only to its own branch,
`claude/relaxed-darwin-8aces4` (merged up to `main` at 8f4d1e72). Merge it to
`main`, then deploy (AGENT-BRIEF, Deploying).

Still open:

1. **`stepsFlow-pp06-35`'s number straddles its band** (half above the band's
   top edge). The gate already failed it (offPlate, numCentre, straddle)
   before this change, and it is held off the site (rule 105); the rows now
   keep one gap to the band, but the number needs moving onto the band
   (`scripts/centre_number.mjs`) before it can come back.
2. **The other stacked layouts** (checklist rows over a number, the review
   cards, trust tiles) were not measured by this audit; the pass is keyed to
   the Steps Flow names (`Step Card n`, `Phone Plate`). If the owner sees the
   same uneven last gap elsewhere, widen `pgStepRhythm`'s finder.
3. **Rows can now be as short as their words plus 9px each side** (the
   classic in Easy Mode: 129px rows became 117px so the number keeps its
   size). If the owner prefers taller rows and a smaller number there, swap
   the order in `pgStepRhythm` (the plate gives before the rows).

## AG. 2026-10-03 — the headline is the hero (DESIGN-LAW 116)

The owner, over `stepsFlow-du01-20` in the rule 115 before-and-after: "How
many times do I have to tell you this is not a hero. It's tiny little text
that looks extremely out of place compared to every other graphic
seriously????"

Then, of du01-20's grown one-word headline: "create some room for the words...
this just feels incomplete still iPhone.. or maybe we can change it to sell
your iphone?", then "WE BUY ALL (skip line) iPHONE 12-18", "or skip.. iPHONE
PRO MAX AIR", "more specific and more variety", "too broad": it is now WE BUY
over iPHONE PRO · MAX · AIR (rule 116), gated, re-thumbed.

Done: `scripts/hero_headline.mjs` (measures the letters every headline covers,
grows the ones under 30,000 px² as one block, gated); ten records grown (the
four Steps cards off the site, six live reviewProof and ticketStub cards);
their thumbnails re-rendered; ASSET_REV bumped. The every-choice audit on the
six live cards added no hold and lifted 49: type voices that had failed them
as "the headline would be too small in a feed" now pass (assets/choice-holds.json).

Still open:

1. **Four live Glass Cards** (glassCard-ca07-15, -cd06-15, -jw05-30, -du02-30)
   keep a 25k to 29k headline: it shares the glass panel with the product, and
   any bigger headline pushes the product out. Either the product leaves the
   panel (beside it, or behind it at the bottom) or the panel grows; the owner
   decides which look.
2. **The gate still reads the headline by font size** ('thumb'). The coverage
   measure lives in the script, not in `pgCheck`, so a visitor's export is not
   stopped by it; moving it into the gate would hold every card under 30k
   (the four Glass Cards) until (1) is settled.
3. **reviewProof-pp03-35's GOLD BUYER sits 32px left of the middle**, as it
   did on `main` before its headline grew (the composition audit, rule 109,
   fails both the same way). Centring it is that audit's job
   (`scripts/centre_showcase.mjs`), not this one's.
4. **The Steps layout reads as two alignments to rule 109's measure**: a
   left-set headline over full-width rows and a centred number plate. Rule
   109 (continued) left its 15 failing Steps cards to this branch; with their
   two-line headlines du01-20 and jw05-31 now fail it the same way (they
   passed as one tiny line). `scripts/centre_showcase.mjs` finds no single
   alignment for du01-20, and for jw05-31 it would move GEM MT away from its
   10, so neither was written. The family needs one call from the owner:
   centre the headline over the rows, or set the plate on the headline's
   left edge.
5. Rule 115's open items stand (§AF).
## AH. 2026-10-04 — real photographs of the goods (DESIGN-LAW 117)

The owner: "replace everything and please use images of real things. People
buy. This is like so classic AI slop." 89 library cards moved from generated
or drawn grounds to real Commons photographs of their goods (reviewed by
eye), 6 held, 305 live, verify_showcase passes all 305. Every non-sports
template builds on a real photograph (`BG_REAL`); the Pokémon offer cards
too.

Not live until deployed (AGENT-BRIEF, Deploying).

Still open:

1. **Sports cards: no real photographs.** 30 live sports cards, the sports
   templates and the sports offer cards still stand on generated scenes. The
   cloud network policy blocks Unsplash, Pexels, Openverse and Flickr; allow
   `unsplash.com`, `images.unsplash.com`, `api.openverse.org`,
   `live.staticflickr.com` in the environment (or add the owner's own
   photographs of cards and slabs to assets/bg-web with credits) and run
   `scripts/reground_showcase.mjs --ids …` on them.
2. **The pools are thin.** Pokémon has two photographs (graded Charizard
   slabs), coins 8, silver 13 with the silver coins; many cards share one.
   claude/great-hopper-j674cf carries ~100 more real photographs of coins,
   gold, silver, strips and Apple products (and the vehicles); merge it, then
   re-ground with `--try` to spread the set.
3. **Product cut-outs** on some cards (assets/cutouts, generated) were not
   part of this pass.
4. **The money-pattern art** (`assets/grounds/money-fall-*`, 27 cards) and
   the Apple product scenes (48 phones cards) were kept: they show real
   banknotes and real products. Say if they should go too.
## AI. 2026-10-02 — the phone mark joins the number; two car cards finished; why a card looks unfinished

The owner sent two car cards from the live site (`bubblePop-cd10-30` and
`scriptRetro-du07-30`): "The Phone icon by the CTA looks super out of place
and we could always color match it ... the white box should be color match to
blue or the CTA should be matched to white ... needs a background image", then
"Same thing with this one". Both were already held on `main` (§AA, a drawn
ground with no photograph); the live site predates the hold (§AA, not live
until deployed).

Done (DESIGN-LAW rule 118):
- **The phone mark** (`pgPhoneCue`, after `pgPlateInk`): on the 93 live cards
  that carry one, 0 now differ from the number's colour (was 60 of 60 shown),
  0 sit off the number's box (22), 0 are off its middle (46); 59 shown, 2
  hidden for want of room. `ICONS.phoneMark` drawn: 55 of the 93 asked for it
  and got the sparkle.
- **The two cards finished and back on the site.** A car photograph behind each
  (`dl_cars_neonNight_sunset.jpg`, `dl_cars_slabPoster_mono.jpg`, used by no
  other card), card 1's info strip in its CTA's colour with white words, and
  the marks that drew as sparkles (a `wheel`, an `arrowRight`, a `tag`) or did
  not belong (the sports base's card-slab mark) taken off. Out of holds.json
  (84 left) and the index's `curated` stamp.
- 291 thumbnails redrawn (every record with a phone mark). ASSET_REV 20261002b.

- **Theme holds** (every_card_audit.mjs on the 12 live cards whose themes
  were held for a vanishing mark): 444 held themes to 355; 89 come back on 9
  cards (scriptRetro-du07-30's 12 among them). The marks still lost are
  stepsFlow-jw03-20's step boxes and two slabPoster cards' marks.

Checked: the library gate 331 of 331 live cards (verify_showcase.mjs); the
classics 346 of 404, the same 58 held as on main; Easy Mode themes
(ez_theme_audit.mjs --quick) no problems; the designer (designer_audit.mjs)
the same problems as main, measured on both: sell_iphone and gold_spot do not
open in this sandbox, bandKnockout-pp04-15's ORIG differs by 4% (it carries no
phone mark), and the open-time blocking sits near its 3000ms line on both
builds (over three or four runs each, bandKnockout-pp04-15 2838 to 2898ms on
main and 2625 to 3105 here, cars_kbb 2668 to 2895 on main and 2862 to 3019
here). While the designer opens, `pgPhoneCue` runs 115 times for 1ms in all
(timed in the page), so the spread is the machine's; the line is close
enough that a slower machine will cross it on main too.

Tooling bug found: `every_card_audit.mjs --ids ... --write-holds` given a held
card writes it as passing everything (it could not open it, so nothing
failed) and drops its rows. Six held cards lost their rows that way here and
were put back from the table as it was. Fix: leave a card that does not open
out of the write.

Why a card looks unfinished, measured on the 331 live cards and the 84 held,
with the step that finishes it (the owner asked for this list):

1. **No photograph behind it** — 63 held cards (coins 12, gold 10, sports 10,
   cars 9, silver 9, phones 5, strips 5, pokemon 3). Each needs a scene for its
   product, then the gate. Unused photographs on disk: cars 13, phones 22,
   strips 7, pokemon 5 (enough); coins 9, gold 8, silver 7, sports 2 (short:
   sports needs about 8 more, coins and gold 4 to 5, silver 2 to 3). All are
   1200px where the spec asks 2160 (rule 44).
2. **A sparkle where a mark was meant** — 148 live cards show at least one
   (265 marks): the records name 31 marks the icon table never had (`corner`
   96, `medal` 15, `cash` 14, `dollar` 14, `check` 12, `headset` 12, `burst`
   11, ...), and `ICONS[name] || ICONS.sparkle` draws a star for each. Fix: map
   the names with an obvious mark already drawn (`cash`/`dollar`/`tag` to
   `cashTag`, `shield`/`check` to `shieldTick`, `bolt` to `boltFast`,
   `key`/`keyfob` to `keyFob`, `car`/`wheel` to `carSide`, `coin` to
   `coinStack`, `ingot` to `barStack`, `gem`/`ringMark` to `ring`, `cardSlab`
   to `slab`), draw the few that earn it (`corner` as a frame bracket,
   `headset`), and draw nothing for the rest rather than a star. Then a
   contact sheet for the owner and the gate.
3. **A mark the passes left behind** — the phone mark (done, rule 118); the
   same kind of drift is likely for the other marks placed beside a line at
   generation (the website's globe and arrow are hidden by the layout today).
4. **Two boxes that do not agree** — an info strip in white beside a coloured
   CTA (card 1 here). One colour per card (rule 95) brings hues together but
   not a white strip against a coloured box. A pass or an audit: on a card
   with a coloured CTA plate, a neutral strip carrying the selling points
   takes the CTA's colour, or both go light.
5. **Headlines that do not read** — 13 held (§AA 2): the band headline's
   dark word with a heavy shadow (9), outlined serifs on busy photographs (2),
   dark on its own colour (2).
6. **A photograph a panel covers** — 7 held.
7. **The live site is behind `main`.** Every screenshot the owner sent today
   was of cards `main` had already held or fixed. Deploy `main` (§Z 0).

The owner's part, and a tool for it (proposed, not built):
- Photographs for the short categories above, 2160px or larger, a real scene
  with calm space at the top and middle for the headline; the owner's own
  photographs of real buys are worth more than stock (trust is the
  conversion).
- **A review view**: open any card full size, drag, resize, hide or recolour
  its layers, swap its ground from the category's photographs, mark it keep /
  fix / cut with a reason chip, and save the change as a diff against the
  record (layer name -> the props that changed). The studio's designer
  already opens a record (`edOpenShowcase`) but cannot turn its canvas back
  into a record, and every grading tool in `lab/` keeps its verdicts in one
  browser's localStorage. The diffs come back as one JSON file in the repo
  (`assets/owner-edits/`), a script applies them to the records through the
  gate, and a second reads them for patterns (the owner always moves X, always
  matches Y) to turn into passes, the way rule 118 came from one remark.

## AJ. 2026-10-03 — the generator's marks, marks clear of the headline, 39 cards back with a photograph

The owner: "keep working on the style", after §AI's list.

Done (DESIGN-LAW rules 119, 120):
- **§AI 2, the sparkle stand-ins.** The 44 marks the generator drew and the
  studio never had are in `ICONS`. No mark on a live card falls back to the
  sparkle (265 did on 148 cards).
- **Marks clear of the headline** (`pgFlankClear`): of 166 floating marks on
  the 331 cards, 123 sat closer than the generator's 118px to a headline on
  their row; 113 moved back out, 10 hidden without room, and 25 dollar signs
  and ticks hidden from headline rows. On the 370 live cards: 145 shown, none
  within 118px.
- **39 drawn-ground cards back with a photograph** (§AI 1): cars 6, phones 5,
  pokemon 1, strips 5, coins 8, gold 5, silver 7, sports 2, each on a library
  photograph no other card uses (near-duplicate shots counted as one). holds.json
  84 to 45. Seven of them also took rule 120's strip.
- **The strip wears the CTA's colour** on 21 live cards (rule 120).
- `every_card_audit.mjs --write-holds` keeps the rows of a card that did not
  open (§AI's tooling bug).

Checked: the library gate 370 of 370 live cards (verify_showcase.mjs); the
classics 346 of 404, the same 58 held as on main; Easy Mode themes
(ez_theme_audit.mjs --quick) no problems; the designer the same four problems
as main (two cards that do not open here, bandKnockout-pp04-15's ORIG 4%).
Marks on the 370: none falls back to the sparkle, 477 shown, none off the
card, the 20 on copy as before (checklist ticks in their boxes, two badge
marks); 69 phone marks shown, every one the number's ink, in its box, on its
line. Every choice on the 200 cards whose picture changed or that came back
(every_card_audit.mjs --write-holds, all 200 opened): held themes 355 to 312,
looks 35 to 39 (three on bubblePop-pp06-35, one on trustSeal-du06-35), voices
1520 to 1522; three of the returning stepsFlow cards are kept out as offered
for the number off the middle of its band (3 below). 971 thumbnails redrawn.
ASSET_REV 20261003a.

Still open:
1. **24 drawn-ground cards** remain held: sports 8, gold 5, coins 4, cars 3,
   pokemon 2, silver 2 (stepsFlow 11, slabPoster 6, seven others). Sports
   needs the owner's photographs first (two were on disk); the others need a
   photograph or a layout fix (2, 3).
2. **The slabPoster layouts** (6 held) set everything on a large central
   panel, so a photograph behind them only shows at the edges (rule 105's
   "panel covers the photograph"). They want the panel made glass or smaller
   before a photograph earns its place.
3. **The number off the middle of its band** (rule 102): Easy Mode drops the
   website line when the visitor has none and leaves the number alone at the
   top of stepsFlow's and trustSeal's footer band. 21 live cards (three of
   them brought back here), 4 classics and 12 held cards were kept out of the
   lists for it. Done in the next commit (DESIGN-LAW 121): the number fails
   its middle on 2 live cards in Easy Mode instead of 21 (trustSeal-jw10-30
   and -jw10-31, whose band cannot grow under the copy above it: still open).
   23 cards are back in Easy Mode (19 live, the 4 price-badge classics), and
   neonNight-jw04-20, held for this alone, passes the gate and every choice
   and is back on the site (holds 44). The 12 held ones still want a
   photograph.

After main's composition audit was merged in (b7a67925): main's 90 centred
cards were measured on main's code, without this branch's passes, so every
choice on them was measured again on the merged code (every_card_audit.mjs
--write-holds, all 90 opened, none fails as offered): cards kept out 21,
held themes 314, looks 40, voices 1526. On the merged tree: library gate 363
of 363, classics 346 of 404 as before, no mark falls back, no floating mark
within 118px of a headline, 67 phone marks shown and all right, Easy Mode
themes no problems, the designer main's same four problems.

## AK. 2026-10-04 — photographs from Wikimedia Commons; 17 more cards back

The owner: "get imagery using the session with allowed cloud environments".
The account has one cloud environment (Default, this session's). Its network
reaches commons.wikimedia.org and upload.wikimedia.org; Openverse, Pexels,
Unsplash, Pixabay and Flickr answer 403 at the proxy. Commons is what
`scripts/fetch_backdrops.mjs` was written for (free licences only, credited in
`assets/bg-web/ATTRIBUTION.json`).

Done:
- **Fetched** 63 candidates for the six short categories (§AJ 1), queries
  added to the script (sports twice, the second time as scenes: glove, ball,
  court, stadium). **Kept 17** after looking at every one, plus one spare
  (silver-silverware-1). Refused: museum pieces on white (a flat card
  again), engravings and trade cards the search matched on "cards", team
  logos (jerseys, a helmet), politicians and a player's face, branded signs
  and medals, a basket of eggs matched on "ball", and a gold necklace on
  black that read as a flat ground on its card. The refused files are in
  `assets/bg-web-rejected/` (git ignores it) and out of the credits.
- **The photographs ship at 2048px on the long side** (8.4 MB for 18).
  Larger, they render black on a showcase card: over 2048 x 2048 pixels of
  area the blur canvas and the treat filter come out black (13 of 18 did at
  their first 2160px short side; a 2160 x 2160 square goes black where
  2160 x 1620 does not). The gate cannot see it (white words on black read
  well); a brightness check found it. A visitor's own photograph is not
  affected: Easy Mode's upload path rendered a 2160 x 2160 photo, blurred
  and not, at full brightness. Written into the fetcher's header.
- **17 cards back on the site**: sports 8 (the gloves, the baseballs in the
  grass, two stadiums at night, a gym floor), gold 3, coins 4, silver 1,
  pokemon 1 (a library photograph on disk). Two took rule 120's strip. holds
  52 to 35. ASSET_REV 20261004a.

Checked: the library gate 380 of 380 live cards; every choice on the 17
(every_card_audit.mjs --write-holds, all opened, none fails as offered):
cards kept out of the lists 21 to 13 (the returning stepsFlow cards pass with
rule 121 and a photograph), held themes 314 to 314, looks 40 to 40, voices
1526 to 1526.

Still open:
1. **7 drawn-ground cards held**: the six slabPoster panels (§AJ 2: a
   photograph shows only at the edges) and stepsFlow-du09-35, whose gold
   photograph was refused.
2. **The other 28 holds** are for their headline, a panel over the
   photograph, or the call to action against the number (§AA, §AC): layout
   work, not imagery.

## AL. 2026-10-04 — the hero is one colour and one ink (DESIGN-LAW 122)

The owner, of voltStack-ca07-15: "They look like different shades when
there's white and black in the hero … We should just unify it to one shade
one text color for the hero", and "solid colors are most fitting in most
circumstances".

Done: the Colour blocks tagline look sets every headline line on a block of
the theme's accent with one ink (it alternated the theme's two colours, and
the one-colour pass turned the second into a lighter shade of the first,
with black letters on it). On the 380 live cards, no hero now has bands of
two colours or lines of two inks. `every_card_audit.mjs --looks a,b`
measures only the named looks and rewrites only their rows (and a dimension
left out of --dims keeps its rows).

Checked: library gate 380 of 380; Easy Mode themes no problems; the designer
main's same four problems; every choice on the 68 live cards that carry the
look as offered, all opened, none fails as offered (cards kept out 13, held
themes 314, looks 40, voices 1525). The look on every other card and
classic is measured in the next commit. 68 thumbnails redrawn. ASSET_REV
20261004b.

## AM. 2026-10-05 — five sessions stopped at the weekly limit; their work, finished and on `main`

The owner, over screenshots of five sessions that had stopped mid-work at
the weekly limit ("Editor alignment and layer locking", the Steps card's
dark headline band, "Real car photos for backdrops", "CTA phone icon styling
cohesion", "Poor phone placement" with PR #9): "read all of these
conversations see where we left off and push and commit all of the rest of
the changes make sure everything lands", then "push and commit all new
design changes".

Those sessions could not be read from here (their transcripts are not in
this account's session list), so where each stopped was read off the
screenshots and its branch. Merged into `claude/zen-dijkstra-bmaw67` (from
`main` 9040dcb9) with merge commits, nobody's history rewritten, checked,
and `main` moved to it:
- `claude/kind-hawking-kbuw14` (212d07a9, PR #9): phone sets in the image
  ads, the video maker's grounds in both studios, the Look Book, no black on
  black. Both sides read `?card=`: the library's card link keeps it; the Look
  Book's block opens `?tpl=` only.
- `claude/great-johnson-v8ppp6` (c2135641): the video maker's phones, rule
  114. The turned phone's side was answered twice on 2026-10-04: a 17 or 18
  Pro's side is its measured aluminium (this branch), any other side the
  body's colour a shade darker (PR #9); Camera Control flush, no key lighter
  than the body.
- `claude/great-hopper-j674cf` (30294bae): the backdrop generator's real
  cars, coins and gold (820 cut-outs, 470 backgrounds); its wallpapered
  screen joins the slab.
- `claude/relaxed-darwin-8aces4` (3f7ac1e5): one rhythm down a Steps card
  (rule 115, §AF), the headline is the hero (rule 116, §AG).
- `claude/trusting-ride-cfpk9o` (fa27649c): real photographs of the goods
  (rule 117, §AH). Its silver-tea-set-2.jpg and great-hopper's were two
  different photographs under one name: this branch's is
  silver-silver-tea-set-5.jpg now.
- `claude/beautiful-wozniak-xmvvuk` (2f8f3c2d): the phone mark joins the
  number, the generator's marks, the hero is one colour and one ink (rules
  118 to 122, §AI to §AL).
- `claude/keen-cannon-ir3xd1` (57096786): where the fal key lives.
- Ported, not merged: `claude/sharp-maxwell-q2aq4o` c228696d's refit of the
  iPhone 17's three colours to the 17's width.
- `claude/determined-brown-ned7iy` (b17e8c5c): its music, ported onto the
  commercial bed (a plain merge conflicts across the whole sound engine,
  §Z 4), then the branch recorded as merged: sixteen public-domain
  recordings, or the visitor's own song, in place of the music made here,
  about two looks in three; holiday tunes only in holiday ads; the synth
  family, plucked strings, recorded drums and instruments, the mix tones.
  Left out as fighting the commercial mix: a crash on every headline hit, a
  second pump under the kick, a music room of its own, the closing filter,
  fills; and its weights for existing kits and leads, which would change
  every earlier look (43 of 50 seeds keep every earlier choice; the other 7
  change where the owner's rules say: a holiday tune in an ordinary ad, a
  recording's clear beat).

What the stopped sessions left unfinished, finished here:
1. **A library card is held by its own checks, not its base's** (trusting-
   ride's last edit, never committed): scRegister copied a base's `gated`
   onto the card, and Easy Mode opened the first card on offer instead. 102
   live cards stand on a base the classics gate holds.
2. **stepsFlow-du01-20's headline on a dark band** (relaxed-darwin's, being
   applied when it stopped): worst letter 3.92 to 11.4 on WE BUY. The card
   is not offered (imagery `none`, as on `main`).
3. **The vehicle classifier** (great-hopper's): Mitsubishi; Outlander,
   Kicks, Murano, Velar and UX as SUVs, the Odyssey a minivan. 0 of 270
   vehicles change.
4. **The every-choice sweep** (beautiful-wozniak's, running when it stopped;
   main's §AE 6 too). Every card as offered, over the whole population on
   the merged build (660: 300 classics, 366 library; passed as --ids, since
   without it the table starts empty): 14 held as offered,
   dl_pokemon_agencyGrid_royal newly (its real photograph); the 32 cards
   beautiful-wozniak had released pass on the merged code and are offered.
   Then every theme, look and voice on all 660 (33,660 renders, 214 min,
   resumed once after the container restarted): choices held off themes
   328 to 321, looks 40 to 48, voices 1,464 to 1,469 (`main` had 426, 36
   and 1,513); Colour blocks, the look beautiful-wozniak's sweep was
   measuring when it stopped, is held on no card.
5. **The audits PR #9 was waiting on** (kind-hawking's). ez_theme_audit.mjs
   in full: no problems over 19 cards x 21 themes, 0 page errors (the
   twentieth is held).
   designer_audit.mjs: sell_iphone and gold_spot skipped as held; cars_kbb
   "busy after the editor opens", 2.9 to 3.7s of blocking against a 3s bar
   (main 2.4 to 2.8s on the same machine, alone): a profile puts two thirds
   of either in the side panel drawing a thumbnail of every card in the
   category (getThumb, renderThumb), 70 cars cards here against 61. Drawing
   them as they scroll into view would take the open under the bar.
6. **`.modal-actions` wraps on a phone** (kind-hawking's and great-johnson's
   RESUME HERE): three pop-ups ran a button off a 390px screen, none now.

Found on the merged build and fixed:
- **Rules 109 and 118 measured together for the first time.** The
  composition measure read a number alone on its plate, the phone mark
  beside it left out, and failed 44 more plates innerMixed; it takes the
  pair as one line now (rule 118: "the mark and the number are centred
  together"). Composition then failed 95 of 362 (main 45 of 291): 5 newly
  among the cards both offer, 45 among the 75 cards the merge brought back,
  never measured by rule 109. Centre all through the gate repaired 17 (81 of
  362 fail now).
- ticketStub-du07-15's real photograph (a grey meter) drew it at chroma
  0.038, under the 0.05 floor, so it left the site: on the Contour Next box
  now (0.096).
- Two of the six cards trusting-ride held for want of a real photograph
  stand on one now (gradientWave-ik05-30, a glove; neonNight-jw02-35, gold
  bars): reground_showcase.mjs has a sports pool.

Not done, and why:
1. **The 80 car picks and 15 sports cards** great-hopper was cutting when it
   stopped were never committed, and this session's network policy denies
   commons.wikimedia.org and upload.wikimedia.org. Run its pick and cut again
   from a session that can reach Commons (scripts/fetch_backdrops.mjs, then
   scripts/cut_vehicle_photos.py).
2. **`claude/vigilant-wozniak-kyyy7b` is not merged: the owner's call.** 52
   colour themes in four groups (two colours, three colours, the twelve
   proven pairs, the earlier 21), effects that wear the palette, the
   designer's ORIG fixes. It answered "I think we have more colors than
   this" (2026-10-02); the colour builder on `main` (rule 112) answered "this
   is too elementary ... a colored pallet builder" (2026-10-03), the later
   message. They conflict on the landing (twelve sets with Build your own,
   or 52 themes in groups), the studio's colour row and the theme passes.
   Both could stand (the groups in the builder's Ready-made tab), but this
   morning's `claude/busy-keller-i7qfrf`, still at work, goes the other way:
   one colour vocabulary, the twelve pairings as the studio's only themes,
   the 21 earlier sets retired. Leave this branch unmerged unless the owner
   wants its two- and three-colour sets.
3. **The rest of `claude/sharp-maxwell-q2aq4o` c228696d is not merged**: a
   second renderer for a turned phone (brushed metal with a softbox streak,
   a catch-light on the rim; hero three-quarter, leaning-back and side-on
   angles). The owner asked after it for phones side by side at one angle,
   "not messy views", and for sides no lighter than the body. Port it if
   the photo-real look is wanted. (Done 2026-10-06, by hand and inside rule
   114: §AR, DESIGN-LAW 124.)
4. Still held for want of a real photograph: scriptRetro-ca07-15 (the card
   scan passed the gate in one run and not the next), arcCrown-nn01-30, and
   the two Pokémon cards (the pool is two graded Charizard slabs).
5. **36 cards fail rule 109 beyond what `main` fails** and Centre all cannot
   give them one alignment (a new layout or a hand nudge each, as §AD 1 and
   2): checklistHero-io03-20 and neonNight-du07-20 among the cards `main`
   offers, and 34 of the cards brought back:
   arcCrown-cd01-30, arcCrown-du07-30, arcCrown-pa01-30,
   bandKnockout-su02-30, bandKnockout-su05-35, bubblePop-ik05-30,
   bubblePop-pp06-35, bubblePop-su02-30, checklistHero-ca05-35,
   checklistHero-du02-30, checklistHero-du05-30, hudTech-io03-20,
   neonNight-ck03-20, scriptRetro-jw05-16, scriptRetro-jw07-16,
   stepsFlow-cd07-35, stepsFlow-du02-30, stepsFlow-du07-30,
   stepsFlow-du08-15, stepsFlow-io03-16, stepsFlow-jw03-30,
   stepsFlow-nn01-31, stepsFlow-nn05-15, stepsFlow-pa05-15,
   stepsFlow-pp04-15, trustSeal-cd01-30, trustSeal-cd02-35,
   trustSeal-cd04-30, trustSeal-cd08-35, trustSeal-du06-35,
   trustSeal-du07-30, trustSeal-jw03-31, trustSeal-nn05-30,
   voltStack-du02-20. Held or kept?
   The owner's call: `main` keeps 45 failing cards on the site (§AD).
6. **Three sessions started from `main` this morning and are still at
   work**, not merged here: `claude/busy-keller-i7qfrf` (one colour
   vocabulary, the twelve pairings as the studio's themes; it numbers its
   rule 114 and its section §AF, both taken now),
   `claude/wonderful-galileo-lu5pmv` (saved ads, a public library link,
   auto-post for iPhones LA),
   `claude/elegant-bohr-ee3nwp` (the plans against the offer and the
   market). Each merges `main` when it lands.
7. **Not deployed.** This session's network denies every Netlify host.
   Deploy `main` from the Mac (AGENT-BRIEF, Deploying), to both projects.

## Ad library. 2026-10-05: saved ads, one public link, auto-post and repost for iPhones LA

The owner asked for "a public library for iphones LA to access and auto post
the we buy ads and auto repost them too". Built: 📚 Library in the studio
(`ad-library.js`), the server (`netlify/lib/adlibrary.mjs`, `/api/ads/*`),
`master-library.html`, and iPhones LA's worker
(`docs/iphonesla-library/autopost_worker.py`, the prompt in that README).
Check: `scripts/ad_library_check.mjs`.

1. **Live only once deployed with `JWT_SECRET` set.** Saving needs an account
   on the server. Netlify Blobs needs nothing more. Not exercised against
   production from here, because this session's network cannot reach
   Netlify.
2. **iPhones LA has to plug `post()` into its Auto-post.** The handoff zip and
   prompt are ready; `loganipad/iphoneslainv` is out of this session's reach.
3. **One save at a time.** The library index is read, changed and written per
   save, so two saves at the very same moment (two tabs) could drop one. The
   studio saves one after another. A lock or one blob per ad is the fix if
   that ever happens.
4. **A reset link's pictures** stay in browser caches for up to a day
   (`max-age=86400` on a versioned picture). The feed itself stops at once.
5. **Recent downloads** are this browser's, as before (IndexedDB, the last 12).
   Saving one is how it reaches the library.

## AN. 2026-10-05 — the SaaS side against the offer, the model's price and the market

The owner: "make sure the saas side of things make sense with current model
and offerings, and is worth the cost and make us enough, use market
research." The full measurement is `docs/SAAS-AUDIT-2026-10-05.md`. Fixed
on the branch: the FAQ's "Video ads don't count" (a studio video is one
download; the video maker's are not), the README's retired Cloudflare
backend, the checkout return that could say "You are now on the Free plan"
to someone who had just paid, and Stripe promotion codes on checkout (the
landing's partner discounts had no way to exist).

Decisions for the owner, in order:

1. **The AI background caps are the one way the product loses money.** At
   the function's defaults a Pro account may spend $40.80 a month of Gemini
   (40 a day at about $0.034) against $14.16 net, and a free account
   $10.20. `netlify env:set RL_USER_DAILY 2`, `RL_PRO_DAILY 8`,
   `RL_GLOBAL_DAILY 120` bounds it today without a deploy. The better
   product shape is a monthly allowance in step with the download period
   (a counter keyed by `isoMonth()` in `api.mjs`, and "60 AI backgrounds a
   month" on the Pro card).
2. **No annual price.** Every comparable tool sells one at about a third
   off (Kittl $120, VistaCreate $120, Placeit $89.69, Canva about $180).
   Add $120 a year: a second Stripe price, `PRICE_PRO_YEAR`, a second
   button in `buildPlansGrid`, the checkout accepting `plan: 'pro-year'`.
3. **Stripe is still off.** Set the four vars with test keys and walk the
   loop once (checkout, webhook, Manage billing, cancel) before anything is
   announced. Nothing on the SaaS side has taken a dollar yet.
4. **The phone video maker is free, unwatermarked, uncounted and needs no
   account.** Lead magnet or product: the owner's call. If product, ask for
   the free account and count it as the studio's videos are counted.
5. **The size cap and the watermark are applied by the browser** (carried
   from the 2026-09-22 audit, item 8). The count is enforced; the rest is a
   nudge a devtools user walks past. Moving them to the function means the
   image goes up and comes back; a bigger change, decide when Pro has
   customers.
6. **Netlify's free plan** carries roughly 10,000 first visits a month
   (300 credits; the landing is 2 to 3 MB on a first visit). Expect
   Personal ($9) or Pro ($20 a seat) once the partner channel sends
   traffic; watch the credits meter after the first push.
7. **Partner and creator discounts** now work as Stripe promotion codes;
   none exist yet. Make one per partner in Stripe → Coupons.
8. **Nothing deploys itself.** Six sessions since 2026-09-30 have ended with
   "deploy `main` from the Mac"; this one too (the proxy answers 403 to
   every Netlify host). `.github/workflows/deploy.yml` now deploys every
   push to `main` once two repository secrets exist, `NETLIFY_AUTH_TOKEN`
   and `NETLIFY_SITE_ID` (`NETLIFY_SITE_ID_2` for the second project).
   Until then it does nothing.

## AO. 2026-10-05 — one colour vocabulary: the themes are the library's twelve (DESIGN-LAW 123)

(claude/busy-keller-i7qfrf, from `main` at 9040dcb9.)

The owner: "Audit all themes after we make our master library make sure they
follow all rules, don't contradict overlap or use wrong design language.
make it cohesive and complete so they feel like ads we made from
professional gfx designers."

Found (`scripts/theme_cohesion_audit.mjs`, new): four colour vocabularies in
one product. The library's 311 cards, the landing's Ready-made tab and the
colour builder spoke rule 103's twelve pairings; Easy Mode and the designer
offered 21 themes under the names rule 103 retired ("Blue Market", "Gold
Offer", "Hot Sale"): 17 with no small-print colour, three with a brown or
olive colour under the muddy floor, six with an accent outside its named
band (a lavender, three salmons), three named for a plant or a food, and
internal words in the chip's title ("GFX Grammar", "iOS Flat");
`cvd_audit.py` graded ten themes that existed nowhere and failed; the
choice holds were keyed by the 21 names. 93 problems on the tree as it
stood.

Done:
- `COLOR_THEMES` is the twelve, each solved by the colour builder's own
  solver in its ready-made look (`scripts/house_themes.mjs --write`), with a
  support colour, `family` Dark or Light, and `aka` carrying the 21 retired
  names (`ezThemeByName` reads them, so drafts and projects reopen). Chip
  titles and the toast show the name and look only.
- `cvd_audit.py` reads the live set (text, bright colour and small print on
  both stops under four kinds of sight); `audit_theme_grammar.mjs` checks
  every theme's four roles; the browser audits that name a light and a dark
  theme take Silver & Blue and Black & Green; the builder audit's controls
  are Navy & Gold and Purple & Gold.
- `every_card_audit.mjs --dims` or `--ids` now updates only what it measured
  (a themes-only sweep used to write an empty looks and voices table).
- The offer family's sand look: its rust accent (`#8a3b12`) is navy at the
  same luminance (rule 52); the look is sand and navy. Its eight cards
  through audit_templates.mjs before and after: 8 of 8 pass both times,
  the same warnings (crowded 8, contrast 7), nothing rejected.
- The FAQ's colour answer names the twelve and the builder (visible answer
  and JSON-LD together; CSP hashes recomputed).
- Rule 123, the brief, the README.

Checked: cohesion audit 0 problems after the hold sweep (631 cards, 7,572
theme renders: 29 cards held as offered, a theme held on 143 pairs over 21
cards, each theme on 9 to 15 cards); `cvd_audit.py` 12/12; `theme_law.mjs` 12/12; `audit_theme_grammar.mjs` 12/12;
`colour_builder_audit.mjs --sets-only` all pass; `landing_check.mjs` clean at
390 and 1440; `ez_theme_audit.mjs --quick` no problems, no page errors.

Still open:

1. **The video maker's palettes are a vocabulary of their own.** 165
   palettes in motion/catalog.js and motion/themes.js: 34 named for a food,
   drink or flower (butter, cherry, matcha, espresso, bubblegum...), 12
   carrying three hue families, four named for two colours; the keys are
   what the maker shows, title-cased. Rule 103's language (two colours to a
   name, none food) has not reached them. A session of its own: the maker
   has its own measured audit (`motion_palette_audit.mjs`, on rendered
   pixels), fifty themes under `THEME_REVIEW`, and audiences keyed by
   palette, so a rename touches audiences.js, palette-audit.json and saved
   looks. The cohesion audit prints the counts; `--strict` fails on them.
2. **The offer family's look keys** (bone, blush, mint, sand, plum, cream)
   are internal, never shown; one look (`midnight`) carries three families
   (navy ground, mint accent, gold band). Left as authored; the family is
   held to the showcase's bar by audit_templates.mjs.
3. **Only one of the twelve is light** (Silver & Blue). The 21 had eight
   light themes. The builder's Light look makes a light set of any pairing
   whose colour reads light (gold, yellow, cyan, orange, lime, pink), a tap
   from the + in the colour row; if the owner wants light ready-made sets in
   the row, they are solved the same way (`cbArrangements(..., 'light')`)
   and named by the builder ("Gold & Navy").
4. **The classics' own palettes (`PAL`, twelve)** and the showcase's twelve
   are two tables with two sets of names (PAL: ocean, paper, rose, arctic,
   mono, sunset...). PAL paints the classics' fallback grounds and plates; a
   visitor never sees its names. Not unified here.

## AP. 2026-10-06 — the library's media carries its dates (DESIGN-LAW 111, continued)

(claude/busy-keller-i7qfrf.)

The owner: "make sure our library is clean and cohesive when it ships off to
iPhones LA to identify the media by creation / upload dates."

Found: the 311 ads the API hands out had no date anywhere (a day-only
`rendered` in the render index that the API never passed on; no EXIF in the
JPEGs, drawn by a canvas). The rest of each record was cohesive: every ad
has a "Palette · Layout" title, a category, one of the twelve themes, a
layout and a subject.

Done:
- `render_library_ads.mjs` reads three dates out of git on every run and
  writes them on each entry (`created`, `updated`, `rendered`, ISO 8601 UTC)
  and into each JPEG's EXIF (`scripts/_jpeg_exif.mjs`); `--stamp` does only
  that, without rendering; a shallow clone is refused.
- The API: `created`, `updated`, `uploaded` on every ad; `?since=`,
  `?sort=newest|oldest`; `Last-Modified` on one ad; `latest` on the index.
- The hand-off: the client's `since`/`sort`, `dates()`, `changed_since()`,
  `filename()`; the picker's dated tiles, Order control, and a File named
  for the ad and its upload day; three more tests; the README's contract;
  the zip repacked.
- The checks: `library_api_check.mjs` (dates in order, EXIF as the index,
  since, sort, Last-Modified, latest) and `library_handoff_check.mjs` (the
  dated tiles, newest first, the file name and date).

Checked: `library_api_check.mjs` no failures (311 ads, 55.1 MB of renders,
unit and through the real function); `library_handoff_check.mjs` no failures
(13 Python tests, 0 skipped, with Pillow; the listing page in Chromium: every
tile dated, newest first ordered, the pick `checklistHero-pp09-35_2026-10-04.jpg`
byte for byte the render, dated with its upload); every JPEG read back by
ImageMagick and Pillow with the same dates.

The dates as they stand: created 2026-09-02 to 2026-09-05 (the records'
first commits, 92 / 92 / 127), updated 2026-10-02 to 2026-10-04 (207 / 65 /
39), uploaded 2026-10-04T07:56:34Z for all 311 (the one render so far).

Still open:

1. **Every file's sha1 moved once** (the EXIF went in), so the API's `?v=`
   links all changed: a partner that cached by `?v=` fetches each once more
   after the deploy. From now on a sha1 moves only with the dates.
2. **`uploaded` is when the render was drawn, not when it was deployed.**
   The deploy is by hand from the Mac (AGENT-BRIEF, Deploying); a render
   sits in git until then. If the owner wants the deploy time, the deploy
   script is the place to stamp it.
3. The repository grew by the 311 re-stamped files once more (55 MB of
   history). A render is re-stamped only when its dates change.

## AQ. 2026-10-06 — the Template Lab leaves the repo; its walls and its keys join the studio

The owner, over a screenshot of the lab's index: "audit and fix this also
it's no longer necessary to include in the site"; then "clean this all up and
look into all of the features and integrate as much new or unique features /
content we had included that's relevant, helpful, and transformative".

The lab (`lab/`: 1,397 files, 110 MB, all landed 2026-09-27) was the owner's
judging tool in an older look; §V 3 had read its index as stale. What each
part held, read against the product:
- **The grades.** The bulk review (582 images), the hero picker, the theme,
  font and asset labs and template sets 3 to 9 kept their verdicts in one
  browser's localStorage. What was sent back is in the repo already:
  `assets/approved-templates.json` (ten sets), `approved-fonts.json` (57 of
  the gallery's 151 faces), `approved-grounds.json`, `approved-assets.json`
  (360 of 464), `hero-picks.json`. Nothing else was recoverable.
- **The 108-theme library** is `assets/looks.json`, the studio's looks
  (`LOOKS` in app.js). The lab's Set 8 (247 cards) was those looks on the
  engine's cards: judged there, never shipped as files, and not needed as
  files since the studio draws a look on any card.
- **Set 9, the device showcase grounds** (120 renders, 1080px): drawn by
  `engine/showcase.mjs`, graded in the lab, and reached nothing else. The one
  content set the product never received.
- **The console** (the engine's tuning tool, built from the engine by
  `scripts/build_console.mjs`) had keys, an axis view, hold-to-compare and a
  measured export gate. The studio had its own gate (pgGate) and no keys.
- The font gallery, the asset lab and the theme lab were the catalogues the
  approved lists above were picked from; the product carries the picks.

Done:
1. **Off the site, out of the repo.** The morning's commit took the landing's
   nav pill and footer link, the pill's CSS, the noindex header and the
   robots line; this one deletes the folder, and with it
   `build_lab_site.mjs`, `build_review_site.mjs` and their page templates,
   which read `.render/` sets that no longer exist. The console now builds
   to `tools/gfx/console.html` and the hero picker to `tools/hero-picker/`
   (`scripts/build_hero_picker.mjs`): under `/tools/*` they are 404'd at the
   edge and open from a checkout. Both rebuilt and load clean (150
   candidates in the picker on today's index). `hero-picks.json`, the brief
   and `engine/README.md` name the new places.
2. **Device walls in the ground picker** (`device-walls.js`, a module loaded
   after app.js the way `motion/photo-grounds.js` is). Eleven arrangements
   (isometric wall, family portrait, device wall, three phones, stack, fan,
   cascade, orbit, ring, halo, column), each registered with GROUNDS as a
   drawn ground, so a card stores it like any other (`ground:devIso/…`),
   and the studio thumbnails, edits, gates, exports and videos it like a
   photograph. It paints in the card's own colours: the screens walk the
   accent and support round the wheel (showcase.mjs `spread`), the bodies
   take the ground; the three roles a card lacks (body, paper, dark) are
   derived the way the engine's palette records relate them. The engine
   draws SVG, which a browser rasterises only asynchronously: a wall paints
   its ground colour first and the devices a moment later, then says so
   ("device-wall-ready") and the swatches and the preview are read again.
   A wall takes the scenes' soft shade (scrim .42, gradient) and the gate
   deepens it where a line needs it. Measured on the served page: eleven
   swatches, every cached canvas 61 to 193 distinct tones (none flat), the
   preview takes the wall, no page errors. In Node, all eleven in three
   palettes (a short hex and a missing support among them) draw well-formed
   SVG, about 35 KB each.
3. **The console's keys in Easy Mode** (app.js, appended): `[` `]` design,
   `P` colour set, `T` typeface, `F` size, `B` background style, `G`
   background, Shift back. Each presses the row's own button, so a key takes
   the path a tap takes (the lock, the toast, the preview). Never while
   typing in a field, never with a modifier, only on the Easy Mode page; the
   hint line under the strip (`.ez-keys`) shows only where there is a
   keyboard (hover and a fine pointer). All seven measured, and `P` in the
   phone field types a p.
4. **The nav clip closed** (the morning's open item 1): "How it works" gives
   way with Palettes and FAQ, the three under 1240 rather than 1200, and the
   link row under 1010 rather than 1000. Measured clean from 1440 to 360.

Not ported, on purpose: hold-to-compare and the axis view (eight full cards
of one choice at once): the strip, the colour-set row and the Look Book
already put the choices side by side. The review's approve/deny: `pick.html`
is that for the product. The engine's own ad cards: the owner's "completely
new stray direction" (the review builder's own note).

Still open:
1. The device walls draw phones, tablets, laptops and desktops; a Cars or
   Gold card gets the same wall. A wall per category would need frames the
   engine does not have.
2. `tools/gfx/console.js` (559 KB) and `tools/hero-picker/hero.js` are build
   outputs, committed so the owner can open them; regenerate after an engine
   or showcase-index change.
## Stars, video ads and accounts. 2026-10-06: every ad has a ★ that sends it to the library; accounts from every door

The owner: "allow account creation so I can download content, upload to
library properly", "make sure every ad has an option to add to library",
"video ads photo ads all need a star button which will send to library".
Built on the ad library above: `ad-library.js` (the stars, the saves, videos
in parts), `account.js` (the account on the pages without app.js), the
video on an item in `netlify/lib/adlibrary.mjs` (`/api/ads/video/*`, the
public clip, the RSS), the video maker's star (`motion/app.js`, its
`makeVideo` shared with Download MP4), the master library's stars and
video playback, iPhones LA's worker taking the clip. README "Ad library";
check `scripts/ad_library_check.mjs`.

1. **Account creation was dead on the landing page.** `bindSaasUI()` ran
   only when Easy Mode opened, so Sign up free, Log in, the footer's Create
   free account and the dialog's own Create account button did nothing
   until somebody had opened the studio. `boot()` binds it now (guarded, so
   Easy Mode's call is a no-op). The dialog opens on Create account for a
   device that never signed in (`pgfx_seen_account`), on Sign in after.
2. **What a star saves.** A design card is drawn as it would download: the
   card's own template with the brand kit's number and website (no website
   on file: the line goes, as Easy Mode drops it), the gate, the plan's size
   and watermark, counted as a download (operators excepted). So a free
   account's star is watermarked and held from auto-post, like its
   downloads. The finished designs on the master library save their
   full-size render as shown (not counted: those files are public), held
   when the render shows a website; the owner's renders all show
   iphones.LA, so they are held. Whether a website on the picture should
   still hold a WE BUY ad from auto-post is the rule iPhones LA's link set
   (OPEN-ITEMS "iPhones LA"); it is kept, not re-decided here.
3. **Videos.** A video ad is its clip beside its photo (OfferUp takes a
   video only with a photo); the photo stays the picture every poster
   reads, so a poster written before videos existed still works. MP4 where
   the browser writes H.264, WebM otherwise (this container's Chromium:
   WebM; the H.264 path is unexercised here, as before). Parts of 4.5 MB raw
   under a request's 6 MB, 40 MB a clip at most, joined and checked (hash,
   container) on `done`. `/ads/video/done` reads every part back and writes
   the whole: on a slow path a 40 MB clip could approach the function's
   time limit; a 10-second clip (4 to 8 MB) is well inside it.
4. **The same still, saved twice, is one ad.** The save de-duplicates by the
   picture's hash, so Save as video after Save to library replaces the clip
   on the same ad rather than adding a second.
5. **Not deployed, not exercised against production.** This session's
   network denies every Netlify host. Deploy `main` from the Mac
   (AGENT-BRIEF, Deploying), then on the live site: create an account from
   the landing page, press a star, open 📚 Library.
6. **The star on a locked (Pro) design** opens the plan page, as the card
   does. The hero wall (the animated shop window) carries no stars: its
   cards open the design in Easy Mode, where the strip's star is.
## AR. 2026-10-06 — the photo-real phone finish for the video maker (DESIGN-LAW 124)

The owner, of the photo-real look left out on 2026-10-05 (§AM, not done 3):
"this too if possible". Re-drawn on today's slab from
`claude/sharp-maxwell-q2aq4o` c228696d (not merged), on
`claude/photo-real-phone-finish`.

Done: "Phone finish" (Standard, the default; Photo-real by hand only, weight
0, kept by a shuffle). Side on, left and right, as hand-picked angles.
`scripts/motion_finish_check.mjs` (rule 114 on the pixels);
`motion_phone_check.mjs --finish photo --poses …`.

Measured (cloud container, Chromium 1194, fabric 5.3.0 served from disk):
- Default unchanged: 16 shuffled looks and the default look, 5 moments each,
  85 frames, 0 pixels differ before and after.
- Rule 114: 57 of 57 phones pass side on; measured sides average 0.87 to 1.00
  of their colour (standard 0.88 to 1.00), hue shifts 1.0 degree at most, no
  side's brightest 0.5% lighter than the standard's or the body.
- motion_phone_check, every model all the way round, standard and photo-real
  (flat, edge_left, side on): all pass. audit_phone_views.py: 59 of 59.
- Speed, whole 6 s videos of five large phones at 1080, every frame as an
  export draws it (median of three, ms, standard / photo-real): flat 25,902 /
  21,832 (-15.7%); edge_left 26,191 / 21,317 (-18.6%); turntable 28,616 /
  24,304 (-15.1%); side on 24,381 / 19,406 (-20.4%); Wide 3-D spin 27,702 /
  27,383 (-1.2%) and again 29,038 / 29,065 (+0.1%). Five 640 px phones, one
  frame, median of 21: 27.4 to 32.2 ms photo-real against 31.3 to 33.6 ms
  standard. (c228696d's own figure, 261 to about 45 ms, was its own renderer's.)
- motion_export_check, landing_check at 390 and 1440: no errors, no failed
  requests, no overflow. motion_audit: 0 first-frame and 0 flash failures over
  684 cards; its 29 errors are held cards the studio will not open (the
  classics gate and the choice-holds table), not the video engine.

Not done, and why:
1. **Hero three-quarter and leaning back** (the commit's leaned angles) are
   left out. Leaned, the face is drawn in a grid of cells, and coming to rest
   one 0.05 degree step changed 63 to 149 pixels against motion_phone_check's
   bar of 60, in both finishes, on 25 to 36 phone faces; the hero view's face
   also sheared past its band. They need a face drawing that passes that test.
2. **video_photo_check's motion 1:1 case** failed on this branch in two full
   runs ("no other moment that looks different enough") and passed in two
   `--only motion` runs; `main` passed both ways once each. The maker's video
   here is MediaRecorder's real-time WebM, so the second moment depends on
   frame timing; the default look draws the same pixels as `main` (0 of 85
   frames differ). Run it again on a quiet machine before trusting either way.
3. **Partly on `main`, not deployed.** Another session merged the branch at
   886e507e into `main` (cb15cef8) and numbered it rule 124 and §AR. The
   shutter-moment saving (3c5e6032), which takes the Wide 3-D spin from a few
   percent slower to level, and these final numbers are on
   `claude/photo-real-phone-finish` only, `main` merged in; merge it to land
   them. Not deployed, as asked.
## AS. 2026-10-08 — plans that cover videos, AI in credits, Stripe live on one key

(claude/new-session-awshnq, from `main` at 0a92edc8.)

The owner, over the Pro card and the "Pro checkout is not open yet" toast:
"this doesn't really cover videos", "or isn't really built around cost
effectiveness and profitability", "and make it live we can use stripe", then
"Token or credits? That way if we use real paid models, we can make sure the
cost of it is still profitable."

What it costs us, measured on the code: photos and videos are drawn and
encoded in the customer's browser (a download is one function call); the
video maker's voices and music are files. The only per-use cost is a paid
model call (an AI background, $0.034 on the default). The daily caps let a
Pro account spend $40.80 a month of it against $14.16 net (§AN 1).

Done:
1. **`netlify/lib/plans.mjs`, the one table.** Free / Pro $25 a month or
   $250 a year / Business $60 or $600 (the owner's prices, 2026-10-08; first
   built at $15 and $39); downloads (photos or videos) 3 a week
   / 100 / 500 a month; AI credits 5 / 75 / 200 a month; library 12 / 300 /
   1,000; packs of 100 credits for $9 and 300 for $25, never expiring.
2. **Credits, priced from each model's cost.** One credit buys up to 4 cents
   of model spend; a call costs ceil(model price / 4c), the dearest model in
   the fallback chain; a model with no price (in the table or `MODEL_COSTS`)
   is not sold. Taken before the call, given back if it fails. The free
   tier's AI has a site-wide day ceiling (`AI_FREE_DAILY_CREDITS`, 100);
   paid credits are profitable by construction and meet only a runaway guard.
3. **Stripe on one key** (`netlify/lib/billing.mjs`): prices made on the
   first sale under lookup keys, the plan confirmed from the session on the
   return from Checkout, the webhook registered by the site (secret in
   Blobs), plan and interval switches prorated on the same subscription, a
   second plan checkout refused, packs credited once, a lapsed period read
   from Stripe at sign in, test-mode customers not carried into live mode,
   `/api/admin/billing` and a Billing line on the plans page for operators.
4. **Videos on every plan, and the video maker inside the plan.** Making and
   watching stay free with no account; a download (or a star into the
   library) needs a free account, counts as one download, and on Free every
   frame carries the BUYBACK.AD marks and the photo is 1080 (`planGate`,
   `/api/export/check`). It was the strongest asset, free, unmarked and
   uncounted (§AN 4).
5. The plans page (monthly/yearly, three plans, switch, packs, credits), the
   AI credit line under both Generate buttons, the landing's three cards,
   the FAQ (two answers rewritten, "What are AI credits?" added, ld-faq
   rebuilt, CSP hashes recomputed), the chooser, about, terms (billing:
   yearly, prorating, packs), privacy (credits, payment references), the
   category pages, README, the brief. The poster skin's ghost plan buttons
   were painted as primary buttons; they are quiet now.

Checked: `scripts/billing_check.mjs` 91 of 91 (credits, downloads, the
Stripe loop against a stand-in Stripe, and in Chromium under the production
CSP: the landing at 1440 and 390, the plans page, Checkout and back, the
switch, a pack; the video maker's Download signed out asks for an account,
a free account's is counted once at 1080 with a 1080 photo whose corners
carry the marks against an operator's unmarked 1440 copy of the same look,
an operator's is not counted, and at the limit it offers the plans);
`scripts/plan_economics.mjs` (at $25 and $60: Pro keeps 86% / 84% at
worst, Business 86% / 83%, packs 53% / 50%, a free account at most $0.22 a
month; the copies agree); `ad_library_check.mjs` no failures (its video maker star now expects
a Free save at 1080, marked, held, counted); `library_api_check.mjs` no
failures; `landing_check.mjs` no overflow at 390 or 1440 (its errors are
cdnjs, out of reach here). `video_photo_check.mjs --only motion` runs the
maker as a local copy (`pgfx_local_demo`; its static server has no `/api`):
4:5, 9:16 and 16:9 pass, 1:1 saved its video and photo but found no second
moment, the real-time WebM flake §AR (not done 2) records.

Found on the way: `account.js` read `pgfx_local_demo` through JSON.parse, so
the "1" config.js writes came back as the number 1 and never matched: the
video maker and the master library never ran as a local demo. Fixed.

Still open:
1. **Set `STRIPE_SECRET` in Netlify and deploy `main`.** Nothing here can
   reach Netlify; the deploy workflow skipped every run so far because the
   repository secrets `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` are not set.
   Test key first, walk the loop (README, Stripe), then the live key.
2. **Model prices are third-party figures** where Google's page was out of
   reach (the higher one where sources disagree). Confirm each against the
   Gemini bill after the first month; a change is one line in `plans.mjs`.
3. **Two paths race** for a pack: the return page and the webhook can both
   read the account before either writes, and Blobs 8.2 has no conditional
   write. The session id is kept so a later delivery never adds twice; a
   true simultaneous pair could. Rare (both inside the same second); watch
   the first packs.
4. **Hosting per account is an estimate** ($0.25 a paid account a month for
   its function calls, Blobs and its library link's bandwidth). Netlify's
   bandwidth went to 20 credits a GB in April 2026 (third party); a busy
   public library link of videos is the one place it could grow. Read the
   credits meter after the first month.
5. **The size cap and the marks are still drawn by the browser** (§AN 5):
   the count is the hard limit.
6. **$25 is above the market for a single-niche tool** (Canva Pro about
   $15 to $18, Kittl and Placeit $15, Adobe Express $10; SAAS-AUDIT §3).
   At $25 a Pro subscriber makes $23.04 a month at projected use against
   $13.40 at $15, so $25 earns more unless it loses over 42% of the
   conversions $15 would get; Business at $60 against $39, over 36%. Read
   the free-to-paid rate for the first months against that line.

### AS, 2026-10-09: three paid plans, videos from Pro

The owner: "can we have 3 plans and the 2nd/3rd has the most features $25,
$60, $100/mo?", then chose videos from $60 and Free as a line above the
cards. Free 3 photos a week, 1080, marks, 5 credits; **Starter** (`basic`)
$25 / $250: 100 photos a month, every design, 2160, no marks, 50 credits,
300 ads, no video downloads, no QR; **Pro** $60 / $600: 500 downloads,
photos or videos, video ads, QR, 200 credits, 1,000 ads; **Business** $100 /
$1,000: unlimited downloads, 500 credits, 3,000 ads. Video downloads are
refused below Pro at `/api/export` (`kind: "video"`, 403) and at
`/api/ads/video/begin`; the studio's video buttons and the maker offer the
plans instead. Anyone still makes and watches videos.

At worst (every credit at 4 cents, plus hosting of $0.25 / $0.75 / $2.00 a
month for the bigger libraries): Starter keeps 91% / 89%, Pro 85% / 82%,
Business 77% / 73%. Checked: billing_check 98 of 98 (Free and Starter refused
videos with nothing counted; Pro's maker download a 1080 video and 1440
photo, unmarked; Business unlimited and its 3,000; the landing's Free line
and three cards at 1440 and 390; Checkout, switch, pack); plan_economics
(every plan clears its bar, the pages agree, video is Pro and Business
only); ad_library_check (a free account cannot add a video; the maker's star
on Free offers the plans).

Open:
1. **Free no longer downloads videos.** The marks code stays (studio and
   maker) for a plan with `video` and `watermark` both on, if the owner wants
   watermarked videos on Free again as a lead magnet: one flag in plans.mjs
   and app.js.
2. **Unlimited on Business** is for the customer's own advertising (terms
   §1). A download costs one function call; watch the Netlify credits if one
   account downloads in the thousands.
3. **§AS 6 is superseded:** its break-even ($25 against $15) was for Pro at
   $25; Pro is now $60 with videos, and $25 buys Starter.
