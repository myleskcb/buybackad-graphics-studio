// Builds the category pages in ads/ (ads/we-buy-<category>.html), and from the
// same tables everything search engines and AI assistants read on the site:
// the "Ad templates" lists and the in-page links to every line on the landing,
// the landing's structured data (Organization, WebSite, WebApplication with
// offers from PLANS in app.js, HowTo, FAQPage from the visible FAQ), the heads,
// bars and footers of the information pages (INFO), sitemap.xml, robots.txt,
// llms.txt and llms-full.txt. So a list cannot name a page that is not built,
// and no structured data says what the page does not.
//   node scripts/build_seo_pages.mjs [--date=YYYY-MM-DD]
// Remade 2026-11-18 in the house look and the trade's words (DESIGN-LAW 146).
// Written 2026-09-22 for search: until then the whole site was one page, and a
// reseller searching "we buy gold flyer template" had nothing to land on.
//
// Rules the copy keeps:
// - Nothing counted. The gallery is re-baked from time to time, so a number of
//   designs printed here would go stale; the free-tier rule is stated as the
//   gate works (every Phones design, the top 3 of every other category).
// - No invented results, reviews or customers.
// - The pictures are the product cutouts in assets/cutouts, not showcase
//   renders, so a showcase re-bake cannot break these pages.
// - Each page's FAQ JSON-LD is built from the same array as its visible FAQ.
// - A line the studio has no designs for yet (soon: true) says so, and shows
//   how to make one today with the seller's own photo; it never links to a
//   gallery of designs that are not there.
//
// CATS is in the owner's order of importance (2026-10-08): "apple, phones,
// consoles, computers, gold, silver, cars, pokemon cards, sports cards,
// diabetic supplies, sneakers", then "we buy retro games"; "apple has sub
// categories"; coins are "in the gold category or silver category".
// Fields: cat = the gallery chip the page opens (?cat=, default id);
// under = {parent id: label} lists the page under that parent in the footers;
// parent = the breadcrumb parent; label = the footer text; one = the name
// as a word before "ad" ("a console ad"), when it is not the name itself.
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SITE = 'https://buybackad-graphics-studio.netlify.app';
const root = fileURLToPath(new URL('..', import.meta.url));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const strip = (h) => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&rsquo;/g, '’').replace(/&ldquo;|&rdquo;/g, '"').replace(/&eacute;/g, 'é').replace(/&times;/g, '×').replace(/&rsaquo;/g, '›');

