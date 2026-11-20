#!/usr/bin/env node
/* A CITY'S OWN PHOTOGRAPH, NOW AND THEN, AND NEVER ANOTHER CITY'S (DESIGN-LAW 154; the owner, 2026-11-19,
   through the roadmap session, of a Pixel ad on the Golden Gate Bridge whose towns read LONG BEACH • LOS
   ANGELES • ANAHEIM: "that's SF", "let's use bg images (occasionally) but of the corresponding city..").

   A photograph of a place (spec/ground-tags.json: place, and the places table with each place's towns and
   states) stands behind an ad only where a town the ad prints is one of that place's towns, in one of its
   states where the ad's states are known, and then only on the seeds placeTurn lets through (two in five).
   Held here, in plain Node (no server), against the engine the site runs (motion/fullad.js):

   - towns of no place (the sample shop's, which every still in the library prints; a town typed in the
     video maker; no towns; towns in other states that share a Bay town's name: Richmond, Virginia;
     Albany, New York; Oakland, Maine): no line's own full ad and no recipe, on any seed, stands on a
     photograph of a place;
   - San Francisco's towns: the Golden Gate now and then (on some seeds, never more than a fifth of the
     ads, and only on seeds placeTurn lets through), never Lake Tahoe; Lake Tahoe's towns the reverse;
   - a photograph of a place handed to the engine with the ad (ground_photo), or picked for it (a suggestion
     used), is refused outside its towns and drawn inside them;
   - every still the library and Easy Mode's strip show (assets/recipe-stills, assets/library-looks, assets/hero,
     assets/layout-stills: their indexes
     record the photograph each stands on and the towns it prints) stands on no photograph of a place
     other than its own towns';
   - the tags: a photograph whose file names a landmark is tagged with its place, and every place has towns
     and states.

   usage:  node scripts/area_ground_check.mjs [--seeds N]   exits 1 on any failure */
import { readFileSync, existsSync } from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname;
// the engine starts loading a photograph it draws (loadGroundPhoto); in Node there is none to load, only the choice to read
if (typeof globalThis.Image === 'undefined') globalThis.Image = class { set src(v) { /* never loads: only the ground drawn is read */ } };
const F = await import(ROOT + 'motion/fullad.js'), C = await import(ROOT + 'motion/catalog.js'), G = await import(ROOT + 'motion/full-grounds.js');
const recipes = JSON.parse(readFileSync(ROOT + 'motion/recipes.json', 'utf8')).recipes;
const lines = JSON.parse(readFileSync(ROOT + 'motion/subjects.json', 'utf8')).subjects;
const TAGSPEC = JSON.parse(readFileSync(ROOT + 'spec/ground-tags.json', 'utf8'));
const SEEDS = Math.max(10, parseInt((process.argv[process.argv.indexOf('--seeds') + 1] || ''), 10) || 60);
const fails = [], ok = (pass, say) => { console.log(`  ${pass ? 'ok  ' : 'FAIL'} ${say}`); if (!pass) fails.push(say); };
const placeOf = src => ((G.GROUND_PHOTOS[src] || TAGSPEC.tags[src] || {}).place) || '';
const file = src => String(src || '').split('/').pop();

/* where an ad can be: the towns line it prints (feed_where, as the studio gives it; area, as the video maker's
   own field gives it) and their states (area_states, from the studio's "Long Beach, CA") */
const SAMPLE = { feed_where: 'LONG BEACH • LOS ANGELES • ANAHEIM', area_states: 'CA' };
const NOWHERE = [
  ['the sample shop (every library still)', SAMPLE],
  ['a town typed in the video maker', { area: 'Long Beach' }],
  ['the brand\'s home town with its state', { area: 'Long Beach, CA' }],
  ['no towns at all', { feed_where: '' }],
  ['Richmond, Virginia', { feed_where: 'RICHMOND • NORFOLK • VIRGINIA BEACH', area_states: 'VA' }],
  ['Albany, New York', { feed_where: 'ALBANY • TROY • SCHENECTADY', area_states: 'NY' }],
  ['Oakland, Maine', { area: 'Oakland, ME' }],
];
const SF = { feed_where: 'SAN FRANCISCO • DALY CITY • SOUTH SAN FRANCISCO', area_states: 'CA' };
const TAHOE = { feed_where: 'SOUTH LAKE TAHOE • TRUCKEE', area_states: 'CA NV' };

/* an ad as the studio builds it (full-ad-studio.js styleNow): a line's own, or a recipe's (its pictures as
   given, its card's photograph as a hint it may stand on, its lean) */
