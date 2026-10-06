#!/usr/bin/env node
/* Real photographs for backdrops from Wikimedia Commons (the Openverse API
   was unreachable from here). Free licences only — CC0, public domain, CC BY,
   CC BY-SA — with the attribution kept in assets/bg-web/ATTRIBUTION.json.
   Each query is a scene a category needs; results are filtered to landscape
   and at least 1600px wide, downloaded at 1920px (MINW= and WIDTH= raise
   both; CATS=a,b fetches only those pools, PER= how many per query).
   A photograph over 2048 x 2048 pixels in area renders BLACK on a showcase
   card (the blur canvas and the treat filter, 2026-10-04: 13 of 18 at their
   2160px short side), and Commons often answers with the original: bring
   anything larger down to 2048 on its long side before a card uses it. */
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
/* owner, 2026-10-03: "More imagery, more alternate angles as much as you can
   give me": the rear and the side of each vehicle already in */
const ANGLE_MODELS = ['Toyota Camry', 'Toyota Corolla', 'Toyota Prius', 'Toyota RAV4', 'Toyota Highlander', 'Toyota 4Runner',
  'Toyota Tacoma', 'Toyota Tundra', 'Toyota Land Cruiser', 'Toyota GR Supra', 'Toyota GR Corolla', 'Honda Accord', 'Honda Civic',
  'Honda Civic Type R', 'Honda CR-V', 'Honda Pilot', 'Honda Ridgeline', 'Nissan Rogue', 'Nissan Frontier', 'Hyundai Tucson',
  'Hyundai Sonata', 'Hyundai Ioniq 5', 'Kia Telluride', 'Kia K5', 'Subaru Outback', 'Subaru Forester', 'Mazda CX-5',
  'Ford F-150', 'Ford F-150 Raptor', 'Ford Ranger', 'Ford Maverick', 'Ford Bronco', 'Ford Mustang', 'Ford Explorer',
  'Ford Transit', 'Chevrolet Silverado', 'Chevrolet Tahoe', 'Chevrolet Corvette', 'Chevrolet Equinox', 'GMC Sierra',
  'Ram 1500', 'Ram ProMaster', 'Jeep Wrangler', 'Jeep Grand Cherokee', 'Jeep Gladiator', 'Dodge Charger',
  'Tesla Model 3', 'Tesla Model Y', 'Tesla Model S', 'Tesla Model X', 'Tesla Cybertruck', 'Rivian R1S', 'Rivian R1T',
  'Cadillac Escalade', 'Lexus RX', 'Lexus IS', 'BMW M3', 'BMW X5', 'Audi RS 5', 'Mercedes-AMG G 63', 'Mercedes-Benz S-Class',
  'Mercedes-Benz Sprinter', 'Porsche 911', 'Porsche 911 GT3', 'Range Rover', 'Lamborghini Urus', 'Rolls-Royce Cullinan',
  'Bentley Bentayga', 'Peterbilt 579', 'Freightliner Cascadia', 'Kenworth T680', 'Volvo VNL'];
QUERIES.angles = ANGLE_MODELS.flatMap(m => [m + ' rear', m + ' side view']);
/* owner, 2026-10-03: "As much modern apple imagery as you can, please, we
   want our stuff to look like Apple ads": photographs of the devices we buy
   (2020 on), for the angles the storefront art does not have */
QUERIES.apple = ['iPhone 17 Pro', 'iPhone 17 Pro Max', 'iPhone Air', 'iPhone 17', 'iPhone 16 Pro', 'iPhone 16 Pro Max',
  'iPhone 16', 'iPhone 16 Plus', 'iPhone 16e', 'iPhone 15 Pro', 'iPhone 15 Pro Max', 'iPhone 15', 'iPhone 15 Plus',
  'iPhone 14 Pro', 'iPhone 14 Pro Max', 'iPhone 14', 'iPhone 13 Pro', 'iPhone 13 Pro Max', 'iPhone 13', 'iPhone 13 mini',
  'iPhone 12 Pro', 'iPhone 12 Pro Max', 'iPhone 12', 'iPhone 12 mini', 'iPad Pro M4', 'iPad Pro M5', 'iPad Pro 12.9 M2',
  'iPad Air M2', 'iPad Air M3', 'iPad Air 5th generation', 'iPad mini 7', 'iPad mini 6', 'iPad 10th generation',
  'iPad (A16)', 'MacBook Air M1', 'MacBook Air M2', 'MacBook Air M3', 'MacBook Air M4', 'MacBook Air 15-inch',
  'MacBook Pro 14-inch M1 Pro', 'MacBook Pro 14-inch M3', 'MacBook Pro 16-inch M1 Max', 'MacBook Pro M4', 'MacBook Pro 13-inch M1',
  'iMac 24-inch M1', 'iMac M3', 'iMac M4', 'Mac Studio', 'Mac mini M4', 'Mac mini M2', 'Apple Studio Display', 'Apple Pro Display XDR'];
