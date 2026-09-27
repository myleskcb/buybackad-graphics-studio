#!/usr/bin/env node
/* TAGLINE LAB — the same card in each tagline style (app.js taglineStyle),
   through Easy Mode's own render, measured the way the library is measured.

   Owner, 2026-09-27: "who said the main tagline had to be one color? why not
   patterns, gradients, or color blocking?", "My favorite ads kept a cohesive
   gradient on assets", "We can also do white with black outline?"

   Per card and style it records the critic's measure (rule 54: the upper
   quartile of per-pixel contrast over the pixels a line changes, painted with
   and without it) for the tagline, the number and the CTA line, and for the
   blocks style whether a block lands on other copy or leaves the 6% guides.
   Square, the design format.

   usage: npx http-server -p 8899 -s .   then
          CHROME=... node scripts/tagline_lab/render.mjs [--ids a,b] [--px 540] [--append]
   Writes .render/tagline/{manifest.json, <id>-<style>.jpg}. */
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.GFX_BASE || 'http://localhost:8899/';
const argv = process.argv.slice(2), arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const IDS = arg('--ids', '') ? arg('--ids', '').split(',') : null, PX = +arg('--px', 540);
const STYLES = ['solid', 'street', 'gradient', 'outline', 'blocks', 'pair', 'pattern'];
const OUT = new URL('../../.render/tagline/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const fab = process.env.FABRIC_JS ? readFileSync(process.env.FABRIC_JS) : null;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--force-color-profile=srgb'] });
const errors = [];
let page = null;
async function freshPage(){
  if (page) await page.close().catch(() => {});
  page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  page.on('pageerror', e => errors.push(String(e)));
  if (fab){
    await page.setRequestInterception(true);
    page.on('request', q => { const u = q.url();
      if (/fabric(\.min)?\.js/.test(u) && !u.startsWith(BASE)) q.respond({ status: 200, contentType: 'application/javascript', body: fab });
      else if (!u.startsWith(BASE) && !u.startsWith('data:') && !u.startsWith('blob:')) q.abort(); else q.continue(); });
  }
  await page.goto(BASE, { waitUntil: 'load', timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 5000));
  // no backend: pin an operator stub, or premium cards open as a free one (rule 67)
  await page.evaluate(() => { loadAccount = async () => account; account = { email: 'lab@local', role: 'admin', plan: 'pro' }; });
}
await freshPage();
const cards = await page.evaluate(async (IDS) => {
  const all = await scLoadIndex(); await scLoadPicks();
  if (IDS) return IDS.map(id => SHOWCASE.byId[id]).filter(Boolean).map(c => ({ id: c.id, name: c.name, cat: c.cat }));
  const picked = scPickedCards(all), have = new Set(picked.map(c => c.cat)), extra = [];
  all.forEach(c => { if (!have.has(c.cat)){ have.add(c.cat); extra.push(c); } });
  return picked.concat(extra).map(c => ({ id: c.id, name: c.name, cat: c.cat, hero: picked.indexOf(c) >= 0 }));
}, IDS);
console.log('cards', cards.length, '× styles', STYLES.length);

