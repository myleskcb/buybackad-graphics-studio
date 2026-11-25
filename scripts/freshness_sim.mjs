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

   usage:  GFX_BASE=http://127.0.0.1:8934/ node scripts/freshness_sim.mjs --draw [--lines iphone,gold,car] [--n 200]
           node scripts/freshness_sim.mjs                 analyse what was drawn (.render/freshness/)
           node scripts/freshness_sim.mjs --json          the analysis as JSON */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const ROOT = new URL('../', import.meta.url).pathname, OUT = ROOT + '.render/freshness/';
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8934/').replace(/\/?$/, '/');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
// what a viewer notices, weighted by how much of the picture it decides (sums to 1)
export const WEIGHTS = {
  pair: .22, ground: .12, groundKind: .06,                                   // colour and ground: seen first
  arrangement: .08, side: .04, align: .04, order: .04,                       // the composition
  face: .12, treatment: .06,                                                 // the type
  sticker: .04, number: .03, cta: .03, plates: .02,                          // the details
  products: .06, points: .02, claim: .02,                                    // the goods and the words
};
/* calibrated by eye on the closest pairs drawn, 2026-11-24 (.render/freshness-calibration.jpg): pairs sharing 63-69% of their
   fingerprint read as one ad, and so did pairs 0.068-0.08 apart in the picture even sharing only 40% (both lavender and
   purple; both red). Every such pair shared its colour pair. */
export const TOO = .5, RIFF = .35, TWIN = .085;   // structure shares; picture distance (mean OKLab ΔE at 24x24)
const WINDOWS = [7, 14], RATES = [1, 2, 3, 5, 10];

const kindOf = bg => /^pair_/.test(bg) ? 'gradient' : /^pat_/.test(bg) ? 'pattern' : /^shp_/.test(bg) ? 'shapes' : bg === 'photo' ? 'photo' : /^clip|^mv_/.test(bg) ? 'motion' : ['aurora', 'drift', 'sky_gradient', 'marble_soft', 'glow_orbs'].includes(bg) ? 'scene' : 'house';
export function structure(a, b) {
  const W = WEIGHTS, same = k => (a[k] != null && a[k] === b[k]) ? W[k] : 0;
  const A = new Set(a.products), B = new Set(b.products), inter = [...A].filter(x => B.has(x)).length, uni = new Set([...A, ...B]).size;
  return same('pair') + same('ground') + same('groundKind') + same('arrangement') + same('side') + same('align') + same('order')
    + same('face') + same('treatment') + same('sticker') + same('number') + same('cta') + same('plates')
    + (uni ? W.products * inter / uni : W.products) + same('points') + same('claim');
}
export function picture(a, b) { let t = 0; for (let i = 0; i < a.lab.length; i += 3) t += Math.hypot(a.lab[i] - b.lab[i], a.lab[i + 1] - b.lab[i + 1], a.lab[i + 2] - b.lab[i + 2]); return t / (a.lab.length / 3); }
export const tooSimilar = (s, v) => s >= TOO || v < TWIN;

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
        const tiny = document.createElement('canvas'); tiny.width = tiny.height = 24;
        const t = tiny.getContext('2d'); t.imageSmoothingQuality = 'high'; t.drawImage(frame, 0, 0, 24, 24);
        const px = t.getImageData(0, 0, 24, 24).data, lab = [];
        const lin = v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
        for (let i = 0; i < px.length; i += 4) {
          const r = lin(px[i]), g = lin(px[i + 1]), b = lin(px[i + 2]);
          const l = Math.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b), m = Math.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b), s = Math.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b);
          lab.push(+(.2104542553 * l + .793617785 * m - .0040720468 * s).toFixed(4), +(1.9779984951 * l - 2.428592205 * m + .4505937099 * s).toFixed(4), +(.0259040371 * l + .7827717662 * m - .808675766 * s).toFixed(4));
        }
        const c = document.createElement('canvas'); c.width = c.height = 220;
        const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(frame, 0, 0, 220, 220);
        const ids = (ad.phones || []).map(p => (p.meta && p.meta.id) || p.id || '').filter(Boolean);
        // the ground as a viewer sees it: a photograph is its picture and how it is laid under the words, any other its key;
        // its family as the engine files it (motion/full-families.js: abstract, shape, product, type)
        const FF = await import('/motion/full-families.js'), bg = String(st.background || '');
        const ground = bg === 'photo' && st.ground_photo ? 'photo:' + String(st.ground_photo.src || '').split('/').pop() + (st.full_treat ? ':' + st.full_treat : '') : bg;
        return {
          seed, pair: st.full_colour || '', ground, fam: (FF.FAMILY_OF || {})[bg] || '', arrangement: st.arrangement || '', side: st.full_side ?? null, align: st.full_align ?? null,
          order: st.full_order != null ? JSON.stringify(st.full_order) : null, pose: st.pose || '', face: st.type_pair || 'house', treatment: st.text_fx || '',
          sticker: st.sticker_shape || '', number: st.number_style || '', cta: st.cta_mark || '', plates: st.plate_fill || '', products: ids.length ? ids : (st.phones || []).map(String),
          points: st.points || '', claim: st.feed_claim || '', headline: st.headline || '', lab, webp: c.toDataURL('image/webp', .8),
        };
      }, { line, seed });
      if (got.error) { console.error(line, seed, got.error); continue; }
      writeFileSync(`${OUT}${line}-${seed}.webp`, Buffer.from(got.webp.split(',')[1], 'base64'));
      const { webp, fam, ...row } = got; row.groundKind = fam || kindOf(row.ground.split(':')[0]); rows.push(row);
      if (rows.length % 25 === 0) process.stdout.write(`${line} ${rows.length} `);
    }
    writeFileSync(`${OUT}${line}.json`, JSON.stringify({ line, start: START, drawn: new Date().toISOString(), rows }));
    console.log(`\n${line}: ${rows.length} ads drawn`);
  }
  await browser.close();
  process.exit(0);
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
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 1));
else for (const [line, r] of Object.entries(report)) {
  console.log(`\n== ${line}: ${r.ads} ads, ${r.pairs_compared} pairs: too similar ${(r.too_similar_pair_rate * 100).toFixed(2)}% (${r.picture_twins} picture twins), riffs ${(r.riff_pair_rate * 100).toFixed(1)}%`);
  for (const [k, v] of Object.entries(r.schedules)) console.log(`   ${k.padEnd(26)} ${String(v.posts_in_memory).padStart(4)} in memory: ${(v.too_similar_share * 100).toFixed(1).padStart(5)}% of posts too close to one remembered; first on day ${v.first_on_day ?? '-'}`);
  console.log('   the same layout as one in the last 14 days: ' + Object.entries(r.layout_repeats_14_days).map(([k, v]) => `${k} ${Math.round(v.repeat_share * 100)}% (first day ${v.first_on_day ?? '-'})`).join('  ') + `  [${r.composition_skeleton.layouts_used} layouts]`);
  console.log('   how varied (share of pairs matching): ' + Object.entries(r.parts).map(([k, v]) => `${k} ${v.options}/${(v.match * 100).toFixed(0)}%`).join('  '));
}
