// Phone Ad Maker sound: every cue is synthesised here, so nothing is fetched or licensed.
// Rendered offline with the Web Audio graph, then played with the preview or
// encoded into the video.
//
// Scored like a commercial, not a game (owner, 2026-09-30: "less annoying, slightly
// more professional or serious ... more commercial"):
//  - every kit plays a real chord progression in a key, not one bass note and drums;
//  - the bed starts filtered and opens on the headline hit, so the hit lands without
//    a stack of loud effects on top of it;
//  - one clean low hit per moment, soft whooshes, no per-letter ticks, no square-wave
//    coins or glitches, nothing pitched above about 2.6 kHz at any level;
//  - one room reverb under everything, and the music ducks under the hits;
//  - every ad is levelled to the same loudness (-16 LUFS, peaks under -1 dBFS), so no
//    look is louder than the next and nothing clips.
// Nothing is ever scheduled before the first frame (the guard at the end of synth): a
// phone that is already down on frame 0 (flash cut, punch in, cold open) never makes a
// sound before time zero. Where a look has a voiceover (voices.js), the take is cleaned
// and laid over the bed, which ducks under it.

import { rng, clamp } from "./engine.js";
import { SOUND_ALIASES } from "./catalog.js";
import { clipById, VO_START, voWindow } from "./voices.js";

const SR = 44100, TARGET_LUFS = -16, QUIET_LUFS = -19, CEILING = .891;   // .891 = -1 dBFS

const QUAL = { M: [0, 4, 7], m: [0, 3, 7], M7: [0, 4, 7, 11], m7: [0, 3, 7, 10], d7: [0, 4, 7, 10],
  add9: [0, 4, 7, 14], m9: [0, 3, 7, 10, 14], sus: [0, 5, 7] };
// [semitones above the key's tonic, chord quality], one chord per bar
const PROGS = {
  uplift: [[[0, "add9"], [7, "M"], [9, "m7"], [5, "add9"]], [[0, "add9"], [5, "add9"], [9, "m7"], [7, "sus"]], [[9, "m7"], [5, "M7"], [0, "add9"], [7, "M"]]],
  house: [[[0, "m7"], [8, "M7"], [3, "M7"], [10, "M"]], [[0, "m9"], [5, "m7"], [0, "m9"], [5, "m7"]]],
  hiphop: [[[0, "m9"], [8, "M7"], [5, "m7"], [7, "m7"]], [[0, "m7"], [5, "m7"], [8, "M7"], [7, "d7"]]],
  lofi: [[[2, "m7"], [7, "d7"], [0, "M7"], [9, "m7"]], [[5, "M7"], [4, "m7"], [2, "m7"], [0, "M7"]]],
  minimal: [[[0, "m"], [0, "m"], [8, "M"], [8, "M"]], [[0, "m7"], [0, "m7"], [5, "m7"], [5, "m7"]]],
  cinematic: [[[0, "m"], [8, "M"], [3, "M"], [10, "M"]], [[0, "m"], [5, "m"], [8, "M"], [7, "M"]]],
};
// how far the bed opens after the hit: the lo-fi kit stays dark on purpose
const OPEN_HZ = { lofi: 5200, cinematic: 9000, minimal: 12000 };

const hz = m => 440 * 2 ** ((m - 69) / 12);
const voicing = (root, q, lo) => QUAL[q].map(iv => { let m = root + iv; while (m < lo) m += 12; while (m >= lo + 12) m -= 12; return m; }).sort((a, b) => a - b);
const alias = (k, v) => (SOUND_ALIASES[k] && SOUND_ALIASES[k][v]) || v;

/** The soundtrack: the bed (the effects and the music) levelled to the target, with the
 *  look's voiceover laid over it where it has one. solo: "voice" or "bed" renders one stem
 *  alone, for measuring the mix (scripts/motion_sound_check.mjs). */
export async function renderSoundtrack(ad, { solo = "" } = {}) {
  const st = ad.st, kit = alias("sound_kit", st.sound_kit || "uplift"), len = Math.ceil(st.duration * SR);
  const voice = await voiceFor(st);
  if (solo === "voice") {
    const out = new AudioBuffer({ numberOfChannels: 2, length: len, sampleRate: SR });
    if (voice) layVoice(out, voice);
    return out;
  }
  // The bed is levelled as it plays with no voice, and a voiced ad keeps that gain:
  // levelled with the voice in, the music either side of the words would drop, and a
  // voiced mix stays within 1 dB of the same mix without one.
  const plain = await mixBed(ad, 0);
  const gain = levelGain(plain, kit !== "none" && PROGS[kit] ? TARGET_LUFS : QUIET_LUFS);
  if (!voice) { applyLevel(plain, gain); return plain; }
  const out = await mixBed(ad, voice.duration);       // the same bed, ducked under the words
  applyLevel(out, gain);
  if (solo !== "bed") layVoice(out, voice);
  keepUnder(out, PEAK);
  return out;
}

