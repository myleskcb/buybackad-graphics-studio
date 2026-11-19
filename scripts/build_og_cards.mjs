#!/usr/bin/env node
/* THE SITE'S PICTURES ARE REAL ADS (DESIGN-LAW 146).

   Draws a full ad (motion/fullad.js, rule 137) for every public page through the video maker's own
   engine, with clean words, and writes:
     assets/full-ads/<name>.webp    the ad itself, 720 on the short side, shown on the page
     assets/og/<file>.jpg           the page's link preview, 1200x630, in main's share card's look
                                    (rules 147, 148): the wordmark, the page's kicker and title, its
                                    own ad (scripts/og_card.html)
   so a link to /ads/we-buy-gold.html previews as a gold ad. The home page and the information pages
   use main's share card (assets/brand/share-card.jpg, tools/brand/make.sh), and the logo the
   site's structured data names is main's W icon (assets/brand/icon-512.png).

   The words are the line's own (motion/subjects.json: its headline, models line and points) with a
   claim and a sticker fixed here, so a picture changes only when it is drawn again; every ad is
   drawn, pre-flighted (fullPreflight) and refused here on a "fix", a dollar sign, a dash, invented
   proof or a banned word (scripts/refresh_copy.mjs). The number is the sample number the gallery
   uses; the pictures are samples and carry no mark (rule 142). Draw them again when a line's
   pictures or words, or the house engine, change.

   usage:  node scripts/build_og_cards.mjs [--only name,name]
           GFX_BASE=http://127.0.0.1:8899/ (a server serving this tree), PLAYWRIGHT_MODULE=...
   Exits 1 if an ad fails its checks; nothing is written for it. */
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { BANNED, PRICE, DASH, PROOF } from './refresh_copy.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8899/').replace(/\/?$/, '/');
const root = fileURLToPath(new URL('..', import.meta.url));
const only = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7) || (process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : '');
const pick = only ? new Set(only.split(',')) : null;

const CLAIM = 'LOCAL BUYER', TOWNS = 'LONG BEACH • LAKEWOOD • DOWNEY', NUMBER = '(562) 999-4994';
/* the ads. pair: one of the twelve that suits the line (house-colours.js suits); voice: one of the
   owner's full-ad pairs (full-voices.js), or none for the house face. burst: a sticker that shares no
   word with the points (fullWords would call it a promise said twice). */
