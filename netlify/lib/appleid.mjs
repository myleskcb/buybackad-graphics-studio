/* SIGN IN WITH APPLE: the identity token Apple hands the browser (Sign in with Apple JS)
   or the iPhone app, checked here before an account is opened or signed in.

   The owner, 2026-11-19: "apple and google sign in ?". Google's token is checked by
   Google's own tokeninfo endpoint (api.mjs /auth/google); Apple has none, so its token,
   a JWT signed RS256, is checked against the keys Apple publishes
   (https://appleid.apple.com/auth/keys): the signature, the issuer, the audience (the
   web Services ID, or the iPhone app's bundle ID), the expiry, a verified email and,
   when the page sent one, the nonce. Apple rotates its keys, so an unknown key id
   fetches them again once before the token is refused.

   verifyAppleIdToken(token, { audiences, nonce, fetchKeys, now }) -> { email, sub, privateRelay }
   throws an Error whose message the page can show. fetchKeys(refresh) returns the JWKS
   keys; tests pass their own. */
const APPLE_ISS = 'https://appleid.apple.com';
const APPLE_KEYS = 'https://appleid.apple.com/auth/keys';
const HOUR = 3600000;
let cache = { at: 0, keys: null };

const b64uBytes = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
const part = (s) => JSON.parse(new TextDecoder().decode(b64uBytes(s)));

export async function appleKeys(refresh = false) {
  if (!refresh && cache.keys && Date.now() - cache.at < HOUR) return cache.keys;
  const r = await fetch(APPLE_KEYS, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error('Apple sign-in could not be checked just now. Try again.');
  const j = await r.json();
  cache = { at: Date.now(), keys: Array.isArray(j.keys) ? j.keys : [] };
  return cache.keys;
}

export async function verifyAppleIdToken(token, { audiences = [], nonce = '', fetchKeys = appleKeys, now = Date.now() } = {}) {
  if (typeof token !== 'string' || token.split('.').length !== 3) throw new Error('That was not an Apple sign-in. Try again.');
  const [h, p, s] = token.split('.');
  let head, claims;
  try { head = part(h); claims = part(p); } catch (e) { throw new Error('That was not an Apple sign-in. Try again.'); }
  if (head.alg !== 'RS256' || !head.kid) throw new Error('That was not an Apple sign-in. Try again.');
  let jwk = (await fetchKeys(false)).find((k) => k.kid === head.kid);
  if (!jwk) jwk = (await fetchKeys(true)).find((k) => k.kid === head.kid);
  if (!jwk) throw new Error('Apple sign-in could not be checked. Try again.');
  const key = await crypto.subtle.importKey('jwk', { kty: 'RSA', n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64uBytes(s), new TextEncoder().encode(h + '.' + p));
  if (!ok) throw new Error('Apple sign-in could not be checked. Try again.');
  if (claims.iss !== APPLE_ISS) throw new Error('That sign-in was not from Apple.');
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!aud.some((a) => audiences.includes(a))) throw new Error('That sign-in was for a different app.');
  if (!(Number(claims.exp) * 1000 > now)) throw new Error('That Apple sign-in ran out. Try again.');
  if (nonce && claims.nonce !== nonce) throw new Error('That Apple sign-in did not match this page. Try again.');
  const email = String(claims.email || '').trim().toLowerCase();
  if (!email) throw new Error('Apple did not share an email. Choose to share or hide your email, then try again.');
  if (claims.email_verified !== true && claims.email_verified !== 'true') throw new Error('Apple has not verified that email.');
  return { email, sub: String(claims.sub || ''), privateRelay: claims.is_private_email === true || claims.is_private_email === 'true' };
}
