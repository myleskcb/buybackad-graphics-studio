#!/usr/bin/env node
/* TAGLINE AUDIT: every family and category, in every tagline look the Studio
   offers (app.js EZ_TAG_LOOKS: the panel's looks, each with its own defaults),
   through the product's own path.

   The owner, 2026-09-27: "have it as a possibility in all possible templates
   so video elements could be possible in templates and vice versa so we don't
   have logic that only applies to one type of ad or worse, one type of
   category only".

   Per template it opens the card the way a visitor does (showEasy, or
   openShowcase for a showcase card), picks each look the way the Tagline
   style panel does (ez.tag), renders renderEzCanvas()'s scene and measures:
   - the critic (rule 54): the upper quartile of per-pixel contrast over the
     pixels each line changes, painted with and without it (and without the
     layers its look added: a glow, the red and blue offsets, the depth, which
     read as one mark with it); a line under 3:1
     fails, unless it was already under 3:1 as designed (that is the
     template's own finding);
   - whether the style took (touched), or fell back (blocks -> outline) and why;
   - the video: MOTION bakes the styled scene and frame 0 is compared with the
     still (mean channel difference; the video must open on the picture).
   Samples per family x category (--per N, default 2) or --ids a,b.

   usage: python3 -m http.server 8899   then
          CHROME=... [FABRIC_JS=...] node scripts/tagline_audit.mjs [--per 2] [--ids a,b] [--sheet] [--noholds]
   Writes .render/tagline-audit/{report.json, <id>.jpg (with --sheet: a strip of the styles)} */
import { mkdirSync, writeFileSync } from 'node:fs';
import { openStudio } from './_showcase_harness.mjs';

