#!/usr/bin/env node
/* Brand logos from Wikimedia Commons (vector originals rendered to 900px PNG), one per brand, with attribution.
   LOGO_ONLY=a,b limits brands. Output assets/logos/<slug>.png + assets/logos/ATTRIBUTION.json */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname, OUT = ROOT + 'assets/logos/'; mkdirSync(OUT, { recursive: true });
const UA = { 'User-Agent': 'buyback-ad-lab/1.0 (admin@iphones.la) logo research' };
const tfetch = (u, ms) => { const c = new AbortController(); const t = setTimeout(() => c.abort(), ms); return fetch(u, { signal: c.signal, headers: UA }).finally(() => clearTimeout(t)); };
const BRANDS = {
  cars: ['Toyota','Honda','Ford','Chevrolet','Nissan','Hyundai','Kia','Subaru','Tesla','BMW','Mercedes-Benz','Audi','Lexus','Jeep','Ram Trucks','GMC','Dodge','Mazda','Volkswagen','Acura','Infiniti','Cadillac','Porsche','Land Rover','Volvo Cars'],
  bikes: ['Harley-Davidson','Yamaha Motor','Kawasaki','Suzuki','Ducati','Triumph Motorcycles','KTM','Indian Motorcycle'],
  tech: ['Apple','Samsung','Google','PlayStation','Xbox','Nintendo','DJI','GoPro','Bose','Beats Electronics','Dyson','Canon','Nikon','Garmin','Meta Platforms','Microsoft'],
  cards: ['Pokémon','PSA Professional Sports Authenticator','Beckett Grading','CGC Comics','Topps','Panini Group','Upper Deck'],
  metals: ['PAMP','Royal Canadian Mint','United States Mint','Perth Mint'],
  strips: ['OneTouch','Accu-Chek','FreeStyle Libre','Dexcom','Contour Bayer'],
  competitors: ['Carvana','CarMax','Kelley Blue Book','AutoNation','ecoATM','Gazelle Inc','Back Market','Best Buy','Verizon','T-Mobile','EZCORP','TCGplayer','GameStop','Goldin Auctions','Fanatics Inc'],
};
/* exact Commons titles for the brands the search got wrong (the first pass took 'Toyota Mobility Tokyo', 'Honda F1', a World Cup emblem for Kia…) */
const EXACT = { 'Toyota':['File:Toyota.svg','File:Toyota carlogo.svg','File:Toyota logo (Red).svg'], 'Honda':['File:Honda.svg','File:Honda Logo.svg','File:Honda-logo.svg'], 'Chevrolet':['File:Chevrolet.svg','File:Chevrolet-logo.svg','File:Chevrolet logo.svg'],
  'Nissan':['File:Nissan 2020 logo.svg','File:Nissan logo.svg'], 'Kia':['File:KIA logo2.svg','File:Kia-logo.svg','File:Kia logo.svg'], 'Tesla':['File:Tesla Motors.svg','File:Tesla logo.svg','File:Tesla T symbol.svg'], 'BMW':['File:BMW.svg','File:BMW logo (gray).svg','File:BMW logo.svg'],
  'Porsche':['File:Porsche Logo.svg','File:Porsche logo.svg','File:Porsche wordmark.svg'], 'Land Rover':['File:Land Rover logo black.svg','File:Land Rover logo.svg','File:LandRover.svg'], 'KTM':['File:KTM-Logo.svg','File:KTM logo.svg','File:KTM-Sportmotorcycle-Logo.svg'],
  'Samsung':['File:Samsung Logo.svg','File:Samsung wordmark.svg','File:Samsung logo blue.svg'], 'Bose':['File:Bose logo.svg','File:Bose Corporation logo.svg'], 'Canon':['File:Canon wordmark.svg','File:Canon logo.svg','File:Canon logo vector.svg'], 'Lexus':['File:Lexus division emblem.svg','File:Lexus logo.svg','File:Lexus.svg'],
  'Garmin':['File:Garmin logo 2006.svg','File:Garmin logo.svg'], 'United States Mint':['File:United States Mint logo.svg','File:US Mint logo.svg','File:Seal of the United States Mint.svg'], 'OneTouch':['File:OneTouch logo.svg','File:LifeScan logo.svg'],
  'PSA Professional Sports Authenticator':['File:PSA logo.svg','File:Professional Sports Authenticator logo.svg'], 'Beckett Grading':['File:Beckett Media logo.svg','File:Beckett logo.svg'], 'CGC Comics':['File:CGC logo.svg','File:Certified Guaranty Company logo.svg'],
  'Panini Group':['File:Panini logo.svg','File:Panini Group logo.svg'], 'PAMP':['File:PAMP logo.svg'], 'Royal Canadian Mint':['File:Royal Canadian Mint logo.svg','File:Royal Canadian Mint Logo.svg'], 'Perth Mint':['File:Perth Mint logo.svg'], 'Accu-Chek':['File:Accu-Chek logo.svg','File:Accu-Chek.svg'], 'FreeStyle Libre':['File:FreeStyle Libre logo.svg','File:Abbott Laboratories logo.svg'], 'Contour Bayer':['File:Ascensia Diabetes Care logo.svg','File:Contour logo.svg'] };
