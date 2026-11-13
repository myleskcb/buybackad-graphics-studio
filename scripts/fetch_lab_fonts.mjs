#!/usr/bin/env node
/* THE TYPE LAB (2026-11-13). The owner: "we only have pretty normal looking
 * fonts. We want fonts that pop, that catch, that may not be as readily
 * available … as many unique ones that are graphic design friendly, conducive
 * of different design languages".
 *
 * Candidates for the owner's next review, vendored into assets/fonts/lab so a
 * face that is picked is already on disk. None of them is in the product until
 * it is approved (assets/approved-fonts.json) and paired (FONT_PAIRS).
 *
 * Every face here:
 *  - is SIL Open Font License 1.1, proven per family by its METADATA.pb under
 *    ofl/ in github.com/google/fonts (not assumed from the catalogue), so it
 *    may be self-hosted, embedded in exported ads and modified;
 *  - carries the dollar sign, the figures, the punctuation a number is set with
 *    and the Spanish accents (checked on each file's character map), and was
 *    looked at set as a headline, a price and a phone number: faces too thin
 *    to hold a headline, or that did not read, were cut before this list;
 *  - was NOT in the 2026-09-01 gallery of 151 (scripts/font_gallery.mjs), is
 *    not in the picker (FONT_GROUPS in app.js), and is not on the "Canva
 *    shelf" DESIGN-LAW 9 retired.
 * `like` names the licensed face whose styling it gives us, where there is one:
 * a reference for the eye, never a copy of that face's files or its name.
 *
 * Latin subset only (the ads are English and Spanish). A variable family comes
 * down as one file and is declared over its real range, so no weight is faked.
 *
 *   node scripts/fetch_lab_fonts.mjs
 *   (network: fonts.googleapis.com, fonts.gstatic.com, raw.githubusercontent.com)
 */
import { writeFileSync, existsSync, statSync, mkdirSync, readFileSync } from 'node:fs';

const DIR = new URL('../assets/fonts/lab/', import.meta.url).pathname;
mkdirSync(DIR, { recursive: true });

export const LANGUAGES = {
  wide:        'Wide & extended',
  compressed:  'Compressed poster',
  italic:      'Heavy italic & speed',
  grotesk:     'Grotesques with character',
  softserif:   'Fat soft serif',
  contrast:    'High-contrast editorial',
  slab:        'Slab, varsity & western',
  blackletter: 'Blackletter & engraved',
  script:      'Sign-painter script & brush',
  hand:        'Marker & hand',
  chunky:      'Chunky & playful',
  tech:        'Techno & sci-fi',
  pixel:       'Pixel & terminal',
  deco:        'Deco, inline & shadow',
  wild:        'Experimental',
};

/* [family, language, like?, opts?]   opts.w: static weights to take (default: the
   heaviest the family ships); opts.ital: also take the italic of those weights;
   opts.wdth: keep the width axis. */
