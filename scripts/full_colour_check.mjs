#!/usr/bin/env node
/* THE FULL AD'S COLOURS, MEASURED (DESIGN-LAW 139; motion/fullad.js).

   The owner, 2026-11-12, of the full ad in the twelve proven pairs: "the theming is much better",
   "but still needs tweaks". Three faults were found and fixed where they start; this holds them:

     chevrons   every chevron, in every pair, reaches the accent itself on the picture as delivered
                (its nearest pixel within OKLab .04 of it). A chevron faded by opacity never does:
                gold at 32% over navy is #504b3a, .3 away.
     words      a word that names a colour (GOLD, SILVER, ORO, PLATA) wears the accent only when
                the accent is that colour, on all twelve pairs picked by hand.
     lines      a seeded gold, silver, test strip or Pokémon ad draws a pair that suits its line
                (house-colours.js suits, from the library's AFFINITY), and a seeded GOLD or
                SILVER headline a pair whose accent is that metal.
     phones     a seeded ad with bold phones on it keeps to two colour families with them (or
                stands on a neutral ground when the phones alone are two); every phone picture
                has its body colour measured at load.
     unchanged  an ad that brings none of these draws exactly the pair its seed drew before the
                rule (the first draw of the seed's stream over all twelve, turned by its line's own
                step: lineTurn, 2026-11-18, none for the iPhone line).
     firsts     a new visitor's first full ad (seed 1) of each unrestricted line: no pair on more
                than a quarter of them (31 of the 35 opened in Green & Gold before lineTurn).

   usage:  python3 -m http.server 8931   (in the repo), then
           [GFX_BASE=http://127.0.0.1:8931/] node scripts/full_colour_check.mjs
           (or PLAYWRIGHT_MODULE=$PWD/scripts/pw_local.cjs, no server). Takes about a minute.
   Exits non-zero on a failure. */
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8931/').replace(/\/?$/, '/');
const fails = [];
const ok = (cond, what) => { console.log((cond ? '  ok   ' : '  FAIL ') + what); if (!cond) fails.push(what); };

