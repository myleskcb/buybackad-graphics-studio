/* This workspace sits beside motion/, under the same Studio account server.
   Preview is explicit and local only; it never unlocks a deployed page. */
window.IPLA_SOCIAL_PREVIEW = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
  && new URLSearchParams(location.search).get("preview") === "1";
window.PGFX_API = new URL("../api", location.href).pathname.replace(/\/$/, "");
