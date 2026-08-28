# Curriculum

College-level graphic design, aimed at one outcome: **templates people pay for.**

Ordered so each module can be *measured against the 243-template library*. A
module is done when it has produced either an enforced rule in `app.js` or a
documented decision in `DESIGN-LAW.md` — not when the reading is finished.

## Where the project already is

Do not re-teach these. DESIGN-LAW.md already enforces them, derived by audit:

- Type never gets outlines; separation is one tight dense neutral shadow
- No coloured glow, no sticker shadow, no starbursts
- Gradients do not travel between hues
- Five self-hosted faces; hierarchy from scale, not effects
- Optical left alignment, measured
- Colour maths in OKLab, not sRGB/HSL (rule 40)
- Accents derived split-complementary at ±160°, chroma capped (rule 41)
- Money-word colour chosen against measured pixels from a fixed vocabulary,
  with a discord band at 25–70° (rule 14)
- Contrast measured glyph-masked, never by bounding box

That is already past most commercial libraries. The modules below are the gaps.

---

## Module 1 — Typography beyond the five faces

**Read:** Bringhurst, *The Elements of Typographic Style*, ch. 2–3 (rhythm and
proportion; harmony and counterpoint). Müller-Brockmann, *Grid Systems*.

**The gap:** the library has hierarchy by scale, which is correct, but no stated
**vertical rhythm**. Headline-to-subhead-to-body spacing is per-template.

**Measure:** extract every template's type stack; compute the ratio between
successive optical sizes. A coherent library clusters near a small set of
ratios (1.25, 1.333, 1.5, 1.618). Report the actual distribution.

**Deliverable:** either a stated modular scale the library snaps to, or a
documented finding that the spread is intentional and why.

---

## Module 2 — Composition and the grid

**Read:** Müller-Brockmann. Also study the Swiss poster sources already listed
in DESIGN-LAW's Sources section.

**The gap:** rule 15 measures occlusion and rule 35 measures overlap, both
defensive. There is no stated **positive** composition rule — where the money
word *should* sit, not merely what it must not cover.

**Measure:** plot the centroid of the headline across all 243 templates,
normalised to canvas. Look for clustering. Compare high-performing STREET
layouts against the DESIGNER tier.

**Deliverable:** a stated placement zone, or evidence the two families
legitimately differ (rule 13 already establishes two families).

---

## Module 3 — Colour theory, applied

Full module in `COLOR-THEORY.md`. Summary of the gap: the project has excellent
colour *mechanics* (OKLab, split-complementary, discord bands) but no stated
**semantic** colour system — which hue means urgency, which means trust, and
whether the library is consistent about it.

---

## Module 4 — Visual hierarchy and the three-second read

**The gap:** no measured model of what a viewer reads first, second, third.

**Measure:** approximate saliency. Rank each template's elements by
(area x contrast-against-local-ground). Assert the intended order — money word,
then trust signal, then phone number — and count how many templates actually
produce it. Anything where the phone number outranks the offer is a bug.

**Deliverable:** a saliency ordering check that can run over the library, the
way the contrast audit does.

---

## Module 5 — Trust signalling

**The gap:** this is the project's stated conversion lever and it is the least
formalised. DESIGN-LAW rule 24 says "say what is being bought"; rule 37 says
"state no number you can count". Neither addresses what *makes an ad from a
stranger look safe*.

**Study:** compare the real-world reference ads (see `FIELD-RESEARCH.md`) that
read as legitimate businesses against those that read as scams. The variable is
rarely the offer — it is specificity, contact affordance, and restraint.

**Deliverable:** a trust checklist enforced at export time, e.g. warn when a
template has a price claim but no location, or superlatives but no specifics.

---

## Module 6 — Format and platform

**The gap:** four canvas formats exist; templates are authored square and
re-flow. There is no stated rule for what *must* survive the reflow.

**Measure:** render every template at 1:1, 9:16, 8.5x11, 16:9 and check the
money word and phone number remain within safe margins and above minimum
optical size at each.

**Deliverable:** a reflow regression check. This is the highest-value engineering
module — it protects a paying user from exporting a broken Story.

---

## Module 7 — Commercial polish

What separates a $15/mo product from a free tool: naming, preview quality,
onboarding defaults, and the felt sense that a professional made it.

**Deliverable:** an audit of the first-run experience against DESIGN-LAW rule 36
("use the product before polishing it").
