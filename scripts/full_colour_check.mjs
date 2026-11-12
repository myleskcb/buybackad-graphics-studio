#!/usr/bin/env node
/* THE FULL AD'S COLOURS, MEASURED (DESIGN-LAW 138; motion/fullad.js).

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
                rule (the first draw of the seed's stream over all twelve).

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

// 0. the pairs' file is the studio's twelve, with their suits
try { execFileSync(process.execPath, [new URL('./build_house_colours.mjs', import.meta.url).pathname, '--check'], { stdio: 'pipe' }); ok(true, 'motion/house-colours.js is in step with the studio\'s twelve pairs and AFFINITY'); }
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
  const out = { chevrons: [], words: [], lines: [], phones: [], unchanged: { same: 0, of: 0 }, bodies: {} };

  // chevrons, on the picture as delivered
  for (const aspect of ['1:1', '9:16']) for (const pair of F.COLOURWAYS) {
    const st = F.fullStyle({ ...C.DEFAULT_STYLE, ...words, aspect, phones: ids('iPhone 16 Pro').slice(0, 2) }, 4242, index, { palette: pair });
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

  // nothing else moves: the seed's first draw over all twelve, as before the rule
  for (const [phones, headline, subject] of [[['16-pro-max-natural', '16-pro-max-white'], 'SELL YOUR IPHONE', ''], [['15-pro-black', '15-pro-white', '16-black'], 'WE BUY IPHONES', ''], [['none'], 'WE BUY COINS', 'coins'], [['none'], 'WE BUY CARS & TRUCKS', 'car']])
    for (let s = 1; s <= 150; s++) {
      const seed = s * 104729, st = F.fullStyle({ ...C.DEFAULT_STYLE, headline, subject, aspect: '1:1', phones }, seed, index);
      const was = F.COLOURWAYS[Math.floor(E.rng((seed >>> 0) * 7 + 11)() * F.COLOURWAYS.length) % F.COLOURWAYS.length];
      out.unchanged.of++; if (st.full_colour === was) out.unchanged.same++;
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
ok(r.unchanged.same === r.unchanged.of, `an ad with neutral phones or an unrestricted line draws the pair it drew before: ${r.unchanged.same}/${r.unchanged.of}`);

await browser.close();
console.log(fails.length ? `\n${fails.length} failed` : '\nall clear');
process.exit(fails.length ? 1 : 0);
