# BUYBACK.AD and Reselling.US: the plan to release them as one family

Written 2026-11-13. Read against this repo's `claude/focused-bell-da4xmh`
(same as `main` at `9dddf354`) and `myleskcb/resale-app` `main` at `b76e0c9`
(2026-11-12). Nothing here is built. The owner's new Reselling.US pricing is
being written in another session and is not in that repo yet; section 6 lists
what this plan is waiting on from it.

When either side changes, update this file in the same change, as
`IPHONESLA-CONNECTION.md` does.

## 1. The two products as they stand

| | BUYBACK.AD Graphics Studio | Reselling.US |
|---|---|---|
| Repo | `myleskcb/buybackad-graphics-studio` | `myleskcb/resale-app` (package `resale`) |
| Runs on | Netlify: static pages, one function, Netlify Blobs | Render: FastAPI, Postgres (`render.reselling.yaml`), a Cloudflare Worker in front |
| An account is | one email, one business, no team | a workspace (the shop) with an owner and members |
| Sign-in | a signed token in the browser's local storage; Google optional | a session cookie (HttpOnly, SameSite Lax, 30 days) |
| Email | sends none; no password reset | SMTP: 6-digit code, reset, invites (only once mail is set on Render) |
| Billing | Stripe, on-site form, prices and webhook make themselves, four plans and two packs | Stripe hosted checkout, one fixed Pro price id, check packs |
| Plans in code | Free, Starter $25, Pro $60, Business $100 | Free, Pro $29, Operator $250 (key `business`, not listed), three waiting lists |
| Credits | AI credits, 4 cents of model cost each, monthly allowance and packs | IMEI check credits, 10 cents each, at cost |
| Terms and Privacy | published, version 2026-10-12, consent recorded at checkout | drafts, marked "not in force", a page each |
| Says about posting | "does not post for you" (About) | roadmap: posting on OfferUp and Facebook "not planned"; the Integrations waiting list offers exactly that |
| Mentions the other | a hosting note only | nowhere |

Reselling.US's `docs/connections-plan.md` also carries list prices "after Feb
2027": Hobby $75, Pro $200, Operator $500, Max $1,000, with early adopters
kept at $29 and $250. `plans.py` does not have them.

## 2. Where they disagree today

1. **Two things called Pro**, at $60 and $29, and "Business" means the $100
   studio plan here and the Operator setup there.
2. **Two things called credits**, with different prices and rules (studio
   packs never expire and plan credits do not carry over; check credits are
   one balance).
3. **Posting.** Three statements, one product family: the studio does not
   post, Reselling.US will never post to OfferUp or Facebook, and
   Reselling.US's Integrations tier posts to OfferUp and Facebook.
4. **Legal.** The studio's terms are finished and the other side's are a
   draft that names no company, no governing law and no refund rule. Neither
   Privacy Policy names the other product.
5. **Who the customer is.** A studio account is a person's email; a
   Reselling.US account is a shop with seats. A link has to join a shop to
   one studio account, not a person to a person.
6. **Support.** The studio gives `hello@buyback.ad` and a phone number;
   Reselling.US gives "the support address on the pricing page".

## 3. Decisions that are the owner's

1. The sentence that relates them. Proposed: "Graphics Studio by BUYBACK.AD,
   part of Reselling.US", one company responsible for both, the studio still
   usable alone (gold, cars, cards and coin buyers have no phone inventory).
2. The studio's address: `buyback.ad`, or `studio.reselling.us`. Not
   `reselling.us/gfx`: a path mount breaks the library link shape on this
   side and on iPhones.LA's.
3. What a Reselling.US plan includes from the studio: credits, a studio
   plan, or a discount.
4. One Pro or two names.
5. The one line on posting that both sites print.

## 4. The work, in order

### A. Say the same things (no connection needed)

- One glossary both repos copy from: plan names, what a credit is, the ⓘ
  line for every feature, the posting line, the company name, the support
  address. On this side it feeds `netlify/lib/plans.mjs`, `PLANS` in
  `app.js`, `about.html`, the plans page and `terms.html`; on the other
  `resale/plans.py` (`features`, `PRO_FEATURES`) and `static/index.html`.
- The ⓘ on plan lines here too, same behaviour as there: hover on a
  computer, tap on a phone, reachable by keyboard.
