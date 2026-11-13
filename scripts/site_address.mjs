#!/usr/bin/env node
/* THE SITE'S ONE ADDRESS AND ONE CONTACT (netlify/lib/site.mjs), applied and
   checked (2026-11-12).

     node scripts/site_address.mjs          rewrites every page, the sitemap
                                            and robots.txt to SITE_ORIGIN
     node scripts/site_address.mjs --check  exits non-zero while a page names
                                            another of the site's addresses,
                                            or a contact that is not
                                            SUPPORT_EMAIL

   What counts as a page: every .html at the top and in ads/ and motion/,
   sitemap.xml and robots.txt (what Netlify serves and a search engine reads).
   The contacts it refuses in them: hello@buyback.ad (buyback.ad is not
   registered, so it receives nothing) and the shop's buying line as a tel: or
   sms: link (iPhones.LA's number, not the studio's support). The (562)
   999-4994 written inside ad designs and placeholders is a sample and stays.
   It also checks that the copy of SUPPORT_EMAIL in the two browser files
   (app.js, account.js, which cannot import site.mjs) is the same address.

   To move the site to buyback.ad: set SITE_ORIGIN in netlify/lib/site.mjs,
   run this, then --check. */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_ORIGIN, SUPPORT_EMAIL, PAST_ORIGINS } from '../netlify/lib/site.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const check = process.argv.includes('--check');

/* Held: a page another branch is rewriting, left alone while it still has
   the text that branch replaces, so the two merge without a conflict.
   claude/one-legal (2026-11-12) rewrites terms.html and privacy.html, and
   changes the two lines just above each canonical link. Once that branch has
   landed (hello@buyback.ad gone from the page) the hold lapses by itself and
   --check fails until this script is run. Then delete the entries. */
const HELD = { 'terms.html': 'hello@buyback.ad', 'privacy.html': 'hello@buyback.ad' };

function pages() {
  const out = [];
  const html = (dir) => (existsSync(join(ROOT, dir)) ? readdirSync(join(ROOT, dir)).filter((f) => f.endsWith('.html')).sort().map((f) => (dir ? dir + '/' : '') + f) : []);
  out.push(...html(''), ...html('ads'), ...html('motion'));
  for (const f of ['sitemap.xml', 'robots.txt']) if (existsSync(join(ROOT, f))) out.push(f);
  return out;
}

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const others = PAST_ORIGINS.filter((o) => o !== SITE_ORIGIN);
/* an origin, and not a longer host that starts the same (buyback.ad vs buyback.adx) */
const OTHER = new RegExp('(' + others.map(escRe).join('|') + ')(?![A-Za-z0-9.-])', 'g');
const CONTACTS = [
  [/hello@buyback\.ad/g, 'hello@buyback.ad, which cannot receive mail'],
  [/href="(?:tel|sms):\+?1?5629994994"/g, 'the shop\'s buying line as a link'],
];

const bad = [];
const held = [];
let rewrote = 0, links = 0;
for (const f of pages()) {
  const path = join(ROOT, f);
  const text = readFileSync(path, 'utf8');
  if (HELD[f] && text.includes(HELD[f])) { held.push(f); continue; }
  const found = text.match(OTHER) || [];
  if (check) {
    if (found.length) bad.push(f + ': ' + found.length + ' link(s) to ' + [...new Set(found)].join(', ') + ' (SITE_ORIGIN is ' + SITE_ORIGIN + ')');
  } else if (found.length) {
    writeFileSync(path, text.replace(OTHER, SITE_ORIGIN));
    rewrote++; links += found.length;
  }
  for (const [re, what] of CONTACTS) {
    const n = (text.match(re) || []).length;
    if (n) bad.push(f + ': ' + n + ' × ' + what + ' (SUPPORT_EMAIL is ' + SUPPORT_EMAIL + ')');
  }
}

/* the browser files' own copy of the support address */
for (const f of ['app.js', 'account.js']) {
  const m = readFileSync(join(ROOT, f), 'utf8').match(/const SUPPORT = '([^']+)'/);
  if (!m) bad.push(f + ': no `const SUPPORT = \'…\'` (the support address the sign-in dialog shows)');
  else if (m[1] !== SUPPORT_EMAIL) bad.push(f + ': SUPPORT is ' + m[1] + ', site.mjs says ' + SUPPORT_EMAIL);
}

if (!check) console.log('site address: ' + links + ' link(s) in ' + rewrote + ' file(s) now name ' + SITE_ORIGIN);
if (held.length) console.log('held for claude/one-legal (left as they are): ' + held.join(', '));
if (bad.length) {
  console.error((check ? '' : 'still to fix by hand:\n') + bad.map((b) => '  ✗ ' + b).join('\n'));
  process.exit(1);
}
if (check) console.log('site address: every page names ' + SITE_ORIGIN + ' and ' + SUPPORT_EMAIL);
