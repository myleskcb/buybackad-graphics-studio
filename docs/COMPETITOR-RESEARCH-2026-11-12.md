# Still "we buy" ads: competitors, evidence, platform rules

Field research, 2026-11-12. The owner's question:

> Analyze competitor ads. Tell us what we're missing and what we can leave out
> that they're doing wrong and generally what's eye catching.

This pass covers the gap left by `docs/VIDEO-AD-RESEARCH.md` (national TV spots
and video guidance): the **local, still-image** competitive set, the evidence on
what makes a still ad stop a scroll and be trusted, and the platform rules that
bear on the picture itself. It is measured against the current "full ad"
(claim badge, outlined headline, models line, three chips, product pictures,
starburst, call-to-action line, number pill with chevrons, towns line, website
line; dark ground, one accent; no price, logo, person, reviews or QR code).

Nothing in the repository was changed. Section 5 is the answer; sections 2 to 4
are what it rests on.

---

## 1. How far to trust this

**I did not see a single competitor image.** That is the main limit, and it
shapes everything in section 2.

| what | status |
|---|---|
| Template galleries (Canva, PosterMyWall, Freepik, Adobe Express, Vecteezy), Pinterest, Meta Ad Library, brand sites, stock sites, platform help centres, arxiv, journals | **Blocked.** The session's network policy refused every one (proxy 403 / host not resolvable). Not retried or worked around. |
| Image downloads | **None.** No image host was reachable, so no `competitor-images/` folder and no `captions.md` exist. Section 2.5 lists what to open by hand instead. To let a later pass see the pictures, the hosts in section 2.5 (postermywall.com, canva.com, facebook.com and the rest) would have to be allowed in the session's network settings. |
| Read in full or at length, marked **(O)** | Open Terms Archive snapshots on GitHub of Meta's **Advertising Standards** (whole file) and Facebook **Community Standards** (first 200,000 of 224,772 characters, which includes Restricted Goods, Prohibited Commercial Practices and Spam). The two repo files named in the brief, and DESIGN-LAW rules 1 to 7, 55 and 87 for context. |
| Everything else | **Search-engine extracts only** (roughly 90 searches and page fetches). The search tool returns a short machine summary of each result page; it does not honour `OR` or exact-phrase operators reliably. A figure below was read from such an extract of the URL cited, not from the page. |

Confidence labels, as in the existing file:
**P** = primary source (platform, regulator, journal, research firm), read via
extract unless marked (O). **S** = reputable secondary coverage. **L** = blog,
practitioner, vendor or self-reported. Where an academic finding is given, it
is from the abstract or a university press summary, not the paper.

What this means in practice:

- **Section 2 (the competitive set) is a map of what exists and what it says,
  not what it looks like.** It is built from gallery result counts, template
  and product-listing titles, shop page bios, and one auto-generated photo
  caption. Layout, type treatment and effects are recorded only where a
  listing title or description states them. The blind 1 to 5 scoring that
  `docs/FIELD-RESEARCH.md` asks for could not be done.
- **Section 4 (platform rules) is the strongest part.** The OfferUp, Craigslist
  and Meta wording comes from extracts of the platforms' own pages, and several
  independent extracts agree. Rule text is well supported; **how strictly each
  rule is enforced is not known**, and one forum anecdote is the only
  enforcement evidence found.
- **Section 3 (evidence) is sound on direction, weak on size.** Most of the
  academic work is on print ads, product pages or lab tasks, not classified
  listings. No study was found that tests a "we buy" still ad on a marketplace.
- Open a page before a number from this file becomes a DESIGN-LAW rule.

---

## 2. The competitive set

### 2.1 Table

"Not seen" means no description of that attribute was available, not that the
attribute is absent.

