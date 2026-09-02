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
