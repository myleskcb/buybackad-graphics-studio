#!/usr/bin/env node
/* THE NUMBER IS HOW PEOPLE REACH THE SHOP — make it big, and put it on its plate.
 *
 * Measured 2026-09-26 on all 971 showcase cards: every card carries the phone
 * number, at a median 58px on a 1080 canvas (5.4% of the width, 0.41x the
 * headline). The video ad maker draws the same number at up to 0.72x the
 * headline and 11% of the width, and the owner's verdict on the static work was
 * that it lacks "a big/medium phone number for people to contact us". In a
 * 160px feed tile (the study session's thumbnail test) a 58px number is 6px
 * tall: present, unreadable.
 *
 * Two defects travel with it, found on the contact sheets:
 *   - The plate behind the number was authored at x=44 or x=376 while the
 *     number stayed centred at x=540, so on trustSeal, stepsFlow, scriptRetro,
 *     ticketStub and neonNight cards half the number sits off its own plate.
 *   - The number was set in a third typeface (JetBrains Mono on 54 cards, and a
 *     third family on 328 more), where the study session allows two.
 *
 * What this does, per card, through the studio's own buildLayer()/alignPass():
 *   1. Finds the contact block: the phone line, the CTA and website lines that
 *      travel with it, the plates they sit on (and a plate's sheen), and the
 *      little globe mark beside the website.
 *   2. Sizes the number like the video engine does: 0.62x the largest headline,
 *      held to 84..118px, never under 72px (a 160px tile then shows digits 7.6px
 *      tall), and never over 0.77x the headline so the headline still wins by
 *      the study session's 1.3x.
 *   3. Sets it in one of the card's two families: the display face when that
 *      face is condensed, otherwise the support face.
 *   4. Stacks the block on ONE axis, and rebuilds each plate to hug what is on
 *      it, keeping the plate's anchored edge (left, right or centre), its shape,
 *      fill, radius, skew and shadow.
 *   5. Places it where it collides with nothing: it grows up from where the
 *      block sat, or down, or is centred there, and each try is checked against
 *      every other line, product and shape. When it does not fit, the small
 *      extras go first, as in the video engine: the CTA shrinks to a label, then
 *      the website line shrinks; only then does the number step down. A card
 *      whose number cannot reach 72px is left as it was and reported.
 *
 * The CLASSICS (the 243 templates the pass chain in app.js builds at load) have
 * no records to rewrite, so --classics measures them the same way and writes
 * assets/number-fix.json, one row per layer, which app.js applies at load the
 * way it applies assets/contrast-fix.json. Each row carries the layer's own
 * words: a template that changed since the table was baked is skipped, not
 * misapplied. Re-run it after changing a classic template or a pass.
 *
 * usage: node scripts/number_block.mjs [--write] [--ids a,b,c] [--json out.json]
 *        node scripts/number_block.mjs --classics [--write]
 *   CHROME=... FABRIC_JS=... work as in _showcase_harness.mjs.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { openStudio } from './_showcase_harness.mjs';
const ROOT = new URL('../', import.meta.url).pathname;
const DIR = ROOT + 'assets/showcase/tpl/';
const WRITE = process.argv.includes('--write');
const argv = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const idx = JSON.parse(readFileSync(ROOT + 'assets/showcase/index.json', 'utf8'));
const faces = Object.fromEntries(idx.map(c => [c.id, c.faces || {}]));
const only = argv('--ids') ? new Set(argv('--ids').split(',')) : null;
const CLASSICS = process.argv.includes('--classics');
let ids = readdirSync(DIR).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5)).filter(id => !only || only.has(id)).sort();

const RULE = { target: 0.62, min: 84, max: 118, floor: 72, lead: 0.77, label: 0.42, labelMin: 26, siteMin: 24, siteMax: 30,
  condensed: ['Sofia Sans Extra Condensed', 'Big Shoulders Display'] };

/* the classics are measured as the passes drew them: with the table this writes
   applied first, every number would already read as big and the bake would come
   out empty (the trap bake_contrast.mjs documents for ?nofix=1) */
const { browser, page, errors } = await openStudio(CLASSICS ? '&nonum=1' : '');
await page.evaluate(RULE => { window.__RULE = RULE; }, RULE);
if (CLASSICS) ids = (await page.evaluate(() => TEMPLATES.filter(t => !/^(sc|hx)-/.test(t.id)).map(t => t.id))).filter(id => !only || only.has(id));

