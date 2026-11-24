#!/usr/bin/env node
/* FREE-LICENCE BACKGROUND PHOTOGRAPHS FROM WIKIMEDIA COMMONS (2026-11-21).

   The owner: "Where are the background images?", "location based backgrounds like photos of cities,
   aerial view or city signs other city landmarks", "Gaming is lacking in image variety as well as cards".
   Approved: free licence only (public domain and CC0, so an ad needs no photo credit), the top 20 US metros.

   For each group in spec/free-photo-queries.json this searches Commons, keeps photographs that are public
   domain or CC0, large enough (1800 x 1100 or more), not restricted (personality, trademark, insignia), not
   old and not a map, a drawing or an artwork, downloads a 1920-pixel copy, re-encodes it with sips (JPEG,
   64, 1920 pixels at most) and writes a candidate list. Nothing goes into assets/ here: the candidates are
   read by eye on contact sheets first, then scripts/import_free_photos.mjs takes the chosen ones.

   usage:  node scripts/fetch_free_photos.mjs <staging dir> [group ...]
   output: <staging dir>/<cat or geo-metro>-<n>.jpg and <staging dir>/candidates.json */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, renameSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const ROOT = new URL('../', import.meta.url).pathname;
const OUT = process.argv[2]; if (!OUT) { console.error('usage: node scripts/fetch_free_photos.mjs <staging dir> [group ...]'); process.exit(2); }
const only = process.argv.slice(3);
mkdirSync(OUT, { recursive: true });
const spec = JSON.parse(readFileSync(ROOT + 'spec/free-photo-queries.json', 'utf8'));
const UA = 'GraphicsStudioPhotoFetch/1.0 (internal background library; free-licence photographs only)';
const API = 'https://commons.wikimedia.org/w/api.php';
const FREE = /^(public domain|pd\b|pd-|cc0|cc-zero|cc zero)/i;
const NOT = /\b(reopening|press conference|speaks|speech|performance|performs|reading|woman|portrait of|governor|mayor|senator|president|wedding|festival|marathon|kayak|courtroom|airport|world trade center|twin towers|space needle|ground ?zero|music project|mopop|infrared|map|maps|plan|diagram|logo|seal|flag|chart|drawing|painting|engraving|lithograph|illustration|postcard|poster|portrait|sculpture|statue|mural|hollywood sign|disney|disneyland|universal studios|cloud gate|museum|exhibit|grave|cemetery|funeral|protest|parade|crowd|police|fire|burning|crash|accident|wreck|homeless|demolition|construction site|interior of|aerial photograph of .* \(19|scan|negative|stereograph|glass plate|lantern slide|hdr)\b/i;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const strip = s => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

async function getJSON(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (r.status === 429 || r.status >= 500) { await sleep(2000 * (i + 1)); continue; }
    if (!r.ok) throw new Error(r.status + ' ' + url);
    return r.json();
  }
  throw new Error('gave up on ' + url);
}
async function getFile(url, to, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (r.status === 429 || r.status >= 500) { await sleep(3000 * (i + 1)); continue; }
    if (!r.ok) return false;
    const buf = Buffer.from(await r.arrayBuffer());
    // a JPEG or a PNG, by its first bytes, or nothing
    const jpg = buf[0] === 0xff && buf[1] === 0xd8, png = buf[0] === 0x89 && buf[1] === 0x50;
    if (!jpg && !png) return false;
    writeFileSync(to, buf); return true;
  }
  return false;
}
const yearOf = m => { const s = strip(m.DateTimeOriginal && m.DateTimeOriginal.value); const y = s.match(/\b(1[89]\d\d|20\d\d)\b/); return y ? +y[1] : null; };

const prev = existsSync(OUT + '/candidates.json') ? JSON.parse(readFileSync(OUT + '/candidates.json', 'utf8')) : [];
// read by eye: the candidates turned down (people, artworks, trademarks, wrong places) do not count toward a group's want
const rejected = new Set(existsSync(OUT + '/rejected.json') ? JSON.parse(readFileSync(OUT + '/rejected.json', 'utf8')) : []);
const seen = new Set(prev.map(c => c.title)), out = [...prev];
for (const g of spec.groups) {
  const name = g.metro ? 'geo-' + g.metro : g.cat;
  if (only.length && !only.includes(name)) continue;
  let have = out.filter(c => c.group === name && !rejected.has(c.file)).length;
  const perQuery = Math.max(2, Math.ceil(g.want / g.queries.length) + 1);
  for (const q of [...g.queries, ...(g.more || [])]) {
    if (have >= g.want) break;
    const url = `${API}?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=50&gsrsearch=${encodeURIComponent(q + ' filetype:bitmap')}` +
      `&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=1920`;
    let data; try { data = await getJSON(url); } catch (e) { console.warn('search failed:', q, e.message); continue; }
    const pages = Object.values((data.query && data.query.pages) || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
    let took = 0;
    for (const p of pages) {
      if (have >= g.want || took >= perQuery) break;
      const ii = p.imageinfo && p.imageinfo[0]; if (!ii || seen.has(p.title)) continue;
      const m = ii.extmetadata || {}, lic = strip(m.LicenseShortName && m.LicenseShortName.value), restr = strip(m.Restrictions && m.Restrictions.value);
      const title = p.title.replace(/^File:/, ''), desc = strip(m.ImageDescription && m.ImageDescription.value).slice(0, 300), y = yearOf(m);
      if (!FREE.test(lic)) continue;
      if (/personality|trademark|insignia|ineligible/i.test(restr)) continue;
      if (!/jpeg|png/.test(ii.mime) || ii.width < 1800 || ii.height < 1100) continue;
      const ratio = ii.width / ii.height; if (ratio < .62 || ratio > 2.4) continue;
      if (NOT.test(title) || NOT.test(desc)) continue;
      if (y && y < 1990) continue;
      if (/\b1[89]\d\d\b/.test(title) && !/\b(19[9]\d|20\d\d)\b/.test(title)) continue;
      const n = out.filter(c => c.group === name).length + 1, file = `${name}-${n}.jpg`, raw = `${OUT}/.raw-${n}-${name}`;
      await sleep(400);
      if (!(await getFile(ii.thumburl || ii.url, raw))) { console.warn('download failed:', title); continue; }
      try { execFileSync('/usr/bin/sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '64', '-Z', '1920', raw, '--out', `${OUT}/${file}`], { stdio: 'ignore' }); }
      catch (e) { console.warn('re-encode failed:', title); try { unlinkSync(raw); } catch (_) {} continue; }
      unlinkSync(raw);
      const kb = Math.round(statSync(`${OUT}/${file}`).size / 1024);
      out.push({ group: name, file, query: q, title: p.title, artist: strip(m.Artist && m.Artist.value).slice(0, 160), license: lic, usage: strip(m.UsageTerms && m.UsageTerms.value),
        credit: strip(m.Credit && m.Credit.value).slice(0, 200), page: ii.descriptionurl, width: ii.width, height: ii.height, year: y, desc, kb });
      seen.add(p.title); have++; took++;
      writeFileSync(OUT + '/candidates.json', JSON.stringify(out, null, 1));
      console.log(`${file}  ${kb} KB  ${lic}  ${title.slice(0, 90)}`);
    }
    await sleep(300);
  }
  console.log(`== ${name}: ${have} of ${g.want}`);
}
const total = out.reduce((s, c) => s + (c.kb || 0), 0);
console.log(`done: ${out.length} candidates, ${(total / 1024).toFixed(1)} MB in ${OUT}`);
