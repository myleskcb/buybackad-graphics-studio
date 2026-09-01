# Theme audit — complete, and acted on

Run 2026-08-31 / 2026-09-01 against the working tree at `~/Downloads/gfxv23`.
Every number here comes from a script in `scripts/` that can be re-run, and the
headline findings were checked by eye with `scripts/shot.mjs` before being
written down.

```bash
python3 -m http.server 8899          # the render audits need the app served
node scripts/theme_law.mjs           # declared colour: both theme sets
node scripts/bake_contrast.mjs       # measure, choose an ink per text layer
node scripts/converge_themes.mjs     # re-measure the repaired render, iterate
node scripts/theme_render.mjs        # the verdict: actual pixels, both paths
node scripts/tune_fallback.mjs       # sweep the fallback ground (diagnostic)
```

## Result

Measured the same way, before and after — `theme_render.mjs` as it stands
today, run against the original engine and against the current one:

| | before | after |
|---|---|---|
| **as it ships** (photo + scrim) — text layers below WCAG | 137 | **11** |
| of those headline / phone / CTA | 43 | **2** |
| **fallback path** (photo suppressed) — below WCAG | 188 | **38** |
| of those headline / phone / CTA | 64 | **15** |
| effectively invisible, either path | 0 | **0** |

1,588 text layers across 193 designer and street templates. 9 of 193 templates
now carry any failure at all; ten of the eleven are 18–28px secondary copy
between 3.6 and 4.4 against a 4.5 floor.

`theme_law.mjs`, the declared-colour half: **12/12 palettes** and **10/10
customer themes** pass, on predicates that are stricter and more honest than
the ones that used to say 10/10.

## Why the audit wasn't complete

`scripts/score_themes.mjs` reported 10/10 PASS and had for some time. It could
not have reported anything else:

| | |
|---|---|
| it scored hard-coded arrays | its `CURRENT` set no longer shipped; its `PROPOSED` set had already shipped verbatim as `COLOR_THEMES`. It was grading a copy of the answer. |
| it graded the easy end | `const ground = t.bg.c2`, commented "the darker stop: the worst case for ink". For **white** ink the darker stop is the **best** case. |
| it never saw `PAL` | the 12 palettes that paint all 193 designer and street templates had never been through it. |
| its grounds were hypothetical | every shipped template is `bg.type:'image'`; `bg1`/`bg2` only paint when a photo fails. |

It is left in place with a header saying so.

## Four corrections to the measurement itself

This project's own warning (`HANDOFF.md` §8) is that four separate audits
over-reported by measuring something adjacent. Four more instances turned up
here, three of them in my own instrument. Each is worth more than the finding
it produced.

1. **Anti-aliasing counted as ink.** Averaging every changed pixel in a text box
   includes the edge, where `full` is a blend of ink and ground and the ratio
   tends to 1:1 however legible the type is. Averaging only pixels the glyph
   fully owns cut the reported failures from 296 to 128 at the time. Both
   numbers are still printed side by side.
2. **The halo counted as ink.** The engine adds a shadow as a separation
   device. A black ring around white type moves its pixels the opposite way to
   the ink; counted as ink it looks like very dark type on a bright plate.
   Establish which way the glyphs move a pixel, keep only those.
3. **Stripping all the text at once is not a ground.** Removing every text layer
   to get one "ground" frame is N+1 renders cheaper and wrong twice: overlapping
   boxes put one layer's glyphs into another's frame, and `alignPass()`
   repositions the plates once the text is gone.
   `dl_gold_trustSeal_gold`'s Tile Big 4 measured **1.30** that way and **4.86**
   measured properly — a clean pass reported as a failure by the audit's own
   shortcut. Every measurement now removes exactly the layer under test.
4. **A sweep that skips its worst cases will optimise toward them.**
   `tune_fallback.mjs` skipped any layer with too few glyph-core pixels. That is
   not a layer to skip — it is ink that has become indistinguishable from its
   ground. It dropped 38 of 51 real failures and reported 13 where the audit
   found 51.

## What was actually wrong, and what was done

**1. The ink was chosen by palette, not by what it sits on.** Nine designer call
sites hard-coded `P.paper ? '#ffffff' : P.deep` while `onAccent()` — the
measured near-black/near-white chooser — sat twelve lines away and was already
being called by the whole street family. On paper, coral and arctic that rule
forces white onto a bright amber plate (2.2:1) purely because the palette is a
light one, which the plate is not. All nine now call it. `onAccent` also takes
the accent it is actually over, for the one plate that is `a2`.

**2. The contrast repair was walking colours, not choosing them.** The old bake
summarised the ground to one percentile, derived a target, and walked the ink
toward it with `liftInk()`. A single number cannot describe a bimodal ground:
`st_sports_cutouthero`'s phone number straddles a green plate (L=0.256) and the
dark photo around it (L=0.03), the percentile landed on the dark half, and the
repair darkened white to **#959393 — L=0.250**. Against the plate that is
**1.02:1**. The money layer of that ad was invisible, and the repair had put it
there. `bake_contrast.mjs` now scores candidate inks — near-white, near-black,
and a hue-preserving ladder — against every glyph pixel and writes the winner.

