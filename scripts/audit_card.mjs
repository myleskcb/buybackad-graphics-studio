#!/usr/bin/env node
/* AUDIT ONE CARD AGAINST EVERYTHING THE OWNER HAS ASKED FOR — before anyone
 * sees it. Owner, 2026-09-27: "can you audit this graphic and not put out
 * another without 100% validating and self auditing? using all of the factors
 * we're expecting and have mentioned."
 *
 * Every check is measured on pixels the studio itself painted: the gallery
 * painter (renderThumb's sequence), the Easy Mode scene a visitor downloads
 * (openShowcase + renderEzCanvas, square, 3:4 and 9:16), and the video bake.
 * Each check names its DESIGN-LAW rule. A card ships only at 100%.
 *
 *   copy      the headline is a claim (68); the badge is from the bank and
 *             shares no word with the claim (69)
 *   type      two faces (three at most), two weights a face; nothing under
 *             26px; no blurred shadow on small type that sits on a plate (70, 71)
 *   headline  caps at least 10% of the canvas; stacked lines 4-16% of a size
 *             apart; left edges within 2px; 4.5:1 on its ground (54, 68)
 *   badge     hangs from the claim's cap line; mark and words centred on the
 *             pill, padding balanced; the CTA's own colour (69, 74)
 *   steps     plates one width, one height, one gap; numerals centred in their
 *             slot and on one axis; each row's words centred in its plate,
 *             left edges on one line; one set of sizes (72)
 *   CTA       the digits at least 70% of the width inside the margins and 66%
 *             of the band's height inside the guides, centred; 7:1 (53, 74)
 *   product   not mirrored; clear of every word; standing on the band;
 *             inside the guides (73)
 *   card      every word inside the 6% guides (57); no word on another; the
 *             painter moved nothing more than 2px from where it was placed;
 *             at least a third of the photograph shows (the background is a
 *             design asset); the accent reads as neon (reported)
 *   tall      3:4 and 9:16 centre the middle block between the claim and the
 *             band (equal space, 8px), and the phone ends with the steps
 *   paths     Easy Mode square, 3:4 and 9:16 pass the card checks; the video's
 *             frame 0 is the still and its CTA shift passes its own audit (65)
 *
 *   node scripts/audit_card.mjs <cardId…>      (needs :8899; CHROME=, FABRIC_JS=)
 * Writes .render/audit-card/<id>.json and <id>.png. Exit 1 unless every check
 * on every card passes. */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { openStudio } from './_showcase_harness.mjs';
const ROOT = new URL('../', import.meta.url).pathname;
const OUT = ROOT + '.render/audit-card/';
mkdirSync(OUT, { recursive: true });
const ids = process.argv.slice(2).filter(a => !a.startsWith('--'));
/* --lab: the ids are lab records (.render/restage/lab/<id>.json, written by
   restage_steps_flow.mjs --as=…), audited through the same three paths */
const LAB = process.argv.includes('--lab');
if (!ids.length){ console.error('usage: node scripts/audit_card.mjs <cardId…>'); process.exit(2); }

const { browser, page } = await openStudio();
const DEVICES = JSON.parse(readFileSync(ROOT + 'assets/cutouts/devices.json', 'utf8')).devices;
await page.evaluate(d => { window.__devices = d; }, DEVICES);
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(String(e).slice(0, 200)));
await page.evaluate(() => { loadAccount = async () => account; });

