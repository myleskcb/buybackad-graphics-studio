/* The moving grounds (DESIGN-LAW 175, motion/clips.js): the video maker's full ad on a clip that plays
   under its words. What this holds:

   1. Who draws a clip. Seeds draw one only for the video maker (fullStyle's opts.moving), never under dark
      words, never a clip of somewhere else (the two Los Angeles ones for Los Angeles alone), the gold bars
      for gold alone, and the phone only by hand; every other seed draws the ground it drew before.
   2. Every line reads on every moment. For each clip and 13 seeds, each line that stands on the ground (the
      headline at 3:1, the small lines at 4.5:1, both x1.15 on a busy ground, as _evenGround asks) is read on
      the ground at 24 moments of the clip itself, through the export's own player: the worst moment counts.
   3. The export: a 6 s MP4 of a clip ad moves under its words in the file (read back), and puts its player away.
   4. The maker: Background offers the scenes; one picked stands the ad on it, its colours have light words,
      the preview's clip plays, and the pre-flight panel (which reads the preview's own ad) finds nothing to fix.
   5. A scene is one ad (rule 179): each draws from its own kit; its moment lands on a beat after the number with
      the clip's own peak under it; nothing on the ad stands still long before the end card; its sound is heard at
      the moment; and every scene ad is at -16 LUFS with peaks at or under -1 dBFS.

   usage:  node .motion-test/serve.mjs 8971 (or any server that answers byte ranges, which a video's seek
           needs), then  [GFX_BASE=http://127.0.0.1:8971/] [PLAYWRIGHT_MODULE=…] node scripts/clip_grounds_check.mjs
   Exits non-zero on a failure. */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8971/').replace(/\/?$/, '/');
const browser = await chromium.launch();
const failures = [];
const ok = (cond, m) => { console.log(`  ${cond ? 'ok  ' : 'FAIL'} ${m}`); if (!cond) failures.push(m); };