const report = {};
for (let i = 0; i < ids.length; i += 6){
  const batch = ids.slice(i, i + 6);
  const res = await page.evaluate(async (batch, faces, CLASSICS) => {
    const R = window.__RULE, W = TPL_W, H = TPL_H, out = {};
    const bx = o => { const b = o.getBoundingRect(true, true); return { x: b.left, y: b.top, w: b.width, h: b.height }; };
    const area = b => Math.max(0, b.w) * Math.max(0, b.h);
    const inter = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    const inside = (p, b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
    const ctr = b => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
    const grow = (b, d) => ({ x: b.x - d, y: b.y - d, w: b.w + 2 * d, h: b.h + 2 * d });
    const clear = f => !f || f === 'transparent' || /rgba\([^)]*,\s*0(\.0+)?\)$/.test(String(f));
    /* a text layer's box at a given size, measured by the studio itself */
    const measure = (l, props) => { const o = buildLayer(Object.assign({}, l, { props: Object.assign({}, l.props, props) }), 'nb'); const b = bx(o); return { w: b.w, h: b.h, dy: b.y - (props.top !== undefined ? props.top : l.props.top || 0) }; };

    for (const id of batch){
      try {
        const t = CLASSICS ? await __sc.prep({ base: id, tpl: { cat: (TEMPLATES.find(x => x.id === id) || {}).cat } }, id) : await __sc.load(id);
        const L = t.layers;
        const { sc, refs } = __sc.paint(t);
        const B = L.map((l, k) => refs[k] ? bx(refs[k]) : null);
        /* the headline as DRAWN: fitToDoc shrinks a long line, and the number is
           sized against what a reader sees, or it can outgrow the headline */
        const drawn = L.map((l, k) => refs[k] && typeof refs[k].fontSize === 'number' ? refs[k].fontSize * (refs[k].scaleY || 1) : ((l.props && l.props.fontSize) || 0));
        sc.dispose();
        const pk = L.findIndex(l => l.role === 'phone');
        if (pk < 0){ out[id] = { skip: 'no phone line' }; continue; }
        const P = B[pk], ph = Math.max(P.h, 40), headFs = Math.max(0, ...L.map((l, k) => l.role === 'headline' && typeof l.text === 'string' && /[A-Za-z0-9]{2}/.test(l.text) ? drawn[k] : 0));
        const near = (k, d) => B[k] && Math.max(0, Math.max(B[k].y - (P.y + P.h), P.y - (B[k].y + B[k].h))) <= d;
        /* the block */
        const plates = L.map((l, k) => k).filter(k => L[k].kind === 'rect' && B[k] && area(B[k]) < W * H * 0.25 && !/sheen/i.test(L[k].name || '')
          && inter(B[k], P) >= 0.5 * area(P));
        const ctaK = L.map((l, k) => k).filter(k => L[k].role === 'cta' && typeof L[k].text === 'string' && L[k].text.trim() && near(k, 2 * ph)
          && (plates.some(p => inside(ctr(B[k]), B[p])) || Math.abs(ctr(B[k]).x - ctr(P).x) < 0.3 * W || Math.abs(ctr(B[k]).y - ctr(P).y) < 20));
        const siteK = L.map((l, k) => k).filter(k => L[k].role === 'website' && B[k] && near(k, 2.6 * ph));
        const items = [pk, ...ctaK, ...siteK];
        const cursorK = L.map((l, k) => k).filter(k => L[k].__cursor && B[k] && siteK.some(s => Math.abs(ctr(B[k]).y - ctr(B[s]).y) < 30 && Math.abs(ctr(B[k]).x - ctr(B[s]).x) < 260));
        const sheenK = L.map((l, k) => k).filter(k => L[k].kind === 'rect' && /sheen/i.test(L[k].name || '') && plates.some(p => inter(B[k], B[p]) >= 0.8 * area(B[k])));
        /* a small icon beside the number (a phone cue) travels with it */
        const cueK = L.map((l, k) => k).filter(k => L[k].kind === 'path' && !L[k].__cursor && B[k] && B[k].w < 90 && B[k].h < 90
          && Math.abs(ctr(B[k]).y - ctr(P).y) < 0.6 * P.h && Math.min(Math.abs(B[k].x + B[k].w - P.x), Math.abs(P.x + P.w - B[k].x)) < 90);
        const group = new Set([...items, ...plates, ...cursorK, ...sheenK, ...cueK]);
        const cueW = cueK.length ? Math.max(...cueK.map(k => B[k].w + Math.max(8, Math.min(Math.abs(B[k].x + B[k].w - P.x), Math.abs(P.x + P.w - B[k].x))))) : 0;
        /* a plate that bleeds off an edge keeps its bleed (a full-width band at the foot of the card) */
        const bleed = Object.fromEntries(plates.map(k => [k, { lr: B[k].x <= 2 && B[k].x + B[k].w >= W - 2, b: B[k].y + B[k].h >= H - 2 }]));
        /* bounds: a big panel the block sits in, a full-card outline frame, and the canvas margins */
        let X0 = 44, X1 = W - 44, Y0 = 36, Y1 = H - 30;
        const gBox0 = [...items, ...plates].map(k => B[k]).reduce((a, b) => { const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y); return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y }; });
        L.forEach((l, k) => {
          if (group.has(k) || !B[k] || l.kind !== 'rect') return;
          const b = B[k], big = area(b) >= W * H * 0.25;
          if (big && clear(l.props && l.props.fill) && inside(ctr(P), b)){ X0 = Math.max(X0, b.x + 20); X1 = Math.min(X1, b.x + b.w - 20); Y0 = Math.max(Y0, b.y + 20); Y1 = Math.min(Y1, b.y + b.h - 20); }
          else if (big && inside(ctr(P), b)){ X0 = Math.max(X0, b.x + 24); X1 = Math.min(X1, b.x + b.w - 24); Y0 = Math.max(Y0, b.y + 24); Y1 = Math.min(Y1, b.y + b.h - 24); }
        });
        plates.forEach(k => { if (bleed[k].lr){ X0 = Math.min(X0, B[k].x); X1 = Math.max(X1, B[k].x + B[k].w); } if (bleed[k].b) Y1 = Math.max(Y1, B[k].y + B[k].h); });
        /* obstacles: anything visible that is not the block, the ground, or a panel the block sits in */
        const obst = [];
        L.forEach((l, k) => {
          if (group.has(k) || !B[k]) return;
          const b = B[k], op = l.props && l.props.opacity !== undefined ? l.props.opacity : 1;
          if (['vignette', 'grain', 'scrim', 'bgimage'].includes(l.kind) || op < 0.5 || l.__wall) return;
          if (area(b) >= W * H * 0.25) return;                      // the ground, a panel or a frame: handled as bounds
          if (l.kind === 'rect' && clear(l.props && l.props.fill) && !(l.props && l.props.stroke)) return;
          if (typeof l.text === 'string' && !l.text.trim()) return;
          /* corner brackets are L-shaped: their box is mostly empty (the overlap audit skips them too) */
          if (l.kind === 'path' && (l.role === 'frame' || /Frame|Corner|Bracket/i.test(l.name || ''))) return;
          const orig = inter(b, gBox0);
          obst.push({ k, b, name: l.name || l.kind, soft: l.kind !== 'text' && l.kind !== 'textbox', allow: orig });
        });
        /* the number's face: one of the card's two families */
        const f = faces[id] || {};
        const numFace = R.condensed.includes(f.display) ? f.display : (f.support || L[pk].props.fontFamily);
        /* a weight each face ships (rule 20): Big Shoulders stops at 700 */
        const numWeight = { 'Big Shoulders Display': 700, 'Sofia Sans Extra Condensed': 900, 'Schibsted Grotesk': 800 }[numFace] || L[pk].props.fontWeight || 700;
        const numProps = { fontFamily: numFace, fontWeight: numWeight, charSpacing: Math.min(0, L[pk].props.charSpacing || 0) };
        /* the tree: plates hold what sat on them, innermost plate first */
        const byArea = plates.slice().sort((a, b) => area(B[a]) - area(B[b]));
        const holder = k => byArea.find(p => p !== k && inside(ctr(B[k]), B[p]) && (L[k].kind !== 'rect' || area(B[p]) > area(B[k])));
        const kids = new Map([[null, []], ...plates.map(p => [p, []])]);
        [...items, ...plates].forEach(k => kids.get(holder(k) ?? null).push(k));
        const orderOf = k => ctr(B[k]).y + (L[k].role === 'cta' ? -25 : L[k].role === 'website' ? 25 : 0);
        kids.forEach(v => v.sort((a, b) => orderOf(a) - orderOf(b)));
        /* a plate whose children sat side by side (a CTA beside the number pill) keeps them in a row */
        const row = new Set(plates.filter(p => { const c = kids.get(p); return c.length > 1 && c.every(k => Math.abs(ctr(B[k]).y - ctr(B[c[0]]).y) < 20); }));
        row.forEach(p => kids.get(p).sort((a, b) => ctr(B[a]).x - ctr(B[b]).x));
        let lastHit = null;
        /* anchoring: which edge of the block stays put */
        const top = kids.get(null);
        const anchorBox = top.length === 1 && plates.includes(top[0]) ? B[top[0]] : gBox0;
        const phX = L[pk].props.originX || 'left';
        const mode = plates.length ? (Math.abs(anchorBox.x - 44) < 40 ? 'left' : Math.abs(anchorBox.x + anchorBox.w - (W - 44)) < 40 ? 'right' : 'center')
          : (phX === 'right' ? 'right' : phX === 'center' ? 'center' : 'left');
        const target = Math.max(R.min, Math.min(R.max, R.target * headFs));
        const cap = headFs ? Math.max(R.floor, R.lead * headFs) : R.max;
        const start = Math.min(target, cap);
        const old = { fs: L[pk].props.fontSize, face: L[pk].props.fontFamily };
        /* a classic authored with a big number already (the street set's 90-105px) keeps its own design */
        if (CLASSICS && old.fs >= R.min){ out[id] = { skip: 'already big', old }; continue; }

        const tryLayout = (N, shrink) => {
          const size = {}, patch = {};
          items.forEach(k => {
            const l = L[k];
            let props = {};
            if (k === pk) props = Object.assign({}, numProps, { fontSize: N });
            else if (l.role === 'cta') props = { fontSize: shrink ? R.labelMin : Math.max(R.labelMin, Math.min(l.props.fontSize, R.label * N)) };
            else {
              props = { fontSize: shrink ? R.siteMin : Math.max(R.siteMin, Math.min(R.siteMax, l.props.fontSize * 1.2)) };
              /* the web address in the support face: two families on a card, not three */
              const sup = (faces[id] || {}).support;
              if (sup && l.props.fontFamily !== sup && l.props.fontFamily !== numFace){ props.fontFamily = sup; props.fontWeight = 700; }
            }
            props.originX = 'center'; props.originY = 'top'; props.top = 0; props.left = W / 2;
            const m = measure(l, props);
            size[k] = { w: m.w + (k === pk ? 2 * cueW : 0), h: m.h, dy: m.dy, iw: m.w }; patch[k] = props;
          });
          const gapIn = (shrink ? 0.08 : 0.1) * N, gapOut = (shrink ? 0.1 : 0.16) * N, padX = Math.max(26, 0.3 * N), padY = Math.max(10, (shrink ? 0.12 : 0.14) * N);
          /* sizes of plates, bottom-up */
          const node = new Map();
          const sizeOf = k => {
            if (node.has(k)) return node.get(k);
            let s;
            if (plates.includes(k)){
              const ch = kids.get(k);
              const w = row.has(k) ? ch.reduce((a, c) => a + sizeOf(c).w, 0) + gapOut * (ch.length - 1) : Math.max(...ch.map(c => sizeOf(c).w));
              const h = row.has(k) ? Math.max(...ch.map(c => sizeOf(c).h)) : ch.reduce((a, c) => a + sizeOf(c).h, 0) + gapIn * (ch.length - 1);
              const skew = Math.abs(Math.tan(((L[k].props.skewX || 0) * Math.PI) / 180)) * (h + 2 * padY);
              s = { w: Math.max(w + 2 * padX + skew, 0), h: h + 2 * padY };
              if (/pill|round/.test(L[k].__shape || '') && (L[k].props.rx || 0) >= 0.35 * (B[k].h)) s.w += 0.35 * s.h;
              if (bleed[k].lr) s.w = Math.max(s.w, B[k].w);
              if (bleed[k].b) s.h += Math.max(0, 40 - padY);            // the ink stays clear of the edge it bleeds off
            } else s = size[k];
            node.set(k, s); return s;
          };
          const top = kids.get(null);
          const blockW = Math.max(...top.map(k => sizeOf(k).w)), blockH = top.reduce((a, k) => a + sizeOf(k).h, 0) + gapOut * (top.length - 1);
          if (blockW > X1 - X0 || blockH > Y1 - Y0) return null;
          const xl = mode === 'left' ? Math.max(X0, anchorBox.x) : mode === 'right' ? Math.min(X1, anchorBox.x + anchorBox.w) - blockW : ctr(anchorBox).x - blockW / 2;
          const bxl = Math.min(Math.max(xl, X0), X1 - blockW);
          /* where it sat first (grown up from its foot, down from its head, or centred on it),
             then every 6px within 220px of that, nearest first: the block never wanders */
          const footBleed = top.some(k => plates.includes(k) && bleed[k].b);
          const home = footBleed ? [Y1 - blockH] : [Math.min(gBox0.y + gBox0.h, Y1) - blockH, gBox0.y, ctr(gBox0).y - blockH / 2];
          const scan = [];
          if (!footBleed) for (let d = 6; d <= 220; d += 6) scan.push(home[0] - d, home[0] + d);
          for (const yt0 of home.concat(scan)){
            const yt = Math.min(Math.max(yt0, Y0), Y1 - blockH);
            if (Math.abs(yt + blockH / 2 - ctr(gBox0).y) > 240) continue;
            const box = { x: bxl, y: yt, w: blockW, h: blockH };
            const hit = obst.find(o => { const a = inter(grow(box, o.soft ? 0 : 5), o.b); return a > (o.soft ? Math.max(o.allow * 1.05, 0.04 * area(box)) : 0); });
            if (hit){ lastHit = hit.name; continue; }
            /* place: every child centred on the block's axis, plates hug their children */
            let axis = bxl + blockW / 2;
            const rects = {};
            const putAt = (k, x, y) => { const a = axis; axis = x; put(k, y); axis = a; };
            const put = (k, y) => {
              const s = sizeOf(k);
              if (plates.includes(k)){
                rects[k] = { x: axis - s.w / 2, y, w: s.w, h: s.h };
                if (row.has(k)){
                  let cx = axis - s.w / 2 + padX;
                  kids.get(k).forEach(c => { const cs = sizeOf(c); putAt(c, cx + cs.w / 2, y + (s.h - cs.h) / 2); cx += cs.w + gapOut; });
                } else {
                  let cy = y + padY;
                  kids.get(k).forEach(c => { put(c, cy); cy += sizeOf(c).h + gapIn; });
                }
              } else { patch[k].left = axis; patch[k].top = y - s.dy; }
            };
            let cy = yt;
            top.forEach(k => { put(k, cy); cy += sizeOf(k).h + gapOut; });
            return { N, patch, rects, box, axis };
          }
          return null;
        };
        let got = null;
        for (let N = Math.round(start); N >= R.floor && !got; N -= 2) got = tryLayout(N, false) || tryLayout(N, true);
        if (!got && row.size){
          /* a CTA beside the number that no longer fits beside it goes above it instead */
          row.clear(); kids.forEach(v => v.sort((a, b) => orderOf(a) - orderOf(b)));
          for (let N = Math.round(start); N >= R.floor && !got; N -= 2) got = tryLayout(N, false) || tryLayout(N, true);
        }
        if (!got){ out[id] = { keep: true, why: 'no room for a ' + R.floor + 'px number (blocked by ' + lastHit + ')', old, headFs, layout: t.name }; continue; }
        /* the patches, as record props */
        const props = {};
        items.forEach(k => { props[k] = got.patch[k]; delete props[k].originY; });
        plates.forEach(k => {
          const r = got.rects[k], p = L[k].props, pill = /pill/.test(L[k].__shape || '') || (p.rx || 0) >= 0.45 * B[k].h;
          const q = { left: Math.round(r.x), top: Math.round(r.y), width: Math.round(r.w), height: Math.round(r.h) };
          if (p.originX === 'center') q.left = Math.round(r.x + r.w / 2);
          if (p.originY === 'center') q.top = Math.round(r.y + r.h / 2);
          if (p.rx !== undefined) q.rx = pill ? Math.round(r.h / 2) : p.rx;
          if (p.ry !== undefined) q.ry = pill ? Math.round(r.h / 2) : p.ry;
          props[k] = q;
        });
        sheenK.forEach(k => { const pl = plates.find(p => inter(B[k], B[p]) >= 0.8 * area(B[k])), o = B[pl], n = got.rects[pl];
          props[k] = { left: Math.round(n.x + (B[k].x - o.x) / o.w * n.w), top: Math.round(n.y + (B[k].y - o.y)), width: Math.round(B[k].w / o.w * n.w) }; });
        cursorK.forEach(k => { const s = siteK[0], p = props[s], m = measure(L[s], Object.assign({}, L[s].props, p));
          props[k] = { left: Math.round(p.left - m.w / 2 - (B[s].x - B[k].x - 0)), top: Math.round(p.top + (L[k].props.top - L[s].props.top)) }; });
        cueK.forEach(k => {
          const p = props[pk], m = measure(L[pk], Object.assign({}, L[pk].props, p));
          const left = B[k].x + B[k].w <= P.x + 1, gap = left ? P.x - (B[k].x + B[k].w) : B[k].x - (P.x + P.w);
          const nx = left ? p.left - m.w / 2 - gap - B[k].w : p.left + m.w / 2 + gap;
          const ny = p.top + m.dy + m.h / 2 - B[k].h / 2;
          props[k] = { left: Math.round(nx + (L[k].props.left - B[k].x)), top: Math.round(ny + (L[k].props.top - B[k].y)) };
        });
        Object.values(props).forEach(q => Object.keys(q).forEach(n => { if (typeof q[n] === 'number' && n !== 'charSpacing' && n !== 'fontWeight') q[n] = Math.round(q[n] * 10) / 10; }));
        const names = Object.fromEntries(Object.keys(props).map(k => [k, [L[k].name || '', L[k].role || '', typeof L[k].text === 'string' ? L[k].text : null]]));
        out[id] = { N: got.N, old, headFs, mode, props, names, layout: t.name };
      } catch (e){ out[id] = { err: String(e && e.stack || e).slice(0, 300) }; }
    }
    return out;
  }, batch, faces, CLASSICS);
  Object.assign(report, res);
  if (i % 120 === 0) console.log('…' + Math.min(i + batch.length, ids.length) + '/' + ids.length);
}
await browser.close();