/** The effects and the music, rendered; voDur, the length of a voiceover to duck under. */
async function mixBed(ad, voDur) {
  const st = ad.st, tl = ad.tl, T = st.duration;
  const kit = alias("sound_kit", st.sound_kit || "uplift"), hitKind = alias("hit", st.hit), numKind = alias("number_sfx", st.number_sfx);
  const ctx = new OfflineAudioContext(2, Math.ceil(T * SR), SR);
  const r = rng(st.seed * 17 + 3);
  const noise = noiseBuffer(ctx, 2, st.seed);

  // ---- the mix: sfx and music into a gentle glue compressor, one shared room
  const master = ctx.createGain();
  const glue = ctx.createDynamicsCompressor();
  glue.threshold.value = -20; glue.knee.value = 12; glue.ratio.value = 2.5; glue.attack.value = .01; glue.release.value = .2;
  const rumble = ctx.createBiquadFilter(); rumble.type = "highpass"; rumble.frequency.value = 40; rumble.Q.value = .6;
  const bedOut = ctx.createGain();                         // the whole bed, ducked under a voiceover
  master.connect(glue).connect(rumble).connect(bedOut).connect(ctx.destination);
  const room = ctx.createConvolver(); room.buffer = roomImpulse(ctx, 1.7, st.seed);
  const roomOut = ctx.createGain(); roomOut.gain.value = .55;
  const roomTone = ctx.createBiquadFilter(); roomTone.type = "highpass"; roomTone.frequency.value = 220;
  room.connect(roomTone).connect(roomOut).connect(master);

  const hit = tl.hit, hasMusic = kit !== "none" && PROGS[kit];
  const openAt = hit > .35 ? hit : 0;
  const bus = (level, filtered) => {
    const g = ctx.createGain(); g.gain.value = level;
    const v = ctx.createGain(); v.gain.value = 1;
    if (!filtered) { g.connect(master); v.connect(room); return { in: g, verb: v }; }
    // the bed is dark and a little lower until the headline hit, then opens up
    const lp = (src, dest) => {
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.Q.value = .5;
      const top = OPEN_HZ[kit] || 17000;
      if (openAt > 0) { f.frequency.setValueAtTime(900, 0); f.frequency.setValueAtTime(900, Math.max(0, openAt - .55)); f.frequency.exponentialRampToValueAtTime(top, openAt); }
      else f.frequency.value = top;
      src.connect(f).connect(dest); return f;
    };
    const duck = ctx.createGain(); duck.connect(master);
    if (openAt > 0) { duck.gain.setValueAtTime(.72, 0); duck.gain.setValueAtTime(.72, Math.max(0, openAt - .55)); duck.gain.linearRampToValueAtTime(1, openAt); }
    lp(g, duck); lp(v, room);
    return { in: g, verb: v, duck };
  };
  const sfx = bus(1, false);
  const musicLevel = (st.music_volume ?? .5) * 1.3, music = bus(musicLevel, true);

  // ---- the key and the chords, drawn from the seed
  const tonic = r.pick([57, 58, 60, 62, 55, 53]);          // A, Bb, C, D, G, F
  const prog = hasMusic ? r.pick(PROGS[kit]) : PROGS.uplift[0];
  const bpm = st.bpm || 112, b = 60 / bpm, bar = 4 * b;
  const start = hit - Math.ceil(hit / bar) * bar;            // a bar line lands exactly on the headline hit
  const chordAt = t => prog[((Math.floor((t - start) / bar + 1e-6) % prog.length) + prog.length) % prog.length];
  const bell1 = hz(tonic % 12 + 72), bell2 = hz(tonic % 12 + 79);   // tonic and fifth, C5 to B5

  const S = synth(ctx, noise, r, sfx), M = synth(ctx, noise, r, music);
  const booms = [];
  const boom = (t, g) => { if (t < -.02) return; S.boom(Math.max(0, t), g); booms.push(Math.max(0, t)); };

  // ---- the phones arrive: a soft swish each and a muted landing
  const nP = Math.max(1, ad.phones.length), each = 1 / Math.sqrt(Math.max(1, nP / 3));
  let lastThump = -1;
  for (const p of ad.phones) {
    const pan = clamp((p.home[0] / ad.W) * 2 - 1, -1, 1) * .6, fl = p.tLand - p.tIn;
    if (p.tLand > .06 && fl > .05) S.swish(p.tIn, fl + .04, ["zoom", "pop"].includes(st.entry), pan, .15 * each);
    if (p.tLand > .02 && p.tLand - lastThump > .12) { S.thump(p.tLand - .005, .2 * each, pan); lastThump = p.tLand; }
    if (p.reveal && p.tReveal > 0) { S.swish(p.tReveal, .4, true, pan, .07); S.tock(p.tReveal + .46, .06, pan); }
  }

  // ---- the first frame always lands on a hit (the attention audit checks it)
  switch (st.hook) {
    case "hook_line":
      boom(0, .8); if (ad.hookEnd > .6) S.swish(ad.hookEnd - .4, .45, true, 0, .1); break;
    case "word_beat": {
      boom(0, .7);
      const tones = voicing(tonic + prog[0][0], prog[0][1], 67);
      (ad.hookLines || []).forEach((_, i) => { if (!i) return; const tt = i * (ad.hookBeat || .2); S.thump(tt, .12, 0); S.keys(tt, hz(tones[i % tones.length]), .35, .06, .7); });
      if (ad.hookEnd > .6) S.swish(ad.hookEnd - .35, .4, true, 0, .1); break;
    }
    case "flash_cut": {                              // the first frame's hit, then a thump on each flash after it
      boom(0, .75);
      ad.phones.filter(p => (p.tFlash ?? p.tIn) > .1).forEach(p => S.thump(p.tFlash ?? p.tIn, .14, 0)); break;
    }
    case "crash_zoom": {
      S.swish(0, .6, false, 0, .16);
      const crash = ad.phones.filter(p => p.crash).map(p => p.tLand).sort((x, y) => x - y);
      boom(crash.length ? crash[0] : 0, .8); if (!crash.length || crash[0] > .12) boom(0, .45); break;
    }
    case "punch_in": boom(0, .85); S.swish(0, .45, false, 0, .1); break;
    default: boom(0, .6);
  }

  // ---- the headline hit
  switch (hitKind) {
    case "riser": S.swell(hit - .9, hit, .2); boom(hit, .85); break;
    case "cymbal": S.reverseCymbal(hit - 1, hit, .09); boom(hit, .85); break;
    case "bass_drop": S.swish(tl.text - .45, .5, true, -.3, .1); S.subDrop(hit, .9); booms.push(hit); break;
    default: S.swish(tl.text - .45, .5, true, -.3, .11); boom(hit, .9);
  }
  if (ad.lines.length > 1) S.thump(tl.lines[1] + .3, .12, 0);
  if (["slide_letters", "drop_letters", "typewriter", "scramble", "spin_letters"].includes(st.text_in))
    ad.lines.forEach((L, i) => S.swish(tl.lines[i], .35, true, 0, .05));

  // ---- the number
  const n = ad.num.text.replace(/\s/g, "").length;
  switch (st.number_in === "type" ? "ticks" : numKind) {
    case "ticks": { const k = Math.min(n, 12), step = Math.min(.06, .7 / k);
      for (let i = 0; i < k; i++) S.key(tl.number + i * step, .09 * (.8 + .4 * r()));
      S.blip(tl.number + k * step + .02, .13, bell1); break; }
    case "register": S.register(tl.number + .05, .32, bell1); break;
    case "chime": S.bell(tl.number + .05, bell1, .15); S.bell(tl.number + .15, bell2, .13); break;
    case "whoosh_ding": S.swish(tl.number - .25, .35, true, .3, .09); S.bell(tl.number + .12, bell2, .15); break;
    default: S.blip(tl.number + .05, .15, bell1);
  }
  if (st.shine || st.sparkles) S.sparkle(tl.shine, .045, tonic);
  const cues = ad.cues || {};
  if (cues.board != null) { S.tock(cues.board, .1, 0); S.thump(cues.board + .04, .12, 0); }
  if (cues.burst != null) S.blip(cues.burst, .1, bell2);
  if (cues.stamp != null) { S.thump(cues.stamp + .2, .32, 0); S.tock(cues.stamp + .2, .08, 0); }
  if (cues.tape != null) S.swish(cues.tape, .38, false, .3, .08);
  if (ad.tOutro != null) { S.bell(ad.tOutro, bell1, .08); S.bell(ad.tOutro + .09, bell2, .07); }

  // ---- the bed
  if (hasMusic) score(M, kit, prog, tonic, start, T, b, hit, r);
  // the bed steps back under every hit and comes back over a quarter second
  if (music.duck) for (const t of [...new Set(booms)].sort((x, y) => x - y)) {
    if (t < openAt - .01) continue;
    music.duck.gain.setTargetAtTime(.5, t, .012); music.duck.gain.setTargetAtTime(1, t + .1, .22);
  }
  // under a voiceover the music steps back, and then the whole bed
  if (voDur) duckUnder(VO_START, VO_START + voDur, [music.in.gain, musicLevel, MUSIC_UNDER], [music.verb.gain, 1, MUSIC_UNDER], [bedOut.gain, 1, BED_UNDER]);
  // in over 10 ms (no click), out over the last 0.7 s
  master.gain.setValueAtTime(0, 0); master.gain.linearRampToValueAtTime(1, .01);
  master.gain.setValueAtTime(1, Math.max(.02, T - .7)); master.gain.linearRampToValueAtTime(0, T);
  return ctx.startRendering();
}

