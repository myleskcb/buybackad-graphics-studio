#!/usr/bin/env node
/* THE FULL AD'S STYLES, CHECKED (spec/full-styles.json; motion/full-styles.js, motion/decor.js).

   The owner, 2026-11-18: "notice how it's all same spiky circle?", "and there's no variety in the
   text pure outlines?", "Also don't see any gradients really?". A seed now draws a sticker shape, a
   headline treatment, an entrance, a number treatment and plate fills from one table, and the
   ground may be a two-colour gradient. This holds them:

     table     motion/full-styles.js is in step with spec/full-styles.json
     shares    600 seeds through pickFullStyles: every option drawn, each within 6 points of its
               share (a "dark" row only on dark grounds)
     options   every sticker shape (flat and graded), every headline treatment, every number
               treatment (flat and graded plates) and every gradient and pattern ground and every fill, on every pair at
               a square and in Easy Mode's five other sizes on two pairs, on two lines (galaxy,
               jdm: their sticker's room by the frame's edge) in those five sizes on their own
               grounds, and on up to eight lines' own photographs, each through fullPreflight on
               the picture as delivered: an option passes where its ads have no fix
     seeds     24 seeds as drawn (iPhone, cars, gold, Pokémon, computers) pass the pre-flight;
               their contact sheet is seeds.jpg
     families  a gradient ground's colours are the pair's ground and accent families, or the hues on the way
               from the ground's to its far end's (2026-11-19: a gradient turns hue), no third
     entrance  each entrance moves (frames before the hold differ) and comes to rest on the still
   Contact sheets of every option go to SHEETS (default .render/full-styles/).

   usage:  [GFX_BASE=http://127.0.0.1:8931/] [SHEETS=dir] node scripts/full_style_check.mjs     exit 1 on a failure */
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8931/').replace(/\/?$/, '/');
const SHEETS = process.env.SHEETS || new URL('../.render/full-styles/', import.meta.url).pathname;
mkdirSync(SHEETS, { recursive: true });
const fails = [];
const ok = (cond, what) => { console.log((cond ? '  ok   ' : '  FAIL ') + what); if (!cond) fails.push(what); };

