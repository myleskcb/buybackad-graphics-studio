/**
 * BUYBACK.AD backend — Netlify Function port of worker.js, plus the AI
 * background service. One catch-all function at /api/*.
 *
 * Provides: email+password auth (PBKDF2 + HMAC JWT), plan tracking,
 * server-enforced export limits, Stripe checkout/webhook (inert until Stripe
 * env vars are set), community backgrounds — and the AI background endpoints:
 *
 *   POST /api/generate-bg        customer path. The user's text is reduced to
 *                                2-5 clean keywords and fused into the house
 *                                editorial prompt server-side; moderation and
 *                                rate limits applied. The fused prompt is never
 *                                returned to the client.
 *   POST /api/admin/generate-bg  admin path. Prompt used VERBATIM; returned
 *                                with the image so it can be edited + re-run.
 *   POST /api/admin/approve-bg   admin path. Publishes an image to the blob
 *                                store under a Designer Library filename.
 *   GET  /api/bg/<filename>      public. Serves published blobs — the site's
 *                                fallback when assets/bg/<file>.jpg isn't in
 *                                the deploy yet.
 *
 * Env vars: JWT_SECRET (required), GEMINI_KEY (required for AI), ADMIN_EMAILS
 * (comma-separated), optional: PGFX_BG_MODEL, RL_USER_DAILY, RL_PRO_DAILY,
 * RL_GLOBAL_DAILY, STRIPE_SECRET, STRIPE_WEBHOOK_SECRET, PRICE_PRO, SITE_URL.
 */
import { getStore } from '@netlify/blobs';

export const config = { path: '/api/*' };

const PLANS = {
  free: { maxPx: 1080, watermark: true, weekly: 3, monthly: null },
  pro: { maxPx: 2160, watermark: false, weekly: null, monthly: 100 },
  starter: { maxPx: 2160, watermark: false, weekly: null, monthly: 100 }, // legacy alias of pro
};

const enc = new TextEncoder();
const b64u = (b) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');

async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', key, enc.encode(msg));
}
async function pbkdf2(pass, salt) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 100000 }, key, 256);
  return hex(bits);
}
async function makeToken(email, env) {
  const exp = Date.now() + 30 * 86400000;
  const body = b64u(enc.encode(JSON.stringify({ email, exp })));
  return body + '.' + b64u(await hmac(env.JWT_SECRET, body));
}
async function readToken(req, env) {
  const h = req.headers.get('Authorization') || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!t || !t.includes('.')) return null;
  const [body, sig] = t.split('.');
  if (b64u(await hmac(env.JWT_SECRET, body)) !== sig) return null;
  const data = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')));
  return data.exp > Date.now() ? data.email : null;
}
const isoWeek = () => { const d = new Date(); const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return t.getUTCFullYear() + '-W' + String(Math.ceil((((t - y) / 86400000) + 1) / 7)).padStart(2, '0'); };
const isoMonth = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
const isoDay = () => new Date().toISOString().slice(0, 10);

