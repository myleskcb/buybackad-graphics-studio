#!/usr/bin/env node
/* WHAT SEARCH ENGINES AND AI ASSISTANTS READ, CHECKED (DESIGN-LAW 146).

   Reads the files, no server needed, and fails (exit 1) when a public page:
     - has no title, a title over 62 characters, no description or one over 160, or a dash in either
       (rule 55), or shares its title or description with another page;
     - has no canonical, or one that is not its own address;
     - lacks any of the Open Graph and Twitter tags, or its preview image is not in the deploy;
     - has more or fewer than one h1, or an <img> without alt (alt="" is a choice and passes);
     - carries JSON-LD that does not parse, an FAQPage whose questions and answers are not the
       page's own visible ones word for word, a HowTo whose steps are not on the page, or a
       rating, a review or a count of customers (rule 55: none is ours to state);
   and when sitemap.xml lists a page that says noindex or misses a public one, robots.txt shuts a
   crawler out of a public page, or llms.txt links a page that is not there.

   usage: node scripts/seo_check.mjs */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const SITE = 'https://buybackad-graphics-studio.netlify.app';
const ads = readFileSync(root + 'sitemap.xml', 'utf8');
const PUBLIC = ['index.html', 'motion/index.html', 'about.html', 'learn.html', 'looks.html', 'privacy.html', 'terms.html',
  ...[...readFileSync(root + 'scripts/build_seo_pages.mjs', 'utf8').matchAll(/slug: '(we-buy-[a-z-]+)'/g)].map((m) => `ads/${m[1]}.html`)];
