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

(2026-09-27: the street and outline tagline styles put a rim on type when the
visitor asks for it; rule 83.)

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

> Superseded (rule 87): a halo is neutral at any chroma and takes the tone its ground is not; a light halo behind light ink is a glow (rules 27, 85).

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

(2026-09-27: this holds for one money word. A cohesive sweep repeated on every
selling line, carried by a rim, is the owner's pick and may travel hue: the
street, gradient and pair tagline styles, rule 83.)

### 6. No starbursts, ever
The 14-spike disc behind a price is 1990s clearance-rack retail. It was the
single worst thing in the library. Deleted.

> Scope (rule 87): the starburst this bans is the 14-spike price disc. A sunburst GROUND in the card's own palette (rule 86) is a background, not a sticker.

### 7. Decoration that imitates information is worse than no decoration
An 88px filled disc with a tick in it, at identical coordinates on 46 of 153
templates, carrying no information, is decoration wearing the costume of a
trust mark. Removed. The library has three layouts that make a *specific*
trust claim (`reviewProof`, `trustSeal`, `stepsFlow`) — those say something,
and they stay.

Functional marks stay too: checklist ticks, step numbers, review stars. They
are information design.

> Superseded in part (rule 87): review stars and review rows are invented proof and do not ship (rule 55); the layouts stay.

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

> Superseded (rule 87): the shade is solved per line on the card's own pixels (rule 56), dark on a photograph (rule 62); no fixed strength per palette.

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

> Superseded in part (rule 87): STREET's white 0.70 scrim and its outlines are gone (rules 56, 62); the family's other traits stand.

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

> Superseded in part (rule 87): the 140 to 180° "maximum pop" pairing gave way to the split complement (rule 41); a coloured dark line may lighten to a pale tint of its hue (rule 62).

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

> Superseded in part (rule 87): a see-through tinted rect over a photograph is a haze and becomes smoke, paper or grey at the same luminance (rule 85). On the classics (2026-09-28) a hex block big enough to carry copy is drawn solid in its colour and only thin rules and stripes stay at 45%.

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

> Superseded (rule 87): on a photograph the shade is dark and neutral dark copy takes light ink (rule 62); the ground no longer takes a light wash from dark ink.

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

> Superseded in part (rule 87): colour moves in OKLCH, not toward white or black in sRGB (rule 40).

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

> Clarified (rule 87): the ring is dark behind ink lighter than its ground and light behind ink darker; never a hue; on a plate no light halo is added (rule 85).

## 28. A tolerance on one edge is not containment

Deciding whether a text sat on a plate by testing its top edge within 10px of the
plate's box put a caption at y=930 "inside" a plate ending at y=922. It was then
excluded from the contrast fix *and* given the halo meant for type on a plate —
two wrong answers from one loose predicate, on a layer that was actually resting
on dark photography.

Test the thing you mean. Containment means the text's vertical middle falls
within the plate's real span.

> Superseded (rule 87): containment is the centre inside the plate for a host, 75% cover for a fit (rules 46, 58).

## 29. Gestures point; they do not symbolise

Swapping emoji for the icon set turned a 👉 — a layer literally named "Arrow",
placed to point at "TEXT US NOW!" — into a phone glyph sitting on top of the
words. Hands and arrows are wayfinding: they mean *look over there*, and there is
no category mark that carries that. Ticks and stars are typographic and belong to
the type.

Drop a gesture rather than translating it.

> Extended (rule 88): an iOS hand is placed only pointing at the number or the call to action.

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

> Superseded in part (rule 87): hue is kept by moving L in OKLCH (rule 40).

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

> Superseded (rule 87): every accent is derived as a split complement (rule 41); the complement no longer sits on the small element by design.

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

> Superseded (rule 87): a card that does not fit moves as one composition inside the 6% guides (rule 57); the per-line nudge and the 24px clamp are gone.

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

> Superseded in part (rule 90): a colour theme repaints the plates too, so it answers for the lines on them; text on a plate is left alone only while the plate keeps its colour.

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

> Superseded in part (rule 87): the second bullet (a duotone solved to the same endpoints) is replaced by rule 56; the luminance lock stands.

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

> Narrowed by rule 101 (2026-09-30): a classic keeps its own big number only
> while its headline still leads by 1.3x; one that outranks its headline is
> rebuilt at the cap.

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

> Superseded in part (rule 87): a collision is 6% of the smaller party's ink (rule 58), not the overlap audit's 12%; copy in the 6% margin disqualifies (rules 57, 60).

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

> Superseded in part (rule 87): on a photograph the shade is dark, never paper (rule 62); a coloured dark line lightens to a tint of its hue (rule 62).

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

> Superseded in part (rule 87): the card is smoke or paper whether see-through or solid (rule 85).
> Widened by rule 94: no card carries a product wall, not only the glass cards.

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

> Superseded in part (rule 87): a band under a re-inked line is smoke, never a deep shade of its hue, and a see-through plate becomes neutral (rule 85); a blurred photograph is 14 to 24px, not 4 (rule 86); the shade stands only where the copy stands (`bands`), not graded top and bottom (rule 87).

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

## 64. Words on a plate keep air at both ends, measured in the plate's own frame

Added 2026-09-27. The owner, on CALL FOR INSTANT OFFER set edge to edge on the
Street price badge: "why can't we seem to catch this? it would need to be
shrunk 10-15% to make a minimum margin on the sides."

Why it was not caught:

- **The collision audit only scored a straddle** (rule 58: 4 to 96% of a
  line's ink inside a plate, failing at 6%). A line that fills its plate end
  to end, or pokes one letter over it, has 97 to 100% of its ink inside and
  passed.
- **alignPass step 4b fits on axis-aligned boxes.** On a tilted sticker the
  badge turns about its corner and its line about its own top centre, so on
  the -4° badge the line landed 8px off centre: 22px of air at one end and 37
  at the other, "inside" by the box test.
- **A box is not the ink** (rule 50). A serif W starts 33px into its box; a
  textbox's box is its wrap width, not its words.

The rule, as `plateAir()` applies it after alignPass (app.js) and
`scripts/audit_collisions.mjs` measures it:

- A line **on** a plate (its ink centred within the plate, no taller than
  1.15x it, no wider than 1.4x it) needs, at each end, along the plate's own
  axis, `max(12px, 4.5% of the plate, 0.35 of the type size)`.
- The ink is measured (`measureText` bounds: where the ink starts in the line
  and how wide it is), not the text box.
- **The least change first.** A centred line alone on its plate goes back on
  the plate's centre line; any other line slides by its shortfall toward the
  end with room. Only when the total air is short does the type come down,
  about the end it is anchored to, never below 72% of itself, and the number
  never below 72px (rule 53).
- A plate washed to 45% by buildLayer is still the ground the line reads on:
  anything from 25% alpha up counts, and plates are taken as drawn (a
  palette fill lives on the object, not in the layer's props).
- **Plates of one fill that overlap are one shape**: a ticket and its notched
  perforation (780 and 866 wide) read as one ticket, so the line is measured
  against whichever gives it the most room. The smallest plate is otherwise
  the line's own: a pill on a card is judged by the pill.

Measured with `--no-air-fix` for the before: classics short of air **25 → 1**
(the one left is a headline 1.26x its panel, held by the 72% floor), showcase
records **187 → 1**, live cards **56 → 0**. Collisions did not rise (classics
48 → 48, showcase records 102 → 101, live 0 → 0). The shrink the owner estimated, 10 to 15%, is
what the rule gives a line on a tight sticker; a line that only sat off
centre moves instead of shrinking.

## 65. A video opens on the finished ad and shifts to the card's own call to action

Added 2026-09-27. The owner, on the first video build: "this is still bound by
our OLD design language", "the bg images / colors don't look very good", then
"it is a good theme for ads to then shift to a CTA.. starts a fully made
graphic image ad". And on formats: "primarily 1:1 or 3:4 but occasionally we
will do the 9:16", "primarily design for the square format".

The first engine (`video.js`) re-set the copy on its own tinted grounds and
recoloured the ad, the look rules 56 and 62 retired. It is gone. The video is
now the trunk's living still with one addition (app.js, MOTION parts 2 and 3):

- **Frame 0 is the still**, so every grid, every cover image and every muted
  autoplay shows the finished ad. It is judged on 8x8 blocks: no block more
  than 8 levels off on average, and under 0.5% of pixels more than 8 off. A
  faint layer composited back through 8-bit premultiplied alpha is off by a
  few levels on scattered pixels (worst block 4.9); a real mismatch is a
  region (a clipped shadow: blocks at 17 to 23). The per-pixel rule refused
  one 3:4 card for rounding alone; the block rule passes it and still
  refuses both simulated shadow clips.
- **At 5.8s it shifts to a call to action built from the card's own parts**:
  its headline, its call-to-action line, its number on its plate, its product
  cut, on its own photograph. Nothing is added and nothing is recoloured,
  except as rule 62 prescribes below. The parts travel from where they stood
  in the ad; each line travels with its own plate (the badge under CALL FOR
  INSTANT OFFER went with it).
- **The words before the picture.** The stacks tried, in order: product +
  headline + action line, headline + action line, product + headline,
  headline, product, the number alone. What the shop buys and what to do
  about it are the message; a picture without them is not.
- **Rule 62 in motion.** The shade is near-black and graded to the band the
  copy occupies, so the photograph comes through above and below; its
  strength is solved per line to 4.5:1 on the frame's own pixels. A line that
  lands dark on the photograph (or too dim for any dark shade, under 0.3
  luminance) turns its ink as rule 62 does: neutral to near-white, coloured
  to its own hue turned light, outline and halo dropped (a light halo round
  now-light type is a haze). The ink crossfades during the move. A line
  carried by a light outline of real weight (the red CASH with its white
  outline) keeps its accent.
- **Rule 27 in motion.** A part that lands on dark ground has any light glow
  the card keyed to its old, lighter ground re-cut dark, same blur and
  offset: on WE BUY GOLD JEWELRY and its green number plate that glow read
  as a white haze once the ground was shaded.
- **Every call to action is audited before it ships**: parts inside the 6%
  guides (on 9:16, inside the clear box between the platform's own chrome),
  the product off the copy, no two parts on each other, the number at least
  72px at 1080, every line 3:1 or better by the critic's method (rule 54).
  A card with no passing stack keeps the living still for the whole clip.
- **Square is the design format**, 3:4 second, 9:16 occasional. Audits run
  square across the library first.

Measured (`scripts/motion_audit.mjs`, 2026-09-27, merged trunk):

| | cards | call to action built | with the headline | frame 0 fails | flash fails |
|---|---|---|---|---|---|
| square, curated | 398 | 398 | 383 | 0 | 0 (worst 13.9% of a region; the limit is 25%) |
| square, classics | 243 | 238 | 223 | 0 | 0 (worst 8.3%) |
| 3:4, curated | 398 | 398 | 391 | 0 (1 under the per-pixel gate, below) | 0 (worst 19.4%) |
| 9:16, first 60 curated | 60 | 60 | 56 | 0 | 0 (worst 5.8%) |

The five classics that keep the living still: `neon_sell` (its number is
carried by a plate no neutral shade serves, rule 56), `silver_ster`, and
three voltStack classics whose action line reads 2.5 to 2.9:1 on its plate
in every stack. Every call to action's worst line reads 3.05:1 or better
square (3.02:1 at 3:4) by the critic's measure. 186 curated cards take a
shade under the copy.

## 66. A flash check reads linear light at full resolution, and a counting number is a flash

Found building the first engine, and kept for every clip since (WCAG 2.3.1,
`MotionFlashCheck`).

- **Linear light, every pixel.** WCAG's thresholds are relative luminance.
  Letting `drawImage` shrink a frame first averages in gamma space: against an
  exact linear-light average of a real 1080×1920 frame that misread cell
  luminance by up to **0.29**, three times the 0.10 transition threshold, and
  the error sits on type edges, where an ad's motion is. A transition is a
  swing of 0.10 in relative luminance with the darker state under 0.80; cells
  are 1/36 of the short side; a cell with 7 transitions inside any one second
  (more than three flashes) is hot; hot cells over 25% of any third-by-third
  region fail the clip. Saturated red is checked on its own, the same way.
- **A counting number is a flash.** A $1,100 count at 170px on a dark ground
  at 30fps failed, 10 flashes a second over 33% of a region: each digit swaps
  glyph in place many times a second. Numbers arrive once, whole.
- The export is refused, not warned, when the check fails.

## 67. An audit proves it opened the card it names

Added 2026-09-27. The first run of the video audit reported 14 curated cards
with no call to action. They were one classic, measured fourteen times.

`showEasy()` runs `loadAccount()`, which with no token signs out whatever
account a headless script set, synchronously; `selectEzTpl()` then swaps a
premium template for the first free one without a word. So a card that "fell
back" was `sell_iphone`, with its dark number on a cream band. The same trap
opened classics as the wrong template, and a render taken before the
photograph finished loading measured the plain ground.

Every audit that opens a card through the app now pins its stub account
(`loadAccount = async () => account`), **asserts** the template that opened
is the one it names (an error row, not a silent substitute), and waits for the
photograph and cutouts before it renders. An audit's first suspect is its own
harness (rule 50), and a result that looks like a design failure on many
different cards at once is a harness failure until proved otherwise.

## 68. The headline is a claim, set big and tight

Added 2026-09-27, the owner on stepsFlow-nn05-30: "the tagline just says
iPhone, that's abysmal. We need to at least say we buy iPhone. Sell your
iPhone. Top iPhone buyer. Fast cash for iPhones. Quick iPhone buyer. It needs
to be larger and more legible … everyone can say they buy iPhones but
claiming the top buyer or quickest buyer is a really good way to get you the
clicks."

- The headline carries a claim, never the item word alone. The bank, ranked:
  TOP iPHONE BUYER, QUICK iPHONE BUYER, FAST CASH FOR iPHONES, SELL YOUR
  iPHONE, WE BUY iPHONES (a ranking claim first: it earns the click). The
  generator authored SELL YOUR / iPHONE; a later pass dropped the claim line
  on two Steps Flow cards, and nothing checked. `scripts/audit_card.mjs` now
  fails a card whose headline has no claim word.
- As large as the width inside the margins and the height above the next
  block allow (the restaged card: 204px, caps 10%+ of the canvas).
- Stacked lines sit as display type sits: 4-16% of the size between the
  LETTERS, left edges within 2px. The engine judges stacked lines by their ink
  (alignPass step 3); judged by their boxes, which carry the face's ascent and
  descent room, two lines 10% apart "collided" and were pushed a line apart
  ("too wide of line spacing").

## 69. A trust word is a badge with a mark, hung on the claim

Added 2026-09-27: "ez buyer does not count as part of the headline. That's
just an extra selling point … a verification badge, a shield icon … I don't
want it to be so obvious that it's a floating piece of text at the top always."

- The kicker's words become a badge: a pill with a mark and its words. The
  words rotate from a bank (#1 BUYER, TOP BUYER, BEST BUYER, EZ BUYER, FAST
  BUYER, QUICK CASH, TOP OFFER, MEET NOW, AVAILABLE NOW, LA · OC · IE, LA / OC,
  `BADGE_WORDS` in app.js) and the mark says what kind of point it is: shield
  for trust, bolt for speed, tag for money, a live signal for availability, a
  pin for where.
- It never repeats a word of the headline beside it (TOP iPHONE BUYER + EZ
  BUYER reads BUYER BUYER; `badgeWordsFor()` filters the bank).
- It hangs from the claim's cap line, beside its last line; not a floating pill
  at the top of the card. Mark and words centred on the pill, padding balanced.
- A dark outline mark reads only on its plate. A mark that ends up off its
  plate takes the plate's colour (alignPass 4c recolours it): "floating makes
  it really hard to even discern".
- A plate that carries a mark as well as words is composed: the layout passes
  neither centre its words nor fit it to them (`plateHoldsMark()`); fitted to
  the words alone, the bolt fell off the pill's left end.

## 70. Two faces, two weights each

Added 2026-09-27: "There's too many type faces so it looks all over the place.
We need to use one to two maybe three max."

One display face (the claim, the step numerals, the number) and one support
face (the badge, the step titles and lines). A third only for a reason the card
can name. Two weights a face. Rows of the same kind share one set of sizes: the
restaged card's step titles had been fitted per row to 33.8, 36.8 and 35.1px,
which reads as three different styles. The library measured 297 live cards on
two families, 98 on three, 3 on four; the audit fails over two.

The faces come from the owner's approved set (assets/approved-fonts.json, a
review of 151, 2026-09-01) and the showcase faces, all self-hosted, in the pairs
by voice in FONT_PAIRS (app.js): a display face for the claim, the numerals and
the number; a support face for the badge and the steps. Every weight a family
ships is loaded before a card is painted with it (2026-09-29: a 700 headline in
a static family painted in the fallback first).

## 71. Small type on a plate is crisp

Added 2026-09-27: "it looks a bit blurry for the subtext in each bubble."
Nothing under 26px at 1080. Type that sits on its own plate carries no blurred
shadow: the plate gives the contrast, and a 4px blur on 22px type reads as out
of focus.

## 72. Repeated plates are one plate

Added 2026-09-27: "The boxes look cheesy … number three isn't even centered."
Steps, tiles and rows share one width, one height, one gap and one style: flat,
no sheen stripes, no per-row fitting to the words, no boxed numerals. The
numeral is set in the display face in the accent, centred on its plate, all
numerals on one axis; each row's words centred in the plate with one left
edge. The "3" left its box because a numeral is decoration AND a word, and
alignPass 4c counted it against itself: a mark is never in its own way now.

## 73. The product is photographed facing the layout, never mirrored

Added 2026-09-27: "what if we mirrored it to face the other way and put it to
the right of the three blue boxes … that space looks perfectly carved out for
the phone and it leaves space for the background image", then "is there any AI
magic to make the phone flipped the correct way around instead of mirrored?"

- The product goes in the space the layout leaves for it, clear of every word,
  and it stands on something (the CTA band) rather than floating.
- It faces into the layout by being photographed that way. A mirrored iPhone
  carries its cameras on the wrong side of the back, which a buyer of phones
  sees at once. Pick the photo that faces the right way (cosmic-orange-17
  leans in; -02 stands straight); the audit fails a mirrored product. The
  cutout builder honours `flipX` for things with no handedness only.
- The background photograph is a design asset: the audit wants a third of the
  card to show it.
- Factory original only: "we should never re-skin a device color … everything
  needs to look factory original factory finish and factory side/secondary
  color … like Pacific Blue, it has a shiny chrome blue side". The
  own-apple-cosmic-orange photos are a 16 Pro's square camera bump painted
  orange; a 17 Pro has the full-width camera plateau. `assets/cutouts/devices.json`
  lists each device photo's model, colour, view, the way it faces, and whether
  it is authentic; audit_card fails a card whose product is not an authentic
  entry. Model details that give a fake away: the camera module and plateau,
  lens count and layout, the Action button and Camera Control, Dynamic Island
  or notch, the rail's material and colour.

A visitor may swap the phone (2026-09-29, the Easy Mode picker): only factory
photos from the shop's own catalog are offered, the popular high-value models
first; the new photo takes the old one's box and is re-seated by its ink (its
foot where the old foot stood), and a phone beside the steps is one row with
them in every format, however narrow the photo.

## 74. One accent carries the card; the badge wears the CTA's colour

Added 2026-09-27, on the glassCard iPhone cards: "if there is anything to unify
the theme it would be carry on the color of the ez buyer bubble … as the CTA
bubble color." The badge pill and the CTA plate are one colour, and the same
accent sets the claim's last line and the step numerals. The number fills its
band: its DIGITS at least 70% of the width inside the margins and two-thirds of
the band's height inside the guides, centred on the band as it is seen (a band
that runs off the canvas is seen to the edge), as far as the guides let the
letters go. The website line leaves the band when it would hold the number
small (Easy Mode already leaves it off unless one is typed).

