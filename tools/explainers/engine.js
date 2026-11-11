/* The explainer videos' engine.

   A video is a list of scenes; a scene is a list of parts, each with the time
   it comes in. seek(id, t) draws the one frame that belongs at second t, from
   nothing but t: no CSS animation, no timer, no state carried from the frame
   before. That is what lets render.mjs photograph the frames one by one into
   an MP4 (a recording in real time drops frames whenever the machine is busy,
   the reason the studio's own video export is frame by frame too), and what
   lets the same page play live in a browser for a look before rendering.

   The words are in videos.js. Every number said there is the product's own
   (FACTS at its head, checked against netlify/lib/plans.mjs by check.mjs). */
(function () {
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const eo = t => 1 - Math.pow(1 - t, 3);
  const back = t => { const c = 1.55, c3 = c + 1; return 1 + c3 * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const pr = (t, s, d) => clamp((t - s) / d);
  const el = (tag, cls, html, style) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (style) Object.assign(e.style, style); return e; };
  /* [[words]] take the marigold highlighter, {{words}} the white one (on a coloured ground) */
  const fmt = s => String(s).replace(/\[\[(.+?)\]\]/g, '<mark>$1</mark>').replace(/\{\{(.+?)\}\}/g, '<mark class="w">$1</mark>').replace(/\n/g, '<br>');
  const C = { ink: '#141414', paper: '#f2eee4', panel: '#fffdf8', blue: '#2b56f5', tomato: '#ff4a2e', gold: '#ffc21a', mint: '#12b886' };

  class Scene {
    constructor(dur, bg) {
      this.dur = dur; this.bg = bg || C.paper;
      this.dark = [C.ink, C.blue].includes(this.bg);
      this.root = el('div', 'scene' + (this.dark ? ' dark' : ''));
      this.root.style.background = this.bg;
      this.items = []; this.fns = []; this.fits = [];
    }
    /* o: x y w h (stage pixels), rot, at (seconds into the scene), dur, fx
       (up down left right pop fade none), out (when it leaves) */
    put(node, o = {}) {
      const s = node.style; s.position = 'absolute';
      if (o.x != null) s.left = o.x + 'px'; if (o.y != null) s.top = o.y + 'px';
      if (o.w != null) s.width = o.w + 'px'; if (o.h != null) s.height = o.h + 'px';
      if (o.z != null) s.zIndex = o.z;
      this.root.appendChild(node);
      this.items.push({ node, o: Object.assign({ at: 0, dur: .5, fx: 'up', rot: 0 }, o) });
      return node;
    }
    text(str, o = {}) {
      const n = el('div', 't ' + (o.cls || ''), fmt(str));
      n.style.fontSize = (o.size || 64) + 'px';
      if (o.color) n.style.color = o.color; if (o.align) n.style.textAlign = o.align;
      this.put(n, o);
      if (o.w && !/\bbody\b/.test(o.cls || '')) this.fits.push({ n, w: o.w, size: o.size || 64 });
      const at = (o.at || 0) + .18;
      n.querySelectorAll('mark').forEach((m, i) => this.fn(t => m.style.setProperty('--m', eo(pr(t, at + i * .12, .42)).toFixed(3))));
      return n;
    }
    img(src, o = {}) { const n = el('div', 'card ' + (o.cls || '')); const i = el('img'); i.src = src; n.appendChild(i); return this.put(n, o); }
    chip(str, o = {}) { const n = el('div', 'chip ' + (o.cls || ''), str); if (o.bg) n.style.background = o.bg; if (o.color) n.style.color = o.color; if (o.size) n.style.fontSize = o.size + 'px'; return this.put(n, o); }
    box(html, o = {}) { const n = el('div', 'box ' + (o.cls || ''), html || ''); if (o.bg) n.style.background = o.bg; return this.put(n, o); }
    node(cls, html, o = {}) { return this.put(el('div', cls, html), o); }
    /* a blue ring that opens where a finger lands */
    tap(x, y, at) { const n = el('div', 'tap'); n.style.position = 'absolute'; n.style.zIndex = 9; this.root.appendChild(n);
      return this.fn(t => { const p = pr(t, at, .55), r = 20 + eo(p) * 70; n.style.cssText += `;left:${x - r}px;top:${y - r}px;width:${r * 2}px;height:${r * 2}px;opacity:${p <= 0 || p >= 1 ? 0 : 1 - p * p}`; }); }
    fn(f) { this.fns.push(f); return this; }
    /* a headline is never wider than its column: the face is wide, so a long
       line takes a smaller size rather than a cut-off word */
    fit() { for (const f of this.fits) { let s = f.size; f.n.style.fontSize = s + 'px'; while (f.n.scrollWidth > f.w + 1 && s > 26) { s -= 2; f.n.style.fontSize = s + 'px'; } } }
    update(t) {
      for (const { node, o } of this.items) {
        const p = pr(t, o.at, o.dur), e = o.fx === 'pop' ? back(p) : eo(p);
        let op = clamp(p * 2.6), tr = '';
        if (o.fx === 'up') tr = `translateY(${(1 - e) * 70}px)`;
        else if (o.fx === 'down') tr = `translateY(${-(1 - e) * 70}px)`;
        else if (o.fx === 'left') tr = `translateX(${-(1 - e) * 170}px)`;
        else if (o.fx === 'right') tr = `translateX(${(1 - e) * 170}px)`;
        else if (o.fx === 'pop') { tr = `scale(${.5 + .5 * e})`; op = clamp(p * 4); }
        else if (o.fx === 'fade') op = p;
        else if (o.fx === 'none') op = t >= o.at ? 1 : 0;
        if (o.out != null) { const q = pr(t, o.out, .28); op *= 1 - q; tr += ` translateY(${-eo(q) * 36}px)`; }
        node.style.opacity = op.toFixed(3);
        node.style.transform = `${tr} rotate(${o.rot}deg)`;
        node.style.visibility = op <= .002 ? 'hidden' : 'visible';
      }
      for (const f of this.fns) f(t);
    }
  }

  const stage = () => document.getElementById('stage');
  const VIDEOS = {};
  let built = null;
  function define(id, meta, make) { VIDEOS[id] = { id, meta, make, scenes: null }; }
  function build(id) {
    const v = VIDEOS[id]; if (!v) throw new Error('no video ' + id);
    const st = stage();
    st.querySelectorAll('.scene').forEach(n => n.remove());
    v.scenes = v.make(); v.total = v.scenes.reduce((a, s) => a + s.dur, 0);
    v.scenes.forEach(s => { st.appendChild(s.root); s.root.style.display = 'block'; s.fit(); s.root.style.display = 'none'; });
    built = id; return v;
  }
  const WIPE = .26;   // a new scene rises over the last one
  function seek(id, t) {
    const v = built === id ? VIDEOS[id] : build(id);
    t = clamp(t, 0, v.total - 1e-4);
    let i = 0, t0 = 0;
    while (i < v.scenes.length - 1 && t >= t0 + v.scenes[i].dur) { t0 += v.scenes[i].dur; i++; }
    const local = t - t0, cur = v.scenes[i], prev = i > 0 && local < WIPE ? v.scenes[i - 1] : null;
    v.scenes.forEach(s => { s.root.style.display = s === cur || s === prev ? 'block' : 'none'; s.root.style.zIndex = s === cur ? 2 : 1; });
    if (prev) { prev.update(prev.dur); cur.root.style.clipPath = `inset(${((1 - eo(local / WIPE)) * 100).toFixed(2)}% 0 0 0)`; }
    else cur.root.style.clipPath = 'none';
    cur.update(local);
    stage().classList.toggle('dark', cur.dark && !(prev && local < WIPE * .6));
    document.querySelector('#bar b').style.width = (t / v.total * 100).toFixed(2) + '%';
    return v.total;
  }
  const ready = () => Promise.all([document.fonts.ready, ...['800 80px Unbounded', '700 40px "Clash Display"', '700 40px Satoshi', '900 40px Satoshi', '400 40px "DM Mono"'].map(f => document.fonts.load(f))])
    .then(() => Promise.all([...document.images].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; }))));

  window.EX = { Scene, define, seek, build, ready, C, el, pr, eo, back, clamp, VIDEOS,
    info: () => Object.values(VIDEOS).map(v => ({ id: v.id, ...v.meta })) };

  /* stage.html?v=<id> plays it; &t=<seconds> holds one frame; &render=1 waits for render.mjs */
  window.addEventListener('DOMContentLoaded', async () => {
    const q = new URLSearchParams(location.search), id = q.get('v') || Object.keys(VIDEOS)[0];
    build(id); await ready(); build(id); await ready();
    window.EX.total = VIDEOS[id].total; window.EX.isReady = true;
    if (q.get('render')) return;
    document.body.classList.add('live');
    const k = Math.min(1, innerWidth / 1080, innerHeight / 1080); stage().style.transform = `scale(${k})`; stage().style.margin = `0 ${-(1 - k) * 1080}px ${-(1 - k) * 1080}px 0`;
    if (q.get('t') != null) { seek(id, parseFloat(q.get('t'))); return; }
    const t0 = performance.now(); (function tick() { seek(id, ((performance.now() - t0) / 1000) % VIDEOS[id].total); requestAnimationFrame(tick); })();
  });
})();
