# Button

Three buttons: the card's pill, the sheet's full-width block, and a plain text button for the quieter choice.

- `.wk-btn` (pill) lives only in a card's bottom row: `trade-card-btn` / `wholesale-card-btn` with dark text. One per card, with an arrow.
- `.wk-btn-block` ends a sheet: full width, `radius-button`, 17px semibold. It takes the service's colour from the nearest `wk-trade` / `wk-wholesale`, else `accent`. Its words say what happens and, with money, how much: "Pay $569", "Sell my lot for $10,200".
- `.wk-btn-plain` sits under a block button for the other way out ("Start over", "Back to the shop").
- Don't put two block buttons in one sheet.
