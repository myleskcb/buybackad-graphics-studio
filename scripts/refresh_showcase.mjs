#!/usr/bin/env node
/* THE 2026-09-22 REFRESH — new palettes, new faces, a real duotone, re-baked.
 *
 * Works on the FINISHED showcase records (assets/showcase/tpl/*.json), not on
 * the lab: every one of them has already passed the overlap and content gates,
 * so their geometry is kept and only their skin changes.
 *
 *   colour   refresh_palettes.mjs — balanced palette assignment, luminance-locked
 *            recolour of every colour in the record, grey+veil photo -> duotone
 *   type     refresh_palettes.mjs — the face each card had maps to one of seven
 *            vendored OFL faces with the same voice; then, IN THE STUDIO, the
 *            new line is sized so it is no wider and no taller than the old
 *            one was (so nothing new can collide or leave the card)
 *   bake     renderThumb() at 1080, re-encoded to a 448px webp — the studio's
 *            own painter, so the card shown is the card that opens
 *
 * Idempotent from git: it reads the records as committed at REFRESH_FROM
 * (default HEAD) so a re-run starts from the original library, not from its
 * own output.
 *
 *   node scripts/refresh_showcase.mjs            (needs :8899 and Chrome)
 *   REFRESH_ONLY=ids.json node scripts/refresh_showcase.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { openStudio } from './_showcase_harness.mjs';
import { rewriteCopy, deckOfHeadline, fixForeignLines, foreignWords, COMPANY, LICENSE } from './refresh_copy.mjs';
import { PALETTES, assign, mapper, walkColours, duoFor, displayFace, numFace, SUPPORT_FACE, snapWeight, parse, lumOf, toOklch } from './refresh_palettes.mjs';
const ROOT = new URL('../', import.meta.url).pathname;
const DIR = ROOT + 'assets/showcase/';
const FROM = process.env.REFRESH_FROM || 'HEAD';
const git = p => execFileSync('git', ['show', FROM + ':' + p], { cwd:ROOT, maxBuffer:1 << 26 }).toString();
const idx = JSON.parse(git('assets/showcase/index.json'));
const ONLY = process.env.REFRESH_ONLY ? new Set(JSON.parse(readFileSync(process.env.REFRESH_ONLY, 'utf8'))) : null;
/* the most common supporting line per deck and role, read off the library,
   for replacing a line that lists another deck's goods */
const DEFAULTS = (() => {
  const count = {};
  for (const c of idx){
    const rec = JSON.parse(git('assets/showcase/tpl/' + c.id + '.json'));
    if (deckOfHeadline(rec.tpl, c.cat) !== c.cat) continue;
    (rec.tpl.layers || []).forEach(l => {
      if (typeof l.text !== 'string' || !l.text.trim() || /^(headline|website|phone|deco)$/.test(l.role || 'deco')) return;
      if (foreignWords(c.cat, l.text).length || COMPANY.test(l.text) || LICENSE.test(l.text)) return;
      const k = c.cat + '|' + l.role; (count[k] = count[k] || {})[l.text] = (count[k][l.text] || 0) + 1;
    });
  }
  const out = {}; for (const k in count) out[k] = Object.entries(count[k]).sort((a, b) => b[1] - a[1])[0][0];
  return out;
})();
const COPYLOG = [];
/* decks first: a card moves to the deck its headline sells, BEFORE palettes
   are assigned, so category affinity applies to the right deck */
for (const c of idx){
  const rec = JSON.parse(git('assets/showcase/tpl/' + c.id + '.json'));
  const nc = deckOfHeadline(rec.tpl, c.cat);
  if (nc !== c.cat){ COPYLOG.push(c.id + ': deck ' + c.cat + ' -> ' + nc); c.cat = nc; }
}
const plan = assign(idx);
const LAYOUT_NAME = c => String(c.name || '').split(' · ').slice(1).join(' · ') || c.layout;