const argv = process.argv.slice(2), arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const PER = +arg('--per', 2), IDS = arg('--ids', '') ? arg('--ids', '').split(',') : null, SHEET = argv.includes('--sheet');
const Q = argv.includes('--noholds') ? '&noholds=1' : '';   // held templates too
const OUT = new URL('../.render/tagline-audit/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

let { browser, page, errors } = await openStudio(Q);
async function fresh(){
  await browser.close().catch(() => {});
  ({ browser, page, errors } = await openStudio(Q));
}
const pick = async () => page.evaluate(async (PER, IDS) => {
  const all = await scLoadIndex();
  const fam = t => t.tag === 'offer' ? 'offer' : t.tag === 'designer' ? 'designer' : t.tag === 'street' ? 'street' : 'classic:' + t.tag;
  if (IDS) return IDS.map(id => id.startsWith('sc-') ? { id, fam: 'showcase', cat: (SHOWCASE.byId[id.slice(3)] || {}).cat }
    : { id, fam: fam(TEMPLATES.find(t => t.id === id) || {}), cat: (TEMPLATES.find(t => t.id === id) || {}).cat });
  const out = [], seen = {};
  const take = (key, rec) => { seen[key] = (seen[key] || 0) + 1; if (seen[key] <= PER) out.push(rec); };
  // spread the picks over each group: every k-th member, not the first few
  const groups = {};
  TEMPLATES.filter(t => !/^sc-/.test(t.id) && !tplLocked(t)).forEach(t => { const k = fam(t) + '|' + t.cat; (groups[k] = groups[k] || []).push({ id: t.id, fam: fam(t), cat: t.cat }); });
  all.forEach(c => { const k = 'showcase|' + c.cat; (groups[k] = groups[k] || []).push({ id: 'sc-' + c.id, fam: 'showcase', cat: c.cat }); });
  Object.entries(groups).forEach(([k, list]) => { const step = Math.max(1, Math.floor(list.length / PER)); for (let i = 0; i < list.length; i += step) take(k, list[i]); });
  return out;
}, PER, IDS);
await page.evaluate(() => { loadAccount = async () => account; account = { email: 'audit@local', role: 'admin', plan: 'pro' }; });
const cards = await pick();
const STYLES = await page.evaluate(() => EZ_TAG_LOOKS.map(s => s[0]));
console.log('templates', cards.length, '× styles', STYLES.join(' '));

const rows = [];
for (const [n, c] of cards.entries()){
  if (n && n % 25 === 0){ await fresh(); await page.evaluate(() => { loadAccount = async () => account; account = { email: 'audit@local', role: 'admin', plan: 'pro' }; }); }
  const r = await page.evaluate(async (c, STYLES, SHEET) => {
    account = { email: 'audit@local', role: 'admin', plan: 'pro' };
    if (c.id.startsWith('sc-')){ await scLoadIndex(); await openShowcase(c.id.slice(3)); }
    else showEasy(c.id);
    if (ez.tpl !== c.id) throw new Error('opened ' + ez.tpl);
    await ensureTplAssets(ezTpl());
    $('ez-phone').value = '(562) 999-4994';
    await new Promise(r => setTimeout(r, 300));
    const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const lum = (d, k) => 0.2126 * lin(d[k]) + 0.7152 * lin(d[k + 1]) + 0.0722 * lin(d[k + 2]);
    const out = [], strip = [];
    for (const style of STYLES){
      ez.tag = Object.assign({}, ez.tag, { look: style, gradient: null, angle: 90, outline: 'auto', effect: 'auto', texture: 'money', patScale: 1, patX: 0, patY: 0 });
      const sc = renderEzCanvas(1080, 'png', undefined, undefined, 'square', true);
      const info = ez.tagInfo || {};
      const W = sc.width, H = sc.height, ctx = sc.lowerCanvasEl.getContext('2d');
      sc.renderAll();
      const full = ctx.getImageData(0, 0, W, H).data;
      const crit = [];
      // every line that is read (a style can darken a plate under a label as well as recolour the tagline)
      sc.getObjects().filter(o => o.visible !== false && (o.opacity == null || o.opacity >= 0.5) && /^(i-text|text|textbox)$/.test(o.type) && o.pgRole !== 'deco'
        && !/marquee|ticker/i.test(o.name || '') && /[A-Za-z0-9]/.test(o.text || '')).forEach(o => {
        const kin = sc.getObjects().filter(q => q.pgKin === o);
        const bs = [o].concat(kin).map(q => q.getBoundingRect(true, true));
        const b = { left: Math.min(...bs.map(r => r.left)), top: Math.min(...bs.map(r => r.top)) };
        b.width = Math.max(...bs.map(r => r.left + r.width)) - b.left; b.height = Math.max(...bs.map(r => r.top + r.height)) - b.top;
        const x0 = Math.max(0, Math.floor(b.left)), y0 = Math.max(0, Math.floor(b.top)), x1 = Math.min(W, Math.ceil(b.left + b.width)), y1 = Math.min(H, Math.ceil(b.top + b.height));
        if (x1 - x0 < 4 || y1 - y0 < 4) return;
        o.visible = false; kin.forEach(q => { q.visible = false; }); sc.renderAll();
        const w = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data; o.visible = true; kin.forEach(q => { q.visible = true; });
        const px = [];
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++){
          const f = (y * W + x) * 4, g = ((y - y0) * (x1 - x0) + (x - x0)) * 4;
          if (Math.abs(full[f] - w[g]) + Math.abs(full[f + 1] - w[g + 1]) + Math.abs(full[f + 2] - w[g + 2]) < 24) continue;
          const a = lum(full, f), q = lum(w, g); px.push((Math.max(a, q) + 0.05) / (Math.min(a, q) + 0.05));
        }
        px.sort((p, q) => p - q);
        crit.push({ role: o.pgRole, name: o.name, q75: px.length ? +px[Math.floor(px.length * 0.75)].toFixed(2) : 0 });
      });
      sc.renderAll();
      if (SHEET) strip.push(sc.toDataURL({ format: 'jpeg', quality: 0.8, multiplier: 300 / W }).split(',')[1]);
      // the video opens on this picture: MOTION bakes this scene, and its own frame-zero check compares t = 0 with the still
      let video = null;
      if (style !== 'solid'){
        const bake = motionBake(sc, W, H, 540, 540);
        const f0 = document.createElement('canvas'); f0.width = f0.height = 540;
        const fx = f0.getContext('2d', { willReadFrequently: true });
        const z = motionFrameZero(sc, bake, fx);
        video = { ok: z.ok, block: z.block, share: +z.share.toFixed(4), money: !!bake.rig.units.money, phone: !!bake.rig.units.phone };
        if (!z.ok){
          // where: the worst 8x8 block, and both pictures, to look at
          const a = fx.getImageData(0, 0, 540, 540).data, b = sc.lowerCanvasEl.getContext('2d').getImageData(0, 0, 540, 540).data;
          let worst = null;
          for (let y = 0; y < 540; y += 8) for (let x = 0; x < 540; x += 8){
            let d = 0; for (let yy = y; yy < y + 8; yy++) for (let xx = x; xx < x + 8; xx++){ const i = (yy * 540 + xx) * 4; d += Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2])); }
            if (!worst || d > worst.d) worst = { d, x, y };
          }
          video.at = [worst.x * 2, worst.y * 2];
          video.near = sc.getObjects().filter(o => { const r = o.getBoundingRect(true, true); return worst.x * 2 >= r.left - 8 && worst.x * 2 <= r.left + r.width + 8 && worst.y * 2 >= r.top - 8 && worst.y * 2 <= r.top + r.height + 8; }).map(o => o.name || o.type);
          video.still = sc.lowerCanvasEl.toDataURL('image/png').split(',')[1];
          video.frame = f0.toDataURL('image/png').split(',')[1];
        }
      }
      sc.dispose();
      out.push({ style, touched: info.touched || 0, fallback: info.fallback || null, why: info.why || null, error: info.error || null, crit, video, weak: (info.weak || []).length });
    }
    ez.tag = Object.assign({}, ez.tag, { look: 'solid', gradient: null, outline: 'auto', effect: 'auto' });
    return { out, strip };
  }, c, STYLES, SHEET).catch(e => ({ err: String(e && e.message || e) }));
  if (r.err){ console.log(`[${n + 1}/${cards.length}] ${c.id} ERROR ${r.err}`); rows.push(Object.assign({}, c, { err: r.err })); continue; }
  const base = {};
  (r.out.find(s => s.style === 'solid') || { crit: [] }).crit.forEach(k => { base[k.name] = k.q75; });
  const styles = r.out.map(s => {
    // a line fails when the style puts it under 3:1 and it read at 3:1 or better as designed
    const worse = s.crit.filter(k => k.q75 < 3 && (base[k.name] == null || base[k.name] >= 3));
    const video = s.video && !s.video.ok ? 'video frame 0 is not the picture (block ' + s.video.block + ')' : null;
    return Object.assign(s, { pass: !worse.length && !s.error && !video, worse: worse.map(k => k.name + ' ' + k.q75), videoFault: video });
  });
  if (SHEET && r.strip.length){
    writeFileSync(`${OUT}${c.id}.json`, JSON.stringify(r.strip));
  }
  styles.forEach(s => {
    if (!s.video || !s.video.still) return;
    writeFileSync(`${OUT}${c.id}-${s.style}-still.png`, Buffer.from(s.video.still, 'base64'));
    writeFileSync(`${OUT}${c.id}-${s.style}-frame0.png`, Buffer.from(s.video.frame, 'base64'));
    delete s.video.still; delete s.video.frame;
  });
  rows.push(Object.assign({}, c, { styles }));
  console.log(`[${n + 1}/${cards.length}] ${c.fam} ${c.cat} ${c.id}  ` + styles.map(s => `${s.style}${s.pass ? '' : ' FAIL(' + [s.error, s.videoFault].concat(s.worse).filter(Boolean).join('; ') + ')'}${s.fallback ? ' ->' + s.fallback : ''}${s.style !== 'solid' && !s.touched ? ' (untouched' + (s.why ? ': ' + s.why : '') + ')' : ''}`).join(' · '));
}
await browser.close();
const ok = rows.filter(r => !r.err);
const tally = STYLES.map(st => {
  const ss = ok.map(r => r.styles.find(s => s.style === st)).filter(Boolean);
  return { style: st, pass: ss.filter(s => s.pass).length, of: ss.length, fallback: ss.filter(s => s.fallback).length, untouched: st === 'solid' ? 0 : ss.filter(s => !s.touched).length };
});
const byFam = {};
ok.forEach(r => { const f = byFam[r.fam] || (byFam[r.fam] = { n: 0, fails: 0 }); f.n++; if (r.styles.some(s => !s.pass)) f.fails++; });
writeFileSync(OUT + 'report.json', JSON.stringify({ made: new Date().toISOString(), styles: STYLES, tally, byFam, rows }, null, 1));
console.log('\n' + tally.map(t => `${t.style}: ${t.pass}/${t.of} pass${t.fallback ? ', ' + t.fallback + ' fell back' : ''}${t.untouched ? ', ' + t.untouched + ' untouched' : ''}`).join(' · '));
console.log('by family: ' + Object.entries(byFam).map(([k, v]) => `${k} ${v.n - v.fails}/${v.n}`).join(' · '));
console.log('errors: ' + rows.filter(r => r.err).length + ' templates, page errors ' + errors.length + (errors.length ? ' ' + errors.slice(0, 3).join(' | ') : ''));