On every card, not only a restaged one (2026-09-29): sized to a band that runs
off the canvas, the number's box left the guides, and grown about its centre, a
number set on the left guide ran off the card (x = -40 on an offer card). In
Easy Mode the gate stopped 7 of 20 street cards and the offer cards. A card's
number is sized inside the guides (a restaged record by its letters, any other
by its box, as the gate measures it), keeps the edge it was set on unless it
was centred on its band, and keeps its letters inside the guides: no offered
template's number leaves them now (261 swept).

A tagline look that treats plates treats the badge and the CTA together
(2026-09-29): a gradient that paints the badge paints the band in the same
stops, and Street's dark bands take the badge with them, its words and mark
turned light. Each gradient stop is lifted until the words on the plate still
read (7:1 under the number, 4.5:1 under the rest).

## 75. The engine chooses; it does not roll

Added 2026-09-27: "Let's use more neon colors too, pastels can be good too but
neon is the easiest attention grabber", then "The idea isn't to be unlimited
variety and completely random … we wanna have the options so the design engine
can produce the best possible graphics using our BG assets … it's gonna select
a color or a theme that might support what we have already built. At the end of
the day we're looking for cohesiveness."

The libraries (gradients, textures, badge words, claims, shapes, devices) are a
palette for the engine to choose from, not a lottery. The accent is read off
the photograph: its dominant hue, weighted by colourfulness, picks the neon
across the wheel from it (the flame-orange laptop picked glacier cyan on the
card called Glacier & Flame). Neon first; pastel where the photograph is soft.

## 76. Nothing ships unaudited; letters, not boxes

Added 2026-09-27: "can you audit this graphic and not put out another without
100% validating and self auditing? using all of the factors we're expecting
and have mentioned … you should already know to NEVER deliver without self
validating and extensively auditing your designs until fixed and PERFECT."

- `scripts/audit_card.mjs <id>` measures every rule above on the pixels the
  studio paints, in the gallery painter, in Easy Mode (square and 3:4) and in
  the video bake. A card is shown to anyone only at 100%, and after a human
  look at all three renders.
- The layout passes judge type by its letters (`textInkRect()`), not its box:
  the guides (57), stacked lines (3), decoration (4c), the product (4d) and
  centring on a plate (step 1). Judged by boxes, they shrank a card 1% and
  slid it 5px, pushed a headline's second line down, moved a badge's bolt and
  lifted a phone off its band — every one a move nobody placed.
- The audit checks the layout passes moved nothing that was placed; a pass
  that moves a placed layer is second-guessing the design.
