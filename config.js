// ── BUYBACK.AD configuration ──
// Leave PGFX_API empty to run in DEMO MODE (accounts + limits simulated in the
// browser, checkout simulated — perfect for clicking through the full flow).
// "/api" = the same-origin Netlify Function backend (netlify/functions/api.mjs)
// deployed with this site: real accounts, server-enforced limits, and the AI
// background service (the image-model key lives ONLY in Netlify env vars).
window.PGFX_API = "/api";

// ── SCANS.AD (ScanMap) integration ──
// Where "Order prints + posting" sends finished ads: your ScanMap install's
// domain (its Netlify URL works too, e.g. "https://scansad.netlify.app").
// Leave EMPTY ("") to hide every cross-product button — Graphics Studio then
// runs 100% standalone.
window.SCANMAP_URL = "https://scans.ad";