try { execFileSync(process.execPath, [new URL('./build_full_styles.mjs', import.meta.url).pathname, '--check'], { stdio: 'pipe' }); ok(true, 'motion/full-styles.js is in step with spec/full-styles.json'); }
catch (e) { ok(false, 'motion/full-styles.js: ' + String(e.stderr || e.stdout || e).trim().split('\n')[0]); }

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
const errors = []; page.on('pageerror', e => errors.push(String(e)));
await page.goto(BASE + 'motion/', { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => document.getElementById('loading').hidden, null, { timeout: 120000 });

const r = await page.evaluate(async () => {
  const E = await import('/motion/engine.js'), C = await import('/motion/catalog.js'), A = await import('/motion/accents.js'), F = await import('/motion/fullad.js');
  const S = await import('/motion/full-styles.js'), D = await import('/motion/decor.js');
  const { phones, index } = await E.loadPhones('/motion/phones/');
  const assets = { phones, index, accents: await A.loadAccents('/assets/cutouts/') };
  const two = index.filter(m => m.model === 'iPhone 16 Pro').map(m => m.id).slice(0, 2);
  const words = { headline: 'SELL YOUR IPHONE', tag: 'IPHONE 15 AND NEWER', feed_claim: 'LOCAL & HONEST', points: 'TEXT YOUR IMEI, CASH SAME DAY, NO FEES', number_label: 'CALL OR TEXT',
    feed_where: 'LONG BEACH • LAKEWOOD • DOWNEY', site: 'www.YourShop.com', number: '(562) 999-4994', feed_burst: 'SAME DAY' };
  const T = S.FULL_STYLES, out = { shares: {}, options: [], families: [], entrances: [], sheets: {} };
  // dark: the words are lighter than the ground, as fullStyle reads it (a vivid ground under white words is dark)
  const darkOf = key => E.lum(F.COLOUR_OF[key].colors.ink) > E.lum(F.COLOUR_OF[key].colors.ground);

  // shares: 600 seeds through the picker, half on dark grounds
  const tally = {}; let darkN = 0;
  for (let s = 1; s <= 600; s++) {
    const dark = s % 2 === 0; if (dark) darkN++;
    const p = S.pickFullStyles(E.rng(s * 7919 + 13), { dark });
    for (const [k, v] of Object.entries(p)) { const kk = k + ':' + v; tally[kk] = (tally[kk] || 0) + 1; if (k === 'text_fx' && !dark && v === 'glow') tally.glowOnLight = (tally.glowOnLight || 0) + 1; }
    const row = T.headline.find(e => e.key === p.text_fx) || {};
    if ((row.scrim != null ? row.scrim : null) !== (p.scrim != null ? p.scrim : null)) tally.scrimWrong = (tally.scrimWrong || 0) + 1;
    // the same stream on a photograph or a drawn scene: a "plain" row (the plate-less number) is never drawn there
    const pb = S.pickFullStyles(E.rng(s * 7919 + 13), { dark, busy: true });
    for (const [field, list] of [['sticker_shape', T.sticker], ['sticker_fill', T.sticker_fill], ['text_fx', T.headline], ['text_in', T.entrance], ['number_style', T.number], ['plate_fill', T.plate_fill], ['cta_mark', T.cta_mark]]) if ((list.find(e => e.key === pb[field]) || {}).where === 'plain') tally.plainOnBusy = (tally.plainOnBusy || 0) + 1;
  }
  // a textured fill (stripes, dots, foil: decor.js fillTexture) moves the fill's own hue away from its ink, so it never
  // reads worse than the flat fill: every tone it can draw, on every pair's plate, accent and sticker, against their inks
  { let worst = 99, where = '';
    for (const key of F.COLOURWAYS) {
      const c = F.COLOUR_OF[key].colors, plateInk = E.contrastOf(c.plate_ink || '#ffffff', c.plate || c.accent) >= 3.5 ? (c.plate_ink || '#ffffff') : (E.lum(c.plate || c.accent) > .5 ? '#111111' : '#ffffff');
      const stickerInk = E.contrastOf(c.ink, c.ground) >= 3 ? c.ground : (E.lum(c.ink) > .5 ? '#111111' : '#ffffff');
      for (const [what, fill, ink] of [['plate', c.plate || c.accent, plateInk], ['sticker', c.ink, stickerInk]]) for (const d of [.05, .09, .1, .16]) {
        const away = D.textureTone(fill, ink, d), k = E.contrastOf(ink, away) / E.contrastOf(ink, fill);
        if (k < worst) { worst = k; where = `${key} ${what} ${d}`; }
      }
    }
    out.textureContrast = { worst: +worst.toFixed(3), where };
  }
  // a gradient plate keeps the contrast the solid plate had: both ends of every plate, claim, chip and sticker fill, against its ink
  { let worst = 99, where = '';
    for (const key of F.COLOURWAYS) {
      const c = F.COLOUR_OF[key].colors, plateInk = E.contrastOf(c.plate_ink || '#ffffff', c.plate || c.accent) >= 3.5 ? (c.plate_ink || '#ffffff') : (E.lum(c.plate || c.accent) > .5 ? '#111111' : '#ffffff');
      for (const [what, fill, ink] of [['plate', c.plate || c.accent, plateInk], ['accent under white', c.accent, '#ffffff'], ['accent under black', c.accent, '#111111'], ['ground', c.ground, c.ink || '#ffffff']]) {
        if (!fill || !ink) continue; const [t, f] = D.gradientEnds(fill, ink), k = Math.min(E.contrastOf(ink, t), E.contrastOf(ink, f)) / E.contrastOf(ink, fill);
        if (k < worst) { worst = k; where = key + ' ' + what; }
      }
    }
    out.gradContrast = { worst: +worst.toFixed(3), where };
  }
  out.shares = { tally, darkN };

  // one ad: the seed's own style, then the option forced; drawn at the size, read by the pre-flight
  const thumb = c => { const t = E.canvas(200, Math.round(200 * c.height / c.width)); t.getContext('2d').drawImage(c, 0, 0, t.width, t.height); return t; };
  const sheetOf = (cells, cols = 12) => {
    const w = 200, h = Math.max(...cells.map(c => c.t.height)) + 18, rows = Math.ceil(cells.length / cols), c = E.canvas(cols * w, rows * h), x = c.getContext('2d');
    x.fillStyle = '#222'; x.fillRect(0, 0, c.width, c.height); x.font = '12px sans-serif';
    cells.forEach((cell, i) => { const cx = (i % cols) * w, cy = Math.floor(i / cols) * h; x.drawImage(cell.t, cx, cy); x.fillStyle = cell.ok ? '#9fe0a8' : '#ff8a80'; x.fillText(cell.label, cx + 4, cy + h - 5); });
    return c.toDataURL('image/jpeg', .8);
  };
  // Easy Mode's six sizes (app.js FORMATS), each with the aspect full-ad-studio.js gives it
  const SIZES = { square: [1080, 1080], story: [1080, 1920], flyer: [1080, 1398], landscape: [1920, 1080], four3: [1440, 1080], three4: [1080, 1440] };
  const aspectOf = ([w, h]) => { const ar = w / h; return ar >= 1.3 ? '16:9' : ar <= .62 ? '9:16' : Math.abs(ar - 1) < .02 ? '1:1' : '4:5'; };
  const draw = async (pair, size, force, seed = 4242) => {
    const [W, H] = SIZES[size], aspect = aspectOf(SIZES[size]);
    const st = F.fullStyle({ ...C.DEFAULT_STYLE, ...words, aspect, phones: two }, seed, index, { palette: pair });
    Object.assign(st, { background: 'radial', ...force });
    await E.loadFonts([...E.fontsFor(st), 'franklin']);
    const ad = new F.FullAd(st, assets, W, H);
    const c = F.fullStill(ad), pre = F.fullPreflight(ad, c);
    return { ad, c, pre, fixes: pre.findings.filter(f => f.level === 'fix').map(f => f.code + ': ' + f.say) };
  };
  /* the lines as a seed draws them (the 24 of the contact sheet: iPhone, cars, gold, Pokémon, computers),
     on their own grounds; a photograph's light and detail can carry a treatment's shade or outline to
     the frame's edge where a gradient shows nothing (2026-11-18: the shadow treatments' heavier
     scrim, on gold and cars). Every option is drawn again on the photographs among them. */
  const subs = (await (await fetch('/motion/subjects.json', { cache: 'no-store' })).json()).subjects;
  const PLAN = [['iphone', 5], ['car', 5], ['gold', 5], ['pokemon', 5], ['laptop', 4]].flatMap(([key, n]) => Array.from({ length: n }, (_, i) => ({ key, i, seed: 101 + i * 977 + key.length * 31 })));
  const lineAd = async ({ key, i, seed }, force = {}, size = 'square') => {
    const L = subs.find(s => s.key === key); let ids = [];
    if (key !== 'iphone') { const got = await F.loadSubjectSet(L, 0, '/assets/cutouts/'); Object.assign(assets.phones, got.assets); ids = got.ids.length ? got.ids : ['none']; }
    const st = F.fullStyle({ ...C.DEFAULT_STYLE, subject: key, phones: ids, headline: L.heads[i % L.heads.length].toUpperCase(), tag: L.models.toUpperCase(), points: L.points,
      number: '(562) 999-4994', aspect: aspectOf(SIZES[size]), feed_where: 'LONG BEACH • LAKEWOOD • DOWNEY', site: 'www.YourShop.com' }, seed, index);
    Object.assign(st, force);
    await F.fullGroundReady(st); await E.loadFonts([...E.fontsFor(st), 'franklin']);
    const ad = new F.FullAd(st, assets, ...SIZES[size]), c = F.fullStill(ad), pre = F.fullPreflight(ad, c);
    return { st, ad, c, fixes: pre.findings.filter(f => f.level === 'fix').map(f => f.code + ': ' + f.say) };
  };
  const seedCells = [], photos = [];
  out.seeds = [];
  for (const q of PLAN) {
    const d = await lineAd(q), st = d.st;
    out.seeds.push({ ...q, pair: st.full_colour, background: st.background, styles: [st.sticker_shape + (st.sticker_grad ? '+g' : ''), st.text_fx, st.text_in, st.number_style + (st.plate_grad ? '+g' : '')].join(' · '), ok: !d.fixes.length, fixes: d.fixes });
    if (st.background === 'photo') photos.push({ ...q, pair: st.full_colour });
    const t = E.canvas(400, 440), x = t.getContext('2d'); x.fillStyle = '#1b1b1b'; x.fillRect(0, 0, 400, 440); x.drawImage(d.c, 0, 0, 400, 400);
    x.font = '12px sans-serif'; x.fillStyle = d.fixes.length ? '#ff8a80' : '#cfe8d0'; x.fillText(`${q.key} ${q.seed} · ${st.full_colour} · ${st.background}` + (d.fixes.length ? '  FIX: ' + d.fixes.map(f => f.split(':')[0]).join(',') : ''), 4, 415);
    x.fillStyle = '#ddd'; x.fillText(out.seeds[out.seeds.length - 1].styles, 4, 432); seedCells.push(t);
  }
  { const cols = 6, sh = E.canvas(cols * 400, Math.ceil(seedCells.length / cols) * 440), sx = sh.getContext('2d'); seedCells.forEach((t, i) => sx.drawImage(t, (i % cols) * 400, Math.floor(i / cols) * 440)); out.sheets.seeds = sh.toDataURL('image/jpeg', .85); }
  // up to eight of the photographs: first the two that found the heavy scrim (light at the frame's edge), then a line at a time
  const HARD = ['gold 4133', 'car 2148'], hard = q => HARD.includes(q.key + ' ' + q.seed), onPhoto = photos.filter(hard);
  const rest = key => photos.filter(p => p.key === key && !hard(p));
  for (let k = 0; onPhoto.length < Math.min(8, photos.length); k++) for (const key of ['gold', 'car', 'iphone', 'pokemon', 'laptop']) { const q = rest(key)[k]; if (q && onPhoto.length < 8) onPhoto.push(q); }
  out.onPhoto = onPhoto.map(q => q.key + ' ' + q.seed);

  const OTHER = ['story', 'flyer', 'landscape', 'four3', 'three4'], BY_EDGE = [{ key: 'galaxy', i: 0, seed: 1 }, { key: 'jdm', i: 0, seed: 1 }], edgeBase = {};
  // busy: a photograph or a drawn scene (the house's own painted grounds, its gradients and patterns, are plain: rule 146)
  const painted = bg => F.GROUNDS.includes(bg) || D.PAIR_GRADIENTS.includes(bg) || D.FULL_PATTERNS.includes(bg);
  for (const q of BY_EDGE) for (const size of OTHER) { const d0 = await lineAd(q, {}, size); edgeBase[q.key + ' ' + size] = { pair: d0.st.full_colour, busy: !painted(d0.st.background) }; }
  /* every shape flat, then every other fill (rule 146) on a shape in turn; every number treatment on a flat plate,
     then every other plate fill on a plate in turn (the number's and the claim's badge both wear it); every
     gradient and every pattern ground (spec/full-grounds.json) */
  const fillOn = (fills, keys, k) => fills.filter(f => f.key !== 'solid').map((f, i) => ({ f, on: keys[i % keys.length] }));
  const KINDS = [
    ['sticker', [...T.sticker.map(e => ({ sticker_shape: e.key, sticker_fill: 'solid', sticker_grad: false })),
      ...fillOn(T.sticker_fill, T.sticker.map(e => e.key)).map(({ f, on }) => ({ sticker_shape: on, sticker_fill: f.key, sticker_grad: f.key === 'gradient', _where: f.where || '' }))]],
    // a treatment drawn with the shade its row holds (scrim), as the seed draws it
    ['headline', T.headline.map(e => ({ text_fx: e.key, ...(e.scrim != null ? { scrim: e.scrim } : {}), _where: e.where || '' }))],
    ['number', [...T.number.map(e => ({ number_style: e.key, plate_fill: 'solid', plate_grad: false, _where: e.where || '' })),
      ...fillOn(T.plate_fill, T.number.filter(e => !e.where).map(e => e.key)).map(({ f, on }) => ({ number_style: on, plate_fill: f.key, plate_grad: f.key === 'gradient' || f.key === 'foil', _where: f.where || '' }))]],
    // the call to action's mark (2026-11-18): each, in every pair and size, through the pre-flight
    ['cta', T.cta_mark.map(e => ({ cta_mark: e.key, _where: e.where || '' }))],
    ['ground', [...D.PAIR_GRADIENTS, ...D.FULL_PATTERNS].map(k => ({ background: k }))],
  ];
  for (const [kind, opts] of KINDS) {
    const cells = [];
    for (const o of opts) {
      const { _where, ...force } = o, label = Object.entries(force).filter(([k]) => k !== 'scrim').map(([, v]) => String(v)).join(' ').replace(/ false$/, '').replace(/ true$/, ' grad');
      if (kind !== 'ground') for (const q of onPhoto) {
        if ((_where === 'dark' && !darkOf(q.pair)) || _where === 'plain') continue;
        const d = await lineAd(q, force);
        out.options.push({ kind, label, pair: q.key + ' ' + q.seed, aspect: 'photo', ok: !d.fixes.length, fixes: d.fixes, sticker: !!d.ad.burst });
      }
      for (const pair of F.COLOURWAYS) {
        if (_where === 'dark' && !darkOf(pair)) continue;
        const d = await draw(pair, 'square', force);
        const row = { kind, label, pair, aspect: 'square', ok: !d.fixes.length, fixes: d.fixes, sticker: !!d.ad.burst };
        if (kind === 'ground') {
          // the ground's own colours, read off the painted ground canvas: hues within 30 degrees of the ground's or the accent's
          const g = d.ad.bg, x = g.getContext('2d', { willReadFrequently: true }), px = x.getImageData(0, 0, g.width, g.height).data;
          const G = E.oklchOf(F.COLOUR_OF[pair].colors.ground), Ac = E.oklchOf(F.COLOUR_OF[pair].colors.accent);
          /* a gradient turns from the ground's hue into its far end's along the shorter way (2026-11-19, decor.js; the owner:
             "only 1 gradient multi color", "Show more of them"): a hue on the way is its own, any other is a third family */
          const far = D.PAIR_GRADIENTS.includes(o.background) ? E.oklchOf(D.pairGradientColours(F.COLOUR_OF[pair].colors).hot) : null;
          const turn = far && G.C >= .04 && far.C >= .04 ? (((far.h - G.h) % 360) + 540) % 360 - 180 : null;
          const onWay = h => { if (turn == null || Math.abs(turn) > 150) return false; const d = (((h - G.h) % 360) + 540) % 360 - 180; return turn >= 0 ? d >= -30 && d <= turn + 30 : d <= 30 && d >= turn - 30; };
          let n = 0, third = 0;
          for (let i = 0; i < px.length; i += 4 * 97) { const [L, a, b] = E.oklabOf(px[i], px[i + 1], px[i + 2]), C2 = Math.hypot(a, b); if (C2 < .05) continue; n++; const h = (Math.atan2(b, a) * 180 / Math.PI + 360) % 360, dh = q => Math.min(Math.abs(h - q), 360 - Math.abs(h - q)); if (!((G.C >= .04 && dh(G.h) <= 30) || dh(Ac.h) <= 30 || (far && far.C >= .04 && dh(far.h) <= 30) || onWay(h))) third++; }
          out.families.push({ label, pair, third: n ? +(third / n).toFixed(3) : 0 });
        }
        out.options.push(row); cells.push({ t: thumb(d.c), ok: row.ok, label: label.slice(0, 18) + ' ' + pair.split('_').map(w => w[0]).join('') });
      }
      // Easy Mode's other five sizes: on two pairs, and on two lines on their own drawn grounds, where the
      // sticker's room can stand by the frame's edge (a ribbon's tails ran into the margin there, 2026-11-18)
      // (a dark, a light, a vivid ground under white words and one under black words: 2026-11-18, rule 146)
      for (const pair of ['navy_orange', 'silver_blue', 'white_on_pink', 'black_on_lime']) {
        if (_where === 'dark' && !darkOf(pair)) continue;
        for (const size of OTHER) {
          const d = await draw(pair, size, force);
          out.options.push({ kind, label, pair, aspect: size, ok: !d.fixes.length, fixes: d.fixes, sticker: !!d.ad.burst });
        }
      }
      if (kind !== 'ground') for (const q of BY_EDGE) for (const size of OTHER) {
        const b = edgeBase[q.key + ' ' + size];
        if ((_where === 'dark' && !darkOf(b.pair)) || (_where === 'plain' && b.busy)) continue;
        const d = await lineAd(q, force, size);
        out.options.push({ kind, label, pair: q.key + ' ' + q.seed, aspect: size, ok: !d.fixes.length, fixes: d.fixes, sticker: !!d.ad.burst });
      }
      // on the house's own textured grounds too (rule 146): a dot screen and a hard split, under light words and dark
      if (kind !== 'ground') for (const pair of ['black_gold', 'cream_red', 'white_on_teal']) for (const background of ['pat_halftone', 'pair_split', 'pat_memphis']) {
        if (_where === 'dark' && !darkOf(pair)) continue;
        const d = await draw(pair, 'square', { ...force, background });
        out.options.push({ kind, label, pair: pair + ' ' + background, aspect: 'square', ok: !d.fixes.length, fixes: d.fixes, sticker: !!d.ad.burst });
      }
    }
    out.sheets[kind] = sheetOf(cells, kind === 'headline' ? 12 : 12);
  }

  // entrances: each moves, and rests on the still
  const ecells = [];
  for (const e of T.entrance) {
    const st = F.fullStyle({ ...C.DEFAULT_STYLE, ...words, aspect: '1:1', phones: two }, 4242, index, { palette: 'black_red' });
    Object.assign(st, { background: 'radial', text_in: e.key });
    await E.loadFonts([...E.fontsFor(st), 'franklin']);
    const ad = new F.FullAd(st, assets, 1080, 1080), still = F.fullStill(ad);
    const t0 = Math.max(0, (ad.tl.text || .3) - .05), times = [t0, t0 + .12, t0 + .25, t0 + .45, t0 + .8];
    const frames = times.map(t => { const c = E.canvas(1080, 1080); ad.still = null; ad.frame(c.getContext('2d'), t, { subsFly: 1, subsMove: 1 }, 1 / 30); return c; });
    // the still's own moment (fullStill), and a frame a quarter second before it: an entrance that has come to rest draws them alike
    const tStill = Math.max(isFinite(ad.tl.number) ? ad.tl.number + 1.2 : 0, (ad.tLanded || 0) + .6, (ad.tOutro != null ? ad.tOutro : st.duration) - .4);
    const hold = E.canvas(1080, 1080); ad.still = null; ad.frame(hold.getContext('2d'), tStill - .25, { subsFly: 4, subsMove: 2 }, 1 / 30);
    const diff = (a, b) => { const A1 = a.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, 1080, 1080).data, B1 = b.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, 1080, 1080).data; let s2 = 0, n = 0; for (let i = 0; i < A1.length; i += 4 * 211) { s2 += Math.abs(A1[i] - B1[i]) + Math.abs(A1[i + 1] - B1[i + 1]) + Math.abs(A1[i + 2] - B1[i + 2]); n++; } return s2 / n / 3; };
    const moves = frames.slice(1).map((f, i) => diff(frames[i], f));
    out.entrances.push({ key: e.key, moved: +Math.max(...moves).toFixed(2), restDiff: +diff(hold, still).toFixed(2) });
    frames.forEach((f, i) => ecells.push({ t: thumb(f), ok: true, label: e.key + ' ' + i }));
  }
  out.sheets.entrance = sheetOf(ecells, 5);
  return out;
});
if (errors.length) ok(false, 'page errors: ' + errors.slice(0, 3).join(' | '));

