# The offer-card prompt, version 2: double the variation, every category

Version 1 (`PROMPTS.md`, the 50 ads of 2026-09-26) made iPhones.LA's offer cards from three layouts, ten studio colours, twelve photographs, twenty type pairings and six Apple categories. This version keeps the same style and doubles every axis. It also opens the categories the owner asked for on 2026-09-27: Samsung, Pixel, foldables, consoles, handhelds, controllers, gaming PCs, headphones and headsets, monitors, SSDs, mini PCs, sealed Chromebooks, Meta glasses, smartwatches, cameras and drones.

Two things changed besides the variety:

- **The number is 80px** on the 1200 card (the owner's "now double down"), and every headline is at least 1.3x it, so about 104px.
- **The honesty rules grew.** A review of the first 50 found six headlines that claim more than the ad shows or the shop buys (last section). The new rules below would have stopped all six.

The Studio already carries this family as templates (`offer-library.js`: 161 cards over 35 buying lines in all 13 categories, six layouts, twenty looks, twelve pairings, every one passing `scripts/audit_templates.mjs`). This file is the brief for the generator on the owner's Mac, which draws the 1200px ads.

## The brief

```
Make 100 WE BUY ads for iPhones.LA, a buyer of used phones, computers, gaming and audio gear
in Long Beach, CA. Each ad is a 1200 x 1200 square for OfferUp, Facebook Marketplace and
Instagram. Goal: make it easy for someone with an old device to say yes. In a few seconds the
ad answers four things: is this about my device, what happens if I reply, what could go
wrong, and how do I start.

MIX (per 100):
  Apple 30: iPhone 14, iPad 5, MacBook 5, Apple Watch 3, desktop Mac 2, all Apple devices 1
  Android 20: Samsung Galaxy 8, Google Pixel 5, foldables 5, Android tablets 2
  Gaming 22: consoles 6, Nintendo Switch 4, PC handhelds 4, controllers 3, gaming laptops 2,
             gaming PCs 2, VR headsets 1
  Audio 12: headphones 5, earbuds 4, gaming headsets 3
  Computers and parts 10: monitors 3, SSDs 2, mini PCs 2, sealed Chromebooks 2, laptops 1
  Wearables 4: Meta glasses 2, smartwatches 2
  Cameras 2: cameras 1, drones 1
No headline repeats within a category. No two neighbours share a layout AND a colour.

EVERY AD CARRIES:
1. A models line (small, accent colour): which models we buy, from the category bank.
2. A headline: short, confident, three lines at most, from the category bank.
3. Three numbered steps:
   1 Message us (what to send, from the category bank)
   2 Meet up (In Long Beach, checked with you)
   3 Get paid (Cash, at the meeting)
4. Selling points where there is room (the list layouts): three, from the category bank.
5. One action in a solid band across the bottom, with the brand.

TWO VERSIONS OF EVERY AD:
- Marketplace: "Message us for an offer" (or "Send us a message", "Message us to start")
  plus iPhones.LA. No phone number and no web address: OfferUp and Marketplace take those
  pictures down.
- Social (Instagram, flyers, Google): "Call or text (562) 999-4994" or "Text (562) 999-4994",
  the number at 80px, and iPhones.LA/sell. Inline (verb, number, brand on one baseline) when
  it fits with 48px between the number and the brand; otherwise stacked (the number alone on
  the left, the verb over the brand on the right).

PRODUCT PICTURES:
- Real product pictures only: the maker's own product images, or a freely licensed photo
  (Wikimedia Commons: CC0, public domain, CC BY, CC BY-SA, with the credit kept in a sidecar
  file). Never drawn by AI.
- Every picture at least 1.5x the size it is drawn at, whole (never cut off by the frame),
  on a clean cut-out edge. No lettering except the maker's real marks: a picture whose text
  reads as gibberish ("Addrorid", "WILD BOLD") is rejected. A phone of one brand is never
  used as another.
- No clean picture of a line? Use the TYPE layout: the model names set large are the picture.

SIX LAYOUTS, ROTATED (version 1 had the first three):
- Studio row: models line, headline, the devices across the middle, steps in three columns.
- Studio list: headline across the top, steps and selling points down the left, devices
  standing on the right.
- Photo band: a real photograph on the top 55% with the headline on it and the devices
  floating beside it; a solid band below with the models line, the steps and the action.
- Split: a solid colour column on the left carrying the models line, the headline and the
  steps; the devices on the studio sweep on the right; the action band across the bottom.
- Centre: everything on one axis, the steps' text centred in their columns.
- Type: no picture. The headline, then four model names set large in two columns between
  thin rules ("Steam Deck / ROG Ally / Legion Go / MSI Claw"), then the steps.

TWENTY STUDIO COLOURS (ground top to bottom, then the ink):
  midnight #1c2644 > #0c1226, ink #f5f7ff     ink      #18181b > #0a0a0b, ink #ffffff
  forest   #1a3d2e > #0b1f17, ink #f2f7f2     sand     #ecdec7 > #dcc8a6, ink #1f170d
  cobalt   #2447c4 > #1a2c88, ink #ffffff     teal     #11535a > #083237, ink #effcfb
  graphite #2e3034 > #17181b, ink #f4f4f5     plum     #4f1a3c > #2b0c20, ink #fff0f7
  violet   #3d2475 > #1f1142, ink #f7f2ff     sky      #dcedfc > #c3dcf4, ink #0d2138
  bone     #f3efe6 > #e4ddcf, ink #16140f     lime     #dcf36f > #c8e548, ink #142004
  sun      #f8d544 > #efc21d, ink #1a1604     slate    #404d60 > #232c39, ink #f3f6fa
  signal   #ff8036 > #f2661c, ink #1a0d05     cream    #fbf5e6 > #f0e5cb, ink #2a1d0a
  blush    #f5d9d6 > #e9c3bf, ink #2a1614     oxblood  #5e161c > #360a0e, ink #fff1ea
  mint     #d9f1e5 > #c1e5d2, ink #0f2a1e     arctic   #eef4f8 > #dce7ef, ink #0f1d2a
Each look's accent, detail ink and band are in offer-library.js (LOOKS); every detail ink is
7:1 or better on its ground, every number 6:1 or better on its band.

TEN BAND COLOURS FOR THE PHOTO BAND (version 1 had five): night, ink, forest, navy, paper,
and oxblood, teal, plum, slate, sand.

TWENTY-FOUR PHOTOGRAPHS (calm backdrops only; version 1 had the first twelve):
  night-light-trails, classic-light-trails, light-sunset-window, light-foliage-shadow,
  classic-neon-bokeh, meet-parking-dusk, light-leak-orange-purple, lb-stucco-palm-shadow,
  la-pastel-stucco-shadow, la-dusk-palms, classic-dusk-palms, classic-sunset-wall,
  and: harbour-blue-hour, pier-lights-dusk, freeway-from-above-night, rain-on-glass-city,
  concrete-window-shadow, desert-road-dusk, neon-sign-blur, rooftop-dusk-skyline,
  earth-at-night-from-orbit (NASA, public domain), moon-limb-dark (NASA, public domain),
  aurora-from-orbit (NASA, public domain), galaxy-dark-field (NASA, public domain).
Never a table in perspective under a flat product picture. The photograph keeps its own
colour: no duotone, no tint; shade is black and even, only as strong as the words need.

TYPE: one of 40 locked pairings (a display face and a reading face; list below). Two families
at most. Sizes: the headline, the number (80px), 40px support and 30px small. A caps-only face
never sets "iPhone", "iPad" or "MacBook". The number is set in the reading face.

STEP MARKERS (four, version 1 had two): solid badges, numerals "01 02 03", outlined rings,
and small numerals over a hairline rule.

DEVICE ARRANGEMENTS (eight, version 1 had four): a row side by side, a fan, front and back,
a hero with one smaller beside it, a laptop at the back with the rest in front, a stack, a
pair facing each other, and one device alone and large. Contact shadow under every device;
phones turned so their sides show at true thickness; laptops, tablets and watches upright.

RULES (every one checked on the finished pixels):
- No dollar figure, no dash of any length, no emoji.
- No rank or reputation: never "best", "highest", "top", "#1", "trusted", "honest",
  "guaranteed", "we beat", "we top", "we outbid", "we match", "we pay more", "more than
  the pawn shop". An invitation is fine: "Skip the trade-in".
- NO GREY SWEEP (the owner, 2026-09-27: "the gray sections should have a background image"):
  the ground behind the product is a photograph of the line's goods, in its own colour, under a
  neutral shade just strong enough for white type; the small type sits on a solid panel.
- NO BLANK PRODUCT: a card, a slab or a box shows its face. A slab with a blank card or a
  faceless box reads as unfinished ("the cards don't even have a brand or image on them").
- A VOICE PER CATEGORY: display faces with personality (varsity or marker for sports cards,
  comic for Pokemon, Western or engraved for gold and coins, techno for gaming), a plain
  reading face for the steps and the number.
- No clock and no service we do not run: never "instant", "in minutes", "30 seconds",
  "7 days", "daily", "mail-in", "prepaid label", "house calls", "we come to you",
  "free tow", "pickup", "paperwork handled".
- No locked, iCloud, financed or blacklisted wording, and nothing about how long an offer lasts.
- No competitor names. The brand is always spelt iPhones.LA. A non-phone ad never says "phone".
- SAY WHAT IS SHOWN: a headline names only devices the picture shows, or the kind of thing
  it shows. "We buy all three" only when the picture shows exactly three kinds and the
  models line names the same three.
- NO MORE THAN WE BUY: never "every", "all", "any" or "the whole drawer" about devices. The
  models lines have cut-offs (iPhone 11 and newer, M1 and newer), so "every Apple device" is
  not true.
- THE HEADLINE AND THE MODELS LINE AGREE: an iPad-only models line takes an iPad headline,
  not "tablet".
- A lineup ad never names one model in the headline.
- Text contrast 4.5:1 letter by letter (3:1 for very large type); the headline still reads at
  160px; the number's digits at least 8px tall at 160px.
- No words on or within 18px of a device. The largest type is at least 1.3x the next size.
  At most four alignment positions. Everything inside a 60px safe margin.
```

## The 40 type pairings

The first twenty are version 1's (19 of them used in the 50). The second twenty are new. Every face is on Google Fonts; the Studio's own twelve (`offer-library.js` FACES) are marked *.

| # | Headline | Text | # | Headline | Text |
|---|---|---|---|---|---|
| 1 | Teko | Manrope | 21 | Young Serif * | Manrope |
| 2 | Oswald | Libre Franklin | 22 | Schibsted Grotesk * | Schibsted Grotesk |
| 3 | Sora | Inter | 23 | Zilla Slab * | Zilla Slab |
| 4 | Saira Condensed | DM Mono | 24 | Big Shoulders Display * | Libre Franklin |
| 5 | Barlow Condensed | Inter | 25 | Sofia Sans Extra Condensed * | Chivo |
| 6 | Anton | Inter | 26 | Unbounded * | Instrument Sans |
| 7 | Syne | Space Grotesk | 27 | Gloock * | Instrument Sans |
| 8 | Space Grotesk | IBM Plex Mono | 28 | Bricolage Grotesque * | Bricolage Grotesque |
| 9 | Cormorant Garamond | Manrope | 29 | Clash Display * | Satoshi |
| 10 | Roboto Slab | Instrument Sans | 30 | Khand * | Manrope |
| 11 | Libre Franklin | Zilla Slab | 31 | Chivo * | Chivo |
| 12 | Khand | Instrument Sans | 32 | Libre Franklin * | Libre Franklin |
| 13 | Shrikhand | Manrope | 33 | Fraunces | Work Sans |
| 14 | Nunito | Instrument Sans | 34 | Archivo | Archivo |
| 15 | Instrument Serif | Inter | 35 | Bebas Neue | Public Sans |
| 16 | DM Serif Display | Inter | 36 | Epilogue | Epilogue |
| 17 | Bungee | Chivo | 37 | Playfair Display | Source Sans 3 |
| 18 | Big Shoulders Display | Chivo | 38 | Red Hat Display | Red Hat Text |
| 19 | Archivo Black | Inter | 39 | Familjen Grotesk | IBM Plex Sans |
| 20 | Alfa Slab One | Work Sans | 40 | Outfit | Outfit |

## The category banks

Every line below follows the rules above. The step 2 and step 3 texts never change: "Meet up / In Long Beach, checked with you" and "Get paid / Cash, at the meeting".

### Apple

**iPhone**
- Models line: iPhone 11 and newer, every size
- Step 1: Model, storage and carrier
- Selling points: Cracked screens too · Unlocked or on a carrier · No shipping, no labels
- Headlines: Your old iPhone, cash in hand. · Spare iPhone? Spare cash. · Upgraded? Sell the old iPhone. · Two iPhones, one pocket? · Your old iPhone is cash. · Old iPhone. New money. · That iPhone in the drawer? Cash. · Cracked, old or spare. We buy iPhones. · Sell the iPhone you stopped using. · Last year's iPhone, this year's cash. · Still works? Still worth it. · Pro, Pro Max or mini. We buy them.
- Pictures: 3 to 5 iPhones from different years (11 up to the newest) in different colours, the newest in front.

**iPad**
- Models line: iPad, iPad mini, iPad Air and iPad Pro
- Step 1: Model, size and storage
- Selling points: Cracked screens too · Wi-Fi or cellular · No shipping, no labels
- Headlines: Old iPad. New money. · iPad in a drawer? Sell it. · Upgraded? Sell the old iPad. · Spare iPad? Spare cash. · iPad gathering dust? We buy it. · Cracked iPad screen? Still worth something. · Your old iPad is cash. · Done with the iPad? We buy it.

**MacBook**
- Models line: MacBook Air and MacBook Pro, M1 and newer
- Step 1: The year, chip and memory
- Selling points: Bring the charger if you have it · Signed out of iCloud · No shipping, no labels
- Headlines: Old MacBook. New money. · MacBook in the closet? Sell it. · Your old MacBook is cash. · Graduated? Sell the college MacBook. · Done with your MacBook? We buy it. · Cracked MacBook screen? Still worth something. · Air or Pro? We buy both. (show one of each) · Upgraded? Sell the old MacBook.

**Desktop Mac**
- Models line: iMac, Mac mini and Mac Studio
- Step 1: The model, chip and memory
- Headlines: Old Mac, cash in hand. · Your old iMac is cash. · iMac, mini or Studio. We buy them. · Sell your Mac the easy way. · Mac mini on a shelf? Sell it. · Upgraded your desk? Sell the old Mac.

**Apple Watch**
- Models line: Apple Watch Series, SE and Ultra
- Step 1: Series, size, GPS or cellular
- Selling points: Series, SE or Ultra · GPS or cellular, any size · Unpaired and reset
- Headlines: Your old Apple Watch is cash. · New watch? Sell the old one. · Apple Watch in a drawer? Sell it. · Get cash for your old Apple Watch. · We buy Apple Watches. Cash, in person. · Upgraded your watch? Sell the old one.

**All Apple devices** (one per 100; the picture shows every device the models line names)
- Models line: iPhone, iPad, MacBook, iMac and Apple Watch
- Step 1: What you have, in a few words
- Headlines: iPhone to iMac. We buy them. · Upgraded everything? Sell the rest. · Your old Apple devices, one meeting. · Apple devices in the drawer? Cash. · Sell your Apple gear in one meeting.

### Android

**Samsung Galaxy**
- Models line: Galaxy S21 and newer, Ultra too
- Step 1: Model, storage and carrier
- Selling points: Unlocked or on a carrier · Signed out of Google · No shipping, no labels
- Headlines: Your old Galaxy is cash. · Upgraded? Sell the old Galaxy. · Galaxy in a drawer? Sell it. · Spare Galaxy? Spare cash. · Old Galaxy. New money. · Ultra, Plus or S. We buy them. · Done with the Galaxy? We buy it. · Cracked Galaxy screen? Still worth something.
- Pictures: current Galaxy S phones from the front and the back; never a phone of another brand.

**Google Pixel**
- Models line: Pixel 7 and newer, Pro too
- Step 1: Model, storage and carrier
- Headlines: Your old Pixel is cash. · Pixel in a drawer? Sell it. · Upgraded? Sell the old Pixel. · Spare Pixel? Spare cash. · Old Pixel. New money. · Pixel or Pixel Pro? We buy both.

**Foldables**
- Models line: Galaxy Z Fold, Z Flip and Pixel Fold
- Step 1: Model, storage and the hinge
- Selling points: Screen protector on or off · Signed out of Google · No shipping, no labels
- Headlines: Fold or Flip? We buy both. (show one of each) · Your old foldable is cash. · Folding phone? Sell it. · Upgraded your Fold? Sell the old one. · Flip in a drawer? Sell it.

**Android tablets**
- Models line: Galaxy Tab and Pixel Tablet
- Step 1: Model, size and storage
- Headlines: Android tablet? We buy it. · Tablet in a drawer? Sell it. · Galaxy Tab gathering dust? We buy it.

### Gaming

**Consoles**
- Models line: PS5, PS5 Pro, Xbox Series X and S
- Step 1: Model, storage, disc or digital
- Selling points: Bring the controller and cables · Signed out of your account · No shipping, no labels
- Headlines: PS5 or Xbox? We buy both. (show both) · Console in the closet? Sell it. · Your old console is cash. · Done gaming? Sell the console. · Upgraded to the Pro? Sell the old PS5. (PS5 picture) · Spare console? Spare cash. · Xbox in a drawer? Sell it. (Xbox picture) · Old console. New money.

**Nintendo Switch**
- Models line: Switch, Switch OLED and Switch 2
- Step 1: Model, and the Joy-Con with it
- Headlines: Switch in a drawer? Sell it. · Your old Switch is cash. · Got the Switch 2? Sell the old one. · Switch OLED? We buy it.

**PC handhelds** (no clean picture yet: type layout)
- Models line: Steam Deck, ROG Ally, Legion Go and MSI Claw
- Step 1: Model and storage
- Headlines: Steam Deck or ROG Ally? We buy both. · PC handheld? Get cash for it. · Steam Deck in a drawer? Sell it. · Done with the Ally? We buy it.

**Controllers**
- Models line: DualSense, DualSense Edge and Xbox controllers
- Step 1: Which ones, and how many
- Selling points: Drift or worn sticks, say so · Bring the cables if you have them · No shipping, no labels
- Headlines: Spare controllers? Get cash. · Extra DualSense? Sell it. · A drawer of controllers? Cash. · Elite or Edge? We buy both. (show both)

**Gaming laptops**
- Models line: Gaming laptops, RTX 30 series and newer
- Step 1: Model, GPU and memory
- Headlines: Gaming laptop? We buy it. · Upgraded your rig? Sell the laptop. · Your old gaming laptop is cash.

**Gaming PCs** (type layout until there is a clean picture of a tower)
- Models line: Towers with an RTX 30 series card or newer
- Step 1: The CPU, GPU and memory
- Headlines: Gaming PC? We buy the whole rig. · Selling your gaming PC? · New build? Sell the old one.

**VR headsets**
- Models line: Meta Quest 3, Quest 3S and Quest 2
- Step 1: Model, storage, controllers
- Headlines: Quest in a drawer? Sell it. · Your old VR headset is cash. · Done with VR? We buy the Quest.

### Audio

**Headphones**
- Models line: Bose, Sony, Sennheiser, Beats and AirPods Max
- Step 1: Brand and model
- Selling points: Bring the case if you have it · Worn pads, say so · No shipping, no labels
- Headlines: Headphones you never wear? Sell them. · Bose, Sony or Beats? We buy them. · Upgraded your headphones? Sell the old pair. · Your old headphones are cash. · AirPods Max in a drawer? Sell them. (AirPods Max picture)

**Earbuds**
- Models line: AirPods Pro, Galaxy Buds and Pixel Buds
- Step 1: Brand, model and the case
- Headlines: Spare earbuds? Get cash. · Earbuds in a drawer? Sell them. · Upgraded your AirPods? Sell the old pair. (AirPods picture)

**Gaming headsets** (type layout until there is a clean picture)
- Models line: Astro A50 X, Turtle Beach Stealth, SteelSeries Arctis
- Step 1: Brand, model and the base
- Headlines: Gaming headset? Get cash for it. · A50 X or Stealth? We buy both. · Upgraded your headset? Sell the old one.

### Computers and parts

**Monitors**
- Models line: Gaming and office monitors, 24 inch and up
- Step 1: Brand, size and refresh rate
- Selling points: Bring the stand and cables · Dead pixels, say so · No shipping, no labels
- Headlines: Extra monitor? We buy it. · Upgraded your screen? Sell the old one. · Second monitor gathering dust? Sell it.

**SSDs** (type layout)
- Models line: NVMe and SATA, 1TB and up, sealed or used
- Step 1: Brand, model and capacity
- Headlines: Spare SSDs? We buy them. · Sealed SSDs? Get cash. · Upgraded your drive? Sell the old one.

**Mini PCs** (type layout until there is a clean picture)
- Models line: Mac mini, Intel NUC, Beelink and Minisforum
- Step 1: Model, chip and memory
- Headlines: Mini PC on a shelf? Sell it. · Mac mini or NUC? We buy both.

**Sealed Chromebooks** (type layout)
- Models line: Sealed Chromebooks, new in the box
- Step 1: Model, and a photo of the seal
- Selling points: Still in the sealed box · One or a stack · No shipping, no labels
- Headlines: Sealed Chromebooks? We buy them. · New in the box? Get cash.

**Windows laptops**
- Models line: Windows laptops, recent models
- Step 1: Model, chip and memory
- Headlines: Windows laptop? We buy it. · Old laptop? New money.

### Wearables

**Meta glasses** (type layout until there is a clean picture)
- Models line: Ray-Ban Meta and Oakley Meta glasses
- Step 1: Model and the charging case
- Headlines: Ray-Ban Meta glasses? We buy them. · Smart glasses? Get cash.

**Smartwatches**
- Models line: Galaxy Watch, Pixel Watch and more
- Step 1: Brand, model and size
- Headlines: Smartwatch in a drawer? Sell it. · Your old smartwatch is cash.

### Cameras

**Cameras**
- Models line: Mirrorless and DSLR bodies and lenses
- Step 1: Body, lenses and shutter count
- Headlines: Camera in a bag? Sell it. · Upgraded your camera? Sell the old one.

**Drones**
- Models line: DJI Mini, Air and Mavic
- Step 1: Model, batteries and controller
- Headlines: Drone grounded? Get cash. · Your old drone is cash.

## The review of the first 50

Every one of the 50 was read against the new rules. The number (80px, `number-report-80.json`) and the spacing were measured when it was set; the review found no overlap at sheet size. Six headlines claim more than the ad shows or the shop buys. Both versions of each (marketplace and social) should be drawn again with the headline on the right:

| Ad | Headline now | What is wrong | Say instead |
|---|---|---|---|
| 02 | iPhone, iPad, MacBook. We buy all three. | The picture shows an Apple Watch too, and the models line names five devices. | iPhone to iMac. We buy them. |
| 10 | Tablet gathering dust? We buy it. | The models line is iPad only; "tablet" invites every brand. | iPad gathering dust? We buy it. |
| 14 | Every Apple device in the drawer is cash. | Not every one: iPhone 11 and newer, M1 and newer. | Apple devices in the drawer? Cash. |
| 26 | Every old Apple device, one meeting. | The same overclaim. | Your old Apple devices, one meeting. |
| 31 | SELL ALL YOUR APPLE GEAR IN ONE MEETING. | "All". | SELL YOUR APPLE GEAR IN ONE MEETING. |
| 38 | Get cash for the whole drawer. | Cables, cases and old models are not bought. | Cash for the devices in your drawer. |

## What the Studio does with this

- `offer-library.js` builds the family at load: 35 buying lines, 161 cards, in the new Studio categories Gaming & Consoles, Headphones & Audio, Computers & Parts, Wearables & Glasses and Cameras & Drones, in Phones & Devices for Apple, Samsung, Pixel, foldables and Android tablets, and in the library's first seven categories (gold, silver, coins, cars, test strips, Pokémon cards, sports cards).
- The product pictures are the library's own, checked 2026-09-27 by OCR over all 478, by an edge test for pictures cut off at the frame (`scripts/cutout_edges.py`), and by eye over every one a live template uses. 59 failed (garbled lettering, a phone that is not the model its name says, cut off at the frame, broken, too small, or the wrong goods) and are listed in `assets/cutout-flags.json`. A card that drew one got a whole, clean picture of the same kind, or is held back.
- `scripts/audit_templates.mjs` holds every Studio template to the showcase's bar; what fails is listed in `template-holds.js`, which the app leaves out.
- Lines with no clean picture yet (PC handhelds, gaming PCs, gaming headsets, SSDs, mini PCs, sealed Chromebooks, Meta glasses) are set in type. To add a picture: put the cut-out in `assets/cutouts/` (at least 1.5x the size it is drawn), run the OCR and eye check, and give the line a `sets` entry in `offer-library.js` with the picture's pixel size in `SIZE`.
