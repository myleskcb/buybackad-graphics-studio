#!/usr/bin/env node
/* NEUTRAL PANELS — no colour haze over the photograph.
 *
 * Owner, 2026-09-27: "these colored hazes don't look great. Unify with the
 * new design language in the 'template and content audit update' thread."
 * That language is DESIGN-LAW rule 56: rung 1 over the photograph is light and
 * shade, never a colour; shade is near-black under light ink and near-white
 * paper under dark ink; a big pastel panel is a veil by another name. Colour
 * has a job, not a coat: the accent on the action plate and the money word,
 * the support colour on the selling points, the product, and the photograph
 * as it was shot.
 *
 * Measured on the live cards: 182 of them still laid a hue over the picture,
 * in two forms. See-through tinted rects (87 step cards at a median 0.52, 64
 * tiles, 33 item panels, chips, review rows, the tinted dark bands the dark
 * ground pass left under re-inked lines) read as a coloured haze; solid
 * pastel or deep-tinted panels that hold the copy (step cards, tiles, info
 * and item panels, poster frames, glass panels, tickets, quote cards) read as
 * a coloured sheet laid over the photograph (lavender under SELL YOUR iPAD,
 * navy under WE BUY SILVER, olive under WE BUY GOLD JEWELRY).
 *
 * Each such rect loses its hue:
 *   - a panel whose copy is all lighter than it becomes SMOKE (16,16,19) at
 *     its own opacity: the photograph shows through as shade, not as tint;
 *   - a panel whose copy is all darker becomes PAPER (247,246,243), at 0.9 or
 *     more: paper thinner than that is the milky haze rule 62 took away;
 *   - mixed copy, no copy, and sheens keep their luminance in a neutral grey
 *     at the same opacity (rule 52: colour may change, luminance may not).
 * Every line of copy on the card is judged on the rendered pixels before and
 * after (its ground with the copy hidden, 10th and 90th percentile). A change
 * that leaves any line under what it had (or under 4.5:1 where it had more)
 * falls back to the same-luminance grey, and failing that the rect is left.
 *
 * The CTA card, phone plate, kicker, price strip and knockout band keep their
 * colour when solid: that is the accent doing its job.
 *
 * The same pass takes the glows off. Rung 1 is shade, so the wide shadow
 * round a plate, a panel or the product (12px blur and more) is dark and
 * neutral, never pale or tinted: those were set for the white-shaded grounds
 * and, on the dark grounds that replaced them, ring every plate with haze.
 * And a line's halo takes the tone its ground is not (rule 27): dark behind
 * ink lighter than its ground, light behind ink darker. The dark-ground pass
 * re-inked lines light and left their light halos, so they glowed.
 * A pale see-through panel (under 0.9, lighter than mid-grey) is the milky
 * veil whatever its hue, and is judged with the tinted ones.
 *
 * usage: node scripts/neutral_panels.mjs [--ids a,b] [--out dir] [--write] [--json f]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { openStudio } from './_showcase_harness.mjs';
const ROOT = new URL('../', import.meta.url).pathname, DIR = ROOT + 'assets/showcase/';
const argv = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const WRITE = process.argv.includes('--write'), OUT = argv('--out');
const idx = JSON.parse(readFileSync(DIR + 'index.json', 'utf8'));
const only = argv('--ids') ? new Set(argv('--ids').split(',')) : null;
const work = idx.filter(c => only ? only.has(c.id) : !c.defect).map(c => c.id);
console.log('cards: ' + work.length);

/* the panels that hold copy; any other rect only when it is see-through */
const CONTAINER = '^(Step Card|Tile|Items Panel|Info Text Panel|Poster Frame|Glass Panel|Data Line Panel|Ticket|Ticket Perf|Quote Card|Review Row)( \\d+)?$';

