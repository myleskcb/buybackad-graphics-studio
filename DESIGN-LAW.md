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

> Superseded (rule 66): a halo is neutral at any chroma and takes the tone its ground is not; a light halo behind light ink is a glow (rules 27, 64).

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

> Scope (rule 66): the starburst this bans is the 14-spike price disc. A sunburst GROUND in the card's own palette (rule 65) is a background, not a sticker.

### 7. Decoration that imitates information is worse than no decoration
An 88px filled disc with a tick in it, at identical coordinates on 46 of 153
templates, carrying no information, is decoration wearing the costume of a
trust mark. Removed. The library has three layouts that make a *specific*
trust claim (`reviewProof`, `trustSeal`, `stepsFlow`) — those say something,
and they stay.

Functional marks stay too: checklist ticks, step numbers, review stars. They
are information design.

> Superseded in part (rule 66): review stars and review rows are invented proof and do not ship (rule 55); the layouts stay.

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

> Superseded (rule 66): the shade is solved per line on the card's own pixels (rule 56), dark on a photograph (rule 62); no fixed strength per palette.

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

> Superseded in part (rule 66): STREET's white 0.70 scrim and its outlines are gone (rules 56, 62); the family's other traits stand.

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

> Superseded in part (rule 66): the 140 to 180° "maximum pop" pairing gave way to the split complement (rule 41); a coloured dark line may lighten to a pale tint of its hue (rule 62).

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

> Superseded in part (rule 66): a see-through tinted rect over a photograph is a haze and becomes smoke, paper or grey at the same luminance (rule 64). On the classics (2026-09-28) a hex block big enough to carry copy is drawn solid in its colour and only thin rules and stripes stay at 45%.

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

> Superseded (rule 66): on a photograph the shade is dark and neutral dark copy takes light ink (rule 62); the ground no longer takes a light wash from dark ink.

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

> Superseded in part (rule 66): colour moves in OKLCH, not toward white or black in sRGB (rule 40).

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

> Clarified (rule 66): the ring is dark behind ink lighter than its ground and light behind ink darker; never a hue; on a plate no light halo is added (rule 64).

## 28. A tolerance on one edge is not containment

Deciding whether a text sat on a plate by testing its top edge within 10px of the
plate's box put a caption at y=930 "inside" a plate ending at y=922. It was then
excluded from the contrast fix *and* given the halo meant for type on a plate —
two wrong answers from one loose predicate, on a layer that was actually resting
on dark photography.

Test the thing you mean. Containment means the text's vertical middle falls
within the plate's real span.

> Superseded (rule 66): containment is the centre inside the plate for a host, 75% cover for a fit (rules 46, 58).

## 29. Gestures point; they do not symbolise

Swapping emoji for the icon set turned a 👉 — a layer literally named "Arrow",
placed to point at "TEXT US NOW!" — into a phone glyph sitting on top of the
words. Hands and arrows are wayfinding: they mean *look over there*, and there is
no category mark that carries that. Ticks and stars are typographic and belong to
the type.

Drop a gesture rather than translating it.

> Extended (rule 67): an iOS hand is placed only pointing at the number or the call to action.

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

> Superseded in part (rule 66): hue is kept by moving L in OKLCH (rule 40).

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

> Superseded (rule 66): every accent is derived as a split complement (rule 41); the complement no longer sits on the small element by design.

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

> Superseded (rule 66): a card that does not fit moves as one composition inside the 6% guides (rule 57); the per-line nudge and the 24px clamp are gone.

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

## 44. An asset library must be authored at the size the top tier sells

The Designer Library ships 153 background photographs. `assets/bg/MANIFEST.md`
specifies **2160x2160 JPG** for every one of them. All 153 are **1200x1200**.

The gap is not cosmetic, because the short side of the export is what the plan
cap applies to, and the background has to COVER the canvas:

| format | Pro export | background must supply | upscale from 1200 |
|---|---|---|---|
| Square 1:1 | 2160x2160 | 2160 | **1.80x** |
| Flyer 8.5x11 | 2160x2796 | 2796 | **2.33x** |
| Story 9:16 | 2160x3840 | 3840 | **3.20x** |
| Wide 16:9 | 3840x2160 | 3840 | **3.20x** |

Pro is sold on the words *"Up to 2160px, no watermark, every format"*. On the
two rectangular formats a Pro customer is paying for a 3.2x upscale of a 1200px
JPEG.

And this is not only a Pro problem. `exportSize` defaults to **1440** short side
(app.js), so a Story export at the DEFAULT setting already demands 2560px of
background — the library is short even before anyone upgrades. At the Free 1080
cap a Story still needs 1920. **Every format except the square preview is
already upscaling for every user on every plan.**

### How bad, honestly

Less bad than the multiplier suggests, and this is worth stating plainly rather
than inflating it into a crisis. The library is authored defocused — the global
spec says *"heavily defocused / bokeh (shot blurry, not post-blurred)"* — and
defocused content upscales far better than detailed content, because there is
less fine structure to lose.

A side-by-side of the most detailed image in the set (`dl_cars_ticketStub_mono`,
water beading on a car panel) at native pixels versus 3.2x shows the upscale is
**visibly softer but not broken**: droplet edges lose their crispness and the
specular highlights smear slightly. A customer would not file a bug. A designer
comparing against a competitor's export would see it.

Two measurement notes, both of which corrected an earlier wrong conclusion:

- A first pass sampled a black region of a phones background and concluded
  "no visible artifacts". It was measuring an area with no detail in it. **Find
  the highest-variance tile before judging sharpness.**
- A spectral high-frequency-energy metric separated native from upscaled by only
  0.42 vs 0.40 on the same image — too weak to carry a conclusion. It is
  reported here so nobody re-derives it and trusts it. **The A/B render is the
  honest test; the FFT number is not.**

### The rule

Author assets at the size the **highest paid tier** can demand, multiplied by
the most aggressive format's cover factor — not at the size the square preview
happens to need. Where that is impractical, the plan copy must not promise the
larger number.

Do not regenerate a library to chase a metric. Regenerate it when a paying tier
is selling a resolution the assets cannot supply, which is the case here.

## 45. A style that sets `fill` must delete `grad`, or it has done nothing

`buildLayer` prefers `props.grad` over `props.fill`. Any pass that assigns a
solid colour to a layer that may carry a gradient must delete the gradient in
the same statement, or the assignment is silently discarded.

