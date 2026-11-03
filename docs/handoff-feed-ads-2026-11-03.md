# Handoff: the iPhone ads iPhones LA posts, 2026-11-03

Written by the Graphics Studio session `session_01LuvyfNiw2NfYEeCECU5343`
(branch `claude/intelligent-cannon-xkmxw7`) for whichever session posts the
ads on the iPhones LA side, and for the next Graphics Studio session.

## What the owner asked, in their words

Over the 32 iPhone cards iPhones LA was picking from (a contact sheet sent
from another session):

1. "For any of the ones that use the same image, can we just make a variation
   with different phones or different background ... we have the ability to
   configure phones to any way shape or form"
2. "we need to make the text as large and legible as possible, there is a
   small sub text that works on websites, but doesn't necessarily sell in
   buying ads in a fast scrolling competitive environment ... take a look at
   the videos. They're much bigger text and big CTA and the headlines are
   maximizing space maybe bubbly text"
3. "fix the iPhones.LA to show the real domain and you can put visit our
   website at www.iPhones.LA (that way they know it's a URL)", "same thing
   here"
4. "that green CTA has the number touching the box", "audit that please so
   all margins are clean and minimal overlapping touching etc ... so it looks
   well planned, designed, and thought out"

## Where those 32 cards come from

They are the iPhone cards of this repo's Designer Library:
`assets/library-ads/<id>.jpg`, served by `/api/library/v1`
(`netlify/lib/library.mjs`), which iPhones LA reads with its key. The
"green CTA" card is `trustSeal-du07-30`. The list of 32, in the order of
the owner's sheet, is `tools/feed-stills/cards.json`. Nothing about them is
drawn on the iPhones LA side.

## Done (asks 3 and 4): the library's 70 phone cards, redrawn

- **Website line:** "Visit our website at www.iPhones.LA", 30px (was
  "iphones.LA", 20-26px), at least 85% opaque (was 40-45% on many cards).
- **Spacing audit:** `scripts/audit_plate_padding.mjs` measures each line's
  letters as drawn against the box under it, the card's edge, other boxes and
  other lines, and flags letters under 18px. The studio's own gate passed all
  70 cards; this found 21 with problems, including the green card's number
  9px under the top of its band.
- **The fix:** `scripts/_library_finish.mjs` runs inside
  `render_library_ads.mjs` after the studio's layout. It centres the words on
  each box with clearance, growing the box where needed. It also moves a
  headline or badge off a bar it runs into, and enlarges 16-17px sub-labels
  to 20px. Afterwards 6 of 70 cards have findings (1-3px on thin bars, all
  watch/iPad/MacBook cards); none of the 32 iPhone cards has one.

This applies to iPhones LA's copies only. The same cards are customer
templates, where the website line is the customer's own site and the studio
strips its spaces (`app.js` `cleanText`), so no template was edited.

**Not live yet.** The renders are on the branch, not on `main`, and
iPhones LA reads the deployed site. They reach iPhones LA when the branch is
merged to `main` and deployed (`.github/workflows/deploy.yml` on a push to
`main`, if its Netlify secrets are set, or `netlify deploy --prod` from the
Mac). Until then `/api/library/v1` hands out the old pictures.

**A conflict for the owner to settle.** The studio's ★ send-to-iPhones-LA path
deliberately holds any picture that shows a website (`iphonesla-link.js`
`refusal`, presumably because marketplaces remove listings that point
off-platform). The Designer Library path does not apply that rule, and the
owner has now asked for the website on the picture. If OfferUp or Marketplace
reject these, the line can come off the library copies by setting
`LIBRARY_SITE` in `_library_finish.mjs` and re-rendering.

## Done for review (asks 1 and 2): feed stills

`tools/feed-stills/out/`: each of the 32 cards' words redrawn as the video
maker's own photo (the look the owner pointed at), at 1080 square:

- the headline as large as the engine fits it;
- a how-it-works line at 60px, replacing the model list most cards carried
  ("iPhone 18 Pro Max • 18 Pro • 17 • 16 • 15");
- the call to action at 50px, the number always drawn as a button;
- "Visit our website at www.iPhones.LA" at 45px.

Nothing on them is under 45px; the library cards went down to 17px. Each card
shows one iPhone model (15 to 18 Pro Max) in two or three of its colours. No
two cards share a phone set or a background. Every look passed the engine's
audit, a 38px margin and a 22px gap between blocks. `report.json` has every
size, before and after. `sheet.jpg` is the set; `compare.jpg` is library card
against still. Every claim on them is one the library's cards already make.

These are **not in the library yet**: the owner has not seen them. To use
them, post the JPGs directly, or ask the Graphics Studio session to add them
to the library. Re-run with `node tools/feed-stills/render.mjs` (instructions
at the top of the file).

## Working in parallel without doing the work twice

- **One owner per surface.** The ad pictures are made here, in
  `buybackad-graphics-studio`. The iPhones LA side picks, schedules and posts
  them, and does not draw or recolour them. A change to a picture is asked for
  here.
- **Hand over through the repo, not the chat.** A session cannot read another
  session's chat. It can read a pushed branch and a file like this one. Each
  side writes down what it changed and where.
- **Check before starting.** Read `git log` on `main` and the branches pushed
  today (`AGENT-BRIEF.md` §4, §6), and this folder's `handoff-*` notes.
- **Two of the owner's sessions were editing this repo at the same time as
  this one.** "Site performance" was in `motion/engine.js` (selling points
  in the video looks) and "Buttons not responding" in `app.js` (the Easy Mode
  area line). This work edited neither file, and the feed stills use the
  engine read-only, so the selling points arrive in the stills when that work
  lands on `main` and the stills are re-run.
