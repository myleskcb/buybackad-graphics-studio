// Phone Ad Maker sound: every cue is synthesised here or played from a CC0 recording
// (music.js), so nothing is licensed. Rendered offline with the Web Audio graph, then
// played with the preview or encoded into the video.

import { rng, clamp } from "./engine.js";
import { soundManifest, sampleBuffer, sampler, arrange, playTune, groove, KITS, SHAVE, LEADS, SYNTHS, STRINGS, mtof } from "./music.js";

const SR = 44100;
// Times before the first frame (a phone already in flight at frame 0) are clamped to it:
// Web Audio refuses a negative time, and one refused cue used to silence the whole soundtrack.
const T = x => Math.max(0, x);

export async function renderSoundtrack(ad) {
  const man = await soundManifest(), bufs = new Map(), need = new Set();
  // composed once to learn which recordings it plays, then again with them loaded
  compose(ad, new OfflineAudioContext(2, SR, SR), man, bufs, need);
  if (need.size) await Promise.all([...need].map(async k => bufs.set(k, await sampleBuffer(k))));
  const ctx = new OfflineAudioContext(2, Math.ceil(ad.st.duration * SR), SR);
  compose(ad, ctx, man, bufs, new Set());
  return ctx.startRendering();
}

function compose(ad, ctx, man, bufs, need) {
  const st = ad.st, tl = ad.tl;
  const master = ctx.createGain(); master.gain.value = .9;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.knee.value = 8; comp.ratio.value = 6; comp.attack.value = .003; comp.release.value = .12;
  master.connect(comp).connect(ctx.destination);
  const sfx = ctx.createGain(); sfx.gain.value = 1; sfx.connect(master);
  const noise = noiseBuffer(ctx, 2);
  const r = rng(st.seed * 17 + 3);
  const S = Object.assign(synth(ctx, noise), sampler(ctx, man, bufs, need));
  // a note on a synthesiser or a plucked string is played here; on any other instrument, from its recording
  const recorded = S.note;
  S.note = (dest, t, inst, m, dur, gain, pan = 0, from = null) => SYNTHS[inst]
    ? S.voice(dest, t, mtof(m), dur, gain * (SYNTHS[inst].level ?? 1), SYNTHS[inst], pan, from)
    : STRINGS[inst] ? S.string(dest, t, mtof(m), dur, gain * (STRINGS[inst].level ?? 1), STRINGS[inst], pan) : recorded(dest, t, inst, m, dur, gain, pan);
  // real drums: the recorded hi-hat, snare and claps, matched to the loudness of the synthesised
  // ones they replace (measured); the synthesised one stays only where a recording fails to load
  const rawHit = S.hit, synthHat = S.hat, synthSnare = S.snare, synthClap = S.clap; let claps = 0;
  S.hat = (dest, t, gain, open = false, pan = 0) => S.loaded(open ? "hat_open" : "hat")
    ? rawHit(dest, t, open ? "hat_open" : "hat", gain * (open ? 2.5 : 1.12), pan) : synthHat(dest, t, gain, open, pan);
  S.snare = (dest, t, gain) => { if (!S.loaded("snare")) return synthSnare(dest, t, gain); rawHit(dest, t, "snare", gain * 1.35); synthSnare(dest, t, gain * .25); };
  S.clap = (dest, t, gain) => S.loaded("clap") ? rawHit(dest, t, claps++ % 2 ? "clap2" : "clap", gain * .62) : synthClap(dest, t, gain);
  const hit = tl.hit;
  const b = 60 / (st.bpm || 118), start = st.hook && st.hook !== "none" ? hit - Math.ceil(hit / b) * b : hit;
  const A = arrange(st, start, hit);
  const { music, finish } = mixBus(ctx, S, st, master, sfx, hit, b);

  for (const p of ad.phones) {
    const pan = clamp((p.home[0] / ad.W) * 2 - 1, -1, 1) * .7, fl = p.tLand - p.tIn;
    if (["zoom", "pop"].includes(st.entry)) S.whoosh(sfx, p.tIn, fl, true, pan, .5);
    else if (st.entry === "deal") { S.tap(sfx, p.tIn, pan, .4); S.whoosh(sfx, p.tIn, fl, false, pan, .35); }
    else S.whoosh(sfx, p.tIn, fl + .05, false, pan, .55);
    S.thud(sfx, p.tLand - .01, 70, 42, .35, pan, .8);
    if (["drop", "rain"].includes(st.entry)) S.thud(sfx, p.tIn + fl * .73, 90, 60, .25, pan, .4);
    if (p.reveal) { S.whoosh(sfx, p.tReveal, .45, true, pan, .25); S.tap(sfx, p.tReveal + .48, pan, .6); }
  }
  
  // Nothing opens on silence: the first frame lands on a hit that matches the hook.
  switch (st.hook) {
    case "hook_line": S.bassDrop(sfx, 0, .75); S.impact(sfx, 0, .8); S.whoosh(sfx, .8, .3, true, 0, .4); break;
    case "word_beat":                                // one hit per word, like a drum roll that spells the question
      S.impact(sfx, 0, .75);
      (ad.hookLines || []).forEach((_, i) => { const tt = i * (ad.hookBeat || .2); S.kick(sfx, tt, .8); S.clap(sfx, tt, i % 2 ? .45 : .3); });
      S.whoosh(sfx, ad.hookEnd - .12, .3, true, 0, .4); break;
    case "flash_cut": ad.phones.forEach(p => S.impact(sfx, p.tFlash ?? 0, .6)); break;
    case "crash_zoom": S.whoosh(sfx, 0, .6, false, 0, .7); ad.phones.filter(p => p.crash).forEach(p => S.impact(sfx, p.tLand, .8)); break;
    case "punch_in": S.impact(sfx, 0, .85); S.whoosh(sfx, 0, .5, false, 0, .5); break;
    case "cold_open": S.impact(sfx, 0, .6); break;
  }
  switch (st.accent) {                               // an opening sound over the hook
    case "air_horn": S.airhorn(sfx, 0, .42); break;
    case "siren": S.hit(sfx, 0, "siren", .5); break;
    case "whistle": S.hit(sfx, 0, "whistle", .5); break;
    case "gong": S.hit(sfx, 0, "gong", .55); break;
    case "windchimes": S.hit(sfx, 0, "windchimes", .55, .3); break;
    case "bell_tree": S.hit(sfx, 0, "bell_tree", .5, -.3); break;
    case "vibraslap": S.hit(sfx, 0, "vibraslap", .6); break;
    case "sleigh_bells": S.hit(sfx, 0, "sleigh_shake", .6, .2); break;
  }
  switch (st.hit) {
    case "riser": S.riser(sfx, hit - .8, .8, .55); S.impact(sfx, hit, .9); break;
    case "glitch": S.whoosh(sfx, tl.text - .45, .55, true, -.6, .5); S.glitch(sfx, hit - .05, r, .6); S.impact(sfx, hit, .8); break;
    case "cymbal": S.cymbal(sfx, hit - .9, 1.0, .5); S.impact(sfx, hit, .85); break;
    case "bass_drop": S.whoosh(sfx, tl.text - .45, .55, true, -.6, .45); S.bassDrop(sfx, hit, .9); break;
    case "clap_stack": S.whoosh(sfx, tl.text - .45, .55, true, -.6, .45); [0, .06, .12].forEach(o => S.clap(sfx, hit + o, .5)); S.impact(sfx, hit, .6); break;
    case "gong": S.whoosh(sfx, tl.text - .45, .55, true, -.6, .4); S.hit(sfx, hit, "gong", .75); S.impact(sfx, hit, .45); break;
    case "timpani": S.hit(sfx, hit, "timpani", .9); S.hit(sfx, hit, "bass_drum", .5); S.impact(sfx, hit, .35); break;
    case "whip": S.whoosh(sfx, tl.text - .3, .32, true, -.5, .45); S.hit(sfx, hit, "whip", .9); S.impact(sfx, hit, .5); break;
    case "anvil": S.hit(sfx, hit, "anvil", .7); S.impact(sfx, hit, .6); break;
    case "crash": S.hit(sfx, hit, "crash", .55); S.impact(sfx, hit, .75); break;
    case "swell": S.hit(sfx, hit - 1.9, "cym_swell", .55); S.impact(sfx, hit, .85); break;
    case "orchestra": {                              // an orchestra hit made of the real thing
      S.hit(sfx, hit, "timpani", .8); S.hit(sfx, hit, "bass_drum", .5); S.hit(sfx, hit, "crash", .4);
      const root = 48 + A.keyPc;
      [root, root + 12, root + (A.minor ? 15 : 16), root + 19, root + 24].forEach(m => S.note(sfx, hit, "organ", m, .45, .3));
      S.impact(sfx, hit, .4); break;
    }
    default: S.whoosh(sfx, tl.text - .45, .55, true, -.6, .55); S.impact(sfx, hit, .9);
  }
  if (ad.lines.length > 1) S.impact(sfx, tl.lines[1] + .3, .45);
  if (["slide_letters", "drop_letters", "typewriter", "scramble", "spin_letters"].includes(st.text_in)) {
    ad.lines.forEach((L, i) => L.glyphs.forEach((_, j) => S.tick(sfx, tl.lines[i] + j * (st.text_in === "typewriter" ? .032 : .024) + (st.text_in === "typewriter" ? 0 : .16), .16)));
  }
  const n = ad.num.text.length;
  switch (st.number_in === "type" ? "ticks" : st.number_sfx) {
    case "ticks": for (let k = 0; k < n; k++) S.tick(sfx, tl.number + k * .06, .4); S.pop(sfx, tl.number + n * .06, .5); break;
    case "register": S.register(sfx, tl.number + .05, .7); break;
    case "coin": S.coin(sfx, tl.number + .05, .6); break;
    case "chime": S.chime(sfx, tl.number + .05, .6); break;
    case "whoosh_ding": S.whoosh(sfx, tl.number - .2, .35, true, .4, .35); S.chime(sfx, tl.number + .15, .45); break;
    case "shave_haircut": {                          // "shave and a haircut... two bits"
      const inst = st.melody !== "none" && st.lead && st.lead !== "synth" ? st.lead : "xylophone", top = (LEADS[inst] || LEADS.xylophone).center;
      const tonic = A.keyPc + 12 * Math.round((top - A.keyPc) / 12);
      let x = tl.number; for (const [n, d] of SHAVE) { if (n != null) S.note(sfx, x, inst, tonic + n, d * .14, .5); x += d * .14; }
      break;
    }
    case "cash_counter": S.counter(sfx, tl.number, .5); break;
    case "text_ding": { const m = 84 + A.keyPc % 12; S.note(sfx, tl.number + .02, "glock", m, .3, .45); S.note(sfx, tl.number + .13, "glock", m + 7, .5, .45); break; }
    case "phone_buzz": S.buzz(sfx, tl.number, .45); S.buzz(sfx, tl.number + .42, .45); break;
    case "bells": S.note(sfx, tl.number + .03, "bells", 64 + (A.keyPc + 8) % 12, 1.4, .55); break;
    case "triangle": S.hit(sfx, tl.number + .03, "triangle", .7, .3); break;
    case "glock_run": [0, 4, 7, 12].forEach((iv, i) => S.note(sfx, tl.number + i * .055, "glock", 84 + A.keyPc % 12 + iv - (A.minor && iv === 4 ? 1 : 0), .5, .45)); break;
    case "harp_gliss": [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24].forEach((iv, i) => S.note(sfx, tl.number - .25 + i * .035, "harp", 60 + A.keyPc % 12 + iv, .6, .35 - i * .015, .2)); break;
    case "whistle": S.hit(sfx, tl.number, "whistle", .5, .2); break;
    default: S.pop(sfx, tl.number + .05, .7);
  }
  if (st.shine || st.sparkles) S.shimmer(sfx, tl.shine, .45);
  // the signs and the urgency pieces each land on a sound of their own
  const cues = ad.cues || {};
  if (cues.board != null) { S.tap(sfx, cues.board, 0, .55); S.thud(sfx, cues.board + .05, 110, 60, .2, 0, .35); }
  if (cues.burst != null) S.pop(sfx, cues.burst, .45);
  if (cues.stamp != null) { S.thud(sfx, cues.stamp + .2, 120, 38, .45, 0, 1); S.clap(sfx, cues.stamp + .2, .45); }
  if (cues.tape != null) S.whoosh(sfx, cues.tape, .38, false, .3, .45);
  if (st.sound_kit !== "none") {
    // The beat runs from the first frame, on a grid that puts a downbeat exactly on the headline hit.
    if (KITS[st.sound_kit]) groove(S, music, st.sound_kit, A, start, st.duration);
    else beat(S, music, st.sound_kit, start, st.duration, st.bpm || 118, r, A.tune ? t => mtof(28 + ((A.keyPc + A.chordAt(t + 1e-4)[0] - 4) % 12 + 12) % 12) : null);
    playTune(S, music, A, st, st.duration);
    if (st.season === "christmas")                     // sleigh bells on the off-beats, from the hit on
      for (let t = hit + b / 2; t < st.duration; t += b) S.hit(music, t, "sleigh", .28, .3);
    arrangeDrums(S, music, st, hit, b);
  }
  finish();
  // fade the whole mix out at the end
  master.gain.setValueAtTime(.9, T(Math.max(0, st.duration - .6)));
  master.gain.linearRampToValueAtTime(0, T(st.duration));
}

