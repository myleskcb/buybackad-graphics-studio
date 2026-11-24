#!/usr/bin/env node
/* SIGN IN WITH GOOGLE'S TOKEN CHECK, HELD (netlify/lib/googleid.mjs).

   The site's own Google button (DESIGN-LAW 168; the owner, 2026-11-23: "blend with app ui")
   opens Google's popup through its token client, so the server now gets an access token, and
   still takes the ID token Google's own button gave. A stand-in for Google's tokeninfo and
   userinfo endpoints answers here. The check must take a good access token and a good ID token,
   and refuse a token issued to another app (an access token another site got for the same
   person), one Google refuses, an expired one, an unverified or missing email, no token, and a
   site with no client ID. A new account's name comes from userinfo, and nothing fails without it.
   usage: node scripts/googleid_check.mjs   (exit 1 on a failure) */
import { verifyGoogleToken, googleProfileName } from '../netlify/lib/googleid.mjs';

const fails = [];
const ok = (cond, what, more = '') => { console.log((cond ? '  ok   ' : '  FAIL ') + what + (more ? ' (' + more + ')' : '')); if (!cond) fails.push(what); };
const CLIENT = 'site.apps.googleusercontent.com';
const NOW = Date.UTC(2026, 10, 23, 12);
const exp = String(NOW / 1000 + 3000);
/* what Google's tokeninfo says about each stand-in token */
const TOKENS = {
  'at-good': { azp: CLIENT, aud: CLIENT, sub: '1099', scope: 'openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile', exp, email: 'Pat.Buyer@Gmail.com', email_verified: 'true' },
  'at-other-app': { azp: 'other.apps.googleusercontent.com', aud: 'other.apps.googleusercontent.com', sub: '1099', exp, email: 'pat.buyer@gmail.com', email_verified: 'true' },
  'at-expired': { aud: CLIENT, sub: '1099', exp: String(NOW / 1000 - 5), email: 'pat.buyer@gmail.com', email_verified: 'true' },
  'at-unverified': { aud: CLIENT, sub: '1099', exp, email: 'pat.buyer@gmail.com', email_verified: 'false' },
  'at-no-email': { aud: CLIENT, sub: '1099', exp, scope: 'openid' },
  'id-good': { iss: 'https://accounts.google.com', aud: CLIENT, sub: '1099', exp, email: 'pat.buyer@gmail.com', email_verified: true, name: 'Pat Buyer' },
};
const asked = [];
const fetchImpl = async (url, init = {}) => {
  asked.push(String(url));
  const u = new URL(url);
  const res = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
  if (u.origin + u.pathname === 'https://oauth2.googleapis.com/tokeninfo') {
    const t = u.searchParams.get('access_token') || u.searchParams.get('id_token');
    const kind = u.searchParams.has('access_token') ? 'at' : 'id';
    const info = TOKENS[t];
    return info && t.startsWith(kind + '-') ? res(200, info) : res(400, { error: 'invalid_token' });
  }
  if (u.origin + u.pathname === 'https://openidconnect.googleapis.com/v1/userinfo') {
    const auth = (init.headers && init.headers.Authorization) || '';
    return auth === 'Bearer at-good' ? res(200, { sub: '1099', name: 'Pat Buyer', email: 'pat.buyer@gmail.com' }) : res(401, { error: 'invalid_token' });
  }
  return res(404, {});
};
const opts = { clientId: CLIENT, fetchImpl, now: NOW };
async function refused(tokens, extra, what, why) {
  try { await verifyGoogleToken(tokens, { ...opts, ...extra }); ok(false, 'refuses ' + what, 'it was taken'); }
  catch (e) { ok(!why || why.test(e.message), 'refuses ' + what, e.message); }
}

console.log("Sign in with Google: the token check");
const a = await verifyGoogleToken({ accessToken: 'at-good' }, opts);
ok(a.email === 'pat.buyer@gmail.com' && a.sub === '1099' && a.name === '', "takes a good access token for this site, its email lower-cased", JSON.stringify(a));
ok(/tokeninfo\?access_token=at-good$/.test(asked[asked.length - 1]), 'and asks tokeninfo about it as an access token', asked[asked.length - 1]);
const i = await verifyGoogleToken({ credential: 'id-good' }, opts);
ok(i.email === 'pat.buyer@gmail.com' && i.name === 'Pat Buyer', "still takes an ID token from Google's own button, with its name", JSON.stringify(i));
ok(/tokeninfo\?id_token=id-good$/.test(asked[asked.length - 1]), 'and asks tokeninfo about it as an ID token', asked[asked.length - 1]);
await refused({ accessToken: 'at-other-app' }, {}, "an access token issued to another app (another site's token for the same person)", /different app/);
await refused({ accessToken: 'at-forged' }, {}, 'a token Google refuses', /Google rejected/);
await refused({ credential: 'at-good' }, {}, 'an access token passed off as an ID token', /Google rejected/);
await refused({ accessToken: 'at-expired' }, {}, 'an expired token', /expired/);
await refused({ accessToken: 'at-unverified' }, {}, 'an unconfirmed email', /unverified/);
await refused({ accessToken: 'at-no-email' }, {}, 'a token with no email', /no email/);
await refused({}, {}, 'no token at all', /Missing credential/);
await refused({ accessToken: { not: 'a string' } }, {}, 'something that is not a token', /Missing credential/);
await refused({ accessToken: 'at-good' }, { clientId: '' }, 'anything when the site has no client ID', /not enabled/);

console.log("a new account's name");
ok(await googleProfileName('at-good', { fetchImpl }) === 'Pat Buyer', 'comes from userinfo with the access token');
ok(await googleProfileName('at-expired', { fetchImpl }) === '', 'is empty when userinfo says no, and nothing fails');
ok(await googleProfileName('', { fetchImpl }) === '', 'is empty with no token, and asks nobody');
ok(await googleProfileName('at-good', { fetchImpl: async () => { throw new Error('offline'); } }) === '', 'is empty when Google cannot be reached');

console.log(fails.length ? '\n' + fails.length + ' FAILED:\n  ' + fails.join('\n  ') : '\nall clear');
process.exit(fails.length ? 1 : 0);
