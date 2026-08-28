# House design law

The rules the template library is held to, and *why* each one exists. Written
Aug 24 2026 after auditing all 153 designer templates against the contact
sheets and against how the discipline actually treats this problem.

Read this before adding a layout. The enforcement code lives in one place,
`houseType()` and the house pass in `app.js` (search `HOUSE DESIGN LAW`), so a
new layout inherits the law whether or not its author remembers it.

---

## The one tension worth naming

These are ads that must stop a scroll in a hostile feed, so "restrained"
cannot be allowed to mean "quiet". But they are also ads that say *give a
stranger your phone and they will hand you cash*, so trust is the conversion.
Anything that reads as a scam costs money directly.

Both are satisfied the same way, and it is the reason a Swiss poster still
grabs you from across a room:

> **Attention comes from contrast and scale, not from saturation.**

A huge white word on a dark photograph out-competes a lime one *and* looks
like a company rather than a flyer stapled to a pole. Every rule below is
downstream of that sentence.

---

## The rules

### 1. No outlines on type
A stroke around letterforms is the most reliable amateur signal there is. It
is what you reach for when the type does not have enough contrast against its
background, and it wrecks the letterform's shape on the way. The fix for low
contrast is contrast.

Strokes on **rects and circles stay** — those are frames and hairline rules
doing structural work. 190 of them are load-bearing. Only the 139 on type were
removed.

### 2. Type separates from photography with one tight, dense, neutral shadow
Not an outline, not a glow, not a hard offset. Dense (0.72 alpha at hero
sizes) because it is doing the job the outline used to do — a polite 0.4 alpha
was tested and a jade headline over a bright patch of photo simply vanished.
Tight (blur ≈ 9% of type size) because a wide soft shadow is a glow wearing a
different hat.

Dark type on a paper-palette ground gets **no** shadow. It never needed one.

### 3. No coloured glow
A saturated halo behind type is a nightclub-flyer signal. Every chromatic text
shadow (chroma > 0.18) is rewritten neutral at the same optical weight.
Shadows that were *already* neutral are left alone — those were doing
legitimate legibility work, not decoration.

### 4. No hard offset "sticker" shadow
A shadow with a large offset and no blur reads as a sticker peeling off the
page. A contact shadow sits almost directly under the type and reads as the
type being *on* the image.

### 5. Gradients may not travel between hues
A gradient inside one hue reads as material — brushed gold, warm metal — and
is worth keeping. This is why the gold set is the strongest in the library.
A gradient that travels between hues (pink to violet, orange to lime) reads as
WordArt. Past **40° of hue travel** it is flattened to its dominant stop.

A gradient from a neutral into a colour (white into gold) is left alone. That
is the money-word treatment, not a rainbow.

### 6. No starbursts, ever
The 14-spike disc behind a price is 1990s clearance-rack retail. It was the
single worst thing in the library. Deleted.

### 7. Decoration that imitates information is worse than no decoration
An 88px filled disc with a tick in it, at identical coordinates on 46 of 153
templates, carrying no information, is decoration wearing the costume of a
trust mark. Removed. The library has three layouts that make a *specific*
trust claim (`reviewProof`, `trustSeal`, `stepsFlow`) — those say something,
and they stay.

Functional marks stay too: checklist ticks, step numbers, review stars. They
are information design.

### 8. Accents are deepened, not neon
Hue is preserved so every template keeps its identity, but anything both very
saturated and very light (S > 0.72 and L > 0.58) is deepened, with a lightness
floor of 0.52 so it still holds contrast on a near-black ground.

| palette | was | now |
|---|---|---|
| volt a1 | `#b7ff2e` lime | `#9ed534` |
| volt a2 | `#37d6ff` cyan | `#34b4d5` |
| emerald a1 | `#6bffc9` mint | `#40d8a1` |

### 9. Five house faces, self-hosted, and hierarchy from scale not effects

The library ran on Bebas Neue, Anton, Montserrat, Alfa Slab, Abril Fatface,
Luckiest Guy, Titan One, Lilita One, Bungee, Monoton, Shrikhand, Pacifico,
Black Ops One, Special Elite and Vast Shadow. That is the default free-font
shelf every Canva template is already built from, and a third of it is
novelty faces — the wrong voice entirely for an ad asking a stranger to hand
over a phone for cash.

Five faces now, all [Fontshare](https://www.fontshare.com) (Indian Type
Foundry), free for commercial use, **vendored into `assets/fonts`** rather
than pulled from a CDN — no third-party dependency, no extra CSP origin, no
render-blocking round trip. 254KB for 13 files, and the Google Fonts
stylesheet is gone from `index.html` entirely.

