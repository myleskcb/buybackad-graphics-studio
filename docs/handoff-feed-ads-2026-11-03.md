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
  to 20px. Afterwards 7 of 70 cards have findings. Six are 1-3px short on
  thin bars, all watch/iPad/MacBook cards. The seventh is one of the 32,
  `glassCard-nn01-20`, whose two headline lines sit 5px apart (the check
  wants 6): tight leading rather than a collision.

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

## Done for review: the full-element ads, as stills and videos

Later the same day the owner asked for more: "text us imei", "or text us
serial", "text us now" (the shop's chatbot quotes from what is typed, not
from photos); "further unify all themes", "drop old ones that look tacky
cheesy or ununified"; "we need all elements.. locations.. selling points..
hero.. sub title... cta.. watermark.. ideally device models we buy"; "a bold
claim" at the top ("top dollar", "max offer", "always available", "quickest
reply", "honest buyer", "top buyer"); icons "0-2 per ad"; "animate all".

`tools/feed-stills/out/` now holds 27 of the 32 iPhone ads in one house style,
drawn by the video maker's engine (`harness.js`, the engine used read-only).
Top to bottom, each has:

- a claim badge: "TOP DOLLAR • MAX OFFER", "ALWAYS AVAILABLE • QUICK REPLIES",
  "HONEST BUYER • TOP DOLLAR" and others. "#1", "best" and "fastest" are left
  out: those need proof;
- the hero;
- the models bought;
- three selling points as the engine's chips, merged from
  `claude/busy-albattani-eh7gxo`;
- one iPhone model in its own colours, plus one 3D icon;
- the call to action ("TEXT US NOW", "CALL OR TEXT") and the number in a pill;
- the towns after a pin, over "Visit our website at www.iPhones.LA".

Every card is set in Chivo Black with the double outline and one accent word,
in eight colourways on six quiet grounds.

The checks, on the delivered picture: a 38px margin, 22px between blocks,
phones at least 11% of the height and clear of the words, and every added line
at least 4.5:1 against its ground. Every line is 45px or more except the chips
(about 34px, sized by the engine to the room left). Five cards found no look
that passed: `stepsFlow-du08-15`, `bubblePop-gl02-20`, `neonNight-jw04-20`,
`arcCrown-cd01-20` and `slabPoster-io06-35`.

`node tools/feed-stills/video.mjs` draws each one as the engine's 6-second MP4
with music: the badge pops in and glows, the headline slides, the chips come
in one by one, the number pops. The MP4s (2-3 MB each) are kept out of git.

**Faults found on the way, each now fixed.** The page sat two folders deep and
every engine font 404ed, so all stills before 2026-11-03 07:30 UTC were in
Arial; the page's base is `/motion/` now. The engine's plan, made by the plain
`Ad`, placed the phones elsewhere than `FeedAd` did; `FeedAd` lays out itself
(`plan: false`). Stills photographed mid-animation cut the number and the
phones; the photo is taken once everything has landed, and the checks are on
that picture.

**Not in the library yet**: the owner has not approved them. Retiring the old
card designs from iPhones LA's feed needs a hold list in
`netlify/lib/library.mjs`. Its feed is today whatever the site offers its
customers, so a card cannot be dropped for iPhones LA alone.

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
  area line). This work edited neither file. Its branch merged "Site
  performance"'s (`claude/busy-albattani-eh7gxo`) to use those selling points
  rather than write a second set. It sent that session the owner's theme
  requests ("unify into all designs and main engine", the video palettes on
  the photo ads, animated elements, no "TEXT A PIC" in its default points),
  since customer-side theme unification is the shared rulebook it proposed.
