# BUYBACK.AD Graphics Studio — clean handoff

Written 2026-08-27. Everything below is verified against the live build, not
remembered.

**Live URL: https://buybackad-graphics-studio.netlify.app**

`studio.scans.ad` does NOT resolve — `dig` returns no record, the CNAME was
never created. Netlify prints it after every deploy because it is the configured
custom domain, not because it works; that URL was reported as live for a whole
session before anyone checked it. Do not quote it until `dig +short
studio.scans.ad` answers.

Source `~/Downloads/gfxv23` · deploy `netlify deploy --prod` from that folder.
Domain options and a ready Cloudflare Worker: `~/Desktop/gfx-deploy/`.

---

## 1. What this is

A hosted SaaS ad-maker for buyback resellers (phones, gold, silver, coins, cars,
diabetic test strips, Pokémon, sports cards). **Not a template gallery** — the
product is the loop: pick a template → type your phone number and headline →
download a post-ready 1080² image.

- Free: 3 exports/week, 1080px, watermark, 54 templates.
- Pro $15/mo: 100/month, 2160px, no watermark, all 243.
- Backend: one Netlify Function (`netlify/functions/api.mjs`) — JWT auth, plan
  gating, community gallery (Netlify Blobs), AI background generation.
- Editor: Easy Mode (guided 3-step) + full fabric.js canvas editor with four
  formats (square / story / flyer / landscape), undo/redo, brand kit, layers.

## 2. Verified working

| area | evidence |
|---|---|
| 243/243 templates render | 0 errors, 0 text clipped off-canvas |
| four canvas formats | all reflow, 0 text outside frame |
| Easy Mode | live preview, 115KB JPEG in 444ms, refits user-typed text |
| plan gating | 189 locked / 54 free, counts derived not hardcoded |
| hero | 3 real clickable templates, entrance animation, hover-to-front |
| colour vs CVD | worst 5.37 against ground under protan/deutan/tritan — clears AA |
| load | DCL ~0.9s, above-fold art ~1.1s, repeat visit ~212ms |
| backend function | `/api/me` returns 401 (not 404) — it runs and enforces auth |
| base-path safety | 0 root-absolute paths; `PGFX_API` derives from `location.pathname`, so the app runs unmodified from `/gfx` or any sub-path |

## 3. NOT verified — no keys, never exercised

Stripe checkout · auth end-to-end · community gallery · project history ·
export caps actually enforcing · watermark rendering.
**Do not claim these work.**

## 4. THE CENTRAL PROBLEM (read this before designing anything)

Templates are transformed by **19 sequential procedural passes**, four of which
make decisions by hashing the template id:

```
applyColourFix → completeTemplate → applyCategoryMarks → applyBrandVocab →
enforceTypeWeight → enforcePlateSolidity → enforceInkOnPlate → stackBulletRuns →
addProductCutout → assignStyle → colourTheory → displayFaceFix → enrichFills →
opticalTracking → normaliseBackdrop → inkVsWash → highlightBudget → bodyPanel →
warmTheWhites
```

They run in one block at the **end of app.js** — see the comment there. Adding a
pass earlier throws a TDZ ReferenceError that silently kills every `const` below
it while the page still renders.

**This architecture is why the set feels "configured at random" — because it is.**
Style, accent hue, cutout choice and icon are assigned by `hash(id) % n`. Each
pass is individually defensible and the composition of nineteen is not a design.
The owner's repeated feedback ("1% at a time", "nothing has changed", "feels
random") is a correct reading of this machine.

**The recommended next move is a template editor / design record**: make each
template's look an explicit, inspectable, editable decision — a stored spec per
template rather than the output of a pass chain. Passes then become *defaults
for new templates*, not a filter over finished ones.

## 5. The measured formula (from the owner's own labelled references)

`~/Desktop/designs examples/` — good 28 / mid 49 / bad 26. Measured by rendering
each to 256px and sampling. Their GOOD band:

