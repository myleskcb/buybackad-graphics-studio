#!/usr/bin/env node
/* The video maker's type pairs (motion/catalog.js TYPE_VOICES) say what the photo
   ads' FONT_PAIRS (app.js) say: the same eighteen voices, the same display face at
   the same weight, the same reading face at its label weight, and every face a file
   the maker can load (assets/fonts/). DESIGN-LAW 100 and 133.
   usage: node scripts/type_voices_check.mjs   (exits 1 on any difference) */
import { readFileSync, existsSync } from 'node:fs';

const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const i = app.indexOf('const FONT_PAIRS = ['), j = app.indexOf('\n];', i);
if (i < 0 || j < 0) { console.error('FONT_PAIRS not found in app.js'); process.exit(1); }
const PAIRS = (0, eval)(app.slice(i + 'const FONT_PAIRS = '.length, j + 2));
const { TYPE_VOICES, FONTS } = await import('../motion/catalog.js');

const bad = [];
for (const p of PAIRS) {
  const v = TYPE_VOICES[p.key];
  if (!v) { bad.push(`${p.key}: no voice in the video maker`); continue; }
  const d = FONTS[v.display], l = FONTS[v.label];
  if (!d || d[0] !== p.display[0] || +d[1] !== +p.display[1]) bad.push(`${p.key}: display ${d && d.slice(0, 2)} vs ${p.display}`);
  if (!l || l[0] !== p.support[0] || +l[1] !== +p.support[1]) bad.push(`${p.key}: reading ${l && l.slice(0, 2)} vs ${p.support.slice(0, 2)}`);
  for (const f of [d, l]) if (f && !existsSync(new URL('../assets/fonts/' + f[2], import.meta.url))) bad.push(`${p.key}: no file ${f[2]}`);
}
for (const k of Object.keys(TYPE_VOICES)) if (!PAIRS.some(p => p.key === k)) bad.push(`${k}: a voice the photo ads do not have`);
if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
console.log(`${PAIRS.length} type pairs: the video maker and the photo ads agree, every face on disk`);
