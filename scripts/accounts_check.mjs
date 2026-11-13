#!/usr/bin/env node
/* ACCOUNT EMAIL, CHECKED (netlify/lib/accountmail.mjs, netlify/lib/mail.mjs,
   netlify/functions/api.mjs; 2026-11-12). The real function on a stand-in
   @netlify/blobs, with a stand-in Resend, Gemini and Google answering its
   fetches, so every path is walked without a key or an inbox:

   1. Mail off (no RESEND_API_KEY or MAIL_FROM, or MAIL_OFF, or a MAIL_FROM
      that is not an address): /health and /auth/config say so, a new account
      is asked nothing and nothing is held back, Forgot password? answers 503
      with the support address, nothing is sent.
   2. Mail on: a new account is sent a confirmation link (from MAIL_FROM,
      reply to support, to the address that was asked, the link on the
      request's own host), and until it is confirmed its free AI credits and
      community publishing wait (nothing charged); an operator, an older
      account and CONFIRM_GATE=off are never held; the link confirms (a forged
      one, a session token and a reset link do not); Google sign-in confirms.
   3. A forgotten password: the same answer for an address with and without an
      account; the link sets a password once, within the hour, signs in, ends
      every earlier sign-in (tokens from before iat existed too) and confirms
      the address; an older link and a used link stop working; a note says
      the password changed.
   4. Limits: five reset emails an address a day (silently), thirty requests
      from one caller (429), twenty confirmation emails from signups by one
      caller, five confirmation re-sends an account.
   5. Resend refusing: signup and Forgot password? still answer, a re-send
      says Resend's words (502). Without context.waitUntil the email is sent
      before the answer.

   B. In the headless Chromium that Playwright installs (driven over the
      DevTools protocol, so no package is needed), under the site's CSP: the
      sign-in dialog's Forgot password?, its "write to support" with mail off,
      sending the link, the /#reset= link setting a password and leaving the
      address bar, a used link asking for a new one, signup's "We sent a link",
      the menu's Confirm your email and the /#confirm= link; the same on
      account.js's dialog; no page or CSP errors; nothing wider than a phone at
      390. Skip with --no-browser; CHROME=/path picks the browser.

   usage:  node scripts/accounts_check.mjs [--no-browser]   exits non-zero on any failure */
import { mkdirSync, writeFileSync, cpSync, rmSync, readFileSync, existsSync, readdirSync, mkdtempSync } from 'node:fs';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir, homedir } from 'node:os';
import { join, extname } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const bad = [];
let passed = 0;
const ok = (cond, what) => { if (cond) passed++; else bad.push(what); return cond; };

/* ---------- the function, on a stand-in blob store ---------- */
const T = join(tmpdir(), 'accounts-check-' + process.pid);
rmSync(T, { recursive: true, force: true });
mkdirSync(join(T, 'netlify'), { recursive: true });
cpSync(join(ROOT, 'netlify'), join(T, 'netlify'), { recursive: true });
mkdirSync(join(T, 'node_modules/@netlify/blobs'), { recursive: true });
writeFileSync(join(T, 'node_modules/@netlify/blobs/package.json'), JSON.stringify({ name: '@netlify/blobs', type: 'module', main: 'index.js' }));
writeFileSync(join(T, 'node_modules/@netlify/blobs/index.js'), [
  'export const all = new Map();',
  'export const getStore = (o) => { const n = typeof o === "string" ? o : o.name; if (!all.has(n)) all.set(n, new Map()); const m = all.get(n);',
  '  return { get: async (k) => (m.has(k) ? m.get(k) : null), set: async (k, v) => { m.set(k, v); }, delete: async (k) => { m.delete(k); }, list: async () => ({ blobs: [] }) }; };',
].join('\n'));

const env = process.env;
for (const k of ['STRIPE_SECRET', 'STRIPE_WEBHOOK_SECRET', 'SITE_URL', 'URL', 'FAL_KEY', 'PGFX_BG_MODEL', 'MODEL_COSTS', 'AI_FREE_DAILY_CREDITS', 'AI_DAILY_CREDITS',
  'RESEND_API_KEY', 'MAIL_FROM', 'MAIL_REPLY_TO', 'MAIL_OFF', 'CONFIRM_GATE', 'GOOGLE_CLIENT_ID']) delete env[k];
env.JWT_SECRET = 'accounts-check-' + 'x'.repeat(32);
env.ADMIN_EMAILS = 'boss@studio.example';
env.GEMINI_KEY = 'gemini-test';
const FROM = 'BUYBACK.AD by Reselling.US <accounts@reselling.us>';
const mailOnEnv = () => { env.RESEND_API_KEY = 're_test_key'; env.MAIL_FROM = FROM; };

