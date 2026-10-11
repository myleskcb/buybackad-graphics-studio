#!/usr/bin/env node
/* DEVICE ENTITIES — every device the shop buys, each with the real photographs
 * we hold of it, as the reference set an image model is given (OPEN-ITEMS N.1,
 * DESIGN-LAW 127). Owner, 2026-10-10: "can we finally upload all phones and
 * devices we have as entities?", after a generated "Price Point" background put
 * a Google Pixel on an iPhone ad.
 *
 * A model draws the product from these photographs, never from its name: asked
 * for an iPhone in words, it drew a Pixel 7 Pro and painted it in the card's
 * palette. So only photographs of the real thing go in:
 *   - assets/devices.json (scripts/device_catalog.py): the model's art and each
 *     finish's cut-out, the shop's quote-site catalog photographs;
 *   - assets/cutouts/devices.json: the iPhone cut-outs marked authentic (a
 *     re-skin or a mislabel, authentic:false, is left out);
 *   - motion/phones/index.json: the video maker's factory backs, except those
 *     marked repaint (a 16 back painted in another finish) or not ok.
 *
 * Writes assets/entities.json. Offline; uploading the set to fal is a separate
 * step that needs FAL_KEY and the fal hosts allowed (not done here).
 *   node scripts/device_entities.mjs            write assets/entities.json
 *   node scripts/device_entities.mjs --check    report, write nothing; exit 1 on a missing file */
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname;
const CHECK = process.argv.includes('--check');
const read = f => JSON.parse(readFileSync(ROOT + f, 'utf8'));
const slug = s => String(s).toLowerCase().replace(/\+/g, ' plus').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const fileFor = base => ['webp', 'png', 'jpg'].map(e => `assets/cutouts/${base}.${e}`).find(f => existsSync(ROOT + f));

const catalog = read('assets/devices.json').models;
const cutouts = read('assets/cutouts/devices.json').devices;
const backs = read('motion/phones/index.json').phones;

/* held until the owner confirms the picture is the shipping product, not a
   concept render: a render of a rumoured design is how a model learns the wrong phone */
const UNCONFIRMED = { 'iphone-duo': 'qs-iphone-duo is a foldable iPhone render from the quote site; confirm it is the real product before it is a reference' };
const ents = new Map();
const ent = (id, name, line) => {
  if (!ents.has(id)) ents.set(id, { id, name, line, refs: [] });
  return ents.get(id);
};
const missing = [];
const add = (e, src, info) => {
  if (!src || !existsSync(ROOT + src)){ missing.push(src || info.from); return; }
  if (e.refs.some(r => r.src === src)) return;
  e.refs.push(Object.assign({ src, bytes: statSync(ROOT + src).size }, info));
};

/* 1. the catalog: every model, its art and each finish */
for (const [id, m] of Object.entries(catalog)){
  const e = ent(id, m.name, m.line);
  if (m.art){ const f = fileFor(m.art); if (f) add(e, f, { finish: null, view: 'catalog', source: 'assets/devices.json' }); else missing.push(m.art); }
  for (const [fin, c] of Object.entries(m.colours || {})){
    const f = c && c.slug ? fileFor(c.slug) : null;
    if (f) add(e, f, { finish: fin, view: 'catalog', source: 'assets/devices.json' });
    else if (c && c.slug) missing.push(c.slug);
  }
}
/* 2. the iPhone cut-outs marked authentic */
let refused = 0;
for (const [src, d] of Object.entries(cutouts)){
  if (!d.authentic){ refused++; continue; }
  const id = slug(d.model);
  add(ent(id, d.model, 'iphone'), src, { finish: d.color && d.color !== 'as pictured' ? d.color : null, view: d.view || null, faces: d.faces || null, source: 'assets/cutouts/devices.json' });
}
/* 3. the video maker's factory backs, never a repainted one */
let repainted = 0;
for (const p of backs){
  if (p.repaint || p.ok === false){ repainted++; continue; }
  const src = `motion/phones/${p.id}.webp`;
  add(ent(slug(p.model), p.model, 'iphone'), src, { finish: p.finish || null, view: 'back', source: 'motion/phones/index.json' });
}

const held = Object.keys(UNCONFIRMED).filter(id => ents.has(id));
held.forEach(id => ents.delete(id));
const list = [...ents.values()].filter(e => e.refs.length).sort((a, b) => a.line.localeCompare(b.line) || a.name.localeCompare(b.name));
const bare = [...ents.values()].filter(e => !e.refs.length).map(e => e.id);
const byLine = {};
list.forEach(e => { byLine[e.line] = (byLine[e.line] || 0) + 1; });
const refs = list.reduce((n, e) => n + e.refs.length, 0);
console.log(`entities ${list.length} (${Object.entries(byLine).map(([k, v]) => k + ' ' + v).join(', ')}), reference photographs ${refs}`);
console.log(`left out: ${refused} cut-outs not authentic, ${repainted} repainted or failed backs; models with no photograph: ${bare.length ? bare.join(', ') : 'none'}`);
if (missing.length) console.log('named but not on disk: ' + missing.join(', '));
held.forEach(id => console.log('held: ' + id + ' (' + UNCONFIRMED[id] + ')'));
if (!CHECK){
  writeFileSync(ROOT + 'assets/entities.json', JSON.stringify({
    held: Object.fromEntries(held.map(id => [id, UNCONFIRMED[id]])),
    about: 'Every device the shop buys, with the real photographs we hold of it: the reference set an image model is given so it draws the real product (DESIGN-LAW 127, OPEN-ITEMS N.1). Written by scripts/device_entities.mjs from assets/devices.json, assets/cutouts/devices.json (authentic only) and motion/phones/index.json (no repaints). uploaded is filled by the upload step once FAL_KEY and the fal hosts are available.',
    entities: list.map(e => Object.assign(e, { uploaded: {} })),
  }, null, 1) + '\n');
  console.log('wrote assets/entities.json');
}
if (CHECK && missing.length) process.exit(1);
