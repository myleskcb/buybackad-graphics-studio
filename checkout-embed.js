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

   A card pays without a redirect; onComplete closes the dialog and app.js's
   finishCheckout() switches the plan (or the credits) on from Stripe's own
   record of the session, the same path the hosted page's return takes. A
   method that must redirect comes back to /?checkout=success&session_id=…,
   which handleCheckoutReturn() already reads. Stripe.js loads only when
   someone checks out (it is a script from js.stripe.com, never bundled, as
   Stripe requires); if it cannot load, open() rejects and startCheckout()
   sends the customer to the hosted page instead, so a blocker never leaves
   anyone unable to pay. */
(function () {
  const $ = (id) => document.getElementById(id);
  let stripeLoad = null;
  let current = null;

  function loadStripe() {
    if (window.Stripe) return Promise.resolve(window.Stripe);
    if (stripeLoad) return stripeLoad;
    stripeLoad = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://js.stripe.com/v3/';
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

  /** o: { clientSecret, publishableKey, sessionId, title, price, note, onDone(sessionId) } */
  async function open(o) {
    const StripeCtor = await loadStripe();   // rejects: the caller falls back to the hosted page
    teardown();                              // Stripe allows one embedded checkout at a time
    $('co-title').textContent = o.title || 'Checkout';
    $('co-price').textContent = o.price || '';
    $('co-note').textContent = o.note || '';
    $('co-loading').hidden = false;
    $('co-overlay').classList.add('show');
    const stripe = StripeCtor(o.publishableKey);
    const checkout = await stripe.initEmbeddedCheckout({
      fetchClientSecret: () => Promise.resolve(o.clientSecret),
      onComplete: () => {
        close();
        if (typeof o.onDone === 'function') o.onDone(o.sessionId);
      },
    });
    current = checkout;
    checkout.mount('#co-mount');
    $('co-loading').hidden = true;
  }

  function bind() {
    const ov = $('co-overlay');
    if (!ov) return;
    $('co-x').onclick = close;
    ov.addEventListener('mousedown', (e) => { if (e.target === ov) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ov.classList.contains('show')) close(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();

  window.PGFX_CHECKOUT = { open, close, loadStripe };
})();
