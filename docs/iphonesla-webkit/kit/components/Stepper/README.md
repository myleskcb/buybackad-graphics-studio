# Stepper

The iOS − / + stepper for how many of a device are in a lot.

**You provide** a `.wk-row` with `data-qty` (and `data-unit` for a price), holding `.wk-stepper` with two buttons, `data-step="-1"` and `data-step="1"`, each with an `aria-label` that names the device ("One more iPhone 16 Pro"). `LAKit.mount()` keeps `data-qty` between 0 and 999 and fires `wk:change`; the page recounts its totals and button on that event. In a sheet under 380px wide, the line total and stepper drop under the device's specs.
