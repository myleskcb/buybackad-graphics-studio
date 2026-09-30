#!/usr/bin/env node
/* THE SOUND OF THE VIDEO ADS, CHECKED IN A BROWSER (motion/audio.js,
   motion/voices.js).

   0. Every look has sound: N random looks (120 by default) each render a
      soundtrack, and it opens on a hit (the first 0.15 s above -30 dB, the
      attention audit's measure). Before 2026-09-30 a cue timed before the
      first frame threw inside the mix and 38% of looks rendered no sound at
      all; the audit hid it by skipping its sound check when the mix failed.

   1. The maker: the page opens without an error, the Audience and voice
      controls are there, and picking each audience by hand gives an ad in
      that audience's looks, music, words and voice.
   2. The mix: a take laid over four different music kits, rendered as stems
      (voice alone, bed alone) and whole, and measured:
        starts     the first word at 0.3 s, after the opening hit
        ends       the last word at least 0.5 s before the end
        margin     the voice at least 4.5 dB over the bed under it (RMS over
                   the whole line, pauses included; on the words alone it is
                   about 3 dB more)
        duck       the bed under the voice at least 6 dB down
        release    the bed back to its own level within 1 dB after the voice
        peak       the whole mix never above -0.9 dBFS
        trim       a voiced mix no more than 1 dB quieter than the same mix
                   without a voice, around the voice
        fit        a take longer than the ad's window is never picked for it
   With a recorded bank (motion/voice/manifest.json) the check uses a real
   take; without one it uses a synthetic take (a 150 Hz voice in syllables
   between two stretches of room noise), served to the page from memory.

   usage: npx http-server -p 8899 -s .   (or python3 -m http.server 8899)
          CHROME=/path/to/chrome node scripts/motion_sound_check.mjs [--looks N]
   exits non-zero on any failure */
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://127.0.0.1:8899/';
const bank = JSON.parse(readFileSync(new URL('../motion/voice/manifest.json', import.meta.url), 'utf8'));
const real = bank.clips.find(c => c.audience === 'seniors' && c.lang === 'en' && c.secs < 4) || bank.clips.find(c => c.secs < 4);

function synthTake() {
  const sr = 44100, n = Math.round(3.0 * sr), x = new Float32Array(n);
  let s = 7;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  for (let i = 0; i < n; i++) x[i] = (rnd() * 2 - 1) * .0008;             // room noise, about -62 dB
  const end = 2.6 * sr;
  for (let t = .4 * sr; t < end - .1 * sr;) {
    const len = Math.round((.12 + rnd() * .08) * sr), amp = .12 + rnd() * .25, f0 = 130 + rnd() * 50;
    for (let k = 0; k < len && t + k < end; k++) {
      const env = Math.sin(Math.PI * k / len) ** .6, ph = 2 * Math.PI * f0 * k / sr;
      let v = 0;
      for (let h = 1; h <= 30; h++) {
        const f = h * f0, w = Math.exp(-(((f - 700) / 400) ** 2)) + .6 * Math.exp(-(((f - 1800) / 500) ** 2)) + .3 * Math.exp(-(((f - 2800) / 600) ** 2)) + .05;
        v += w * Math.sin(h * ph) / h ** .3;
      }
      x[t + k] += amp * env * v / 6;
    }
    t += len + Math.round((.04 + rnd() * .06) * sr);
  }
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12); buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(x[i] * 32767))), 44 + i * 2);
  return buf;
}

const argv = process.argv.slice(2), LOOKS = +(argv[argv.indexOf('--looks') + 1] || 0) || 120;
const failures = [];
const expect = (ok, what) => { if (!ok) failures.push(what); };
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'], protocolTimeout: 0 });

// 0. every look has sound
{
  const p = await browser.newPage(), errors = [];
  p.on('pageerror', e => errors.push(String(e).slice(0, 300)));
  await p.goto(BASE + 'motion/audit-sweep.html', { waitUntil: 'load', timeout: 120000 });
  await p.waitForFunction(() => window.ready === true, { timeout: 120000 });
  const res = await p.evaluate(async n => {
    const E = await import('./engine.js'), A = await import('./audio.js'), C = await import('./catalog.js');
    const a = await E.loadPhones('./phones/'), idx = {}; a.index.forEach(m => { idx[m.id] = m; });
    const bad = [], hooks = {};
    for (let k = 0; k < n; k++) {
      const st = E.harmonise(E.randomize({ ...C.DEFAULT_STYLE, number: '(323) 555-0199' }, 9000 + k, new Set(), a.index.map(m => m.id), true), new Set(), idx);
      hooks[st.hook] = (hooks[st.hook] || 0) + 1;
      try {
        const buf = await A.renderSoundtrack(new E.Ad(st, { phones: a.phones }, 160, 160));
        const d = buf.getChannelData(0), n0 = Math.round(buf.sampleRate * .15);
        let s = 0; for (let i = 0; i < n0; i++) s += d[i] * d[i];
        const db = 20 * Math.log10(Math.sqrt(s / n0) + 1e-9);
        if (!(db > -30)) bad.push(`look ${9000 + k} (${st.hook}) opens at ${db.toFixed(0)} dB`);
      } catch (e) { bad.push(`look ${9000 + k} (${st.hook}) has no sound: ${String(e.message).slice(0, 90)}`); }
    }
    return { bad, hooks };
  }, LOOKS);
  console.log(`  ${LOOKS} looks: ${LOOKS - res.bad.length} with sound that opens on a hit (${Object.entries(res.hooks).map(([h, c]) => h + ' ' + c).join(', ')})`);
  res.bad.forEach(b => expect(false, b));
  expect(!errors.length, `the sweep page logged errors: ${errors.join(' | ')}`);
  await p.close();
}

