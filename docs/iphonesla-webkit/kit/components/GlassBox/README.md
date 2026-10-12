# GlassBox

A frosted box holding one device photo and its name, on a service card's fade.

**You provide** a `.wk-box` inside `.wk-boxes` (`--5` for five equal boxes, `--lot` for three counts, an arrow and a result). A box the customer picks is a `button` with `aria-pressed`; put `data-wk-single` on the row so one stays chosen. A count is `.wk-box__count` (×24) in the corner; the end of the lot row is `.wk-box--result` with `.wk-box__tick`.

- Glass is `trade-card-glass` (white at 12%) with a `trade-card-edge` border and a `trade-card-shine` top highlight; labels are white. A chosen box takes `trade-card-select` and a mint `trade-card-mark` edge; counts are mint with dark text.
- Use real cut-out photos on transparent ground (Devices). Never a drawn or AI device.
- Don't put more than five boxes in a row.