const { browser, page, errors } = await openStudio();
const out = {};
for (let i = 0; i < work.length; i += 6){
  Object.assign(out, await page.evaluate(async (ids, CONTAINER) => {
    const R = {}, CONT = new RegExp(CONTAINER);
    const SMOKE = [16, 16, 19], PAPER = [247, 246, 243], HALO_DARK = [12, 12, 14], HALO_LIGHT = [251, 250, 248];
    const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const unlin = y => { const c = y <= 0.0031308 ? 12.92 * y : 1.055 * Math.pow(y, 1 / 2.4) - 0.055; return Math.round(Math.max(0, Math.min(1, c)) * 255); };
    const Y = c => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
    const rgbaOf = f => { let m = /^#?([0-9a-f]{6})$/i.exec(String(f || '').trim()); if (m){ const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255, 1]; }
      m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(String(f || '')); return m ? [+m[1], +m[2], +m[3], m[4] == null ? 1 : +m[4]] : null; };
    const chroma = c => (Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2])) / 255;
    const cr = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const isText = l => typeof l.text === 'string' && /\S/.test(l.text) && l.kind !== 'cutout';
    const W = TPL_W, H = TPL_H;

    /* every visible line's ground (copy hidden) and its host rect */
    const measure = t => {
      const { sc, refs } = __sc.paint(t);
      const lines = [];
      t.layers.forEach((l, k) => { if (!isText(l) || !refs[k] || refs[k].visible === false) return;
        const ink = rgbaOf((l.props || {}).fill); if (!ink || (l.props || {}).grad) return;
        lines.push({ k, name: l.name, ink: Y(ink), b: refs[k].getBoundingRect(true, true) }); });
      const shown = refs.map(o => o && o.visible);
      const boxes = {}; t.layers.forEach((l, k) => { if (['rect', 'circle', 'cutout'].includes(l.kind) && refs[k]) boxes[k] = refs[k].getBoundingRect(true, true); });
      t.layers.forEach((l, k) => { if (isText(l) && refs[k]) refs[k].visible = false; });
      sc.renderAll();
      const d = sc.lowerCanvasEl.getContext('2d').getImageData(0, 0, W, H).data;
      lines.forEach(x => {
        const v = [], b = x.b;
        for (let y = Math.max(0, Math.floor(b.top)); y < Math.min(H, b.top + b.height); y += 2)
          for (let xx = Math.max(0, Math.floor(b.left)); xx < Math.min(W, b.left + b.width); xx += 2){ const q = (y * W + xx) * 4; v.push(Y([d[q], d[q + 1], d[q + 2]])); }
        v.sort((p, q) => p - q);
        if (!v.length){ x.worst = 99; return; }
        x.p10 = v[Math.floor(v.length * 0.1)]; x.p50 = v[Math.floor(v.length * 0.5)]; x.p90 = v[Math.floor(v.length * 0.9)];
        x.worst = Math.min(cr(x.ink, x.p10), cr(x.ink, x.p90));
        const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
        x.host = -1;
        for (let j = x.k - 1; j >= 0; j--){ const l = t.layers[j];
          if (l.kind !== 'rect' || !refs[j] || shown[j] === false) continue;
          const q = refs[j].getBoundingRect(true, true);
          if (cx > q.left && cx < q.left + q.width && cy > q.top && cy < q.top + q.height){ x.host = j; break; } }
      });
      sc.dispose();
      lines.boxes = boxes;
      return lines;
    };
    const fillOf = (rgb, a) => 'rgba(' + rgb.join(',') + ',' + (+a.toFixed(2)) + ')';

    for (const id of ids){
      try {
        const t = await __sc.load(id);
        // the rects that carry a hue over the picture
        const targets = [];
        t.layers.forEach((l, k) => {
          if (l.kind !== 'rect' || !l.props || l.props.grad) return;
          const c = rgbaOf(l.props.fill); if (!c) return;
          const op = l.props.opacity == null ? 1 : +l.props.opacity, a = c[3] * op;
          const sheen = / Sheen$/.test(l.name || '');
          /* a pale see-through panel is the milky veil whatever its hue
             (rule 62): the quote card at 0.5 white over the photograph */
          const milky = !sheen && a < 0.9 && Y(c) > 0.5;
          if (a < 0.05 || (chroma(c) <= 0.03 && !milky)) return;
          if (!(sheen || CONT.test(l.name || '') || a < 0.9)) return;
          targets.push({ k, name: l.name, fill: l.props.fill, opacity: l.props.opacity, c, a, op, sheen });
        });
        const base = measure(t);                               // what every line had
        const byK = Object.fromEntries(base.map(x => [x.k, x]));
        /* one system, one ink: a numbered line whose siblings all share a
           neutral ink while it alone is the other one (dark among light), held
           up by an outline (FREE QUOTE, dark with a white stroke, beside three
           white tiles), takes theirs. Headlines are not such a set. */
        const inked = [];
        t.layers.forEach((l, k) => { if (!isText(l) || !/\s\d+$/.test(l.name || '') || !l.props || !l.props.stroke) return;
          const fam = l.name.replace(/\s\d+$/, '');
          const sib = t.layers.filter(x => x !== l && isText(x) && /\s\d+$/.test(x.name || '') && x.name.replace(/\s\d+$/, '') === fam && x.props);
          const inks = new Set(sib.map(x => String(x.props.fill).toLowerCase()));
          if (/^Headline/.test(fam) || sib.length < 2 || inks.size !== 1) return;      // the headline's accent word is meant to differ
          const own = rgbaOf(l.props.fill), theirs = rgbaOf(sib[0].props.fill);
          if (!own || !theirs || chroma(own) > 0.1 || chroma(theirs) > 0.1 || (Y(own) > 0.4) === (Y(theirs) > 0.4)) return;   // neutral inks, dark against light
          const ink = sib[0].props.fill, props = Object.assign({}, l.props, { fill: ink });
          delete props.stroke; delete props.strokeWidth; delete props.paintFirst;
          inked.push({ k, name: l.name, from: l.props.fill, to: ink }); l.props = props; });
        const before = inked.length ? measure(t) : base;
        // each panel's direction from the lines it holds
        const plan = targets.map(p => {
          const held = before.filter(x => x.host === p.k && x.p50 != null);
          const light = held.filter(x => x.ink > x.p50).length, dark = held.length - light;
          const mode = p.sheen || !held.length ? 'grey' : !dark ? 'smoke' : !light ? 'paper' : 'grey';
          return Object.assign(p, { mode, held: held.map(x => x.k) });
        });
        /* numbered siblings (Tile 1..4, Step Card 1..3) are one system: they
           take the treatment most of them take, never smoke beside grey */
        const fam = n => String(n || '').replace(/\s\d+$/, '');
        plan.forEach(p => { if (p.sheen || !/\s\d+$/.test(p.name || '')) return;
          const sib = plan.filter(o => !o.sheen && fam(o.name) === fam(p.name)), n = {};
          sib.forEach(o => { if (o.mode !== 'grey') n[o.mode] = (n[o.mode] || 0) + 1; });
          const top = Object.entries(n).sort((a, b) => b[1] - a[1])[0];
          if (top && top[1] * 2 >= sib.length) p.mode = top[0]; });
        /* a panel that holds no copy itself but frames one that does (the
           ticket round its perforated card) goes the same way, or it is left
           a mid-grey ring round a paper card */
        plan.forEach(p => { if (p.sheen || p.held.length) return; const q = before.boxes[p.k]; if (!q) return;
          const inner = plan.find(o => o !== p && o.k > p.k && (o.mode === 'smoke' || o.mode === 'paper') && before.boxes[o.k] && (() => {
            const b = before.boxes[o.k], cx = b.left + b.width / 2, cy = b.top + b.height / 2;
            return cx > q.left && cx < q.left + q.width && cy > q.top && cy < q.top + q.height; })());
          if (inner) p.mode = inner.mode; });
        const setFill = (p, mode) => {
          const l = t.layers[p.k];
          let rgb, a = p.a;
          if (mode === 'smoke') rgb = SMOKE;
          else if (mode === 'paper'){ rgb = PAPER; a = Math.max(a, 0.9); }
          else { const g = unlin(Y(p.c)); rgb = [g, g, g]; }
          /* the opacity stays where it was (a stroke rides it) unless paper
             needs more than it allows */
          if (a > p.op + 1e-6){ l.props = Object.assign({}, l.props, { fill: fillOf(rgb, a), opacity: 1 }); p.opTo = 1; }
          else { l.props = Object.assign({}, l.props, { fill: fillOf(rgb, a / p.op) }); if (p.opacity == null) delete l.props.opacity; else l.props.opacity = p.opacity; p.opTo = null; }
          p.to = l.props.fill; p.applied = mode;
        };
        const reset = p => { t.layers[p.k].props = Object.assign({}, t.layers[p.k].props, { fill: p.fill, opacity: p.opacity });
          if (p.opacity == null) delete t.layers[p.k].props.opacity; p.to = null; p.opTo = null; p.applied = 'kept'; };
        /* the glow round a plate, a panel or the product: shade is dark
           (rule 56, rung 1). A pale or tinted glow of 12px and more was set for
           the white-shaded grounds and, on the dark ones, reads as a haze. */
        const glows = [];
        t.layers.forEach((l, k) => { if (!['rect', 'circle', 'cutout'].includes(l.kind) || !l.props) return;
          const sh = l.props.shadow; if (!sh || typeof sh !== 'object' || (sh.blur || 0) < 12) return;
          const c = rgbaOf(sh.color); if (!c || (Y(c) <= 0.35 && chroma(c) <= 0.06)) return;
          const to = fillOf(HALO_DARK, c[3]);
          glows.push({ k, name: l.name, from: sh.color, to }); l.props = Object.assign({}, l.props, { shadow: Object.assign({}, sh, { color: to }) }); });
        plan.forEach(p => setFill(p, p.mode));
        // judge every line; fall back per rect under a line that lost ground
        let after = null, fails = [];
        for (let round = 0; round < 3; round++){
          after = measure(t);
          fails = after.filter(x => { const b0 = byK[x.k]; if (!b0) return false;
            return x.worst < Math.min(b0.worst, 4.5) - 0.05; });
          if (!fails.length) break;
          // the changed rects under a failing line: smoke or paper steps back to grey, grey to as it was
          const guilty = new Set();
          fails.forEach(x => { const cx = x.b.left + x.b.width / 2, cy = x.b.top + x.b.height / 2;
            plan.forEach(p => { if (p.applied === 'kept') return; const q = after.boxes[p.k];
              if (q && cx > q.left && cx < q.left + q.width && cy > q.top && cy < q.top + q.height) guilty.add(p); }); });
          if (!guilty.size) plan.forEach(p => { if (p.applied !== 'kept') guilty.add(p); });
          guilty.forEach(p => p.applied === 'grey' ? reset(p) : setFill(p, 'grey'));
          // and a shadow now dark round a shape beside the failing line goes back
          fails.forEach(x => glows.forEach(g => { if (g.back) return; const q = after.boxes[g.k] || null, l = t.layers[g.k];
            const r = q ? { left: q.left - 40, top: q.top - 40, width: q.width + 80, height: q.height + 80 } : null;
            if (!r || x.b.left > r.left + r.width || x.b.left + x.b.width < r.left || x.b.top > r.top + r.height || x.b.top + x.b.height < r.top) return;
            l.props = Object.assign({}, l.props, { shadow: Object.assign({}, l.props.shadow, { color: g.from }) }); g.back = true; }));
        }
        /* THE HALO TAKES ITS TONE FROM THE GROUND (rule 27): dark behind ink
           lighter than its ground, light behind ink darker, never a hue. The
           dark-ground pass re-inked 344 lines light and left their light
           halos, so they glowed; a tinted halo is rule 3's coloured glow. */
        const halos = [];
        after.forEach(x => { const l = t.layers[x.k], sh = l.props && l.props.shadow;
          if (!sh || typeof sh !== 'object' || x.p50 == null) return;
          const c = rgbaOf(sh.color); if (!c) return;
          const tone = Y(c) > 0.35 ? 'light' : 'dark';
          /* on a plate the plate is the separation and a halo only fuzzes the
             letters (rule 27): never a new light glow there, only the hue out */
          const host = x.host >= 0 ? t.layers[x.host] : null, hc = host && host.props && rgbaOf(host.props.fill);
          const onPlate = !!(hc && hc[3] * (host.props.opacity == null ? 1 : host.props.opacity) >= 0.5);
          let want = x.ink > x.p50 ? 'dark' : 'light';
          if (onPlate && want === 'light') want = tone;
          if (tone === want && chroma(c) <= 0.06) return;
          const to = fillOf(want === 'dark' ? HALO_DARK : HALO_LIGHT, c[3]);
          halos.push({ k: x.k, name: l.name, from: sh.color, to }); l.props = Object.assign({}, l.props, { shadow: Object.assign({}, sh, { color: to }) }); });
        R[id] = { inked, halos, glows: glows.filter(g => !g.back).map(({ k, name, from, to }) => ({ k, name, from, to })), changes: plan.map(p => ({ k: p.k, name: p.name, from: p.fill, opacity: p.opacity, to: p.to, opTo: p.opTo, mode: p.applied, held: p.held.length })),
                  fails: fails.map(x => ({ name: x.name, was: +byK[x.k].worst.toFixed(2), now: +x.worst.toFixed(2) })),
                  lines: after.map(x => ({ name: x.name, was: byK[x.k] ? +byK[x.k].worst.toFixed(2) : null, now: +x.worst.toFixed(2) })) };
      } catch (e){ R[id] = { err: String(e).slice(0, 160) }; }
    }
    return R;
  }, work.slice(i, i + 6), CONTAINER));
  if (i % 60 === 0) console.log('…' + Math.min(i + 6, work.length) + '/' + work.length);
}
await browser.close();