/* owner, 2026-10-04: "more variety?" -> more car models and colours, and the
   other buy lines photographed for real */
QUERIES.popular2 = ['Hyundai Palisade', 'Hyundai Santa Fe', 'Hyundai Ioniq 6', 'Hyundai Kona', 'Kia Sportage', 'Kia Sorento',
  'Kia Carnival', 'Kia EV6', 'Kia EV9', 'Kia Soul', 'Nissan Altima', 'Nissan Pathfinder', 'Nissan Titan', 'Nissan Z', 'Nissan GT-R',
  'Volkswagen Jetta', 'Volkswagen Atlas', 'Volkswagen Tiguan', 'Volkswagen Golf GTI', 'Volkswagen ID.4', 'Subaru Crosstrek',
  'Subaru WRX', 'Mazda3', 'Mazda CX-90', 'Mazda MX-5 Miata', 'Chevrolet Malibu', 'Chevrolet Traverse', 'Chevrolet Suburban',
  'Chevrolet Camaro', 'Chevrolet Trax', 'GMC Yukon', 'GMC Hummer EV', 'Buick Enclave', 'Dodge Durango', 'Dodge Challenger',
  'Chrysler Pacifica', 'Jeep Cherokee', 'Jeep Compass', 'Jeep Wagoneer', 'Ford Expedition', 'Ford Edge', 'Ford Mustang Mach-E',
  'Lincoln Navigator', 'Lincoln Aviator', 'Toyota Sequoia', 'Toyota Venza', 'Toyota Crown', 'Toyota GR86', 'Honda HR-V',
  'Honda Passport', 'Honda Odyssey', 'Acura MDX', 'Acura RDX', 'Acura Integra', 'Lexus ES', 'Lexus NX', 'Lexus GX', 'Lexus LX',
  'Infiniti QX60', 'Genesis GV80', 'Genesis G70', 'Audi Q5', 'Audi Q7', 'Audi A4', 'Audi R8', 'Audi e-tron GT', 'BMW 3 Series',
  'BMW 5 Series', 'BMW X3', 'BMW X7', 'BMW M4', 'BMW i4', 'Mercedes-Benz C-Class', 'Mercedes-Benz E-Class', 'Mercedes-Benz GLC',
  'Mercedes-Benz GLS', 'Mercedes-AMG GT', 'Porsche Cayenne', 'Porsche Macan', 'Porsche Taycan', 'Porsche Panamera',
  'Land Rover Defender 110', 'Range Rover Sport', 'Volvo XC60', 'Volvo XC90', 'Lucid Air', 'Polestar 2', 'Mini Cooper',
  'Ferrari 296', 'Ferrari Roma', 'Ferrari F8', 'McLaren 720S', 'Aston Martin DB11', 'Maserati MC20', 'Rolls-Royce Ghost',
  'Bentley Continental GT', 'Lamborghini Huracan', 'Lamborghini Aventador'];
QUERIES.colours = ['Toyota Camry', 'Toyota Corolla', 'Toyota RAV4', 'Toyota Tacoma', 'Toyota 4Runner', 'Toyota Highlander',
  'Toyota Tundra', 'Honda Civic', 'Honda Accord', 'Honda CR-V', 'Ford F-150', 'Ford Bronco', 'Chevrolet Silverado',
  'Tesla Model 3', 'Tesla Model Y', 'Jeep Wrangler', 'Ram 1500', 'Ford Mustang', 'Chevrolet Corvette', 'Mercedes-AMG G 63']
  .flatMap(m => ['red', 'blue', 'black', 'grey'].map(c => m + ' ' + c));
