#!/usr/bin/env node
/* THE MUSIC OF THE VIDEO ADS, CHECKED IN A BROWSER: real recordings, the user's own
   track, holiday ads, and the grooves, leads and mix tones offered by hand
   (motion/audio.js, motion/music.js, motion/tracks.js, motion/catalog.js).

   Every soundtrack below must render without throwing, have sound (over -40 LUFS) and
   peak under -1 dBFS; one with music must be levelled to -16 LUFS within 1 dB.

   1. Every real recording (tracks.js) plays in place of the music made here: the
      soundtrack after the hit differs from the same look's with no recording. One
      whose file will not load (answered 404 here) leaves the music made here: the
      soundtrack is the same look's with no recording (no sample more than 1e-3, -60
      dBFS, apart: two renders of one look differ by about 4e-5 on their own).
   2. The user's own track (a nine-second stand-in made here) plays the same way; a
      look set to "upload" with nothing uploaded plays the music made here.
   3. Holidays: 600 ordinary shuffles never draw a holiday tune or sleigh bells and
      keep the holiday off; an ad set to Christmas or Halloween always plays one of
      that holiday's tunes, and both render.
   4. What is offered by hand: each groove added on 2026-10-02 and -03, a tune on
      each lead added then (and the warm synth lead), and each mix tone, render.
   5. 30 shuffled looks render (about two in three draw a recording).
   6. No sad music, and confetti is heard (owner, 2026-10-11: a confetti ad played the
      Moonlight Sonata, with a pop over its number that sounded like a voice memo starting):
      1000 shuffles never play a retired piece (catalog.js SOUND_ALIASES, track and melody)
      and every one with falling confetti plays the party popper, none without it; a look
      saved with a retired piece plays its stand-in; the maker offers none of them; and a
      confetti look renders with the celebration heard over the music (its soundtrack from
      the number on at least 25% unlike the same look's with the plain pop; 39% when the
      crowd's claps went in, 2026-10-11, 17% for the popper and bells alone).

   usage: npx http-server -p 8899 -s .   (or python3 -m http.server 8899)
          CHROME=/path/to/chrome node scripts/motion_music_check.mjs
   exits non-zero on any failure */
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://127.0.0.1:8899/';
const MISSING = 'eagle_eyes';                      // the recording answered 404 in part 1
const failures = [];
const expect = (ok, what) => { if (!ok) failures.push(what); };
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'], protocolTimeout: 0 });

/** Runs fn in the sweep page, with helpers: look(seed, over, lock) draws and harmonises a look,
 *  sound(st, assets) renders it and measures it. */
async function inPage(fn, arg, { block = null } = {}) {
  const p = await browser.newPage(), errors = [];
  p.on('pageerror', e => errors.push(String(e).slice(0, 300)));
  if (block) {
    await p.setRequestInterception(true);
    p.on('request', r => r.url().includes(block) ? r.respond({ status: 404, body: 'not here' }) : r.continue());
  }
  await p.goto(BASE + 'motion/audit-sweep.html', { waitUntil: 'load', timeout: 120000 });
  await p.waitForFunction(() => window.ready === true, { timeout: 120000 });
  await p.evaluate(async () => {
    const E = await import('./engine.js'), A = await import('./audio.js'), C = await import('./catalog.js');
    const ph = await E.loadPhones('./phones/'), idx = {}; ph.index.forEach(m => { idx[m.id] = m; });
    const pool = ph.index.map(m => m.id);
    const look = (seed, over = {}, lock = []) => E.harmonise({ ...E.randomize({ ...C.DEFAULT_STYLE, number: '(323) 555-0199', ...over }, seed, new Set(lock), pool, true), ...over }, new Set(lock), idx);
    const sound = async (st, assets = {}) => {
      const ad = new E.Ad(st, { phones: ph.phones, ...assets }, 160, 160);
      try {
        const buf = await A.renderSoundtrack(ad);
        let pk = 0; for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) pk = Math.max(pk, Math.abs(d[i])); }
        return { buf, hit: ad.tl.hit, number: ad.tl.number, lufs: A.loudness(buf), peak: 20 * Math.log10(pk + 1e-12) };
      } catch (e) { return { error: String(e && e.message || e).slice(0, 200) }; }
    };
    // how different two soundtracks are after the hit: the RMS of their difference against the first's
    const apart = (x, y, t0) => {
      let d = 0, s = 0;
      for (let c = 0; c < 2; c++) { const a = x.getChannelData(c), b = y.getChannelData(c); for (let i = Math.round(t0 * 44100); i < a.length; i++) { d += (a[i] - b[i]) ** 2; s += a[i] ** 2; } }
      return Math.sqrt(d / (s + 1e-12));
    };
    const same = (x, y) => { let m = 0; for (let c = 0; c < 2; c++) { const a = x.getChannelData(c), b = y.getChannelData(c); for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i] - b[i])); } return m; };
    window.__mc = { E, A, C, look, sound, apart, same };
  });
  const res = await p.evaluate(fn, arg);
  await p.close();
  return { res, errors };
}

