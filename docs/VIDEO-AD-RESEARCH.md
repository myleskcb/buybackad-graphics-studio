# Video ads — what grabs attention, keeps it, and converts

Field research, 2026-09-26. The owner's question:

> Study competitors, good "we buy" ads that have videos, and good commercials.
> What grabs attention, keeps it, and converts to paying customers in
> short-form marketplace ads people scroll through quickly?

This is the input for the **video ad engine, which does not exist yet**. On this
branch `app.js`, `index.html` and `phonegfx-studio.html` contain no `video`,
`MediaRecorder`, `captureStream` or WebM code. The last section of this file is
the spec that engine should be built from.

---

## How far to trust this file

Four research passes ran in parallel:

| pass | covered |
|---|---|
| platforms | Meta / Facebook IQ, TikTok for Business + Creative Center, Google / YouTube ABCD, platform ad policies |
| category | 23 "we buy / sell to us" brands and formats; 16 national ads had a usable shot description |
| commercials | System1, Ehrenberg-Bass, Nielsen, IPA / Binet & Field, Thinkbox, DRTV practitioners, subtitle standards, flash regulation, 12 famous performance ads |
| marketplaces | posting surfaces, video support, formats, policy, browser-side rendering |

Limits, stated plainly:

- **No source page was read in full.** The container's egress proxy blocked the
  page fetcher on every domain tried (facebook.com, tiktok.com, google, w3.org,
  ispot.tv, effie.org, ftc.gov, system1group.com, wikipedia, …). Every figure
  below was read from a search-engine extract of the URL cited. The shared
  search budget (200 calls) then ran out.