/** The voice sits on top of a mix that already peaks near full scale, so a
 *  loud word could clip: the whole mix comes down just enough that it cannot. */
function keepUnder(buf, ceiling) {
  let peak = 0;
  for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i])); }
  if (peak <= ceiling) return;
  const k = ceiling / peak;
  for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] *= k; }
}

// ------------------------------------------------------------ the voice

// Measured with scripts/motion_sound_check.mjs (DESIGN-LAW 97): the voice sits
// 8 to 9 dB over the bed under it (the bed levelled to -16 LUFS first), the music
// under the voice drops further than the effects, and a voiced mix stays within
// 1 dB of the same mix without it.
const VOICE_RMS = 10 ** (-14 / 20), VOICE_CEILING = 10 ** (-2.5 / 20), MUSIC_UNDER = .45, BED_UNDER = .36, PEAK = 10 ** (-1 / 20);
const TAKES = new Map();
async function voiceBuffer(ctx, file) {
  let bytes = TAKES.get(file);
  if (!bytes) {
    const res = await fetch(new URL("./voice/" + file, import.meta.url));
    if (!res.ok) throw new Error(`voice ${file}: ${res.status}`);
    bytes = await res.arrayBuffer(); TAKES.set(file, bytes);
  }
  return ctx.decodeAudioData(bytes.slice(0));        // decoding takes the buffer; the cache keeps its own
}

/** A take, cleaned, as one channel ready to lay in the mix:
 *   1. no offset, and the silence either end trimmed (below -45 dB, keeping
 *      30 ms before the first word and 80 ms after the last);
 *   2. shaped: rumble cut (85 Hz), a little mud out (250 Hz), a little
 *      presence in (3.2 kHz), the esses eased (6.8 kHz), a gentle compressor
 *      to hold the words even;
 *   3. levelled: the speech at -14 dBFS RMS, every peak under -2.5 dBFS by a
 *      look-ahead limiter (5 ms ahead, 60 ms release), 10 ms fades so neither
 *      edge clicks.
 *  Returns null for a silent take. */
