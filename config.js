// ── BUYBACK.AD configuration ──
// Leave PGFX_API empty to run in DEMO MODE (accounts + limits simulated in the
// browser, checkout simulated — perfect for clicking through the full flow).
// After deploying backend/worker.js, put its URL here to go live:
//   window.PGFX_API = "https://buybackad-api.YOURNAME.workers.dev";
window.PGFX_API = "";

// ── SCANS.AD (ScanMap) integration ──
// Where "Order prints + posting" sends finished ads: your ScanMap install's
// domain (its Netlify URL works too, e.g. "https://scansad.netlify.app").
// Leave EMPTY ("") to hide every cross-product button — Graphics Studio then
// runs 100% standalone.
// Production domain (swap in once DNS is live):  "https://scans.ad"
window.SCANMAP_URL = "https://myleskcb.github.io/scansad-scanmap";
