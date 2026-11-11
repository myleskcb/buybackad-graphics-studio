# Flow audit, 2026-11-11: the path through the product, the three kinds of ad, the listing words, the plans

The owner asked for an audit of "the flow and UX of the platform and
continuity between videos, pictures" and ads "put inside of a phone screen ...
or same with the computer on and the screen shows an ad", with "the title and
description ... geared to look like a singular item post that attracts
attention"; then the plans, and how they connect to reselling.us.

How it was done: the current live site
(`https://buybackad-finished-copy.netlify.app`, which serves the same `app.js` as `main` at eb7b8fcf)
was walked in Chromium at 1440 and at 390 wide, signed out: landing, Make my
ad, a number typed, Download, Create video, the video maker, the plans. The
code of this repository was read where a screen could not show the answer.
reselling.us was read on its public page. What the audit found in the owner's
other, private repositories is not written here: this repository is public.

Not exercised: creating an account or paying on the live site (no test
account was made there), a signed-in download, the designer, the library
dialog, and anything on an iPhone itself. Where a line below rests on the
code and not on a screen, it says so.

## 1. What is wrong first

1. **Two live sites, two prices.** `buybackad-graphics-studio.netlify.app`
   serves a build from before 2026-10-08: "Fifteen dollars when it pays for
   itself", Free and Pro at $15, 12 colour sets, no `/api/health`, no
   `/social/` (its `app.js` is 1,490,724 bytes; `main`'s is 1,594,169, which
   is what `buybackad-finished-copy.netlify.app` serves, with billing on).
   The stale one is the address README, AGENT-BRIEF, every page's canonical
   and Open Graph link, and `sitemap.xml` call the product. A search engine,
   a shared link or an old bookmark lands a customer on a price the checkout
   will not honour. Redeploy it from `main`, or retire it and move the
   canonical links to the address that is current.
2. **On a phone, the ad is 3,087 pixels below the field you type in.** At
   390 wide Easy Mode puts the phone-number field at 709 px and the preview
   at 3,796 px (Download at 4,281). Nothing follows the thumb: a reseller on
   a phone types a number and cannot see it land. The page promises "Three
   steps, under a minute"; on a phone it is about five screens of scrolling
   past colour, typeface, headline style and background before the ad
   appears. A small preview pinned under the top bar would fix it.
3. **Two pop-ups stand between "Make my ad" and the first ad.** The first
   thing Easy Mode shows is "Where do you buy?" (ZIP or city), over the
   designs, before one has been seen; the form already has a "Your area"
   field. Then Download on the first card of the default category answers
   "No background selected ... The greyed-out photo is only a preview. Your
   ad will download ... without the photo". The landing says "What you see
   is what you post"; on the default card it is not. The preview shows a
   blurred photograph the download and the video do not have. Ask for the
   area when a design that uses it is picked, and make the default card's
   preview its download.
