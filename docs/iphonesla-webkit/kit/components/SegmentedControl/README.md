# SegmentedControl

An iOS segmented control for a short, flat choice: a device category, a storage size.

**You provide** `div.wk-seg` with `data-wk-single`, a `role="group"` and `aria-label`, holding two to five `button`s with `aria-pressed`. `LAKit.mount()` keeps one chosen and fires `wk:change` with its text.

Intentional addition: the source screens had no segmented control; the trade-in pages need one for category and storage.
