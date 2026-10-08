// Builds the category pages in ads/ (ads/we-buy-<category>.html), and the
// "Ad templates" lists in index.html's and about.html's footers from the same
// table, so a list cannot name a page that is not built.
//   node scripts/build_seo_pages.mjs
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
      ['Are the Apple templates free?', 'The iPhone, iPad, MacBook and Apple Watch designs are in the Phones & Devices category, and every design there is on the free plan. AirPods designs are in Headphones & Audio, where the top 3 are free. The free plan gives you 3 downloads a week at 1080 pixels with a BUYBACK.AD watermark; Pro removes the watermark and raises the limit.'],
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
      ['Are the iPhone templates free?', 'Yes. The iPhone designs are in the Phones & Devices category, and every design there is on the free plan. The free plan gives you 3 downloads a week at 1080 pixels with a BUYBACK.AD watermark; Pro removes the watermark and raises the limit.'],
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
      ['Which AirPods designs are free?', 'AirPods designs are in the Headphones & Audio category, and the top 3 designs there are on the free plan. Pro unlocks every design in every category.'],
      ['Can I add my own photo of the AirPods?', 'Yes. Upload a photo as the background (iPhone HEIC photos work), then blur or tint it so the text stays readable.'],
    ],
    free: 'The top 3 Headphones & Audio designs are on the free plan; Pro unlocks the rest.',
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
      ['Are the phone templates free?', 'Yes. Every design in the Phones category is included on the free plan. The free plan gives you 3 downloads a week at 1080 pixels with a BUYBACK.AD watermark; Pro removes the watermark and raises the limit.'],
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
      ['Which console designs are free?', 'Console designs are in the Gaming & Consoles category, and the top 3 designs there are on the free plan. Pro unlocks every design in every category.'],
      ['Are there retro game designs?', 'Not yet; they are being made. Until then, start from a Gaming & Consoles design, upload your own photo as the background and change the headline.'],
    ],
    free: 'The top 3 Gaming & Consoles designs are on the free plan; Pro unlocks the rest.',
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
      ['Which computer designs are free?', 'Computer designs are in the Computers & Parts category, and the top 3 designs there are on the free plan. Pro unlocks every design in every category.'],
      ['Where are the MacBook designs?', 'MacBooks have their own designs with the other Apple devices, in Phones & Devices, and every one of them is on the free plan.'],
    ],
    free: 'The top 3 Computers & Parts designs are on the free plan; Pro unlocks the rest.',
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
      ['Which gold designs are free?', 'The top 3 designs in the Gold category are on the free plan. Pro unlocks every design in every category.'],
    ],
    free: 'The top 3 Gold designs are on the free plan; Pro unlocks the rest.',
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
      ['Which silver designs are free?', 'The top 3 designs in the Silver category are on the free plan. Pro unlocks every design in every category.'],
      ['Can I add my own photo of the silver?', 'Yes. Upload a photo as the background (iPhone HEIC photos work), then blur or tint it so the text stays readable.'],
    ],
    free: 'The top 3 Silver designs are on the free plan; Pro unlocks the rest.',
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
      ['Which coin designs are free?', 'The top 3 designs in the Rare Coins category are on the free plan. Pro unlocks every design in every category.'],
      ['Can I use the same ad in a story or on a flyer?', 'Yes. Before you download, pick Square, Story 9:16, Flyer 8.5×11, Wide 16:9, Wide 4:3 or Tall 3:4.'],
    ],
    free: 'The top 3 Rare Coins designs are on the free plan; Pro unlocks the rest.',
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
      ['Which car designs are free?', 'The top 3 designs in the Cars & Trucks category are on the free plan. Pro unlocks every design in every category.'],
    ],
    free: 'The top 3 Cars & Trucks designs are on the free plan; Pro unlocks the rest.',
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
      ['Which Pokémon designs are free?', 'The top 3 designs in the Pokémon Cards category are on the free plan. Pro unlocks every design in every category.'],
      ['Can I use Pokémon artwork on my ad?', 'Only use pictures you have the right to use. The studio’s own card pictures are generic product shots; if you upload artwork, the rights are yours to check.'],
    ],
    free: 'The top 3 Pokémon Cards designs are on the free plan; Pro unlocks the rest.',
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
      ['Which sports card designs are free?', 'The top 3 designs in the Sports Cards category are on the free plan. Pro unlocks every design in every category.'],
      ['Will the ad name my town?', 'If you give the studio your ZIP code or city, templates with a service-area line name the towns around you. It is looked up in your browser and saved on your device.'],
    ],
    free: 'The top 3 Sports Cards designs are on the free plan; Pro unlocks the rest.',
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
      ['Which diabetic supply designs are free?', 'The top 3 designs in the Diabetic Supplies category are on the free plan. Pro unlocks every design in every category.'],
    ],
    free: 'The top 3 Diabetic Supplies designs are on the free plan; Pro unlocks the rest.',
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
    free: 'The top 3 Gaming & Consoles designs are on the free plan; Pro unlocks the rest.',
  },
];

