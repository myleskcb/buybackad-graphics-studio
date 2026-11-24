#!/usr/bin/env node
/* SIGN IN WITH APPLE'S TOKEN CHECK, HELD (netlify/lib/appleid.mjs).

   A key pair made here stands in for Apple's: tokens signed with it, and a JWKS that
   publishes its public half. The check must take a good token and refuse a forged
   signature, another issuer, another app's audience, an expired token, a wrong nonce,
   an unknown key, an unverified or missing email, and something that is not a token.
   usage: node scripts/appleid_check.mjs   (exit 1 on a failure) */
import { verifyAppleIdToken } from '../netlify/lib/appleid.mjs';

const fails = [];
const ok = (cond, what, more = '') => { console.log((cond ? '  ok   ' : '  FAIL ') + what + (more ? ' (' + more + ')' : '')); if (!cond) fails.push(what); };
const enc = new TextEncoder();
const b64u = (bytes) => Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const alg = { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' };

const apple = await crypto.subtle.generateKey(alg, true, ['sign', 'verify']);
const forger = await crypto.subtle.generateKey(alg, true, ['sign', 'verify']);
const pub = await crypto.subtle.exportKey('jwk', apple.publicKey);
const keys = [{ ...pub, kid: 'apple-test-key', use: 'sig', alg: 'RS256' }];
let fetched = 0;
const fetchKeys = async () => { fetched++; return keys; };

const NOW = Date.UTC(2026, 10, 19, 12);
const base = { iss: 'https://appleid.apple.com', aud: 'ad.webuy.signin', sub: '001234.abcd', exp: NOW / 1000 + 600, iat: NOW / 1000, email: 'Buyer@Example.com', email_verified: 'true', nonce: 'n-123' };
async function token(claims = {}, { kid = 'apple-test-key', signer = apple.privateKey, algName = 'RS256' } = {}) {
  const h = b64u(enc.encode(JSON.stringify({ alg: algName, kid })));
  const p = b64u(enc.encode(JSON.stringify({ ...base, ...claims })));
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', signer, enc.encode(h + '.' + p));
  return h + '.' + p + '.' + b64u(new Uint8Array(sig));
}
const opts = { audiences: ['ad.webuy.signin', 'ad.webuy.app'], fetchKeys, now: NOW };
async function refused(tok, extra, what) {
  try { await verifyAppleIdToken(tok, { ...opts, ...extra }); ok(false, 'refuses ' + what, 'it was taken'); }
  catch (e) { ok(true, 'refuses ' + what, e.message); }
}

console.log('Sign in with Apple: the token check');
const good = await verifyAppleIdToken(await token(), { ...opts, nonce: 'n-123' });
ok(good.email === 'buyer@example.com' && good.sub === '001234.abcd' && good.privateRelay === false, 'takes a good token, its email lower-cased', JSON.stringify(good));
const app = await verifyAppleIdToken(await token({ aud: 'ad.webuy.app' }), opts);
ok(app.email === 'buyer@example.com', "takes the iPhone app's audience (the bundle ID)");
const relay = await verifyAppleIdToken(await token({ email: 'x1y2@privaterelay.appleid.com', is_private_email: 'true' }), opts);
ok(relay.privateRelay === true, "keeps Apple's private relay email, marked as such", relay.email);
const boolVerified = await verifyAppleIdToken(await token({ email_verified: true }), opts);
ok(boolVerified.email === 'buyer@example.com', 'takes email_verified as a boolean too');
await refused(await token({}, { signer: forger.privateKey }), {}, 'a signature made with another key');
await refused(await token({ iss: 'https://accounts.google.com' }), {}, 'another issuer');
await refused(await token({ aud: 'com.someone.else' }), {}, "another app's audience");
await refused(await token({ exp: NOW / 1000 - 1 }), {}, 'an expired token');
await refused(await token(), { nonce: 'other' }, "a nonce this page didn't send");
fetched = 0;
await refused(await token({}, { kid: 'rotated-away' }), {}, 'an unknown key id');
ok(fetched === 2, 'and asks for Apple\'s keys once more first, as Apple rotates them', 'fetched ' + fetched);
await refused(await token({ email_verified: 'false' }), {}, 'an unverified email');
await refused(await token({ email: '' }), {}, 'a token with no email');
await refused(await token({}, { algName: 'HS256' }), {}, 'another algorithm');
await refused('not.a.token', {}, 'something that is not a token');
await refused(undefined, {}, 'no token');
console.log(fails.length ? '\n' + fails.length + ' FAILED' : '\nall clear');
process.exit(fails.length ? 1 : 0);