| # | family | where it lives | what could be established | elements present | call to action | business or scam read | conf |
|---|---|---|---|---|---|---|---|
| A | **Sign-shop convention**: vinyl banners, window decals, corrugated posters reading WE BUY PHONES, CASH FOR PHONES, WE BUY GOLD | eBay, Amazon, Walmart, Etsy product listings; shop windows | Listing titles state the colours: "Yellow Background Black Red", "Black Red", "Blue Red"; gold banners "bright yellow background, bold black WE, red BUY GOLD"; one dark grey with red and yellow. Wide banner formats (24 x 72 in). One poster titled "We Buy Cell Phones Top Dollar Paid". Text only. | No price, no brand, no phone number, no photo. A list of categories on some ("computers games mobile batteries"). | none on the sign; the shop is the CTA | Legible and instantly recognised, but anonymous and identical everywhere. It is the look every other buyer already has. | S |
| B | **Phone buyback templates** in galleries | PosterMyWall, Freepik | PosterMyWall's own counts: **4** results for "we buy phones", **2** for "we buy used cell phones", 57+ for "cash for phones". Titles: "Yellow We Buy Used Broken Cell Phones Poster", "Get Cash For Used Or Broken Cell Phones", "Get Cash For Cell Phone" (Instagram square), "Buy, Sell And Swap Phones And Accessories" (purple). Freepik: "Sell your old phone flyer template, instant cash offer". Phone **repair** templates are plentiful by comparison. | Not seen beyond titles. "Used or broken" is in three of five titles. | not seen | not assessable | P (counts), layout unseen |
| C | **Cash-for-cars templates** | PosterMyWall (7,260+ results for "cash for cars"), Etsy | Titles: "Cash for Cars Scrap Flyer", "Junk Cars for Cash Flyer" (a Pinterest caption says a rusted car photo front and back), "Cars wanted for cash" (described as highlighting "price guarantees and contact details"), "Scrap cars wanted dead or alive". Etsy copy: "We buy the crappiest, clunkiest junk cars, for CASH!" with the phone number as a bold CTA. | Car photo; phone number; a price guarantee on one. | call | Humour and a real car photo read as a person; a price guarantee is a checkable promise. | S |
| D | **Local phone buyers' social pages** (LA, Miami, Houston, South Florida, Detroit, the Valley) | Facebook and Instagram page names and bios | Wording, repeated almost word for word across pages: "highest cash", "top DOLLAR cash", "BEST CASH PRICES", "same-day cash", "any model, any condition", "new, used and damaged", "we come to you" / "same-day pickup", "text for a quote". One account's display name carries "up to $10k". Several say Spanish is spoken. | Business names are descriptors ("iPhone Buyer", "We buy phones", "Cash iPhone buyer"), so there is no identity to remember. No ratings in any bio seen. | DM, call or text | Offer is clear; identity is not. A descriptor name plus a superlative price claim plus "any condition" is exactly the anonymous pattern. | S (bios), images unseen |
| E | **Local phone buyers' web pages** | shop sites surfaced by search | One Texas page: WE BUY iPHONES, "New, Used, Cracked, Any Carrier", walk-ins, a "Today's Market Prices" board, button "GET OFFER NOW". One New York shop lists per-model figures as "Up to $2,000 for 2TB, sealed" and "We only buy iPhone 11 and newer". One Las Vegas buyer: cash "usually in under 15 minutes". One states "stolen, blacklisted, and iCloud-locked iPhones are the three things we can't buy"; another says it also buys carrier-locked and financed phones. | Prices (as "up to" or a daily board); a minimum model; a stated refusal list on the better ones. | get offer, walk in | The refusal list and the "11 and newer" cut-off read as a business with rules. "Up to" on the price is the regulator-flagged pattern. | S |
| F | **PayMore** (franchise electronics buyer, the strongest store-based local competitor found) | a page and an Instagram account per city | The brand name is the price claim. Captions: "We pay cash on the spot", "Top dollar cash paid on the spot", "buy, sell and trade headquarters". A Canadian page says it declines any iPhone "reported lost, stolen, or flagged on the blacklist". Store blog pages on resale scams sell the store against the meetup (one opens on a picture captioned "person meeting a stranger to sell a phone in a parking lot"). | Consistent brand name on every surface; a physical store; a stated refusal policy; safety framing. | visit the store, get a quote | Business. Same claims as the anonymous buyers, made believable by a name, a place and a rule. | S |
| G | **ecoATM** (national kiosks) | Facebook page photos | Facebook's auto-caption of one page photo: an image of money and text reading "INSTANT CASH FOR PHONE", "Sell yours at an ecoATM near you". Post copy: "Recycle your used phone. Get instant cash. Help the planet. Find an ecoATM near you." | Brand name twice in one image; cash graphic; locator rather than a phone number; ID check, device background check and a law-enforcement page as trust devices. | find a kiosk | Business, with a known liability: repeated press on stolen phones traced to kiosks, and older coverage reporting the machines banned in Baltimore. | S |
| H | **Mail-in buyers** (ItsWorthMore, GadgetGone, Gazelle, SellCell) | their sites, Trustpilot | They lead with third-party ratings: ItsWorthMore 4.5 from about 1,900 reviews and BBB A+; GadgetGone 4.3 from about 3,000; Gazelle 3.8 from 13,500+. Their recurring complaint is the **re-quote after inspection** ("total scam" in reviews). Decluttr was reported out of business as of June 2025. | Rating plus count plus source; free shipping; fast payment. | get a quote online | Business by reputation. Their weakness is a local buyer's opening: the price is agreed with the phone in hand. | S |
| I | **Card shops** (Pokemon, sports) | shop buylist pages, social posts | Buy rates are published as a **percentage of a named market price**: "65% of market in cash, 80% in store credit"; "60% TCGplayer on modern, 50% on other"; "typically 70 to 85%". Posts: "Sell us your Pokemon cards! WE PAY CASH!", "always buying collections", "over 200 completed sales". | A specific, checkable rate; a count of completed deals. | bring them in, DM | Business. This category already does what section 5 recommends for phones. | S |
| J | **Gold buyers** | store pages, signs | "Paying the highest prices", "we will beat any offer", "cash on the spot", "free appraisal", "no-obligation evaluation", "no hidden fees". Store-based buyers attack pop-up buyers ("We Buy Gold, Hotel Today Only"). | Superlative price claims; free appraisal; sometimes a live gold rate. | visit | Mixed. "Highest prices" and "beat any offer" are comparative claims that need backing; "today only" is the FTC-named pressure signal. | S |
| K | **Junk-car buyers** | Facebook pages | "Pick up your junk car and pay you CASH the same day. No title, no problem. FREE towing!" One listing gives a range, "$200 to $800". The same page name is cloned across at least six cities. | Same-day cash; free towing; "no title". | call now | "No title, no problem" is this category's version of "iCloud locked OK". Cloned city pages are the pattern Meta's spam policy describes. | S |
| L | **We-buy-houses bandit signs** | roadside | Yellow corrugated board, black text, "We Buy Houses" and a number, 18 x 24 in. | Phrase plus number, nothing else. | call | One industry opinion piece argues the phrase is now so saturated it "functions as a red flag". Forum response-rate figures are anecdote. | L |
| M | **Spanish-language** | sign products, Instagram, Latin American pages | The sign-shop product, translated: a "Compramos Teléfonos Celulares" banner; a window decal "COMPRAMOS CELULARES Y PORTÁTILES". An Instagram account named "COMPRO TU IPHONE" promising "Pago seguro e inmediato" and "en 5 minutos". A page: "Compramos celulares para repuestos ... no importa si están dañados". One video mentions a "letrero amarillo". **No** Spanish "compro celulares" template surfaced on Canva or Vistaprint. | "Seguro" (safe) appears in the Spanish pitch where the English ones say "top dollar". Bilingual English pages add "Spanish spoken" to the bio. | DM, WhatsApp, visit | Thin evidence. The segment looks under-served by templates, as FIELD-RESEARCH guessed. | S, thin |
| N | **National car buyers and TV** | covered in `VIDEO-AD-RESEARCH.md` section 5 | not repeated here | | | | |

### 2.2 What the set has in common

Counted across the families where wording was available (A, C to K, M):

- **Speed** ("same day", "on the spot", "in 5 minutes", "under 15 minutes"): nearly all.
- **A superlative price claim** ("top dollar", "highest", "best cash prices", "pay more"): nearly all of the local buyers. It is the most common phrase in the category, which is why it carries no information.
- **"Any condition"**: most phone and car buyers. The better ones add what they refuse.
- **A specific figure**: rare for phones, and where present it is "up to". **Normal in cards (percent of market) and present in gold (live rate)**.
- **Third-party proof** (rating, count, source): central for the mail-in buyers, absent from every local bio seen.
- **A real brand name**: the franchise and the nationals. Local pages mostly use a descriptor as the name.
- **Yellow with black and red** is the physical-sign convention in phones, gold and houses.