const COMMON_FAQ = [
  ['Is it free?', 'You can design without an account. Downloading needs a free account: 3 downloads a week at 1080 pixels with a BUYBACK.AD watermark. Pro is $15 a month for 100 downloads a month up to 2160 pixels, no watermark, every design.'],
];

const nav = (up) => `<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <a class="brand" href="${up}index.html">GRAPHICS <em>STUDIO</em></a>
  <nav aria-label="Site">
    <a href="${up}index.html#lp-templates">Templates</a>
    <a href="${up}motion/">Video ads</a>
    <a href="${up}index.html#pricing">Pricing</a>
    <a href="${up}about.html">About</a>
    <a class="btn" href="${up}index.html">Make my ad</a>
  </nav>
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
   its sub-lines (the pages' footers, about.html's and index.html's; each page
   names its own classes) */
const catList = (up, { grp, subs }, pad = '    ') => top.map((c) => {
  const kids = subsOf(c);
  const a = `<a href="${up}ads/${c.slug}.html">${esc(label(c))}</a>`;
  const row = kids.length ? `<div class="${subs}">` + kids.map((k) => `<a href="${up}ads/${k.slug}.html">${esc(k.under[c.id])}</a>`).join('') + '</div>' : '';
  return `<div class="${grp}">${a}${row}</div>`;
}).join(`\n${pad}`);

const footer = (up) => `<footer class="bottom">
  <div class="cats">${catList(up, { grp: 'cat-grp', subs: 'cat-sub' })}</div>
  <a href="${up}index.html">Graphics Studio</a>
  <a href="${up}motion/">Phone video ads</a>
  <a href="${up}about.html">About</a>
  <a href="${up}index.html#pricing">Pricing</a>
  <a href="${up}index.html#faq">FAQ</a>
  <a href="${up}terms.html">Terms</a>
  <a href="${up}privacy.html">Privacy</a>
  <span>&copy; 2026 BUYBACK.AD</span>