/** The bar every soundtrack meets. music: it plays music, so it is levelled to -16 LUFS. */
function judge(name, m, music = true) {
  if (m.error) { expect(false, `${name}: the soundtrack threw: ${m.error}`); return `${name}: THREW`; }
  expect(m.lufs > -40, `${name}: silent (${m.lufs.toFixed(1)} LUFS)`);
  expect(m.peak <= -1, `${name}: peaks at ${m.peak.toFixed(2)} dBFS`);
  if (music) expect(Math.abs(m.lufs + 16) <= 1, `${name}: levelled to ${m.lufs.toFixed(2)} LUFS, not -16`);
  return `${name}: ${m.lufs.toFixed(2)} LUFS, peak ${m.peak.toFixed(2)} dBFS`;
}
const strip = m => m.error ? m : { lufs: m.lufs, peak: m.peak };

// 1. every real recording, and one that will not load
{
  const { res, errors } = await inPage(async () => {
    const { C, look, sound, apart } = window.__mc, out = [];
    for (const [i, t] of C.TRACKS.entries()) {
      if (C.SOUND_ALIASES.track[t.id]) continue;     // retired: part 6 hears its stand-in
      const over = { sound_kit: 'house', track: t.id }, st = look(700 + i, over, ['sound_kit', 'track']);
      const plain = await sound({ ...st, track: 'none' }), rec = await sound(st);
      out.push({ id: t.id, track: st.track, bpm: st.bpm, rec: rec.error ? rec : { lufs: rec.lufs, peak: rec.peak },
        apart: rec.buf && plain.buf ? apart(rec.buf, plain.buf, rec.hit + .1) : null });
    }
    return out;
  });
  console.log('1. real recordings in place of the music');
  for (const r of res) {
    console.log('  ' + judge(r.id.padEnd(20), r.rec) + (r.apart != null ? `, after the hit ${(r.apart * 100).toFixed(0)}% unlike the music made here` : '') + `, ${r.bpm} bpm`);
    expect(r.track === r.id, `${r.id}: the look holds ${r.track}`);
    expect(r.apart != null && r.apart > .3, `${r.id}: the recording did not play (the soundtrack is ${((r.apart || 0) * 100).toFixed(0)}% unlike the music made here)`);
  }
  expect(!errors.length, `the recordings page logged errors: ${errors.join(' | ')}`);
  const miss = await inPage(async id => {
    const { look, sound, same } = window.__mc, st = look(731, { sound_kit: 'house', track: id }, ['sound_kit', 'track']);
    const rec = await sound(st), plain = await sound({ ...st, track: 'none' });
    return { rec: rec.error ? rec : { lufs: rec.lufs, peak: rec.peak }, diff: rec.buf && plain.buf ? same(rec.buf, plain.buf) : null };
  }, MISSING, { block: `/motion/sounds/tracks/${MISSING}.mp3` });
  console.log('  ' + judge(`${MISSING} answered 404`, miss.res.rec) + `, the music made here to within ${(miss.res.diff || 0).toExponential(1)}`);
  expect(miss.res.diff != null && miss.res.diff < 1e-3, `a recording that will not load did not leave the music made here (largest difference ${miss.res.diff})`);
  expect(!miss.errors.length, `the 404 page logged errors: ${miss.errors.join(' | ')}`);
}