- Tall formats move blocks, not layers (`blockRemap()`): a claim and its badge,
  a stack of steps, a band and the phone on it each stay rigid; the extra
  height goes between them. A full-width band pinned to an edge is a block of
  its own (joined to the steps through the phone standing on it, the whole
  lower card was pinned to the bottom and all the spare height sat above the
  steps: "can I have the center content scooted up … otherwise there is a
  large gap", 2026-09-28). Blocks between the anchored ones sit centred, with
  equal space above and below, measured by their letters; a phone that stood on
  the band ends with its block instead. audit_card checks 3:4 and 9:16 for it.
- The claim reads on every crop (`claimShade()`): a photograph crops
  differently at 9:16, where the laptop's bright rim came up behind TOP iPHONE
  (4.27:1). A headline line under 4.5:1 gets a dark neutral shade fading down
  from the top, solved to the least that passes; where it reads, nothing is
  added.
- How it ships: the letter passes (above, plus `linesOffEdges()`: a line mostly
  on a plate goes all the way on, a band pinned to an edge grows to hold its
  line, a line grazing a plate's edge moves clear) and the number-fill and
  block-remap changes apply to records whose layers carry `__ink` (restaged
  and passed by audit_card). Flipped for the whole library at once they
  regressed live cards: the library had been tuned against the box passes, and
  a box-based push had been landing some numbers on plates they were authored
  half off. With the flag, the classics audit is identical and no live
  showcase card changes. The library moves over card by card, each through
  audit_card. The numeral fix (4c) applies everywhere; it only removes a bug.

## 77. A tall card grows into what the photograph leaves plain

Added 2026-09-28, the owner on the 9:16: "we could enlarge the steps and
possibly layer the phone over top of the steps thus extending the UI … we
don't split text obviously but we could split something like selling
points/steps and the image to fill blank space … show me that you understand
that and five examples … where you make the correct decision in a row."

A tall format has more height than the square design uses. Where it goes is a
call the engine makes from the photograph (`tallFill()`), and the audit
re-measures it:

- The photograph's **subject** is its rows with at least half its peak detail
  (the laptop's keys and lenses, a lineup of phones). It keeps its space.
- The **plain run** is the rows between the subject and the CTA band.
- **Grow** when the plain run is well taller than the content (1.25x): the
  list (steps, selling points) grows as a unit, one line still one line and
  never re-wrapped, its plates widening to the margin, up to 1.45x. The
  product then either **floats centred above the list** when there is room
  above it — centred on the card and raised a tenth of the card's height off
  the list, clear of the first plate's words and of the claim (owner,
  2026-09-28: "can you center the asset and scoot it up 10%?"; standing on
  the first plate's corner it read as off to one side) — or sits **beside**
  it, layered over the plates' empty right ends, clear of the longest line by
  16px, ending with the steps. Never over a word. The list stays off the
  photograph's subject; a floated product may sit over it, as the ad's hero.
- **The reference 9:16** is stepsFlow-nn05-30's, approved by the owner on
  2026-09-28 ("Yes, that would be the ideal 9:16"): the claim top-left, the
  steps grown to the margin above the band, the phone centred and floating
  between them. It is kept at `assets/approved/stepsFlow-nn05-30-story.webp`.

## 78. An approved render stays approved

Added 2026-09-28. When the owner approves a render, it is saved in
`assets/approved/` with the owner's words and the commit
(`approved.json`), and `audit_card.mjs` compares the card against it in that
format at a quarter of its size (the film grain is random on every render and
averages out there; a moved element does not): more than 0.5% of pixels moved,
or a mean difference over 2.5, fails the card. Tested: raising the phone 8%
instead of 10% (38px) moves 2.91% of pixels and fails. An engine change that
alters an approved card is shown to the owner and re-approved, or undone; it
is never shipped silently.
- **Fit** when the plain run holds the content but not more: the content moves
  into it, off the subject, unchanged. Centred on the card it had covered the
  subject's lower half and left the plain run empty.
- **Centre** when the photograph is subject top to bottom: nothing moves over
  it that need not; the content stays centred between claim and band.
- A product layered over plates on purpose is marked (`pgLayered`) so the
  product-clearance pass does not "rescue" it up into the photograph.

What the card generator decides with it (restage_steps_flow.mjs): the claim's
ink direction (a light ground takes dark ink and a deep accent; a dark shade
strong enough for white type on a white photograph would smother it), and a
band colour lifted in lightness until the number reads 7:1. A photograph that
can carry neither (a mid-grey flat-lay of other phones: 2.8:1 either way) is
not used for a claim set on the photograph.

## 79. A product picture is a claim: it must be the product, whole, and legible

Added 2026-09-27. The owner: "Audit any overlapping issues, bad assets, or
inaccurate info / flaws. or bad copy gets removed." The library's product
pictures had been checked for their subject (rule: an iPhone on a sports card
is wrong) and never for what they are. Most are AI renders, and an AI render
can letter a product wrong, invent a camera, or leave half a hand in frame.

Found by OCR over all 478 cutouts (RapidOCR) and by eye over every cutout a
live template draws:

- **garbled lettering**: gold bars stamped BOLD, silver bars WILD GOLD and
  WILD BOLD, a banknote reading FDDERALRESDRVENOTE, a keyboard with a
  "copslock" key, phone backs reading Addrorid, AMDFORIO and AHDImONO;
- **the wrong product**: three "iPhones" that are Android phones (one has a
  rear fingerprint sensor), "Pokemon" boosters with another game's art, rapid
  test cassettes on the diabetic test strip ads, playing cards as sports cards,
  euro coin rolls on a US coin ad;
- **cut off at the frame**: 24 pictures whose subject the photograph cut (a
  truck without its front, gold bars sliced at both ends, phones without their
  bottoms), found by `scripts/cutout_edges.py`: a cutout trimmed to its own
  edges is anti-aliased all the way round, a crop meets the frame with a run of
  fully opaque pixels (0 on every edge for a whole product, 0.25 or more of an
  edge for these);
- **broken**: a key fob with a fragment of a hand, two phones with the wavy edge a hand leaves when
  it is cut away, a smeared binder, a stray orange ball;
- **too small**: a 144px coin drawn at up to 2.6x on six coin cards, a 365px
  key fob at 1.5x, a 222px iPhone at 2.5x.

59 pictures are listed in `assets/cutout-flags.json` with the reason. The rule:

- **The owner's own pass is the first gate.** `assets/approved-assets.json`
  is the owner's review of every cutout (2026-09-03: 348 approved, 116
  rejected with reasons). A picture the owner rejected never ships, whatever
  else it passes; the flags below catch what the owner's pass missed. One rule
  in one place, `scripts/picture_gate.mjs`, read by every audit and by the
  swap. The first version of this rule consulted only the flags, and its swaps
  put rejected pictures back on 131 showcase cards; 247 pictures on 162 cards
  were swapped again. The owner's "off-category" rejections (a speaker, a
  gaming laptop: "not something the shop advertises") are lifted only in the
  five categories the owner opened for those goods.
- **No blank product.** A slab with a blank card, a faceless box, white cards
  in a fan: the owner rejected them ("nothing says what is bought") and,
  looking at the offer cards, "it feels really incomplete because the cards
  don't even have a brand or image on them." A card category shows cards with
  their faces: the real PSA 10 Charizard cut from a Commons photograph, and
  until real sports photographs land, placeholders named `ph-*` whose cards
  carry a picture and no invented brand (`scripts/make_card_assets.py`).
- **A flagged picture never ships.** A card that drew one gets a clean
  picture of the same kind of thing, fitted inside the old one's footprint so
  nothing new overlaps (`scripts/swap_flagged_cutouts.py`); the classics'
  product pools and street rows use whole, full-size pictures.
- **No picture is drawn past 1.5x its own pixels** on the 1080 card (soft on a
  Free export, 3x on Pro); 1.0x to 1.5x is a warning.
- **No clean picture, no picture**: a buying line the library has no clean
  picture of is set in type (the offer family's type layout), never over a
  near-miss device.
- A new picture is OCR'd, edge-tested and looked at before it is used.
- **A layer that draws nothing is removed, not shipped.** Three car cards
  carried a brand-logo layer the lab had inked (`logo:assets/logos/…`); app.js
  has no inking step, so in the Studio it was an empty layer called Brand
  Logo, and marks are type only in any case (the ICONS and wordmark notes in
  app.js). The layers were taken out; the audit no longer counts a `logo:`
  layer as a missing product picture.

## 80. A headline claims no more than the picture shows and the shop buys

Added 2026-09-27, the same instruction. Rule 55 took out ratings, prices,
hours and dashes. The same kind of claim was still there in other words:

- **a rank**: #1 TOP BUYER, WE BEAT, "show us their number, we fix it",
  and in a second pass WE TOP, WE OUTBID and WE MATCH THE COIN SHOP (57
  showcase headlines), WE PAY MORE, MORE THAN THE PAWN SHOP;
- **a clock**: "Snap photos, text them over. 30 seconds." (81 showcase cards),
  "Firm quote in minutes" (81), GET AN INSTANT OFFER (53), OFFER IN 10 MINUTES;
- **a service the reseller may not run**: WE MEET YOU LOCALLY OR YOU MAIL IT
  IN, LOCAL PICKUP OR PREPAID MAIL-IN, MAIL-IN KITS AVAILABLE, HOUSE CALLS,
  7 DAYS, EVALUATIONS DAILY; on the car cards FREE TOW (51 showcase lines),
  CASH IN HAND BEFORE WE TOW, SAME-DAY PICKUP ACROSS LA & OC, TITLE AND DMV
  PAPERWORK HANDLED, LIEN PAYOFF;
- **the law**: NO SMOG NEEDED, "NO TITLE? WE STILL WANT IT.": what a car sale
  needs is the state's to say, not a template's;
- **a policy nobody set**: NO LOWBALLS, COMPS SHOWN WITH EVERY OFFER,
  DOCUMENTED FAIR-MARKET OFFERS, PAYING COLLECTOR PRICES, NOT MELT;
- **a reputation nobody gave**: TRUSTED (205 showcase lines), HONEST GRADING;
- **more than is bought or shown**: EVERY SEALED BOX, and on the owner's 50
  offer cards "We buy all three" over four kinds of device, "Every Apple device
  in the drawer is cash" over models lines that stop at iPhone 11 and M1.

`scripts/refresh_copy.mjs` CLAIM names them and CLAIM_FIX says what each says
instead, in the same room ("GET A CASH OFFER", "A firm quote by text. Zero
obligation.", "CASH / NO FEES / LOCAL", "SKIP THE COIN SHOP", "AS-IS / SAME
DAY / NO FEES", "CASH IN HAND WHEN WE MEET"); `scripts/honest_claims.mjs`
applied it to 540 lines on 423 showcase cards, then 150 more on 116 in the
second pass, and the same words were edited in app.js. A comparison becomes
an invitation (SKIP THE COIN SHOP says where to sell, not that we pay more).
The audits reject what is left. One star either side of a word is an ornament;
a star row or a number with a star is a rating. A headline names only what the
picture shows or the kind of thing it shows; "all three" needs three.

## 81. Every template the studio builds meets the showcase's bar, or is held back

Added 2026-09-27. The showcase was measured by four audits and the landing hid
what they rejected; the 243 templates the studio builds at load were never
held to that bar. `scripts/audit_templates.mjs` now measures every one of
them, the offer family included, with the showcase's own measures (overlap,
legibility, the design school) plus the rules above (a flagged or stretched
picture, invented copy, the wrong device, the same words twice), and writes
the ones that fail to `template-holds.js`. app.js takes them out of TEMPLATES
once every template-building script has run, before the page is drawn.
`?noholds=1` keeps them, for the audit.
A hold is data somebody can read: the id and the reasons.

## 82. Every offer card stands on a photograph of its goods, and speaks in its category's voice

Added 2026-09-27. The owner, on the offer cards: "they are good designs, they
are definitely lacking type faces that have personality or flavor and the
gray sections should have a background image".

- **No grey sweep.** The ground behind the headline and the product is a
  photograph of the line's own goods (a coin album for coins, real test strip
  boxes, a binder of cards, a dealership lot), in its own colour
  (`assets/bg-offer`, `scripts/make_offer_grounds.py`). A line with no
  photograph of its goods yet stands on a NASA picture, which shows no product
  at all, rather than on somebody else's goods.
- **Type on a photograph is white, over a solved neutral shade** (rule 56):
  solid black from the top to under the last line of type, as strong as that
  photograph needs for 4.5:1 (its 90th percentile luminance; 0.2 to 0.62 on
  this set), fading toward the product. The small type (the steps, the ticks)
  never sits on a photograph: it has a solid panel in the look's colour, which
  is where the look lives now.
- **Each category has a voice**: its own display faces (varsity and marker
  for sports cards, comic for Pokemon, Western and engraved for gold and
  coins, techno for gaming, rounded for test strips), paired with a plain
  reading face for the steps and the number. When none of a category's faces
  can set a headline in a layout at 1.3x the number, the general faces do,
  rather than the card being dropped.

## 83. A choice is made once and holds everywhere: every template, every family, the picture and the video

Added 2026-09-27. The owner: "You don't build anything in this repo if it's not
100% unified into all design language not just portions ... have it as a
possibility in all possible templates so video elements could be possible in
templates and vice versa so we don't have logic that only applies to one type
of ad or worse, one type of category only ... at the end of the day this is
gonna be one engine inside of the GFX studio site".

- **A choice lives where the pictures are made, never in a family.** The
  tagline style (the owner's picks from the Tagline Lab: as designed, street,
  gradient, blocks, pair, outline) is applied in `renderEzCanvas()`, which
  makes Easy Mode's preview, every download, the category pack and the video
  (MOTION animates that same scene), and on the editor's canvas
  (`loadTemplate`, the hand-off from Easy Mode, the editor's own row). No
  code path styles one family or one category.
- **A card's colours come from the card** (`tplPalette`): the colour theme
  the visitor picked, when it is on the scene (`sc.__theme`: Easy Mode and
  the editor it hands off to), else its family's own palette (a showcase
  record, a designer or street PAL, an offer look), else the scene's most
  colourful ink, else the owner's reference sweep (orange into yellow).
- **The theme first, the look last** (2026-09-29, the colour-theme session's
  merge): a colour theme owns the card's colour (`themeScene`), so it
  repaints the laid-out scene and the look is then
  solved on the themed card, in its palette, in Easy Mode, the download, the
  video and the editor alike. A card the editor opens from anywhere else
  wears its own colours, and ORIG gives them back to the look as well. When
  the visitor's own photograph loads after the hand-off, the theme and the
  look are both solved once it lands.
- **A style reads the ground it lands on, and keeps the contrast the line was
  designed with** (3.2:1 at the least, 4.5:1 asked at the most). The gradient
  and pair sweeps solve their lightness on the line's measured ground; street
  darkens a plate or a mid-toned band under a line (the reference's dark
  bands) and gives a line on a large light panel the same sweep, deep and
  without the rim; outline is heavier with a soft halo on a light ground; the
  design's own ink says which side of the ground a line was set on when a
  translucent panel measures mid-grey. Type under 34px keeps its design: a
  3px rim on a 20px label is a smudge.
- **A style that would break a card gives way and says so.** Blocks are
  measured from the drawn ink before anything moves; a block that would land
  on other copy or the product, or reach within 2.5% of the card's edge, turns
  that card to the outline, and the row says why. A block is a plate, so its
  padding may pass the 6% guides while the letters stay inside them; it is
  placed by its outline as it stands on the card (a turned line's block is
  wider than its own width), and a claim's blocks move as one, so its lines
  keep the edge they share. Held inside the guides, a claim set on the guide
  slid its block a whole padding sideways, onto the owner-approved card's
  badge, and every turned claim gave way (2026-09-29: blocks now give way on
  4 of 81 audited templates, each over its product).
- **A look changes a stroke about the line's centre** (`keepGlyphs`, from the
  variant board): fabric keeps a text's top-left, so an outline put on moved
  the letters half a stroke, and taken off (a reset, a variant tried and
  dropped, the video's last frames) moved them back the other way.
- **A style can be switched on a canvas someone has edited.** What a style
  changes is recorded on the object (`pgTagRest`, kept through undo, autosave
  and saved designs): the paint as it was, and every move as a move (a
  block's shrink and shift, plateAir's slide), never as a position, so
  `taglineReset` puts the designed card back without undoing a drag, a resize
  or a format switch the visitor made since. Every draw refits a block whose
  line changed (a drag, a snap, Quick Edit, the properties panel, undo), a
  duplicated line gets a block of its own, a block cannot be picked apart
  from its line, and Enhance keeps the style (one step in the history). The
  audit that found these (2026-09-28) drove each case in the editor.
- **It is measured on every family.** `scripts/tagline_audit.mjs` opens two
  templates of every family and category the way a visitor does, picks each
  style the way the row does, and runs the critic (rule 54) on every line and
  the video's frame-zero check (rule 65): every style passes on all 82.
  Building it found a bug in the video that no one style owned: the bake
  cropped a moving line to its box plus 6px, and an italic T reaches past its
  box, so on a line with no shadow (on a block) the video cut the end off the
  T. A moving text's crop now allows a third of its size.

Rules 1 and 5, amended by the owner's picks. Rule 5 stands for a single money
word: a rainbow on one word still lands in "mid" (the MATTHEW study). A
cohesive sweep repeated on every selling line and carried by a rim is a
different thing and the owner's favourite (the #1 BUYER reference), so the
street, gradient and pair styles may travel hue. Rule 1 (no outlines on type)
stands for the templates as designed; the street and outline styles are a rim
the visitor asks for, and the critic measures them like any other line.

Amended 2026-09-29, when the three lines of work became one (the trunk's
looks, the gate session's shade and emoji, this rule's engine):

- **The looks are the trunk's, the engine is this rule's.** Twelve looks
  (solid, street, signature, gradient, accent into support, white and
  outline, colour blocks, multicolour, glow, red and blue 3-D, 3-D block,
  pattern), sixteen premade gradients, any stops, the angle, the outline and
  effect overrides and thirty-six patterns are one choice (`ez.tag`), set in
  Easy Mode's panel or the editor's row and held on every surface. A card may
  carry a look of its own (`tpl.look`), shown under Solid.
- **The library wears them** (2026-09-30, the owner: "we're not really
  using our text effects / variations to show the differences and ways we
  can support our themes with more flavor"). No showcase card carried a
  look, so the gallery never showed one. `scripts/assign_card_looks.mjs`
  gives about six in ten live cards a look from their family's own short
  list (neon glows, the sticker family multicolour, poster slabs colour
  blocks, the retro script 3-D block), chosen by the card's id (rule 75),
  kept only where the gate accepts it, else the next, else as designed.
  Street is not assigned (it darkens the number's plate, rule 74), and an
  approved render is left alone (rule 78).
- **Every look is solved on the card, not only the first six.** A premade
  or picked gradient keeps its colours where they read on the line's ground
  and moves them together, lighter or deeper, where they do not (a sunset on
  a paper panel read 2.8:1). What cannot be solved from the mean ground is
  chosen by the critic on the card, at half size: a fill stays as solved
  where it reads and goes to the ground's other side where it does not
  (street bright in a rim or deep without, multicolour and pattern at the
  other lightness: on a cream ticket they read 1.4 to 2.5:1); glow tries the
  neon as drawn, then tighter, deeper, the colour itself on paper, a deep
  rim and the outline's rim, and keeps the first that reads at 3.5:1 (as
  drawn, a wide soft glow read 1.3 to 2.9:1 on 15 of 82 templates); 3-D
  block tries deeper sides and a firmer edge; the red and blue print sets
  its letter white or ink.
- **A look's own layers belong to their line.** A glow, the red and blue
  offsets and the depth are marked (`pgKin`, `pgKinId`), so they are reset
  with the look, measured with their line by the critic and by the gate
  (never as words touching it), and in the editor they follow the line
  through a drag, a word edit, undo and redo, and go when it is deleted.
- **What comes after the layout stays after it.** alignPass runs plate air,
  the product off its subject (rule 84), the number's floor, the bands shade
  (rule 87) and the emoji accents (rule 88); the look runs after them, and
  the emoji are placed again on the scene the look left, so an accent never
  sits on a block or a slice of depth. The editor finishes a card the way
  Easy Mode does (the number fills its plate, the claim shade) before the
  look goes on.

## 84. A product stands off its photograph's subject

Added 2026-09-27. The owner: "keep in mind where the background subject is in
relation to the secondary asset to show another version/view of the product
... we don't want it to entirely cover the content of our background subject,
if possible sometimes it's OK or a little bit but consistently starts to look
bad or confusing, especially when we're talking about centered images and then
we happen to center something on top of it" (gold coins over the ring
photograph, the strip fan over the Contour bottle).

- **Where the eye goes is mapped, not guessed.** `scripts/photo_subjects.py`
  maps every photograph a product can stand on (every offer ground, the
  designer and street scenes, each photograph a showcase card puts a product
  over) into 16 x 16 cells of where it draws the eye: what stands out at
  object scale (spectral residual saliency), what differs from the picture's
  own edges, what is in focus. A box would not do: the ring photograph is
  rings from edge to edge with the one that matters in the middle. Subjects
  checked by eye are set by hand (`BOX`). The table loads with the page
  (`photo-subjects.js`).
- **Covering is two things** (`coversSubject`): hiding much of the subject (at
  least 30% of it, and 1.35 times the product's share of the card, so a
  full-frame texture covered in proportion is fine), or sitting on the centre
  of a concentrated subject (a ring, a bottle, a coin) and hiding at least 12%
  of it.
- **The product moves, the words do not** (`productYield`, with alignPass, so
  every family and every surface gets the same card: Easy Mode, the editor,
  the thumbnails, the video). The smallest move, then the least shrink (never
  below 85%), that shows the subject: 40% less of it hidden, or off its
  centre by 6% of the card and a fifth less hidden. It never lands on a word,
  a plate (a full-width band counts; a shade that fades to nothing does not)
  or another product it was not on, never leaves its 6% guides (or the bleed
  it was designed with) or the plate it stands on; a glow or shadow drawn
  under it goes with it. Where no such place exists it stays: a little cover
  is fine, a broken card is not.
- **A room is context, not a rival subject.** A console in front of the
  gaming room's TV reads as a console in a room, and the map's weight on a
  screen is shared with its strips and panels, so it is not moved. Tried the
  other way (each room's screen set as its subject), 13 of the 30 gaming
  cards moved and most came out worse: products pushed into corners and onto
  the bands.
- `scripts/subject_audit.mjs` paints every card with a product on a mapped
  photograph with the pass off and on, and lists what moved and what still
  covers. 2026-09-28, 437 cards: designer 0 of 30 cover their photograph's
  subject; street 1 of 37 (moved); offer 7 of 140 (4 moved, 3 still cover a
  little: cameras over city lights, a laptop over the moon, the strip fan in
  the narrow split layout); showcase 0 of the 230 live cards with a product
  (they hide at most 12% of a subject).

## 85. No hue over the photograph: panels are smoke or paper, glows are shade

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

## 86. Every kind of ground, each on the card's own palette and judged on its pixels

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

> Extended (rule 93): the designer's Backgrounds tab offers the same kinds, in the card's or the theme's palette, with blur, Shade/Fade and the patterns; the ten fixed-colour backdrops are retired from it and from the community gallery.

## 87. One measure, one gate, and which rule wins

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
shade, never the visitor's colour (rules 56, 85); a theme recolours the copy
and keeps a photo-led card's photograph (rule 86); a halo's tone follows the
ink's own ground where the bake measured it (rule 27); the watermark keeps a
story or wide ad's shape; the content audit never clears a curation stamp; a
wall cut-out is not a hero. Left for the classics' re-bake (OPEN-ITEMS §R):
the 45% wash on their hex plates, and paper scrims on three dark-ink cards.

## 88. Emoji are iOS style or none, and only on some cards

Added 2026-09-29 on the live branch (claude/fervent-pascal-w6mthe) as rule 67;
numbered 88 here, where it replaces the drawn-emoji rule this number held
(the live branch's 64-68 are 85-88 and 91, and its references follow). The
owner, after a drawn 3D set (Fluent Emoji) went live
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

Amended 2026-09-30. The owner: "Emojis can be used if applicable or design is
lacking or can use the extra placements." A sparse card (four or fewer lines
of copy besides the number and the website) is eligible as well as the three
in ten; it is still one emoji at most, still iOS style or none, still beside
the words and never on them. Measured with the pass forced on: 61 of 139
sampled live cards get one, 0 on copy, a plate or a product.

## 89. A variant is the approved design recomposed from approved parts

Added 2026-09-29 on the trunk as rule 79 (numbered 89 here, after the
rules 79-88 merged before it), for the variant board (owner, 2026-09-27:
"at least 500 options … themes taglines fonts colors, everything nothing left out … even
shapes for background box/bubble like CTA … (with or without using outline)
… cohesive, fun, easy to read, and appealing"). Every variant is the
owner-approved Steps Flow card rebuilt by the shared composer
(`scripts/_steps_composer.mjs`) from parts the owner already approved: a claim
from the claim bank, a badge from the badge bank that repeats no word of it, a
type pair from the owner's approved faces, a factory phone photo, a ground
from the photographs that show no older iPhone, and a look from the studio's
own. The engine chooses (rule 75):
- **A voice** bundles a type pair, the plate and CTA shapes that suit it and
  its looks; the accent is the voice's colour across the wheel from the
  photograph, lifted until the number reads 7:1.
- **Bright colour in the letters wants a dark ground.** Gradients and patterns
  read 2-3:1 on light and mid photographs; a mid photograph under such a look
  is dimmed by a heavier shade. Solid and Signature (the line's own tone) read
  anywhere; glow and 3-D only on dark grounds.
- **A face is measured before it is planned.** Its caps must reach 10% of the
  card (rule 68) on every claim it is given, with the badge fitting beside the
  second line; its figures must set the number at the audit's size in the CTA
  it is given, or the number goes to the support face (still two faces). Two
  voices (Luckiest Guy, Bricolage Grotesque) could not set the number in any
  CTA and are not on the board; their pairs stay in the studio.
- **The look is part of the layout.** The claim is spaced for its letters as
  they will be seen: an outline's width is added to the line gap, the badge
  hangs from the outlined cap line and clears the outlined line, a 3-D depth
  is added under the first line. An inset CTA card or pill keeps its outline
  inside the guides and the phone stands on its top edge.
- **Measured the way the audit measures.** After composing, the painted card
  is measured as the audit does (ink over 90 alpha, the look applied) and the
  badge, numerals and step rows are set right to the pixel. In 3:4 and 9:16 the
  list grows about its corner and drawn letters do not land where their metrics
  scale to (a row centred to the pixel came out 37/35 in 3:4, 38/34 in 9:16), so
  after it grows each plate's numeral and words are centred again by what is
  drawn (`centreRowsSeen`).
- **The claim is spelled as the owner writes it.** "iPHONE" has a lowercase
  i and "#1" has a one. A caps-only face has no lowercase, so its "i" is a
  capital and the claim read "IPHONE" (Bangers, Permanent Marker, Bungee,
  Luckiest Guy); a face whose 1 is a bare bar set "#1" as "#I" (Squada One).
  `faceGlyphs` measures the glyphs themselves (the i has a dot above a gap;
  the 1 differs from the I by at least a fifth of their ink), the planner
  gives a face only the claims it can spell, and the audit fails a claim
  whose face cannot (rule 71). The Comic voice is set in Knewave and the
  Marker voice in Sedgwick Ave Display, both from the approved list; Marker
  sets the number in its support face (Sedgwick's 9 reads as a g), and so
  does Stencil, now paired with Barlow Condensed (the stencil's 4 left its
  bridge as a stray dot: "4·994").
- **Easy to read beats a clever look.** Camo is not on the board: its four
  fixed military darks are the dark ground's own, and the letters dissolved
  into it (the contrast measure passed it on its light patches). A ground
  whose printed letters sit behind the claim (the open MacBook, its keys and
  ruler) is not used: words behind words.
- **The letters themselves must read.** The claim's contrast (4.5:1) is the
  upper quartile of every pixel a line changes, and a black claim on a bright
  mosaic passed it on the light tiles while a quarter of its letters vanished
  into the dark ones. `fillLegibility` holds each line's fill against the
  ground under it: no more than 5% of the letters may dissolve (under 1.5:1 in
  lightness and under 0.12 apart in colour, OKLab), unless an outline draws the
  letters at 4.5:1 off the fill. Colour counts: a saturated pink on grey reads
  at 1.5:1 in lightness and loses nothing. The audit enforces it on every card
  (rule 54).
- **Only a 100% card ships.** Each variant is audited by
  `scripts/audit_card.mjs` in the gallery painter, Easy Mode square, 3:4 and
  9:16, and the video. The board takes the voices in turn, each in the
  planner's balanced order, so a voice whose cards fail more often is not
  crowded out, and shows each card at 800px painted from its audited record.
- **Then every kept card is looked at.** The audit is the floor, not the
  review: all 500 are seen in contact sheets, and at full size wherever one
  looks weak, as the owner would see them. What a reader should not be shown
  is left out and named in the script (`REVIEW_OUT_GROUNDS`, `REVIEW_OUT_CARDS`):
  the MacBook lid, whose black Apple logo sat behind the first plates' words
  with grass at both edges, and a stencil claim whose breaks were lost in the
  bills behind it. The next passing card of the same voice takes the place.

## 90. A colour theme owns the whole card, and answers for every line it repaints

Added 2026-09-29 on the colour-theme branch as rule 79 (numbered 90 here,
after the rules 79-89 merged before it; its references follow). The owner, on Easy Mode's colour themes, backgrounds and effects:
"make sure we build all features to be completely relevant or at least make
them work to redesign the theme."

Measured before, through the real controls (`scripts/ez_theme_audit.mjs`: the
first live card of each layout, four classics and the owner's screenshot card;
every theme; the grounds under a light theme and a dark one, and with no theme
where a build has a way back to it; blur, the overlays and the patterns; ORIG,
the chip and the swatches), on the live build (26037de3): 1148 problems over
20 cards and 21 themes. Every theme left every plate that carries words in the
card's old colour (420 of 420 card-and-theme pairs; 48 such plates across the
sample), 378 pairs left the card's own accent or support colour beside the
theme's, and 32 changed under 1% of the picture (slabPoster nothing at all
under any theme). 176 pairs took 425 lines under the gate or under 3:1, and
the grounds under Gold Offer and Cash Green 125 more. Blur stayed live over a
flat colour and did nothing on all 20 cards, and did nothing on the photograph
of 4 (it replaced the photograph's own blur). Shade laid a white veil over
Sell Your iPhone's and the KBB card's dark photographs and failed their
headlines. No card had a way back from a theme; the lit chip and the drawing
disagreed after a template switch; the six swatches ignored the theme.

The cause was a rule doing its job too narrowly. Rule 51 left a line on a
plate alone because the plate, not the theme, owns its contrast, and nothing
repainted a plate. On the 403 live cards the phone number stands on a plate
on all 403 and the CTA on 180 of 239, so a theme never reached the number,
and every ribbon, pill, frame and icon kept the card's old accent beside the
theme's new one. The lines it did repaint were given the theme's colour for
the theme's own ground while they stood on the photograph.

The rule:

- **The theme owns the colour, so it answers for the contrast.** Rule 51's
  reason stands: whoever paints a plate owns the lines on it. So the theme
  paints the plates: each takes the job its colour had in the card's own
  palette (the showcase row's c1, accent and support; read off the scene for a
  classic): the accent's plates take the theme's accent, the support's its
  support (or its ink where it has none), every other plate, the card's ground
  colour and the paper and smoke panels, the theme's ground. Solid (rule 45),
  opaque where it carries dark ink (rule 21), 1.3:1 apart from what it stands
  on, a plate on a plate a step from its host.
- **Marks keep their job and stay seen.** Ribbons, rules, frames, icons, dots
  and sheens take their job's theme colour at their own opacity; black and
  white stay neutral; a mark keeps 2:1 against what it is drawn on (a tick on
  a disc the theme darkened was dark on dark).
- **Every line is solved on its own pixels.** It starts from its job's colour
  (the accent, the support, or the theme's reading colours: its ink, or its
  ground where the ink sits on the wrong side of what the line stands on) and
  only its lightness moves (rule 31) until three quarters of what is behind it
  gives 4.5:1, or as far as its side allows. A line that read on most of its
  photograph keeps its side (light stays light) so the shade and the outline
  under it still serve it (rules 56, 62); a line on a coloured plate takes
  whichever reading colour reads best there. "What is behind it" is the card
  with every word hidden: a spec list that crosses a smoke panel and the edge
  of a paper band is measured on both.
- **The measure of a mixed ground is its majority.** The worst of the ground's
  darkest and lightest tenth solved that spec list to #6f6f6f, equally poor on
  both; three quarters of the ground is the measure (`thWorst`), and it is the
  question the gate's core asks of the line itself (rule 87).
- **The photograph keeps its colour** (rule 56). The theme's gradient is a
  ground only where rule 86 already allowed a drawn one (a product-led card, or
  a card already on a flat colour); a drawn ground is redrawn in the theme; the
  visitor's photo or ground stays theirs.
- **The chip that is lit is the theme that is drawn.** The theme follows the
  visitor from card to card; ORIG puts the card's own colours back; a colour
  set on a line with ✎ stays theirs until they pick a whole palette.
- **A line keeps its side unless its side cannot read at all.** Held light
  over a mid-tone ground it reached 2.3:1 at best; under 3:1 it goes
  whichever way reads.
- **A line's ring takes the tone its ground is not** (rules 27, 85). When a
  theme or a ground turns a line's ink over, its outline and halo turn over
  with it, neutral and at their own strength. The dark glow of a white
  headline, kept round the dark ink a light theme gave it on a light ground,
  smeared the letters. On a plate, or on a ground with no photograph (it is
  as even as a plate), a ring of the ink's own tone goes and none is turned
  light: a light outline round dark copy on a mid-tone ground counts as part
  of the line and pulled gradientWave's selling points to 2.7:1. A coloured
  outline is design and takes its job's colour.
  A see-through backing behind a line (a chip's 0.12 tint) is judged like any
  see-through panel: neutral, the tone the ink is not. The card's old green
  stayed behind a light theme's dark chips.
- **The six swatches are the theme's.** Beside ORIG they were six fixed
  colours from before the themes: Gold Offer's cream card was offered a
  magenta ground. With a theme on, they are its palette (rule 86), on its own
  side of the ink and well clear of it:
  - its ground, as a gradient and as a solid;
  - its accent and support colour, deep under light ink, pale under dark;
  - a neutral;
  - the ground into the support colour.
  Fitted only to 6:1, as "More grounds" is, the support colour under dark
  ink came out mid-tone (0.35), where a headline crossing the card's smoke
  panel read neither light nor dark. A swatch picked under one theme becomes
  the same swatch of the next, and it leaves with the theme. With no theme,
  the six classics stay. The lit swatch is found by value: a draft restored
  from storage lit "custom" instead.
- **The copy follows the ground the visitor picks, theme or none.** With no
  theme, a quick swatch or a custom colour changed the ground and nothing
  else: Sell Your iPhone's orange IPHONE read 2.2:1 on the amber swatch, and
  its white headline 1.7:1. On a flat or drawn ground the visitor chose (not
  a photograph, where the shade does this, rule 62), a reading line standing
  on it that falls under 4.5:1 moves its lightness until it reads (rule 31).
  A gradient's stops move together, to the side that reads. A line on a
  plate is left alone (rule 51), and so is a colour set with ✎. A
  see-through plate keeps what the eye saw (rule 52): scriptRetro's smoke
  panel at 0.62 was near-black on its photograph and mid-grey on a white
  swatch (its items 2.3:1), so it thickens in its own colour until its copy
  reads (0.86, 5.8:1), up to solid. A see-through backing is dropped: it
  calms a photograph, and on a flat colour it only sat round the letters as
  a faint box (bandKnockout's chips read 2.6:1 with it, 7:1 without).
- **The overlay is shade in the tone the copy needs** (rules 62, 85, 87).
  Shade, Fade ↓ and Fade ↑ counted every critical line in the template's
  record, including the number on its paper band. So on Sell Your iPhone,
  Shade laid a white veil (0.34) over a dark photograph under white
  headlines. The tone is now set twice. Before the copy is solved it comes
  from the ground: paper over a light ground, dark over the rest. Once the
  lines are drawn it is confirmed from those standing on the photograph:
  dark when any is light ink or none stands there, paper only when all are
  dark. Solved against a dark provisional shade, a light theme's headline had
  been held light on a ground the shade made mid-tone. In the editor the
  overlay sits above the ground; sent to the back, it vanished under a drawn
  or flat ground's rect.
- **A control with nothing to act on says so, and a lit swatch is what is
  drawn.** Blur adds to the photograph's own blur (it replaced it: a card
  designed at 14px went sharp at the slider's first step and only passed its
  own blur at step 10); over a flat colour, or before a background is picked,
  it is switched off with the reason under it. ORIG lights only when the
  template's photograph is really drawn, not over the grey placeholder.
- **One measure** (rule 87): the passes are built on `pgRgb`, `pgLum`, `pgCr`
  and `pgPlateUnder`; their only finder of their own answers what a mark is
  drawn on, which is not a line.
- **The audit presses the real controls, one card at a time.** Each card
  opens in a fresh browser context, because the studio keeps the visitor's
  draft in localStorage. A page sharing the previous card's storage started
  with Shade already on, and then measured Shade as "changing nothing".
  Measurement waits for the card's own photograph: a classic's arrives in
  the second preload wave, and before it every effect "changed nothing" on
  the fallback gradient. Patterns are measured at full size, since a
  quarter-size render blurs a 1.5px grid away.

After, on this branch with the same audit: no problems over the same 20 cards
and 21 themes, and no page errors. Themes change 3.5 to 100% of the picture
(the screenshot card 77.9 to 88.3%). The grounds pass with no theme, under
Gold Offer and under Cash Green. Blur works on every photograph and says why
it is off over a flat colour. Every overlay and pattern changes the picture,
and Shade passes the gate. ORIG restores every colour. The chip follows the
drawing, and the swatches follow the theme. A theme adds nothing measurable to
Sell Your iPhone's preview and about 60ms to bandKnockout's photographed one
(123 to 182ms: three renders of what is behind the words).

## 91. Copy is never under a shape, and the gate says so

Added 2026-09-29 on the live branch as rule 68 (numbered 91 here, after the
rules 89 and 90 merged before it). The owner, on Rush Hour in Easy Mode: "this sucks". Its
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
  outlines). Invisible is either measure: under 1.2% of its box inked, or its
  letters under 1.2:1 on what is under them. The second was added when the
  lines were merged (2026-09-30): measured whole, st_cars_cashfor's claim,
  inked the colour of its plate, read 1.09:1 with 4.6% of its box changed,
  and the share alone would have offered it again.
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

**Widened 2026-09-30 (a visual audit of all 226 offered classics).** The owner:
"keep updating and auditing the bad ones". Looking at every card found what
the gate still passed, nearly all on the designer layouts (dl_):

- **Wholly on a plate or wholly off it.** A line with 8% to 92% of its letters
  on a solid plate beneath it fails 'straddle' (a CTA label on the number
  plate's border, a list running under it, a headline past its panel). Only
  the plate a line sits on counts: a number on its pill that crosses a panel
  is on its pill.
- **Lines never touch.** Letters overlapping another line's, or two lines side
  by side on a row with no gap, fail 'collide' ("WE BUY" into the number).
- **Each line of a text is judged on its own**, so a covered last line of a
  two-line block is not averaged away ("MARKET RATES" under the pill).
- **Settled after the layout** (`pgUncover`): the line slides the shortest
  clear way, fully onto the plate it straddles or fully off, or shrinks toward
  its plate (never under 72%); the number never moves.
- **Plates stay inside the guides** unless attached to an edge: a plate the
  layout padded past them (a 1053px neon frame) comes back if its words fit.
- **Plates that carry words do not overlap part-way**: a number plate grown
  over the last step card gives the overlap back.
- **A designer layout's item list stays one line**; stacked, it became a tiny
  column under the number's plate on 30-odd cards.

## 92. A hairline serif does not carry a headline over a photograph

Added 2026-09-30 on the live branch as rule 69 (numbered 92 here, after the
lines were merged). The same audit: "CASH FOR GOLD" in Melodrama, the
high-contrast serif, over the gold-jewellery photographs read as texture, its
hairlines lost in the chains, gold on gold. The gate could not tell it from a
readable card (core contrast 4.3 to 5.0 on both). Over a photograph a
headline in Melodrama is set in Zodiak, the editorial serif, whose strokes
hold; so is any Melodrama line under 60px ("GET A FREE QUOTE" on a white
plate), where its hairlines are gone on any ground. On a plain ground at size
Melodrama keeps its voice.

And a dark glow behind dark type (the knockout headlines on bright bands) is
removed after the layout: a halo takes the tone of the ground (rule 27), and a
dark one behind dark letters is a smudge.

**One serif to a card** (2026-09-30, on the merged engine). Swapping only some
lines set Zodiak beside Melodrama on twelve cards, a third family that the
template audit holds back (rule 81). So the swap is made for the card: when
the headline over a photograph moves to Zodiak, every Melodrama line on it
moves too, the number included; a small Melodrama line on a card that keeps
Melodrama takes the face the card's other copy is set in. A table that sets a
face after load (assets/number-fix.json) is re-baked for the cards this pass
changes, or it puts the old face back.

## 93. The designer speaks the house language: Easy Mode's controls, on the live canvas

Added 2026-09-30 on the designer branch (claude/eloquent-euler-7jvzfd), whose
code called it 80 and then 91; numbered 93 here, where the live branch's rules
took 91 and 92 first. The owner: "audit and make sure the
designer page looks updated FOR ALL NEW FEATURES / DESIGN LANGUAGE". The
designer is the advanced editor ("Advanced editor →", "Fine-tune in advanced
editor").

Audited against Easy Mode, it was a generation behind:
- no colour themes (rule 90), and a theme brought over from Easy Mode could be
  neither changed nor taken off;
- its Backgrounds tab offered ten fixed-colour procedural backdrops from before
  the themes (red and gold beams, money bokeh, orange energy, purple pulse, a
  tech grid) and none of rule 86's grounds;
- Quick edit's Background was three raw colour pickers;
- no blur, no shade, no pattern;
- the Templates tab listed the 243 classics and none of the 399 library cards
  the landing page leads with;
- changing the ground left the copy where it was.

Measured on the live build (26037de3) by `scripts/designer_audit.mjs`
(below), on six cards: 23 problems. The cards are four classics (Sell Your
iPhone, the gold spot, KBB and the Pokémon binder) and two library cards (the
owner's Reef lower third and bandKnockout).
- On all six, no theme, swatch or ground control.
- On all six, the page froze once the designer opened: its longest task ran
  0.8 to 1.1s, and 10.2 to 11.3 of the first 12 seconds were blocked.
- On five, the hand-off moved copy from where Easy Mode had put it. Sell Your
  iPhone's product list was 937px wide in Easy Mode and 811 in the designer;
  bandKnockout's knockout band went from 950 to 449.

The rule:

- **One system, not a copy.** The designer's controls call the functions Easy
  Mode calls, on the designer's live canvas and its own card (currentTplId):
  - themeScene for the themes;
  - ezPresetSpecs for the six swatches;
  - ezGroundSpecs for every kind of ground;
  - ezOverlayFill, ezOverlayPre and ezOverlayFit for the overlay and its tone;
  - GROUNDS.overlay for the patterns;
  - ezCopyFollowsGround for the copy on a flat ground.
  A new colour or ground feature lands in both, or it is not done.
- **One pass, from the originals.** Every colour decision goes through
  edRecolour: a theme picked, a ground changed, an effect changed.
  - Each object remembers the paint it had before any theme (pgOrig). It is
    saved with it (EXTRA_PROPS), so undo, drafts and saved templates keep it.
  - The pass is made again from the originals, so themes never compound, and
    ORIG puts back exactly the card it started from.
  - The originals are copies. A gradient's colour stops are objects that
    fabric shares between the gradient, its toObject() and a gradient made
    from it, and two passes turn a stop's colour in place (themeScene's
    marks, ezCopyFollowsGround). Shared, they turned the saved original too.
    KBB's gradient headline, flipped dark on a light swatch, came back dark
    on its photograph at ORIG (1.1:1), and the next photograph's shade was
    solved for it.
  - A colour the visitor sets by hand after a pass is theirs (pgUser). It
    stays through a ground or an effect, and a whole palette takes it back,
    as in Easy Mode.
  - The theme drawn is written on the objects (pgTheme), so the chip that is
    lit is the theme that is drawn, through undo too.
- **The theme follows the visitor.** It follows from Easy Mode into the
  designer, from card to card inside it, and through Enhance (which restores
  each layer's own styling, then draws the theme again).
- **Grounds are the card's, or its theme's** (rule 86).
  - Quick edit carries ORIG and the six swatches (the theme's when a theme is
    on).
  - Backgrounds carries every kind of ground: photos, blurred photos, solid,
    gradient, sunburst, pattern and texture, each painted in the card's
    palette or its theme's.
  - The ten fixed-colour backdrops are retired, from the community gallery
    too.
  - "Remove photo" leaves the card's own ground colour. Before, it left the
    canvas bare.
- **A photograph the visitor picks is shaded until the copy reads**, as the
  gate would shade it at export (rules 62, 66): bands where the copy stands,
  dark under light ink and paper under dark, stepped up to 0.7. The canvas
  being designed is the ad that exports. The card's own photograph (already
  solved in the library) and a flat ground (the copy follows it) take none.
- **Effects, in Easy Mode's layer order**: ground, shade, pattern, overlay,
  then the card.
  - Blur adds to a photograph's own blur, and is switched off, with its
    reason, over a flat colour.
  - Shade, Fade ↓ and Fade ↑ take the tone the copy needs.
  - The patterns and their light tone draw over any ground.
- **The library is in the Templates tab.** The category's library cards open
  in the designer as real templates, registered by scRegister, which Easy
  Mode's openShowcase now shares.
- **A card is drawn in its own faces from its first render.** scRegister
  loads every weight the card sets, not only the family. ensureFont loads
  the face nearest 400, and Big Shoulders Display comes only in 600 and 700.
  Its 700, on 66 of the 399 live cards, could be measured in a fallback at
  the card's first render, depending on when the face arrived. The Reef
  lower third's WE BUY came out 258px wide in Easy Mode and 156 in its own
  face, so the designer, opened later, disagreed with what Easy Mode had
  drawn.
- **The hand-off lays the visitor's words out once.** Easy Mode lays out fresh
  layers once. The designer laid out the template's own words, then laid the
  visitor's out a second time over objects already fitted. The second layout
  compounded: on Sell Your iPhone the product list came out at 0.81 of its
  size (Easy Mode: 0.935), and the call to action rose 34px onto it. Every
  card with a textbox disagreed. The designer now rebuilds the layers before
  the visitor's words go in.
- **Undo carries the ground.** The history keeps the ground's description with
  the canvas, so undoing a ground puts back its controls (the blur slider, the
  lit swatch) as well as its pixels.
- **A pattern is saved as its recipe.** Its kind and tone are saved, not its
  pixels, and it is drawn again after any load. Saved as a 1080px PNG, film
  grain was 911KB in every undo step and in the draft, enough to overrun the
  browser's storage beside a photograph. An undo step with it now saves 61KB.
- **The page answers while it settles.** Thumbnails render one at a time, in
  the browser's idle time, with a breath between two. Only the category on
  screen and the thumbnails a grid is waiting for are rendered, and a grid
  shows a card's placeholder until its picture is ready (lazyThumb).
  - Before, all 243 rendered six at a time, 60ms apart, for about twenty
    seconds after the designer opened. The canvas did not paint in that time
    and every click waited.
  - Easy Mode's strip was rebuilt behind the designer at every photograph
    that arrived, which held it up to half a second each time.
  - The landing page loads in 2.7s on a laptop and 7.9s on a phone (it was
    7.7s and 17.9s).
- **A late photograph is drawn.** A classic's photograph that arrives after
  its card opened in the designer is drawn in place, and the colours are
  solved again on it.

Measured by `scripts/designer_audit.mjs` (exit 1 on any problem), through the
real panel, each card in a fresh browser context, and only on the card asked
for. The first runs of it measured Sell Your iPhone twice. The owner's Reef
lower third is stamped out of the library (defect:school), so it did not
open, and the card still on screen was measured under its name. A card that
does not open is now a problem, and a retired card opens from its row, as
the Easy Mode audit opens it. It covers:
- the page settling after the designer opens;
- the hand-off;
- every theme and ORIG;
- the six swatches with no theme, a light theme and a dark one, and ORIG
  after them;
- the first two of every kind of ground;
- blur, each overlay, each pattern and its tone;
- undo;
- the library.

After, with the same audit on this branch: no problems over the six cards,
and no page errors.
- The page answers once the designer opens: its longest task runs 82 to
  149ms, and 0.45 to 1.2 of the first 12 seconds are blocked.
- The hand-off puts every box within 3px of where Easy Mode drew it.
- Every theme changes every card (19.7 to 88.3% of the picture). ORIG puts
  the card back exactly, after the themes and after the swatches.
- The swatches, the grounds, blur, the overlays and the patterns each change
  the picture and fail no line. Undo puts the ground back. The library lists
  the category's cards, and one opens.

Easy Mode's audit (rule 90) still reads no problems over its 20 cards and 21
themes.

Kept from the merge of the lines (2026-09-30):
- **The tagline look goes on after the colours** (rule 83): the pass takes a
  look off, recolours, and puts it back on in the theme's palette, so a theme
  picked in the editor never overpaints a look (added when the lines were
  merged, 2026-09-30).

## 94. A product shows whole or not at all

Added 2026-09-30 on the live branch (numbered 94 when the lines were
merged; the designer took 93). The owner, of voltStack-pp02-15 ("WE BUY CARS"): "This one
looks like little ghosts of cars." Six car cut-outs at 16% over the blurred
photograph: a product WALL, which rule 59 had removed from the four glass
cards only. 35 more live cards (165 ghosts, from retheme_lab's assortment
pass, 16% on light grounds and 26% on dark) and 18 retired ones still carried
one.

- **A picture of the goods is shown at strength or left out.** At a sixth of
  its strength over a photograph it is not texture; it reads as a ghost or a
  stain, and it competes with the photograph that is the ground.
- The records lose their walls; the generator no longer draws one; after the
  layout any wall a saved design still carries comes out
  (`pgGhostWallStrip`); and the gate fails a product picture drawn under 60%
  opacity (`ghostPic`).
- Where a card had its own hero product, the wall had been crowding it out of
  the layout; with the wall gone it shows (a chain on the gold checklists, the
  strip fan on the steps cards).

## 95. One colour to a card

Added 2026-09-30. The owner, of voltStack-pp02-15 ("WE BUY CARS": a dark
green ribbon, a white panel and a pink number plate over a brown
photograph): "there's green white and pink boxes on there and they should all
be a unified color gradient theme outline whatever it needs to have
cohesiveness. This is a bit random and literally looks like we chose a
randomizer." Measured: 86 of the 415 live cards drew their boxes in two
unrelated hues, and 282 carried a second hue somewhere (a box, an outline, a
mark, a coloured word, a glow). The palettes are pairs ("Emerald & Blush",
"Jade & Tangerine"); the layouts gave one box the accent, another the support
and a third the palette's tinted ink.

- **A card's colour is one hue.** Boxes, outlines and frames, marks, coloured
  words and glows are that hue in lighter and darker shades; paper, smoke,
  black and white stay neutral (rule 85). Within 30 degrees of the card's hue
  is the same colour.
- **The hue is what the card already leads with**: the headline's colour when
  the headline is in colour (a tinted white does not lead); else the colour
  covering most of the card. A card that says GOLD keeps its gold where it
  has gold.
- **Anything else takes that hue at its own luminance**, so every line keeps
  its exact contrast: a dark green ribbon on a pink card becomes a deep
  raspberry, a salmon number box on a blue card a light blue.
- It runs after the layout, after a theme, after a tagline look and after the
  copy follows a flat ground (`pgOneHue`); a colour the visitor set by hand
  (pgUser, the pencil in Easy Mode) is theirs. The gate fails a card left
  with a colour outside its hue ('hues').

> Supersedes the second hue of rule 63 and rule 90's support plates: the
> support colour of a palette becomes a shade of the one hue, not a second
> colour.

## 96. The studio's own chrome is graphite and one blue

Added 2026-09-30. The owner: "fix the purple UI theme it's kinda lame pick
something unanimously people think looks clean and cohesive and redesign site
UI / theme / webkit / color elements." The default look was graphite with an
orchid accent, a pink second hue and a mint ring, and twenty large bokeh discs
in all three behind every page: three colours in the chrome, the randomness
rule 95 removes from the cards.

- **Neutral greys** (the system greys people know from their phones: ground
  #0d0d0f, surfaces #161618 and #1e1e21, ink #f5f5f7, #c7c7cc, #8e8e93; light:
  #f5f5f7, white, #1d1d1f, #424245, #6e6e73).
- **One colour, blue**: #0a84ff on dark, #0066cc on light, in the accent, the
  focus ring, the glow and AI (which was violet). Filled controls carry white
  words: a selected chip on the deeper blue (#0064d2, 5.6:1; light #0055b3,
  7.1:1), a button on a blue that deepens to it (about 4.5:1 at the words).
- **A quiet field**: the bokeh keeps its shape at a third of its strength and
  in the one blue; no second or third hue.
- Native controls, scrollbars, selection, the favicon, the 404 and the
  information pages follow the same tokens. The other looks stay reachable by
  URL (?look=); the house default is graphite and blue.

## 97. A video ad is made for someone, speaks in a voice that suits them, and always has sound

Added 2026-09-30, written as 94; numbered 97 when merged with the live branch
(claude/fervent-pascal-w6mthe), whose rules 94 to 96 were live first. The owner: "make sure we have more variety styles and a
wider pool or base of ideas / knowledge to produce our video ads to appeal to
any demographic or type of person ... make some talk with 11 labs voices",
and "make the voices clean and vary by theme mood attitude etc."

**An audience is written down before a word is.** `motion/audiences.js` holds
sixteen: upgraders, students, parents, seniors, busy professionals, deal
seekers, Spanish-speaking families, drivers and gig workers, the eco-minded,
businesses and bulk, gamers and Gen Z, premium owners, cracked or broken
phones, movers and declutterers, the holiday season, hometown locals. Each
has who they are, the insight its words are built on, and what to avoid. From
that it draws:
- its looks (the vibes, music kits, tempo, colour grade, openings, overlays
  and urgency that suit it);
- its words on screen, in English and Spanish;
- its speakers and moods, and its voiceover scripts.

Picking an audience in the maker ("Made for") turns the whole ad to it: the
look, the words, the music and the voice. A shuffle draws an audience about
four times in five. It never draws one whose words state a service not every
buyer offers (bulk lots, cracked phones); the maker's user picks those, and
so says it.

**Fourteen looks that are not LA signs** join the fourteen that are: clean
tech, luxury noir, family warm, campus, gamer RGB, eco green, breaking news,
pro office, clear and simple, holiday, repair bench, Y2K pop, mercado bright
and game day. Each is a pool of the catalog's own palettes, grounds, faces,
treatments, number styles and entrances. A look can name its openings. Each
pool is measured, and what fails comes out (audit-sweep, 30 looks each):
- **Dark looks** (luxury noir, gamer RGB, repair bench, game day) open on their
  words or a punch-in, never on black glass over a black ground.
- **Flat and bright looks** (breaking news, pro office, holiday, campus) do not
  open on a crash zoom, whose first frame is nearly empty ground. Clear and
  simple opens calmly (its line, a cold open or a punch-in).
- **Out on contrast:** the cutout treatment (it fails contrast 4 times in 6),
  the rings ground (3 in 6), the highlighter from eco green and family warm,
  and the box treatment from pro office. Glass leaves gamer RGB, and the dots
  ground leaves family warm.
- **No designed look carries a palette under 3:1**, ink on ground (studio,
  blush, soft pink, coral). The look made for older eyes (clear and simple)
  carries only palettes of 9:1 or more. It had sky, white on mid-blue at
  2.4:1.
- **Neon stays** in gamer RGB: its contrast misses are the neon tube, which the
  house's neon motel shares (0.80 both).

**Every line keeps the house copy rules** (rule 80, `scripts/refresh_copy.mjs`):
no price, deadline, rank, clock, named company, licence, rating or long dash,
no promise about who answers. No line is longer than the house's own longest
line of its kind. A voiceover never reads out a number; it points at it ("the
number on your screen"), so one bank of takes serves every user.
`scripts/audience_check.mjs` holds every line, every look reference and every
script's length to this, and exits non-zero on any miss.

**The voices.** `motion/voices.js` has eleven moods and seventeen speakers.
A mood is how a line is read: hype, playful, warm, calm, confident, luxe,
street, sincere, newsy, festive, reassuring. It is the ElevenLabs voice
settings: stability, style and speed. A speaker (a cast) is a kind of
person: a crisp presenter, a social host, a streamer, a warm neighbour, a
trusted elder, a calm guide, a street local, a vecina and a vecino, an
announcer, a luxe voice. Each is played by one of a few ElevenLabs voices in
order. A Spanish line first looks for a Spanish-labelled voice in the
account.

`scripts/voice_bank.mjs` records every script twice, by two speakers, and
across an audience's scripts every speaker is heard in every mood. That is
180 takes and 10,414 characters on eleven_multilingual_v2 (`--full`: 546
and 31,472). The takes go to `motion/voice/<audience>/`, with their length
and word timings in `motion/voice/manifest.json`. The key is read from
`ELEVENLABS_API_KEY` or the repo's gitignored `.env`, and is sent only to
api.elevenlabs.io. The page sends nothing anywhere.

**A take fits its ad.** Speech starts at 0.3 s, after the opening hit has
decayed, and ends at least 0.5 s before the end. A take longer than the ad's
room (4.2, 5.2 or 7.2 s) is never picked for it. Every audience has a script
that fits the 5-second ad in each language.

**Clean** (`motion/audio.js`), each take:
- one channel, with no offset;
- the silence either end trimmed (below -45 dB, keeping 30 ms before the first
  word and 80 ms after the last);
- rumble cut at 85 Hz, a little mud out at 250 Hz, a little presence in at
  3.2 kHz, the esses eased at 6.8 kHz, and a gentle compressor;
- the words levelled to -14 dBFS RMS, every peak under -2.5 dBFS by a
  look-ahead limiter, and 10 ms fades.

It joins the mix after the master compressor, whose automatic make-up gain
would otherwise lift the bed back up under it. Under the voice, the music
drops 7 dB and then the whole bed another 9. The bed ramps down 80 ms before
the first word and back up over 150 ms after the last. A voiced mix is
brought down just enough never to peak over -1 dBFS.

Measured (`scripts/motion_sound_check.mjs`, over house, trap, minimal and
drumline, two runs on two looks):
- the voice sits 4.6 to 6.5 dB over the bed on the whole line, pauses
  included (about 3 dB more on the words alone);
- the bed ducks 9.0 to 10.4 dB and comes back within 0.2 dB;
- the mix peaks at -1.0 dBFS;
- a voiced mix is at most 0.74 dB quieter than the same mix without a voice.

An 8-second-only take is not picked for a 5-second ad. The recorded download
carries the voice.

**Every look has sound.** Before this, a cue timed before the first frame threw
inside the mix: a phone already in place when the ad opens, a flash cut
before it. Web Audio cannot schedule in the past, and the throw left the
whole ad silent. It hit 76 of 200 looks on `main`: every flash cut, most
cold opens and punch-ins. The preview and the download were both silent,
and the attention audit hid it, because it skipped its sound check when the
mix failed.

Now:
- a hit timed before the first frame is dropped (it happened before the ad);
- a sweep that builds to a moment after it is heard from the first frame;
- a flash cut opens on one hit at the first frame;
- the audit reads a mix that fails as "no sound".

After: 200 of 200 looks render a mix (seed 1), and every one of the 120 in
`scripts/motion_sound_check.mjs` opens on a hit.

**Long headlines still land inside the first second.** With no opening line to
read first (a cold open, a crash zoom, a punch-in), a headline of three or
four lines staggers its lines closer, so the last starts by 0.6 s. Before,
the last line settled at 1.07 to 1.13 s; two-line headlines are untouched.

Measured, 200 random looks (audit-sweep, seed 1) before and after:

| check | before (`main`) | after |
|---|---|---|
| First frame shows something | 0.98 | 0.975 |
| First frame is not mostly black | 0.99 | 0.98 |
| Movement in the first half second | 1.00 | 1.00 |
| Words on screen by 1 s | 1.00 | 0.995 |
| Headline readable by 2 s | 0.995 | 0.99 |
| Number readable by 3 s | 0.995 | 1.00 |
| Never still for over 0.6 s | 0.995 | 0.995 |
| Headline stands out (3:1) | 0.93 | 0.94 |
| Median headline contrast | 4.7:1 | 5.5:1 |
| Median first-frame coverage | 72% | 93% |
| Looks with sound | 124 of 200 | 200 of 200 |

The two sweeps draw different looks (the catalog is larger), so a
difference of one or two looks is the draw. The misses that are left are
single looks of the kinds the baseline has too. None is a pool: each new
look was swept 30 times on its own until what failed in it was out.

## 98. The studio's chrome is a print shop's: paper, ink and four signal colours

Added 2026-10-01 (numbered 98: the video rule took 97 on main first);
supersedes rule 96's look. The owner, a day after graphite
and one blue: "Blue is all right, but … we need something very cohesive and
super convincing … maybe the overall black background/dark mode theme is not
helping us or maybe we have something in the middle … this is looking very
generic or vibe coded and not fitting for how good the graphics are". Dark
glass, soft bokeh and one glowing accent is what a generated site looks like.
The studio makes posters; its chrome is the wall they are pinned to.

- **Ground**: warm paper (#f2eee4), cards a lighter paper (#fffdf8); ink-black
  type (#141414). Dark mode is the same system on warm ink (#1b1a1f).
- **Line**: an ink outline and a hard offset shadow, a print or a sticker;
  never glass, blur or glow. Buttons press in.
- **Four signal colours, one job each**, matched in strength so they read as
  a set: blue #2b56f5 the action (buttons, links, focus), tomato #ff4a2e heat
  (the hot plan, a kicker), marigold #ffc21a the highlighter (the hero's claim,
  stickers, the closing call), mint #12b886 cash and done (ticks). Colour
  fills shapes; words stay ink, or white on blue (5.6:1), ink on marigold
  (11.4:1), ink on tomato (5.5:1). Blue as text on paper 4.8:1.
- **Rhythm**: a tilted ink ticker of the goods under the hero; the library on
  an ink band, so the ads glow between paper above and below (the "something
  in the middle"); steps and section kickers carry the four colours in turn;
  the mark is the four quartered.
- The other looks stay reachable by URL (?look=); poster is the default. The
  info pages, the video page and the 404 take the same paper and ink.

## 99. A curve or a warp is a property of the line, and a template built round a ring is curved on it

Added 2026-09-30 on the designer branch (claude/eloquent-euler-7jvzfd). The
owner: "ability to make clean warps and curves", "and pre warped / curved for
select templates where the design is supportive or designed around that".

A curved line used to be a fabric.Group of one Text per letter. Each letter
was measured alone (no kerning), spaced by its centre (the feet crowded on an
arch), painted alone (the next letter's outline over this one's fill, a
gradient starting again on every letter) and baked in: Easy Mode set the
visitor's words on the group, where they were never drawn, so the curved
headlines of 87 library cards kept the template's words in the preview, the
download and the video. The looks, the layout and the ink passed a group by.

- **A shape is a property of a text object** (`pgShape {kind, bend}`), saved
  as its recipe and laid out again whenever the text is. The line stays live
  text: typed into, fitted, gated, recoloured, looked, voiced.
- **Curves** (arc, wave) put the letters on a baseline with fabric's own text
  on a path: kerned as the straight line is, spaced along the baseline, every
  outline painted before every fill, one gradient across the line, the
  letters centred on the path (on the baseline, SILVER's letters crowded in a
  smile). Tracking is compensated so a curved word is spaced as it was
  straight. The path's bounds are widened to the letters' own box, so the
  cache, the selection and every measure hold the letters.
- **Warps** (arch, bulge, flag, rise, fan, bowl) draw the straight line through
  an envelope, a device-pixel column at a time, at the canvas's own
  resolution: crisp at any zoom and in any export. The envelope stays inside
  the line's own box (letters shrink, never grow), so a warped line is laid
  out, fitted and gated as it was.
- Bend runs -100..100; the sign turns the shape over. An arc's sweep is the old
  curve slider's (100 = 207 degrees), so a template's `curve` carries over as
  its bend. A saved design's old letter groups are read back as one shaped
  line (`fabric.Group.fromObject`).
- **The controls:** Shape chips and Bend in the designer's Properties panel and
  in the ✎ menu of Easy Mode; the ✎ menu shows the template's own shape.
- **A curve is bound to its ring.** A template designed round a circle names
  the ring its arc belongs to (`TS_RINGS`): the arc's radius is the ring's, its
  apex sits on the ring's top, in every format and after every layout pass
  (the layout never moves a curved line off its ring; pgUncover leaves it). A
  long word on a small ring is flattened (a larger radius, the sweep and the
  sagitta capped) or brought down in size, whichever the design is built on:
  arcCrown's crown flattens round its halo, karatSeal's legend shrinks to its
  seal.
- **Pre-curved templates:** the arcCrown family (the crown over the halo ring)
  and the karatSeal family, which gained a curved legend on its seal's outer
  ring; the library's curved headlines are live again. A tagline look can
  take a curved line (its depth copies curve with it); a colour block cannot
  (a block is a straight plate), and says so.

## 100. The owner's type pairs are a choice for the whole card; a classic sets two faces

Added 2026-09-30 on the designer branch. The owner: "new typefaces / text
design". The owner approved 56 faces (2026-09-01) and FONT_PAIRS pairs them by
voice (rule 70: one display face, one reading face), but nothing used the
pairs: the classics kept the five house faces, and the only way to a new face
was one line at a time from the ✎ menu.

- **A voice is a choice for the whole card**, as a colour theme is: eighteen
  pairs (Street, Bold, Stadium, Sport, Tech, Block, Arcade, Squad, Comic,
  Marker, Retro, Pop, Luxe, Modern, Warp, Stencil, Grotesk, Serif), and ORIG,
  the card's own faces. In Easy Mode under the colour themes, in the designer
  under its colour theme.
- The claim, the price and the number take the display face at its weight
  (the number the reading face where the display face's figures are weak:
  Sedgwick's 9 reads as a g, the stencil's 4 leaves a stray dot); the call to
  action, kicker, badges and offer the reading face's label weight; the lists
  and the website its line weight. A line given a face with ✎ keeps it.
- The faces load, every weight, before the card is drawn.
- **Each line keeps its footprint:** no wider than the card's own face set it
  (a wider face comes down in size, a narrower one keeps its size), then the
  layout lays the card out in it. Fitted to the card's width instead,
  Unbounded's number grew its plate off the card.
- **A read line keeps its weight.** A label or a list line takes the
  heaviest of the voice's weight, the house floor for its role and size
  (`WEIGHT_FLOOR`: 700 for badges, the call to action and the website, 600
  for small type) and its own weight on the card, in a cut the family ships
  (read from its @font-face rules). In the reading face's own 500,
  trustSeal-gl02-15's items line fell under 3:1 in 17 of the 18 voices. The
  claim, the price and the number keep the voice's display weight: that is
  the voice.
- In the designer each line remembers the face it had (`pgVoiceOrig`, saved
  with it): ORIG puts it back, and voices never compound.
- **Two faces on every classic** (rule 70 made true at load,
  `houseTwoFaces`). 33 of the 50 hand-built classics set three families, and
  the template audit (rule 81) held every one back. Each keeps its display
  face (its biggest headline's) and one reading face (of the others, the one
  carrying the most text); every other line takes the display face if it is a
  headline, the number, a price or a mark, the reading face if it is read.
  Weights snap to what the family ships. It runs last at load and again when
  the number table lands (a table applied after a face pass undoes it).

## 101. Every choice a card offers is one it passed

Added 2026-09-30 on the designer branch. The owner: "make sure all classic and
current themes are audited and ready for use with new color schemes, new
design language, new typefaces / text design". The audits each covered a
slice: the gate judged every card on its thumbnail, ez_theme_audit took the
themes through a 20-card sample whose four classics were held, tagline_audit
took the looks through 82 cards by its own measure. No classic had a colour
theme audited, and no library card was gated on the render a visitor gets.

- **scripts/every_card_audit.mjs** takes every offered classic and every live
  library card through Easy Mode's own render, on the card's own photograph,
  each in a fresh browser: the card as offered, then every colour theme (21),
  tagline look (12) and type voice (18). A choice fails a card when a critical
  line newly fails the gate, another reading line newly reads under 3:1, or
  (a voice) a line newly runs off the card, off its plate or into another
  line; a theme also fails when a plate keeps the card's old colour, the
  card's own colours stay beside the theme's, or a mark vanishes on what it
  sits on.
- **Choice holds.** `--write-holds` writes the choices that fail each card to
  assets/choice-holds.json, with the reason in words. On that card their chip
  is off and its title says why, in Easy Mode and in the designer; a pick
  carried over from another card is set aside there (the card shows its own,
  and a note says why) and comes back on the next card it suits, unless the
  visitor picks again in that row. A card that fails as offered is out of
  every list, like a classic the gate holds, and neither opens by its id
  (the last card a visitor used, or the default one): the first card on
  offer opens instead. The audit loads the studio with `?nochoiceholds=1`,
  or the chips it must click would be off.
- **A line's backing is its ground.** The gate found a line's footprint by
  painting the card without it; hiding the whole object took its own backing
  with it (a chip's see-through panel, a badge's plate), and every panel pixel
  counted as ink against the bare photograph. dl_gold_duoSplit_gold's kicker,
  dark on a 35% white panel and plainly legible, failed as a ghost under six
  themes; sports_break's badges, pink on their own lavender panel at 1.13:1,
  passed. Only the ink goes now (`pgHideInk`: fill, stroke and shadow made
  clear), in the gate, the template audit and the contrast bake, which also
  measures each line with the card laid out round it (left out, the layout
  settled differently round the gap).
- **A surface keeps its lightness under a theme.** A body the size of a
  surface (over a quarter of the card) is ground, whatever hue it wore, as a
  panel that big already was among the plates: dl_cars_slabPoster_mono's
  frame, a dark red body over 83% of the card, was read as the accent and
  turned Cash Green's bright green at 80% under white type (the number
  2.9:1). It takes the theme's ground hue at its own lightness; its outline
  is still a highlight.
- **A big number does not outrank its headline** (rule 53: the headline at
  least 1.3x the number). number_block.mjs kept any classic's number authored
  at 84px or more as its own design, and 28 hand-built classics, numbers of
  84 to 100px under headlines of 66 to 117px, were held back for their
  hierarchy. Such a number is rebuilt at the cap (0.77x the headline, never
  under 72px), its plate hugging it. agencyGrid failed the same rule by its
  own drawing, a price line 124px under 148px headlines (now 104px). The
  lowerThird cards stay held: the headline shares its rows with the number
  and fits down to 86px beside it (their band's copy is 24px higher, so the
  items line is inside the guide).
- **The offer family is drawn as authored.** No load-time table touches it
  (offer-library.js), so the classics' bakes leave it out: baked with the
  classics on the merged engine, the contrast bake drew 850 rows that would
  have repainted 168 offer cards.

Measured (2026-10-01): 735 cards, 37,485 renders. 16 cards fail as offered
and are held (Sell Your iPhone's device list over its panel, four topstrip
classics, eight scriptRetro and two reviewProof library cards, one arcCrown
at 3.00:1). 2.6% of theme renders fail (most a mark vanishing on what it
sits on, as on the engine before), 0.4% of looks, 11.6% of voices (most a
headline shrunk under the feed tile in a wider face: Modern is off on 379
cards, the condensed pairs on almost none). 314 classics (264 before) and 405
library cards are offered, and every choice offered on each passed.

## 102. The number sits in the middle of a plate it has to itself

Added 2026-10-01 on the library branch (claude/optimistic-edison-xbbk02) as
94; numbered 102 when merged, after rules 94 to 101. The owner, on a scriptRetro card whose number hugged the top
of a full-width bar: "The CTA is not centered so it doesn't look great", then
"Make sure it comes out, clean every single time and properly". That card
passed the gate: offPlate counts letters off the plate, and every letter was
on it. So the gate (pgCheck) now also fails `numCentre`: on a plate no other
line shares, the number's letters must sit within 12% of the plate's middle
as it is seen (clipped to the card), across and down.

Measured on the 415 live cards: the old scriptRetro bars were 22% to 37% off;
six cards still failed (five Neon Night plates 14% to 20% low, one Trust Seal
band 27% high) and `scripts/centre_number.mjs` moved each number until its
letters sat within 3%, kept only where the gate accepted the card. A second
run changes nothing. The scriptRetro bars themselves were rebuilt as pills
(`scripts/hug_number_pill.mjs`).

## 103. Palettes are proven pairings, and a warm colour is never drawn muddy

Added 2026-10-01 on claude/tender-carson-jq5lbr as 95; numbered 103 when merged,
after rules 94 to 102. It supersedes the 25 pairings merged here from
claude/dreamy-knuth-9123rb the same morning (the owner's same request a day
earlier, never deployed); this is the answer to the later message. The owner, on the 29 palettes of 2026-09-22: "the colors
look so strange ... we really want the minimum amount of food names ... less
niche color schemes, and more proven."

**What was strange, measured on the 415 live cards.** Of the 2,713 chromatic
colours in their records, 220 accents and 272 supports are drawn below
luminance 0.2, which no warm hue can hold, and many more between 0.2 and 0.45.
The old guard only swapped hues up to 108° and below 0.2, so a lime or citrus
accent drew as olive (`#757a2c`) and an amber support as mustard (`#9b8301`)
or tan (`#c06f2c`). Light grounds took a 0.048 pastel of whatever the ground hue was
(lilac, blush, pale lime, khaki, greige), and dark reading ink took the
ground's hue at 0.03, so a pink or red palette set its words in brown-black.
Every palette was a triad, so most cards carried a third, unrelated colour.

**The set.** Twelve pairings that ads and brands have run for decades, each
hue measured off a reference colour: Navy & Gold, Navy & Orange, Midnight &
Cyan, Blue & Green, Green & Gold, Purple & Gold, Teal & Orange, Red & Yellow,
and the neutral grounds Black & Gold, Black & Red, Black & Green, Silver &
Blue. Two hue families to a palette: the support is a shade of the ground's
or the accent's family, so a card reads as two colours plus white or black.
Names say the two colours; none is food.

**The rules that make them draw clean** (`scripts/refresh_palettes.mjs`):

- `muddy(H, Y)`: a warm hue has a lightest luminance it can be drawn at and
  still be its colour (orange 0.2, gold and yellow 0.33, yellow-green 0.3,
  lime 0.22, red-orange 0.12), read off reference shades. Under it the colour
  takes the palette's deep hue (navy, forest, purple, crimson; charcoal on a
  neutral palette). It is checked on the colour as written, too: a very dark
  colour rounds to 8 bits with its hue loose by ten degrees.
- An accent or support keeps at least C 0.12 (0.13 for a warm hue): gold at
  0.08 is khaki, orange tan, green sage, blue slate.
- A ground is a real colour or nearly white: C 0.11 dark, 0.14 at mid
  luminance, falling to 0.02 by Y 0.75. No dusty mid-tones.
- Dark reading ink is navy-, green- or purple-black (the palette's deep or
  ink hue), never the ground's warm hue.
- A two-stop fill decides once: if either stop takes the deep hue, both do,
  so no gradient jumps hue (rule 5).
- The ground, when it is a light white faintly tinted by the old palette (a
  blush white under a teal palette), takes the new ground hue at the same
  faint chroma. Every other neutral is left alone.

**Luminance lock (rule 52) and colour-blind readers (rule 43).** Every colour
is still solved to the luminance it replaces, so the gate's contrasts are
unchanged. A palette is only given to a card if none of the reader's pairs
(ink, accent and support on the ground) ends up worse by more than 0.25 and
under 4.5:1 for a protan, deutan or tritan reader. The first plan failed 49
pairs, nearly all red: a deuteranope sees a dark red lighter than it is. With
the check in the assignment, 0 of 1,245 pairs regress, and red still carries
the 101 cards where it is safe (Red & Yellow 74, Black & Red 27).

**The accent must read as its name.** The accent keeps its luminance, and
`namedBand(H)` is the band in which a hue is still the colour the palette
names: over the top, red goes salmon, orange peach and purple lavender, so a
card whose accent is pale type does not get them. Under the bottom a warm
accent takes the deep hue (navy type on a white card, a proven look), except
where deep is the neutral ground: gold cannot be drawn dark, so Black & Gold
on a dark accent plate went charcoal and the first pass took
`trustSeal-du03-35` from colourfulness 0.161 to 0.048 and off the landing (it
filters under 0.05). When no palette fits a card, the colour-blind check
still has to hold.

**The picker shows the palette by its accent.** The landing's palette grid
took its swatch from each palette's most colourful card, which could be a
white card whose gold had gone navy: "Navy & Gold" with no gold in it. It now
takes the card whose accent is most vivid (then the most colourful), and
every one of the twelve shows the colour its name says.

**Rule 41, in part.** Navy against gold is a near-exact complement (180° in
OKLCH). Rule 41 is about two saturated mid-tones fighting; a dark ground under
a light accent does not vibrate, and it is the most proven pairing there is.

**Drawn grounds carry colours in a string.** A `ground:` backdrop keeps its
five colours inside its source (`ground:kind/c1/c2/accent/support/ink/seed`,
grounds.js `src()`), where a walk over colour values does not look: the first
pass left 67 sunbursts, stripes and halftones in the old palettes. They are
mapped by the same rules, the two ground stops deciding together.

`scripts/repalette_showcase.mjs` moved the library onto the set in place
(colour only), printing the lock, the muddy count and the colour-blind check;
then rethumb, the colour measure, the gate. Measured against the library
before (the gate on the same renderer):

| | before | after |
|---|---|---|
| live cards | 415 | 415 (none lost, none gained) |
| gate | 415 pass | 415 pass |
| median worst critical line | 5.56:1 | 5.55:1 (median change per card 0.00) |
| largest drop on one card | | 9.27 to 7.77:1 (a drawn sunburst re-hued) |
| critical lines under 3:1 | 0 | 0 |
| median colourfulness (live) | 0.263 | 0.266 |
| colour-blind regressions (role pairs) | | 0 of 1,245 |
| mapped colours left muddy | | 0 |

## 104. The words on a coloured plate wear the plate's colour

Added 2026-10-02. The owner, of a Test Strips card whose number sat in a
light blue box in a near-black: "I would probably use the same blue tone for
the numbers and box." And of a Pokémon card with the same baby-blue pill and
brown-black digits: "this looks ridiculous."

Rule 95 makes a card one hue but leaves black and white alone, so the
number, the CTA over it and the website under it stayed the warm near-black
`#141110` on every plate: brownish on blue, muddy on green.

- **The number, the CTA and the website line, when neutral and sitting on a
  solid coloured plate beneath them** (the line's middle and most of its
  letters on the plate), take the plate's hue at their own luminance: a deep
  shade (C up to 0.09) when the line is dark, a faint tint (C up to 0.03)
  when it is white. The plate and its words read as one colour, and every
  contrast the gate measured is the same. At the darkest inks the colour only
  shows in blue and purple: a green at the luminance of near-black is black.
- **Only that unit, and never as a source.** The first build tinted every
  line on a plate, and a card's tagline look ('Colour blocks') builds its
  palette from the colours on the card, weighting the number and CTA twice:
  `checklistHero-pp02-15`'s light blue headline blocks came out navy with
  white words. A tinted line is marked (`pgPlateInk`) and the palette readers
  (`scenePalette`, `thSourcePalette`) skip it, so the rest of the card is
  exactly what it was. A marked line still wearing its tint follows its
  plate when a theme repaints it, and goes back to neutral on a neutral one.
- The plate must be a box as `pgHuePaints` counts one. A dot under a tick
  mark is too small for `pgOneHue` to bring to the card's hue, and the first
  build tinted `trustSeal-nn05-30`'s tick with that dot's off-hue colour,
  which the gate failed ('hues').
- A line on a neutral plate (paper, smoke, black, white) stays neutral; a
  line the visitor coloured by hand (pgUser), a gradient and per-letter
  colours are left alone.
- `pgPlateInk` runs right after `pgOneHue` on every path that runs it (the
  layout, a theme, a card look, a tagline look, the copy that follows a flat
  ground), so the plate's colour is final when its words take it.

Measured on main's build, the classics gate before and after: 346 of 404
pass either way, no card's verdict changes except `st_coins_splitcol` (held
already, its number off its plate), whose number's worst letter goes from 3.0
to 2.92:1 where anti-aliased tinted digits meet the photograph; the median
change in the worst critical line is 0.00 (range plus or minus 0.04).

## 105. A card on the site is a finished ad: a photograph behind it, a headline that reads

Added 2026-10-02. The owner, looking at the live library: "These can't be
final products on the site.. there's no background?", then "we need to
audit".

Every one of the 415 live cards was looked at on numbered contact sheets
(grouped by what is behind it), and every doubtful one again at full size. 86
are held back from the site, listed with their reason in
`assets/showcase/holds.json` and stamped by `scripts/hold_showcase.mjs`:

| reason | cards |
|---|---|
| a drawn ground (flat colour, pattern, sunburst, gradient) with a small cut-out and no photograph | 65 |
| a panel or wash covering the photograph, so the card reads flat | 7 |
| a dark headline with a heavy shadow on a coloured band, reading as a smudge | 9 |
| an outlined serif headline over a busy photograph | 2 |
| a dark headline on a light or same-colour ground, muddy | 2 |
| fails the gate on main too (the number off the middle of its plate) | 1 |

- **No photograph, no place on the site.** Rule 86's drawn grounds (sunburst,
  stripes, halftone, mesh) stay in the studio as backgrounds a visitor can
  choose, but a library card has to show a scene: a photograph, a blurred
  photograph, the money art, or a photograph under a pattern.
- **The gate cannot see these.** 85 of them passed it: their lines clear 3:1. A
  smudged band headline clears 3:1 and still looks broken; a flat card has
  nothing wrong with it except that it is not an ad. That is why the audit
  was done by eye, and why it lives in a list a person wrote.
- The stamp is `curated`, the one every later audit keeps
  (audit_showcase_content.mjs, curate_showcase.mjs), so no re-run puts a
  card back. 329 cards stay live; every category keeps 33 to 66.

## 106. The designer lines things up the way every design tool does: pink guides, and a lock to the middle

Added 2026-10-02. The owner, on a checklist card's selling points in the
advanced editor: "Can we make sure in the editor I can lock these centered
and if you could just auto center everything please once again and make sure
that layers can align with each other showing a pink line like other editing
software's and it will align either horizontally or vertically or both".

- **Guides.** A layer dragged within seven screen pixels of another layer's
  edge or middle, or the card's edge or middle, snaps to it, and a pink line
  (`#snap-guides`, drawn over the canvas, never on it) shows every match,
  across and down at once. The card's middle wins a tie at half its distance.
  Alt held places a layer freely; View, "Smart guides (pink lines)" turns them
  off (`viewCfg.guides`, which replaced the centre-only `centerSnap`).
- **What reads as one thing moves as one** (`ccParts`): a plate and the lines
  on it, a ring and its icon, an icon and the words beside it, and a list of
  such rows on one left edge, one block, so the icons keep their column. A
  selling point centred line by line put its icons in a zigzag.
- **Lock to the middle** (Arrange, `pgCentreLock` + `pgCentreGroup`): the
  group stays on the card's middle line however its words, face, size or
  format change (`ccKeep`, before every render of the canvas and every undo
  step); it moves up and down only, and pressing one part carries the rest of
  its row. A format switch keeps a locked group's shape (`remapObjects`).
- **Centre all** (top bar) centres every group, and each line on its plate on
  the plate's middle, then locks them. It leaves a small piece in a corner (a
  sticker, the corner badges, never a headline, the number or the call to
  action), and leaves where it was any part that would land on another it did
  not touch: a picture before words, else the smaller. On the Pokémon
  scriptRetro card the owner called "incomplete … threw everything down and
  then abandoned it" (scriptRetro-jw05-16, already held from the site by rule
  105) it centres all but the slab, which would have covered the headline.
- Nothing runs by itself: a card opened from Easy Mode arrives as Easy Mode
  drew it (rule 93), and the centring is the visitor's choice.
