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

Service cards and stages fade from light at the top to dark at the bottom: `trade-card-top` (pale mint) → `trade-card-mid` at 48% → `trade-card-low` (deep green), with `trade-card-glow` deepening the bottom corners. Wholesale is the same in greys: `wholesale-card-top` → `wholesale-card-mid` → `wholesale-card-low`.

- Words in the light part (eyebrow, title, lede, box labels) use `trade-card-ink` and `trade-card-ink-2`.
- The bottom row sits on the dark part: the pill button in `trade-card-btn` with `trade-card-on-btn` text, and its note in `trade-card-foot-note`.
- Marks in the light part (the badge icon, a box's count, a chosen box's edge) use `trade-card-mark`.
- Nothing else goes on the dark part.

## Surfaces and shape

- Glass: frosted boxes (`trade-card-glass`, a `trade-card-edge` border, a `trade-card-shine` top highlight) hold device photos on a card. Use five in a row, or three counts, an arrow and a result.
- Sheets: `radius-sheet` corners, a grabber, a nav bar, one large title, grouped lists (`radius-group`), one full-width button (`radius-button`). On a stage they lift with `shadow-sheet`.
- Radii: `radius-chip` 5, `radius-icon` 7, `radius-control` 9, `radius-thumb` 10, `radius-group` 12, `radius-button` 14, `radius-box` 16, `radius-card` 20, `radius-sheet` 22, and `radius-pill` for pills and switches.
- Spacing follows iOS: 16px row padding and page gutter (`space-4`), 12px between a photo and its text (`space-3`), 20px above a section header (`space-5`).

## Type

- `large-title` once per sheet or page, then `body` under it. Rows use `row-title` and `spec`; section headers are `spec` in capitals; totals are `total`.
- Cards use `eyebrow` (capitals, wide tracking), `card-title`, `card-lede`, `box-label`, `card-button`, `note`. Card type scales with the card's width.
- Prices use `price-offer` (in `credit`), `price-tile`, and `price-was` struck through.

## Iconography

Line icons from Lucide (ISC licence), 2px stroke, round caps, drawn inline with `stroke="currentColor"` so they take the colour around them. The recycle mark means trade-in: it sits in the trade-in card's badge, the Trade-in applied chip and the Use my trade-in row. The package means wholesale. The files under Icons are copies in `trade` and `wholesale` ink for places that can only show an `<img>`. No emoji.

## Device photos

Real cut-out photos only (Devices): transparent WebP of the shop's own devices, never drawn or generated. On a fade they get a soft drop shadow (`trade-card-shadow`); in rows they sit in a `thumb` frame. Show the colour that is for sale or being sold, and never use one model's photo for another.

## Components

ServiceCard, GlassBox and IconBadge make the home page. Sheet, GroupedList, Switch, Stepper, SegmentedControl, CheckList and Button make the task pages. ShopTile, OfferHero and Chips carry prices. Load `components/bundle.css` after the tokens, put `class="wk"` on the page's root, and call `LAKit.mount(document)` once (`components/bundle.js`) for the switches, steppers and single choices; each change fires a `wk:change` event for the page to recount its totals.

## Pages

HomePage, ShopPage, then the trade-in flow (TradeInPickPage, TradeInConditionPage, TradeInOfferPage, CheckoutPage, OrderPlacedPage) and the wholesale flow (LotPage, AddDevicesPage, LotSentPage), each built only from the components above at phone width.

## Intentional additions

The approved screens had no segmented control, single-choice list or offer panel; SegmentedControl, CheckList and OfferHero were added for the trade-in pages that pick a model, describe its condition and show the offer.

## Not in the kit

There is no logo file; the name is set in type as `iPhones.LA`. The flows' steps (meet-ups in Long Beach, messaging) follow the shop's ads; check them against how the shop really works before they go live.
