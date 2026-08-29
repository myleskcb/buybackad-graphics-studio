#!/usr/bin/env node
/* Compute the CSP sha256 hashes for the inline <script> blocks in index.html
   and rewrite them into netlify.toml and _headers.

   WHY THIS EXISTS
   index.html carries two inline scripts that must stay inline:
     1. the pre-paint theme stamp — its whole job is to run before first paint,
        so moving it to an external file reintroduces the flash of wrong theme
        it was written to prevent;
     2. the theme toggle.
   The site ships a strict CSP with no 'unsafe-inline', so BOTH were silently
   blocked in production while working perfectly on localhost (no CSP headers
   are applied by a plain static file server). The theme toggle was dead on the
   live site and nothing surfaced it, because a CSP violation is a console
   error, not a broken render.

   Hashes rather than 'unsafe-inline': allowing all inline script would defeat
   the policy for the sake of two known blocks.

   RUN THIS AFTER EVERY EDIT TO AN INLINE SCRIPT IN index.html — the hash is
   over the exact bytes, so a single changed space invalidates it and silently
   re-breaks the block in production. Verify with scripts/verify_csp.mjs.
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('..', import.meta.url).pathname;
const html = readFileSync(root + 'index.html', 'utf8');

// inline scripts only: <script> with no src attribute
const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
const hashes = [];
let m;
while ((m = re.exec(html))){
  const body = m[1];
  const h = createHash('sha256').update(body, 'utf8').digest('base64');
  hashes.push(`'sha256-${h}'`);
}
if (!hashes.length){ console.log('no inline scripts found'); process.exit(0); }
console.log(`found ${hashes.length} inline script block(s):`);
hashes.forEach(h => console.log('  ' + h));

const joined = hashes.join(' ');
let changed = 0;
for (const f of ['netlify.toml', '_headers']){
  const p = root + f;
  let s;
  try { s = readFileSync(p, 'utf8'); } catch { continue; }
  // replace the script-src directive's existing hash set (if any) and append ours
  const out = s.replace(/script-src ([^;"]*)/g, (full, dirs) => {
    const cleaned = dirs.replace(/'sha256-[A-Za-z0-9+/=]+'\s*/g, '').replace(/\s+/g, ' ').trim();
    return `script-src ${cleaned} ${joined}`;
  });
  if (out !== s){ writeFileSync(p, out); changed++; console.log('updated ' + f); }
  else console.log('no change needed in ' + f);
}
console.log(changed ? '\nRe-deploy for this to take effect.' : '\nNothing written.');