function refreshRecord(c){
  const rec = JSON.parse(git('assets/showcase/tpl/' + c.id + '.json'));
  const pal = plan[c.id];
  const map = mapper(pal, c);
  const oldBg = rec.tpl.bg || {};
  const oldText = (rec.tpl.layers || []).map(l => l.text);
  const tpl = walkColours(rec.tpl, map);
  tpl.cat = c.cat;
  rewriteCopy(tpl, c.cat).concat(fixForeignLines(tpl, c.cat, DEFAULTS)).forEach(x => COPYLOG.push(c.id + ': ' + x.replace(/\n/g, '/')));
  /* the photograph */
  const bg = tpl.bg || {};
  const treat = oldBg.grade && oldBg.grade.treat;
  const drawn = /showcase\/bg\//.test(oldBg.src || '');
  if (bg.type === 'image' && (oldBg.scrimMode || 'normal') === 'normal' && (treat === 'tone' || (drawn && treat === 'natural'))){
    const duo = duoFor(pal, oldBg.scrimColor || '#808080', +oldBg.scrim || 0);
    bg.grade = { treat:'duo', lo:duo.lo, hi:duo.hi };
    bg.scrim = 0;
  }
  /* the type */
  const f = c.faces || {};
  const disp = displayFace(f.display, c.cat);
  const num = numFace(f.num, disp, f.display);
  const faces = { display:disp, support:SUPPORT_FACE, num, style:f.style };
  (tpl.layers || []).forEach((l, k) => {
    const p = l.props; if (!p || !p.fontFamily || typeof l.text !== 'string') return;
    if (l.role === 'deco' && !/[a-z0-9]/i.test(l.text)) return;       // a ✓ or a ★ keeps the face that draws it
    const old = p.fontFamily;
    let nf;
    if (old === f.display) nf = disp;
    else if (old === f.num && l.role === 'phone') nf = num;
    else if (old === f.support) nf = SUPPORT_FACE;
    else if (old === f.num) nf = num;
    else nf = /^(headline|offer)$/.test(l.role) ? displayFace(old, c.cat) : SUPPORT_FACE;
    l.__from = { text:oldText[k], props:{ fontFamily:old, fontWeight:p.fontWeight, fontSize:p.fontSize, fontStyle:p.fontStyle } };
    p.fontFamily = nf;
    p.fontWeight = snapWeight(nf, p.fontWeight);
    if (p.fontStyle === 'italic' && /Gloock|Young Serif|Tilt Warp/.test(nf)) p.fontStyle = 'normal';  // no italic files: no faux slant
  });
  tpl.bg = bg;
  const roles = { c1:map(c.c1), ink:map(c.ink), accent:map(c.accent), support:map(c.support) };
  return { rec:Object.assign({}, rec, { tpl }), pal, faces, roles };
}

/* family = what the ground actually is now, measured, not a generator's name */
function familyOf(c1, pal){
  const p = parse(c1) || { r:0, g:0, b:0 }, Y = lumOf(p), C = toOklch(p).C;
  if (pal.neutral || (Y > 0.6 && C < 0.03)) return 'Studio';
  if (Y < 0.08) return 'Deep';
  if (Y > 0.45) return 'Sorbet';
  return 'Poster';
}

