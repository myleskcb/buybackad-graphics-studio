#!/usr/bin/env node
/* SIGN IN WITH APPLE AND GOOGLE, CHECKED (account.js pgfxAccount.social, app.js ensureGoogleAuth,
   api.mjs /auth/apple and /auth/config).

   The owner, 2026-11-19: "apple and google sign in ?"; 2026-11-23, of Google's own button in a
   white box: "blend with app ui". The buttons are the site's own now, and open each company's
   popup. Apple's and Google's scripts and the API are stand-ins here (page.route): Apple's
   signIn() answers with a token or a failure, Google's token client calls back with an access
   token or an error, and the API answers as api.mjs does. This fails when:

     studio     the studio's dialog does not show both buttons above the form, or Apple's sign-in
                does not reach /api/auth/apple with the token, the name and the page's own nonce,
                or does not sign the visitor in;
     maker      the video maker's dialog (account.js) does not show both, or Google's sign-in does
                not send its access token, sign in, close the dialog and run what was waiting on it;
     blend      a button is not the form's full width, or does not wear its window's own look: the
                studio's fields' surface, edge and type, or this file's own buttons' edge and type;
                a company's frame sits in the window; the Create / Sign in switch shows no track or
                no chosen side on a dark page;
     off        either button, or the "or" line, shows when the site has no client IDs;
     app        either shows, or either script loads, inside the WeBuy.AD iPhone app (Google
                refuses an app's web view; Apple there must be native);
     failures   closing either popup says anything, another failure says nothing, a blocked popup
                does not say so, or a token the server refuses signs anyone in;
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
  init(o){ window.__appleInit = o; },
  signIn(){ window.__appleAsked = (window.__appleAsked || 0) + 1;
    return window.__appleFail ? Promise.reject({ error: window.__appleFail })
      : Promise.resolve({ authorization: { id_token: 'fake.apple.token' }, user: { name: { firstName: 'Pat', lastName: 'Buyer' } } }); } } };`;
const FAKE_GOOGLE = `window.google = { accounts: { oauth2: {
  initTokenClient(o){ window.__gInit = o; return { requestAccessToken(){ window.__gAsked = (window.__gAsked || 0) + 1; const f = window.__gFail;
    if (f === 'access_denied') return o.callback({ error: 'access_denied' });
    if (f) return o.error_callback && o.error_callback({ type: f });
    o.callback({ access_token: 'fake.google.access' }); } }; } } } };`;
const ON = { apple: true, appleClientId: 'ad.webuy.signin', google: true, googleClientId: 'test.apps.googleusercontent.com' };
const USER = (email) => ({ email, plan: 'free', role: 'user', exports: { period: 'x', count: 0 }, credits: { allowance: 5, used: 0, left: 5, bought: 0, total: 5 } });
const IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WeBuyADApp/1.0';

const browser = await chromium.launch();
async function open(path, { cfg = ON, ua, appleStatus = 0, colorScheme = 'light' } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1, colorScheme, ...(ua ? { userAgent: ua } : {}) });
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
/* each social button beside the window's own field (and, in account.js's window, its Cancel) */
const looks = (page, holder, fieldSel, peerSel) => page.evaluate(([h, f, pe]) => {
  const st = (e) => { const s = getComputedStyle(e), r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), bg: s.backgroundColor, borderColor: s.borderTopColor, borderWidth: s.borderTopWidth, font: s.fontFamily, color: s.color, radius: s.borderRadius }; };
  const field = st(document.querySelector(f)), peer = pe ? st(document.querySelector(pe)) : null, box = document.querySelector(h);
  return [...box.querySelectorAll('.social-btn')].map((b) => ({ ...st(b), field, peer, pill: parseFloat(getComputedStyle(b).borderRadius) >= b.getBoundingClientRect().height / 2,
    frame: !!box.querySelector('iframe'), order: b.textContent.trim(), expect: b.classList.contains('social-apple') ? 'Continue with Apple' : 'Continue with Google' }));
}, [holder, fieldSel, peerSel || '']);
const visible = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return false; const r = e.getBoundingClientRect(); return !e.hidden && getComputedStyle(e).display !== 'none' && r.width > 0 && r.height > 0; }, sel);

