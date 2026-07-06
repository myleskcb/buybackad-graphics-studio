/**
 * BUYBACK.AD backend — single-file Cloudflare Worker.
 * Provides: email+password auth, plan tracking, server-enforced export limits,
 * Stripe Checkout session creation, and the Stripe webhook that activates plans.
 *
 * Bindings needed (see README.md): KV namespace USERS; secrets JWT_SECRET,
 * STRIPE_SECRET, STRIPE_WEBHOOK_SECRET; vars PRICE_STARTER, PRICE_PRO, SITE_URL.
 */
const PLANS = {
  free: { maxPx:1080, watermark:true,  weekly:3,   monthly:null },
  pro:  { maxPx:2160, watermark:false, weekly:null, monthly:100 },
  starter: { maxPx:2160, watermark:false, weekly:null, monthly:100 }, // legacy alias of pro
};
const enc = new TextEncoder();
const b64u = b => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2,'0')).join('');

async function hmac(secret, msg){
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', key, enc.encode(msg));
}
async function pbkdf2(pass, salt){
  const key = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name:'PBKDF2', hash:'SHA-256', salt: enc.encode(salt), iterations: 100000 }, key, 256);
  return hex(bits);
}
async function makeToken(email, env){
  const exp = Date.now() + 30 * 86400000;
  const body = b64u(enc.encode(JSON.stringify({ email, exp })));
  return body + '.' + b64u(await hmac(env.JWT_SECRET, body));
}
async function readToken(req, env){
  const h = req.headers.get('Authorization') || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!t || !t.includes('.')) return null;
  const [body, sig] = t.split('.');
  if (b64u(await hmac(env.JWT_SECRET, body)) !== sig) return null;
  const data = JSON.parse(atob(body.replace(/-/g,'+').replace(/_/g,'/')));
  return data.exp > Date.now() ? data.email : null;
}
const isoWeek = () => { const d = new Date(); const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = new Date(Date.UTC(t.getUTCFullYear(),0,1));
  return t.getUTCFullYear() + '-W' + String(Math.ceil((((t - y) / 86400000) + 1) / 7)).padStart(2,'0'); };
const isoMonth = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0'); };

const publicUser = u => ({ email: u.email, plan: u.plan, exports: u.exports });
const json = (data, status, env) => new Response(JSON.stringify(data), { status: status || 200, headers: {
  'Content-Type':'application/json',
  'Access-Control-Allow-Origin': env.SITE_URL || '*',
  'Access-Control-Allow-Headers':'Content-Type, Authorization',
  'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
}});