const work = ONLY ? idx.filter(c => ONLY.has(c.id)) : idx;
const { browser, page, errors } = await openStudio();
let n = 0, bytes = 0; const fails = [], shrink = [];
for (let i = 0; i < work.length; i += 6){
  const batch = work.slice(i, i + 6).map(c => ({ c, r:refreshRecord(c) }));
  const res = await page.evaluate(async items => {
    const out = [];
    for (const { id, rec } of items){
      try {
        /* fit: the new line may be no wider and no taller than the old one */
        const olds = new Set(['Sofia Sans Extra Condensed']); rec.tpl.layers.forEach(l => { if (l.__from) olds.add(l.__from.props.fontFamily); });
        await Promise.race([Promise.all([...olds].map(f => ensureFont(f).then(() => document.fonts.load('700 40px "' + f + '"').catch(() => {})))), new Promise(r => setTimeout(r, 9000))]);
        const t = await __sc.prep(rec, id);
        const scales = [];
        t.layers.forEach((l, k) => {
          if (!l.__from) return;
          const was = JSON.parse(JSON.stringify(l));
          Object.assign(was.props, l.__from.props); was.text = l.__from.text;   // the old words in the old face: the slot the line must fit
          let a = null, b = null;
          try { a = buildLayer(was, t.id); b = buildLayer(l, t.id); } catch (e){}
          /* a wide face that would have to shrink a headline below 72% of its
             slot loses the scale the ad is built on: set it condensed instead */
          if (a && b && l.role === 'headline' && Math.min(a.width / b.width, a.height / b.height) < 0.72 && !/Condensed|Big Shoulders/.test(l.props.fontFamily)){
            const alt = JSON.parse(JSON.stringify(l)); alt.props.fontFamily = 'Sofia Sans Extra Condensed'; alt.props.fontWeight = Math.max(700, +l.props.fontWeight || 700);
            let c = null; try { c = buildLayer(alt, t.id); } catch (e){}
            if (c && c.width > 0 && Math.min(a.width / c.width, a.height / c.height) > Math.min(a.width / b.width, a.height / b.height)){
              l.props.fontFamily = alt.props.fontFamily; l.props.fontWeight = alt.props.fontWeight; b = c; }
          }
          if (a && b && b.width > 0 && b.height > 0){
            const s = Math.min(a.width / b.width, a.height / b.height, 1.12);
            if (isFinite(s) && s > 0){ l.props.fontSize = Math.round(l.props.fontSize * s * 10) / 10; scales.push([l.role, +s.toFixed(3)]); }
          }
          delete l.__from;
        });
        rec.tpl.layers = t.layers.map(l => { const z = Object.assign({}, l); delete z.__from; return z; });
        try { fabric.util.clearFabricFontCache(); } catch (e){}
        const jpg = renderThumb(t, 1080);
        const img = await new Promise(r => { const el = new Image(); el.onload = () => r(el); el.onerror = () => r(null); el.src = jpg; });
        const cv = document.createElement('canvas'); cv.width = cv.height = 448;
        const g = cv.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, 448, 448);
        out.push({ id, rec, scales, webp:cv.toDataURL('image/webp', 0.74) });
      } catch (e){ out.push({ id, err:String(e).slice(0, 100) }); }
    }
    return out;
  }, batch.map(x => ({ id:x.c.id, rec:x.r.rec })));
  res.forEach((r, k) => {
    const { c, r:meta } = batch[k];
    if (r.err){ fails.push(c.id + ' ' + r.err); return; }
    writeFileSync(DIR + 'tpl/' + c.id + '.json', JSON.stringify(r.rec));
    const buf = Buffer.from(r.webp.split(',')[1], 'base64'); writeFileSync(DIR + c.id + '.webp', buf); bytes += buf.length; n++;
    r.scales.forEach(([role, s]) => shrink.push({ id:c.id, role, s }));
    Object.assign(c, meta.roles, { theme:meta.pal.name, family:familyOf(meta.roles.c1, meta.pal), faces:meta.faces,
      name:meta.pal.name + ' · ' + LAYOUT_NAME(c) });
    const tr = r.rec.tpl.bg && r.rec.tpl.bg.grade && r.rec.tpl.bg.grade.treat; if (tr) c.treat = tr;
    delete c.defect;
  });
  if (i % 120 === 0) console.log('…' + (i + batch.length) + '/' + work.length);
}
await browser.close();
if (!ONLY) writeFileSync(DIR + 'index.json', JSON.stringify(idx));
else {
  const cur = JSON.parse(readFileSync(DIR + 'index.json', 'utf8')); const by = Object.fromEntries(work.map(c => [c.id, c]));
  writeFileSync(DIR + 'index.json', JSON.stringify(cur.map(c => by[c.id] || c)));
}
writeFileSync(ROOT + '.render/refresh-scales.json', JSON.stringify(shrink));
writeFileSync(ROOT + '.render/refresh-copy.log', COPYLOG.join('\n'));
console.log('copy changes: ' + COPYLOG.length + ' lines on ' + new Set(COPYLOG.map(x => x.split(':')[0])).size + ' cards (.render/refresh-copy.log)');
const hs = shrink.filter(x => x.role === 'headline').map(x => x.s).sort((a, b) => a - b);
console.log('refreshed ' + n + '/' + work.length + ' · ' + (bytes / 1048576).toFixed(1) + ' MB thumbs · failed ' + fails.length + ' · page errors ' + errors.length);
if (hs.length) console.log('headline size factor: min ' + hs[0] + ' p10 ' + hs[Math.floor(hs.length * 0.1)] + ' median ' + hs[Math.floor(hs.length / 2)] + ' max ' + hs[hs.length - 1]);
const use = {}; work.forEach(c => { use[c.theme] = (use[c.theme] || 0) + 1; });
console.log('palettes used: ' + Object.keys(use).length + ' of ' + PALETTES.length);
if (fails.length) console.log(fails.slice(0, 8).join('\n'));
if (errors.length) console.log(errors.slice(0, 5).join('\n'));