const CATS = [
  {
    id: 'apple', slug: 'we-buy-apple', name: 'Apple', cat: 'phones', title: 'We Buy Apple ad templates',
    h1: '&ldquo;We Buy Apple&rdquo; ad templates',
    desc: 'Make a We Buy Apple ad for iPhones, iPads, MacBooks, Apple Watch and AirPods: pick a template, add your number and area, download a post-ready image. Every iPhone, iPad, MacBook and Apple Watch design is free.',
    who: 'resellers and repair shops who buy iPhones, iPads, MacBooks, Apple Watch and AirPods from the public',
    art: ['qs-set-apple-lineup', 'bundle-apple-quad'],
    subsTitle: 'Ads for each Apple device',
    put: [
      'Which Apple devices you take, by name: iPhone, iPad, MacBook, Apple Watch, AirPods.',
      'The conditions you take (cracked, locked to a carrier, not turning on), and whether it needs to be signed out of iCloud.',
      'How you pay, and whether you meet up or pick up.',
      'Your phone number, big enough to read on a phone screen, and your area.',
    ],
    faq: [
      ['Are the Apple templates free?', 'The iPhone, iPad, MacBook and Apple Watch designs are in the Phones & Devices category, and every design there is on the free plan. AirPods designs are in Headphones & Audio, where the top 3 are free. The free plan gives you 3 photo downloads a week at 1080 pixels with a BUYBACK.AD watermark; a paid plan removes the watermark and raises the limit.'],
      ['Can I name Apple on my ad?', 'Naming the devices you buy, like iPhone or MacBook, tells sellers what you take. Do not add the Apple logo or make the ad look as if it comes from Apple.'],
    ],
    free: 'Every iPhone, iPad, MacBook and Apple Watch design is on the free plan.',
  },
  {
    id: 'iphone', slug: 'we-buy-iphones', name: 'iPhones', one: 'iPhone', cat: 'phones', parent: 'apple', under: { apple: 'iPhone' },
    title: 'We Buy iPhones ad templates',
    h1: '&ldquo;We Buy iPhones&rdquo; ad templates',
    desc: 'Make a We Buy iPhones ad in about a minute: pick a template, add your number and area, download a square image for Marketplace, OfferUp or Instagram. Every iPhone design is free.',
    who: 'phone buyers, repair shops and trade-in resellers who buy used and cracked iPhones',
    art: ['ip-group-colour-lineup', 'iphones-trio'],
    put: [
      'Which models you take, for example iPhone 11 and newer, every size.',
      'The conditions you take: cracked screens, locked to a carrier, not turning on.',
      'What the seller should send you: model, storage and carrier.',
      'How you pay, your phone number and your area.',
    ],
    faq: [
      ['Are the iPhone templates free?', 'Yes. The iPhone designs are in the Phones & Devices category, and every design there is on the free plan. The free plan gives you 3 photo downloads a week at 1080 pixels with a BUYBACK.AD watermark; a paid plan removes the watermark and raises the limit.'],
      ['Can I show a price on the ad?', 'You can type any headline or line of text you like. If you print a price, make sure it is one you will pay, because the ad is yours and so is the promise.'],
    ],
    free: 'Every iPhone design is on the free plan.',
  },
  {
    id: 'ipad', slug: 'we-buy-ipads', name: 'iPads', one: 'iPad', cat: 'phones', parent: 'apple', under: { apple: 'iPad' },
    title: 'We Buy iPads ad templates',
    h1: '&ldquo;We Buy iPads&rdquo; ad templates',
    desc: 'Make a We Buy iPads ad for iPad, iPad mini, iPad Air and iPad Pro: pick a template, add your number and area, download a post-ready image. Every iPad design is free.',
    who: 'resellers and repair shops who buy used and cracked iPads',
    art: ['ipad-pair-sizes', 'ipad-front-screen-off'],
    put: [
      'Which iPads you take: iPad, iPad mini, iPad Air, iPad Pro.',
      'Whether you take cracked screens, and Wi-Fi or cellular models.',
      'What the seller should send you: model, size and storage.',
      'How you pay, your phone number and your area.',
    ],
    faq: [
      ['Are the iPad templates free?', 'Yes. The iPad designs are in the Phones & Devices category, and every design there is on the free plan.'],
      ['Can I add my own photo of an iPad?', 'Yes. Upload a photo as the background (iPhone HEIC photos work), then blur or tint it so the text stays readable.'],
    ],
    free: 'Every iPad design is on the free plan.',
  },
  {
    id: 'mac', slug: 'we-buy-macbooks', name: 'MacBooks', one: 'MacBook', cat: 'phones', parent: 'apple', under: { apple: 'MacBook' },
    title: 'We Buy MacBooks ad templates',
    h1: '&ldquo;We Buy MacBooks&rdquo; ad templates',
    desc: 'Make a We Buy MacBooks ad for MacBook Air and MacBook Pro: pick a template, add your number and area, download a post-ready image. Every MacBook design is free.',
    who: 'computer buyers and resellers who buy used and damaged MacBook Air and MacBook Pro laptops',
    art: ['photo-macbook-air-m2-starlight', 'qs-family-macbook-pro--silver'],
    put: [
      'Which MacBooks you take, for example MacBook Air and MacBook Pro, M1 and newer.',
      'Whether you take damaged screens, and whether it needs to be signed out of iCloud.',
      'What the seller should send you: the year, chip and memory.',
      'How you pay, your phone number and your area.',
    ],
    faq: [
      ['Are the MacBook templates free?', 'Yes. The MacBook designs are in the Phones & Devices category, and every design there is on the free plan.'],
      ['Can I use the same ad in a story or on a flyer?', 'Yes. Before you download, pick Square, Story 9:16, Flyer 8.5×11, Wide 16:9, Wide 4:3 or Tall 3:4.'],
    ],
    free: 'Every MacBook design is on the free plan.',
  },
  {
    id: 'watch', slug: 'we-buy-apple-watch', name: 'Apple Watch', cat: 'phones', parent: 'apple', under: { apple: 'Apple Watch' },
    title: 'We Buy Apple Watch ad templates',
    h1: '&ldquo;We Buy Apple Watch&rdquo; ad templates',
    desc: 'Make a We Buy Apple Watch ad for Apple Watch Series, SE and Ultra: pick a template, add your number and area, download a post-ready image. Every Apple Watch design is free.',
    who: 'resellers who buy used Apple Watch Series, SE and Ultra watches',
    art: ['photo-wear-watch-s10-pair', 'apple-watch-pair'],
    put: [
      'Which watches you take: Apple Watch Series, SE and Ultra.',
      'That it should be unpaired and reset, and whether you need the charger.',
      'What the seller should send you: series, size, GPS or cellular.',
      'How you pay, your phone number and your area.',
    ],
    faq: [
      ['Are the Apple Watch templates free?', 'Yes. The Apple Watch designs are in the Phones & Devices category, and every design there is on the free plan.'],
      ['Can I save my details for the next ad?', 'Yes. Save your phone number, website and area once in your brand kit and every design fills them in.'],
    ],
    free: 'Every Apple Watch design is on the free plan.',
  },
  {
    id: 'airpods', slug: 'we-buy-airpods', name: 'AirPods', cat: 'audio', catLabel: 'Headphones & Audio', parent: 'apple', under: { apple: 'AirPods' },
    title: 'We Buy AirPods ad templates',
    h1: '&ldquo;We Buy AirPods&rdquo; ad templates',
    desc: 'Make a We Buy AirPods ad for AirPods, AirPods Pro and AirPods Max: pick a template, add your number and area, download a post-ready image. Free to start.',
    who: 'resellers who buy AirPods, AirPods Pro and AirPods Max',
    art: ['photo-audio-airpods-pro', 'photo-audio-airpods-max-silver'],
    put: [
      'Which ones you take: AirPods, AirPods Pro, AirPods Max.',
      'That both buds and the case should come together, unpaired and reset.',
      'What the seller should send you: the model, and a photo of the case.',
      'How you pay, your phone number and your area.',
    ],
    faq: [
      ['Which AirPods designs are free?', 'AirPods designs are in the Headphones & Audio category, and the top 3 designs there are on the free plan. Every paid plan, from Starter at $25 a month, unlocks every design in every category.'],
      ['Can I add my own photo of the AirPods?', 'Yes. Upload a photo as the background (iPhone HEIC photos work), then blur or tint it so the text stays readable.'],
    ],
    free: 'The top 3 Headphones & Audio designs are on the free plan; every paid plan unlocks the rest.',
  },
  {
    id: 'phones', slug: 'we-buy-phones', name: 'phones', one: 'phone', title: 'We Buy Phones ad templates',
    h1: '&ldquo;We Buy Phones&rdquo; ad templates',
    desc: 'Make a We Buy iPhones ad in about a minute: pick a template, add your number and area, download a square image for Marketplace, OfferUp or Instagram. Every Phones design is free.',
    who: 'phone buyers, repair shops and trade-in resellers who buy iPhones, Samsung Galaxy, Google Pixel and foldable phones from the public',
    art: ['android-trio', 'iphone-cracked'],
    put: [
      'What you buy, in the words a seller searches: iPhone, Samsung Galaxy, Google Pixel, Galaxy Z Fold and Flip.',
      'The conditions you take (new, used, cracked screen, not turning on), and anything you do not buy, so the wrong sellers do not text.',
      'How you pay: cash, Zelle and the like, and whether you meet up or pick up.',
      'Your phone number, big enough to read on a phone screen, and your area.',
    ],
    faq: [
      ['Are the phone templates free?', 'Yes. Every design in the Phones category is included on the free plan. The free plan gives you 3 photo downloads a week at 1080 pixels with a BUYBACK.AD watermark; a paid plan removes the watermark and raises the limit.'],
      ['Can I show a price on the ad?', 'You can type any headline or line of text you like. If you print a price, make sure it is one you will pay, because the ad is yours and so is the promise.'],
    ],
    free: 'Every Phones design is on the free plan.',
  },
  {
    id: 'consoles', slug: 'we-buy-consoles', name: 'consoles', one: 'console', cat: 'gaming', catLabel: 'Gaming & Consoles', title: 'We Buy Consoles ad templates',
    h1: '&ldquo;We Buy Consoles&rdquo; ad templates',
    desc: 'Make a We Buy Consoles ad for PS5, Xbox and Nintendo Switch: pick a template, add your number and area, download a post-ready image. Free to start.',
    who: 'game stores and resellers who buy PlayStation, Xbox and Nintendo Switch consoles, controllers, VR headsets and PC handhelds',
    art: ['photo-gaming-ps5-white', 'photo-gaming-xbox-series-x'],
    put: [
      'What you take: PS5, Xbox Series X and S, Nintendo Switch, controllers, VR headsets.',
      'Whether you need the controller, cables and dock with it, and that it should be signed out of the seller’s account.',
      'What the seller should send you: model, storage, disc or digital.',
      'How you pay, your phone number and your area.',
    ],
    faq: [
      ['Which console designs are free?', 'Console designs are in the Gaming & Consoles category, and the top 3 designs there are on the free plan. Every paid plan, from Starter at $25 a month, unlocks every design in every category.'],
      ['Are there retro game designs?', 'Not yet; they are being made. Until then, start from a Gaming & Consoles design, upload your own photo as the background and change the headline.'],
    ],
    free: 'The top 3 Gaming & Consoles designs are on the free plan; every paid plan unlocks the rest.',
  },
  {
    id: 'computers', slug: 'we-buy-computers', name: 'computers', one: 'computer', catLabel: 'Computers & Parts', title: 'We Buy Computers ad templates',
    h1: '&ldquo;We Buy Computers&rdquo; ad templates',
    desc: 'Make a We Buy Computers ad for laptops, monitors, mini PCs and SSDs: pick a template, add your number and area, download a post-ready image. Free to start.',
    who: 'computer buyers and resellers who buy laptops, monitors, mini PCs, SSDs and sealed Chromebooks',
    art: ['laptop-windows-open', 'laptop-gaming-open'],
    put: [
      'What you take: Windows laptops, gaming laptops, monitors, mini PCs, SSDs, sealed Chromebooks.',
      'That it should be signed out and wiped, and whether you need the charger or power supply.',
      'What the seller should send you: model, chip and memory.',
      'How you pay, your phone number and your area.',
    ],
    faq: [
      ['Which computer designs are free?', 'Computer designs are in the Computers & Parts category, and the top 3 designs there are on the free plan. Every paid plan, from Starter at $25 a month, unlocks every design in every category.'],
      ['Where are the MacBook designs?', 'MacBooks have their own designs with the other Apple devices, in Phones & Devices, and every one of them is on the free plan.'],
    ],
    free: 'The top 3 Computers & Parts designs are on the free plan; every paid plan unlocks the rest.',
  },
  {
    id: 'gold', slug: 'we-buy-gold', name: 'gold', title: 'We Buy Gold ad templates',
    h1: '&ldquo;We Buy Gold&rdquo; ad templates',
    desc: 'Make a We Buy Gold ad for scrap gold and jewelry: pick a template, add your number and area, download a post-ready image. Free to start.',
    who: 'gold buyers, jewelers and pawn shops who buy scrap gold, broken chains, rings and other jewelry',
    art: ['gold-bars', 'gold-jewelry'],
    put: [
      'What you take: scrap gold, broken chains, rings, class rings, coins or bars.',
      'How the price is worked out, for example weighed and tested in front of the seller, if that is how you work.',
      'How you pay and where you meet or where your shop is.',
      'Your phone number and your area.',
    ],
    faq: [
      ['Do I need a licence to advertise buying gold?', 'Rules for buying precious metals and secondhand jewelry differ by state and city, and some places require a licence or a hold period. Check yours; the studio makes the ad, it does not check the law for you.'],
      ['Which gold designs are free?', 'The top 3 designs in the Gold category are on the free plan. Every paid plan, from Starter at $25 a month, unlocks every design in every category.'],
    ],
    free: 'The top 3 Gold designs are on the free plan; every paid plan unlocks the rest.',
  },
  {
    id: 'silver', slug: 'we-buy-silver', name: 'silver', title: 'We Buy Silver ad templates',
    h1: '&ldquo;We Buy Silver&rdquo; ad templates',
    desc: 'Make a We Buy Silver ad for sterling flatware, bullion and silver coins: pick a template, add your number, download. Free to start.',
    who: 'silver buyers and coin shops who buy sterling flatware, bullion, silver coins and silver jewelry',
    art: ['silver-bars', 'silver-flatware'],
    put: [
      'What you take: sterling flatware and tea sets, bars and rounds, silver coins, jewelry.',
      'Whether you buy whole estates or single pieces.',
      'How you pay and where you meet.',
      'Your phone number and your area.',
    ],
    faq: [
      ['Which silver designs are free?', 'The top 3 designs in the Silver category are on the free plan. Every paid plan, from Starter at $25 a month, unlocks every design in every category.'],
      ['Can I add my own photo of the silver?', 'Yes. Upload a photo as the background (iPhone HEIC photos work), then blur or tint it so the text stays readable.'],
    ],
    free: 'The top 3 Silver designs are on the free plan; every paid plan unlocks the rest.',
  },
  {
    id: 'coins', slug: 'we-buy-coins', name: 'coins', one: 'coin', under: { gold: 'Gold coins', silver: 'Silver coins' },
    title: 'We Buy Coins ad templates',
    h1: '&ldquo;We Buy Coins&rdquo; ad templates',
    desc: 'Make a We Buy Coins ad for rare coins and collections: pick a template, add your number and area, download a post-ready image. Free to start.',
    who: 'coin dealers and collectors who buy rare coins, collections, proof sets and graded coins',
    art: ['coin-stack', 'coin-slab'],
    put: [
      'What you take: old coins, collections, proof and mint sets, graded coins.',
      'Whether you give free appraisals or visit to look at a collection.',
      'How you pay.',
      'Your phone number and your area.',
    ],
    faq: [
      ['Which coin designs are free?', 'The top 3 designs in the Rare Coins category are on the free plan. Every paid plan, from Starter at $25 a month, unlocks every design in every category.'],
      ['Can I use the same ad in a story or on a flyer?', 'Yes. Before you download, pick Square, Story 9:16, Flyer 8.5×11, Wide 16:9, Wide 4:3 or Tall 3:4.'],
    ],
    free: 'The top 3 Rare Coins designs are on the free plan; every paid plan unlocks the rest.',
  },
  {
    id: 'cars', slug: 'we-buy-cars', name: 'cars', one: 'car', title: 'We Buy Cars ad templates',
    h1: '&ldquo;We Buy Cars&rdquo; ad templates',
    desc: 'Make a We Buy Cars ad for used, junk and damaged cars and trucks: pick a template, add your number and area, download. Free to start.',
    who: 'car buyers, dealers and junk-car buyers who buy used, damaged or non-running cars and trucks',
    art: ['car-front', 'car-keys'],
    put: [
      'What you take: running or not, damaged, high mileage, trucks and vans.',
      'Whether you tow or pick up, and whether you need a title.',
      'How you pay.',
      'Your phone number and your area.',
    ],
    faq: [
      ['Do I need to mention the title?', 'Many sellers ask. The rules on buying a vehicle without a title differ by state, so say what you need on the ad and check your state before you promise otherwise.'],
      ['Which car designs are free?', 'The top 3 designs in the Cars & Trucks category are on the free plan. Every paid plan, from Starter at $25 a month, unlocks every design in every category.'],
    ],
    free: 'The top 3 Cars & Trucks designs are on the free plan; every paid plan unlocks the rest.',
  },
  {
    id: 'pokemon', slug: 'we-buy-pokemon-cards', name: 'Pokémon cards', one: 'Pokémon card', title: 'We Buy Pokémon Cards ad templates',
    h1: '&ldquo;We Buy Pok&eacute;mon Cards&rdquo; ad templates',
    desc: 'Make a We Buy Pokémon Cards ad for collections, sealed product and graded cards: pick a template, add your number, download. Free to start.',
    who: 'card shops and collectors who buy Pokémon collections, sealed product and graded cards',
    art: ['poke-cards-fan', 'poke-slab'],
    put: [
      'What you take: bulk collections, holos, sealed booster boxes, graded slabs.',
      'Whether you buy whole binders or single cards.',
      'How you pay and where you meet.',
      'Your phone number and your area.',
    ],
    faq: [
      ['Which Pokémon designs are free?', 'The top 3 designs in the Pokémon Cards category are on the free plan. Every paid plan, from Starter at $25 a month, unlocks every design in every category.'],
      ['Can I use Pokémon artwork on my ad?', 'Only use pictures you have the right to use. The studio’s own card pictures are generic product shots; if you upload artwork, the rights are yours to check.'],
    ],
    free: 'The top 3 Pokémon Cards designs are on the free plan; every paid plan unlocks the rest.',
  },
  {
    id: 'sports', slug: 'we-buy-sports-cards', name: 'sports cards', one: 'sports card', title: 'We Buy Sports Cards ad templates',
    h1: '&ldquo;We Buy Sports Cards&rdquo; ad templates',
    desc: 'Make a We Buy Sports Cards ad for collections, rookies and graded cards: pick a template, add your number and area, download. Free to start.',
    who: 'card shops and collectors who buy baseball, basketball, football and other sports cards',
    art: ['sports-cards', 'sports-slab'],
    put: [
      'What you take: collections, rookies, vintage, graded slabs, sealed wax.',
      'Whether you buy whole collections or single cards.',
      'How you pay and where you meet.',
      'Your phone number and your area.',
    ],
    faq: [
      ['Which sports card designs are free?', 'The top 3 designs in the Sports Cards category are on the free plan. Every paid plan, from Starter at $25 a month, unlocks every design in every category.'],
      ['Will the ad name my town?', 'If you give the studio your ZIP code or city, templates with a service-area line name the towns around you. It is looked up in your browser and saved on your device.'],
    ],
    free: 'The top 3 Sports Cards designs are on the free plan; every paid plan unlocks the rest.',
  },
  {
    id: 'strips', slug: 'we-buy-test-strips', name: 'diabetic supplies', one: 'diabetic supplies', title: 'We Buy Diabetic Test Strips ad templates',
    h1: '&ldquo;We Buy Test Strips&rdquo; ad templates',
    desc: 'Make a We Buy Diabetic Test Strips ad: pick a template, add your number and area, download a post-ready image. Check each marketplace’s rules before posting.',
    who: 'buyers of unused diabetic test strips, CGM sensors and other diabetic supplies',
    art: ['strip-boxes', 'strip-kit'],
    put: [
      'What you take, for example sealed, unexpired boxes of test strips or sensors, and the brands you buy.',
      'How you pay and whether you pick up.',
      'Your phone number and your area.',
    ],
    faq: [
      ['Can I post this ad on any marketplace?', 'Not always. Some marketplaces restrict ads for buying or selling medical supplies, so read the rules of the place you post before you publish. The studio makes the image; where you may post it is up to each platform.'],
      ['Which diabetic supply designs are free?', 'The top 3 designs in the Diabetic Supplies category are on the free plan. Every paid plan, from Starter at $25 a month, unlocks every design in every category.'],
    ],
    free: 'The top 3 Diabetic Supplies designs are on the free plan; every paid plan unlocks the rest.',
  },
  {
    id: 'sneakers', slug: 'we-buy-sneakers', name: 'sneakers', one: 'sneaker', soon: true, title: 'We Buy Sneakers ad templates',
    h1: '&ldquo;We Buy Sneakers&rdquo; ad templates',
    desc: 'Sneaker designs for We Buy ads are being made. Until they are ready, make a We Buy Sneakers ad in the studio with your own photo, your number and your area.',
    who: 'sneaker resellers and consignment shops who buy new and worn sneakers',
    art: [],
    put: [
      'What you take: new in the box, worn, rare pairs, and the sizes you buy.',
      'Whether you need the box and receipt, and whether you check pairs in person.',
      'How you pay and where you meet.',
      'Your phone number and your area.',
    ],
    faq: [
      ['When are the sneaker designs coming?', 'They are being made now, and this page will link to them once they are in the studio. Until then you can make a sneaker ad from a design in the studio with your own photo.'],
      ['Can I put brand logos on my ad?', 'Only use pictures you have the right to use. Naming the brands you buy tells sellers what you take; a logo you did not make is not yours to put on an ad.'],
    ],
    free: 'Every Phones & Devices design, and the top 3 of every other category, is on the free plan.',
  },
  {
    id: 'retro', slug: 'we-buy-retro-games', name: 'retro games', one: 'retro game', soon: true, cat: 'gaming', catLabel: 'Gaming & Consoles', title: 'We Buy Retro Games ad templates',
    h1: '&ldquo;We Buy Retro Games&rdquo; ad templates',
    desc: 'Retro game designs for We Buy ads are being made. Until they are ready, start from a console design in the studio with your own photo, your number and your area.',
    who: 'game stores and collectors who buy retro consoles, cartridges and games',
    art: [],
    put: [
      'What you take: older consoles, cartridges, discs, handhelds and boxed games.',
      'Whether you buy loose games or only complete in the box, and whether you buy whole collections.',
      'How you pay and where you meet.',
      'Your phone number and your area.',
    ],
    faq: [
      ['When are the retro game designs coming?', 'They are being made now, and this page will link to them once they are in the studio. Until then you can start from a Gaming & Consoles design with your own photo.'],
      ['Can I use game artwork on my ad?', 'Only use pictures you have the right to use. A photo you took of your own stock is the safest choice.'],
    ],
    free: 'The top 3 Gaming & Consoles designs are on the free plan; every paid plan unlocks the rest.',
  },
];

