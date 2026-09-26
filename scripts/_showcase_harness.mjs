/* Shared harness for the showcase audits and the refresh: one headless Chrome
 * on the local studio (python3 -m http.server 8899), plus page-side helpers
 * that load a showcase record the way openShowcase()/rethumb do and paint it
 * the way renderThumb() does, so every measurement is taken on the pixels a
 * visitor sees. */
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';
export const BASE = process.env.GFX_BASE || 'http://localhost:8899/';
/* A machine that cannot reach cdnjs (a sandbox, CI) can still run the audits:
 * FABRIC_JS=/path/to/fabric.min.js serves that file for the page's fabric
 * <script>, and every other off-origin request is aborted instead of left
 * hanging. CHROME=/path/to/chrome picks the browser. Unset, nothing changes. */
export async function offline(page){
  if (!process.env.FABRIC_JS) return;
  const fabricJs = readFileSync(process.env.FABRIC_JS);
  const origin = new URL(BASE).origin;
  await page.setRequestInterception(true);
  page.on('request', req => {
    const url = req.url();
    if (/\/fabric(\.min)?\.js(\?|$)/.test(url)) return req.respond({ status:200, contentType:'application/javascript', body:fabricJs });
    if (url.startsWith(origin) || url.startsWith('data:') || url.startsWith('blob:')) return req.continue();
    return req.abort();
  });
}
export async function openStudio(query = ''){
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless:'new', args:['--no-sandbox'], protocolTimeout:0 });
  const page = await browser.newPage();
  await page.setViewport({ width:1280, height:900 });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).slice(0, 160)));
  await offline(page);
  await page.goto(BASE + '?look=graphite-orchid' + query, { waitUntil:'networkidle2', timeout:120000 });
  await page.waitForFunction(() => typeof buildLayer === 'function' && typeof renderThumb === 'function' && typeof SHOWCASE !== 'undefined', { timeout:60000 });
  await page.evaluate(() => {
    window.__sc = {
      /* record -> template, every face, cutout and backdrop loaded */
      async prep(rec, id){
        const base = TEMPLATES.find(t => t.id === rec.base) || {};
        const t = Object.assign({}, base, rec.tpl, { id:'hx-' + id, name:id, cat:rec.tpl.cat });
        const fams = new Set(); (t.layers || []).forEach(l => { const f = l.props && l.props.fontFamily; if (f) fams.add(f); });
        const cuts = [...new Set((t.layers || []).filter(l => l.kind === 'cutout' && l.props && l.props.src).map(l => l.props.src))];
        const load = (src, store) => new Promise(r => { if (!src || (store[src] && store[src].width)) return r();
          const el = new Image(); el.onload = () => { store[src] = el; r(); }; el.onerror = () => r(); el.src = src; });
        await Promise.race([
          Promise.all([...fams].map(f => ensureFont(f).then(() => document.fonts.load('700 40px "' + f + '"').catch(() => {})))
            .concat(cuts.map(s => load(s, CUTOUT_ELS)), [load(t.bg && t.bg.src, TPL_BG_ELS)])),
          new Promise(r => setTimeout(r, 12000)),
        ]);
        try { fabric.util.clearFabricFontCache(); } catch (e){}
        return t;
      },
      async load(id){
        const rec = await fetch('assets/showcase/tpl/' + id + '.json', { cache:'no-store' }).then(r => r.json());
        return this.prep(rec, id);
      },
      /* renderThumb()'s own sequence, kept open so layers can be toggled */
      paint(t){
        const W = TPL_W, H = TPL_H;
        const sc = new fabric.StaticCanvas(null, { width:W, height:H, renderOnAddRemove:false });
        const bgi = t.bg.type === 'image' ? freshBgImage(t.bg.src, t.bg.blur, t.bg.grade) : null;
        if (bgi){
          sc.setBackgroundImage(coverImage(bgi, W, H), () => {});
          if (t.bg.scrim) sc.add(scrimRect(t.bg.scrim, W, H, t.bg.scrimColor, t.bg.scrimMode));
        } else sc.add(bgRectFor(t.bg.type === 'image' ? (t.bg.fallback || { type:'solid', c:'#101014' }) : t.bg, W, H));
        const refs = t.layers.map(l => { const o = buildLayer(l, t.id); sc.add(o); return o; });
        alignPass(sc, W, H);
        sc.renderAll();
        return { sc, refs, bgMissing: t.bg.type === 'image' && !bgi };
      },
    };
  });
  return { browser, page, errors };
}