| face | role |
|---|---|
| **Clash Display** | the money word — a grotesque with actual character |
| **Satoshi** | everything read rather than declared, chrome included |
| **Khand** | condensed, for long words a wide face overflows |
| **Melodrama** | high-contrast serif: valuation, not clearance |
| **Zodiak** | editorial serif for quotes and trust copy |

`PAIRS` keys are unchanged so every BOOK row still resolves — they no longer
name a typeface, they name a voice. Five voices across 153 templates keeps the
variety work intact.

**Display sizing is face-specific and must be re-measured.** The hero cap has
now caught two typefaces out: the system stack held "in under a minute." on
one line to 68px, Clash Display breaks at 66 (it runs ~8.4× its size for that
string against a 548px column). Guessing produces a four-line ragged hero.

### 9b. Optical left alignment is measured, never hand-tuned
A glyph does not start at its own origin — every face leaves a left side
bearing that scales with type size, so a 28px kicker and a 148px headline set
to the same `x` have ink starting several px apart.

The layouts used to cancel this by hand (agencyGrid authored its headline at
64 and its kicker at 70). Those constants were tuned to typefaces the library
no longer uses, so after the Fontshare switch they *over*-corrected: measured
ink was 4px out on agencyGrid and 3px out the other way on checklistHero.