This is not hypothetical. `highlightBudget` set `fill = '#f6f2ea'` on its host
plate and then darkened the phone number to `#141110` on the strength of that
brightening. On **138 of the 200 plates it touched**, the plate still carried
its original near-black gradient, so the number was painted dark ink on a dark
ground. Every source-level audit passed: the ink WAS dark, the plate's `fill`
WAS bright. Only the pixels disagreed.

The general form: **when two properties can express the same thing, a pass that
writes one and reads the other is measuring its own intention.** Write both, or
read what actually paints.

## 46. Ask whether the plate is behind the TEXT, not whether it is nearby

Two ways this fails, both shipped:

- **Wrong axis.** A host-plate search that tests only vertical overlap will
  select a side panel at x -60..500 for a number at x 624..966. It shares the
  y-band; it is nowhere near the text. 29 templates.
- **Wrong anchor.** `originX:'right'` and `originX:'left'` with the same `left`
  occupy completely different space. A span computed without the anchor puts a
  right-aligned number at x 1016..1322 on a 1080px canvas.
- **Mere intersection.** A plate overlapping the last 24px of a 160px-tall
  number is not its background. Require ≥75% coverage of the text's own box.

## 47. A layout pass may not grow a block into space it has not checked

`stackBulletRuns` converted "A • B • C" into a vertical stack — roughly 3× the
height — without asking what was below it. When the result did not fit,
`alignPass` dragged it back on-canvas and straight into the headline: 7
templates printed their item list on top of the money word.

Nothing caught it, because the text was still *inside the frame*. A clipping
audit asks "is it on the canvas"; it does not ask "is it on top of something
else". Measure the gap to the nearest layer sharing your column, and cap the
growth at what fits.

## 48. A treatment that darkens is deleting detail, and detail is the product

The duotone and wash styles multiply the backdrop against the category hue at
18% / 8% of its perceptual lightness — effectively black. Multiplying by black
is a floor on the whole frame, and a screen-blend "lift" afterwards cannot
recover what multiply has already collapsed.

Measured cost: median luminance 0.062 against the owner's own good references
at 0.21–0.49, with 207/243 templates below the band — darker than their BAD
folder. Removing the grade alone returned 0.275; the raw photography was
already at 0.384.

Two consequences worth generalising:

1. **The source material was never the problem.** Before commissioning assets
   to fix a metric, render what you already have with the treatment removed. A
   $3 image-generation plan was queued against a gap that a coefficient
   produced for free.
2. **Darkness and "not enough detail" were the same defect.** Crushing a photo
   to near-black deletes the texture that produces edges, so the library's edge
   density came almost entirely from its lettering while the reference ads
   carry detail in the photograph. One cause, two failing metrics, and chasing
   the second one directly would never have found the first.

## 49. Localhost cannot test a policy that only production sends

`index.html`'s two inline `<script>` blocks — the pre-paint theme stamp and the
whole theme toggle — were blocked by the site's own Content-Security-Policy for
an unknown period. The toggle did nothing on the live site.

It was invisible for two compounding reasons: a static file server sends **no
CSP headers at all**, so localhost permits everything the deployed site
forbids; and a CSP violation is a console error, not a broken render, so every
page still looked correct.

Anything enforced by a header — CSP, CORS, COOP, cache policy — is untested
until it is fetched from a deploy preview. `scripts/verify_csp.mjs` does that
and exits non-zero. Use hashes, never `'unsafe-inline'`: allowing all inline
script to unblock two known blocks defeats the policy.

Corollary, and the reason this was found at all: **a render harness must fail
on a page error.** The library renders 243/243 while a pass is throwing (rule
42), so a clean-looking contact sheet proves nothing while the console is
dirty. `render_sheet.mjs` exits non-zero on any page error; that guard caught
both this and a `ReferenceError` in a same-session fix.

## 50. An audit's own geometry is the first thing to doubt

Three separate instruments built in one session each reported confident,
specific, wrong numbers:

- The phone-visibility audit read the number's bounding box **before**
  `alignPass` moved it, sampled a rectangle ~75px off, and reported 22
  templates as having an invisible phone number. They were fine.
- The collision audit counted **curved** headlines as collisions. An arc's
  bounding box is enormous and mostly empty, so straight type sitting in its
  hollow read as a 34% overlap. 8 of 17 reported hits were false, and fixing
  them would have meant moving correctly-placed type.
- A grade sweep's edge detector strided x and y by 2 while indexing neighbours
  at +1, comparing pixels it had skipped, and returned **0.0% for every
  setting**. That same sweep measured bare backdrops — legitimately smooth —
  and would have justified chasing detail in the ground alone.

Two tests before trusting any new metric: does it return **different** answers
for inputs you know differ, and does it measure the surface the user actually
sees? A number that is identical across every condition is not a measurement.

## 51. A theme is a set of jobs, not a bag of attractive swatches

A useful buyback theme has four semantic roles: **ground**, **reading ink**,
**money/action accent**, and **support/trust**. The same accent must not carry
every piece of emphasis. When the phone, CTA, badges, and qualification copy
all shout in one colour, the ad loses its order even if the palette is
technically harmonious.

The GFX Grammar records therefore map by role instead of repainting arbitrary
layers: headline and body reading copy use ink; the final money word, CTA, and
phone use the action accent; badges and supporting facts use the support hue.
Text on a plate is left alone because that plate, not the theme background,
owns its contrast.

Four campaign intentions were transplanted into the existing engine without
copying a source template: urgent local offer, high-value electronics, safe
same-day payout, and after-hours scroll stop. Under normal, protan, deutan, and
tritan simulation, their worst role ratios were:

- reading ink: **8.67–16.57:1** against both gradient stops;
- action accent: **3.93–7.35:1** against both stops;
- support/trust: **4.77–11.51:1** against both stops;
- action accent versus adjacent ink: **1.88–2.77:1**.

The portable lesson is the schema, not these four names. A new palette enters
the product only when every colour has a declared job and survives
`scripts/audit_theme_grammar.mjs`; `scripts/preview_theme_grammar.mjs` then
proves the records are reachable and applied through the real editor UI.

## 52. A finished card may change colour only if it keeps its luminance, and it is judged on its own pixels

Added 2026-09-22 with the showcase refresh (`docs/refresh-2026-09-22.md`).