const COMMON_FAQ = [
  ['Is it free?', 'You can design without an account. Downloading needs a free account: 3 photo downloads a week at 1080 pixels with a BUYBACK.AD watermark. Starter is $25 a month for 100 photo downloads up to 2160 pixels, no watermark, every design. Pro ($60) adds 30 video ads a month beside 500 photo downloads; Business ($100) is unlimited photos and video.'],
];

/* ── THE TRADE'S WORDS (2026-11-18, DESIGN-LAW 146). Each category page's title, description and
   h1, in what resellers type ("we buy iPhones ad", "cash for gold flyer", "phone buyback ad
   maker"). A title stays under 60 characters and a description under 160, so a result shows them
   whole; the brand closes every title. The ad is the line's full ad (scripts/build_og_cards.mjs). */
const SEO = {
  apple:     { t: 'We Buy Apple Ads: iPhone, iPad and MacBook Flyers', d: 'Make a We Buy Apple ad or flyer for iPhones, iPads, MacBooks, Apple Watch and AirPods. Add your number and area, download, post. Free to start.' },
  iphone:    { t: 'We Buy iPhones Ad and Flyer Maker', d: 'Make a We Buy iPhones ad or flyer in a minute. Add your number and area, download a post for Marketplace, Instagram or OfferUp. Every iPhone design is free.' },
  ipad:      { t: 'We Buy iPads Ad and Flyer Maker', d: 'Make a We Buy iPads ad or flyer for iPad, iPad mini, iPad Air and iPad Pro. Add your number and area, download, post. Every iPad design is free.' },
  mac:       { t: 'We Buy MacBooks Ad and Flyer Maker', d: 'Make a We Buy MacBooks ad or flyer for MacBook Air and MacBook Pro. Add your number and area, download, post. Every MacBook design is free.' },
  watch:     { t: 'We Buy Apple Watch Ad and Flyer Maker', d: 'Make a We Buy Apple Watch ad or flyer for Series, SE and Ultra. Add your number and area, download, post. Every Apple Watch design is free.' },
  airpods:   { t: 'We Buy AirPods Ad and Flyer Maker', d: 'Make a We Buy AirPods ad or flyer for AirPods, AirPods Pro and AirPods Max. Add your number and area, download, post. Free to start.' },
  phones:    { t: 'Phone Buyback Ad Maker: We Buy Phones Flyers', h1: '&ldquo;We Buy Phones&rdquo; ads and cash for phones flyers', d: 'Make a phone buyback ad or cash for phones flyer for iPhone, Galaxy and Pixel. Add your number and area, download, post. Every phone design is free.' },
  consoles:  { t: 'We Buy Consoles Ad Maker: PS5, Xbox and Switch', d: 'Make a We Buy Consoles ad or flyer for PS5, Xbox and Nintendo Switch. Add your number and area, download, post. Free to start.' },
  computers: { t: 'We Buy Computers and Laptops Ad Maker', d: 'Make a We Buy Computers ad or flyer for laptops, monitors, mini PCs and SSDs. Add your number and area, download, post. Free to start.' },
  gold:      { t: 'Cash for Gold Flyer and We Buy Gold Ad Maker', h1: '&ldquo;We Buy Gold&rdquo; ads and cash for gold flyers', d: 'Make a cash for gold flyer or We Buy Gold ad for scrap gold and jewelry. Add your number and area, download, post. Free to start.' },
  silver:    { t: 'We Buy Silver Ad and Cash for Silver Flyer', h1: '&ldquo;We Buy Silver&rdquo; ads and cash for silver flyers', d: 'Make a cash for silver flyer or We Buy Silver ad for coins, bars, silverware and jewelry. Add your number and area, download, post. Free to start.' },
  coins:     { t: 'We Buy Coins Ad and Coin Buyer Flyer Maker', d: 'Make a We Buy Coins ad or coin buyer flyer for old coins, silver dollars and collections. Add your number and area, download, post. Free to start.' },
  cars:      { t: 'We Buy Cars Ad Maker: Cash for Cars Flyers', h1: '&ldquo;We Buy Cars&rdquo; ads and cash for cars flyers', d: 'Make a cash for cars flyer or We Buy Cars ad for used, junk and damaged cars and trucks. Add your number and area, download, post. Free to start.' },
  pokemon:   { t: 'We Buy Pokémon Cards Ad and Flyer Maker', d: 'Make a We Buy Pokémon Cards ad or flyer for singles, slabs and sealed boxes. Add your number and area, download, post. Free to start.' },
  sports:    { t: 'We Buy Sports Cards Ad and Flyer Maker', d: 'Make a We Buy Sports Cards ad or flyer for rookies, autos, slabs and sealed wax. Add your number and area, download, post. Free to start.' },
  strips:    { t: 'We Buy Test Strips Ad and Flyer Maker', d: 'Make a We Buy Test Strips ad or flyer for sealed, unexpired diabetic test strips. Add your number and area, download, post. Free to start.' },
  sneakers:  { t: 'We Buy Sneakers Ad and Flyer Maker', d: 'Make a We Buy Sneakers ad or flyer today with your own photo of the pairs you buy. Add your number and area, download, post. Free to start.' },
  retro:     { t: 'We Buy Retro Games Ad and Flyer Maker', d: 'Make a We Buy Retro Games ad or flyer today with your own photo of the games you buy. Add your number and area, download, post. Free to start.' },
};
const BRAND = 'BUYBACK.AD', APP = 'BUYBACK.AD Graphics Studio';
const TODAY = (process.argv.find((a) => a.startsWith('--date=')) || '').slice(7) || new Date().toISOString().slice(0, 10);
const { readFileSync, existsSync, statSync } = await import('node:fs');
const titleOf = (c) => `${(SEO[c.id] || {}).t || strip(c.title)} | ${BRAND}`;
const descOf = (c) => (SEO[c.id] || {}).d || c.desc;
const h1Of = (c) => (SEO[c.id] || {}).h1 || c.h1.replace(/ ad templates$/, ' ads and flyers');
const nameOf = (c) => strip(h1Of(c)).replace(/["\u201c\u201d]/g, '');
const adOf = (c) => existsSync(root + `assets/full-ads/${c.slug}.webp`) ? c.slug : '';
const ogOf = (c) => existsSync(root + `assets/og/${c.slug}.jpg`) ? `${SITE}/assets/og/${c.slug}.jpg` : `${SITE}/assets/og/buybackad-og.jpg`;
for (const c of CATS) {
  const t = titleOf(c), d = descOf(c);
  if (t.length > 62) throw new Error(`${c.id}: title is ${t.length} characters`);
  if (d.length > 160) throw new Error(`${c.id}: description is ${d.length} characters`);
  if (/[–—]/.test(t + d)) throw new Error(`${c.id}: a dash in the title or description (rule 55)`);
}

/* the bar and the foot of every information page (pages.css), the house look */
const NAV = [['index.html#lp-templates', 'Templates'], ['motion/', 'Video ads'], ['looks.html', 'Look Book'], ['index.html#pricing', 'Pricing'], ['about.html', 'About']];
const nav = (up, here = '') => `<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <a class="brand" href="${up}index.html" aria-label="BUYBACK.AD home"><span class="w">BUYBACK<em>.AD</em></span><span class="s">Graphics Studio</span></a>
  <nav aria-label="Site">
    ${NAV.map(([h, t]) => `<a href="${up}${h}"${h === here ? ' aria-current="page"' : ''}>${t}</a>`).join('\n    ')}
  </nav>
  <a class="btn" href="${up}index.html">Make my ad</a>
</header>`;

const byId = Object.fromEntries(CATS.map((c) => [c.id, c]));
const top = CATS.filter((c) => !c.under);
const subsOf = (c) => CATS.filter((s) => s.under && s.under[c.id]);
const label = (c) => c.label || `We buy ${c.name}`;
const one = (c) => c.one || c.name;
const an = (w) => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
const gallery = (c) => c.catLabel || c.name;

/* the "Ad templates" list: each top line in its own group, its sub-lines in
   one wrapping row under it, so a list set in columns never parts a line from
   its sub-lines (the pages' footers and index.html's; each page names its own classes) */
const catList = (up, { grp, subs }, pad = '    ') => top.map((c) => {
  const kids = subsOf(c);
  const a = `<a href="${up}ads/${c.slug}.html">${esc(label(c))}</a>`;
  const row = kids.length ? `<div class="${subs}">` + kids.map((k) => `<a href="${up}ads/${k.slug}.html">${esc(k.under[c.id])}</a>`).join('') + '</div>' : '';
  return `<div class="${grp}">${a}${row}</div>`;
}).join(`\n${pad}`);

const footer = (up) => `<footer class="bottom">
  <div class="foot-brand"><span class="w">BUYBACK<em>.AD</em></span><span class="s">We Buy ads, flyers and video ads for resellers.</span></div>
  <div class="cats">${catList(up, { grp: 'cat-grp', subs: 'cat-sub' })}</div>
  <nav class="foot-links" aria-label="More">
    <a href="${up}index.html">Make an ad</a>
    <a href="${up}motion/">Video ads</a>
    <a href="${up}looks.html">Look Book</a>
    <a href="${up}learn.html">How it works</a>
    <a href="${up}about.html">About</a>
    <a href="${up}index.html#pricing">Pricing</a>
    <a href="${up}index.html#faq">FAQ</a>
    <a href="${up}terms.html">Terms</a>
    <a href="${up}privacy.html">Privacy</a>
    <a href="${up}llms.txt">llms.txt</a>
  </nav>
  <span class="copy">&copy; 2026 BUYBACK.AD</span>
</footer>`;

/* the three steps a category page shows: the same words in the list and in its HowTo */
function stepsOf(c) {
  const gal = esc(gallery(c));
  return c.soon ? [
    ['Pick a design', `${c.cat ? `Open the ${gal} designs` : 'Open the gallery'} and click one. A design without a product picture in front works best.`],
    ['Make it yours', `Upload your own photo of the ${esc(c.name)} as the background (iPhone HEIC photos work), then type your headline, your phone number and your ZIP or city.`],
    ['Download and post', `Choose a size (square for feeds, 9:16 for stories, 8.5&times;11 for print) and download. ${esc(c.free)}`],
  ] : [
    ['Pick a design', `Open the ${gal} designs and click one. It opens in the studio with its colours, product picture and copy already in place.`],
    ['Type your details', 'Your phone number, website if you have one, and your ZIP or city. Save them once in your brand kit and every design fills them in.'],
    ['Download and post', `Choose a size (square for feeds, 9:16 for stories, 8.5&times;11 for print) and download. ${esc(c.free)}`],
  ];
}
const howTo = (name, steps, url) => ({ '@type': 'HowTo', '@id': url + '#how', name, totalTime: 'PT1M',
  step: steps.map(([n, t], i) => ({ '@type': 'HowToStep', position: i + 1, name: strip(n), text: strip(t) })) });

/* one head for every page: title, description, canonical, the full preview card */
function seoHead({ title, desc, url, image, imageAlt, ogTitle, ogDesc, type = 'website', robots = 'index, follow, max-image-preview:large', ld }) {
  return `<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="${robots}">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="${BRAND}">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="${esc(ogTitle || title.replace(/ \| BUYBACK\.AD$/, ''))}">
<meta property="og:description" content="${esc(ogDesc || desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(imageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(ogTitle || title.replace(/ \| BUYBACK\.AD$/, ''))}">
<meta name="twitter:description" content="${esc(ogDesc || desc)}">
<meta name="twitter:image" content="${image}">
<meta name="twitter:image:alt" content="${esc(imageAlt)}">
${ld ? `<script type="application/ld+json" id="ld-page">${JSON.stringify(ld)}</script>\n` : ''}`;
}
const ORG = { '@id': SITE + '/#org' }, WEBSITE = { '@id': SITE + '/#site' }, APPREF = { '@id': SITE + '/#app' };
const webPage = (url, name, desc, extra = {}) => ({ '@type': 'WebPage', '@id': url + '#page', url, name, description: desc, isPartOf: WEBSITE, about: APPREF, publisher: ORG, inLanguage: 'en', ...extra });

const adAlt = (c) => `A full ad made with BUYBACK.AD: ${strip(c.title).replace(/ ad templates$/, '').toUpperCase()}, with the number in a pill and the towns after a pin`;

function page(c) {
  const url = `${SITE}/ads/${c.slug}.html`;
  const faq = [...c.faq, ...COMMON_FAQ];
  const parent = c.parent && byId[c.parent];
  const crumbs = [{ name: BRAND, item: SITE + '/' }];
  if (parent) crumbs.push({ name: nameOf(parent), item: `${SITE}/ads/${parent.slug}.html` });
  crumbs.push({ name: nameOf(c), item: url });
  const steps = stepsOf(c), ad = adOf(c), title = titleOf(c), desc = descOf(c);
  const ld = { '@context': 'https://schema.org', '@graph': [
    webPage(url, title, desc, { breadcrumb: { '@id': url + '#crumbs' }, ...(ad ? { primaryImageOfPage: { '@id': url + '#ad' } } : {}) }),
    ...(ad ? [{ '@type': 'ImageObject', '@id': url + '#ad', url: `${SITE}/assets/full-ads/${ad}.webp`, contentUrl: `${SITE}/assets/full-ads/${ad}.webp`, width: 720, height: 720, caption: adAlt(c) }] : []),
    { '@type': 'BreadcrumbList', '@id': url + '#crumbs', itemListElement: crumbs.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.name, item: x.item })) },
    howTo(`How to make ${an(strip(c.title).replace(/ ad templates$/, ''))} ad`, steps, url),
    { '@type': 'FAQPage', '@id': url + '#faq', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ] };
  const cat = c.cat || c.id;
  const kids = subsOf(c);
  const pick = c.soon ? (c.cat ? `../index.html?cat=${cat}` : '../index.html#lp-templates') : `../index.html?cat=${cat}`;
  const cta = c.soon ? (c.cat ? `Start from a ${gallery(c)} design` : 'Browse the designs') : `See the ${gallery(c)} designs`;
  const art = ad
    ? `<figure class="ad-art"><img src="../assets/full-ads/${ad}.webp" width="720" height="720" fetchpriority="high" alt="${esc(adAlt(c))}"><figcaption>A full ad for this line, made in the studio. Yours carries your number and your towns.</figcaption></figure>`
    : (c.art.length ? `<div class="hero-art">${c.art.map((a) => `<img src="../assets/cutouts/${a}.webp" alt="" loading="lazy" width="400" height="400">`).join('')}</div>` : '');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- Generated by scripts/build_seo_pages.mjs. Edit there, not here. -->
${seoHead({ title, desc, url, image: ogOf(c), imageAlt: ad ? adAlt(c) : 'BUYBACK.AD: We Buy ads and flyers, ready in a minute' })}<meta name="theme-color" content="#031b56" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#e2e8f3" media="(prefers-color-scheme: light)">
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<link rel="preload" href="../assets/fonts/chivo-900.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="../pages.css">
<script src="../site-theme.js"></script>
</head>
<body>
${nav('../')}
<main id="main">
  <div class="crumbs"><a href="../index.html">${BRAND}</a> &rsaquo; ${parent ? `<a href="${parent.slug}.html">${esc(nameOf(parent))}</a> &rsaquo; ` : ''}${esc(nameOf(c))}</div>
  <div class="page-hero${ad ? ' with-ad' : ''}">
  <div class="page-hero-copy">
  <span class="badge">${esc(strip(c.title).replace(/ ad templates$/, ' ads'))}</span>
  <h1>${h1Of(c)}</h1>
  <p class="lead">BUYBACK.AD makes buyback ads for ${esc(c.who)}. Pick a design, type your phone number and area, and download an image ready for Facebook Marketplace, OfferUp, Craigslist, Instagram or a printed flyer.</p>
  ${c.soon ? `<p class="card"><strong>${esc(one(c)[0].toUpperCase() + one(c).slice(1))} designs are on the way.</strong> Until they are in the studio, you can make ${an(esc(one(c)))} ad today from ${c.cat ? `a ${esc(gallery(c))} design` : 'any design'} with your own photo as the background. This page will link to the ${esc(one(c))} designs when they are ready.</p>\n  ` : ''}<div class="ctas">
    <a class="btn" href="${pick}">${esc(cta)}</a>
    ${['apple', 'iphone', 'phones'].includes(c.id) ? '<a class="btn ghost" href="../motion/">Make a phone video ad</a>' : ''}
    <a class="btn ghost" href="../index.html#pricing">Pricing</a>
  </div>
  </div>
  ${art}
  </div>
${kids.length ? `
  <h2>${esc(c.subsTitle || `More ${c.name} ads`)}</h2>
  <ul class="tidy">${kids.map((k) => `<li><a href="${k.slug}.html">${esc(nameOf(k))}</a></li>`).join('\n    ')}</ul>
` : ''}
  <h2>How it works</h2>
  <ol class="steps">${steps.map(([n, t]) => `\n    <li><strong>${n}.</strong> ${t}</li>`).join('')}
  </ol>

  <h2>What to put on ${an(esc(one(c)))} buyback ad</h2>
  <ul class="tidy">${c.put.map((p) => `<li>${esc(p)}</li>`).join('\n    ')}</ul>
  <p>Keep it to one headline, a few short selling points and one number. People scroll past an ad in a second; the ones that get texts are readable at a glance on a phone.</p>

  <h2>Questions</h2>
  ${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n  ')}

  <div class="ctas"><a class="btn" href="${pick}">${c.soon ? esc(cta) : `Make ${an(esc(one(c)))} ad`}</a></div>
</main>
${footer('../')}
</body>
</html>
`;
}

mkdirSync(root + 'ads', { recursive: true });
for (const c of CATS) writeFileSync(root + `ads/${c.slug}.html`, page(c));
console.log('wrote', CATS.length, 'pages to ads/');

/* ── the plans, from PLANS in app.js (display copy), held to the server's table ── */
function readPlans() {
  const src = readFileSync(root + 'app.js', 'utf8');
  const block = (src.match(/\/\* PLANS:BEGIN[\s\S]*?\/\* PLANS:END \*\//) || [''])[0];
  const lit = (name) => { const m = block.match(new RegExp(`const ${name} = (\\{[\\s\\S]*?\\n\\});`)); if (!m) throw new Error(`app.js: ${name} between PLANS:BEGIN and PLANS:END was not found`); return Function(`return ${m[1]}`)(); };
  return { PLANS: lit('PLANS'), PACKS: lit('PACKS') };
}
const { PLANS, PACKS } = readPlans();
{
  const server = (await import(root + 'netlify/lib/plans.mjs')).PLANS;
  for (const [id, p] of Object.entries(PLANS)) for (const k of ['weekly', 'monthly', 'maxPx', 'watermark', 'video', 'videos', 'credits', 'library']) {
    if (!server[id] || JSON.stringify(server[id][k]) !== JSON.stringify(p[k]) || JSON.stringify(server[id].price) !== JSON.stringify(p.price)) throw new Error(`PLANS.${id}.${k}: app.js and netlify/lib/plans.mjs disagree; the JSON-LD would state a price or a limit the server does not charge`);
  }
}
const fmtN = (n) => Number(n).toLocaleString('en-US');
/* photos and videos are counted apart (2026-11-18): videos is video downloads a month, 0 none, null unlimited */
function planWords(p) {
  const photos = p.weekly ? `${p.weekly} photo downloads a week` : p.monthly ? `${fmtN(p.monthly)} photo downloads a month` : 'Unlimited photo downloads';
  const videos = !p.video ? null : p.videos == null ? 'unlimited video ads' : `${fmtN(p.videos)} video ads a month`;
  return [photos, videos, p.watermark ? `${p.maxPx} pixels with a light BUYBACK.AD watermark` : `up to ${p.maxPx} pixels, no watermark`, p.qr ? 'QR code' : null, `${p.credits} AI credits a month`, `${fmtN(p.library)} ads kept in the library`].filter(Boolean).join(', ');
}
function offers() {
  const out = [];
  for (const p of Object.values(PLANS)) {
    const base = { '@type': 'Offer', priceCurrency: 'USD', availability: 'https://schema.org/InStock', url: SITE + '/#pricing', description: planWords(p) };
    if (!p.price.month) { out.push({ ...base, name: p.label, price: '0' }); continue; }
    for (const [iv, cents, dur, unit] of [['monthly', p.price.month, 'P1M', 'MON'], ['yearly', p.price.year, 'P1Y', 'ANN']]) {
      if (!cents) continue;
      const price = String(cents / 100);
      out.push({ ...base, name: `${p.label}, ${iv}`, price, priceSpecification: { '@type': 'UnitPriceSpecification', price, priceCurrency: 'USD', billingDuration: dur, referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: unit } } });
    }
  }
  for (const k of Object.values(PACKS)) out.push({ '@type': 'Offer', name: k.label, price: String(k.price / 100), priceCurrency: 'USD', availability: 'https://schema.org/InStock', url: SITE + '/#pricing', description: `${k.credits} AI credits, bought once, never expire` });
  return out;
}

/* ── index.html: the in-page links to every line, the footer's list, the site's graph, the FAQ ── */
const decode = (t) => strip(t).replace(/&#39;/g, "'").replace(/&ntilde;/g, 'ñ').replace(/&bull;/g, '•').replace(/\s+/g, ' ').trim();
const fill = (html, name, list) => {
  const re = new RegExp(`(<!-- ${name}[^>]*-->)[\\s\\S]*?(\\s*<!-- \\/${name} -->)`);
  if (!re.test(html)) throw new Error(`no <!-- ${name} --> markers`);
  return html.replace(re, (m, a, b) => a + list + b);
};
let landingSteps = [], landingFaq = [];
{
  const f = root + 'index.html';
  let html = readFileSync(f, 'utf8');
  html = fill(html, 'ad-templates', '\n          ' + catList('', { grp: 'lpf-grp', subs: 'lpf-subs' }, '          '));
  html = fill(html, 'ad-links', '\n      ' + CATS.map((c) => `<li><a href="ads/${c.slug}.html">${esc(nameOf(c))}</a></li>`).join('\n      '));
  /* the FAQ, rebuilt from the visible rows so the two cannot disagree (structured data that
     says something the page does not is against Google's rules, and a lie besides). Edit the
     <details class="lp-faq"> rows, then run this script. */
  landingFaq = [...html.matchAll(/<details class="lp-faq"><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/g)].map((m) => [decode(m[1]), decode(m[2])]);
  const qa = landingFaq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }));
  const faqBlock = `<script type="application/ld+json" id="ld-faq">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', '@id': SITE + '/#faq', mainEntity: qa })}</script>`;
  const re = /\s*<script type="application\/ld\+json" id="ld-faq">[\s\S]*?<\/script>/g;
  let first = true;
  html = re.test(html) ? html.replace(re, (m) => { const lead = m.match(/^\s*/)[0]; if (!first) return ''; first = false; return lead + faqBlock; }) : html.replace('</head>', faqBlock + '\n</head>');
  /* the three steps the landing shows, read off the page */
  landingSteps = [...html.matchAll(/<li class="h-step">\s*<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g)].map((m) => [m[1], m[2]]);
  if (landingSteps.length !== 3) throw new Error('index.html: the three steps (li.h-step) were not found');
  const site = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Organization', '@id': SITE + '/#org', name: BRAND, url: SITE + '/', logo: { '@type': 'ImageObject', url: SITE + '/assets/brand/buybackad-logo.png', width: 512, height: 512 },
      description: 'BUYBACK.AD makes We Buy ads, flyers and video ads for people who buy phones, gold, silver, coins, cars, cards and other goods from the public and resell them.' },
    { '@type': 'WebSite', '@id': SITE + '/#site', name: BRAND, alternateName: 'Graphics Studio by BUYBACK.AD', url: SITE + '/', publisher: ORG, inLanguage: 'en' },
    { '@type': 'WebApplication', '@id': SITE + '/#app', name: APP, alternateName: ['Graphics Studio by BUYBACK.AD', 'BUYBACK.AD'], url: SITE + '/',
      applicationCategory: 'DesignApplication', applicationSubCategory: 'Ad and flyer maker', operatingSystem: 'Any, in a web browser', browserRequirements: 'A current web browser with JavaScript',
      isAccessibleForFree: true, inLanguage: ['en', 'es'], publisher: ORG, screenshot: SITE + '/assets/og/buybackad-og.jpg',
      description: 'A web app for buyback resellers. Pick a We Buy design for iPhones, phones, gold, silver, coins, cars, Pokémon cards, sports cards, test strips and more, add your phone number and area, and download a post-ready photo ad, printable flyer or video ad. The number is set big enough to read in a feed preview.',
      featureList: ['We Buy ad designs for 13 kinds of goods', 'The full ad: business name, headline, models, selling points, product, number and towns on one ad', 'Sizes: Square, Story 9:16, Tall 3:4, Wide 16:9, Wide 4:3, Flyer 8.5x11', 'Video ads in English, Spanish or both', 'Your number, area and business name filled in on every design', '31 colour sets', 'AI backgrounds'],
      offers: offers() },
    { '@type': 'WebPage', '@id': SITE + '/#page', url: SITE + '/', name: 'We Buy Ad and Flyer Maker for Resellers', isPartOf: WEBSITE, about: APPREF, publisher: ORG, inLanguage: 'en', primaryImageOfPage: { '@type': 'ImageObject', url: SITE + '/assets/og/buybackad-og.jpg', width: 1200, height: 630 } },
    howTo('How to make a We Buy ad with BUYBACK.AD', landingSteps, SITE + '/'),
  ] };
  html = html.replace(/<script type="application\/ld\+json" id="ld-site">[\s\S]*?<\/script>/, `<script type="application/ld+json" id="ld-site">${JSON.stringify(site)}</script>`);
  writeFileSync(f, html);
  console.log('index.html: FAQPage', qa.length, 'questions; offers', site['@graph'][2].offers.length, '; HowTo', landingSteps.length, 'steps; links to', CATS.length, 'lines');
}

