#!/usr/bin/env node
/* Assemble the swipe picker: inline every rendered card as a data URI so the
   page is one self-contained file that works offline and on a phone. */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const DIR = process.env.LAB_OUT ? new URL('../' + process.env.LAB_OUT.replace(/\/?$/, '/'), import.meta.url).pathname : new URL('../.render/retheme/', import.meta.url).pathname;
const man = JSON.parse(readFileSync(DIR + 'manifest.json', 'utf8'));
const cards = man.map(m => ({
  ...m,
  src: 'data:image/webp;base64,' + readFileSync(DIR + (process.env.SMALL ? 'small/' : '') + m.id + '.webp').toString('base64'),
}));
const tpl = readFileSync(new URL('./grid25_page.html', import.meta.url).pathname, 'utf8');
const SET = process.env.SET || '3', OUTDIR = process.env.OUT_DIR ? process.env.OUT_DIR.replace(/\/?$/, '/') : DIR;
let out = tpl.replace('/*__CARDS__*/', JSON.stringify(cards));
if (SET !== '3'){
  /* SET_NOTE names what this set changed; without it the Set 4 sentence stands */
  const note = process.env.SET_NOTE || '250 cards, every rule from the Set 3 review applied: one face per headline sentence, worst-quarter contrast, products placed or removed, no info-line sentence tails.';
  out = out.replace("KEY = 'template-grid-v3'", "KEY = 'template-grid-v" + SET + "'")
           .replace(/Set 3 &mdash; 250 cards cut from both reviews, all 56 approved faces\./, 'Set ' + SET + ' &mdash; ' + note);
}
writeFileSync(OUTDIR + 'picker.html', out);
console.log(`picker.html: ${cards.length} cards, ${(out.length/1048576).toFixed(1)} MB`);