// 2. the user's own track
{
  const { res, errors } = await inPage(async () => {
    const { look, sound, apart, same } = window.__mc, sr = 48000, n = 9 * sr;
    // a stand-in for an upload: a chord on the beat at 96 bpm, stereo, at another sample rate
    const up = new AudioBuffer({ length: n, numberOfChannels: 2, sampleRate: sr });
    for (let c = 0; c < 2; c++) { const d = up.getChannelData(c); for (let i = 0; i < n; i++) { const t = i / sr, ph = (t * 1.6) % 1;
      d[i] = .25 * Math.exp(-ph * 4) * (Math.sin(2 * Math.PI * 220 * t) + Math.sin(2 * Math.PI * 277.2 * t) + .7 * Math.sin(2 * Math.PI * (c ? 330 : 329) * t)); } }
    const st = look(741, { sound_kit: 'uplift', track: 'upload' }, ['sound_kit', 'track']);
    const mine = await sound(st, { userTrack: up }), none = await sound(st), plain = await sound({ ...st, track: 'none' });
    return { mine: mine.error ? mine : { lufs: mine.lufs, peak: mine.peak }, none: none.error ? none : { lufs: none.lufs, peak: none.peak },
      apart: mine.buf && plain.buf ? apart(mine.buf, plain.buf, mine.hit + .1) : null, fallback: none.buf && plain.buf ? same(none.buf, plain.buf) : null };
  });
  console.log('2. the user\'s own track');
  console.log('  ' + judge('uploaded track        ', res.mine) + (res.apart != null ? `, after the hit ${(res.apart * 100).toFixed(0)}% unlike the music made here` : ''));
  console.log('  ' + judge('"upload", none given   ', res.none) + `, the music made here to within ${(res.fallback || 0).toExponential(1)}`);
  expect(res.apart != null && res.apart > .3, `the user's own track did not play`);
  expect(res.fallback != null && res.fallback < 1e-3, `"upload" with nothing uploaded did not play the music made here (largest difference ${res.fallback})`);
  expect(!errors.length, `the upload page logged errors: ${errors.join(' | ')}`);
}

// 3. holidays
{
  const { res, errors } = await inPage(async () => {
    const { C, E, look, sound } = window.__mc, any = Object.values(C.SEASON_TUNES).flat();
    const holidayTracks = Object.values(C.SEASON_TRACKS).flat();
    let leaks = [], kept = 0;
    for (let s = 1; s <= 600; s++) {
      const st = E.randomize({ ...C.DEFAULT_STYLE }, s, new Set(), [], true);
      if (any.includes(st.melody) || st.accent === 'sleigh_bells' || holidayTracks.includes(st.track)) leaks.push(`${s}: ${st.melody} ${st.accent} ${st.track}`);
      if (st.season === 'none') kept++;
    }
    const days = {};
    for (const season of ['christmas', 'halloween']) {
      const tunes = C.SEASON_TUNES[season], miss = [], drawn = {};
      for (let s = 1; s <= 100; s++) {
        const st = E.randomize({ ...C.DEFAULT_STYLE, season }, s, new Set(['season']), [], true);
        if (st.sound_kit !== 'none' && !tunes.includes(st.melody)) miss.push(`${s}: ${st.melody}/${st.track}`);
        drawn[st.melody] = (drawn[st.melody] || 0) + 1;
      }
      const st = look(751, { season, sound_kit: 'uplift' }, ['season', 'sound_kit']), m = await sound(st);
      days[season] = { miss, drawn, melody: st.melody, accent: st.accent, track: st.track, m: m.error ? m : { lufs: m.lufs, peak: m.peak } };
    }
    return { leaks, kept, days };
  });
  console.log('3. holidays');
  console.log(`  600 ordinary shuffles: ${res.leaks.length} drew a holiday tune, sound or recording; ${res.kept} kept the holiday off`);
  expect(!res.leaks.length, `ordinary shuffles drew holiday music: ${res.leaks.slice(0, 5).join('; ')}`);
  expect(res.kept === 600, `a shuffle set a holiday (${600 - res.kept} of 600)`);
  for (const [season, d] of Object.entries(res.days)) {
    console.log(`  ${season}: 100 shuffles, ${100 - d.miss.length} with music played one of its tunes (${Object.entries(d.drawn).map(([k, v]) => k + ' ' + v).join(', ')})`);
    console.log('  ' + judge(`${season} ad (${d.melody}, ${d.accent}, recording ${d.track})`, d.m));
    expect(!d.miss.length, `${season}: shuffles without its tune: ${d.miss.slice(0, 5).join('; ')}`);
  }
  expect(!errors.length, `the holiday page logged errors: ${errors.join(' | ')}`);
}

