/* Shared harness for the showcase audits and the refresh: one headless Chrome
 * on the local studio (python3 -m http.server 8899), plus page-side helpers
 * that load a showcase record the way openShowcase()/rethumb do and paint it
 * the way renderThumb() does, so every measurement is taken on the pixels a
 * visitor sees. */
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';
export const BASE = process.env.GFX_BASE || 'http://localhost:8899/';
/* THE ONE "LIVE" PREDICATE (= scIsLive in app.js): not condemned, with imagery, with colour */
export const live = c => !!c && !c.defect && c.imagery !== 'none' && !(typeof c.chroma === 'number' && c.chroma < 0.05);
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
        const load = (src, store) => new Promise(r => { if (store === TPL_BG_ELS && isDrawnSrc(src)) return loadDrawnBg(src).then(r);
          if (!src || (store[src] && store[src].width)) return r();
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
      /* THE GATE (app.js pgCheck): the one measure every generation passes
         before it is produced. Paints the card the way renderThumb() does and
         returns the numbers: fails (legib, number, numInk, offPlate,
         onProduct, thumb, margin, touch), warns, and every reading line's
         core and worst letter. A writer script keeps a change only when
         accept(before, after) says so. */
      check(t, opts){
        const { sc, refs, bgMissing } = this.paint(t);
        const r = pgCheck(sc, opts); r.bgMissing = bgMissing;
        sc.dispose();
        return r;
      },
      /* a change is kept when it leaves no failure that was not there before,
         and no critical line under what it had (rule 52), by the same measure */
      accept(before, after, opts){
        const tol = (opts && opts.tol) || 0.05;
        const was = new Set(before.fails.map(f => f.code + '|' + f.line));
        const fresh = after.fails.filter(f => !was.has(f.code + '|' + f.line));
        const B = Object.fromEntries(before.lines.map(x => [x.name, x]));
        const lost = after.lines.filter(x => PG_CRIT[x.role] && B[x.name] && x.core != null && B[x.name].core != null && x.core < Math.min(B[x.name].core, PG_T.contrast) - tol)
          .map(x => ({ line: x.name, was: B[x.name].core, now: x.core }));
        return { ok: !fresh.length && !lost.length, fresh, lost };
      },
      colour: { lin: pgLin, lum: pgLum, rgb: pgRgb, cr: pgCr },
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
          lines.push({ b, lum, a: b.w * b.h, name: l.name, props: p, role: l.role || '' });
        });
        sc.dispose();
        const pixels = (d, x) => { const v = [], b = x.b;
          for (let y = Math.max(0, Math.floor(b.y)); y < Math.min(H, b.y + b.h); y += 3)
            for (let xx = Math.max(0, Math.floor(b.x)); xx < Math.min(W, b.x + b.w); xx += 3){ const q = (y * W + xx) * 4; v.push(0.2126 * lin(d[q]) + 0.7152 * lin(d[q + 1]) + 0.0722 * lin(d[q + 2])); }
          return v.sort((p, q) => p - q); };
        const pct = (v, p) => v[Math.min(v.length - 1, Math.floor(v.length * p))];
        /* the worst end of the ground under a line: the 90th/10th percentile
           of its box, or with o.core the 75th/25th, the core of the strokes
           the gate judges (pgCheck), so the shade is the lightest that passes
           the gate rather than the lightest that darkens every last pixel
           (owner, 2026-09-28: "make sure the backgrounds are visible") */
        const hiP = o.core ? 0.75 : 0.9, loP = o.core ? 0.25 : 0.1;
        const stat = (d, x) => { const v = pixels(d, x); return v.length ? pct(v, x.light ? hiP : loP) : null; };
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
        let light = known.length ? area(x => x.light) >= area(x => !x.light) : true;
        lines.forEach(x => { if (x.light === undefined) x.light = light; });
        const inkLum = known.length ? known.reduce((s, x) => s + x.lum * x.a, 0) / known.reduce((s, x) => s + x.a, 0) : null;
        const want = o.want || 4.5;
        /* per role (2026-09-28, "make sure the backgrounds are visible"): the
           headline, the number and the CTA clear o.want (4.5:1); supporting
           copy clears o.wantMinor when given (3.5:1, above the gate's 3:1
           floor), so the shade is the lightest that serves the message rather
           than the lightest that lifts every footnote to 4.5 */
        const wantOf = x => (PG_CRIT[x.role] || o.wantMinor == null) ? want : o.wantMinor;
        lines.forEach(x => {
          x.old = stat(old, x); x.want = wantOf(x);
          if (x.lum == null){ x.allow = x.old; return; }
          const want = x.want;
          const need = x.light ? (x.lum + 0.05) / want - 0.05 : want * (x.lum + 0.05) - 0.05;
          x.allow = x.light ? Math.max(x.old, need) : (need > 1 ? x.old : Math.min(x.old, need));
          /* o.strict: every line clears o.want, whatever the old ground let it
             get away with (the blurred cards, whose old ground was a smear) */
          if (o.strict && !(!x.light && need > 1)) x.allow = need;
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
        let spec = null, flipped = null;
        /* PREFER A DARK GROUND (owner, 2026-09-27: "make sure it still keeps
           good colors. a lot of these have a white haze overlay"). A paper
           shade over a photograph is a milky veil: every colour in the picture
           goes pastel. With o.prefer 'dark', every NEUTRAL dark line on the
           photograph takes the light ink and the shade is solved dark. A
           coloured dark line cannot be re-inked without redesigning the card,
           so such a card is reported and keeps its ground. */
        if (o.prefer === 'dark' && o.flip && !light){
          const neutralDark = x => { const p = x.props || {}, m = /^#?([0-9a-f]{6})$/i.exec(String(p.fill || '')); if (!m || p.grad) return false;
            const n = parseInt(m[1], 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; return (Math.max(...c) - Math.min(...c)) / 255 < 0.12; };
          const darks = live.filter(x => !x.light);
          /* a COLOURED dark line keeps its hue and turns its lightness over: a
             deep green headline becomes a pale mint one, a magenta word a light
             pink. Re-inked white, the palette would be lost; left dark, the card
             kept its haze (31 cards on the first pass). */
          const tintOf = x => { const p = x.props || {};
            let m = /^#?([0-9a-f]{6})$/i.exec(String(p.fill || '')), r, g, b;
            if (m){ const n = parseInt(m[1], 16); r = n >> 16; g = (n >> 8) & 255; b = n & 255; }
            else { m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(String(p.fill || '')); if (!m) return null; r = +m[1]; g = +m[2]; b = +m[3]; }
            r /= 255; g /= 255; b /= 255;
            const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0;
            if (d){ h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
            const sat = Math.min(0.75, d ? d / (1 - Math.abs(mx + mn - 1)) : 0);
            for (let L = 0.8; L <= 0.95; L += 0.03){   // the least washed-out tint that still reads
              const C = (1 - Math.abs(2 * L - 1)) * sat, X = C * (1 - Math.abs((h / 60) % 2 - 1)), mm = L - C / 2;
              const [a1, a2, a3] = h < 60 ? [C, X, 0] : h < 120 ? [X, C, 0] : h < 180 ? [0, C, X] : h < 240 ? [0, X, C] : h < 300 ? [X, 0, C] : [C, 0, X];
              const hx = '#' + [a1, a2, a3].map(v => Math.round((v + mm) * 255).toString(16).padStart(2, '0')).join('');
              if (hexLum(hx) >= 0.55) return hx;
            }
            return o.flip.light; };
          flipped = [];
          darks.forEach(x => { const ink = neutralDark(x) ? o.flip.light : (tintOf(x) || o.flip.light), il = hexLum(ink);
            x.light = true; x.lum = il; x.allow = (il + 0.05) / (x.want || want) - 0.05; flipped.push({ name: x.name, fill: ink }); });
          light = true;
        }
        for (const mode of o.modes){ spec = solve(mode); if (spec) break; }
        /* ONE INK DIRECTION PER GROUND. A card that sets white badges beside a
           black headline on the same photograph asks one scrim to darken and
           lighten the same picture. When the lines in the way are neutral
           (white or black, no hue to lose), they take the other side's
           near-white or near-black ink, their outline goes (the shade now
           separates them), and each must clear o.want against the new ground
           on its own. Majority direction first. A coloured line is never
           flipped: the card keeps its old ground instead. */
        if (!spec && o.flip){
          const neutralInk = x => { const p = x.props || {}, m = /^#?([0-9a-f]{6})$/i.exec(String(p.fill || '')); if (!m || p.grad) return false;
            const n = parseInt(m[1], 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; return (Math.max(...c) - Math.min(...c)) / 255 < 0.12; };
          for (const dir of [light, !light]){
            const flips = live.filter(x => x.light !== dir);
            if (!flips.length || flips.some(x => !neutralInk(x))) continue;
            const save = flips.map(x => ({ x, light: x.light, lum: x.lum, allow: x.allow })), was = light;
            const ink = dir ? o.flip.light : o.flip.dark, il = hexLum(ink);
            flips.forEach(x => { const w = x.want || want; x.light = dir; x.lum = il; x.allow = dir ? (il + 0.05) / w - 0.05 : w * (il + 0.05) - 0.05; });
            light = dir;
            for (const mode of o.modes){ spec = solve(mode); if (spec) break; }
            if (spec){ flipped = (flipped || []).concat(flips.map(x => ({ name: x.name, fill: ink }))); break; }
            light = was; save.forEach(v => Object.assign(v.x, { light: v.light, lum: v.lum, allow: v.allow }));
          }
        }
        if (!spec){
          /* which lines no strength of this scrim can hold, at its strongest */
          const d = ground(make(0.92, o.modes[o.modes.length - 1]));
          const blockers = d ? live.filter(x => { const v = stat(d, x); x.at = +v.toFixed(4); return x.light ? v > x.allow * 1.02 + 0.002 : v < x.allow * 0.98 - 0.002; })
            .map(x => ({ name: x.name, light: x.light, lum: x.lum == null ? null : +x.lum.toFixed(3), old: +x.old.toFixed(4), allow: +x.allow.toFixed(4), at: x.at })) : [];
          return { skip: 'no neutral scrim keeps every line', light, lines: live.length, blockers };
        }
        if (!spec.scrimColor) delete spec.scrimColor;
        if (spec.grade == null) delete spec.grade;
        return { bg: spec, light, flipped, inkLum: inkLum == null ? null : +inkLum.toFixed(3), lines: live.length,
                 shortBefore: live.filter(x => { const w = x.want || want; return x.lum != null && x.allow === x.old && (x.light ? x.old > (x.lum + 0.05) / w - 0.05 : x.old < w * (x.lum + 0.05) - 0.05); }).length };
      },
    };
  });
  return { browser, page, errors };
}

