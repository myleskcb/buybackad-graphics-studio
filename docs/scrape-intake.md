# Scraped photographs into the engine

The owner, 2026-09-27: "We can just scrape separately and implement as assets
into our engine." This is the list of what to fetch first and the one command
that turns the files into assets the Studio draws.

## How to land them

1. Put the files in `incoming/` at the repo root (git ignores the folder).
2. Optionally add `incoming/manifest.csv` (see the example below). Without it,
   every file is a product picture named after its file.
3. `python3 scripts/ingest_assets.py`: a dry run. It writes
   `incoming/_review.jpg`, which shows every file cut out on a light and a dark
   ground with its verdict.
4. `python3 scripts/ingest_assets.py --write`: lands the ones marked ok.
5. `node scripts/audit_templates.mjs --write`: a picture that does not work
   on a card is held back. If a file replaced a placeholder, also run the
   showcase chain (OPEN-ITEMS §N).

Needs `pip install pillow numpy opencv-python-headless`.

What the script does with each kind:

- **cutout** (a product): a packshot on a plain background (white, grey, any
  flat colour) is cut out automatically; a PNG or WebP that already has
  transparency is kept as it is. It is refused when the product runs off the
  edge of the photograph (cut off), when it is under 600px on its long side
  (1000px is the aim), or when the background is busy (a desk, a hand, a
  shop): that one needs cutting out by hand first.
- **photo** (a ground behind the offer cards): centre-cropped to the 1080 card
  and measured so the shade under its white type is exactly as strong as it
  needs to be (DESIGN-LAW 56).

Everything landed is credited (`assets/cutouts/ATTRIBUTION.json`,
`assets/bg-offer/ATTRIBUTION.json`), registered in `assets/library.json`,
approved in `assets/approved-assets.json` under `sourced` (the owner chose
it), and wired into the offer family through `offer-assets.js`: a cutout joins
its `line`'s pictures, a type-only line gets picture layouts once it has one,
and a `replaces` retires a placeholder on the offer cards and the showcase.

## manifest.csv

```
file,id,kind,category,line,subject,source,license,artist,replaces
psa-basketball-rookie.jpg,sports-psa-rookie-1,cutout,sports,sports,a PSA 10 basketball rookie card straight on,https://...,retailer listing,,ph-sports-slab
topps-chrome-hobby.png,sports-box-topps-chrome,cutout,sports,sports,a sealed Topps Chrome hobby box,https://...,maker image,Topps,ph-sports-box
card-show-aisle.jpg,ground-card-show,photo,sports,sports,,https://commons.wikimedia.org/...,CC BY-SA 4.0,Name,
```

`line` is an offer line key: iphone, ipad, mac, watch, galaxy, pixel,
foldable, tablet, console, switch, controller, gamelaptop, vr, pchandheld,
gamingpc, headphones, earbuds, headset, speaker, monitor, laptop, ssd, minipc,
chromebook, metaglasses, smartwatch, gold, silver, coins, car, strips,
pokemon, sports, camera, drone.

## What to fetch first

The placeholders to retire are named `ph-*`. Shoot or fetch straight-on
packshots, whole, on a plain background, 1000px or more on the long side.

1. **Sports cards** (the owner: "we need actual cards"). Retire
   `ph-sports-slab`, `ph-sports-slabs-fan`, `ph-sports-cards-fan`,
   `ph-sports-box`.
   - Graded slabs with a real card in them (PSA, BGS, SGC), straight on: a
     basketball, a football and a baseball rookie.
   - Raw cards, fronts, and a fanned handful.
   - Sealed boxes: a hobby box and a blaster (Topps Chrome, Panini Prizm),
     three-quarter view, and a few packs.
   - Free sources: vintage cards are public domain in the US (published
     before 1929). The Library of Congress "Baseball Cards" collection
     (1887 to 1914, no known restrictions) and the Metropolitan Museum's
     Burdick collection (CC0) include the T206 set, the Honus Wagner among
     them. Modern cards and boxes are the makers' and retailers' images:
     record the source; whether to use them is the owner's call.
2. **Pokemon.** The only real picture now is `poke-psa-charizard` (a PSA 10
   1999 Charizard cut from a Commons photograph, 369 x 610, too small for the
   street templates). Wanted: booster boxes and Elite Trainer Boxes (sealed),
   booster packs, and graded slabs of the cards collectors ask about
   (Charizard, Pikachu, Umbreon), each 1000px or more.
3. **Test strips.** The only approved picture is a small fan of loose strips
   (`strip-boxes`, 444 x 418). Wanted: sealed boxes of OneTouch Ultra and
   Verio, Accu-Chek Guide, FreeStyle Lite and Libre sensors, Contour Next, as
   the makers photograph them.
4. **The type-only lines** (set in type because the library has no picture):
   Steam Deck OLED, ROG Ally X, Legion Go, MSI Claw; a gaming PC tower with a
   glass side; gaming headsets (Astro A50 X, Turtle Beach Stealth Pro,
   SteelSeries Arctis Nova Pro); SSDs (Samsung 990 Pro, WD Black SN850X,
   Crucial T700); mini PCs (Mac mini M4, Beelink, Minisforum); sealed
   Chromebook boxes (Acer, HP, Lenovo); Ray-Ban Meta glasses with the case.
   A line's headlines stay as they are, so pick pictures that show what they
   name ("Steam Deck or ROG Ally? We buy both." wants both).
5. **Phones without a photograph of their own** (they stand on NASA
   pictures today): Galaxy S24 and S25 Ultra, Pixel 9 and 9 Pro, Galaxy Z Fold
   and Flip, Pixel Fold, Galaxy Tab. Grounds (`kind=photo`) for the tech lines
   too: a gaming desk, a studio desk, a camera bag.
