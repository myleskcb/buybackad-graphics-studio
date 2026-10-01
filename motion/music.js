// Phone Ad Maker music: real instruments, famous public-domain tunes and the grooves
// that carry them. Everything here is either made in the browser or a recording from
// the Versilian Community Sample Library, which is CC0 (public domain, no credit owed):
// sounds/index.json names the source file of every sample. Each tune below was
// published before 1931, so its melody is public domain in the US; what plays is our
// own performance of it, never a recording of anyone else's.

import { rng } from "./engine.js";

const BASE = new URL("./sounds/", import.meta.url).href;
let manP = null, decoder = null;
const cache = new Map();

export function soundManifest() {
  return manP || (manP = fetch(BASE + "index.json").then(r => r.ok ? r.json() : null).catch(() => null));
}
/** A sample as an AudioBuffer (shared by every render), or null where it cannot load. */
export function sampleBuffer(key) {
  if (!cache.has(key)) cache.set(key, fetch(BASE + key + ".mp3").then(r => r.arrayBuffer())
    .then(b => (decoder || (decoder = new OfflineAudioContext(1, 1, 44100))).decodeAudioData(b)).catch(() => null));
  return cache.get(key);
}

const mtof = m => 440 * 2 ** ((m - 69) / 12);

/** Sample playback for one render. A key not loaded yet is noted in `need` and skipped:
 *  the soundtrack is composed once to learn what it needs, then again for real. */
export function sampler(ctx, man, bufs, need) {
  const play = (dest, t, key, gain, pan, rate, stopAt, release = .08) => {
    if (t < 0 || !man) return;
    if (!bufs.has(key)) { need.add(key); return; }
    const b = bufs.get(key); if (!b) return;
    const s = ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = rate;
    const g = ctx.createGain(); g.gain.setValueAtTime(gain, t);
    const end = Math.min(t + b.duration / rate, stopAt ?? Infinity);
    if (end < t + b.duration / rate) { g.gain.setValueAtTime(gain, Math.max(t, end - release)); g.gain.linearRampToValueAtTime(0, end); }
    s.connect(g);
    if (pan) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p).connect(dest); } else g.connect(dest);
    s.start(t); s.stop(end + .01);
  };
  return {
    /** A one-shot: percussion or an effect. */
    hit(dest, t, id, gain, pan = 0, rate = 1) { if (man && man.hits[id]) play(dest, t, id, gain, pan, rate); },
    /** The notes an instrument was recorded across, give or take a few. */
    range(inst) { const I = man && man.pitched[inst]; return I ? [I.zones[0] + I.shift - 2, I.zones[I.zones.length - 1] + I.shift + 4] : null; },
    /** One note on a sampled instrument, from the nearest recorded note. */
    note(dest, t, inst, midi, dur, gain, pan = 0) {
      const I = man && man.pitched[inst]; if (!I) return;
      let z = I.zones[0];
      for (const q of I.zones) if (Math.abs(q + I.shift - midi) < Math.abs(z + I.shift - midi)) z = q;
      const rate = 2 ** ((midi - z - I.shift) / 12 - (I.cents[z] || 0) / 1200);
      const L = LEADS[inst] || {};
      play(dest, t, `${inst}/${z}`, gain * (L.gain ?? 1), pan, rate, t + dur + (L.ring ?? .3), L.sustain ? .06 : .12);
    },
  };
}

// ------------------------------------------------------------ instruments

// centre: where a melody sits; ring: how long past its written length a note may sound;
// sustain: a held instrument, cut at the end of the note
export const LEADS = {
  piano: { center: 74, gain: 1, ring: .35 },
  epiano: { center: 72, gain: 1, ring: .3 },
  vibes: { center: 76, gain: .95, ring: .5 },
  marimba: { center: 74, gain: 1.05, ring: .2 },
  xylophone: { center: 82, gain: 1, ring: .15 },
  glock: { center: 86, gain: 1.15, ring: .4 },
  organ: { center: 69, gain: .55, ring: .05, sustain: true },
  harpsichord: { center: 70, gain: .85, ring: .2 },
  sax: { center: 70, gain: .8, ring: .03, sustain: true },
  harp: { center: 72, gain: 1, ring: .45 },
  kalimba: { center: 76, gain: .95, ring: .3 },
  bells: { center: 70, gain: .7, ring: .8 },
  synth: { center: 74 },
};

