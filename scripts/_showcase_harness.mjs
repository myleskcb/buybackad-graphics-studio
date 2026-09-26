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
          const el = new Image(); el.onload = () => { store[src] = el; r(); }; el.onerror = () => r();
          /* the first classics' photographs ship inside tplbg-data.js, not as files */
          el.src = (store === TPL_BG_ELS && window.TPL_BG_DATA && TPL_BG_DATA[src]) || src; });
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
      /* THE NEUTRAL GROUND (scripts/naturalize_showcase.mjs, naturalize_classics.mjs).
         The photograph without its colour grade (o.grade), under a scrim that
         is near-black under light ink or near-white under dark ink, never a
         tint, its strength solved on the card's own pixels. Every line of copy
         that stands on the photograph (text on its own plate is left out: the
         plate owns its ground) keeps the worst end of its ground (the 90th
         percentile of luminance under light ink, the 10th under dark ink)
         where it clears o.want (4.5:1) against its ink, or where the old ground
         kept it if that was further: the lightest scrim that does both. So no
         line loses contrast, and none is shaded darker than it needs.
         o.modes: the scrim modes to try in order ('gradient' keeps the middle
         of the photograph alive; 'normal' is even). */
      naturalGround(t, o){
        const W = TPL_W, H = TPL_H, bg = t.bg;
        const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
        const hexLum = h => { const m = /^#?([0-9a-f]{6})$/i.exec(String(h || '').trim()); if (!m) return null; const n = parseInt(m[1], 16);
          return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
        const ground = spec => {
          const sc = new fabric.StaticCanvas(null, { width: W, height: H, renderOnAddRemove: false });
          const bgi = freshBgImage(spec.src, spec.blur, spec.grade);
          if (!bgi){ sc.dispose(); return null; }
          sc.setBackgroundImage(coverImage(bgi, W, H), () => {});
          if (spec.scrim) sc.add(scrimRect(spec.scrim, W, H, spec.scrimColor, spec.scrimMode));
          (t.layers || []).forEach(l => { if (l.kind === 'vignette' || l.kind === 'grain'){ try { const x = buildLayer(l, t.id); if (x) sc.add(x); } catch (e){} } });
          sc.renderAll();
          const d = sc.lowerCanvasEl.getContext('2d').getImageData(0, 0, W, H).data;
          sc.dispose();
          return d;
        };
        const { sc, refs } = this.paint(t);
        const box = x => { const b = x.getBoundingRect(true, true); return { x: b.left, y: b.top, w: b.width, h: b.height }; };
        const plates = [];
        t.layers.forEach((l, k) => { if (l.kind === 'rect' && refs[k] && l.props && !(l.props.opacity < 0.5)){
          const f = l.props.fill; const solid = f && !/rgba\([^)]*,\s*0(\.[0-4]\d*)?\)$/.test(String(f)) && f !== 'transparent';
          const b = box(refs[k]); if (solid && b.w * b.h < 0.6 * W * H) plates.push({ k, b }); } });
        const inside = (p, b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
        const lines = [];
        t.layers.forEach((l, k) => {
          if (!refs[k] || typeof l.text !== 'string' || !/[A-Za-z0-9]/.test(l.text) || l.role === 'deco' || refs[k].visible === false) return;
          const b = box(refs[k]), c = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
          if (b.w < 2 || b.h < 2 || plates.some(p => p.k < k && inside(c, p.b))) return;
          const p = l.props || {}, lum = hexLum(p.fill) ?? (p.grad ? ((hexLum(p.grad.c1) || 0) + (hexLum(p.grad.c2) || 0)) / 2 : null);
          lines.push({ b, lum, a: b.w * b.h, name: l.name });
        });
        sc.dispose();
        const pixels = (d, x) => { const v = [], b = x.b;
          for (let y = Math.max(0, Math.floor(b.y)); y < Math.min(H, b.y + b.h); y += 3)
            for (let xx = Math.max(0, Math.floor(b.x)); xx < Math.min(W, b.x + b.w); xx += 3){ const q = (y * W + xx) * 4; v.push(0.2126 * lin(d[q]) + 0.7152 * lin(d[q + 1]) + 0.0722 * lin(d[q + 2])); }
          return v.sort((p, q) => p - q); };
        const pct = (v, p) => v[Math.min(v.length - 1, Math.floor(v.length * p))];
        const stat = (d, x) => { const v = pixels(d, x); return v.length ? pct(v, x.light ? 0.9 : 0.1) : null; };
        const old = ground(bg);
        if (!old) return { skip: 'photograph did not load' };
        /* a line is light ink if it is lighter than the ground it stands on,
           not lighter than some fixed grey: an orange word at L 0.35 on a
           near-black photograph is light ink, and its worst pixels are the
           bright ones */
        lines.forEach(x => { const v = pixels(old, x); x.mid = v.length ? pct(v, 0.5) : null; });
        const known = lines.filter(x => x.lum != null && x.mid != null);
        known.forEach(x => { x.light = x.lum > x.mid; });
        const area = f => known.filter(f).reduce((s, x) => s + x.a, 0);
        const light = known.length ? area(x => x.light) >= area(x => !x.light) : true;
        lines.forEach(x => { if (x.light === undefined) x.light = light; });
        const inkLum = known.length ? known.reduce((s, x) => s + x.lum * x.a, 0) / known.reduce((s, x) => s + x.a, 0) : null;
        const want = o.want || 4.5;
        lines.forEach(x => {
          x.old = stat(old, x);
          if (x.lum == null){ x.allow = x.old; return; }
          const need = x.light ? (x.lum + 0.05) / want - 0.05 : want * (x.lum + 0.05) - 0.05;
          x.allow = x.light ? Math.max(x.old, need) : (need > 1 ? x.old : Math.min(x.old, need));
        });
        /* a line under 1.5:1 against the middle of its old ground was never
           read off the photograph: an outline, a glow or a plate the finder
           did not see carries it, and no scrim is its business */
        const cr = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        const live = lines.filter(x => x.old != null && !(x.lum != null && x.mid != null && cr(x.lum, x.mid) < 1.5));
        const make = (a, mode) => Object.assign({}, bg, { grade: o.grade, scrim: +a.toFixed(3),
          scrimColor: light ? o.dark : o.light, scrimMode: mode });
        const ok = spec => { if (!live.length) return true; const d = ground(spec); if (!d) return false;
          return live.every(x => { const v = stat(d, x); return x.light ? v <= x.allow * 1.02 + 0.002 : v >= x.allow * 0.98 - 0.002; }); };
        const solve = mode => {
          if (ok(make(0, mode))) return make(0, mode);
          if (!ok(make(0.92, mode))) return null;
          let lo = 0, hi = 0.92;
          for (let it = 0; it < 8; it++){ const m = (lo + hi) / 2; if (ok(make(m, mode))) hi = m; else lo = m; }
          return make(hi, mode);
        };
        let spec = null;
        for (const mode of o.modes){ spec = solve(mode); if (spec) break; }
        if (!spec){
          /* which lines no strength of this scrim can hold, at its strongest */
          const d = ground(make(0.92, o.modes[o.modes.length - 1]));
          const blockers = d ? live.filter(x => { const v = stat(d, x); x.at = +v.toFixed(4); return x.light ? v > x.allow * 1.02 + 0.002 : v < x.allow * 0.98 - 0.002; })
            .map(x => ({ name: x.name, light: x.light, lum: x.lum == null ? null : +x.lum.toFixed(3), old: +x.old.toFixed(4), allow: +x.allow.toFixed(4), at: x.at })) : [];
          return { skip: 'no neutral scrim keeps every line', light, lines: live.length, blockers };
        }
        if (!spec.scrimColor) delete spec.scrimColor;
        if (spec.grade == null) delete spec.grade;
        return { bg: spec, light, inkLum: inkLum == null ? null : +inkLum.toFixed(3), lines: live.length,
                 shortBefore: live.filter(x => x.lum != null && x.allow === x.old && (x.light ? x.old > (x.lum + 0.05) / want - 0.05 : x.old < want * (x.lum + 0.05) - 0.05)).length };
      },
    };
  });
  return { browser, page, errors };
}
