# ServiceCard

A home-page card that shows one service in one glance: the words on top, a row of glass boxes in the middle, the button at the bottom.

**You provide** an `article.wk-card` with a service class (`wk-trade` or `wk-wholesale`), and inside it, in this order: an optional `.wk-badge` with the service's mark, `.wk-card__head` (eyebrow, title, one-line lede), `.wk-boxes` (five device boxes, or the lot row), `.wk-card__foot` (one `.wk-btn` and an optional `.wk-card__note`). The card sizes its type from its own width, so it works from a 320px phone column to a 600px desktop column.

**The fade.** Every card fades from light at the top to dark at the bottom (`trade-card-top` → `trade-card-mid` at 48% → `trade-card-low`). Words in the light part use `trade-card-ink`; the button row sits on the dark part and takes `trade-card-btn` and `trade-card-foot-note`. Wholesale is the same with `wholesale-card-*`.

- Do: keep the title to one short sentence and the lede to one line; a second card beside it should have the same structure, so the pair lines up.
- Do: put trade-in in green and wholesale in graphite. The general accent (`accent`) has no card; shopping uses tiles.
- Don't: put text over the dark bottom other than the button and its note, or add a second button.
