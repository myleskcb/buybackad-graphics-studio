# The full ad, reviewed by eye, 2026-11-12

The owner: "How do these ads never have mistakes always look perfect can we
have you yourself Claude on it every design and write edits changes mistakes
find the common themes patterns that we are incapable of doing and work on
solutions and then analyze competitor ads."

Method: ten full ads drawn at 1080 (four sizes, five colour pairs, five
products, long words, Spanish) and looked at one at a time, at full size. A
fault found once was traced to where it starts, fixed there, and the set drawn
again. The competitor pass is `docs/COMPETITOR-RESEARCH-2026-11-12.md`.

## What was wrong, and where each fault started

| # | seen on the picture | where it started | fix |
|---|---|---|---|
| 1 | "CASH TODAY" in the claim, "CASH PAID" in a chip, "PAID TODAY" on the sticker | each default line was drawn from its list on its own | `fullStyle` picks each so it shares no word's stem with the lines before it; `fullWords` says so when the customer's own words repeat |
| 2 | IPHONE in the headline, iPHONE in the line under it | the engine's capitals for the headline, the layout's own for the lines | a "brand" case in `applyCase`, used by both |
| 3 | the accent on ONE in "UPGRADING? SELL YOUR OLD ONE" | the accent was always the last word | `accentWord`: the goods, else the money, else the verb |
| 4 | a light cone's edges behind the chips and through the chevrons | grounds drawn for the video's own layout | three grounds with nothing drawn in them; the light is the layout's, behind the product |
| 5 | a deep-blue phone lost on charcoal, a black tablet on navy | no light where the product stands | `_productLight`, in the pair's lighter tone |
| 6 | a photograph of a handshake beside flat type; a red pin on a teal and orange card | icons chosen by topic, not by how they sit | one icon, the fan of banknotes |
| 7 | the outer chevron lit on one ad, the middle one on the next | lit by the clock; a photo caught whichever | brighter toward the number, always |
| 8 | the brackets of (562) 4px from the pill's lower edge, 22px clear above | the pill set from the face's ascent | the layout's own pill, the figures centred by their ink |
| 9 | a row of ticks under the number on Silver & Blue | the engine's slot and roll entrances draw overlapping slices; the shadow doubled in each overlap | a landed number is drawn whole (engine) |
| 10 | "CASH FOR MACBOOKS" at 70px | the headline gave way to keep room a laptop is too wide to use | it gives way only while the product is held back by height; spare room goes back to it |
| 11 | a story's claim under the app's top bar | one margin for every size | a story stands between the bars: 12.5% clear above, 17% below |
| 12 | EFECTIVO at 24px on the sticker | one long word shrunk to fit | measured and said; Spanish takes two short words |
| 13 | a headline's outline 17px from the edge | the fit measured the letters, not their outline | found by the pre-flight on the picture; the fit includes the outline |

## The patterns under them

1. **Parts chosen on their own.** Words, icons and grounds were each picked
   without knowing the rest of the card (1, 3, 4, 6). The fix each time was to
   choose in the order the card is read, with what is already on it in hand.
2. **Sizes from the type's box, not from its ink.** The pill, the headline's
   fit and the gaps were set from a face's metrics (8, 13). Measure the ink.
3. **A video's habits on a still.** Things that are right in motion (a blinking
   chevron, a number rolling in by slices, a ground staged for flying phones)
   leave marks on the one frame that is posted (4, 7, 9).
4. **One rule for every size.** A share of the height that suits phones starves
   a headline beside a laptop; a margin that suits a square puts a story's top
   line under the app's bar (10, 11).
5. **A check that shares the mistake.** The layout's own numbers passed 8, 9 and
   13; only looking, or measuring the delivered picture, found them. Hence the
   pre-flight (DESIGN-LAW 138).

## What competitors and the evidence say (short form)

Read the limits first: the research could not open one competitor image (the
hosts are blocked from this container). Its strong parts are the platforms' own
rules and published studies. Full text and sources in the research file.

**Missing from our ad, by expected value**
1. A version that survives each platform. OfferUp's posting rules, as written,
   keep writing, phone numbers and web addresses out of listing photos for
   ordinary accounts, and list wanted ads as prohibited (verified businesses
   may be excepted; enforcement unknown).
2. Who is buying. Done here: a business name field, shown in the badge.
3. One real price for one named model, the owner's own, never "up to".
4. Proof from customers (rating, count, source), owner-entered or absent.
5. An answer to the seller's fear: data wiped, a safe place to meet.
6. Something real in the picture: the counter, a hand, the storefront.
7. A sign of a legitimate buyer: ID asked for, what is not bought.
8. A first step that costs nothing ("text your IMEI, get a price").

**To leave out**
- From competitors: "up to $X", "highest prices", "any condition, locked OK",
  "today only", stacks of cash as the picture, stock photos.
- In ours, for the owner to decide: the website line (the smallest line, a
  second call to action, a removal reason on OfferUp); six claims where three
  read; the sticker and the "top dollar" badge, which are the trade's habit and
  have no evidence for or against them.

**What catches the eye, with evidence**: very large type; a product picture at
any size; looking unlike the listings beside it; brightness contrast with one
strong colour; a calm picture (now measured by the pre-flight); a face or a
hand; an arrow at the number. **Habit only**: starbursts, outlines, glows,
three chevrons, yellow on black.