// ------------------------------------------------------------ the tunes

// notes: [semitones above the tonic or null for a rest, beats]; chords: [root in
// semitones, quality, beats], spanning the same length. tempo: the quarter-note speed
// the tune is known at; fast: runs of short notes (no long-ringing bells on these).
export const TUNES = {
  mountain_king: { mode: "minor", tempo: [120, 170], fast: true,
    notes: [[0, .5], [2, .5], [3, .5], [5, .5], [7, .5], [3, .5], [7, 1], [6, .5], [2, .5], [6, 1], [5, .5], [1, .5], [5, 1],
      [0, .5], [2, .5], [3, .5], [5, .5], [7, .5], [3, .5], [7, .5], [12, .5], [10, .5], [7, .5], [3, .5], [7, .5], [10, 2]],
    chords: [[0, "m", 4], [2, "M", 2], [1, "M", 2], [0, "m", 4], [3, "M", 4]] },
  fur_elise: { mode: "minor", tempo: [60, 80], fast: true, pickup: .5,
    notes: [[19, .25], [18, .25], [19, .25], [18, .25], [19, .25], [14, .25], [17, .25], [15, .25], [12, .5], [null, .25], [3, .25], [7, .25], [12, .25],
      [14, .5], [null, .25], [7, .25], [11, .25], [14, .25], [15, .5], [null, .25], [7, .25], [19, .25], [18, .25],
      [19, .25], [18, .25], [19, .25], [14, .25], [17, .25], [15, .25], [12, .5], [null, .25], [3, .25], [7, .25], [12, .25],
      [14, .5], [null, .25], [7, .25], [15, .25], [14, .25], [12, 1.5]],
    chords: [[0, "m", .5], [0, "m", 1.5], [0, "m", 1.5], [7, "M", 1.5], [0, "m", 1.5], [0, "m", 1.5], [0, "m", 1.5], [7, "M", 1.5], [0, "m", 1.5]] },
  beethoven5: { mode: "minor", tempo: [100, 140],
    notes: [[null, .5], [7, .5], [7, .5], [7, .5], [3, 2], [null, .5], [5, .5], [5, .5], [5, .5], [2, 2]],
    chords: [[0, "m", 4], [7, "7", 4]] },
  ode_to_joy: { mode: "major", tempo: [100, 130],
    notes: [[4, 1], [4, 1], [5, 1], [7, 1], [7, 1], [5, 1], [4, 1], [2, 1], [0, 1], [0, 1], [2, 1], [4, 1], [4, 1.5], [2, .5], [2, 2],
      [4, 1], [4, 1], [5, 1], [7, 1], [7, 1], [5, 1], [4, 1], [2, 1], [0, 1], [0, 1], [2, 1], [4, 1], [2, 1.5], [0, .5], [0, 2]],
    chords: [[0, "M", 4], [7, "M", 4], [0, "M", 4], [7, "M", 4], [0, "M", 4], [7, "M", 4], [0, "M", 4], [7, "7", 2], [0, "M", 2]] },
  saints: { mode: "major", tempo: [110, 150],
    notes: [[null, 1], [0, 1], [4, 1], [5, 1], [7, 4], [null, 1], [0, 1], [4, 1], [5, 1], [7, 4],
      [null, 1], [0, 1], [4, 1], [5, 1], [7, 2], [4, 2], [0, 2], [4, 2], [2, 4]],
    chords: [[0, "M", 16], [0, "M", 8], [0, "M", 4], [7, "7", 4]] },
  ballgame: { mode: "major", tempo: [130, 170],
    notes: [[0, 2], [12, 1], [9, 1], [7, 1], [4, 1], [7, 3], [2, 3], [0, 2], [12, 1], [9, 1], [7, 1], [4, 1], [7, 6]],
    chords: [[0, "M", 9], [7, "7", 3], [0, "M", 6], [7, "7", 6]] },
  cucaracha: { mode: "major", tempo: [110, 140],
    notes: [[-5, .5], [-5, .5], [-5, .5], [0, 1], [4, 1.5], [-5, .5], [-5, .5], [-5, .5], [0, 1], [4, 1.5],
      [0, .5], [0, .5], [-1, .5], [-1, .5], [-3, .5], [-3, .5], [-5, 1], [-5, .5], [-5, .5], [-5, .5], [-1, 1], [2, 1.5],
      [-5, .5], [-5, .5], [-5, .5], [-1, 1], [2, 1.5], [7, .5], [9, .5], [7, .5], [5, .5], [4, .5], [2, .5], [0, 1]],
    chords: [[0, "M", 8], [7, "7", 4], [7, "7", 8], [7, "7", 2], [0, "M", 2]] },
  toccata: { mode: "minor", tempo: [60, 80],
    notes: [[7, .125], [5, .125], [7, 1.75], [null, .5], [5, .25], [3, .25], [2, .25], [0, .25], [-1, 1], [0, 3.5],
      [-5, .125], [-7, .125], [-5, 1.75], [null, .5], [-7, .25], [-9, .25], [-10, .25], [-12, .25], [-13, 1], [-12, 3.5]],
    chords: [[7, "7", 4.5], [0, "m", 3.5], [7, "7", 4.5], [0, "m", 3.5]] },
  turkish_march: { mode: "minor", tempo: [110, 140], fast: true,
    notes: [[2, .25], [0, .25], [-1, .25], [0, .25], [3, 1], [5, .25], [3, .25], [2, .25], [3, .25], [7, 1],
      [8, .25], [7, .25], [6, .25], [7, .25], [14, .25], [12, .25], [11, .25], [12, .25], [14, .25], [12, .25], [11, .25], [12, .25], [15, 1]],
    chords: [[0, "m", 4], [7, "7", 1], [0, "m", 1], [7, "7", 1], [0, "m", 1]] },
  eine_kleine: { mode: "major", tempo: [120, 150],
    notes: [[0, 1], [null, .5], [-5, .5], [0, 1], [null, .5], [-5, .5], [0, .5], [-5, .5], [0, .5], [4, .5], [7, 2],
      [5, 1], [null, .5], [2, .5], [5, 1], [null, .5], [2, .5], [5, .5], [2, .5], [-1, .5], [2, .5], [-5, 2]],
    chords: [[0, "M", 8], [7, "7", 8]] },
  greensleeves: { mode: "minor", tempo: [90, 120], pickup: .5,
    notes: [[0, .5], [3, 1], [5, .5], [7, .75], [8, .25], [7, .5], [5, 1], [2, .5], [-2, .75], [0, .25], [2, .5],
      [3, 1], [0, .5], [0, .75], [-1, .25], [0, .5], [2, 1], [-1, .5], [-5, 1], [0, .5],
      [3, 1], [5, .5], [7, .75], [8, .25], [7, .5], [5, 1], [2, .5], [-2, .75], [0, .25], [2, .5],
      [3, .75], [2, .25], [0, .5], [-1, .75], [-3, .25], [-1, .5], [0, 2.5]],
    chords: [[0, "m", .5], [0, "m", 3], [-2, "M", 3], [0, "m", 3], [7, "M", 3], [0, "m", 3], [-2, "M", 3], [0, "m", 1.5], [7, "M", 1.5], [0, "m", 2.5]] },
  morning_mood: { mode: "major", tempo: [70, 100],
    notes: [[7, .5], [4, .5], [2, .5], [0, .5], [2, .5], [4, .5], [7, .5], [4, .5], [2, .5], [0, .5], [2, .5], [4, .5],
      [2, .5], [4, .5], [7, .5], [4, .5], [7, .5], [9, .5], [4, .5], [9, .5], [7, .5], [4, .5], [2, .5], [0, 4]],
    chords: [[0, "M", 6], [0, "M", 3], [0, "M", 3], [0, "M", 4]] },
  bumblebee: { mode: "minor", tempo: [140, 170], fast: true,
    notes: [[19, .25], [18, .25], [17, .25], [16, .25], [15, .25], [20, .25], [19, .25], [18, .25],
      [19, .25], [18, .25], [17, .25], [16, .25], [15, .25], [16, .25], [17, .25], [18, .25],
      [19, .25], [18, .25], [17, .25], [16, .25], [15, .25], [20, .25], [19, .25], [18, .25],
      [19, .25], [18, .25], [17, .25], [16, .25], [15, .25], [16, .25], [17, .25], [18, .25]],
    chords: [[7, "7", 4], [0, "m", 4]] },
  carol_bells: { mode: "minor", tempo: [100, 140],
    notes: [[3, 1], [2, .5], [3, .5], [0, 1], [3, 1], [2, .5], [3, .5], [0, 1], [3, 1], [2, .5], [3, .5], [0, 1], [3, 1], [2, .5], [3, .5], [0, 1],
      [7, 1], [5, .5], [7, .5], [3, 1], [7, 1], [5, .5], [7, .5], [3, 1], [7, 1], [5, .5], [7, .5], [3, 1], [7, 1], [5, .5], [7, .5], [3, 1]],
    chords: [[0, "m", 3], [-2, "M", 3], [-4, "M", 3], [-5, "M", 3], [0, "m", 3], [-2, "M", 3], [-4, "M", 3], [-5, "M", 3]] },
  entertainer: { mode: "major", tempo: [80, 100], fast: true, pickup: .5,
    notes: [[2, .25], [3, .25], [4, .25], [12, .5], [4, .25], [12, .5], [4, .25], [12, 1.25], [12, .25], [14, .25], [15, .25], [16, .25],
      [12, .25], [14, .25], [16, .5], [11, .25], [14, .5], [12, 1.75]],
    chords: [[0, "M", 5.5], [7, "7", 1.5], [0, "M", 1.5]] },
  canon: { mode: "major", tempo: [70, 100],
    notes: [[16, 2], [14, 2], [12, 2], [11, 2], [9, 2], [7, 2], [9, 2], [11, 2]],
    chords: [[0, "M", 2], [7, "M", 2], [9, "m", 2], [4, "m", 2], [5, "M", 2], [0, "M", 2], [5, "M", 2], [7, "M", 2]] },
};