### 2.3 Business or scam: the signals that separate them here

| reads as a business | reads as a scam or a fence | source |
|---|---|---|
| a name, used the same way everywhere | a descriptor for a name; cloned pages per city | F, G against D, K; Meta Community Standards on repetitive content (O) |
| a place you can walk into | meetups only; "hotel, today only" | F, J; FTC alert in the earlier file |
| a specific rate or a dated price for a named item | "up to $X"; "highest prices" with nothing behind it | I, E; FTC 2012 "up to" study in the earlier file |
| saying what you will not buy; asking for ID | "any condition", "iCloud locked OK", "no title, no problem" | E, F, G against D, K; news on stolen phones and fencing shops (S) |
| a rating with a count and a source | no proof, or stars with no source | H; Spiegel, BrightLocal (section 3) |
| "no hidden fees", free quote, no obligation | re-quotes after you have handed the item over | H, J; regulator cases in the earlier file |

This matches the hypothesis in FIELD-RESEARCH: the discriminator is
**specificity and identity, not production value**. Nothing found suggests
polish alone moves an ad from the right column to the left.

### 2.4 Not established

- What the template-gallery and marketplace ads actually look like: layout,
  type treatment, effects, how many use starbursts, outlines or cash imagery.
- Any Meta Ad Library creative for any brand.
- Whether the yellow, black and red convention carries over from physical signs
  to feed images in this niche.

### 2.5 Thirty minutes by hand that would close most of this gap

Open these in a normal browser, take the first 30 results of each without
selecting, and score them on the FIELD-RESEARCH sheet. Record attributes only.

- postermywall.com search: `we buy phones`, `cash for phones`, `we buy broken cell phones`, `cash for cars`, `we buy gold`
- canva.com templates search: `sell your phone`, `cash for phones`, `we buy gold`, `compro celulares`
- facebook.com/ads/library, advertiser names: ecoATM, PayMore, Gazelle, ItsWorthMore, GadgetGone, SellCell, Swappa, Back Market, Peddle, CarMax, Carvana, We Buy Any Car
- facebook.com/ecoATM/photos, and three PayMore city Instagram accounts
- Your own city's Marketplace and OfferUp, searching `we buy iphones` and `compro iphone`, browsing by hand only

---

## 3. The evidence

### 3.1 What stops the eye

| finding | evidence | source | conf |
|---|---|---|---|
| Bigger text earns more attention for the whole ad; the picture earns attention at any size; the brand passes attention on to the rest | 1,363 print ads, eye-tracked on 3,600+ people. "The pictorial is superior in capturing attention, independent of its size. The text element best captures attention in direct proportion to its surface size." Only text size raised attention to the ad as a whole. | Pieters and Wedel, Journal of Marketing 68(2), 2004 | P, abstract. Print magazines. |
| In a page full of competing ads, what counts is standing out from the neighbours; text did little to attract the eye there | 1,100+ retail feature ads eye-tracked in their page context; salience measured against the other ads on the page. The university summary says text "has little effect in attracting consumer attention" in that setting. | Pieters, Wedel and Zhang, Management Science 53(11), 2007 | P abstract, S summary. **In tension with the row above**: text size helps a lone ad more than an ad in a crowded grid. |
| Dense visual detail hurts; a rich but organised design helps | 249 eye-tracked ads. "Feature complexity" (dense detail, colour and edges, measurable as compressed file size) "hurts attention to the brand and attitude toward the ad". "Design complexity" (number and arrangement of objects) helps attention and attitude. | Pieters, Wedel and Batra, Journal of Marketing 74(5), 2010 | P, abstract |
| Ask people to look at one thing; too much copy costs reach | "Ensure that you're only asking people to look at one thing." Too much copy "is distracting and can lead to your ad being shown to fewer people". | Meta, photo ad format page | P via extract |
| Saturated colour captures attention | Saturated colour captures attention, explained by the arousal it stimulates | Hagtvedt and Brasel, Journal of Consumer Research 44(2), 2017 | P via extract |
| Legibility follows brightness contrast | Black on white and black on yellow are the classic top pairs; "brightness contrast is directly related to legibility" | sign-legibility reviews | S |
| Capitals are not a problem at small sizes | Upper case was read faster than mixed case at sizes near the acuity limit; the advantage vanished at larger sizes | Arditi and Cho, Vision Research, 2007 | P via extract |
| Outlined type | **No study found either way.** | | |
| Faces pull the eye, and may pull it off the product | Eye-tracking finds faces held longer than any other element. Whether that costs the brand is disputed: some studies find brand attention unaffected, with only the face's share rising. A pointing gesture or gaze toward the product redirects attention. | Chan and Chau 2023; Kopka et al. 2025; Johnson, Platt et al. 2022 | P, abstracts |
| Arrows steer attention | A meta-analysis found no behavioural difference between attention shifts triggered by gaze and by arrows | lab cueing literature | P via extract. Lab tasks, not ads. |
| Things that look like ads get skipped | Users ignore what looks like an ad or sits where ads sit | Nielsen Norman Group, banner blindness | S via extract |
| Thumbnails: few words, a face or strong colour | Of 500 breakout videos, 69% of thumbnails had a face; median overlay text was five words | vidIQ | L, descriptive only |
| Glance media: about six or seven words | Billboard practice | outdoor-advertising guides | L |
| The ad is judged in 0.25 to 0.4 s | Fors Marsh for Facebook; MMA and Neurons | `VIDEO-AD-RESEARCH.md` section 2 | P via extract |

### 3.2 What persuades without backfiring