// ------------------------------------------------------------ making it sound like a record

const DRUMLESS = new Set(["classical", "none"]);
// how much each groove breathes under its kick, and how much room it is played in
const PUMP = { house: .35, edm: .4, deep_house: .35, trance: .4, future_bass: .5, nu_disco: .3, disco: .25, pop: .18, synthwave: .2,
  jersey_club: .25, uk_garage: .25, reggaeton: .2, amapiano: .25 };
const ROOM = { classical: .34, rnb: .3, gospel: .3, lofi: .26, epic: .32, synthwave: .3, bossa: .24, swing: .24, motown: .22, gfunk: .2 };

/** A room: noise that dies away, darker as it goes, a little different in each ear. */
function roomImpulse(ctx, secs) {
  const n = Math.floor(secs * SR), b = ctx.createBuffer(2, n, SR), pre = Math.floor(.012 * SR);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c); let s = 977 + c * 131, lp = 0;
    for (let i = pre; i < n; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      lp += (.35 + .5 * (1 - i / n)) * ((s / 0x3fffffff - 1) - lp);
      d[i] = lp * (1 - i / n) ** 2.6;
    }
  }
  return b;
}

/** The music's own bus: a filter that opens into the headline hit (the drop), a room, the
 *  pump under the kick, the look's mix tone, and drums and notes played by hand (a few
 *  milliseconds early or late, never twice at the same loudness). The sound effects stay
 *  dry and exact so they land on the picture. */
