# CheckList

A grouped list where one row is chosen, marked with a check in the service colour: carrier, condition.

**You provide** `.wk-group` with `role="radiogroup"` and an `aria-label`, holding `.wk-row.wk-row--check` rows with `role="radio"`, `aria-checked`, `tabindex` (0 on the chosen row, -1 on the rest) and `data-value`, each ending in `span.wk-check`. A row can carry one line of explanation. `LAKit.mount()` handles click, Space and Enter.

Intentional addition: the trade-in condition page needs single choices longer than a segmented control holds.