/* ── the information pages: one head each (INFO), the shared bar and foot ── */
function mp4Seconds(file) {
  const b = readFileSync(file); const i = b.indexOf('mvhd');
  if (i < 0) return 0;
  const v = b[i + 4], ts = v === 1 ? b.readUInt32BE(i + 24) : b.readUInt32BE(i + 16), dur = v === 1 ? Number(b.readBigUInt64BE(i + 28)) : b.readUInt32BE(i + 20);
  return Math.round(dur / ts);
}
const gitDate = (rel) => { try { return execSync(`git log --diff-filter=A --format=%cs -1 -- "${rel}"`, { cwd: root }).toString().trim() || TODAY; } catch { return TODAY; } };
const { execSync } = await import('node:child_process');
function learnVideos(html) {
  return [...html.matchAll(/<section class="vid" id="([^"]+)">\s*<video[^>]*poster="([^"]+)"[^>]*src="([^"]+)"[^>]*><\/video>\s*<div>\s*<h2>([\s\S]*?)<\/h2>\s*<p>([\s\S]*?)<\/p>/g)].map((m) => {
    const secs = mp4Seconds(root + m[3]);
    return { '@type': 'VideoObject', '@id': `${SITE}/learn.html#${m[1]}`, name: decode(m[4]).replace(/^\d+\.\s*/, ''), description: decode(m[5]),
      thumbnailUrl: `${SITE}/${m[2]}`, contentUrl: `${SITE}/${m[3]}`, embedUrl: `${SITE}/learn.html#${m[1]}`, uploadDate: gitDate(m[3]), duration: `PT${secs}S`, publisher: ORG, inLanguage: 'en' };
  });
}
const INFO = [
  { file: 'about.html', up: '', here: 'about.html', path: '/about.html', title: 'About BUYBACK.AD: the We Buy Ad Maker for Resellers', desc: 'What BUYBACK.AD is, who it is for, how it works, what is free, what each plan adds and what happens to your data. We Buy ads and flyers in your browser.', og: 'buybackad-og', type: 'AboutPage' },
  { file: 'learn.html', up: '', here: '', path: '/learn.html', title: 'How BUYBACK.AD Works: Five Short Videos', desc: 'Five short videos: what BUYBACK.AD is, how to make a We Buy ad in about a minute, how to look like the real business, AI or ready-made, and what it costs.', og: 'buybackad-og', type: 'WebPage', videos: true },
  { file: 'looks.html', up: '', here: 'looks.html', path: '/looks.html', title: 'Look Book: Every We Buy Ad Look | BUYBACK.AD', desc: 'Every ready-made look in one place: video looks, photo ad designs, backgrounds and phone layouts for We Buy ads. Pick one and it opens in the editor.', og: 'buybackad-og', type: 'CollectionPage', bare: true },
  { file: 'privacy.html', up: '', here: '', path: '/privacy.html', title: 'Privacy Policy | BUYBACK.AD', desc: 'What BUYBACK.AD stores, what stays in your browser, every case where something leaves your device, the services we use, and your rights.', og: 'buybackad-og', type: 'WebPage' },
  { file: 'terms.html', up: '', here: '', path: '/terms.html', title: 'Terms of Service | BUYBACK.AD', desc: 'The terms for using BUYBACK.AD: plans, automatic renewal and cancellation, refunds, AI credits, AI-made content, acceptable use and liability.', og: 'buybackad-og', type: 'WebPage' },
  { file: 'motion/index.html', up: '../', here: 'motion/', path: '/motion/', title: 'We Buy Phones Video Ad Maker, Free to Try | BUYBACK.AD', ogTitle: 'We Buy Phones video ads, made in your browser', desc: 'Make a We Buy Phones video ad in your browser. Your headline and number land in seconds, with music, in English or Spanish. Download an MP4 with its photo.', og: 'video-ad-maker', type: 'WebPage', bare: true, alt: 'A full ad in Midnight and Cyan: SELL YOUR IPHONE, the video maker\'s house ad' },
];
for (const p of INFO) {
  const f = root + p.file;
  let html = readFileSync(f, 'utf8');
  const url = SITE + p.path;
  if (p.title.length > 62 || p.desc.length > 160 || /[–—]/.test(p.title + p.desc)) throw new Error(`${p.file}: title or description too long, or a dash`);
  const graph = [{ ...webPage(url, p.title, p.desc), '@type': p.type }];
  if (p.videos) graph[0].video = learnVideos(html);
  if (p.file === 'motion/index.html') graph.push({ '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: BRAND, item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'Video ads', item: url }] });
  const head = seoHead({ title: p.title, desc: p.desc, url, image: `${SITE}/assets/og/${p.og}.jpg`, imageAlt: p.alt || 'Three full ads made with BUYBACK.AD: We Buy iPhones, We Buy Gold, We Buy Cars', ogTitle: p.ogTitle, ld: { '@context': 'https://schema.org', '@graph': graph } });
  html = fill(html, 'seo', '\n' + head.trimEnd());
  if (!p.bare) {
    html = fill(html, 'site-nav', '\n' + nav(p.up, p.here));
    html = fill(html, 'site-footer', '\n' + footer(p.up));
  }
  writeFileSync(f, html);
  if (p.videos) console.log(`${p.file}: ${graph[0].video.length} VideoObjects (${graph[0].video.map((v) => v.duration).join(', ')})`);
}
console.log('information pages:', INFO.map((p) => p.file).join(', '));

/* ── sitemap.xml, robots.txt, llms.txt and llms-full.txt ── */
const PAGES = [
  ['/', 'assets/og/buybackad-og.jpg'], ['/motion/', 'assets/og/video-ad-maker.jpg'], ['/learn.html'], ['/about.html'], ['/looks.html'],
  ...CATS.map((c) => [`/ads/${c.slug}.html`, adOf(c) ? `assets/full-ads/${c.slug}.webp` : '']),
  ['/privacy.html'], ['/terms.html'],
];
writeFileSync(root + 'sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<!-- Written by scripts/build_seo_pages.mjs. Every public, indexable page and nothing else: the
     owner's tools (approve, pick, library, master-library, social, admin-ads, the video maker's
     sheets) and the retired phonegfx-studio.html stay out, and say noindex themselves. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${PAGES.map(([p, img]) => `  <url><loc>${SITE}${p}</loc><lastmod>${TODAY}</lastmod>${img ? `<image:image><image:loc>${SITE}/${img}</image:loc></image:image>` : ''}</url>`).join('\n')}
</urlset>
`);
writeFileSync(root + 'robots.txt', `# BUYBACK.AD (Graphics Studio). Written by scripts/build_seo_pages.mjs; edit there.
# The site is served from the Netlify address until buyback.ad answers (no DNS, checked 2026-11-18).
#
# Every crawler is welcome, search and AI alike. The owner's call, 2026-11-18: AI search and answer
# crawlers, and the crawlers that collect pages to train AI models, are all allowed. A plain summary
# for language models is at /llms.txt, the long one at /llms-full.txt.
#
# The owner's tools (approve.html, pick.html, library.html, master-library.html, /social/,
# /admin-ads/, the video maker's audit sheets) and the retired phonegfx-studio.html are not
# disallowed here on purpose: each says noindex in its own headers, and a crawler that is kept out
# never reads that, so a blocked page can still be listed from a link. /api/ has no pages.

User-agent: *
Allow: /
Disallow: /api/

# AI search and answer crawlers: allowed
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: Claude-SearchBot
User-agent: Claude-User
User-agent: PerplexityBot
User-agent: Perplexity-User
User-agent: DuckAssistBot
User-agent: MistralAI-User
Allow: /
Disallow: /api/

# AI training crawlers: allowed (the owner's call, 2026-11-18)
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: Google-Extended
User-agent: Applebot-Extended
User-agent: CCBot
User-agent: Meta-ExternalAgent
User-agent: Amazonbot
User-agent: Bytespider
User-agent: cohere-training-data-crawler
Allow: /
Disallow: /api/

Sitemap: ${SITE}/sitemap.xml
`);

const planLine = (p) => p.price.month
  ? `- ${p.label}: $${p.price.month / 100} a month or $${fmtN(p.price.year / 100)} a year. ${planWords(p)[0].toUpperCase() + planWords(p).slice(1)}.`
  : `- ${p.label}: $0. ${planWords(p)[0].toUpperCase() + planWords(p).slice(1)}. Designing needs no account; downloading needs a free account.`;
const lines = CATS.filter((c) => !c.soon).map((c) => `- [${nameOf(c)}](${SITE}/ads/${c.slug}.html): ${descOf(c)}`);
const soon = CATS.filter((c) => c.soon).map((c) => `- [${nameOf(c)}](${SITE}/ads/${c.slug}.html): ${descOf(c)}`);
const llms = `# BUYBACK.AD

> BUYBACK.AD (Graphics Studio by BUYBACK.AD) is a web app that makes "We Buy" ads for people who buy goods from the public and resell them: phone buyers, repair shops, gold, silver and coin buyers, car buyers, card shops and diabetic test strip buyers. You pick a design, type your phone number and your area, and download a post-ready photo ad, a printable flyer or a short video ad. It runs in a web browser on a phone or a computer, with nothing to install, and is free to start.

Key facts:

- What it makes: photo ads and flyers in six sizes (Square, Story 9:16, Tall 3:4, Wide 16:9, Wide 4:3, Flyer 8.5x11), video ads (MP4, with a photo of the ad for OfferUp), and the full ad, its house ad: a business name, headline, models line, three selling points, the product, the phone number and the towns on one ad, as a photo or a video, for 35 product lines.
- What it is for: 13 kinds of goods: phones and devices (iPhone, iPad, MacBook, Apple Watch, Galaxy, Pixel), gold and jewelry, silver, rare coins, cars and trucks, diabetic supplies, Pokémon cards, sports cards, gaming and consoles, headphones and audio, computers and parts, wearables and smart glasses, and cameras and drones.
- Where the ads go: Facebook (Pages, groups and paid ads), Instagram, OfferUp, Craigslist, Nextdoor and print. Each site has its own rules for buying ads; the FAQ sums them up and the customer posts the ad themselves.
- Languages: the video maker writes its words in English, Spanish or both; the photo designs are written in English and take any words typed in any language.
- Every design is checked before it is offered: the headline, the number and the button must stand out from what is behind them, and the number must read in a small feed preview. No design states invented reviews, ratings, years in business or prices.
- The customer owns the ads they make. Drafts, saved details and uploaded photos stay in the customer's browser.

## Plans

${Object.values(PLANS).map(planLine).join('\n')}
- AI credit packs: ${Object.values(PACKS).map((k) => `${k.credits} credits for $${k.price / 100}`).join(', ')}; bought credits never expire. One AI background is one credit.
- Yearly billing gets two months free. Cancel any time in billing; the plan runs to the end of the paid period.

## Make an ad

- [Make an ad](${SITE}/): the studio, the design library and the plans
- [Video ad maker](${SITE}/motion/): We Buy Phones video ads and the full ad as a video
- [Look Book](${SITE}/looks.html): every ready-made look in one place
- [How it works](${SITE}/learn.html): five short videos
- [Plans and pricing](${SITE}/#pricing)
- [FAQ](${SITE}/#faq)

## Ads for each line

${lines.join('\n')}

## Optional

${soon.join('\n')}
- [About BUYBACK.AD](${SITE}/about.html): who it is for, how it works, what it does not do, and your data
- [Full text for language models](${SITE}/llms-full.txt): this summary with the whole FAQ
- [Terms of Service](${SITE}/terms.html)
- [Privacy Policy](${SITE}/privacy.html)
`;
writeFileSync(root + 'llms.txt', llms);
writeFileSync(root + 'llms-full.txt', llms.replace(/\n## Optional[\s\S]*$/, '') + `
## Frequently asked questions

${landingFaq.map(([q, a]) => `### ${q}\n\n${a}`).join('\n\n')}

## How to make a We Buy ad

${landingSteps.map(([n, t], i) => `${i + 1}. ${decode(n)}: ${decode(t)}`).join('\n')}

## Links

- [About BUYBACK.AD](${SITE}/about.html)
- [Terms of Service](${SITE}/terms.html)
- [Privacy Policy](${SITE}/privacy.html)
`);
console.log(`sitemap.xml: ${PAGES.length} pages; robots.txt; llms.txt (${llms.length} characters), llms-full.txt (${landingFaq.length} questions)`);
export { CATS, nav, footer, SITE };
