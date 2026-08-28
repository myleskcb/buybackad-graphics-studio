# Field research — studying real ads in the wild

The user's instruction: study similar graphics on Craigslist, Facebook
Marketplace, OfferUp, and Google Images. This file says how to do that so the
findings are usable and the method is defensible.

## Why this matters more than reading theory

DESIGN-LAW was built by measuring, and its strongest rule (14) explicitly ties
the colour vocabulary to *"the hue vocabulary the user's own good references
use"*. Real competitor ads are the ground truth this project already relies on.
More of them is straightforwardly more capability.

## What we are looking for

Not "nice designs". Specifically:

1. **The trust variable.** Two ads offering the same thing, one reads as a
   business and one reads as a scam. Isolate what differs. Hypothesis from
   DESIGN-LAW: specificity and restraint, not production value.
2. **The hue vocabulary actually in use** in this niche, per platform.
3. **The failure modes** — what the amateur ads do. Outlines, starbursts,
   rainbow gradients, five fonts. DESIGN-LAW already bans these; confirming they
   correlate with low-trust reads is evidence, not just taste.
4. **What the good ones do that we do not.** This is the only category that
   produces new rules.

## Method

**Search terms that surface this niche:**

- `we buy iphones`, `cash for phones`, `sell your iphone`, `we buy broken phones`
- `compro celulares`, `compramos iphones` (the Spanish-language market is a real
  and under-studied segment for LA/OC)
- Add city qualifiers to find the local competitive set specifically

**Google Images operators worth knowing:**

- `site:craigslist.org "we buy iphones"` — scope to one platform
- Tools → Type → Photograph, or Colour, to filter
- Reverse-image search a strong ad to find the template family it came from;
  many "designs" in this niche are the same Canva template recoloured, which is
  itself a finding

**Sampling discipline.** Take what the search returns, including the bad ones.
Selecting only the ads that already agree with DESIGN-LAW would confirm it
rather than test it. Aim for 30–50 per platform, scored blind before analysis.

## Scoring sheet

Score each ad 1–5 on: **trust**, **stopping power**, **clarity of offer**,
**contact affordance**. Then record objectively: dominant hue(s), type face
count, effects used (outline/glow/starburst), whether a price appears, whether a
location appears, whether the device condition is stated.

The interesting output is the *correlation*: which objective features predict a
high trust score. That is a rule candidate.

## Legal and ethical limits — read before collecting

- **Study and measure; do not copy.** Layout ideas and colour relationships are
  not protectable. A specific photograph, logo, wordmark, or a template's exact
  arrangement is. Never trace an ad into a template.
- **Respect platform terms.** Manual browsing is fine. Do not build a scraper
  against Facebook Marketplace or OfferUp; both prohibit it, and the risk lands
  on the user's real accounts.
- **Do not collect personal data.** These ads contain real phone numbers and
  faces. Record design attributes, not contact details. Never store a
  screenshot containing a stranger's number into the repo.
- **Store findings, not assets.** The log records measurements and conclusions.
  Reference images stay out of git.

## Deliverable

A findings file with the scored table, the correlations found, and any proposed
DESIGN-LAW rule stated in the same form as the existing 42: what the rule is,
what was measured, what it rejected, and where it is enforced in code.
