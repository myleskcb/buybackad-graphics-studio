# Mail out: what the owner sets up

The code is in place (DESIGN-LAW 182, OPEN-ITEMS §CJ): **Forgot password?** in both sign-in
windows, the reset page (`reset.html`), and a link to confirm the address when someone makes an
account with an email and a password (`confirm.html`). Nothing is sent until the Postmark token is
in Netlify. Until then, Forgot password? tells people to write to support@webuy.ad, and nobody is
asked to confirm anything.

You do these steps yourself: they need your sign-ins, and you paste the key. About 30 minutes,
most of it waiting for DNS.

## Why Postmark

webuy.ad's incoming mail (support@ and hello@ to your Gmail) is Namecheap's free Email
Forwarding. It owns the domain's MX records, and Namecheap says it cannot share the domain with
another mail service. Resend, the other easy choice, needs an MX record on `send.webuy.ad`, which
Namecheap only allows under "Custom MX", and that would switch the forwarding off. Postmark needs
one TXT record and one CNAME record on names of their own, so the forwarding is not touched. It
sends only transactional mail (no newsletters on the same servers), its API is one HTTPS call with
one key, and its free Developer plan is 100 emails a month and does not expire. When that is not
enough, Basic is $15 a month for 10,000.

## 1. Postmark

1. Sign up at https://postmarkapp.com (Start free). Use myleskcb@gmail.com or support@webuy.ad.
2. Postmark makes a first **server**. Open it, then **Settings**, and rename it **WeBuy.AD**.
   Keep its message stream **Default Transactional Stream** ("outbound"). Leave link tracking
   and open tracking off (the site also asks for none).
3. **Sender Signatures → Add Domain or Signature → Add Domain**: `webuy.ad`. Postmark shows its
   DNS settings page with two records. Keep this tab open:
   - **DKIM**: a TXT record. Its hostname is a date stamp ending in `pm._domainkey`, for example
     `20261124123456pm._domainkey.webuy.ad`, and its value starts `k=rsa;p=`. Both are made for
     your account: copy them from the page, not from here.
   - **Return-Path**: a CNAME record, `pm-bounces.webuy.ad` pointing to `pm.mtasv.net`.
4. If the dashboard says your account is **pending approval**, ask for approval there (it asks
   what you send: password reset links and address confirmations for webuy.ad accounts, no
   marketing). Until Postmark approves it, a new account may only send to addresses at webuy.ad,
   so support@webuy.ad is the address to test with.

## 2. DNS at Namecheap

Namecheap → **Domain List → webuy.ad → Manage → Advanced DNS**.

**Leave these as they are.** Under **Mail Settings**, **Email Forwarding** stays selected: it
keeps the MX records `eforward1` to `eforward5.registrar-servers.com` that bring support@ and
hello@ to your Gmail. Do not choose Custom MX. Under **Host Records**, leave the root's SPF
(`TXT @ v=spf1 include:spf.efwd.registrar-servers.com ~all`), the `google-site-verification`
TXT, `A @ 75.2.60.5` and `CNAME www`.

Under **Host Records**, press **Add New Record** three times:

| Type | Host | Value | TTL |
|---|---|---|---|
| TXT Record | the DKIM hostname **without** `.webuy.ad`, e.g. `20261124123456pm._domainkey` | the DKIM value from Postmark, `k=rsa;p=…`, all of it | Automatic |
| CNAME Record | `pm-bounces` | `pm.mtasv.net` | Automatic |
| TXT Record | `_dmarc` | `v=DMARC1; p=none;` | Automatic |

- If a `_dmarc` record is there already, change it instead of adding a second one.
- Namecheap adds `.webuy.ad` to each host itself: typing the full name makes
  `….webuy.ad.webuy.ad`, which never verifies.
- **SPF does not change.** SPF checks the Return-Path's domain, and Postmark's Return-Path is
  `pm-bounces.webuy.ad`, which the CNAME hands to Postmark. The root's SPF stays the forwarding's.
- `p=none` asks receivers only to report, never to reject: the safe first step. Once a few weeks
  of mail pass, it can become `p=quarantine`. Postmark's free DMARC digests
  (https://dmarc.postmarkapp.com) give you a `rua=` address to add if you want the weekly report.

Press the green tick on each row to save. Namecheap says records take about 30 minutes.

## 3. Verify in Postmark

Back on Postmark's DNS settings page for webuy.ad, press **Verify** beside DKIM and beside
Return-Path. Both should turn green. If one stays grey after an hour, compare the host and value
with what Postmark shows, character for character.

## 4. The key into Netlify

1. Postmark → the **WeBuy.AD** server → **API Tokens** → copy the **Server API token**.
2. Netlify → **buybackad-finished-copy → Site configuration → Environment variables → Add a
   variable**: key `POSTMARK_TOKEN`, value the token. Tick **Contains secret values**, scope
   **Functions**, and give it to **Production** (as `STRIPE_SECRET` is; previews can have it
   later).
3. Redeploy so the function sees it: **Deploys → Trigger deploy → Deploy site** (or the next push
   to `main`).

## 5. Check it

1. https://webuy.ad/api/health answers `"mail":true`.
2. On https://webuy.ad press **Log in → Forgot password?**, type an address that has an account
   (support@webuy.ad while Postmark is pending approval), and press **Send reset link**.
3. The mail comes from **WeBuy.AD <support@webuy.ad>**, subject "Reset your WeBuy.AD password".
   In Gmail, **⋮ → Show original** should say **SPF: PASS**, **DKIM: PASS** and **DMARC: PASS**.
4. Open the link, choose a new password, and sign in with it.
5. Make a new account with an email and a password: a "Confirm your email for WeBuy.AD" mail
   arrives, and the account menu shows "Confirm your email" until the link is opened.

## Good to know

- **Who gets what.** Forgot password? answers the same words for every address, so nobody can use
  it to learn who has an account. A reset link works once, for 60 minutes, and asking again
  retires the older one. A confirmation link works for 7 days. Google and Apple accounts are
  never asked to confirm; they can use Forgot password? to add a password.
- **Limits.** 3 reset links an hour for an address and 10 from one internet address; 3
  confirmation links an hour for an account and 10 from one internet address (sign-ups included,
  so the form cannot be used to mail strangers). The person is told to try again later.
- **When the free 100 a month runs out**, Postmark refuses the rest: people still see "a link is
  on its way" but nothing arrives, and Netlify's function log says `Postmark: …`. Postmark's
  dashboard shows the month's count; move to Basic before it gets close.
- **Apple's Hide My Email.** An Apple account's address can be a `…@privaterelay.appleid.com`
  relay, which only passes mail from senders registered with Apple. Those accounts sign in with
  Apple and rarely need a reset. To reach them anyway: Apple Developer → **Certificates,
  Identifiers & Profiles → Services → Sign in with Apple for Email Communication → Configure**,
  add the domain `webuy.ad` and the address `support@webuy.ad`.
- **Replies** go to support@webuy.ad, which forwards to your Gmail as before.
- **The privacy policy** names Postmark and says what is kept (since 2026-11-24's text).