// 4. what is offered by hand: the new grooves, the new leads, the mix tones
{
  const { res, errors } = await inPage(async () => {
    const { C, look, sound } = window.__mc, out = [];
    const kits = ['pop', 'rnb', 'motown', 'gospel', 'classical', 'synthwave', 'gfunk', 'future_bass', 'deep_house', 'trance', 'nu_disco'];
    for (const [i, kit] of kits.entries()) {
      const st = look(800 + i, { sound_kit: kit, track: 'none' }, ['sound_kit', 'track']), m = await sound(st);
      out.push({ name: `groove ${kit} (${st.bpm} bpm, ${st.melody})`, m: m.error ? m : { lufs: m.lufs, peak: m.peak } });
    }
    const leads = ['synth', 'supersaw', 'synth_pluck', 'synth_brass', 'fm_bell', 'gfunk_lead', 'guitar', 'upright', 'clav', 'harmonica', 'strumstick', 'balafon', 'organ_b3', 'strings', 'acid'];
    for (const [i, lead] of leads.entries()) {
      const st = look(830 + i, { sound_kit: 'pop', melody: 'ode_to_joy', lead, track: 'none' }, ['sound_kit', 'melody', 'lead', 'track']), m = await sound(st);
      out.push({ name: `lead ${lead}`, m: m.error ? m : { lufs: m.lufs, peak: m.peak } });
    }
    for (const [i, tone] of C.OPTIONS.tone.entries()) {
      const st = look(860 + i, { tone, track: 'none', sound_kit: 'house' }, ['tone', 'track', 'sound_kit']), m = await sound(st);
      out.push({ name: `tone ${tone}`, m: m.error ? m : { lufs: m.lufs, peak: m.peak } });
    }
    return out;
  });
  console.log('4. offered by hand');
  for (const r of res) console.log('  ' + judge(r.name, r.m));
  expect(!errors.length, `the offered-by-hand page logged errors: ${errors.join(' | ')}`);
}

// 5. shuffled looks
{
  const { res, errors } = await inPage(async () => {
    const { look, sound } = window.__mc, out = [];
    for (let k = 0; k < 30; k++) {
      const st = look(5000 + k), m = await sound(st);
      out.push({ seed: 5000 + k, kit: st.sound_kit, track: st.track, tone: st.tone, music: st.sound_kit !== 'none' || st.track !== 'none', m: m.error ? m : { lufs: m.lufs, peak: m.peak } });
    }
    return out;
  });
  console.log('5. 30 shuffled looks');
  for (const r of res) console.log('  ' + judge(`${r.seed} ${r.kit.padEnd(11)} ${r.track.padEnd(20)} ${r.tone.padEnd(6)}`, r.m, r.music));
  console.log(`  ${res.filter(r => r.track !== 'none').length} of 30 play a real recording`);
  expect(!errors.length, `the shuffle page logged errors: ${errors.join(' | ')}`);
}

