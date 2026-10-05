'use strict';
/* ═══════════════════════════════════════════════════════
   Ad library. One additive file, loaded after app.js and iphonesla-link.js.

   Owner, 2026-10-05: "when we save the ads on the site we can make a public
   library for iphones LA to access and auto post the we buy ads and auto
   repost them too".

   A download can be saved to the account's ad library (netlify/lib/
   adlibrary.mjs): the picture exactly as it was downloaded, as a JPEG, with
   the words on it and the category, for the poster to write the listing
   from. The library has one public link; whoever holds it (iPhones LA) reads
   the ads and which of them are due to post, and posts them again on the
   schedule set here. Nothing on this side posts anywhere.

   Rules this file keeps:
   - Nothing in app.js is edited. The one hook is a wrap around addHistory(),
     the function every download ends in, the same way iphonesla-link.js
     hooks it: the original runs first and nothing here throws into it.
   - What is saved is what was downloaded: the gated picture (size, watermark)
     addHistory was handed, never a fresh render.
   - A picture that shows a website, a QR code, a street address or a social
     handle, or carries the watermark, is saved but held from auto-post: the
     iPhones LA link's own check (iplaLink.refusal), so the two cannot differ.
   - This source is public. It holds no secret; the library link it shows is
     the account's, read from the server after sign-in.
   ═══════════════════════════════════════════════════════ */