/* THE WRITERS' GATE. Every script that rewrites a showcase record runs its
   candidates through here before writing: each pair {id, rec} is painted as
   the record on disk and as the candidate, both through __sc.check (the one
   measure, app.js pgCheck), and kept only when __sc.accept says the candidate
   leaves no failure that was not there before and no critical line under what
   it had. Returns { id: { ok, before, after, fresh, lost } }. */
export async function gateRecords(page, pairs, opts){
  const out = {};
  for (let i = 0; i < pairs.length; i += 4){
    Object.assign(out, await page.evaluate(async (batch, opts) => {
      const R = {};
      for (const { id, rec } of batch){
        try {
          const before = __sc.check(await __sc.load(id), opts);
          const after = __sc.check(await __sc.prep(rec, id + '__candidate'), opts);
          const a = __sc.accept(before, after, opts);
          R[id] = { ok: a.ok, fresh: a.fresh, lost: a.lost, before: { legib: before.legib, number: before.number, fails: before.fails.length }, after: { legib: after.legib, number: after.number, fails: after.fails.map(f => f.code + ' ' + (f.line || '')) } };
        } catch (e){ R[id] = { ok: false, err: String(e).slice(0, 160) }; }
      }
      return R;
    }, pairs.slice(i, i + 4), opts || {}));
  }
  return out;
}
export function gateSummary(gate){
  const rows = Object.entries(gate), kept = rows.filter(([, g]) => g.ok), held = rows.filter(([, g]) => !g.ok);
  const why = {}; held.forEach(([, g]) => { const k = g.err ? 'error' : (g.fresh || []).map(f => f.code).concat((g.lost || []).length ? ['lost contrast'] : []).join('+') || 'held'; why[k] = (why[k] || 0) + 1; });
  return `gate: kept ${kept.length} · held back ${held.length}` + (held.length ? ' (' + JSON.stringify(why) + ')' : '');
}
