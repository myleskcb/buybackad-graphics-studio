/**
 * Serve Graphics Studio at https://reselling.us/gfx/
 *
 * reselling.us is a React SPA ("RU CRM v1") behind Cloudflare whose router
 * answers every unknown path with its own shell — which is why /gfx already
 * returns 200 today while serving nothing. This Worker intercepts /gfx/* before
 * the SPA sees it and proxies to the Netlify deployment.
 *
 * Deploy: Cloudflare dashboard → Workers & Pages → Create Worker → paste this →
 * Deploy → Settings → Triggers → Add route:  reselling.us/gfx*   (zone reselling.us)
 *
 * No changes are needed on the Netlify side. The studio is entirely
 * relative-path (assets/…), and config.js derives its API base from
 * location.pathname, so it runs unmodified from a sub-path.
 */
const ORIGIN = 'https://buybackad-graphics-studio.netlify.app';
const MOUNT  = '/gfx';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    /* /gfx with no trailing slash must redirect, not proxy. Without the slash
       the browser resolves every relative asset against / instead of /gfx/,
       and the whole page 404s while looking like a routing problem. */
    if (url.pathname === MOUNT) {
      return Response.redirect(url.origin + MOUNT + '/' + url.search, 301);
    }
    if (!url.pathname.startsWith(MOUNT + '/')) return fetch(request);

    // strip the mount point: /gfx/assets/x.jpg -> /assets/x.jpg
    const upstream = new URL(ORIGIN);
    upstream.pathname = url.pathname.slice(MOUNT.length) || '/';
    upstream.search   = url.search;

    const req = new Request(upstream, request);
    req.headers.set('Host', upstream.host);           // Netlify routes on Host
    req.headers.delete('accept-encoding');            // let CF negotiate

    const res = await fetch(req, { redirect: 'manual' });

    /* An upstream redirect points at the Netlify host; rewrite it back onto
       the mount so the visitor never leaves reselling.us. */
    const loc = res.headers.get('location');
    if (loc) {
      const out = new Headers(res.headers);
      try {
        const l = new URL(loc, ORIGIN);
        if (l.origin === ORIGIN) out.set('location', MOUNT + l.pathname + l.search);
      } catch (e) { /* leave a malformed Location alone */ }
      return new Response(res.body, { status: res.status, headers: out });
    }
    return res;
  },
};
