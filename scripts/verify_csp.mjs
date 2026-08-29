#!/usr/bin/env node
/* Verify the deployed CSP actually permits index.html's inline scripts.

   A CSP violation does not break a render — it is a console error — so an
   inline block can be dead in production for months while every page looks
   correct and localhost (no CSP headers at all on a static file server) shows
   nothing wrong. That is exactly how the theme toggle shipped broken.

   usage: node scripts/verify_csp.mjs [url]
   exits non-zero if any inline script would be blocked.
*/
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const url = process.argv[2] || 'https://buybackad-graphics-studio.netlify.app/';
const root = new URL('..', import.meta.url).pathname;
const html = readFileSync(root + 'index.html', 'utf8');

const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
const need = [];
let m;
while ((m = re.exec(html))) {
  need.push("'sha256-" + createHash('sha256').update(m[1], 'utf8').digest('base64') + "'");
}

const res = await fetch(url, { redirect: 'follow' });
const csp = res.headers.get('content-security-policy') || '';
if (!csp) { console.log('no CSP header served by ' + url); process.exit(0); }

const scriptSrc = (csp.split(';').find(d => d.trim().startsWith('script-src')) || '');
const inline = /'unsafe-inline'/.test(scriptSrc);

console.log('checking ' + url);
console.log('inline script blocks in index.html: ' + need.length);

let bad = 0;
need.forEach(h => {
  const ok = inline || scriptSrc.includes(h);
  console.log(`  ${ok ? 'ALLOWED' : 'BLOCKED'}  ${h}`);
  if (!ok) bad++;
});

if (bad) {
  console.log(`\n${bad} inline script(s) would be BLOCKED in production.`);
  console.log('Run: node scripts/csp_hashes.mjs   then redeploy.');
  process.exit(1);
}
console.log('\nall inline scripts are permitted by the served policy.');
