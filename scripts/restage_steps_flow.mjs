#!/usr/bin/env node
/* RESTAGE A STEPS FLOW CARD — the owner's teardown of stepsFlow-nn05-30,
 * 2026-09-27, as a layout pass anyone can re-run.
 *
 *   "quite literally the worst ad I've ever seen you make. The background image
 *    is dope. It sucks that we're wasting such a great background image. The
 *    boxes look cheesy. There's too many type faces … it looks a bit blurry for
 *    the subtext in each bubble and number three isn't even centered … the
 *    tagline just says iPhone, that's abysmal … EZ BUYER does not count as part
 *    of the headline, that's just an extra selling point … a verification
 *    badge, a shield icon … what if we mirrored [the phone] to face the other
 *    way and put it to the right of the three boxes with the steps, that space
 *    looks perfectly carved out for the phone and it leaves space for the
 *    background image."
 *
 * What it does to the record (DESIGN-LAW 68-74):
 *   headline   a claim, two lines, in the card's display face: TOP iPHONE /
 *              BUYER, sized to the width inside the margins (rule 68)
 *   badge      the kicker's words become a verification mark: shield-tick +
 *              words on a pill, set on the claim's second line, in the CTA's
 *              own colour (rules 69, 74). No floating pill at the top.
 *   type       two faces: display (headline, numerals, number) and support
 *              (badge, step titles, step lines); two weights each (rule 70)
 *   steps      three plates of ONE width and one style, flat, no sheen, no
 *              numeral boxes; the numeral in the display face in the accent;
 *              every row the same sizes; step lines 26px with no blurred shadow
 *              (rules 71, 72)
 *   product    a photo that faces into the layout (never a mirror: an iPhone's
 *              cameras would change sides), standing on the CTA band in the
 *              column the steps leave on the right, clear of the photograph's
 *              top (rule 73)
 *   deco       the floating dollar mark goes
 * Positions are measured on the real faces in the studio, then the card is
 * painted by renderThumb (the studio's own painter) and re-baked.
 *
 *   node scripts/restage_steps_flow.mjs stepsFlow-nn05-30 [more ids] [--dry]
 *   (needs :8899; CHROME=, FABRIC_JS= as for the other showcase scripts)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { openStudio } from './_showcase_harness.mjs';
import { composeInPage, MICRO } from './_steps_composer.mjs';
const ROOT = new URL('../', import.meta.url).pathname;
const DIR = ROOT + 'assets/showcase/';
const OUT = ROOT + '.render/restage/';
mkdirSync(OUT, { recursive: true });
const args = process.argv.slice(2), DRY = args.includes('--dry');
const ids = args.filter(a => !a.startsWith('--'));
/* lab mode: the same design on another photograph and device, written to
   .render/restage/lab/<as>.json for review and audit, never to the gallery
     --as=<labId> --bg=<photo src> --product=<cutout src> */
const opt = k => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const LAB = opt('as'), LAB_BG = opt('bg'), LAB_PRODUCT = opt('product');
const VARIANT = opt('variant') != null ? +opt('variant') : null;   // which claim + badge pairing, accent read off the photo
const LABDIR = OUT + 'lab/';
if (LAB) mkdirSync(LABDIR, { recursive: true });
if (!ids.length){ console.error('usage: node scripts/restage_steps_flow.mjs <cardId…> [--dry]'); process.exit(2); }

/* the claim bank: everyone can say they buy; ranking claims earn the click.
   Each variant pairs a claim with a badge that shares no word with it (rule 69)
   and an accent; neon first (owner, 2026-09-27: "neon is the easiest attention
   grabber"). The first variant is written to the record, the rest are rendered
   beside it for review. accent null keeps the card's own. */
/* The product faces into the layout by being PHOTOGRAPHED that way, never by
   mirroring: a mirrored iPhone carries its cameras on the wrong side (owner,
   2026-09-27: "make the phone flipped the correct way around instead of
   mirrored"). cosmic-orange-17 is the same iPhone 17 Pro leaning up and in,
   toward the steps and the claim; -02 stands upright on a pedestal. */
/* AUTHENTIC DEVICES ONLY (owner, 2026-09-27: "that's not a 17 Pro Max … we
   should never re-skin a device color … everything needs to look factory
   original"). The own-apple-cosmic-orange-* photos are a 16 Pro's square camera
   bump painted orange; the 17 Pro has the full-width camera plateau. The
   qs-iphone-17-* photos are the real design, back and front. */
