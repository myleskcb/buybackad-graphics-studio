#!/usr/bin/env node
/* LAB EXPORT -> SHOWCASE. The step OPEN-ITEMS §G called "the python snippet
 * in the session notes": it lived in nobody's repo, so the recipe could not be
 * re-run. This is it, scripted.
 *
 *   LAB_EXPORT=1 LAB_OUT=.render/exportN ... node scripts/retheme_lab.mjs
 *   node scripts/import_lab_export.mjs .render/exportN        # records + index rows
 *   node .render/exportN/../shrink or scripts/shrink_thumbs.mjs (lab thumbs), then
 *   node scripts/refresh_showcase.mjs (optional re-skin) and the audits:
 *     audit_showcase_overlap.mjs --write, audit_showcase_legibility.mjs --write,
 *     audit_showcase_content.mjs --write, measure_showcase_color.mjs
 *
 * For each card in <dir>/templates.json it writes assets/showcase/tpl/<id>.json
 * ({ id, base, tpl }) with the two corrections the snippet made — the lab paints
 * a flat scrim over a toned photograph, so bg.scrimMode = 'normal' and
 * bg.grade = { treat: bg.treat || 'tone' } — and adds or replaces the card's
 * row in assets/showcase/index.json. `affinity` is how many of the owner's
 * approved sets (assets/approved-templates.json) kept that layout+palette pair
 * (the snippet's own weighting was not recorded, so the numbers can differ).
 * Colour and cover measures are left for the audits to write.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname, DIR = process.env.SHOWCASE_DIR || ROOT + 'assets/showcase/';
const src = process.argv[2];
if (!src || !existsSync(src + '/templates.json')){ console.error('usage: node scripts/import_lab_export.mjs <LAB_OUT dir with templates.json>'); process.exit(2); }
const cards = JSON.parse(readFileSync(src + '/templates.json', 'utf8'));
const idx = existsSync(DIR + 'index.json') ? JSON.parse(readFileSync(DIR + 'index.json', 'utf8')) : [];
const sets = JSON.parse(readFileSync(ROOT + 'assets/approved-templates.json', 'utf8')).sets;
const aff = {};
sets.forEach(s => (s.approved || []).forEach(a => { const k = a.layout + '|' + a.palette; aff[k] = (aff[k] || 0) + 1; }));
const byId = new Map(idx.map((c, i) => [c.id, i]));
let added = 0, replaced = 0;
for (const c of cards){
  const tpl = JSON.parse(JSON.stringify(c.tpl));
  const bg = tpl.bg || {};
  if (bg.type === 'image'){ bg.scrimMode = 'normal'; bg.grade = { treat:bg.treat || (bg.grade && bg.grade.treat) || 'tone' }; delete bg.treat; }
  writeFileSync(DIR + 'tpl/' + c.id + '.json', JSON.stringify({ id:c.id, base:c.base, tpl }));
  const pal = String(c.id).split('-')[1];
  const cut = (tpl.layers || []).find(l => l.kind === 'cutout' && l.props && l.props.src);
  const row = {
    id:c.id, name:String(c.name || '').split(' · ')[0] + ' · ' + String(c.layout).replace(/([A-Z])/g, ' $1').replace(/^./, m => m.toUpperCase()), theme:String(c.name || '').split(' · ')[0], family:c.family, layout:c.layout, cat:c.cat, base:c.base,
    faces:c.faces, c1:c.c1, ink:c.ink, accent:c.accent, support:c.support, product:c.product || null, density:c.density,
    affinity:aff[c.layout + '|' + pal] || 0, thumb:'assets/showcase/' + c.id + '.webp',
    treat:bg.grade ? bg.grade.treat : null, blur:bg.blur || 0,
    imagery:cut ? 'product' : bg.type === 'image' ? 'photo' : 'none', cutW:cut ? Math.round(cut.props.width || 0) : 0,
  };
  if (byId.has(c.id)){ idx[byId.get(c.id)] = Object.assign(idx[byId.get(c.id)], row); replaced++; }
  else { byId.set(c.id, idx.length); idx.push(row); added++; }
}
writeFileSync(DIR + 'index.json', JSON.stringify(idx));
console.log('imported ' + cards.length + ' from ' + src + ' · ' + added + ' new, ' + replaced + ' replaced · index now ' + idx.length);
console.log('next: thumbnails (scripts/shrink_thumbs.mjs), then the audits with --write');
