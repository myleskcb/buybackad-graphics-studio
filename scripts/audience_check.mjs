#!/usr/bin/env node
/* THE AUDIENCE LIBRARY, CHECKED (motion/audiences.js, motion/voices.js).

   1. Every look an audience or a new vibe names exists: each palette, ground,
      face, treatment, number style, entrance, music kit, grade, hook and
      overlay is one the catalog draws.
   2. Every line a customer reads or hears keeps the house copy rules
      (scripts/refresh_copy.mjs): no price, no deadline or countdown, no rank
      ("best", "#1", "highest"), no clock ("in minutes", "instant"), no named
      company, no licence or rating, no promise about who answers, no long
      dash. A voiceover never reads out a number: it points at the screen.
   3. Every script fits an ad: its estimated length fits the 8-second ad's
      window, and every audience has at least one script per language that
      fits the 5-second ad, so the shortest ad can speak too.
   4. Every cast and mood an audience names exists, and every cast's voices
      are ones the generator can find.

   usage: node scripts/audience_check.mjs      exits non-zero on any problem */
import { FONTS, PALETTES, OPTIONS, VIBES, COPY, HEADLINES, HOOKS, TAGS } from '../motion/catalog.js';
import { AUDIENCES, MORE_VIBES, MOODS, GENERAL, scriptSecs } from '../motion/audiences.js';
import { CASTS, VOICE_MOODS, PREMADE, voWindow } from '../motion/voices.js';
import { BANNED, CLAIM, PRICE, PROOF, HOURS, DASH, COMPANY, LICENSE } from './refresh_copy.mjs';

const problems = [];
const bad = (where, what) => problems.push(`${where}: ${what}`);
const has = (list, v) => list.includes(v);

// 1. looks
const LOOK_KEYS = { palettes: Object.keys(PALETTES), backgrounds: OPTIONS.background, fonts: Object.keys(FONTS), fx: OPTIONS.text_fx,
  numbers: OPTIONS.number_style, text_in: OPTIONS.text_in, skew: [0, 8, 12, -8], hooks: OPTIONS.hook };
for (const [k, v] of Object.entries(MORE_VIBES)) {
  if (v.la !== false) bad(`vibe ${k}`, 'a look that is not an LA sign says la: false');
  if (!v.label) bad(`vibe ${k}`, 'no label');
  for (const [axis, known] of Object.entries(LOOK_KEYS)) for (const x of v[axis] || []) if (!has(known, x)) bad(`vibe ${k}.${axis}`, `"${x}" is not in the catalog`);
  for (const axis of ['palettes', 'backgrounds', 'fonts', 'fx', 'numbers', 'text_in']) if (!(v[axis] || []).length) bad(`vibe ${k}`, `no ${axis}`);
}
const allVibes = new Set(['none', ...Object.keys(VIBES), ...Object.keys(MORE_VIBES)]);
const AUD_LOOKS = { sound_kit: OPTIONS.sound_kit, grade: OPTIONS.grade, hook: OPTIONS.hook, overlay: OPTIONS.overlay, urgency: OPTIONS.urgency };
const everyone = { ...AUDIENCES, _general: GENERAL };
for (const [k, a] of Object.entries(everyone)) {
  const L = a.looks || {};
  if (k !== '_general') {
    for (const v of L.vibes || []) if (!allVibes.has(v)) bad(`audience ${k}.vibes`, `"${v}" is not a vibe`);
    for (const [axis, known] of Object.entries(AUD_LOOKS)) for (const x of L[axis] || []) if (!has(known, x)) bad(`audience ${k}.${axis}`, `"${x}" is not an option`);
    if (L.bpm && !(L.bpm.length === 2 && L.bpm[0] >= 80 && L.bpm[1] <= 140 && L.bpm[0] < L.bpm[1])) bad(`audience ${k}.bpm`, `${L.bpm} is not a range inside 80 to 140`);
  }
  for (const m of a.moods || []) if (!MOODS[m] || !VOICE_MOODS[m]) bad(`audience ${k}.moods`, `"${m}" is not a mood`);
  for (const c of a.casts || []) if (!CASTS[c]) bad(`audience ${k}.casts`, `"${c}" is not a cast`);
  if (!(a.moods || []).length || !(a.casts || []).length) bad(`audience ${k}`, 'needs moods and casts');
}
for (const m of Object.keys(MOODS)) if (!VOICE_MOODS[m]) bad(`mood ${m}`, 'has no voice settings');
for (const [m, s] of Object.entries(VOICE_MOODS)) {
  if (!(s.speed >= .7 && s.speed <= 1.2)) bad(`mood ${m}`, `speed ${s.speed} is outside 0.7 to 1.2`);
  for (const q of ['stability', 'similarity_boost', 'style']) if (!(s[q] >= 0 && s[q] <= 1)) bad(`mood ${m}`, `${q} ${s[q]} is outside 0 to 1`);
}
for (const [c, v] of Object.entries(CASTS)) for (const n of v.voices) if (!PREMADE[n]) bad(`cast ${c}`, `voice "${n}" has no fallback id`);

