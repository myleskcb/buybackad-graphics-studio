#!/usr/bin/env node
/* THE LISTING MAKER, CHECKED (motion/listing.js).

   Every angle (wholesale and local buyer among them) x every tone x every
   description, over phone sets drawn from the video maker's own phones, with
   and without an area, in English and Spanish:

   1. It passes iPhones LA's checks as ported (lint, legitimacy): no blocker,
      no warning but the feed's cut on a long title, and a legitimacy score of
      at least 95.
   2. The title is a buy ad to iPhones LA's CRM ("we buy", "sell your" ...),
      80 characters at most, with the lead model inside the first 60 (what the
      feed shows), and names a phone that is on the picture.
   3. It is about the picture: the description names every model on it (up to
      five), its area when there is one, and a Spanish ad has its Spanish.
   4. It is long: every title at least 40 characters where the patterns allow,
      every description at least 1,200 (the report prints the spread).
   5. Nothing left over: no {placeholder}, no "your area shop", no OfferUp
      named, no phone number, no doubled space, no "stealth" phone-for-sale
      title (a title that names a phone without saying it buys).

   usage: node scripts/listing_check.mjs      exits non-zero on any problem */
import { readFileSync } from 'node:fs';
import { listingFor, readAd, titleOptions, describe, lint, compactModels, ANGLES, ANGLE_KEYS, ANGLE_AUDIENCE, TONES, TITLE_MAX, TITLE_FEED, BODY_MAX } from '../motion/listing.js';
import { AUDIENCES } from '../motion/audiences.js';

const idx = JSON.parse(readFileSync(new URL('../motion/phones/index.json', import.meta.url), 'utf8')).phones;
const meta = Object.fromEntries(idx.map(p => [p.id, p]));
const problems = [];
const bad = (where, what) => { if (problems.length < 60) problems.push(`${where}: ${what}`); else problems.length++; };

// phone sets: the maker's default, one phone, the five newest, a mixed old set, one of each series
const ids = idx.map(p => p.id);
const bySeries = {}; for (const p of idx) { const n = /iPhone (\d+)/.exec(p.model)[1]; (bySeries[n] = bySeries[n] || []).push(p.id); }
const SETS = [
  ['18-pro-max-burgundy', '17-pro-max-cosmic-orange', '18-pro-max-glacier', '16-pink'],
  ['16-pro-desert-titanium'],
  ids.slice(0, 5),
  Object.values(bySeries).map(l => l[0]).slice(0, 6),
  ['13-mini-blue', '14-plus-yellow', '15-pink'].filter(id => meta[id]),
  ids.filter(id => /17e|16e/.test(meta[id].model)).slice(0, 2),
].filter(s => s.length);
const AREAS = ['Long Beach', '', 'LOS ANGELES'];
const LANGS = ['en', 'es', 'both'];

for (const [k, a] of Object.entries(ANGLE_AUDIENCE)) if (a !== 'none' && !AUDIENCES[a]) bad(`angle ${k}`, `its audience "${a}" is not in audiences.js`);
for (const k of ['wholesale', 'local_buyer']) { if (!ANGLES[k]) bad('angles', `no ${k} angle`); if (!AUDIENCES[k]) bad('audiences', `no ${k} audience`); }