`opticalLeftShift()` now measures the bearing from the real font metrics, so
`left` means "where the ink starts" at any face and any size, and
`snapColumns()` collapses the stale fudges onto one column. Span-limited, so a
genuine second column (checklistHero's indented bullets at 164) survives.
Result: 127 near-miss edges → **0**, ink spread within a column → **0px**.

### 10. Frosted panels are DARK-tinted, never white-tinted
The three glass layouts used `rgba(255,255,255,0.10)`. A 10% white wash over a
photograph gives white text no ground whatsoever, which is why `trustSeal`,
`stepsFlow` and `reviewProof` — the *newest* layouts — were the worst
offenders in the contrast audit, 77 failures between them. The chrome's own
glass (ported from unified-crm) uses a dark tint at 0.60 for exactly this
reason. Now `rgba(13,16,24,0.52)`, and the light rim and sheen still sell the
translucency. 77 failures → 25.

### 11. Scrim compensates for backdrop brightness, per palette
A single global scrim cannot serve both families. `mono` is "neutral charcoal
studio, silver light" and `arctic` is "bright cool daylight, airy" — pale
photographs that pale type vanishes into. `volt` and `crimson` are near-black
and never had the problem.

0.32 everywhere left 22 failing layers. 0.55 everywhere was rejected as too
dark. So bright palettes (`mono`, `arctic`, `paper`, `coral`, `ocean`,
`emerald`, `gold`) carry **0.48** and the dark ones stay at **0.32** and keep
their depth.

### 12. Small text is quietened by size, not by washing the colour out
Supporting text was set in dim greys like `#c8c8cf` at 24–32px. That is the
worst case there is: small type needs *more* contrast than large, not less,
and the audit found kickers and price labels that had simply disappeared.
Rule 9 already does the quietening through scale — so dim small type is
lifted to the palette's ink. 418 layers affected; hierarchy is unchanged
because it never depended on the colour.

---

## Rule 13 — there are TWO families, and rules 1–4 apply to one of them

Everything above was derived from design theory. Then the user supplied 103
labelled references — `good design`, `mid design`, `bad design` — and the
labels contradicted some of it. The library now carries two families.

**CLEAN** (`tag:'designer'`, 153 templates) — rules 1–12 as written above. No
outlines, no hard shadows, neutral separation, restraint.

**STREET** (`tag:'street'`, 32 templates) — built to the references. It
deliberately breaks rules 1, 2 and 4, and it is skipped by `houseType()`.

### What the references actually proved

The user's own `MATTHEW` series is a controlled experiment: identical layout,
identical copy, only the colour and backdrop differ, sorted into good and mid.

| | marked GOOD | marked MID |
|---|---|---|
| backdrop | pale, quiet, defocused | busy, or saturated and competing |
| money word | ONE saturated hue | rainbow gradient, or a pale tint |
| outline | heavy white outline + hard shadow | same |

So the discriminator is **not** loud versus quiet. Their whole "good" folder is
loud. It is **organised and product-led** versus **chaotic and empty**:

- **good** — cut-out product photography as the subject, icon+label trust rows,
  checklists, carrier logos, locality (IE↓OC↓LA), a giant phone number
- **bad** — a phone snapshot with a text box dropped on it (12 of 26), or
  irrelevant imagery: celebrities, memes, a dog, AI art, winged-money clipart
- **mid** — structure present, then undone by a busy ground, a rainbow
  gradient, or stock imagery

Rule 5 (no hue-jumping gradients) survived contact with the evidence — rainbow
words land in "mid" every time. Rules 1, 2 and 4 did not, for this family.

### What STREET does differently

1. **Pale ground.** The same category photo as the clean family, but washed
   with a WHITE scrim at 0.70 and genuinely defocused (`bg.blur`, pre-blurred
   once per source and cached). A white wash alone is not enough: the borrowed
   photos are product shots, so at any wash strength the subject ghosts through
   as a hard-edged grey rectangle. It has to actually be out of focus.
2. **Outlined type + hard offset shadow** on the money word. On a pale ground
   this is what separates the word — *not* fill-versus-ground contrast. The
   contrast audit is therefore expected to score STREET badly, and that is not
   a defect. Do not "fix" it.
3. **A cut-out product as the subject** — `assets/cutouts/*.png`, RGBA, the one
   structural thing every single "good" reference had and the clean family has
   none of. Generated Seedream → birefnet, ~$0.05 each, resized to 900px.

---

## Rule 14 — colour is chosen against the pixels, from a fixed vocabulary

Two rules govern the money word's colour, and both were derived by measuring
the library rather than by taste.

**Contrast.** Measured glyph-masked against the real composited ground. 142 of
146 measurable money words already pass.

**Hue relationship.** Where both the ink and its ground are chromatic
(chroma > 12 — most backdrops are near-neutral after scrimming, so only 24
pairs qualify), the hue gap decides:

| gap | relationship | verdict |
|---|---|---|
| 0–25° | analogous | cohesive, fine |
| **25–70°** | **discord** | too far to be one family, too near to be opposition |
| 70–140° | triadic | fine |
| 140–180° | complementary | maximum pop |

A replacement must come from the **hue vocabulary the user's own good
references use** (lime, orange, amber, pink, red, cyan, blue, green, mint,
white), must beat the original on contrast, and is rejected if it would create
a fresh discord. Four templates qualified; see `COLOUR_FIX` in app.js.

Colour theory selects *from* that vocabulary. It does not get to invent a
pastel money word that appears nowhere in the references — an early pass
proposed exactly that and had to be thrown away.

### Two sampling traps, both of which produced false positives here

1. **Averaging the bounding box instead of the glyphs.** On knockout type the
   box overruns the plate into whatever is behind it. `bandKnockout` measured
   **1.21:1** by bounding box and **12.06:1** glyph-masked — the bbox number
   would have "fixed" four perfectly good templates into unreadable ones.
2. **Gradient headlines have no `props.fill`.** Reading it blind yields
   `undefined`, which parses to `[0,0,0]`, so 82 gradient words were being
   measured as if they were black. Use the mean of `grad.c1`/`grad.c2`.

### Known unresolved

Four templates fail contrast and have no vocabulary hue that fixes them
without introducing a new clash: `dl_silver_trustSeal_mono`,
`dl_strips_agencyGrid_arctic`, `dl_sports_arcCrown_crimson`,
`dl_cars_stepsFlow_sunset`. These need a compositional change (a plate behind
the word, or a different crop) rather than a recolour.

STREET `pricetag` templates also measure low and are **expected** to — see
rule 13. Do not "fix" them.

## How to re-run the audit

The numbers below came from measuring, not from looking. For each text layer:
render the template **without any text** to get the true backdrop, render that
layer **alone** to get a glyph mask, then compare the fill against only the
pixels the glyphs actually cover.

Three things that made earlier passes lie, all worth avoiding if you rebuild
this:

1. **One shared glyph mask for all layers.** Overlapping layers then get
   measured against each other's glyphs. This alone inflated the count from 22
   to 235. Mask each layer on its own.
2. **Sampling the bounding box instead of the glyphs.** A script face is
   mostly empty space inside its box, so the background dominates the reading.
3. **WCAG luminance contrast alone.** It ignores hue, so saturated crimson on
   dark navy scores 1.2:1 and reads perfectly well. Pair it with a perceptual
   distance (CIE76 ΔE in Lab) and only fail a layer when contrast is low
   **and** ΔE < 30.

Also note `lum()` in `houseType` is *plain* luminance, not gamma-corrected
WCAG luminance. `#c8c8cf` is 0.786 on one scale and 0.581 on the other, so a
threshold written in the wrong units silently matches nothing.

---

## What the audit found

Measured across all 153 designer templates, before → after:

| signal | before | after |
|---|---|---|
| price starbursts | 8 | **0** |
| outline strokes on type | 139 | **0** |
| coloured glows | 35 | **0** |
| hue-jumping gradients | 12 | **0** |
| corner check roundels | 46 | **0** |
| structural strokes (rect/circle) | 190 | 190 *(kept)* |
| neutral legibility shadows | 745 | *(kept, strengthened where a stroke was removed)* |

## Contrast + geometry audit

Measured across all 203 templates with the method above:

| defect | before | after |
|---|---|---|
| headline text running off the canvas | 4 | **0** |
| text under 3:1 contrast AND ΔE < 30 | 22 layers / 20 templates | **2 layers / 2 templates** |
| of those, severe (>75% of glyphs) | 6 | **0** |

The worst was `dl_pokemon_slabPoster_mono`, which was publishing **"WE BUY
OKÉMO"** — the headline measured 1423px on a 1080 board and was cut off at
both edges. The old guard shrank by character count and only past 7
characters; POKÉMON is exactly 7, so it never fired. Fitting is now measured
at render time (fonts are not loaded at library-build time, so any measurement
there is a lie) and re-applied after Enhance, which restores the authored size
from `TRAITS` and would otherwise put the bug straight back.

The two survivors are partial and were judged acceptable by eye:
`silver_mirror` Headline (47%) and `dl_coins_hudTech_mono` Headline 2 (40%).

## Known weak spot

The audit measures the backdrop *without* the type's own shadow, so it cannot
credit the separation shadow that rule 2 adds. It is deliberately pessimistic:
a layer it passes is genuinely fine, a layer it fails is worth looking at
rather than automatically wrong. Judge the last few by eye.

## Sources

The principles here are standard, not invented. Useful references:

- [Swiss Style: The Principles, the Typefaces & the Designers — PRINT Magazine](https://www.printmag.com/featured/swiss-style-principles-typefaces-designers/)
- [The Swiss Grid — Poster House](https://posterhouse.org/exhibition/the-swiss-grid/)
- [Swiss Design: 5 Elements of Swiss Graphic Design — MasterClass](https://www.masterclass.com/articles/swiss-design)
- [20 Basic Rules Of Typography Every Designer Should Know](https://www.b3multimedia.ie/20-basic-rules-of-typography-every-designer-should-know/)
- [13 Popular Print Design Trends (That Make Us Cringe) — Company Folders](https://www.companyfolders.com/blog/13-popular-print-design-trends)
- [How to Create Drop Shadow Text Effects That Don't Suck — Easil](https://about.easil.com/text-effects/)

## 15. Measure occlusion; never eyeball a stacked layout

The hero fan shipped at `width:57%` per card. Three cards then came to 192% of
the stack and the rearmost was **57% occluded** — its headline was sliced in
half, which reads as a broken page, not a layered one. At 52% with the front
card pushed to `bottom:0; left:24%`, occlusion is 29%/19%/0% and all of it falls
in the LOWER band, below where every template puts its headline (headline-band
occlusion 12%/0%/0%).

The rule that generalises: when elements overlap on purpose, the thing to hold
constant is not total coverage but **coverage of the region that carries the
message**. Measure the two separately. If you change the card width, re-run the
measurement — the relationship is not linear, because the cards move apart as
they shrink.

## 16. A picker that can fall back must say so

The hero fan reads its headline from `l.text` — the copy string lives on the
LAYER, not in `l.props`. An earlier version read `l.props.text`, got `''` for
all 243 templates, collided every candidate on `'' === ''`, picked one card, and
silently fell back to three hard-coded classics. It looked deliberate. It was
the shop-window regression for the third time.

Any selector with a fallback path needs a `console.warn` on the fallback. A
silent default is indistinguishable from a working system right up until someone
notices the shop window is showing the oldest work in the library.

## 17. An icon set is a system, not twenty drawings

The first category set was rejected outright. It was not that the shapes were
wrong — a bullion bar was a bullion bar — it was that every mark had been drawn
to its own rules: mixed stroke weights, some solid and some hollow, sharp
trapezoid corners next to soft ones, wildly different optical sizes in the same
box.

What fixed it was constraint, not craft: one 100-unit box, one inset, one stroke
weight, round caps AND round joins on everything, no bare corner or point
anywhere in the set. The individual drawings barely changed. Consistency is what
reads as "purchased."

Outline rather than solid, because these sit on photographs — a solid blob reads
as a sticker dropped on the image, an outline reads as a mark belonging to it.

## 18. Legibility is a function of treatment, not size

Detailed marks turned to mush in a 40px checklist badge, so the obvious
conclusion was "these are too small" and the obvious fix was a minimum-size
table that reserved the detailed marks for large placements. That fix was
wrong, and it cost the gold category its identity — it fell back to a generic
shield and price tag.

A legibility ladder rendered at 38/48/58px showed the real cause: the mush was
an **outline on a photograph**, not a small icon. Knocked out of a filled badge,
every mark in the set holds at 38px.

The corollary, also learned the hard way: thickening the stroke at small sizes
makes it worse, not better. A heavier line closes up a ring's gap and a seal's
centre. One weight at every size.

## 19. Correct alignment on the objects, not the spec

Both halves of an alignment sum are measured, not authored: a text's real width
only exists once its face has loaded, and in an editor the visitor can retype
the copy at any moment. So alignment is corrected at render time on the built
objects, in every render path, rather than baked into the template as an offset.

Two traps, both of which shipped a visible bug before being caught:

- **Count box occupancy by centre-inside, not containment.** A CTA label set
  slightly wider than its own card overflows it. Under a strict containment
  test the card read as holding *only* the phone number, which was then
  faithfully centred on top of the label.
- **Never centre a multi-text box.** A step card holding a number, a label and
  a description is a left-aligned row, and centring the group is a regression.
  131 of 215 raw hits were this shape.

And treat the audit itself with suspicion: 387 "misaligned" left edges, all
1-5px, were `opticalLeftShift()` doing precisely its job.

## 20. Never set a weight that has no font file

44% of this library was authored at `fontWeight: normal`, including 351 of 464
headlines. That alone reads thin — but for two of the five house faces it is
worse than it looks. Clash Display's lightest vendored cut is 500 and Khand's is
600, so `normal` never rendered at 400 at all: the browser quietly substituted
**the lightest cut of a display face**, which is the one weight a headline should
never be set in.

So a weight is not a number you pick, it is a file that either exists or does
not. Every weight now snaps to a cut on disk. Asking for Satoshi 800 or Clash
900 — neither of which is vendored — hands the decision to the browser's
synthesiser, which is exactly how type gets weak without anyone choosing it.

## 21. A plate carrying dark ink must be opaque

`buildLayer()` washes every rect to 45% alpha unless it is marked `solid`, so
background photography stays visible through colour blocks. That is right for a
decorative block and wrong for a **plate** — a chip or bar whose whole job is to
carry dark type.

Washed to 45% over a dark photo, a `#d54d34` plate renders muddy brown, and the
near-black type on it disappears. One template was shipping its phone number —
the single most important element on a buyback ad — at roughly 1.2:1.

The rule is structural rather than cosmetic: dark ink's legibility depends on
its plate's own lightness, not on whatever photograph happens to sit behind it.
If a rect carries dark ink, it is opaque. 283 plates across 172 templates were
wrong on this one point.

## 22. Measure against the real backdrop, or do not measure

A contrast audit that substituted each template's `bg.fallback` gradient for its
actual loaded photograph returned 202 failures. Most were fiction: `cash_offer`
scored 100% failing ink on white type that is perfectly legible over its dark
photo, because the audit had painted the pale fallback underneath it instead.

Rendering the way the product renders — `freshBgImage()`, `coverImage()`,
`scrimRect()`, ground taken from a text-free pass — gives 56. That is the fourth
time an audit on this project has over-reported, and every previous instance had
the same shape: the instrument measured something adjacent to what ships.

Before believing any number a checker produces, render the worst offender at
full size and look at it.

## 23. A wash has to follow the ink it is protecting

42 templates had no photograph — a flat gradient behind a centred text stack.
Giving them all a backdrop under a single dark scrim fixed most and *broke* the
handful that were authored for a pale, papery ground in near-black type. Those
went dark-on-dark and ended up worse than the gradient they replaced.

The scrim is therefore chosen from the template's own ink, weighted by font
size: a 200px headline decides how an ad reads, a 21px website line does not.
Dark ink gets a light wash, light ink gets a dark one. The three templates that
flipped to a paper wash are now the best-looking classics in the set.

The general form: a background treatment is not a house style you apply
uniformly. It is a function of the foreground it has to carry.

## 24. Say what is being bought

`GOT A ZARD?` — a question, in a slang term, naming no product. It was the
clearest example in the library of a headline written for people who already
know the trade. The same failure ran through `GOAT CARDS DESERVE GOAT OFFERS`,
`YOU: PAID / EBAY FEES: 0`, `4-UR-CAR` and `SECOND PLACE STILL PAYS`.

Voice is not the problem — voice *instead of* the offer is. `WE BUY CHARIZARD`
over `BASE SET • 1ST EDITION • SHADOWLESS • GRADED OR RAW` keeps the collector
pull and adds the one thing the reader needed.

Two mechanical lessons came with it. Replace **both halves** of a split
headline, or the lines stop agreeing. And a rewrite keyed to a layer *name* is a
silent no-op when the template names its layers something else — the scoreboard
template uses `Score You`/`Score Them`, so a fix aimed at `Headline` changed
nothing and reported success. It warns now.

## 25. An equality check where a parser belongs

`scrimRect()` decided its colour with `color === '#ffffff' || color === 'white'`
and fell through to black for everything else. Passing a paper white of
`#f4f1ec` therefore produced an *extra-dark* wash — the exact opposite of the
request, on the templates least able to survive it, with no error anywhere.

Any helper that accepts a colour, a size, or a unit should parse its input or
reject it loudly. Silently treating an unrecognised value as the default is how
a correct call site produces a wrong picture.

## 26. A single average is the wrong summary of a mixed-ink template

One template set a `#ffffff` headline and a `#2a3340` body line. The size-weighted
mean of its ink came to 0.51, which chose a dark wash — correct for the headline,
fatal for the body, which vanished. It was the card in the hero a reader
specifically could not read.

So the wash does not get chosen *from* the ink and then left alone; having been
chosen, it **decides** the ink, layer by layer. Each text is measured against its
real ground — its plate's fill if it sits on one, the wash over the photo if it
does not — and anything under 3:1 is lifted.

Lifting keeps the hue. Walking a colour toward white or black until it clears the
threshold preserves the palette; flattening every failure to `#ffffff` would
erase it.

## 27. The halo takes its tone from the ground, not the ink

Type on a photograph needs a separation device, and the reference folder scores
outline-plus-hard-shadow as its best work. Two things decide whether it helps:

**Tone comes from ink-vs-ground.** A grey lifted to `#a7a6a6` is dark on an
absolute scale but *lighter* than the wash beneath it. Keying the halo off the
ink alone drew a light glow around type that needed a dark one. What separates a
letterform is a ring of the tone the ground is not.

**A plate is already the separation.** Adding a halo to type on a plate only
fuzzes the letterforms — one phone number came out visibly smeared. Halos are for
type over photography, nothing else.

## 28. A tolerance on one edge is not containment

Deciding whether a text sat on a plate by testing its top edge within 10px of the
plate's box put a caption at y=930 "inside" a plate ending at y=922. It was then
excluded from the contrast fix *and* given the halo meant for type on a plate —
two wrong answers from one loose predicate, on a layer that was actually resting
on dark photography.

Test the thing you mean. Containment means the text's vertical middle falls
within the plate's real span.

## 29. Gestures point; they do not symbolise

Swapping emoji for the icon set turned a 👉 — a layer literally named "Arrow",
placed to point at "TEXT US NOW!" — into a phone glyph sitting on top of the
words. Hands and arrows are wayfinding: they mean *look over there*, and there is
no category mark that carries that. Ticks and stars are typographic and belong to
the type.

Drop a gesture rather than translating it.

## 30. Tracking runs opposite ways at the two ends of the scale

`charSpacing` was 0 on all 243 templates at every size, and that single default
accounted for most of the "typefaces look basic" complaint — more than the choice
of face did.

Tracking is not one setting applied evenly:

- **Big display type must be tightened.** Letterfit is drawn for text sizes, so
  at 200px the gaps scale up with the glyphs and the word visibly falls apart.
  Every professionally set poster headline is negative-tracked.
- **Small all-caps must be opened.** Capitals have no ascender/descender rhythm
  to separate them, so at 28px they clot into a block.

Left at zero you get a loose headline above a cramped label — which reads as
"nobody set this," even when the faces themselves are good.

## 31. Contrast fixes must preserve hue

A third of the library — 83 of 243 — had no hue at all in its money word, and
most of that was self-inflicted: the contrast passes resolved every failure by
flattening ink to pure white or near-black. Legible, and colourless.

Walking the *same* colour to the lightness it needs costs nothing and keeps the
palette. A contrast fix that changes the hue is not a fix, it is a different
design.

## 32. The complement goes on the small element

A saturated money word on a warm photograph is still monochrome, and monochrome
does not pop no matter how saturated it gets. Pop is one hue working against
another.

But the complement does not belong on the headline: there it competes with the
money word and you get two subjects instead of one. It belongs on a chip, a
kicker, a CTA — about a tenth of the frame. Small enough to read as an accent,
strong enough to make the main hue vibrate. That is 60-30-10 with the 10 doing
real work.

The category convention outranks the theory, though: a gold ad's money word is
gold. Put the complement somewhere else.

## 33. Polishing one idea cannot change the read

Tracking, hue assignment, contrast repair — each was correct and each was worth
a few percent, because the entire library was a single idea: a photograph,
dimmed, with type on it. A set built from one idea reads as one design no matter
how well the idea is executed.

Three treatments changed more than every refinement before it combined. The
lesson is about where effort goes: when a set feels samey, the fix is another
*idea*, not more polish on the existing one.

## 34. Never model a blend — measure it

A graded backdrop's ground luminance was estimated as a linear mix of its two
grade colours. The estimate returned 0.062 for a render that was plainly bright
yellow, because `screen` brightens far more than a linear mix suggests. The ink
pass therefore believed the ground was dark and happily left yellow type on a
yellow ground.

Compositing operations are not arithmetic you can guess at. Either sample the
rendered pixels, or constrain the inputs so the output stays in a range you have
actually verified — which is what the grades do now, with the estimate labelled
as an estimate so the next person does not trust it.

## 35. Overlap is measured against the smaller box

89 genuine collisions were hiding behind a metric that could not tell a problem
from a normal stack: two headline lines whose bounding boxes touch by 5px are
fine, while a sub-line sitting 92% inside its own headline is not. Absolute
overlap area cannot distinguish them; overlap as a **share of the smaller
element** can.

Resolve top-down, pushing the lower element down, so one nudge cascades into
whatever sits beneath it rather than creating a fresh collision. And clamp at
the safe edge — an unresolved overlap is bad, but type pushed off the canvas is
worse.

## 36. Use the product before polishing it

Thirty-five rules about typography, colour and composition were written before
anyone typed a phone number into the thing and pressed download. The first time
that happened, the headline ran off both edges of the canvas — because the fit
is computed against the *authored* words inside `buildLayer()`, and the
visitor's words are substituted afterwards.

Every template in the library was beautiful and the core interaction was broken.

A design system is not the product. Run the loop the customer runs, on the
device they run it on, before spending another pass on the artwork.

## 37. State no number you can count

The pricing page advertised "All 160+ templates" against a real 243, and the
landing page said 150+, and the free tier said 55+. Fourteen hardcoded counts,
each written when it was true, none updated as the library went 105 → 153 → 243.
The paid tier was underselling itself by a third.

Counting beats remembering. The numbers are derived now and written into the
copy at boot, so they cannot drift from the library again.

The follow-on rule is subtler: the first fix re-implemented the free-tier count
independently and got 65 where the gate says 54, because it *guessed* which
templates are free instead of asking the predicate the UI actually gates on. Two
implementations of one number is the same bug as a stale constant, wearing
better clothes.

## 38. Never make invisible the default state

The hero entrance was built by setting `.hero-card{opacity:0}` and revealing the
cards with a JS class. It worked, right up until the class did not get added —
and then the hero was simply blank, with no error anywhere to explain it.

An animation should supply its own opening frame (`animation-fill-mode: both`)
so that nothing needs to be hidden in advance. Then the failure mode of every
bug upstream is "no animation", not "no content".

Two related traps caught in the same hour, both from the same root cause — a
hidden tab:

- **`requestAnimationFrame` does not fire in a background tab.** Anything that
  reveals content must not depend on it alone.
- **CSS animations do not advance in a background tab.** With `fill-mode: both`
  the element parks on its 0% frame indefinitely. If that frame is
  `opacity: 0`, a visitor who opens the link in a background tab finds nothing
  there. Check `document.visibilityState` and skip straight to the finished
  state when nobody is watching.

## 39. Specificity decides whether your cleanup runs

`.hero-stack.settled .hero-card` is three classes. `.hero-stack.ready
.hero-card.hc1` is four. The "settled" rule was meant to strip the animation once
it finished, so the hover transform could take over — and it never applied, so
the cards stayed frozen on the animation's opening frame.

Nothing errored. The rule was present, matched the element, and lost. When one
rule is meant to override another, count the selectors — or enumerate it per
element so the specificities tie and source order decides.

## 40. Colour maths belongs in a perceptual space

Every colour operation in this project was done on sRGB channels: lightening
multiplied R, G and B toward 255, darkening multiplied them toward 0, and the
category palette was typed in as hex by eye. That is the mechanical reason the
combinations looked wrong, and it is a fault rather than a matter of taste.

sRGB and HSL are not perceptually uniform. Equal numeric steps are not equal
*perceived* steps — a yellow and a blue at the same nominal lightness look
nothing alike in brightness. The hand-picked set had a gold near L .80 sitting
beside a blue near L .55 and treated them as the same tier.

OKLab fixes this by construction: equal moves in L look equal at every hue. Three
things follow, and all three were wrong before:

- **Lighten and darken by moving L**, not by scaling channels. Scaling
  desaturates as it lightens and shifts hue as it darkens — a deep gold went
  muddy-green.
- **Reduce chroma to reach the gamut, never clip channels.** Clipping shifts the
  hue; reducing chroma keeps the hue and lightness the design asked for.
- **State the palette in {L, C, h}**, so perceived lightness is comparable
  across categories by construction. The spread across the eight categories fell
  from ~0.30 to 0.17 doing nothing but restating the same intent properly.

## 41. Exact complements are the crudest pairing on the wheel

A 180° pair is maximum contrast, and maximum contrast vibrates — the two hues
fight for the same attention and neither wins. It is the pairing you get from a
colour wheel, not from a designer.

Split-complementary (base ±160°) keeps the tension and loses the jangle. Every
accent in the library is now derived that way rather than typed in, and chroma
is capped well below the sRGB maximum, because everything at full saturation
reads as a default.

## 42. Never splice between two anchors in a file you are appending to

A cutout rewrite replaced everything between `/* PRODUCT CUTOUT */` and
`const LAYOUT_FAMILY` — a range that had quietly accumulated other functions
added earlier in the same session. It deleted `enrichFills()` and its helper.

The call site survived. `TEMPLATES.forEach(t => enrichFills(t))` then threw on
every load and **aborted every pass after it** — tracking, gradient washes,
contrast repair, phone plates, body panels, white-tinting — all silently absent
in production, while the page still rendered 243/243 and reported no errors.

Replace a *named function* by locating its own opening and closing, or append.
Never delete a span defined by "everything up to the next landmark". And after
any structural edit, assert that every pass invoked at the bottom of the file
still has a definition — that check is four lines and would have caught this
before deploy.

## 43. Measure the palette under colour-vision deficiency, not just under normal sight

Every contrast number in this file was measured with normal colour vision. That
silently assumes the whole audience has it, and roughly **8% of men do not** —
a material slice of an audience that is mostly men selling phones.

The failure is invisible to the person designing. A theme can pass 4.5:1
normally and collapse for a deuteranope, and nothing in the existing audit says
so, because the existing audit only ever asks one question.

Measured over the ten theme decks (accent against its own gradient start),
simulating with the standard Brettel/Viénot LMS method:

| theme | normal | protan | deutan | tritan | worst |
|---|---|---|---|---|---|
| Navy × Orange | 5.23 | 4.61 | 6.35 | 5.10 | 4.61 |
| Teal × Coral | 2.75 | 2.31 | 3.57 | 2.71 | 2.31 |
| Purple × Gold | 7.58 | 7.66 | 7.46 | 7.45 | 7.45 |
| Forest × Amber | 5.46 | 5.09 | 6.22 | 5.43 | 5.09 |
| **Crimson × Mint** | **5.26** | 6.39 | **3.84** | 5.28 | **3.84** |
| Black × Electric | 8.84 | 9.29 | 8.03 | 8.92 | 8.03 |
| Charcoal × Lime | 9.95 | 10.24 | 9.40 | 9.94 | 9.40 |
| **Royal × Tangerine** | **4.58** | **4.15** | 5.29 | 4.48 | 4.15 |
| Espresso × Cream | 10.60 | 10.66 | 10.40 | 10.58 | 10.40 |
| Midnight × Pink | 6.04 | 5.38 | 7.06 | 6.01 | 5.38 |

**Two themes cross a threshold that they clear with normal vision.**

`Crimson × Mint` is the textbook case and it is worth naming precisely: a red
ground carrying a green accent is the single pairing deuteranopia collapses, and
it is the one pairing a colour wheel most encourages. It reads as a confident
complementary choice (151° apart, right in the band rule 41 approves) and is the
worst performer in the set for 5% of men. **Hue harmony and CVD safety are
independent properties; satisfying rule 41 says nothing about this.**

`Royal × Tangerine` is milder — 4.58 to 4.15 under protanopia — but it starts so
close to the 4.5 line that it has no margin to lose.

`Teal × Coral` fails at 2.75 under normal vision already and is a separate
pre-existing problem, not a CVD one. Recorded here because the sweep found it.

### The rule

A palette pairing is acceptable only if it clears its contrast target under
**normal vision AND all three simulated deficiencies**. Report the *worst* of
the four, not the normal-vision number.

Never let hue alone carry meaning. Where a red/green distinction is doing work,
a second channel — lightness, size, position, or a glyph — must carry the same
information, so nothing is lost when the hue difference is.

### Why this is commercial, not compliance

This is a paid product competing with free Canva templates. "Every template is
checked for colour-blind legibility" is a claim no competitor in this niche
makes, it is true once this rule is enforced, and it is exactly the kind of
detail that separates a $15/mo tool from a free one. Rule 24 says *say what is
being bought*; this is something worth saying.

### Method, so it can be re-run

Simulate on **linear** RGB via LMS (Hunt-Pointer-Estevez), not on sRGB, for the
same reason rule 40 gives: the transform is only meaningful in a linear space.
Then re-encode and measure WCAG contrast as normal. Glyph-masking (rule 14)
still applies — simulate the sampled ink and the sampled ground, never a
bounding-box average.