const rows = Object.entries(report);
const done = rows.filter(([, r]) => r.N), kept = rows.filter(([, r]) => r.keep), errs = rows.filter(([, r]) => r.err);
const med = a => { const s = a.slice().sort((p, q) => p - q); return s.length ? s[Math.floor(s.length / 2)] : 0; };
console.log(`\ncards ${rows.length} · rebuilt ${done.length} · kept (no room) ${kept.length} · errors ${errs.length} · page errors ${errors.length}`);
if (done.length) console.log(`number size  before median ${med(done.map(([, r]) => r.old.fs))}px  ->  after median ${med(done.map(([, r]) => r.N))}px (min ${Math.min(...done.map(([, r]) => r.N))})`);
errs.slice(0, 5).forEach(([id, r]) => console.log('  ERR', id, r.err));
kept.slice(0, 8).forEach(([id, r]) => console.log('  kept', id, r.why, 'headline', r.headFs));
if (argv('--json')) writeFileSync(argv('--json'), JSON.stringify(report));
if (WRITE && CLASSICS){
  /* one row per layer; a template whose patched layers do not have unique names is left alone */
  const rowsOut = [];
  for (const [id, r] of done){
    const nm = Object.values(r.names).map(v => v[0]);
    if (nm.some(n => !n) || new Set(nm).size !== nm.length) continue;
    Object.entries(r.props).forEach(([k, q]) => { const [layer, role, text] = r.names[k]; rowsOut.push({ id, layer, role, text, props: q }); });
  }
  writeFileSync(ROOT + 'assets/number-fix.json', JSON.stringify(rowsOut));
  console.log('wrote assets/number-fix.json: ' + rowsOut.length + ' layers on ' + new Set(rowsOut.map(x => x.id)).size + ' classic templates');
} else if (WRITE){
  let n = 0;
  for (const [id, r] of done){
    const f = DIR + id + '.json', rec = JSON.parse(readFileSync(f, 'utf8'));
    Object.entries(r.props).forEach(([k, q]) => { const l = rec.tpl.layers[+k]; l.props = Object.assign({}, l.props, q); if (l.props.originX === 'left') delete l.props.originX; });
    rec.tpl.layers.forEach(l => { if (l.role === 'phone') l.__numberBlock = 1; });
    writeFileSync(f, JSON.stringify(rec)); n++;
  }
  console.log('wrote ' + n + ' records');
}
