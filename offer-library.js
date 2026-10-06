/* THE OFFER FAMILY, 2026-09-27.
 *
 * The 50 offer cards drawn for iPhones.LA (a studio sweep with the product
 * standing on it, a small models line, a headline in the owner's voice, three
 * steps, and a big number on a band) are the look the owner asked for across
 * the whole library: "the best ones we go ahead and apply to multiple
 * categories", then the buying lines next to phones ("gaming PCs, modern
 * Samsung models, Google Pixel phones, foldable phones, Meta glasses,
 * consoles ... headphones ... monitor buyer, SSD buyer, mini PCs ...
 * Chromebooks sealed"), which get categories of their own ("this is alternate
 * media and we will create some alternate categories for").
 *
 * The owner's generator varies three layouts over ten studio colours; this
 * doubles every axis: six layouts (studio row, studio list, photo band, split,
 * centre, and a type-only card for a line the library has no clean picture
 * of), twenty looks, twelve type pairings.
 *
 * This file loads AFTER app.js, so none of app.js's load-time passes touch
 * these cards (assignStyle's duotone, bodyPanel, the brand vocabulary): they
 * are drawn as authored, and scripts/audit_templates.mjs holds them to the
 * showcase's bar like every classic. What they are built to:
 *
 *   - the number is the second biggest thing on the card (78px on the 1080
 *     card, 8px digits in a 160px feed tile) and the headline at least 1.3x
 *     it (DESIGN-LAW 53);
 *   - two type families at most, in weights the faces ship;
 *   - every look's inks are chosen for 4.5:1 or better on their own ground,
 *     the headline 6:1, the number 6:1 on its band (checked in
 *     scripts/audit_templates.mjs on the pixels);
 *   - copy states how the offer works (DESIGN-LAW 55): message, meet, get
 *     paid. No price, no rating, no clock, no "every" or "all three". A
 *     headline names only what the picture shows or the kind of thing it
 *     shows; a line with no clean picture is set in type alone rather than
 *     over the wrong device;
 *   - product pictures only from the clean list: drawn at no more than their
 *     own pixels, none in assets/cutout-flags.json;
 *   - every card stands on a photograph of its own goods, in its own colour
 *     under a neutral shade solved for its white type (DESIGN-LAW 56); the
 *     steps sit on a solid panel in the look's colour (2026-09-27, the owner:
 *     "the gray sections should have a background image");
 *   - each category speaks in its own display faces (FLAVOR), paired with a
 *     plain reading face (the owner: "type faces that have personality");
 *   - the card categories show real cards: a PSA 10 Charizard cut from a
 *     Commons photograph, and ph-* placeholders for sports until real
 *     photographs are sourced (scripts/make_card_assets.py).
 */