| finding | evidence | source | conf |
|---|---|---|---|
| **Three claims, not four**, when the reader knows they are being sold to | Attitude rose with a third positive claim and fell significantly with a fourth. The effect appeared only when people recognised the persuasion motive, which an ad always signals. | Shu and Carlson, Journal of Marketing 78(1), 2014 | P via secondary. Tested on products such as cereal and shampoo. |
| Promotion cues work, and wear out when everything carries one | Sale signs raised demand, in some cases by more than 50%, but were "less effective at increasing demand when more items have them"; sales peaked when some but not all items had one. The authors tie this to credibility. | Anderson and Simester, Marketing Science 1998 and 2001 | P, abstract. Retail shelves and catalogues. |
| Precise numbers read as knowledge and confidence | An ad saying "47% or 53% better" was judged more accurate than a round figure. People who gave more precise estimates were seen as more confident and their advice was preferred. Precise prices anchor harder. | Schindler and Yalch 2006; Jerez-Fernandez, Angulo and Oppenheimer 2014; Janiszewski and Uy 2008 | P via secondary. Caveats: too much precision can backfire; precise offers can read as inflexible (Lee et al. 2018). |
| "Up to" is read as typical | 48.2% of people shown "up to 47%" expected about 47% | FTC 2012, in the earlier file | P via extract |
| Vague superlatives are legally "puffery"; a comparative one may need proof | The line "rests in the specificity or generality of the claim". "Best" can be defended as puffery or treated as a claim needing substantiation, depending on context. | advertising-law commentary | S |

### 3.3 What earns trust

| finding | evidence | source | conf |
|---|---|---|---|
| Show a real organisation and make contact easy | Stanford's ten credibility guidelines include "Show that there's a real organization behind your site" and "Make it easy to contact you": phone number, physical address, email | Stanford Guidelines for Web Credibility, 2002 | S via extract. Websites. |
| Design look drives credibility judgments | "Design look" in 46.1% of credibility comments | Fogg et al. 2003, in the earlier file | P via extract |
| Almost everyone reads local reviews | 97% of consumers read reviews for local businesses (1,002 US adults, published February 2026) | BrightLocal Local Consumer Review Survey 2026 | S via extract |
| A handful of reviews does most of the work; a perfect score is less believable | Purchase likelihood for a product with five reviews was 270% higher than with none; most of the gain comes in the first ten. Ratings of 4.2 to 4.7 outsold 4.7 to 5.0. Verified-buyer reviews added 15%. | Spiegel Research Center, Northwestern, 2017 | P via extract. Product pages, not ads. |
| Ratings shown in an ad lift clicks | Seller ratings "can increase click-through rates up to 10%" | Google, as repeated by vendors | P claim via secondary |
| Real photos beat stock on trust, by a small margin | Marketplaces furnished with high-quality real user photos were rated more trustworthy than ones with stock imagery (about 3.8 against 3.7). Better images went with a higher chance of sale (1.17x shoes, 1.25x handbags). | Ma, Mezghani, Wilber, Hong, Piramuthu, Naaman and Belongie, WACV 2019 | P abstract, S summary. Shoes and handbags. |
| A person's photo carries trust in peer-to-peer deals | On Airbnb the host's photo kept a significant effect even when review scores were varied; a later paper cites it for the finding that the absence of a facial image lowered perceived trustworthiness | Ert, Fleischer and Magen, Tourism Management 55, 2016 | P abstract, S citation |
| Meta's own advice for feed images | "Show images of people benefiting from your product, rather than just the product itself"; work in "your brand's logo, icon or a color scheme" | Meta photo ad page; Best Practices for Instagram Image Ads | P via extract |
| Marketplace's own advice | "Use your own pics, not images from the internet" | Facebook Marketplace community post | P via extract. Advice, not policy. |
| **Why people do not sell their old phone** | US: 33% say reselling "isn't worth the hassle", 31% cite privacy, 26% worry about data removal, 21% do not know where to sell. UK: 52% still have their old handset; of those, 26% worry about others reaching their data and 19% do not know how to wipe it. India: 69% hesitate over data security and 68.6% would trust a buyer more with certified deletion. A US study of 4,000 found data worries pushed people to store devices rather than resell. | CNET 2024 via Mac Observer; YouGov UK (3,119 owners); Cashify 2026 via Business Today; Fortune, June 2026 | S; YouGov P via extract |
| Category scam signals are documented | Inflated headline price, hidden fees, no quote before the deal, pressure to act fast | regulators, in the earlier file section 5 | P via extract |
| Phone buying carries a stolen-goods association | Repeated local news on stolen phones traced to kiosks; police cases on shops fencing phones | ABC7 Chicago 2026, KGW, NBC Bay Area | S |

### 3.4 Polished or rough?

Agency and vendor posts agree that plain, feed-native creative often beats
polished creative on cost per click. **No controlled public study or Meta
document was found to support the percentages quoted**, and the better
write-ups say the driver is being easy to understand, not being ugly (L). Set
that beside Fogg (design look drives credibility, P) and the owner's own sorted
references (`DESIGN-LAW.md`: the "good" pile is loud but organised and
product-led; heavy outlines appear in both good and mid). The consistent reading
is: **clear and specific beats both slick and chaotic.**

---

## 4. Platform rules that bear on the picture

Enforcement was not measured for any of these. "Verify by hand" means read the
live page before relying on the wording.

### OfferUp: the full ad breaks the photo rules as written

