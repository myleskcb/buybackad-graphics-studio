// THE VOICES.
//
// The owner, 2026-09-30: "make some talk with 11 labs voices", and "make the
// voices clean and vary by theme mood attitude etc."
//
// A cast is a kind of speaker (a crisp young presenter, a warm neighbour, an
// older man who takes his time), played by one of a few ElevenLabs voices in
// order of preference. A mood is how the line is read: the voice settings that
// make the same speaker hyped, calm, sly or plain. An audience (audiences.js)
// names the casts and moods that suit it; the voice bank
// (scripts/voice_bank.mjs) records each script in them; the maker picks a clip
// that fits the ad's length; audio.js cleans it and sets it over the music.
//
// Nothing here is sent anywhere by the page. The clips are files in
// motion/voice/, made once by the generator with the owner's key.

import { AUDIENCES, GENERAL, scriptSecs } from "./audiences.js";

// How each mood reads a line. stability: lower is livelier and less even;
// style: how much of the voice's own character it leans on; speed: 0.7 to 1.2.
// tag: an audio tag that only the eleven_v3 model reads (v2 ignores the idea,
// so the generator leaves it out there).
export const VOICE_MOODS = {
  hype:       { stability: .30, similarity_boost: .80, style: .55, speed: 1.08, tag: "[excited]" },
  playful:    { stability: .35, similarity_boost: .80, style: .50, speed: 1.05, tag: "[playfully]" },
  warm:       { stability: .50, similarity_boost: .80, style: .30, speed: .98, tag: "[warmly]" },
  calm:       { stability: .70, similarity_boost: .80, style: .12, speed: .92, tag: "[calmly]" },
  confident:  { stability: .55, similarity_boost: .80, style: .30, speed: 1.00, tag: "[confidently]" },
  luxe:       { stability: .65, similarity_boost: .85, style: .25, speed: .92, tag: "[softly]" },
  street:     { stability: .40, similarity_boost: .80, style: .45, speed: 1.03, tag: "[casually]" },
  sincere:    { stability: .62, similarity_boost: .80, style: .18, speed: .95, tag: "[sincerely]" },
  newsy:      { stability: .60, similarity_boost: .80, style: .30, speed: 1.05, tag: "[announcer]" },
  festive:    { stability: .35, similarity_boost: .80, style: .55, speed: 1.05, tag: "[cheerfully]" },
  reassuring: { stability: .66, similarity_boost: .80, style: .18, speed: .94, tag: "[gently]" },
};

// ElevenLabs' premade voices, by name. The generator looks each name up in the
// account's own voice list first (ids can change); these ids are the fallback.
export const PREMADE = {
  Rachel: "21m00Tcm4TlvDq8ikWAM", Antoni: "ErXwobaYiN019PkySvjV", Arnold: "VR6AewLTigWG4xSOukaG", Domi: "AZnzlk1XvdvUeBnXmlld",
  Aria: "9BWtsMINqrJLrRacOk9x", Laura: "FGY2WhTYpPnrIDTdsKH5", George: "JBFqnCBsd6RMkjVDRZzb", River: "SAz9YHcvj6GT2YYXdXww",
  Charlotte: "XB0fDUnXU5powFXDhCwa", Matilda: "XrExE9yKIg1WjnnlVkGX", Jessica: "cgSgspJ2msm6clMCkdW9", Chris: "iP95p4xoKVk53GoZ742B",
  Daniel: "onwK4e9ZLuTAKqWW03F9", Bill: "pqHfZKP75CvOlQylNhV4", Adam: "pNInz6obpgDQGcFmaJgB", Josh: "TxGEqnHWrfWFTfGW9XjX",
  Sarah: "EXAVITQu4vr4xnSDxMaL", Sam: "yoZ06aMxZJJ28mfd3POQ", Roger: "CwhRBWXzGAHq8TQ4Fs17", Charlie: "IKne3meq5aSn9XLyUdCD",
  Callum: "N2lVS1w4EtoT3dr4eOWO", Liam: "TX3LPaxmHKxFdv7VOQHJ", Alice: "Xb7hH8MSUJpSbSDYk0k2", Will: "bIHbv24MWmeRgasZH58o",
  Eric: "cjVigY5qzO86Huf0OWal", Brian: "nPczCjzI2devNBz1zQrb", Lily: "pFZP5JQG7iQjIQuC4Bku",
};

