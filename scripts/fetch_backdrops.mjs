#!/usr/bin/env node
/* Real photographs for backdrops from Wikimedia Commons (the Openverse API
   was unreachable from here). Free licences only — CC0, public domain, CC BY,
   CC BY-SA — with the attribution kept in assets/bg-web/ATTRIBUTION.json.
   Each query is a scene a category needs; results are filtered to landscape
   and at least 1600px wide, downloaded at 1920px. */
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname, OUT = ROOT + 'assets/bg-web/';
mkdirSync(OUT, { recursive: true });
const WANT = +(process.env.PER || 3);
const UA = { 'User-Agent': 'buyback-ad-lab/1.0 (admin@iphones.la) backdrop research' };
const QUERIES = {
  cash: ['pile of US dollars', 'stack of hundred dollar bills', 'US dollar bills fanned', 'cash money pile', 'bundle of banknotes dollars', 'one hundred dollar bills close'],
  strips: ['OneTouch Verio test strips box', 'Accu-Chek Guide test strips', 'blood glucose test strip box packaging', 'Contour Next test strips', 'Dexcom G6 sensor box', 'FreeStyle Libre sensor box', 'diabetes test strip boxes retail'],
};
/* CATS=bikes,trucks,vans fetches only those pools */
const ONLY = process.env.CATS ? process.env.CATS.split(',') : null;
const OK = /CC0|Public domain|CC BY( |-)?(SA )?\d|CC-BY|CC BY-SA|Attribution/i;
const BAD = /NC|ND|GFDL only|Fair use|copyright/i;
const tfetch = (u, ms, opts) => { const c = new AbortController(); const t = setTimeout(() => c.abort(), ms); return fetch(u, Object.assign({ signal: c.signal, headers: UA }, opts || {})).finally(() => clearTimeout(t)); };
const slug = q => q.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const att = existsSync(OUT + 'ATTRIBUTION.json') ? JSON.parse(readFileSync(OUT + 'ATTRIBUTION.json', 'utf8')) : [];
const have = new Set(att.map(a => a.file));
let saved = 0;
for (const [cat, qs] of Object.entries(QUERIES)){
  if (ONLY && !ONLY.includes(cat)) continue;
  for (const q of qs){
    let pages;
    try {
      const u = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({ action: 'query', generator: 'search', gsrsearch: 'filetype:bitmap ' + q, gsrnamespace: '6', gsrlimit: '25',
        prop: 'imageinfo', iiprop: 'url|size|extmetadata', iiurlwidth: '1920', format: 'json' });
      const r = await tfetch(u, 25000); if (!r.ok){ console.log('  ' + cat.padEnd(8) + q + ': HTTP ' + r.status); continue; }
      const j = await r.json(); pages = Object.values((j.query || {}).pages || {});
    } catch (e){ console.log('  ' + cat.padEnd(8) + q + ': ' + e.message); continue; }
    let n = 0;
    pages.sort((a, b) => (a.index || 0) - (b.index || 0));
    for (const pg of pages){
      if (n >= WANT) break;
      const ii = pg.imageinfo && pg.imageinfo[0]; if (!ii) continue;
      const m = ii.extmetadata || {}, lic = (m.LicenseShortName || {}).value || '', usage = (m.UsageTerms || {}).value || '';
      if (!OK.test(lic) || BAD.test(lic)) continue;
      if ((ii.width || 0) < 1600 || (ii.height || 0) < 900 || ii.width < ii.height) continue;
      if (!/\.(jpe?g|png)$/i.test(pg.title)) continue;
      const file = cat + '-' + slug(q) + '-' + (n + 1) + '.jpg';
      if (have.has(file)){ n++; continue; }
      try {
        const ir = await tfetch(ii.thumburl || ii.url, 40000); if (!ir.ok) continue;
        const buf = Buffer.from(await ir.arrayBuffer()); if (buf.length < 60000) continue;
        writeFileSync(OUT + file, buf);
        att.push({ file, cat, query: q, title: pg.title, artist: ((m.Artist || {}).value || '').replace(/<[^>]+>/g, '').slice(0, 120), license: lic, usage, credit: ((m.Credit || {}).value || '').replace(/<[^>]+>/g, '').slice(0, 120),
                   page: 'https://commons.wikimedia.org/wiki/' + encodeURIComponent(pg.title), width: ii.width, height: ii.height });
        have.add(file); n++; saved++;
      } catch (e){}
    }
    console.log('  ' + cat.padEnd(8) + q.padEnd(40) + n + ' saved');
    writeFileSync(OUT + 'ATTRIBUTION.json', JSON.stringify(att, null, 1));
  }
}
console.log(`saved ${saved} new photos (${att.length} total) in ${OUT} · licences: ` + [...new Set(att.map(a => a.license))].join(' | '));