const adminEmails = (env) => String(env.ADMIN_EMAILS || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
const roleFor = (email, env) => (adminEmails(env).includes(email) ? 'admin' : 'user');
const publicUser = (u, env) => ({ email: u.email, plan: u.plan, exports: u.exports, role: roleFor(u.email, env) });

const json = (data, status) => new Response(JSON.stringify(data), {
  status: status || 200,
  headers: { 'Content-Type': 'application/json' },
});

// ---------- stores ----------
// users store MUST be strongly consistent — signup is immediately followed by
// authenticated reads, and Blobs' default eventual consistency serves stale
// nulls ("Account not found" right after signup).
const users = () => getStore({ name: 'pgfx-users', consistency: 'strong' });
const bgStore = () => getStore('pgfx-backgrounds'); // published backgrounds: read-heavy, eventual is fine

async function getUser(em) { return JSON.parse((await users().get('u:' + em)) || 'null'); }
async function putUser(u) { await users().set('u:' + u.email, JSON.stringify(u)); }

// ---------- AI background: moderation + keyword fusion ----------
const STOPWORDS = new Set(('the,and,with,for,from,that,this,have,has,are,was,were,will,would,can,could,you,your,yours,our,ours,their,them,they,his,her,hers,its,a,an,of,in,on,at,to,is,it,as,by,be,or,we,i,me,my,so,do,did,does,not,no,yes,please,make,makes,making,want,wants,need,needs,like,likes,just,get,put,show,give,really,very,some,more,most,image,picture,photo,photos,background,backgrounds,generate,create,style,styled,look,looking,type,kind,cool,nice,good,great,pretty,beautiful').split(','));
// One regex, whole-input AND per-token. Conservative: a blocked token is
// dropped, the rest of the request continues on the house prompt.
const BLOCKLIST = /\b(nude|naked|nsfw|sex|sexual|porn|topless|erotic|lingerie|gore|blood|bloody|corpse|behead|kill|killing|murder|shoot|shooting|gun|guns|firearm|weapon|weapons|knife|knives|bomb|explosive|terror|terrorist|nazi|hitler|swastika|kkk|racist|slur|lynch|hate|drug|drugs|cocaine|heroin|meth|fentanyl|child|children|kid|kids|minor|minors|celebrity|kardashian|trump|biden|obama|elon|musk|swift|disney|nike|adidas|gucci|apple logo|nintendo|pokemon company|watermark|copyright|trademark)\b/i;

function extractKeywords(text) {
  const t = String(text || '').slice(0, 240).toLowerCase()
    .replace(/https?:\S+|[\w.+-]+@[\w-]+\.\S+|@\w+|#\w+/g, ' ') // urls, emails, handles, tags
    .replace(/[^a-z\s-]/g, ' ');
  const words = [];
  const seen = new Set();
  for (const raw of t.split(/\s+/)) {
    const w = raw.replace(/^-+|-+$/g, '');
    if (w.length < 3 || w.length > 20) continue;
    if (STOPWORDS.has(w) || seen.has(w) || BLOCKLIST.test(w)) continue;
    seen.add(w);
    words.push(w);
    if (words.length >= 5) break; // 2-5 keywords by design
  }
  return words;
}

// Category anchors keep customer generations on-brand for the template they
// are editing (short forms of the Designer Library base scenes).
const CATEGORY_SCENES = {
  phones: 'smartphones as subtle scene elements',
  gold: 'gold jewelry tones',
  silver: 'silver and cool metallic tones',
  coins: 'antique coin collection tones',
  cars: 'automotive dusk tones',
  strips: 'sealed test strip boxes and cash tones',
  pokemon: 'holographic card sleeve glints, no readable card artwork',
  sports: 'vintage sports memorabilia tones, no readable card artwork',
};

// The proven house frame. Customer keywords ride inside it; the frame itself
// is never shown to the customer.
// The master frame is env-tunable: set PGFX_HOUSE_FRAME (use {subject} and
// {anchor} placeholders) and/or PGFX_CATEGORY_ANCHORS (JSON object merged
// over the defaults) with `netlify env:set`, then redeploy. No code edits.
const DEFAULT_FRAME = 'candid real photo taken on a modern smartphone, {subject}{anchor}, composed with open space for large headline text, natural light, bright true-to-life exposure, slight handheld imperfection, subtle grain, background gently out of focus, no readable text or branding, no logos, no people';
function fuseCustomerPrompt(keywords, category) {
  const subject = keywords.length ? keywords.join(', ') : 'clean premium surface';
  let anchors = CATEGORY_SCENES;
  try {
    if (process.env.PGFX_CATEGORY_ANCHORS) anchors = { ...CATEGORY_SCENES, ...JSON.parse(process.env.PGFX_CATEGORY_ANCHORS) };
  } catch (e) { /* malformed JSON → defaults */ }
  const anchor = anchors[category] || '';
  const frame = process.env.PGFX_HOUSE_FRAME || DEFAULT_FRAME;
  return frame.replace('{subject}', subject).replace('{anchor}', anchor ? ', ' + anchor : '');
}

// ---------- image providers: Gemini first, Seedream (fal.ai) fallback ----------
async function generateImage(prompt, env) {
  if (env.GEMINI_KEY) {
    try { return await generateGeminiImage(prompt, env); }
    catch (e) { if (!env.FAL_KEY) throw e; }
  }
  if (env.FAL_KEY) return generateFalImage(prompt, env);
  throw new Error('no image provider configured');
}

async function generateFalImage(prompt, env) {
  const res = await fetch('https://fal.run/fal-ai/bytedance/seedream/v4/text-to-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Key ' + env.FAL_KEY },
    body: JSON.stringify({ prompt, image_size: { width: 2048, height: 2048 }, num_images: 1, enable_safety_checker: true }),
  });
  if (!res.ok) throw new Error(`image model error (${res.status})`);
  const j = await res.json();
  const url = j.images?.[0]?.url;
  if (!url) throw new Error('the model declined this prompt, try different words');
  if (url.startsWith('data:')) return url;
  const img = await fetch(url);
  if (!img.ok) throw new Error('image fetch failed');
  const mime = img.headers.get('content-type') || 'image/jpeg';
  const buf = Buffer.from(await img.arrayBuffer());
  return `data:${mime};base64,${buf.toString('base64')}`;
}

