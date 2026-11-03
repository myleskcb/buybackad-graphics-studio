/* THE LIBRARY'S FINISH: what iPhones LA's copies of the Designer Library
 * cards get that the customer templates do not.
 *
 * The owner, 2026-11-03, over the cards iPhones LA posts:
 *   "fix the iPhones.LA to show the real domain and you can put visit our
 *    website at www.iPhones.LA (that way they know it's a URL)"
 *   "that green CTA has the number touching the box"
 *   "audit that please so all margins are clean and minimal overlapping
 *    touching etc. ... so it looks well planned, designed, and thought out"
 *
 * The cards are also the studio's customer templates, where the website line
 * is the customer's own site and the studio strips its spaces (app.js
 * cleanText, role website). So none of this is written into a template: the
 * library renderer (render_library_ads.mjs) and the padding audit
 * (audit_plate_padding.mjs --library) apply it to iPhones LA's copies only.
 *
 * copy(t)   the website line reads "Visit our website at www.iPhones.LA",
 *           at 30px where it was 20-26, at least 85% opaque where it was 40-45%
 * finish    runs after the studio's alignPass (renderThumb's own sequence):
 *           on every plate, the words and marks on it are measured as drawn
 *           (each drawn with and without itself) and centred on it as one
 *           group, the plate growing where the group does not fit with
 *           clearance (a fifth of the letters' height over and under, min
 *           12px); a line still nearer a side than a quarter of its height
 *           (min 14px) widens its plate inside the card's 32px margin, else
 *           is set down to as little as 88% of its size. A headline on its
 *           highlight bar is a slab and is left as drawn.
 *           Before that: a line whose letters are under 20px tall grows to
 *           20px (by a third at most) as far as its plate or the margin
 *           allows; a headline that runs onto a plate below it pushes the
 *           plate and its words down where the room under them allows, else
 *           rises into the gap over it where that allows; a
 *           loose line (badges, a kicker) on a plate it is not on steps off.
 */
export const LIBRARY_SITE = 'Visit our website at www.iPhones.LA';
export const LIBRARY_SITE_PX = 30;