export const SHAVE = [[0, 1], [-5, .5], [-5, .5], [-3, 1], [-5, 1], [null, 1], [-1, 1], [0, 1]];

const QUAL = { M: [0, 4, 7], m: [0, 3, 7], "7": [0, 4, 7, 10], m7: [0, 3, 7, 10], M7: [0, 4, 7, 11], m9: [0, 3, 7, 10, 14], M9: [0, 4, 7, 11, 14] };

// the grooves' own progressions when no tune leads: [root, quality] a bar each
const PROGS = {
  minor: [[[0, "m"], [8, "M"], [3, "M"], [10, "M"]], [[0, "m"], [5, "m"], [10, "M"], [3, "M"]], [[0, "m"], [8, "M"], [10, "M"], [0, "m"]], [[0, "m"], [10, "M"], [8, "M"], [7, "M"]]],
  major: [[[0, "M"], [7, "M"], [9, "m"], [5, "M"]], [[0, "M"], [5, "M"], [7, "M"], [5, "M"]], [[0, "M"], [9, "m"], [5, "M"], [7, "M"]]],
  jazz: [[[0, "M7"], [9, "m7"], [2, "m7"], [7, "7"]], [[2, "m7"], [7, "7"], [0, "M7"], [0, "M7"]]],
  lush: [[[0, "m9"], [5, "m9"], [10, "7"], [3, "M9"]], [[0, "M9"], [9, "m9"], [2, "m9"], [7, "7"]], [[0, "m9"], [8, "M9"], [5, "m9"], [7, "7"]]],
  march: [[[0, "M"], [7, "7"], [7, "7"], [0, "M"]], [[0, "M"], [5, "M"], [7, "7"], [0, "M"]]],
};

