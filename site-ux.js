'use strict';
/* ═══════════════════════════════════════════════════════
   Site UX helpers. One additive file, loaded after app.js; nothing in app.js
   is edited for it and it only uses what the page already exposes in the DOM.

   1. ?cat=<category> opens the landing gallery on that category. The category
      pages under ads/ link here ("See every gold design"), and before this the
      gallery could not be reached filtered from a URL at all. It clicks the
      same chip a visitor would, so the filter, counts and paging are the
      gallery's own. Unknown values are ignored.
   2. Escape closes the dialog on top. Every .modal-overlay already closes on a
      click on its backdrop (app.js binds that for all of them); Escape sends
      that same click, so it can only do what clicking outside already does.
   ═══════════════════════════════════════════════════════ */
(() => {
  const CATS = ['phones', 'gold', 'silver', 'coins', 'cars', 'strips', 'pokemon', 'sports', 'classics'];

  let cat = '';
  try { cat = new URLSearchParams(location.search).get('cat') || ''; } catch (e) {}
  if (CATS.indexOf(cat) >= 0) {
    let tries = 0;
    const tick = () => {
      const chip = document.querySelector('#lp-chips .chip[data-cat="' + cat + '"]');
      if (chip) {
        chip.click();
        const sec = document.getElementById('lp-templates');
        if (sec) sec.scrollIntoView({ block: 'start' });
        return;
      }
      if (++tries < 60) setTimeout(tick, 250);   // the gallery builds after fonts and the index load
    };
    tick();
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    const open = [...document.querySelectorAll('.modal-overlay.show')];
    if (!open.length) return;
    const top = open.reduce((a, b) => (+getComputedStyle(b).zIndex || 0) >= (+getComputedStyle(a).zIndex || 0) ? b : a);
    top.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
})();
