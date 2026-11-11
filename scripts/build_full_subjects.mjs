#!/usr/bin/env node
/* WHAT A FULL AD CAN BE ABOUT: motion/subjects.json, made from the offer family.

   The full ad (motion/fullad.js) began with iPhones, the only product the video engine draws.
   The owner's library sells 35 lines (offer-library.js LINES: iPads, MacBooks, consoles,
   headphones, gold, silver, coins, cars, cards, test strips ...), each with its approved
   pictures and its models line. This reads that table (the one source: nothing is typed twice)
   and writes what the maker needs to draw a full ad about any of them: the label, the models
   line, headlines in the house voice, and the pictures, each checked to exist.

   A line the library has no clean picture of (its cards are type only) is listed without
   pictures; the maker draws its full ad with the words and the sticker alone.

   usage:  node scripts/build_full_subjects.mjs            # rewrite motion/subjects.json
           node scripts/build_full_subjects.mjs --check    # exit 1 if it is stale or a picture is missing */
import vm from 'node:vm';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url).pathname, OUT = ROOT + 'motion/subjects.json';
const win = {};
try { const s = { window: {} }; vm.runInNewContext(readFileSync(ROOT + 'offer-assets.js', 'utf8'), s); win.OFFER_ASSETS = s.window.OFFER_ASSETS; } catch (e) { /* none */ }
vm.runInNewContext(readFileSync(ROOT + 'offer-library.js', 'utf8'), { window: win, TEMPLATES: [], CUTOUT_EXT: '.webp', console, Math, JSON, Object, Array, String, Number });
const LINES = win.OFFER_LIBRARY && win.OFFER_LIBRARY.lines;
if (!LINES || !LINES.length) { console.error('offer-library.js gave no lines'); process.exit(2); }

/* How each line is named in a headline. The offer cards speak in sentences ("Old gold in a
   drawer? Sell it."); the full ad's headline is three or four words set as large as the frame
   allows, so it names the goods and says we buy them. [the goods in "WE BUY ...", one of them
   in "SELL YOUR ..."] */
const NAMES = {
  iphone: ['iPHONES', 'iPHONE'], ipad: ['iPADS', 'iPAD'], mac: ['MACBOOKS', 'MACBOOK'], watch: ['APPLE WATCHES', 'APPLE WATCH'],
  galaxy: ['GALAXY PHONES', 'GALAXY'], pixel: ['PIXEL PHONES', 'PIXEL'], foldable: ['FOLDABLES', 'FOLD OR FLIP'], tablet: ['TABLETS', 'TABLET'],
  console: ['CONSOLES', 'CONSOLE'], switch: ['NINTENDO SWITCH', 'SWITCH'], controller: ['CONTROLLERS', 'CONTROLLERS'], gamelaptop: ['GAMING LAPTOPS', 'GAMING LAPTOP'],
  vr: ['VR HEADSETS', 'VR HEADSET'], pchandheld: ['PC HANDHELDS', 'HANDHELD'], gamingpc: ['GAMING PCS', 'GAMING PC'],
  headphones: ['HEADPHONES', 'HEADPHONES'], earbuds: ['EARBUDS', 'EARBUDS'], headset: ['GAMING HEADSETS', 'HEADSET'], speaker: ['SPEAKERS', 'SPEAKER'],
  monitor: ['MONITORS', 'MONITOR'], laptop: ['LAPTOPS', 'LAPTOP'], ssd: ['SEALED SSDS', 'SEALED SSDS'], minipc: ['MINI PCS', 'MINI PC'], chromebook: ['SEALED CHROMEBOOKS', 'SEALED CHROMEBOOK'],
  metaglasses: ['META GLASSES', 'META GLASSES'], smartwatch: ['SMARTWATCHES', 'SMARTWATCH'],
  gold: ['GOLD', 'GOLD'], silver: ['SILVER', 'SILVER'], coins: ['COINS', 'COINS'], car: ['CARS & TRUCKS', 'CAR'], strips: ['TEST STRIPS', 'TEST STRIPS'],
  pokemon: ['POKÉMON CARDS', 'POKÉMON CARDS'], sports: ['SPORTS CARDS', 'SPORTS CARDS'], camera: ['CAMERAS', 'CAMERA'], drone: ['DRONES', 'DRONE'],
};
// the three points a buyer of anything can stand behind; a line's own checks follow where they are short enough for a chip
const POINTS = { car: 'FREE QUOTE, PAID ON THE SPOT, WE COME TO YOU', gold: 'TESTED FREE, PAID TODAY, NO FEES', silver: 'TESTED FREE, PAID TODAY, NO FEES',
  coins: 'FREE QUOTE, PAID TODAY, NO FEES', pokemon: 'FREE QUOTE, PAID TODAY, SINGLES OR SETS', sports: 'FREE QUOTE, PAID TODAY, SINGLES OR SETS', strips: 'SEALED BOXES, PAID TODAY, NO FEES' };
