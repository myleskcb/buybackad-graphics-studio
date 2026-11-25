#!/usr/bin/env node
/* HOW SOON A SHOP'S POSTS START TO LOOK ALIKE (the owner, 2026-11-24: "How soon would these become
   generic after how many days or what quantity of post per day would you start to run into similar
   graphic designs", "have a similarity comparison. I mean, I think there's a threshold and there's an
   amount that's OK but too similar", "riffing off of a good design doesn't hurt ... but then if we keep
   doing that same thing, it becomes a repetitive cycle").

   A shop posts the full ad its line opens on, then presses New look for the next one, which moves the
   seed on by one (full-ad-studio.js, #fa-shuffle). This draws those ads, seed after seed, as Easy Mode
   draws them, and fingerprints each: what a viewer reads in a feed first (the colour pair and the
   ground), then the composition (the arrangement, the product's side, the alignment, the order of the
   blocks, the pose), the type (the face, the headline's treatment), the details (the sticker, the
   number, the call to action's mark, the plates), the products shown and the words the seed drew.

   Two ads are compared two ways:
     structure  the weighted share of the fingerprint they share (0 nothing, 1 everything; WEIGHTS);
     picture    how far apart they look at a glance: each shrunk to 24x24, the mean OKLab distance.
   TOO SIMILAR is a pair a viewer scrolling past would take for the same ad (structure >= TOO, or a
   picture closer than TWIN); a RIFF shares enough to read as related (structure >= RIFF) and is
   fine now and then. A posting schedule is replayed over the seeds in order (P posts a day; a viewer
   remembers WINDOW days): how many posts land too close to one in the viewer's memory, and when the
   first one does.

   The fingerprint, the comparisons and their lines live in motion/freshness.js, which the studio's New look keeps
   to (DESIGN-LAW 181): what this test measures is what the studio passes over. --guard replays a shop posting with
   that memory against New look as it was (the next seed each time), over two weeks at each rate.

   usage:  GFX_BASE=http://127.0.0.1:8934/ node scripts/freshness_sim.mjs --draw [--lines iphone,gold,car] [--n 200]
           node scripts/freshness_sim.mjs                 analyse what was drawn (.render/freshness/)
           node scripts/freshness_sim.mjs --guard [--days 28]   and replay posting with the freshness memory (draw 600 a line)
           node scripts/freshness_sim.mjs --json          the analysis as JSON */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { WEIGHTS, TOO, RIFF, TWIN, structure, picture, tooSimilar, layoutOf, rankFresh, windowsFor, twinOf, isRiff, DAYS, KEEP, AHEAD, PICTURE_TRIES } from '../motion/freshness.js';
export { WEIGHTS, TOO, RIFF, TWIN, structure, picture, tooSimilar };

const ROOT = new URL('../', import.meta.url).pathname, OUT = ROOT + '.render/freshness/';
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8934/').replace(/\/?$/, '/');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const WINDOWS = [7, 14], RATES = [1, 2, 3, 5, 10];