function mixBus(ctx, S, st, master, sfx, hit, b) {
  const kit = st.sound_kit, out = ctx.createGain(); out.gain.value = st.music_volume ?? .5;
  tone(ctx, st.tone, out, st.duration).connect(master);
  const music = ctx.createGain(), kickBus = ctx.createGain(), duck = ctx.createGain();
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = .9;
  // the build: muffled from the first frame, wide open on the hit, closing over the last second
  lp.frequency.setValueAtTime(hit > .25 ? 650 : 18000, 0);
  if (hit > .25) lp.frequency.exponentialRampToValueAtTime(18000, T(hit));
  lp.frequency.setValueAtTime(18000, T(st.duration - 1.1)); lp.frequency.exponentialRampToValueAtTime(2500, T(st.duration));
  music.connect(lp).connect(duck).connect(out);
  kickBus.connect(out);
  const room = ctx.createConvolver(); room.buffer = roomImpulse(ctx, 2.2);
  const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 280;
  const wet = ctx.createGain(); wet.gain.value = ROOM[kit] ?? .18;
  lp.connect(hp).connect(room).connect(wet).connect(duck);
  const sfxSend = ctx.createGain(); sfxSend.gain.value = .08; sfx.connect(sfxSend).connect(hp);

  // played by hand
  const h = rng(st.seed * 31 + 9), mine = d => d === music;
  const loose = (fn, dt, dv, tIdx = 1, gIdx = 2) => (...a) => {
    if (mine(a[0])) { a[tIdx] += (h() - .5) * 2 * dt; a[gIdx] *= 1 - dv + 2 * dv * h(); }
    return fn(...a);
  };
  const kicks = [], kick0 = S.kick;
  S.kick = (dest, t, gain) => { if (dest === music) { kicks.push(t); dest = kickBus; t += (h() - .5) * .004; gain *= .95 + .1 * h(); } kick0(dest, t, gain); };
  S.hat = loose(S.hat, .007, .18); S.snare = loose(S.snare, .004, .08); S.clap = loose(S.clap, .004, .1);
  S.hit = loose(S.hit, .005, .12, 1, 3); S.note = loose(S.note, .006, .1, 1, 5); S.pluck = loose(S.pluck, .004, .08, 1, 4);

  return {
    music,
    finish() {
      // the pump: everything but the kick dips as each kick lands and swells back
      const depth = PUMP[kit] || 0;
      if (!depth) return;
      let free = 0;
      for (const t of kicks.sort((x, y) => x - y)) {
        if (t < free || t < 0) continue;
        const back = Math.min(.3, b * .6);
        duck.gain.setValueAtTime(1, t); duck.gain.linearRampToValueAtTime(1 - depth, t + .015); duck.gain.linearRampToValueAtTime(1, t + back);
        free = t + back;
      }
    },
  };
}