(() => {
  const AUTO_KEY = 'pgfx_adlib_auto';          // localStorage: save every download
  const ASK_MS = 9000;                         // how long the "save it" card stays
  const MAX_SIDE = 2160;                       // what Pro downloads at most
  const MAX_CHARS = 5500000;                   // a base64 JPEG under the server's 4.2 MB
  const REPOST_LABEL = { 0: 'Once', 1: 'Every day', 2: 'Every 2 days', 3: 'Every 3 days', 5: 'Every 5 days', 7: 'Every week', 14: 'Every 2 weeks', 30: 'Every 30 days' };

  // ---------- app.js, read carefully: it may not have loaded ----------
  const app = {
    demo(){ try { return DEMO; } catch (e){ return true; } },
    account(){ try { return account; } catch (e){ return null; } },
    // the studio loads the account when Easy Mode first opens: a dialog
    // opened before that would say "sign in" to someone who is signed in
    async ensure(){ try { if (!account && getToken()) await loadAccount(); } catch (e){} },
    async call(path, body){ return api(path, body); },
    toast(msg, kind){ try { toast(msg, kind); } catch (e){} },
    auth(msg){ try { openAuth(msg); } catch (e){} },
    async history(){ try { return await histList(); } catch (e){ return []; } },
    template(id){ try { return TEMPLATES.find(t => t && t.id === id) || null; } catch (e){ return null; } },
  };
  const box = (() => { try { const s = window.localStorage, k = '__adlib_t'; s.setItem(k, '1'); s.removeItem(k); return s; } catch (e){ return null; } })();
  const autoOn = () => { try { return box && box.getItem(AUTO_KEY) === '1'; } catch (e){ return false; } };
  const setAuto = v => { try { if (box) v ? box.setItem(AUTO_KEY, '1') : box.removeItem(AUTO_KEY); } catch (e){} };

  const state = { lib: null, loading: false, error: '', last: null, queue: [], busy: false, askTimer: null, saved: {} };

  // ---------- what a download is ----------
  function hold(proj){
    try {
      const why = window.iplaLink && typeof window.iplaLink.refusal === 'function' ? window.iplaLink.refusal(proj) : '';
      if (!why) return '';
      if (/watermark/i.test(why)) return 'the watermark';
      const m = /shows (a [a-z ]+?)\./i.exec(why);
      if (m) return m[1];
      return 'unchecked';
    } catch (e){ return ''; }
  }
  function describe(name, proj){
    let g = null;
    try { g = window.iplaLink && window.iplaLink.graphicFor ? window.iplaLink.graphicFor(proj) : null; } catch (e){}
    const tplId = proj && (proj.tplId || (proj.st && proj.st.tpl)) || '';
    const tpl = app.template(tplId);
    const texts = (g && g.texts) || [];
    const head = texts.find(t => t.role === 'headline') || texts[0];
    const title = String((head && head.text) || (tpl && tpl.name) || (proj && proj.name) || name || 'Ad').slice(0, 80);
    return {
      title,
      category: (g && g.category) || (tpl && tpl.cat) || '',
      template: String(tplId || '').slice(0, 120),
      texts, products: (g && g.products) || [],
      hold: hold(proj),
    };
  }
  function jpeg(dataUrl){
    return new Promise(res => {
      const im = new Image();
      im.onload = () => {
        const draw = (side, q) => {
          const s = Math.min(1, side / Math.max(im.naturalWidth, im.naturalHeight));
          const cv = document.createElement('canvas');
          cv.width = Math.round(im.naturalWidth * s); cv.height = Math.round(im.naturalHeight * s);
          const cx = cv.getContext('2d');
          cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, cv.width, cv.height);   // a transparent corner goes white, not black
          cx.drawImage(im, 0, 0, cv.width, cv.height);
          return cv.toDataURL('image/jpeg', q);
        };
        let out = draw(MAX_SIDE, 0.9);
        if (out.length > MAX_CHARS) out = draw(MAX_SIDE, 0.8);
        if (out.length > MAX_CHARS) out = draw(1600, 0.85);
        res(out.length > MAX_CHARS ? null : out);
      };
      im.onerror = () => res(null);
      im.src = dataUrl;
    });
  }

  const heldLine = h => h === 'unchecked'
    ? 'Not auto-posted: it could not be checked for a website.'
    : 'Not auto-posted: it shows ' + h + '.';

  // ---------- the server ----------
  function ready(){
    if (app.demo()) return 'The ad library keeps your ads on the server, so it works on the hosted site, not in demo mode.';
    if (!app.account()) return 'signin';
    return '';
  }
  async function load(){
    if (ready()) { state.lib = null; draw(); return null; }
    state.loading = true; state.error = ''; draw();
    try { state.lib = await app.call('/ads/mine'); }
    catch (e){ state.error = e.message || 'The library did not load'; }
    state.loading = false; draw();
    return state.lib;
  }
  async function save(rec, quiet){
    const why = ready();
    if (why === 'signin'){ app.auth('Sign in to save ads to your library.'); return null; }
    if (why){ app.toast(why, 'error'); return null; }
    const image = await jpeg(rec.data);
    if (!image){ app.toast('This picture could not be saved: it is too large or could not be read', 'error'); return null; }
    const d = describe(rec.name, rec.proj);
    try {
      const repost = state.lib ? state.lib.repost_days : undefined;
      const r = await app.call('/ads/save', Object.assign({ image, repost_days: repost }, d));
      if (rec.id) state.saved[rec.id] = r.item.id;
      if (!quiet || r.duplicate || d.hold){
        app.toast(r.duplicate ? 'Already in your ad library'
          : d.hold ? 'Saved to your ad library. ' + heldLine(d.hold)
          : 'Saved to your ad library', r.duplicate ? '' : 'success');
      }
      if (state.lib) await load();
      return r.item;
    } catch (e){
      app.toast('Not saved to your ad library: ' + (e.message || 'try again'), 'error');
      return null;
    }
  }
  function enqueue(rec){
    state.queue.push(rec);
    if (state.queue.length > 5) state.queue.splice(0, state.queue.length - 5);
    pump();
  }
  async function pump(){
    if (state.busy || !state.queue.length) return;
    state.busy = true;
    const rec = state.queue.shift();
    try { await save(rec, true); } catch (e){}
    state.busy = false;
    pump();
  }
  async function update(id, patch){
    try {
      await app.call('/ads/update', Object.assign({ id }, patch));
      await load();
    } catch (e){ app.toast(e.message || 'Not changed', 'error'); await load(); }
  }

  // ---------- what the person sees ----------
  const CSS = `
.adl-ask{position:fixed;right:16px;bottom:16px;z-index:460;max-width:min(330px,calc(100vw - 32px));padding:14px 16px;border-radius:18px;border:.5px solid var(--glass-edge,rgba(255,255,255,.12));background:var(--surface-solid,#171a21);color:var(--text,#f2f4f8);box-shadow:var(--glass-shadow-lift,0 24px 60px -14px rgba(0,0,0,.75));font-size:14px;line-height:1.4}
.adl-ask b{display:block;margin-bottom:4px}
.adl-ask p{margin:0;color:var(--text-2,#c5cbd8)}
.adl-ask .adl-row{margin-top:10px}
.adl-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.adl-modal{max-width:880px!important;max-height:calc(100vh - 48px);overflow:auto}
.adl-modal h4{font-size:12px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--text-dim);margin:22px 0 8px}
.adl-link{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:12px;border-radius:14px;background:var(--surface-sunk,rgba(255,255,255,.05));border:1px solid var(--hairline,rgba(255,255,255,.08))}
.adl-link input{flex:1 1 260px;min-width:0;font:13px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace!important;padding:9px 11px!important}
.adl-set{display:flex;gap:10px 18px;flex-wrap:wrap;align-items:center;margin-top:10px;font-size:14px;color:var(--text-2)}
.adl-set select,.adl-card select{background:var(--surface-raise);color:var(--text);border:1px solid var(--hairline-strong,rgba(255,255,255,.16));border-radius:10px;padding:7px 9px;font:inherit;font-size:13.5px}
.adl-set input[type=text]{width:220px!important}
.adl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px}
.adl-card{display:flex;flex-direction:column;gap:7px;padding:9px;border-radius:14px;background:var(--surface-sunk,rgba(255,255,255,.05));border:1px solid var(--hairline,rgba(255,255,255,.08));font-size:13px;color:var(--text-2);min-width:0}
.adl-card img{width:100%;aspect-ratio:1;object-fit:contain;border-radius:9px;background:#0003;display:block}
.adl-card b{color:var(--text);font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.adl-card .adl-meta{font-size:12px;color:var(--text-dim)}
.adl-card .adl-hold{font-size:12px;color:var(--text);border-left:2px solid #ff6259;padding-left:7px}
.adl-card label.adl-tog{display:flex;gap:7px;align-items:center;margin:0;font-size:13px;font-weight:600;text-transform:none;letter-spacing:0;color:var(--text)}
.adl-card button.adl-x{background:none;border:none;color:var(--text-dim);font:inherit;font-size:12.5px;cursor:pointer;padding:0;text-align:left}
.adl-card button.adl-x:hover{color:var(--text)}
.adl-empty{padding:18px;border-radius:14px;border:1px dashed var(--hairline-strong,rgba(255,255,255,.16));color:var(--text-dim);font-size:14px}
.adl-note{font-size:13px;color:var(--text-dim);margin-top:8px;line-height:1.5}
`;
  let styled = false, overlay = null, ask = null;
  function el(tag, cls, txt){
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function btn(label, cls, fn){
    const b = el('button', 'btn ' + (cls || 'btn-outline'), label);
    b.type = 'button';
    b.onclick = e => { e.stopPropagation(); fn(b); };
    return b;
  }
  function style(){
    if (styled) return;
    const st = el('style'); st.textContent = CSS;
    (document.head || document.body).appendChild(st);
    styled = true;
  }
  async function copy(textv, what){
    try { await navigator.clipboard.writeText(textv); app.toast(what + ' copied', 'success'); }
    catch (e){ window.prompt('Copy the ' + what.toLowerCase(), textv); }
  }
  const when = isoStr => {
    if (!isoStr) return '';
    const ms = Date.parse(isoStr) - Date.now(), d = Math.round(Math.abs(ms) / 86400000), h = Math.round(Math.abs(ms) / 3600000);
    const span = d >= 1 ? d + (d === 1 ? ' day' : ' days') : h >= 1 ? h + (h === 1 ? ' hour' : ' hours') : 'a moment';
    return ms >= 0 ? 'in ' + span : span + ' ago';
  };

  function open(){
    style();
    if (!overlay){
      overlay = el('div', 'modal-overlay');
      overlay.id = 'adlib-overlay';
      overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
      document.body.appendChild(overlay);
    }
    overlay.classList.add('show');
    draw();
    app.ensure().then(load);
  }
  function close(){ if (overlay) overlay.classList.remove('show'); }

  function draw(){
    if (!overlay || !overlay.classList.contains('show')) return;
    const m = el('div', 'modal adl-modal');
    m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', 'Ad library');
    m.appendChild(el('h3', '', 'Ad library'));
    m.appendChild(el('div', 'modal-sub', 'Ads you save here get one public link. Give it to iPhones LA and it posts your WE BUY ads, then posts them again on the schedule you pick.'));
    const why = ready();
    if (why){
      m.appendChild(el('div', 'adl-empty', why === 'signin' ? 'Sign in to keep a library of your ads and share it.' : why));
      const row = el('div', 'modal-actions');
      if (why === 'signin') row.appendChild(btn('Sign in', 'btn-primary', () => { close(); app.auth('Sign in to save ads to your library.'); }));
      row.appendChild(btn('Close', 'btn-ghost', close));
      m.appendChild(row);
      return swap(m);
    }
    const lib = state.lib;
    if (!lib){
      m.appendChild(el('div', 'adl-empty', state.error ? 'The library did not load: ' + state.error : 'Loading your library…'));
      const row = el('div', 'modal-actions');
      if (state.error) row.appendChild(btn('Try again', 'btn-outline', load));
      row.appendChild(btn('Close', 'btn-ghost', close));
      m.appendChild(row);
      return swap(m);
    }

    // the public link
    m.appendChild(el('h4', '', 'Your public link'));
    const link = el('div', 'adl-link');
    const inp = el('input'); inp.type = 'text'; inp.readOnly = true; inp.value = lib.links.page; inp.setAttribute('aria-label', 'Your public library link');
    inp.onclick = () => inp.select();
    link.appendChild(inp);
    link.appendChild(btn('Copy link', 'btn-primary', () => copy(lib.links.page, 'Link')));
    const op = el('a', 'btn btn-outline', 'Open'); op.href = lib.links.page; op.target = '_blank'; op.rel = 'noopener';
    link.appendChild(op);
    m.appendChild(link);
    const feeds = el('div', 'adl-row'); feeds.style.marginTop = '8px';
    feeds.appendChild(btn('Copy the feed for auto-post (JSON)', 'btn-ghost', () => copy(lib.links.json, 'Feed link')));
    feeds.appendChild(btn('Copy RSS', 'btn-ghost', () => copy(lib.links.rss, 'RSS link')));
    feeds.appendChild(btn('Reset link', 'btn-ghost', async () => {
      if (!window.confirm('Make a new link? The old one stops working, so anyone using it (iPhones LA) needs the new one.')) return;
      try { await app.call('/ads/link/reset', {}); await load(); app.toast('New link made. Give it to iPhones LA.', 'success'); }
      catch (e){ app.toast(e.message || 'Not reset', 'error'); }
    }));
    m.appendChild(feeds);
    m.appendChild(el('div', 'adl-note', 'Anyone with the link can see these ads, and only these. Ads set to auto-post are listed when they are due, and again every time they come due.'));

    // settings
    const set = el('div', 'adl-set');
    const nm = el('input'); nm.type = 'text'; nm.value = lib.name || ''; nm.maxLength = 60; nm.setAttribute('aria-label', 'Library name');
    nm.onchange = async () => { try { await app.call('/ads/settings', { name: nm.value }); await load(); } catch (e){ app.toast(e.message, 'error'); } };
    const nmL = el('span', '', 'Name '); nmL.appendChild(nm); set.appendChild(nmL);
    const rp = el('select'); rp.setAttribute('aria-label', 'New ads post again');
    (lib.repost_choices || [0, 7]).forEach(n => { const o = el('option', '', REPOST_LABEL[n] || ('Every ' + n + ' days')); o.value = String(n); o.selected = n === lib.repost_days; rp.appendChild(o); });
    rp.onchange = async () => { try { await app.call('/ads/settings', { repost_days: Number(rp.value) }); await load(); } catch (e){ app.toast(e.message, 'error'); } };
    const rpL = el('span', '', 'New ads post '); rpL.appendChild(rp); set.appendChild(rpL);
    const au = el('label', 'adl-tog'); au.style.cssText = 'display:flex;gap:7px;align-items:center;margin:0;text-transform:none;letter-spacing:0;font-size:14px;font-weight:600;color:var(--text)';
    const auC = el('input'); auC.type = 'checkbox'; auC.checked = autoOn();
    auC.onchange = () => { setAuto(auC.checked); app.toast(auC.checked ? 'Every download is saved here now' : 'Downloads are no longer saved here by themselves'); };
    au.appendChild(auC); au.appendChild(document.createTextNode('Save every download here'));
    set.appendChild(au);
    m.appendChild(set);

    // the ads
    m.appendChild(el('h4', '', 'Saved ads (' + lib.count + ' of ' + lib.limit + ')'));
    if (!lib.items.length) m.appendChild(el('div', 'adl-empty', 'Nothing saved yet. Download an ad, then press "Save to library", or save one of your recent downloads below.'));
    else {
      const grid = el('div', 'adl-grid');
      lib.items.forEach(it => grid.appendChild(card(it, lib)));
      m.appendChild(grid);
    }

    // recent downloads
    const recent = el('div');
    m.appendChild(el('h4', '', 'Recent downloads'));
    m.appendChild(recent);
    app.history().then(recs => {
      if (!recs.length){ recent.appendChild(el('div', 'adl-empty', 'Your downloads on this device show here.')); return; }
      const grid = el('div', 'adl-grid');
      recs.forEach(r => {
        const c = el('div', 'adl-card');
        const im = el('img'); im.src = r.thumb || r.data; im.alt = r.name || 'Download'; im.loading = 'lazy';
        c.appendChild(im);
        c.appendChild(el('b', '', r.name || 'Download'));
        c.appendChild(el('span', 'adl-meta', (r.w || r.px) + ' × ' + (r.h || r.px) + ' · ' + new Date(r.ts).toLocaleDateString()));
        c.appendChild(state.saved[r.id] ? el('span', 'adl-meta', 'Saved ✓')
          : btn('Save to library', 'btn-outline', async b => { b.disabled = true; b.textContent = 'Saving…'; const it = await save({ id: r.id, name: r.name, data: r.data, proj: r.proj }); b.textContent = it ? 'Saved ✓' : 'Save to library'; b.disabled = !!it; }));
        grid.appendChild(c);
      });
      recent.appendChild(grid);
    });

    const row = el('div', 'modal-actions');
    const page = el('a', 'btn btn-ghost', 'Master library'); page.href = 'master-library.html'; page.target = '_blank'; page.rel = 'noopener';
    row.appendChild(page);
    row.appendChild(btn('Close', 'btn-ghost', close));
    m.appendChild(row);
    swap(m);
  }
  function card(it, lib){
    const c = el('div', 'adl-card');
    const im = el('img'); im.src = it.image.url; im.alt = it.title; im.loading = 'lazy';
    c.appendChild(im);
    c.appendChild(el('b', '', it.title));
    c.appendChild(el('span', 'adl-meta', [it.category, it.image.width + ' × ' + it.image.height, 'saved ' + when(it.created)].filter(Boolean).join(' · ')));
    if (it.hold){
      c.appendChild(el('span', 'adl-hold', heldLine(it.hold)));
    } else {
      const tog = el('label', 'adl-tog');
      const cb = el('input'); cb.type = 'checkbox'; cb.checked = it.autopost;
      cb.onchange = () => update(it.id, { autopost: cb.checked });
      tog.appendChild(cb); tog.appendChild(document.createTextNode('Auto-post'));
      c.appendChild(tog);
      const sel = el('select'); sel.setAttribute('aria-label', 'Post again');
      (lib.repost_choices || [0, 7]).forEach(n => { const o = el('option', '', REPOST_LABEL[n] || ('Every ' + n + ' days')); o.value = String(n); o.selected = n === it.repost_days; sel.appendChild(o); });
      sel.disabled = !it.autopost;
      sel.onchange = () => update(it.id, { repost_days: Number(sel.value) });
      c.appendChild(sel);
      if (it.post) c.appendChild(el('span', 'adl-meta', it.post.next_at ? 'Due now, then again ' + when(it.post.next_at) : 'Due now, once'));
    }
    const dl = el('a', 'adl-x', 'Download'); dl.href = it.image.url; dl.download = it.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.jpg';
    dl.style.cssText = 'font-size:12.5px;color:var(--text-dim)';
    const rm = el('button', 'adl-x', 'Remove'); rm.type = 'button';
    rm.onclick = async () => {
      if (!window.confirm('Remove "' + it.title + '" from your library? It stops being posted.')) return;
      try { await app.call('/ads/remove', { id: it.id }); Object.keys(state.saved).forEach(k => { if (state.saved[k] === it.id) delete state.saved[k]; }); await load(); }
      catch (e){ app.toast(e.message || 'Not removed', 'error'); }
    };
    const row = el('div', 'adl-row'); row.appendChild(dl); row.appendChild(rm);
    c.appendChild(row);
    return c;
  }
  function swap(m){
    overlay.textContent = '';
    overlay.appendChild(m);
  }

  // ---------- after a download ----------
  function offer(rec){
    style();
    if (ask && ask.parentNode) ask.parentNode.removeChild(ask);
    clearTimeout(state.askTimer);
    ask = el('div', 'adl-ask');
    ask.setAttribute('role', 'status');
    ask.appendChild(el('b', '', 'Save this ad to your library?'));
    ask.appendChild(el('p', '', 'Saved ads are on your public link, ready for iPhones LA to post.'));
    const row = el('div', 'adl-row');
    row.appendChild(btn('Save to library', 'btn-primary', async b => { b.disabled = true; b.textContent = 'Saving…'; await save(rec); dismiss(); }));
    row.appendChild(btn('Always save', 'btn-ghost', () => { setAuto(true); enqueue(rec); dismiss(); }));
    row.appendChild(btn('Not now', 'btn-ghost', dismiss));
    ask.appendChild(row);
    document.body.appendChild(ask);
    state.askTimer = setTimeout(dismiss, ASK_MS);
    ask.addEventListener('pointerenter', () => clearTimeout(state.askTimer));
  }
  function dismiss(){
    clearTimeout(state.askTimer);
    if (ask && ask.parentNode) ask.parentNode.removeChild(ask);
    ask = null;
  }
  function downloaded(name, dataUrl, proj){
    if (typeof dataUrl !== 'string' || dataUrl.slice(0, 11) !== 'data:image/') return;
    const rec = { name, data: dataUrl, proj: proj || null };
    state.last = rec;
    // the history record addHistory just wrote, so "Recent downloads" can show it saved
    app.history().then(rs => { const r = rs.find(x => x.name === name && x.data === dataUrl); if (r) rec.id = r.id; });
    if (ready()) return;                  // signed out or demo: say nothing after every download
    if (autoOn()) enqueue(rec);
    else offer(rec);
  }

  // ---------- the one hook ----------
  function hook(){
    const original = window.addHistory;
    if (typeof original !== 'function' || original.__adlib) return false;
    const wrapped = function(name, px, dataUrl, w, h, proj){
      let result, failed = false, error;
      try { result = original.apply(this, arguments); }
      catch (e){ failed = true; error = e; }
      try { setTimeout(() => downloaded(name, dataUrl, proj), 0); } catch (e){}
      if (failed) throw error;
      return result;
    };
    wrapped.__adlib = true;
    // keep the marks of a wrap already there (iphonesla-link.js checks its own)
    Object.keys(original).forEach(k => { try { wrapped[k] = original[k]; } catch (e){} });
    window.addHistory = wrapped;
    return true;
  }

  function bind(){
    ['nav-adlib', 'tb-adlib', 'am-adlib'].forEach(id => {
      const b = document.getElementById(id);
      if (!b) return;
      b.addEventListener('click', e => {
        e.stopPropagation();
        document.querySelectorAll('.view-drop.open').forEach(x => x.classList.remove('open'));
        open();
      });
    });
  }

  hook();
  bind();
  window.adLibrary = { open, close, load, save: rec => save(rec), state: () => ({ lib: state.lib, error: state.error, auto: autoOn(), queued: state.queue.length, last: !!state.last }) };
})();