/* ---------- a stand-in Resend, Gemini and Google ---------- */
const mails = [];
let resendFails = false, geminiCalls = 0, googleEmail = '';
const reply = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const u = new URL(typeof input === 'string' ? input : input.url);
  if (u.hostname === 'api.resend.com') {
    if (resendFails) return reply(403, { statusCode: 403, name: 'validation_error', message: 'The reselling.us domain is not verified' });
    const h = init.headers || {};
    mails.push({ auth: h.Authorization, idem: h['Idempotency-Key'], body: JSON.parse(init.body) });
    return reply(200, { id: 'em_' + mails.length });
  }
  if (u.hostname === 'generativelanguage.googleapis.com') {
    geminiCalls++;
    return reply(200, { candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'iVBORw0KGgo=' } }] } }] });
  }
  if (u.hostname === 'oauth2.googleapis.com') return reply(200, { aud: env.GOOGLE_CLIENT_ID, email: googleEmail, email_verified: 'true', name: 'G' });
  return realFetch(input, init);
};

const api = (await import(pathToFileURL(join(T, 'netlify/functions/api.mjs')).href)).default;
const links = await import(pathToFileURL(join(T, 'netlify/lib/accountmail.mjs')).href);
const blobs = await import(pathToFileURL(join(T, 'node_modules/@netlify/blobs/index.js')).href);
const store = blobs.all;

/* one request. ctx: 'wait' (default) gives a context whose waitUntil is
   collected and settled before the next line; null gives no context at all */
let waited = 0;
const hit = async (method, path, body, token, opts = {}) => {
  const pending = [];
  const ctx = opts.ctx === null ? undefined : { waitUntil: (p) => { waited++; pending.push(p); } };
  const res = await api(new Request('https://studio.example/api' + path, {
    method, headers: Object.assign({ 'Content-Type': 'application/json', 'x-nf-client-connection-ip': opts.ip || '192.0.2.1' }, token ? { Authorization: 'Bearer ' + token } : {}),
    body: body === undefined ? undefined : JSON.stringify(body),
  }), ctx);
  const sentBefore = mails.length;
  await Promise.all(pending);
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch (e) { /* text */ }
  return { status: res.status, json, text, sentBefore };
};
const PW = 'a-long-password';
const signup = async (email, opts) => hit('POST', '/auth/signup', { email, password: PW }, undefined, opts);
const me = async (token) => hit('GET', '/me', undefined, token);
const userBlob = (em) => JSON.parse(store.get('pgfx-users').get('u:' + em));
const mailsTo = (to) => mails.filter((m) => m.body.to[0] === to);
const lastTo = (to) => mailsTo(to).slice(-1)[0];
const linkIn = (m, kind) => { const x = m && String(m.body.text).match(new RegExp('#' + kind + '=([A-Za-z0-9_.-]+)')); return x ? x[1] : null; };
const ai = async (token) => hit('POST', '/generate-bg', { text: 'shop counter', category: 'phones' }, token);
const oldToken = (email) => {   // a session token as the function made them before 2026-11-12: no iat
  const body = Buffer.from(JSON.stringify({ email, exp: Date.now() + 86400e3 })).toString('base64url');
  return body + '.' + createHmac('sha256', env.JWT_SECRET).update(body).digest('base64url');
};

