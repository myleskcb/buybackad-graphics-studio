#!/usr/bin/env node
/* THE VOICE BANK: every voiceover script in motion/audiences.js, recorded
   with ElevenLabs in the casts and moods its audience names (motion/voices.js),
   written to motion/voice/<audience>/<id>.mp3 with motion/voice/manifest.json.
   The ad maker picks a take that fits the ad's length and cleans it in the mix
   (motion/audio.js).

   Each script is recorded twice by default, by two different speakers, and
   across an audience's scripts every speaker is heard in every mood, so no two
   ads for the same people sound alike. --full records every script by every
   speaker in every mood instead (about three times the characters). Takes
   already on disk are kept, so a run can stop and resume.

   The key is read from ELEVENLABS_API_KEY, or from a line of that name in the
   repo's .env (gitignored). It is sent only to api.elevenlabs.io.

   usage: node scripts/voice_bank.mjs [--dry] [--only upgraders,seniors] [--lang en|es]
                                      [--full] [--force] [--limit N]
                                      [--model eleven_multilingual_v2|eleven_v3]
     --dry    prints the plan and the characters it would use; sends nothing */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { AUDIENCES, GENERAL } from '../motion/audiences.js';
import { CASTS, VOICE_MOODS, PREMADE, clipId, voWindow } from '../motion/voices.js';

const ROOT = new URL('../', import.meta.url).pathname;
const OUT = ROOT + 'motion/voice/', MANIFEST = OUT + 'manifest.json';
const API = 'https://api.elevenlabs.io/v1';
const argv = process.argv.slice(2), flag = k => argv.includes(k), arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const DRY = flag('--dry'), FULL = flag('--full'), FORCE = flag('--force'), LIMIT = +arg('--limit', 0);
const ONLY = arg('--only', '') ? arg('--only', '').split(',') : null, LANG = arg('--lang', '');
const MODEL = arg('--model', 'eleven_multilingual_v2');

function apiKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY.trim();
  try {
    const line = readFileSync(ROOT + '.env', 'utf8').split('\n').find(l => /^\s*ELEVENLABS_API_KEY\s*=/.test(l));
    if (line) return line.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  } catch (e) { /* no .env */ }
  return '';
}

// ------------------------------------------------------------ the plan

const everyone = { ...AUDIENCES, general: GENERAL };
const plan = [];
for (const [key, a] of Object.entries(everyone)) {
  if (ONLY && !ONLY.includes(key)) continue;
  for (const [lang, scripts] of Object.entries(a.vo || {})) {
    if (LANG && lang !== LANG) continue;
    // every speaker in every mood, interleaved so that consecutive scripts take different pairs
    const pairs = [];
    for (let d = 0; d < a.moods.length; d++) a.casts.forEach((c, k) => pairs.push([c, a.moods[(k + d) % a.moods.length]]));
    scripts.forEach((text, i) => {
      const takes = FULL ? pairs : [pairs[(2 * i) % pairs.length], pairs[(2 * i + 1) % pairs.length]];
      const seen = new Set();
      for (const [cast, mood] of takes) {
        const id = clipId(key, lang, i, cast, mood);
        if (seen.has(id)) continue; seen.add(id);
        plan.push({ id, audience: key, lang, i, text, cast, mood });
      }
    });
  }
}

const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : { clips: [] };
const have = new Set(manifest.clips.filter(c => existsSync(OUT + c.file)).map(c => c.id));
let todo = plan.filter(p => FORCE || !have.has(p.id));
if (LIMIT) todo = todo.slice(0, LIMIT);
const chars = todo.reduce((n, p) => n + p.text.length, 0);
console.log(`${plan.length} takes planned (${Object.keys(everyone).length} audiences), ${plan.length - todo.length} on disk, ${todo.length} to record: ${chars} characters on ${MODEL}`);
if (DRY) {
  for (const p of todo.slice(0, 400)) console.log(`  ${p.id.padEnd(52)} ${p.text}`);
  process.exit(0);
}

const KEY = apiKey();
if (!KEY) {
  console.error('No ElevenLabs key. Set ELEVENLABS_API_KEY in the environment (or in the repo\'s .env, which git ignores) and run this again.');
  process.exit(2);
}

// ------------------------------------------------------------ the voices

async function call(path, init = {}, tries = 5) {
  for (let k = 0; ; k++) {
    const res = await fetch(API + path, { ...init, headers: { 'xi-api-key': KEY, 'content-type': 'application/json', ...(init.headers || {}) } });
    if (res.ok) return res.json();
    const body = await res.text().catch(() => '');
    if ((res.status === 429 || res.status >= 500) && k < tries) { await new Promise(r => setTimeout(r, 1500 * 2 ** k)); continue; }
    const err = new Error(`${res.status} ${body.slice(0, 300)}`); err.status = res.status; throw err;
  }
}

