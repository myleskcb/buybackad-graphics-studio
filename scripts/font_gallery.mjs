#!/usr/bin/env node
/* FONT GALLERY. One card per face: the money word, the phone line, a kicker
   and a line of body copy, all in that face, on the house dark ground — so a
   face can be judged for the job it would actually do. Every face is free for
   commercial use: the five self-hosted Fontshare faces plus OFL families from
   Google Fonts. Nothing redrawn from a commercial typeface.
   usage: node scripts/font_gallery.mjs     (needs a server on :8899) */
import puppeteer from 'puppeteer-core';
import { writeFileSync, mkdirSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = new URL('../.render/fonts/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

/* Display faces: what carries SELL YOUR iPHONE. Numerals: what carries the
   number. Support: what carries the small copy. A face may serve more than
   one role; the gallery shows all three so that can be judged. */
export const FACES = [
  // house, self-hosted
  { name:'Clash Display', src:'house', role:'grotesque' }, { name:'Satoshi', src:'house', role:'grotesque' },
  { name:'Khand', src:'house', role:'condensed' }, { name:'Melodrama', src:'house', role:'serif' }, { name:'Zodiak', src:'house', role:'serif' },
  // grotesque / geometric — what the shortlists kept most
  ...['Manrope','Jost','Sora','Outfit','Chivo','Libre Franklin','Familjen Grotesk','Instrument Sans','Archivo',
      'Space Grotesk','Syne','Unbounded','Bricolage Grotesque','Anybody','Lexend','Poppins'].map(n => ({ name:n, src:'google', role:'grotesque' })),
  // heavy display / condensed
  ...['Archivo Black','Anton','Bebas Neue','Oswald','Big Shoulders Display','Barlow Condensed','Teko','League Gothic',
      'Fjalla One','Six Caps','Staatliches','Antonio','Saira Condensed','Russo One','Squada One'].map(n => ({ name:n, src:'google', role:'condensed' })),
  // handwritten / marker
  ...['Permanent Marker','Caveat','Kalam','Patrick Hand','Shadows Into Light','Indie Flower','Gloria Hallelujah','Reenie Beanie',
      'Homemade Apple','Nanum Pen Script','Architects Daughter','Rock Salt','Covered By Your Grace','Just Another Hand','Amatic SC','Cabin Sketch']
      .map(n => ({ name:n, src:'google', role:'handwritten' })),
  // brush / script
  ...['Pacifico','Lobster','Yellowtail','Great Vibes','Dancing Script','Satisfy','Kaushan Script','Courgette','Sacramento',
      'Alex Brush','Parisienne','Mr Dafoe','Marck Script','Knewave','Bangers'].map(n => ({ name:n, src:'google', role:'script' })),
  // graffiti / street / urban
  ...['Sedgwick Ave','Sedgwick Ave Display','Rubik Spray Paint','Rubik Wet Paint','Rubik Marker Hatch','Rubik Dirt','Rubik Distressed',
      'Rubik Burned','Rubik Iso','Rubik 80s Fade','Rubik Glitch','Rubik Storm','Rubik Doodle Shadow','Rubik Moonrocks','Rubik Vinyl',
      'Wallpoet','Faster One','Freckle Face','Nosifer','Creepster'].map(n => ({ name:n, src:'google', role:'graffiti' })),
  // stencil / military
  ...['Stardos Stencil','Black Ops One','Allerta Stencil','Saira Stencil One','Big Shoulders Stencil Display','Sirin Stencil']
      .map(n => ({ name:n, src:'google', role:'stencil' })),
  // retro display — DESIGN-LAW purged these as the Canva shelf; here because the brief is every style, labelled so it is a choice
  ...['Monoton','Righteous','Bungee','Bungee Shade','Bungee Inline','Rye','Fascinate','Ultra','Abril Fatface','Alfa Slab One','Bevan',
      'Chango','Titan One','Luckiest Guy','Lilita One','Passion One','Bowlby One','Rowdies','Shrikhand','Vast Shadow','Special Elite',
      'Press Start 2P','Rubik Mono One'].map(n => ({ name:n, src:'google', role:'retro' })),
  // blackletter / gothic
  ...['UnifrakturMaguntia','Pirata One','Grenze Gotisch','New Rocker','Metal Mania','Almendra Display','Cinzel Decorative']
      .map(n => ({ name:n, src:'google', role:'blackletter' })),
  // serif with attitude
  ...['Instrument Serif','Fraunces','DM Serif Display','Playfair Display','Cormorant Garamond','Cinzel','Bodoni Moda','Young Serif']
      .map(n => ({ name:n, src:'google', role:'serif' })),
  // slab
  ...['Zilla Slab','Arvo','Rokkitt','Bitter','Roboto Slab','Josefin Slab'].map(n => ({ name:n, src:'google', role:'slab' })),
  // rounded / friendly
  ...['Fredoka','Baloo 2','Nunito','Varela Round','Comfortaa','Quicksand','Sniglet'].map(n => ({ name:n, src:'google', role:'rounded' })),
  // numerals-first / mono / techno
  ...['Space Mono','IBM Plex Mono','JetBrains Mono','DM Mono','Major Mono Display','Orbitron','Audiowide']
      .map(n => ({ name:n, src:'google', role:'numerals' })),
];

const browser = await puppeteer.launch({ executablePath: CHROME, headless:'new', args:['--no-sandbox'], protocolTimeout:0 });
const page = await browser.newPage();
await page.goto('http://localhost:8899/', { waitUntil:'networkidle2', timeout:120000 });
await page.evaluate(() => document.fonts.ready);
const names = FACES.map(f => f.name);
for (let i = 0; i < names.length; i += 12){          // batches, so 130 stylesheet links do not stall the page
  await page.evaluate(async batch => {
    await Promise.all(batch.map(f => (typeof ensureFont === 'function' ? ensureFont(f) : Promise.resolve())));
  }, names.slice(i, i + 12));
}
await page.evaluate(async () => { await document.fonts.ready; try { fabric.util.clearFabricFontCache(); } catch(e){} });
await new Promise(r => setTimeout(r, 5000));

const cards = await page.evaluate(faces => {
  const W = 1080, H = 640;
  const T = (t, o) => new fabric.Text(t, Object.assign({ originX:'left', originY:'top', fill:'#f3efe8' }, o));
  return faces.map(f => {
    const sc = new fabric.StaticCanvas(null, { width:W, height:H, renderOnAddRemove:false });
    sc.add(new fabric.Rect({ left:0, top:0, width:W, height:H, fill: objGrad({ c1:'#1c2233', c2:'#0e1119', a:160 }) }));
    sc.add(T('TOP BUYER', { left:64, top:54, fontFamily:f.name, fontSize:26, fill:'#ffb03a', fontWeight:'700', charSpacing:160 }));
    sc.add(T('SELL YOUR', { left:60, top:104, fontFamily:f.name, fontSize:92, fontWeight:'700' }));
    sc.add(T('iPHONE', { left:56, top:196, fontFamily:f.name, fontSize:150, fill:'#5ad1a5', fontWeight:'800' }));
    sc.add(T('Same-day cash · any condition · any carrier · we come to you', { left:64, top:378, fontFamily:f.name, fontSize:28, fill:'#b9c0cf', fontWeight:'500' }));
    sc.add(new fabric.Rect({ left:56, top:452, width:640, height:112, rx:22, ry:22, fill:'#ffffff' }));
    sc.add(T('(562) 999-4994', { left:376, top:508, originX:'center', originY:'center', fontFamily:f.name, fontSize:60, fill:'#101014', fontWeight:'700', charSpacing:6 }));
    sc.add(T('1234567890', { left:W-64, top:508, originX:'right', originY:'center', fontFamily:f.name, fontSize:44, fill:'#8f95a5', fontWeight:'500', charSpacing:20 }));
    sc.add(T(f.name + '  ·  ' + (f.src === 'house' ? 'self-hosted, Fontshare' : 'Google Fonts, OFL') + '  ·  ' + f.role, { left:W-64, top:58, originX:'right', fontFamily:'Satoshi', fontSize:20, fill:'#8f95a5', fontWeight:'600' }));
    sc.renderAll();
    const c = document.createElement('canvas'); c.width = 720; c.height = Math.round(720 * H / W);
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
    g.drawImage(sc.lowerCanvasEl, 0, 0, W, H, 0, 0, c.width, c.height);
    const out = { id: f.name.toLowerCase().replace(/\s+/g,'-'), name:f.name, family: f.role, layout: f.src === 'house' ? 'self-hosted' : 'Google Fonts',
                  cat:'', c1:'#1c2233', ink:'#f3efe8', accent:'#5ad1a5', support:'#ffb03a',
                  png: c.toDataURL('image/webp', 0.86) };
    sc.dispose();
    return out;
  });
}, FACES);
await browser.close();
cards.forEach(c => writeFileSync(OUT + c.id + '.webp', Buffer.from(c.png.split(',')[1], 'base64')));
writeFileSync(OUT + 'manifest.json', JSON.stringify(cards.map(({png,...r}) => r), null, 1));
const byRole = {}; cards.forEach(c => byRole[c.family] = (byRole[c.family]||0)+1);
console.log('font gallery: ' + cards.length + ' faces · ' + JSON.stringify(byRole));
