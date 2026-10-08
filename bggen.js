'use strict';
/* ═══════════════ AI BACKGROUND GENERATOR (the modal) ═══════════════
   One additive file, loaded after app.js and ad-library.js. app.js's
   openBgGen() hands over to BGGEN.open().

   Owner, 2026-10-08: "make sure we can configure this fully … all of our
   iPhones as entities so you can configure which devices you want, or you
   pick a category … they can choose through assets they want in it, whether
   it's car models etc." Then "styles, color schemes … configurable and
   accurate … choose an amount of generations, and it'll show your credits at
   the bottom, live, so you can see a cost per generation", and "tokens or
   credits".

   What a customer picks here is labels and ids only: a category, up to four
   products from assets/bggen-entities.json (the shop's own photographs,
   which the server hands the image model as references), a style, a colour
   scheme, a format, where the text goes, and how many. The words that turn
   those into a prompt are the server's (netlify/lib/bggen.mjs) and never come
   to the browser. A run of N images is N requests in parallel: each lands,
   and is charged, on its own, and the balance in the footer follows each one.

   Operators (role admin) also see the exact prompt a request would send, the
   provider's price, and in the AI Studio console the recipe editor and the
   credit grant. */
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const say = (msg, kind) => { try { if (typeof toast === 'function') return toast(msg, kind); } catch (e) {} };
  const apiBase = () => (typeof API_BASE === 'string' ? API_BASE : '/api');
  const isDemo = () => typeof DEMO !== 'undefined' && DEMO;
  const token = () => { try { return typeof getToken === 'function' ? getToken() : null; } catch (e) { return null; } };
  const signedIn = () => typeof account !== 'undefined' && !!account;
  const operator = () => { try { return typeof isAdmin === 'function' && isAdmin(); } catch (e) { return false; } };
  const asset = (p) => (typeof assetUrl === 'function' ? assetUrl(p) : p);
  const FMT_ASPECT = { square: '1:1', story: '9:16', flyer: '3:4', landscape: '16:9', four3: '4:3', three4: '3:4' };
  const PAGE = 60;  // tiles drawn at once; "Show more" draws the next lot

  const S = {
    cfg: null, cfgAt: 0, cat: null, category: 'phones', tab: null, q: '', shown: PAGE,
    picked: [],  // { group, id, finish|null }
    style: 'auto', palette: 'auto', colors: ['#111111', '#ff7a1a', '#fafaf9'],
    aspect: '1:1', space: 'top', count: 1, running: 0, bound: false,
  };

  async function call(path, body) {
    const r = await fetch(apiBase() + path, {
      method: body ? 'POST' : 'GET',
      headers: Object.assign({ 'Content-Type': 'application/json' }, token() ? { Authorization: 'Bearer ' + token() } : {}),
      body: body ? JSON.stringify(body) : undefined,
    });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, j };
  }
  async function loadConfig(force) {
    if (isDemo()) return null;
    if (!force && S.cfg && Date.now() - S.cfgAt < 30000) return S.cfg;
    try {
      const r = await call('/bggen/config');
      if (r.ok) { S.cfg = r.j; S.cfgAt = Date.now(); }
    } catch (e) { /* offline: keep what we had */ }
    return S.cfg;
  }
  async function loadCatalogue() {
    if (S.cat) return S.cat;
    const r = await fetch(asset('assets/bggen-entities.json'));
    if (!r.ok) throw new Error('catalogue ' + r.status);
    return (S.cat = await r.json());
  }

  // ---------- what is picked ----------
  const keyOf = (p) => p.group + ':' + p.id;
  const itemOf = (group, id) => {
    const g = S.cat && S.cat.groups[group];
    return g ? g.items.find((x) => x.id === id) : null;
  };
  const finishOf = (it, f) => (it && f ? (it.finishes || []).find((x) => x.id === f) : null);
  const entityIds = () => S.picked.map((p) => keyOf(p) + (p.finish ? '@' + p.finish : ''));
  const withRefs = () => S.picked.some((p) => { const it = itemOf(p.group, p.id); return it && (it.ref || (it.finishes || []).length); });

  function cost() {
    const c = S.cfg || {};
    const per = withRefs() ? (c.costRef ?? 0) : (c.cost ?? 0);
    return { per, n: S.count, total: per * S.count, unit: c.unit || 'credits', refs: withRefs() };
  }

  // ---------- drawing ----------
  function cats() {
    const list = (typeof CATS !== 'undefined' && Array.isArray(CATS)) ? CATS : Object.keys(S.cat.categories).map((id) => ({ id, label: id }));
    return list.filter((c) => S.cat.categories[c.id]);
  }
  function drawCats() {
    $('bggen-cats').innerHTML = cats().map((c) => `<button type="button" class="chip${c.id === S.category ? ' on' : ''}" data-cat="${esc(c.id)}" aria-pressed="${c.id === S.category}">${esc(c.label)}</button>`).join('');
  }
  function drawTabs() {
    const gs = S.cat.categories[S.category] || [];
    if (!gs.includes(S.tab)) S.tab = gs[0] || null;
    $('bggen-tabs').innerHTML = gs.map((g) => {
      const n = S.picked.filter((p) => p.group === g).length;
      return `<button type="button" role="tab" class="bggen-tab${g === S.tab ? ' on' : ''}" aria-selected="${g === S.tab}" data-tab="${esc(g)}">${esc(S.cat.groups[g].label)}${n ? ` <span class="bggen-n">${n}</span>` : ''}</button>`;
    }).join('');
  }
  function tileName(label) {
    const [name, ...rest] = String(label).split(' · ');
    return `<span class="bggen-name">${esc(name)}</span>${rest.length ? `<span class="bggen-sub">${esc(rest.join(' · '))}</span>` : ''}`;
  }
  function drawGrid() {
    const g = S.cat.groups[S.tab];
    const grid = $('bggen-grid');
    if (!g) { grid.innerHTML = '<div class="bggen-empty">No products for this category yet. Describe what you want below.</div>'; $('bggen-search').hidden = true; return; }
    const searchable = g.search || g.items.length > 30;
    $('bggen-search').hidden = !searchable;
    const words = searchable ? S.q.toLowerCase().split(/\s+/).filter(Boolean) : [];
    const items = g.items.filter((it) => words.every((w) => (it.label + ' ' + (it.brand || '')).toLowerCase().includes(w)));
    const shown = items.slice(0, S.shown);
    grid.innerHTML = shown.map((it) => {
      const k = S.tab + ':' + it.id;
      const on = S.picked.some((p) => keyOf(p) === k);
      const p = S.picked.find((x) => keyOf(x) === k);
      const fin = finishOf(it, p && p.finish) || finishOf(it, it.default_finish);
      const thumb = (fin && fin.thumb) || it.thumb;
      const pic = thumb ? `<img src="${esc(asset(thumb))}" alt="" loading="lazy" decoding="async">` : `<span class="bggen-emoji" aria-hidden="true">${esc(it.emoji || '✦')}</span>`;
      return `<button type="button" role="option" class="bggen-tile${on ? ' on' : ''}" aria-selected="${on}" data-k="${esc(k)}" title="${esc(it.label)}${thumb ? '' : ' (named in the prompt, no photo)'}">`
        + `<span class="bggen-thumb">${pic}${it.hot ? '<span class="bggen-hot">Popular</span>' : ''}${(it.finishes || []).length ? `<span class="bggen-fins">${it.finishes.length} finish${it.finishes.length === 1 ? '' : 'es'}</span>` : ''}</span>${tileName(it.label)}</button>`;
    }).join('') + (items.length > shown.length ? `<button type="button" class="bggen-more-tiles" data-more="1">Show ${Math.min(PAGE, items.length - shown.length)} more of ${items.length - shown.length}</button>` : '')
      + (!items.length ? '<div class="bggen-empty">Nothing matches that search.</div>' : '');
  }
  function drawPicked() {
    const box = $('bggen-picked');
    if (!S.picked.length) { box.innerHTML = ''; return; }
    box.innerHTML = S.picked.map((p, i) => {
      const it = itemOf(p.group, p.id);
      if (!it) return '';
      const fin = finishOf(it, p.finish);
      const thumb = (fin && fin.thumb) || it.thumb;
      const sw = (it.finishes || []).map((f) => `<button type="button" class="bggen-sw${p.finish === f.id ? ' on' : ''}" style="--c:${esc(f.hex || '#999')}" data-i="${i}" data-fin="${esc(f.id)}" title="${esc(f.label)}" aria-label="${esc(f.label)}" aria-pressed="${p.finish === f.id}"></button>`).join('');
      const canPlain = (it.finishes || []).length && it.thumb && !it.default_finish;
      return `<span class="bggen-pick">${thumb ? `<img src="${esc(asset(thumb))}" alt="">` : `<span class="bggen-emoji" aria-hidden="true">${esc(it.emoji || '✦')}</span>`}`
        + `<span class="bggen-pick-name">${esc(it.label.split(' · ')[0])}${fin ? ` <em>${esc(fin.label)}</em>` : ''}</span>`
        + (sw ? `<span class="bggen-sws" role="group" aria-label="Finish">${canPlain ? `<button type="button" class="bggen-sw bggen-sw-any${!p.finish ? ' on' : ''}" data-i="${i}" data-fin="" title="As pictured" aria-label="As pictured" aria-pressed="${!p.finish}"></button>` : ''}${sw}</span>` : '')
        + `<button type="button" class="bggen-unpick" data-i="${i}" aria-label="Remove ${esc(it.label)}">✕</button></span>`;
    }).join('');
  }
  function drawLooks() {
    const c = S.cfg;
    const styles = c ? c.styles : [];
    const pals = c ? c.palettes : [];
    if (c && !styles.some((s) => s.id === S.style)) S.style = (styles[0] || {}).id || 'auto';
    if (c && !pals.some((s) => s.id === S.palette)) S.palette = 'auto';
    $('bggen-styles').innerHTML = styles.length ? styles.map((s) => `<button type="button" class="chip${s.id === S.style ? ' on' : ''}" data-style="${esc(s.id)}" aria-pressed="${s.id === S.style}">${s.emoji ? esc(s.emoji) + ' ' : ''}${esc(s.label)}</button>`).join('')
      : '<span class="bggen-hint">Styles load with the hosted site.</span>';
    $('bggen-pals').innerHTML = pals.map((p) => {
      const cols = p.id === 'custom' ? S.colors : (p.colors || []);
      const dots = cols.length ? cols.map((h) => `<i style="background:${esc(h)}"></i>`).join('') : '<i class="bggen-dot-nat"></i>';
      return `<button type="button" class="chip bggen-pal${p.id === S.palette ? ' on' : ''}" data-pal="${esc(p.id)}" aria-pressed="${p.id === S.palette}"><span class="bggen-dots" aria-hidden="true">${dots}</span>${esc(p.label)}</button>`;
    }).join('');
    $('bggen-custom').hidden = S.palette !== 'custom';
    const asp = c ? c.aspects : [{ id: '1:1', label: 'Square' }];
    if (!asp.some((a) => a.id === S.aspect)) S.aspect = asp[0].id;
    $('bggen-aspect').innerHTML = asp.map((a) => `<option value="${esc(a.id)}"${a.id === S.aspect ? ' selected' : ''}>${esc(a.label)}</option>`).join('');
    const sp = c ? c.spaces : [{ id: 'top', label: 'Top' }];
    if (!sp.some((a) => a.id === S.space)) S.space = sp[0].id;
    $('bggen-space').innerHTML = sp.map((a) => `<option value="${esc(a.id)}"${a.id === S.space ? ' selected' : ''}>${esc(a.label)}</option>`).join('');
    const max = c ? c.maxPerRun : 1;
    S.count = Math.max(1, Math.min(S.count, max));
    $('bggen-count').innerHTML = Array.from({ length: max }, (_, i) => `<button type="button" class="${i + 1 === S.count ? 'active' : ''}" data-n="${i + 1}" aria-pressed="${i + 1 === S.count}">${i + 1}</button>`).join('');
  }
  const when = (iso) => { try { return new Date(iso + 'T00:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }); } catch (e) { return iso; } };
  function drawFoot() {
    const c = S.cfg;
    const k = cost();
    const a = c && c.account;
    const go = $('bggen-go');
    let blocked = '';
    if (isDemo()) blocked = 'AI backgrounds need the hosted site';
    else if (!c) blocked = 'AI backgrounds are unavailable right now';
    else if (!c.enabled) blocked = 'AI backgrounds are not enabled yet';
    else if (!signedIn()) blocked = 'Sign in to generate';
    const plural = (n, w) => n + ' ' + (n === 1 ? w.replace(/s$/, '') : w);
    let costTxt = c ? `<b>${plural(k.total, k.unit)}</b> · ${plural(k.n, 'images')} × ${k.per}${k.refs ? ' (with products)' : ''}` : '–';
    if (c && c.usd !== undefined) costTxt += ` · ≈ $${((k.refs ? c.usdRef : c.usd) * k.n).toFixed(2)} at ${esc(c.provider || 'the provider')}`;
    let bal = blocked || '–';
    let pct = 0;
    if (!blocked && a) {
      if (a.unlimited) { bal = 'Operator · unlimited'; pct = 1; }
      else {
        bal = `${a.left} of ${a.allowance} ${esc(a.unit)} left · resets ${esc(when(a.resets))}`;
        pct = a.allowance ? a.left / a.allowance : 0;
        if (k.total > a.left) blocked = a.left ? `Not enough ${a.unit}: lower the count` : `Out of ${a.unit} this month`;
      }
    }
    $('bggen-cost').innerHTML = costTxt;
    $('bggen-cost').classList.toggle('short', !!blocked && !!a && !a.unlimited && k.total > a.left);
    $('bggen-bal').textContent = bal;
    $('bggen-meter').style.width = Math.round(Math.max(0, Math.min(1, pct)) * 100) + '%';
    $('bggen-meter').parentNode.classList.toggle('low', pct < 0.2);
    go.disabled = !!blocked && blocked !== 'Sign in to generate';
    go.dataset.blocked = blocked;
    go.textContent = S.running ? `… Generating ${S.running} left` : blocked && go.disabled ? blocked
      : `✦ Generate ${plural(S.count, 'images')}${c ? ' · ' + plural(k.total, k.unit) : ''}`;
    if (S.running) go.disabled = true;
    previewSoon();
  }
  function drawAll() { drawCats(); drawTabs(); drawGrid(); drawPicked(); drawLooks(); drawFoot(); }

  // ---------- operator preview ----------
  let pvT = 0;
  function previewSoon() {
    const d = $('bggen-preview');
    d.hidden = !operator();
    if (d.hidden || !d.open) return;
    clearTimeout(pvT);
    pvT = setTimeout(async () => {
      const r = await call('/admin/bggen-preview', body()).catch(() => null);
      $('bggen-preview-text').textContent = r && r.ok ? r.j.prompt + (r.j.refs.length ? '\n\nReferences: ' + r.j.refs.join(', ') : '') + '\n\nProvider: ' + r.j.provider + ' · cost ' + r.j.cost
        : 'Preview unavailable' + (r && r.j.error ? ': ' + r.j.error : '');
    }, 350);
  }

  // ---------- the request ----------
  function body() {
    return {
      text: $('bggen-prompt').value, category: S.category, entities: entityIds(),
      style: S.style, palette: S.palette, colors: S.palette === 'custom' ? S.colors : undefined,
      aspect: S.aspect, space: S.space,
    };
  }
  function nameOf() {
    const t = $('bggen-prompt').value.trim();
    if (t) return t.slice(0, 40);
    const p = S.picked.map((x) => (itemOf(x.group, x.id) || {}).label).filter(Boolean).join(', ');
    return (p || 'AI background').slice(0, 40);
  }
  /** an answer's picture as a data URL: inline, or (past the function's size) fetched from the provider's link */
  function materialize(j) {
    if (j.image) return Promise.resolve(j.image);
    if (!j.url) return Promise.reject(new Error('bad-response'));
    return new Promise((res) => {
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = () => {
        try {
          const cv = document.createElement('canvas');
          cv.width = im.naturalWidth; cv.height = im.naturalHeight;
          cv.getContext('2d').drawImage(im, 0, 0);
          res(cv.toDataURL('image/jpeg', 0.92));
        } catch (e) { res(j.url); }
      };
      im.onerror = () => res(j.url);
      im.src = j.url;
    });
  }
  function card(ratio) {
    const el = document.createElement('div');
    el.className = 'bggen-card busy';
    el.style.setProperty('--ar', ratio.replace(':', ' / '));
    el.innerHTML = '<div class="bggen-img"><span class="bggen-spin" aria-hidden="true"></span><span class="bggen-state">Generating…</span></div>';
    return el;
  }
  function done(el, url, name) {
    el.className = 'bggen-card';
    el.innerHTML = `<div class="bggen-img"><img alt="Generated background" src="${esc(url)}"></div>`
      + '<div class="bggen-acts"><button type="button" data-a="use">Use</button><button type="button" data-a="save">＋ Save</button>'
      + '<button type="button" data-a="dl" aria-label="Download">⬇</button><button type="button" data-a="share" aria-label="Share with the community">🌐</button></div>';
    el.dataset.name = name;
    el._url = url;
  }
  function fail(el, msg, refunded) {
    el.className = 'bggen-card err';
    el.querySelector('.bggen-img').innerHTML = `<span class="bggen-state">${esc(msg || 'Generation failed')}${refunded ? '<br><small>Not charged</small>' : ''}</span>`;
  }
  async function run() {
    const go = $('bggen-go');
    if (go.dataset.blocked === 'Sign in to generate' || !signedIn()) {
      if (typeof openAuth === 'function') openAuth('Sign in to generate AI backgrounds', () => open());
      return;
    }
    if (go.disabled) return;
    const n = S.count, req = body(), name = nameOf();
    const box = $('bggen-results');
    const cards = Array.from({ length: n }, () => card(req.aspect));
    const row = document.createElement('div');
    row.className = 'bggen-run';
    cards.forEach((c) => row.appendChild(c));
    box.prepend(row);
    row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    S.running += n;
    drawFoot();
    await Promise.all(cards.map(async (el) => {
      try {
        const r = await call('/generate-bg', req);
        if (r.j && r.j.credits && S.cfg) S.cfg.account = r.j.credits;
        if (!r.ok) {
          fail(el, r.j.error || ('HTTP ' + r.status), r.j.refunded);
          if (r.status === 401 && typeof openAuth === 'function') openAuth('Sign in to generate AI backgrounds', () => open());
        } else done(el, await materialize(r.j), name);
      } catch (e) { fail(el, 'Network error, not charged'); }
      S.running--;
      drawFoot();
    }));
  }

  // ---------- results ----------
  async function act(el, a) {
    const url = el._url;
    if (!url) return;
    const name = el.dataset.name || 'AI background';
    if (a === 'use') {
      if (typeof applyBgAnywhere === 'function') applyBgAnywhere(url);
      close();
    } else if (a === 'save') {
      try {
        const data = typeof downscaleDataUrl === 'function' ? await downscaleDataUrl(url, 2160) : url;
        const thumb = typeof downscaleDataUrl === 'function' ? await downscaleDataUrl(url, 240) : url;
        if (typeof bgPut !== 'function') throw new Error('the library is unavailable');
        await bgPut({ id: 'bg-' + Date.now(), name, data, thumb, ts: Date.now(), kind: 'library' });
        if (typeof refreshBgLibrary === 'function') refreshBgLibrary();
        say('Saved to library', 'success');
      } catch (e) { say('Could not save: ' + e.message, 'error'); }
    } else if (a === 'share') {
      if (typeof publishGenerated === 'function') publishGenerated(url, name);
    } else if (a === 'dl') {
      const l = document.createElement('a');
      l.href = url;
      l.download = name.replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() + '.jpg';
      document.body.appendChild(l); l.click(); l.remove();
    }
  }

  // ---------- open / close ----------
  function editorAspect() {
    try {
      const easy = $('page-easy') && $('page-easy').classList.contains('active');
      const f = easy ? (typeof ez !== 'undefined' && ez.format) : (typeof docFormat !== 'undefined' && docFormat);
      return FMT_ASPECT[f] || '1:1';
    } catch (e) { return '1:1'; }
  }
  async function open(opts) {
    opts = opts || {};
    if (!signedIn() && !isDemo()) {
      if (typeof openAuth === 'function') openAuth('Sign in to generate AI backgrounds', () => open(opts));
      return;
    }
    bind();
    const ov = $('bggen-overlay');
    ov.classList.add('show');
    if (opts.text) $('bggen-prompt').value = opts.text;
    S.aspect = editorAspect();
    try {
      await loadCatalogue();
    } catch (e) {
      $('bggen-grid').innerHTML = '<div class="bggen-empty">The product list did not load. You can still describe the scene.</div>';
    }
    if (S.cat) {
      const cur = typeof currentCat !== 'undefined' ? currentCat : 'phones';
      if (!S.opened) S.category = S.cat.categories[cur] ? cur : 'phones';
      S.opened = true;
    }
    S.cfg = await loadConfig(true);
    if (S.cat) drawAll(); else { drawLooks(); drawFoot(); }
    setTimeout(() => $('bggen-prompt').focus({ preventScroll: true }), 60);
  }
  function close() { $('bggen-overlay').classList.remove('show'); }

  function toggle(k) {
    const [group, id] = k.split(':');
    const i = S.picked.findIndex((p) => keyOf(p) === k);
    if (i >= 0) S.picked.splice(i, 1);
    else {
      const max = (S.cfg && S.cfg.maxEntities) || 4;
      if (S.picked.length >= max) { say('Up to ' + max + ' products in one scene', 'error'); return; }
      const it = itemOf(group, id);
      S.picked.push({ group, id, finish: it && it.default_finish ? it.default_finish : null });
    }
    drawTabs(); drawGrid(); drawPicked(); drawFoot();
  }

  function bind() {
    if (S.bound) return;
    S.bound = true;
    $('bggen-x').onclick = close;
    $('bggen-close').onclick = close;
    $('bggen-overlay').addEventListener('mousedown', (e) => { if (e.target === e.currentTarget) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('bggen-overlay').classList.contains('show')) close(); });
    $('bggen-cats').onclick = (e) => {
      const b = e.target.closest('[data-cat]'); if (!b) return;
      S.category = b.dataset.cat; S.tab = null; S.q = ''; S.shown = PAGE; $('bggen-search').value = '';
      drawCats(); drawTabs(); drawGrid(); drawFoot();
    };
    $('bggen-tabs').onclick = (e) => {
      const b = e.target.closest('[data-tab]'); if (!b) return;
      S.tab = b.dataset.tab; S.q = ''; S.shown = PAGE; $('bggen-search').value = '';
      drawTabs(); drawGrid();
    };
    $('bggen-search').oninput = (e) => { S.q = e.target.value; S.shown = PAGE; drawGrid(); };
    $('bggen-grid').onclick = (e) => {
      if (e.target.closest('[data-more]')) { S.shown += PAGE; drawGrid(); return; }
      const t = e.target.closest('[data-k]'); if (t) toggle(t.dataset.k);
    };
    $('bggen-picked').onclick = (e) => {
      const sw = e.target.closest('[data-fin]');
      if (sw) { const p = S.picked[+sw.dataset.i]; if (p) { p.finish = sw.dataset.fin || null; drawGrid(); drawPicked(); drawFoot(); } return; }
      const x = e.target.closest('.bggen-unpick');
      if (x) { S.picked.splice(+x.dataset.i, 1); drawTabs(); drawGrid(); drawPicked(); drawFoot(); }
    };
    $('bggen-styles').onclick = (e) => { const b = e.target.closest('[data-style]'); if (b) { S.style = b.dataset.style; drawLooks(); drawFoot(); } };
    $('bggen-pals').onclick = (e) => { const b = e.target.closest('[data-pal]'); if (b) { S.palette = b.dataset.pal; drawLooks(); drawFoot(); } };
    ['bggen-c1', 'bggen-c2', 'bggen-c3'].forEach((id, i) => { $(id).oninput = (e) => { S.colors[i] = e.target.value; drawLooks(); drawFoot(); }; });
    $('bggen-aspect').onchange = (e) => { S.aspect = e.target.value; drawFoot(); };
    $('bggen-space').onchange = (e) => { S.space = e.target.value; drawFoot(); };
    $('bggen-count').onclick = (e) => { const b = e.target.closest('[data-n]'); if (b) { S.count = +b.dataset.n; drawLooks(); drawFoot(); } };
    $('bggen-prompt').oninput = () => previewSoon();
    $('bggen-go').onclick = run;
    $('bggen-results').onclick = (e) => { const b = e.target.closest('[data-a]'); if (b) act(b.closest('.bggen-card'), b.dataset.a); };
    $('bggen-preview').addEventListener('toggle', previewSoon);
  }

  // ---------- the operator console: recipe, grants ----------
  function bindAdmin() {
    const box = $('bggen-admin');
    if (!box) return;
    const status = (t, bad) => { $('bggen-admin-status').textContent = t; $('bggen-admin-status').style.color = bad ? 'var(--danger, #e5484d)' : ''; };
    box.addEventListener('toggle', async () => {
      if (!box.open) return;
      const r = await call('/admin/bggen-recipe').catch(() => null);
      if (!r || !r.ok) { status('Could not load the recipe' + (r && r.j.error ? ': ' + r.j.error : ''), true); return; }
      $('bggen-admin-json').value = r.j.override ? JSON.stringify(r.j.override, null, 2) : '';
      status('Provider: ' + (r.j.provider || 'none (set FAL_KEY or GEMINI_KEY)') + ' · ' + (r.j.override ? 'your override is live' : 'built-in recipe live'));
    });
    $('bggen-admin-base').onclick = async () => {
      const r = await call('/admin/bggen-recipe').catch(() => null);
      if (!r || !r.ok) return status('Could not load the recipe', true);
      $('bggen-admin-json').value = JSON.stringify(r.j.base, null, 2);
      status('The built-in recipe, shown for reference. Keep only what you change, then Save: everything you leave out stays built-in.');
    };
    $('bggen-admin-save').onclick = async () => {
      const raw = $('bggen-admin-json').value.trim();
      let override = null;
      if (raw) { try { override = JSON.parse(raw); } catch (e) { return status('Not valid JSON: ' + e.message, true); } }
      const r = await call('/admin/bggen-recipe', { override }).catch(() => null);
      if (!r || !r.ok) return status('Not saved: ' + ((r && r.j.error) || 'network error'), true);
      S.cfgAt = 0;
      status(override ? 'Saved. Live for customers within a minute.' : 'Cleared. The built-in recipe is live.');
    };
    $('bggen-grant-go').onclick = async () => {
      const email = $('bggen-grant-email').value.trim();
      const credits = Number($('bggen-grant-n').value);
      if (!email) return status('Type the account email first', true);
      const r = await call('/admin/bggen-grant', { email, credits }).catch(() => null);
      if (!r || !r.ok) return status('Not added: ' + ((r && r.j.error) || 'network error'), true);
      const a = r.j.account;
      status(`${email}: ${a.left} of ${a.allowance} ${a.unit} left this month (${a.grant} added by operators).`);
    };
  }

  window.BGGEN = { open, close, materialize, cost, state: S };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindAdmin); else bindAdmin();
})();
