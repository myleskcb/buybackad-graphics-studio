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
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from 'node:fs';

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
  galaxy: ['SAMSUNG PHONES', 'SAMSUNG'], pixel: ['PIXEL PHONES', 'PIXEL'], foldable: ['FOLDABLES', 'FOLD OR FLIP'],
  macdesk: ['MACS', 'MAC'], android: ['ANDROIDS', 'ANDROID'],   // the owner's lines (2026-11-18): the desktop Macs, and Androids of every brand
  console: ['CONSOLES', 'CONSOLE'], pchandheld: ['GAMING HANDHELDS', 'HANDHELD'], gamingpc: ['GAMING COMPUTERS', 'GAMING PC'],
  headphones: ['HEADPHONES', 'HEADPHONES'], earbuds: ['EARBUDS', 'EARBUDS'], headset: ['GAMING HEADSETS', 'HEADSET'], speaker: ['SPEAKERS', 'SPEAKER'],
  monitor: ['MONITORS', 'MONITOR'], laptop: ['LAPTOPS', 'LAPTOP'], ssd: ['SEALED SSDS', 'SEALED SSDS'], minipc: ['MINI PCS', 'MINI PC'], chromebook: ['SEALED CHROMEBOOKS', 'SEALED CHROMEBOOK'],
  metaglasses: ['META GLASSES', 'META GLASSES'], smartwatch: ['SMARTWATCHES', 'SMARTWATCH'],
  gold: ['GOLD', 'GOLD'], silver: ['SILVER', 'SILVER'], coins: ['COINS', 'COINS'], car: ['CARS & TRUCKS', 'CAR'], strips: ['TEST STRIPS', 'TEST STRIPS'],
  pokemon: ['POKÉMON CARDS', 'POKÉMON CARDS'], sports: ['SPORTS CARDS', 'SPORTS CARDS'], camera: ['CAMERAS', 'CAMERA'], drone: ['DRONES', 'DRONE'],
  // the car lines (2026-11-18)
  classic: ['CLASSIC CARS', 'CLASSIC CAR'], jdm: ['JDM CARS', 'JDM CAR'], trucks: ['TRUCKS', 'TRUCK'], toyota: ['TOYOTAS', 'TOYOTA'], honda: ['HONDAS', 'HONDA'],
  bmw: ['BMWS', 'BMW'], mercedes: ['MERCEDES & AMG', 'MERCEDES'], vans: ['WORK VANS', 'WORK VAN'], semis: ['SEMI TRUCKS', 'SEMI TRUCK'],
};
// the three points a buyer of anything can stand behind; a line's own checks follow where they are short enough for a chip
const CAR_POINTS = 'FREE QUOTE, PAID ON THE SPOT, WE COME TO YOU';
const POINTS = { car: CAR_POINTS, classic: CAR_POINTS, jdm: CAR_POINTS, trucks: CAR_POINTS, toyota: CAR_POINTS, honda: CAR_POINTS, bmw: CAR_POINTS, mercedes: CAR_POINTS, vans: CAR_POINTS, semis: CAR_POINTS, gold: 'TESTED FREE, PAID TODAY, NO FEES', silver: 'TESTED FREE, PAID TODAY, NO FEES',
  coins: 'FREE QUOTE, PAID TODAY, NO FEES', pokemon: 'FREE QUOTE, PAID TODAY, SINGLES OR SETS', sports: 'FREE QUOTE, PAID TODAY, SINGLES OR SETS', strips: 'SEALED BOXES, PAID TODAY, NO FEES' };
// in the order the menus list them (the video maker's groups, a category's lines in Easy Mode)
const GROUPS = { phones: 'Phones and Apple', gaming: 'Gaming', audio: 'Audio', computers: 'Computers', wearables: 'Wearables', gold: 'Gold, silver and coins', silver: 'Gold, silver and coins',
  coins: 'Gold, silver and coins', cars: 'Cars', strips: 'Test strips', pokemon: 'Cards', sports: 'Cards', cameras: 'Cameras' };
