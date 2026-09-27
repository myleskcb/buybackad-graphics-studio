#!/usr/bin/env node
/* SUPPLY A REAL BACKGROUND, and the URL line, where a card has neither.
 *
 * 198 live cards sit on a ground the engine DREW — a slab, a cast, an abstract
 * — rather than a photograph of the thing being bought. On a phone that reads
 * as a card whose background failed to load, which is what the owner has been
 * seeing. Every category has 18-20 real photographs in assets/bg (dl_<cat>_*)
 * plus the web pool, so there is no reason for any card to go without one.
 *
 * The photograph is TONED with the card's own ground colour behind a heavy
 * scrim — the same treatment the lab gives a busy picture — so the palette the
 * card was designed in survives and the small copy stays readable. Geometry is
 * untouched, so this cannot introduce a new overlap.
 *
 * The URL is the second half: 286 live cards carry no website line at all. One
 * is added at the foot, but only where the foot is genuinely clear, so fixing
 * the URL cannot create the collision problem that was just fixed.
 *
 * usage: node scripts/supply_backgrounds.mjs [--write]
 */
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname;
const WRITE = process.argv.includes('--write');
const idx = JSON.parse(readFileSync(ROOT + 'assets/showcase/index.json', 'utf8'));

const bgDir = readdirSync(ROOT + 'assets/bg').filter(f => /\.jpe?g$/i.test(f));
const webDir = existsSync(ROOT + 'assets/bg-web') ? readdirSync(ROOT + 'assets/bg-web').filter(f => /\.jpe?g$/i.test(f)) : [];
const WEB_ALIAS = { cars:['cars','trucks','vans','bikes'], phones:['phones','macbook'], gold:['gold','cash'],
  silver:['silver'], coins:['coins'], strips:['strips'], pokemon:['pokemon'], sports:[] };
function pool(cat){
  const a = bgDir.filter(f => f.startsWith('dl_' + cat + '_')).map(f => 'assets/bg/' + f);
  const b = (WEB_ALIAS[cat] || []).flatMap(p => webDir.filter(f => f.startsWith(p + '-')).map(f => 'assets/bg-web/' + f));
  return a.concat(b);
}
const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

const live = idx.filter(c => !c.defect && c.imagery !== 'none' && (c.chroma === undefined || c.chroma >= 0.05));
const targets = [];
live.forEach(c => {
  const rec = JSON.parse(readFileSync(ROOT + 'assets/showcase/tpl/' + c.id + '.json', 'utf8'));
  const src = String((rec.tpl.bg || {}).src || '');
  const drawn = src.includes('/showcase/bg/');
  const noUrl = !rec.tpl.layers.some(l => l.role === 'website' && typeof l.text === 'string' && l.text.trim());
  if (drawn || noUrl) targets.push({ id: c.id, cat: c.cat, c1: c.c1, ink: c.ink, drawn: process.env.URL_ONLY ? false : drawn, noUrl });
});
console.log('candidates: ' + targets.length + ' (' + targets.filter(t => t.drawn).length + ' need a photo, ' + targets.filter(t => t.noUrl).length + ' need a URL)');

const browser = await puppeteer.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:'new', args:['--no-sandbox'], protocolTimeout: 0 });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
await page.goto('http://localhost:8899/', { waitUntil:'networkidle2', timeout: 90000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => typeof buildLayer === 'function' && typeof alignPass === 'function', { timeout: 30000 });

const out = {};
for (let i = 0; i < targets.length; i += 8){
  const batch = targets.slice(i, i + 8).map(t => Object.assign({}, t, { pool: pool(t.cat), seed: hash(t.id) }));
  const res = await page.evaluate(async batch => {
    const R = {};
    for (const job of batch){
      try {
        const rec = await fetch('assets/showcase/tpl/' + job.id + '.json').then(r => r.json());
        const layers = rec.tpl.layers;
        let did = [];
        if (job.drawn && job.pool.length){
          const src = job.pool[job.seed % job.pool.length];
          /* the card's OWN ground colour over the photograph, heavily, so the
             palette it was designed in survives and small copy still reads */
          rec.tpl.bg = Object.assign({}, rec.tpl.bg, { type:'image', src, blur: 0,
            scrim: 0.62, scrimColor: job.c1, scrimMode: 'normal', grade: { treat: 'tone' } });
          did.push('photo');
        }
        if (job.noUrl){
          const fams = new Set(); layers.forEach(l => { const f = l.props && l.props.fontFamily; if (f) fams.add(f); });
          await Promise.race([ Promise.all([...fams].map(f => ensureFont(f))), new Promise(r => setTimeout(r, 6000)) ]);
          const sc = new fabric.StaticCanvas(null, { width: TPL_W, height: TPL_H, renderOnAddRemove:false });
          const objs = layers.map(l => { let o = null; try { o = buildLayer(l, 'sb'); } catch(e){} if (o) sc.add(o); return o; });
          alignPass(sc, TPL_W, TPL_H);
          /* only WORDS and PRODUCTS are obstacles. A vignette, a grain layer, a
             full-width plate or the backdrop scrim all span the card, and counting
             them meant no foot was ever "clear" — zero URLs were added on the
             first run. */
          const boxes = objs.map((o, k) => {
            const l = layers[k];
            if (!o) return null;
            const isWord = typeof l.text === 'string' && l.text.trim();
            const isCut = l.kind === 'cutout' && !l.__wall;
            return (isWord || isCut) ? o.getBoundingRect(true, true) : null;
          });
          const face = (layers.find(l => l.role === 'phone') || {}).props || {};
          /* the lowest free band that can hold a small line */
          const H = 30, Wd = 420;
          let y = null;
          for (let cand = 1042; cand >= 900; cand -= 6){
            const box = { left: (TPL_W - Wd) / 2, top: cand - H, width: Wd, height: H };
            const clash = boxes.some(b => b && typeof b.left === 'number'
              && b.left < box.left + box.width && b.left + b.width > box.left
              && b.top < box.top + box.height && b.top + b.height > box.top);
            if (!clash){ y = cand - H; break; }
          }
          sc.dispose();
          if (y !== null){
            layers.push({ kind:'text', name:'Website', role:'website', casing:'none', text:'iphones.LA',
              props:{ left: TPL_W / 2, top: y, originX:'center', fontFamily: face.fontFamily || 'Satoshi',
                      fontSize: 26, fill: job.ink, opacity: 0.92, charSpacing: 40, fontWeight:'600' } });
            did.push('url');
          }
        }
        R[job.id] = did.length ? { did, rec } : { skip:'nothing to do' };
      } catch(e){ R[job.id] = { skip: String(e).slice(0, 70) }; }
    }
    return R;
  }, batch);
  Object.assign(out, res);
  if (i % 80 === 0) console.log('…' + (i + batch.length) + '/' + targets.length);
}
await browser.close();
let photo = 0, url = 0, skip = 0;
Object.entries(out).forEach(([id, r]) => {
  if (r.skip){ skip++; return; }
  if (r.did.includes('photo')) photo++;
  if (r.did.includes('url')) url++;
  if (WRITE) writeFileSync(ROOT + 'assets/showcase/tpl/' + id + '.json', JSON.stringify(r.rec));
});
console.log('\nphotograph supplied: ' + photo + ' · URL added: ' + url + ' · skipped: ' + skip);
console.log(WRITE ? 'records rewritten' : '(dry run; pass --write)');
