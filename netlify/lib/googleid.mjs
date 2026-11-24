/* Sign in with Google, checked on the server (api.mjs /auth/google, DESIGN-LAW 168).

   The owner, 2026-11-23, of Google's own button sitting in a white box on the dark
   sign-in window: "blend with app ui". Google's button is Google's page in a frame,
   black or white, so the site now draws its own button (account.js) and opens Google's
   popup through Google's token client. That hands the page an access token, not the ID
   token Google's button gave. Either one comes here.

   Google's tokeninfo endpoint reads the token and says whom it was issued to. It has to
   be this site's client ID: an access token another app got for the same person must
   not sign them in here. Then the email has to be there and confirmed. tokeninfo refuses
   an expired or forged token itself; the expiry is checked again in case.

   verifyGoogleToken({ credential, accessToken }, { clientId }) → { email, name, sub }
   googleProfileName(accessToken) → the name on the Google account, or '' (an access
   token's tokeninfo has no name; a new account asks once, and nothing fails without it). */
const TOKENINFO = 'https://oauth2.googleapis.com/tokeninfo';
const USERINFO = 'https://openidconnect.googleapis.com/v1/userinfo';

export async function verifyGoogleToken({ credential = '', accessToken = '' } = {}, { clientId = '', fetchImpl = fetch, now = Date.now() } = {}) {
  if (!clientId) throw new Error('Google sign-in is not enabled');
  const idToken = typeof credential === 'string' ? credential : '';
  const access = typeof accessToken === 'string' ? accessToken : '';
  if (!idToken && !access) throw new Error('Missing credential');
  const r = await fetchImpl(TOKENINFO + '?' + (idToken ? 'id_token=' + encodeURIComponent(idToken) : 'access_token=' + encodeURIComponent(access)));
  if (!r || !r.ok) throw new Error('Google rejected the sign-in. Try again.');
  const info = await r.json().catch(() => ({}));
  if (!info || info.aud !== clientId) throw new Error('Sign-in was issued for a different app');
  if (info.exp && Number(info.exp) * 1000 <= now) throw new Error('That Google sign-in has expired. Try again.');
  const email = String(info.email || '').trim().toLowerCase();
  if (!email) throw new Error('Google returned no email');
  if (info.email_verified !== 'true' && info.email_verified !== true) throw new Error('Google account email is unverified');
  return { email, name: String(info.name || '').trim().slice(0, 80), sub: String(info.sub || '') };
}

export async function googleProfileName(accessToken, { fetchImpl = fetch } = {}) {
  if (!accessToken || typeof accessToken !== 'string') return '';
  try {
    const r = await fetchImpl(USERINFO, { headers: { Authorization: 'Bearer ' + accessToken } });
    if (!r || !r.ok) return '';
    const j = await r.json();
    return String((j && j.name) || '').trim().slice(0, 80);
  } catch (e) { return ''; }
}
