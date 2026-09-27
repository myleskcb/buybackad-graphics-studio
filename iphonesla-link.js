'use strict';
/* ═══════════════════════════════════════════════════════
   iPhones LA link. One additive file, loaded after app.js.

   The shop's Auto-post page opens this studio with a one-time connect code in
   the URL fragment. This file trades the code for an upload token, and from
   then on every finished export is also sent to the shop's WE BUY picture
   library, where it lands UNSELECTED: a person over there still decides what an
   ad uses. Nothing in app.js is edited. The only hook is a wrap around
   addHistory(), the one function every download ends in.

   Rules this file keeps, each of them on purpose:
   - The API origin is written down once, below, and nothing a link carries can
     change it. A fragment is whatever the person who made the link typed.
   - The fragment is read and cleared before anything else runs, so the code
     never sits in the address bar, in history or in a screenshot.
   - No cookie ever crosses (credentials: 'omit'), and the token goes to the two
     studio routes only.
   - An upload can fail in any way it likes and the download still happens: the
     original addHistory runs first and nothing here throws into it.
   - A WE BUY picture may show the shop's phone number: people have to be able
     to reach the shop from the picture alone, so the number is welcome and the
     templates set it big (owner's call, 2026-09-26; before that a number was
     refused). A website, a QR code, a street address or a social handle is
     still not sent, and a watermarked export is no use to the shop. The note
     says why in plain words rather than refusing quietly.
   - This source is public (the site is a folder upload). It holds no secret.
   ═══════════════════════════════════════════════════════ */
