#!/usr/bin/env node
/* THE LIBRARY WEARS THE LOOKS (owner, 2026-09-30: "we're not really using our
 * text effects / variations to show the differences and ways we can support
 * our themes with more flavor").
 *
 * The engine has twelve headline looks (rule 83) and a card may carry one of
 * its own (tpl.look: painted in the gallery thumbnail, shown under Solid in
 * Easy Mode, the download and the video). Measured 2026-09-30: 0 of 971
 * showcase cards carried one, so every thumbnail showed the plain headline
 * and a visitor never saw what the looks do until they went looking.
 *
 * Each layout family gets the looks that suit its voice (neon glows, the
 * sticker family goes multicolour, poster slabs take colour blocks). The
 * engine chooses, it does not roll (rule 75): whether a card carries a look,
 * and which of its family's looks it tries first, come from its id, so a card
 * always shows the same one. A look is kept only when the gate accepts it
 * (the card's own pgCheck before and after, __sc.accept: no new failure, no
 * critical line losing contrast); else the next look is tried; else the card
 * stays as designed. Left out:
 *   - street: it repaints the number plate dark, against rule 74 (one accent
 *     carries the card, on the action plate);
 *   - owner-approved renders (rule 78, assets/approved/approved.json).
 * About four in ten cards stay Solid, so the library still shows the designs
 * as drawn.
 *
 *   node scripts/assign_card_looks.mjs [cardId…]   (:8899 + Chrome; CHROME=, FABRIC_JS=)
 *   RESET=1 clears every card's look first (a re-run then starts clean)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { openStudio, live } from './_showcase_harness.mjs';
const ROOT = new URL('../', import.meta.url).pathname, DIR = ROOT + 'assets/showcase/';
const idx = JSON.parse(readFileSync(DIR + 'index.json', 'utf8'));
const approved = new Set(Object.keys(JSON.parse(readFileSync(ROOT + 'assets/approved/approved.json', 'utf8'))).filter(k => k !== '_doc'));

/* each family's looks, in the order its voice wants them */
const FLAVOUR = {
  neonNight:     ['glow', 'pair', 'signature'],
  hudTech:       ['pair', 'anaglyph', 'signature'],
  bubblePop:     ['multicolor', 'blocks', 'glow'],
  voltStack:     ['blocks', 'signature', 'glow'],
  slabPoster:    ['blocks', 'signature', 'extrude'],
  bandKnockout:  ['blocks', 'extrude'],
  gradientWave:  ['pair', 'signature', 'glow'],
  scriptRetro:   ['extrude', 'blocks', 'glow'],
  arcCrown:      ['glow', 'extrude', 'blocks'],
  ticketStub:    ['blocks', 'glow', 'signature'],
  glassCard:     ['signature', 'glow', 'pair'],
  checklistHero: ['signature', 'blocks', 'pair'],
  stepsFlow:     ['signature', 'blocks', 'pair'],
  trustSeal:     ['signature', 'pair'],
  reviewProof:   ['signature', 'pair'],
  lowerThird:    ['signature', 'pair', 'blocks'],
};
const SHARE = 6;   // in ten
const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

const want = process.argv.slice(2);
const cards = (want.length ? idx.filter(c => want.includes(c.id)) : idx.filter(live)).filter(c => FLAVOUR[c.layout] && !approved.has(c.id));
const plan = [];
for (const c of cards){
  const file = DIR + 'tpl/' + c.id + '.json';
  const rec = JSON.parse(readFileSync(file, 'utf8'));
  if (process.env.RESET && rec.tpl.look){ delete rec.tpl.look; writeFileSync(file, JSON.stringify(rec)); }
  if (rec.tpl.look) continue;                              // a look already chosen stays
  const h = hash(c.id + '|look');
  if (h % 10 >= SHARE) continue;
  const opts = FLAVOUR[c.layout], k = (h >>> 8) % opts.length;
  plan.push({ id: c.id, order: opts.slice(k).concat(opts.slice(0, k)) });
}
console.log('cards ' + cards.length + ', to try ' + plan.length);

const { browser, page, errors } = await openStudio('&emoji=off');
const kept = [], gaveWay = [];
for (let i = 0; i < plan.length; i += 6){
  const out = await page.evaluate(async batch => {
    const res = [];
    for (const { id, order } of batch){
      try {
        const rec = await fetch('assets/showcase/tpl/' + id + '.json', { cache:'no-store' }).then(r => r.json());
        const t0 = await __sc.prep(rec, id);
        const before = __sc.check(t0);
        let look = null, jpg = null;
        for (const k of order){
          const t = Object.assign({}, t0, { look: k });
          const after = __sc.check(t);
          if (!__sc.accept(before, after).ok) continue;
          look = k; jpg = renderThumb(t, 1080); break;
        }
        let webp = null;
        if (jpg){
          const img = await new Promise(r => { const el = new Image(); el.onload = () => r(el); el.onerror = () => r(null); el.src = jpg; });
          const cv = document.createElement('canvas'); cv.width = cv.height = 448;
          const g = cv.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, 448, 448);
          webp = cv.toDataURL('image/webp', 0.74);
        }
        res.push({ id, look, webp, jpg: look ? jpg : null });
      } catch (e){ res.push({ id, look: null, err: String(e).slice(0, 120) }); }
    }
    return res;
  }, plan.slice(i, i + 6));
  for (const r of out){
    if (!r.look){ gaveWay.push(r.id + (r.err ? ' (' + r.err + ')' : '')); continue; }
    const file = DIR + 'tpl/' + r.id + '.json';
    const rec = JSON.parse(readFileSync(file, 'utf8'));
    rec.tpl.look = r.look;
    writeFileSync(file, JSON.stringify(rec));
    writeFileSync(DIR + r.id + '.webp', Buffer.from(r.webp.split(',')[1], 'base64'));
    if (process.env.PREVIEW) writeFileSync(process.env.PREVIEW + '/' + r.id + '.jpg', Buffer.from(r.jpg.split(',')[1], 'base64'));
    kept.push(r.id + ' ' + r.look);
  }
  console.log('…' + Math.min(i + 6, plan.length) + '/' + plan.length + '  kept ' + kept.length);
}
await browser.close();
const tally = {};
kept.forEach(k => { const [id, look] = k.split(' '); const f = id.split('-')[0]; (tally[f] = tally[f] || {})[look] = (tally[f][look] || 0) + 1; });
console.log(JSON.stringify(tally, null, 1));
console.log('looks kept ' + kept.length + ' of ' + plan.length + ' tried; ' + gaveWay.length + ' stay as designed (no look passed the gate) · page errors ' + errors.length);
if (gaveWay.length) console.log('as designed: ' + gaveWay.join(', '));