// 0. the pairs' file is the studio's colour themes (every group, rule 146), with their looks and suits
try { execFileSync(process.execPath, [new URL('./build_house_colours.mjs', import.meta.url).pathname, '--check'], { stdio: 'pipe' }); ok(true, 'motion/house-colours.js is in step with the studio\'s colour themes and AFFINITY'); }
catch (e) { ok(false, 'motion/house-colours.js: ' + String(e.stderr || e.stdout || e).trim().split('\n')[0]); }

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
const errors = []; page.on('pageerror', e => errors.push(String(e)));
await page.goto(BASE + 'motion/', { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => document.getElementById('loading').hidden, null, { timeout: 120000 });

const r = await page.evaluate(async () => {
  const E = await import('/motion/engine.js'), C = await import('/motion/catalog.js'), A = await import('/motion/accents.js'), F = await import('/motion/fullad.js');
  const { phones, index } = await E.loadPhones('/motion/phones/');
  const assets = { phones, index, accents: await A.loadAccents('/assets/cutouts/') };
  const ids = model => index.filter(m => m.model === model).map(m => m.id);
  const words = { headline: 'SELL YOUR IPHONE', tag: 'IPHONE 15 – 18 PRO MAX', feed_claim: 'TOP DOLLAR • FAST CASH', points: 'TEXT YOUR IMEI, CASH SAME DAY, NO FEES', number_label: 'CALL OR TEXT', feed_where: 'LONG BEACH • LAKEWOOD • DOWNEY', site: 'www.YourShop.com', number: '(562) 999-4994' };
  const out = { chevrons: [], words: [], lines: [], phones: [], unchanged: { same: 0, of: 0 }, bodies: {}, firsts: [] };
  const restricted = (await import('/motion/house-colours.js')).LINES;
  const subjectKeys = (await (await fetch('/motion/subjects.json')).json()).subjects.map(l => l.key).filter(k => k !== 'iphone' && !restricted.includes(k));

  // chevrons, on the picture as delivered
  for (const aspect of ['1:1', '9:16']) for (const pair of F.COLOURWAYS) {
    const st = F.fullStyle({ ...C.DEFAULT_STYLE, ...words, aspect, phones: ids('iPhone 16 Pro').slice(0, 2) }, 4242, index, { palette: pair, cta_mark: 'chevrons' });   // the chevrons themselves (one mark of several since 2026-11-18)
    await E.loadFonts([...E.fontsFor(st), 'franklin']);
    const [W0, H0] = E.ASPECTS[aspect], k = 1080 / Math.min(W0, H0);
    const ad = new F.FullAd(st, assets, Math.round(W0 * k), Math.round(H0 * k));
    const c = F.fullStill(ad), x = c.getContext('2d', { willReadFrequently: true }), marks = F.chevronMarks(ad);
    const [ar, ag, ab] = [1, 3, 5].map(i => parseInt(ad.hot.slice(i, i + 2), 16)), acc = E.oklabOf(ar, ag, ab);
    const worst = [];
    for (const m of marks) for (const [tx, dir] of [[m.lx, -1], [m.rx, 1]]) {
      const xa = Math.round(Math.min(tx, tx + dir * m.ax) - m.width), xb = Math.round(Math.max(tx, tx + dir * m.ax) + m.width);
      const ya = Math.round(m.cy - m.ay - m.width), yb = Math.round(m.cy + m.ay + m.width);
      const d = x.getImageData(xa, ya, xb - xa, yb - ya).data;
      let best = 9;
      for (let i = 0; i < d.length; i += 4) { const L = E.oklabOf(d[i], d[i + 1], d[i + 2]); best = Math.min(best, Math.hypot(L[0] - acc[0], L[1] - acc[1], L[2] - acc[2])); }
      worst.push(+best.toFixed(3));
    }
    out.chevrons.push({ pair, aspect, n: marks.length, hotIsAccent: ad.hot === st.colors.accent, worst: Math.max(...worst, 0) });
  }

  // a colour word wears the accent only when the accent is that colour
  const heads = ['WE BUY GOLD', 'CASH FOR GOLD', 'WE BUY SILVER', 'COMPRAMOS ORO', 'COMPRAMOS PLATA', 'GOLD & SILVER WANTED', 'SELL YOUR GOLD TODAY'];
  for (const headline of heads) for (const pair of F.COLOURWAYS) {
    const st = F.fullStyle({ ...C.DEFAULT_STYLE, headline, aspect: '1:1', phones: ['none'], subject: 'gold' }, 77, index, { palette: pair });
    const w = headline.split(/\s+/)[st.accent_word];
    out.words.push({ headline, pair, word: w, agrees: F.wordAgrees(w, st.colors.accent) });
  }

  // a restricted line's seeded pair suits it
  const suits = Object.fromEntries((await import('/motion/house-colours.js')).HOUSE_COLOURS.map(c => [c.key, c.suits]));
  for (const [subject, headline] of [['gold', 'WE BUY GOLD'], ['silver', 'WE BUY SILVER'], ['strips', 'WE BUY TEST STRIPS'], ['pokemon', 'WE BUY POKÉMON CARDS'], ['gold', 'COMPRAMOS ORO'], ['silver', 'COMPRAMOS PLATA']])
    for (let s = 1; s <= 150; s++) {
      const st = F.fullStyle({ ...C.DEFAULT_STYLE, subject, headline, aspect: '1:1', phones: ['none'] }, s * 7919, index);
      const word = headline.split(/\s+/).pop();
      out.lines.push({ subject, headline, pair: st.full_colour, suits: suits[st.full_colour].includes(subject), agrees: F.wordAgrees(word, st.colors.accent) });
    }

  // bold phones keep the card to two colour families
  for (const m of index) out.bodies[m.id] = m.body;
  const hues = c => [c.colors.ground, c.colors.accent].map(E.oklchOf).filter(k => k.C >= .04).map(k => k.h);
  const sets = { default: ['18-pro-max-burgundy', '17-pro-max-cosmic-orange', '18-pro-max-glacier', '16-pink'], 'pink, ultramarine, teal': ['16-pink', '16-ultramarine', '16-teal'],
    red: ['14-plus-red', '14-plus-starlight'], yellow: ['14-plus-yellow', '14-plus-midnight'], ultramarine: ['16-ultramarine', '16-black'], 'cosmic orange': ['17-pro-cosmic-orange', '17-pro-silver'] };
  for (const [name, set] of Object.entries(sets)) for (const aspect of ['1:1', '4:5']) for (let s = 1; s <= 120; s++) {
    const st = F.fullStyle({ ...C.DEFAULT_STYLE, ...words, aspect, phones: set }, s * 6151, index);
    const shown = st.phones.map(id => (index.find(m => m.id === id) || {}).body).filter(b => b && b.C >= F.BOLD_C).map(b => b.h);
    const pairC = F.COLOUR_OF[st.full_colour], n = F.familyCount([...hues(pairC), ...shown]);
    const neutral = E.oklchOf(pairC.colors.ground).C < .04, many = F.familyCount(shown) >= 2;
    out.phones.push({ name, aspect, pair: st.full_colour, n, ok: n <= 2 || (many && neutral) });
  }

  // nothing else moves: the seed's first draw over every pair, the look first and then the pair within it
  // (drawPair, rule 146), turned by the line's own step (lineTurn, 2026-11-18: the iPhone line by none)
  out.looks = {};
  for (const [phones, headline, subject] of [[['16-pro-max-natural', '16-pro-max-white'], 'SELL YOUR IPHONE', ''], [['15-pro-black', '15-pro-white', '16-black'], 'WE BUY IPHONES', ''], [['none'], 'WE BUY COINS', 'coins'], [['none'], 'WE BUY CARS & TRUCKS', 'car']])
    for (let s = 1; s <= 150; s++) {
      const seed = s * 104729, st = F.fullStyle({ ...C.DEFAULT_STYLE, headline, subject, aspect: '1:1', phones }, seed, index);
      const was = F.drawPair(F.DRAWN, E.rng((seed >>> 0) * 7 + 11)(), subject);   // every pair but a twin (2026-11-19)
      out.unchanged.of++; if (st.full_colour === was) out.unchanged.same++;
    }
  // the looks balance (rule 146): 300 seeds of an unrestricted line, each look near its share (LOOK_SHARE, 2026-11-19:
  // "these are all so dark"), no pair over twice the share of a pair of the look drawn most
  { const look = {}, pair = {};
    for (let s = 1; s <= 300; s++) { const st = F.fullStyle({ ...C.DEFAULT_STYLE, headline: 'WE BUY CARS & TRUCKS', subject: 'car', aspect: '1:1', phones: ['none'] }, s * 7907, index); const L = F.COLOUR_OF[st.full_colour].look; look[L] = (look[L] || 0) + 1; pair[st.full_colour] = (pair[st.full_colour] || 0) + 1; }
    const n = k => F.DRAWN.filter(x => F.COLOUR_OF[x].look === k).length, w = Object.fromEntries(['light', 'vivid', 'dark'].map(k => [k, Math.min(1, n(k) / 4) * F.LOOK_SHARE[k]])), sum = Object.values(w).reduce((a, b) => a + b, 0);
    const want = Object.fromEntries(Object.entries(w).map(([k, v]) => [k, v / sum])), cap = 2 * Math.max(...Object.keys(want).map(k => want[k] / n(k)));
    out.looks = { look, want, cap, most: Object.entries(pair).sort((a, b) => b[1] - a[1])[0], pairs: Object.keys(pair).length }; }
  // the ground and the product line up (2026-11-18, "ideally bg and assets line up"): every photograph a
  // seed draws agrees with the product the seed drew (groundFits), and on a scene with a floor the floor
  // line lands at the foot of the product band
  out.lineup = { photos: 0, bad: [], floors: [] };
  const GR = await import('/motion/full-grounds.js');
  for (const subject of ['', 'car', 'gold', 'silver', 'coins', 'laptop', 'minipc', 'gamingpc', 'headphones', 'pokemon', 'sports', 'camera', 'console']) for (let s = 1; s <= 60; s++) {
    const st = F.fullStyle({ ...C.DEFAULT_STYLE, headline: 'WE BUY THEM', subject, aspect: '1:1', phones: subject ? ['none'] : [] }, s * 7919, index);
    if (!st.ground_photo) continue;
    out.lineup.photos++;
    const t = GR.GROUND_PHOTOS[st.ground_photo.src], P = F.productFor(subject, st.phones);
    if (!F.groundFits(t, P)) out.lineup.bad.push(`${subject || 'iphone'} seed ${s * 7919}: ${st.ground_photo.src.split('/').pop()} beside ${(st.phones || []).slice(0, 2).join(', ')}`);
  }
  // each scene with a floor, under a set of phones in each size: the floor line at the product's foot
  const floorScenes = Object.entries(GR.GROUND_PHOTOS).filter(([, t]) => t.shows === 'scene' && t.floor != null).map(([src, t]) => ({ src, floor: t.floor }))
    .concat([{ src: 'assets/bg/dl_sports_trustSeal_crimson.jpg', floor: .78 }]);
  for (const g of floorScenes) for (const aspect of ['1:1', '4:5', '9:16']) {
    const st = F.fullStyle({ ...C.DEFAULT_STYLE, headline: 'WE BUY IPHONES', aspect, phones: ids('iPhone 16 Pro').slice(0, 2), ground_photo: { src: g.src, focus: [.5, .5], shows: 'scene', floor: g.floor } }, 4242, index);
    await F.loadGroundPhoto(g.src).catch(() => null);
    await E.loadFonts([...E.fontsFor(st), 'franklin']);
    const [W0, H0] = E.ASPECTS[aspect], k = 1080 / Math.min(W0, H0);
    const ad = new F.FullAd(st, assets, Math.round(W0 * k), Math.round(H0 * k)), G = ad.full && ad.full.group;
    out.lineup.floors.push({ subject: aspect, src: g.src.split('/').pop(), reach: ad.floorReach !== false, off: G && ad.floorAt != null ? Math.abs(ad.floorAt - G[3]) / ad.H : 1 });
  }
  // the first ads of the lines spread over the pairs: a new visitor's first full ad (seed 1) of
  // every unrestricted line, and no pair on more than a quarter of them
  for (const subject of subjectKeys) {
    const st = F.fullStyle({ ...C.DEFAULT_STYLE, headline: 'WE BUY THEM', subject, aspect: '1:1', phones: ['none'] }, 1, index);
    out.firsts.push({ subject, pair: st.full_colour });
  }
  // a seed's photograph keeps the card to two colour families (spec/full-grounds.json, 2026-11-18):
  // one whose own colour is strong stands only beside a pair of its family
  const G = await import('/motion/full-grounds.js');
  out.grounds = { photos: 0, strong: 0, off: [] };
  for (const subject of ['', 'car', 'gold', 'sports', 'laptop', 'camera']) for (let s = 1; s <= 120; s++) {
    const st = F.fullStyle({ ...C.DEFAULT_STYLE, headline: 'WE BUY THEM', subject, aspect: '1:1', phones: subject ? ['none'] : [] }, s * 977, index);
    if (st.background !== 'photo') continue; out.grounds.photos++;
    const m = G.GROUND_PHOTOS[st.ground_photo.src]; if (!m || !(m.C >= .08) || m.hue == null) continue; out.grounds.strong++;
    const hues = [st.colors.accent, st.colors.ground].map(E.oklchOf).filter(k => k.C >= .04).map(k => k.h);
    if (!hues.some(h => Math.min(Math.abs(h - m.hue), 360 - Math.abs(h - m.hue)) <= 30)) out.grounds.off.push(`${subject || 'iphone'} ${s}: ${st.ground_photo.src.split('/').pop()} on ${st.full_colour}`);
  }
  return out;
});
if (errors.length) ok(false, 'page errors: ' + errors.slice(0, 3).join(' | '));

const chevBad = r.chevrons.filter(c => !c.n || c.worst > .04 || !c.hotIsAccent);
ok(!chevBad.length, `every chevron reaches its pair's accent on the delivered picture: ${r.chevrons.length} ads, the farthest any came ${Math.max(...r.chevrons.map(c => c.worst)).toFixed(3)} (at most .04)` + (chevBad.length ? '; ' + chevBad.slice(0, 4).map(c => `${c.pair} ${c.aspect} ${c.n ? c.worst : 'no chevrons'}${c.hotIsAccent ? '' : ' (not the accent)'}`).join(', ') : ''));
const wordBad = r.words.filter(w => !w.agrees);
ok(!wordBad.length, `a colour word wears the accent only in its own colour: ${r.words.length} headlines on pairs picked by hand` + (wordBad.length ? '; ' + wordBad.slice(0, 4).map(w => `${w.headline} on ${w.pair} accents ${w.word}`).join(', ') : ''));
const lineBad = r.lines.filter(l => !l.suits || !l.agrees);
ok(!lineBad.length, `a seeded gold, silver, strips or Pokémon ad draws a pair that suits it: ${r.lines.length} ads` + (lineBad.length ? '; ' + lineBad.slice(0, 4).map(l => `${l.headline} on ${l.pair}`).join(', ') : ''));
const noBody = Object.entries(r.bodies).filter(([, b]) => !b).map(([id]) => id);
ok(!noBody.length, `every phone picture has its body colour measured at load (${Object.keys(r.bodies).length})` + (noBody.length ? ': missing ' + noBody.slice(0, 5).join(', ') : ''));
const phoneBad = r.phones.filter(p => !p.ok);
ok(!phoneBad.length, `a seeded ad with bold phones keeps to two colour families: ${r.phones.length} ads, ${[...new Set(r.phones.map(p => p.name))].length} phone sets` + (phoneBad.length ? '; ' + phoneBad.slice(0, 4).map(p => `${p.name} ${p.aspect} on ${p.pair} (${p.n} families)`).join(', ') : ''));
const perSet = {}; for (const p of r.phones) (perSet[p.name] ||= new Set()).add(p.pair);
const narrow = Object.entries(perSet).filter(([, s]) => s.size < 2);
ok(!narrow.length, 'every phone set still draws two pairs or more (New look changes colour): ' + Object.entries(perSet).map(([n, s]) => `${n} ${s.size}`).join(', '));
ok(r.unchanged.same === r.unchanged.of, `an ad with neutral phones or an unrestricted line draws the pair its seed's first draw gives (the look, then the pair): ${r.unchanged.same}/${r.unchanged.of}`);
{ const L = r.looks.look, n = Object.values(L).reduce((a, b) => a + b, 0), share = k => (L[k] || 0) / n;
  const W = r.looks.want, pc = k => Math.round(W[k] * 100);
  ok(['light', 'vivid', 'dark'].every(k => Math.abs(share(k) - W[k]) <= .08) && r.looks.most[1] / n <= r.looks.cap,
    `300 seeds of an unrestricted line draw the looks near their shares, light ${pc('light')}%, vivid ${pc('vivid')}%, dark ${pc('dark')}% (light ${L.light || 0}, vivid ${L.vivid || 0}, dark ${L.dark || 0}) over ${r.looks.pairs} pairs, none over ${Math.round(r.looks.cap * 100)}% (the most, ${r.looks.most[0]}, ${r.looks.most[1]})`); }
ok(r.grounds.photos > 0 && !r.grounds.off.length, `a seed's photograph keeps the card to two colour families: ${r.grounds.photos} photo grounds in 720 seeded ads, ${r.grounds.strong} of strong colour, each beside a pair of its family` + (r.grounds.off.length ? '; ' + r.grounds.off.slice(0, 4).join(', ') : ''));
ok(r.lineup.photos > 0 && !r.lineup.bad.length, `every photograph a seed draws agrees with its product (spec/ground-tags.json): ${r.lineup.photos} photo grounds` + (r.lineup.bad.length ? '; ' + r.lineup.bad.slice(0, 4).join('; ') : ''));
const reach = r.lineup.floors.filter(f => f.reach), short = r.lineup.floors.filter(f => !f.reach), floorBad = reach.filter(f => f.off > .03);
ok(reach.length > 0 && !floorBad.length, `a scene's floor lands at the product's foot: ${reach.length} ads, the farthest ${Math.max(0, ...reach.map(f => f.off)).toFixed(3)} of the height (at most .03)` + (short.length ? `; ${short.length} where the photograph's floor sits too low to reach within 1.45x come as close as they can (${short.map(f => f.subject + ' ' + f.src).join(', ')})` : '') + (floorBad.length ? '; ' + floorBad.slice(0, 3).map(f => `${f.subject} on ${f.src} ${f.off.toFixed(3)}`).join(', ') : ''));
const firstBy = {}; for (const f of r.firsts) firstBy[f.pair] = (firstBy[f.pair] || 0) + 1;
const firstMost = Math.max(0, ...Object.values(firstBy));
ok(r.firsts.length > 0 && firstMost <= Math.ceil(r.firsts.length / 4), `the first full ads of ${r.firsts.length} unrestricted lines spread over ${Object.keys(firstBy).length} pairs, at most ${firstMost} on one (31 of 35 were Green & Gold before 2026-11-18): ` + Object.entries(firstBy).sort((x, y) => y[1] - x[1]).map(([k, n]) => `${k} ${n}`).join(', '));

await browser.close();
console.log(fails.length ? `\n${fails.length} failed` : '\nall clear');
process.exit(fails.length ? 1 : 0);