/** What the new grooves are made of: their mood and the instruments that may
 *  play their chords (their tempo is KIT_BPM in catalog.js). Each is a groove of its own. */
export const KITS = {
  reggaeton: { prog: "minor", keys: ["epiano", "marimba", "piano"] },
  jersey_club: { prog: "minor", keys: ["glock", "kalimba", "epiano"] },
  drill: { prog: "minor", keys: ["piano", "vibes", "harp"] },
  phonk: { prog: "minor", keys: ["piano", "epiano"] },
  baile_funk: { prog: "minor", keys: ["epiano", "marimba"] },
  amapiano: { prog: "lush", keys: ["piano", "epiano"] },
  cumbia: { prog: "major", keys: ["piano", "marimba", "vibes"] },
  disco: { prog: "minor", keys: ["epiano", "piano"] },
  uk_garage: { prog: "lush", keys: ["epiano", "organ"] },
  swing: { prog: "jazz", keys: ["piano", "vibes"] },
  epic: { prog: "minor", keys: ["organ", "piano"] },
  march: { prog: "march", keys: ["piano", "marimba", "xylophone"] },
  bossa: { prog: "jazz", keys: ["epiano", "vibes", "harp"] },
};

/** The key, chords and tune of one look, laid on its beat grid. */
export function arrange(st, start, hit) {
  const r = rng(st.seed * 977 + 5), bpm = st.bpm || 118, b = 60 / bpm;
  const tune = st.melody && st.melody !== "none" ? TUNES[st.melody] : null;
  const kit = KITS[st.sound_kit];
  const keyPc = r.int(0, 11);
  const prog = kit ? r.pick(PROGS[kit.prog]) : null;
  const keysInst = kit ? r.pick(kit.keys) : "piano";
  let k = 1, t0 = start, len = 0;
  if (tune) {
    // the tune at the speed it is known by: a groove twice as fast plays it at half time
    const mid = (tune.tempo[0] + tune.tempo[1]) / 2;
    k = [.5, 1, 2].reduce((a, c) => Math.abs(bpm / c - mid) < Math.abs(bpm / a - mid) ? c : a, 1);
    len = tune.notes.reduce((a, n) => a + n[1], 0);
    // its first downbeat lands on the headline hit
    t0 = hit - (tune.pickup || 0) * k * b;
  }
  const chordAt = t => {
    if (tune) {
      const L = len * k * b; let x = ((t - t0) % L + L) % L;
      for (const [rt, q, d] of tune.chords) { if (x < d * k * b - 1e-6) return [rt, q]; x -= d * k * b; }
      return tune.chords[0];
    }
    if (prog) { const bar = Math.floor((t - start + 1e-6) / (4 * b)); return prog[((bar % prog.length) + prog.length) % prog.length]; }
    return [0, "m"];
  };
  return { r, b, bpm, keyPc, tune, k, t0, len, chordAt, keysInst, minor: tune ? tune.mode === "minor" : kit ? kit.prog !== "major" && kit.prog !== "march" : true };
}