const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
const errors = []; page.on('pageerror', e => errors.push(String(e)));
await page.goto(BASE + 'motion/?full=1', { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => document.getElementById('loading').hidden, null, { timeout: 120000 });

/* ---------- 1. who draws a clip ---------- */
console.log('1. who draws a clip');
const draws = await page.evaluate(async () => {
  const F = await import('/motion/fullad.js'), C = await import('/motion/clips.js'), K = await import('/motion/catalog.js'), E = await import('/motion/engine.js');
  const { index } = await E.loadPhones('/motion/phones/');
  const lum = F.COLOUR_OF ? (k => { const c = F.COLOUR_OF[k]; return c ? E.lum(c.colors.ink) < E.lum(c.colors.ground) : false; }) : () => false;
  const run = (over, opts, n = 600) => {
    const got = { clips: {}, darkWords: 0, other: 0 };
    for (let s = 1; s <= n; s++) {
      const st = F.fullStyle({ ...K.DEFAULT_STYLE, headline: 'WE BUY IT', number: '(562) 555-0142', ...over }, s * 7919 + 3, index, {}, [], opts);
      const id = C.clipOf(st.ground_photo);
      if (id) { got.clips[id] = (got.clips[id] || 0) + 1; if (lum(st.full_colour)) got.darkWords++; } else got.other++;
    }
    return got;
  };
  return {
    la: run({ area: 'Long Beach, CA' }, { moving: true }),
    ny: run({ area: 'Brooklyn, NY' }, { moving: true }),
    gold: run({ area: 'Brooklyn, NY', subject: 'gold' }, { moving: true }, 300),
    still: run({ area: 'Long Beach, CA' }, {}),
    sameOtherwise: (() => {   // a seed that draws no clip draws what it drew with clips off
      let same = 0, n = 0;
      for (let s = 1; s <= 300; s++) {
        const over = { ...K.DEFAULT_STYLE, headline: 'WE BUY IT', number: '(562) 555-0142', area: 'Long Beach, CA' };
        const a = F.fullStyle(over, s * 7919 + 3, index, {}, [], { moving: true }), b = F.fullStyle(over, s * 7919 + 3, index, {}, [], {});
        if (C.clipOf(a.ground_photo)) continue;
        n++; if (a.background === b.background && JSON.stringify(a.ground_photo || null) === JSON.stringify(b.ground_photo || null) && a.full_colour === b.full_colour) same++;
      }
      return { same, n };
    })(),
  };
});
const share = g => Object.values(g.clips).reduce((a, b) => a + b, 0) / 600;
ok(share(draws.la) > .02 && share(draws.la) < .2, `an iPhone ad in Long Beach stands on a clip for some seeds (${(share(draws.la) * 100).toFixed(1)}%: ${JSON.stringify(draws.la.clips)})`);
ok(!draws.ny.clips.clip_city_gold && !draws.ny.clips.clip_city_aerial, `in Brooklyn no Los Angeles clip (${JSON.stringify(draws.ny.clips)})`);
ok(!draws.la.clips.clip_gold_bars && !draws.ny.clips.clip_gold_bars, `the gold bars never behind an iPhone ad (a gold ad drew ${JSON.stringify(draws.gold.clips)})`);
ok(![draws.la, draws.ny, draws.gold].some(g => g.clips.clip_phone_light), 'the phone is never drawn by a seed (by hand only)');
ok(![draws.la, draws.ny, draws.gold].some(g => g.darkWords), 'a seed draws a clip only under light words');
ok(!Object.keys(draws.still.clips).length, 'without opts.moving (a still made anywhere but the video maker) no seed draws a clip');
ok(draws.sameOtherwise.same === draws.sameOtherwise.n, `every other seed draws the ground and colours it drew before (${draws.sameOtherwise.same} of ${draws.sameOtherwise.n})`);

/* ---------- 2. every line reads on every moment ---------- */
console.log('2. every line reads on every moment of the clip');
const reads = await page.evaluate(async () => {
  const E = await import('/motion/engine.js'), F = await import('/motion/fullad.js'), C = await import('/motion/clips.js'), K = await import('/motion/catalog.js');
  const { phones, index } = await E.loadPhones('/motion/phones/');
  const lin = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
  const L = h => { const [r, g, b] = [1, 3, 5].map(i => lin(parseInt(h.slice(i, i + 2), 16))); return .2126 * r + .7152 * g + .0722 * b; };
  const base = { ...K.DEFAULT_STYLE, headline: 'SELL YOUR IPHONE', number: '(562) 555-0142', area: 'Long Beach, CA', phones: ['17-pro-max-cosmic-orange'].filter(id => phones[id]) };
  const under = [], closest = {}; let ads = 0;
  for (const id of C.CLIP_IDS) for (const seed of [4242, ...Array.from({ length: 12 }, (_, i) => 101 + i)]) {
    const st = F.fullStyle(base, seed, index, { ground_kind: 'moving', ground_clip: id }, [], { moving: true });
    await F.fullGroundReady(st); await E.loadFonts(E.fontsFor(st));
    const ad = new F.FullAd(st, { phones }, 540, 540), R = ad.full.rects;
    const names = ['headline', ...(ad.full.onGround || ['line', 'call to action', 'footer'])].filter(n => R[n]);
    await ad.prepareExport(); if (!ad.clipSrc) { under.push(`${id}: the clip did not load`); continue; }
    const x = E.canvas(ad.W, ad.H).getContext('2d', { willReadFrequently: true }), worst = {};
    for (let k = 0; k < 24; k++) {
      await ad.prepareFrame(k * C.CLIP_SECS / 24); x.clearRect(0, 0, ad.W, ad.H); ad._drawLiveGround(x, ad.tHold + 1);
      for (const n of names) {
        const r = R[n], ink = L(n === 'headline' ? ad.pHead.ink : ad.full.ink || ad.p.ink), light = ink >= .18, need = (n === 'headline' ? 3 : 4.5) * 1.15;
        const x0 = Math.max(0, r[0] | 0), y0 = Math.max(0, r[1] | 0), w = Math.min(ad.W, Math.ceil(r[2])) - x0, h = Math.min(ad.H, Math.ceil(r[3])) - y0;
        if (w < 2 || h < 2) continue;
        const d = x.getImageData(x0, y0, w, h).data, Ls = [];
        for (let i = 0; i < d.length; i += 4) Ls.push(.2126 * lin(d[i]) + .7152 * lin(d[i + 1]) + .0722 * lin(d[i + 2]));
        Ls.sort((a, b) => a - b); const g = Ls[Math.min(Ls.length - 1, Math.floor(Ls.length * (light ? .95 : .05)))];
        const ratio = (Math.max(ink, g) + .05) / (Math.min(ink, g) + .05);
        if (!worst[n] || ratio < worst[n].r) worst[n] = { r: ratio, need, k };
      }
    }
    ad.endExport(); ads++;
    for (const [n, v] of Object.entries(worst)) {
      if (v.r < v.need) under.push(`${id} seed ${seed} (${st.full_colour}, ${st.ground_photo.treat}): ${n} ${v.r.toFixed(2)}:1 at moment ${v.k} of 24, wants ${v.need.toFixed(2)}`);
      if (!closest[n] || v.r / v.need < closest[n].x) closest[n] = { x: +(v.r / v.need).toFixed(2), at: `${id} ${seed}` };
    }
  }
  return { ads, under, closest };
});
ok(reads.ads === 78 && !reads.under.length, `${reads.ads} ads, every line at or over its bar on all 24 moments${reads.under.length ? ':\n       ' + reads.under.join('\n       ') : ''}`);
console.log('       closest to its bar: ' + Object.entries(reads.closest).map(([n, v]) => `${n} x${v.x} (${v.at})`).join(', '));

/* ---------- 3. the export ---------- */
console.log('3. the export');
const exp = await page.evaluate(async () => {
  const E = await import('/motion/engine.js'), F = await import('/motion/fullad.js'), X = await import('/motion/export.js'), K = await import('/motion/catalog.js');
  const { phones, index } = await E.loadPhones('/motion/phones/');
  const st = F.fullStyle({ ...K.DEFAULT_STYLE, headline: 'SELL YOUR IPHONE', number: '(562) 555-0142', area: 'Long Beach, CA', duration: 6, phones: ['17-pro-max-cosmic-orange'].filter(id => phones[id]) },
    105, index, { ground_kind: 'moving', ground_clip: 'clip_neon_street' }, [], { moving: true });
  await F.fullGroundReady(st); await E.loadFonts(E.fontsFor(st));
  const ad = new F.FullAd(st, { phones }, 1080, 1080), t0 = performance.now();
  const r = await X.exportMp4(ad, () => {}, { audioBuf: null });
  const secs = (performance.now() - t0) / 1000;
  const v = document.createElement('video'); v.muted = true; v.src = URL.createObjectURL(r.blob);
  await new Promise(res => { v.onloadeddata = res; });
  const x = E.canvas(1080, 1080).getContext('2d', { willReadFrequently: true });
  const at = async t => { await new Promise(res => { v.onseeked = res; v.currentTime = t; }); x.drawImage(v, 0, 0); return x.getImageData(0, 600, 300, 300).data; };
  // the clip starts at its scene's offset (rule 179), so read the late stretch through, not one moment of it
  let d = 0, when = 0;
  for (let t0 = 2; t0 <= 5; t0 += .5) { const a = await at(t0), b = await at(t0 + .4); let e = 0; for (let i = 0; i < a.length; i += 4) e += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]); if (e > d) { d = e; when = t0; } }
  return { secs, dur: v.duration, change: d / (300 * 300), when, put: ad.clipSrc === null && ad._clipWas === undefined };
});
ok(Math.abs(exp.dur - 6) < .1, `a 6 s MP4 (${exp.dur.toFixed(2)} s, made in ${exp.secs.toFixed(1)} s)`);
ok(exp.change > 3, `its ground moves in the file after the words are in (${exp.change.toFixed(1)} a pixel at most, over 0.4 s from ${exp.when.toFixed(1)} s)`);
ok(exp.put, 'the export puts its own player away');