export async function cleanVoice(ctx, buf) {
  const n = buf.length, sr = buf.sampleRate, ch = buf.numberOfChannels;
  const x = new Float32Array(n);
  for (let c = 0; c < ch; c++) { const d = buf.getChannelData(c); for (let i = 0; i < n; i++) x[i] += d[i] / ch; }
  let mean = 0; for (let i = 0; i < n; i++) mean += x[i]; mean /= n || 1;
  for (let i = 0; i < n; i++) x[i] -= mean;
  const edges = speechEdges(x, sr);
  if (!edges) return null;
  const a = Math.max(0, edges[0] - Math.round(sr * .03)), b = Math.min(n, edges[1] + Math.round(sr * .08));
  // 2. shape
  const sh = new OfflineAudioContext(1, b - a, sr), src = sh.createBufferSource(), raw = sh.createBuffer(1, b - a, sr);
  raw.copyToChannel(x.slice(a, b), 0); src.buffer = raw;
  const f = (type, freq, q, gain = 0) => { const q0 = sh.createBiquadFilter(); q0.type = type; q0.frequency.value = freq; q0.Q.value = q; q0.gain.value = gain; return q0; };
  const comp = sh.createDynamicsCompressor();
  comp.threshold.value = -24; comp.knee.value = 6; comp.ratio.value = 3; comp.attack.value = .005; comp.release.value = .12;
  src.connect(f("highpass", 85, .707)).connect(f("peaking", 250, 1, -2)).connect(f("peaking", 3200, .9, 2.5))
    .connect(f("peaking", 6800, 2.5, -2.5)).connect(comp).connect(sh.destination);
  src.start(0);
  const y = (await sh.startRendering()).getChannelData(0).slice();
  // 3. level, limit, fade
  const rms = speechRms(y, sr);
  if (!rms) return null;
  for (let i = 0; i < y.length; i++) y[i] *= VOICE_RMS / rms;
  limit(y, sr, VOICE_CEILING);
  const fade = Math.min(Math.round(sr * .01), y.length >> 1);
  for (let i = 0; i < fade; i++) { const e = i / fade; y[i] *= e; y[y.length - 1 - i] *= e; }
  const out = ctx.createBuffer(1, y.length, sr); out.copyToChannel(y, 0);
  return out;
}

/** The first and last sample of speech: 10 ms windows above -45 dB. */
function speechEdges(x, sr) {
  const win = Math.max(1, Math.round(sr * .01)), gate = 10 ** (-45 / 20);
  let first = -1, last = -1;
  for (let i = 0; i < x.length; i += win) {
    const m = Math.min(win, x.length - i); let s = 0;
    for (let j = 0; j < m; j++) s += x[i + j] * x[i + j];
    if (Math.sqrt(s / m) > gate) { if (first < 0) first = i; last = i + m; }
  }
  return first < 0 ? null : [first, last];
}

/** The loudness of the words alone: RMS over the 10 ms windows within 30 dB
 *  of the loudest, so the pauses between words do not count. */
function speechRms(x, sr) {
  const win = Math.max(1, Math.round(sr * .01)), w = [];
  for (let i = 0; i < x.length; i += win) {
    const m = Math.min(win, x.length - i); let s = 0;
    for (let j = 0; j < m; j++) s += x[i + j] * x[i + j];
    w.push([s, m]);
  }
  const top = Math.max(...w.map(([s, m]) => s / m)), floor = top * 10 ** (-30 / 10);
  let s = 0, m = 0;
  for (const [ws, wm] of w) if (ws / wm >= floor) { s += ws; m += wm; }
  return m ? Math.sqrt(s / m) : 0;
}

/** A look-ahead peak limiter: the gain falls ahead of a peak so it arrives
 *  already under the ceiling, and comes back up over the release. */
function limit(y, sr, ceiling) {
  const n = y.length, look = Math.max(1, Math.round(sr * .005)), rel = Math.exp(-1 / (sr * .06)), att = Math.exp(-1 / (look / 3));
  const need = new Float32Array(n);
  for (let i = 0; i < n; i++) { const a = Math.abs(y[i]); need[i] = a > ceiling ? ceiling / a : 1; }
  // the least gain any sample in the next `look` needs (a monotone deque keeps it linear)
  const ahead = new Float32Array(n), q = new Int32Array(n);
  let h = 0, t = 0;
  for (let i = n - 1; i >= 0; i--) {
    while (t > h && need[q[t - 1]] >= need[i]) t--;
    q[t++] = i;
    while (q[h] > i + look) h++;
    ahead[i] = need[q[h]];
  }
  let g = 1;
  for (let i = 0; i < n; i++) {
    const want = ahead[i];
    g = want < g ? want + (g - want) * att : want + (g - want) * rel;
    const v = y[i] * Math.min(g, need[i]);              // never over the ceiling, even mid-attack
    y[i] = v;
  }
}

/** The look's take, cleaned, where it has one that is recorded and fits the ad; else
 *  null. A take that will not load or decode leaves the ad with music and sound only. */
async function voiceFor(st) {
  const take = st.voice !== "off" && st.vo_clip ? clipById(st.vo_clip) : null;
  if (!take) return null;
  try {
    const ctx = new OfflineAudioContext(1, 1, SR);
    const clean = await cleanVoice(ctx, await voiceBuffer(ctx, take.file));
    return clean && clean.duration <= voWindow(st.duration) + .05 ? clean : null;
  } catch (e) { console.warn("voice", take.file, e); return null; }
}

/** The cleaned take into both channels of the levelled bed, from VO_START. */
function layVoice(buf, voice) {
  const v = voice.getChannelData(0), i0 = Math.round(VO_START * buf.sampleRate);
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const d = buf.getChannelData(c);
    for (let j = 0; j < v.length && i0 + j < d.length; j++) d[i0 + j] += v[j];
  }
}

/** Under the voice the music drops 7 dB and then the whole bed another 9, ramping down
 *  80 ms before the first word and back up over 150 ms after the last. */
function duckUnder(t0, t1, ...params) {
  for (const [param, base, k] of params) {
    param.setValueAtTime(base, Math.max(0, t0 - .08));
    param.linearRampToValueAtTime(base * k, t0);
    param.setValueAtTime(base * k, t1);
    param.linearRampToValueAtTime(base, t1 + .15);
  }
}