/** Pitches of a chord around a centre note, in a close voicing. */
export function voicing(keyPc, [root, q], center) {
  const pcs = QUAL[q] || QUAL.M, base = keyPc + root;
  let m0 = center - 6 + (((base - (center - 6)) % 12) + 12) % 12;
  return pcs.map(iv => { let m = m0 + iv; while (m > center + 7) m -= 12; return m; }).sort((a, c) => a - c);
}
/** The chord's root as a bass note, between E1 and E2. */
export const bassNote = (keyPc, [root]) => 28 + ((keyPc + root - 4) % 12 + 12) % 12;
export { mtof };

/** The tune itself, on the lead instrument, from the headline hit to the end. */
export function playTune(S, dest, A, st, total) {
  const T = A.tune; if (!T) return;
  const inst = st.lead || "piano", L = LEADS[inst] || LEADS.piano;
  const notes = T.notes.filter(n => n[0] != null).map(n => n[0]);
  const lo = Math.min(...notes), hi = Math.max(...notes), center = (lo + hi) / 2;
  // the octave nearest the instrument's sweet spot that keeps the whole tune on notes it
  // was recorded playing (a sample pushed far past its range smears)
  const I = S.range(inst), fits = t => I ? Math.max(0, I[0] - (t + lo)) + Math.max(0, t + hi - I[1]) : 0;
  const t0 = A.keyPc + 12 * Math.round((L.center - center - A.keyPc) / 12);
  const tonic = [t0, t0 - 12, t0 + 12].reduce((a, c) => fits(c) < fits(a) ? c : a);
  const step = A.k * A.b, L0 = A.len * step;
  for (let rep = 0; A.t0 + rep * L0 < total; rep++) {
    let x = A.t0 + rep * L0, beat = 0;
    for (const [n, d] of T.notes) {
      if (n != null && x >= 0 && x < total - .05) {
        const down = Math.abs(beat - Math.round(beat)) < 1e-6 && Math.round(beat) % 2 === 0;
        const g = down ? .95 : .78;                   // the tune leads: it sits over the groove, not in it
        if (inst === "synth") S.pluck(dest, x, mtof(tonic + n), Math.max(.12, d * step), g * .7, "square", 2600);
        else S.note(dest, x, inst, tonic + n, d * step * .95, g, .08);
      }
      x += d * step; beat += d;
    }
  }
}

