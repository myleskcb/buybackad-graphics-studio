#!/usr/bin/env node
/* THE OFFER CARDS' LANDING STILLS (DESIGN-LAW 147; OPEN-ITEMS §BL).

   The landing drew every offer card it showed on a canvas as it loaded: eleven on the hero wall at
   448 pixels and ten on the gallery's first page at 320, each after its own photograph (1080-pixel
   JPEGs in assets/bg-offer), its product cut-outs and its faces had arrived. Measured 2026-11-19 on a
   phone in Lighthouse: about 2 of the landing's 3.3 seconds of blocking time, and 2.9 MB (grounds 1.2,
   cut-outs 1.0, faces 0.7). Nothing about those cards depends on the visitor: no area word is on any
   of them, the number is the card's own, and the landing applies no theme.

   So this draws each offer card once, in the landing itself, with the studio's own engine
   (ensureTplAssets, then renderThumb, the call getThumb makes), at the two sizes the landing shows,
   and writes the JPEG the canvas gives, byte for byte, to assets/offer-stills/<id>-448.jpg and
   <id>-320.jpg. assets/offer-stills/index.json lists each card with its signature (app.js
   scStillSig: the card as data and ASSET_REV). The landing shows a still only while its card is the
   one it was drawn from; a card changed since is drawn live, as before. Every offer card is drawn,
   the one gated card included (the Offer cards chip shows it), so a chip, Show more or a hand pick
   on the wall finds a still too.

   Draw again after changing offer-library.js, a face, a ground, a cut-out or the engine's render
   passes (buildLayer, alignPass, the tagline looks, mac-wallpapers.js's screens): the signature
   catches a card that changed as data, not a change in the code that draws it. --check does.

   usage:  python3 -m http.server 8899   (in the repo), then
           [GFX_BASE=http://127.0.0.1:8899/] [FABRIC_JS=/path/fabric.min.js] [PLAYWRIGHT_MODULE=...]
           node scripts/build_offer_stills.mjs            draw every offer card, write the stills and the index
           node scripts/build_offer_stills.mjs --check    draw every card and compare: exit 1 when a still is
                                                          missing, stale, or not the picture the engine draws
           --only of_a,of_b     those cards only;   --out <dir>   write there and leave assets/ alone
   Written 2026-11-19. */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const ROOT = new URL('../', import.meta.url).pathname;
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8899/').replace(/\/?$/, '/');
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const CHECK = process.argv.includes('--check');
const OUT = arg('--out') || ROOT + 'assets/offer-stills/';
const ONLY = (arg('--only') || '').split(',').filter(Boolean);
const SIZES = [448, 320];                 // the wall's (scBuildWall) and the gallery's (scClassicCard)
const dir = OUT.replace(/\/?$/, '/');
if (!CHECK) mkdirSync(dir, { recursive: true });
const indexFile = dir + 'index.json';
const index = existsSync(indexFile) ? JSON.parse(readFileSync(indexFile, 'utf8')) : { items: {} };