| rule | what the page says (extract of OfferUp's help pages; quotation marks only where the extract quoted the page) | source | conf |
|---|---|---|---|
| Photos carry no writing or contact details | Listing photos should not carry writing, phone numbers, email addresses or physical addresses; photos should be clean, with no stickers, filters or extra text. **Exceptions may apply for verified businesses, verified auto dealerships** and garage or estate sale listings. | Posting Rules | P via extract |
| Contact details anywhere in a listing are a removal reason | "Including phone numbers, email addresses, social media handles, or other contact information anywhere in the listing." "Including links or web addresses that direct buyers off the platform." | Why listings are removed | P via extract |
| Stock, catalogue or heavily edited photos are a removal reason | listed among the common reasons | same | P via extract |
| Wanted ads and business-only ads are prohibited items | Under "Services, ads, & intangible items": "Wanted ads", "Solicitations", and listings that only advertise a business, promotion or sale rather than items | Prohibited Item Guidelines | P via extract |
| Services | Service listings may not seek a service, and may not show personal contact details in photos, title or description. Supported categories include Technology Repair and Professional and Business Services; a buyback is not named. | Prohibited Services Guidelines; Supported service categories | P via extract |

Against our ad: the number pill, the website line and the text itself each
conflict with the Posting Rules for an ordinary account, the product renders
are close to "catalogue or heavily edited photos", and the listing as a whole
is a wanted ad. The one route the rules leave open is a **verified business**
account; what that exception permits was not readable. **Confidence in the rule
text: high. Confidence about enforcement: none.**

### Facebook Marketplace: the listing type is the risk, not the picture

| rule | wording | source | conf |
|---|---|---|---|
| A listing must offer an item | "No Item for Sale": commerce content "may not promote news, humor or other content that does not offer any product for sale" | Commerce Policies | P via extract |
| No non-physical items | "Non-physical items are prohibited on Facebook Marketplace including services, subscriptions, digital products, or rentals" | Meta Offers Policy page | P via extract |
| "In search of" posts | "'In search of' posts, lost and found posts, jokes and news aren't allowed" | Marketplace help text, as found by the earlier pass; **not re-found this pass** | S |
| Enforcement | Listings are reviewed when systems detect a possible violation or someone reports them. One forum thread says "wanted" ads are removed at once and suggests avoiding the word. | Marketplace help; a tractor forum | P via extract; L |
| Text in the picture | **No rule found** for person-to-person listings. For catalogue product images Meta says: "Don't include text that overlays the product, calls to action, promo codes, watermarks or time-sensitive information." | Product image specifications for catalogues | P via extract; different surface |
| Phone number or website in the picture | **No rule found.** A third-party guide says numbers typed in a description may be shown as hidden. | | L |
| Repetition | Accounts may be restricted when signals such as "posting repetitive content" are present | Community Standards, Spam (O) | P |
| Deception | Prohibited: "Misleading or unreasonable pricing"; "get-rich-quick"; fake reviews offered for reward | Community Standards (O) | P |
| Cash imagery | **No rule names it.** The policy targets "unrealistic financial reward"; agencies advise against cash stacks. | Community Standards (O); agency blogs | P; L |

Search engines do index live "buying" listings on Marketplace, so such posts
exist in practice. Buy-and-sell **groups** are governed by their admins and are
the safer Facebook surface, as the earlier file concluded.

### Craigslist: the picture is fine, the category is not optional

| rule | wording | source | conf |
|---|---|---|---|
| Category | "wanted ads only in the 'wanted' category"; service offerings only under services; dealers only in dealer categories | craigslist help, reasons for removal | P via extract |
| Frequency and place | "Post each item/offering no more than once every 48 hours"; choose one local site; the same ad in several locations is prohibited | craigslist help and FAQ | P via extract |
| Content | Prohibited: "false, misleading, deceptive, or fraudulent content"; "spam; miscategorized, overposted, cross-posted, or nonlocal content"; unexpected or hidden fees | craigslist prohibited list and help | P via extract |
| Removal | Community flagging; free ads flagged enough are removed automatically | craigslist flagging FAQ | P via extract |
| Text or a phone number inside an image | **Nothing found.** | | |

Against our ad: the towns line supports "local", and NO FEES must be literally
true. An ad that looks like spam to other users is what gets flagged, and
flagging is the enforcement.

### Instagram

| rule | wording | source | conf |
|---|---|---|---|
| Text, numbers, websites in an organic post image | **No rule found.** The Community Standards on spam and deception above apply. | (O) | P |
| Boosted posts | No text-percentage rule. "Lower quality ads ... may experience impacted performance." "All ad components ... must be relevant to the product or service being offered." **"Ads must clearly represent the company, product, service, or brand that is being advertised."** No personal attributes. | Meta Advertising Standards (O) | P |
| The old 20% text rule | Dropped in September 2020; Meta kept saying images with less text perform better | Social Media Today, Search Engine Journal | S |
| Format | Meta recommends 1:1 or 4:5 for feed images. The profile grid now crops to 3:4; sources disagree on whether a square is padded or cropped, so keep the headline and number inside the central area. | Meta aspect-ratio help; vendor guides | P via extract; L |

### Still unresolved from the earlier file

- **Coins and bullion on Meta.** The Community Standards restrict "sale,
  purchase or trade" of currency in a list that reads as being about forged
  items. Read the passage in full before running coin ads.
- **Test strips.** Third-party guides say Meta bars medical devices from Shops;
  nothing was found naming test strips on Marketplace or OfferUp.
- **Licence numbers.** One California city code makes it unlawful for a licensed
  secondhand dealer "to publicly advertise without including the license
  number". No state-level rule was confirmed. Worth one call to the local
  licensing desk, because a licence number is also a trust signal.

---

## 5. Measured against our ad

### 5.1 What we are missing, ranked by expected value

| # | missing | why | evidence | how sure |
|---|---|---|---|---|
| 1 | **A version that survives where it is posted.** One picture is sent to four platforms with four rule sets. | A removed listing converts nothing, and OfferUp's photo rules exclude text, phone numbers and web addresses for ordinary accounts. | Section 4 | Rule text: high. Enforcement: unknown. |
| 2 | **Who is buying.** No business name anywhere on the picture. | The brand element is what passes attention to the rest of an ad; Meta asks for a recognisable logo, icon or colour scheme and, for boosted posts, that the ad "clearly represent the company"; a real organisation is a core credibility cue; anonymity is the fence's pattern in section 2.3. | Pieters and Wedel 2004; Meta (O); Stanford; families D against F | High on direction |
| 3 | **A real, specific figure.** | The top US reason not to sell is "not worth the hassle", which is a question about money that the ad does not answer. Card shops publish a rate; precise numbers read as confidence. A local buyer can quote one model; the nationals cannot. | CNET; family I; Jerez-Fernandez et al.; earlier file section 5 | Medium-high. It must be the shop's own published number, qualified on the picture, dated, and never "up to" (rule 55's reason, that prices move, still holds; this is an owner-entered field, not default copy). |
| 4 | **Proof from customers**, with a count and a source. | Nearly everyone reads local reviews; the first handful do most of the work; a 4.2 to 4.7 score is more believable than 5.0; the mail-in competitors lead with it and no local page seen does. | BrightLocal; Spiegel; family H | Medium. Evidence is from product pages and search ads. Rule 55 is right that it must never be invented: owner-entered and true, or absent. |
| 5 | **An answer to the seller's fear.** Nothing on the ad speaks to data or safety. | Privacy and data removal are the second and third US reasons for not selling; two-thirds of Indian respondents would trust a buyer more with certified deletion; the franchise sells the store against the parking-lot meetup. | CNET; YouGov; Cashify; family F | Medium. Survey evidence about selling in general, not ad tests. |
| 6 | **Something real in the picture**: the counter, the storefront, a hand with the phone and the cash. | Real photos edge stock on trust; a person's photo carries trust in peer-to-peer deals; Meta advises showing people; OfferUp treats catalogue-style images as a removal reason; the earlier file reached the same point for video. | Ma et al.; Ert et al.; Meta; OfferUp | Medium. Effect sizes are small where measured. Faces can take attention from the offer, so the product and number must stay dominant. |
| 7 | **A rule that shows the buyer is legitimate**: "ID required", "we do not buy locked or reported phones". | The better competitors state a refusal list; the category has a documented stolen-goods problem. It turns the weakest association into a reason to trust. | families E, F, G; news coverage | Low-medium. Inference from competitor practice. |
| 8 | **A first step that costs nothing.** CALL OR TEXT names the channel, not the action. | Every strong buyer sells getting an offer; "text a photo, get a price" removes the hassle objection. | earlier file section 4; CNET | Medium |
| 9 | **One thing that stays the same across posts.** "New look" changes colours and arrangement every time. | Recognition is built by a fixed shape and colour; platforms punish repetitive content, so vary the layout and hold the identity mark. | Ehrenberg-Bass in the earlier file; Meta Spam (O) | Medium |

