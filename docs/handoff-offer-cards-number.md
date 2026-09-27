# Handoff: a big/medium phone number on the 50 offer cards

Written 2026-09-26 by the Graphics Studio session. The owner's words:

> the 50 you made last night were good but are lacking a big/medium phone
> number for people to contact us.

## Done, 2026-09-27: the 50 have the big number

The owner sent the export (`webuy-offer-ads-50.zip`) and its spec
(`PROMPTS.md`: every card's layout, typefaces and words). The social set now
carries the number big; the marketplace set is unchanged, because the brief
keeps numbers off pictures posted to OfferUp and Marketplace. Delivered as
`webuy-offer-ads-50-big-number.zip` (same folders and names, both contact
sheets, `number-report.json`, `CHANGES.md`); the tool that made it is
`tools/offer-cards/` in this repo, and reproduces the delivery pixel for pixel.

What was measured and applied, per card:

- the headline's font size, from the width of its lines in its display face:
  about 84px on two-line studio headlines, about 99px on photo bands and
  studio lists (80 to 105 overall);
- the number: the smallest of 0.77x the headline (the brief's own rule, the
  largest type at least 1.3x the next), what the action band holds inside the
  60px safe margin, and what the width holds with 48px to the brand. Result:
  **59 to 80px, median 66**, from 40px;
- set in the card's own reading face at the weight the generator used for the
  action line (Manrope, Inter, Libre Franklin 800; Space Grotesk, Chivo,
  Instrument Sans 700; Zilla Slab 600; DM Mono, IBM Plex Mono 400) and in its
  own action colour; contrast 4.7:1 or more;
- the owner's sentence kept on one baseline ("Text" or "Call or text" at the
  40px support size, the number, iPhones.LA/sell right-aligned at 30px). On 9
  cards, where the sentence would have cost the number more than a tenth of
  its size (a monospace "Call or text"), the verb stands over the brand.

Why not the 80px floor proposed below: at these headline sizes 0.77x is 65px
(studio rows) to 80px (photo bands), so an 80px number would outrank most
headlines and break the brief's hierarchy rule. **To get an 80px number on
every card, the generator has to set studio-row headlines at about 104px**
(from 84), which is the owner's call; the rest follows.

## Where the generator lives

The 50 are the **offer cards** from the study session "Teaching the Engine
Design" (2026-09-24 to 26), made in **`loganipad/iphoneslainv`**:
`app/ad_offers.py`, `app/design_school/offer.py`, `depth.py`, `solids.py`,
`scripts/offer_ads.py`, and the Offer look on `/ads`. They were sent to the owner
as 100 files at 1200×1200: `marketplace/` ("Message us", no number) and
`social/` (with (562) 999-4994 and iPhones.LA/sell). In the social set the
number is a small line at the foot of the card.

This session's GitHub access does not reach `loganipad/iphoneslainv`, so the
generator's fix has to land there (the 50 already sent were fixed on the
pictures, above). Everything below is what that session needs.

## The rule, measured here (Graphics Studio, DESIGN-LAW rule 53)

Measured on the Studio's 971 showcase cards and 243 classics, 2026-09-26. Before:
the number at a median 58px on a 1080 canvas (5.4% of the short edge, 0.41× the
headline); in a 160px OfferUp tile its digits were about 6px tall. The video ad
maker draws the same number at up to 0.72× the headline and 11% of the width.

Scaled to the offer cards' 1200px canvas:

| | 1080 canvas (Studio) | 1200 canvas (offer cards) |
|---|---|---|
| number, floor ("medium") | 72px | **80px** (6.7% of the short edge) |
| number, target ("big") | 0.62 × the headline, held to 84–118px | 0.62 × the headline, held to **93–131px** |
| number, ceiling | 0.77 × the headline (the headline still wins by 1.3×) | same |
| a 160px tile shows the digits | ≥ 7.5px tall | same |

And the rest of the rule, each part a lesson from the video engine or the design
school:

1. **The number is the second biggest thing on the card**, after the headline.
   It is the action: for a social post it is how a seller reaches the shop.