async function generateGeminiImage(prompt, env) {
  const model = env.PGFX_BG_MODEL || 'gemini-3.1-flash-lite-image'; // Nano Banana 2 Lite
  const supportsSize = model.includes('3-pro') || model === 'gemini-3.1-flash-image';
  const imgCfg = supportsSize ? { aspectRatio: '1:1', imageSize: '1K' } : { aspectRatio: '1:1' };
  const attempts = [
    { url: `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`,
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'], responseFormat: { image: imgCfg } } },
    { url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'], imageConfig: imgCfg } },
  ];
  let lastErr;
  for (const attempt of attempts) {
    const res = await fetch(attempt.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_KEY },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: attempt.generationConfig }),
    });
    if (res.status === 400) { lastErr = new Error('model rejected request'); continue; }
    if (!res.ok) throw new Error(`image model error (${res.status})`);
    const j = await res.json();
    const part = (j.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData || p.inline_data);
    if (!part) throw new Error('the model declined this prompt — try different words');
    const d = part.inlineData || part.inline_data;
    return `data:${d.mimeType || d.mime_type || 'image/png'};base64,${d.data}`;
  }
  throw lastErr || new Error('image model unavailable');
}

// ---------- rate limits (daily, blob counters) ----------
async function bumpCounter(key, cap) {
  const store = users();
  const n = parseInt((await store.get(key)) || '0', 10);
  if (cap !== null && n >= cap) return false;
  await store.set(key, String(n + 1));
  return true;
}

const BG_FILE_RE = /^dl_[a-z]+_[A-Za-z]+_[a-z]+\.jpg$/; // Designer Library names only

