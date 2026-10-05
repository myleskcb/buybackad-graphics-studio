# The SaaS side, measured: plans, costs, the market (2026-10-05)

The owner: "make sure the saas side of things make sense with current model
and offerings, and is worth the cost and make us enough, use market research."

Method: every plan number was read out of the code that enforces it
(`netlify/functions/api.mjs`), the code that shows it (`app.js`, `index.html`,
`about.html`, `terms.html`, `ads/*.html`) and the docs; the 311 offered cards
were counted from `assets/showcase/index.json` with the studio's own live
predicate; prices come from the sources listed at the end. Google's own
pricing page and Netlify's and Canva's sites were unreachable from this
container, so those figures are from third-party write-ups and are marked;
the owner can confirm each in a minute from a browser.

## 1. The offer, and whether the SaaS layer tells the truth about it

What the product offers on 2026-10-05, and what each plan gets:

| | Free | Pro, $15 a month |
|---|---|---|
| Downloads | 3 a week | 100 a month |
| Size | 1080 px short side | up to 2160 px |
| Watermark | BUYBACK.AD | none |
| Designs | every Phones card + top 3 per other category: **85 of 311** (27%) | all 311 |
| Six sizes, brand kit, ZIP towns, colour sets, builder | yes | yes |
| Video from the studio (10 s, with its photo) | yes, counts as one download, watermarked | yes, counts as one |
| Phone video maker (`/motion`) | free, no account, no watermark, not counted | same |
| AI backgrounds | 10 a day | 40 a day |
| QR code layer | no | yes |
| Community gallery posts | 5 a day | 5 a day |

The two `PLANS` tables (browser and function) agree with each other and with
every pricing surface. Found and fixed in this session:

1. **The FAQ said "Video ads don't count."** A video from the studio goes
   through `gateExport` and `recordExport` like an image, so it is one
   download (with its photo). Only the phone video maker's videos are
   uncounted. The FAQ, the ld-faq JSON-LD (rebuilt by
   `scripts/build_seo_pages.mjs`), `about.html` and `terms.html` now say so.
2. **The README described a backend that is not deployed**: a Cloudflare
   Worker with a KV namespace, `backend/worker.js`, "20 templates / all 50+
   templates". The backend is the Netlify Function; the README now documents
   it, every env var, and what each AI cap costs.
3. **A paying customer could be told "You are now on the Free plan."** Stripe
   sends the browser back to `?checkout=success` and the plan flips when the
   webhook arrives, which is often later. `handleCheckoutReturn` now asks
   `/me` again for up to twelve seconds, and if the plan still reads Free
   the modal says "Payment received, Pro is switching on" instead.