Two things were true of the showcase before that day. Its legibility had
never been measured: the diff audit (`legibility_audit.mjs`) ran only over the
243 classics, and when it was pointed at the 971 showcase records
(`audit_showcase_legibility.mjs`) **276 of them had a headline, phone number or
CTA under 3:1** against the pixels behind it — the landing section said "None
of them unreadable." And its palettes were generated, not chosen: 51 names out
of one word pot, the largest of them brown ink on a cream ground.

The rule the refresh follows, so a skin can change without undoing an audit:

- **Luminance lock.** Every colour is re-hued from its role in the new palette
  and its lightness is solved so its WCAG luminance equals the colour it
  replaces. Contrast between flat colours is then unchanged by construction;
  only hue and chroma move (rule 31, mirrored).
- **Endpoints, not averages, for a photograph.** Grey under a flat veil became
  a duotone solved to the same black and white endpoints, so the tonal range a
  card was audited at survives.
- **Then measure the pixels anyway**, repair what fails without moving its hue
  (`repair_showcase_contrast.mjs`), and stamp what still fails as a defect
  rather than ship it. A card that cannot be made legible is not offered.

> Superseded in part (rule 66): the second bullet (a duotone solved to the same endpoints) is replaced by rule 56; the luminance lock stands.

## 53. The phone number is the second biggest thing on the card

Added 2026-09-26, from the study session "Teaching the Engine Design"
(2026-09-24..26) and the owner's note on the new work: good "but lacking a
big/medium phone number for people to contact us."

For a buyback ad the number is the action: it is how the person who stopped
reaches the shop. Measured before the fix, on the 1080 canvas:

- showcase (971 cards): the number at a median **58px**, 5.4% of the width,
  0.41× the headline. In a 160px OfferUp tile its digits were about 6px tall;
- classics (243): median **64px**, 149 of them under 72px;
- the video maker, which learned this first: up to 0.72× the headline and 11%
  of the width.

The rule, as `scripts/number_block.mjs` enforces it:

- **Size.** 0.62× the headline *as drawn* (not as authored: fitToDoc shrinks
  long lines), held to **84–118px**, never under **72px** (80px on a 1200
  canvas), never over 0.77× the headline, so the headline still wins by 1.3×.
- **Face.** One of the card's two families: the display face when it is
  condensed, else the support face, at a weight the face really ships (rule 20).
  Never a third family; 54 cards had set it in JetBrains Mono.
- **Ground.** On its own plate, the plate hugging it on the same axis (half of
  the number sat off an off-centre plate on five layouts), or at 4.5:1 per
  letter against the photograph.
- **Never on the devices.** Below the product or beside it (the video engine's
  measured rule: the number on a phone in about half its tall looks).
- **When it does not fit, the small extras go first**: the CTA shrinks to a
  label over the number, then the web address to its minimum, and only then does
  the number step down. A card that cannot fit 72px is not offered.

After: showcase 58 → **84px** median (945 of 971 rebuilt), classics 64 →
**108px** median (165 rebuilt; 73 already at 84px or more keep their own). The
classics' rebuild ships as `assets/number-fix.json`, applied at load.

## 54. A critic decides what is shown, and it judges the number letter by letter

Added 2026-09-26. The study session's plan for the Studio, verbatim: "the
critic runs through the existing audit_showcase_*.mjs pass and stamps `defect`
on assets/showcase/index.json, which the landing already filters on."
`scripts/audit_showcase_school.mjs` is that critic. Every check is a number
measured through `buildLayer()`/`alignPass()` on the card's own pixels.

**Reject** (the card is held back): the number under 72px; the number's worst
**letter** under 3:1 against what is behind it; more than 8% of the number off
the plate it stands on; the number over a product; the
headline under 8px tall in a 160px tile; the headline under 1.3× the next
biggest line; more than two type families; a weight the face does not ship
(rule 20); the copy rules (rule 55); a headline naming a device the card does
not show.

**Warn** (shown; each warning ranks a card one step down, and the hero wall
prefers cards with none when there are enough):
reading text under 25px, ink inside the 6% margin, a widow, more than four
alignment positions, under 25% empty, and a headline, CTA or support line
whose worst letter is under 4.5:1.

Two lessons from building it:

- **Judge the number letter by letter.** A line average passed numbers that
  sat half off their own plate at 1.2 to 2.2:1 per letter, and passed white
  type at 5:1 while two words stood on a light patch at about 2:1.
- **A measure that cannot tell fill from halo must not reject.** On outlined,
  shadowed display type the "letter" is ambiguous (fill, stroke and a 19px
  shadow all change the pixels), so per-letter contrast on headlines is a
  warning; the line gate (`audit_showcase_legibility.mjs`, under 3:1 is a
  defect) still applies to every headline, number and CTA. The first dry run,
  at the literal thresholds, would have held back 791 of 971 cards, most of
  them readable: the thresholds are the study's, the measures had to earn the
  right to reject.
- **The same holds for the line gate.** Averaged over every pixel a line
  changes, contrast counts the letters' soft shadow and anti-aliased edge as
  ink: a 26px label, #101014 on a cyan plate at 6:1 by colour, measured a mean
  of 2.85 because more than half its changed pixels were shadow. The gate now
  judges the core of the strokes (the upper quartile of per-pixel contrast);
  a line that is really unreadable has no core either.
- **Nothing on the number.** After the number moved, a 5px rule, a cue icon or
  a frame border crossed it on 38 cards; each covered about 2% of the box, far
  under the overlap audit's 12%. `scripts/clear_number.mjs` finds what is drawn
  on the number's own ink and removes it when it is decoration.

Result, 2026-09-26, over all 971 showcase cards: the critic holds back 243
(the headline under 1.3x the next line 128, three families 83, the headline
under 8px in a tile 61, the number under 72px 26, the number off its plate 9,
a headline naming a device the card does not show 1; a card can fail more
than one). With the overlap, legibility and repeated-copy defects, **684 are
live** (780 were before the session, on a looser bar), every category and all
29 palettes among them, the number at 72px or more (median 85).

> Superseded in part (rule 66): a collision is 6% of the smaller party's ink (rule 58), not the overlap audit's 12%; copy in the 6% margin disqualifies (rules 57, 60).

## 55. Copy states how the offer works, never a fact the shop has not published

Added 2026-09-26. The study session wrote the industry's copy rules down as
law and the video maker ships them. Every template carries the owner's own
number and site, so every line on it is a line iPhones.LA publishes:

- **no dollar figure** on a graphic (prices move, a picture does not);
- **no invented proof**: no rating, star row, review count, "deals closed",
  quoted testimonial or "since 2015";
