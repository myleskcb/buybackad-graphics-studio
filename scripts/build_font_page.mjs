#!/usr/bin/env node
/* Assemble the swipe picker: inline every rendered card as a data URI so the
   page is one self-contained file that works offline and on a phone. */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const DIR = new URL('../.render/fonts/', import.meta.url).pathname;
const man = JSON.parse(readFileSync(DIR + 'manifest.json', 'utf8'));
const cards = man.map(m => ({
  ...m,
  src: 'data:image/webp;base64,' + readFileSync(DIR + m.id + '.webp').toString('base64'),
}));
const tpl = readFileSync(new URL('./font_page.html', import.meta.url).pathname, 'utf8');
const out = tpl.replace('/*__CARDS__*/', JSON.stringify(cards));
writeFileSync(DIR + 'picker.html', out);
console.log(`picker.html: ${cards.length} cards, ${(out.length/1048576).toFixed(1)} MB`);