</footer>`;

function page(c) {
  const url = `${SITE}/ads/${c.slug}.html`;
  const faq = [...c.faq, ...COMMON_FAQ];
  const parent = c.parent && byId[c.parent];
  const crumbs = [{ name: 'Graphics Studio', item: SITE + '/' }];
  if (parent) crumbs.push({ name: strip(parent.title), item: `${SITE}/ads/${parent.slug}.html` });
  crumbs.push({ name: strip(c.title), item: url });
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: crumbs.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.name, item: x.item })) },
      { '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    ],
  };
  const title = `${strip(c.title)} | Graphics Studio by BUYBACK.AD`;
  const cat = c.cat || c.id;
  const kids = subsOf(c);
  const pick = c.soon
    ? (c.cat ? `../index.html?cat=${cat}` : '../index.html#lp-templates')
    : `../index.html?cat=${cat}`;
  const cta = c.soon
    ? (c.cat ? `Start from a ${gallery(c)} design` : 'Browse the designs')
    : `See the ${gallery(c)} designs`;
  const steps = c.soon ? `
    <li><strong>Pick a design.</strong> ${c.cat ? `Open the ${esc(gallery(c))} designs` : 'Open the gallery'} and click one. A design without a product picture in front works best.</li>
    <li><strong>Make it yours.</strong> Upload your own photo of the ${esc(c.name)} as the background (iPhone HEIC photos work), then type your headline, your phone number and your ZIP or city.</li>
    <li><strong>Download and post.</strong> Choose a size (square for feeds, 9:16 for stories, 8.5&times;11 for print) and download. ${esc(c.free)}</li>` : `
    <li><strong>Pick a design.</strong> Open the ${esc(gallery(c))} designs and click one. It opens in the studio with its colours, product picture and copy already in place.</li>
    <li><strong>Type your details.</strong> Your phone number, website if you have one, and your ZIP or city. Save them once in your brand kit and every design fills them in.</li>
    <li><strong>Download and post.</strong> Choose a size (square for feeds, 9:16 for stories, 8.5&times;11 for print) and download. ${esc(c.free)}</li>`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- Generated by scripts/build_seo_pages.mjs. Edit there, not here. -->
<title>${esc(title)}</title>
<meta name="description" content="${esc(c.desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Graphics Studio by BUYBACK.AD">
<meta property="og:title" content="${esc(strip(c.title))}">
<meta property="og:description" content="${esc(c.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/assets/og/buybackad-og.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="../pages.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
${nav('../')}
<main id="main">
  <div class="crumbs"><a href="../index.html">Graphics Studio</a> &rsaquo; ${parent ? `<a href="${parent.slug}.html">${esc(strip(parent.title))}</a> &rsaquo; ` : ''}${esc(strip(c.title))}</div>
  <h1>${c.h1}</h1>
  <p class="lead">Graphics Studio makes buyback ads for ${esc(c.who)}. Pick a design, type your phone number and area, and download an image ready for Facebook Marketplace, OfferUp, Craigslist, Instagram or a printed flyer.</p>
  ${c.soon ? `<p class="card"><strong>${esc(one(c)[0].toUpperCase() + one(c).slice(1))} designs are on the way.</strong> Until they are in the studio, you can make ${an(esc(one(c)))} ad today from ${c.cat ? `a ${esc(gallery(c))} design` : 'any design'} with your own photo.</p>\n  ` : ''}<div class="ctas">
    <a class="btn" href="${pick}">${esc(cta)}</a>
    ${['apple', 'iphone', 'phones'].includes(c.id) ? '<a class="btn ghost" href="../motion/">Make a phone video ad</a>' : ''}
    <a class="btn ghost" href="../index.html#pricing">Pricing</a>
  </div>
  ${c.art.length ? `<div class="hero-art">${c.art.map((a) => `<img src="../assets/cutouts/${a}.webp" alt="" loading="lazy" width="400" height="400">`).join('')}</div>\n` : ''}${kids.length ? `
  <h2>${esc(c.subsTitle || `More ${c.name} ads`)}</h2>
  <ul class="tidy">${kids.map((k) => `<li><a href="${k.slug}.html">${esc(strip(k.title))}</a></li>`).join('\n    ')}</ul>
` : ''}
  <h2>How it works</h2>
  <ol class="steps">${steps}
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

// The "Ad templates" lists in index.html's footer and about.html's, from the
// same table as the pages, between their <!-- ad-templates --> markers.
{
  const { readFileSync } = await import('node:fs');
  const fill = (file, list) => {
    const f = root + file;
    const html = readFileSync(f, 'utf8');
    const re = /(<!-- ad-templates[^>]*-->)[\s\S]*?(\s*<!-- \/ad-templates -->)/;
    if (!re.test(html)) throw new Error(file + ': no <!-- ad-templates --> markers');
    writeFileSync(f, html.replace(re, (m, a, b) => a + list + b));
  };
  fill('index.html', '\n          ' + catList('', { grp: 'lpf-grp', subs: 'lpf-subs' }, '          '));
  fill('about.html', '\n    ' + catList('', { grp: 'cat-grp', subs: 'cat-sub' }));
  console.log('footer lists:', top.length, 'lines,', CATS.length - top.length, 'sub-lines');
}

// index.html's FAQPage JSON-LD, rebuilt from the visible FAQ so the two cannot
// disagree (structured data that says something the page does not is against
// Google's rules and is a lie besides). Edit the <details class="lp-faq"> rows,
// then run this script.
{
  const { readFileSync } = await import('node:fs');
  const f = root + 'index.html';
  let html = readFileSync(f, 'utf8');
  const decode = (t) => strip(t).replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
  const qa = [...html.matchAll(/<details class="lp-faq"><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/g)]
    .map((m) => ({ '@type': 'Question', name: decode(m[1]), acceptedAnswer: { '@type': 'Answer', text: decode(m[2]) } }));
  const block = `<script type="application/ld+json" id="ld-faq">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: qa })}</script>`;
  const re = /<script type="application\/ld\+json" id="ld-faq">[\s\S]*?<\/script>/;
  html = re.test(html) ? html.replace(re, block) : html.replace('</head>', block + '\n</head>');
  writeFileSync(f, html);
  console.log('index.html FAQPage:', qa.length, 'questions');
}
export { CATS, nav, footer, SITE };
