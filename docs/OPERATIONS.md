# Operations — hosting, deploy, URLs, repo hygiene

State verified 2026-08-28.

## Live URLs

| URL | Status | Notes |
|---|---|---|
| **https://buybackad-graphics-studio.netlify.app** | **200 — use this** | Netlify default. Always works. **Phone-accessible.** |
| https://studio.scans.ad | DNS fails | Configured in Netlify, not resolvable. See below. |
| https://buyback.ad | DNS fails | Domain alias set, no DNS at all |
| https://scans.ad | 200 | The sibling product, resolves fine |
| https://reselling.us/GFX | 200 but WRONG | Serves "RU CRM v1" — a different app's SPA shell |

### The studio.scans.ad break — diagnosed, needs a human

The DNS record is **correct on Netlify's nameservers**:

```
dig +short studio.scans.ad @dns1.p04.nsone.net   ->  52.52.192.191, 13.52.188.95
dig +short studio.scans.ad @8.8.8.8              ->  (nothing)
```

Cause: `scans.ad` is delegated at the registrar to
`dns1.registrar-servers.com` / `dns2.registrar-servers.com` (Namecheap), **not**
to Netlify's `dns1.p04.nsone.net`. The Netlify zone exists and has the record,
but it is not authoritative, so nobody on the internet can see it. The root
`scans.ad` resolves only because an A record was added at the registrar
directly.

**Two fixes, both requiring registrar access (a human decision — do not do this
unattended, it moves DNS for a live product):**

1. *Minimal:* add a `studio` CNAME at Namecheap pointing to
   `buybackad-graphics-studio.netlify.app`. Touches nothing else.
2. *Clean:* repoint `scans.ad` nameservers at Namecheap to Netlify's NS1 set,
   so the existing Netlify zone becomes authoritative. Better long-term,
   briefly riskier for the live `scans.ad` site.

### About reselling.us/GFX

`reselling.us` is Cloudflare-fronted and serves **RU CRM v1**, a separate Vite
SPA whose catch-all returns its shell for every path — which is why `/GFX`
returns 200 with the wrong app. Mounting the studio there means either a
reverse-proxy rule or a subdomain. **Recommended: `gfx.reselling.us` as a CNAME
to the Netlify site.** A subdomain avoids fighting another app's router, and it
is one DNS record instead of a proxy rule that has to be maintained.

Until a domain decision is made, the netlify.app URL is the phone URL.

## Deploying

The Netlify CLI is authenticated (`myleskcb@gmail.com`, team KCB) and the folder
is linked to project `buybackad-graphics-studio`.

```
cd ~/Downloads/gfxv23
netlify status          # confirm link
netlify deploy          # DRAFT deploy, gives a preview URL — do this first
netlify deploy --prod   # promote to the live URL
```

**Always draft-deploy and open the preview before `--prod`.** The library
reports 243/243 while silently broken (DESIGN-LAW rule 42); a preview render is
the only real check.

## Repo hygiene

- Remote: `myleskcb/buybackad-graphics-studio`
- `.gitignore` correctly excludes `.env`, `node_modules/`, `.netlify/`
- `assets/` is 38MB and tracked; that is intentional, the backgrounds are the
  product

### Known risk — the working copy lives in ~/Downloads

There are **23 sibling copies** (`gfxv6` through `gfxv23`, `phonegfxv5`,
`GFX SITE`, plus a *different* `gfxv23` on the Desktop). Only
`~/Downloads/gfxv23` has the git remote and the current work. Before this
session, its last commit was July 8 while the working tree held 5,080 changed
lines — seven weeks of unbacked work.

**Recommended migration (safe, do when the user is present):**

```
mv ~/Downloads/gfxv23 ~/dev/buybackad-graphics-studio
cd ~/dev/buybackad-graphics-studio && netlify link   # re-link if needed
```

Leave the old copies alone until the user confirms; some may hold assets that
were never committed.

## Session hygiene

Another Claude session was deploying to this site every few minutes on
2026-08-28. If deploys appear that this log does not explain, that is why.
Check `git log` and the Netlify deploy list before assuming breakage.