export const CANDIDATES = [
  // ── wide & extended
  ['Dela Gothic One', 'wide', 'Akira Expanded'],
  ['Climate Crisis', 'wide', 'Druk Wide'],
  ['Krona One', 'wide', 'Monument Extended'],
  ['Lexend Zetta', 'wide', 'Monument Extended'],
  ['Lexend Giga', 'wide'],
  ['Michroma', 'wide', 'Microgramma'],
  ['Zen Dots', 'wide'],
  ['Stalinist One', 'wide'],
  ['Rammetto One', 'wide'],
  ['Gasoek One', 'wide'],
  ['Mona Sans', 'wide', 'Obviously Wide', { wdth: true }],
  ['Hubot Sans', 'wide', null, { wdth: true }],
  ['Encode Sans Expanded', 'wide', null, { w: [900] }],
  ['Goldman', 'wide'],
  ['Red Rose', 'wide'],
  ['Bowlby One', 'wide', 'Impact Wide'],
  ['Poller One', 'wide'],
  ['Wendy One', 'wide'],
  // ── compressed poster
  ['Alumni Sans', 'compressed', 'Tungsten'],
  ['Smooch Sans', 'compressed', 'Druk Condensed'],
  ['Anton SC', 'compressed'],
  ['Saira Extra Condensed', 'compressed', null, { w: [800, 900] }],
  ['Fira Sans Extra Condensed', 'compressed', 'Knockout', { w: [900], ital: true }],
  ['Pathway Extreme', 'compressed', null, { wdth: true }],
  ['Stick No Bills', 'compressed'],
  ['Bahiana', 'compressed'],
  ['Bahianita', 'compressed'],
  ['Londrina Solid', 'compressed', null, { w: [900] }],
  ['Big Shoulders Inline Display', 'compressed'],
  ['Jockey One', 'compressed'],
  ['Germania One', 'compressed'],
  ['Imbue', 'compressed', 'Ogg Condensed'],
  ['Truculenta', 'compressed', null, { wdth: true }],
  // ── heavy italic & speed
  ['Kanit', 'italic', 'Sharp Grotesk Italic', { w: [900], ital: true }],
  ['Exo 2', 'italic', null, { w: [900], ital: true }],
  ['Barlow Condensed', 'italic', 'DIN Condensed Italic', { w: [900], ital: true, as: 'Barlow Condensed Black' }],
  ['Tomorrow', 'italic', null, { w: [900], ital: true }],
  ['Changa One', 'italic', null, { ital: true }],
  ['Fugaz One', 'italic'],
  ['Sarpanch', 'tech', null, { w: [900] }],
  ['Passero One', 'tech'],
  ['Kenia', 'wild'],
  ['Carter One', 'italic'],
  // ── grotesques with character
  ['Darker Grotesque', 'grotesk', 'Neue Machina'],
  ['Epilogue', 'grotesk', 'Roobert'],
  ['Gabarito', 'grotesk'],
  ['Funnel Display', 'grotesk'],
  ['Parkinsans', 'grotesk'],
  ['Recursive', 'grotesk'],
  ['Anek Latin', 'grotesk', null, { wdth: true }],
  ['Montagu Slab', 'grotesk'],
  // ── fat soft serif
  ['Caprasimo', 'softserif', 'Cooper Black'],
  ['Chonburi', 'softserif', 'Windsor'],
  ['Calistoga', 'softserif', 'Recoleta Black'],
  ['Rozha One', 'softserif'],
  ['Yeseva One', 'softserif'],
  ['Gravitas One', 'softserif', 'Fat Face'],
  ['Erica One', 'softserif'],
  ['Lemon', 'softserif'],
  ['Corben', 'softserif', 'Cooper', { w: [700] }],
  ['Holtwood One SC', 'softserif'],
  ['Bigshot One', 'softserif'],
  ['Suez One', 'softserif'],
  ['Sansita Swashed', 'softserif'],
  ['Elsie Swash Caps', 'softserif', null, { w: [900] }],
  ['Sonsie One', 'softserif'],
  ['Kavoon', 'softserif'],
  // ── high-contrast editorial
  ['Kalnia', 'contrast', 'Didot Display', { wdth: true }],
  ['Playfair Display SC', 'contrast', null, { w: [900], ital: true }],
  ['Libre Bodoni', 'contrast', 'Bodoni Poster'],
  ['Cormorant Unicase', 'contrast', null, { w: [700] }],
  ['Limelight', 'contrast', 'Broadway'],
  ['Diplomata', 'contrast'],
  ['Besley', 'contrast', 'Clarendon'],
  ['Hepta Slab', 'contrast'],
  // ── slab, varsity & western
  ['Alumni Sans Collegiate One', 'slab', 'Varsity'],
  ['Sancreek', 'slab', 'Wood type'],
  ['Ewert', 'slab'],
  ['Arbutus', 'slab'],
  ['Chela One', 'slab'],
  ['Zilla Slab Highlight', 'slab', null, { w: [700] }],
  ['Ranchers', 'slab'],
  ['Emblema One', 'slab'],
  ['Keania One', 'slab'],
  ['Plaster', 'slab'],
  ['Tourney', 'slab', 'Athletic inline'],
  // ── blackletter & engraved
  ['UnifrakturCook', 'blackletter', 'Fette Fraktur'],
  ['Jacquard 24', 'blackletter'],
  ['Jacquard 12', 'blackletter'],
  ['Texturina', 'blackletter'],
  ['Fruktur', 'blackletter'],
  ['Uncial Antiqua', 'blackletter'],
  ['Almendra', 'blackletter', null, { w: [700] }],
  // ── sign-painter script & brush
  ['Sriracha', 'script'],
  ['Damion', 'script'],
  ['Leckerli One', 'script'],
  ['Oleo Script', 'script', null, { w: [700] }],
  ['Oleo Script Swash Caps', 'script', null, { w: [700] }],
  ['Playball', 'script'],
  ['Pattaya', 'script'],
  ['Yesteryear', 'script'],
  ['Galada', 'script'],
  ['Berkshire Swash', 'script'],
  ['Lily Script One', 'script'],
  ['Spicy Rice', 'script'],
  ['Caveat Brush', 'script'],
  // ── marker & hand
  ['Gochi Hand', 'hand'],
  ['Finger Paint', 'hand'],
  ['Fuzzy Bubbles', 'hand', null, { w: [700] }],
  ['Shantell Sans', 'hand'],
  ['Barriecito', 'hand'],
  ['Barrio', 'hand'],
  ['Rubik Spray Paint', 'hand'],
  // ── chunky & playful
  ['Bagel Fat One', 'chunky'],
  ['Cherry Bomb One', 'chunky'],
  ['Sour Gummy', 'chunky'],
  ['DynaPuff', 'chunky'],
  ['Coiny', 'chunky'],
  ['Gluten', 'chunky'],
  ['Grandstander', 'chunky'],
  ['Boogaloo', 'chunky'],
  ['Chicle', 'chunky'],
  ['Modak', 'chunky'],
  ['Sigmar', 'chunky'],
  ['Darumadrop One', 'chunky'],
  ['Mochiy Pop One', 'chunky'],
  ['Rubik Bubbles', 'chunky'],
  ['Galindo', 'chunky'],
  ['Skranji', 'chunky', null, { w: [700] }],
  ['Oi', 'chunky'],
  ['Ceviche One', 'chunky'],
  ['Shojumaru', 'chunky'],
  ['Potta One', 'chunky'],
  ['Matemasie', 'chunky'],
  ['Danfo', 'chunky'],
  ['Protest Strike', 'chunky'],
  ['Protest Guerrilla', 'chunky'],
  ['Protest Revolution', 'chunky'],
  ['Protest Riot', 'chunky'],
  // ── techno & sci-fi
  ['Oxanium', 'tech'],
  ['Tektur', 'tech'],
  ['Turret Road', 'tech', null, { w: [800] }],
  ['Bruno Ace SC', 'tech'],
  ['Iceberg', 'tech'],
  ['Revalia', 'tech'],
  ['Tilt Neon', 'tech'],
  ['Tilt Prism', 'tech'],
  ['Martian Mono', 'tech', null, { wdth: true }],
  ['Azeret Mono', 'tech'],
  ['Kode Mono', 'tech'],
  // ── pixel & terminal
  ['Pixelify Sans', 'pixel'],
  ['Silkscreen', 'pixel', null, { w: [700] }],
  ['VT323', 'pixel'],
  ['Handjet', 'pixel'],
  ['Tiny5', 'pixel'],
  ['Jersey 10', 'pixel'],
  ['Jersey 25', 'pixel'],
  ['Sixtyfour', 'pixel'],
  ['Workbench', 'pixel'],
  ['Rubik Broken Fax', 'pixel'],
  // ── deco, inline & shadow
  ['Fascinate Inline', 'deco'],
  ['Bungee Inline', 'deco'],
  ['Londrina Shadow', 'deco'],
  ['Zen Tokyo Zoo', 'deco'],
  ['Train One', 'deco'],
  ['Rampart One', 'deco'],
  ['Monofett', 'deco'],
  ['Alumni Sans Inline One', 'deco'],
  ['Ribeye', 'deco'],
  ['Kumar One', 'deco'],
  ['Atomic Age', 'deco'],
  // ── experimental
  ['Kablammo', 'wild'],
  ['Moo Lah Lah', 'wild'],
  ['Rubik Gemstones', 'wild'],
  ['Rubik Beastly', 'wild'],
  ['Vampiro One', 'wild'],
  ['Miltonian Tattoo', 'wild'],
  ['Trade Winds', 'wild'],
  ['Piedra', 'wild'],
  ['Frijole', 'wild'],
  ['Gajraj One', 'wild'],
  ['Ruslan Display', 'wild'],
];

