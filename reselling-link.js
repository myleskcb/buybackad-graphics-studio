'use strict';
/* ═══════════════════════════════════════════════════════
   Reselling.US link. One additive file, loaded after app.js and
   iphonesla-link.js. BUYBACK.AD is "by Reselling.US" (owner, 2026-11-12: one
   company, iPhones LA LLC, makes both), and a Reselling.US shop opens this
   studio from its app with one tap: Make a WE BUY ad, AI background or Video ad.

   The shape is the iPhones LA link's (iphonesla-link.js), on another shop:
   - Reselling.US opens the studio with `#bba=<one-time code>&make=<brief>` in
     the fragment. This file reads and clears it before anything else runs,
     trades the code once for a token (kept in localStorage.rus_link), and
     reads the shop's brand kit with it.
   - The shop's name, phone and city fill the brand kit (the shared privacy
     policy, "A shop connection"), and the studio opens on what was asked for:
     Easy Mode for a WE BUY ad, the AI background generator, or a video.
   - Every finished export (addHistory) and every video's photo (deliverVideo)
     is also sent to the shop's ads in Reselling.US, with the tag file (the
     words and product pictures on it). The download always happens first and
     nothing here throws into it.
   - The studio's own plan and AI credit balance is said to the shop, so its
     app can show it. Labels and counts only, never the email or a card.
   - A picture with a website, QR code, street address, social handle or
     watermark is not sent, by the same check the iPhones LA link uses
     (iplaLink.refusal), so the two cannot differ. A phone number is welcome.
   - The API origin is written down once below; nothing a link carries can
     change it. A studio served from localhost talks to a Reselling.US on this
     machine (the two are walked end to end that way); every other site talks
     to reselling.us.
   - No cookie ever crosses (credentials: 'omit'). This source is public and
     holds no secret.
   ═══════════════════════════════════════════════════════ */
