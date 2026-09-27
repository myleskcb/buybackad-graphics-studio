#!/usr/bin/env node
/* RE-THEME THE TEMPLATES WE ALREADY HAVE.
 *
 * The previous lab composed new ads from scratch and they were worse than the
 * library — which was the wrong instinct twice over. There are 23 hand-built
 * layout architectures in this engine, they took real work, and the owner's
 * note is correct: the starting points are better than anything re-rolled from
 * nothing. So this changes the PALETTE and leaves the DESIGN alone.
 *
 * How: load the page with ?nofix=1 so the layer colours are the authored
 * palette values rather than the measured-contrast overrides, then map every
 * colour through its role — this template's palette bg1/ink/sub/a1/a2/deep to
 * the new theme's ground/ink/sub/accent/support/on-accent — and repaint.
 * Because the mapping is by ROLE, a layout keeps its structure, its rhythm and
 * its hierarchy and only changes clothes.
 *
 * Two things are fixed on the way through:
 *   · legacy hardware. qs-iphone-xs / xr / 11 / 12 and the gen13-14 cutouts are
 *     phones the shop no longer buys, so they are struck from the pool.
 *   · scrim direction. A pale theme cannot sit under a black scrim; the wash
 *     follows the theme's own lightness.
 *
 * usage: node scripts/retheme_lab.mjs      (needs a server on :8899)
 */
import puppeteer from 'puppeteer-core';
import { writeFileSync, mkdirSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { THEMES, FACES } from './theme_specs.mjs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = (process.env.GFX_BASE || 'http://localhost:8899/') + '?nofix=1';
const ROOT = new URL('../', import.meta.url).pathname;
const OUT = ROOT + (process.env.LAB_OUT ? process.env.LAB_OUT.replace(/\/?$/, '/') : '.render/retheme/');
mkdirSync(OUT, { recursive: true });

/* the authored palettes, read out of app.js exactly as theme_law.mjs does */
const SRC = readFileSync(ROOT + 'app.js', 'utf8');
const palSrc = SRC.slice(SRC.search(/const PAL = \{/), SRC.indexOf('\n  };', SRC.search(/const PAL = \{/)) + 4);
const PAL = (0, eval)('(' + palSrc.replace(/^const PAL = /, '').replace(/;\s*$/, '') + ')');

/* CURRENT HARDWARE ONLY. The shop does not buy iPhone 6/7/8/X any more, and an
   ad showing one says "we are out of date" before it says anything else. */
const LEGACY = /^(qs-)?iphone-(x|xr|xs|se|[5-9]|1[01])\b|^ip-gen\d*\b|^qs-iphone-(x|1[01])\b|^iphone-(trio-fan|tall-stack|fan-four|cracked|cracked-corner|cracked-severe)$/i;   // before the 12, and every ip-gen* AI render, are out
/* card cutouts that lost their faces to background removal — blank white
   slabs and stacks — are out: "broken card images that have lost a lot of
   detail" */
const BLANK = /^(poke-booster-box|poke-graded-slab|poke-slabs-trio|poke-cards-spread-face|poke-binder-open|sports-slab-graded|sports-cards-stack-loose|sports-cards|sports-slabs-fan-five|sports-binder-open|sports-slabs-stack|iphone-16-back-teal|iphone-17-pro-back-orange|iphone-back-flat-straight|iphone-back|iphone-six-grid|strip-boxes-cash|strip-boxes-fan|strip-boxes|strip-vials-pile|strip-box-single|strip-boxes-pile-large|strip-boxes-row-five|strip-boxes-stack|poke-packs-pile|poke-booster-packs-fan|sports-box-sealed|sports-cards-spread|mac-air-open-angle|mac-closed-side|mac-closed-topdown|mac-keyboard-topdown|mac-open-screen-on|mac-stack-closed-three|mac-with-accessories|macbook-closed-stack|macbook-open-front|macbook-pair-open-closed|macbook-open-angle|qs-ipad-[5-9]|qs-ipad-10|qs-ipad-air-[345]|qs-ipad-mini-[56]|qs-ipad-pro-11-4th-gen|qs-ipad-pro-12-9-[3456]th-gen|qs-ipad-pro-12-9-3rd-gen|qs-sheet-watch-s[5-8]-\d+|qs-sheet-watch-se-2020|qs-sheet-watch-se2-2022|qs-sheet-watch-ultra-2022)$/i;   // strips: diabetes only; Macs: no relics (pre-M-series bodies)   // …and the "iPhones" that are Androids or renders
/* measured luminance for every backdrop AND scene (scripts/measure_backdrops.mjs) */
const BG = JSON.parse(readFileSync(ROOT + 'assets/backdrop-lum.json', 'utf8'));
const ALL = readdirSync(ROOT + 'assets/cutouts').filter(f => /\.webp$/.test(f)).map(f => f.replace(/\.webp$/, ''));
/* The owner's asset pass (assets/approved-assets.json, 2026-09-03): 360 approved / 104 rejected of 464.
   The approved list is the pool; LEGACY (pre-12 iPhones, ip-gen renders) stays on top because the
   owner stated that rule twice; the rejected ids also feed the page-side BLANK filter. */
const ASSETPASS = JSON.parse(readFileSync(ROOT + 'assets/approved-assets.json', 'utf8'))['asset-grid-v1'] || { approved: [], rejected: [] };
const APPROVED_CUTS = new Set(ASSETPASS.approved), REJECTED = new Set(ASSETPASS.rejected);
const okCut = f => !LEGACY.test(f) && (APPROVED_CUTS.size ? APPROVED_CUTS.has(f) : !BLANK.test(f));
const modern = pres => ALL.filter(f => pres.some(p => f.startsWith(p)) && okCut(f));
/* Pools keyed on what the HEADLINE actually says. Keying them on the category
   put a Google Pixel on an ad reading "SELL YOUR iPHONE" — the deck is called
   `phones` and sells several brands, but the headline names one. The headline
   wins. */
const CUTS = {
  /* no ip-gen* renders: they are AI drawings — the "17 Pro Max" had no logo
     and a camera plateau Apple never shipped ("FAKE iPHONE", owner,
     2026-09-02). The qs-* press images and the iphone-17-pro-back-* photos
     are the real phones. */
  phones:  modern(['iphone-1','qs-iphone-17','qs-iphone-16','iphone-trio','iphone-fan',
                   'iphone-pair','iphone-screen-on','iphone-floating','iphone-hand',
                   'iphone-in-hand','iphone-back','iphone-front','iphone-cracked','iphone-boxed']),
  gold:    modern(['gold-','cash-']),
  silver:  modern(['silver-']),
  coins:   modern(['coin-']),
  cars:    modern(['car-']),
  strips:  modern(['strip-']),
  pokemon: modern(['poke-']),
  sports:  modern(['sports-']),
};

/* Five palettes the owner kept, spanning near-white to deep, applied across
   twenty existing layouts. 20 x 5 = 100 variations of designs that already work. */
/* Palettes kept in BOTH of the owner's shortlists, conventional pairings
   first: paper + gold, paper + mint, jewel blue, duotone blue, sunlit gold.
   The niche combinations stay in theme_specs.mjs; they just do not get a
   fifth of the frames. */
/* su02 (Sunlit gold) took 4 approvals of 20 and read as dull; cd06 (Candy
   blue) was kept in both earlier shortlists. Swapping the weakest donor for a
   vibrant one only touches the 20 cards that were mostly unapproved anyway. */
/* Ten palettes, led by the approval counts from the 4-up review (Blue Market
   13, Blue Ticket 12, Mint Counter 11, Gold Offer 8), then the vibrant ones
   kept in both earlier shortlists. Sunlit is out. */
let DONORS = process.env.LAB_DONORS ? process.env.LAB_DONORS.split(',') : ['du07','jw05','pp04','pp02','cd06','jw07','du08','pa05','ca07','io03',
  /* set 4: six palettes outside the blue family — candy pink and mint, orchid
     and wine jewels, a peach glass, a green duotone */
  'cd10','cd04','jw03','gl02','du05'];
/* a locked-theme run needs every palette its themes ask for, not the shortlist */
if (process.env.LAB_LOOKS){
  const want = [...new Set(JSON.parse(readFileSync(ROOT + 'assets/looks.json', 'utf8')).looks.flatMap(L => L.palettes || []))];
  want.forEach(p2 => { if (!DONORS.includes(p2)) DONORS.push(p2); });
  console.log('donors widened for looks: ' + DONORS.length);
}
/* a donor listed twice minted two cards with one id (a phones card and a
   sports card both called voltStack-du07-40); their records overwrote each
   other and every "brand"/"duplicate" hit traced back here */
for (let i = DONORS.length - 1; i >= 0; i--) if (DONORS.indexOf(DONORS[i]) !== i) DONORS.splice(i, 1);
const FRESH = ['cd10','cd04','jw03','gl02','du05', 'nn01','nn05','ck01','ck03'];   // the last four: Night Neon and Chalk, 2026-09-02

/* DEVICE-LINE DECKS. assets/library.json already carries the real taxonomy —
   iphones 116 assets, macbooks 55, ipads 49, watch 23, samsung 22, pixel 10 —
   but DECKS in app.js still lumps all of it under one "phones" deck whose
   headline reads iPHONE. That mismatch is what put a Pixel on an iPhone ad.
   Samsung and Pixel are categories, so they get their own headline, their own
   item list and their own product pool. */
const DEVICE_DECKS = {
  iphone:  { k:'APPLE BUYER', h1:'SELL YOUR', h2:'iPHONE',
             items:'iPhone 17 • 16 • 15 • Pro & Pro Max',
             sub:'SAME-DAY PAYMENT, EVERY TIME\nCRACKED, LOCKED OR BLACKLISTED\nWE MEET YOU LOCALLY OR YOU MAIL IT IN',
             cta:'GET YOUR OFFER', price:'UP TO $1,100 PAID TODAY', big:'$1,100',
             /* Current hardware, hero shots first: 17 Pro, 16, 15 Pro and the
                gen16/17 renders, plus the group and in-hand shots that actually
                sell. No 6/7/8/X, no SE, nothing pre-15 unless it is a group. */
             badges:['LICENSED','INSURED','LOCAL'],
             /* Hero first. The orange 17 Pro Max is the device the owner calls
                the money maker, so it leads rather than turning up by rotation. */
             cuts:['own-apple-cosmic-orange','iphone-17-pro-back-black','iphone-17-pro-back-silver',
                   'qs-iphone-17-pro-max','qs-iphone-17-pro','qs-iphone-17-air','qs-iphone-17',
                   'iphone-16','iphone-15-pro',
                   'iphone-trio-fan','iphone-fan-four','iphone-pair-front-back',
                   'iphone-screen-on-glow','iphone-floating-tilt','iphone-hand-back-offer',
                   'iphone-in-hand-screen-on','ip-group-colour-lineup','ip-group-stagger-three'],
             /* Apple studio photography, not a bokeh desk shot. These are the
                press-release-style flat lays already in assets/scenes, and
                nothing in them predates the current hardware. */
             scenes:['scene-flat-iphones','scene-studio-blue-trio','scene-studio-green-trio',
                     'scene-studio-rose-pair','scene-studio-slate-quad'] },
  samsung: { k:'LICENSED SAMSUNG BUYER', h1:'SELL YOUR', h2:'SAMSUNG',
             items:'Galaxy S25 • S24 • Ultra • Fold • Flip',
             sub:'SAME-DAY PAYMENT, EVERY TIME\nFOLDS AND FLIPS INCLUDED\nCRACKED SCREENS STILL PAID',
             cta:'GET YOUR OFFER', price:'UP TO $900 PAID TODAY', big:'$900',
             badges:['LICENSED','INSURED','LOCAL'], cuts:['sam-','samsung-'] },
  pixel:   { k:'LICENSED PIXEL BUYER', h1:'SELL YOUR', h2:'PIXEL',
             items:'Pixel 9 • Pro • Pro XL • Fold • Watch',
             sub:'SAME-DAY PAYMENT, EVERY TIME\nANY CARRIER, ANY CONDITION\nWE COME TO YOU ACROSS LA & OC',
             cta:'GET YOUR OFFER', price:'UP TO $750 PAID TODAY', big:'$750',
             badges:['LICENSED','INSURED','LOCAL'], cuts:['pix-'] },
  ipad:    { k:'APPLE BUYER', h1:'SELL YOUR', h2:'iPAD',
             items:'iPad Pro • mini • Air • Regular • with Pencil',
             sub:'SAME-DAY PAYMENT, EVERY TIME\nWI-FI OR CELLULAR, ANY SIZE\nCRACKED GLASS STILL PAID',
             cta:'GET YOUR OFFER', price:'UP TO $850 PAID TODAY', big:'$850',
             badges:['LICENSED','INSURED','LOCAL'], cuts:['qs-ipad-pro-13-m5','qs-ipad-pro-11-m5','qs-ipad-air-13-m3','qs-ipad-air-11-m3','qs-ipad-mini-7','qs-ipad-11-a16','ipad-'], scenes:['scene-flat-ipads','scene-studio-amber-ipad'] },
  watch:   { k:'APPLE BUYER', h1:'SELL YOUR', h2:'APPLE WATCH',
             items:'Series 11 • Ultra 3 • SE 3 • Series 10',
             sub:'SAME-DAY PAYMENT, EVERY TIME\nANY SIZE, ANY BAND, ANY FINISH\nCRACKED GLASS AND WORN BANDS FINE',
             cta:'GET YOUR OFFER', price:'UP TO $600 PAID TODAY', big:'$600',
             badges:['LICENSED','INSURED','LOCAL'], cuts:['qs-sheet-watch-s11','qs-sheet-watch-ultra3','qs-sheet-watch-se3','qs-sheet-watch-s10','apple-watch-','watch-'], scenes:['scene-studio-teal-watch'] },
  macbook: { k:'APPLE BUYER', h1:'SELL YOUR', h2:'MACBOOK',
             items:'MacBook Air • Pro • M1 through M5',
             sub:'SAME-DAY PAYMENT, EVERY TIME\nBATTERY OR SCREEN FAULTS FINE\nWRITTEN OFFER BEFORE YOU DECIDE',
             cta:'GET YOUR OFFER', price:'UP TO $1,900 PAID TODAY', big:'$1,900',
             badges:['LICENSED','INSURED','LOCAL'],
             cuts:['qs-device-macbook-pro','qs-device-macbook-air','own-stock-macbook-open','own-stock-macbook-stack','mac-pro-open-front','macbook-open','mac-pair-open-angle','mac-half-open-glow','qs-set-macbook-pair','mac-'],
             scenes:['scene-own-macbook-open','scene-own-macbook-stack','scene-grad-mac-gold'] },
};

/* HOT CARDS, BY NAME. The card cutouts are generic blanks and they read as
   "we do not really know this market", which is fatal for a card seller. The
   fix is not to generate card art — a convincing Charizard or an EX/GX face is
   Nintendo/Creatures IP and a fake one is worse than useless. Real buyer ads
   signal expertise by NAMING what they buy, which is ordinary nominative use.
   So the copy carries the sets, the card types and the names people actually
   search, and the art stays honest: slabs, binders and sealed boxes. */
/* HERO PRODUCT ORDER, per the owner. What leads an ad decides whether anyone
   reads it, so the desirable piece goes first instead of arriving by rotation:
   a Cuban bracelet and a president-style gold watch, not a scrap pile. */
const HERO = {
  gold:   ['gold-bracelet-cuban','gold-watch-luxury','gold-chains-pile','gold-nuggets-raw',
           'gold-class-ring','gold-necklace-single','gold-bracelet-pair','gold-rings-scatter'],
  silver: ['silver-jewelry-mixed','silver-rounds-pile','silver-bars-stack','silver-coins-spill',
           'silver-flatware-set','silver-tea-set'],
  coins:  ['coin-graded-fan-three','coin-slab-graded','coin-single-large','coin-collection-tray',
           'coin-slabs-stack','coin-silver-dollar-pair'],
  /* car-classic-side is cropped at the rear in the asset itself — it reads as
     "chopped" wherever it lands — so it goes last */
  cars:   ['car-keys-fob','car-hand-keys-over','car-title-keys','car-keys','car-sedan-front',
           'car-truck-front','car-suv-side','car-classic-side'],
};

const CATEGORY_COPY = {
  coins:   { k:'COIN BUYER', h1:'WE BUY', h2:'COINS',
             items:'Grails • Morgans • Peace Dollars • Key Dates • Junk Silver • Centenarios • Eagles • Proof Sets',
             sub:'MS AND PF GRADES, RAW OR SLABBED\\n90% JUNK SILVER PAID BY WEIGHT\\nWHOLE COLLECTIONS AND ESTATES',
             price:'PAID ON THE SPOT, AT SPOT', big:'SPOT', cta:'REQUEST AN APPRAISAL',
             badges:['LICENSED','INSURED','DISCREET'], cuts:['coin-'] },
  cars:    { k:'CAR BUYER', h1:'WE BUY', h2:'CARS',
             items:'Title In Hand • Running Or Not • High Miles • Salvage • Lien Payoff • Free Tow',
             sub:'CASH IN HAND BEFORE WE TOW\\nTITLE, DMV AND LIEN PAYOFF HANDLED\\nSAME-DAY PICKUP ACROSS LA & OC',
             price:'UP TO $15,000 CASH', big:'$15,000', cta:'GET AN INSTANT OFFER',
             /* cars only: the motorcycle, the pickup and the cargo van now
                belong to their own decks below */
             badges:['FREE TOW','SAME DAY','LICENSED'],
             cuts:['car-keys','car-hand','car-title','car-sedan','car-suv','car-classic','car-front','car-engine','car-damaged','car-wheel'] },
  /* VEHICLE SPIN-OFFS. Owner, 2026-09-02: "WE BUY BIKES can be a category
     (spin off of cars), trucks too, work vans". They ride the cars templates
     the way the Apple lines ride the phones templates: same layouts, their
     own headline, items, claims and product pool, and their own photographs
     (`bgcat` picks the web backdrop pool) so a bike ad never sits on a car
     key. Every claim is bounded the way the owner asked. */
  bikes:   { k:'MOTORCYCLE BUYER', h1:'WE BUY', h2:'MOTORCYCLES', bgcat:'bikes',
             items:'Harley • Honda • Yamaha • Kawasaki • Ducati • Dirt Bikes • Scooters',
             sub:'TITLE OR NOT, RUNNING OR NOT\\nCASH IN HAND BEFORE WE LOAD IT\\nFREE PICKUP ACROSS LA & OC',
             price:'UP TO $12,000 CASH', big:'$12,000', cta:'GET AN INSTANT OFFER',
             badges:['FREE PICKUP','SAME DAY','LICENSED'], cuts:['car-motorcycle','bike-'] },
  trucks:  { k:'TRUCK BUYER', h1:'WE BUY', h2:'TRUCKS', bgcat:'trucks',
             items:'F-150 • Silverado • Ram • Tacoma • Tundra • Diesel • Lifted • High Miles',
             sub:'CASH IN HAND BEFORE WE TOW\\nTITLE, DMV AND LIEN PAYOFF HANDLED\\nSAME-DAY PICKUP ACROSS LA & OC',
             price:'UP TO $25,000 CASH', big:'$25,000', cta:'GET AN INSTANT OFFER',
             badges:['FREE TOW','SAME DAY','LICENSED'], cuts:['car-truck','truck-'] },
  vans:    { k:'FLEET & VAN BUYER', h1:'WE BUY', h2:'WORK VANS', bgcat:'vans',
             items:'Transit • Sprinter • ProMaster • Express • NV • Cargo & Passenger • Fleet Lots',
             sub:'ONE VAN OR THE WHOLE FLEET\\nTITLE AND LIEN PAYOFF HANDLED\\nPAID BEFORE WE DRIVE IT AWAY',
             price:'UP TO $20,000 CASH', big:'$20,000', cta:'GET AN INSTANT OFFER',
             badges:['FLEETS OK','SAME DAY','LICENSED'], cuts:['car-van','van-'] },
  strips:  { k:'STRIP BUYER', h1:'CASH FOR', h2:'TEST STRIPS',
             items:'OneTouch • FreeStyle • Contour • Accu-Chek • Dexcom Sensors • In-Date Sealed',
             sub:'SEALED, IN-DATE BOXES ONLY\\nLOCAL PICKUP OR PREPAID MAIL-IN\\nPAID THE DAY WE RECEIVE THEM',
             price:'TOP BOX PRICES PAID', big:'TOP $', cta:'GET YOUR OFFER',
             badges:['DISCREET','FAST','FAIR'], cuts:['strip-'] },
  /* the metals: the number is the message. "Current market rates" is what
     everyone says; 95% of spot is a claim a seller can check. */
  gold:    { k:'GOLD BUYER', h1:'CASH FOR', h2:'GOLD',
             items:'10k • 14k • 18k • Scrap & Dental • Cuban Links • Rolex • Cartier • Tiffany • Yurman',
             sub:'TESTED AND WEIGHED IN FRONT OF YOU\nWRITTEN OFFER BEFORE YOU DECIDE\nESTATES HANDLED DISCREETLY',
             price:'PAYING 95% OF SPOT PRICE', big:'95%', cta:'GET A FREE QUOTE',
             badges:['LICENSED','INSURED','PRIVATE'], cuts:['gold-'] },
  silver:  { k:'SILVER BUYER', h1:'WE BUY', h2:'SILVER',
             items:'Sterling • .925 • Silverware • Antiques • Tiffany & Co • David Yurman • Chrome Hearts',
             sub:'WEIGHED IN FRONT OF YOU, SPOT SHOWN\nSTERLING, JUNK SILVER, 90% COINS, TEA SETS\nANTIQUE AND ESTATE PIECES WELCOME',
             price:'PAYING 95% OF SPOT PRICE', big:'95%', cta:'GET A FREE QUOTE',
             badges:['LICENSED','INSURED','LOCAL'], cuts:['silver-'] },
  pokemon: { k:'COLLECTIONS WANTED', h1:'WE BUY', h2:'POKÉMON',
             items:'Grails Wanted • Charizard • Moonbreon • Alt Arts • Illustration Rares • ETBs • WOTC',
             sub:'GRADED SLABS AND RAW, PSA 10 TO UNGRADED\nSEALED BOOSTER BOXES AND VINTAGE WOTC\nFREE APPRAISAL, WE SORT IT FOR YOU',
             price:'UP TO $10,000 PER CARD', big:'$10,000',
             cta:'REQUEST AN APPRAISAL', badges:['TRUSTED','INSURED','LOCAL'],
             /* boxes, binders and packs before loose slabs: a blank card face
                reads as a placeholder, and a sealed box reads as a real buyer */
             cuts:['poke-booster-box','poke-elite-box','poke-binder-open',
                   'poke-packs-pile','poke-booster','poke-slabs-trio'] },
  sports:  { k:'COLLECTIONS WANTED', h1:'WE BUY', h2:'SPORTS CARDS',
             items:'Grails Wanted • Rookies • Autos • Patches • Numbered /99 • Wemby • Ohtani • Clark',
             sub:'PSA, BGS AND SGC SLABS OR RAW\nROOKIE AUTOS, PATCHES AND NUMBERED\nWE BUY ENTIRE COLLECTIONS OUTRIGHT',
             price:'UP TO $5,000 PER CARD', big:'$5,000',
             cta:'REQUEST AN APPRAISAL', badges:['TRUSTED','INSURED','LOCAL'],
             cuts:['sports-box-sealed','sports-binder-open','sports-slabs-fan-five',
                   'sports-slabs-stack','sports-slab-graded'] },
};

/* CHALLENGE MODE — name the competitor a seller has already shopped.
   People have a Carvana number in their phone and an ecoATM quote in their
   head; an ad that names them is an ad about the seller's actual situation.
   Named companies get COMPARISON copy (bring their offer, we top it), which is
   ordinary comparative advertising as long as it is true. The sharp phrasing —
   lowballed, offered you pennies — goes on generic targets: the pawn shop, a
   reseller, the mall kiosk. Applied to a third of the cards, by seed. */
const CHALLENGE = {
  /* Only places that make WHOLESALE offers. eBay and Facebook Marketplace are
     where retail buyers are — "we beat them" is a claim we would lose, and a
     marketplace is a venue, not a buyer. Names over 12 characters stay on the
     kicker; the headline takes the short ones or a category line. */
  phones:  { names:['ECOATM','GAZELLE','BACK MARKET','APPLE TRADE IN','BEST BUY','VERIZON','T-MOBILE'],
             generic:['A RESELLER','THE KIOSK','THE MALL KIOSK'] },
  gold:    { names:['CASH4GOLD','THE PAWN SHOP','EZPAWN','THE MALL JEWELER'],
             generic:['THE PAWN SHOP','A GOLD PARTY'] },
  silver:  { names:['THE PAWN SHOP','THE COIN SHOP','THE MAIL-IN BUYERS'],
             generic:['THE PAWN SHOP','A RESELLER'] },
  coins:   { names:['THE COIN SHOP','THE PAWN SHOP','THE MAIL-IN BUYERS'],
             generic:['A RESELLER','THE PAWN SHOP'] },
  cars:    { names:['CARVANA','CARMAX','KBB','AUTONATION','THE DEALER'],
             generic:['THE DEALER','A WHOLESALER'] },
  strips:  { names:['THE MAIL-IN SITES','THE OTHER BUYERS'],
             generic:['A MAIL-IN SITE','A RESELLER'] },
  pokemon: { names:['TCGPLAYER','GAMESTOP','THE CARD SHOP'],
             generic:['A RESELLER','A SCALPER'] },
  sports:  { names:['GOLDIN','FANATICS','THE CARD SHOP'],
             generic:['A RESELLER','A SCALPER'] },
  lines: {
    // strings, not functions: this object crosses into the page as JSON
    kicker:  ['{N} OFFERED YOU WHAT?', 'LOWBALLED BY {N}?', '{N} OFFERED PENNIES?', 'GOT A {N} QUOTE?'],
    h1:      ['WE BEAT', 'WE TOP', 'WE MATCH', 'WE OUTBID'],
    h2:      { cars:'TRADE-IN OFFERS', phones:'BUYBACK OFFERS', gold:'THE PAWN SHOP', silver:'THE PAWN SHOP',
               coins:'THE COIN SHOP', strips:'MAIL-IN OFFERS', pokemon:'THE CARD SHOP', sports:'THE CARD SHOP',
             },
    /* every claim names WHO we beat — "any written offer" is "too ambitious,
       gives room for scammers to lie". {N} is the competitor on the card. */
    price:   ['BRING YOUR {N} QUOTE — WE TOP IT', 'MORE THAN {N}, PAID SAME DAY', 'SHOW US THE {N} NUMBER. WE FIX IT.', 'THE {N} NUMBER, PAID TODAY, NO FEES'],
    promise: ['We top the {N} number or tell you to take it. Straight answers only.',
              'Screenshot your {N} quote. We beat it or we say so.',
              'No bots, no kiosks. A written offer from a real buyer.',
              /* "we match is a good selling point too… you have to jump through
                 hoops and ladders, or delayed payouts, or fees" */
              'We match the {N} number without the hoops: no fees, no waiting, cash today.',
              'Their offer, minus the ladders: same number, paid before we leave.'],
  },
};

/* SUB-CATEGORIES (2026-09-03, "so sub categories"). Each one is a deck of
   its own: kicker, opener, money line, spec line, items, jargon, product
   prefixes and a photo pool. The engine walks them the way it walks the
   Apple lines. `ready` says whether the library can carry it today; a
   sub-category without products falls back to its parent's pool. Switched
   on with LAB_SUBCATS=1 for the next batch. */
const SUBCATS = {
  gold: [
    { key:'chains',    k:'GOLD BUYER',   h2:'GOLD CHAINS',     spec:'CUBAN, ROPE, FIGARO, BYZANTINE', items:'10k • 14k • 18k • 22k • Cuban links • rope chains', cuts:['gold-chain','gold-cuban','gold-rope','gold-byz'], bg:/gold-.*(chain|necklace)/, ready:true },
    { key:'rings',     k:'GOLD BUYER',   h2:'GOLD RINGS',      spec:'WEDDING BANDS, NUGGET RINGS, CLASS RINGS', items:'10k • 14k • 18k • diamonds counted separately', cuts:['gold-ring','gold-nugget'], bg:/gold-.*ring/, ready:true },
    { key:'bracelets', k:'GOLD BUYER',   h2:'GOLD BRACELETS',  spec:'CUBAN, BANGLES, TENNIS', items:'10k • 14k • 18k • bangles • Cuban bracelets', cuts:['gold-bracelet'], bg:/gold-bracelet/, ready:true },
    { key:'watches',   k:'WATCH BUYER',  h2:'GOLD WATCHES',    spec:'ROLEX, CARTIER, PRESIDENTIAL', items:'Rolex • Cartier • Omega • solid gold cases & bands', cuts:['gold-watch','gold-pocket'], bg:/gold-.*watch|rolex/, ready:true },
    { key:'scrap',     k:'GOLD BUYER',   h2:'SCRAP GOLD',      spec:'BROKEN, DENTAL, SINGLE EARRINGS', items:'broken chains • dental gold • single earrings • bars', cuts:['gold-scrap','gold-bars','gold-bar'], bg:/gold-bars/, ready:true },
  ],
  silver: [
    { key:'silverware', k:'SILVER BUYER', h2:'STERLING SILVERWARE', spec:'FLATWARE SETS, TEA SETS, TRAYS', items:'sterling flatware • tea sets • candlesticks • trays', cuts:['silver-flatware','silver-cutlery','silver-silverware','silver-tea'], bg:/silver-silverware|silver-cutlery/, ready:true },
    { key:'bullion',    k:'SILVER BUYER', h2:'SILVER BARS & COINS', spec:'BARS, ROUNDS, JUNK SILVER', items:'10 oz bars • rounds • 90% junk silver • Eagles', cuts:['silver-bar','silver-coin','silver-round'], bg:/silver-silver-bars|silver-coins/, ready:true },
    { key:'jewelry',    k:'SILVER BUYER', h2:'SILVER JEWELRY',  spec:'STERLING, .925, TIFFANY, YURMAN', items:'sterling • .925 • Tiffany & Co • David Yurman • Chrome Hearts', cuts:['silver-ring','silver-chain','silver-jewel'], bg:/silver-.*(ring|chain|jewel)/, ready:true },
  ],
  coins: [
    { key:'dollars',    k:'COIN BUYER',   h2:'SILVER DOLLARS',  spec:'MORGANS, PEACE, KEY DATES', items:'Morgans • Peace dollars • key dates • junk silver', cuts:['coin-silver-dollar','coin-morgan'], bg:/coins-morgan/, ready:true },
    { key:'goldcoins',  k:'COIN BUYER',   h2:'GOLD COINS',      spec:'EAGLES, CENTENARIOS, KRUGERRANDS', items:'American Eagles • Centenarios • Krugerrands • Maple Leafs', cuts:['coin-gold','coin-eagle','centenario'], bg:/coins-american|coins-gold/, ready:false },
    { key:'collections',k:'GRAILS WANTED',h2:'COIN COLLECTIONS',spec:'ALBUMS, ESTATES, WHOLE JARS', items:'albums • estates • proof sets • whole collections', cuts:['coin-album','coin-collection','coin-tray','coin-jar','coin-loose','coin-rolls','coin-stack'], bg:/coins-coin-collection/, ready:true },
    { key:'slabs',      k:'GRAILS WANTED',h2:'GRADED COINS',    spec:'PCGS, NGC, MS & PF', items:'PCGS • NGC • MS65+ • proofs', cuts:['coin-slab','coin-graded'], bg:/^$/, ready:true },
  ],
  cars: [
    { key:'cars',   k:'CAR BUYER',   h2:'CARS',        spec:'SEDANS, SUVS, ANY CONDITION', items:'Toyota • Honda • Tesla • BMW • Ford', cuts:['car-front','car-sedan','car-classic','car-sports','car-wheel','car-hand','car-keys','car-key','car-title','car-engine','car-damaged'], bg:/^cars-/, ready:true },
    { key:'trucks', k:'TRUCK BUYER', h2:'TRUCKS',      spec:'F-150, SILVERADO, RAM, TACOMA', items:'F-150 • Silverado • Ram • Tacoma • Tundra', cuts:['car-truck','pickup'], bg:/^trucks-/, ready:true },
    { key:'bikes',  k:'MOTORCYCLE BUYER', h2:'MOTORCYCLES', spec:'HARLEY, HONDA, YAMAHA', items:'Harley • Honda • Yamaha • Kawasaki • Ducati', cuts:['car-motorcycle','moto'], bg:/^bikes-/, ready:true },
    { key:'vans',   k:'VAN BUYER',   h2:'CARGO VANS',  spec:'TRANSIT, SPRINTER, PROMASTER', items:'Transit • Sprinter • ProMaster • Express', cuts:['car-van'], bg:/^vans-/, ready:true },
  ],
  strips: [
    { key:'strips', k:'STRIP BUYER', h2:'TEST STRIPS',   spec:'ONETOUCH, FREESTYLE, CONTOUR', items:'OneTouch • FreeStyle • Contour • Accu-Chek • sealed & in-date', cuts:['strip-box-open','strip-kit','strip-meter'], bg:/^strips-(blood-glucose-test|glucose-meter-test)/, ready:true },
    { key:'meters', k:'STRIP BUYER', h2:'GLUCOSE METERS', spec:'METERS, LANCETS, KITS', items:'meters • lancing devices • kits • unopened', cuts:['strip-kit','strip-meter'], bg:/strips-blood-glucose-meter/, ready:true },
    { key:'cgm',    k:'CGM BUYER',   h2:'CGM SENSORS',   spec:'DEXCOM, LIBRE, OMNIPOD', items:'Dexcom G6/G7 • FreeStyle Libre • Omnipod • sealed', cuts:['cgm','libre','dexcom'], bg:/strips-(continuous|freestyle)/, ready:false },
  ],
  pokemon: [
    { key:'singles', k:'GRAILS WANTED', h2:'POKÉMON SINGLES', spec:'CHARIZARD, MOONBREON, ALT ARTS', items:'Charizard • Moonbreon • alt arts • illustration rares', cuts:['poke-slab','poke-cards-fan'], bg:/pokemon-charizard/, ready:true },
    { key:'sealed',  k:'CARD BUYER',    h2:'SEALED POKÉMON',  spec:'BOOSTER BOXES, ETBS, TINS', items:'booster boxes • ETBs • tins • vintage sealed', cuts:['poke-elite-box','poke-booster'], bg:/^$/, ready:true },
    { key:'slabs',   k:'GRAILS WANTED', h2:'GRADED POKÉMON',  spec:'PSA 10, CGC, BGS', items:'PSA 10s • CGC • BGS • vintage slabs', cuts:['poke-slab'], bg:/^$/, ready:true },
  ],
  sports: [
    { key:'slabs',   k:'GRAILS WANTED', h2:'GRADED CARDS',    spec:'PSA, BGS, SGC', items:'PSA • BGS • SGC • vintage slabs', cuts:['sports-slab'], bg:/^$/, ready:true },
    { key:'rookies', k:'CARD BUYER',    h2:'ROOKIES & AUTOS', spec:'ROOKIES, AUTOS, PATCHES, /99', items:'rookies • autos • patches • numbered /99', cuts:[], bg:/^$/, ready:false },
    { key:'wax',     k:'CARD BUYER',    h2:'SEALED WAX',      spec:'HOBBY BOXES, CASES, VINTAGE WAX', items:'hobby boxes • cases • vintage wax', cuts:[], bg:/^$/, ready:false },
  ],
};
/* KICKERS — short, rotated. "LICENSED APPLE BUYER" is three words where one
   lands; the owner's list is the brief. Cards and coins open with GRAILS. */
const KICKERS = {
  apple:   ['TOP BUYER','FAST BUYER','EZ BUYER','QUICK BUYER','TOP RATED','APPLE BUYER'],
  gold:    ['GOLD BUYER','TOP BUYER','FAST CASH','TOP RATED','WE PAY MORE'],
  silver:  ['SILVER BUYER','TOP BUYER','FAST CASH','TOP RATED'],
  coins:   ['GRAILS WANTED','COIN BUYER','JUNK SILVER TOO','TOP BUYER'],
  cars:    ['CAR BUYER','ANY CONDITION','FAST CASH','TOP RATED','FREE TOW'],
  strips:  ['STRIP BUYER','FAST CASH','DISCREET','TOP RATED'],
  pokemon: ['GRAILS WANTED','CARD BUYER','TOP BUYER','FAST CASH'],
  sports:  ['GRAILS WANTED','CARD BUYER','TOP BUYER','FAST CASH'],
};

/* Information the ads were not carrying. The owner's own labelled references
   measure BUSIER as better — their GOOD folder sits at 25.8-34% edge density
   and this library at ~8-17% — so these blocks exist to close that gap with
   facts a seller actually wants, not with decoration. */
const INFO = {
  area:    'LONG BEACH · LAKEWOOD · DOWNEY · CARSON · TORRANCE',
  pay:     'CASH · ZELLE · VENMO · WIRE — YOUR CHOICE',
  trust:   ['4.9★  200+ LOCAL REVIEWS', 'SINCE 2015', '500+ DEALS CLOSED'],
  seals:   ['VERIFIED BUYER', 'CERTIFIED DEALER', 'TOP RATED LOCAL', 'LICENSED & BONDED'],
  /* two things we do, one thing you will not have to put up with */
  yes:     ['WRITTEN OFFER IN MINUTES','CASH THE SAME DAY','WE COME TO YOU','CRACKED OR LOCKED STILL PAID',
            'PAID BEFORE WE LEAVE','ANY CONDITION, ANY CARRIER','WE MATCH REAL OFFERS, NO HOOPS','THE FULL NUMBER, NO FEES TAKEN OUT'],
  no:      ['NO WAITING 2 HOURS FOR A QUOTE','NO LOWBALL "FINAL OFFERS"','NO HIDDEN FEES',
            'NO MAIL IT IN AND WAIT WEEKS','NO HAGGLING AT THE DOOR',
            'NO HOOPS, NO LADDERS, NO DELAYS','NO FEES THAT SHRINK YOUR PAYOUT','NO "PAID IN 5-7 BUSINESS DAYS"'],
  address: '1234 E ANAHEIM ST · LONG BEACH, CA 90813',
  promise: 'FREE WRITTEN OFFER BEFORE YOU DECIDE · NO OBLIGATION',
  hours:   'OPEN 7 DAYS · 9AM-8PM · WALK-INS WELCOME',
};
const THEME_BY_ID = Object.fromEntries(THEMES.map(t => [t.id, t]));

const browser = await puppeteer.launch({ executablePath: CHROME, headless:'new', args:['--no-sandbox'], protocolTimeout: 0 });
const page = await browser.newPage();
/* page-side logs were never forwarded, so every console.warn from the in-render
   self-audit has been invisible. Surface the ones that matter. */
page.on('console', m => { const t = m.text(); if (/^(SUBJECT|LOOKSKIP|NOGOODS|PILLDBG|WARN)/.test(t)) console.log(t); });
page.on('pageerror', e => console.log('PAGEERROR ' + e.message));
const perr = [];
page.on('pageerror', e => perr.push(String(e).slice(0,200)));
await page.goto(BASE, { waitUntil:'networkidle2', timeout:120000 });
await page.addScriptTag({ path: ROOT + 'scripts/grounds.js' });
await page.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 5000));
/* THE TYPE SYSTEM: the 56 faces the owner approved in the gallery
   (assets/approved-fonts.json), grouped by what they are FOR rather than by
   the gallery's roles. A category draws its display face from the styles that
   suit its subject — blackletter and serif on gold and silver, arcade and
   condensed on tech, comic and script on Pokémon — and a wild display face
   always gets a plain grotesque underneath it so the card stays readable. */
const FONTS = JSON.parse(readFileSync(ROOT + 'assets/approved-fonts.json', 'utf8')).faces;
const STYLE = {
  condensed:  ['Oswald','Big Shoulders Display','Barlow Condensed','Teko','Saira Condensed'],
  grotesque:  ['Satoshi','Manrope','Sora','Chivo','Libre Franklin','Instrument Sans'],
  serif:      ['Instrument Serif','Cormorant Garamond'],
  slab:       ['Zilla Slab','Roboto Slab'],
  blackletter:['Pirata One'],
  stencil:    ['Big Shoulders Stencil Display'],
  tech:       ['Press Start 2P','Audiowide','Wallpoet','Rubik Iso','Russo One','Squada One'],
  bold:       ['Bungee','Russo One','Squada One'],
  comic:      ['Bangers','Luckiest Guy','Shrikhand','Knewave','Freckle Face'],
  street:     ['Sedgwick Ave','Sedgwick Ave Display','Rubik Wet Paint','Rubik Marker Hatch','Rubik Dirt','Rubik Doodle Shadow','Permanent Marker','Faster One'],
  vintage:    ['Rye','Special Elite','Bungee Shade','Fascinate','Cabin Sketch'],
  /* owner, 2026-09-02, on WE BEAT WORTHY'S in Special Elite: "sickest font
     keep this!!!!! use it" — its own style so it rotates in on its own,
     not one draw in five of the vintage pool */
  typewriter: ['Special Elite'],
  script:     ['Kaushan Script','Knewave'],
  hand:       ['Kalam','Patrick Hand','Shadows Into Light','Gloria Hallelujah','Nanum Pen Script','Architects Daughter','Amatic SC'],
  horror:     ['Nosifer','Creepster'],
  rounded:    ['Nunito','Sniglet'],
  support:    ['Satoshi','Manrope','Sora','Chivo','Libre Franklin','Instrument Sans','Nunito','Zilla Slab','Roboto Slab'],
  num:        ['JetBrains Mono','DM Mono','Oswald','Barlow Condensed','Teko','Saira Condensed','Manrope','Sora'],
  numTech:    ['JetBrains Mono','DM Mono','Audiowide','Russo One','Squada One','Oswald','Barlow Condensed'],
};
/* which styles fit which subject, in rotation order — the plain ones lead so
   roughly half of every category stays clean */
const FIT = {
  phones:  ['condensed','tech','grotesque','typewriter','street','stencil','bold','slab'],
  gold:    ['serif','typewriter','blackletter','script','slab','vintage','condensed','bold'],
  silver:  ['blackletter','serif','typewriter','stencil','street','slab','condensed','vintage'],
  coins:   ['serif','slab','typewriter','condensed','blackletter','vintage','grotesque'],
  cars:    ['condensed','bold','typewriter','stencil','slab','tech','street','vintage'],
  strips:  ['condensed','grotesque','typewriter','slab','hand','rounded','bold'],
  pokemon: ['comic','script','street','hand','typewriter','condensed','horror','bold'],
  sports:  ['condensed','comic','typewriter','street','slab','bold','script','vintage'],
};
const FACESYS = { STYLE, FIT, TRACK: Object.fromEntries(FONTS.filter(f => f.track !== undefined).map(f => [f.name, f.track])), review100: process.env.LAB_REVIEW === '100', size: +(process.env.LAB_SIZE || 0), blank: REJECTED.size ? '^(' + [...REJECTED].join('|') + ')$' : BLANK.source, subcats: process.env.LAB_SUBCATS === '1', forceAbs: process.env.LAB_ABS === '1', placeDebug: process.env.LAB_PLACE === '1', dground: process.env.LAB_DGROUND || null, slab: process.env.LAB_SLAB === '1', cats: process.env.LAB_CATS ? process.env.LAB_CATS.split(',') : null, slabGrade: process.env.LAB_SLABGRADE || null, attempt: +(process.env.LAB_ATTEMPT || 0), noGroup: process.env.LAB_NOGROUP === '1', grounds: process.env.LAB_GROUNDS ? process.env.LAB_GROUNDS.split(',') : (existsSync(ROOT + 'assets/approved-grounds.json') ? Object.keys(JSON.parse(readFileSync(ROOT + 'assets/approved-grounds.json', 'utf8')).kinds).concat(['shadowcast','blinds']) : null) };
const TRACK = FACESYS.TRACK;
await page.evaluate(async faces => {
  await Promise.all(faces.map(f => (typeof ensureFont === 'function' ? ensureFont(f) : Promise.resolve())));
  await document.fonts.ready;
  try { fabric.util.clearFabricFontCache(); } catch(e){}
}, [...new Set([...FACES, ...FONTS.map(f => f.name)])]);
{ const miss = await page.evaluate(names => {
    const c = document.createElement('canvas').getContext('2d');
    const w = f => { c.font = '40px ' + f; return c.measureText('Buyback 0123 WQ').width; };
    return names.filter(n => { const a = w('"' + n + '", serif'), b = w('"' + n + '", monospace'); return Math.abs(a - w('serif')) < 0.5 && Math.abs(b - w('monospace')) < 0.5; });
  }, FONTS.map(f => f.name));
  console.log('faces loaded: ' + (FONTS.length - miss.length) + '/' + FONTS.length + (miss.length ? ' · missing: ' + miss.join(', ') : '')); }

/* The sixteen layouts that took approvals in the 4-up review, in that order.
   agencyGrid, diagonalRush, duoSplit, priceAnchor, editorialLux, karatSeal and
   wantedFrame took zero and are out. For each layout, EVERY template in it is
   kept, so the category can rotate across the palette row. */
const APPROVED_LAYOUTS = ['checklistHero','reviewProof','trustSeal','stepsFlow','bubblePop','voltStack',
  'neonNight','slabPoster','scriptRetro','lowerThird','gradientWave','ticketStub','hudTech','bandKnockout','arcCrown','glassCard'];
const picks = await page.evaluate((LAYS) => {
  const byLayout = {};
  TEMPLATES.filter(t => t.id.startsWith('dl_') && t.pal).forEach(t => {
    const lay = t.id.split('_')[2];
    (byLayout[lay] ||= []).push({ id:t.id, cat:t.cat, pal:t.pal, layout:lay });
  });
  return LAYS.filter(l => byLayout[l]).map(l => byLayout[l]);
}, process.env.LAB_LAYOUTS ? process.env.LAB_LAYOUTS.split(',') : APPROVED_LAYOUTS);
/* THE LOCKED LOOKS. Each one owns its palettes, its type pairing and its ground;
   the variations are the only thing allowed to move inside a look. Filled from the
   theme-lock study of all 924 approvals. LAB_LOOKS=1 builds the plan from these. */
const LOOKS = JSON.parse(readFileSync(ROOT + 'assets/looks.json', 'utf8')).looks || [];
/* the brand wordmarks, loaded beside the cutouts so a card can wear its make's mark */
const LOGOS = existsSync(ROOT + 'assets/logos') ? Object.fromEntries(readdirSync(ROOT + 'assets/logos').filter(f => f.endsWith('.png')).map(f => [f.replace(/\.png$/, ''), 'assets/logos/' + f])) : {};
await page.evaluate(async srcs => {
  await Promise.all(srcs.map(s => new Promise(res => {
    if (CUTOUT_ELS[s]) return res();
    const el = new Image(); el.onload = () => { CUTOUT_ELS[s] = el; res(); };
    el.onerror = () => res(); el.src = s;
  })));
}, ALL.filter(okCut).map(c => 'assets/cutouts/' + c + '.webp').concat(['assets/cutouts/sports-slab-graded.webp'], Object.values(LOGOS)));   // + the slab frame and the brand logos
/* THE MISSING BACKDROPS. freshBgImage() reads TPL_BG_ELS, which the engine
   fills only with the backdrops its own templates use. The Apple scenes were
   never in it, so every scene-backed card — all of the iPhone, iPad, Watch
   and Mac ads — silently painted a flat colour: "many of these iphone ones
   are showing no graphics". Load the scenes into the same cache. */
const SCENES = readdirSync(ROOT + 'assets/scenes').filter(f => /\.jpe?g$/i.test(f)).map(f => 'assets/scenes/' + f)
  .concat(existsSync(ROOT + 'assets/bg-web') ? readdirSync(ROOT + 'assets/bg-web').filter(f => /\.jpe?g$/i.test(f)).map(f => 'assets/bg-web/' + f) : []);
/* real photographs per category (scripts/fetch_backdrops.mjs), by filename prefix */
const WEBBG = {};
SCENES.filter(s => s.startsWith('assets/bg-web/')).forEach(s => { const cat = s.split('/').pop().split('-')[0]; (WEBBG[cat] ||= []).push(s); });
console.log('web backdrops: ' + Object.entries(WEBBG).map(([k, v]) => k + ' ' + v.length).join(', '));
await page.evaluate(async srcs => {
  await Promise.all(srcs.map(s => new Promise(res => {
    if (TPL_BG_ELS[s]) return res();
    const el = new Image(); el.onload = () => { TPL_BG_ELS[s] = el; res(); };
    el.onerror = () => res(); el.src = s;
  })));
}, SCENES);
console.log('scenes cached: ' + await page.evaluate(srcs => srcs.filter(s => TPL_BG_ELS[s] && TPL_BG_ELS[s].width).length, SCENES) + '/' + SCENES.length);
await new Promise(r => setTimeout(r, 2500));

const DEBUG_ID = process.env.LAB_DEBUG || '';
/* The thirteen faces approved in the gallery, by the job they do. Clash
   Display is not among them, so headlines leave it. */
const TYPE = {
  /* Faster One from the graffiti gallery: "cool with less letter spacing,
     otherwise doesn't look good" — so it runs tight, see TRACK */
  display: ['Oswald','Big Shoulders Display','Barlow Condensed','Teko','Instrument Serif','Chivo','Faster One'],
  support: ['Satoshi','Manrope','Sora','Chivo','Libre Franklin','Instrument Sans'],
  num:     ['JetBrains Mono','DM Mono','Manrope','Sora','Barlow Condensed','Oswald'],
};
/* THE CUT, from the 4x4 review of the last 160 (75 approved). Layout weight
   is its approval count: lowerThird 8, checklistHero 7, gradientWave 7,
   hudTech 6, arcCrown 6 take sixteen frames each; the five-approval layouts
   take ten; the rest five. Palettes in approval order — Sky Market 10, Blue
   Market 9, Blue Ticket 9, Mint Market 9, Indigo 8, Blue Deal 7, then the
   six-and-under — and a layout with fewer frames only sees the top of that
   list. Every entry carries a variant number so no card repeats a reviewed
   one: the category, product, faces and copy all rotate off it. */
/* SET 3: 250 frames. Both reviews count — set 1 offered ten of every layout,
   set 2 offered a weighted cut — so a layout's weight is its approval RATE
   over everything it has been shown in, clamped so nothing vanishes and
   nothing takes over. Palettes the same way. Variant numbers start at 3 so no
   card repeats a judged one. */
const APPROVED = JSON.parse(readFileSync(ROOT + 'assets/approved-templates.json', 'utf8')).sets;
const TOTAL = +(process.env.LAB_TOTAL || 250), VSTART = +(process.env.LAB_VSTART || 3);
/* every review so far counts: set 1 offered ten of everything; every later
   set records what it offered per layout. Set 3 (the owner's 93 of 250,
   pasted 2026-09-02) joined here. */
const rateOf = lay => {
  let a = 0, o = 0;
  APPROVED.forEach((set, n) => {
    a += set.approved.filter(x => x.layout === lay).length;
    o += n === 0 ? 10 : ((set.offered || {})[lay] || 0);
  });
  return (a + 1) / (o + 2);
};
const rates = picks.map(l => rateOf(l[0].layout));
const LO = Math.round(TOTAL / 31), HI = Math.round(TOTAL / 10.4);      // 250 → 8..24, 500 → 16..48
let want = picks.length === 1 ? [TOTAL] : rates.map(r => Math.max(LO, Math.min(HI, Math.round(TOTAL * r / rates.reduce((a, b) => a + b, 0)))));
for (let g = 0; want.reduce((a, b) => a + b, 0) !== TOTAL && g < 400; g++){
  const diff = TOTAL - want.reduce((a, b) => a + b, 0);
  const k = g % want.length;
  if (diff > 0 && want[k] < HI) want[k]++; else if (diff < 0 && want[k] > LO) want[k]--;
}
const palCount = {}; DONORS.forEach(d => palCount[d] = FRESH.includes(d) ? 9 : 1);   // a new palette starts at a mid weight
APPROVED.forEach(set => set.approved.forEach(a => { if (palCount[a.palette] !== undefined) palCount[a.palette]++; }));
if (process.env.LAB_FLAT) DONORS.forEach(d => palCount[d] = 10);   // equal shares: a set meant to span the colour wheel
/* smooth weighted round-robin over the palettes, offset per layout */
const rr = (want, offset) => {
  const cur = Object.fromEntries(DONORS.map(d => [d, 0])), tot = DONORS.reduce((a, d) => a + palCount[d], 0), out = [];
  for (let k = 0; k < want + offset; k++){
    DONORS.forEach(d => cur[d] += palCount[d]);
    const best = DONORS.reduce((a, d) => cur[d] > cur[a] ? d : a, DONORS[0]);
    cur[best] -= tot; if (k >= offset) out.push(best);
  }
  return out;
};
const PLAN = [];
if (process.env.LAB_LOOKS && LOOKS.length){
  /* one look at a time: every card in a block shares its palette set, faces and
     ground, so a page of the lab reads as one campaign instead of a shuffle */
  const layoutIx = {}; picks.forEach((l, i) => layoutIx[l[0].layout] = i);
  /* N cards per theme (LAB_PERLOOK, default 2): the theme's own layouts and its
     own palettes, in order, so a gallery shows every theme the same number of times */
  const PERLOOK = +(process.env.LAB_PERLOOK || 2);
  LOOKS.forEach(L => {
    const lays = (L.layouts || []).map(l => layoutIx[l]).filter(i2 => i2 !== undefined);
    if (!lays.length){ console.log('  no usable layout: ' + (L.key || L.id)); return; }
    const pals = (L.palettes || []).filter(pl => DONORS.indexOf(pl) >= 0);
    const nHere = L.perLook || PERLOOK;   // a new collection can ask for more cards to grade
    for (let v = 0; v < nHere; v++){
      const i = lays[v % lays.length];
      const j = pals.length ? DONORS.indexOf(pals[v % pals.length]) : 0;
      PLAN.push({ i, j, v: VSTART + v, k: PLAN.length, look: L.key || L.id });
    }
  });
  console.log('looks: ' + LOOKS.map(L => (L.key || L.id) + ' ' + PLAN.filter(e => e.look === (L.key || L.id)).length).join(', '));
} else
picks.forEach((list, i) => {
  const seq = rr(want[i], i * 3), seenD = {};
  seq.forEach((donor, k) => { seenD[donor] = (seenD[donor] || 0) + 1; PLAN.push({ i, j: DONORS.indexOf(donor), v: VSTART + seenD[donor] - 1, k }); });
});
console.log('palette weights: ' + DONORS.map(d => d + ' ' + palCount[d]).join(', '));
/* LAB_ONLY=lowerThird-ca07,hudTech-du08 renders just those pairs (every
   variant) so a debug run takes seconds instead of the full set */
if (process.env.LAB_ONLY){
  const only = process.env.LAB_ONLY.split(',');
  const keep = PLAN.filter(e => only.includes(picks[e.i][0].layout + '-' + DONORS[e.j]));
  PLAN.length = 0; PLAN.push(...keep);
}
console.log('plan: ' + PLAN.length + ' cards · ' + picks.map(l => l[0].layout + ' ' + PLAN.filter(e => e.i === picks.indexOf(l)).length).join(', '));

/* LAB_ASSORT=all|off|third — carried into the browser on INFO, which is
   already handed across; the render code cannot read process.env */
INFO.assort = process.env.LAB_ASSORT || 'off';   // ghost walls read as "layering/overlapping images" (owner, 2026-09-03): off unless asked
/* LAB_EXPORT=1 also returns every card's FINAL template record (the t2 the
   card was painted from), so a set can ship into the app as real templates
   rather than as pictures of templates. */
INFO.export = !!process.env.LAB_EXPORT;
INFO.raw = process.env.LAB_RAW || 'on';
const cards = await page.evaluate(async (PLAN, picks, DONORS, THEMES, PAL, CUTS, DEVICE_DECKS, INFO, CATEGORY_COPY, MODERN, HERO, BGLUM, DEBUG_ID, TYPE, CHALLENGE, KICKERS, FACESYS, WEBBG, LOGOS, LOOKS, SUBCATS_PAGE) => {
  const TRACK = FACESYS.TRACK;
  const BLANK = new RegExp(FACESYS.blank, 'i');     // the blank card cutouts, excluded in the page too
  /* PRODUCT OVER A PILE OF CASH. "Why isn't any product over a pile of cash
     a background image?" The cash cutouts scale to a full-bleed ground under
     a dark tint; real cash photographs (bg-web/cash-*) join the pool when
     present. One card in three that carries a product takes it. */
  const CASH_GROUNDS = ['assets/cutouts/cash-scatter-loose.webp','assets/cutouts/cash-bundles-pyramid.webp','assets/cutouts/cash-fan-hundreds.webp','assets/cutouts/cash-stack-banded.webp','assets/cutouts/cash-spread-hand-count.webp'];
  CASH_GROUNDS.forEach(src => { if (CUTOUT_ELS[src] && !TPL_BG_ELS[src]) TPL_BG_ELS[src] = CUTOUT_ELS[src]; });
  /* DRAWN GROUNDS. Lined Paper is not a photograph: ruled, legal, grid and
     dotted sheets are drawn here and cached under paper:* like any backdrop.
     Space gets a procedural starfield as the fallback behind NASA's photos. */
  const drawGround = (key, fn) => { const c = document.createElement('canvas'); c.width = TPL_W; c.height = TPL_H; fn(c.getContext('2d'), TPL_W, TPL_H);
    TPL_BG_ELS[key] = c; };   // the canvas itself: already painted, no decode to wait for
  const paper = (g, W, H, opts) => {
    g.fillStyle = opts.paper; g.fillRect(0, 0, W, H);
    // fibre: faint noise
    for (let i = 0; i < 9000; i++){ g.fillStyle = 'rgba(0,0,0,' + (Math.random() * 0.035).toFixed(3) + ')'; g.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
    if (opts.rule){ g.strokeStyle = opts.rule; g.lineWidth = 2.2; for (let y = opts.top; y < H; y += opts.gap){ g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(W, y + 0.5); g.stroke(); } }
    if (opts.grid){ g.strokeStyle = opts.grid; g.lineWidth = 1.4; for (let x = 0; x < W; x += opts.gap){ g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, H); g.stroke(); } for (let y = 0; y < H; y += opts.gap){ g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(W, y + 0.5); g.stroke(); } }
    if (opts.dots){ g.fillStyle = opts.dots; for (let x = 30; x < W; x += opts.gap) for (let y = 30; y < H; y += opts.gap){ g.beginPath(); g.arc(x, y, 2.2, 0, Math.PI * 2); g.fill(); } }
    if (opts.margin){ g.strokeStyle = opts.margin; g.lineWidth = 2.2; g.beginPath(); g.moveTo(118, 0); g.lineTo(118, H); g.stroke(); }
    if (opts.holes){ for (const y of [H * 0.18, H * 0.5, H * 0.82]){ g.fillStyle = 'rgba(0,0,0,0.10)'; g.beginPath(); g.arc(52, y + 3, 15, 0, Math.PI * 2); g.fill(); g.fillStyle = '#eef0f2'; g.beginPath(); g.arc(50, y, 15, 0, Math.PI * 2); g.fill(); } }
    // a soft shadow at the top like a pad's binding
    const sh = g.createLinearGradient(0, 0, 0, 70); sh.addColorStop(0, 'rgba(0,0,0,0.10)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.fillRect(0, 0, W, 70);
  };
  drawGround('paper:ruled', (g, W, H) => paper(g, W, H, { paper:'#fbf7ea', rule:'#9fb9df', gap:54, top:150, margin:'#e08f8f', holes:true }));
  drawGround('paper:legal', (g, W, H) => paper(g, W, H, { paper:'#fff3b8', rule:'#8fabd6', gap:54, top:130, margin:'#d97f7f', holes:false }));
  drawGround('paper:grid',  (g, W, H) => paper(g, W, H, { paper:'#f7f9fb', grid:'#b9cbe2', gap:48 }));
  drawGround('paper:dots',  (g, W, H) => paper(g, W, H, { paper:'#fbfaf5', dots:'#b3bbc7', gap:44 }));
  drawGround('space:stars', (g, W, H) => {
    const base = g.createLinearGradient(0, 0, W, H); base.addColorStop(0, '#050a1e'); base.addColorStop(1, '#0b0517'); g.fillStyle = base; g.fillRect(0, 0, W, H);
    for (const [x, y, r, col] of [[W * 0.2, H * 0.3, 520, 'rgba(70,40,160,0.35)'], [W * 0.8, H * 0.7, 460, 'rgba(20,90,160,0.32)'], [W * 0.6, H * 0.2, 300, 'rgba(180,60,120,0.22)']]){
      const nb = g.createRadialGradient(x, y, 0, x, y, r); nb.addColorStop(0, col); nb.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = nb; g.fillRect(0, 0, W, H); }
    for (let i = 0; i < 1400; i++){ const r = Math.random() < 0.08 ? 2.2 : 1.1, a = 0.35 + Math.random() * 0.65; g.fillStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')'; g.beginPath(); g.arc(Math.random() * W, Math.random() * H, r * Math.random() + 0.4, 0, Math.PI * 2); g.fill(); }
  });
  /* ABSTRACT GROUNDS. "Colorful backgrounds, avant-garde or abstract, iOS
     style… very eye-catching graphics that use a lot of colours." Drawn per
     card in the palette's own colours: an iOS mesh gradient, soft blobs,
     avant-garde geometry, a sunburst, layered waves. Cached by key. */
  const hexRgb = h => { const m = String(h).replace('#',''); const v = m.length === 3 ? m.split('').map(c => c + c).join('') : m; return [parseInt(v.slice(0,2),16), parseInt(v.slice(2,4),16), parseInt(v.slice(4,6),16)]; };
  const rgba = (h, a) => { const [r, g, b] = hexRgb(h); return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; };
  function abstractGround(kind, th, seed){
    const key = 'abs:' + kind + ':' + th.id + ':' + (seed % 4);
    if (TPL_BG_ELS[key]) return key;
    if (window.GROUNDS && window.GROUNDS.kinds.includes(kind)){   // the shared catalogue (scripts/grounds.js)
      drawGround(key, (g, W, H) => window.GROUNDS.draw(kind, g, W, H, th, seed));
      return key;
    }
    const cols = [th.accent, th.support, th.accent2 || th.accent, th.accent3 || th.support].filter(Boolean);
    const rnd = (() => { let x = (seed * 9301 + 49297) % 233280; return () => (x = (x * 9301 + 49297) % 233280) / 233280; })();
    drawGround(key, (g, W, H) => {
      g.fillStyle = th.c1; g.fillRect(0, 0, W, H);
      if (kind === 'mesh'){
        for (let i = 0; i < 6; i++){ const c = cols[i % cols.length], x = rnd() * W, y = rnd() * H, r = 380 + rnd() * 420;
          const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rgba(c, 0.85)); gr.addColorStop(1, rgba(c, 0)); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
      } else if (kind === 'blobs'){
        g.filter = 'blur(28px)';
        for (let i = 0; i < 7; i++){ g.fillStyle = rgba(cols[i % cols.length], 0.75); g.beginPath(); g.arc(rnd() * W, rnd() * H, 160 + rnd() * 260, 0, Math.PI * 2); g.fill(); }
        g.filter = 'none';
      } else if (kind === 'geo'){
        const shapes = 5 + Math.floor(rnd() * 3);
        for (let i = 0; i < shapes; i++){ const c = cols[i % cols.length]; g.fillStyle = rgba(c, 0.92); g.save(); g.translate(rnd() * W, rnd() * H); g.rotate((rnd() - 0.5) * 1.2);
          if (i % 3 === 0){ g.beginPath(); g.arc(0, 0, 140 + rnd() * 220, 0, Math.PI * 2); g.fill(); }
          else if (i % 3 === 1){ g.fillRect(-W * 0.6, -60 - rnd() * 80, W * 1.4, 120 + rnd() * 160); }
          else { g.beginPath(); g.moveTo(0, -260); g.lineTo(240, 200); g.lineTo(-240, 200); g.closePath(); g.fill(); }
          g.restore(); }
        g.strokeStyle = rgba(th.ink, 0.5); g.lineWidth = 6; for (let i = 0; i < 3; i++){ g.beginPath(); g.arc(rnd() * W, rnd() * H, 120 + rnd() * 240, 0, Math.PI * 2); g.stroke(); }
      } else if (kind === 'rays'){
        const cx = W * (0.3 + rnd() * 0.4), cy = H * (0.25 + rnd() * 0.3), N = 18;
        for (let i = 0; i < N; i++){ g.fillStyle = rgba(cols[i % 2], i % 2 ? 0.55 : 0.9); g.beginPath(); g.moveTo(cx, cy);
          const a0 = (i / N) * Math.PI * 2, a1 = ((i + 0.5) / N) * Math.PI * 2; g.lineTo(cx + Math.cos(a0) * 1600, cy + Math.sin(a0) * 1600); g.lineTo(cx + Math.cos(a1) * 1600, cy + Math.sin(a1) * 1600); g.closePath(); g.fill(); }
        const gr = g.createRadialGradient(cx, cy, 0, cx, cy, 700); gr.addColorStop(0, rgba(th.c1, 0)); gr.addColorStop(1, rgba(th.c1, 0.55)); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      } else { /* waves */
        for (let i = 0; i < 6; i++){ const c = cols[i % cols.length], base = H * (0.35 + i * 0.12), amp = 60 + rnd() * 80, ph = rnd() * 6;
          g.fillStyle = rgba(c, 0.85 - i * 0.08); g.beginPath(); g.moveTo(0, H);
          for (let x = 0; x <= W; x += 16) g.lineTo(x, base + Math.sin(x / 180 + ph) * amp); g.lineTo(W, H); g.closePath(); g.fill(); }
      }
    });
    return key;
  }
  ICONS.planet = { d: 'M50 22 A28 28 0 1 0 50 78 A28 28 0 1 0 50 22 Z M8 60 C26 74 74 74 92 40 M8 60 C14 52 22 48 30 46 M92 40 C86 46 78 50 70 52', sw: 5 };
  ICONS.rocket = { d: 'M50 6 C64 20 68 44 62 66 H38 C32 44 36 20 50 6 Z M38 56 L22 70 L30 74 L40 66 M62 56 L78 70 L70 74 L60 66 M42 66 L50 90 L58 66 M50 30 A7 7 0 1 0 50 44 A7 7 0 1 0 50 30 Z', sw: 5 };
  ICONS.moon = { d: 'M58 10 A40 40 0 1 0 90 62 A30 30 0 0 1 58 10 Z', sw: 5 };
  ICONS.scribble = { d: 'M10 60 C22 40 30 40 40 60 C50 80 58 80 68 60 C78 40 86 40 92 56', sw: 7 };
  ICONS.flame = { d: 'M50 6 C62 26 78 34 74 58 C72 74 60 90 50 94 C40 90 28 74 26 58 C24 44 36 40 38 28 C44 40 54 42 50 6 Z M50 60 C56 68 58 76 50 84 C42 76 44 68 50 60 Z', sw: 5 };
  ICONS.headset = { d: 'M22 58 V50 A28 28 0 0 1 78 50 V58 M14 58 H30 V80 H22 A8 8 0 0 1 14 72 Z M70 58 H86 V72 A8 8 0 0 1 78 80 H70 Z M78 80 C78 90 66 92 54 92', sw: 6 };
  ICONS.pushpin = { d: 'M40 10 H60 V36 L70 48 H30 L40 36 Z M50 48 V90', sw: 6 };
  /* the mark beside the website line, 100-unit box, outline like the rest of
     the set. The old arrow cursor pointed up-left, AWAY from the URL it was
     meant to point at (owner, 2026-09-02); now half the cards get an arrow
     pointing right at the URL and half a globe beside it. */
  ICONS.arrowRight = { d: 'M14 50 H82 M58 26 L82 50 L58 74', sw: 9 };
  ICONS.globe = { d: 'M50 12 A38 38 0 1 0 50 88 A38 38 0 1 0 50 12 Z M50 12 C32 30 32 70 50 88 M50 12 C68 30 68 70 50 88 M12 50 H88 M19 31 H81 M19 69 H81', sw: 6 };
  /* map pin: a teardrop with a hole, beside the reviewer's city */
  ICONS.pin = { d: 'M50 92 C50 92 22 58 22 40 A28 28 0 0 1 78 40 C78 58 50 92 50 92 Z M50 30 A10 10 0 1 0 50 50 A10 10 0 1 0 50 30 Z', sw: 7 };
  const pickFaces = (cat, seed, family) => {
    /* a family can own the type: Space is set in the tech and condensed
       faces; Lined Paper is handwritten, body included — that is the point
       of a page written by hand */
    if (family === 'Lined Paper'){
      const disp = ['Permanent Marker','Kalam','Cabin Sketch','Amatic SC','Gloria Hallelujah','Shadows Into Light','Nanum Pen Script','Architects Daughter'];
      const body = ['Patrick Hand','Architects Daughter','Kalam'];
      const display = disp[seed % disp.length], support = body[(seed * 3 + 1) % body.length];
      return { display, support, num: support, style:'hand' };
    }
    if (family === 'Space'){
      const disp = ['Audiowide','Russo One','Squada One','Wallpoet','Big Shoulders Display','Oswald','Press Start 2P','Saira Condensed'];
      const display = disp[seed % disp.length], support = ['Manrope','Sora','Instrument Sans','Chivo'][(seed * 3 + 1) % 4];
      return { display, support, num: /Press Start/.test(display) ? support : display, style:'tech' };
    }
    const fit = FACESYS.FIT[cat] || FACESYS.FIT.phones;
    const style = fit[seed % fit.length];
    const pool = FACESYS.STYLE[style];
    const display = pool[Math.floor(seed / fit.length) % pool.length];
    const plain = /^(condensed|grotesque|serif|slab)$/.test(style);
    const sup = plain ? FACESYS.STYLE.support : FACESYS.STYLE.grotesque;
    const numPool = cat === 'phones' ? FACESYS.STYLE.numTech : FACESYS.STYLE.num;
    /* "unify the fonts to maybe two": the number is set in the display face
       when that face is plain, otherwise in the body face — never a third */
    const support = sup[(seed * 3 + 1) % sup.length];
    return { display, support, num: plain ? display : support, style };
  };
  const W = TPL_W, H = TPL_H, SIZE = FACESYS.size || +(new URLSearchParams(location.search).get('size') || 0) || (PLAN.length > 300 ? 512 : 640);
  const TH = Object.fromEntries(THEMES.map(t => [t.id, t]));
  const ALLCUTS = MODERN;   // every current-hardware cutout, not just the CUTS map
  const lin = c => { c/=255; return c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4); };
  const lumPx = (d,i) => 0.2126*lin(d[i]) + 0.7152*lin(d[i+1]) + 0.0722*lin(d[i+2]);
  const lumHex = h => { const n = parseInt(String(h).replace('#',''),16);
    return 0.2126*lin((n>>16)&255) + 0.7152*lin((n>>8)&255) + 0.0722*lin(n&255); };
  const cr = (a,b) => { const A=lumHex(a), B=lumHex(b), hi=Math.max(A,B), lo=Math.min(A,B); return (hi+0.05)/(lo+0.05); };
  const isHex = v => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);

  function mapper(P, th){
    /* by ROLE, so the layout keeps its hierarchy and only changes clothes */
    const m = new Map();
    const put = (from, to) => { if (isHex(from)) m.set(from.toLowerCase(), to); };
    put(P.bg1, th.c1); put(P.bg2, th.c2);
    put(P.ink, th.ink); put(P.sub, th.sub);
    put(P.a1, th.accent); put(P.a2, th.support);
    put(P.deep, th.onAccent);
    // literal white is being used as ink; on a pale theme it has to stop being white
    m.set('#ffffff', th.ink); m.set('#fff', th.ink);
    /* THE FALLBACK THAT MATTERS. Exact-match role mapping only catches colours
       that ARE a palette value; the library is full of derived ones —
       hexToRgba(P.deep, 0.82), hand-tuned panel tints, gradient stops nudged by
       a pass. Those survived the swap unchanged, so a near-black panel stayed
       near-black on a pale theme: agencyGrid's "Items Panel" rgba(12,10,9,0.62)
       rendered as a black box across every light card.
       So anything unmapped is REBUILT: keep its contrast relationship to the
       old ground and reproduce that against the new one. An element that sat
       just darker than a dark ground comes out just darker than a light ground,
       which is what it was for. */
    const Lold = lumHex(P.bg1 || '#141417');
    const Lnew = lumHex(th.c1);
    const nRGB = (() => { const n = parseInt(th.c1.slice(1),16);
      return [(n>>16)&255, (n>>8)&255, n&255]; })();
    /* Rebuild an unmapped colour at the luminance its contrast ratio implies —
       but in ITS OWN hue, not the ground's. The first version scaled the new
       ground's RGB, so on a saturated Jewel ground every panel, band and plate
       came out purple and the card went monochrome: the yellow accent and the
       periwinkle support never appeared at all. A colour that was neutral in
       the original stays neutral; one that was coloured keeps its hue. */
    const derive = hex => {
      const r = (lumHex(hex) + 0.05) / (Lold + 0.05);
      const want = Math.max(0, Math.min(1, r * (Lnew + 0.05) - 0.05));
      const n = parseInt(hex.slice(1),16);
      const src = [(n>>16)&255, (n>>8)&255, n&255];
      const mx = Math.max(...src), mn = Math.min(...src);
      const chroma = mx ? (mx - mn) / mx : 0;
      // neutral originals become a neutral with a whisper of the ground in it;
      // chromatic originals keep their own RGB proportions
      /* Owner, 2026-09-02: "notice it's not matching the color palette
         chosen. So we need to keep the palette accurate." Keeping a chromatic
         original in ITS OWN hue is exactly how a base template's mint plate
         reached a Blue Market card. A chromatic original now snaps to the
         theme's tone ladder — the accent hue, or the support hue when the
         original sat nearer it — at the luminance its contrast implies. Only
         neutrals stay neutral. */
      if (chroma >= 0.12 && th.ladder){
        const hueOf = ([r,g,b]) => { const mx2 = Math.max(r,g,b), mn2 = Math.min(r,g,b), d = mx2 - mn2 || 1;
          let h = mx2 === r ? ((g - b) / d) % 6 : mx2 === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; return (h + 360) % 360; };
        const dist = (a, b) => { const x = Math.abs(a - b) % 360; return x > 180 ? 360 - x : x; };
        const h0 = hueOf(src), hues = th.hues || {};
        const lad = dist(h0, hues.support || 0) < dist(h0, hues.accent || 0) ? th.ladder.support : th.ladder.accent;
        return lad.reduce((a, b) => Math.abs(lumHex(b) - want) < Math.abs(lumHex(a) - want) ? b : a);
      }
      const base = chroma < 0.12
        ? [0,1,2].map(i => 200*0.85 + nRGB[i]*0.15)
        : src.map(c => Math.max(8, c));
      let lo = 0, hi = 4, mid = 1;
      const f = c => { c/=255; return c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4); };
      for (let k = 0; k < 24; k++){
        mid = (lo + hi) / 2;
        const t = base.map(c => Math.max(0, Math.min(255, c * mid)));
        const L = 0.2126*f(t[0]) + 0.7152*f(t[1]) + 0.0722*f(t[2]);
        if (L < want) lo = mid; else hi = mid;
      }
      return '#' + base.map(c => Math.round(Math.max(0, Math.min(255, c*mid))).toString(16).padStart(2,'0')).join('');
    };
    return v => {
      if (isHex(v)) return m.get(v.toLowerCase()) || derive(v);
      if (typeof v === 'string' && /^rgba?\(/i.test(v)){
        const q = v.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?/i);
        if (!q) return v;
        const hex = '#' + [1,2,3].map(i => (+q[i]).toString(16).padStart(2,'0')).join('');
        const to = m.get(hex.toLowerCase()) || derive(hex);
        const n = parseInt(to.slice(1),16);
        return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+(q[4]===undefined?1:q[4])+')';
      }
      return v;
    };
  }

  /* rows of the frame no layer is using — where information can go without
     touching a hand-built composition */
  function freeBands(refs){
    const occ = new Uint8Array(H);
    refs.forEach(o => { if (!o) return;
      const b = o.getBoundingRect(true, true);
      if (b.width < W*0.34) return;                 // only wide elements block a band
      for (let y = Math.max(0,~~b.top); y < Math.min(H, Math.ceil(b.top+b.height)); y++) occ[y] = 1;
    });
    const bands = []; let start = -1;
    for (let y = 0; y <= H; y++){
      if (y < H && !occ[y]){ if (start < 0) start = y; }
      else if (start >= 0){ if (y - start >= 62) bands.push({ top:start, h:y-start }); start = -1; }
    }
    return bands.sort((a,b) => b.h - a.h);
  }

  /* Blocks of real information, added only into space that is already empty.
     The owner's own reference set measures busier as better, and this library
     sits at 16.7% median against a good band of 25.8-34%. */
  function enrich(t2, th, deck, bands, n, seed, boxes){
    const light = lumHex(th.c1) > 0.22;
    const onGround = th.ink, dim = th.sub;
    const blocks = [
      /* COMPARE ROWS: two green ticks, one red cross. Semantic green and red,
         not the theme accent — a tick and a cross read the same on every
         palette, which is the point of them. Each disc, glyph and line is its
         own named layer. Lands first because it earns the biggest band. */
      b => {
        const rows = [['✓', INFO.yes[seed % INFO.yes.length], '#22c55e'],
                      ['✓', INFO.yes[(seed + 2) % INFO.yes.length], '#22c55e'],
                      ['✗', INFO.no[seed % INFO.no.length], '#ef4444']];
        const out = [];
        rows.forEach(([g, txt, col], r) => {
          const y = b.top + 10 + r * 44;
          if (y + 38 > b.top + b.h) return;
          out.push({ kind:'circle', name:'Compare Disc ' + (r+1), props:{ left:X0, top:y, radius:18, fill:col } },
                   { kind:'text', name:'Compare Mark ' + (r+1), role:'deco', text:g,
                     props:{ left:X0+18, top:y+18, originX:'center', originY:'center', fontFamily:'Satoshi', fontSize:20, fill:'#ffffff', fontWeight:'900' } },
                   { kind:'text', name:'Compare Line ' + (r+1), role:'info', text:txt,
                     props:{ left:X0+50, top:y+18, originY:'center', fontFamily:th.faces.support, fontSize: region ? 20 : 24, fill:onGround, fontWeight:'800', charSpacing:30 } });
        });
        return out;
      },
      b => ([ { kind:'rect', name:'Info Rule', props:{ left:64, top:b.top+b.h/2-30, width:W-128, height:2, fill:th.accent, opacity:0.55 } },
              { kind:'text', name:'Service Area', role:'info', text:INFO.area,
                props:{ left:W/2, top:b.top+b.h/2-8, originX:'center', fontFamily:th.faces.support,
                        fontSize:23, fill:onGround, fontWeight:'800', charSpacing:60 } } ]),
      /* icon bubbles: a disc with a glyph beside each fact. Reused because
         the owner singled it out; varied glyph per row so it is not the same
         tick four times. Each disc and line is its own named layer. */
      b => {
        const rows = [['★', INFO.trust[0]], ['⏱', 'SAME-DAY PAYMENT'], ['✉', 'TEXT US PHOTOS FOR AN OFFER']];
        const out = [];
        rows.forEach(([g, txt], r) => {
          const y = b.top + 12 + r * 42;
          if (y + 36 > b.top + b.h) return;
          out.push({ kind:'circle', name:'Bubble ' + (r+1), props:{ left:64, top:y, radius:17, fill:th.accent } },
                   { kind:'text', name:'Bubble Glyph ' + (r+1), role:'deco', text:g,
                     props:{ left:81, top:y+17, originX:'center', originY:'center', fontFamily:'Satoshi', fontSize:18, fill:th.onAccent, fontWeight:'900' } },
                   { kind:'text', name:'Bubble Text ' + (r+1), role:'info', text:txt,
                     props:{ left:112, top:y+17, originY:'center', fontFamily:th.faces.support, fontSize:24, fill:onGround, fontWeight:'800', charSpacing:30 } });
        });
        return out;
      },
      b => ([ { kind:'text', name:'Trust Row', role:'info', text:INFO.trust.join('   ·   '),
                props:{ left:W/2, top:b.top+b.h/2-14, originX:'center', fontFamily:th.faces.support,
                        fontSize:26, fill:onGround, fontWeight:'800', charSpacing:20 } } ]),
      b => ([ { kind:'rect', name:'Promise Plate', props:{ left:56, top:b.top+b.h/2-32, width:W-112, height:64,
                        rx:14, fill:th.support, opacity:light?0.92:0.30 } },
              { kind:'text', name:'Promise', role:'info', text: (deck && deck.challengePromise) ? deck.challengePromise.toUpperCase() : INFO.promise,
                props:{ left:W/2, top:b.top+b.h/2-11, originX:'center', fontFamily:th.faces.support,
                        fontSize:22, fill: light ? th.onSupport : onGround, fontWeight:'800', charSpacing:40 } } ]),
      b => ([ { kind:'text', name:'Payment', role:'info', text:INFO.pay,
                props:{ left:W/2, top:b.top+b.h/2-24, originX:'center', fontFamily:th.faces.support,
                        fontSize:22, fill:dim, fontWeight:'700', charSpacing:70 } },
              { kind:'text', name:'Hours', role:'info', text:INFO.hours,
                props:{ left:W/2, top:b.top+b.h/2+6, originX:'center', fontFamily:th.faces.support,
                        fontSize:21, fill:dim, fontWeight:'700', charSpacing:70 } } ]),
      b => ([ { kind:'rect', name:'Address Plate', props:{ left:56, top:b.top+b.h/2-30, width:W-112, height:60,
                        rx:12, fill:th.accent, opacity:light?0.16:0.22 } },
              { kind:'text', name:'Address', role:'info', text:INFO.address,
                props:{ left:W/2, top:b.top+b.h/2-11, originX:'center', fontFamily:th.faces.support,
                        fontSize:22, fill:onGround, fontWeight:'800', charSpacing:50 } } ]),
      b => (t2.layers.some(l => typeof l.text === 'string' && deck.items && l.text.trim() === String(deck.items).trim()) ? [] :
            [ { kind:'text', name:'We Also Buy', role:'info', text:deck.items,
                props:{ left:W/2, top:b.top+b.h/2-13, originX:'center', fontFamily:th.faces.support,
                        fontSize:25, fill:onGround, fontWeight:'700', charSpacing:20 } } ]),
    ];
    for (let i = 0; i < n && i < bands.length && i < blocks.length; i++)
      blocks[i](bands[i]).forEach(l => t2.layers.push(l));

    /* SPEC CHIP GRID. The single biggest density lever the repo ever measured
       was product art (+70%), and the second is small repeated marks: chips,
       rules, tiles. Competitor ads are full of them. Each is its own named
       layer so any one can be deleted. */
    const CHIPS = ['ANY CONDITION','ANY CARRIER','CRACKED OK','ICLOUD LOCKED OK',
                   'SAME-DAY CASH','FREE PICKUP','NO OBLIGATION','WE COME TO YOU'];
    const band = bands[n] || bands[bands.length-1];
    if (band && band.h >= 96){
      const cols = 4, cw = (W - 128 - 24*(cols-1)) / cols;
      for (let k = 0; k < 8; k++){
        const cx2 = 64 + (k % cols) * (cw + 24), cy2 = band.top + 10 + Math.floor(k/cols) * 46;
        if (cy2 + 40 > band.top + band.h) break;
        t2.layers.push(
          { kind:'rect', name:'Spec Chip ' + (k+1), props:{ left:cx2, top:cy2, width:cw, height:38, rx:19,
              fill: light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.10)',
              stroke: th.accent, strokeWidth:1 } },
          { kind:'text', name:'Spec Chip Text ' + (k+1), role:'badges', text:CHIPS[(seed + k) % CHIPS.length],
            props:{ left:cx2 + cw/2, top:cy2 + 19, originX:'center', originY:'center',
                    fontFamily:th.faces.support, fontSize:15, fill:onGround, fontWeight:'800', charSpacing:40 } });
      }
    }

    /* TRUST MARK — placed, not pinned. It used to sit bottom-left on every
       card in one style, and on half of them it sat on top of the phone plate.
       Rule from the owner, and a correct one: text never goes over other
       assets. So: try top-right first (their preference), then the other
       corners, and test each against every layer already on the frame; if no
       corner is clear, no mark. And about 40% of cards get none regardless —
       a device that appears everywhere stops meaning anything. Four styles,
       so it is not always the same pill with the same tick. */
    const style = seed % 5;                       // 4 = no mark
    if (style < 4 && boxes){
      const label = INFO.seals[(seed >> 1) % INFO.seals.length];
      const sw = 44 + label.length * 11, sh = 52;
      const spots = [ { x: W-56-sw, y: 56 }, { x: 56, y: 56 }, { x: W-56-sw, y: H-116 }, { x: 56, y: H-116 } ];
      const clear = r => !boxes.some(b => !(r.x + r.w <= b.left || b.left + b.width <= r.x ||
                                            r.y + r.h <= b.top  || b.top + b.height <= r.y));
      const spot = spots.find(sp => clear({ x: sp.x - 8, y: sp.y - 8, w: sw + 16, h: sh + 16 }));
      if (spot){
        const x = spot.x, y = spot.y;
        const inkOnPlate = light ? th.onSupport : th.ink;
        if (style === 0){          // pill + tick disc
          t2.layers.push(
            { kind:'rect', name:'Trust Mark', props:{ left:x, top:y, width:sw, height:sh, rx:sh/2,
                fill: light ? th.support : 'rgba(255,255,255,0.14)', stroke: light ? 'rgba(0,0,0,0.10)' : th.accent, strokeWidth:1.25 } },
            { kind:'circle', name:'Trust Mark Disc', props:{ left:x+12, top:y+12, radius:14, fill:th.accent } },
            { kind:'text', name:'Trust Mark Tick', role:'deco', text:'✓',
              props:{ left:x+26, top:y+26, originX:'center', originY:'center', fontFamily:'Satoshi', fontSize:17, fill:th.onAccent, fontWeight:'900' } },
            { kind:'text', name:'Trust Mark Label', role:'badges', text:label,
              props:{ left:x+46, top:y+17, fontFamily:th.faces.support, fontSize:19, fill:inkOnPlate, fontWeight:'800', charSpacing:60 } });
        } else if (style === 1){   // square stamp, accent outline, no fill
          t2.layers.push(
            { kind:'rect', name:'Trust Mark', props:{ left:x, top:y, width:sw, height:sh, rx:8,
                fill:'rgba(0,0,0,0)', stroke:th.accent, strokeWidth:2.5 } },
            { kind:'text', name:'Trust Mark Label', role:'badges', text:label,
              props:{ left:x+sw/2, top:y+sh/2, originX:'center', originY:'center', fontFamily:th.faces.display, fontSize:20, fill:th.accent, fontWeight:'700', charSpacing:90 } });
        } else if (style === 2){   // solid accent chip, dark ink
          t2.layers.push(
            { kind:'rect', name:'Trust Mark', props:{ left:x, top:y, width:sw, height:sh, rx:10, fill:th.accent } },
            { kind:'text', name:'Trust Mark Label', role:'badges', text:'★ ' + label,
              props:{ left:x+sw/2, top:y+sh/2, originX:'center', originY:'center', fontFamily:th.faces.support, fontSize:18, fill:th.onAccent, fontWeight:'900', charSpacing:50 } });
        } else {                   // text only, underlined — the quietest
          t2.layers.push(
            { kind:'text', name:'Trust Mark Label', role:'badges', text:label,
              props:{ left:x+sw/2, top:y+14, originX:'center', fontFamily:th.faces.support, fontSize:18, fill:th.ink, fontWeight:'800', charSpacing:110 } },
            { kind:'rect', name:'Trust Mark Rule', props:{ left:x+10, top:y+42, width:sw-20, height:3, fill:th.accent } });
        }
      }
    }
  }

  function retheme(tpl, th, cutSrc, deck, cat, seed){
    const P = PAL[tpl.pal] || PAL.mono;
    const f = mapper(P, th);
    const light = lumHex(th.c1) > 0.22;
    const t2 = { id: tpl.id, cat: tpl.cat, layers: [] , bg: null };
    t2.bg = Object.assign({}, tpl.bg, {
      /* The old palette's duotone GRADE goes. It remaps the photograph's
         shadows and highlights to that palette's own colours — volt's grade
         crushes shadows to near-black — and carrying it into a new theme is
         how a card ends up as an unusable black-and-teal murk. The new theme
         colours the photo with its scrim; it does not need a second remap
         from a palette that is no longer on the frame. */
      grade: null,
      // a pale theme cannot live under a black scrim
      /* A full greyscale plus a 0.62 wash was costing more edge detail than
         anything else in the frame — measured, our cards sat at 20% density
         against references running 44-49%. The photograph is where a lot of
         that detail lives, so it keeps its texture and most of its contrast;
         hue drift is handled by a lighter, gradient wash instead of a blanket. */
      scrimColor: th.c1,
      scrim: light ? 0.62 : 0.56,
      fallback: tpl.bg.fallback ? Object.assign({}, tpl.bg.fallback, { c1:th.c1, c2:th.c2 }) : null,
    });
    const heads = tpl.layers.filter(l => l.role === 'headline' && typeof l.text === 'string');
    // the subject word, by text — the last headline by index was sometimes a
    // glow duplicate, so "iPAD" kept its ink colour and the accent never showed
    const money = heads.find(l => /IPHONE|PHONE|GOLD|SILVER|COINS|CARS|STRIPS|POK|CARDS|WATCH|IPAD|MACBOOK/i.test(l.text))
               || heads[heads.length - 1];
    const moneyPlate = tpl.layers.some(r => r.kind === 'rect' && r.props && money && money.props && (() => {
      const mx = money.props.left || 0, fs = money.props.fontSize || 40;
      const ty0 = (money.props.top || 0) - (money.props.originY === 'center' ? fs*0.5 : 0), ty1 = ty0 + fs;
      const L0=r.props.left||0,T0=r.props.top||0,W0=r.props.width||0,H0=r.props.height||0;
      return W0 > 300 && mx >= L0-12 && mx <= L0+W0+12 && ty1 > T0 && ty0 < T0+H0; })());
    t2.layers = tpl.layers.map(l => {
      const c = JSON.parse(JSON.stringify(l));
      if (c.props){
        /* The LAST headline is the money word and it takes the accent, the
           same rule applyColorTheme() uses. Mapping it through the colour table
           sent a white headline to ink, and a theme whose accent never appears
           on the frame is not that theme. */
        if (l === money){
          c.props.fill = moneyPlate ? th.onAccent : th.accent; delete c.props.grad; c.__lock = true;
          /* The metals say their name in their metal. "Make the word gold
             golden" — a vertical gradient from highlight to shadow reads as
             metal at headline size, and it is the one place a gradient in
             type earns its keep. Silver gets the same treatment. */
          if (cat === 'gold'   && !moneyPlate) c.props.grad = { c1:'#fff0a8', c2:'#b8860b', a:100 };
          if (cat === 'silver' && !moneyPlate) c.props.grad = { c1:'#f4f6f8', c2:'#8c949e', a:100 };
        }
        /* The plate directly under the money word takes the accent and the word
           takes the accent's ink. bandKnockout's band had been rewritten to a
           neutral by the engine's own passes before the swap, so "neutral stays
           neutral" handed the owner a white slab with a black word on it, next
           to a second white slab. A knockout band is the theme's loudest
           surface; it has to be in the theme's colour. */
        /* PLATE SHAPES. Every band on every card had the layout's own corner
           radius, so the whole set read as the same box over and over. A
           single-line plate takes the card's shape: soft, round, pill, oval,
           slant or square. Panels keep their corners. */
        if ((c.kind === 'rect' || c.kind === 'rrect') && c.props && (c.props.height || 0) <= 210 && (c.props.width || 0) >= 200 && !c.__cursor){
          const SHAPES = ['soft','pill','round','slant','square','pill'];
          const shape = SHAPES[seed % SHAPES.length], h0 = c.props.height || 0;
          delete c.props.ry; delete c.props.skewX;
          if (shape === 'soft') c.props.rx = 16;
          else if (shape === 'round') c.props.rx = Math.min(44, h0 / 2);
          else if (shape === 'pill') c.props.rx = h0 / 2;
          else if (shape === 'square') c.props.rx = 0;
          else if (shape === 'slant'){ c.props.rx = 6; c.props.skewX = -12; }
          else if (shape === 'oval'){ c.props.rx = (c.props.width || 0) / 2; c.props.ry = h0 / 2; c.__padX = Math.round((c.props.width || 0) * 0.16); }
          c.__shape = shape;
        }
        if (c.kind === 'rect' && money && money.props){
          const mx = money.props.left || 0, fs = money.props.fontSize || 40;
          const ty0 = (money.props.top || 0) - (money.props.originY === 'center' ? fs*0.5 : 0), ty1 = ty0 + fs;
          const L0 = c.props.left||0, T0 = c.props.top||0, W0 = c.props.width||0, H0 = c.props.height||0;
          const under = W0 > 300 && mx >= L0 - 12 && mx <= L0 + W0 + 12 && ty1 > T0 && ty0 < T0 + H0;
          if (under && H0 <= fs * 2.1){
            /* BANDS only: a ticket or card also contains the money word, and
               painting a whole ticket in the accent gave a pink slab on a teal
               photo. A band takes the accent; a tall plate keeps its tone.
               solid: buildLayer paints any unmarked hex rect at 45% (app.js:2316).
               lock: the mapper below must not re-derive this — that is exactly
               how #13808d became #4cffff, three renders running. */
            c.props.fill = th.accent; delete c.props.grad; c.solid = true; c.__moneyPlate = true; c.__lock = true;
            /* and size the band to the word: full-bleed under CARS is a slab */
            /* Hug the word only when the plate is a BAND (about one line tall),
               and centre on the word's real centre — the money word is often
               left-aligned, and centring a plate on its left edge parked it
               half off the canvas. A tall lower-third panel keeps its width. */
            const est = (money.text || '').length * fs * 0.62 + fs * 1.2;
            const ox = money.props.originX || 'left';
            const wcx = ox === 'center' ? mx : ox === 'right' ? mx - est/2 : mx + est/2;
            const isBand = H0 <= fs * 2.1;
            if (isBand && est < W0 * 0.72){ const nw = Math.max(est, 320); c.props.left = wcx - nw/2; c.props.width = nw; }
            /* "box is too large": the band is the word plus a fixed margin in
               BOTH directions, not the slab the layout shipped with */
            if (isBand && H0 > fs * 1.45){ const nh = Math.round(fs * 1.3); c.props.top = (ty0 + ty1) / 2 - nh / 2; c.props.height = nh; }
            /* "maybe make it golden": the money band under GOLD is gold */
            if (cat === 'gold'){ c.props.grad = { c1:'#f9e27a', c2:'#c9950f', a:100 }; c.props.fill = '#d9a92a'; c.__metal = '#1a1408'; }
            if (cat === 'silver'){ c.props.grad = { c1:'#f2f4f6', c2:'#9aa3ad', a:100 }; c.props.fill = '#c7ccd2'; c.__metal = '#101418'; }
          }
        }
        /* Role-assigned colours are LOCKED from the mapper. This block runs
           after the money-word and money-plate assignments above, and without
           the lock it took the accent they had just set, failed to find it in
           the palette table, and re-derived it — a #13808d teal band came out
           #4cffff. Debugged by dumping the layer, not by guessing. */
        if (!c.__lock) ['fill','stroke','backgroundColor'].forEach(k => { if (c.props[k] !== undefined) c.props[k] = f(c.props[k]); });
        if (c.props.grad && !c.__lock){ c.props.grad = Object.assign({}, c.props.grad);
          c.props.grad.c1 = f(c.props.grad.c1); c.props.grad.c2 = f(c.props.grad.c2); }
        if (c.props.shadow && c.props.shadow.color) c.props.shadow = Object.assign({}, c.props.shadow, { color: f(c.props.shadow.color) });
        // type follows the theme too, or it is not a theme
        if (typeof c.text === 'string'){
          const big = (c.props.fontSize || 0) >= 70;
          c.props.fontFamily = c.role === 'phone' ? th.faces.num
            : (big || c.role === 'headline') ? th.faces.display : th.faces.support;
          /* a bent line needs a plain letterform: Faster One on the wave was
             "font to curve illegible". Wave, arc and skewed lines take a clean
             condensed face whatever the theme's display face is. */
          const warped = /Wave|Arc|Curve|Bend/i.test(c.name || '') || c.props.path || Math.abs(c.props.skewX || 0) > 4 || Math.abs(c.props.skewY || 0) > 4;
          const DECOR = /Faster One|Sedgwick|Rubik|Wallpoet|Freckle|Nosifer|Creepster|Bungee|Rye|Fascinate|Luckiest|Shrikhand|Special Elite|Press Start|Pirata|Kaushan|Knewave|Bangers|Permanent|Kalam|Patrick|Shadows|Gloria|Nanum|Architects|Amatic|Cabin Sketch|Instrument Serif|Cormorant/i;
          if (warped && DECOR.test(c.props.fontFamily)) c.props.fontFamily = ['Oswald','Big Shoulders Display','Barlow Condensed'][seed % 3];
          /* a heavy decorative face carries a WORD, not a sentence: ANY WRITTEN
             OFFER in Faster One was a stripe — "not legible". Past the face's
             limit the line falls back to a condensed face. */
          const LIMIT = { 'Faster One':8, 'Nosifer':9, 'Creepster':10, 'Rubik Wet Paint':11, 'Rubik Marker Hatch':11, 'Rubik Dirt':11,
            'Rubik Doodle Shadow':10, 'Rubik Iso':10, 'Bungee Shade':10, 'Fascinate':10, 'Press Start 2P':10, 'Wallpoet':10,
            'Rye':12, 'Sedgwick Ave Display':12, 'Sedgwick Ave':14, 'Freckle Face':12, 'Shrikhand':12, 'Luckiest Guy':14, 'Bangers':16,
            'Special Elite':16, 'Cabin Sketch':12, 'Pirata One':8, 'Big Shoulders Stencil Display':14, 'Kaushan Script':16, 'Knewave':14 };
          const lim = LIMIT[c.props.fontFamily];
          if (lim && String(c.text).split('\n').some(x => x.trim().length > lim)) c.props.fontFamily = ['Oswald','Big Shoulders Display','Barlow Condensed'][seed % 3];
          if (TRACK[c.props.fontFamily] !== undefined) c.props.charSpacing = TRACK[c.props.fontFamily];
          /* a glow on a condensed face fills its counters and it stops being
             readable — COINS in Big Shoulders with a bloom was the example */
          if (/Oswald|Big Shoulders|Barlow Condensed|Teko|Saira Condensed|Russo One|Squada One|Anton|Bebas|Khand|League Gothic|Press Start|Bungee|Pirata|Faster One|Rubik/i.test(c.props.fontFamily) && c.props.shadow){
            const sh = c.props.shadow; if ((sh.blur || 0) > 8 && !(sh.offsetX || sh.offsetY)) delete c.props.shadow;
          }
        }
        if (c.kind === 'cutout' && cutSrc) c.props.src = cutSrc;
        /* the copy follows the device line too: a template built for the coarse
           "phones" deck says iPHONE, which is wrong the moment the product is a
           Galaxy or a Pixel. Headline, kicker, items and price all move. */
        if (deck && typeof c.text === 'string'){
          /* A layer is sized, positioned and often back-plated for the exact
             string it was authored with. "LICENSED BUYER" -> "LICENSED APPLE
             BUYER" is 40% longer, and the angled highlight behind it ran off
             the left edge of the canvas. Only swap copy that fits the space the
             design already allows for. */
          const fits = t => typeof t === 'string' && t.length <= c.text.length * 1.15 + 2;
          const put = t => { if (fits(t)) c.text = t; };
          /* LONGER MONEY LINES on one card in two: "iPhone, iPad, MacBook",
             "gold chains, bracelets, rings", "cars, trucks & vans", "diabetic
             supplies" — so people know what is bought */
          const LONG = { iphone:['iPHONE · iPAD · MACBOOK','iPHONE & iPAD'], ipad:['iPAD PRO · AIR · MINI · REGULAR'], macbook:['MACBOOK PRO & AIR'], watch:['APPLE WATCH'],
            gold:['GOLD CHAINS & RINGS','GOLD JEWELRY'], silver:['SILVER & SILVERWARE','SILVER COINS & BARS'], coins:['COINS & BULLION','SILVER DOLLARS'],
            /* makes a seller actually walks in with (owner, 2026-09-03: "too niche and
             odd" on AUDIS) — Audi, Porsche, Acura, Mazda, Infiniti and the rest are out */
            cars:['CARS, TRUCKS & VANS','CARS & TRUCKS','TOYOTAS','HONDAS','FORDS','CHEVYS','NISSANS','JEEPS','TESLAS','BMWS','MERCEDES','HYUNDAIS','KIAS','DODGES'], trucks:['TRUCKS & VANS','F-150S','SILVERADOS','TACOMAS','RAMS'], bikes:['MOTORCYCLES','HARLEYS','HONDAS','YAMAHAS','KAWASAKIS'], vans:['CARGO VANS','TRANSITS','SPRINTERS'],
            strips:['DIABETIC SUPPLIES','TEST STRIPS & CGMS'], pokemon:['POKÉMON CARDS'], sports:['SPORTS CARDS & SLABS'] };
          const lineKey = deck && deck.bgcat && LONG[deck.bgcat] ? deck.bgcat : deck && deck.cuts && /^car-truck/.test(deck.cuts[0]) ? 'trucks' : deck && deck.cuts && /^car-van/.test(deck.cuts[0]) ? 'vans' : deck && deck.cuts && /^car-motorcycle/.test(deck.cuts[0]) ? 'bikes' : deck && deck.cuts ? (/^own-apple|^iphone/.test(deck.cuts[0]) ? 'iphone' : /^ipad/.test(deck.cuts[0]) ? 'ipad' : /^mac/.test(deck.cuts[0]) ? 'macbook' : /^watch/.test(deck.cuts[0]) ? 'watch' : cat) : cat;   // a bike deck takes the bike brands, never DODGES over a motorcycle
          if (c.role === 'headline'){
            /* a layout whose headlines carry no money word (CASH IN / 3 STEPS)
               says what is bought in line one: SELL GOLD / IN 3 STEPS. "Make
               it super explicit and clear what's being bought." */
            if (/^CASH IN$/i.test(c.text.trim()) && !heads.some(h => /IPHONE|PHONE|GOLD|SILVER|COINS|CARS|STRIPS|POK|CARDS|WATCH|IPAD|MACBOOK|TRUCK|BIKE|VAN/i.test(h.text || ''))){
              const money = String(deck.h2 || '').replace(/^(YOUR|THE)\s+/i, '').split(' ')[0];
              c.text = money ? 'SELL ' + money.toUpperCase() : c.text;
            }
            if (/^3 STEPS$/i.test(c.text.trim())) c.text = 'IN 3 STEPS';
            if (/^(SELL YOUR|CASH FOR|WE BUY|SPORTS)$/i.test(c.text.trim())){
              /* metals: "cash out" and "cash in" read as what the customer is
                 doing; the opener rotates through them */
              const METAL = { gold:['CASH FOR','CASH OUT YOUR','CASH IN YOUR','WE BUY'], silver:['CASH FOR','CASH OUT YOUR','WE BUY','CASH IN YOUR'], coins:['WE BUY','CASH OUT YOUR','CASH IN YOUR','CASH FOR'] };
              c.text = (!deck.challengePromise && METAL[cat]) ? METAL[cat][seed % 4] : deck.h1;
            }
            else if (deck.challengePromise ? (l === money) : (l === money || /IPHONE|PHONE/i.test(c.text))){
              const longs = LONG[lineKey];
              c.text = (!deck.challengePromise && longs && seed % 2 === 1) ? longs[seed % longs.length] : deck.h2;
              /* "we buy toyotas": a brand line brings its models along */
              const BRAND_ITEMS = { TOYOTAS:'Camry • Corolla • Tacoma • RAV4 • 4Runner', HONDAS:'Civic • Accord • CR-V • Pilot • Odyssey', TESLAS:'Model 3 • Model Y • Model S • Model X',
                BMWS:'3 Series • 5 Series • X3 • X5 • M Series', FORDS:'F-150 • Mustang • Explorer • Bronco', LEXUS:'RX • ES • IS • GX • NX',
                'F-150S':'XL • XLT • Lariat • Raptor', SILVERADOS:'1500 • 2500 • LT • Z71', TACOMAS:'SR • TRD • Off-Road • Pro', RAMS:'1500 • 2500 • Big Horn • Laramie',
                HARLEYS:'Sportster • Softail • Street Glide • Road King', YAMAHAS:'R1 • R6 • MT-07 • MT-09', TRANSITS:'Cargo • Connect • High Roof', SPRINTERS:'Cargo • Crew • High Roof',
                CHEVYS:'Silverado • Tahoe • Equinox • Malibu • Camaro', NISSANS:'Altima • Rogue • Sentra • Frontier • Titan', JEEPS:'Wrangler • Grand Cherokee • Gladiator • Compass', SUBARUS:'Outback • Forester • Crosstrek • WRX • Impreza',
                MERCEDES:'C-Class • E-Class • GLC • GLE • S-Class', AUDIS:'A4 • A6 • Q5 • Q7 • S4', KIAS:'Telluride • Sorento • Forte • Sportage • K5', HYUNDAIS:'Tucson • Santa Fe • Elantra • Sonata • Palisade',
                MAZDAS:'CX-5 • Mazda3 • CX-9 • MX-5', DODGES:'Charger • Challenger • Durango • Ram', PORSCHES:'911 • Cayenne • Macan • Taycan', ACURAS:'MDX • RDX • TLX • Integra',
                TUNDRAS:'SR5 • Limited • TRD Pro • 1794', SIERRAS:'1500 • 2500 • AT4 • Denali', 'F-250S':'XL • XLT • Lariat • King Ranch', GLADIATORS:'Sport • Rubicon • Mojave',
                KAWASAKIS:'Ninja • Z900 • Vulcan • KLR', DUCATIS:'Monster • Panigale • Scrambler • Multistrada', SUZUKIS:'GSX-R • Hayabusa • V-Strom • Boulevard', TRIUMPHS:'Bonneville • Street Triple • Tiger • Speed Twin',
                PROMASTERS:'1500 • 2500 • 3500 • High Roof', 'EXPRESS VANS':'2500 • 3500 • Cargo • Extended' };
              if (BRAND_ITEMS[c.text]) { deck.__brandItems = BRAND_ITEMS[c.text]; deck.__brandWord = c.text; }   // and the word it belongs to
            }
            // the money word alone in a card says what we are: GOLD BUYER
            if (heads.length === 1 && l === money && !deck.challengePromise && !/BUYER/i.test(c.text)) c.text = c.text.trim() + ' BUYER';
          }
          // the kicker: short, rotated; in challenge mode it is the question
          /* THE STICKER SAYS SOMETHING. Owner, 2026-09-03: "top $$$ is a little
             too random and vague." Dollar signs are not an offer; what the shop
             actually does is. Short enough to keep the curved sticker's shape. */
          if (/^Sticker Text$/.test(c.name || '') || /^TOP \$+$/.test(String(c.text || '').trim())){
            const STICK = ['CASH TODAY', 'PAID TODAY', 'SAME DAY', 'ON THE SPOT', 'FREE QUOTE'];
            c.text = STICK[(seed + (c.props.top || 0)) % STICK.length];
            c.props.fontSize = Math.max(26, Math.round((c.props.fontSize || 44) * 7 / c.text.length));
          }
          if (c.name === 'Kicker' || /LICENSED .*BUYER|APPLE BUYER|COLLECTIONS WANTED/i.test(c.text)
              || (c.role === 'sub' && (c.props.top || 0) < 130 && (c.props.fontSize || 40) < 56)){
            const pool = KICKERS[deck.cuts && /iphone|ipad|mac|watch/.test(deck.cuts[0]) ? 'apple' : cat] || KICKERS.apple;
            c.text = deck.challengePromise ? deck.k : pool[seed % pool.length];
          }
          // "$1,100" in a tile is a flat promise; the shop pays UP TO that
          if (/^\$[\d,]+\+?$/.test(c.text.trim()) && /Tile Big|Big Number|Price Big|Anchor/i.test(c.name || '')) c.text = 'UP TO ' + c.text.trim();

          /* The list is authored to a length: the strips deck's seven brands
             ran to 78 characters on a 36-character line, and the frame clamp
             then shrank it to 30px across the whole width. Keep brands from
             the front until the line is about as long as the one it replaces
             (never fewer than two). */
          const trimList = (items, maxLen) => {
            const tok = String(items || '').split('•').map(t => t.trim()).filter(Boolean);
            let keep = tok.slice(0, 2);
            for (let q = 2; q < tok.length; q++){ const next = keep.concat(tok[q]).join(' • '); if (next.length > maxLen) break; keep.push(tok[q]); }
            return keep.join(' • ');
          };
          /* …and never longer than the frame can show at the authored size: a
             strips template authored WITH the long list still shrank it. A
             single line gets 82% of the width at ~0.52em per character; a
             wrapping textbox may take two lines. */
          if (/^Items|^Info Text/i.test(c.name || '')){
            /* only while that brand is still the word on the card: a TRUCKS
               headline over "A4 · A6 · Q5 · Q7 · S4" is the wrong car (owner,
               2026-09-03: "this one looks terrible") */
            if (deck.__brandItems && heads.some(h => String(h.text || '').toUpperCase().includes(deck.__brandWord))) deck.items = deck.__brandItems;
            else if (deck.__brandItems) { delete deck.__brandItems; delete deck.__brandWord; }
            const perLine = Math.floor(W * 0.82 / ((c.props.fontSize || 40) * 0.52));
            const cap = c.kind === 'textbox' ? perLine * 2 : perLine;
            c.text = trimList(deck.items, Math.min(cap, Math.max(c.text.length * 1.15 + 2, 36)));
          }
          /* the HUD chip is a two-line data readout; the base deck's own pair
             ("iPhone / iPad") stayed on an iPad ad because nothing swapped it */
          /* reviewProof's "Who" stack listed IPHONE 17 / GALAXY / PIXEL under
             every quote, at 19px — the base template's own copy. It takes the
             deck's first three items, one per line, at a readable size. */
          /* under a quote: who said it and where — a pin, a first name and
             initial, city and state. (The studio fills this from the shop's
             real reviews; these rotate as placeholders.) */
          if (c.name === 'Who'){
            const NAMES = ['Marcus T.','Priya R.','Danny O.','Alyssa M.','Jordan K.','Rosa V.','Kevin L.','Tasha B.','Miguel S.','Erin W.'];
            const CITIES = ['Long Beach, CA','Lakewood, CA','Downey, CA','Carson, CA','Torrance, CA','Cerritos, CA','Bellflower, CA','Signal Hill, CA'];
            c.text = NAMES[seed % NAMES.length] + '  ·  ' + CITIES[(seed * 3 + 1) % CITIES.length];
            c.props.fontSize = Math.max(26, c.props.fontSize || 26);
            c.props.originX = 'center'; c.props.left = W / 2; c.props.charSpacing = 20; c.props.fontWeight = '600';
            c.__reviewer = true;
          }
          if (c.name === 'Data Line' && deck.items){
            const tok = String(deck.items).split('•').map(t => t.trim()).filter(Boolean);
            c.text = tok[0] + '\n' + tok.slice(1, 3).join(' · ');
          }
          // exact name only: /Price/i also matched the kicker above it, so the
          // same sentence printed twice in different sizes
          if (c.name === 'Price Line' && deck.price) c.text = deck.price;
        }
      }
      return c;
    });
    /* the NUMBER gets a cue too, on two cards in five: a phone mark at its
       left edge and a small TEXT OR CALL label above it — "otherwise people
       don't really know what it's for" */
    { const ph = t2.layers.find(l => l.role === 'phone' && typeof l.text === 'string' && l.props);
      if (ph && seed % 5 < 2){
        const fs = ph.props.fontSize || 48, est = String(ph.text).length * fs * 0.56, ox = ph.props.originX || 'left', lx = ph.props.left || 0;
        const x0 = ox === 'center' ? lx - est / 2 : ox === 'right' ? lx - est : lx, size = Math.round(fs * 0.9);
        t2.layers.push({ kind:'path', icon: seed % 2 ? 'phoneMark' : 'phone', name:'Phone Cue', role:'deco', __cursor:true,
          props:{ left: x0 - size - 12, top: (ph.props.top || 0) - (ph.props.originY === 'center' ? size / 2 : -2), size, fill: ph.props.fill } });
      }
      const cta = t2.layers.find(l => l.role === 'cta' && typeof l.text === 'string');
      if (cta && seed % 3 === 1) cta.text = ['TEXT US NOW', 'CALL OR TEXT NOW', 'TEXT NOW FOR A QUOTE', 'TEXT A PHOTO, GET A NUMBER'][seed % 4];
    }
    /* KICKER VARIANTS. "Always online variation with the green dot, or
       headset on the right": one card in four says ONLINE NOW with a green
       dot at its left; one in four keeps its word and takes a headset mark at
       its right. */
    { const kick = t2.layers.find(l => l.name === 'Kicker' && typeof l.text === 'string' && l.props);
      if (kick && !deck.challengePromise){
        const fs = kick.props.fontSize || 30, ox = kick.props.originX || 'left', lx = kick.props.left || 0;
        const est = () => String(kick.text).length * fs * 0.62;
        const cy = (kick.props.top || 0) + (kick.props.originY === 'center' ? 0 : fs * 0.55);
        if (seed % 4 === 1){
          kick.text = ['ONLINE NOW · TEXT US', 'ONLINE NOW', 'REPLYING NOW'][seed % 3];
          const x0 = ox === 'center' ? lx - est() / 2 : ox === 'right' ? lx - est() : lx;
          t2.layers.push({ kind:'circle', name:'Online Dot', solid:true, __lock:true, __cursor:true, props:{ left: x0 - fs * 0.9, top: cy - fs * 0.28, radius: fs * 0.28, fill: '#3ddc84' } });
        } else if (seed % 4 === 2){
          const x1 = ox === 'center' ? lx + est() / 2 : ox === 'right' ? lx : lx + est();
          t2.layers.push({ kind:'path', icon:'headset', name:'Headset', role:'deco', __cursor:true, props:{ left: x1 + 14, top: cy - fs * 0.5, size: fs * 1.05, fill: kick.props.fill } });
        }
      } }
    /* "add a cursor icon near website so people know what it is" — and the
       line itself at full ink, not the 45% ghost the library ships */
    { const web = t2.layers.find(l => l.role === 'website' && typeof l.text === 'string');
      if (web && web.props){
        const q = String(web.props.fill || '').match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
        if (q) web.props.fill = '#' + [1,2,3].map(k => (+q[k]).toString(16).padStart(2,'0')).join('');
        web.props.opacity = 1;
        const fs = web.props.fontSize || 26, est = String(web.text).length * fs * 0.56;
        const ox = web.props.originX || 'left', lx = web.props.left || 0;
        const x0 = ox === 'center' ? lx - est / 2 : ox === 'right' ? lx - est : lx;
        const size = Math.round(fs * 1.35);
        const mark = seed % 2 === 0 ? 'arrowRight' : 'globe';
        t2.layers.push({ kind:'path', icon:mark, name:'Cursor', role:'deco', __cursor:true,
          props:{ left: x0 - size - 10, top: (web.props.top || 0) - (web.props.originY === 'center' ? size/2 : 1), size, fill: web.props.fill } });
      } }
    { const who = t2.layers.find(l => l.__reviewer);
      if (who && who.props){
        const fs = who.props.fontSize || 26, est = String(who.text).length * fs * 0.52, size = Math.round(fs * 1.25);
        t2.layers.push({ kind:'path', icon:'pin', name:'Pin', role:'deco', __cursor:true,
          props:{ left: W / 2 - est / 2 - size - 8, top: (who.props.top || 0) - 2, size, fill: who.props.fill } });
      } }
    { const metal = t2.layers.find(l => l.__metal);
      if (metal){
        const mw = t2.layers.find(l => l.role === 'headline' && typeof l.text === 'string' && /GOLD|SILVER/i.test(l.text) && (l.props.fontSize || 0) >= 70);
        if (mw){ mw.props.fill = metal.__metal; delete mw.props.grad; mw.props.opacity = 1; mw.__lock = true; if (mw.props.shadow) delete mw.props.shadow; }
      } }
    /* STEPS FLOW says SELL YOUR / <money line>, with IN 3 STEPS as the kicker:
       an opener that already carried the money word doubled it on line two */
    if (/stepsFlow/.test(tpl.id || '')){
      const hs = t2.layers.filter(l => l.role === 'headline' && typeof l.text === 'string');
      const h1 = hs.find(l => /^(SELL |CASH IN|CASH OUT|WE BUY|CASH FOR)/i.test(l.text.trim())), h2 = hs.find(l => l !== h1);
      if (h1 && h2 && !deck.challengePromise){
        /* "sell your gold — chains, rings, bracelets": line one carries the
           subject at the big size, line two lists what counts */
        const SPEC = { gold:'CHAINS, RINGS, BRACELETS', silver:'SILVERWARE, COINS, JEWELRY', coins:'MORGANS, EAGLES, KEY DATES', cars:'CARS, TRUCKS, VANS',
          trucks:'F-150, SILVERADO, RAM', bikes:'HARLEY, HONDA, YAMAHA', vans:'TRANSIT, SPRINTER, PROMASTER', strips:'STRIPS, METERS, CGMS',
          pokemon:'CARDS, SLABS, SEALED', sports:'ROOKIES, AUTOS, SLABS' };
        const lineSpec = { iphone:'17 · 16 · 15 · PRO MAX', ipad:'PRO, MINI, AIR, REGULAR', macbook:'PRO & AIR, M1–M5', watch:'SERIES 11, ULTRA 3, SE' };
        const key = deck && deck.cuts ? (/^own-apple|^iphone/.test(deck.cuts[0]) ? 'iphone' : /^ipad|^qs-ipad/.test(deck.cuts[0]) ? 'ipad' : /mac/.test(deck.cuts[0]) ? 'macbook' : /watch/.test(deck.cuts[0]) ? 'watch' : cat) : cat;
        const money = String(deck.h2 || '').replace(/^(YOUR|THE)\s+/i, '');
        const opener = ({ gold:'CASH IN YOUR', silver:'CASH IN YOUR', coins:'CASH IN YOUR' }[cat] || 'SELL YOUR');
        const big = Math.max(h1.props.fontSize || 100, h2.props.fontSize || 100), small = Math.min(h1.props.fontSize || 100, h2.props.fontSize || 100);
        h1.text = opener + ' ' + money; h1.props.fontSize = big;
        h2.text = lineSpec[key] || SPEC[cat] || String(deck.items || '').split('•').slice(0, 3).map(x => x.trim().toUpperCase()).join(', '); h2.props.fontSize = Math.round(small * 0.9);
        const kick = t2.layers.find(l => l.name === 'Kicker' && typeof l.text === 'string');
        if (kick) kick.text = 'IN 3 STEPS';
      }
    }
    /* accents on faces that have no accented glyphs fall back to another font
       mid-word ("fix E"): those faces get the plain letter */
    { const NO_ACCENT = /Permanent Marker|Cabin Sketch|Amatic|Gloria|Shadows Into|Nanum|Architects|Patrick Hand|Kalam|Faster One|Press Start|Wallpoet|Freckle|Luckiest|Bangers|Knewave|Sedgwick|Rye|Fascinate|Special Elite|Bungee|Squada|Russo|Audiowide|Pirata|Creepster|Nosifer|Rubik Wet|Rubik Dirt|Rubik Marker|Rubik Doodle|Rubik Iso|Big Shoulders Stencil/i;
      t2.layers.forEach(l => { if (typeof l.text === 'string' && l.props && NO_ACCENT.test(l.props.fontFamily || '') && /[ÉéÈèÀàÁáÑñÖöÜü]/.test(l.text))
        l.text = l.text.replace(/É/g,'E').replace(/é/g,'e').replace(/[ÈÀÁ]/g, m => ({'È':'E','À':'A','Á':'A'})[m]).replace(/[èàá]/g, m => ({'è':'e','à':'a','á':'a'})[m]).replace(/Ñ/g,'N').replace(/ñ/g,'n').replace(/Ö/g,'O').replace(/ö/g,'o').replace(/Ü/g,'U').replace(/ü/g,'u'); }); }
    /* the decorative-face limits again, now that the copy is final: the
       in-map check saw iPHONE (6) where TCGPLAYER'S (11) ended up */
    { const LIMIT2 = { 'Faster One':8, 'Nosifer':9, 'Creepster':10, 'Rubik Wet Paint':11, 'Rubik Marker Hatch':11, 'Rubik Dirt':11,
        'Rubik Doodle Shadow':10, 'Rubik Iso':10, 'Bungee Shade':10, 'Fascinate':10, 'Press Start 2P':10, 'Wallpoet':10,
        'Rye':12, 'Sedgwick Ave Display':12, 'Sedgwick Ave':14, 'Freckle Face':12, 'Shrikhand':12, 'Luckiest Guy':14, 'Bangers':16,
        'Special Elite':16, 'Cabin Sketch':12, 'Pirata One':8, 'Big Shoulders Stencil Display':14, 'Kaushan Script':16, 'Knewave':14 };
      const fb = ['Oswald','Big Shoulders Display','Barlow Condensed'][seed % 3];
      let headFell = false;
      t2.layers.forEach(l => { if (typeof l.text !== 'string' || !l.props) return;
        const lim = LIMIT2[l.props.fontFamily];
        if (lim && String(l.text).split('\n').some(x => x.trim().length > lim)){ l.props.fontFamily = fb; if (l.role === 'headline') headFell = true; } });
      /* one sentence, one face: if any headline line fell back, they all do */
      if (headFell) t2.layers.forEach(l => { if (l.role === 'headline' && l.props && typeof l.text === 'string') l.props.fontFamily = fb; }); }
    /* WE BEAT / CARVANA'S / TRADE-IN OFFER is one sentence. The third line
       lives in the items slot, which is styled as small italic info — "almost
       looks like it's not there". Same sentence, same face, same colour as
       line two: "keep it purple". */
    if (deck && deck.tail && deck.tailText){
      const h2 = t2.layers.find(l => l.role === 'headline' && typeof l.text === 'string' && l.text.trim() === String(deck.h2).trim());
      const h1 = t2.layers.find(l => l.role === 'headline' && l !== h2 && typeof l.text === 'string' && /^(WE BEAT|WE TOP|WE OUTBID|WE MATCH)$/i.test(l.text.trim()));
      if (h2 && h1){
        const hp = h2.props || {};
        /* THREE HEADLINE LINES, ONE FACE. The header may run to three lines;
           the third never goes into an info line ("kind of makes confusion"),
           and every line is set in the same face — a sentence that changes
           face mid-way loses its last three words, which are the ones that
           matter. Colour: line one keeps its own, line three takes line two's. */
        const face = hp.fontFamily;
        h1.props.fontFamily = face;
        // a third headline line already in the layout (BUYER) is reused
        let tail = t2.layers.find(l => l.role === 'headline' && l !== h1 && l !== h2 && typeof l.text === 'string' && /^BUYER$/i.test(l.text.trim()));
        /* the stack is tight: when line one is above line two, line two sits
           right under it whatever size line one ends up — the authored gap
           was for the authored size, and "line skip looks odd" */
        const warped2 = /Wave|Arc|Curve|Bend/i.test(h2.name || '') || h2.props.path || Math.abs(h2.props.skewX || 0) > 4 || Math.abs(h2.props.angle || 0) > 4;
        const LEAD2 = warped2 ? 1.5 : 1.14;             // a bent line's box is far taller than its size
        const stacked = !warped2 && (h2.props.top || 0) > (h1.props.top || 0) + 20;
        const settle = () => { if (stacked) h2.props.top = (h1.props.top || 0) + (h1.props.fontSize || 100) * 1.1; };
        settle();
        /* line three is set like line one — small / BIG / small — and sits
           tight under line two; a smaller tail with a skip "looks odd" */
        const fs = Math.max(34, Math.min(h1.props.fontSize || 999, Math.round((hp.fontSize || 160) * 0.5)));
        if (!tail){
          tail = { kind:'text', role:'headline', name:'Headline 3', text:'', props:{} };
          t2.layers.splice(t2.layers.indexOf(h2) + 1, 0, tail);
        }
        tail.text = String(deck.tailText).toUpperCase();
        tail.props = Object.assign({}, tail.props, {
          fontFamily: face, fontWeight: hp.fontWeight || '800', fontStyle: 'normal', fill: hp.fill, charSpacing: hp.charSpacing || 0,
          fontSize: fs, originX: hp.originX || 'left', originY: 'top', left: hp.left, top: (hp.top || 0) + (hp.fontSize || 100) * LEAD2,
          shadow: hp.shadow ? Object.assign({}, hp.shadow) : undefined });
        if (hp.grad) tail.props.grad = hp.grad;
        if (hp.stroke){ tail.props.stroke = hp.stroke; tail.props.strokeWidth = (hp.strokeWidth || 0) * 0.42; }
        tail.__lock = true; tail.__pinned = true;
        /* room under line two: when short, lines one and two give up 15% */
        /* the room is to whatever comes next — the checklist rows, the items
           pill, the CTA — not to the bottom of the frame */
        const h2bottom = () => (h2.props.top || 0) + (h2.props.fontSize || 100) * LEAD2;
        const nextTop = Math.min(H - 42, ...t2.layers.filter(l => l !== tail && l !== h1 && l !== h2 && l.props && typeof l.text === 'string' && l.role !== 'badges' && !(l.role === 'deco' && (l.props.fontSize || 0) < 30)
          && (l.props.top || 0) > (h2.props.top || 0) + 20).map(l => (l.props.top || 0) - ((l.props.originY === 'center') ? (l.props.fontSize || 30) / 2 : 0) - 14));
        const room = () => nextTop - h2bottom();
        if (room() < fs * 1.2){
          /* lines one and two give up what the tail needs, down to 55%: the
             tail is half of line two, never a 30px afterthought */
          let guard = 0;
          while (room() < Math.round((h2.props.fontSize || 100) * 0.5) * 1.2 && guard++ < 14 && (h2.props.fontSize || 100) > (hp.fontSize || 100) * 0.55)
            { [h1, h2].forEach(l => { l.props.fontSize = Math.round((l.props.fontSize || 100) * 0.94); }); settle(); }
          tail.props.top = (h2.props.top || 0) + (h2.props.fontSize || 100) * LEAD2;
          tail.props.fontSize = Math.max(30, Math.min(Math.round((h2.props.fontSize || 100) * 0.5), Math.floor(room() / 1.2)));
        }
      }
    }
    /* "I don't know if being insured is a selling point, maybe for car
       buyers, not metal buyers": INSURED stays on cars only; elsewhere the
       seal becomes one the category can claim. */
    if (cat !== 'cars'){
      const SWAP = { gold:'DISCREET', silver:'DISCREET', coins:'DISCREET', strips:'PRIVATE', pokemon:'TRUSTED', sports:'TRUSTED', phones:'TRUSTED' };
      const alt = SWAP[cat] || 'TRUSTED';
      t2.layers.forEach(l => { if (typeof l.text !== 'string' || !/INSURED/i.test(l.text)) return;
        const lines = l.text.split('\n'), others = lines.map(x => x.trim().toUpperCase());
        l.text = lines.map(x => /INSURED/i.test(x) ? x.replace(/INSURED/i, others.includes(alt) ? 'BONDED' : alt) : x).join('\n'); });
    }
    /* EMPTY DISC GETS A TICK — as a LAYER, once. The engine's own passes strip
       the glyph layers out of the checklist rows before this lab sees them, so
       the discs arrived empty. Injecting during paint() re-added them on every
       one of the several paints per card and stacked strays down the left
       edge; a layer added here is built like any other and painted once. */
    const added = [];
    t2.layers.forEach(l => {
      if (l.kind !== 'circle' || !l.props) return;
      const r = l.props.radius || 0; if (r < 12 || r > 40) return;
      const cx = (l.props.left || 0) + r, cy = (l.props.top || 0) + r;
      /* a glyph OR a vector: the check used to look only for text, so when the
         tick had already been drawn as an icon a second one landed on top of it
         — "we're putting two vectors?? it looks like confused AI" */
      const has = t2.layers.some(g => g.props && (typeof g.text === 'string' || g.kind === 'path' || g.icon) &&
        Math.hypot(((g.props.left || 0) + (g.props.originX === 'center' ? 0 : (g.props.size || 20) / 2)) - cx,
                   ((g.props.top || 0) + (g.props.originY === 'center' ? 0 : (g.props.size || 20) / 2)) - cy) < 30);
      if (!has) added.push({ kind:'text', name:'Tick Mark', role:'deco', text:'✓',
        props:{ left:cx, top:cy, originX:'center', originY:'center', fontFamily:'Satoshi',
                fontSize: Math.round(r * 1.25), fontWeight:'900', fill:'#101014' } });
    });
    t2.layers.push(...added);
    return t2;
  }

  /* A cutout's place is decided before it is built. Clamping the built
     object came too late for the product on lowerThird, which kept bleeding
     off the top-left. Its props are plain numbers; keep them inside a margin
     and it cannot leave the frame. Width doubles as height, which is the
     worst case for these assets. */
  function keepCutoutsInFrame(t2){
    /* A clamp that only pushes ends up parking every product in the top-left
       corner at (40,40) and cropping whatever is bigger than it guessed —
       which is what the owner saw across a whole page of lowerThird cards.
       So: use the asset's REAL proportions, and when a product would have to
       be pushed, re-home it — centred horizontally in the open band above the
       lowest wide panel, sized to that band — rather than shoved. */
    const M = 40;
    // the top of the lowest wide panel: the product must stay above it
    let panelTop = H;
    t2.layers.forEach(l => {
      if ((l.kind === 'rect' || l.kind === 'rrect') && l.props && (l.props.width || 0) > W * 0.6 && (l.props.height || 0) > 140){
        const t = l.props.top || 0; if (t > H * 0.35 && t < panelTop) panelTop = t;
      }
    });
    t2.layers.forEach(l => {
      if (l.kind !== 'cutout' || !l.props || l.__wall) return;
      const el = CUTOUT_ELS[l.props.src];
      const aspect = el && el.width ? el.height / el.width : 1;
      let w = l.props.w || 400, ox = l.props.originX || 'left';
      const a = Math.abs((l.props.angle || 0) * Math.PI / 180);
      const grow = Math.abs(Math.sin(a)) + Math.abs(Math.cos(a));
      const roomH = panelTop - M * 2;                       // vertical room above the panel
      const maxW = Math.min((W - M*2) / grow, roomH / (aspect * grow));
      if (w > maxW) w = Math.max(160, maxW);
      const h = w * aspect;
      let left = l.props.left || 0, top = l.props.top || 0;
      const x0 = ox === 'right' ? left - w : ox === 'center' ? left - w/2 : left;
      const offends = x0 < M || x0 + w > W - M || top < M || top + h > panelTop - M;
      if (offends){
        // re-home: centred in the open band above the panel
        l.props.originX = 'center';
        l.props.left = W / 2;
        l.props.top = Math.max(M, (panelTop - h) / 2);
      }
      /* "feels incomplete": a small product floating over an empty upper
         half. When the only text up there is the badge stack, the product
         takes 80% of the room above the panel, centred. */
      if (panelTop < H * 0.8){
        const textUp = t2.layers.some(x => typeof x.text === 'string' && x.role !== 'badges' && x.props && (x.props.top || 0) < panelTop - 20 && x.kind !== 'path');
        const roomH2 = panelTop - M * 2;
        if (!textUp && h < roomH2 * 0.6){
          const w2 = Math.min((W - M*2) * 0.8 / grow, roomH2 * 0.85 / (aspect * grow));
          if (w2 > w){ w = w2; l.props.originX = 'center'; l.props.left = W / 2; l.props.top = Math.max(M, (panelTop - w * aspect) / 2); }
        }
      }
      l.props.w = w;
    });
  }
  /* CATEGORY SIGNATURE. Owner, 2026-09-02, on a page of scriptRetro cards:
     "differing categories but no difference in theme style. Each theme should
     be 100% unique to each category.. maybe we can have similar ones or
     variations but not the exact same set up or it starts to look generic."
     The same layout reached every category in the same setup; only the copy
     and the palette changed. Each category now owns a setup — where the stack
     sits, what the ornament is, whether the kicker tilts, the plate shape and
     which palette tone carries the plates — and one card in three takes the
     category's variation, so a category is a family rather than a stamp. */
  const SIG = {
    phones:  { align:'center', alt:'left',   divider:'━━━━━━━━━━',  kick:0,  frame:null,     plate:'pill',   plateAlt:'soft',   tone:'accent2', tone2:'support' },
    cars:    { align:'left',   alt:'center', divider:'▶ ▶ ▶',       kick:0,  frame:'bar',    plate:'slant',  plateAlt:'square', tone:'accent',  tone2:'accent3' },
    gold:    { align:'center', alt:'left',   divider:'═══ ◆ ═══',   kick:0,  frame:'double', plate:'square', plateAlt:'soft',   tone:'accent3', tone2:'support' },
    silver:  { align:'right',  alt:'center', divider:'── ◇ ──',     kick:0,  frame:'single', plate:'soft',   plateAlt:'square', tone:'support', tone2:'accent2' },
    coins:   { align:'left',   alt:'center', divider:'•  •  •',     kick:0,  frame:'dotted', plate:'round',  plateAlt:'pill',   tone:'accent3', tone2:'accent2' },
    pokemon: { align:'center', alt:'right',  divider:'★ ★ ★ ★ ★',   kick:-6, frame:null,     plate:'pill',   plateAlt:'round',  tone:'support', tone2:'accent2' },
    sports:  { align:'left',   alt:'center', divider:'━━ ● ━━',     kick:4,  frame:'corner', plate:'square', plateAlt:'slant',  tone:'accent',  tone2:'support' },
    strips:  { align:'center', alt:'right',  divider:'──────────',  kick:0,  frame:'single', plate:'soft',   plateAlt:'pill',   tone:'accent2', tone2:'accent3' },
  };
  ICONS.corner = { d: 'M12 46 V12 H46', sw: 9 };
  const toneOf = (th, k) => th[k] || th.accent;
  const inkOfTone = (th, k) => th['on' + k.charAt(0).toUpperCase() + k.slice(1)] || th.onAccent || '#141110';
  const contains = (r, x, y) => x >= (r.left || 0) && x <= (r.left || 0) + (r.width || 0) && y >= (r.top || 0) && y <= (r.top || 0) + (r.height || 0);
  const anchorOf = l => { const p = l.props, fs = p.fontSize || 40; return [p.left || 0, (p.top || 0) + (p.originY === 'center' ? 0 : fs * 0.5)]; };
  function signature(t2, cat, seed, th){
    const s = SIG[cat] || SIG.phones;
    const vary = seed % 3 === 2;
    /* 2026-09-03: alignment shifts are OFF. Every "alignment off" card the owner
       flagged traced to a plate or a line moved to an edge without the rest of
       its group; the category keeps its ornament, plate shape and tones. */
    const align = 'center', shape = vary ? s.plateAlt : s.plate;
    const M = 72, near = (a, b, d) => Math.abs(a - b) <= d;
    const tone = toneOf(th, s.tone), onTone = inkOfTone(th, s.tone);
    const tone2 = toneOf(th, s.tone2), onTone2 = inkOfTone(th, s.tone2);
    const isPlate = l => (l.kind === 'rect' || l.kind === 'rrect') && l.props && (l.props.width || 0) >= 200 && (l.props.height || 0) <= 210 && !l.__cursor;
    t2.layers.forEach(l => {
      if (!l.props) return;
      const p = l.props, isText = typeof l.text === 'string';
      /* where the stack sits */
      if (align !== 'center' && isText && l.role !== 'website' && l.role !== 'badges' && !p.path && !/^Chip|^Who|^Review|^Stars|^Rating|^CTA$|^Phone Number|^Seal Line|^Point /.test(l.name || '')
          && (p.originX || 'left') === 'center' && near(p.left || 0, W / 2, 60)){
        p.originX = align; p.left = align === 'left' ? M : W - M;
        if (l.kind === 'textbox') p.textAlign = align;
      }
      /* a plate's centre depends on its origin: the kicker ribbon is drawn
         with originX 'center', and reading its `left` as a left edge put its
         centre 215px right of where it was — so the kicker text moved to the
         margin and the ribbon stayed put in the middle of the card, the
         "poor alignment of the top box" the owner sent (2026-09-02) */
      if (align !== 'center' && isPlate(l) && !/^Chip|^Rate|^Review/.test(l.name || '') && (p.width || 0) < W * 0.86){
        const pw = p.width || 0, pox = p.originX || 'left';
        const pcx = pox === 'center' ? (p.left || 0) : pox === 'right' ? (p.left || 0) - pw / 2 : (p.left || 0) + pw / 2;
        if (near(pcx, W / 2, 60)){
          const edge = align === 'left' ? M - 28 : W - M + 28 - pw;      // the plate's LEFT edge
          const leftBefore = pcx - pw / 2, before = { left: leftBefore, top: (p.top || 0) - (p.originY === 'center' ? (p.height || 0) / 2 : 0), width: pw, height: p.height || 0 };
          p.left = pox === 'center' ? edge + pw / 2 : pox === 'right' ? edge + pw : edge;
          /* the plate moves WITH the words on it: a CTA card slid right and
             left its text hanging off the left edge */
          const dx = edge - leftBefore;
          t2.layers.forEach(t => { if (t !== l && typeof t.text === 'string' && t.props && (t.props.originX || 'left') !== 'center'){ const [x, y] = anchorOf(t); if (contains(before, x, y)) t.props.left = (t.props.left || 0) + dx; } });
        }
      }
      if (align !== 'center' && l.kind === 'cutout' && (p.originX || 'left') === 'center' && near(p.left || 0, W / 2, 60)){
        p.originX = align === 'left' ? 'right' : 'left'; p.left = align === 'left' ? W - M : M;
      }
      /* the ornament is the category's, not the layout's */
      if (isText && l.role === 'deco' && l.name !== 'Stars' && /[★—─•]/.test(l.text) && !/[A-Za-z0-9]/.test(l.text)) l.text = s.divider;
      /* the kicker tilts where the category is playful */
      if (isText && l.name === 'Kicker' && s.kick) p.angle = s.kick;
      /* the plate shape is the category's */
      if (l.__shape){
        const h0 = p.height || 0; delete p.ry; delete p.skewX;
        if (shape === 'soft') p.rx = 16; else if (shape === 'round') p.rx = Math.min(44, h0 / 2);
        else if (shape === 'pill') p.rx = h0 / 2; else if (shape === 'square') p.rx = 0;
        else if (shape === 'slant'){ p.rx = 6; p.skewX = -12; }
        l.__shape = shape;
      }
    });
    /* the palette, all of it: the money band already carries the accent; the
       phone plate takes the category's tone and the kicker plate the second,
       each with the ink that reads on it. That is how a Blue Market card
       shows Blue Market's red instead of a stray mint. */
    /* THE NUMBER BELONGS TO THE CARD. Owner, 2026-09-03: "the phone numbers
       are looking very out of place for each one — make it cohesive with each
       theme." The plate had been taking the CATEGORY's tone and the category's
       corner radius, so a violet slab landed on a gold card and a mono face on
       a hand-set one. It now wears a colour the card is already showing and the
       corner language of its own theme family, and the digits keep the card's
       voice unless the theme is a technical one. */
    const phone = t2.layers.find(l => l.role === 'phone' && typeof l.text === 'string' && l.props);
    if (phone){
      const [x, y] = anchorOf(phone);
      const plate = t2.layers.find(l => isPlate(l) && !l.__moneyPlate && contains(l.props, x, y));
      const money = t2.layers.find(l => l.__moneyPlate && l.props);
      const same = (a2, b2) => String(a2 || '').toLowerCase() === String(b2 || '').toLowerCase();
      const fill = money && same(money.props.fill, th.accent) ? (th.support || th.accent) : th.accent;
      const onFill = same(fill, th.accent) ? th.onAccent : th.onSupport;
      const FAMSHAPE = { 'iOS Flat':'pill', 'Candy':'pill', 'Pastel':'pill', 'Jewel':'pill', 'Cool Air':'round', 'Sunlit':'round',
                         'Liquid Glass':'round', 'Space':'round', 'Duotone':'square', 'Ink Pop':'square', 'Paper':'square',
                         'Night Neon':'square', 'Chalk':'soft', 'Lined Paper':'soft' };
      if (plate){
        plate.__ctaPlate = true;   // the plate under the number: not a highlighter, never overrun
        plate.props.fill = fill; plate.solid = true; plate.__lock = true; delete plate.props.grad; plate.props.opacity = 1;
        const h0 = plate.props.height || 0, sh = FAMSHAPE[th.family] || 'soft';
        plate.props.rx = sh === 'pill' ? h0 / 2 : sh === 'round' ? Math.min(40, h0 / 2) : sh === 'square' ? 0 : 16;
        delete plate.props.skewX; delete plate.props.ry;
        if (/Night Neon|Space/.test(th.family)){ plate.props.stroke = th.accent; plate.props.strokeWidth = 2; }
        phone.props.fill = onFill; phone.__lock = true; delete phone.props.grad;
      } else {
        phone.props.fill = lumHex(th.c1) > 0.5 ? th.ink : th.accent; phone.__lock = true; delete phone.props.grad;   // a bare number takes a tone that reads on the ground
      }
      if (!/Space|Night Neon|Liquid Glass/.test(th.family) && /Mono|JetBrains/i.test(phone.props.fontFamily || ''))
        phone.props.fontFamily = th.faces.support;
      const cta = t2.layers.find(l => l.role === 'cta' && typeof l.text === 'string' && l.props && plate && contains(plate.props, ...anchorOf(l)));
      if (cta && plate){ cta.props.fill = onFill; cta.__lock = true; delete cta.props.grad; }   // the words on the plate match the number
    }
    const kicker = t2.layers.find(l => l.name === 'Kicker' && typeof l.text === 'string' && l.props);
    if (kicker){
      const [x, y] = anchorOf(kicker);
      const plate = t2.layers.find(l => (l.kind === 'rect' || l.kind === 'rrect') && l.props && !l.__moneyPlate && (l.props.height || 0) <= 140 && (l.props.width || 0) < W * 0.7 && contains(l.props, x, y));
      if (plate){ plate.props.fill = tone2; plate.solid = true; plate.__lock = true; delete plate.props.grad; plate.props.opacity = 1;
        kicker.props.fill = onTone2; kicker.__lock = true; }
    }
  }
  /* the frame device, added LAST so the band-filling and repair passes never
     see it as a panel or a collision */
  function frameFor(t2, cat, seed, th){
    const s = SIG[cat] || SIG.phones; if (!s.frame || seed % 3 === 2) return;
    const tone = toneOf(th, s.tone2);
    const rect = (inset, sw, extra) => ({ kind:'rect', name:'Frame', role:'frame', solid:true,
      props: Object.assign({ left:inset, top:inset, width:W - inset * 2, height:H - inset * 2, fill:'rgba(0,0,0,0)', stroke:tone, strokeWidth:sw, opacity:0.9 }, extra || {}) });
    if (s.frame === 'single') t2.layers.push(rect(24, 4));
    else if (s.frame === 'double'){ t2.layers.push(rect(22, 3)); t2.layers.push(rect(34, 1.5)); }
    else if (s.frame === 'dotted') t2.layers.push(rect(24, 4, { strokeDashArray:[4, 14], strokeLineCap:'round' }));
    else if (s.frame === 'bar') t2.layers.push({ kind:'rect', name:'Frame', role:'frame', solid:true,
      props:{ left:0, top:H - 16, width:W, height:16, fill:tone, opacity:1 } });
    else if (s.frame === 'corner'){
      const size = 96, m = 22;
      [[m, m, 0], [W - m - size, m, 90], [W - m - size, H - m - size, 180], [m, H - m - size, 270]].forEach(([x, y, a]) =>
        t2.layers.push({ kind:'path', icon:'corner', name:'Frame', role:'frame', props:{ left:x, top:y, size, fill:tone, angle:a, opacity:0.9 } }));
    }
  }
  function paint(t2, ghostText){
    keepCutoutsInFrame(t2);
    const sc = new fabric.StaticCanvas(null, { width:W, height:H, renderOnAddRemove:false });
    const bgi = t2.bg.type === 'image' ? freshBgImage(t2.bg.src, t2.bg.blur, null) : null;
    if (bgi){
      /* SINGLE-TONE FILTER. Strip the photograph to luminance, then lay the
         theme's own colour over it. A black or white scrim over a colour photo
         gave muddy mixes and the old palettes' duotone grades gave black-and-
         teal murk; one tone, chosen by the theme, is clean every time and the
         picture still reads through it as texture. */
      /* NOT EVERY GROUND IS TONED. Owner, 2026-09-02: "doesn't have to all
         be colored backgrounds, don't take it so absolute — some non-colour-
         edited with a blur, as long as it's legible". `natural` keeps the
         photograph's own colour, blurs it, and lays a NEUTRAL scrim (black on
         a deep theme, white on a light one) instead of the theme tone. */
      try {
        const keepColour = /^(paper|space|abs):/.test(t2.bg.src || '') || t2.__spaceBg || t2.__cashBg || t2.__absBg || t2.__dg;   // drawn grounds, nebulae and money keep their colour
        bgi.filters = t2.bg.treat === 'raw' ? []
          : (t2.bg.treat === 'natural' || keepColour)
          ? [new fabric.Image.filters.Contrast({ contrast: 0.05 })]
          : [new fabric.Image.filters.Grayscale(), new fabric.Image.filters.Contrast({ contrast: 0.08 })];
        bgi.applyFilters();
      } catch(e){}
      sc.setBackgroundImage(coverImage(bgi, W, H), () => {});
      sc.add(scrimRect(t2.bg.scrim || 0.5, W, H, t2.bg.scrimColor, 'normal'));
    } else if (t2.bg.fallback) sc.add(bgRectFor(t2.bg.fallback, W, H));
    const refs = [];
    t2.layers.forEach(l => {
      let o = null;
      try { o = buildLayer(l, t2.id); } catch(e){}
      if (o && l.__moneyPlate){
        /* Force it on the BUILT object. Whatever in the build path was
           repainting the band at 45% — the layer left here solid, with the
           accent as its fill, and rendered as the accent over peach at 45% —
           this is the one place the final paint cannot be overridden. */
        o.set({ fill: l.props.fill, opacity: 1 });
      }
      if (o){
        // opacity 0 keeps the object in alignPass, so the ground render lines up
        if (ghostText && typeof l.text === 'string') o.set('opacity', 0);
        sc.add(o);
      }
      refs.push(o);
    });
    alignPass(sc, W, H);
    /* TEXT WINS. A layout's decoration was placed to clear the copy it was
       authored with; swap the copy and the two can meet — neonNight's tag
       glyph landed in the middle of "COLLECTIONS WANTED". The rule from the
       owner is that nothing sits on text, so a deco or path that overlaps a
       text layer is dropped rather than moved. It was decoration; the words
       are the ad. */
    const textBoxes = [];
    refs.forEach((o, k) => { if (o && typeof t2.layers[k].text === 'string' && t2.layers[k].role !== 'deco')
      textBoxes.push(o.getBoundingRect(true, true)); });
    refs.forEach((o, k) => {
      const l = t2.layers[k];
      if (!o || l.__keepDeco || !(l.role === 'deco' || l.kind === 'path' || l.kind === 'circle')) return;
      const b = o.getBoundingRect(true, true);
      const hit = textBoxes.some(t => !(b.left + b.width <= t.left || t.left + t.width <= b.left ||
                                         b.top + b.height <= t.top || t.top + t.height <= b.top));
      if (hit){ sc.remove(o); refs[k] = null; }
    });
    /* TEXT CENTRED IN ITS BOX. The owner's rule, and the one the fit pass was
       breaking: nudging a line for the frame moved it off the band it sits on,
       and on diagonalRush's angled bands the copy and the plate came apart by
       inches. So for every centred line, find the single-line plate whose box
       contains its centre and put the line at that plate's centre, at that
       plate's angle. The plate is the truth; the text follows it. */
    const plates = refs.map((o, k) => ({ o, l: t2.layers[k] }))
      .filter(x => x.o && (x.l.kind === 'rect' || x.l.kind === 'rrect') && x.l.props && (x.l.props.width || 0) > 120);
    const centred = new Set();
    /* THE BOX HUGS THE TEXT. This is the editor behaviour the owner asked for:
       a single-line plate is sized to its text plus a FIXED margin, every
       time, and it is not allowed to be wider than that unless the design
       says so. Full-width bands with a four-letter word floating in them were
       the complaint; "excessive margin looks bad" is the rule. Where several
       lines share one plate (the review pill, the phone card) the plate keeps
       its size and every line sits on its centre-line. */
    const PAD_X = 44;
    /* a Textbox's width is the box it wraps in, not the ink: measuring the box
       against a panel the same width shrank a 40px line to 14px */
    const textW = o => (o.type === 'textbox' && o.calcTextWidth ? Math.min(o.width || 0, o.calcTextWidth()) : (o.width || 0)) * (o.scaleX || 1);
    const onPlate = (o, r) => { const c = o.getCenterPoint(); const bb = r.getBoundingRect(true, true);
      return c.x >= bb.left && c.x <= bb.left + bb.width && c.y >= bb.top && c.y <= bb.top + bb.height; };
    const singleLine = (o, k) => o && typeof t2.layers[k].text === 'string' && !String(t2.layers[k].text).includes('\n');
    plates.forEach(({ o: r, l: rl }) => {
      const rh = (r.height || 0) * (r.scaleY || 1);
      const lines = refs.map((o, k) => ({ o, k })).filter(x => singleLine(x.o, x.k) && onPlate(x.o, r));
      if (!lines.length) return;
      const tallest = Math.max(...lines.map(x => x.o.height || x.o.fontSize || 40));
      /* WIDTH APPLIES TO EVERY PLATE. A panel is exempt from being resized
         around its text, not from containing it: the price line ran off both
         sides of a ticket because the ticket was tall enough to be "a panel"
         and every width rule stepped aside. */
      const innerAny = (r.width || 0) * (r.scaleX || 1) - PAD_X * 2;
      lines.forEach(({ o }) => {
        let guard = 0;
        while (textW(o) > innerAny && o.fontSize > 14 && guard++ < 80){ o.set('fontSize', o.fontSize - 2); o.setCoords(); }
      });
      if (rh > tallest * 2.2) return;                       // a panel, not a band
      const rc = r.getCenterPoint();
      if (lines.length === 1 && !rl.__panel){
        const o = lines[0].o;
        const tw = textW(o);
        // the plate follows the text: its width, plus the margin, centred on it
        o.set({ originY: 'center', angle: r.angle || 0 });
        const tc = o.getCenterPoint();
        const padX = (rl && rl.__padX) ? Math.max(PAD_X, Math.round(tw * 0.18)) : PAD_X;
        r.set({ width: tw + padX * 2, scaleX: 1 });
        if (rl && rl.__shape === 'oval'){ r.set({ rx: (tw + padX * 2) / 2, ry: (r.height || 0) / 2 }); }
        r.setPositionByOrigin({ x: tc.x, y: rc.y }, 'center', 'center'); r.setCoords();
        o.setPositionByOrigin({ x: tc.x, y: rc.y }, 'center', 'center'); o.setCoords();
        centred.add(lines[0].k);
      } else {
        const inner = (r.width || 0) * (r.scaleX || 1) - PAD_X * 2;
        lines.forEach(({ o, k }) => {                       // shared: centre-line, x untouched
          o.set({ originY: 'center', angle: r.angle || 0 });
          /* a line wider than the plate's inner width shrinks to it — the
             price line ran off both sides of the ticket while the plate,
             holding four lines, could not follow any one of them */
          let guard = 0;
          while (textW(o) > inner && o.fontSize > 14 && guard++ < 80){ o.set('fontSize', o.fontSize - 2); o.setCoords(); }
          const oc = o.getCenterPoint();
          o.setPositionByOrigin({ x: oc.x, y: rc.y }, 'center', 'center'); o.setCoords();
          /* and INSIDE the plate: the rating line on the review pill was
             shrunk to the plate's width but never slid back, so it ran off
             the right edge — "it seems to not be moving" */
          { const pb = r.getBoundingRect(true, true), ob2 = o.getBoundingRect(true, true), padIn = 22;
            let dx = 0;
            if (ob2.left + ob2.width > pb.left + pb.width - padIn) dx = (pb.left + pb.width - padIn) - (ob2.left + ob2.width);
            if (ob2.left + dx < pb.left + padIn) dx = (pb.left + padIn) - ob2.left;
            if (dx){ o.set('left', (o.left || 0) + dx); o.setCoords(); } }
          centred.add(k);
        });
      }
    });
    /* MULTI-LINE TEXT STAYS IN ITS PANEL. The single-line rule above centres
       a line on a band; a list that starts inside a quote card and runs out
       of the bottom of it is the other failure, and it is the one the owner
       pointed at. Find the panel the text starts in; if the text's box leaves
       it, shrink the type until it fits, and failing that, lift it. */
    refs.forEach((o, k) => {
      const l = t2.layers[k];
      if (!o || typeof l.text !== 'string' || !String(l.text).includes('\n')) return;
      const tb = o.getBoundingRect(true, true);
      const anchor = { x: tb.left + Math.min(20, tb.width/2), y: tb.top + 6 };
      let panel = null;
      plates.forEach(({ o: r }) => {
        const b = r.getBoundingRect(true, true);
        if (anchor.x < b.left || anchor.x > b.left + b.width || anchor.y < b.top || anchor.y > b.top + b.height) return;
        if (b.height < tb.height * 0.6) return;
        if (!panel || b.width * b.height < panel.area) panel = { b, area: b.width * b.height };
      });
      if (!panel) return;
      const pb = panel.b, pad = 14;
      const fits = () => { const b = o.getBoundingRect(true, true);
        return b.top + b.height <= pb.top + pb.height - pad && b.left + b.width <= pb.left + pb.width - pad; };
      if (fits()) return;
      /* Shrink a little, never past readability. If it still does not fit,
         the list does not belong in that card: put it just below the panel at
         its original size. Type at 12px is not a fix, it is a hiding place. */
      const floor = (l.props.fontSize || 40) * 0.82;
      let guard = 0;
      while (!fits() && o.fontSize > floor && guard++ < 20){ o.set('fontSize', o.fontSize - 1); o.setCoords(); }
      if (!fits()){
        /* Lift it inside the panel first — the quote card had empty room at
           its foot, and moving the list below it dropped it onto the chip row
           and buried a chip. Only when the panel is genuinely too short does
           the block go below. */
        const b = o.getBoundingRect(true, true);
        const lifted = pb.top + pb.height - pad - b.height;
        if (lifted >= pb.top + pad){ o.set('top', (o.top || 0) + (lifted - b.top)); o.setCoords(); }
        else {
          o.set({ fontSize: l.props.fontSize || o.fontSize, top: pb.top + pb.height + 18 }); o.setCoords();
          if (o.originX !== 'center'){ o.set('left', pb.left + pad); o.setCoords(); }
        }
      }
    });
    /* ICON ROWS. A disc and the line beside it are one row, and a row reads
       as a row only when the text's vertical centre is the disc's. The discs
       were sitting a touch high on every checklist — small, and exactly the
       kind of small the eye will not forgive. For each circle, find the text
       that starts just to its right and overlaps it vertically, and lock the
       text's centre to the disc's. */
    const discs = refs.map((o, k) => ({ o, l: t2.layers[k], k })).filter(x => x.o && x.l.kind === 'circle');
    const rowDisc = new Map();                       // text index -> disc object, so rows move as units
    refs.forEach((o, k) => {
      const l = t2.layers[k];
      if (!o || typeof l.text !== 'string' || o.originX === 'center') return;
      const tb = o.getBoundingRect(true, true);
      const d = discs.find(({ o: c }) => {
        const cb = c.getBoundingRect(true, true);
        const gap = tb.left - (cb.left + cb.width);
        return gap > -4 && gap < 60 && tb.top < cb.top + cb.height + 24 && tb.top + tb.height > cb.top - 24;
      });
      if (!d) return;
      const cb = d.o.getBoundingRect(true, true), cc = d.o.getCenterPoint();
      if (String(l.text).includes('\n')){
        /* a wrapped row hangs from the disc: first line level with the disc,
           the rest below it. Centring a two-line block on the disc pushed its
           first line up into the row above — "good attempt, poor execution". */
        o.set({ originY: 'top', top: cb.top - 2 }); o.setCoords();
      } else {
        o.set({ originY: 'center', top: cc.y }); o.setCoords();
      }
      rowDisc.set(k, d.o);
      centred.add(k);
    });
    /* HEADLINES ARE NOT ALLOWED TO GET WIDE. The frame clamp only stops a
       title leaving the canvas; the owner's rule is tighter — a title that
       reaches the edges looks bad before it clips. Headlines fit 82% of the
       width, whatever the copy. */
    refs.forEach((o, k) => {
      const l = t2.layers[k];
      if (!o || l.role !== 'headline') return;
      let guard = 0;
      if (o.fontSize) while (o.getBoundingRect(true, true).width > W * 0.82 && o.fontSize > 24 && guard++ < 80){ o.set('fontSize', o.fontSize - 2); o.setCoords(); }
      /* a headline beside a column of other text (lowerThird's number and
         CTA on the right) stops short of that column */
      { const ob = o.getBoundingRect(true, true);
        /* the badge stack top-right counts as a column: a wide wave pushed it
           down the card instead of stopping short of it */
        const rightCol = refs.map((r, q) => r && q !== k && typeof t2.layers[q].text === 'string' && t2.layers[q].role !== 'headline' && t2.layers[q].role !== 'deco' ? r.getBoundingRect(true, true) : null)
          .filter(b => b && b.left > ob.left + 60 && b.top < ob.top + ob.height && b.top + b.height > ob.top);
        if (rightCol.length){
          const limit = Math.min(...rightCol.map(b => b.left)) - 28 - ob.left;
          let g2 = 0;
          if (o.fontSize) while (o.getBoundingRect(true, true).width > limit && o.fontSize > 40 && g2++ < 60){ o.set('fontSize', o.fontSize - 2); o.setCoords(); }
          const bw2 = o.getBoundingRect(true, true).width;
          if (bw2 > limit && limit > 200){ const k2 = limit / bw2, c0 = o.getCenterPoint();
            o.set({ scaleX: (o.scaleX || 1) * k2, scaleY: (o.scaleY || 1) * k2 }); o.setPositionByOrigin({ x: c0.x - (bw2 - limit) / 2, y: c0.y }, 'center', 'center'); o.setCoords(); }
        }
      }
      /* a skewed or pathed line does not narrow with its fontSize: scale it */
      const bw = o.getBoundingRect(true, true).width;
      if (bw > W * 0.82){ const k = W * 0.82 / bw, c0 = o.getCenterPoint();
        o.set({ scaleX: (o.scaleX || 1) * k, scaleY: (o.scaleY || 1) * k }); o.setPositionByOrigin(c0, 'center', 'center'); o.setCoords(); }
    });
    /* KEEP IT IN THE FRAME. Anything that ends up outside the canvas is a
       broken ad, whatever caused it — a longer headline, an alignPass nudge, a
       rotated plate. Shrink to fit first (type before position), then pull the
       whole object back inside. */
    const M = 22;
    refs.forEach((o, k) => {
      if (!o) return;
      if (centred.has(k)) return;              // it belongs to its plate now
      let b = o.getBoundingRect(true, true);
      if (o.fontSize){
        let guard = 0;
        while ((b.width > W - M*2) && o.fontSize > 12 && guard++ < 80){
          o.set('fontSize', Math.max(12, o.fontSize - 2));
          o.setCoords(); b = o.getBoundingRect(true, true);
        }
      }
      /* An asset larger than the frame cannot be pulled inside; it has to be
         scaled first. lowerThird's product bled off the top by design, and
         the owner's read is the right one: it looks cropped and too big.
         Fit it to the frame with a margin, then position it. */
      if (!o.fontSize && (b.width > W - M*2 || b.height > H - M*2)){
        const k = Math.min((W - M*2) / b.width, (H - M*2) / b.height);
        o.set({ scaleX: (o.scaleX || 1) * k, scaleY: (o.scaleY || 1) * k }); o.setCoords();
        b = o.getBoundingRect(true, true);
      }
      let dx = 0, dy = 0;
      if (b.left < M) dx = M - b.left;
      if (b.left + b.width > W - M) dx = Math.min(dx, (W - M) - (b.left + b.width));
      if (b.top < M) dy = M - b.top;
      if (b.top + b.height > H - M) dy = Math.min(dy, (H - M) - (b.top + b.height));
      if (dx || dy){ o.set({ left: (o.left || 0) + dx, top: (o.top || 0) + dy }); o.setCoords(); }

    });
    /* NO TEXT ON TEXT. After every other pass, any two text lines that still
       overlap get separated: the one that is not a headline moves down until
       it clears, and if there is no room below it moves up instead. The
       number crashing into "SELL YOUR" was the plate-agreement pass moving the
       number's plate and the number with it; whatever the cause, this is the
       backstop the owner has asked for three times. */
    const texts = refs.map((o, k) => ({ o, l: t2.layers[k] })).filter(x => x.o && typeof x.l.text === 'string' && x.l.role !== 'deco');
    const rank = x => x.l.role === 'headline' ? 3 : x.l.role === 'phone' ? 2 : 1;
    for (let pass = 0; pass < 3; pass++){
      for (let a = 0; a < texts.length; a++) for (let b2 = a + 1; b2 < texts.length; b2++){
        const A = texts[a], B = texts[b2];
        const ab = A.o.getBoundingRect(true, true), bb = B.o.getBoundingRect(true, true);
        const overlap = !(ab.left + ab.width <= bb.left || bb.left + bb.width <= ab.left ||
                          ab.top + ab.height <= bb.top || bb.top + bb.height <= ab.top);
        if (!overlap) continue;
        let mover, fixed;
        if (rank(A) !== rank(B)){ mover = rank(A) > rank(B) ? B : A; fixed = mover === B ? A : B; }
        else { // equal rank: the LOWER row moves down, so a stack stays a stack
          const at = A.o.getBoundingRect(true,true).top, bt = B.o.getBoundingRect(true,true).top;
          mover = at > bt ? A : B; fixed = mover === A ? B : A; }
        // a pinned line (the challenge tail under line two) never moves
        /* a pinned tail under a headline it still touches moves DOWN (the
           headline never moves); against anything else the other line moves */
        if (mover.l.__pinned && !(fixed.l.role === 'headline' && !fixed.l.__pinned)){ if (fixed.l.__pinned) continue; const t = mover; mover = fixed; fixed = t; }
        const fb = fixed.o.getBoundingRect(true, true), mb = mover.o.getBoundingRect(true, true);
        let dy = (fb.top + fb.height + 12) - mb.top;                 // move down to clear
        if (mb.top + mb.height + dy > H - 22) dy = (fb.top - 12) - (mb.top + mb.height); // or up
        if (mb.top + dy < 22 || mover.l.__pinned && mover.l.role !== 'headline' && false){ dy = 0; }
        if (mb.top + dy < 22){
          /* nowhere to go: the fixed line (usually the headline) gives up size
             until the two clear — MAIL-IN OFFERS ran into the phone column */
          let g = 0;
          const clear = () => { const a2 = fixed.o.getBoundingRect(true, true), b3 = mover.o.getBoundingRect(true, true);
            return a2.left + a2.width <= b3.left || b3.left + b3.width <= a2.left || a2.top + a2.height <= b3.top || b3.top + b3.height <= a2.top; };
          while (!clear() && fixed.o.fontSize && fixed.o.fontSize > 24 && g++ < 40){ fixed.o.set('fontSize', fixed.o.fontSize - 2); fixed.o.setCoords(); }
          continue;
        }
        mover.o.set('top', (mover.o.top || 0) + dy); mover.o.setCoords();
        const disc = rowDisc.get(refs.indexOf(mover.o));
        if (disc){ disc.set('top', (disc.top || 0) + dy); disc.setCoords(); }
        // and the glyph riding inside that disc
        if (disc){ const dc = disc.getCenterPoint();
          refs.forEach((g, gi) => { if (g && t2.layers[gi].role === 'deco' && typeof t2.layers[gi].text === 'string'){
            const gc = g.getCenterPoint(); if (Math.hypot(gc.x - dc.x, gc.y - (dc.y - dy)) < 14){ g.set('top', (g.top||0) + dy); g.setCoords(); } } }); }
      }
    }
    /* the pin sits at the reviewer line's left edge, whatever alignment the
       line ended up with */
    { const wk = t2.layers.findIndex(l => l.name === 'Who'), pk = t2.layers.findIndex(l => l.name === 'Pin');
      if (wk >= 0 && pk >= 0 && refs[wk] && refs[pk]){
        const wb = refs[wk].getBoundingRect(true, true), pb = refs[pk].getBoundingRect(true, true);
        refs[pk].set({ left: (refs[pk].left || 0) + (wb.left - pb.width - 10 - pb.left), top: (refs[pk].top || 0) + (wb.top + wb.height / 2 - pb.height / 2 - pb.top) }); refs[pk].setCoords();
      } }
    /* DECORATION YIELDS TO WORDS. A divider (═══ ◆ ═══, ━━━━, ★ ★ ★) that
       ends up on a line of copy is taken off the canvas; the copy stays. */
    { const words = refs.map((o, k) => o && typeof t2.layers[k].text === 'string' && t2.layers[k].role !== 'deco' ? Object.assign(o.getBoundingRect(true, true), { __head: t2.layers[k].role === 'headline' }) : null).filter(Boolean);
      refs.forEach((o, k) => {
        const l = t2.layers[k];
        if (!o || l.__keepDeco || l.role !== 'deco' || typeof l.text !== 'string' || l.text.trim().length < 3) return;   // a mark placed on purpose inside its own plate stays
        const b = o.getBoundingRect(true, true);
        const hit = words.some(w => !(b.left + b.width <= w.left || w.left + w.width <= b.left || b.top + b.height <= w.top || w.top + w.height <= b.top));
        if (hit){ sc.remove(o); refs[k] = null; }
      }); }
    /* LAST WORD ON HEADLINES. After the resolver has moved what it could, a
       headline still touching another line gives up size until it clears —
       MAIL-IN OFFERS ran under the CTA the resolver had just parked there. */
    refs.forEach((o, k) => {
      const l = t2.layers[k];
      if (!o || l.role !== 'headline' || !o.fontSize) return;
      const others = refs.map((r, q) => r && q !== k && typeof t2.layers[q].text === 'string' && t2.layers[q].role !== 'deco' && t2.layers[q].role !== 'headline' ? r : null).filter(Boolean);
      const hits = () => { const a2 = o.getBoundingRect(true, true); return others.some(r => { const b3 = r.getBoundingRect(true, true);
        return !(a2.left + a2.width <= b3.left || b3.left + b3.width <= a2.left || a2.top + a2.height <= b3.top || b3.top + b3.height <= a2.top); }); };
      let g = 0;
      while (hits() && o.fontSize > 40 && g++ < 40){ o.set('fontSize', o.fontSize - 2); o.setCoords(); }
    });
    /* GLYPH ON DISC, decided last. A tick inside a disc takes near-black or
       near-white against the DISC'S FINAL fill — not the theme's accent ink,
       not whatever the colour table mapped it to. On Blue Market both the disc
       and the tick came out white, and the owner saw a column of empty
       circles. Done here, after every other pass, so nothing can undo it. */
    const lumOfFill = f => {
      if (typeof f !== 'string') return null;
      const q = f.match(/^#([0-9a-f]{6})$/i) ? f : (f.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
        ? '#' + [1,2,3].map(i => (+f.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)[i]).toString(16).padStart(2,'0')).join('') : null);
      return q ? lumHex(q) : null;
    };
    refs.forEach((o, k) => {
      const l = t2.layers[k];
      if (!o || l.kind !== 'circle') return;
      const dc = o.getCenterPoint(), L = lumOfFill(o.fill);
      if (L === null) return;
      refs.forEach((g, gi) => {
        if (!g || typeof t2.layers[gi].text !== 'string') return;
        const gc = g.getCenterPoint();
        if (Math.hypot(gc.x - dc.x, gc.y - dc.y) > 16) return;
        g.set({ fill: (1.05/(L+0.05)) > ((L+0.05)/0.05) ? '#ffffff' : '#101014', opacity: 1 });
        if (g.shadow) g.set('shadow', null);
      });
    });
    /* PRODUCT YIELDS TO WORDS. Owner, 2026-09-02, a coin on edge centred
       over a trustSeal's tiles and phone number: the in-frame clamp had
       re-homed it to the middle of the card with no regard for the copy.
       Decided here, after every pass that can move a product or a line: a
       cutout still covering a tenth of any real text box comes off the
       canvas. A card with no product beats a card nobody can read. */
    if (!ghostText){
      /* the badge stack (LICENSED / BONDED / LOCAL) is a seal column, not copy:
         a product may sit beside or under it — that corner is the one spot a
         wide-headline layout has, and dropping the product for it left cards
         with no imagery at all (owner, 2026-09-03) */
      const words = refs.map((o, k) => o && typeof t2.layers[k].text === 'string' && t2.layers[k].role !== 'deco' && t2.layers[k].role !== 'badges' ? Object.assign(o.getBoundingRect(true, true), { __head: t2.layers[k].role === 'headline' }) : null).filter(Boolean);
      refs.forEach((o, k) => {
        const l = t2.layers[k];
        if (!o || l.kind !== 'cutout' || l.__wall) return;   // the wall sits BEHIND the words by design
        const b = o.getBoundingRect(true, true);
        const wordsFor = l.__crown ? refs.map((o2, k2) => o2 && typeof t2.layers[k2].text === 'string' && t2.layers[k2].role !== 'deco' && t2.layers[k2].role !== 'badges' && !/Arc|Wave|Curve/i.test(t2.layers[k2].name || '') ? Object.assign(o2.getBoundingRect(true, true), { __head: t2.layers[k2].role === 'headline' }) : null).filter(Boolean) : words;
        /* three ways a product is "on the words": across a line, sitting on a
           word, or touching a HEADLINE at all — a graze against the headline
           still reads as a mistake, so that one wants real clearance. */
        const over = t => {
          const pad = t.__head ? 10 : 0;
          const ix = Math.max(0, Math.min(b.left + b.width, t.left + t.width + pad) - Math.max(b.left, t.left - pad));
          const iy = Math.max(0, Math.min(b.top + b.height, t.top + t.height + pad) - Math.max(b.top, t.top - pad));
          const ov = ix * iy;
          if (t.__head && ov > 0) return true;
          return ov > t.width * t.height * 0.10 || ov > b.width * b.height * 0.25;
        };
        const hit = wordsFor.some(over);
        if (hit){
          /* RESOLVE, DO NOT DELETE. Deleting the product is what left cards with
             nothing to show — "people don't know what you're buying". Shrink it
             toward the nearest clear space first; only if it still cannot clear
             the words does it come off, and then it is demoted to the ground by
             the goods pass rather than lost. */
          let saved = false;
          /* MOVE FIRST, at full size: shrinking a product that only needed to
             step aside is why the goods ended up too small to read. */
          { const bw = b.width, bh = b.height;
            outerMove: for (let y = 26; y <= H - bh - 26; y += 24)
              for (let x = 26; x <= W - bw - 26; x += 24){
                const clash = wordsFor.some(t => {
                  const pad = t.__head ? 10 : 0;
                  const ix = Math.max(0, Math.min(x + bw, t.left + t.width + pad) - Math.max(x, t.left - pad));
                  const iy = Math.max(0, Math.min(y + bh, t.top + t.height + pad) - Math.max(y, t.top - pad));
                  const ov = ix * iy;
                  if (t.__head && ov > 0) return true;
                  return ov > t.width * t.height * 0.10 || ov > bw * bh * 0.25;
                });
                if (!clash){ o.set({ left: (o.left || 0) + (x - b.left), top: (o.top || 0) + (y - b.top) }); o.setCoords(); saved = true; break outerMove; }
              }
          }
          for (const shrink of saved ? [] : [0.78, 0.6, 0.46]){
            const sx = (o.scaleX || 1), sy = (o.scaleY || 1);
            o.set({ scaleX: sx * shrink, scaleY: sy * shrink }); o.setCoords();
            const nb = o.getBoundingRect(true, true);
            const still = wordsFor.some(t => { const pad = t.__head ? 10 : 0; const ix = Math.max(0, Math.min(nb.left + nb.width, t.left + t.width + pad) - Math.max(nb.left, t.left - pad)), iy = Math.max(0, Math.min(nb.top + nb.height, t.top + t.height + pad) - Math.max(nb.top, t.top - pad)); const ov = ix * iy; if (t.__head && ov > 0) return true; return ov > t.width * t.height * 0.10 || ov > nb.width * nb.height * 0.25; });
            if (!still && nb.left > 10 && nb.top > 10 && nb.left + nb.width < W - 10 && nb.top + nb.height < H - 10){ saved = true; break; }
            o.set({ scaleX: sx, scaleY: sy }); o.setCoords();
          }
          if (!saved){ sc.remove(o); refs[k] = null; l.__yielded = true; t2.__lostGoods = l.props && l.props.src; }
        }
      });
    }
    /* backstop: any cutout still outside the frame is scaled and pulled in */
    refs.forEach((o, k) => {
      const l = t2.layers[k];
      if (!o || l.kind !== 'cutout') return;
      let b = o.getBoundingRect(true, true);
      const kx = (W - 48) / b.width, ky = (H - 48) / b.height, kk = Math.min(1, kx, ky);
      if (kk < 1){ o.set({ scaleX: (o.scaleX || 1) * kk, scaleY: (o.scaleY || 1) * kk }); o.setCoords(); b = o.getBoundingRect(true, true); }
      let dx = 0, dy = 0;
      if (b.left < 24) dx = 24 - b.left; else if (b.left + b.width > W - 24) dx = (W - 24) - (b.left + b.width);
      if (b.top < 24) dy = 24 - b.top;   else if (b.top + b.height > H - 24) dy = (H - 24) - (b.top + b.height);
      if (dx || dy){ o.set({ left: (o.left || 0) + dx, top: (o.top || 0) + dy }); o.setCoords(); }
    });
    sc.renderAll();
    return { sc, refs };
  }

  /* THE REVIEW FAMILY. "Can you make me 5 variations of the review theme?
     It's cool and looks nice." Same bones — rating, quote, reviewer, BUYER
     word, chips, CTA bar — five arrangements: a numeral hero, twin quotes, a
     three-line review strip, a speech bubble, and a badge with the product
     beside the quote. In a normal set one review card in six takes a
     variation; the review page cycles through all five. */
  const QUOTES = {
    /* reviews that sound like the industry — the things a seller in that
       category actually worries about, in their words */
    phones:  ['Texted photos at noon, had cash by 3pm.', 'Cracked back, still paid what they quoted.', 'Met me at work. Five minutes, done.',
              'iCloud was still on, they walked me through it and paid.', 'Carrier said $180. These guys paid $610.', 'Three old iPhones from the drawer, paid for all three.',
              'No "final offer" games. Number stood.', 'Sold my 15 Pro Max the day the 17 came out. Fair.'],
    gold:    ['Weighed it in front of me, no games.', 'Paid more than the mall jeweler offered.', 'Handled my mom\'s estate with respect.',
              'Tested every piece, told me which were plated.', 'Cuban link paid by weight at a real spot rate.', 'Dental gold too. Did not expect that.',
              'Broken chains and single earrings, all counted.', 'Quote in writing before I decided. Took it.'],
    silver:  ['Knew the maker\'s marks on sight.', 'Silverware set paid by weight, fair.', 'Honest about what was plated.',
              'Grandmother\'s tea set, treated like it mattered.', 'Sterling flatware sorted from the plated in minutes.', 'Paid for the weighted candlesticks correctly.',
              'Bars and rounds at spot, no haggling.', 'Tiffany pieces priced above melt, as they should be.'],
    coins:   ['Knew more about my collection than I did.', 'Key dates priced right, not junk rate.', 'Slabbed and raw, all looked at properly.',
              'Morgans checked date by date. Found two I missed.', 'Junk silver by the face value, paid on the spot.', 'Dad\'s albums went to someone who cared.',
              'Gold eagles at a real premium, not melt.', 'Centenarios priced like Centenarios.'],
    cars:    ['Picked up my Civic the same day, cash in hand.', 'Beat the dealer trade-in by a lot.', 'Title and DMV handled for me.',
              'Running rough, still paid. Tow was free.', 'Lien on the truck, they sorted the payoff.', 'Carvana wanted it shipped and inspected. These guys came over.',
              'Offer in ten minutes, check cleared same day.', 'High miles, no drama, fair number.'],
    strips:  ['Simple and discreet. Boxes gone, paid fairly.', 'Quoted by the box, paid by the box.', 'No mail-in wait. Same day.',
              'Sealed FreeStyle boxes, top rate.', 'Short-dated boxes still got a fair number.', 'Met at a pharmacy lot, quick and private.',
              'Dexcom sensors too. Did not know that was a thing.', 'Text a photo of the boxes, got a number back in minutes.'],
    pokemon: ['Got real value for my binder, not pawn prices.', 'They knew what the alt arts were worth.', 'Sold my ETBs and slabs in one visit.',
              'Moonbreon priced off real comps, not a lowball.', 'Sealed booster boxes paid better than the shop.', 'PSA 10s and raw, sorted fairly.',
              'Childhood binder, Charizard included. Fair.', 'No "we only buy bulk" nonsense.'],
    sports:  ['My rookie cards found a fair, serious buyer.', 'Graded slabs priced against real comps.', 'Wax boxes paid on the spot.',
              'Autos and patches valued properly.', 'Vintage Topps, not treated as junk.', 'Beat the card shop consignment math.',
              'Whole collection, one number, one day.', 'Knew the difference between a base and a refractor.'],
  };

  const NAMES2 = ['Marcus T.','Priya R.','Danny O.','Alyssa M.','Jordan K.','Rosa V.','Kevin L.','Tasha B.','Miguel S.','Erin W.','Andre C.','Lena P.','Omar H.','Grace N.'];
  const CITIES2 = ['Long Beach, CA','Lakewood, CA','Downey, CA','Carson, CA','Torrance, CA','Cerritos, CA','Bellflower, CA','Signal Hill, CA'];
  function reviewVariant(t2, v, cat, seed, th){
    if (!v) return;
    const L = name => t2.layers.find(l => l.name === name);
    const idx = name => t2.layers.findIndex(l => l.name === name);
    const pill = L('Rate Pill'), sheen = L('Rate Pill Sheen'), stars = L('Stars'), rating = L('Rating Line');
    const card = L('Quote Card'), csheen = L('Quote Card Sheen'), quote = L('Quote'), who = L('Who');
    if (!pill || !stars || !rating || !card || !quote) return;
    const qs = QUOTES[cat] || QUOTES.phones;
    const fillOf = l => l.props.fill, inkOf = l => l.props.fill;
    const drop = name => { const k = idx(name); if (k >= 0) t2.layers.splice(k, 1); };
    const nameCity = k => NAMES2[(seed + k * 3) % NAMES2.length] + '  ·  ' + CITIES2[(seed + k * 5) % CITIES2.length];
    if (v === 1){
      /* numeral hero: the score is the headline of the pill */
      drop('Rate Pill Sheen'); drop('Rate Pill');
      stars.text = '4.9'; stars.role = 'info'; stars.props.fontSize = 112; stars.props.fontFamily = th.faces.num; stars.props.fontWeight = '800';
      stars.props.left = 96; stars.props.top = 52; stars.props.originX = 'left'; stars.props.originY = 'top'; stars.props.charSpacing = -20;
      rating.text = '★★★★★'; rating.props.fontSize = 34; rating.props.left = 300; rating.props.top = 70; rating.props.originX = 'left'; rating.props.charSpacing = 80;
      t2.layers.splice(idx('Rating Line') + 1, 0, { kind:'text', name:'Rating Count', role:'info', text:'200+ LOCAL SELLERS · FIVE-STAR AVERAGE',
        props:{ left: 300, top: 118, fontFamily: th.faces.support, fontSize: 24, fill: rating.props.fill, fontWeight:'700', charSpacing: 60 } });
    } else if (v === 2){
      /* twin quotes: one wide card carrying two short testimonials, each
         signed on its right — a second plate only got hugged by the passes */
      quote.text = '"' + qs[0] + '"'; quote.props.fontSize = 32; quote.props.width = 860; quote.props.left = W / 2; quote.props.originX = 'center';
      quote.props.top = (card.props.top || 228) + 34; quote.props.textAlign = 'left';
      const y2 = (card.props.top || 228) + 176;
      const q2 = JSON.parse(JSON.stringify(quote)); q2.name = 'Quote 2'; q2.text = '"' + qs[1] + '"'; q2.props.top = y2;
      t2.layers.splice(idx('Quote') + 1, 0, q2);
      if (who){ who.props.originX = 'right'; who.props.left = 970; who.props.top = (card.props.top || 228) + 126; who.props.fontSize = 22; who.text = nameCity(1); delete who.__reviewer;
        const w2 = JSON.parse(JSON.stringify(who)); w2.name = 'Who 2'; w2.props.top = y2 + 92; w2.text = nameCity(2);
        t2.layers.splice(idx('Who') + 1, 0, w2); }
      t2.layers.splice(idx('Quote'), 0, { kind:'rect', name:'Quote Rule', solid:true, __lock:true, props:{ left: 110, top: y2 - 18, width: 860, height: 2, fill: quote.props.fill, opacity: 0.35 } });
    } else if (v === 3){
      /* review strip: three one-line quotes with names, no big card */
      const fill = card.props.fill, ink = quote.props.fill, at = idx('Quote Card');
      drop('Quote Card Sheen'); drop('Quote'); drop('Who'); drop('Quote Card');
      t2.layers.forEach(l => { if (l.__reviewer) delete l.__reviewer; });
      const rows = [];
      for (let r = 0; r < 3; r++){
        const y = 236 + r * 108;
        rows.push({ kind:'rect', name:'Review Row ' + (r + 1), solid:false, props:{ left:70, top:y, width:942, height:86, fill, rx:43, stroke: card.props.stroke, strokeWidth: card.props.strokeWidth } });
        rows.push({ kind:'text', name:'Review Text ' + (r + 1), role:'info', text:'"' + qs[r % qs.length] + '"',
                    props:{ left:104, top:y + 43, originY:'center', fontFamily: th.faces.support, fontSize:28, fill: ink, fontWeight:'600' } });
        rows.push({ kind:'text', name:'Review Name ' + (r + 1), role:'info', text: NAMES2[(seed + r * 3) % NAMES2.length],
                    props:{ left:980, top:y + 43, originX:'right', originY:'center', fontFamily: th.faces.support, fontSize:22, fill: ink, fontWeight:'800', charSpacing:40 } });
      }
      t2.layers.splice(at, 0, ...rows);
    } else if (v === 4){
      /* speech bubble: the card grows a tail toward the reviewer */
      /* the testimonial mark: a large opening quote in the accent, riding
         the card's top-left corner; the quote itself loses its own marks */
      card.props.rx = 34;
      quote.text = String(quote.text).replace(/^"|"$/g, '');
      /* the mark owns the card's left gutter; the quote starts to its right */
      quote.props.left = (card.props.left || 70) + 130; quote.props.width = (card.props.width || 942) - 170; quote.props.originX = 'left'; quote.props.textAlign = 'left';
      quote.props.fontSize = Math.min(quote.props.fontSize || 46, 40);
      t2.layers.splice(idx('Quote Card') + 1, 0, { kind:'text', name:'Quote Mark', role:'deco', text:'\u201C',
        props:{ left: (card.props.left || 70) + 18, top: (card.props.top || 228) - 30, fontFamily: 'Instrument Serif', fontSize: 200, fill: th.accent, fontWeight:'400' } });
    } else if (v === 5){
      /* badge and product: a small score badge top-left, the quote card
         narrowed to the left, the product beside it (placement search) */
      pill.props.left = 70; pill.props.top = 60; pill.props.width = 430; pill.props.height = 72; pill.__panel = true;
      if (sheen){ sheen.props.left = 90; sheen.props.top = 66; sheen.props.width = 390; }
      stars.props.left = 96; stars.props.top = 80; stars.props.fontSize = 30; stars.props.originX = 'left'; stars.props.originY = 'top';
      rating.props.left = 262; rating.props.top = 84; rating.props.fontSize = 24; rating.text = '4.9 · 200+ sellers';
      card.props.width = 560; quote.props.width = 500; quote.props.left = 96; quote.props.fontSize = 38; quote.text = '"' + qs[seed % qs.length] + '"';
      if (csheen) csheen.props.width = 500;
      if (who){ who.props.left = 70 + 280; who.props.fontSize = 22; }
    }
  }

  /* ONE HUNDRED REVIEW FORMATS. The two winners of the five-variation page —
     the quote mark (4/5) and the review strip (3/5) — carry the quote block
     on more than half the cards; four more quote treatments take the rest.
     Around the quote block, five independent choices — rating block, who
     line, headline position, chip row, CTA — are decoded from the card's
     index in mixed radix, so no two of the hundred share a combination. */
  const RFMT = {
    rating: ['pill','free','badge','inline'],
    quote:  ['mark','strip3','strip2','markRight','ghost','centered'],
    who:    ['pin','right','dash'],
    head:   ['mid','top','low'],
    chips:  ['chips','inline','lines'],
    cta:    ['bar','pillOnly'],
  };
  function reviewSpec(k){
    const r = RFMT.rating[k % 4], w = RFMT.who[Math.floor(k / 4) % 3], h = RFMT.head[Math.floor(k / 12) % 3],
          c = RFMT.chips[Math.floor(k / 36) % 3], t = RFMT.cta[Math.floor(k / 108) % 2 ^ (Math.floor(k / 2) % 2)];
    const q = k < 30 ? 'mark' : k < 56 ? 'strip3' : RFMT.quote[2 + (k % 4)];
    return { rating: r, quote: q, who: w, head: h, chips: c, cta: t };
  }
  function reviewFormat(t2, spec, cat, seed, th){
    const L = name => t2.layers.find(l => l.name === name);
    const idx = name => t2.layers.findIndex(l => l.name === name);
    const drop = name => { const k = idx(name); if (k >= 0) t2.layers.splice(k, 1); };
    const pill = L('Rate Pill'), stars = L('Stars'), rating = L('Rating Line');
    const card = L('Quote Card'), quote = L('Quote'), who = L('Who'), head = L('Headline 2');
    if (!pill || !stars || !rating || !card || !quote || !head) return;
    const qs = QUOTES[cat] || QUOTES.phones;
    const ink = quote.props.fill, plate = card.props.fill, stroke = card.props.stroke, sw = card.props.strokeWidth;
    const nm = k => NAMES2[(seed + k * 3) % NAMES2.length], city = k => CITIES2[(seed + k * 5) % CITIES2.length];
    const T = (name, text, props, role) => ({ kind:'text', name, role: role || 'info', text, props: Object.assign({ fontFamily: th.faces.support, fill: ink, fontWeight:'600' }, props) });
    const R = (name, props) => ({ kind:'rect', name, solid:false, props: Object.assign({ fill: plate, stroke, strokeWidth: sw, rx: 18 }, props) });
    const blocks = { rating: [], quote: [], head: [], chips: [], cta: [] };
    const CTA_NAMES = ['CTA Bar','CTA Bar Sheen','CTA','Phone Pill','Phone Number'];
    /* --- rating block --- */
    if (spec.rating === 'pill'){
      blocks.rating = ['Rate Pill','Rate Pill Sheen','Stars','Rating Line'];
    } else if (spec.rating === 'free'){
      drop('Rate Pill Sheen'); drop('Rate Pill');
      stars.props.left = W / 2; stars.props.originX = 'center'; stars.props.top = 70; stars.props.fontSize = 44; stars.props.charSpacing = 120;
      rating.text = '4.9 AVERAGE · 200+ LOCAL SELLERS'; rating.props.left = W / 2; rating.props.originX = 'center'; rating.props.top = 128; rating.props.fontSize = 24; rating.props.charSpacing = 80;
      blocks.rating = ['Stars','Rating Line'];
    } else if (spec.rating === 'badge'){
      pill.props.left = 70; pill.props.top = 70; pill.props.width = 400; pill.props.height = 70; pill.__panel = true;
      const sh = L('Rate Pill Sheen'); if (sh){ sh.props.left = 90; sh.props.top = 76; sh.props.width = 360; }
      stars.props.left = 94; stars.props.top = 88; stars.props.fontSize = 28; stars.props.originX = 'left'; stars.props.originY = 'top';
      rating.text = '4.9 · 200+ sellers'; rating.props.left = 262; rating.props.top = 92; rating.props.fontSize = 24; rating.props.originX = 'left';
      blocks.rating = ['Rate Pill','Rate Pill Sheen','Stars','Rating Line'];
    } else { /* inline: the stars ride the quote block; nothing up top */
      drop('Rate Pill Sheen'); drop('Rate Pill');
      stars.props.fontSize = 30; stars.props.charSpacing = 60; rating.props.fontSize = 22; rating.text = '4.9 · 200+ local sellers';
      blocks.rating = [];
    }
    /* --- quote block --- */
    const q0 = (card.props.top || 228);
    const inlineStars = spec.rating === 'inline' && spec.quote !== 'centered';
    if (spec.rating === 'inline' && spec.quote === 'centered'){
      stars.props.left = W / 2; stars.props.originX = 'center'; stars.props.top = 70; stars.props.fontSize = 40; stars.props.charSpacing = 120;
      rating.text = '4.9 AVERAGE · 200+ LOCAL SELLERS'; rating.props.left = W / 2; rating.props.originX = 'center'; rating.props.top = 124; rating.props.fontSize = 24; rating.props.charSpacing = 80;
      blocks.rating = ['Stars','Rating Line'];
    }
    if (spec.quote === 'mark' || spec.quote === 'markRight' || spec.quote === 'centered'){
      card.props.rx = 34;
      quote.text = qs[(seed * 7 + 2) % qs.length];
      quote.props.originX = 'left'; quote.props.textAlign = 'left'; quote.props.fontSize = Math.min(quote.props.fontSize || 46, 40);
      const cl = card.props.left || 70, cw = card.props.width || 942;
      if (spec.quote === 'mark'){
        quote.props.left = cl + 130; quote.props.width = cw - 170;
        t2.layers.splice(idx('Quote Card') + 1, 0, T('Quote Mark', '“', { left: cl + 18, top: q0 - 30, fontFamily:'Instrument Serif', fontSize:200, fill: th.accent, fontWeight:'400' }, 'deco'));
      } else if (spec.quote === 'markRight'){
        /* the closing mark owns the RIGHT gutter, top of the card */
        quote.props.left = cl + 48; quote.props.width = cw - 210;
        t2.layers.splice(idx('Quote Card') + 1, 0, T('Quote Mark', '”', { left: cl + cw - 150, top: q0 - 30, fontFamily:'Instrument Serif', fontSize:200, fill: th.accent, fontWeight:'400' }, 'deco'));
      } else { /* centered: a small VERIFIED REVIEW tab on the card's top edge, quote centred */
        quote.props.left = W / 2; quote.props.originX = 'center'; quote.props.textAlign = 'center'; quote.props.width = cw - 120; quote.props.fontSize = 42;
        t2.layers.splice(idx('Quote Card') + 1, 0,
          R('Review Tab', { left: W / 2 - 140, top: q0 - 20, width: 280, height: 40, rx: 20, fill: th.accent, strokeWidth: 0 }),
          T('Review Tab Text', 'VERIFIED REVIEW', { left: W / 2, top: q0, originX:'center', originY:'center', fontSize: 18, fontWeight:'800', charSpacing: 120, fill: th.onAccent || '#141110' }, 'badges'));
      }
      const qtop0 = q0 + (spec.quote === 'centered' ? 60 : 50);
      quote.props.top = qtop0;
      if (inlineStars){
        stars.props.left = quote.props.originX === 'center' ? W / 2 : quote.props.left; stars.props.originX = quote.props.originX; stars.props.top = q0 + 34; stars.props.originY = 'top';
        rating.props.left = quote.props.originX === 'center' ? W / 2 + 190 : quote.props.left + 210; rating.props.originX = 'left'; rating.props.top = q0 + 40;
        if (quote.props.originX === 'center') { rating.props.originX = 'center'; rating.props.left = W / 2; rating.props.top = q0 + 76; }
        quote.props.top = q0 + (quote.props.originX === 'center' ? 112 : 96);
      }
      /* the card hugs its quote: lines from the width, plus the who line */
      const fs0 = quote.props.fontSize, lines = Math.max(1, Math.ceil(String(quote.text).length * fs0 * 0.5 / (quote.props.width || 800)));
      const qh = lines * fs0 * 1.25, ch = Math.max(230, (quote.props.top - q0) + qh + 96);
      card.props.height = ch;
      const sheen = L('Quote Card Sheen'); if (sheen && spec.quote === 'centered') drop('Quote Card Sheen');
      if (who){ who.props.top = q0 + ch - 56; who.props.originY = 'top'; if (spec.quote === 'centered'){ who.props.originX = 'center'; who.props.left = W / 2; } }
      blocks.quote = ['Quote Card','Quote Card Sheen','Review Tab','Review Tab Text','Quote Mark','Quote','Who','Pin'];
    } else if (spec.quote === 'strip3' || spec.quote === 'strip2'){
      const at = idx('Quote Card'); drop('Quote Card Sheen'); drop('Quote'); drop('Pin'); drop('Who'); drop('Quote Card');
      /* inline stars on a strip: the strip's own stars line replaces the
         originals — both showed, "a little confusing" */
      if (inlineStars){ drop('Stars'); drop('Rating Line'); }
      const rows = [], nrow = spec.quote === 'strip3' ? 3 : 2, rowH = spec.quote === 'strip3' ? 86 : 108, gap = 22;
      let y = q0 + (inlineStars ? 52 : 0);
      if (inlineStars){ rows.push(Object.assign({}, T('Stars Inline', '★★★★★  4.9 · 200+ local sellers', { left: 104, top: q0 + 14, fontSize: 24, charSpacing: 60 }))); }
      for (let r = 0; r < nrow; r++){
        rows.push(R('Review Row ' + (r + 1), { left: 70, top: y, width: 942, height: rowH, rx: rowH / 2, fill: String(plate).replace(/,\s*[\d.]+\)$/, ',0.74)') }));
        rows.push(T('Review Text ' + (r + 1), '"' + qs[(seed + r) % qs.length] + '"', { left: 104, top: y + rowH / 2, originY:'center', fontSize: nrow === 3 ? 28 : 32 }));
        /* the who-style shows in a strip too: dash before the name, or name
           and city, or the name alone in caps */
        const label = spec.who === 'dash' ? '\u2014 ' + nm(r) : spec.who === 'pin' ? nm(r) + '  ·  ' + city(r).split(',')[0] : nm(r).toUpperCase();
        rows.push(T('Review Name ' + (r + 1), label, { left: 980, top: y + rowH / 2, originX:'right', originY:'center', fontSize: spec.who === 'pin' ? 20 : 22, fontWeight:'800', charSpacing: spec.who === 'right' ? 80 : 30, fontStyle: spec.who === 'dash' ? 'italic' : 'normal' }));
        y += rowH + gap;
      }
      t2.layers.splice(at, 0, ...rows);
      blocks.quote = rows.map(r => r.name);
      blocks.rating = blocks.rating; // unchanged
      if (inlineStars) blocks.quote.unshift('Stars Inline');
    } else { /* ghost: no card, the quote set large over the photograph */
      drop('Quote Card Sheen'); drop('Quote Card');
      quote.text = String(quote.text); quote.props.fontSize = 50; quote.props.width = 900; quote.props.left = W / 2; quote.props.originX = 'center'; quote.props.textAlign = 'center';
      quote.props.top = q0 + (inlineStars ? 70 : 20); quote.props.fontWeight = '700';
      if (inlineStars){ stars.props.left = W / 2; stars.props.originX = 'center'; stars.props.top = q0 + 10; rating.props.left = W / 2; rating.props.originX = 'center'; rating.props.top = q0 + 48; }
      if (who){ who.props.top = q0 + 250; }
      blocks.quote = ['Stars','Rating Line','Quote','Who','Pin'].filter(nme => inlineStars || (nme !== 'Stars' && nme !== 'Rating Line'));
    }
    /* --- who line --- */
    const whoL = L('Who');
    if (whoL){
      if (spec.who === 'right'){ drop('Pin'); whoL.props.originX = 'right'; whoL.props.left = (card.props.left || 70) + (card.props.width || 942) - 40; }
      else if (spec.who === 'dash'){
        drop('Pin');
        whoL.text = '\u2014  ' + String(whoL.text).replace(/\s+·\s+/, ', ');
        whoL.props.originX = 'center'; whoL.props.left = W / 2; whoL.props.fontStyle = 'italic';
      }
    }
    /* --- headline, chips, cta membership --- */
    blocks.head = ['Headline 2'];
    if (spec.chips === 'chips'){ blocks.chips = ['Chip 1','Chip Text 1','Chip 2','Chip Text 2','Chip 3','Chip Text 3']; }
    else {
      const texts = [1, 2, 3].map(i => (L('Chip Text ' + i) || {}).text || '').map(t => String(t).replace(/^✓\s*/, '').trim()).filter(Boolean);
      [1, 2, 3].forEach(i => { drop('Chip Text ' + i); drop('Chip ' + i); });
      if (spec.chips === 'inline'){
        t2.layers.push(T('Seal Line', texts.map(t => '✓ ' + t).join('     '), { left: W / 2, top: 800, originX:'center', fontSize: 24, fontWeight:'800', charSpacing: 80 }, 'badges'));
        blocks.chips = ['Seal Line'];
      } else {
        const lines = INFO.yes.slice(seed % 3, seed % 3 + 3);
        blocks.chips = [];
        lines.forEach((t, i) => { t2.layers.push(T('Point ' + (i + 1), '✓  ' + t, { left: 96, top: 780 + i * 44, fontSize: 26, fontWeight:'700' }, 'info')); blocks.chips.push('Point ' + (i + 1)); });
      }
    }
    if (spec.cta === 'bar'){ blocks.cta = CTA_NAMES; }
    else {
      drop('CTA Bar Sheen'); drop('CTA Bar');
      const pp = L('Phone Pill'), ph = L('Phone Number'), ct = L('CTA');
      if (pp){ pp.props.left = W / 2 - 310; pp.props.width = 620; pp.props.top = 920; pp.props.height = 96; }
      if (ph){ ph.props.left = W / 2; ph.props.originX = 'center'; ph.props.top = 934; ph.props.fontSize = 48; }
      if (ct){ ct.props.left = W / 2; ct.props.originX = 'center'; ct.props.top = 880; ct.props.fontSize = 24; ct.props.charSpacing = 120; }
      blocks.cta = ['CTA','Phone Pill','Phone Number'];
    }
    /* --- vertical order and slots --- */
    const order = spec.head === 'top' ? ['head','rating','quote','chips','cta'] : spec.head === 'low' ? ['rating','quote','chips','head','cta'] : ['rating','quote','head','chips','cta'];
    const extent = names => {
      const ls = names.map(L).filter(l => l && l.props);
      if (!ls.length) return null;
      let top = Infinity, bot = -Infinity;
      ls.forEach(l => { const p = l.props; const h = l.kind === 'rect' ? (p.height || 0) : l.kind === 'circle' ? (p.radius || 0) * 2 : typeof l.text === 'string' ? (p.fontSize || 30) * (String(l.text).split('\n').length) * 1.15 : 0;
        const t0 = (p.top || 0) - (p.originY === 'center' ? h / 2 : 0); top = Math.min(top, t0); bot = Math.max(bot, t0 + h); });
      return { top, h: bot - top, ls };
    };
    const ex = {}; order.forEach(b => ex[b] = extent(blocks[b]));
    const GAP = 26, used = order.filter(b => ex[b]);
    const total = used.reduce((a, b) => a + ex[b].h, 0) + GAP * (used.length - 1);
    let y = Math.max(40, Math.round((H - 40 - total) / 2));
    if (total > H - 80){ y = 40; }
    used.forEach(b => { const dy = y - ex[b].top; ex[b].ls.forEach(l => { l.props.top = (l.props.top || 0) + dy; }); y += ex[b].h + GAP; });
  }
  /* ELEMENTS. "All themes and templates should have some amount of extra
     assets or imagery or things to look at — even icons can really add
     colour." A category owns a small set of marks; two to four of them sit in
     the card's free space, under the type, in the palette's colours (Pokémon
     in its own brand colours), some tilted; one card in four goes without. */
  ICONS.pokeball = { d: 'M50 8 A42 42 0 0 1 92 50 H64 A14 14 0 0 0 36 50 H8 A42 42 0 0 1 50 8 Z M50 92 A42 42 0 0 1 8 50 H36 A14 14 0 0 0 64 50 H92 A42 42 0 0 1 50 92 Z M50 42 A8 8 0 1 0 50 58 A8 8 0 1 0 50 42 Z', sw: 5 };
  ICONS.bolt = { d: 'M56 6 L22 56 H46 L40 94 L78 42 H54 Z', sw: 6 };
  ICONS.dollar = { d: 'M50 10 V90 M68 30 C68 20 32 18 32 34 C32 52 68 46 68 66 C68 82 32 80 32 70', sw: 8 };
  ICONS.coin = { d: 'M50 12 A38 38 0 1 0 50 88 A38 38 0 1 0 50 12 Z M50 26 A24 24 0 1 0 50 74 A24 24 0 1 0 50 26 Z', sw: 6 };
  ICONS.gem = { d: 'M20 40 L36 20 H64 L80 40 L50 84 Z M20 40 H80 M36 20 L50 40 L64 20 M50 40 V84', sw: 5 };
  ICONS.star5 = { d: 'M50 8 L61 38 L94 38 L67 57 L77 90 L50 70 L23 90 L33 57 L6 38 L39 38 Z', sw: 5 };
  ICONS.keyfob = { d: 'M30 12 H70 A10 10 0 0 1 80 22 V78 A10 10 0 0 1 70 88 H30 A10 10 0 0 1 20 78 V22 A10 10 0 0 1 30 12 Z M50 30 A8 8 0 1 0 50 46 A8 8 0 1 0 50 30 Z M38 62 H62 M38 74 H62', sw: 5 };
  ICONS.cardSlab = { d: 'M30 8 H70 A8 8 0 0 1 78 16 V84 A8 8 0 0 1 70 92 H30 A8 8 0 0 1 22 84 V16 A8 8 0 0 1 30 8 Z M34 22 H66 V58 H34 Z M34 70 H66', sw: 5 };
  ICONS.drop = { d: 'M50 8 C50 8 22 44 22 62 A28 28 0 0 0 78 62 C78 44 50 8 50 8 Z', sw: 6 };
  ICONS.check = { d: 'M18 52 L40 74 L84 28', sw: 12 };
  /* the owner's list: car, truck, key, steering wheel — and the rest of a
     five-times-larger bench */
  ICONS.car = { d: 'M10 62 L20 42 Q24 34 34 34 H66 Q76 34 80 42 L90 62 V76 H78 A9 9 0 0 1 60 76 H40 A9 9 0 0 1 22 76 H10 Z M24 46 H76', sw: 5 };
  ICONS.truck = { d: 'M8 30 H56 V70 H8 Z M56 44 H76 L88 58 V70 H56 Z M20 70 A8 8 0 1 0 20 86 A8 8 0 1 0 20 70 Z M74 70 A8 8 0 1 0 74 86 A8 8 0 1 0 74 70 Z', sw: 5 };
  ICONS.wheel = { d: 'M50 8 A42 42 0 1 0 50 92 A42 42 0 1 0 50 8 Z M50 36 A14 14 0 1 0 50 64 A14 14 0 1 0 50 36 Z M11 50 H36 M64 50 H89 M50 64 V90', sw: 6 };   // rim, hub, spokes at 9/3/6 — the old one read as a peace sign
  ICONS.key = { d: 'M30 30 A18 18 0 1 0 30 66 A18 18 0 1 0 30 30 Z M46 48 H90 V62 H80 V72 H70 V62 H62 V70 H54 V62 H46 Z', sw: 5 };
  ICONS.moto = { d: 'M22 60 A12 12 0 1 0 22 84 A12 12 0 1 0 22 60 Z M78 60 A12 12 0 1 0 78 84 A12 12 0 1 0 78 60 Z M22 72 L40 44 H60 L78 72 M52 44 L44 28 H60', sw: 5 };
  ICONS.van = { d: 'M8 34 H62 L88 52 V72 H8 Z M22 72 A8 8 0 1 0 22 88 A8 8 0 1 0 22 72 Z M74 72 A8 8 0 1 0 74 88 A8 8 0 1 0 74 72 Z M62 34 V52 H88', sw: 5 };
  ICONS.phoneMark = { d: 'M34 6 H66 A8 8 0 0 1 74 14 V86 A8 8 0 0 1 66 94 H34 A8 8 0 0 1 26 86 V14 A8 8 0 0 1 34 6 Z M42 14 H58', sw: 5 };
  ICONS.watchMark = { d: 'M50 26 A24 24 0 1 0 50 74 A24 24 0 1 0 50 26 Z M38 8 H62 L58 26 H42 Z M38 92 H62 L58 74 H42 Z M50 38 V50 L58 56', sw: 5 };
  ICONS.ringMark = { d: 'M50 30 A26 26 0 1 0 50 82 A26 26 0 1 0 50 30 Z M40 20 L50 8 L60 20 Z M40 20 H60 L50 30 Z', sw: 5 };
  ICONS.chain = { d: 'M22 42 A12 12 0 0 1 34 30 H46 A12 12 0 0 1 46 54 H34 A12 12 0 0 1 22 42 Z M54 58 A12 12 0 0 1 66 46 H78 A12 12 0 0 1 78 70 H66 A12 12 0 0 1 54 58 Z', sw: 5 };
  ICONS.ingot = { d: 'M22 34 H78 L90 66 H10 Z M30 46 H70', sw: 5 };
  ICONS.box = { d: 'M14 34 L50 18 L86 34 V72 L50 88 L14 72 Z M14 34 L50 50 L86 34 M50 50 V88', sw: 5 };
  ICONS.shield = { d: 'M50 8 L84 20 V50 C84 72 68 86 50 92 C32 86 16 72 16 50 V20 Z M36 50 L46 60 L66 40', sw: 5 };
  ICONS.thumbs = { d: 'M22 46 H36 V86 H22 Z M36 50 L52 20 C60 20 62 28 58 42 H80 C88 42 88 52 84 58 L76 84 C74 86 72 86 68 86 H36', sw: 5 };
  ICONS.medal = { d: 'M50 40 A22 22 0 1 0 50 84 A22 22 0 1 0 50 40 Z M34 8 L44 44 M66 8 L56 44 M30 8 H46 M54 8 H70', sw: 5 };
  ICONS.tag = { d: 'M10 50 L48 12 H88 V52 L50 90 Z M72 28 A6 6 0 1 0 72 40 A6 6 0 1 0 72 28 Z', sw: 5 };
  ICONS.receipt = { d: 'M26 8 H74 V92 L64 84 L54 92 L44 84 L34 92 L26 84 Z M36 30 H64 M36 46 H64 M36 62 H54', sw: 5 };
  ICONS.cash = { d: 'M8 28 H92 V72 H8 Z M50 40 A10 10 0 1 0 50 60 A10 10 0 1 0 50 40 Z M18 38 H24 M76 62 H82', sw: 5 };
  ICONS.burst = { d: 'M50 6 L58 30 L82 18 L70 42 L94 50 L70 58 L82 82 L58 70 L50 94 L42 70 L18 82 L30 58 L6 50 L30 42 L18 18 L42 30 Z', sw: 5 };
  ICONS.heart = { d: 'M50 88 C20 66 8 50 14 32 C20 16 42 16 50 32 C58 16 80 16 86 32 C92 50 80 66 50 88 Z', sw: 5 };
  ICONS.clock = { d: 'M50 10 A40 40 0 1 0 50 90 A40 40 0 1 0 50 10 Z M50 26 V50 L66 60', sw: 5 };
  ICONS.flag = { d: 'M20 92 V10 M20 14 H80 L68 34 L80 54 H20', sw: 6 };
  ICONS.battery = { d: 'M10 30 H78 V70 H10 Z M78 42 H90 V58 H78 Z M20 40 H36 V60 H20 Z M42 40 H58 V60 H42 Z', sw: 5 };
  ICONS.handshake = { d: 'M6 40 L30 22 L50 34 L70 22 L94 40 M30 22 L20 60 L44 80 L60 66 M70 22 L80 60 L56 80', sw: 5 };
  ICONS.vial = { d: 'M36 8 H64 M42 8 V56 A8 8 0 1 0 58 56 V8 M42 40 H58', sw: 5 };
  const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  const ELEMENTS = {
    pokemon: { icons: ['pokeball','pokeball','bolt','star5','cardSlab','burst','gem','medal','heart'], emoji: ['⚡','⭐','🔥','🎴','🃏','💎','🏆','✨'], colors: ['#ffcb05','#2a75bb','#cc0000','#ffcb05'] },
    sports:  { icons: ['star5','cardSlab','bolt','check','baseball','trophy','medal','burst','flag'], emoji: ['⚾','🏀','🏈','🏒','🏆','⭐','🎴','🥇'], colors: null },
    phones:  { icons: ['bolt','check','dollar','sparkle','phoneMark','battery','cash','shield','thumbs'], emoji: ['📱','⚡','💵','✅','🔋','📲'], colors: null },   // no watch glyph on an iPhone card
    /* one Apple line per card: a phone emoji on a MacBook ad is the wrong
       product (owner, 2026-09-03: "why is there an iPhone emoji?") */
    ipad:    { icons: ['bolt','check','dollar','sparkle','battery','cash','shield','tag'], emoji: ['⚡','💵','✅','🔋'], colors: null },
    macbook: { icons: ['bolt','check','dollar','sparkle','battery','cash','shield','tag'], emoji: ['💻','⚡','💵','✅'], colors: null },
    watch:   { icons: ['bolt','check','dollar','sparkle','watchMark','battery','cash','shield'], emoji: ['⌚','⚡','💵','✅'], colors: null },
    cars:    { icons: ['car','key','wheel','keyfob','dollar','check','flag','cash','tag'], emoji: ['🚗','🚙','🔑','💵','🏁','🛞'], colors: null },
    trucks:  { icons: ['truck','key','wheel','car','keyfob','dollar','flag','cash'], emoji: ['🛻','🔑','💵','🏁','🛞','🔧'], colors: null },
    bikes:   { icons: ['flame','flame','moto','key','wheel','flag'], emoji: ['🔥','🏍️','🔑','🏁','🔥'], colors: ['#ff6a00','#ffb300','#e53935'] },
    vans:    { icons: ['van','box','key','wheel','dollar','check','tag'], emoji: ['🚐','📦','🔑','💵','🏁','🛞'], colors: null },
    gold:    { icons: ['gem','coin','dollar','sparkle','ringMark','chain','ingot','watchMark','medal','cash'], emoji: ['💰','💎','💍','⌚','🪙','✨','🏆','💵'], colors: ['#f2c14e','#c9950f','#fff1b8'] },
    silver:  { icons: ['gem','sparkle','coin','check','ringMark','chain','ingot','medal','heart'], emoji: ['🥈','🍴','💍','🪙','✨','🏺','💎'], colors: ['#e6e8ea','#9aa0a6','#ffffff'] },
    coins:   { icons: ['coin','coin','dollar','star5','ingot','medal','cash','burst','slab'], emoji: ['🪙','💰','💵','🏛️','📀','✨','🥇'], colors: ['#f2c14e','#d9d9d9','#c9950f'] },
    strips:  { icons: ['drop','check','dollar','sparkle','box','vial','clock','shield','cash'], emoji: ['🩸','💊','📦','✅','💵','🧪','🩺','⏱️'], colors: null },
  };
  /* the marks are always the CATEGORY's — "relevant to the actual theme,
     which is bullion, not little space icons"; a family only sets the colour
     (pen ink on paper) and, on paper, drops emoji for drawn marks */
  const ELEMENTS_FAMILY = { 'Lined Paper': { colors: 'pen', noEmoji: true } };
  /* THE SLAB FRAME (owner, 2026-09-03: "we can make a blank slab a theme… it
     perfectly leaves room for content"). The blank graded slab is the frame:
     the headline goes on the label like a grade line, everything else is the
     card in the window, scaled to fit. The window is painted in the palette so
     the theme still shows; the label stays paper-white with dark ink. */
  const SLAB = { src:'assets/cutouts/sports-slab-graded.webp', iw:1572, ih:1425, label:[0.075,0.055,0.925,0.265], win:[0.075,0.31,0.925,0.95] };
  function slabFrame(t2, th, cat, seed){
    if (!/pokemon|sports/.test(cat)) return;   // "this should just be for card buyers"
    const W = 1080, H = 1080, k0 = H / SLAB.ih, dw = SLAB.iw * k0, ox = (W - dw) / 2;
    const box = r => ({ x: ox + r[0] * dw, y: r[1] * H, w: (r[2] - r[0]) * dw, h: (r[3] - r[1]) * H });
    const LB = box(SLAB.label), WB = box(SLAB.win);
    const key = 'slab:' + th.id + ':' + cat + ':' + (seed % 3);
    const img = CUTOUT_ELS[SLAB.src];
    if (!img) return;
    /* what the slab holds: the category's own photograph first, a card cutout
       second (marked __cut so it is fitted, not cropped) */
    const cardImg = (() => {
      const web = (WEBBG[cat] || []).filter(src => TPL_BG_ELS[src] && TPL_BG_ELS[src].width);
      if (web.length) return TPL_BG_ELS[web[seed % web.length]];
      const names = cat === 'pokemon' ? ['poke-slabs-trio'] : ['sports-slabs-stack','sports-slab'];
      const el = names.map(n => CUTOUT_ELS['assets/cutouts/' + n + '.webp']).filter(e => e && e.width)[seed % 2] ||
                 names.map(n => CUTOUT_ELS['assets/cutouts/' + n + '.webp']).filter(e => e && e.width)[0];
      if (el) el.__cut = true;
      return el || null;
    })();
    drawGround(key, (g) => {
      g.fillStyle = th.c1; g.fillRect(0, 0, W, H);
      const lg = g.createLinearGradient(0, 0, W, H); lg.addColorStop(0, rgba(th.c2 || th.c1, 0.9)); lg.addColorStop(1, rgba(th.c1, 0)); g.fillStyle = lg; g.fillRect(0, 0, W, H);
      g.save(); g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 50; g.shadowOffsetY = 18; g.drawImage(img, ox, 0, dw, H); g.restore();
      g.fillStyle = rgba(th.c1, 0.97); g.fillRect(WB.x + 6, WB.y + 6, WB.w - 12, WB.h - 12);            // the card in the window takes the palette
      /* A REAL CARD IN THE WINDOW (owner, 2026-09-03: "maybe a card in the
         background") — a slab with an empty window is a slab with nothing in
         it. The photograph goes under a heavy wash of the ground so the copy
         printed over it stays the loudest thing. */
      if (cardImg){
        g.save(); g.beginPath(); g.rect(WB.x + 6, WB.y + 6, WB.w - 12, WB.h - 12); g.clip();
        const iw = cardImg.width, ih = cardImg.height, cut = cardImg.__cut;
        const k = cut ? Math.min((WB.w - 60) / iw, (WB.h - 60) / ih) : Math.max((WB.w - 12) / iw, (WB.h - 12) / ih) * 1.02;
        const w = iw * k, h = ih * k;
        g.drawImage(cardImg, WB.x + (WB.w - w) / 2, WB.y + (WB.h - h) / 2, w, h);
        g.fillStyle = rgba(th.c1, cut ? 0.55 : 0.66); g.fillRect(WB.x + 6, WB.y + 6, WB.w - 12, WB.h - 12);
        g.restore();
      }
      const wg = g.createLinearGradient(WB.x, WB.y, WB.x + WB.w, WB.y + WB.h); wg.addColorStop(0, rgba(th.c2 || th.accent, 0.35)); wg.addColorStop(1, rgba(th.c1, 0)); g.fillStyle = wg; g.fillRect(WB.x + 6, WB.y + 6, WB.w - 12, WB.h - 12);
      g.fillStyle = rgba(th.c1, 0.06); g.fillRect(LB.x, LB.y, LB.w, LB.h);                               // a whisper of the palette on the label
      /* "make it appear as graded": a divider, and a barcode under the grade block */
      g.fillStyle = 'rgba(20,20,24,0.55)'; g.fillRect(LB.x + LB.w * 0.68, LB.y + LB.h * 0.10, 2, LB.h * 0.80);
      let bx = LB.x + LB.w * 0.72, r = seed * 7 + 3; const by = LB.y + LB.h * 0.80, bh = LB.h * 0.12, bend = LB.x + LB.w * 0.96;
      g.fillStyle = '#1a1a1e'; while (bx < bend){ r = (r * 1103515245 + 12345) & 0x7fffffff; const w = 2 + (r % 4); if ((r >> 4) % 3) g.fillRect(bx, by, w, bh); bx += w + 2; }
    });
    t2.bg = { type:'image', src: key, scrimColor: th.c1, scrim: 0.001, blur: 0 }; t2.__slab = true; t2.__dg = true;
    const est = l => {   // a layer's box, best effort from its props
      const p = l.props || {}; let w = p.width || p.w || 0, h = p.height || p.h || 0;
      if (typeof l.text === 'string'){ const lines = String(l.text).split('\n'); const fs = p.fontSize || 40;
        w = Math.max(w, Math.max(...lines.map(t => t.length)) * fs * 0.64); h = Math.max(h, lines.length * fs * Math.max(p.lineHeight || 1.15, 1.25)); }
      if (l.kind === 'circle'){ w = h = (p.radius || 40) * 2; }
      if (l.kind === 'cutout' && !h){ const im = CUTOUT_ELS[p.src]; h = im ? w * im.height / im.width : w; }
      const x = (p.left || 0) - (p.originX === 'center' ? w / 2 : p.originX === 'right' ? w : 0);
      const y = (p.top || 0) - (p.originY === 'center' ? h / 2 : p.originY === 'bottom' ? h : 0);
      return { x, y, w, h };
    };
    const scaleInto = (layers, B, pad, kmax) => {
      if (!layers.length) return;
      const bx = layers.map(est); const x0 = Math.min(...bx.map(b => b.x)), y0 = Math.min(...bx.map(b => b.y)), x1 = Math.max(...bx.map(b => b.x + b.w)), y1 = Math.max(...bx.map(b => b.y + b.h));
      const k = Math.min((B.w - pad * 2) / Math.max(1, x1 - x0), (B.h - pad * 2) / Math.max(1, y1 - y0), kmax || 1);
      const dx = B.x + (B.w - (x1 - x0) * k) / 2 - x0 * k, dy = B.y + (B.h - (y1 - y0) * k) / 2 - y0 * k;
      layers.forEach(l => { const p = l.props; if (!p) return;
        p.left = (p.left || 0) * k + dx; p.top = (p.top || 0) * k + dy;
        ['width','height','w','h','fontSize','rx','ry','radius','strokeWidth'].forEach(q => { if (typeof p[q] === 'number') p[q] *= k; });
        if (p.shadow){ p.shadow = Object.assign({}, p.shadow, { blur: (p.shadow.blur || 0) * k, offsetX: (p.shadow.offsetX || 0) * k, offsetY: (p.shadow.offsetY || 0) * k }); }
        l.__slabK = k; });
    };
    t2.layers = t2.layers.filter(l => !l.__moneyPlate);   // a band with no word in it is an empty pink box
    const live = t2.layers.filter(l => l.props && !(l.props.opacity === 0) && !/Sheen|Vignette|Grain/i.test(l.name || '') && l.kind !== 'vignette' && l.kind !== 'grain');
    const heads = live.filter(l => l.role === 'headline' && typeof l.text === 'string');
    const rest = live.filter(l => !heads.includes(l));
    const dark = lumHex(th.ink) < 0.35 ? th.ink : '#17171a';
    heads.forEach(l => { l.props.fill = dark; delete l.props.grad; l.props.shadow = null; l.props.stroke = null; l.props.strokeWidth = 0; l.__lock = true; });
    const LBH = { x: LB.x + 16, y: LB.y, w: LB.w * 0.66 - 16, h: LB.h };
    scaleInto(heads, LBH, 14, 1.8);   // the label headline may grow into the room
    /* tracked, three-line headlines measure short: if any line still runs past
       the label, scale the group again on the measured overflow */
    { const bx = heads.map(est); const y0 = Math.min(...bx.map(b => b.y)), y1 = Math.max(...bx.map(b => b.y + b.h * 1.12));
      if (y1 > LBH.y + LBH.h - 10 || y0 < LBH.y + 6) scaleInto(heads, LBH, 22, (LBH.h - 32) / Math.max(1, y1 - y0)); }
    /* the grade block: a 10 and GEM MT on the right of the label, like the slab it sits in */
    const gx = LB.x + LB.w * 0.84, dispFace = (heads[0] && heads[0].props.fontFamily) || th.faces.display;
    /* two grade blocks (owner, 2026-09-03: "or put 5 star? for another variation"):
       10 / GEM MT, or five stars / TOP RATED — always five, never fewer */
    const starGrade = FACESYS.slabGrade ? FACESYS.slabGrade === 'stars' : seed % 2 === 1;
    if (starGrade){
      t2.layers.push({ kind:'text', name:'Grade Stars', role:'badges', text:'★★★★★', __lock:true, __slabGrade:true,
        props:{ left: gx, top: LB.y + LB.h * 0.36, originX:'center', originY:'center', fontFamily:'Satoshi', fontSize: Math.round(LB.h * 0.22), fill: lumHex(th.accent) < 0.62 ? th.accent : dark, fontWeight:'900', charSpacing: 60 } });
      t2.layers.push({ kind:'text', name:'Grade Word', role:'badges', text:'TOP RATED', __lock:true, __slabGrade:true,
        props:{ left: gx, top: LB.y + LB.h * 0.64, originX:'center', originY:'center', fontFamily: th.faces.support, fontSize: Math.round(LB.h * 0.10), fill: dark, fontWeight:'700', charSpacing: 180 } });
    } else {
      t2.layers.push({ kind:'text', name:'Grade Num', role:'badges', text:'10', __lock:true, __slabGrade:true,
        props:{ left: gx, top: LB.y + LB.h * 0.33, originX:'center', originY:'center', fontFamily: dispFace, fontSize: Math.round(LB.h * 0.52), fill: dark, fontWeight:'900' } });
      t2.layers.push({ kind:'text', name:'Grade Word', role:'badges', text:'GEM MT', __lock:true, __slabGrade:true,
        props:{ left: gx, top: LB.y + LB.h * 0.66, originX:'center', originY:'center', fontFamily: th.faces.support, fontSize: Math.round(LB.h * 0.10), fill: dark, fontWeight:'700', charSpacing: 180 } });
    }
    /* the headline left a hole in the middle of the card: close vertical gaps
       wider than 40px between the remaining bands, then centre the stack */
    const bands = rest.map(l => ({ l, b: est(l) })).sort((a, b) => a.b.y - b.b.y);
    let bottom = -Infinity, shift = 0;   // bottom and b.y are both in the original (unshifted) frame
    bands.forEach(({ l, b }) => { if (bottom > -Infinity && b.y - bottom > 40) shift += (b.y - bottom) - 40; l.props.top = (l.props.top || 0) - shift; bottom = Math.max(bottom, b.y + b.h); });
    scaleInto(rest, WB, 26);
  }
  /* THE BRAND'S OWN MARK. Owner, 2026-09-03: "where is the brand logo?" on a
     WE BUY HYUNDAIS card. The Commons wordmarks are black on transparent, so
     each one is re-inked to a tone that reads on the card before it is placed. */
  const BRAND_LOGO = { TOYOTAS:'toyota', TACOMAS:'toyota', TUNDRAS:'toyota', HONDAS:'honda', FORDS:'ford', 'F-150S':'ford', TRANSITS:'ford',
    CHEVYS:'chevrolet', SILVERADOS:'chevrolet', NISSANS:'nissan', JEEPS:'jeep', TESLAS:'tesla', BMWS:'bmw', MERCEDES:'mercedes-benz',
    SPRINTERS:'mercedes-benz', HYUNDAIS:'hyundai', KIAS:'kia', DODGES:'dodge', RAMS:'ram-trucks', HARLEYS:'harley-davidson',
    YAMAHAS:'yamaha-motor', KAWASAKIS:'kawasaki' };
  function inkedLogo(src, colour){
    const key = 'logo:' + src + ':' + colour;
    if (CUTOUT_ELS[key]) return key;
    const img = CUTOUT_ELS[src]; if (!img || !img.width) return null;
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-in'; g.fillStyle = colour; g.fillRect(0, 0, c.width, c.height);
    CUTOUT_ELS[key] = c; return key;
  }
  /* WHAT THE CARD IS ABOUT, and what may therefore appear on it. Positive list
     first (the prefixes that ARE this subject), then the negative list — the
     prefixes that must never share a card with it. */
  const lookSkips = [];
  const SUBJECTS = {
    iphone:  { cut:/^(iphone-|ip-(?!gen)|qs-iphone|own-apple|own-stock-iphone)/i, photo:/^(assets\/scenes\/|assets\/bg-web\/phones-)/i, never:/^(ipad|qs-ipad|mac|macbook|qs-device-mac|qs-sheet-mb|watch|apple-watch|sam-|samsung|pix-|gold-|silver-|coin-|strip-|poke-|sports-|car-)/i },
    ipad:    { cut:/^(ipad|qs-ipad|qs-family-ipad|own-stock-iphone-ipad)/i, photo:/^(assets\/scenes\/|assets\/bg-web\/phones-)/i, never:/^(iphone-|ip-|qs-iphone|own-apple|mac|macbook|watch|sam-|pix-|gold-|silver-|coin-|strip-|poke-|sports-|car-)/i },
    macbook: { cut:/^(mac|macbook|qs-device-mac|qs-sheet-mb|qs-sheet-imac|qs-sheet-macstudio|qs-cat-mac|own-stock-mac)/i, photo:/^(assets\/scenes\/|assets\/bg-web\/macbook-)/i, never:/^(iphone-|ip-|qs-iphone|own-apple|ipad|qs-ipad|watch|sam-|pix-|gold-|silver-|coin-|strip-|poke-|sports-|car-)/i },
    gold:    { cut:/^gold-/i, photo:/^assets\/bg-web\/gold-/i, never:/^(iphone|ip-|qs-|ipad|mac|watch|sam-|pix-|silver-|coin-|strip-|poke-|sports-|car-)/i },
    silver:  { cut:/^silver-/i, photo:/^assets\/bg-web\/silver-/i, never:/^(iphone|ip-|qs-|ipad|mac|watch|sam-|pix-|gold-|strip-|poke-|sports-|car-)/i },
    coins:   { cut:/^(coin-|silver-coins|gold-coins)/i, photo:/^assets\/bg-web\/(coins|silver)-/i, never:/^(iphone|ip-|qs-|ipad|mac|watch|sam-|pix-|strip-|poke-|sports-|car-)/i },
    strips:  { cut:/^strip-/i, photo:/^assets\/bg-web\/strips-/i, never:/^(iphone|ip-|qs-|ipad|mac|watch|sam-|pix-|gold-|silver-|coin-|poke-|sports-|car-)/i },
    pokemon: { cut:/^poke-/i, photo:/^assets\/bg-web\/pokemon-/i, never:/^(iphone|ip-|qs-|ipad|mac|watch|sam-|pix-|gold-|silver-|coin-|strip-|sports-|car-)/i },
    sports:  { cut:/^sports-/i, photo:/^assets\/bg-web\/(sports|pokemon)-/i, never:/^(iphone|ip-|qs-|ipad|mac|watch|sam-|pix-|gold-|silver-|coin-|strip-|poke-|car-)/i },
    cars:    { cut:/^car-(?!truck|van|motorcycle)/i, photo:/^assets\/bg-web\/cars-/i, never:/^(iphone|ip-|qs-|ipad|mac|watch|sam-|pix-|gold-|silver-|coin-|strip-|poke-|sports-)/i },
    trucks:  { cut:/^car-(truck|title|keys|key|wheel)/i, photo:/^assets\/bg-web\/trucks-/i, never:/^(iphone|ip-|qs-|ipad|mac|watch|sam-|pix-|gold-|silver-|coin-|strip-|poke-|sports-)/i },
    vans:    { cut:/^car-(van|title|keys|key)/i, photo:/^assets\/bg-web\/vans-/i, never:/^(iphone|ip-|qs-|ipad|mac|watch|sam-|pix-|gold-|silver-|coin-|strip-|poke-|sports-)/i },
    bikes:   { cut:/^car-(motorcycle|keys|key|wheel)/i, photo:/^assets\/bg-web\/bikes-/i, never:/^(iphone|ip-|qs-|ipad|mac|watch|sam-|pix-|gold-|silver-|coin-|strip-|poke-|sports-)/i },
  };
  function subjectOf(t2, deck, cat){
    const c0 = (deck && deck.cuts && deck.cuts[0]) || '';
    if (/^own-apple|^iphone|^qs-iphone|^ip-/.test(c0)) return 'iphone';
    if (/^ipad|^qs-ipad/.test(c0)) return 'ipad';
    if (/^mac|^qs-device-mac|^qs-sheet-mb|^own-stock-mac/.test(c0)) return 'macbook';
    if (/^car-truck/.test(c0)) return 'trucks';
    if (/^car-van/.test(c0)) return 'vans';
    if (/^car-motorcycle/.test(c0)) return 'bikes';
    return SUBJECTS[cat] ? cat : (cat === 'phones' ? 'iphone' : null);
  }
  /* A THEME'S OWN AUDIT RULES. Every locked look ships a positive list (what it
     must show) and a negative list (what may never appear on it) — the owner's
     "check the negative prompts" — and the renderer enforces both rather than
     trusting the recipe. Rules are literal startsWith on the cutout name, plus
     ground: and treat: tokens for the background. */
  function lookFaults(t2, look){
    if (!look) return [];
    const names = t2.layers.filter(l => l.kind === 'cutout' && l.props && typeof l.props.src === 'string'
        && !/^(logo:|slab:|dg:|abs:)/.test(l.props.src))
      .map(l => String(l.props.src).split('/').pop().replace(/\.webp$/, ''));
    const bg = t2.bg && typeof t2.bg.src === 'string' ? t2.bg.src : '';
    const groundNow = t2.__slab ? 'slab' : t2.__tileBg ? 'tile' : t2.__castBg ? 'cast' : t2.__absBg ? 'abs'
      : t2.__cashBg ? 'cash' : /^assets\/scenes\//.test(bg) ? 'scene' : /^assets\/bg-web\//.test(bg) ? 'photo' : 'flat';
    const out = [];
    (look.neverShow || []).forEach(rule => {
      const r = String(rule).trim();
      if (!r || /\s/.test(r) && !/^(ground|treat):/.test(r)) return;          // prose entries are for people, not the matcher
      if (/^ground:/.test(r)){ if (groundNow === r.slice(7)) out.push('neverShow ' + r); return; }
      if (/^logo:/.test(r)){ if (t2.layers.some(l => l.props && String(l.props.src || '').startsWith('logo:' + r.slice(5)))) out.push('neverShow ' + r); return; }
      if (/^assets\//.test(r)){ if (bg.startsWith(r)) out.push('neverShow ' + r); return; }
      if (names.some(n => n.startsWith(r))) out.push('neverShow ' + r);
    });
    const must = (look.mustShow || []).filter(m => /^[a-z0-9]/i.test(m) && !/\s/.test(m));
    if (must.length && names.length && !must.some(m => names.some(n => n.startsWith(m))))
      out.push('mustShow satisfied by nothing (' + must.slice(0, 3).join(', ') + ')');
    if (look.ground && groundNow !== look.ground && !(look.ground === 'photo' && groundNow === 'scene'))
      out.push('ground ' + groundNow + ' but the theme is ' + look.ground);
    return out;
  }
  function subjectFaults(t2, subject){
    const S = SUBJECTS[subject]; if (!S) return [];
    const out = [];
    t2.layers.forEach(l => {
      if (l.kind !== 'cutout' || !l.props || !l.props.src) return;
      if (/^logo:/.test(l.props.src) || /^slab:|^dg:|^abs:/.test(l.props.src)) return;
      const n = String(l.props.src).split('/').pop().replace(/\.webp$/, '');
      if (S.never.test(n) && !S.cut.test(n)) out.push('product ' + n + ' on a ' + subject + ' card');
    });
    const bg = t2.bg && typeof t2.bg.src === 'string' ? t2.bg.src : '';
    if (/^assets\/bg-web\//.test(bg) && !S.photo.test(bg)) out.push('ground ' + bg.split('/').pop() + ' on a ' + subject + ' card');
    if (/^assets\/scenes\//.test(bg) && !/^(iphone|ipad|macbook)$/.test(subject)) out.push('apple scene on a ' + subject + ' card');
    return out;
  }
  function addElements(t2, cat, seed, th, refs, line, brandWord){
    // every card decorates (owner, 2026-09-03: "smaller icons… part of being a good designer")
    const EF = ELEMENTS_FAMILY[th.family], base = (line && ELEMENTS[line]) || ELEMENTS[cat] || ELEMENTS.phones;
    const E = EF ? Object.assign({}, base, { colors: EF.colors === 'pen' ? [th.accent, th.ink, th.accent] : base.colors, emoji: EF.noEmoji ? null : base.emoji }) : base;
    const boxes = refs.map((o, k) => o && !/vignette|grain/.test(t2.layers[k].kind) ? o.getBoundingRect(true, true) : null)
      .filter(b => b && !(b.width > W * 0.85 && b.height > H * 0.85));
    const clear = r => !boxes.some(b => !(r.left + r.width <= b.left || b.left + b.width <= r.left || r.top + r.height <= b.top || b.top + b.height <= r.top));
    const colors = E.colors || [th.accent, th.support, th.accent2 || th.accent, th.accent3 || th.support];
    /* "stuff all over the place": one or two marks, corners first, then the
       mid-edges, never the middle of the card */
    const want = 1 + (seed % 2), placed = [];
    /* the logo takes the best free corner before any decorative mark does */
    let logoKey = null;
    if (brandWord && BRAND_LOGO[brandWord] && LOGOS[BRAND_LOGO[brandWord]]){
      const onDark = lumHex(th.c1) < 0.55;
      /* th.ink is brown on the amber palettes, which printed a brown Toyota
         wordmark; the mark takes black or white, whichever clears the ground */
      logoKey = inkedLogo(LOGOS[BRAND_LOGO[brandWord]], onDark ? '#ffffff' : '#14161c');
    }
    /* "to the left and the right of the hero": the money word's flanks come
       first, then the corners and mid-edges */
    const heroIdx = t2.layers.findIndex(l => l.role === 'headline' && typeof l.text === 'string' && (l.props.fontSize || 0) >= 100);
    const hb = heroIdx >= 0 && refs[heroIdx] ? refs[heroIdx].getBoundingRect(true, true) : null;
    /* a mark set 70px off the hero still touched the word — a green tick beside
       SELL YOUR read as part of the sentence (owner, 2026-09-03: "really?").
       The flank sits a clear 118px out, and only line art goes there: an emoji
       next to a word always reads as a glyph in that word. */
    const flank = hb ? [[hb.left - 118, hb.top + hb.height / 2], [hb.left + hb.width + 118, hb.top + hb.height / 2]] : [];
    const flankN = flank.length;
    const spots = flank.concat([[62, 62], [W - 62, 62], [62, H - 62], [W - 62, H - 62], [W / 2, 60], [60, H / 2], [W - 60, H / 2]]);
    for (let q = 0; q < spots.length && placed.length < want; q++){
      const [cx, cy] = spots[(q + seed) % spots.length];
      for (const size of [140, 110, 84, 64]){
        const box = { left: cx - size / 2 - 8, top: cy - size / 2 - 8, width: size + 16, height: size + 16 };
        if (box.left < 24 || box.top < 24 || box.left + box.width > W - 24 || box.top + box.height > H - 24) continue;
        if (!clear(box) || placed.some(p => Math.hypot(p.cx - cx, p.cy - cy) < 200)) continue;
        const onFlank = (q + seed) % spots.length < flankN;
        if (onFlank && size > 96) continue;                       // a mark beside the word stays small
        placed.push({ cx, cy, size, onFlank }); break;
      }
    }
    if (logoKey){
      const el = CUTOUT_ELS[logoKey], ar = el.width / el.height;
      for (const [cx, cy] of [[W - 150, 120], [150, 120], [W - 150, H - 150], [150, H - 150]]){
        for (const wide of [230, 190, 150]){
          const h2 = wide / ar, box = { left: cx - wide / 2 - 10, top: cy - h2 / 2 - 10, width: wide + 20, height: h2 + 20 };
          if (box.left < 20 || box.top < 20 || box.left + box.width > W - 20 || box.top + box.height > H - 20) continue;
          if (!clear(box)) continue;
          t2.layers.push({ kind:'cutout', name:'Brand Logo', role:'deco', __element:true,
            props:{ src: logoKey, left: cx, top: cy - h2 / 2, originX:'center', w: wide, opacity: 0.95 } });
          boxes.push(box);
          break;
        }
        if (t2.layers.some(l => l.name === 'Brand Logo')) break;
      }
    }
    placed.forEach((p, i) => {
      const useEmoji = !p.onFlank && E.emoji && E.emoji.length && ((seed + i * 3) % 5 < 2);   // two in five are iOS emoji, never beside a word
      const color = colors[(seed + i * 2) % colors.length], angle = ((seed * 7 + i * 13) % 31) - 15;
      if (useEmoji){
        t2.layers.push({ kind:'text', name:'Element ' + (i + 1), role:'deco', __element:true, text: E.emoji[(seed + i) % E.emoji.length],
          props:{ left: p.cx, top: p.cy, originX:'center', originY:'center', fontFamily: EMOJI_FONT, fontSize: Math.round(p.size * 0.86), fill:'#000000', angle } });
      } else {
        const icon = E.icons[(seed + i) % E.icons.length];
        t2.layers.push({ kind:'path', icon, name:'Element ' + (i + 1), role:'deco', __element:true,
          props:{ left: p.cx - p.size / 2, top: p.cy - p.size / 2, size: p.size, fill: color, opacity: 0.85, angle } });
      }
    });
    return placed.length;
  }
  /* FAMILY TREATMENTS. Space: NASA photography (or the drawn starfield)
     under a light tint of the ground, a glow on the headline where the face
     can take it, glass plates with an accent rim. Lined Paper: a drawn sheet,
     highlighter bands, sticky-note cards, tape on the pills, pen-coloured
     ink, a hand-set tilt on the headline. */
  const HIGHLIGHT = ['#fff59d','#ffd6e7','#c9f5c4','#cfe8ff','#ffe0b3','#e8d7ff'];
  const STICKY = ['#fff3a0','#ffd9e6','#d3f7d0','#d6ebff','#ffe4bf'];
  /* THE HOUSE STYLE, learned from the owner's own Canva work (2026-09-04).
     Their two live ads do not use plates behind the words at all: the photograph
     fills the card edge to edge and every line sits straight on it in heavy type
     with a black outline and a hard offset shadow. That is why their cards read
     full where ours read empty — the picture is the whole card, not a backdrop
     behind panels. Devices, in their order of weight:
       posterInk   heavy stroke + hard shadow on every line, plates removed
       ribbon      the kicker in an angled parallelogram, top left
       sealCheck   a filled tick disc with the seal words stacked beside it
       ticker      a repeating offer strip across the top and the foot
       ctaBox      a black box with an accent border carrying the number, big */
  function posterInk(t2, th, seed){
    const accent = th.accent, ink = '#ffffff', outline = 'rgba(8,8,10,0.92)';
    let headN = 0;
    t2.layers.forEach(l => {
      if (typeof l.text !== 'string' || !l.props || !l.text.trim()) return;
      const fs = l.props.fontSize || 0;
      if (l.role === 'headline'){
        /* line two of the sentence takes the accent, the rest stay white — the
           owner's own card is WE BUY in white over IPHONES in lime */
        l.props.fill = (headN++ === 1) ? accent : ink;
        delete l.props.grad;
        l.props.stroke = outline;
        l.props.strokeWidth = Math.max(5, Math.round(fs * 0.075));
        l.props.paintFirst = 'stroke';
        l.props.shadow = { color: 'rgba(6,6,8,0.75)', blur: 0, offsetX: Math.round(fs * 0.045), offsetY: Math.round(fs * 0.055) };
        l.__lock = true;
      } else if (l.role === 'sub' || l.role === 'info' || l.role === 'badges' || l.role === 'cta'){
        l.props.fill = ink; delete l.props.grad;
        l.props.stroke = outline; l.props.strokeWidth = Math.max(3, Math.round((fs || 28) * 0.06));
        l.props.paintFirst = 'stroke';
        l.props.shadow = { color: 'rgba(6,6,8,0.6)', blur: 0, offsetX: 2, offsetY: 3 };
      }
    });
    /* the plates go: on this style the photograph carries the card and a panel
       over it is what made ours look like a form rather than an ad */
    t2.layers = t2.layers.filter(l => {
      if (!(l.kind === 'rect' || l.kind === 'rrect') || !l.props) return true;
      if (l.__ctaPlate || l.__footerBar || l.__moneyPlate) return true;      // the number keeps its box
      const w0 = l.props.width || 0, h0 = l.props.height || 0;
      if (w0 > W * 0.92 && h0 > H * 0.92) return true;                        // the ground
      return false;
    });
    t2.__poster = true;
  }
  function ribbonFor(t2, th, seed){
    const kick = t2.layers.find(l => /^Kicker$/.test(l.name || '') && typeof l.text === 'string');
    if (!kick || !kick.props) return;
    const fs = Math.max(30, Math.min(46, kick.props.fontSize || 34));
    const text = String(kick.text || '').trim();
    const w2 = Math.min(W * 0.56, text.length * fs * 0.62 + 72), h2 = fs * 1.9;
    const left = 46, top = 92;
    kick.props.fontSize = fs; kick.props.left = left + w2 / 2; kick.props.top = top + h2 / 2;
    kick.props.originX = 'center'; kick.props.originY = 'center';
    kick.props.fill = th.onAccent || '#101014'; kick.props.angle = -6;
    kick.props.stroke = null; kick.props.strokeWidth = 0; kick.props.shadow = null;
    kick.__lock = true;
    const ix = t2.layers.indexOf(kick);
    t2.layers.splice(ix, 0, { kind:'rect', name:'Ribbon', solid:true, __lock:true, __ribbon:true,
      props:{ left, top, width: w2, height: h2, rx: 4, angle: -6, fill: th.accent,
              shadow:{ color:'rgba(6,6,8,0.5)', blur: 0, offsetX: 5, offsetY: 6 } } });
  }
  function tickerFor(t2, th, seed, line){
    /* the ticker repeats the offer and the number, the way the owner's own card
       runs a strip across the top and the foot */
    const num = (t2.layers.find(l => /^Phone Number$/.test(l.name || '')) || {}).text || INFO.area.split(' · ')[0];
    const txt = String(line || 'CASH TODAY').toUpperCase().replace(/\s+/g, ' ').slice(0, 30) + '  \u2022  ' + String(num).trim() + '  \u2022  ';
    const fs = 26, band = fs * 1.7;
    [0, H - band].forEach((y, i2) => {
      /* the strip only runs where nothing else does */
      if (t2.layers.some(l => typeof l.text === 'string' && l.text.trim() && l.props && Math.abs((l.props.top || 0) - (y + band / 2)) < band * 1.4)) return;
      t2.layers.push({ kind:'rect', name:'Ticker Band ' + (i2 + 1), solid:true, __lock:true, __ticker:true,
        props:{ left: 0, top: y, width: W, height: band, rx: 0, fill: th.accent, opacity: 0.96 } });
      t2.layers.push({ kind:'text', name:'Ticker ' + (i2 + 1), role:'deco', __lock:true, __keepDeco:true, __ticker:true,
        text: txt.repeat(4).slice(0, 96),
        props:{ left: -8, top: y + band / 2, originX:'left', originY:'center', fontFamily: th.faces.support,
                fontSize: fs, fill: th.onAccent || '#101014', fontWeight:'800', charSpacing: 40 } });
    });
  }
  function familyTreatment(t2, th, cat, seed){
    if (th.family === 'Space'){
      const pool = (WEBBG.space || []);
      const src = pool.length && seed % 4 !== 0 ? pool[(seed * 5 + 1) % pool.length] : 'space:stars';
      t2.bg = Object.assign({}, t2.bg || {}, { type:'image', src, scrimColor: th.c1, scrim: src === 'space:stars' ? 0.10 : 0.22, blur: 0 });
      t2.__spaceBg = true;
      t2.layers.forEach(l => {
        if (!l.props) return;
        if (l.role === 'headline' && typeof l.text === 'string' && !/Oswald|Big Shoulders|Saira|Barlow|Teko/i.test(l.props.fontFamily || ''))
          l.props.shadow = { color: th.accent, blur: 26, offsetX: 0, offsetY: 0 };
        if ((l.kind === 'rect' || l.kind === 'rrect') && !l.__moneyPlate && !l.__lock && (l.props.height || 0) > 60){
          l.props.stroke = th.accent; l.props.strokeWidth = 2; l.props.opacity = Math.min(l.props.opacity || 1, 0.92);
        }
      });
    }
    if (th.family === 'Lined Paper'){
      const sheet = ['paper:ruled','paper:legal','paper:grid','paper:dots','paper:ruled'][seed % 5];
      /* a second, fainter stroke offset under each highlighter so the ends
         overrun like a real marker */
      /* A MARKER OVERRUN IS A HAND SLIP AT THE ENDS OF A STROKE, not a second
         plate. Drawing a full-size copy behind the CTA card produced two stacked
         plates in two different colours — "you got issues". Two narrow end-caps
         only, in the stroke's own colour, and never on a plate that carries the
         phone number. */
      const addOverrun = () => {
        const extra = [];
        t2.layers.forEach((l, k) => {
          if (!l.__hilite || l.__ctaPlate) return;
          const p = l.props, h = p.height || 0, w = p.width || 0;
          if (w < 120 || h < 24) return;
          const cap = Math.min(26, w * 0.06);
          [-1, 1].forEach((side, si) => {
            const left = side < 0 ? (p.left || 0) - cap + 2 : (p.left || 0) + w - 2;
            extra.push([k, { kind:'rect', name:'Marker Overrun', solid:true, __lock:true, __overrunOf:k,
              props:{ left, top: (p.top || 0) + 4 + ((seed + si) % 3) * 2, width: cap, height: h - 8,
                      fill: p.fill, opacity: (p.opacity || 0.55) * 0.9, rx: 3 } }]);
          });
        });
        extra.reverse().forEach(([k, l]) => t2.layers.splice(k, 0, l));
      };
      t2.__addOverrun = addOverrun;
      t2.bg = { type:'image', src: sheet, scrimColor: th.c1, scrim: 0.001, blur: 0 };
      const pen = th.accent, inkDark = '#26231f';
      let hi = 0;
      t2.layers.forEach((l, k) => {
        if (!l.props) return;
        if (/Sheen|Vignette|Grain/i.test(l.name || '') || l.kind === 'vignette' || l.kind === 'grain'){ l.props.opacity = 0; return; }
        if (l.kind === 'rect' || l.kind === 'rrect'){
          const h0 = l.props.height || 0, w0 = l.props.width || 0;
          delete l.props.grad; l.props.stroke = null; l.props.strokeWidth = 0; delete l.props.skewX; delete l.props.ry;
          /* one highlighter and one sticky colour per card — three colours on
             three step cards was "confusing for the numbered parts" — and the
             small number squares take the pen colour */
          if (w0 < 130 && h0 < 130){
            l.props.fill = pen; l.props.opacity = 1; l.props.rx = 8; l.props.angle = 0; l.solid = true; l.__lock = true; l.__penBox = true;
          } else if (l.__ctaPlate){    // the plate under the number keeps its own shape and colour
            l.props.opacity = 1; l.solid = true; l.__lock = true;
          } else if (l.__moneyPlate || (h0 <= 210 && w0 >= 200)){    // a band or pill → a highlighter stroke: translucent, slightly off-square, uneven ends
            l.props.fill = HIGHLIGHT[seed % HIGHLIGHT.length]; l.props.opacity = 0.55; l.props.rx = Math.round(h0 * 0.18); l.props.angle = ((seed + k) % 3 - 1) * 0.8; l.solid = true; l.__lock = true; l.__hilite = true;
          } else {                                                    // a card or panel → sticky note
            l.props.fill = STICKY[(seed + 1) % STICKY.length]; l.props.opacity = 0.96; l.props.rx = 4; l.props.angle = ((seed + k) % 2 ? 1 : -1) * 1.2; l.solid = true; l.__lock = true;
            l.props.shadow = { color:'rgba(0,0,0,0.22)', blur: 22, offsetX: 4, offsetY: 10 };
          }
          return;
        }
        if (typeof l.text === 'string'){
          /* "try to make these fit within the lines": on a ruled sheet the
             single-line copy sits on a rule — baseline snapped to the 54px
             grid — and row type stays under 40px so it fits between rules */
          if (/ruled|legal/.test(sheet) && !String(l.text).includes('\n') && l.role !== 'badges' && l.kind === 'text'){
            const fs0 = l.role === 'headline' ? (l.props.fontSize || 60) : Math.min(l.props.fontSize || 30, 40); l.props.fontSize = fs0;
            const top0 = /ruled/.test(sheet) ? 150 : 130, gap = 54;
            const base = (l.props.top || 0) + (l.props.originY === 'center' ? fs0 * 0.35 : fs0 * 0.86);
            const snapped = top0 + Math.round((base - top0) / gap) * gap - 4;
            l.props.top = (l.props.originY === 'center') ? snapped - fs0 * 0.35 : snapped - fs0 * 0.86;
          }
          if (/^Step Num \d/.test(l.name || '')){ l.props.fill = '#ffffff'; l.__lock = true; }   // numerals on the pen squares
          else if (l.role === 'headline'){ l.props.fill = (k % 2 === 0) ? pen : inkDark; delete l.props.grad; l.__lock = true; l.props.angle = (l.props.angle || 0) + ((seed % 3) - 1) * 1.2; }
          else if (l.role === 'phone'){ l.props.fill = pen; delete l.props.grad; l.__lock = true; }
          else if (l.role === 'cta' || l.role === 'info' || l.role === 'sub' || l.role === 'badges' || l.role === 'website'){ l.props.fill = inkDark; delete l.props.grad; l.props.opacity = 1; }
          if (l.props.shadow) delete l.props.shadow;
          if (l.props.stroke) { l.props.stroke = null; l.props.strokeWidth = 0; }
        }
        if (l.kind === 'circle'){ l.props.fill = pen; l.__lock = true; }
      });
      if (t2.__addOverrun){ t2.__addOverrun(); delete t2.__addOverrun; }
    }
  }
  const REVIEW_PAGE = PLAN.length && PLAN.every(e => picks[e.i][0].layout === 'reviewProof');
  const REVIEW100 = REVIEW_PAGE && !!(new URLSearchParams(location.search).get('r100') || FACESYS.review100);

  const out = [];
  for (const e of PLAN){
    for (let attempt = 0; attempt < 2; attempt++){ const i = e.i + e.v * 5, j = e.j;
      /* a card that renders sparse (density under 12) is re-seeded once; the
         layout name salts the seed so single-layout runs do not all share the
         same subjects */
      const LAYSALT = [...picks[e.i][0].layout].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 9973, 7);
      /* ONE HASHED SEED per card. Linear sums of the two counters made two
         palettes eight apart land on the same template, face and product —
         "too similar". Every draw below takes a different slice of this. */
      const sd = ((e.i * 131 + e.j * 47 + e.v * 977 + LAYSALT * 13 + (attempt + (FACESYS.attempt || 0)) * 7919) * 2654435761 >>> 0) % 1000003;   // LAB_ATTEMPT=n re-seeds a re-render
      const list = picks[e.i];
      /* DUPLICATES. Owner, 2026-09-02: two Blue Ticket silver checklistHero
         cards, variants 10 and 12, identical to the pixel — the hashed seed
         is different but the category, the six-deep backdrop pool and the
         copy all rotate off it modulo small numbers, and they collided. The
         category now steps with the VARIANT number, so consecutive variants
         of one layout+palette walk the categories in order and can only
         meet again after every category has had a card. */
      const base = ((e.i * 131 + e.j * 47) * 2654435761 >>> 0) % 1000003;
      const listC = FACESYS.cats ? list.filter(t => FACESYS.cats.includes(t.cat)) : [];   // LAB_CATS=pokemon,sports restricts the walk
      /* the walk steps a fixed ring of categories (the pilot of 2026-09-03 gave
         cards nine of twenty-five because the donor templates skew that way) */
      const RING0 = ['phones','gold','cars','pokemon','coins','silver','sports','strips'];
      /* a locked look walks only the categories it was built for */
      const lookNow = e.look ? (LOOKS.find(L => (L.key || L.id) === e.look) || null) : null;
      const lookCats = lookNow && Array.isArray(lookNow.categories) ? lookNow.categories.filter(c => RING0.includes(c)) : null;
      const RING = lookCats && lookCats.length ? lookCats : RING0;
      const wantCat = RING[(lookCats && lookCats.length ? (e.k || 0) : (base + e.v)) % RING.length], src = listC.length ? listC : list;   // a look covers its own categories evenly
      const ofCat = src.filter(t => t.cat === wantCat);
      /* a layout with no donor for that category borrows one — but only its
         geometry: the lender's scenes go, or a Pokémon card wears an iPhone
         (owner, 2026-09-03: "pokemon buyer with iphone pic?") */
      const p = ofCat.length ? ofCat[(base + e.v) % ofCat.length] : Object.assign({}, src[(base + e.v) % src.length], { cat: wantCat, borrowed: true });
      const th0 = TH[DONORS[j]];
      /* the approved faces, rotated so the same palette does not always carry
         the same pairing */
      /* PALETTE FIT. "Pick some palettes that are popular for the category and
         lean on those — not absolute." A donor that reads wrong for the subject
         (pink on motorcycles, pastel on gold) gives way to one of the category's
         preferred palettes on that card; two cards in three keep the draw. */
      const PALFIT = {
        cars:    { avoid:/Rose|Orchid|Violet|Red Quote|Amber Offer|Mint Counter|Sky Market/, prefer:['du08','jw05','du07','cd06','jw01','nn01'] },
        trucks:  { avoid:/Rose|Orchid|Violet|Red Quote|Amber Offer|Mint Counter|Sky Market/, prefer:['du08','jw05','du07','cd06','jw01'] },
        bikes:   { avoid:/Rose|Orchid|Violet|Red Quote|Amber Offer|Mint|Sky|Teal|Pastel/, prefer:['du08','jw01','nn01','du01','jw10'] },
        vans:    { avoid:/Rose|Orchid|Violet|Red Quote/, prefer:['du08','jw05','cd06'] },
        gold:    { avoid:/Rose|Orchid|Violet|Sky|Mint Ticket|Blue Deal/, prefer:['pp02','gl02','jw07','du02','ck01'] },
        silver:  { avoid:/Rose|Orchid|Amber/, prefer:['jw05','ca07','du08','io03','ck03'] },
        coins:   { avoid:/Rose|Orchid|Red Quote/, prefer:['jw05','pp02','du08','jw07'] },
        phones:  { avoid:/Red Quote|Orchid/, prefer:['du07','jw05','cd06','io03','ca07'] },
        strips:  { avoid:/Red Quote|Orchid|Violet/, prefer:['pp04','ca07','cd04','jw07'] },
        pokemon: { avoid:/Paper|Pastel/, prefer:['cd06','cd04','cd10','io03','jw07'] },
        sports:  { avoid:/Rose|Orchid|Pastel/, prefer:['du08','jw05','cd06','du07'] },
      };
      let thFit = th0;
      { const fit = PALFIT[p.cat]; const bad = fit && fit.avoid.test(th0.name + ' ' + th0.family);
        const familyPal = th0.family === 'Space' || th0.family === 'Lined Paper';
        if (bad && !familyPal && sd % 3 !== 0){ const pref = fit.prefer.filter(id => TH[id]); if (pref.length) thFit = TH[pref[sd % pref.length]]; } }
      /* A LOCKED LOOK (LAB_LOOKS). The owner, 2026-09-03: "too many concepts at
         once… find cohesive themes and stick to the theme." When a card belongs
         to a look, the look owns the palette, the type pairing and the ground;
         only the named variations are allowed to move. */
      const look = e.look ? (LOOKS.find(L => (L.key || L.id) === e.look) || null) : null;
      if (look && look.palettes && look.palettes.length){
        const pick = look.palettes[(sd + e.v) % look.palettes.length];
        if (TH[pick]) thFit = TH[pick];
      }
      const th = Object.assign({}, thFit, { faces: look && look.faces ? Object.assign({}, look.faces) : pickFaces(p.cat, sd, thFit.family) });
      if (look) th.__look = look.key;
      try {
        const tpl = TEMPLATES.find(t => t.id === p.id);
        /* phones rotates across the device LINES, so Samsung and Pixel get
           their own ads instead of appearing on an iPhone one */
        /* iPhone only on the phones templates. Samsung and Pixel are real
           categories with their own assets, but they are 22 and 10 assets
           against 116 for iPhone, and iPhone is the business — spending a
           template slot on an Android is spending it on the wrong customer.
           They get their own runs when we want them, not a share of these. */
        /* THE INVARIANT, enforced rather than remembered: one subject key owns
           the copy AND the product pool. Every mismatch so far — a Pixel on an
           iPhone ad, Samsungs on an iPhone ad, Apple Watches on an iPhone ad,
           an iPhone backdrop under a Pixel headline — was some pool being
           chosen independently of the headline. The phones templates rotate
           across Apple LINES so the Watch and the iPad get their own ads
           instead of appearing on somebody else's. */
        const APPLE = ['iphone','iphone','iphone','ipad','ipad','macbook'];   // watch buying is "a super unpopular category" (owner, 2026-09-03)
        /* the cars templates rotate across the vehicle decks the same way */
        const VEHICLES = ['cars','cars','bikes','trucks','vans'];
        const SUB = (FACESYS.subcats && SUBCATS_PAGE[p.cat]) ? SUBCATS_PAGE[p.cat].filter(d => d.ready || d.cuts.some(pre => ALLCUTS.some(f => f.startsWith(pre)))) : null;
        const subDeck = SUB && SUB.length ? SUB[sd % SUB.length] : null;
        const deck = p.cat === 'phones'
          ? DEVICE_DECKS[APPLE[sd % APPLE.length]]
          : p.cat === 'cars' ? CATEGORY_COPY[VEHICLES[sd % VEHICLES.length]]
          : (subDeck ? Object.assign({}, CATEGORY_COPY[p.cat] || {}, { k: subDeck.k, h2: subDeck.h2, items: subDeck.items, cuts: subDeck.cuts, __spec: subDeck.spec, __sub: subDeck.key }) : (CATEGORY_COPY[p.cat] || null));
        const pool = deck
          ? ALLCUTS.filter(f => deck.cuts.some(pre => f.startsWith(pre)))
          : (HERO[p.cat] || (CUTS[p.cat] && CUTS[p.cat].length ? CUTS[p.cat] : CUTS.phones));
        /* THE FALLBACK IS THE CATEGORY'S OWN SHELF, never the phone shelf
           (owner, 2026-09-03: "pokemon buyer with iphone pic?"). A sub-deck
           whose only cutout the owner rejected — poke-elite-box — emptied the
           pool, and the old fallback handed it an iPhone. */
        const catPool = (CUTS[p.cat] || []).filter(f => !BLANK.test(f) && ALLCUTS.includes(f));
        const wide = ALLCUTS.filter(f => (CUTS[p.cat] || []).some(c => f.startsWith(String(c).split('-')[0])) && !BLANK.test(f));
        const ok = pool.filter(f => !BLANK.test(f));
        let use = ok.length ? ok : catPool.length ? catPool : wide.length ? wide : null;
        if (!use) continue;                                   // no honest product for this category: skip the frame
        /* A LOCKED THEME OWNS ITS ASSETS. Declaring mustShow / neverShow is not
           enough — the engine has to pick from them, or the theme's own audit
           rules fail on its own cards. Positive list first, negative list always. */
        if (look){
          const clean = r => /^[a-z0-9]/i.test(r) && !/\s/.test(r) && !/^(logo|ground|treat|assets):/.test(r);
          const must = (look.mustShow || []).filter(clean);
          const never = (look.neverShow || []).filter(clean);
          const allowed = f => !never.some(r => f.startsWith(r));
          const preferred = use.filter(f => allowed(f) && must.some(r => f.startsWith(r)));
          const fromMust = must.length ? ALLCUTS.filter(f => allowed(f) && must.some(r => f.startsWith(r))) : [];
          const cleaned = use.filter(allowed);
          /* THE SUBJECT WINS. A theme's asset rules narrow what the card may show;
             they never change WHAT IT IS. Letting mustShow reach outside the deck
             is how an iPad headline ended up over an iPhone (owner, 2026-09-03:
             "this is not an iPad in the background and I think you're aware"). */
          /* subjectOf only reads the deck and the category, so it can run before
             the template is themed */
          const subj0 = SUBJECTS[subjectOf({ layers: [] }, deck, p.cat)];
          const inSubject = f => !subj0 || (subj0.cut.test(f) && !subj0.never.test(f));
          const keepSubj = arr => { const k = arr.filter(inSubject); return k.length ? k : null; };
          if (!preferred.length && !fromMust.length && cleaned.length){ use = keepSubj(cleaned) || cleaned; }
          else
          /* a theme's rules are honoured or the card is not made: falling back to
             the unfiltered pool is how a theme ends up breaking its own audit */
          use = preferred.length ? (keepSubj(preferred) || keepSubj(cleaned) || preferred)
              : fromMust.length ? (keepSubj(fromMust) || keepSubj(cleaned) || fromMust)
              : cleaned.length ? (keepSubj(cleaned) || cleaned) : null;
          if (!use){ lookSkips.push((look.key || look.id) + ': every product its rules allow is unavailable for ' + p.cat); continue; }
        }
        const cutSrc = 'assets/cutouts/' + use[(sd * 7 + 3) % use.length] + '.webp';
        /* challenge mode on every third card: the deck's copy is replaced by
           the competitor framing before the swap runs, so the same length
           guards and fitting apply */
        const CH = CHALLENGE[p.cat];
        /* only a layout with a real opener + money word pair can carry WE BEAT /
           X'S / TRADE-IN VALUE. trustSeal's "TRUSTED LOCAL / POKÉMON / BUYER"
           has no opener, and the swap wrote the possessive into every slot. */
        const pairOK = tpl.layers.some(l => l.role === 'headline' && /^(SELL YOUR|CASH FOR|WE BUY)$/i.test(String(l.text || '').trim()))
                    && tpl.layers.some(l => l.role === 'headline' && /IPHONE|PHONE|GOLD|SILVER|COINS|CARS|STRIPS|POK|CARDS|WATCH|IPAD|MACBOOK/i.test(String(l.text || '')));
        const challenge = CH && pairOK && (sd % 3 === 0);
        let useDeck = deck;
        if (challenge){
          const seed = sd;
          const named = CH.names[seed % CH.names.length], generic = CH.generic[seed % CH.generic.length];
          const kick = CHALLENGE.lines.kicker[seed % CHALLENGE.lines.kicker.length];
          /* two of three cards name the competitor in the headline; the third
             takes the category line (THE PAWN SHOP, TRADE-IN OFFERS) */
          const named2 = CH.names[(seed + 1) % CH.names.length];
          /* the possessive needs a third line to land in; a layout with no
             items slot (bandKnockout) would read WE BEAT WORTHY'S and stop */
          const hasSlot = tpl.layers.some(l => /^Items|^Info Text|^Data Line/i.test(l.name || ''));
          const poss = seed % 3 === 1 ? null : named.length <= 12 ? named : named2.length <= 12 ? named2 : null;
          const who = poss || named;
          const sharp = /LOWBALLED|PENNIES/.test(kick);
          useDeck = Object.assign({}, deck || (DECKS_SNAPSHOT[p.cat] || {}), {
            /* "GOT A THE COIN SHOP QUOTE?" — an article before a name that
               already has one. The generic names carry THE; the pattern drops
               its own article for them. */
            k: (() => { const who = sharp ? generic : named; return /^THE /i.test(who) ? kick.replace('A {N}', '{N}').replace('{N}', who) : kick.replace('{N}', who); })(),
            h1: (() => { const h = CHALLENGE.lines.h1[seed % CHALLENGE.lines.h1.length]; return (h === 'WE MATCH' && !poss) ? 'WE BEAT' : h; })(),
            /* WE BEAT / YOUR CARRIER'S / TRADE-IN VALUE — possessive on line
               two, the thing being beaten on line three (the items slot). */
            h2: poss ? (CHALLENGE.lines.h1[seed % CHALLENGE.lines.h1.length] === 'WE MATCH' ? poss : poss + "'S") : (CHALLENGE.lines.h2[p.cat] || 'THE PAWN SHOP'),
            tail: !!poss && CHALLENGE.lines.h1[seed % CHALLENGE.lines.h1.length] !== 'WE MATCH',   // "we match Carvana" is the whole sentence
            tailText: (poss && CHALLENGE.lines.h1[seed % CHALLENGE.lines.h1.length] === 'WE MATCH') ? null : poss
              ? ((deck && deck.cuts && /^ipad|^qs-ipad/.test(deck.cuts[0])) ? 'iPAD TRADE-IN VALUE'
               : (deck && deck.cuts && /watch/.test(deck.cuts[0])) ? 'WATCH TRADE-IN VALUE'
               : (deck && deck.cuts && /mac/.test(deck.cuts[0])) ? 'MACBOOK TRADE-IN VALUE'
               : ({ phones:'iPHONE TRADE-IN VALUE', cars:'CAR TRADE-IN OFFER', trucks:'TRUCK TRADE-IN OFFER', bikes:'BIKE TRADE-IN OFFER', vans:'VAN TRADE-IN OFFER', gold:'GOLD CASH OFFER', silver:'SILVER CASH OFFER', coins:'COIN BUY PRICE',
                   pokemon:'POKÉMON BUYLIST PRICE', sports:'CARD BUYLIST PRICE', strips:'TEST STRIP OFFER' }[(deck && deck.bgcat) || p.cat] || 'OFFER'))   // a van deck names the van
              : null,
            items: (deck || DECKS_SNAPSHOT[p.cat] || {}).items,
            price: CHALLENGE.lines.price[seed % CHALLENGE.lines.price.length].replace('{N}', who),
            challengePromise: CHALLENGE.lines.promise[seed % CHALLENGE.lines.promise.length].replace('{N}', who),
          });
        }
        const t2 = retheme(tpl, th, cutSrc, useDeck, p.cat, sd);
        /* the star row is content, not an ornament: it must survive every probe
           so the passes that size its pill can actually see it */
        t2.layers.forEach(l => { if (/^Stars$/.test(l.name || '')) l.__keepDeco = true; });
        familyTreatment(t2, th, p.cat, sd);
        /* the owner's own house style: photograph edge to edge, outlined type
           straight on it, a ribbon for the kicker and a ticker across the ends */
        const houseStyle = look && look.style === 'poster';
        if (houseStyle){
          posterInk(t2, th, sd);
          if (sd % 2 === 0) ribbonFor(t2, th, sd);
          if (sd % 3 === 0) tickerFor(t2, th, sd, (useDeck && useDeck.k) || 'CASH TODAY');
        }
        const familyGround = th.family === 'Space' || th.family === 'Lined Paper';   // a drawn or family-owned ground: the photo passes step aside
        /* the abstract catalogue, easy-on-the-eye kinds first (approved list in FACESYS.grounds) */
        const GK = FACESYS.grounds && FACESYS.grounds.length ? FACESYS.grounds : ['mesh','blobs','duo','spotlight','aurora','waves','curves','bokeh','dotgrid','sweep','glow','split','topo','duneshade','frost'];
        const abstractKind = !familyGround && (FACESYS.forceAbs || sd % 12 === 7) ? GK[(FACESYS.forceAbs ? sd : Math.floor(sd / 5)) % GK.length] : null;   // 37% approval: the smallest slice, not the biggest
        if (abstractKind){
          const src = abstractGround(abstractKind, th, sd);
          t2.bg = { type:'image', src, scrimColor: th.c1, scrim: 0.001, blur: 0 }; t2.__absBg = true;
        }
        const cashGround = !familyGround && !abstractKind && sd % 11 === 5 && t2.layers.some(l => l.kind === 'cutout');   // 33% approval
        if (cashGround){
          const pool = (WEBBG.cash || []).concat(CASH_GROUNDS.filter(src => TPL_BG_ELS[src]));
          if (pool.length){ const dark = lumHex(th.c1) < 0.3 ? th.c1 : (th.c2 && lumHex(th.c2) < 0.3 ? th.c2 : th.ink);
            t2.bg = { type:'image', src: pool[(sd * 7 + 3) % pool.length], scrimColor: dark, scrim: 0.42, blur: 0 }; t2.__cashBg = true; }
        }
        /* DEVICE GROUNDS (owner, 2026-09-03): (a) 'cast' — the diagonal-split idea as a cast
           shadow: the product sits large in the ground and a soft window shadow falls across it;
           (b) 'tile' — the category's cutouts laid out flat like the iphones.LA device wall
           (BasicAppleGuy style): even gaps, no overlap, real drop shadows on a light ground. */
        const bgcat0 = (deck && deck.bgcat) || p.cat;
        const ownScenes = !p.borrowed && deck && deck.scenes;   // a borrowed layout has no scenes of its own
        const willPhoto = ownScenes || (WEBBG[bgcat0] && WEBBG[bgcat0].length && (sd % 2 === 1 || (deck && deck.bgcat)));
        /* a photo of a Rolls-Royce under WE BUY HYUNDAIS is the wrong car
           (owner, 2026-09-03: "neither of the cars are Hyundai's"), and we have
           no per-make photography — so a brand-led card wears its own ground. */
        const brandLed = !!(useDeck && useDeck.__brandWord);
        const plain = !familyGround && !abstractKind && !cashGround && (!willPhoto || brandLed);   // nothing behind the type, or a photo that would show the wrong make
        const lookGround = look && look.ground ? (typeof look.ground === 'string' ? look.ground : look.ground[(sd + e.v) % look.ground.length]) : null;
        const lookWantsPhoto = lookGround === 'photo' || lookGround === 'scene';
        const plainKind = lookGround && /^(cast|tile)$/.test(lookGround) ? lookGround : ['tile','cast','tile'][Math.floor(sd / 7) % 3];   // tile took 10/10, cast 22/44   // "shouldn't we at least have an image in the background?" — product-in-ground or device wall; abstract only if neither can run
        const dg = lookWantsPhoto || lookGround === 'slab' || lookGround === 'paper' || lookGround === 'deep' ? null : (lookGround && /^(cast|tile)$/.test(lookGround) ? lookGround : null) || FACESYS.dground || (plain || (!familyGround && !abstractKind && !cashGround && sd % 5 < 3) ? (plain ? plainKind : (sd % 3 === 1 ? 'cast' : 'tile')) : null);
        /* a wall that cannot be filled becomes a cast, not a stock photo: the
           fall-through to assets/bg-web was sending 68 cards to the ground that
           scored 28% while tile, which took 10 of 10, went unused */
        /* a locked theme gets exactly the ground it asked for: falling through
           from tile to cast is how a theme breaks its own ground rule */
        let dgKinds = !dg ? [] : lookGround ? [dg] : (dg === 'tile' ? ['tile', 'cast'] : dg === 'cast' ? ['cast', 'tile'] : [dg]);
        for (const dgTry of dgKinds){
        const dg2 = dgTry;
        if (t2.__dg) break;
        if (dg2 && (dg2 === 'cast' ? cutSrc && CUTOUT_ELS[cutSrc] : true)){
          const key = 'dg:' + dg2 + ':' + th.id + ':' + p.cat + ':' + (sd % 6);
          const shadowOver = (g, W, H, strength) => {   // one soft diagonal shadow + a fainter penumbra, blurred seam
            g.save(); g.filter = 'blur(26px)'; g.fillStyle = 'rgba(8,10,16,' + strength + ')';
            g.beginPath(); g.moveTo(W * 0.62, -40); g.lineTo(W + 60, -40); g.lineTo(W + 60, H + 60); g.lineTo(W * 0.22, H + 60); g.closePath(); g.fill();
            g.filter = 'blur(60px)'; g.fillStyle = 'rgba(8,10,16,' + (strength * 0.5) + ')';
            g.beginPath(); g.moveTo(W * 0.5, -80); g.lineTo(W + 80, -80); g.lineTo(W + 80, H + 80); g.lineTo(W * 0.05, H + 80); g.closePath(); g.fill();
            g.restore(); };
          if (dg2 === 'cast'){
            const img = CUTOUT_ELS[cutSrc];
            const pale = lumHex(th.c1) > 0.55;   // a near-white ground under a grey photo is the "too bland… what is this light theme" card
            drawGround(key, (g, W, H) => {
              g.fillStyle = th.c1; g.fillRect(0, 0, W, H);
              if (pale){ g.fillStyle = rgba(th.ink, 0.20); g.fillRect(0, 0, W, H);                      // body, from the palette's own ink
                const dg2 = g.createLinearGradient(0, 0, 0, H); dg2.addColorStop(0, rgba(th.accent, 0.18)); dg2.addColorStop(1, rgba(th.ink, 0.10)); g.fillStyle = dg2; g.fillRect(0, 0, W, H); }
              const lg = g.createLinearGradient(0, 0, W, H); lg.addColorStop(0, rgba('#ffffff', pale ? 0.12 : 0.10)); lg.addColorStop(0.55, rgba('#ffffff', 0)); g.fillStyle = lg; g.fillRect(0, 0, W, H);
              const k = Math.min((W * 0.62) / img.width, (H * 0.92) / img.height), w = img.width * k, h = img.height * k;
              g.save(); g.translate(W * 0.66, H * 0.52); g.rotate(-0.12); g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 40; g.shadowOffsetX = 24; g.shadowOffsetY = 30;
              g.globalAlpha = 0.92; g.drawImage(img, -w / 2, -h / 2, w, h); g.restore();
              shadowOver(g, W, H, pale ? 0.58 : 0.5);
            });
            const scrimC = pale ? (th.c2 && lumHex(th.c2) < 0.45 ? th.c2 : th.ink) : th.c1;
            t2.bg = { type:'image', src: key, scrimColor: scrimC, scrim: pale ? 0.30 : 0.22, blur: 0 }; t2.__castBg = true; t2.__dg = true;
          } else {
            /* ONE FAMILY ON THE WALL. Pulling every cutout that starts with
               "car-" put keys, an engine bay, a title document and a motorcycle
               behind a TRUCKS headline. The wall shows the deck's own things,
               and if the deck cannot fill it the card takes another ground. */
            const deckPre = (useDeck && useDeck.cuts) || [];
            const S0 = SUBJECTS[subjectOf(t2, useDeck, p.cat)];
            /* a lattice cell holds ONE object. The qs- Apple press renders are
               two-up composites (a back overlapping a front) — verified by opening
               them — so they are heroes, never wall stock. */
            const MULTI = /-(pair|trio|group|set|lineup|quad|six|nine|five|three|fan)\b|-pair-|-trio-|-group-|-stack-three|grid-|-row\b|^qs-(iphone|ipad|family-ipad)|^ip-group-|^qs-set-|^iphone-(pair|trio|fan|tall-stack|back-lean-stack)|^coin-single-large$/i;
            const fromDeck = ALLCUTS.filter(c => deckPre.some(pre => c.startsWith(String(pre).replace(/\.webp$/, ''))));
            /* one family, but the family's whole shelf: the deck's own four or five
               cutouts could not fill a lattice, so the wall kept falling through to
               the stock-photo ground that scored 28% */
            const fromSubject = S0 ? ALLCUTS.filter(c => S0.cut.test(c) && !S0.never.test(c)) : [];
            const cand = [...new Set(fromDeck.concat(fromSubject))].filter(c => !MULTI.test(c));
            let cand2 = cand;
            if (look){
              const clean = r => /^[a-z0-9]/i.test(r) && !/\s/.test(r) && !/^(logo|ground|treat|assets):/.test(r);
              const never = (look.neverShow || []).filter(clean), must = (look.mustShow || []).filter(clean);
              cand2 = cand.filter(c => !never.some(r => c.startsWith(r)));
              const pref = cand2.filter(c => must.some(r => c.startsWith(r)));
              if (pref.length >= 4) cand2 = pref;
              else if (pref.length && cand2.length < 4) cand2 = [...new Set(pref.concat(cand2))];
            }
            let pool = cand2.map(c => 'assets/cutouts/' + c + '.webp').filter(s => CUTOUT_ELS[s] && CUTOUT_ELS[s].width && CUTOUT_ELS[s].width >= 200);
            pool = [...new Set(pool)].slice(0, 12);
            if (pool.length >= 4){
              drawGround(key, (g, W, H) => {
                const light = lumHex(th.c1) > 0.55 ? th.c1 : (lumHex(th.c2 || th.c1) > 0.55 ? th.c2 : '#eceef2');
                g.fillStyle = light; g.fillRect(0, 0, W, H);
                /* THE LATTICE FITS THE SHELF. A pool of eight in a twelve-cell wall
                   made row three a copy of row one, so the grid is chosen from what
                   the shelf actually holds and no cell repeats. */
                const GRIDS = [[4,3,12],[3,3,9],[4,2,8],[3,2,6],[2,2,4]];
                const fit = GRIDS.find(gr => pool.length >= gr[2]) || GRIDS[GRIDS.length - 1];
                const COLS = fit[0], ROWS = fit[1], gap = COLS > 3 ? 28 : 40;
                const cw = (W - gap * (COLS + 1)) / COLS, chh = (H - gap * (ROWS + 1)) / ROWS;
                /* ONE SHELF, ONE SCALE. Fitting every unit to its own cell put a
                   phone and a ring at sizes that differ more than twofold and the
                   wall stopped reading as objects on a surface. Portraits share a
                   height, landscapes share a width, and both are capped by the cell. */
                const units = [];
                for (let q = 0; q < COLS * ROWS; q++) units.push(CUTOUT_ELS[pool[(q + sd) % pool.length]]);
                const tallH = Math.min(...units.filter(u => u.height >= u.width).map(u => (chh - 26)), chh - 26);
                const wideW = Math.min(...units.filter(u => u.width > u.height).map(u => (cw - 26)), cw - 26);
                let n = 0;
                for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){
                  const img = units[n]; n++;
                  const portrait = img.height >= img.width;
                  let k = portrait ? (tallH * 0.94) / img.height : (wideW * 0.94) / img.width;
                  k = Math.min(k, (cw - 22) / img.width, (chh - 22) / img.height);
                  const w = img.width * k, h = img.height * k;
                  const x = gap + c * (cw + gap) + (cw - w) / 2, y = gap + r * (chh + gap) + (chh - h) / 2;
                  g.save(); g.shadowColor = 'rgba(0,0,0,0.28)'; g.shadowBlur = 26; g.shadowOffsetX = 10; g.shadowOffsetY = 16; g.drawImage(img, x, y, w, h); g.restore();
                }
              });
              const dark = lumHex(th.c1) < 0.3 ? th.c1 : (th.c2 && lumHex(th.c2) < 0.35 ? th.c2 : th.ink);
              t2.bg = { type:'image', src: key, scrimColor: dark, scrim: lumHex(dark) > 0.4 ? 0.72 : 0.6, blur: 0 }; t2.__tileBg = true; t2.__dg = true;   // a busy ground takes the dark tone, harder when that tone is pale
            }
          }
        }
        }
        /* PANELS GO SOLID OVER A BUSY GROUND. A device wall or a cast product
           behind a translucent stat tile leaves "200+ LOCAL REVIEWS" as grey on
           grey. Over a drawn ground the tiles take a real fill from the palette
           so their small copy keeps its contrast. */
        if (t2.__tileBg || t2.__castBg){
          const deep = lumHex(th.c1) < 0.42 ? th.c1 : (th.c2 && lumHex(th.c2) < 0.42 ? th.c2 : th.ink);
          const onDeep = lumHex(deep) < 0.5 ? '#ffffff' : th.ink;
          t2.layers.forEach(l => {
            if (!(l.kind === 'rect' || l.kind === 'rrect') || !l.props || l.__moneyPlate || l.__lock) return;
            const w0 = l.props.width || 0, h0 = l.props.height || 0;
            if (w0 < 150 || h0 < 60 || (w0 > W * 0.92 && h0 > H * 0.92)) return;
            l.props.fill = rgba(deep, 0.9); l.props.opacity = 1; l.solid = true; delete l.props.grad; l.__panelSolid = true;
          });
          t2.layers.forEach(l => {
            if (typeof l.text !== 'string' || !l.props || l.__lock || l.role === 'headline' || l.role === 'phone') return;
            const inPanel = t2.layers.some(r => r.__panelSolid && r.props &&
              (l.props.left || 0) >= (r.props.left || 0) - 6 && (l.props.left || 0) <= (r.props.left || 0) + (r.props.width || 0) + 6 &&
              (l.props.top || 0) >= (r.props.top || 0) - 6 && (l.props.top || 0) <= (r.props.top || 0) + (r.props.height || 0) + 6);
            if (inPanel){ l.props.fill = onDeep; l.props.opacity = 1; delete l.props.grad; }
          });
        }
        /* COPY OVER A PHOTOGRAPH. A line with no plate behind it takes the tone
           that reads against the scrim, plus a soft carry shadow — the items
           line and the CTA sub-line had been printing dark on a dark photo. */
        if (t2.bg && t2.bg.type === 'image'){
          const scrimDark = lumHex(t2.bg.scrimColor || th.c1) < 0.5;
          const overCol = scrimDark ? '#ffffff' : (lumHex(th.ink) < 0.5 ? th.ink : '#14161c');
          const plates = t2.layers.filter(l => (l.kind === 'rect' || l.kind === 'rrect') && l.props && (l.props.opacity === undefined || l.props.opacity > 0.55));
          t2.layers.forEach(l => {
            if (typeof l.text !== 'string' || !l.props || l.__lock || l.role === 'headline' || l.role === 'phone' || l.role === 'deco') return;
            const x = l.props.left || 0, y = l.props.top || 0;
            const onPlate = plates.some(r => x >= (r.props.left || 0) - 8 && x <= (r.props.left || 0) + (r.props.width || 0) + 8 &&
                                             y >= (r.props.top || 0) - 8 && y <= (r.props.top || 0) + (r.props.height || 0) + 8);
            if (onPlate) return;
            l.props.fill = overCol; l.props.opacity = 1; delete l.props.grad;
            l.props.shadow = { color: scrimDark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)', blur: 10, offsetX: 0, offsetY: 1 };
          });
        }
        /* 'deep' — the after-hours ground: the palette's own darkest tone with one
           warm pool of light behind the headline. No photograph, no lattice. */
        if (lookGround === 'deep' && !t2.__dg){
          const key = 'deep:' + th.id + ':' + (sd % 4);
          drawGround(key, (g, W2, H2) => {
            const base = lumHex(th.c1) < 0.34 ? th.c1 : (th.c2 && lumHex(th.c2) < 0.34 ? th.c2 : '#0e1118');
            g.fillStyle = base; g.fillRect(0, 0, W2, H2);
            const cx = W2 * (0.34 + (sd % 3) * 0.16), cy = H2 * 0.34;
            const gr = g.createRadialGradient(cx, cy, 0, cx, cy, W2 * 0.72);
            gr.addColorStop(0, rgba(th.accent, 0.34)); gr.addColorStop(0.55, rgba(th.accent, 0.10)); gr.addColorStop(1, rgba(base, 0));
            g.fillStyle = gr; g.fillRect(0, 0, W2, H2);
            const vg = g.createRadialGradient(W2 / 2, H2 / 2, W2 * 0.28, W2 / 2, H2 / 2, W2 * 0.78);
            vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
            g.fillStyle = vg; g.fillRect(0, 0, W2, H2);
          });
          t2.bg = { type:'image', src: key, scrimColor: th.c1, scrim: 0.001, blur: 0 }; t2.__deepBg = true; t2.__dg = true;
        }
        if (look && lookGround && !t2.__dg && /^(tile|cast|deep)$/.test(lookGround)){
          lookSkips.push((look.key || look.id) + ': ' + lookGround + ' ground could not be built for ' + p.cat);
          continue;
        }
        if (plain && !t2.__dg){   // cast needed a hero, tile needed four cutouts: fall back to an approved abstract ground
          const kind = GK[Math.floor(sd / 3) % GK.length], src = abstractGround(kind, th, sd);
          t2.bg = { type:'image', src, scrimColor: th.c1, scrim: 0.001, blur: 0 }; t2.__absBg = true; t2.__dg = true;
        }
        /* CURVED HEADLINES ARC UP. Owner, 2026-09-02, on a row of gradientWave
           cards bending down: "down is okay but arc up is better, use both".
           The layout ships a frown (curve -22); two cards in three take the
           smile, the third keeps the frown. */
        t2.layers.forEach(l => { if (l.curve && l.curve < 0 && sd % 3 !== 2) l.curve = -l.curve; });
        if (p.layout === 'reviewProof'){
          if (REVIEW100) reviewFormat(t2, reviewSpec(e.k), p.cat, sd, th);
          else reviewVariant(t2, REVIEW_PAGE ? (e.k % 5) + 1 : [0, 3, 4, 0, 3, 4][sd % 6], p.cat, sd, th);   // regular sets: only the two winners
        }
        /* A card with no product has only the photograph to say what it is
           about, and a bokeh macro says nothing — "no idea what it's trying to
           convey". So when the layout carries no cutout, take the category's
           highest-DETAIL backdrop, the one with a recognisable object in it. */
        if (!familyGround && !cashGround && !abstractKind && !t2.__dg && !tpl.layers.some(l => l.kind === 'cutout') && !(deck && deck.scenes)){
          const legible = BGLUM.filter(b => b.cat === p.cat && b.detail !== undefined)
            .sort((a,b) => b.detail - a.detail)[j % 3];
          if (legible) t2.bg = Object.assign({}, t2.bg, { src: legible.src });
        }
        /* NON-APPLE CATEGORIES take a real photograph of their subject from
           the web pool every other card — the library's own backdrops were
           "the same thing over and over". Same tint rule as the scenes. */
        const bgcat = (deck && deck.bgcat) || p.cat;
        if (!familyGround && !cashGround && !abstractKind && !t2.__dg && !brandLed && !ownScenes && WEBBG[bgcat] && WEBBG[bgcat].length && (sd % 2 === 1 || (deck && deck.bgcat))){
          const pool = WEBBG[bgcat], src = pool[(sd * 5 + 1) % pool.length];
          const row = BGLUM.find(b => b.src === src), lum = row ? row.lum : 0.3, tl = lumHex(th.c1), gap = Math.abs(lum - tl);
          t2.bg = Object.assign({}, t2.bg, { type:'image', src });
          /* a BUSY photograph (a coin macro measures 40+ on the detail scale;
             a studio scene 6) swallows rows of small type under a light tint
             — "not legible". Past 14 it takes the ground colour at 62%. */
          const busy = row && row.detail > 14;
          if (busy){ t2.bg.scrimColor = th.c1; t2.bg.scrim = lumHex(th.c1) < 0.25 ? 0.44 : 0.62; }
          else if (lum > 0.5){ const dark = lumHex(th.c1) < 0.3 ? th.c1 : (th.c2 && lumHex(th.c2) < 0.3 ? th.c2 : th.ink); t2.bg.scrimColor = dark; t2.bg.scrim = 0.5; }
          else if (sd % 4 === 1){ t2.bg.scrimColor = gap < 0.15 ? th.c2 : th.c1; t2.bg.scrim = Math.max(0.42, Math.min(0.68, 0.40 + gap)); }
          else { t2.bg.scrimColor = th.accent; t2.bg.scrim = lumHex(th.c1) > 0.22 ? 0.24 : 0.30; }
        }
        if (!familyGround && !cashGround && !abstractKind && !t2.__dg && ownScenes && deck.scenes.length){
          /* Pick the scene that CONTRASTS with the theme ground, not the one
             nearest it. Nearest-luminance put a near-white Paper theme on a
             near-white Apple flat lay under a white scrim, and the photograph
             disappeared completely — "dope, but there's no background".
             A backdrop has to differ from the wash to survive it. */
          const tl = lumHex(th.c1);
          /* Candidates are the Apple scenes PLUS the category's own backdrops.
             The studio flat lays are all bright, so a near-white Paper theme had
             nothing to contrast with and rendered as a blank page whichever one
             it picked. Widening the pool lets a pale theme reach for a shot with
             real depth, which is what makes the photograph visible under a
             heavy white scrim. */
          /* The deck's own scenes and NOTHING else. Widening this to the
             category backdrops fixed a blank Paper card and put iPhones behind
             an iPad headline. Subject coherence beats contrast; if the only
             iPad scenes are light, the tint below carries the theme. */
          const webExtra = (deck.bgcat && WEBBG[deck.bgcat]) || (deck.cuts && /^iphone/.test(deck.cuts[0]) && WEBBG.phones) || (deck.cuts && /^mac/.test(deck.cuts[0]) && WEBBG.macbook) || [];
          const cand = deck.scenes.map(n => 'assets/scenes/' + n + '.jpg').concat(webExtra).map(src => {
            const row = BGLUM.find(b => b.src === src);
            return { src, lum: row ? row.lum : 0.3 };
          });
          /* Aim for a gap of about 0.22 from the theme ground — enough that the
             picture reads through the wash, not so much that it has to be
             crushed. Maximising the gap picked the darkest shot for a mid-tone
             theme and then scrimmed it, which is the murk. */
          const TARGET = 0.22;
          cand.sort((a,b) => Math.abs(Math.abs(a.lum - tl) - TARGET) - Math.abs(Math.abs(b.lum - tl) - TARGET));
          t2.bg = Object.assign({}, t2.bg, { type:'image', src: cand[0].src });
          // one tone: more of it where the photo is far from the theme, less
          // where it already sits near it, so texture survives either way
          const gap = Math.abs(cand[0].lum - tl);
          /* Two washes, alternated. The pale one (the theme's own ground) is
             clean but the owner is right that it can wash out; the other tints
             the photo with the ACCENT at a lower alpha, which puts colour back
             and still reads through. Sometimes the washed-out effect is nice —
             their words — so neither is the only answer. */
          if (cand[0].lum > 0.5){ const dark = lumHex(th.c1) < 0.3 ? th.c1 : (th.c2 && lumHex(th.c2) < 0.3 ? th.c2 : th.ink); t2.bg.scrimColor = dark; t2.bg.scrim = 0.5; }
          else if (sd % 2 === 0){
            t2.bg.scrimColor = gap < 0.15 ? th.c2 : th.c1;
            t2.bg.scrim = Math.max(0.42, Math.min(0.68, 0.40 + gap));
          } else {
            t2.bg.scrimColor = th.accent;
            t2.bg.scrim = lumHex(th.c1) > 0.22 ? 0.24 : 0.30;   // 0.42 turned a wheel into orange fog
          }
        }

        /* one card in three keeps the photograph's colour under a blur and a
           neutral scrim — see `natural` in paint(). A busy photograph gets
           more blur and more scrim, so the copy stays the loudest thing. */
        if (t2.bg && t2.bg.type === 'image' && sd % 3 === 1 && !t2.__dg){
          const light = lumHex(th.c1) > 0.22;
          const row = BGLUM.find(b => b.src === t2.bg.src), busy = row && row.detail > 14;
          t2.bg = Object.assign({}, t2.bg, { treat:'natural', blur: busy ? 22 : (sd % 2 ? 9 : 15),
            scrimColor: light ? '#ffffff' : '#000000', scrim: busy ? (light ? 0.52 : 0.46) : (light ? 0.40 : 0.34) });
        }
        /* RAW: one card in four keeps the photograph exactly as shot — no tone,
           no blur — under only a light neutral scrim, so the set is not all
           tinted. Owner, 2026-09-02: "the colors are too predictable ... some
           with regular background no filter". A busy photograph still gets the
           blurred `natural` treatment above instead, because raw detail under
           small type is the one thing this cannot afford. LAB_RAW=off disables. */
        if (t2.bg && t2.bg.type === 'image' && t2.bg.treat !== 'natural' && sd % 4 === 2 && INFO.raw !== 'off'){
          const light = lumHex(th.c1) > 0.22;
          const row = BGLUM.find(b => b.src === t2.bg.src), busy = row && row.detail > 14;
          if (!busy && !t2.__dg) t2.bg = Object.assign({}, t2.bg, { treat:'raw', blur: 0,
            scrimColor: light ? '#ffffff' : '#000000', scrim: light ? 0.30 : 0.36 });
        }
        signature(t2, p.cat, i * 7 + j, th);
        /* COLOUR GROUND. A card without a photograph — the assortments and
           ghost walls on a plain ground — read as "bland, lack colours in the
           background". The advertising references are the standard: a wash
           of the palette behind everything. */
        if (!familyGround && !(t2.bg && t2.bg.type === 'image' && t2.bg.src)){
          t2.layers.unshift({ kind:'rect', name:'Colour Ground', role:'ground', solid:true, __lock:true,
            props:{ left: 0, top: 0, width: W, height: H, fill: th.accent, opacity: 0.22, grad: { c1: th.accent, c2: th.support, a: 35 + (sd % 4) * 30 } } });
          t2.layers.splice(1, 0, { kind:'rect', name:'Colour Band', role:'ground', solid:true, __lock:true,
            props:{ left: -120, top: H * 0.55 + (sd % 3) * 60, width: W + 240, height: 220, fill: th.support, opacity: 0.28, angle: -8 + (sd % 3) * 8 } });
        }
        /* how much information this composition can take is decided by the
           frame, not by taste: fill the empty bands, then check the number. */
        const probe = paint(t2, false);
        const bands = freeBands(probe.refs);
        const boxes0 = probe.refs.filter(Boolean).map(o => o.getBoundingRect(true, true));
        probe.sc.dispose();
        /* PANEL FOOT. A lower panel with 70px of nothing under its last line
           reads as unfinished; the cities line fills it. The no-repeat pass
           swaps it for another fact if the card already lists the cities. */
        { const probeF = paint(t2, false);
          const panels = t2.layers.map((l, k) => (l.kind === 'rect' || l.kind === 'rrect') && probeF.refs[k] && (l.props.width || 0) > W * 0.6 && (l.props.height || 0) > 260 ? { l, b: probeF.refs[k].getBoundingRect(true, true) } : null).filter(Boolean);
          const texts = t2.layers.map((l, k) => typeof l.text === 'string' && probeF.refs[k] ? probeF.refs[k].getBoundingRect(true, true) : null).filter(Boolean);
          probeF.sc.dispose();
          panels.forEach(({ b }) => {
            const inside = texts.filter(t => t.top >= b.top - 4 && t.top + t.height <= b.top + b.height + 4 && t.left >= b.left - 4);
            if (!inside.length) return;
            const lowest = Math.max(...inside.map(t => t.top + t.height));
            if (b.top + b.height - lowest < 70) return;
            const fy = b.top + b.height - 30, fw = INFO.area.length * 22 * 0.62, foot = { left: W / 2 - fw / 2, top: fy - 16, width: fw, height: 32 };
            if (texts.some(t => !(foot.left + foot.width <= t.left || t.left + t.width <= foot.left || foot.top + foot.height <= t.top || t.top + t.height <= foot.top))) return;
            t2.layers.push({ kind:'text', name:'Panel Foot', role:'info', text: INFO.area,
              props:{ left: W / 2, top: b.top + b.height - 30, originX:'center', originY:'center', fontFamily: th.faces.support,
                      fontSize: 22, fill:'#ffffff', fontWeight:'700', charSpacing: 60 } });
          }); }
        /* the same sentence twice: a layout with both an Items line and an
           Info Text line got deck.items in each. The second becomes a
           different fact. */
        { const seen = new Set();
          t2.layers.forEach(l => {
            if (typeof l.text !== 'string') return;
            const k = l.text.trim().toUpperCase();
            if (k.length < 12) return;
            /* a shorter cut of the same list counts as the same sentence */
            if ([...seen].some(x => x.startsWith(k) || k.startsWith(x))) l.text = [INFO.pay, INFO.hours, INFO.area][sd % 3];
            else seen.add(k);
          }); }
        enrich(t2, th, deck || { items: (DECKS_SNAPSHOT[p.cat] || {}).items || '' }, bands, 4, sd, boxes0);

        /* Only add a product where one genuinely fits. Forcing one in with a
           fallback position put a phone straight through the headline and the
           number: these are hand-built compositions, and a layout that was not
           designed around a cutout does not have a hole for one. Require a real
           empty band, and check the placement against every existing layer
           before committing to it. */
        /* the layout's own product is not exempt: stepsFlow's slab stack sat
           across the step rows, the car "too small and hiding". A cutout that
           overlaps any text is taken out and re-placed by the same search. */
        { const probeX = paint(t2, false);
          const tboxes = probeX.refs.map((o, k) => o && typeof t2.layers[k].text === 'string' && t2.layers[k].role !== 'deco' ? o.getBoundingRect(true, true) : null).filter(Boolean);
          t2.layers.forEach((l, k) => {
            if (l.kind !== 'cutout' || !probeX.refs[k]) return;
            const b = probeX.refs[k].getBoundingRect(true, true);
            const hit = tboxes.some(t => { const ix = Math.max(0, Math.min(b.left + b.width, t.left + t.width) - Math.max(b.left, t.left)), iy = Math.max(0, Math.min(b.top + b.height, t.top + t.height) - Math.max(b.top, t.top)); return ix * iy > 0.1 * t.width * t.height; });
            if (hit) l.__evict = true;
          });
          t2.layers.forEach(l => { if (l.kind === 'cutout' && l.__yielded && !l.__wall) l.__evict = true; });   // dropped by the yields rule on the probe: gone for good
          probeX.sc.dispose();
          t2.layers = t2.layers.filter(l => !l.__evict); }
        if (!t2.layers.some(l => l.kind === 'cutout')){
          /* PLACEMENT SEARCH. One candidate spot (right column, 260px free)
             existed on almost no layout, so most iPhone cards shipped with no
             product at all — on the one category where the product is the
             point. Try several positions at several sizes, largest first, and
             take the first that clears every layer on the frame. If nothing
             clears, the layout genuinely has no room and gets none. */
          const probe2 = paint(t2, false);
          /* the vignette and the grain cover the whole frame, and counting
             them as obstacles meant nothing ever cleared: most cards shipped
             with no product for that reason alone */
          const boxes = probe2.refs.map((o, k) => o && !/vignette|grain/.test(t2.layers[k].kind) ? o.getBoundingRect(true, true) : null)
            .filter(b => b && !(b.width > W * 0.85 && b.height > H * 0.85));
          probe2.sc.dispose();
          const clear = r => !boxes.some(b => !(r.left + r.width <= b.left || b.left + b.width <= r.left ||
                                                 r.top + r.height <= b.top || b.top + b.height <= r.top));
          const spots = [
            w => ({ left: W-60-w, top: 40 }),     w => ({ left: 60, top: 40 }),          w => ({ left: W-70-w, top: 90 }),     w => ({ left: W-70-w, top: 150 }),
            w => ({ left: W/2 - w/2, top: 120 }), w => ({ left: W/2 - w/2, top: 300 }),
            w => ({ left: W-70-w, top: 300 }),    w => ({ left: W-70-w, top: 420 }),
            w => ({ left: W-70-w, top: 540 }),    w => ({ left: 70, top: 420 }),
          ];
          let placed = null;
          /* THE CROWN SPOT (arcCrown): the bowl under the arched opener and
             above the money word is the natural place for a round product —
             "add a silver dollar between the arc text". The arc's own box
             covers the bowl, so it is not an obstacle here. */
          if (/arcCrown/.test(tpl.id || '')){
            const arcIx = t2.layers.findIndex(l => l.role === 'headline' && /Arc|Wave|Curve/i.test(l.name || '')), moneyIx = t2.layers.findIndex(l => l.role === 'headline' && (l.props.fontSize || 0) >= 100 && !/Arc|Wave|Curve/i.test(l.name || ''));
            const ao = arcIx >= 0 && probe2.refs[arcIx], mo = moneyIx >= 0 && probe2.refs[moneyIx];
            if (FACESYS.placeDebug) (t2.__placeLog = t2.__placeLog || []).push('crown-enter arcIx=' + arcIx + ' moneyIx=' + moneyIx + ' ao=' + !!ao + ' mo=' + !!mo + ' heads=' + t2.layers.filter(l => l.role === 'headline').map(l => (l.name || '?') + ':' + (l.props && l.props.fontSize)).join(','));
            if (ao && mo){
              const ab = ao.getBoundingRect(true, true), mb = mo.getBoundingRect(true, true);
              const elC = CUTOUT_ELS[cutSrc], aspC = elC && elC.width ? elC.height / elC.width : 1.05;
              const arcFs = (t2.layers[arcIx].props && t2.layers[arcIx].props.fontSize) || 80;
              const top = ab.top + arcFs * 1.15 + 6;             // below the letters at the crown of the arc, not just inside its box
              let room = mb.top - 12 - top;
              /* open the bowl: the money word may drop toward the next line
                 below it so a 220px product fits under the arch */
              const below = probe2.refs.map((o, q) => o && q !== moneyIx && q !== arcIx && typeof t2.layers[q].text === 'string' && t2.layers[q].role !== 'badges' ? o.getBoundingRect(true, true) : null).filter(b => b && b.top > mb.top + mb.height - 4);
              const nextTop = below.length ? Math.min(...below.map(b => b.top)) : H - 60;
              const want = 220 * Math.max(aspC, 0.6), slack = nextTop - 20 - (mb.top + mb.height);
              if (room < want && slack > 0){ const d = Math.min(want - room, slack); t2.layers[moneyIx].props.top = (t2.layers[moneyIx].props.top || 0) + d; room += d; }
              const w = Math.min(260, Math.floor((room - 20) / Math.max(aspC, 0.6)));   // the product plus a margin fits INSIDE the room
              if (FACESYS.placeDebug) (t2.__placeLog = t2.__placeLog || []).push('crown: arc=' + [ab.left,ab.top,ab.width,ab.height].map(Math.round) + ' money=' + [mb.left,mb.top,mb.width,mb.height].map(Math.round) + ' room=' + Math.round(room) + ' w=' + w + ' next=' + Math.round(nextTop));
              if (w >= 140){
                const others = boxes.filter(b => !(Math.abs(b.left - ab.left) < 1 && Math.abs(b.top - ab.top) < 1) && !(Math.abs(b.left - mb.left) < 1 && Math.abs(b.top - mb.top) < 1));   // the arc and the (moved) money word are not obstacles
                const box = { left: W / 2 - w / 2 - 4, top: top + 4, width: w + 8, height: w * aspC + 8 };
                const ok = !others.some(b => !(box.left + box.width <= b.left || b.left + b.width <= box.left || box.top + box.height <= b.top || b.top + b.height <= box.top));
                if (ok) placed = { w, left: W / 2 + w / 2, top, crown: true };
              }
            }
          }
          /* the REAL proportions of the asset, not a square guess: a coin on
             its edge is three times taller than it is wide, "cleared" a
             square spot, and was then re-homed to the centre of the card over
             every tile and the phone number */
          const elA = CUTOUT_ELS[cutSrc], aspectA = elA && elA.width ? elA.height / elA.width : 1.05;
          /* a smaller product beats none: a wide headline over full-width rows
             leaves only the top-right corner, and 260px fits there */
          const sizes = th.family === 'Space' || t2.__absBg ? [520, 460, 420, 380, 340, 300, 260, 220, 190] : [480, 440, 400, 360, 320, 280, 240, 200, 180];   // bigger first: "the imagery has to sell the point"
          { /* the badge column is never an obstacle: a product may sit under it */
            const badgeBoxes = probe2.refs.map((o, q) => o && t2.layers[q].role === 'badges' ? o.getBoundingRect(true, true) : null).filter(Boolean);
            for (let q = boxes.length - 1; q >= 0; q--) if (badgeBoxes.some(b => Math.abs(b.left - boxes[q].left) < 1 && Math.abs(b.top - boxes[q].top) < 1)) boxes.splice(q, 1); }
          if (FACESYS.placeDebug){ (t2.__placeLog = t2.__placeLog || []).push('boxes: ' + boxes.map(b => [b.left, b.top, b.width, b.height].map(Math.round).join(',') + (t2.layers[probe2.refs.findIndex(o => o && o.getBoundingRect(true, true).left === b.left && o.getBoundingRect(true, true).top === b.top)] || {}).name).join(' | ')); }
          if (!placed) outer: for (const w of sizes){
            for (const sp of spots){
              const pos = sp(w), box = { left: pos.left - 10, top: pos.top - 10, width: w + 20, height: w * aspectA + 20 };
              if (box.top + box.height > H - 60) continue;
              if (clear(box)){ placed = { w, left: pos.left + w, top: pos.top }; break outer; }
            }
          }
          /* THE GOODS ARE ALWAYS ON THE CARD. Owner, 2026-09-03: "many of these
             images still lack assets… otherwise people don't know what you're
             buying." When the ground is a drawn sheet or a colour — paper, deep,
             abstract — the card has no other way to say what it buys, so the
             search drops to small sizes and scans a fine grid for any clear
             rectangle rather than giving up. */
          if (!placed && !t2.__tileBg && !t2.__castBg && !t2.__slab && !(t2.bg && /^assets\//.test(String(t2.bg.src || '')))){
            /* only the WORDS are obstacles here. A panel or a highlighter band is
               something the product may lie on; a sentence is not. */
            const wordBoxes = probe2.refs.map((o, q) => {
              const l = t2.layers[q];
              return o && l && typeof l.text === 'string' && l.text.trim() && l.role !== 'badges' ? o.getBoundingRect(true, true) : null;
            }).filter(Boolean);
            const clearOfWords = r2 => !wordBoxes.some(b2 => !(r2.left + r2.width <= b2.left || b2.left + b2.width <= r2.left || r2.top + r2.height <= b2.top || b2.top + b2.height <= r2.top));
            outer2: for (const w of [300, 260, 220, 190, 165, 145]){
              const h2 = w * aspectA;
              if (h2 > H * 0.42) continue;
              for (let y = 40; y <= H - h2 - 40; y += 26){
                for (let x = 30; x <= W - w - 30; x += 26){
                  const box = { left: x - 8, top: y - 8, width: w + 16, height: h2 + 16 };
                  if (clearOfWords(box)){ placed = { w, left: x + w, top: y, __rescue: true }; break outer2; }
                }
              }
            }
          }
          if (FACESYS.placeDebug) t2.__placeResult = (placed ? 'ok w=' + placed.w : 'none') + ' :: ' + (t2.__placeLog || []).join(' ');
          /* "with the sharp edge, we can align it left against the left side":
             a cutout that lands within 90px of an edge is snapped flush to it,
             so a flat-sided van reads as anchored, not floating. */
          if (placed && !placed.crown){
            const right = placed.left, left = placed.left - placed.w;
            if (left > 0 && left < 90) placed.left = placed.w;
            else if (right < W && W - right < 90) placed.left = W;
          }
          if (placed) t2.layers.push({ kind:'cutout', name:'Hero Product', role:'photo', __crown: !!placed.crown,
            props:{ src: cutSrc, left: placed.left, top: placed.top, originX:'right', w: placed.w,
                    shadow: th.family === 'Space' ? { color: th.accent, blur: 60, offsetX: 0, offsetY: 0 } : { color:'rgba(0,0,0,0.38)', blur:40, offsetX:0, offsetY:20 } } });
        }

        /* ASSORTMENTS. Owner, 2026-09-02: "currently these only contain
           about 1-2 images of assets, we need more to catch eyes. Fill
           background, fill empty space up more. Make relevant assortments of
           images: similar models, styles, brands, whatever would make sense
           for the category." Two devices, both drawn from the card's OWN pool
           so a Pixel never joins an iPhone lineup and a coin never joins gold:

             LINEUP — three to five related products in a row across the
             tallest band the copy leaves free, hero in the middle, a step
             larger and on top, its neighbours tilted away from it. It is
             placed like the single product: every item has to clear every
             line of copy, or the row is not placed and the single product
             stands.
             WALL   — the same family ghosted behind everything at low
             opacity, so the ground is the product instead of bokeh.

           LAB_ASSORT=all puts one on every card, off puts none, and the
           default is one card in three. */
        { const ASSORT = INFO.assort || 'third';
          const wantIt = ASSORT === 'all' || (ASSORT !== 'off' && sd % 3 === 1);
          const isGroup = n => /trio|fan|pair|group|pile|stack|scatter|collection|mixed|spill|-set|lineup|stagger|family|boxed|hand|tray|flatware/i.test(n);
          const order = (deck && deck.cuts) || HERO[p.cat] || [];
          const rank = n => { const k = order.findIndex(pre => n.startsWith(pre)); return k < 0 ? 99 : k; };
          const singles = use.filter(n => !isGroup(n)).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
          const srcOf = n => 'assets/cutouts/' + n + '.webp';
          const aspectOf = n => { const el = CUTOUT_ELS[srcOf(n)]; return el && el.width ? el.height / el.width : 1; };
          if (wantIt && singles.length >= 2){
            /* the hero leads; the rest of the family rotates off the seed */
            const family = [singles[0]];
            for (let k = 1; k < singles.length && family.length < 5; k++) family.push(singles[1 + ((k - 1 + sd) % (singles.length - 1))]);
            const probeA = paint(t2, false);
            const boxes = probeA.refs.map((o, k) => o && !/vignette|grain/.test(t2.layers[k].kind) && t2.layers[k].role !== 'frame' && t2.layers[k].kind !== 'cutout' ? o.getBoundingRect(true, true) : null)
              .filter(b => b && !(b.width > W * 0.85 && b.height > H * 0.85));
            const bands = freeBands(probeA.refs.map((o, k) => t2.layers[k].kind === 'cutout' ? null : o));
            const headBoxes = probeA.refs.map((o, k) => o && t2.layers[k].role === 'headline' ? o.getBoundingRect(true, true) : null).filter(Boolean);
            probeA.sc.dispose();
            const clear = r => !boxes.some(b => !(r.left + r.width <= b.left || b.left + b.width <= r.left || r.top + r.height <= b.top || b.top + b.height <= r.top));
            /* where a row can go: every full-width band, then the free
               stretch of either side column — a left-aligned headline leaves
               the right third open top to bottom, which no band ever sees */
            const regions = bands.filter(b => b.h >= 170).map(b => ({ left: 55, width: W - 110, top: b.top, h: b.h, row: true }));
            [[Math.round(W * 0.56), W - 50], [50, Math.round(W * 0.44)]].forEach(([x0, x1]) => {
              const occ = new Uint8Array(H);
              boxes.forEach(b => { if (b.left + b.width <= x0 || b.left >= x1) return;
                for (let y = Math.max(0, ~~b.top); y < Math.min(H, Math.ceil(b.top + b.height)); y++) occ[y] = 1; });
              let start = -1;
              for (let y = 0; y <= H; y++){
                if (y < H && !occ[y]){ if (start < 0) start = y; }
                else if (start >= 0){ if (y - start >= 300) regions.push({ left: x0, width: x1 - x0, top: start, h: y - start, row: false }); start = -1; }
              }
            });
            regions.sort((a, b) => (b.width * b.h) - (a.width * a.h));
            let lineup = null;
            outer: for (const reg of regions){
              for (const n of [Math.min(reg.row ? 5 : 3, family.length), reg.row ? 4 : 2, reg.row ? 3 : 0, reg.row ? 2 : 0]){
                if (n > family.length || n < 2) continue;
                /* the hero in the middle: neighbours are drawn from the rest */
                const rest = family.slice(1, n), midAt = Math.floor(n / 2);
                const names = rest.slice(0, midAt).concat([family[0]], rest.slice(midAt));
                const overlap = 0.10;                                   // neighbours tuck under the hero a little
                const placed = [];
                if (reg.row){
                  const hh = Math.min(reg.h - 24, 470);
                  const items = names.map((nm, k) => { const a = aspectOf(nm), mid = k === midAt, h = hh * (mid ? 1 : 0.84); return { nm, a, h, w: h / a, mid }; });
                  let total = items.reduce((t, it) => t + it.w, 0) * (1 - overlap) + items[0].w * overlap;
                  if (total > reg.width){ const f = reg.width / total; items.forEach(it => { it.h *= f; it.w *= f; }); total = reg.width; }
                  if (items.some(it => it.h < 150)) continue;
                  let x = reg.left + (reg.width - total) / 2; const cy = reg.top + reg.h / 2;
                  for (const it of items){
                    const top = cy - it.h / 2, box = { left: x - 6, top: top - 6, width: it.w + 12, height: it.h + 12 };
                    if (!clear(box)){ placed.length = 0; break; }
                    placed.push(Object.assign({}, it, { left: x, top })); x += it.w * (1 - overlap);
                  }
                } else {
                  /* a column: the family stacks, hero in the middle, each
                     item as wide as the column allows */
                  const items = names.map((nm, k) => { const a = aspectOf(nm), mid = k === midAt; let w = (reg.width - 20) * (mid ? 1 : 0.84); let h = w * a; return { nm, a, h, w, mid }; });
                  let total = items.reduce((t, it) => t + it.h, 0) * (1 - overlap) + items[0].h * overlap;
                  if (total > reg.h - 24){ const f = (reg.h - 24) / total; items.forEach(it => { it.h *= f; it.w *= f; }); total = reg.h - 24; }
                  if (items.some(it => it.h < 140)) continue;
                  let y = reg.top + (reg.h - total) / 2; const cx = reg.left + reg.width / 2;
                  for (const it of items){
                    const left = cx - it.w / 2, box = { left: left - 6, top: y - 6, width: it.w + 12, height: it.h + 12 };
                    if (!clear(box)){ placed.length = 0; break; }
                    placed.push(Object.assign({}, it, { left, top: y })); y += it.h * (1 - overlap);
                  }
                }
                if (placed.length === n){ lineup = placed; break outer; }
              }
            }
            if (lineup){
              t2.layers = t2.layers.filter(l => l.kind !== 'cutout');
              /* neighbours first, the hero last, so it sits on top of the row */
              lineup.map((it, k) => ({ it, k })).sort((a, b) => (a.it.mid ? 1 : 0) - (b.it.mid ? 1 : 0)).forEach(({ it, k }) => {
                const tilt = it.mid ? 0 : (k < lineup.length / 2 ? -7 : 7);
                t2.layers.push({ kind:'cutout', name:'Lineup Product ' + (k + 1), role:'photo', __lineup:true,
                  props:{ src: srcOf(it.nm), left: it.left + it.w / 2, top: it.top + it.h / 2, originX:'center', originY:'center',
                          w: it.w, angle: tilt, shadow:{ color:'rgba(0,0,0,0.40)', blur:36, offsetX:0, offsetY:18 } } });
              });
            }
            /* the wall: on every assorted card that took no lineup, and on
               half of the ones that did */
            if (!lineup || sd % 2 === 0){
              const light = lumHex(th.c1) > 0.22;
              const wallSet = singles.length >= 3 ? singles : use;
              const cols = 3, rows = 3, cw = W / cols, rh = H / rows;
              const wall = [];
              for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++){
                const k = r * cols + c;
                if ((k + sd) % 4 === 0) continue;                       // a gap or two, so it is not a wallpaper grid
                const nm = wallSet[(k * 5 + sd) % wallSet.length];
                const jx = ((sd * (k + 3)) % 60) - 30, jy = ((sd * (k + 7)) % 60) - 30;
                const tw = Math.round(Math.min(cw, rh) * 0.86), tx = cw * (c + 0.5) + jx, ty = rh * (r + 0.5) + jy;
                /* a ghost under the headline fights the word; that cell stays empty */
                const tile = { left: tx - tw / 2, top: ty - tw / 2, width: tw, height: tw };
                const underHead = headBoxes.some(h => { const ix = Math.max(0, Math.min(tile.left + tile.width, h.left + h.width) - Math.max(tile.left, h.left)), iy = Math.max(0, Math.min(tile.top + tile.height, h.top + h.height) - Math.max(tile.top, h.top)); return ix * iy > 0.25 * tw * tw; });
                if (underHead) continue;
                wall.push({ kind:'cutout', name:'Wall Product ' + (k + 1), role:'photo', __wall:true,
                  props:{ src: srcOf(nm), left: tx, top: ty, originX:'center', originY:'center',
                          w: tw, angle: (k % 2 ? 12 : -12), opacity: light ? 0.16 : 0.26 } });
              }
              t2.layers.unshift(...wall);
            }
          }
        }

        /* NO LINE REPEATS — "in any template EVER". Every pass above can add
           copy (the swap, the dedupe swap, enrich's info bands), so this runs
           last: a line that repeats an earlier one, exactly or as a shorter
           cut of it, becomes a fact the card does not have yet, or goes. */
        { const norm = t => String(t).trim().toUpperCase().replace(/\s+/g, ' ');
          /* the cities line is the one the owner singled out — "it helps
             people see where" — so it is the first alternate */
          const pool = [INFO.area, INFO.pay, INFO.hours, INFO.promise, ...INFO.trust, ...INFO.yes, ...INFO.no];
          /* a seal STACK (LICENSED / INSURED / PRIVATE, top right) next to a
             seal ROW of the same words: the stack changes its words */
          { const rows = new Set(t2.layers.filter(l => typeof l.text === 'string' && !l.text.includes('\n') && /^[A-Z][A-Z &-]{3,14}$/.test(l.text.trim())).map(l => norm(l.text)));
            const seals = ['VERIFIED','TOP RATED','SINCE 2015','BONDED','NO FEES','SAME DAY','WALK-INS OK','5-STAR','CASH PAID'];
            t2.layers.forEach(l => {
              if (typeof l.text !== 'string' || !l.text.includes('\n')) return;
              const lines = l.text.split('\n');
              if (lines.length < 2 || lines.length > 4 || !lines.some(x => rows.has(norm(x)))) return;
              const fresh = seals.filter(x => !rows.has(x) && !lines.map(norm).includes(x));
              l.text = lines.map(x => rows.has(norm(x)) ? fresh.shift() || x : x).join('\n');
            }); }
          const seen = [];
          const dupOf = k => seen.some(x => x === k || (k.length >= 12 && x.length >= 12 && (x.startsWith(k) || k.startsWith(x))));
          const kill = [];
          t2.layers.forEach((l, k) => {
            if (typeof l.text !== 'string' || !l.text.trim()) return;
            let key = norm(l.text);
            /* the length guard skips ornaments like TOP or $850 — but it was also
               skipping short money words, so a card could read iPHONE over iPHONE
               (owner, 2026-09-03: "why is it saying iPhone twice?"). A headline is
               never too short to be a repeat. */
            if (key.length < 8 && l.role !== 'headline') return;
            if (key.length < 3) return;
            /* ornaments are not sentences: a star row and a rating both show five
               stars by rule, and a divider repeats by design */
            if (!/[A-Z0-9]/.test(key)) return;
            if (l.role === 'headline'){
              /* a headline is a duplicate only of another headline, exactly:
                 THE COIN SHOP is not a repeat of "THE COIN SHOP OFFERED YOU
                 WHAT?" — that test deleted the object of WE BEAT */
              const heads = t2.layers.filter(x => x !== l && x.role === 'headline' && typeof x.text === 'string').map(x => norm(x.text));
              if (heads.includes(key) && t2.layers.indexOf(l) > t2.layers.findIndex(x => x.role === 'headline' && typeof x.text === 'string' && norm(x.text) === key)) kill.push(k);
              else seen.push(key);
              return;
            }
            if (!dupOf(key)){ seen.push(key); return; }
            const room = l.text.length * 1.15 + 2;
            const alt = pool.find(t => t.length <= room && !dupOf(norm(t)));
            if (alt){ l.text = alt; seen.push(norm(alt)); }
            else kill.push(k);
          });
          kill.reverse().forEach(k => t2.layers.splice(k, 1));
        }
        if (t2.__castBg) t2.layers = t2.layers.filter(l => !/^Hero Product|^Lineup Product/.test(l.name || ''));   // cast ground: the product is the ground
        if ((FACESYS.slab || (look && look.ground === 'slab') || (!look && /pokemon|sports/.test(p.cat) && sd % 3 === 0)) && !/bandKnockout|arcCrown|gradientWave|ticketStub|glassCard|slabPoster|neonNight/.test(p.layout)) slabFrame(t2, th, p.cat, sd);   // cards: one in three is graded
        /* BOXES HUG THEIR TEXT. Owner, 2026-09-03: "is the margin supposed to
           be that wide?" — a CTA plate carrying two centred lines had been
           left at the layout's full panel width, so the words floated in the
           middle of a long bar. A plate that runs edge to edge is a deliberate
           full-bleed band and is left alone; anything else is pulled in to the
           widest line it holds plus one fixed margin. */
        /* A PLATE HOLDS ITS OWN GROUP. Sizing a plate from whatever text happened
           to sit inside it missed content that had drifted outside — the rating
           pill was 279px wide while its stars and its line spanned 670, so the
           stars hung off one end and the sentence off the other ("can we fix the
           rating bubble?"). Each known plate is fitted to the union of the layers
           that belong to it, with a fixed margin. */
        if (!FACESYS.noGroup) { const probeP = paint(t2, false);
          const bx = k => probeP.refs[k] ? probeP.refs[k].getBoundingRect(true, true) : null;
          const find = rx => t2.layers.map((l, k) => ({ l, k })).filter(({ l }) => rx.test(l.name || ''));
          const hasPhonePill = t2.layers.some(l => /^Phone Pill$/.test(l.name || ''));
          const GROUPS = [
            { plate: /^Quote Card$/,           items: /^(Quote|Who)$/,                  padX: 34, padY: 26 },
            { plate: /^Phone Pill$/,           items: /^(Phone Number|Phone Cue)$/,     padX: 28, padY: 16 },
            { plate: /^(CTA Bar|CTA Card)$/,   items: hasPhonePill ? /^CTA$/ : /^(CTA|Phone Number|Phone Cue|Website)$/, padX: 32, padY: 20 },
          ];
          GROUPS.forEach(G => {
            const plates = find(G.plate); if (!plates.length) return;
            /* a FRESH measurement per group: an earlier group in this same pass
               may already have moved things, and stale boxes compound */
            const pr2 = paint(t2, false);
            const bxG = kk => pr2.refs[kk] ? pr2.refs[kk].getBoundingRect(true, true) : null;
            const parts = find(G.items).map(({ k }) => bxG(k)).filter(Boolean);
            if (!parts.length){ pr2.sc.dispose(); return; }
            if (!parts.length) return;
            const x0 = Math.min(...parts.map(b2 => b2.left)) - G.padX;
            const x1 = Math.max(...parts.map(b2 => b2.left + b2.width)) + G.padX;
            const y0 = Math.min(...parts.map(b2 => b2.top)) - G.padY;
            const y1 = Math.max(...parts.map(b2 => b2.top + b2.height)) + G.padY;
            const want = { left: Math.max(18, x0), top: Math.max(18, y0), width: Math.min(W - 36, x1 - x0), height: Math.min(H - 36, y1 - y0) };
            plates.forEach(({ l, k }) => {
              if (l.__footerBar) return;
              const pr = bxG(k); if (!pr || !pr.width || !pr.height) return;
              /* GROW AROUND THE PLATE'S OWN CENTRE. Relocating a plate to its
                 content's bounding box moved it out from under layers that were
                 not in the group and cost a card its stars; the plate stays where
                 the layout put it and only opens up enough to hold its group. */
              /* the plate must CONTAIN its group. Growing around the old centre
                 leaves content hanging off the end when the group sits to one
                 side, which is the misalignment the owner keeps seeing. */
              const w2 = Math.min(Math.max(pr.width, want.width), W - 36);
              const h2 = Math.min(Math.max(pr.height, want.height), H - 36);
              const cx = want.left + want.width / 2, cy = want.top + want.height / 2;
              if (Math.abs(w2 - pr.width) < 8 && Math.abs(h2 - pr.height) < 8
                  && Math.abs(cx - (pr.left + pr.width / 2)) < 8) return;           // already holds it
              l.props.width = (l.props.width || pr.width) * (w2 / pr.width);
              l.props.height = (l.props.height || pr.height) * (h2 / pr.height);
              const ox = l.props.originX || 'left', oy = l.props.originY || 'top';
              const nl = Math.max(18, Math.min(W - 18 - w2, cx - w2 / 2)), nt = Math.max(18, Math.min(H - 18 - h2, cy - h2 / 2));
              l.props.left = ox === 'center' ? nl + w2 / 2 : ox === 'right' ? nl + w2 : nl;
              l.props.top  = oy === 'center' ? nt + h2 / 2 : oy === 'bottom' ? nt + h2 : nt;
              if (l.props.rx && l.props.rx > l.props.height / 2) l.props.rx = l.props.height / 2;
              l.__fitted = true;
            });
            pr2.sc.dispose();
          });
          /* sheens are bound to their plates in the final layout pass */

          probeP.sc.dispose(); }
        { const probeH = paint(t2, false);
          const rect = k => probeH.refs[k] ? probeH.refs[k].getBoundingRect(true, true) : null;
          t2.layers.forEach((l, k) => {
            if (!(l.kind === 'rect' || l.kind === 'rrect') || !l.props || l.__moneyPlate || l.__hilite) return;
            const pr = rect(k); if (!pr || pr.width >= W - 16 || pr.width < 120) return;
            const held = t2.layers.map((t, q) => {
              if (typeof t.text !== 'string' || !t.props || q === k) return null;
              const b = rect(q); if (!b) return null;
              const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
              return cx > pr.left && cx < pr.left + pr.width && cy > pr.top && cy < pr.top + pr.height ? { t, b } : null;
            }).filter(Boolean);
            if (!held.length) return;
            /* a band carrying the money word is the design, not a loose box:
               shrinking it turned WE BUY / CARS into a sticker */
            if (held.some(h => h.t.role === 'headline' || (h.t.props.fontSize || 0) >= 70)) return;
            const inside = held.map(h => h.b);
            const wide = Math.max(...inside.map(b => b.width));
            const tall = Math.max(...inside.map(b => b.height));
            /* A PLATE TOO SMALL FOR ITS TEXT is the other half of the box rule:
               "the rating bar is way too skinny for that much text to fit."
               A plate whose copy overruns it grows to hold the copy. */
            if (wide > pr.width - 24 || tall > pr.height - 10){
              const growW = Math.min(W - 56, wide + 40), growH = Math.max(pr.height, tall + 22);
              const cx0 = pr.left + pr.width / 2;
              const ox0 = l.props.originX || 'left';
              const sc0 = growW / pr.width;
              l.props.width = (l.props.width || pr.width) * sc0;
              l.props.left = ox0 === 'center' ? cx0 : ox0 === 'right' ? cx0 + growW / 2 : cx0 - growW / 2;
              if (growH > (l.props.height || 0)){
                const cy0 = pr.top + pr.height / 2, oy0 = l.props.originY || 'top';
                const scH = growH / pr.height;
                l.props.height = (l.props.height || pr.height) * scH;
                l.props.top = oy0 === 'center' ? cy0 : oy0 === 'bottom' ? cy0 + growH / 2 : cy0 - growH / 2;
              }
              if (l.props.rx && l.props.rx > (l.props.height || 0) / 2) l.props.rx = (l.props.height || 0) / 2;
              return;
            }
            const PAD = 48, want = Math.min(W - 80, wide + PAD * 2);
            if (pr.width - want < 90) return;                       // already close: leave it
            const cx = pr.left + pr.width / 2, scale = want / pr.width;
            l.props.width = (l.props.width || pr.width) * scale;
            const ox = l.props.originX || 'left';
            l.props.left = ox === 'center' ? cx : ox === 'right' ? cx + want / 2 : cx - want / 2;
            if (l.props.rx && l.props.rx > (l.props.height || 0) / 2) l.props.rx = (l.props.height || 0) / 2;
          });
          probeH.sc.dispose(); }
        /* THE GOODS GO ON THE PAGE. Owner, 2026-09-03: "many of these images
           still lack assets… people don't know what you're buying," and again
           "so we don't just put a line background in, no stickers/assets."
           A drawn ground — ruled paper, a dark counter, a colour — says nothing
           on its own, and on a full card there is no gap left to drop a cutout
           into. So the product is drawn INTO the ground: large, in the quietest
           quarter, under a wash so the copy over it still reads. It cannot
           collide with anything, because by then it is the background. */
        /* what matters is what the card SHOWS, not what its layer list contains:
           a product the yield pass removed is still in t2.layers with no box */
        let __drawnCut = false;
        { const probeQ = paint(t2, false);
          __drawnCut = t2.layers.some((l, q) => l.kind === 'cutout' && probeQ.refs[q]);
          probeQ.sc.dispose(); }
        const __needGoods = !__drawnCut && !t2.__tileBg && !t2.__castBg && !t2.__slab
            && !(t2.bg && /^assets\/(scenes|bg-web)\//.test(String(t2.bg.src || '')));
        if (__needGoods && !(cutSrc && CUTOUT_ELS[cutSrc])) console.log('NOGOODS ' + (p.layout + '-' + th.id) + ' no cutout element for ' + cutSrc);
        if (__needGoods && cutSrc && CUTOUT_ELS[cutSrc]){
          const img = CUTOUT_ELS[cutSrc];
          const probeG = paint(t2, false);
          const words = probeG.refs.map((o, q) => {
            const l = t2.layers[q];
            return o && l && typeof l.text === 'string' && l.text.trim() ? o.getBoundingRect(true, true) : null;
          }).filter(Boolean);
          probeG.sc.dispose();
          /* THE BIGGEST CLEAR RECTANGLE, not merely the quietest quarter. A
             product centred in a quarter still landed across the headline, and
             a product on the words is the fault the owner has raised most. */
          const ar = img.width / img.height;
          const clearOf = r2 => !words.some(b2 => !(r2.left + r2.width <= b2.left || b2.left + b2.width <= r2.left || r2.top + r2.height <= b2.top || b2.top + b2.height <= r2.top));
          let spot = null;
          for (const wide of [W * 0.50, W * 0.44, W * 0.38, W * 0.32, W * 0.27, W * 0.22]){
            const hh = wide / ar;
            if (hh > H * 0.62) continue;
            for (let y = 24; y <= H - hh - 24 && !spot; y += 20)
              for (let x = 24; x <= W - wide - 24 && !spot; x += 20){
                const r2 = { left: x - 10, top: y - 10, width: wide + 20, height: hh + 20 };
                if (clearOf(r2)) spot = { left: x, top: y, width: wide, height: hh };
              }
            if (spot) break;
          }
          if (!spot){
            const quarters = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([qx, qy]) => {
              const r = { left: qx * W / 2, top: qy * H / 2, width: W / 2, height: H / 2 };
              const covered = words.reduce((n, b) => n + Math.max(0, Math.min(r.left + r.width, b.left + b.width) - Math.max(r.left, b.left))
                * Math.max(0, Math.min(r.top + r.height, b.top + b.height) - Math.max(r.top, b.top)), 0);
              return { r, covered };
            }).sort((a2, b2) => a2.covered - b2.covered);
            const qr = quarters[0].r, wide = Math.min(qr.width * 0.78, qr.height * 0.78 * ar);
            spot = { left: qr.left + (qr.width - wide) / 2, top: qr.top + (qr.height - wide / ar) / 2, width: wide, height: wide / ar, __crowded: true };
          }
          t2.__onPageBox = [Math.round(spot.left), Math.round(spot.top), Math.round(spot.width), Math.round(spot.height)];
          const prev = t2.bg && t2.bg.src, key = 'onpage:' + String(cutSrc).split('/').pop() + ':' + th.id + ':' + (sd % 4);
          drawGround(key, (g, W2, H2) => {
            if (prev && TPL_BG_ELS[prev]) g.drawImage(TPL_BG_ELS[prev], 0, 0, W2, H2);
            else { g.fillStyle = th.c1; g.fillRect(0, 0, W2, H2); }
            const w2 = spot.width, h2 = spot.height;
            const cx = spot.left + w2 / 2, cy = spot.top + h2 / 2;
            g.save();
            g.shadowColor = 'rgba(0,0,0,0.34)'; g.shadowBlur = 46; g.shadowOffsetX = 12; g.shadowOffsetY = 26;
            g.globalAlpha = 0.96;
            g.drawImage(img, cx - w2 / 2, cy - h2 / 2, w2, h2);
            g.restore();
            /* a wash of the ground so the copy laid over it keeps its contrast */
            /* a wash only where it is needed: a product standing in clear space
               keeps its colour, one that had to be crowded is pushed back */
            const wash = spot.__crowded ? (lumHex(th.c1) > 0.5 ? 0.42 : 0.5) : 0.12;
            g.fillStyle = rgba(lumHex(th.c1) > 0.5 ? th.c1 : (th.c2 && lumHex(th.c2) < 0.4 ? th.c2 : th.c1), wash);
            g.fillRect(0, 0, W2, H2);
          });
          t2.bg = Object.assign({}, t2.bg || {}, { type:'image', src: key, scrimColor: th.c1, scrim: 0.001, blur: 0 });
          t2.__onPage = true;
        }
          /* THE PILL LAYS ITS OWN CONTENTS OUT. Widening the plate let the
             centring pass drop the rating line on top of the stars, and the
             deco cleanup then deleted the stars. Stars left, sentence right,
             both locked, so nothing re-centres them into each other. */
        { const pill = t2.layers.find(l => /^Rate Pill$/.test(l.name || ''));
          const st = t2.layers.find(l => /^Stars$/.test(l.name || ''));
          const rl = t2.layers.find(l => /^Rating Line$/.test(l.name || ''));
            if (pill && st && rl && st.props && rl.props){
              const si = t2.layers.indexOf(st), ri = t2.layers.indexOf(rl), pi = t2.layers.indexOf(pill);
              /* a FRESH measurement: the generic plate pass has already moved
                 things, so the earlier probe's boxes are stale */
              const probeR = paint(t2, false);
              const bxR = kk => probeR.refs[kk] ? probeR.refs[kk].getBoundingRect(true, true) : null;
              const sb = bxR(si), rb = bxR(ri), pbNow = bxR(pi);
              probeR.sc.dispose();
              if (sb && rb && pbNow){
                /* size the pill from its two items directly: side by side if they
                   fit the card, stacked if they do not */
                const pad = 26, gap = 20;
                const sideW = sb.width + gap + rb.width + pad * 2;
                const side = sideW <= W - 80;
                const wNew = side ? sideW : Math.max(sb.width, rb.width) + pad * 2;
                const hNew = side ? Math.max(sb.height, rb.height) + pad * 1.5
                                  : sb.height + gap + rb.height + pad * 1.5;
                const cx = Math.max(wNew / 2 + 20, Math.min(W - wNew / 2 - 20, pbNow.left + pbNow.width / 2));
                const cy = pbNow.top + pbNow.height / 2;
                const sx = wNew / pbNow.width, sy = hNew / pbNow.height;
                pill.props.width = (pill.props.width || pbNow.width) * sx;
                pill.props.height = (pill.props.height || pbNow.height) * sy;
                const ox = pill.props.originX || 'left', oy = pill.props.originY || 'top';
                pill.props.left = ox === 'center' ? cx : ox === 'right' ? cx + wNew / 2 : cx - wNew / 2;
                pill.props.top  = oy === 'center' ? cy : oy === 'bottom' ? cy + hNew / 2 : cy - hNew / 2;
                if (pill.props.rx && pill.props.rx > pill.props.height / 2) pill.props.rx = pill.props.height / 2;
                pill.__fitted = true;
                if (side){
                  st.props.left = cx - wNew / 2 + pad; st.props.originX = 'left';
                  st.props.top = cy; st.props.originY = 'center';
                  rl.props.left = cx + wNew / 2 - pad; rl.props.originX = 'right';
                  rl.props.top = cy; rl.props.originY = 'center';
                } else {
                  st.props.left = cx; st.props.originX = 'center';
                  st.props.top = cy - hNew / 2 + pad * 0.75 + sb.height / 2; st.props.originY = 'center';
                  rl.props.left = cx; rl.props.originX = 'center';
                  rl.props.top = cy + hNew / 2 - pad * 0.75 - rb.height / 2; rl.props.originY = 'center';
                }
                st.__lock = true; st.__keepDeco = true; rl.__lock = true;
              }
            } }
        /* THE FOOTER BAR. Every one of the six reference ads the owner sent ends
           in a full-width band carrying the number with an icon and the address —
           it is the device that stops a card reading as a headline floating in
           space. On a sparse card the phone plate becomes that band. */
        { const pf0 = paint(t2, false);
          const gb0 = k => pf0.refs[k] ? pf0.refs[k].getBoundingRect(true, true) : null;
          const pn0 = t2.layers.findIndex(l => /^Phone Number$/.test(l.name || ''));
          const nb0 = pn0 >= 0 ? gb0(pn0) : null;
          let lowest = 0;
          t2.layers.forEach((l, k) => {
            if (/Vignette|Grain|Frame|Ground|Wall|Sheen$/i.test(l.name || '')) return;
            const b = gb0(k); if (!b) return;
            if (pn0 >= 0 && k === pn0) return;
            if (typeof l.text === 'string' && l.text.trim() && b.top + b.height < H - 30) lowest = Math.max(lowest, b.top + b.height);
          });
          pf0.sc.dispose();
          if (nb0 && nb0.top > H * 0.6){
            const plate0 = t2.layers.find(l => (l.kind === 'rect' || l.kind === 'rrect') && l.props && l.__ctaPlate);
            const barTop = Math.max(lowest + 26, nb0.top - 34);
            if (plate0 && H - barTop > 90 && H - barTop < 300){
              plate0.props.left = 0; plate0.props.originX = 'left';
              plate0.props.width = W;
              plate0.props.top = barTop; plate0.props.originY = 'top';
              plate0.props.height = H - barTop;
              plate0.props.rx = 0;
              plate0.__footerBar = true;
              /* the bar carries its own contents: the number centred, the call to
                 action above it, the website under it — otherwise the words stay
                 where the old pill was and the bar reads empty */
              const mid0 = barTop + (H - barTop) / 2;
              const pnL = t2.layers.find(l => /^Phone Number$/.test(l.name || ''));
              const ctaL = t2.layers.find(l => /^CTA$/.test(l.name || ''));
              const webL = t2.layers.find(l => /^Website$/.test(l.name || ''));
              const rows0 = [ctaL, pnL, webL].filter(l => l && l.props);
              if (rows0.length){
                const fs0 = rows0.map(l => l.props.fontSize || 30);
                const gapY = 12;
                const totalH = fs0.reduce((a2, b2) => a2 + b2 * 1.15, 0) + gapY * (rows0.length - 1);
                let y0 = mid0 - totalH / 2;
                rows0.forEach((l, i2) => {
                  const h2 = fs0[i2] * 1.15;
                  l.props.left = W / 2; l.props.originX = 'center';
                  l.props.top = y0 + h2 / 2; l.props.originY = 'center';
                  l.__lock = true;
                  y0 += h2 + gapY;
                });
              }
            }
          } }
        /* THE CTA BAR HOLDS ITS OWN WORDS, and the phone pill stands clear of
           them. Sized last, from a fresh measurement, because every earlier pass
           can still move the copy underneath it. */
        { const bar = t2.layers.find(l => /^(CTA Bar|CTA Card)$/.test(l.name || ''));
          const cta = t2.layers.find(l => /^CTA$/.test(l.name || ''));
          const pill2 = t2.layers.find(l => /^Phone Pill$/.test(l.name || ''));
          if (bar && cta && bar.props && cta.props && !bar.__footerBar){
            const pb = paint(t2, false);
            const gb = k => pb.refs[k] ? pb.refs[k].getBoundingRect(true, true) : null;
            const bb = gb(t2.layers.indexOf(bar)), cb = gb(t2.layers.indexOf(cta));
            const qb = pill2 ? gb(t2.layers.indexOf(pill2)) : null;
            pb.sc.dispose();
            if (bb && cb && bb.width && bb.height){
              const padX = 34, padY = 22;
              let x0 = cb.left - padX, x1 = cb.left + cb.width + padX;
              let y0 = Math.min(bb.top, cb.top - padY), y1 = Math.max(bb.top + bb.height, cb.top + cb.height + padY);
              if (qb && !pill2.__ownRow){          // the number keeps its own pill beside the words
                if (qb.left < x1 && qb.left + qb.width > x0){
                  const shift = x1 + 18 - qb.left;
                  if (qb.left + qb.width + shift < W - 24){
                    pill2.props.left = (pill2.props.left || 0) + shift;
                    const pn = t2.layers.find(l => /^Phone Number$/.test(l.name || ''));
                    if (pn && pn.props) pn.props.left = (pn.props.left || 0) + shift;
                    const pc = t2.layers.find(l => /^Phone Cue$/.test(l.name || ''));
                    if (pc && pc.props) pc.props.left = (pc.props.left || 0) + shift;
                  } else { x1 = Math.min(x1, qb.left - 18); }
                }
              }
              const wN = Math.max(60, Math.min(W - 40, x1 - x0)), hN = Math.max(40, y1 - y0);
              const nl = Math.max(20, Math.min(W - 20 - wN, x0));
              const sx = wN / bb.width, sy = hN / bb.height;
              bar.props.width = (bar.props.width || bb.width) * sx;
              bar.props.height = (bar.props.height || bb.height) * sy;
              const ox = bar.props.originX || 'left', oy = bar.props.originY || 'top';
              bar.props.left = ox === 'center' ? nl + wN / 2 : ox === 'right' ? nl + wN : nl;
              bar.props.top = oy === 'center' ? y0 + hN / 2 : oy === 'bottom' ? y0 + hN : y0;
              if (bar.props.rx && bar.props.rx > bar.props.height / 2) bar.props.rx = bar.props.height / 2;
            }
          } }
        /* ROWS, THE PHONE MARK, AND NO SHARP CORNERS. Owner, 2026-09-04:
           "make sure all the boxes are extended enough to cover the text behind
           it or scooted to the left since there is excess margin on the right",
           "the phone icon is often off the background box", and "less sharp
           corners… even three radii". Done last, from a fresh measurement. */
        { const pz = paint(t2, false);
          const gz = k => pz.refs[k] ? pz.refs[k].getBoundingRect(true, true) : null;

          /* a numbered row holds everything on that row */
          t2.layers.forEach((plate, pi2) => {
            const m2 = /^(Step Card|Row Card) (\d+)$/.exec(plate.name || '');
            if (!m2 || !plate.props) return;
            const n2 = m2[2];
            const mine = t2.layers.map((l, k) => ({ l, k }))
              .filter(({ l }) => new RegExp('^(Step Num Box|Step Num|Step Lab|Step Micro|Row Lab|Row Micro) ' + n2 + '$').test(l.name || ''))
              .map(({ k }) => gz(k)).filter(Boolean);
            if (!mine.length) return;
            const pb2 = gz(pi2); if (!pb2 || !pb2.width) return;
            const padX = 26, padY = 16;
            const x0 = Math.min(...mine.map(b => b.left)) - padX;
            const x1 = Math.max(...mine.map(b => b.left + b.width)) + padX;
            const y0 = Math.min(pb2.top, Math.min(...mine.map(b => b.top)) - padY);
            const y1 = Math.max(pb2.top + pb2.height, Math.max(...mine.map(b => b.top + b.height)) + padY);
            const wN = Math.min(W - 36, x1 - x0), hN = Math.min(H - 36, y1 - y0);
            const nl = Math.max(18, Math.min(W - 18 - wN, x0));
            if (Math.abs(wN - pb2.width) < 6 && Math.abs(nl - pb2.left) < 6) return;
            plate.props.width = (plate.props.width || pb2.width) * (wN / pb2.width);
            plate.props.height = (plate.props.height || pb2.height) * (hN / pb2.height);
            const ox = plate.props.originX || 'left', oy = plate.props.originY || 'top';
            plate.props.left = ox === 'center' ? nl + wN / 2 : ox === 'right' ? nl + wN : nl;
            plate.props.top = oy === 'center' ? y0 + hN / 2 : oy === 'bottom' ? y0 + hN : y0;
          });

          /* the phone mark belongs to the number, inside whatever plate holds it */
          { const pn = t2.layers.find(l => /^Phone Number$/.test(l.name || ''));
            const cue = t2.layers.find(l => /^Phone Cue$/.test(l.name || ''));
            if (pn && cue && cue.props){
              const nb = gz(t2.layers.indexOf(pn));
              if (nb){
                const size = cue.props.size || 34;
                const holder = t2.layers.map((l, k) => ({ l, b: (l.kind === 'rect' || l.kind === 'rrect') ? gz(k) : null }))
                  .filter(({ b }) => b && b.width > 120 && nb.left >= b.left - 4 && nb.left + nb.width <= b.left + b.width + 4
                          && nb.top >= b.top - 4 && nb.top + nb.height <= b.top + b.height + 4)
                  .sort((a, b) => (a.b.width * a.b.height) - (b.b.width * b.b.height))[0];
                let x = nb.left - size - 16;
                if (holder && x < holder.b.left + 12) x = holder.b.left + 12;      // never off its own plate
                if (x < 18) x = 18;
                cue.props.left = x;
                cue.props.top = nb.top + nb.height / 2 - size / 2;
                cue.props.originX = 'left'; cue.props.originY = 'top';
                cue.__lock = true;
              }
            } }
          pz.sc.dispose();
        }


        /* nothing on the card has a knife edge */
        t2.layers.forEach(l => {
          if (!(l.kind === 'rect' || l.kind === 'rrect') || !l.props) return;
          if (/^Frame|Sheen$|Overrun$|Ground|Wall/i.test(l.name || '')) return;
          const h3 = l.props.height || 0;
          l.props.rx = Math.min(Math.max(l.props.rx || 0, 3), Math.max(3, h3 / 2));
        });
        { const probeE = paint(t2, false);
          const c0 = (deck && deck.cuts && deck.cuts[0]) || '';
          const line = /^own-apple|^iphone|^qs-iphone|^ip-/.test(c0) ? 'iphone' : /^ipad|^qs-ipad/.test(c0) ? 'ipad' : /^mac|^qs-device-mac|^qs-sheet-mb|^own-stock-mac/.test(c0) ? 'macbook' : /watch/.test(c0) ? 'watch' : null;
          addElements(t2, p.cat, sd, th, probeE.refs, line, useDeck && useDeck.__brandWord); probeE.sc.dispose(); }
        /* THE TRUST STACK YIELDS TO THE PRODUCT (owner, 2026-09-03: "overlapping",
           on a slab and a card stack sitting across TRUSTED / BONDED / LOCAL).
           The product is still allowed the corner — "products may sit under it" —
           but a half-covered word is worse than no word, so the whole stack goes,
           its plate and tick with it, rather than leaving letter fragments. */
        { const probeB = paint(t2, false);
          const box = k => probeB.refs[k] ? probeB.refs[k].getBoundingRect(true, true) : null;
          const prods = t2.layers.map((l, k) => l.kind === 'cutout' ? box(k) : null).filter(Boolean);
          const isStack = l => /^Trust Mark/.test(l.name || '') || (l.role === 'badges' && !l.__slabGrade && !/Spec Chip/.test(l.name || ''));
          const covered = t2.layers.some((l, k) => {
            if (!isStack(l) || typeof l.text !== 'string') return false;
            const b = box(k); if (!b || !b.width || !b.height) return false;
            return prods.some(pb => {
              const ov = Math.max(0, Math.min(pb.left + pb.width, b.left + b.width) - Math.max(pb.left, b.left))
                       * Math.max(0, Math.min(pb.top + pb.height, b.top + b.height) - Math.max(pb.top, b.top));
              return ov > b.width * b.height * 0.14;
            });
          });
          if (covered) t2.layers = t2.layers.filter(l => !isStack(l));
          probeB.sc.dispose(); }
        const ground = paint(t2, true);
        const gd = ground.sc.lowerCanvasEl.getContext('2d').getImageData(0,0,W,H).data;
        ground.sc.dispose();

        // repair any line the swap left short, using the ground we just measured
        const full = paint(t2, false);
        const plates = [];                      // [layer index, bbox, plate colour] for lines that need a plate
        t2.layers.forEach((l, k) => {
          const o = full.refs[k];
          if (!o || typeof l.text !== 'string' || !String(l.text).trim()) return;
          const b = o.getBoundingRect(true, true);
          const x0=Math.max(0,~~b.left), y0=Math.max(0,~~b.top);
          const x1=Math.min(W,Math.ceil(b.left+b.width)), y1=Math.min(H,Math.ceil(b.top+b.height));
          const ls = [];
          for (let y=y0;y<y1;y+=2) for (let x=x0;x<x1;x+=2) ls.push(lumPx(gd,(y*W+x)*4));
          if (!ls.length) return;
          ls.sort((a, b) => a - b);
          /* the MEAN let black sit on a photo whose dark half swallowed it
             ("black on black"): a dark ink is judged against the darkest
             quarter of its ground, a light ink against the lightest */
          const q = Math.max(1, Math.floor(ls.length / 4));
          const Ldark = ls.slice(0, q).reduce((a, b) => a + b, 0) / q, Llight = ls.slice(-q).reduce((a, b) => a + b, 0) / q;
          const Lmean = ls.reduce((a, b) => a + b, 0) / ls.length;
          let L = Lmean;
          /* rgba() and gradient fills are NOT edge cases here — the designer
             library uses them for most semi-transparent labels and every
             gradient headline. Skipping them left "PAID TODAY" and "200+ LOCAL
             REVIEWS" dark-on-dark after the swap: the repair ran and declined
             to look at exactly the layers that broke. */
          const toHex = v => {
            if (isHex(v)) return v;
            if (typeof v === 'string'){
              const q = v.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
              if (q) return '#' + [1,2,3].map(n => (+q[n]).toString(16).padStart(2,'0')).join('');
            }
            return null;
          };
          /* the GRADIENT is what paints when there is one: Headline 1 on the
             ticket carried fill #173f3f and a white-to-white grad, so the fill
             passed and the white printed — "more white on white" */
          const inkNow = (l.props.grad && toHex(l.props.grad.c1)) || toHex(l.props.fill) || null;
          const want = (l.props.fontSize || 40) >= 30 ? 4.0 : 5.5;
          const ratio = c => { const A = lumHex(c); const G = A < 0.18 ? Ldark : A > 0.5 ? Llight : Lmean; const hi=Math.max(A,G), lo=Math.min(A,G); return (hi+0.05)/(lo+0.05); };
          /* a locked gradient (the golden money word) is kept as long as EITHER
             stop can be read; when both fail — a white-to-cream headline on the
             white ticket, "more white on white" — it is repaired like any line */
          if (l.__lock && l.props.grad){
            const c2h = toHex(l.props.grad.c2);
            if ((inkNow && ratio(inkNow) >= want) || (c2h && ratio(c2h) >= want)) return;
          }
          if (inkNow && ratio(inkNow) < want){
            const best = ratio('#f9f8f6') >= ratio('#101014') ? '#f9f8f6' : '#101014';
            l.props.fill = best;
            l.props.opacity = 1;                       // alpha is often why it failed
            if (l.props.grad) delete l.props.grad;     // rule 45: set fill, drop grad
            // a hollow outline on a repaired headline just muddies it
            if (l.props.stroke && (l.props.fontSize || 0) >= 70) l.props.strokeWidth = 0;
            /* neither ink clears the worst quarter: a thin outline in the
               opposite colour carries the letter over the photo — an outline,
               not a glow (glow on condensed faces is out) */
            if (ratio(best) < want){
              l.props.stroke = best === '#f9f8f6' ? '#101014' : '#f9f8f6';
              l.props.strokeWidth = Math.max(2, (l.props.fontSize || 40) * ((l.props.fontSize || 40) >= 60 ? 0.05 : 0.09));
              l.props.paintFirst = 'stroke';
              /* small type over a busy photo needs more than an outline: a
                 soft plate in the opposite tone, hugging the line */
              if ((l.props.fontSize || 40) < 60 && l.role !== 'badges' && l.role !== 'deco' && !l.__pinned)
                plates.push([k, b, best === '#f9f8f6' ? 'rgba(16,16,20,0.72)' : 'rgba(249,248,246,0.80)']);
            }
          }
        });
        full.sc.dispose();

        /* MINIMUM INFORMATION. Owner, 2026-09-02, on a row of cards carrying
           an items line and nothing else: "themes lacking selling points /
           information". A card leaves here with at least two lines of
           selling points besides the items and the CTA. They go into any
           free band; if the copy leaves none, the headline gives up 12% and
           the search runs once more. */
        { const infoNames = /^(Items|Who|Who 2|Panel Foot|Website|Rating|Review|We Also Buy|Service Area|Address|Hours)/;
          const norm = t => String(t).trim().toUpperCase().replace(/\s+/g, ' ');
          const have = () => t2.layers.filter(l => typeof l.text === 'string' && l.role === 'info' && !infoNames.test(l.name || '') && l.text.trim().length >= 10);
          const onCard = new Set(t2.layers.filter(l => typeof l.text === 'string').map(l => norm(l.text)));
          const sellPool = []
            .concat(String((useDeck || deck || DECKS_SNAPSHOT[p.cat] || {}).sub || '').split(/\\n|\n/))
            .concat([INFO.promise], INFO.yes, INFO.no)
            .map(t => t.trim()).filter(t => t.length >= 10 && !onCard.has(norm(t)));
          const light = lumHex(th.c1) > 0.22;
          for (let attempt = 0; attempt < 2 && have().length < 2 && sellPool.length; attempt++){
            const pr = paint(t2, false);
            const bands = freeBands(pr.refs).filter(b => b.h >= 56);
            pr.sc.dispose();
            if (!bands.length){
              /* nothing free: the biggest headline yields a little room */
              const heads = t2.layers.filter(l => l.role === 'headline' && l.props && l.props.fontSize);
              heads.sort((a, b) => b.props.fontSize - a.props.fontSize);
              if (heads[0]) heads[0].props.fontSize = Math.round(heads[0].props.fontSize * 0.88);
              continue;
            }
            for (const b of bands){
              if (have().length >= 2 || !sellPool.length) break;
              const text = sellPool.shift();
              const fs = b.h >= 84 ? 27 : 22;
              t2.layers.push({ kind:'text', name:'Selling Point', role:'info', text: text.toUpperCase(),
                props:{ left: W / 2, top: b.top + b.h / 2, originX:'center', originY:'center', fontFamily: th.faces.support,
                        fontSize: fs, fill: th.ink, fontWeight:'800', charSpacing: 40 } });
              onCard.add(norm(text));
            }
          }
        }

        frameFor(t2, p.cat, i * 7 + j, th);
        /* FILL THE CARD. Owner, 2026-09-04: "don't you think these are a little
           blank of assets and have too much empty space?" Coverage is measured on
           a 24px grid; a card under 45% covered has its product moved into the
           largest empty rectangle and grown to fill it, clear of every word. */
        { const GS = 24, cols = Math.ceil(W / GS), rowsG = Math.ceil(H / GS);
          const gridOf = refs2 => {
            const g2 = new Uint8Array(cols * rowsG);
            t2.layers.forEach((l, k) => {
              const o = refs2[k]; if (!o) return;
              if (/Vignette|Grain|Frame|Ground|Wall|Overrun|Sheen$/i.test(l.name || '') || l.kind === 'vignette' || l.kind === 'grain') return;
              const b = o.getBoundingRect(true, true);
              const x0 = Math.max(0, Math.floor(b.left / GS)), x1 = Math.min(cols - 1, Math.floor((b.left + b.width) / GS));
              const y0 = Math.max(0, Math.floor(b.top / GS)), y1 = Math.min(rowsG - 1, Math.floor((b.top + b.height) / GS));
              if ((x1 - x0 + 1) * (y1 - y0 + 1) > cols * rowsG * 0.86) return;
              for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g2[y * cols + x] = 1;
            });
            return g2;
          };
          const biggestGap = g2 => {
            const hgt = new Int32Array(cols); let best = 0, box = null;
            for (let y = 0; y < rowsG; y++){
              for (let x = 0; x < cols; x++) hgt[x] = g2[y * cols + x] ? 0 : hgt[x] + 1;
              const st = [];
              for (let x = 0; x <= cols; x++){
                const h = x === cols ? 0 : hgt[x]; let start = x;
                while (st.length && st[st.length - 1][1] >= h){
                  const [si, sh] = st.pop(); const ar = sh * (x - si);
                  if (ar > best){ best = ar; box = { left: si * GS, top: (y - sh + 1) * GS, width: (x - si) * GS, height: sh * GS }; }
                  start = si;
                }
                st.push([start, h]);
              }
            }
            return { best, box };
          };
          for (let pass = 0; pass < 3; pass++){
            const pf = paint(t2, false);
            const grid = gridOf(pf.refs);
            let filled = 0; for (let i = 0; i < grid.length; i++) filled += grid[i];
            const cov = filled / (cols * rowsG);
            const hero = t2.layers.find(l => l.kind === 'cutout' && /Hero Product/.test(l.name || ''));
            const words = pf.refs.map((o, k) => {
              const l = t2.layers[k];
              return o && typeof l.text === 'string' && l.text.trim() ? o.getBoundingRect(true, true) : null;
            }).filter(Boolean);
            const gap = biggestGap(grid);
            pf.sc.dispose();
            if (cov >= 0.45 || !hero || !hero.props || !gap.box) break;
            const img2 = CUTOUT_ELS[hero.props.src]; if (!img2) break;
            const ar2 = img2.height / img2.width;
            const g3 = gap.box;
            const clear2 = (x, y, w2, h2) => !words.some(t => !(x + w2 <= t.left - 8 || t.left + t.width + 8 <= x || y + h2 <= t.top - 8 || t.top + t.height + 8 <= y));
            let put = null;
            for (const w2 of [g3.width - 30, g3.width * 0.86, g3.width * 0.7, g3.width * 0.56]){
              const h2 = w2 * ar2;
              if (w2 < 180 || h2 > g3.height - 20) continue;
              const x = g3.left + (g3.width - w2) / 2, y = g3.top + (g3.height - h2) / 2;
              if (clear2(x, y, w2, h2)){ put = { x, y, w: w2 }; break; }
            }
            if (!put) break;
            hero.props.w = put.w;
            hero.props.left = (hero.props.originX === 'right') ? put.x + put.w : put.x;
            hero.props.top = put.y;
          }
        }
        { const ps = paint(t2, false);
          const gs = k => ps.refs[k] ? ps.refs[k].getBoundingRect(true, true) : null;
        /* A HIGHLIGHT IS PART OF ITS BOX. Owner, 2026-09-04: the sheen bars were
             drawn at fixed pixel positions from the layout's original geometry, so
             once a plate moved or resized the highlight hung off both ends — "there
             is a highlight, but it is square corners, I'm confused… issues with
             scaling." Every sheen is now measured FROM its own plate: inset 5% of
             the plate's width each side, sitting 7% down, 9% of the plate's height
             tall, with a rounded cap. It can never be wider than what it lights. */
          t2.layers.forEach((sh, k2) => {
            const m3 = /^(.*) Sheen$/.exec(sh.name || ''); if (!m3 || !sh.props) return;
            let oi = t2.layers.findIndex(l => (l.name || '') === m3[1] && l.props && (l.kind === 'rect' || l.kind === 'rrect'));
            if (oi < 0) oi = t2.layers.findIndex(l => (l.name || '').trim() === m3[1].trim() && l.props && (l.kind === 'rect' || l.kind === 'rrect'));
            if (oi < 0) { sh.props.opacity = 0; return; }              // an orphan highlight lights nothing
            const ob = gs(oi); if (!ob || !ob.width || !ob.height) { sh.props.opacity = 0; return; }
            const insetX = Math.max(10, ob.width * 0.05);
            const hN = Math.max(3, Math.round(ob.height * 0.09));
            sh.props.left = ob.left + insetX;
            sh.props.width = Math.max(24, ob.width - insetX * 2);
            sh.props.top = ob.top + Math.max(5, ob.height * 0.07);
            sh.props.height = hN;
            sh.props.rx = Math.max(2, hN / 2);
            sh.props.originX = 'left'; sh.props.originY = 'top';
            sh.__lock = true; sh.__sheenOf = m3[1];
          });
          ps.sc.dispose();
          /* the self-audit the owner asked for: after binding, a highlight that
             still is not inside what it lights does not draw at all */
          { const pv = paint(t2, false);
            const gv = k => pv.refs[k] ? pv.refs[k].getBoundingRect(true, true) : null;
            t2.layers.forEach((sh, k2) => {
              if (!sh.__sheenOf || !sh.props) return;
              const oi = t2.layers.findIndex(l => (l.name || '') === sh.__sheenOf);
              const sb = gv(k2), ob = oi >= 0 ? gv(oi) : null;
              if (!sb || !ob){ sh.props.opacity = 0; return; }
              const ix = Math.max(0, Math.min(sb.left + sb.width, ob.left + ob.width) - Math.max(sb.left, ob.left));
              const iy = Math.max(0, Math.min(sb.top + sb.height, ob.top + ob.height) - Math.max(sb.top, ob.top));
              if (ix * iy < sb.width * sb.height * 0.98){
                sh.props.opacity = 0; sh.props.width = 0; sh.props.height = 0;   // opacity alone is not always honoured on a solid
                console.log('WARN sheen ' + (sh.name || '') + ' could not sit inside ' + sh.__sheenOf + ' — hidden');
              }
            });
            pv.sc.dispose(); } }
        const fin = paint(t2, false);
        /* Edge density, the metric from the owner's own labelled references:
           their GOOD folder sits at 25.8-34% and the shipped library at ~8%.
           Busier is better in this market, so this number is a target, not a
           warning. */
        const small = document.createElement('canvas'); small.width = 256; small.height = 256;
        small.getContext('2d').drawImage(fin.sc.lowerCanvasEl, 0, 0, W, H, 0, 0, 256, 256);
        const pix = small.getContext('2d').getImageData(0,0,256,256).data;
        let edges = 0, tot = 0;
        for (let y=1;y<256;y++) for (let x=1;x<256;x++){
          const a=(y*256+x)*4, b=(y*256+x-1)*4, c3=((y-1)*256+x)*4;
          const d1=Math.abs(pix[a]-pix[b])+Math.abs(pix[a+1]-pix[b+1])+Math.abs(pix[a+2]-pix[b+2]);
          const d2=Math.abs(pix[a]-pix[c3])+Math.abs(pix[a+1]-pix[c3+1])+Math.abs(pix[a+2]-pix[c3+2]);
          if (Math.max(d1,d2) > 24) edges++;
          tot++;
        }
        const density = +(edges/tot*100).toFixed(1);
        if (density < 16 && attempt === 0){ fin.sc.dispose(); continue; }   // sparse (under 16): try once more with a new seed

        /* SELF-AUDIT BEFORE THE CARD IS KEPT. Owner, 2026-09-03: "self audit as
           you're making it… check the negative prompts… make sure you're putting
           images of what you are talking about with the relevant brand." A card
           whose words and pictures disagree — POKEMON over an iPhone, HYUNDAIS
           over a Rolls-Royce, TEST STRIPS over a lancing device — is re-seeded
           here rather than shipped and caught later. */
        const subject = subjectOf(t2, useDeck, p.cat);
        const faults = subjectFaults(t2, subject).concat(lookFaults(t2, look));
        if (faults.length){
          if (attempt === 0){ fin.sc.dispose(); continue; }
          console.warn('SUBJECT ' + tpl.id + ' ' + faults.join(' · '));
        }

        const c = document.createElement('canvas');
        c.width = SIZE; c.height = SIZE;
        const g2 = c.getContext('2d'); g2.imageSmoothingQuality = 'high';
        g2.drawImage(fin.sc.lowerCanvasEl, 0, 0, W, H, 0, 0, SIZE, SIZE);
        /* LAB_DEBUG=layout-palette[,…] attaches the final layer table */
        const dbg = (DEBUG_ID === 'ALL') || (DEBUG_ID && DEBUG_ID.split(',').includes(p.layout + '-' + th.id))
          ? t2.layers.map((l, k) => { const o = fin.refs[k]; const bb = o && o.getBoundingRect(true, true);
              return [k, l.kind, l.role || '', (l.name || '').slice(0, 22), typeof l.text === 'string' ? l.text.replace(/\n/g, '⏎').slice(0, 44) : '',
                      (o && o.fontSize) || (l.props && l.props.fontSize) || '', bb ? [bb.left, bb.top, bb.width, bb.height].map(Math.round).join(',') : '-',
                      l.solid ? 'solid' : '', l.props && l.props.fill || '', l.props && l.props.grad ? 'grad ' + l.props.grad.c1 + '>' + l.props.grad.c2 : '', l.__lock ? 'lock' : '', l.props && l.props.strokeWidth ? 'stroke ' + l.props.stroke + ' ' + l.props.strokeWidth : '', l.kind === 'cutout' && l.props ? 'src=' + String(l.props.src).split('/').pop() + ' w=' + l.props.w + ' op=' + l.props.opacity : ''].join(' | '); })
          : undefined;
        /* two themes can land on the same layout+palette+variant; the plan index keeps their cards apart */
        out.push({ id: p.layout + '-' + DONORS[j] + '-' + e.v + (e.look ? '-' + String(e.k) : ''),
                   palette: th.id, name: th.name + ' · ' + p.layout, dbg, placeLog: t2.__placeResult,
                   family: th.family, layout: p.layout, cat: p.cat, base: p.id,
                   faces: th.faces, c1:th.c1, ink:th.ink, accent:th.accent, support:th.support,
                   plate: th.plate.shape+'/'+th.plate.fill,
                   product: cutSrc.split('/').pop().replace('.webp',''), density, look: (look && (look.key || look.id)) || null, onPage: !!t2.__onPage, onPageBox: t2.__onPageBox || null, ground: t2.__slab ? 'slab' : t2.__deepBg ? 'deep' : t2.__castBg ? 'cast' : t2.__tileBg ? 'tile' : t2.__absBg ? 'abs' : t2.__cashBg ? 'cash' : t2.__spaceBg ? 'space' : (t2.bg && t2.bg.src ? String(t2.bg.src).split('/').slice(-2).join('/') : 'plain'), deckH2: useDeck && useDeck.h2, deckCut: useDeck && useDeck.cuts && useDeck.cuts[0],
                   png: c.toDataURL('image/webp', 0.82),
                   tpl: INFO.export ? (() => { try { return JSON.parse(JSON.stringify(t2)); } catch(e){ return null; } })() : undefined,
                   /* DRAWN GROUNDS ARE BAKED ON THE WAY OUT. A card whose
                      backdrop is a synthetic key (dg:, abs:, paper:, space:,
                      slab:) has no file behind it — the ground was painted
                      into a canvas in this page. The app cannot reproduce that
                      without a copy of this file's drawing code, which is the
                      classic drift pair, so the RENDERER writes a picture and
                      the app just loads it. Cheap: one toDataURL per unique
                      key, deduped in node. */
                   ground_key: INFO.export && /^(dg|abs|paper|space|slab):/.test((t2.bg && t2.bg.src) || '') ? t2.bg.src : undefined,
                   ground_png: (() => {
                     if (!INFO.export) return undefined;
                     const k = (t2.bg && t2.bg.src) || '';
                     if (!/^(dg|abs|paper|space|slab):/.test(k)) return undefined;
                     const el = TPL_BG_ELS[k];
                     if (!el) return undefined;
                     try {
                       const S = 864;                       // soft grounds survive the downscale; 1080 was 2x the bytes
                       const cc = document.createElement('canvas'); cc.width = cc.height = S;
                       const gg = cc.getContext('2d'); gg.imageSmoothingQuality = 'high';
                       gg.drawImage(el, 0, 0, S, S);
                       return cc.toDataURL('image/webp', 0.82);
                     } catch(e){ return undefined; }
                   })() });
        fin.sc.dispose();
        break;
      } catch(err){ if (attempt === 0) continue; out.push({ id: picks[e.i][0].layout+'-'+DONORS[j]+'-'+e.v, err:String(err).slice(0,140) }); }
      await new Promise(r => setTimeout(r, 0));
    }
  }
  if (lookSkips.length) console.log('LOOKSKIP ' + lookSkips.length + '\n  ' + [...new Set(lookSkips)].join('\n  '));
  return out;
}, PLAN, picks, DONORS, THEMES, PAL, CUTS, DEVICE_DECKS, INFO, CATEGORY_COPY, ALL.filter(okCut), HERO, BG, DEBUG_ID, TYPE, CHALLENGE, KICKERS, FACESYS, WEBBG, LOGOS, LOOKS, JSON.parse(JSON.stringify(SUBCATS, (k, v) => v instanceof RegExp ? v.source : v)));
await browser.close();

const ok = cards.filter(c => !c.err), bad = cards.filter(c => c.err);
if (process.env.LAB_EXPORT){
  /* one file per unique ground key, and every record that used it now points
     at that file — so a showcase card ships like any other backdrop */
  const gdir = ROOT + 'assets/showcase/bg/';
  mkdirSync(gdir, { recursive: true });
  const written = {};
  let gBytes = 0;
  ok.forEach(r => {
    if (!r.ground_key || !r.ground_png) return;
    const file = 'assets/showcase/bg/' + r.ground_key.replace(/[^A-Za-z0-9]+/g, '_') + '.webp';
    if (!written[file]){
      const buf = Buffer.from(r.ground_png.split(',')[1], 'base64');
      writeFileSync(ROOT + file, buf); written[file] = 1; gBytes += buf.length;
    }
    if (r.tpl && r.tpl.bg) r.tpl.bg.src = file;
  });
  console.log('baked grounds: ' + Object.keys(written).length + ' files · ' + (gBytes/1048576).toFixed(1) + ' MB');
  writeFileSync(OUT + 'templates.json', JSON.stringify(ok.map(({ png, dbg, ground_png, ...r }) => r)));
}
ok.forEach(c => writeFileSync(OUT + c.id + '.webp', Buffer.from(c.png.split(',')[1],'base64')));
if (process.env.LAB_PLACE) ok.forEach(c => console.log('PLACE ' + c.id + ' ' + (c.placeLog || '(search not run)')));
if (DEBUG_ID === 'ALL'){
  let rows = ok.map(c => ({ id: c.id, cat: c.cat, faces: c.faces, density: c.density, layers: c.dbg }));
  if (process.env.LAB_ONLY && existsSync(OUT + 'audit-layers.json')){
    const prev = JSON.parse(readFileSync(OUT + 'audit-layers.json', 'utf8')), byId = Object.fromEntries(rows.map(r => [r.id, r]));
    rows = prev.map(r => byId[r.id] || r);
    // the manifest too: a re-rendered card's record replaces the old one
    const man = JSON.parse(readFileSync(OUT + 'manifest.json', 'utf8')), mb = Object.fromEntries(ok.map(({ png, dbg, tpl, ...r }) => [r.id, r]));
    writeFileSync(OUT + 'manifest.json', JSON.stringify(man.map(r => mb[r.id] || r), null, 1));
  }
  writeFileSync(OUT + 'audit-layers.json', JSON.stringify(rows, null, 0));
}
else ok.filter(c => c.dbg).forEach(c => console.log('\n== ' + c.id + ' (' + c.cat + ', ' + c.product + ')\n' + c.dbg.join('\n')));
writeFileSync(OUT + (process.env.LAB_ONLY ? 'manifest-only.json' : 'manifest.json'), JSON.stringify(ok.map(({png,dbg,tpl,...r}) => r), null, 1));
const mb = ok.reduce((s,c) => s + Buffer.from(c.png.split(',')[1],'base64').length, 0)/1048576;
console.log(`rendered ${ok.length}/${cards.length} · ${mb.toFixed(1)} MB`);
console.log('layouts: ' + [...new Set(ok.map(c=>c.layout))].length + ' · palettes: ' + [...new Set(ok.map(c=>c.family))].join(', '));
console.log('legacy hardware in pool: ' + Object.values(CUTS).flat().filter(c => /iphone-(x|xr|xs|1[012])/i.test(c)).length);
if (bad.length) bad.slice(0,6).forEach(c => console.log('  FAIL ' + c.id + ' ' + c.err));
if (perr.length) console.log('page errors: ' + perr.slice(0,3).join(' | '));