const account = (await call('/voices')).voices || [];
const first = s => String(s || '').split(/[\s-]/)[0].toLowerCase();
const byName = name => account.find(v => first(v.name) === name.toLowerCase());
const SPANISH = /spanish|mexic|latin|colombi|argentin|castilian|español|chile|peru|venezuel|cuban|puerto/i;
const genderOf = v => String((v.labels || {}).gender || '').toLowerCase();
const spanishVoices = account.filter(v => SPANISH.test([v.name, v.description, ...Object.values(v.labels || {})].join(' ')));
console.log(`${account.length} voices in the account, ${spanishVoices.length} of them Spanish`);

/** The voices a take tries, in order: for a Spanish line an account voice
 *  labelled Spanish of the same gender (turned by the cast, so casts differ),
 *  then the cast's own voices, by the account's id or the premade fallback. */
function candidates(cast, lang) {
  const c = CASTS[cast], out = [];
  if (lang === 'es') {
    const g = c.gender === 'neutral' ? '' : c.gender;
    const es = spanishVoices.filter(v => !g || genderOf(v) === g);
    const turn = [...cast].reduce((h, ch) => h + ch.charCodeAt(0), 0);
    for (let k = 0; k < es.length; k++) { const v = es[(turn + k) % es.length]; out.push({ name: v.name, id: v.voice_id }); }
  }
  for (const n of c.voices) { const v = byName(n); out.push({ name: n, id: v ? v.voice_id : PREMADE[n] }); }
  return out.filter((v, i) => v.id && out.findIndex(w => w.id === v.id) === i);
}

// ------------------------------------------------------------ record

mkdirSync(OUT, { recursive: true });
const save = () => {
  manifest.clips.sort((a, b) => a.id.localeCompare(b.id));
  manifest.made = new Date().toISOString(); manifest.model = MODEL;
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + '\n');
};
let done = 0, failed = 0;
for (const p of todo) {
  const s = VOICE_MOODS[p.mood];
  const text = MODEL === 'eleven_v3' ? `${s.tag} ${p.text}` : p.text;
  const body = { text, model_id: MODEL, voice_settings: { stability: s.stability, similarity_boost: s.similarity_boost, style: s.style, use_speaker_boost: true, speed: s.speed } };
  let got = null, voice = null, lastErr = null;
  for (const v of candidates(p.cast, p.lang)) {
    try {
      got = await call(`/text-to-speech/${v.id}/with-timestamps?output_format=mp3_44100_128`, { method: 'POST', body: JSON.stringify(body) });
      voice = v; break;
    } catch (e) {
      lastErr = e;
      if (e.status === 401 || e.status === 402 || (e.status === 403 && !/voice/i.test(e.message))) { console.error('The key was refused: ' + e.message); save(); process.exit(3); }
    }
  }
  if (!got) { failed++; console.log(`  FAILED ${p.id}: ${lastErr && lastErr.message}`); continue; }
  const al = got.alignment || got.normalized_alignment || {};
  const ends = al.character_end_times_seconds || [], starts = al.character_start_times_seconds || [], ch = al.characters || [];
  const words = [];
  let w = '', w0 = 0;
  ch.forEach((c, k) => {
    if (/\s/.test(c)) { if (w) words.push([w, +w0.toFixed(3), +ends[k - 1].toFixed(3)]); w = ''; return; }
    if (!w) w0 = starts[k]; w += c;
  });
  if (w) words.push([w, +w0.toFixed(3), +ends[ends.length - 1].toFixed(3)]);
  const secs = ends.length ? ends[ends.length - 1] : 0;
  const file = `${p.audience}/${p.id}.mp3`;
  mkdirSync(OUT + p.audience, { recursive: true });
  writeFileSync(OUT + file, Buffer.from(got.audio_base64, 'base64'));
  manifest.clips = manifest.clips.filter(c => c.id !== p.id);
  manifest.clips.push({ id: p.id, audience: p.audience, lang: p.lang, i: p.i, text: p.text, cast: p.cast, mood: p.mood,
    voice: voice.name, voice_id: voice.id, model: MODEL, secs: +secs.toFixed(3), file, words });
  save(); done++;
  const room = secs <= voWindow(5) ? '5/6/8 s' : secs <= voWindow(6) ? '6/8 s' : secs <= voWindow(8) ? '8 s' : 'too long for any ad';
  console.log(`  ${p.id.padEnd(52)} ${voice.name.padEnd(12)} ${secs.toFixed(2)} s  fits ${room}`);
}
save();
console.log(`${done} recorded, ${failed} failed; ${manifest.clips.length} takes in the bank`);
process.exit(failed ? 1 : 0);