// The speakers. voices: tried in order. es: for a Spanish line the generator
// first looks for a voice in the account whose labels say Spanish or Latin
// American (and the same gender), then falls back to these voices, which the
// multilingual model speaks in Spanish.
export const CASTS = {
  crisp_f:   { label: "Crisp presenter (f)", gender: "female", voices: ["Sarah", "Alice", "Rachel"], note: "clear, modern, professional" },
  crisp_m:   { label: "Crisp presenter (m)", gender: "male", voices: ["Liam", "Brian", "Eric"], note: "articulate, even, sure" },
  host_f:    { label: "Social host (f)", gender: "female", voices: ["Laura", "Jessica", "Aria"], note: "upbeat, bright, talks to camera" },
  host_m:    { label: "Social host (m)", gender: "male", voices: ["Will", "Roger", "Chris"], note: "friendly, energetic" },
  gamer_m:   { label: "Streamer (m)", gender: "male", voices: ["Callum", "Will", "Josh"], note: "punchy, a grin in it" },
  warm_f:    { label: "Warm neighbour (f)", gender: "female", voices: ["Matilda", "Lily", "Aria"], note: "friendly, unhurried" },
  warm_m:    { label: "Warm neighbour (m)", gender: "male", voices: ["Eric", "Chris", "Charlie"], note: "easy-going, kind" },
  elder_m:   { label: "Trusted elder (m)", gender: "male", voices: ["Bill", "George", "Brian"], note: "older, patient, plain" },
  calm_f:    { label: "Calm guide (f)", gender: "female", voices: ["Rachel", "Lily", "Matilda"], note: "slow, clear, gentle" },
  street_m:  { label: "Street local (m)", gender: "male", voices: ["Chris", "Sam", "Will"], note: "casual, straight talk" },
  street_f:  { label: "Street local (f)", gender: "female", voices: ["Jessica", "Domi", "Laura"], note: "confident, casual" },
  warm_es_f: { label: "Vecina (f, español)", gender: "female", voices: ["Matilda", "Aria", "Sarah"], es: true, note: "cálida, de confianza" },
  warm_es_m: { label: "Vecino (m, español)", gender: "male", voices: ["Eric", "Antoni", "Chris"], es: true, note: "amable, claro" },
  sincere_x: { label: "Sincere (any)", gender: "neutral", voices: ["River", "Charlie", "Lily"], note: "plain, honest, soft" },
  news_m:    { label: "Announcer (m)", gender: "male", voices: ["Daniel", "Adam", "Brian"], note: "headline delivery" },
  luxe_f:    { label: "Luxe (f)", gender: "female", voices: ["Charlotte", "Lily", "Alice"], note: "low, smooth, discreet" },
  luxe_m:    { label: "Luxe (m)", gender: "male", voices: ["George", "Brian", "Adam"], note: "deep, unhurried" },
};

/** Speech starts after the frame-0 hit has decayed and ends before the mix
 *  fades, so a clip has duration - VO_START - VO_TAIL seconds. */
export const VO_START = .3, VO_TAIL = .5;
export const voWindow = duration => duration - VO_START - VO_TAIL;

/** The clips on disk (motion/voice/manifest.json), loaded once by the page. */
let BANK = { clips: [] };
export function setVoiceBank(m) { BANK = m && Array.isArray(m.clips) ? m : { clips: [] }; return BANK; }
export const voiceBank = () => BANK;
export const clipById = id => BANK.clips.find(c => c.id === id) || null;
export async function loadVoiceBank(url = new URL("./voice/manifest.json", import.meta.url)) {
  try {
    const r = await fetch(url, { cache: "no-cache" });
    return setVoiceBank(r.ok ? await r.json() : null);
  } catch (e) { return setVoiceBank(null); }
}

/** A stable id for one take: audience, language, script, cast, mood. */
export function clipId(audience, lang, i, cast, mood) { return `${audience}-${lang}-${i}-${cast}-${mood}`; }

/** The voice an ad speaks in: its speakers and moods come from the audience
 *  (or from GENERAL for an ad made for everyone), then the take in the bank
 *  that fits the ad's length and is closest to that cast and mood. With no
 *  take on disk the script is still chosen, so the panel can show what the
 *  ad would say. locked keeps a cast or mood picked by hand. */
export function pickVoice(st, r, locked = new Set()) {
  const a = AUDIENCES[st.audience] || GENERAL, key = AUDIENCES[st.audience] ? st.audience : "general";
  if (!locked.has("voice_mood") && !a.moods.includes(st.voice_mood)) st.voice_mood = r.pick(a.moods);
  if (!locked.has("voice_cast") && !a.casts.includes(st.voice_cast)) st.voice_cast = r.pick(a.casts);
  const lang = st.lang === "both" ? (r() < .5 ? "en" : "es") : st.lang === "es" ? "es" : "en";
  const room = voWindow(st.duration || 6);
  st.vo_lang = lang;
  const takes = BANK.clips.filter(c => c.audience === key && c.lang === lang && c.secs <= room);
  if (takes.length) {
    const score = c => (c.cast === st.voice_cast ? 2 : 0) + (c.mood === st.voice_mood ? 1 : 0);
    const best = Math.max(...takes.map(score)), c = r.pick(takes.filter(t => score(t) === best));
    st.vo_clip = c.id; st.vo_text = c.text; st.voice_cast = c.cast; st.voice_mood = c.mood;
    return st;
  }
  const scripts = ((a.vo || {})[lang] || []).filter(s => scriptSecs(s) <= room);
  st.vo_clip = ""; st.vo_text = scripts.length ? r.pick(scripts) : "";
  return st;
}

/** The take still fits the ad as it is now (its audience, language and
 *  length), so a change of length or a bank that arrives late re-picks. */
export function voiceFits(st) {
  if (st.voice === "off") return true;
  const key = AUDIENCES[st.audience] ? st.audience : "general";
  const room = voWindow(st.duration || 6), c = st.vo_clip ? clipById(st.vo_clip) : null;
  const lang = st.lang === "both" ? (c ? c.lang : st.vo_lang) : st.lang === "es" ? "es" : "en";
  if (c) return c.audience === key && c.lang === lang && c.secs <= room;
  if (BANK.clips.some(t => t.audience === key && t.lang === lang && t.secs <= room)) return false;   // a take is on disk: use it
  const a = AUDIENCES[st.audience] || GENERAL;
  return ((a.vo || {})[lang] || []).includes(st.vo_text) && scriptSecs(st.vo_text) <= room;
}