export default {
  async fetch(req, env){
    const url = new URL(req.url);
    const p = url.pathname.replace(/\/$/, '');
    if (req.method === 'OPTIONS') return json({}, 200, env);
    try {
      if (p === '/auth/signup' && req.method === 'POST'){
        const { email, password } = await req.json();
        const em = String(email || '').trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return json({ error:'Invalid email' }, 400, env);
        if (!password || password.length < 8) return json({ error:'Password needs at least 8 characters' }, 400, env);
        if (await env.USERS.get('u:' + em)) return json({ error:'An account with that email already exists' }, 409, env);
        const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
        const user = { email: em, salt, hash: await pbkdf2(password, salt), plan:'free', exports:{ period:'', count:0 }, created: Date.now() };
        await env.USERS.put('u:' + em, JSON.stringify(user));
        return json({ token: await makeToken(em, env), user: publicUser(user) }, 200, env);
      }
      if (p === '/auth/login' && req.method === 'POST'){
        const { email, password } = await req.json();
        const em = String(email || '').trim().toLowerCase();
        const raw = await env.USERS.get('u:' + em);
        if (!raw) return json({ error:'Wrong email or password' }, 401, env);
        const user = JSON.parse(raw);
        if (user.hash !== await pbkdf2(password || '', user.salt)) return json({ error:'Wrong email or password' }, 401, env);
        return json({ token: await makeToken(em, env), user: publicUser(user) }, 200, env);
      }
      if (p === '/me'){
        const em = await readToken(req, env);
        if (!em) return json({ error:'Not signed in' }, 401, env);
        const user = JSON.parse(await env.USERS.get('u:' + em) || 'null');
        if (!user) return json({ error:'Account not found' }, 404, env);
        return json({ user: publicUser(user) }, 200, env);
      }
      if (p === '/export' && req.method === 'POST'){
        const em = await readToken(req, env);
        if (!em) return json({ error:'Not signed in' }, 401, env);
        const user = JSON.parse(await env.USERS.get('u:' + em) || 'null');
        if (!user) return json({ error:'Account not found' }, 404, env);
        const plan = PLANS[user.plan || 'free'];
        const cap = plan.weekly ?? plan.monthly;
        const period = plan.weekly ? isoWeek() : isoMonth();
        if (user.exports.period !== period) user.exports = { period, count: 0 };
        if (cap !== null && user.exports.count >= cap) return json({ error:'Export limit reached for this ' + (plan.weekly ? 'week' : 'month') }, 402, env);
        user.exports.count++;
        await env.USERS.put('u:' + em, JSON.stringify(user));
        return json({ user: publicUser(user), maxPx: plan.maxPx, watermark: plan.watermark }, 200, env);
      }
      if (p === '/community/publish' && req.method === 'POST'){
        const em = await readToken(req, env);
        if (!em) return json({ error:'Sign in first' }, 401, env);
        const { name, thumb, data } = await req.json();
        if (!thumb || !data || String(data).length > 2500000) return json({ error:'Invalid image (max ~2MB)' }, 400, env);
        // simple abuse cap: 5 publishes per user per day
        const capKey = 'pub:' + em + ':' + new Date().toISOString().slice(0, 10);
        const used = parseInt(await env.USERS.get(capKey) || '0', 10);
        if (used >= 5) return json({ error:'Daily publish limit reached (5)' }, 429, env);
        await env.USERS.put(capKey, String(used + 1), { expirationTtl: 90000 });
        const id = 'c' + Date.now() + Math.random().toString(36).slice(2, 6);
        await env.USERS.put('c:' + id, JSON.stringify({ data }));
        const idx = JSON.parse(await env.USERS.get('cindex') || '[]');
        idx.unshift({ id, name: String(name || 'Background').slice(0, 40), thumb, ts: Date.now(), by: em.split('@')[0] });
        while (idx.length > 24){ const drop = idx.pop(); await env.USERS.delete('c:' + drop.id); }
        await env.USERS.put('cindex', JSON.stringify(idx));
        return json({ ok: true, id }, 200, env);
      }
      if (p === '/community/list'){
        return json({ items: JSON.parse(await env.USERS.get('cindex') || '[]') }, 200, env);
      }
      if (p === '/community/item'){
        const id = url.searchParams.get('id') || '';
        const raw = await env.USERS.get('c:' + id);
        if (!raw) return json({ error:'Not found' }, 404, env);
        return json(JSON.parse(raw), 200, env);
      }
      if (p === '/portal' && req.method === 'POST'){
        const em = await readToken(req, env);
        if (!em) return json({ error:'Sign in first' }, 401, env);
        const user = JSON.parse(await env.USERS.get('u:' + em) || 'null');
        if (!user || !user.stripeCustomer) return json({ error:'No billing account on file yet' }, 400, env);
        const r = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
          method:'POST',
          headers:{ Authorization:'Bearer ' + env.STRIPE_SECRET, 'Content-Type':'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ customer: user.stripeCustomer, return_url: env.SITE_URL }),
        });
        const j = await r.json();
        if (!r.ok) return json({ error: (j.error && j.error.message) || 'Stripe error' }, 502, env);
        return json({ url: j.url }, 200, env);
      }
      if (p === '/checkout' && req.method === 'POST'){
        const em = await readToken(req, env);
        if (!em) return json({ error:'Sign in first' }, 401, env);
        const { plan } = await req.json();
        const price = plan === 'pro' ? env.PRICE_PRO : null;
        if (!price) return json({ error:'Unknown plan' }, 400, env);
        const body = new URLSearchParams({
          mode:'subscription',
          'line_items[0][price]': price,
          'line_items[0][quantity]': '1',
          customer_email: em,
          'metadata[email]': em,
          'metadata[plan]': plan,
          'subscription_data[metadata][email]': em,
          'subscription_data[metadata][plan]': plan,
          success_url: env.SITE_URL + '/?checkout=success',
          cancel_url: env.SITE_URL + '/?checkout=cancel',
        });
        const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
          method:'POST',
          headers:{ Authorization:'Bearer ' + env.STRIPE_SECRET, 'Content-Type':'application/x-www-form-urlencoded' },
          body,
        });
        const j = await r.json();
        if (!r.ok) return json({ error: (j.error && j.error.message) || 'Stripe error' }, 502, env);
        return json({ url: j.url }, 200, env);
      }
      if (p === '/stripe-webhook' && req.method === 'POST'){
        const payload = await req.text();
        const sigHead = req.headers.get('Stripe-Signature') || '';
        const t = (sigHead.match(/t=([^,]+)/) || [])[1];
        const v1 = (sigHead.match(/v1=([0-9a-f]+)/) || [])[1];
        if (!t || !v1) return new Response('bad signature', { status: 400 });
        const expect = hex(await hmac(env.STRIPE_WEBHOOK_SECRET, t + '.' + payload));
        if (expect !== v1) return new Response('bad signature', { status: 400 });
        if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return new Response('stale', { status: 400 });
        const ev = JSON.parse(payload);
        if (ev.type === 'checkout.session.completed'){
          const md = ev.data.object.metadata || {};
          const em = (md.email || ev.data.object.customer_email || '').toLowerCase();
          const plan = md.plan;
          if (em && PLANS[plan]){
            const raw = await env.USERS.get('u:' + em);
            if (raw){
              const user = JSON.parse(raw);
              user.plan = plan;
              user.exports = { period:'', count: 0 };
              if (ev.data.object.customer) user.stripeCustomer = ev.data.object.customer;
              await env.USERS.put('u:' + em, JSON.stringify(user));
            }
          }
        }
        if (ev.type === 'customer.subscription.deleted'){
          const em = ((ev.data.object.metadata || {}).email || '').toLowerCase();
          if (em){
            const raw = await env.USERS.get('u:' + em);
            if (raw){ const user = JSON.parse(raw); user.plan = 'free'; await env.USERS.put('u:' + em, JSON.stringify(user)); }
          }
        }
        return new Response('ok');
      }
      return json({ error:'Not found' }, 404, env);
    } catch (err){
      return json({ error:'Server error: ' + err.message }, 500, env);
    }
  }
};