function noiseBuffer(ctx, secs, seed) {
  const b = ctx.createBuffer(1, secs * SR, SR), d = b.getChannelData(0);
  let s = (seed * 2654435761 >>> 0) || 12345;
  for (let i = 0; i < d.length; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; d[i] = s / 0x3fffffff - 1; }
  return b;
}

/** A small, soft room: decaying noise that loses its top end as it dies away. */
function roomImpulse(ctx, secs, seed) {
  const n = Math.round(secs * SR), pre = Math.round(.012 * SR), b = ctx.createBuffer(2, n, SR);
  let s = (seed * 40503 >>> 0) || 7;
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c); let y = 0, e = 0;
    for (let i = pre; i < n; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const t = (i - pre) / SR, x = (s / 0x3fffffff - 1) * Math.exp(-6.9 * t / secs);
      const a = .55 * Math.exp(-t * 2.6) + .06;            // darker as it decays
      y += a * (x - y); d[i] = y; e += y * y;
    }
    const k = 1 / Math.sqrt(e + 1e-9) * .5; for (let i = 0; i < n; i++) d[i] *= k;
  }
  return b;
}

function synth(ctx, noise, r, bus) {
  const T0 = t => Math.max(0, t);
  const env = (g, t, a, peak, decay) => { t = T0(t); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0003, t + a + decay); g.gain.linearRampToValueAtTime(0, t + a + decay + .01); };
  const out = (node, pan = 0, send = 0) => {
    let n = node;
    if (pan) { const p = ctx.createStereoPanner(); p.pan.value = pan; n.connect(p); n = p; }
    n.connect(bus.in);
    if (send) { const s = ctx.createGain(); s.gain.value = send; n.connect(s).connect(bus.verb); }
  };
  const noiseSrc = (t, dur) => { const n = ctx.createBufferSource(); n.buffer = noise; n.loop = true; n.start(T0(t), r() * 1.5); n.stop(T0(t) + dur + .05); return n; };
  const osc = (type, t, dur, f) => { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, T0(t)); o.start(T0(t)); o.stop(T0(t) + dur + .05); return o; };
  const filt = (type, f, Q = .7) => { const x = ctx.createBiquadFilter(); x.type = type; x.frequency.value = f; x.Q.value = Q; return x; };
  const S = {
    // ---------------------------------------------------------------- effects
    swish(t, dur, up, pan, gain) {
      if (t + dur <= .02) return;
      if (t < 0) { dur += t; t = 0; }
      const n = noiseSrc(t, dur), bp = filt("bandpass", up ? 500 : 2800, .7);
      bp.frequency.setValueAtTime(up ? 500 : 2800, t); bp.frequency.exponentialRampToValueAtTime(up ? 3200 : 450, t + dur);
      const g = ctx.createGain(), pk = t + dur * (up ? .8 : .35);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, pk); g.gain.linearRampToValueAtTime(0, t + dur);
      n.connect(bp).connect(filt("lowpass", 6000)).connect(g); out(g, pan, .2);
    },
    /** A cinematic low hit: sub, a body a phone speaker can play, a soft transient, and room. */
    boom(t, gain) {
      const o = osc("sine", t, 1.4, 58); o.frequency.exponentialRampToValueAtTime(40, t + .5);
      const g = ctx.createGain(); env(g, t, .006, gain * .6, 1.1); o.connect(g); out(g, 0, .15);
      const bo = osc("sine", t, .5, 118); bo.frequency.exponentialRampToValueAtTime(72, t + .16);
      const gb = ctx.createGain(); env(gb, t, .004, gain * .45, .35); bo.connect(gb); out(gb, 0, .3);
      const kn = osc("sine", t, .2, 260); kn.frequency.exponentialRampToValueAtTime(170, T0(t) + .1);
      const gk = ctx.createGain(); env(gk, t, .002, gain * .3, .14); kn.connect(gk); out(gk, 0, .3);
      const n = noiseSrc(t, .12), gn = ctx.createGain(); env(gn, t, .002, gain * .3, .07); n.connect(filt("lowpass", 2500)).connect(gn); out(gn, 0, .4);
    },
    subDrop(t, gain) {
      const o = osc("sine", t, 1.6, 96); o.frequency.exponentialRampToValueAtTime(36, t + .9);
      const g = ctx.createGain(); env(g, t, .008, gain * .75, 1.1); o.connect(g); out(g, 0, .1);
      const bo = osc("sine", t, .4, 150); bo.frequency.exponentialRampToValueAtTime(80, t + .2);
      const gb = ctx.createGain(); env(gb, t, .004, gain * .3, .3); bo.connect(gb); out(gb, 0, .3);
    },
    /** A reversed-reverb style swell into the hit. */
    swell(t0, t1, gain) {
      t0 = T0(t0); if (t1 - t0 < .15) return;
      const n = noiseSrc(t0, t1 - t0), lp = filt("lowpass", 300, .9);
      lp.frequency.setValueAtTime(300, t0); lp.frequency.exponentialRampToValueAtTime(5000, t1);
      const g = ctx.createGain(); g.gain.setValueAtTime(.0005, t0); g.gain.exponentialRampToValueAtTime(gain, t1); g.gain.linearRampToValueAtTime(0, t1 + .03);
      n.connect(lp).connect(g); out(g, 0, .5);
    },
    reverseCymbal(t0, t1, gain) {
      t0 = T0(t0); if (t1 - t0 < .15) return;
      const n = noiseSrc(t0, t1 - t0), g = ctx.createGain();
      g.gain.setValueAtTime(.0003, t0); g.gain.exponentialRampToValueAtTime(gain, t1); g.gain.linearRampToValueAtTime(0, t1 + .03);
      n.connect(filt("highpass", 3500)).connect(filt("lowpass", 9000)).connect(g); out(g, 0, .6);
    },
    thump(t, gain, pan = 0) {
      if (t < -.01) return;
      const o = osc("sine", t, .3, 105); o.frequency.exponentialRampToValueAtTime(62, T0(t) + .08);
      const g = ctx.createGain(); env(g, t, .003, gain, .2); o.connect(g); out(g, pan, .1);
      const n = noiseSrc(t, .03), gn = ctx.createGain(); env(gn, t, .001, gain * .25, .012); n.connect(filt("lowpass", 1800)).connect(gn); out(gn, pan, .1);
    },
    /** A dry wood knock. */
    tock(t, gain, pan = 0) {
      if (t < -.01) return;
      [[620, 1, .07], [930, .5, .05]].forEach(([f, a, d]) => { const o = osc("sine", t, d, f), g = ctx.createGain(); env(g, t, .001, gain * a, d); o.connect(g); out(g, pan, .15); });
    },
    /** A soft two-note "select", the kind a phone makes. */
    blip(t, gain, f) {
      [[f, 0, .18], [f * 1.335, .07, .26]].forEach(([fq, o2, d]) => {
        const o = osc("sine", t + o2, d, fq * .94); o.frequency.exponentialRampToValueAtTime(fq, T0(t + o2) + .02);
        const g = ctx.createGain(); env(g, t + o2, .003, gain, d); o.connect(g); out(g, 0, .25);
      });
    },
    bell(t, f, gain) {
      [[1, 1, 1.4], [2, .3, .8], [3.01, .12, .4], [4.2, .05, .25]].forEach(([m, a, d]) => {
        if (f * m > 5000) return;
        const o = osc("sine", t, d, f * m), g = ctx.createGain(); env(g, t, .002, gain * a, d); o.connect(g); out(g, .15, .35);
      });
    },
    register(t, gain, f) {
      const n = noiseSrc(t, .06), gn = ctx.createGain(); env(gn, t, .002, gain * .35, .04); n.connect(filt("bandpass", 1800, 1.2)).connect(gn); out(gn, 0, .2);
      S.bell(t + .06, f * 1.5, gain * .5); S.bell(t + .11, f * 2, gain * .4);
    },
    key(t, gain) {
      const n = noiseSrc(t, .02), g = ctx.createGain(); env(g, t, .001, gain, .012); n.connect(filt("bandpass", 2200, 1.5)).connect(g); out(g, 0, .05);
    },
    sparkle(t, gain, tonic) {
      [0, 4, 7, 12].forEach((iv, i) => { const f = hz(tonic % 12 + 84 + iv); if (f < 2700) S.bell(t + i * .05, f, gain); });
    },
    // ---------------------------------------------------------------- instruments
    kick(t, gain) {
      if (t < -.001) return;
      const o = osc("sine", t, .4, 120); o.frequency.exponentialRampToValueAtTime(48, T0(t) + .09);
      const g = ctx.createGain(); env(g, t, .002, gain * .6, .3); o.connect(g); out(g);
      const n = noiseSrc(t, .01), gn = ctx.createGain(); env(gn, t, .001, gain * .25, .008); n.connect(filt("lowpass", 3500)).connect(gn); out(gn);
    },
    clap(t, gain, pan = 0) {
      if (t < -.001) return;
      [0, .009, .018].forEach((o2, k) => {
        const n = noiseSrc(t + o2, .2), g = ctx.createGain(); env(g, t + o2, .001, gain, k < 2 ? .012 : .12);
        n.connect(filt("bandpass", 1300, .8)).connect(g); out(g, pan, .35);
      });
    },
    shaker(t, gain, pan = 0) {
      if (t < -.001) return;
      const n = noiseSrc(t, .08), g = ctx.createGain(); env(g, t, .006, gain, .05); n.connect(filt("bandpass", 6500, 1.1)).connect(g); out(g, pan, .1);
    },
    hat(t, gain, open = false, pan = 0) {
      if (t < -.001) return;
      const n = noiseSrc(t, open ? .25 : .05), g = ctx.createGain(); env(g, t, .001, gain, open ? .18 : .035); n.connect(filt("highpass", 8500)).connect(g); out(g, pan, .1);
    },
    rim(t, gain) {
      if (t < -.001) return;
      const o = osc("sine", t, .03, 1750), g = ctx.createGain(); env(g, t, .001, gain * .6, .025); o.connect(g); out(g, 0, .3);
      const n = noiseSrc(t, .02), gn = ctx.createGain(); env(gn, t, .001, gain * .5, .015); n.connect(filt("bandpass", 2500, 3)).connect(gn); out(gn, 0, .3);
    },
    tom(t, gain) {
      if (t < -.001) return;
      const o = osc("sine", t, .6, 92); o.frequency.exponentialRampToValueAtTime(58, T0(t) + .25);
      const g = ctx.createGain(); env(g, t, .004, gain, .5); o.connect(g); out(g, 0, .35);
      const n = noiseSrc(t, .04), gn = ctx.createGain(); env(gn, t, .001, gain * .2, .03); n.connect(filt("lowpass", 700)).connect(gn); out(gn, 0, .35);
    },
    bass(t, f, dur, gain) {
      if (t + dur <= 0) return;
      if (t < 0) { dur += t; t = 0; }
      [[1, .5], [2, .45]].forEach(([m, a]) => {             // the octave is what a phone speaker plays
        const o = osc("sine", t, dur, f * m), g = ctx.createGain();
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain * a, t + .012);
        g.gain.setValueAtTime(gain * a, t + Math.max(.02, dur - .06)); g.gain.linearRampToValueAtTime(0, t + dur);
        o.connect(g); out(g);
      });
    },
    /** An electric piano: a sine carrier with a decaying sine modulator. */
    keys(t, f, dur, gain, bright = 1, pan = 0) {
      if (t < -.001) return;
      const c = osc("sine", t, dur, f), m = osc("sine", t, dur, f), mi = ctx.createGain();
      mi.gain.setValueAtTime(f * 1.4 * bright, T0(t)); mi.gain.exponentialRampToValueAtTime(f * .05, T0(t) + .35);
      m.connect(mi).connect(c.frequency);
      const g = ctx.createGain(); env(g, t, .004, gain * 2.2, dur); c.connect(g); out(g, pan, .3);
    },
    pad(t0, t1, notes, gain) {
      if (t1 <= 0) return;
      t0 = T0(t0);
      const lp = filt("lowpass", 1500, .4), g = ctx.createGain();
      gain *= 1.4; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(gain, t0 + .35);
      g.gain.setValueAtTime(gain, Math.max(t0 + .36, t1 - .15)); g.gain.linearRampToValueAtTime(0, t1 + .25);
      lp.connect(g); out(g, 0, .6);
      notes.forEach(m => [-7, 7].forEach(cents => { const o = osc("sawtooth", t0, t1 - t0 + .3, hz(m)); o.detune.value = cents; o.connect(lp); }));
    },
  };
  // Nothing is scheduled before the first frame, and this is the one place that holds it.
  // Cues are timed off the picture, and some fall before it: a phone already down when the
  // ad opens, a sweep into an early hit, the bars of the bed before the first. Web Audio
  // throws on a time before zero, and one such cue used to leave the whole ad silent (38%
  // of looks on 2026-09-30). A sweep that builds to a moment after the start is heard from
  // the first frame, shortened; a hit timed before it happened before the ad and is dropped
  // (one within 20 ms of it lands on the first frame). And one cue that still cannot be
  // scheduled is skipped, not the whole soundtrack. BUILDS: where each sweep keeps its
  // length (or its end) among the arguments after its start.
  const BUILDS = { swish: [0, false], bass: [1, false], swell: [0, true], reverseCymbal: [0, true], pad: [0, true] };
  for (const [k, f] of Object.entries(S)) {
    S[k] = (t, ...a) => {
      if (!Number.isFinite(t)) return;
      if (t < 0) {
        const b = BUILDS[k];
        if (!b) { if (t < -.02) return; }
        else {
          const left = b[1] ? a[b[0]] : a[b[0]] + t;      // what is left of it after the first frame
          if (!(left >= .05)) return;
          if (!b[1]) a[b[0]] = left;
        }
        t = 0;
      }
      try { return f(t, ...a); } catch (e) { console.warn(`Sound cue "${k}" skipped:`, e); }
    };
  }
  return S;
}