// the page-side auditor, installed once
await page.evaluate(() => {
  window.__audit = function(sc, W, H, rec, where){
    const out = [];
    const check = (rule, name, pass, got, want) => out.push({ where, rule, name, pass: !!pass, got, want });
    const objs = sc.getObjects();
    const isText = o => o && (o.type === 'i-text' || o.type === 'text' || o.type === 'textbox');
    const live = o => o && o.visible !== false && (o.opacity == null || o.opacity > 0.05);
    const named = n => objs.find(o => o.name === n && live(o));
    const G = Math.round(0.06 * Math.min(W, H));
    const r1 = v => Math.round(v * 10) / 10;
    // pixel ink of one object, drawn alone (shadow off)
    const bgI = sc.backgroundImage, bgC = sc.backgroundColor, vis = objs.map(o => o.visible);
    const ctx = sc.getContext('2d'), CW = sc.lowerCanvasEl.width, CH = sc.lowerCanvasEl.height, z = CW / W;
    const inkPx = o => {
      if (!o) return null;
      sc.backgroundImage = null; sc.backgroundColor = '';
      objs.forEach(q => { q.visible = q === o; });
      const sh = o.shadow; o.shadow = null; sc.renderAll(); o.shadow = sh;
      const b = o.getBoundingRect(true, true);
      const x0 = Math.max(0, Math.floor((b.left - 4) * z)), y0 = Math.max(0, Math.floor((b.top - 4) * z));
      const w = Math.min(CW - x0, Math.ceil((b.width + 8) * z)), h = Math.min(CH - y0, Math.ceil((b.height + 8) * z));
      if (w <= 0 || h <= 0) return null;
      const d = ctx.getImageData(x0, y0, w, h).data;
      let a = w, c = h, e = -1, f = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 90){ if (x < a) a = x; if (x > e) e = x; if (y < c) c = y; if (y > f) f = y; }
      if (e < 0) return null;
      return { l: (x0 + a) / z, t: (y0 + c) / z, r: (x0 + e + 1) / z, b: (y0 + f + 1) / z };
    };
    const restore = () => { objs.forEach((q, i) => { q.visible = vis[i]; }); sc.backgroundImage = bgI; sc.backgroundColor = bgC; sc.renderAll(); };
    const ink = new Map();
    objs.filter(live).forEach(o => { if (!/^(Vignette|Grain|Scrim|BG|Overlay)$/.test(o.name || '') && o.type !== 'image' || o.pgRole === 'photo') ink.set(o, inkPx(o)); });
    restore();
    const I = o => o && ink.get(o);
    const cx = r => (r.l + r.r) / 2, cy = r => (r.t + r.b) / 2;
    const words = objs.filter(o => live(o) && isText(o) && /\S/.test(o.text || '') && !o.pgKin);
    const heads = words.filter(o => o.pgRole === 'headline').sort((a, b) => a.top - b.top);
    const claim = heads.map(o => o.text).join(' ');
    const fsOf = o => (o.fontSize || 0) * (o.scaleY || 1);
    const badge = named('Badge'), pill = named('Badge Pill'), mark = named('Badge Icon'), band = named('Phone Plate');
    let crit = [];
    const capOf = o => { const c = document.createElement('canvas').getContext('2d'); c.font = o._getFontDeclaration(); return c.measureText('H').actualBoundingBoxAscent * (o.scaleY || 1); };

    try {
    // ── copy
    const CLAIM = /\b(TOP|#1|NO\.?\s?1|BEST|FAST|FASTEST|QUICK|QUICKEST|SELL|BUY|BUYS|BUYER|CASH|PAY|PAYS|PAID|OFFER|TRADE)\b/i;
    check(68, 'headline is a claim', CLAIM.test(claim), claim, 'a claim (TOP / SELL / WE BUY / FAST CASH …), not the item alone');
    const bank = (typeof BADGE_WORDS !== 'undefined' ? BADGE_WORDS : []).map(b => b[0].toUpperCase());
    if (badge){
      check(69, 'badge words from the bank', bank.includes(String(badge.text).toUpperCase()), badge.text, bank.join(' / '));
      const cw = new Set(claim.toUpperCase().split(/[^A-Z0-9#]+/).filter(w => w.length > 1));
      const rep = String(badge.text).toUpperCase().split(/[^A-Z0-9#]+/).filter(w => w.length > 1 && cw.has(w));
      check(69, 'badge repeats no word of the claim', !rep.length, rep.join(',') || 'none', 'none');
    } else check(69, 'badge present', false, 'none', 'a badge');
    } catch (e){ out.push({ where, rule: 0, name: 'section copy measured', pass: false, got: String(e).slice(0, 160), want: 'no error' }); }
    try {
    // ── type
    const fams = [...new Set(words.map(o => o.fontFamily))];
    check(70, 'typefaces', fams.length <= 2, fams.join(' + '), '2 (3 at most)');
    const wts = {}; words.forEach(o => { (wts[o.fontFamily] = wts[o.fontFamily] || new Set()).add(String(o.fontWeight)); });
    const wBad = Object.entries(wts).filter(([f, s]) => s.size > 2).map(([f, s]) => f + ':' + [...s].join('/'));
    check(70, 'weights a face', !wBad.length, Object.entries(wts).map(([f, s]) => f.split(' ')[0] + ' ' + [...s].join('/')).join(', '), '2 at most');
    const small = words.filter(o => fsOf(o) < 26 * W / 1080);
    check(71, 'smallest type', !small.length, r1(Math.min(...words.map(fsOf))) + 'px', '>= 26px at 1080');
    const plates = objs.filter(o => live(o) && o.type === 'rect' && o.width * (o.scaleX || 1) < W * 0.95);
    const onPlate = o => { const c = o.getCenterPoint(); return plates.some(p => { const b = p.getBoundingRect(true, true); return c.x > b.left && c.x < b.left + b.width && c.y > b.top && c.y < b.top + b.height; }); };
    const blurred = words.filter(o => fsOf(o) < 48 && onPlate(o) && o.shadow && (o.shadow.blur || 0) > 2);
    check(71, 'no blurred shadow on small plated type', !blurred.length, blurred.map(o => o.name).join(', ') || 'none', 'none');
    } catch (e){ out.push({ where, rule: 0, name: 'section type measured', pass: false, got: String(e).slice(0, 160), want: 'no error' }); }
    try {
    // ── headline
    if (heads.length){
      const cap = Math.min(...heads.map(capOf));
      const S0 = Math.min(W, H);   // the short side: a 3:4 card is as wide as the square
      check(68, 'headline cap height', cap >= 0.10 * S0, r1(cap) + 'px', '>= ' + r1(0.10 * S0) + 'px');
      for (let k = 1; k < heads.length; k++){
        const a = I(heads[k - 1]), b = I(heads[k]), s = Math.min(fsOf(heads[k - 1]), fsOf(heads[k]));
        if (!a || !b) continue;
        const gap = b.t - a.b;
        check(68, 'headline line gap ' + k, gap >= 0.04 * s && gap <= 0.16 * s, r1(gap) + 'px (' + r1(100 * gap / s) + '%)', '4-16% of the size');
        if ((heads[k].textAlign || 'left') === 'left' && heads[k].originX !== 'center')
          check(68, 'headline left edges ' + k, Math.abs(a.l - b.l) <= 2, r1(a.l) + ' / ' + r1(b.l), 'within 2px');
      }
    }
    crit = typeof taglineCritic === 'function' ? taglineCritic(sc, W, H) : [];
    restore();
    crit.filter(c => c.role === 'headline').forEach(c => check(54, 'headline contrast "' + c.text + '"', c.q75 >= 4.5, c.q75 + ':1', '>= 4.5:1'));
    } catch (e){ out.push({ where, rule: 0, name: 'section headline measured', pass: false, got: String(e).slice(0, 160), want: 'no error' }); }
    try {
    // ── badge
    if (badge && pill && heads.length > 1){
      const P = I(pill), T = I(badge), M = mark && I(mark);
      const h2 = heads[heads.length - 1], capTop = I(h2) ? I(h2).b - capOf(h2) : null;
      if (capTop != null) check(69, 'badge hangs from the cap line', Math.abs(P.t - capTop) <= 3, r1(P.t) + ' vs cap ' + r1(capTop), 'within 3px');
      if (M){
        check(69, 'mark inside the pill', M.l >= P.l + 10 && M.r <= P.r - 10 && M.t >= P.t + 6 && M.b <= P.b - 6, [M.l, M.t, M.r, M.b].map(r1).join(','), 'inside with air');
        check(69, 'mark centred on the pill', Math.abs(cy(M) - cy(P)) <= 2, r1(cy(M) - cy(P)) + 'px', 'within 2px');
        const padL = M.l - P.l, padR = P.r - T.r;
        check(69, 'pill padding balanced', Math.abs(padL - padR) <= 6, r1(padL) + ' / ' + r1(padR), 'within 6px');
      }
      check(69, 'words centred on the pill', Math.abs(cy(T) - cy(P)) <= 2, r1(cy(T) - cy(P)) + 'px', 'within 2px');
      if (band) check(74, 'badge wears the CTA colour', String(pill.fill).toLowerCase() === String(band.fill).toLowerCase(), pill.fill + ' / ' + band.fill, 'equal');
      if (I(h2)) check(69, 'badge clear of the claim', P.l - I(h2).r >= 16, r1(P.l - I(h2).r) + 'px', '>= 16px');
    }
    } catch (e){ out.push({ where, rule: 0, name: 'section badge measured', pass: false, got: String(e).slice(0, 160), want: 'no error' }); }
    try {
    // ── steps
    const rows = [1, 2, 3].map(i => ({ card: named('Step Card ' + i), num: named('Step Num ' + i), lab: named('Step Lab ' + i), mic: named('Step Micro ' + i) })).filter(r => r.card);
    if (rows.length){
      const C = rows.map(r => I(r.card));
      const eq = (arr, tol) => Math.max(...arr) - Math.min(...arr) <= tol;
      check(72, 'plates one width', eq(C.map(c => c.r - c.l), 1), C.map(c => r1(c.r - c.l)).join('/'), 'equal');
      check(72, 'plates one height', eq(C.map(c => c.b - c.t), 1), C.map(c => r1(c.b - c.t)).join('/'), 'equal');
      check(72, 'plates one left edge', eq(C.map(c => c.l), 1), C.map(c => r1(c.l)).join('/'), 'equal');
      if (C.length > 2) check(72, 'plates one gap', eq(C.slice(1).map((c, k) => c.t - C[k].b), 1), C.slice(1).map((c, k) => r1(c.t - C[k].b)).join('/'), 'equal');
      rows.forEach((r, k) => {
        const c = C[k], n = I(r.num), l = I(r.lab), m = I(r.mic);
        if (n){
          check(72, 'numeral ' + (k + 1) + ' inside its plate', n.l >= c.l && n.r <= c.r && n.t >= c.t && n.b <= c.b, [n.l, n.t, n.r, n.b].map(r1).join(','), 'inside ' + [c.l, c.t, c.r, c.b].map(r1).join(','));
          check(72, 'numeral ' + (k + 1) + ' centred on its plate', Math.abs(cy(n) - cy(c)) <= 2, r1(cy(n) - cy(c)) + 'px', 'within 2px');
        }
        if (l && m){
          const top = l.t - c.t, bot = c.b - m.b;
          check(72, 'row ' + (k + 1) + ' words centred in the plate', Math.abs(top - bot) <= 3, r1(top) + ' / ' + r1(bot), 'within 3px');
          check(72, 'row ' + (k + 1) + ' words share a left edge', Math.abs(l.l - m.l) <= 1.5, r1(l.l) + ' / ' + r1(m.l), 'within 1.5px');
        }
      });
      const nums = rows.map(r => I(r.num)).filter(Boolean);
      if (nums.length) check(72, 'numerals on one axis', eq(nums.map(cx), 1.5), nums.map(n => r1(cx(n))).join('/'), 'within 1.5px');
      const labs = rows.map(r => I(r.lab)).filter(Boolean);
      if (labs.length) check(72, 'step words on one left edge', eq(labs.map(l => l.l), 1.5), labs.map(l => r1(l.l)).join('/'), 'within 1.5px');
      ['num', 'lab', 'mic'].forEach(k => { const f = rows.map(r => r[k] && fsOf(r[k])).filter(Boolean); if (f.length) check(72, 'one size for every ' + k, eq(f, 0.5), f.map(r1).join('/'), 'equal'); });
    }
    } catch (e){ out.push({ where, rule: 0, name: 'section steps measured', pass: false, got: String(e).slice(0, 160), want: 'no error' }); }
    try {
    // ── CTA
    const phone = words.find(o => o.pgRole === 'phone');
    if (phone && band){
      const N = I(phone), B = I(band), room = Math.min(B.b, H - G) - Math.max(B.t, G);
      check(53, 'number width', (N.r - N.l) >= 0.70 * (W - 2 * G), r1(N.r - N.l) + 'px', '>= ' + r1(0.70 * (W - 2 * G)) + 'px (70% inside the margins)');
      check(53, 'number height', (N.b - N.t) >= 0.66 * room, r1(N.b - N.t) + 'px', '>= ' + r1(0.66 * room) + 'px (66% of the band inside the guides)');
      // centred on the band as it is seen, as far as the guides allow
      // letters keep 3px off a guide (inkClear in the engine)
      const seen = (Math.max(B.t, 0) + Math.min(B.b, H)) / 2, lo = Math.max(B.t, G + 3), hi = Math.min(B.b, H - G - 3), nh = N.b - N.t;
      const want = Math.max(lo + nh / 2, Math.min(seen, hi - nh / 2));
      check(53, 'number centred', Math.abs(cx(N) - W / 2) <= 3 && Math.abs(cy(N) - want) <= 3,
        r1(cx(N) - W / 2) + ', ' + r1(cy(N) - want), 'within 3px both ways of the seen band (inside the guides)');
      const pc = crit.find(c => c.role === 'phone');
      if (pc) check(54, 'number contrast', pc.q75 >= 7, pc.q75 + ':1', '>= 7:1');
    }
    } catch (e){ out.push({ where, rule: 0, name: 'section CTA measured', pass: false, got: String(e).slice(0, 160), want: 'no error' }); }
    try {
    // ── product
    const prod = objs.find(o => live(o) && o.type === 'image' && o.pgRole === 'photo');
    if (prod){
      const Pr = I(prod);
      check(73, 'product not mirrored', !prod.flipX, prod.flipX ? 'mirrored' : 'as photographed', 'as photographed');
      /* factory original only: the device catalog (assets/cutouts/devices.json) */
      const src = (prod._element && prod._element.src || '').replace(/^.*?(assets\/)/, 'assets/').replace(/[?#].*$/, '');   // no cache-buster
      const dev = (window.__devices || {})[src];
      check(73, 'device is factory original', !!(dev && dev.authentic), src.split('/').pop() + (dev ? ' (' + (dev.model || '') + (dev.color ? ', ' + dev.color : '') + ')' : ' (not in the catalog)'),
        'an authentic device from assets/cutouts/devices.json');
      const hit = words.filter(o => { const w = I(o); if (!w) return false;
        const ox = Math.min(w.r, Pr.r) - Math.max(w.l, Pr.l), oy = Math.min(w.b, Pr.b) - Math.max(w.t, Pr.t); return ox > 2 && oy > 2; });
      [pill].filter(Boolean).forEach(p => { const w = I(p); const ox = Math.min(w.r, Pr.r) - Math.max(w.l, Pr.l), oy = Math.min(w.b, Pr.b) - Math.max(w.t, Pr.t); if (ox > 2 && oy > 2) hit.push(p); });
      check(73, 'product clear of every word', !hit.length, hit.map(o => o.name).join(', ') || 'clear', 'clear');
      if (band){
        const B = I(band), tall = H > W * 1.02;
        const lastPlate = [3, 2, 1].map(i => named('Step Card ' + i)).find(Boolean), LP = lastPlate && I(lastPlate);
        // square: it stands on the band; a tall card centres its middle block, and the phone ends with the steps
        const onBand = Pr.b >= B.t - 4 && Pr.b <= B.t + 60, withSteps = tall && LP && Math.abs(Pr.b - LP.b) <= 6;
        const fill = sc.__fill || {}, FP = named('Step Card 1') && I(named('Step Card 1'));
        const firstInk = FP ? Math.min(...words.filter(o => { const c = o.getCenterPoint(); return c.x > FP.l && c.x < FP.r && c.y > FP.t && c.y < FP.b; }).map(o => I(o) ? I(o).t : 1e9)) : null;
        // grown: it stands on the list, its foot in plate 1's empty top strip
        const onList = tall && fill.decision === 'grow' && fill.arrangement !== 'on top' && FP && Pr.b >= FP.t - 2 && Pr.b <= firstInk - 4;
        /* on top: centred on the card, clear above the first plate, clear below the claim
           (owner, 2026-09-28: "center the asset and scoot it up 10%") */
        const claimB = Math.max(...heads.map(h => I(h) ? I(h).b : 0), pill ? I(pill).b : 0);
        const floating = tall && fill.decision === 'grow' && fill.arrangement === 'on top' && FP
          && Math.abs(cx(Pr) - W / 2) <= 4 && Pr.b <= FP.t - 4 && Pr.t >= claimB + 8;
        check(73, tall ? 'product stands on the band, ends with the steps, stands on the list, or floats centred above it' : 'product stands on the band', onBand || withSteps || onList || floating,
          r1(Pr.b - B.t) + 'px into the band' + (LP ? ', ' + r1(Pr.b - LP.b) + 'px past the last step' : '') + (FP ? ', foot ' + r1(Pr.b - FP.t) + 'px into plate 1 (words at ' + r1(firstInk - FP.t) + ')' : ''),
          tall ? 'on the band, with the steps, or on plate 1 above its words' : '0-60px');
        if (tall){
          /* the tall-format call, re-measured here rather than taken from the engine: the
             photograph's subject rows (at least half its peak detail) are left to it */
          const q = 4, cw = Math.round(W / q), ch = Math.round(H / q), cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
          const saved = objs.map(o => o.visible), col = sc.backgroundColor; objs.forEach(o => { o.visible = false; }); sc.backgroundColor = '';
          cv.getContext('2d').drawImage(sc.toCanvasElement(1 / q), 0, 0, cw, ch);
          objs.forEach((o, i) => { o.visible = saved[i]; }); sc.backgroundColor = col; sc.renderAll();
          const dd = cv.getContext('2d').getImageData(0, 0, cw, ch).data, Lm = new Float32Array(cw * ch);
          for (let i = 0; i < cw * ch; i++) Lm[i] = 0.2126 * dd[i * 4] + 0.7152 * dd[i * 4 + 1] + 0.0722 * dd[i * 4 + 2];
          const rows = [];
          for (let y0 = 0; y0 < ch; y0 += 24){ let sm = 0, n = 0; for (let y = y0; y < Math.min(ch - 1, y0 + 24); y++) for (let x = 0; x < cw - 1; x++){ const i = y * cw + x; sm += Math.abs(Lm[i + 1] - Lm[i]) + Math.abs(Lm[i + cw] - Lm[i]); n++; } rows.push({ t: y0 * q, b: Math.min(ch, y0 + 24) * q, v: n ? sm / n : 0 }); }
          const peak = Math.max(...rows.map(r => r.v)), subj = rows.filter(r => r.v >= 0.5 * peak && r.v >= 3);
          const claimBot = Math.max(...heads.map(h => I(h) ? I(h).b : 0), pill ? I(pill).b : 0);
          const plates = [1, 2, 3].map(i => named('Step Card ' + i)).filter(Boolean).map(I);
          // a phone floated over the photograph by the owner's call is the ad's hero; the list stays off the subject
          const withProd = fill.arrangement !== 'on top';
          const cTop = Math.min(withProd ? Pr.t : 1e9, ...plates.map(p => p.t)), cBot = Math.max(withProd ? Pr.b : 0, ...plates.map(p => p.b));
          const covered = subj.filter(r => r.t >= claimBot && r.b > cTop + 8 && r.t < cBot - 8);
          out.push({ where, rule: 0, name: 'tall-format call (reported)', pass: true, got: (fill.decision || 'none') + ': ' + (fill.reason || ''), want: 'info' });
          check(0, 'the design leaves the photograph\u2019s subject rows to it', !covered.length || !['grow', 'fit'].includes(fill.decision),
            covered.length ? covered.map(r => r.t + '-' + r.b).join(', ') : 'none covered', 'no subject row under grown content');
          if (fill.decision === 'grow'){
            check(0, 'the list grew', (fill.scale || 1) >= 1.05, 'x' + (fill.scale || 1), '>= 1.05');
          }
        }
        if (tall && LP && !['grow', 'fit'].includes((sc.__fill || {}).decision)){
          /* the middle block centred between the claim and the band (owner, 2026-09-28: "have the
             center content scooted up in order to properly center it otherwise there is a large gap") */
          const plates = [1, 2, 3].map(i => named('Step Card ' + i)).filter(Boolean).map(I);
          const top = Math.min(Pr.t, ...plates.map(p => p.t)), bot = Math.max(Pr.b, ...plates.map(p => p.b));
          const claimBot = Math.max(...heads.map(h => I(h) ? I(h).b : 0), pill ? I(pill).b : 0);
          const above = top - claimBot, below = B.t - bot;
          check(0, 'middle block centred between the claim and the band', Math.abs(above - below) <= 8, r1(above) + ' above / ' + r1(below) + ' below', 'within 8px');
        }
      }
      check(73, 'product inside the guides', Pr.l >= G - 2 && Pr.r <= W - G + 2 && Pr.t >= G - 2, [Pr.l, Pr.r].map(r1).join('-'), G + '-' + (W - G));
    }
    } catch (e){ out.push({ where, rule: 0, name: 'section product measured', pass: false, got: String(e).slice(0, 160), want: 'no error' }); }
    try {
    // ── card
    const outside = words.filter(o => { const w = I(o); return w && (w.l < G - 1 || w.t < G - 1 || w.r > W - G + 1 || w.b > H - G + 1); });
    check(57, 'every word inside the guides', !outside.length, outside.map(o => o.name + ' ' + [I(o).l, I(o).t, I(o).r, I(o).b].map(Math.round).join(',')).join('; ') || 'all inside', 'inside ' + G + 'px');
    const pairs = [];
    for (let i = 0; i < words.length; i++) for (let j = i + 1; j < words.length; j++){
      const a = I(words[i]), b = I(words[j]); if (!a || !b) continue;
      const ox = Math.min(a.r, b.r) - Math.max(a.l, b.l), oy = Math.min(a.b, b.b) - Math.max(a.t, b.t);
      if (ox > 1 && oy > 1) pairs.push(words[i].name + ' / ' + words[j].name);
    }
    check(58, 'no word on another', !pairs.length, pairs.join('; ') || 'none', 'none');
    if (rec && rec.built){
      /* where each layer stood as built against where the layout passes left it:
         a pass that moves a placed layer is second-guessing the design */
      const drift = [];
      objs.forEach(o => { const b0 = rec.built[o.name]; if (!b0 || o.pgRole === 'phone') return;
        const c = o.getCenterPoint(), d = Math.hypot(c.x - b0[0], c.y - b0[1]), s = (o.scaleX || 1) / b0[2];
        if (d > 2 || Math.abs(s - 1) > 0.01) drift.push(o.name + ' ' + r1(d) + 'px (' + r1(c.x - b0[0]) + ',' + r1(c.y - b0[1]) + ')' + (Math.abs(s - 1) > 0.01 ? ' x' + s.toFixed(3) : '')); });
      check(0, 'the layout passes moved nothing', !drift.length, drift.join(', ') || 'none', 'every layer within 2px of where it was built');
    }
    {
      // the photograph that shows: pixels no opaque layer covers
      sc.backgroundImage = null; sc.backgroundColor = '';
      objs.forEach(q => { q.visible = live(q) && !/^(Vignette|Grain|Scrim|BG|Overlay)$/.test(q.name || '') && !q.pgScrim && !q.pgBgRect; });
      sc.renderAll();
      const d = ctx.getImageData(0, 0, CW, CH).data; let open = 0, n = 0;
      for (let i = 3; i < d.length; i += 16){ n++; if (d[i] < 77) open++; }
      restore();
      check(0, 'the photograph shows', open / n >= 0.33, r1(100 * open / n) + '%', '>= 33% of the card');
    }
    if (band && typeof hexToOklch === 'function' && /^#/.test(band.fill)){
      const o = hexToOklch(band.fill);
      out.push({ where, rule: 75, name: 'accent reads as neon (reported)', pass: true, got: band.fill + ' L' + r1(o.L * 100) / 100 + ' C' + r1(o.C * 100) / 100 + (o.C >= 0.12 && o.L >= 0.75 ? ' neon' : ' not neon'), want: 'info' });
    }
    } catch (e){ out.push({ where, rule: 0, name: 'section card measured', pass: false, got: String(e).slice(0, 160), want: 'no error' }); }
    return out;
  };
});

const report = [];
let allPass = true;
for (const id of ids){
  const labRec = LAB ? JSON.parse(readFileSync(ROOT + '.render/restage/lab/' + id + '.json', 'utf8')) : null;
  const rec = LAB ? labRec.rec : JSON.parse(readFileSync(ROOT + 'assets/showcase/tpl/' + id + '.json', 'utf8'));
  const r = await page.evaluate(async (id, rec, lab) => {
    const res = [];
    if (lab){                                   // a lab record opens like any showcase card
      await scLoadIndex();
      SHOWCASE.byId[id] = lab.card; SHOWCASE.records[id] = lab.rec;
    }
    // 1. the gallery painter
    const t = lab ? await __sc.prep(lab.rec, id) : await __sc.load(id);
    // renderThumb's sequence, with each layer's built position recorded before the layout passes
    const sc = new fabric.StaticCanvas(null, { width: TPL_W, height: TPL_H, renderOnAddRemove: false });
    const bgi = t.bg.type === 'image' ? freshBgImage(t.bg.src, t.bg.blur, t.bg.grade) : null;
    if (bgi){ sc.setBackgroundImage(coverImage(bgi, TPL_W, TPL_H), () => {}); if (t.bg.scrim) sc.add(scrimRect(t.bg.scrim, TPL_W, TPL_H, t.bg.scrimColor, t.bg.scrimMode)); }
    const built = {};
    t.layers.forEach(l => { const o = buildLayer(l, t.id); sc.add(o); o.setCoords(); const c = o.getCenterPoint(); built[o.name] = [c.x, c.y, o.scaleX || 1]; });
    alignPass(sc, TPL_W, TPL_H); sc.renderAll();
    res.push(...__audit(sc, TPL_W, TPL_H, { built }, 'gallery'));
    const png = sc.toDataURL({ format: 'png' });
    sc.dispose();
    // 2. Easy Mode, the scene a visitor downloads, square and 3:4
    await scLoadIndex();
    account = { email: 'audit@local', role: 'admin', plan: 'pro' };
    await openShowcase(id);
    if (ez.tpl !== 'sc-' + id) res.push({ where: 'easy', rule: 67, name: 'Easy Mode opened the card', pass: false, got: ez.tpl, want: 'sc-' + id });
    $('ez-phone').value = '(562) 999-4994';
    await document.fonts.ready; try { fabric.util.clearFabricFontCache(); } catch (e){}
    await new Promise(r => setTimeout(r, 600));
    ez.tag = { look: 'solid', gradient: null, angle: 90, outline: 'auto', effect: 'auto' };
    const pngs = {};
    for (const fmt of ['square', 'three4', 'story']){
      if (!FORMATS[fmt]) continue;
      const s2 = renderEzCanvas(1080, 'png', undefined, undefined, fmt, true);
      const W = s2.width, H = s2.height;
      res.push(...__audit(s2, W, H, null, 'easy ' + fmt).filter(c => !/^(the painter|plates one|numerals on one)/.test(c.name) || fmt === 'square'));
      // 3. the video, from the square scene
      if (fmt === 'square'){
        const bake = motionBake(s2, W, H, W, H);
        const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        const z0 = motionFrameZero(s2, bake, cv.getContext('2d', { willReadFrequently: true }));
        res.push({ where: 'video', rule: 65, name: 'frame 0 is the still', pass: !!z0.ok, got: z0.off + ' px off, block ' + z0.block, want: 'ok' });
        res.push({ where: 'video', rule: 65, name: 'the CTA shift passes its audit', pass: !!bake.cta, got: bake.cta ? bake.cta.parts.map(p => p.key).join('+') + ', legibility ' + Math.min(...bake.cta.legibility.map(l => l.q75)).toFixed(2) : String(bake.ctaOff).slice(0, 160), want: 'a CTA' });
      }
      pngs[fmt] = s2.toDataURL({ format: 'png' });
      s2.dispose();
    }
    return { res, png, pngs };
  }, id, rec, labRec).catch(e => ({ res: [{ where: 'harness', rule: 0, name: 'ran', pass: false, got: String(e).slice(0, 300), want: 'no error' }] }));
  if (r.png) writeFileSync(OUT + id + '.png', Buffer.from(r.png.split(',')[1], 'base64'));
  Object.entries(r.pngs || {}).forEach(([f, u]) => writeFileSync(OUT + id + '-easy-' + f + '.png', Buffer.from(u.split(',')[1], 'base64')));
  const checks = r.res;
  if (pageErrors.length) checks.push({ where: 'page', rule: 0, name: 'no page errors', pass: false, got: pageErrors.join(' | '), want: 'none' });
  const failed = checks.filter(c => !c.pass);
  allPass = allPass && !failed.length;
  console.log('\n' + id + ': ' + (checks.length - failed.length) + '/' + checks.length + ' checks pass' + (failed.length ? '' : '  (100%)'));
  checks.forEach(c => console.log((c.pass ? '  ok   ' : '  FAIL ') + (c.where + '        ').slice(0, 13) + (c.rule ? 'r' + c.rule + ' ' : '    ') + c.name + ': ' + c.got + (c.pass ? '' : '   (want ' + c.want + ')')));
  report.push({ id, pass: !failed.length, checks });
  writeFileSync(OUT + id + '.json', JSON.stringify({ id, checks }, null, 1));
}
await browser.close();
process.exit(allPass ? 0 : 1);
