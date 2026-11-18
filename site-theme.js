/* The information pages, the category pages and the video maker in the house look (DESIGN-LAW 146).
   Light or dark: the visitor's own choice where they made one (the landing's toggle saves it as
   pgfx_theme), else their system's, which pages.css reads by itself. ?pair= and ?face= show a page
   in another of the twelve pairs or the owner's type pairs, for that view only, as on the landing.
   Loaded in the head and small, so the first paint is already in the right colours. */
(function () {
  var d = document.documentElement, q;
  try { var t = localStorage.getItem('pgfx_theme'); if (t === 'light' || t === 'dark') d.setAttribute('data-theme', t); } catch (e) {}
  try { q = new URLSearchParams(location.search); } catch (e) { return; }
  var P = ['navy_gold', 'navy_orange', 'midnight_cyan', 'blue_green', 'green_gold', 'purple_gold', 'teal_orange', 'red_yellow', 'black_gold', 'black_red', 'black_green'];
  var F = ['house', 'street', 'sport', 'block', 'tech', 'stadium', 'modern', 'grotesk', 'luxe'];
  if (P.indexOf(q.get('pair')) >= 0) d.setAttribute('data-pair', q.get('pair'));
  if (F.indexOf(q.get('face')) >= 0) d.setAttribute('data-face', q.get('face'));
  var th = q.get('theme'); if (th === 'light' || th === 'dark') d.setAttribute('data-theme', th);
})();
