#!/usr/bin/env node
/* ONE REVIEW PAGE FOR EVERYTHING THE ENGINE HAS MADE.
   The owner: "I want a bulk view and approve or deny feature of everything
   you've just made for me even if it's more than 100." Every deliverable set
   is copied in as ordinary image FILES (never inlined — a phone must be able
   to evict them) and listed in one grid, grouped, each with two buttons.
   The page script is external because the site's CSP allows inline script
   only by sha256 and a rebuild would silently break the page. */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
const ROOT = new URL('../', import.meta.url).pathname;
const OUT = ROOT + 'lab/review/';

/* .render/current — 216 cards I generated from engine/engine.mjs — is NOT in
   this list. The owner: "this is a completely new stray direction". It was my
   own addition, it is not the pipeline they work in, and it was sitting first
   on the page, so every defect they reported today was against a set they
   never asked for. Their work is what this page shows. */
const SETS = [
  { k: 'show', n: 'Showcase themes + bonus', src: '.render/themes' },
  { k: 'tmpl', n: 'Ad templates', src: '.render/set250' },
  { k: 'look', n: 'Theme library samples', src: '.render/all108' },
];

if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const items = [], groups = [];
let bytes = 0;
for (const S of SETS) {
  const dir = ROOT + S.src + '/';
  if (!existsSync(dir + 'manifest.json')) { console.log('skip ' + S.src + ' (no manifest)'); continue; }
  const man = JSON.parse(readFileSync(dir + 'manifest.json', 'utf8'));
  let n = 0;
  for (const c of man) {
    const small = dir + 'small/' + c.id + '.webp', full = dir + c.id + '.webp';
    const from = existsSync(small) ? small : existsSync(full) ? full : null;
    if (!from) continue;
    const file = S.k + '-' + c.id + '.webp';
    copyFileSync(from, OUT + file);
    bytes += readFileSync(from).length; n++;
    items.push({
      id: S.k + '-' + c.id, g: S.k, f: 'review/' + file,
      n: c.name || c.id,
      s: [c.layout, c.family, c.palette].filter(Boolean).join(' · '),
      sw: [c.c1, c.ink, c.accent, c.support].filter(Boolean),
    });
  }
  groups.push({ k: S.k, n: S.n });
  console.log(`  ${S.n.padEnd(28)} ${String(n).padStart(4)} images  (${S.src})`);
}

const js = readFileSync(ROOT + 'scripts/review_site.js', 'utf8')
  .replace('/*__ITEMS__*/[]', JSON.stringify(items))
  .replace('/*__GROUPS__*/[]', JSON.stringify(groups));
const stamp = createHash('sha256').update(js).digest('hex').slice(0, 8);
writeFileSync(ROOT + 'lab/review.js', js);
const html = readFileSync(ROOT + 'scripts/review_site.html', 'utf8')
  .replace('__JS__', 'review.js?v=' + stamp);
writeFileSync(ROOT + 'lab/review.html', html);
console.log(`\nlab/review.html  ${(html.length / 1024).toFixed(0)} KB · lab/review.js ${(js.length / 1024).toFixed(0)} KB`);
console.log(`lab/review/  ${items.length} images, ${(bytes / 1048576).toFixed(1)} MB (streamed as files)`);
