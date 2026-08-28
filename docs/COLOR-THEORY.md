# Colour theory module

The project's colour *mechanics* are already strong. This module is about what
sits above them.

## What is already settled (do not relitigate)

- **Rule 40 — colour maths in OKLab.** sRGB/HSL are not perceptually uniform;
  equal numeric steps are not equal perceived steps. Lighten/darken by moving L.
  Reduce chroma to reach gamut, never clip channels. State palettes as {L,C,h}.
  Restating the eight category colours this way cut perceived-lightness spread
  from ~0.30 to 0.17 with no change of intent.
- **Rule 41 — split-complementary at ±160°, not exact complements.** A 180° pair
  is maximum contrast and it vibrates; the two hues fight and neither wins.
  Chroma capped well below sRGB max, because full saturation reads as default.
- **Rule 14 — hue-gap bands** for money word against chromatic ground:
  0–25° analogous (fine), **25–70° discord (reject)**, 70–140° triadic (fine),
  140–180° complementary (maximum pop).
- **Measurement discipline:** glyph-masked, never bounding box. `bandKnockout`
  measured 1.21:1 by bbox and 12.06:1 glyph-masked — the bbox number would have
  "fixed" four good templates into unreadable ones. Gradient headlines have no
  `props.fill`; use the mean of `grad.c1`/`grad.c2` or 82 words measure as black.

## The gaps this module closes

### 1. Semantic colour — no stated meaning system

The library derives *harmonious* colour but never states what a hue **means**.
For a buyback ad there are only three jobs:

| Job | What it must do |
|---|---|
| **Urgency** | make the offer feel time-sensitive without feeling cheap |
| **Trust** | make a stranger with cash look like a business |
| **Money** | make the payout the thing the eye lands on |

Warm high-chroma reads as urgent and, past a threshold, as desperate. Cool
low-chroma reads as institutional and, past a threshold, as cold and generic.
The interesting question is where those thresholds sit **for this audience**,
and it is answerable by measuring the reference ads.

**Task:** classify every template's accent by job. Find whether the library is
self-consistent. Report templates where the urgency colour and the trust colour
are the same hue — that is a contradiction the viewer feels but cannot name.

### 2. Cultural and platform context

Colour meaning is not universal, and this matters concretely: the product ships
EN and ES, and serves LA and OC. Study whether the reference ads that perform in
Spanish-language marketplace listings use a different palette. Do not assume;
measure and cite.

Platform context too — a palette that pops in the Facebook Marketplace grid
(white chrome, dense thumbnails) is not the one that pops in an OfferUp feed.

### 3. Colour and accessibility as a commercial feature

WCAG contrast is currently treated as a legibility floor. Reframe it: roughly
8% of men have some form of colour-vision deficiency, and that is a meaningful
slice of a phone-selling audience. A template whose entire hierarchy depends on
a red/green distinction fails silently for them.

**Task:** simulate deuteranopia and protanopia over the library and re-run the
existing contrast audit under each. Any template that passes normally and fails
simulated is carrying a hidden defect. This is a genuine selling point for a
paid tier and nobody in this niche does it.

### 4. The four unresolved templates

DESIGN-LAW's "Known unresolved" names templates that fail contrast with no
vocabulary hue that fixes them without a fresh clash:
`dl_silver_trustSeal_mono`, `dl_strips_agencyGrid_arctic`,
`dl_sports_arcCrown_crimson`, and one more.

These are the best available test of whether new colour understanding is real.
If a module cannot resolve them, it has not added capability. Options not yet
tried: changing the *ground* rather than the ink; adding a plate (rule 21);
moving the word to a different region of the photograph.

## How to study colour here

Always against the pixels. The project's own hard-won lesson is that colour
theory selects *from* a vocabulary observed in real references — it does not get
to invent. An early pass proposed a pastel money word appearing nowhere in the
references and was thrown away. Do not repeat it.
