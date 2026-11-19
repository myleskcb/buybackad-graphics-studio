#!/usr/bin/env node
/* THE HERO WALL, AS A VISITOR SEES IT (DESIGN-LAW 145, 146; OPEN-ITEMS §BJ).

   The owner, 2026-11-19, of the home page's wall: "this hero is majorly lacking still", "too many similar or
   matching color schemes", "no pattern fills and only 1 gradient multi color" (asked whether that meant fewer
   or more of them: "Show more of them"), "these are all so dark and unoptimized colors... why don't we have
   any of the video style ads on here that looked happier and more vibrant", "we need to show off our best of
   the best... not the same theme twice in 1 hero .. with different taglines".

   This opens the landing, reads the wall it built (app.js scBuildWall: the hand picks of
   assets/hero-picks.json first, laid out in the platform's mix) and holds it to:
     - every slot filled, every tile one of the hand picks (the wall is chosen, never filled by the machine);
     - no colour pair twice, no headline twice, no design twice (a rebuilt ad's family, its card's: one
       "Photo band" on the wall, not an orange one and a navy one);
     - bright: at most three dark tiles, and never two dark ones side by side or one above the other;
     - what the owner asked to see more of: three tiles or more on a pattern, three or more on a gradient;
     - the video maker's own full ads ("full-<line>"): three or more;
     - a product in every tile (nothing on its words alone).
   Each tile's pair, look, ground and headline are its still's, as it was drawn (assets/recipe-stills/index.json,
   assets/hero/index.json: scripts/build_recipe_stills.mjs, scripts/build_hero_stills.mjs).

   usage:  GFX_BASE=http://127.0.0.1:8934/ node scripts/hero_wall_check.mjs [--json]   exits 1 on any failure */
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const ROOT = new URL('../', import.meta.url).pathname;
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8899/').replace(/\/?$/, '/');
const json = p => JSON.parse(readFileSync(ROOT + p, 'utf8'));
const stills = (existsSync(ROOT + 'assets/recipe-stills/index.json') ? json('assets/recipe-stills/index.json').items : {}) || {};
const hero = (existsSync(ROOT + 'assets/hero/index.json') ? json('assets/hero/index.json').items : {}) || {};
const picks = (json('assets/hero-picks.json').picks || []).map(String);
const recipes = Object.fromEntries(json('motion/recipes.json').recipes.map(r => [r.id, r]));
const MOST_DARK = 3, LEAST_PATTERN = 3, LEAST_GRADIENT = 3, LEAST_FULL = 3;