- **no promise about how long an offer lasts**, and urgency only when it is true;
- **no invented hours**, and no claim that a person answers every text;
- **no competitor names**;
- **no em or en dash** in anything a customer reads.

Counted on the 971 showcase records before the pass: "SINCE 2015" on 145
cards, a rating on 144, a price figure on 83, invented hours on 46, an em dash
on 61, and 43 testimonial cards signed with invented names. Each became a plain
fact about the offer from the video engine's vocabulary: TEXT A PIC / GET A
PRICE, FREE QUOTE / NO OBLIGATION, NO FEES, CASH PAID TODAY. A testimonial card
became a how-it-works card in the shop's own voice.

The patterns live in one place (`scripts/refresh_copy.mjs`: PROOF, PRICE,
HOURS, DASH, BANNED), so the rewrite and the audit that checks it
(`audit_showcase_content.mjs`) cannot drift apart. A replacement must fit
where the old line was: two first drafts ("SEALED BOXES BOUGHT", "CASH, CARD BY
CARD") set wider than the lines they replaced and ran off their panel.

## 56. The photograph keeps its own colour; shade is neutral, solved, and one-directional

Added 2026-09-26. The owner, on the showcase and the classics: "fix the bad
color schemes from the past … not these ugly hideous overlaid colors and
duotone background images." This replaces the second bullet of rule 52 (grey
under a veil re-solved as a duotone): the luminance lock was right, the
duotone was not.

The study session's layering ladder says what each rung may carry: rung 0 is
the ground (the photograph), rung 1 is atmosphere, **light and shade, never an
object and never a colour**, then graphic, device and copy. Colour has a job,
not a coat: the accent on the plate and the money word, near-black or
near-white ink, and the photograph as it was shot.

Counted before the change:

- showcase: **766 of 971** cards painted their photograph as a duotone (two
  palette colours through shadows and highlights), and 483 distinct tinted
  veils sat over photographs, pastel pinks and mints among them;
- classics: **129 of 243** graded their photograph (88 duotone, 41 one-hue
  wash) in `assignStyle()`;
- 17 poster frames and 9 quote cards were pastel glass covering most of the
  photograph, a veil by another name;
- 12 of the 21 Easy Mode themes failed `scripts/theme_law.mjs`.

The rule:

- **The photograph in its own colour** (`grade.treat 'natural'`, a touch of
  contrast, or as shot). No duotone, no wash, no tint.
- **Shade is neutral**: near-black under light ink, near-white (paper) under
  dark ink. Never a hue.
- **Its strength is solved on the card's own pixels**, per line of copy on the
  photograph (`__sc.naturalGround()` in `scripts/_showcase_harness.mjs`): each
  line's worst end of ground (90th percentile under light ink, 10th under dark)
  must clear 4.5:1 against its ink, or hold where the old ground held it if
  that was further. The lightest shade that does both. No line loses contrast
  and none is shaded darker than it needs. A line counts as light ink when it
  is lighter than its own ground: an orange word on a dark photograph is light
  ink, whatever a fixed grey threshold says.
- **One ink direction per ground.** White badges beside a black headline on
  one photograph ask a single shade to darken and lighten the same picture.
  When the lines in the way are neutral, they take the other side's ink (and
  lose the outline the shade now replaces). A coloured line is never flipped.
- **A plate that covers most of the photograph is judged as a veil**: a big
  translucent pastel panel becomes neutral paper or smoke at the same
  luminance, so the words on it keep exactly their contrast.

After: showcase 920 natural and 51 as shot, **0 duotones, 0 tinted veils**
(562 cards needed only the solved shade, median 0.31; 204 also took one ink
direction, 344 neutral lines); classics 128 of 129 natural via
`assets/ground-fix.json` (neon_sell keeps its grade: its number is carried by
a plate no neutral shade can serve); Easy Mode themes 21 of 21 pass, every hue
kept.

> Superseded in part (rule 66): on a photograph the shade is dark, never paper (rule 62); a coloured dark line lightens to a tint of its hue (rule 62).

## 57. Everything that carries the message sits inside the guides, and it moves as one

Added 2026-09-27. The owner, on a "Sell Your iPhone" card: "make sure
everything fits within the guides it needs to." The critic already WARNED at a
6% safe margin and left it "an open decision". Measured on the live showcase,
the website line sat inside that margin on 293 of 684 cards, the badges on 106,
a headline on 54 and the number on 22. The engine's own clamp was 24px (2.2%),
applied one line at a time.

Moving one line at a time is how collisions are made: pull the website line up
and it lands on the number's plate. So `fitInsideGuides()` (alignPass step 5)
moves the whole COMPOSITION:

- **The message is the union of** copy, plates, stickers, icons and products.
  Left out: the ground (anything covering at least 85% of both dimensions),
  frames and corner marks, and edge tickers.
- **Scaled and shifted about its own centre** until the union is inside 6% of
  the short side, so every spacing relationship survives.
- **Bleed stays bleed.** A band or a product that touched an edge still touches
  it after, and a full-width band keeps its full width.

After: 0 lines of copy in the margin on the showcase and on the classics (was
293 website lines, 106 badge rows).

## 58. Copy is never touched: by copy, by a plate's edge, by decoration, or by the product

Added 2026-09-27. The owner: "there's still major overlapping issues … audit
any overlapping elements … for maximum legibility." The first overlap audit
compared bounding boxes, and a box around italic type or a curved label is
mostly air (rule 50). `scripts/audit_collisions.mjs` renders every layer alone
into an ink mask at quarter scale and measures ink against ink:

- **copy on copy** and **the product on copy**, as a share of the smaller
  party's ink;
- **a line across a plate's edge** (4 to 96% of its ink inside a plate that
  carries copy);
- **copy in the 6% margin**, **copy off the ad**, a **product cut by the
  frame**, and a **product half on a panel and half off**.

A card collides at 6%. Baseline: 285 of 684 live cards. Each layout repeated
ONE fault, so each fix is a rule in `alignPass`, not a patch on a card:

- **A plate grows only into clear space** (step 4). The snug test had skipped
  exactly the plates whose words overflowed them. The first fix grew them about
  their centre, and the phone plate then reached over the REQUEST AN APPRAISAL
  line below it (scriptRetro, hudTech, ticketStub, arcCrown, neonNight): one
  collision fixed, another made. Each axis now grows only while it stays off
  every other line.
