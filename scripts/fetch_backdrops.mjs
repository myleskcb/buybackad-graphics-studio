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
  /* 2026-10-02, the owner on the car backdrops: "more popular cars and less
     bikes", "some trucks and work vans", "semis". One query per real model;
     what comes back is checked by eye and cut out with
     scripts/cut_vehicle_photos.py (add it to SPEC, plates boxed), then put in
     CAR_ROTA in scripts/gen_backdrops.py. No bikes. */
  popular: ['Toyota Camry', 'Toyota Corolla', 'Honda Accord', 'Honda Civic', 'Honda Civic Type R', 'Toyota RAV4', 'Honda CR-V',
            'Toyota 4Runner', 'Toyota Highlander', 'Tesla Model 3', 'Tesla Model Y', 'Jeep Wrangler', 'Nissan Rogue',
            'Chevrolet Tahoe', 'Ford Explorer', 'Hyundai Elantra', 'Lexus IS', 'Audi S5', 'BMW M3', 'Mercedes-Benz G-Class',
            'Lamborghini Urus', 'Bentley Bentayga', 'Honda Accord (tenth generation)', 'Ford Bronco', 'Ford Mustang',
            'Chevrolet Corvette', 'Dodge Charger', 'Porsche 911', 'Tesla Cybertruck', 'Range Rover', 'Cadillac Escalade',
            'Subaru Outback', 'Hyundai Tucson', 'Kia Telluride', 'Rolls-Royce Cullinan', 'Mercedes-Benz S-Class',
            /* owner, 2026-10-03: "more cars colors and similar models", "prius" */
            'Toyota Prius', 'Toyota Camry (XV80)', 'Toyota Corolla (E210)', 'Honda Civic (eleventh generation)',
            'Honda Accord (eleventh generation)', 'Toyota RAV4 (XA50)', 'Nissan Altima', 'Kia K5', 'Hyundai Sonata',
            'Mazda CX-5', 'Subaru Forester', 'Jeep Grand Cherokee', 'Honda Pilot', 'Kia Sorento', 'Toyota Sienna',
            'Honda Odyssey', 'Chevrolet Equinox', 'Ford Escape', 'Lexus RX', 'BMW X5', 'Mercedes-Benz GLE', 'Tesla Model S',
            /* owner: "better g wagon?", "G63?" */
            'Mercedes-AMG G 63', 'Mercedes-AMG G63 W463', 'Mercedes-AMG G 63 2024',
            /* owner: "show the best versions of each model": the top trims */
            'Toyota Camry XSE', 'Toyota GR Corolla', 'Toyota GR Supra', 'Honda Civic Type R (FL5)', 'Toyota RAV4 Prime',
            'Toyota 4Runner TRD Pro', 'Jeep Wrangler Rubicon', 'Ford Bronco Raptor', 'Ford Mustang Dark Horse',
            'Chevrolet Corvette Z06', 'Cadillac Escalade-V', 'BMW M3 Competition (G80)', 'Tesla Model S Plaid',
            'Lexus IS 500 F Sport', 'Audi RS 5 Sportback', 'Range Rover SV', 'Porsche 911 GT3', 'Lamborghini Urus Performante',
            'Bentley Bentayga Speed', 'Rolls-Royce Cullinan Black Badge', 'Dodge Challenger SRT Hellcat',
            /* owner: "Teslas" */
            'Tesla Model X', 'Tesla Roadster (first generation)'],
  /* owner: "What 2026 models can you find?", "How about rivian??", "And cyber truck" */
  y2026: ['2026 Toyota RAV4', '2026 Toyota Land Cruiser', '2026 Toyota GR Supra', '2026 Toyota Prius', '2026 Toyota Corolla',
          '2026 Toyota Tacoma', '2026 Toyota bZ4X', '2026 Toyota GR86', '2026 Honda Passport', '2026 Honda Civic',
          '2026 Honda Odyssey', '2026 Ford F-150 Raptor', '2026 Ford F-150 Lightning', '2026 Ford Maverick',
          '2026 Ford Bronco Sport', '2026 Ford F-350', '2026 Chevrolet Corvette', '2026 Chevrolet Silverado',
          '2026 Chevrolet Equinox EV', '2026 Chevrolet Blazer EV', '2026 Chevrolet Colorado', '2026 Tesla Model Y',
          '2026 Tesla Model 3', '2026 Tesla Cybertruck', 'Tesla Cybertruck Cyberbeast', '2026 Lexus ES', '2026 Lexus RX',
          '2026 Hyundai Palisade', '2026 Hyundai Ioniq 5', '2026 Hyundai Ioniq 9', '2026 Hyundai Santa Fe',
          '2026 Kia K5', '2026 Kia EV9', '2026 Kia Sportage', '2026 Kia Carnival', '2026 Kia K4', '2026 Nissan Pathfinder',
          '2026 Nissan Murano', '2026 Nissan Leaf', '2026 Nissan Kicks', '2026 Subaru Outback', '2026 Subaru Forester',
          '2026 Subaru Crosstrek', '2026 Jeep Cherokee', '2026 Jeep Grand Wagoneer', '2026 Jeep Wrangler',
          '2026 Jeep Gladiator', '2026 Ram 1500', '2026 GMC Sierra', '2026 Cadillac Escalade', '2026 Cadillac CT5-V Blackwing',
          '2026 Cadillac Vistiq', '2026 Mercedes-Benz GLE', '2026 BMW X5 M', '2026 Audi Q5', '2026 Audi Q6 e-tron',
          '2026 Lucid Gravity', '2026 Dodge Charger', '2026 Dodge Durango', '2026 Lamborghini Temerario',
          '2026 Ferrari 849 Testarossa', '2026 Volvo XC90', 'Rivian R1S', 'Rivian R2', 'Rivian R1T 2025'],
  /* owner: "some vintage or growing car models", "rare bmw", "rare porsches":
     collectibles whose prices are climbing */
  collect: ['Toyota Supra (A80)', 'Nissan Skyline GT-R R34', 'Honda NSX (NA1)', 'Honda S2000', 'Mazda RX-7 (FD)',
            'Toyota Land Cruiser FJ40', 'Toyota Land Cruiser 80', 'Ford Bronco (first generation)', 'Chevrolet Camaro 1969',
            'Ford Mustang 1967', 'Land Rover Defender 90', 'Mercedes-Benz 190 E 2.5-16 Evolution',
            'BMW M3 E30', 'BMW M3 CSL E46', 'BMW M1', 'BMW Z8', 'BMW 2002 turbo', 'BMW 3.0 CSL', 'BMW M5 E39',
            'BMW 1 Series M Coupe', 'Porsche 911 (993)', 'Porsche 911 (964)', 'Porsche 911 GT2 RS', 'Porsche 918 Spyder',
            'Porsche Carrera GT', 'Porsche 959', 'Porsche 911 R', 'Porsche 911 Sport Classic', 'Porsche 356'],
  trucks: ['Toyota Tacoma', 'Ford F-150', 'Chevrolet Silverado', 'Ram 1500', 'Toyota Tundra', 'GMC Sierra', 'Ford Ranger',
           'Ford Super Duty',
           /* owner, 2026-10-03: "more trucks" */
           'Chevrolet Colorado', 'Nissan Frontier', 'Ford Maverick', 'Rivian R1T', 'GMC Canyon', 'Ram 1500 TRX',
           'Ford F-150 Raptor', 'Toyota Tacoma TRD Pro', 'Chevrolet Silverado 1500', 'Nissan Titan', 'Honda Ridgeline',
           'Jeep Gladiator', 'GMC Sierra 1500', 'Toyota Tundra TRD Pro', 'Chevrolet Silverado ZR2', 'GMC Sierra Denali',
           'Ford F-150 Lightning', 'Ram 2500 Power Wagon', 'Ford F-250 Tremor', 'Tesla Cybertruck'],
  vans: ['Ford Transit', 'Mercedes-Benz Sprinter', 'Ram ProMaster', 'Chevrolet Express', 'Ford E-Series', 'Nissan NV200'],
  semis: ['Freightliner Cascadia', 'Peterbilt 579', 'Peterbilt 389', 'Kenworth T680', 'Kenworth W900', 'Volvo VNL',
          'International LT', 'Mack Anthem'],
};
/* CATS=popular,trucks,vans,semis fetches only those pools (PER=6 for more to choose from) */
const ONLY = process.env.CATS ? process.env.CATS.split(',') : null;
/* Q=camry,tahoe fetches only the queries that contain one of these (any case) */
const ONLYQ = process.env.Q ? process.env.Q.toLowerCase().split(',') : null;
const OK = /CC0|Public domain|CC BY( |-)?(SA )?\d|CC-BY|CC BY-SA|Attribution/i;
const BAD = /NC|ND|GFDL only|Fair use|copyright/i;
/* a maker's press photograph is not a photograph of a car someone sells us */
const PRESS = /\bpress(e|foto)?\b|pressefoto|newsroom|media kit|official photo|courtesy of|photo by (rivian|tesla|ford|toyota|honda|gm|chevrolet|bmw|mercedes|porsche|lucid|hyundai|kia|nissan|stellantis|jeep|ram|audi|volkswagen|lexus|cadillac)/i;
const tfetch = (u, ms, opts) => { const c = new AbortController(); const t = setTimeout(() => c.abort(), ms); return fetch(u, Object.assign({ signal: c.signal, headers: UA }, opts || {})).finally(() => clearTimeout(t)); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
/* upload.wikimedia.org answers 403 or 429 to thumbnails asked for too fast:
   wait (Retry-After when given) and ask again, and keep a gap between files */
async function getImage(u){
  for (let i = 0; i < 5; i++){
    const r = await tfetch(u, 40000);
    if (r.ok) return r;
    if (![403, 429, 503].includes(r.status)) return r;
    const ra = +(r.headers.get('retry-after') || 0);
    await sleep(Math.max(ra * 1000, [4000, 10000, 20000, 40000, 60000][i]));
  }
  return { ok:false };
}
const slug = q => q.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const att = existsSync(OUT + 'ATTRIBUTION.json') ? JSON.parse(readFileSync(OUT + 'ATTRIBUTION.json', 'utf8')) : [];
const have = new Set(att.map(a => a.file));
let saved = 0;
for (const [cat, qs] of Object.entries(QUERIES)){
  if (ONLY && !ONLY.includes(cat)) continue;
  for (const q of qs){
    if (ONLYQ && !ONLYQ.some(w => q.toLowerCase().includes(w))) continue;
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
      if (PRESS.test(pg.title + ' ' + ((m.Artist || {}).value || '') + ' ' + ((m.Credit || {}).value || ''))) continue;
      if ((ii.width || 0) < 1600 || (ii.height || 0) < 900 || ii.width < ii.height) continue;
      if (!/\.(jpe?g|png)$/i.test(pg.title)) continue;
      const file = cat + '-' + slug(q) + '-' + (n + 1) + '.jpg';
      if (have.has(file)){ n++; continue; }
      try {
        await sleep(1200);
        /* the API now names thumb.wikimedia.org for thumbnails; upload.wikimedia.org
           serves the same file at the same path */
        const ir = await getImage((ii.thumburl || ii.url).replace('://thumb.wikimedia.org/', '://upload.wikimedia.org/')); if (!ir.ok){ console.log('    could not download ' + pg.title); continue; }
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
