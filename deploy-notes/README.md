# Putting Graphics Studio on a real URL

## The URL that works today

**https://buybackad-graphics-studio.netlify.app** — this is the live site.

`studio.scans.ad` does **not** resolve. `dig studio.scans.ad` returns nothing;
the CNAME was never created. Netlify prints it after a deploy because it is the
*configured* custom domain, not because it works. Use the netlify.app URL for
the presentation.

## Option A — studio.scans.ad (2 minutes, recommended for tomorrow)

Netlify's side is already configured and waiting. Add one DNS record at whoever
hosts `scans.ad`:

    Type:  CNAME
    Name:  studio
    Value: buybackad-graphics-studio.netlify.app
    Proxy: OFF (grey cloud) if the DNS is on Cloudflare

Netlify issues the certificate automatically, usually within a few minutes.
Verify with:  `dig +short studio.scans.ad`

## Option B — reselling.us/gfx (the Cloudflare Worker)

`reselling.us` is a React SPA ("RU CRM v1") behind Cloudflare. Its router
answers every unknown path with its own shell, which is why `/gfx` returns 200
today while serving nothing — it is the CRM's index.html, not the studio.

1. Cloudflare dashboard → **Workers & Pages** → Create Worker
2. Paste `cloudflare-worker-gfx.js`, Deploy
3. Settings → **Triggers** → Add route: `reselling.us/gfx*`, zone `reselling.us`

No Netlify changes required. The studio uses only relative paths, and
`config.js` now derives its API base from `location.pathname`, so it runs
unmodified from a sub-path:

    served at /      -> PGFX_API = /api
    served at /gfx/  -> PGFX_API = /gfx/api

The Worker strips `/gfx` before forwarding, so the backend still sees `/api`.

### Check after deploying

    curl -sI https://reselling.us/gfx/ | head -1            # 200
    curl -s  https://reselling.us/gfx/ | grep -o '<title>[^<]*'   # Graphics Studio, not RU CRM
    curl -sI https://reselling.us/gfx  | grep -i location   # 301 -> /gfx/

If the title still says **RU CRM v1**, the Worker route did not match and the
SPA is still answering.

## Which to choose

`studio.scans.ad` is a separate branded host — cleaner for a product that has
its own signup and billing. `reselling.us/gfx` puts it inside an app the user is
already signed into. Doing Option A first costs nothing and gives a working
branded link regardless.