/** The mix tone: the same song as mixed, warm, on tape, on vinyl, bright, or in a club. */
function tone(ctx, kind, input, dur) {
  const node = (type, f, g, q) => { const n = ctx.createBiquadFilter(); n.type = type; n.frequency.value = f; if (g != null) n.gain.value = g; if (q != null) n.Q.value = q; return n; };
  let chain;
  switch (kind) {
    case "warm": chain = [node("lowshelf", 160, 2.5), node("highshelf", 6500, -3.5)]; break;
    case "tape": { const ws = ctx.createWaveShaper(), mk = ctx.createGain(); ws.curve = curve(1.35); ws.oversample = "2x"; mk.gain.value = .86; chain = [node("lowshelf", 120, 2), ws, node("lowpass", 11000, null, .5), mk]; break; }
    case "vinyl": chain = [node("highpass", 55), node("lowshelf", 200, 1.5), node("lowpass", 8500, null, .5)]; break;
    case "bright": chain = [node("highshelf", 7500, 4), node("peaking", 3000, 1.5, .8)]; break;
    case "club": chain = [node("lowshelf", 75, 4.5), node("peaking", 350, -2, .9), node("highshelf", 9000, 2)]; break;
    default: return input;                                  // studio: as mixed
  }
  let last = input; for (const n of chain) { last.connect(n); last = n; }
  if (kind === "vinyl") {                                   // the crackle under the record
    const n = Math.floor(dur * SR), cb = ctx.createBuffer(1, n, SR), d = cb.getChannelData(0); let s = 4242;
    for (let i = 0; i < n; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; const u = s / 0x7fffffff; d[i] = u > .99965 ? (u - .99965) * 1600 * (i % 2 ? 1 : -1) : (u - .5) * .004; }
    const src = ctx.createBufferSource(); src.buffer = cb; const g = ctx.createGain(); g.gain.value = .5; src.connect(g).connect(last); src.start(0);
  }
  return last;
}

/** Drums arranged like a record: a crash on the drop, a fill into every fourth bar. */
function arrangeDrums(S, music, st, hit, b) {
  if (DRUMLESS.has(st.sound_kit)) return;
  if (!["crash", "cymbal", "swell", "orchestra"].includes(st.hit)) S.hit(music, hit, "crash", .3, .3);
  const f = rng(st.seed * 53 + 1);
  for (let bar = 4; hit + bar * 4 * b < st.duration - .6; bar += 4) {
    const t0 = hit + bar * 4 * b - b, kind = f.int(0, 2);
    for (let i = 0; i < 4; i++) {
      const t = t0 + i * b / 4, g = .16 + i * .05;
      if (kind === 0) S.hit(music, t, "snare", g);
      else if (kind === 1) S.hit(music, t, ["tom_hi", "tom_hi", "tom_lo", "tom_lo"][i], g + .05, i < 2 ? -.3 : .3);
      else { S.hit(music, t, i % 2 ? "tom_lo" : "snare", g); if (i === 3) S.hit(music, t + b / 8, "snare", g); }
    }
    S.hit(music, t0 + b, "crash", .2, -.3);
  }
}

const KS = new Map();
/** A plucked string (Karplus-Strong): a burst of noise fed round a delay one vibration long,
 *  losing a little brightness each time round, as a real string does. Made once per note. */
function ksBuffer(f, P) {
  const N = Math.max(2, Math.round(SR / f - .5)), key = P.id + ":" + N;
  if (KS.has(key)) return KS.get(key);
  const len = Math.floor(P.secs * SR), b = new AudioBuffer({ length: len, sampleRate: SR, numberOfChannels: 1 }), d = b.getChannelData(0);
  let s = 12345 + N * 7, prev = 0;
  for (let i = 0; i < N; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; prev += P.bright * ((s / 0x3fffffff - 1) - prev); d[i] = prev; }
  for (let i = N; i < len; i++) d[i] = P.damp * .5 * (d[i - N] + d[Math.max(0, i - N - 1)]);
  let pk = 0; for (let i = 0; i < len; i++) pk = Math.max(pk, Math.abs(d[i]));
  for (let i = 0; i < len; i++) d[i] *= .8 / (pk || 1);
  const v = { b, f: SR / (N + .5) }; KS.set(key, v); return v;
}