- **Words stay on their plate** (4b). The panel widens first, within the
  guides. A line set OUTSIDE its panel (a left-aligned variant at x=72 on a
  ticket starting at 150) slides in, and lines that shared a left edge still
  share one. Only then does type come down, never below 72%, never the number
  below 72px (rule 53). A line wrapped taller than its pill grows the pill, or
  shrinks if that would touch other copy. Hosts include tall panels: a 560px
  ticket was above the plate list's half-height cap, so its headline had no
  host.
- **Decoration yields** (4c, rule 7). A mark that touches copy, crosses a plate
  that carries copy or leaves the guides moves a short way (at most 1.5x its
  size, down to 70%) or goes. **A sticker is never moved, only removed**:
  moved, one landed as a bare disc mid-photograph with its curved CASH NOW
  label dark on dark. A pointer cursor on a static ad imitates a link nobody
  can click; it goes everywhere. Checklist ticks are information and stay.
- **The product keeps clear of the copy** (4d). A product that touches a line,
  or sits half on a plate, moves to the largest clear rectangle: open ground,
  or the inside of a card. On a card is a place; across its edge is not. It is
  never enlarged, and below 40% of its authored size it is left out rather than
  shown as a speck. 47 Steps Flow cards had their product under the three
  full-width step cards.

The audit is the check, not the fix: it re-runs after every engine change,
because the plate fix above is exactly the kind that trades one collision for
another.

## 59. The Glass Card: the product on the card, money on the ground

Added 2026-09-27. The owner, on "Cherry & Aqua · Glass Card": "the asset
should be on the inner card while a tile PNG of money or money falling,
overlay in BG." The layout had put the product photograph BEHIND a near-opaque
panel, so the panel hid the thing being bought and what showed round its edges
read as clutter.

- **Ground**: falling money (`assets/grounds/money-fall-{dark,paper}.webp`,
  `scripts/build_money_grounds.py`), built from the library's own $100 bill in
  three depth planes, far bills smaller, softer and darker. Natural colour,
  never tinted (rule 56); the neutral shade sits on it as on any photograph.
  This is the one sanctioned **object on the ground rung**, and only because
  it is texture: no bill is legible as a subject behind the card. Dark or paper
  follows the card's ink.
- **Card**: taller (188 to 800), and at least 0.88 opaque, so no bill patterns
  behind a letter. A see-through panel's colour is not what anyone saw (they
  saw the photograph through it), so it takes the neutral that carries its ink.
- **On the card**: the headline stacked from the top, sized under the number's
  rank (72 / 120 / 56); the selling points and city line up from the foot;
  **the product in the band between**, with a contact shadow. The product is
  the record's own when still approved, otherwise the category's (an iPhone
  headline always gets an iPhone set; strip boxes read as blank cartons, so
  strips get the fan).

53 records restaged by `scripts/restage_glasscards.mjs`; a restaged record
restages to itself, so re-running it is safe. A product WALL (ghosted cut-outs
tiled over the ground, four records, three of them rejected strip photographs)
is removed: under the money it is ground-rung clutter.

> Superseded in part (rule 66): the card is smoke or paper whether see-through or solid (rule 64).

## 60. The library shows each design once at its best, not every recolour of it

Added 2026-09-27. The owner: "Of the 780 possible themes, take out at least
half of them, the most redundant, similar to another one, poor design, so we
have the 400 that showed the least mistakes."

Measured first: 632 of 690 live cards sat in 91 (category, layout) groups of
four or more, and one composition was shown in up to 17 palettes. A pixel
similarity measure separated same-layout pairs from different-layout pairs by
only 4.90 against 5.24, too weak to decide anything (rule 50), so **redundancy
is structural: same category and same layout is the same design**, whatever
its colours.

`scripts/curate_showcase.mjs` decides, in this order:

1. **Disqualified outright**: collides (rule 58, at least 6%), copy off the ad,
   copy in the margin (rule 57), the headline, number or CTA under 3:1 on the
   card's own pixels, and anything the critic rejects (rule 54: a number under
   72px, the number's worst letter under 3:1, a line off its plate, a broken
   hierarchy).
2. **Ranked by mistakes**, lower is better: the critic's warnings (rule 54),
   line and letter contrast short of 4.5:1, the number's worst letter short of
   7:1, measured overlaps, a product cut off or half on a panel. Ties go to the
   owner's own approvals, then colour.
3. **Kept in proportion** to what each category has live, and within a
   category **round-robin across layouts**: every design's best card before
   any design's second, and a design's next card must bring a new palette
   family.
4. **The owner's hero picks are kept** unless they collide: a person chose
   them, and a score does not overrule that.

Retiring is a stamp (`defect: "curated"` on the index row), not a deletion:
the record and its thumbnail stay, and deleting the stamp brings a card back.

After: 400 kept of 684 (65 disqualified: 52 collisions, 17 critic rejects, 1
critical line under 3:1, some cards on two counts; 219 retired as weaker
recolours), 114 of 118 designs still shown, the largest recolour group 17 -> 8,
median mistake score 3.16 kept against 5.15 retired, all 12 of the owner's
live hero picks kept.

## 61. A perfected theme is re-set for a device, not redrawn

Added 2026-09-27. The owner: "once a theme is perfect we can make unlimited
variations for all types of devices specifically."

A variant changes only what names the device, and nothing that makes the
theme:

- **the headline** takes the device family from `assets/devices.json` (IPAD
  AIR, MACBOOK PRO), short enough to set large;
- **the line that lists models** takes that family's models as the
  storefront names them;
- **the product** takes the device's own cut-out, in the finish whose colour
  is nearest the card's accent (a neutral palette takes a neutral finish).
  A finish's colour is measured where a model's finishes DIFFER, which is the
  body; measured over the whole cut-out, it read the shared wallpaper. The
  product is fitted into the original product's box.

Layout, palette, faces and ground are the card's own, and alignPass (rules
57, 58) keeps a longer name or a wider device on its plate and inside the
guides.

**A card can be re-set only when the product is the hero and the ground does
not picture a device.** A card whose device is its photograph would put
SELL YOUR APPLE WATCH over a stack of MacBooks, the mismatch fixed on twelve
cards the same day. On 2026-09-27 that is the Glass Card (rule 59). Other
themes qualify as they are finished with the product on a plain, scene or
money ground.