// 1. the maker
{
  const p = await browser.newPage(), errors = [];
  p.on('pageerror', e => errors.push(String(e).slice(0, 300)));
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  await p.goto(BASE + 'motion/index.html', { waitUntil: 'load', timeout: 120000 });
  await p.waitForFunction(() => document.querySelector('#loading') && document.querySelector('#loading').hidden, { timeout: 120000 });
  const groups = await p.$$eval('#design summary', s => s.map(x => x.textContent));
  expect(groups[0] === 'Audience and voice', `the first panel group is "${groups[0]}", not Audience and voice`);
  const { AUDIENCES } = await import('../motion/audiences.js'), { VIBES } = await import('../motion/catalog.js');
  for (const [key, a] of Object.entries(AUDIENCES)) {
    await p.select('select[data-key=audience]', key);
    await p.waitForFunction(k => document.querySelector('select[data-key=audience]').value === k && document.querySelector('#vo-line').textContent.length > 10, { timeout: 30000 }, key);
    await new Promise(r => setTimeout(r, 400));
    const got = await p.evaluate(() => ({ vibe: document.querySelector('select[data-key=vibe]').value, kit: document.querySelector('select[data-key=sound_kit]').value,
      mood: document.querySelector('select[data-key=voice_mood]').value, cast: document.querySelector('select[data-key=voice_cast]').value,
      headline: document.querySelector('#f-headline').value, vo: document.querySelector('#vo-line q') ? document.querySelector('#vo-line q').textContent : '' }));
    const lines = Object.values(a.copy).flatMap(c => c.headlines);
    expect(a.looks.vibes.includes(got.vibe), `${key}: vibe ${got.vibe} is not one of its looks`);
    expect(a.looks.sound_kit.includes(got.kit), `${key}: music ${got.kit} is not one of its kits`);
    expect(a.moods.includes(got.mood) && a.casts.includes(got.cast), `${key}: voice ${got.cast}/${got.mood} is not one of its casts and moods`);
    expect(Object.values(a.vo).flat().includes(got.vo), `${key}: the voice line "${got.vo}" is not one of its scripts`);
    const own = Object.values((VIBES[got.vibe] || {}).copy || {}).flatMap(c => c.headlines || []).flatMap(h => [h.replace('{AREA}', 'LA'), h.replace('{AREA}', 'L.A.')]);
    expect([...lines, ...own].includes(got.headline), `${key}: the headline "${got.headline}" is neither its own nor its look's`);
    console.log(`  ${key.padEnd(17)} ${got.vibe.padEnd(16)} ${got.kit.padEnd(9)} ${(got.cast + '/' + got.mood).padEnd(24)} ${got.headline}`);
  }
  expect(!errors.length, `the maker logged errors: ${errors.join(' | ')}`);
  await p.close();
}