QUERIES.gold = ['gold bullion bar', 'gold coin American Eagle', 'gold Krugerrand', 'gold Maple Leaf coin', 'gold chain necklace',
  'gold ring', 'gold bracelet', 'gold watch Rolex', 'gold nugget', 'gold jewelry'];
QUERIES.silver = ['silver bullion bar', 'American Silver Eagle', 'silver Maple Leaf coin', 'Morgan silver dollar', 'Peace dollar',
  'sterling silver flatware', 'silver tea set', 'silver bracelet', 'silver bars stack', 'silver coins'];
QUERIES.coins = ['Morgan dollar', 'Walking Liberty half dollar', 'Saint-Gaudens double eagle', 'Indian Head cent', 'Buffalo nickel',
  'Mercury dime', 'Lincoln wheat penny', 'Liberty Head double eagle', 'PCGS slab coin', 'NGC graded coin', 'coin collection'];
QUERIES.sportsc = ['PSA graded card slab', 'sports trading card', 'baseball card', 'basketball card', 'football card',
  'graded trading card', 'trading card collection', 'card binder'];
QUERIES.poke = ['Pokemon trading card game', 'Pokemon booster pack', 'Pokemon card PSA', 'Pokemon cards', 'Pokemon booster box'];
QUERIES.gaming = ['PlayStation 5', 'PlayStation 5 Pro', 'Xbox Series X', 'Xbox Series S', 'Nintendo Switch', 'Nintendo Switch OLED',
  'Nintendo Switch 2', 'Steam Deck', 'DualSense controller', 'Xbox controller', 'Meta Quest 3', 'ROG Ally', 'gaming laptop'];
QUERIES.audio = ['AirPods Pro', 'AirPods Max', 'AirPods 4', 'Sony WH-1000XM5', 'Bose QuietComfort headphones', 'Beats Studio Pro',
  'Sony WF-1000XM5', 'Samsung Galaxy Buds', 'Beats Fit Pro', 'Bose QuietComfort Earbuds', 'Sonos speaker', 'JBL speaker'];
QUERIES.cameras = ['Canon EOS R5', 'Canon EOS R6', 'Sony Alpha a7 IV', 'Sony a7R', 'Nikon Z6', 'Nikon Z8', 'Fujifilm X-T5',
  'Fujifilm X100V', 'Leica Q2', 'GoPro HERO', 'DJI Mini 4 Pro', 'DJI Mavic 3', 'DJI Osmo Pocket', 'Canon EOS 5D', 'camera lens'];
QUERIES.wearables = ['Apple Watch Ultra', 'Apple Watch Series 9', 'Apple Watch Series 10', 'Apple Watch', 'Galaxy Watch',
  'Pixel Watch', 'Garmin Fenix', 'Apple Vision Pro', 'Meta Ray-Ban'];
/* owner, 2026-10-04: "audit the cameras again, wearables, computers, headphones, audio,
   gaming, Pokémon a lot more Pokémon a lot more rare coins, golden jewelry, Mac, iMac,
   MacBook, iPad": a second, wider round for each */
QUERIES.coins2 = ['Morgan silver dollar NNC', 'Peace dollar NNC', 'Barber half dollar', 'Seated Liberty dollar', 'Standing Liberty quarter',
  'Franklin half dollar', 'Kennedy half dollar', 'Eisenhower dollar', 'Liberty nickel', 'Flying Eagle cent', 'Two-cent piece',
  'Indian Head eagle', 'Liberty Head eagle', 'Indian Head half eagle', 'quarter eagle gold coin', 'three-dollar gold piece',
  'gold dollar coin', 'Trade dollar', 'Draped Bust dollar', 'Capped Bust half dollar', 'commemorative half dollar',
  'American Platinum Eagle', 'American Gold Buffalo', 'Britannia gold coin', 'Vienna Philharmonic coin', 'Chinese Panda coin',
  'sovereign gold coin', 'Mexican 50 pesos gold', 'Silver Eagle proof', 'proof set coins', 'coin roll', 'graded coin slab'];
