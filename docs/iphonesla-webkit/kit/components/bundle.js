/* iPhones.LA Web Kit: the little behaviour the components need. One classic
   script, no dependencies. LAKit.mount(root) wires everything under root:
   [data-wk-single] groups of aria-pressed buttons (one at a time),
   role=radiogroup check lists, and rows with data-qty and a stepper.
   Each fires a bubbling "wk:change" event a page listens to for its totals. */
window.LAKit = (function () {
  function usd(n) { return '$' + Number(n).toLocaleString('en-US'); }
  function fire(el, detail) { el.dispatchEvent(new CustomEvent('wk:change', { bubbles: true, detail: detail || {} })); }
  function single(group) {
    group.addEventListener('click', function (e) {
      var b = e.target.closest('[aria-pressed]');
      if (!b || !group.contains(b)) return;
      group.querySelectorAll('[aria-pressed]').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
      fire(group, { value: b.getAttribute('data-value') || b.textContent.trim() });
    });
  }
  function radios(group) {
    function pick(r) {
      group.querySelectorAll('[role="radio"]').forEach(function (o) { o.setAttribute('aria-checked', o === r ? 'true' : 'false'); o.tabIndex = o === r ? 0 : -1; });
      fire(group, { value: r.getAttribute('data-value') });
    }
    group.addEventListener('click', function (e) { var r = e.target.closest('[role="radio"]'); if (r) pick(r); });
    group.addEventListener('keydown', function (e) {
      var r = e.target.closest('[role="radio"]');
      if (r && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); pick(r); }
    });
  }
  function stepper(row) {
    var out = row.querySelector('[data-qty-out]');
    function set(q) { row.setAttribute('data-qty', String(Math.max(0, Math.min(999, q)))); if (out) out.textContent = row.getAttribute('data-qty'); fire(row); }
    var dec = row.querySelector('[data-step="-1"]'), inc = row.querySelector('[data-step="1"]');
    if (dec) dec.addEventListener('click', function () { set(+row.getAttribute('data-qty') - 1); });
    if (inc) inc.addEventListener('click', function () { set(+row.getAttribute('data-qty') + 1); });
  }
  function mount(root) {
    root = root || document;
    root.querySelectorAll('[data-wk-single]').forEach(single);
    root.querySelectorAll('[role="radiogroup"]').forEach(radios);
    root.querySelectorAll('.wk-row[data-qty]').forEach(stepper);
  }
  return { mount: mount, usd: usd };
})();
