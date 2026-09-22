// Builds the eight category pages in ads/ (ads/we-buy-<category>.html).
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
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SITE = 'https://buybackad-graphics-studio.netlify.app';
const root = fileURLToPath(new URL('..', import.meta.url));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const strip = (h) => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&rsquo;/g, '’').replace(/&ldquo;|&rdquo;/g, '"').replace(/&eacute;/g, 'é').replace(/&times;/g, '×').replace(/&rsaquo;/g, '›');

const CATS = [
  {
    id: 'phones', slug: 'we-buy-phones', name: 'phones', title: 'We Buy Phones ad templates',
    h1: '&ldquo;We Buy Phones&rdquo; ad templates',
    desc: 'Make a We Buy iPhones ad in about a minute: pick a template, add your number and area, download a square image for Marketplace, OfferUp or Instagram. Every Phones design is free.',
    who: 'phone buyers, repair shops and trade-in resellers who buy iPhones, Samsung phones, iPads, MacBooks and other devices from the public',
    art: ['iphones-trio', 'iphone-cracked'],
    put: [
      'What you buy, in the words a seller searches: iPhone, Samsung, iPad, MacBook.',
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
    id: 'coins', slug: 'we-buy-coins', name: 'coins', title: 'We Buy Coins ad templates',
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
    id: 'cars', slug: 'we-buy-cars', name: 'cars', title: 'We Buy Cars ad templates',
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
    id: 'strips', slug: 'we-buy-test-strips', name: 'diabetic test strips', title: 'We Buy Diabetic Test Strips ad templates',
    h1: '&ldquo;We Buy Test Strips&rdquo; ad templates',
    desc: 'Make a We Buy Diabetic Test Strips ad: pick a template, add your number and area, download a post-ready image. Check each marketplace’s rules before posting.',
    who: 'buyers of unused diabetic test strips and supplies',
    art: ['strip-boxes', 'strip-kit'],
    put: [
      'What you take, for example sealed, unexpired boxes, and the brands you buy.',
      'How you pay and whether you pick up.',
      'Your phone number and your area.',
    ],
    faq: [
      ['Can I post this ad on any marketplace?', 'Not always. Some marketplaces restrict ads for buying or selling medical supplies, so read the rules of the place you post before you publish. The studio makes the image; where you may post it is up to each platform.'],
      ['Which test strip designs are free?', 'The top 3 designs in the Diabetic Supplies category are on the free plan. Pro unlocks every design in every category.'],
    ],
    free: 'The top 3 Diabetic Supplies designs are on the free plan; Pro unlocks the rest.',
  },
  {
    id: 'pokemon', slug: 'we-buy-pokemon-cards', name: 'Pokémon cards', title: 'We Buy Pokémon Cards ad templates',
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
    id: 'sports', slug: 'we-buy-sports-cards', name: 'sports cards', title: 'We Buy Sports Cards ad templates',
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
];

const COMMON_FAQ = [
  ['Is it free?', 'You can design without an account. Downloading needs a free account: 3 downloads a week at 1080 pixels with a BUYBACK.AD watermark. Pro is $15 a month for 100 downloads a month up to 2160 pixels, no watermark, every design.'],
];

const nav = (up) => `<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <a class="brand" href="${up}index.html">GRAPHICS <em>STUDIO</em></a>
  <nav aria-label="Site">
    <a href="${up}index.html#lp-templates">Templates</a>
    <a href="${up}index.html#pricing">Pricing</a>
    <a href="${up}about.html">About</a>
    <a class="btn" href="${up}index.html">Make my ad</a>
  </nav>
</header>`;

const footer = (up) => `<footer class="bottom">
  <div class="cats">${CATS.map((c) => `<a href="${up}ads/${c.slug}.html">We buy ${esc(c.name)}</a>`).join('\n    ')}</div>
  <a href="${up}index.html">Graphics Studio</a>
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
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Graphics Studio', item: SITE + '/' },
        { '@type': 'ListItem', position: 2, name: strip(c.title), item: url },
      ] },
      { '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    ],
  };
  const title = `${strip(c.title)} | Graphics Studio by BUYBACK.AD`;
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
  <div class="crumbs"><a href="../index.html">Graphics Studio</a> &rsaquo; ${esc(strip(c.title))}</div>
  <h1>${c.h1}</h1>
  <p class="lead">Graphics Studio makes buyback ads for ${esc(c.who)}. Pick a design, type your phone number and area, and download an image ready for Facebook Marketplace, OfferUp, Craigslist, Instagram or a printed flyer.</p>
  <div class="ctas">
    <a class="btn" href="../index.html?cat=${c.id}">See the ${esc(c.name)} designs</a>
    <a class="btn ghost" href="../index.html#pricing">Pricing</a>
  </div>
  <div class="hero-art">${c.art.map((a) => `<img src="../assets/cutouts/${a}.webp" alt="" loading="lazy" width="400" height="400">`).join('')}</div>

  <h2>How it works</h2>
  <ol class="steps">
    <li><strong>Pick a design.</strong> Open the ${esc(c.name)} designs and click one. It opens in the studio with its colours, product picture and copy already in place.</li>
    <li><strong>Type your details.</strong> Your phone number, website if you have one, and your ZIP or city. Save them once in your brand kit and every design fills them in.</li>
    <li><strong>Download and post.</strong> Choose a size (square for feeds, 9:16 for stories, 8.5&times;11 for print) and download. ${esc(c.free)}</li>
  </ol>

  <h2>What to put on a ${esc(c.name)} buyback ad</h2>
  <ul class="tidy">${c.put.map((p) => `<li>${esc(p)}</li>`).join('\n    ')}</ul>
  <p>Keep it to one headline, a few short selling points and one number. People scroll past an ad in a second; the ones that get texts are readable at a glance on a phone.</p>

  <h2>Questions</h2>
  ${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n  ')}

  <div class="ctas"><a class="btn" href="../index.html?cat=${c.id}">Make a ${esc(c.name)} ad</a></div>
</main>
${footer('../')}
</body>
</html>
`;
}

mkdirSync(root + 'ads', { recursive: true });
for (const c of CATS) writeFileSync(root + `ads/${c.slug}.html`, page(c));
console.log('wrote', CATS.length, 'pages to ads/');

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