const b = await chromium.launch({ headless: true });
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
if (process.env.FABRIC_JS) await page.route(/fabric(\.min)?\.js$/, r => r.fulfill({ contentType: 'application/javascript', body: readFileSync(process.env.FABRIC_JS, 'utf8') }));
const errors = [];
page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
await page.goto(BASE, { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => typeof TEMPLATES !== 'undefined' && typeof renderThumb === 'function' && typeof ensureTplAssets === 'function'
  && typeof SHOWCASE !== 'undefined' && SHOWCASE.built, null, { timeout: 90000 });
await page.evaluate(() => document.fonts.ready);
const info = await page.evaluate(() => ({
  ids: TEMPLATES.filter(t => t.tag === 'offer').map(t => t.id),
  rev: typeof ASSET_REV !== 'undefined' ? ASSET_REV : null,
  sig: typeof scStillSig === 'function',
}));
const ids = ONLY.length ? info.ids.filter(id => ONLY.includes(id)) : info.ids;
if (!info.sig && !arg('--out')) { console.error('app.js has no scStillSig: this tree cannot use stills (draw with --out <dir> to keep the pictures only)'); process.exit(2); }

/* one card: its own pictures and faces in (and checked in: ensureTplAssets gives up after 7s), then the
   engine's picture at each size, as base64 JPEG */
const draw = id => page.evaluate(async ({ id, sizes }) => {
  const t = TEMPLATES.find(x => x.id === id);
  const ready = () => {
    const bgOk = !(t.bg && t.bg.type === 'image' && t.bg.src) || (TPL_BG_ELS[t.bg.src] && TPL_BG_ELS[t.bg.src].width > 0);
    const cuts = (t.layers || []).filter(l => l.kind === 'cutout' && l.props && l.props.src).map(l => l.props.src);
    const cutsOk = cuts.every(s => CUTOUT_ELS[s] && CUTOUT_ELS[s].width > 0);
    const faces = (t.layers || []).map(l => l.props && l.props.fontFamily ? (l.props.fontStyle === 'italic' ? 'italic ' : '') + (l.props.fontWeight || 400) + ' 24px "' + l.props.fontFamily + '"' : null).filter(Boolean);
    const facesOk = faces.every(f => document.fonts.check(f)) && [...new Set((t.layers || []).map(l => l.props && l.props.fontFamily).filter(Boolean))].every(f => [...document.fonts].some(ff => ff.family.replace(/^["']|["']$/g, '') === f && ff.status === 'loaded'));
    return { bgOk, cutsOk, facesOk, missing: [bgOk ? null : 'ground', cutsOk ? null : 'cut-out', facesOk ? null : 'face'].filter(Boolean) };
  };
  let r = null;
  for (let a = 0; a < 4; a++){ await ensureTplAssets(t); r = ready(); if (!r.missing.length) break; await new Promise(res => setTimeout(res, 1500)); }
  if (r.missing.length) return { id, error: 'not in after four tries: ' + r.missing.join(', ') };
  try { if (fabric.util.clearFabricFontCache) fabric.util.clearFabricFontCache(); } catch (e){}
  const out = { id, sig: typeof scStillSig === 'function' ? scStillSig(t) : null, jpg: {} };
  for (const px of sizes) out.jpg[px] = renderThumb(t, px).split(',')[1];
  return out;
}, { id, sizes: SIZES });

/* how far two JPEGs are apart, decoded: the mean difference a channel, and the share of pixels any of
   whose channels is more than 32 apart */
const compare = (a, c) => page.evaluate(async ({ a, c }) => {
  const dec = async s => { const bm = await createImageBitmap(await (await fetch('data:image/jpeg;base64,' + s)).blob()); const cv = new OffscreenCanvas(bm.width, bm.height); const x = cv.getContext('2d'); x.drawImage(bm, 0, 0); return x.getImageData(0, 0, bm.width, bm.height); };
  const A = await dec(a), C = await dec(c);
  if (A.width !== C.width || A.height !== C.height) return { mean: 255, far: 1, size: A.width + 'x' + A.height + ' vs ' + C.width + 'x' + C.height };
  let sum = 0, far = 0;
  for (let i = 0; i < A.data.length; i += 4){ let m = 0; for (let k = 0; k < 3; k++){ const d = Math.abs(A.data[i + k] - C.data[i + k]); sum += d; if (d > m) m = d; } if (m > 32) far++; }
  return { mean: sum / (A.data.length / 4 * 3), far: far / (A.data.length / 4) };
}, { a, c });

/* two drawings of the same card are not always the same bytes: the Floating and Detailed layouts
   came out up to 1.08 a channel apart on average from one run to the next (2026-11-19, 172 of 608
   pictures; most of it in the small cut-outs, as Chrome scales a large picture down), with at most
   0.05% of pixels more than 32 apart. A word, a colour or a face changed moves far more than that */
const sameCard = d => d.mean <= 2 && d.far <= 0.0025;

let rev = null;
try { rev = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim() + (execSync('git status --porcelain -- app.js offer-library.js mac-wallpapers.js', { cwd: ROOT }).toString().trim() ? '+changes' : ''); } catch (e){}
const items = {}, problems = [];
let same = 0, near = 0, n = 0;
const t0 = Date.now();
for (const id of ids){
  const r = await draw(id);
  n++;
  if (r.error){ problems.push(id + ': ' + r.error); continue; }
  items[id] = r.sig;
  if (CHECK){
    if (!index.items[id]) { problems.push(id + ': no still (not in index.json)'); continue; }
    if (index.items[id] !== r.sig) { problems.push(id + ': stale, the card changed since its still was drawn'); continue; }
    for (const px of SIZES){
      const f = dir + id + '-' + px + '.jpg';
      if (!existsSync(f)) { problems.push(id + ' ' + px + ': no file'); continue; }
      const have = readFileSync(f).toString('base64');
      if (have === r.jpg[px]) { same++; continue; }
      const d = await compare(have, r.jpg[px]);
      if (!sameCard(d)) problems.push(`${id} ${px}: not the picture the engine draws now (mean ${d.mean.toFixed(2)}, ${(d.far * 100).toFixed(2)}% of pixels far apart${d.size ? ', ' + d.size : ''})`);
      else near++;
    }
  } else {
    /* a still of the same card that comes out within noise of the one on disk is left as it is, so
       drawing again rewrites only what changed */
    for (const px of SIZES){
      const f = dir + id + '-' + px + '.jpg';
      if (existsSync(f) && index.items[id] === r.sig){
        const have = readFileSync(f).toString('base64');
        if (have === r.jpg[px] || sameCard(await compare(have, r.jpg[px]))) { same++; continue; }
      }
      writeFileSync(f, Buffer.from(r.jpg[px], 'base64'));
      near++;
    }
  }
  if (n % 40 === 0) console.log(`  ${n} of ${ids.length} (${Math.round((Date.now() - t0) / 1000)}s)`);
}

if (CHECK && !ONLY.length){
  const orphans = Object.keys(index.items).filter(id => !info.ids.includes(id));
  if (orphans.length) problems.push(`${orphans.length} stills for cards that are gone: ${orphans.slice(0, 5).join(', ')}`);
}
if (!CHECK && info.sig){
  const all = ONLY.length ? Object.assign({}, index.items, items) : items;
  /* a still of a card that is gone is removed with its line */
  if (!ONLY.length) for (const f of readdirSync(dir)) { const m = f.match(/^(.+)-(448|320)\.jpg$/); if (m && !all[m[1]]) unlinkSync(dir + f); }
  writeFileSync(indexFile, JSON.stringify({
    about: 'The offer cards as the landing shows them, drawn by scripts/build_offer_stills.mjs (DESIGN-LAW 147). A still is shown only while its card has this signature (app.js scStillSig).',
    drawn: new Date().toISOString().slice(0, 10), engine: rev, rev: info.rev, sizes: SIZES, items: all,
  }, null, 0).replace(/,"items":/, ',\n"items":').replace(/("of_[^"]+":"[^"]+",?)/g, '\n$1') + '\n');
}
await b.close();
if (errors.length) problems.push('page errors: ' + errors.slice(0, 3).join(' | '));
const secs = Math.round((Date.now() - t0) / 1000);
if (CHECK) console.log(`offer stills: ${n} cards drawn and compared in ${secs}s; ${same} files the same byte for byte, ${near} within a JPEG's noise`);
else console.log(`offer stills: ${Object.keys(items).length} of ${ids.length} cards drawn at ${SIZES.join(' and ')} into ${dir.replace(ROOT, '')} in ${secs}s; ${near} pictures written, ${same} left as they were (the same card)`);
if (problems.length){ console.log(problems.length + ' problem' + (problems.length > 1 ? 's' : '') + ':\n  ' + problems.slice(0, 40).join('\n  ')); process.exit(1); }
console.log(CHECK ? 'every still is the picture the engine draws' : 'done');