const rows = [];
for (const [n, c] of cards.entries()){
  if (n && n % 6 === 0) await freshPage();
  const r = await page.evaluate(async (c, STYLES, PX) => {
    await openShowcase(c.id);
    if (ez.tpl !== 'sc-' + c.id) throw new Error('opened ' + ez.tpl);
    $('ez-phone').value = '(562) 999-4994';
    for (let i = 0, t = ezTpl(); i < 60; i++){
      const src = t.bg && t.bg.type === 'image' && t.bg.src;
      const cuts = (t.layers || []).filter(l => l.kind === 'cutout' && l.props && l.props.src).map(l => l.props.src);
      if ((!src || (TPL_BG_ELS[src] && TPL_BG_ELS[src].width)) && cuts.every(s => CUTOUT_ELS[s])) break;
      await new Promise(r => setTimeout(r, 100));
    }
    await new Promise(r => setTimeout(r, 400));
    const rec = SHOWCASE.byId[c.id], pal = { accent: rec.accent, support: rec.support, ink: rec.ink, c1: rec.c1 };
    const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const lum = (d, k) => 0.2126 * lin(d[k]) + 0.7152 * lin(d[k + 1]) + 0.0722 * lin(d[k + 2]);
    const out = [];
    for (const style of STYLES){
      const sc = renderEzCanvas(1080, 'png', undefined, undefined, 'square', true);
      const W = sc.width, H = sc.height;
      const info = taglineStyle(sc, style, pal, W, H);
      plateAir(sc, W, H);
      sc.renderAll();
      const ctx = sc.lowerCanvasEl.getContext('2d'), full = ctx.getImageData(0, 0, W, H).data;
      // the critic (rule 54), per critical line
      const crit = [];
      sc.getObjects().filter(o => o.visible !== false && ['headline', 'phone', 'cta'].includes(o.pgRole) && /[A-Za-z0-9]/.test(o.text || '')).forEach(o => {
        const b = o.getBoundingRect(true, true);
        const x0 = Math.max(0, Math.floor(b.left)), y0 = Math.max(0, Math.floor(b.top)), x1 = Math.min(W, Math.ceil(b.left + b.width)), y1 = Math.min(H, Math.ceil(b.top + b.height));
        if (x1 - x0 < 4 || y1 - y0 < 4) return;
        o.visible = false; sc.renderAll();
        const w = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data; o.visible = true;
        const px = [];
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++){
          const f = (y * W + x) * 4, g = ((y - y0) * (x1 - x0) + (x - x0)) * 4;
          if (Math.abs(full[f] - w[g]) + Math.abs(full[f + 1] - w[g + 1]) + Math.abs(full[f + 2] - w[g + 2]) < 24) continue;
          const a = lum(full, f), q = lum(w, g); px.push((Math.max(a, q) + 0.05) / (Math.min(a, q) + 0.05));
        }
        px.sort((p, q) => p - q);
        crit.push({ role: o.pgRole, text: String(o.text).slice(0, 28), q75: px.length ? +px[Math.floor(px.length * 0.75)].toFixed(2) : 0 });
      });
      sc.renderAll();
      // blocks: on other copy, or outside the 6% guides
      const faults = [];
      const G = 0.06 * Math.min(W, H);
      sc.getObjects().filter(o => /^Tagline Block/.test(o.name || '')).forEach(bk => {
        const b = bk.getBoundingRect(true, true);
        if (b.left < G - 2 || b.top < G - 2 || b.left + b.width > W - G + 2 || b.top + b.height > H - G + 2) faults.push(bk.name + ' leaves the guides');
        sc.getObjects().filter(o => o !== bk && o.visible !== false && (o.type === 'i-text' || o.type === 'textbox' || o.type === 'text') && o.pgRole !== 'headline').forEach(o => {
          const t = o.getBoundingRect(true, true);
          const ix = Math.max(0, Math.min(b.left + b.width, t.left + t.width) - Math.max(b.left, t.left));
          const iy = Math.max(0, Math.min(b.top + b.height, t.top + t.height) - Math.max(b.top, t.top));
          if (ix * iy > 0.03 * Math.min(b.width * b.height, t.width * t.height)) faults.push(bk.name + ' on ' + (o.name || o.pgRole));
        });
      });
      const url = sc.toDataURL({ format: 'jpeg', quality: 0.86, multiplier: PX / W });
      sc.dispose();
      const head = crit.filter(k => k.role === 'headline'), num = crit.find(k => k.role === 'phone');
      out.push({ style, info, crit, faults, img: url.split(',')[1],
        tagline: head.length ? Math.min(...head.map(k => k.q75)) : null, number: num ? num.q75 : null,
        worst: crit.length ? Math.min(...crit.map(k => k.q75)) : null });
    }
    return out;
  }, c, STYLES, PX).catch(e => ({ err: String(e && e.message || e) }));
  if (r.err){ console.log(`[${n + 1}/${cards.length}] ${c.id} ERROR ${r.err}`); continue; }
  const styles = r.map(s => {
    writeFileSync(`${OUT}${c.id}-${s.style}.jpg`, Buffer.from(s.img, 'base64'));
    const pass = s.worst != null && s.worst >= 3 && !s.faults.length;
    return { style: s.style, img: `${c.id}-${s.style}.jpg`, tagline: s.tagline, number: s.number, worst: s.worst, faults: s.faults, pass, touched: s.info.touched };
  });
  rows.push(Object.assign({}, c, { styles }));
  console.log(`[${n + 1}/${cards.length}] ${c.id}  ` + styles.map(s => `${s.style} ${s.pass ? 'ok' : 'FAIL'} ${s.worst}${s.faults.length ? ' (' + s.faults.join('; ') + ')' : ''}`).join(' · '));
}
// --append adds these cards to an earlier run's manifest (replacing any with the same id)
let all = rows;
if (argv.includes('--append')){
  try { const prev = JSON.parse(readFileSync(OUT + 'manifest.json', 'utf8')).cards || []; all = prev.filter(c => !rows.some(r => r.id === c.id)).concat(rows); } catch (e){}
}
writeFileSync(OUT + 'manifest.json', JSON.stringify({ made: new Date().toISOString(), styles: STYLES, px: PX, cards: all }, null, 1));
const tally = STYLES.map(st => `${st} ${rows.filter(c => (c.styles.find(s => s.style === st) || {}).pass).length}/${rows.length}`);
console.log('\npass (critic 3:1 on every critical line, no block faults): ' + tally.join(' · ') + ' · page errors ' + errors.length);
await browser.close();
