The kit for iPhones.LA's website: one look from the home page to checkout. Pages that browse (home, shop) sit on `bg` with service cards and shop tiles; pages that do a task (trade in, check out, build a lot) are iOS sheets on a stage that shows the service's fade. On Apple devices the type is the system's own (SF); elsewhere it falls back to Inter.

## Voice

Write like a friendly person at the counter: short sentences, "you" and "we", no exclamation marks, no emoji.

- Large titles say where the customer is in plain words: "Almost yours", "Tell us about it", "Here's your offer", "Your lot", "You're all set".
- Buttons say what happens, with the amount when there is one: "Pay $569", "Shop with $330 off", "Sell my lot for $10,200", "See my offer".
- Always say who gets what. A device the customer gets sits under **You're buying**; one they give sits under **You're selling** (with "· trade-in" in checkout). A switch says what turning it off does: "Turn this off to pay full price and keep your iPhone 15 Pro."
- Specs read storage · colour · carrier, then grade and battery: "256 GB · Cosmic Orange · Unlocked", "Grade A · Battery 100%". Macs add chip and memory: "16 GB · 512 GB SSD · Space Black", with the size kept whole ("14-inch").
- Money is whole dollars with a thousands comma: $899, $10,200. Money coming to the customer has a minus in front when it comes off a price (−$330) and is set in `credit`.
- Made-up prices, specs and order numbers carry the `wk-example` tag until they come from the inventory.

## Colour

- Three accents, one per kind of task. `accent` (blue) is the general one: shopping, links, focus. `trade` (green) is trade-in. `wholesale` (graphite) is wholesale. Wrap a page or card in `wk-trade` or `wk-wholesale` and every button, nav button and setting icon inside takes that service's colour; with neither, they take `accent`.
- Surfaces are iOS's: `bg` behind everything, `cell` for rows and tiles, `fill` for steppers, segmented controls and chips, `separator` for hairlines. Text is `label`, and `label-2` for specs, section headers and notes; both pass 4.5:1 on `bg` and `cell` in both themes.
- Money to the customer is `credit`; an old price is struck in `strike`; buying and selling dots are `buying` and `selling`, always beside the words.
- Light and Dark themes cover the sheets, rows, tiles and controls. The service fades are the same in both themes.

## The fade

Service cards and stages fade from the service colour at the top to its darkest shade at the bottom: trade-in from green (`trade-card-top`) through `trade-card-mid` at 48% to dark green (`trade-card-low`), wholesale from grey (`wholesale-card-top`) to black (`wholesale-card-low`), with a glow deepening the bottom corners.

- Every word on a card is white: `trade-card-ink` for titles and box labels, `trade-card-ink-2` for the eyebrow and lede, `trade-card-foot-note` beside the button.
- The button is mint on trade-in (`trade-card-btn`) and light grey on wholesale (`wholesale-card-btn`), with dark text; counts and a chosen box's edge use the same light colour (`trade-card-mark`).
- The badge mark is white on its glass disc.

## Surfaces and shape

- Glass: frosted boxes (`trade-card-glass`, a `trade-card-edge` border, a `trade-card-shine` top highlight) hold device photos on a card. Use five in a row, or three counts, an arrow and a result.
- Sheets: `radius-sheet` corners, a grabber, a nav bar, one large title, grouped lists (`radius-group`), one full-width button (`radius-button`). On a stage they lift with `shadow-sheet`.
- Shadows are rare: a sheet on its stage, shop tiles only on a fade (`shadow-tile`), device photos on glass. Nothing on `bg` casts a shadow.
- Radii: `radius-chip` 5, `radius-icon` 7, `radius-control` 9, `radius-thumb` 10, `radius-group` 12, `radius-button` 14, `radius-box` 16, `radius-card` 20, `radius-sheet` 22, and `radius-pill` for pills and switches.
- Spacing follows iOS: 16px row padding and page gutter (`space-4`), 12px between a photo and its text (`space-3`), 20px above a section header (`space-5`).

## Type

- `large-title` once per sheet or page, then `body` under it. Rows use `row-title` and `spec`; section headers are `spec` in capitals; totals are `total`.
- Cards use `eyebrow` (capitals, wide tracking), `card-title`, `card-lede`, `box-label`, `card-button`, `note`. Card type scales with the card's width.
- Prices use `price-offer` (in `credit`), `price-tile`, and `price-was` struck through.

## Iconography

Line icons from Lucide (ISC licence), 2px stroke, round caps, drawn inline with `stroke="currentColor"` so they take the colour around them. The recycle mark means trade-in: it sits in the trade-in card's badge, the Trade-in applied chip and the Use my trade-in row. The package means wholesale. The files under Icons are copies in `trade` and `wholesale` ink for places that can only show an `<img>`. No emoji.

## Device photos

Apple's own product renders only, exactly as published: never recoloured to fake a finish, never with a redrawn edge, an added highlight or a removed one. Every iPhone is Apple's two-up render (back and front), as are the iPad, Mac, Watch and AirPods photos, so the whole range reads as one set; name the finish the render shows ("iPhone 16 Pro · Desert Titanium"). Photos sit on the light `thumb` frame in rows, tiles and the offer panel, in both themes, never on black. On a fade they get one soft drop shadow (`trade-card-shadow`), nothing more.

## Motion

- An offer or payout counts up from $0 when it comes into view, then pops once (`data-wk-count`).
- A paid order or a sent lot opens with a success mark and one burst of confetti in `confetti-green`, `confetti-red`, `confetti-yellow` and `confetti-blue` (`data-wk-confetti`).
- Nothing else moves. Under reduced motion amounts show at once and no confetti falls.

## Components

ServiceCard, GlassBox and IconBadge make the home page. Sheet, GroupedList, Switch, Stepper, SegmentedControl, CheckList and Button make the task pages. ShopTile, OfferHero and Chips carry prices; Celebration counts offers up and throws confetti. Load `components/bundle.css` after the tokens, put `class="wk"` on the page's root, and call `LAKit.mount(document)` once (`components/bundle.js`) for the switches, steppers and single choices; each change fires a `wk:change` event for the page to recount its totals.

## Pages

HomePage, ShopPage, then the trade-in flow (TradeInPickPage for the series, TradeInModelPage for the model, TradeInConditionPage, TradeInOfferPage, CheckoutPage, OrderPlacedPage) and the wholesale flow (LotPage, AddDevicesPage, LotSentPage), each built only from the components above at phone width.

## Intentional additions

The approved screens had no segmented control, single-choice list or offer panel; SegmentedControl, CheckList and OfferHero were added for the trade-in pages that pick a model, describe its condition and show the offer. Celebration was added at the owner's request, for the count-up on offers and the confetti on finished orders.

## Not in the kit

There is no logo file; the name is set in type as `iPhones.LA`. The flows' steps (meet-ups in Long Beach, messaging) follow the shop's ads; check them against how the shop really works before they go live.
