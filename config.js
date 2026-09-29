// ── BUYBACK.AD configuration ──
// Leave PGFX_API empty to run in DEMO MODE (accounts + limits simulated in the
// browser, checkout simulated — perfect for clicking through the full flow).
// "/api" = the same-origin Netlify Function backend (netlify/functions/api.mjs)
// deployed with this site: real accounts, server-enforced limits, and the AI
// background service (the image-model key lives ONLY in Netlify env vars).
/* Derived from where the app is actually served, not hardcoded to the host
   root. The site is entirely relative-path (assets/…, no leading slash), so it
   already runs from any sub-path — this was the one absolute reference left,
   and under a mount like reselling.us/gfx it would have called
   reselling.us/api instead of the function deployed beside the app.
     served at /            -> "/api"
     served at /gfx/        -> "/gfx/api"
   A Cloudflare rule that proxies /gfx/* to the Netlify host therefore needs no
   special case: the request arrives as /api on the far side. */
window.PGFX_API = (function () {
  /* A copy served from this machine (python3 -m http.server) has no backend.
     Opened once as http://localhost:8899/?demo=1 it runs in DEMO MODE on this
     browser until ?demo=0, so the whole flow (an account, Pro, checkout) can be
     clicked through locally. Never on a real host: there the Worker enforces
     the plan, and this page's locks are display only. */
  var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  if (local) {
    try {
      if (/[?&]demo=1\b/.test(location.search)) localStorage.setItem('pgfx_local_demo', '1');
      if (/[?&]demo=0\b/.test(location.search)) localStorage.removeItem('pgfx_local_demo');
      if (localStorage.getItem('pgfx_local_demo') === '1') return '';
    } catch (e) {}
  }
  var dir = location.pathname.replace(/\/[^\/]*$/, '/');
  return (dir === '/' ? '' : dir.replace(/\/$/, '')) + '/api';
})();

// ── SCANS.AD (ScanMap) integration ──
// Where "Order prints + posting" sends finished ads: your ScanMap install's
// domain (its Netlify URL works too, e.g. "https://scansad.netlify.app").
// Leave EMPTY ("") to hide every cross-product button — Graphics Studio then
// runs 100% standalone.
window.SCANMAP_URL = "https://scans.ad";