const lineStyle = (s, where, seed) => {
  // a line's own pictures, a set of them by the seed, as the studio loads them (in Node no pool is loaded to draw from)
  const set = (s.sets || [])[(seed >>> 0) % Math.max(1, (s.sets || []).length)] || [];
  return { ...C.DEFAULT_STYLE, lang: 'en', aspect: '1:1', headline: String((s.heads || ['WE BUY THEM'])[0]).toUpperCase(),
    subject: s.key === 'iphone' ? '' : s.key, subject_set: s.key === 'iphone' ? 0 : 1, phones: s.key === 'iphone' ? [] : set.length ? set.map(p => 'sub-' + p.file) : ['none'], ...where };
};
const recipeStyle = (r, where) => {
  const iph = r.subject === 'iphone', own = (r.pictures || []).length > 0;
  return { ...C.DEFAULT_STYLE, lang: 'en', aspect: '1:1', headline: String((r.words || {}).headline || 'WE BUY THEM').toUpperCase(), tag: String((r.words || {}).tag || '').toUpperCase(),
    subject: iph ? '' : r.subject, subject_set: (own || r.words_only) && !iph ? 1 : 0,
    phones: own ? r.pictures.map(p => `recipe:${r.id}/${p.file}`) : iph ? [] : ['none'],
    ...(r.ground_photo ? { ground_hint: { ...r.ground_photo } } : {}), ...(r.hint ? { hint: r.hint } : {}), ...where };
};
const seedsOf = base => Array.from({ length: SEEDS }, (_, i) => ((base | 0) || 1) + i * 7919);
/* every draw of the lines and the recipes for one place: { n, photos, places: { place: [seed...] }, where: [...] } */
function drawAll(where) {
  const out = { n: 0, photos: 0, places: {}, at: [] };
  const take = (st, seed, who) => {
    const got = F.fullStyle(st, seed, []);
    out.n++;
    if (got.background !== 'photo' || !got.ground_photo) return;
    out.photos++;
    const p = placeOf(got.ground_photo.src);
    if (p) { (out.places[p] = out.places[p] || []).push(seed); out.at.push(`${who} seed ${seed}: ${file(got.ground_photo.src)}`); }
  };
  for (const s of lines) for (const seed of seedsOf(1)) take(lineStyle(s, where, seed), seed, 'line ' + s.key);
  for (const r of recipes) for (const seed of seedsOf(r.seed).slice(0, Math.ceil(SEEDS / 3))) take(recipeStyle(r, where), seed, r.id);
  return out;
}

console.log(`area grounds: ${lines.length} lines on ${SEEDS} seeds and ${recipes.length} recipes on ${Math.ceil(SEEDS / 3)} seeds, for each place an ad can be`);

// the tags: a landmark's photograph says which place it is; a place has its towns and its states
const LANDMARK = /golden-gate|tahoe|emerald-bay|sand-harbor|baker-beach|battery-spencer|alcatraz|bay-bridge|hollywood|santa-monica|venice-beach|griffith|las-vegas|times-square|brooklyn|manhattan|space-needle|yosemite|half-dome|big-sur|skyline/;
const photos = [...new Set([...Object.keys(TAGSPEC.tags || {}), ...Object.keys(G.GROUND_PHOTOS)])];
const untagged = photos.filter(src => LANDMARK.test(file(src)) && !placeOf(src));
ok(!untagged.length, `every photograph whose file names a landmark is tagged with its place (${photos.filter(src => placeOf(src)).length} of ${photos.length})` + (untagged.length ? ': ' + untagged.map(file).join(', ') : ''));
const places = Object.entries(G.GROUND_PLACES), thin = places.filter(([, p]) => !(p.towns || []).length || !(p.states || []).length).map(([k]) => k);
const orphan = photos.filter(src => placeOf(src) && !G.GROUND_PLACES[placeOf(src)]).map(file);
ok(places.length > 0 && !thin.length && !orphan.length, `each place has its towns and states (${places.map(([k, p]) => `${k}: ${p.towns.length} towns, ${p.states.join('/')}`).join('; ')})` + (thin.length ? '; without: ' + thin.join(', ') : '') + (orphan.length ? '; a place not in the table: ' + orphan.join(', ') : ''));

// the engine's reading of where an ad is
const W = (t, s) => F.whereOf(t, s), gg = Object.keys(G.GROUND_PHOTOS).find(src => placeOf(src) === 'san-francisco'), tah = Object.keys(G.GROUND_PHOTOS).find(src => placeOf(src) === 'lake-tahoe');
const reads = [
  [W('📍 SAN FRANCISCO • OAKLAND', 'CA'), gg, true], [W('San Francisco, CA'), gg, true], [W('SF'), gg, true],
  [W('LONG BEACH • LOS ANGELES • ANAHEIM', 'CA'), gg, false], [W('RICHMOND • NORFOLK', 'VA'), gg, false], [W('Richmond, VA'), gg, false],
  [W('SAN FRANCISCO', 'NV'), gg, false], [W('SOUTH LAKE TAHOE', 'CA'), gg, false], [W('STATELINE', 'NV'), tah, true], [W('SAN FRANCISCO', 'CA'), tah, false],
].filter(([, src]) => src).map(([w, src, want]) => ({ w, src, want, got: F.placeHere(G.GROUND_PHOTOS[src], w) }));
const misread = reads.filter(x => x.got !== x.want).map(x => `${x.w.towns.join(' • ')} (${[...x.w.states].join(' ') || 'no state'}) ${x.want ? 'should' : 'should not'} take ${file(x.src)}`);
ok(!misread.length, `the towns and states an ad prints are read as the engine reads them (${reads.length} cases)` + (misread.length ? ': ' + misread.join('; ') : ''));
let turned = 0; for (let s = 1; s <= 10000; s++) turned += F.placeTurn(s * 7919) ? 1 : 0;
ok(turned > 3000 && turned < 5000, `now and then: placeTurn lets ${(turned / 100).toFixed(1)}% of seeds through (two in five)`);