const NOINDEX = ['approve.html', 'pick.html', 'library.html', 'master-library.html', 'phonegfx-studio.html', '404.html', 'motion/audit-sweep.html', 'motion/views-sheet.html', 'social/index.html', 'admin-ads/index.html'];
const urlOf = (f) => SITE + '/' + f.replace(/(^|\/)index\.html$/, '$1');
const fails = [];
const fail = (f, m) => fails.push(`${f}: ${m}`);
const meta = (h, attr, name) => { const m = h.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`)); return m ? m[1] : null; };
const decode = (t) => t.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&rsquo;/g, '’').replace(/&ldquo;|&rdquo;/g, '"')
  .replace(/&eacute;/g, 'é').replace(/&times;/g, '×').replace(/&rsaquo;/g, '›').replace(/&ntilde;/g, 'ñ').replace(/&bull;/g, '•').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const seen = { title: new Map(), desc: new Map() };

for (const f of PUBLIC) {
  const html = readFileSync(root + f, 'utf8');
  const head = html.split(/<\/head>/i)[0];
  const title = decode((head.match(/<title>([\s\S]*?)<\/title>/) || [, ''])[1]);
  const desc = decode(meta(head, 'name', 'description') || '');
  if (!title || title.length > 62) fail(f, `title "${title}" (${title.length})`);
  if (!desc || desc.length > 160) fail(f, `description of ${desc.length} characters`);
  if (/[–—]/.test(title + desc)) fail(f, 'a dash in the title or description');
  for (const [k, v] of [['title', title], ['desc', desc]]) { if (seen[k].has(v)) fail(f, `same ${k} as ${seen[k].get(v)}`); seen[k].set(v, f); }
  const canon = (head.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  if (canon !== urlOf(f)) fail(f, `canonical ${canon} is not ${urlOf(f)}`);
  if (/<meta name="robots" content="[^"]*noindex/.test(head)) fail(f, 'a public page says noindex');
  for (const p of ['og:type', 'og:site_name', 'og:title', 'og:description', 'og:url', 'og:image', 'og:image:width', 'og:image:height', 'og:image:alt']) if (!meta(head, 'property', p)) fail(f, `no ${p}`);
  for (const n of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt']) if (!meta(head, 'name', n)) fail(f, `no ${n}`);
  const img = meta(head, 'property', 'og:image') || '';
  if (!img.startsWith(SITE + '/') || !existsSync(root + img.slice(SITE.length + 1))) fail(f, `preview image ${img} is not in the deploy`);
  if (meta(head, 'property', 'og:url') !== urlOf(f)) fail(f, 'og:url is not the canonical');
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) fail(f, `${h1s} h1s`);
  for (const m of html.matchAll(/<img\b[^>]*>/g)) if (!/\balt=/.test(m[0])) fail(f, `an image without alt: ${m[0].slice(0, 80)}`);
  for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    let ld; try { ld = JSON.parse(m[1]); } catch (e) { fail(f, 'JSON-LD that does not parse: ' + e.message); continue; }
    const nodes = ld['@graph'] || [ld];
    const flat = JSON.stringify(ld);
    if (/aggregateRating|"review"|"Review"|ratingValue|reviewCount|numberOfEmployees|"interactionStatistic"/.test(flat)) fail(f, 'JSON-LD states a rating, a review or a count');
    const visibleText = decode(html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, ''));
    for (const n of nodes) {
      if (n['@type'] === 'FAQPage') {
        const rows = [...html.matchAll(/<details[^>]*><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/g)].map((r) => [decode(r[1]), decode(r[2])]);
        const qa = n.mainEntity.map((q) => [q.name, q.acceptedAnswer.text]);
        if (qa.length !== rows.length) fail(f, `FAQPage has ${qa.length} questions, the page shows ${rows.length}`);
        qa.forEach(([q, a], i) => { if (!rows[i] || rows[i][0] !== q || rows[i][1] !== a) fail(f, `FAQPage question ${i + 1} is not the visible one word for word: "${q}"`); });
      }
      if (n['@type'] === 'HowTo') for (const s of n.step) for (const w of [s.name, s.text]) if (!visibleText.includes(w)) fail(f, `HowTo step not on the page: "${w.slice(0, 60)}"`);
      if (n['@type'] === 'WebApplication') for (const o of n.offers || []) if (!/^\d+(\.\d+)?$/.test(o.price)) fail(f, `offer ${o.name} has price ${o.price}`);
    }
  }
  if (!ads.includes(`<loc>${urlOf(f)}</loc>`)) fail('sitemap.xml', `misses ${urlOf(f)}`);
}
for (const f of NOINDEX) {
  if (ads.includes(`<loc>${urlOf(f)}</loc>`) || ads.includes(`/${f}<`)) fail('sitemap.xml', `lists ${f}, which says noindex`);
  if (!existsSync(root + f)) continue;
  const html = readFileSync(root + f, 'utf8');
  const hdr = readFileSync(root + '_headers', 'utf8');
  const said = /<meta name="robots" content="[^"]*noindex/.test(html) || new RegExp(`^/${f.replace(/index\.html$/, '\\*').replace(/\./g, '\\.')}\\s*\\n\\s+X-Robots-Tag: noindex`, 'm').test(hdr)
    || new RegExp(`^/${f.split('/')[0]}/\\*\\s*\\n\\s+X-Robots-Tag: noindex`, 'm').test(hdr);
  if (!said) fail(f, 'an owner page with no noindex (meta or _headers)');
}
const robots = readFileSync(root + 'robots.txt', 'utf8');
for (const line of robots.split('\n')) { const m = line.match(/^Disallow:\s*(\S+)/); if (m && m[1] !== '/api/') fail('robots.txt', `Disallow: ${m[1]} (a public page, or a page whose noindex would go unread)`); }
if (!/Sitemap: https:\/\/buybackad-graphics-studio\.netlify\.app\/sitemap\.xml/.test(robots)) fail('robots.txt', 'no Sitemap line');
for (const t of ['llms.txt', 'llms-full.txt']) {
  const s = readFileSync(root + t, 'utf8');
  if (!/^# BUYBACK\.AD\n\n> /.test(s)) fail(t, 'not in the llmstxt.org shape (an H1, then a blockquote summary)');
  for (const m of s.matchAll(/\]\((https:\/\/[^)]+)\)/g)) {
    const path = m[1].replace(SITE + '/', '').replace(/#.*$/, '') || 'index.html';
    const file = path.endsWith('/') ? path + 'index.html' : path;
    if (!existsSync(root + file)) fail(t, `links ${m[1]}, which is not in the deploy`);
  }
  if (/[–—]/.test(s)) fail(t, 'a dash (rule 55)');
}
console.log(`checked ${PUBLIC.length} public pages, ${NOINDEX.length} owner pages, sitemap.xml, robots.txt, llms.txt, llms-full.txt`);
if (fails.length) { console.log(fails.map((x) => '  FAIL ' + x).join('\n')); process.exit(1); }
console.log('all passed');