const LEAN = { src: 'assets/cutouts/qs-iphone-17-pro.webp' };
const PEDESTAL = { src: 'assets/cutouts/qs-iphone-17-pro-max.webp' };
/* accent 'photo': the engine chooses, it does not roll (owner, 2026-09-27: "we
   wanna have the options so the design engine can produce the best possible
   graphics using our BG assets … at the end of the day we're looking for
   cohesiveness"). The photograph's dominant hue, weighted by colourfulness,
   picks the neon across the wheel from it; that one accent then carries the
   claim's second line, the badge, the numerals and the CTA (rules 74, 75). */
const VARIANTS = [
  { claim: ['TOP iPHONE', 'BUYER'],     badge: ['QUICK CASH', 'boltFast'],   accent: 'photo',   product: LEAN,     tag: 'accent from the photo, leaning phone' },
  { claim: ['TOP iPHONE', 'BUYER'],     badge: ['QUICK CASH', 'boltFast'],   accent: '#1ff0ff', product: PEDESTAL, tag: 'neon cyan, pedestal phone' },
  { claim: ['FAST CASH FOR', 'iPHONES'], badge: ['EZ BUYER', 'shieldTick'],  accent: '#c6ff1a', product: LEAN,     tag: 'neon lime' },
  { claim: ['SELL YOUR', 'iPHONE'],     badge: ['#1 BUYER', 'shieldTick'],   accent: '#ffe81a', product: LEAN,     tag: 'neon yellow' },
  { claim: ['QUICK iPHONE', 'BUYER'],   badge: ['LA \u00b7 OC \u00b7 IE', 'pin'], accent: null, product: PEDESTAL, tag: 'own accent' },
];

const { browser, page } = await openStudio();
const results = [];
const index = JSON.parse(readFileSync(DIR + 'index.json', 'utf8'));
for (const id of ids)
for (const [v, V0] of VARIANTS.entries()){
  if ((LAB || VARIANT != null) && v > 0) break;             // a lab record (or a chosen variant) is written alone
  const Vpick = VARIANT != null ? VARIANTS[VARIANT] : V0;
  const V = LAB_PRODUCT ? Object.assign({}, Vpick, { product: { src: LAB_PRODUCT } }, VARIANT == null ? {} : { accent: 'photo' }) : Object.assign({}, Vpick, VARIANT == null ? {} : { accent: 'photo' });
  const rec = JSON.parse(readFileSync(DIR + 'tpl/' + id + '.json', 'utf8'));
  if (LAB_BG) rec.tpl.bg = Object.assign({}, rec.tpl.bg, { src: LAB_BG });
  const r = await page.evaluate(composeInPage, rec, id, V, MICRO).catch(e => ({ err: String(e) }));
  if (r.err){ console.log(id, V.tag, 'FAILED', r.err); results.push({ id, v, err: r.err }); continue; }
  writeFileSync(OUT + id + '-v' + (v + 1) + '.png', Buffer.from(r.png.split(',')[1], 'base64'));
  if (LAB){
    const card = Object.assign({}, index.find(x => x.id === id), { id: LAB, accent: r.accent, name: LAB + ' (lab)' });
    writeFileSync(LABDIR + LAB + '.json', JSON.stringify({ card, rec: Object.assign({}, r.rec, { id: LAB }) }));
    writeFileSync(LABDIR + LAB + '.png', Buffer.from(r.png.split(',')[1], 'base64'));
    console.log(LAB, 'lab record written', 'accent ' + r.accent, 'critic ' + r.crit.map(c => c.text + ' ' + c.q75).join(' | '));
    continue;
  }
  if (!DRY && v === 0){
    writeFileSync(DIR + 'tpl/' + id + '.json', JSON.stringify(r.rec));
    writeFileSync(DIR + id + '.webp', Buffer.from(r.webp.split(',')[1], 'base64'));
    const c = index.find(x => x.id === id);
    if (c && r.accent){ c.accent = r.accent; }
  }
  console.log(id, 'v' + (v + 1), V.tag, 'accent ' + r.accent + (r.photoHue != null ? ' (photo hue ' + r.photoHue + ')' : ''), V.claim.join(' ') + ' + ' + V.badge[0], 'headline ' + r.S + 'px', 'faces: ' + r.faces.join(' + '),
    'critic ' + r.crit.map(c => c.text + ' ' + c.q75).join(' | '), v === 0 && !DRY ? 'WRITTEN' : '');
  results.push({ id, v: v + 1, tag: V.tag, S: r.S, faces: r.faces, crit: r.crit, ink: r.ink, boxes: r.boxes });
  writeFileSync(OUT + id + '-v' + (v + 1) + '.json', JSON.stringify(r.rec));
}
if (!DRY && !LAB) writeFileSync(DIR + 'index.json', JSON.stringify(index));
writeFileSync(OUT + 'report.json', JSON.stringify(results, null, 1));
await browser.close();
process.exit(results.some(r => r.err) ? 1 : 0);
