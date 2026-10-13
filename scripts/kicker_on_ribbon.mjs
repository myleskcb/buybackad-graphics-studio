#!/usr/bin/env node
/* A KICKER'S WORDS LIE ON ITS RIBBON.
 *
 * The owner, 2026-10-13, on voltStack-ca07-15: "grails wanted is diagonal to
 * the direction it should be going". The layout (app.js ribbon()) gives the
 * Kicker Ribbon and its Kicker one angle (-3 degrees, rising to the right) and
 * one centre. 46 records had since been given a different tilt for the words
 * (+4 or -6 on a -3 or 0 ribbon), anchored at their left end, so the words ran
 * across the ribbon instead of along it; 17 of them were live.
 *
 * For every record whose Kicker is tilted against its Kicker Ribbon, the words
 * take the ribbon's angle and are centred on the ribbon's centre (the centre
 * of a rotated rect is where it is drawn about, so the two stay together at
 * any angle).
 *   node scripts/kicker_on_ribbon.mjs [--dry]
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const DIR = new URL('../assets/showcase/tpl/', import.meta.url).pathname;
const DRY = process.argv.includes('--dry');
const moved = [];
for (const f of readdirSync(DIR)) {
  if (!f.endsWith('.json')) continue;
  const rec = JSON.parse(readFileSync(DIR + f, 'utf8')), L = (rec.tpl && rec.tpl.layers) || [];
  const rib = L.find((l) => l.kind === 'rect' && /^Kicker/.test(l.name || '') && l.props);
  const kick = L.find((l) => l.name === 'Kicker' && typeof l.text === 'string' && l.props);
  if (!rib || !kick) continue;
  const a = rib.props.angle || 0, p = rib.props;
  /* the ribbon's centre, whatever its origin */
  const w = p.width || 0, h = p.height || 0;
  const cx = (p.left || 0) + (p.originX === 'center' ? 0 : p.originX === 'right' ? -w / 2 : w / 2);
  const cy = (p.top || 0) + (p.originY === 'center' ? 0 : p.originY === 'bottom' ? -h / 2 : h / 2);
  const k = kick.props;
  /* only words tilted against their ribbon, and standing on it (their anchor
     within the ribbon's height of its centre line); words set to one end of a
     ribbon at its own angle are a layout choice and stay */
  if ((k.angle || 0) === a || Math.abs((k.top || 0) - cy) > h) continue;
  moved.push(`${f.slice(0, -5)}: words ${k.angle || 0} deg at ${Math.round(k.left || 0)},${Math.round(k.top || 0)} -> ${a} deg at ${Math.round(cx)},${Math.round(cy)}`);
  Object.assign(k, { angle: a, originX: 'center', originY: 'center', left: Math.round(cx * 100) / 100, top: Math.round(cy * 100) / 100 });
  if (!DRY) writeFileSync(DIR + f, JSON.stringify(rec));
}
console.log(`${moved.length} kickers ${DRY ? 'would be' : ''} laid on their ribbons`);
moved.forEach((s) => console.log('  ' + s));