/* ---------- 4. the maker ---------- */
console.log('4. the maker');
const opts = await page.evaluate(() => [...(document.querySelector('#design select[data-key="full_clip"]') || { options: [] }).options].map(o => o.value));
ok(opts.length === 7 && opts[0] === '', `Background > Moving scene offers Any and the six scenes (${opts.length})`);
// a number typed, as a customer would (without one the panel rightly asks for it), then a scene picked
await page.evaluate(() => { const n = document.getElementById('f-number'); n.value = '(562) 999-4994'; n.dispatchEvent(new Event('input', { bubbles: true })); });
await page.waitForTimeout(800);
await page.evaluate(() => { const s = document.querySelector('#design select[data-key="full_clip"]'); s.value = 'clip_city_gold'; s.dispatchEvent(new Event('change', { bubbles: true })); });
await page.waitForTimeout(4000);
const maker = await page.evaluate(async () => {
  const v = [...document.querySelectorAll('video')].find(v => /clip_city_gold\.mp4$/.test(v.src));
  const c = document.getElementById('preview'), x = c.getContext('2d', { willReadFrequently: true });
  const a = x.getImageData(0, (c.height * .6) | 0, (c.width * .25) | 0, (c.height * .1) | 0).data; await new Promise(r => setTimeout(r, 500));
  const b = x.getImageData(0, (c.height * .6) | 0, (c.width * .25) | 0, (c.height * .1) | 0).data;
  let d = 0; for (let i = 0; i < a.length; i += 4) d += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
  const s = JSON.parse(localStorage.getItem('pgfx_motion_v1') || '{}');
  // the pre-flight panel reads the preview's own ad, its clip playing: its still is the clip's first frame (_still)
  for (let i = 0; i < 20 && /checking/.test(document.getElementById('full-checks-sum').textContent); i++) await new Promise(r => setTimeout(r, 250));
  const sum = document.getElementById('full-checks-sum'), note = document.getElementById('full-note').textContent;
  return { ground: document.querySelector('#design select[data-key="full_ground"]').value, playing: !!v && !v.paused && v.readyState >= 2, change: d / (a.length / 4), palette: (s.style || {}).full_palette || '',
    pre: sum.textContent.trim(), preFix: sum.classList.contains('bad') || /runs to the edge/.test(note), note };
});
ok(maker.ground === 'moving', `a scene picked stands the ad on a moving scene (${maker.ground})`);
ok(maker.playing, 'the preview plays the clip');
ok(maker.change > 1, `the preview's ground moves (${maker.change.toFixed(1)} a pixel in half a second)`);
ok(!maker.preFix, `the pre-flight panel finds nothing to fix on the playing clip (${maker.pre}${maker.preFix ? ': ' + maker.note : ''})`);
ok(!errors.length, 'no page errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));

/* ---------- 5. a scene is one ad (rule 179) ---------- */
console.log('5. a scene is one ad: its kit, its moment on a beat, its sound, the late stretch moving');
const scenes = await page.evaluate(async () => {
  const E = await import('/motion/engine.js'), F = await import('/motion/fullad.js'), C = await import('/motion/clips.js'), K = await import('/motion/catalog.js'), AU = await import('/motion/audit.js'), S = await import('/motion/audio.js');
  const { phones, index } = await E.loadPhones('/motion/phones/');
  const out = { offKit: [], offBeat: [], still: [], sound: [], level: [], ads: 0, worstStill: 0 };
  for (const id of C.CLIP_IDS) for (const [seed, dur] of [[105, 6], [211, 6], [307, 8], [419, 5]]) {
    const base = { ...K.DEFAULT_STYLE, headline: 'SELL YOUR IPHONE', number: '(562) 555-0142', area: 'Long Beach, CA', duration: dur, phones: ['17-pro-max-cosmic-orange'].filter(k => phones[k]) };
    const st = F.fullStyle(base, seed, index, { ground_kind: 'moving', ground_clip: id }, [], { moving: true }), sc = C.CLIPS[id].scene;
    if (st.full_look) continue;
    for (const [k, list] of Object.entries(sc.kit)) if (!list.includes(st[k])) out.offKit.push(`${id} ${seed}: ${k} ${st[k]}`);
    if (!st.shine) out.offKit.push(`${id} ${seed}: no light`);
    await F.fullGroundReady(st); await E.loadFonts(E.fontsFor(st));
    const ad = new F.FullAd(st, { phones }, 540, 540), b = 60 / (st.bpm || 112), on = x => Math.abs((x - ad.tl.hit) / b - Math.round((x - ad.tl.hit) / b)) < 1e-6;
    if (!on(ad.sceneT) || ad.sceneT < ad.tl.number + .8) out.offBeat.push(`${id} ${seed}: moment ${ad.sceneT.toFixed(2)}`);
    if (sc.moment != null && Math.abs(ad.clipTime(ad.sceneT) - sc.moment) > .01) out.offBeat.push(`${id} ${seed}: clip at ${ad.clipTime(ad.sceneT).toFixed(2)} on its moment, not ${sc.moment}`);
    if (ad.pulseT != null && (!on(ad.pulseT) || ad.pulseT < ad.sceneT + b - 1e-6 || ad.pulseT + .45 > Math.min(ad.tOutro ?? dur, ad.tHold) - .05 + 1e-6)) out.offBeat.push(`${id} ${seed}: push ${ad.pulseT.toFixed(2)}`);
    // the ad's own layers, drawn without the clip: the longest still stretch between the number and the end card
    const rep = await AU.auditLook(st, { phones }, { size: 160, secs: dur, sound: false, AdClass: F.FullAd }), fps = rep.fps;
    let run = 0, best = 0; for (let i = Math.round((ad.tl.number + .5) * fps); i < Math.min(rep.motion.length, Math.round((ad.tOutro ?? dur) * fps)); i++) { run = rep.motion[i] < 1.5 ? run + 1 : 0; best = Math.max(best, run); }
    out.worstStill = Math.max(out.worstStill, best / fps);
    if (best / fps > (dur >= 8 ? 2 : 1.5)) out.still.push(`${id} ${seed} ${dur} s: still ${(best / fps).toFixed(2)} s`);
    // the scene's sound: rendered with it and with it taken out (deterministic, the same seed), what it adds over its
    // moment against the bed there (its hit ducks the bed, so the window's own energy can stay level while a new sound
    // plays), and its loudest tenth of a second against the headline hit's; the mix at its level
    const buf = await S.renderSoundtrack(ad), bare = new F.FullAd(st, { phones }, 540, 540); delete bare.cues.scene; delete bare.cues.restamp;
    const b0 = await S.renderSoundtrack(bare), sr = buf.sampleRate, T = ad.sceneT;
    let ed = 0, e0 = 0, pk = 0;
    for (const ch of [0, 1]) { const a = buf.getChannelData(ch), z = b0.getChannelData(ch);
      for (let i = 0; i < a.length; i++) pk = Math.max(pk, Math.abs(a[i]));
      for (let i = Math.round((T - .6) * sr); i < Math.round((T + .25) * sr); i++) { ed += (a[i] - z[i]) ** 2; e0 += z[i] * z[i]; } }
    const loud = (t0, t1) => { const L = buf.getChannelData(0), R = buf.getChannelData(1), w = Math.round(sr * .1); let best = 0;
      for (let q = Math.max(0, Math.round(t0 * sr)); q + w <= Math.min(L.length, Math.round(t1 * sr)); q += Math.round(sr * .02)) { let e = 0; for (let i = q; i < q + w; i++) e += L[i] * L[i] + R[i] * R[i]; best = Math.max(best, e / w); }
      return 10 * Math.log10(best); };
    const added = 10 * Math.log10(ed / Math.max(1e-12, e0)), under = loud(ad.tl.hit - .05, ad.tl.hit + .3) - loud(T - .6, T + .25), lufs = S.loudness(buf);
    out.added = Math.min(out.added ?? 99, added); out.under = Math.min(out.under ?? 99, under);
    if (added < -8 || under < 1.5) out.sound.push(`${id} ${seed}: the moment adds ${added.toFixed(1)} dB against the bed, ${under.toFixed(1)} dB under the headline hit`);
    if (Math.abs(lufs + 16) > .5 || 20 * Math.log10(pk) > -.95) out.level.push(`${id} ${seed}: ${lufs.toFixed(2)} LUFS, peak ${(20 * Math.log10(pk)).toFixed(2)} dBFS`);
    out.ads++;
  }
  return out;
});
ok(!scenes.offKit.length, `each scene draws its entrance, phone move, bed, hits and chimes from its own kit, with its light (${scenes.ads} ads)${scenes.offKit.length ? ':\n       ' + scenes.offKit.join('\n       ') : ''}`);
ok(!scenes.offBeat.length, `the moment lands on a beat after the number, with the clip's own peak under it; the push before the still's moment${scenes.offBeat.length ? ':\n       ' + scenes.offBeat.join('\n       ') : ''}`);
ok(!scenes.still.length, `nothing on the ad stands still long between the number and the end card (longest ${scenes.worstStill.toFixed(2)} s; 1.5 s allowed, 2 s in an 8 s ad; it was 1.7 to 4.7 s)${scenes.still.length ? ':\n       ' + scenes.still.join('\n       ') : ''}`);
ok(!scenes.sound.length, `the scene's sound is heard at its moment: it adds sound no more than 8 dB under the bed there, and stays 1.5 dB or more under the headline's hit (least ${scenes.added.toFixed(1)} dB, ${scenes.under.toFixed(1)} dB)${scenes.sound.length ? ':\n       ' + scenes.sound.join('\n       ') : ''}`);
ok(!scenes.level.length, `every scene ad at -16 LUFS, peaks at or under -1 dBFS${scenes.level.length ? ':\n       ' + scenes.level.join('\n       ') : ''}`);

await browser.close();
console.log(failures.length ? `\n${failures.length} failed` : '\nall clear');
process.exit(failures.length ? 1 : 0);
