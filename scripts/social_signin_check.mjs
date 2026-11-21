#!/usr/bin/env node
/* SIGN IN WITH APPLE AND GOOGLE, CHECKED (account.js pgfxAccount.social, app.js ensureGoogleAuth,
   api.mjs /auth/apple and /auth/config).

   The owner, 2026-11-19: "apple and google sign in ?". Apple's and Google's scripts and the API
   are stand-ins here (page.route): Apple's draws a button that fires its success or failure
   event, Google's renders a button that calls back with a credential, and the API answers as
   api.mjs does. This fails when:

     studio     the studio's dialog does not show both buttons above the form, or Apple's sign-in
                does not reach /api/auth/apple with the token, the name and the page's own nonce,
                or does not sign the visitor in;
     maker      the video maker's dialog (account.js) does not show both, or Google's sign-in does
                not sign in, close the dialog and run what was waiting on it;
     off        either button, or the "or" line, shows when the site has no client IDs;
     app        either shows, or either script loads, inside the WeBuy.AD iPhone app (Google
                refuses an app's web view; Apple there must be native);
     failures   closing Apple's popup says anything, another failure says nothing, or a token the
                server refuses signs anyone in;
     errors     any page error.

   usage:  python3 -m http.server 8899   (in the repo), then
           [GFX_BASE=http://127.0.0.1:8899/] [PLAYWRIGHT_MODULE=...] node scripts/social_signin_check.mjs
   Exits 1 on a failure. Written 2026-11-19. */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE = (process.env.GFX_BASE || 'http://127.0.0.1:8899/').replace(/\/?$/, '/');
const fails = [], ok = (cond, what, more = '') => { console.log((cond ? '  ok   ' : '  FAIL ') + what + (more ? ' (' + more + ')' : '')); if (!cond) fails.push(what); };
const allErrors = [];

const FAKE_APPLE = `window.AppleID = { auth: {
  init(o){ window.__appleInit = o; const host = document.getElementById('appleid-signin');
    if (host && !host.querySelector('#fake-apple')){ const b = document.createElement('button'); b.type = 'button'; b.id = 'fake-apple'; b.textContent = 'Continue with Apple';
      b.onclick = () => document.dispatchEvent(new CustomEvent(window.__appleFail ? 'AppleIDSignInOnFailure' : 'AppleIDSignInOnSuccess', { detail: window.__appleFail
        ? { error: window.__appleFail } : { authorization: { id_token: 'fake.apple.token' }, user: { name: { firstName: 'Pat', lastName: 'Buyer' } } } }));
      host.appendChild(b); } },
  signIn(){ return Promise.reject({ error: 'not in this check' }); } } };`;
const FAKE_GOOGLE = `window.google = { accounts: { id: {
  initialize(o){ window.__gInit = o; },
  renderButton(el){ const b = document.createElement('button'); b.type = 'button'; b.className = 'fake-google'; b.textContent = 'Continue with Google';
    b.onclick = () => window.__gInit.callback({ credential: 'fake.google.token' }); el.appendChild(b); } } } };`;
const ON = { apple: true, appleClientId: 'ad.webuy.signin', google: true, googleClientId: 'test.apps.googleusercontent.com' };
const USER = (email) => ({ email, plan: 'free', role: 'user', exports: { period: 'x', count: 0 }, credits: { allowance: 5, used: 0, left: 5, bought: 0, total: 5 } });
const IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WeBuyADApp/1.0';