export async function installLibraryFinish(page) {
  await page.evaluate((SITE, SITE_PX) => {
    if (window.__lib) return;
    const lib = window.__lib = { on: false, log: [] };
    // the old line was a whisper (40-45% white on many cards); a URL has to be read: its own
    // colour, at least 85% there
    const solidInk = f => String(f || '').replace(/rgba\(([^,]+),([^,]+),([^,]+),\s*([0-9.]+)\s*\)/, (m, r, g, b, a) => `rgba(${r},${g},${b},${Math.max(0.85, +a)})`);
    lib.copy = t => Object.assign({}, t, { layers: t.layers.map(l => l.role === 'website'
      ? Object.assign({}, l, { text: SITE, props: Object.assign({}, l.props, { fontSize: Math.max(SITE_PX, (l.props && l.props.fontSize) || 0),
          fill: solidInk(l.props && l.props.fill), opacity: Math.max(0.85, (l.props && l.props.opacity != null) ? l.props.opacity : 1) }) }) : l) });

    const box = o => { const b = o.getBoundingRect(true, true); return { l: b.left, t: b.top, r: b.left + b.width, b: b.top + b.height }; };
    const solid = o => o.visible !== false && (o.opacity == null || o.opacity >= 0.5) && !o.pgScrim && !o.pgBgRect && !o.group
      && /^(rect|path|circle|ellipse|polygon)$/.test(o.type) && (() => { const f = String(o.fill || ''); return f && f !== 'transparent' && !/rgba\([^)]*,\s*0(\.[0-4]\d*)?\)$/.test(f); })();
    /* the letters (or mark) of a set of objects, as drawn: the pixels that change without them */
    const inkOf = (sc, objs, W, H) => {
      const ctx = sc.lowerCanvasEl.getContext('2d');
      const u = objs.map(box).reduce((a, b) => ({ l: Math.min(a.l, b.l), t: Math.min(a.t, b.t), r: Math.max(a.r, b.r), b: Math.max(a.b, b.b) }));
      const x0 = Math.max(0, Math.floor(u.l) - 4), y0 = Math.max(0, Math.floor(u.t) - 4), x1 = Math.min(W, Math.ceil(u.r) + 4), y1 = Math.min(H, Math.ceil(u.b) + 4);
      if (x1 - x0 < 2 || y1 - y0 < 2) return null;
      sc.renderAll(); const a = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
      const vis = objs.map(o => o.visible); objs.forEach(o => { o.visible = false; });
      sc.renderAll(); const b = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
      objs.forEach((o, i) => { o.visible = vis[i]; });
      let l = W, t = H, r = -1, bt = -1;
      for (let y = 0; y < y1 - y0; y++) for (let x = 0; x < x1 - x0; x++) {
        const k = (y * (x1 - x0) + x) * 4;
        if (Math.abs(a[k] - b[k]) + Math.abs(a[k + 1] - b[k + 1]) + Math.abs(a[k + 2] - b[k + 2]) > 60) { if (x < l) l = x; if (x > r) r = x; if (y < t) t = y; if (y > bt) bt = y; }
      }
      return r < 0 ? null : { l: l + x0, t: t + y0, r: r + x0 + 1, b: bt + y0 + 1 };
    };
    const resize = (o, P, nt, nb, nl, nr) => {          // a plate to a new box, its corners kept round
      if (o.type !== 'rect') return false;
      const pill = (o.rx || 0) >= Math.min(o.height * (o.scaleY || 1), o.width * (o.scaleX || 1)) / 2 - 1;
      const sy = o.scaleY || 1, sx = o.scaleX || 1, dt = nt - P.t, dl = nl - P.l;
      o.set({ top: o.top + dt, left: o.left + dl, height: (nb - nt) / sy, width: (nr - nl) / sx });
      if (pill) o.set({ rx: (nb - nt) / sy / 2, ry: (nb - nt) / sy / 2 });
      o.setCoords(); return true;
    };

    lib.finish = (sc, W, H) => {
      const objs = sc.getObjects(), id = sc.__libId || '';
      let plates = objs.map((o, i) => ({ o, i, b: box(o) })).filter(p => solid(p.o) && (p.b.r - p.b.l) * (p.b.b - p.b.t) < 0.6 * W * H && p.b.r - p.b.l > 40 && p.b.b - p.b.t > 30);
      const lines = objs.filter(o => typeof o.text === 'string' && /[A-Za-z0-9]/.test(o.text) && o.visible !== false && (o.pgRole || '') !== 'deco' && !o.pgKin && !o.pgKinId);
      const plateOf = o => { const i = objs.indexOf(o), b = box(o), cx = (b.l + b.r) / 2, cy = (b.t + b.b) / 2;
        return plates.filter(p => p.i < i && cx >= p.b.l && cx <= p.b.r && cy >= p.b.t && cy <= p.b.b).pop() || null; };
      /* small print up to 20px letters ("a small sub text that works on websites, but doesn't
         necessarily sell in buying ads"), as far as its plate or the card's margin lets it
         grow, never by more than a third */
      for (const o of lines) {
        const k = inkOf(sc, [o], W, H); if (!k || k.b - k.t >= 20) continue;
        const P = plateOf(o), lim = P ? { l: P.b.l + 14, r: P.b.r - 14 } : { l: 32, r: W - 32 };
        // it grows from the edge it is set from: a left-set label stays on its column
        const ax = o.originX === 'left' || (o.textAlign === 'left' && o.originX !== 'center') ? 'l' : o.originX === 'right' ? 'r' : 'c';
        const wk = k.r - k.l, room = ax === 'l' ? lim.r - k.l : ax === 'r' ? k.r - lim.l : 2 * Math.min((k.l + k.r) / 2 - lim.l, lim.r - (k.l + k.r) / 2);
        const f = Math.min(20 / (k.b - k.t), 1.34, room / wk);
        if (f <= 1.02) continue;
        const ob = box(o), ref = ax === 'l' ? ob.l : ax === 'r' ? ob.r : (ob.l + ob.r) / 2, ocy = (ob.t + ob.b) / 2;
        o.set({ scaleX: (o.scaleX || 1) * f, scaleY: (o.scaleY || 1) * f }); o.setCoords();
        const nb = box(o), now = ax === 'l' ? nb.l : ax === 'r' ? nb.r : (nb.l + nb.r) / 2;
        o.set({ left: o.left + (ref - now), top: o.top + (ocy - (nb.t + nb.b) / 2) }); o.setCoords();
        lib.log.push({ id, line: o.name, enlarged: +f.toFixed(2) });
      }
      /* a headline that runs onto a plate below it pushes the plate, and what stands on it,
         down by the overlap and a clear gap, where the room under the plate allows */
      for (const o of lines.filter(x => x.pgRole === 'headline')) {
        const k = inkOf(sc, [o], W, H); if (!k) continue;
        for (const P of plates) {
          if (P.i < objs.indexOf(o) && plateOf(o) === P) continue;
          if (!(k.l < P.b.r && k.r > P.b.l && k.b > P.b.t && k.t < P.b.t)) continue;
          const dy = k.b + Math.max(12, 0.12 * (k.b - k.t)) - P.b.t;
          const below = objs.filter((x, i) => x !== P.o && i !== objs.indexOf(o) && x.visible !== false && box(x).t >= P.b.b - 1 && box(x).l < P.b.r && box(x).r > P.b.l && !(x.pgBgRect || x.pgScrim));
          const room = Math.min(H - 32, ...below.map(x => box(x).t)) - P.b.b;
          if (dy <= 0) continue;
          if (dy > room - 8) {
            // no room under it: the headline line rises instead, if the gap over it allows
            const over = lines.filter(x => x !== o).map(x => ({ x, b: box(x) })).filter(q => q.b.b <= k.t + 2 && q.b.l < k.r && q.b.r > k.l);
            const k2 = over.length ? over.map(q => inkOf(sc, [q.x], W, H)).filter(Boolean) : [];
            const ceil = Math.max(32, ...k2.map(q => q.b + Math.max(12, 0.12 * (k.b - k.t))));
            if (k.t - dy >= ceil) { o.set('top', o.top - dy); o.setCoords(); lib.log.push({ id, line: o.name, plate: P.o.name || P.o.type, rose: Math.round(dy) }); }
            continue;
          }
          const riders = objs.filter((x, i) => i > P.i && x.visible !== false && (() => { const b = box(x), cx = (b.l + b.r) / 2, cy = (b.t + b.b) / 2; return cx >= P.b.l && cx <= P.b.r && cy >= P.b.t && cy <= P.b.b && x !== o; })());
          [P.o, ...riders].forEach(x => { x.set('top', x.top + dy); x.setCoords(); });
          P.b = box(P.o);
          lib.log.push({ id, line: o.name, plate: P.o.name || P.o.type, pushed: Math.round(dy) });
        }
      }
      plates = plates.map(p => ({ ...p, b: box(p.o) }));
      /* a loose line (badges, a kicker) that runs onto a plate it is not on steps off it,
         up or down, whichever side its middle is on, to a gap of a third of its type size,
         inside the card's 32px margin */
      for (const o of lines.filter(x => x.pgRole !== 'headline' && !plateOf(x))) {
        for (const P of plates) {
          const k = inkOf(sc, [o], W, H); if (!k) break;
          if (!(k.l < P.b.r - 1 && k.r > P.b.l + 1 && k.t < P.b.b - 1 && k.b > P.b.t + 1)) continue;
          const gap = Math.max(10, 0.33 * (o.fontSize || 30) * (o.scaleY || 1)), above = (k.t + k.b) / 2 < (P.b.t + P.b.b) / 2;
          const dy = above ? P.b.t - gap - k.b : P.b.b + gap - k.t;
          if (above ? k.t + dy < 32 : k.b + dy > H - 32) continue;
          o.set('top', o.top + dy); o.setCoords();
          lib.log.push({ id, line: o.name, plate: P.o.name || P.o.type, stepped: Math.round(dy) });
        }
      }
      for (const P of plates) {
        // what stands on it: drawn later, its middle on the plate, smaller than it, not another plate
        const on = objs.filter((o, i) => i > P.i && o.visible !== false && !plates.some(q => q.o === o) && (() => { const b = box(o), cx = (b.l + b.r) / 2, cy = (b.t + b.b) / 2;
          return cx >= P.b.l && cx <= P.b.r && cy >= P.b.t && cy <= P.b.b && (b.r - b.l) * (b.b - b.t) < (P.b.r - P.b.l) * (P.b.b - P.b.t); })());
        const words = on.filter(o => typeof o.text === 'string' && /[A-Za-z0-9]/.test(o.text));
        if (!words.length || words.some(o => o.pgRole === 'headline')) continue;   // a highlight bar is a slab
        // a plate holding another plate (a card with tiles) is a panel, not a box round its words
        if (plates.some(q => q !== P && q.i > P.i && q.b.l >= P.b.l - 1 && q.b.r <= P.b.r + 1 && q.b.t >= P.b.t - 1 && q.b.b <= P.b.b + 1)) continue;
        const U = inkOf(sc, on, W, H); if (!U) continue;
        const inkH = Math.max(...words.map(o => { const k = inkOf(sc, [o], W, H); return k ? k.b - k.t : 0; }));
        const needV = Math.max(12, 0.18 * inkH), needH = Math.max(14, 0.25 * inkH);
        let B = { ...P.b };
        const rad0 = Math.min(P.o.rx || 0, (B.r - B.l) / 2, (B.b - B.t) / 2);
        // over and under: centre the group; grow the plate when the group and its clearance do not fit
        if (U.t - B.t < needV || B.b - U.b < needV) {
          const want = (U.b - U.t) + 2 * needV;
          if (B.b - B.t < want) {
            const grow = want - (B.b - B.t), atBottom = B.b >= H - 1, atTop = B.t <= 1;
            const nt = atBottom ? B.t - grow : atTop ? B.t : B.t - grow / 2, nb = atBottom ? B.b : atTop ? B.b + grow : B.b + grow / 2;
            if (resize(P.o, B, nt, nb, B.l, B.r)) B = { ...B, t: nt, b: nb };
          }
          const dy = (B.t + B.b) / 2 - (U.t + U.b) / 2;
          if (Math.abs(dy) >= 1) { on.forEach(o => { o.set('top', o.top + dy); o.setCoords(); }); U.t += dy; U.b += dy; }
          lib.log.push({ id, plate: P.o.name || P.o.type, centred: Math.round(dy), grew: Math.round((B.b - B.t) - (P.b.b - P.b.t)) });
        }
        // the sides, line by line, at the plate's own outline
        for (const o of words) {
          const k = inkOf(sc, [o], W, H); if (!k) continue;
          const rad = Math.min(P.o.rx || 0, (B.r - B.l) / 2, (B.b - B.t) / 2);
          const inset = y => { const dy = Math.max(0, B.t + rad - y, y - (B.b - rad)); return dy >= rad ? rad : rad - Math.sqrt(rad * rad - dy * dy); };
          const side = Math.max(inset(k.t), inset(k.b));
          const c = Math.min(k.l - B.l - side, B.r - side - k.r), need = Math.max(14, 0.25 * (k.b - k.t));
          if (c >= need) continue;
          const short = need - c, room = Math.min(B.l - 32, W - 32 - B.r);
          if (room >= short && resize(P.o, B, B.t, B.b, B.l - short - rad0 * 0.2, B.r + short + rad0 * 0.2)) {
            B = { ...B, l: B.l - short - rad0 * 0.2, r: B.r + short + rad0 * 0.2 };
            lib.log.push({ id, plate: P.o.name || P.o.type, line: o.name, widened: Math.round(2 * short) });
          } else {
            const f = Math.max(0.88, 1 - 2 * short / Math.max(1, k.r - k.l));
            const cx = (k.l + k.r) / 2, cy = (k.t + k.b) / 2;
            o.set({ scaleX: (o.scaleX || 1) * f, scaleY: (o.scaleY || 1) * f }); o.setCoords();
            const nb = box(o); o.set({ left: o.left + (cx - (nb.l + nb.r) / 2), top: o.top + (cy - (nb.t + nb.b) / 2) }); o.setCoords();
            lib.log.push({ id, plate: P.o.name || P.o.type, line: o.name, scaled: +f.toFixed(2) });
          }
        }
      }
    };
    // after the studio's own layout and the card's look (the tagline bars applyCardLook draws
    // come after alignPass), on iPhones LA's copies only; renderThumb calls both by name
    const run = (sc, W, H) => { try { lib.finish(sc, W, H); } catch (e) { lib.log.push({ error: String(e).slice(0, 160) }); } };
    const align = window.alignPass, look = window.applyCardLook;
    window.alignPass = function (sc, W, H) { const r = align.apply(this, arguments); if (lib.on) { if (typeof look === 'function') sc.__libPending = [W, H]; else run(sc, W, H); } return r; };
    if (typeof look === 'function') window.applyCardLook = function (sc) { const r = look.apply(this, arguments); if (lib.on && sc.__libPending) { const [W, H] = sc.__libPending; sc.__libPending = null; run(sc, W, H); } return r; };
  }, LIBRARY_SITE, LIBRARY_SITE_PX);
}