4. **The landing promises partner and creator discounts** ("Your members get
   a discount and you get a share of every subscription") and the checkout
   had no way to give one. Checkout now accepts Stripe promotion codes; a
   code made in Stripe → Coupons works with no deploy.

Still open, carried into OPEN-ITEMS §AF:

5. **The size cap and the watermark are applied in the browser.** The
   function counts the download and answers `{maxPx, watermark}`; the
   browser obeys. Anyone with devtools gets Pro output on Free while the
   count still runs (the 2026-09-22 audit, item 8). The count is the hard
   limit; the watermark is a nudge.
6. **Stripe is still not switched on**, so none of the above has taken a
   dollar. Until `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET`, `PRICE_PRO` and
   `SITE_URL` are set, Go Pro says "Pro checkout is not open yet".

## 2. Is it worth the cost? The unit economics

**What a Pro subscription nets.** $15.00 less Stripe's 2.9% + $0.30 ($0.74),
less Stripe Billing's 0.7% on recurring volume where it applies ($0.11):
**about $14.16 a month**.

**What a customer can cost.** Everything in the product is free to serve
except one thing: an AI background is one call to Gemini 3.1 Flash Lite
Image (the function's default) at about **$0.034 an image** at 1K, or to
Seedream v4 on fal at **$0.03** when Gemini fails. Image output is not in
Gemini's free tier. Each download, sign-in and AI call is also one function
invocation on Netlify's credit meter.

The daily caps are the whole cost story. At the function's defaults, over a
30-day month:

| cap (default) | images a month, max | cost a month, max | against |
|---|---|---|---|
| Free account, `RL_USER_DAILY` 10 | 300 | **$10.20** | $0 revenue |
| Pro account, `RL_PRO_DAILY` 40 | 1,200 | **$40.80** | $14.16 net |
| Whole site, `RL_GLOBAL_DAILY` 400 | 12,000 | **$408** | the month's MRR |

So today a Pro customer who uses the feature as the cap allows loses money
on every month, and a hundred free accounts that find the button can spend
more than a hundred Pro subscribers bring in. Nobody is at the cap today
(Stripe is off; AI needs a sign-in), but the exposure is live the day the
site gets traffic. For scale: Adobe Express sells 250 Firefly credits a month
inside a $9.99 plan, and PosterMyWall's free plan gives 5 AI images; our free
plan allows 300 a month.

**Recommended caps** (one Netlify command, no deploy; the function reads the
env on every call):

```
netlify env:set RL_USER_DAILY 2
netlify env:set RL_PRO_DAILY 8
netlify env:set RL_GLOBAL_DAILY 120
```

| cap (recommended) | images a month, max | cost a month, max |
|---|---|---|
| Free, 2 a day | 60 | $2.04 |
| Pro, 8 a day | 240 | $8.16 (58% of net, worst case) |
| Site, 120 a day | 3,600 | $122 |

With those, no plan can lose money and the site's worst month of AI spend
is bounded under the price of nine subscriptions. The better product answer
is a monthly allowance that lines up with the download period ("60 AI
backgrounds a month" is a line on the Pro card; "2 a day" is not), which is
a small code change in `api.mjs`: OPEN-ITEMS §AF 1.

**Fixed costs.** Netlify's Free plan is 300 credits a month under the
credit system introduced in 2025; third-party write-ups put bandwidth at
10 credits a GB and a deploy at 15 credits, and function invocations are
metered too (rates to confirm in the dashboard). A first visit here is
about 2 to 3 MB (app.js is 423 KB gzipped; the landing's thumbnails are
~43 KB each), so the free plan carries on the order of 10,000 first visits a
month before it stops serving; the next plans are about $9 (Personal,
1,000 credits) and $20 a seat (Pro, 3,000). One and a half Pro subscriptions
cover Netlify Pro. Stripe and Blobs have no monthly fee.

## 3. Is $15 the right number? The market

Design tools a reseller would compare us with, 2026 prices (third-party where
the vendor's page was unreachable):

| tool | monthly | annual | free tier | source |
|---|---|---|---|---|
| **Graphics Studio** | **$15** | **none** | 3 downloads a week, 1080, watermark | this repo |
| Canva Pro | ~$18 | ~$180/yr (≈$15/mo); one write-up says $144 | unlimited downloads, no watermark on free templates | third party |
| Kittl Pro | $15 | $120/yr ($10/mo) | personal use only | third party |
| Placeit | $14.95 | $89.69/yr ($7.47/mo) | — | third party |
| PosterMyWall Premium | $13 | — | social sizes without watermark; 5 AI images | Capterra, PosterMyWall help |
| VistaCreate Pro | $10 | $120/yr | 1 brand kit | 2026-09-22 audit |
| Adobe Express Premium | $9.99 | — | free plan; Premium has 250 Firefly credits | Adobe help, Capterra |

Reading:

- **$15 a month is the top of the range for a single-niche tool**, level with
  Canva Pro's annual rate and Kittl's monthly, half again Adobe Express. It
  holds because of what the general tools do not do: copy written for eight
  buyback markets, a number that stays legible at thumbnail size, towns from
  a ZIP, and a gate that measures every ad. The landing's own line, "One
  sale from one ad can pay for months of Pro", is the right frame: a
  reseller's margin on one phone is $50 to $150.
- **Every comparable tool sells an annual plan at about a third off, and we
  have none.** Annual is where the cash and the retention are (Kittl $120,
  VistaCreate $120, Placeit $89.69, Canva ~$180). Recommended: keep $15
  monthly, add **$120 a year** ($10 a month). It is a second Stripe price,
  a `PRICE_PRO_YEAR` env var, and a second button in `buildPlansGrid`.
- **The free tier is stricter than Canva's** (3 a week with a watermark
  against unlimited, no watermark). That is the conversion lever and it is
  right for a tool whose output is posted daily; the risk is only that
  Canva free is "good enough" for a reseller who can type a phone number,
  and the answer to that is the niche copy, not the price.
- **The phone video maker gives the strongest asset away**: fourteen styles,
  voices, three languages, no account, no watermark, not counted. As a lead
  magnet into the studio that is defensible; as a product it is unpriced.
  The owner's call (§AF 4): leave it, or ask for the free account and count
  it like the studio's videos.

## 4. Does it make enough? Scenarios

Benchmarks: the 2026 ChartMogul / ProductLed survey of 200 freemium products
puts the median free-to-paid conversion at 8%, with a quarter of products
under 2.5%; First Page Sage's 80-client average is 3.7%. Self-serve niche
tools sit in the 3 to 6% band.

The addressable base is harder to count. IBISWorld counts 1,447 cell phone
repair businesses and 3,855 pawn shops in the US (2025), both shrinking a
point a year; the used-phone market was $8.67B in 2023 heading to $26.67B
by 2032, and ecoATM alone took in 7.5M devices in 2025. The people this tool
is for, the ones posting "WE BUY" on Marketplace, OfferUp and Craigslist
every day, are mostly not in any industry count; the owner's own iPhones LA
network is the best proxy for how many there are and how to reach them.

With the recommended caps, Netlify Pro, Stripe's cut, and typical use (a
Pro account 15 AI images a month, a free account 1):

| free accounts | conversion | Pro subs | MRR | net after Stripe | costs | margin a month |
|---|---|---|---|---|---|---|
| 300 | 4% | 12 | $180 | $170 | ~$36 | ~$134 |
| 1,000 | 4% | 40 | $600 | $566 | ~$54 | ~$512 |
| 3,000 | 5% | 150 | $2,250 | $2,124 | ~$200 | ~$1,920 |
| 10,000 | 5% | 500 | $7,500 | $7,080 | ~$620 | ~$6,460 |

The same 1,000 free accounts at today's caps, if one in ten uses the AI
button to its limit: about $1,020 a month of Gemini against $566 of net
revenue. That is the one way this product loses money, and it is an env var.

What "enough" is, is the owner's number; what the table says is that at
$15 and niche conversion rates this is a few hundred to a few thousand
dollars a month until the free base is in the tens of thousands. The levers
that move it, in order: switch Stripe on; annual pricing; the partner
channel the landing already promises (promotion codes now work); and the
BUSINESSES tile (team logins, designs in their brand, the ad maker inside
their app), which is a $49 to $99 tier when there is a buyer for it.

## 5. Decisions for the owner

1. Set the three AI caps now (the commands above). Then, when wanted, the
   monthly allowance in code.
2. Add the annual price.
3. Switch Stripe on with test keys and walk the loop once: checkout, the
   webhook flipping the plan, Manage billing, cancel.
4. Decide what the video maker is: free lead magnet, or counted.
5. Leave the browser-side watermark as is, knowing it is a nudge, or move
   the watermark and the downscale to the function (a bigger change: the
   image would have to go up to the function and come back).

## Sources

Model and hosting prices: [Nano Banana 2 Lite / Gemini 3.1 Flash Lite
Image](https://openrouter.ai/google/gemini-3.1-flash-lite-image), [Gemini
API pricing write-up, Sep 2026](https://developer.puter.com/tutorials/gemini-api-pricing/),
[Gemini 3.1 Flash Image price guide](https://www.aifreeapi.com/en/posts/gemini-flash-image-generation-pricing),
[Gemini free tier and image output](https://pecollective.com/tools/gemini-free-tier-guide/),
[fal Seedream v4](https://fal.ai/models/fal-ai/bytedance/seedream/v4/text-to-image/llms.txt),
[Netlify pricing 2026](https://kuberns.com/blogs/netlify-pricing/),
[Netlify free tier limits 2026](https://gautamkhorana.com/blog/netlify-free-tier-limits-2026/),
[Netlify Blobs pricing thread](https://answers.netlify.com/t/blobs-pricing-and-limits/119907),
[Stripe fees 2026](https://flexprice.io/blog/stripe-pricing-breakdown-2026).
Competitors: [Canva pricing 2026](https://www.stylefactoryproductions.com/?p=11163),
[Kittl pricing](https://www.toolsurf.com/kittl-pricing-2026-plans-features-best-deals-compared/),
[Placeit pricing](https://www.capterra.com/p/228818/Placeit/pricing/),
[PosterMyWall pricing](https://capterra.com/p/189429/PosterMyWall/pricing/),
[PosterMyWall free downloads](https://support.postermywall.com/hc/en-us/articles/360018276771),
[Adobe Express Premium](https://helpx.adobe.com/lv/express/adobe-express-subscription/subscription-options/premium.html).
Market: [IBISWorld, cell phone repair](https://www.ibisworld.com/united-states/number-of-businesses/cell-phone-repair/5802/),
[IBISWorld, pawn shops](https://www.ibisworld.com/united-states/number-of-businesses/pawn-shops/4741/),
[used phones, a $9B industry](https://www.inkl.com/news/used-phones-are-a-9-billion-industry-nine-platforms-are-cashing-in),
[freemium conversion benchmarks](https://mewayz.com/cs/blog/free-tier-conversion-rates-across-saas-what-the-data-actually-shows),
[First Page Sage conversion rates](https://www.saffronedge.com/blog/saas-conversion-rate/).