export function noiseBuffer(ctx, secs) {
  const b = ctx.createBuffer(1, secs * SR, SR), d = b.getChannelData(0);
  let s = 12345;
  for (let i = 0; i < d.length; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; d[i] = s / 0x3fffffff - 1; }
  return b;
}

export function synth(ctx, noise) {
  const env = (g, t, a, peak, decay) => { g.gain.setValueAtTime(0, T(t)); g.gain.linearRampToValueAtTime(peak, T(t + a)); g.gain.exponentialRampToValueAtTime(.0005, T(t + a + decay)); };
  const out = (node, dest, pan = 0) => { if (pan) { const p = ctx.createStereoPanner(); p.pan.value = pan; node.connect(p).connect(dest); } else node.connect(dest); };
  const noiseSrc = (t, dur) => { const n = ctx.createBufferSource(); n.buffer = noise; n.loop = true; n.start(Math.max(0, t), Math.random() * 1.5); n.stop(T(t + dur + .05)); return n; };
  const osc = (type, t, dur, f) => { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, T(Math.max(0, t))); o.start(Math.max(0, t)); o.stop(T(t + dur + .05)); return o; };
  const S = {
    whoosh(dest, t, dur, up, pan, gain) {
      if (t + dur < 0) return;
      const n = noiseSrc(t, dur), bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.4;
      const f0 = up ? 400 : 3600, f1 = up ? 4200 : 500;
      bp.frequency.setValueAtTime(f0, T(Math.max(0, t))); bp.frequency.exponentialRampToValueAtTime(f1, T(t + dur));
      const g = ctx.createGain(); g.gain.setValueAtTime(0, T(Math.max(0, t))); g.gain.linearRampToValueAtTime(gain, T(t + dur * (up ? .8 : .45))); g.gain.linearRampToValueAtTime(0, T(t + dur));
      n.connect(bp).connect(g); out(g, dest, pan);
    },
    thud(dest, t, f0, f1, dur, pan, gain) {
      const o = osc("sine", t, dur, f0); o.frequency.exponentialRampToValueAtTime(f1, T(t + dur * .6));
      const g = ctx.createGain(); env(g, t, .004, gain, dur); o.connect(g); out(g, dest, pan);
      const n = noiseSrc(t, .03), lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2500;
      const gn = ctx.createGain(); env(gn, t, .001, gain * .35, .02); n.connect(lp).connect(gn); out(gn, dest, pan);
    },
    tap(dest, t, pan, gain) {
      const o = osc("sine", t, .12, 180); const g = ctx.createGain(); env(g, t, .002, gain, .1); o.connect(g); out(g, dest, pan);
      const n = noiseSrc(t, .02), g2 = ctx.createGain(); env(g2, t, .001, gain * .4, .015); n.connect(g2); out(g2, dest, pan);
    },
    impact(dest, t, gain) {
      const o = osc("sine", t, 1, 98); o.frequency.exponentialRampToValueAtTime(38, T(t + .5));
      const g = ctx.createGain(); env(g, t, .005, gain, .9); o.connect(g).connect(dest);
      const n = noiseSrc(t, .3), bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2500; bp.Q.value = .6;
      const gn = ctx.createGain(); env(gn, t, .002, gain * .7, .25); n.connect(bp).connect(gn).connect(dest);
    },
    bassDrop(dest, t, gain) {
      const o = osc("sine", t, 1.4, 140); o.frequency.exponentialRampToValueAtTime(34, T(t + 1.1));
      const ws = ctx.createWaveShaper(); ws.curve = curve(2.5);
      const g = ctx.createGain(); env(g, t, .01, gain, 1.3); o.connect(ws).connect(g).connect(dest);
    },
    pop(dest, t, gain) {
      const o = osc("sine", t, .35, 660); o.frequency.exponentialRampToValueAtTime(1160, T(t + .08));
      const g = ctx.createGain(); env(g, t, .003, gain, .3); o.connect(g).connect(dest);
      const d = osc("sine", t + .05, .5, 1760), gd = ctx.createGain(); env(gd, t + .05, .003, gain * .35, .45); d.connect(gd).connect(dest);
    },
    shimmer(dest, t, gain) {
      [2093, 2637, 3136, 4186].forEach((f, i) => { const o = osc("sine", t + i * .06, .6, f), g = ctx.createGain(); env(g, t + i * .06, .003, gain * .25, .5); o.connect(g); out(g, dest, .3); });
    },
    clap(dest, t, gain) {
      [0, .011, .022].forEach((o2, k) => {
        const n = noiseSrc(t + o2, .25), bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1600; bp.Q.value = 1.2;
        const g = ctx.createGain(); env(g, t + o2, .001, gain, k < 2 ? .03 : .18); n.connect(bp).connect(g).connect(dest);
      });
    },
    snare(dest, t, gain) {
      const o = osc("triangle", t, .2, 190), g = ctx.createGain(); env(g, t, .001, gain * .6, .12); o.connect(g).connect(dest);
      const n = noiseSrc(t, .25), hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1800;
      const gn = ctx.createGain(); env(gn, t, .001, gain, .18); n.connect(hp).connect(gn).connect(dest);
    },
    hat(dest, t, gain, open = false, pan = 0) {
      const n = noiseSrc(t, open ? .3 : .06), hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 7000;
      const g = ctx.createGain(); env(g, t, .001, gain, open ? .25 : .045); n.connect(hp).connect(g); out(g, dest, pan);
    },
    kick(dest, t, gain) {                                 // a body that drops in pitch, a beater click, a little drive
      const o = osc("sine", t, .5, 150); o.frequency.exponentialRampToValueAtTime(46, T(t + .09));
      const ws = ctx.createWaveShaper(); ws.curve = curve(1.6);
      const g = ctx.createGain(); env(g, t, .002, gain, .42); o.connect(ws).connect(g).connect(dest);
      const n = noiseSrc(t, .012), hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2500;
      const gc = ctx.createGain(); env(gc, t, .0005, gain * .22, .008); n.connect(hp).connect(gc).connect(dest);
    },
    bass808(dest, t, f, dur, gain) {
      const o = osc("sine", t, dur, f * 2.2); o.frequency.exponentialRampToValueAtTime(f, T(t + .05));
      const ws = ctx.createWaveShaper(); ws.curve = curve(2.2);
      const g = ctx.createGain(); env(g, t, .004, gain, dur); o.connect(ws).connect(g).connect(dest);
    },
    pluck(dest, t, f, dur, gain, type = "triangle", cutoff = 1800) {
      const o = osc(type, t, dur, f), lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(cutoff, T(t)); lp.frequency.exponentialRampToValueAtTime(200, T(t + dur));
      const g = ctx.createGain(); env(g, t, .005, gain, dur); o.connect(lp).connect(g).connect(dest);
    },
    riser(dest, t, dur, gain) {
      if (t < 0) { dur += t; t = 0; }
      const n = noiseSrc(t, dur), bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 2;
      bp.frequency.setValueAtTime(300, T(t)); bp.frequency.exponentialRampToValueAtTime(5300, T(t + dur));
      const g = ctx.createGain(); g.gain.setValueAtTime(0, T(t)); g.gain.linearRampToValueAtTime(gain, T(t + dur)); g.gain.linearRampToValueAtTime(0, T(t + dur + .02));
      n.connect(bp).connect(g).connect(dest);
      const o = osc("sawtooth", t, dur, 200); o.frequency.exponentialRampToValueAtTime(1100, T(t + dur));
      const go = ctx.createGain(); go.gain.setValueAtTime(0, T(t)); go.gain.linearRampToValueAtTime(gain * .12, T(t + dur)); go.gain.linearRampToValueAtTime(0, T(t + dur + .02)); o.connect(go).connect(dest);
    },
    cymbal(dest, t, dur, gain) {
      if (t < 0) { dur += t; t = 0; }
      const n = noiseSrc(t, dur), hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 5000;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, T(t)); g.gain.exponentialRampToValueAtTime(gain, T(t + dur)); g.gain.linearRampToValueAtTime(0, T(t + dur + .02));
      n.connect(hp).connect(g).connect(dest);
    },
    glitch(dest, t, r, gain) {
      let p = t;
      while (p < t + .35) {
        const L = r.uniform(.012, .04), o = osc(r() < .5 ? "square" : "sawtooth", p, L, r.pick([220, 440, 880, 1320, 60]));
        const g = ctx.createGain(); g.gain.setValueAtTime(gain * .5 * Math.exp(-(p - t) * 5), T(p)); g.gain.setValueAtTime(0, T(p + L)); o.connect(g).connect(dest);
        p += L + r.uniform(0, .01);
      }
    },
    register(dest, t, gain) {
      const n = noiseSrc(t, .1), g = ctx.createGain(); env(g, t, .001, gain * .6, .06); n.connect(g).connect(dest);
      S.thud(dest, t, 160, 120, .08, 0, gain * .5);
      [[2637, 1], [3951, .5], [5274, .25]].forEach(([f, a]) => { const o = osc("sine", t + .06, .9, f), gb = ctx.createGain(); env(gb, t + .06, .002, gain * .5 * a, .8); o.connect(gb).connect(dest); });
    },
    coin(dest, t, gain) {
      const o = osc("square", t, .5, 988); o.frequency.setValueAtTime(1319, T(t + .08));
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 4000;
      const g = ctx.createGain(); env(g, t, .002, gain * .35, .45); o.connect(lp).connect(g).connect(dest);
    },
    chime(dest, t, gain) {
      [1047, 1319, 1568, 2093].forEach((f, i) => { const o = osc("sine", t + i * .07, 1.2, f), g = ctx.createGain(); env(g, t + i * .07, .003, gain * .3, 1.1); o.connect(g).connect(dest); });
    },
    slide808(dest, t, f0, f1, dur, gain) {               // a drill 808: the note bends into the next
      const o = osc("sine", t, dur, f0 * 2.2); o.frequency.exponentialRampToValueAtTime(f0, T(t + .04));
      if (f1 !== f0) { o.frequency.setValueAtTime(f0, T(t + dur * .55)); o.frequency.exponentialRampToValueAtTime(f1, T(t + dur * .7)); }
      const ws = ctx.createWaveShaper(); ws.curve = curve(2.6);
      const g = ctx.createGain(); env(g, t, .004, gain, dur); o.connect(ws).connect(g).connect(dest);
    },
    logdrum(dest, t, f, gain) {                          // amapiano's log drum: a pitched knock with a body
      const o = osc("sine", t, .5, f * 2.6); o.frequency.exponentialRampToValueAtTime(f, T(t + .025));
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900;
      const ws = ctx.createWaveShaper(); ws.curve = curve(1.6);
      const g = ctx.createGain(); env(g, t, .002, gain, .42); o.connect(ws).connect(lp).connect(g).connect(dest);
      const n = noiseSrc(t, .02), bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1200;
      const gn = ctx.createGain(); env(gn, t, .001, gain * .25, .015); n.connect(bp).connect(gn).connect(dest);
    },
    airhorn(dest, t, gain) {                             // three blasts, the last one long
      [[0, .16], [.22, .1], [.38, .55]].forEach(([o0, d]) => {
        const t0 = t + o0, g = ctx.createGain(), ws = ctx.createWaveShaper(); ws.curve = curve(3);
        const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1400; bp.Q.value = .6;
        [466, 470, 233, 932].forEach((f, i) => { const o = osc("sawtooth", t0, d, f); if (d > .3) o.frequency.linearRampToValueAtTime(f * .97, T(t0 + d));
          const og = ctx.createGain(); og.gain.value = [.5, .5, .35, .2][i]; o.connect(og).connect(ws); });
        g.gain.setValueAtTime(0, T(t0)); g.gain.linearRampToValueAtTime(gain, T(t0 + .012)); g.gain.setValueAtTime(gain, T(t0 + d - .03)); g.gain.linearRampToValueAtTime(0, T(t0 + d));
        ws.connect(bp).connect(g).connect(dest);
      });
    },
    buzz(dest, t, gain) {                                // a phone on vibrate, on a table
      const o = osc("square", t, .32, 152), lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 520;
      const am = osc("square", t, .32, 31), amg = ctx.createGain(); amg.gain.value = .35;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, T(t)); g.gain.linearRampToValueAtTime(gain * .6, T(t + .015));
      g.gain.setValueAtTime(gain * .6, T(t + .29)); g.gain.linearRampToValueAtTime(0, T(t + .32));
      am.connect(amg).connect(g.gain); o.connect(lp).connect(g).connect(dest);
    },
    counter(dest, t, gain) {                             // a bill counter: a fast flutter of notes, then a stop
      for (let k = 0; k < 18; k++) {
        const tk = t + k * .034, n = noiseSrc(tk, .02), bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 3200 + (k % 3) * 500; bp.Q.value = 1.5;
        const g = ctx.createGain(); env(g, tk, .001, gain * (.5 + .5 * Math.sin(k * .7) ** 2), .018); n.connect(bp).connect(g).connect(dest);
      }
      S.thud(dest, t + 18 * .034, 180, 120, .06, 0, gain * .6);
    },
    string(dest, t, f, dur, gain, P, pan = 0) {          // one note on a plucked string
      const end = t + dur + (P.ring ?? .3); if (end <= 0) return;
      const k = ksBuffer(f, P), src = ctx.createBufferSource(); src.buffer = k.b; src.playbackRate.value = f / k.f;
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = P.lp ?? 5000;
      const body = ctx.createBiquadFilter(); body.type = "peaking"; body.frequency.value = P.body ?? 220; body.gain.value = 3; body.Q.value = 1;
      const g = ctx.createGain(); g.gain.setValueAtTime(gain, T(t)); g.gain.setValueAtTime(gain, T(Math.max(t, end - .06))); g.gain.linearRampToValueAtTime(0, T(end));
      src.connect(lp).connect(body).connect(g); out(g, dest, pan);
      src.start(T(t), t < 0 ? -t : 0); src.stop(T(end + .01));
    },
    voice(dest, t, f, dur, gain, P, pan = 0, from = null) {   // one note on a synthesiser patch
      const rel = P.release ?? .1, end = t + dur + rel;
      if (end <= 0) return;
      const g = ctx.createGain(), att = P.attack ?? .005;
      g.gain.setValueAtTime(0, T(t)); g.gain.linearRampToValueAtTime(gain, T(t + att));
      g.gain.setValueAtTime(gain, T(Math.max(t + att, t + dur))); g.gain.linearRampToValueAtTime(0, T(end));
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = P.q ?? .7;
      const [c0, c1] = P.cut || [4000, 4000];
      lp.frequency.setValueAtTime(c0, T(t)); if (c1 !== c0) lp.frequency.exponentialRampToValueAtTime(c1, T(t + (P.cutTime ?? .2)));
      const glide = from && P.glide && from !== f;
      let vib = null;
      if (P.vib) {                                        // a vibrato that comes in once the note has sounded
        const [rate, depth, delay] = P.vib, lfo = osc("sine", t, dur + rel, rate);
        vib = ctx.createGain(); vib.gain.setValueAtTime(0, T(t)); vib.gain.setValueAtTime(0, T(t + delay)); vib.gain.linearRampToValueAtTime(f * depth, T(t + delay + .15));
        lfo.connect(vib);
      }
      let fmIn = null;
      if (P.fm) {                                         // a bell: a modulator whose brightness dies away
        const [ratio, index, decay] = P.fm, m = osc("sine", t, dur + rel, f * ratio);
        fmIn = ctx.createGain(); fmIn.gain.setValueAtTime(f * index, T(t)); fmIn.gain.exponentialRampToValueAtTime(f * .05, T(t + decay));
        m.connect(fmIn);
      }
      for (const [type, cents, lvl] of P.osc) {
        const fo = f * 2 ** (cents / 1200), o = osc(type, t, dur + rel, glide ? from * 2 ** (cents / 1200) : fo);
        if (glide) o.frequency.exponentialRampToValueAtTime(fo, T(t + P.glide));
        if (vib) vib.connect(o.frequency);
        if (fmIn) fmIn.connect(o.frequency);
        const og = ctx.createGain(); og.gain.value = lvl; o.connect(og).connect(lp);
      }
      lp.connect(g); out(g, dest, pan);
    },
    tick(dest, t, gain) {
      const o = osc("sine", t, .04, 2400), g = ctx.createGain(); env(g, t, .001, gain, .03); o.connect(g).connect(dest);
    },
  };
  return S;
}