### 5.2 What to leave out

**What competitors do that the evidence is against:**

- **"Up to $X"**, including in an account name. Read as typical, flagged by regulators.
- **"Highest prices", "we will beat any offer", "best cash prices."** Comparative claims that may need proof, and the most common words in the category.
- **"Any condition" with no limit; "iCloud locked OK"; "no title, no problem."** Reads as no questions asked.
- **A descriptor for a name and cloned pages per city.** Anonymous, and the pattern the spam policy describes.
- **"Today only" urgency.** The FTC's named pressure signal.
- **Cash stacks and money graphics as the picture.** No rule bans them; they sit next to the get-rich-quick pattern the policy does ban, and "winged-money clipart" is already in the owner's own bad pile.
- **Stock or internet photos.** Marketplace advises against them; OfferUp removes for them.
- **The yellow, black and red sign look.** Legible, and exactly what every other buyer and every roadside sign already uses. No evidence it hurts trust, none that it helps; it cannot make an ad distinct.

**In our own ad, candidly:**

| element | verdict | reasoning | how sure |
|---|---|---|---|
| **"Visit our website at www..."** | **Drop it from the picture.** | The smallest line on the card (about 4 px tall in a 160 px tile, estimated from a screenshot), not clickable in an image, a second call to action competing with the number, and an off-platform link is a named removal reason on OfferUp. If the domain matters, let it be the business name. | High |
| **Phone number in the picture** | Keep on Craigslist, Instagram and Facebook; **remove for OfferUp**. | No rule found against it on the first three; explicit rule on OfferUp. It is also the element the DR evidence most supports. | High |
| **Six claims** (two on the badge, three chips, one on the sticker) | **Cut to three.** | The fourth claim lowers persuasion when the reader knows it is an ad. As described, "cash" is said three times in three shapes (FAST CASH, CASH SAME DAY, CASH!), so the six are really four. | Medium-high |
| **Starburst sticker** | **Remove by default; keep only if it carries the one fact nothing else says.** | A promotion cue does work, but it loses force when everything carries one, and here it repeats the badge and a chip. No evidence was found that a starburst lowers trust; rule 6 called it clearance-rack, and nothing found contradicts or confirms that. It is convention. | Medium on redundancy; low on trust |
| **Claim badge wording, TOP DOLLAR and FAST CASH** | **Replace with identity or place.** | The top slot is read first. "Top dollar" is safe puffery and the most generic phrase in the category (it is on sign-shop posters and in the franchise's captions), so it differentiates nothing. | Medium |
| **Heavy outlined capitals** | **Keep the capitals. Keep the outline only where it buys contrast, and do not stack it with a glow and a shadow.** | Capitals are at least as legible at small sizes. No study on outlines was found, and the owner's own good references use them. The real risk is dense edge detail, which is the measured thing that hurts. | Medium on capitals; outline unproven either way |
| **Nine or ten elements on one square** | **Fewer and bigger, not because ten objects is too many but because five of them cannot be read small.** | Organised complexity helped in the eye-tracking work; dense detail hurt. At grid size only the headline, the phones and the number are legible; chips, towns and website are texture. Meta: one thing. | Medium |
| **Product renders** | Keep as the hero for Craigslist, Instagram and Facebook; offer a real-photo slot. | Pictures earn attention at any size, so they can be smaller than the headline. They are catalogue-style images, which OfferUp removes for. | Medium |
| **Models line** | Keep. Consider "iPHONE 15 AND NEWER". | Specificity is the trust variable; competitors phrase it "11 and newer". It is shorter and avoids the dash that rule 55 bars in customer copy. | Medium |
| **Chevrons at the number** | Keep one pair. | Arrows do steer attention in lab work. Three per side adds edges without adding direction. | Low-medium |
| **Towns line with pin** | Keep; accept it is a second read. | Locality supports credibility and Craigslist's "local" rule. | Medium |
| **No QR code** | Stay without. | A code in a feed image cannot be scanned by the phone showing it. No evidence found for adding one. | Low; not researched in depth |
| **Dark ground, one bright accent** | Keep. | Brightness contrast drives legibility; saturated colour draws the eye; a dark flat graphic differs from the mid-tone photos around it. | Medium |

### 5.3 What is eye-catching

**With evidence behind it:**

1. **Very large text.** The one element whose size raised attention to the whole ad (print).
2. **A product picture, at any size.** It need not be big to work.
3. **Looking unlike the neighbours.** In a crowded page, salience relative to the other ads decides who gets looked at. Among phone photos a flat dark graphic is different; in a buy-and-sell group full of the same graphics it is not.
4. **Brightness contrast and one saturated colour.**
5. **Low pixel-level clutter.** Plain grounds, few textures, few halos.
6. **A face or a hand**, with the caution that it can take attention from the offer unless it points or looks at it.
7. **An arrow at the thing you want read** (lab evidence only).
8. **Everything present in the first quarter second**, from the earlier file.

**Convention only, no evidence found for or against:**
starbursts; outlined type; coloured glows; the yellow, black and red sign
palette (legibility yes, trust unknown); triple chevrons; all capitals as an
attention device; the words "top dollar"; a claim badge above the headline.

### 5.4 Changes to test first

One variable per test; count calls and texts per post per platform, and
removals per platform.

1. **Put the business name where the claim badge is**, because the brand element is what carries attention to the rest and anonymity is the scam pattern (5.1 no. 2).
2. **Cut to three claims by removing the starburst and the badge claims**, because a fourth claim lowers persuasion and "cash" is currently said three times (Shu and Carlson).
3. **Delete the website line and give its space to the number**, because it is unreadable at grid size, competes with the one action, and is a removal reason on OfferUp.
4. **Add an OfferUp-safe export with no number, no web address and minimal text, contact left to the platform's own fields**, because OfferUp's Posting Rules exclude all three from photos for ordinary accounts.
5. **Offer an owner-entered price line for one named model, qualified and dated, never "up to"**, because "not worth the hassle" is the top reason people do not sell and specific figures read as confidence.
6. **Offer an owner-entered proof chip (rating, count, source) in place of NO FEES**, because almost everyone reads local reviews and no local competitor seen shows any.
7. **Test a DATA WIPED WHILE YOU WATCH chip**, because privacy and data removal are the second and third reasons people keep old phones.
8. **Change CALL OR TEXT to a named first step such as TEXT A PHOTO, GET A PRICE**, because every strong buyer sells getting an offer, not selling.
9. **Test a real photograph (counter, hand, phone, cash) against the renders**, because real photos edge stock on trust and Meta and OfferUp both favour them.
10. **Add a clutter gate that compares the export's compressed file size against a plain-ground version**, because dense visual detail is the measured thing that hurts and compressed size is how the study measured it.

---

## 6. Sources

Read at length, (O):

- Meta Advertising Standards, Open Terms Archive snapshot: https://github.com/OpenTermsArchive/pga-versions/blob/main/Facebook/Advertising%20Content%20Policy.md
- Facebook Community Standards, same archive: https://github.com/OpenTermsArchive/pga-versions/blob/main/Facebook/Community%20Guidelines.md

Platform pages, via search extract:

- OfferUp Posting Rules: https://help.offerup.com/hc/en-us/articles/360031988292-Posting-Rules
- OfferUp Why listings are removed: https://help.offerup.com/hc/en-us/articles/360032337011-Why-listings-are-removed
- OfferUp Prohibited Items Guidelines: https://help.offerup.com/hc/en-us/articles/360032329711-Prohibited-Items-Guidelines
- OfferUp Prohibited Item Guidelines (business): https://help.business.offerup.com/hc/en-us/articles/38906225658388-Prohibited-Item-Guidelines
- OfferUp Prohibited Services Guidelines: https://help.offerup.com/hc/en-us/articles/37465336191124-Prohibited-Services-Guidelines
- OfferUp Supported service categories: https://help.offerup.com/hc/en-us/articles/46715951708948-Supported-service-categories
- Craigslist prohibited: https://www.craigslist.org/about/prohibited
- Craigslist reasons for removal: https://www.craigslist.org/about/help/reasons
- Craigslist flagging FAQ: https://www.craigslist.org/about/help/faqs/flagging
- Craigslist terms of use: https://www.craigslist.org/about/terms.of.use/en
- Facebook Commerce Policies: https://www.facebook.com/policies_center/commerce
- Meta Offers Policy Guidelines: https://www.facebook.com/business/help/358970040838616
- What to do if your Marketplace listing is rejected: https://www.facebook.com/help/2193854224216494
- Marketplace community post on photos: https://www.facebook.com/fbmarketplace/photos/a.817455875025717/1058225394282096/?type=3
- Meta photo ad format: https://www.facebook.com/business/ads/photo-ad-format
- Best Practices for Instagram Image Ads: https://www.facebook.com/business/help/109732209367483
- Best practices for aspect ratios: https://www.facebook.com/business/help/103816146375741
- Product image specifications for catalogues: https://en-gb.facebook.com/business/help/686259348512056
- The 20% rule: https://www.socialmediatoday.com/news/facebooks-removing-its-restrictions-on-text-content-in-facebook-ad-images/ ; https://www.searchenginejournal.com/facebook-removes-the-20-text-limit-on-ad-images/381844/
- Forum anecdote on wanted ads: https://forums.yesterdaystractors.com/threads/buyer-sellers-how-to-you-advertise-on-fb-marketplace.1683815/
- Instagram grid: https://planoly.com/blog/guide-to-instagrams-new-vertical-grid ; https://www.oktopost.com/blog/instagram-grid-size-guide/

Research, via abstract or summary:

- Pieters and Wedel 2004: https://news.umich.edu/print-ad-pictures-less-is-more ; https://www.scinapse.io/papers/2147156975
- Pieters, Wedel and Batra 2010: https://repository.tilburguniversity.edu/items/3fddf97a-469e-4d38-9c26-8dbd00c750b2
- Pieters, Wedel and Zhang 2007: https://pubsonline.informs.org/doi/abs/10.1287/mnsc.1070.0732 ; https://www.rhsmith.umd.edu/news/optimal-feature-advertising-design
- Shu and Carlson 2014: https://www.econbiz.de/Record/when-three-charms-but-four-alarms-identifying-the-optimal-number-of-claims-in-persuasion-settings-shu-suzanne/10010250058 ; https://tips.ariyh.com/p/rule-of-three
- Anderson and Simester: https://www.kellogg.northwestern.edu/faculty/research/detail/2001/are-sale-signs-less-effective-when-more-products-have ; https://ideas.repec.org/a/inm/ormksc/v20y2001i2p121-142.html
- Precise numbers: https://www.psychologicalscience.org/news/were-only-human/precisely-right-no-doubt-trust-me.html ; https://improbable.com/tag/consumers/
- Hagtvedt and Brasel 2017: https://ideas.repec.org/a/oup/jconrs/v44y2017i2p396-413..html
- Labrecque and Milne 2012: https://link.springer.com/content/pdf/10.1007/s11747-010-0245-y.pdf
- Arditi and Cho 2007: https://pmc.ncbi.nlm.nih.gov/articles/PMC2016788
- Colour contrast and legibility: https://scholar.lib.vt.edu/ejournals/JDC/Spring-2003/colorcontrast.html ; https://visualexpert.com/Resources/colorfunctionality.html
- Faces in ads: https://scholars.hkbu.edu.hk/en/publications/mitigating-the-vampire-effect-of-using-celebrity-in-advertising-a/ ; https://proceedings.emac-online.org/pdfs/A2025-126276.pdf ; https://knowledge.wharton.upenn.edu/article/the-marketing-psychology-behind-celebrity-endorsements/
- Arrow and gaze cueing: https://pmc.ncbi.nlm.nih.gov/articles/PMC8189009
- Banner blindness: https://www.clickz.com/research-internet-users-plagued-by-banner-blindness/
- Ma et al. 2019: https://arxiv.org/abs/1811.10648 ; https://news.cornell.edu/node/307066
- Ert, Fleischer and Magen 2016: https://papers.ssrn.com/abstract=2624181
- Stanford credibility guidelines: https://credibility.stanford.edu/guidelines ; https://en.wikipedia.org/wiki/Stanford_Web_Credibility_Project
- Spiegel Research Center: https://spiegel.medill.northwestern.edu/How-Online-Reviews-Influence-Sales
- BrightLocal 2026: https://www.brightlocal.com/research/local-consumer-review-survey/ ; https://www.pinmeto.com/news/brightlocal-local-consumer-review-survey-2026/
- Why people keep old phones: https://yougov.com/en-gb/articles/50080-what-do-britons-do-with-their-old-phones-half-of-them-keep-it ; https://fortune.com/2026/06/21/old-electronics-junk-drawer-data-security-anxiety-survey/ ; https://www.businesstoday.in/technology/news/story/your-data-is-worth-more-why-69-of-indians-hesitate-to-sell-old-smartphones-537486-2026-06-18 ; https://macobserver.com/?p=217844
- Puffery: https://www.kelleydrye.com/viewpoints/blogs/ad-law-access/nad-considers-whether-better-and-best-claims-are-puffery
- Thumbnails (L): https://vidiq.com/blog/post/youtube-thumbnail-tips/
- Plain against polished (L): https://segwise.ai/blog/why-boring-ads-beat-polished-ads ; https://stackmatix.com/blog/ugc-style-ads-vs-polished-creative

Competitive set, via search extract:

- PosterMyWall searches: https://www.postermywall.com/index.php/posters/search?s=we+buy+phones ; https://www.postermywall.com/index.php/posters/search?s=cash+for+phones ; https://www.postermywall.com/index.php/posters/search?s=we+buy+broken+cell+phones ; https://www.postermywall.com/index.php/posters/search?s=cash+for+cars
- PosterMyWall car templates: https://www.postermywall.com/index.php/art/template/c8b2b311a4a441d34997f598d6805404/cars-wanted-for-cash-design-template ; https://www.postermywall.com/index.php/art/template/c2a31fc47efaf6effab993320b775629/junk-cars-for-cash-flyer-template-design
- Freepik: https://www.freepik.com/premium-vector/sell-your-old-phone-flyer-template-instant-cash-offer-used-mobile-phones-editable-eps-design_419413411.htm
- Sign products: https://www.ebay.com/sch/i.html?_nkw=we+buy+phones ; https://www.ebay.com/itm/205696471132 ; https://www.amazon.com/PHONES-BANNER-cellphones-iphone-samsung/dp/B00ZG45V8Q ; https://www.etsy.com/market/we_buy_gold_sign ; https://www.walmart.com/ip/72-WE-BUY-CELL-PHONES-BANNER-SIGN-computers-games-mobile-batteries-smartphones/198208470
- Etsy junk-car flyers: https://www.etsy.com/market/flyer_for_junk_cars
- ecoATM: https://www.facebook.com/ecoATM/photos ; https://us.ecoatm.com/kiosk-security ; https://abc7chicago.com/videoClip/19642432/ ; https://kgw.com/article/news/investigations/phone-thieves-exploit-ecoatm-kiosks-quick-cash/283-386de269-6fe6-4ce3-98ba-74497665fc18
- PayMore: https://paymore.com/sell-iphone-for-cash ; https://paymore.ca/sell-iphone-for-cash/ ; https://www.facebook.com/paymorehermitage/
- Mail-in buyers: https://clark.com/make-money/sell-my-cell-phone/ ; https://www.trustpilot.com/review/gadgetgone.com ; https://uk.trustpilot.com/review/itsworthmore.com
- Local phone buyers' sites: https://www.sellelectronicsnyc.com/ ; https://www.sellmyiphonelasvegas.com/ ; https://buytech.lovable.app/
- Card shop buy rates: https://gamersguildaz.com/pages/buying-and-selling-tcg-singles-faq ; https://beckettcastletcg.com/we-buy-pokemon ; https://dickandjanes.com/blogs/blog/dick-amp-janes-is-buying-pokemon-cards-cash-paid-same-day-%F0%9F%8E%B4%F0%9F%92%B0
- Bandit signs (L): https://www.goliathdata.com/why-we-buy-houses-marketing-often-backfires-with-real-sellers ; https://biggerpockets.com/forums/93/topics/67284-bandit-sign-success-rate
- Stolen-phone cases: https://www.nbcbayarea.com/news/local/thousands-of-stolen-phones-sold-overseas-through-hayward-cell-shop-police-say/2085683/
- Secondhand dealer rules: https://law.justia.com/codes/california/2010/bpc/21625-21647.html ; https://www.codepublishing.com/CA/SanPablo/html/SanPablo05/SanPablo0528.html

Local social pages of individual buyers were read only as search-result bios
for their wording. No phone number, face or listing photo was recorded, and no
marketplace was scraped.