/* ---------- the studio's dialog (app.js), Apple ---------- */
console.log("the studio's dialog: Apple");
{
  const { ctx, page, errors, seen } = await open('');
  await page.waitForFunction(() => typeof openAuth === 'function' && !!window.pgfxAccount, null, { timeout: 90000 });
  await page.evaluate(() => { document.querySelectorAll('.modal-overlay.show').forEach((m) => m.classList.remove('show')); openAuth('Sign in to check'); });
  await page.waitForSelector('#auth-google .social-apple', { timeout: 15000 }).catch(() => {});
  await page.waitForSelector('#auth-google .social-google', { timeout: 15000 }).catch(() => {});
  ok(await visible(page, '#auth-google .social-apple') && await visible(page, '#auth-google .social-google'), 'both buttons show above the form, Apple first',
    await page.evaluate(() => [...document.querySelectorAll('#auth-google .social-btn')].map((b) => b.textContent.trim()).join(' / ')));
  ok(await visible(page, '#auth-or'), 'with the "or" line under them');
  const blend = await looks(page, '#auth-google', '#auth-forms input[type=password]');
  ok(blend.every((b) => Math.abs(b.w - b.field.w) <= 1 && b.h >= 44), "blend: each is the form's full width, and 44px or taller", JSON.stringify(blend.map((b) => [b.w, b.field.w, b.h])));
  ok(blend.every((b) => b.bg === b.field.bg && b.borderColor === b.field.borderColor && b.borderWidth === b.field.borderWidth && b.font === b.field.font),
    "blend: each wears the studio's fields' surface, edge and type", JSON.stringify(blend[0]));
  ok(blend.every((b) => b.pill && !b.frame && b.order === b.expect), 'blend: pill-shaped, no company frame in the window, the words as each company has them', JSON.stringify(blend.map((b) => [b.radius, b.frame, b.order])));
  const init = await page.evaluate(() => window.__appleInit || null);
  ok(!!init && init.clientId === 'ad.webuy.signin' && init.usePopup === true && /name/.test(init.scope) && /email/.test(init.scope) && /^[0-9a-f]{32}$/.test(init.nonce || ''),
    "Apple's script starts with the Services ID, the popup, name and email, and a fresh nonce", JSON.stringify(init));
  await page.click('#auth-google .social-apple');
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
  await page.waitForSelector('#acct-social .social-google', { timeout: 15000 }).catch(() => {});
  ok(await visible(page, '#acct-social .social-apple') && await visible(page, '#acct-social .social-google') && await visible(page, '#acct-or'), 'both buttons and the "or" line show above its form');
  const blend = await looks(page, '#acct-social', '#acct-email', '#acct-cancel');
  ok(blend.every((b) => Math.abs(b.w - b.field.w) <= 1 && b.h >= 44 && b.pill && !b.frame), "blend: each is the form's full width, 44px or taller, pill-shaped, no frame", JSON.stringify(blend.map((b) => [b.w, b.field.w, b.h, b.radius])));
  ok(blend.every((b) => b.borderColor === b.peer.borderColor && b.borderWidth === b.peer.borderWidth && b.font === b.peer.font && b.color === b.peer.color),
    "blend: each wears this window's own buttons' edge and type (its Cancel's)", JSON.stringify(blend[0]));
  const gInit = await page.evaluate(() => { const o = window.__gInit || {}; return { client_id: o.client_id, scope: o.scope, prompt: o.prompt }; });
  ok(gInit.client_id === 'test.apps.googleusercontent.com' && /openid/.test(gInit.scope || '') && /email/.test(gInit.scope || '') && gInit.prompt === 'select_account',
    "Google's token client starts with the site's client ID, openid and email, and asks which account", JSON.stringify(gInit));
  await page.click('#acct-social .social-google');
  await page.waitForFunction(() => window.__next > 0, null, { timeout: 15000 }).catch(() => {});
  const after = await page.evaluate(() => ({ next: window.__next, signedIn: window.pgfxAccount.signedIn(), open: document.getElementById('acct-overlay').classList.contains('show'), token: localStorage.getItem('pgfx_token') }));
  ok((seen.google[0] || {}).access_token === 'fake.google.access' && !(seen.google[0] || {}).credential, "Google's access token goes to /api/auth/google", JSON.stringify(seen.google[0] || {}));
  ok(after.signedIn && after.token === '"t-google"' && !after.open && after.next === 1, 'it signs in, closes the dialog and runs what waited on it, once', JSON.stringify(after));
  ok(!errors.length, 'no page errors', errors.join(' | '));
  await ctx.close();
}