const GROUPS = { phones: 'Phones and Apple', gaming: 'Gaming', audio: 'Audio', computers: 'Computers', wearables: 'Wearables', cameras: 'Cameras', gold: 'Gold, silver and coins', silver: 'Gold, silver and coins',
  coins: 'Gold, silver and coins', cars: 'Cars', strips: 'Test strips', pokemon: 'Cards', sports: 'Cards' };

const missing = [], subjects = [];
for (const l of LINES) {
  const nm = NAMES[l.key];
  if (!nm) { console.error(`no headline name for the line "${l.key}": add it to NAMES`); process.exit(2); }
  // every set of pictures the offer cards use for the line, in their order; a set is one or two pictures [file, its size beside the first]
  const sets = (l.sets || []).map(set => set.map(([file, k]) => ({ file, k: +(+k || 1).toFixed(2) })));
  for (const s of sets) for (const p of s) if (!existsSync(`${ROOT}assets/cutouts/${p.file}.webp`)) missing.push(`${l.key}: assets/cutouts/${p.file}.webp`);
  const heads = [`WE BUY ${nm[0]}`, `CASH FOR ${nm[0]}`, ...(nm[1] === nm[0] ? [`SELL YOUR ${nm[1]}`] : [`SELL YOUR ${nm[1]}`])].filter((h, i, a) => a.indexOf(h) === i);
  const points = POINTS[l.key] || 'FREE QUOTE, CASH SAME DAY, NO FEES';
  // a chip holds about sixteen letters at a readable size beside the product (full_ad_check: a 23-letter one found no room)
  for (const c of points.split(', ')) if (c.length > 16) { console.error(`the point "${c}" for ${l.key} is over 16 letters`); process.exit(2); }
  subjects.push({ key: l.key, cat: l.cat, group: GROUPS[l.cat] || 'More', label: l.label, models: l.models, heads, points, sets });
}
if (missing.length) { console.error('pictures missing:\n  ' + missing.join('\n  ')); process.exit(1); }

const json = JSON.stringify({ _doc: 'What a full ad can be about, made from offer-library.js LINES by scripts/build_full_subjects.mjs. Do not edit by hand: change the offer family and run the script.', subjects }, null, 1) + '\n';
if (process.argv.includes('--check')) {
  const have = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (have !== json) { console.error('motion/subjects.json is stale: run node scripts/build_full_subjects.mjs'); process.exit(1); }
  console.log(`motion/subjects.json is in step with the offer family: ${subjects.length} lines, ${subjects.filter(s => s.sets.length).length} with pictures`);
} else {
  writeFileSync(OUT, json);
  console.log(`wrote motion/subjects.json: ${subjects.length} lines, ${subjects.filter(s => s.sets.length).length} with pictures, ${subjects.reduce((n, s) => n + s.sets.length, 0)} sets`);
}