Object.assign(EXACT, {
  'Carvana':['File:Carvana logo.svg','File:Carvana.svg'], 'CarMax':['File:CarMax logo.svg','File:CarMax.svg'],
  'Kelley Blue Book':['File:Kelley Blue Book logo.svg','File:KBB logo.svg'], 'AutoNation':['File:AutoNation logo.svg','File:AutoNation.svg'],
  'ecoATM':['File:EcoATM logo.svg'], 'Gazelle Inc':['File:Gazelle logo.svg'], 'Back Market':['File:Back Market logo.svg','File:BackMarket logo.svg'],
  'Best Buy':['File:Best Buy logo 2018.svg','File:Best Buy Logo.svg','File:Best Buy logo.svg'], 'Verizon':['File:Verizon 2015 logo -vector.svg','File:Verizon logo.svg','File:Verizon 2015 logo.svg'],
  'T-Mobile':['File:T-Mobile logo 2022.svg','File:T-Mobile logo.svg','File:T-Mobile US Logo.svg'], 'EZCORP':['File:EZCORP logo.svg','File:EZPAWN logo.svg'],
  'TCGplayer':['File:TCGplayer logo.svg'], 'GameStop':['File:GameStop.svg','File:GameStop logo.svg'], 'Goldin Auctions':['File:Goldin Auctions logo.svg'],
  'Fanatics Inc':['File:Fanatics logo.svg','File:Fanatics, Inc. logo.svg'] });
const REDO = process.env.LOGO_REDO === '1';
async function exact(brand){
  for (const title of (EXACT[brand] || [])){
    const u = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({ action: 'query', titles: title, prop: 'imageinfo', iiprop: 'url|size|extmetadata|mime', iiurlwidth: '900', format: 'json' });
    try { const r = await tfetch(u, 20000); if (!r.ok) continue; const pg = Object.values(((await r.json()).query || {}).pages || {})[0]; const ii = pg && pg.imageinfo && pg.imageinfo[0]; if (!ii) continue;
      return { title: pg.title, url: ii.thumburl, page: ii.descriptionurl, license: (ii.extmetadata.LicenseShortName || {}).value, w: ii.width, h: ii.height }; } catch (e) {}
  }
  return null;
}
const only = process.env.LOGO_ONLY ? process.env.LOGO_ONLY.split(',') : null;
const attr = existsSync(OUT + 'ATTRIBUTION.json') ? JSON.parse(readFileSync(OUT + 'ATTRIBUTION.json', 'utf8')) : {};
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
for (const [cat, list] of Object.entries(BRANDS)) for (const brand of list){
  if (only && !only.includes(brand)) continue;
  const id = slug(brand); if (existsSync(OUT + id + '.png') && !(REDO && EXACT[brand])) { console.log('  have ' + id); continue; }
  try {
    let hit = await exact(brand);
    if (!hit) {
    const u = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({ action: 'query', generator: 'search', gsrsearch: 'filetype:drawing ' + brand + ' logo', gsrnamespace: '6', gsrlimit: '12',
      prop: 'imageinfo', iiprop: 'url|size|extmetadata|mime', iiurlwidth: '900', format: 'json' });
    const r = await tfetch(u, 25000); if (!r.ok){ console.log('  ' + id + ': HTTP ' + r.status); continue; }
    const pages = Object.values(((await r.json()).query || {}).pages || {}).sort((a, b) => a.index - b.index);
    for (const pg of pages){ const ii = pg.imageinfo && pg.imageinfo[0]; if (!ii || ii.mime !== 'image/svg+xml') continue;
      const t = pg.title.toLowerCase(); if (!/logo|wordmark|emblem|badge/.test(t)) continue; if (/old|19\d\d|200\d|20\d\d.*20\d\d|-\d{4}\.svg|until|former/.test(t) && !/current/.test(t)) continue;
      hit = { title: pg.title, url: ii.thumburl, page: ii.descriptionurl, license: (ii.extmetadata.LicenseShortName || {}).value, w: ii.width, h: ii.height }; break; }
    }
    if (!hit){ console.log('  ' + id + ': no svg logo'); continue; }
    const img = await tfetch(hit.url, 30000); if (!img.ok){ console.log('  ' + id + ': png HTTP ' + img.status); continue; }
    writeFileSync(OUT + id + '.png', Buffer.from(await img.arrayBuffer()));
    attr[id] = { brand, cat, ...hit, note: 'trademark of its owner; nominative use in "we buy" copy is the shop\'s call' };
    writeFileSync(OUT + 'ATTRIBUTION.json', JSON.stringify(attr, null, 1));
    console.log('  ' + id.padEnd(28) + hit.title + '  ' + hit.license);
  } catch (e){ console.log('  ' + id + ': ' + e.message); }
}
console.log('done');