/* ---------- 1. mail off ---------- */
let quiet;
{
  const h = await hit('GET', '/health');
  ok(h.status === 200 && h.json.mail === false && h.json.accounts === true, '1: /health says mail false with no RESEND_API_KEY or MAIL_FROM');
  const c = await hit('GET', '/auth/config');
  ok(c.json.mail === false && c.json.support === 'support@reselling.us', '1: /auth/config says mail false and names support@reselling.us');
  const s = await signup('quiet@x.example');
  quiet = s.json.token;
  ok(s.status === 200 && s.json.confirm === null && s.json.user.verified === null && !('mustConfirm' in s.json.user), '1: signup with mail off asks nothing (verified null, nothing to confirm)');
  ok(!('emailVerified' in userBlob('quiet@x.example')), '1: the account carries no confirmation field');
  const f = await hit('POST', '/auth/forgot', { email: 'quiet@x.example' });
  ok(f.status === 503 && f.json.mail === false && /support@reselling\.us/.test(f.json.error) && /cannot email/.test(f.json.error), '1: Forgot password? with mail off is 503 and sends the customer to support');
  const r = await hit('POST', '/auth/confirm/send', {}, quiet);
  ok(r.status === 503 && r.json.mail === false, '1: a confirmation re-send with mail off says the site cannot send email');
  const a = await ai(quiet);
  ok(a.status === 200 && a.json.image, '1: with mail off a new free account generates an AI background (nothing held back)');
  ok(mails.length === 0, '1: nothing was sent with mail off');

  const boss = (await signup('boss@studio.example')).json.token;
  env.RESEND_API_KEY = 're_test_key'; env.MAIL_FROM = 'accounts at reselling.us';
  const h2 = await hit('GET', '/health');
  const am = await hit('GET', '/admin/mail', undefined, boss);
  ok(h2.json.mail === false && am.json.on === false && am.json.missing.includes('MAIL_FROM (not an email address)'), '1: a MAIL_FROM that is not an address keeps mail off and says why');
  env.MAIL_FROM = FROM; env.MAIL_OFF = '1';
  const h3 = await hit('GET', '/health');
  const f3 = await hit('POST', '/auth/forgot', { email: 'quiet@x.example' });
  ok(h3.json.mail === false && f3.status === 503, '1: MAIL_OFF=1 stops sending with the key still set');
  delete env.MAIL_OFF;
  const am2 = await hit('GET', '/admin/mail', undefined, boss);
  ok(am2.json.on === true && am2.json.from === FROM && am2.json.replyTo === 'support@reselling.us' && am2.json.missing.length === 0 && am2.json.confirmGate === true, '1: /admin/mail for an operator: on, the sender, reply to support');
  const am3 = await hit('GET', '/admin/mail', undefined, quiet);
  ok(am3.status === 403, '1: /admin/mail is for operators only');
  delete env.RESEND_API_KEY; delete env.MAIL_FROM;
}