**A whole line** is a variant too (owner: "variations like categories.
(sell your iphone) showing multiple models … (sell your macbook air pro neo)
with multiple"): the category in the headline (IPHONE, MACBOOK, APPLE WATCH,
APPLE), the line's models side by side, each in the finish nearest the
palette. The row takes the width of the card it stands on (fitted into the one
product it replaced, three MacBooks came out as stamps); devices are set at a
compressed relative height (a watch 0.62 of a laptop, not a fifth of it);
wide devices overlap a little, tall ones stand apart.

Variants are generated when someone asks (the Easy Mode device picker;
`scripts/device_variants.mjs` for a batch), never stored, so the library
stays one card per design (rule 60).

## 62. A photograph is shaded dark, never milky

Added 2026-09-27. The owner, on the curated library: "make sure it still keeps
good colors. a lot of these have a white haze overlay", then "doesn't look
great". This replaces, for photographs, rule 56's "near-white (paper) under
dark ink".

Measured: 238 of the 400 kept cards shaded their photograph with near-white
paper at 0.3 to 0.6, many over a blurred photograph too. A white veil turns
every colour in a picture pastel, and a card reads as washed out however
correct its contrast is.

The rule, as `scripts/darken_grounds.mjs` applies it through the ground
solver (`__sc.naturalGround()`, prefer 'dark'):

- **The shade on a photograph is near-black**, graded top and bottom where
  copy sits so the middle of the picture comes through, a flat veil only if
  the grade cannot hold every line, at the lightest strength that clears 4.5:1.
  A blur over 4px comes down to 4: detail and colour are the point.
- **Neutral dark copy on the photograph takes near-white ink.** Its outline
  goes, because the shade now separates it.
- **Coloured dark copy keeps its hue and turns its lightness over**: a deep
  green headline becomes pale mint, magenta light pink. Re-inked white, the
  palette would be lost; left dark, the card kept its haze.
- **The plates under the copy follow what the eye saw.** A pale band that is
  see-through (or so large it counts as a veil) under a line now re-inked
  light turns dark: same shape and opacity, a tinted band to a deep shade of
  its own hue. A see-through plate (opacity 0.5 to 0.9) whose copy keeps its
  dark ink becomes solid in the colour it showed over the old shade, so that
  copy keeps exactly its contrast (rule 52). Missing either made a light line
  on a light band, or dark copy on a band gone mid-grey (about 2:1).

The same pass also takes a card with NO shade whose critical line reads under
4.5:1 with dark copy straight on a mid-tone photograph (nine cards, a blue
SILVER DOLLARS on a teal halftone among them): a white veil was not their
fault, but the dull read was the same.

> Superseded in part (rule 66): a band under a re-inked line is smoke, never a deep shade of its hue, and a see-through plate becomes neutral (rule 64); a blurred photograph is 14 to 24px, not 4 (rule 65); the shade stands only where the copy stands (`bands`), not graded top and bottom (rule 66).

## 63. The support colour highlights the supporting copy, where it reads

Added 2026-09-27. The owner: "Audit all new themes and make sure we use
supportive highlights on some themes if it looks good."

Rule 51 gives the support/trust colour its job: badges and supporting facts.
Audited over the curated 400, it sat on 213 cards and always on frames,
ribbons, plates or decoration, never on the supporting copy. The selling
points read in the headline's ink, so nothing said "the reassurance, read it
second".

`scripts/support_highlights.mjs` gives the ONE line that backs the offer (the
selling points, the item list, the price line) the support colour, only where
it holds up on the card's own pixels:

- **4.5:1 against the ground under that line**, rendered with the line hidden
  and everything else in place;
- **its own colour**: at least 25 DeltaE (CIE76) from the accent, which keeps
  the money and the action, and from the ink, with real chroma (over 12);
- **never one of a numbered set**: Step Micro 1 highlighted beside plain 2
  and 3 reads as a mistake, not a system.

61 cards qualified. 289 fail contrast on their own ground and keep their line
as it was. "Some themes" is the measurement's answer, not a quota.

## 64. No hue over the photograph: panels are smoke or paper, glows are shade

Added 2026-09-27. The owner, on the curated library: "these colored hazes
don't look great. Unify with the new design language in the 'template and
content audit update' thread." That language is rule 56: rung 1 over the
photograph is light and shade, never a colour. Colour has a job, not a coat:
the accent on the action plate and the money word, the support colour on the
selling points (rule 63), the product, and the photograph as it was shot.
This replaces rule 62's "a tinted band to a deep shade of its own hue", and
extends rule 59: the Glass Card's card is neutral when solid too, not only
when it was see-through.

Measured on the 404 live cards, three kinds of haze were left after rules 56
and 62:

- **Tinted panels.** 182 cards laid a hue over the picture: see-through
  tinted rects (87 step cards at a median 0.52, 64 tiles, 33 item panels,
  chips, review rows, the tinted bands rule 62 left under re-inked lines),
  and solid pastel or deep-tinted panels holding the copy (lavender step
  cards under SELL YOUR iPAD, a navy poster frame under WE BUY SILVER, olive
  under WE BUY GOLD JEWELRY, cherry and beige Glass Cards).
- **Pale glows round shapes.** 423 plates, panels and products threw a wide
  (12px and more) pale or tinted shadow, set for the white-shaded grounds;
  on the dark grounds of rule 62 every plate sat in a halo of haze.
- **Glowing type.** Rule 62 re-inked lines light and left their light halos:
  947 lines glowed white on the photograph, which rule 27 already forbids
  (the halo takes the tone the ground is not).

The rule, as `scripts/neutral_panels.mjs` applies it:

- **A panel that holds copy is smoke or paper.** All its copy lighter than
  it: smoke (16,16,19) at its own opacity, so the photograph shows through as
  shade. All darker: paper (247,246,243) at 0.9 or more, since paper thinner
  than that is rule 62's milky veil. Mixed, empty, or a sheen: a neutral grey
  at the same luminance and opacity (rule 52).
- **A see-through tinted rect is judged the same whatever it is**, and so is a
  pale see-through one whatever its hue: the white quote card at 0.5 is the
  milky veil.
- **One system, one treatment.** Numbered siblings (Tile 1 to 4, Step Card
  1 to 3) take what most of them take; a panel with no copy of its own that
  frames one that has (the ticket round its perforated card) goes the same
  way; a numbered line that alone is dark among light siblings, held up by an
  outline (FREE QUOTE on three white tiles), takes their ink.
- **The glow round a shape is shade**: neutral dark at its own strength.
- **A halo takes the tone its ground is not** (rule 27), never a hue; on a
  plate a light halo is never added, since the plate is the separation.
