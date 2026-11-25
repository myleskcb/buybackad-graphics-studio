#!/usr/bin/env node
/* MAIL OUT, CHECKED (netlify/lib/mail.mjs; netlify/functions/api.mjs /auth/forgot, /auth/reset/check,
   /auth/reset, /auth/confirm, /auth/confirm/send; account.js and app.js's Forgot password?;
   reset.html, confirm.html and mail-link.js; DESIGN-LAW 182). The real function, with a stand-in
   @netlify/blobs and a stand-in Postmark answering its fetches, so every path is walked without a
   key and without sending anything:

   1. Mail off (no POSTMARK_TOKEN): sign-up works and mails nothing, Forgot password? says so in
      the same words for every address, no account is asked to confirm, /api/health says mail false.
   2. The address check. A sign-up with a password mails one link from support@webuy.ad, signed
      WeBuy.AD, with no tracking, to the configured site (never the request's Host); the token is
      kept only as a hash; the account works and its menu note shows; the link confirms it once;
      a link sent again retires the older one; a link past 7 days has expired; Google and Apple
      accounts are never asked; 3 links an hour for an account.
   3. The reset link. The same reply, status and body, for an address with an account and one
      without, the lookup and the mail handed to waitUntil after the reply in both; a link that
      works once, for 60 minutes; a newer link retires the older; the new password signs in and
      the old one stops; the reset confirms the address; a Google-only account gets a link that
      names Google and can add a password; Postmark failing changes nothing a stranger can see.
   4. Rate limits: 3 an hour for an address (the same reply for an address with an account and one
      without), 10 an hour from an IP, sign-ups' links 10 an hour from an IP (the account is still
      made), 30 tries at a link an hour from an IP, each window over after an hour.
   5. In Chromium under the production CSP (skip with --no-browser): both dialogs' Forgot
      password? step, the studio's sign-up line and its menu note's Send the link, reset.html with
      no link, a good link (the hash leaves the address bar, the password is saved, the visitor is
      signed in) and a used one, confirm.html, no sideways scroll and nothing under 12px from 320 to
      1280, no CSP or page errors.
   6. Sign in with Apple and Google still pass scripts/social_signin_check.mjs, served from this
      worktree on a port of its own (skip with --no-social).

   usage:  [PLAYWRIGHT_MODULE=/path/to/playwright] node scripts/mail_check.mjs [--no-browser] [--no-social]
   Exits non-zero on any failure. Written 2026-11-24. */
