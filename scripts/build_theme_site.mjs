#!/usr/bin/env node
/* The theme library page: 100 locked themes, two rendered samples each.
   LOOKS_DIR=.render/looks100 node scripts/build_theme_site.mjs */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
const ROOT = new URL('../', import.meta.url).pathname;
const DIR = (process.env.LOOKS_DIR || '.render/looks100').replace(/\/?$/, '/');
const man = JSON.parse(readFileSync(ROOT + DIR + 'manifest.json', 'utf8'));
const looks = JSON.parse(readFileSync(ROOT + 'assets/looks.json', 'utf8')).looks;
const shots = {};
man.forEach(c => { (shots[c.look] ||= []).push(c); });
const FILES = process.env.THEME_FILES ? process.env.THEME_FILES.replace(/\/?$/, '/') : null;
const b64 = id => {
  if (FILES){ return FILES.split('/').filter(Boolean).pop() + '/' + id + '.webp'; }
  const small = ROOT + DIR + 'small/' + id + '.webp', full = ROOT + DIR + id + '.webp';
  const p = existsSync(small) ? small : full;
  return 'data:image/webp;base64,' + readFileSync(p).toString('base64');
};
const out = looks.map(L => {
  const key = L.key || L.id;
  const cards = (shots[key] || []).slice(0, 2);
  return {
    id: key, name: L.name || key, collection: L.collection || 'other', oneLine: L.oneLine || '',
    palettes: L.palettes || [], faces: L.faces || {}, ground: L.ground || '',
    categories: L.categories || [], variations: L.variations || [],
    colors: cards.length ? [cards[0].c1, cards[0].ink, cards[0].accent, cards[0].support].filter(Boolean) : [],
    shots: cards.map(c => b64(c.id)),
  };
}).filter(t => t.shots.length);
if (FILES){
  const { mkdirSync, copyFileSync, rmSync } = await import('node:fs');
  const dest = ROOT + FILES;
  if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  man.forEach(c => {
    const small = ROOT + DIR + 'small/' + c.id + '.webp', full = ROOT + DIR + c.id + '.webp';
    copyFileSync(existsSync(small) ? small : full, dest + c.id + '.webp');
  });
  console.log('theme images -> ' + FILES + ' (' + man.length + ')');
}
const tpl = readFileSync(ROOT + 'scripts/theme_site.html', 'utf8');
const page = tpl.replace('/*__THEMES__*/[]', JSON.stringify(out));
/* Same reason as the set pages: the site's CSP allows inline script only by
   sha256, and the theme list lives inside the script, so a rebuild left the
   deployed page with its script silently refused. 'self' covers a file. */
const OUT = ROOT + (process.env.THEME_OUT || (DIR + 'themes.html'));
const m = page.match(/<script>([\s\S]*?)<\/script>/);
if (!m) throw new Error('theme_site.html no longer has the inline page script — the CSP split needs updating');
const jsName = OUT.split('/').pop().replace(/\.html$/, '') + '.js';
const stamp = createHash('sha256').update(m[1]).digest('hex').slice(0, 8);
const html = page.replace(m[0], `<script src="${jsName}?v=${stamp}"></script>`);
writeFileSync(OUT.replace(/[^/]+$/, jsName), m[1]);
writeFileSync(OUT, html);
console.log(`theme library: ${out.length} themes, ${out.reduce((n, t) => n + t.shots.length, 0)} samples, ${(html.length / 1048576).toFixed(1)} MB`);
