# Operations — hosting, deploy, URLs, repo hygiene

State verified 2026-08-28; the URLs, mail and logins 2026-11-23 (OPEN-ITEMS §BX); mail out written 2026-11-24 (§CJ).

## Live URLs

| URL | Status | Notes |
|---|---|---|
| **https://webuy.ad** | **200 — use this** | The site's address: `buybackad-finished-copy`'s primary domain, `main`. DNS at Namecheap (`A @ 75.2.60.5`, `CNAME www buybackad-finished-copy.netlify.app.`), Let's Encrypt certificate by Netlify. Live 2026-11-19 UTC (OPEN-ITEMS §BL) |
| https://buybackad-finished-copy.netlify.app | 200 | The same project's Netlify address |
| https://buybackad-graphics-studio.netlify.app | 200, stale | The older project (team KCB): a CLI deploy of 2026-10-07. **iPhones LA's studio connection still points here** (only this origin passes iphones.la's CORS door, checked 2026-11-23); redirect it to webuy.ad once iPhones LA accepts webuy.ad (below) |
| https://buyback.ad | never registered | Dropped 2026-11-23: the .ad registry has no record of it and the owner chose not to buy it. Taken off the old project |
| https://studio.scans.ad | dropped | Never resolved (the Netlify zone was not authoritative; `scans.ad` is in another Namecheap account). Taken off the old project 2026-11-23 |
| https://scans.ad | 200 | The sibling product, resolves fine |
| https://reselling.us/GFX | 200 but WRONG | Serves "RU CRM v1" — a different app's SPA shell |

### Mail

`webuy.ad` uses Namecheap's email forwarding (Domain List → webuy.ad → Manage →
Redirect Email; MX `eforward1-5.registrar-servers.com`, SPF
`include:spf.efwd.registrar-servers.com`):

| Address | Forwards to |
|---|---|
| support@webuy.ad | myleskcb@gmail.com and contact@iphones.la |
| hello@webuy.ad | myleskcb@gmail.com |

The terms and privacy policy give support@webuy.ad.

**Mail out** (DESIGN-LAW 182, OPEN-ITEMS §CJ; built 2026-11-24, not live until the
owner's steps in `docs/MAIL-SETUP.md`): the password reset link and the address check,
from `WeBuy.AD <support@webuy.ad>` through Postmark, switched on by `POSTMARK_TOKEN`
in Netlify. It adds three records at Namecheap and changes nothing above:

| Record | Host | Value |
|---|---|---|
| TXT (DKIM) | `<date>pm._domainkey`, as Postmark's DNS page shows it | `k=rsa;p=…` from that page |
| CNAME (Return-Path) | `pm-bounces` | `pm.mtasv.net` |
| TXT (DMARC) | `_dmarc` | `v=DMARC1; p=none;` |

Mail Settings stays **Email Forwarding** (never Custom MX, which switches the forwarding
off), and the root's SPF stays the forwarding's: Postmark's Return-Path carries its own.
`/api/health` says `"mail":true` once the token is in. Postmark's free plan is 100 emails
a month; the dashboard shows the count.

### Accounts that hold the site

| What | Where | Login |
|---|---|---|
| webuy.ad (registrar and DNS) | Namecheap, BasicDNS | account `myleskcb` (also holds iphones.la, reselling.us; not scans.ad) |
| `buybackad-finished-copy` (webuy.ad, `main`) | Netlify team myleskcb2 | myleskcb2@gmail.com, with Google |
| `buybackad-graphics-studio` (the old project) | Netlify team KCB | myleskcb@gmail.com |
| Mail out (reset links, address checks) | Postmark, server **WeBuy.AD**, domain webuy.ad | not made yet: the owner's, `docs/MAIL-SETUP.md` |

One browser holds one Netlify login at a time. Keep webuy.ad's DNS at Namecheap:
do not move a domain to Netlify DNS unless its nameservers at the registrar move
too (that mismatch is why studio.scans.ad never resolved).

### Retiring the old project, in order

1. iPhones LA accepts webuy.ad: `https://webuy.ad` in `STUDIO_SITES`
   (`app/buyback_ad_feed.py`) and `DEFAULT_STUDIO_URL` (`app/studio_auth.py`) in
   `myleskcb/iphoneslainv-1`, and on Render `GFX_STUDIO_URL=https://webuy.ad/`
   with `https://webuy.ad` in `GFX_STUDIO_ORIGINS` (docs/IPHONESLA-CONNECTION.md).
   Check: `curl -si -X OPTIONS https://iphones.la/api/buy-ads/studio/brief -H
   'Origin: https://webuy.ad' -H 'Access-Control-Request-Method: GET'` answers 204.
2. Then deploy a redirect to the old project (team KCB login): a folder with
   `_redirects` holding `/*  https://webuy.ad/:splat  301!` and an `index.html`
   that links to webuy.ad. Accounts made there stay in its Blobs; nobody was
   billed there (it predates Stripe).

### About reselling.us/GFX

`reselling.us` is Cloudflare-fronted and serves **RU CRM v1**, a separate Vite
SPA whose catch-all returns its shell for every path — which is why `/GFX`
returns 200 with the wrong app. Mounting the studio there means either a
reverse-proxy rule or a subdomain. **Recommended: `gfx.reselling.us` as a CNAME
to the Netlify site.** A subdomain avoids fighting another app's router, and it
is one DNS record instead of a proxy rule that has to be maintained.

Until a domain decision is made, the netlify.app URL is the phone URL.
(2026-11-18: the decision is webuy.ad, OPEN-ITEMS §BL.)

## Deploying

On 2026-11-23 this Mac had no Netlify CLI installed and no CLI login: webuy.ad
deploys by GitHub (a push to `main` moves `claude/fervent-pascal-w6mthe`, which
`buybackad-finished-copy` builds). The commands below are for the old project,
team KCB (`myleskcb@gmail.com`).

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