// the shares
const { tally, darkN } = r.shares, N = 600;
const shareOk = (field, list, dark) => {
  const onDark = e => e.where !== 'light', onLight = e => e.where !== 'dark';   // a "plain" row is drawn on both (these 600 are on the house gradients)
  const sumDark = list.filter(onDark).reduce((a, e) => a + e.share, 0), sumLight = list.filter(onLight).reduce((a, e) => a + e.share, 0);
  const bad = [];
  for (const e of list) {
    const want = ((onDark(e) ? e.share / sumDark * darkN : 0) + (onLight(e) ? e.share / sumLight * (N - darkN) : 0)) / N, got = (tally[field + ':' + e.key] || 0) / N;
    if (!got || Math.abs(got - want) > .06) bad.push(`${e.key} ${(got * 100).toFixed(1)}% for ${(want * 100).toFixed(1)}%`);
  }
  return bad;
};
const SPEC = JSON.parse((await import('node:fs')).readFileSync(new URL('../spec/full-styles.json', import.meta.url), 'utf8'));
for (const [field, list] of [['sticker_shape', SPEC.sticker], ['sticker_fill', SPEC.sticker_fill], ['text_fx', SPEC.headline], ['text_in', SPEC.entrance], ['number_style', SPEC.number], ['cta_mark', SPEC.cta_mark], ['plate_fill', SPEC.plate_fill]]) {
  const bad = shareOk(field, list);
  ok(!bad.length, `600 seeds draw every ${field} near its share` + (bad.length ? ': ' + bad.join(', ') : ''));
}
ok(!tally.glowOnLight, 'a "dark" treatment (glow) is never drawn on a light ground');
ok(!tally.scrimWrong, 'each headline treatment comes with the shade its row holds (scrim), and the others with the engine\'s own');
ok(!tally.plainOnBusy, `a "plain" row (the plate-less number) is never drawn on a photograph or a drawn scene (${tally.plainOnBusy || 0} of 600)`);
ok(r.gradContrast.worst >= .999, `a gradient fill keeps the contrast its flat fill had, at both ends (the least, ${r.gradContrast.worst} of the flat's, on ${r.gradContrast.where})`);
ok(r.textureContrast.worst >= .999, `a striped, dotted or foil fill never reads worse than its flat fill (the least, ${r.textureContrast.worst} of the flat's, on ${r.textureContrast.where})`);