let n = 0, titleLens = [], bodyLens = [];
for (const angle of ANGLE_KEYS) for (const tone of Object.keys(TONES)) {
  const T = ANGLES[angle].tones[tone];
  if (!T) { bad(`${angle}/${tone}`, 'no patterns'); continue; }
  for (const set of SETS) for (const area of AREAS) for (const lang of LANGS) {
    const st = { phones: set, area, lang, headline: 'WE BUY IPHONES', tag: 'TEXT A PIC', audience: 'none' };
    const read = readAd(st, meta);
    for (let v = 0; v < T.bodies.length; v++) {
      n++;
      const L = listingFor(st, meta, { angle, tone, bodyVariant: v, titleVariant: v });
      const where = `${angle}/${tone}/${v} [${set.length} phones, ${area || 'no area'}, ${lang}]`;
      const { title, description: body, check } = L;
      titleLens.push(title.length); bodyLens.push(body.length);
      // 1
      for (const b of check.blockers) bad(where, `blocked: ${b.code} (${b.message})`);
      for (const w of check.warnings) if (w.code !== 'title_cut') bad(where, `warning: ${w.code} (${w.message})`);
      if (check.legit.score < 95) bad(where, `legitimacy ${check.legit.score}: ${check.legit.signals.map(s => s.code).join(', ')}`);
      // 2
      if (!/we\s*buy|sell\s*(me|us|your)|buy\s*back|buyback/i.test(title)) bad(where, `"${title}" does not say it buys`);
      if (title.length > TITLE_MAX) bad(where, `title ${title.length} characters`);
      const lead = read.models.find(m => title.includes(m));
      if (read.models.length && !read.models.some(m => title.includes(m) || title.includes(m.replace(/^iPhone /, '')))) bad(where, `"${title}" names no phone on the picture`);
      if (lead && title.indexOf(lead) + lead.length > TITLE_FEED) bad(where, `"${title}": the model is past the feed's ${TITLE_FEED}`);
      // 3
      const compact = compactModels(read.models.slice(0, 5));   // "the iPhone 18, 17 and 16 Pro Max" names all three
      for (const m of read.models.slice(0, 5)) {
        const short = m.replace(/^iPhone /, '');
        if (!body.includes(compact) && !body.includes(m) && !new RegExp(`\\b${short.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(body)) bad(where, `the description does not name ${m}, which is on the picture`);
      }
      if (read.area && !body.includes(read.area)) bad(where, `the description does not name the area ${read.area}`);
      if (lang !== 'en' && !/Hablamos español/.test(body)) bad(where, 'a Spanish ad without its Spanish paragraph');
      if (lang === 'en' && /Compramos/.test(body)) bad(where, 'Spanish on an English ad');
      // 4
      if (body.length < 1200) bad(where, `description only ${body.length} characters`);
      if (body.length > BODY_MAX) bad(where, `description ${body.length} characters`);
      // 5
      const both = title + '\n' + body;
      if (/\{\w+\}/.test(both)) bad(where, `a placeholder left: ${both.match(/\{\w+\}/)[0]}`);
      if (/your area (shop|meeting)|from your area|: your area/i.test(both)) bad(where, `"your area" used as a place name`);
      if (/offerup/i.test(both)) bad(where, 'names OfferUp');
      if (/ {2,}|\n{3,}/.test(both)) bad(where, 'a doubled space or blank line');
      if (/\d{3}\D?\d{3}\D?\d{4}/.test(both)) bad(where, 'a phone number');
    }
  }
  // every title the angle offers for the default set is a buy ad that passes
  const ctx = { ...readAd({ phones: SETS[0], area: 'Long Beach' }, meta), angle };
  const opts = titleOptions(ctx, angle, tone);
  if (!opts.length) bad(`${angle}/${tone}`, 'no title passes');
  for (const o of opts) { const c = lint(o.title, describe(ctx, angle, tone, 0, o.title)); if (!c.ok) bad(`${angle}/${tone} title option`, `"${o.title}" is blocked`); }
}

// The words on the picture choose the angle when no audience does
const said = (words, angle) => { const r = readAd({ phones: SETS[0], ...words }, meta); if (r.angle !== angle) bad('reading the ad', `${JSON.stringify(words)} read as ${r.angle}, not ${angle}`); };
said({ headline: 'WE BUY IPHONES WHOLESALE' }, 'wholesale');
said({ headline: 'COMPRAMOS IPHONES AL MAYOREO' }, 'wholesale');
said({ headline: 'LOCAL IPHONE BUYER' }, 'local_buyer');
said({ headline: 'WE BUY CRACKED IPHONES TOO' }, 'damaged');
said({ headline: 'WE BUY IPHONES', audience: 'wholesale' }, 'wholesale');
said({ headline: 'WE BUY IPHONES', audience: 'local_buyer' }, 'local_buyer');
said({ headline: 'WE BUY IPHONES' }, 'general');
// an uploaded phone is not named as a model
const up = readAd({ phones: ['upload-1', '16-pink'] }, { ...meta, 'upload-1': { id: 'upload-1', model: 'Your phone', finish: 'IMG_0001', upload: true } });
if (up.models.join() !== 'iPhone 16' || up.uploads !== 1) bad('reading the ad', `an upload read as ${JSON.stringify(up.models)}`);

// an ad of uploaded phones only: no model to name, still a whole listing that passes
{
  const upMeta = { ...meta, 'upload-2': { id: 'upload-2', model: 'Your phone', finish: 'IMG_2', upload: true } };
  for (const angle of ANGLE_KEYS) {
    const L = listingFor({ phones: ['upload-2'], area: 'Long Beach', lang: 'en' }, upMeta, { angle });
    if (!L.check.ok || L.check.warnings.some(w => w.code !== 'title_cut')) bad(`uploads only/${angle}`, `"${L.title}": ${[...L.check.blockers, ...L.check.warnings].map(f => f.code).join(', ')}`);
    if (/Your phone|IMG_2|\{/.test(L.title + L.description)) bad(`uploads only/${angle}`, 'names the upload or leaves a placeholder');
    if (/in the picture are the models/.test(L.description)) bad(`uploads only/${angle}`, 'claims pictured models it cannot name');
  }
}
// "Hablamos español" only on an ad that speaks Spanish
for (const lang of ['en', 'es']) {
  const L = listingFor({ phones: SETS[0], area: 'Long Beach', lang }, meta, { angle: 'general', bodyVariant: 1 });
  if ((lang === 'en') === /Hablamos/.test(L.description)) bad('Spanish claim', `${lang} ad ${lang === 'en' ? 'says' : 'does not say'} "Hablamos español"`);
}
// the price, as the listings site checks it
const priced = p => listingFor({ phones: SETS[0], area: 'Long Beach' }, meta, { angle: 'local_buyer', price: p }).check;
const expect = (p, want) => { const c = priced(p), got = [...c.blockers, ...c.warnings].map(f => f.code).concat(c.legit.signals.map(s => 'legit:' + s.code)); for (const w of want) if (!got.includes(w)) bad(`price ${JSON.stringify(p)}`, `expected ${w}, got ${got.join(', ') || 'nothing'}`); if (!want.length && got.some(g => !/title_cut/.test(g))) bad(`price ${JSON.stringify(p)}`, `expected a clean pass, got ${got.join(', ')}`); };
expect('', ['price_missing']); expect('abc', ['price_missing']); expect('650', []); expect('$1,240', []);
expect('1', ['price_bait', 'legit:price_bait']); expect('999', ['legit:price_bait']); expect('1000', ['legit:price_bait']); expect('2000', ['price_inflated', 'legit:price_bait']);
if (priced(undefined).blockers.length) bad('price', 'a listing without a price field is blocked');
// a run of ads in one angle: each title tells apart from the others, each description is no copy of another
{
  const history = [], runSets = [...SETS, ['13-pink'], ['15-blue', '14-yellow']].filter(s => s.every(id => meta[id]));
  for (const angle of ['wholesale', 'local_buyer']) {
    history.length = 0;
    runSets.forEach((phones, i) => {
      const L = listingFor({ phones, area: 'Long Beach', lang: 'en' }, meta, { angle, history, key: `ad${i}` });
      const codes = L.check.warnings.map(w => w.code).concat(L.check.legit.signals.map(s => s.code));
      if (i < Object.values(ANGLES[angle].tones).reduce((n, t) => n + t.bodies.length, 0) && codes.some(c => ['duplicate', 'collides', 'near_copy'].includes(c))) bad(`run of ${angle} ads #${i + 1}`, `"${L.title}": ${codes.join(', ')}`);
      // the same ad again is not a copy of itself
      const again = listingFor({ phones, area: 'Long Beach', lang: 'en' }, meta, { angle, history: [...history, { key: `ad${i}`, title: L.title, body: L.description }], key: `ad${i}` });
      if (again.title !== L.title || again.description !== L.description) bad(`run of ${angle} ads #${i + 1}`, 'the same ad wrote a different listing once its own was remembered');
      history.push({ key: `ad${i}`, title: L.title, body: L.description });
    });
  }
}

const spread = a => { const s = [...a].sort((x, y) => x - y); return `${s[0]} to ${s[s.length - 1]}, median ${s[s.length >> 1]}`; };
console.log(`${n} listings: ${ANGLE_KEYS.length} angles x ${Object.keys(TONES).length} tones x their descriptions, ${SETS.length} phone sets, ${AREAS.length} areas, ${LANGS.length} languages`);
console.log(`  titles ${spread(titleLens)} characters; descriptions ${spread(bodyLens)}`);
if (problems.length) { console.log(problems.slice(0, 60).map(p => '  ' + p).join('\n')); console.log(`${problems.length} problems`); process.exit(1); }
console.log('all clear');