- **Judged on the pixels.** Every line's ground (copy hidden, 10th and 90th
  percentile) is measured before and after. A change that leaves any line
  under what it had, or under 4.5:1 where it had more, steps back to the
  same-luminance grey, then to as it was.
- **Solid accent plates keep their colour**: the CTA card, phone plate,
  kicker, price strip, step number box and knockout band are the accent
  doing its job.

After: 366 cards changed. Panels on 239 cards: 225 paper, 213 smoke, 6 grey
(one kept as it was); 315 sheens made neutral; 423 glows made shade on 170
cards; 1015 halos on 288 cards (947 light to dark, 16 dark to light, 52 hues
taken out); no line lost contrast. A second run changes nothing.
`darken_grounds.mjs` now darkens a band to smoke and turns a re-inked line's
halo with it, and `restage_glasscards.mjs` sets the card in smoke or paper, so
neither can bring the tints back.

Found on the way: alignPass 4c (decoration yields to copy) tested a mark made
of type against its own authored box, so every step digit, quote mark and
star row "collided" with itself and was pushed about its own width: on all 44
live Steps Flow cards the digits sat 23 to 60px right of their boxes' centre.
A mark is no longer tested against itself; all 44 now sit centred.

## 65. Every kind of ground, each on the card's own palette and judged on its pixels

Added 2026-09-27. The owner: "We need to use backgrounds that are solid
colors, sunburst all sorts of styles even patterns overlays so we have all
varieties some images some blurred images. That way we have the most amount
of options or we can always use a photo of the Apple Store background that is
a good one."

Measured on the 400 live cards before: 373 on a photograph, 27 on the
money-fall ground, not one solid, gradient, sunburst or pattern. The owner
had ticked 115 drawn grounds in 33 styles on 2026-09-03
(`assets/approved-grounds.json`); the catalogue (`grounds.js`) lived only in
the lab. And the 84 "blurred" cards were not blurred: the Template Lab stored
blur in pixels on the 1080 card (4, 9, 15, 22), `blurredEl()` read it as a
fraction of the photograph's width, and a blur of four widths is a flat smear
of colour. The lab painted with the same function, so the smear is what was
approved.

The rule:

- **Grounds come in kinds, and the library shows all of them**: photographs,
  blurred photographs, solids, gradients, sunbursts, patterns and textures,
  and a neutral pattern over a photograph. A drawn ground is a background
  source (`ground:<kind>/<palette>/<seed>`, `overlay:<kind>/<tone>|<photo>`)
  painted once by `grounds.js`, so the thumbnail, the editor, Easy Mode,
  export and video draw it like any photograph.
- **A drawn ground carries the card's own palette**, its theme ground fitted
  to the copy on it: deepened (or lifted) until that ink clears 6:1, so a ray
  or a pattern still leaves every line above 4.5:1.
- **A drawn ground needs a product.** Only a card whose subject is its hero
  cut-out (220px and more) leaves its photograph; a headline on a flat ground
  was the owner's "lack the proper imagery" (2026-09-02). A card whose subject
  is the photograph keeps it, and may take a pattern over it.
- **A pattern over a photograph is black or white at a low strength**, never
  a hue (rule 56): dots, halftone, grid, stripes, rays, scanlines, grain.
- **A blurred photograph is visibly blurred**: 14 to 24px on the 1080 card,
  the photograph's colour and shapes still there, its shade re-solved so every
  line on it clears 4.5:1 (`darken_grounds.mjs --resolve`, the solver's
  strict mode; the old ground it would otherwise have held was the smear).
- **Judged on the pixels.** Every line's ground is measured before and after;
  a card that loses a line on its new ground, and on a plain solid of the same
  palette too, keeps its photograph. So does a card whose copy on the ground
  reads both light and dark: one ground cannot serve both.

After: 100 cards re-grounded by `scripts/vary_grounds.mjs` (69 drawn: 14
solid, 13 sunburst, 13 gradient, 14 pattern, 15 texture; 31 photographs under
a pattern), 84 blurred cards really blurred. Easy Mode's Background field has
"More grounds" (Photos, Blurred photos, Solid, Gradient, Sunburst, Pattern,
Texture, each swatch painted in the card's or the chosen theme's palette) and
a "Pattern on top" row under Effects that lays any overlay over any ground.

The Apple Store photograph the owner mentions is not in the repo, and this
session's network policy refused every free-photo host. It goes in as a
photograph like any other once the owner supplies one (OPEN-ITEMS §K).

## 66. One measure, one gate, and which rule wins

Added 2026-09-27. The owner: "audit of any overlapping code, contradictory
code, or overall fuzzy directions … every generation has a self audit process
and a check before they're produced."

Measured: the checks lived in scripts and ran after the fact; the studio
exported unmeasured. app.js carried 11 luminance helpers, 8 contrast-ratio
formulas, 14 hex parsers and 21 "which plate is under this line" finders; the
scripts carried 30 more luminance helpers, four live-card predicates and ten
contrast measures (mean, upper quartile, worst letter, 10th/90th percentile)
against three thresholds. Two checks could disagree about one card. And the
rulebook contradicted itself: 37 pairs of rules pointed opposite ways, most
because a later rule replaced an earlier one without saying so.

The rule:

- **One measure.** `pgCheck()` in app.js is the measure of a card: every
  reading line's core (the upper quartile of its per-pixel contrast, paint
  with it and without it) and worst letter, the number's size and its ink off
  the plate or on the product, the headline in a 160px tile, the guides, copy
  touching copy. Its thresholds are `PG_T`. The legibility audit and the
  critic read their numbers from it; the scripts reach it as `__sc.check`.
  A new helper for luminance, contrast or a plate under a line is a
  mistake: use `pgLum`, `pgCr`, `pgRgb`, `pgCheck`.
- **One gate, before anything is produced.** A download, a video or a print
  order runs `pgGate`: a contrast failure is fixed first by neutral shade in
  the direction the failing lines need (dark under ink lighter than its
  ground, paper under darker), raised until every line reads; anything else
  is named in the visitor's words, with the choice to go back or download
  anyway. A script that rewrites a record runs `gateRecords`: the candidate
  is measured against the record on disk and kept only when it leaves no
  new failure and no critical line under what it had.
  `scripts/verify_showcase.mjs` runs the gate over the library and exits 1
  on any failure; it runs before a commit.