// 2. the mix
{
  const p = await browser.newPage(), errors = [];
  p.on('pageerror', e => errors.push(String(e).slice(0, 300)));
  const take = real ? { ...real } : { id: 'seniors-en-9-elder_m-calm', audience: 'seniors', lang: 'en', i: 9, text: 'synthetic', cast: 'elder_m', mood: 'calm', secs: 2.3, file: '_check/synth.wav' };
  if (!real) {
    const wav = synthTake();
    await p.setRequestInterception(true);
    p.on('request', r => r.url().endsWith('/motion/voice/_check/synth.wav') ? r.respond({ status: 200, contentType: 'audio/wav', body: wav }) : r.continue());
  }
  await p.goto(BASE + 'motion/audit-sweep.html', { waitUntil: 'load', timeout: 120000 });
  await p.waitForFunction(() => window.ready === true, { timeout: 120000 });
  const res = await p.evaluate(async take => {
    const E = await import('./engine.js'), A = await import('./audio.js'), V = await import('./voices.js'), C = await import('./catalog.js');
    V.setVoiceBank({ clips: [take] });
    const a = await E.loadPhones('./phones/'), idx = {}; a.index.forEach(m => { idx[m.id] = m; });
    const sr = 44100, out = {};
    const rms = (b, t0, t1) => { let s = 0, n = 0; for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = Math.round(t0 * sr); i < Math.round(t1 * sr); i++) { s += d[i] * d[i]; n++; } } return 20 * Math.log10(Math.sqrt(s / n) + 1e-9); };
    const peak = b => { let m = 0; for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < d.length; i++) m = Math.max(m, Math.abs(d[i])); } return 20 * Math.log10(m); };
    const edges = b => { const d = b.getChannelData(0), w = 441, g = 10 ** (-45 / 20); let f = -1, l = -1; for (let i = 0; i < d.length; i += w) { let s = 0; for (let j = 0; j < w && i + j < d.length; j++) s += d[i + j] ** 2; if (Math.sqrt(s / w) > g) { if (f < 0) f = i; l = i + w; } } return [f / sr, l / sr]; };
    for (const kit of ['house', 'trap', 'minimal', 'drumline']) {
      const st = E.harmonise({ ...E.randomize({ ...C.DEFAULT_STYLE, number: '(323) 555-0199' }, 77, new Set(), a.index.map(m => m.id), true),
        audience: take.audience, lang: take.lang, lang_mode: take.lang, sound_kit: kit, duration: 6, voice: 'on', vo_clip: '' }, new Set(['voice_cast', 'voice_mood']), idx);
      const ad = new E.Ad(st, { phones: a.phones }, 320, 320), quiet = new E.Ad({ ...st, voice: 'off' }, { phones: a.phones }, 320, 320);
      const voice = await A.renderSoundtrack(ad, { solo: 'voice' }), bed = await A.renderSoundtrack(ad, { solo: 'bed' }), full = await A.renderSoundtrack(ad);
      const bedOff = await A.renderSoundtrack(quiet, { solo: 'bed' }), fullOff = await A.renderSoundtrack(quiet);
      const [v0, v1] = edges(voice), after = [v1 + .3, Math.min(v1 + 1.3, st.duration - .7)];
      out[kit] = { picked: st.vo_clip, starts: v0, ends: v1, duration: st.duration,
        margin: rms(voice, v0, v1) - rms(bed, v0 + .1, v1 - .1), duck: rms(bed, v0 + .1, v1 - .1) - rms(bedOff, v0 + .1, v1 - .1),
        release: rms(bed, ...after) - rms(bedOff, ...after), peak: peak(full), trim: rms(full, ...after) - rms(fullOff, ...after) };
    }
    V.setVoiceBank({ clips: [{ ...take, id: 'long', secs: 4.6 }] });
    out.fit5 = E.harmonise({ ...C.DEFAULT_STYLE, audience: take.audience, lang: take.lang, duration: 5, seed: 3 }, new Set(), idx).vo_clip;
    out.fit8 = E.harmonise({ ...C.DEFAULT_STYLE, audience: take.audience, lang: take.lang, duration: 8, seed: 3 }, new Set(), idx).vo_clip;
    return out;
  }, take);
  console.log(`  take: ${real ? real.file + ' (' + real.voice + ')' : 'synthetic'}`);
  for (const [kit, m] of Object.entries(res)) {
    if (typeof m !== 'object' || !m) continue;
    console.log(`  ${kit.padEnd(9)} starts ${m.starts.toFixed(2)} s  ends ${m.ends.toFixed(2)} s  margin ${m.margin.toFixed(1)} dB  duck ${m.duck.toFixed(1)} dB  release ${m.release.toFixed(1)} dB  peak ${m.peak.toFixed(2)} dBFS  trim ${m.trim.toFixed(2)} dB`);
    expect(m.picked === take.id, `${kit}: the take was not picked (${m.picked})`);
    expect(m.starts >= .28 && m.starts <= .45, `${kit}: the voice starts at ${m.starts.toFixed(2)} s`);
    expect(m.ends <= m.duration - .5, `${kit}: the voice ends at ${m.ends.toFixed(2)} s, inside the last half second`);
    expect(m.margin >= 4.5, `${kit}: the voice is only ${m.margin.toFixed(1)} dB over the bed`);
    expect(m.duck <= -6, `${kit}: the bed ducks only ${m.duck.toFixed(1)} dB`);
    expect(Math.abs(m.release) <= 1, `${kit}: the bed comes back ${m.release.toFixed(1)} dB off its level`);
    expect(m.peak <= -.9, `${kit}: the mix peaks at ${m.peak.toFixed(2)} dBFS`);
    expect(m.trim >= -1, `${kit}: the voiced mix is ${(-m.trim).toFixed(1)} dB quieter around the voice`);
  }
  expect(res.fit5 === '', `a 4.6 s take was picked for a 5-second ad`);
  expect(res.fit8 === 'long', `a 4.6 s take was not picked for an 8-second ad`);
  expect(!errors.length, `the mix page logged errors: ${errors.join(' | ')}`);
}
await browser.close();
if (failures.length) { console.log(failures.map(f => '  FAIL ' + f).join('\n')); process.exit(1); }
console.log('all clear');