export default async (req) => {
  const env = process.env;
  const url = new URL(req.url);
  const p = url.pathname.replace(/^\/api/, '').replace(/\/$/, '') || '/';
  if (req.method === 'OPTIONS') return json({});
  try {
    if (!env.JWT_SECRET) return json({ error: 'Backend not configured (JWT_SECRET missing)' }, 500);

    if (p === '/auth/signup' && req.method === 'POST') {
      const { email, password } = await req.json();
      const em = String(email || '').trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return json({ error: 'Invalid email' }, 400);
      if (!password || password.length < 8) return json({ error: 'Password needs at least 8 characters' }, 400);
      if (await getUser(em)) return json({ error: 'An account with that email already exists' }, 409);
      const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
      const user = { email: em, salt, hash: await pbkdf2(password, salt), plan: 'free', exports: { period: '', count: 0 }, created: Date.now() };
      await putUser(user);
      return json({ token: await makeToken(em, env), user: publicUser(user, env) });
    }

    if (p === '/auth/login' && req.method === 'POST') {
      const { email, password } = await req.json();
      const em = String(email || '').trim().toLowerCase();
      const user = await getUser(em);
      if (!user) return json({ error: 'Wrong email or password' }, 401);
      if (user.provider === 'google' && !user.hash) return json({ error: 'This account uses Google sign-in. Use the Google button.' }, 401);
      if (user.hash !== await pbkdf2(password || '', user.salt)) return json({ error: 'Wrong email or password' }, 401);
      return json({ token: await makeToken(em, env), user: publicUser(user, env) });
    }

    // Which auth methods the frontend should render. Google appears only when
    // GOOGLE_CLIENT_ID is configured in the Netlify env.
    if (p === '/auth/config') {
      return json({ google: !!env.GOOGLE_CLIENT_ID, googleClientId: env.GOOGLE_CLIENT_ID || '' });
    }

    // Google Sign-In: the browser sends the GIS ID token; we verify it against
    // Google's tokeninfo endpoint, check the audience, then find-or-create the
    // account and issue our own JWT. No password stored for these users.
    if (p === '/auth/google' && req.method === 'POST') {
      if (!env.GOOGLE_CLIENT_ID) return json({ error: 'Google sign-in is not enabled' }, 503);
      const { credential } = await req.json().catch(() => ({}));
      if (!credential) return json({ error: 'Missing credential' }, 400);
      const vr = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(credential));
      if (!vr.ok) return json({ error: 'Google rejected the sign-in. Try again.' }, 401);
      const info = await vr.json();
      if (info.aud !== env.GOOGLE_CLIENT_ID) return json({ error: 'Sign-in was issued for a different app' }, 401);
      if (info.email_verified !== 'true' && info.email_verified !== true) return json({ error: 'Google account email is unverified' }, 401);
      const em = String(info.email || '').toLowerCase();
      if (!em) return json({ error: 'Google returned no email' }, 401);
      let user = await getUser(em);
      if (!user) {
        user = { email: em, provider: 'google', plan: 'free', exports: { period: '', count: 0 }, created: Date.now(), name: info.name || '' };
        await putUser(user);
      }
      return json({ token: await makeToken(em, env), user: publicUser(user, env) });
    }

    if (p === '/me') {
      const em = await readToken(req, env);
      if (!em) return json({ error: 'Not signed in' }, 401);
      const user = await getUser(em);
      if (!user) return json({ error: 'Account not found' }, 404);
      return json({ user: publicUser(user, env) });
    }

    if (p === '/export' && req.method === 'POST') {
      const em = await readToken(req, env);
      if (!em) return json({ error: 'Not signed in' }, 401);
      const user = await getUser(em);
      if (!user) return json({ error: 'Account not found' }, 404);
      // Operators export without caps, watermark or resolution limits.
      if (roleFor(em, env) === 'admin') return json({ user: publicUser(user, env), maxPx: 2160, watermark: false });
      const plan = PLANS[user.plan || 'free'];
      const cap = plan.weekly ?? plan.monthly;
      const period = plan.weekly ? isoWeek() : isoMonth();
      if (user.exports.period !== period) user.exports = { period, count: 0 };
      if (cap !== null && user.exports.count >= cap) return json({ error: 'Export limit reached for this ' + (plan.weekly ? 'week' : 'month') }, 402);
      user.exports.count++;
      await putUser(user);
      return json({ user: publicUser(user, env), maxPx: plan.maxPx, watermark: plan.watermark });
    }

    // ---------- AI backgrounds: customer path ----------
    if (p === '/generate-bg' && req.method === 'POST') {
      const em = await readToken(req, env);
      if (!em) return json({ error: 'Sign in to generate backgrounds' }, 401);
      const user = await getUser(em);
      if (!user) return json({ error: 'Account not found' }, 404);
      if (!env.GEMINI_KEY && !env.FAL_KEY) return json({ error: 'AI backgrounds are not enabled yet' }, 503);
      const isAdmin = roleFor(em, env) === 'admin';
      if (!isAdmin) {
        const userCap = (user.plan || 'free') === 'free'
          ? parseInt(env.RL_USER_DAILY || '10', 10)
          : parseInt(env.RL_PRO_DAILY || '40', 10);
        if (!(await bumpCounter(`rl:${em}:${isoDay()}`, userCap))) {
          return json({ error: 'Daily AI background limit reached — try again tomorrow' }, 429);
        }
        if (!(await bumpCounter(`rl:global:${isoDay()}`, parseInt(env.RL_GLOBAL_DAILY || '400', 10)))) {
          return json({ error: 'AI backgrounds are cooling down — try again later' }, 429);
        }
      }
      const { text, category } = await req.json().catch(() => ({}));
      const prompt = fuseCustomerPrompt(extractKeywords(text), String(category || '').toLowerCase());
      const image = await generateImage(prompt, env);
      return json({ image }); // fused prompt intentionally NOT returned
    }

    // ---------- AI backgrounds: admin path ----------
    if (p === '/admin/generate-bg' && req.method === 'POST') {
      const em = await readToken(req, env);
      if (!em || roleFor(em, env) !== 'admin') return json({ error: 'Not authorized' }, 403);
      if (!env.GEMINI_KEY && !env.FAL_KEY) return json({ error: 'No image provider key set' }, 503);
      const { prompt } = await req.json().catch(() => ({}));
      const clean = String(prompt || '').trim().slice(0, 600);
      if (!clean) return json({ error: 'Empty prompt' }, 400);
      const image = await generateImage(clean, env); // verbatim — operator owns the words
      return json({ image, prompt: clean });
    }

    if (p === '/admin/approve-bg' && req.method === 'POST') {
      const em = await readToken(req, env);
      if (!em || roleFor(em, env) !== 'admin') return json({ error: 'Not authorized' }, 403);
      const { filename, dataUrl } = await req.json().catch(() => ({}));
      if (!BG_FILE_RE.test(String(filename || ''))) return json({ error: 'Filename must match a Designer Library slot' }, 400);
      const m = String(dataUrl || '').match(/^data:image\/(jpeg|png|webp);base64,(.+)$/s);
      if (!m) return json({ error: 'Only JPG/PNG/WEBP data URLs supported' }, 400);
      if (m[2].length > 12 * 1024 * 1024) return json({ error: 'Image too large' }, 400);
      await bgStore().set('bg/' + filename, JSON.stringify({ mime: 'image/' + m[1], b64: m[2], by: em, ts: Date.now() }));
      return json({ ok: true, filename, url: '/api/bg/' + filename });
    }

    if (p === '/admin/bg-status') {
      const em = await readToken(req, env);
      if (!em || roleFor(em, env) !== 'admin') return json({ error: 'Not authorized' }, 403);
      const { blobs } = await bgStore().list({ prefix: 'bg/' });
      return json({ published: (blobs || []).map((b) => b.key.slice(3)) });
    }

    // Public blob serving — the site's fallback for slots not yet in the deploy.
    if (p.startsWith('/bg/')) {
      const filename = p.slice(4);
      if (!BG_FILE_RE.test(filename)) return json({ error: 'Not found' }, 404);
      const raw = await bgStore().get('bg/' + filename);
      if (!raw) return json({ error: 'Not found' }, 404);
      const { mime, b64 } = JSON.parse(raw);
      return new Response(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)), {
        headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=3600' },
      });
    }

    // ---------- community backgrounds (ported from worker.js) ----------
    if (p === '/community/publish' && req.method === 'POST') {
      const em = await readToken(req, env);
      if (!em) return json({ error: 'Sign in first' }, 401);
      const { name, thumb, data } = await req.json();
      if (!thumb || !data || String(data).length > 2500000) return json({ error: 'Invalid image (max ~2MB)' }, 400);
      if (!(await bumpCounter('pub:' + em + ':' + isoDay(), 5))) return json({ error: 'Daily publish limit reached (5)' }, 429);
      const id = 'c' + Date.now() + Math.random().toString(36).slice(2, 6);
      const store = users();
      await store.set('c:' + id, JSON.stringify({ data }));
      const idx = JSON.parse((await store.get('cindex')) || '[]');
      idx.unshift({ id, name: String(name || 'Background').slice(0, 40), thumb, ts: Date.now(), by: em.split('@')[0] });
      while (idx.length > 24) { const drop = idx.pop(); await store.delete('c:' + drop.id); }
      await store.set('cindex', JSON.stringify(idx));
      return json({ ok: true, id });
    }
    if (p === '/community/list') {
      return json({ items: JSON.parse((await users().get('cindex')) || '[]') });
    }
    if (p === '/community/item') {
      const raw = await users().get('c:' + (url.searchParams.get('id') || ''));
      if (!raw) return json({ error: 'Not found' }, 404);
      return json(JSON.parse(raw));
    }

    // ---------- Stripe (inert until STRIPE_SECRET is configured) ----------
    if (p === '/portal' && req.method === 'POST') {
      const em = await readToken(req, env);
      if (!em) return json({ error: 'Sign in first' }, 401);
      if (!env.STRIPE_SECRET) return json({ error: 'Billing is not enabled yet' }, 503);
      const user = await getUser(em);
      if (!user || !user.stripeCustomer) return json({ error: 'No billing account on file yet' }, 400);
      const r = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + env.STRIPE_SECRET, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ customer: user.stripeCustomer, return_url: env.SITE_URL || url.origin }),
      });
      const j = await r.json();
      if (!r.ok) return json({ error: (j.error && j.error.message) || 'Stripe error' }, 502);
      return json({ url: j.url });
    }
    if (p === '/checkout' && req.method === 'POST') {
      const em = await readToken(req, env);
      if (!em) return json({ error: 'Sign in first' }, 401);
      if (!env.STRIPE_SECRET || !env.PRICE_PRO) return json({ error: 'Billing is not enabled yet' }, 503);
      const { plan } = await req.json();
      if (plan !== 'pro') return json({ error: 'Unknown plan' }, 400);
      const site = env.SITE_URL || url.origin;
      const body = new URLSearchParams({
        mode: 'subscription',
        'line_items[0][price]': env.PRICE_PRO,
        'line_items[0][quantity]': '1',
        customer_email: em,
        'metadata[email]': em,
        'metadata[plan]': plan,
        'subscription_data[metadata][email]': em,
        'subscription_data[metadata][plan]': plan,
        success_url: site + '/?checkout=success',
        cancel_url: site + '/?checkout=cancel',
      });
      const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + env.STRIPE_SECRET, 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      const j = await r.json();
      if (!r.ok) return json({ error: (j.error && j.error.message) || 'Stripe error' }, 502);
      return json({ url: j.url });
    }
    if (p === '/stripe-webhook' && req.method === 'POST') {
      if (!env.STRIPE_WEBHOOK_SECRET) return new Response('not configured', { status: 503 });
      const payload = await req.text();
      const sigHead = req.headers.get('Stripe-Signature') || '';
      const t = (sigHead.match(/t=([^,]+)/) || [])[1];
      const v1 = (sigHead.match(/v1=([0-9a-f]+)/) || [])[1];
      if (!t || !v1) return new Response('bad signature', { status: 400 });
      const expect = hex(await hmac(env.STRIPE_WEBHOOK_SECRET, t + '.' + payload));
      if (expect !== v1) return new Response('bad signature', { status: 400 });
      if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return new Response('stale', { status: 400 });
      const ev = JSON.parse(payload);
      if (ev.type === 'checkout.session.completed') {
        const md = ev.data.object.metadata || {};
        const em = (md.email || ev.data.object.customer_email || '').toLowerCase();
        if (em && PLANS[md.plan]) {
          const user = await getUser(em);
          if (user) {
            user.plan = md.plan;
            user.exports = { period: '', count: 0 };
            if (ev.data.object.customer) user.stripeCustomer = ev.data.object.customer;
            await putUser(user);
          }
        }
      }
      if (ev.type === 'customer.subscription.deleted') {
        const em = ((ev.data.object.metadata || {}).email || '').toLowerCase();
        if (em) { const user = await getUser(em); if (user) { user.plan = 'free'; await putUser(user); } }
      }
      return new Response('ok');
    }

    return json({ error: 'Not found' }, 404);
  } catch (err) {
    return json({ error: 'Server error: ' + err.message }, 500);
  }
};