const ADS = {
  'video-iphone':     { subject: 'iphone', set: 2, pair: 'midnight_cyan', voice: 'stadium', aspect: '1:1', headline: 'SELL YOUR IPHONE', tag: 'IPHONE 11 AND NEWER, EVERY SIZE', burst: 'EASY SALE' },
  'we-buy-apple':     { subject: 'iphone', set: 0, pair: 'teal_orange', voice: 'sport', headline: 'WE BUY APPLE', tag: 'IPHONE, IPAD, MACBOOK AND APPLE WATCH', burst: 'EASY SALE' },
  'we-buy-iphones':   { subject: 'iphone', set: 1, pair: 'navy_gold', burst: 'EASY SALE' },
  'we-buy-ipads':     { subject: 'ipad', set: 0, pair: 'midnight_cyan', voice: 'tech', burst: 'EASY SALE' },
  'we-buy-macbooks':  { subject: 'mac', set: 1, pair: 'black_gold', burst: 'EASY SALE' },
  'we-buy-apple-watch': { subject: 'watch', set: 2, pair: 'black_green', voice: 'block', burst: 'EASY SALE' },
  'we-buy-airpods':   { subject: 'earbuds', set: 0, pair: 'blue_green', headline: 'WE BUY AIRPODS', tag: 'AIRPODS, AIRPODS PRO AND AIRPODS MAX', burst: 'EASY SALE' },
  'we-buy-phones':    { subject: 'galaxy', set: 0, pair: 'navy_orange', voice: 'squad', headline: 'WE BUY PHONES', tag: 'IPHONE, GALAXY AND PIXEL', burst: 'EASY SALE' },
  'we-buy-consoles':  { subject: 'console', set: 0, pair: 'black_red', voice: 'arcade', burst: 'EASY SALE' },
  'we-buy-computers': { subject: 'laptop', set: 0, pair: 'midnight_cyan', headline: 'WE BUY COMPUTERS', tag: 'LAPTOPS, MONITORS AND MINI PCS', burst: 'EASY SALE' },
  'we-buy-gold':      { subject: 'gold', set: 0, pair: 'green_gold', burst: 'CASH!' },
  'we-buy-silver':    { subject: 'silver', set: 0, pair: 'silver_blue', voice: 'grotesk', burst: 'CASH!' },
  'we-buy-coins':     { subject: 'coins', set: 0, pair: 'purple_gold', voice: 'luxe', burst: 'CASH!' },
  'we-buy-cars':      { subject: 'car', set: 0, pair: 'black_red', burst: 'EASY SALE' },
  'we-buy-pokemon-cards': { subject: 'pokemon', set: 0, pair: 'red_yellow', voice: 'pop', burst: 'CASH!' },
  'we-buy-sports-cards':  { subject: 'sports', set: 0, pair: 'navy_orange', voice: 'varsity', burst: 'CASH!' },
  'we-buy-test-strips':   { subject: 'strips', set: 0, pair: 'teal_orange', burst: 'CASH!' },
};
/* the cards: file name, the ads on it (one, or three in a fan), and its words. {} marks the accent. */
const CARDS = [
  { file: 'video-ad-maker', ads: ['video-iphone'], badge: 'Video ads', title: 'We Buy Phones {video} ads', sub: 'Your headline and number land in seconds, with music. English or Spanish.', chips: ['MP4', 'Made in your browser'] },
  { file: 'we-buy-apple', ads: ['we-buy-apple'], badge: 'We Buy Apple ads', title: 'iPhone, iPad and {MacBook} buying ads', sub: 'Every Apple line, your number and your towns.' },
  { file: 'we-buy-iphones', ads: ['we-buy-iphones'], badge: 'We Buy iPhones ads', title: 'Your {iPhone} buying ad, ready to post', sub: 'Flyers and posts for Marketplace, Instagram and OfferUp.' },
  { file: 'we-buy-ipads', ads: ['we-buy-ipads'], badge: 'We Buy iPads ads', title: 'Your {iPad} buying ad, ready to post', sub: 'iPad, mini, Air and Pro. Your number, big.' },
  { file: 'we-buy-macbooks', ads: ['we-buy-macbooks'], badge: 'We Buy MacBooks ads', title: 'Your {MacBook} buying ad, ready to post', sub: 'Air and Pro, M1 and newer. Your number, big.' },
  { file: 'we-buy-apple-watch', ads: ['we-buy-apple-watch'], badge: 'We Buy Apple Watch ads', title: 'Your {Apple Watch} buying ad', sub: 'Series, SE and Ultra. Your number and your towns.' },
  { file: 'we-buy-airpods', ads: ['we-buy-airpods'], badge: 'We Buy AirPods ads', title: 'Your {AirPods} buying ad, ready to post', sub: 'AirPods, Pro and Max. Your number, big.' },
  { file: 'we-buy-phones', ads: ['we-buy-phones'], badge: 'Phone buyback ads', title: '{Cash for phones} ads and flyers', sub: 'iPhone, Galaxy and Pixel. Your number, big.' },
  { file: 'we-buy-consoles', ads: ['we-buy-consoles'], badge: 'We Buy Consoles ads', title: 'PS5, Xbox and {Switch} buying ads', sub: 'Ready for Marketplace, Instagram and OfferUp.' },
  { file: 'we-buy-computers', ads: ['we-buy-computers'], badge: 'We Buy Computers ads', title: 'Laptop and {computer} buying ads', sub: 'Laptops, monitors and mini PCs. Your number, big.' },
  { file: 'we-buy-gold', ads: ['we-buy-gold'], badge: 'We Buy Gold ads', title: '{Cash for gold} flyers and ads', sub: 'Rings, chains, coins and broken gold. Your number and your towns.' },
  { file: 'we-buy-silver', ads: ['we-buy-silver'], badge: 'We Buy Silver ads', title: '{Cash for silver} flyers and ads', sub: 'Coins, bars, silverware and jewelry.' },
  { file: 'we-buy-coins', ads: ['we-buy-coins'], badge: 'We Buy Coins ads', title: 'Coin buyer {flyers} and ads', sub: 'Old coins, silver dollars and whole collections.' },
  { file: 'we-buy-cars', ads: ['we-buy-cars'], badge: 'We Buy Cars ads', title: '{Cash for cars} flyers and ads', sub: 'Cars, trucks and SUVs, running or not.' },
  { file: 'we-buy-pokemon-cards', ads: ['we-buy-pokemon-cards'], badge: 'We Buy Pokémon ads', title: 'Pokémon card {buying} ads', sub: 'Singles, slabs, binders and sealed boxes.' },
  { file: 'we-buy-sports-cards', ads: ['we-buy-sports-cards'], badge: 'We Buy Sports Cards ads', title: 'Sports card {buying} ads', sub: 'Rookies, autos, slabs and sealed wax.' },
  { file: 'we-buy-test-strips', ads: ['we-buy-test-strips'], badge: 'We Buy Test Strips ads', title: 'Test strip {buying} ads', sub: 'Sealed, unexpired boxes. Your number, big.' },
];

