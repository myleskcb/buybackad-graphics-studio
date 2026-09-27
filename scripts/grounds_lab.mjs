#!/usr/bin/env node
/* Backgrounds lab: every ground style in scripts/grounds.js, rendered in a few
   palettes with a sample headline over it, as a click-to-approve page. */
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname, OUT = ROOT + '.render/grounds/';
mkdirSync(OUT, { recursive: true });
const { THEMES } = await import(ROOT + 'scripts/theme_specs.mjs');
const PALS = ['jw05','du08','pp02','cd06','ca07','jw07'].map(id => THEMES.find(t => t.id === id)).filter(Boolean);
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox'], protocolTimeout: 0 });
const page = await browser.newPage();
await page.goto('about:blank'); await page.addScriptTag({ path: ROOT + 'scripts/grounds.js' });
const tiles = await page.evaluate(async (PALS) => {
  const out = [];
  for (const k of window.GROUNDS.list){
    PALS.forEach((P, i) => {
      const c = document.createElement('canvas'); c.width = 540; c.height = 540; const g = c.getContext('2d');
      g.save(); g.scale(0.5, 0.5); window.GROUNDS.draw(k.key, g, 1080, 1080, P, 7 + i * 13); g.restore();
      /* a sample line so legibility is judged, not just the picture */
      g.font = '800 54px Archivo, Helvetica, Arial, sans-serif'; g.textAlign = 'center';
      const lumHex = h => { const m = h.replace('#',''); const [r, gg, b] = [0,2,4].map(o => parseInt(m.slice(o,o+2),16)/255).map(v => v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4)); return 0.2126*r+0.7152*gg+0.0722*b; };
      g.fillStyle = lumHex(P.c1) < 0.35 || /stars|carbon|velvet|glow|bokeh|aurora|skyline/.test(k.key) ? '#ffffff' : '#141110';
      g.fillText('SELL YOUR iPHONE', 270, 250); g.font = '600 22px Archivo, Helvetica, Arial, sans-serif'; g.fillText(k.name.toUpperCase(), 270, 300);
      out.push({ id: k.key + '-' + P.id, kind: k.key, name: k.name, note: k.note, palette: P.name, src: c.toDataURL('image/webp', 0.8) });
    });
  }
  return out;
}, PALS);
await browser.close();
const tpl = readFileSync(ROOT + 'scripts/grid25_page.html', 'utf8');
const cards = tiles.map(t => ({ id: t.id, name: t.name + ' · ' + t.palette, family: t.kind, layout: t.note, cat: t.palette, c1: '#000', ink: '#000', accent: '#000', support: '#000', src: t.src }));
let out = tpl.replace('/*__CARDS__*/', JSON.stringify(cards)).replace("KEY = 'template-grid-v3'", "KEY = 'grounds-v1'")
  .replace(/Set 3 &mdash; 250 cards cut from both reviews, all 56 approved faces\./, 'Background styles &mdash; ' + tiles.length + ' tiles: ' + (tiles.length / PALS.length) + ' styles, each in ' + PALS.length + ' palettes, with a sample line over it.');
writeFileSync(OUT + 'picker.html', out);
console.log('grounds lab: ' + (tiles.length / PALS.length) + ' styles × ' + PALS.length + ' palettes = ' + tiles.length + ' tiles, ' + (out.length / 1048576).toFixed(1) + ' MB');