2. **Set it in one of the card's two families**: the support face in a heavy
   weight (a face that ships that weight; no synthesised bold), or the display
   face when that face is condensed. Never a decorative face.
3. **On its own plate, or at 4.5:1 per letter** against what is behind it,
   judged letter by letter (a line average hides two letters on a light patch).
4. **Never on the devices.** Below the phone group or beside it, never across
   it: the video engine measured the number on a phone in about half its tall
   looks and nearly all of its square ones before it made "the number goes
   under the phones" a rule (studio commit c5ea75e).
5. **When it does not fit, the small extras go first**: the CTA shrinks to a
   label over the number (still ≥28px at 1200), then the web address shrinks;
   only then does the number step down, and never under the floor. A card that
   cannot fit an 80px number is not returned.
6. **The web address sits under the number**, ≥28px, on the same axis.

## Marketplace or not

Answered by the batch's own brief (PROMPTS.md): the marketplace version carries
no phone number and no web address, "because OfferUp and Marketplace take those
pictures down". So the number goes big on the social version only, and the
marketplace pictures stay as they are. (The Studio's iPhones LA link now sends
pictures that show the number, per the owner's "Yes, allow the number"; that is
a separate path from what is posted to the marketplaces.)

Check the iPhones LA server too: if `/api/buy-ads/studio/images` or the
Auto-post lane rejects or strips pictures with a number, that is the other half
of the Studio change.

## Paste-ready prompt for the iPhones LA session

```text
In loganipad/iphoneslainv: the offer cards (app/ad_offers.py, app/design_school/offer.py,
scripts/offer_ads.py, the Offer look on /ads) set the phone number at 40px, the support
size, in the social version's action band. Owner: "lacking a big/medium phone number for
people to contact us." The Graphics Studio fixed the 50 of 2026-09-25 on the pictures
(tools/offer-cards in buybackad-graphics-studio); make the generator do it, so the next
batch comes out right.

Rule, as applied to those 50 (1200px card, social version only):
- the number's size = the smallest of 0.77x the headline's size (the brief: the largest
  type is at least 1.3x the next), what the action band holds inside the 60px safe
  margin, and what the width holds with 48px to the brand line. That gave 59-80px
  (median 66) at today's headline sizes (about 84px studio rows, 99px bands and lists).
- the card's reading face at the action line's own weight, in the action colour
- keep the sentence on one baseline: the verb ("Text" / "Call or text") at the 40px
  support size, then the number, then iPhones.LA/sell right-aligned at 30px. If that
  would cost the number more than a tenth of its size, put the verb over the brand
  line on the right instead.
- a studio action bar may grow up to 30px to hold it, never closer than 24px to the steps
- contrast 4.5:1 letter by letter; the marketplace version keeps no number
Add "number size" to the type scale in app/design_tokens.json (it is a fourth size beside
headline, 40px support and 30px small) and a design-school check that fails a social card
whose number is under 0.62x its headline. Ask the owner whether studio-row headlines
should go from 84px to about 104px, which is what an 80px number on every card needs.
```

## Also found, for the phone ad engine's own repo (not fixed here)

`motion/` in this repo is a byte-for-byte mirror of the phone ad engine's repo
(its CLAUDE.md: change it there, then `tools/sync-to-studio.sh`), so these are
reported, not edited:

- `motion/index.html` says "Pick 2 to 5."; the picker allows 1 to 6
  (`motion/app.js` 245, 253) and a shuffle picks 3 to 5.
- It says "Millions of looks"; the same page computes 7.8 × 10^27.
- It says "Every phone lands on its back"; the panel still offers "Their
  screens" and "Half and half".
- It says the same settings always make the same video; the audio noise
  start uses `Math.random` (`audio.js` 94).
- "Download an MP4": browsers without WebCodecs get a MediaRecorder file that
  can be WebM (`export.js` 95, 113).
- Copy that is not a deadline but not a fact either: "NEW IPHONES ARE OUT. OLD
  ONES DROP." shows all year; "SE HABLA ESPAÑOL" is drawn into English ads as a
  claim about the shop, true only if the shop speaks Spanish.
- The page has no JSON-LD and reuses the image ads' share picture.