/* ---------- 2. confirming an address ---------- */
mailOnEnv();
let fresh;
{
  ok((await hit('GET', '/health')).json.mail === true, '2: /health says mail true with RESEND_API_KEY and MAIL_FROM');
  const w0 = waited;
  const s = await signup('new@x.example');
  fresh = s.json.token;
  const m = lastTo('new@x.example');
  ok(s.status === 200 && s.json.confirm === 'sending' && s.json.user.verified === false && s.json.user.mustConfirm === true, '2: signup with mail on: verified false, must confirm');
  ok(waited > w0 && mailsTo('new@x.example').length === 1, '2: the confirmation goes out after the answer (context.waitUntil)');
  ok(m && m.auth === 'Bearer re_test_key' && m.body.from === FROM && m.body.reply_to === 'support@reselling.us' && m.body.subject === 'Confirm your email for BUYBACK.AD', '2: from MAIL_FROM, reply to support, the subject');
  ok(m && /https:\/\/studio\.example\/#confirm=/.test(m.body.text) && m.body.html.includes('https://studio.example/#confirm=') && /support@reselling\.us/.test(m.body.text), '2: the link is on the request\'s own host, after #, in text and HTML');
  ok(m && !/—/.test(m.body.text + m.body.html), '2: no long dash in the email');

  const g0 = geminiCalls;
  const a = await ai(fresh);
  ok(a.status === 403 && a.json.needs === 'confirm' && geminiCalls === g0 && a.json.credits.total === 5, '2: an unconfirmed free account\'s AI credits wait, the model is not called, nothing charged');
  const pub = await hit('POST', '/community/publish', { name: 'x', thumb: 'data:,', data: 'data:,' }, fresh);
  ok(pub.status === 403 && pub.json.needs === 'confirm', '2: and it cannot publish to the community yet');

  const boss = (await hit('POST', '/auth/login', { email: 'boss@studio.example', password: PW })).json;
  ok(boss.user.mustConfirm === undefined, '2: an operator is never held for confirmation');
  const qm = await me(quiet);
  ok(qm.json.user.verified === null && !('mustConfirm' in qm.json.user) && (await ai(quiet)).status === 200, '2: an account made before mail was on is not held');

  const bad1 = await hit('POST', '/auth/confirm', { token: linkIn(m, 'confirm').slice(0, -2) + 'AA' });
  const bad2 = await hit('POST', '/auth/confirm', { token: fresh });
  ok(bad1.status === 400 && bad2.status === 400 && userBlob('new@x.example').emailVerified === false, '2: a forged link and a session token do not confirm');

  const again = await hit('POST', '/auth/confirm/send', {}, fresh);
  ok(again.status === 200 && again.json.sent === true && mailsTo('new@x.example').length === 2, '2: the menu sends the link again');
  let last;
  for (let i = 0; i < 5; i++) last = await hit('POST', '/auth/confirm/send', {}, fresh);
  ok(last.status === 429 && mailsTo('new@x.example').length === 6, '2: five re-sends a day, then 429 (' + last.status + ')');

  const okc = await hit('POST', '/auth/confirm', { token: linkIn(m, 'confirm') });
  const after = await me(fresh);
  ok(okc.status === 200 && okc.json.email === 'new@x.example' && !okc.json.token && after.json.user.verified === true && after.json.user.mustConfirm === undefined, '2: the link confirms, and signs nobody in');
  ok((await ai(fresh)).status === 200, '2: confirmed, the free AI credits work');
  const already = await hit('POST', '/auth/confirm/send', {}, fresh);
  ok(already.json.already === true && mailsTo('new@x.example').length === 6, '2: a confirmed account is sent nothing more');

  env.GOOGLE_CLIENT_ID = 'gid.apps.googleusercontent.com';
  await signup('g@x.example');
  googleEmail = 'g@x.example';
  const gs = await hit('POST', '/auth/google', { credential: 'cred' });
  ok(gs.status === 200 && gs.json.user.verified === true && userBlob('g@x.example').emailVerified === true, '2: signing in with Google confirms an unconfirmed address');
  googleEmail = 'newg@x.example';
  const gn = await hit('POST', '/auth/google', { credential: 'cred' });
  ok(gn.json.user.verified === true, '2: a new Google account is confirmed from the start');

  env.CONFIRM_GATE = 'off';
  const off = await signup('nogate@x.example');
  ok(off.json.user.verified === false && off.json.user.mustConfirm === undefined && (await ai(off.json.token)).status === 200 && mailsTo('nogate@x.example').length === 1, '2: CONFIRM_GATE=off still sends the link and holds nothing back');
  delete env.CONFIRM_GATE;
}

/* ---------- 3. a forgotten password ---------- */
{
  const before = mails.length;
  const none = await hit('POST', '/auth/forgot', { email: 'nobody@x.example' });
  ok(none.status === 200 && mails.length === before, '3: an address with no account gets the same answer and no email');
  const one = await hit('POST', '/auth/forgot', { email: 'New@X.example ' });
  const m1 = lastTo('new@x.example');
  ok(one.status === 200 && one.json.message === none.json.message && m1.body.subject === 'Set a new password for BUYBACK.AD', '3: an address with an account gets the same answer and the email (case and spaces ignored)');
  ok(/#reset=/.test(m1.body.text) && /one hour/.test(m1.body.text), '3: the email carries the link and says it lasts an hour');
  ok((await hit('POST', '/auth/forgot', { email: 'not-an-email' })).status === 400, '3: not an address: 400');
  await hit('POST', '/auth/forgot', { email: 'new@x.example' });
  const l1 = linkIn(m1, 'reset'), l2 = linkIn(lastTo('new@x.example'), 'reset');
  ok(l1 && l2 && l1 !== l2, '3: a second request makes a second link');

  ok((await hit('POST', '/auth/reset', { token: l2, password: 'short' })).status === 400, '3: a short password is refused');
  ok((await hit('POST', '/auth/confirm', { token: l2 })).status === 400, '3: a reset link does not confirm');
  ok((await hit('POST', '/auth/reset', { token: linkIn(lastTo('nogate@x.example'), 'confirm'), password: 'brand-new-pass' })).status === 400, '3: a confirmation link does not reset');
  const expired = await links.makeLink(env, 'reset', { e: 'new@x.example', v: userBlob('new@x.example').pwv || 0 }, 3600e3, Date.now() - 2 * 3600e3);
  ok((await hit('POST', '/auth/reset', { token: expired, password: 'brand-new-pass' })).json.expired === true, '3: a link past its hour is refused');

  const oldSession = fresh;
  const legacy = oldToken('new@x.example');
  ok((await me(legacy)).status === 200, '3: a token from before iat existed still works until a reset');
  const n0 = mailsTo('new@x.example').length;
  const r = await hit('POST', '/auth/reset', { token: l2, password: 'brand-new-pass' });
  ok(r.status === 200 && r.json.token && r.json.user.email === 'new@x.example' && r.json.user.verified === true, '3: the link sets the password and signs in');
  ok((await me(oldSession)).status === 401 && (await me(legacy)).status === 401 && (await me(r.json.token)).status === 200, '3: every earlier sign-in ends (with and without iat); the new one works');
  ok((await hit('POST', '/auth/login', { email: 'new@x.example', password: PW })).status === 401
    && (await hit('POST', '/auth/login', { email: 'new@x.example', password: 'brand-new-pass' })).status === 200, '3: the old password stops, the new one signs in');
  ok((await hit('POST', '/auth/reset', { token: l2, password: 'another-pass-1' })).json.expired === true, '3: a used link stops working');
  ok((await hit('POST', '/auth/reset', { token: l1, password: 'another-pass-1' })).json.expired === true, '3: a link sent before the reset stops working too');
  const changed = mailsTo('new@x.example').slice(n0);
  ok(changed.length === 1 && changed[0].body.subject === 'Your BUYBACK.AD password was changed', '3: a note says the password changed');

  const gr = await hit('POST', '/auth/forgot', { email: 'newg@x.example' });
  const gm = lastTo('newg@x.example');
  ok(gr.status === 200 && gm && /signs in with Google/.test(gm.body.text), '3: a Google account is told it can keep using Google');
  const gset = await hit('POST', '/auth/reset', { token: linkIn(gm, 'reset'), password: 'google-also-pass' });
  ok(gset.status === 200 && (await hit('POST', '/auth/login', { email: 'newg@x.example', password: 'google-also-pass' })).status === 200, '3: and with the link can sign in with a password too');

  const unconfirmed = await signup('later@x.example');
  const fl = await hit('POST', '/auth/forgot', { email: 'later@x.example' });
  const rs = await hit('POST', '/auth/reset', { token: linkIn(lastTo('later@x.example'), 'reset'), password: 'later-pass-1' });
  ok(unconfirmed.json.user.verified === false && fl.status === 200 && rs.json.user.verified === true && rs.json.user.mustConfirm === undefined, '3: a reset link confirms the address it went to');
}

/* ---------- 4. limits ---------- */
{
  await signup('cap@x.example');
  const c0 = mailsTo('cap@x.example').length;
  let last;
  for (let i = 0; i < 7; i++) last = await hit('POST', '/auth/forgot', { email: 'cap@x.example' }, undefined, { ip: '192.0.2.50' });
  ok(last.status === 200 && mailsTo('cap@x.example').length - c0 === 5, '4: five reset emails an address a day, the rest answered the same and not sent');
  let r;
  for (let i = 0; i < 31; i++) r = await hit('POST', '/auth/forgot', { email: 'ip' + i + '@x.example' }, undefined, { ip: '203.0.113.9' });
  ok(r.status === 429, '4: thirty reset requests from one caller a day, then 429 (' + r.status + ')');
  const s0 = mails.length;
  let last21;
  for (let i = 0; i < 21; i++) last21 = await signup('crowd' + i + '@x.example', { ip: '198.51.100.7' });
  ok(last21.status === 200 && last21.json.user.verified === false && mails.length - s0 === 20, '4: twenty confirmation emails from one caller\'s signups a day; the 21st account is made, unsent');
}

/* ---------- 5. Resend refusing, and no waitUntil ---------- */
{
  resendFails = true;
  const s = await signup('refused@x.example');
  ok(s.status === 200 && s.json.token, '5: Resend refusing does not fail signup');
  const f = await hit('POST', '/auth/forgot', { email: 'refused@x.example' });
  ok(f.status === 200, '5: nor Forgot password? (the same answer)');
  const again = await hit('POST', '/auth/confirm/send', {}, s.json.token);
  ok(again.status === 502 && /Resend answered 403/.test(again.json.error) && /not verified/.test(again.json.error), '5: a re-send says Resend\'s own words (502)');
  resendFails = false;
  const w = await signup('nowait@x.example', { ctx: null });
  ok(w.status === 200 && w.sentBefore === mails.length && mailsTo('nowait@x.example').length === 1, '5: with no context.waitUntil the email is sent before the answer');
}

console.log('accounts_check (function): ' + passed + ' passed' + (bad.length ? ', ' + bad.length + ' FAILED' : ''));

/* ---------- B. the dialogs, in a browser ---------- */
if (!process.argv.includes('--no-browser')) await browserPart();

rmSync(T, { recursive: true, force: true });
if (bad.length) { console.error(bad.map((b) => '  ✗ ' + b).join('\n')); }
console.log('accounts_check: ' + passed + ' passed, ' + bad.length + ' failed');
process.exit(bad.length ? 1 : 0);

function chromeShell() {
  if (env.CHROME) return env.CHROME;
  const base = join(homedir(), 'Library/Caches/ms-playwright');
  if (!existsSync(base)) return null;
  for (const d of readdirSync(base).filter((x) => x.startsWith('chromium_headless_shell-')).sort().reverse()) {
    for (const sub of readdirSync(join(base, d))) {
      const exe = join(base, d, sub, 'chrome-headless-shell');
      if (existsSync(exe)) return exe;
    }
  }
  return null;
}

/* the DevTools protocol, over node's own WebSocket */
function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const waiting = new Map(), listeners = [];
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && waiting.has(msg.id)) { const { res, rej } = waiting.get(msg.id); waiting.delete(msg.id); msg.error ? rej(new Error(msg.error.message)) : res(msg.result); }
    else listeners.forEach((fn) => fn(msg));
  };
  const open = new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  return {
    open, ws,
    send: (method, params = {}, sessionId) => new Promise((res, rej) => { const n = ++id; waiting.set(n, { res, rej }); ws.send(JSON.stringify({ id: n, method, params, sessionId })); }),
    on: (fn) => listeners.push(fn),
  };
}