- One Terms and one Privacy Policy text, two pages. The studio's is the base
  because it is the finished one: same sections, company, law, refunds,
  cancellation, AI clause and version date on both. Each Privacy Policy names
  the other product and exactly what the link carries. Publishing a new
  version here means bumping `TERMS_VERSION` in `netlify/lib/billing.mjs`;
  consent is already recorded per checkout. Reselling.US has no consent
  record yet and needs one.
- A link each way in the footers and on the plans pages.

### B. Finish the studio for strangers (independent of Reselling.US)

From `FLOW-AUDIT-2026-11-11.md`, still open:

- **Password reset and email.** The function has no reset route and the
  studio sends no mail. This needs a mail provider, the same one
  Reselling.US uses for preference.
- One live site and one price (two Netlify sites were showing different
  prices on 2026-11-11).
- The library that Starter, Pro and Business sell opened to them.
- The preview pinned on a phone; the two pop-ups out of the first run.
- One full Stripe walk in test mode, then live (`README.md`, Stripe step 3).

### C. The link, version 1: open the studio from a device

Reuse connection 1 to 3 of `IPHONESLA-CONNECTION.md`; the shape is proven and
keeps cookies out of it.

- Reselling.US: a new router (`resale/studio.py`). `POST
  /api/studio/connect` (signed-in owner or member) mints a ten-minute
  one-time code and returns the studio address with
  `#ru=<code>&brief=<device>`. `POST /api/studio/exchange` swaps the code for
  a bearer token tied to the workspace (hash kept, as `connect.py` does for
  the Mac helper). `GET /api/studio/brief` answers the shop's name, plan and
  what the studio may use. `POST /api/studio/images` adds an export to a
  device's photos through `photos.py`, inside the plan's photo limit. CORS
  for the studio's exact origin on these four paths only.
- Studio: `iphonesla-link.js` becomes a shop link with a short list of
  allowed partners (iPhones.LA, Reselling.US), each with its own host, paths
  and return address. `connect-src https://reselling.us` in `netlify.toml`
  and `_headers`, then `scripts/csp_hashes.mjs` and `verify_csp.mjs`.
- What the brief carries: model, storage, colour, carrier, grade, asking
  price, the shop's name, phone, city and Instagram. Never cost, notes,
  where it was bought or the IMEI, the same fence as the buyer page.
- Buttons on the Reselling.US side: "Make an ad for this phone" on a device,
  "Make a We Buy ad" on the dashboard, "Story card" (the studio's Story size
  replaces or sits beside `stories.py`'s three looks; owner's call).

### D. Plans across the link

The studio asks Reselling.US, never the reverse: `brief` answers what the
workspace's plan grants (a studio plan level, AI credits a month), and the
studio reads it once per page load, as it already does for iPhones.LA. The
studio account joined to the workspace is lifted to that level while the
token is good. No shared secret, and each product keeps its own Stripe.
`planFor()` in the function needs one more source besides the account's own
plan and the operator list.

A team has several people and the studio account has one email. Version 1:
the workspace's token is the identity, and every member who opens the studio
through the link shares the workspace's allowance.

### E. One wallet (later, and the largest piece)

Netlify Blobs has no transactions, so a balance spent from two products
should live in Reselling.US's Postgres: one ledger of credits with a price
table per action (an IMEI check, an AI background), the studio spending
through the token and refunding on failure. Until then, D's monthly grant is
enough to sell "credits and quick access".

### F. After that

One listing writer (`motion/listing.js` here, `resale/listing_copy.py`
there); the library feed for whatever posting Reselling.US finally offers.

## 5. Risks to settle before the release

- Reselling.US's page headers refuse being framed and the studio's do too, so
  the studio opens in a tab, never inside the app. That is the right default.
- Reselling.US keeps photos in its database (500 on Free). Studio exports are
  1 to 3 MB each at 2160; count them, or keep them smaller on the way in.
- Reselling.US's own checklist (`docs/security-review-2026-11.md`) still has
  owner items open: mail, operator email, the Worker's secret, the terms.
  The link should not go live before those.
- iPhones.LA's allowed studio sites (`STUDIO_SITES`, `GFX_STUDIO_ORIGINS`)
  must gain any new studio address in the same change.

## 6. Waiting on the new pricing

The plan names and prices, which plan carries the limited sweep, whether Free
keeps any free checks, and where the studio sits in the lineup. Sections A
and D are written to take those as data: nothing above depends on a number.