/* THE SECOND BATCH (2026-11-13). The owner, after picking 27: "any others
   suggested based off that … similar ones? compared one selected to another
   similar? how about other ends of design spectrum?". Two kinds of group:
   `refs` groups open with the faces the owner picked and then show new faces
   close to them (`near` names the closest pick); the rest are the ends of the
   spectrum the picks did not touch. Apache 2.0 faces are taken here as well as
   OFL (both allow commercial use, self-hosting and modification). */
export const GROUPS2 = {
  n_chunky:  { title: 'Like your chunky, friendly picks', refs: ['Cherry Bomb One', 'DynaPuff', 'Galindo', 'Boogaloo'] },
  n_hand:    { title: 'Like your marker and hand picks', refs: ['Gochi Hand', 'Caveat Brush', 'Barrio'] },
  n_street:  { title: 'Like your spray and protest picks', refs: ['Rubik Spray Paint', 'Protest Revolution', 'Protest Riot'] },
  n_poster:  { title: 'Like your tall poster picks', refs: ['Stick No Bills', 'Bahiana', 'Londrina Solid', 'Truculenta'] },
  n_italic:  { title: 'Like your heavy italic picks', refs: ['Kanit', 'Fugaz One'], italic: true },
  n_pixel:   { title: 'Like your pixel and terminal picks', refs: ['Silkscreen', 'VT323', 'Workbench'] },
  n_slab:    { title: 'Like your slab, varsity and gothic picks', refs: ['Ranchers', 'Tourney', 'Zilla Slab Highlight', 'Fruktur'] },
  n_tech:    { title: 'Like your neon, tech and dimensional picks', refs: ['Tilt Neon', 'Michroma', 'Rampart One'] },
  o_luxe:    { title: 'Other end: luxury serif' },
  o_modern:  { title: 'Other end: clean and modern' },
  o_script:  { title: 'Other end: formal script' },
  o_deco:    { title: 'Other end: deco and vintage' },
  o_stark:   { title: 'Other end: stark and technical' },
};
const b2 = (lang, rows) => rows.map(([family, near, opts]) => [family, lang, null, { ...(opts || {}), batch: 2, near: near || undefined }]);
export const BATCH2 = [
  ...b2('n_chunky', [['Chewy', 'Boogaloo'], ['Slackey', 'Galindo'], ['Mogra', 'Galindo'], ['Bubblegum Sans', 'Boogaloo'], ['Nerko One', 'Boogaloo'], ['Rum Raisin', 'Boogaloo'],
    ['Chelsea Market', 'Galindo'], ['McLaren', 'Galindo'], ['Irish Grover', 'Cherry Bomb One'], ['Fontdiner Swanky', 'Cherry Bomb One'], ['Cherry Cream Soda', 'Cherry Bomb One'],
    ['Hanalei Fill', 'Cherry Bomb One'], ['Emilys Candy', 'DynaPuff'], ['Mouse Memoirs', 'Boogaloo'], ['Salsa', 'Boogaloo'], ['Comic Relief', 'DynaPuff', { w: [700] }],
    ['Lilita One', 'DynaPuff'], ['Baloo Bhai 2', 'DynaPuff']]),
  ...b2('n_hand', [['Rancho', 'Caveat Brush'], ['Schoolbell', 'Gochi Hand'], ['Unkempt', 'Gochi Hand', { w: [700] }], ['Walter Turncoat', 'Gochi Hand'], ['Crafty Girls', 'Gochi Hand'],
    ['Coming Soon', 'Gochi Hand'], ['Sunshiney', 'Gochi Hand'], ['Playpen Sans', 'Gochi Hand'], ['Delicious Handrawn', 'Caveat Brush'], ['Kavivanar', 'Caveat Brush'],
    ['Itim', 'Gochi Hand'], ['Mali', 'Gochi Hand', { w: [700] }], ['Pangolin', 'Gochi Hand'], ['Short Stack', 'Gochi Hand'], ['Neucha', 'Caveat Brush'], ['Swanky and Moo Moo', 'Gochi Hand'],
    ['Just Me Again Down Here', 'Barrio'], ['Love Ya Like A Sister', 'Barrio'], ['Kranky', 'Barrio'], ['Fredericka the Great', 'Barrio'], ['Ruge Boogie', 'Caveat Brush']]),
  ...b2('n_street', [['Rubik Distressed', 'Rubik Spray Paint'], ['Rubik Glitch', 'Rubik Spray Paint'], 
    ['Averia Gruesa Libre', 'Protest Riot'], ['Rock Salt', 'Protest Revolution'], ['Covered By Your Grace', 'Protest Riot'],
    ]),
  ...b2('n_poster', [['Special Gothic Condensed One', 'Truculenta'], ['Special Gothic Expanded One', 'Londrina Solid'], ['Smokum', 'Bahiana'], ['Six Caps', 'Bahiana'],
    ['League Gothic', 'Truculenta'], ['Antonio', 'Truculenta'], ['Stardos Stencil', 'Stick No Bills', { w: [700] }], ['Saira Stencil One', 'Stick No Bills'], ['Allerta Stencil', 'Stick No Bills'],
    ['Sirin Stencil', 'Stick No Bills'], ['Kdam Thmor Pro', 'Londrina Solid'], ['Asset', 'Londrina Solid']]),
  ...b2('n_italic', [['Prompt', 'Kanit', { w: [900], ital: true }], ['Rubik', 'Kanit', { ital: true }], ['Nunito', 'Fugaz One', { ital: true, as: 'Nunito Black' }], ['Chivo', 'Kanit', { ital: true, as: 'Chivo Black' }],
    ['Sofia Sans Extra Condensed', 'Kanit', { ital: true, as: 'Sofia Sans XCond Black' }], ['Saira', 'Kanit', { ital: true }], ['Barlow', 'Kanit', { w: [900], ital: true }],
    ['K2D', 'Kanit', { w: [800], ital: true }], ['Exo', 'Kanit', { ital: true }], ['Racing Sans One', 'Fugaz One'], ['Work Sans', 'Kanit', { ital: true }], ['Bai Jamjuree', 'Fugaz One', { w: [700], ital: true }]]),
  ...b2('n_pixel', [['Bitcount Grid Double', 'Workbench'], ['Bitcount Prop Single', 'Silkscreen'], ['Bitcount Single', 'Silkscreen'], ['Geo', 'VT323'], ['Share Tech Mono', 'VT323'],
    ['Jersey 20', 'VT323'], ['Courier Prime', 'VT323', { w: [700] }], ['Sono', 'VT323']]),
  ...b2('n_slab', [['Graduate', 'Tourney'], ['Black Ops One', 'Tourney'], 
    ['Coustard', 'Ranchers', { w: [900] }], ['Oldenburg', 'Ranchers'], ['Trochut', 'Zilla Slab Highlight', { w: [700] }], ['Grenze Gotisch', 'Fruktur'],
    ['New Rocker', 'Fruktur'], ['Germania One', 'Fruktur'], ['Plaster', 'Tourney']]),
  ...b2('n_tech', [['Monoton', 'Tilt Neon'], 
    ['Vast Shadow', 'Rampart One'], ['Syncopate', 'Michroma', { w: [700] }], ['Orbitron', 'Michroma'], ['Unica One', 'Michroma']]),
  ...b2('o_luxe', [['Noto Serif Display', null, { ital: true }], ['Playfair Display', null, { ital: true }], ['Instrument Serif', null, { ital: true, as: 'Instrument Serif Italic' }], ['Bodoni Moda', null, { ital: true }],
    ['Marcellus'], ['Forum'], ['Castoro Titling'], ['Gilda Display'], ['Bona Nova SC', null, { w: [700] }], ['Petrona'], ['Roboto Serif', null, { wdth: true }], ['Cinzel'], ['Fraunces']]),
  ...b2('o_modern', [['Geist'], ['Plus Jakarta Sans'], ['Urbanist'], ['Red Hat Display'], ['Wix Madefor Display'], ['Inter Tight'], ['Montserrat Alternates', null, { w: [900] }], ['Julius Sans One'],
    ['Josefin Sans'], ['Raleway'], ['Outfit'], ['Space Grotesk'], ['Syne']]),
  ...b2('o_script', [['Pinyon Script'], ['Allura'], ['Petit Formal Script'], ['Imperial Script'], ['Birthstone Bounce', null, { w: [500] }], ['Great Vibes'], ['Tangerine', null, { w: [700] }], ]),
  ...b2('o_deco', [['Poiret One'], ['Marcellus SC'], ['Federant'], ['Aubrey'], ['Text Me One'], ['Cinzel Decorative', null, { w: [900] }], ]),
  ...b2('o_stark', [['Geist Mono'], ['Reddit Mono'], ['Sometype Mono'], ['Space Mono', null, { w: [700] }], ['Major Mono Display'], ['Xanh Mono'], ['Archivo Black'], ['Anton']]),
];

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const get = async (url, as) => { const r = await fetch(url, { headers: { 'user-agent': UA } }); if (!r.ok) throw new Error(r.status + ' ' + url); return as === 'buf' ? Buffer.from(await r.arrayBuffer()) : r.text(); };