const rows = Object.entries(out), changed = rows.filter(([, r]) => r.changes && (r.changes.some(c => c.to) || [r.inked, r.halos, r.glows].some(a => (a || []).length)));
const count = key => rows.reduce((n, [, r]) => n + (r[key] || []).length, 0);
const modes = {}; rows.forEach(([, r]) => (r.changes || []).forEach(c => modes[c.mode] = (modes[c.mode] || 0) + 1));
console.log(`cards changed: ${changed.length} · rects: ${JSON.stringify(modes)} · halos turned: ${count('halos')} · glows made shade: ${count('glows')} · lines re-inked: ${count('inked')} · still failing: ${rows.filter(([, r]) => r.fails && r.fails.length).length} · errors ${rows.filter(([, r]) => r.err).length} · page errors ${errors.length}`);
const apply = (id, r) => {
  const rec = JSON.parse(readFileSync(DIR + 'tpl/' + id + '.json', 'utf8'));
  (r.inked || []).forEach(c => { const l = rec.tpl.layers[c.k]; if (!l || l.name !== c.name) throw new Error(id + ': layer ' + c.k + ' moved');
    l.props.fill = c.to; delete l.props.stroke; delete l.props.strokeWidth; delete l.props.paintFirst; });
  [].concat(r.halos || [], r.glows || []).forEach(c => { const l = rec.tpl.layers[c.k]; if (!l || l.name !== c.name) throw new Error(id + ': layer ' + c.k + ' moved');
    l.props.shadow = Object.assign({}, l.props.shadow, { color: c.to }); });
  r.changes.forEach(c => { if (!c.to) return; const l = rec.tpl.layers[c.k]; if (!l || l.name !== c.name) throw new Error(id + ': layer ' + c.k + ' moved');
    l.props.fill = c.to; if (c.opTo === 1) l.props.opacity = 1; });
  return rec;
};
if (OUT){ mkdirSync(OUT, { recursive: true }); changed.forEach(([id, r]) => writeFileSync(OUT + '/' + id + '.json', JSON.stringify(apply(id, r)))); console.log('wrote ' + changed.length + ' to ' + OUT); }
if (WRITE){ changed.forEach(([id, r]) => writeFileSync(DIR + 'tpl/' + id + '.json', JSON.stringify(apply(id, r)))); console.log('wrote ' + changed.length + ' records'); }
if (argv('--json')) writeFileSync(argv('--json'), JSON.stringify(out));
