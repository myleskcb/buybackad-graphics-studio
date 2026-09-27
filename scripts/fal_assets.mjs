#!/usr/bin/env node
/* Hero product assets by fal.ai — the ones the owner named and the library
   lacks. Text-to-image (Seedream v4, the provider api.mjs already uses) on a
   plain white ground, then background removal, saved as PNG with alpha into
   assets/cutouts-gen/. Brand names stay in the COPY, not the prompt: the
   image is a generic president-style watch, a gothic sterling ring — the ad
   says Rolex, Chrome Hearts.
     FAL_KEY=... node scripts/fal_assets.mjs            generate everything missing
     FAL_KEY=... node scripts/fal_assets.mjs --check    one cheap call, report balance state
     node scripts/fal_assets.mjs --list                 print the prompt plan, no key needed */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname;
const OUT = ROOT + 'assets/cutouts-gen/';
const STYLE = 'studio product photograph, isolated on a plain pure white background, centered, soft even lighting, sharp focus, high detail, photorealistic, no text, no logo, no watermark, no hands, no props';
const PLAN = [
  // coins — Centenarios are the grail
  ['coin-centenario-single',   'coins',  'a single Mexican 50 pesos gold Centenario coin standing at a slight angle, winged victory relief, warm gold'],
  ['coin-centenario-pair',     'coins',  'two Mexican 50 pesos gold Centenario coins, one showing the winged victory face, one the eagle reverse, overlapping'],
  ['coin-centenario-stack',    'coins',  'a short stack of five Mexican gold Centenario coins with one leaning against it'],
  ['coin-morgan-dollar',       'coins',  'a Morgan silver dollar, liberty head obverse, brilliant uncirculated, slight angle'],
  ['coin-gold-eagle',          'coins',  'an American Gold Eagle one ounce bullion coin, walking liberty obverse, slight angle'],
  ['coin-krugerrand',          'coins',  'a South African Krugerrand gold coin, springbok reverse, slight angle'],
  ['coin-graded-slab-gold',    'coins',  'a gold coin sealed in a clear plastic grading holder with a blank white label, front view'],
  // gold — big Cuban, president watch, nugget ring, byzantine
  ['gold-cuban-bracelet-heavy','gold',   'a heavy solid gold Miami Cuban link bracelet, thick links, box clasp, coiled in an S curve'],
  ['gold-cuban-chain-thick',   'gold',   'a thick solid gold Miami Cuban link chain necklace laid in a loose oval'],
  ['gold-president-watch',     'gold',   'a solid gold presidential-style wristwatch with a fluted bezel and champagne dial and a three-piece link bracelet, three quarter view, generic unbranded'],
  ['gold-nugget-ring',         'gold',   'a men\'s chunky gold nugget ring with a textured nugget top, three quarter view'],
  ['gold-byzantine-chain',     'gold',   'a solid gold byzantine link chain necklace coiled loosely'],
  ['gold-rope-chain',          'gold',   'a solid gold rope chain necklace coiled loosely'],
  ['gold-scrap-pile',          'gold',   'a small pile of scrap gold jewelry: broken chains, a single earring, a bent ring, a dental crown'],
  // silver — gothic sterling, silverware, antiques
  ['silver-gothic-ring-cross', 'silver', 'a chunky sterling silver gothic ring with a raised cross and fleur-de-lis scrollwork, oxidised detail, three quarter view, generic unbranded'],
  ['silver-gothic-ring-dagger','silver', 'a wide sterling silver band ring engraved with dagger and scroll motifs, oxidised, three quarter view, generic unbranded'],
  ['silver-gothic-pendant',    'silver', 'a sterling silver gothic cross pendant on a heavy silver chain, oxidised scrollwork, generic unbranded'],
  ['silver-silverware-set',    'silver', 'a set of antique sterling silverware, forks knives and spoons fanned out, ornate handles'],
  ['silver-tea-set-antique',   'silver', 'an antique sterling silver tea set, teapot creamer and sugar bowl, ornate, slightly tarnished'],
  ['silver-bars-ten-oz',       'silver', 'two ten ounce silver bullion bars, one standing, one flat, brushed finish, blank face'],
  // cars — keys and classics
  ['car-key-fob-luxury-black', 'cars',   'a luxury German car smart key fob, black and chrome, rounded, unbranded, on a short leather key ring'],
  ['car-key-fob-luxury-silver','cars',   'a luxury car key fob in brushed silver metal and black, unbranded, with a small leather tag'],
  ['car-key-fob-pair',         'cars',   'two luxury car smart key fobs, one black, one silver, unbranded'],
  ['car-classic-muscle-side',  'cars',   'a 1969 American muscle car, deep red, full side profile, whole car in frame with space around it'],
  ['car-classic-convertible',  'cars',   'a 1960s classic convertible, cream paint, chrome bumpers, three quarter front view, whole car in frame'],
  ['car-exotic-front',         'cars',   'a modern exotic supercar, orange, low three quarter front view, whole car in frame'],
  ['car-pickup-modern',        'cars',   'a modern full-size pickup truck, black, three quarter front view, whole truck in frame'],
  // cards
  ['poke-slab-holo',           'pokemon','a holographic trading card in a clear graded slab holder with a blank white label, front view, generic fantasy dragon artwork'],
  ['poke-booster-box-sealed',  'pokemon','a sealed trading card booster box, shrink-wrapped, generic colourful artwork, slight angle'],
  ['sports-slab-rookie',       'sports', 'a basketball trading card in a clear graded slab holder with a blank white label, generic player artwork, front view'],
  ['sports-wax-box',           'sports', 'a sealed box of sports trading card packs, shrink-wrapped, generic design, slight angle'],
];
/* BACKDROPS — photographic, not illustrated: the brief is "real images that
   will work for buyback ads, nothing generic or fake AI looking". Every prompt
   asks for a candid, available-light shot with a shallow focus and an empty
   area for copy; generated at 3:2 and used under the theme's tint. */
