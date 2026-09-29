#!/usr/bin/env node
/* THE VARIANT BOARD — the owner, 2026-09-27: "now make the layout easier so I
 * can scroll at least 500 options variations themes taglines fonts colors,
 * everything nothing left out … even shapes for background box/bubble like
 * CTA can be variations (with or without using outline) make them cohesive,
 * fun, easy to read, and appealing ads that will get my business customers
 * … types of devices etc. your best unique 500 that encompass all we've
 * talked about", and "NEVER deliver without self validating and extensively
 * auditing your designs until fixed and PERFECT".
 *
 * Every variant is the owner-approved Steps Flow design (stepsFlow-nn05-30)
 * recomposed by the shared composer (scripts/_steps_composer.mjs) from the
 * owner's own parts, and ships only if scripts/audit_card.mjs passes it at
 * 100% in the gallery painter, Easy Mode square, 3:4 and 9:16, and the video.
 *
 * The engine chooses, it does not roll (DESIGN-LAW 75): a VOICE bundles a type
 * pair, plate and CTA shapes and the tagline looks that suit it; the accent is
 * the voice's colour across the wheel from the photograph; glow and 3-D only
 * on dark grounds; light grounds get dark ink. Across the board the planner
 * balances coverage: every voice, claim, badge, phone, ground and look turns
 * up about as often as its weight says, and no two variants are the same.
 *
 *   node scripts/variant_board.mjs plan [--n=660]         → .render/board/plan.json
 *   node scripts/variant_board.mjs compose --shard=0/4    → lab records + thumbnails
 *   node scripts/variant_board.mjs audit --shard=0/4      → audit_card --lab on the shard
 *   node scripts/variant_board.mjs collect [--keep=500]   → .render/board/site/ (the page, board.json, thumbnails)
 *   node scripts/variant_board.mjs thumbs --shard=0/4     → .render/board/site/t/ at 800px, from the kept records
 *   (needs :8899; CHROME=, FABRIC_JS= as for the other showcase scripts)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { openStudio } from './_showcase_harness.mjs';
import { composeInPage, MICRO } from './_steps_composer.mjs';

const ROOT = new URL('../', import.meta.url).pathname;
const OUT = ROOT + '.render/board/', LABDIR = ROOT + '.render/restage/lab/', THUMBS = OUT + 'thumbs/', AUDIT = ROOT + '.render/audit-card/';
[OUT, LABDIR, THUMBS].forEach(d => mkdirSync(d, { recursive: true }));
const args = process.argv.slice(2), cmd = args[0];
const opt = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const [SHARD, SHARDS] = (opt('shard', '0/1')).split('/').map(Number);
const BASE_ID = 'stepsFlow-nn05-30';

/* ── the parts ─────────────────────────────────────────────────────────── */
const CLAIMS = [['TOP iPHONE', 'BUYER'], ['SELL YOUR', 'iPHONE'], ['WE BUY', 'iPHONES'], ['FAST CASH FOR', 'iPHONES'],
  ['QUICK iPHONE', 'BUYER'], ['CASH FOR', 'iPHONES'], ['#1 iPHONE', 'BUYER']];
const BADGES = [['#1 BUYER', 'shieldTick'], ['TOP BUYER', 'shieldTick'], ['BEST BUYER', 'shieldTick'], ['EZ BUYER', 'shieldTick'],
  ['FAST BUYER', 'boltFast'], ['QUICK CASH', 'boltFast'], ['TOP OFFER', 'cashTag'], ['MEET NOW', 'liveDot'], ['AVAILABLE NOW', 'liveDot'],
  ['LA · OC · IE', 'pin'], ['LA / OC', 'pin']];