**3. Nothing measured the repaired render.** `converge_contrast.sh` re-ran a
bake that loads `?nofix=1` on purpose, so every round measured the same
unrepaired page. `converge_themes.mjs` loads the app *with* the table applied,
measures what rendered, and derives each layer's next ink from its own
actual/predicted ratio. It converges in three rounds.

**4. Layer alpha survived every repair.** `dl_gold_duoSplit`'s website line is
`#807f74` at `opacity:0.6`, so whatever ink was chosen got composited 60/40 with
the ground it was chosen to stand against. The old pass understood this for
`rgba()` fills and said so in a comment — but only ever stripped alpha out of
the fill string, and `props.opacity` went straight through. 26 failures were
this alone.

**5. Small type had no move left.** The halo was reserved for
headline/phone/CTA. Ten 18–28px lines sat on mid-luminance grounds where
*neither* near-white nor near-black reaches 4.5:1. They now get the separation
device too, gated on `forceHalo` — set from the real render, because the bake's
own prediction always claims the ink was enough.

**6. The fallback promised something it did not deliver.**
`assets/bg/MANIFEST.md` promises a fallback so "nothing ever renders broken".
The three `paper:true` palettes declared `ink:'#ffffff'` over `bg1` of
`#f6e7d3` / `#f2ead8` / `#eef3f8` — about 1.1:1. Fixing it took three tries:
- matching the fallback's mean luminance to the photo ground's is **wrong** and
  made it worse (66 → 104 failures): a photograph is bright in places and dark
  in others and the inks are a compromise across that spread; a smooth gradient
  at the same mean has no dark region left to carry the light ink;
- sweeping a scale per palette barely moves it, because the inks were chosen per
  *template*: arctic sits at 11, 11, 11, 10, 13, 13 across the whole range;
- so `tuneFallbacks()` derives it **per template** from that template's own
  final inks. Palette `fb1`/`fb2` set the hue; this sets the level.

**7. Three customer themes had an accent nobody could pick out.** Every theme
passed every contrast test against its own ground and always had — but the
accent carries one word inside an otherwise white headline, so the test that
matters is the accent against the *ink beside it*, and nobody had run it.
Clean Slate's `#e8ecef` against `#ffffff` is **1.19:1**: the money word was
invisible as a money word while measuring 16.8:1 against the background and
looking, on a chart, like the best theme in the set. Charcoal Lime 1.33, Warm
Cream 1.26. Deepened to `#add369` / `#ecbf6a` / `#b1bec9`. Setting that floor at
1.7 then failed three more that had passed at 1.6, so those were nudged too
(sub-1% moves): the set now passes one rule instead of two.

**8. Picking a theme recoloured part of the ad.** `applyColorTheme()` repainted
four roles of nine, leaving badges, info, phone and website on whatever the
previous theme made them — the "illusion of choice" ask failing at the first
click. It now covers every reading role, and skips text standing on a plate,
since a theme repaints the background and does not own the plates.

## Known residue

- **11 layers on the photo path**, one of them a CTA at 2.52/3.0. Ten are small
  secondary copy at 3.6–4.4 against 4.5, on mid-luminance grounds where no ink
  does better. They carry a halo; the metric here compares the glyph to the
  ground *beneath* it, so it cannot credit a device that changes the surround.
  Fixing them properly means moving the type or giving it a plate — layout, not
  colour.
- **38 layers on the fallback path**, 15 critical. Some templates end up with
  near-black ink for one part of their photograph and near-white for another;
  one gradient cannot serve both. This path only renders if a backdrop 404s,
  and all 153 photos are present.
- **`coral` paints 0 designer templates** and reaches output through a handful
  of street ones; `rose` paints exactly 1. Two of twelve palettes are
  effectively unshipped — a product decision, not a defect.

## Files

| | |
|---|---|
| `scripts/theme_law.mjs` | declared colour, both theme sets, read out of `app.js` |
| `scripts/theme_render.mjs` | the verdict — actual pixels, photo path and fallback path |
| `scripts/bake_contrast.mjs` | measures each text layer, chooses its ink |
| `scripts/converge_themes.mjs` | re-measures the repaired render and iterates |
| `scripts/tune_fallback.mjs` | fallback-ground sweep (diagnostic; the fix lives in `tuneFallbacks()`) |
| `scripts/shot.mjs` | render named templates to PNG so a finding can be looked at |
| `scripts/score_themes.mjs` | superseded; kept with a header explaining why its PASS meant nothing |
| `scripts/converge_contrast.sh` | superseded; kept with a header explaining why it could not converge |

Templates now record their own `pal`, so no audit has to infer a palette from
gradient stops again.