const BG_STYLE = 'candid photograph, natural available light, shallow depth of field, slightly grainy, muted colour, no text, no logos, no people\'s faces, room for text';
const BACKDROPS = [
  ['bg-cars-lot-dusk',        'cars',    'a row of used cars on a small dealer lot at dusk, wet asphalt reflections, shot low from the side'],
  ['bg-cars-key-handover',    'cars',    'a car key on a hood, close, blurred sedan behind, late afternoon'],
  ['bg-cars-garage-classic',  'cars',    'the front corner of a classic car in a home garage, chrome catching window light'],
  ['bg-cars-driveway-suv',    'cars',    'a dark SUV parked in a suburban driveway, morning, shot from the rear quarter'],
  ['bg-phones-desk-stack',    'phones',  'three smartphones face down in a loose stack on a wooden desk, window light'],
  ['bg-phones-tray-repair',   'phones',  'a phone repair bench with a phone open, tools blurred, cool light'],
  ['bg-phones-hand-street',   'phones',  'a hand holding a smartphone from behind, blurred street, evening'],
  ['bg-phones-box-drawer',    'phones',  'an open drawer of old smartphones and cables, overhead, soft light'],
  ['bg-cards-binder-close',   'pokemon', 'a trading card binder page close-up, sleeved cards in rows, angled, warm lamp light'],
  ['bg-cards-shop-glass',     'pokemon', 'a card shop glass counter with graded slabs inside, shot from the customer side, reflections'],
  ['bg-cards-table-sort',     'pokemon', 'trading cards being sorted on a kitchen table, overhead, some in sleeves, afternoon light'],
  ['bg-cards-slabs-shelf',    'sports',  'graded sports cards standing on a shelf, shallow focus on one, dim room'],
  ['bg-cards-shoebox',        'sports',  'a shoebox full of old sports cards, overhead, garage light'],
  ['bg-gold-jeweler-bench',   'gold',    'a jeweler\'s bench with a loupe and a scale, gold chain in the tray, warm light'],
  ['bg-silver-drawer',        'silver',  'a felt-lined drawer of tarnished silverware, overhead, window light'],
  ['bg-coins-tray-loupe',     'coins',   'a velvet coin tray with a loupe beside it, a few silver dollars in focus, lamp light'],
];
/* STICKERS and ELEMENTS — flat graphic pieces on white, cut out after: burst
   badges, arrows, tape strips, stamps, price tags. Colour is applied by the
   theme, so these are generated in black on white. */
