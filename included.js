'use strict';
/* included.html: the plan a Reselling.US plan includes, switched on for the account signed in here
   (netlify/lib/rsus.mjs, DESIGN-LAW 187). Reselling.US's Plan page opens this page with a token after
   the #, so no server log or Referer ever holds it; it is read once, taken out of the address bar and
   kept in this tab (sessionStorage) while the person signs in or makes an account in account.js's
   dialog, then sent to POST /api/rsus/claim. The token's body is plain JSON anybody may read (only the
   signature is a secret), which is how this page names the plan before it is claimed. */
(() => {
  const $ = (id) => document.getElementById(id);
  const KEEP = 'pgfx_rsus_t';
  const fromHash = (new URLSearchParams(location.hash.slice(1)).get('t') || '').trim();
  if (location.hash) { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* stays */ } }
  const box = (() => { try { return window.sessionStorage; } catch (e) { return null; } })();
  if (fromHash && box) { try { box.setItem(KEEP, fromHash); } catch (e) { /* the token stays in this script only */ } }
  const token = fromHash || (box && box.getItem(KEEP)) || '';
  const A = window.pgfxAccount;

  const show = (id, on) => { const n = $(id); if (n) n.hidden = !on; };
  const say = (id, text) => { const n = $(id); if (n) n.textContent = text || ''; };

  /* what the token says, read without the secret: the plan's name and the Reselling.US plan */
  const info = (() => {
    try {
      const b = token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
      const d = JSON.parse(atob(b + '='.repeat((4 - (b.length % 4)) % 4)));
      return { name: String(d.name || 'your plan').slice(0, 40), via: String(d.via || '').slice(0, 40), exp: Number(d.exp) || 0 };
    } catch (e) { return null; }
  })();

  function done(user) {
    if (box) { try { box.removeItem(KEEP); } catch (e) { /* none */ } }
    const inc = user && user.included;
    say('inc-title', (inc ? inc.name : 'Your plan') + ' is on');
    say('inc-lead', '');
    show('inc-lead', false); show('inc-claim', false); show('inc-sign', false); show('inc-done', true);
    say('inc-done-words', 'WeBuy.AD ' + (inc ? inc.name : '') + ' is switched on for ' + user.email +
      (inc && inc.via ? ', included with your ' + inc.via + ' plan on Reselling.US' : '') + '. It holds while that plan does.');
  }

  async function claim() {
    say('inc-err', '');
    const go = $('inc-go');
    if (go) go.disabled = true;
    try {
      const j = await A.api('/rsus/claim', { t: token });
      done(j.user);
    } catch (e) {
      if (e.status === 401) { signIn(); return; }
      if (e.status === 400 || e.status === 409) {
        if (box) { try { box.removeItem(KEEP); } catch (x) { /* none */ } }
        say('inc-lead', e.message);
        show('inc-claim', false); show('inc-sign', false);
        return;
      }
      say('inc-err', e.message);
    }
    if (go) go.disabled = false;
  }

  async function ready() {
    const me = A.signedIn() ? await A.me() : null;
    if (!me) {
      say('inc-lead', 'Your ' + (info.via || 'Reselling.US') + ' plan includes WeBuy.AD ' + info.name + '. Sign in here and it switches on.');
      show('inc-claim', false); show('inc-sign', true);
      return;
    }
    say('inc-lead', 'Your ' + (info.via || 'Reselling.US') + ' plan includes WeBuy.AD ' + info.name + '.');
    say('inc-who', 'Switch ' + info.name + ' on for ' + me.email + '?');
    show('inc-sign', false); show('inc-claim', true);
  }

  function signIn() {
    A.openAuth({ mode: A.seen() ? 'in' : 'up', message: 'Sign in, or make your WeBuy.AD account. ' + info.name + ' switches on for it.', next: claim });
  }

  if (!token || !info) {
    say('inc-lead', "This page opens from Reselling.US: on its Plan page, press Open WeBuy.AD. Your plan switches on here for the account you sign in with.");
    return;
  }
  if (info.exp && info.exp < Date.now()) {
    say('inc-lead', 'This link has expired: it works for a few minutes. Go back to Reselling.US and press Open WeBuy.AD again.');
    return;
  }
  say('inc-title', 'WeBuy.AD ' + info.name + ', included');
  $('inc-go').addEventListener('click', claim);
  $('inc-sign-go').addEventListener('click', signIn);
  $('inc-other').addEventListener('click', (e) => { e.preventDefault(); A.signout(); signIn(); });
  A.onChange(() => ready());
  ready();
})();
