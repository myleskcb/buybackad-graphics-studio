# Celebration

The moments worth a little joy: an offer or payout that counts up from $0, and confetti with a success mark when an order is paid or a lot is sent.

**You provide** `data-wk-count="330"` on an amount (write the final amount as its text too, so it reads right with no script), and `.wk-success` with `data-wk-confetti` at the top of a paid or sent sheet. `LAKit.mount()` starts each once, as it comes into view; `LAKit.countUp(el)` and `LAKit.confetti(el)` play them on demand (checkout's Pay throws confetti from the button).

- Count every offer and payout up (about 0.8s for $330, 1.2s for $10,200, then a small pop). Never count a price the customer pays.
- Confetti only for a paid order or a sent lot, once, in the four confetti colours: `confetti-green`, `confetti-red`, `confetti-yellow`, `confetti-blue`.
- Under reduced motion the amount shows at once, the mark appears without the pop, and no confetti falls.

Intentional addition, asked for by the owner to give offers and finished orders some emotion.