/** One bar of 16 steps for each new groove. `on(pattern, i)` reads a step. */
const on = (p, i) => p[i % p.length] === "x";

export function groove(S, dest, kit, A, start, total) {
  const { b, r, keyPc } = A, s16 = b / 4, K = A.keysInst;
  const chordTones = (t, center) => voicing(keyPc, A.chordAt(t + 1e-4), center);
  const bass = t => mtof(bassNote(keyPc, A.chordAt(t + 1e-4)));
  const duck = A.tune ? .5 : 1;                       // under a tune the chords step back
  const stab = (t, dur, gain, center = 64) => chordTones(t, center).forEach((m, i) => S.note(dest, t + i * .004, K, m, dur, gain * duck));
  let bar = 0;
  for (let t0 = start; t0 < total; t0 += 16 * s16, bar++) {
    for (let i = 0; i < 16; i++) {
      const t = t0 + i * s16;
      if (t < -1e-6 || t > total) continue;
      const beat = i % 4 === 0, B = bar % 2;
      switch (kit) {
        case "reggaeton":
          if (beat) S.kick(dest, t, .85);
          if (on("...x..x....x..x.", i)) { S.hit(dest, t, "rim", .55); S.snare(dest, t, .22); }
          if (i % 2 === 0) S.hat(dest, t, .16, false, i % 4 ? .2 : -.2);
          if (i === 0 || i === 8) S.bass808(dest, t, bass(t), b * 1.8, .65);
          if (on("x..x..x...x.....", i)) stab(t, s16 * 2.5, .16);
          break;
        case "jersey_club":
          if (on("x...x...x.x...x.", i)) S.kick(dest, t, .85);
          if (i === 4 || i === 12) { S.hit(dest, t, "clap", .6); S.clap(dest, t, .25); }
          if (i % 2 === 0) S.hat(dest, t + (i % 4 ? s16 * .1 : 0), .14);
          if (i === 0) S.bass808(dest, t, bass(t), b * 3.5, .6);
          if (i % 2 === 0) { const c = chordTones(t, 76); S.note(dest, t, K, c[(i / 2) % c.length], s16 * 2, .2 * duck); }
          break;
        case "drill": {
          if (on(B ? "x.....x...x....." : "x.........x..x..", i)) S.kick(dest, t, .8);
          if (i === 8 || (B && i === 13)) { S.hit(dest, t, "snare", .55); S.hit(dest, t, "clap", .35); }
          if (i % 2 === 0) S.hat(dest, t, .14, false, (i % 4 ? .25 : -.25));
          if (B && i >= 12 && i % 4 === 0) for (let k = 1; k < 3; k++) S.hat(dest, t + k * b / 3, .1, false, .25);
          if (on(B ? "x.....x...x....." : "x.........x.....", i)) {
            const f = bass(t) * (on("..........x.....", i) ? 1.5 : 1);
            S.slide808(dest, t, f, B && i === 6 ? f * 1.33 : f, b * 1.4, .7);
          }
          if (i === 0) stab(t, b * 3.8, .1, 62);
          break;
        }
        case "phonk": {
          if (on("x.....x...x.....", i)) S.kick(dest, t, .85);
          if (i === 4 || i === 12) S.hit(dest, t, "clap", .55);
          S.hat(dest, t, i % 2 ? .07 : .12);
          if (i === 0 || i === 10) S.bass808(dest, t, bass(t), b * 2.2, .75);
          // the pitched cowbell riff phonk is known by
          const riff = A.minor ? [0, null, 0, null, 3, null, 0, 7, null, 5, null, 3, null, 0, null, -2] : [0, null, 0, null, 4, null, 0, 7, null, 5, null, 4, null, 0, null, -1];
          const n = riff[i]; if (n != null) S.hit(dest, t, "cowbell", .22, .15, 2 ** ((((keyPc + 3) % 12) - 6 + n) / 12));
          break;
        }
        case "baile_funk":
          if (on("x.....x...x.....", i)) S.kick(dest, t, .85);
          if (on("x..x..x...x..x..", i)) S.hit(dest, t, i % 3 ? "tumba" : "tom_lo", .5);
          if (on("..x...x.....x.x.", i)) S.hit(dest, t, "conga_mute", .3, .3);
          if (i === 4 || i === 12) S.hit(dest, t, "clap", .5);
          if (i === 0 && bar % 4 === 0) S.hit(dest, t, "whistle", .22, -.3);
          if (on("x.....x...x.....", i)) S.bass808(dest, t, bass(t), b, .55);
          if (i === 0) stab(t, b * .6, .12);
          break;
        case "amapiano":
          if (beat) S.kick(dest, t, .6);
          S.hit(dest, t, i % 2 ? "shaker_up" : "shaker", i % 4 === 2 ? .35 : .22, (i % 2 ? .3 : -.3));
          if (on("..x...x...x...x.", i)) S.hit(dest, t, "clave", .18, .4);
          if (on("x..x...x..x.x...", i)) { const f = bass(t) * (on("...x......x.....", i) ? 1.5 : on("............x...", i) ? 2 : 1); S.logdrum(dest, t, f, .65); }
          if (on("x.....x.........", i)) stab(t, b * 1.2, .14, 66);
          break;
        case "cumbia":
          if (beat) S.hit(dest, t, "guiro", .3, .2); else if (i % 2 === 0) S.hit(dest, t, "guiro_hit", .22, .2);
          if (on("..x...x...x...x.", i)) S.hit(dest, t, "conga_mute", .3, -.25);
          if (on("...x.......x....", i)) S.hit(dest, t, "conga", .32, -.25);
          if (on("......x.......x.", i)) S.hit(dest, t, "tumba", .35, -.1);
          if (i === 0 || i === 8) { S.kick(dest, t, .45); const f = bass(t); S.pluck(dest, t, i ? f * 1.5 : f, b * 1.2, .5, "triangle", 700); }
          if (on("..x...x...x...x.", i)) stab(t, s16 * 1.5, .13);
          break;
        case "disco":
          if (beat) S.kick(dest, t, .9);
          if (on("..x...x...x...x.", i)) S.hit(dest, t, "hat_open", .3, .2);
          if (i % 2 === 1) S.hat(dest, t, .07);
          if (i === 4 || i === 12) { S.hit(dest, t, "snare", .4); S.hit(dest, t, "clap", .3); }
          if (on("..x...x...x...x.", i)) S.hit(dest, t, "tamb", .16, -.3);
          if (i % 2 === 0) { const f = bass(t); S.pluck(dest, t, i % 4 ? f * 2 : f, s16 * 1.6, .42, "sawtooth", 1100); }
          if (on("..x...x.........", i)) stab(t, s16 * 2, .14);
          break;
        case "uk_garage": {
          const sw = i % 2 ? s16 * .32 : 0;
          if (on("x.........x.x...", i)) S.kick(dest, t, .8);
          if (i === 4 || i === 12) { S.hit(dest, t, "snare", .35); S.hit(dest, t, "clap", .3); }
          S.hat(dest, t + sw, i % 2 ? .08 : .13, false, .2);
          if (on("x..x......x.....", i)) S.bass808(dest, t, bass(t), b * .9, .55);
          if (on("x..x..x...x.....", i)) stab(t + sw, s16 * 1.4, .13, 67);
          break;
        }
        case "swing": {
          if (i % 4 !== 0 && i % 4 !== 3) break;
          const sw = i % 4 === 3 ? s16 * .33 : 0, tt = t + sw;     // swung eighths: the "and" comes late
          if (i % 4 === 0 || (i % 8 === 7)) S.hat(dest, tt, .1, true, .3);
          if (i === 4 || i === 12) { S.hat(dest, tt, .12, false, -.2); S.hit(dest, tt, "snare", .1); }
          if (i % 4 === 0) {                                // walking bass: chord tones, then a step into the next
            const c = voicing(keyPc, A.chordAt(tt + 1e-4), 40), n = (i / 4) | 0;
            const m = n === 3 ? voicing(keyPc, A.chordAt(tt + b + 1e-4), 40)[0] - 1 : c[[0, 2, 1][n] % c.length];
            S.pluck(dest, tt, mtof(m), b * .9, .45, "sine", 900);
          }
          if (i === 0 || i === 7) stab(tt, b * .5, .13, 64);
          break;
        }
        case "epic":
          if (i === 0) { S.hit(dest, t, "timpani", .6); S.hit(dest, t, "bass_drum", .45); S.kick(dest, t, .5); }
          if (i === 8) S.hit(dest, t, "timpani", .4);
          if (i === 0 && bar % 4 === 0) S.hit(dest, t, "crash", .3);
          if (B && i >= 12) S.hit(dest, t, i % 2 ? "tom_hi" : "tom_lo", .3 + (i - 12) * .05);
          if (i === 4 || i === 12) S.hit(dest, t, "snare", .2);
          if (i === 0) { stab(t, b * 3.9, .12, 60); S.pluck(dest, t, bass(t), b * 3.8, .35, "sawtooth", 300); }
          break;
        case "march":
          if (i === 0 || i === 8) { S.hit(dest, t, "bass_drum", .45); S.pluck(dest, t, bass(t) * 2, b * .7, .5, "sawtooth", 500); }
          if (i === 4 || i === 12) { S.hit(dest, t, "crash", .1); stab(t, b * .35, .16, 66); }
          if (on("x.x.x.x.x.xxx.x.", i)) S.hit(dest, t, "snare", i % 4 ? .14 : .26);
          break;
        case "bossa":
          if (on("x..x..x...x..x..", i)) S.hit(dest, t, "rim", .35, -.2);
          if (on("x.....xx........", i) || on("........x.....xx", i)) S.kick(dest, t, .45);
          S.hit(dest, t, i % 2 ? "shaker_up" : "shaker", .12, .3);
          if (i === 0 || i === 6 || i === 8 || i === 14) { const f = bass(t); S.pluck(dest, t, i === 6 || i === 14 ? f * 1.5 : f, b * .9, .45, "sine", 800); }
          if (on("x..x..x...x..x..", i)) stab(t, s16 * 1.6, .12, 66);
          break;
      }
    }
  }
}