async function browserPart() {
  const exe = chromeShell();
  if (!exe) { console.log('accounts_check: no headless Chromium (CHROME= or Playwright\'s), browser part skipped'); return; }
  const csp = (readFileSync(join(ROOT, '_headers'), 'utf8').match(/Content-Security-Policy:\s*(.+)/) || [])[1];
  const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff' };
  const server = createServer(async (req, res) => {
    try {
      const u = new URL(req.url, 'http://127.0.0.1');
      if (u.pathname.startsWith('/api/')) {
        const chunks = []; for await (const c of req) chunks.push(c);
        const pending = [];
        const r = await api(new Request('http://' + req.headers.host + u.pathname + u.search, { method: req.method, headers: req.headers, body: chunks.length ? Buffer.concat(chunks) : undefined }), { waitUntil: (p) => pending.push(p) });
        await Promise.all(pending);
        const h = {}; r.headers.forEach((v, k) => { h[k] = v; });
        res.writeHead(r.status, h); res.end(Buffer.from(await r.arrayBuffer())); return;
      }
      let f = join(ROOT, decodeURIComponent(u.pathname));
      if (u.pathname.endsWith('/')) f = join(f, 'index.html');
      if (!f.startsWith(ROOT) || !existsSync(f)) { res.writeHead(404); res.end('404'); return; }
      res.writeHead(200, Object.assign({ 'Content-Type': TYPES[extname(f)] || 'application/octet-stream' }, csp ? { 'Content-Security-Policy': csp } : {}));
      res.end(readFileSync(f));
    } catch (e) { res.writeHead(500); res.end(String(e)); }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const BASE = 'http://localhost:' + server.address().port;
  const profile = mkdtempSync(join(tmpdir(), 'accounts-check-chrome-'));
  const proc = spawn(exe, ['--headless', '--no-sandbox', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });
  let port = null;
  for (let i = 0; i < 100 && !port; i++) {
    await new Promise((r) => setTimeout(r, 100));
    try { port = readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim(); } catch (e) { /* not yet */ }
  }
  const errors = [];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  try {
    if (!port) throw new Error('the browser did not open its DevTools port');
    const ver = await (await realFetch('http://127.0.0.1:' + port + '/json/version')).json();
    const c = cdp(ver.webSocketDebuggerUrl);
    await c.open;
    c.on((m) => {
      if (m.method === 'Runtime.exceptionThrown') errors.push('page error: ' + ((m.params.exceptionDetails.exception || {}).description || m.params.exceptionDetails.text).slice(0, 200));
      if (m.method === 'Log.entryAdded' && /Content Security Policy|Refused to/.test(m.params.entry.text)) errors.push(m.params.entry.text.slice(0, 200));
    });
    const newPage = async (w) => {
      const { browserContextId } = await c.send('Target.createBrowserContext');
      const { targetId } = await c.send('Target.createTarget', { url: 'about:blank', browserContextId });
      const { sessionId } = await c.send('Target.attachToTarget', { targetId, flatten: true });
      const s = (method, params) => c.send(method, params, sessionId);
      await s('Page.enable'); await s('Runtime.enable'); await s('Log.enable');
      await s('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 600 });
      const ev = async (expr) => {
        const r = await s('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
        if (r.exceptionDetails) throw new Error('evaluate: ' + (r.exceptionDetails.exception || {}).description);
        return r.result.value;
      };
      const until = async (expr, what, ms = 8000) => {
        for (let t = 0; t < ms; t += 100) { try { if (await ev(expr)) return true; } catch (e) { /* the page is moving */ } await sleep(100); }
        bad.push('browser: timed out waiting for ' + what); return false;
      };
      const go = async (url) => { await s('Page.navigate', { url }); await sleep(300); await until('document.readyState === "complete" && typeof openAuth === "function"', 'the studio to load ' + url, 15000); await sleep(400); };
      /* SHOT_DIR=/folder keeps a picture of each screen this walks */
      const shot = async (name) => {
        if (!env.SHOT_DIR) return;
        mkdirSync(env.SHOT_DIR, { recursive: true });
        await sleep(300);
        const { data } = await s('Page.captureScreenshot', { format: 'png' });
        writeFileSync(join(env.SHOT_DIR, name + '-' + w + '.png'), Buffer.from(data, 'base64'));
      };
      return { ev, until, go, shot, close: () => c.send('Target.disposeBrowserContext', { browserContextId }) };
    };
    const type = (id, v) => `(() => { const e = document.getElementById(${JSON.stringify(id)}); e.value = ${JSON.stringify(v)}; e.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`;
    const shown = (id) => `(() => { const e = document.getElementById(${JSON.stringify(id)}); return !!e && e.offsetParent !== null; })()`;
    const text = (id) => `(document.getElementById(${JSON.stringify(id)}) || {}).textContent || ''`;
    const click = (id) => `(document.getElementById(${JSON.stringify(id)}).click(), true)`;

    /* as production runs: Google sign-in off. With GOOGLE_CLIENT_ID set, the
       site's CSP blocks Google's own stylesheet (style-src has no
       accounts.google.com), a separate gap from this check's */
    delete env.GOOGLE_CLIENT_ID;
    // mail off: Forgot password? sends the customer to support
    delete env.RESEND_API_KEY; delete env.MAIL_FROM;
    {
      const p = await newPage(1440);
      await p.go(BASE + '/');
      await p.ev(click('lp-login'));
      await p.until(shown('auth-forgot'), 'Forgot password? on the sign-in tab');
      await p.ev(click('auth-tab-up'));
      ok(!(await p.ev(shown('auth-forgot'))), 'B: Forgot password? is not on the Create account tab');
      await p.ev(click('auth-tab-in'));
      await p.ev(click('auth-forgot'));
      await p.until(`${shown('auth-reset')} && /support@reselling\\.us/.test(${text('auth-reset-sub')})`, 'the reset panel to name support with mail off');
      ok(await p.ev(`document.getElementById('auth-reset-go').style.display === 'none' && !!document.querySelector('#auth-reset-sub a[href="mailto:support@reselling.us"]')`), 'B: mail off: the reset panel offers support@reselling.us and no Send button');
      await p.shot('reset-mail-off');
      await p.close();
    }

    // mail on: sign up, the confirmation, Forgot password?, the link
    mailOnEnv();
    {
      const p = await newPage(1440);
      await p.go(BASE + '/');
      await p.ev(click('lp-signup'));
      await p.until(shown('auth-email'), 'the signup form');
      await p.ev(type('auth-email', 'ui@x.example')); await p.ev(type('auth-pass', PW));
      await p.ev(click('auth-go'));
      await p.until(`${shown('auth-type')} && /We sent a link to ui@x\\.example/.test(${text('auth-type-confirm')})`, 'signup to say the link was sent');
      ok(/free AI credits/.test(await p.ev(text('auth-type-confirm'))), 'B: signup says the link was sent, and that the free AI credits wait for it');
      await p.shot('signup-sent');
      await p.ev(click('at-free'));
      await p.until(`document.getElementById('am-confirm').style.display === '' && document.getElementById('lpam-confirm').style.display === ''`, 'the menus to offer Confirm your email');
      ok(true, 'B: the account menus offer Confirm your email');
      const token = linkIn(lastTo('ui@x.example'), 'confirm');
      await p.go(BASE + '/#confirm=' + token);
      await p.until(`/Email confirmed/.test(${text('notif')})`, 'the confirmation toast');
      ok(await p.ev(`location.hash === ''`), 'B: the confirm link leaves the address bar');
      await p.until(`document.getElementById('am-confirm').style.display === 'none'`, 'Confirm your email to go once confirmed');
      ok(userBlob('ui@x.example').emailVerified === true, 'B: the link confirmed the account');
      await p.close();
    }
    for (const w of [1440, 390]) {
      const p = await newPage(w);
      await p.go(BASE + '/');
      await p.ev(click('lp-login'));
      await p.until(shown('auth-forgot'), 'Forgot password?');
      await p.ev(type('auth-email', 'ui@x.example'));
      await p.ev(click('auth-forgot'));
      await p.until(shown('auth-reset-email'), 'the reset email field');
      ok((await p.ev(`document.getElementById('auth-reset-email').value`)) === 'ui@x.example', `B ${w}: the reset form takes the email already typed`);
      const n0 = mailsTo('ui@x.example').length;
      await p.ev(click('auth-reset-go'));
      await p.until(`/If an account uses that address/.test(${text('auth-reset-sub')}) && ${text('auth-reset-go')} === 'Done'`, 'the sent message');
      ok(mailsTo('ui@x.example').length === n0 + 1, `B ${w}: Send the link sent one email`);
      await p.shot('reset-sent');
      ok(await p.ev(`document.documentElement.scrollWidth <= innerWidth`), `B ${w}: nothing wider than the screen`);
      await p.ev(click('auth-reset-go'));
      ok(!(await p.ev(`document.getElementById('auth-overlay').classList.contains('show')`)), `B ${w}: Done closes the dialog`);

      const token = linkIn(lastTo('ui@x.example'), 'reset');
      const q = await newPage(w);
      await q.go(BASE + '/#reset=' + token);
      await q.until(`${shown('auth-reset-pass')} && ${text('auth-reset-title')} === 'Set a new password'`, 'Set a new password from the link');
      ok(await q.ev(`location.hash === ''`), `B ${w}: the reset link leaves the address bar`);
      await q.shot('reset-set');
      await q.ev(type('auth-reset-pass', 'ui-new-pass-' + w));
      await q.ev(click('auth-reset-go'));
      await q.until(`!document.getElementById('auth-overlay').classList.contains('show') && !!localStorage.getItem('pgfx_token')`, 'the password to save and sign in');
      ok(/Password changed/.test(await q.ev(text('notif'))), `B ${w}: says the password changed`);
      ok((await hit('POST', '/auth/login', { email: 'ui@x.example', password: 'ui-new-pass-' + w })).status === 200, `B ${w}: the new password signs in`);
      await q.go(BASE + '/#reset=' + token);
      await q.until(shown('auth-reset-pass'), 'the used link');
      await q.ev(type('auth-reset-pass', 'another-pass-123'));
      await q.ev(click('auth-reset-go'));
      await q.until(`/expired or was already used/.test(${text('auth-reset-err')}) && ${shown('auth-reset-email')}`, 'a used link to ask for a new one');
      ok(true, `B ${w}: a used link says so and offers to send a new one`);
      await q.close(); await p.close();
    }

    // account.js's dialog (the pages without app.js)
    {
      const p = await newPage(1440);
      await p.go(BASE + '/');   // account.js loads here too and hands over to app.js; test its own dialog directly
      const own = await p.ev(`(() => { window.openAuth = undefined; window.setAuthMode = undefined; pgfxAccount.openAuth({ mode: 'in' }); return !!document.getElementById('acct-forgot') && !document.getElementById('acct-forgot').hidden; })()`);
      ok(own, 'B: account.js\'s dialog offers Forgot password? on Sign in');
      await p.ev(click('acct-forgot'));
      ok(await p.ev(`document.getElementById('acct-pass-row').hidden && document.getElementById('acct-go').textContent === 'Send the link'`), 'B: account.js: the reset mode asks only the email');
      await p.ev(type('acct-email', 'ui@x.example'));
      const n0 = mailsTo('ui@x.example').length;
      await p.ev(`(document.getElementById('acct-form').requestSubmit(), true)`);
      await p.until(`/If an account uses that address/.test(${text('acct-note')})`, 'account.js to say the link is on its way');
      ok(mailsTo('ui@x.example').length === n0 + 1, 'B: account.js: the link was sent');
      await p.close();
    }
    ok(!errors.length, 'B: no page or CSP errors (' + errors.slice(0, 3).join(' | ') + ')');
  } catch (e) {
    bad.push('browser: ' + e.message);
  } finally {
    /* the browser writes to its profile as it quits: wait for it, then tidy */
    const gone = new Promise((r) => { if (proc.exitCode !== null) r(); else proc.once('exit', r); });
    proc.kill();
    await Promise.race([gone, sleep(5000)]);
    server.close();
    try { rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch (e) { /* a temp folder left behind is not a failure */ }
  }
}
