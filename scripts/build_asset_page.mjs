#!/usr/bin/env node
/* Assemble the 8x8 asset picker from the thumbnails (scripts/asset_thumbs.mjs). */
import { readFileSync, writeFileSync } from 'node:fs';
const DIR = new URL('../.render/assets/', import.meta.url).pathname;
const man = JSON.parse(readFileSync(DIR + 'manifest.json', 'utf8'));
const ORDER = ['iphone','ipad','watch','macbook','samsung','pixel','gold','silver','coins','cars','strips','pokemon','sports','cash','apple-misc','misc'];
man.sort((a, b) => (ORDER.indexOf(a.cat) - ORDER.indexOf(b.cat)) || (a.src === 'fal' ? -1 : 1) || a.id.localeCompare(b.id));
const cards = man.map(m => ({ id: m.id, cat: m.cat, src: m.src, img: 'data:image/webp;base64,' + readFileSync(DIR + 'thumbs/' + m.id + '.webp').toString('base64') }));
const tpl = readFileSync(new URL('./grid64_page.html', import.meta.url).pathname, 'utf8');
const out = tpl.replace('/*__CARDS__*/', JSON.stringify(cards));
writeFileSync(DIR + 'picker.html', out);
console.log(`asset picker: ${cards.length} assets, ${(out.length/1048576).toFixed(1)} MB, ${Math.ceil(cards.length/64)} pages`);
