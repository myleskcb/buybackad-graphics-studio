'use strict';
/* The pages a mailed link opens (DESIGN-LAW 182): reset.html (choose a new password, or ask for a
   link) and confirm.html (the address check). The token comes after a # in the link, so it never
   reaches a server log or a Referer; it is read once and taken out of the address bar.

   reset.html   #t=<token>: is the link good (POST /api/auth/reset/check, which names the account),
                then the new password (POST /api/auth/reset), which signs the visitor in here too.
                No link, or one that has expired or been used: the email form for a new one
                (POST /api/auth/forgot, the same answer for every address).
   confirm.html #t=<token>: POST /api/auth/confirm. Nobody needs to be signed in. */
(() => {
  const $ = (id) => document.getElementById(id);
  const page = document.body.dataset.page;
  const token = (new URLSearchParams(location.hash.slice(1)).get('t') || '').trim();
  if (location.hash) { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* stays */ } }
  const API = new URL('api', location.href).pathname.replace(/\/$/, '');   // /api, or /gfx/api under a folder

  async function api(path, body) {
    let r;
    try { r = await fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) }); }
    catch (e) { throw new Error('The server did not answer. Check the connection and try again.'); }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(j.error || 'That did not work (HTTP ' + r.status + '). Try again.'); e.status = r.status; e.data = j; throw e; }
    return j;
  }
  const show = (id, on) => { const n = $(id); if (n) n.hidden = !on; };
  const say = (id, text) => { const n = $(id); if (n) n.textContent = text || ''; };
  const keep = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode: sign in by hand */ } };
  const validEmail = (s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);

  function done(title, words) {
    say('ap-title', title);
    say('ap-lead', '');
    $('ap-lead').hidden = true;
    say('ap-done-words', words);
    show('ap-new', false); show('ap-ask', false); show('ap-done', true);
  }

  if (page === 'confirm') {
    if (!token) { say('ap-lead', 'This page opens from the link in the email we sent. Open it from there, or sign in and send a new one from your account menu.'); return; }
    api('/auth/confirm', { token })
      .then((j) => done('Your email is confirmed', 'Thanks. ' + j.email + ' is confirmed, so we can always help you get back in.'))
      .catch((e) => say('ap-lead', e.message));
    return;
  }

  /* ---------- reset.html ---------- */
  function ask(lead) {
    say('ap-title', 'Reset your password');
    say('ap-lead', lead || "Type the email you signed up with. We'll send a link to choose a new password.");
    show('ap-new', false); show('ap-ask', true);
  }
  $('ap-ask').addEventListener('submit', async (e) => {
    e.preventDefault();
    const em = $('ap-email').value.trim().toLowerCase();
    say('ap-ask-msg', ''); show('ap-ask-sent', false);
    if (!validEmail(em)) { say('ap-ask-msg', 'Enter a valid email address'); $('ap-email').focus(); return; }
    $('ap-send').disabled = true;
    try {
      await api('/auth/forgot', { email: em });
      say('ap-ask-sent', 'If ' + em + ' has a WeBuy.AD account, a link to choose a new password is on its way. It works for an hour. Not there in a few minutes? Look in spam, or write to support@webuy.ad.');
      show('ap-ask-sent', true);
      $('ap-send').textContent = 'Send again';
    } catch (err) { say('ap-ask-msg', err.message); }
    $('ap-send').disabled = false;
  });
  $('ap-eye').addEventListener('click', () => {
    const p = $('ap-pass'), on = p.type === 'password';
    p.type = on ? 'text' : 'password';
    $('ap-eye').textContent = on ? 'Hide' : 'Show';
    $('ap-eye').setAttribute('aria-pressed', String(on));
  });
  $('ap-new').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pass = $('ap-pass').value;
    say('ap-new-msg', '');
    if (pass.length < 8) { say('ap-new-msg', 'Password needs at least 8 characters'); $('ap-pass').focus(); return; }
    $('ap-save').disabled = true;
    try {
      const j = await api('/auth/reset', { token, password: pass });
      keep('pgfx_token', j.token);           // the studio's own sign-in (app.js, account.js)
      keep('pgfx_seen_account', true);
      done('Your new password is saved', "You're signed in as " + j.user.email + '. Use the new password next time you sign in, on any device.');
    } catch (err) {
      if (err.data && err.data.link) ask(err.message);
      else say('ap-new-msg', err.message);
    }
    $('ap-save').disabled = false;
  });

  if (!token) { ask(); return; }
  api('/auth/reset/check', { token }).then((j) => {
    say('ap-lead', 'For ' + j.email + '. At least 8 characters.');
    $('ap-user').value = j.email;            // so a password manager saves it under the right account
    show('ap-new', true);
    setTimeout(() => { try { $('ap-pass').focus(); } catch (e) { /* none */ } }, 30);
  }).catch((e) => ask(e.message));
})();
