#!/usr/bin/env node
/* GFX GRAMMAR THEME AUDIT
 *
 * The four transplanted campaign themes use four semantic colour roles:
 * ground, reading ink, money/CTA accent, and support/trust. This audit reads
 * the records directly from app.js and fails when any role loses its job on
 * either gradient stop or under protan/deutan/tritan simulation.
 */
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const start = src.indexOf('const COLOR_THEMES = [');
const end = src.indexOf('\n];', start);
if (start < 0 || end < 0) throw new Error('COLOR_THEMES not found in app.js');
const literal = src.slice(start, end + 2).replace(/^const COLOR_THEMES = /, '');
const themes = (0, eval)('(' + literal + ')').filter(t => t.family === 'GFX Grammar');

const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const rgb = hex => { const n = parseInt(String(hex).replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lum = hex => { const [r, g, b] = rgb(hex); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
const contrast = (a, b) => { const A = lum(a), B = lum(b); return (Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05); };

function simulate(hex, kind) {
  let [r, g, b] = rgb(hex).map(lin);
  let L = 0.31399022 * r + 0.63951294 * g + 0.04649755 * b;
  let M = 0.15537241 * r + 0.75789446 * g + 0.08670142 * b;
  let S = 0.01775239 * r + 0.10944209 * g + 0.87256922 * b;
  if (kind === 'protan') L = 1.05118294 * M - 0.05116099 * S;
  if (kind === 'deutan') M = 0.9513092 * L + 0.04866992 * S;
  if (kind === 'tritan') S = -0.86744736 * L + 1.86727089 * M;
  const R = 5.47221206 * L - 4.6419601 * M + 0.16963708 * S;
  const G = -1.1252419 * L + 2.29317094 * M - 0.1678952 * S;
  const B = 0.02980165 * L - 0.19318073 * M + 1.16364789 * S;
  const encode = c => {
    c = Math.max(0, Math.min(1, c));
    c = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.round(c * 255);
  };
  return '#' + [encode(R), encode(G), encode(B)].map(v => v.toString(16).padStart(2, '0')).join('');
}

const vision = ['normal', 'protan', 'deutan', 'tritan'];
const under = (fg, bg, mode) => mode === 'normal'
  ? contrast(fg, bg)
  : contrast(simulate(fg, mode), simulate(bg, mode));
const worst = (fg, grounds, modes = vision) => Math.min(...modes.flatMap(mode => grounds.map(bg => under(fg, bg, mode))));

let failures = 0;
console.log('\nGFX Grammar theme roles');
console.log('theme             ink all  accent all  support all  accent/ink  verdict');
for (const theme of themes) {
  const grounds = [theme.bg.c1, theme.bg.c2];
  const ink = worst(theme.ink, grounds);
  const accent = worst(theme.accent, grounds);
  const support = worst(theme.support, grounds);
  const separation = contrast(theme.accent, theme.ink);
  const valid = typeof theme.intent === 'string' && theme.intent.length > 3;
  const pass = valid && ink >= 4.5 && accent >= 3 && support >= 4.5 && separation >= 1.7;
  if (!pass) failures++;
  console.log(
    theme.name.padEnd(17) +
    ink.toFixed(2).padStart(7) +
    accent.toFixed(2).padStart(12) +
    support.toFixed(2).padStart(13) +
    separation.toFixed(2).padStart(12) +
    '  ' + (pass ? 'PASS' : 'FAIL')
  );
}

const unique = new Set(themes.map(t => t.name)).size === themes.length;
if (!unique) failures++;
if (themes.length !== 4) failures++;
console.log(`\n${themes.length}/4 records · unique names ${unique ? 'PASS' : 'FAIL'} · ${failures ? failures + ' failure(s)' : 'all role checks pass'}\n`);
process.exit(failures ? 1 : 0);
