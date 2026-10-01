// Phone Ad Maker sound: every cue is synthesised here, so nothing is fetched or licensed.
// Rendered offline with the Web Audio graph, then played with the preview or
// encoded into the video.

import { rng, clamp } from "./engine.js";
import { clipById, VO_START, voWindow } from "./voices.js";

const SR = 44100;

/** solo: "voice" or "bed" renders one stem alone, for measuring the mix. */
export async function renderSoundtrack(ad, { solo = "" } = {}) {
  const st = ad.st, tl = ad.tl;
  const len = Math.ceil(st.duration * SR);
  const ctx = new OfflineAudioContext(2, len, SR);
  const master = ctx.createGain(); master.gain.value = .9;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.knee.value = 8; comp.ratio.value = 6; comp.attack.value = .003; comp.release.value = .12;
  // the voice joins after the master compressor, whose automatic make-up gain would lift the bed back up under it
  const bedOut = ctx.createGain(); bedOut.gain.value = 1;
  master.connect(comp).connect(bedOut).connect(ctx.destination);
  const bed = ctx.createGain(); bed.gain.value = solo === "voice" ? 0 : 1; bed.connect(master);
  const voBus = ctx.createGain(); voBus.gain.value = solo === "bed" ? 0 : 1; voBus.connect(ctx.destination);
  const sfx = ctx.createGain(); sfx.gain.value = 1; sfx.connect(bed);
  const music = ctx.createGain(); music.gain.value = st.music_volume ?? .5; music.connect(bed);
  const noise = noiseBuffer(ctx, 2);
  const r = rng(st.seed * 17 + 3);
  const S = synth(ctx, noise);

  for (const p of ad.phones) {
    const pan = clamp((p.home[0] / ad.W) * 2 - 1, -1, 1) * .7, fl = p.tLand - p.tIn;
    if (["zoom", "pop"].includes(st.entry)) S.whoosh(sfx, p.tIn, fl, true, pan, .5);
    else if (st.entry === "deal") { S.tap(sfx, p.tIn, pan, .4); S.whoosh(sfx, p.tIn, fl, false, pan, .35); }
    else S.whoosh(sfx, p.tIn, fl + .05, false, pan, .55);
    S.thud(sfx, p.tLand - .01, 70, 42, .35, pan, .8);
    if (["drop", "rain"].includes(st.entry)) S.thud(sfx, p.tIn + fl * .73, 90, 60, .25, pan, .4);
    if (p.reveal) { S.whoosh(sfx, p.tReveal, .45, true, pan, .25); S.tap(sfx, p.tReveal + .48, pan, .6); }
  }
  const hit = tl.hit;
  // Nothing opens on silence: the first frame lands on a hit that matches the hook.
  switch (st.hook) {
    case "hook_line": S.bassDrop(sfx, 0, .75); S.impact(sfx, 0, .8); S.whoosh(sfx, .8, .3, true, 0, .4); break;
    case "word_beat":                                // one hit per word, like a drum roll that spells the question
      S.impact(sfx, 0, .75);
      (ad.hookLines || []).forEach((_, i) => { const tt = i * (ad.hookBeat || .2); S.kick(sfx, tt, .8); S.clap(sfx, tt, i % 2 ? .45 : .3); });
      S.whoosh(sfx, ad.hookEnd - .12, .3, true, 0, .4); break;
    case "flash_cut":                                // one hit per flash; the phones all but down when the ad opens share the first frame's
      [...new Set(ad.phones.map(p => Math.max(0, Math.round((p.tFlash ?? p.tIn) * 100) / 100)))].forEach(t => S.impact(sfx, t, .6)); break;
    case "crash_zoom": S.whoosh(sfx, 0, .6, false, 0, .7); ad.phones.filter(p => p.crash).forEach(p => S.impact(sfx, p.tLand, .8)); break;
    case "punch_in": S.impact(sfx, 0, .85); S.whoosh(sfx, 0, .5, false, 0, .5); break;
    case "cold_open": S.impact(sfx, 0, .6); break;
  }
  switch (st.hit) {
    case "riser": S.riser(sfx, hit - .8, .8, .55); S.impact(sfx, hit, .9); break;
    case "glitch": S.whoosh(sfx, tl.text - .45, .55, true, -.6, .5); S.glitch(sfx, hit - .05, r, .6); S.impact(sfx, hit, .8); break;
    case "cymbal": S.cymbal(sfx, hit - .9, 1.0, .5); S.impact(sfx, hit, .85); break;
    case "bass_drop": S.whoosh(sfx, tl.text - .45, .55, true, -.6, .45); S.bassDrop(sfx, hit, .9); break;
    case "clap_stack": S.whoosh(sfx, tl.text - .45, .55, true, -.6, .45); [0, .06, .12].forEach(o => S.clap(sfx, hit + o, .5)); S.impact(sfx, hit, .6); break;
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
    const b = 60 / (st.bpm || 118), start = st.hook && st.hook !== "none" ? hit - Math.ceil(hit / b) * b : hit;
    beat(S, music, st.sound_kit, start, st.duration, st.bpm || 118, r);
  }
  // the voiceover, cleaned, over a bed that ducks under it
  const take = st.voice !== "off" && st.vo_clip ? clipById(st.vo_clip) : null;
  let spoke = false;
  if (take) {
    try {
      const clean = await cleanVoice(ctx, await voiceBuffer(ctx, take.file));
      if (clean && clean.duration <= voWindow(st.duration) + .05) { voiceOver(ctx, clean, voBus, music, bedOut, st.music_volume ?? .5); spoke = true; }
    } catch (e) { console.warn("voice", take.file, e); }
  }
  // fade the whole mix out at the end
  master.gain.setValueAtTime(.9, Math.max(0, st.duration - .6));
  master.gain.linearRampToValueAtTime(0, st.duration);
  const out = await ctx.startRendering();
  if (spoke) keepUnder(out, PEAK);
  return out;
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
// about 6 dB over the bed under it, the music under the voice drops further
// than the effects, and a voiced mix stays within 1 dB of the same mix without it.
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

/** The cleaned take over the mix, after the master compressor. Under it the
 *  music drops 7 dB and then the whole bed another 9, ramping down 80 ms
 *  before the first word and back up over 150 ms after the last. */
function voiceOver(ctx, buf, dest, music, bedOut, musicLevel) {
  const t0 = VO_START, t1 = t0 + buf.duration;
  const src = ctx.createBufferSource(); src.buffer = buf; src.connect(dest);
  src.start(t0);
  const duck = (param, base, k) => {
    param.setValueAtTime(base, Math.max(0, t0 - .08));
    param.linearRampToValueAtTime(base * k, t0);
    param.setValueAtTime(base * k, t1);
    param.linearRampToValueAtTime(base, t1 + .15);
  };
  duck(music.gain, musicLevel, MUSIC_UNDER);
  duck(bedOut.gain, 1, BED_UNDER);
}

function noiseBuffer(ctx, secs) {
  const b = ctx.createBuffer(1, secs * SR, SR), d = b.getChannelData(0);
  let s = 12345;
  for (let i = 0; i < d.length; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; d[i] = s / 0x3fffffff - 1; }
  return b;
}

function synth(ctx, noise) {
  const env = (g, t, a, peak, decay) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0005, t + a + decay); };
  const out = (node, dest, pan = 0) => { if (pan) { const p = ctx.createStereoPanner(); p.pan.value = pan; node.connect(p).connect(dest); } else node.connect(dest); };
  const noiseSrc = (t, dur) => { const n = ctx.createBufferSource(); n.buffer = noise; n.loop = true; n.start(Math.max(0, t), Math.random() * 1.5); n.stop(t + dur + .05); return n; };
  const osc = (type, t, dur, f) => { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, Math.max(0, t)); o.start(Math.max(0, t)); o.stop(t + dur + .05); return o; };
  const S = {
    whoosh(dest, t, dur, up, pan, gain) {
      if (t + dur < 0) return;
      const n = noiseSrc(t, dur), bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.4;
      const f0 = up ? 400 : 3600, f1 = up ? 4200 : 500;
      bp.frequency.setValueAtTime(f0, Math.max(0, t)); bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const g = ctx.createGain(); g.gain.setValueAtTime(0, Math.max(0, t)); g.gain.linearRampToValueAtTime(gain, t + dur * (up ? .8 : .45)); g.gain.linearRampToValueAtTime(0, t + dur);
      n.connect(bp).connect(g); out(g, dest, pan);
    },
    thud(dest, t, f0, f1, dur, pan, gain) {
      const o = osc("sine", t, dur, f0); o.frequency.exponentialRampToValueAtTime(f1, t + dur * .6);
      const g = ctx.createGain(); env(g, t, .004, gain, dur); o.connect(g); out(g, dest, pan);
      const n = noiseSrc(t, .03), lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2500;
      const gn = ctx.createGain(); env(gn, t, .001, gain * .35, .02); n.connect(lp).connect(gn); out(gn, dest, pan);
    },
    tap(dest, t, pan, gain) {
      const o = osc("sine", t, .12, 180); const g = ctx.createGain(); env(g, t, .002, gain, .1); o.connect(g); out(g, dest, pan);
      const n = noiseSrc(t, .02), g2 = ctx.createGain(); env(g2, t, .001, gain * .4, .015); n.connect(g2); out(g2, dest, pan);
    },
    impact(dest, t, gain) {
      const o = osc("sine", t, 1, 98); o.frequency.exponentialRampToValueAtTime(38, t + .5);
      const g = ctx.createGain(); env(g, t, .005, gain, .9); o.connect(g).connect(dest);
      const n = noiseSrc(t, .3), bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2500; bp.Q.value = .6;
      const gn = ctx.createGain(); env(gn, t, .002, gain * .7, .25); n.connect(bp).connect(gn).connect(dest);
    },
    bassDrop(dest, t, gain) {
      const o = osc("sine", t, 1.4, 140); o.frequency.exponentialRampToValueAtTime(34, t + 1.1);
      const ws = ctx.createWaveShaper(); ws.curve = curve(2.5);
      const g = ctx.createGain(); env(g, t, .01, gain, 1.3); o.connect(ws).connect(g).connect(dest);
    },
    pop(dest, t, gain) {
      const o = osc("sine", t, .35, 660); o.frequency.exponentialRampToValueAtTime(1160, t + .08);
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
    kick(dest, t, gain) {
      const o = osc("sine", t, .45, 130); o.frequency.exponentialRampToValueAtTime(44, t + .12);
      const g = ctx.createGain(); env(g, t, .002, gain, .4); o.connect(g).connect(dest);
    },
    bass808(dest, t, f, dur, gain) {
      const o = osc("sine", t, dur, f * 2.2); o.frequency.exponentialRampToValueAtTime(f, t + .05);
      const ws = ctx.createWaveShaper(); ws.curve = curve(2.2);
      const g = ctx.createGain(); env(g, t, .004, gain, dur); o.connect(ws).connect(g).connect(dest);
    },
    pluck(dest, t, f, dur, gain, type = "triangle", cutoff = 1800) {
      const o = osc(type, t, dur, f), lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(cutoff, t); lp.frequency.exponentialRampToValueAtTime(200, t + dur);
      const g = ctx.createGain(); env(g, t, .005, gain, dur); o.connect(lp).connect(g).connect(dest);
    },
    riser(dest, t, dur, gain) {
      if (t < 0) { dur += t; t = 0; }
      const n = noiseSrc(t, dur), bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 2;
      bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(5300, t + dur);
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + .02);
      n.connect(bp).connect(g).connect(dest);
      const o = osc("sawtooth", t, dur, 200); o.frequency.exponentialRampToValueAtTime(1100, t + dur);
      const go = ctx.createGain(); go.gain.setValueAtTime(0, t); go.gain.linearRampToValueAtTime(gain * .12, t + dur); go.gain.linearRampToValueAtTime(0, t + dur + .02); o.connect(go).connect(dest);
    },
    cymbal(dest, t, dur, gain) {
      if (t < 0) { dur += t; t = 0; }
      const n = noiseSrc(t, dur), hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 5000;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.exponentialRampToValueAtTime(gain, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + .02);
      n.connect(hp).connect(g).connect(dest);
    },
    glitch(dest, t, r, gain) {
      let p = t;
      while (p < t + .35) {
        const L = r.uniform(.012, .04), o = osc(r() < .5 ? "square" : "sawtooth", p, L, r.pick([220, 440, 880, 1320, 60]));
        const g = ctx.createGain(); g.gain.setValueAtTime(gain * .5 * Math.exp(-(p - t) * 5), p); g.gain.setValueAtTime(0, p + L); o.connect(g).connect(dest);
        p += L + r.uniform(0, .01);
      }
    },
    register(dest, t, gain) {
      const n = noiseSrc(t, .1), g = ctx.createGain(); env(g, t, .001, gain * .6, .06); n.connect(g).connect(dest);
      S.thud(dest, t, 160, 120, .08, 0, gain * .5);
      [[2637, 1], [3951, .5], [5274, .25]].forEach(([f, a]) => { const o = osc("sine", t + .06, .9, f), gb = ctx.createGain(); env(gb, t + .06, .002, gain * .5 * a, .8); o.connect(gb).connect(dest); });
    },
    coin(dest, t, gain) {
      const o = osc("square", t, .5, 988); o.frequency.setValueAtTime(1319, t + .08);
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 4000;
      const g = ctx.createGain(); env(g, t, .002, gain * .35, .45); o.connect(lp).connect(g).connect(dest);
    },
    chime(dest, t, gain) {
      [1047, 1319, 1568, 2093].forEach((f, i) => { const o = osc("sine", t + i * .07, 1.2, f), g = ctx.createGain(); env(g, t + i * .07, .003, gain * .3, 1.1); o.connect(g).connect(dest); });
    },
    tick(dest, t, gain) {
      const o = osc("sine", t, .04, 2400), g = ctx.createGain(); env(g, t, .001, gain, .03); o.connect(g).connect(dest);
    },
  };
  // A cue timed before the first frame (a phone already in place when the ad opens, a cut before it) happened
  // before the ad: a hit there is dropped, and a sweep that builds to a moment after it is heard from the first
  // frame. Web Audio cannot schedule in the past, and one such call used to throw and leave the whole ad silent
  // (38% of looks on 2026-09-30: every flash cut, most cold opens and punch-ins).
  const BUILDS = new Set(["whoosh", "riser", "cymbal"]);
  for (const [k, f] of Object.entries(S)) {
    S[k] = (dest, t, ...rest) => {
      if (!(t < 0)) return f(dest, t, ...rest);
      if (!BUILDS.has(k)) return;
      const left = t + rest[0];
      if (left >= .05) f(dest, 0, left, ...rest.slice(1));
    };
  }
  return S;
}

function curve(k) {
  const n = 1024, c = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(x * k); }
  return c;
}

/** A short bed under the ad. Each kit is its own groove, not a remix of one. */
function beat(S, dest, kit, start, total, bpm, r) {
  const b = 60 / bpm;
  const roots = { house: [55, 55, 65.41, 49], trap: [45, 45, 53.4, 40], lofi: [110, 98, 87.3, 98], edm: [55, 49, 43.65, 49],
    funk: [41.2, 41.2, 49, 55], afrobeat: [55, 61.7, 49, 55], boombap: [49, 49, 55, 43.65], minimal: [55, 55, 55, 55], drumline: [55, 55, 55, 55] }[kit] || [55, 55, 55, 55];
  let n = 0;
  for (let t = start; t < total; t += b, n++) {
    if (t < -1e-6) continue;
    const root = roots[Math.floor(n / 8) % 4];
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
        if (n % 4 === 0) [1, 1.26, 1.5, 1.89].forEach(k => S.pluck(dest, t, root * 2 * k, b * 3.8, .08, "triangle", 1200));
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
        [0, .5, .75].forEach((o, k) => S.pluck(dest, t + o * b, root * (k === 2 ? 1.5 : 1) * 2, b * .3, .35, "sawtooth", 900));
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