(() => {
  const LOCAL = (() => { try { return /^(localhost|127\.0\.0\.1)$/.test(location.hostname); } catch (e){ return false; } })();
  const API = LOCAL ? 'http://localhost:8800' : 'https://reselling.us';
  const EXCHANGE = API + '/api/studio/exchange';
  const BRIEF = API + '/api/studio/brief';
  const ADS = API + '/api/studio/ads/in';
  const STATUS = API + '/api/studio/status';
  const BACK = API + '/app#studio';

  const LINK_KEY = 'rus_link';      // localStorage: {token, shop, connectedAt}
  const MAKE_KEY = 'rus_make';      // sessionStorage: what this tab was opened to make
  const OPEN_KEY = 'rus_open';      // sessionStorage: is the note open

  const CODE_RE = /^bbac_[A-Za-z0-9_-]{16,160}$/;
  const TOKEN_RE = /^bba_[A-Za-z0-9_-]{16,200}$/;
  const MAKES = { webuy: 'WE BUY ad', background: 'AI background', video: 'Video ad', connect: '' };
  const HARD_MAX_BYTES = 8 * 1024 * 1024;
  const SHRINK_TO = 1600;
  const MAX_QUEUE = 5;
  const MAX_TRIES = 3;
  const BACKOFF_MS = [5000, 30000];
  const TOAST_AFTER_MS = 1700;      // after app.js's own "downloaded" and the iPhones LA link's line
  const UPLOAD_TIMEOUT_MS = 90000;
  const CAPS = { make: 20, family: 20, target: 120, category: 30 };

  // ---------- storage that cannot throw ----------
  function box(kind){
    try { const s = window[kind], k = '__rus_t'; s.setItem(k, '1'); s.removeItem(k); return s; }
    catch (e){ const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } }; }
  }
  const local = box('localStorage');
  const session = box('sessionStorage');
  const readJson = (s, k) => { try { const v = s.getItem(k); return v == null ? null : JSON.parse(v); } catch (e){ return null; } };
  const writeJson = (s, k, v) => { try { s.setItem(k, JSON.stringify(v)); } catch (e){} };
  const drop = (s, k) => { try { s.removeItem(k); } catch (e){} };
  const text = (v, cap) => (typeof v === 'string' ? v.replace(/[\x00-\x1f\x7f]/g, ' ').trim().slice(0, cap) : '');

  // ---------- the fragment: read and clear ----------
  function takeFragment(){
    let raw = '';
    try { raw = String(location.hash || ''); } catch (e){ return {}; }
    if (raw.charAt(0) === '#') raw = raw.slice(1);
    if (!/(^|&)(bba|make)=/.test(raw)) return {};   // somebody else's anchor (the iPhones LA link's included)
    try { history.replaceState(null, '', location.pathname + location.search); }
    catch (e){ try { location.hash = ''; } catch (e2){} }
    const out = {};
    raw.split('&').forEach(pair => {
      const i = pair.indexOf('=');
      if (i < 1) return;
      const k = pair.slice(0, i);
      if ((k !== 'bba' && k !== 'make') || k in out) return;
      try { out[k] = decodeURIComponent(pair.slice(i + 1)); } catch (e){}
    });
    return out;
  }

  // "Back to Reselling.US" goes to Reselling.US's app and nowhere else.
  function safeReturn(v){
    try { const u = new URL(String(v)); if (u.origin === API && !u.username && !u.password) return u.href; } catch (e){}
    return '';
  }
  function cleanMake(obj){
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
    const b = {};
    Object.keys(CAPS).forEach(k => { const v = text(obj[k], CAPS[k]); if (v) b[k] = v; });
    if (!(b.make in MAKES)) b.make = 'connect';
    if (Array.isArray(obj.models)){
      const m = obj.models.map(x => text(x, 80)).filter(Boolean).slice(0, 4);
      if (m.length) b.models = m;
    }
    if (Number.isInteger(obj.device) && obj.device > 0) b.device = obj.device;
    const ret = safeReturn(obj.return);
    if (ret) b.return = ret;
    return b;
  }
  function decodeMake(b64){
    if (typeof b64 !== 'string' || !b64 || b64.length > 4000) return null;
    try {
      let s = b64.replace(/-/g, '+').replace(/_/g, '/');
      while (s.length % 4) s += '=';
      const bin = atob(s);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return cleanMake(JSON.parse(new TextDecoder().decode(bytes)));
    } catch (e){ return null; }
  }

  function readLink(){
    const v = readJson(local, LINK_KEY);
    return (v && typeof v.token === 'string' && TOKEN_RE.test(v.token))
      ? { token: v.token, shop: text(v.shop, 120), connectedAt: text(v.connectedAt, 40) } : null;
  }

  const state = {
    link: readLink(),
    make: readLink() ? cleanMake(readJson(session, MAKE_KEY)) : null,
    connecting: false, connectVersion: 0,
    note: '', noteKind: '',
    queue: [], busy: false, timer: null,
    maxBytes: HARD_MAX_BYTES,
    sentStatus: '',
    open: readJson(session, OPEN_KEY) === true,
  };

  // ---------- what the person sees ----------
  function say(msg, kind, quiet){
    state.note = msg; state.noteKind = kind || '';
    if (kind === 'error') setOpen(true);
    render();
    if (quiet) return;
    try { setTimeout(() => { try { if (typeof toast === 'function') toast(msg, kind); } catch (e){} }, TOAST_AFTER_MS); } catch (e){}
  }
  function setOpen(v){ state.open = !!v; writeJson(session, OPEN_KEY, state.open); }

  const CSS = [
    '.rus{position:fixed;left:16px;bottom:16px;z-index:451;max-width:min(340px,calc(100vw - 32px));font-size:13px;line-height:1.4;color:var(--text,#f2f4f8)}',
    '.rus-pill{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:var(--r-pill,999px);border:.5px solid var(--glass-edge,rgba(255,255,255,.12));background:var(--surface-solid,#171a21);color:inherit;font:inherit;font-weight:600;cursor:pointer;box-shadow:var(--glass-shadow,0 14px 38px -12px rgba(0,0,0,.6))}',
    '.rus-dot{width:8px;height:8px;border-radius:50%;background:var(--text-dim,#8b94a7)}',
    '.rus-dot.on{background:#30d68f}.rus-dot.bad{background:#ff6259}',
    '.rus-card{margin-bottom:8px;padding:14px 16px;border-radius:var(--r-lg,18px);border:.5px solid var(--glass-edge,rgba(255,255,255,.12));background:var(--surface-solid,#171a21);box-shadow:var(--glass-shadow-lift,0 24px 60px -14px rgba(0,0,0,.75))}',
    '.rus-card b{display:block;font-size:14px;margin-bottom:4px}',
    '.rus-card p{margin:6px 0 0;color:var(--text-2,#c5cbd8)}',
    '.rus-card p.bad{color:var(--text,#f2f4f8);border-left:2px solid #ff6259;padding-left:8px}',
    '.rus-card p.ok{color:var(--text,#f2f4f8);border-left:2px solid #30d68f;padding-left:8px}',
    '.rus-row{display:flex;flex-wrap:wrap;gap:12px;margin-top:10px}',
    '.rus-row a,.rus-row button{font:inherit;font-weight:600;color:var(--accent,#ff7a1a);background:none;border:none;padding:0;cursor:pointer;text-decoration:none}',
    '.rus-row button.dim{color:var(--text-dim,#8b94a7)}',
  ].join('\n');

  const ui = { root: null, styled: false };
  function el(tag, cls, txt){
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function makeLine(m){
    if (!m || !MAKES[m.make]) return '';
    return [MAKES[m.make], m.target || (m.models && m.models[0]) || ''].filter(Boolean).join(': ');
  }
  function render(){ try { draw(); } catch (e){} }
  function draw(){
    if (typeof document === 'undefined' || !document.body) return;
    if (ui.root && ui.root.parentNode) ui.root.parentNode.removeChild(ui.root);
    ui.root = null;
    if (!state.link && !state.connecting && !state.note) return;   // not connected: nothing at all
    if (!ui.styled){
      const st = el('style'); st.textContent = CSS;
      (document.head || document.body).appendChild(st);
      ui.styled = true;
    }
    const root = el('div', 'rus');
    if (state.open){
      const card = el('div', 'rus-card');
      const shop = state.link && state.link.shop ? ' (' + state.link.shop + ')' : '';
      card.appendChild(el('b', '', state.connecting ? 'Connecting to Reselling.US'
        : state.link ? 'Connected to Reselling.US' + shop : 'Not connected to Reselling.US'));
      if (state.link) card.appendChild(el('p', '', 'Ads you download here also go to your ads in Reselling.US.'));
      const line = makeLine(state.make);
      if (line) card.appendChild(el('p', '', 'Making: ' + line));
      if (state.link) card.appendChild(el('p', '', 'Your phone number is welcome on the picture. A website, QR code, street address, social handle or watermark keeps it here, and this note says so.'));
      if (state.note) card.appendChild(el('p', state.noteKind === 'error' ? 'bad' : state.noteKind === 'success' ? 'ok' : '', state.note));
      if (state.queue.length) card.appendChild(el('p', '', state.queue.length === 1 ? '1 ad waiting to send.' : state.queue.length + ' ads waiting to send.'));
      const row = el('div', 'rus-row');
      const back = el('a', '', 'Back to Reselling.US');
      back.href = (state.make && state.make.return) || BACK;
      back.setAttribute('rel', 'noopener');
      back.setAttribute('target', '_blank');
      row.appendChild(back);
      if (state.queue.length && !state.busy){
        const again = el('button', '', 'Try again now');
        again.onclick = () => retryNow();
        row.appendChild(again);
      }
      if (state.link){
        const off = el('button', 'dim', 'Disconnect');
        off.onclick = () => disconnect();
        row.appendChild(off);
      }
      card.appendChild(row);
      root.appendChild(card);
    }
    const pill = el('button', 'rus-pill');
    pill.setAttribute('type', 'button');
    pill.setAttribute('aria-expanded', state.open ? 'true' : 'false');
    pill.appendChild(el('span', 'rus-dot' + (state.noteKind === 'error' ? ' bad' : state.link ? ' on' : '')));
    pill.appendChild(el('span', '', 'Reselling.US'));
    pill.onclick = () => { setOpen(!state.open); render(); };
    root.appendChild(pill);
    document.body.appendChild(root);
    ui.root = root;
    place();
  }
  // Beside the iPhones LA pill when that one is drawn too (a browser can be
  // connected to both), in the editor's stage foot like it, never on top of it.
  function place(){
    try {
      if (!ui.root || !ui.root.style) return;
      let left = 16, bottom = 16;
      const ed = document.getElementById('page-editor'), stage = document.getElementById('stage');
      if (ed && stage && ed.classList && ed.classList.contains('active')){
        const r = stage.getBoundingClientRect();
        if (r.width > 320) left = Math.max(16, Math.round(r.left) + 16);
      }
      const other = typeof document.querySelector === 'function' && document.querySelector('.ipla');
      if (other && other.getBoundingClientRect) bottom = Math.max(16, Math.round(window.innerHeight - other.getBoundingClientRect().top) + 8);
      ui.root.style.left = left + 'px';
      ui.root.style.bottom = bottom + 'px';
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
    return ('BUYBACK.AD' + (where ? ', ' + where : '')).slice(0, 60);
  }
  const sentence = j => (j && typeof j.detail === 'string' && j.detail.length <= 240) ? j.detail : '';
  const req = (url, init) => fetch(url, Object.assign({ mode: 'cors', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' }, init));

  // One try, never a retry: the code is single-use and the fragment is gone.
  async function exchange(code, make, version){
    state.connecting = true; setOpen(true); render();
    let msg = '', ok = false;
    try {
      const r = await req(EXCHANGE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, label: deviceLabel() }) });
      const j = await r.json().catch(() => ({}));
      if (version !== state.connectVersion) return;
      if (r.ok && j && typeof j.token === 'string' && TOKEN_RE.test(j.token)){
        state.link = { token: j.token, shop: text(j.shop, 120), connectedAt: new Date().toISOString() };
        writeJson(local, LINK_KEY, state.link);
        state.make = make;
        if (make) writeJson(session, MAKE_KEY, make);
        ok = true;
      } else {
        msg = sentence(j) || 'That link did not work. Open the studio from Reselling.US again.';
      }
    } catch (e){
      msg = 'Could not reach Reselling.US. Open the studio from Reselling.US again.';
    }
    if (version !== state.connectVersion) return;
    state.connecting = false;
    if (!ok){ say(msg, 'error'); return; }
    say('Connected to Reselling.US', 'success', true);
    const brief = await readBrief();
    if (brief && brief.shop) await fillBrandKit(brief.shop);
    reportStatus(true);
    openMake(make);
  }

  async function readBrief(){
    const token = state.link && state.link.token;
    if (!token) return null;
    try {
      const r = await req(BRIEF, { method: 'GET', headers: { Authorization: 'Bearer ' + token } });
      if (!state.link || state.link.token !== token) return null;
      if (r.status === 401){ forget('Reselling.US ended this connection. Open the studio from Reselling.US to connect again.'); return null; }
      if (!r.ok) return null;
      const j = await r.json().catch(() => ({}));
      const cap = j && j.limits && j.limits.max_upload_bytes;
      if (typeof cap === 'number' && cap >= 100000 && cap < HARD_MAX_BYTES) state.maxBytes = Math.floor(cap);
      return j;
    } catch (e){ return null; }
  }

  // The brand kit is this browser's own (localStorage pgfx_brand). Opened from a
  // shop, the shop's name and phone go in, and its city is placed with the
  // studio's own ZIP and city list (resolveArea), which never leaves the page.
  async function fillBrandKit(shop){
    try {
      const name = text(shop.name, 120), phone = text(shop.phone, 20), area = text(shop.area, 80);
      let kit = {};
      try { kit = (typeof getBrand === 'function' && getBrand()) || {}; } catch (e){}
      const next = Object.assign({}, kit);
      if (name) next.name = name;
      if (phone) next.phone = phone;
      try { if (typeof jset === 'function') jset('pgfx_brand', next); else local.setItem('pgfx_brand', JSON.stringify(next)); } catch (e){}
      if (area && typeof resolveArea === 'function' && typeof setArea === 'function'){
        const current = (next.area && next.area.home) || '';
        if (current.split(',')[0].trim().toLowerCase() !== area.split(',')[0].trim().toLowerCase()){
          const placed = await resolveArea(area).catch(() => null);
          if (placed) setArea(placed);
        }
      }
      try { if (typeof applyBrandToCanvas === 'function') applyBrandToCanvas(true); } catch (e){}
    } catch (e){}
  }

  // What the shop asked for opens by itself, once, on the page it belongs to.
  function openMake(m){
    if (!m || !m.make || m.make === 'connect') return;
    const go = () => {
      try {
        if (m.make === 'video'){
          // the video maker is its own page, and reads the brand kit on load
          location.assign('motion/index.html');
          return;
        }
        if (m.make === 'background'){
          if (typeof openBgGen === 'function') openBgGen(m.target ? { text: m.target } : undefined);
          return;
        }
        if (typeof showEasy === 'function'){
          showEasy(null);
          if (m.target) pickDevice(m.target);
        }
      } catch (e){}
    };
    if (document.readyState === 'complete') setTimeout(go, 0);
    else window.addEventListener('load', () => setTimeout(go, 0), { once: true });
  }
  // Easy Mode's device picker, when the card has one: the shop's model by its
  // exact name, and nothing when no option is that model.
  function pickDevice(model, tries){
    tries = tries || 0;
    try {
      const sel = document.getElementById('ez-device');
      const field = document.getElementById('ez-device-field');
      if (!sel || !sel.options || !sel.options.length || (field && field.hidden)){
        if (tries < 20) setTimeout(() => pickDevice(model, tries + 1), 150);
        return;
      }
      const want = String(model).trim().toLowerCase();
      const hit = Array.from(sel.options).find(o => String(o.textContent || '').trim().toLowerCase() === want);
      if (hit && sel.value !== hit.value){ sel.value = hit.value; if (typeof sel.onchange === 'function') sel.onchange(); }
    } catch (e){}
  }

  // ---------- the studio's own plan and credits ----------
  // Read off app.js's account (planOf, creditsOf). Sent when it changes, never
  // the email or the name: labels and counts only.
  function statusNow(){
    let acct = null;
    try { acct = account; } catch (e){ return null; }
    if (!acct) return { signed_in: false };
    const out = { signed_in: true };
    try { if (typeof acct.plan === 'string') out.plan = acct.plan.slice(0, 20); } catch (e){}
    try { if (typeof planLabel === 'function') out.plan_label = String(planLabel()).slice(0, 40); } catch (e){}
    try {
      const c = typeof creditsOf === 'function' ? creditsOf() : null;
      if (c && !c.unlimited){
        if (Number.isFinite(c.total)) out.credits_left = Math.max(0, Math.floor(c.total));
        if (Number.isFinite(c.left)) out.credits_month = Math.max(0, Math.floor(c.left));
        if (Number.isFinite(c.bought)) out.credits_bought = Math.max(0, Math.floor(c.bought));
      }
    } catch (e){}
    return out;
  }
  let statusTimer = null;
  function reportStatus(now){
    if (!state.link) return;
    try { clearTimeout(statusTimer); } catch (e){}
    const send = async () => {
      statusTimer = null;
      const token = state.link && state.link.token;
      const body = statusNow();
      if (!token || !body) return;
      const key = JSON.stringify(body);
      if (key === state.sentStatus) return;
      try {
        const r = await req(STATUS, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: key });
        if (r.status === 401){ forget('Reselling.US ended this connection. Open the studio from Reselling.US to connect again.'); return; }
        if (r.ok) state.sentStatus = key;
      } catch (e){}
    };
    if (now) return send();
    try { statusTimer = setTimeout(send, 2500); } catch (e){ statusTimer = null; }
  }

  function forget(msg){
    state.connectVersion++; state.connecting = false;
    state.link = null; state.make = null; state.sentStatus = '';
    drop(local, LINK_KEY); drop(session, MAKE_KEY);
    state.queue.length = 0;
    try { clearTimeout(state.timer); } catch (e){}
    state.timer = null;
    say(msg, 'error');
  }
  function disconnect(){
    state.connectVersion++; state.connecting = false;
    state.link = null; state.make = null; state.sentStatus = '';
    drop(local, LINK_KEY); drop(session, MAKE_KEY);
    state.queue.length = 0;
    try { clearTimeout(state.timer); } catch (e){}
    state.timer = null;
    say('Disconnected. Nothing more is sent. To end the connection for good, use Reselling.US.', '', true);
  }

  // ---------- is this picture one the shop can use ----------
  // The iPhones LA link's own check, so a picture held from one shop is held
  // from the other for the same reason, worded for this one.
  function watermarked(){
    let acct;
    try { acct = account; } catch (e){ return true; }       // cannot tell: not sent
    if (!acct) return true;                                  // signed out exports are watermarked
    if (acct.role === 'admin') return false;
    try { return !!planOf().watermark; } catch (e){ return true; }
  }
  function refusal(proj){
    if (watermarked()) return 'Not sent to Reselling.US: this export has a watermark. A plan without one (Starter and up) sends it.';
    let why = '';
    try {
      if (!window.iplaLink || typeof window.iplaLink.refusal !== 'function') return 'Not sent to Reselling.US: this picture could not be checked. Reload the page and export again.';
      why = window.iplaLink.refusal(proj) || '';
    } catch (e){ return 'Not sent to Reselling.US: this picture could not be checked.'; }
    return why ? why.replace(/^Not sent to iPhones LA:\s*/, 'Not sent to Reselling.US: ').replace(/Sign in as an admin and export again\./, 'A plan without a watermark sends it.') : '';
  }
  function graphicFor(proj){
    try { return window.iplaLink && typeof window.iplaLink.graphicFor === 'function' ? window.iplaLink.graphicFor(proj) : null; } catch (e){ return null; }
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
    return (stem || 'buybackad-ad') + (type === 'image/jpeg' ? '.jpg' : '.png');
  }
  function fieldsFor(proj, make){
    const m = state.make || {};
    const f = { make: make || (m.make && m.make !== 'connect' ? m.make : 'webuy') };
    if (m.device) f.device = String(m.device);
    const graphic = graphicFor(proj);
    if (graphic) f.graphic = JSON.stringify(graphic);
    return f;
  }
  function enqueue(blob, name, fields){
    if (state.queue.length >= MAX_QUEUE){
      state.queue.splice(state.busy ? 1 : 0, 1);
      say('An older ad was not sent to Reselling.US. Too many were waiting.', 'error', true);
    }
    state.queue.push({ blob, name: fileName(name, blob.type), fields, tries: 0 });
    render();
    if (state.timer == null) pump();
  }

  async function consider(name, dataUrl, proj){
    if (!state.link) return;   // not connected: nothing leaves this page
    if (state.connecting){ say('Not sent to Reselling.US: connecting. Export again after the connection finishes.', '', true); return; }
    if (typeof dataUrl !== 'string' || dataUrl.slice(0, 11) !== 'data:image/') return;
    const token = state.link.token;
    const why = refusal(proj);
    if (why){ say(why, '', true); return; }
    const fields = fieldsFor(proj);
    let blob = toBlob(dataUrl);
    if (blob && blob.size > state.maxBytes){
      blob = null;
      try {
        if (typeof downscaleDataUrl === 'function'){
          const small = toBlob(await downscaleDataUrl(dataUrl, SHRINK_TO));
          if (small && small.size <= state.maxBytes) blob = small;
        }
      } catch (e){}
      if (!blob){ say('Not sent to Reselling.US: the ad is too large. Export it smaller.', 'error'); return; }
    }
    if (!blob){ say('Not sent to Reselling.US: the ad could not be read.', 'error'); return; }
    if (!state.link || state.link.token !== token) return;
    enqueue(blob, name, fields);
  }
  // A video's photo (the one OfferUp wants beside it) comes back as the ad. The
  // video file itself stays on this device: Reselling.US keeps pictures only.
  function considerVideo(name, photo){
    if (!state.link || state.connecting || !photo || !(photo.blob instanceof Blob)) return;
    if (watermarked()){ say('Not sent to Reselling.US: this export has a watermark. A plan without one (Starter and up) sends it.', '', true); return; }
    if (!/^image\/(png|jpeg)$/.test(photo.blob.type || '') || photo.blob.size > state.maxBytes) return;
    let proj = null;
    try { proj = typeof projectNow === 'function' ? projectNow(document.getElementById('page-editor').classList.contains('active') ? 'adv' : 'ez') : null; } catch (e){ proj = null; }
    if (proj){ const why = refusal(proj); if (why){ say(why, '', true); return; } }
    enqueue(photo.blob, photo.name || name, fieldsFor(proj, 'video'));
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
      await Promise.race([
        (async () => {
          r = await req(ADS, { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: fd, signal: controller.signal });
          try { j = await r.json(); } catch (e){}
        })(),
        new Promise((resolve, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('timed out')); }, UPLOAD_TIMEOUT_MS); }),
      ]);
    } catch (e){ return { verdict: 'retry' }; }
    finally { clearTimeout(timer); }
    if (r.ok) return { verdict: 'sent', duplicate: !!(j && j.duplicate) };
    if (r.status === 401) return { verdict: 'forget' };
    if (r.status === 507) return { verdict: 'full', msg: sentence(j) };
    if (r.status === 429) return { verdict: 'drop', msg: sentence(j) || 'Reselling.US has had a lot of ads from this studio today. Export again later.' };
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
      if (at < 0){ pump(); return; }
      const done = () => { state.queue.splice(at, 1); };
      if (out.verdict === 'sent'){
        done();
        say(out.duplicate ? 'Already in your Reselling.US ads.' : 'Sent to your ads in Reselling.US.', 'success');
        reportStatus(false);
      } else if (out.verdict === 'forget'){
        forget('Reselling.US ended this connection. Open the studio from Reselling.US to connect again.');
        return;
      } else if (out.verdict === 'full'){
        state.queue.length = 0;
        say(out.msg || 'Your ads in Reselling.US are full. Delete some there, then export again.', 'error');
        return;
      } else if (out.verdict === 'drop'){
        done();
        say('Not sent to Reselling.US. ' + (out.msg || 'The ad was refused.'), 'error');
      } else if (out.verdict === 'retry'){
        job.tries += 1;
        if (out.msg) job.lastWarning = out.msg;
        if (job.tries >= MAX_TRIES){
          done();
          say('Not sent to Reselling.US after ' + MAX_TRIES + ' tries. ' + (job.lastWarning || 'Export it again later.'), 'error');
        } else {
          say(job.lastWarning || 'Could not reach Reselling.US. Trying again soon.', '', true);
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
    try { state.timer = setTimeout(() => { state.timer = null; pump(); }, ms); } catch (e){ state.timer = null; }
  }
  function retryNow(){
    try { clearTimeout(state.timer); } catch (e){}
    state.timer = null;
    pump();
  }

  // ---------- the hooks ----------
  // addHistory and deliverVideo are function declarations in a classic script,
  // so they are window properties and app.js calls them by name. The wraps keep
  // the marks of the wraps already there (iphonesla-link.js, ad-library.js).
  function keepMarks(from, to){ try { Object.keys(from).forEach(k => { try { to[k] = from[k]; } catch (e){} }); } catch (e){} }
  function hook(){
    const original = window.addHistory;
    if (typeof original === 'function' && !original.__rus){
      const wrapped = function(name, px, dataUrl, w, h, proj){
        let result, failed = false, error;
        try { result = original.apply(this, arguments); }
        catch (e){ failed = true; error = e; }
        try { consider(name, dataUrl, proj).catch(() => {}); } catch (e){}
        if (failed) throw error;
        return result;
      };
      keepMarks(original, wrapped);
      wrapped.__rus = true;
      window.addHistory = wrapped;
    }
    const dv = window.deliverVideo;
    if (typeof dv === 'function' && !dv.__rus){
      const w2 = async function(blob, name, photo){
        const ok = await dv.apply(this, arguments);
        if (ok) try { considerVideo(name, photo); } catch (e){}
        return ok;
      };
      keepMarks(dv, w2);
      w2.__rus = true;
      window.deliverVideo = w2;
    }
    // A sign-in, a plan change or a spent credit redraws the account: say it.
    ['syncAcctUI', 'syncQuotaUI'].forEach(fn => {
      const f = window[fn];
      if (typeof f !== 'function' || f.__rus) return;
      const w3 = function(){
        const result = f.apply(this, arguments);
        try { reportStatus(false); } catch (e){}
        return result;
      };
      keepMarks(f, w3);
      w3.__rus = true;
      window[fn] = w3;
    });
  }

  // ---------- start ----------
  function startFragment(initial){
    const frag = takeFragment();
    if (frag.bba !== undefined){
      const version = ++state.connectVersion;
      state.make = null; drop(session, MAKE_KEY);
      state.connecting = false;
      if (CODE_RE.test(frag.bba)) exchange(frag.bba, decodeMake(frag.make), version);
      else say('That link did not work. Open the studio from Reselling.US again.', 'error');
    } else if (initial && state.link){
      readBrief().then(() => reportStatus(false));
    }
    // A make alone is untrusted: without a code it opens nothing.
  }
  startFragment(true);
  hook();
  try {
    window.addEventListener('hashchange', () => startFragment(false));
    window.addEventListener('online', retryNow);
    window.addEventListener('resize', place);
    window.addEventListener('storage', e => {
      if (e && e.key === LINK_KEY){
        state.connectVersion++; state.connecting = false;
        state.link = readLink();
        if (!state.link){ state.queue.length = 0; state.make = null; }
        render();
      }
    });
  } catch (e){}
  try {
    const fold = () => { if (state.open){ setOpen(false); render(); } };
    document.addEventListener('click', e => {
      const t = e && e.target;
      if (t && typeof t.closest === 'function' && t.closest('.rus')) return;
      fold();
    });
    document.addEventListener('keydown', e => { if (e && e.key === 'Escape') fold(); });
  } catch (e){}
  render();

  // For the console and the tests. It never returns the token.
  window.resellingLink = {
    state: () => ({
      connected: !!state.link, connecting: state.connecting, shop: state.link ? state.link.shop : '',
      make: state.make ? JSON.parse(JSON.stringify(state.make)) : null,
      note: state.note, noteKind: state.noteKind, queued: state.queue.length, busy: state.busy,
      waiting: state.timer != null, maxBytes: state.maxBytes, api: API,
    }),
    retryNow, disconnect, refusal, statusNow,
  };
})();
