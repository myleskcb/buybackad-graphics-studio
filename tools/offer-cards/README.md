# Offer cards: the phone number, big

The 50 offer cards (iPhones.LA, drawn by `scripts/offer_ads.py` in
loganipad/iphoneslainv) carried the number at 40px, the support size, in a
line at the foot of the social version. The owner: "lacking a big/medium phone
number for people to contact us." Until the generator sets it big itself, this
puts it big on an exported batch, card by card, from the pictures and the
batch's PROMPTS.md. The marketplace set is left alone: the brief keeps numbers
off pictures posted to OfferUp and Facebook Marketplace.

Per social card:

1. find the action line by diffing it against its marketplace twin, read the
   band colour, where the band starts and where the content above it ends
   (`analyze.py` -> `analysis.json`, `space.json`)
2. measure the headline's font size in its display face, from the width of
   its lines (`headline.py` -> `headlines.json`; lines the detector cannot
   separate are given by hand in `headline-lines.json`)
3. find the weight the generator set the action in, per reading face
   (`weights.py` -> `text_weights.json`)
4. repaint the band row by row from its own colour and set the owner's own
   action with the number enlarged, in the card's reading face, weight and
   colours, iPhones.LA/sell right-aligned on the same baseline (`compose.py`)

The number's size is the smallest of 0.77x the headline (the brief: the
largest type is at least 1.3x the next), what the band holds inside the 60px
safe margin (a studio bar may grow up to 30px, never within 24px of the
steps), and what the width holds with 48px to the brand. The sentence stays
on one line unless that would cost the number more than a tenth of its size;
then the verb stands over the brand on the right.

    export OFFER_SRC=~/Desktop/offer-ads          # marketplace/ and social/
    export OFFER_SPEC=$OFFER_SRC/PROMPTS.md
    python3 fetch_fonts.py                        # the pairings' faces, from Google Fonts
    python3 analyze.py && python3 headline.py && python3 weights.py
    python3 compose.py && python3 sheet.py        # -> out/social, out/sheet-social.jpg

Check `headline.py`'s output before composing: a headline whose size is far
from its neighbours (the generator sets about 84px on two-line studio
headlines and about 99px on photo bands and lists) needs its lines in
`headline-lines.json`.

`measurements/` holds the 2026-09-27 batch's numbers; with them the scripts
reproduce the delivered cards pixel for pixel. Needs Python 3 with Pillow
(raqm), numpy and fontTools.