/* THE OWNER'S LINES, IN THE OWNER'S ORDER (2026-11-18): "and technically categories would be iPhones,
   iPads, Macbooks, Macs, Androids (all), Pixel, Samsung, or foldables", "Gaming would be Consoles,
   Computers, and Handhelds". Apple Watch went to Wearables, first there as the one most bought. A
   category's lines are listed in this order, the rest after it in the offer family's; a line folded
   into another (offer-library.js alias: Android tablets, the Switch, controllers, VR headsets, gaming
   laptops) is in no menu, and a look that picked it draws the line it folded into (aliases). */
const MENU = { phones: ['iphone', 'ipad', 'mac', 'macdesk', 'android', 'pixel', 'galaxy', 'foldable'], gaming: ['console', 'gamingpc', 'pchandheld'], wearables: ['watch', 'smartwatch', 'metaglasses'] };

const missing = [], subjects = [], aliases = {};
for (const l of LINES) {
  if (l.alias) { aliases[l.key] = l.alias; continue; }
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
for (const [k, to] of Object.entries(aliases)) if (!subjects.some(s => s.key === to)) { console.error(`the line "${k}" folds into "${to}", which is no line`); process.exit(2); }
for (const [cat, keys] of Object.entries(MENU)) for (const k of keys) { const s = subjects.find(x => x.key === k); if (!s || s.cat !== cat) { console.error(`MENU lists "${k}" under ${cat}, where there is no such line`); process.exit(2); } }
{ // the menus' order: the categories in GROUPS's order, the owner's lines first in the owner's order
  const catAt = Object.keys(GROUPS), at = new Map(subjects.map((s, i) => [s, i]));
  const rank = s => [catAt.indexOf(s.cat) < 0 ? catAt.length : catAt.indexOf(s.cat), (MENU[s.cat] || []).includes(s.key) ? MENU[s.cat].indexOf(s.key) : 100 + at.get(s)];
  subjects.sort((a, b) => { const x = rank(a), y = rank(b); return x[0] - y[0] || x[1] - y[1]; });
}

/* EVERY LINE'S POOL (2026-11-18). The owner: "we need infinite but prioritized by recent popular and
   expensive models", "all colors too", "multi.. or just 1". A full ad nobody picked the picture for
   draws one entry of its line's pool by its seed (motion/fullad.js subjectDraw), so each New look
   shows another product: the offer family's own sets, the line's Apple models in every finish
   (assets/devices.json), the pictures spec/product-demand.json names, and for cars the recent and
   common vehicles of assets/vehicles.json. Weighted by that table; a picture the owner rejected,
   a mislabelled one or one flagged as a fake render or a crop is never in it. Each entry is a set of
   its own, so a page can load the one entry a seed draws (2026-11-18, pools 3 to 5 times larger: cap,
   maxPictures and maxBytes bound a line; the full ad loads an entry when it is drawn). */
const DEMAND = JSON.parse(readFileSync(ROOT + 'spec/product-demand.json', 'utf8')).lines;
const GRID = JSON.parse(readFileSync(ROOT + 'assets/approved-assets.json', 'utf8'))['asset-grid-v1'];
const FLAGS = JSON.parse(readFileSync(ROOT + 'assets/cutout-flags.json', 'utf8'));
const DEVICES = JSON.parse(readFileSync(ROOT + 'assets/devices.json', 'utf8')).models;
const VEHICLES = JSON.parse(readFileSync(ROOT + 'assets/vehicles.json', 'utf8'));
const CUT_IDS = readdirSync(ROOT + 'assets/cutouts').filter(f => f.endsWith('.webp')).map(f => f.slice(0, -5)).sort();
const barred = new Set([...(GRID.rejected || []), ...Object.keys(GRID.verifiedBad || {}), ...Object.keys(FLAGS).filter(k => !k.startsWith('_'))]);
const fileOf = f => `${ROOT}assets/cutouts/${f}.webp`;
const bytesOf = f => { try { return statSync(fileOf(f)).size; } catch (e) { return 0; } };
const dropped = [];
const usable = (f, why) => { if (!existsSync(fileOf(f))) { dropped.push(`${why}: ${f} (no such picture)`); return false; } if (barred.has(f)) { dropped.push(`${why}: ${f} (rejected, mislabelled or flagged)`); return false; } return true; };
for (const S of subjects) {
  const C = DEMAND[S.key]; if (!C) { S.pool = []; continue; }
  const cand = [];                                   // [{ set, w }], best first
  const offerW = C.offers ?? 1;
  // the offer family's own sets are always in (the line's look so far), drawn at their weight among the rest;
  // on a car line only sets of identified vehicles (assets/vehicles.json names make and model: the owner,
  // 2026-11-18, "unidentified cars skip we need to know what it is with confidence")
  S.sets.forEach(set => { if (set.every(p => !barred.has(p.file)) && !(C.cars && set.some(p => !VEHICLES[p.file]))) cand.push({ set, w: offerW, rank: Infinity }); });
  if (C.devices) {
    for (const [key, w] of C.models || []) {
      const m = DEVICES[key]; if (!m || m.line !== C.devices) { dropped.push(`${S.key}: ${key} (not a ${C.devices} model in assets/devices.json)`); continue; }
      const cols = Object.values(m.colours || {}).map(c => c.slug).filter(f => usable(f, S.key)).slice(0, C.colours || 3);   // every finish where the table says so (colours)
      const files = cols.length ? cols : (m.art && !/^qs-sheet/.test(m.art) && usable(m.art, S.key) ? [m.art] : []);
      if (!files.length) continue;
      // one model: each finish alone, and (two finishes or more) the finishes side by side, as Apple's own line-up shows them
      // in the pool by the model's weight (a model of many finishes is not pushed out by one of few); drawn by the entry's
      if (files.length >= 2) cand.push({ set: files.map((f, i) => ({ file: f, k: i ? .92 : 1 })), w: w * .4, rank: w });
      for (const f of files) cand.push({ set: [{ file: f, k: 1 }], w: w * (files.length >= 2 ? .6 : 1) / files.length, rank: w });
    }
  }
  for (const [f, w] of C.pictures || []) if (usable(f, S.key)) cand.push({ set: [{ file: f, k: 1 }], w, rank: w });
  // every approved cut-out whose id the line's pattern names (match, less exclude), at matchWeight: how a
  // line's pool grows past the pictures named one by one (the owner, 2026-11-18: "like 3-5x the pool")
  if (C.match) {
    const re = new RegExp(C.match), ex = C.exclude ? new RegExp(C.exclude) : null, named = new Set((C.pictures || []).map(([f]) => f));
    for (const f of CUT_IDS) if (re.test(f) && !(ex && ex.test(f)) && !named.has(f) && !barred.has(f)) cand.push({ set: [{ file: f, k: 1 }], w: C.matchWeight ?? 2, rank: C.matchWeight ?? 2 });
  }
  /* THE CAR LINES' VEHICLES (assets/vehicles.json: identified ones only). brands, a models pattern and
     vintage ("only", "never" by default, "any") say which; class, body and view weigh them; popular weighs
     the models that sell (the owner: "more standard cars"; iSeeCars 2025: the Camry California's most
     popular used car, the F-150, Silverado and Ram 1500 the country's); perModel keeps up to that many
     colours of one model ("each car in different colors"), perBrand that many models of one make. */
  if (C.cars) {
    const K = C.cars, now = new Date().getFullYear();
    const pop = (K.popular || []).map(([re, w]) => [new RegExp(re, 'i'), w]), modelRe = K.models ? new RegExp(K.models, 'i') : null;
    const fits = v => (!K.brands || K.brands.some(b => v.brand === b || v.brand.startsWith(b))) && (!modelRe || modelRe.test(v.model))
      && (K.vintage === 'only' ? !!v.vintage : K.vintage === 'any' ? true : !v.vintage) && (K.body[v.body] ?? 1) > 0 && (!K.from || (v.year_to || v.year_from || 0) >= K.from);
    const rows = Object.entries(VEHICLES).filter(([id, v]) => !barred.has(id) && existsSync(fileOf(id)) && fits(v))
      .map(([id, v]) => { const p = pop.find(([re]) => re.test(v.model)), recency = K.from ? 1 + ((v.year_to || v.year_from || K.from) - K.from) / Math.max(1, now - K.from) : 1;
        return { id, v, w: (K.class[v.class] ?? .5) * (K.body[v.body] ?? 1) * (K.view[v.view] ?? .5) * recency * (p ? p[1] : 1) }; })
      .sort((a, b) => b.w - a.w || a.id.localeCompare(b.id));
    const perBrand = {}, perModel = {}, blocked = new Set();
    for (const r of rows) {
      const mk = r.v.brand + '|' + r.v.model;
      if (blocked.has(mk)) continue;
      if (!perModel[mk] && (perBrand[r.v.brand] || 0) >= (K.perBrand ?? 99)) { blocked.add(mk); continue; }
      if ((perModel[mk] || 0) >= (K.perModel ?? 3)) continue;
      if (!perModel[mk]) perBrand[r.v.brand] = (perBrand[r.v.brand] || 0) + 1;
      perModel[mk] = (perModel[mk] || 0) + 1;
      cand.push({ set: [{ file: r.id, k: 1 }], w: +(r.w * 4).toFixed(2), rank: r.w * 4 });
    }
  }
  // what one line loads: the best entries first, until the pictures or the bytes run out
  cand.sort((a, b) => b.rank - a.rank || b.w - a.w);
  const files = new Set(), pool = [], same = new Map();
  let bytes = 0;
  for (const e of cand) {
    const sig = e.set.map(p => p.file).join('+');
    if (same.has(sig)) { same.get(sig).w = +(same.get(sig).w + e.w).toFixed(3); continue; }   // one set named twice (an offer set and a listed picture): one entry, both weights
    const add = e.set.map(p => p.file).filter(f => !files.has(f));
    const more = add.reduce((n, f) => n + bytesOf(f), 0);
    if (files.size + add.length > (C.cap || DEMAND.maxPictures || 12) || bytes + more > (C.maxBytes || DEMAND.maxBytes || 2.6e6)) continue;
    add.forEach(f => files.add(f)); bytes += more;
    const entry = { set: e.set, w: +e.w.toFixed(3) }; pool.push(entry); same.set(sig, entry);
  }
  S.pool = pool;
}

const json = JSON.stringify({ _doc: 'What a full ad can be about, made from offer-library.js LINES by scripts/build_full_subjects.mjs, and each line\'s pool (what a full ad nobody picked the picture for draws from, by its seed) from spec/product-demand.json, assets/devices.json and assets/vehicles.json. Do not edit by hand: change those and run the script. aliases: a line folded into another (the owner\'s lines, 2026-11-18), which a look that picked it now draws.', aliases, subjects }, null, 1) + '\n';
if (process.argv.includes('--check')) {
  const have = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (have !== json) { console.error('motion/subjects.json is stale: run node scripts/build_full_subjects.mjs'); process.exit(1); }
  console.log(`motion/subjects.json is in step with the offer family: ${subjects.length} lines, ${subjects.filter(s => s.sets.length).length} with pictures`);
} else {
  writeFileSync(OUT, json);
  console.log(`wrote motion/subjects.json: ${subjects.length} lines, ${subjects.filter(s => s.sets.length).length} with pictures, ${subjects.reduce((n, s) => n + s.sets.length, 0)} sets`);
  for (const S of subjects) if (S.pool.length) console.log(`  ${S.key.padEnd(12)} pool ${String(S.pool.length).padStart(2)} entries, ${new Set(S.pool.flatMap(e => e.set.map(p => p.file))).size} pictures, ${(S.pool.flatMap(e => e.set.map(p => p.file)).filter((f, i, a) => a.indexOf(f) === i).reduce((n, f) => n + bytesOf(f), 0) / 1e6).toFixed(2)} MB`);
}
if (dropped.length) console.log('left out of the pools:\n  ' + [...new Set(dropped)].join('\n  '));