const browser = await chromium.launch();
async function open(path, { cfg = ON, ua, appleStatus = 0 } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1, ...(ua ? { userAgent: ua } : {}) });
  const page = await ctx.newPage(), errors = [], seen = { apple: [], google: [], config: 0, scripts: [] };
  page.on('pageerror', (e) => { const s = String(e).slice(0, 200); errors.push(s); allErrors.push(path + ': ' + s); });
  await page.addInitScript(() => { try { localStorage.removeItem('pgfx_local_demo'); localStorage.removeItem('pgfx_token'); } catch (e) { /* none */ } });
  const origin = new URL(BASE).origin;
  const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  await page.route('**/*', async (route) => {
    const req = route.request(), url = req.url();
    if (url.startsWith('https://appleid.cdn-apple.com/')) { seen.scripts.push('apple'); return route.fulfill({ status: 200, contentType: 'application/javascript', body: FAKE_APPLE }); }
    if (url.startsWith('https://accounts.google.com/gsi/client')) { seen.scripts.push('google'); return route.fulfill({ status: 200, contentType: 'application/javascript', body: FAKE_GOOGLE }); }
    if (url.startsWith(origin + '/api/')) {
      const p = new URL(url).pathname.replace(/^\/api/, '');
      let body = {}; try { body = JSON.parse(req.postData() || '{}') || {}; } catch (e) { /* not JSON */ }
      if (p === '/auth/config') { seen.config++; return json(route, cfg); }
      if (p === '/auth/apple') { seen.apple.push(body); return appleStatus ? json(route, { error: 'That sign-in was for a different app.' }, appleStatus) : json(route, { token: 't-apple', user: USER('pat@privaterelay.appleid.com') }); }
      if (p === '/auth/google') { seen.google.push(body); return json(route, { token: 't-google', user: USER('pat@gmail.com') }); }
      if (p === '/me') return json(route, { user: USER(seen.google.length ? 'pat@gmail.com' : 'pat@privaterelay.appleid.com') });
      return json(route, { error: 'not in this check' }, 404);
    }
    return route.continue();
  });
  await page.goto(BASE + path, { waitUntil: 'load', timeout: 120000 });
  return { ctx, page, errors, seen };
}
const visible = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return false; const r = e.getBoundingClientRect(); return !e.hidden && getComputedStyle(e).display !== 'none' && r.width > 0 && r.height > 0; }, sel);

/* ---------- the studio's dialog (app.js), Apple ---------- */
console.log("the studio's dialog: Apple");
{
  const { ctx, page, errors, seen } = await open('');
  await page.waitForFunction(() => typeof openAuth === 'function' && !!window.pgfxAccount, null, { timeout: 90000 });
  await page.evaluate(() => { document.querySelectorAll('.modal-overlay.show').forEach((m) => m.classList.remove('show')); openAuth('Sign in to check'); });
  await page.waitForSelector('#auth-google #fake-apple', { timeout: 15000 }).catch(() => {});
  await page.waitForSelector('#auth-google .fake-google', { timeout: 15000 }).catch(() => {});
  ok(await visible(page, '#auth-google #fake-apple') && await visible(page, '#auth-google .fake-google'), 'both buttons show above the form');
  ok(await visible(page, '#auth-or'), 'with the "or" line under them');
  const init = await page.evaluate(() => window.__appleInit || null);
  ok(!!init && init.clientId === 'ad.webuy.signin' && init.usePopup === true && /name/.test(init.scope) && /email/.test(init.scope) && /^[0-9a-f]{32}$/.test(init.nonce || ''),
    "Apple's script starts with the Services ID, the popup, name and email, and a fresh nonce", JSON.stringify(init));
  await page.click('#auth-google #fake-apple');
  await page.waitForFunction(() => getComputedStyle(document.getElementById('auth-ok')).display !== 'none', null, { timeout: 15000 }).catch(() => {});
  const sent = seen.apple[0] || {};
  ok(sent.id_token === 'fake.apple.token' && sent.name === 'Pat Buyer' && sent.nonce === (init && init.nonce), 'the token, the name and the same nonce go to /api/auth/apple', JSON.stringify(sent));
  const after = await page.evaluate(() => ({ title: document.getElementById('auth-ok-title').textContent, token: localStorage.getItem('pgfx_token') }));
  ok(after.title === 'Signed in with Apple' && after.token === '"t-apple"', 'and the visitor is signed in', JSON.stringify(after));
  ok(!errors.length, 'no page errors', errors.join(' | '));
  await ctx.close();
}