(function offerLibrary(){
  if (typeof TEMPLATES === 'undefined' || typeof CUTOUT_EXT === 'undefined') return;
  const W = 1080, M = 80, CX = W / 2;
  const NUMBER = '(562) 999-4994', SITE = 'iPhones.LA/sell';
  const NUM_PX = 78;                         // the number; every headline is at least 1.3x this
  const HEAD_MIN = Math.ceil(NUM_PX * 1.31);
  const BT = 884;                            // top of the action band

  const t  = (name, role, casing, text, props) => ({ kind:'text', name, role, casing, text, props });
  const tb = (name, role, casing, text, props) => ({ kind:'textbox', name, role, casing, text, props });
  const r  = (name, props) => ({ kind:'rect', name, solid:true, props });
  const ci = (name, props) => ({ kind:'circle', name, props });
  const sh = (color, blur, x, y) => ({ color, blur, offsetX:x || 0, offsetY:y || 0 });

  /* ── LOOKS: a studio ground (top to bottom), its inks, and the action band.
     ink = headline and step titles, sub = details, acc = the models line and
     the step markers (text-safe on the ground), band / bandInk / bandSub = the
     number's plate, the number, and the label and site on it. dark looks can
     carry the photo band. */
  const LOOKS = {
    bone:     { g1:'#f3efe6', g2:'#e4ddcf', ink:'#16140f', sub:'#4a453b', acc:'#1d6b3a', band:'#16140f', bandInk:'#f7f3ea', bandSub:'#cfc8b8' },
    midnight: { dark:1, g1:'#1c2644', g2:'#0c1226', ink:'#f5f7ff', sub:'#b3bddb', acc:'#8fe3b0', band:'#f5c84b', bandInk:'#14110a', bandSub:'#4a3a0c' },
    forest:   { dark:1, g1:'#1a3d2e', g2:'#0b1f17', ink:'#f2f7f2', sub:'#b2cfbd', acc:'#a6e67f', band:'#a6e67f', bandInk:'#0a1a12', bandSub:'#1f3d2c' },
    cobalt:   { dark:1, g1:'#2447c4', g2:'#1a2c88', ink:'#ffffff', sub:'#d7defc', acc:'#ffe066', band:'#ffd84a', bandInk:'#121212', bandSub:'#3b3208' },
    graphite: { dark:1, g1:'#2e3034', g2:'#17181b', ink:'#f4f4f5', sub:'#bcbec3', acc:'#ff9a52', band:'#ff8a3d', bandInk:'#14100c', bandSub:'#3d2410' },
    violet:   { dark:1, g1:'#3d2475', g2:'#1f1142', ink:'#f7f2ff', sub:'#d0c2f0', acc:'#cdb4ff', band:'#c6b3ff', bandInk:'#160f2a', bandSub:'#3a2d5c' },
    sun:      { g1:'#f8d544', g2:'#efc21d', ink:'#1a1604', sub:'#40360e', acc:'#1a1604', band:'#1a1604', bandInk:'#f8d544', bandSub:'#d8cfa6' },
    signal:   { g1:'#ff8036', g2:'#f2661c', ink:'#1a0d05', sub:'#130903', acc:'#1a0d05', band:'#1a0d05', bandInk:'#ff9152', bandSub:'#e9c9b3' },
    blush:    { g1:'#f5d9d6', g2:'#e9c3bf', ink:'#2a1614', sub:'#4f3330', acc:'#8e2a35', band:'#2a1614', bandInk:'#f7dcd8', bandSub:'#d4b5b1' },
    mint:     { g1:'#d9f1e5', g2:'#c1e5d2', ink:'#0f2a1e', sub:'#2f4b3e', acc:'#0f6b44', band:'#0f2a1e', bandInk:'#c9f2dd', bandSub:'#a9cdbb' },
    ink:      { dark:1, g1:'#18181b', g2:'#0a0a0b', ink:'#ffffff', sub:'#bdbdc4', acc:'#e4ff5c', band:'#e4ff5c', bandInk:'#111111', bandSub:'#3a4210' },
    sand:     { g1:'#ecdec7', g2:'#dcc8a6', ink:'#1f170d', sub:'#433725', acc:'#8a3b12', band:'#8a3b12', bandInk:'#fff4e6', bandSub:'#f3d3bd' },
    teal:     { dark:1, g1:'#11535a', g2:'#083237', ink:'#effcfb', sub:'#aad8d5', acc:'#ffc866', band:'#ffc466', bandInk:'#1b1204', bandSub:'#4a3510' },
    plum:     { dark:1, g1:'#4f1a3c', g2:'#2b0c20', ink:'#fff0f7', sub:'#e6bcd2', acc:'#ffa3cc', band:'#ff9ec8', bandInk:'#2b0c20', bandSub:'#5c1d42' },
    sky:      { g1:'#dcedfc', g2:'#c3dcf4', ink:'#0d2138', sub:'#2f435c', acc:'#1a58b8', band:'#0d2138', bandInk:'#dcedfc', bandSub:'#a7bdd6' },
    lime:     { g1:'#dcf36f', g2:'#c8e548', ink:'#142004', sub:'#374810', acc:'#142004', band:'#142004', bandInk:'#dcf36f', bandSub:'#b5c77e' },
    slate:    { dark:1, g1:'#404d60', g2:'#232c39', ink:'#f3f6fa', sub:'#c1cbd8', acc:'#8ccbff', band:'#8ccbff', bandInk:'#0f141b', bandSub:'#1d3347' },
    cream:    { g1:'#fbf5e6', g2:'#f0e5cb', ink:'#2a1d0a', sub:'#58482a', acc:'#a3221b', band:'#a3221b', bandInk:'#fff5e8', bandSub:'#f6d2cb' },
    oxblood:  { dark:1, g1:'#5e161c', g2:'#360a0e', ink:'#fff1ea', sub:'#e8bdb4', acc:'#ffb892', band:'#ffb38a', bandInk:'#2a0a07', bandSub:'#5c2419' },
    arctic:   { g1:'#eef4f8', g2:'#dce7ef', ink:'#0f1d2a', sub:'#3a4b5b', acc:'#0a6978', band:'#0a6978', bandInk:'#ffffff', bandSub:'#cdeef2' },
  };
  const LOOK_KEYS = Object.keys(LOOKS), DARK_KEYS = LOOK_KEYS.filter(k => LOOKS[k].dark);

  /* ── FACES: a display face for the headline and a reading face for the rest
     (the number included, as on the owner's cards). em = the face's average
     advance per em for mixed-case text, for fitting headlines at build time,
     measured in the browser (the widest of every headline here, at the display
     weight, so the estimate is never narrower than the type);
     cond marks the faces narrow enough for the split and photo columns. */
  const FACES = [
    { key:'serif',    d:'Young Serif',                dw:400, lh:1.02, em:0.60, r:'Manrope',          rw:700 },
    { key:'schib',    d:'Schibsted Grotesk',          dw:800, lh:0.98, em:0.60, r:'Schibsted Grotesk', rw:700 },
    { key:'slab',     d:'Zilla Slab',                 dw:700, lh:1.0,  em:0.53, r:'Zilla Slab',        rw:700 },
    { key:'shoulder', d:'Big Shoulders Display',      dw:700, lh:0.94, em:0.41, r:'Libre Franklin',    rw:700, cond:1 },
    { key:'sofia',    d:'Sofia Sans Extra Condensed', dw:800, lh:0.92, em:0.37, r:'Chivo',             rw:700, cond:1 },
    { key:'bounded',  d:'Unbounded',                  dw:700, lh:1.04, em:0.76, r:'Instrument Sans',   rw:700 },
    { key:'gloock',   d:'Gloock',                     dw:400, lh:1.02, em:0.56, r:'Instrument Sans',   rw:700 },
    { key:'bric',     d:'Bricolage Grotesque',        dw:800, lh:0.98, em:0.59, r:'Bricolage Grotesque', rw:600 },
    { key:'clash',    d:'Clash Display',              dw:600, lh:1.0,  em:0.60, r:'Satoshi',           rw:700 },
    { key:'khand',    d:'Khand',                      dw:700, lh:0.92, em:0.44, r:'Manrope',           rw:700, cond:1 },
    { key:'chivo',    d:'Chivo',                      dw:900, lh:0.98, em:0.59, r:'Chivo',             rw:700 },
    { key:'franklin', d:'Libre Franklin',             dw:900, lh:0.98, em:0.59, r:'Libre Franklin',    rw:500 },
    /* the flavour faces (2026-09-27, the owner: the cards are "definitely
       lacking type faces that have personality or flavor"): display faces
       with a voice, each paired with a plain reading face for the steps and
       the number. OFL, vendored in assets/fonts. */
    { key:'teko',     d:'Teko',                       dw:700, lh:0.86, em:0.47, r:'Chivo',             rw:700, cond:1 },
    { key:'oswald',   d:'Oswald',                     dw:700, lh:1.0,  em:0.49, r:'Libre Franklin',    rw:700, cond:1 },
    { key:'sairac',   d:'Saira Condensed',            dw:700, lh:0.95, em:0.42, r:'Chivo',             rw:700, cond:1 },
    { key:'barlowc',  d:'Barlow Condensed',           dw:700, lh:0.95, em:0.435, r:'Libre Franklin',    rw:700, cond:1 },
    { key:'marker',   d:'Permanent Marker',           dw:400, lh:1.06, em:0.615, r:'Manrope',           rw:700 },
    { key:'bangers',  d:'Bangers',                    dw:400, lh:0.98, em:0.45, r:'Chivo',             rw:700, cond:1 },
    { key:'luckiest', d:'Luckiest Guy',               dw:400, lh:1.02, em:0.6, r:'Manrope',           rw:700 },
    { key:'bungee',   d:'Bungee',                     dw:400, lh:1.0,  em:0.745, r:'Manrope',           rw:700 },
    { key:'russo',    d:'Russo One',                  dw:400, lh:1.0,  em:0.605, r:'Instrument Sans',   rw:700 },
    { key:'audiowide',d:'Audiowide',                  dw:400, lh:1.06, em:0.675, r:'Sora',              rw:700 },
    { key:'squada',   d:'Squada One',                 dw:400, lh:0.95, em:0.435, r:'Chivo',             rw:700, cond:1 },
    { key:'rye',      d:'Rye',                        dw:400, lh:1.06, em:0.625, r:'Libre Franklin',    rw:700 },
    { key:'shrikhand',d:'Shrikhand',                  dw:400, lh:1.1,  em:0.63, r:'Manrope',           rw:700 },
    { key:'cormorant',d:'Cormorant Garamond',         dw:700, lh:1.0,  em:0.485, r:'Manrope',           rw:700 },
    { key:'nunito',   d:'Nunito',                     dw:700, lh:1.02, em:0.56, r:'Nunito',            rw:700 },
    { key:'sniglet',  d:'Sniglet',                    dw:400, lh:1.02, em:0.525, r:'Nunito',            rw:700 },
    { key:'knewave',  d:'Knewave',                    dw:400, lh:1.04, em:0.56, r:'Chivo',             rw:700 },
  ];
  const FACE = Object.fromEntries(FACES.map(F => [F.key, F]));
  /* a category's voice: the headline faces its cards rotate through */
  const FLAVOR = {
    sports:    ['teko', 'marker', 'oswald', 'bangers', 'sairac'],
    pokemon:   ['luckiest', 'bangers', 'sniglet', 'knewave'],
    gaming:    ['russo', 'audiowide', 'squada', 'sairac'],
    audio:     ['audiowide', 'shrikhand', 'bungee', 'barlowc'],
    computers: ['russo', 'squada', 'barlowc', 'oswald'],
    wearables: ['audiowide', 'shrikhand', 'sniglet', 'sairac'],
    cameras:   ['shrikhand', 'cormorant', 'oswald', 'barlowc'],
    gold:      ['rye', 'cormorant', 'shrikhand', 'gloock'],
    silver:    ['cormorant', 'rye', 'gloock', 'serif'],
    coins:     ['rye', 'cormorant', 'slab', 'gloock'],
    cars:      ['teko', 'bungee', 'knewave', 'oswald', 'barlowc'],
    strips:    ['nunito', 'sniglet', 'bric', 'franklin'],
    phones:    ['bric', 'bounded', 'shrikhand', 'audiowide', 'clash'],
  };

  /* native pixel sizes of the pictures used (trimmed to the product), so a
     layout can place them at build time and never draw one past its pixels */
  const SIZE = { 'iphone-17-pro-back-black':[1008,1837], 'iphone-15-pro-back-gold':[542,1297], 'ipad-back-camera':[606,1404], 'watch-single-angle':[1069,1355], 'pix-trio-lineup':[1394,1648],
    'gold-jewelry-mixed':[2048,1734], 'gold-coins-pile':[1212,859], 'gold-scrap-mixed':[1752,1748], 'gold-necklace-single':[1314,1591], 'silver-flatware-set':[1989,1919], 'silver-coins-spill':[1714,1223], 'silver-jewelry-mixed':[2048,1681],
    'coin-graded-fan-three':[1950,1865], 'coin-slabs-stack':[1849,1314], 'coin-silver-dollar-pair':[1759,1902], 'coin-loose-pile':[1935,1383], 'car-sedan-rear':[1937,840], 'car-suv-side':[1517,618], 'car-damaged-front':[1661,1017],
        'iphone-15-pro-back-white':[1430,1634], 'iphone-15-pro-back-blue':[678,1580], 'iphone-17-pro-back-silver':[799,1668],
    'ipad-pair-sizes':[982,1786], 'mac-pro-open-front':[1894,1286],     'apple-watch-stack-three':[1981,1489], 'sam-s24-ultra-back':[768,1904], 'sam-s24-ultra-front':[777,1662], 'samsung-galaxy-back':[556,1568],
    'pix-9-back-green':[802,1728], 'pix-9-back-obsidian':[590,1464], 'pix-fold-open':[1929,1117], 'sam-fold-half':[1446,1403], 'sam-flip-open':[1295,1544], 'sam-fold-open-flat':[1468,1064],
    'pix-tablet-back':[822,1609], 'game-console-pair':[1404,1406], 'console-handheld-pair':[1458,784], 'gaming-handheld':[1854,1273], 'controller-pair':[1830,929],
    'laptop-gaming-open':[1694,1131], 'vr-headset':[1823,1082], 'buds-overear-headphones':[1284,1760], 'airpods-case-open':[1262,1234], 'pix-buds-case':[1751,1600],
    'speaker-portable':[646,1560], 'smart-tv-stand':[1298,860], 'tv-flatscreen':[1356,941], 'laptop-windows-open':[1928,1827], 'sam-watch-pair':[1816,1368], 
    'camera-mirrorless':[1966,1524], 'camera-dslr-body':[1930,1716], 'drone-folded':[1603,1121],
    /* 2026-09-27: approved pictures that replace the owner's rejects, the real
       PSA Charizard and the card placeholders (scripts/make_card_assets.py) */
    'ip-group-colour-lineup':[1752,1042], 'ipad-front-screen-off':[1323,1593], 'macbook-open-angle':[1764,1276], 'mac-half-open-glow':[1720,1499],
    'watch-pair-bands':[863,1226], 'buds-pair-loose':[1286,1517], 'silver-candlesticks':[1314,1640], 'strip-boxes':[444,418],
    'poke-psa-charizard':[369,610], 'ph-sports-slabs-fan':[1414,1350], 'ph-sports-cards-fan':[1342,1138], 'ph-sports-slab':[727,1207], 'ph-sports-box':[1312,832], };

  /* ── THE STEPS, in the owner's words. What to send changes per line; the
     meeting and the pay do not. "Nearby" rather than the owner's "In Long
     Beach": every studio user posts from their own town. */
  const STEP_TITLES = ['Message us', 'Meet up', 'Get paid'];
  const MEET = 'Nearby, checked with you', PAID = 'Cash, at the meeting';

  /* ── THE LINES. models = the small line over the headline (what is bought);
     heads = headlines, each naming only what its pictures show or the kind of
     thing they show; ask = what to send; check = the list layout's ticks
     (process, not promises); sets = product pictures, rotated per card;
     ledger = the model names a type-only card sets as its picture. */
  const NOSHIP = 'No shipping, no labels';
  const LINES = [
    // Phones & Devices
    { key:'iphone', cat:'phones', label:'iPhone', models:'iPhone 11 and newer, every size',
      heads:['Your old iPhone, cash in hand.', 'Spare iPhone? Spare cash.', 'Upgraded? Sell the old iPhone.', 'Two iPhones, one pocket?', 'Your old iPhone is cash.'],
      ask:'Model, storage and carrier', check:['Cracked screens too', 'Unlocked or on a carrier', NOSHIP],
      sets:[[['ip-group-colour-lineup', 1]], [['iphone-15-pro-back-white', 1], ['iphone-15-pro-back-blue', 0.97]], [['iphone-17-pro-back-silver', 1], ['iphone-15-pro-back-white', 0.94]], [['iphone-17-pro-back-black', 1], ['iphone-15-pro-back-gold', 0.95]]] },
    { key:'ipad', cat:'phones', label:'iPad', models:'iPad, iPad mini, iPad Air and iPad Pro',
      heads:['Old iPad. New money.', 'iPad in a drawer? Sell it.', 'Upgraded? Sell the old iPad.'],
      ask:'Model, size and storage', check:['Cracked screens too', 'Wi-Fi or cellular', NOSHIP],
      sets:[[['ipad-front-screen-off', 1]], [['ipad-pair-sizes', 1]], [['ipad-back-camera', 1], ['ipad-front-screen-off', 0.92]]] },
    { key:'mac', cat:'phones', label:'MacBook', models:'MacBook Air and MacBook Pro, M1 and newer',
      heads:['Old MacBook. New money.', 'MacBook in the closet? Sell it.', 'Your old MacBook is cash.'],
      ask:'The year, chip and memory', check:['Bring the charger if you have it', 'Signed out of iCloud', NOSHIP],
      sets:[[['mac-pro-open-front', 1]], [['macbook-open-angle', 1]], [['mac-half-open-glow', 1]]] },
    { key:'watch', cat:'phones', label:'Apple Watch', models:'Apple Watch Series, SE and Ultra',
      heads:['Your old Apple Watch is cash.', 'New watch? Sell the old one.', 'Apple Watch in a drawer? Sell it.'],
      ask:'Series, size, GPS or cellular', check:['Bring the charger if you have it', 'Unpaired and reset', NOSHIP],
      sets:[[['watch-pair-bands', 1]], [['watch-single-angle', 1]], [['apple-watch-stack-three', 1]]] },
    { key:'galaxy', cat:'phones', label:'Samsung Galaxy', models:'Galaxy S21 and newer, Ultra too',
      heads:['Your old Galaxy is cash.', 'Upgraded? Sell the old Galaxy.', 'Galaxy in a drawer? Sell it.'],
      ask:'Model, storage and carrier', check:['Unlocked or on a carrier', 'Signed out of Google', NOSHIP],
      sets:[[['sam-s24-ultra-back', 1], ['sam-s24-ultra-front', 0.88]], [['samsung-galaxy-back', 1], ['sam-s24-ultra-back', 1]], [['sam-s24-ultra-back', 1]]] },
    { key:'pixel', cat:'phones', label:'Google Pixel', models:'Pixel 7 and newer, Pro too',
      heads:['Your old Pixel is cash.', 'Pixel in a drawer? Sell it.', 'Upgraded? Sell the old Pixel.'],
      ask:'Model, storage and carrier', check:['Unlocked or on a carrier', 'Signed out of Google', NOSHIP],
      sets:[[['pix-9-back-green', 1], ['pix-9-back-obsidian', 0.92]], [['pix-trio-lineup', 1]], [['pix-9-back-green', 1]]] },
    { key:'foldable', cat:'phones', label:'Foldables', models:'Galaxy Z Fold, Z Flip and Pixel Fold',
      heads:['Fold or Flip? We buy both.', 'Your old foldable is cash.', 'Folding phone? Sell it.'],
      ask:'Model, storage and the hinge', check:['Screen protector on or off', 'Signed out of Google', NOSHIP],
      sets:[[['sam-fold-half', 1], ['sam-flip-open', 0.9]], [['sam-fold-open-flat', 1]], [['pix-fold-open', 1]]] },
    { key:'tablet', cat:'phones', label:'Android tablets', models:'Galaxy Tab and Pixel Tablet',
      heads:['Android tablet? We buy it.', 'Tablet in a drawer? Sell it.'],
      ask:'Model, size and storage', check:['Bring the charger if you have it', 'Signed out of Google', NOSHIP],
      sets:[[['pix-tablet-back', 1]]] },
    // Gaming
    { key:'console', cat:'gaming', label:'Consoles', models:'PS5, PS5 Pro, Xbox Series X and S',
      heads:['PS5 or Xbox? We buy both.', 'Console in the closet? Sell it.', 'Your old console is cash.'],
      ask:'Model, storage, disc or digital', check:['Bring the controller and cables', 'Signed out of your account', NOSHIP],
      sets:[[['game-console-pair', 1]]] },
    { key:'switch', cat:'gaming', label:'Nintendo Switch', models:'Switch, Switch OLED and Switch 2',
      heads:['Switch in a drawer? Sell it.', 'Your old Switch is cash.'],
      ask:'Model, and the Joy-Con with it', check:['Bring the dock and charger', 'Signed out of your account', NOSHIP],
      sets:[[['console-handheld-pair', 1]], [['gaming-handheld', 1]]] },
    { key:'controller', cat:'gaming', label:'Controllers', models:'DualSense, DualSense Edge and Xbox controllers',
      heads:['Spare controllers? Get cash.', 'Extra DualSense? Sell it.'],
      ask:'Which ones, and how many', check:['Drift or worn sticks, say so', 'Bring the cables if you have them', NOSHIP],
      sets:[[['controller-pair', 1]]] },
    { key:'gamelaptop', cat:'gaming', label:'Gaming laptops', models:'Gaming laptops, RTX 30 series and newer',
      heads:['Gaming laptop? We buy it.', 'Upgraded your rig? Sell the laptop.'],
      ask:'Model, GPU and memory', check:['Bring the charger', 'Signed out and wiped', NOSHIP],
      sets:[[['laptop-gaming-open', 1]]] },
    { key:'vr', cat:'gaming', label:'VR headsets', models:'Meta Quest 3, Quest 3S and Quest 2',
      heads:['Quest in a drawer? Sell it.', 'Your old VR headset is cash.'],
      ask:'Model, storage, controllers', check:['Bring both controllers', 'Signed out of your account', NOSHIP],
      sets:[[['vr-headset', 1]]] },
    { key:'pchandheld', cat:'gaming', label:'PC handhelds', models:'Steam Deck, ROG Ally, Legion Go and MSI Claw',
      heads:['Steam Deck or ROG Ally? We buy both.', 'PC handheld? Get cash for it.'],
      ask:'Model and storage', check:['Bring the charger', 'Signed out and wiped', NOSHIP],
      ledger:['Steam Deck', 'ROG Ally', 'Legion Go', 'MSI Claw'] },
    { key:'gamingpc', cat:'gaming', label:'Gaming PCs', models:'Towers with an RTX 30 series card or newer',
      heads:['Gaming PC? We buy the whole rig.', 'Selling your gaming PC?'],
      ask:'The CPU, GPU and memory', check:['Photos of the parts list help', 'Signed out and wiped', NOSHIP],
      ledger:['RTX 50 series', 'RTX 40 series', 'RTX 30 series', 'Ryzen and Core i7'] },
    // Headphones & Audio
    { key:'headphones', cat:'audio', label:'Headphones', models:'Bose, Sony, Sennheiser, Beats and AirPods Max',
      heads:['Headphones you never wear? Sell them.', 'Bose, Sony or Beats? We buy them.'],
      ask:'Brand and model', check:['Bring the case if you have it', 'Worn pads, say so', NOSHIP],
      sets:[[['buds-overear-headphones', 1]]] },
    { key:'earbuds', cat:'audio', label:'Earbuds', models:'AirPods Pro, Galaxy Buds and Pixel Buds',
      heads:['Spare earbuds? Get cash.', 'Earbuds in a drawer? Sell them.'],
      ask:'Brand, model and the case', check:['Both buds and the case', 'Unpaired and reset', NOSHIP],
      sets:[[['airpods-case-open', 1]], [['buds-pair-loose', 1]], [['pix-buds-case', 1]]] },
    { key:'headset', cat:'audio', label:'Gaming headsets', models:'Astro A50 X, Turtle Beach Stealth, SteelSeries Arctis',
      heads:['Gaming headset? Get cash for it.', 'A50 X or Stealth? We buy both.'],
      ask:'Brand, model and the base', check:['Bring the base station', 'Worn pads, say so', NOSHIP],
      ledger:['Astro A50 X', 'Turtle Beach Stealth', 'SteelSeries Arctis Nova', 'Razer BlackShark'] },
    { key:'speaker', cat:'audio', label:'Speakers', models:'Portable Bluetooth speakers',
      heads:['Speaker in a closet? Sell it.', 'Your old speaker is cash.'],
      ask:'Brand and model', check:['Bring the charger', 'Unpaired and reset', NOSHIP],
      sets:[[['speaker-portable', 1]]] },
    // Computers & Parts
    { key:'monitor', cat:'computers', label:'Monitors', models:'Gaming and office monitors, 24 inch and up',
      heads:['Extra monitor? We buy it.', 'Upgraded your screen? Sell the old one.'],
      ask:'Brand, size and refresh rate', check:['Bring the stand and cables', 'Dead pixels, say so', NOSHIP],
      sets:[[['smart-tv-stand', 1]], [['tv-flatscreen', 1]]] },
    { key:'laptop', cat:'computers', label:'Windows laptops', models:'Windows laptops, recent models',
      heads:['Windows laptop? We buy it.', 'Old laptop? New money.'],
      ask:'Model, chip and memory', check:['Bring the charger', 'Signed out and wiped', NOSHIP],
      sets:[[['laptop-windows-open', 1]]] },
    { key:'ssd', cat:'computers', label:'SSDs', models:'NVMe and SATA, 1TB and up, sealed or used',
      heads:['Spare SSDs? We buy them.', 'Sealed SSDs? Get cash.'],
      ask:'Brand, model and capacity', check:['Say sealed or used', 'Health report helps', NOSHIP],
      ledger:['Samsung 990 Pro', 'WD Black SN850X', 'Crucial T700', 'Sealed or used'] },
    { key:'minipc', cat:'computers', label:'Mini PCs', models:'Mac mini, Intel NUC, Beelink and Minisforum',
      heads:['Mini PC on a shelf? Sell it.', 'Mac mini or NUC? We buy both.'],
      ask:'Model, chip and memory', check:['Bring the power supply', 'Signed out and wiped', NOSHIP],
      ledger:['Mac mini', 'Intel NUC', 'Beelink', 'Minisforum'] },
    { key:'chromebook', cat:'computers', label:'Chromebooks, sealed', models:'Sealed Chromebooks, new in the box',
      heads:['Sealed Chromebooks? We buy them.', 'New in the box? Get cash.'],
      ask:'Model, and a photo of the seal', check:['Still in the sealed box', 'One or a stack', NOSHIP],
      ledger:['Acer', 'HP', 'Lenovo', 'ASUS'] },
    // Wearables
    { key:'metaglasses', cat:'wearables', label:'Meta glasses', models:'Ray-Ban Meta and Oakley Meta glasses',
      heads:['Ray-Ban Meta glasses? We buy them.', 'Smart glasses? Get cash.'],
      ask:'Model and the charging case', check:['Bring the charging case', 'Unpaired and reset', NOSHIP],
      ledger:['Ray-Ban Meta', 'Oakley Meta HSTN', 'Wayfarer', 'Skyler'] },
    { key:'smartwatch', cat:'wearables', label:'Smartwatches', models:'Galaxy Watch, Pixel Watch and more',
      heads:['Smartwatch in a drawer? Sell it.', 'Your old smartwatch is cash.'],
      ask:'Brand, model and size', check:['Bring the charger', 'Unpaired and reset', NOSHIP],
      sets:[[['sam-watch-pair', 1]]] },
    // the library's first seven categories, in the offer style
    { key:'gold', cat:'gold', label:'Gold', models:'Rings, chains, coins and broken gold',
      heads:['Old gold in a drawer? Sell it.', 'Your old gold is cash.', 'Gold you never wear? Sell it.', 'Broken or worn, gold is gold.'],
      ask:'Photos, and the karat if you know it', meet:'Nearby, weighed with you', check:['Broken pieces too', 'Any karat', NOSHIP],
      sets:[[['gold-jewelry-mixed', 1]], [['gold-coins-pile', 1]], [['gold-scrap-mixed', 1]], [['gold-necklace-single', 1]]] },
    { key:'silver', cat:'silver', label:'Silver', models:'Coins, bars, silverware and jewelry',
      heads:['Old silverware? Sell it.', 'Silver in a drawer? Sell it.', 'Your old silver is cash.'],
      ask:'Photos, and any marks on it', meet:'Nearby, weighed with you', check:['Tarnish does not matter', 'Sterling, coins and bars', NOSHIP],
      sets:[[['silver-flatware-set', 1]], [['silver-candlesticks', 1]], [['silver-coins-spill', 1]], [['silver-jewelry-mixed', 1]]] },
    { key:'coins', cat:'coins', label:'Coins', models:'Old coins, silver dollars and collections',
      heads:['Old coins in a jar? Sell them.', 'Your coin collection is cash.', 'Old coins? We buy them.', 'Coin collection in a closet? Sell it.'],
      ask:'Photos of both sides', meet:'Nearby, looked over with you', check:['Singles or whole collections', 'Graded or raw', NOSHIP],
      sets:[[['coin-graded-fan-three', 1]], [['coin-slabs-stack', 1]], [['coin-silver-dollar-pair', 1]], [['coin-loose-pile', 1]]] },
    { key:'car', cat:'cars', label:'Cars and trucks', models:'Cars, trucks and SUVs, running or not',
      heads:['Car sitting in the driveway? Sell it.', 'Your old car is cash.', 'Running or not, we buy it.'],
      ask:'Year, make, model and miles', meet:'Where the car is, checked with you', paid:'Cash, at the car', check:['Title in hand helps', 'Running or not', 'Keys if you have them'],
      sets:[[['car-sedan-rear', 1]], [['car-suv-side', 1]], [['car-damaged-front', 1]]] },
    { key:'strips', cat:'strips', label:'Test strips', models:'Sealed, unexpired test strip boxes',
      heads:['Extra test strips? Sell them.', 'Sealed boxes? Get cash.', 'Unused test strips are cash.'],
      ask:'Brand, count and expiry date', check:['Sealed and unexpired only', 'All the major brands', NOSHIP],
      sets:[[['strip-boxes', 1]]] },
    { key:'pokemon', cat:'pokemon', label:'Pok\u00e9mon cards', models:'Singles, slabs, binders and sealed boxes',
      heads:['Pok\u00e9mon cards? We buy them.', 'Your old Pok\u00e9mon cards are cash.', 'Pok\u00e9mon collection? Get cash.'],
      ask:'Photos of the cards or the slabs', check:['Singles or whole collections', 'Graded or raw', NOSHIP],
      sets:[[['poke-psa-charizard', 1]]] },
    { key:'sports', cat:'sports', label:'Sports cards', models:'Rookies, autos, slabs and sealed wax',
      heads:['Sports cards? We buy them.', 'Your old sports cards are cash.', 'Card collection in a closet? Sell it.'],
      ask:'Photos of the cards or the slabs', check:['Singles or whole collections', 'Graded or raw', NOSHIP],
      sets:[[['ph-sports-slabs-fan', 1]], [['ph-sports-cards-fan', 1]], [['ph-sports-slab', 1]], [['ph-sports-box', 1]]] },
    // Cameras & Drones
    { key:'camera', cat:'cameras', label:'Cameras', models:'Mirrorless and DSLR bodies and lenses',
      heads:['Camera in a bag? Sell it.', 'Upgraded your camera? Sell the old one.'],
      ask:'Body, lenses and shutter count', check:['Bring the battery and charger', 'Lenses too', NOSHIP],
      sets:[[['camera-mirrorless', 1], ['camera-dslr-body', 0.95]], [['camera-mirrorless', 1]]] },
    { key:'drone', cat:'cameras', label:'Drones', models:'DJI Mini, Air and Mavic',
      heads:['Drone grounded? Get cash.', 'Your old drone is cash.'],
      ask:'Model, batteries and controller', check:['Bring the controller', 'Every battery you have', NOSHIP],
      sets:[[['drone-folded', 1]]] },
  ];

  /* ── THE PHOTOGRAPHS. The owner, 2026-09-27: "the gray sections should have a
     background image". Every card now stands on a photograph of its own goods
     (scripts/make_offer_grounds.py: the Commons photographs in assets/bg-web,
     the studio's own card scenes for the card categories, NASA pictures for
     the lines the library has no photograph of yet), in its own colour.
     p90 = the 90th percentile luminance of the upper two thirds, where the
     headline stands: the neutral shade is solved from it (DESIGN-LAW 56) so
     white type over it clears 4.5:1, and no picture is darker than it needs. */
  const GROUNDS = {
    sports: [{ file:'dl_sports_arcCrown_crimson', p90:198 }, { file:'dl_sports_agencyGrid_mono', p90:170 }, { file:'dl_sports_glassCard_mono', p90:224 }],
    pokemon: [{ file:'pokemon-charizard-card-1', p90:198 }, { file:'pokemon-charizard-card-2', p90:218 }],   // real photographs (DESIGN-LAW 117)
    strips: [{ file:'strips-contour-next-test-strips-2', p90:171 }, { file:'strips-blood-glucose-test-strips-2', p90:241 }, { file:'strips-blood-glucose-meter-1', p90:203 }],
    coins: [{ file:'coins-coin-collection-album-1', p90:184 }, { file:'coins-morgan-silver-dollar-1', p90:220 }, { file:'coins-american-gold-eagle-coin-1', p90:239 }],
    gold: [{ file:'gold-gold-jewelry-rings-3', p90:254 }, { file:'gold-gold-bracelet-2', p90:178 }, { file:'gold-gold-necklace-chain-close-3', p90:137 }],
    silver: [{ file:'silver-silverware-set-1', p90:206 }, { file:'silver-silver-cutlery-1', p90:183 }, { file:'silver-silver-jewelry-rings-2', p90:248 }],
    cars: [{ file:'cars-used-car-dealership-lot-1', p90:189 }, { file:'trucks-pickup-truck-1', p90:198 }, { file:'cars-classic-car-chrome-grille-1', p90:251 }],
    iphone: [{ file:'phones-iphone-15-pro-back-camera-1', p90:166 }, { file:'phones-iphone-14-pro-1', p90:118 }, { file:'phones-apple-iphone-15-1', p90:181 }],
    mac: [{ file:'macbook-macbook-on-desk-1', p90:208 }, { file:'macbook-macbook-pro-m3-1', p90:198 }, { file:'macbook-macbook-air-2', p90:34 }],
    space: [{ file:'space-earth-from-iss-night-1', p90:130 }, { file:'space-earth-from-iss-night-3', p90:22 }, { file:'space-moon-surface-nasa-4', p90:99 }, { file:'space-earth-from-iss-night-4', p90:99 }, { file:'space-aurora-from-space-3', p90:172 }, { file:'space-galaxy-hubble-telescope-1', p90:170 }],
  };
  /* the gaming lines stand in gamers' rooms (the owner: "gamer bedrooms, gamer
     living rooms, aesthetic gaming set ups"), drawn by
     scripts/make_gaming_grounds.py until the photographs come; gaming
     headsets and monitors live in the same rooms */
  GROUNDS.gaming = [{ file:'gaming-rgb-desk-setup', p90:160 }, { file:'gaming-living-room-tv', p90:179 }, { file:'gaming-bedroom-night', p90:96 }];
  const GROUND_OF = { iphone:'iphone', ipad:'iphone', mac:'mac', gold:'gold', silver:'silver', coins:'coins', car:'cars',
    strips:'strips', pokemon:'pokemon', sports:'sports', gaming:'gaming', headset:'gaming', monitor:'gaming' };
  /* white on black-shaded pixels of luminance v: v * (1 - a) <= 118 is 4.5:1;
     110 and 0.05 are the margin */
  const shadeFor = p90 => +Math.max(0.2, Math.min(0.82, 1 - 110 / Math.max(1, p90) + 0.05)).toFixed(2);

  /* ── fitting a headline at build time (no font is loaded yet): a width
     estimate per character class, scaled by the face's own em, with a margin */
  const cw = ch => /[iljtfr.,:;'!|]/.test(ch) ? 0.34 : /[mwMW@]/.test(ch) ? 0.9 : /[A-Z]/.test(ch) ? 0.7 : /[0-9]/.test(ch) ? 0.6 : ch === ' ' ? 0.28 : ch === '?' ? 0.5 : 0.54;
  const lineW = (s, F, px) => [...s].reduce((a, ch) => a + cw(ch), 0) * px * (F.em / 0.54) * 1.06;
  /* the break that sets the fewest lines, then the most even ones, and never
     one word alone on the last line when the headline has four or more */
  const wrap = (text, F, px, maxW, maxLines) => {
    const words = text.split(' '), n = words.length;
    let best = null;
    const tryCuts = cuts => {
      const lines = []; let a = 0;
      cuts.concat(n).forEach(b => { lines.push(words.slice(a, b).join(' ')); a = b; });
      const ws = lines.map(l => lineW(l, F, px));
      if (ws.some(w => w > maxW)) return;
      const widow = lines.length > 1 && n >= 4 && lines[lines.length - 1].split(' ').length === 1;
      const score = lines.length * 1e6 + (widow ? 5e5 : 0) + (Math.max(...ws) - Math.min(...ws));
      if (!best || score < best.score) best = { lines, score };
    };
    for (let k = 0; k < Math.min(maxLines, n); k++){
      const pick = (start, left, cuts) => {
        if (!left) return tryCuts(cuts);
        for (let c = start; c <= n - left; c++) pick(c + 1, left - 1, cuts.concat(c));
      };
      pick(1, k, []);
      if (best) break;
    }
    return best ? best.lines : null;
  };
  /* the biggest size (from `top` down to HEAD_MIN) at which the headline sets
     in `maxLines` lines or fewer, every line inside maxW; null if none does */
  const fitHead = (text, F, maxW, maxLines, top) => {
    for (let px = top; px >= HEAD_MIN; px -= 2){
      const lines = wrap(text, F, px, maxW, maxLines);
      if (lines) return { px, lines, h: Math.round(lines.length * px * F.lh) };
    }
    return null;
  };

  /* ── products, standing on one floor: each picture as tall as the box times
     its weight, overlapping its neighbour a little, the whole group centred
     and scaled down together if it runs wide. Never past a picture's pixels.
     The middle one is drawn last, in front. */
  const arrange = (set, box, L) => {
    const items = set.map(([name, k]) => { const [nw, nh] = SIZE[name]; return { name, nw, nh, h: box.h * k }; });
    items.forEach(it => { it.h = Math.min(it.h, it.nh); it.w = it.h * it.nw / it.nh; });
    const lap = 0.1;
    const total = () => items.reduce((a, it) => a + it.w, 0) - lap * items.slice(1).reduce((a, it, i) => a + Math.min(it.w, items[i].w), 0);
    const s = Math.min(1, box.w / total());
    items.forEach(it => { it.w *= s; it.h *= s; });
    let x = box.x + (box.w - total()) / 2;
    const floor = box.y + box.h;
    items.forEach((it, i) => { it.cx = x + it.w / 2; x += it.w - (i < items.length - 1 ? lap * Math.min(it.w, items[i + 1].w) : 0); });
    const mid = (items.length - 1) / 2;
    const shadow = L.dark ? sh('rgba(0,0,0,0.55)', 42, 0, 20) : sh('rgba(40,30,20,0.28)', 38, 0, 18);
    return items.map((it, i) => ({ it, i })).sort((a, b) => Math.abs(b.i - mid) - Math.abs(a.i - mid)).map(({ it, i }) => ({
      kind:'cutout', name: items.length > 1 ? 'Product ' + (i + 1) : 'Product', role:'photo',
      props:{ src:'assets/cutouts/' + it.name + CUTOUT_EXT, left: Math.round(it.cx), top: Math.round(floor - it.h / 2),
              originX:'center', originY:'center', w: Math.round(it.w), maxH: Math.round(it.h), shadow },
    }));
  };

  /* ── pieces ── */
  const models = (L, F, text, x, y, align) => t('Models', 'sub', 'none', text,
    { left:x, top:y, originX: align || 'left', fontFamily:F.r, fontSize:26, fontWeight:F.rw, fill:L.acc, charSpacing:10 });
  const headline = (L, F, fit, x, y, w, align, ink) => tb('Headline', 'headline', 'none', fit.lines.join('\n'),
    { left:x, top:y, width:w, originX: align === 'center' ? 'center' : 'left', textAlign: align || 'left',
      fontFamily:F.d, fontSize:fit.px, fontWeight:F.dw, fill: ink || L.ink, lineHeight:F.lh, charSpacing: F.cond ? 0 : -10 });
  const marker = (L, F, style, i, x, y, ink, fill) => style === 'num'
    ? [t('Step ' + (i + 1) + ' Mark', 'deco', 'none', '0' + (i + 1), { left:x, top:y, fontFamily:F.r, fontSize:26, fontWeight:F.rw, fill: fill || L.acc })]
    : [ci('Step ' + (i + 1) + ' Dot', { left:x, top:y, radius:16, fill: fill || L.acc }),
       t('Step ' + (i + 1) + ' Mark', 'deco', 'none', String(i + 1), { left:x + 16, top:y + 3, originX:'center', fontFamily:F.r, fontSize:21, fontWeight:700, fill: ink || L.g1 })];
  const stepsRow = (L, F, line, y, style, align) => {
    const detail = [line.ask, line.meet || MEET, line.paid || PAID], colW = (W - 2 * M) / 3, out = [];
    STEP_TITLES.forEach((title, i) => {
      const x = M + i * colW, cx = x + colW / 2 - 10, center = align === 'center';
      out.push(...marker(L, F, style, i, center ? cx - (style === 'num' ? 14 : 16) : x, y));
      out.push(t('Step ' + (i + 1), 'info', 'none', title, { left: center ? cx : x, top:y + 42, originX: center ? 'center' : 'left',
        fontFamily:F.r, fontSize:34, fontWeight:F.rw, fill:L.ink }));
      out.push(tb('Step ' + (i + 1) + ' Detail', 'info', 'none', detail[i], { left: center ? cx : x, top:y + 86, width: colW - 26,
        originX: center ? 'center' : 'left', textAlign: center ? 'center' : 'left', fontFamily:F.r, fontSize:26, fontWeight:500, fill:L.sub, lineHeight:1.18 }));
    });
    return out;
  };
  const stepsList = (L, F, line, x, y, w, style, ink, sub, acc, onMark) => {
    const detail = [line.ask, line.meet || MEET, line.paid || PAID], out = [];
    STEP_TITLES.forEach((title, i) => {
      const yy = y + i * 104;
      out.push(...marker(L, F, style, i, x, yy + 2, onMark, acc));
      out.push(t('Step ' + (i + 1), 'info', 'none', title, { left:x + 54, top:yy - 4, fontFamily:F.r, fontSize:34, fontWeight:F.rw, fill: ink || L.ink }));
      out.push(tb('Step ' + (i + 1) + ' Detail', 'info', 'none', detail[i], { left:x + 54, top:yy + 40, width: w - 54,
        fontFamily:F.r, fontSize:26, fontWeight:500, fill: sub || L.sub, lineHeight:1.18 }));
    });
    return out;
  };
  const checks = (L, F, items, x, y) => items.slice(0, 3).flatMap((text, i) => [
    ci('Check ' + (i + 1) + ' Dot', { left:x, top:y + i * 46, radius:13, fill:L.ink }),
    t('Check ' + (i + 1) + ' Tick', 'deco', 'none', '✓', { left:x + 13, top:y + i * 46 + 2, originX:'center', fontFamily:F.r, fontSize:18, fontWeight:700, fill:L.g1 }),
    t('Check ' + (i + 1), 'info', 'none', text, { left:x + 40, top:y + i * 46 - 1, fontFamily:F.r, fontSize:26, fontWeight:500, fill:L.ink }),
  ]);
  /* the action band: the label and the site on one line, the number under it
     at full size. The band spans the card, so the studio's own layout pass
     (alignPass) leaves what is on it where it was set. */
  /* on its own band the number wears the band's inks; on the photo band's dark
     panel (onPanel) it wears the look's accent and the label its detail ink */
  const band = (L, F, top, align, onPanel) => {
    const fill = onPanel ? L.g2 : L.band, ink = onPanel ? L.acc : L.bandInk, sub = onPanel ? L.sub : L.bandSub;
    const w = F.rw === 500 ? 700 : F.rw;
    return [
      r('Action Band', { left:0, top, width:W, height:1080 - top, fill }),
      t('Call Label', 'cta', 'none', 'Call or text', { left:M, top:top + 24, fontFamily:F.r, fontSize:26, fontWeight:F.rw, fill:sub }),
      t('Website', 'website', 'none', SITE, { left:W - M, top:top + 24, originX:'right', fontFamily:F.r, fontSize:26, fontWeight:F.rw, fill:sub }),
      t('Phone Number', 'phone', 'none', NUMBER, align === 'center'
        ? { left:CX, top:top + 60, originX:'center', fontFamily:F.r, fontSize:NUM_PX, fontWeight:w, fill:ink }
        : { left:M, top:top + 60, fontFamily:F.r, fontSize:NUM_PX, fontWeight:w, fill:ink }),
    ];
  };
  const vignette = () => ({ kind:'vignette', name:'Vignette', props:{ strength: 0.22 } });
  /* the shade: solid neutral black from the top to under the last line of
     type on the photograph, then fading toward the product, which stands on
     the photograph as it was shot */
  const shade = (G, textBottom, floor) => {
    const a = G.alpha, tb = Math.round(textBottom), out = [r('Shade', { left:0, top:0, width:W, height:tb, fill:'rgba(0,0,0,' + a + ')' })];
    if (floor > tb + 4) out.push({ kind:'rect', name:'Shade Fade', solid:true, props:{ left:0, top:tb, width:W, height:Math.round(floor - tb),
      fill:'rgba(0,0,0,' + a + ')', grad:{ c1:'rgba(0,0,0,' + a + ')', c2:'rgba(0,0,0,' + (a * 0.3).toFixed(2) + ')', a:180 } } });
    return out;
  };
  /* type on the photograph is white (the shade is solved for it); the look's
     colour lives on the panels, the markers and the band */
  const PH = { ink:'#ffffff', sub:'rgba(255,255,255,0.86)', acc:'#ffffff' };
  const PHL = { ink:'#ffffff', sub:'rgba(255,255,255,0.5)' };
  const PANEL = 692;                           // the steps' panel under the stage
  const panelFill = L => L.dark ? L.g2 : L.g1;
  const stepsPanel = (L, top) => r('Steps Panel', { left:0, top, width:W, height:BT - top, fill:panelFill(L) });
  const ON_PHOTO = { dark:1 };                 // products on a photograph take the deep shadow
  /* a type-only card's picture: the model names, set large with rules between */
  const ledger = (L, F, names, x, y, w, align) => {
    const out = [], rows = Math.ceil(names.length / 2), colW = w / 2;
    /* one size for every name: the size the longest fits its column at */
    const RF = { em: 0.6 }, widest = Math.max(...names.map(n => lineW(n, RF, 1)));
    const px = Math.max(28, Math.min(40, Math.floor((colW - 30) / widest)));
    names.forEach((n, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const lx = align === 'center' ? x + col * colW + colW / 2 : x + col * colW;
      out.push(t('Model ' + (i + 1), 'info', 'none', n, { left:lx, top:y + row * 74 + 37 - px * 0.58, originX: align === 'center' ? 'center' : 'left',
        fontFamily:F.r, fontSize:px, fontWeight:F.rw === 500 ? 700 : F.rw, fill:L.ink }));
    });
    for (let k = 0; k <= rows; k++) out.push(r('Ledger Rule ' + (k + 1), { left:x, top:y + k * 74, width:w, height:2, fill:L.sub }));
    return out;
  };

  /* ── THE SIX LAYOUTS. Each returns null when this headline cannot be set at
     1.3x the number in the room the layout has, so the builder tries the next
     headline or face instead of shipping a cramped card. */
  const LAYOUTS = {
    /* the owner's "Studio row": models line and headline on the photograph,
       the product standing on it, three steps on the panel, the band */
    row(L, F, line, head, set, style, G){
      const fit = fitHead(head, F, W - 2 * M, 2, 112); if (!fit) return null;
      const top = 110, prodTop = top + fit.h + 26, floor = PANEL;
      if (floor - prodTop < 250) return null;
      return [...shade(G, top + fit.h + 18, floor), vignette(), models(PH, F, line.models, M, 64), headline(L, F, fit, M, top, W - 2 * M, 'left', PH.ink),
        ...arrange(set, { x:M, y:prodTop, w:W - 2 * M, h:floor - prodTop }, ON_PHOTO),
        stepsPanel(L, PANEL), ...stepsRow(L, F, line, PANEL + 20, style), ...band(L, F, BT)];
    },
    /* "Studio list": the headline across the photograph, the steps and the
       ticks on a panel down the left, the product on the right */
    list(L, F, line, head, set, style, G){
      const fit = fitHead(head, F, W - 2 * M, 2, 108); if (!fit) return null;
      const top = 110, y0 = top + fit.h + 40, pTop = y0 - 30;
      if (y0 + 3 * 104 + 3 * 46 + 16 > BT - 20) return null;
      return [...shade(G, top + fit.h + 18, BT), vignette(), models(PH, F, line.models, M, 64), headline(L, F, fit, M, top, W - 2 * M, 'left', PH.ink),
        r('Steps Panel', { left:M - 36, top:pTop, width:460 + 72, height:BT - pTop, fill:panelFill(L) }),
        ...arrange(set, { x:600, y:y0 - 10, w:W - M - 600, h:BT - 36 - y0 }, ON_PHOTO),
        ...stepsList(L, F, line, M, y0, 460, style, L.ink, L.sub, L.acc, L.g1),
        ...checks(L, F, line.check, M, y0 + 3 * 104 + 8), ...band(L, F, BT)];
    },
    /* "Photo band": the headline on the photograph with the product beside
       it; the steps and the number on a panel below */
    band(L, F, line, head, set, style, G){
      const colW = set ? 560 : W - 2 * M;
      const fit = fitHead(head, F, colW, 3, 112); if (!fit) return null;
      if (70 + fit.h > 540) return null;
      return [
        ...shade(G, 70 + fit.h + 18, 568),
        r('Lower Panel', { left:0, top:568, width:W, height:1080 - 568, fill:L.g2 }),
        headline(L, F, fit, M, 70, colW, 'left', PH.ink),
        /* 40px of photograph between the headline's column and the product */
        ...(set ? arrange(set, { x:colW + M + 40, y:110, w:W - M - (colW + M + 40), h:420 }, ON_PHOTO) : []),
        models(L, F, line.models, M, 602),
        ...stepsRow(L, F, line, 652, style), ...band(L, F, BT, 'left', true),
      ];
    },
    /* "Split": the headline and the steps on a solid column, the product on
       the photograph beside it (no type on the photograph, so no shade) */
    split(L, F, line, head, set, style, G){
      const colX = 600, colW = colX - M - 40;
      const fit = fitHead(head, F, colW, 3, 108); if (!fit) return null;
      /* a models line wider than the column wraps inside it, and the rest of
         the column steps down one line */
      const twoLine = lineW(line.models, { em:0.6 }, 26) > colW, drop = twoLine ? 32 : 0;
      const top = 110 + drop, y0 = top + fit.h + 44;
      if (y0 + 3 * 104 > BT - 30) return null;
      const P = { ink:L.bandInk, sub:L.bandSub, acc:L.bandInk };
      return [vignette(),
        r('Column', { left:0, top:0, width:colX, height:BT, fill:L.band }),
        tb('Models', 'sub', 'none', line.models, { left:M, top:64, width:colW, fontFamily:F.r, fontSize:26, fontWeight:F.rw, fill:L.bandSub, lineHeight:1.12 }),
        headline(L, F, fit, M, top, colW, 'left', L.bandInk),
        ...stepsList(L, F, line, M, y0, colW, style, P.ink, P.sub, P.acc, L.band),
        ...arrange(set, { x:colX + 40, y:150, w:W - colX - 40 - 50, h:BT - 150 - 60 }, ON_PHOTO),
        ...band(L, F, BT)];
    },
    /* "Centre": everything on one axis */
    center(L, F, line, head, set, style, G){
      const fit = fitHead(head, F, W - 2 * M - 40, 2, 112); if (!fit) return null;
      const top = 110, prodTop = top + fit.h + 26, floor = PANEL;
      if (floor - prodTop < 250) return null;
      return [...shade(G, top + fit.h + 18, floor), vignette(), models(PH, F, line.models, CX, 64, 'center'),
        headline(L, F, fit, CX, top, W - 2 * M - 40, 'center', PH.ink),
        ...arrange(set, { x:M + 60, y:prodTop, w:W - 2 * M - 120, h:floor - prodTop }, ON_PHOTO),
        stepsPanel(L, PANEL), ...stepsRow(L, F, line, PANEL + 20, style, 'center'), ...band(L, F, BT, 'center')];
    },
    /* "Type": no picture the library can vouch for, so the model names are the
       picture, set large between rules on the photograph */
    type(L, F, line, head, set, style, G){
      const fit = fitHead(head, F, W - 2 * M, 3, 116); if (!fit) return null;
      const top = 110, y0 = top + fit.h + 40, rows = Math.ceil(line.ledger.length / 2);
      if (y0 + rows * 74 > PANEL - 10) return null;
      return [...shade(G, y0 + rows * 74 + 16, PANEL), vignette(), models(PH, F, line.models, M, 64), headline(L, F, fit, M, top, W - 2 * M, 'left', PH.ink),
        ...ledger(PHL, F, line.ledger, M, y0, W - 2 * M), stepsPanel(L, PANEL), ...stepsRow(L, F, line, PANEL + 20, style), ...band(L, F, BT)];
    },
    typeCenter(L, F, line, head, set, style, G){
      const fit = fitHead(head, F, W - 2 * M - 40, 3, 116); if (!fit) return null;
      const top = 110, y0 = top + fit.h + 40, rows = Math.ceil(line.ledger.length / 2);
      if (y0 + rows * 74 > PANEL - 10) return null;
      return [...shade(G, y0 + rows * 74 + 16, PANEL), vignette(), models(PH, F, line.models, CX, 64, 'center'),
        headline(L, F, fit, CX, top, W - 2 * M - 40, 'center', PH.ink),
        ...ledger(PHL, F, line.ledger, M, y0, W - 2 * M, 'center'), stepsPanel(L, PANEL), ...stepsRow(L, F, line, PANEL + 20, style, 'center'),
        ...band(L, F, BT, 'center')];
    },
  };
  const LAYOUT_NAME = { row:'Studio row', list:'Studio list', band:'Photo band', split:'Split', center:'Centre', type:'Type', typeCenter:'Type, centred' };

  /* ── THE BOOK: every line in every layout it can carry. The look, the face,
     the headline and the picture set rotate with a stride per line, so two
     neighbours never share a look and a category reads as a range. */
  /* owner-sourced pictures and grounds (scripts/ingest_assets.py writes
     offer-assets.js): a line's new pictures go first, a type-only line gets
     picture layouts once it has one, and a placeholder that a real picture
     replaces is not drawn again */
  const EXTRA = (typeof window !== 'undefined' && window.OFFER_ASSETS) || {};
  Object.assign(SIZE, EXTRA.size || {});
  const real = n => (EXTRA.replaces || {})[n] || n;
  LINES.forEach(line => {
    const add = (EXTRA.sets || {})[line.key] || [];
    if (add.length){ line.sets = add.concat(line.sets || []); delete line.ledger; }
    if (line.sets){
      const seen = new Set();
      line.sets = line.sets.map(set => set.map(([n, k]) => [real(n), k]))
        .filter(set => set.every(([n]) => SIZE[n]) && !seen.has(JSON.stringify(set)) && seen.add(JSON.stringify(set)));
    }
  });
  Object.entries(EXTRA.grounds || {}).forEach(([key, list]) => {
    GROUNDS[key] = list.concat(GROUNDS[key] || []);
    if (LINES.some(l => l.key === key)) GROUND_OF[key] = key;
  });

  const made = [];
  LINES.forEach((line, li) => {
    const lays = line.ledger ? ['type', 'typeCenter', 'band'] : ['row', 'list', 'band', 'split', 'center'];
    const grounds = GROUNDS[GROUND_OF[line.key] || GROUND_OF[line.cat] || 'space'];
    const flavor = (FLAVOR[line.cat] || []).map(k => FACE[k]).filter(Boolean);
    lays.forEach((lay, k) => {
      const faceOk = F => (lay === 'split' || lay === 'band') ? F.cond || F.em <= 0.56 : true;
      const pool = flavor.filter(faceOk).length ? flavor.filter(faceOk) : FACES.filter(faceOk);
      const style = (li + k) % 2 ? 'num' : 'dot';
      const g = grounds[(li + k) % grounds.length];
      const G = { src:'assets/bg-offer/' + g.file + '.jpg', alpha: shadeFor(g.p90) };
      /* the category's own faces first; when none of them can set any of the
         line's headlines in this layout, the general ones */
      const general = FACES.filter(faceOk);
      let built = null;
      for (let a = 0; a < 120 && !built; a++){
        const look = LOOK_KEYS[(li * 7 + k * 3 + a) % LOOK_KEYS.length];
        const F = a < 60 ? pool[(li + k * 2 + a) % pool.length] : general[(li * 5 + k * 7 + a) % general.length];
        const head = line.heads[(k + a) % line.heads.length];
        const set = line.sets ? line.sets[(k + a) % line.sets.length] : null;
        const L = LOOKS[look];
        const layers = LAYOUTS[lay](L, F, line, head, set, style, G);
        if (layers) built = { look, F, head, layers, L };
      }
      if (!built) return;
      const { look, F, layers, L } = built;
      made.push({
        id: 'of_' + line.key + '_' + lay + '_' + look,
        name: line.label + ' · ' + LAYOUT_NAME[lay],
        tag: 'offer', cat: line.cat, tier: 'premium', line: line.key, layout: lay, look, faces: [F.d, F.r],
        /* the look's colours, for the tagline styles every template offers (app.js tplPalette) */
        palette: typeof palFromColors === 'function' ? palFromColors([L.band, L.acc, L.g1, L.g2]) : null,
        bg: { type:'image', src:G.src, fallback:{ type:'grad', c1:'#1b1e24', c2:'#0b0d10', a:180 } },
        photoIsDesign: true,
        layers,
      });
    });
  });
  made.forEach(tpl => TEMPLATES.push(tpl));
  /* the audit's hold list covers these too (app.js, applyTemplateHolds) */
  if (typeof applyTemplateHolds === 'function') applyTemplateHolds();

  /* the per-layer traits Enhance restores (app.js builds these for the
     templates it knows at load; these arrived after) */
  if (typeof TRAITS !== 'undefined' && typeof TRAIT_KEYS !== 'undefined'){
    made.forEach(tpl => {
      TRAITS[tpl.id] = {};
      tpl.layers.forEach(l => {
        if (!l.props) return;
        const tr = {};
        TRAIT_KEYS.forEach(k => { if (l.props[k] !== undefined) tr[k] = l.props[k]; });
        tr._shadow = l.props.shadow || null; tr._casing = l.casing || 'none'; tr._role = l.role || '';
        TRAITS[tpl.id][l.name] = tr;
      });
    });
  }
  /* for the lab and the prompt: what this family is made of */
  try { window.OFFER_LIBRARY = { looks: LOOKS, faces: FACES, flavor: FLAVOR, lines: LINES, layouts: Object.keys(LAYOUTS), grounds: GROUNDS, count: made.length }; } catch (e){}
})();