import { mkdirSync, writeFileSync, cpSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { execSync, spawn } from 'node:child_process';
import { createHmac, createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { join, extname } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const bad = [];
let passed = 0;
const ok = (cond, what) => { if (cond) passed++; else bad.push(what); return cond; };

/* ---------- the function, on a stand-in blob store ---------- */
const T = join(tmpdir(), 'mail-check-' + process.pid);
rmSync(T, { recursive: true, force: true });
mkdirSync(join(T, 'netlify'), { recursive: true });
cpSync(join(ROOT, 'netlify'), join(T, 'netlify'), { recursive: true });
mkdirSync(join(T, 'node_modules/@netlify/blobs'), { recursive: true });
writeFileSync(join(T, 'node_modules/@netlify/blobs/package.json'), JSON.stringify({ name: '@netlify/blobs', type: 'module', main: 'index.js' }));
writeFileSync(join(T, 'node_modules/@netlify/blobs/index.js'), [
  'export const all = new Map();',
  'export const getStore = (o) => { const n = typeof o === "string" ? o : o.name; if (!all.has(n)) all.set(n, new Map()); const m = all.get(n);',
  '  return { get: async (k) => (m.has(k) ? m.get(k) : null), set: async (k, v) => { m.set(k, v); }, delete: async (k) => { m.delete(k); }, list: async (o) => ({ blobs: [...m.keys()].filter((k) => !(o && o.prefix) || k.startsWith(o.prefix)).map((key) => ({ key })) }) }; };',
].join('\n'));

const env = process.env;
for (const k of ['POSTMARK_TOKEN', 'SITE_URL', 'URL', 'STRIPE_SECRET', 'GOOGLE_CLIENT_ID', 'APPLE_CLIENT_ID', 'APPLE_BUNDLE_ID', 'FAL_KEY', 'GEMINI_KEY', 'ADMIN_EMAILS']) delete env[k];
env.JWT_SECRET = 'mail-check-' + 'x'.repeat(32);

/* ---------- a stand-in Postmark ---------- */
const sent = [];
let postmarkFails = 0;
const others = [];
const reply = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const u = new URL(typeof input === 'string' ? input : input.url);
  if (u.hostname === 'api.postmarkapp.com') {
    const h = init.headers || {};
    const body = JSON.parse(String(init.body || '{}'));
    sent.push({ path: u.pathname, method: init.method, key: h['X-Postmark-Server-Token'], accept: h.Accept, body });
    if (postmarkFails) return reply(postmarkFails, { ErrorCode: 300, Message: 'Invalid email request' });
    if (!h['X-Postmark-Server-Token']) return reply(401, { ErrorCode: 10, Message: 'No Account or Server API tokens were supplied' });
    return reply(200, { To: body.To, SubmittedAt: new Date().toISOString(), MessageID: 'pm-' + sent.length, ErrorCode: 0, Message: 'OK' });
  }
  others.push(u.href);
  return realFetch(input, init);
};

/* the clock, moved forward to walk past an expiry or a window */
const realNow = Date.now;
let clock = 0;
Date.now = () => realNow() + clock;

const api = (await import(pathToFileURL(join(T, 'netlify/functions/api.mjs')).href)).default;
const mail = await import(pathToFileURL(join(T, 'netlify/lib/mail.mjs')).href);
const blobs = await import(pathToFileURL(join(T, 'node_modules/@netlify/blobs/index.js')).href);
const usersStore = () => blobs.all.get('pgfx-users') || new Map();
const userBlob = (em) => JSON.parse(usersStore().get('u:' + em) || 'null');
const setUser = (u) => usersStore().set('u:' + u.email, JSON.stringify(u));

let ipN = 0;
const freshIp = () => { ipN++; return '10.' + ((ipN >> 16) & 255) + '.' + ((ipN >> 8) & 255) + '.' + (ipN & 255); };
/* one request to the function; a fresh IP unless one is named, so the address limits are walked
   apart from the IP limits */
const hit = async (method, path, body, o = {}) => {
  const ip = o.ip || freshIp();
  const res = await api(new Request('https://' + (o.host || 'studio.example') + '/api' + path, {
    method, headers: Object.assign({ 'Content-Type': 'application/json', 'x-nf-client-connection-ip': ip }, o.token ? { Authorization: 'Bearer ' + o.token } : {}),
    body: body === undefined ? undefined : JSON.stringify(body),
  }), o.ctx);
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch (e) { /* text */ }
  return { status: res.status, json, text, type: res.headers.get('content-type') };
};
const b64u = (b) => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const tokenFor = (email) => { const body = b64u(JSON.stringify({ email, exp: Date.now() + 86400e3 })); return body + '.' + b64u(createHmac('sha256', env.JWT_SECRET).update(body).digest()); };
const linkIn = (m) => { const x = String(m && m.body && m.body.TextBody || '').match(/(https?:\/\/\S+?)#t=([A-Za-z0-9_-]{43})(?=\s)/); return x ? { base: x[1], token: x[2] } : null; };
const mailsTo = (em, since = 0) => sent.slice(since).filter((m) => m.body.To === em);
const sha = (s) => createHash('sha256').update(s).digest('hex');
const signup = (email, o) => hit('POST', '/auth/signup', { email, password: 'first-password-1' }, o);
const me = async (token) => (await hit('GET', '/me', undefined, { token })).json.user;

/* ---------- 1. mail off ---------- */
{
  const s = await signup('off@shop.example');
  ok(s.status === 200 && s.json.token && s.json.confirmSent === false, 'off: sign-up works and says no link went (' + s.status + ')');
  ok(s.json.user && s.json.user.confirmed === false && s.json.user.askConfirm === false, 'off: the account is not confirmed, and nothing asks it to be');
  const k = await hit('POST', '/auth/forgot', { email: 'off@shop.example' });
  const u = await hit('POST', '/auth/forgot', { email: 'nobody-off@shop.example' });
  ok(k.status === 503 && u.status === 503 && k.text === u.text && /support@webuy\.ad/.test(k.json.error), 'off: Forgot password? says mail is not on, in the same words for every address (' + k.text + ')');
  const cs = await hit('POST', '/auth/confirm/send', {}, { token: s.json.token });
  ok(cs.status === 503, 'off: Send the link says mail is not on');
  const h = (await hit('GET', '/health')).json;
  ok(h.mail === false && (await hit('GET', '/auth/config')).json.mail === false, 'off: /api/health and /api/auth/config say mail false');
  ok(sent.length === 0, 'off: nothing was sent');
}

/* ---------- 2. the address check ---------- */
env.POSTMARK_TOKEN = 'pm-test-server-token';
env.URL = 'https://webuy.ad';
let patToken;
{
  const s = await signup('pat@shop.example');
  patToken = s.json.token;
  const m = mailsTo('pat@shop.example');
  ok(s.status === 200 && s.json.confirmSent === true && m.length === 1, 'confirm: a sign-up with a password mails one link (' + m.length + ')');
  const b = (m[0] || {}).body || {}, link = linkIn(m[0]);
  ok(m[0] && m[0].path === '/email' && m[0].method === 'POST' && m[0].key === 'pm-test-server-token' && m[0].accept === 'application/json', "confirm: one call to Postmark's /email with the server token");
  ok(b.From === 'WeBuy.AD <support@webuy.ad>' && b.ReplyTo === 'support@webuy.ad' && b.MessageStream === 'outbound', 'confirm: from support@webuy.ad, replies to it, on the transactional stream');
  ok(b.TrackOpens === false && b.TrackLinks === 'None', 'confirm: no open or link tracking, so the link stays the site\'s own');
  ok(b.Subject === 'Confirm your email for WeBuy.AD' && /^Hi,/.test(b.TextBody) && /\n\nWeBuy\.AD\nhttps:\/\/webuy\.ad\n$/.test(b.TextBody), 'confirm: a plain subject, Hi, and signed WeBuy.AD');
  ok(/works for 7 days/.test(b.TextBody) && /already works/.test(b.TextBody) && /ignore this email/.test(b.TextBody), 'confirm: says how long, that the account works either way, and what to do if it was not them');
  ok(!!link && link.base === 'https://webuy.ad/confirm.html' && b.HtmlBody.includes(link.base + '#t=' + link.token) && /Confirm my email/.test(b.HtmlBody), 'confirm: the link is https://webuy.ad/confirm.html#t=…, in the text and as the HTML\'s button');
  ok(!/undefined|null|\$\{/.test(b.TextBody + b.HtmlBody), 'confirm: no undefined, null or template left in the mail');
  const vals = [...usersStore().values()].join('\n');
  ok(link && !vals.includes(link.token) && usersStore().has('mt:' + sha(link.token)), 'confirm: the token is kept only as its SHA-256');
  let u = await me(patToken);
  ok(u.confirmed === false && u.askConfirm === true, 'confirm: the account works and its menu note shows');
  const c = await hit('POST', '/auth/confirm', { token: link && link.token });
  ok(c.status === 200 && c.json.ok && c.json.email === 'pat@shop.example', 'confirm: the link confirms the address, no sign-in needed');
  u = await me(patToken);
  ok(u.confirmed === true && u.askConfirm === false, 'confirm: then the note goes');
  const again = await hit('POST', '/auth/confirm', { token: link && link.token });
  ok(again.status === 400 && again.json.link === 'used' && /already been used/.test(again.json.error), 'confirm: the same link a second time is used');
  ok((await hit('POST', '/auth/confirm', { token: 'abc' })).json.link === 'bad', 'confirm: a broken link says it is not complete');
  const n0 = sent.length, done = await hit('POST', '/auth/confirm/send', {}, { token: patToken });
  ok(done.status === 200 && done.json.already === true && sent.length === n0, 'confirm: a confirmed account is sent nothing more');
  ok((await hit('GET', '/health')).json.mail === true && (await hit('GET', '/auth/config')).json.mail === true, '/api/health and /api/auth/config say mail true');
}
{
  const s = await signup('sam@shop.example');
  const first = linkIn(mailsTo('sam@shop.example')[0]);
  const r = await hit('POST', '/auth/confirm/send', {}, { token: s.json.token });
  const second = linkIn(mailsTo('sam@shop.example')[1]);
  ok(r.status === 200 && r.json.sent === true && second && second.token !== first.token, 'confirm: Send the link mails a new one');
  ok((await hit('POST', '/auth/confirm', { token: first.token })).json.link === 'used', 'confirm: the older link stops working');
  ok((await hit('POST', '/auth/confirm', { token: second.token })).status === 200, 'confirm: the newer one works');
}
let kimToken, kimConfirm;
{
  const s = await signup('kim@shop.example');
  kimToken = s.json.token; kimConfirm = linkIn(mailsTo('kim@shop.example')[0]);
  clock = 7 * 86400e3 + 60e3;
  const x = await hit('POST', '/auth/confirm', { token: kimConfirm.token });
  ok(x.status === 400 && x.json.link === 'expired' && /7 days/.test(x.json.error), 'confirm: a link past 7 days has expired, and says so');
  clock = 0;
  ok((await me(kimToken)).askConfirm === true, 'confirm: the account still works, still asked gently');
}
{
  const s = await signup('lee@shop.example');
  const codes = [];
  for (let i = 0; i < 4; i++) codes.push((await hit('POST', '/auth/confirm/send', {}, { token: s.json.token })).status);
  ok(codes.join() === '200,200,200,429', 'limits: 3 confirmation links an hour for an account (' + codes + ')');
  clock = 3600e3 + 60e3;
  ok((await hit('POST', '/auth/confirm/send', {}, { token: tokenFor('lee@shop.example') })).status === 200, 'limits: and again after the hour');
  clock = 0;
}
{
  setUser({ email: 'gia@gmail.example', provider: 'google', plan: 'free', exports: { period: '', count: 0 }, created: Date.now(), name: 'Gia' });
  setUser({ email: 'ava@privaterelay.appleid.com', provider: 'apple', appleSub: 'a.1', plan: 'free', exports: { period: '', count: 0 }, created: Date.now() });
  const g = await me(tokenFor('gia@gmail.example')), a = await me(tokenFor('ava@privaterelay.appleid.com'));
  ok(g.confirmed === true && g.askConfirm === false && a.confirmed === true && a.askConfirm === false, 'confirm: Google and Apple accounts are confirmed by them, never asked');
}

/* ---------- 3. the reset link ---------- */
{
  /* the same reply for an address with an account and one without, the work after it in both */
  const runs = [];
  for (const email of ['pat@shop.example', 'nobody@shop.example']) {
    const pend = [], n0 = sent.length;
    const r = await hit('POST', '/auth/forgot', { email }, { ctx: { ip: freshIp(), waitUntil: (p) => pend.push(p) } });
    await Promise.all(pend);
    runs.push({ r, handed: pend.length, mails: mailsTo(email, n0).length });
  }
  const [k, u] = runs;
  ok(k.r.status === 200 && u.r.status === 200 && k.r.text === u.r.text && k.r.type === u.r.type && k.r.text === '{"ok":true}', 'reset: the same status and body for an address with an account and one without (' + k.r.text + ' / ' + u.r.text + ')');
  ok(k.handed === 1 && u.handed === 1, 'reset: in both the lookup and the mail are handed to waitUntil, after the reply');
  ok(k.mails === 1 && u.mails === 0, 'reset: only the address with an account gets mail');
  const plain = [await hit('POST', '/auth/forgot', { email: 'sam@shop.example' }), await hit('POST', '/auth/forgot', { email: 'nobody2@shop.example' })];
  ok(plain[0].text === plain[1].text && plain[0].status === 200, 'reset: the same reply without waitUntil too');
  ok((await hit('POST', '/auth/forgot', { email: 'not an email' })).status === 400, 'reset: a malformed address is told so (the same for any)');
}
{
  const m = mailsTo('pat@shop.example').filter((x) => x.body.Tag === 'password-reset').pop();
  const b = (m || {}).body || {}, link = linkIn(m);
  ok(b.Subject === 'Reset your WeBuy.AD password' && b.From === 'WeBuy.AD <support@webuy.ad>' && b.TrackLinks === 'None' && b.TrackOpens === false, 'reset: the mail is from support@webuy.ad, plainly named, untracked');
  ok(/works once, for the next 60 minutes/.test(b.TextBody) && /ignore this email\. Your password stays as it is/.test(b.TextBody) && /reply to this email/.test(b.TextBody) && /\n\nWeBuy\.AD\nhttps:\/\/webuy\.ad\n$/.test(b.TextBody), 'reset: says once and how long, what to do if it was not them, and is signed WeBuy.AD');
  ok(!!link && link.base === 'https://webuy.ad/reset.html' && /Choose a new password/.test(b.HtmlBody) && !/Google|Apple/.test(b.TextBody), 'reset: the link is https://webuy.ad/reset.html#t=… and a password account is not told about Google or Apple');
  const chk = await hit('POST', '/auth/reset/check', { token: link.token });
  ok(chk.status === 200 && chk.json.email === 'pat@shop.example', 'reset: the page learns whose link it is');
  ok((await hit('POST', '/auth/reset', { token: link.token, password: 'short' })).status === 400, 'reset: a password under 8 characters is refused, the link still good');
  const r = await hit('POST', '/auth/reset', { token: link.token, password: 'new-password-2' });
  ok(r.status === 200 && r.json.token && r.json.user.email === 'pat@shop.example' && (await me(r.json.token)).email === 'pat@shop.example', 'reset: the new password is saved and signs the visitor in');
  ok((await hit('POST', '/auth/login', { email: 'pat@shop.example', password: 'new-password-2' })).status === 200, 'reset: the new password signs in');
  ok((await hit('POST', '/auth/login', { email: 'pat@shop.example', password: 'first-password-1' })).status === 401, 'reset: the old one does not');
  const re = await hit('POST', '/auth/reset', { token: link.token, password: 'another-pass-3' });
  ok(re.status === 400 && re.json.link === 'used' && (await hit('POST', '/auth/reset/check', { token: link.token })).json.link === 'used', 'reset: the link works once');
  ok((await hit('POST', '/auth/login', { email: 'pat@shop.example', password: 'new-password-2' })).status === 200, 'reset: and its second use changed nothing');
  ok(![...usersStore().values()].join('\n').includes(link.token), 'reset: the token was never stored as is');
}
{
  const n0 = sent.length;
  await hit('POST', '/auth/forgot', { email: 'kim@shop.example' });
  await hit('POST', '/auth/forgot', { email: 'kim@shop.example' });
  const [r1, r2] = mailsTo('kim@shop.example', n0).map(linkIn);
  ok(r1 && r2 && (await hit('POST', '/auth/reset/check', { token: r1.token })).json.link === 'used' && (await hit('POST', '/auth/reset/check', { token: r2.token })).status === 200, 'reset: a newer link retires the older');
  ok((await me(kimToken)).confirmed === false, 'reset: asking for a link confirms nothing yet');
  await hit('POST', '/auth/reset', { token: r2.token, password: 'kim-new-pass-1' });
  const u = await me(kimToken);
  ok(u.confirmed === true && u.askConfirm === false && (await hit('POST', '/auth/confirm', { token: kimConfirm.token })).json.link === 'used', 'reset: using it confirms the address, and the pending confirmation link is spent');
}
{
  setUser({ email: 'ray@shop.example', salt: 's', hash: 'h', plan: 'free', exports: { period: '', count: 0 }, created: Date.now() });
  const n0 = sent.length;
  await hit('POST', '/auth/forgot', { email: 'ray@shop.example' });
  const l = linkIn(mailsTo('ray@shop.example', n0)[0]);
  clock = 60 * 60e3 + 30e3;
  const x = await hit('POST', '/auth/reset', { token: l.token, password: 'late-password-1' });
  ok(x.status === 400 && x.json.link === 'expired' && /60 minutes/.test(x.json.error), 'reset: past 60 minutes the link has expired, and says so');
  clock = 0;
  ok(userBlob('ray@shop.example').hash === 'h', 'reset: an expired link changed nothing');
}
{
  const gia = 'gia@gmail.example', n0 = sent.length;
  ok(/Google sign-in/.test((await hit('POST', '/auth/login', { email: gia, password: 'whatever-1' })).json.error), 'google: the password form sends a Google account to its button');
  await hit('POST', '/auth/forgot', { email: gia });
  const m = mailsTo(gia, n0)[0], l = linkIn(m);
  ok(!!l && /also signs in with Google, and that keeps working/.test(m.body.TextBody), 'google: a Google-only account gets a link that says Google keeps working');
  ok((await hit('POST', '/auth/reset', { token: l.token, password: 'gia-password-1' })).status === 200 && (await hit('POST', '/auth/login', { email: gia, password: 'gia-password-1' })).status === 200, 'google: and can add a password with it');
  ok(userBlob(gia).provider === 'google', 'google: the account still signs in with Google');
}
{
  postmarkFails = 500;
  const k = await hit('POST', '/auth/forgot', { email: 'sam@shop.example' }), u = await hit('POST', '/auth/forgot', { email: 'nobody3@shop.example' });
  ok(k.status === 200 && k.text === u.text, 'postmark down: Forgot password? still answers the same for everyone');
  const s = await signup('dee@shop.example');
  ok(s.status === 200 && s.json.token, 'postmark down: sign-up still makes the account');
  const cs = await hit('POST', '/auth/confirm/send', {}, { token: s.json.token });
  ok(cs.status === 502 && /did not go out/.test(cs.json.error), 'postmark down: Send the link says the email did not go out');
  postmarkFails = 0;
}
{
  /* the link's address is the configured site, never what the request's Host says */
  const n0 = sent.length;
  await hit('POST', '/auth/forgot', { email: 'pat@shop.example' }, { host: 'evil.example' });
  const l = linkIn(mailsTo('pat@shop.example', n0)[0]);
  ok(l && l.base === 'https://webuy.ad/reset.html', 'reset: a request naming another Host still mails https://webuy.ad (' + (l && l.base) + ')');
  env.SITE_URL = 'https://studio.webuy.test';
  await hit('POST', '/auth/forgot', { email: 'pat@shop.example' });
  const l2 = linkIn(mailsTo('pat@shop.example', n0)[1]);
  ok(l2 && l2.base === 'https://studio.webuy.test/reset.html', 'reset: SITE_URL comes first when it is set');
  delete env.SITE_URL;
}

/* ---------- 4. rate limits ---------- */
{
  setUser({ email: 'lou@shop.example', salt: 's', hash: 'h', plan: 'free', exports: { period: '', count: 0 }, created: Date.now() });
  const known = [], unknown = [];
  for (let i = 0; i < 4; i++) {
    known.push(await hit('POST', '/auth/forgot', { email: 'lou@shop.example' }));
    unknown.push(await hit('POST', '/auth/forgot', { email: 'zed@shop.example' }));
  }
  ok(known.map((r) => r.status).join() === '200,200,200,429' && unknown.map((r) => r.status).join() === '200,200,200,429', 'limits: 3 reset requests an hour for an address, from any IPs (' + known.map((r) => r.status) + ')');
  ok(known[3].text === unknown[3].text && /Try again in 60 minutes/.test(known[3].json.error), 'limits: the 4th says the same for an address with an account and one without (' + known[3].text + ')');
  ok(mailsTo('lou@shop.example').length === 3, 'limits: and mails nothing more');
  const ip = freshIp(), codes = [];
  for (let i = 0; i < 11; i++) codes.push((await hit('POST', '/auth/forgot', { email: 'someone' + i + '@shop.example' }, { ip })).status);
  ok(codes.slice(0, 10).every((c) => c === 200) && codes[10] === 429, 'limits: 10 reset requests an hour from one IP (' + codes.join(',') + ')');
  clock = 3600e3 + 60e3;
  ok((await hit('POST', '/auth/forgot', { email: 'someone99@shop.example' }, { ip })).status === 200 && (await hit('POST', '/auth/forgot', { email: 'lou@shop.example' })).status === 200, 'limits: both windows open again after the hour');
  clock = 0;
  const sip = freshIp(), made = [];
  for (let i = 0; i < 11; i++) made.push(await signup('new' + i + '@shop.example', { ip: sip }));
  ok(made.every((r) => r.status === 200 && r.json.token) && made.slice(0, 10).every((r) => r.json.confirmSent) && made[10].json.confirmSent === false, 'limits: 10 sign-up links an hour from one IP; the 11th account is still made, without mail');
  ok(mailsTo('new10@shop.example').length === 0 && (await me(made[10].json.token)).askConfirm === true, 'limits: and its menu note can send the link later');
  const lip = freshIp(), tries = [];
  for (let i = 0; i < 31; i++) tries.push((await hit('POST', '/auth/reset/check', { token: 'A'.repeat(42) + String.fromCharCode(65 + (i % 26)) }, { ip: lip })).status);
  ok(tries.slice(0, 30).every((c) => c === 400) && tries[30] === 429, 'limits: 30 tries at a link an hour from one IP (' + tries.slice(28).join(',') + ')');
  const keys = [...usersStore().keys()].filter((k) => k.startsWith('rl:'));
  ok(keys.length > 0 && keys.every((k) => /^rl:[a-z]{2}:[0-9a-f]{64}$/.test(k)), 'limits: their counters are named by hashes, never an address or an IP');
}

/* ---------- account deletion takes its links ---------- */
{
  const s = await signup('del@shop.example');
  await hit('POST', '/auth/forgot', { email: 'del@shop.example' });
  const links = mailsTo('del@shop.example').map(linkIn);
  const d = await hit('POST', '/account/delete', { confirm: 'delete' }, { token: s.json.token });
  ok(d.status === 200 && links.length === 2 && links.every((l) => !usersStore().has('mt:' + sha(l.token))), 'delete: a deleted account\'s mailed links are gone too');
}
ok(others.length === 0, 'the function fetched nothing but Postmark' + (others.length ? ': ' + others.slice(0, 3).join(' ') : ''));

/* the words, from the module itself */
{
  const r = mail.resetMail({ link: 'https://webuy.ad/reset.html#t=x', social: 'Apple' });
  ok(/also signs in with Apple/.test(r.text) && r.tag === 'password-reset' && mail.confirmMail({ link: 'L' }).tag === 'email-confirm', 'words: Apple named for an Apple account; each mail tagged by kind');
  ok(!/click here|!{2}|URGENT|act now/i.test(r.text + mail.confirmMail({ link: 'L' }).text), 'words: plain, no "click here", no shouting');
}

/* ---------- 5. in Chromium ---------- */
let chromium = null;
if (!process.argv.includes('--no-browser') || !process.argv.includes('--no-social')) chromium = await loadChromium();
const server = await serve();
const BASE = 'http://127.0.0.1:' + server.address().port + '/';
try {
  if (!process.argv.includes('--no-browser')) {
    if (chromium) await browserPart(chromium);
    else ok(false, 'browser: no Playwright found (PLAYWRIGHT_MODULE=/path/to/playwright, or --no-browser)');
  }
  /* ---------- 6. Apple and Google, as scripts/social_signin_check.mjs has them ---------- */
  if (!process.argv.includes('--no-social')) {
    const code = await new Promise((res) => {
      const child = spawn(process.execPath, [join(ROOT, 'scripts/social_signin_check.mjs')], {
        env: Object.assign({}, process.env, { GFX_BASE: BASE, PLAYWRIGHT_MODULE: process.env.PLAYWRIGHT_MODULE || 'playwright' }), stdio: ['ignore', 'pipe', 'pipe'],
      });
      let out = '';
      child.stdout.on('data', (d) => { out += d; });
      child.stderr.on('data', (d) => { out += d; });
      child.on('close', (c) => { console.log(out.trim().split('\n').map((l) => '    social │ ' + l).join('\n')); res(c); });
    });
    ok(code === 0, 'Sign in with Apple and Google still pass scripts/social_signin_check.mjs (exit ' + code + ')');
  }
} finally {
  server.close();
}

rmSync(T, { recursive: true, force: true });
Date.now = realNow;
console.log(`mail_check: ${passed} passed, ${bad.length} failed`);
for (const b of bad) console.log('  FAIL ' + b);
process.exit(bad.length ? 1 : 0);

/* the repo as Netlify serves it: the production CSP on the pages, /api/* by the function */
async function serve() {
  const csp = (readFileSync(join(ROOT, '_headers'), 'utf8').match(/Content-Security-Policy:\s*(.+)/) || [])[1];
  const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.ttf': 'font/ttf', '.txt': 'text/plain' };
  const srv = createServer(async (req, res) => {
    try {
      const u = new URL(req.url, 'http://127.0.0.1');
      if (u.pathname.startsWith('/api/')) {
        const chunks = []; for await (const c of req) chunks.push(c);
        const r = await api(new Request('http://' + req.headers.host + u.pathname + u.search, { method: req.method, headers: req.headers, body: chunks.length ? Buffer.concat(chunks) : undefined }), { ip: '127.0.0.' + (1 + (ipN++ % 200)) });
        const h = {}; r.headers.forEach((v, k) => { h[k] = v; });
        res.writeHead(r.status, h); res.end(Buffer.from(await r.arrayBuffer())); return;
      }
      let f = join(ROOT, decodeURIComponent(u.pathname));
      if (u.pathname.endsWith('/')) f = join(f, 'index.html');
      if (!f.startsWith(ROOT) || !existsSync(f)) { res.writeHead(404); res.end('404'); return; }
      res.writeHead(200, Object.assign({ 'Content-Type': TYPES[extname(f)] || 'application/octet-stream' }, csp && extname(f) === '.html' ? { 'Content-Security-Policy': csp } : {}));
      res.end(readFileSync(f));
    } catch (e) { res.writeHead(500); res.end(String(e)); }
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  return srv;
}

async function loadChromium() {
  const tries = [process.env.PLAYWRIGHT_MODULE, 'playwright'];
  try { tries.push(join(execSync('npm root -g').toString().trim(), 'playwright/index.mjs')); } catch (e) { /* no npm */ }
  for (const t of tries.filter(Boolean)) {
    try {
      const spec = t.startsWith('/') ? pathToFileURL(existsSync(join(t, 'index.mjs')) ? join(t, 'index.mjs') : t).href : t;
      const m = await import(spec);
      const c = m.chromium || (m.default && m.default.chromium);
      if (c) { if (!process.env.PLAYWRIGHT_MODULE && t.startsWith('/')) process.env.PLAYWRIGHT_MODULE = t.replace(/\/index\.mjs$/, ''); return c; }
    } catch (e) { /* the next */ }
  }
  return null;
}

async function browserPart(chromium) {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const errors = [];
  const open = async (path, { width = 1280, token, stub = true } = {}) => {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    if (token) await ctx.addInitScript((t) => { try { localStorage.setItem('pgfx_token', JSON.stringify(t)); localStorage.setItem('pgfx_seen_account', 'true'); } catch (e) { /* none */ } }, token);
    const page = await ctx.newPage();
    await page.route('**/*', (route) => {
      const url = route.request().url();
      if (url.startsWith(BASE)) return route.continue();
      if (stub && /appleid\.cdn-apple\.com|accounts\.google\.com/.test(url)) return route.abort();   // no Apple or Google here: social_signin_check has them
      return route.continue();
    });
    page.on('console', (m) => { if (m.type() === 'error' && /Content Security Policy|Refused to/.test(m.text())) errors.push(path + ': ' + m.text().slice(0, 200)); });
    page.on('pageerror', (e) => errors.push(path + ': page error: ' + e.message));
    await page.goto(BASE + path, { waitUntil: 'load', timeout: 120000 });
    return { ctx, page };
  };
  const vis = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return false; const r = e.getBoundingClientRect(); const st = getComputedStyle(e); return !e.hidden && st.display !== 'none' && st.visibility !== 'hidden' && r.width > 0 && r.height > 0; }, sel);
  const text = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); return e ? e.textContent.trim() : ''; }, sel);
  try {
    /* reset.html with no link: ask for one */
    {
      setUser({ email: 'web@shop.example', salt: 's', hash: 'h', plan: 'free', exports: { period: '', count: 0 }, created: Date.now() });
      const { ctx, page } = await open('reset.html', { width: 390 });
      await page.waitForFunction(() => !document.getElementById('ap-ask').hidden, null, { timeout: 15000 }).catch(() => {});
      ok(await vis(page, '#ap-ask') && !(await vis(page, '#ap-new')) && (await text(page, '#ap-title')) === 'Reset your password', 'reset.html: with no link it asks for the email');
      const n0 = sent.length;
      await page.fill('#ap-email', 'web@shop.example');
      await page.click('#ap-send');
      await page.waitForFunction(() => !document.getElementById('ap-ask-sent').hidden, null, { timeout: 15000 }).catch(() => {});
      ok(/If web@shop\.example has a WeBuy\.AD account, a link to choose a new password is on its way/.test(await text(page, '#ap-ask-sent')) && mailsTo('web@shop.example', n0).length === 1, 'reset.html: Send reset link says the same words, and the mail went');
      await ctx.close();
    }
    /* reset.html with the mailed link */
    const l = linkIn(mailsTo('web@shop.example').pop());
    {
      const { ctx, page } = await open('reset.html#t=' + l.token, { width: 390 });
      await page.waitForFunction(() => !document.getElementById('ap-new').hidden, null, { timeout: 15000 }).catch(() => {});
      ok(await vis(page, '#ap-new') && /For web@shop\.example/.test(await text(page, '#ap-lead')), 'reset.html: a good link asks for the new password, and names the account');
      ok(await page.evaluate(() => location.hash === '' && !location.href.includes('#')), 'reset.html: the token leaves the address bar');
      ok(await page.evaluate(() => document.querySelector('meta[name=referrer]').content === 'no-referrer' && !document.querySelector('script[src*="cloudflareinsights"]')), 'reset.html: no Referer and no analytics on a page that holds a token');
      await page.fill('#ap-pass', 'short');
      await page.click('#ap-save');
      await page.waitForTimeout(300);
      ok(/at least 8/.test(await text(page, '#ap-new-msg')), 'reset.html: a short password is told so');
      await page.click('#ap-eye');
      ok(await page.evaluate(() => document.getElementById('ap-pass').type === 'text' && document.getElementById('ap-eye').textContent === 'Hide'), 'reset.html: Show shows the password');
      await page.fill('#ap-pass', 'browser-password-1');
      await page.click('#ap-save');
      await page.waitForFunction(() => !document.getElementById('ap-done').hidden, null, { timeout: 15000 }).catch(() => {});
      const st = await page.evaluate(() => ({ title: document.getElementById('ap-title').textContent, t: JSON.parse(localStorage.getItem('pgfx_token') || 'null'), seen: localStorage.getItem('pgfx_seen_account') }));
      ok(st.title === 'Your new password is saved' && typeof st.t === 'string' && st.seen === 'true', 'reset.html: the password is saved and the visitor signed in (' + st.title + ')');
      ok(st.t && (await me(st.t)).email === 'web@shop.example' && (await hit('POST', '/auth/login', { email: 'web@shop.example', password: 'browser-password-1' })).status === 200, 'reset.html: the new password signs in');
      await ctx.close();
    }
    {
      const { ctx, page } = await open('reset.html#t=' + l.token, { width: 390 });
      await page.waitForFunction(() => !document.getElementById('ap-ask').hidden, null, { timeout: 15000 }).catch(() => {});
      ok(await vis(page, '#ap-ask') && /already been used/.test(await text(page, '#ap-lead')), 'reset.html: the same link again says it was used, and offers a new one');
      await ctx.close();
    }
    /* confirm.html */
    {
      const s = await signup('conf@shop.example');
      const c = linkIn(mailsTo('conf@shop.example')[0]);
      const { ctx, page } = await open('confirm.html#t=' + c.token, { width: 390 });
      await page.waitForFunction(() => !document.getElementById('ap-done').hidden, null, { timeout: 15000 }).catch(() => {});
      ok((await text(page, '#ap-title')) === 'Your email is confirmed' && /conf@shop\.example is confirmed/.test(await text(page, '#ap-done-words')) && (await me(s.json.token)).confirmed === true, 'confirm.html: the link confirms the address');
      await ctx.close();
      const b = await open('confirm.html#t=nope', { width: 390 });
      await b.page.waitForTimeout(800);
      ok(/not complete/.test(await text(b.page, '#ap-lead')), 'confirm.html: a broken link says so');
      await b.ctx.close();
    }
    /* 320 to 1280: no sideways scroll, nothing under 12px */
    for (const [path, width] of [['reset.html', 320], ['reset.html', 1280], ['confirm.html', 320], ['reset.html#t=' + l.token, 320]]) {
      const { ctx, page } = await open(path, { width });
      await page.waitForTimeout(700);
      const m = await page.evaluate(() => {
        const small = [...document.querySelectorAll('main *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.height && e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 12; });
        return { sw: document.scrollingElement.scrollWidth, w: innerWidth, small: small.map((e) => e.tagName + '.' + e.className).slice(0, 3) };
      });
      ok(m.sw <= m.w && !m.small.length, path.replace(/#.*/, '#t') + ' at ' + width + ': no sideways scroll, nothing under 12px (' + JSON.stringify(m) + ')');
      await ctx.close();
    }
    /* the studio's dialog (app.js) */
    {
      const { ctx, page } = await open('');
      await page.waitForFunction(() => typeof openAuth === 'function' && typeof setAuthMode === 'function', null, { timeout: 90000 });
      await page.evaluate(() => { document.querySelectorAll('.modal-overlay.show').forEach((m) => m.classList.remove('show')); openAuth('Sign in to check'); setAuthMode('in'); });
      ok(await vis(page, '#auth-forgot') && (await text(page, '#auth-forgot')) === 'Forgot password?', "studio: Sign in shows Forgot password?");
      await page.evaluate(() => setAuthMode('up'));
      ok(!(await vis(page, '#auth-forgot')), 'studio: Create account does not');
      await page.evaluate(() => setAuthMode('in'));
      await page.click('#auth-forgot');
      const f = await page.evaluate(() => ({ pass: getComputedStyle(document.getElementById('auth-pass-box')).display, tabs: getComputedStyle(document.querySelector('#auth-forms .auth-tabs')).display, go: document.getElementById('auth-go').textContent, back: document.getElementById('auth-cancel').textContent }));
      ok(f.pass === 'none' && f.tabs === 'none' && f.go === 'Send reset link' && f.back === 'Back', 'studio: Forgot password? asks for the email alone (' + JSON.stringify(f) + ')');
      const n0 = sent.length;
      await page.fill('#auth-email', 'web@shop.example');
      await page.click('#auth-go');
      await page.waitForFunction(() => getComputedStyle(document.getElementById('auth-sent')).display !== 'none', null, { timeout: 15000 }).catch(() => {});
      ok(/If web@shop\.example has a WeBuy\.AD account/.test(await text(page, '#auth-sent')) && mailsTo('web@shop.example', n0).length === 1 && (await text(page, '#auth-err')) === '', 'studio: Send reset link says so and the mail goes');
      await page.click('#auth-cancel');
      ok(await vis(page, '#auth-pass') && (await text(page, '#auth-go')) === 'Sign in' && await page.evaluate(() => document.getElementById('auth-overlay').classList.contains('show')), 'studio: Back returns to Sign in, the window still open');
      /* a new account: the gentle line, then the menu note */
      await page.evaluate(() => setAuthMode('up'));
      await page.fill('#auth-email', 'studio-new@shop.example');
      await page.fill('#auth-pass', 'studio-pass-1');
      await page.click('#auth-go');
      await page.waitForFunction(() => getComputedStyle(document.getElementById('auth-type')).display !== 'none', null, { timeout: 15000 }).catch(() => {});
      ok(/We sent a link to studio-new@shop\.example to confirm it\. Your account works now/.test(await text(page, '#auth-confirm-sent')) && await vis(page, '#auth-confirm-sent'), 'studio: after sign-up, one gentle line says a confirmation link went');
      await page.click('#at-free');
      await page.waitForTimeout(500);
      const note = await page.evaluate(() => ['am-confirm', 'lpam-confirm'].map((id) => getComputedStyle(document.getElementById(id)).display !== 'none'));
      ok(note[0] && note[1], 'studio: both account menus carry the "confirm your email" note');
      const n1 = sent.length;
      await page.evaluate(() => document.querySelector('#am-confirm .am-confirm-send').click());
      await page.waitForFunction(() => /^Sent\./.test(document.querySelector('#am-confirm span').textContent), null, { timeout: 15000 }).catch(() => {});
      ok(/^Sent\./.test(await text(page, '#am-confirm span')) && mailsTo('studio-new@shop.example', n1).length === 1, 'studio: Send the link sends one');
      ok(await page.evaluate(() => typeof account === 'object' && account && account.plan === 'free'), 'studio: the account works, unconfirmed');
      await ctx.close();
      const c = linkIn(mailsTo('studio-new@shop.example').pop());
      await hit('POST', '/auth/confirm', { token: c.token });
      const again = await open('', { token: tokenFor('studio-new@shop.example') });
      await again.page.waitForFunction(() => typeof account === 'object' && account && account.email, null, { timeout: 90000 }).catch(() => {});
      await again.page.waitForTimeout(300);
      ok(await again.page.evaluate(() => getComputedStyle(document.getElementById('am-confirm')).display === 'none'), 'studio: once confirmed, the note is gone');
      await again.ctx.close();
    }
    /* account.js's dialog (the video maker) */
    {
      const { ctx, page } = await open('motion/');
      await page.waitForFunction(() => !!(window.pgfxAccount && window.pgfxAccount.forgot), null, { timeout: 90000 });
      await page.evaluate(() => window.pgfxAccount.openAuth({ mode: 'up' }));
      ok(!(await vis(page, '#acct-forgot')), 'video maker: Create account has no Forgot password?');
      await page.evaluate(() => window.pgfxAccount.openAuth({ mode: 'in' }));
      ok(await vis(page, '#acct-forgot'), 'video maker: Sign in shows Forgot password?');
      await page.click('#acct-forgot');
      const f = await page.evaluate(() => ({ pass: getComputedStyle(document.getElementById('acct-pass-box')).display === 'none', tabs: getComputedStyle(document.querySelector('.acct-tabs')).display === 'none', go: document.getElementById('acct-go').textContent, back: document.getElementById('acct-cancel').textContent }));
      ok(f.pass && f.tabs && f.go === 'Send reset link' && f.back === 'Back', 'video maker: Forgot password? asks for the email alone (' + JSON.stringify(f) + ')');
      const n0 = sent.length;
      await page.fill('#acct-email', 'web@shop.example');
      await page.click('#acct-go');
      await page.waitForFunction(() => !document.getElementById('acct-sent').hidden, null, { timeout: 15000 }).catch(() => {});
      ok(/If web@shop\.example has a WeBuy\.AD account/.test(await text(page, '#acct-sent')) && mailsTo('web@shop.example', n0).length === 1, 'video maker: Send reset link says so and the mail goes');
      const n1 = sent.length;
      await page.fill('#acct-email', 'stranger@shop.example');
      await page.click('#acct-go');
      await page.waitForTimeout(700);
      ok(/If stranger@shop\.example has a WeBuy\.AD account/.test(await text(page, '#acct-sent')) && sent.length === n1, 'video maker: an address with no account sees the same words, and nothing is sent');
      await page.click('#acct-cancel');
      ok(!(await page.evaluate(() => document.getElementById('acct-pass-box').hidden)) && (await text(page, '#acct-go')) === 'Sign in' && await page.evaluate(() => document.getElementById('acct-overlay').classList.contains('show')), 'video maker: Back returns to Sign in, the window still open');
      await ctx.close();
    }
    ok(!errors.length, 'browser: no CSP or page errors' + (errors.length ? ': ' + errors.slice(0, 4).join(' | ') : ''));
  } finally {
    await browser.close();
  }
}
