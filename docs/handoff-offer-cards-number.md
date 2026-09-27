# Handoff: a big/medium phone number on the 50 offer cards

Written 2026-09-26 by the Graphics Studio session. The owner's words:

> the 50 you made last night were good but are lacking a big/medium phone
> number for people to contact us.

## Where the 50 live, and why this repo cannot touch them

The 50 are the **offer cards** from the study session "Teaching the Engine
Design" (2026-09-24 to 26), made in **`loganipad/iphoneslainv`**:
`app/ad_offers.py`, `app/design_school/offer.py`, `depth.py`, `solids.py`,
`scripts/offer_ads.py`, and the Offer look on `/ads`. They were sent to the owner
as 100 files at 1200×1200: `marketplace/` ("Message us", no number) and
`social/` (with (562) 999-4994 and iPhones.LA/sell). In the social set the
number is a small line at the foot of the card.

This session's GitHub access does not reach `loganipad/iphoneslainv`, so the fix
has to land there. Everything below is what that session needs.

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

Until today the Studio's iPhones LA link refused any picture that showed a phone
number. The owner was asked on 2026-09-26 whether pictures sent to iPhones LA
should carry the number from now on and answered **"Yes, allow the number"**;
the link now sends them (studio commit d8b2160). Websites, QR codes, addresses
and handles are still refused.

So the question for the offer cards is the owner's, not a rule: do the
marketplace versions keep "Message us" with no number, or carry the number too?
The owner's words ("lacking a big/medium phone number for people to contact us")
read as: every version gets the number. Recommended: make the number the action
on both sets, and keep a number-free export as an option for platforms that
remove listings with contact details in the image.

Check the iPhones LA server too: if `/api/buy-ads/studio/images` or the
Auto-post lane rejects or strips pictures with a number, that is the other half
of this change.

## Paste-ready prompt for the iPhones LA session

```text
In loganipad/iphoneslainv: the 50 offer cards from 2026-09-25
(app/ad_offers.py, app/design_school/offer.py, scripts/offer_ads.py, the Offer
look on /ads) need a big/medium phone number. Owner: "the 50 you made last night
were good but are lacking a big/medium phone number for people to contact us."

Rule (measured in the Graphics Studio, DESIGN-LAW rule 53), for the 1200px card:
- number font 0.62x the headline, held to 93-131px, never under 80px, never
  over 0.77x the headline
- one of the card's two families (support face, heavy weight it really ships;
  or the display face if condensed); never a decorative face
- on its own plate, or >=4.5:1 per letter against what is behind it
- never on the devices: below the phone group or beside it
- if it does not fit: shrink the CTA to a label over the number (>=28px), then
  the web address, then the number, never under 80px; a card that cannot fit
  an 80px number is not returned
- the web address (iPhones.LA/sell) under the number, >=28px, same axis
Add the number rule to app/design_tokens.json and a design-school lesson that
fails a card whose number is under the floor, then regenerate the 50 with
scripts/offer_ads.py --count 50 into both folders and send the owner the new
contact sheets. Ask the owner whether the marketplace set carries the number
too (the Studio's link now allows it); if yes, put it on both.
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
