#!/usr/bin/env node
/* THE DEPLOYED LAB, built for a phone.
   The old labs inlined every card as base64 inside one JavaScript file —
   templates-set7.js is 17MB. On a phone that blows the tab's memory budget,
   iOS discards the tab, and it reloads from scratch: the "site is resetting
   for mobile users". This writes the cards as ordinary image FILES and keeps
   the page itself tiny, so the browser can stream and evict images on its own
   without ever losing the page or the grades.

   SET=8 SRC=.render/set250 node scripts/build_lab_site.mjs
   -> lab/set8/<id>.webp   (one file per card)
   -> lab/templates-set8.html  (a few tens of KB) */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
const ROOT = new URL('../', import.meta.url).pathname;
const SET = process.env.SET || '8';
const SRC = (process.env.SRC || '.render/set250').replace(/\/?$/, '/');
const OUTDIR = ROOT + 'lab/set' + SET + '/';
const man = JSON.parse(readFileSync(ROOT + SRC + 'manifest.json', 'utf8'));
const looks = existsSync(ROOT + 'assets/looks.json')
  ? JSON.parse(readFileSync(ROOT + 'assets/looks.json', 'utf8')).looks : [];
const lookBy = Object.fromEntries(looks.map(l => [l.key || l.id, l]));

if (existsSync(OUTDIR)) rmSync(OUTDIR, { recursive: true, force: true });
mkdirSync(OUTDIR, { recursive: true });

let bytes = 0;
const cards = man.map(c => {
  const small = ROOT + SRC + 'small/' + c.id + '.webp';
  const full = ROOT + SRC + c.id + '.webp';
  const from = existsSync(small) ? small : full;
  copyFileSync(from, OUTDIR + c.id + '.webp');
  bytes += readFileSync(from).length;
  const L = lookBy[c.look] || {};
  return {
    id: c.id,
    n: L.name || c.name || c.layout,
    c: (L.collection || c.family || '').replace(/-/g, ' '),
    l: c.layout, t: c.cat,
    g: String(c.ground || '').replace(/[:/].*/, ''),
    p: c.palette,
    sw: [c.c1, c.ink, c.accent, c.support].filter(Boolean),
  };
});

const page = readFileSync(ROOT + 'scripts/lab_site.html', 'utf8')
  .replace('/*__CARDS__*/[]', JSON.stringify(cards))
  .replace(/__SET__/g, SET)
  .replace('__NOTE__', process.env.SET_NOTE || '');

/* THE PAGE SCRIPT IS A FILE, NOT AN INLINE BLOCK.
   The site's Content-Security-Policy allows inline script only by sha256, and
   the card list lives inside the script — so every rebuild of a set changed
   the hash and the deployed page came up with its chrome drawn, its grid empty
   and "seen 0/0", the script silently refused. Pinning a new hash per rebuild
   is a promise nobody can keep. An external file is covered by 'self' and
   needs no maintenance; the content hash in the query string keeps a phone
   from serving yesterday's list. */
const m = page.match(/<script>([\s\S]*?)<\/script>/);
if (!m) throw new Error('lab_site.html no longer has the inline page script — the CSP split needs updating');
const js = m[1];
const stamp = createHash('sha256').update(js).digest('hex').slice(0, 8);
const html = page.replace(m[0], `<script src="set${SET}.js?v=${stamp}"></script>`);
writeFileSync(ROOT + 'lab/set' + SET + '.js', js);
writeFileSync(ROOT + 'lab/templates-set' + SET + '.html', html);
console.log(`lab/templates-set${SET}.html  ${(html.length / 1024).toFixed(0)} KB page · lab/set${SET}.js ${(js.length / 1024).toFixed(0)} KB (external: no CSP hash to maintain)`);
console.log(`lab/set${SET}/  ${cards.length} images, ${(bytes / 1048576).toFixed(1)} MB total (streamed, not inlined)`);