- Confidence labels: **P** = primary source (the platform, regulator, research
  firm or journal) read via extract. **S** = reputable secondary coverage.
  **L** = blog, practitioner opinion, or a company's self-reported result.
  The one exception is the marketplace pass, which could open GitHub-hosted
  sources (browser-engine code, MDN's data, policy snapshots) and marks those
  **(O)**. **Open the page before a number from this file becomes a
  DESIGN-LAW rule.**
- Platform-published lifts are observational comparisons of top ads, made by a
  party that sells ads. TikTok's +152% / +280% / +312% figures in particular
  are almost certainly confounded. Use them for **direction, never size.**
  Google's 2026 conversion deltas (+3% to +12%) are the believable scale.
- Not covered: Amplified Intelligence (active attention by platform),
  Kantar / Ipsos on length and captions, Meta Ad Library and TikTok Creative
  Center top ads (fetch blocked), Pawn Stars, JM Bullion / APMEX, local gold TV
  spots, SellCell, Decluttr TV, uBreakiFix.
- **Nothing here is measured against our own output yet** — there is no video
  output. Section 9 lists the rule candidates and how each would be checked.

---

## 1. The answer on one screen

**GRAB — the ad is judged in under half a second, so frame 0 must already be the
whole ad.** People recall feed content after 0.25 s; two-thirds of mobile ads
are cognitively recognised by 0.4 s. The top-converting short ads put the offer,
the product and the call to action in the opening frame, and put the brand in
early. Motion in the first half-second earns the stop; it must not delay the
offer.

**KEEP — people who survive the first 3 s mostly stay; lose them with dull, not
with length.** Burn every word into the picture (most feed video plays muted),
change the scene every 1.5–3 s, and never faster than the words can be read.
A real person, place or hand is the strongest antidote to "dull", which is the
default failure of all advertising.

**CONVERT — tell them exactly what to do, keep the phone number on screen, and
make the first step feel free.** A written CTA, visible offer text and a
persistent phone bar all measure positive. Every big buyer in this category asks
you to *get an offer*, not to *sell*: free, no obligation, good for 7 days.

**TRUST — in this category the scam signals are documented, and "UP TO $X" is
the biggest one.** Regulators have acted on inflated headline prices, hidden
fees, pressure to act fast, and no quote before the transaction. A local buyer's
real edge over the national brands is that they *can* quote a specific price for
a specific model — as long as it is qualified on the same frame and not
"up to".

**WHERE — Facebook Marketplace may not allow these posts at all.** Its help
text (search excerpt) says "in search of" posts and services are not allowed;
a "we buy iPhones" post is arguably both. Verify by hand. Until then, build the
video for Groups, feed, Reels and Stories, where it autoplays, and treat
Marketplace as a still-image surface — its grid shows thumbnails, not video.

**On "more colours and effects":** the evidence supports colour as hierarchy
(more palettes, each with one accent reserved for price and CTA), motion
concentrated in the first 0–2 s, and product-hero effects that carry
information. It gives **no** support for decorative effects — glitch, particles,
lens flares, money rain — and flashing is explicitly prohibited by Meta, Google,
TikTok, WCAG and the UK ASA. See section 6.

---

## 2. GRAB — stopping the scroll

| finding | evidence | source | conf |
|---|---|---|---|
| Feed content is recalled after a quarter of a second | Fors Marsh tests for Facebook: recall at a statistically significant rate after 0.25 s. Mobile feed scrolls 41% faster than desktop (c. 2016) | facebook.com/business/news/insights/capturing-attention-feed-video-creative | P |
| Ads are recognised by 0.4 s | MMA / ARF / Neurons (2019): brain needs ~400 ms; >67% of ads "already seen and cognitively recognized at 0.4 seconds"; emotional response under 0.7 s | mmaglobal.com/news/mobile-marketing-association-reveal-brands-need-first-second-strategy | P |
| Value is front-loaded | Facebook + Nielsen (2016): up to 47% of a video campaign's value in the first 3 s, 74% in the first 10 s (definition of "value" not visible in extract) | facebook.com/business/news/insights/making-an-impact-measuring-the-value-of-facebook-video | P |
| Key message first | TikTok: >63% of highest-CTR videos show the key message or product in the first 3 s; 90% of ad-recall impact in the first 6 s | ads.tiktok.com/business/en-US/blog/creative-best-practices-top-performing-ads | P |
| CTA in the opening frame | TikTok: +44% conversion vs a later CTA; CTA display cards +45% recall | ads.tiktok.com/business/creativecenter/quicktok/online/Power_Creative_Elements/pc/en | P (direction) |
| Brand in the first 2 s | System1 × TikTok, 887 short-form ads, 92k viewers, 8 markets: brand-awareness lift when the asset appeared in the first 2 s — sonic +191%, logo in context +182%, recurring character +57% | system1group.com/creative-effectiveness-tiktok | P |
| Louder creative raises the branding burden | Romaniuk (Ehrenberg-Bass): "The more attention-grabbing the creative, the harder the branding has to work" | marketingscience.info/tips-for-using-distinctive-brand-assets-in-digital-marketing/ | P |
| Motion and cuts early | YouTube ABCD for Shorts: tight framing, 2+ shots in the first 5 s, open on the person if there is one | blog.google/products/ads-commerce/youtube-shorts-ads-select-lineups-abcds/ | P |
| A still is not a video ad | TikTok ad policy: static images may not exceed 50% of the video; 5 s minimum; audio required | ads.tiktok.com/help/article/tiktok-ads-policy-ad-format-and-functionality | P |
| Colour / saturation and attention | **No platform or researcher evidence found either way** | — | — |

What it means for us: **frame 0 is a finished ad.** No fade in from black, no
blank-to-revealed text, no logo sting before the offer. Animate things from
*visible* to *emphasised*, never from *absent* to *visible*.

---

## 3. KEEP — holding attention

| finding | evidence | source | conf |
|---|---|---|---|
| Survivors stay | Of people who watch 3 s of a Facebook video, 65% watch ≥10 s and 45% watch 30 s (2016) | facebook.com/business/news/updated-features-for-video-ads | P |
| Feed video is watched muted | 41% of Facebook video ads were "basically meaningless without sound"; captions raised view time 12% (2016) | same | P |
| …but full-screen surfaces are sound-on | >75% of Instagram Reels views are sound-on; TikTok requires audio; 88% of TikTok users say sound is vital | facebook.com/business/ads/facebook-instagram-reels-ads ; TikTok × Kantar sound study | P |
| Varied scenes beat one shot | TikTok: variety of scenes +38% conversion vs one continuous shot (Dec 2021) | ads.tiktok.com/business/en-US/blog/creative-that-drives-conversions | P (direction) |
| …but fast cutting costs the claim | MacLachlan & Logan (JAR 1993): faster cutting aided recall of peripheral elements, central claims less well remembered | tandfonline.com/doi/abs/10.1080/00218499.1993.12466882 | S (summary only) |
| "Top ads cut every 2–3 s" | blog-only | creatify.ai | **unverified** |
| Dull is the default failure | System1 (2024): 52% of UK and 47% of US TV-ad responses are Neutral; humour is the most consistent antidote | system1group.com/the-extraordinary-cost-of-dull | P |
| Character, place, incident | System1 *Lemon* / *Look Out*: "right-brain" features (characters, a sense of place, an unfolding incident) raise emotional response; flatness and obtrusive on-screen text lower it | system1group.com/lemon ; system1group.com/blog/achtung-3-keys | P |
| Six seconds is enough to land a message | Google, 122 bumper campaigns: 90% drove ad-recall lift (avg +30%) | business.google.com/…/youtube-bumper-ads-making-big-impact-small-stories/ | P |
| Casual beats over-polished (on TikTok) | TikTok: 71% prefer brand posts that don't feel too polished; lo-fi ads +33% consideration. But 720p+ gave +312% conversion — casual ≠ low resolution | ads.tiktok.com (exact URL uncertain) | P (direction) |

**The tension, named.** System1 says obtrusive on-screen text and flat graphics
dampen emotional response. Direct-response practice says text and the phone
number stay on screen throughout. For a pure activation ad like ours, the DR
practice wins on the text, and the emotional layer comes from a **real photo**:
the buyer, their counter, a hand holding the cash. The template already has the
slot for this (`role:'photo'` / cutouts); the engine should make it a first-class
"proof" beat.

---

## 4. CONVERT — turning a viewer into a call

| finding | evidence | source | conf |
|---|---|---|---|
| Say what to do, in text | TikTok: a text CTA +152% conversion vs none; on-screen offer text +80%; text in the first 7 s +43% | ads.tiktok.com/business/en-US/blog/creative-that-drives-conversions | P (direction) |
| The believable sizes | Google, US, July 2026: human voice +12% conversions; brand in first 5 s +4%; supers (text overlays) +3%; sound in Shorts >+20% | support.google.com/google-ads/answer/18061165 ; /16041697 | P |
| Vertical, sound-on video beats images on Reels | Meta: 9:16 sound-on video respecting safe zones had 34.5% lower cost per result than image ads; won a meta-analysis of 15 split tests | facebook.com/business/campaign-guidance-navigator/try-vertical-video-with-audio-on-reels-for-CTR | P |
| Supply several orientations | Google: 9:16 + 1:1 + 16:9 in Performance Max gave 20% more YouTube conversions than 16:9 alone | Google Ads video best-practice pages | P |
| Creative is the biggest lever | Nielsen (2017, ~500 CPG campaigns): creative 47% of sales contribution, reach 22%, brand 15%, targeting 9% | nielsen.com/insights/2017/when-it-comes-to-advertising-effectiveness-what-is-key/ | P |
| Phone number stays up | DRTV practice: phone bar nearly the whole spot, up within 5 s, read aloud at the end "often twice"; end card never under 10 s of a 60 s spot | dmwdirect.com ; arm-direct.co.uk ; entrepreneur.com | L (craft consensus) |
| "Eye candy dilutes the offer" | DRTV practice: no fancy wipes, dissolving text or graphics | nationalmediaconnection.com/ten-drtv-tips-next-level/ | L |
| Low-commitment first step | Category: every national buyer sells *getting an offer* — "free", "no obligation", "good for a week, no strings" (CarMax) | iSpot descriptions, section 5 | S |
| Name the steps | We Buy Any Car US: valuation → appointment → walk out with a check | ispot.tv/ad/we3u/we-buy-any-car-the-gimmicks-stop-with-our-ads | S |
| Reveal lands with the brand | Thinkbox: land a reveal a few seconds before end branding or *with* the brand, not before it — attention dips after "conceptual closure"; brand held ≥3 s: +3% memory | thinkbox.tv/research/thinkbox-research/creative-drivers-of-effectiveness | P |

---

## 5. The category — what "we buy" competitors actually run

16 national ads had a usable description (iSpot.tv descriptions, press, Effie
entries). Nearly all are 30 s TV spots in 16:9, so this is evidence about
*persuasion*, not about vertical pacing.

| brand | hook | how value is expressed | trust device | distinctive asset |
|---|---|---|---|---|
| webuyanycar UK | ordinary people dancing after selling | "free, no-obligation valuation in under 30 seconds" | Trustpilot "Excellent", 150k+ reviews | jingle + one-tone sonic logo, on TV since 2009 |
| We Buy Any Car US | "the gimmicks stop with our ads" | free valuation, cash "within half an hour" | anti-hype tone, 3 named steps, physical centres | "Get In. Get Out. Get Paid." |
| Carvana | the car is already on a Carvana hauler | "real offer in seconds", driveway pickup | the hauler as visible proof | vending machine, haulers |
| CarMax Instant Offer | a For Sale sign going nowhere | "real offer in under two minutes, good for a week, no strings" | 7-day validity, a lot you can visit | "Instant Offer" name, years of spots |
| Vroom | dealership becomes a pushy game show | "offer in minutes", "for more money" | the dealer is the villain | red buzzer |
| KBB Instant Cash Offer | a runaway couch; a blurry trade-in | "no-obligation offer" | heritage brand | blur → focus |
| Gazelle | dad gave away an iPhone he could have sold | "will pay you money for it, old or broken" | pays shipping | — |
| Back Market | a drawer of old phones flashing "SHAKE ME" | shake to see trade-in value | named marketplace | shake mechanic |
| Apple / Samsung trade-in | product lifestyle | "**up to** $125 / $400 / $600" — store credit | brand | — |
| Best Buy Buy Back | Ozzy vs Bieber, Super Bowl 2011 | guaranteed future buyback | retailer | celebrity — later called "a costly dud" |
| Cash4Gold | MC Hammer and Ed McMahon one-up each other | "hard cash for anything gold" | celebrities | traffic ~10× — then reputation collapse |
| EZPAWN / Value Pawn | "short on cash, long on clutter?" | "surprised how much your stuff is worth" | physical stores | — |
| HomeVestors | pratfalls; a quiet testimonial | "won't reduce or cancel firm cash offers" | 60,000+ homeowners, 29+ years on TV | "We Buy Ugly Houses", yellow, Ug |
| Opendoor | a real family sells live during Super Bowl halftime | all-cash offer inside 13 minutes | live and unedited | 2025 US Effie finalist |
| Offerpad | a couple picks "Express" | cash offer in 24 h + free move | NASCAR drivers | — |

Formats that are not national TV but matter to our users:

- **Card-buying creators** ("buying a $10K Pokémon collection") — the negotiation
  and the reveal *are* the video. Trust depends on which comps are used.
- **PSA Offers** — a cash offer pops up at the grade reveal.
- **Local "we buy iPhones" TikTok** — cash on the spot, named cities, DM/phone CTA.

Counted across the 16:

| pattern | count |
|---|---|
| speed claim ("<30 s", "2 minutes", "24 h", "on the spot") | 11 / 16 |
| comedy or a surreal metaphor | 9 / 16 |
| celebrity or influencer | 8 / 16 |
| offer certainty / no-obligation wording | 7 / 16 |
| the alternative is the villain (dealer, lowballer, showings) | 7 / 16 |
| real customers | 4 / 16 |
| long-lived distinctive asset | 4 / 16 |
| cash physically shown in the payoff | 4 / 16 |
| **a specific dollar figure** | **2 / 16 — both "up to", both store credit** |
| CTA is a URL / app | 14 / 16 — only HomeVestors says "call" |

**The finding that matters most.** National buyers almost never show a price,
because they cannot: the price depends on the item. They sell speed and
certainty of the *offer* instead. A local buyer quoting one model can do what
the nationals cannot — show a real number — and that is a genuine competitive
edge, **provided the number is specific and qualified, not "up to"**.

### What regulators have already called deceptive in this category

| signal | case | source |
|---|---|---|
| headline price vs price paid | UK OFT: ~96% of webuyanycar sellers got less than the online valuation; firm agreed to state the price follows inspection | gov.uk/cma-cases/we-buy-any-car-unfair-practices-by-trader-offering-vehicle-buying-service |
| "up to" read as typical | FTC (2012): 48.2% of consumers shown "up to 47%" expected about 47%; FTC expects "50 percent or more" of users to achieve an "up to" claim | ftc.gov/news-events/news/press-releases/2012/06/ftc-report-many-consumers-believe-claims-promise-maximum-results |
| hidden fees | ASA censured webuyanycar (2010) for an unstated admin fee; a gold refiner for a buried return fee and "spurious" scrap prices | thedrum.com ; gold-traders.co.uk |
| no quote before the deal | FTC testimony (2010): cash-for-gold marketers "fail to provide… a quote… before any transaction"; Consumer Reports found mail-in buyers paid 11–29% of the day's gold value vs 35–70% at pawn shops | ftc.gov ; consumerreports.org |
| pressure to act fast | FTC consumer alert on gold scams (2025) | consumer.ftc.gov/consumer-alerts/2025/07/… |
| targeting distress | ProPublica on HomeVestors franchisees geofencing hospitals | propublica.org/article/ugly-truth-behind-we-buy-ugly-houses |
| test strips | BBB "F" for a buyer after 246 complaints about unpaid "up to $40/box" promises; HHS OIG restrictions on Medicare-paid strips | wmar2news.com ; oig.hhs.gov/fraud/consumer-alerts/fraud-alert-people-diabetes/ |

### Measured against our own library

`scripts/copy_audit.mjs` (added with this file) loads the real library and
counts. On 2026-09-26: **48 of 243 templates carry "up to" pricing by default**
(gold 12, cars 11, phones 9, coins 4, sports 4, strips 3, pokemon 3, silver 2),
coming from the category decks — phones `UP TO $1,100 PAID TODAY`, cars
`UP TO $15,000 CASH`, gold `PAYING UP TO 95% OF SPOT`. **4 phone templates**
advertise iCloud-locked phones and **2** say "blacklisted" — which reads as
"no questions asked" in a category where critics already accuse phone buyers of
fencing stolen goods (that reading is our inference, not a sourced finding).

This file names the defect; it does not repaint the copy. Changing default copy
is an owner decision (DESIGN-LAW rule 24 governs what a headline must say).

---

## 6. Colours and effects — what the evidence supports

The owner asked for "more colours and effects" that look "impressive and clean".
The evidence splits cleanly.

**Supported:**

- **Colour as hierarchy.** One accent reserved for the price and the CTA; more
  *palettes* rather than more colours per ad. This is already house law
  (rules 8, 14, 32, 40, 41) and nothing found contradicts it.
- **Colour + shape as an owned asset.** Ehrenberg-Bass (2026 benchmark): shape
  assets strongest (40% fame, 71% uniqueness), colour alone weakest. A
  per-business badge in a fixed colour and shape, in every export, builds
  recognition (tandfonline.com/doi/full/10.1080/02650487.2026.2637295, P).
- **Motion in the first 0–2 s**, to earn the stop without hiding the offer.
- **Clean reads as credible.** Fogg et al. (2003, 2,684 people): "design look"
  appeared in 46.1% of credibility comments, 54.6% for finance sites
  (credibility.stanford.edu, P). Polish is a trust feature, not decoration.

**Prohibited or unsupported:**

| effect | status | source |
|---|---|---|
| flashing, strobing, full-frame inversions | **prohibited** — Meta: "must not use overly disruptive tactics, such as flashing screens"; Google: "strobing, flashing backgrounds… not allowed"; TikTok: avoid flashing lights | transparency.meta.com/policies/ad-standards/ ; support.google.com/adspolicy/answer/176108 ; TikTok ad-format policy |
| >3 flashes in any 1 s | **regulated** — WCAG 2.3.1; UK ASA CAP 4.7 / BCAP 4.6 expect a Harding test; Ofcom guidance | w3c.github.io/wcag21/understanding/three-flashes-or-below-threshold.html ; asa.org.uk/news/flashing-images-in-advertising.html |
| rapid cuts between very different frames; moving high-contrast stripes | **regulated** — counted as flash / pattern risk by the ASA | same |
| glitch (fast luminance or colour inversion) | the effect most likely to break the 3-per-second rule | inference from the above |
| fake UI — play buttons, "swipe up", incoming-call or text-message screens | **prohibited** by TikTok; Google says baked-in UI "confuses viewers" | ads.tiktok.com/help/article/tiktok-ads-policy-ad-format-and-functionality |
| countdown timers, "TODAY ONLY" | FTC names pressure to act fast as a gold-scam signal | consumer.ftc.gov |
| particles / dissolve on the price or phone | DR practitioners: eye candy dilutes the offer | nationalmediaconnection.com (L) |
| light sweeps, counters, parallax, seamless loops | **no outcome evidence found either way** — craft convention only | — |
| rainbow gradients across type | already banned (rule 5); the owner's own references put them in "mid" | DESIGN-LAW rule 13 |

So "impressive and clean" is built from a small set of effects that each *carry
information* — the product arriving, the price landing, the steps appearing, the
number staying put — executed well. Section 8 lists them.

---

## 7. Marketplaces and formats

This pass had the least access: help centres were blocked, and only
GitHub-hosted content loaded. **(O)** = source opened — browser-engine source,
MDN's GitHub sources, library docs, and Open Terms Archive's GitHub snapshots of
Meta's and TikTok's policy pages (Ad Standards as of 2026-09-10, Community
Standards and TikTok Community Guidelines as of 2026-09-24). **(S)** = search
excerpt only.

### 7.1 Where the video actually plays

| surface | video? | how it is first seen | formats | source |
|---|---|---|---|---|
| FB Marketplace listing | yes, "only available in some countries and for some sellers"; ~60 s / 600 MB per third parties | **as a still thumbnail** — desktop grid shows a video icon; no evidence the grid autoplays; plays once the listing is opened | not found | facebook.com/help/536155775168076 (S); socialmediatoday.com/news/facebook-adds-video-display-elements-to-marketplace-listings/647150/ (S) |
| FB feed and Groups | yes | autoplays in feed; sound default not verified since 2017 | upload list includes mp4, mov, mkv, gif — **not WebM** | facebook.com/help/218673814818907 (S) |
| IG / FB Reels | yes, up to 3 min (IG, Jan 2025) | full screen, >75% sound-on | MP4/MOV, H.264 + AAC; WebM not supported per third parties | threads.com/@mosseri (S) |
| IG / FB Stories | yes, 60 s per segment | full screen | as Reels | facebook.com/business/help/201503794673956 (S) |
| TikTok | yes | full screen, sound-on | web uploader "MP4 or WebM" per third parties; ads mp4/mov | ads.tiktok.com/help/article/video-ads-specifications (S) |
| OfferUp, Nextdoor, Craigslist | **not found** — could not confirm video support or that Craigslist is image-only | — | — | blocked |

On every surface where the ad sits in a grid, **the first thing seen is a still**.
That is the strongest single argument for section 8.1.

### 7.2 Policy risk for "we buy X for cash" posts

**Facebook Marketplace is the riskiest surface for this category — verify by
hand before building for it.** The search excerpt of "Things that can't be
listed for sale on Facebook Marketplace" reads: *"'In search of' posts, lost and
found posts, jokes and news aren't allowed."* Services are also excluded
(facebook.com/help/130910837313345, S). A "WE BUY iPHONES" post is, on its face,
an in-search-of or service post. Commerce pages on currency
(`policies_center/commerce/documents_currency_and_financial_instruments`) and
medical products (`…/medical_and_healthcare_products`) exist and could not be
read — coins, bullion and test strips are unresolved.

This matters beyond video: the product is sold as making ads for Marketplace.
Until the commerce policy is read in full, design the video for **Groups, feed,
Reels and Stories first**, and treat Marketplace as a still-image surface.

Meta Community Standards (O):

- **Spam:** *"We may place restrictions on accounts that are acting at lower
  frequencies when other indicators of Spam (e.g., posting repetitive content)…
  are present."* Our users paste the same ad into many Groups.
- **Money flips:** prohibited commercial practices include *"'cash flip,' 'money
  flip'"* and *"get-rich-quick and giveaway schemes"*; enforcement covers
  *"Misleading or unreasonable pricing."*

Meta Advertising Standards, when a post is boosted (O):

- *"Videos… must not use overly disruptive tactics, such as flashing screens."*
- Ads must not *"assert or imply personal attributes… physical or mental health
  (including medical conditions), vulnerable financial status."* — so "Diabetic?
  Sell your strips" or "Behind on bills?" is rejected. **Measured: 0 of 243
  templates carry such phrasing** (`scripts/copy_audit.mjs`).
- There is **no text-percentage rule** in the current Ad Standards text; the
  nearest is *"Lower quality ads… may experience impacted performance."*

TikTok Community Guidelines (O):

- Disclosure is required when *"Promoting your own business, product, or
  service"*; undisclosed commercial content may get reduced visibility.
- *"Content is also ineligible for the FYF if it includes unoriginal or reused
  material without anything new."* Thousands of accounts posting the same
  template animation is exposed to this (our inference).

### 7.3 Safe zones and length

| | value | source |
|---|---|---|
| Meta Reels | keep text/logos out of top 14%, bottom 35%, 6% each side | facebook.com/business/help/980593475366490/ (P via extract) |
| Meta Stories | ~14% (250 px) top and bottom | same |
| YouTube Shorts | top 10%, bottom 25%, right 10% | Google (P via extract) |
| TikTok organic | top 130, bottom 484, left 44, right 140 px; the bottom grows with caption length | cadenus.io/resources/blog/tiktok-safe-zone/ (S) |
| TikTok ads | 5 s minimum, 60 s maximum, audio required | ads.tiktok.com/help/article/tiktok-ads-policy-ad-format-and-functionality (P via extract) |
| resolution | ≥720p (TikTok's +312% finding, direction only) | ads.tiktok.com (P via extract) |

**Combined safe box for one 1080×1920 master**, taking the strictest edge from
each surface: top 0.14 × 1920 = 269 px (Reels); bottom 0.35 × 1920 = 672 px, so
content ends at y = 1248 (Reels); left 0.06 × 1080 = 65 px (Reels); right
140 px, so content ends at x = 940 (TikTok organic, stricter than Shorts' 108).
**Key content lives in x 65–940, y 269–1248** — a 875 × 979 live area sitting
high in the frame. The phone number never goes in the bottom third.

### 7.4 Rendering in the browser

Support (O — MDN browser-compat-data and the engines' own source):

| | Chrome / Edge | Firefox | Safari / iOS |
|---|---|---|---|
| MediaRecorder | 47 | 25 | 14.1 / iOS 14 |
| records | WebM (vp8/vp9/av1/h264); MP4 since ~126, **defaults to vp9 + Opus — request `avc1` explicitly** | **WebM VP8 only** | MP4 (avc1 + AAC), fragmented; WebM enabled Dec 2024 (shipping version not verified) |
| WebCodecs `VideoEncoder` | 94 | 130 desktop, **not Android** | 16.4, incl. iOS |
| `AudioEncoder` | 94 | 130 | **26** |

Pitfalls (O):

- `requestAnimationFrame` pauses in background tabs and timers are throttled.
  MediaRecorder records in wall-clock time, so **switching tabs ruins the clip**.
  (The same failure DESIGN-LAW rule 38 recorded for CSS animations.)
- A Chromium comment says software encoding is smooth *"up and until HD
  resolution at 30fps"*; 1080×1920 is 2.25× that pixel rate.
- MediaRecorder WebM ships without duration metadata unless `start()` is called
  with no timeslice and `requestData()` is never called.
- `mp4-muxer` is deprecated in favour of **Mediabunny** (MPL-2.0), whose
  `CanvasSource.add(timestamp, duration)` gives deterministic frame timing.
- `ffmpeg.wasm` is experimental and slow, its fast build needs COOP/COEP
  isolation, and it bundles x264 (GPL) — a licensing decision, not a default.

**Recommended pipeline:**

1. Draw each frame as a **pure function of time** onto a canvas, and encode with
   WebCodecs through Mediabunny's `CanvasSource` at a constant 30 fps to H.264
   MP4 with fast start. It renders faster than real time and cannot be wrecked
   by a tab switch. Check `canEncode('avc')` first.
2. Fallback where WebCodecs H.264 is missing (Firefox Android): MediaRecorder,
   trying `video/mp4;codecs=avc1` → `webm;codecs=vp9` → `vp8`, no timeslice,
   and refuse to render while the tab is hidden.
3. WebM output bound for Facebook or Instagram needs conversion; label it so.
4. Always export the frame-0 still alongside.

### 7.5 Browsing behaviour

- *Onset* of motion captures attention better than continuous motion or motion
  stopping (Abrams & Christ 2003, pubmed.ncbi.nlm.nih.gov/12930472/, S). This
  supports **discrete onsets** — a stamp, a check-mark, a counter landing —
  over constant drift. No study on a marketplace grid was found.
- Eye-tracking on animated vs static banners is mixed: more and earlier
  attention in some studies, less in others
  (sciencedirect.com/science/article/abs/pii/S0747563211002470, S).
- How long a Marketplace tile stays on screen during a scroll: **not found.**

---

## 8. The spec for the video engine

### 8.1 The central decision: the first and last frame *are* the template

The library already holds 243 finished, audited still ads. The evidence says the
first frame must be a complete ad (0.25–0.4 s recognition, CTA-in-opening-frame
lift), and in every grid — Marketplace included — the video is first seen as a
still thumbnail. So:

- **Frame 0 renders pixel-identically to the static export.** Every rule in
  DESIGN-LAW is inherited for free, and the video can never open weaker than
  the still.
- **The last frame returns to the same composition** as the end card, so the
  clip loops seamlessly on autoplaying surfaces.
- Between them, the engine choreographs the template's **existing layer roles**
  (`headline` 88, `phone` 50, `info` 45, `cta` 43, `sub` 32, `badges`, cutouts,
  `photo`). No new authoring is required to get a video out of every template.

### 8.2 Beat sheet — 10 s master

| time | beat | layers |
|---|---|---|
| 0.0 s | **the finished ad**, still | all |
| 0.0–0.5 s | wake: cutout rises 3–5% with decelerate easing; background begins a slow push-in (≤5% over the clip) and parallax against the cutout; one light sweep across the product | cutout, photo |
| 0.5–3.5 s | **price scene**: price scales to hero, counter rolls up and lands with a small overshoot "stamp" by ~2.0 s, qualifier on the *same frame*, business badge in frame; holds ≥1.5 s after landing | price / headline, badges |
| 3.5–7.0 s | **how it works**: three steps or selling points, one at a time, ≤4 words each, each ≥1.2 s | info, sub |
| 7.0–10.0 s | **end card**: back to the full composition; phone number emphasised, CTA verb ("Call" / "Text"), name; still for ≥3 s | phone, cta |
| throughout | phone bar pinned in the same place inside the safe box | phone |

- **6 s cut:** finished ad + wake (0–0.5) → price scene (0.5–3) → end card (3–6).
  The GEICO "Unskippable" rule: the whole message is out before 5 s.
- **15 s cut:** add a **proof beat** (7.0–11.0 s) before a 4 s end card: the
  user's real photo (face, counter, storefront), years in business, or
  verification ("ID required · IMEI checked", "weighed in front of you").
  This is where System1's character / place / incident comes from.
- Optional 20–30 s TikTok cut later, with the caveat that TikTok's 21–34 s
  guidance is observational and confounded.

### 8.3 Timing rules

- Phone number visible **≥70% of runtime**, same position every frame, inside
  the safe box. The end card never shorter than 2 s (6 s cut) or 3 s (10–15 s).
- Text dwell per beat **≥ max(1.2 s, characters ÷ 15 + 0.5 s)**, never under
  0.85 s. Derivation: BBC subtitles 160–180 wpm (~0.33 s/word, 1.2 s for four
  words); Netflix ≤20 characters/s for adults, 17 for children, minimum 5/6 s
  per subtitle. 15 cps gives headroom because a scroller is not primed to read
  the way a subtitle viewer is. **If the user's copy cannot fit its beat, warn;
  never speed the text up.**
- Entrances 250–500 ms, `cubic-bezier(0.05, 0.7, 0.1, 1)` (Material 3
  emphasized-decelerate). Exits 150–250 ms, `cubic-bezier(0.3, 0, 0.8, 0.15)`.
  Text is still for most of its beat.
- Scene change every 1.5–3 s. **Never more than 3 hard cuts in any second.**
- Price lands by ~2 s with the brand in frame (Thinkbox).

**Contradiction to resolve by measuring, not by choosing:** TikTok reports a
+2.1× awareness lift for captions at 5–10 words per second, well above the
~3 words/s subtitle standard. For the price and phone number — which must be
*read and remembered* — use the subtitle standard.

### 8.4 Effect library — build these

| effect | what it carries | notes |
|---|---|---|
| product wake (rise + ease-out) | "this is what we buy" | 300–500 ms; the first motion. Motion *onset* is what captures attention (Abrams & Christ) — prefer discrete onsets over constant drift |
| single light sweep across the cutout | product quality (Apple hero shot) | one pass, low luminance change — never a flash |
| parallax photo ↔ cutout, slow push-in | depth; keeps the frame "dynamic" (TikTok's static cap) | ≤5% scale over the whole clip |
| price counter + overshoot stamp | the reveal — the beat card-buying and Opendoor videos are built on | lands with brand in frame; qualifier on the same frame |
| three-step process strip | the most portable device in the category (Photo → Price → Paid) | one icon at a time; uses the existing icon system (rule 17) |
| persistent phone bar | the DRTV phone bar | never animated off screen |
| brand badge (colour + shape) | an owned asset across every export | fixed per business |
| palette choice | "more colours", done as hierarchy | many palettes, one accent each |
| audio bed + optional recorded voice | Reels/TikTok are sound-on | royalty-free bed; a human voice measured +12% (Google), text-to-speech has no evidence. Required only for TikTok *ads*; organic posters can add sound in-app, which is also the native path. Safari has no AudioEncoder before 26 |

### 8.5 Effect library — ban or gate

- Flashes, strobes, full-frame inversions; any region flipping luminance more
  than 3 times in a second. **Gate export on an automatic flash check** (below).
- Glitch transitions; moving high-contrast stripes or checkerboards.
- Hard cuts faster than 3 per second.
- Particles, dissolves or scrambles on the price or phone number.
- Money rain / ambient cash confetti. (A cutout of the product the buyer pays
  for is not this — the library's cash cutouts are subject, not decoration.)
- Countdown timers, "TODAY ONLY", "LAST CHANCE".
- Fake UI: play buttons, "swipe up", call screens, chat bubbles, prize wheels.
- "UP TO" as a default; unqualified "#1" or "highest price guaranteed".

### 8.6 Output

- **H.264 MP4, constant 30 fps**, encoded through WebCodecs (section 7.4).
  WebM only as a labelled fallback — Facebook's upload list does not include it.
- Aspect presets from one timeline: **1080×1920** (Reels, Stories, TikTok),
  **1080×1350** (4:5 feed and Groups — the editor has no 4:5 format today; Flyer
  is 1080×1398), **1080×1080** (universal). ≥720p always.
- Every word burnt into the picture (feed plays muted). Audio optional in v1,
  required for a TikTok-ads preset.
- The frame-0 still exported alongside — identical to today's PNG.
- **Vary each export** (scene order, motion seed, accent within the palette) so
  reposts to many Groups are not byte-identical: Meta's spam rule names
  "posting repetitive content", TikTok's names "unoriginal or reused material".
- On TikTok export, remind the user to switch on commercial-content disclosure.
- Copy guardrails in the editor: warn on "up to" without a qualifier, on
  health or financial-status phrasing, and on money-flip wording.

---

## 9. Rule candidates

Each is stated so it can be checked in code once the engine exists. None is
added to DESIGN-LAW yet: a rule earns its number by being measured against real
output, and there is no output to measure.

| # | candidate | how it would be checked |
|---|---|---|
| V1 | Frame 0 is the finished ad | pixel diff between frame 0 and the static PNG export of the same template = 0 |
| V2 | The phone number is on screen ≥70% of runtime, inside the safe box | per-frame layer visibility + bounding box against x 65–940, y 269–1248 (9:16) |
| V3 | No text beat is shorter than it takes to read | timeline check: dwell ≥ max(1.2 s, chars ÷ 15 + 0.5 s) |
| V4 | No flash risk | per-frame relative-luminance map; fail if any region ⅓ × ⅓ of the frame has more than 3 opposing luminance transitions in any 1 s (a proportional scaling of W3C's 341×256 box at 1024×768; read WCAG 2.3.1 before encoding the exact thresholds) |
| V5 | A price is never shown without its qualifier on the same frame, and "up to" is never a default | copy + timeline check; `scripts/copy_audit.mjs` already measures the default copy |
| V6 | Every word is readable muted | render diff with text layers hidden (the phone-audit method): every beat must change when its text is removed |
| V7 | A render cannot be corrupted by the tab it runs in | frames are a pure function of t; render the same clip with the tab hidden and visible and compare frame hashes |

---

## 10. Sources

Every URL below was read via search-engine extract, except those marked (O),
which were opened (section "How far to trust this file").

Platforms — facebook.com/business/news/insights/capturing-attention-feed-video-creative ·
facebook.com/business/news/updated-features-for-video-ads ·
facebook.com/business/news/insights/making-an-impact-measuring-the-value-of-facebook-video ·
facebook.com/business/ads/facebook-instagram-reels-ads ·
facebook.com/business/help/980593475366490/ ·
facebook.com/business/campaign-guidance-navigator/try-vertical-video-with-audio-on-reels-for-CTR ·
transparency.meta.com/policies/ad-standards/ ·
ads.tiktok.com/business/en-US/blog/creative-best-practices-top-performing-ads ·
ads.tiktok.com/business/en-US/blog/creative-that-drives-conversions ·
ads.tiktok.com/business/en/creative-codes ·
ads.tiktok.com/business/creativecenter/quicktok/online/Power_Creative_Elements/pc/en ·
ads.tiktok.com/help/article/tiktok-ads-policy-ad-format-and-functionality ·
blog.google/products/ads-commerce/youtube-shorts-ads-select-lineups-abcds/ ·
support.google.com/google-ads/answer/18061165 · support.google.com/google-ads/answer/16041697 ·
support.google.com/adspolicy/answer/176108 ·
business.google.com/en-all/think/future-of-marketing/youtube-video-ad-creative/

Research — mmaglobal.com/news/mobile-marketing-association-reveal-brands-need-first-second-strategy ·
system1group.com/creative-effectiveness-tiktok · system1group.com/lemon ·
system1group.com/the-extraordinary-cost-of-dull · system1group.com/blog/achtung-3-keys ·
marketingscience.info/tips-for-using-distinctive-brand-assets-in-digital-marketing/ ·
nielsen.com/insights/2017/when-it-comes-to-advertising-effectiveness-what-is-key/ ·
thinkbox.tv/research/thinkbox-research/creative-drivers-of-effectiveness ·
kantar.com/industries/technology-and-telecoms/validating-googles-abcd-framework-with-the-power-of-artificial-intelligence ·
credibility.stanford.edu (Fogg et al. 2003) · tandfonline.com/doi/abs/10.1080/00218499.1993.12466882 ·
tandfonline.com/doi/full/10.1080/02650487.2026.2637295

Craft and regulation — w3c.github.io/wcag21/understanding/three-flashes-or-below-threshold.html ·
asa.org.uk/news/flashing-images-in-advertising.html ·
m3.material.io/styles/motion/easing-and-duration ·
clevercast.com/bbc-subtitling-guidelines/ ·
partnerhelp.netflixstudios.com/hc/en-us/articles/217350977-English-USA-Timed-Text-Style-Guide ·
dmwdirect.com/blog/anatomy-of-winning-direct-response-creative-part-4-drtv-still-packs-a-power ·
arm-direct.co.uk/10-important-drtv-rules/ · nationalmediaconnection.com/ten-drtv-tips-next-level/

Category — ispot.tv (We Buy Any Car, Carvana, CarMax, Vroom, KBB, Gazelle, Value Pawn,
HomeVestors, Offerpad spot pages) · marketing-beat.co.uk (webuyanycar) ·
adage.com (Opendoor, Best Buy) · current.effie.org/2025/2025_Effie_Awards_US_Finalists&Winners.pdf ·
startribune.com/for-best-buy-buyback-program-was-a-costly-dud/185103761/ ·
csmonitor.com/Business/2009/0204/p03s04-usec.html · news.designrush.com (Back Market) ·
ecoatm.com/pages/how-it-works · psacard.com/info/psa-partner-offers

Marketplaces and rendering — facebook.com/help/536155775168076 · facebook.com/help/130910837313345 ·
facebook.com/help/218673814818907 · facebook.com/business/help/201503794673956 ·
socialmediatoday.com/news/facebook-adds-video-display-elements-to-marketplace-listings/647150/ ·
ads.tiktok.com/help/article/video-ads-specifications · cadenus.io/resources/blog/tiktok-safe-zone/ ·
github.com/OpenTermsArchive/pga-versions (Facebook Community Guidelines, Advertising Content Policy;
TikTok Community Guidelines) (O) · github.com/mdn/browser-compat-data (O) ·
chromium, mozilla-firefox and WebKit sources on GitHub (O) · github.com/Vanilagy/mp4-muxer (O) ·
Mediabunny docs (O) · github.com/ffmpegwasm/ffmpeg.wasm docs (O) ·
github.com/yusitnikov/fix-webm-duration (O) · pubmed.ncbi.nlm.nih.gov/12930472/ ·
sciencedirect.com/science/article/abs/pii/S0747563211002470

Regulators — gov.uk/cma-cases/we-buy-any-car-unfair-practices-by-trader-offering-vehicle-buying-service ·
ftc.gov/news-events/news/press-releases/2012/06/ftc-report-many-consumers-believe-claims-promise-maximum-results ·
consumer.ftc.gov/consumer-alerts/2025/07/real-government-agents-arent-asking-you-buy-deliver-gold-bars ·
consumerreports.org (2009 Cash4Gold) · propublica.org/article/ugly-truth-behind-we-buy-ugly-houses ·
wmar2news.com (test-strip buyer) · oig.hhs.gov/fraud/consumer-alerts/fraud-alert-people-diabetes/