/** The bed: a groove per kit over the chosen chords. Before the headline hit only
 *  the chords and a light pulse play; the drums come in on the hit. */
function score(M, kit, prog, tonic, start, total, b, hit, r) {
  const bar = 4 * b, nBars = Math.ceil((total - start) / bar);
  for (let k = 0; k < nBars; k++) {
    const t0 = start + k * bar, [deg, q] = prog[k % prog.length], root = tonic + deg;
    const pad = voicing(root, q, 55), keys = voicing(root, q, 60), bassF = hz(voicing(root, "M", 36)[0]);
    const post = t => t >= hit - 1e-3;
    const padLevel = { cinematic: .05, minimal: .03, lofi: .025 }[kit] ?? .035;
    M.pad(t0, t0 + bar, pad, padLevel);
    for (let i = 0; i < 4; i++) {
      const t = t0 + i * b;
      if (t > total) break;
      switch (kit) {
        case "uplift":
          if (post(t)) {
            if (i % 2 === 0) M.kick(t, .55); else M.clap(t, .16);
            M.shaker(t + b / 2, .05, .2); M.shaker(t, .035, -.2);
            M.bass(t, bassF, b * (i % 2 ? .9 : 1.4), .26);
            [0, 1].forEach(e => M.keys(t + e * b / 2, hz(keys[(i * 2 + e) % keys.length] + 12), b * .9, .045, .8, e ? .25 : -.25));
          } else M.keys(t, hz(keys[i % keys.length] + 12), b * 1.2, .04, .6);
          break;
        case "house":
          if (post(t)) {
            M.kick(t, .6); M.hat(t + b / 2, .05, i === 3, .15);
            if (i % 2) M.clap(t, .15);
            M.bass(t + b / 2, bassF * (i === 3 ? 2 : 1), b * .45, .24);
            if (i === 0 || i === 2) keys.forEach(m => M.keys(t + b * .5, hz(m), b * .6, .035, .9));
          } else M.hat(t + b / 2, .03, false, .15);
          break;
        case "hiphop":
          if (i === 0) keys.forEach(m => M.keys(t, hz(m), bar * .9, .03, .5));
          if (post(t)) {
            if (i === 0) { M.kick(t, .6); M.bass(t, bassF, b * 2.3, .28); }
            if (i === 2) { M.clap(t, .2); M.kick(t + b * .5, .45); M.bass(t + b * .5, bassF, b * 1.3, .24); }
            [0, 1].forEach(e => M.hat(t + e * b / 2 + (e ? .06 * b : 0), e ? .03 : .045, false, e ? .15 : -.15));
          }
          break;
        case "lofi": {
          const sw = .16 * b;
          if (i === 0 || i === 2) keys.forEach(m => M.keys(t + (i === 2 ? b * .5 + sw : 0), hz(m), b * 1.8, .03, .35));
          if (post(t)) {
            if (i === 0) { M.kick(t, .45); M.bass(t, bassF, b * 1.8, .22); }
            if (i === 2) { M.rim(t + sw * .3, .18); M.kick(t + b * .5 + sw, .35); }
            M.hat(t + (i % 2 ? sw : 0), .025); M.hat(t + b / 2 + sw, .018);
          }
          break;
        }
        case "minimal":
          [0, 1].forEach(e => M.keys(t + e * b / 2, hz(keys[e ? 2 : 0]), b * .4, post(t) ? .05 : .035, .3));
          if (i === 0) M.bass(t, bassF, bar * .95, .22);
          if (post(t)) { if (i === 0) M.kick(t, .45); if (i % 2) M.rim(t, .12); }
          break;
        case "cinematic":
          if (i === 0) { M.keys(t, hz(keys[0] - 12), bar, .06, .3); M.bass(t, bassF, bar * .95, .2); }
          if (i === 2) M.keys(t, hz(keys[keys.length - 1] - 12), b * 2, .045, .3);
          if (post(t)) { if (i === 0 || i === 2) { M.tom(t, .4); M.tom(t + b * .35, .22); } M.shaker(t + b / 2, .025); }
          else if (i === 0) M.tom(t, .2);
          break;
      }
    }
  }
}