const words = s => new Set(String(s).toUpperCase().split(/[^A-Z0-9#]+/).filter(w => w.length > 1));
const badgesFor = claim => { const w = words(claim.join(' ')); return BADGES.filter(([t]) => ![...words(t)].some(x => w.has(x))); };

/* the phones: factory photos from the shop's catalog, weighted to the
   popular, high-value models (owner: "18 or 17 Pro Max to maximize profits") */
const PH = s => 'assets/cutouts/qs-iphone-' + s + '.webp';
const PHONES = [[PH('18-pro-max'), 3], [PH('17-pro-max'), 3], [PH('18-pro'), 2], [PH('17-pro'), 2], [PH('16-pro-max'), 2], [PH('16-pro'), 1],
  [PH('17-air'), 1], [PH('17'), 1], [PH('16-back--black'), 0.3], [PH('16-back--pink'), 0.3], [PH('16-back--teal'), 0.3],
  [PH('16-back--ultramarine'), 0.3], [PH('16-back--white'), 0.3], [PH('17e-back--black'), 0.25], [PH('17e-back--soft-pink'), 0.25], [PH('17e-back--white'), 0.25]];

/* the grounds: photographs that show no older iPhone (a new phone in front of
   an old one reads as the wrong phone), abstract grounds, and dark gradients.
   Not the open MacBook (scene-own-macbook-open): its key letters and ruler
   digits sat legible behind the claim, words behind words */
const PHOTOS = [
  'assets/bg-web/phones-iphone-13-pro-3.jpg', 'assets/bg-web/macbook-macbook-air-3.jpg', 'assets/bg-web/macbook-apple-macbook-keyboard-4.jpg',
  'assets/bg-web/macbook-macbook-pro-1.jpg', 'assets/bg-web/macbook-macbook-pro-16-inch-4.jpg', 'assets/bg-web/macbook-macbook-pro-m3-1.jpg',
  'assets/bg/dl_phones_bandKnockout_arctic.jpg', 'assets/bg/dl_phones_voltStack_volt.jpg', 'assets/scenes/scene-ref-gradient-wave.jpg',
  'assets/grounds/money-fall-dark.webp', 'assets/grounds/money-fall-paper.webp',
  'assets/scenes/scene-own-macbook-stack.jpg', 'assets/scenes/scene-own-apple-sign-cash.jpg', 'assets/scenes/scene-ref-orange-sculpt.jpg',
  'assets/scenes/scene-iso-iphone-dark.jpg', 'assets/scenes/scene-pick-dusk-iso.jpg',
  'assets/showcase/bg/abs_bokeh_gl03_3.webp', 'assets/showcase/bg/abs_carbon_jw08_3.webp', 'assets/showcase/bg/abs_chevron_nn06_3.webp',
  'assets/showcase/bg/abs_duo_jw09_3.webp', 'assets/showcase/bg/abs_frost_cd06_3.webp', 'assets/showcase/bg/abs_glow_du04_3.webp',
  'assets/showcase/bg/abs_halftone_cd05_3.webp', 'assets/showcase/bg/abs_halftone_jw07_3.webp', 'assets/showcase/bg/abs_linear_io01_3.webp',
  'assets/showcase/bg/abs_mesh_ca03_3.webp', 'assets/showcase/bg/abs_mesh_pa07_3.webp', 'assets/showcase/bg/abs_mesh_su01_3.webp',
  'assets/showcase/bg/abs_paperTex_du06_3.webp', 'assets/showcase/bg/abs_rays_ik01_3.webp', 'assets/showcase/bg/abs_rings_cd07_3.webp',
  'assets/showcase/bg/abs_rings_cd08_3.webp', 'assets/showcase/bg/abs_shadowcast_io08_3.webp', 'assets/showcase/bg/abs_stripes_jw07_3.webp',
  'assets/showcase/bg/abs_velvet_ck01_3.webp', 'assets/showcase/bg/abs_velvet_pp02_3.webp', 'assets/showcase/bg/abs_vignetteG_pa01_3.webp',
];
const GRADS = [['midnight', '#04060c', '#1a2444', 160], ['plum', '#0b0510', '#3b1344', 150], ['graphite', '#08080a', '#2b2e35', 170],
  ['deep teal', '#020f12', '#0b3b42', 155], ['ember', '#0b0503', '#3d1709', 165], ['forest', '#020a05', '#0d3a1c', 160]];

/* the voices (DESIGN-LAW 75): each a type pair (FONT_PAIRS), the shapes that
   suit it, its colours and the looks that suit it. G: a gradient preset on
   the claim (badge and CTA wear it too, rule 74); P: a pattern on the claim.
   Not camo: its four fixed military darks are the dark ground's own, and the
   letters dissolved into it. num 'support': the display face's figures are
   weak for a phone number (Sedgwick's 9 reads as a g; the stencil's 4 leaves
   its bridge as a stray dot, "4·994", so Stencil's support is Barlow Condensed,
   narrow enough to hold the number) */
const G = g => ({ fill: 'gradient', gradient: g, outline: 'black', plates: 'match', name: 'gradient ' + g });
const P = p => ({ fill: 'texture', texture: p, outline: 'black', name: 'pattern ' + p });
const NEON = { cyan: '#1ff0ff', lime: '#c6ff1a', yellow: '#ffe81a', pink: '#ff3fa4', violet: '#b45cff', green: '#39ff88', orange: '#ff6a1a' };
const PASTEL = { sky: '#9ee7ff', blush: '#ffb3d9', lilac: '#c9b3ff', mint: '#b3ffd9', butter: '#ffe3a3' };
const VOICES = [
  { key: 'street', fonts: 'street', plates: ['rounded'], ctas: ['band'], looks: ['solid', 'street', 'signature', G('neon')], accent: 'photo' },
  { key: 'bold', fonts: 'bold', plates: ['sharp', 'rounded'], ctas: ['card', 'band'], looks: ['solid', 'outline', G('fire'), G('sunset')], accent: [NEON.yellow, NEON.orange, NEON.cyan] },
  { key: 'stadium', fonts: 'stadium', plates: ['sharp'], fill: 'smoked', ctas: ['band', 'card'], looks: ['solid', 'extrude', 'glow'], accent: [NEON.cyan, NEON.lime, NEON.yellow] },
  { key: 'sport', fonts: 'sport', plates: ['rounded', 'pill'], ctas: ['pill', 'band'], looks: ['solid', 'street', 'anaglyph', P('stripes')], accent: [NEON.lime, NEON.yellow, NEON.orange] },
  { key: 'tech', fonts: 'tech', plates: ['sharp'], fill: 'smoked', ctas: ['card'], looks: ['glow', G('aurora'), G('ocean'), P('circuit')], accent: [NEON.cyan, NEON.violet, NEON.green] },
  { key: 'block', fonts: 'block', plates: ['rounded', 'sharp'], ctas: ['band', 'card'], looks: ['solid', P('money'), G('money'), G('citrus')], accent: [NEON.green, NEON.lime] },
  { key: 'arcade', fonts: 'arcade', plates: ['sharp'], fill: 'smoked', ctas: ['card', 'pill'], looks: ['anaglyph', 'glow', G('vaporwave'), P('grid')], accent: [NEON.pink, NEON.cyan, NEON.violet] },
  { key: 'squad', fonts: 'squad', plates: ['sharp', 'rounded'], ctas: ['band'], looks: ['solid', 'extrude', G('miami')], accent: 'photo' },
  { key: 'comic', fonts: 'comic', plates: ['rounded', 'pill'], ctas: ['pill', 'card'], looks: ['solid', 'multicolor', P('halftone'), P('stars'), 'extrude', P('hearts'), P('sparkles'), G('candy')], accent: [NEON.yellow, NEON.pink, NEON.cyan] },
  { key: 'marker', fonts: 'marker', plates: ['rounded'], ctas: ['band', 'pill'], looks: ['solid', 'outline', G('street')], accent: 'photo', num: 'support' },
  { key: 'retro', fonts: 'serif', plates: ['sharp', 'rounded'], ctas: ['card', 'band'], looks: ['anaglyph', 'extrude', G('miami'), G('sunset')], accent: [NEON.pink, NEON.orange, NEON.yellow] },
  { key: 'luxe', fonts: 'luxe', plates: ['sharp'], fill: 'smoked', ctas: ['card', 'band'], looks: [G('gold'), G('rosegold'), G('chrome'), 'solid'], accent: ['#ffcf4a', PASTEL.butter, PASTEL.blush] },
  { key: 'warp', fonts: 'warp', plates: ['pill', 'rounded'], ctas: ['pill'], looks: [G('dreamsicle'), G('peach'), G('citrus'), 'solid'], accent: [NEON.orange, NEON.yellow, PASTEL.butter] },
  { key: 'stencil', fonts: 'stencil', plates: ['sharp'], ctas: ['band', 'card'], looks: ['solid', 'extrude', P('stripes')], accent: [NEON.lime, NEON.orange], num: 'support' },
  { key: 'aesthetic', fonts: ['bold', 'stadium', 'street', 'tech'], plates: ['pill', 'rounded'], fill: 'smoked', ctas: ['pill', 'card'],
    looks: [G('holo'), G('iridescent'), G('opal'), G('vaporwave'), G('mermaid'), G('y2k'), G('cottoncandy'), G('lavender'), G('oilslick'), G('prism'),
      G('ultraviolet'), G('aqua'), G('sherbet'), G('peach')],
    accent: [PASTEL.sky, PASTEL.blush, PASTEL.lilac, PASTEL.mint] },
];
const DARK_ONLY = new Set(['glow', 'anaglyph', 'extrude']);        // a neon tube or 3-D depth wants a dark ground
/* bright colour in the letters wants a dark ground: on a light or mid photograph a
   gradient or a pattern read 2-3:1 (the pilot); the looks in the line's own tone
   (Solid, Signature) read anywhere, and White + outline on a mid ground */
const lookFits = (l, g) => { const k = lookKey(l); if (g.dark) return true;
  if (g.light) return k === 'solid' || k === 'signature';
  return k === 'solid' || k === 'signature' || k === 'outline'; };
const lookKey = l => typeof l === 'string' ? l : l.name;

/* seeded, so the same plan every time */
const mulberry = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

if (cmd === 'plan'){
  const N = +opt('n', 660);
  const { browser, page } = await openStudio();
  /* what each ground is: its light (the claim's rows, as the composer reads
     them) and how dark it is overall */
  const info = await page.evaluate(async (photos) => {
    const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const out = {};
    for (const src of photos){
      const el = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
      if (!el){ out[src] = null; continue; }
      const c = document.createElement('canvas'); c.width = c.height = 108; const x = c.getContext('2d');
      const k = Math.max(108 / el.width, 108 / el.height); x.drawImage(el, (108 - el.width * k) / 2, (108 - el.height * k) / 2, el.width * k, el.height * k);
      const d = x.getImageData(0, 0, 108, 108).data, L = [];
      for (let i = 0; i < d.length; i += 4) L.push(0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]));
      const top = L.slice(6 * 108, 44 * 108).sort((a, b) => a - b), all = L.slice().sort((a, b) => a - b);
      out[src] = { top: top[top.length >> 1], med: all[all.length >> 1], w: el.width, h: el.height };
    }
    return out;
  }, PHOTOS);
  /* what each display face can set: the size its caps reach 10% of the card
     at (rule 68), and at that size which claims fit inside the margins with
     room for which badge beside the second line (rule 69) */
  const FIT = await page.evaluate(async (claims, badges) => {
    const out = {};
    for (const p of FONT_PAIRS){
      const [df, dw] = p.display, [sf, lw] = p.support;
      await ensureFont(df); await ensureFont(sf);
      await Promise.all([document.fonts.load(dw + ' 100px "' + df + '"'), document.fonts.load(lw + ' 26px "' + sf + '"')]).catch(() => {});
      const x = document.createElement('canvas').getContext('2d');
      x.font = dw + ' 100px "' + df + '"';
      const cap = x.measureText('H').actualBoundingBoxAscent / 100, S = Math.ceil(112 / cap);
      x.font = dw + ' ' + S + 'px "' + df + '"';
      const wOf = t => x.measureText(t).width - 0.01 * S * (t.length - 1) + 0.1 * S;          // charSpacing -10, and an outline's width
      x.font = lw + ' 26px "' + sf + '"';
      const bw = t => 22 + 40 + 14 + x.measureText(t).width + 0.09 * 26 * (t.length - 1) + 30;
      const bws = Object.fromEntries(badges.map(b => [b[0], bw(b[0])]));
      x.font = dw + ' ' + S + 'px "' + df + '"';
      /* the claim spelled as the owner writes it (faceGlyphs): "iPHONE" needs a
         lowercase i, "#1" a one that is not an I */
      const gl = faceGlyphs(df, dw);
      const ok = {};
      claims.forEach((c, i) => {
        const t = c.join(' ');
        if ((/i/.test(t) && !gl.dotI) || (/1/.test(t) && gl.oneVsI < 0.2)) return;
        if (wOf(c[0]) > 912 || wOf(c[1]) > 912 || 90 + 1.66 * S > 396) return;
        ok[c.join(' ')] = badges.filter(b => 84 + wOf(c[1]) + 0.2 * S + bws[b[0]] <= 1080 - 65).map(b => b[0]);
      });
      /* the number's shape in each face: ink width over ink height */
      const ratio = f => { x.font = f; const m = x.measureText('(562) 999-4994'); return +((m.actualBoundingBoxLeft + m.actualBoundingBoxRight) / (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent)).toFixed(2); };
      out[p.key] = { S, cap: +cap.toFixed(3), ok, dotI: gl.dotI, oneVsI: gl.oneVsI, numRatio: ratio(dw + ' 100px "' + df + '"'), numRatioS: ratio(lw + ' 100px "' + sf + '"') };
    }
    return out;
  }, CLAIMS, BADGES);
  await browser.close();
  writeFileSync(OUT + 'fit.json', JSON.stringify(FIT, null, 1));
  const GROUNDS = PHOTOS.filter(s => info[s]).map(s => ({ kind: 'photo', src: s, light: info[s].top > 0.3, dark: info[s].med < 0.12, med: +info[s].med.toFixed(3) }))
    .concat(GRADS.map(([name, c1, c2, a]) => ({ kind: 'grad', name, c1, c2, a, light: false, dark: true, med: 0.01 })));
  const gKey = g => g.kind === 'photo' ? g.src : 'grad:' + g.name;
  const rnd = mulberry(20260929), count = {};
  const bump = (dim, k, w) => { count[dim] = count[dim] || {}; count[dim][k] = (count[dim][k] || 0) + 1 / (w || 1); };
  let pending = [];                                   // coverage counts only what is kept
  const least = (dim, opts, keyOf, wOf) => {
    const c = count[dim] || {}, keyed = opts.map(o => ({ o, k: keyOf(o), w: wOf ? wOf(o) : 1 }));
    const min = Math.min(...keyed.map(x => (c[x.k] || 0) * x.w / x.w));
    const pool = keyed.filter(x => (c[x.k] || 0) <= min + 1e-9);
    const pick = pool[Math.floor(rnd() * pool.length)];
    pending.push([dim, pick.k, pick.w]);
    return pick.o;
  };
  const seen = new Set(), plan = [];
  let guard = 0;
  while (plan.length < N && guard++ < N * 40){
    pending.forEach(([d, k, w]) => bump(d, k, w * 50));   // the last attempt failed: a light mark
    pending = [];
    const voice = least('voice', VOICES, v => v.key);
    const look = least('look:' + voice.key, voice.looks, lookKey);
    /* the ground suits the look: bright colour in the letters on a dark ground,
       or on a mid one dimmed under a heavier shade; the line's own tone anywhere */
    const okG = GROUNDS.filter(g => lookFits(look, g) || (!g.light && !DARK_ONLY.has(lookKey(look))) || (DARK_ONLY.has(lookKey(look)) && !g.light));
    const ground0 = least('ground', okG, gKey);
    const ground = !ground0.dark && !lookFits(look, ground0) ? Object.assign({}, ground0, { dim: true, dark: true }) : ground0;
    const fontsKey = Array.isArray(voice.fonts) ? least('fonts:' + voice.key, voice.fonts, f => f) : voice.fonts;
    const fit = FIT[fontsKey] || { ok: {} };
    const claims = CLAIMS.filter(c => fit.ok[c.join(' ')] && fit.ok[c.join(' ')].length);
    if (!claims.length) continue;
    const claim = least('claim', claims, c => c.join(' '));
    const badges = badgesFor(claim).filter(b => fit.ok[claim.join(' ')].includes(b[0]));
    if (!badges.length) continue;
    const badge = least('badge', badges, b => b[0]);
    const phone = least('phone', PHONES, p => p[0], p => p[1])[0];
    /* the CTAs whose width can hold the number at 70% of the band's height in this face:
       the full band is 944px wide inside the guides and its air, a card or pill 820 */
    /* the number at the audit's size (its letters 66% of the band's height inside the
       guides): 124px tall must fit 935px of a band or 820px of a card or pill, in the
       display face, or else in the support face (still two faces, rule 70) */
    const holds = (r, s) => (r || 99) * 124 <= (s === 'band' ? 935 : 820);
    const dispNum = voice.num !== 'support';
    let ctas = voice.ctas.filter(s => (dispNum && holds(fit.numRatio, s)) || holds(fit.numRatioS, s));
    if (!ctas.length && ((dispNum && holds(fit.numRatio, 'band')) || holds(fit.numRatioS, 'band'))) ctas = ['band'];   // the approved band holds what a card cannot
    if (!ctas.length) continue;
    const plateShape = least('plate:' + voice.key, voice.plates, s => s), ctaShape = least('cta:' + voice.key, ctas, s => s);
    const outline = least('outline:' + voice.key, [false, true], o => String(o));   // with and without an outline, half each
    const numFace = dispNum && holds(fit.numRatio, ctaShape) ? 'display' : 'support';
    const key = [voice.key, fontsKey, gKey(ground), lookKey(look), claim.join(' '), badge[0], phone, plateShape, ctaShape, outline].join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    pending.forEach(([d, k, w]) => bump(d, k, w)); pending = [];
    const id = 'vb-' + String(plan.length + 1).padStart(4, '0');
    const accent = voice.accent === 'photo' ? (ground.kind === 'grad' ? NEON.cyan : 'photo')
      : ground.kind === 'grad' ? voice.accent[plan.length % voice.accent.length] : { from: voice.accent };
    plan.push({ id, voice: voice.key, fonts: fontsKey, ground, look: look === 'solid' ? null : look, lookName: lookKey(look), claim, badge, phone,
      plate: { shape: plateShape, fill: voice.fill || 'solid', outline }, cta: { shape: ctaShape, outline }, accent, numFace });
  }
  writeFileSync(OUT + 'plan.json', JSON.stringify(plan, null, 1));
  const tally = dim => Object.entries(plan.reduce((m, p) => { const k = dim(p); m[k] = (m[k] || 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]).map(([k, n]) => k.replace(/^.*\//, '') + ' ' + n).join(', ');
  console.log('planned ' + plan.length + ' variants');
  console.log('faces: ' + Object.entries(FIT).map(([k, f]) => k + ' ' + f.S + 'px ' + Object.keys(f.ok).length + '/7' + (f.dotI ? '' : ' (no lowercase i)') + (f.oneVsI < 0.2 ? ' (1 reads as I)' : '')).join(', '));
  ['voice', 'lookName', 'fonts'].forEach(d => console.log(d + ': ' + tally(p => p[d])));
  console.log('claim: ' + tally(p => p.claim.join(' ')));
  console.log('badge: ' + tally(p => p.badge[0]));
  console.log('phone: ' + tally(p => p.phone));
  console.log('ground: ' + tally(p => p.ground.kind === 'photo' ? p.ground.src : 'grad ' + p.ground.name));
  console.log('number face: ' + tally(p => p.numFace) + ' | dimmed grounds: ' + plan.filter(p => p.ground.dim).length);
  console.log('plate: ' + tally(p => p.plate.shape + (p.plate.outline ? '+outline' : '')) + ' | cta: ' + tally(p => p.cta.shape));
  process.exit(0);
}

const plan = JSON.parse(readFileSync(OUT + 'plan.json', 'utf8'));
const LIMIT = +opt('limit', 0);
const IDS = opt('ids', '') ? new Set(opt('ids').split(',')) : null;         // --ids=vb-0003,vb-0010: just these
const mine = plan.filter((p, i) => IDS ? IDS.has(p.id) : i % SHARDS === SHARD).slice(0, LIMIT || undefined);

if (cmd === 'compose'){
  const base = JSON.parse(readFileSync(ROOT + 'assets/showcase/tpl/' + BASE_ID + '.json', 'utf8'));
  const card0 = JSON.parse(readFileSync(ROOT + 'assets/showcase/index.json', 'utf8')).find(c => c.id === BASE_ID);
  const { browser, page } = await openStudio();
  const pairs = await page.evaluate(() => FONT_PAIRS);
  const results = [];
  for (const p of mine){
    if (existsSync(LABDIR + p.id + '.json') && existsSync(THUMBS + p.id + '.webp') && !args.includes('--force')){ results.push({ id: p.id, skipped: true }); continue; }
    const rec = JSON.parse(JSON.stringify(base));
    rec.id = p.id;
    rec.tpl.bg = p.ground.kind === 'photo'
      ? Object.assign({}, base.tpl.bg, { src: p.ground.src, scrim: p.ground.light ? 0 : p.ground.dim ? 0.5 : 0.18 })
      : { type: 'gradient', c1: p.ground.c1, c2: p.ground.c2, a: p.ground.a };
    const fp = pairs.find(f => f.key === p.fonts);
    const V = { claim: p.claim, badge: p.badge, accent: p.accent, product: { src: p.phone }, fonts: fp && { display: fp.display, support: fp.support, num: p.numFace },
      plate: p.plate, cta: p.cta, look: p.look || undefined, tag: p.voice + ' / ' + p.lookName, thumbPx: 560 };
    const t0 = Date.now();
    const r = await page.evaluate(composeInPage, rec, p.id, V, MICRO).catch(e => ({ err: String(e) }));
    if (r.err){ results.push({ id: p.id, err: r.err }); console.log(p.id, 'FAILED', r.err); continue; }
    r.rec.restaged = { by: 'scripts/variant_board.mjs', at: '2026-09-29', base: BASE_ID, rules: [68, 69, 70, 71, 72, 73, 74, 75, 76], variant: V.tag };
    const card = Object.assign({}, card0, { id: p.id, accent: r.accent, name: p.id + ' (' + p.voice + ')', thumb: undefined });
    writeFileSync(LABDIR + p.id + '.json', JSON.stringify({ card, rec: Object.assign({}, r.rec, { id: p.id }) }));
    writeFileSync(THUMBS + p.id + '.webp', Buffer.from(r.webp.split(',')[1], 'base64'));
    results.push({ id: p.id, accent: r.accent, S: r.S, faces: r.faces, crit: r.crit, ms: Date.now() - t0 });
    console.log(p.id, p.voice.padEnd(9), (p.lookName || '').padEnd(20), p.claim.join(' ').padEnd(22), p.badge[0].padEnd(14), 'headline ' + r.S + 'px', r.accent, (Date.now() - t0) + 'ms');
  }
  writeFileSync(OUT + 'compose-' + SHARD + '.json', JSON.stringify(results, null, 1));
  await browser.close();
  process.exit(0);
}

if (cmd === 'audit'){
  const ids = mine.map(p => p.id).filter(id => existsSync(LABDIR + id + '.json') && (args.includes('--force') || !existsSync(AUDIT + id + '.json')));
  // in batches, so one stuck page cannot sink the shard
  for (let i = 0; i < ids.length; i += 20){
    const batch = ids.slice(i, i + 20);
    /* --fail-fast unless --full: a failing card is dropped, so its audit stops at the first failing view; a passing card is always audited in every view */
    try { execFileSync('node', [ROOT + 'scripts/audit_card.mjs', '--lab', ...(args.includes('--full') ? [] : ['--fail-fast']), ...batch], { stdio: 'ignore', timeout: 20 * 90000 }); } catch (e){ /* exit 1: some failed; the JSONs say which */ }
    console.log('shard ' + SHARD + ': audited ' + Math.min(i + 20, ids.length) + '/' + ids.length);
  }
  process.exit(0);
}

if (cmd === 'collect'){
  const KEEP = +opt('keep', 500);
  const SITE = OUT + 'site/';
  mkdirSync(SITE + 't/', { recursive: true });
  const pass = [], why = {};
  /* each pair's faces as the engine names them (app.js FONT_PAIRS) */
  const FACES = {};
  for (const m of readFileSync(ROOT + 'app.js', 'utf8').matchAll(/\{ key: '(\w+)',\s*name: '[^']*',\s*display: \['([^']+)'[^\]]*\],\s*support: \['([^']+)'/g)) FACES[m[1]] = m[2] + ' + ' + m[3];
  for (const p of plan){
    const aj = AUDIT + p.id + '.json';
    if (!existsSync(aj) || !existsSync(THUMBS + p.id + '.webp')){ why.missing = (why.missing || 0) + 1; continue; }
    const a = JSON.parse(readFileSync(aj, 'utf8'));
    const failed = a.checks.filter(c => !c.pass);
    if (failed.length){ failed.forEach(c => { const k = c.where.split(' ')[0] + ': ' + c.name; why[k] = (why[k] || 0) + 1; }); continue; }
    const lab = JSON.parse(readFileSync(LABDIR + p.id + '.json', 'utf8'));
    pass.push({ id: p.id, voice: p.voice, fonts: p.fonts, faces: FACES[p.fonts] || p.fonts, look: p.lookName, claim: p.claim.join(' '), badge: p.badge[0], phone: p.phone.replace(/^.*qs-iphone-|\.webp$/g, ''),
      ground: p.ground.kind === 'photo' ? p.ground.src.replace(/^.*\//, '').replace(/\.[a-z]+$/, '') : 'gradient ' + p.ground.name, light: !!p.ground.light,
      plate: p.plate.shape + (p.plate.fill === 'smoked' ? ' smoked' : ''), cta: p.cta.shape, outline: p.plate.outline, accent: lab.card.accent, checks: a.checks.length });
  }
  /* the kept set: the voices in turn, each in plan order (the planner balanced
     every prefix), so a voice whose cards fail more often is not crowded out */
  const byVoice = {}; pass.forEach(r => { (byVoice[r.voice] = byVoice[r.voice] || []).push(r); });
  const queues = Object.values(byVoice), picked = new Set();
  for (let k = 0; picked.size < KEEP && queues.some(q => q.length > k); k++) queues.forEach(q => { if (q[k] && picked.size < KEEP) picked.add(q[k].id); });
  const rows = pass.filter(r => picked.has(r.id));      // in plan order, the board mixes its voices
  rows.forEach(r => copyFileSync(THUMBS + r.id + '.webp', SITE + 't/' + r.id + '.webp'));
  copyFileSync(ROOT + 'scripts/board_page.html', SITE + 'index.html');      // the board page (published as an artifact with a db for picks)
  writeFileSync(SITE + 'board.json', JSON.stringify(rows));
  const fails = Object.entries(why).sort((a, b) => b[1] - a[1]);
  const perVoice = Object.fromEntries(Object.entries(byVoice).map(([v, q]) => [v, q.length + ' passed, ' + rows.filter(r => r.voice === v).length + ' kept']));
  writeFileSync(OUT + 'collect.json', JSON.stringify({ kept: rows.length, passed: pass.length, planned: plan.length, perVoice, why: fails }, null, 1));
  console.log('kept ' + rows.length + ' of ' + pass.length + ' passed (' + plan.length + ' planned); not kept: ' + fails.map(([k, n]) => k + ' ×' + n).join('; '));
  process.exit(rows.length >= KEEP ? 0 : 1);
}
if (cmd === 'thumbs'){
  /* the board's pictures: each kept card painted again from its audited record,
     as renderThumb paints it but straight at --px (800: crisp across a phone and
     in the lightbox, where the composer's 560px proof read soft) and without
     renderThumb's JPEG step, so small type is compressed once */
  const PX = +opt('px', 800), Q = +opt('q', 0.88), SITE = OUT + 'site/';
  const rows = JSON.parse(readFileSync(SITE + 'board.json', 'utf8'));
  const ids = rows.map(r => r.id).filter((id, i) => IDS ? IDS.has(id) : i % SHARDS === SHARD);
  mkdirSync(SITE + 't/', { recursive: true });
  const { browser, page } = await openStudio();
  let n = 0;
  for (const id of ids){
    const lab = JSON.parse(readFileSync(LABDIR + id + '.json', 'utf8'));
    const webp = await page.evaluate(async (rec, id, PX, Q) => {
      const t = await __sc.prep(rec, id);
      const sc = new fabric.StaticCanvas(null, { width: TPL_W, height: TPL_H, renderOnAddRemove: false });
      const bgi = t.bg.type === 'image' ? freshBgImage(t.bg.src, t.bg.blur, t.bg.grade) : null;
      if (bgi){
        sc.setBackgroundImage(coverImage(bgi, TPL_W, TPL_H), () => {});
        if (t.bg.scrim) sc.add(scrimRect(t.bg.scrim, TPL_W, TPL_H, t.bg.scrimColor, t.bg.scrimMode));
      } else sc.add(bgRectFor(t.bg.type === 'image' ? (t.bg.fallback || { type: 'solid', c: '#101014' }) : t.bg, TPL_W, TPL_H));
      t.layers.forEach(l => sc.add(buildLayer(l, t.id)));
      alignPass(sc, TPL_W, TPL_H);
      applyCardLook(sc, t, TPL_W, TPL_H, PX / TPL_W);
      sc.renderAll();
      const png = sc.toDataURL({ format: 'png', multiplier: PX / TPL_W });
      sc.dispose();
      const img = await new Promise(res => { const el = new Image(); el.onload = () => res(el); el.onerror = () => res(null); el.src = png; });
      const cv = document.createElement('canvas'); cv.width = cv.height = PX; cv.getContext('2d').drawImage(img, 0, 0);
      return cv.toDataURL('image/webp', Q);
    }, lab.rec, id, PX, Q);
    writeFileSync(SITE + 't/' + id + '.webp', Buffer.from(webp.split(',')[1], 'base64'));
    if (++n % 25 === 0) console.log('shard ' + SHARD + ': ' + n + '/' + ids.length + ' pictures');
  }
  await browser.close();
  process.exit(0);
}
if (cmd === 'review'){
  /* legibility as a reader meets it (fillLegibility, the measure the audit
     gates on since 2026-09-29): each claim line's FILL against the ground under
     it, pixel by pixel, ranked by the share of its letters lost (neither
     lightness nor colour sets them apart); an outline that draws the letters
     counts. A diagnostic for the kept set: the worst first. */
  const rows = existsSync(OUT + 'site/board.json') ? JSON.parse(readFileSync(OUT + 'site/board.json', 'utf8')) : [];
  const ids = IDS ? [...IDS] : rows.map(r => r.id);
  const { browser, page } = await openStudio();
  const res = [];
  for (const id of ids){
    const lab = JSON.parse(readFileSync(LABDIR + id + '.json', 'utf8'));
    const r = await page.evaluate(async (rec, id) => {
      const t = await __sc.prep(rec, id), { sc } = __sc.paint(t);
      const out = sc.getObjects().filter(o => o.pgRole === 'headline' && o.visible !== false && /\S/.test(o.text || ''))
        .map(o => Object.assign({ text: o.text }, fillLegibility(sc, o) || { score: 0 }));
      sc.dispose();
      return out;
    }, lab.rec, id);
    /* as the audit judges it: the share of a line's letters lost to the ground, unless an outline draws them */
    const lostOf = l => l.o50 != null && l.o50 >= 4.5 ? 0 : (l.lost == null ? 1 : l.lost);
    res.push({ id, lines: r, lost: Math.max(...r.map(lostOf)) });
  }
  await browser.close();
  res.sort((a, b) => b.lost - a.lost);
  writeFileSync(OUT + 'review' + (IDS ? '-ids' : '') + '.json', JSON.stringify(res, null, 1));
  res.slice(0, +opt('show', 40)).forEach(x => console.log(x.id, 'lost ' + (100 * x.lost).toFixed(1) + '%', x.lines.map(l => '"' + l.text + '" lost ' + l.lost + ' g25 ' + l.g25 + (l.o50 != null ? ' outline ' + l.o50 : '')).join(' | ')));
  process.exit(0);
}
console.error('usage: node scripts/variant_board.mjs plan|compose|audit|collect|thumbs|review [--shard=i/n]');
process.exit(2);
