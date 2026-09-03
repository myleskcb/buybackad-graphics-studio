#!/usr/bin/env node
/* The master lab: every review the owner never started or stopped halfway,
   in one page with one approval store and per-section progress.
     Set 4      — 250 cards, never opened (from .render/set4/picker.html)
     Set 5b     — the last page (476–500) of the 500-card set (page 19/20 reached)
     Gallery    — the six layouts not yet reviewed (.render/gallery/<layout>/)
     Assets     — the 464 library cutouts, never reviewed (.render/assets/)
   Thumbnails are re-encoded small so the whole thing stays under the size cap. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
const ROOT = new URL('../', import.meta.url).pathname;
const pull = (file) => { const html = readFileSync(file, 'utf8'); const m = html.match(/const CARDS = (\[[\s\S]*?\]);\nconst PER/); return m ? JSON.parse(m[1]) : []; };
const set4 = pull(ROOT + '.render/set4/picker.html');
const set5 = pull(ROOT + '.render/set5/picker.html');
const GALLERY_LEFT = ['gradientWave','ticketStub','hudTech','bandKnockout','arcCrown','glassCard'];
const NAMES = { gradientWave:'Gradient Wave', ticketStub:'Ticket Stub', hudTech:'HUD Tech', bandKnockout:'Band Knockout', arcCrown:'Arc Crown', glassCard:'Glass Card' };
const gallery = GALLERY_LEFT.flatMap(L => {
  const dir = ROOT + '.render/gallery/' + L + '/'; if (!existsSync(dir + 'manifest.json')) return [];
  return JSON.parse(readFileSync(dir + 'manifest.json', 'utf8')).map(m => ({ ...m, src: 'data:image/webp;base64,' + readFileSync(dir + m.id + '.webp').toString('base64'), gal: L }));
});
const assetsMan = JSON.parse(readFileSync(ROOT + '.render/assets/manifest.json', 'utf8'));
const assets = assetsMan.map(m => ({ id: m.id, cat: m.cat, src: 'data:image/webp;base64,' + readFileSync(ROOT + '.render/assets/thumbs/' + m.id + '.webp').toString('base64') }));

const SECTIONS = [
  { key:'set4', name:'Set 4 — 250 cards, never opened', per:25, premise:'Cut from your Set 1 and 2 approvals with the six palettes that were new then. Same rules as Set 3 plus the three-line headline, worst-quarter contrast and product placement. Approve for design language; alignment faults are fixed later.' },
  { key:'set5', name:'Set 5 — last page (476–500)', per:25, premise:'You reached page 19 of 20 with 137 kept; this is the page that was left.' },
  { key:'gallery', name:'Theme gallery — the six layouts left', per:20, premise:'Gradient Wave, Ticket Stub, HUD Tech, Band Knockout, Arc Crown, Glass Card: twenty variations each, the ten layouts before them are done (97 kept).' },
  { key:'assets', name:'Asset library — 464 cutouts, never reviewed', per:64, premise:'Every current product cutout in the library, eight across. Approve the ones worth keeping in the pools; the blanks and the ones that lost detail to background removal are the ones to leave.' },
];
const cards = [
  ...set4.map(c => ({ sec:'set4', id:c.id, name:c.name, cat:c.cat, src:c.src })),
  ...set5.slice(475).map(c => ({ sec:'set5', id:c.id, name:c.name, cat:c.cat, src:c.src })),
  ...gallery.map(c => ({ sec:'gallery', id:c.id, name:(NAMES[c.gal] || c.gal) + ' · ' + c.name.split(' · ')[0], cat:c.cat, src:c.src })),
  ...assets.map(c => ({ sec:'assets', id:c.id, name:c.id, cat:c.cat, src:c.src })),
];
/* re-encode the template thumbnails small (the asset thumbs already are) */
const S = 224, Q = 0.62;
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox'], protocolTimeout: 0 });
const page = await browser.newPage(); await page.goto('about:blank');
for (let i = 0; i < cards.length; i += 40){
  const batch = cards.slice(i, i + 40).filter(c => c.sec !== 'assets');
  if (!batch.length) continue;
  const out = await page.evaluate(async (batch, S, Q) => {
    const res = [];
    for (const c of batch){
      const img = await new Promise(r => { const el = new Image(); el.onload = () => r(el); el.onerror = () => r(null); el.src = c.src; });
      if (!img){ res.push({ id: c.id, src: c.src }); continue; }
      const cv = document.createElement('canvas'); cv.width = S; cv.height = S;
      const g = cv.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, S, S);
      res.push({ id: c.id, src: cv.toDataURL('image/webp', Q) });
    }
    return res;
  }, batch, S, Q);
  out.forEach(o => { const c = cards.find(x => x.id === o.id && x.sec !== 'assets'); if (c) c.src = o.src; });
}
await browser.close();
const tpl = readFileSync(new URL('./master_page.html', import.meta.url).pathname, 'utf8');
const html = tpl.replace('/*__SECTIONS__*/', JSON.stringify(SECTIONS)).replace('/*__CARDS__*/', JSON.stringify(cards));
writeFileSync(ROOT + '.render/master.html', html);
const per = {}; cards.forEach(c => per[c.sec] = (per[c.sec] || 0) + 1);
console.log('master: ' + cards.length + ' cards · ' + JSON.stringify(per) + ' · ' + (html.length / 1048576).toFixed(1) + ' MB');