// ------------------------------------------------------------ levelling

function biquad(x, b0, b1, b2, a0, a1, a2) {
  b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0;
  const y = new Float32Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) { const v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v; }
  return y;
}
/** ITU-R BS.1770 K-weighting (the pre-filter and the RLB high-pass). */
function kweight(x, fs) {
  let Q = .7071752369554196, w = 2 * Math.PI * 1681.974450955533 / fs, al = Math.sin(w) / (2 * Q), c = Math.cos(w);
  const A = 10 ** (3.999843853973347 / 40), sA = Math.sqrt(A);
  x = biquad(x, A * ((A + 1) + (A - 1) * c + 2 * sA * al), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - 2 * sA * al),
    (A + 1) - (A - 1) * c + 2 * sA * al, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - 2 * sA * al);
  Q = .5003270373238773; w = 2 * Math.PI * 38.13547087602444 / fs; al = Math.sin(w) / (2 * Q); c = Math.cos(w);
  return biquad(x, (1 + c) / 2, -(1 + c), (1 + c) / 2, 1 + al, -2 * c, 1 - al);
}

/** Integrated loudness in LUFS (gated, BS.1770-4). */
export function loudness(buf) {
  const fs = buf.sampleRate, ch = [...Array(buf.numberOfChannels)].map((_, i) => kweight(buf.getChannelData(i), fs));
  const blk = Math.round(.4 * fs), hop = Math.round(.1 * fs), ms = [];
  for (let s = 0; s + blk <= ch[0].length; s += hop) { let a = 0; for (const k of ch) for (let i = s; i < s + blk; i++) a += k[i] * k[i]; ms.push(a / blk); }
  const L = z => -.691 + 10 * Math.log10(z + 1e-12), mean = a => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
  const g1 = ms.filter(z => L(z) > -70), g2 = g1.filter(z => L(z) > L(mean(g1)) - 10);
  return g2.length ? L(mean(g2)) : -70;
}

