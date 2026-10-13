'use strict';
/* ═══════════════ CHECKOUT, ON THE SITE (Stripe Embedded Checkout) ═══════════════
   One additive file, loaded after app.js. app.js's startCheckout() asks the
   function for an embedded session (/api/checkout with embedded: true) and,
   when it answers a client secret, hands it here.

   Owner, 2026-10-11: "We need to have a functional checkout that is also
   wrapped so we don't show the main generic Stripe checkout. It's built into
   our site and looks clean." The customer never leaves the page: Stripe's
   payment form (card, Apple Pay, Google Pay, Link and whatever else the
   Stripe dashboard switches on) is mounted inside this dialog, under the
   plan's name and price, and takes its colours and font from the Stripe
   dashboard's Branding settings. Card details go to Stripe inside its own
   frame; they never touch this page or the function.

   Two steps (the audit, 2026-10-11). First the agreement: what is being
   bought, the renewal terms in plain words, and a box the customer ticks for
   the Terms of Service (and a plan's automatic renewal) before any Checkout
   session exists; the function refuses a checkout without it and records the
   terms version and the time on the session, the subscription or payment,
   and the account. Then the payment: a card pays without a redirect, and
   onComplete closes the dialog while app.js's finishCheckout() switches the
   plan (or the credits) on from Stripe's own record of the session, the same
   path the hosted page's return takes. A method that must redirect comes back
   to /?checkout=success&session_id=…, which handleCheckoutReturn() reads.
   Stripe.js loads only at checkout (a script from js.stripe.com, never
   bundled, as Stripe requires), the dahlia release, the one that matches the
   API's embedded_page sessions (2026-10-13); if it cannot load, or the function has no
   publishable key, the customer goes to Stripe's hosted page instead, so a
   blocker never leaves anyone unable to pay. */
(function () {
  const $ = (id) => document.getElementById(id);
  let stripeLoad = null;
  let current = null;

  function loadStripe() {
    if (window.Stripe) return Promise.resolve(window.Stripe);
    if (stripeLoad) return stripeLoad;
    stripeLoad = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://js.stripe.com/dahlia/stripe.js';
      s.async = true;
      s.onload = () => (window.Stripe ? resolve(window.Stripe) : reject(new Error('Stripe did not load')));
      s.onerror = () => { stripeLoad = null; s.remove(); reject(new Error('Stripe did not load')); };
      document.head.appendChild(s);
    });
    return stripeLoad;
  }

  function teardown() {
    const c = current;
    current = null;
    if (c) { try { c.destroy(); } catch (e) { /* already gone */ } }
    const m = $('co-mount');
    if (m) m.innerHTML = '';
  }
  function close() {
    teardown();
    const ov = $('co-overlay');
    if (ov) ov.classList.remove('show');
  }

  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let opts = null;

  /* Step 1, the agreement (2026-10-11, the audit): what is being bought, the
     renewal terms in plain words, and a box the customer ticks for the Terms
     of Service (and, on a plan, the automatic renewal) before any Checkout
     session exists. The function refuses a checkout without it and records
     the version and the time on the session and the account. */
  function showConsent(o) {
    $('co-features').innerHTML = (o.features || []).map((f) => '<li>' + esc(f) + '</li>').join('');
    $('co-terms').textContent = o.terms || '';
    $('co-agree-text').innerHTML = o.plan
      ? 'I agree to the <a href="terms.html" target="_blank" rel="noopener">Terms of Service</a>, including the automatic renewal above, and I have read the <a href="privacy.html" target="_blank" rel="noopener">Privacy Policy</a>.'
      : 'I agree to the <a href="terms.html" target="_blank" rel="noopener">Terms of Service</a> and I have read the <a href="privacy.html" target="_blank" rel="noopener">Privacy Policy</a>.';
    $('co-agree').checked = false;
    $('co-go').disabled = true;
    $('co-go').textContent = 'Continue to secure payment';
    $('co-err').textContent = '';
    $('co-consent').hidden = false;
    $('co-loading').hidden = true;
  }

  /* Step 2: the session (asked for only now, with the agreement), then
     Stripe's form mounted here; the hosted page when the function answers a
     URL (no publishable key) or Stripe.js cannot load. */
  async function proceed() {
    const o = opts;
    if (!o || !$('co-agree').checked) return;
    $('co-go').disabled = true;
    $('co-go').textContent = 'Preparing secure payment…';
    $('co-err').textContent = '';
    let j;
    try { j = await o.start(); }
    catch (e) {
      if (o.onError && o.onError(e)) { close(); return; }
      $('co-err').textContent = e.message || 'Checkout could not start. Nothing was charged.';
      $('co-go').disabled = false;
      $('co-go').textContent = 'Try again';
      return;
    }
    if (!j.clientSecret) { location.href = j.url; return; }
    $('co-consent').hidden = true;
    $('co-loading').hidden = false;
    let StripeCtor;
    try { StripeCtor = await loadStripe(); }
    catch (e) {
      console.warn('embedded checkout:', e);
      try { location.href = await o.hosted(); } catch (e2) { $('co-loading').hidden = true; $('co-consent').hidden = false; $('co-err').textContent = 'Secure payment could not load. Nothing was charged. Try again.'; $('co-go').disabled = false; $('co-go').textContent = 'Try again'; }
      return;
    }
    teardown();                              // Stripe allows one embedded checkout at a time
    const stripe = StripeCtor(j.publishableKey);
    // dahlia renamed initEmbeddedCheckout to createEmbeddedCheckoutPage (same options)
    const create = stripe.createEmbeddedCheckoutPage ? 'createEmbeddedCheckoutPage' : 'initEmbeddedCheckout';
    const checkout = await stripe[create]({
      fetchClientSecret: () => Promise.resolve(j.clientSecret),
      onComplete: () => {
        close();
        if (typeof o.onDone === 'function') o.onDone(j.sessionId);
      },
    });
    current = checkout;
    checkout.mount('#co-mount');
    $('co-loading').hidden = true;
  }

  /** o: { title, price, note, features[], terms, plan (bool), start() → the
   *  /api/checkout answer, hosted() → a hosted Checkout URL, onDone(sessionId),
   *  onError(e) → true when handled (the dialog closes) } */
  function open(o) {
    teardown();
    opts = o;
    $('co-title').textContent = o.title || 'Checkout';
    $('co-price').textContent = o.price || '';
    $('co-note').textContent = o.note || '';
    showConsent(o);
    $('co-overlay').classList.add('show');
  }

  function bind() {
    const ov = $('co-overlay');
    if (!ov) return;
    $('co-x').onclick = close;
    $('co-agree').onchange = (e) => { $('co-go').disabled = !e.target.checked; };
    $('co-go').onclick = proceed;
    ov.addEventListener('mousedown', (e) => { if (e.target === ov) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ov.classList.contains('show')) close(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();

  window.PGFX_CHECKOUT = { open, close, loadStripe };
})();