if (process.argv.includes('--draw')) {
  mkdirSync(OUT, { recursive: true });
  const LINES = arg('--lines', 'iphone,gold,car').split(','), N = +arg('--n', 200), START = +arg('--start', 1);
  const require = createRequire(import.meta.url), { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const browser = await chromium.launch(), page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', e => console.error('page error:', e.message));
  await page.goto(BASE + '?demo=1', { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => typeof renderEzCanvas === 'function' && typeof TEMPLATES !== 'undefined' && window.FullAdStudio, null, { timeout: 120000 });
  await page.evaluate(async () => {
    account = { email: 'fresh@local', role: 'admin', plan: 'pro' }; loadAccount = async () => account; recordExport = async () => true;
    const a = await resolveArea('90802'); if (a) setArea(a);
    try { jset('pgfx_area_asked', true); } catch (e) { }
    $('ez-phone').value = '(562) 999-4994'; $('ez-website').value = '';
  });
  for (const line of LINES) {
    const rows = [];
    for (let seed = START; seed < START + N; seed++) {
      const got = await page.evaluate(async ({ line, seed }) => {
        const M = await import('/motion/fullad.js'), FS = window.FullAdStudio, FA = FS.state;
        const S = FS.lines().find(s => s.key === ((FS.aliases ? FS.aliases() : {})[line] || line)); if (!S) return { error: 'no line ' + line };
        if (currentCat !== S.cat) setCategory(S.cat);
        FA.line[S.cat] = S.key; FA.recipe[S.cat] = ''; FA.seed = seed; FA.pair = ''; FA.voice = ''; FA.words = {}; FA.set = {}; FA.biz = '';
        const { ad, st } = await FS.build(540, FORMATS.square);
        const frame = M.fullStill(ad);
        // the fingerprint New look reads and the picture it draws (motion/freshness.js), as the studio reads them
        const FF = await import('/motion/full-families.js'), FR = await import('/motion/freshness.js'), lab = FR.pictureOf(frame);
        const c = document.createElement('canvas'); c.width = c.height = 220;
        const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(frame, 0, 0, 220, 220);
        return { ...FR.fingerprint(st, FF.FAMILY_OF), drawn: (ad.phones || []).map(p => (p.meta && p.meta.id) || p.id || '').filter(Boolean), lab, webp: c.toDataURL('image/webp', .8) };
      }, { line, seed });
      if (got.error) { console.error(line, seed, got.error); continue; }
      writeFileSync(`${OUT}${line}-${seed}.webp`, Buffer.from(got.webp.split(',')[1], 'base64'));
      const { webp, drawn, ...row } = got;
      // the products the ad drew are the ones its style names (New look reads the style, not the picture)
      if (drawn.length && drawn.slice().sort().join() !== row.products.slice().sort().join()) console.error(line, seed, 'drew', drawn.join(), 'but its style names', row.products.join());
      rows.push(row);
      if (rows.length % 25 === 0) process.stdout.write(`${line} ${rows.length} `);
    }
    writeFileSync(`${OUT}${line}.json`, JSON.stringify({ line, start: START, drawn: new Date().toISOString(), rows }));
    console.log(`\n${line}: ${rows.length} ads drawn`);
  }
  await browser.close();
  process.exit(0);
}

// ---------- a shop posting with the freshness memory (--guard) ----------
/* RUN days (--days, 28: a viewer's two weeks, then two more judged with it full) at P posts a day: New look as it was (the next seed each time), or with the memory (motion/freshness.js
   pickFresh over the next AHEAD looks, against the posts of the last DAYS days, as full-ad-studio.js nextFresh reads
   them). Each post is then judged as a viewer remembering VIEW days sees it: too close to one they saw (half its
   fingerprint, or its picture within TWIN), the picture twins on their own, the layout of one of the last ten posts or
   of the fortnight, the colour pair of one of the last eight, the phones of the post before, and the riffs. */
const GUARD = process.argv.includes('--guard'), RUN = +arg('--days', 28), VIEW = 14, DAY = 864e5, guards = {};
function replay(rows, P, memory) {
  const bySeed = new Map(rows.map(r => [r.seed, r])), posts = [];
  let seed = rows[0].seed, skipped = 0, eased = 0, drawnLooks = 0;
  for (let t = 0; t < P * RUN; t++) {
    const at = Math.floor(t / P) * DAY + (t % P) * Math.floor(DAY / P), mem = posts.filter(p => at - p.at <= DAYS * DAY).slice(-KEEP);
    if (t > 0) {
      if (!memory) seed += 1;
      else {
        const looks = []; for (let i = 1; i <= AHEAD && bySeed.has(seed + i); i++) looks.push(bySeed.get(seed + i));
        if (looks.length < AHEAD) return { ran_out_after: t, seeds_drawn: rows.length };
        // as nextFresh takes them: the first in rank whose picture twins no post, of the first PICTURE_TRIES
        const order = rankFresh(looks, mem, windowsFor(looks)); let p = order[0];
        for (const c of order.slice(0, PICTURE_TRIES)) { drawnLooks++; if (!twinOf(looks[c.i].lab, mem)) { p = c; break; } c.breaks = ['picture', ...c.breaks]; }
        seed += 1 + p.i; skipped += p.i; if (p.breaks.length) eased++;
      }
    }
    const r = bySeed.get(seed); if (!r) return { ran_out_after: t, seeds_drawn: rows.length };
    posts.push({ ...r, at, riff: isRiff(r, mem) });
  }
  const n = posts.length, k = { close: 0, twins: 0, layout10: 0, layoutFortnight: 0, pair8: 0, phonesAgain: 0, riffs: 0, riffsBackToBack: 0, riffsInFiveMost: 0 };
  let first = null;
  for (let t = 1; t < n; t++) {
    const f = posts[t], seen = posts.slice(0, t).filter(p => f.at - p.at <= VIEW * DAY), last = c => posts.slice(Math.max(0, t - c), t);
    const close = seen.some(p => tooSimilar(structure(f, p), picture(f, p))); if (close) { k.close++; if (first == null) first = Math.floor(t / P) + 1; }
    if (seen.some(p => picture(f, p) < TWIN)) k.twins++;
    if (last(10).some(p => layoutOf(p) === layoutOf(f))) k.layout10++;
    if (seen.some(p => layoutOf(p) === layoutOf(f))) k.layoutFortnight++;
    if (last(8).some(p => p.pair === f.pair)) k.pair8++;
    if (f.products.slice().sort().join() === posts[t - 1].products.slice().sort().join()) k.phonesAgain++;
    if (f.riff) { k.riffs++; if (posts[t - 1].riff) k.riffsBackToBack++; }
    k.riffsInFiveMost = Math.max(k.riffsInFiveMost, posts.slice(Math.max(0, t - 4), t + 1).filter(p => p.riff).length);
  }
  const pct = x => +(x / (n - 1)).toFixed(3);
  return { posts: n, too_close: pct(k.close), first_close_on_day: first, picture_twins: k.twins, layout_of_last_10: pct(k.layout10), layout_of_fortnight: pct(k.layoutFortnight),
    pair_of_last_8: pct(k.pair8), phones_as_post_before: pct(k.phonesAgain), riffs: pct(k.riffs), riffs_back_to_back: k.riffsBackToBack, riffs_in_any_five_at_most: k.riffsInFiveMost,
    ...(memory ? { looks_passed_over: +(skipped / (n - 1)).toFixed(2), looks_drawn_a_press: +(drawnLooks / (n - 1)).toFixed(2), eased_picks: eased, seeds_used: seed - rows[0].seed + 1 } : {}) };
}

// ---------- the analysis ----------
const files = existsSync(OUT) ? readdirSync(OUT).filter(f => /^[a-z]+\.json$/.test(f)) : [];
if (!files.length) { console.error('nothing drawn yet: run with --draw first'); process.exit(1); }
const report = {};
for (const f of files) {
  const { line, rows } = JSON.parse(readFileSync(OUT + f, 'utf8')), n = rows.length;
  // every pair of ads: how alike, two ways
  const S = [], V = [];
  let too = 0, riff = 0, twins = 0, pairs = 0;
  const examples = { too: [], riff: [], fresh: [] };
  for (let i = 0; i < n; i++) { S[i] = new Float32Array(n); V[i] = new Float32Array(n); }
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const s = structure(rows[i], rows[j]), v = picture(rows[i], rows[j]);
    S[i][j] = S[j][i] = s; V[i][j] = V[j][i] = v; pairs++;
    if (tooSimilar(s, v)) { too++; if (v < TWIN) twins++; examples.too.push([rows[i].seed, rows[j].seed, +s.toFixed(2), +v.toFixed(3)]); }
    else if (s >= RIFF) { riff++; examples.riff.push([rows[i].seed, rows[j].seed, +s.toFixed(2), +v.toFixed(3)]); }
  }
  // how varied each part is: the share of pairs of ads that match on it (lower is more varied)
  const parts = {};
  for (const k of Object.keys(WEIGHTS)) {
    if (k === 'products') continue;
    const c = {}; for (const r of rows) c[r[k]] = (c[r[k]] || 0) + 1;
    const match = Object.values(c).reduce((t, x) => t + x * (x - 1) / 2, 0) / (n * (n - 1) / 2);
    parts[k] = { options: Object.keys(c).length, match: +match.toFixed(3), top: Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([x, y]) => `${String(x).slice(0, 24)} ${Math.round(100 * y / n)}%`) };
  }
  // posting schedules: P a day, a viewer remembering W days
  const sched = {};
  for (const P of RATES) for (const W of WINDOWS) {
    const mem = P * W; let hits = 0, first = null, counted = 0;
    for (let t = 1; t < n; t++) {
      let hit = false;
      for (let u = Math.max(0, t - mem); u < t; u++) if (tooSimilar(S[t][u], V[t][u])) { hit = true; break; }
      counted++; if (hit) { hits++; if (first == null) first = Math.floor(t / P) + 1; }
    }
    sched[`${P}/day, ${W}-day memory`] = { posts_in_memory: mem, too_similar_share: +(hits / counted).toFixed(3), first_on_day: first };
  }
  // the layout alone (arrangement, side, alignment, block order): the same template in other paint
  const lay = r => [r.arrangement, r.side, r.align, r.order].join('|'), layN = new Set(rows.map(lay)).size;
  const layout = {};
  for (const P of RATES) { const W = 14, mem = P * W; let hits = 0, first = null; for (let t = 1; t < n; t++) { let h = false; for (let u = Math.max(0, t - mem); u < t; u++) if (lay(rows[t]) === lay(rows[u])) { h = true; break; } if (h) { hits++; if (first == null) first = Math.floor(t / P) + 1; } } layout[`${P}/day`] = { repeat_share: +(hits / (n - 1)).toFixed(2), first_on_day: first }; }
  const q = too / pairs;
  if (GUARD) guards[line] = Object.fromEntries(RATES.map(P => [`${P}/day`, { as_it_was: replay(rows, P, false), with_memory: replay(rows, P, true) }]));
  report[line] = {
    ads: n, pairs_compared: pairs, too_similar_pair_rate: +q.toFixed(4), riff_pair_rate: +(riff / pairs).toFixed(4), picture_twins: twins,
    // the chance the next post is too close to one of the last m (independent draws): 1-(1-q)^m
    expected: Object.fromEntries([[7, '1/day, a week'], [21, '3/day, a week'], [42, '3/day, two weeks'], [70, '5/day, two weeks'], [140, '10/day, two weeks']].map(([m, k]) => [k, +(1 - (1 - q) ** m).toFixed(3)])),
    schedules: sched, parts,
    examples: { too: examples.too.sort((a, b) => b[2] - a[2]).slice(0, 12), riff: examples.riff.sort((a, b) => b[2] - a[2]).slice(0, 12) },
    composition_skeleton: { arrangements: parts.arrangement.options, sides: parts.side.options, aligns: parts.align.options, orders: parts.order.options, layouts_used: layN },
    layout_repeats_14_days: layout,
  };
}
if (process.argv.includes('--json')) console.log(JSON.stringify(GUARD ? { report, guards } : report, null, 1));
else for (const [line, r] of Object.entries(report)) {
  console.log(`\n== ${line}: ${r.ads} ads, ${r.pairs_compared} pairs: too similar ${(r.too_similar_pair_rate * 100).toFixed(2)}% (${r.picture_twins} picture twins), riffs ${(r.riff_pair_rate * 100).toFixed(1)}%`);
  for (const [k, v] of Object.entries(r.schedules)) console.log(`   ${k.padEnd(26)} ${String(v.posts_in_memory).padStart(4)} in memory: ${(v.too_similar_share * 100).toFixed(1).padStart(5)}% of posts too close to one remembered; first on day ${v.first_on_day ?? '-'}`);
  console.log('   the same layout as one in the last 14 days: ' + Object.entries(r.layout_repeats_14_days).map(([k, v]) => `${k} ${Math.round(v.repeat_share * 100)}% (first day ${v.first_on_day ?? '-'})`).join('  ') + `  [${r.composition_skeleton.layouts_used} layouts]`);
  console.log('   how varied (share of pairs matching): ' + Object.entries(r.parts).map(([k, v]) => `${k} ${v.options}/${(v.match * 100).toFixed(0)}%`).join('  '));
}
if (GUARD && !process.argv.includes('--json')) for (const [line, G] of Object.entries(guards)) {
  console.log(`\n== ${line}: ${RUN} days of posts, each judged against the ${VIEW} days before it: New look as it was -> with the freshness memory`);
  const f = (a, b, key, pc = true) => { const v = x => x == null ? '-' : pc ? (x * 100).toFixed(1) + '%' : String(x); return `${key} ${v(a[key])} -> ${v(b[key])}`; };
  for (const [rate, { as_it_was: A, with_memory: B }] of Object.entries(G)) {
    if (A.ran_out_after != null || B.ran_out_after != null) { console.log(`   ${rate.padEnd(7)} ran out of drawn seeds (draw more with --n)`); continue; }
    console.log(`   ${rate.padEnd(7)} ${A.posts} posts: ` + [f(A, B, 'too_close'), f(A, B, 'first_close_on_day', false), f(A, B, 'picture_twins', false), f(A, B, 'layout_of_last_10'), f(A, B, 'layout_of_fortnight'), f(A, B, 'pair_of_last_8'), f(A, B, 'phones_as_post_before'), f(A, B, 'riffs'), f(A, B, 'riffs_in_any_five_at_most', false)].join('  ')
      + `  | passed over ${B.looks_passed_over} a press, drew ${B.looks_drawn_a_press}, ${B.eased_picks} eased, ${B.seeds_used} seeds`);
  }
}