QUERIES.gold2 = ['gold signet ring', 'gold wedding band', 'gold bangle', 'gold pendant', 'gold earrings', 'gold rope chain',
  'gold cuban link', 'gold locket', 'gold brooch', 'gold cufflinks', 'gold medallion', 'diamond ring gold', 'gold bracelet charm',
  'Rolex Datejust gold', 'Rolex Day-Date', 'gold wristwatch', 'gold bar 1 kg', 'gold bars stack', 'gold coins stack', 'gold grain'];
QUERIES.poke2 = ['Pokemon card', 'Pokémon card', 'Pokémon Trading Card Game', 'Pokemon TCG', 'Pikachu card', 'Charizard card',
  'Pokémon booster pack', 'Pokemon booster', 'Pokémon card collection', 'Pokemon card binder', 'Pokémon Elite Trainer Box',
  'Pokemon card graded', 'Pokémon cards Japanese', 'trading card game cards'];
QUERIES.cameras2 = ['Canon EOS R', 'Canon EOS R7', 'Sony Alpha 6400', 'Sony ZV-E10', 'Nikon D850', 'Nikon Z f', 'Nikon Z 6II',
  'Fujifilm X100VI', 'Fujifilm X-S20', 'Leica M11', 'Leica M10', 'Hasselblad X2D', 'Panasonic Lumix S5', 'Ricoh GR III',
  'Canon PowerShot G7 X', 'Instax Mini', 'DJI Air 3', 'DJI Avata', 'DJI Mini 3', 'Insta360', 'GoPro HERO12', 'Sigma lens', 'Sony FE lens'];
QUERIES.audio2 = ['Sony WH-1000XM4', 'Bose QuietComfort 45', 'Bose Noise Cancelling Headphones 700', 'Beats Solo', 'Beats Studio',
  'Sennheiser Momentum', 'AirPods 3', 'AirPods 2', 'Marshall speaker', 'Bose SoundLink', 'Sonos Era', 'HomePod', 'Audio-Technica headphones',
  'Shure microphone', 'Beats Powerbeats Pro', 'Jabra Elite'];
QUERIES.gaming2 = ['PlayStation 5 Slim', 'PlayStation 4 Pro', 'PlayStation 4', 'Xbox One X', 'Xbox One S', 'Nintendo Switch Lite',
  'Game Boy', 'Game Boy Advance', 'Nintendo 3DS', 'Nintendo DS', 'PlayStation Portal', 'PlayStation Vita', 'Xbox Elite controller',
  'Joy-Con', 'PlayStation VR2', 'Meta Quest 2', 'Valve Index', 'Nintendo 64', 'Super Nintendo', 'Sega Genesis'];
QUERIES.wearables2 = ['Apple Watch SE', 'Apple Watch Ultra 2', 'Apple Watch Series 8', 'Apple Watch Series 7', 'Apple Watch Series 6',
  'Samsung Galaxy Watch 6', 'Samsung Galaxy Watch Ultra', 'Garmin Forerunner', 'Garmin Venu', 'Fitbit', 'Oura Ring', 'Apple Watch band'];
QUERIES.computers2 = ['Microsoft Surface Laptop', 'Microsoft Surface Pro', 'Dell XPS 13', 'ThinkPad X1 Carbon', 'HP Spectre', 'Razer Blade',
  'gaming PC', 'Alienware', 'Chromebook', 'Mac mini M2', 'Mac mini M4', 'Mac Studio', 'Mac Pro 2019', 'Apple Studio Display',
  'Pro Display XDR', 'Magic Keyboard', 'Magic Mouse'];
QUERIES.apple2 = ['MacBook Pro M1', 'MacBook Pro 14-inch', 'MacBook Pro 16-inch', 'MacBook Pro M3', 'MacBook Air M3', 'MacBook Air 13',
  'MacBook Pro 13', 'iMac M1', 'iMac 24-inch', 'iMac M3', 'iMac 2020', 'iPad Pro M4', 'iPad Pro 12.9', 'iPad Pro 11', 'iPad Air',
  'iPad Air 5', 'iPad mini 6', 'iPad mini', 'iPad 10th generation', 'iPad 9th generation', 'Apple Pencil', 'iPad Magic Keyboard'];
