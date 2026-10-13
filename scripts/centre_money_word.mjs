#!/usr/bin/env node
/* THE MONEY WORD UNDER A CENTRED FIRST LINE IS CENTRED TOO.
 *
 * The owner, 2026-10-13, on checklistHero-jw05-15 ("CASH IN YOUR / SILVER"
 * with the coins beside it): "the hero isn't centered on the 2nd line". The
 * centring pass (rule 109) centred the first line but left the money word
 * where the layout put it, so the WORD AND ITS PRODUCT were centred as a group
 * and the word itself sat 160 px left of the line above it. 13 live cards were
 * built that way.
 *
 * For every live card whose first headline line is centred (within 20 px)
 * and whose second is not (over 40 px off), this moves Headline 2 to the
 * middle and slides a product photo that sits beside it to the free side,
 * GAP px clear of the word, shrinking it to fit inside EDGE px of the card
 * edge when it must (never under MIN_SCALE). It measures the card the way
 * renderThumb() paints it (the layout passes move things), repeats up to
 * three times, and keeps a change only when the gate says nothing got worse.
 *
 *   python3 -m http.server 8899   then
 *   CHROME=… [FABRIC_JS=…] node scripts/centre_money_word.mjs [--dry] [--ids a,b]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { openStudio, live } from './_showcase_harness.mjs';

const ROOT = new URL('..', import.meta.url).pathname, DIR = ROOT + 'assets/showcase/tpl/';
const GAP = 18, EDGE = 56, MIN_SCALE = 0.7;
const DRY = process.argv.includes('--dry');
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
let cards = JSON.parse(readFileSync(ROOT + 'assets/showcase/index.json', 'utf8')).filter(live).map((c) => c.id);
if (arg('--ids')) { const want = new Set(arg('--ids').split(',')); cards = cards.filter((id) => want.has(id)); }

const { browser, page, errors } = await openStudio();
const moved = [], refused = [];
for (const id of cards) {
  if (!existsSync(DIR + id + '.json')) continue;
  const rec = JSON.parse(readFileSync(DIR + id + '.json', 'utf8'));
  const res = await page.evaluate(async (id, rec, GAP, EDGE, MIN_SCALE) => {
    const W = TPL_W, MID = W / 2;
    const measure = async (r) => {
      const t = await __sc.prep(r, id), { sc, refs } = __sc.paint(t);
      const B = (k) => { const b = refs[k].getBoundingRect(true, true); return { l: b.left, r: b.left + b.width, t: b.top, b: b.top + b.height, cx: b.left + b.width / 2 }; };
      const k1 = t.layers.findIndex((l) => l.name === 'Headline 1'), k2 = t.layers.findIndex((l) => l.name === 'Headline 2');
      const m = (k1 < 0 || k2 < 0 || !refs[k1] || !refs[k2]) ? null : { h1: B(k1), h2: B(k2),
        cuts: t.layers.map((l, k) => (l.kind === 'cutout' && refs[k] && refs[k].visible !== false) ? { k, b: B(k) } : null).filter(Boolean) };
      sc.dispose();
      return m;
    };
    let m = await measure(rec);
    if (!m || Math.abs(m.h1.cx - MID) >= 20 || Math.abs(m.h2.cx - MID) <= 40) return { skip: true };
    const was = Math.round(m.h2.cx - MID);
    const r2 = JSON.parse(JSON.stringify(rec)), L = r2.tpl.layers;
    const h2 = L.find((l) => l.name === 'Headline 2');
    for (let pass = 0; pass < 3; pass++) {
      const dx = MID - m.h2.cx;
      if (Math.abs(dx) <= 4) break;
      h2.props.left = Math.round(((h2.props.left || 0) + dx) * 100) / 100;
      m = await measure(r2);
    }
    /* a product beside the word goes to the side it was on, clear of it */
    const notes = [];
    for (const c of m.cuts) {
      const vo = Math.min(c.b.b, m.h2.b) - Math.max(c.b.t, m.h2.t);
      if (vo < 0.3 * (m.h2.b - m.h2.t)) continue;
      const l = L[c.k], w = c.b.r - c.b.l, right = c.b.cx >= MID;
      const room = right ? (W - EDGE) - (m.h2.r + GAP) : (m.h2.l - GAP) - EDGE;
      const s = Math.min(1, room / w);
      if (s < MIN_SCALE) return { refuse: 'no room beside the word for the product (' + Math.round(room) + ' px for ' + Math.round(w) + ')' };
      if (s < 1) { l.props.w = Math.round(l.props.w * s * 10) / 10; if (l.props.maxH) l.props.maxH = Math.round(l.props.maxH * s * 10) / 10; }
      const w2 = w * s, ox = l.props.originX || 'left';
      const newL = right ? m.h2.r + GAP : m.h2.l - GAP - w2;
      /* left is the origin's x: shift by where the painted box should start */
      const off = ox === 'center' ? w2 / 2 : ox === 'right' ? w2 : 0;
      l.props.left = Math.round((newL + off) * 100) / 100;
      notes.push((right ? 'right' : 'left') + (s < 1 ? ' at ' + Math.round(s * 100) + '%' : ''));
    }
    m = await measure(r2);
    const before = __sc.check(await __sc.prep(rec, id)), after = __sc.check(await __sc.prep(r2, id));
    const a = __sc.accept(before, after);
    return { was, now: Math.round(m.h2.cx - MID), notes, accept: a.ok, fresh: a.fresh, lost: a.lost, r2 };
  }, id, rec, GAP, EDGE, MIN_SCALE);
  if (res.skip) continue;
  if (res.refuse) { refused.push(id + ': ' + res.refuse); continue; }
  if (!res.accept) { refused.push(`${id}: the gate refused ${JSON.stringify(res.fresh).slice(0, 160)} ${JSON.stringify(res.lost).slice(0, 160)}`); continue; }
  if (!DRY) writeFileSync(DIR + id + '.json', JSON.stringify(res.r2));
  moved.push(`${id}: money word ${res.was} -> ${res.now} px off the middle${res.notes.length ? '; product ' + res.notes.join(', ') : ''}`);
}
await browser.close();
console.log(`${moved.length} ${DRY ? 'would be' : ''} centred, ${refused.length} refused`);
moved.forEach((s) => console.log('  ' + s));
refused.forEach((s) => console.log('  REFUSED ' + s));
if (errors.length) console.log('page errors: ' + errors.slice(0, 5).join(' | '));