const require = createRequire(import.meta.url), { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch(), page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on('pageerror', e => console.error('page error:', e.message));
await page.goto(BASE, { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => { const c = document.querySelectorAll('#hero-wall .wall-col'); return c.length && [...c].every(x => x.querySelectorAll('.wall-card').length >= 2); }, null, { timeout: 120000 });
// each column is its list twice (the loop): the first half is the column
const cols = await page.evaluate(() => [...document.querySelectorAll('#hero-wall .wall-col')].map(c => {
  const cards = [...c.querySelectorAll('.wall-card')];
  return cards.slice(0, cards.length / 2).map(d => ({ title: d.title, src: (d.querySelector('img') || {}).getAttribute ? d.querySelector('img').getAttribute('src') : '' }));
}));
await browser.close();

const idOf = src => { const m = /assets\/(?:recipe-stills|hero)\/([^/?#]+)\.webp/.exec(src || ''); return m ? m[1] : null; };
const tiles = [];
cols.forEach((col, c) => col.forEach((t, r) => {
  const id = idOf(t.src), meta = (id && (hero[id] || stills[id])) || null;
  tiles.push({ r, c, id, title: t.title, meta, full: !!id && /^full-/.test(id) });
}));
const bad = [], ok = (cond, what) => { if (!cond) bad.push(what); return cond; };
const want = cols.length * 6;
const norm = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
const twice = (key, label) => {
  const seen = {}; for (const t of tiles) { const k = key(t); if (!k) continue; (seen[k] ||= []).push(t.id || t.title); }
  const dup = Object.entries(seen).filter(([, v]) => v.length > 1);
  ok(!dup.length, `no ${label} twice on the wall` + (dup.length ? ': ' + dup.map(([k, v]) => `${k} (${v.join(', ')})`).join('; ') : ''));
};

ok(tiles.length === want, `the wall shows ${want} tiles (${cols.length} columns of 6): ${tiles.length}`);
const unknown = tiles.filter(t => !t.meta);
ok(!unknown.length, 'every tile is a still the indexes describe' + (unknown.length ? ': ' + unknown.map(t => t.title || t.src).join(', ') : ''));
const notPicked = tiles.filter(t => !t.id || !picks.includes(t.id));
ok(!notPicked.length, 'every tile is a hand pick (assets/hero-picks.json)' + (notPicked.length ? ': ' + notPicked.map(t => t.id || t.title).join(', ') : ''));
const known = tiles.filter(t => t.meta);
twice(t => t.meta && t.meta.pair, 'colour pair');
twice(t => t.meta && norm(t.meta.headline), 'headline');
twice(t => t.meta && !t.full && t.meta.family, 'design (a rebuilt ad\'s family)');
const missing = known.filter(t => !t.meta.look || !t.meta.ground);
ok(!missing.length, 'every tile\'s still records its look and its ground (draw the stills again)' + (missing.length ? ': ' + missing.map(t => t.id).join(', ') : ''));
const dark = known.filter(t => t.meta.look === 'dark');
ok(dark.length <= MOST_DARK, `at most ${MOST_DARK} dark tiles: ${dark.length}` + (dark.length ? ' (' + dark.map(t => t.id).join(', ') + ')' : ''));
const at = (r, c) => tiles.find(t => t.r === r && t.c === c);
const touching = [];
for (const t of dark) for (const [dr, dc] of [[1, 0], [0, 1]]) {
  // one above the other in a column (the column loops, so its last touches its first), or side by side in a row
  const rows = cols[t.c].length, u = dr ? at((t.r + 1) % rows, t.c) : at(t.r, t.c + 1);
  if (u && u !== t && u.meta && u.meta.look === 'dark') touching.push(`${t.id} and ${u.id}`);
}
ok(!touching.length, 'no two dark tiles touch' + (touching.length ? ': ' + touching.join('; ') : ''));
const kinds = k => known.filter(t => t.meta.ground === k).length;
ok(kinds('pattern') >= LEAST_PATTERN, `${LEAST_PATTERN} or more tiles on a pattern ("Show more of them"): ${kinds('pattern')}`);
ok(kinds('gradient') >= LEAST_GRADIENT, `${LEAST_GRADIENT} or more tiles on a gradient ("Show more of them"): ${kinds('gradient')}`);
const full = tiles.filter(t => t.full).length;
ok(full >= LEAST_FULL, `${LEAST_FULL} or more of the video maker's own full ads: ${full}`);
const bare = tiles.filter(t => t.id && recipes[t.id] && recipes[t.id].words_only);
ok(!bare.length, 'a product in every tile (none on its words alone)' + (bare.length ? ': ' + bare.map(t => t.id).join(', ') : ''));

const report = {
  tiles: tiles.map(t => ({ row: t.r, col: t.c, id: t.id, line: t.meta && t.meta.line, pair: t.meta && t.meta.pair, look: t.meta && t.meta.look, ground: t.meta && t.meta.ground, headline: t.meta && t.meta.headline })),
  counts: { light: known.filter(t => t.meta.look === 'light').length, vivid: known.filter(t => t.meta.look === 'vivid').length, dark: dark.length, pattern: kinds('pattern'), gradient: kinds('gradient'), photo: kinds('photo'), full },
  failures: bad,
};
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 1));
else {
  for (const t of report.tiles) console.log(`  ${t.row + 1}.${t.col + 1}  ${String(t.id).padEnd(34)} ${String(t.line).padEnd(9)} ${String(t.pair).padEnd(20)} ${String(t.look).padEnd(6)} ${String(t.ground).padEnd(9)} ${t.headline}`);
  console.log(JSON.stringify(report.counts));
  console.log(bad.length ? 'FAIL\n  ' + bad.join('\n  ') : `the hero wall holds: ${tiles.length} hand-picked tiles, every pair and headline once, ${dark.length} dark, ${kinds('pattern')} on a pattern, ${kinds('gradient')} on a gradient, ${full} full ads`);
}
process.exit(bad.length ? 1 : 0);