/* ---------- failures ---------- */
console.log('failures');
{
  const { ctx, page, errors } = await open('motion/');
  await page.waitForFunction(() => !!(window.pgfxAccount && window.pgfxAccount.social), null, { timeout: 90000 });
  await page.evaluate(() => { window.__appleFail = 'popup_closed_by_user'; window.__gFail = 'popup_closed'; window.pgfxAccount.openAuth({}); });
  await page.waitForSelector('#acct-social .social-google', { timeout: 15000 }).catch(() => {});
  const errText = async () => (await page.textContent('#acct-err')).trim();
  const clear = () => page.evaluate(() => { document.getElementById('acct-err').textContent = ''; });
  await page.click('#acct-social .social-apple');
  await page.waitForTimeout(600);
  ok(await errText() === '' && await page.evaluate(() => window.__appleAsked === 1), "closing Apple's popup says nothing");
  await page.evaluate(() => { window.__appleFail = 'invalid_request'; });
  await page.click('#acct-social .social-apple');
  await page.waitForTimeout(600);
  ok(/Apple sign-in did not finish/.test(await errText()), "another Apple failure says so", await errText());
  await clear();
  await page.click('#acct-social .social-google');
  await page.waitForTimeout(600);
  ok(await errText() === '' && await page.evaluate(() => window.__gAsked === 1), "closing Google's popup says nothing");
  await page.evaluate(() => { window.__gFail = 'access_denied'; });
  await page.click('#acct-social .social-google');
  await page.waitForTimeout(600);
  ok(await errText() === '', 'saying no to Google says nothing either');
  await page.evaluate(() => { window.__gFail = 'popup_failed_to_open'; });
  await page.click('#acct-social .social-google');
  await page.waitForTimeout(600);
  ok(/blocked Google's sign-in window/.test(await errText()), "a blocked Google popup says so, and how to fix it", await errText());
  await clear();
  await page.evaluate(() => { window.__gFail = 'unknown'; });
  await page.click('#acct-social .social-google');
  await page.waitForTimeout(600);
  ok(/Google sign-in did not finish/.test(await errText()), 'another Google failure says so', await errText());
  ok(!(await page.evaluate(() => window.pgfxAccount.signedIn())), 'and none of them signs anyone in');
  ok(!errors.length, 'no page errors', errors.join(' | '));
  await ctx.close();
}
{
  const { ctx, page, errors } = await open('motion/', { appleStatus: 401 });
  await page.waitForFunction(() => !!(window.pgfxAccount && window.pgfxAccount.social), null, { timeout: 90000 });
  await page.evaluate(() => window.pgfxAccount.openAuth({}));
  await page.waitForSelector('#acct-social .social-apple', { timeout: 15000 }).catch(() => {});
  await page.click('#acct-social .social-apple');
  await page.waitForTimeout(800);
  const st = await page.evaluate(() => ({ err: document.getElementById('acct-err').textContent, signedIn: window.pgfxAccount.signedIn() }));
  ok(!st.signedIn && /different app/.test(st.err), 'a token the server refuses signs nobody in, and says why', JSON.stringify(st));
  ok(!errors.length, 'no page errors', errors.join(' | '));
  await ctx.close();
}

/* ---------- the Create / Sign in switch, on a dark page ---------- */
console.log('the switch on a dark page');
{
  const { ctx, page, errors } = await open('motion/', { colorScheme: 'dark' });
  await page.waitForFunction(() => !!(window.pgfxAccount && window.pgfxAccount.social), null, { timeout: 90000 });
  await page.evaluate(() => window.pgfxAccount.openAuth({}));
  await page.waitForSelector('#acct-social .social-google', { timeout: 15000 }).catch(() => {});
  const sw = await page.evaluate(() => {
    const bg = (e) => getComputedStyle(e).backgroundColor;
    const tabs = document.querySelector('.acct-tabs'), on = tabs.querySelector('[aria-selected=true]'), modal = document.querySelector('.acct-modal');
    return { modal: bg(modal), track: bg(tabs), on: bg(on), dark: matchMedia('(prefers-color-scheme: dark)').matches };
  });
  ok(sw.dark && sw.track !== sw.modal && sw.on !== sw.track && !/^rgba\(\d+, \d+, \d+, 0\)$/.test(sw.track), 'the track and the chosen side both show against the window', JSON.stringify(sw));
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
  const shown = await page.evaluate(() => ({ social: !document.getElementById('acct-social').hidden, or: !document.getElementById('acct-or').hidden, buttons: document.querySelectorAll('.social-btn').length }));
  ok(!shown.social && !shown.or && !shown.buttons && !seen.scripts.length, what + ': no buttons, no "or" line, no script loaded', JSON.stringify({ ...shown, scripts: seen.scripts }));
  if (opts.ua) ok(seen.config === 0, 'and the app does not even ask the server', 'asked ' + seen.config);
  ok(!errors.length, 'no page errors', errors.join(' | '));
  await ctx.close();
}

await browser.close();
console.log(fails.length ? '\n' + fails.length + ' FAILED:\n  ' + fails.join('\n  ') : '\nall clear');
process.exit(fails.length ? 1 : 0);