function curve(k) {
  const n = 1024, c = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(x * k); }
  return c;
}

/** A short bed under the ad. Each kit is its own groove, not a remix of one. */
function beat(S, dest, kit, start, total, bpm, r, rootAt = null) {
  const b = 60 / bpm;
  const roots = { house: [55, 55, 65.41, 49], trap: [45, 45, 53.4, 40], lofi: [110, 98, 87.3, 98], edm: [55, 49, 43.65, 49],
    funk: [41.2, 41.2, 49, 55], afrobeat: [55, 61.7, 49, 55], boombap: [49, 49, 55, 43.65], minimal: [55, 55, 55, 55], drumline: [55, 55, 55, 55] }[kit] || [55, 55, 55, 55];
  let n = 0;
  for (let t = start; t < total; t += b, n++) {
    if (t < -1e-6) continue;
    const root = rootAt ? rootAt(t) : roots[Math.floor(n / 8) % 4];
    switch (kit) {
      case "house":
        S.kick(dest, t, .85); S.hat(dest, t + b / 2, .3);
        if (n % 2 === 0) S.pluck(dest, t, root, b * 1.6, .5, "sine", 400);
        if (n % 4 === 2) S.clap(dest, t, .35);
        break;
      case "trap": {
        if (n % 4 === 0) S.bass808(dest, t, root, b * 3.5, .8);
        if (n % 4 === 2) S.clap(dest, t, .55);
        const steps = n % 8 === 7 ? 4 : 2;
        for (let k = 0; k < steps; k++) S.hat(dest, t + k * b / steps, .25, false, k % 2 ? .2 : -.2);
        break;
      }
      case "boombap": {
        const swing = .12 * b;
        if (n % 4 === 0 || n % 4 === 2 || n % 8 === 5) S.kick(dest, t + (n % 8 === 5 ? swing : 0), .85);
        if (n % 4 === 1 || n % 4 === 3) S.snare(dest, t, .5);
        S.hat(dest, t, .22); S.hat(dest, t + b / 2 + swing, .16);
        break;
      }
      case "minimal":
        if (n % 2 === 0) S.kick(dest, t, .7);
        S.tick(dest, t + b / 2, .25);
        if (n % 8 === 0) S.pluck(dest, t, 110, b * 3.5, .15, "sine", 900);
        break;
      case "lofi": {
        const swing = .16 * b;
        if (n % 4 === 0 || n % 8 === 6) S.kick(dest, t, .6);
        if (n % 4 === 2) S.snare(dest, t + swing * .3, .3);
        S.hat(dest, t + (n % 2 ? swing : 0), .12);
        if (n % 4 === 0) { const m = Math.round(69 + 12 * Math.log2(root * 2 / 440)); [0, 4, 7, 11].forEach(iv => S.note(dest, t, "epiano", m + iv, b * 3.8, .2)); }   // a Rhodes, not a bleep
        break;
      }
      case "edm": {
        S.kick(dest, t, .9);
        [1, 1.5, 2].forEach(k => S.pluck(dest, t + b / 2, root * 4 * k, b * .45, .1, "sawtooth", 3500));
        S.hat(dest, t + b / 2, .28, n % 4 === 3);
        if (n % 2 === 1) S.clap(dest, t, .35);
        break;
      }
      case "afrobeat": {
        if ([0, 3, 6].includes(n % 8)) S.kick(dest, t, .75);
        for (let k = 0; k < 4; k++) S.hat(dest, t + k * b / 4, k % 2 ? .12 : .2, false, (k - 1.5) * .15);
        if (n % 4 === 2) S.clap(dest, t, .3);
        if (n % 2 === 0) S.thud(dest, t + b * .75, 220, 160, .15, .3, .3);
        break;
      }
      case "funk": {
        if (n % 4 === 0 || n % 8 === 3) S.kick(dest, t, .8);
        if (n % 4 === 2) S.snare(dest, t, .5);
        S.hat(dest, t, .18); S.hat(dest, t + b / 2, .14);
        [0, .5, .75].forEach((o, k) => S.note(dest, t + o * b, "bass_guitar", 69 + 12 * Math.log2(root * (k === 2 ? 1.5 : 1) * 2 / 440), b * .3, .4));   // a slap of real-sounding bass
        break;
      }
      case "drumline": {
        if (n % 2 === 0) S.kick(dest, t, .8);
        const roll = n % 4 === 3 ? 6 : 2;
        for (let k = 0; k < roll; k++) S.snare(dest, t + k * b / roll, k === 0 ? .5 : .25);
        break;
      }
    }
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
