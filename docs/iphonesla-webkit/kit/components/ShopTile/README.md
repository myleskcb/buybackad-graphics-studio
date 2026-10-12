# ShopTile

A device for sale: photo, name, two spec lines, the price, and what a trade-in takes off.

**You provide** `.wk-tile` inside `.wk-shelf` (columns of at least 150px): `.wk-tile__pic` (the photo on its light `thumb` frame, in both themes), `.wk-tile__name`, two `.wk-tile__spec` lines, `.wk-price` (`b` the price; with a trade-in, `s` the old price struck in `strike`), and with a trade-in a `.wk-save` pill.

- With a trade-in applied, show the price after the credit and strike the full price; without one, show the price alone (right-hand tile).
- Fill whole rows: 2 or 4 tiles on a phone.
- Tiles on `bg` have no shadow; only on a service fade do they take `shadow-tile`.