async function one([family, lang, like, opts = {}]) {
  /* the licence, from the family's own record in google/fonts */
  const dirName = family.toLowerCase().replace(/ /g, '');
  let meta = null, lic = null;
  for (const [d, l, id] of [['ofl', 'OFL', 'OFL-1.1']].concat(opts.batch === 2 ? [['apache', 'APACHE2', 'Apache-2.0']] : [])) {
    const m = await get('https://raw.githubusercontent.com/google/fonts/main/' + d + '/' + dirName + '/METADATA.pb').catch(() => null);
    if (m && new RegExp('license:\\s*"' + l + '"').test(m)) { meta = m; lic = [d, id]; break; }
  }
  if (!meta) throw new Error('no open licence on record');
  const designer = (/designer:\s*"([^"]+)"/.exec(meta) || [])[1] || '';
  const axes = {}; for (const m of meta.matchAll(/axes\s*\{\s*tag:\s*"(\w+)"\s*min_value:\s*([\d.-]+)\s*max_value:\s*([\d.-]+)/g)) axes[m[1]] = [+m[2], +m[3]];
  const statics = [...new Set([...meta.matchAll(/fonts\s*\{[^}]*?style:\s*"normal"[^}]*?weight:\s*(\d+)/g)].map(m => +m[1]))].sort((a, b) => a - b);
  const hasItalic = /style:\s*"italic"/.test(meta);
  const variable = !!axes.wght;
  const weights = variable ? [axes.wght] : (opts.w || [statics[statics.length - 1] || 400]);
  const name = opts.as || family, base = slug(name), files = [], css = [];
  for (const w of weights) for (const it of (opts.ital && hasItalic ? [0, 1] : [0])) {
    const wv = Array.isArray(w) ? w[0] + '..' + w[1] : w;
    const tags = [], vals = [];
    if (it) { tags.push('ital'); vals.push(1); }
    if (opts.wdth && axes.wdth) { tags.push('wdth'); vals.push(axes.wdth[0] + '..' + axes.wdth[1]); }
    tags.push('wght'); vals.push(wv);
    const txt = await get('https://fonts.googleapis.com/css2?family=' + family.replace(/ /g, '+') + ':' + tags.join(',') + '@' + vals.join(',') + '&display=swap');
    const blocks = txt.split('/* latin */');
    const m = blocks.length > 1 ? blocks[1] : txt;      // a latin-only family has no subset comment
    const src = /url\((https:[^)]+\.woff2)\)/.exec(m);
    if (!src) throw new Error('no latin woff2');
    const file = base + '-' + (Array.isArray(w) ? 'var' : w) + (it ? 'i' : '') + '.woff2';
    if (!existsSync(DIR + file)) writeFileSync(DIR + file, await get(src[1], 'buf'));
    const stretch = opts.wdth && axes.wdth ? `font-stretch:${axes.wdth[0]}% ${axes.wdth[1]}%;` : '';
    css.push(`@font-face{font-family:'${name}';src:url('${file}') format('woff2');font-weight:${Array.isArray(w) ? w.join(' ') : w};${stretch}font-style:${it ? 'italic' : 'normal'};font-display:swap}`);
    files.push({ file, weight: Array.isArray(w) ? w : w, italic: !!it, kb: Math.round(statSync(DIR + file).size / 1024) });
  }
  return { name, family, language: lang, like: like || null, designer, licence: lic[1], source: 'google/fonts ' + lic[0] + '/' + dirName,
           batch: opts.batch, near: opts.near, wdth: !!(opts.wdth && axes.wdth) || undefined,
           variable, axes: variable ? axes : undefined, files, css };
}