- **One predicate.** A card is live when it is not condemned, has imagery,
  and has colour: `scIsLive` in app.js, `live()` in the harness. No script
  writes its own.
- **One unit.** Blur is pixels on the 1080 card when 1 or more, a fraction
  of the width below 1 (the classics). The index carries the record's blur.
- **Precedence.** The later rule wins, and the earlier one now says so in
  place (the "Superseded" lines). In particular: 56 over 52; 62 over 56, 23,
  13 and 11 (shade); 64 over 62, 59, 21 and 3 (hue over the photograph,
  halos); 65 over 62 (blur) and 6 (a sunburst ground is not a price disc);
  41 over 14 and 32 (the split complement); 40 over 26 and 31 (OKLCH); 57
  over 35 (the composition moves as one); 58 over 54 (6%, not 12%); 55 over
  7 (no review stars). Where a threshold differs between rules, `PG_T` is
  the number.

**The shade stands where the copy stands** (added 2026-09-28; the owner:
"just make sure the backgrounds are visible if possible"). Measured before:
the library's photo cards showed a median 26% of their photograph through
the shade (197 of 273 under a flat veil, median strength 0.55), the classics
49%. Two passes that only lightened the veil (aiming at the core of the
strokes, then 3.5:1 for supporting copy) reached 29% and 50%: a shade over
the whole card must be as strong everywhere as the copy needs it anywhere.
The rule:

- **A shade on a photograph is `bands`**: full strength across each band of
  the card's height that holds a line of copy standing on the photograph
  (a line on its own plate is left out: the plate owns its ground), feathered
  over 6% of the height on either side, and nothing at all between the bands.
  The picture shows through wherever no line needs the ground. Its strength
  is still the lightest that passes the gate. Written as
  `scrimMode: 'bands:a-b,c-d'` in fractions of the height, drawn by
  `scrimRect`, so the card, its thumbnail, the editor and the gate see the
  same shade; solved by `naturalGround` with 'bands' first, 'gradient' and
  'normal' only when the bands cannot hold every line.
- **The studio's own shade is the same shade.** `pgGate` steps the shade
  it adds in Easy Mode and the editor as bands derived from the scene after
  the layout (`pgShadeBands`, `pgShadeFit`), so a generated card is shaded
  as the library is.
- **Measured after** (2026-09-28, after the bands pass: the library's photo cards show a median 62% of their photograph (26% before; 4 cards under 30%, from 48), shade median 0.44 from 0.55, 264 of 273 re-solved, 5 held back by the gate, 399 of 399 pass; the classics 72% (49% before; 1 under 30%), shade median 0.27 from 0.48, 230 of 235 bands, 227 of 243 pass, the same 16 held back).


the ground table undid a second later (rule 56); the Easy Mode overlay is
shade, never the visitor's colour (rules 56, 64); a theme recolours the copy
and keeps a photo-led card's photograph (rule 65); a halo's tone follows the
ink's own ground where the bake measured it (rule 27); the watermark keeps a
story or wide ad's shape; the content audit never clears a curation stamp; a
wall cut-out is not a hero. Left for the classics' re-bake (OPEN-ITEMS §L):
the 45% wash on their hex plates, and paper scrims on three dark-ink cards.

## 67. Emoji are iOS style or none, and only on some cards

Added 2026-09-29. The owner, after a drawn 3D set (Fluent Emoji) went live
the same day: "EMOJIS ONLY IOS STYLE REMOVE AND DELETE ALL !", then "AND
DON'T OVER USE ONLY FOR SOME". The 3D set, its placement and its thumbnails
were removed entirely (reverted).

Apple's emoji artwork is Apple's and cannot be shipped inside the product as
pictures. What the product can use is the device's own emoji font, which on
an iPhone, an iPad or a Mac is Apple's. So (`pgEmojiPass`, app.js):

- **Only on Apple devices.** An emoji is a character in the device's emoji
  font, placed only where that font is Apple's; on any other device nothing
  is placed and the editor's emoji picker is not shown. No card anywhere
  carries an emoji that is not iOS style. The library's thumbnails are made
  on a server and carry none.
- **Only on some cards, one at most.** About three in ten cards are eligible
  (by the card's id, so a card always shows the same one), and a card gets
  one only where there is room. Easy Mode's Emoji row (Apple devices only):
  Auto, Shuffle (always one where there is room), None.
- **Emoji typed into a design follow the same rule.** 28 library cards carry
  one as a deco line (a ⚡ between headline lines, a 🏁 beside "WE BUY"):
  it shows only on Apple devices, and such a card gets no extra one.
- **Beside the words, never on them**: beside the largest headline line,
  the topic read off the headline (never the website or the number), or a
  hand pointing AT the number (rule 29). Never on copy, a plate, a product
  or another mark, inside the guides; the gate fails one that is.

Measured with the pass forced on (a Linux test machine): 102 of 399 library
cards get one, 297 none, 0 on copy.

## 68. Copy is never under a shape, and the gate says so

Added 2026-09-29. The owner, on Rush Hour in Easy Mode: "this sucks". Its
two rotated bands had doubled in thickness: the guides fit rebuilt an edge
band's width and height from its bounding box, which for a band at -6 degrees
is twice its thickness. The gold band rose over the bottom of "iPHONE" and the
dark band buried "CASH PAID TODAY" entirely; the list pass had also stacked
the band's one-line device list into three lines. The gate passed it,
because only the headline, the number and the CTA could fail as invisible,
and nothing asked whether a shape was drawn over copy.

- **A rotated band keeps its own thickness and length** in the guides fit.
- **A line on a band or a pill stays one line** (stackBulletRuns).
- **The gate fails any reading line that is invisible** ('ghost', any role)
  **and any line with a solid shape, a dot or a product drawn over its
  letters** ('covered', over 4% of the letters' body, on the real rotated
  outlines).
- **After the layout, covered copy comes out** (`pgUncover`): it slides clear
  by the shortest way, on its own plate and inside the guides, or comes down
  in size away from the shape (never under 72%, never the number); a small
  mark (a status dot) on the words moves out in front of them.

The new checks found seven broken classics already in the Easy strip (a CTA
under the number's pill on the review layouts, the item list under the
number's plate on the trust-seal layouts, a line inked the colour of its
plate); the resolver fixed the first two kinds, the gate holds back the
last (classics: 226 of 243 pass, 17 held back). One library card whose tick
circles the layout had left a row out of step with its lines
(checklistHero-du08-20, the only one of 30 tick lists) was retired: 398 live.
