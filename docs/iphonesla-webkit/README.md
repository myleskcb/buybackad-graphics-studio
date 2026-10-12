# iPhones.LA Web Kit

The look the owner approved on 2026-10-12 ("This theme looks extremely good ... use that as our general Web kit"), made into one kit for every page of the iPhones.LA site: service cards with clear glass boxes on a fade (green to dark green for trade-in, grey to black for wholesale), and iOS sheets for the tasks (trade in, check out, build a lot).

The live kit, with every component and page rendered, is the Design System artifact https://claude.ai/artifact/5nnwXW7ADFsFynBMKTUBsC (private to the owner until shared). This folder is its source, for the site's repo:

| file | what |
|---|---|
| `webkit.css` | drop-in: every token (light, and dark under `prefers-color-scheme`) and every component style |
| `webkit.js` | `LAKit.mount(document)`: switches, steppers, single choices; each change fires `wk:change` |
| `kit/README.md` | the rules: voice, colour, the fade, shapes, type, icons, photos |
| `kit/tokens.json` | the tokens as data (62 colours, 17 type styles, spacing, radii, shadows) |
| `kit/components/<Name>/` | each component's guide and preview: ServiceCard, GlassBox, IconBadge, Button, Sheet, GroupedList, Switch, Stepper, SegmentedControl, CheckList, Chips, ShopTile, OfferHero |
| `kit/components/<Name>Page/` | the pages built from them at phone width: Home, Shop, the trade-in flow (pick, condition, offer, checkout, order placed) and the wholesale flow (lot, add devices, lot sent) |
| `kit/assets/` | the device photos and the recycle and box icons |

The previews load photos from the artifact's store (`/_blob/<id>`); the same photos sit in `kit/assets/Devices/` under their own names. Prices, specs and the order number in the pages are examples, and the flows' steps (meet-ups in Long Beach, messaging) follow the shop's ads: check them against how the shop works before they go live.

The mockups that led here, and every earlier option, are in `../iphonesla-cards/`.
