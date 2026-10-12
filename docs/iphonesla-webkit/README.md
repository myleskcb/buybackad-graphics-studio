# iPhones.LA Web Kit

The look the owner approved in October 2026, made into one kit for every page of the iPhones.LA site: service cards with clear glass boxes on a fade (green to dark green for trade-in, grey to black for wholesale), iOS sheets for the tasks (trade in, check out, build a lot), Apple's own renders for every device, offers that count up and confetti on paid orders.

The live kit, with every component and page rendered, is the Design System artifact https://claude.ai/artifact/5nnwXW7ADFsFynBMKTUBsC (private to the owner until shared). This folder is everything the site needs.

| file | what |
|---|---|
| `webkit.css` | every token (light, and dark under `prefers-color-scheme`) and every component style |
| `webkit.js` | `LAKit.mount(document)`: switches, steppers, single choices, count-up offers, confetti; `LAKit.countUp(el)`, `LAKit.confetti(el)` |
| `pages/` | the site's pages as plain HTML on the two files above: `index.html` lists them. Home, shop, trade-in (series, model, condition, offer, checkout, order placed), wholesale (lot, add devices, lot sent) |
| `kit/README.md` | the rules: voice, colour, the fade, shapes, type, icons, photos, motion |
| `kit/tokens.json` | the tokens as data (66 colours, 17 type styles, spacing, radii, shadows) |
| `kit/components/<Name>/` | each component's guide and preview |
| `kit/assets/` | Apple's device renders (resized only) and the recycle and box icons |

## Putting it on the site

1. Copy `webkit.css`, `webkit.js` and `kit/assets/` into the site's static files.
2. Load both on every page, put `class="wk"` on the page's root element, and call `LAKit.mount(document)` once after the page renders (again after a client-side route change).
3. Rebuild each page from its file in `pages/`: the markup is the template. Swap the example prices, specs, models and order number for the inventory's, keep the photos on their light frames, and keep `data-wk-count` on offers and payouts and `data-wk-confetti` on the paid and sent screens.
4. Wire the buttons to the site's real routes: Start a trade-in → series page; a series → its models; a model → condition; See my offer → offer; Shop with $330 off → shop with the trade-in applied; Pay → checkout, then order placed. Build a lot → lot; Add devices → add devices; Sell my lot → lot sent.

The flows' steps (meet-ups in Long Beach, messaging) follow the shop's ads: check them against how the shop works before they go live. The mockups that led here, and every earlier option, are in `../iphonesla-cards/`.