// 6. no sad music, and confetti is heard
{
  const { res, errors } = await inPage(async () => {
    const { C, look, sound, apart } = window.__mc, A = C.SOUND_ALIASES;
    const sad = [], stray = [];
    let confetti = 0, popper = 0;
    for (let s = 1; s <= 1000; s++) {
      const st = look(s);
      if (A.track[st.track] || A.melody[st.melody]) sad.push(`${s}: ${st.track}/${st.melody}`);
      if (st.overlay === 'confetti') { confetti++; if (st.number_sfx === 'confetti') popper++; }
      else if (st.number_sfx === 'confetti') stray.push(`${s}: ${st.overlay}`);
    }
    for (const t of C.CLASSICAL_TUNES) if (A.melody[t]) sad.push(`the classics played in place of a holiday tune: ${t}`);
    const saved = [];
    for (const k of ['track', 'melody']) for (const [from, to] of Object.entries(A[k])) {
      const st = look(910, { sound_kit: 'house', track: 'none', [k]: from }, ['sound_kit', 'track', k]);
      saved.push({ what: `${k} ${from}`, got: st[k], want: to });
    }
    const st = look(905, { overlay: 'confetti', sound_kit: 'uplift', track: 'none' }, ['overlay', 'sound_kit', 'track']);
    const pop = await sound(st), plain = await sound({ ...st, number_sfx: 'pop' });
    return { sad, stray, confetti, popper, saved, sfx: st.number_sfx, m: pop.error ? pop : { lufs: pop.lufs, peak: pop.peak },
      apart: pop.buf && plain.buf ? apart(pop.buf, plain.buf, pop.number) : null };
  });
  console.log('6. no sad music, and confetti is heard');
  console.log(`  1000 shuffles: ${res.sad.length} play a retired piece; ${res.popper} of ${res.confetti} with confetti play the popper, ${res.stray.length} without confetti do`);
  expect(!res.sad.length, `shuffles play a retired piece: ${res.sad.slice(0, 5).join('; ')}`);
  expect(res.confetti > 0 && res.popper === res.confetti, `${res.confetti - res.popper} of ${res.confetti} confetti looks do not play the popper`);
  expect(!res.stray.length, `the popper plays with no confetti: ${res.stray.slice(0, 5).join('; ')}`);
  for (const r of res.saved) {
    console.log(`  saved with ${r.what.padEnd(18)} plays ${r.got}`);
    expect(r.got === r.want, `a look saved with ${r.what} plays ${r.got}, not ${r.want}`);
  }
  console.log('  ' + judge(`confetti look (${res.sfx})`, res.m) + (res.apart != null ? `, from the number on ${(res.apart * 100).toFixed(0)}% unlike the plain pop` : ''));
  expect(res.sfx === 'confetti', `a look with confetti locked plays ${res.sfx}, not the popper`);
  expect(res.apart != null && res.apart > .25, `the popper is not heard over the number (${((res.apart || 0) * 100).toFixed(0)}% unlike the plain pop)`);
  expect(!errors.length, `the confetti page logged errors: ${errors.join(' | ')}`);
  // the maker offers no retired piece
  const p = await browser.newPage(), perr = [];
  p.on('pageerror', e => perr.push(String(e).slice(0, 300)));
  await p.goto(BASE + 'motion/index.html', { waitUntil: 'load', timeout: 120000 });
  await p.waitForFunction(() => document.querySelector('#loading') && document.querySelector('#loading').hidden, { timeout: 120000 });
  const offered = await p.evaluate(() => Object.fromEntries(['track', 'melody', 'number_sfx'].map(k => [k, [...document.querySelectorAll(`select[data-key=${k}] option`)].map(o => o.value)])));
  await p.close();
  const { SOUND_ALIASES } = await import('../motion/catalog.js');
  const shown = ['track', 'melody'].flatMap(k => offered[k].filter(v => SOUND_ALIASES[k][v]).map(v => `${k} ${v}`));
  console.log(`  the maker offers ${offered.track.length} recordings and ${offered.melody.length} tunes, ${shown.length} of them retired; the popper ${offered.number_sfx.includes('confetti') ? 'is' : 'is not'} a number sound`);
  expect(!shown.length, `the maker offers retired pieces: ${shown.join(', ')}`);
  expect(offered.number_sfx.includes('confetti'), 'the maker does not offer the party popper');
  expect(!perr.length, `the maker logged errors: ${perr.join(' | ')}`);
}

await browser.close();
if (failures.length) { console.log(failures.map(f => '  FAIL ' + f).join('\n')); process.exit(1); }
console.log('all clear');