const wantAd = n => !pick || pick.has(n) || CARDS.some(c => (pick.has(c.file)) && c.ads.includes(n));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
const errors = []; page.on('pageerror', e => errors.push(String(e)));
await page.goto(BASE + 'motion/', { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => document.getElementById('loading').hidden, null, { timeout: 120000 });

let bad = 0;
const drawn = {};   // name -> { png (data url, full size), webp, colors }
mkdirSync(root + 'assets/full-ads', { recursive: true });
mkdirSync(root + 'assets/og', { recursive: true });
for (const [name, a] of Object.entries(ADS)) {
  if (!wantAd(name)) continue;
  const out = await page.evaluate(async ({ a, CLAIM, TOWNS, NUMBER }) => {
    const E = await import('/motion/engine.js'), C = await import('/motion/catalog.js'), A = await import('/motion/accents.js'), F = await import('/motion/fullad.js');
    const { phones, index } = await E.loadPhones('/motion/phones/');
    const assets = { phones, index, accents: await A.loadAccents('/assets/cutouts/') };
    const S = (await (await fetch('/motion/subjects.json')).json()).subjects.find(s => s.key === a.subject);
    const got = await F.loadSubjectSet(S, a.set || 0, '/assets/cutouts/'); Object.assign(assets.phones, got.assets);
    const st = F.fullStyle({ ...C.DEFAULT_STYLE, lang: 'en', subject: a.subject === 'iphone' ? '' : a.subject, phones: got.ids.length ? got.ids : ['none'],
      headline: (a.headline || S.heads[0]).toUpperCase(), tag: (a.tag || S.models).toUpperCase(), points: a.points || S.points,
      number: NUMBER, aspect: a.aspect || '1:1', feed_claim: CLAIM, feed_burst: a.burst, feed_where: TOWNS, site: '' }, 1, index,
      { palette: a.pair, ...(a.voice ? { type_pair: a.voice } : {}) });
    await E.loadFonts([...E.fontsFor(st), 'franklin']);
    const [W0, H0] = E.ASPECTS[a.aspect || '1:1'], k = 1080 / Math.min(W0, H0);
    const ad = new F.FullAd(st, assets, Math.round(W0 * k), Math.round(H0 * k));
    const c = F.fullStill(ad), pre = F.fullPreflight(ad, c);
    const s = 720 / Math.min(ad.W, ad.H), small = E.canvas(Math.round(ad.W * s), Math.round(ad.H * s));
    const g = small.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(c, 0, 0, small.width, small.height);
    return { png: c.toDataURL('image/png'), webp: small.toDataURL('image/webp', .82), W: ad.W, H: ad.H, colors: st.colors, voice: st.type_pair || 'house', pair: st.full_colour,
      words: [st.feed_claim, st.headline, st.feed_line, st.points, st.feed_burst, st.number_label, st.feed_where].join(' | '),
      blockers: F.fullBlockers(ad), fixes: pre.findings.filter(f => f.level === 'fix').map(f => f.say), notes: pre.findings.filter(f => f.level !== 'fix').map(f => f.code || f.say) };
  }, { a, CLAIM, TOWNS, NUMBER });
  const why = [...out.blockers, ...out.fixes];
  for (const [re, what] of [[BANNED, 'a banned word'], [PRICE, 'a dollar figure'], [DASH, 'a dash'], [PROOF, 'invented proof'], [/TOP DOLLAR|ANY CONDITION/i, 'a phrase the census bars']]) if (re.test(out.words)) why.push(what);
  if (out.pair !== a.pair) why.push(`drew ${out.pair}, wanted ${a.pair}`);
  if (why.length) { bad++; console.log(`FAIL ${name}: ${why.join('; ')}`); continue; }
  writeFileSync(root + `assets/full-ads/${name}.webp`, Buffer.from(out.webp.split(',')[1], 'base64'));
  drawn[name] = out;
  console.log(`${name.padEnd(22)} ${out.W}x${out.H} ${out.pair} ${out.voice}  ${out.words}${out.notes.length ? '  (notes: ' + out.notes.join(', ') + ')' : ''}`);
}

const card = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await card.goto(BASE + 'scripts/og_card.html', { waitUntil: 'load' });
for (const c of CARDS) {
  if (pick && !pick.has(c.file) && !c.ads.some(n => pick.has(n))) continue;
  if (!c.ads.every(n => drawn[n])) { console.log(`skip card ${c.file}: its ad was not drawn`); bad++; continue; }
  const lead = drawn[c.ads[0]].colors;
  const res = await card.evaluate(cfg => window.paint(cfg), {
    ground: lead.ground, lit: lead.light, ink: lead.ink, accent: lead.accent, on: lead.plate_ink,
    badge: c.badge, title: c.title, sub: c.sub, chips: c.chips, ads: c.ads.map(n => drawn[n].png),
  });
  await card.screenshot({ path: root + `assets/og/${c.file}.jpg`, type: 'jpeg', quality: 84 });
  console.log(`card ${c.file}.jpg (title ${res.size}px)`);
}
if (errors.length) { console.log('page errors:', errors.slice(0, 3).join(' | ')); bad++; }
await browser.close();
process.exit(bad ? 1 : 0);
