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
   **Done in part 2026-09-29** (DESIGN-LAW rule 67): emoji accents from one
   3D art set, beside the words, on some cards, with an Easy Mode control.
   Still open: a layout built around one oversized emoji as the hero.
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
    node scripts/neutral_panels.mjs --write                # no hue over the photograph (rule 64)
    node scripts/vary_grounds.mjs --write                  # every kind of ground (rule 65)
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
1. **`tplbg-data.js` is still a 635KB render-blocking base64 script** on the
   trunk. Port: move the eight classic photos to `assets/tplbg/` files.
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
7. **Colour hazes (rule 64) are cleared on the showcase only.** The classics
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
10. §J items 1 and 6 to 9 remain (2, ASSET_REV, and 5, CSS_FALLBACK, are
   done): `tplbg-data.js` as a 635KB render-blocking script, the PRO badge
   predicate, the grey Easy Mode placeholder, the `assets/tplbg/` 404 swatch,
   the three "Starter" prompts.

## L. 2026-09-27 (night) — one measure, one gate, the pipeline in one place

Done (DESIGN-LAW rule 66, docs/COHESION-AUDIT.md): `pgCheck` is the measure,
`pgGate` runs before every export, `gateRecords` before every record write,
`verify_showcase.mjs` before a commit; the classics no longer load graded;
the Easy overlay is shade; a theme keeps a photo-led card's photograph; the
content audit keeps curation stamps; one live predicate.

**The showcase pipeline, in order** (replaces the §H, §I and §K lists; each
step is measured by the gate before it writes):

    node scripts/refresh_showcase.mjs                      # palettes, faces, copy rules, from git HEAD: FIRST, or it discards everything after
    node scripts/import_lab_export.mjs                     # new records from the lab (restores the tone grade: before naturalize)
    node scripts/number_block.mjs --write                  # the number, big (rule 53)
    node scripts/naturalize_showcase.mjs --write           # photo in its own colour (rule 56)
    node scripts/restage_glasscards.mjs --write            # Glass Card: product on the card (rule 59)
    node scripts/darken_grounds.mjs --write                # shade dark, never milky (rule 62)
    node scripts/darken_grounds.mjs --resolve --ids <blurred ids> --write   # blurred cards: strict shade (rule 65)
    node scripts/darken_grounds.mjs --lighten --ids <live photo ids> --write   # bands, the lightest shade that passes the gate (rule 66)
    node scripts/clear_number.mjs --write                  # nothing drawn on the number
    node scripts/support_highlights.mjs --write            # support colour on the selling points (rule 63); BEFORE neutral_panels
    node scripts/neutral_panels.mjs --write                # no hue over the photograph (rule 64)
    node scripts/vary_grounds.mjs --write                  # every kind of ground (rule 65)
    node scripts/audit_showcase_overlap.mjs --write        # cover / clip stamps (before content)
    node scripts/audit_showcase_legibility.mjs --write     # legib stamps (the one measure)
    node scripts/audit_showcase_school.mjs --write         # the critic (the one measure + its own checks)
    node scripts/audit_collisions.mjs --json .render/collide.json
    node scripts/audit_showcase_content.mjs --write        # `defect` from the stamps (keeps `curated`)
    node scripts/curate_showcase.mjs --write               # the owner's cut, LAST
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
   visible"): done as the bands shade (rule 66): library median 62% of the photograph showing (26% before), classics 72% (49%). Still whole-card:
   the Easy photo swatches' base scrim (0.36 to 0.42 graded) before the gate
   shades further; `naturalize_showcase.mjs` still solves 'normal' only (it
   runs before darken, which re-solves).