// the options: each passes the pre-flight where it is offered
const byOpt = {};
for (const o of r.options) { const k = o.kind + ' · ' + o.label; (byOpt[k] ||= []).push(o); }
const report = [];
for (const [k, rows] of Object.entries(byOpt)) {
  const pass = rows.filter(o => o.ok).length, why = [...new Set(rows.filter(o => !o.ok).flatMap(o => o.fixes.map(f => f.split(':')[0])))];
  report.push({ k, pass, n: rows.length, why, failing: rows.filter(o => !o.ok).map(o => o.pair + ' ' + o.aspect) });
}
for (const x of report) ok(x.pass === x.n, `${x.k}: ${x.pass}/${x.n} pass the pre-flight` + (x.pass < x.n ? ` (${x.why.join(', ')}: ${x.failing.slice(0, 6).join(', ')})` : ''));
for (const q of r.seeds.filter(q => !q.ok)) ok(false, `${q.key} seed ${q.seed} (${q.pair}, ${q.background}; ${q.styles}): ${q.fixes.join(' | ')}`);
ok(r.seeds.every(q => q.ok), `the ${r.seeds.length} seeds as drawn (iPhone, cars, gold, Pokémon, computers) pass the pre-flight (${r.seeds.filter(q => q.ok).length}/${r.seeds.length}); every option drawn again on ${r.onPhoto.length} of their photographs (${r.onPhoto.join(', ')})`);
const noSticker = r.options.filter(o => o.kind === 'sticker' && !o.sticker).length;
ok(true, `the sticker found its room on ${r.options.filter(o => o.kind === 'sticker').length - noSticker} of ${r.options.filter(o => o.kind === 'sticker').length} sticker ads (the layout leaves none on some sizes)`);
for (const f of r.families) if (f.third > .05) ok(false, `${f.label} on ${f.pair}: ${(f.third * 100).toFixed(1)}% of its coloured pixels are a third family`);
ok(r.families.every(f => f.third <= .05), `the gradient grounds keep to the pair's two families and the hues on the way between them: ${r.families.length} grounds, the worst ${(Math.max(...r.families.map(f => f.third)) * 100).toFixed(1)}% outside them`);
for (const e of r.entrances) ok(e.moved > 1.5 && e.restDiff < 1, `entrance ${e.key}: moves (${e.moved}) and rests on the still (${e.restDiff})`);

for (const [k, url] of Object.entries(r.sheets)) writeFileSync(SHEETS + k + '.jpg', Buffer.from(url.split(',')[1], 'base64'));
writeFileSync(SHEETS + 'report.json', JSON.stringify({ report, families: r.families, entrances: r.entrances, shares: r.shares }, null, 1));
console.log(`sheets and report: ${SHEETS}`);
await browser.close();
console.log(fails.length ? `\n${fails.length} failed` : '\nall clear');
process.exit(fails.length ? 1 : 0);