if (import.meta.url === 'file://' + process.argv[1] && process.argv.includes('--batch2')) {
  /* the second batch only: the first review's record (faces, verdicts) stands */
  const out = [], failed = [];
  for (let i = 0; i < BATCH2.length; i += 8)
    await Promise.all(BATCH2.slice(i, i + 8).map(c => one(c).then(r => out.push(r), e => failed.push(c[0] + ': ' + e.message))));
  const nm = c => (c[3] && c[3].as) || c[0];
  out.sort((a, b) => BATCH2.findIndex(c => nm(c) === a.name) - BATCH2.findIndex(c => nm(c) === b.name));
  const lab = JSON.parse(readFileSync(DIR + '../../font-lab.json', 'utf8'));
  lab.groups2 = GROUPS2;
  lab.faces2 = out.map(({ css, ...f }) => f);
  writeFileSync(DIR + '../../font-lab.json', JSON.stringify(lab, null, 1) + '\n');
  const old = readFileSync(DIR + 'lab.css', 'utf8').split('\n').filter(l => l && !out.some(f => f.css.includes(l)));
  writeFileSync(DIR + 'lab.css', old.concat(out.flatMap(f => f.css)).join('\n') + '\n');
  console.log(out.length + ' faces, ' + (out.reduce((s, f) => s + f.files.reduce((t, x) => t + x.kb, 0), 0) / 1024).toFixed(1) + ' MB');
  if (failed.length) console.log('NOT TAKEN (' + failed.length + '):\n  ' + failed.join('\n  '));
} else if (import.meta.url === 'file://' + process.argv[1]) {
  const out = [], failed = [];
  for (let i = 0; i < CANDIDATES.length; i += 8) {
    await Promise.all(CANDIDATES.slice(i, i + 8).map(c => one(c).then(r => out.push(r), e => failed.push(c[0] + ': ' + e.message))));
  }
  out.sort((a, b) => CANDIDATES.findIndex(c => (c[3] && c[3].as || c[0]) === a.name) - CANDIDATES.findIndex(c => (c[3] && c[3].as || c[0]) === b.name));
  writeFileSync(DIR + 'lab.css', '/* generated by scripts/fetch_lab_fonts.mjs: candidates in review, OFL 1.1, self-hosted. Not loaded by the product. */\n' + out.flatMap(f => f.css).join('\n') + '\n');
  const prior = existsSync(DIR + '../../font-lab.json') ? JSON.parse(readFileSync(DIR + '../../font-lab.json', 'utf8')) : {};
  writeFileSync(DIR + '../../font-lab.json', JSON.stringify({
    built: new Date().toISOString().slice(0, 10),
    note: 'Candidates for the owner\'s review. A face is in the product only once it is in approved-fonts.json and paired in FONT_PAIRS.',
    languages: LANGUAGES,
    verdicts: prior.verdicts || {},
    faces: out.map(({ css, ...f }) => f),
  }, null, 1) + '\n');
  const kb = out.reduce((s, f) => s + f.files.reduce((t, x) => t + x.kb, 0), 0);
  console.log(out.length + ' faces, ' + out.reduce((s, f) => s + f.files.length, 0) + ' files, ' + (kb / 1024).toFixed(1) + ' MB');
  if (failed.length) console.log('NOT TAKEN (' + failed.length + '):\n  ' + failed.join('\n  '));
}
