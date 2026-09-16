#!/usr/bin/env node
/* THE OWNER'S APPROVED TYPE, SELF-HOSTED.
 *
 * The engine shipped five families. Four of them — Clash Display, Khand,
 * Melodrama, Zodiak — are not in the owner's approved list at all; they came in
 * with the spec engine. Meanwhile the owner reviewed 151 faces, approved 56,
 * and their own graded sets lean on Special Elite (167 cards), Zilla Slab,
 * Roboto Slab, Oswald, Pirata One, Squada One, Bungee, Big Shoulders and Teko —
 * none of which were available to this engine.
 *
 * These are open-licence faces served by Google Fonts. This pulls the latin
 * woff2 for each approved family and stores it beside the others, so cards stay
 * self-contained and nothing depends on a network at render time.
 *
 *   node tools/gfx/fetch_fonts.mjs [--dry]
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

const ROOT = new URL('../../', import.meta.url).pathname;
const DIR = ROOT + 'assets/fonts/';
const DRY = process.argv.includes('--dry');
mkdirSync(DIR, { recursive: true });

/* a browser UA is what makes the API answer in woff2 rather than ttf */
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const approved = JSON.parse(readFileSync(ROOT + 'assets/approved-fonts.json', 'utf8')).faces;
const HAVE = new Set(['Satoshi', 'Clash Display', 'Khand', 'Melodrama', 'Zodiak']);   // already on disk

/* Ask for the weights a face is worth having. Workhorses earn a range; a
   novelty display face ships one weight and that is the whole point of it. */
const RANGE = { grotesque: [400, 500, 700, 900], condensed: [400, 600, 700], slab: [400, 700],
                serif: [400, 700], rounded: [400, 700], numerals: [400, 700] };
const slug = n => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function css(family, weights) {
  const q = weights ? `${family.replace(/ /g, '+')}:wght@${weights.join(';')}` : family.replace(/ /g, '+');
  const r = await fetch(`https://fonts.googleapis.com/css2?family=${q}&display=swap`, { headers: { 'User-Agent': UA } });
  return r.ok ? r.text() : null;
}

/* the CSS carries one @font-face per unicode subset; latin is the one we set in */
function latinFaces(text) {
  const out = [];
  const blocks = text.split('@font-face').slice(1);
  let subset = null;
  for (const chunk of text.split(/\/\*\s*/).slice(1)) {
    const name = chunk.slice(0, chunk.indexOf(' '));
    const w = chunk.match(/font-weight:\s*(\d+)/);
    const u = chunk.match(/src:\s*url\((https:[^)]+\.woff2)\)/);
    if (name === 'latin' && w && u) out.push({ weight: +w[1], url: u[1] });
  }
  return out;
}

const report = [];
for (const face of approved) {
  if (HAVE.has(face.name)) { report.push({ name: face.name, note: 'already on disk' }); continue; }
  const want = RANGE[face.role] || null;
  let text = want ? await css(face.name, want) : null;
  if (!text) text = await css(face.name, [400, 700]);
  if (!text) text = await css(face.name, null);
  if (!text) { report.push({ name: face.name, note: 'NOT FOUND' }); continue; }

  const faces = latinFaces(text);
  if (!faces.length) { report.push({ name: face.name, note: 'no latin woff2' }); continue; }

  const got = [];
  for (const f of faces) {
    const file = `${slug(face.name)}-${f.weight}.woff2`;
    if (existsSync(DIR + file)) { got.push(f.weight + '·have'); continue; }
    if (DRY) { got.push(f.weight + '·would'); continue; }
    const bin = await fetch(f.url, { headers: { 'User-Agent': UA } });
    if (!bin.ok) { got.push(f.weight + '·FAIL'); continue; }
    writeFileSync(DIR + file, Buffer.from(await bin.arrayBuffer()));
    got.push(String(f.weight));
  }
  report.push({ name: face.name, role: face.role, note: got.join(' ') });
}

const missing = report.filter(r => /NOT FOUND|no latin|FAIL/.test(r.note));
console.log(`${approved.length} approved · ${report.filter(r => !/already|NOT FOUND|no latin/.test(r.note)).length} fetched · ${missing.length} unavailable`);
for (const r of report) console.log(`  ${r.name.padEnd(28)} ${(r.role || '').padEnd(12)} ${r.note}`);
