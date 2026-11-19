#!/usr/bin/env node
/* THE OWNER'S REVIEW, APPLIED (OPEN-ITEMS §BJ, DESIGN-LAW 144).

   The review page (scripts/build_review_page.mjs, published as an Artifact) keeps each of the
   owner's decisions in its store, one document an ad: { id, gen, cat, name, verdict: "up" |
   "down" | "", note, picture, at }. The session that published it reads them (ArtifactData list
   of "decisions") into a file and runs this:

     a thumb down on a designer layout or an offer card   a row in template-retired.js (the hand
                                                          list: app.js leaves it out of TEMPLATES)
     a thumb down on a library card                       a row in assets/showcase/holds.json, then
                                                          scripts/hold_showcase.mjs --write stamps it
     a thumb down on a full ad, an Any look or a FeedAd   listed: those are fixed, not retired
     a note or a picture                                  listed in .render/review-worklist.json,
                                                          for the words or picture to be changed by
                                                          hand and checked (words_check, the census)
     every decision                                       kept in assets/review-decisions.json, the
                                                          record of what the owner said and when

   Nothing is deleted; a retired or held ad comes back by deleting its row.

   usage:  node scripts/apply_review.mjs --decisions file.json           dry run: say what it would do
           node scripts/apply_review.mjs --decisions file.json --write   do it */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const ROOT = new URL('../', import.meta.url).pathname;
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const WRITE = process.argv.includes('--write'), FILE = arg('--decisions');
if (!FILE) { console.error('usage: node scripts/apply_review.mjs --decisions file.json [--write]'); process.exit(2); }
const raw = JSON.parse(readFileSync(FILE, 'utf8'));
// accept the store's listing ({docs:[{id, data}]}), an array of bodies, or an object keyed by id
const docs = Array.isArray(raw) ? raw : Array.isArray(raw.docs) ? raw.docs.map(d => d.data || d) : Object.values(raw);
const decisions = docs.filter(d => d && d.id).map(d => ({ id: d.id, gen: d.gen, cat: d.cat, name: d.name, verdict: d.verdict || '', hero: !!d.hero, note: (d.note || '').trim(), picture: d.picture || '', at: d.at || 0 }));
const day = new Date().toISOString().slice(0, 10);

const retire = decisions.filter(d => d.verdict === 'down' && (d.gen === 'dl' || d.gen === 'of'));
const hold = decisions.filter(d => d.verdict === 'down' && d.gen === 'sc');
const fixNotRetire = decisions.filter(d => d.verdict === 'down' && !['dl', 'of', 'sc'].includes(d.gen));
const work = decisions.filter(d => d.note || d.picture);
const approved = decisions.filter(d => d.verdict === 'up');
const heroes = decisions.filter(d => d.hero);

console.log(`${decisions.length} decisions: ${approved.length} approved, ${retire.length + hold.length + fixNotRetire.length} denied, ${work.length} with a change asked`);
const why = d => `owner denied it in the review, ${day}${d.note ? ': ' + d.note.replace(/\s+/g, ' ').slice(0, 120) : ''}`;

// 1. designer layouts and offer cards: the hand list of retired templates
if (retire.length) {
  const p = ROOT + 'template-retired.js', src = readFileSync(p, 'utf8');
  const fresh = retire.filter(d => !src.includes(JSON.stringify(d.id) + ':'));
  console.log(`retire ${fresh.length} template${fresh.length === 1 ? '' : 's'} (template-retired.js)` + (fresh.length ? ': ' + fresh.map(d => d.id).join(', ') : ''));
  if (WRITE && fresh.length) {
    const rows = `  // ${day}, the owner's review (scripts/apply_review.mjs)\n` + fresh.map(d => `  ${JSON.stringify(d.id)}:${JSON.stringify(why(d))},`).join('\n') + '\n';
    const at = src.lastIndexOf('};'); if (at < 0) { console.error('template-retired.js has no closing };'); process.exit(2); }
    writeFileSync(p, src.slice(0, at) + rows + src.slice(at));
  }
}