4. **A paid feature nobody can open.** Starter, Pro and Business sell "Keep
   300 / 1,000 / 3,000 ads in your library", and every ad carries a star and
   a Save to library button, but the Library buttons are shown to admin
   accounts only (`ad-library.js`, `buttons()`; the owner, 2026-10-11: "only
   accessible to my account"). A customer can save into a library they have
   no door to (`master-library.html` answers if the address is typed). Either
   open the door for paying accounts or take the line off the plans.
   (From the code; not clicked signed in.)
5. **No password reset.** `netlify/functions/api.mjs` has no reset or email
   confirmation route (README: "add before wide launch"). With billing on, a
   paying customer who forgets a password has no way back in.

## 2. The path, step by step

| step | what happens | note |
|---|---|---|
| Landing | one headline, three buttons, real ads, live counts (362 designs ready to post, 243 classics, 31 colour sets, 13 things you can buy, 14 video styles) | clear. At 390 wide the page is 19,577 px tall; the template section alone is 6,947 px and the prices start past 13,000 px |
| Make my ad | Easy Mode opens in a couple of seconds | the area pop-up first (finding 3) |
| Pick a look | 70 cards in the Phones strip, locked ones marked PRO | the sample number on every card is the shop's real (562) 999-4994; Download refuses until a number is typed ("Type your phone number first"), which is right |
| Type your info | number, website, area, title, headline, subline, CTA, selling points, colour theme, typeface, headline style, background, blur | thirteen controls in one column; only the first is needed. The rest could fold under "More" |
| Download | six sizes, Download my ad, Create video, Save to library, Save as video, Fine-tune | the pop-up of finding 3 on the default card |
| Create video | signed out, the 10-second video is made and playing in 10 s, with Download MP4, Download JPG, Save to library | the best moment in the product, and it is the second button under a dashed outline |
| Plans | four cards, yearly saving said, billing on (`/api/health`) | consistent with `plans.mjs` and the About page |

Smaller things:

- **Three top bars.** Landing: Templates, Video ads, Look Book, Palettes, How
  it works, Pricing, FAQ, Log in, Sign up. Easy Mode: Community, Export, AI
  background, Upgrade, Sign in, Advanced editor. Video maker: Image ads,
  Video ads, Look Book, Pricing, About, with no sign-in and no logo mark.
  Moving between the three feels like leaving the site. One bar with the
  same five places would hold it together. On a phone Easy Mode's bar is
  three rows, 217 px of an 844 px screen.
- **"Export"** is still in Easy Mode's bar and on the "Export without
  background" button; rule 113 says download.
- **"4.0 × 10^51 possible looks from 53 typefaces and 121 palettes"** on the
  video maker is the pixel maths rule 113 keeps out of customer copy.
- **A security-policy message** is logged on the current landing from an
  embedded frame (`about:srcdoc`). Every inline script in the repo matches
  the policy's hashes, so it is not one of ours; most likely a payment or
  sign-in embed. Nothing looked broken. Not traced further.

## 3. Pictures, videos and screens: is it one thing?

**What holds.** A saved number and area travel from the studio to the video
maker (`pgfx_brand`). A card's video opens on the card itself, so the feed
thumbnail is the ad. Every video comes with its photo, for OfferUp.

**What does not.**

- **There are two video products and the site only names one.** "Create
  video" in the studio turns the picture ad into a 10-second clip: same
  design, same colours. "Video ads" in every menu goes to the phone video
  maker, a different tool with its own looks: 5, 6 or 8 seconds, 121
  palettes against the studio's 31 colour sets, 53 typefaces, and sizes that
  do not match (the maker has Feed 4:5 and no 3:4, flyer or 4:3; the studio
  the reverse). A picture ad cannot be opened there and a look from there
  cannot become a picture ad in the studio. Someone who makes a blue-and-gold
  picture and then clicks "Video ads" starts again from nothing. The colour
  split is already recorded (OPEN-ITEMS §AO); the missing piece for the
  customer is one sentence and one button: "Make a video of this ad" beside
  "Make a phone video", and a way to carry the headline and colour set over.
- **The ad on a device's screen is not a format yet.** What exists:
  - a laptop's screen lit with a wallpaper, a photograph or the visitor's own
    picture, on two MacBook product pictures and three MacBook background
    photographs (Easy Mode's "On the laptop screen" row; not in the designer;
    `mac-wallpapers.js`). Putting an ad there today is by hand: download the
    ad, pick a MacBook card, press the camera in that row, choose the file.
    (From the code and OPEN-ITEMS §AW; not exercised today.)
  - drawn walls of devices whose screens carry artwork in the card's colours
    (`device-walls.js`), as a background.
  - in the video maker, phones that can land screen up. The engine's
    `drawFront` takes a picture for the glass and nothing passes one, so the
    screens are black.
  - no phone, iPad or desktop picture in the studio has its screen measured.

  So the third kind of ad the question describes, the finished ad shown as
  the phone's wallpaper or on the computer's screen, has its parts and no
  product. The shortest build: a fourth button beside Download and Create
  video, "Show it on a screen", that draws the current ad at 9:16 into the
  video maker's phone front, or at 16:10 into a measured MacBook, as one more
  download and one more video opening. It reuses the Story render, the
  `drawFront` screen slot and the `SCREENS` warp that are already there.
- **The one hard problem with a screen ad is the number.** The product's
  promise is a number readable in a feed thumbnail, and the gate holds every
  design to it. An ad inside a phone inside the picture is about a third of
  the frame wide, so its number is a third of the size and fails that
  promise. A screen ad has to either fill the frame with the screen (the
  device as a border, not a subject) or say the number again outside the
  device. The gate should measure the number as it lands, not as designed.

## 4. The title and the description

**The studio writes none.** A saved ad carries `title` (its headline, or the
template's name), `caption` (the headline again), and `category`, `texts` and
`products` for someone else's writer (`netlify/lib/adlibrary.mjs`). For
iPhones LA that writer is on its own site. For every other customer there is
no writer: they download a picture and compose the listing alone. That is the
largest gap in "ready to post": the picture is finished and the post is not.

**"Look like a single item post" has a version that works and one that does
not.** A buy ad titled as if the phone were for sale is the thing marketplaces
and the people who report listings look for, and it sends the wrong person to
the chat: someone who wanted to buy that phone. The version that works is one
model to an ad, said as a buyer: **"We Buy iPhone 15 Pro Max · Cash Today ·
Long Beach"**, short enough for a feed to show whole. It is specific enough to
stop the owner of that phone and it says plainly who is buying.

**Continuity then means one model, three times.** The title names the model,
the picture shows that model (the studio has the device field and the phone
picker for it; the screen ad of section 3 would show it best), and the video
opens on it. Today nothing ties them: the picture can show four phones while
the title names one. `products` is already in the feed; filling it from the
phone picker, and writing the title from it, closes the loop.

**A "Words for your post" card after Download** would finish the job for
every customer: a short title and a description built from the ad's own
category, model, area and selling points, with a Copy button, held to plain
rules (a buying phrase, one model, no number or link in the text).
reselling.us's free plan already offers "Listing text for OfferUp, Facebook
and eBay" for a device on sale; this is the buying side of the same idea.

## 5. The plans

Graphics Studio (`netlify/lib/plans.mjs`, as the live page shows them):

| | Free | Starter | Pro | Business |
|---|---|---|---|---|
| Price | $0 | $25 a month, $250 a year | $60 a month, $600 a year | $100 a month, $1,000 a year |
| Downloads | 3 photos a week | 100 photos a month | 500 a month, photos or videos | unlimited, photos or videos |
| Per ad | free | 25 cents | 12 cents | less the more you make |
| Video ads | make and watch | make and watch | download | download |
| Size and mark | 1080, watermark | 2160, none | 2160, none | 2160, none |
| Designs | every Phones design, top 3 elsewhere | all | all | all |
| AI credits a month | 5 | 50 | 200 | 500 |
| Library | 12 ads | 300 | 1,000 | 3,000 |
| QR code | no | no | yes | yes |

Credit packs for any account: 100 for $9, 300 for $25.

reselling.us, as its public page shows them on 2026-11-11:

| | Free | Pro |
|---|---|---|
| Price | $0 | $29 a month |
| What it is | stock, IMEI check, profit, reports, a buyer link per device, listing text, CSV | buyers list and WhatsApp, Instagram story cards, a shop page, 3 team members |

Waiting lists, price to come: Chatbot, Integrations ("Post and repost to
OfferUp, Facebook Marketplace and eBay", "Instagram story cards that post
themselves"), Hosted CRM. Websites: $1,000 to build, $100 a month.

## 6. How the two connect today, and where they would

**Today: they do not.** No plan on either side mentions the other, and
reselling.us's page does not mention the studio. The studio's only trace of
reselling.us is a hosting note: a Cloudflare Worker to serve it at
`reselling.us/gfx` (`deploy-notes/`, never deployed) and the advice to use
`gfx.reselling.us` instead. Accounts are separate, with no shared sign-in.
The studio's two real integrations are with iPhones LA (the library API and
the outbox feed, behind a key) and SCANS.AD (prints and tracked QR).

**Where the sockets already are**, cheapest first:

1. **A link each way.** reselling.us's page gets "Make your We Buy ads" and
   the studio's partners section gets "Track what you buy". No code beyond
   the links. The two products are the two halves of one job: the studio
   brings the phone in, reselling.us tracks it out.
2. **The QR layer points at reselling.us.** Studio Pro and Business have the
   QR layer; reselling.us Pro has a shop page and every device a buyer
   link. A printed or story ad whose QR opens the shop
   page works now, by pasting the address. (The library holds back any ad
   showing a QR or a website from marketplace posting, which is right.)
3. **Listing words.** reselling.us Free writes a title and description for a
   device on sale; the studio needs the same for a buy ad (section 4). One
   writer, shared, is one product talking and not two.
4. **Story cards.** reselling.us Pro draws its own Instagram story card for a
   device. The studio's Story size and its checked designs could be that
   card's look, opened with the device's details filled in (`?card=<id>`
   opens a library ad today; filling the words from the address is not built).
5. **Posting.** reselling.us's Integrations tier is "post and repost"; the
   studio's library is already an outbox with a feed (JSON, RSS, video, seven
   fresh days an ad) that iPhones LA's poster reads. The same feed is what
   reselling.us's poster would read. This is the real integration, and it
   needs the library open to customers first (finding 4) and one sign-in.

**What a plan could say**, as a proposal for the owner to price:

| | studio side | reselling.us side |
|---|---|---|
| Free with Free | 3 ads a week | a link to the studio from each device |
| Studio Starter or Pro | the words for the post; QR to the shop page | story cards in the studio's designs |
| Studio Business with reselling.us Integrations | the library feed, pictures and videos | posted and reposted from that feed |

A bundle price (both Pros for less than $89) is the owner's call; nothing
here sets one.

## 7. The explainer videos

Built in this session: five short video ads for the product, on
`learn.html`, linked from the landing's workflow section. What they say, how
they are made and how to change them: `tools/explainers/README.md`.

reselling.us's public page has no video on it, so there was nothing to copy
shot for shot. What was matched is its voice:
plain sentences, real numbers, the product's own screens, nothing invented.

## 8. In order

1. Redeploy or retire the stale site; move the canonical links (finding 1).
2. Pin a preview on a phone (finding 2).
3. Remove the two pop-ups from the first run (finding 3).
4. Open the library to the plans that sell it, or stop selling it (finding 4).
5. Password reset (finding 5).
6. One top bar on the three surfaces; "Make a video of this ad" named beside
   the phone video maker.
7. "Words for your post" after Download, one model to an ad.
8. "Show it on a screen", with the number measured as it lands.
9. The link each way with reselling.us; then the shared writer; then the feed.