(() => {
  const API = 'https://iphones.la';
  const EXCHANGE = API + '/api/buy-ads/studio/exchange';
  const IMAGES = API + '/api/buy-ads/studio/images';
  const BRIEF = API + '/api/buy-ads/studio/brief';
  const BACK = API + '/repost#configurator';

  const LINK_KEY = 'ipla_link';      // localStorage: {token, connectedAt}
  const BRIEF_KEY = 'ipla_verified_brief'; // sessionStorage: accepted after exchange, for this tab only
  const OPEN_KEY = 'ipla_open';      // sessionStorage: is the note open

  const CODE_RE = /^gfxc_[A-Za-z0-9_-]{16,160}$/;
  const TOKEN_RE = /^gfx_[A-Za-z0-9_-]{16,200}$/;
  const HARD_MAX_BYTES = 8 * 1024 * 1024;   // the server answers 413 past this
  const SHRINK_TO = 1600;                   // the server keeps 1600px anyway
  const MAX_QUEUE = 5;                      // blobs are big: keep a handful, never a pile
  const MAX_TRIES = 4;
  const BACKOFF_MS = [5000, 30000, 120000];
  const TOAST_AFTER_MS = 1500;              // app.js toasts "downloaded" right after addHistory returns

  const UPLOAD_TIMEOUT_MS = 90000;
  const CAPS = { family: 20, target: 120, angle: 30, tone: 20, headline: 200, area: 60 };
  const PHONE_RE = /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}(?!\d)/;
  const SITE_RE = /(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.[a-z]{2,24}\b|\b[a-z0-9-]+\s+\.\s*[a-z]{2,24}\b|\b[a-z0-9-]+\.\s+(?:com|net|org|la|ad|co|io|us|biz|info|shop|store)\b/i;
  const LOCAL_PHONE_RE = /(?:^|\D)\d{3}[ .-]\d{4}(?!\d)/;
  const VANITY_RE = /\b(?:1[ .-]?)?8(?:00|33|44|55|66|77|88)[ .-]+[a-z][a-z .-]{5,}/i;
  const HANDLE_RE = /(?:^|\s)@[a-z0-9_.]+|\b(?:ig|instagram|facebook|tiktok|snapchat)\s*:\s*\S+/i;
  const ADDRESS_RE = /\b\d{1,6}\s+(?:[a-z0-9.-]+\s+){1,5}(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|court|ct)\b/i;

  // ---------- storage that cannot throw ----------
  function box(kind){
    try {
      const s = window[kind], k = '__ipla_t';
      s.setItem(k, '1'); s.removeItem(k);
      return s;
    } catch (e){
      const m = {};
      return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } };
    }
  }
  const local = box('localStorage');
  const session = box('sessionStorage');
  const readJson = (s, k) => { try { const v = s.getItem(k); return v == null ? null : JSON.parse(v); } catch (e){ return null; } };
  const writeJson = (s, k, v) => { try { s.setItem(k, JSON.stringify(v)); } catch (e){} };
  const drop = (s, k) => { try { s.removeItem(k); } catch (e){} };
  // Older versions saved code-less URL briefs. Never restore those as verified tags.
  drop(session, 'ipla_brief');

  function text(v, cap){
    if (typeof v !== 'string') return '';
    return v.replace(/[\x00-\x1f\x7f]/g, ' ').trim().slice(0, cap);
  }

  // ---------- the fragment: read and clear on every navigation ----------
  function takeFragment(){
    let raw = '';
    try { raw = String(location.hash || ''); } catch (e){ return {}; }
    if (raw.charAt(0) === '#') raw = raw.slice(1);
    if (!/(^|&)(ipla|brief)=/.test(raw)) return {};   // somebody else's anchor: leave it alone
    try { history.replaceState(null, '', location.pathname + location.search); }
    catch (e){ try { location.hash = ''; } catch (e2){} }
    const out = {};
    raw.split('&').forEach(pair => {
      const i = pair.indexOf('=');
      if (i < 1) return;
      const k = pair.slice(0, i);
      // Two keys are read and no others. There is no key for an API address, a
      // path or an origin, which is the whole of how a link cannot move them.
      if ((k !== 'ipla' && k !== 'brief') || k in out) return;
      try { out[k] = decodeURIComponent(pair.slice(i + 1)); } catch (e){}
    });
    return out;
  }

  function decodeBrief(b64){
    if (typeof b64 !== 'string' || !b64 || b64.length > 6000) return null;
    try {
      let s = b64.replace(/-/g, '+').replace(/_/g, '/');
      while (s.length % 4) s += '=';
      const bin = atob(s);
      let json = bin;
      try {
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        json = new TextDecoder().decode(bytes);
      } catch (e){}
      return cleanBrief(JSON.parse(json));
    } catch (e){ return null; }
  }

  // "Back to Auto-post" goes to the shop and nowhere else, whatever the link said.
  function safeReturn(v){
    try {
      const u = new URL(String(v));
      if (u.origin === API && !u.username && !u.password) return u.href;
    } catch (e){}
    return '';
  }

  // Everything in a brief is data off a URL. It is trimmed, capped, shown with
  // textContent only, and the server checks every tag again.
  function cleanBrief(obj){
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
    const b = {};
    Object.keys(CAPS).forEach(k => { const v = text(obj[k], CAPS[k]); if (v) b[k] = v; });
    if (Array.isArray(obj.models)){
      const m = obj.models.map(x => text(x, 80)).filter(Boolean).slice(0, 12);
      if (m.length) b.models = m;
    }
    const ret = safeReturn(obj.return);
    if (ret) b.return = ret;
    return Object.keys(b).length ? b : null;
  }

  function readLink(){
    const v = readJson(local, LINK_KEY);
    return (v && typeof v.token === 'string' && TOKEN_RE.test(v.token))
      ? { token: v.token, connectedAt: text(v.connectedAt, 40) } : null;
  }

  const state = {
    link: readLink(),
    brief: readLink() ? cleanBrief(readJson(session, BRIEF_KEY)) : null,
    connecting: false, connectVersion: 0,
    note: '', noteKind: '',
    queue: [], busy: false, timer: null,
    maxBytes: HARD_MAX_BYTES,
    open: readJson(session, OPEN_KEY) === true,
  };

  // ---------- what the person sees ----------
  function say(msg, kind, quiet){
    state.note = msg; state.noteKind = kind || '';
    if (kind === 'error') setOpen(true);
    render();
    if (quiet) return;
    // app.js toasts its own "downloaded" line the moment addHistory returns, and
    // one toast replaces another, so ours waits its turn.
    try {
      setTimeout(() => { try { if (typeof toast === 'function') toast(msg, kind); } catch (e){} }, TOAST_AFTER_MS);
    } catch (e){}
  }
  function setOpen(v){ state.open = !!v; writeJson(session, OPEN_KEY, state.open); }

  const CSS = [
    '.ipla{position:fixed;left:16px;bottom:16px;z-index:450;max-width:min(340px,calc(100vw - 32px));font-size:13px;line-height:1.4;color:var(--text,#f2f4f8)}',
    '.ipla-pill{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:var(--r-pill,999px);border:.5px solid var(--glass-edge,rgba(255,255,255,.12));background:var(--surface-solid,#171a21);color:inherit;font:inherit;font-weight:600;cursor:pointer;box-shadow:var(--glass-shadow,0 14px 38px -12px rgba(0,0,0,.6))}',
    '.ipla-dot{width:8px;height:8px;border-radius:50%;background:var(--text-dim,#8b94a7)}',
    '.ipla-dot.on{background:#30d68f}.ipla-dot.bad{background:#ff6259}',
    '.ipla-card{margin-bottom:8px;padding:14px 16px;border-radius:var(--r-lg,18px);border:.5px solid var(--glass-edge,rgba(255,255,255,.12));background:var(--surface-solid,#171a21);box-shadow:var(--glass-shadow-lift,0 24px 60px -14px rgba(0,0,0,.75))}',
    '.ipla-card b{display:block;font-size:14px;margin-bottom:4px}',
    '.ipla-card p{margin:6px 0 0;color:var(--text-2,#c5cbd8)}',
    '.ipla-card p.bad{color:var(--text,#f2f4f8);border-left:2px solid #ff6259;padding-left:8px}',
    '.ipla-card p.ok{color:var(--text,#f2f4f8);border-left:2px solid #30d68f;padding-left:8px}',
    '.ipla-row{display:flex;flex-wrap:wrap;gap:12px;margin-top:10px}',
    '.ipla-row a,.ipla-row button{font:inherit;font-weight:600;color:var(--accent,#ff7a1a);background:none;border:none;padding:0;cursor:pointer;text-decoration:none}',
    '.ipla-row button.dim{color:var(--text-dim,#8b94a7)}',
  ].join('\n');

  const ui = { root: null, styled: false };
  function el(tag, cls, txt){
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function briefLine(b){
    const bits = [b.target || b.family, b.area, b.angle, b.tone].filter(Boolean);
    return bits.join(', ');
  }
  function render(){
    try { draw(); } catch (e){}
  }
  function draw(){
    if (typeof document === 'undefined' || !document.body) return;
    if (ui.root && ui.root.parentNode) ui.root.parentNode.removeChild(ui.root);
    ui.root = null;
    // Not connected, no brief, nothing to say: this file shows nothing at all.
    if (!state.link && !state.brief && !state.connecting && !state.note) return;
    if (!ui.styled){
      const st = el('style'); st.textContent = CSS;
      (document.head || document.body).appendChild(st);
      ui.styled = true;
    }
    const root = el('div', 'ipla');
    if (state.open){
      const card = el('div', 'ipla-card');
      card.appendChild(el('b', '', state.connecting ? 'Connecting to iPhones LA'
        : state.link ? 'Connected to iPhones LA' : 'Not connected to iPhones LA'));
      if (state.link) card.appendChild(el('p', '', 'Exports go to your iPhones LA library. Pick them in Auto-post.'));
      else if (!state.connecting) card.appendChild(el('p', '', 'Nothing is sent. Open the studio from Auto-post to connect.'));
      if (state.brief && briefLine(state.brief)) card.appendChild(el('p', '', 'Making: ' + briefLine(state.brief)));
      if (state.brief && state.brief.headline) card.appendChild(el('p', '', 'Headline: ' + state.brief.headline));
      if (state.link || state.brief){
        // Said up front, not after the fact: the number is what lets people reach
        // the shop, and the other contact lines are what a WE BUY picture cannot carry.
        card.appendChild(el('p', '', 'Your phone number goes on the picture, big enough to read in a feed. No website, QR code, street address or social handle. Checks are best-effort; review the finished picture, including text in images.'));
        card.appendChild(el('p', '', 'Sign in as an admin. Watermarked exports are not sent.'));
      }
      if (state.note) card.appendChild(el('p', state.noteKind === 'error' ? 'bad' : state.noteKind === 'success' ? 'ok' : '', state.note));
      if (state.queue.length) card.appendChild(el('p', '', state.queue.length === 1 ? '1 picture waiting to send.' : state.queue.length + ' pictures waiting to send.'));
      const row = el('div', 'ipla-row');
      const back = el('a', '', 'Back to Auto-post');
      back.href = (state.brief && state.brief.return) || BACK;
      back.setAttribute('rel', 'noopener');
      back.setAttribute('target', '_blank');
      row.appendChild(back);
      if (state.queue.length && !state.busy){
        const again = el('button', '', 'Try again now');
        again.onclick = () => retryNow();
        row.appendChild(again);
      }
      if (state.brief){
        const clr = el('button', 'dim', 'Clear tags');
        clr.onclick = () => { state.brief = null; drop(session, BRIEF_KEY); say('Tags cleared. Exports are sent without them.', '', true); };
        row.appendChild(clr);
      }
      if (state.link){
        const off = el('button', 'dim', 'Disconnect');
        off.onclick = () => disconnect();
        row.appendChild(off);
      }
      card.appendChild(row);
      root.appendChild(card);
    }
    const pill = el('button', 'ipla-pill');
    pill.setAttribute('type', 'button');
    pill.setAttribute('aria-expanded', state.open ? 'true' : 'false');
    pill.appendChild(el('span', 'ipla-dot' + (state.noteKind === 'error' ? ' bad' : state.link ? ' on' : '')));
    pill.appendChild(el('span', '', 'iPhones LA'));
    pill.onclick = () => { setOpen(!state.open); render(); };
    root.appendChild(pill);
    document.body.appendChild(root);
    ui.root = root;
    place();
  }
  // The editor's left panel is a scrolling column of controls, and a pill fixed
  // over its foot sits on whichever control scrolled there. In the editor the
  // pill moves to the empty foot of the stage instead. Read off the page's own
  // elements: no app.js global is involved, and a page without them changes nothing.
  function place(){
    try {
      if (!ui.root || !ui.root.style) return;
      let left = 16;
      const ed = document.getElementById('page-editor'), stage = document.getElementById('stage');
      if (ed && stage && ed.classList.contains('active')){
        const r = stage.getBoundingClientRect();
        if (r.width > 320) left = Math.max(16, Math.round(r.left) + 16);
      }
      ui.root.style.left = left + 'px';
    } catch (e){}
  }

  // ---------- connect ----------
  function deviceLabel(){
    let ua = '';
    try { ua = String(navigator.userAgent || ''); } catch (e){}
    const os = /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS X/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows'
      : /Android/.test(ua) ? 'Android' : /Linux/.test(ua) ? 'Linux' : '';
    const br = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox'
      : /Safari\//.test(ua) ? 'Safari' : '';
    const where = [br, os].filter(Boolean).join(' on ');
    return ('Graphics Studio' + (where ? ', ' + where : '')).slice(0, 60);
  }
  const sentence = j => (j && typeof j.detail === 'string' && j.detail.length <= 200) ? j.detail : '';

  // One try, never a retry: the code is single-use and the fragment is already
  // gone. A person whose exchange failed clicks Generate in Auto-post again.
  async function exchange(code, brief, version){
    state.connecting = true; setOpen(true); render();
    let msg = '', ok = false;
    try {
      const r = await fetch(EXCHANGE, {
        method: 'POST', mode: 'cors', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, label: deviceLabel() }),
      });
      const j = await r.json().catch(() => ({}));
      if (version !== state.connectVersion) return;
      if (r.ok && j && typeof j.token === 'string' && TOKEN_RE.test(j.token)){
        state.link = { token: j.token, connectedAt: new Date().toISOString() };
        writeJson(local, LINK_KEY, state.link);
        state.brief = brief;
        if (brief) writeJson(session, BRIEF_KEY, brief);
        ok = true;
      } else {
        msg = sentence(j) || 'That link did not work. Open the studio from Auto-post again.';
      }
    } catch (e){
      msg = 'Could not reach iPhones LA. Open the studio from Auto-post again.';
    }
    if (version !== state.connectVersion) return;
    state.connecting = false;
    if (ok) say('Connected to iPhones LA', 'success');
    else say(msg, 'error');
  }

  // A link kept from an earlier visit may have been revoked since. Ask once per
  // load, so the person hears it before designing rather than after exporting.
  async function checkLink(){
    const token = state.link && state.link.token;
    if (!token) return;
    try {
      const r = await fetch(BRIEF, {
        method: 'GET', mode: 'cors', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer',
        headers: { Authorization: 'Bearer ' + token },
      });
      if (!state.link || state.link.token !== token || state.connecting) return;
      if (r.status === 401){ forget('iPhones LA ended this connection. Open the studio from Auto-post to connect again.'); return; }
      if (!r.ok) return;
      const j = await r.json().catch(() => ({}));
      const cap = j && j.limits && j.limits.max_upload_bytes;
      // The server may LOWER the ceiling. It cannot raise it past what this file knows.
      if (typeof cap === 'number' && cap >= 100000 && cap < HARD_MAX_BYTES) state.maxBytes = Math.floor(cap);
    } catch (e){}
  }

  function clearBrief(){ state.brief = null; drop(session, BRIEF_KEY); }
  function forget(msg){
    state.connectVersion++; state.connecting = false; clearBrief();
    state.link = null;
    drop(local, LINK_KEY);
    state.queue.length = 0;
    try { clearTimeout(state.timer); } catch (e){}
    state.timer = null;
    say(msg, 'error');
  }
  function disconnect(){
    state.connectVersion++; state.connecting = false; clearBrief();
    state.link = null;
    drop(local, LINK_KEY);
    state.queue.length = 0;
    try { clearTimeout(state.timer); } catch (e){}
    state.timer = null;
    say('Disconnected. Nothing more is sent. To end the link for good, use Auto-post.', '', true);
  }

  // ---------- is this picture one the shop can use ----------
  // app.js globals are read by bare name inside try/catch: `account` and
  // `TEMPLATES` are let/const, so a typeof on them throws if app.js died early.
  function watermarked(){
    let acct;
    try { acct = account; } catch (e){ return false; }        // cannot tell
    if (!acct) return false;                                  // cannot tell
    if (acct.role === 'admin') return false;                  // gateExport: operators get no watermark
    try { return !!planOf().watermark; } catch (e){ return false; }
  }
  function templateById(id){
    try { return TEMPLATES.find(t => t && t.id === id) || null; } catch (e){ return null; }
  }
  // Every kind of contact line. The tag file leaves all of them out: the words
  // are for writing the ad, and the shop knows its own number.
  function contactIn(s){
    if (typeof s !== 'string' || !s) return '';
    if (PHONE_RE.test(s.replace(/(\d)\s+(?=\d)/g, '$1')) || LOCAL_PHONE_RE.test(s) || VANITY_RE.test(s)) return 'a phone number';
    return blockedIn(s);
  }
  // The contact lines a picture may NOT carry. A phone number is not one of them.
  function blockedIn(s){
    if (typeof s !== 'string' || !s) return '';
    if (SITE_RE.test(s)) return 'a website';
    if (HANDLE_RE.test(s)) return 'a social handle';
    if (ADDRESS_RE.test(s)) return 'a street address';
    return '';
  }
  // Easy Mode: what renderEzCanvas will have drawn, from the project snapshot.
  function contactInEasy(st){
    const tpl = st && templateById(st.tpl);
    if (!tpl || !Array.isArray(tpl.layers)) return 'unknown';
    const hidden = (st.hidden && st.hidden[tpl.id]) || [];
    const vals = (st.vals && st.vals[tpl.id]) || {};
    // Hidden badge layers are synthesized again by renderEzCanvas.
    const badges = tpl.layers.find(l => l && l.role === 'badges');
    const chips = Array.isArray(st.chips) ? st.chips : [badges && badges.text];
    for (const chip of chips){ const hit = blockedIn(chip); if (hit) return hit; }
    let site = 'typed';
    try { const f = document.getElementById('ez-website'); if (f) site = String(f.value || '').trim(); } catch (e){}
    for (const l of tpl.layers){
      if (!l || hidden.indexOf(l.name) >= 0 || l.role === 'badges') continue;
      if (l.role === 'website'){ if (site) return 'a website'; continue; }   // a phone line is welcome, and still read for a site below
      if (l.kind !== 'text' && l.kind !== 'textbox') continue;
      const hit = blockedIn(vals[l.name] !== undefined ? String(vals[l.name]) : l.text);
      if (hit) return hit;
    }
    return '';
  }
  // Advanced editor: the fabric JSON that was on the canvas.
  function contactInCanvas(json){
    if (!json || !Array.isArray(json.objects)) return '';
    const stack = json.objects.slice();
    while (stack.length){
      const o = stack.pop();
      if (!o || o.visible === false) continue;
      if (!o.pgCurved && Array.isArray(o.objects)) stack.push(...o.objects);
      if (o.pgRole === 'qr') return 'a QR code';
      const words = typeof o.text === 'string' ? o.text : (o.pgCurved && typeof o.pgCurved.text === 'string' ? o.pgCurved.text : '');
      const has = words.trim();
      if (o.pgRole === 'website' && has) return 'a website';  // a phone line is welcome, and still read for a site below
      const hit = blockedIn(words);
      if (hit) return hit;
    }
    return '';
  }
  function refusal(proj){
    if (watermarked()) return 'Not sent to iPhones LA: this export has a watermark. Sign in as an admin and export again.';
    // Print orders pass no project, so there is nothing to check for a website.
    if (!proj) return 'Not sent to iPhones LA: a print order is not checked for a website. Use Download instead.';
    let found = '';
    if (proj.kind === 'ez'){
      found = contactInEasy(proj.st);
      if (found === 'unknown') return 'Not sent to iPhones LA: this Easy Mode design could not be checked for a website. Use the Advanced editor.';
    } else {
      found = contactInCanvas(proj.json);
    }
    if (found) return 'Not sent to iPhones LA: this picture shows ' + found + '. Remove it and export again.';
    return '';
  }

  // ---------- upload ----------
  function toBlob(dataUrl){
    try {
      const m = /^data:(image\/(?:png|jpeg));base64,/.exec(dataUrl.slice(0, 40));
      if (!m) return null;
      const bin = atob(dataUrl.slice(m[0].length));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new Blob([bytes], { type: m[1] });
    } catch (e){ return null; }
  }
  function fileName(name, type){
    const stem = text(String(name || ''), 120).toLowerCase().replace(/\.(png|jpe?g)$/, '').replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
    return (stem || 'studio-export') + (type === 'image/jpeg' ? '.jpg' : '.png');
  }
  // ---------- what is IN the picture ----------
  // The tag file: the words drawn on it and the products placed on it, read
  // off the same records the export was drawn from. The shop names the
  // devices from the product slugs and writes the ad from them, so a graphic
  // that says CONSOLE BUYER over two consoles arrives already described.
  // Contact lines never reach this: the phone layer is skipped by role and any
  // line that holds a number is dropped, and refusal() stopped the rest.
  const SKIP_ROLES = { phone: 1, website: 1, qr: 1, deco: 1, frame: 1 };
  function slugOf(src){
    const m = /([a-z0-9][a-z0-9-]{0,79})\.(?:webp|png|jpe?g)(?:[?#].*)?$/i.exec(String(src || ''));
    return m ? m[1].toLowerCase() : '';
  }
  function pushText(out, role, words){
    const t = text(String(words || ''), 200);
    if (!t || out.texts.length >= 24 || contactIn(t)) return;
    out.texts.push({ role: text(String(role || 'text'), 20), text: t });
  }
  function pushProduct(out, src){
    const slug = slugOf(src);
    if (slug && out.products.length < 24) out.products.push(slug);
  }
  function graphicFor(proj){
    if (!proj) return null;
    const out = { v: 1, category: '', template: '', texts: [], products: [] };
    try {
      if (proj.kind === 'ez'){
        const st = proj.st || {};
        const tpl = templateById(st.tpl);
        if (!tpl || !Array.isArray(tpl.layers)) return null;
        out.template = text(String(tpl.id || ''), 120);
        out.category = text(String(tpl.cat || ''), 30);
        const hidden = (st.hidden && st.hidden[tpl.id]) || [];
        const vals = (st.vals && st.vals[tpl.id]) || {};
        tpl.layers.forEach(l => {
          if (!l || hidden.indexOf(l.name) >= 0 || SKIP_ROLES[l.role]) return;
          if (l.kind === 'cutout') return pushProduct(out, l.props && l.props.src);
          if (l.role === 'badges') return (Array.isArray(st.chips) ? st.chips : [l.text]).forEach(c => pushText(out, 'badge', c));
          if (l.kind === 'text' || l.kind === 'textbox') pushText(out, l.role, vals[l.name] !== undefined ? vals[l.name] : l.text);
        });
      } else if (proj.json && Array.isArray(proj.json.objects)){
        const tpl = templateById(proj.tplId);
        out.template = text(String(proj.tplId || ''), 120);
        out.category = text(String((tpl && tpl.cat) || ''), 30);
        const stack = proj.json.objects.slice().reverse();
        while (stack.length){
          const o = stack.pop();
          if (!o || o.visible === false || SKIP_ROLES[o.pgRole]) continue;
          if (!o.pgCurved && Array.isArray(o.objects)){ stack.push(...o.objects.slice().reverse()); continue; }
          if (typeof o.type === 'string' && /image/i.test(o.type)){ pushProduct(out, o.src); continue; }
          const words = typeof o.text === 'string' ? o.text : (o.pgCurved && typeof o.pgCurved.text === 'string' ? o.pgCurved.text : '');
          if (words.trim()) pushText(out, o.pgRole || 'text', words);
        }
      } else {
        return null;
      }
    } catch (e){ return null; }
    return (out.texts.length || out.products.length || out.category) ? out : null;
  }

  function fieldsFor(proj){
    const b = state.brief || {};
    const f = {};
    ['family', 'target', 'angle', 'tone', 'headline'].forEach(k => { if (b[k]) f[k] = b[k]; });
    if (b.models && b.models.length) f.models = JSON.stringify(b.models);
    const ref = text(String((proj && (proj.tplId || (proj.st && proj.st.tpl))) || ''), 120);
    if (ref) f.source_ref = ref;
    const graphic = graphicFor(proj);
    if (graphic) f.graphic = JSON.stringify(graphic);
    return f;
  }

  async function consider(name, dataUrl, proj){
    if (!state.link) return;   // not connected: nothing leaves this page
    if (state.connecting){ say('Not sent to iPhones LA: connecting. Export again after the connection finishes.', '', true); return; }
    const fields = fieldsFor(proj);
    const token = state.link.token;
    if (typeof dataUrl !== 'string' || dataUrl.slice(0, 11) !== 'data:image/') return;
    const why = refusal(proj);
    if (why){ say(why, '', true); return; }
    let blob = toBlob(dataUrl);
    if (blob && blob.size > state.maxBytes){
      // downscaleDataUrl is app.js's own helper: a 1600px JPEG, which is what
      // the server keeps anyway.
      blob = null;
      try {
        if (typeof downscaleDataUrl === 'function'){
          const small = toBlob(await downscaleDataUrl(dataUrl, SHRINK_TO));
          if (small && small.size <= state.maxBytes) blob = small;
        }
      } catch (e){}
      if (!blob){ say('Not sent to iPhones LA: the picture is too large. Export it smaller.', 'error'); return; }
    }
    if (!blob){ say('Not sent to iPhones LA: the picture could not be read.', 'error'); return; }
    if (!state.link || state.link.token !== token) return;
    if (state.queue.length >= MAX_QUEUE){
      // Drop the oldest one still waiting (never the one in flight).
      state.queue.splice(state.busy ? 1 : 0, 1);
      say('An older picture was not sent to iPhones LA. Too many were waiting.', 'error', true);
    }
    state.queue.push({ blob, name: fileName(name, blob.type), fields, tries: 0 });
    render();
    if (state.timer == null) pump();
  }

  async function send(job){
    const token = state.link && state.link.token;
    if (!token) return { verdict: 'stop' };
    let r, j = {}, timer;
    const controller = new AbortController();
    try {
      const fd = new FormData();
      fd.append('file', job.blob, job.name);
      Object.keys(job.fields).forEach(k => fd.append(k, job.fields[k]));
      // Bound both the request and its response body, even if fetch ignores abort.
      await Promise.race([
        (async () => {
          r = await fetch(IMAGES, {
            method: 'POST', mode: 'cors', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer',
            headers: { Authorization: 'Bearer ' + token },
            body: fd, signal: controller.signal,
          });
          try { j = await r.json(); } catch (e){}
        })(),
        new Promise((resolve, reject) => {
          timer = setTimeout(() => { controller.abort(); reject(new Error('Upload timed out')); }, UPLOAD_TIMEOUT_MS);
        }),
      ]);
    } catch (e){ return { verdict: 'retry' }; }
    finally { clearTimeout(timer); }
    if (r.ok) return { verdict: 'sent', duplicate: !!(j && j.duplicate) };
    if (r.status === 401) return { verdict: 'forget' };
    if (r.status === 507) return { verdict: 'full', msg: sentence(j) };
    if (r.status === 429) return { verdict: 'drop', msg: sentence(j) || 'The studio upload limit was reached. Export again later.' };
    if (r.status === 408 || r.status >= 500) return { verdict: 'retry', msg: sentence(j) };
    return { verdict: 'drop', msg: sentence(j) };
  }

  function pump(){
    if (state.busy || !state.queue.length) return;
    if (!state.link){ state.queue.length = 0; render(); return; }
    const job = state.queue[0];
    state.busy = true; render();
    send(job).then(out => out, () => ({ verdict: 'retry' })).then(out => {
      state.busy = false;
      const at = state.queue.indexOf(job);
      if (at < 0){ pump(); return; } // disconnected or cleared while in flight
      const done = () => { if (at >= 0) state.queue.splice(at, 1); };
      if (out.verdict === 'sent'){
        done();
        say(out.duplicate ? 'Already in the iPhones LA library.' : 'Sent to iPhones LA. Pick it in Auto-post.', 'success');
      } else if (out.verdict === 'forget'){
        forget('iPhones LA ended this connection. Open the studio from Auto-post to connect again.');
        return;
      } else if (out.verdict === 'full'){
        state.queue.length = 0;
        say(out.msg || 'The iPhones LA library is full. Remove pictures in Auto-post, then export again.', 'error');
        return;
      } else if (out.verdict === 'drop'){
        done();
        say('Not sent to iPhones LA. ' + (out.msg || 'The picture was refused.'), 'error');
      } else if (out.verdict === 'retry'){
        if (out.msg) job.lastWarning = out.msg;
        job.tries += 1;
        if (job.tries >= MAX_TRIES){
          done();
          say('Not sent to iPhones LA after ' + MAX_TRIES + ' tries. ' + (job.lastWarning || 'Export it again later.'), 'error');
        } else {
          say(job.lastWarning || 'Could not reach iPhones LA. Trying again soon.', '', true);
          wait(BACKOFF_MS[Math.min(job.tries - 1, BACKOFF_MS.length - 1)]);
          return;
        }
      } else {
        state.queue.length = 0;
      }
      render();
      pump();
    }).catch(() => { state.busy = false; });
  }
  function wait(ms){
    try { clearTimeout(state.timer); } catch (e){}
    try { state.timer = setTimeout(() => { state.timer = null; pump(); }, ms); }
    catch (e){ state.timer = null; }
  }
  function retryNow(){
    try { clearTimeout(state.timer); } catch (e){}
    state.timer = null;
    pump();
  }

  // ---------- the one hook ----------
  // addHistory is a function declaration in a classic script, so it is a window
  // property and app.js calls it by name: replacing the property is enough.
  // doExport is NOT wrapped (a click handler captured it) and neither is
  // renderEzCanvas (it runs on every preview keystroke).
  function hook(){
    const original = window.addHistory;
    if (typeof original !== 'function' || original.__ipla) return false;
    const wrapped = function(name, px, dataUrl, w, h, proj){
      let result, failed = false, error;
      try { result = original.apply(this, arguments); }
      catch (e){ failed = true; error = e; }
      try { consider(name, dataUrl, proj).catch(() => {}); } catch (e){}
      if (failed) throw error;   // app.js's own error stays app.js's own
      return result;
    };
    wrapped.__ipla = true;
    window.addHistory = wrapped;
    return true;
  }

  // ---------- start ----------
  function startFragment(initial){
    const frag = takeFragment(); // synchronous, including hash-only navigation
    if (frag.ipla !== undefined){
      const version = ++state.connectVersion;
      clearBrief(); // an absent, malformed or refused new brief never reuses old tags
      state.connecting = false;
      if (CODE_RE.test(frag.ipla)) exchange(frag.ipla, decodeBrief(frag.brief), version);
      else say('That link did not work. Open the studio from Auto-post again.', 'error');
    } else if (initial && state.link){
      checkLink();
    }
    // A brief alone is untrusted and cannot replace a verified brief.
  }
  startFragment(true);
  hook();
  try {
    window.addEventListener('hashchange', () => startFragment(false));
    window.addEventListener('online', retryNow);
    window.addEventListener('resize', place);
    // The stage changes size when the editor opens, closes or folds a panel away.
    const stage = typeof document !== 'undefined' && document.getElementById('stage');
    if (stage && typeof ResizeObserver === 'function') new ResizeObserver(place).observe(stage);
    window.addEventListener('storage', e => {
      if (e && e.key === LINK_KEY){
        state.connectVersion++; state.connecting = false; clearBrief();
        state.link = readLink();
        if (!state.link) state.queue.length = 0;
        render();
      }
    });
  } catch (e){}
  try {
    // The open note can sit over a button on a small window. A click anywhere
    // else, or Escape, folds it back into the pill.
    const fold = () => { if (state.open){ setOpen(false); render(); } };
    // closest(), not ui.root.contains(): the pill's own click has already redrawn
    // the note by the time this runs, so its target is no longer inside ui.root.
    document.addEventListener('click', e => {
      const t = e && e.target;
      if (t && typeof t.closest === 'function' && t.closest('.ipla')) return;
      fold();
    });
    document.addEventListener('keydown', e => { if (e && e.key === 'Escape') fold(); });
  } catch (e){}
  render();

  // A small handle for the console and the tests. It never returns the token.
  window.iplaLink = {
    state: () => ({
      connected: !!state.link, connecting: state.connecting,
      brief: state.brief ? JSON.parse(JSON.stringify(state.brief)) : null,
      note: state.note, noteKind: state.noteKind,
      queued: state.queue.length, busy: state.busy, waiting: state.timer != null,
      maxBytes: state.maxBytes,
    }),
    retryNow,
    disconnect,
    graphicFor,
  };
})();