/* ---------- the video maker's dialog (account.js), Google ---------- */
console.log("the video maker's dialog: Google");
{
  const { ctx, page, errors, seen } = await open('motion/');
  await page.waitForFunction(() => !!(window.pgfxAccount && window.pgfxAccount.social), null, { timeout: 90000 });
  await page.evaluate(() => { window.__next = 0; window.pgfxAccount.openAuth({ message: 'Sign in to check', next: () => { window.__next++; } }); });
  await page.waitForSelector('#acct-social .fake-google', { timeout: 15000 }).catch(() => {});
  ok(await visible(page, '#acct-social #fake-apple') && await visible(page, '#acct-social .fake-google') && await visible(page, '#acct-or'), 'both buttons and the "or" line show above its form');
  await page.click('#acct-social .fake-google');
  await page.waitForFunction(() => window.__next > 0, null, { timeout: 15000 }).catch(() => {});
  const after = await page.evaluate(() => ({ next: window.__next, signedIn: window.pgfxAccount.signedIn(), open: document.getElementById('acct-overlay').classList.contains('show'), token: localStorage.getItem('pgfx_token') }));
  ok((seen.google[0] || {}).credential === 'fake.google.token', "Google's credential goes to /api/auth/google", JSON.stringify(seen.google[0] || {}));
  ok(after.signedIn && after.token === '"t-google"' && !after.open && after.next === 1, 'it signs in, closes the dialog and runs what waited on it, once', JSON.stringify(after));
  ok(!errors.length, 'no page errors', errors.join(' | '));
  await ctx.close();
}

/* ---------- failures ---------- */
console.log('failures');
{
  const { ctx, page, errors } = await open('motion/');
  await page.waitForFunction(() => !!(window.pgfxAccount && window.pgfxAccount.social), null, { timeout: 90000 });
  await page.evaluate(() => { window.__appleFail = 'popup_closed_by_user'; window.pgfxAccount.openAuth({}); });
  await page.waitForSelector('#acct-social #fake-apple', { timeout: 15000 }).catch(() => {});
  await page.click('#acct-social #fake-apple');
  await page.waitForTimeout(600);
  ok((await page.textContent('#acct-err')).trim() === '', "closing Apple's popup says nothing");
  await page.evaluate(() => { window.__appleFail = 'invalid_request'; });
  await page.click('#acct-social #fake-apple');
  await page.waitForTimeout(600);
  ok(/Apple sign-in did not finish/.test(await page.textContent('#acct-err')), 'another failure says so', await page.textContent('#acct-err'));
  ok(!errors.length, 'no page errors', errors.join(' | '));
  await ctx.close();
}
{
  const { ctx, page, errors } = await open('motion/', { appleStatus: 401 });
  await page.waitForFunction(() => !!(window.pgfxAccount && window.pgfxAccount.social), null, { timeout: 90000 });
  await page.evaluate(() => window.pgfxAccount.openAuth({}));
  await page.waitForSelector('#acct-social #fake-apple', { timeout: 15000 }).catch(() => {});
  await page.click('#acct-social #fake-apple');
  await page.waitForTimeout(800);
  const st = await page.evaluate(() => ({ err: document.getElementById('acct-err').textContent, signedIn: window.pgfxAccount.signedIn() }));
  ok(!st.signedIn && /different app/.test(st.err), 'a token the server refuses signs nobody in, and says why', JSON.stringify(st));
  ok(!errors.length, 'no page errors', errors.join(' | '));
  await ctx.close();
}

/* ---------- off, and in the iPhone app ---------- */
console.log('off, and in the iPhone app');
for (const [what, opts] of [['a site with no client IDs', { cfg: { apple: false, appleClientId: '', google: false, googleClientId: '' } }], ['the iPhone app', { ua: IOS_UA }]]) {
  const { ctx, page, errors, seen } = await open('motion/', opts);
  await page.waitForFunction(() => !!(window.pgfxAccount && window.pgfxAccount.social), null, { timeout: 90000 });
  await page.evaluate(() => window.pgfxAccount.openAuth({}));
  await page.waitForTimeout(1500);
  const shown = await page.evaluate(() => ({ social: !document.getElementById('acct-social').hidden, or: !document.getElementById('acct-or').hidden }));
  ok(!shown.social && !shown.or && !seen.scripts.length, what + ': no buttons, no "or" line, no script loaded', JSON.stringify({ ...shown, scripts: seen.scripts }));
  if (opts.ua) ok(seen.config === 0, 'and the app does not even ask the server', 'asked ' + seen.config);
  ok(!errors.length, 'no page errors', errors.join(' | '));
  await ctx.close();
}

await browser.close();
console.log(fails.length ? '\n' + fails.length + ' FAILED:\n  ' + fails.join('\n  ') : '\nall clear');
process.exit(fails.length ? 1 : 0);