// towns of no place: never a photograph of one
for (const [name, where] of NOWHERE) {
  const d = drawAll(where), n = Object.values(d.places).flat().length;
  ok(!n, `${name}: no photograph of a place in ${d.n} ads (${d.photos} on photographs)` + (n ? ': ' + d.at.slice(0, 6).join('; ') : ''));
}

// San Francisco: the Golden Gate now and then, never Tahoe; Tahoe the reverse
for (const [name, where, own, other] of [['San Francisco', SF, 'san-francisco', 'lake-tahoe'], ['Lake Tahoe', TAHOE, 'lake-tahoe', 'san-francisco']]) {
  const d = drawAll(where), mine = d.places[own] || [], theirs = d.places[other] || [], offTurn = mine.filter(s => !F.placeTurn(s));
  ok(mine.length > 0 && mine.length <= d.n * .2 && !offTurn.length && !theirs.length,
    `${name}: its own photographs on ${mine.length} of ${d.n} ads (${(mine.length / d.n * 100).toFixed(1)}%, now and then), none off the seeds that let a place through, none of ${other}`
    + (offTurn.length ? `; off turn on seeds ${offTurn.slice(0, 5).join(', ')}` : '') + (theirs.length ? `; ${other} on ${theirs.length}` : ''));
}

// a photograph of a place handed to the engine with the ad: refused outside its towns, drawn inside them
if (gg) {
  const given = where => F.fullStyle({ ...C.DEFAULT_STYLE, headline: 'WE BUY IPHONES', aspect: '1:1', phones: [], ground_photo: { src: gg, focus: [.5, .5] }, ...where }, 4242, []);
  const out = given(SAMPLE), inn = given(SF);
  ok(out.background !== 'photo' && !(out.ground_photo && out.ground_photo.src === gg) && inn.background === 'photo' && inn.ground_photo && inn.ground_photo.src === gg,
    `a photograph of a place given with the ad (${file(gg)}) is refused under the sample's towns (drew ${out.background}) and drawn under its own (drew ${inn.background})`);
  // and picked (a suggestion used, Suggest for me: a look kept from one area is not drawn on another's city)
  const picked = where => F.fullStyle({ ...C.DEFAULT_STYLE, headline: 'WE BUY IPHONES', aspect: '1:1', phones: [], ...where }, 4242, [], { background: 'photo', ground_photo: { src: gg, focus: [.5, .5] } });
  const pOut = picked(SAMPLE), pIn = picked(SF);
  ok(!(pOut.ground_photo && pOut.ground_photo.src === gg) && pIn.background === 'photo' && pIn.ground_photo && pIn.ground_photo.src === gg,
    `a photograph of a place picked for the ad is refused under the sample's towns (drew ${pOut.background}) and drawn under its own (drew ${pIn.background})`);
}

// the stills the library shows, as drawn: none on another place's photograph
for (const [dir, kinds] of [['assets/recipe-stills', ['recipe']], ['assets/library-looks', ['recipe', 'full']], ['assets/hero', ['recipe', 'full']], ['assets/layout-stills', ['recipe']]]) {
  const f = ROOT + dir + '/index.json'; if (!existsSync(f)) { ok(false, `${dir}/index.json is missing`); continue; }
  const items = Object.entries(JSON.parse(readFileSync(f, 'utf8')).items || {}).filter(([, it]) => kinds.includes(it.kind));
  const unread = items.filter(([, it]) => !('photo' in it)).map(([id]) => id);
  const wrong = items.filter(([, it]) => it.photo && placeOf(it.photo) && !F.placeHere(G.GROUND_PHOTOS[it.photo] || TAGSPEC.tags[it.photo], F.whereOf(it.where, it.states)))
    .map(([id, it]) => `${id}: ${file(it.photo)} under ${it.where || 'no towns'}`);
  const towns = [...new Set(items.map(([, it]) => it.where).filter(Boolean))];
  ok(!unread.length && !wrong.length, `${dir}: ${items.length} stills, ${items.filter(([, it]) => it.photo).length} on photographs, none of another place's (towns printed: ${towns.slice(0, 3).join(' | ') || 'none'})`
    + (unread.length ? `; ${unread.length} drawn before their photograph was recorded (redraw them: ${unread.slice(0, 3).join(', ')})` : '') + (wrong.length ? '; ' + wrong.slice(0, 6).join('; ') : ''));
}

console.log(fails.length ? `area grounds: ${fails.length} failed` : 'area grounds: a city\'s photograph stands only behind its own towns, and only now and then');
process.exit(fails.length ? 1 : 0);