// 2. words
const RULES = { BANNED, CLAIM, PRICE, PROOF, HOURS, DASH, COMPANY, LICENSE };
const DIGITS = /\d{3}/;
let lines = 0, scripts = 0;
function words(where, s, spoken) {
  lines++;
  for (const [name, re] of Object.entries(RULES)) if (re.test(s)) bad(where, `"${s}" breaks ${name}`);
  if (DIGITS.test(s)) bad(where, `"${s}" has a number in it`);
  if (!spoken && s !== s.toUpperCase()) bad(where, `"${s}" is not in capitals like the rest of the on-screen copy`);
  if (!spoken && /\{(?!AREA\}|CODE\})/.test(s)) bad(where, `"${s}" has an unknown placeholder`);
  if (spoken && /\{/.test(s)) bad(where, `"${s}": a script cannot fill a placeholder`);
  if (spoken && /\b(PHONE NUMBER IS|DIAL|CALL \d)\b/i.test(s)) bad(where, `"${s}" reads a number out`);
}
// no longer than the house's own longest line of the same kind (catalog.js)
const LIMITS = {};
const count = s => String(s).split(/\s+/).length;
for (const key of ['hooks', 'headlines', 'tags', 'cta']) {
  const legacy = { hooks: HOOKS, headlines: HEADLINES, tags: TAGS }[key] || [];
  const own = [...legacy, ...Object.values(COPY).flatMap(c => c[key] || []), ...Object.values(VIBES).flatMap(v => Object.values(v.copy || {}).flatMap(c => c[key] || []))];
  LIMITS[key] = Math.max(...own.map(count));
}
for (const [k, a] of Object.entries(AUDIENCES)) {
  for (const [L, c] of Object.entries(a.copy || {})) for (const [key, list] of Object.entries(c)) {
    if (!LIMITS[key]) bad(`audience ${k}.copy.${L}`, `unknown pool "${key}"`);
    for (const s of list) {
      words(`audience ${k}.copy.${L}.${key}`, s, false);
      const n = count(s);
      if (n > LIMITS[key]) bad(`audience ${k}.copy.${L}.${key}`, `"${s}" is ${n} words; a ${key.replace(/s$/, '')} holds ${LIMITS[key]}`);
    }
  }
  for (const L of ['en', 'es']) {
    const c = (a.copy || {})[L];
    if (!c || !(c.headlines || []).length || !(c.hooks || []).length) bad(`audience ${k}`, `no ${L} hooks or headlines`);
  }
}

// 3. scripts
const W5 = voWindow(5), W8 = voWindow(8);
for (const [k, a] of Object.entries(everyone)) {
  for (const L of ['en', 'es']) {
    const list = (a.vo || {})[L] || [];
    if (!list.length) { bad(`audience ${k}.vo`, `no ${L} scripts`); continue; }
    for (const s of list) {
      scripts++;
      words(`audience ${k}.vo.${L}`, s, true);
      const secs = scriptSecs(s);
      if (secs > W8) bad(`audience ${k}.vo.${L}`, `"${s}" runs about ${secs.toFixed(1)} s; the 8-second ad has ${W8.toFixed(1)} s`);
    }
    if (!list.some(s => scriptSecs(s) <= W5)) bad(`audience ${k}.vo.${L}`, `nothing fits the 5-second ad (${W5.toFixed(1)} s)`);
  }
}

const n = Object.keys(AUDIENCES).length, v = Object.keys(MORE_VIBES).length;
console.log(`${n} audiences, ${v} new looks, ${Object.keys(CASTS).length} casts, ${Object.keys(VOICE_MOODS).length} moods; ${lines} lines checked, ${scripts} scripts`);
if (problems.length) { console.log(problems.map(p => '  ' + p).join('\n')); console.log(`${problems.length} problems`); process.exit(1); }
console.log('all clear');