const EL_STYLE = 'flat vector-style graphic, solid black on a plain white background, clean edges, no gradients, no text, centered, high resolution';
const ELEMENTS = [
  ['el-burst-12',    'a twelve-point starburst badge shape'],
  ['el-burst-rough', 'a hand-cut rough-edged starburst badge shape'],
  ['el-arrow-curl',  'a hand-drawn curly arrow pointing down-right'],
  ['el-arrow-bold',  'a bold chunky arrow pointing right'],
  ['el-tape-strip',  'a strip of masking tape, torn ends, slightly angled'],
  ['el-tag-price',   'a swing price tag shape with a hole and string'],
  ['el-stamp-round', 'a round rubber stamp ring, distressed, empty centre'],
  ['el-scribble',    'a marker scribble underline, one stroke'],
  ['el-circle-marker','a rough marker circle, one loop, open ends'],
  ['el-speech-pill', 'a speech bubble pill shape with a small tail'],
  ['el-ribbon',      'a ribbon banner shape with folded ends'],
  ['el-check-brush', 'a brush-stroke check mark'],
  ['el-cash-stack',  'a stack of banknotes with a band, side view'],
  ['el-coin-stack',  'a stack of coins, side view'],
  ['el-sparkle-3',   'three four-point sparkles of different sizes'],
  ['el-lightning',   'a bold lightning bolt'],
];
const arg = process.argv[2] || '';
const key = process.env.FAL_KEY || (existsSync(ROOT + '.env') && (readFileSync(ROOT + '.env', 'utf8').match(/^FAL_KEY=(.+)$/m) || [])[1]);
const BGOUT = ROOT + 'assets/bg-gen/', ELOUT = ROOT + 'assets/elements-gen/';
if (arg === '--list' || !key){
  console.log(PLAN.length + ' products, ' + BACKDROPS.length + ' backdrops, ' + ELEMENTS.length + ' elements planned' + (key ? '' : ' · no FAL_KEY in the environment or .env — nothing generated'));
  PLAN.forEach(([id, cat]) => console.log('  product  ' + cat.padEnd(8) + id + (existsSync(OUT + id + '.png') ? '  (done)' : '')));
  BACKDROPS.forEach(([id, cat]) => console.log('  backdrop ' + cat.padEnd(8) + id + (existsSync(BGOUT + id + '.jpg') ? '  (done)' : '')));
  ELEMENTS.forEach(([id]) => console.log('  element  ' + ''.padEnd(8) + id + (existsSync(ELOUT + id + '.png') ? '  (done)' : '')));
  console.log('estimated: products $' + (PLAN.length * 0.05).toFixed(2) + ' · backdrops $' + (BACKDROPS.length * 0.03).toFixed(2) + ' · elements $' + (ELEMENTS.length * 0.05).toFixed(2));
  process.exit(key ? 0 : 1);
}
mkdirSync(OUT, { recursive: true });
const call = async (model, input) => {
  const r = await fetch('https://fal.run/' + model, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Key ' + key }, body: JSON.stringify(input) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(model + ' ' + r.status + ': ' + (j.detail && JSON.stringify(j.detail) || JSON.stringify(j)).slice(0, 300));
  return j;
};
if (arg === '--check'){
  try { const j = await call('fal-ai/bytedance/seedream/v4/text-to-image', { prompt: 'a plain white studio background', image_size: { width: 256, height: 256 }, num_images: 1 });
        console.log('fal reachable, balance OK (one tiny image: ' + (j.images && j.images[0] && j.images[0].url || '?') + ')'); }
  catch (e){ console.log('fal call failed: ' + e.message + (/balance|exhaust|402|403/i.test(e.message) ? '  ← looks like credit' : '')); process.exit(1); }
  process.exit(0);
}
let made = 0, failed = 0;
for (const [id, cat, what] of PLAN){
  if (existsSync(OUT + id + '.png')){ continue; }
  try {
    const gen = await call('fal-ai/bytedance/seedream/v4/text-to-image', { prompt: what + ', ' + STYLE, image_size: { width: 1536, height: 1536 }, num_images: 1 });
    const url = gen.images[0].url;
    const cut = await call('fal-ai/bria/background/remove', { image_url: url });
    const png = Buffer.from(await (await fetch(cut.image.url)).arrayBuffer());
    writeFileSync(OUT + id + '.png', png);
    made++; console.log('  ok  ' + id + ' ' + (png.length / 1024 | 0) + 'KB');
  } catch (e){ failed++; console.log('  FAIL ' + id + ': ' + e.message); if (/balance|exhaust|402/i.test(e.message)) break; }
}
console.log(`products: generated ${made}, failed ${failed}, in ${OUT}`);
mkdirSync(BGOUT, { recursive: true }); mkdirSync(ELOUT, { recursive: true });
let bmade = 0;
for (const [id, cat, what] of BACKDROPS){
  if (existsSync(BGOUT + id + '.jpg')) continue;
  try { const gen = await call('fal-ai/bytedance/seedream/v4/text-to-image', { prompt: what + ', ' + BG_STYLE, image_size: { width: 1920, height: 1280 }, num_images: 1 });
        writeFileSync(BGOUT + id + '.jpg', Buffer.from(await (await fetch(gen.images[0].url)).arrayBuffer())); bmade++; console.log('  ok  ' + id); }
  catch (e){ console.log('  FAIL ' + id + ': ' + e.message); if (/balance|exhaust|402/i.test(e.message)) break; }
}
let emade = 0;
for (const [id, what] of ELEMENTS){
  if (existsSync(ELOUT + id + '.png')) continue;
  try { const gen = await call('fal-ai/bytedance/seedream/v4/text-to-image', { prompt: what + ', ' + EL_STYLE, image_size: { width: 1024, height: 1024 }, num_images: 1 });
        const cut = await call('fal-ai/bria/background/remove', { image_url: gen.images[0].url });
        writeFileSync(ELOUT + id + '.png', Buffer.from(await (await fetch(cut.image.url)).arrayBuffer())); emade++; console.log('  ok  ' + id); }
  catch (e){ console.log('  FAIL ' + id + ': ' + e.message); if (/balance|exhaust|402/i.test(e.message)) break; }
}
console.log(`backdrops ${bmade} in ${BGOUT} · elements ${emade} in ${ELOUT}`);
