# ServiceCard

A home-page card that shows one service in one glance: the words on top, a row of glass boxes in the middle, the button at the bottom.

**You provide** an `article.wk-card` with a service class (`wk-trade` or `wk-wholesale`), and inside it, in this order: an optional `.wk-badge` with the service's mark, `.wk-card__head` (eyebrow, title, one-line lede), `.wk-boxes` (five device boxes, or the lot row), `.wk-card__foot` (one `.wk-btn` and an optional `.wk-card__note`). The card sizes its type from its own width, so it works from a 320px phone column to a 600px desktop column.

**The fade.** Every card fades from the service colour at the top to its darkest shade at the bottom: trade-in from green (`trade-card-top`) through `trade-card-mid` at 48% to dark green (`trade-card-low`), wholesale from grey to black (`wholesale-card-*`). All words on it are white; the button is mint (`trade-card-btn`) or light grey (`wholesale-card-btn`) with dark text.

- Do: keep the title to one short sentence and the lede to one line; a second card beside it should have the same structure, so the pair lines up.
- Do: put trade-in in green and wholesale in graphite. The general accent (`accent`) has no card; shopping uses tiles.
- Don't: add a second button, or a lede longer than one line.