/** The gain that brings a mix to the target loudness: never more than +12 dB, and none
 *  for a mix with nothing in it. */
function levelGain(buf, target) {
  const I = loudness(buf);
  return I > -60 ? Math.min(10 ** ((target - I) / 20), 4) : 1;
}

/** Bring the mix to its level, then hold every peak under the ceiling with a look-ahead
 *  limiter, so the level never jumps and nothing clips. */
function applyLevel(buf, gain) {
  const ch = [...Array(buf.numberOfChannels)].map((_, i) => buf.getChannelData(i)), n = ch[0].length;
  const need = new Float32Array(n);
  for (let i = 0; i < n; i++) { let p = 0; for (const d of ch) p = Math.max(p, Math.abs(d[i] * gain)); need[i] = p > CEILING ? CEILING / p : 1; }
  const la = Math.round(.004 * SR), mins = new Float32Array(n);
  const q = new Int32Array(n); let qh = 0, qt = 0;                  // sliding minimum over need[i .. i+la)
  for (let j = 0; j < n + la; j++) {
    if (j < n) { while (qt > qh && need[q[qt - 1]] >= need[j]) qt--; q[qt++] = j; }
    const i = j - la + 1; if (i < 0) continue;
    while (q[qh] < i) qh++;
    if (i < n) mins[i] = qh < qt ? need[q[qh]] : 1;
  }
  const rel = 1 - Math.exp(-1 / (.08 * SR));
  let acc = 0, g = 1;
  for (let i = 0; i < n; i++) {
    acc += mins[i] - (i >= la ? mins[i - la] : 1);
    const smooth = Math.min(1, (acc + la) / la);                      // the mean of the last la minima
    g = smooth < g ? smooth : g + (smooth - g) * rel;
    for (const d of ch) d[i] = Math.max(-CEILING, Math.min(CEILING, d[i] * gain * g));
  }
}

export function audioBufferToWav(buf) {
  const n = buf.length, ch = buf.numberOfChannels, out = new DataView(new ArrayBuffer(44 + n * ch * 2));
  const w = (o, s) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF"); out.setUint32(4, 36 + n * ch * 2, true); w(8, "WAVEfmt "); out.setUint32(16, 16, true); out.setUint16(20, 1, true);
  out.setUint16(22, ch, true); out.setUint32(24, buf.sampleRate, true); out.setUint32(28, buf.sampleRate * ch * 2, true);
  out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true); w(36, "data"); out.setUint32(40, n * ch * 2, true);
  const chans = [...Array(ch)].map((_, i) => buf.getChannelData(i));
  let o = 44; for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { out.setInt16(o, Math.max(-1, Math.min(1, chans[c][i])) * 32767, true); o += 2; }
  return new Blob([out], { type: "audio/wav" });
}