| metric | good folder | library now |
|---|---|---|
| edge density (detail) | 25.8–34% | ~8% ❌ |
| palette (buckets to 90%) | 11–18 | ~7 ❌ |
| median luminance | 0.25–0.48 | 0.35 ✅ |
| tonal range | 0.80–0.91 | 0.88 ✅ |
| bright pixels >0.8 lum | 6.9–24.3% | 11.9% ✅ |

**Good is BUSIER than bad** (29.6% vs 23.4% edges) — generic "less is more" ad
advice is wrong for this market.

**The lever for the two remaining gaps is cut-out product art, not backdrops.**
Measured: templates with a cutout score 7.8 edge density vs 4.6 without (+70%).
New AI backdrop photography moved palette but *not* detail at all. 26 cutouts
exist in `assets/cutouts/`; ~54 more ≈ **$3** on fal (Seedream v4 @ $0.03/image —
it beat Nano Banana Pro at 5× the price in a measured bakeoff). fal key lives in
`~/Desktop/apple-photo-engine` settings db.

## 6. Design direction (locked by the owner)

- **Warm/street**, accent `#ff7a1a`. The earlier liquid-glass + blue `#3b9bff`
  direction is SUPERSEDED — do not restore it.
- **Every template keeps a photograph.** No flat/solid colour grounds.
- Three style families: duotone 121 · wash 76 · photo 46.
- Colour is computed in **OKLCH**, never sRGB — see `DESIGN-LAW.md` rule 40.
  Accents are split-complementary (±160°), never exact complements (rule 41).
- Headlines use display faces only; Satoshi is banned from headlines.
- Selling points stack vertically, never run across a line.
- Emoji: pictorial ones removed; the owner has asked twice for emoji as a
  deliberate LARGE-format style. Not built.

## 7. Open, in priority order

1. **Template editor / explicit design records** (section 4) — the real fix.
2. Cutout coverage: 68/243 have one. ~$3 of fal spend is the proven lever.
3. Sharp-cornered boxes — no radius system exists yet. Owner called this out.
4. "Strange overlays" — owner flagged; needs them to point at one.
5. Emoji-as-a-style; colourable/editable vectors ("illusion of choice").
6. 8 text collisions with no vertical room to resolve.
7. Stripe/auth/gallery verification (section 3).

## 8. Hard-won gotchas (full list in DESIGN-LAW.md, 43 rules)

- **Never splice a file between two landmarks.** A cutout rewrite deleted
  `enrichFills()`; the call site survived, threw on every load, and aborted 6
  passes — while the page rendered 243/243 with no console errors. After any
  structural edit, assert every invoked pass still has a definition.
- **Never make invisible the default state.** `opacity:0` + a JS class to reveal
  = blank hero whenever JS doesn't run.
- **CSS animations and rAF do not run in a background tab.** With
  `fill-mode:both` the element parks on its 0% frame forever.
- **Specificity decides whether your cleanup runs** — a 3-class rule loses to a
  4-class one and fails silently.
- **Measure against the real backdrop**, the real render, the real predicate.
  Four separate audits over-reported because they measured something adjacent.
- `CSS_FALLBACK` in app.js is a one-line JSON copy of styles.css and **must be
  regenerated after every CSS edit** (the deploy script does it).
- Browser caches `app.js` hard; `?v=` on the page URL does not bust it.

## 8b. Hosting

- **Working now:** `buybackad-graphics-studio.netlify.app`
- **`studio.scans.ad`** — one CNAME (`studio` → `buybackad-graphics-studio.netlify.app`)
  away from working; Netlify's side is already configured. ~2 minutes.
- **`reselling.us/gfx`** — reselling.us is a React SPA ("RU CRM v1", the
  `~/Desktop/unified-crm` project) behind Cloudflare. Its router answers every
  unknown path with its own shell, so `/gfx` returns 200 today while serving
  nothing. A ready Worker + route instructions are in `~/Desktop/gfx-deploy/`.
  No Netlify changes needed — the app is already mount-aware.

## 9. Resume

Start Claude Code in `/Users/admin/Desktop`:

> Read ~/Desktop/GRAPHICS-STUDIO-HANDOFF.md and gfxv23/DESIGN-LAW.md first.
> [your ask]