// 2. library cards: the owner's holds, stamped by hold_showcase.mjs
if (hold.length) {
  const p = ROOT + 'assets/showcase/holds.json', H = JSON.parse(readFileSync(p, 'utf8'));
  const have = new Set(H.holds.map(h => h.id)), fresh = hold.filter(d => !have.has(d.id));
  console.log(`hold ${fresh.length} library card${fresh.length === 1 ? '' : 's'} (assets/showcase/holds.json)` + (fresh.length ? ': ' + fresh.map(d => d.id).join(', ') : ''));
  if (WRITE && fresh.length) {
    H.holds.push(...fresh.map(d => ({ id: d.id, why: why(d) })));
    writeFileSync(p, JSON.stringify(H, null, 1) + '\n');
    console.log(execFileSync(process.execPath, [ROOT + 'scripts/hold_showcase.mjs', '--write'], { encoding: 'utf8' }).trim().split('\n').slice(-2).join('\n'));
  }
}

// 3. the owner's hero picks: a library card goes on the wall's hand list (assets/hero-picks.json picks,
//    in the order picked); any other ad is listed until the wall can show it
if (heroes.length) {
  const p = ROOT + 'assets/hero-picks.json', HP = JSON.parse(readFileSync(p, 'utf8'));
  // the wall shows library cards, offer and designer templates, recipes and full-ad looks (the last
  // two from stills: scripts/build_hero_stills.mjs); a video maker look or a FeedAd still is listed
  const WALL = ['sc', 'of', 'dl', 'recipe', 'full'];
  const cards = heroes.filter(d => WALL.includes(d.gen)).sort((a, b) => a.at - b.at), fresh = cards.filter(d => !HP.picks.includes(d.id));
  console.log(`hero picks: ${heroes.length} (${fresh.length} new to the wall's list` + (heroes.length > cards.length ? `; ${heroes.length - cards.length} the wall cannot show, listed: ${heroes.filter(d => !WALL.includes(d.gen)).map(d => d.id).join(', ')}` : '') + ')');
  if (fresh.some(d => d.gen === 'recipe' || d.gen === 'full')) console.log('  then draw their stills: GFX_BASE=http://127.0.0.1:8931/ node scripts/build_hero_stills.mjs');
  if (WRITE && fresh.length) { HP.picks.push(...fresh.map(d => d.id)); const raw = readFileSync(p, 'utf8'), ind = (/^\{\n( +)"/.exec(raw) || [, '  '])[1].length; writeFileSync(p, JSON.stringify(HP, null, ind) + (raw.endsWith('\n') ? '\n' : '')); }
}

// 4. what is fixed, not retired; and every note or picture
if (fixNotRetire.length) console.log(`denied, to be fixed rather than retired (${fixNotRetire.length}): ` + fixNotRetire.map(d => `${d.id}${d.note ? ' ("' + d.note.slice(0, 60) + '")' : ''}`).join('; '));
if (work.length) {
  console.log(`changes asked (${work.length}):`);
  for (const d of work) console.log(`  ${d.id} [${d.gen}, ${d.cat}]${d.picture ? ' picture → ' + d.picture : ''}${d.note ? '\n      ' + d.note.replace(/\n/g, '\n      ') : ''}`);
}
if (WRITE) {
  mkdirSync(ROOT + '.render', { recursive: true });
  writeFileSync(ROOT + '.render/review-worklist.json', JSON.stringify({ made: new Date().toISOString(), denyToFix: fixNotRetire, work }, null, 1));
  const rp = ROOT + 'assets/review-decisions.json', R = existsSync(rp) ? JSON.parse(readFileSync(rp, 'utf8')) : { about: 'The owner\'s decisions from the review page (scripts/build_review_page.mjs), as applied by scripts/apply_review.mjs. Newest per ad wins.', decisions: {} };
  for (const d of decisions) R.decisions[d.id] = d;
  writeFileSync(rp, JSON.stringify(R, null, 1) + '\n');
  console.log(`kept ${decisions.length} decisions in assets/review-decisions.json; the worklist is .render/review-worklist.json`);
} else console.log('\ndry run: add --write to apply');