/* sports cards: the Library of Congress's public-domain scans of real vintage cards */
QUERIES.sports2 = ['T206 baseball card', 'T206 Honus Wagner', 'Old Judge baseball card', 'Goudey baseball card', 'Allen Ginter baseball card',
  'Benjamin K. Edwards collection baseball card', 'tobacco card baseball', 'Cracker Jack baseball card', 'baseball card 1910',
  'baseball card 1887', 'Mayo Cut Plug baseball card', 'football card 1890s'];
const PORTRAIT_OK = new Set(['apple', 'gold', 'silver', 'coins', 'sportsc', 'poke', 'gaming', 'audio', 'cameras', 'wearables', 'sports2',
  'coins2', 'gold2', 'poke2', 'cameras2', 'audio2', 'gaming2', 'wearables2', 'computers2', 'apple2']);
/* SKIP=file.json (an ATTRIBUTION list) skips Commons files already downloaded under another name */
const SKIP = new Set(process.env.SKIP ? JSON.parse(readFileSync(process.env.SKIP, 'utf8')).map(a => a.title) : []);
/* 2026-10-04, claude/beautiful-wozniak-xmvvuk: the drawn-ground cards still held for want of
   a photograph (OPEN-ITEMS §AJ 1): sports 8, gold 5, coins 4, cars 3, pokemon 2, silver 2.
   Pools of the same name as the ones above take these queries as well. */
const HELD_POOLS = {
  sports:  ['baseball card collection', 'vintage baseball cards', 'trading card show', 'sports card shop', 'baseball cards binder', 'basketball trading cards', 'graded sports card',
            'baseball and glove', 'baseball bat and ball', 'baseball on grass', 'basketball on court', 'baseball memorabilia', 'sports memorabilia collection', 'baseball stadium night', 'american football on field'],
  gold:    ['gold jewelry display', 'gold chains jewelry', 'gold rings', 'gold bullion bars', 'gold necklace', 'gold coins'],
  coins:   ['coin collection', 'Morgan silver dollar', 'old coins', 'numismatic collection', 'coins on table', 'silver coins'],
  silver:  ['silver bullion bars', 'sterling silver flatware', 'silverware', 'silver jewelry', 'silver bars and coins'],
  pokemon: ['trading card game cards', 'collectible card game binder', 'trading cards collection', 'card game booster packs'],
  cars:    ['used car lot', 'car dealership lot', 'parked cars at night', 'car keys in hand', 'cars parked street']
};
for (const [k, qs] of Object.entries(HELD_POOLS)) QUERIES[k] = [...new Set([...(QUERIES[k] || []), ...qs])];
/* QUERIES_FILE=queries.json fetches those pools instead ({ cat: [query, …] }) */
if (process.env.QUERIES_FILE){ const q = JSON.parse(readFileSync(process.env.QUERIES_FILE, 'utf8')); Object.keys(QUERIES).forEach(k => delete QUERIES[k]); Object.assign(QUERIES, q); }
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
      const u = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({ action: 'query', generator: 'search', gsrsearch: 'filetype:bitmap ' + q, gsrnamespace: '6', gsrlimit: process.env.SQUARE ? '50' : '25',
        prop: 'imageinfo', iiprop: 'url|size|extmetadata', iiurlwidth: String(+(process.env.WIDTH || 1920)), format: 'json' });
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
      if (SKIP.has(pg.title) || att.some(a => a.title === pg.title)) continue;
      if (PRESS.test(pg.title + ' ' + ((m.Artist || {}).value || '') + ' ' + ((m.Credit || {}).value || ''))) continue;
      /* SQUARE=1: any orientation 1200 px or more on its short side (a square card crops the
         middle); else a phone or a tablet is often shot upright: the apple pool takes portrait too */
      if (process.env.SQUARE ? Math.min(ii.width || 0, ii.height || 0) < 1200
        : PORTRAIT_OK.has(cat) ? Math.max(ii.width || 0, ii.height || 0) < 1600 || Math.min(ii.width || 0, ii.height || 0) < 900
        : (ii.width || 0) < +(process.env.MINW || 1600) || (ii.height || 0) < 900 || ii.width < ii.height) continue;
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
