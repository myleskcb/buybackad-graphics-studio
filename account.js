'use strict';
/* ═══════════════════════════════════════════════════════
   The account, on every page. One small file for the pages that do not
   load app.js (the video maker at /motion, the master library): create an
   account, sign in, sign out, the session token the studio keeps
   (localStorage pgfx_token, the same one), and a dialog that opens on
   CREATE ACCOUNT for a device that has never signed in. On index.html app.js
   owns the account; this file only hands over to its dialog.

   Owner, 2026-10-06: "allow account creation so I can download content,
   upload to library properly". The library (ad-library.js) is the
   account's, so every page that offers it offers an account too.

   window.pgfxAccount:
     api(path, body?, opts?)   fetch the backend as the account (JSON back)
     token(), signedIn(), demo, me() → { email, plan, role } | null
     signup(email, pass), login(email, pass), signout()
     openAuth({ message, mode: 'up' | 'in', next })   the dialog
     onChange(fn)              after a sign-in or sign-out
   ═══════════════════════════════════════════════════════ */
(() => {
  const TOKEN = 'pgfx_token';          // app.js: jset('pgfx_token', token), a JSON string
  const SEEN = 'pgfx_seen_account';    // this device has signed in before: the dialog opens on Sign in
  const box = (() => { try { const s = window.localStorage, k = '__acct_t'; s.setItem(k, '1'); s.removeItem(k); return s; } catch (e){ return null; } })();
  const jget = (k, fb) => { try { const v = box && box.getItem(k); return v == null ? fb : JSON.parse(v); } catch (e){ return fb; } };
  const jset = (k, v) => { try { if (!box) return; if (v === null || v === undefined) box.removeItem(k); else box.setItem(k, JSON.stringify(v)); } catch (e){} };

  /* where the backend is: config.js says on the studio's pages; a page in a
     folder (motion/) works it out from its own address, so a site mounted
     under /gfx/ still reaches /gfx/api */
  const API = (() => {
    if (typeof window.PGFX_API === 'string') return window.PGFX_API.replace(/\/$/, '');
    const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    if (local && String(jget('pgfx_local_demo', null)) === '1') return '';   // config.js writes "1", which reads back as the number 1
    const dir = location.pathname.replace(/\/(motion|lab|ads|admin-ads|cards)\/[^/]*$/, '/').replace(/\/[^/]*$/, '/');
    return (dir === '/' ? '' : dir.replace(/\/$/, '')) + '/api';
  })();
  const DEMO = !API;
  const studio = () => typeof window.openAuth === 'function' && typeof window.setAuthMode === 'function';   // app.js is here

  const state = { me: null, meFor: null, listeners: [] };
  const token = () => { const t = jget(TOKEN, null); return typeof t === 'string' && t ? t : null; };
  const demoToken = () => { const t = token(); return !!t && t.startsWith('demo:'); };
  const signedIn = () => !!token();
  const tell = () => state.listeners.forEach(fn => { try { fn(state.me); } catch (e){} });

  async function api(path, body, opts){
    opts = opts || {};
    const headers = Object.assign({}, opts.headers || {});
    const t = token();
    if (t) headers.Authorization = 'Bearer ' + t;
    let data;
    if (opts.raw !== undefined){ headers['Content-Type'] = 'application/octet-stream'; data = opts.raw; }
    else if (body !== undefined){ headers['Content-Type'] = 'application/json'; data = JSON.stringify(body); }
    let r;
    try { r = await fetch(API + path, { method: opts.method || (data !== undefined ? 'POST' : 'GET'), headers, body: data }); }
    catch (e){ throw new Error('The server did not answer. Check the connection and try again.'); }
    const j = await r.json().catch(() => ({}));
    if (!r.ok){ const err = new Error(j.error || ('HTTP ' + r.status)); err.status = r.status; throw err; }
    return j;
  }
  async function me(){
    const t = token();
    if (!t || DEMO || demoToken()) return (state.me = null);
    if (state.me && state.meFor === t) return state.me;
    try { state.me = (await api('/me')).user; state.meFor = t; }
    catch (e){ if (e.status === 401 || e.status === 404) state.me = null; }
    return state.me;
  }
  function took(j){
    jset(TOKEN, j.token);
    jset(SEEN, true);
    state.me = j.user; state.meFor = j.token;
    tell();
    return j.user;
  }
  const clean = em => String(em || '').trim().toLowerCase();
  /* a deploy or env mistake, told apart from a wrong password (app.js authErrorText has the same words) */
  const explain = e => {
    const m = String((e && e.message) || e || ''), s = e && e.status;
    if (/JWT_SECRET/.test(m)) return 'Accounts are not switched on for this site yet: JWT_SECRET is not set in the Netlify project\'s environment (SETUP.md).';
    if (s === 502 || s === 503 || s === 504) return 'The account server is not answering (HTTP ' + s + '). Try again in a minute. If it stays like this after a deploy, the function shipped without its dependency: npm ci, then deploy (SETUP.md).';
    if (s === 404 && /^HTTP 404$/.test(m)) return 'There is no account server at this address (HTTP 404): the site was deployed without its function (SETUP.md).';
    return m || 'That did not work. Try again.';
  };
  async function signup(email, password){ return took(await api('/auth/signup', { email: clean(email), password })); }
  async function login(email, password){ return took(await api('/auth/login', { email: clean(email), password })); }
  function signout(){ jset(TOKEN, null); state.me = null; state.meFor = null; tell(); }

  /* ---------- Sign in with Apple, and with Google ----------
     The owner, 2026-11-19: "apple and google sign in ?". Both dialogs (this file's,
     and app.js's on the studio) put these buttons above the email form; mount() draws
     them in a box and calls back with the account. Each shows only when the backend
     says it is configured (/api/auth/config: APPLE_CLIENT_ID, GOOGLE_CLIENT_ID), so a
     site without them loads nothing.
     The owner, 2026-11-23, of Google's own button in a white box on the dark window:
     "blend with app ui". Google's button is Google's page in a frame, black or white
     and at most 400px, and the page around a frame can't restyle it. So both buttons
     are the site's own, drawn like the window they sit in (its fields' surface and
     edge, its type, the form's full width), each with its company's logo and words.
     Ours opens the company's own popup: Apple's through AppleID.auth.signIn, its
     identity token to /api/auth/apple with the nonce this page made; Google's through
     its token client, the access token to /api/auth/google, which asks Google whom it
     was issued to. Inside the WeBuy.AD iPhone app neither shows yet: Google refuses
     sign-in in an app's web view, and the App Store asks for Apple alongside it, which
     the app has to do natively (OPEN-ITEMS). */
  const IN_IOS_APP = /\bWeBuyADApp\//.test(navigator.userAgent);
  const APPLE_JS = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
  const GOOGLE_JS = 'https://accounts.google.com/gsi/client';
  let socialCfg = null, appleNonce = '', socialTarget = null, googleClient = null, socialStyled = false;
  const socialConfig = () => socialCfg || (socialCfg = (DEMO || IN_IOS_APP) ? Promise.resolve({}) : api('/auth/config').catch(() => ({})));
  const loadScript = (src, ready) => new Promise((res, rej) => {
    if (ready()) return res();
    let s = document.querySelector('script[data-src="' + src + '"]');
    if (!s){ s = document.createElement('script'); s.src = src; s.async = true; s.dataset.src = src; document.head.appendChild(s); }
    s.addEventListener('load', () => (ready() ? res() : rej(new Error('did not start'))));
    s.addEventListener('error', () => rej(new Error('did not load')));
  });
  const newNonce = () => { const b = new Uint8Array(16); crypto.getRandomValues(b); return Array.from(b, x => x.toString(16).padStart(2, '0')).join(''); };
  const socialError = msg => { if (socialTarget && socialTarget.onError) socialTarget.onError(msg); };
  /* a sign-in from either button: the account it opens, then the dialog's own next step */
  async function socialDone(path, body, via){
    const t = socialTarget;
    if (!t) return;
    try { const user = took(await api(path, body)); if (t.onSignedIn) await t.onSignedIn(user, via); }
    catch (e){ if (t.onError) t.onError(explain(e)); }
  }
  /* the logos, as each company draws them: Google's G in its four colours, Apple's apple
     in the button's own ink */
  const G_LOGO = '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">'
    + '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>'
    + '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>'
    + '<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>'
    + '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
  const APPLE_LOGO = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>';
  /* each window's own look: the studio's (styles.css) gives them its fields' raised surface,
     hairline edge and focus ring; this file's gives them its own buttons' edge and type */
  const SOCIAL_CSS = `
.social-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;box-sizing:border-box;min-height:44px;margin:0;padding:10px 18px;border-radius:999px;font-family:inherit;font-size:14.5px;font-weight:650;line-height:1.2;letter-spacing:-.005em;cursor:pointer;transition:background-color .14s ease,border-color .14s ease,box-shadow .14s ease,transform .1s ease;-webkit-tap-highlight-color:transparent}
.social-btn svg{width:18px;height:18px;flex:none;display:block}
.social-apple svg{width:17px;height:17px;margin-top:-2px}
.social-btn:active{transform:scale(.985)}
.social-btn:focus{outline:none}
.auth-google .social-btn{background:var(--surface-raise,#1e1e21);border:1px solid var(--hairline-strong,rgba(255,255,255,.16));color:var(--text,#f5f5f7)}
.auth-google .social-btn:hover{border-color:var(--text-dim,#8e8e93)}
.auth-google .social-btn:focus-visible{border-color:var(--accent,#0a84ff);box-shadow:0 0 0 4px var(--accent-wash,rgba(10,132,255,.16))}
.acct-social .social-btn{background:transparent;border:1.5px solid var(--line,rgba(20,20,20,.18));color:var(--text,#141414);font:700 15px Satoshi,system-ui,sans-serif}
.acct-social .social-btn:hover{background:rgba(127,127,127,.1)}
.acct-social .social-btn:focus-visible{border-color:var(--accent,#2b56f5);box-shadow:0 0 0 4px rgba(43,86,245,.18)}
`;
  function socialButton(kind, words, logo, onClick){
    const b = el('button', 'social-btn social-' + kind);
    b.type = 'button';
    b.innerHTML = logo + '<span>' + words + '</span>';
    b.addEventListener('click', onClick);
    return b;
  }
  /* Apple's popup, from our button: signIn() answers with the token, and the first
     time only with the name. Closing the popup is not worth a word. */
  function appleSignIn(){
    let p;
    try { p = window.AppleID.auth.signIn(); } catch (e){ p = Promise.reject(e); }
    Promise.resolve(p).then(d => {
      d = d || {};
      const n = d.user && d.user.name ? [d.user.name.firstName, d.user.name.lastName].filter(Boolean).join(' ') : '';
      return socialDone('/auth/apple', { id_token: d.authorization && d.authorization.id_token, name: n, nonce: appleNonce }, 'Apple');
    }, err => {
      const code = err && err.error;
      if (code === 'popup_closed_by_user' || code === 'user_cancelled_authorize') return;
      socialError('Apple sign-in did not finish. Try again.');
    });
  }
  /* Google's popup, from our button: the token client asks which account and hands back an
     access token. It has to open inside the click, or the browser blocks the popup. */
  function googleSignIn(){
    try { googleClient.requestAccessToken(); } catch (e){ socialError('Google sign-in did not finish. Try again.'); }
  }
  async function mountSocial(holder, handlers){
    socialTarget = handlers || {};
    const cfg = await socialConfig();
    const apple = !!(cfg && cfg.apple && cfg.appleClientId), google = !!(cfg && cfg.google && cfg.googleClientId);
    if (!holder || (!apple && !google)) return false;
    if (!socialStyled){ const st = el('style'); st.textContent = SOCIAL_CSS; (document.head || document.body).appendChild(st); socialStyled = true; }
    if (apple && !holder.querySelector('.social-apple')){
      try {
        await loadScript(APPLE_JS, () => !!(window.AppleID && window.AppleID.auth));
        appleNonce = appleNonce || newNonce();
        window.AppleID.auth.init({ clientId: cfg.appleClientId, scope: 'name email', redirectURI: location.origin + '/', usePopup: true, nonce: appleNonce });
        if (!holder.querySelector('.social-apple')) holder.insertBefore(socialButton('apple', 'Continue with Apple', APPLE_LOGO, appleSignIn), holder.querySelector('.social-google'));
      } catch (e){ /* Apple's script did not load: no Apple button */ }
    }
    if (google && !holder.querySelector('.social-google')){
      try {
        await loadScript(GOOGLE_JS, () => !!(window.google && window.google.accounts && window.google.accounts.oauth2));
        if (!googleClient) googleClient = window.google.accounts.oauth2.initTokenClient({
          client_id: cfg.googleClientId, scope: 'openid email profile', prompt: 'select_account',
          callback: r => {
            if (r && r.access_token) return socialDone('/auth/google', { access_token: r.access_token }, 'Google');
            if (r && r.error === 'access_denied') return;                    // they said no: nothing to say
            socialError('Google sign-in did not finish. Try again.');
          },
          error_callback: e => {
            const type = e && e.type;
            if (type === 'popup_closed') return;                                // they closed it
            socialError(type === 'popup_failed_to_open' ? "The browser blocked Google's sign-in window. Allow pop-ups for this site and try again." : 'Google sign-in did not finish. Try again.');
          },
        });
        if (!holder.querySelector('.social-google')) holder.appendChild(socialButton('google', 'Continue with Google', G_LOGO, googleSignIn));
      } catch (e){ /* Google's script did not load: no Google button */ }
    }
    return !!holder.querySelector('.social-btn');
  }

  /* ---------- the dialog ---------- */
  const CSS = `
.acct-overlay{position:fixed;inset:0;z-index:470;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(10,10,14,.6);backdrop-filter:blur(6px)}
.acct-overlay.show{display:flex}
.acct-modal{width:min(380px,100%);max-height:calc(100vh - 32px);overflow:auto;background:var(--panel,#fffdf8);color:var(--text,#141414);border:1px solid var(--line,rgba(20,20,20,.18));border-radius:18px;padding:22px 22px 18px;box-shadow:0 24px 60px -14px rgba(0,0,0,.5);font:15px/1.4 Satoshi,system-ui,sans-serif}
.acct-modal h3{margin:0 0 4px;font-size:20px}
.acct-modal p.acct-sub{margin:0 0 14px;color:var(--text-2,#3b3833);font-size:14px}
.acct-tabs{display:flex;gap:4px;background:var(--bg,#f2eee4);border:1px solid var(--line,rgba(20,20,20,.12));border-radius:999px;padding:3px;margin-bottom:14px}
.acct-tabs button{flex:1;border:0;background:none;color:var(--text-2,#3b3833);font:700 13.5px Satoshi,system-ui,sans-serif;padding:9px;border-radius:999px;cursor:pointer;min-height:40px}
.acct-tabs button[aria-selected=true]{background:var(--panel,#fff);color:var(--text,#141414);box-shadow:0 1px 4px rgba(0,0,0,.15),inset 0 0 0 1px var(--line,rgba(20,20,20,.12))}
.acct-modal label{display:block;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#66615a);margin:10px 0 5px}
.acct-modal input{width:100%;box-sizing:border-box;font:500 16px Satoshi,system-ui,sans-serif;padding:11px 13px;border-radius:12px;border:1.5px solid var(--line,rgba(20,20,20,.18));background:var(--bg,#f2eee4);color:var(--text,#141414)}
.acct-modal input:focus{outline:none;border-color:var(--accent,#2b56f5);box-shadow:0 0 0 4px rgba(43,86,245,.18)}
.acct-hint{font-size:12.5px;color:var(--muted,#66615a);margin-top:6px}
.acct-err{color:#c8321e;font-size:13.5px;min-height:18px;margin-top:8px}
.acct-row{display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap}
.acct-row button{font:700 15px Satoshi,system-ui,sans-serif;border-radius:999px;padding:11px 18px;cursor:pointer;min-height:44px;border:1.5px solid var(--line,rgba(20,20,20,.18));background:transparent;color:var(--text,#141414)}
.acct-row button.primary{background:var(--btn,#2b56f5);color:var(--accent-ink,#fff);border-color:transparent}
.acct-row button:disabled{opacity:.5;cursor:default}
.acct-note{font-size:13px;color:var(--text-2,#3b3833);margin-top:12px;padding:10px 12px;border-radius:10px;background:rgba(20,20,20,.05)}
.acct-social{display:flex;flex-direction:column;align-items:stretch;gap:10px;margin:2px 0 4px}
.acct-social[hidden],.acct-or[hidden]{display:none}
.acct-or{display:flex;align-items:center;gap:12px;margin:12px 0 2px;color:var(--muted,#66615a);font-size:12px}
.acct-or::before,.acct-or::after{content:'';flex:1;height:1px;background:var(--line,rgba(20,20,20,.18))}
`;
  let overlay = null, styled = false, mode = 'up', next = null;
  const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };
  function build(){
    if (overlay) return;
    if (!styled){ const st = el('style'); st.textContent = CSS; (document.head || document.body).appendChild(st); styled = true; }
    overlay = el('div', 'acct-overlay');
    overlay.id = 'acct-overlay';
    overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true'); overlay.setAttribute('aria-label', 'Your account');
    const m = el('div', 'acct-modal');
    m.innerHTML = `<h3>Welcome to WeBuy.AD</h3><p class="acct-sub" id="acct-sub"></p>
      <div class="acct-social" id="acct-social" hidden></div>
      <div class="acct-or" id="acct-or" hidden><span>or with email</span></div>
      <div class="acct-tabs" role="tablist"><button type="button" role="tab" id="acct-tab-up" aria-selected="true">Create free account</button><button type="button" role="tab" id="acct-tab-in" aria-selected="false">Sign in</button></div>
      <form id="acct-form" novalidate>
        <label for="acct-email">Email</label><input type="email" id="acct-email" autocomplete="email" placeholder="you@example.com">
        <label for="acct-pass">Password</label><input type="password" id="acct-pass" autocomplete="new-password" placeholder="At least 8 characters">
        <div class="acct-hint" id="acct-hint">No card needed. Your account works on every device.</div>
        <div class="acct-err" id="acct-err" role="alert"></div>
        <div class="acct-row"><button type="button" id="acct-cancel">Cancel</button><button type="submit" class="primary" id="acct-go">Create account</button></div>
      </form>
      <div class="acct-note" id="acct-note" hidden></div>`;
    overlay.appendChild(m);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    m.querySelector('#acct-tab-up').onclick = () => setMode('up');
    m.querySelector('#acct-tab-in').onclick = () => setMode('in');
    m.querySelector('#acct-cancel').onclick = close;
    m.querySelector('#acct-form').onsubmit = e => { e.preventDefault(); submit(); };
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('show')) close(); });
  }
  function setMode(m){
    mode = m;
    const q = id => overlay.querySelector('#' + id);
    q('acct-tab-up').setAttribute('aria-selected', m === 'up' ? 'true' : 'false');
    q('acct-tab-in').setAttribute('aria-selected', m === 'in' ? 'true' : 'false');
    q('acct-go').textContent = m === 'up' ? 'Create account' : 'Sign in';
    q('acct-pass').autocomplete = m === 'up' ? 'new-password' : 'current-password';
    q('acct-hint').textContent = m === 'up' ? 'No card needed. Your account works on every device.' : 'The email and password you signed up with.';
    q('acct-err').textContent = '';
  }
  async function submit(){
    const q = id => overlay.querySelector('#' + id);
    const email = clean(q('acct-email').value), pass = q('acct-pass').value, err = q('acct-err');
    err.textContent = '';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ err.textContent = 'Enter a valid email address'; q('acct-email').focus(); return; }
    if (pass.length < 8){ err.textContent = 'Password needs at least 8 characters'; q('acct-pass').focus(); return; }
    q('acct-go').disabled = true;
    try {
      const user = await (mode === 'up' ? signup(email, pass) : login(email, pass));
      const fn = next;                       // taken before close() lets go of it
      close();
      if (fn) { try { await fn(user); } catch (e){ console.warn('after sign-in:', e); } }
    } catch (e){
      err.textContent = explain(e);
      if (mode === 'up' && e.status === 409) { err.textContent += ' Sign in instead?'; }
    }
    q('acct-go').disabled = false;
  }
  function close(){ if (overlay) overlay.classList.remove('show'); next = null; }
  function openAuth(opts){
    opts = opts || {};
    const want = opts.mode || (jget(SEEN, false) || signedIn() ? 'in' : 'up');
    if (studio()){                                   // app.js's own dialog, on index.html
      try { window.openAuth(opts.message, opts.next ? () => opts.next() : null); window.setAuthMode(want); } catch (e){ console.warn(e); }
      return;
    }
    build();
    next = opts.next || null;
    const q = id => overlay.querySelector('#' + id);
    q('acct-sub').textContent = opts.message || 'Create a free account or sign in to keep your ads in your library.';
    q('acct-form').hidden = DEMO;
    q('acct-note').hidden = !DEMO;
    if (DEMO) q('acct-note').textContent = 'Demo mode: accounts and the ad library live on the hosted site. Open the studio there to create an account.';
    overlay.querySelector('.acct-tabs').hidden = DEMO;
    setMode(want);
    overlay.classList.add('show');
    setTimeout(() => { try { q('acct-email').focus(); } catch (e){} }, 60);
    /* Apple and Google above the form, when the site has them */
    mountSocial(q('acct-social'), {
      onSignedIn: async user => { const fn = next; close(); if (fn) { try { await fn(user); } catch (e){ console.warn('after sign-in:', e); } } },
      onError: msg => { q('acct-err').textContent = msg; },
    }).then(shown => { q('acct-social').hidden = !shown; q('acct-or').hidden = !shown; }).catch(() => {});
  }

  window.pgfxAccount = { api, API, demo: DEMO, token, signedIn, me, signup, login, signout, openAuth, close, onChange: fn => { state.listeners.push(fn); }, seen: () => jget(SEEN, false),
    social: { mount: mountSocial } };
  if (signedIn() && !demoToken()) jset(SEEN, true);
})();
