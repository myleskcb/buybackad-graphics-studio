#!/usr/bin/env node
/* A CTA that STRADDLES the edge of the phone plate. Found by the showcase
 * legibility audit on 2026-09-22: on 31 scriptRetro cards the call-to-action
 * line ("REQUEST AN APPRAISAL") sits with its lower half inside the phone
 * number's colour band, so half of every letter is on one ground and half on
 * another and no single ink colour can read on both (it measured 1.7-2.1:1 and
 * the contrast repair could not help). The line moves up until its box clears
 * the plate by 6px; if that lands on another line, that line moves up by the
 * same amount, once. Run it before repair_showcase_contrast.mjs.
 *   node scripts/fix_cta_straddle.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const DIR = new URL('../assets/showcase/tpl/', import.meta.url).pathname;
const moved = [];
for (const f of readdirSync(DIR)){
  const rec = JSON.parse(readFileSync(DIR + f, 'utf8')), L = rec.tpl.layers || [];
  const plates = L.filter(l => l.kind === 'rect' && /Phone/.test(l.name || ''));
  let changed = false;
  L.filter(l => l.role === 'cta' && typeof l.text === 'string').forEach(a => {
    const fs = a.props.fontSize || 30, h = fs * (a.props.lineHeight || 1.16) * a.text.split('\n').length;
    plates.forEach(p => {
      const pt = p.props.top || 0, at = a.props.top || 0;
      if (!(at < pt && pt < at + fs * 1.15)) return;
      const nt = Math.round(pt - h - 6), dy = at - nt;
      /* whatever reading line sits in the space the CTA moves into goes up with it */
      L.forEach(o => { if (o === a || typeof o.text !== 'string' || !o.props) return;
        const ot = o.props.top || 0, oh = (o.props.fontSize || 20) * 1.2 * o.text.split('\n').length;
        if (ot < at && ot + oh > nt) o.props.top = Math.round(ot - dy); });
      a.props.top = nt; changed = true;
    });
  });
  if (changed){ writeFileSync(DIR + f, JSON.stringify(rec)); moved.push(f.replace(/\.json$/, '')); }
}
writeFileSync(new URL('../.render/cta-moved.json', import.meta.url).pathname, JSON.stringify(moved));
console.log('moved the CTA off the plate edge on ' + moved.length + ' cards (.render/cta-moved.json)');
