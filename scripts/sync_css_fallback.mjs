#!/usr/bin/env node
/* Regenerate CSS_FALLBACK in app.js from styles.css.

   app.js carries a one-line JSON copy of styles.css that ensureCss() injects
   when a host strips or blocks the stylesheet. It must be regenerated after
   EVERY CSS edit; the handoff says "the deploy script does it", but no such
   script is in this repo, so a stale copy would silently ship the OLD design
   to exactly the visitors whose host broke the real one.

   usage: node scripts/sync_css_fallback.mjs          # rewrite
          node scripts/sync_css_fallback.mjs --check  # exit 1 if stale
*/
import { readFileSync, writeFileSync } from 'node:fs';
const root = new URL('..', import.meta.url).pathname;
const css = readFileSync(root + 'styles.css', 'utf8');
const js = readFileSync(root + 'app.js', 'utf8');
const lines = js.split('\n');
const i = lines.findIndex(l => l.startsWith('const CSS_FALLBACK = '));
if (i < 0 || lines.filter(l => l.startsWith('const CSS_FALLBACK = ')).length !== 1){
  console.error('expected exactly one `const CSS_FALLBACK = ` line in app.js'); process.exit(2);
}
const current = JSON.parse(lines[i].slice('const CSS_FALLBACK = '.length).replace(/;\s*$/, ''));
if (current === css){ console.log('CSS_FALLBACK is in sync (' + css.length + ' chars)'); process.exit(0); }
if (process.argv.includes('--check')){ console.error('CSS_FALLBACK is STALE: run node scripts/sync_css_fallback.mjs'); process.exit(1); }
lines[i] = 'const CSS_FALLBACK = ' + JSON.stringify(css) + ';';
writeFileSync(root + 'app.js', lines.join('\n'));
console.log('CSS_FALLBACK updated: ' + current.length + ' -> ' + css.length + ' chars');
